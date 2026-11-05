import type { Exercise, LessonBody, Quiz } from "../types";

// Module 40: Inference optimisation. One concept per lesson.
// Keys are lesson slugs: m40-<kebab of the concept title in map.ts>.

export const M40_BODIES: Record<string, LessonBody> = {
  "m40-inference-in-production": {
    simple: "Inference in production is running a trained model for real users, where every request has a cost, a wait and a chance of failing, so the goal shifts from accuracy alone to accuracy at a price and a speed you can afford.",
    concept:
      "During training, a model is a thing you improve. In **inference in production** it is a thing you run: a service that takes a request, does a forward pass, and returns a result to a person or a program that is waiting. The model does not change; everything around it does.\n\nThree numbers now matter as much as the model's quality. How long one request takes (latency). How many requests the system handles per second (throughput). What each request costs in hardware time and electricity (cost). These three pull against each other: squeezing more requests through the same card usually makes each one wait longer; making each one faster usually means buying more cards.\n\nInference optimisation is the craft of moving those three numbers together: smaller numbers in memory, less wasted computation, more work per trip to the hardware, and fewer tokens generated than you would have by default. The rest of this module is one technique per lesson.",
    why:
      "A model that is accurate but takes nine seconds per answer, or costs four cents a call at a million calls a day, is not a product. Training is paid for once; inference is paid for on every single request for as long as the product lives, so a 30% saving in inference is worth more than almost any training improvement.\n\nThe second reason is physical. Large models barely fit on the hardware available, and the step that produces each token is dominated by moving billions of numbers out of memory rather than by arithmetic. Without optimisation, most of a very expensive GPU sits idle while it waits for memory. Production inference exists as its own discipline because the naive way of running a model wastes most of what you paid for.",
    how: [
      "A request arrives at an API server with a prompt (and, for chat, the conversation so far).",
      "The server tokenises the text and places the request on a queue for a GPU worker.",
      "The worker runs the forward pass over the prompt once (the prefill), then produces output tokens one at a time (the decode loop).",
      "Each decode step reads the whole model's weights from GPU memory to compute one token for every request in the batch.",
      "Tokens stream back to the client as they are produced; the request finishes at a stop token or a length limit.",
      "Metrics are recorded for each stage: queue time, prefill time, time per output token, tokens in and out, and the cost those imply.",
    ],
    visual: {
      kind: "flow",
      steps: ["request", "queue", "prefill: read the whole prompt", "decode: one token per step, weights read every step", "stream tokens back", "metrics: latency, throughput, cost"],
      caption: "Prefill is one big pass; decode is many small passes. The decode loop is where most of the time, and most of the optimisation, lives.",
    },
    everyday: {
      title: "A restaurant kitchen after opening night",
      text: "Developing the menu is training: slow, careful, done once. Service is inference: the same dishes, hundreds of times, with diners waiting. Nobody judges a kitchen on the menu alone. They judge how long the food takes, how many tables it can serve on a Saturday, and whether it makes money per plate. A brilliant menu that takes forty minutes a dish closes within a month.",
    },
    engineering: {
      title: "A support assistant on a fixed GPU budget",
      text: "A software company runs a 13-billion-parameter open-weight model for its customer-support assistant on two rented GPUs. At launch, each answer took eight seconds to start and the cards handled about twenty concurrent chats before queues formed. Over three months the team halved the memory with 8-bit weights, turned on continuous batching so new chats join mid-flight, cached the shared system prompt, and capped answer length. The same two cards now serve ninety concurrent chats with a one-second wait for the first token. No model change; all inference engineering.",
    },
    maths: {
      formula: "cost per request ≈ (GPU hourly price ÷ 3600) × seconds of GPU time per request ÷ requests sharing the GPU at once",
      meaning: "What one answer costs depends on the card's price, how long it occupies the card, and how many other requests share the card during that time. Every lesson in this module attacks one of those three.",
      worked: [
        "A GPU costs £2.40 per hour: £2.40 ÷ 3600 = £0.000667 per second.",
        "One answer occupies the GPU for 6 seconds and nothing else shares it: cost = 0.000667 × 6 = £0.004 per answer, 0.4 pence.",
        "With batching, 20 requests share the card for those 6 seconds: £0.004 ÷ 20 = £0.0002 each, 0.02 pence.",
        "At one million answers a day: £4,000 a day unbatched, £200 a day batched. Same model, same card.",
      ],
    },
    useIt: "Every deployed model, from a fraud scorer to a chat assistant, runs through this loop. The techniques apply whether you host an open-weight model yourself or call a provider's API: the provider is doing exactly this behind the price per token, and understanding it tells you why prompt length, output length and batch jobs change your bill.",
    takeaways: ["Production inference is judged on latency, throughput and cost together, not accuracy alone.", "Training is paid once; inference is paid on every request forever.", "Prefill reads the prompt once; decode produces tokens one by one and re-reads the weights each step.", "Most optimisation is about memory traffic, idle hardware and unnecessary tokens."],
    terms: [["inference in production", "running a trained model as a service for real requests"], ["prefill", "the single forward pass over the whole prompt before any output token"], ["decode", "the loop that produces output tokens one step at a time"]],
    reflect: { q: "Why does a model that is 'fast enough' on a developer's laptop with one user often fall over in production?", a: "One user never exposes queueing, batching, memory pressure from many concurrent conversations, or the cost per request. Production adds all of them at once, and the decode loop that felt fine alone becomes the bottleneck when fifty users share the same card." },
  },

  "m40-inference-latency": {
    simple: "Inference latency is how long a user waits for an answer; for text generation it splits into the wait for the first token and the time per token after that, and each needs a different fix.",
    concept:
      "**Inference latency** is the time between sending a request and getting the result. For a classifier it is one number. For a language model it is two, because the answer arrives in pieces.\n\n**Time to first token** (TTFT) is how long until anything appears. It covers queueing, tokenising, and the prefill pass over the whole prompt, so it grows with prompt length and with how busy the server is. **Time per output token** (TPOT) is the gap between tokens once they start flowing; it depends on the model's size, the hardware, and how many requests share the batch. Total latency is TTFT plus TPOT times the number of output tokens.\n\nUsers feel these differently. A long TTFT feels like the system is broken; a slow TPOT feels like slow typing, which is tolerable if the text is streaming. That is why streaming matters so much, and why the two numbers are optimised separately.",
    why:
      "Users abandon chat interfaces when nothing happens for a few seconds, and they judge the whole product by that wait. A single 'latency' number hides where the time went: a slow TTFT points at long prompts or queueing, a slow TPOT points at the model size or hardware, and a long total points at answers that are simply too long. Without splitting the measurement, teams optimise the wrong thing: buying faster GPUs when the problem was a 6,000-token system prompt, or trimming prompts when the problem was a queue.",
    how: [
      "Record the timestamp when the request arrives and when the first output token leaves: that is TTFT.",
      "Record the time between consecutive output tokens; the average is TPOT.",
      "Total latency = TTFT + TPOT × output tokens. Measure the distribution, not the average: p50 (median) and p95 or p99 (the slow tail).",
      "Attribute TTFT to its parts: queue wait, prefill (proportional to prompt tokens), and network.",
      "Fix each part with its own tool: shorter or cached prompts for prefill, more capacity or admission control for queues, smaller or quantised models for TPOT, output caps for total.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "0 ms: request sent", detail: "the clock starts" },
        { label: "Queue wait", detail: "waiting for a slot in a batch; grows with load" },
        { label: "Prefill", detail: "the whole prompt processed at once; grows with prompt length" },
        { label: "First token appears (TTFT)", detail: "what the user feels as 'did it start?'" },
        { label: "Decode: one token every TPOT", detail: "what the user feels as typing speed" },
        { label: "Last token (total latency)", detail: "TTFT + TPOT × output length" },
      ],
      caption: "Two numbers, two experiences: the start and the pace.",
    },
    everyday: {
      title: "Ordering coffee",
      text: "Time to first token is how long before the barista acknowledges you; time per token is how fast they make the drink once started. A café where you stand unacknowledged for two minutes feels broken even if the coffee then takes thirty seconds. A café that greets you instantly but takes four minutes to make the drink feels slow but fine, because you can see progress. The same total wait is tolerated or not depending on where it falls.",
    },
    engineering: {
      title: "Finding the real bottleneck in a document assistant",
      text: "A legal-tech team measured a p95 latency of eleven seconds and assumed the 70-billion-parameter model was too big. Splitting the number showed TTFT at nine seconds and TPOT at thirty milliseconds. The prompts carried fourteen thousand tokens of retrieved contract text; prefill was the whole problem. They cut retrieval to the four most relevant chunks and cached the shared instructions. TTFT fell to 1.2 seconds with the same model. Buying hardware would have cost ten times more and fixed less.",
    },
    maths: {
      formula: "total latency = TTFT + TPOT × output tokens;   TTFT ≈ queue wait + prefill time, where prefill time ∝ prompt tokens",
      meaning: "The two components add; only the second is multiplied by output length. Cutting output length shrinks total latency even when nothing else changes.",
      worked: [
        "A request waits 0.4 s in the queue; prefill takes 0.1 ms per prompt token over a 3,000-token prompt: 0.3 s. TTFT = 0.4 + 0.3 = 0.7 s.",
        "TPOT is 40 ms. The answer is 400 tokens: decode time = 0.040 × 400 = 16 s. Total = 16.7 s, almost all decode.",
        "Cap the answer at 150 tokens: decode = 6 s, total 6.7 s. A 60% cut from an output limit alone.",
        "Halve TPOT with a faster card (20 ms): 150 tokens take 3 s; total 3.7 s. Both changes together beat either.",
      ],
    },
    code: {
      title: "Measuring TTFT and TPOT around a streaming call",
      lang: "ts",
      src: `const started = performance.now();
let first: number | null = null;
let tokens = 0;
let last = started;
const gaps: number[] = [];

for await (const chunk of stream) {
  const now = performance.now();
  if (first === null) first = now - started;   // time to first token
  else gaps.push(now - last);                   // one gap per later token
  last = now;
  tokens += 1;
}

const ttft = first ?? performance.now() - started;
const tpot = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
metrics.record({ ttft, tpot, tokens, total: performance.now() - started });`,
      lines: [
        { code: "if (first === null) first = now - started;   // time to first token", say: "The first chunk's arrival stamps TTFT. Everything before it (queue, prefill, network) is inside this number." },
        { code: "else gaps.push(now - last);                   // one gap per later token", say: "Every later chunk contributes one gap; their average is TPOT." },
        { code: "const tpot = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;", say: "Average gap between tokens: the typing speed the user sees." },
        { code: "metrics.record({ ttft, tpot, tokens, total: performance.now() - started });", say: "Record all four, so dashboards can show the distribution of each separately." },
      ],
      note: "Record per request and look at p95, not the mean. The slow tail is what users complain about.",
    },
    useIt: "Split every latency measurement into TTFT and TPOT before deciding what to fix. Long prompts and queues show up in TTFT; model size and hardware show up in TPOT; verbose answers show up in the total. Set targets per number: under one second to first token for chat, and a TPOT faster than reading speed, roughly 50 ms, so streaming never stalls.",
    takeaways: ["Latency for generation is two numbers: time to first token and time per output token.", "TTFT grows with prompt length and load; TPOT with model size and hardware.", "Total = TTFT + TPOT × output tokens, so output caps are a latency tool.", "Measure the p95 tail, not the average."],
    terms: [["time to first token (TTFT)", "the wait before the first output token appears"], ["time per output token (TPOT)", "the average gap between output tokens"], ["p95", "the value that 95% of requests are faster than; the slow tail"]],
    reflect: { q: "A team reports 'average latency 2.1 seconds, users still complain'. What number would you ask for next?", a: "The p95 or p99, split into TTFT and TPOT. An average of 2.1 s can hide a tail where one request in twenty waits twelve seconds, and those are the users who complain." },
  },

  "m40-throughput": {
    simple: "Throughput is how much work the system completes per second across all users, and raising it is mostly about keeping the GPU busy with many requests at once.",
    concept:
      "**Throughput** is the amount of work finished per unit of time: requests per second, or for language models, tokens generated per second across every request on the server. Where latency is one user's experience, throughput is the whole system's capacity.\n\nThe two pull against each other. A GPU producing one token at a time for one user wastes almost all its arithmetic, because each decode step is limited by reading the weights from memory, and the same read can serve many requests at once. Packing more requests into each step raises throughput enormously at a small cost in each request's time per token. Past a point, though, requests queue and latency climbs steeply. The craft is finding the batch size where throughput is high and the latency tail is still acceptable.\n\nThroughput sets cost. Double the tokens per second from the same card and the cost per token halves.",
    why:
      "Hardware is the dominant cost of running models, and an idle GPU costs the same as a busy one. A server that handles ten concurrent users when it could handle a hundred is paying ten times too much per request. Throughput also decides whether a traffic spike turns into a queue: if capacity is twice the peak demand, nobody waits; if it is below, everyone does. Teams that only measure latency discover capacity problems on launch day.",
    how: [
      "Measure tokens generated per second across the whole server, and requests completed per second, under a load test.",
      "Increase concurrency step by step: 1, 4, 16, 64 requests at once. Throughput rises steeply at first because each decode step serves more requests for nearly the same cost.",
      "Watch TPOT and TTFT at each step. They rise slowly, then sharply once the GPU's compute or memory is saturated.",
      "Pick the operating point where throughput is near its plateau and the p95 latency is still within target.",
      "Provision enough servers that peak demand sits below that point, with headroom for spikes.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Concurrent requests", "Tokens/s (whole server)", "TPOT per request", "p95 TTFT", "Cost per 1M tokens"],
        rows: [
          ["1", "35", "28 ms", "0.3 s", "£19.00"],
          ["8", "250", "32 ms", "0.4 s", "£2.70"],
          ["32", "820", "39 ms", "0.7 s", "£0.81"],
          ["64", "1,300", "49 ms", "1.4 s", "£0.51"],
          ["128", "1,450", "88 ms", "4.9 s", "£0.46"],
        ],
      },
      caption: "Illustrative numbers for one mid-size model on one card. Throughput climbs 40× from 1 to 128 concurrent, but beyond 64 the latency tail explodes for a small gain.",
    },
    everyday: {
      title: "A lift in an office tower",
      text: "A lift that carries one person per trip has terrible throughput: everyone waits while it shuttles. Filling it with twelve people per trip moves far more people per hour, and each rider waits only slightly longer for the doors. Cram in twenty and the doors keep reopening, stops multiply, and every ride becomes slow. The lift is a GPU; riders are requests; the sweet spot is a full lift that still moves.",
    },
    engineering: {
      title: "Capacity planning before a product launch",
      text: "A travel company expected 400 concurrent chats at peak after a television advert. A load test on one GPU server found throughput plateaued at about 60 concurrent chats with a 1.5-second p95 TTFT. They provisioned nine servers (540 concurrent at the sweet spot, 35% headroom) with autoscaling to fourteen. On launch night peak hit 470 concurrent chats; p95 TTFT stayed under two seconds. Without the load test they had planned for three servers, which would have queued hundreds of users within minutes.",
    },
    maths: {
      formula: "throughput (tokens/s) = batch size × 1000 ÷ TPOT (ms);   cost per token = GPU price per second ÷ throughput",
      meaning: "Each decode step produces one token per request in the batch; bigger batches multiply the output of each step. Cost per token falls in proportion.",
      worked: [
        "Batch size 1, TPOT 28 ms: throughput = 1 × 1000 ÷ 28 ≈ 36 tokens/s.",
        "Batch size 32, TPOT 39 ms: throughput = 32 × 1000 ÷ 39 ≈ 820 tokens/s. The batch is 32× bigger; each step is only 1.4× slower.",
        "GPU at £2.40/hour = £0.000667/s. Cost per token at batch 1: 0.000667 ÷ 36 = £0.0000185, i.e. £18.50 per million tokens.",
        "At batch 32: 0.000667 ÷ 820 = £0.00000081, i.e. £0.81 per million. A 23× cheaper token from the same card.",
      ],
    },
    useIt: "Load-test every model server before launch and chart throughput against latency as concurrency rises. Use the chart to pick the operating point and to size the fleet. When a provider's price per token looks low, this is why: they run large batches. When you self-host, batching is the single biggest lever on cost.",
    takeaways: ["Throughput is system capacity: tokens or requests per second across all users.", "Batching raises throughput steeply because each decode step can serve many requests for nearly the same memory read.", "Past the sweet spot, latency climbs faster than throughput.", "Cost per token is GPU cost divided by throughput; batching is the main cost lever."],
    terms: [["throughput", "work completed per second across all requests"], ["batch size", "how many requests one decode step serves together"], ["load test", "sending controlled synthetic traffic to measure capacity"]],
    reflect: { q: "Why does throughput plateau instead of rising forever with batch size?", a: "At small batches the step is limited by reading weights from memory, so extra requests are almost free. Once the batch is large enough that the arithmetic (or the memory needed for every request's cache) saturates the card, each extra request adds real time, and the gain per request vanishes." },
  },

  "m40-tokens-per-second": {
    simple: "Tokens per second is the common yardstick for generation speed, but it means two different things: how fast one user's answer types out, and how many tokens the whole server produces.",
    concept:
      "**Tokens per second** (tok/s) measures how quickly text is produced. It appears in two places that are easy to confuse.\n\nPer request, it is the typing speed one user sees: 1000 ÷ TPOT. A model producing 25 tok/s for one user writes roughly 20 words a second, faster than most people read. Per server, it is throughput: all requests' tokens added together. A card producing 25 tok/s for each of 40 users is producing 1,000 tok/s in total.\n\nA third use is prefill speed: tokens processed per second when reading the prompt, usually tens of thousands per second because the whole prompt is handled in one parallel pass. Any claim of 'X tokens per second' is meaningless until you know which of the three it is and at what batch size.",
    why:
      "Vendors, benchmarks and dashboards all quote tokens per second, and decisions get made on the number: which hardware to buy, which model to run, which provider to pick. Comparing a per-user figure at batch size 1 against a server-wide figure at batch 64 leads to buying the wrong thing. It also matters for product design: a per-user speed below reading speed makes streaming feel laggy, while a server-wide number decides the fleet size and the bill.",
    how: [
      "Define which figure you mean: per request (decode), per server (throughput) or prefill.",
      "Per request: count output tokens, divide by decode time (excluding TTFT).",
      "Per server: sum output tokens over a window across all requests, divide by the window length.",
      "Prefill: prompt tokens divided by prefill time; expect it to be one to two orders of magnitude higher than decode.",
      "Always state the model, precision, hardware, batch size and prompt length next to the number; without them it cannot be compared.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Per-request tok/s (decode)", points: ["1000 ÷ TPOT", "What one user feels as typing speed", "Falls slowly as the batch grows", "Target: above reading speed, ~15 tok/s"] },
      right: { title: "Server tok/s (throughput)", points: ["Sum over all requests", "What decides fleet size and cost", "Rises steeply with the batch", "Target: as high as the latency budget allows"] },
      caption: "Same unit, different questions. Always ask which one a number is.",
    },
    everyday: {
      title: "Words per minute for one typist, pages per hour for the office",
      text: "A typist's speed is words per minute: it tells you how long your letter takes. A typing pool's output is pages per hour: it tells the manager how many staff to hire. Nobody would size an office from one typist's speed or judge a typist by the pool's total, yet 'tokens per second' is quoted both ways without saying which.",
    },
    engineering: {
      title: "Comparing two providers fairly",
      text: "A fintech team saw one provider advertise 120 tok/s and another 45 tok/s and nearly chose the first. The 120 figure was per request at batch size one on a small model; the 45 was per request under realistic load on a larger model. They ran their own test: the same 200 prompts, the same output length, at the concurrency they expected. The 'slower' provider delivered 52 tok/s per user at 50 concurrent requests; the 'faster' one dropped to 30. The advertised number had been measured in conditions the product would never see.",
    },
    maths: {
      formula: "per-request tok/s = 1000 ÷ TPOT(ms);   server tok/s = Σ output tokens ÷ window seconds;   prefill tok/s = prompt tokens ÷ prefill seconds",
      meaning: "Three divisions, three quantities. The first is a speed, the second a capacity, the third tells you how prompt length turns into waiting time.",
      worked: [
        "TPOT 40 ms → per-request speed = 1000 ÷ 40 = 25 tok/s, about 19 words per second.",
        "In a 10-second window the server emitted 9,400 output tokens across all users: 940 tok/s throughput.",
        "A 4,000-token prompt prefilled in 0.25 s: 16,000 tok/s prefill. Doubling the prompt adds about 0.25 s to TTFT.",
        "Reading speed is about 4 words per second, roughly 5 tok/s; 25 tok/s per user is five times faster than anyone reads, so streaming never stalls.",
      ],
    },
    useIt: "Use per-request tokens per second to judge the user experience of streaming, and server tokens per second to size hardware and compute cost per token. When reading any benchmark or vendor claim, find the batch size, hardware and prompt length before trusting it, and reproduce it with your own prompts under your own load before buying.",
    takeaways: ["Tokens per second means per-request speed, server throughput, or prefill speed; say which.", "Per-request speed should exceed reading speed; server throughput decides cost and capacity.", "Prefill is far faster per token than decode but scales with prompt length.", "A number without model, hardware, batch size and prompt length cannot be compared."],
    terms: [["tokens per second", "generation speed, per request or across a server"], ["prefill speed", "prompt tokens processed per second in the initial pass"], ["reading speed", "about 4 words or 5 tokens per second; the floor for comfortable streaming"]],
    reflect: { q: "A model streams at 60 tok/s per user. Would users notice if it dropped to 30?", a: "Barely, in a chat: both are far above reading speed. They would notice TTFT changes far more. The drop matters for throughput and cost, not for the feel of streaming, unless the output is code the user is waiting to run." },
  },

  "m40-gpu-memory": {
    simple: "GPU memory is the fast but small store on the graphics card where a model's weights and its working data must fit, and it is usually the first thing that runs out.",
    concept:
      "A GPU has its own memory, separate from the computer's main memory, called **GPU memory** or VRAM. It is extremely fast, so the thousands of cores can read it quickly, and it is small: 24 gigabytes on a good consumer card, 80 on a data-centre card. Everything the model needs during a forward pass must be in it: the weights, the inputs flowing through, and the cache of attention state for every request in flight.\n\nTwo properties shape all of inference. Capacity decides which models fit at all and how many concurrent requests can share the card. Bandwidth, the speed at which bytes can be read, decides how fast each decode step can run, because every step reads every weight. A card with twice the bandwidth generates tokens roughly twice as fast for the same model.\n\nWhen memory runs out there is no graceful slowdown; the process crashes with an out-of-memory error. Managing GPU memory is the first job of anyone serving models.",
    why:
      "Models grew faster than memory did. A 70-billion-parameter model in 16-bit needs 140 gigabytes just for its weights, more than any single card holds. Every technique in this module exists partly because of this limit: quantisation shrinks the weights, the KV cache has to be managed because it competes with weights for space, and parallelism splits a model across cards because it will not fit on one. Understanding the memory budget is understanding why the field looks the way it does.",
    how: [
      "At load time the weights are copied from disk into GPU memory; this is fixed for the life of the process.",
      "Each request adds working memory: activations for the current step, and the KV cache that grows with every token of its prompt and output.",
      "The serving framework reserves a pool for caches and decides how many requests can be admitted before it fills.",
      "During each decode step, the cores read the weights and the caches from memory; bandwidth caps how fast this can happen.",
      "If an incoming request's cache would not fit, it waits in the queue; if the framework miscounts, the process crashes with out-of-memory.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["What lives in GPU memory", "Size depends on", "Changes over time?"],
        rows: [
          ["model weights", "parameters × bytes per parameter", "no, fixed at load"],
          ["KV cache", "concurrent requests × their token counts × per-token size", "yes, every token"],
          ["activations", "batch size × sequence × hidden size", "yes, per step"],
          ["framework overhead and fragmentation", "the serving software", "mostly fixed"],
        ],
      },
      caption: "Weights are the big fixed cost; the KV cache is the big variable one. Everything else is small.",
    },
    everyday: {
      title: "A chef's bench",
      text: "A kitchen has a pantry (disk, huge and slow) and the chef's bench (GPU memory, small and within arm's reach). Every ingredient for the dishes being cooked right now must be on the bench. A dish whose ingredients do not fit cannot be cooked at all, no matter how good the chef. And the chef's speed is limited by how fast they can grab things from the bench, not by how fast they can chop.",
    },
    engineering: {
      title: "Fitting a 13B model on a 24 GB card",
      text: "A start-up wanted to run a 13-billion-parameter assistant on a single 24-gigabyte consumer GPU to keep costs down. In 16-bit the weights alone were 26 GB: it would not load. In 8-bit they were 13 GB, leaving about 9 GB for the KV cache and overhead. With their typical 2,000-token conversations that meant roughly 14 concurrent chats before admission control queued the rest. Moving to 4-bit weights (6.5 GB) doubled the cache space and the concurrency. The whole capacity plan came from memory arithmetic, before any benchmark was run.",
    },
    maths: {
      formula: "free for caches = total VRAM − weights − overhead;   decode step time ≥ bytes read per step ÷ memory bandwidth",
      meaning: "The first line is the capacity budget; the second is the speed floor. Both are set by the card's two headline numbers.",
      worked: [
        "A 24 GB card, 13B model in 8-bit (13 GB), 2 GB framework overhead: free for caches = 24 − 13 − 2 = 9 GB.",
        "Each decode step reads all 13 GB of weights. Bandwidth 1,000 GB/s: step time ≥ 13 ÷ 1000 = 13 ms, so at most ~77 tokens/s per request even with a perfect implementation.",
        "A data-centre card with 3,350 GB/s bandwidth: 13 ÷ 3350 = 3.9 ms, about 257 tokens/s ceiling. Bandwidth, not core count, set the speed.",
      ],
    },
    useIt: "Before choosing a model or a card, do the memory arithmetic: weights at the chosen precision plus the cache you need for your concurrency and context length, with a safety margin. Then do the bandwidth arithmetic for the speed ceiling. These two calculations prevent the two most common surprises in self-hosting: it does not load, and it is slower than the benchmark.",
    takeaways: ["GPU memory is fast and small; weights, caches and activations must all fit in it.", "Capacity decides which models and how many concurrent requests fit; bandwidth decides decode speed.", "Running out is a crash, not a slowdown.", "Do the memory and bandwidth arithmetic before buying anything."],
    terms: [["GPU memory (VRAM)", "the graphics card's own fast memory where the model runs"], ["memory bandwidth", "how many bytes per second can be read from GPU memory; the decode speed limit"], ["out-of-memory (OOM)", "the crash when GPU memory is exhausted"]],
    reflect: { q: "Two cards have the same memory size but one has three times the bandwidth. For a model that fits on both, which generates faster and by how much?", a: "The high-bandwidth card, by roughly three times per request at small batch sizes, because each decode step is limited by reading the weights. At large batches the gap narrows as arithmetic starts to matter." },
  },

  "m40-vram-requirements": {
    simple: "VRAM requirements are the memory a given model needs at a given precision plus room for its working data; the rule of thumb is bytes per parameter times parameters, then add a third.",
    concept:
      "The **VRAM requirement** of a model is the answer to 'will it fit, and with how much room to work?'. It has two parts. The fixed part is the weights: the number of parameters times the number of bytes used to store each one, which depends on the precision (2 bytes at 16-bit, 1 at 8-bit, half a byte at 4-bit). The variable part is everything that happens while serving: the KV cache for each live conversation, activations, and the framework's own buffers.\n\nA practical rule: take the weights' size and add 20 to 50% for working memory at modest concurrency and context lengths. Long contexts or many concurrent users push the variable part far above that, until the cache, not the weights, dominates.\n\nThe requirement is per process. A model that needs 90 GB will not run on a single 80 GB card without changes: quantise it, or split it across cards (later lessons).",
    why:
      "Choosing a model, a precision and a card is a single decision, and VRAM is the constraint that ties them together. Getting it wrong wastes weeks: a card that cannot load the model, or one that loads it with no room for conversations and crashes under the first real traffic. Knowing the requirement also tells you the cheapest hardware that works, which for a start-up can be the difference between a £1 and a £10 hourly bill.",
    how: [
      "Find the parameter count (the 'B' number) and the precision you intend to serve at.",
      "Weights bytes = parameters × bytes per parameter: 2 for FP16/BF16, 1 for 8-bit, 0.5 for 4-bit (plus a few percent for quantisation metadata).",
      "Estimate the KV cache: per-token size (from the model's layers and hidden size) × tokens per request × concurrent requests.",
      "Add framework overhead, typically 1 to 3 GB, and a 10% margin for fragmentation.",
      "Compare with the card's VRAM. If it does not fit, lower the precision, reduce context or concurrency, or split across cards.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "FP16 / BF16", "8-bit", "4-bit", "Fits a 24 GB card?", "Fits an 80 GB card?"],
        rows: [
          ["7B", "14 GB", "7 GB", "3.5 GB", "yes at 8-bit or 4-bit (FP16 is tight)", "yes, any precision"],
          ["13B", "26 GB", "13 GB", "6.5 GB", "8-bit or 4-bit", "yes"],
          ["34B", "68 GB", "34 GB", "17 GB", "4-bit only", "8-bit or 4-bit"],
          ["70B", "140 GB", "70 GB", "35 GB", "no", "4-bit, or split across cards"],
        ],
      },
      caption: "Weights only; add 20–50% for caches and overhead. The right-hand columns are why quantisation is everywhere.",
    },
    everyday: {
      title: "Packing a car for a trip",
      text: "The luggage is the weights: a fixed volume you know before you leave. The passengers' legroom, snacks and the dog are the working memory: they vary, and they fight the luggage for space. A car that is full of luggage before anyone gets in cannot make the trip, however powerful its engine. Vacuum bags are quantisation: the same clothes in less space.",
    },
    engineering: {
      title: "A hospital's on-premises clinical assistant",
      text: "A hospital could not send patient notes to a cloud API and had one server with two 48 GB cards. The team wanted a 70B model for quality. FP16 weights (140 GB) were impossible; 8-bit (70 GB) would not fit on one card; 4-bit (35 GB) fitted on one card with 13 GB left, but their 8,000-token clinical summaries needed a large cache. They used 4-bit weights split across both cards with tensor parallelism, leaving about 60 GB for caches: enough for twelve concurrent clinicians at full context. The VRAM table made the decision before a single benchmark.",
    },
    maths: {
      formula: "weights (GB) = parameters (billions) × bytes per parameter;   total ≈ weights + KV cache + overhead",
      meaning: "Billions of parameters times bytes each gives gigabytes directly. The cache and overhead are added on top.",
      worked: [
        "A 13B model at 8-bit: 13 × 1 = 13 GB of weights.",
        "KV cache per token for this model is about 0.8 MB (from its 40 layers and 5,120 hidden size; the next lesson shows the formula). Twenty concurrent 2,000-token chats: 0.8 MB × 2,000 × 20 = 32,000 MB = 32 GB.",
        "Total ≈ 13 + 32 + 2 (overhead) = 47 GB. The 24 GB card that 'fits the model' cannot serve twenty chats; it serves about seven.",
        "At 4-bit weights (6.5 GB) with the same cache budget of 15.5 GB: 15.5 GB ÷ (0.8 MB × 2,000) ≈ 9–10 concurrent chats.",
      ],
      note: "The cache, not the weights, often sets concurrency. Quantising the cache itself (8-bit KV) is a further lever.",
    },
    useIt: "Compute the VRAM requirement for each candidate model, precision and expected load before provisioning, and keep the calculation in the deployment docs so the next person can redo it when context lengths or traffic change. It is the fastest way to answer 'can we run model X on card Y?' without a trial.",
    takeaways: ["Weights = parameters × bytes per parameter; precision sets the bytes.", "Add the KV cache (which scales with concurrency × context) and overhead; the cache often dominates.", "If it does not fit: lower precision, less context or concurrency, or split across cards.", "Do the arithmetic before buying or renting."],
    terms: [["VRAM requirement", "the GPU memory a model needs at a given precision and load"], ["precision", "how many bits store each parameter: 16, 8 or 4"], ["bytes per parameter", "2 at 16-bit, 1 at 8-bit, 0.5 at 4-bit"]],
    reflect: { q: "A 7B model fits a 16 GB card in FP16 with 2 GB to spare. Is that a usable serving setup?", a: "Only for one or two short conversations at a time. Two gigabytes of cache space runs out quickly; the first long prompt or handful of concurrent users will queue or crash it. Serve it at 8-bit to free 7 GB for caches." },
  },

  "m40-model-memory-calculations": {
    simple: "Model memory calculations turn a model's size numbers into gigabytes for weights and for each token of cache, so you can plan hardware with arithmetic instead of trial and error.",
    concept:
      "The **model memory calculation** has two formulas worth knowing by heart. The weights: parameters times bytes per parameter. The KV cache per token: 2 (keys and values) × layers × hidden size × bytes per value. Multiply the second by the number of tokens across all live requests and you have the cache budget.\n\nHidden size is the width of the vectors inside the model; layers is how many transformer blocks it stacks. Both are published with every model. Many modern models share key-value heads between query heads (grouped-query attention), which shrinks the cache by the ratio of query heads to key-value heads; the formula then uses the key-value heads' total width instead of the full hidden size.\n\nWith these two formulas you can answer, for any model and card, how many concurrent conversations of a given length will fit, which is the question every capacity plan comes down to.",
    why:
      "Guessing memory by trial is slow and dangerous: an out-of-memory crash in production is an outage, and a card bought on a guess may be twice what you needed or half. The formulas take a minute and are accurate within about ten percent, which is enough to size hardware, choose precision, and set the admission limit on concurrent requests. They also reveal why long-context features are expensive: the cache grows with every token, for every user, and it is the part that scales.",
    how: [
      "Read the model card: parameters, layers (L), hidden size (d), number of attention heads and key-value heads.",
      "Weights bytes = parameters × bytes per parameter for the serving precision.",
      "KV cache bytes per token = 2 × L × d_kv × bytes per value, where d_kv = d × (kv heads ÷ query heads); for models without grouped-query attention, d_kv = d.",
      "Cache budget = card VRAM − weights − overhead. Concurrent tokens that fit = budget ÷ bytes per token.",
      "Concurrent requests = concurrent tokens ÷ typical tokens per request (prompt + output). Set the admission limit a little below this.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Weights", detail: "parameters × bytes per parameter" },
        { label: "Cache per token", detail: "2 × layers × d_kv × bytes per value" },
        { label: "Cache budget", detail: "VRAM − weights − overhead" },
        { label: "Tokens that fit", detail: "budget ÷ cache per token" },
        { label: "Concurrent requests", detail: "tokens that fit ÷ tokens per request" },
      ],
      caption: "Five lines of arithmetic from a model card to an admission limit.",
    },
    everyday: {
      title: "Planning a car park",
      text: "You know the size of the plot (VRAM), the space the office building takes (weights), and the size of a parking bay (cache per token). The number of cars that fit is what is left divided by a bay, and the number of visitors is that divided by cars per visitor. Nobody builds a car park by letting cars in until one cannot fit; they do the division first.",
    },
    engineering: {
      title: "Sizing a multi-tenant document assistant",
      text: "A SaaS company serving legal firms needed to promise each tenant a number of concurrent users at 16,000-token context. Using the formulas for their 8B model with grouped-query attention (32 layers, hidden 4,096, 8 KV heads out of 32), the cache per token came to 2 × 32 × 1,024 × 2 bytes = 131 KB in FP16. A 16,000-token session is 2.1 GB of cache. On an 80 GB card with 16 GB of weights and 4 GB overhead, 60 GB of cache holds 28 such sessions. They sold capacity in blocks of 25 per card and never had an out-of-memory incident.",
    },
    maths: {
      formula: "KV bytes per token = 2 × L × d_kv × bytes;   d_kv = d × (kv heads ÷ query heads);   sessions per card = (VRAM − weights − overhead) ÷ (KV per token × tokens per session)",
      meaning: "Keys and values each take L × d_kv numbers per token; bytes per value is 2 in FP16, 1 with an 8-bit cache. Grouped-query attention shrinks d_kv.",
      worked: [
        "Model: 8B parameters, L = 32, d = 4,096, 32 query heads, 8 KV heads, FP16 everywhere. d_kv = 4,096 × 8 ÷ 32 = 1,024.",
        "KV per token = 2 × 32 × 1,024 × 2 bytes = 131,072 bytes ≈ 128 KB.",
        "Weights = 8 × 2 = 16 GB. On an 80 GB card with 4 GB overhead: cache budget = 80 − 16 − 4 = 60 GB.",
        "Tokens that fit = 60 GB ÷ 128 KB ≈ 468,000 tokens. At 4,000 tokens per chat session: about 117 concurrent sessions; at 16,000: about 29.",
        "Without grouped-query attention (d_kv = 4,096) the cache per token would be 512 KB, four times larger, and only 29 sessions of 4,000 tokens would fit.",
      ],
    },
    code: {
      title: "A memory planner you can keep in the repo",
      lang: "py",
      src: `def plan(params_b, layers, hidden, q_heads, kv_heads, weight_bytes, cache_bytes, vram_gb, overhead_gb, tokens_per_session):
    weights_gb = params_b * weight_bytes
    d_kv = hidden * kv_heads / q_heads
    kv_per_token = 2 * layers * d_kv * cache_bytes          # bytes
    budget_bytes = (vram_gb - weights_gb - overhead_gb) * 1e9
    tokens_fit = budget_bytes / kv_per_token
    sessions = int(tokens_fit / tokens_per_session)
    return weights_gb, kv_per_token / 1024, sessions

w, kv_kb, s = plan(8, 32, 4096, 32, 8, 2, 2, 80, 4, 4000)
print(f"weights {w} GB, KV {kv_kb:.0f} KB/token, {s} concurrent sessions")`,
      lines: [
        { code: "weights_gb = params_b * weight_bytes", say: "Billions of parameters times bytes each gives gigabytes directly." },
        { code: "d_kv = hidden * kv_heads / q_heads", say: "Grouped-query attention: the cache width is the hidden size scaled by the share of heads that store keys and values." },
        { code: "kv_per_token = 2 * layers * d_kv * cache_bytes          # bytes", say: "Two tensors (K and V), one per layer, each d_kv numbers wide, each number cache_bytes long." },
        { code: "budget_bytes = (vram_gb - weights_gb - overhead_gb) * 1e9", say: "Whatever the weights and the framework leave is the cache budget." },
        { code: "sessions = int(tokens_fit / tokens_per_session)", say: "The admission limit: how many sessions of the typical length can be live at once." },
      ],
      output: "weights 16 GB, KV 128 KB/token, 117 concurrent sessions",
    },
    useIt: "Keep a planner like this next to the deployment config and rerun it whenever the model, precision, context length or expected concurrency changes. It gives the admission limit for the serving framework, the card choice, and the answer to product questions like 'can we offer 32k context?' in minutes.",
    takeaways: ["Weights: parameters × bytes. Cache per token: 2 × layers × d_kv × bytes.", "Grouped-query attention shrinks the cache by the KV-to-query head ratio.", "Sessions per card = cache budget ÷ (cache per token × tokens per session).", "Long context and high concurrency are cache problems, not weight problems."],
    terms: [["hidden size", "the width of the vectors inside each transformer layer"], ["grouped-query attention", "sharing key-value heads among query heads, shrinking the KV cache"], ["admission limit", "the maximum concurrent requests the server accepts before queueing"]],
    reflect: { q: "A product manager asks to raise the context limit from 8k to 32k tokens. What happens to the number of concurrent sessions per card?", a: "It drops by about four times, because each session's cache is four times larger and the weights still take their fixed share. Either the fleet grows, the cache is quantised, or the limit is raised only for a paid tier." },
  },

  "m40-quantisation": {
    simple: "Quantisation stores a model's numbers with fewer bits, so the model takes less memory and runs faster, at a small and measurable cost in quality.",
    concept:
      "A trained model is billions of decimal numbers, each usually stored in 16 bits. **Quantisation** rewrites those numbers using fewer bits, typically 8 or 4, by mapping each value onto a coarser grid. The model stays the same shape; each number is simply held less precisely.\n\nThe gain is direct. Memory shrinks in proportion: half at 8-bit, a quarter at 4-bit. And because each decode step reads every weight, reading fewer bytes makes the step faster on bandwidth-bound hardware, often nearly in proportion. The cost is a small error on each number, which accumulates into slightly worse predictions. Good quantisation methods keep that loss tiny by choosing the grid per group of weights and by protecting the few values that matter most.\n\nQuantisation can apply to weights only, to weights and activations, or to the KV cache. Weight-only is the common choice for serving language models.",
    why:
      "Memory is the binding constraint in inference, and quantisation is the cheapest way to loosen it. It lets a 70-billion-parameter model run on hardware it would not otherwise fit, lets a 13B model serve twice the concurrent users on the same card, and cuts the time per token on bandwidth-bound hardware. For many teams it is the difference between running the model they want and running a smaller one. The trade is a quality loss that is usually a fraction of the gap between model sizes, so a quantised large model beats a full-precision small one.",
    how: [
      "Take a block of weights, say 128 values, and find their range: the smallest and largest.",
      "Choose a scale so that the range maps onto the integers the bit width allows: 256 levels for 8-bit, 16 for 4-bit.",
      "Replace each weight with the nearest integer level; store the integers plus the block's scale (and sometimes an offset).",
      "At inference, multiply each integer by its block's scale to recover an approximate weight, on the fly, inside the matrix multiply.",
      "Measure the quality loss on an evaluation set and compare with the full-precision model; keep the most sensitive layers at higher precision if the loss is too high.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Full precision (16-bit)", points: ["65,536 possible values per number", "2 bytes per parameter", "the reference quality", "13B model: 26 GB"] },
      right: { title: "Quantised (4-bit, grouped)", points: ["16 levels per number, scale per 128-weight block", "about 0.56 bytes per parameter with metadata", "typically within a percent or two on benchmarks", "13B model: about 7.3 GB"] },
      caption: "Same model, a quarter of the memory. The scale per block is what keeps the error small.",
    },
    everyday: {
      title: "A photo at lower quality",
      text: "A JPEG at 80% quality is a quarter of the size of the original and almost nobody can tell the difference; at 20% the blocks show. Quantisation is the same bargain for a model's numbers: drop detail nobody can see, keep the detail that matters, and watch for the point where the artefacts become visible.",
    },
    engineering: {
      title: "Serving a 70B model on one card",
      text: "An e-commerce company wanted a 70B model for product Q&A but had single 80 GB cards. FP16 weights needed 140 GB. 4-bit quantisation brought them to 36 GB, leaving over 40 GB for caches. Their evaluation set of 500 product questions scored 91.2% graded correct at full precision (measured on a rented multi-card box) and 90.4% at 4-bit. The 0.8-point loss was far smaller than the 7-point gap to the 13B model they would otherwise have used. They shipped the quantised 70B on one card.",
    },
    maths: {
      formula: "scale = (max − min) ÷ (2ᵇ − 1);   q = round((w − min) ÷ scale);   ŵ = q × scale + min",
      meaning: "For a block with b bits, the range is cut into 2ᵇ − 1 steps of size scale; each weight becomes its step number q; dequantising recovers an approximation ŵ.",
      worked: [
        "A block of weights ranges from −0.30 to +0.45. At 4 bits there are 15 steps: scale = 0.75 ÷ 15 = 0.05.",
        "A weight of 0.12: q = round((0.12 + 0.30) ÷ 0.05) = round(8.4) = 8. Stored as the 4-bit integer 8.",
        "Dequantised: ŵ = 8 × 0.05 − 0.30 = 0.10. Error 0.02, within half a step.",
        "Memory for the block of 128 weights: 128 × 4 bits = 64 bytes, plus 2 bytes for the scale and 2 for the minimum: 68 bytes, against 256 bytes in FP16. A 3.8× saving.",
      ],
    },
    code: {
      title: "Quantise and dequantise one block",
      lang: "py",
      src: `import numpy as np

def quantise(block, bits=4):
    lo, hi = block.min(), block.max()
    levels = 2 ** bits - 1
    scale = (hi - lo) / levels
    q = np.round((block - lo) / scale).astype(np.uint8)
    return q, scale, lo

def dequantise(q, scale, lo):
    return q * scale + lo

w = np.array([-0.30, 0.12, 0.45, 0.01, -0.07])
q, scale, lo = quantise(w)
print(q)                              # [ 0  8 15  6  5]
print(np.round(dequantise(q, scale, lo), 3))   # [-0.3   0.1   0.45  0.    -0.05]`,
      lines: [
        { code: "scale = (hi - lo) / levels", say: "One step size for the whole block, chosen from its own range." },
        { code: "q = np.round((block - lo) / scale).astype(np.uint8)", say: "Each weight becomes its nearest step number; a small integer is all that is stored." },
        { code: "return q * scale + lo", say: "Recovering the weight is one multiply and one add; this runs inside the matrix multiply at inference." },
        { code: "print(np.round(dequantise(q, scale, lo), 3))   # [-0.3   0.1   0.45  0.    -0.05]", say: "The recovered weights are close, not exact. The error is at most half a step." },
      ],
      output: "[ 0  8 15  6  5]\n[-0.3   0.1   0.45  0.   -0.05]",
    },
    useIt: "Quantise whenever memory or bandwidth binds, which is nearly always when self-hosting. Start with 8-bit for near-lossless savings, go to 4-bit when memory demands it, and always measure quality on your own evaluation set rather than trusting a benchmark. Keep the precision in the model's version name so traces can tell which one answered.",
    takeaways: ["Quantisation stores weights with fewer bits: half the memory at 8-bit, a quarter at 4-bit.", "Per-block scales keep the error small; sensitive layers can stay at higher precision.", "A quantised large model usually beats a full-precision small one.", "Measure the quality loss on your own evaluation set, every time."],
    terms: [["quantisation", "storing model numbers with fewer bits"], ["scale", "the step size that maps integers back to real values in a block"], ["weight-only quantisation", "compressing the weights while computing activations at higher precision"]],
    reflect: { q: "Why quantise in blocks of 128 weights instead of one scale for the whole layer?", a: "One outlier weight in a layer would stretch the range and make the steps too coarse for everything else. Small blocks give each group its own range, so steps stay fine and the error stays low; the extra metadata is a few percent of memory." },
  },

  "m40-8-bit-quantisation": {
    simple: "8-bit quantisation halves a model's memory with almost no measurable quality loss, which makes it the default first step when serving.",
    concept:
      "**8-bit quantisation** stores each weight as an integer from 0 to 255 (or −128 to 127) with a scale per block or per channel. With 256 levels per block, the rounding error is tiny, about a quarter of a percent of the block's range, and in practice benchmark scores match 16-bit within noise for almost every model.\n\nTwo flavours exist. Weight-only INT8 keeps the arithmetic in 16-bit and only shrinks storage; it is the simplest and the usual choice for language models. Full INT8 also quantises the activations flowing through, so the hardware can use fast integer multiply units; it needs calibration data and care with outlier activations, and gives speed gains on hardware with INT8 tensor cores.\n\nThe effect is memory halved, bandwidth per token halved, and a model that behaves like the original.",
    why:
      "Half the memory with no quality cost is the best deal in inference. It lets a 13B model fit comfortably on a 24 GB card with room for conversations, doubles the concurrent sessions on any card compared with 16-bit, and on bandwidth-bound hardware speeds up each token. Because the loss is negligible, there is rarely a reason to serve a language model at 16-bit in production once 8-bit is available for it.",
    how: [
      "Choose weight-only or full INT8 depending on the hardware and the serving framework.",
      "For weight-only: quantise each block of weights to 8-bit integers with a scale; store integers and scales.",
      "For full INT8: run calibration prompts through the model to measure activation ranges per layer; pick scales for activations too; protect outlier channels at higher precision.",
      "At inference, dequantise weights on the fly (weight-only), or multiply integers directly on INT8 units (full).",
      "Evaluate against the 16-bit model on your task set and confirm the difference is within noise before shipping.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["", "16-bit", "8-bit weight-only", "8-bit full (W8A8)"],
        rows: [
          ["weights memory", "1×", "0.5×", "0.5×"],
          ["decode speed (bandwidth-bound)", "1×", "~1.6–1.9×", "~1.6–1.9×"],
          ["compute speed (large batch)", "1×", "~1×", "up to 2× on INT8 hardware"],
          ["quality loss", "none", "negligible", "small; needs calibration"],
          ["setup", "none", "minutes", "calibration run"],
        ],
      },
      caption: "Weight-only 8-bit is the near-free win; full INT8 adds compute speed at large batches for extra work.",
    },
    everyday: {
      title: "Measuring in millimetres instead of micrometres",
      text: "A carpenter cutting shelves to the nearest millimetre produces shelves indistinguishable from ones cut to the micrometre, using a cheaper ruler and faster. 8-bit quantisation is the millimetre ruler: 256 gradations per block are more precision than the model's predictions can use.",
    },
    engineering: {
      title: "Doubling concurrency without touching the model",
      text: "A customer-service platform ran a 13B model in 16-bit on 48 GB cards: 26 GB of weights, about 18 GB for caches, roughly 25 concurrent chats per card. Switching to 8-bit weight-only took an afternoon: 13 GB of weights, 31 GB for caches, 55 concurrent chats per card. Their regression suite of 1,200 graded conversations scored 88.1% before and 88.0% after. They halved the fleet and kept the quality.",
    },
    maths: {
      formula: "max rounding error = scale ÷ 2 = (max − min) ÷ (2 × 255);   memory saved = parameters × 1 byte",
      meaning: "With 255 steps the worst-case error is one five-hundred-and-tenth of the block's range. Memory saved is one byte per parameter compared with 16-bit.",
      worked: [
        "A block with range 0.8: scale = 0.8 ÷ 255 = 0.0031; max error = 0.0016, about 0.2% of the range. At 4-bit the same block has scale 0.053 and max error 0.027, seventeen times larger.",
        "A 13B model: memory saved = 13 × 10⁹ × 1 byte = 13 GB; 26 GB becomes 13 GB.",
        "Decode on a 1,000 GB/s card: 26 GB per step = 26 ms minimum; 13 GB per step = 13 ms. Roughly 77 tokens/s ceiling instead of 38 for one request.",
      ],
    },
    useIt: "Use 8-bit as the default serving precision for language models: halve memory and bandwidth per token with no measurable loss, then decide whether 4-bit is needed for your memory budget. Use full INT8 when you run large batches on hardware with INT8 tensor cores and can afford a calibration step.",
    takeaways: ["8-bit halves memory and bandwidth per token with negligible quality loss.", "Weight-only INT8 is simple and the usual choice; full INT8 adds compute speed at large batches with calibration.", "It typically doubles concurrent sessions per card.", "Still evaluate on your own task set before shipping."],
    terms: [["INT8", "8-bit integer storage: 256 levels per block"], ["weight-only quantisation", "weights stored as integers, arithmetic still in 16-bit"], ["calibration", "running sample inputs to measure activation ranges before quantising them"]],
    reflect: { q: "If 8-bit is nearly free, why do providers still serve some models at 16-bit?", a: "Some hardware runs 16-bit matrix multiplies faster than mixed 8/16 paths at very large batches, a few models have outlier weights that quantise badly, and for the highest-stakes tasks teams keep the reference precision as a baseline to compare against." },
  },

  "m40-4-bit-quantisation": {
    simple: "4-bit quantisation cuts a model's memory to a quarter with a small, noticeable quality loss, and it is what makes very large models fit on ordinary hardware.",
    concept:
      "**4-bit quantisation** stores each weight as one of only 16 levels per block. That is coarse: the rounding error is about sixteen times the 8-bit error. To keep quality, 4-bit methods work harder than simple rounding. They use small blocks (32 to 128 weights) with their own scales; some find the grid that minimises the error on real activations rather than the raw weights (GPTQ, AWQ); some keep the most important weights, the ones that scale large activations, at higher precision.\n\nThe result is typically a loss of one to three points on benchmarks for 7B to 13B models and under one point for 70B models, which tolerate quantisation better. The gain is memory at a quarter of 16-bit: a 70B model in about 36 GB, a 13B in about 7.\n\n4-bit is where 'the model fits' decisions are made. Run on the hardware you have at 4-bit, or do not run at all.",
    why:
      "The most capable open-weight models do not fit on single cards at 8-bit, and renting multi-card machines multiplies cost. 4-bit brings a 70B model onto one 80 GB card and a 13B model onto a laptop. The quality loss is real but small compared with stepping down a model size, so 4-bit large beats 8-bit small for most tasks. It also roughly doubles decode speed over 8-bit on bandwidth-bound hardware, because half the bytes are read per step.",
    how: [
      "Pick a method: naive round-to-nearest for a quick test; GPTQ or AWQ for production, which calibrate the grid using sample activations.",
      "Run calibration: a few hundred representative prompts through the model to see which weights affect outputs most.",
      "Quantise block by block, choosing scales (and zero points) that minimise the output error, not just the weight error; optionally keep outlier channels at 8 or 16 bits.",
      "Store 4-bit integers packed two per byte, plus scales per block.",
      "Evaluate on your own task set against 8-bit and 16-bit; if the loss is too high, try a larger block size trade-off, a different method, or mixed precision for sensitive layers.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "16-bit score", "8-bit score", "4-bit score", "4-bit memory"],
        rows: [
          ["7B", "71.0", "70.9", "68.8", "~3.9 GB"],
          ["13B", "76.5", "76.4", "75.1", "~7.3 GB"],
          ["70B", "84.2", "84.2", "83.6", "~38 GB"],
          ["for comparison: 13B at 16-bit", "76.5", "", "", "26 GB"],
        ],
      },
      caption: "Illustrative benchmark scores. Note the last row: a 70B model at 4-bit (83.6) beats a 13B at 16-bit (76.5) in less than twice the memory.",
    },
    everyday: {
      title: "A paperback instead of the hardback",
      text: "The paperback has the same words, thinner paper, smaller type, and fits in a coat pocket. A few footnotes got dropped and the maps are harder to read, but it is the book, and you can carry three of them where one hardback fit. 4-bit is the paperback edition of a model.",
    },
    engineering: {
      title: "A 70B assistant on a single card for a bank's internal tools",
      text: "A bank's internal knowledge assistant had to run on-premises. Their test set of 800 policy questions scored 89% with a 70B model at 16-bit on a rented eight-card machine, 81% with a 13B model at 16-bit on one card, and 88% with the 70B model at 4-bit (AWQ) on one 80 GB card. The 4-bit 70B kept almost all the quality at one-eighth of the hardware. They checked the loss was not concentrated in one category (it was spread evenly) and shipped it, with the 16-bit version kept as a quarterly reference.",
    },
    maths: {
      formula: "levels = 2⁴ = 16;   max error per weight = (max − min) ÷ 30;   memory ≈ parameters × 0.5 byte + scales",
      meaning: "Sixteen levels means fifteen steps across each block's range; the worst-case error is half a step. Packing two 4-bit values per byte gives half a byte per parameter, plus a few percent for scales.",
      worked: [
        "Block range 0.8: step = 0.8 ÷ 15 = 0.053; worst error = 0.027. At 8-bit the worst error was 0.0016; sixteen times finer.",
        "A 70B model: 70 × 10⁹ × 0.5 byte = 35 GB; plus scales for blocks of 128 (2 bytes per 64 bytes, ~3%): about 36 GB. Fits one 80 GB card with 40+ GB for caches.",
        "Decode on a 3,350 GB/s card: 36 GB per step ≈ 10.7 ms, around 93 tokens/s ceiling, versus 21 ms and ~47 tokens/s at 8-bit.",
      ],
    },
    useIt: "Use 4-bit when a larger model will not otherwise fit, when you need to serve on consumer or laptop hardware, or when decode speed on bandwidth-bound cards matters more than the last point of quality. Prefer calibrated methods (AWQ, GPTQ) over naive rounding, and measure the loss per task category, because it is not always even.",
    takeaways: ["4-bit stores 16 levels per block: a quarter of 16-bit memory, with a small but real quality loss.", "Calibrated methods (GPTQ, AWQ) and small blocks keep the loss near one to three points; large models lose less.", "A 4-bit large model usually beats a 16-bit smaller one.", "Measure on your own tasks, per category, before shipping."],
    terms: [["4-bit quantisation", "16 levels per weight; roughly half a byte per parameter"], ["GPTQ / AWQ", "calibrated 4-bit methods that minimise output error, not just weight error"], ["mixed precision", "keeping sensitive layers or channels at higher precision than the rest"]],
    reflect: { q: "Why do 70B models tolerate 4-bit better than 7B models?", a: "Large models have more redundancy: many weights can be nudged without changing the function much. Small models use their capacity more fully, so coarse rounding damages more of what they know." },
  },

  "m40-fp16-bf16-and-fp32": {
    simple: "FP32, FP16 and BF16 are three ways to store a decimal number in 32 or 16 bits; the 16-bit formats halve memory, and BF16 keeps FP32's range so training and inference stay stable.",
    concept:
      "Computers store decimals in floating point: a sign, an exponent that sets the magnitude, and a mantissa that sets the precision. **FP32** uses 32 bits: 8 for the exponent and 23 for the mantissa, giving a huge range and about seven significant digits. It is the reference format and the one models were historically trained in.\n\n**FP16** uses 16 bits: 5 exponent bits, 10 mantissa bits. Half the memory, about three significant digits, but a small range: values above 65,504 overflow to infinity and very small values flush to zero, which can break training and occasionally inference.\n\n**BF16** (brain float) also uses 16 bits but keeps FP32's 8 exponent bits and spends only 7 on the mantissa. It has FP32's range with far less precision. For neural networks, range matters more than the last digits, so BF16 is the standard for training and the usual serving format on hardware that supports it.",
    why:
      "Memory and bandwidth scale with bytes per number, so 16-bit formats halve both compared with FP32 for free, and modern GPUs run 16-bit matrix multiplies several times faster than 32-bit. But halving bits can overflow or underflow in the wrong format: FP16 training famously produced infinities in gradients until loss scaling was invented. BF16 removed that class of problem by keeping the range, which is why nearly all large models are trained and published in it. Knowing the three formats explains the file sizes, the speed differences, and the occasional NaN.",
    how: [
      "A floating-point number is (−1)^sign × 1.mantissa × 2^(exponent − bias).",
      "More exponent bits: larger and smaller magnitudes can be represented (range). More mantissa bits: finer steps between representable values (precision).",
      "FP32: 8 exponent, 23 mantissa. FP16: 5 exponent, 10 mantissa. BF16: 8 exponent, 7 mantissa.",
      "Converting FP32 to BF16 keeps the top 16 bits, essentially truncating the mantissa: trivial and safe for range. Converting to FP16 must check for overflow.",
      "Hardware tensor cores take 16-bit inputs and accumulate sums in FP32 internally, so the precision loss during a long dot product stays small.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Format", "Bits", "Exponent bits", "Mantissa bits", "Largest value", "Significant digits", "Used for"],
        rows: [
          ["FP32", "32", "8", "23", "3.4 × 10³⁸", "~7", "reference, accumulators, small models"],
          ["FP16", "16", "5", "10", "65,504", "~3", "inference on older GPUs; training with loss scaling"],
          ["BF16", "16", "8", "7", "3.4 × 10³⁸", "~2", "training and serving on modern GPUs"],
        ],
      },
      caption: "BF16 trades precision for range. Networks care about range.",
    },
    everyday: {
      title: "Scientific notation on two calculators",
      text: "One calculator shows ten digits but cannot display anything above 65,000. The other shows only three digits but handles numbers up to 10³⁸. For a physics problem with enormous and tiny quantities, the three-digit calculator is the one that never errors out. Neural networks are that physics problem: activations and gradients span many orders of magnitude, and three digits is enough.",
    },
    engineering: {
      title: "The NaN that only appeared on the old GPUs",
      text: "A speech-recognition team served a model in BF16 on data-centre GPUs. To cut costs they moved a copy to older cards without BF16 support, converting to FP16. A fraction of long audio files started returning empty transcripts: an intermediate activation exceeded 65,504, became infinity, and the softmax turned to NaN. The fix was to keep that one layer in FP32 on the old cards (mixed precision), costing a few percent of speed. The model had been fine for months; the format change, not the model, caused the bug.",
    },
    maths: {
      formula: "value = (−1)^s × (1 + mantissa ÷ 2^m) × 2^(exponent − bias);   bias = 2^(e−1) − 1",
      meaning: "e exponent bits and m mantissa bits. The largest finite value is about 2^(bias+1); the step between neighbouring values near 1 is 2^(−m).",
      worked: [
        "FP16: e = 5, bias = 15. Largest exponent field 30 (31 is reserved): value ≈ 2^(30−15) × (2 − 2^−10) = 65,504. Step near 1.0 = 2^−10 ≈ 0.001.",
        "BF16: e = 8, bias = 127, like FP32. Largest ≈ 2^128 ≈ 3.4 × 10³⁸. Step near 1.0 = 2^−7 ≈ 0.008.",
        "The number 70,000 in FP16: overflow → infinity. In BF16: representable as roughly 69,632 (nearest value with 7 mantissa bits). Range kept, precision lost, no infinity.",
        "Memory for a 7B model: FP32 = 28 GB; FP16 or BF16 = 14 GB. Same halving either way; the choice between the two is about range, not size.",
      ],
    },
    code: {
      title: "Seeing the formats behave",
      lang: "py",
      src: `import torch

x = torch.tensor([70000.0, 1.0009765625, 3.14159])
print(x.to(torch.float16))     # tensor([   inf, 1.0010, 3.1406], dtype=torch.float16)
print(x.to(torch.bfloat16))    # tensor([69632.0000, 1.0000, 3.1406], dtype=torch.bfloat16)

w = torch.randn(4096, 4096)
print(w.element_size() * w.numel() / 1e6, "MB in FP32")
print(w.to(torch.bfloat16).element_size() * w.numel() / 1e6, "MB in BF16")`,
      lines: [
        { code: "print(x.to(torch.float16))     # tensor([   inf, 1.0010, 3.1406], dtype=torch.float16)", say: "70,000 overflows FP16 to infinity; 1.00098 is kept to three digits." },
        { code: "print(x.to(torch.bfloat16))    # tensor([69632.0000, 1.0000, 3.1406], dtype=torch.bfloat16)", say: "BF16 keeps 70,000 as 69,632 (coarse but finite) and rounds 1.00098 to 1.0: range over precision." },
        { code: "print(w.to(torch.bfloat16).element_size() * w.numel() / 1e6, \"MB in BF16\")", say: "The same 16.7-million-weight matrix is 67 MB in FP32 and 33.5 MB in BF16." },
      ],
      output: "tensor([   inf, 1.0010, 3.1406], dtype=torch.float16)\ntensor([69632.0000, 1.0000, 3.1406], dtype=torch.bfloat16)\n67.108864 MB in FP32\n33.554432 MB in BF16",
    },
    useIt: "Serve in BF16 on hardware that supports it; use FP16 on older cards with care for overflow, and keep FP32 for accumulators, layer norms and anything that produces NaNs. When a model file is 'twice the size you expected', it is FP32; when a quantisation claims '4-bit from FP16', the baseline is 2 bytes per parameter.",
    takeaways: ["FP32: 32 bits, the reference. FP16 and BF16: 16 bits, half the memory.", "FP16 has fine precision but a small range (max 65,504); BF16 has FP32's range with coarse precision.", "Networks need range more than precision, so BF16 is the standard for training and serving.", "Mixed precision keeps sensitive operations in FP32."],
    terms: [["floating point", "a number stored as sign, exponent and mantissa"], ["exponent bits", "set the range of magnitudes a format can hold"], ["mantissa bits", "set the precision between neighbouring values"], ["mixed precision", "16-bit for most operations, FP32 where range or accumulation needs it"]],
    reflect: { q: "Why do GPUs accumulate dot products in FP32 even when the inputs are BF16?", a: "A dot product over 4,096 terms adds thousands of small products; in a 7-bit mantissa the rounding error would pile up and swamp the result. Accumulating in FP32 keeps the sum accurate, then the output is rounded once." },
  },

  "m40-kv-cache": {
    simple: "The KV cache stores the attention keys and values of every token already processed, so generating each new token does not recompute the whole prompt; it costs memory per token and is what limits concurrent conversations.",
    concept:
      "Attention lets each new token look at every earlier token through keys and values computed from them (Module 15). Without a cache, producing token 500 would recompute keys and values for all 499 earlier tokens, then token 501 would do it again: quadratic waste. The **KV cache** keeps every layer's keys and values for every processed token in GPU memory, so each decode step computes only the new token's keys and values and reads the rest.\n\nThe price is memory that grows linearly with the number of tokens in every live request: 2 × layers × d_kv × bytes per token (Module 40, memory calculations). For a long conversation on a large model that is gigabytes, and with dozens of users it dwarfs the weights.\n\nModern serving frameworks manage this cache in fixed-size pages so that memory is not wasted on sequences that end early, can share the cache of a common prefix (the same system prompt) across requests, and can quantise the cache to 8-bit to halve it.",
    why:
      "The cache makes generation fast: with it each step is proportional to the sequence length; without it each step is proportional to the square. But it turns long context and high concurrency into memory problems, and naive allocation (reserving the maximum length for every request) wastes most of the memory on space never used. Paged caches, prefix sharing and cache quantisation exist because the cache, not the weights, is what a busy server runs out of.",
    how: [
      "During prefill, the model computes keys and values for every prompt token at every layer and stores them.",
      "Each decode step computes the new token's query, keys and values; the query attends over the stored keys and values plus the new one; the new keys and values are appended.",
      "A paged allocator hands out fixed-size blocks (say 16 tokens each) as a sequence grows, so memory is used only for tokens that exist.",
      "Requests sharing an identical prefix (the system prompt, a shared document) point at the same cache blocks instead of recomputing or copying them.",
      "When a request finishes, its blocks return to the pool; when the pool is empty, new requests queue.",
      "Optionally the cache is stored in 8-bit, halving its size at a small quality cost.",
    ],
    visual: {
      kind: "flow",
      steps: ["prefill: compute K,V for all prompt tokens → store", "decode step: new token's K,V → append", "attention reads all stored K,V", "paged blocks allocated as the sequence grows", "shared prefix blocks reused across requests", "blocks freed when the request ends"],
      caption: "The cache turns a quadratic recomputation into a linear read, and the allocator turns a fixed reservation into pay-as-you-grow.",
    },
    everyday: {
      title: "Notes during a long meeting",
      text: "Without notes you would have to re-listen to the whole recording before responding to each new point. With notes you glance over what was said and respond. The notes pile grows with the meeting; a room full of simultaneous meetings needs a lot of paper. Sharing the agenda page between meetings that have the same agenda saves paper. That pile of notes is the KV cache.",
    },
    engineering: {
      title: "Prefix sharing cuts memory and TTFT for a support assistant",
      text: "A support assistant sent a 3,500-token system prompt with every request. On a server with 80 concurrent chats, those identical prefixes occupied 80 copies of 3,500 tokens of cache, over 35 GB on their 13B model, and prefill recomputed them 80 times. Enabling prefix caching in the serving framework made all 80 share one copy: cache usage fell by 30 GB, time to first token dropped from 1.9 s to 0.5 s because the prefix was already computed, and the same card served 140 chats. The prompt had not changed; only how it was cached.",
    },
    maths: {
      formula: "cache bytes per request = 2 × L × d_kv × bytes × tokens;   without a cache, decode cost ∝ n² ; with it ∝ n",
      meaning: "Memory grows linearly with tokens per request; compute per step grows linearly instead of quadratically over the sequence.",
      worked: [
        "A 13B model: L = 40, d_kv = 5,120 (no grouped-query attention), FP16. Per token = 2 × 40 × 5,120 × 2 = 819,200 bytes ≈ 0.8 MB.",
        "A 4,000-token conversation: 0.8 MB × 4,000 = 3.2 GB per request. Fifty concurrent: 160 GB. More than the weights of the model, which are 26 GB.",
        "With an 8-bit cache: 0.4 MB per token, 1.6 GB per request, 80 GB for fifty concurrent.",
        "With a 3,500-token shared prefix across 50 requests: without sharing 50 × 3,500 × 0.8 MB = 140 GB for prefixes alone; with sharing, 2.8 GB. The rest of each request's cache is only its own turns.",
      ],
    },
    useIt: "Turn on paged attention and prefix caching in your serving framework, put the stable part of every prompt first so prefixes match, and consider an 8-bit cache when concurrency is memory-bound. When planning capacity, budget the cache from the formula; it is usually what decides how many users fit, not the weights.",
    takeaways: ["The KV cache stores every processed token's keys and values so each step only computes the new token.", "It costs 2 × layers × d_kv × bytes per token and grows with every live request's length.", "Paged allocation, prefix sharing and 8-bit caches are how servers keep it affordable.", "Put the unchanging part of the prompt first so prefixes can be shared."],
    terms: [["KV cache", "stored attention keys and values for processed tokens"], ["paged attention", "allocating the cache in fixed blocks as sequences grow"], ["prefix caching", "sharing the cache of an identical prompt prefix across requests"]],
    reflect: { q: "Why does putting a timestamp at the start of a system prompt destroy prefix caching?", a: "Prefix sharing requires identical token sequences from the first token. A timestamp makes every request's prefix unique from the first few tokens, so nothing after it can be shared or reused. Put variable content after the stable instructions." },
  },

  "m40-batching": {
    simple: "Batching runs several requests through the model together so each read of the weights serves all of them, multiplying throughput for a small cost in each request's latency.",
    concept:
      "A decode step for one request reads every weight in the model to produce one token. The arithmetic for one token is tiny compared with the time spent reading those weights from memory. **Batching** puts many requests into the same step: the weights are read once and multiplied against a stack of inputs, producing one token for each request. The step takes only slightly longer than for one request, so the server's output multiplies.\n\nThe limit comes from two places. Arithmetic: at some batch size the multiplications themselves take longer than the memory read, and each extra request adds real time. Memory: every request in the batch needs its KV cache resident, so the batch is capped by the cache budget.\n\nBatching is why per-token prices from providers are low and why a self-hosted model at batch size one is ten to fifty times more expensive per token than it needs to be.",
    why:
      "GPUs are built for enormous parallel arithmetic; a single request's decode uses a fraction of a percent of it while the memory system works flat out. That is wasted hardware. Batching is the most direct way to recover it, and it is where most of the cost difference between a naive deployment and a good one comes from. It is also what lets a fixed fleet absorb a traffic spike: more requests per step, not more cards.",
    how: [
      "The server collects incoming requests into a group, either waiting a few milliseconds for more or taking whatever is ready.",
      "Prompts in the batch are padded or packed so they can be processed in one prefill pass.",
      "Each decode step reads the weights once and computes the next token for every sequence in the batch.",
      "Each request's output token is streamed back as it is produced; the batch continues until sequences finish.",
      "In static batching, the batch cannot change until all its sequences end; continuous batching (next lesson) fixes that.",
    ],
    visual: {
      kind: "compare",
      left: { title: "No batching (batch size 1)", points: ["Weights read once per token per request", "Decode step ≈ 28 ms, 36 tokens/s total", "GPU arithmetic units mostly idle", "£18 per million tokens on a £2.40/h card"] },
      right: { title: "Batch of 32", points: ["Weights read once per token for 32 requests", "Decode step ≈ 39 ms, 820 tokens/s total", "Arithmetic units busy; memory read amortised", "£0.81 per million tokens on the same card"] },
      caption: "The step is 40% slower; the output is 23 times greater.",
    },
    everyday: {
      title: "A school bus instead of one car per child",
      text: "Driving one child to school and coming back for the next takes the whole morning. A bus makes one trip with thirty children; each child's journey is a few minutes longer because of the stops, and the whole school arrives in a fraction of the time. The road trip is the memory read; the children are the requests.",
    },
    engineering: {
      title: "Absorbing a traffic spike without adding cards",
      text: "A news app's summarisation service ran at batch size 4 'to keep latency low'. During a breaking story requests rose eightfold and queues formed within minutes; p95 latency went from 1.2 s to 40 s. Raising the maximum batch to 48 let each decode step serve twelve times the requests; per-request TPOT rose from 30 ms to 45 ms, invisible to users, and the queue drained. They had been protecting a latency that nobody could perceive at the cost of capacity they urgently needed.",
    },
    maths: {
      formula: "step time ≈ max(weights bytes ÷ bandwidth, batch × FLOPs per token ÷ compute rate);   throughput = batch ÷ step time",
      meaning: "A step is bounded by the slower of two things: reading the weights (fixed) and doing the arithmetic (grows with the batch). While the memory read dominates, batching is nearly free.",
      worked: [
        "A 13B model in 8-bit: 13 GB of weights, card bandwidth 1,000 GB/s: memory time = 13 ms per step regardless of batch.",
        "Arithmetic: about 2 × 13 × 10⁹ = 26 GFLOPs per token. Card compute 300 TFLOP/s: 0.087 ms per token. At batch 32: 2.8 ms; at batch 128: 11 ms; at batch 160: 14 ms.",
        "So up to roughly batch 150 the step is memory-bound at ~13 ms and throughput rises linearly: batch 32 → 32 ÷ 0.013 ≈ 2,460 tokens/s (idealised); batch 128 → ~9,800.",
        "Beyond batch 150 the arithmetic dominates and each extra request adds its full 0.087 ms. The knee of the curve is where memory time equals compute time.",
      ],
      note: "Real servers hit the cache memory limit and scheduling overheads before the arithmetic knee; the illustrative table in the throughput lesson shows measured, not ideal, numbers.",
    },
    useIt: "Set the maximum batch size from a load test rather than fear of latency: users cannot feel a TPOT change from 30 to 45 ms, but they can feel a queue. Budget the KV cache so the target batch fits. For offline work (nightly classification, bulk summaries), batch as large as memory allows; nobody is waiting.",
    takeaways: ["Batching serves many requests per weight read, multiplying throughput at a small per-request latency cost.", "Below the arithmetic knee, extra requests are nearly free; the cache budget usually caps the batch first.", "Batch size is the main lever on cost per token and spike capacity.", "Pick it from a load test, not from latency anxiety."],
    terms: [["batching", "processing several requests in one forward pass"], ["memory-bound", "a step limited by reading bytes, not by arithmetic"], ["compute-bound", "a step limited by arithmetic; where batching stops being free"]],
    reflect: { q: "A team runs batch size 1 because 'our users need the lowest latency'. What is wrong with that reasoning?", a: "Batch size 1 gives the lowest TPOT only when the server is empty; the moment several users arrive, the others queue, and queueing adds far more latency than a batch would. Low per-step latency for one user is bought with terrible latency for everyone else." },
  },

  "m40-continuous-batching": {
    simple: "Continuous batching lets requests join and leave a running batch at every decode step, so the GPU never waits for the longest answer and new users start immediately.",
    concept:
      "Static batching has a flaw: once a batch starts, it runs until every sequence in it finishes. A batch of 32 where one answer is 800 tokens and the rest are 100 keeps 31 slots idle for 700 steps, and a request arriving one step after the batch began waits for the whole thing. **Continuous batching** (also called iteration-level scheduling) re-forms the batch at every decode step: finished sequences leave, waiting requests join, and the step runs on whoever is present.\n\nNew requests need a prefill pass before they can decode; the scheduler interleaves prefills with decode steps, or splits long prefills into chunks so they do not stall the running sequences. Paged KV caches make this possible, because a joining request only needs free blocks, not a pre-reserved slot.\n\nThe effect is a GPU that is always full and a time to first token that no longer depends on what other users are doing.",
    why:
      "Real traffic is ragged: answers vary from five tokens to a thousand, and requests arrive at random. Static batching turns that raggedness into idle slots and long waits, wasting a third or more of the hardware and making latency unpredictable. Continuous batching is the single feature that made open-weight serving competitive with provider APIs; the common serving frameworks (vLLM, TGI, TensorRT-LLM) all implement it, and turning it on typically doubles throughput at the same latency.",
    how: [
      "A scheduler holds a queue of waiting requests and a set of running sequences.",
      "Before each step it removes sequences that hit a stop token or length limit and frees their cache blocks.",
      "It admits waiting requests whose prompts fit in the free cache blocks, running their prefill (possibly chunked) in the same or an adjacent step.",
      "The decode step runs over all running sequences; each produces one token, streamed to its client.",
      "The loop repeats every step, so the batch composition changes continuously and the GPU stays busy.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Step", "Static batch (32 slots)", "Continuous batch"],
        rows: [
          ["0", "32 requests start", "32 requests start"],
          ["100", "20 finished, 12 running, 20 slots idle; 15 new requests waiting", "20 finished and left; 15 new admitted; 27 running"],
          ["400", "1 running (the 800-token answer), 31 slots idle; 60 waiting", "~30 running, queue drained"],
          ["800", "batch ends; 60 waiting requests finally start", "steady state since step ~120"],
        ],
      },
      caption: "The long answer holds a static batch hostage. Continuous batching never notices it.",
    },
    everyday: {
      title: "A bus route instead of a chartered coach",
      text: "A chartered coach leaves when full and returns only when every passenger has been dropped at their stop, including the one going to the far end; everyone else waits at the depot. A bus route keeps moving: people get off at their stops, people get on at the next, and the bus is always nearly full. Continuous batching is the bus route.",
    },
    engineering: {
      title: "Turning it on, and what changed",
      text: "A document-processing company served a 7B model with static batches of 16 and saw average GPU utilisation of 38%. Switching their serving framework to continuous batching with paged caches took a configuration change and a load test. Utilisation rose to 86%, throughput from 410 to 1,050 tokens per second on the same card, and p95 time to first token fell from 3.4 s to 0.6 s because new requests no longer waited for a batch to end. They reduced from six cards to three for the same traffic.",
    },
    maths: {
      formula: "static batch utilisation ≈ mean output length ÷ max output length in the batch;   wasted slots per step = batch − running sequences",
      meaning: "A static batch is only as efficient as its shortest answers are long relative to the longest. Continuous batching keeps running sequences near the batch size every step.",
      worked: [
        "A batch of 32 answers with lengths averaging 150 tokens and a maximum of 800: static utilisation ≈ 150 ÷ 800 = 19%. Four fifths of the slots idle on average.",
        "Total slot-steps available: 32 × 800 = 25,600. Useful: 32 × 150 = 4,800. Wasted: 20,800.",
        "With continuous batching, running sequences stay near 32 whenever the queue is non-empty: utilisation ≈ 95% (the remainder is prefill interleaving). Throughput ≈ 5× the static case at the same batch size.",
      ],
    },
    useIt: "Use a serving framework with continuous batching and paged attention for any interactive workload; it is the default in vLLM, TGI and TensorRT-LLM. Set the maximum running sequences from the cache budget, enable chunked prefill so long prompts do not stall decode, and watch two metrics: running sequences per step (should sit near the maximum under load) and queue wait (should stay near zero).",
    takeaways: ["Static batches run until the longest answer ends; slots go idle and newcomers wait.", "Continuous batching re-forms the batch every step: finished leave, waiting join.", "It needs paged caches and interleaved or chunked prefill.", "Typically doubles or triples throughput and makes TTFT independent of other users."],
    terms: [["continuous batching", "admitting and removing requests at every decode step"], ["chunked prefill", "splitting a long prompt's prefill across steps so it does not stall running sequences"], ["utilisation", "the share of the GPU's capacity doing useful work"]],
    reflect: { q: "With continuous batching, what still makes a new request wait?", a: "Free KV cache blocks. If every block is held by running sequences, the request queues until some finish. Capacity is now bounded by cache memory, which is why cache size, prefix sharing and cache quantisation matter so much." },
  },

  "m40-speculative-decoding": {
    simple: "Speculative decoding has a small, fast model guess several tokens ahead and the large model verify them in one pass, so the large model produces multiple tokens per step without changing what it would have said.",
    concept:
      "Each decode step of a large model costs a full read of its weights to produce one token, and most of those tokens are easy: the next word is obvious. **Speculative decoding** uses a small draft model to guess a run of, say, five tokens cheaply. The large model then runs one forward pass over the prompt plus the five guesses, which costs about the same as producing one token, and checks each guess against its own probabilities. Guesses that match are accepted in order; at the first mismatch the large model's own token is used instead and drafting restarts.\n\nThe result is identical in distribution to what the large model would have produced on its own: verification is exact, not approximate. Speed depends on the acceptance rate. If four of five guesses are typically right, each large-model step yields about four tokens instead of one.\n\nVariants draft with a few extra heads inside the same model, or with n-gram lookup from the prompt, avoiding a second model entirely.",
    why:
      "Decode is memory-bound: a step that produces one token reads all the weights, and reading them to verify five tokens costs almost the same. Speculative decoding exploits that waste to multiply tokens per read. It cuts per-request latency, which batching cannot do (batching helps throughput, not one user's TPOT), so it matters most for latency-sensitive single streams: code completion, voice assistants, agent loops where each step waits on the last.",
    how: [
      "The draft model, small and fast, generates k candidate tokens one at a time from the current sequence.",
      "The large model runs one forward pass over the sequence plus the k candidates, producing its probability for each position.",
      "For each candidate in order: accept it with probability min(1, p_large ÷ p_draft); on the first rejection, sample a corrected token from the large model's adjusted distribution and stop.",
      "Append the accepted tokens (plus one from the large model if all were accepted or one was corrected); stream them.",
      "Repeat. Tune k: longer drafts win when acceptance is high, lose when it is low.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Draft", detail: "small model proposes: 'the', 'capital', 'of', 'France', 'is'" },
        { label: "Verify", detail: "large model, one pass, checks all five" },
        { label: "Accept", detail: "'the', 'capital', 'of', 'France' match; 'is' rejected, large model says 'remains'" },
        { label: "Result", detail: "five tokens emitted for one large-model step" },
        { label: "Repeat", detail: "draft again from '…France remains'" },
      ],
      caption: "One expensive pass, several tokens out, and the text is exactly what the large model would have written.",
    },
    everyday: {
      title: "A junior drafting, a senior checking",
      text: "A senior lawyer could write every sentence of a contract, slowly. Instead a junior drafts a page, and the senior reads it in one sitting, ticking most sentences and rewriting the few that are wrong. The contract is the senior's work in every sentence that survived, and it was produced several times faster. The junior is the draft model.",
    },
    engineering: {
      title: "Halving code-completion latency",
      text: "An IDE company served a 34B code model; completions streamed at 22 tokens per second per user, which felt sluggish while typing. They added a 1B draft model from the same family with speculation length 5. Measured acceptance on real code was 78% per token; effective speed rose to 58 tokens per second per user, with outputs byte-identical to the unaccelerated model on their regression set. Throughput per card fell slightly because the draft model used some capacity, which was fine: the product was latency-bound, not throughput-bound.",
    },
    maths: {
      formula: "expected tokens per large step ≈ (1 − αᵏ⁺¹) ÷ (1 − α);   speed-up ≈ that ÷ (1 + k × c), where α = acceptance rate, k = draft length, c = draft cost relative to the large model",
      meaning: "With acceptance α per token, the expected accepted run length follows a geometric sum. The draft's own cost (k small steps) is subtracted from the gain.",
      worked: [
        "α = 0.8, k = 5: expected tokens per step = (1 − 0.8⁶) ÷ (1 − 0.8) = (1 − 0.262) ÷ 0.2 = 3.69.",
        "Draft model is 1/30 the size, c ≈ 0.033: overhead factor = 1 + 5 × 0.033 = 1.17. Speed-up ≈ 3.69 ÷ 1.17 ≈ 3.2×.",
        "α = 0.5, k = 5: expected tokens = (1 − 0.5⁶) ÷ 0.5 = 1.97; speed-up ≈ 1.97 ÷ 1.17 ≈ 1.7×.",
        "α = 0.3: expected tokens = (1 − 0.3⁶) ÷ 0.7 = 1.43; speed-up ≈ 1.2×. Below about 0.3 the draft stops paying for itself. Acceptance depends on how predictable the text is: code and formal prose are high, creative writing is low.",
      ],
    },
    useIt: "Use speculative decoding when single-stream latency matters: code assistants, voice, agents, interactive tools. Choose a draft from the same model family with the same tokeniser, measure acceptance on your real traffic, and tune the draft length. Skip it for throughput-bound batch workloads, where the GPU is already busy and the draft's cost is pure overhead.",
    takeaways: ["A small model drafts several tokens; the large model verifies them in one pass.", "The output distribution is unchanged; only speed changes.", "Gain depends on acceptance rate: high for predictable text, low for creative text.", "It cuts per-request latency, not throughput; use it where one user is waiting."],
    terms: [["speculative decoding", "draft tokens with a small model, verify with the large one"], ["draft model", "the small, fast model that proposes tokens"], ["acceptance rate", "the share of drafted tokens the large model accepts"]],
    reflect: { q: "Why is the final text exactly what the large model would have produced, if a small model wrote most of it?", a: "Every drafted token is accepted only with probability min(1, p_large/p_draft) and rejections are replaced by a sample from the large model's corrected distribution. That acceptance rule is constructed so the overall distribution equals the large model's; the draft only proposes, it never decides." },
  },

  "m40-flashattention": {
    simple: "FlashAttention computes attention in a way that never writes the big attention matrix to memory, making long-context attention several times faster and much lighter on memory with exactly the same result.",
    concept:
      "Standard attention builds a matrix of scores between every pair of tokens: for a sequence of n tokens, n² numbers per head. For 8,000 tokens that is 64 million numbers per head per layer, written to GPU memory, read back for softmax, written again, read again for the multiply with values. The arithmetic is small; the memory traffic is enormous, and GPU memory is the slow part.\n\n**FlashAttention** reorganises the computation into tiles. It loads a block of queries and a block of keys and values into the GPU's tiny on-chip memory (SRAM, hundreds of times faster than main GPU memory), computes the partial scores, softmax and value sums there, and keeps running statistics so the final result equals the exact softmax without ever materialising the full matrix. The n² matrix is never written out.\n\nThe outcome is attention that is two to four times faster on long sequences, uses memory linear in sequence length instead of quadratic, and is mathematically identical.",
    why:
      "Context windows grew from 2,000 to 100,000 tokens and more, and the n² attention matrix would make that impossible: at 32,000 tokens it is a billion numbers per head per layer. FlashAttention made long context practical by removing the memory bottleneck, both in training and inference. Because the result is exact, there is no quality trade-off, so every modern serving framework and training stack uses it or a descendant. Knowing it explains why long prompts got cheap and where the remaining limits are.",
    how: [
      "Split the queries into blocks that fit in on-chip SRAM; split the keys and values into blocks too.",
      "For each query block, loop over key/value blocks: compute the block of scores, update a running maximum and running sum for the softmax denominator, and accumulate the weighted values.",
      "Rescale the accumulator when the running maximum changes, so the result matches a softmax over the whole row (the online softmax trick).",
      "Write only the final output block to main memory; never the scores.",
      "For the backward pass in training, recompute the scores from the saved statistics instead of storing them.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Standard attention", points: ["Compute full n × n scores", "Write to GPU memory, read for softmax, write, read for values", "Memory ∝ n²", "Slow on long sequences: memory traffic dominates"] },
      right: { title: "FlashAttention", points: ["Tiles of queries and keys/values in on-chip SRAM", "Online softmax with running max and sum", "Memory ∝ n", "2–4× faster on long sequences, identical result"] },
      caption: "Same maths, different order of operations, almost no trips to slow memory.",
    },
    everyday: {
      title: "Adding up a column without writing every subtotal down",
      text: "One accountant writes every intermediate sum onto a ledger, walks across the room to file it, and walks back for the next. Another keeps a running total in their head and writes only the final figure. Same answer; the second finishes before the first has filed the third page. The walk across the room is a trip to GPU memory.",
    },
    engineering: {
      title: "Making 32k-token contract review affordable",
      text: "A legal-tech company wanted to feed whole contracts, around 30,000 tokens, into their model. With standard attention the serving framework ran out of memory above 12,000 tokens on their cards, and prefill at 12,000 took nine seconds. Switching to a framework with FlashAttention removed the quadratic memory: 32,000-token prompts fitted, and prefill took 4.1 seconds at that length. Outputs were identical on their test set, because the kernel computes the same attention exactly.",
    },
    maths: {
      formula: "standard attention memory = heads × n² × bytes;   FlashAttention extra memory ≈ heads × n × bytes (running statistics and output)",
      meaning: "The quadratic term disappears from memory. Compute (FLOPs) is unchanged; time falls because memory traffic was the bottleneck.",
      worked: [
        "n = 8,192 tokens, 32 heads, FP16: standard scores = 32 × 8,192² × 2 bytes = 4.3 GB per layer, written and read several times per layer.",
        "n = 32,768: 32 × 32,768² × 2 = 68.7 GB per layer. Impossible on any card.",
        "FlashAttention at n = 32,768: on the order of 32 × 32,768 × 2 bytes × a few ≈ 6 MB per layer of working state. Four orders of magnitude less.",
        "Time: memory traffic of ~4 × 4.3 GB per layer at 1,000 GB/s ≈ 17 ms per layer at 8k with standard attention; the FLOPs themselves (~2 × 32 × 8,192² × 128 ≈ 0.55 TFLOP) take ~2 ms on a 300 TFLOP/s card. FlashAttention brings the layer close to the compute time.",
      ],
    },
    useIt: "Use a serving and training stack that includes FlashAttention (or the hardware vendor's equivalent fused attention); it is standard in vLLM, TGI, TensorRT-LLM and PyTorch's scaled-dot-product attention. When long context is slow or runs out of memory, the first check is whether the fused attention kernel is actually active for your model and precision.",
    takeaways: ["Standard attention materialises an n² score matrix; memory traffic, not maths, makes it slow.", "FlashAttention tiles the computation in on-chip memory with an online softmax; memory becomes linear in n.", "The result is exact; speed-ups of 2–4× on long sequences.", "It is what makes long context windows practical."],
    terms: [["FlashAttention", "a fused, tiled attention kernel that never writes the full score matrix"], ["SRAM (on-chip memory)", "the tiny, very fast memory next to the GPU cores"], ["online softmax", "computing a softmax over blocks with a running maximum and sum"]],
    reflect: { q: "FlashAttention does the same number of multiplications as standard attention. Why is it faster?", a: "Because standard attention was never limited by multiplications; it was limited by writing and reading the giant score matrix to and from slow memory. Removing that traffic lets the kernel run at the speed of the arithmetic." },
  },

  "m40-model-parallelism": {
    simple: "Model parallelism splits one model across several GPUs when it will not fit on one, by dividing either its layers or the matrices inside them; it brings capacity at the cost of communication between cards.",
    concept:
      "A 70B model at 16-bit needs 140 GB; no single card has that. **Model parallelism** places different parts of the same model on different GPUs so that together they hold it and run it. There are two ways to cut. Pipeline parallelism puts whole layers on each card: card 1 runs layers 1–20, card 2 runs 21–40, and activations are passed along. Tensor parallelism cuts each layer's big matrices into slices, with every card computing part of every layer and the partial results combined.\n\nBoth cost communication. Pipeline parallelism sends activations between stages once per layer boundary, a small transfer, but leaves cards idle unless requests are staged in a pipeline. Tensor parallelism exchanges partial results inside every layer, many small transfers that need a fast interconnect between cards.\n\nThis is different from data parallelism, which copies the whole model to each card and splits the requests. Data parallelism scales throughput; model parallelism makes a model fit.",
    why:
      "Models outgrew single cards years ago, and quantisation only stretches so far: a 400B model at 4-bit is still 200 GB. Model parallelism is the only way to serve the largest models at all, and it is also used for medium models when the KV cache for many users does not fit next to the weights on one card. Understanding the two cuts and their communication costs explains why multi-GPU machines are built with fast links, and why adding cards does not simply multiply speed.",
    how: [
      "Decide whether the model fits on one card at the chosen precision with room for caches. If yes, prefer data parallelism (replicas).",
      "If not, choose tensor parallelism across cards within one machine with fast links (NVLink), typically 2, 4 or 8 ways.",
      "If the model still does not fit, or cards are on different machines with slower links, add pipeline parallelism across them.",
      "Load each card's shard of the weights; set up the communication groups.",
      "Serve: requests flow through the stages or across the slices; monitor the interconnect, which becomes the next bottleneck.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Pipeline parallelism", points: ["Each card holds a contiguous block of layers", "Activations passed stage to stage", "Low communication volume", "Cards idle unless many requests are in flight (bubbles)"] },
      right: { title: "Tensor parallelism", points: ["Each card holds a slice of every layer's matrices", "Partial results exchanged inside each layer", "High communication frequency; needs fast links", "All cards busy on every request; cuts per-request latency"] },
      caption: "Pipeline: cut between layers. Tensor: cut through them. Real deployments often combine both.",
    },
    everyday: {
      title: "Two ways to build a car with eight workers",
      text: "An assembly line gives each worker a station: the chassis moves from one to the next, and while worker 3 fits doors, worker 1 is starting the next car. That is pipeline parallelism, efficient only when cars keep coming. Alternatively all eight workers crowd around one car, each fitting a part at once, shouting measurements to each other. That is tensor parallelism: faster for one car, but the shouting (communication) must be quick.",
    },
    engineering: {
      title: "Serving a 405B model",
      text: "A research lab serves a 405-billion-parameter model. At 8-bit the weights are 405 GB; even an eight-card machine with 80 GB cards holds 640 GB total but needs cache room. They use tensor parallelism across the eight cards of one machine, which have NVLink links at 900 GB/s between them, giving each card about 51 GB of weights and 25 GB for caches. For a longer-context tier they add pipeline parallelism across two such machines, accepting the inter-machine link's higher latency because those requests are large and batched. Each card's utilisation and the link bandwidth are both on the dashboard.",
    },
    maths: {
      formula: "weights per card = total weights ÷ parallel ways;   tensor-parallel traffic per layer ≈ 2 × batch × hidden × bytes (all-reduce), per layer, per step",
      meaning: "Splitting divides memory evenly. Tensor parallelism must combine partial sums across cards in every layer, so traffic scales with batch and hidden size times the number of layers.",
      worked: [
        "A 70B model at 8-bit = 70 GB. Four-way tensor parallel: 17.5 GB per card; on 48 GB cards that leaves ~30 GB each for caches.",
        "Traffic: batch 32, hidden 8,192, FP16, 80 layers: 2 × 32 × 8,192 × 2 bytes ≈ 1 MB per layer; × 80 layers = 84 MB per decode step; two all-reduces per layer in practice ≈ 168 MB.",
        "On NVLink at 900 GB/s: 168 MB ≈ 0.19 ms per step, negligible against a ~15 ms step. On a 25 GB/s PCIe link: 6.7 ms per step, nearly half the step time. The interconnect decides whether tensor parallelism helps or hurts.",
      ],
    },
    useIt: "Use replicas (data parallelism) whenever the model fits one card; use tensor parallelism within a machine with fast links when it does not; add pipeline parallelism across machines for the largest models or longest contexts. Watch interconnect bandwidth as a first-class metric: when it saturates, more cards make things slower.",
    takeaways: ["Model parallelism splits one model across GPUs so it fits.", "Pipeline cuts between layers (low traffic, idle bubbles); tensor cuts through them (high traffic, needs fast links).", "Data parallelism is different: whole copies for throughput.", "The interconnect becomes the bottleneck; measure it."],
    terms: [["model parallelism", "splitting one model's weights across several GPUs"], ["data parallelism", "running whole copies of a model on several GPUs to split the requests"], ["interconnect", "the links between GPUs (NVLink, PCIe, network) whose bandwidth bounds parallel speed"]],
    reflect: { q: "A model fits on one 80 GB card with 10 GB spare. A colleague proposes two-way tensor parallelism 'to make it faster'. What would you check first?", a: "Whether the workload is latency-bound for single requests and whether the two cards share a fast link. If throughput is the goal, two replicas with data parallelism give double the capacity with zero communication; tensor parallelism only wins for per-request latency, and only on NVLink-class links." },
  },

  "m40-tensor-parallelism": {
    simple: "Tensor parallelism splits each layer's weight matrices across GPUs so every card does part of every layer at once, cutting per-request latency and memory per card, as long as the cards are linked fast.",
    concept:
      "Inside a transformer layer the heavy work is a few large matrix multiplies. **Tensor parallelism** cuts those matrices into slices, one per GPU. A multiply of the input by a weight matrix becomes each card multiplying the input by its slice, producing part of the output; the parts are then combined. For attention, the natural cut is by heads: card 1 computes heads 1–8, card 2 heads 9–16. For the feed-forward block, the first matrix is cut by columns and the second by rows, so that only one combination step (an all-reduce) is needed per block.\n\nEvery card holds a fraction of the weights and does a fraction of the arithmetic for every token, so one request's decode step gets faster roughly in proportion to the number of cards, minus the time spent combining. That combination happens twice per layer, every step, which is why tensor parallelism lives inside one machine on NVLink-class links and rarely crosses a network.",
    why:
      "Pipeline parallelism fits big models but does not make a single request faster: each token still walks every layer on one card at a time. Tensor parallelism makes every card work on every token, so it is the only parallelism that reduces the latency of one request, and it keeps all cards busy even with a single user. For interactive serving of large models, it is the primary choice; the large serving frameworks default to it within a node.",
    how: [
      "Choose the parallel degree t (2, 4 or 8), matching the number of GPUs with fast links in one machine.",
      "Attention: assign heads to cards, 1/t of the heads each; each card projects its heads' queries, keys and values and computes its heads' attention locally.",
      "Feed-forward: cut the first weight matrix by columns (each card gets 1/t of the hidden units) and the second by rows, so each card's partial output is summed across cards in one all-reduce.",
      "After attention and after the feed-forward block, all-reduce the partial outputs so every card has the full layer output.",
      "Repeat per layer. Each card stores its slices of the weights and the KV cache for its own heads.",
    ],
    visual: {
      kind: "flow",
      steps: ["layer input (every card has it)", "card k: its heads' attention", "all-reduce: combine attention outputs", "card k: its slice of the feed-forward block", "all-reduce: combine", "layer output on every card → next layer"],
      caption: "Two all-reduces per layer. Everything else is local.",
    },
    everyday: {
      title: "Four cooks on one giant salad",
      text: "A single cook chopping a hundred vegetables takes an hour. Four cooks each take a quarter of the vegetables, chop them at once, and tip them into the same bowl: fifteen minutes plus the time to walk to the bowl. If the bowl is across the car park, the walking takes longer than the chopping and four cooks are slower than one. The bowl is the all-reduce; the car park is a slow interconnect.",
    },
    engineering: {
      title: "Cutting a 70B model's latency for an agent loop",
      text: "A company's coding agent made dozens of sequential model calls per task, so per-call latency, not throughput, set the user's wait. On one card their 70B model (4-bit) decoded at 14 tokens per second. With four-way tensor parallelism on an NVLink machine, each card read a quarter of the weights per step and decode rose to 46 tokens per second: 3.3× from 4 cards, the shortfall being the all-reduce time. Agent tasks that took twelve minutes took four. Eight-way reached only 5.1×, as communication grew to a third of each step.",
    },
    maths: {
      formula: "per-card weight bytes = W ÷ t;   step time ≈ W ÷ (t × bandwidth) + 2 × L × all-reduce time;   all-reduce time ≈ 2 × (t − 1) ÷ t × message bytes ÷ link bandwidth",
      meaning: "Reading weights speeds up t-fold; the all-reduces add a fixed cost per layer that depends on the message size and link speed, not on the weights.",
      worked: [
        "70B model at 4-bit: W = 36 GB. One card at 2,000 GB/s: 18 ms per step ≈ 55 tokens/s ceiling.",
        "t = 4: weight read = 36 ÷ (4 × 2,000) = 4.5 ms.",
        "All-reduce message at batch 1, hidden 8,192, FP16 = 16 KB; ring all-reduce ≈ 2 × 3/4 × 16 KB ÷ 900 GB/s ≈ 0.03 µs of transfer, but each has about 20 µs of fixed latency; × 2 per layer × 80 layers ≈ 3.2 ms per step.",
        "Step ≈ 4.5 + 3.2 = 7.7 ms → ~130 tokens/s ceiling: 2.3× from four cards in this idealised model. At t = 8: 2.25 + 3.4 ≈ 5.7 ms, 3.2×. The fixed per-all-reduce latency, not bandwidth, limits scaling at small batch.",
      ],
      note: "At batch size 1 the all-reduce is latency-bound (tiny messages, many of them). At large batches it becomes bandwidth-bound and the message size matters.",
    },
    useIt: "Use tensor parallelism within one machine for large models that need low per-request latency or that do not fit one card. Set the degree to a divisor of the attention head count and to the number of NVLink-connected GPUs. Measure the scaling: if going from 4 to 8 cards gains little, the all-reduce latency has taken over, and replicas would serve throughput better.",
    takeaways: ["Tensor parallelism slices each layer's matrices across cards; every card works on every token.", "Attention is cut by heads; feed-forward by columns then rows; two all-reduces per layer.", "It is the parallelism that reduces single-request latency.", "It needs fast intra-node links; scaling flattens as all-reduce latency grows."],
    terms: [["tensor parallelism", "splitting each layer's weight matrices across GPUs"], ["all-reduce", "a collective operation that sums partial results across cards and gives every card the total"], ["parallel degree", "how many cards share one model's tensors"]],
    reflect: { q: "Why is tensor parallelism cut by attention heads rather than by splitting each head's vectors?", a: "Heads are independent computations: each needs only its own queries, keys and values. Assigning whole heads to cards keeps attention entirely local, so the only communication is combining the heads' outputs once, not inside every attention score." },
  },

  "m40-pipeline-parallelism": {
    simple: "Pipeline parallelism gives each GPU a block of consecutive layers and passes activations down the chain; it fits huge models across machines with little communication, but keeps cards busy only when many requests flow through at once.",
    concept:
      "**Pipeline parallelism** cuts a model between layers. With four stages, card 1 holds layers 1–20, card 2 layers 21–40, and so on. A request's activations enter stage 1, come out as a vector, travel to stage 2, and continue. Only the activations cross between cards, once per stage boundary, which is a tiny transfer compared with tensor parallelism's per-layer all-reduces. That is why pipeline stages can live on different machines over ordinary network links.\n\nThe cost is idleness. While a request's token is in stage 3, stages 1, 2 and 4 are waiting, unless other requests occupy them. With a stream of requests, the stages work like an assembly line and all cards are busy; with one request, three quarters of the hardware idles. The gaps are called pipeline bubbles.\n\nPipeline parallelism adds capacity for the largest models and longest contexts; it does not speed up a single request.",
    why:
      "Tensor parallelism stops scaling beyond one machine because its constant all-reduces need NVLink-class links. The largest models need more cards than one machine holds, and some deployments spread medium models across cheap machines without fast links. Pipeline parallelism is the cut that tolerates slow links. It is also the standard way to train very large models, where microbatches keep every stage busy. In serving, it is combined with tensor parallelism: tensor within a machine, pipeline across machines.",
    how: [
      "Divide the layers into p contiguous stages, balancing the compute per stage (not just the layer count: embedding and output layers are heavy).",
      "Load each stage's weights on its card or machine; set up point-to-point links between consecutive stages.",
      "For a request, run the stage-1 forward pass, send the output activations to stage 2, and so on to the final stage, which produces logits.",
      "Keep several requests (or microbatches) in flight so each stage always has work: while stage 2 handles request A, stage 1 handles request B.",
      "Each stage keeps the KV cache for its own layers; a request's cache is spread across stages.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Time step", "Stage 1", "Stage 2", "Stage 3", "Stage 4"],
        rows: [
          ["1", "request A", "idle", "idle", "idle"],
          ["2", "request B", "request A", "idle", "idle"],
          ["3", "request C", "request B", "request A", "idle"],
          ["4", "request D", "request C", "request B", "request A"],
          ["5+", "full", "full", "full", "full"],
        ],
      },
      caption: "The first three steps have bubbles; with a steady flow every stage stays busy. One request alone would leave three stages idle at every step.",
    },
    everyday: {
      title: "A car wash with four bays",
      text: "Pre-rinse, soap, rinse, dry: each bay does one step and the car rolls to the next. One car takes the full time and three bays sit empty while it moves through. A queue of cars keeps all four bays busy and the throughput is four times a single bay's. The car wash never makes any single car faster; it makes the line of cars faster.",
    },
    engineering: {
      title: "A long-context tier across two machines",
      text: "A document-analytics provider served a 70B model with eight-way tensor parallelism on one machine. Their 128k-token tier needed more cache than one machine's eight cards could hold after the weights. They added a second identical machine and split the model into two pipeline stages of 40 layers each, with eight-way tensor parallelism inside each stage, over a 400 Gb/s network link. The per-stage activation transfer was about 16 MB per step at their batch sizes, a few hundred microseconds on that link. Both machines' cache now served the long-context requests, and with batches of 16 or more in flight the bubbles were under 10%.",
    },
    maths: {
      formula: "bubble fraction ≈ (p − 1) ÷ (p − 1 + m), with p stages and m requests (microbatches) in flight;   transfer per boundary = batch × hidden × bytes",
      meaning: "Bubbles shrink as more requests flow; the transfer between stages is one activation vector per token per request, far smaller than weights.",
      worked: [
        "p = 4 stages, one request at a time: bubble = 3 ÷ (3 + 1) = 75% of the hardware idle.",
        "p = 4, m = 16 in flight: bubble = 3 ÷ 19 ≈ 16%. m = 64: 3 ÷ 67 ≈ 4.5%.",
        "Transfer per stage boundary: batch 32 × hidden 8,192 × 2 bytes = 512 KB per decode step. Over a 50 GB/s network link: ~10 µs; over NVLink: ~0.6 µs. Either is negligible against a multi-millisecond step, which is why pipelines cross machines.",
        "Compare tensor parallelism's traffic for the same batch: ~1 MB per layer × 80 layers × 2 ≈ 168 MB per step. Pipeline parallelism moves about 300× less data.",
      ],
    },
    useIt: "Use pipeline parallelism when a model (or its cache at long context) exceeds one machine, combined with tensor parallelism inside each machine. Keep enough requests in flight to fill the pipeline; it is a throughput tool, not a latency tool. Balance stages by compute time, and put the stage boundary where the activation is smallest.",
    takeaways: ["Pipeline parallelism splits layers into stages across cards or machines; only activations cross boundaries.", "Communication is tiny, so it tolerates ordinary network links.", "Bubbles idle the cards unless many requests are in flight; it never speeds up one request.", "Combine with tensor parallelism: tensor inside a machine, pipeline across machines."],
    terms: [["pipeline parallelism", "assigning contiguous layer blocks to different GPUs"], ["pipeline bubble", "idle time on a stage waiting for work from the previous stage"], ["microbatch", "a slice of a batch sent through the pipeline so stages overlap"]],
    reflect: { q: "Why is pipeline parallelism the natural choice between machines but tensor parallelism the natural choice within one?", a: "Tensor parallelism communicates inside every layer and needs very fast links; pipeline parallelism communicates once per stage boundary with a small activation. Inside a machine NVLink makes the frequent traffic cheap; between machines only the infrequent traffic is affordable." },
  },

  "m40-cost-optimisation": {
    simple: "Cost optimisation for inference is a short list of levers, each with a known saving, applied in order of effort and checked against a quality evaluation and a cost dashboard.",
    concept:
      "Inference cost is tokens processed times the cost per token, and **cost optimisation** attacks both halves. Fewer tokens: shorter prompts, cached prefixes, capped and concise outputs, requests that are not made at all because a cheaper model or a cache answered them. Cheaper tokens: higher throughput per card through batching and continuous batching, smaller memory through quantisation, right-sized hardware, and cheaper time slots such as batch APIs or off-peak capacity.\n\nThe levers compound. Halving prompt tokens with caching, halving memory with 8-bit, and doubling throughput with continuous batching can cut cost per answer by eight times from a naive deployment. None of them changes what the model is asked to do, which is why they are checked by an evaluation suite rather than argued about.\n\nThe discipline is: measure cost per unit of value (per conversation, per document, per customer), apply the cheapest lever first, measure again.",
    why:
      "Inference is the recurring bill, and it grows with success: more users, more tokens, more cost. A product that is unprofitable per request stays unprofitable at scale. Teams that do not optimise either ration the feature (worse product) or absorb the loss. The levers are well understood and mostly configuration, so the main reason they go unapplied is that nobody measured where the money was going. Cost optimisation is largely a measurement problem.",
    how: [
      "Instrument: tokens in, tokens out, cached tokens, model and precision, GPU-seconds per request; roll up cost per conversation and per feature daily.",
      "Cut tokens: cache the stable prompt prefix; trim retrieved context to what is used; cap max output and ask for brevity; route easy requests to a smaller model.",
      "Cut cost per token: quantise to 8-bit (then 4-bit if quality holds); enable continuous batching and paged caches; load-test to find the batch sweet spot.",
      "Shift time: send non-urgent work (classification, enrichment, re-indexing) to batch endpoints or off-peak runs at a discount.",
      "Right-size hardware: match the card to the memory and bandwidth the model actually needs; use autoscaling so idle cards are released.",
      "Re-run the quality evaluation after every change; revert any lever that moves it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Lever", "Typical saving", "Effort", "Quality risk"],
        rows: [
          ["prefix caching of the system prompt", "30–60% of input cost", "config + prompt ordering", "none"],
          ["output cap + brevity instruction", "20–50% of output cost and latency", "prompt change", "low; check completeness"],
          ["8-bit quantisation", "~50% memory → ~2× concurrency", "hours", "negligible"],
          ["continuous batching", "2–3× throughput", "config", "none"],
          ["routing 60% of traffic to a small model", "40–70% of total", "a classifier + evals per route", "medium; evals per route"],
          ["batch API for offline work", "~50% of that work", "job restructuring", "none; adds hours of delay"],
          ["4-bit quantisation", "a further ~2× memory", "hours + evaluation", "low to medium"],
        ],
      },
      caption: "Apply from the top. The first four are nearly free and rarely hurt quality.",
    },
    everyday: {
      title: "Cutting a household energy bill",
      text: "You do not start by rebuilding the house. You read the meter, find that the old fridge and the always-on heater are most of the bill, replace the fridge, put the heater on a timer, and read the meter again. The expensive insulation project comes last, if it is still needed. Inference cost works the same: meter first, cheap levers next, big projects last.",
    },
    engineering: {
      title: "From £0.042 to £0.006 per conversation",
      text: "A SaaS company's support assistant cost £0.042 per conversation, 4× the budget. Tracing showed 78% of tokens were input: a 2,900-token system prompt and 2,500 tokens of retrieved help articles per turn. Steps, each checked against a 400-case evaluation: prefix caching (−33% cost, 0 change in evals); trimming retrieval from eight chunks to four (−18%, +0.5 points on evals, the model was less distracted); output cap at 300 tokens with a brevity rule (−12%, −0.3 points, accepted); routing simple FAQ questions to a small model (−40% of what remained, evals held per route); 8-bit weights on the self-hosted model doubling concurrency (−45% hardware). Final cost: £0.006 per conversation, 86% lower, evaluation score up 0.2 points overall.",
    },
    maths: {
      formula: "cost per request = Σ over calls (input tokens × p_in × (1 − cache share × 0.9) + output tokens × p_out) + GPU-seconds × price;   savings compound multiplicatively",
      meaning: "Cached input tokens cost about a tenth of full price. Each lever multiplies the remaining cost by its own factor, so three 50% levers give 12.5% of the original.",
      worked: [
        "Start: 5,400 input tokens at £3 per million = £0.0162; 450 output tokens at £15 per million = £0.0068; total £0.023 per turn.",
        "Prefix caching covers 2,900 tokens: input cost = 2,500 × 3 + 2,900 × 0.3 = £0.0075 + £0.00087 = £0.0084. Turn cost £0.0152 (−34%).",
        "Trim retrieval to 1,250 tokens: input = 1,250 × 3 + 2,900 × 0.3 per million = £0.0046; turn £0.0114 (−25% more).",
        "Output cap to 250 tokens: output = £0.0038; turn £0.0084. Route 60% of turns to a model at a fifth of the price: average turn = 0.4 × 0.0084 + 0.6 × 0.0017 = £0.0044. Total: £0.023 → £0.0044, an 81% cut, before any self-hosting lever.",
      ],
    },
    useIt: "Build the cost dashboard before optimising: cost per conversation by feature, by model and by tenant, with token breakdowns. Then apply the table top-down, re-running evaluations after each step and recording the before-and-after. Revisit quarterly: prices, models and traffic change, and yesterday's right-sized fleet is tomorrow's waste.",
    takeaways: ["Cost = tokens × cost per token; attack both: fewer tokens and cheaper tokens.", "Cheapest levers first: prefix caching, output caps, 8-bit, continuous batching, routing, batch APIs.", "Savings compound; three halvings give an eighth.", "Every change is checked against the evaluation suite and the cost dashboard."],
    terms: [["cost per conversation", "the unit cost that ties inference spend to product value"], ["prefix caching", "reusing the computed state of an unchanged prompt start at a fraction of the price"], ["routing", "sending easy requests to a cheaper model"]],
    reflect: { q: "A team proposes moving to 4-bit as their first cost lever. What would you suggest they do first and why?", a: "Measure, then apply prefix caching, output caps and continuous batching: they are configuration changes with no quality risk and often save more than 4-bit would. Quantisation to 4-bit needs an evaluation pass and carries a small quality cost; do it after the free levers, if memory still binds." },
  },
};

export const M40_QUIZ: Quiz[] = [
  {
    q: "A chat answer has a p95 latency of 10 seconds. The split shows TTFT 8.5 s and TPOT 25 ms. Where is the problem most likely?",
    options: ["The model is too large for the hardware", "Long prompts or queueing before the first token", "Answers are too long", "The network to the client"],
    answer: 1,
    why: ["A large model shows up as a slow TPOT; 25 ms is fine.", "Correct. Nearly all the wait is before the first token: prefill of a long prompt or waiting for a batch slot.", "Long answers inflate the total through TPOT × tokens; here decode is a small share.", "Network adds tens of milliseconds, not eight seconds."],
    reason: true,
  },
  {
    q: "Raising the batch size from 1 to 32 made each decode step 40% slower. What happened to throughput?",
    options: ["It fell by 40%", "It stayed the same", "It rose by roughly 23×", "It doubled"],
    answer: 2,
    why: ["The step is slower, but it now produces 32 tokens.", "No; the batch multiplies output per step.", "Correct. 32 tokens per step ÷ 1.4× the step time ≈ 23× the tokens per second.", "Far more than double: the weight read is amortised over 32 requests."],
  },
  {
    q: "A 13B model is served in FP16 on a 24 GB card. Why does it fail to load?",
    options: ["13B models need 48 GB regardless of precision", "FP16 weights are 2 bytes × 13 billion = 26 GB, more than the card", "The KV cache is too big", "The card lacks tensor cores"],
    answer: 1,
    why: ["Precision decides the size: 13 GB at 8-bit, 6.5 GB at 4-bit.", "Correct. Weights alone exceed the card before any cache is allocated.", "The cache never got a chance; the weights did not fit.", "Tensor cores affect speed, not whether it loads."],
  },
  {
    q: "Which statement about BF16 versus FP16 is right?",
    options: ["BF16 has more precision and less range", "BF16 has the same range as FP32 and less precision than FP16", "They are identical formats under two names", "FP16 cannot be used for inference"],
    answer: 1,
    why: ["Backwards: BF16 spends bits on range, not precision.", "Correct. Eight exponent bits like FP32, seven mantissa bits; networks need range more than digits.", "They differ in the exponent/mantissa split and in behaviour above 65,504.", "FP16 works for inference on many models; it just needs care with overflow."],
  },
  {
    q: "A support assistant's 3,500-token system prompt is identical in every request. What is the biggest single win?",
    options: ["4-bit quantisation", "Prefix caching so the prompt's KV cache is computed once and shared", "Pipeline parallelism", "Raising max_tokens"],
    answer: 1,
    why: ["Helps memory, but does not touch the repeated prefill.", "Correct. The prefix is prefilled once and its cache shared, cutting TTFT and freeing memory for more concurrent users.", "Adds capacity for huge models; irrelevant to a repeated prompt.", "Makes answers longer, costing more."],
    reason: true,
  },
  {
    q: "Speculative decoding with a draft model produces text that is…",
    options: ["Slightly lower quality, since the small model wrote most tokens", "Statistically identical to the large model's own output", "Identical only when acceptance is 100%", "Shorter"],
    answer: 1,
    why: ["The large model verifies every token with an exact acceptance rule.", "Correct. Accepted tokens pass the large model's check; rejected ones are replaced from its corrected distribution.", "The acceptance rule guarantees the distribution at any acceptance rate; the rate only changes speed.", "Length is decided by the large model's stop decisions as usual."],
  },
  {
    q: "A 70B model does not fit on one card. Two options: tensor parallelism across 4 cards on NVLink, or pipeline parallelism across 4 machines. Which cuts a single request's latency?",
    options: ["Pipeline parallelism", "Tensor parallelism", "Both equally", "Neither"],
    answer: 1,
    why: ["Pipeline stages process a token one after another; one request is not faster.", "Correct. Every card reads a quarter of the weights for every token, so each step is faster.", "Only tensor parallelism parallelises within a step.", "Tensor parallelism does, when the links are fast."],
  },
  {
    q: "Which lever should usually be applied first when cutting inference cost?",
    options: ["4-bit quantisation", "Buying faster GPUs", "Prefix caching and output caps, after measuring where tokens go", "Training a smaller model"],
    answer: 2,
    why: ["Effective, but it needs an evaluation pass; it comes after the free levers.", "Expensive and often fixes the wrong problem.", "Correct. Measure first; then configuration-level changes with no quality risk.", "Weeks of work; the last resort, not the first."],
  },
  {
    q: "Why does FlashAttention speed up long-context attention if it performs the same arithmetic?",
    options: ["It skips some attention scores", "It avoids writing the n² score matrix to slow GPU memory", "It uses lower precision", "It reduces the number of layers"],
    answer: 1,
    why: ["It computes every score exactly.", "Correct. Memory traffic, not maths, was the bottleneck; tiling keeps the work in fast on-chip memory.", "Precision is unchanged; the result is exact.", "The model is unchanged."],
  },
];

export const M40_EXERCISES: Exercise[] = [
  {
    title: "Size a deployment from a model card",
    kind: "calculate",
    task: "A model has 32B parameters, 60 layers, hidden size 6,144, 48 query heads and 8 KV heads. You will serve it in 8-bit weights with an FP16 KV cache on 80 GB cards with 4 GB overhead. Typical sessions are 6,000 tokens. How many concurrent sessions fit per card? How does that change with an 8-bit cache?",
    hints: ["Weights = params × 1 byte at 8-bit.", "d_kv = hidden × kv heads ÷ query heads; KV per token = 2 × layers × d_kv × bytes.", "Sessions = (VRAM − weights − overhead) ÷ (KV per token × tokens per session)."],
    solution: "Weights = 32 GB. d_kv = 6,144 × 8 ÷ 48 = 1,024. KV per token (FP16) = 2 × 60 × 1,024 × 2 = 245,760 bytes ≈ 240 KB. Budget = 80 − 32 − 4 = 44 GB = 44 × 10⁹ bytes. Tokens that fit ≈ 179,000; at 6,000 per session ≈ 29 concurrent sessions. With an 8-bit cache the per-token size halves to 120 KB, so about 58 sessions. The cache, not the weights, sets the limit either way.",
  },
  {
    title: "Diagnose from a latency split",
    kind: "think",
    task: "Three services report: (A) TTFT 0.4 s, TPOT 120 ms, outputs 300 tokens; (B) TTFT 6 s, TPOT 30 ms, outputs 200 tokens; (C) TTFT 0.5 s, TPOT 35 ms, outputs 1,400 tokens. For each, name the dominant cause of total latency and the first lever you would pull.",
    hints: ["Total = TTFT + TPOT × tokens.", "Slow TPOT → model size or hardware; slow TTFT → prompt length or queue; long outputs → caps."],
    solution: "A: total ≈ 36.4 s, dominated by TPOT (120 ms is very slow): the model is too large for the card or batch is saturated; quantise, use tensor parallelism, or a smaller/faster model. B: total ≈ 12 s, dominated by TTFT: long prompts or queueing; cache the prefix, trim context, check queue wait and add capacity. C: total ≈ 49.5 s, dominated by output length: cap max_tokens and ask for brevity; the model and prompt are fine.",
  },
  {
    title: "Work out whether speculation pays",
    kind: "calculate",
    task: "Your draft model is 1/20 the cost of the large model and you measure token acceptance rates of 0.85 on code, 0.6 on support chat and 0.35 on marketing copy, with draft length 5. Estimate the speed-up for each workload and say where you would enable it.",
    hints: ["Expected tokens per step = (1 − α⁶) ÷ (1 − α).", "Divide by (1 + 5 × 0.05) for the draft overhead."],
    solution: "Overhead factor = 1.25. Code: (1 − 0.85⁶) ÷ 0.15 = (1 − 0.377) ÷ 0.15 ≈ 4.15; ÷ 1.25 ≈ 3.3×. Support: (1 − 0.6⁶) ÷ 0.4 = (1 − 0.047) ÷ 0.4 ≈ 2.38; ÷ 1.25 ≈ 1.9×. Marketing: (1 − 0.35⁶) ÷ 0.65 ≈ 1.54; ÷ 1.25 ≈ 1.2×. Enable it for code and support, where single-stream latency matters and gains are large; skip it for marketing copy, where the gain barely covers the overhead and the workload is probably batch-generated anyway.",
  },
  {
    title: "Plan a cost cut and its checks",
    kind: "build",
    task: "A document-Q&A feature costs £0.09 per question: 9,000 input tokens (2,000 system prompt + 7,000 retrieved text) at £3/M, 600 output tokens at £15/M, and a self-hosted reranker on an under-used GPU. Write an ordered plan of levers with an estimated cost after each step, and the check you would run before keeping each one.",
    hints: ["Compute the baseline from the token prices first (it will not reach £0.09; the GPU is the rest).", "Prefix cache, trim retrieval, cap output, route, then hardware."],
    solution: "Token baseline: 9,000 × 3 + 600 × 15 per million = £0.027 + £0.009 = £0.036; the remaining £0.054 is the reranker GPU idling, so the GPU is the first target. Plan: (1) Share the reranker GPU across features or move reranking to a small CPU model or batch it: −£0.045, check rerank quality on the retrieval eval. (2) Prefix-cache the 2,000-token system prompt: input → 7,000 × 3 + 2,000 × 0.3 = £0.0216; check evals unchanged. (3) Trim retrieval to the top 4 chunks (3,500 tokens): input £0.0111; check retrieval recall@4 and answer faithfulness. (4) Cap output at 350 tokens with a brevity rule: output £0.0053; check completeness on the eval set. Running total ≈ £0.009 + £0.0164 ≈ £0.025. (5) Route questions answerable from the FAQ to a small model: a further −40% on those; evals per route. Each step: run the eval suite, compare the cost dashboard before and after, keep or revert.",
  },
];
