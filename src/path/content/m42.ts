import type { Exercise, LessonBody, Quiz } from "../types";

// Module 42: AI product engineering. One concept per lesson.
// Keys are lesson slugs: m42-<kebab of the concept title in map.ts>.

export const M42_BODIES: Record<string, LessonBody> = {
  "m42-ai-product-architecture": {
    simple: "AI product architecture is the shape of everything around the model: where requests go, what is stored, who may see what, how money is counted, and how quality is checked; the model is the smallest box in the diagram.",
    concept:
      "An **AI product architecture** describes how a feature that uses a model is built as a whole system. The model call is one box. Around it: a client (web, mobile, API) that sends requests and streams answers; a backend that authenticates, enforces permissions, assembles prompts, calls retrieval and tools, and runs the model loop; a set of stores for conversations, documents and their embeddings, user memory, traces and feedback; a gateway to the model provider or a self-hosted serving layer with fallbacks; background workers for ingestion, batch jobs and evaluation; and the operational layer of monitoring, billing and analytics.\n\nThe decisions that shape the architecture are about data and trust: what is sent to the model and what must never be, which tenant's documents may be retrieved, what the model may do through tools, and how cost is attributed. Most of the code is ordinary web engineering; the AI-specific parts are prompt assembly, retrieval, tool execution, evaluation and the handling of non-deterministic output.",
    why:
      "Teams that start with 'call the model from the frontend' discover within weeks that the key leaked, the prompt cannot be changed without an app release, conversations are lost on refresh, one customer can see another's documents, and nobody knows what it costs. An architecture settles those questions once: the backend owns the keys, prompts and permissions; stores are designed for the access patterns; cost and quality are measured from day one. It also keeps the model replaceable, which matters because models change every few months.",
    how: [
      "Place the model behind the backend: the client never holds a key and never assembles a prompt.",
      "Design the request path: authenticate, resolve tenant and permissions, load context (conversation, memory, retrieval filtered by permission), assemble the prompt from a versioned template, call the model with tools, validate and store the answer, stream it back.",
      "Design the stores: conversations (per user, with retention), documents and chunks with embeddings and permission metadata, user memory, traces and feedback.",
      "Add background workers: document ingestion and re-indexing, batch jobs, nightly evaluation, usage aggregation for billing.",
      "Add the model gateway: pinned versions, fallbacks, rate limits, caching, cost recording; keep the provider swappable.",
      "Wire operations from the start: tracing, dashboards, alerts, feedback capture, release bundles.",
    ],
    visual: {
      kind: "flow",
      steps: ["client (stream, feedback, ref id)", "backend API: auth → tenant → permissions", "context: conversation + memory + retrieval (filtered)", "prompt assembly (versioned) + tools", "model gateway: pinned model, fallback, cache, cost", "validate → store → stream back", "traces, feedback, billing, evals"],
      caption: "The model is one step in the middle. Everything before it decides what it sees; everything after decides what is kept and measured.",
    },
    everyday: {
      title: "A hospital around a specialist",
      text: "The consultant is one person in a building of reception, records, pharmacy, nurses, billing and audit. Nobody walks in off the street and talks to the consultant directly; reception checks who you are, records brings your file, the consultant gives an opinion, and the pharmacy and billing act on it. The model is the consultant; the architecture is the hospital.",
    },
    engineering: {
      title: "Rebuilding a prototype into a product",
      text: "A recruitment start-up's prototype called the model from the browser with a hard-coded prompt. For the product they moved the call behind an API with login and tenant scoping; stored conversations per recruiter; indexed CVs per customer with a tenant filter on every query; put prompts in the repository with versions; added a gateway with a pinned model and a fallback; recorded traces and cost per customer; and ran a nightly evaluation. The model code was the same eight lines. The product was two months of everything else, and that everything else is what customers paid for: their data stayed theirs, the bill was predictable, and answers could be explained.",
    },
    useIt: "Draw the architecture before writing the feature: the request path, the stores, the workers, the gateway and the operations layer. Decide the data and trust boundaries explicitly. Use the diagram to divide the work and to review changes: any new feature should be a change to one box, not a new path to the model.",
    takeaways: ["The model is one box; the product is the request path, stores, workers, gateway and operations around it.", "The backend owns keys, prompts, permissions and cost; the client streams and collects feedback.", "Design stores for access patterns and permissions from the start.", "Keep the model swappable behind a gateway."],
    terms: [["AI product architecture", "the system design around a model-backed feature"], ["model gateway", "the backend layer that calls models with pinning, fallbacks, caching and cost recording"], ["request path", "the sequence of steps a user message takes from client to answer"]],
    reflect: { q: "Why should the prompt template live in the backend repository rather than in the mobile app?", a: "Because it changes weekly and must be versioned, reviewed, evaluated and rolled back without an app release, and because it often contains instructions and data the user should not see or be able to alter." },
  },

  "m42-backend-architecture": {
    simple: "The backend for an AI feature is an ordinary service plus three special parts: a prompt-assembly layer, a model-loop runner with tools and streaming, and a gateway that makes model calls reliable and accountable.",
    concept:
      "The **backend architecture** of an AI product has the usual pieces (API, authentication, databases, queues) and three AI-specific ones. **Prompt assembly** takes a versioned template and fills it from the request: the system rules, retrieved chunks, memory, conversation window, and the user's message, with delimiters so data is never confused with instructions. The **loop runner** calls the model, handles tool calls with validation and budgets, streams tokens to the client, and validates structured outputs. The **gateway** wraps every model call with the pinned version, timeouts, retries with backoff, fallback, caching, rate limits, and recording of tokens and cost to the trace.\n\nLong-running work (ingestion, batch generation, evaluation) runs in workers off a queue, not in the request path. Streaming needs a server that holds a connection open and forwards events, which rules out some serverless platforms with short execution limits unless they support streaming responses.",
    why:
      "Without these layers, model calls are scattered through handlers with copied prompts, inconsistent error handling and no cost tracking. A gateway makes every call reliable and measured in one place; prompt assembly makes prompts versioned and testable; the loop runner makes tool use safe and streaming consistent. Separating long jobs into workers keeps the request path fast and the model's rate limits fairly shared between interactive and background use.",
    how: [
      "API layer: authenticate, resolve tenant and permissions, validate input, open a streaming response.",
      "Context loading: fetch the conversation window and summary, user memory, and retrieval results filtered by the caller's permissions, in parallel.",
      "Prompt assembly: render the versioned template with delimited data blocks; count tokens; trim to budget.",
      "Loop runner: call the gateway with tools; on tool_use, validate arguments, check permissions, run or pause for approval, append results, repeat within step and cost budgets; stream text deltas to the client.",
      "Gateway: pinned model, timeout, bounded retries, circuit breaker, fallback model, prompt cache control, token and cost recording on the trace.",
      "Persist: store the final answer, tool actions and trace; enqueue follow-up work (memory extraction, analytics).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Responsibility", "Must never"],
        rows: [
          ["API", "auth, tenant, permissions, streaming connection", "trust client-supplied identity or prompt text as instructions"],
          ["context loading", "conversation, memory, retrieval with filters", "retrieve across tenants or roles"],
          ["prompt assembly", "versioned template, delimiters, token budget", "concatenate raw user text into the system prompt"],
          ["loop runner", "tool validation, budgets, approvals, streaming, output validation", "run a write tool without a gate or an idempotency key"],
          ["gateway", "pinning, timeouts, retries, fallback, caching, cost", "use a moving model alias or swallow errors"],
          ["workers", "ingestion, batch jobs, evaluation, aggregation", "run in the request path"],
        ],
      },
      caption: "Each layer has one job and one class of mistake it exists to prevent.",
    },
    everyday: {
      title: "A restaurant's kitchen line",
      text: "Orders come in through one door (the API), the pass checks them and sends them to stations, prep happens off the line before service (workers), the line assembles each plate from a fixed recipe (prompt assembly), the head chef checks every plate before it leaves (validation), and the bill is itemised (gateway cost recording). A kitchen where waiters cook at tables would be the prototype that calls the model from the browser.",
    },
    engineering: {
      title: "The gateway that paid for itself in a week",
      text: "An insurance company had fourteen services calling the model provider directly, each with its own retry loop and none recording cost. They introduced a gateway service: one place for the pinned model, timeouts, backoff, a circuit breaker, a fallback provider, prompt caching headers and per-call cost on the trace. In the first week it revealed that one service retried failed calls immediately up to ten times (fixed), that two services used an unpinned alias (pinned), and that cost per feature was 60% in a batch job that could move to the batch API (moved). The gateway was 400 lines.",
    },
    code: {
      title: "The gateway call: pinned, bounded, measured",
      lang: "ts",
      src: `export async function callModel(trace: Trace, params: MessageParams, opts: { feature: string; signal?: AbortSignal }) {
  const model = MODELS[opts.feature].primary;          // pinned exact version from config
  const started = Date.now();
  try {
    const reply = await primary.messages.create({ ...params, model }, { signal: opts.signal, timeout: 30_000, maxRetries: 2 });
    recordUsage(trace, model, reply.usage, Date.now() - started);
    return reply;
  } catch (e) {
    breaker.failure(opts.feature, e);
    if (!isRetryable(e) || !MODELS[opts.feature].fallback) throw e;
    const fb = MODELS[opts.feature].fallback;
    const reply = await secondary.messages.create({ ...params, model: fb }, { signal: opts.signal, timeout: 30_000, maxRetries: 1 });
    recordUsage(trace, fb, reply.usage, Date.now() - started, { fallback: true });
    return reply;
  }
}`,
      lines: [
        { code: "const model = MODELS[opts.feature].primary;          // pinned exact version from config", say: "Every feature's model is an exact version in configuration; no alias, no 'latest'." },
        { code: "const reply = await primary.messages.create({ ...params, model }, { signal: opts.signal, timeout: 30_000, maxRetries: 2 });", say: "A timeout, bounded retries with the SDK's backoff, and the client's abort signal so a Stop button works." },
        { code: "recordUsage(trace, model, reply.usage, Date.now() - started);", say: "Tokens, model id, duration and cost go on the trace from the one place every call passes through." },
        { code: "if (!isRetryable(e) || !MODELS[opts.feature].fallback) throw e;", say: "A bad request is a bug and is thrown; only provider-side failures fall back." },
        { code: "recordUsage(trace, fb, reply.usage, Date.now() - started, { fallback: true });", say: "Fallback calls are recorded as such, so the fallback rate is a dashboard metric." },
      ],
    },
    useIt: "Structure every AI backend as API, context loading, prompt assembly, loop runner, gateway and workers. Put the gateway in first: it is small, and it makes every call reliable and measurable. Keep prompt templates versioned in the repository and never let user text reach the instruction position.",
    takeaways: ["Three AI-specific layers: prompt assembly, loop runner, gateway.", "The gateway centralises pinning, timeouts, retries, fallback, caching and cost.", "Long jobs go to workers; the request path streams.", "Each layer prevents one class of mistake."],
    terms: [["prompt assembly", "rendering a versioned template with delimited data and a token budget"], ["loop runner", "the code that drives model calls, tools, budgets and streaming"], ["worker", "a background process that runs jobs from a queue outside the request path"]],
    reflect: { q: "A new engineer adds a feature by calling the provider's SDK directly from a handler. What has been lost?", a: "Pinning, timeout and retry policy, fallback, prompt caching, cost and token recording, the fallback metric, and the circuit breaker. The call will work on a quiet day and be invisible on a bad one. Route it through the gateway." },
  },

  "m42-frontend-integration": {
    simple: "Frontend integration for AI features means streaming the answer as it is produced, showing what the system is doing, handling stops and errors gracefully, and collecting feedback, all without the client ever touching a model key or a prompt.",
    concept:
      "The **frontend** of an AI feature talks to the backend, never to the model. Its jobs are: send the user's message with the conversation id; receive a stream of events (text deltas, tool status, sources, the final message) and render them as they arrive; let the user stop generation; show state honestly ('searching the help centre', 'checking your order') so the wait is understood; render citations as links; show the trace reference and thumbs buttons under every answer; and handle errors and fallbacks with a useful message rather than a spinner.\n\nStreaming uses server-sent events or a fetch with a readable stream; the client appends text as deltas arrive and keeps the partial text if the stream fails. Markdown and code blocks are rendered incrementally. Everything the model wrote is treated as untrusted text: rendered as text or sanitised markdown, never as HTML, never executed.",
    why:
      "Users judge an AI feature by the first second and by how it fails. A screen that shows nothing for eight seconds feels broken; one that streams text from the first token feels fast at the same total latency. A client that renders model output as HTML is a cross-site scripting hole, because the model can be made to write a script tag. And a client that holds the provider key or the prompt leaks both to anyone who opens the developer tools. The frontend's design decides whether the feature feels trustworthy.",
    how: [
      "Send the message to the backend with the conversation id and the user's session; never a key, never a prompt.",
      "Open a streaming response; parse events: status (what the backend is doing), text delta, sources, tool proposal needing approval, done (with trace ref), error.",
      "Append text deltas to the answer as they arrive; render markdown incrementally and safely (sanitised, no raw HTML).",
      "Provide a Stop button that aborts the request; keep the partial text and mark it as stopped.",
      "On error or fallback: show an honest message with the partial answer, matching help links if available, and a way to reach a person.",
      "Under every answer: citations as links, the trace reference, thumbs up/down with a comment box; send feedback with the trace id.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "0 ms", detail: "message sent; input disabled; 'Thinking…' replaced within 300 ms by a real status" },
        { label: "300 ms", detail: "status event: 'Searching the help centre'" },
        { label: "700 ms", detail: "first text delta; cursor shows text arriving; Stop button visible" },
        { label: "streaming", detail: "markdown rendered as it grows; code blocks highlighted when closed" },
        { label: "done", detail: "sources listed as links; ref 7f3a; thumbs; input re-enabled" },
        { label: "error path", detail: "partial text kept, 'We couldn't finish this answer', help links, 'talk to a person'" },
      ],
      caption: "The user sees something true at every moment, including when things go wrong.",
    },
    everyday: {
      title: "A good waiter",
      text: "A good waiter says 'the kitchen is just plating yours' rather than vanishing for ten minutes, brings the starter while the main cooks, and if something has gone wrong says so and offers an alternative. A bad one disappears and returns with either the food or an apology. Streaming and status events are the good waiter.",
    },
    engineering: {
      title: "The XSS that the model wrote",
      text: "A B2B analytics product rendered model answers with a markdown library configured to allow raw HTML, for nicer tables. A security researcher asked the assistant to 'repeat this text exactly' with a script tag inside, and the tag executed in the page, with the user's session. The fix was to sanitise all rendered output and disallow raw HTML, and to add an evaluation case that asks the model to output a script tag and checks that the page never executes it. The model had done nothing wrong; the client had trusted it as if it were the application's own code.",
    },
    code: {
      title: "Consuming the stream and keeping partial text on failure",
      lang: "ts",
      src: `const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ conversationId, message }), signal: controller.signal, headers: { "Content-Type": "application/json" } });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let answer = "";
try {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const event of parseSse(decoder.decode(value, { stream: true }))) {
      if (event.type === "status") setStatus(event.text);
      else if (event.type === "delta") { answer += event.text; render(answer); }
      else if (event.type === "sources") setSources(event.items);
      else if (event.type === "done") setRef(event.traceId);
      else if (event.type === "error") showError(event.message, answer);
    }
  }
} catch (e) {
  if (controller.signal.aborted) markStopped(answer);
  else showError("We couldn't finish this answer.", answer);
}`,
      lines: [
        { code: "stopButton.onclick = () => controller.abort();", say: "Stop aborts the request; the backend's abort signal cancels the model call so tokens stop being billed." },
        { code: "else if (event.type === \"delta\") { answer += event.text; render(answer); }", say: "Each delta is appended and rendered at once; the user sees text from the first token." },
        { code: "else if (event.type === \"done\") setRef(event.traceId);", say: "The trace reference arrives with the final event and is shown under the answer for feedback and support." },
        { code: "if (controller.signal.aborted) markStopped(answer);", say: "A stopped answer keeps its partial text and is labelled, rather than vanishing." },
        { code: "else showError(\"We couldn't finish this answer.\", answer);", say: "Errors keep whatever arrived and say so honestly." },
      ],
      note: "render() must sanitise markdown and never inject raw HTML from the model.",
    },
    useIt: "Build every chat or generation UI around a stream of typed events with status, deltas, sources, done and error; keep partial text on failure; sanitise all rendering; show the reference and feedback controls under every answer. Keep keys and prompts on the server; the client is a renderer and a feedback collector.",
    takeaways: ["Stream from the first token; show real status while waiting.", "Stop keeps partial text; errors keep partial text and offer a next step.", "Model output is untrusted text: sanitise, never render as HTML, never execute.", "Reference id and feedback under every answer; no keys or prompts in the client."],
    terms: [["server-sent events", "a one-way stream of events from server to browser over one connection"], ["text delta", "a chunk of newly generated text in a streaming response"], ["sanitised rendering", "displaying model output so it cannot run scripts or inject markup"]],
    reflect: { q: "Why is a 'Thinking…' spinner for eight seconds worse than streaming the same eight-second answer?", a: "The total time is the same, but with streaming the user sees progress and can start reading and can stop early; with the spinner the user cannot tell a slow answer from a broken system and leaves. Perceived latency is the first token, not the last." },
  },

  "m42-database-design-for-ai-applications": {
    simple: "Database design for AI applications adds a few specific tables to an ordinary schema, each shaped by its access pattern: conversations by user, chunks with embeddings and permissions, memory with provenance, traces for debugging and billing.",
    concept:
      "An AI application's **database design** starts from the ordinary entities (users, tenants, subscriptions) and adds the AI-specific ones. Conversations and messages, read by conversation id and written on every turn. Documents and chunks, with embeddings and metadata (tenant, audience, locale, updated time), searched by vector similarity and keyword with permission filters. User memory facts with source, created and expiry. Traces and spans, written once per request and queried by id, by time range and by version. Feedback keyed by trace. Usage aggregates per tenant per day for billing. Evaluation cases and results.\n\nEach table is shaped by how it is read: conversations need fast per-id reads and retention jobs; chunks need a vector index and filterable metadata; traces need time-partitioned storage with cheap writes and a retention policy; usage needs pre-aggregation. Most of this fits in one relational database with a vector extension; the trace store is the first to outgrow it.",
    why:
      "The naive schema (a messages table, a documents table with a JSON blob of vectors) works for a demo and fails in three ways: retrieval cannot filter by permission efficiently, so it either leaks or scans; traces grow faster than everything else and swamp the main database; and billing needs per-tenant counts that cannot be computed on the fly from millions of spans. Designing the tables around the access patterns and the privacy rules from the start avoids a painful migration under load.",
    how: [
      "Model the ordinary entities first: tenants, users, roles, subscriptions.",
      "Conversations: a conversations table (id, tenant, user, summary, created, last activity, retention class) and a messages table (conversation id, role, content, tokens, created); index by conversation and by last activity for retention jobs.",
      "Documents: documents (id, tenant, source, audience, locale, updated) and chunks (id, document id, text, heading, position, embedding vector, metadata); a vector index on embedding and a full-text index on text; filters on tenant and audience in every query.",
      "Memory: user facts (user id, text, kind, source, created, expires); indexed by user.",
      "Traces: traces (id, tenant, user hash, feature, release label, started, duration, cost, flags) and spans (trace id, name, input, output, ms, meta), time-partitioned, with retention; feedback keyed by trace id.",
      "Usage: a daily aggregate per tenant and feature (requests, tokens, cost), maintained by a worker, read by billing and dashboards.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Table", "Read pattern", "Index / storage", "Retention"],
        rows: [
          ["conversations, messages", "by conversation; recent per user", "conversation id; last activity", "30–90 days, then bodies removed"],
          ["documents, chunks", "vector + keyword search with tenant/audience filters", "vector index; full-text index; filter columns", "while the document exists; re-indexed on edit"],
          ["user_facts", "all facts for a user", "user id, expires", "until expiry or deletion"],
          ["traces, spans", "by id; by time and version for dashboards", "time partitions; release label", "bodies 30 days; metadata a year"],
          ["feedback", "by trace; rates by version", "trace id; created", "with traces"],
          ["usage_daily", "per tenant per day", "(tenant, feature, day)", "years"],
        ],
      },
      caption: "Six tables, six read patterns, six retention rules. The schema is the privacy policy in SQL.",
    },
    everyday: {
      title: "A clinic's filing system",
      text: "Patient files are kept by patient and reviewed yearly; appointment logs are kept by date and archived; invoices are kept for seven years; the reference library is shelved by topic and updated when editions change. Nobody stores everything in one drawer because each kind of paper is looked up differently and kept for a different time. The AI schema is that filing system.",
    },
    engineering: {
      title: "The trace table that ate the database",
      text: "A customer-support platform stored traces in its main database alongside users and conversations. Within four months traces were 92% of storage and the nightly backup took six hours; a slow dashboard query on spans locked a conversations write and caused a brief outage. They moved traces and spans to a separate time-partitioned store with 30-day body retention, kept a slim trace summary table in the main database for joins with feedback, and pre-aggregated usage daily. Backups returned to 40 minutes and dashboards stopped touching the production database.",
    },
    code: {
      title: "Chunks with permissions and the query that respects them",
      lang: "sql",
      src: `CREATE TABLE chunks (
  id          bigserial PRIMARY KEY,
  document_id bigint NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tenant_id   int    NOT NULL,
  audience    text   NOT NULL CHECK (audience IN ('customer', 'staff')),
  heading     text,
  text        text   NOT NULL,
  embedding   vector(1024) NOT NULL,
  search_tsv  tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED
);
CREATE INDEX chunks_vec ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX chunks_tsv ON chunks USING gin (search_tsv);
CREATE INDEX chunks_scope ON chunks (tenant_id, audience);

-- every retrieval query carries the caller's scope; the filter is not optional
SELECT id, heading, text
FROM chunks
WHERE tenant_id = $1 AND audience = ANY($2)
ORDER BY embedding <=> $3
LIMIT 20;`,
      lines: [
        { code: "audience    text   NOT NULL CHECK (audience IN ('customer', 'staff')),", say: "Permission metadata lives on the chunk, constrained to known values." },
        { code: "search_tsv  tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED", say: "A keyword index maintained by the database, for hybrid search." },
        { code: "CREATE INDEX chunks_scope ON chunks (tenant_id, audience);", say: "The filter columns are indexed so scoping is cheap, not a scan." },
        { code: "WHERE tenant_id = $1 AND audience = ANY($2)", say: "The caller's tenant and allowed audiences are bound from the session; a chunk outside them never reaches the ranking." },
      ],
    },
    useIt: "Design the AI tables by access pattern and retention before writing features: conversations by id, chunks with vector and keyword indexes and filter columns, memory with provenance, traces in a time-partitioned store, usage pre-aggregated. Write the permission filter into every retrieval query and test it with a low-privilege user.",
    takeaways: ["AI apps add conversations, chunks, memory, traces, feedback and usage tables to the ordinary schema.", "Shape each table by its read pattern and retention; the schema encodes the privacy policy.", "Chunks carry permission metadata and are filtered in every query.", "Traces outgrow the main database first; partition and retain them separately."],
    terms: [["vector index", "an index (HNSW, IVF) that makes nearest-neighbour search over embeddings fast"], ["time partitioning", "splitting a table by time range so old data can be dropped cheaply"], ["pre-aggregation", "maintaining summary rows (per tenant per day) so billing and dashboards do not scan raw data"]],
    reflect: { q: "Why put audience and tenant on every chunk rather than on the document only?", a: "Retrieval queries rank chunks, not documents, and must filter before ranking. A join to the document on every vector search is slower and easier to forget; denormalising the scope onto the chunk makes the filter a cheap indexed predicate on the table being searched." },
  },

  "m42-conversation-storage": {
    simple: "Conversation storage keeps each user's messages server-side, keyed by conversation and user, with summaries for long threads and retention rules, so chats resume anywhere and the model sees a bounded window.",
    concept:
      "**Conversation storage** is the server-side record of a chat: a conversation row (owner, tenant, title, summary, created, last activity, retention class) and its messages (role, content, tokens, tool actions, trace id, created). It is the source of truth; what the model sees on each turn is a window assembled from it: the summary of older turns plus the last several messages verbatim.\n\nMessages are written on every turn (the user's and the assistant's), including tool proposals and results so a resumed agent run has its state. Summaries are updated by a worker when the window moves on. Retention is per class: ordinary chats kept for a period then bodies removed; regulated workloads kept longer or exported; user-deleted conversations purged immediately along with caches and traces that quote them.\n\nStorage is scoped: every read and write is keyed by the authenticated user (and tenant), never by a conversation id alone.",
    why:
      "Without server-side storage, a chat lives in one browser tab: refresh and it is gone, switch devices and it is gone, and the model is sent an unbounded, growing list until it overflows. Storage makes conversations resumable, makes the window bounded and cheap, lets agents pause for approval and resume, and gives support a record to investigate. The scoping rule exists because the most damaging bug in this area is loading the wrong user's conversation.",
    how: [
      "On a new chat, create a conversation row owned by the user and tenant; return its id to the client.",
      "On each turn, append the user message; build the model window (summary + last N messages) within the token budget; after the reply, append the assistant message with its trace id and any tool actions.",
      "When the window exceeds budget, a worker folds the oldest messages into the summary and marks them as summarised; the originals stay stored.",
      "Reads are always `WHERE user_id = session user AND tenant_id = session tenant`; conversation ids are opaque and never sufficient alone.",
      "Retention: a nightly job removes bodies past the class's period; deletion requests purge the conversation, its summary, trace spans that quote it, and any cached prompt state.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Client-only history", points: ["Lives in the tab; lost on refresh", "Sent whole to the model; grows until it overflows", "No resume, no support record", "No retention policy because nothing is stored"] },
      right: { title: "Server-side storage with a window", points: ["Resumable on any device", "Model sees summary + last N; bounded cost", "Agents can pause and resume; support can investigate by trace", "Retention and deletion as policy, keyed by user"] },
      caption: "The right-hand side is a table, a worker and a scoping rule.",
    },
    everyday: {
      title: "Case notes at a solicitor's",
      text: "Each client's file is kept at the office, not in the solicitor's pocket. Before a meeting the solicitor reads a summary page and the last few letters, not the whole file. Files are kept for the required years and shredded on schedule. A client's file is never handed to another client. Conversation storage is that filing discipline.",
    },
    engineering: {
      title: "The resume bug and the scoping test that prevented the worse one",
      text: "A banking assistant let customers resume chats across devices. During development an engineer found that `GET /conversations/:id` returned any conversation by id. The fix added the user and tenant to every query and a test that signs in as user A, requests user B's conversation id, and asserts 404. A later refactor accidentally dropped the tenant clause from one query; the test caught it in CI. The feature has never leaked a conversation, which is the only acceptable number.",
    },
    code: {
      title: "Append a turn and build the window, scoped by the session",
      lang: "ts",
      src: `export async function loadConversation(db: Db, session: Session, conversationId: string) {
  const conv = await db.conversations.findFirst({ where: { id: conversationId, userId: session.userId, tenantId: session.tenantId } });
  if (!conv) throw new NotFound();                       // never reveal whether it exists for someone else
  const recent = await db.messages.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" }, take: 12 });
  return { conv, recent: recent.reverse() };
}

export async function appendTurn(db: Db, conv: Conversation, role: "user" | "assistant", content: string, traceId?: string) {
  await db.messages.create({ data: { conversationId: conv.id, role, content, tokens: countTokens(content), traceId } });
  await db.conversations.update({ where: { id: conv.id }, data: { lastActivityAt: new Date() } });
  if (await windowTooLarge(db, conv)) await queue.enqueue("fold-summary", { conversationId: conv.id });
}`,
      lines: [
        { code: "const conv = await db.conversations.findFirst({ where: { id: conversationId, userId: session.userId, tenantId: session.tenantId } });", say: "Three conditions, always: id, user and tenant from the authenticated session." },
        { code: "if (!conv) throw new NotFound();                       // never reveal whether it exists for someone else", say: "A conversation that is not yours looks identical to one that does not exist." },
        { code: "const recent = await db.messages.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: \"desc\" }, take: 12 });", say: "The window is the last twelve messages; the summary covers the rest." },
        { code: "if (await windowTooLarge(db, conv)) await queue.enqueue(\"fold-summary\", { conversationId: conv.id });", say: "Summarising is a worker job, off the request path." },
      ],
    },
    useIt: "Store conversations server-side from the first version, keyed by user and tenant, with a bounded window and a summary worker, retention classes and a deletion path that reaches caches and traces. Write the cross-user test before the feature ships and keep it in CI.",
    takeaways: ["Conversations are stored server-side as the source of truth; the model sees a bounded window.", "Every read and write is scoped by the session's user and tenant; ids alone are never enough.", "Summaries are folded by a worker; originals stay until retention removes them.", "Deletion reaches summaries, traces and caches."],
    terms: [["conversation window", "the summary plus recent messages sent to the model on a turn"], ["retention class", "a category deciding how long a conversation's bodies are kept"], ["scoping", "constraining every query by the authenticated user and tenant"]],
    reflect: { q: "Why store the assistant's tool proposals and results as messages, not just the final text?", a: "Because an agent that paused for approval must resume from exactly where it stopped, and because support needs to see what the assistant did, not only what it said. The tool blocks are part of the conversation's state." },
  },

  "m42-document-storage": {
    simple: "Document storage keeps the original files, their extracted text and their chunks with embeddings and permission metadata, with ingestion that re-indexes on change and deletion that removes every derived copy.",
    concept:
      "**Document storage** in an AI product has three layers. The originals (PDFs, docs, pages) in object storage, keyed by tenant and document id, with checksums and versions. The extracted text and structure (headings, pages, tables) in the database, so re-chunking does not require re-parsing. The chunks with embeddings, headings, positions and metadata (tenant, audience, locale, document version, updated time) in the searchable table.\n\nIngestion is a pipeline: upload or sync, extract, clean, chunk, embed in batches, insert with metadata, mark the document indexed. Updates re-run the pipeline for that document and delete the old chunks in the same transaction, so stale text is never retrievable alongside new. Deletion removes the original, the text, the chunks and any cached retrieval results.\n\nPermissions are stored with the document and copied onto its chunks, because retrieval filters chunks.",
    why:
      "Documents are the knowledge an assistant answers from; if storage is sloppy, the assistant quotes stale policy, mixes tenants, or keeps answering from a file the customer deleted. Keeping originals allows re-processing when chunking or the embedding model changes; keeping extracted text separately makes that cheap. Transactional re-indexing avoids the window where old and new chunks coexist. And copying permissions to chunks is what makes the retrieval filter possible.",
    how: [
      "Upload or sync the original to object storage under tenant/document-id/version; record checksum, source, audience and locale in the documents table.",
      "Extract text and structure (headings, pages) with a parser suited to the format; store it; detect and skip unchanged content by checksum.",
      "Chunk by structure to a token budget with overlap; include the title and heading in each chunk's text.",
      "Embed chunks in batches with the pinned embedding model; insert chunks with metadata and the document version in one transaction that also deletes the previous version's chunks.",
      "Mark the document indexed with a timestamp; expose indexing lag as a metric.",
      "On delete: remove chunks, text and original; invalidate caches; log the deletion.",
    ],
    visual: {
      kind: "flow",
      steps: ["original file → object storage (tenant/doc/version)", "extract text + structure → text store", "chunk by headings, ~400 tokens, overlap", "embed in batches (pinned model)", "transaction: delete old chunks, insert new with metadata", "indexed_at set; lag metric", "delete → chunks, text, original, caches"],
      caption: "Every arrow can be re-run from the layer before it; every step records which version it produced.",
    },
    everyday: {
      title: "A library with a card catalogue",
      text: "The books are in the stacks (originals); the catalogue cards describe each book and where it is (text and metadata); the subject index points from topics to pages (chunks and embeddings). When a new edition arrives, the old cards are pulled the same day the new ones are filed, or readers get sent to the wrong shelf. When a book is withdrawn, its cards go too.",
    },
    engineering: {
      title: "The policy that was retrieved for three days after it changed",
      text: "A payroll software company's assistant answered from a help centre that re-indexed nightly. A statutory rate changed on a Monday morning; the article was updated at 09:00; the assistant quoted the old rate until Tuesday's run. Worse, the nightly job inserted new chunks before deleting old ones, so for twenty minutes both versions were retrievable. They moved to re-indexing on save inside one transaction (delete old, insert new) and added an indexing-lag alert. Lag went from up to 24 hours to under a minute.",
    },
    maths: {
      formula: "chunks per document ≈ tokens ÷ (chunk size − overlap);   storage per chunk ≈ text bytes + embedding dimensions × bytes;   embedding cost = chunks × tokens per chunk × price per token",
      meaning: "Chunk count drives storage and embedding cost; overlap adds a few percent. Embedding dimensions set the vector storage per chunk.",
      worked: [
        "A 12,000-token manual, chunks of 400 tokens with 60 tokens overlap: ≈ 12,000 ÷ 340 ≈ 36 chunks.",
        "Per chunk: ~1,600 bytes of text + 1,024 dimensions × 2 bytes (FP16) = 2,048 bytes of vector ≈ 3.6 KB. The manual costs ≈ 130 KB in the chunk table; 50,000 such documents ≈ 6.5 GB.",
        "Embedding cost at £0.10 per million tokens: 36 chunks × 400 tokens = 14,400 tokens = £0.0014 per manual; 50,000 manuals ≈ £72 to index, and the same again if the embedding model changes.",
      ],
    },
    useIt: "Build ingestion as a re-runnable pipeline with originals, extracted text and chunks as separate layers; re-index on change inside a transaction; copy permissions to chunks; measure indexing lag; and make deletion remove every derived copy. Keep the embedding model pinned and recorded on each chunk so a model change is a planned re-embed.",
    takeaways: ["Three layers: originals, extracted text, chunks with embeddings and metadata.", "Re-index on change in one transaction: delete old chunks, insert new.", "Permissions and version travel on every chunk.", "Deletion removes originals, text, chunks and caches; indexing lag is a metric."],
    terms: [["ingestion pipeline", "the steps from an uploaded file to searchable chunks"], ["indexing lag", "the time between a document changing and its new chunks being retrievable"], ["document version", "a counter on each re-index so chunks can be tied to the text they came from"]],
    reflect: { q: "Why keep extracted text separately when you have the original file and the chunks?", a: "Because chunking parameters and embedding models change, and re-chunking from stored text is seconds while re-parsing thousands of PDFs is hours and can fail differently. The text layer makes re-indexing cheap and repeatable." },
  },

  "m42-user-permissions": {
    simple: "User permissions in an AI product decide what each person can see, retrieve and make the assistant do, enforced in code at every data access and tool call, never by instructions to the model.",
    concept:
      "**User permissions** define who may read which documents and conversations, which tools the assistant may call for them, and what actions need approval. In an AI product they must be enforced in three places. Data access: every query for conversations, memory and chunks carries the caller's identity and role as filters. Retrieval: the permission filter runs inside the vector search, so a forbidden chunk never reaches the prompt. Tools: each tool checks the caller's permission before running, takes identity from the session rather than from the model's arguments, and write tools need an approval step.\n\nThe model is never the enforcement point. Telling it 'do not show staff documents' is a courtesy, not a control: it may fail, and the document is already in its context. Roles are ordinary (admin, staff, customer, read-only) and map to document audiences and tool allowlists.",
    why:
      "Models make permission failures worse than ordinary bugs: a leaked chunk is quoted fluently in an answer, a tool called with the wrong identity acts on someone else's account, and a prompt injection can ask the model to do both. Because the model cannot distinguish data from instructions, the only safe design puts permissions in code before the model sees anything and before any tool acts. This is the same principle as the rest of security engineering, applied one layer earlier than teams expect.",
    how: [
      "Define roles and map them to document audiences, tool allowlists, and approval requirements.",
      "At request time, resolve the caller's identity, tenant and roles from the session; pass them to every data loader.",
      "Retrieval: include `tenant_id = ? AND audience = ANY(allowed)` in the query; never post-filter after ranking.",
      "Tools: build the tool list per request from the caller's allowlist; inside each tool, check permission again and take identity from the session; gate writes behind approval.",
      "Test with a low-privilege user: assert that restricted chunks are never retrieved, restricted tools are not offered or callable, and another user's data returns not found.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Enforcement point", "What is checked", "If skipped"],
        rows: [
          ["data queries", "user, tenant, role filters on conversations, memory", "another user's chat loads"],
          ["retrieval", "tenant and audience filter inside the search", "a staff document is quoted to a customer"],
          ["tool list", "only allowlisted tools offered to the model", "the model can propose a refund for anyone"],
          ["tool execution", "permission re-checked; identity from session; writes gated", "an injected instruction acts on the wrong account"],
          ["the model's instructions", "a reminder only", "no protection at all"],
        ],
      },
      caption: "Four real enforcement points and one that is not. The last row is where teams mistakenly put all their trust.",
    },
    everyday: {
      title: "Keys, not signs",
      text: "A hotel does not keep guests out of other rooms with a sign saying 'please only enter your own room'; it issues key cards that open one door. Telling the model 'only show the user their own data' is the sign. The permission filter in the query is the key card.",
    },
    engineering: {
      title: "The prompt that said 'never' and the chunk that was there anyway",
      text: "An HR assistant's system prompt said 'Never reveal salary information to non-managers.' Salary documents were indexed with everything else, retrieval had no audience filter, and an employee asking 'what is the pay band for my role' got a precise answer quoted from a confidential document. The model had been told not to; the chunk was in its context and the question was reasonable. The fix added audience metadata on chunks, the filter in the retrieval query, a tool allowlist per role, and a CI test that runs 40 restricted questions as an employee and asserts no restricted chunk is retrieved.",
    },
    code: {
      title: "Per-request tool list and a tool that checks permission itself",
      lang: "ts",
      src: `const TOOLS_BY_ROLE: Record<Role, string[]> = {
  customer: ["lookup_order", "list_recent_orders"],
  staff: ["lookup_order", "list_recent_orders", "search_orders", "propose_refund"],
  admin: ["lookup_order", "list_recent_orders", "search_orders", "propose_refund", "export_report"],
};

export function toolsFor(session: Session) {
  const allowed = new Set(session.roles.flatMap((r) => TOOLS_BY_ROLE[r]));
  return ALL_TOOLS.filter((t) => allowed.has(t.name));
}

async function proposeRefund(input: unknown, session: Session) {
  if (!session.roles.includes("staff") && !session.roles.includes("admin")) throw new Forbidden("propose_refund");
  const { orderId, amount } = RefundInput.parse(input);
  const order = await db.orders.findFirst({ where: { id: orderId, tenantId: session.tenantId } });
  if (!order) return { data: { found: false }, error: false };
  return { data: { proposal: { orderId, amount, by: session.userId, needsApproval: true } }, error: false };
}`,
      lines: [
        { code: "return ALL_TOOLS.filter((t) => allowed.has(t.name));", say: "The model is only told about tools this caller may use; it cannot ask for the others." },
        { code: "if (!session.roles.includes(\"staff\") && !session.roles.includes(\"admin\")) throw new Forbidden(\"propose_refund\");", say: "The tool checks again at execution; the list is not the only guard." },
        { code: "const order = await db.orders.findFirst({ where: { id: orderId, tenantId: session.tenantId } });", say: "Scope comes from the session, never from an argument the model filled in." },
        { code: "return { data: { proposal: { orderId, amount, by: session.userId, needsApproval: true } }, error: false };", say: "A write is a proposal; a person approves it in the UI before anything moves." },
      ],
    },
    useIt: "Enforce permissions in code at data queries, inside retrieval, in the tool list and inside each tool; take identity from the session; gate writes. Treat the model's instructions as a reminder. Write the low-privilege test before launch and keep it in CI; it is the test most likely to catch a career-ending bug.",
    takeaways: ["Permissions are enforced in code before the model sees data and before tools act.", "Retrieval filters inside the query; tool lists per role; tools re-check and use session identity.", "Instructions to the model are not a control.", "Test as a low-privilege user in CI."],
    terms: [["audience", "a permission label on documents and chunks deciding who may retrieve them"], ["tool allowlist", "the set of tools a role is permitted to use"], ["approval gate", "a required human confirmation before a write tool acts"]],
    reflect: { q: "If the retrieval filter is correct, why does the tool also need to check permissions?", a: "Because tools are reached by a different path: the model proposes a call with arguments it chose, possibly under injected instructions. Each enforcement point protects against a different failure; defence in depth means none of them trusts the others." },
  },

  "m42-multi-tenant-ai-applications": {
    simple: "A multi-tenant AI application serves many customer organisations from one system, so every store, query, index, cache and budget must be partitioned by tenant, and the isolation must be tested, not assumed.",
    concept:
      "In a **multi-tenant** product, many customer organisations (tenants) share one deployment. For an AI feature that means their conversations, documents, embeddings, memory, traces and usage all live in shared tables and shared indexes, separated by a tenant id. Isolation is the guarantee that tenant A never sees, retrieves, or is billed for tenant B's data.\n\nIsolation is enforced at every layer: the session resolves a tenant; every query includes it; the vector search filters by it; prompt caches are keyed by it (or contain only tenant-neutral content); rate limits, token budgets and cost attribution are per tenant; background jobs run per tenant with its own scope. Some customers require stronger isolation: a separate database schema, a separate index, or a dedicated deployment, usually for regulatory reasons, at a higher price.\n\nNoisy neighbours are the other concern: one tenant's bulk job must not degrade another's chat, so capacity is shared with per-tenant limits and priorities.",
    why:
      "Sharing infrastructure is what makes a SaaS product affordable, and a single cross-tenant leak is what ends it. AI features add new leak paths: a retrieval query without a tenant filter, a prompt cache keyed only by prompt text, a memory lookup by user id that is unique only within a tenant, a trace viewer that searches all traces. They also add new fairness problems: one tenant indexing 100,000 documents can consume the embedding rate limit for everyone. Multi-tenancy for AI is ordinary multi-tenancy with more places to get it wrong.",
    how: [
      "Resolve the tenant from the authenticated session; make it a required parameter of every data access function, never optional.",
      "Partition stores by tenant id with indexes that lead with it; filter the vector and keyword search by tenant inside the query.",
      "Key caches by tenant: prompt prefix caches must not include tenant data unless the key includes the tenant; response caches are per tenant.",
      "Enforce per-tenant rate limits, concurrency, token budgets and cost attribution; queue background jobs per tenant with fair scheduling.",
      "Offer isolation tiers: shared tables (default), separate schema or index, dedicated deployment; price them.",
      "Test isolation continuously: a CI job signs in as tenant A, attempts to read, retrieve and act on tenant B's data, and asserts failure.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Component", "Tenant isolation mechanism", "Leak if missed"],
        rows: [
          ["conversations, memory", "tenant id in every query; user ids scoped within tenant", "a user with the same id in another tenant sees their chats"],
          ["chunks and retrieval", "tenant filter inside the vector search", "another company's contracts quoted in an answer"],
          ["prompt cache", "no tenant data before the cache marker, or tenant in the cache key", "a cached prefix with tenant A's documents reused for tenant B"],
          ["traces and viewer", "tenant on every trace; viewer scoped by operator permission", "support staff of one tenant reading another's prompts"],
          ["rate limits and budgets", "per tenant", "one tenant's bulk job starves everyone"],
          ["billing", "usage aggregated per tenant", "costs misattributed; margins unknown"],
        ],
      },
      caption: "Every row is a shared resource with a tenant-shaped partition. The test suite walks every row as the wrong tenant.",
    },
    everyday: {
      title: "A serviced office building",
      text: "Many companies share one building: reception, lifts, meeting rooms, the post room. Each company's post goes to its own pigeonhole, its key cards open only its floor, and if one company books every meeting room for a month, the building manager imposes limits. Sharing the building is efficient; the pigeonholes, the key cards and the limits are what make it safe.",
    },
    engineering: {
      title: "The cache key that nearly leaked a contract",
      text: "A legal SaaS cached assembled prompts for repeated questions, keyed by a hash of the question text. The assembled prompt included retrieved chunks from the asking tenant's contracts. In staging, a tester at tenant B asked a question that tenant A's tester had asked an hour earlier and received an answer citing tenant A's clauses from the cache. The key had omitted the tenant. The fix was to include the tenant id in every cache key and to add the cross-tenant cache test to the isolation suite. It was caught in staging because the suite existed; the suite exists because someone imagined this bug.",
    },
    maths: {
      formula: "fair share per tenant = capacity ÷ active tenants, with a cap per tenant;   noisy-neighbour risk when any tenant's demand > cap",
      meaning: "Shared capacity is divided among active tenants with a per-tenant ceiling, so no single tenant can consume more than its cap however much it asks for.",
      worked: [
        "Embedding capacity 2,000,000 tokens per minute; 20 active tenants: fair share 100,000 tokens per minute each; cap set at 300,000 for bursts.",
        "Tenant X uploads 50,000 documents (≈ 720 million tokens). Without a cap it would occupy the entire capacity for 6 hours and block all chat retrieval indexing. With the 300,000 cap it takes 40 hours in the background and nobody else notices.",
        "Interactive requests get priority: with a reserved 40% of capacity for chat and 60% shared by background jobs under caps, a bulk upload can never push chat latency up.",
      ],
    },
    useIt: "Make tenant a required parameter of every data function, filter inside every search, key every cache by tenant, budget and bill per tenant, and run a cross-tenant isolation suite in CI that tries to read, retrieve, cache-hit and act across the boundary. Offer stronger isolation tiers for customers who need them.",
    takeaways: ["Many tenants share one system; every store, index, cache and budget is partitioned by tenant id.", "AI adds leak paths: retrieval filters, cache keys, memory lookups, trace viewers.", "Per-tenant limits and priorities prevent noisy neighbours.", "Isolation is tested continuously as the wrong tenant, not assumed."],
    terms: [["tenant", "one customer organisation sharing the deployment"], ["isolation", "the guarantee that tenants cannot see or affect each other's data"], ["noisy neighbour", "a tenant whose load degrades service for others"]],
    reflect: { q: "A prompt prefix cache is keyed by the prompt text, and the prefix contains only the shared system rules. Is it safe across tenants?", a: "Yes, as long as nothing tenant-specific is in the cached prefix. The moment retrieved chunks or tenant settings move before the cache marker, the key must include the tenant, or the cache becomes a leak." },
  },

  "m42-billing-and-usage-limits": {
    simple: "Billing and usage limits turn tokens and requests into metered units per customer, enforce caps and budgets in code, and align what customers pay with what the feature costs to run.",
    concept:
      "An AI feature has a marginal cost per use, so **billing and usage limits** matter more than for ordinary software. Billing starts with metering: every request records its tenant, feature, tokens, model and cost (from the gateway and traces), aggregated daily per tenant. Pricing then chooses a unit customers understand (messages, documents, 'AI credits', seats with a fair-use allowance) and maps it to the metered cost with a margin. Limits protect both sides: per-request caps on input and output tokens, per-user and per-tenant daily or monthly allowances, concurrency limits, and hard budgets that stop a runaway job before it becomes an invoice surprise.\n\nLimits are enforced in code before the model call, with clear messages when reached and a path to buy more. Customers see their usage in the product; finance sees cost and margin per tenant from the same data.",
    why:
      "Flat pricing with unmetered AI use invites a few tenants to consume most of the cost and makes margins unknowable. Metering without limits lets a bug or an abusive client run up thousands overnight. Limits without visibility surprise customers. Doing all three, metering, limits and transparency, keeps the feature profitable, protects against runaways, and makes usage-based tiers possible. It also feeds the cost-per-tenant view that decides pricing.",
    how: [
      "Meter: from each trace, write a usage event (tenant, user, feature, model, input/cached/output tokens, cost, timestamp); aggregate per tenant per day in a worker.",
      "Define units: pick a customer-facing unit (messages, documents, credits) and the conversion from metered cost; set tiers with allowances and overage prices.",
      "Enforce limits before calling the model: per-request token caps; per-user and per-tenant allowances checked against the daily aggregate plus today's running count; concurrency limits; a hard monthly budget per tenant.",
      "On limit: return a clear response ('monthly allowance reached; resets on the 1st or upgrade here'), log it, and never degrade silently.",
      "Show usage in the product (progress toward the allowance) and export aggregates to the billing system monthly.",
      "Alert finance and engineering when a tenant's cost exceeds its revenue or when overall margin drops.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Limit", "Scope", "Protects against", "Typical value"],
        rows: [
          ["max input tokens per request", "request", "a pasted 200-page document", "16,000"],
          ["max output tokens", "request", "runaway generation", "800"],
          ["concurrent requests", "user; tenant", "scripts hammering the endpoint", "3 per user; 50 per tenant"],
          ["daily messages", "user", "abuse and bots", "300"],
          ["monthly allowance", "tenant", "cost beyond the plan", "plan-dependent; overage billed"],
          ["hard monthly budget", "tenant", "invoice surprises; runaway jobs", "2× the plan's cost ceiling"],
        ],
      },
      caption: "Request caps catch single bad requests; allowances and budgets catch volume; all are enforced before the model is called.",
    },
    everyday: {
      title: "A mobile phone plan",
      text: "A plan has an allowance, a clear meter in the app, a warning at 80%, and either a cap or a priced overage beyond it. Nobody is surprised by the bill and the operator knows its margin per customer. AI usage limits are that plan for tokens.",
    },
    engineering: {
      title: "The script that would have cost £9,000 in a weekend",
      text: "A customer's intern wrote a script to summarise every ticket in their archive through the assistant's interactive endpoint: 180,000 requests queued for a Saturday night. Per-tenant concurrency (50) slowed it; the daily tenant allowance stopped it at 11 pm with a clear message in the response; the hard monthly budget would have stopped it again at twice the plan. Monday's conversation was 'we have a batch API at half price for this' rather than a dispute over a £9,000 invoice. The limits cost nothing to run and were written in an afternoon.",
    },
    maths: {
      formula: "margin per tenant = revenue − Σ (tokens × price) − allocated fixed cost;   break-even messages = plan price ÷ cost per message",
      meaning: "Metered cost per tenant against what they pay gives margin; the break-even tells you how large an allowance a plan can afford.",
      worked: [
        "A plan at £400 a month. Cost per message (from traces) = £0.012. Break-even = 400 ÷ 0.012 ≈ 33,000 messages. Set the allowance at 15,000 messages for a 55% gross margin at full use; overage at £0.03 per message.",
        "A tenant uses 9,000 messages: cost £108, revenue £400, margin £292 (73%).",
        "Another uses 40,000: cost £480 against £400 of plan revenue, plus 25,000 overage × £0.03 = £750; revenue £1,150; margin £670. Without overage billing, this tenant would have cost £80 more than it paid.",
      ],
    },
    code: {
      title: "Checking the allowance before the model call",
      lang: "ts",
      src: `export async function checkAllowance(db: Db, session: Session, estimatedTokens: number) {
  if (estimatedTokens > LIMITS.maxInputTokens) throw new LimitExceeded("request", "Message too long; please shorten it.");
  const today = await db.usageDaily.findUnique({ where: { tenantId_day: { tenantId: session.tenantId, day: todayKey() } } });
  const used = (today?.messages ?? 0) + (await redis.get("msgs:" + session.tenantId + ":" + todayKey())) ;
  const plan = await plans.for(session.tenantId);
  if (used >= plan.dailyMessages) throw new LimitExceeded("tenant-daily", "Daily allowance reached; resets at midnight UTC or upgrade your plan.");
  const month = await db.usageMonthly.findUnique({ where: { tenantId_month: { tenantId: session.tenantId, month: monthKey() } } });
  if ((month?.cost ?? 0) >= plan.hardBudget) throw new LimitExceeded("tenant-budget", "Monthly budget reached; contact your administrator.");
}`,
      lines: [
        { code: "if (estimatedTokens > LIMITS.maxInputTokens) throw new LimitExceeded(\"request\", \"Message too long; please shorten it.\");", say: "The cheapest check first: one oversized request is refused with a usable message." },
        { code: "if (used >= plan.dailyMessages) throw new LimitExceeded(\"tenant-daily\", \"Daily allowance reached; resets at midnight UTC or upgrade your plan.\");", say: "Volume limits compare today's aggregate plus the running counter against the plan; the message says when it resets and how to buy more." },
        { code: "if ((month?.cost ?? 0) >= plan.hardBudget) throw new LimitExceeded(\"tenant-budget\", \"Monthly budget reached; contact your administrator.\");", say: "A hard budget in money terms stops any runaway regardless of message counts." },
      ],
      note: "All three checks run before the model is called, so a refused request costs nothing.",
    },
    useIt: "Meter every request per tenant from traces, aggregate daily, and enforce request caps, allowances, concurrency and a hard budget before calling the model, with clear messages. Choose a customer-facing unit, price tiers from measured cost per unit with a margin, show usage in the product, and review margin per tenant monthly.",
    takeaways: ["Meter per tenant from traces; aggregate daily; export to billing.", "Enforce request caps, allowances, concurrency and hard budgets in code before the model call.", "Price in a unit customers understand, derived from measured cost with a margin.", "Show usage; refuse clearly; never degrade silently."],
    terms: [["metering", "recording usage per customer in billable units"], ["allowance", "the usage included in a plan before overage applies"], ["hard budget", "a spending ceiling that stops requests regardless of plan"]],
    reflect: { q: "Why enforce limits in the backend rather than in the client that shows the usage meter?", a: "Because the client can be bypassed by a script or a modified app; only the backend check protects the cost. The client's meter is for transparency, the backend's check is for enforcement." },
  },

  "m42-ai-application-testing": {
    simple: "Testing an AI application layers ordinary tests (units, integration, permissions) with evaluation suites for the model's behaviour and with tests of how the system handles the model being slow, wrong or unavailable.",
    concept:
      "**AI application testing** has three layers. The deterministic layer is ordinary: unit tests for prompt assembly (the template renders the right sections, delimiters are present, the token budget is respected), tool argument validation, permission filters, cache keys, limit checks, output validation and schema parsing. These run on every commit with the model mocked.\n\nThe behavioural layer is the evaluation suite (Modules 37 and 41): cases with graders, run on prompt and model changes and on a schedule, measuring correctness as pass rates rather than exact strings.\n\nThe resilience layer tests the system around a misbehaving model: a mocked provider that times out, returns 429, returns malformed JSON, returns a prompt-injection attempt, or streams half an answer and dies. The tests assert that fallbacks engage, partial text is kept, writes are not duplicated, and the user gets an honest message. Security tests run as a low-privilege user and as the wrong tenant.",
    why:
      "Teams either test nothing because 'the output is random' or run only an evaluation suite and miss that the code around the model is ordinary software with ordinary bugs. The deterministic layer catches most regressions cheaply and without a model call; the evaluation layer catches behaviour changes; the resilience layer catches the failures that only happen on the provider's bad day, which is exactly when nobody wants to discover them. The three together are what makes an AI feature shippable on a Friday.",
    how: [
      "Mock the model client behind the gateway interface so unit and integration tests run without network or cost.",
      "Unit-test prompt assembly: given inputs, assert the rendered prompt contains the expected sections in order, delimits data, and stays under the token budget; snapshot the template per version.",
      "Unit-test validation and permissions: tool argument parsing rejects bad input; retrieval queries include the tenant and audience filters; limit checks refuse correctly.",
      "Run the evaluation suite as a CI gate on prompt, retrieval and model changes, and nightly.",
      "Resilience tests with a scripted mock provider: timeout → fallback used and recorded; 429 → backoff then success; malformed JSON → one retry then safe fallback; stream cut → partial kept, error event sent; injected instruction in a tool result → no unauthorised tool call.",
      "Security tests: low-privilege user and wrong tenant attempt reads, retrievals, tool calls and cache hits across boundaries; assert failure.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "What it tests", "Model involved?", "When it runs"],
        rows: [
          ["deterministic", "prompt assembly, validation, permissions, limits, caching, parsing", "mocked", "every commit"],
          ["behavioural (evals)", "answer quality by category against a baseline", "real, pinned", "on prompt/model change; nightly"],
          ["resilience", "timeouts, 429s, bad JSON, cut streams, injections, duplicate writes", "scripted mock", "every commit"],
          ["security / isolation", "cross-user and cross-tenant reads, retrieval, tools, caches", "mocked", "every commit"],
          ["load", "throughput and latency under concurrency", "real or mock", "before launches and capacity changes"],
        ],
      },
      caption: "Only one layer needs the real model. The rest run in seconds on every commit.",
    },
    everyday: {
      title: "Testing a kitchen, not just tasting the food",
      text: "A health inspector does not only taste the dishes. They check the fridge temperatures, that raw and cooked are separated, that the fire blanket is where it should be, and what happens when the gas is cut. Tasting is the evaluation suite; the rest is the deterministic, security and resilience layers.",
    },
    engineering: {
      title: "The refactor that would have duplicated refunds",
      text: "A marketplace's returns agent had a resilience test: the mock payment service times out on the first refund call and the test asserts exactly one refund is recorded after the retry. A refactor of the action log moved the 'record before call' step to after the call. The test failed in CI: two refunds. The engineer had not touched the payment code and would not have thought to test it manually. The test existed because an earlier incident had been written up with 'add a test' as an action.",
    },
    code: {
      title: "A resilience test with a scripted mock provider",
      lang: "ts",
      src: `test("timeout on the primary falls back and records it, without duplicating writes", async () => {
  const provider = scriptedProvider([
    { kind: "timeout" },                                   // primary: first call times out
    { kind: "reply", text: "Your refund of £40 has been proposed." },   // fallback: succeeds
  ]);
  const payments = mockPayments({ failFirstCallWith: "timeout" });
  const trace = new Trace({ feature: "returns", conversationId: "c1", customerHash: "h" });

  const result = await runReturnsTurn({ provider, payments, trace, session: staffSession, message: "refund order 4417" });

  expect(result.text).toContain("proposed");
  expect(trace.modelSpans().map((s) => s.meta.fallback)).toEqual([undefined, true]);
  expect(payments.refundsRecorded()).toHaveLength(1);     // exactly one, despite the retry
  expect(trace.errors()).toEqual([]);
});`,
      lines: [
        { code: "{ kind: \"timeout\" },                                   // primary: first call times out", say: "The mock provider is scripted to fail the first call the way the real one does on a bad day." },
        { code: "const payments = mockPayments({ failFirstCallWith: \"timeout\" });", say: "The payment mock also times out once, so the retry path with the idempotency key is exercised." },
        { code: "expect(trace.modelSpans().map((s) => s.meta.fallback)).toEqual([undefined, true]);", say: "The trace proves the fallback was used and recorded as such." },
        { code: "expect(payments.refundsRecorded()).toHaveLength(1);     // exactly one, despite the retry", say: "The assertion that matters most: a retry after a timeout did not refund twice." },
      ],
    },
    useIt: "Mock the model behind the gateway and test prompt assembly, validation, permissions, limits and parsing on every commit; run the evaluation suite on change and nightly; script a misbehaving provider for resilience tests; run isolation tests as the wrong user and tenant. Turn every incident review into at least one new test.",
    takeaways: ["Three layers: deterministic (mocked model), behavioural (evaluation suite), resilience (scripted failures); plus isolation tests.", "Most regressions are in ordinary code around the model and are caught without a model call.", "Resilience tests assert fallbacks, partial text, honest errors and no duplicate writes.", "Every incident adds a test."],
    terms: [["scripted mock provider", "a fake model client that returns a planned sequence of replies and failures"], ["resilience test", "a test of system behaviour when a dependency fails"], ["isolation test", "a test that attempts cross-user or cross-tenant access and expects failure"]],
    reflect: { q: "Why is 'the output is random so we cannot test it' wrong?", a: "The output's wording is random; its properties are not, and the code around the model is fully deterministic. Evaluation suites test properties as pass rates; unit, resilience and isolation tests test the code with the model mocked. Only the wording is untestable, and nobody needs to test the wording." },
  },

  "m42-user-feedback-systems": {
    simple: "A user feedback system is the product-side machinery that captures ratings, corrections and implicit signals, routes them to the people and processes that act on them, and closes the loop back to the user.",
    concept:
      "Module 41 covered collecting feedback as an operations signal. A **user feedback system** is the product feature built around it: the controls and their placement, what happens when a user says an answer was wrong, who sees it, how it becomes a fix, and how the user learns the fix happened.\n\nThe pieces: lightweight controls under every answer (thumbs, a reason picker such as 'inaccurate', 'incomplete', 'off-topic', 'unsafe', and an optional comment); field-level corrections for structured outputs (fix the extracted invoice total and submit); implicit capture (re-asks, escalations, edits, acceptance); a triage queue where negative feedback is grouped by intent, source document and version; routing rules (unsafe → security within the hour; inaccurate on a policy → content owner; recurring → evaluation case and prompt backlog); and closure: the user sees 'this has been fixed' or the corrected answer on their next visit when it has.\n\nCorrections are also training data: field-level fixes become labelled examples for evaluation and, in time, for fine-tuning.",
    why:
      "Feedback nobody acts on trains users to stop giving it. A thumbs-down that disappears into a database is a dead control within a month; a thumbs-down that produces a visible fix is a loop users join. For the product, feedback is the cheapest source of truth about failure, the raw material for evaluation cases, and, for structured features, free labelled data. Designing the system around action and closure is what makes the signal keep flowing.",
    how: [
      "Place controls under every answer: thumbs, a one-tap reason, an optional comment; for structured outputs, inline field correction with submit.",
      "Store every signal with the trace id, user hash, tenant, version and timestamp; verify ownership of the trace.",
      "Build a triage view: negative feedback grouped by intent, by cited source and by release label, with the example traces one click away.",
      "Route automatically: unsafe or data-exposure reports to the security on-call within the hour; inaccurate answers citing a document to its owner; recurring issues to the evaluation case file and the prompt backlog.",
      "Close the loop: when a fix ships (article updated, prompt changed), notify users who reported it, or show the corrected answer in their conversation.",
      "Measure the system itself: feedback rate, time to triage, time to fix, and the share of reporters who report again.",
    ],
    visual: {
      kind: "flow",
      steps: ["controls under the answer (thumbs, reason, comment, field fix)", "stored by trace id, tenant, version", "triage queue grouped by intent / source / version", "routing: security · content owner · eval cases · prompt backlog", "fix ships", "reporter notified; corrected answer shown"],
      caption: "The last two boxes are what keep the first one in use.",
    },
    everyday: {
      title: "A suggestion box that answers back",
      text: "A suggestion box that is emptied into a bin fills up for a month and then stays empty. One where the manager posts 'you asked for a later closing time; we now close at 8' next to it is never empty. The difference is not the box; it is the visible reply.",
    },
    engineering: {
      title: "Field corrections that became the evaluation set",
      text: "An accounts-payable product extracted invoice fields with a model and let clerks correct any field inline before approval. Every correction was stored with the original value, the document and the model version. Within three months the corrections were a 4,000-example labelled set that measured per-field accuracy by vendor and by version, caught a regression in date parsing on a model update within a day, and later fine-tuned a smaller model that matched the large one on their invoices at a fifth of the cost. The clerks had been doing their job; the system had been collecting the labels.",
    },
    maths: {
      formula: "feedback yield = fixes shipped ÷ negative reports;   closure rate = reporters notified of a fix ÷ reporters;   repeat-report rate = reporters who report again ÷ reporters",
      meaning: "Yield measures whether feedback leads to change; closure whether users see it; repeat rate whether they keep participating. The last is the health of the system.",
      worked: [
        "Month 1: 620 negative reports, 25 fixes shipped: yield 4%; nobody notified: closure 0%; repeat-report rate 11%.",
        "Month 4, after triage grouping and notifications: 540 reports (many duplicates now grouped), 70 fixes: yield 13%; 410 reporters notified: closure 76%; repeat-report rate 38%.",
        "The feedback volume fell slightly while its usefulness tripled and participation more than tripled, because users saw results.",
      ],
    },
    useIt: "Design feedback as a loop: easy capture under every answer, triage grouped by cause, routing to owners with deadlines, and closure visible to the reporter. For structured features, make corrections first-class and store them as labelled data. Measure yield, closure and repeat participation, not just the thumbs-down rate.",
    takeaways: ["Feedback is a product loop: capture, triage, route, fix, close.", "Group by intent, source and version; route unsafe reports fast and recurring ones to evaluation cases.", "Closure, telling the reporter it was fixed, keeps the signal alive.", "Field corrections are free labelled data."],
    terms: [["reason picker", "a one-tap list of failure types under a thumbs-down"], ["triage queue", "the grouped view of negative feedback that owners work through"], ["closure", "telling a reporter that their feedback led to a fix"]],
    reflect: { q: "Why group negative feedback by the cited source document rather than reading reports one by one?", a: "Because one stale article produces dozens of reports that look different on the surface; grouping shows the single cause, fixes all of them at once, and makes the content owner's job a list of articles rather than a pile of complaints." },
  },

  "m42-product-analytics": {
    simple: "Product analytics for an AI feature measures whether it delivers value: adoption, task completion, time saved, retention and cost per outcome, tied to the same traces that measure quality and spend.",
    concept:
      "Operations metrics say whether the feature works; **product analytics** says whether it is worth having. The questions: who uses it and how often (adoption and frequency); whether it finishes the job (task completion, resolution without escalation, acceptance of suggestions); what it saves (handle time, time to first draft, tickets deflected); whether users come back (retention, weekly active users of the feature); which intents and segments it serves well and badly; and what an outcome costs (cost per resolved conversation, per processed document) against what it is worth.\n\nThe data comes from the same traces plus product events (opened, sent, accepted, escalated, completed), joined by trace and user. Funnels show where users drop; cohorts show whether retention improves by version; experiments (A/B by release label) show whether a change moved the outcome, not just the quality score.\n\nThe discipline is to define the outcome metric before launch and to report cost per outcome alongside it.",
    why:
      "An AI feature can score well on evaluations, run reliably, and still not matter: users try it once and leave, or it answers questions nobody needed answered, or it costs more per resolution than the people it was meant to help. Product analytics is how the team and the business learn whether the investment pays, which segments to focus on, and which changes to make next. Without it, decisions are made on demos and anecdotes, and the feature is judged by whoever shouted last.",
    how: [
      "Define the outcome metric per feature before launch: resolved without escalation, document processed and accepted, suggestion accepted, task completed.",
      "Emit product events with the trace id and user hash: feature opened, message sent, answer shown, source clicked, suggestion accepted or rejected, escalated, task completed, feature abandoned.",
      "Build funnels (opened → sent → answered → completed) and cohorts (weekly active users by signup month and by release label).",
      "Join with traces for cost and quality: cost per completed task, completion rate by intent, by segment, by version.",
      "Run experiments by release label: split users, compare the outcome metric with enough samples, decide.",
      "Report monthly: adoption, completion, time saved, retention, cost per outcome, and the top failing intents, to product, engineering and finance together.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Question", "Metric", "Source", "Good sign"],
        rows: [
          ["Do people use it?", "weekly active users; sessions per user", "product events", "rising; repeat use"],
          ["Does it finish the job?", "completion rate; resolution without escalation", "events + traces", "above the human baseline for easy intents"],
          ["What does it save?", "handle time; time to first draft; deflected tickets", "events, support system", "measurable hours or tickets"],
          ["Do they come back?", "4-week retention of feature users", "cohorts", "flat or rising by version"],
          ["What does an outcome cost?", "cost per resolved conversation", "traces", "below the cost of the alternative"],
          ["Where does it fail?", "completion by intent and segment", "events + intent classifier", "the worst intents are known and owned"],
        ],
      },
      caption: "Six questions, each answerable from traces plus a handful of product events.",
    },
    everyday: {
      title: "A café's loyalty card, not just its reviews",
      text: "Good reviews are the evaluation score. The loyalty card data says whether people came back, what they ordered, which hours are empty, and whether the new pastry sold or just got praised. A café that reads only its reviews does not know it is losing the breakfast crowd. Product analytics is the loyalty card.",
    },
    engineering: {
      title: "The feature that scored 94% and deflected nothing",
      text: "A telecom launched a billing assistant that scored 94% on its evaluation suite. Product analytics told a different story: 61% of sessions ended with escalation to a human, mostly on the 'dispute a charge' intent, where the assistant explained the charge accurately but could not do what users wanted, which was to open a dispute. Cost per resolved conversation was £1.40, more than the £1.10 cost of the human-handled baseline. The team added a dispute-filing tool with an approval gate; escalation fell to 28%, cost per resolution to £0.45, and deflected tickets became the number reported to the board. The evaluation suite had been measuring the wrong thing: accuracy, when the outcome was resolution.",
    },
    maths: {
      formula: "cost per outcome = Σ cost of conversations ÷ outcomes achieved;   value = outcomes × value per outcome − Σ cost;   experiment: outcome rate(B) − outcome rate(A) with noise ≈ 2 × √(p(1 − p)(1 ÷ n_A + 1 ÷ n_B))",
      meaning: "Cost is divided by successes, not by requests, so failures make outcomes more expensive. Experiments compare outcome rates between versions with a sample-size check.",
      worked: [
        "Before: 20,000 conversations at £0.55 each = £11,000; 7,800 resolved without escalation: cost per resolution = 11,000 ÷ 7,800 = £1.41.",
        "After the dispute tool: 20,000 conversations at £0.60 = £12,000; 14,400 resolved: £0.83 per resolution... with the human baseline at £1.10 per ticket, 14,400 deflected tickets save £15,840 against £12,000 spent: positive value for the first time.",
        "Experiment: resolution rate 39% (A, 10,000 users) vs 72% (B, 10,000 users); noise ≈ 2 × √(0.555 × 0.445 × 0.0002) = 2 × 0.007 = 1.4 points; the 33-point difference is unmistakable.",
      ],
    },
    useIt: "Define the outcome metric before building, emit product events with trace ids, and report adoption, completion, savings, retention and cost per outcome monthly alongside quality and spend. Use experiments by release label to decide changes on outcomes, and let the worst-performing intents set the roadmap.",
    takeaways: ["Operations says it works; product analytics says it is worth it.", "Define the outcome metric first; measure completion, savings, retention and cost per outcome.", "Join product events with traces by trace id; experiment by release label.", "The worst intents are the roadmap."],
    terms: [["outcome metric", "the measure of whether the feature achieved the user's goal"], ["cost per outcome", "total spend divided by successful outcomes"], ["cohort", "a group of users defined by a shared start date or version, tracked over time"]],
    reflect: { q: "Why can a feature pass every evaluation and still be removed from the product?", a: "Because evaluations measure the quality of answers to the questions in the suite, while the product is judged on outcomes: whether users return, whether tasks complete, and whether each outcome costs less than it is worth. A correct answer to the wrong need is a well-made feature nobody wants." },
  },
};

export const M42_QUIZ: Quiz[] = [
  {
    q: "Where should the system prompt template live, and why?",
    options: ["In the mobile app, so it loads fast", "In the backend repository, versioned and reviewed, rendered server-side", "In a database field product managers edit directly", "In the model provider's dashboard"],
    answer: 1,
    why: ["The client would expose it and need a release per change.", "Correct. It changes often, must be evaluated and rolled back, and may contain instructions users must not alter.", "Edits become untracked, unreviewed and unversioned.", "Not under your version control or evaluation."],
    reason: true,
  },
  {
    q: "A new handler calls the provider SDK directly instead of the gateway. What is lost?",
    options: ["Nothing; the SDK handles retries", "Pinning, timeouts, fallback, caching, cost recording and the fallback metric", "Only the cost dashboard", "Streaming"],
    answer: 1,
    why: ["The SDK retries, but pinning, fallback and recording live in the gateway.", "Correct. Every reliability and accountability feature is in the one place the call bypassed.", "More than cost: reliability too.", "Streaming is unrelated to the gateway."],
  },
  {
    q: "The chat UI renders model answers with raw HTML enabled for nicer tables. What is the risk?",
    options: ["Slower rendering", "Cross-site scripting: the model can be made to emit a script tag that runs in the user's session", "Tables may misalign", "None, the model is trusted"],
    answer: 1,
    why: ["Performance is not the issue.", "Correct. Model output is untrusted text; render it sanitised, never as HTML.", "Cosmetic at worst.", "The model's output can be steered by a user or an injected document."],
  },
  {
    q: "Why does every chunk carry tenant and audience columns rather than the document alone?",
    options: ["To make the table bigger", "Because retrieval ranks chunks and must filter before ranking, cheaply, inside the query", "Because documents do not have ids", "It is required by the vector index"],
    answer: 1,
    why: ["Denormalisation is deliberate, not waste.", "Correct. The filter must be an indexed predicate on the table being searched so no forbidden chunk reaches the prompt.", "Documents have ids; joining on every search is slower and easy to forget.", "The index does not require it; the security does."],
  },
  {
    q: "A conversation endpoint loads by conversation id only. What is the minimum fix?",
    options: ["Make ids longer", "Add the session's user and tenant to the query and return 404 if no match", "Tell the model not to reveal other users' chats", "Rate-limit the endpoint"],
    answer: 1,
    why: ["Guessable or leaked ids still open other users' data.", "Correct. Scope every read by the authenticated identity; a conversation that is not yours should look like one that does not exist.", "The model is not an enforcement point.", "Slows abuse; does not prevent it."],
    reason: true,
  },
  {
    q: "A prompt cache is keyed by the question text and the cached prompt contains retrieved chunks. In a multi-tenant system this is…",
    options: ["Fine, cache hits save money", "A cross-tenant leak unless the tenant id is part of the key", "Only a problem for large tenants", "Safe if the chunks are short"],
    answer: 1,
    why: ["It saves money and leaks data.", "Correct. Another tenant asking the same question gets a prompt built from the first tenant's documents.", "Any two tenants with overlapping questions.", "Length is irrelevant."],
  },
  {
    q: "Which limit stops a runaway script costing thousands overnight even if message counts look normal?",
    options: ["Max output tokens", "A hard monthly budget per tenant in money terms, enforced before the model call", "The client-side usage meter", "Thumbs-down rate"],
    answer: 1,
    why: ["Caps one request, not the total.", "Correct. Money is the thing being protected; the check runs server-side before any cost is incurred.", "Clients can be bypassed.", "Not a limit."],
  },
  {
    q: "A feature scores 94% on evaluations but product analytics shows 61% of sessions escalate to a human. What does that tell you?",
    options: ["The evaluation suite is broken", "The answers are accurate but the feature does not achieve the user's outcome; the outcome metric should drive the roadmap", "Users do not like AI", "The feature should be removed"],
    answer: 1,
    why: ["The suite measures what it was built to measure: answer quality.", "Correct. Quality and value are different measurements; the escalating intents show what capability is missing.", "A blanket explanation that the intent breakdown would disprove.", "Perhaps eventually, but first find and fix the failing intents."],
  },
];

export const M42_EXERCISES: Exercise[] = [
  {
    title: "Draw the request path for a document assistant",
    kind: "build",
    task: "Write the ordered steps a user's message takes through a multi-tenant document assistant, from the browser to the streamed answer, naming at each step what is checked, loaded or recorded. Mark the three places where a permission failure would be caught.",
    hints: ["Auth → tenant → permissions comes before any data is loaded.", "Retrieval filter, tool list and tool execution are the enforcement points."],
    solution: "1. Client sends message + conversation id with the session cookie; no key, no prompt. 2. API authenticates, resolves tenant and roles, checks request limits and allowances. 3. Loads the conversation scoped by user and tenant (permission point 1). 4. In parallel: user memory for this user; retrieval with tenant and audience filters inside the vector and keyword query (permission point 2); rerank. 5. Assembles the versioned prompt: rules, delimited sources, memory, window, message; checks the token budget; enables prefix caching for the stable part. 6. Loop runner calls the gateway (pinned model, timeout, retries, fallback, cost on the trace) with the per-role tool list; on tool_use, validates arguments, re-checks permission with session identity, gates writes behind approval (permission point 3). 7. Streams status, deltas, sources, done (trace ref) to the client; validates structured outputs. 8. Stores the assistant message with trace id; writes the trace; enqueues memory extraction and usage aggregation; feedback controls render under the answer.",
  },
  {
    title: "Price a plan from measured cost",
    kind: "calculate",
    task: "Traces show a help-desk assistant costs £0.018 per message. You want a 60% gross margin at full allowance use on a £300 per month plan, and an overage price with the same margin. Compute the allowance and the overage price, then say what a tenant using 25,000 messages pays and what margin you make on them.",
    hints: ["Allowance cost = 40% of the plan price.", "Overage price = cost ÷ (1 − margin)."],
    solution: "Allowance cost budget = 0.4 × £300 = £120 → allowance = 120 ÷ 0.018 ≈ 6,600 messages. Overage price = 0.018 ÷ 0.4 = £0.045 per message. A tenant using 25,000 messages: 18,400 over the allowance × £0.045 = £828 overage; revenue = £300 + £828 = £1,128; cost = 25,000 × 0.018 = £450; margin = £678 (60%). Without overage billing the same tenant would cost £450 against £300 revenue: a loss of £150.",
  },
  {
    title: "Write the isolation test plan",
    kind: "build",
    task: "List the test cases a CI job should run, signed in as tenant A (low-privilege user), against tenant B's data, covering conversations, memory, retrieval, tools, caches and the trace viewer. For each, state the expected result.",
    hints: ["Every shared resource from the multi-tenant table is a case.", "Expected results are 404, empty, or an error, never a partial success."],
    solution: "1. GET tenant B's conversation id → 404. 2. Load memory facts after creating a user id in B identical to A's user id → only A's facts. 3. Ask a question whose only matching chunks belong to B → retrieval returns nothing above threshold; the answer declines; assert no B chunk id in the trace's retrieve span. 4. Ask a question matching a staff-only chunk in A → not retrieved for a customer role. 5. Attempt to call a tool outside the role's allowlist by crafting a tool_use → rejected before execution; attempt lookup_order with B's order id → not found. 6. Repeat a question B asked a minute earlier → no cache hit containing B's content (cache key includes tenant). 7. As a support operator scoped to A, search traces → only A's traces. 8. Delete A's document and re-ask → its chunks are gone and the cached answer is invalidated. All run on every commit with the model mocked.",
  },
  {
    title: "Define the outcome metric and the first report",
    kind: "think",
    task: "For an assistant that drafts replies for customer-service agents, define the outcome metric, three supporting metrics, the product events needed to compute them, and the cost-per-outcome formula. Then sketch the first monthly report's headline numbers for a team that handles 50,000 tickets a month.",
    hints: ["The outcome is what the agent does with the draft, not whether the draft was good.", "Cost per outcome divides by successes."],
    solution: "Outcome metric: drafts sent with minor or no edits (accepted drafts). Supporting: edit distance between draft and sent reply; handle time per ticket with and without a draft; agent weekly usage (share of tickets where the draft was requested). Events: draft requested, draft shown, draft edited (with edit size), reply sent, draft discarded, each with the trace id and agent hash; join with the ticket system for handle time. Cost per outcome = Σ draft costs ÷ accepted drafts. Report sketch: 50,000 tickets; drafts requested on 31,000 (62% adoption); 19,800 accepted (64% acceptance); median handle time 6.1 min with a draft vs 9.4 without (35% saved, ≈ 1,090 agent-hours); cost £0.021 per draft → £651 spent, £0.033 per accepted draft; worst intents by acceptance: refunds (41%) and account closure (38%), which become next month's prompt and tool work.",
  },
];
