import type { StoryPage, Topic } from "../types";

// AI 3.9: cost and latency: caching, batching, routing.

const SETTING = "The same online furniture shop. The Help page chat box now sends a long system prompt (rules plus the delivery policy, about 1,800 tokens), the tool definitions, five retrieved chunks and the conversation window on every turn, to the strongest model. The nightly email tagger runs 10,000 emails one by one. Traces (lesson 3.8) now show cost and latency per feature. Kabir has the chart.";
const CAST = "**Kabir** (owner) sees a conversation costing four times what it did in spring. **Dev** (developer) has the traces. **Priya** (product manager) will not accept worse answers. **Nisha** (support lead) says customers leave when the first word takes more than a few seconds.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A help-chat conversation costs four times what it did before retrieval and tools, and the slowest tenth of answers take six seconds to start. The traces show why: almost all of the money is input tokens that are the same on every call, sent to the most expensive model, one request at a time.",
    title: "Four times the cost, six seconds to the first word",
    text: "Kabir's chart, from the traces: cost per help-chat conversation is up 4× since April; the p95 time to first token is 6.1 seconds; the nightly tagger costs more than the chat. Priya's position is simple: answers must not get worse. Nisha's is simpler: six seconds and they close the tab.\n\nDev opens a typical trace. One turn sends 1,800 tokens of system prompt, 900 tokens of tool definitions, 2,000 tokens of retrieved chunks and 1,500 tokens of history, and gets back 250 tokens of answer. Input is 96% of the tokens and most of the cost. The system prompt and the tools are byte-for-byte identical on every call of the day. Retrieval runs, then reranking, then the model, one after another. Every question, including 'what are your opening hours', goes to the strongest model. And the tagger makes 10,000 separate daytime requests for work nobody reads until morning.\n\n**This is the problem.** The shop is paying full price to re-send the same text thousands of times, to use its best model on its easiest questions, and to do overnight work at daytime prices, while the customer waits for three steps that could overlap.",
  },
  {
    stage: "why",
    point: "Cost is tokens times price per model; latency is time to first token plus tokens written. Most input tokens are repeated, most questions are easy, and most steps can overlap or wait, so each can be cut without touching answer quality.",
    title: "Where the money and the seconds go",
    text: "Two formulas explain the chart. Cost per call is input tokens × input price + output tokens × output price, and input tokens dominate here. Latency is the time until the first token, which grows with input size and model size, plus the time to write the output, which grows with output length and shrinks with model speed.\n\nThat gives four levers, all visible in the trace. Repeated input: the provider can remember an unchanged prefix (system prompt, tools, policy) and charge a fraction to read it again; that is **prompt caching**. Model choice: a small model answers opening hours as well as a large one, in a quarter of the time, for a tenth of the price; that is **routing**. Timing: overnight work can go in a **batch** job that completes within hours at half price. Sequence: retrieval and reranking can run while the model is already being warmed, and streaming (lesson 2.5) makes the wait feel shorter than it is.\n\nNone of these change what the model is asked or what it answers. They change what is re-sent, which model, when, and in what order. That is why Priya's condition can hold: the eval suite (lesson 3.7) runs after each change and proves it.",
  },
  {
    stage: "concept",
    point: "Five habits: cache the unchanged prefix, trim what is sent, route easy work to small models, batch overnight work, and overlap steps and stream. Measure each with the traces and the evals.",
    title: "The five levers",
    text: "**Cache the prefix.** Put the parts that never change first (tools, system prompt, policy text) and mark the end of that block as cacheable. The provider stores it for a few minutes and charges roughly a tenth of the usual input price to reuse it, as long as the prefix is byte-identical. Anything that varies, like the retrieved chunks and the history, goes after it.\n\n**Trim.** The window and summary from lesson 3.4 cap the history; the gate from 3.6 caps the sources at five; `max_tokens` and a 'be brief' rule cap the output. Tool definitions are included only where tools are offered.\n\n**Route.** A cheap first step decides where a request goes: a small model for FAQ-style questions and tagging, the strong model for anything involving policy judgement, tools or an unhappy customer. The router is a classifier (lesson 2.3) or a few rules; it is itself cheap.\n\n**Batch.** Anything nobody waits for goes to the batch endpoint: the nightly tagger, re-grading old tickets, generating product descriptions. Half price, results within hours.\n\n**Overlap and stream.** Run retrieval and the facts lookup in parallel; start streaming the moment the model starts; show the sources while the answer is still being written.",
    jargon: [["prefix", "the start of the request, up to the point where content begins to vary between calls; only an identical prefix can be reused from cache"], ["router", "a cheap step that decides which model or path handles a request, by rules or a small classifier"], ["batch endpoint", "a provider API that takes many requests as one job, completes within hours and charges about half price"]],
    table: {
      head: ["Lever", "What it cuts", "Typical effect here", "Risk"],
      rows: [
        ["prompt caching", "cost of repeated input", "system + tools (2,700 tokens) at ~10% price", "a changed byte in the prefix breaks the cache"],
        ["trimming", "input and output tokens", "history and sources capped; answers shorter", "over-trimming loses facts; evals catch it"],
        ["routing", "cost and TTFT on easy requests", "60% of questions to a small model, 4× faster", "a misrouted hard question; measure per route"],
        ["batching", "cost of background work", "tagger at half price", "hours of delay; not for anything a person waits for"],
        ["overlap + streaming", "perceived and real latency", "retrieval in parallel; first token sooner", "complexity; stream errors must be handled"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Caching is a matter of order and a marker: unchanged content first, a cache marker at the end of it, varying content after. The trace shows cached tokens so the hit rate can be watched.",
    title: "Caching the prefix",
    text: "Dev reorders the request. Tools come first, then the system prompt as an array of blocks with the long policy text last and marked cacheable. Retrieved chunks move out of the system prompt into the first user message, because they change per question and would break the prefix. The response's usage block reports how many tokens were read from cache; the model span records it.",
    codes: [
      {
        title: "A request with a cached prefix",
        lang: "ts",
        src: `const reply = await client.messages.create({
  model: process.env.MODEL_SUPPORT!,
  max_tokens: 400,
  tools,                                            // unchanged all day: part of the prefix
  system: [
    { type: "text", text: RULES },                   // unchanged
    { type: "text", text: POLICY_TEXT, cache_control: { type: "ephemeral" } },   // end of the cacheable prefix
  ],
  messages: [
    { role: "user", content: "<sources>\\n" + sourceBlock + "\\n</sources>" },   // varies per question
    { role: "assistant", content: "Understood." },
    ...windowMessages,
  ],
});
trace.meta.cachedTokens = reply.usage.cache_read_input_tokens ?? 0;`,
        lines: [
          { sql: "tools,                                            // unchanged all day: part of the prefix", say: "Tools are sent first by the API's ordering, so they are part of what gets cached." },
          { sql: "{ type: \"text\", text: POLICY_TEXT, cache_control: { type: \"ephemeral\" } },   // end of the cacheable prefix", say: "The marker says 'everything up to here can be reused'. The prefix must be identical, byte for byte, to hit." },
          { sql: "{ role: \"user\", content: \"<sources>\\n\" + sourceBlock + \"\\n</sources>\" },   // varies per question", say: "Retrieved chunks moved after the marker. If they stayed in the system prompt, every call would have a different prefix and no hits." },
          { sql: "trace.meta.cachedTokens = reply.usage.cache_read_input_tokens ?? 0;", say: "The usage block says how much was read from cache. The dashboard shows the hit rate; a drop means someone changed the prefix." },
        ],
        note: "The cache lives a few minutes and refreshes on each hit; a busy chat box keeps it warm all day. Writing to the cache costs a little more than a normal call, so it pays off from the second call onward. Prefixes shorter than about a thousand tokens are not cached at all.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Routing: a cheap decision sends simple questions to a small model and anything with judgement, tools or an upset customer to the strong one. Each route has its own prompt version, its own evals and its own line on the cost chart.",
    title: "Routing easy questions to a small model",
    text: "Dev adds a router in front of the chat. It is a structured-output call to the smallest model with a four-way enum, plus two hard rules that need no model at all: a message mentioning an order number goes to the tools route, and a message with negative feedback in the conversation goes to the strong route. The small-model route uses the same rules and sources but a cheaper model and a lower max_tokens. The eval suite runs per route, so Priya can see that FAQ answers from the small model pass at the same rate.",
    codes: [
      {
        title: "route(): rules first, then a small classifier",
        lang: "ts",
        src: `type Route = "faq" | "policy" | "orders" | "escalation";

export async function route(question: string, conv: Conversation): Promise<Route> {
  if (/\\b\\d{4,6}\\b/.test(question)) return "orders";                 // an order number: needs tools
  if (conv.lastFeedback === "down" || conv.turns > 6) return "escalation";
  const reply = await client.messages.create({
    model: process.env.MODEL_SMALL!,
    max_tokens: 50,
    temperature: 0,
    system: "Classify a furniture-shop support question. faq: hours, delivery areas, materials, care. policy: returns, refunds, damage, anything with conditions. orders: a specific order. escalation: anger, legal threats, repeated problems.",
    tools: [routeTool],
    tool_choice: { type: "tool", name: "route" },
    messages: [{ role: "user", content: question }],
  });
  return RouteSchema.parse(reply.content.find((b) => b.type === "tool_use")?.input).route;
}

const MODEL_FOR: Record<Route, string> = {
  faq: process.env.MODEL_SMALL!,
  policy: process.env.MODEL_SUPPORT!,
  orders: process.env.MODEL_SUPPORT!,
  escalation: process.env.MODEL_SUPPORT!,
};`,
        lines: [
          { sql: "if (/\\b\\d{4,6}\\b/.test(question)) return \"orders\";                 // an order number: needs tools", say: "A rule costs nothing. Anything that looks like an order number needs the tools route, no model needed to decide." },
          { sql: "if (conv.lastFeedback === \"down\" || conv.turns > 6) return \"escalation\";", say: "A customer who is already unhappy never gets the cheap path." },
          { sql: "model: process.env.MODEL_SMALL!,", say: "The router itself runs on the smallest model with fifty output tokens. It costs less than the question it routes." },
          { sql: "faq: process.env.MODEL_SMALL!,", say: "Opening hours and delivery areas: the small model, with the same rules and sources, four times faster." },
          { sql: "policy: process.env.MODEL_SUPPORT!,", say: "Anything with conditions, like the mattress rule, stays on the strong model. Priya's condition holds." },
        ],
        note: "Each route is a line on the cost and feedback dashboards and a category in the evals. A route that starts failing is visible on its own.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The nightly tagger becomes one batch job at half price. In the chat, retrieval and the facts lookup run in parallel, the answer streams, and max_tokens and a brevity rule cap the output. Every change is checked against the evals and the cost chart.",
    title: "Batching the night, overlapping the day",
    text: "The tagger changes shape rather than logic: instead of 10,000 requests through the day, it writes 10,000 requests into one batch file, submits the batch, and a job collects the results in the morning. Same prompt, same schema, half the price, and no competition with daytime chat for rate limits (lesson 3.10).\n\nIn the chat handler, the three sequential steps become two: retrieval and the customer-facts lookup run together with Promise.all, and the reranker's result goes straight into a streaming call. The output is capped at 400 tokens with a 'two short paragraphs' rule; answers got shorter and the thumbs-up rate did not move. Responses to the fifty most common FAQ questions are cached for an hour by exact question text, after a check that nothing in them is per-customer.\n\nThe traces show the result: cost per conversation down 70%, p95 time to first token 1.4 seconds, the tagger at half its old cost, and the eval suite unchanged on every category.",
    table: {
      head: ["Change", "Cost per conversation", "p95 TTFT", "Evals"],
      rows: [
        ["before", "1.00 (index)", "6.1 s", "baseline"],
        ["prompt caching", "0.55", "5.2 s", "unchanged"],
        ["routing 60% to small model", "0.38", "2.6 s", "unchanged per route"],
        ["parallel retrieval + streaming", "0.38", "1.6 s", "unchanged"],
        ["output cap + brevity rule", "0.30", "1.4 s", "unchanged; answers shorter"],
        ["tagger to batch", "tagger −50%", "n/a", "unchanged"],
      ],
    },
    ask: "Priya edits one word in the policy text at 2 pm. What happens to the cache hit rate, the cost chart and the next thousand calls, and how would you make policy edits cheaper?",
  },
  {
    stage: "compare",
    point: "Sending everything to the best model at list price, one call at a time, is the simplest design and the most expensive. Caching, routing, batching and overlapping cut most of the cost and wait without changing a single answer the evals can measure.",
    title: "List price for everything, or the five levers",
    text: "Both designs give the same answers to the same questions. One pays four times as much and makes customers wait four times as long.",
    versus: {
      beginner: {
        title: "Strong model, full prompt, sequential, synchronous",
        lang: "ts",
        code: "system: RULES + POLICY + sourceBlock   // prefix differs every call\nmodel: STRONGEST                       // for 'what are your hours?'\nawait retrieve(); await rerank(); await model();\nfor (const email of emails) await tag(email);   // 10,000 daytime calls",
        points: ["Simplest to write.", "Re-sends 2,700 identical tokens per call at full price.", "Pays the strong model's price and latency on easy questions.", "Overnight work at daytime prices, competing for rate limits."],
      },
      engineer: {
        title: "Cache, trim, route, batch, overlap",
        lang: "ts",
        code: "tools → system (RULES, POLICY ⟵ cache_control) → sources → window\nroute(question) → small model for faq, strong for policy/orders/escalation\nPromise.all([retrieve(), facts()]) → stream\nbatch.create(10,000 tagging requests)  // overnight, half price",
        points: ["Repeated prefix at a tenth of the price.", "Easy questions answered faster by a cheaper model, measured per route.", "Overnight work batched; daytime capacity for customers.", "First token in under two seconds at the tail."],
      },
      tradeoffs: ["Caching depends on byte-identical prefixes; one careless edit silently halves the hit rate, so monitor it.", "Routing adds a cheap call and a new failure mode (misrouting); keep per-route evals.", "Batching trades hours of delay for half price; only for work nobody waits on."],
      when: "From the first cost chart. Caching and output caps are nearly free; routing and batching once traffic justifies them.",
    },
  },
  {
    stage: "recap",
    point: "Cost is mostly repeated input; latency is mostly the wait for the first token. Cache the unchanged prefix, trim what varies, route easy work to small models, batch overnight work, overlap and stream, and prove with evals and traces that answers did not change.",
    title: "Connect it back: Kabir's chart, downhill",
    text: "The chart that started this now shows cost per conversation at 30% of its peak and the p95 first word in 1.4 seconds. The system prompt and tools are cached all day; chunks moved after the marker; sixty percent of questions go to a small model that passes the same evals; retrieval runs in parallel; answers stream and stop at 400 tokens; the tagger runs as one batch at night. Priya's evals are unchanged on every category, which is the only reason the changes stayed.",
    recap: {
      remember: ["Cost = tokens × price; input dominates; most input repeats.", "Cache: unchanged content first, marker at the end, varying content after; watch the hit rate.", "Route: rules, then a small classifier; strong model only where judgement is needed; evals per route.", "Batch anything nobody waits for.", "Overlap steps, stream, cap output; measure TTFT."],
      mistakes: ["Retrieved chunks inside the cached system prompt, so nothing ever hits.", "Routing by guess with no per-route evals.", "Batching something a customer waits for.", "Cutting cost and never re-running the evals."],
      production: ["Every high-volume LLM feature uses caching and routing; batch APIs handle offline classification and generation at scale.", "The cache hit rate and cost per feature live on the lesson 3.8 dashboard.", "Rate limits, the other reason to batch and route, are lesson 3.10."],
      next: ["3.10 Reliability: retries, rate limits, timeouts, fallbacks.", "4.5 Deployment: gateways, queues, streaming, serverless limits.", "4.7 Open-weights and local models: when running your own is cheaper."],
    },
    ask: "The provider has a bad afternoon: requests time out, then come back with 'overloaded', then with 'rate limit exceeded'. The chat box hangs for a minute, retries make it worse, and a refund tool runs twice. Next lesson.",
  },
];

export const A21: Topic = {
  slug: "cost-and-latency",
  title: "Cost and latency: caching, batching, routing",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Read a cost and latency breakdown from traces and say where tokens and seconds go.", "Structure a request so the unchanged prefix is cached and varying content comes after it.", "Route requests to models by rules and a small classifier, with evals per route.", "Batch background work, overlap steps, stream and cap output, and prove quality held."],
  prerequisites: ["tokens-context-cost", "choosing-a-model", "streaming", "observability"],
  story: "A restaurant kitchen. The stock is made once in the morning and reused all day (caching); the sous-chef handles the simple orders and the head chef the tricky ones (routing); the prep for tomorrow is done overnight (batching); and the starter goes out while the main is cooking (streaming and overlap).",
  tldr: [
    "Cost is mostly **repeated input tokens**; latency is mostly **time to first token**.",
    "**Cache the prefix**: unchanged content first, `cache_control` at its end, varying content after; **watch the hit rate**.",
    "**Route**: rules, then a small classifier; the strong model only where judgement is needed; **evals per route**.",
    "**Batch** overnight work at half price; **overlap** steps, **stream**, **cap output**; prove with evals that answers held.",
  ],
  words: [
    ["prompt caching", "the provider reusing an identical request prefix at a fraction of the input price"],
    ["prefix", "the unchanged start of a request, up to where content varies"],
    ["router", "a cheap step choosing the model or path for a request"],
    ["batch endpoint", "an API for many requests as one job, slower and about half price"],
    ["time to first token", "the wait before streamed output begins"],
    ["cache hit rate", "the share of input tokens read from cache rather than paid in full"],
  ],
  sections: [],
  quiz: [
    { q: "Retrieved chunks are inside the system prompt with a cache marker at the end. What is the cache hit rate?", options: ["About 90%", "Near zero: the prefix changes every call", "100%", "50%"], answer: 1, reason: true, whyOptions: ["Only identical prefixes hit.", "Correct. Move varying content after the marker; keep rules, policy and tools before it.", "No.", "No."], why: "Byte-identical prefix, or no cache." },
    { q: "Which request should go to the batch endpoint?", options: ["A customer's chat question", "The nightly tagging of 10,000 emails", "An order lookup", "The router call"], answer: 1, whyOptions: ["A person is waiting.", "Correct. Nobody waits overnight; half price and no daytime rate-limit pressure.", "Needed now.", "Needed now, and tiny."], why: "Batch what nobody waits for." },
    { q: "How do you know routing 60% of questions to a small model did not hurt quality?", options: ["It felt fine", "Per-route eval pass rates unchanged, and feedback by route on the dashboard", "The small model is good enough", "Cost went down"], answer: 1, whyOptions: ["Not a measurement.", "Correct. Evals before, feedback after, both split by route.", "Assumed, not shown.", "Cost says nothing about quality."], why: "Measure per route." },
  ],
  practice: [
    { q: "From a trace: 1,800 system + 900 tools + 2,000 sources + 1,500 history input, 250 output. With caching of system and tools at 10% of input price, roughly what share of input cost remains?", answer: "Uncached input: 2,000 + 1,500 = 3,500 tokens at full price; cached: 2,700 at 10% = 270 token-equivalents. 3,770 of the original 6,200, about 61% of the input cost (a 39% cut), before trimming history or sources.", explain: "Caching helps in proportion to how much of the input is the unchanged prefix." },
    { q: "Design the daily cache-health check.", answer: "From the model spans: cache_read_input_tokens divided by input tokens per hour, per prompt version. Alert if the hourly hit rate drops below 70% while traffic is normal; the usual cause is a prefix edit (new prompt version) or varying content placed before the marker. The alert links to the first traces after the drop.", explain: "Hit rate is a metric; edits are the usual cause." },
    { q: "Priya wants policy edits without losing the cache for the rest of the day. What do you do?", answer: "Accept one cache rebuild per edit (it costs a little over one normal call) and batch edits into a daily release at low traffic; keep the policy as the last block so edits do not invalidate the rules and tools before it; alternatively split the policy into a stable block and a small 'recent changes' block placed after the marker.", explain: "Order the prefix so edits invalidate as little as possible." },
  ],
  interview: [
    { level: "junior", q: "Where does the cost of an LLM feature usually go?", a: "Input tokens, which are usually far more numerous than output tokens: the system prompt, tool definitions, retrieved documents and history, re-sent on every call. Output is a small share. So the biggest savings come from not re-paying for repeated input and from sending less of it." },
    { level: "mid", q: "How does prompt caching work and how do you use it well?", a: "The provider stores an identical request prefix for a few minutes and charges about a tenth of the input price to reuse it. Put unchanged content first (tools, system rules, policy text), mark the end of it as cacheable, and put varying content (retrieved chunks, history) after. Monitor the cached-token share from the usage data; a prefix edit resets it." },
    { level: "mid", tricky: true, q: "I added cache_control and costs did not drop. Why?", a: "The prefix is probably not identical between calls: retrieved content or a timestamp sits before the marker, the prompt text differs per route, or the prefix is shorter than the minimum cacheable length. Check the usage field for cached tokens per call and diff two prefixes. Also note the first call writes the cache at a small premium; savings start on the second." },
    { level: "senior", q: "Design a cost and latency strategy for a high-volume support assistant.", a: "Traces with cost per feature and TTFT; a cached prefix of tools, rules and policy with varying content after; history window and summary; sources capped; a router (rules plus a small classifier) sending FAQ-style questions to a small model with per-route evals; streaming with retrieval and lookups in parallel; output caps and brevity rules; an exact-match response cache for top FAQ questions; batch API for offline tagging and generation; dashboards for hit rate, cost per route and TTFT with alerts." },
    { level: "mid", q: "What is model routing and what are its risks?", a: "Choosing a model per request: cheap and fast for easy requests, strong for hard ones, decided by rules or a small classifier. Risks: misrouting a hard question to the small model, and quality drifting unnoticed; mitigate with per-route evals, feedback by route, and rules that send unhappy or tool-needing conversations to the strong path." },
    { level: "mid", tricky: true, q: "Can I batch the chat requests to save 50%?", a: "No. Batch jobs complete within hours; a chat customer waits seconds. Batch is for offline work: tagging, enrichment, re-grading, summaries nobody reads immediately. For chat, use caching, routing, trimming and streaming instead." },
    { level: "junior", q: "What is time to first token and how do you improve it?", a: "The wait before the first streamed token appears. Improve it by sending fewer input tokens, using a smaller or faster model for easy requests, running retrieval and other lookups in parallel before the call, and streaming so the customer sees text as soon as it starts." },
    { level: "senior", q: "How do you cut cost without hurting quality, and how do you prove it?", a: "Change what is re-sent, which model, when and in what order, not what is asked: caching, trimming with summaries, routing, batching, output caps. Run the eval suite per route after each change and watch feedback by route and prompt version on the dashboard. A change that lowers cost and moves evals or feedback is reverted." },
    { level: "mid", q: "What should go before and after the cache marker?", a: "Before: everything identical across calls in the same order: tool definitions, system rules, policy or reference text. After: retrieved chunks, user facts, the conversation window, the question. Anything with a timestamp, a name or per-request content before the marker breaks the cache." },
    { level: "mid", q: "How do output tokens affect cost and latency?", a: "Output is priced higher per token than input but is usually a small share of tokens. It dominates total latency after the first token, because tokens are written one by one. Cap max_tokens, ask for brevity in the prompt, and prefer structured output for code-consumed answers; shorter answers are faster and cheaper, and often better." },
  ],
  remember: [
    "Input repeats; cache the prefix; watch the hit rate.",
    "Route by rules then a small classifier; evals per route.",
    "Batch what nobody waits for.",
    "Overlap, stream, cap output; prove quality with evals.",
  ],
};
