import type { Exercise, LessonBody, Quiz } from "../types";

// Module 39: Deployment and infrastructure. One concept per lesson.

export const M39_BODIES: Record<string, LessonBody> = {
  "m39-deploying-an-ai-application": {
    simple: "Deploying an AI application means getting the code, the model access, the configuration and the surrounding services running reliably where users can reach them, with a way to change and undo it.",
    concept:
      "**Deploying** is the step from 'works on my laptop' to 'runs for users'. For an AI application it involves more moving parts than a plain web app: the application code, the model (an API you call or weights you host), prompts and their versions, vector indexes, secrets, queues for background work, tracing and monitoring, and the evaluation suite that guards each change.\n\nA deployment pipeline packages the code, runs tests and evaluations, moves the package through environments (development, staging, production), releases it gradually, watches the metrics, and rolls back if they move the wrong way. Prompts and model versions are configuration that goes through the same pipeline as code, because a prompt edit can break a product as surely as a code change.\n\nThe goal is not a single heroic launch but a routine: small changes, measured, reversible.",
    why:
      "AI features fail in ways that look fine on a laptop: the provider rate-limits at real traffic, a prompt edit regresses a category, a model version changes behaviour, a GPU runs out of memory at peak. A pipeline with environments, evaluations, gradual release and rollback exists to catch each of those before all users see it.\n\nIt also makes change cheap. Teams that can deploy a prompt tweak in ten minutes with a safety net iterate; teams that fear deploys stop improving.",
    how: [
      "Package the application (a container image) with pinned dependencies; keep secrets, prompts and model ids as configuration.",
      "Run unit tests and the evaluation suite in CI; block on failures and regressions.",
      "Deploy to staging with production-like configuration and run smoke tests against real providers in test mode.",
      "Release to production gradually: a canary slice of traffic, then more, watching error rate, latency, cost and quality signals.",
      "Keep the previous version ready; roll back on any threshold breach.",
      "Record what was deployed: code version, prompt version, model id, index version.",
    ],
    visual: {
      kind: "flow",
      steps: ["commit (code + prompts + config)", "CI: tests + evals", "build image", "staging: smoke tests", "canary 5% → 50% → 100%", "monitor; roll back if needed"],
      caption: "Prompts and model versions ride the same pipeline as code. Nothing reaches users without passing the evaluations.",
    },
    everyday: {
      title: "Opening a new restaurant menu",
      text: "A restaurant does not swap its whole menu on a Saturday night. The chef tests dishes in the kitchen, runs them as specials for a week, watches what comes back uneaten, and keeps the old dish ready in case. Deployment is the same discipline for software: test, trial on a slice, watch, keep the way back.",
    },
    engineering: {
      title: "Shipping a support assistant every day",
      text: "A SaaS company's support assistant is deployed through one pipeline: every merge runs 600 evaluation cases (12 minutes), builds a container, deploys to staging, runs 40 smoke tests against the real model provider, then releases to 5% of traffic for 30 minutes while a dashboard compares error rate, time to first token, cost per conversation and thumbs-down rate against the current version. If all are within bounds it goes to 100%; otherwise it rolls back automatically and posts the diff. Prompt edits go through the same path. They ship about three times a day.",
    },
    maths: {
      formula: "canary exposure = traffic share × duration;   expected affected users on failure = exposure × users per hour",
      meaning: "A canary limits how many users a bad release touches before the metrics reveal it.",
      worked: [
        "10,000 users/hour. A canary of 5% for 30 minutes exposes 0.05 × 0.5 × 10,000 = 250 users.",
        "A full release found broken after 30 minutes exposes 5,000.",
        "With a metric alert at 10 minutes and automatic rollback, canary exposure falls to about 83 users.",
      ],
    },
    code: {
      title: "A deployment pipeline, in outline",
      lang: "bash",
      src: `# .ci/deploy.sh — run by CI on every merge to main
set -euo pipefail

npm ci && npm test                                   # unit tests
npm run evals -- --baseline evals/baseline.json      # fails on regression per category
docker build -t registry/assistant:$GIT_SHA .
docker push registry/assistant:$GIT_SHA

deploy --env staging --image registry/assistant:$GIT_SHA --config config/staging.yaml
npm run smoke -- --target https://staging.assistant.internal

deploy --env prod --image registry/assistant:$GIT_SHA --canary 5
watch-metrics --minutes 30 --max-error-rate 0.5 --max-p95-ttft-ms 2500 --max-thumbs-down-delta 0.02 || rollback --env prod
deploy --env prod --image registry/assistant:$GIT_SHA --canary 100
record-release --sha $GIT_SHA --prompt-version $(cat prompts/VERSION) --model $(yq .model config/prod.yaml)`,
      lines: [
        { code: "npm run evals -- --baseline evals/baseline.json      # fails on regression per category", say: "The evaluation suite is a gate, not a report. A prompt edit that drops a category stops here." },
        { code: "docker build -t registry/assistant:$GIT_SHA .", say: "One immutable image per commit: what was tested is what gets deployed." },
        { code: "deploy --env prod --image registry/assistant:$GIT_SHA --canary 5", say: "Five percent of traffic first." },
        { code: "watch-metrics --minutes 30 --max-error-rate 0.5 --max-p95-ttft-ms 2500 --max-thumbs-down-delta 0.02 || rollback --env prod", say: "Thresholds on errors, latency and quality signals; a breach rolls back without a human." },
        { code: "record-release --sha $GIT_SHA --prompt-version $(cat prompts/VERSION) --model $(yq .model config/prod.yaml)", say: "The release record ties code, prompt and model versions together, so any trace can be explained later." },
      ],
    },
    useIt: "Treat the first production deploy of an AI feature as the start of a routine: a pipeline with evaluation gates, staging smoke tests, canary releases watched on error, latency, cost and quality, automatic rollback, and a release record of code, prompt and model versions. Prompt changes go through it too.",
    takeaways: ["Deployment is a routine of small, measured, reversible changes.", "Prompts, model ids and indexes are configuration that rides the same pipeline as code.", "Evaluations gate; canaries limit exposure; rollback is automatic.", "Record code, prompt and model versions per release."],
    terms: [["deployment pipeline", "the automated steps from commit to production"], ["canary release", "sending a small share of traffic to a new version first"], ["smoke test", "a quick check that the deployed system basically works"]],
    reflect: { q: "A product manager edits the system prompt directly in a dashboard and it goes live immediately. What is the risk, and what should happen instead?", a: "The edit skips evaluations, staging and canary; a wording change can regress a category for every user at once. Prompts belong in version control and go through the pipeline, with the dashboard editing a branch that triggers it." },
  },

  "m39-model-serving": {
    simple: "Model serving is the software that loads a model and answers requests fast and efficiently; you either call a provider's serving or run a serving engine yourself for open-weight models.",
    concept:
      "A trained model is a file of weights. **Model serving** is what turns that file into an endpoint: a process that loads the weights into memory (usually GPU memory), accepts requests, runs inference, and returns results, while handling many users at once. For hosted models the provider does this and you call an API. For open-weight models you run a serving engine such as vLLM, TGI, Triton or Ollama.\n\nA serving engine does far more than call the model in a loop. It batches concurrent requests so the GPU stays busy, keeps a cache of attention state so each new token is cheap, streams tokens as they are produced, applies limits on length and concurrency, exposes health and metrics endpoints, and often supports several models or adapters on one machine. The difference between a naive loop and a serving engine is often ten times the throughput on the same hardware.",
    why:
      "GPUs are expensive and idle most of the time if requests are handled one at a time. Serving engines exist to extract the most work from each GPU: batching, caching and scheduling are what make per-token costs reasonable. They also give you the operational basics (health checks, metrics, graceful shutdown) that a research script lacks.\n\nFor most teams the decision is whether to serve at all: a provider's API is serving done by someone else, at a per-token price and with no hardware to run.",
    how: [
      "Decide: call a provider's API, or self-serve open weights for cost, privacy or latency reasons.",
      "If self-serving, choose an engine, a model format and a quantisation that fit the GPU memory.",
      "Load the weights once at startup; keep the process warm; expose a health endpoint that returns ready only after loading.",
      "Configure batching, maximum concurrent sequences, maximum tokens and timeouts.",
      "Expose an API compatible with your client code (many engines mimic the common chat API shape).",
      "Export metrics: queue length, tokens per second, GPU memory, latency percentiles.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Provider API", points: ["no hardware, no engine to run", "pay per token; capacity is theirs", "latest models; data leaves your network", "rate limits you do not control"] },
      right: { title: "Self-served open weights", points: ["an engine on your GPUs", "pay for hardware; capacity is yours to size", "model choice limited to open weights; data stays", "you own uptime, upgrades and tuning"] },
      caption: "Both are 'model serving'. The right column is a job; the left column is a bill.",
    },
    everyday: {
      title: "A cookbook versus a restaurant kitchen",
      text: "A recipe file is like model weights: all the knowledge, no meals. A kitchen that takes orders, cooks several at once, keeps the oven hot and plates dishes as they are ready is the serving engine. You can run your own kitchen or order from one that already exists.",
    },
    engineering: {
      title: "Moving a classification workload off the provider",
      text: "An insurance company classified 2 million documents a month through a provider API at a cost that had grown to the size of a salary. They self-served a 7-billion-parameter open model with vLLM on two GPUs: weights loaded once, continuous batching, 1,800 tokens per second per GPU. Latency rose slightly, cost fell by 80%, and documents no longer left their network. The chat assistant stayed on the provider, because quality mattered more there and traffic was bursty.",
    },
    maths: {
      formula: "GPU-hours needed = tokens per day ÷ (tokens per second per GPU × 3,600 × utilisation)",
      meaning: "Capacity planning for a serving engine: how much work, divided by how fast one GPU can do it when kept busy.",
      worked: [
        "2 million documents × 1,500 tokens = 3 billion tokens per month ≈ 100 million per day.",
        "One GPU at 1,800 tokens/s × 3,600 s = 6.5 million tokens per hour at full utilisation; at 70% utilisation ≈ 4.5 million.",
        "100 million ÷ 4.5 million ≈ 22 GPU-hours per day: one GPU running all day, a second for headroom.",
        "Provider price £0.50 per million tokens: £1,500/month. Two GPUs at £1.20/hour: £1,750/month but handles 3× the volume, so unit cost is lower and grows with volume.",
      ],
    },
    code: {
      title: "Serving an open-weight model with vLLM",
      lang: "bash",
      src: `# Start a serving engine for an open-weight model on one GPU
python -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Llama-3.1-8B-Instruct \\
  --dtype bfloat16 \\
  --max-model-len 8192 \\
  --max-num-seqs 64 \\
  --gpu-memory-utilization 0.90 \\
  --port 8000

# Health and metrics
curl -s localhost:8000/health
curl -s localhost:8000/metrics | grep -E "num_requests_running|gpu_cache_usage"

# A request, same shape as a hosted chat API
curl -s localhost:8000/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "messages": [{"role": "user", "content": "Classify: the roof leaks after heavy rain"}],
  "max_tokens": 50
}'`,
      lines: [
        { code: "  --max-model-len 8192 \\", say: "The longest request the engine will accept. Memory for the cache is reserved from this number." },
        { code: "  --max-num-seqs 64 \\", say: "How many requests may be in flight at once; the engine batches them on the GPU." },
        { code: "  --gpu-memory-utilization 0.90 \\", say: "Use 90% of GPU memory for weights plus cache; the rest is headroom." },
        { code: "curl -s localhost:8000/metrics | grep -E \"num_requests_running|gpu_cache_usage\"", say: "Serving metrics for the dashboard: queue depth and cache pressure tell you when to add a GPU." },
      ],
    },
    useIt: "Use a provider's API by default; self-serve open weights when cost at volume, data residency or latency demand it. If you self-serve, use a real engine with batching and caching, size GPUs from tokens per day, expose health and metrics, and keep the client API shape identical so you can switch back.",
    takeaways: ["Serving turns weights into an endpoint with batching, caching, streaming and limits.", "Provider API = serving done for you; self-serving = an engine on your GPUs.", "Engines give several times the throughput of a naive loop.", "Plan capacity from tokens per day and tokens per second per GPU."],
    terms: [["model serving", "running a model as an endpoint that handles many requests efficiently"], ["serving engine", "software such as vLLM or TGI that loads weights and serves requests with batching and caching"], ["open-weight model", "a model whose weights you can download and run"]],
    reflect: { q: "Why does a serving engine need to know the maximum sequence length up front?", a: "It reserves GPU memory for the attention cache based on the longest possible request times the number of concurrent sequences. A higher maximum means fewer concurrent requests fit; choosing it is a capacity decision." },
  },

  "m39-api-servers": {
    simple: "The API server is your own service between clients and models: it authenticates, validates, assembles context, calls models and tools, streams responses, and records everything.",
    concept:
      "Clients should never call a model provider directly. The **API server** is the application tier that owns the request: it authenticates the user, validates input, assembles the prompt from history, retrieval and tools, calls the model (streaming where useful), runs tool calls with the user's permissions, validates output, writes traces, and returns the result. It is where keys live, where budgets are enforced and where every security boundary from the previous module sits.\n\nDesign choices that matter for AI workloads: long-lived requests (a streamed answer may take 30 seconds), so the server must handle many open connections cheaply and set timeouts carefully; idempotency for retried requests; backpressure when the provider slows; separation of interactive endpoints from background jobs; and health endpoints that reflect dependencies. Node, Python (FastAPI) and Go are all common; the framework matters less than these properties.",
    why:
      "Without a server, keys end up in clients, permissions cannot be enforced, and there is nowhere to assemble context, run tools or record traces. With a badly designed one, a slow provider ties up every worker and the whole product stalls.\n\nThe API server exists as the single place where requests are governed. Every lesson about boundaries, budgets and tracing is implemented here.",
    how: [
      "Expose a small set of endpoints: start or continue a conversation (streaming), submit feedback, confirm a proposed action.",
      "Middleware in order: authentication, rate limiting, input validation, trace start.",
      "Assemble context: history window, summary, user facts, retrieved chunks, allowed tools.",
      "Call the model with a timeout and an abort signal tied to the client connection; stream deltas as server-sent events.",
      "Execute tool calls through the permission layer; loop until the model answers or a budget ends.",
      "Validate output, finish the trace, return; handle disconnects by cancelling the upstream call.",
    ],
    visual: {
      kind: "flow",
      steps: ["client", "auth · rate limit · validate", "context assembly", "model call (streaming, timeout, abort)", "tool loop (permissions, proposals)", "output validation · trace", "client"],
      caption: "One request's path through the API server. Every box is code you own.",
    },
    everyday: {
      title: "The concierge desk",
      text: "Hotel guests do not phone the kitchen, the laundry or the taxi firm directly. They ask the concierge, who checks who they are, what their room entitles them to, places the request with the right service, and keeps a log. The API server is the concierge between users and the model.",
    },
    engineering: {
      title: "A chat server that stalled under a slow provider",
      text: "A company's Python chat server used synchronous workers: each request held a worker until the model finished. When the provider's latency rose from 2 to 25 seconds one afternoon, all 32 workers were occupied within a minute and health checks failed; the whole site, not just chat, went down behind the same load balancer. The rebuild used an async server, a per-request timeout of 30 seconds, an abort on client disconnect, a separate process pool for chat, and a circuit breaker to the provider. The next provider slowdown showed up as a fallback-rate alert and nothing else.",
    },
    maths: {
      formula: "concurrent requests = request rate × average duration (Little's law);   workers needed ≥ concurrent requests (sync) or memory per connection × concurrent (async)",
      meaning: "Long AI requests multiply concurrency. Synchronous servers need a worker per open request; async servers need memory per connection.",
      worked: [
        "5 requests/second × 8 seconds average = 40 concurrent requests. A sync server with 32 workers queues; at 25 seconds average, 125 concurrent: it collapses.",
        "An async server at ~2 MB per open connection handles 125 connections in 250 MB.",
        "Timeout 30 s caps duration, so worst-case concurrency = 5 × 30 = 150, which is still fine async.",
      ],
    },
    code: {
      title: "A streaming chat endpoint with timeout and abort",
      lang: "ts",
      src: `app.post("/api/chat", requireAuth, rateLimit, validateInput, async (req, res) => {
  const trace = new Trace({ feature: "chat", userId: req.session.userId });
  const abort = new AbortController();
  req.on("close", () => abort.abort());                                 // client gone: stop paying for tokens
  const timer = setTimeout(() => abort.abort(), 30_000);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("X-Trace-Id", trace.id);
  try {
    const context = await buildContext(req.session, req.body.conversationId, req.body.message);
    const stream = await chatCall({ ...context, signal: abort.signal });
    for await (const delta of stream.textDeltas()) res.write("data: " + JSON.stringify({ delta }) + "\\n\\n");
    const final = await stream.final();
    const checked = validateAnswer(final.text, req.session);
    res.write("data: " + JSON.stringify({ done: true, ok: checked.ok }) + "\\n\\n");
  } catch (e) {
    res.write("data: " + JSON.stringify({ error: userSafeMessage(e) }) + "\\n\\n");
  } finally {
    clearTimeout(timer);
    await trace.end();
    res.end();
  }
});`,
      lines: [
        { code: "req.on(\"close\", () => abort.abort());                                 // client gone: stop paying for tokens", say: "When the user closes the tab, the upstream model call is cancelled. Otherwise you pay for answers nobody reads." },
        { code: "const timer = setTimeout(() => abort.abort(), 30_000);", say: "A hard ceiling per request. A slow provider cannot hold a connection forever." },
        { code: "for await (const delta of stream.textDeltas()) res.write(\"data: \" + JSON.stringify({ delta }) + \"\\n\\n\");", say: "Server-sent events: each token delta goes to the client as soon as it arrives." },
        { code: "const checked = validateAnswer(final.text, req.session);", say: "Output validation still runs on the completed text; the client is told whether the answer passed." },
        { code: "await trace.end();", say: "The trace is written on every path, including errors and aborts." },
      ],
    },
    useIt: "Build the API server as the governed path for every model call: auth, limits, validation, context assembly, streaming with timeouts and abort on disconnect, tool execution through permissions, output validation and tracing. Use an async runtime, isolate chat from other traffic, and size for long requests with Little's law.",
    takeaways: ["Clients talk to your server; your server talks to models and tools.", "AI requests are long: async handling, timeouts, abort on disconnect, backpressure.", "Every boundary (auth, budgets, permissions, validation, tracing) lives here.", "Isolate interactive chat from other traffic and from background jobs."],
    terms: [["API server", "your service that mediates between clients, models and tools"], ["server-sent events", "a one-way stream from server to browser used for token streaming"], ["backpressure", "slowing or refusing new work when downstream is saturated"]],
    reflect: { q: "Why isolate the chat endpoints from the rest of the site behind a separate process or pool?", a: "Chat requests are long and depend on an external provider; if they share workers with ordinary pages, a provider slowdown takes the whole site down. Separate pools fail independently." },
  },

  "m39-docker": {
    simple: "Docker packages your application and everything it needs into an image that runs the same on a laptop, in CI and in production, which is what makes deployments repeatable.",
    concept:
      "A **container image** is a frozen filesystem: the operating-system libraries, the language runtime, your dependencies at exact versions, your code, and a command to start it. **Docker** builds those images from a Dockerfile and runs them as isolated processes called containers. The image that passed tests in CI is byte-for-byte the image that runs in production; 'it works on my machine' stops being an excuse.\n\nFor AI applications images carry a few extras: native libraries for tokenisers and vector maths, sometimes CUDA drivers for GPU inference, and model weights either baked in (fast start, huge image) or mounted at runtime (small image, slower start). Images are tagged with the commit they were built from and stored in a registry, from which servers, Kubernetes clusters or serverless platforms pull them.",
    why:
      "AI stacks have deep dependency trees: Python packages that need specific native libraries, CUDA versions tied to driver versions, tokeniser binaries. Installing all of that by hand on each server is slow and drifts. Containers exist to make the environment part of the artefact, so every run is identical and every rollback is just running the previous image.",
    how: [
      "Write a Dockerfile: a base image, dependency installation with pinned versions, the application code, the start command.",
      "Use multi-stage builds so build tools do not ship in the runtime image; run as a non-root user.",
      "Build in CI and tag with the commit; push to a registry.",
      "Keep configuration and secrets out of the image: inject through environment variables and a secrets manager at runtime.",
      "For GPU workloads, start from a CUDA base image that matches the host driver; mount model weights from a volume or download at start.",
      "Run with resource limits, health checks and a restart policy.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Base image", detail: "node:20-slim or nvidia/cuda:12.x-runtime" },
        { label: "Dependencies", detail: "exact versions from the lockfile" },
        { label: "Code", detail: "the built application" },
        { label: "Start command", detail: "node dist/server.js" },
        { label: "Runtime injection", detail: "env vars, secrets, mounted weights" },
      ],
      caption: "Everything above the line is frozen in the image; everything below is supplied where it runs.",
    },
    everyday: {
      title: "A shipping container",
      text: "Before standard containers, every cargo was packed differently and every port handled it by hand. The steel container made loading identical everywhere: ship, train, lorry. A Docker image is the same idea for software: the contents vary, the handling does not.",
    },
    engineering: {
      title: "The CUDA mismatch that only happened in production",
      text: "A team's embedding service worked on developer machines and failed in production with a cryptic driver error. Each environment had installed a different CUDA toolkit by hand. They moved to a container built from an official CUDA runtime image pinned to the version matching the production driver, with the model weights mounted from a volume, and ran the same image in CI with a tiny test batch. The error never returned, and a GPU upgrade later was a one-line base-image change tested in CI first.",
    },
    maths: {
      formula: "image size ≈ base + dependencies + code + (weights if baked);   cold start ≈ pull time + load time",
      meaning: "Baked weights make the image large and slow to pull but fast to start; mounted weights keep the image small and shift the time to loading.",
      worked: [
        "Node app: base 180 MB + dependencies 90 MB + code 10 MB = 280 MB. Pull on a 1 Gbit link ≈ 3 s.",
        "Inference service with a 14 GB model baked in: 15 GB image; pull ≈ 2 minutes; every new node waits that long.",
        "Same service with weights on a shared volume: 1.5 GB image; pull 15 s; load from volume ≈ 40 s. Faster to scale, and weights update without a rebuild.",
      ],
    },
    code: {
      title: "A production Dockerfile for the API server",
      lang: "bash",
      src: `# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && addgroup --system app && adduser --system --ingroup app app
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))"
CMD ["node", "dist/server.js"]`,
      lines: [
        { code: "FROM node:20-slim AS build", say: "A build stage with the full toolchain; its output is copied, its tools are not shipped." },
        { code: "RUN npm ci", say: "Exact versions from the lockfile. The same command gives the same tree every time." },
        { code: "RUN npm ci --omit=dev && addgroup --system app && adduser --system --ingroup app app", say: "Runtime dependencies only, and a non-root user to run as." },
        { code: "USER app", say: "The container runs unprivileged; a compromise inside it has less to work with." },
        { code: "HEALTHCHECK --interval=15s --timeout=3s CMD node -e \"fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))\"", say: "The platform asks the container whether it is healthy; an unhealthy one is restarted or taken out of rotation." },
      ],
      note: "No secrets, no prompts, no model ids are baked in; they arrive as environment variables and config at runtime.",
    },
    useIt: "Containerise every service: a multi-stage Dockerfile, pinned dependencies, non-root user, health check, configuration and secrets injected at runtime, images tagged by commit and built once in CI. For GPU inference, pin the CUDA base to the host driver and decide between baked and mounted weights by how often you scale and update.",
    takeaways: ["An image freezes the environment; the tested image is the deployed image.", "Keep config, secrets, prompts and usually weights out of the image.", "Multi-stage builds, non-root users and health checks are the baseline.", "GPU images pin CUDA to the host driver; test them in CI."],
    terms: [["container image", "a frozen filesystem plus a start command"], ["Dockerfile", "the recipe that builds an image"], ["registry", "the store images are pushed to and pulled from"]],
    reflect: { q: "Why not bake the API key into the image to simplify deployment?", a: "Anyone who can pull the image (CI, every server, every engineer with registry access) gets the key, and rotating it means rebuilding. Secrets are injected at runtime from a secrets manager; the image stays shareable." },
  },

  "m39-gpu-vs-cpu-inference": {
    simple: "GPUs run the matrix maths of models in parallel and are essential for large models at speed; CPUs are cheaper, simpler and enough for small models, embeddings at low volume and classical machine learning.",
    concept:
      "Inference is mostly matrix multiplication: millions of multiply-adds per token. A **CPU** has a handful of fast, general-purpose cores; a **GPU** has thousands of simpler cores built to do the same arithmetic on many numbers at once, plus very fast memory. For a 7-billion-parameter language model, a GPU produces tens of tokens per second where a CPU manages one or two.\n\nThe choice is about model size, latency and volume. Small models (a few hundred million parameters), embedding models at modest throughput, classical models (trees, linear) and anything batch-processed overnight can run on CPUs cheaply. Large language models, image models, real-time speech and anything that must answer in under a second at scale need GPUs. Memory decides what fits at all: a model's weights must fit in GPU memory (VRAM), which is why quantisation and GPU size matter.",
    why:
      "GPUs cost several times a CPU machine and are scarce; CPUs are everywhere and cheap. Running a tiny classifier on a rented GPU wastes money; running a 70-billion-parameter model on CPUs wastes everyone's time. The distinction exists so you spend on parallel hardware only where the arithmetic demands it.",
    how: [
      "Estimate the model's memory: parameters × bytes per parameter (2 for 16-bit, 1 for 8-bit, 0.5 for 4-bit) plus working memory.",
      "Estimate the arithmetic per request and the latency you need.",
      "If the model fits in RAM and CPU latency is acceptable at your volume, use CPUs.",
      "Otherwise pick a GPU with enough VRAM for the weights plus the cache for your concurrency.",
      "Measure tokens per second and cost per million tokens on both before committing.",
      "Mix: CPUs for embeddings and classical models, GPUs for the language model.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Workload", "Hardware", "Why"],
        rows: [
          ["fraud scoring with a tree model, 5,000/s", "CPU", "tiny arithmetic per request; GPUs would idle"],
          ["sentence embeddings, 50/s", "CPU (or small GPU at higher volume)", "small model; CPU batches keep up"],
          ["7B chat model, interactive", "GPU with ≥16 GB", "weights 14 GB at 16-bit; tokens must stream fast"],
          ["70B model", "multiple GPUs or heavy quantisation", "140 GB at 16-bit does not fit one card"],
          ["nightly document classification, 2M docs", "GPU batch job or CPU fleet", "throughput, not latency: compare cost per million tokens"],
        ],
      },
      caption: "Memory decides what fits; arithmetic and latency decide what is worth a GPU.",
    },
    everyday: {
      title: "One expert versus a thousand clerks",
      text: "A CPU is a few brilliant clerks who can do any task quickly one after another. A GPU is a hall of a thousand ordinary clerks who all do the same simple sum at the same moment. For a single complex form, the experts win; for adding up a million identical receipts, the hall wins by a mile. Model inference is the million receipts.",
    },
    engineering: {
      title: "Right-sizing an inference fleet",
      text: "A legal-tech company ran everything on GPUs: a 7B summariser, a sentence-embedding model and a small document-type classifier. GPU utilisation averaged 18%. They moved the classifier and the embedder to CPU instances with batching (embedding throughput 120 sentences/s per instance, well above need) and kept the summariser on a single GPU with continuous batching, whose utilisation rose to 65%. Monthly inference cost fell 55% with no change in latency that users could see.",
    },
    maths: {
      formula: "VRAM for weights ≈ parameters × bytes per parameter;   tokens/s ≈ memory bandwidth ÷ bytes read per token",
      meaning: "Weights must fit in memory; generation speed for one sequence is limited by how fast the weights can be read for each token.",
      worked: [
        "7B model at 16-bit: 7 × 10⁹ × 2 bytes = 14 GB. Fits a 16 GB or 24 GB GPU with room for cache; does not fit 12 GB.",
        "Same model at 4-bit: 3.5 GB. Fits a laptop GPU.",
        "GPU with 900 GB/s bandwidth reading 14 GB per token: ≈ 64 tokens/s for one sequence. A CPU at 50 GB/s: ≈ 3.5 tokens/s.",
        "Batching 16 sequences reads the weights once per step for all of them: throughput rises toward 16× while per-sequence speed stays similar.",
      ],
    },
    code: {
      title: "Measuring tokens per second on the hardware you have",
      lang: "py",
      src: `import time

def tokens_per_second(generate, prompt, max_new_tokens=128):
    start = time.perf_counter()
    out = generate(prompt, max_new_tokens=max_new_tokens)
    seconds = time.perf_counter() - start
    return len(out.tokens) / seconds

# Same model, same prompt, two devices
print("cpu", round(tokens_per_second(cpu_model.generate, prompt), 1))
print("gpu", round(tokens_per_second(gpu_model.generate, prompt), 1))

# Cost per million tokens = hourly price / (tokens per second * 3600) * 1e6
for name, tps, price in (("cpu", 3.4, 0.35), ("gpu", 62.0, 1.20)):
    print(name, "£ per million tokens:", round(price / (tps * 3600) * 1e6, 2))`,
      lines: [
        { code: "return len(out.tokens) / seconds", say: "Tokens per second for one sequence: the number users feel as typing speed." },
        { code: "print(\"gpu\", round(tokens_per_second(gpu_model.generate, prompt), 1))", say: "Measure, do not assume. Batching, quantisation and model size change the ratio." },
        { code: "print(name, \"£ per million tokens:\", round(price / (tps * 3600) * 1e6, 2))", say: "The number that decides: hourly price divided by work done per hour. Here CPU ≈ £28.6 and GPU ≈ £5.4 per million tokens for this model." },
      ],
      output: "cpu 3.4\ngpu 62.0\ncpu £ per million tokens: 28.59\ngpu £ per million tokens: 5.38",
    },
    useIt: "Choose hardware per model, not per project: CPUs for classical models, small models and low-volume embeddings; GPUs when the weights need the memory or the latency needs the speed. Compute memory from parameters and bytes, measure tokens per second and cost per million tokens, and watch utilisation so expensive cards are not idle.",
    takeaways: ["GPUs win on parallel arithmetic and memory bandwidth; CPUs win on cost and simplicity for small workloads.", "VRAM = parameters × bytes per parameter decides what fits.", "Per-sequence speed is bandwidth-bound; batching raises throughput.", "Measure cost per million tokens on real hardware."],
    terms: [["GPU", "a processor with thousands of cores for parallel arithmetic"], ["VRAM", "GPU memory; the weights and the cache must fit in it"], ["memory bandwidth", "how fast memory can be read; it bounds tokens per second"]],
    reflect: { q: "A 7B model generates 60 tokens/s for one user on a GPU. What happens to that user's speed when 10 users share the GPU with batching?", a: "Not much: each step reads the weights once for all ten sequences, so per-user speed drops only modestly while total throughput rises nearly tenfold. That is why serving engines batch." },
  },

  "m39-cloud-gpu-infrastructure": {
    simple: "Cloud GPU infrastructure is renting GPU machines by the hour or by the token: choosing instance types, managing scarcity and cost, and deciding between on-demand, reserved and spot capacity.",
    concept:
      "Few teams buy GPUs; most rent them. **Cloud GPU infrastructure** covers the options: on-demand instances (pay by the hour, available when they are available), reserved or committed capacity (cheaper, guaranteed, locked in), spot or preemptible instances (much cheaper, can be taken away at short notice), managed inference services (you upload a model, they serve it, you pay per hour or per token), and serverless GPU platforms that bill per second of use.\n\nThe practical realities: popular GPU types are often scarce in a given region; prices differ several-fold between instance generations; a GPU instance that idles costs the same as one that works; and data has to be near the GPU to avoid slow loading. Infrastructure decisions are therefore about utilisation, redundancy across regions, and matching the capacity type to the workload: steady traffic on reserved, bursts on on-demand, batch jobs on spot.",
    why:
      "GPU time is the dominant cost of self-hosted inference and training. The same workload can cost three times more on a poorly chosen instance type or an idle fleet. Scarcity means a plan that assumes you can always get a particular card will fail at the worst moment. Infrastructure choices exist to keep capacity available and the bill proportional to real work.",
    how: [
      "Characterise the workload: steady or bursty, latency-sensitive or batch, memory needed per model.",
      "Pick the smallest GPU type whose memory fits the model at your quantisation; benchmark two candidates.",
      "Cover the steady base with reserved capacity, bursts with on-demand or autoscaled instances, batch work with spot and checkpointing.",
      "Spread across two zones or regions; keep images and weights in a registry and storage near each.",
      "Set budgets and alerts; measure utilisation; shut down idle instances automatically.",
      "Consider managed inference or serverless GPUs for low or spiky volume, where idle time would dominate.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Capacity type", "Cost", "Availability", "Best for"],
        rows: [
          ["on-demand", "full price", "usually, not always", "bursts, experiments"],
          ["reserved / committed", "30–60% less", "guaranteed", "steady baseline traffic"],
          ["spot / preemptible", "60–90% less", "can vanish in minutes", "batch jobs with checkpoints"],
          ["managed inference", "per hour or per token", "provider's problem", "low ops effort, moderate volume"],
          ["serverless GPU", "per second of use", "cold starts", "spiky, low-volume workloads"],
        ],
      },
      caption: "Match the type to the shape of the work. Mixing types is normal.",
    },
    everyday: {
      title: "Hiring vans",
      text: "A delivery business keeps a few vans on long lease for the daily routes, hires extra vans by the day before Christmas, and takes cheap last-minute vans for one-off jobs where a cancellation would not hurt. Nobody leases a van to leave it parked. GPU capacity planning is van hire with scarier prices.",
    },
    engineering: {
      title: "A transcription service that stopped overpaying",
      text: "A media company transcribed podcasts with a speech model on four on-demand GPUs running around the clock at 22% utilisation. They re-planned: one reserved GPU for the live-captioning path that needs low latency, a spot fleet for the nightly bulk transcription with jobs checkpointed every five minutes so a preempted instance loses little, and an autoscaler that adds on-demand instances only when the queue exceeds an hour of work. Cost fell 64%; the live path's latency improved because it no longer competed with batch jobs.",
    },
    maths: {
      formula: "effective hourly cost = price per hour ÷ utilisation;   spot savings = (on-demand − spot) × hours − cost of preemptions",
      meaning: "An idle GPU doubles the price of every token it does produce. Spot is cheap unless preemptions waste a lot of work.",
      worked: [
        "On-demand GPU £1.20/h at 22% utilisation: effective £5.45 per useful hour.",
        "Reserved at £0.70/h at 70% utilisation: effective £1.00 per useful hour.",
        "Spot at £0.35/h for a 200-hour batch: £70 versus £240 on-demand. With checkpoints every 5 minutes and 10 preemptions, lost work ≈ 10 × 2.5 min ≈ 25 min: negligible.",
        "Without checkpoints, each preemption loses the whole job so far; the saving evaporates.",
      ],
    },
    code: {
      title: "A checkpointed batch job that survives spot preemption",
      lang: "py",
      src: `import json, os, signal

STATE = "/checkpoints/transcribe-state.json"
done = set(json.load(open(STATE))["done"]) if os.path.exists(STATE) else set()
stop = False
signal.signal(signal.SIGTERM, lambda *_: globals().__setitem__("stop", True))   # preemption warning

for episode in sorted(os.listdir("/data/episodes")):
    if episode in done:
        continue
    if stop:
        break
    transcript = model.transcribe("/data/episodes/" + episode)
    save_transcript(episode, transcript)
    done.add(episode)
    if len(done) % 5 == 0:
        json.dump({"done": sorted(done)}, open(STATE, "w"))

json.dump({"done": sorted(done)}, open(STATE, "w"))`,
      lines: [
        { code: "done = set(json.load(open(STATE))[\"done\"]) if os.path.exists(STATE) else set()", say: "On start, read what earlier runs finished. A restarted job skips completed work." },
        { code: "signal.signal(signal.SIGTERM, lambda *_: globals().__setitem__(\"stop\", True))   # preemption warning", say: "Cloud providers send a termination signal shortly before taking a spot instance; the job finishes the current item and saves." },
        { code: "if len(done) % 5 == 0:", say: "A checkpoint every five episodes: the most a preemption can waste." },
        { code: "json.dump({\"done\": sorted(done)}, open(STATE, \"w\"))", say: "State lives on shared storage, not on the instance disk that disappears with it." },
      ],
    },
    useIt: "Plan GPU capacity by workload shape: reserved for the steady base, on-demand for bursts, spot with checkpoints for batch, managed or serverless for low volume. Benchmark instance types, keep weights and images near the GPUs, spread across zones, and watch utilisation and budgets with automatic shutdown of idle capacity.",
    takeaways: ["Idle GPUs are the biggest cost; utilisation is the number to watch.", "Reserved for baseline, on-demand for bursts, spot with checkpoints for batch.", "GPU types are scarce: plan for alternatives and regions.", "Managed and serverless GPUs trade control for zero idle cost."],
    terms: [["spot instance", "spare cloud capacity sold cheaply that can be reclaimed at short notice"], ["reserved capacity", "GPU time bought in advance at a discount"], ["checkpointing", "saving progress so interrupted work can resume"]],
    reflect: { q: "Your interactive assistant runs on spot instances to save money. What goes wrong, and when?", a: "At the worst time: spot capacity is reclaimed when demand is high, which is exactly when your users are active, and a preempted serving instance drops live conversations. Spot suits batch work with checkpoints; interactive serving needs reserved or on-demand capacity." },
  },

  "m39-model-hosting": {
    simple: "Model hosting is where your model's weights and adapters live and how they get to the servers that run them: versioned storage, fast loading, and a registry of what is deployed.",
    concept:
      "A served model is a set of large files: base weights, possibly adapters from fine-tuning, a tokeniser, and a configuration. **Model hosting** is the storage and delivery of those artefacts: an object store or model registry where each version is kept with its metadata (training data version, evaluation results, licence), a way for serving instances to fetch them quickly (local caches, pre-warmed volumes, regional copies), and a record of which version each environment runs.\n\nThe principles mirror code deployment. Models are immutable and versioned, never edited in place. Loading is optimised because a 14 GB download on every scale-up event is slow and expensive. Access is controlled: licensed weights and fine-tuned models trained on private data are confidential. And every serving instance reports which model version it loaded, so a trace can be tied to the exact weights that produced an answer.",
    why:
      "Without hosting discipline, teams end up with weights copied by hand onto servers, nobody sure which version is live, and a fine-tune that cannot be reproduced because the base checkpoint was overwritten. Scale-up events crawl because every new instance downloads from a distant bucket. Hosting exists to make model artefacts as managed as code artefacts: versioned, fast to fetch, access-controlled, and traceable.",
    how: [
      "Store each model version as an immutable artefact in object storage or a model registry, with metadata and evaluation results.",
      "Name versions explicitly (model-name:v12) and reference them from configuration, never 'latest'.",
      "Put copies near the serving fleet: a regional bucket, a shared read-only volume, or a node-local cache warmed at startup.",
      "Download with integrity checks; load lazily or at startup depending on cold-start needs; keep the previous version cached for rollback.",
      "Control access with roles; audit downloads of confidential models.",
      "Report the loaded version from the health endpoint and in every trace.",
    ],
    visual: {
      kind: "flow",
      steps: ["training / fine-tuning run", "registry: model:v12 + metadata + evals", "regional storage / shared volume", "serving instance: fetch, verify, load", "health endpoint reports v12", "traces record v12"],
      caption: "A model version travels like a build artefact and is reported like one.",
    },
    everyday: {
      title: "A library's special collection",
      text: "Rare manuscripts are catalogued with edition and provenance, stored in a vault, and brought out as controlled copies to reading rooms near the readers, with a log of who borrowed what. Nobody scribbles on the originals. Model hosting is the special collection for weights.",
    },
    engineering: {
      title: "The fine-tune nobody could reproduce",
      text: "A retailer fine-tuned a model for product descriptions and shipped it. Months later quality drifted and they wanted to retrain, but the base checkpoint had been overwritten by a newer download, the adapter was on a decommissioned server, and nobody knew which data version had been used. They rebuilt the process: a registry entry per model with base checksum, adapter, data snapshot id and evaluation report; weights in a regional bucket with a read-only volume mounted into serving pods; the health endpoint returning the version; and a rule that nothing references 'latest'.",
    },
    maths: {
      formula: "scale-up time ≈ download size ÷ bandwidth + load time;   monthly egress cost = instances started × size × price per GB",
      meaning: "Where the weights sit decides how fast new capacity arrives and what each start costs.",
      worked: [
        "14 GB from a distant bucket at 200 MB/s: 70 s download + 40 s load = 110 s per new instance; egress at £0.08/GB = £1.12 per start.",
        "From a same-region bucket at 1 GB/s: 14 s + 40 s = 54 s; egress free within region.",
        "From a shared read-only volume: ~0 download + 40 s load; 300 scale-ups a month save 300 × £1.12 = £336 and 5.5 hours of waiting.",
      ],
    },
    code: {
      title: "Fetching and verifying a pinned model version at startup",
      lang: "py",
      src: `import hashlib, os, shutil

MODEL_REF = os.environ["MODEL_REF"]            # e.g. "support-summariser:v12", never "latest"
CACHE = "/models"

def ensure_model(ref):
    name, version = ref.split(":")
    local = f"{CACHE}/{name}/{version}"
    if os.path.exists(local + "/.verified"):
        return local
    meta = registry.get(name, version)        # {"files": [...], "sha256": {...}, "base": ..., "evals": ...}
    for f in meta["files"]:
        storage.download(f"{name}/{version}/{f}", f"{local}/{f}")
        digest = hashlib.sha256(open(f"{local}/{f}", "rb").read()).hexdigest()
        if digest != meta["sha256"][f]:
            shutil.rmtree(local)
            raise RuntimeError("checksum mismatch for " + f)
    open(local + "/.verified", "w").close()
    return local

path = ensure_model(MODEL_REF)
model = load(path)
health.set(model_version=MODEL_REF)`,
      lines: [
        { code: "MODEL_REF = os.environ[\"MODEL_REF\"]            # e.g. \"support-summariser:v12\", never \"latest\"", say: "The version is configuration, explicit, and the same string appears in traces and the release record." },
        { code: "if os.path.exists(local + \"/.verified\"):", say: "A warm node skips the download; the marker is written only after verification." },
        { code: "if digest != meta[\"sha256\"][f]:", say: "Integrity check: a partial or tampered download never loads." },
        { code: "health.set(model_version=MODEL_REF)", say: "The health endpoint reports exactly which weights are serving." },
      ],
    },
    useIt: "Treat model weights and adapters as versioned artefacts in a registry with metadata and evaluations; reference explicit versions from configuration; place copies near the serving fleet and cache on nodes; verify checksums on load; control and audit access; report the loaded version in health checks and traces.",
    takeaways: ["Models are immutable, versioned artefacts with metadata, like builds.", "Never reference 'latest'; configuration names the version.", "Put weights near the GPUs; cache on nodes; verify on load.", "Health and traces report the exact version serving."],
    terms: [["model registry", "a catalogue of model versions with metadata and evaluation results"], ["artefact", "an immutable file produced by a build or training run"], ["checksum", "a hash used to verify a file was downloaded intact"]],
    reflect: { q: "A colleague suggests the serving pods pull 'model:latest' so updates roll out automatically. What breaks?", a: "Reproducibility and rollback: two pods may run different weights, a trace cannot say which, and a bad model reaches users with no deploy to revert. Updates go through the pipeline as a version change, like code." },
  },

  "m39-load-balancing": {
    simple: "Load balancing spreads requests across several servers so no single one is overwhelmed, routes around unhealthy ones, and for AI needs care with long streaming requests and GPU queue depth.",
    concept:
      "One server has limits: connections, memory, GPU capacity. A **load balancer** sits in front of several and distributes requests among them, checks their health, and stops sending to any that fail. Standard strategies are round-robin (take turns), least connections (send to the quietest), and weighted (send more to bigger machines).\n\nAI traffic has two quirks. Requests are long and uneven: one chat turn may stream for 30 seconds while another finishes in two, so 'least connections' beats round-robin, and the balancer must support long-lived streaming connections with sensible idle timeouts. And for self-hosted models, the right measure of busyness is not connections but queue depth and tokens in flight on each GPU; smart routing uses that, and sometimes routes requests with the same cached prefix to the same instance so the attention cache is reused.\n\nLoad balancing also gives you rolling deployments and canaries: shift a share of traffic to new instances, watch, shift more.",
    why:
      "A single server is a single point of failure and a hard ceiling on capacity. Balancers exist to add servers horizontally, to survive one dying, and to deploy without downtime. For AI, they also prevent one slow instance or one long request from degrading everyone's latency.",
    how: [
      "Run at least two instances of each service in different zones.",
      "Put a load balancer in front with health checks that reflect readiness (model loaded, dependencies reachable).",
      "Use least-connections or queue-aware routing for long, uneven requests; set idle and request timeouts above the longest expected stream.",
      "Drain connections on shutdown so in-flight streams finish before an instance is removed.",
      "For GPU serving, route by queue depth and tokens in flight; consider prefix-aware routing for cache hits.",
      "Use weighted routing for canaries and rolling updates.",
    ],
    visual: {
      kind: "flow",
      steps: ["clients", "load balancer: health checks, least connections, timeouts ≥ 60 s", "instance A (busy: 12 streams)", "instance B (quiet: 3 streams) ← next request", "instance C (unhealthy: skipped)"],
      caption: "The balancer sends new work to the quietest healthy instance and never to a failing one.",
    },
    everyday: {
      title: "The supermarket queue manager",
      text: "A good queue manager sends each shopper to the shortest line, closes a till whose cashier has stepped away, and does not count a trolley of two hundred items the same as a basket of three. Round-robin would send you to the long queue because it is your turn. Load balancing for AI is the queue manager who looks at trolley sizes.",
    },
    engineering: {
      title: "Streams cut off at sixty seconds",
      text: "A company's assistant started failing on long answers after a load-balancer migration: streams stopped at exactly 60 seconds. The new balancer's default idle timeout was a minute, and a slow provider sometimes took longer. They raised the stream timeout to 120 seconds, switched from round-robin to least-connections because some instances held many long streams while others idled, added connection draining of 90 seconds on deploy, and changed the health check from 'process up' to 'model loaded and provider reachable'. Cut-offs stopped and p95 latency fell 30% from the better spread.",
    },
    maths: {
      formula: "capacity = instances × concurrent requests per instance;   with least-connections, max imbalance ≈ 1 request; with round-robin, imbalance ≈ variance in request duration",
      meaning: "Even distribution of long, uneven requests needs the balancer to know current load, not just whose turn it is.",
      worked: [
        "3 instances, each handles 40 concurrent streams: capacity 120. At 5 req/s × 8 s average = 40 concurrent: 33% utilised, room for a slow afternoon.",
        "Round-robin with durations between 2 s and 30 s: one instance can hold 25 streams while another holds 8.",
        "Least-connections keeps them within one or two of each other, so p95 latency tracks the average instance rather than the worst.",
        "Losing one instance: capacity 80, still above the 40 needed; losing two: 40, at the edge. Three is the minimum for comfort.",
      ],
    },
    code: {
      title: "Readiness, draining and balancer settings",
      lang: "ts",
      src: `// Readiness means "can serve", not "process started"
app.get("/health", async (_req, res) => {
  const ok = modelClient.ready() && (await vectorStore.ping()) && !shuttingDown;
  res.status(ok ? 200 : 503).json({ ok, version: RELEASE, inFlight: inFlight.count });
});

// Drain on shutdown: stop taking new requests, let streams finish, then exit
let shuttingDown = false;
process.on("SIGTERM", async () => {
  shuttingDown = true;                                   // health now returns 503; the balancer stops routing here
  const deadline = Date.now() + 90_000;
  while (inFlight.count > 0 && Date.now() < deadline) await sleep(500);
  process.exit(0);
});

// Balancer (e.g. nginx) settings that matter for streaming:
// least_conn;  proxy_read_timeout 120s;  proxy_buffering off;  health check every 5s, 2 failures to eject`,
      lines: [
        { code: "const ok = modelClient.ready() && (await vectorStore.ping()) && !shuttingDown;", say: "Ready only when the model and dependencies are usable; a half-started instance gets no traffic." },
        { code: "shuttingDown = true;                                   // health now returns 503; the balancer stops routing here", say: "Draining begins by failing the health check, so the balancer stops sending new requests." },
        { code: "while (inFlight.count > 0 && Date.now() < deadline) await sleep(500);", say: "In-flight streams finish before the process exits; users do not see cut-off answers on deploy." },
        { code: "// least_conn;  proxy_read_timeout 120s;  proxy_buffering off;  health check every 5s, 2 failures to eject", say: "Least-connections for uneven requests, a timeout longer than the longest stream, and no buffering so tokens flow immediately." },
      ],
    },
    useIt: "Run every AI service on at least two instances behind a balancer with readiness-based health checks, least-connections or queue-aware routing, timeouts longer than the longest stream, buffering off, and graceful draining on deploy. Use weighted routing for canaries. For GPU fleets, route on queue depth and consider prefix affinity.",
    takeaways: ["Balancers add capacity, survive failures and enable zero-downtime deploys.", "Long, uneven AI requests need least-connections and generous stream timeouts.", "Health checks must mean 'ready to serve'; drain before shutdown.", "GPU routing by queue depth and cache affinity beats connection counts."],
    terms: [["load balancer", "a component that distributes requests across instances and skips unhealthy ones"], ["least connections", "routing each new request to the instance with the fewest active requests"], ["connection draining", "letting in-flight requests finish before removing an instance"]],
    reflect: { q: "Why is 'process is running' a bad health check for an inference server?", a: "The process can be up while the model is still loading, the GPU is out of memory, or the provider is unreachable; the balancer would send traffic that fails. Readiness should test what a real request needs." },
  },

  "m39-autoscaling": {
    simple: "Autoscaling adds and removes instances automatically as load changes, using the right signal for AI work, such as queue depth or tokens in flight, with limits and warm capacity because models are slow to start.",
    concept:
      "Traffic to an AI product rises and falls through the day and spikes unpredictably. **Autoscaling** watches a signal and adjusts the number of instances to keep latency within target without paying for idle machines. For CPU web servers the signal is usually CPU utilisation. For AI services it should be what actually limits them: requests or tokens in flight per instance, queue wait time, or time to first token.\n\nAI services scale slowly: an instance must pull an image, load gigabytes of weights into GPU memory and warm up, which can take minutes. So autoscaling needs a minimum of warm instances, scale-up triggers that act before saturation (on queue growth, not on failures), scale-down that is slow and patient, and limits so a bug or an attack cannot spin up a hundred GPUs. For provider-backed services, 'scaling' also means managing the provider's rate limits and spending.",
    why:
      "Fixed capacity is either too much (paying for idle GPUs at 3 am) or too little (latency collapses at lunch). Autoscaling exists to track demand. For AI it has to be designed around slow starts and expensive instances, or it will scale too late and cost too much.",
    how: [
      "Choose the signal: in-flight requests per instance, queue wait, or p95 time to first token; export it as a metric.",
      "Set a target (for example 25 in-flight per instance) and compute desired instances = total in flight ÷ target.",
      "Set a minimum (warm instances for the base load and a sudden spike) and a maximum (a cost ceiling).",
      "Scale up fast on the leading signal; scale down slowly with a cooldown so brief dips do not thrash.",
      "Pre-warm: images cached on nodes, weights on local volumes, so a new instance is ready in under a minute.",
      "Test it: replay a traffic spike in staging and watch latency during scale-up.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Measure", detail: "in-flight requests across the fleet = 170" },
        { label: "Compute", detail: "target 25 per instance → desired = ⌈170 ÷ 25⌉ = 7" },
        { label: "Clamp", detail: "min 3, max 12 → 7" },
        { label: "Act", detail: "running 5 → start 2 more (ready in ~60 s with warm caches)" },
        { label: "Cool down", detail: "no scale-down decisions for 10 minutes after a change" },
      ],
      caption: "The loop runs every 30 seconds. The leading signal and the warm start are what make it work for models.",
    },
    everyday: {
      title: "Opening more tills",
      text: "A supermarket opens tills as queues grow, not after customers have left. It keeps a few open even when quiet, because calling a cashier from the stockroom takes minutes, and it does not close a till the moment a queue clears. Autoscaling for AI is till management where each cashier takes two minutes to arrive.",
    },
    engineering: {
      title: "The autoscaler that scaled on the wrong signal",
      text: "A company scaled its self-hosted model on GPU utilisation. At lunch, utilisation stayed at 95% (the GPU was always busy) while queue wait time climbed to 40 seconds, so nothing scaled; by the time error rates triggered a manual change, the spike had passed. They switched the signal to queue wait time with a target of 2 seconds and a leading trigger on in-flight requests, set a minimum of three warm instances during business hours, cached images and weights on every node to cut start time from 6 minutes to 50 seconds, and capped the fleet at ten. The next lunch spike added two instances before anyone noticed.",
    },
    maths: {
      formula: "desired = ⌈in-flight ÷ target per instance⌉, clamped to [min, max];   needed lead time = instance start time ÷ rate of load growth",
      meaning: "Scale on a signal that leads saturation by at least the time an instance takes to start.",
      worked: [
        "Load grows from 50 to 200 in-flight over 10 minutes: +15 per minute. Instance start 60 s: trigger when forecast in-flight in 60 s exceeds capacity.",
        "Capacity 5 × 25 = 125. At in-flight 110 and growth 15/min, in one minute it is 125: start scaling now, not at 125.",
        "Peak 200 ÷ 25 = 8 instances; max 12 allows a bigger day. At night in-flight 20 → desired 1, clamped to min 3 (warm).",
        "Cost: 8 instances × 2 peak hours + 3 × 22 hours = 82 instance-hours versus 8 × 24 = 192 fixed: 57% saved.",
      ],
    },
    code: {
      title: "A scaling decision from a queue signal",
      lang: "py",
      src: `TARGET_IN_FLIGHT = 25
MIN_INSTANCES, MAX_INSTANCES = 3, 12
COOLDOWN_SECONDS = 600

def desired_instances(in_flight_total, growth_per_minute, start_seconds=60):
    forecast = in_flight_total + growth_per_minute * (start_seconds / 60)   # where load will be when a new instance is ready
    desired = -(-forecast // TARGET_IN_FLIGHT)                                # ceiling division
    return int(max(MIN_INSTANCES, min(MAX_INSTANCES, desired)))

def decide(running, in_flight_total, growth_per_minute, last_change_at, now):
    want = desired_instances(in_flight_total, growth_per_minute)
    if want > running:
        return want                                   # scale up immediately
    if want < running and now - last_change_at > COOLDOWN_SECONDS:
        return running - 1                            # scale down one at a time, patiently
    return running

print(desired_instances(110, 15))   # 5 running, forecast 125 -> 5; at 126 -> 6`,
      lines: [
        { code: "forecast = in_flight_total + growth_per_minute * (start_seconds / 60)   # where load will be when a new instance is ready", say: "Scale for the load an instance will meet when it is ready, not the load now." },
        { code: "return int(max(MIN_INSTANCES, min(MAX_INSTANCES, desired)))", say: "A floor for warm capacity and a ceiling for cost. A runaway signal cannot buy a hundred GPUs." },
        { code: "return want                                   # scale up immediately", say: "Up is fast: waiting costs latency." },
        { code: "return running - 1                            # scale down one at a time, patiently", say: "Down is slow and stepwise: a dip during scale-down would otherwise cause thrashing." },
      ],
    },
    useIt: "Autoscale AI services on queue or in-flight signals with a leading forecast, warm minimums, cost maximums, fast up and slow down, and pre-warmed images and weights. For provider-backed services, scale your own tier the same way and manage provider rate limits as a capacity ceiling. Rehearse spikes in staging.",
    takeaways: ["Scale on what limits the service: queue wait, in-flight requests, time to first token, not CPU or GPU utilisation alone.", "Model instances start slowly: forecast, warm minimums, pre-warmed nodes.", "Fast up, slow down, hard maximum.", "Rehearse a spike before the real one."],
    terms: [["autoscaling", "automatically changing the number of instances with load"], ["cooldown", "a waiting period after a scaling change before another is allowed"], ["warm capacity", "instances kept ready to absorb a spike while new ones start"]],
    reflect: { q: "Why is GPU utilisation a poor scaling signal for an inference service?", a: "A saturated GPU reads 95–100% whether the queue is empty or forty seconds deep; it cannot distinguish 'busy and fine' from 'busy and drowning'. Queue wait time or tokens in flight does." },
  },

  "m39-queues-and-background-processing": {
    simple: "Queues take work that nobody is waiting on out of the request path: a producer enqueues a job, workers process it at a controlled rate, and failures are retried without affecting interactive users.",
    concept:
      "Not everything should happen while a user waits. Indexing a document, tagging a night's emails, generating summaries, re-running evaluations, or an agent's long task can take seconds to hours. A **queue** decouples them: the request enqueues a job and returns immediately; **workers** pull jobs and run them at a rate the system can sustain; results are stored and the user is notified or polls.\n\nQueues give control: concurrency limits so background work cannot starve interactive calls of provider rate limits; retries with backoff for transient failures; dead-letter queues for jobs that keep failing; priorities; and visibility into backlog, which is itself a scaling signal. For AI, the queue is also where you batch (group small jobs into one provider batch request) and schedule (run heavy work at night or on spot capacity).",
    why:
      "Doing long work inside a request ties up servers, hits timeouts, and makes a provider slowdown into a user-facing failure. Doing it with no control floods rate limits and the bill. Queues exist to make background work reliable, rate-controlled and observable, and to keep interactive latency unaffected by it.",
    how: [
      "Identify work nobody waits on synchronously: indexing, classification batches, reports, long agent runs.",
      "Define a job type with a payload, an idempotency key and a maximum attempts count.",
      "The request handler validates, enqueues and returns a job id (202 Accepted).",
      "Workers pull with a concurrency limit per job type and per provider; apply rate budgets.",
      "On failure, retry with backoff; after the limit, move to a dead-letter queue and alert.",
      "Store results; notify by webhook, email or UI polling; expose backlog and age as metrics.",
    ],
    visual: {
      kind: "flow",
      steps: ["request: validate + enqueue → 202 job id", "queue (priority, backlog metric)", "workers (concurrency 4, rate budget)", "model / tools", "result store + notification", "dead-letter queue + alert on repeated failure"],
      caption: "The user's request finishes in milliseconds; the work happens behind the queue at a sustainable rate.",
    },
    everyday: {
      title: "A dry cleaner's ticket",
      text: "You hand over a coat, get a ticket, and leave. The cleaning happens later at the pace the machines allow, in batches, and you are called when it is ready. If a stain will not come out they do not keep retrying forever; they set it aside and ring you. Queues are the ticket system.",
    },
    engineering: {
      title: "Document indexing that took the chat down",
      text: "A knowledge-base product indexed uploaded documents synchronously: chunking, embedding calls and database writes inside the upload request. A customer uploaded 3,000 PDFs; the embedding calls consumed the provider's rate limit, chat requests started getting 429s, and upload requests timed out halfway, leaving half-indexed documents. They moved indexing to a queue: the upload stores the file and enqueues a job per document with an idempotency key; four workers process them with a shared token budget that leaves headroom for chat; embeddings are batched 64 at a time; failed documents retry three times then land in a dead-letter queue shown in the admin UI. Uploads return instantly, chat was unaffected by the next bulk upload, and no document was ever half-indexed again.",
    },
    maths: {
      formula: "backlog drain time = backlog ÷ (workers × jobs per worker per minute);   provider share = workers × tokens per job per minute",
      meaning: "Workers and concurrency set how fast the queue empties and how much of the provider's limit background work consumes.",
      worked: [
        "3,000 documents, each 2 embedding batches taking 3 s: one worker does 10 documents/minute. Four workers: 40/minute → 75 minutes to drain.",
        "Provider limit 1,000,000 tokens/minute; each document ≈ 6,000 tokens; four workers at 40 documents/minute = 240,000 tokens/minute, leaving 76% for chat.",
        "Twelve workers would drain in 25 minutes but use 720,000 tokens/minute, starving chat. Four is the right number, or twelve at night.",
      ],
    },
    code: {
      title: "Enqueue, work, retry, dead-letter",
      lang: "ts",
      src: `// Producer: the upload handler
app.post("/api/documents", requireAuth, async (req, res) => {
  const doc = await storeFile(req.session.userId, req.file);
  await queue.add("index-document", { docId: doc.id, ownerId: req.session.userId }, { jobId: "index:" + doc.id, attempts: 3, backoff: { type: "exponential", delay: 10_000 } });
  res.status(202).json({ jobId: "index:" + doc.id });
});

// Worker: concurrency and a shared provider budget
queue.process("index-document", 4, async (job) => {
  await providerBudget.acquire("embeddings", estimateTokens(job.data.docId));
  const chunks = await chunkDocument(job.data.docId);
  for (const batch of chunk(chunks, 64)) await embedAndStore(batch, job.data.ownerId);
  await markIndexed(job.data.docId);
});

queue.on("failed", async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    await deadLetter.add(job.data, { error: String(err) });
    alerts.send("indexing dead-letter", { docId: job.data.docId });
  }
});`,
      lines: [
        { code: "await queue.add(\"index-document\", { docId: doc.id, ownerId: req.session.userId }, { jobId: \"index:\" + doc.id, attempts: 3, backoff: { type: \"exponential\", delay: 10_000 } });", say: "A job with an idempotency key (one per document), three attempts and exponential backoff. The request returns immediately." },
        { code: "res.status(202).json({ jobId: \"index:\" + doc.id });", say: "202 Accepted: the work is queued, not done. The client polls or gets a notification." },
        { code: "queue.process(\"index-document\", 4, async (job) => {", say: "Four concurrent workers: enough to drain in an hour, few enough to leave the provider limit for chat." },
        { code: "await providerBudget.acquire(\"embeddings\", estimateTokens(job.data.docId));", say: "A shared token budget across workers: background work cannot consume what interactive traffic needs." },
        { code: "await deadLetter.add(job.data, { error: String(err) });", say: "After the last attempt the job goes to a dead-letter queue, visible and alertable, instead of retrying forever." },
      ],
    },
    useIt: "Move every non-interactive AI task to a queue: indexing, batch classification, summaries, evaluations, long agent runs. Give jobs idempotency keys, bounded retries and a dead-letter path; cap worker concurrency and share a provider budget with interactive traffic; batch where the provider allows; schedule heavy work off-peak; watch backlog age.",
    takeaways: ["Work nobody waits on leaves the request path: enqueue, return 202, process later.", "Workers run at a controlled rate with a provider budget shared with interactive traffic.", "Retry with backoff, then dead-letter and alert; idempotency keys make retries safe.", "Backlog age is a metric and a scaling signal."],
    terms: [["queue", "a buffer of jobs processed by workers independently of the request"], ["worker", "a process that pulls jobs from a queue and runs them"], ["dead-letter queue", "where jobs go after exhausting their retries"]],
    reflect: { q: "A job retries five times a minute apart and fails every time with 'invalid document format'. What is wrong with the retry policy?", a: "It retries a permanent error. Retries are for transient failures (timeouts, rate limits); a format error will never succeed. Classify errors: retry transient ones with backoff, dead-letter permanent ones immediately." },
  },

  "m39-caching": {
    simple: "Caching stores results that will be asked for again, from provider-side prompt caching to your own response and embedding caches, cutting cost and latency when the same work repeats.",
    concept:
      "AI workloads repeat themselves: the same system prompt on every call, the same question from many users, the same document embedded twice, the same tool result fetched again. **Caching** keeps a result and returns it instead of recomputing. There are several layers. Provider prompt caching reuses an identical prompt prefix at a fraction of the price. A response cache returns a stored answer for an identical (or near-identical) request. An embedding cache stores vectors by text hash so re-indexing and repeated queries cost nothing. A tool-result cache keeps lookups that do not change for minutes. And the serving engine's attention cache makes each generated token cheap.\n\nEvery cache needs a key (what makes two requests 'the same'), a lifetime (how long the result stays valid), scoping (never serve one user's answer to another), and a hit-rate metric. The failure modes are serving stale or wrong data and leaking across users, so keys include everything that affects the result, including the user when the result is personal.",
    why:
      "Model calls are the most expensive and slowest step in the system; avoiding one is the biggest single saving available. Repetition is common enough that caching routinely cuts cost by a third or more and makes repeated questions instant. Caches exist because the cheapest and fastest model call is the one you do not make.",
    how: [
      "Order prompts so the unchanging part comes first and mark it cacheable with the provider.",
      "For responses: build a key from the normalised question, the prompt version, the model, the retrieved sources' versions and, if personal, the user; set a lifetime matching how fast the answer can change.",
      "For embeddings: key by hash of the text and the embedding model; keep indefinitely until the model changes.",
      "For tool results: key by arguments and user scope; short lifetimes for live data.",
      "Measure hit rates and cost saved; invalidate on prompt, model, document or policy changes.",
      "Never cache across users unless the key proves the result is not personal.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Cache", "Key", "Lifetime", "Typical saving"],
        rows: [
          ["provider prompt cache", "identical prefix (tools + system + static docs)", "minutes, refreshed on use", "~90% of prefix input cost"],
          ["response cache", "normalised question + prompt version + model + sources version (+ user if personal)", "minutes to a day", "100% of a call on a hit"],
          ["embedding cache", "sha256(text) + embedding model", "until the model changes", "all re-embedding cost"],
          ["tool-result cache", "tool + arguments + user scope", "seconds to minutes", "latency on repeated lookups"],
          ["attention (KV) cache", "the sequence so far", "the request", "makes generation linear instead of quadratic"],
        ],
      },
      caption: "Different layers, same questions: what is the key, how long is it valid, who may read it.",
    },
    everyday: {
      title: "The FAQ pinned on the noticeboard",
      text: "A receptionist who answers 'where is the car park?' fifty times a day pins the answer on the board. Nobody re-derives it. But they take the note down the day the car park moves, and they do not pin up 'your appointment is at 3' because that is one person's answer. Caching is the noticeboard with a date and a sense of what is private.",
    },
    engineering: {
      title: "Cutting a support assistant's bill by a third",
      text: "An assistant answered 40,000 questions a day. Analysis of traces showed 28% were near-duplicates of the top 200 questions ('how do I reset my password?'), the 2,100-token system prompt was re-sent every call, and documents were re-embedded nightly even when unchanged. They added provider prompt caching for the prefix (hit rate 94%), a response cache keyed on a normalised question plus prompt and source versions with a one-hour lifetime for non-personal questions (hit rate 26%), and an embedding cache by text hash (nightly re-embedding fell from 2 million tokens to 60,000). Cost per day fell 37%; the cached questions answered in 80 ms.",
    },
    maths: {
      formula: "cost saved = hit rate × cost per call × calls;   effective cost per call = (1 − hit rate) × full cost + hit rate × cache cost",
      meaning: "A cache's value is its hit rate times what a miss would have cost; the cache's own cost is usually negligible.",
      worked: [
        "40,000 calls/day at £0.004 each = £160/day. Response cache hit rate 0.26: saves 0.26 × 40,000 × £0.004 = £41.60/day.",
        "Prompt caching: prefix 2,100 of 3,000 input tokens at 10% price with a 0.94 hit rate: input cost falls by 0.94 × 0.7 × 0.9 ≈ 59% on the remaining calls.",
        "Embedding cache: 2,000,000 tokens/night → 60,000: 97% of embedding cost gone.",
        "Combined: roughly £160 → £100 per day, in line with the 37% observed.",
      ],
    },
    code: {
      title: "A scoped response cache with versioned keys",
      lang: "ts",
      src: `import { createHash } from "node:crypto";

function responseKey(question: string, ctx: { promptVersion: string; model: string; sourcesVersion: string; userId?: string }) {
  const normalised = question.trim().toLowerCase().replace(/\\s+/g, " ");
  const scope = ctx.userId ?? "public";                                    // personal answers are keyed per user
  return "resp:" + createHash("sha256").update([normalised, ctx.promptVersion, ctx.model, ctx.sourcesVersion, scope].join("|")).digest("hex");
}

export async function answerCached(question: string, ctx: Ctx) {
  const personal = await looksPersonal(question);                          // "my order" → never shared
  const key = responseKey(question, { ...ctx, userId: personal ? ctx.userId : undefined });
  const hit = await cache.get(key);
  if (hit) {
    metrics.increment("response_cache.hit");
    return hit;
  }
  const answer = await answerFromModel(question, ctx);
  if (answer.ok) await cache.set(key, answer, { ttlSeconds: personal ? 300 : 3600 });
  metrics.increment("response_cache.miss");
  return answer;
}`,
      lines: [
        { code: "const normalised = question.trim().toLowerCase().replace(/\\s+/g, \" \");", say: "Light normalisation so 'Reset my password?' and 'reset my password' share a key; nothing cleverer, to avoid wrong hits." },
        { code: "return \"resp:\" + createHash(\"sha256\").update([normalised, ctx.promptVersion, ctx.model, ctx.sourcesVersion, scope].join(\"|\")).digest(\"hex\");", say: "The key includes everything that changes the answer: prompt version, model, source version, and the user when personal. A prompt edit invalidates automatically." },
        { code: "const personal = await looksPersonal(question);                          // \"my order\" → never shared", say: "A cheap check decides whether the answer could be personal; personal answers are keyed per user and expire fast." },
        { code: "if (answer.ok) await cache.set(key, answer, { ttlSeconds: personal ? 300 : 3600 });", say: "Only validated answers are cached, with a lifetime matched to how quickly the answer can change." },
      ],
    },
    useIt: "Use all the layers: provider prompt caching with the static prefix first, a response cache keyed on normalised question plus prompt, model and source versions and scoped by user when personal, an embedding cache by text hash, and short-lived tool-result caches. Track hit rates and savings; invalidate on every change that affects answers.",
    takeaways: ["The cheapest model call is the one not made; repetition is common.", "Keys must include everything that changes the result, including the user when personal.", "Lifetimes match how fast the answer can change; versions in keys invalidate automatically.", "Measure hit rate and cost saved per layer."],
    terms: [["cache key", "the identifier that decides whether two requests share a stored result"], ["time to live (TTL)", "how long a cached result stays valid"], ["hit rate", "the share of requests served from the cache"]],
    reflect: { q: "Why must the prompt version be part of a response cache key?", a: "After a prompt edit, cached answers were produced by the old prompt; serving them would hide the edit's effect and mix behaviours. Including the version makes every edit a clean invalidation." },
  },

  "m39-logging": {
    simple: "Logging records what the system did, as structured events with ids and context, redacted and retained deliberately, so problems can be investigated and behaviour audited.",
    concept:
      "**Logging** is the written record of events: a request arrived, a tool ran, a validation failed, a job retried, an instance started. Good logs are structured (JSON fields, not free text), correlated (every line carries the trace or request id), levelled (debug, info, warning, error), and contextual (user id hashed, feature, version). For AI systems, logs sit beside traces: traces hold the full chain of a request including prompts; logs hold the operational events around it, at much higher volume and lower detail.\n\nLogs are also personal data when they contain user text, so the same rules apply: redact before writing, restrict access, set retention, never log secrets. And they are a cost: a verbose logger on a busy service can produce terabytes; sampling and levels keep it sane.",
    why:
      "When something goes wrong, the questions are 'what happened, in what order, for whom, on which version?'. Metrics say that errors rose; logs say which requests, which tool, which exception. Without correlation ids, the lines from one request are scattered among thousands and cannot be reassembled. Logging exists to make incidents investigable and to leave an audit trail of actions the system took on users' behalf.",
    how: [
      "Use a structured logger that emits JSON with timestamp, level, service, version, trace id and message.",
      "Attach request context automatically (trace id, hashed user id, feature) to every line in a request.",
      "Log state changes and decisions: tool executed, validation failed, fallback used, job retried, instance ready; not every token.",
      "Redact user text and never log secrets; pass through the same redaction as traces.",
      "Ship logs to a central store with search; set retention per level (errors longer, debug shorter).",
      "Alert on error-level patterns; sample info-level logs on high-volume paths.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Logs", points: ["operational events, high volume", "structured lines with ids", "what happened and when", "days to weeks of retention"] },
      right: { title: "Traces", points: ["one request's full chain", "prompts, sources, tool calls, cost", "why an answer came out as it did", "sampled at scale; bodies redacted"] },
      caption: "Both carry the same trace id. Logs find the request; the trace explains it.",
    },
    everyday: {
      title: "A ship's log",
      text: "A ship's log records, with time and position, every notable event: course changes, weather, who was on watch, what broke. It does not record every wave. After an incident the log is what the inquiry reads. Application logs are the ship's log, and the trace id is the voyage number that ties the entries together.",
    },
    engineering: {
      title: "The retry storm found in the logs",
      text: "An assistant's provider cost doubled overnight with no traffic increase. Metrics showed more model calls per request; logs showed why: a validation failure was triggering a retry, the retry was failing the same validation, and a loop retried three times per request, each logged as 'validation failed, retrying' with the same trace id. Grouping error logs by message and trace id found it in ten minutes. The fix classified the validation error as non-retryable. Without structured, correlated logs, the pattern would have been invisible among millions of lines.",
    },
    maths: {
      formula: "log volume per day = requests × lines per request × bytes per line;   storage cost = volume × retention days × price per GB",
      meaning: "Logging is a cost that scales with traffic and verbosity; levels, sampling and retention keep it proportionate.",
      worked: [
        "2 million requests/day × 12 lines × 400 bytes = 9.6 GB/day.",
        "30-day retention at £0.10/GB-month ≈ £29/month for storage; search indexing often costs several times that.",
        "Sampling info-level lines at 10% on the chat path cuts volume to about 2 GB/day while keeping every warning and error.",
      ],
    },
    code: {
      title: "A structured, correlated, redacted logger",
      lang: "ts",
      src: `import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ traceId: string; userHash: string; feature: string }>();
const base = pino({ level: process.env.LOG_LEVEL ?? "info", base: { service: "assistant-api", version: process.env.RELEASE } });

export const log = new Proxy(base, {
  get: (target, level: string) => (obj: Record<string, unknown>, msg?: string) => {
    const ctx = requestContext.getStore() ?? {};
    (target as any)[level]({ ...ctx, ...redactFields(obj) }, msg);
  },
});

app.use((req, _res, next) => requestContext.run({ traceId: req.traceId, userHash: hash(req.session?.userId), feature: req.path }, next));

// Usage inside any handler or tool:
log.info({ tool: "lookup_order", ms: 42 }, "tool executed");
log.warn({ reason: "forbidden pattern", attempt: 2 }, "output validation failed");
log.error({ err: serialiseError(e), provider: "anthropic" }, "model call failed");`,
      lines: [
        { code: "const base = pino({ level: process.env.LOG_LEVEL ?? \"info\", base: { service: \"assistant-api\", version: process.env.RELEASE } });", say: "JSON lines with service and release version on every line, so logs can be filtered by deploy." },
        { code: "(target as any)[level]({ ...ctx, ...redactFields(obj) }, msg);", say: "Every line gets the request context automatically and passes through redaction: no user text or secrets leak into logs." },
        { code: "app.use((req, _res, next) => requestContext.run({ traceId: req.traceId, userHash: hash(req.session?.userId), feature: req.path }, next));", say: "The trace id and hashed user travel with the request through async code, so a tool deep in the call stack logs with the same ids." },
        { code: "log.warn({ reason: \"forbidden pattern\", attempt: 2 }, \"output validation failed\");", say: "A decision the system made, with the fields needed to group and count it later." },
      ],
    },
    useIt: "Log structured JSON with service, version, level, trace id and hashed user on every line; log decisions and state changes, not tokens; redact like traces; centralise with search; set retention by level; alert on error patterns and sample info on hot paths. Pair logs with traces through the trace id.",
    takeaways: ["Structured, correlated, levelled, contextual.", "Log decisions and state changes; the trace holds the prompt detail.", "Logs are personal data and a cost: redact, retain deliberately, sample.", "Group errors by message and trace id to find patterns fast."],
    terms: [["structured logging", "emitting logs as fields (JSON) rather than free text"], ["correlation id", "an identifier shared by all lines and spans of one request"], ["log level", "the severity of a line: debug, info, warning, error"]],
    reflect: { q: "Why hash the user id in logs rather than writing it plainly?", a: "Logs are widely accessible and long-lived; a plain id makes every line personal data tied to a person. A hash lets you group a user's events and join to the account system when authorised, without exposing identity to everyone who can read logs." },
  },

  "m39-monitoring": {
    simple: "Monitoring turns the system's behaviour into metrics on dashboards with alerts, so you know it is healthy, see trends, and are told when latency, errors, cost or quality move out of bounds.",
    concept:
      "**Monitoring** is the continuous measurement of a running system: counters and timers aggregated into metrics, drawn on dashboards, and compared with thresholds that trigger alerts. For an AI application the metrics come in four groups. Traffic and errors: requests per second, error rate by type, fallback rate, rate-limit hits. Latency: time to first token and total time, as percentiles (p50, p95, p99), per feature and model. Cost: tokens and spend per feature, per user tier, per day, cache hit rates. Quality signals: thumbs-down rate, decline rate, validation failures, evaluation pass rates per release, and for self-hosted models queue depth, GPU memory and tokens per second.\n\nAlerts fire on step changes and threshold breaches, with the trace query that explains them attached. The point is to find out from a dashboard, not from a customer.",
    why:
      "Logs and traces explain individual events; nobody can watch millions of them. Metrics summarise, and alerts watch the summaries so people do not have to. AI systems also degrade quietly: a provider slows, a prompt change nudges the decline rate, a cache stops hitting, the cost creeps up. Monitoring exists to see those movements within minutes, with enough context to act.",
    how: [
      "Instrument: counters for requests, errors, fallbacks, cache hits; histograms for latency and tokens; gauges for queue depth and GPU memory; all tagged by feature, model and version.",
      "Export to a metrics system; build dashboards per feature with the four groups.",
      "Define service-level objectives: for example p95 time to first token under 2.5 s, error rate under 0.5%, thumbs-down under 5%.",
      "Alert on breaches and on step changes relative to the previous hour or the previous release; attach runbooks and trace queries.",
      "Review dashboards at each release and weekly; tune thresholds from real data.",
      "Monitor costs with budgets and alerts, per feature and per tenant.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Group", "Metrics", "Alert example"],
        rows: [
          ["traffic & errors", "req/s, error rate by type, fallback rate, 429s", "error rate > 0.5% for 5 min; fallback rate > 5%"],
          ["latency", "TTFT p50/p95/p99, total p95, per model", "p95 TTFT > 2.5 s for 10 min"],
          ["cost", "tokens and £ per feature/day, cache hit rate", "cost per conversation > 1.5× 7-day median; prompt cache hit < 70%"],
          ["quality", "thumbs-down rate, decline rate, validation failures, eval pass rate", "thumbs-down > 8% for 1 h after a deploy"],
          ["self-hosted", "queue wait, tokens/s, GPU memory, instances", "queue wait > 5 s; GPU memory > 95%"],
        ],
      },
      caption: "Every alert names a runbook and a trace query. An alert without a next step is noise.",
    },
    everyday: {
      title: "The car's dashboard",
      text: "A driver does not read the engine's logs; they watch a few dials (speed, fuel, temperature) and a warning light comes on when something crosses a line. Monitoring is the dashboard and the warning lights for a service, and the trace is the mechanic's diagnostic you plug in afterwards.",
    },
    engineering: {
      title: "The prompt edit caught by a dashboard",
      text: "A company deployed a prompt change on a Friday afternoon. Error rate and latency were flat. Forty minutes later the quality panel alerted: thumbs-down rate for the 'returns' category had risen from 3% to 11% since the release marker on the chart. The alert linked to traces with negative feedback since the deploy; an engineer read five, saw the new phrasing softening a policy, and rolled back before the weekend. The evaluation suite was then extended with the cases, so the edit could not come back.",
    },
    maths: {
      formula: "p95 = the value below which 95% of requests fall;   error budget = (1 − SLO) × requests per period",
      meaning: "Percentiles describe the tail users actually feel; an error budget turns an objective into a number of failures you can afford.",
      worked: [
        "Latencies for 20 requests sorted: the 19th value is the p95. If it is 2.1 s and the average is 0.9 s, the average hides a slow tail.",
        "SLO 99.5% success over 2 million requests/day: error budget = 0.005 × 2,000,000 = 10,000 failed requests/day.",
        "An incident failing 3,000 requests consumes 30% of the day's budget; two such incidents a day mean the SLO is at risk and reliability work takes priority.",
      ],
    },
    code: {
      title: "Instrumenting the chat path",
      lang: "ts",
      src: `import { Counter, Histogram, Gauge } from "prom-client";

const requests = new Counter({ name: "chat_requests_total", help: "requests", labelNames: ["feature", "model", "release", "outcome"] });
const ttft = new Histogram({ name: "chat_ttft_seconds", help: "time to first token", labelNames: ["feature", "model"], buckets: [0.25, 0.5, 1, 1.5, 2.5, 4, 8] });
const tokens = new Counter({ name: "chat_tokens_total", help: "tokens", labelNames: ["feature", "model", "kind"] });
const feedback = new Counter({ name: "chat_feedback_total", help: "feedback", labelNames: ["feature", "release", "rating"] });
const queueWait = new Gauge({ name: "inference_queue_wait_seconds", help: "queue wait" });

// in the handler
const t0 = Date.now();
stream.onFirstToken(() => ttft.labels(feature, model).observe((Date.now() - t0) / 1000));
stream.onDone((usage) => {
  tokens.labels(feature, model, "input").inc(usage.input_tokens);
  tokens.labels(feature, model, "output").inc(usage.output_tokens);
  requests.labels(feature, model, RELEASE, "ok").inc();
});
stream.onError(() => requests.labels(feature, model, RELEASE, "error").inc());`,
      lines: [
        { code: "const ttft = new Histogram({ name: \"chat_ttft_seconds\", help: \"time to first token\", labelNames: [\"feature\", \"model\"], buckets: [0.25, 0.5, 1, 1.5, 2.5, 4, 8] });", say: "A histogram gives percentiles. The buckets bracket the objective (2.5 s) so p95 is measured precisely where it matters." },
        { code: "const requests = new Counter({ name: \"chat_requests_total\", help: \"requests\", labelNames: [\"feature\", \"model\", \"release\", \"outcome\"] });", say: "Labelled by release, so a dashboard can compare the new version with the old during a canary." },
        { code: "stream.onFirstToken(() => ttft.labels(feature, model).observe((Date.now() - t0) / 1000));", say: "Time to first token measured at the moment the first token arrives: the latency users feel." },
        { code: "const feedback = new Counter({ name: \"chat_feedback_total\", help: \"feedback\", labelNames: [\"feature\", \"release\", \"rating\"] });", say: "Quality as a metric: thumbs-down rate per release is the alert that caught the Friday prompt edit." },
      ],
    },
    useIt: "Instrument every AI feature with traffic, error, latency, cost and quality metrics labelled by feature, model and release; build one dashboard per feature; set objectives; alert on breaches and step changes with runbooks and trace queries attached; add self-hosted metrics (queue, GPU memory, tokens per second) where you serve models. Review at each release.",
    takeaways: ["Metrics summarise; alerts watch; dashboards show trends and release markers.", "Four groups: traffic and errors, latency percentiles, cost, quality signals.", "Alert on step changes after deploys, not only absolute thresholds.", "Every alert carries a runbook and a trace query."],
    terms: [["metric", "a numeric measurement aggregated over time, such as a rate or a percentile"], ["percentile (p95)", "the value below which 95% of measurements fall"], ["service-level objective (SLO)", "a target for a metric, such as p95 latency under 2.5 s"]],
    reflect: { q: "Why alert on the thumbs-down rate relative to the previous release rather than on a fixed number?", a: "Quality baselines differ by feature and drift slowly; a fixed threshold is either always firing or never. A step change right after a release is the signal that the release caused it, and it points directly at what to roll back." },
  },

  "m39-model-versioning": {
    simple: "Model versioning pins exactly which model (and prompt and index) each deployment uses, so behaviour is reproducible, changes are deliberate, and any answer can be traced to its versions.",
    concept:
      "A model's behaviour is a function of its weights and version. Providers release new versions under the same family name; self-hosted models get new checkpoints and adapters. **Model versioning** means never depending on a moving name: configuration names an exact version (a dated provider snapshot, a registry tag), changes to it go through the deployment pipeline with evaluations, and every trace records the version that produced the answer.\n\nThe same discipline covers the other things that change behaviour: prompt versions, embedding model versions (which require re-indexing), index versions, and tool definition versions. Together they form the 'release' of an AI feature. Upgrading a model is a project: run the evaluation suite on the candidate, compare per category, check cost and latency, canary it, keep the old version available for rollback, and re-embed if the embedding model changed.",
    why:
      "Models change under you. A provider's 'latest' alias can start behaving differently overnight; a retrained checkpoint can regress a category; a new embedding model makes old vectors meaningless. Without pinning, yesterday's passing evaluation says nothing about today's system, and a bad answer cannot be explained because nobody knows which model wrote it. Versioning exists so changes happen when you choose, are measured, and are reversible.",
    how: [
      "Reference exact model versions in configuration: provider snapshot ids or registry tags, never 'latest'.",
      "Store prompt text in version control with a version identifier; bump it on every edit.",
      "Record the release: code, prompt, model, embedding model, index version, tool definitions; put the ids in traces.",
      "To upgrade: run evaluations on the candidate against the baseline per category; compare cost and latency; canary; roll back if signals move.",
      "If the embedding model changes, rebuild the index as a new version and switch atomically.",
      "Watch provider deprecation notices and schedule upgrades before forced ones.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Component", "Version identifier", "Changing it requires"],
        rows: [
          ["model", "provider snapshot id or registry tag", "evals per category, cost and latency comparison, canary"],
          ["system prompt", "prompts/VERSION (git)", "evals; cache invalidation"],
          ["embedding model", "model id + dimension", "full re-index as a new index version; evals of retrieval recall"],
          ["index", "index version id", "atomic switch; rollback keeps the old index"],
          ["tool definitions", "tools/VERSION", "evals of tool-calling cases"],
        ],
      },
      caption: "A release is the set of these versions. Traces record all of them.",
    },
    everyday: {
      title: "Which edition of the textbook",
      text: "A school orders 'the chemistry textbook' and gets the new edition with renumbered chapters; every lesson plan breaks. A careful school orders the exact edition, trials the new one in one class first, and keeps the old edition until the switch is done. Model versions are editions.",
    },
    engineering: {
      title: "The alias that changed behaviour overnight",
      text: "A company's extraction pipeline referenced a provider model by its family alias. One morning the alias pointed at a new version; the structured-output accuracy on invoices fell from 97% to 91% because the new model formatted dates differently. Nobody had changed anything. They pinned the previous snapshot id, restored accuracy, then evaluated the new version properly: the date issue was fixed with a prompt tweak and the upgrade shipped a week later through a canary, with the version id recorded in every trace.",
    },
    maths: {
      formula: "upgrade decision: for each category, Δ pass rate ≥ −tolerance;   overall: cost and p95 latency within budget;   else do not upgrade",
      meaning: "An upgrade must not regress any category beyond noise and must stay within cost and latency targets. One number is not enough.",
      worked: [
        "Candidate vs current, per category: returns 0.96 → 0.97, extraction 0.97 → 0.91, injection 0.99 → 0.99. Extraction drops 6 points, beyond a 3-point tolerance: do not upgrade yet.",
        "After a prompt tweak for the new model: extraction 0.97 → 0.96, within tolerance. Cost per call 0.0042 → 0.0038, p95 TTFT 1.4 s → 1.2 s. Upgrade.",
        "Canary 10% for one hour: thumbs-down delta +0.3 points, within the 2-point alert. Proceed to 100%.",
      ],
    },
    code: {
      title: "Pinned versions, recorded in every trace",
      lang: "ts",
      src: `// config/prod.yaml (excerpt)
// model: claude-sonnet-4-5-20250929        # exact snapshot, never an alias
// embedding_model: voyage-3@1024
// index_version: help-2026-11-04-02
// prompt_version: 14

export const RELEASE = {
  code: process.env.GIT_SHA!,
  model: config.model,
  embeddingModel: config.embedding_model,
  indexVersion: config.index_version,
  promptVersion: config.prompt_version,
  toolsVersion: TOOLS_VERSION,
};

trace.meta.release = RELEASE;                            // every trace can be explained by its versions

if (/latest|^[a-z-]+$/.test(config.model)) throw new Error("model must be an exact versioned id: " + config.model);`,
      lines: [
        { code: "// model: claude-sonnet-4-5-20250929        # exact snapshot, never an alias", say: "A dated snapshot id. The provider will not change what this name means." },
        { code: "// embedding_model: voyage-3@1024", say: "The embedding model and its dimension; changing it means a new index version." },
        { code: "trace.meta.release = RELEASE;                            // every trace can be explained by its versions", say: "Any bad answer can be tied to the exact code, prompt, model, index and tools that produced it." },
        { code: "if (/latest|^[a-z-]+$/.test(config.model)) throw new Error(\"model must be an exact versioned id: \" + config.model);", say: "A startup check that refuses aliases, so nobody can accidentally deploy a moving target." },
      ],
    },
    useIt: "Pin model, prompt, embedding model, index and tool versions in configuration; refuse aliases at startup; record the release in every trace; treat upgrades as evaluated, canaried, reversible changes; re-index when embeddings change; track provider deprecations and upgrade on your schedule.",
    takeaways: ["Never depend on a moving model name; pin exact versions.", "A release is code + prompt + model + embedding model + index + tools; traces record all of them.", "Upgrades are evaluated per category, compared on cost and latency, canaried and reversible.", "An embedding model change is a re-index."],
    terms: [["model version", "an exact, immutable identifier for a model's weights"], ["alias", "a moving name such as 'latest' that can point at different versions over time"], ["release record", "the set of versions deployed together"]],
    reflect: { q: "A provider announces your pinned model will be retired in 90 days. What is the plan?", a: "Treat it as a scheduled upgrade: evaluate the successor now against the baseline per category, fix prompt differences, compare cost and latency, canary, and switch well before the deadline with the old version as rollback until retirement. Forced upgrades on the last day are how regressions ship." },
  },

  "m39-rollbacks": {
    simple: "A rollback returns the system to the previous known-good release quickly and safely; it must be rehearsed, fast, and cover prompts, models and indexes as well as code.",
    concept:
      "Every deployment can be wrong in a way the tests did not catch. A **rollback** is the planned, fast return to the previous release: the previous container image, the previous prompt version, the previous model id, and, where it changed, the previous index. It is the safety net that makes frequent deploys acceptable.\n\nRollbacks need preparation. The previous release must still exist and be deployable (images kept, model weights cached, old index retained). Rolling back must be one action, automated where metrics can trigger it, and must take minutes, not an hour of rebuilding. Data changes need care: a schema migration or a re-indexed vector store must be backward-compatible or kept in parallel until the new release is proven. And caches keyed by version invalidate themselves on rollback, so stale answers from the bad release do not linger.\n\nA rollback is not a failure; a deploy that cannot be rolled back is.",
    why:
      "The alternative to rolling back is fixing forward under pressure, which produces more bugs and longer outages. AI releases are especially prone to subtle regressions (a prompt wording, a model version) that appear only in production signals. Rollbacks exist so that the cost of a bad release is minutes of degraded service rather than hours, and so teams dare to ship small changes often.",
    how: [
      "Keep the last several releases deployable: images in the registry, weights cached, old index versions retained for a period.",
      "Make rollback a single command or button that switches image, config (prompt, model, index versions) together.",
      "Automate the trigger during canaries: a metric breach rolls back without waiting for a person.",
      "Keep schema and index changes backward-compatible for at least one release; expand first, contract later.",
      "After rolling back, capture the failing traces, add evaluation cases, fix, and redeploy through the pipeline.",
      "Rehearse: roll back a healthy release in staging monthly and measure the time it takes.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Detect", detail: "canary metric breach or alert: thumbs-down +6 points since release 142" },
        { label: "Decide", detail: "automatic during canary; one-click otherwise" },
        { label: "Switch", detail: "image 141, prompt v13, model snapshot A, index help-2026-11-03 — together" },
        { label: "Verify", detail: "metrics return to baseline within minutes; caches with version keys are already cold" },
        { label: "Learn", detail: "failing traces → eval cases → fix → redeploy via the pipeline" },
      ],
      caption: "Five steps, the first two automated where possible. The switch is one action because the release is one record.",
    },
    everyday: {
      title: "The understudy in the wings",
      text: "A theatre keeps an understudy who knows the part, in costume, in the wings. If the lead loses their voice mid-show, the understudy walks on within a minute and the audience barely notices. Nobody starts auditions during the performance. A rollback is the understudy: prepared in advance, ready in a minute.",
    },
    engineering: {
      title: "A re-index that could not be undone",
      text: "A team switched embedding models and rebuilt their vector index in place, deleting the old vectors as they went. Retrieval recall dropped (the new chunking had a bug) and there was nothing to roll back to; rebuilding the old index took nine hours during which the assistant answered badly. Their new rule: indexes are versioned and built alongside, the release switches the index version pointer, the old index is kept for seven days, and rollback is the pointer switch. The next embedding upgrade had a similar bug; the rollback took forty seconds.",
    },
    maths: {
      formula: "cost of a bad release ≈ affected users per minute × minutes to recover;   recovery minutes = detect + decide + switch + verify",
      meaning: "Rollback preparation shrinks every term in the recovery time; automation shrinks detect and decide to near zero.",
      worked: [
        "Manual process: detect 25 min (a customer complaint), decide 10, switch 30 (rebuild), verify 5 = 70 minutes × 150 users/minute ≈ 10,500 affected users.",
        "Prepared and automated during canary: detect 8, decide 0, switch 1, verify 3 = 12 minutes × 150 × 0.05 canary share ≈ 90 affected users.",
        "Keeping old images and indexes for a week costs a few pounds of storage; the difference above is the return on it.",
      ],
    },
    code: {
      title: "A rollback that switches the whole release",
      lang: "bash",
      src: `#!/usr/bin/env bash
# rollback.sh <env> [release-id]   — returns an environment to a previous release record
set -euo pipefail
ENV="$1"
TARGET="\${2:-$(releases list --env "$ENV" --healthy --limit 2 | tail -n 1)}"   # previous healthy release by default

releases show "$TARGET"                                   # prints image, prompt_version, model, index_version, tools_version
deploy --env "$ENV" --release "$TARGET" --canary 100      # one switch for image + config, no rebuild
wait-for-ready --env "$ENV" --timeout 120s
watch-metrics --env "$ENV" --minutes 5 --compare-to-release "$TARGET"
releases mark --env "$ENV" --current "$TARGET" --note "rollback by $(whoami) at $(date -u +%FT%TZ)"
notify "#incidents" "Rolled back $ENV to $TARGET"`,
      lines: [
        { code: "TARGET=\"${2:-$(releases list --env \"$ENV\" --healthy --limit 2 | tail -n 1)}\"   # previous healthy release by default", say: "Defaults to the last release that was healthy, so the on-call engineer does not have to look anything up at 3 am." },
        { code: "deploy --env \"$ENV\" --release \"$TARGET\" --canary 100      # one switch for image + config, no rebuild", say: "The release record carries image and every version; switching it switches all of them together. Nothing is rebuilt." },
        { code: "wait-for-ready --env \"$ENV\" --timeout 120s", say: "Readiness checks confirm the old release is serving before anyone declares victory." },
        { code: "watch-metrics --env \"$ENV\" --minutes 5 --compare-to-release \"$TARGET\"", say: "Verify that the metrics return to what that release used to show." },
      ],
    },
    useIt: "Make every release a record of versions that can be redeployed in one action; keep images, weights and indexes for previous releases; automate rollback on canary metric breaches; keep data changes backward-compatible; version cache keys; rehearse rollbacks and measure their time. Then ship small changes often.",
    takeaways: ["A rollback is a prepared switch to the previous release record: image, prompt, model, index together.", "Keep previous artefacts deployable; make rollback one action; automate it during canaries.", "Index and schema changes are versioned and kept in parallel until proven.", "Rehearse; a rollback that has never been run is a hope."],
    terms: [["rollback", "returning to a previous known-good release"], ["expand and contract", "making data changes in two steps so both old and new releases work during the transition"], ["known-good release", "a release whose metrics were healthy in production"]],
    reflect: { q: "After a rollback, should the team hotfix forward immediately?", a: "No. The system is healthy on the old release; use the time to capture failing traces, add evaluation cases that would have caught it, fix properly, and redeploy through the full pipeline. Hotfixing under pressure is how the second incident starts." },
  },
};

export const M39_QUIZ: Quiz[] = [
  {
    q: "A product manager wants prompt edits to go live immediately from a dashboard. Why should they go through the deployment pipeline instead?",
    options: ["Dashboards are insecure", "A prompt change can regress behaviour like a code change; the pipeline runs evaluations, canaries and keeps a rollback", "Prompts cannot be stored in git", "It is faster"],
    answer: 1,
    why: ["Security is not the main point.", "Correct. Prompts and model versions are configuration that changes behaviour; they get the same gates and safety net as code.", "They can and should be.", "It is slower, deliberately."],
    reason: true,
  },
  {
    q: "A 7-billion-parameter model stored at 16-bit needs roughly how much GPU memory for its weights alone?",
    options: ["3.5 GB", "7 GB", "14 GB", "28 GB"],
    answer: 2,
    why: ["That is the 4-bit figure.", "That would be 8-bit.", "Correct. 7 × 10⁹ parameters × 2 bytes = 14 GB, before the attention cache.", "32-bit would be 28 GB."],
  },
  {
    q: "Your inference autoscaler uses GPU utilisation as its signal. Why did it fail to scale during a lunchtime spike?",
    options: ["GPUs cannot be measured", "A saturated GPU reads near 100% whether the queue is empty or deep; queue wait or in-flight requests is the right signal", "The maximum was too low", "Lunch is not a peak"],
    answer: 1,
    why: ["They can.", "Correct. Utilisation cannot distinguish busy-and-fine from busy-and-drowning; queue-based signals can and lead saturation.", "Possibly also, but the signal is the root cause.", "It is."],
  },
  {
    q: "Which workload belongs on spot instances?",
    options: ["The interactive chat assistant", "A nightly batch transcription job with checkpoints every five minutes", "The vector database", "The API server"],
    answer: 1,
    why: ["Spot capacity vanishes exactly when users are active.", "Correct. Batch work with checkpoints loses minutes on preemption and saves most of the cost.", "Stateful stores need stable instances.", "Interactive paths need reserved or on-demand capacity."],
  },
  {
    q: "Why does a response cache key include the prompt version?",
    options: ["To make keys longer", "So a prompt edit invalidates answers produced by the old prompt automatically", "Because the provider requires it", "To cache across users"],
    answer: 1,
    why: ["No.", "Correct. Everything that changes the answer belongs in the key; old-prompt answers must not be served after an edit.", "Providers do not see your cache.", "User scoping is a separate, necessary part of the key for personal answers."],
    reason: true,
  },
  {
    q: "A load balancer uses round-robin for an assistant with streams lasting 2 to 30 seconds. What goes wrong?",
    options: ["Nothing", "Instances become unevenly loaded; least-connections or queue-aware routing keeps them balanced", "Streams cannot be balanced", "Health checks stop working"],
    answer: 1,
    why: ["Uneven durations break round-robin's assumption.", "Correct. Taking turns ignores how busy each instance is; least-connections sends new work to the quietest.", "They can, with timeouts above the longest stream.", "Unrelated."],
  },
  {
    q: "Which is the correct separation of logs and traces?",
    options: ["Logs hold prompts; traces hold counters", "Logs are operational events with ids; traces hold one request's full chain; both share the trace id", "They are the same thing", "Traces are for errors only"],
    answer: 1,
    why: ["Reversed.", "Correct. Logs find the request and show what happened; the trace explains the answer.", "Different volume, detail and retention.", "Traces cover every sampled request."],
  },
  {
    q: "A provider's model alias changed overnight and extraction accuracy dropped. What prevents this?",
    options: ["A longer prompt", "Pinning exact model snapshot ids in configuration and refusing aliases at startup", "Retrying failed extractions", "Lowering the temperature"],
    answer: 1,
    why: ["Prompts do not pin models.", "Correct. Upgrades should happen when you choose, evaluated and canaried, not when an alias moves.", "Retries do not fix a behaviour change.", "Unrelated."],
  },
  {
    q: "An embedding model upgrade rebuilt the index in place and recall dropped. What should the process have been?",
    options: ["Rebuild faster", "Build the new index as a separate version, switch a pointer, keep the old index so rollback is the pointer switch", "Use the old embedding model forever", "Skip evaluation"],
    answer: 1,
    why: ["Speed does not create a rollback path.", "Correct. Versioned indexes built alongside make the switch and the rollback both instant.", "Upgrades are fine when reversible.", "Evaluation of retrieval recall would also have caught the chunking bug before the switch."],
  },
];

export const M39_EXERCISES: Exercise[] = [
  {
    title: "Size a self-hosted inference fleet",
    kind: "calculate",
    task: "You must serve 60 million output tokens per day with a 7B model. One GPU measured at 1,500 tokens/s with batching; you want 65% average utilisation and headroom for a 2× peak hour. GPUs cost £1.10/hour on-demand, £0.65 reserved. How many GPUs, which capacity type, and what is the monthly cost? Compare with a provider at £0.60 per million output tokens.",
    hints: ["Tokens per GPU per day at 65% utilisation = 1,500 × 86,400 × 0.65.", "Peak capacity must cover 2× the average hourly rate."],
    solution: "Per GPU per day at 65%: 1,500 × 86,400 × 0.65 ≈ 84.2 million tokens, so one GPU covers the daily average. But the peak hour needs 2× the average rate: average rate = 60M ÷ 86,400 ≈ 694 tokens/s; peak ≈ 1,390 tokens/s, which one GPU at 1,500 tokens/s just covers with no redundancy. Run 2 GPUs reserved (one for the base, one for peak and failover): 2 × £0.65 × 730 h ≈ £949/month. Add a third on-demand only on exceptional days. Provider: 60M × 30 days × £0.60/M = £1,080/month. Self-hosting is slightly cheaper at this volume and gets cheaper as volume grows; it costs an engineer's time to operate, which may outweigh £130 a month unless data residency also matters.",
  },
  {
    title: "Write the canary policy",
    kind: "think",
    task: "Define a canary release policy for a support assistant: traffic shares and durations, the metrics compared, thresholds that trigger automatic rollback, and what happens to prompt-only changes.",
    hints: ["Compare the canary with the current release on the same window.", "Quality signals move slower than errors; give them time."],
    solution: "Stages: 5% for 30 minutes, 25% for 30 minutes, 100%. Metrics compared canary vs current over the same window: error rate (rollback if > 0.5% absolute or 2× current), p95 time to first token (rollback if > 2.5 s or 1.5× current), fallback rate (> 5%), cost per conversation (> 1.3× current), validation failure rate (> 2× current), thumbs-down rate (> current + 2 points, evaluated at the end of each stage because it needs volume). Any trigger rolls back automatically and posts the diff and trace query. Prompt-only changes use the same policy; they skip the image build but not the evaluations or the canary.",
  },
  {
    title: "Design the queue for document indexing",
    kind: "think",
    task: "A customer can upload up to 5,000 documents at once. Design the indexing queue: job definition, idempotency, worker concurrency, provider budget sharing with the chat feature (limit 1,000,000 tokens/minute, chat uses ~300,000 at peak), retries, dead-letter handling and what the user sees.",
    hints: ["Each document ≈ 6,000 tokens of embedding work.", "Leave chat its headroom at peak."],
    solution: "Job: index-document {docId, ownerId, indexVersion}, jobId 'index:' + docId (idempotent re-enqueue is a no-op), attempts 3 with exponential backoff from 10 s. Budget: chat needs 300,000 tokens/min at peak with headroom, so indexing gets at most 500,000 tokens/min ≈ 83 documents/min. Workers: 8 concurrent, each throttled by the shared budget; off-peak the budget rises to 800,000. Drain time for 5,000 documents ≈ 60 minutes at peak, ~35 off-peak. Errors: transient (429, timeouts) retry; permanent (unparseable file) dead-letter immediately with the reason shown in the admin UI and an email to the uploader. User sees: upload returns instantly with a job id; a progress bar from indexed count ÷ total; documents become searchable as they finish; failures listed with a 'fix and retry' action.",
  },
  {
    title: "Rehearse a rollback",
    kind: "build",
    task: "Write a runbook for rolling back the assistant after a bad prompt release at 02:00: the exact signal that tells you it is bad, the command, how you verify recovery, what you capture before fixing forward, and how you make sure the same regression cannot ship again.",
    hints: ["The release record ties prompt, model and index together.", "Verification compares metrics with the restored release's history."],
    solution: "Signal: the quality alert 'thumbs-down rate > previous release + 2 points for 30 minutes' or the canary auto-rollback notification; confirm by reading three traces with negative feedback since the release marker. Command: ./rollback.sh prod (defaults to the previous healthy release; prints image, prompt v13, model snapshot, index version). Verify: wait-for-ready passes; within 10 minutes thumbs-down, validation failures and fallback rate return to the restored release's baseline on the dashboard; a smoke test of the affected category passes. Capture: save the trace query for the bad period, export 20 failing traces, note the diff between prompt v14 and v13. Prevent recurrence: add the failing questions as evaluation cases with the forbidden phrasing, confirm the suite now fails on v14, fix the prompt, pass the suite, redeploy through the pipeline in working hours with a canary.",
  },
];
