import type { Exercise, LessonBody, Quiz } from "../types";

// Module 47: Advanced model architectures. One concept per lesson.
// Keys are lesson slugs: m47-<kebab of the concept title in map.ts>.

export const M47_BODIES: Record<string, LessonBody> = {
  "m47-mixture-of-experts-moe": {
    simple: "A mixture of experts is a model split into many specialist sub-networks, with a small router that sends each token to only a few of them, so the model can be huge without every token paying for all of it.",
    concept:
      "A plain transformer runs every token through the same big feedforward block. That block holds most of the parameters, and every token pays for all of them, whether it is a comma or a rare chemistry term.\n\nA **mixture of experts** (MoE) replaces that one block with many smaller blocks called **experts**, say eight or sixty-four, plus a tiny **router** that looks at each token and picks the one or two experts it will go through. The outputs of the chosen experts are blended by the router's weights. Every expert exists in memory, but for any single token only the chosen few do any work.\n\nThe result is a model with the knowledge capacity of a very large network and the running cost of a much smaller one. The experts do not correspond to subjects a person would name; they specialise on their own during training, by whatever grouping of tokens makes prediction easiest.",
    why:
      "Capacity and cost pull in opposite directions. A bigger dense model knows more and predicts better, but every extra parameter is multiplied on every token, so cost grows exactly with size. Teams wanted models that know as much as a 400-billion-parameter network but answer as fast as a 50-billion one.\n\nMoE breaks the link. Total parameters can grow by adding experts, while the parameters touched per token stay fixed by how many experts the router picks. Most of the largest open-weight language models since 2024 use this design because it is the cheapest way to add knowledge without adding latency.",
    how: [
      "Inside each transformer layer, keep attention as usual and replace the feedforward block with N expert feedforward blocks.",
      "Add a router: a small linear layer that turns the token's vector into one score per expert.",
      "Keep the top k scores (usually k = 1 or 2) and turn them into weights with a softmax.",
      "Run the token through only those k experts; multiply each output by its weight and add them.",
      "During training add a small balancing penalty so the router does not send everything to one favourite expert.",
      "At inference, all experts sit in memory; per token, only k experts' maths runs.",
    ],
    visual: {
      kind: "flow",
      steps: ["token vector", "router: scores for 8 experts", "top-2: expert 3 (0.7), expert 6 (0.3)", "run only experts 3 and 6", "0.7 × out₃ + 0.3 × out₆", "next layer"],
      caption: "Eight experts exist; two do work. Total parameters are four times a dense block of the same width; the maths per token is one quarter of that.",
    },
    everyday: {
      title: "A hospital reception desk",
      text: "A large hospital has fifty specialists but a patient sees two. The receptionist (the router) reads the complaint and sends you to cardiology and nutrition, not to all fifty. The hospital's total expertise is enormous; the time each patient costs is two appointments. A dense model would be a hospital where every patient had to see every doctor.",
    },
    engineering: {
      title: "Serving a frontier-scale assistant on a fixed GPU budget",
      text: "A team wants assistant quality close to a very large dense model but has a latency target of under two seconds to first token. They pick an MoE with 8 experts and top-2 routing: 47 billion total parameters, about 13 billion active per token. Quality tracks a 40-billion dense model on their evals; throughput matches a 13-billion one. The trade: all 47 billion parameters must fit in GPU memory, so they need more memory than a 13-billion dense model, and expert load must be balanced across GPUs or one card becomes the bottleneck.",
    },
    maths: {
      formula: "active parameters ≈ shared (attention) + k × (one expert);   total ≈ shared + N × (one expert)",
      meaning: "N is the number of experts, k how many each token uses. Memory scales with total; compute per token scales with active.",
      worked: [
        "Dense baseline per layer: attention 100M parameters, feedforward 400M. Total and active both 500M per layer.",
        "MoE with N = 8 experts of 400M each, k = 2: total = 100M + 8 × 400M = 3.3B per layer.",
        "Active per token = 100M + 2 × 400M = 900M per layer.",
        "So the MoE layer holds 6.6× the dense parameters but does only 1.8× the dense work per token. Across 32 layers: 106B total, 29B active.",
      ],
      note: "Real models also share some experts across all tokens; the arithmetic is the same with those added to 'shared'.",
    },
    code: {
      title: "Top-2 routing in plain NumPy",
      lang: "py",
      src: `import numpy as np

def moe_layer(x, experts, router_w, k=2):
    # x: token vector (d,), experts: list of functions, router_w: (d, num_experts)
    scores = x @ router_w                       # one score per expert
    top = np.argsort(scores)[-k:]               # indices of the k best
    weights = np.exp(scores[top]) / np.exp(scores[top]).sum()   # softmax over the chosen k
    out = np.zeros_like(x)
    for w, i in zip(weights, top):
        out += w * experts[i](x)                # only k experts run
    return out`,
      lines: [
        { code: "scores = x @ router_w                       # one score per expert", say: "The router is a single matrix multiply: cheap compared with an expert." },
        { code: "top = np.argsort(scores)[-k:]               # indices of the k best", say: "Pick the two highest-scoring experts for this token." },
        { code: "weights = np.exp(scores[top]) / np.exp(scores[top]).sum()   # softmax over the chosen k", say: "Softmax over only the chosen scores gives blend weights that add to one." },
        { code: "out += w * experts[i](x)                # only k experts run", say: "The saving: the loop runs k times, not num_experts times." },
      ],
      note: "In a real model x is a batch of tokens and the experts are grouped so each expert processes all the tokens routed to it in one go.",
    },
    useIt: "MoE is the standard way to build the largest language models economically, and it appears in vision and speech models too. Choose it when you need more knowledge at the same per-token cost and can afford the memory; avoid it when memory is the constraint, such as on a single small GPU or a phone, where a dense model of the active size is simpler.",
    takeaways: ["MoE = many expert blocks + a router that picks k of them per token.", "Total parameters set memory; active parameters set compute and latency.", "Experts specialise on their own; balancing losses keep the router from collapsing onto one.", "Best when memory is plentiful and per-token cost matters."],
    terms: [["expert", "one of several feedforward sub-networks inside an MoE layer"], ["router", "the small network that scores experts for each token and picks the top k"], ["active parameters", "the parameters actually used for one token"]],
    reflect: { q: "An MoE has 8 experts and routes top-1. Half of all tokens go to expert 2. What goes wrong at training time and at serving time?", a: "At training the other experts see too few tokens and learn little, so capacity is wasted; a balancing loss pushes the router to spread tokens. At serving, the GPU holding expert 2 is overloaded while the others idle, so throughput drops to the speed of one card." },
  },

  "m47-sparse-vs-dense-models": {
    simple: "A dense model uses every parameter for every input; a sparse model uses only a chosen subset each time, so it can hold far more parameters than it spends.",
    concept:
      "In a **dense** model every weight takes part in every forward pass. If the model has 70 billion parameters, each token is multiplied by all 70 billion of them somewhere along the way. Capacity and cost are the same number.\n\nA **sparse** model uses only part of itself for any one input. Mixture of experts is the common form (only chosen experts run), but sparsity also appears as weights set to exactly zero that are skipped, or as attention that looks at only some positions. In every case the question 'how big is the model?' splits into two answers: how many parameters exist, and how many are used per input.\n\nThe word sparse means 'mostly empty'. The work done per token is a sparse selection from a large store of possible work.",
    why:
      "Dense scaling hit a wall of cost. Doubling quality by doubling a dense model doubles training compute, serving compute and latency together. Sparse designs exist to decouple those: keep the store of knowledge growing while the per-token bill stays flat.\n\nSparsity also matches how knowledge is used. A token about French tax law has no need of the parameters that encode Python syntax. A dense model multiplies by them anyway; a sparse one can skip them.",
    how: [
      "Decide what is selected per input: experts (MoE), weights (pruning), or positions (sparse attention).",
      "Add a cheap selection mechanism: a router, a fixed mask, or a pattern of allowed positions.",
      "Train so that the selection and the selected parts learn together, with penalties that keep the selection spread out.",
      "At serving, load everything, run only what is selected, and account for memory by total size and speed by active size.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["", "Dense 13B", "Dense 70B", "Sparse MoE 47B total / 13B active"],
        rows: [
          ["parameters in memory", "13B", "70B", "47B"],
          ["parameters used per token", "13B", "70B", "13B"],
          ["speed per token", "fast", "slow", "fast"],
          ["knowledge capacity", "low", "high", "high-ish"],
          ["memory needed", "small", "large", "large"],
        ],
      },
      caption: "The sparse model buys most of the capacity of the big dense model at the speed of the small one, paying in memory.",
    },
    everyday: {
      title: "A library versus a backpack",
      text: "A dense model is a backpack you carry everywhere: everything in it weighs on every step. A sparse model is a library you walk into: it holds a thousand times more books, and you pay only for the two you pull off the shelf. The library needs a building, though; that is the memory cost.",
    },
    engineering: {
      title: "Pruning a speech model for a hearing-aid chip",
      text: "A hearing-aid company has a dense noise-suppression network that is too large for the chip. They prune: train, set the 60% smallest weights to zero, retrain the rest, repeat. The final network has 70% zeros. On a chip whose hardware skips zero weights, it runs in 40% of the time at nearly the same quality. On a plain CPU, the zeros still cost a multiply, so the same sparse model gains nothing; the hardware must know how to skip.",
    },
    maths: {
      formula: "compute per token ∝ active parameters;   memory ∝ total parameters;   sparsity = 1 − active ÷ total",
      meaning: "A sparse model's sparsity says what fraction of it sits idle for any one input.",
      worked: [
        "An MoE with 47B total and 13B active: sparsity = 1 − 13 ÷ 47 = 0.72. Seventy-two percent of the model is idle for each token.",
        "A pruned network with 70% zeros: sparsity 0.70; compute saving 70% only on hardware that skips zeros.",
        "A dense model: active = total, sparsity 0. Its compute saving is nothing; its memory need is exactly its size.",
      ],
    },
    useIt: "Think in two numbers for any large model: total parameters (memory, download size, cost to hold) and active parameters (speed, cost per token). Pick sparse designs when per-token cost matters more than memory; pick dense when memory is tight or hardware cannot exploit the sparsity.",
    takeaways: ["Dense: every parameter every time. Sparse: a chosen subset per input.", "Total parameters cost memory; active parameters cost compute.", "Sparsity only saves compute when the hardware or the structure skips the idle parts.", "MoE, pruning and sparse attention are three ways to be sparse."],
    terms: [["dense model", "a model in which all parameters take part in every forward pass"], ["sparse model", "a model that uses only a selected subset of its parameters per input"], ["pruning", "setting small weights to zero and skipping them"]],
    reflect: { q: "A vendor advertises a 'one trillion parameter model' that answers as fast as a 30-billion one. What must be true?", a: "It is sparse, almost certainly a mixture of experts with roughly 30 billion active parameters per token. It still needs memory for all trillion, so it runs on a large multi-GPU server, not on a laptop." },
  },

  "m47-routing-networks": {
    simple: "A routing network is the small decision-maker inside a sparse model that looks at each input and chooses which parts of the model should handle it.",
    concept:
      "Every sparse model needs something to make the choice. A **routing network** (or gate) is a small learned function that reads a token's vector and produces a preference over the available parts: experts, branches, or even whole models. It is trained together with the parts it routes to, so the choices and the specialists improve each other.\n\nThe common form is one linear layer followed by a top-k selection and a softmax, as in mixture of experts. Variations choose per token, per whole sequence, or let experts choose tokens instead of tokens choosing experts. Routers can also sit outside a model: a cheap classifier that sends easy requests to a small model and hard ones to a large one is a router too.\n\nThe router's problems are its own: it must spread load, it must be stable (small changes in input should not flip choices wildly), and its decisions are discrete, which makes training awkward because you cannot take a smooth derivative through 'pick the top two'.",
    why:
      "Without a router, sparsity would need a fixed rule about which part handles what, and no fixed rule matches how language or images actually vary. A learned router finds groupings that help prediction, including ones nobody would have written.\n\nRouters also solve a systems problem: they let one model offer many behaviours at one price. The same reason makes external routers useful in products: most requests are easy, and paying the big model's price for all of them is waste.",
    how: [
      "Compute scores: multiply the token vector by a router matrix to get one number per option.",
      "Select: keep the top k options (hard choice) and softmax their scores into blend weights.",
      "Run the selected options and blend outputs by the weights.",
      "Train the router through the blend weights (which are differentiable) and with an auxiliary loss that rewards even usage.",
      "Optionally add noise to the scores during training so every expert occasionally gets tried.",
      "Cap how many tokens any expert may take in one batch (capacity factor); overflow tokens skip or go elsewhere.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "scores", detail: "token · W_router → [1.2, −0.3, 2.1, 0.4]" },
        { label: "top-2", detail: "experts 3 (2.1) and 1 (1.2)" },
        { label: "weights", detail: "softmax([2.1, 1.2]) = [0.71, 0.29]" },
        { label: "balance check", detail: "is expert 3 taking more than its share this batch? add penalty if so" },
        { label: "blend", detail: "0.71 × E₃(x) + 0.29 × E₁(x)" },
      ],
      caption: "A router is tiny. Its decisions decide where most of the model's compute goes.",
    },
    everyday: {
      title: "The triage nurse",
      text: "In an emergency department a triage nurse spends two minutes per patient deciding who sees whom and how urgently. The nurse is not the treatment; the nurse decides where the treatment happens. A good nurse keeps every doctor busy but none overloaded, and sends a chest pain to cardiology every time, not sometimes. Those are exactly a router's three jobs: cheap decisions, balanced load, stable choices.",
    },
    engineering: {
      title: "A request router in front of two models",
      text: "A customer-support product runs a small, fast model and a large, slow one. A router (a classifier trained on past requests labelled 'small model was good enough' or not) sends about 70% of traffic to the small model. Cost falls by half; quality on their evaluation set is unchanged because the hard 30% still reach the big model. The engineering care goes into the labels: if the router learns 'short questions are easy', it will misroute a short but tricky legal question. They add an escape hatch: if the small model's answer scores low confidence, re-route to the large one.",
    },
    maths: {
      formula: "balance loss = N × Σᵢ fᵢ × pᵢ   where fᵢ = fraction of tokens sent to expert i, pᵢ = mean router probability for expert i",
      meaning: "The penalty is smallest when tokens and probabilities are spread evenly; it grows when one expert attracts both the tokens and the confidence.",
      worked: [
        "Four experts, perfectly balanced: each fᵢ = 0.25 and pᵢ = 0.25. Loss = 4 × 4 × (0.25 × 0.25) = 1.0.",
        "Collapsed: expert 1 gets f₁ = 0.85, p₁ = 0.85; the others f = 0.05, p = 0.05. Loss = 4 × (0.85 × 0.85 + 3 × 0.05 × 0.05) = 4 × (0.7225 + 0.0075) = 2.92.",
        "The collapsed router pays almost three times the penalty, which pushes it to spread tokens out.",
      ],
      note: "This is the balancing term used by the Switch Transformer family; the constant N keeps the balanced value at 1 regardless of expert count.",
    },
    code: {
      title: "A router with a capacity cap",
      lang: "py",
      src: `import numpy as np

def route(tokens, router_w, k, capacity):
    # tokens: (T, d), router_w: (d, E). Returns, per token, chosen experts and weights.
    scores = tokens @ router_w                              # (T, E)
    choice = np.argsort(scores, axis=1)[:, -k:]              # top-k expert ids per token
    load = np.zeros(router_w.shape[1], dtype=int)
    assignments = []
    for t in range(tokens.shape[0]):
        kept = [e for e in choice[t] if load[e] < capacity]  # drop experts that are already full
        for e in kept:
            load[e] += 1
        w = np.exp(scores[t, kept]); w = w / w.sum() if kept else w
        assignments.append((kept, w))
    return assignments, load`,
      lines: [
        { code: "choice = np.argsort(scores, axis=1)[:, -k:]              # top-k expert ids per token", say: "The hard decision: each token's k preferred experts." },
        { code: "kept = [e for e in choice[t] if load[e] < capacity]  # drop experts that are already full", say: "The capacity cap. An expert that has taken its share this batch is skipped so no GPU is swamped." },
        { code: "load[e] += 1", say: "Counting load per expert is what makes the cap possible and what the balance loss reads." },
        { code: "w = np.exp(scores[t, kept]); w = w / w.sum() if kept else w", say: "Blend weights are recomputed over the experts that were actually kept." },
      ],
      note: "A token whose experts are all full passes through with no expert work in simple designs; better ones send it to the next-best free expert.",
    },
    useIt: "Inside models, routers are what make sparsity work; when tuning or debugging an MoE, look at expert usage histograms first. Outside models, a cheap router in front of several models is one of the most effective cost tools in production AI: route by difficulty, by language, by domain, with confidence-based fallback.",
    takeaways: ["A router is a small learned function that chooses which parts of a model handle an input.", "Its three jobs: cheap decisions, balanced load, stable choices.", "Top-k selection is not differentiable; training goes through the blend weights and a balance loss.", "The same idea routes requests between whole models in products."],
    terms: [["gate / router", "the function that scores options and selects the top k"], ["capacity factor", "the maximum share of a batch any expert may take"], ["auxiliary loss", "an extra training penalty, here for load balance, added to the main loss"]],
    reflect: { q: "Why not let every token use all experts with soft weights, avoiding the awkward hard top-k choice?", a: "Because then every expert runs for every token and the compute saving disappears; it is a dense model with extra steps. Sparsity requires a hard choice, and the balance loss and noise exist to make that hard choice trainable." },
  },

  "m47-state-space-models": {
    simple: "A state space model reads a sequence one step at a time, carrying a fixed-size memory forward, so its cost grows in a straight line with length instead of squaring like attention.",
    concept:
      "Attention lets every token look at every other token. That is powerful and expensive: double the sequence and the work quadruples. A **state space model** (SSM) takes the older idea of a running memory and rebuilds it with modern training.\n\nAt each position the model keeps a **state**: a vector of fixed size that summarises everything seen so far. Each new token updates the state by a fixed rule (multiply the old state by a matrix, add the new input through another matrix) and produces an output from it. Because the rule is linear, the whole sequence can also be computed at once as one long convolution during training, which is fast on GPUs, while at inference it runs as the step-by-step recurrence, which is fast and uses constant memory.\n\nThe cost per token does not depend on how far back the context goes. The price is that everything must fit into the fixed state; nothing can be looked up exactly the way attention looks up a specific earlier token.",
    why:
      "Long inputs broke attention's budget: an hour of audio, a whole genome, a million-token document. Quadratic cost and a cache that grows with every token made those impractical. Recurrent networks had linear cost but trained badly over long ranges because gradients faded.\n\nSSMs exist to keep the linear cost and fix the training: carefully chosen state matrices let information survive thousands of steps, and the convolution view lets training parallelise. They are the main alternative to attention for very long sequences.",
    how: [
      "Define the state update: h_t = A·h_{t−1} + B·x_t, where h is the state vector, x_t the input at step t.",
      "Define the output: y_t = C·h_t (plus a skip from x_t).",
      "Choose or learn A so that the state neither explodes nor forgets too fast; structured choices (diagonal, special initialisations) make this stable over long ranges.",
      "For training, unroll the recurrence into a convolution kernel and apply it to the whole sequence in parallel.",
      "For inference, run the recurrence token by token: constant memory, constant time per token.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Attention", points: ["each token looks at all earlier tokens", "cost per token grows with context length", "cache grows with every token", "exact lookup of any earlier token"] },
      right: { title: "State space model", points: ["each token updates a fixed-size state", "cost per token constant", "memory constant", "earlier tokens survive only as compressed into the state"] },
      caption: "Attention remembers everything and pays for it; an SSM remembers a summary and pays nothing extra for length.",
    },
    everyday: {
      title: "Listening to a long story",
      text: "You cannot replay every sentence of a two-hour story, but you carry a running sense of who is who and what has happened. Each new sentence updates that sense and is then let go. You answer questions from the running sense, not from a recording. That is a state space model; attention is the version with a recording you can rewind.",
    },
    engineering: {
      title: "Transcribing day-long audio in one pass",
      text: "A company records and transcribes eight-hour meetings. With attention-based models they had to cut audio into chunks and stitch transcripts, losing context at every boundary. An SSM-based model processes the whole day as one sequence: memory stays flat, and a speaker named at 9 am is still known at 4 pm as far as the state carried them. On their tests it loses slightly on exact recall of numbers spoken hours earlier, so they add a small attention layer for the final answer step. Most of the length is handled linearly; the precise lookups are handled by attention.",
    },
    maths: {
      formula: "h_t = A h_{t−1} + B x_t,   y_t = C h_t;   cost for length L: attention ∝ L², SSM ∝ L",
      meaning: "A, B, C are learned matrices; the state h has a fixed size regardless of L.",
      worked: [
        "A scalar toy: A = 0.9, B = 1, C = 1, inputs x = [2, 0, 0, 0]. h₁ = 0.9·0 + 2 = 2. h₂ = 0.9·2 = 1.8. h₃ = 1.62. h₄ = 1.458. The input echoes forward, fading by 10% a step.",
        "With A = 0.5 the echo halves each step: 2, 1, 0.5, 0.25. A controls how long the state remembers.",
        "Cost: a sequence of 100,000 tokens. Attention work ∝ 100,000² = 10¹⁰. SSM work ∝ 100,000 = 10⁵. A hundred-thousand-fold difference in the length-dependent part.",
      ],
      note: "Real SSMs use a state of hundreds of dimensions per channel, and A is a matrix whose entries set many different memory lengths at once.",
    },
    code: {
      title: "A one-dimensional SSM, as a recurrence",
      lang: "py",
      src: `def ssm_step(h, x, A, B, C):
    h = A * h + B * x          # update the running state
    y = C * h                  # read an output from it
    return h, y

def run(xs, A=0.9, B=1.0, C=1.0):
    h, ys = 0.0, []
    for x in xs:               # one pass, constant memory
        h, y = ssm_step(h, x, A, B, C)
        ys.append(round(y, 3))
    return ys

print(run([2, 0, 0, 0]))       # [2.0, 1.8, 1.62, 1.458]
print(run([1, 1, 1, 1]))       # [1.0, 1.9, 2.71, 3.439]`,
      lines: [
        { code: "h = A * h + B * x          # update the running state", say: "The whole model is this line: old memory scaled by A, plus the new input scaled by B." },
        { code: "y = C * h                  # read an output from it", say: "The output is a read-out of the state, not a look back at earlier inputs." },
        { code: "for x in xs:               # one pass, constant memory", say: "However long xs is, only h is kept. That is the linear cost." },
        { code: "print(run([2, 0, 0, 0]))       # [2.0, 1.8, 1.62, 1.458]", say: "One input, then silence: the memory fades by 10% a step, set by A." },
      ],
      output: "[2.0, 1.8, 1.62, 1.458]\n[1.0, 1.9, 2.71, 3.439]",
    },
    useIt: "Reach for SSM-based models when sequences are very long and mostly need a running summary: audio, sensor streams, genomics, long logs, long-document reading where exact quotation matters less. Keep attention, or a hybrid, when the task needs exact recall of specific earlier tokens.",
    takeaways: ["An SSM carries a fixed-size state forward: constant memory and time per token.", "The linear update can be trained as a convolution in parallel and run as a recurrence at inference.", "A decides how long information survives in the state.", "It trades exact recall for linear cost; hybrids recover recall where needed."],
    terms: [["state", "the fixed-size vector that summarises the sequence so far"], ["recurrence", "computing each step from the previous step's result"], ["linear-time", "cost grows in proportion to length, not length squared"]],
    reflect: { q: "A 'needle in a haystack' test hides a random passphrase in a 200,000-token document and asks for it at the end. Which architecture would you expect to do better, and why?", a: "Attention, because it can look up the exact earlier tokens. An SSM must have kept the passphrase in its compressed state through 200,000 updates, which is hard for arbitrary strings. This is the standard argument for hybrids." },
  },

  "m47-mamba-architecture": {
    simple: "Mamba is a state space model whose update rule depends on the input, so it can decide what to remember and what to forget token by token, which lets it match transformers on language at linear cost.",
    concept:
      "Early state space models used the same A, B and C matrices for every token. That made them fast but weak at language, because the model could not choose to hold on to an important word and drop a filler word; every token was absorbed with the same fixed rule.\n\n**Mamba** adds **selectivity**: the matrices that control the state update are computed from the current input. For each token the model produces its own forget-rate and write-strength. A name can be written strongly and held; a comma can be nearly ignored. This is the gating idea from LSTMs brought into the SSM framework, with a new hardware-aware algorithm that keeps it fast on GPUs even though the convolution trick no longer applies.\n\nThe result is a model with no attention at all that reaches transformer-level quality on language modelling at sizes up to a few billion parameters, with constant memory per token and throughput several times higher on long sequences.",
    why:
      "Fixed-rule SSMs were excellent at audio and signals but lagged on text, where which token matters depends entirely on content. The gap was selectivity. Transformers have it through attention, which is content-dependent by construction; SSMs lacked it.\n\nMamba exists to close that gap without giving up linear cost. It showed that content-dependent memory, not attention specifically, is what language needs, and it opened the door to long-context models and to hybrids that mix a few attention layers into a mostly-SSM stack.",
    how: [
      "From each token's vector, compute per-token values for the step size Δ, the input matrix B and the output matrix C.",
      "Turn the continuous A and B into discrete per-token updates using Δ: a large Δ means 'take this token seriously', a tiny Δ means 'barely update'.",
      "Update the state with those per-token matrices: h_t = Ā_t h_{t−1} + B̄_t x_t.",
      "Read the output y_t = C_t h_t and pass through a gated branch, as in a transformer block minus attention.",
      "Because the matrices vary per token, compute the scan with a parallel-scan kernel that keeps the state in fast GPU memory instead of writing it out.",
      "Stack these blocks; no attention layers are needed for the base design.",
    ],
    visual: {
      kind: "flow",
      steps: ["token x_t", "compute Δ_t, B_t, C_t from x_t", "discretise: Ā_t, B̄_t", "h_t = Ā_t h_{t−1} + B̄_t x_t", "y_t = C_t h_t", "gate and project", "next block"],
      caption: "The only difference from a plain SSM is that Δ, B and C now depend on the token. That difference is what makes it work on language.",
    },
    everyday: {
      title: "Note-taking in a lecture",
      text: "A good note-taker does not write every word at the same pressure. A key definition goes down in capitals; 'um, so, anyway' never reaches the page. The decision of how hard to write depends on what is being said. A fixed-rule SSM writes everything at the same pressure. Mamba chooses the pressure per word.",
    },
    engineering: {
      title: "A long-context code assistant on one GPU",
      text: "A team building a repository-aware code assistant needs to read 500,000 tokens of source per request. A transformer's attention cache for that would exceed their single GPU. They evaluate a Mamba-style model: memory per request is flat, throughput on long inputs is about five times higher, and quality on code completion is close. Exact recall of a function signature defined 400,000 tokens earlier is weaker, so they adopt a hybrid: mostly selective SSM blocks with one attention layer in every eight. Memory stays small; recall recovers.",
    },
    maths: {
      formula: "Ā_t = exp(Δ_t A),   B̄_t = Δ_t B_t;   small Δ_t → Ā_t ≈ 1 (remember), large Δ_t → Ā_t → 0 (overwrite)",
      meaning: "Δ_t is the per-token step size produced from the input; it sets how much the old state decays and how strongly the new token is written.",
      worked: [
        "Let A = −1 (a decay). For a filler token the model outputs Δ = 0.05: Ā = exp(−0.05) = 0.951, B̄ = 0.05. The state keeps 95% and takes in only 5% of the new token.",
        "For a key name the model outputs Δ = 3: Ā = exp(−3) = 0.050, B̄ = 3. The old state is almost wiped and the name is written strongly.",
        "Two consecutive fillers: state retains 0.951 × 0.951 = 0.904 of what it held. Twenty fillers: 0.951²⁰ ≈ 0.37. The important content fades slowly, by choice.",
      ],
      note: "In the real model A is a diagonal matrix with many channels, so different channels forget at different rates for the same token.",
    },
    code: {
      title: "Selective scan, scalar version",
      lang: "py",
      src: `import math

def selective_scan(xs, delta_fn, A=-1.0):
    # delta_fn decides, per token, how strongly to update the state
    h, outs = 0.0, []
    for x in xs:
        delta = delta_fn(x)
        A_bar = math.exp(delta * A)       # how much of the old state survives
        B_bar = delta                     # how strongly the new token is written
        h = A_bar * h + B_bar * x
        outs.append(round(h, 3))
    return outs

important = lambda x: 3.0 if abs(x) > 5 else 0.05
print(selective_scan([10, 1, 1, 1, -8, 1], important))`,
      lines: [
        { code: "delta = delta_fn(x)", say: "Selectivity: the step size comes from the token itself, not from a fixed setting." },
        { code: "A_bar = math.exp(delta * A)       # how much of the old state survives", say: "Big delta → A_bar near 0, the state is overwritten; small delta → near 1, the state is kept." },
        { code: "h = A_bar * h + B_bar * x", say: "The same SSM update as before, now with per-token coefficients." },
        { code: "important = lambda x: 3.0 if abs(x) > 5 else 0.05", say: "A stand-in for the learned rule: large-magnitude inputs count as important here. The real model learns this from data." },
      ],
      output: "[30.0, 28.587, 27.24, 25.957, -22.712, -21.642]",
      note: "The state holds the 10 for several quiet steps, then is overwritten by the −8. A fixed-rule SSM could not choose this.",
    },
    useIt: "Mamba and its successors are the practical choice for long-sequence tasks where a transformer's cache is the bottleneck: long audio, DNA, logs, large codebases, and as the backbone of hybrid language models. For short-context chat on plentiful hardware, transformers remain the default; the gap is in cost at length, not in quality at short range.",
    takeaways: ["Mamba = state space model + input-dependent update (selectivity).", "Per-token Δ decides remember versus overwrite; this is what language needs.", "Linear cost and constant memory are kept by a hardware-aware scan kernel.", "Hybrids with a few attention layers recover exact recall."],
    terms: [["selectivity", "letting the update rule depend on the current input"], ["step size Δ", "the per-token number that sets how much the state changes"], ["parallel scan", "a GPU algorithm that computes a sequence of dependent updates in parallel"]],
    reflect: { q: "Mamba gave up the convolution trick that made fixed SSMs fast to train. How can it still train fast?", a: "By a custom kernel that performs the recurrence as a parallel scan entirely inside fast GPU memory, never writing the large state tensor out to slow memory. The speed comes from memory traffic, not from a mathematical shortcut." },
  },

  "m47-hybrid-transformer-architectures": {
    simple: "A hybrid architecture mixes attention layers with cheaper layers such as state space blocks, keeping exact recall where it is needed and linear cost everywhere else.",
    concept:
      "Attention is precise and expensive; state space blocks are cheap and approximate. A **hybrid architecture** stacks both. Most layers are the cheap kind, carrying context forward in a fixed state; a few layers are attention, giving the model places where it can look back at exact earlier tokens.\n\nThe mix is a design knob. One attention layer in every four to eight is common; some designs put attention only in the final layers, some interleave it evenly, some use attention over a sliding window plus a global SSM. The parameters and cost sit mostly in the cheap layers, so long inputs stay affordable, while the attention layers give near-transformer accuracy on tasks that need exact lookup.\n\nHybrids are also where other mixes live: dense layers with MoE layers, local attention with global attention, convolution with attention in vision. The principle is the same: use the expensive mechanism only where it pays.",
    why:
      "Each pure design has a known failure. Pure transformers cannot afford very long inputs. Pure SSMs lose exact recall and fine-grained in-context learning. Rather than wait for one mechanism to do everything, engineers combined them and measured.\n\nThe measurements favoured hybrids: a handful of attention layers recovers most of the recall gap at a small fraction of the cost. Since 2024 several production long-context models are hybrids, and the question has shifted from 'attention or not' to 'how much attention, and where'.",
    how: [
      "Choose a base: mostly SSM or linear-attention blocks for the bulk of the depth.",
      "Insert attention layers at chosen depths: every k-th layer, or a block of them near the end.",
      "Optionally make the attention cheaper too: a sliding window, or shared key-value heads.",
      "Add MoE to the feedforward parts if capacity is wanted at fixed compute.",
      "Train end to end; the layers learn their roles, with attention layers specialising in retrieval-like behaviour.",
      "Validate on long-context recall tests and on standard benchmarks; tune the attention ratio to the cost target.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer type", "Share of layers", "Memory with context", "Role it tends to learn"],
        rows: [
          ["selective SSM block", "6 of 8", "constant", "carry and compress context; local patterns"],
          ["full attention", "1 of 8", "grows with length", "exact lookup, copying, in-context examples"],
          ["sliding-window attention", "1 of 8", "fixed window", "precise local syntax"],
          ["MoE feedforward", "inside any block", "total parameters", "knowledge capacity"],
        ],
      },
      caption: "A typical hybrid recipe. The costly mechanisms are a minority of the stack but do the jobs the cheap ones cannot.",
    },
    everyday: {
      title: "A detective's notebook and a filing cabinet",
      text: "A detective mostly works from a running mental picture of the case (the state), updated with every interview. Now and then they walk to the filing cabinet to re-read one exact statement (attention). Nobody re-reads every file after every interview; nobody relies only on memory for a quoted alibi. The hybrid is the sensible detective.",
    },
    engineering: {
      title: "Choosing the attention ratio for a legal-document assistant",
      text: "A legal-tech team needs to read 300-page contracts and answer with exact clause quotations. They train three small hybrids: attention in every layer (a transformer), every 4th layer, every 8th layer. On clause-quotation accuracy the scores are 94%, 92%, 85%; on memory per contract, the every-8th model uses a third of the transformer's. They ship the every-4th design: two points of accuracy for a halving of serving cost, and the remaining gap is covered by a retrieval step that pastes the candidate clause into the final prompt.",
    },
    maths: {
      formula: "memory(L) ≈ a × L × (attention layers) + constant × (SSM layers);   compute(L) ≈ a × L² × (attention layers) + b × L × (SSM layers)",
      meaning: "Only the attention layers contribute the length-dependent cache and the quadratic term; the SSM layers contribute linear terms.",
      worked: [
        "A 32-layer transformer at 100,000 tokens: attention cost ∝ 32 × 10¹⁰ = 3.2 × 10¹¹ (relative units).",
        "A hybrid with 4 attention layers and 28 SSM layers: attention part 4 × 10¹⁰ = 4 × 10¹⁰; SSM part 28 × 10⁵ × b. With b even 100× larger per token than the attention constant, the SSM part is 2.8 × 10⁸, negligible.",
        "The hybrid's length-dependent cost is about 4 ÷ 32 = one eighth of the transformer's, and its cache is one eighth the size.",
      ],
    },
    useIt: "When you need long context and cannot afford a full transformer, or you find a pure SSM losing exact-recall tasks, a hybrid is the answer. Tune the ratio with your own recall tests; pair with retrieval for the hardest exact lookups. In vision and audio, the same thinking applies to mixing convolutions with attention.",
    takeaways: ["Hybrids keep attention only where exact lookup is needed; cheaper layers carry the rest.", "A few attention layers recover most of the recall gap at a fraction of the cost.", "The attention ratio is a measured trade between accuracy and memory.", "The same principle mixes dense with MoE, local with global, convolution with attention."],
    terms: [["hybrid architecture", "a model stacking different layer mechanisms, each used where it pays"], ["sliding-window attention", "attention restricted to the last w tokens"], ["attention ratio", "the share of layers that use full attention"]],
    reflect: { q: "If attention layers specialise in exact lookup, why not put all of them at the very end of the stack?", a: "Because middle layers also need precise access for reasoning that builds on retrieved facts, and because early SSM layers may compress away details before the end can retrieve them. Interleaving lets retrieval and compression alternate; experiments usually favour spreading attention layers out." },
  },

  "m47-multimodal-transformers": {
    simple: "A multimodal transformer turns images, audio and text into the same kind of token sequence, so one model can read, see and hear with a single architecture.",
    concept:
      "A transformer does not know what a token means; it only sees vectors in a sequence. That makes it possible to feed it more than text. A **multimodal transformer** uses separate small encoders to turn each kind of input into vectors of the same size: an image becomes a grid of patch vectors, a second of audio becomes a few dozen frame vectors, text becomes token vectors as usual. These are placed in one sequence, often with markers saying where each kind begins, and the transformer attends across all of them.\n\nTwo designs are common. **Early fusion** mixes all modalities in one shared stack from the first layer, which lets text and image tokens interact deeply but costs more. **Late fusion** or cross-attention keeps a text model as the core and lets it attend to image or audio features through dedicated layers, which is cheaper and lets a strong text model be extended without retraining from scratch.\n\nOutput can be multimodal too: the same sequence can end with image tokens that a decoder turns into pixels, or audio tokens that become speech.",
    why:
      "The world is not text. A support request has a photo; a meeting is audio; a robot's input is video. Separate models per modality could each do their job but could not reason across them: a text model could not say what is in the picture it was asked about.\n\nMultimodal transformers exist because the transformer's indifference to what tokens mean made a shared sequence possible, and because training on paired data (captions, transcripts, subtitles) teaches the model to connect the modalities. One model, many senses, one reasoning process.",
    how: [
      "Encode each modality: a patch encoder for images, a spectrogram encoder for audio, the usual embedding for text.",
      "Project each encoder's output into the transformer's vector size so all tokens have the same shape.",
      "Build one sequence: special markers, then image tokens, then text tokens, in the order the prompt specifies.",
      "Run the transformer; attention connects a question's words to the relevant image patches.",
      "Decode: text tokens for an answer, or image or audio tokens passed to a generator for multimodal output.",
      "Train on paired data (image–caption, audio–transcript, interleaved web pages) so the connections are learned.",
    ],
    visual: {
      kind: "flow",
      steps: ["image → 576 patch vectors", "audio → 50 frame vectors per second", "text → token vectors", "one sequence: [img] … [aud] … [txt] …", "shared transformer with attention across all", "answer tokens"],
      caption: "Different encoders, one sequence, one model. The transformer never needs to know which vectors came from pixels.",
    },
    everyday: {
      title: "Describing a photo to a friend on the phone",
      text: "You look at a picture and speak about it. Your eyes turn it into something your language can describe; your ears take in the friend's question; your answer uses both. You do not have a separate 'picture brain' and 'word brain' that cannot talk. A multimodal transformer is built so the picture and the words meet in the same place.",
    },
    engineering: {
      title: "A chart-reading assistant for financial analysts",
      text: "An analytics firm wants analysts to paste a chart and ask 'what happened in Q3?'. A text-only model cannot see it; OCR loses the bars. They use a multimodal model: the chart becomes patch tokens, the question becomes text tokens, and attention links 'Q3' in the question to the right bars. The engineering lessons: resolution matters (small text in axes needs higher patch counts), and the model can hallucinate values between gridlines, so they add a second step that asks the model to read the axis labels explicitly before estimating values, and they show the estimate with a confidence note.",
    },
    maths: {
      formula: "image tokens = (H ÷ p) × (W ÷ p);   audio tokens ≈ seconds × frames per second;   sequence length = image tokens + audio tokens + text tokens",
      meaning: "p is the patch size in pixels. Modalities add to one sequence, so their token counts add to the cost.",
      worked: [
        "A 336 × 336 image with 14-pixel patches: (336 ÷ 14)² = 24² = 576 tokens.",
        "Ten seconds of audio at 25 frames per second after the encoder: 250 tokens.",
        "A 60-token question. Sequence length = 576 + 250 + 60 = 886 tokens; the question is under 7% of the cost.",
        "Doubling image resolution to 672 × 672 gives 48² = 2,304 image tokens: four times the image cost. Resolution is the main cost lever.",
      ],
    },
    code: {
      title: "Building one sequence from three modalities",
      lang: "py",
      src: `import numpy as np

def to_sequence(image_patches, audio_frames, text_tokens, proj_img, proj_aud, embed):
    # image_patches: (576, 1024), audio_frames: (250, 512), text_tokens: list of ids
    img = image_patches @ proj_img           # (576, d)   project into the model's size
    aud = audio_frames @ proj_aud            # (250, d)
    txt = embed[text_tokens]                 # (60, d)
    seq = np.concatenate([IMG_MARK, img, AUD_MARK, aud, txt], axis=0)
    return seq                               # (888, d): one sequence for one transformer`,
      lines: [
        { code: "img = image_patches @ proj_img           # (576, d)   project into the model's size", say: "The image encoder's vectors are resized by a learned projection so they match text vectors." },
        { code: "aud = audio_frames @ proj_aud            # (250, d)", say: "Same for audio: a different projection, the same target size." },
        { code: "seq = np.concatenate([IMG_MARK, img, AUD_MARK, aud, txt], axis=0)", say: "One sequence. Marker vectors tell the model where each modality starts." },
        { code: "return seq                               # (888, d): one sequence for one transformer", say: "From here on the transformer treats all 888 rows alike. That is the whole trick." },
      ],
    },
    useIt: "Use multimodal models for anything where the input is a picture, a document scan, a chart, audio or video and the answer needs language: support with photos, document understanding, accessibility descriptions, meeting assistants, robot instruction. Budget by token counts per modality; resolution and duration are the cost dials.",
    takeaways: ["Encoders turn each modality into vectors of one size; the transformer sees one sequence.", "Early fusion mixes deeply; late fusion extends a text model cheaply.", "Image tokens scale with resolution squared; audio with duration.", "Paired data (captions, transcripts) is what teaches the connections."],
    terms: [["modality", "a kind of input or output: text, image, audio, video"], ["patch", "a small square of an image treated as one token"], ["fusion", "where in the model the modalities are combined: early (shared stack) or late (cross-attention)"]],
    reflect: { q: "A multimodal model reads a bar chart and reports a bar as 42 when it is 38. Which part of the pipeline is most likely at fault?", a: "Not the attention but the resolution and the decoding of continuous values: at 576 patches a bar's top sits between gridlines, and the model guesses a plausible number. Higher resolution, an explicit axis-reading step, or a tool that extracts chart data fixes it; the model is doing vision, not measurement." },
  },

  "m47-vision-transformers": {
    simple: "A vision transformer cuts an image into small patches, treats each patch as a token, and runs a standard transformer over them, replacing the convolutions that image models used before.",
    concept:
      "Convolutional networks look at images through small sliding filters that build up from edges to objects. A **vision transformer** (ViT) does something that at first sounds too simple: split the image into a grid of patches, say 16 × 16 pixels each, flatten every patch into a vector, add a position embedding so the model knows where each patch sat, and feed the sequence into a plain transformer.\n\nAttention then lets every patch look at every other patch from the first layer. A patch of sky can relate to a patch of wing on the other side of the image immediately, where a convolution would need many layers to connect them. The model learns what to attend to from data rather than from the built-in locality of filters.\n\nViTs need more data than convolutional networks to learn the local structure that convolutions get for free, but given large datasets or good pretraining they match or beat them, and they share the architecture, tooling and scaling behaviour of language transformers, which is why they became the standard image encoder inside multimodal models.",
    why:
      "Convolutions encode an assumption: nearby pixels matter most. That assumption is right for edges and wrong for relationships across an image, and it tied vision to an architecture unlike the one winning in language. Teams wanted one architecture whose scaling laws, pretraining recipes and hardware kernels could be shared across text and images.\n\nThe ViT showed that with enough data the transformer learns locality itself and gains global context on top. It exists because unification was worth more than the built-in prior, once data was plentiful.",
    how: [
      "Resize the image to a fixed size, for example 224 × 224 pixels.",
      "Cut it into non-overlapping patches of p × p pixels; 16 × 16 gives 196 patches.",
      "Flatten each patch (16 × 16 × 3 colours = 768 numbers) and multiply by a learned matrix to get a token vector.",
      "Add a learned position embedding per patch position; attention has no sense of order otherwise.",
      "Prepend a special classification token (or pool at the end) and run the transformer layers.",
      "Read the answer from the classification token for labels, or keep all patch outputs as features for detection, segmentation or a multimodal model.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "image", detail: "224 × 224 × 3" },
        { label: "patches", detail: "14 × 14 grid of 16-pixel squares = 196 patches" },
        { label: "flatten + project", detail: "each 768-number patch → a 768-dimensional token" },
        { label: "add positions", detail: "token + position embedding for its grid cell" },
        { label: "transformer", detail: "12 layers of attention over 197 tokens (196 + class token)" },
        { label: "output", detail: "class token → label; patch tokens → features" },
      ],
      caption: "An image becomes a sentence of 196 'words'. Everything after that is the language transformer.",
    },
    everyday: {
      title: "A jigsaw puzzle laid out on a table",
      text: "Dump a jigsaw on a table and you can compare any two pieces, however far apart they belong. You match a bit of sky at one corner with sky at the other. A convolution is like only ever comparing pieces that are already touching. The vision transformer looks at the whole table from the start.",
    },
    engineering: {
      title: "Visual quality inspection on a production line",
      text: "A factory inspects circuit boards for defects. Their convolutional model caught local defects (a missing solder joint) but missed relational ones (a component present but rotated relative to its neighbour across the board). A ViT fine-tuned from a pretrained checkpoint catches both, because attention relates distant patches. The costs: they needed a pretrained model since 8,000 labelled boards is too few to train a ViT from scratch, and inference at 1024 × 1024 is heavy (4,096 patches), so they run a small ViT on tiles and a global pass at low resolution.",
    },
    maths: {
      formula: "patches = (H ÷ p) × (W ÷ p);   patch vector size = p × p × channels;   attention cost per layer ∝ patches²",
      meaning: "Patch size p sets both the number of tokens and how much detail each token carries.",
      worked: [
        "224 × 224 image, p = 16: (224 ÷ 16)² = 14² = 196 patches, each 16 × 16 × 3 = 768 numbers.",
        "Same image, p = 8: 28² = 784 patches. Attention cost per layer rises by (784 ÷ 196)² = 16×; detail per token halves in each direction.",
        "A 1024 × 1024 inspection image with p = 16: 64² = 4,096 patches; attention cost per layer (4,096 ÷ 196)² ≈ 437× that of the 224 image. Hence tiling.",
      ],
    },
    code: {
      title: "Patchify an image",
      lang: "py",
      src: `import numpy as np

def patchify(img, p=16):
    # img: (H, W, 3) array of pixels. Returns (num_patches, p*p*3).
    H, W, C = img.shape
    gh, gw = H // p, W // p
    img = img[: gh * p, : gw * p]                              # drop any remainder
    patches = img.reshape(gh, p, gw, p, C).transpose(0, 2, 1, 3, 4)
    return patches.reshape(gh * gw, p * p * C)

img = np.random.rand(224, 224, 3)
tokens = patchify(img)
print(tokens.shape)                                           # (196, 768)
tokens = tokens @ np.random.rand(768, 768)                    # learned projection in a real model
tokens = tokens + np.random.rand(196, 768)                    # position embeddings`,
      lines: [
        { code: "gh, gw = H // p, W // p", say: "How many patches fit across and down: 14 and 14 for a 224-pixel image." },
        { code: "patches = img.reshape(gh, p, gw, p, C).transpose(0, 2, 1, 3, 4)", say: "Regroup pixels so each p × p square with its colours sits together." },
        { code: "return patches.reshape(gh * gw, p * p * C)", say: "Flatten each square into one row: 196 rows of 768 numbers. These are the tokens." },
        { code: "tokens = tokens + np.random.rand(196, 768)                    # position embeddings", say: "Without positions the transformer could not tell top-left from bottom-right." },
      ],
      output: "(196, 768)",
    },
    useIt: "ViTs are the default image backbone: classification, detection and segmentation heads sit on top of them, and they are the vision encoder in nearly every multimodal language model. Fine-tune pretrained ViTs rather than training from scratch unless you have millions of images; choose patch size and resolution by the smallest detail you must see and the compute you can afford.",
    takeaways: ["An image becomes a sequence of patch tokens plus position embeddings; the rest is a plain transformer.", "Attention gives global context from the first layer; data must teach locality.", "Tokens scale with (resolution ÷ patch size)², attention with that squared.", "Pretrained ViTs are the standard image encoder, including inside multimodal models."],
    terms: [["patch embedding", "the learned projection from a flattened patch to a token vector"], ["position embedding", "a learned vector added to each token to encode where it was"], ["class token", "an extra token whose final output is used for classification"]],
    reflect: { q: "Why does a ViT trained from scratch on 50,000 images usually lose to a small convolutional network, while on 300 million images it wins?", a: "Convolutions build in the assumption that nearby pixels matter, which is right for images and lets a small network learn from little data. A ViT must learn that from examples; with few images it does not, with many it learns that and more, including long-range relations the convolution cannot easily express." },
  },

  "m47-diffusion-models": {
    simple: "A diffusion model generates images or audio by learning to remove noise: start from pure static and, step by step, predict and subtract the noise until a clear picture remains.",
    concept:
      "Teaching a model to draw a picture from nothing is hard. Teaching it to clean up a slightly noisy picture is much easier. A **diffusion model** turns the hard problem into many easy ones.\n\nTraining works forwards: take a real image, add a little random noise, add a little more, and so on for hundreds of steps until nothing but static remains. At every step the model is shown the noisy image and the step number and asked to predict the noise that was added. That is a supervised task with free labels, since the noise is known.\n\nGeneration runs the process backwards: start from pure static, ask the model what noise is present, subtract a fraction of it, repeat. After tens to hundreds of steps a coherent image appears, shaped by whatever conditioning was given: a text prompt, a sketch, a class label. The same recipe produces audio, video, molecules and robot motion plans, anything that can be represented as numbers that noise can be added to.",
    why:
      "Earlier generators had problems. GANs trained unstably and often produced a narrow range of images. Autoregressive pixel models were slow and hard to scale to large pictures. Diffusion exists because denoising is a stable, well-behaved training objective, the model sees every level of corruption during training, and quality rises steadily with model size and compute.\n\nThe cost is speed: generating needs many model calls. Much of the research since has been about doing it in fewer steps, and about running diffusion in a compressed latent space rather than on raw pixels.",
    how: [
      "Forward process: for step t from 1 to T, x_t = √(1 − β_t) · x_{t−1} + √β_t · ε, where ε is random noise and β_t a small schedule value.",
      "Training: pick a real image, a random t, add the corresponding noise in one shot, and train the network to predict ε from x_t and t.",
      "Conditioning: feed the text prompt's embedding into the network (by cross-attention) so predictions depend on it.",
      "Sampling: start with x_T = pure noise; for t = T down to 1, predict ε, compute a less noisy x_{t−1}, optionally add a little fresh noise.",
      "Guidance: run the prediction with and without the prompt and push the result in the direction of the prompted one to strengthen adherence.",
      "Latent diffusion: do all of the above on a compressed representation from an autoencoder, then decode to pixels, for a large speed-up.",
    ],
    visual: {
      kind: "flow",
      steps: ["pure noise x_T", "predict noise, subtract a bit → x_{T−1}", "… blurry shapes …", "… recognisable scene …", "x_0: a clean image", "decode from latent to pixels"],
      caption: "Every arrow is one call to the same network, given the current image and the step number. The prompt steers every call.",
    },
    everyday: {
      title: "Restoring an old photograph",
      text: "A restorer does not paint a lost photo from scratch; they look at the scratched, faded print and remove one kind of damage at a time, judging from what a photo like this should look like. Diffusion is a restorer so good it can start from a print that is nothing but damage, because at each stage it only needs to decide what the slightly cleaner version would be.",
    },
    engineering: {
      title: "Generating product photos in a studio style",
      text: "A retailer wants lifestyle images for 20,000 products without 20,000 photo shoots. They fine-tune a latent diffusion model on 3,000 of their own studio images paired with captions, then generate from prompts plus a conditioning image of the product on white. The engineering questions were practical: a step count of 30 balanced quality and cost at about two seconds per image; a guidance scale too high produced oversaturated, over-literal images; and an automated checker compares the generated product against the real one to reject images where the model altered the item's shape.",
    },
    maths: {
      formula: "x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε,   where ᾱ_t = Π_{s≤t} (1 − β_s);   loss = ‖ε − ε_θ(x_t, t)‖²",
      meaning: "ᾱ_t says how much of the original survives at step t. The model ε_θ predicts the noise; the loss is how wrong that prediction is.",
      worked: [
        "Suppose β is 0.02 per step. After 1 step ᾱ₁ = 0.98; after 50 steps ᾱ₅₀ = 0.98⁵⁰ ≈ 0.364; after 200 steps ᾱ₂₀₀ ≈ 0.018.",
        "At step 50, a pixel value of 0.8 becomes √0.364 × 0.8 + √0.636 × ε = 0.483 + 0.797 ε. Half signal, mostly noise.",
        "At step 200: √0.018 × 0.8 = 0.107 of signal plus √0.982 ≈ 0.991 of noise. Nearly pure static, which is why sampling can start from random numbers.",
        "If the model predicts ε̂ = 0.31 where the true ε was 0.35, the loss for that pixel is (0.35 − 0.31)² = 0.0016.",
      ],
    },
    code: {
      title: "One training step and one sampling loop, in miniature",
      lang: "py",
      src: `import numpy as np

T = 200
beta = np.full(T, 0.02)
alpha_bar = np.cumprod(1 - beta)

def add_noise(x0, t, eps):
    return np.sqrt(alpha_bar[t]) * x0 + np.sqrt(1 - alpha_bar[t]) * eps

def train_step(model, x0):
    t = np.random.randint(T)                  # a random corruption level
    eps = np.random.randn(*x0.shape)          # the noise we will add (the label)
    x_t = add_noise(x0, t, eps)
    pred = model(x_t, t)
    return np.mean((eps - pred) ** 2)         # how wrong the noise prediction was

def sample(model, shape):
    x = np.random.randn(*shape)               # start from pure noise
    for t in reversed(range(T)):
        eps_hat = model(x, t)
        x0_hat = (x - np.sqrt(1 - alpha_bar[t]) * eps_hat) / np.sqrt(alpha_bar[t])
        x = add_noise(x0_hat, t - 1, np.random.randn(*shape)) if t > 0 else x0_hat
    return x`,
      lines: [
        { code: "alpha_bar = np.cumprod(1 - beta)", say: "How much original signal survives at each step; it falls toward zero." },
        { code: "eps = np.random.randn(*x0.shape)          # the noise we will add (the label)", say: "The label is free: we made the noise, so we know it exactly." },
        { code: "return np.mean((eps - pred) ** 2)         # how wrong the noise prediction was", say: "Plain mean squared error between true and predicted noise. That is the whole training objective." },
        { code: "x = np.random.randn(*shape)               # start from pure noise", say: "Generation begins from static." },
        { code: "x0_hat = (x - np.sqrt(1 - alpha_bar[t]) * eps_hat) / np.sqrt(alpha_bar[t])", say: "Undo the noise formula to estimate the clean image, then re-noise it to the next lower level." },
      ],
      note: "Real samplers use smarter update rules to need 20–50 steps instead of 200; the structure is the same.",
    },
    useIt: "Diffusion is the standard for image, video and audio generation, image editing (inpainting, style transfer), super-resolution, and increasingly for molecules and robot motion. Use latent diffusion for speed; tune step count and guidance; add automated checks on outputs; fine-tune on your own paired data for a house style.",
    takeaways: ["Train to predict added noise at every corruption level; generate by removing noise from static step by step.", "Free labels and a stable objective are why it beat GANs.", "Conditioning steers every step; guidance strengthens prompt adherence.", "Latent diffusion and better samplers make it fast enough to ship."],
    terms: [["forward process", "gradually adding noise to data over many steps"], ["denoising", "predicting and removing the noise at one step"], ["guidance", "mixing conditional and unconditional predictions to follow the prompt more strongly"], ["latent diffusion", "running diffusion in a compressed space and decoding at the end"]],
    reflect: { q: "Why train the network to predict the noise rather than the clean image directly?", a: "Both are possible and related by the noise formula, but predicting noise gives a target of fixed scale at every step, which trains more stably, and at high-noise steps the clean image is nearly unknowable while the noise still has a well-defined expectation. Modern variants predict a blend of the two." },
  },

  "m47-encoder-decoder-advances": {
    simple: "Encoder-decoder models read the input fully with one stack and write the output with another; recent advances make that split pay off again for translation, speech, retrieval and multimodal tasks.",
    concept:
      "The original transformer had two stacks. The **encoder** reads the whole input with attention in both directions, producing a rich representation. The **decoder** writes the output token by token, attending to its own past tokens and, through **cross-attention**, to the encoder's representation. Decoder-only models dropped the encoder and became the standard for chat, because one stack is simpler to scale and pretrain on raw text.\n\nThe split never stopped being useful where input and output are different things. Speech-to-text reads audio and writes text. Translation benefits from reading the whole source bidirectionally. Retrieval needs an encoder that turns documents into vectors. Multimodal models often use an encoder for images and a decoder for words. Recent advances made the encoder-decoder shape competitive again: pretraining encoders with masked or contrastive objectives, sharing weights between stacks, mixing in MoE, and attaching modality-specific encoders to a strong text decoder.\n\nThe modern picture is less 'encoder-decoder versus decoder-only' than 'which parts of the job need a reader and which a writer'.",
    why:
      "Decoder-only models process the input the same way they write the output, left to right. For some tasks that wastes capacity: the input could be read all at once, both ways, with no need to predict it. And decoding over a very long input repeats the full attention over it at every output token.\n\nEncoder-decoder advances exist because a reader that compresses the input once, and a writer that attends to that compressed form, is more efficient and often more accurate for input-to-output tasks, and because new encoders (vision, audio, retrieval) needed a principled way to connect to the language decoders everyone already had.",
    how: [
      "Encoder: process the input with bidirectional attention; every position sees every other. Output one vector per input position.",
      "Decoder: generate output tokens left to right with causal self-attention.",
      "Cross-attention: in each decoder layer, let the output tokens attend to the encoder's vectors; this is how the output stays faithful to the input.",
      "Pretrain the encoder on its own (masked prediction for text, contrastive pairs for images and audio) so it learns before the decoder is attached.",
      "Attach modality encoders to a pretrained text decoder with a small adapter; train the adapter and optionally fine-tune the rest.",
      "For long inputs, encode once and decode many tokens against the fixed encoding; the input is never re-read per output token.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Decoder-only", points: ["one stack, causal attention", "input and output in the same sequence", "simplest to pretrain on raw text", "re-attends to the whole input for every output token"] },
      right: { title: "Encoder-decoder", points: ["reader (bidirectional) + writer (causal)", "cross-attention links them", "encoder can be pretrained separately, including on images or audio", "input encoded once; writer attends to the encoding"] },
      caption: "Chat favours one stack. Translation, speech, retrieval and multimodal input favour a reader plus a writer.",
    },
    everyday: {
      title: "An interpreter at a conference",
      text: "A good interpreter listens to a whole sentence, sometimes a whole thought, before speaking; they build an understanding (encoder) and then produce the translation (decoder), glancing back at their notes of the source as they speak (cross-attention). Someone who translated word by word as the speaker went, never looking ahead, would be the decoder-only version, and would mangle every sentence whose word order differs between languages.",
    },
    engineering: {
      title: "Rebuilding a speech-to-text service",
      text: "A transcription company replaced a pipeline of acoustic model plus language model with one encoder-decoder transformer: an audio encoder trained on 600,000 hours of speech, a text decoder, cross-attention between them. The same model also translates speech into other languages by changing a task token. Advances they relied on: the encoder pretrained with a contrastive objective before supervised training, and a decoder initialised from a text language model so it already knew spelling and grammar. Word error rate fell by a third; the biggest remaining errors were on rare proper names, which they handle by biasing the decoder toward a customer-supplied vocabulary.",
    },
    maths: {
      formula: "decoder-only cost over input length L_in and output length L_out ∝ (L_in + L_out)²;   encoder-decoder ∝ L_in² + L_out × L_in + L_out²",
      meaning: "The encoder pays the input's quadratic cost once; the decoder's cross-attention is linear in input length per output token.",
      worked: [
        "A 10,000-token document, 200-token summary. Decoder-only: (10,200)² ≈ 1.04 × 10⁸.",
        "Encoder-decoder: 10,000² + 200 × 10,000 + 200² = 10⁸ + 2 × 10⁶ + 4 × 10⁴ ≈ 1.02 × 10⁸. Similar here, because the output is short.",
        "Same document, generating 10,000 tokens of translation. Decoder-only: 20,000² = 4 × 10⁸. Encoder-decoder: 10⁸ + 10⁸ + 10⁸ = 3 × 10⁸, and the encoder part can be cached across many outputs.",
        "The advantage grows with output length and with the number of outputs produced from one input.",
      ],
    },
    useIt: "Choose encoder-decoder shapes for translation, speech recognition and translation, summarisation of long documents, retrieval (encoders alone), and any multimodal input: an encoder per modality attached to a text decoder. Keep decoder-only for open-ended chat and code. Reuse pretrained encoders and decoders and train the connection between them.",
    takeaways: ["Encoder reads bidirectionally; decoder writes causally; cross-attention links them.", "The split pays when input and output differ in kind or when one input yields long or many outputs.", "Pretrained encoders (text, image, audio) attach to pretrained decoders with small adapters.", "Chat went decoder-only; speech, translation, retrieval and multimodal input did not."],
    terms: [["encoder", "the stack that reads the input with bidirectional attention"], ["decoder", "the stack that writes the output token by token"], ["cross-attention", "decoder attention over the encoder's outputs"], ["adapter", "a small trained layer connecting a pretrained encoder to a pretrained decoder"]],
    reflect: { q: "Decoder-only chat models can translate and summarise well. Why keep a separate encoder at all?", a: "For efficiency and for inputs that are not text. The encoder reads once, bidirectionally, and can be pretrained on audio or images where left-to-right prediction makes no sense; the decoder then writes against that encoding without re-reading it per token. For pure text chat the separate reader buys little, which is why chat went decoder-only." },
  },
};

export const M47_QUIZ: Quiz[] = [
  {
    q: "A mixture-of-experts model has 8 experts of 400M parameters each, 100M shared parameters per layer, and routes top-2. Per layer, how do total and active parameters compare?",
    options: ["Both 3.3B", "Total 3.3B, active 900M", "Total 900M, active 3.3B", "Both 900M"],
    answer: 1,
    why: ["Active counts only the experts that run.", "Correct. Total = 100M + 8 × 400M = 3.3B; active = 100M + 2 × 400M = 900M.", "Total is always at least active.", "Total includes all eight experts whether they run or not."],
    reason: true,
  },
  {
    q: "A pruned network has 70% of its weights set to zero but runs no faster on a laptop CPU. Why?",
    options: ["Pruning never speeds anything up", "The CPU still multiplies by the zeros; sparsity saves compute only when hardware or structure skips them", "The model was not sparse enough", "Zeros take more memory"],
    answer: 1,
    why: ["It does on hardware that skips zeros.", "Correct. Sparsity is a saving only where the idle parts are actually skipped.", "More zeros would not help a CPU that multiplies them anyway.", "Zeros can be stored compactly; memory is not the issue."],
  },
  {
    q: "Why does a mixture of experts need a load-balancing loss?",
    options: ["To make experts identical", "Because the router would otherwise send most tokens to a few experts, wasting capacity and overloading those experts' GPUs", "To reduce the number of experts", "To make the softmax differentiable"],
    answer: 1,
    why: ["Experts should specialise, not match.", "Correct. Without it routing collapses: under-trained experts and uneven serving load.", "It does not change expert count.", "The softmax is already differentiable; the top-k selection is what is not."],
  },
  {
    q: "What does a state space model trade away in exchange for linear cost over sequence length?",
    options: ["Training stability", "Exact lookup of specific earlier tokens, which must now survive compressed in a fixed-size state", "The ability to process audio", "Parallel training"],
    answer: 1,
    why: ["Modern SSMs train stably.", "Correct. A fixed state cannot keep everything verbatim; attention can.", "Audio is where SSMs are strongest.", "Fixed SSMs train as convolutions; Mamba uses a parallel scan."],
    reason: true,
  },
  {
    q: "What single change turned fixed state space models into Mamba?",
    options: ["Adding attention to every layer", "Making the update matrices depend on the current input, so the model chooses per token what to remember", "Removing the state", "Using convolutions"],
    answer: 1,
    why: ["Mamba has no attention.", "Correct. Selectivity: per-token Δ, B and C.", "The state is the whole mechanism.", "Fixed SSMs used the convolution view; Mamba had to give it up."],
  },
  {
    q: "A hybrid model keeps attention in one of every eight layers. Roughly how does its length-dependent cost compare with a full transformer of the same depth?",
    options: ["The same", "About one eighth", "About eight times", "Zero"],
    answer: 1,
    why: ["Only the attention layers pay the quadratic cost.", "Correct. With 4 of 32 layers using attention, the quadratic term is 4/32 of the transformer's.", "Fewer attention layers cannot cost more.", "The attention layers still pay it."],
  },
  {
    q: "How does a vision transformer turn an image into tokens?",
    options: ["It runs OCR on the image", "It cuts the image into fixed-size patches, flattens each, projects it to a vector and adds a position embedding", "It converts each pixel into one token", "It uses a convolutional network to produce one token"],
    answer: 1,
    why: ["Patches, not text.", "Correct. 224 × 224 with 16-pixel patches gives 196 tokens plus positions.", "One token per pixel would be 50,176 tokens; far too many.", "A plain ViT uses a linear patch projection, not a convolutional stack."],
  },
  {
    q: "What is the training objective of a diffusion model?",
    options: ["Predict the next pixel", "Predict the noise that was added to a corrupted example at a random step", "Fool a discriminator", "Reconstruct the image from a compressed code"],
    answer: 1,
    why: ["That is autoregressive generation.", "Correct. The noise is known, so the label is free, and the loss is a plain squared error.", "That is a GAN.", "That is an autoencoder; latent diffusion uses one but the diffusion objective is noise prediction."],
    reason: true,
  },
  {
    q: "For which task does an encoder-decoder shape clearly beat decoder-only on efficiency?",
    options: ["Open-ended chat", "Producing a 10,000-token translation of a 10,000-token document", "Writing a short poem", "Classifying a single word"],
    answer: 1,
    why: ["Chat favours one stack.", "Correct. The encoder reads the input once; the decoder attends to the encoding instead of re-attending to the whole input per output token.", "Short outputs barely benefit.", "No generation involved."],
  },
];

export const M47_EXERCISES: Exercise[] = [
  {
    title: "Size a mixture-of-experts model",
    kind: "calculate",
    task: "A 32-layer model has 150M attention parameters per layer. You want 16 experts of 300M each per layer with top-2 routing. Compute total parameters, active parameters per token, the sparsity, and the GPU memory to hold the weights in 16-bit (2 bytes per parameter). Then say which number limits latency and which limits the hardware you can deploy on.",
    hints: ["total per layer = attention + experts × size; active = attention + k × size", "memory = total × 2 bytes"],
    solution: "Per layer: total = 150M + 16 × 300M = 4.95B; active = 150M + 2 × 300M = 750M. Over 32 layers: total 158.4B, active 24B. Sparsity = 1 − 24 ÷ 158.4 ≈ 0.85. Memory at 2 bytes: 158.4B × 2 ≈ 317 GB, so a multi-GPU server (for example four 80 GB cards) is required. Latency is governed by the 24B active parameters (comparable to a 24B dense model); deployability is governed by the 317 GB.",
  },
  {
    title: "Trace a selective scan by hand",
    kind: "calculate",
    task: "Using A = −1 and the rule Ā = exp(Δ·A), B̄ = Δ, run the state h through inputs x = [4, 1, 1, 9] where the model outputs Δ = 2 for inputs above 3 and Δ = 0.1 otherwise. Start at h = 0. Give h after each step to three decimals and explain in one sentence what the model 'decided'.",
    hints: ["Δ = 2 → Ā = e⁻² ≈ 0.135; Δ = 0.1 → Ā = e⁻⁰·¹ ≈ 0.905"],
    solution: "Step 1 (x = 4, Δ = 2): h = 0.135 × 0 + 2 × 4 = 8.000. Step 2 (x = 1, Δ = 0.1): h = 0.905 × 8 + 0.1 × 1 = 7.340. Step 3 (x = 1): h = 0.905 × 7.34 + 0.1 = 6.743. Step 4 (x = 9, Δ = 2): h = 0.135 × 6.743 + 18 = 18.910. The model held the first important input through the two quiet steps with slow decay, then largely overwrote it with the next important one.",
  },
  {
    title: "Budget image tokens for a chart reader",
    kind: "calculate",
    task: "A multimodal model uses 14-pixel patches. Analysts upload charts at 448 × 448, and axis labels are only legible at 896 × 896. Compute the image tokens at both resolutions and the attention cost ratio between them. Propose a design that reads the labels without paying the full cost on every chart.",
    hints: ["tokens = (side ÷ 14)²; attention cost ∝ tokens²"],
    solution: "448 ÷ 14 = 32 → 1,024 tokens. 896 ÷ 14 = 64 → 4,096 tokens, four times as many; attention cost ratio (4,096 ÷ 1,024)² = 16×. Design: run the 448 pass for layout and bars, crop the axis regions and run only those crops at high resolution (a few hundred tokens each), or extract axis text with a small OCR tool and pass it as text tokens. Pay for detail only where detail lives.",
  },
  {
    title: "Pick an architecture for three products",
    kind: "think",
    task: "For each, choose dense transformer, MoE transformer, pure SSM/Mamba, hybrid, ViT, diffusion or encoder-decoder, and justify in two sentences: (a) a phone keyboard autocomplete that must run on-device; (b) a genomics model reading 2-million-base sequences to flag variants; (c) a service that generates background music from a text description; (d) a contract assistant that must quote clauses exactly from 300-page documents; (e) a live interpreter for conference speech.",
    hints: ["Memory on-device is tiny; sparsity needs memory.", "Exact quotation needs attention somewhere; linear cost needs SSM somewhere."],
    solution: "(a) Small dense transformer: on-device memory is the constraint, and MoE's total parameters would not fit; a dense model of the active size is simplest. (b) Pure SSM/Mamba or a hybrid with sparse attention: 2M tokens makes attention's quadratic cost impossible; variant flagging is pattern detection, not exact recall, so SSM suits it. (c) Diffusion (latent, conditioned on a text encoder): generation of continuous audio from a description is diffusion's home ground. (d) Hybrid: mostly linear layers to afford the length, with attention layers plus a retrieval step for exact clause quotation. (e) Encoder-decoder: an audio encoder reading each utterance and a text decoder writing the translation through cross-attention, initialised from pretrained parts.",
  },
];
