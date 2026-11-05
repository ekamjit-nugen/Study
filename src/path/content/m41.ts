import type { Exercise, LessonBody, Quiz } from "../types";

// Module 41: Production AI operations. One concept per lesson.
// Keys are lesson slugs: m41-<kebab of the concept title in map.ts>.

export const M41_BODIES: Record<string, LessonBody> = {
  "m41-ai-observability": {
    simple: "AI observability is recording enough about every model request that a bad answer can be explained after the fact, and that quality, cost and speed can be watched as trends.",
    concept:
      "Ordinary software is observed with logs, metrics and traces. **AI observability** adds what those miss for a model-backed feature: the exact prompt that was sent, the retrieved documents, the tool calls and their results, the model and prompt versions, the tokens in and out, the time to first token, the cost, and what the user did next. Without these, a model answer is a black box that cannot be reproduced, because the same question asked later goes through a different prompt version, different retrieved text and a different random sample.\n\nThe unit of observability is the trace: one request's full chain under one id. Metrics are rolled up from traces (cost per conversation, p95 latency, decline rate, thumbs-down rate). Dashboards and alerts are queries over them. Evaluation sets grow from the traces that went wrong.\n\nThe discipline is the same as for any service, with the model treated as a dependency whose behaviour you must record because you cannot re-run it.",
    why:
      "A model answer is produced by a chain of inputs plus a random draw, and none of it can be recreated later. A status code says nothing about why the assistant told a customer the wrong refund policy on Thursday. Without traces, incidents cannot be investigated, counting affected users is impossible, and cost cannot be split by feature. With them, 'the chat said something wrong' becomes a reference number that opens the exact prompt, sources and reply. Every other lesson in this module is built on this record.",
    how: [
      "Assign every request a trace id at the edge; return it to the client so a user can quote it.",
      "Record spans for each step: retrieval (query, filters, chunk ids, scores), each tool call (name, arguments, result, duration), each model call (prompt version, model id, full input and output, tokens, cache hits, TTFT, duration, cost).",
      "Redact personal data at write time, store identity as a hash, and set retention.",
      "Roll traces into metrics: latency percentiles, cost per conversation by feature, error and decline rates, feedback rates, by prompt and model version.",
      "Attach feedback and implicit signals (escalation, re-asks) to the trace id; feed flagged traces into the evaluation set.",
    ],
    visual: {
      kind: "flow",
      steps: ["request → trace id", "spans: retrieve, tools, model (full inputs and outputs, versions, tokens, cost)", "redact, store, retain", "metrics and dashboards", "alerts on step changes", "bad traces → evaluation cases"],
      caption: "One record per request, everything else derived from it.",
    },
    everyday: {
      title: "A flight recorder, not a departures board",
      text: "The departures board says the flight left on time; the flight recorder says what every instrument read and what every control did, second by second. After an incident, nobody tries to fly the route again hoping it repeats. AI observability is the recorder: the status code is the departures board.",
    },
    engineering: {
      title: "The complaint that took four minutes instead of four days",
      text: "A travel company's assistant told a customer that a booking could be changed free of charge; it could not. Before tracing, such complaints took days: the engineer re-ran the question, got a correct answer, and could not say what had happened. After tracing, the customer's email carried 'ref 8c2f'. The trace showed prompt version 31, a retrieved help article that was three months out of date, and a model reply that faithfully quoted it. The fix was the article, not the model; a query over traces found 212 other conversations that had cited it that week, and those customers were contacted. Four minutes from complaint to root cause.",
    },
    maths: {
      formula: "cost per trace = Σ model spans (input tokens × p_in + cached tokens × p_cache + output tokens × p_out) + Σ tool spans (compute seconds × price);   metric = aggregate over traces grouped by feature, version, tenant",
      meaning: "Every number on a dashboard is a sum or percentile over the per-trace fields. If a field is not recorded on the trace, it cannot appear on a dashboard later.",
      worked: [
        "A trace has two model spans: 4,200 input (3,000 cached), 350 output at £3/£0.3/£15 per million: 1,200 × 3 + 3,000 × 0.3 + 350 × 15 per million = £0.0036 + £0.0009 + £0.0053 = £0.0098. Plus a reranker call at £0.0004: cost per trace ≈ £0.0102.",
        "Group 18,000 traces for the day by feature: help-chat £0.0102 × 14,000 = £143; email-tagging £0.0011 × 4,000 = £4.40.",
        "Thumbs-down rate by prompt version: v31 had 212 downs in 4,100 traces = 5.2%; v30 had 90 in 4,300 = 2.1%. The version comparison is only possible because the version is on every trace.",
      ],
    },
    code: {
      title: "A span wrapper that records inputs, outputs, timing and errors",
      lang: "ts",
      src: `export async function span<T>(trace: Trace, name: string, input: unknown, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T> {
  const s = { name, startedAt: Date.now(), input: redact(input), meta, ms: 0, output: undefined as unknown, error: undefined as string | undefined };
  trace.spans.push(s);
  try {
    const out = await fn();
    s.output = redact(out);
    return out;
  } catch (e) {
    s.error = String(e);
    throw e;
  } finally {
    s.ms = Date.now() - s.startedAt;
  }
}

const sources = await span(trace, "retrieve", { query, tenantId }, () => search(query, tenantId));
const reply = await span(trace, "model", null, () => client.messages.create(params), { promptVersion: PROMPT_VERSION, model: params.model });`,
      lines: [
        { code: "const s = { name, startedAt: Date.now(), input: redact(input), meta, ms: 0, output: undefined as unknown, error: undefined as string | undefined };", say: "Every span records its inputs through a redaction step before anything is stored." },
        { code: "s.output = redact(out);", say: "Outputs too: the retrieved chunks, the tool result, the model's reply." },
        { code: "s.error = String(e);", say: "Failures are recorded, not lost; a trace that ends in a timeout is often the most useful one." },
        { code: "const reply = await span(trace, \"model\", null, () => client.messages.create(params), { promptVersion: PROMPT_VERSION, model: params.model });", say: "The model span carries the prompt version and model id, so dashboards can be split by them." },
      ],
      note: "A thin wrapper like this writes to your own database to start; an OpenTelemetry exporter or a hosted LLM tracing product can replace the storage later without changing the spans.",
    },
    useIt: "Add tracing before the first production deploy of any model feature. It is the foundation for every operational question: what happened, how often, since which version, at what cost. The following lessons each take one field from the trace and show what to watch in it.",
    takeaways: ["Record the full chain of every request under one id; it cannot be reproduced later.", "Spans for retrieval, tools and model calls with versions, tokens, timing and cost.", "Metrics, dashboards, alerts and evaluation cases are all derived from traces.", "Redact, hash identity, retain for a fixed period."],
    terms: [["AI observability", "recording and analysing model requests so behaviour can be explained and trended"], ["trace", "one request's complete record under one id"], ["span", "one timed step inside a trace with its inputs and outputs"]],
    reflect: { q: "Why can a model request not simply be re-run to debug it, the way an ordinary API request can?", a: "Because the prompt version, retrieved documents, tool results and the random sample may all differ on the re-run. The answer was a function of a state that no longer exists; only a record made at the time preserves it." },
  },

  "m41-request-tracing": {
    simple: "Request tracing gives every request one id and a tree of timed spans, so the path a question took through retrieval, tools and the model can be read back in order.",
    concept:
      "**Request tracing** is the mechanism behind AI observability. A trace begins when a request enters the system and ends when the last byte leaves. Inside it, spans record steps; spans can nest, so a tool call made inside an agent loop appears under the loop, and the loop under the request. Each span has a name, a start time, a duration, inputs, outputs, and metadata such as the prompt version.\n\nFor an AI feature, the model span is the important one: it must hold the full prompt as sent (system text, messages, tool definitions), the full reply, the model id, the stop reason, token counts, cache hits and time to first token. The retrieval span holds the query, filters and the ids and scores of what came back. Tool spans hold arguments and results.\n\nThe trace id travels with the request through every service and back to the client, so it can be quoted in a complaint and joined to feedback.",
    why:
      "Model-backed requests fan out: one user message can cause a retrieval, a reranker call, two tool calls and three model calls across several services. Logs from each service in isolation cannot be stitched back together; a trace id can. The nesting shows where time went, the recorded inputs show why the model said what it said, and the id shown to the user turns a vague complaint into a precise one. Tracing is standard in distributed systems; AI features need it with richer payloads.",
    how: [
      "Generate a short trace id when the request arrives; propagate it in headers to every downstream call and return it in the response.",
      "Open a root span for the request; open child spans around retrieval, each tool call and each model call; close each with its duration and result.",
      "Record payloads: inputs and outputs through a redactor; versions and ids as metadata.",
      "Write the finished tree once at the end of the request (also on error) to a trace store.",
      "Build a trace viewer: a page that shows the tree with timings and lets a support engineer expand any span to see the exact prompt and reply.",
    ],
    visual: {
      kind: "tree",
      root: "request 8c2f · 2.9 s · help-chat · tenant 41 · prompt v31",
      children: [
        { label: "retrieve · 180 ms", children: ["query: 'change booking fee'", "chunks: 1182 (0.81), 977 (0.64), 2040 (0.52)"] },
        { label: "rerank · 90 ms", children: ["top: 1182, 977"] },
        { label: "model · 2.5 s", children: ["model: pinned-support-model", "input 3,900 (2,900 cached), output 210", "TTFT 0.6 s, stop: end_turn"] },
        { label: "feedback · thumbs down · 'this was wrong'", children: [] },
      ],
      caption: "A trace is a tree with timings. The span that answers 'why' is usually the model span's input.",
    },
    everyday: {
      title: "A parcel's tracking number",
      text: "One number follows the parcel through the depot, the lorry, the sorting centre and the van, each stop stamped with a time. When it goes missing, the number shows exactly where it stopped being scanned. A request trace is the tracking number for a question through your system, with the added detail of what was inside the box at each stop.",
    },
    engineering: {
      title: "Finding the slow step in an agent",
      text: "A procurement agent took 40 seconds per task and the team assumed the model was slow. The trace tree showed eleven model spans averaging 1.4 seconds, three tool spans of under a second, and one tool span, 'fetch supplier catalogue', taking 19 seconds because it downloaded a 30 MB file every call. Caching that file cut the task to 18 seconds. Without the nested spans the model would have been blamed for a download.",
    },
    maths: {
      formula: "request duration = Σ sequential spans + max(parallel spans);   self time of a span = its duration − Σ its children's durations",
      meaning: "A trace's timings add up along the critical path. Self time shows where a span spent its own time rather than waiting for children.",
      worked: [
        "A request span lasts 2,900 ms with children retrieve 180, rerank 90, model 2,500: self time = 2,900 − 2,770 = 130 ms (tokenising, serialising, network).",
        "An agent run of 40 s with eleven model spans (15.4 s total), four tool spans (22.6 s, one of them 19 s), self time 2 s: the single 19 s tool span is 48% of the run.",
        "Two retrievals run in parallel, 180 and 220 ms: their contribution to the critical path is 220 ms, not 400.",
      ],
    },
    useIt: "Instrument every model-backed endpoint with a trace id and nested spans from the start, propagate the id across services, show it to the user, and build or adopt a viewer. When something is slow or wrong, open the trace before forming a theory; the tree usually answers the question.",
    takeaways: ["One id per request, propagated everywhere and shown to the user.", "Nested, timed spans for retrieval, tools and model calls, with full redacted payloads and versions.", "The model span's input is the usual answer to 'why'.", "Self time and the critical path show where time went."],
    terms: [["trace id", "the short identifier that ties a request's spans together and can be quoted by a user"], ["critical path", "the chain of sequential spans that determines total duration"], ["trace viewer", "a page that renders a trace tree with timings and payloads"]],
    reflect: { q: "What is lost if the trace records token counts and timings but not the prompt text?", a: "The ability to explain any answer. Counts show that a request was large or slow; only the text shows what the model was told and why it replied as it did. Store the text, redacted, for at least the retention window." },
  },

  "m41-token-usage-monitoring": {
    simple: "Token usage monitoring tracks input, cached and output tokens per request and rolls them up by feature, version and customer, because tokens are what you pay for and what reveals runaway prompts.",
    concept:
      "Every model call reports how many tokens it read and wrote; providers include cached-token counts too. **Token usage monitoring** records those numbers on every trace and watches them in aggregate: tokens per request, per conversation, per feature, per prompt version, per tenant, per day. The counts are the raw material for cost, and they are also the earliest signal of several failures: a prompt that grew after an edit, a retrieval that started returning too much, a conversation window that stopped trimming, an agent that loops.\n\nThree ratios matter beyond the totals. Input to output: a feature that reads 20,000 tokens to write 50 is paying for context it may not need. Cached to input: a low cache share on a feature with a long fixed prompt means caching broke. Tokens per conversation turn over time: a rising trend with no product change means something is leaking into the prompt.",
    why:
      "Tokens are the unit of the bill and the unit of the context limit; both fail silently. A system prompt edit that doubles its length does not error, it just doubles the input cost and TTFT on every request from that minute on. A retrieval bug that returns twenty chunks instead of five does the same. Watching token counts by version catches these in the first hour; waiting for the invoice catches them a month later.",
    how: [
      "Record input, cached and output tokens from the provider's usage field on every model span; sum per trace.",
      "Roll up per feature and prompt version: median and p95 input tokens, output tokens, cache share.",
      "Track tokens per conversation and per customer per day for billing and abuse detection.",
      "Alert on step changes: p50 input tokens up more than 30% after a deploy; cache share below its usual level; p95 output tokens hitting the max_tokens cap often.",
      "Enforce ceilings in code: a per-request input cap, a per-user daily budget, a loop budget for agents.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Signal", "Healthy", "Warning", "Likely cause"],
        rows: [
          ["p50 input tokens per request (help-chat)", "4,000–4,500", "jumps to 7,900 after a deploy", "prompt edit or retrieval returning more"],
          ["cache share of input", "60–70%", "drops to 5%", "variable content placed before the cache marker"],
          ["p95 output tokens", "under the cap", "equals the cap on 20% of requests", "answers cut off; cap too low or prompt too verbose"],
          ["tokens per conversation (trend)", "flat", "rising week on week", "history not trimmed; summaries not folding"],
          ["tokens per user per day", "under budget", "one user at 40× median", "abuse, a bot, or a client retry loop"],
        ],
      },
      caption: "Each row is a cheap alert that catches a silent failure.",
    },
    everyday: {
      title: "The water meter",
      text: "A leak under the floor makes no noise. The water meter spinning at night, when every tap is off, is the only sign. Token counts are the meter for prompts: a rise with no corresponding use means something is leaking into every request.",
    },
    engineering: {
      title: "The prompt edit that doubled the bill before lunch",
      text: "A product manager at a marketplace added a long list of tone examples to the system prompt at 10 am. Nothing broke. The token dashboard, split by prompt version, showed p50 input tokens for version 44 at 8,100 against version 43's 3,900, and an alert fired at 10:20. The edit was reverted and the examples trimmed to three. Had the team waited for the invoice, the extra cost over the month would have been about £11,000. The dashboard cost nothing; the alert rule was one line.",
    },
    maths: {
      formula: "cache share = cached input tokens ÷ total input tokens;   effective input price = p_in × (1 − cache share) + p_cache × cache share",
      meaning: "Cached tokens are billed at about a tenth of the full price, so the share decides the real input cost. A drop in share is a cost rise even when the token count is flat.",
      worked: [
        "4,400 input tokens with 3,000 cached: share = 3,000 ÷ 4,400 = 68%. Effective price per input token = 3 × 0.32 + 0.3 × 0.68 = £1.16 per million (full price £3).",
        "Caching breaks (a timestamp added before the marker): share → 0%. Same 4,400 tokens now cost 3 × 1 = £3 per million. Input cost up 2.6× with no change in token count.",
        "Per day at 60,000 requests: 60,000 × 4,400 = 264 million input tokens; £306 at 68% cache share, £792 at 0%. The alert on cache share pays for itself in an hour.",
      ],
    },
    useIt: "Put token metrics on the main dashboard split by feature and prompt version, with alerts on p50 input, cache share and output-cap hits. Add per-user and per-tenant daily token counts for billing and abuse detection, and enforce hard caps in code rather than hoping the dashboard is watched.",
    takeaways: ["Record input, cached and output tokens on every span; roll up by feature, version, tenant and day.", "Watch three ratios: input to output, cached to input, tokens per conversation over time.", "Step changes after deploys are prompt or retrieval bugs; alert on them.", "Enforce caps in code: per request, per user, per agent run."],
    terms: [["token usage", "the counts of tokens read and written by model calls"], ["cache share", "the fraction of input tokens served from the prompt cache"], ["output-cap hit", "a reply that stopped because it reached max_tokens"]],
    reflect: { q: "Output tokens are flat but cost went up 40% this week. What do you check?", a: "Input tokens and cache share by prompt version and feature. Either input grew (a prompt or retrieval change) or the cache share fell (something variable moved before the cache marker); the dashboard split by version shows which deploy did it." },
  },

  "m41-cost-monitoring": {
    simple: "Cost monitoring turns token and compute usage into money per request, per conversation, per feature and per customer, so spend is seen daily and attributed, not discovered on the invoice.",
    concept:
      "**Cost monitoring** computes what each request cost from its trace: tokens times the price table for the model used, plus seconds of self-hosted GPU time at the card's hourly rate, plus any paid tools (search, reranker, transcription). The per-trace cost is then aggregated along the dimensions that matter: by feature (which product capability spends the money), by model and prompt version (did a change raise cost), by tenant or customer (who is expensive, and what to bill), and by day (the trend and the forecast).\n\nThe useful unit is cost per unit of value: per conversation, per document processed, per ticket resolved, per active customer. Cost per request alone misleads, because a change that adds a retrieval call per request but halves the number of turns per conversation lowers the real cost.\n\nAlerts fire on step changes and on budget pace, not on absolute numbers, because traffic growth is expected and good.",
    why:
      "Model costs scale with usage and with prompt size, both of which change without anyone deciding to spend more. A provider price change, a model version swap, a prompt edit, a tenant's sudden growth or a retry loop can each double the bill, and the invoice arrives weeks later. Daily attribution turns cost into a controllable engineering metric: a feature with a known cost per conversation can be budgeted, priced and optimised. It also answers the finance question 'what does the AI cost us per customer' with a number instead of an estimate.",
    how: [
      "Maintain a price table keyed by model id and date: input, cached input and output prices per million tokens; GPU hourly rates for self-hosted models; prices for paid tools.",
      "On each span, compute cost from its usage and the price in force at that time; sum per trace.",
      "Aggregate daily by feature, model, prompt version and tenant; compute cost per conversation, per document, per active user.",
      "Forecast month-end spend from the trailing seven days; compare with budget.",
      "Alert on: cost per conversation up more than 25% day over day; a tenant's daily cost above its plan; forecast exceeding budget; a new model id appearing unexpectedly.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Dimension", "Question it answers", "Typical alert"],
        rows: [
          ["by feature", "which capability spends the money", "feature cost per unit up 25% after a deploy"],
          ["by model and version", "did a swap or edit raise cost", "new model id with no change ticket"],
          ["by tenant / customer", "who is expensive; what to bill", "tenant at 3× its plan's allowance"],
          ["by day (trend)", "where will the month land", "forecast over budget by the 10th"],
          ["per unit of value", "is the feature economically viable", "cost per resolved ticket above the price charged"],
        ],
      },
      caption: "The same per-trace cost, sliced five ways.",
    },
    everyday: {
      title: "Itemised phone bills",
      text: "A single monthly total tells you that the phone cost £140. The itemised bill shows that £95 was one number called at 2 am for three hours, and you can act on it. Cost monitoring is the itemised bill for model usage, arriving every morning rather than every month.",
    },
    engineering: {
      title: "A tenant that cost more than it paid",
      text: "A SaaS provider charged a flat £400 a month per tenant for an AI document assistant. Cost monitoring by tenant showed one customer costing £1,900 a month: they had connected a 40,000-document archive and ran bulk summaries nightly through the interactive endpoint. The feature was not wrong; the pricing was. The provider added usage-based billing above an allowance, moved bulk jobs to the batch API at half price, and the tenant's cost fell to £600 while their bill rose to £750. Without per-tenant cost, the loss would have been invisible inside the total.",
    },
    maths: {
      formula: "trace cost = Σ model spans (tokens × price at that date) + Σ GPU seconds × hourly rate ÷ 3600 + Σ tool costs;   cost per conversation = Σ trace costs in the conversation",
      meaning: "Prices are looked up by model and date, so historical costs stay correct when prices change. Conversations, not requests, are the unit to compare over time.",
      worked: [
        "A conversation has 5 turns. Each turn: 4,400 input (3,000 cached), 300 output at £3/£0.3/£15 per million: 1,400 × 3 + 3,000 × 0.3 + 300 × 15 = £0.0042 + £0.0009 + £0.0045 = £0.0096. Plus a reranker at £0.0003: £0.0099 per turn, £0.0495 per conversation.",
        "A change adds a classification call (£0.0004) per turn but cuts average turns from 5 to 3.5 by answering better: new cost per conversation = 3.5 × 0.0103 = £0.036. Cost per request rose 4%; cost per conversation fell 27%.",
        "Month forecast: trailing 7-day average of 2,100 conversations per day × £0.036 × 30 = £2,268; budget £2,500; fine. A tenant at 900 conversations per day alone would be £972 a month against a £400 plan: alert.",
      ],
    },
    useIt: "Build the cost dashboard from traces before launch: per-trace cost from a dated price table, aggregated by feature, version, tenant and day, expressed per conversation or per document. Use it to price the product, to catch regressions on the day they ship, and to decide which optimisation lever (Module 40) to pull first.",
    takeaways: ["Compute cost per trace from usage and a dated price table; aggregate by feature, version, tenant, day.", "Measure cost per unit of value, not per request.", "Alert on step changes, tenant overruns and budget pace.", "Per-tenant cost is how AI features get priced correctly."],
    terms: [["cost attribution", "assigning spend to features, versions and customers"], ["price table", "model and tool prices keyed by date, used to cost historical traces"], ["cost per unit of value", "spend divided by conversations, documents or resolved tickets"]],
    reflect: { q: "Why is a price table keyed by date, not just by model?", a: "Providers change prices and you change models over time. Costing last month's traces at this month's prices would misstate the trend; the table records what each token cost when it was used." },
  },

  "m41-latency-monitoring": {
    simple: "Latency monitoring watches the wait users experience as distributions over time, split into the stages that cause it, so slowdowns are seen and attributed before users leave.",
    concept:
      "**Latency monitoring** tracks how long requests take, as a distribution rather than an average, for each stage of a model-backed request: queue wait, retrieval, reranking, each tool, time to first token, time per output token, and total. The distribution is summarised by percentiles: p50 for the typical user, p95 and p99 for the tail, which is where complaints come from. Each percentile is tracked over time and split by feature, model, prompt version, region and provider.\n\nFor streamed answers, time to first token is the number users feel most; for background jobs, throughput and completion time matter instead. Targets are set per stage: a TTFT under one second at p95 for chat, a per-token pace faster than reading speed. Alerts fire when a percentile crosses its target for a sustained window, and the split by stage says which part slowed down.",
    why:
      "Latency degrades quietly: a provider slows under load, a prompt grows, a retrieval index gets bigger, a region loses capacity. Users do not file tickets; they stop using the feature. Averages hide the tail, and a single total hides the cause. Monitoring the percentiles per stage catches the slowdown within minutes and points at retrieval, the model, a tool or the queue, so the fix is targeted rather than guessed. It also provides the evidence for capacity decisions and provider comparisons.",
    how: [
      "From each trace, extract per-stage durations: queue, retrieve, rerank, tools, TTFT, TPOT, total.",
      "Aggregate into percentiles (p50, p95, p99) per minute or five minutes, split by feature, model, prompt version, region, provider.",
      "Set targets per stage and per feature; display them as lines on the charts.",
      "Alert when a percentile exceeds its target for a sustained window (say p95 TTFT over 2 s for 10 minutes), with the stage breakdown in the alert.",
      "Correlate with deploys, traffic volume and the provider's status page; keep a changelog line on every chart.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Stage", "p50", "p95", "Target p95", "Status"],
        rows: [
          ["queue wait", "20 ms", "140 ms", "500 ms", "ok"],
          ["retrieve + rerank", "210 ms", "480 ms", "600 ms", "ok"],
          ["time to first token", "0.7 s", "2.6 s", "1.5 s", "alert"],
          ["time per output token", "32 ms", "48 ms", "60 ms", "ok"],
          ["total (300-token answer)", "10.8 s", "17 s", "20 s", "ok"],
        ],
      },
      caption: "The total is within target; the first-token wait is not. Users feel the latter. The stage split points at prefill or the provider, not retrieval.",
    },
    everyday: {
      title: "A commute measured properly",
      text: "Your average commute is 35 minutes, which hides that one day in twenty takes an hour and a half. Those days are what you remember and what make you leave early. Breaking the journey into walk, train and bus shows the train is the culprit. Latency percentiles per stage do the same for requests.",
    },
    engineering: {
      title: "A provider slowdown caught before support noticed",
      text: "At 14:10 a fintech's assistant p95 TTFT rose from 0.9 s to 3.4 s. The stage split showed retrieval and queueing flat; the model span's TTFT had tripled. The provider's status page said nothing for another 25 minutes. The alert fired at 14:16, the on-call engineer switched the fallback model on at 14:20, and p95 returned to 1.1 s. Support received zero tickets. The provider confirmed a degradation at 14:35.",
    },
    maths: {
      formula: "p95 = the value below which 95% of samples fall;   with n samples sorted ascending, p95 ≈ sample at index ⌈0.95 × n⌉",
      meaning: "A percentile is a position in the sorted list, not an average. One huge outlier barely moves it; a shift in the whole tail does.",
      worked: [
        "20 TTFT samples sorted (s): 0.4, 0.5, 0.5, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.2, 1.4, 1.9, 2.6, 7.3.",
        "Mean = 24.4 ÷ 20 = 1.22 s, pulled up by the 7.3 s outlier. p50 = average of 10th and 11th = 0.8 s. p95 = the 19th value = 2.6 s.",
        "Next window, the same except the last five are 2.1, 2.4, 2.9, 3.1, 3.3: mean 1.33 s (barely moved), p95 now 3.1 s (up 20%). The percentile saw the tail shift; the mean did not.",
      ],
    },
    code: {
      title: "Percentiles per stage from a window of traces",
      lang: "ts",
      src: `function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[idx];
}

export function latencySummary(traces: Trace[], stage: string) {
  const ms = traces.map((t) => t.spans.find((s) => s.name === stage)?.ms).filter((x): x is number => x !== undefined);
  return { n: ms.length, p50: percentile(ms, 0.5), p95: percentile(ms, 0.95), p99: percentile(ms, 0.99) };
}

const ttft = latencySummary(lastFiveMinutes, "model");
if (ttft.n >= 50 && ttft.p95 > 2000) alert("p95 TTFT " + ttft.p95 + " ms over target", { stage: "model", window: "5m" });`,
      lines: [
        { code: "const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);", say: "A percentile is a position in the sorted list; the 95th percentile of 200 values is the 190th." },
        { code: "const ms = traces.map((t) => t.spans.find((s) => s.name === stage)?.ms).filter((x): x is number => x !== undefined);", say: "One stage's durations are pulled out of the traces; the same function serves every stage." },
        { code: "if (ttft.n >= 50 && ttft.p95 > 2000) alert(\"p95 TTFT \" + ttft.p95 + \" ms over target\", { stage: \"model\", window: \"5m\" });", say: "The alert needs enough samples to be meaningful and carries the stage, so the responder starts in the right place." },
      ],
      note: "Real systems compute percentiles in a metrics store with histograms; the logic is the same.",
    },
    useIt: "Chart p50 and p95 per stage per feature with target lines and a deploy marker, and alert on sustained breaches with the stage in the message. Use the charts to size capacity, compare providers under real load, and to prove whether an optimisation worked.",
    takeaways: ["Monitor distributions (p50, p95, p99), not averages; the tail is where complaints live.", "Split latency by stage: queue, retrieval, tools, TTFT, TPOT, total.", "Targets per stage; alerts on sustained breaches with the stage named.", "Annotate deploys and provider incidents on the charts."],
    terms: [["percentile", "the value below which a given share of samples fall"], ["tail latency", "the slow end of the distribution, p95 and above"], ["stage breakdown", "latency attributed to each step of a request"]],
    reflect: { q: "A dashboard shows average latency improved after a deploy, but complaints rose. How is that possible?", a: "The deploy sped up the common case and slowed a minority badly: the mean fell while the p95 or p99 rose. Averages cannot see this; percentiles can." },
  },

  "m41-error-monitoring": {
    simple: "Error monitoring for AI features counts not only crashes and timeouts but also the quiet failures: refusals, declines, malformed outputs, cut-off answers and tool failures, each tracked as a rate by version.",
    concept:
      "A classic service has one kind of error: the request failed. A model-backed feature has many, and most return HTTP 200. **Error monitoring** for AI tracks them all as rates. Hard errors: provider 429s and 5xx, timeouts, network failures, out-of-memory on self-hosted servers. Soft errors: the model refused or declined, the output failed schema validation, the answer hit the length cap mid-sentence, a tool call failed or returned an error, retrieval returned nothing above the threshold, an agent hit its step budget, the fallback model served instead of the primary.\n\nEach is a counter on the trace, aggregated by feature, model and prompt version. The soft rates are the interesting ones: a jump in schema failures after a model update, a rise in declines after a prompt edit, a fallback rate that quietly reached 30% because the primary provider has been degraded for a week.",
    why:
      "Soft failures are invisible to ordinary monitoring and visible to users. A classifier that returns invalid JSON 8% of the time, an assistant that says 'I cannot help with that' to a quarter of questions, a cap that truncates every long answer: all show as success in HTTP terms. Counting them by version is how a bad prompt edit or a model update is caught in the first hour, and how the real reliability of the feature, not of the HTTP endpoint, is known.",
    how: [
      "Define the error taxonomy for each feature: hard (429, 5xx, timeout, OOM), soft (refusal, decline, schema failure, cap hit, tool error, empty retrieval, budget exhausted, fallback served).",
      "Classify every trace into zero or more of these at write time; refusals and declines may need a cheap classifier or a pattern match on the reply.",
      "Aggregate rates per feature, model and prompt version over five-minute and daily windows.",
      "Alert on: any hard error rate above 1%; any soft rate up more than 2× its seven-day baseline; fallback rate above 5% for ten minutes.",
      "Link every alert to example traces so the responder sees real cases, not just a number.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Error type", "HTTP status", "How it is detected", "Typical cause"],
        rows: [
          ["timeout / 5xx / 429", "error", "the client", "provider incident, rate limit, overload"],
          ["schema validation failure", "200", "Zod parse on the reply", "model update, prompt drift"],
          ["refusal / decline", "200", "pattern or classifier on the reply", "prompt edit, over-cautious model, off-topic traffic"],
          ["output cap hit", "200", "stop reason = max_tokens", "cap too low, verbose prompt"],
          ["tool error", "200", "is_error on the tool result", "downstream outage, bad arguments"],
          ["empty retrieval", "200", "no chunk above threshold", "index stale, question out of scope"],
          ["fallback served", "200", "model id ≠ primary", "primary degraded; circuit open"],
        ],
      },
      caption: "Six of seven rows are HTTP 200. An uptime monitor sees none of them.",
    },
    everyday: {
      title: "A shop that is open but out of stock",
      text: "The door is unlocked, the lights are on, and the uptime check says 'open'. Inside, half the shelves are empty and the card machine only works some of the time. Customers leave without buying. Error monitoring for AI counts the empty shelves and the declined cards, not just whether the door opened.",
    },
    engineering: {
      title: "The model update that broke the invoice extractor",
      text: "An accounting platform's invoice extractor returned structured JSON validated by a schema. When the provider released a new model version and the team's pinned alias moved to it, the schema failure rate went from 0.4% to 9% within an hour: the new model wrapped JSON in explanatory prose. HTTP success rate stayed at 100%. The alert on schema failures by model id fired; they pinned back to the previous version and adjusted the prompt for the new one over the next week. Eighteen minutes of degraded extraction instead of a month.",
    },
    maths: {
      formula: "rate = errors of a type ÷ traces in the window;   alert if rate > max(absolute floor, k × seven-day baseline), with enough traces that the rate is meaningful",
      meaning: "Rates are compared with the feature's own history, because normal decline and refusal rates differ by feature. A minimum sample size avoids alerting on one bad request in ten.",
      worked: [
        "Schema failures: 36 in 400 traces in the last 5 minutes = 9%. Seven-day baseline 0.4%. 9 ÷ 0.4 = 22× the baseline: alert.",
        "Declines on help-chat: 48 in 900 = 5.3%. Baseline 4.8%: 1.1×, within normal variation. No alert.",
        "Fallback served: 61 in 500 = 12.2% for 15 minutes; absolute threshold 5%: alert, and the message names the primary model as degraded.",
        "Sample-size rule: with 10 traces, one failure is 10%; require n ≥ 50 before any soft-rate alert fires.",
      ],
    },
    useIt: "Define the error taxonomy per feature, record it on each trace, and chart the rates by version with alerts on baselines. Treat soft errors as reliability: the feature's real success rate is the share of requests with no error of any type, and that is the number to report and improve.",
    takeaways: ["AI features fail softly: refusals, schema failures, cap hits, tool errors, empty retrieval, fallbacks, all HTTP 200.", "Classify every trace; aggregate rates by feature, model and prompt version.", "Alert against the feature's own baseline with a minimum sample size.", "Real success rate = traces with no error of any kind."],
    terms: [["soft error", "a request that returned successfully but did not do its job"], ["schema failure", "a model reply that does not match the expected data shape"], ["fallback rate", "the share of requests served by a backup model or path"]],
    reflect: { q: "A feature reports 99.9% HTTP success and users say it is unreliable. What rates would you look at?", a: "Schema failures, declines and refusals, output-cap hits, tool errors, empty retrievals and fallback share, by prompt and model version. One of them is probably high and invisible to the HTTP metric." },
  },

  "m41-model-drift": {
    simple: "Model drift is a model's quality falling over time even though its code and prompt have not changed, usually because the provider updated the model or the world moved away from what it learned.",
    concept:
      "**Model drift** is the change in a model's behaviour between when you measured it and now. Two sources. The model itself changed: a provider updated the version behind an alias, or a quantisation or serving change altered outputs subtly. Or the model stayed fixed but its knowledge aged: the world changed (new products, new regulations, new slang) and a model trained before those changes answers as if they had not happened.\n\nEither way, the symptom is the same: evaluation scores, feedback rates and error rates slide without any deploy to blame. The defence is to pin model versions so updates are deliberate, to re-run the evaluation suite on a schedule rather than only on change, and to track quality metrics over time per model id so a slide is seen as a trend.\n\nIt is distinct from data drift (next lesson), where the inputs change rather than the model.",
    why:
      "Teams assume a model is a fixed function. It is not: providers retire and update versions, alias names silently move, and a model's knowledge has a date. A fraud model trained last year does not know this year's scam; an assistant pinned to 'latest' woke up one morning with a new personality. If quality is measured only at launch, drift is discovered by customers. Scheduled evaluation and version pinning turn an invisible slide into a visible, dated event with a known cause.",
    how: [
      "Pin exact model versions in configuration; never use a moving alias in production.",
      "Record the model id on every trace; chart quality metrics (evaluation score, thumbs-down rate, schema failure rate) per model id over time.",
      "Re-run the evaluation suite weekly on the pinned version, even with no changes, and on every version change in a staging run first.",
      "For knowledge ageing, keep a set of time-sensitive evaluation cases (current products, policies, dates) and refresh them; prefer retrieval over model memory for anything that changes.",
      "When a provider announces a deprecation, run the suite against the successor, compare per category, adjust prompts, then switch deliberately.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Model changed under you", points: ["Alias moved to a new version", "Serving or quantisation change", "Sudden step in metrics on one date", "Fix: pin versions; migrate deliberately"] },
      right: { title: "World moved away from the model", points: ["New products, rules, vocabulary", "Knowledge cutoff ages", "Slow slide in metrics over months", "Fix: retrieval for changing facts; refresh evals"] },
      caption: "A step says the model moved; a slope says the world did.",
    },
    everyday: {
      title: "A guidebook from five years ago",
      text: "The guidebook is unchanged; the city is not. Restaurants closed, the tram line moved, prices doubled. Following it faithfully leads you to a shuttered café. The book has not got worse; the world has drifted away from it. A model's knowledge is that guidebook, and the fix is to check current sources rather than trusting the book.",
    },
    engineering: {
      title: "The alias that moved on a Tuesday",
      text: "A legal-research assistant used a provider alias meaning 'current version'. On a Tuesday the provider moved it to a new model. Nothing deployed; the weekly evaluation run on Friday showed the faithfulness score down from 94% to 87% and citation format errors up sixfold. Traces showed the model id had changed on Tuesday at 09:00. The team pinned the previous exact version, restoring the scores, then spent a fortnight adapting prompts to the new version in staging before switching. They changed policy: aliases are banned in production.",
    },
    maths: {
      formula: "drift signal = metric(this period) − metric(baseline period), tested against the week-to-week variation;   alert if |drift| > 2 × typical variation",
      meaning: "Quality metrics move a little every week from sampling. A drift is a move beyond that normal range, and the dates tell you whether it is a step or a slope.",
      worked: [
        "Weekly evaluation scores over eight weeks: 93.8, 94.1, 93.6, 94.0, 93.9, 94.2, 87.1, 86.8. Typical week-to-week variation ≈ 0.3 points.",
        "Week 7 drop = 94.2 − 87.1 = 7.1 points = 24× the variation: a step. The model id on week-7 traces differs from week 6: the model changed.",
        "Another feature: 91.0, 90.6, 90.3, 89.9, 89.4, 89.1, 88.6, 88.2: a steady −0.4 per week, 3.2 points over eight weeks with the same model id: a slope; the time-sensitive cases are the ones failing: the world moved.",
      ],
    },
    useIt: "Pin versions, chart quality by model id, and run evaluations on a schedule so drift shows as a dated change rather than a mystery. For facts that change, keep them in retrieval rather than in the model's memory, and refresh the time-sensitive evaluation cases quarterly.",
    takeaways: ["Model drift: quality slides without a deploy, because the model changed or its knowledge aged.", "Pin exact versions; record the model id on every trace; chart quality by it.", "Evaluate on a schedule, not just on change; migrate versions deliberately with a staged comparison.", "A step means the model moved; a slope means the world did."],
    terms: [["model drift", "a change in model behaviour over time without a change on your side"], ["version pinning", "using an exact model version rather than a moving alias"], ["knowledge ageing", "a fixed model's facts becoming out of date"]],
    reflect: { q: "Why is 'use the latest model automatically' a bad production setting even if newer models are usually better?", a: "Because 'usually better' is not 'better for your prompts and your evaluation', and the change arrives unannounced. A deliberate migration with a staged comparison keeps the improvement and avoids the surprise." },
  },

  "m41-data-drift": {
    simple: "Data drift is the inputs changing over time, so a model that was accurate on last year's traffic is quietly wrong on this year's, and it is caught by comparing the distribution of what arrives with what it was built for.",
    concept:
      "**Data drift** is a change in the inputs a model sees compared with the data it was trained or evaluated on. The model is unchanged; the questions are different. A support assistant built for a software product starts receiving questions about a newly launched hardware line. A fraud model trained on card-present transactions sees a surge of online ones. Users of a new region write in a different register or language.\n\nThe model's answers do not become random; they become answers to the old question. Accuracy on the new traffic falls while evaluation on the old test set stays perfect, because the test set drifted too, in the sense that it no longer resembles production.\n\nDetection compares distributions: topic mix, input length, language, vocabulary, retrieval scores, confidence, decline rate, between a reference window and now. Response is to refresh the evaluation set from current traffic, update retrieval content, and retrain or re-prompt for the new mix.",
    why:
      "Every evaluation set is a snapshot of the traffic at the time it was built. Products, customers and seasons change the traffic continuously, so a feature that passes its evals can still be failing most of its real users. Data drift is the most common reason an AI feature 'got worse' with nothing changed; it is also the easiest to miss, because every monitor that looks at the model says it is fine. Watching the inputs themselves is the only way to see it.",
    how: [
      "Choose input statistics to track: topic or intent distribution (from a cheap classifier), input length, language, top vocabulary, retrieval best-score distribution, model confidence, decline and empty-retrieval rates.",
      "Compute them over a reference window (the period the evaluation set was built from) and over each recent window.",
      "Compare: share per category, a distance measure between distributions, or simply the categories whose share moved most.",
      "Alert when the mix shifts beyond a threshold or a new dominant category appears.",
      "Respond: sample recent traffic into the evaluation set, update retrieval content for the new topics, adjust prompts, and if a trained classifier is involved, retrain on recent labelled data.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Intent category", "Reference share (Jan)", "This week", "Change", "Retrieval best score (median)"],
        rows: [
          ["billing", "28%", "25%", "−3", "0.82"],
          ["software how-to", "41%", "24%", "−17", "0.79"],
          ["hardware setup (new line)", "0%", "22%", "+22", "0.31"],
          ["returns", "18%", "17%", "−1", "0.80"],
          ["other", "13%", "12%", "−1", "0.44"],
        ],
      },
      caption: "A new category took a fifth of traffic and retrieval barely matches it. The model is fine; the help centre and the evaluation set are not.",
    },
    everyday: {
      title: "A café that opened near a new office",
      text: "A café that served students for years and tuned everything to them finds the queue full of office workers after a company moves in next door: they want flat whites at 8 am, not toasties at 2 pm. The menu did not get worse; the customers changed. The owner who watches only the till total sees it falling and blames the cook.",
    },
    engineering: {
      title: "The hardware launch nobody told the assistant about",
      text: "A consumer-electronics company launched a smart-speaker line. The support assistant, with a help centre and evaluation set built around their app, scored 92% on its weekly evaluation while thumbs-down rose from 4% to 11%. The intent dashboard showed a new 'speaker setup' category at 22% of traffic with a median retrieval score of 0.31, far below the 0.5 gate, so the assistant was declining or improvising. They wrote the missing help articles, indexed them, added 60 speaker questions to the evaluation set, and thumbs-down returned to 5% within a week. The model never changed; the data did.",
    },
    maths: {
      formula: "population stability index (PSI) = Σ over categories (now% − ref%) × ln(now% ÷ ref%);   under 0.1 stable, 0.1–0.25 moderate drift, over 0.25 significant",
      meaning: "PSI compares two distributions over the same categories; big moves in any category add to the index. It is a standard drift measure in fraud and credit models.",
      worked: [
        "Software how-to: ref 41%, now 24%: (0.24 − 0.41) × ln(0.24 ÷ 0.41) = (−0.17) × (−0.535) = 0.091.",
        "Hardware setup: ref 0% (use 0.5% to avoid ln 0), now 22%: (0.22 − 0.005) × ln(44) = 0.215 × 3.78 = 0.813.",
        "Billing: (0.25 − 0.28) × ln(0.893) = (−0.03) × (−0.113) = 0.003. Returns and other ≈ 0.001 each.",
        "PSI ≈ 0.091 + 0.813 + 0.003 + 0.002 = 0.91: far above 0.25. Significant drift, driven almost entirely by the new category.",
      ],
    },
    useIt: "Track the input mix (intents, lengths, languages, retrieval scores) against the window your evaluation set came from, and alert on a drift index or a new dominant category. Refresh the evaluation set from live traffic every quarter so it keeps resembling production, and treat a new category as a content and evaluation task before blaming the model.",
    takeaways: ["Data drift: the inputs changed; the model answers the old question.", "Model-side monitors stay green; only input statistics reveal it.", "Compare distributions between a reference window and now; PSI is a standard index.", "Respond by refreshing evaluation sets, retrieval content and prompts, or retraining."],
    terms: [["data drift", "a change in the distribution of inputs compared with the training or evaluation data"], ["population stability index", "a number comparing two category distributions; over 0.25 is significant drift"], ["reference window", "the period whose traffic the evaluation set represents"]],
    reflect: { q: "The evaluation score is 92% and users are unhappy. Which of model drift or data drift would you suspect first, and what single chart would settle it?", a: "Data drift, because the evaluation passes: the model is fine on the old questions. The intent-mix chart against the reference window settles it; a new or grown category with poor retrieval scores is the usual answer." },
  },

  "m41-feedback-collection": {
    simple: "Feedback collection gathers what users thought of each answer, explicitly with ratings and implicitly from what they did next, keyed to the trace so it can be investigated and turned into evaluation cases.",
    concept:
      "**Feedback collection** attaches a judgement to each model answer. Explicit feedback: a thumbs up or down, a star rating, an optional comment, a 'this was wrong' button. Implicit feedback: the user re-asked the same question, escalated to a person within minutes, copied the answer, abandoned the conversation, accepted or rejected a suggested edit, or completed the task the answer was meant to enable.\n\nEach signal is stored against the trace id, so a thumbs-down opens the exact prompt, sources and reply. Rates are tracked over time by feature, prompt version and model id. The negative cases are triaged weekly: real failures become evaluation cases, content gaps become articles, and recurring complaints become prompt changes.\n\nFeedback is biased (angry users click more than happy ones) and sparse (most users click nothing), so it is a trend and a source of cases, not a precise score.",
    why:
      "Evaluation sets measure what you thought to test; feedback measures what users actually experienced. It is the only signal that catches failures nobody anticipated, and it is the cheapest source of realistic evaluation cases. Tracked by version, it also answers whether a change helped real users, which an offline evaluation cannot promise. Without feedback, a feature can pass every test and still be disliked, and the team will not know.",
    how: [
      "Add explicit controls under every answer: thumbs up/down, an optional comment, and for structured features an 'incorrect' flag per field.",
      "Record implicit signals from the product: re-asks (near-duplicate question within a session), escalations, task completion, acceptance of suggestions, session abandonment.",
      "Store each signal with the trace id, timestamp and user hash; verify the user owns the trace.",
      "Chart rates by feature, prompt version and model id; alert on a rise in negative rate after a deploy.",
      "Weekly: review negative traces grouped by retrieved article or intent; create evaluation cases, fix content, adjust prompts; close the loop by checking the rate the following week.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Signal", "Explicit or implicit", "Volume", "What it tends to mean"],
        rows: [
          ["thumbs down + comment", "explicit", "~1–3% of answers", "a clear failure; best source of eval cases"],
          ["thumbs up", "explicit", "~2–5%", "a good answer; useful for pairwise comparisons"],
          ["re-ask within 2 minutes", "implicit", "~5–10%", "the answer did not land; often retrieval or scope"],
          ["escalation to a person", "implicit", "~3–8%", "the feature failed or the task was out of scope"],
          ["copied the answer / completed the task", "implicit", "varies", "success"],
          ["abandoned mid-conversation", "implicit", "varies", "slow, wrong or confusing"],
        ],
      },
      caption: "Implicit signals have ten times the volume of explicit ones; explicit ones have the detail.",
    },
    everyday: {
      title: "The comment card and the empty plates",
      text: "A restaurant gets a handful of comment cards a week, mostly from the angry and the delighted. The kitchen learns more from the plates coming back: which dishes are left half-eaten, which tables ask for the bill early. Both matter. The cards say what went wrong; the plates say how often.",
    },
    engineering: {
      title: "Closing the loop in a coding assistant",
      text: "An IDE assistant tracked whether users accepted, edited or rejected each suggested code change: an implicit signal with 100% coverage. Acceptance by prompt version showed a new 'be more thorough' prompt lowered acceptance from 61% to 48% because suggestions got longer and touched more lines. Explicit thumbs-down comments ('too many changes') confirmed it. The team reverted, then added a per-suggestion size limit; acceptance rose to 66%. Explicit feedback had the reason; implicit feedback had the statistical power to see it within a day.",
    },
    maths: {
      formula: "negative rate = negative signals ÷ answers;   detectable change ≈ 2 × √(rate × (1 − rate) ÷ n) for a given sample n",
      meaning: "A rate from few samples is noisy; the formula gives the size of change you can trust to be real for a sample size. Implicit signals win because n is large.",
      worked: [
        "Thumbs-down at 2% with 400 rated answers per day: noise ≈ 2 × √(0.02 × 0.98 ÷ 400) = 2 × 0.007 = 1.4 points. A rise from 2% to 3% is within noise in one day; over a week (2,800 ratings) the noise is 0.5 points and a 1-point rise is real.",
        "Re-ask rate at 8% over 12,000 conversations per day: noise ≈ 2 × √(0.08 × 0.92 ÷ 12,000) = 0.5 points per day. A rise to 10% is detected on the day.",
        "Acceptance in the IDE case: 61% vs 48% over 9,000 suggestions each: noise ≈ 1 point; a 13-point drop is unmistakable within hours.",
      ],
    },
    useIt: "Add thumbs and a comment box to every answer, instrument the implicit signals your product already has, store everything by trace id, and chart rates by version. Hold a weekly triage of negative traces that ends in new evaluation cases and content fixes, and check next week's rate to confirm the fix landed.",
    takeaways: ["Explicit feedback has the detail; implicit feedback has the volume.", "Key everything to the trace id so a rating opens the exact chain.", "Chart rates by prompt and model version; alert on rises after deploys.", "Triage weekly: negative traces become evaluation cases and content fixes."],
    terms: [["explicit feedback", "a rating or comment the user gives on purpose"], ["implicit feedback", "a signal inferred from what the user did next"], ["triage", "the regular review that turns negative feedback into fixes and test cases"]],
    reflect: { q: "Thumbs-down fell from 3% to 1% after you removed the thumbs buttons from the mobile app. Did quality improve?", a: "No; the measurement changed. Feedback rates are only comparable when the controls, their placement and the population are constant. Compare implicit signals, which did not change, before celebrating." },
  },

  "m41-continuous-evaluation": {
    simple: "Continuous evaluation runs the evaluation suite on a schedule and on every change, with fresh cases drawn from production, so quality is a trend line rather than a launch-day number.",
    concept:
      "An evaluation suite (Module 37) is a set of cases with graders. **Continuous evaluation** is running it continuously: before every prompt or model change as a gate, on a schedule against the unchanged system to catch drift, and against a sample of live traffic to catch what the fixed cases miss. The results go to the same dashboard as latency and cost, per category and per version, with a baseline and an alert.\n\nThe suite itself is kept alive. Negative feedback and production errors become new cases; cases that no longer resemble traffic are retired; time-sensitive cases are refreshed. A model grader scores the sample of live traffic daily for properties that cannot be checked by code (faithfulness, tone), calibrated periodically against human grading.\n\nThe outcome is that 'is the feature getting better or worse' has an answer every day, with the cause attributable to a date and a version.",
    why:
      "Quality changes for reasons that happen on no particular day: model updates, data drift, content changes, a slowly growing prompt. A suite run only on deploys misses all of them. And fixed cases go stale, so a suite that passed at launch can pass forever while users leave. Continuous evaluation turns the suite from a launch gate into a monitor, and the production sample keeps it honest about what users actually ask.",
    how: [
      "Gate: run the suite in CI on every prompt, retrieval or model change; block the merge on a category regression beyond tolerance.",
      "Schedule: run the suite nightly or weekly against production configuration with no changes; chart per-category scores over time.",
      "Sample: each day, draw a random sample of production traces (plus every negative-feedback trace), grade them with code checks and a calibrated model grader, and chart the scores.",
      "Grow: add cases from negative feedback and errors; retire cases that no longer match traffic; refresh time-sensitive ones quarterly.",
      "Calibrate: monthly, a person grades 30 sampled answers; compare with the model grader; fix the rubric if agreement drops.",
    ],
    visual: {
      kind: "flow",
      steps: ["change proposed → suite in CI (gate)", "nightly suite on prod config (drift)", "daily graded sample of live traffic (coverage)", "scores by category and version on the dashboard", "alerts on regression", "negative traces → new cases; stale cases retired"],
      caption: "Three loops at three cadences, feeding one chart and one case file.",
    },
    everyday: {
      title: "Health checks instead of a single medical",
      text: "A medical on the day you were hired says nothing about your health two years later. Annual check-ups with the same measurements, plus paying attention when something hurts, catch problems while they are small. The evaluation suite is the medical; continuous evaluation is the schedule and the symptom log.",
    },
    engineering: {
      title: "The slow slide that the nightly run caught",
      text: "A recruiting platform's CV-summary feature passed its 300-case suite at 95% on launch. The nightly run, charted over months, showed 95, 95, 94, 94, 93, 93, 92: a slide with no deploys. The production sample's model grader flagged 'missing recent roles' as the failing property. Cause: CVs had grown longer (data drift) and the chunking cut off the most recent experience. The fix was a chunking change; the nightly chart went back to 95 and stayed. A deploy-only evaluation would never have run.",
    },
    maths: {
      formula: "regression if score(category) < baseline(category) − tolerance, where tolerance ≈ 2 × √(p(1 − p) ÷ n) for n cases at pass rate p",
      meaning: "The tolerance is the sampling noise of the suite itself; a drop beyond it is real. More cases per category give a tighter tolerance.",
      worked: [
        "A category with 50 cases at 94%: tolerance = 2 × √(0.94 × 0.06 ÷ 50) = 2 × 0.034 = 6.7 points. Only a drop below 87% can be trusted as real. Too coarse.",
        "The same category grown to 200 cases: tolerance = 2 × √(0.0564 ÷ 200) = 3.4 points: a drop below 90.6% is real.",
        "The daily production sample of 400 traces graded at 91%: tolerance 2.9 points. The nightly slide from 95 to 92 over months is beyond tolerance at every step of 3 or more, and the trend direction over seven points is itself the signal.",
      ],
    },
    useIt: "Run the suite as a CI gate, a nightly monitor and a daily graded production sample, all charted together by category and version. Give the case file an owner and a weekly intake from feedback. Report quality as a trend with dated annotations, next to cost and latency.",
    takeaways: ["Evaluate continuously: on change (gate), on a schedule (drift), and on live samples (coverage).", "Grow the case file from production; retire stale cases; refresh time-sensitive ones.", "Calibrate the model grader against people monthly.", "Quality becomes a trend line with attributable causes."],
    terms: [["continuous evaluation", "running evaluations on change, on a schedule and on live samples"], ["production sample", "a daily random draw of real traces, graded"], ["tolerance", "the sampling noise of a suite's score; drops beyond it are real"]],
    reflect: { q: "Why grade a random production sample when you already have a 300-case suite?", a: "The suite tests what you thought to include; the sample tests what users actually ask this week, including topics the suite does not cover. It is also where new cases come from." },
  },

  "m41-model-version-management": {
    simple: "Model version management treats the model, the prompt, the retrieval index and the settings as one versioned release that is staged, compared, rolled out gradually and rolled back as a unit.",
    concept:
      "A model-backed feature's behaviour is determined by several things at once: the model id, the system prompt text, the tool definitions, the sampling settings, the retrieval index and chunking, the reranker, and the guardrails. **Model version management** gives that whole bundle a version number, records it on every trace, and changes it through a release process: compare the candidate against the current version in staging with the evaluation suite, roll it out to a small share of traffic, watch the live metrics by version, then complete or roll back.\n\nThe version is a single label (for example release 2026.11.5) mapping to exact values of every component, stored in configuration, never in code paths that read 'latest'. Rollback is switching the label back, which takes seconds because the previous bundle is still deployed.\n\nThis is ordinary release engineering applied to a system whose most important parts are text and data rather than code.",
    why:
      "Teams version their code and leave the prompt in a database field, the model as an alias and the index rebuilt in place. Then quality changes and nobody can say what moved. Bundling the components into one version makes every change deliberate, comparable and reversible, and makes the version on a trace meaningful. It also enables the safe pattern of canary rollouts: a new prompt reaches 5% of users first, and the thumbs-down rate by version decides whether it reaches the rest.",
    how: [
      "Define the bundle: model id, prompt text (versioned in the repository), tool schemas, sampling settings, retrieval index id and chunking parameters, reranker version, guardrail config.",
      "Give each bundle a release label; store the mapping in configuration; stamp the label on every trace.",
      "Stage: run the evaluation suite on the candidate and the current bundle side by side; compare per category; run pairwise judgements for tone changes.",
      "Canary: route 5–10% of traffic to the candidate; watch error, feedback, latency and cost by version for a day.",
      "Promote to 100% or roll back by switching the label; keep the previous bundle deployed for a week.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Component", "Where it lives", "Example value in release 2026.11.5"],
        rows: [
          ["model", "config", "pinned support model, exact version"],
          ["system prompt", "repository file, reviewed", "support-prompt v31"],
          ["tool schemas", "repository", "tools v12"],
          ["sampling", "config", "temperature 0.2, max_tokens 400"],
          ["retrieval index", "index id", "help-index 2026-11-04, chunk 400/overlap 1 para"],
          ["reranker", "config", "reranker v3"],
          ["guardrails", "config", "input/output policy v7"],
        ],
      },
      caption: "One label, seven exact values. Change any one and the label changes.",
    },
    everyday: {
      title: "A recipe card with every ingredient's brand and batch",
      text: "A bakery that writes down only 'flour, butter, sugar' cannot explain why Tuesday's croissants were worse; one that records the flour's mill and batch, the butter's brand and the oven's setting can, and can go back to Monday's card. A release bundle is the full recipe card for a model feature.",
    },
    engineering: {
      title: "A canary that saved a bad prompt from reaching everyone",
      text: "A telecom's assistant team prepared release 2026.11.5 with a shorter, friendlier prompt. The staged evaluation passed (97%, baseline 96%). The canary at 10% ran for six hours: thumbs-down 2.1% on the new version against 2.0% on the old, fine; but escalation-to-agent rose from 4% to 7% on the new version. The friendlier prompt was softening policy answers (the evaluation had three such cases; production had hundreds). They rolled back by switching the label, added forty policy cases to the suite, fixed the prompt, and shipped two days later. Ninety percent of users never saw the bad version.",
    },
    maths: {
      formula: "canary decision: compare metric(candidate) with metric(current) over the same window; require n large enough that the difference exceeds 2 × √(p(1 − p)(1 ÷ n₁ + 1 ÷ n₂))",
      meaning: "Both versions run at the same time, so traffic shifts affect both equally; the difference is attributable to the version once the sample is big enough.",
      worked: [
        "Escalation rate: current 4.0% on 9,000 conversations; candidate 7.0% on 1,000 (the 10% canary).",
        "Noise ≈ 2 × √(0.043 × 0.957 × (1 ÷ 9,000 + 1 ÷ 1,000)) = 2 × √(0.0411 × 0.00111) = 2 × 0.00676 = 1.35 points.",
        "Difference 3.0 points > 1.35: real. Roll back.",
        "Thumbs-down: 2.0% vs 2.1%, noise ≈ 2 × √(0.02 × 0.98 × 0.00111) = 0.93 points; difference 0.1: not distinguishable. Fine on that metric, which is why several metrics are watched.",
      ],
    },
    useIt: "Bundle model, prompt, tools, settings, index and guardrails into a release label stored in configuration and stamped on traces. Stage with the evaluation suite, canary with live metrics by version, promote or roll back by label. Keep the previous bundle deployed; rollback should be a switch, not a deploy.",
    takeaways: ["A model feature's version is the bundle: model, prompt, tools, settings, index, guardrails.", "One label, stored in config, stamped on every trace.", "Stage with evals, canary with live metrics by version, promote or roll back by switching the label.", "No aliases, no 'latest', no in-place index rebuilds without a new id."],
    terms: [["release bundle", "the set of exact component versions that together define a feature's behaviour"], ["canary rollout", "sending a small share of traffic to a new version and comparing metrics"], ["rollback", "switching the release label back to the previous bundle"]],
    reflect: { q: "The prompt lives in a database field that product managers edit directly. What is the first change you would make?", a: "Move it into the repository with review, give it a version, and include that version in the release bundle stamped on traces. Edits still happen, but each one becomes a dated, reviewable, comparable, reversible change." },
  },

  "m41-incident-response": {
    simple: "Incident response for AI features is the practised routine for when the assistant is down, slow, expensive or wrong: detect, mitigate with a switch, communicate, find the cause from traces, fix, and learn.",
    concept:
      "An **incident** is anything that harms users or the business now: the provider is down, latency has tripled, cost has spiked, the model is giving wrong or unsafe answers, a prompt injection is leaking data. **Incident response** is the routine that handles it. Detection comes from the alerts of earlier lessons. Mitigation comes first and should be a switch, not a fix: fall back to another model, roll back the release label, disable a tool, turn on a degraded mode, or take the feature offline with an honest message. Then communication: status page, support team, affected customers. Then diagnosis from traces, a proper fix, and a written review of what happened and what will prevent it.\n\nThe AI-specific part is the extra kinds of incident (wrong answers, cost runaways, injections) and the extra switches that must exist in advance (fallback model, degraded mode, tool kill switch, prompt rollback). An incident is handled well when those switches are already built.",
    why:
      "Model features fail in ways ordinary services do not, and at unusual times: a provider's bad afternoon, a model update, a viral prompt that breaks guardrails. Teams without a routine improvise under pressure, debug before mitigating, and leave users with a spinner for an hour. A practised response with pre-built switches turns most incidents into a few minutes of degraded service that nobody notices, and a written review turns each one into a new alert, a new evaluation case or a new guardrail.",
    how: [
      "Prepare: build the switches (fallback model, release rollback, tool kill switch, degraded mode, feature off) and document who can flip them; define severity levels and an on-call rota; write a runbook per alert.",
      "Detect: alerts from latency, error, cost, feedback and guardrail monitors page the on-call engineer with example trace ids.",
      "Mitigate first: flip the switch that stops the harm within minutes; do not debug yet.",
      "Communicate: status page and support team within 15 minutes; affected customers if answers were wrong or data was exposed.",
      "Diagnose from traces: when did it start, which version, which model id, which inputs; find the cause.",
      "Fix, verify with the evaluation suite and a canary, restore the normal path.",
      "Review within a week: timeline, cause, what detected it, what mitigated it, actions (new alert, case, guardrail, switch); no blame.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Incident type", "Detected by", "First switch", "Typical cause"],
        rows: [
          ["provider outage or degradation", "error rate, TTFT alerts", "fallback model; circuit breaker", "provider incident"],
          ["wrong answers after a change", "feedback, escalation, eval regression by version", "roll back the release label", "prompt edit, model update, stale index"],
          ["cost spike", "cost per conversation, tokens per request", "cap inputs; disable the expensive path; rate-limit a tenant", "prompt growth, retry loop, abusive client"],
          ["unsafe output or data leak", "guardrail hits, user report", "feature off; tool kill switch", "prompt injection, guardrail gap"],
          ["agent runaway", "step budget exits, cost", "pause the agent; lower budgets", "missing stop condition, tool returning the same error"],
        ],
      },
      caption: "Every row has a switch that exists before the incident. Building the switch is the preparation.",
    },
    everyday: {
      title: "A fire drill",
      text: "Nobody reads the evacuation plan during a fire. The drill means people walk to the exit without thinking, the extinguisher is where it should be, and the warden counts heads. Incident response is the drill: the switches are the extinguishers, the runbook is the plan, and the review is the walk-through afterwards.",
    },
    engineering: {
      title: "A Friday-afternoon provider degradation, handled in nine minutes",
      text: "At 16:02 a logistics company's assistant p95 TTFT rose past 4 seconds and the error rate hit 6%; the alert paged on-call at 16:04 with three trace ids showing provider timeouts. Runbook step one: flip the fallback model. Done at 16:07; metrics normal at 16:09. Status page updated at 16:11. Diagnosis from traces confirmed the primary provider; their status page acknowledged it at 16:40. The team ran the evaluation suite against the fallback (2 points lower, acceptable), switched back at 19:30 when the primary recovered, and the Monday review added an automatic circuit breaker so the next one needs no human.",
    },
    maths: {
      formula: "user harm ≈ affected requests per minute × minutes until mitigation;   time to mitigate = detection delay + paging delay + decision time + switch time",
      meaning: "Harm scales with how long the problem lasts, and mitigation time is a sum of delays that preparation shrinks: alerts cut detection, runbooks cut decision time, switches cut switch time.",
      worked: [
        "Degradation at 16:02, 150 requests per minute affected. Detection at 16:04 (2 min), paging 0 min, decision 3 min (runbook), switch 2 min: mitigated at 16:09. Harm ≈ 150 × 7 = 1,050 degraded requests.",
        "Without alerts or runbook: noticed by support at 16:40 (38 min), engineer found at 16:50, debugged until 17:20, deployed a fix at 17:35: 93 minutes. Harm ≈ 150 × 93 = 13,950 requests, thirteen times more.",
        "With an automatic circuit breaker: detection and switch within 30 seconds; harm ≈ 150 × 0.5 = 75 requests.",
      ],
    },
    useIt: "Build the switches before launch and test them monthly; write a runbook per alert naming the switch; mitigate before diagnosing; communicate early; review every incident into concrete actions. The measure of maturity is time to mitigate, and the goal is for the common incidents to need no human at all.",
    takeaways: ["Prepare switches in advance: fallback model, release rollback, tool kill switch, degraded mode, feature off.", "Mitigate first, then communicate, then diagnose from traces.", "Harm scales with time to mitigate; alerts, runbooks and switches shrink it.", "Every incident ends in a review with actions: alerts, cases, guardrails, automation."],
    terms: [["incident", "an event harming users or the business now"], ["runbook", "the written steps for responding to a specific alert"], ["kill switch", "a pre-built control that disables a tool, path or feature instantly"]],
    reflect: { q: "Why mitigate before diagnosing, when diagnosis might reveal a quicker fix?", a: "Because users are being harmed every minute, the switch takes seconds, and diagnosis takes an unknown time. Stop the harm, then take as long as the cause needs. The rare case where the switch is worse than the incident is why switches are tested in advance." },
  },

  "m41-production-reliability": {
    simple: "Production reliability for an AI feature is a target for how often it works, measured by the user's definition of 'works', and the budget, redundancy and operational habits that keep it there.",
    concept:
      "**Production reliability** is the share of requests that do what the user needed, measured over time, against a target. For an AI feature the definition of success is stricter than 'returned 200': the answer arrived within the latency target, was not a soft error (refusal, schema failure, truncated, fallback-degraded beyond tolerance), and was not flagged wrong. That success rate is the service level indicator; the target (say 99.5% over a month) is the service level objective; the allowed failures (0.5%) are the error budget.\n\nReliability is engineered with redundancy (fallback models and providers, replicas, queues), limits (timeouts, retries with backoff, budgets, rate limits, circuit breakers), and operations (monitoring, incident response, continuous evaluation, deliberate releases). The error budget is the decision tool: spend it on risky changes when it is full, freeze changes and fix reliability when it is empty.",
    why:
      "Users decide whether a feature is reliable by whether it worked for them, not by its uptime. A feature at 99.9% HTTP availability with 8% soft errors is 92% reliable. Defining success honestly and setting a target makes reliability a number the team can manage, trade off against speed of change, and report to the business. It also stops two failure modes: endless gold-plating of a feature that is already reliable enough, and shipping changes into a feature that is already burning its users.",
    how: [
      "Define success per feature in user terms: on time, not a soft error, not flagged wrong. Compute it from traces as the SLI.",
      "Set the SLO from what users and the business need (99.5% for a support assistant; 99.9% for a payment-adjacent tool) and derive the monthly error budget.",
      "Engineer for it: fallback model and provider, replicas across zones, queues for background work, timeouts, retries with backoff, idempotent writes, circuit breakers, budgets on agents.",
      "Operate it: the monitors, alerts, incident response and continuous evaluation of this module; release through staged canaries.",
      "Review the budget weekly: full budget allows risky changes; a depleted budget freezes features until reliability work restores it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Mechanism", "Protects against"],
        rows: [
          ["redundancy", "fallback model and provider; replicas; multi-zone", "provider and infrastructure outages"],
          ["limits", "timeouts; capped retries with backoff; rate limits; budgets; circuit breakers", "cascading failures, runaways, cost spikes"],
          ["correctness", "schema validation; guardrails; idempotent writes; approval gates", "bad outputs and double actions"],
          ["change control", "release bundles; staged evals; canaries; rollback", "regressions from changes"],
          ["operations", "tracing; dashboards; alerts; on-call; reviews", "slow detection and repeat incidents"],
        ],
      },
      caption: "Reliability is the sum of the layers; the error budget says how much to invest in each.",
    },
    everyday: {
      title: "A railway's punctuality target",
      text: "A railway does not promise that no train is ever late; it promises that 95% arrive within five minutes, measures it, publishes it, and when the number slips it cancels engineering changes and fixes the signals. Passengers judge the railway by that number, not by whether the stations were open. An error budget is the railway's punctuality target for an AI feature.",
    },
    engineering: {
      title: "Spending and protecting the budget",
      text: "A SaaS company set a 99.5% monthly SLO for its document assistant, defined as answered within 10 seconds, not a soft error, and not rated wrong. In March the budget was healthy at mid-month (99.8%), so they shipped a new retrieval pipeline through a canary. In April a provider degradation plus a prompt regression consumed the budget by the 12th (99.3%); the policy froze feature releases and the team spent two weeks adding a second provider as fallback and a circuit breaker. May ran at 99.9%. The number made both decisions obvious instead of political.",
    },
    maths: {
      formula: "SLI = successful requests ÷ total requests;   error budget = (1 − SLO) × requests in the period;   budget remaining = error budget − failures so far",
      meaning: "Success is defined by the user's outcome. The budget is a count of allowed failures; spending it is a decision, exhausting it is a signal.",
      worked: [
        "SLO 99.5% over a month of 1,800,000 requests: error budget = 0.005 × 1,800,000 = 9,000 allowed failures.",
        "By the 12th: 720,000 requests, failures = 2,400 soft errors + 1,100 timeouts + 1,560 rated wrong = 5,060. SLI so far = 1 − 5,060 ÷ 720,000 = 99.30%. Budget remaining = 9,000 − 5,060 = 3,940 for the remaining 1,080,000 requests, which requires 99.64% from here on: freeze and fix.",
        "A healthy month: 1,800 failures by the 15th out of 900,000: SLI 99.8%; budget remaining 7,200: room for a risky release.",
      ],
    },
    useIt: "Define success in user terms and compute it from traces; set an SLO and track the error budget on the main dashboard; let the budget decide when to ship risk and when to fix reliability. Build the redundancy and limits of the table before launch, and treat every incident review as a deposit into next month's budget.",
    takeaways: ["Reliability is the share of requests that did what the user needed: on time, not a soft error, not wrong.", "SLI measured from traces; SLO as the target; error budget as the decision tool.", "Engineered with redundancy, limits, correctness checks and change control; sustained by operations.", "A full budget buys risk; an empty one freezes change."],
    terms: [["service level indicator (SLI)", "the measured success rate in user terms"], ["service level objective (SLO)", "the target for the SLI over a period"], ["error budget", "the failures the SLO allows; spent on risk, protected by reliability work"]],
    reflect: { q: "Why include 'rated wrong by the user' in the definition of failure, when it is subjective and sparse?", a: "Because it is the only signal for the failure users care most about, and leaving it out makes a confidently wrong assistant look perfectly reliable. Its sparseness is handled by combining it with implicit signals and the graded production sample; its subjectivity is handled by trend, not absolute value." },
  },
};

export const M41_QUIZ: Quiz[] = [
  {
    q: "A user complains that Thursday's answer was wrong. You re-ask the question today and get a correct answer. What does that prove?",
    options: ["The user was mistaken", "Nothing: the prompt version, retrieved sources and random sample may all differ now", "The model fixed itself", "The complaint is out of the retention window"],
    answer: 1,
    why: ["It proves nothing about Thursday either way.", "Correct. Only the trace recorded on Thursday shows what the model was told and why it answered as it did.", "Models do not fix themselves; something in the chain changed.", "Retention is irrelevant to whether a re-run reproduces the past."],
    reason: true,
  },
  {
    q: "Input token count per request is flat, but input cost rose 2.5× overnight. Which metric explains it?",
    options: ["Output tokens", "Cache share dropped because variable content moved before the cache marker", "p95 latency", "Fallback rate"],
    answer: 1,
    why: ["Output did not change the input cost.", "Correct. Cached tokens cost about a tenth of full price; losing the cache multiplies input cost without changing the count.", "Latency is a symptom, not the cost driver here.", "Fallback changes the model, which could change price, but the clue points at caching."],
  },
  {
    q: "Which of these is a soft error that an HTTP uptime monitor cannot see?",
    options: ["A 503 from the provider", "A reply that fails schema validation", "A TCP timeout", "An out-of-memory crash"],
    answer: 1,
    why: ["A 503 is a hard error the monitor sees.", "Correct. The call returned 200 with content that does not do the job; only validation on the reply detects it.", "A timeout is a hard error.", "A crash is a hard error."],
  },
  {
    q: "Evaluation scores are steady at 92% while thumbs-down doubled. The intent mix shows a new category at 22% of traffic with low retrieval scores. What is happening?",
    options: ["Model drift", "Data drift: the inputs changed and the evaluation set no longer resembles production", "A latency problem", "The feedback buttons are broken"],
    answer: 1,
    why: ["The model passes its evaluation; it did not move.", "Correct. New questions arrived that neither the content nor the evaluation set covers.", "Nothing points at latency.", "Doubling with a clear cause in the intent mix is real."],
    reason: true,
  },
  {
    q: "Why monitor p95 latency rather than the average?",
    options: ["Averages are harder to compute", "The tail is where user complaints come from, and the average hides it", "p95 is always lower", "Providers report only p95"],
    answer: 1,
    why: ["Averages are trivial to compute.", "Correct. A shift in the slowest 5% barely moves the mean but is exactly what users notice.", "p95 is higher than the mean for latency.", "Providers report various numbers; the reason is user experience."],
  },
  {
    q: "A canary sends 10% of traffic to a new release. Escalation rate is 7% on the canary versus 4% on the current version with enough samples to be significant. What do you do?",
    options: ["Promote to 100%, since the evaluation suite passed", "Roll back by switching the release label, add cases for the failure, fix, re-canary", "Wait a week", "Increase the canary to 50% to confirm"],
    answer: 1,
    why: ["The suite missed what production found; production wins.", "Correct. Rollback is a switch; the failure becomes evaluation cases; then try again.", "More users harmed for no new information.", "Exposing more users to a known regression is the wrong way to confirm it."],
  },
  {
    q: "The provider is degraded and p95 TTFT has tripled. What is the first action?",
    options: ["Open a ticket with the provider", "Start debugging the retrieval pipeline", "Flip the fallback model switch, then communicate, then diagnose", "Raise max_tokens"],
    answer: 2,
    why: ["Useful later; it does not stop the harm.", "The stage split already points at the model span, and debugging comes after mitigation.", "Correct. Mitigate with a pre-built switch within minutes, then the rest.", "Irrelevant and would slow things further."],
  },
  {
    q: "A feature's SLI is defined as 'returned HTTP 200'. What is wrong with it?",
    options: ["Nothing; that is the standard", "It counts refusals, schema failures, truncations and wrong answers as successes", "It is too strict", "It cannot be computed from traces"],
    answer: 1,
    why: ["Standard for a plain API; wrong for a model feature.", "Correct. Success must be defined in user terms: on time, not a soft error, not wrong.", "It is far too lenient.", "It can; it just measures the wrong thing."],
  },
];

export const M41_EXERCISES: Exercise[] = [
  {
    title: "Design the trace for a RAG request",
    kind: "build",
    task: "List the spans, and the fields on each, that a trace must record for a retrieval-augmented support answer so that every lesson in this module can be answered from it: cost, latency by stage, soft errors, drift, feedback, version. Mark which fields are redacted.",
    hints: ["Think of each later dashboard and ask which field it needs.", "Versions and ids go on the model span; identity is a hash on the root."],
    solution: "Root: trace id, feature, tenant id, user hash, release label, started/ended, client-visible ref. retrieve: query (redacted), filters, chunk ids, scores, duration. rerank: candidate ids, scores, duration, reranker version. model: model id, prompt version, full system prompt and messages (redacted), tools offered, sampling settings, reply (redacted), stop reason, input/cached/output tokens, TTFT, duration, cost from the dated price table. Each tool: name, arguments (redacted), result (redacted), is_error, duration. Classification: soft-error flags (schema fail, decline, cap hit, empty retrieval, fallback served), intent category. Feedback: rating, comment (redacted), implicit signals, timestamps, keyed by trace id. With these, cost, latency by stage, error rates, drift (intent mix, retrieval scores) and version comparisons are all queries.",
  },
  {
    title: "Compute the error budget and decide",
    kind: "calculate",
    task: "A feature has an SLO of 99.7% per month. The month is expected to have 2,400,000 requests. By day 10 (800,000 requests) there have been 1,300 timeouts, 900 schema failures and 600 answers rated wrong. What is the SLI so far, how much budget remains, what rate is needed for the rest of the month, and should the team ship a risky retrieval change this week?",
    hints: ["Budget = (1 − SLO) × expected requests.", "Needed rate = 1 − remaining budget ÷ remaining requests."],
    solution: "Budget = 0.003 × 2,400,000 = 7,200 allowed failures. Failures so far = 2,800. SLI so far = 1 − 2,800 ÷ 800,000 = 99.65%, slightly below the 99.7% target pace. Remaining budget = 4,400 over 1,600,000 remaining requests: needed rate = 1 − 4,400 ÷ 1,600,000 = 99.725%. The team must do better than target for the rest of the month just to meet it; shipping a risky change now would likely exhaust the budget. Decision: hold the change, investigate the 1,300 timeouts (the largest bucket) and the schema failures first, ship the change through a canary once the budget is back above pace.",
  },
  {
    title: "Classify three incidents and name the switch",
    kind: "think",
    task: "For each situation, name the alert that should detect it, the first switch to flip, and one review action: (a) after a Tuesday deploy, decline rate rose from 5% to 14%; (b) one tenant's token usage is 40× the median and climbing; (c) the assistant quoted an internal discount policy to a customer.",
    hints: ["Mitigate first; the switch should already exist.", "Each review action should prevent the repeat or shorten the next detection."],
    solution: "(a) Detected by the decline-rate alert against baseline, split by release label; switch: roll back the release label to Monday's bundle; review: add the declined questions as evaluation cases and gate declines in CI. (b) Detected by the per-tenant daily token alert; switch: rate-limit or pause that tenant's API key and cap tokens per request; review: per-tenant budgets enforced in code and a usage-based pricing tier. (c) Detected by a guardrail hit or a user report (and a retrieval audience filter failing); switch: feature off or disable retrieval of staff-only documents immediately; review: enforce audience filtering in the retrieval query, add a restricted-document test that runs as a low-privilege user, and notify the affected customer.",
  },
  {
    title: "Tell model drift from data drift",
    kind: "think",
    task: "You have eight weekly evaluation scores and the model id on every trace. Describe the two charts you would look at, what pattern each shows for model drift versus data drift, and the first response to each.",
    hints: ["A step on a date versus a slope over weeks.", "One of them keeps the evaluation score high while users complain."],
    solution: "Chart 1: evaluation score over weeks, annotated with the model id in use. A sudden step coinciding with a model id change is model drift: response, pin the previous version and migrate deliberately. A gradual slope with the same model id, with the time-sensitive cases failing, is knowledge ageing: response, move changing facts to retrieval and refresh cases. Chart 2: intent mix and retrieval best-score distribution against the reference window. A new or grown category with low retrieval scores while the evaluation score stays high is data drift: response, add content for the category, sample recent traffic into the evaluation set, adjust prompts or retrain classifiers.",
  },
];
