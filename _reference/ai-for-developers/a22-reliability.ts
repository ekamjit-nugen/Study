import type { StoryPage, Topic } from "../types";

// AI 3.10: reliability: retries, rate limits, timeouts, fallbacks.

const SETTING = "The same online furniture shop. The Help page chat box, the returns agent and the nightly tagger all call one model provider with one API key. The chat server calls the SDK with default settings. The returns agent's refund tool calls the payment service. The shop runs a sale on the last Friday of November, when traffic is five times normal.";
const CAST = "**Dev** (developer) is on call. **Nisha** (support lead) watches the chat go quiet. **Kabir** (owner) sees two refunds for one order. **Priya** (product manager) asks what the customer should see when the model is down.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "On sale day the provider slowed, then returned 'overloaded', then 'rate limit exceeded'. The chat hung for a minute per question, the server's retries multiplied the load, the tagger ate the shared rate limit, and a refund ran twice after a timeout.",
    title: "The afternoon the provider had a bad day",
    text: "Sale Friday, 2 pm. The provider's status page turns yellow. Dev's traces show model spans taking 40, then 60 seconds, then failing with HTTP 529, 'overloaded'. The chat page shows a spinner for a full minute before giving up with 'Something went wrong'. Nisha's queue fills with 'is the chat broken?'.\n\nIt gets worse on its own. The chat server's code wraps every call in a loop that retries immediately, three times, so every slow request becomes four. Someone had started the tagger early, and its 10,000 requests share the same API key and the same tokens-per-minute limit as the chat, so customers start getting HTTP 429, 'rate limit exceeded', while emails nobody will read until Monday get tagged.\n\nAnd the one that reaches Kabir: a returns-agent run called the refund tool, the payment service timed out after 30 seconds, the agent's retry called it again, and a customer was refunded twice.\n\n**This is the problem.** Every network call can be slow, fail, or succeed without saying so. The code assumed calls succeed quickly. When they did not, the retries, the shared limit and the un-keyed write turned a provider's bad afternoon into the shop's.",
  },
  {
    stage: "why",
    point: "A model call is a slow, rate-limited, sometimes-unavailable network call that bills by the token. Timeouts, backoff, limits, idempotency and a fallback are not extras; they are what makes a call safe to make at all.",
    title: "Why the defaults were a bet",
    text: "Four assumptions were baked into the code, and sale day broke all of them.\n\nThat a call finishes in a reasonable time. Without a timeout, a slow provider holds every connection open and the customer waits for whatever the socket allows. That retrying helps. Immediate retries on an overloaded service add load to the thing that is overloaded; the only retry that helps is a spaced one, on errors that mean 'try again later', and never on errors that mean 'you asked wrongly'. That capacity is unlimited. Rate limits are per key and per minute; the chat and the tagger were competing for one bucket, and the loser was the customer. That a failed call did nothing. A timeout means 'no answer', not 'no effect': the refund may well have gone through. A write that is retried must be made safe to repeat, or not retried at all.\n\nAnd one missing piece: when the provider is truly down, what should the customer see? 'Something went wrong' after a minute is the worst answer. A fast, honest fallback is a design decision, and nobody had made it.",
  },
  {
    stage: "concept",
    point: "Six rules: timeouts on everything; retry only retryable errors, with exponential backoff and jitter, respecting Retry-After; a concurrency and token budget per feature; idempotency keys on every write; a circuit breaker; and a fallback path decided in advance.",
    title: "The six rules",
    text: "**Timeouts.** Every call has a deadline: a few seconds to connect, a sensible total (chat: 30 seconds; tools: 10), and for streams an idle timeout so a stalled stream does not hang forever.\n\n**Retries with backoff.** Retry on 429, 5xx, 529 and network errors; never on 400 or 401 (the request is wrong, not the moment). Wait longer each time with randomness (jitter) so a thousand clients do not retry in step. Honour the provider's Retry-After header. Cap attempts at two or three.\n\n**Budgets per feature.** Each feature gets its own concurrency limit and tokens-per-minute share, so the tagger cannot starve the chat. Background work queues and waits; interactive work has priority. Ideally separate keys, which also separates the invoices.\n\n**Idempotency.** Every write tool call carries a key (the pending action id from lesson 3.2). The payment service treats a repeated key as 'already done' and returns the original result. A retry can then never double a refund.\n\n**Circuit breaker.** When failures cross a threshold, stop calling for a short cooling period and go straight to the fallback; probe occasionally; close the circuit when probes succeed. It protects both the provider and the customer's time.\n\n**Fallback.** Decided per feature in advance: a second model or provider with the same prompt, a cheaper mode (FAQ retrieval only, no generation), or an honest message within two seconds with a handoff to a person.",
    jargon: [["exponential backoff", "waiting longer before each retry: 1 s, 2 s, 4 s, so retries thin out instead of piling up"], ["jitter", "a random addition to each backoff wait, so many clients retrying at once spread out instead of hitting together"], ["circuit breaker", "a switch that stops calling a failing service for a while after repeated failures, then tests whether it has recovered"], ["idempotency key", "a unique id sent with a write so that a repeat of the same request is recognised and not performed twice"]],
    table: {
      head: ["Error", "Meaning", "Retry?", "Then"],
      rows: [
        ["429 rate limit", "too many requests or tokens this minute", "yes, after Retry-After", "queue background work; check per-feature budgets"],
        ["529 / 503 overloaded", "provider capacity", "yes, with backoff and jitter, 2–3 times", "breaker opens if it persists; fallback"],
        ["500 / network / timeout", "unknown outcome", "reads: yes; writes: only with an idempotency key", "record the attempt before retrying a write"],
        ["400 invalid request", "your request is wrong", "no", "fix the code; alert"],
        ["401 / 403", "key or permission", "no", "page the on-call"],
      ],
    },
  },
  {
    stage: "visual",
    point: "The SDK already retries with backoff and supports timeouts; configure it rather than writing loops. Wrap it with a per-feature limiter, a breaker and a fallback, and keep the same prompt for the fallback model.",
    title: "The resilient client",
    text: "Dev removes the hand-written retry loop and configures the SDK: a total timeout and a retry count with the SDK's built-in exponential backoff, which already respects Retry-After and skips non-retryable errors. Around it goes a small wrapper per feature: a concurrency limiter, a circuit breaker and a fallback model. The chat and the tagger get different instances with different limits and, after the incident, different keys.",
    codes: [
      {
        title: "llm.ts: configured client, limiter, breaker, fallback",
        lang: "ts",
        src: `import Anthropic from "@anthropic-ai/sdk";

const primary = new Anthropic({ apiKey: process.env.CHAT_API_KEY, maxRetries: 2, timeout: 30_000 });
const secondary = new Anthropic({ apiKey: process.env.FALLBACK_API_KEY, maxRetries: 1, timeout: 30_000 });

export function makeCaller(feature: string, opts: { concurrency: number; fallbackModel?: string }) {
  const limiter = pLimit(opts.concurrency);
  const breaker = new Breaker({ failures: 5, window: 60_000, cooldown: 30_000 });

  return async function call(params: MessageParams, signal?: AbortSignal) {
    return limiter(async () => {
      if (breaker.isOpen()) return fallback(params, signal);
      try {
        const reply = await primary.messages.create(params, { signal });
        breaker.success();
        return reply;
      } catch (e) {
        breaker.failure(e);
        if (!isRetryableAfterSdk(e)) throw e;              // 400/401/403: our bug, not the moment
        return fallback(params, signal);
      }
    });
  };

  async function fallback(params: MessageParams, signal?: AbortSignal) {
    if (!opts.fallbackModel) throw new Unavailable(feature);
    metrics.increment("llm.fallback", { feature });
    return secondary.messages.create({ ...params, model: opts.fallbackModel }, { signal });
  }
}

export const chatCall = makeCaller("help-chat", { concurrency: 40, fallbackModel: process.env.MODEL_SUPPORT_FALLBACK });
export const taggerCall = makeCaller("tagger", { concurrency: 4 });`,
        lines: [
          { sql: "const primary = new Anthropic({ apiKey: process.env.CHAT_API_KEY, maxRetries: 2, timeout: 30_000 });", say: "Two retries with the SDK's backoff and jitter, honouring Retry-After; a thirty-second ceiling. No hand-written loop." },
          { sql: "const limiter = pLimit(opts.concurrency);", say: "At most this many calls in flight for this feature. The tagger's four cannot crowd out the chat's forty." },
          { sql: "const breaker = new Breaker({ failures: 5, window: 60_000, cooldown: 30_000 });", say: "Five failures in a minute opens the circuit for thirty seconds: straight to fallback, no waiting on a dead provider." },
          { sql: "if (breaker.isOpen()) return fallback(params, signal);", say: "While open, the customer gets the fallback in milliseconds instead of a minute-long spinner." },
          { sql: "if (!isRetryableAfterSdk(e)) throw e;              // 400/401/403: our bug, not the moment", say: "A wrong request is thrown, logged and alerted. Falling back would hide a bug." },
          { sql: "return secondary.messages.create({ ...params, model: opts.fallbackModel }, { signal });", say: "The same prompt and tools on a second model (or provider). The fallback model is pinned and in the eval suite." },
          { sql: "export const taggerCall = makeCaller(\"tagger\", { concurrency: 4 });", say: "No fallback for background work: it can simply wait and try later. Its own key, its own limit." },
        ],
        note: "The signal lets a customer's Stop button (lesson 2.5) cancel the call, including during the fallback.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Writes are made safe to retry with an idempotency key recorded before the call; background work queues against its own budget; and the customer-facing fallback is designed to be fast and honest.",
    title: "Safe writes, patient queues, honest fallbacks",
    text: "The refund fix is small once lesson 3.2's action log exists: the pending action id becomes the idempotency key sent to the payment service, which stores results by key and returns the original on a repeat. The agent records the attempt before calling, so a timeout followed by a retry is one refund.\n\nThe tagger moves to a queue with a token-per-minute budget: it reads its allowance, sends what fits, and sleeps on 429 instead of hammering. It never runs during the sale window at all; the batch endpoint (lesson 3.9) is the better home anyway.\n\nPriya answers her own question about what the customer should see. Within two seconds of trouble: 'Our assistant is busy right now. Here are the help articles that match your question' (retrieval still works without the model), plus a button to leave a message for a person. Never a minute-long spinner, never 'something went wrong'.",
    codes: [
      {
        title: "A refund that cannot run twice",
        lang: "ts",
        src: `async function runRefund(pending: PendingAction) {
  await log.markAttempt(pending.id);                      // recorded before the call
  const res = await fetch(PAYMENTS_URL + "/refunds", {
    method: "POST",
    headers: { "Idempotency-Key": pending.id, "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: pending.orderId, amount: pending.amount }),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 409) return log.settle(pending.id, await res.json());   // already done: original result
  if (!res.ok) throw new RefundFailed(res.status);
  return log.settle(pending.id, await res.json());
}`,
        lines: [
          { sql: "await log.markAttempt(pending.id);                      // recorded before the call", say: "If the process dies mid-call, the next run sees an attempt in progress and checks the payment service before doing anything." },
          { sql: "headers: { \"Idempotency-Key\": pending.id, \"Content-Type\": \"application/json\" },", say: "The key is the pending action id. A retry sends the same key; the payment service recognises it." },
          { sql: "signal: AbortSignal.timeout(10_000),", say: "Ten seconds, then abort. Unknown outcome is handled by the key, not by waiting longer." },
          { sql: "if (res.status === 409) return log.settle(pending.id, await res.json());   // already done: original result", say: "A repeat is answered with the original refund, not a second one. Kabir's double refund becomes impossible." },
        ],
        note: "The same shape applies to any write tool: record, key, timeout, settle. Reads need none of it.",
      },
    ],
    table: {
      head: ["Feature", "Timeout", "Retries", "Concurrency / budget", "Fallback"],
      rows: [
        ["help chat", "30 s total, 15 s idle on stream", "2, backoff", "40 in flight, own key", "second model; then articles + leave a message"],
        ["returns agent", "30 s per call, 10 s per tool", "2 for reads; writes keyed", "10 in flight", "pause and hand to a person"],
        ["tagger", "60 s", "2, sleeps on 429", "4 in flight, own key, not during sales", "none; waits"],
      ],
    },
    ask: "The circuit breaker is open and a customer asks 'can I return a mattress?'. What exactly do they see, within how long, and what is logged?",
  },
  {
    stage: "compare",
    point: "A bare call with an immediate-retry loop turns a provider wobble into an outage, a flood and a double refund. Timeouts, backoff, budgets, keys, a breaker and a planned fallback turn it into a slow afternoon nobody notices.",
    title: "Hope, or the six rules",
    text: "Both versions call the same model with the same prompt. One assumes the network is kind; the other assumes it is not.",
    versus: {
      beginner: {
        title: "Default client, immediate retries, shared key, un-keyed writes",
        lang: "ts",
        code: "for (let i = 0; i < 3; i++) {\n  try { return await client.messages.create(params); }   // no timeout\n  catch { /* try again right now */ }\n}\n// tagger and chat share one key; refund has no idempotency key",
        points: ["Fine on a quiet Tuesday.", "A minute-long spinner, then 'something went wrong'.", "Retries multiply load on an overloaded provider; 400s are retried too.", "The tagger starves the chat; a timeout doubles a refund."],
      },
      engineer: {
        title: "Timeouts, backoff, budgets, keys, breaker, fallback",
        lang: "ts",
        code: "new Anthropic({ maxRetries: 2, timeout: 30_000 })\nlimiter(40) · breaker(5 failures / 60 s → 30 s open)\nfallback → second model → articles + leave a message\nIdempotency-Key: pending.id on every write",
        points: ["Customers see an honest fallback within two seconds.", "Retries are spaced, capped and only for retryable errors.", "Each feature has its own budget and key.", "Writes cannot run twice."],
      },
      tradeoffs: ["A fallback model answers slightly differently; keep it pinned and in the eval suite so the difference is known.", "Breaker thresholds and timeouts need tuning from traces; too tight and quiet days trip them.", "Idempotency needs support on the receiving service; if a vendor lacks it, do not retry writes to it."],
      when: "Before the first production deploy, and reviewed before every traffic peak.",
    },
  },
  {
    stage: "recap",
    point: "Every model call can be slow, fail, or succeed silently. Timeouts, retries with backoff on retryable errors only, per-feature budgets and keys, idempotency keys on writes, a circuit breaker and a pre-decided fallback make a provider's bad afternoon invisible to customers.",
    title: "Connect it back: the next sale day",
    text: "The next bad afternoon shows up only in Dev's dashboard: fallback rate up, breaker open twice for thirty seconds, tagger paused by its budget, chat p95 unchanged at the fallback model. Customers who asked during the open circuit saw matching articles and a 'leave a message' button inside two seconds. The refund log shows one attempt, one key, one refund per action. Nisha's queue stayed normal, and Kabir did not hear about it until Monday.",
    recap: {
      remember: ["Timeouts on every call, including idle timeouts on streams.", "Retry only retryable errors, with exponential backoff and jitter, capped; honour Retry-After; configure the SDK rather than looping.", "Per-feature concurrency and token budgets; separate keys for background work.", "Writes: record the attempt, send an idempotency key, time out, settle.", "A circuit breaker and a fallback path designed before the incident."],
      mistakes: ["Immediate, unlimited retries.", "Retrying 400s and 401s.", "One API key and one bucket for chat and batch jobs.", "Retrying a write with no idempotency key.", "'Something went wrong' after a minute as the fallback."],
      production: ["Every provider has rate limits and incidents; every serious integration has these six pieces.", "Lesson 4.5 places gateways and queues around them for deployment.", "The fallback model is a route in lesson 3.9's terms and a category in lesson 3.7's evals."],
      next: ["4.1 Prompt injection and data exfiltration.", "4.5 Deployment: gateways, queues, streaming, serverless limits.", "4.7 Open-weights and local models: a fallback you run yourself."],
    },
    ask: "Module 3 is complete: tools, agents, MCP, memory, embeddings, RAG, evals, tracing, cost and reliability. Module 4 starts where the help centre's own articles become a way to attack the chat box: a document that tells the model what to do. Next lesson.",
  },
];

export const A22: Topic = {
  slug: "reliability",
  title: "Reliability: retries, rate limits, timeouts, fallbacks",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain why a model call needs timeouts, bounded retries, budgets and a fallback.", "Classify provider errors into retryable and not, and apply backoff with jitter and Retry-After.", "Make write tool calls safe to retry with idempotency keys recorded before the call.", "Design per-feature concurrency budgets, a circuit breaker and an honest customer-facing fallback."],
  prerequisites: ["first-api-call", "agents", "streaming", "cost-and-latency"],
  story: "Calling a busy restaurant. You do not redial fifty times in a row (backoff and jitter), you give up after a few tries and order from the place next door (fallback), you do not place the same order twice when the line drops (idempotency), and you do not let the office party call block the customers (budgets).",
  tldr: [
    "Every model call can be **slow, fail, or succeed silently**. Plan for all three.",
    "**Timeouts** everywhere; **retry only retryable errors** with **backoff, jitter and Retry-After**, capped; configure the **SDK**, do not loop.",
    "**Per-feature budgets and keys**; writes carry an **idempotency key** recorded **before** the call.",
    "A **circuit breaker** and a **fallback** (second model, degraded mode, honest message) decided **before** the incident.",
  ],
  words: [
    ["rate limit", "the provider's cap on requests or tokens per minute per key; 429 when exceeded"],
    ["exponential backoff", "increasing waits between retries"],
    ["jitter", "randomness added to backoff so clients do not retry in step"],
    ["idempotency key", "a unique id that makes a repeated write a no-op"],
    ["circuit breaker", "stops calling a failing service for a cooldown, then probes"],
    ["fallback", "the pre-decided path when the primary model or provider is unavailable"],
    ["Retry-After", "a response header saying how long to wait before retrying"],
  ],
  sections: [],
  quiz: [
    { q: "The provider returns 529 'overloaded'. What should the client do?", options: ["Retry immediately, up to 10 times", "Retry 2–3 times with exponential backoff and jitter; if it persists, open the breaker and use the fallback", "Throw and show 'something went wrong'", "Switch API keys"], answer: 1, reason: true, whyOptions: ["Immediate retries add load to an overloaded service.", "Correct. Spaced, capped retries, then protect the customer's time with the fallback.", "An honest fallback beats an error after a minute.", "Capacity, not credentials."], why: "Back off, cap, break, fall back." },
    { q: "A refund call timed out. Safe to retry?", options: ["Yes, always", "Only with the same idempotency key, after recording the attempt", "Never", "Only after an hour"], answer: 1, whyOptions: ["A plain retry can refund twice.", "Correct. The key makes a repeat a no-op; the record survives a crash.", "Unretried, the customer may get nothing.", "Time does not make it safe; the key does."], why: "Record, key, retry." },
    { q: "Why should the tagger and the chat use different budgets or keys?", options: ["For nicer invoices only", "So background work cannot consume the rate limit customers need", "Because the SDK requires it", "They should share one"], answer: 1, whyOptions: ["Separate invoices are a bonus.", "Correct. Interactive work gets priority; background work queues and waits.", "No.", "Sharing is how the chat got 429s on sale day."], why: "Budgets per feature." },
  ],
  practice: [
    { q: "Set timeouts for the chat's streaming call and justify each.", answer: "Connect timeout 5 s (a slow handshake means trouble); time to first token 15 s (beyond that the customer has left; fall back); idle timeout 15 s between stream events (a stalled stream); total 60 s (a very long answer is capped by max_tokens anyway). On any of them: abort via the signal, keep partial text if any, offer the fallback.", explain: "Separate budgets for connect, first token, idle and total." },
    { q: "Write the error classification function.", answer: "retryable if status is 408, 409 (for reads), 425, 429, 500, 502, 503, 504, 529, or the error is a network/timeout error; not retryable for 400, 401, 403, 404, 413, 422. For 429 and 503 read Retry-After and wait at least that long. Writes without an idempotency key are never retried regardless of status.", explain: "Status decides; writes need a key." },
    { q: "Design the customer-facing fallback for the help chat and what you log.", answer: "Within 2 s of the primary failing or the breaker being open: try the fallback model once with the same prompt; if that fails, show the top three retrieved articles with links and a 'leave a message for our team' form that creates a ticket with the question and the trace id. Log: feature, reason (timeout/529/429/breaker), which fallback stage served, the trace id; alert on fallback rate over 5% for 5 minutes.", explain: "Fast, honest, useful, measured." },
  ],
  interview: [
    { level: "junior", q: "What can go wrong with a model API call?", a: "It can be slow, fail with a rate limit (429), overload (529/503) or server error, fail on the network, or time out after the work was actually done. Code must set timeouts, retry only when it helps, limit its own load, make writes safe to repeat, and have a fallback." },
    { level: "mid", q: "How should retries be implemented?", a: "Only for retryable errors (429, 5xx, 529, network, timeouts), with exponential backoff plus jitter, honouring Retry-After, capped at two or three attempts. Use the SDK's built-in retry settings rather than a loop. Never retry 400-class errors; alert on them. Never retry a write without an idempotency key." },
    { level: "mid", tricky: true, q: "The payment call timed out, so it failed, so I can retry it, right?", a: "A timeout means the outcome is unknown; the refund may have succeeded. Retrying blindly can double it. Record the attempt before calling, send an idempotency key the service honours, and on retry the service returns the original result instead of acting again. If the service has no idempotency support, check its state before any retry." },
    { level: "senior", q: "Design the reliability layer for several AI features sharing a provider.", a: "Per-feature clients with their own keys, timeouts, retry caps and concurrency limits; background jobs on queues with token budgets and off-peak schedules or the batch API; a circuit breaker per feature; fallbacks decided per feature (second model, degraded retrieval-only mode, honest handoff); idempotency keys on every write recorded in an action log; dashboards for fallback rate, breaker state, 429 and timeout rates; alerts; a load test before traffic peaks." },
    { level: "mid", q: "What is a circuit breaker and why use one with an LLM provider?", a: "After a threshold of failures it stops calling the provider for a cooldown and serves the fallback immediately, then probes to see if the provider recovered. It saves customers from waiting on a dead service and stops your retries from piling onto an overloaded one." },
    { level: "mid", tricky: true, q: "Our fallback is a different provider's model. Problem solved?", a: "Partly. The fallback answers differently, so it must be pinned, in the eval suite and visible on dashboards as its own route; prompts may need small adjustments; tool definitions must be mapped. And a fallback for the fallback is still needed: a degraded mode with retrieval only and a handoff, within seconds." },
    { level: "junior", q: "What is a rate limit and what do you do when you hit it?", a: "The provider's cap on requests or tokens per minute per key, signalled by HTTP 429. Wait the Retry-After time, back off, and fix the cause: give background work its own key and budget, queue it, batch it, or request a higher limit." },
    { level: "senior", q: "How do you keep interactive and background workloads from hurting each other?", a: "Separate API keys and budgets, a queue with a token-per-minute allowance and low concurrency for background work, scheduling it off-peak or through the batch API, priority to interactive calls, and dashboards per feature. During known peaks, pause background work entirely." },
    { level: "mid", q: "What should the user see when the model is unavailable?", a: "Within a couple of seconds: an honest message and something useful, such as the matching help articles and a way to reach a person, with the trace reference. Never a minute-long spinner or a generic error. The fallback is a product decision made before the incident." },
    { level: "mid", q: "How do timeouts work for a streaming response?", a: "Separate budgets: connect, time to first token, idle time between events, and total. Abort through an AbortSignal on any of them, keep any partial text already shown, and offer the fallback. A single total timeout cannot tell a stalled stream from a long answer." },
  ],
  remember: [
    "Slow, failed, or silently succeeded: plan for all three.",
    "Timeouts; capped backoff with jitter on retryable errors only; configure the SDK.",
    "Budgets and keys per feature; writes recorded and keyed.",
    "Breaker open → fallback in seconds, decided in advance.",
  ],
};
