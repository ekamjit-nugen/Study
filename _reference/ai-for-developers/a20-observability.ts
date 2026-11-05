import type { StoryPage, Topic } from "../types";

// AI 3.8: tracing and feedback: debugging a bad answer.

const SETTING = "The same online furniture shop. The Help page chat box retrieves help-centre chunks, calls the model, sometimes calls order tools, and streams the answer (lessons 2.5, 3.1, 3.6). The server logs one line per request: the path, the status code and the time taken. Prompts change twice a week; the model version was bumped last month. About two thousand conversations a day.";
const CAST = "**Nisha** (support lead) brings the complaint. **Dev** (developer) has to find out what happened. **Priya** (product manager) wants to know how often it happens. **Kabir** (owner) wants the cost per conversation.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A customer says Thursday's answer was wrong. Dev cannot find which chunks were retrieved, which prompt version ran, what the model was sent or what it replied. The log line says '200 OK, 2.3s'. The answer cannot be reproduced because sampling varies and the prompt changed on Friday.",
    title: "'It said something wrong on Thursday'",
    text: "Nisha forwards an email: 'Your chat told me on Thursday that assembly was included with the oak table. The delivery driver said it isn't.' Dev opens the logs. For Thursday there are two thousand lines like `POST /api/chat 200 2.31s`. No conversation id, no prompt, no retrieved chunks, no model reply. Dev asks the same question today and gets a correct answer, because Priya changed the prompt on Friday and because the model would not say the same thing twice anyway (lesson 1.4).\n\nPriya asks how many customers were told this. No way to know. Kabir asks what a conversation costs now that retrieval and tools were added. The provider's invoice says the month's total; nobody can split it by feature.\n\n**This is the problem.** A model-backed feature cannot be debugged from a status code. Every answer depends on the exact prompt, the retrieved sources, the tool results, the model version and a dice roll, and none of that is recorded. Without a record there is no debugging, no counting and no cost breakdown.",
  },
  {
    stage: "why",
    point: "Ordinary logs record that a request happened. A model answer is produced by a chain of inputs that cannot be re-created later, so the inputs and outputs of every step must be captured at the time, tied together by one id the customer can quote.",
    title: "Why 200 OK tells you nothing",
    text: "A normal endpoint is deterministic enough that a status code and the input are usually sufficient; run it again and you get the same result. A chat answer is the end of a chain: the customer's messages, the stored summary and facts (lesson 3.4), the chunks retrieval chose (lesson 3.6), the tool results (lesson 3.1), the prompt version, the model version, the sampling settings, and finally a sampled reply. Change any link and the answer changes; re-running today proves nothing about Thursday.\n\nSo the chain has to be written down as it happens: each step's inputs and outputs, how long it took, what it cost, under one id for the whole request. That record is a **trace**. Give the id to the customer at the bottom of the chat ('ref: 7f3a'), and Nisha's complaint arrives with the key to the exact record.\n\nAnd once every request is traced, counting becomes a query: how many Thursday answers cited the assembly article, how many conversations ended with a thumbs-down, what a conversation costs by feature.",
  },
  {
    stage: "concept",
    point: "A trace is one request's record: a tree of spans for retrieval, tool calls and model calls, each with inputs, outputs, timing, tokens, cost and versions. Feedback attaches to the trace id. Dashboards are queries over traces.",
    title: "Traces, spans, feedback, dashboards",
    text: "A **trace** has an id and covers one request from the moment the message arrives to the last streamed token. Inside it, **spans** record each step: `retrieve` (query, filters, chunk ids and scores), `rerank`, `model` (the full system prompt and messages sent, the reply, stop reason, input and output tokens, cached tokens, model id, prompt version, temperature, time to first token, total time), each `tool` call (name, arguments, result, duration, error). Spans nest: a tool call inside the agent loop inside the request.\n\n**Feedback** is a thumbs up or down, an optional comment, and later signals like 'the customer escalated to a person within five minutes', all stored against the trace id. **Cost** is computed per model span from tokens and the price table, and summed per trace, per feature, per day.\n\n**Dashboards** are queries over this: p50 and p95 latency, time to first token, cost per conversation by feature, error and timeout rates, decline rate, thumbs-down rate, the top questions with bad feedback, token usage by prompt version. **Alerts** fire on step changes: cost per conversation doubles, thumbs-down rate rises after a deploy, time to first token crosses two seconds.",
    jargon: [["span", "one timed step inside a trace, with its inputs and outputs; spans nest to form a tree"], ["time to first token", "how long the customer waited before the first word appeared; what streaming (lesson 2.5) is measured by"], ["prompt version", "an identifier for the exact system prompt text in use, so a trace can say which wording produced the answer"]],
    table: {
      head: ["Span", "Records", "Used to answer"],
      rows: [
        ["request", "trace id, customer (hashed), conversation id, feature, started, finished", "what happened for ref 7f3a?"],
        ["retrieve / rerank", "query, filters, chunk ids, scores, duration", "did the assembly article get retrieved, and why?"],
        ["model", "prompt version, model id, full input, output, stop reason, tokens, cache hits, TTFT, duration, cost", "what exactly was the model told and what did it say?"],
        ["tool", "name, arguments, result or error, duration", "did lookup_order run, and what came back?"],
        ["feedback", "thumbs, comment, escalation, time", "which answers do customers reject?"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Tracing is a thin wrapper: start a trace per request, wrap each step in a span that records inputs and outputs, and write the tree to storage when the request ends. The model call wrapper does most of the work.",
    title: "Wrapping the steps",
    text: "Dev writes a small tracing helper rather than adopting a platform on day one: a trace object per request, a `span()` function that times a step and records what it was given and what it returned, and a wrapper around the model client that fills in tokens, cost and versions. Existing observability tools (OpenTelemetry and the hosted LLM tracing products) can replace the storage later; the spans stay the same.",
    codes: [
      {
        title: "trace.ts: traces and spans",
        lang: "ts",
        src: `export type Span = { name: string; startedAt: number; ms?: number; input?: unknown; output?: unknown; error?: string; meta?: Record<string, unknown>; children: Span[] };

export class Trace {
  readonly id = randomId(8);
  readonly root: Span;
  private stack: Span[];
  constructor(public meta: { feature: string; conversationId: string; customerHash: string }) {
    this.root = { name: "request", startedAt: Date.now(), children: [] };
    this.stack = [this.root];
  }
  async span<T>(name: string, input: unknown, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T> {
    const s: Span = { name, startedAt: Date.now(), input: redact(input), meta, children: [] };
    this.stack[this.stack.length - 1].children.push(s);
    this.stack.push(s);
    try {
      const out = await fn();
      s.output = redact(out);
      return out;
    } catch (e) {
      s.error = String(e);
      throw e;
    } finally {
      s.ms = Date.now() - s.startedAt;
      this.stack.pop();
    }
  }
  async end() {
    this.root.ms = Date.now() - this.root.startedAt;
    await traceStore.write({ id: this.id, ...this.meta, root: this.root, cost: sumCost(this.root) });
  }
}`,
        lines: [
          { sql: "readonly id = randomId(8);", say: "Eight characters, shown to the customer as 'ref: 7f3a…'. Short enough to type into an email." },
          { sql: "constructor(public meta: { feature: string; conversationId: string; customerHash: string }) {", say: "Which feature, which conversation, which customer (hashed, so a trace alone does not identify a person)." },
          { sql: "const s: Span = { name, startedAt: Date.now(), input: redact(input), meta, children: [] };", say: "Inputs are recorded through a redaction step: emails, card numbers and phone numbers are masked before storage." },
          { sql: "this.stack[this.stack.length - 1].children.push(s);", say: "Spans nest. A tool call made inside the model loop appears under it." },
          { sql: "s.error = String(e);", say: "Failures are recorded too. A trace that ends in a timeout is often the most useful one." },
          { sql: "await traceStore.write({ id: this.id, ...this.meta, root: this.root, cost: sumCost(this.root) });", say: "One write per request at the end, with the total cost summed from the model spans." },
        ],
        note: "traceStore is a Postgres table with a JSONB column at first. It moves to a dedicated tracing backend when volume demands.",
      },
      {
        title: "Using it in the chat handler",
        lang: "ts",
        src: `const trace = new Trace({ feature: "help-chat", conversationId: conv.id, customerHash: hash(customerId) });
try {
  const sources = await trace.span("retrieve", { question, audience }, () => searchChunks(question, { audience, limit: 20 }));
  const ranked = await trace.span("rerank", { n: sources.length }, () => rerank(question, sources));
  const reply = await trace.span("model", null, () => tracedCreate(trace, {
    model: process.env.MODEL_SUPPORT!,
    system: SYSTEM_PROMPT,
    messages: buildMessages(conv, ranked),
    max_tokens: 500,
  }), { promptVersion: PROMPT_VERSION });
  res.setHeader("X-Trace-Id", trace.id);
  stream(reply, res);
} finally {
  await trace.end();
}`,
        lines: [
          { sql: "const sources = await trace.span(\"retrieve\", { question, audience }, () => searchChunks(question, { audience, limit: 20 }));", say: "The retrieval step records the question, the filter and, as output, the chunk ids and scores. Thursday's assembly article is findable." },
          { sql: "const reply = await trace.span(\"model\", null, () => tracedCreate(trace, {", say: "tracedCreate wraps the SDK call and fills in model id, tokens, cache hits, stop reason, time to first token and cost." },
          { sql: "}), { promptVersion: PROMPT_VERSION });", say: "The prompt version is a constant bumped with every edit, so a trace names the wording that produced the answer." },
          { sql: "res.setHeader(\"X-Trace-Id\", trace.id);", say: "The page shows it as 'ref: …' under the answer, next to the thumbs buttons." },
          { sql: "await trace.end();", say: "Written even on error, in the finally block." },
        ],
      },
    ],
  },
  {
    stage: "implement",
    point: "Feedback is a tiny endpoint keyed by trace id. Combined with traces it answers 'which answers are bad', feeds the eval suite, and shows whether a deploy helped.",
    title: "Closing the loop with feedback",
    text: "Under every answer the page shows thumbs up and down and the ref. A thumbs-down opens a one-line comment box. The endpoint stores the signal against the trace id. The server also records implicit signals: the customer asked to talk to a person within five minutes, or re-asked the same question. Each Monday Nisha's view is 'traces with negative feedback this week, grouped by retrieved article', and each one she confirms becomes an eval case (lesson 3.7) with one click that copies the question and the forbidden phrase.",
    codes: [
      {
        title: "feedback endpoint and the Monday query",
        lang: "ts",
        src: `app.post("/api/feedback", requireCustomer, async (req, res) => {
  const { traceId, rating, comment } = Feedback.parse(req.body);   // rating: "up" | "down"
  const t = await traceStore.get(traceId);
  if (!t || t.customerHash !== hash(req.customer.id)) return res.status(404).end();
  await feedbackStore.write({ traceId, rating, comment: comment?.slice(0, 500), at: new Date() });
  res.status(204).end();
});

// Monday: bad answers grouped by the article they cited
const badByArticle = await db.$queryRaw\`
  SELECT s.article_id, count(*) AS downs, array_agg(f.trace_id) AS examples
  FROM feedback f
  JOIN trace_sources s ON s.trace_id = f.trace_id
  WHERE f.rating = 'down' AND f.at > now() - interval '7 days'
  GROUP BY s.article_id ORDER BY downs DESC LIMIT 20\`;`,
        lines: [
          { sql: "if (!t || t.customerHash !== hash(req.customer.id)) return res.status(404).end();", say: "Only the customer who had the conversation can rate it. A trace id is not a secret, so this check matters." },
          { sql: "await feedbackStore.write({ traceId, rating, comment: comment?.slice(0, 500), at: new Date() });", say: "Keyed by trace id; the full chain behind the rating is one lookup away." },
          { sql: "JOIN trace_sources s ON s.trace_id = f.trace_id", say: "A small table extracted from the retrieve span at write time: which chunks each trace used. It turns 'bad answers' into 'bad articles'." },
          { sql: "GROUP BY s.article_id ORDER BY downs DESC LIMIT 20`;", say: "The Monday list. The assembly article is at the top, with example refs to open." },
        ],
        note: "The same tables feed the dashboard: thumbs-down rate by prompt version shows whether Friday's edit helped.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Traces contain customer text, so they are personal data: redact at write time, restrict who can read them, keep them for a fixed period, sample full prompts once volume is high, and never log secrets.",
    title: "What may be recorded, and for how long",
    text: "A trace with the full prompt holds whatever the customer typed, including the address they pasted. Dev's rules, checked with Kabir.\n\nRedaction happens before storage: emails, phone numbers, card-like digit runs and postcodes are masked in inputs and outputs; the customer is stored as a hash. Reading traces needs the support or engineering role, and every read is itself logged. Full prompts and replies are kept for thirty days, then the span bodies are deleted and only the metadata (timings, tokens, cost, versions, feedback) stays for a year of dashboards. Once volume grows, full bodies are kept for a 10% sample plus every trace with negative feedback, an error, or a tool write.\n\nNever in a trace: API keys, session tokens, the raw customer id. And the trace store is covered by the same deletion flow as the rest of the customer's data (lesson 3.4).",
    table: {
      head: ["Data", "Rule"],
      rows: [
        ["prompt and reply bodies", "redacted at write; 30-day retention; sampled at scale, bad/erroring traces always kept"],
        ["customer identity", "hashed; joinable only through the account service"],
        ["timings, tokens, cost, versions, feedback", "kept a year for trends"],
        ["secrets", "never; the redactor also strips anything that looks like a key"],
        ["access", "role-restricted; reads are logged"],
      ],
    },
    ask: "Kabir asks for the cost per conversation of the help chat versus the email tagger for October. Which spans and fields answer it, and what one number would you show first?",
  },
  {
    stage: "compare",
    point: "A status-code log cannot answer any question about a model answer. A trace per request with spans, versions, cost and feedback answers 'what happened', 'how often' and 'what did it cost', and feeds the evals.",
    title: "Request logs, or traces with feedback",
    text: "Both record that requests happened. Only one records why an answer came out the way it did.",
    versus: {
      beginner: {
        title: "One log line per request",
        lang: "ts",
        code: "console.log(req.method, req.path, res.statusCode, ms + \"ms\");\n// POST /api/chat 200 2310ms",
        points: ["Already there.", "Cannot find Thursday's answer, its prompt, its sources or the model's reply.", "Cannot count how many customers were affected.", "Cost is one invoice total."],
      },
      engineer: {
        title: "Trace per request, spans per step, feedback by id",
        lang: "ts",
        code: "trace.span(\"retrieve\", …) → chunk ids, scores\ntrace.span(\"model\", …)    → prompt v14, model id, tokens, TTFT, cost\nX-Trace-Id: 7f3a…         → thumbs + comment\nSELECT … GROUP BY article_id, prompt_version",
        points: ["Ref 7f3a opens the exact chain that produced the answer.", "'How many' and 'since when' are queries.", "Cost per conversation per feature per day.", "Bad answers become eval cases with their forbidden phrase."],
      },
      tradeoffs: ["Traces hold customer text: redaction, access control and retention are mandatory, not optional.", "Storage grows fast; sample full bodies once volume is high, keep metadata always.", "A home-made store is fine to start; adopt a tracing backend before building dashboards by hand."],
      when: "From the first production deploy of any model feature. Debugging without traces is guessing.",
    },
  },
  {
    stage: "recap",
    point: "Trace every request: spans for retrieval, tools and model calls with inputs, outputs, versions, tokens, latency and cost; a ref the customer can quote; feedback by trace id; redaction, access rules and retention; dashboards and alerts as queries.",
    title: "Connect it back: ref 7f3a",
    text: "The next complaint arrives with 'ref: 7f3a'. Dev opens the trace: prompt version 14, the assembly chunk retrieved from an outdated article, the model's reply quoting it faithfully. The fix is the article, not the model; the article is corrected, re-indexed, and the question becomes an eval case. Priya sees 41 traces cited that chunk that week. Kabir sees cost per conversation by feature on a chart, and the alert on thumbs-down rate by prompt version will catch the next Friday edit.",
    recap: {
      remember: ["A model answer is a chain; record the chain as it happens, under one id.", "Spans: retrieve, rerank, tool, model; with inputs, outputs, versions, tokens, TTFT, duration, cost.", "Show the trace id to the customer; attach feedback to it.", "Redact at write, restrict reads, set retention, sample at scale, never log secrets.", "Dashboards and alerts are queries over traces; bad traces become eval cases."],
      mistakes: ["Logging status codes and calling it observability.", "Storing raw prompts with personal data forever.", "No prompt version in the trace, so edits cannot be blamed or credited.", "Feedback stored without the trace id."],
      production: ["Every serious LLM product has tracing with feedback; hosted tools exist, and OpenTelemetry has conventions for model spans.", "Lesson 3.9 uses the token and cache fields here to cut cost and latency.", "Lesson 4.3 sets the privacy rules this lesson applied to traces."],
      next: ["3.9 Cost and latency: caching, batching, routing.", "3.10 Reliability: retries, rate limits, timeouts, fallbacks.", "4.3 Privacy and PII: what may be stored and sent."],
    },
    ask: "The dashboard now shows the number Kabir asked for: a help-chat conversation costs four times what it did before retrieval and tools, and the p95 wait is six seconds. Next lesson.",
  },
];

export const A20: Topic = {
  slug: "observability",
  title: "Tracing and feedback: debugging a bad answer",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain why a model answer cannot be debugged from request logs or reproduced later.", "Design traces and spans that capture retrieval, tool calls and model calls with versions, tokens, latency and cost.", "Attach customer feedback to trace ids and turn bad traces into eval cases and dashboards.", "Apply redaction, access control, retention and sampling to traces that contain customer text."],
  prerequisites: ["streaming", "rag", "evals"],
  story: "A flight recorder. After an incident nobody tries to fly the same flight again and hope it goes the same way; they open the recorder and read every input and every decision in order. The ref under the answer is the tail number.",
  tldr: [
    "A model answer is a **chain** (prompt, sources, tools, versions, a dice roll); record the chain **as it happens** under one **trace id**.",
    "**Spans** per step with inputs, outputs, **prompt and model versions**, tokens, **time to first token**, duration, **cost**.",
    "Show the **ref** to the customer; store **feedback** by trace id; dashboards and alerts are **queries over traces**.",
    "Traces hold personal data: **redact**, **restrict**, **retain for a fixed period**, **sample** at scale, **never log secrets**.",
  ],
  words: [
    ["trace", "the full record of one request, identified by an id"],
    ["span", "one timed step inside a trace, with inputs and outputs, nested in a tree"],
    ["time to first token", "the wait before the first streamed token; the latency customers feel"],
    ["prompt version", "an identifier for the exact system prompt text in use"],
    ["feedback", "a rating or signal stored against a trace id"],
    ["redaction", "masking personal data before it is stored"],
  ],
  sections: [],
  quiz: [
    { q: "Why can't Dev reproduce Thursday's wrong answer by asking the same question today?", options: ["The server was restarted", "The prompt changed, the retrieved chunks may differ, and sampling varies; only a record made at the time shows what happened", "The customer lied", "The model forgot"], answer: 1, reason: true, whyOptions: ["Restarts are irrelevant.", "Correct. A model answer is a chain of inputs plus a dice roll; it must be recorded, not re-run.", "No.", "Models do not remember; that is why nothing can be asked of them later."], why: "Record the chain at the time." },
    { q: "What should be stored in the model span?", options: ["Just the status code", "Prompt version, model id, full input and output (redacted), stop reason, tokens, cache hits, TTFT, duration, cost", "Only the tokens", "The customer's raw email address"], answer: 1, whyOptions: ["That is the log line that answered nothing.", "Correct. Everything needed to explain and to cost the answer.", "Tokens alone cannot explain an answer.", "Identity is hashed; personal data is redacted."], why: "Enough to explain, count and cost." },
    { q: "Where does customer feedback get stored?", options: ["In a separate table with no link", "Against the trace id, with an ownership check", "In the prompt", "In the model"], answer: 1, whyOptions: ["Unlinked feedback cannot be investigated.", "Correct. The rating opens the exact chain; only the conversation's customer may rate it.", "No.", "No."], why: "Feedback keyed by trace id." },
  ],
  practice: [
    { q: "Write the tracedCreate wrapper's responsibilities.", answer: "Record model id, prompt version, the request (system, messages, tools, sampling settings) redacted; call the SDK with streaming; note time to first token when the first text delta arrives; accumulate the reply; on completion record stop reason, input/output/cached tokens, duration, and cost from a price table keyed by model id; on error record the error class and status; return the reply or stream to the caller.", explain: "The wrapper captures everything the dashboard and the debugger need." },
    { q: "Define three alerts for the help chat and their thresholds.", answer: "Thumbs-down rate per prompt version over 8% for an hour after a deploy (regression); cost per conversation above 1.5× the 7-day median for 30 minutes (runaway loop or cache miss); p95 time to first token above 2.5 seconds for 10 minutes (provider or retrieval slowness). Each links to a query of example traces.", explain: "Alert on step changes, with example traces attached." },
    { q: "A regulator asks what you store about customers in traces. Answer in four lines.", answer: "Hashed customer id; redacted prompts and replies for 30 days (10% sample plus flagged traces at scale); metadata (timings, tokens, cost, versions, feedback) for a year; access restricted to support and engineering roles with read logging; deleted with the customer's account.", explain: "Redaction, retention, access, deletion: all written down." },
  ],
  interview: [
    { level: "junior", q: "What is a trace in an LLM application?", a: "The complete record of one request: an id, and nested spans for each step (retrieval, tool calls, model calls) with their inputs, outputs, timing, tokens, versions and cost. It lets you see exactly why an answer came out the way it did, which cannot be reproduced later." },
    { level: "mid", q: "What do you record for every model call?", a: "Model id, prompt version, the full redacted input and output, stop reason, input, output and cached token counts, time to first token, total duration, sampling settings, and cost computed from a price table. Plus the trace id linking it to retrieval and tool spans." },
    { level: "mid", tricky: true, q: "We log every prompt and reply in full to S3 forever. Good observability?", a: "Good coverage, bad privacy and cost. Prompts contain customer text and must be redacted at write time, access-controlled, retained for a fixed period and deletable with the customer's account. At scale, sample full bodies and keep metadata; always keep traces with errors, negative feedback or tool writes." },
    { level: "senior", q: "Design observability for a support assistant from day one.", a: "A trace per request with spans for retrieve, rerank, each tool and each model call; prompt and model versions on every span; redaction and hashed identity; a ref shown to the customer; feedback and implicit signals (escalation, re-ask) keyed by trace id; a trace_sources table for grouping by article; dashboards for latency, TTFT, cost per conversation by feature, error, decline and thumbs-down rates by version; alerts on step changes; a one-click path from a bad trace to an eval case; retention and sampling rules." },
    { level: "mid", q: "How do traces and evals work together?", a: "Traces show what went wrong in production; the bad ones become eval cases with the question and the forbidden phrase, so the failure cannot recur silently. Evals run before a change; traces and feedback measure after. Dashboards by prompt version show whether an eval-passing change actually helped customers." },
    { level: "mid", tricky: true, q: "Is cost per request the right metric?", a: "Cost per conversation or per completed task is usually better: retrieval and tools add calls per request but may reduce the number of turns. Split by feature and prompt version, watch the median and the tail (a runaway agent shows in the tail), and alert on step changes rather than absolute numbers." },
    { level: "junior", q: "Why show the trace id to the customer?", a: "So a complaint arrives with the key to the exact record. 'The chat said X on Thursday' becomes 'ref 7f3a', and support can open the chain in seconds instead of guessing." },
    { level: "senior", q: "How do you keep traces compliant with privacy rules?", a: "Redact personal data in inputs and outputs before storage; store identity as a hash joinable only via the account system; role-restrict reads and log them; retain bodies for a short fixed period and metadata longer; sample at scale; exclude secrets; include traces in the customer deletion flow; document all of it." },
    { level: "mid", q: "What is time to first token and why track it?", a: "The delay between sending the request and the first streamed token arriving. It is the wait the customer actually feels before text appears; total latency depends on answer length, so TTFT is the better latency metric for chat and the first thing to alert on when a provider slows down." },
    { level: "mid", q: "Should you build your own tracing or use a product?", a: "Start with a thin wrapper that writes spans to your database so the shape is yours and nothing is lost; adopt a tracing backend (OpenTelemetry-compatible or an LLM tracing product) before you spend time building dashboards. The spans and fields stay the same either way." },
  ],
  remember: [
    "Record the chain at the time; it cannot be re-run.",
    "Spans with versions, tokens, TTFT, duration and cost.",
    "A ref for the customer; feedback by trace id; bad traces become evals.",
    "Redact, restrict, retain for a fixed period, sample, no secrets.",
  ],
};
