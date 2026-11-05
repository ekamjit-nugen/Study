import type { Exercise, LessonBody, Quiz } from "../types";

// Module 49: Advanced training and research. One concept per lesson.
// Keys are lesson slugs: m49-<kebab of the concept title in map.ts>.

export const M49_BODIES: Record<string, LessonBody> = {
  "m49-distributed-model-training": {
    simple: "Distributed training spreads one model's training across many GPUs and machines because a large model and its data no longer fit on, or finish in time on, one.",
    concept:
      "A modern large model has tens or hundreds of billions of parameters and trains on trillions of tokens. One GPU holds perhaps 80 GB and does a fixed number of operations per second. The weights alone of a 70-billion-parameter model in 16-bit take 140 GB; the optimiser state triples that. Training on one card is impossible for memory, and for time it would take decades.\n\n**Distributed training** splits the job across many GPUs, connected by fast links, so that together they hold the model and share the work. There are three things that can be split: the data (each GPU trains on different examples), the model's layers (each GPU holds some layers), and the maths inside a layer (each GPU holds a slice of a big matrix). Real training runs combine all three.\n\nThe cost of splitting is communication: GPUs must exchange gradients, activations or weight slices every step, and the network can become the bottleneck. Distributed training engineering is mostly about keeping the GPUs busy computing rather than waiting for each other.",
    why:
      "Model quality improved with size and data, so the models people wanted outgrew any single machine. A run that takes 10,000 GPU-days must be spread over thousands of GPUs to finish in weeks. Distributed training exists because the alternative is either smaller models or training runs that outlast their usefulness.\n\nIt also exists at small scale: fine-tuning a 7-billion-parameter model on four consumer GPUs uses the same ideas.",
    how: [
      "Decide what to split: data (easiest, if the model fits on one GPU), layers (pipeline), or matrices (tensor), or a mix.",
      "Place the pieces: group GPUs so that the most communication-heavy splits (tensor) stay within one machine's fast links, and the lighter ones (data) span machines.",
      "Each step: every GPU computes its share of the forward and backward pass.",
      "Synchronise: gradients are averaged across data-parallel GPUs; activations are passed between pipeline stages; partial results are gathered across tensor slices.",
      "The optimiser updates the weights, each GPU updating the shard it owns.",
      "Checkpoint regularly across all GPUs, because at thousands of GPUs something fails every few hours.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Split", "Each GPU holds", "What is communicated", "Good for"],
        rows: [
          ["data parallel", "a full copy of the model; different data", "gradients, once per step", "models that fit on one GPU; scaling throughput"],
          ["tensor parallel", "a slice of every layer's matrices", "partial activations, many times per layer", "layers too big for one GPU; needs fast links"],
          ["pipeline parallel", "a block of consecutive layers", "activations between stages, once per micro-batch", "deep models; tolerates slower links"],
          ["all three (3D)", "a slice of some layers, for some data", "all of the above", "frontier-scale runs on thousands of GPUs"],
        ],
      },
      caption: "The three axes of splitting. Large runs use all of them at once, arranged so heavy traffic stays on fast links.",
    },
    everyday: {
      title: "Building a stadium with many crews",
      text: "One crew cannot build a stadium in a year. You can give several crews identical plans and different sections to build (data parallel), assign the foundations to one crew and the roof to another in sequence (pipeline), or have several crews work on the same huge beam at once (tensor). Each arrangement needs the crews to talk, and a site where everyone waits for one truck is a site running at the speed of that truck.",
    },
    engineering: {
      title: "A 30-billion-parameter pretraining run on 256 GPUs",
      text: "A research lab trains a 30B model on 1 trillion tokens. Each machine has 8 GPUs on fast internal links; 32 machines are joined by a slower network. They use tensor parallelism of 8 within each machine (each layer's matrices sliced eight ways), pipeline parallelism of 4 across groups of machines, and data parallelism of 8 across the remaining groups: 8 × 4 × 8 = 256. GPU utilisation reaches 45% of peak; the rest is communication and pipeline bubbles. A hardware failure every 9 hours on average makes checkpointing every 30 minutes essential; the run takes six weeks.",
    },
    maths: {
      formula: "GPUs needed ≥ total memory ÷ memory per GPU;   time ≈ total FLOPs ÷ (GPUs × FLOPs per second × utilisation);   training FLOPs ≈ 6 × parameters × tokens",
      meaning: "Memory sets the minimum number of GPUs; compute and utilisation set the time.",
      worked: [
        "A 30B model in mixed precision needs about 16 bytes per parameter for weights, gradients and optimiser state: 30B × 16 = 480 GB. On 80 GB GPUs: at least 6, before activations; in practice 16 or more.",
        "FLOPs for 1 trillion tokens: 6 × 30 × 10⁹ × 10¹² = 1.8 × 10²³.",
        "256 GPUs at 10¹⁵ FLOP/s each and 45% utilisation: 256 × 10¹⁵ × 0.45 = 1.15 × 10¹⁷ per second. Time = 1.8 × 10²³ ÷ 1.15 × 10¹⁷ ≈ 1.56 × 10⁶ s ≈ 18 days of pure compute; with failures and restarts, about six weeks.",
      ],
      note: "The 6 × parameters × tokens rule covers forward and backward passes; it is the standard back-of-envelope estimate.",
    },
    code: {
      title: "The shape of a distributed training step",
      lang: "py",
      src: `def train_step(model_shard, batch_shard, optimizer, groups):
    # every GPU runs this same function on its own shard of the model and of the data
    activations = forward(model_shard, batch_shard, groups.tensor)   # tensor-parallel partials gathered inside
    send_to_next_stage(activations, groups.pipeline)                 # pipeline: hand activations to the next block of layers
    grads = backward(model_shard, groups.tensor)
    grads = all_reduce_mean(grads, groups.data)                      # data-parallel: average gradients across replicas
    optimizer.step(model_shard, grads)                               # each GPU updates the weights it owns
    if step_count % 1000 == 0:
        save_checkpoint_shard(model_shard, optimizer, rank)          # all shards together form one checkpoint`,
      lines: [
        { code: "activations = forward(model_shard, batch_shard, groups.tensor)   # tensor-parallel partials gathered inside", say: "Within a machine, each GPU computes part of every layer and they combine results many times per layer." },
        { code: "send_to_next_stage(activations, groups.pipeline)                 # pipeline: hand activations to the next block of layers", say: "Across machines, the output of one block of layers is the input of the next GPU group's block." },
        { code: "grads = all_reduce_mean(grads, groups.data)                      # data-parallel: average gradients across replicas", say: "Replicas that saw different data agree on one gradient by averaging. This is the data-parallel sync." },
        { code: "save_checkpoint_shard(model_shard, optimizer, rank)          # all shards together form one checkpoint", say: "A checkpoint is spread over every GPU; losing one machine without it means losing the run." },
      ],
      note: "Frameworks hide this behind configuration flags, but every flag maps to one of these lines.",
    },
    useIt: "You meet distributed training when pretraining or fully fine-tuning anything above a few billion parameters, and the same ideas (sharded optimiser state, data parallelism) make multi-GPU fine-tuning of mid-size models practical. Size the run with the memory and FLOP arithmetic first, arrange heavy communication on fast links, and plan for failures with frequent checkpoints.",
    takeaways: ["Split data, layers or matrices across GPUs; big runs split all three.", "Communication is the cost; keep heavy traffic on fast links and GPUs busy.", "Memory sets the minimum GPU count; FLOPs and utilisation set the time.", "At scale, failures are routine; checkpoint often."],
    terms: [["shard", "the piece of the model, data or optimiser state one GPU owns"], ["all-reduce", "a collective operation that combines values from all GPUs and gives everyone the result"], ["utilisation", "the fraction of peak compute actually used; the rest is waiting"]],
    reflect: { q: "Why not just use data parallelism for everything, since it is the simplest?", a: "Because it requires every GPU to hold a full copy of the model and optimiser state, which is impossible once that exceeds one GPU's memory, and because averaging very large gradients across thousands of GPUs every step saturates the network. The other splits exist to break those two limits." },
  },

  "m49-data-parallelism": {
    simple: "Data parallelism gives every GPU a full copy of the model and a different slice of each batch, then averages their gradients so all copies learn the same thing.",
    concept:
      "**Data parallelism** is the simplest way to use many GPUs: replicate the model. Each GPU holds identical weights, takes a different portion of the batch, runs the forward and backward pass on its portion, and produces gradients from its data alone. Then all GPUs average their gradients so every copy applies the same update and stays identical.\n\nThe effect is a bigger batch processed in the same time. Eight GPUs each handling 32 examples equal one GPU handling 256, step for step. Throughput scales with the number of GPUs, minus the time spent averaging.\n\nThe limit is memory: every GPU must hold the whole model, its gradients and the optimiser state. A refinement, sharded data parallelism, splits the optimiser state and even the weights across GPUs and gathers them just in time, keeping the data-parallel structure while fitting much larger models.",
    why:
      "Training time is proportional to the number of examples processed, and one GPU processes a fixed number per second. Data parallelism exists to multiply that rate with more GPUs while keeping the algorithm identical to single-GPU training: the same model, the same loss, just a larger effective batch. It is the first thing to reach for when a model fits on one card but training is too slow.",
    how: [
      "Copy the model's initial weights to every GPU.",
      "Split each global batch into equal shards, one per GPU.",
      "Each GPU runs forward and backward on its shard, producing local gradients.",
      "All-reduce: sum the gradients across GPUs and divide by the count, so every GPU holds the average.",
      "Each GPU applies the same optimiser update; the copies remain identical.",
      "With sharding (ZeRO / FSDP), each GPU keeps only its slice of optimiser state and weights and gathers slices before use, trading communication for memory.",
    ],
    visual: {
      kind: "flow",
      steps: ["global batch of 256", "GPU 0: examples 0–63", "GPU 1: 64–127, GPU 2: 128–191, GPU 3: 192–255", "each: forward, backward → local gradient", "all-reduce: average the 4 gradients", "every GPU applies the same update"],
      caption: "Four identical models, four quarters of the batch, one shared update. The all-reduce is the only step that needs the network.",
    },
    everyday: {
      title: "Four students marking the same exam",
      text: "A teacher gives four students a quarter of the exam papers each and asks them to note how the marking scheme should change. Each reports what they learned from their papers; they average the suggestions and all adopt the same revised scheme. Every student ends with the same scheme, having each read only a quarter of the papers. That is data parallelism.",
    },
    engineering: {
      title: "Fine-tuning a 7B model on four GPUs",
      text: "A team fine-tunes a 7-billion-parameter model on 24 GB consumer GPUs. The model's weights in 16-bit are 14 GB, and full optimiser state would need another 56 GB, far over a card. Plain data parallelism cannot fit. With sharded data parallelism each GPU holds a quarter of the weights, gradients and optimiser state (about 23 GB total per card) and gathers the weights of each layer just before computing it. Throughput is about 3.4× a single GPU, not 4×, because of the gathers; without sharding the job could not run at all.",
    },
    maths: {
      formula: "memory per GPU (plain) = weights + gradients + optimiser ≈ 16 bytes × parameters;   sharded over N GPUs ≈ 16 bytes × parameters ÷ N (+ gathered layer);   effective batch = per-GPU batch × N",
      meaning: "The 16 bytes per parameter is a mixed-precision rule of thumb: 2 for weights, 2 for gradients, 12 for a 32-bit master copy and two optimiser moments.",
      worked: [
        "7B parameters × 16 bytes = 112 GB. Plain data parallelism needs 112 GB per GPU: impossible on 24 GB cards.",
        "Sharded over 4 GPUs: 112 ÷ 4 = 28 GB per GPU for state, still slightly over 24 GB; with 8-bit optimiser moments (10 bytes per parameter → 70 GB ÷ 4 = 17.5 GB) it fits, leaving room for activations.",
        "Effective batch: 4 GPUs × 8 examples = 32 examples per step; the learning rate is usually scaled when the effective batch grows.",
      ],
    },
    code: {
      title: "Data parallelism in a few explicit lines",
      lang: "py",
      src: `def data_parallel_step(model, batch, world_size, rank):
    shard = batch[rank::world_size]                     # this GPU's slice of the global batch
    loss = compute_loss(model, shard)
    grads = backward(loss)                              # gradients from this slice only
    for g in grads:
        all_reduce(g, op="sum")                         # every GPU now holds the sum over all slices
        g /= world_size                                 # turn the sum into the average
    optimizer_step(model, grads)                        # identical update on every GPU
    return loss`,
      lines: [
        { code: "shard = batch[rank::world_size]                     # this GPU's slice of the global batch", say: "GPU number rank takes every world_size-th example: disjoint slices, same size." },
        { code: "grads = backward(loss)                              # gradients from this slice only", say: "Local gradients reflect only the examples this GPU saw." },
        { code: "all_reduce(g, op=\"sum\")                         # every GPU now holds the sum over all slices", say: "The one network operation: sum across all GPUs, result delivered to all." },
        { code: "optimizer_step(model, grads)                        # identical update on every GPU", say: "Because the averaged gradient is identical everywhere, the model copies stay in lockstep." },
      ],
    },
    useIt: "Use data parallelism whenever training is too slow and the model fits (or nearly fits) on one GPU; use its sharded form to fine-tune models several times larger than one GPU's memory. Scale the learning rate with the effective batch, watch the all-reduce time, and pair with tensor or pipeline parallelism only when a single layer or the depth no longer fits.",
    takeaways: ["Replicate the model, split the data, average the gradients.", "Throughput scales with GPUs; the algorithm is unchanged except for a larger batch.", "Plain form needs the whole model per GPU; sharded form (ZeRO/FSDP) splits state to fit larger models.", "All-reduce is the only communication; its cost grows with model size."],
    terms: [["replica", "one full copy of the model on one GPU"], ["effective batch", "the total examples per step across all GPUs"], ["sharded data parallelism (ZeRO / FSDP)", "data parallelism with optimiser state, gradients and weights split across GPUs"]],
    reflect: { q: "Two data-parallel GPUs start from identical weights. After a thousand steps, could they ever differ?", a: "In principle no, since they apply identical averaged updates; in practice tiny floating-point differences in reduction order can accumulate, so frameworks either make the reduction deterministic or periodically re-broadcast the weights from one rank to keep replicas exactly in sync." },
  },

  "m49-tensor-parallelism-in-training": {
    simple: "Tensor parallelism splits the matrices inside a single layer across GPUs, so a layer too large for one GPU can be computed by several working on slices at once.",
    concept:
      "A transformer layer's weight matrices can be enormous: a feedforward block in a large model may be a 12,288 × 49,152 matrix, 2.4 GB in 16-bit, and there are dozens of them. **Tensor parallelism** cuts such a matrix into slices, column-wise or row-wise, and gives each GPU a slice. Each GPU multiplies the input by its slice, producing part of the output; the partial outputs are then combined (concatenated or summed) so the next operation sees the full result.\n\nAttention splits naturally by heads: with 64 heads and 8 GPUs, each GPU computes 8 heads. The feedforward block splits its first matrix by columns and its second by rows, so that only one combination step is needed per block.\n\nBecause every layer needs its partial results combined, tensor parallelism communicates many times per step and only works well between GPUs on very fast links, typically the 8 GPUs inside one machine. It is used for the layers that cannot otherwise fit, not for scaling throughput.",
    why:
      "Data parallelism needs the whole model per GPU; pipeline parallelism needs each layer to fit on one GPU. When a single layer's matrices are larger than a GPU's memory, or when the arithmetic of one layer is too slow on one card, neither helps. Tensor parallelism exists for exactly that case: the layer itself must be shared.",
    how: [
      "For a matrix W used as y = xW, split W into column slices W₁ … Wₙ, one per GPU.",
      "Broadcast the input x to all GPUs; each computes yᵢ = xWᵢ, a slice of the output.",
      "For the next matrix V used as z = yV, split V into row slices Vᵢ so that zᵢ = yᵢVᵢ is a partial sum.",
      "All-reduce the partial sums zᵢ across GPUs to get z. One communication per pair of matrices.",
      "Split attention by heads: each GPU computes its heads' queries, keys, values and outputs; combine at the output projection.",
      "Keep all tensor-parallel GPUs inside one machine so the many all-reduces run over the fastest links.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "input x", detail: "copied to all 4 GPUs" },
        { label: "first matrix, column slices", detail: "GPU i computes yᵢ = x Wᵢ (a quarter of the hidden units)" },
        { label: "activation", detail: "applied elementwise on each GPU; no communication" },
        { label: "second matrix, row slices", detail: "GPU i computes partial zᵢ = yᵢ Vᵢ" },
        { label: "all-reduce", detail: "z = z₁ + z₂ + z₃ + z₄ on every GPU" },
      ],
      caption: "One feedforward block on four GPUs with a single all-reduce. The column-then-row split is what makes one communication enough.",
    },
    everyday: {
      title: "Four accountants adding one enormous ledger",
      text: "A ledger has a million rows and four accountants. Each takes a quarter of the rows, adds them, and the four subtotals are added at the end. No accountant ever sees the whole ledger, and only one exchange is needed. If instead each row's total depended on a neighbour's, they would be passing notes constantly. Tensor parallelism works because matrix multiplication splits like the ledger, not like the neighbours.",
    },
    engineering: {
      title: "Fitting a 175-billion-parameter model's layers on 8 GPUs",
      text: "Each feedforward matrix of a 175B model is about 2.4 GB and each layer about 3.6 GB of weights; with activations for a long sequence a single layer's working memory exceeds a GPU. The team splits every layer eight ways across the 8 GPUs of one machine: 0.45 GB of weights per layer per GPU. Inside the machine the GPUs talk at 900 GB/s, so the two all-reduces per layer cost a few percent of step time. Trying the same split across two machines over a 50 GB/s network made the all-reduces dominate and halved throughput; tensor parallelism stayed within the box.",
    },
    maths: {
      formula: "memory per GPU for a layer ≈ layer parameters ÷ N;   all-reduce volume per layer ≈ 2 × batch × sequence × hidden × 2 bytes;   communication time = volume ÷ bandwidth",
      meaning: "Memory divides by the number of slices; communication volume depends on activations, not on weights, and recurs every layer.",
      worked: [
        "Hidden size 12,288, batch 1, sequence 2,048, 16-bit: activation tensor = 2,048 × 12,288 × 2 bytes ≈ 50 MB; two all-reduces per layer ≈ 100 MB; 96 layers ≈ 9.6 GB per step.",
        "On 900 GB/s intra-machine links: 9.6 GB ÷ 900 GB/s ≈ 11 ms per step. Acceptable against a step of several hundred ms.",
        "On a 50 GB/s inter-machine network: 9.6 ÷ 50 ≈ 190 ms per step, comparable to the compute itself. Throughput roughly halves.",
      ],
    },
    code: {
      title: "A feedforward block split across GPUs",
      lang: "py",
      src: `import numpy as np

def tp_feedforward(x, W_cols, V_rows, all_reduce_sum):
    # W_cols[i]: (d, h/N) column slice on GPU i; V_rows[i]: (h/N, d) row slice on GPU i
    partials = []
    for i in range(len(W_cols)):                 # in reality each iteration runs on a different GPU, at the same time
        y_i = np.maximum(0, x @ W_cols[i])       # a slice of the hidden units, activation applied locally
        partials.append(y_i @ V_rows[i])         # a partial sum of the output
    return all_reduce_sum(partials)              # the one communication: add the partials

d, h, N = 4, 8, 2
W = np.random.rand(d, h); V = np.random.rand(h, d); x = np.random.rand(1, d)
W_cols = np.split(W, N, axis=1); V_rows = np.split(V, N, axis=0)
print(np.allclose(tp_feedforward(x, W_cols, V_rows, sum), np.maximum(0, x @ W) @ V))`,
      lines: [
        { code: "y_i = np.maximum(0, x @ W_cols[i])       # a slice of the hidden units, activation applied locally", say: "Each GPU computes some hidden units in full, so the elementwise activation needs no communication." },
        { code: "partials.append(y_i @ V_rows[i])         # a partial sum of the output", say: "Multiplying a slice of y by the matching rows of V yields a partial of the full output." },
        { code: "return all_reduce_sum(partials)              # the one communication: add the partials", say: "Summing partials across GPUs gives exactly the unsplit result. The check at the bottom confirms it." },
      ],
      output: "True",
    },
    useIt: "Use tensor parallelism when individual layers are too large or too slow for one GPU, typically for models above roughly 20–30 billion parameters, and confine it to GPUs within one machine. Combine with pipeline parallelism across machines and data parallelism across groups. Inference serving of large models uses the same split.",
    takeaways: ["Slices of each matrix on each GPU; partial results combined every layer.", "Column-then-row splitting of a feedforward block needs one all-reduce; attention splits by heads.", "Communication volume follows activations and recurs per layer, so it needs the fastest links.", "Keep tensor parallelism inside a machine; use other splits across machines."],
    terms: [["column / row slicing", "splitting a weight matrix by its output or input dimension"], ["head parallelism", "assigning attention heads to different GPUs"], ["intra-machine links", "the fast connections between GPUs in one server"]],
    reflect: { q: "Why can the activation function be applied without communication in a tensor-parallel feedforward block, but the second matrix multiply needs an all-reduce?", a: "Column slicing gives each GPU complete values for its subset of hidden units, and the activation acts on each value independently. The second multiply needs every hidden unit's contribution to every output, which no single GPU has, so the partial sums must be added across GPUs." },
  },

  "m49-pipeline-parallelism-in-training": {
    simple: "Pipeline parallelism puts consecutive blocks of layers on different GPUs and passes activations along like an assembly line, overlapping work on different micro-batches to keep every stage busy.",
    concept:
      "A model is a sequence of layers. **Pipeline parallelism** assigns layers 1–12 to GPU A, 13–24 to GPU B, and so on. A batch enters GPU A, its activations are sent to B, then C, and gradients flow back the other way. Each GPU holds only its block, so the depth of the model is spread across memory.\n\nThe naive version is wasteful: while GPU B works, A and C idle. The fix is to split the batch into **micro-batches** and stream them: A starts micro-batch 2 while B handles micro-batch 1. With enough micro-batches in flight the stages overlap and the idle time, called the **bubble**, shrinks to the start and end of each step.\n\nPipeline parallelism communicates only at stage boundaries, once per micro-batch, so it tolerates slower links between machines. Its difficulties are balancing stages so none is slower than the others, and the memory of holding activations for several micro-batches at once while waiting for their backward passes.",
    why:
      "Tensor parallelism needs fast links and splits every layer; data parallelism needs the whole model per GPU. Pipeline parallelism exists for the middle: when the model is deep enough that its layers do not fit on one GPU but each layer fits, and when the GPUs are spread over machines with ordinary networks. It is the split that scales across racks.",
    how: [
      "Divide the layers into S stages of roughly equal compute; assign each stage to a GPU or GPU group.",
      "Split each batch into M micro-batches.",
      "Forward: stage 1 processes micro-batch 1 and sends activations to stage 2, then immediately starts micro-batch 2, and so on.",
      "Backward: gradients flow from the last stage back, micro-batch by micro-batch, interleaved with forward passes to fill gaps (the 1F1B schedule).",
      "Each stage accumulates gradients over all micro-batches, then updates its weights once per step.",
      "Balance stages by measuring per-layer time and moving layer boundaries until the slowest stage is close to the average.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["time slot", "stage 1 (layers 1–8)", "stage 2 (layers 9–16)", "stage 3 (layers 17–24)"],
        rows: [
          ["1", "fwd mb1", "idle", "idle"],
          ["2", "fwd mb2", "fwd mb1", "idle"],
          ["3", "fwd mb3", "fwd mb2", "fwd mb1"],
          ["4", "fwd mb4", "fwd mb3", "fwd mb2 · bwd mb1"],
          ["…", "all stages busy", "all stages busy", "all stages busy"],
          ["end", "idle", "idle", "bwd mb4"],
        ],
      },
      caption: "The bubble is the idle corner at the start and end. More micro-batches make the busy middle longer relative to it.",
    },
    everyday: {
      title: "A car wash with three bays",
      text: "Wash, rinse, dry: three bays, three cars at once. The first car's wash leaves the rinse bay empty for one slot, and the last car's dry leaves the wash bay empty at the end. In between, all three bays are busy. If the dry bay is twice as slow, cars queue behind it and the other bays idle: the pipeline runs at the speed of its slowest stage. Balancing the bays is the whole art.",
    },
    engineering: {
      title: "Training a 96-layer model across 8 machines",
      text: "A team places 12 layers on each of 8 machines (each machine also uses tensor parallelism inside). With 4 micro-batches the bubble was 7/11 of each step: utilisation 36%. Raising micro-batches to 32 cut the bubble to 7/39 and lifted utilisation to 75%, at the cost of holding more activations per stage; they enabled activation checkpointing (recomputing activations in the backward pass instead of storing them) to make it fit. The final stage, which also computes the loss over a 128,000-token vocabulary, was 20% slower than the others; moving two layers off it balanced the pipeline.",
    },
    maths: {
      formula: "bubble fraction ≈ (S − 1) ÷ (M + S − 1);   utilisation ≈ M ÷ (M + S − 1)",
      meaning: "S stages, M micro-batches. The (S − 1) is the fill and drain time that cannot overlap.",
      worked: [
        "S = 8, M = 4: bubble = 7 ÷ 11 = 0.64; utilisation 0.36.",
        "S = 8, M = 32: bubble = 7 ÷ 39 = 0.18; utilisation 0.82.",
        "S = 8, M = 128: bubble = 7 ÷ 135 = 0.05; utilisation 0.95, but 128 micro-batches' activations must be held or recomputed.",
        "Stage imbalance: if one stage takes 1.2× the others, the whole pipeline runs at 1 ÷ 1.2 = 83% of the balanced rate on top of the bubble.",
      ],
    },
    code: {
      title: "Pipeline schedule with micro-batches, simulated",
      lang: "py",
      src: `def pipeline_schedule(num_stages, num_micro):
    # returns, per time slot, which micro-batch each stage works on (forward only, for clarity)
    slots = []
    for t in range(num_micro + num_stages - 1):
        row = []
        for s in range(num_stages):
            mb = t - s                                  # stage s sees micro-batch mb at time t
            row.append(mb if 0 <= mb < num_micro else None)
        slots.append(row)
    busy = sum(1 for row in slots for cell in row if cell is not None)
    return slots, busy / (len(slots) * num_stages)

sched, util = pipeline_schedule(num_stages=3, num_micro=4)
for row in sched:
    print(row)
print(round(util, 2))`,
      lines: [
        { code: "for t in range(num_micro + num_stages - 1):", say: "The step lasts M + S − 1 slots: M for the micro-batches plus S − 1 to fill and drain." },
        { code: "mb = t - s                                  # stage s sees micro-batch mb at time t", say: "Each stage lags the previous by one slot; that lag is the pipeline." },
        { code: "return slots, busy / (len(slots) * num_stages)", say: "Utilisation is busy cells over all cells; the None cells are the bubble." },
      ],
      output: "[0, None, None]\n[1, 0, None]\n[2, 1, 0]\n[3, 2, 1]\n[None, 3, 2]\n[None, None, 3]\n0.67",
    },
    useIt: "Use pipeline parallelism to spread a deep model across machines with ordinary networks, combined with tensor parallelism inside machines and data parallelism across groups. Tune micro-batch count against activation memory, use activation checkpointing, balance stages by measured time, and expect utilisation in the 70–90% range when it is done well.",
    takeaways: ["Consecutive layer blocks on different GPUs; activations stream between them.", "Micro-batches overlap stages; the bubble is the unavoidable fill and drain.", "Communication is light and infrequent, so it works across machines.", "Balance stages: the pipeline runs at the speed of its slowest."],
    terms: [["stage", "a block of consecutive layers on one GPU group"], ["micro-batch", "a slice of the batch streamed through the pipeline"], ["bubble", "idle time while the pipeline fills and drains"], ["activation checkpointing", "recomputing activations in the backward pass to save memory"]],
    reflect: { q: "Doubling the number of micro-batches halves the bubble. Why not always use thousands?", a: "Each in-flight micro-batch's activations must be kept until its backward pass, so memory grows with the number in flight; and each micro-batch must be large enough to use the GPU efficiently. The practical range balances bubble, memory and per-micro-batch efficiency." },
  },

  "m49-gradient-accumulation": {
    simple: "Gradient accumulation runs several small batches, adds up their gradients, and updates the weights once, so you get the effect of a large batch on a GPU that can only hold a small one.",
    concept:
      "Training often works best with a large batch, say 1,024 examples per update, but a GPU may only fit 32 at a time. **Gradient accumulation** processes 32, keeps the gradients without updating, processes the next 32 and adds its gradients to the kept ones, and so on for 32 rounds. Then it divides by 32 and takes one optimiser step. Mathematically it is identical to a single batch of 1,024.\n\nThe cost is time: 32 forward-backward passes per update instead of one. The benefit is that batch size becomes a choice independent of memory. It combines naturally with data parallelism: the effective batch is per-GPU batch × accumulation steps × number of GPUs.\n\nOne subtlety: layers that compute statistics over the batch, like batch normalisation, see only the small batch, so they behave differently from a true large batch. Transformers use layer normalisation, which is per example, so accumulation is exact for them.",
    why:
      "Memory for activations grows with batch size, and large models leave little room. Without accumulation, teams were forced into small batches, which train noisily and need carefully reduced learning rates, or into renting far more GPUs than their compute needed. Gradient accumulation exists to separate the batch size a method wants from the batch size the hardware allows.",
    how: [
      "Choose the target effective batch B and the per-pass batch b that fits in memory; accumulation steps k = B ÷ b.",
      "Zero the gradient buffers.",
      "For each of k micro-batches: forward, compute loss divided by k, backward (gradients add into the buffers).",
      "After k micro-batches, take one optimiser step and zero the buffers.",
      "Count learning-rate schedules and logging in optimiser steps, not micro-batches.",
      "With data parallelism, all-reduce only at the step, not at every micro-batch, to save communication.",
    ],
    visual: {
      kind: "flow",
      steps: ["micro-batch 1 (32): backward, grads += g₁", "micro-batch 2: grads += g₂", "…", "micro-batch 32: grads += g₃₂", "grads ÷ 32", "one optimiser step as if batch = 1,024"],
      caption: "Thirty-two small passes, one update. The weights change exactly as they would for one batch of 1,024.",
    },
    everyday: {
      title: "Counting votes from several boxes",
      text: "A ballot count with one small table: you cannot tip out all the boxes at once, so you count box by box and keep a running total, announcing the result only at the end. The result is identical to counting everything together; it just took more rounds. The running total is the accumulated gradient; the announcement is the optimiser step.",
    },
    engineering: {
      title: "Reproducing a paper's batch size on one GPU",
      text: "A paper trained with batch 512 and a particular learning rate. A student has one 24 GB GPU that fits batch 16. Using batch 16 with the paper's learning rate diverged; reducing the learning rate changed the results. With accumulation over 32 micro-batches (16 × 32 = 512) and the paper's exact learning rate, the training curve matched the paper within noise. The run took longer in wall-clock time, but the hyperparameters transferred unchanged.",
    },
    maths: {
      formula: "effective batch = b × k × N_GPUs;   accumulated gradient = (1 ÷ k) Σᵢ gᵢ   where gᵢ is the mean gradient over micro-batch i",
      meaning: "Dividing each micro-batch's loss by k (or the summed gradient by k) makes the accumulated gradient the mean over all b × k examples.",
      worked: [
        "Target 1,024, per-pass 32 → k = 32 accumulation steps on one GPU. With 4 data-parallel GPUs: 32 × k × 4 = 1,024 → k = 8.",
        "Micro-batch gradients for one parameter: 0.4, 0.2, −0.1, 0.3 with k = 4. Accumulated mean = (0.4 + 0.2 − 0.1 + 0.3) ÷ 4 = 0.2. A single batch of 128 would give the same 0.2.",
        "Time: 32 passes of batch 32 take roughly as long as 32 passes of anything; the GPU runs at the same efficiency, so a 1,024 step takes about 32× a 32-batch step.",
      ],
    },
    code: {
      title: "Accumulate, then step",
      lang: "py",
      src: `def train_with_accumulation(model, loader, optimizer, accum_steps):
    optimizer.zero_grad()
    for i, (x, y) in enumerate(loader):
        loss = model.loss(x, y) / accum_steps          # scale so the sum of k losses is a mean
        loss.backward()                                # gradients add into the buffers
        if (i + 1) % accum_steps == 0:
            optimizer.step()                           # one update per accum_steps micro-batches
            optimizer.zero_grad()
            log_step()                                 # schedules and logs count optimiser steps`,
      lines: [
        { code: "loss = model.loss(x, y) / accum_steps          # scale so the sum of k losses is a mean", say: "Dividing each loss by k makes the accumulated gradient equal the mean over the whole effective batch." },
        { code: "loss.backward()                                # gradients add into the buffers", say: "Backward adds to existing gradients; not zeroing between micro-batches is the entire trick." },
        { code: "if (i + 1) % accum_steps == 0:", say: "Only every k-th micro-batch triggers an update." },
        { code: "optimizer.zero_grad()", say: "Clear the buffers after the step, ready for the next accumulation." },
      ],
    },
    useIt: "Use gradient accumulation whenever the batch size you want exceeds what fits: reproducing papers on small hardware, fine-tuning large models, keeping hyperparameters fixed across different GPUs. Remember batch-norm's caveat, count schedules in optimiser steps, and all-reduce once per step under data parallelism.",
    takeaways: ["Sum gradients over k small batches, divide by k, update once: identical to one big batch.", "Batch size becomes independent of memory, at the cost of k× time per update.", "Exact for transformers (layer norm); approximate with batch norm.", "Effective batch = per-pass × k × GPUs; schedules count optimiser steps."],
    terms: [["accumulation steps", "how many micro-batches are summed before an update"], ["gradient buffer", "the stored gradient a backward pass adds into"], ["effective batch", "the number of examples contributing to one update"]],
    reflect: { q: "A colleague says accumulation makes training faster because the model sees more data per step. Correct?", a: "No. It makes each step more informative, not faster; wall-clock time per example is unchanged, and total compute is the same. The benefit is being able to use a large batch and its hyperparameters without the memory, not speed." },
  },

  "m49-mixed-precision-training": {
    simple: "Mixed precision training does most arithmetic in 16-bit numbers for speed and memory while keeping a 32-bit master copy of the weights for accuracy.",
    concept:
      "Computers store numbers with a fixed number of bits. 32-bit floats (FP32) are precise; 16-bit floats are half the size and, on modern GPUs, several times faster to multiply. But 16-bit numbers have less range or less precision: tiny gradients can round to zero, and small updates can vanish when added to a large weight.\n\n**Mixed precision training** uses both. Forward and backward passes run in 16-bit (FP16 or BF16): activations, weights as used in matrix multiplies, and gradients. A 32-bit **master copy** of the weights receives the updates, so small changes are not lost. With FP16, a **loss scale** multiplies the loss before backward so that small gradients stay representable, and divides them back before the update. BF16 keeps FP32's range with less precision and usually needs no scaling, which is why it became the default for large models.\n\nThe result is two to three times faster training using about half the memory for activations, with accuracy matching full FP32.",
    why:
      "GPU tensor cores deliver their peak speed in 16-bit; FP32 runs at a fraction of it. Memory for activations halves. Models trained in plain FP16 diverged or stalled because of underflow and lost updates, so mixed precision exists to capture the speed of 16-bit while keeping the numerical safety of 32-bit where it matters.",
    how: [
      "Keep master weights in FP32 inside the optimiser.",
      "At each step, cast a 16-bit copy of the weights for the forward pass.",
      "Run forward and backward in 16-bit; (FP16 only) multiply the loss by a scale factor S before backward.",
      "Unscale the gradients (divide by S), check for overflow (inf or NaN); if found, skip the step and reduce S; otherwise occasionally increase S.",
      "Apply the update to the FP32 master weights.",
      "Keep a few numerically sensitive operations (softmax, layer norm, loss) in FP32.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Format", "Bits", "Range (approx.)", "Precision", "Use in mixed precision"],
        rows: [
          ["FP32", "32", "±3 × 10³⁸", "7 decimal digits", "master weights, optimiser state, sensitive ops"],
          ["FP16", "16", "±65,504", "3–4 digits", "activations, matmuls, gradients (needs loss scaling)"],
          ["BF16", "16", "±3 × 10³⁸", "2–3 digits", "activations, matmuls, gradients (no scaling needed)"],
          ["FP8", "8", "small", "~1 digit", "matmuls in the newest hardware, with per-tensor scaling"],
        ],
      },
      caption: "BF16 trades precision for FP32's range; FP16 keeps more precision but overflows at 65,504. Both are half the memory of FP32.",
    },
    everyday: {
      title: "Keeping accounts in pounds but a ledger in pence",
      text: "A shop rounds every price tag to the nearest pound for quick mental arithmetic, but the accountant's ledger keeps pence. If the daily totals were rounded too, a penny-a-day discount would never show up; the ledger catches it. The pound figures are the 16-bit working copy; the ledger is the 32-bit master.",
    },
    engineering: {
      title: "Cutting a pretraining run's cost by 40%",
      text: "A team trained a 3B model in FP32 and found tensor cores idle. Switching to mixed precision with BF16 raised throughput 2.6× and halved activation memory, which let them double the per-GPU batch and reduce the GPU count. The loss curve matched the FP32 run. Their one issue: attention logits for very long sequences overflowed FP16 in an earlier experiment, which is why they chose BF16 and kept softmax in FP32. Total cost of the run fell by about 40% after accounting for the larger batch and fewer GPUs.",
    },
    maths: {
      formula: "memory per parameter: FP32 training ≈ 16 bytes (4 weights + 4 grads + 8 optimiser);   mixed ≈ 2 + 2 + 4 + 8 = 16 bytes but activations halve;   loss scaling: g_scaled = S × g, update with g_scaled ÷ S",
      meaning: "Mixed precision does not shrink the optimiser state (which stays FP32) but halves the large activation tensors and multiplies compute speed.",
      worked: [
        "A gradient of 3 × 10⁻⁸ underflows FP16 (smallest normal ≈ 6 × 10⁻⁵, subnormals down to 6 × 10⁻⁸). With loss scale S = 2¹⁵ = 32,768: 3 × 10⁻⁸ × 32,768 ≈ 9.8 × 10⁻⁴, comfortably representable. After backward, divide by 32,768 in FP32 to recover 3 × 10⁻⁸ for the master update.",
        "Lost update without a master copy: weight 1.0 in FP16 has spacing ≈ 0.001 near 1; an update of 0.0003 rounds to no change. In FP32 (spacing ≈ 1.2 × 10⁻⁷) the update is applied.",
        "Activation memory: batch 8, sequence 4,096, hidden 4,096, 32 layers, roughly 20 saved tensors per layer: 8 × 4,096 × 4,096 × 32 × 20 × 4 bytes ≈ 344 GB in FP32; ≈ 172 GB in 16-bit.",
      ],
    },
    code: {
      title: "The mixed-precision loop with dynamic loss scaling",
      lang: "py",
      src: `def mixed_precision_step(model_fp32, batch, optimizer, scaler):
    weights16 = cast_to_fp16(model_fp32.weights)              # working copy for speed
    loss = forward_fp16(weights16, batch)                     # 16-bit activations and matmuls
    scaled = loss * scaler.scale                              # keep tiny gradients above FP16's floor
    grads16 = backward_fp16(scaled)
    grads = [g.astype("float32") / scaler.scale for g in grads16]   # unscale in 32-bit
    if any_inf_or_nan(grads):
        scaler.scale /= 2                                     # overflow: skip this step, shrink the scale
        return None
    optimizer.step(model_fp32.weights, grads)                 # update the FP32 master weights
    scaler.steps_ok += 1
    if scaler.steps_ok % 2000 == 0:
        scaler.scale *= 2                                     # stable for a while: try a larger scale
    return loss`,
      lines: [
        { code: "weights16 = cast_to_fp16(model_fp32.weights)              # working copy for speed", say: "The 16-bit weights are a cast copy; the FP32 originals are never overwritten by 16-bit maths." },
        { code: "scaled = loss * scaler.scale                              # keep tiny gradients above FP16's floor", say: "Scaling the loss scales every gradient by the same factor, lifting them out of underflow." },
        { code: "grads = [g.astype(\"float32\") / scaler.scale for g in grads16]   # unscale in 32-bit", say: "Convert up, then divide: the true gradients, now in a format that keeps them." },
        { code: "scaler.scale /= 2                                     # overflow: skip this step, shrink the scale", say: "Dynamic scaling: an overflow means the scale was too ambitious; back off and try again." },
        { code: "optimizer.step(model_fp32.weights, grads)                 # update the FP32 master weights", say: "The update lands on the precise copy, so small changes accumulate correctly." },
      ],
      note: "With BF16 the scaling lines are usually unnecessary; the rest of the structure is the same.",
    },
    useIt: "Mixed precision is the default for all serious training today: enable it first, prefer BF16 on hardware that supports it, keep softmax and normalisation in FP32, and watch for inf/NaN skips in the logs. The same ideas govern FP8 training on the newest GPUs and 8- and 4-bit inference quantisation.",
    takeaways: ["16-bit for speed and activation memory; FP32 master weights for accurate updates.", "FP16 needs loss scaling against underflow; BF16 has FP32's range and usually does not.", "Keep numerically sensitive operations in FP32.", "Expect 2–3× speed and half the activation memory at equal accuracy."],
    terms: [["master weights", "the FP32 copy of parameters that receives updates"], ["loss scaling", "multiplying the loss so gradients stay representable in FP16"], ["BF16", "a 16-bit format with FP32's exponent range and reduced precision"], ["underflow", "a number too small for the format, rounded to zero"]],
    reflect: { q: "If BF16 has fewer precision bits than FP16, why is it preferred for training large models?", a: "Because range matters more than precision during training: BF16 never overflows on large attention logits or underflows on small gradients without scaling, and the FP32 master weights supply the precision where it counts. FP16's extra precision bits do not buy much once the master copy exists." },
  },

  "m49-curriculum-learning": {
    simple: "Curriculum learning orders training data from easy to hard, or from general to specific, so the model builds skills in a sensible sequence instead of in random order.",
    concept:
      "Standard training shuffles everything and shows examples in random order. **Curriculum learning** chooses the order on purpose: short sequences before long ones, clean data before noisy, general text before specialised, simple problems before multi-step ones. Later stages may also change the mix, raising the proportion of high-quality or domain-specific data toward the end of training.\n\nThe idea comes from how people learn: arithmetic before algebra. For models the mechanism is practical. Easy examples give clear gradients early, when the model knows nothing; hard examples would be noise. Shorter sequences early make steps cheaper. And data mixed in at the end has an outsized effect on the final behaviour, so the last stage is where quality and domain data belong.\n\nCurriculum is a knob on the data pipeline, not on the model. It costs nothing in compute and can change results noticeably, which is why most large pretraining runs now use a multi-stage data schedule.",
    why:
      "Random order treats a trillion tokens as interchangeable. They are not: some are easy, some are hard, some are rare and valuable. Training on hard or noisy data before the model can use it wastes compute and can destabilise early training. And because later tokens influence the final weights more than earlier ones, the last few percent of data deserve to be the best. Curriculum learning exists to spend compute where it teaches most.",
    how: [
      "Define a difficulty or priority measure: sequence length, source quality score, loss under a small reference model, task complexity.",
      "Sort or bucket data by it; design stages (for example: short and clean → full mix → high-quality and domain-heavy).",
      "Start with the easy bucket and a short context; increase context length and difficulty on a schedule.",
      "In the final stage, raise the share of curated data (textbooks, code, domain documents) and reduce the share of web crawl.",
      "Anneal the learning rate down during the final stage so the model settles on the high-quality mix.",
      "Validate per stage on held-out sets that represent each difficulty; a stage that hurts earlier skills is a sign of too sharp a transition.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "stage 1 (first 10%)", detail: "sequences ≤ 2k tokens, clean filtered text; fast steps, stable gradients" },
        { label: "stage 2 (next 80%)", detail: "full mix, sequences up to 8k; the bulk of learning" },
        { label: "stage 3 (final 10%)", detail: "context 32k; curated and domain data upweighted 3×; learning rate annealed to near zero" },
      ],
      caption: "A typical three-stage schedule. The last stage is small in tokens and large in effect.",
    },
    everyday: {
      title: "Learning to swim",
      text: "Nobody starts in the deep end during a storm. Shallow water, then strokes, then lengths, then open water. Each stage is possible only because of the one before, and the last lessons before a race are the most carefully chosen. Dumping all of it on a beginner in random order would produce fear and little swimming.",
    },
    engineering: {
      title: "Teaching a code model to handle long files",
      text: "A team pretrains a code model. Training from the start on 32,000-token files was slow (attention cost) and unstable. They switched to a curriculum: 4,000-token windows for the first 70% of tokens, 16,000 for the next 20%, 32,000 for the final 10%, with the final stage weighted toward well-documented repositories. Training was 35% cheaper, and long-file completion accuracy was higher than the all-32k baseline, because the model learned local syntax cheaply first and long-range structure once it could use it.",
    },
    maths: {
      formula: "compute per token ∝ (parameters + attention term × sequence length);   stage compute = tokens in stage × cost per token at that stage's length",
      meaning: "Short sequences early cut the attention term for most of training; the long-context cost is paid only on the final fraction.",
      worked: [
        "Model where attention is 30% of per-token cost at 32k and scales linearly with length (per token). Cost per token at 4k: 0.7 + 0.3 × (4 ÷ 32) = 0.74; at 16k: 0.85; at 32k: 1.0 (relative units).",
        "All-32k baseline for 1T tokens: 1.0 × 10¹² = 1.0 × 10¹².",
        "Curriculum: 0.7 × 10¹² × 0.74 + 0.2 × 10¹² × 0.85 + 0.1 × 10¹² × 1.0 = 0.518 + 0.17 + 0.1 = 0.788 × 10¹². About 21% less compute, before counting the stability benefit.",
      ],
    },
    code: {
      title: "A staged data loader",
      lang: "py",
      src: `def curriculum_batches(datasets, total_steps):
    # datasets: dict of name -> iterator; stages define the mix and context length over training
    stages = [
        (0.10, {"clean_short": 1.0}, 2048),
        (0.80, {"web": 0.6, "code": 0.25, "books": 0.15}, 8192),
        (0.10, {"web": 0.3, "code": 0.3, "books": 0.2, "domain": 0.2}, 32768),
    ]
    step = 0
    for share, mix, ctx in stages:
        for _ in range(int(share * total_steps)):
            source = weighted_choice(mix)                  # pick a dataset by the stage's weights
            yield next(datasets[source]).truncate(ctx), step
            step += 1`,
      lines: [
        { code: "(0.10, {\"clean_short\": 1.0}, 2048),", say: "Stage 1: a tenth of the steps, only clean short text, 2k context. Cheap and stable." },
        { code: "(0.10, {\"web\": 0.3, \"code\": 0.3, \"books\": 0.2, \"domain\": 0.2}, 32768),", say: "The final tenth: domain data appears for the first time, web crawl is halved, context is long." },
        { code: "source = weighted_choice(mix)                  # pick a dataset by the stage's weights", say: "The mix is a sampling distribution, changed between stages, not a hard filter." },
        { code: "yield next(datasets[source]).truncate(ctx), step", say: "Context length grows with the stage; the step counter drives the learning-rate schedule." },
      ],
    },
    useIt: "Apply curriculum ideas to any training run: grow context length over time, filter aggressively early, upweight curated and domain data in a final annealing stage, and order fine-tuning examples from simple to complex. Validate each stage on representative held-out sets so later stages do not erase earlier skills.",
    takeaways: ["Order and mix data on purpose: easy and short first, hard and long later, best last.", "Short early sequences save compute; the final stage shapes final behaviour most.", "It is a data-pipeline change with no model cost.", "Check each stage against held-out sets for forgetting."],
    terms: [["curriculum", "a planned ordering or staging of training data"], ["annealing stage", "the final phase with decaying learning rate and curated data"], ["data mix", "the sampling proportions across data sources"]],
    reflect: { q: "Why does the last 10% of training data have more influence on the final model than the first 10%?", a: "Because the learning rate is typically decaying through the final stage, so the weights settle into a configuration shaped by what they saw last, and because earlier updates have been partially overwritten by everything after them. The model's final state is closest to its most recent data." },
  },

  "m49-synthetic-data-generation": {
    simple: "Synthetic data is training data produced by a model or a program rather than collected from the world, used to fill gaps, add variety and create examples that are rare, private or expensive to label.",
    concept:
      "Real data runs out, is unevenly distributed, contains private details, or lacks the hard cases you most need. **Synthetic data generation** makes new examples on demand. A strong model can write questions and answers, rephrase instructions, translate, generate code with tests, or produce labelled variations of real examples. Simulators render images of defects that rarely occur, or robot scenes under a thousand lighting conditions. Programs generate maths problems with verified solutions.\n\nThe value lies in control: you choose the distribution, cover the gaps, and know the labels are correct when the generator can verify them. The danger lies in the same control: a model trained on a model's output inherits its errors and narrows toward its habits. Synthetic data works when it is verified, filtered, mixed with real data and measured on real test sets.\n\nMost recent model training uses synthetic data in some stage: instruction tuning, reasoning traces, code with test cases, and safety examples.",
    why:
      "Collecting and labelling real data is slow, expensive and sometimes impossible: you cannot photograph a defect that occurs once a year, or gather private medical dialogues at scale. And the easy, common cases dominate real data while the rare, hard cases decide quality. Synthetic generation exists to produce the data you need in the proportions you need, with labels attached.",
    how: [
      "Identify the gap: a rare class, a hard skill, a domain with little data, or a need for diversity.",
      "Choose a generator: a strong model with carefully designed prompts, a simulator, or a program with a solver.",
      "Generate at volume with controlled variety: vary topics, phrasings, difficulties, conditions.",
      "Verify: run code against tests, check maths with a solver, use a judge model or rules to filter, deduplicate against the test set.",
      "Mix with real data at a measured ratio; keep the evaluation set real.",
      "Track provenance: label every example as synthetic with its generator, so it can be removed if it proves harmful.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Need", "Generator", "Verification", "Risk"],
        rows: [
          ["instruction-following examples", "a strong model writes tasks and answers", "a judge model + dedup against evals", "style narrowing; inherited errors"],
          ["code training data", "a model writes functions and unit tests", "run the tests; keep only passing", "trivial or repetitive problems"],
          ["maths reasoning", "program generates problems; model writes solutions", "solver checks the final answer", "solutions right by accident with wrong steps"],
          ["rare visual defects", "a simulator renders scratches, cracks", "human spot checks", "simulator-to-reality gap"],
          ["private dialogues", "a model generates realistic but fictional cases", "privacy check that no real record is reproduced", "unrealistic cases"],
        ],
      },
      caption: "Every row has a verification column. Synthetic data without it is a rumour.",
    },
    everyday: {
      title: "Practice exam papers",
      text: "Real past exam papers are few and the examiners' tricks change. A good teacher writes new practice questions in the same style, with worked answers, covering the topics students find hardest. Students who practise on them do better on the real exam, provided the teacher's questions are correct and not just the same three questions reworded. The teacher's papers are synthetic data; the real exam is the test set that must stay untouched.",
    },
    engineering: {
      title: "A code assistant for an internal framework",
      text: "A company's internal web framework has little public code, so a code model knew nothing about it. They generated 40,000 examples: a strong model, given the framework's documentation, wrote realistic tasks and implementations; each implementation was run against generated unit tests and kept only if it passed, then deduplicated. Mixed at 20% with general code data in a fine-tuning run, the model's accuracy on a held-out set of 300 real internal tasks rose from 31% to 68%. Attempts with unverified generations plateaued at 45%, because a quarter of them were wrong.",
    },
    maths: {
      formula: "expected correctness of a synthetic set = pass rate of the verifier's filter ÷ (fraction kept);   effective dataset = real + α × synthetic, with α tuned on a real validation set",
      meaning: "Verification raises the share of correct examples; the mixing ratio α is an empirical choice measured on real data.",
      worked: [
        "A generator produces 100,000 code examples; 55% pass their tests. Keeping only passing examples yields 55,000 with near-certain functional correctness (the tests could still be weak).",
        "Without filtering, the 100,000 would contain 45,000 wrong examples; a model learns those too.",
        "Mixing ratio experiment: real-only 31% accuracy; 10% synthetic 52%; 20% 68%; 40% 66% (style narrowing starts to hurt). α = 20% chosen.",
      ],
    },
    code: {
      title: "Generate, verify, keep",
      lang: "py",
      src: `def make_code_examples(generator, n, tests_from):
    kept = []
    for _ in range(n):
        task = generator.write_task(topic=random_topic())
        solution = generator.write_solution(task)
        tests = tests_from(task)                         # independent tests, written from the task alone
        if run_tests(solution, tests) and not near_duplicate(task, kept + EVAL_SET):
            kept.append({"task": task, "solution": solution, "source": "synthetic-v3"})
    return kept

examples = make_code_examples(strong_model, n=100000, tests_from=strong_model.write_tests)
print(len(examples))`,
      lines: [
        { code: "tests = tests_from(task)                         # independent tests, written from the task alone", say: "Tests written without seeing the solution, so a wrong solution cannot write tests that excuse it." },
        { code: "if run_tests(solution, tests) and not near_duplicate(task, kept + EVAL_SET):", say: "Two filters: the solution must pass, and the task must not duplicate existing data or, crucially, the evaluation set." },
        { code: "kept.append({\"task\": task, \"solution\": solution, \"source\": \"synthetic-v3\"})", say: "Provenance recorded, so this batch can be traced and removed if it misbehaves." },
      ],
    },
    useIt: "Use synthetic data for instruction tuning, domain adaptation, rare cases, privacy-safe stand-ins, data augmentation and reasoning traces; always verify (tests, solvers, judges), deduplicate against evaluation sets, mix with real data at a measured ratio, and evaluate only on real data. Record provenance.",
    takeaways: ["Synthetic data fills gaps you choose, with labels attached.", "It inherits the generator's errors and habits; verify and filter before training.", "Mix with real data; the evaluation set stays real and untouched.", "Track provenance so synthetic batches can be audited or removed."],
    terms: [["synthetic data", "examples produced by a model, simulator or program"], ["verifier", "a check (tests, solver, judge) that filters generated examples"], ["model collapse", "quality decay from training repeatedly on model-generated data"], ["provenance", "a record of where each example came from"]],
    reflect: { q: "A team trains model B on text generated by model A, then model C on text from B, and so on. What happens over generations?", a: "Variety shrinks and errors compound: each generation samples from the previous one's narrower distribution and reproduces its mistakes, so rare patterns vanish and quality degrades. Mixing in real data each generation and verifying outputs prevents the collapse." },
  },

  "m49-distillation": {
    simple: "Distillation trains a small student model to imitate a large teacher model's outputs, keeping most of the teacher's quality at a fraction of the size and cost.",
    concept:
      "A large model is expensive to run. **Distillation** transfers what it knows into a smaller model. The large **teacher** processes inputs and produces outputs; the small **student** is trained to match them. The student learns from the teacher's answers rather than from the original labels, and often from richer signals than labels: the teacher's full probability distribution over the next token, which encodes not just the right answer but which alternatives were nearly right.\n\nThat soft signal is why distillation beats training the small model on labels alone. A label says 'cat'; the teacher says 'cat 0.85, lynx 0.10, dog 0.03', and the student learns that lynx is a reasonable confusion and dog is not. For generative models, the student can be trained on the teacher's generated text (sequence-level distillation), on its token distributions, or on its intermediate representations.\n\nThe student ends up smaller, faster and cheaper, with quality closer to the teacher than its size would suggest, within the range of inputs the teacher was asked about.",
    why:
      "Quality comes from scale, but deployment needs speed, low cost, and sometimes a device with no GPU. Training a small model from scratch on raw data gives a weak model; the large model already extracted the structure of the data, and that structure is easier to learn than the data itself. Distillation exists to move capability down the size ladder, and it is how most small production models are made.",
    how: [
      "Choose a teacher (large, already trained) and a student architecture (smaller, often the same family).",
      "Collect inputs: real data, plus prompts covering the behaviours you want transferred.",
      "Run the teacher to get targets: next-token probability distributions, generated outputs, or hidden states.",
      "Train the student with a loss combining imitation of the teacher (for example, cross-entropy against the teacher's soft distribution, often with a temperature) and, where available, the true labels.",
      "Evaluate the student against the teacher on held-out tasks; measure the gap per task.",
      "Iterate: add inputs where the gap is largest; sometimes distil in stages through a medium model.",
    ],
    visual: {
      kind: "flow",
      steps: ["input", "teacher (70B): probabilities over next tokens", "student (7B): its own probabilities", "loss: how different are the two distributions?", "update the student only", "repeat over millions of inputs"],
      caption: "The teacher is frozen and only runs forward; the student learns to produce the same distributions.",
    },
    everyday: {
      title: "An apprentice learning from a master's corrections",
      text: "An apprentice carpenter could learn from a textbook of right answers, or could work beside a master who says 'that joint is fine, that one is slightly loose, that one would do in a pinch'. The second teaches far more per piece, because it shows degrees of right and wrong. The master's graded judgements are the soft targets; the textbook is the hard labels.",
    },
    engineering: {
      title: "Shipping a 1B-parameter assistant on phones",
      text: "A company has a 70B assistant in the cloud and wants an on-device version for offline use. Training a 1B model from scratch on their data gave poor results. They distilled: 2 million prompts drawn from real usage plus synthetic variations, the 70B teacher's responses and token distributions as targets, and a 1B student trained for two weeks. On their task suite the student scored 78% of the teacher's quality, versus 52% for the from-scratch 1B model. It runs in 2 GB of phone memory. Where the gap was largest (multi-step reasoning), they route those requests to the cloud.",
    },
    maths: {
      formula: "L = α · KL(p_teacher(T) ‖ p_student(T)) · T² + (1 − α) · CE(y, p_student)   where p(T) uses softmax(logits ÷ T)",
      meaning: "KL measures how different the student's distribution is from the teacher's at temperature T; CE is the usual loss against the true label; α balances them. T² keeps gradient scale comparable.",
      worked: [
        "Teacher logits over three classes [4, 2, 0]. At T = 1: softmax ≈ [0.867, 0.117, 0.016]. At T = 2: logits ÷ 2 = [2, 1, 0] → [0.665, 0.245, 0.090]: the near-miss class is now visible to the student.",
        "Student at T = 2 outputs [0.5, 0.3, 0.2]. KL = Σ p_t log(p_t ÷ p_s) = 0.665 log(1.33) + 0.245 log(0.817) + 0.090 log(0.45) ≈ 0.190 − 0.050 − 0.072 = 0.068.",
        "With α = 0.7, T² = 4, and a label cross-entropy of 0.69 (student gave 0.5 to the true class): L = 0.7 × 0.068 × 4 + 0.3 × 0.69 = 0.190 + 0.207 = 0.397.",
      ],
      note: "A higher temperature spreads the teacher's distribution and transfers more of its 'dark knowledge' about near misses.",
    },
    code: {
      title: "Distillation loss for one example",
      lang: "py",
      src: `import numpy as np

def softmax(z, T=1.0):
    z = np.asarray(z, dtype=float) / T
    e = np.exp(z - z.max())
    return e / e.sum()

def distill_loss(teacher_logits, student_logits, label, T=2.0, alpha=0.7):
    p_t = softmax(teacher_logits, T)                           # soft targets from the frozen teacher
    p_s = softmax(student_logits, T)
    kl = np.sum(p_t * np.log(p_t / p_s))                       # how far the student is from the teacher
    ce = -np.log(softmax(student_logits)[label])               # the usual loss against the true label
    return alpha * kl * T * T + (1 - alpha) * ce

print(round(distill_loss([4, 2, 0], [1.0, 0.49, 0.08], label=0), 3))`,
      lines: [
        { code: "p_t = softmax(teacher_logits, T)                           # soft targets from the frozen teacher", say: "The temperature flattens the teacher's confidence so near-miss classes carry signal." },
        { code: "kl = np.sum(p_t * np.log(p_t / p_s))                       # how far the student is from the teacher", say: "The imitation term: zero when the student reproduces the teacher's distribution exactly." },
        { code: "ce = -np.log(softmax(student_logits)[label])               # the usual loss against the true label", say: "The label term keeps the student anchored to the truth when the teacher is wrong." },
        { code: "return alpha * kl * T * T + (1 - alpha) * ce", say: "Weighted sum; T² rescales the softened gradients." },
      ],
      output: "0.397",
    },
    useIt: "Distil when you need a cheaper or on-device version of a capable model: small assistants, classifiers, embedding models, speech and vision models. Collect inputs that cover real usage, use soft targets where you can get logits, keep a label term, measure the gap per task, and route the hardest cases to the teacher if it remains available.",
    takeaways: ["A frozen teacher's outputs become the student's training targets.", "Soft distributions teach more than labels: which wrong answers were nearly right.", "Students keep most of the quality within the teacher's covered inputs, at a fraction of the cost.", "Measure the gap per task and route around it."],
    terms: [["teacher / student", "the large source model and the small model trained to imitate it"], ["soft targets", "the teacher's full probability distribution, used as the training signal"], ["temperature (distillation)", "a divisor on logits that spreads probability to near-miss classes"], ["dark knowledge", "the information in a teacher's wrong-answer probabilities"]],
    reflect: { q: "A student distilled from a teacher scores higher than the teacher on one benchmark. Is that possible?", a: "Yes, occasionally: the label term and the regularising effect of soft targets can smooth away some teacher errors, and the student may have been trained on data the teacher never saw. It is usually a small effect on specific tasks; across the board the student stays below the teacher." },
  },

  "m49-model-compression": {
    simple: "Model compression makes a trained model smaller and faster to run through quantisation, pruning, distillation and architectural tricks, while keeping its quality close to the original.",
    concept:
      "A trained model is a large pile of numbers. **Model compression** is the set of techniques for shrinking that pile and the work it takes to use it. **Quantisation** stores the numbers with fewer bits. **Pruning** removes weights, neurons or whole heads that contribute little. **Distillation** replaces the model with a smaller one trained to imitate it. **Low-rank factorisation** rewrites big matrices as products of small ones. **Architectural changes** such as sharing key-value heads across attention heads reduce memory at inference.\n\nThese combine. A production small model is often distilled from a large one, then pruned, then quantised to 4-bit, then served with a shared-KV architecture. Each step costs a little quality; the art is measuring each on the tasks that matter and stopping before the loss is felt.\n\nCompression is where research models become products: the difference between a model that needs a GPU server and one that runs on a phone.",
    why:
      "Inference cost dominates the lifetime cost of a deployed model, and memory decides where it can run at all. A model twice as small halves the serving bill and may move from the cloud to the device, which also improves privacy and latency. Compression exists because the model that trains best is rarely the model that is cheapest to serve, and the gap between them can be closed with little loss.",
    how: [
      "Establish a baseline: evaluate the full model on the tasks you care about, including the hard tail.",
      "Quantise weights (and often activations and KV cache) to 8-bit, then try 4-bit with a calibration set to choose scales per group of weights.",
      "Prune: remove the attention heads, feedforward neurons or layers with the least effect, measured by ablation; fine-tune briefly to recover.",
      "Factorise large matrices into low-rank pairs where the rank can be cut without loss.",
      "Distil if a smaller architecture is needed altogether.",
      "Re-evaluate after each step against the baseline; keep a record of quality per technique and stop at the budget.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Technique", "What shrinks", "Typical saving", "Typical quality cost", "Needs retraining?"],
        rows: [
          ["8-bit quantisation", "weight storage, memory bandwidth", "2× vs 16-bit", "near zero", "no (calibration only)"],
          ["4-bit quantisation", "weight storage", "4× vs 16-bit", "small; larger on small models", "no, or light fine-tune"],
          ["structured pruning (heads, neurons, layers)", "compute and memory", "1.3–2×", "small to moderate", "yes, briefly"],
          ["low-rank factorisation", "matrix size", "1.5–3× on chosen layers", "small if rank chosen well", "yes"],
          ["distillation to a smaller model", "everything", "5–20×", "moderate; task-dependent", "yes, substantial"],
          ["grouped / multi-query attention", "KV cache at inference", "4–8× cache", "near zero if trained with it", "yes (or conversion + tuning)"],
        ],
      },
      caption: "Stack them: distil, prune, quantise. Measure after each.",
    },
    everyday: {
      title: "Packing for a trip",
      text: "You cannot take the whole wardrobe. You pick fewer items (pruning), choose lighter versions of each (quantisation), roll them tightly (factorisation), and for a long trip you pack a small bag that does most of what the big one did (distillation). You find out what you should not have left behind only when you need it; that is why you test the packing on a short trip first.",
    },
    engineering: {
      title: "Taking a document classifier from 4 GPUs to 1 CPU",
      text: "A bank runs a 1.3B-parameter document classifier on four GPUs for 2 million documents a day. Compression plan: distil to a 350M student (quality 98% of teacher on their 12 document types), prune 30% of attention heads with a short recovery fine-tune (99.5% of student quality), quantise to 8-bit (no measurable change). The result runs on CPU servers at the same daily throughput for a fifth of the cost. A 4-bit attempt lost accuracy on the rarest document type, so they stayed at 8-bit; the per-type evaluation is what caught it.",
    },
    maths: {
      formula: "memory = parameters × bytes per parameter;   speed-up from pruning ≈ 1 ÷ (1 − fraction removed) on structured hardware;   low-rank: m×n matrix → m×r + r×n numbers",
      meaning: "Each technique has a simple arithmetic for its saving; the quality cost must be measured.",
      worked: [
        "1.3B parameters in 16-bit = 2.6 GB; 350M student in 16-bit = 0.7 GB; in 8-bit = 0.35 GB. Memory down 7.4×.",
        "Low-rank: a 4,096 × 4,096 matrix has 16.8M numbers. Factorised with rank 512: 4,096 × 512 + 512 × 4,096 = 4.2M numbers, a 4× saving on that layer.",
        "Pruning 30% of heads: compute in attention falls to 70%; if attention is 40% of total compute, overall compute falls by 12%. Pruning saves less than its headline unless it targets the dominant cost.",
      ],
    },
    code: {
      title: "Low-rank factorisation of one weight matrix",
      lang: "py",
      src: `import numpy as np

def low_rank(W, r):
    U, s, Vt = np.linalg.svd(W, full_matrices=False)          # W = U diag(s) Vt
    A = U[:, :r] * s[:r]                                      # (m, r)
    B = Vt[:r, :]                                             # (r, n)
    return A, B                                               # W ≈ A @ B

W = np.random.randn(512, 512) @ np.diag(np.linspace(1, 0.01, 512)) @ np.random.randn(512, 512)
for r in (512, 128, 64, 32):
    A, B = low_rank(W, r)
    err = np.linalg.norm(W - A @ B) / np.linalg.norm(W)
    print(r, A.size + B.size, round(float(err), 3))`,
      lines: [
        { code: "U, s, Vt = np.linalg.svd(W, full_matrices=False)          # W = U diag(s) Vt", say: "The singular value decomposition orders the matrix's 'directions' by importance." },
        { code: "A = U[:, :r] * s[:r]                                      # (m, r)", say: "Keep only the r most important directions." },
        { code: "return A, B                                               # W ≈ A @ B", say: "Two thin matrices replace one square one; the product approximates the original." },
        { code: "err = np.linalg.norm(W - A @ B) / np.linalg.norm(W)", say: "The approximation error tells you how low the rank can go before the layer changes noticeably." },
      ],
      note: "Real layers are then fine-tuned briefly with A and B as the new parameters; LoRA uses the same idea for adapters.",
    },
    useIt: "Compress before deploying anything latency- or cost-sensitive: quantise first (cheapest, often free), then consider pruning and factorisation, and distil when a new size class is needed. Keep a per-task, per-slice evaluation and stop at the first step that hurts something you care about.",
    takeaways: ["Quantise, prune, factorise, distil, and share KV heads; stack them.", "Each has simple arithmetic for savings and a measured cost in quality.", "Quantisation is nearly free at 8-bit; 4-bit needs care on small models.", "Evaluate per task and per slice after every step."],
    terms: [["structured pruning", "removing whole heads, neurons or layers rather than scattered weights"], ["low-rank factorisation", "replacing a matrix with the product of two thin matrices"], ["grouped-query attention", "sharing key-value heads among query heads to shrink the cache"], ["calibration set", "a small sample used to choose quantisation scales"]],
    reflect: { q: "After 4-bit quantisation a model's average benchmark score drops by 0.5 points. Ship it?", a: "Not on the average alone. Check the per-task and per-slice results: quantisation losses concentrate on rare or numerically sensitive behaviours (arithmetic, rare languages, long-context recall), and a 0.5 average can hide a 10-point drop on the slice your users need. Ship if the slices you care about hold." },
  },

  "m49-continual-learning": {
    simple: "Continual learning is updating a model with new data over time without erasing what it already knew, which is hard because training on new examples naturally overwrites old skills.",
    concept:
      "Models are trained once and then frozen, but the world keeps changing: new products, new laws, new slang, new tasks. **Continual learning** means updating a model repeatedly as new data arrives. The obstacle is **catastrophic forgetting**: gradient updates that improve the new task move the weights away from the configuration that served the old tasks, and performance on them collapses, sometimes after a few hundred steps.\n\nThe approaches fall into three families. **Rehearsal** mixes a sample of old data into every update, so old skills keep being practised. **Regularisation** adds a penalty for changing the weights that mattered most for old tasks. **Architecture** isolates new learning in new parameters (adapters, new experts) while freezing the old ones. In practice, for large models, the dominant approach is rehearsal plus a low learning rate, or keeping the base model frozen and putting new knowledge in retrieval rather than in weights.\n\nThe honest state of the art: for facts that change, retrieval beats retraining; for skills that must change, careful rehearsal-based fine-tuning works; and every update needs an evaluation on old tasks before it ships.",
    why:
      "Retraining from scratch for every change is impossibly expensive, and fine-tuning naively breaks things. A support assistant updated for a new product line that forgets how to handle refunds is worse than the old one. Continual learning exists because models must change over time and the default way of changing them destroys the past.",
    how: [
      "Keep a replay buffer: a representative sample of past training data per skill, with evaluation sets per skill.",
      "For each update, mix new data with replayed old data (often 20–50% old) and use a small learning rate.",
      "Optionally weight the loss on old data by how much each parameter mattered (importance-based regularisation).",
      "Or freeze the base and train an adapter or new expert for the new skill; route to it when relevant.",
      "Evaluate every old skill after the update; block the release if any drops beyond tolerance.",
      "For factual changes, prefer updating a retrieval index over the weights; retrain only for skills.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Naive sequential fine-tuning", points: ["train on task B after task A", "weights move wherever B's gradients point", "task A accuracy falls from 90% to 40%", "nobody notices until users do"] },
      right: { title: "Continual learning", points: ["mix replayed A data with B data", "penalise changes to A-critical weights, or add an adapter", "task A stays at 88%, B reaches 85%", "old-task evals gate the release"] },
      caption: "The difference is not cleverness but discipline: old data in the batch, old tasks in the evaluation.",
    },
    everyday: {
      title: "Learning a new language without losing the old one",
      text: "Someone who moves abroad and speaks only the new language for years finds their mother tongue rusting: words gone, grammar awkward. People who keep reading and talking in both keep both. Rehearsal is the phone call home every week; the alternative is forgetting, and nobody plans it.",
    },
    engineering: {
      title: "Monthly updates to a medical coding model",
      text: "A health-tech company's model assigns billing codes to clinical notes; codes and guidelines change quarterly. The first update, fine-tuned on the new quarter's notes only, improved new codes by 12 points and silently dropped accuracy on three old specialities by up to 20 points. They rebuilt the process: a replay buffer of 50,000 notes stratified by speciality, a 60/40 new/old mix, learning rate a tenth of the original, and a release gate requiring every speciality's accuracy to stay within 1 point. Updates now take a day and have shipped for two years without a regression reaching production.",
    },
    maths: {
      formula: "L_total = L_new + λ Σᵢ Fᵢ (θᵢ − θᵢ*)²   (importance-weighted regularisation; Fᵢ = importance of parameter i for old tasks, θ* = old weights)",
      meaning: "Parameters that mattered for old tasks are expensive to move; unimportant ones are free. λ sets the balance.",
      worked: [
        "Two parameters. Old-task importances F = [10, 0.1]; old weights θ* = [1.0, 1.0]. The new task would like θ = [0.5, 2.0].",
        "Penalty for moving to the new task's preferred values: λ × (10 × 0.5² + 0.1 × 1.0²) = λ × (2.5 + 0.1) = 2.6λ. Almost all of the cost is parameter 1.",
        "With λ = 2 the optimiser compromises: it moves parameter 2 nearly all the way (cheap) and parameter 1 only a little (expensive), keeping the old task mostly intact while gaining most of the new one.",
      ],
      note: "This is elastic weight consolidation; the importances are estimated from the gradient statistics on old data.",
    },
    code: {
      title: "A rehearsal mix with a release gate",
      lang: "py",
      src: `def continual_update(model, new_data, replay_buffer, old_evals, lr=1e-5, new_share=0.6, tolerance=0.01):
    before = {name: evaluate(model, ev) for name, ev in old_evals.items()}
    mixed = mix(new_data, replay_buffer, new_share=new_share)       # old examples in every batch
    candidate = fine_tune(model, mixed, lr=lr, epochs=1)
    after = {name: evaluate(candidate, ev) for name, ev in old_evals.items()}
    regressions = {n: before[n] - after[n] for n in old_evals if before[n] - after[n] > tolerance}
    if regressions:
        return model, regressions                                      # keep the old model; report what broke
    return candidate, {}`,
      lines: [
        { code: "mixed = mix(new_data, replay_buffer, new_share=new_share)       # old examples in every batch", say: "Rehearsal: 40% of every batch is old data, so old skills keep receiving gradient." },
        { code: "candidate = fine_tune(model, mixed, lr=lr, epochs=1)", say: "A small learning rate and a single pass limit how far the weights can drift." },
        { code: "regressions = {n: before[n] - after[n] for n in old_evals if before[n] - after[n] > tolerance}", say: "Every old skill is measured; any drop beyond tolerance is named." },
        { code: "return model, regressions                                      # keep the old model; report what broke", say: "The gate: a regression blocks the update and tells the team which skill needs more replay." },
      ],
    },
    useIt: "Whenever a deployed model must be updated, use rehearsal with a stratified replay buffer, a low learning rate, per-skill evaluation gates, and adapters for genuinely new skills; put changing facts in retrieval rather than in weights. Keep the replay buffer and the evaluation sets as first-class assets.",
    takeaways: ["Naive fine-tuning on new data overwrites old skills: catastrophic forgetting.", "Rehearsal, regularisation and isolated parameters are the three defences; rehearsal plus a low learning rate is the workhorse.", "Changing facts belong in retrieval; changing skills in careful fine-tuning.", "Gate every update on old-task evaluations."],
    terms: [["catastrophic forgetting", "losing old skills when training on new data"], ["replay buffer / rehearsal", "old examples mixed into new training"], ["importance-weighted regularisation", "penalising changes to parameters that mattered for old tasks"]],
    reflect: { q: "Why does updating a retrieval index avoid forgetting while updating weights risks it?", a: "The index is additive storage: new documents sit beside old ones and nothing is overwritten. Weights are shared capacity: every gradient step changes numbers that encode many behaviours at once, so an update for one purpose moves others. Facts fit storage; skills need weights." },
  },

  "m49-reading-ai-research-papers": {
    simple: "Reading an AI paper well means finding its one claim, checking the evidence for that claim, and judging what would survive outside the paper's setup, in that order.",
    concept:
      "An AI paper is a structured argument: here is a problem, here is our method, here are experiments showing it beats alternatives, here is why. Thousands appear every month and most of them matter little to you. **Reading research** efficiently is a skill: decide quickly whether a paper is relevant, extract its claim and evidence without reading every line, and judge how much to trust it.\n\nThe method most researchers converge on is layered. First pass: title, abstract, figures, conclusion; ten minutes; decide whether to continue. Second pass: introduction, method, main results table; an hour; understand what was done and what was shown. Third pass: everything, including appendices; several hours; needed only if you will build on it. At every pass the questions are the same: what exactly is claimed, what evidence supports it, what was compared against, and what was left out.\n\nThe habit that matters most is scepticism about baselines and evaluation: a method that beats a weak baseline on a benchmark it was tuned for has shown less than its abstract says.",
    why:
      "Techniques in this field move from paper to production in months; engineers who cannot read papers depend on summaries written by people with something to sell. And bad papers are common: unfair baselines, benchmark contamination, cherry-picked results. Reading well exists as a skill because the alternative is to believe whatever was last tweeted.",
    how: [
      "Pass 1 (10 min): read the title, abstract, figure 1, the main results table and the conclusion. Write one sentence: 'this paper claims X, shown by Y'. Decide: stop, or pass 2.",
      "Pass 2 (1 hour): read the introduction, the method section and the experiments. List the baselines, the datasets, the metrics, and the compute used. Note every claim that the tables do not directly support.",
      "Check the comparison: are baselines tuned as carefully as the method? Same data? Same compute? Same model size?",
      "Check the evaluation: could the benchmark be in the training data? Are error bars or multiple seeds reported? Are results on held-out tasks included?",
      "Pass 3 (hours, if building on it): read the appendix, the code if released, the hyperparameters; try to reproduce a small result.",
      "Write a short note: claim, evidence, caveats, relevance to your work, and what you would need to verify before relying on it.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "pass 1", detail: "abstract, figure 1, results table, conclusion → one-sentence claim; continue?" },
        { label: "pass 2", detail: "method and experiments → baselines, data, metrics, compute; unsupported claims noted" },
        { label: "fairness check", detail: "baselines tuned? same data and compute? contamination? seeds?" },
        { label: "pass 3", detail: "appendix, code, hyperparameters; reproduce something small" },
        { label: "note", detail: "claim · evidence · caveats · relevance · what to verify" },
      ],
      caption: "Most papers end at pass 1. The fairness check is where most of the judgement happens.",
    },
    everyday: {
      title: "Reading a product review",
      text: "You do not read a thousand-word review of a kettle top to bottom. You check the score, the summary, the photo, and whether the reviewer compared it with other kettles or only praised it in isolation. If the review says 'boils fastest' you look for the comparison table and whether the other kettles were filled the same amount. Papers deserve exactly that scepticism, with more at stake.",
    },
    engineering: {
      title: "A team evaluates a new retrieval technique before adopting it",
      text: "A paper claims a new reranking method improves retrieval accuracy by 11 points. The team's pass 2 finds: the baseline reranker was run with default settings while the new method was tuned; the benchmark overlaps with the method's training data; results are single-seed. They reproduce the comparison on their own data with both methods tuned: the gain is 2 points, within noise. They adopt a cheaper method instead. Three hours of reading saved a quarter of engineering time.",
    },
    maths: {
      formula: "a difference of d points between two methods is meaningful only if d > roughly 2 × standard error;   standard error ≈ σ ÷ √(number of seeds or test examples)",
      meaning: "Small reported gains without variance information cannot be distinguished from chance.",
      worked: [
        "A benchmark with 1,000 test questions; a method scores 72.0%, the baseline 70.5%. Standard error of a proportion near 0.7 over 1,000 items ≈ √(0.7 × 0.3 ÷ 1,000) ≈ 0.0145, or 1.45 points.",
        "The 1.5-point gain is about one standard error: not significant. A 4-point gain (about 2.8 standard errors) would be.",
        "With three training seeds whose scores are 72.0, 70.1, 73.4 (σ ≈ 1.7), the seed-to-seed noise alone is larger than the claimed 1.5-point improvement.",
      ],
    },
    useIt: "Use layered reading for every paper you consider acting on, keep a notes file with claim/evidence/caveats, and run the fairness check before adopting any method. Over time the notes become a map of what in the field is solid and what is noise, which is worth more than any single paper.",
    takeaways: ["Three passes: decide, understand, build on; most papers stop at the first.", "Extract the one claim and the evidence for it; note what the tables do not show.", "Check baselines, data, compute, contamination and seeds before believing a gain.", "Write a note; your notes are the asset."],
    terms: [["baseline", "the existing method a new one is compared against"], ["benchmark contamination", "test data leaking into training data, inflating scores"], ["ablation", "removing one component to measure its contribution"], ["standard error", "the uncertainty of a measured score from finite samples or seeds"]],
    reflect: { q: "A paper reports a 20-point gain over the baseline but no ablations and no baseline hyperparameters. What is your working assumption?", a: "That the gain is real but smaller than reported: a tuned method against an untuned baseline typically inflates gains, and without ablations you cannot tell which part of the method matters. Treat it as a lead to reproduce, not a result to cite." },
  },

  "m49-reproducing-research-results": {
    simple: "Reproducing a result means re-running a paper's experiment yourself, at the scale you can afford, to find out whether the claim holds and what it actually took.",
    concept:
      "A paper is a report of what one team saw. **Reproducing** it is checking whether you see the same thing. Full reproduction at the paper's scale is often impossible; what is possible is reproducing the comparison at smaller scale, on your own data, or with the released code, and seeing whether the direction and rough size of the effect hold.\n\nReproduction reveals what papers omit: the hyperparameters that mattered, the data cleaning that was essential, the baseline that was never tuned, the one trick in the appendix that accounts for most of the gain. It is also how you learn a method deeply enough to use it, because every undocumented detail becomes your problem.\n\nFailures to reproduce are common and informative. A result that holds at your scale and on your data is worth more to you than any published number; a result that does not hold tells you not to build on it. Either way, the write-up of what you found is a contribution.",
    why:
      "Published results are produced under pressure to show gains, with selective reporting and unstated details. The field has learned that a meaningful share of results do not hold up. Reproduction exists as the quality control the publication process lacks, and for an engineer it is the only reliable way to know whether a technique will work in their system.",
    how: [
      "Choose a reproducible target: a specific table row or figure, ideally with released code and data.",
      "Set up the environment exactly: library versions, random seeds, data version; record all of it.",
      "Run the released code as-is first; compare numbers. Differences here are environment or data issues, not method issues.",
      "Reimplement if no code exists, from the paper's description, logging every decision the paper left unspecified.",
      "Scale down honestly: smaller model and data for both the method and the baseline, keeping the comparison fair.",
      "Report: your numbers next to theirs, every deviation, what you had to guess, and your conclusion about whether the claim holds.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Outcome", "What it usually means", "What to do"],
        rows: [
          ["matches within noise", "the result is solid in that setup", "test on your own data next"],
          ["direction holds, size smaller", "the paper's setup favoured the method, or tuning differed", "use it with reduced expectations"],
          ["cannot run the code", "environment drift, missing data", "pin versions; ask the authors; note it"],
          ["does not reproduce", "an unstated detail, a bug, or an unreliable result", "write it up; do not build on it"],
          ["reproduces only with an appendix trick", "the trick is the real contribution", "cite and use the trick"],
        ],
      },
      caption: "Every outcome is useful. The write-up is the deliverable whichever row you land on.",
    },
    everyday: {
      title: "Cooking from a famous recipe",
      text: "The recipe says 'bake 25 minutes'. Yours needs 40 because the author's oven runs hot and never said so. The second time you make it, you know. You also discover the 'optional' step in a footnote is what makes it work. Reproduction is making the dish yourself, writing down what the recipe forgot, and only then recommending it.",
    },
    engineering: {
      title: "Reproducing a quantisation method before trusting it",
      text: "A paper claims a 4-bit quantisation scheme keeps 99% of accuracy on a 7B model. A team reproduces it with the released code: 98.7% on the paper's benchmark, close. On their own long-context tasks: 91%. Digging in, they find the paper's calibration set was short text, and the scheme's per-group scales handle long-context attention poorly. They adopt the method with a long-context calibration set and recover 97%. The reproduction took three days and turned a misleading headline into a working deployment.",
    },
    maths: {
      formula: "report both: paper's score ± its noise, your score ± your noise;   difference is explained if |yours − theirs| < 2 × √(σ_yours² + σ_theirs²)",
      meaning: "Compare with uncertainty on both sides; a reproduction that differs by less than the combined noise has matched.",
      worked: [
        "Paper: 72.0% (single seed, no variance reported; assume σ ≈ 1.5 from the test-set size). Yours over three seeds: 70.8, 71.9, 70.3 → mean 71.0, σ ≈ 0.8.",
        "Combined noise = √(1.5² + 0.8²) = √(2.25 + 0.64) ≈ 1.7; threshold 3.4 points.",
        "|71.0 − 72.0| = 1.0 < 3.4: reproduced within noise. Had you measured 65.0, the 7-point gap would signal a real discrepancy to investigate.",
      ],
    },
    code: {
      title: "A reproduction log that makes the comparison honest",
      lang: "py",
      src: `import json, subprocess, time

def run_experiment(config, seeds):
    results = []
    for seed in seeds:
        cfg = dict(config, seed=seed)
        score = train_and_evaluate(cfg)                       # the actual experiment
        results.append(score)
    return results

log = {
    "paper": "arXiv:XXXX.XXXXX, Table 2 row 3",
    "claimed": 72.0,
    "environment": subprocess.run(["pip", "freeze"], capture_output=True, text=True).stdout.splitlines(),
    "deviations": ["batch 64 instead of 256 (memory); lr scaled by 1/4", "calibration set: our long-context sample"],
    "baseline": run_experiment(BASELINE_CFG, seeds=[0, 1, 2]),
    "method": run_experiment(METHOD_CFG, seeds=[0, 1, 2]),
    "finished": time.strftime("%Y-%m-%d"),
}
json.dump(log, open("reproduction.json", "w"), indent=2)
print(sum(log["method"]) / 3 - sum(log["baseline"]) / 3)`,
      lines: [
        { code: "\"claimed\": 72.0,", say: "The paper's number sits in the log next to yours; the comparison is the point." },
        { code: "\"environment\": subprocess.run([\"pip\", \"freeze\"], capture_output=True, text=True).stdout.splitlines(),", say: "Every library version recorded; most reproduction failures are environment drift." },
        { code: "\"deviations\": [\"batch 64 instead of 256 (memory); lr scaled by 1/4\", \"calibration set: our long-context sample\"],", say: "Every departure from the paper, written down, so a difference in results can be traced." },
        { code: "\"baseline\": run_experiment(BASELINE_CFG, seeds=[0, 1, 2]),", say: "The baseline is re-run under the same conditions, with the same seeds; a borrowed baseline number is not a comparison." },
      ],
    },
    useIt: "Reproduce before adopting any technique that will cost real engineering time: run released code, then reimplement if needed, scale down fairly, use several seeds, log environment and deviations, and write the result up whether it holds or not. The log is reusable by your team and sometimes by the field.",
    takeaways: ["Reproduction is the quality control publication lacks; do it before building on a result.", "Run released code first; reimplement only if needed; log every guess.", "Scale down both method and baseline fairly; use multiple seeds; compare with uncertainty.", "Every outcome is useful if written up."],
    terms: [["reproduction", "re-running an experiment to check its result"], ["seed", "the number that fixes the random choices in a run"], ["deviation log", "the record of every difference between your setup and the paper's"]],
    reflect: { q: "You reproduce a paper's method and it works, but your reimplementation of the baseline scores 5 points higher than the paper reported for it. What have you learned?", a: "That the paper's baseline was under-tuned, so its reported gain was inflated by about 5 points. The method may still help, but by less; and the paper's comparison, not its method, was the weak part." },
  },

  "m49-designing-experiments": {
    simple: "Designing an experiment means deciding, before running anything, what question you are asking, what you will change, what you will hold fixed, how you will measure, and what result would change your mind.",
    concept:
      "Most wasted compute in machine learning goes to experiments that could not have answered their question: too many things changed at once, no baseline, a metric that did not measure the goal, a single run whose noise exceeded the effect. **Designing experiments** is the discipline of deciding those things first.\n\nAn experiment isolates one question. It has a hypothesis ('a longer context improves summary faithfulness'), one variable that changes (context length), everything else held fixed (model, data, training steps, seeds), a metric chosen to measure the hypothesis (a faithfulness score on a held-out set, not a loss), enough repetitions to see through noise, and a decision rule written in advance ('adopt if the gain exceeds two standard errors').\n\nGood design also includes the negative: ablations that remove parts of a method to see what carries the effect, and sanity checks that would expose a bug (a shuffled-labels run that should score at chance).",
    why:
      "Compute is finite and results are noisy. Without design, teams run many runs and read patterns into noise, change three things and credit the wrong one, and tune on the test set without noticing. Experiment design exists so that each run spends compute on a question it can answer, and so that the answer survives a sceptical reader, including you a month later.",
    how: [
      "State the hypothesis in one sentence, with the metric that would support or refute it.",
      "Fix everything but one variable; if you must vary two, use a grid, not a mix.",
      "Choose the metric to match the goal; log several, decide on one in advance.",
      "Estimate the noise: run the baseline with three seeds; the spread is your noise floor.",
      "Size the experiment so the expected effect exceeds about twice that noise; otherwise it cannot be seen.",
      "Write the decision rule before running; run; include ablations and a sanity check; record everything, including failures.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "hypothesis", detail: "'adding 20% synthetic code data improves pass@1 on our internal tasks'" },
        { label: "variable", detail: "synthetic share: 0%, 10%, 20%, 40%" },
        { label: "fixed", detail: "model, total tokens, lr schedule, seeds {0,1,2}, eval set frozen" },
        { label: "metric", detail: "pass@1 on 300 real internal tasks (primary); general code benchmark (guard)" },
        { label: "noise floor", detail: "0% baseline over 3 seeds: 31.0 ± 1.4" },
        { label: "decision rule", detail: "adopt the share with the best primary score if it beats baseline by > 2.8 and the guard metric drops < 1" },
      ],
      caption: "Everything decided before the first run. The result cannot be argued with afterwards, including by its author.",
    },
    everyday: {
      title: "Testing a new fertiliser",
      text: "A gardener who tries a new fertiliser on the sunny bed and compares it with the shady bed learns nothing; sun and fertiliser changed together. Two neighbouring beds, same soil, same water, one difference, several plants each, measured by weight of tomatoes, with the decision ('buy more?') settled before harvest: that is an experiment.",
    },
    engineering: {
      title: "Deciding whether to switch optimisers for a production model",
      text: "A team wonders whether a newer optimiser trains their 2B model better. First attempt: one run each, new optimiser wins by 0.8 points; they nearly switch. Redesign: three seeds each, same steps, same schedule tuned per optimiser (an unfair test otherwise), primary metric the downstream task score, decision rule a 2-standard-error gain. Result: baseline 64.1 ± 1.1, new 64.6 ± 1.3. No real difference; the first 0.8 was noise. They keep the old optimiser and the week of compute that a switch would have cost.",
    },
    maths: {
      formula: "minimum detectable effect ≈ 2 × σ × √(2 ÷ n)   for n seeds per arm;   required seeds n ≈ 8 σ² ÷ d² to detect an effect of size d",
      meaning: "σ is the run-to-run standard deviation, d the effect you hope to see. Noise sets how many runs an honest comparison needs.",
      worked: [
        "Seed noise σ = 1.4 points. With n = 1 seed per arm: minimum detectable effect ≈ 2 × 1.4 × √2 ≈ 4.0 points. A 2-point gain is invisible.",
        "With n = 3: 2 × 1.4 × √(2 ÷ 3) ≈ 2.3 points. A 2-point gain is borderline.",
        "To detect d = 1.5 points reliably: n ≈ 8 × 1.96 ÷ 2.25 ≈ 7 seeds per arm, 14 runs. If that is unaffordable, the experiment cannot answer the question, and knowing that saves the compute.",
      ],
    },
    code: {
      title: "An experiment plan as code",
      lang: "py",
      src: `EXPERIMENT = {
    "hypothesis": "20% synthetic code data improves pass@1 on internal tasks",
    "variable": {"synthetic_share": [0.0, 0.1, 0.2, 0.4]},
    "fixed": {"model": "code-2b", "tokens": 20e9, "lr_schedule": "cosine", "seeds": [0, 1, 2]},
    "primary_metric": "pass_at_1_internal",
    "guard_metrics": {"general_code_bench": -1.0},        # must not drop more than 1 point
    "decision": "adopt best share if primary gain > 2 * stderr and guards hold",
}

def run(plan):
    results = {}
    for share in plan["variable"]["synthetic_share"]:
        scores = [train_eval(dict(plan["fixed"], synthetic_share=share, seed=s)) for s in plan["fixed"]["seeds"]]
        results[share] = (mean(scores), stderr(scores))
    return results

results = run(EXPERIMENT)
base_mean, base_se = results[0.0]
for share, (m, se) in results.items():
    print(share, round(m, 1), "±", round(se, 1), "significant" if m - base_mean > 2 * (base_se ** 2 + se ** 2) ** 0.5 else "noise")`,
      lines: [
        { code: "\"variable\": {\"synthetic_share\": [0.0, 0.1, 0.2, 0.4]},", say: "One thing varies, over a planned grid, including the zero baseline." },
        { code: "\"fixed\": {\"model\": \"code-2b\", \"tokens\": 20e9, \"lr_schedule\": \"cosine\", \"seeds\": [0, 1, 2]},", say: "Everything else pinned, seeds included, so runs differ only in the variable." },
        { code: "\"decision\": \"adopt best share if primary gain > 2 * stderr and guards hold\",", say: "The rule exists before the data. It cannot be bent to fit a result." },
        { code: "print(share, round(m, 1), \"±\", round(se, 1), \"significant\" if m - base_mean > 2 * (base_se ** 2 + se ** 2) ** 0.5 else \"noise\")", say: "Each arm is reported with its uncertainty and judged against the combined noise, not against a single number." },
      ],
    },
    useIt: "Design every experiment that will consume real compute or decide a real question: hypothesis, one variable, fixed everything else, chosen metric, measured noise floor, decision rule in advance, ablations and sanity checks. Keep plans and results together in a log; the log is what lets a team learn from its own history.",
    takeaways: ["Decide the question, the variable, the fixed conditions, the metric and the decision rule before running.", "Measure the noise floor with seeds; size the experiment so the effect can be seen.", "Ablate to find what carries the effect; sanity-check to catch bugs.", "Record everything, including failures."],
    terms: [["hypothesis", "the one-sentence claim the experiment tests"], ["noise floor", "the run-to-run variation with nothing changed"], ["decision rule", "the pre-written condition for acting on the result"], ["sanity check", "a run that should fail or score at chance if the setup is correct"]],
    reflect: { q: "A team runs twelve variants of a method, reports the best one, and claims a 3-point gain over the baseline. With seed noise of 1.5 points, what is wrong?", a: "Selecting the best of twelve noisy runs almost guarantees a 'gain' of a couple of standard deviations by chance alone. The honest comparison re-runs the chosen variant with fresh seeds against the baseline, or corrects for the number of comparisons; as reported, the 3 points may be nothing." },
  },
};

export const M49_QUIZ: Quiz[] = [
  {
    q: "A 30B-parameter model is trained in mixed precision. Roughly how much memory do weights, gradients and optimiser state need before activations, and what does that imply?",
    options: ["60 GB; it fits on one 80 GB GPU", "About 480 GB (16 bytes per parameter); it must be split across several GPUs", "30 GB", "4.8 TB"],
    answer: 1,
    why: ["That would be 2 bytes per parameter, weights only.", "Correct. 30B × 16 bytes = 480 GB; memory alone forces distribution.", "Too small by an order of magnitude.", "Too large by an order of magnitude."],
    reason: true,
  },
  {
    q: "What is the only communication step in plain data parallelism?",
    options: ["Sending activations between layers", "Averaging gradients across all replicas each step", "Gathering weight slices before each layer", "Broadcasting the data"],
    answer: 1,
    why: ["That is pipeline parallelism.", "Correct. The all-reduce of gradients keeps replicas identical.", "That is sharded data parallelism or tensor parallelism.", "Each replica loads its own slice of data."],
  },
  {
    q: "Why does tensor parallelism need to stay within one machine's fast links?",
    options: ["It only works on 8 GPUs", "It communicates partial activations several times per layer, so slow links dominate the step", "It sends the whole model every step", "It is a software limitation"],
    answer: 1,
    why: ["The count is incidental.", "Correct. Per-layer all-reduces over a slow network can halve throughput.", "Weights stay put; activations move.", "It is a bandwidth limitation."],
  },
  {
    q: "A pipeline has 8 stages and 4 micro-batches. What fraction of time is the bubble?",
    options: ["4/8", "7/11", "1/8", "0"],
    answer: 1,
    why: ["Not the formula.", "Correct. (S − 1) ÷ (M + S − 1) = 7 ÷ 11 ≈ 64% idle.", "Too optimistic.", "There is always fill and drain time."],
    reason: true,
  },
  {
    q: "Gradient accumulation over 32 micro-batches of 32 examples is mathematically equivalent to what?",
    options: ["32 separate updates", "One update on a batch of 1,024 (for models without batch-norm)", "A learning rate 32 times larger", "Nothing; it is an approximation"],
    answer: 1,
    why: ["There is exactly one update.", "Correct. Summed and averaged gradients equal the big-batch gradient; batch-norm statistics are the exception.", "The learning rate is unchanged.", "It is exact for per-example normalisation."],
  },
  {
    q: "Why keep a 32-bit master copy of the weights in mixed-precision training?",
    options: ["To make the model bigger", "So that small updates are not lost to 16-bit rounding", "Because GPUs cannot store 16-bit", "To speed up the forward pass"],
    answer: 1,
    why: ["Size is not the purpose.", "Correct. A 0.0003 update vanishes in FP16 near 1.0 but survives in FP32.", "They can; that is where the speed comes from.", "The forward pass runs in 16-bit; the master copy is for updates."],
  },
  {
    q: "Which stage of a curriculum has the most influence on the final model's behaviour, and why?",
    options: ["The first, because it sets initial weights", "The last, because the learning rate is annealing and recent data is overwritten least", "The middle, because it is largest", "All equally"],
    answer: 1,
    why: ["Early updates are largely overwritten.", "Correct. That is why curated and domain data are placed in the final stage.", "Volume is not influence.", "Order matters."],
  },
  {
    q: "A team trains a model on code generated by another model, keeping everything the generator produced. Accuracy plateaus below a verified-data run. Why?",
    options: ["Synthetic data never helps", "Unverified generations include wrong solutions, which the model learns too", "The model was too small", "They needed more epochs"],
    answer: 1,
    why: ["It helps when verified.", "Correct. Running tests and keeping only passing examples removed the wrong ones.", "Size was not the variable.", "More epochs on wrong data do not help."],
  },
  {
    q: "What does the temperature do in distillation?",
    options: ["Speeds up training", "Spreads the teacher's distribution so near-miss classes carry signal to the student", "Reduces the student's size", "Removes the label term"],
    answer: 1,
    why: ["It changes targets, not speed.", "Correct. Softened targets transfer the 'dark knowledge' in wrong-answer probabilities.", "The student architecture is fixed separately.", "The label term is controlled by α."],
    reason: true,
  },
  {
    q: "Fine-tuning a deployed model on this quarter's data only, accuracy on older specialities drops 20 points. What is the first fix?",
    options: ["A bigger model", "Rehearsal: mix a stratified sample of old data into every update, lower the learning rate, and gate releases on old-task evaluations", "Train for longer on the new data", "Delete the old evaluation sets"],
    answer: 1,
    why: ["Size does not prevent forgetting.", "Correct. Old data in the batch and old tasks in the gate.", "That increases forgetting.", "The evaluations are what caught the problem."],
  },
  {
    q: "A paper reports a 1.5-point gain on a 1,000-question benchmark with a single seed. What is the standard error of a score near 70%, and what does it imply?",
    options: ["About 0.1 points; the gain is significant", "About 1.45 points; the gain is within noise", "About 15 points", "Standard error does not apply"],
    answer: 1,
    why: ["Too small.", "Correct. √(0.7 × 0.3 ÷ 1000) ≈ 0.0145; a 1.5-point gain is about one standard error.", "Too large.", "It applies to any score from a finite test set."],
  },
  {
    q: "Which experiment design is sound?",
    options: ["Change the optimiser and the learning rate together, one run each, pick the winner", "Vary only synthetic data share over a grid, fix all else, three seeds per arm, decision rule written first", "Run twelve variants, report the best", "Tune on the test set to save time"],
    answer: 1,
    why: ["Two variables changed; cannot attribute the effect.", "Correct. One variable, fixed conditions, measured noise, pre-registered decision.", "Best-of-many is noise selection.", "Tuning on the test set makes the score meaningless."],
  },
];

export const M49_EXERCISES: Exercise[] = [
  {
    title: "Plan a distributed training run",
    kind: "calculate",
    task: "You must train a 40B-parameter model on 800 billion tokens. Each machine has 8 GPUs (80 GB each, 10¹⁵ FLOP/s each) with fast internal links; machines are joined by a slower network. Estimate (a) the minimum memory for weights, gradients and optimiser state in mixed precision, (b) the total training FLOPs, (c) a parallelism layout for 128 GPUs, and (d) the wall-clock time at 45% utilisation.",
    hints: ["16 bytes per parameter for training state", "FLOPs ≈ 6 × parameters × tokens", "tensor parallelism inside machines, pipeline across, data across groups"],
    solution: "(a) 40B × 16 bytes = 640 GB of state, so at least 8 GPUs before activations; realistically 16+. (b) 6 × 40 × 10⁹ × 800 × 10⁹ = 1.92 × 10²³ FLOPs. (c) 128 GPUs = 16 machines: tensor parallel 8 within each machine, pipeline parallel 4 across groups of machines, data parallel 4 across the remaining groups (8 × 4 × 4 = 128). (d) Effective rate 128 × 10¹⁵ × 0.45 = 5.76 × 10¹⁶ FLOP/s; time = 1.92 × 10²³ ÷ 5.76 × 10¹⁶ ≈ 3.33 × 10⁶ s ≈ 39 days, plus restarts; plan for about seven weeks with checkpoints every 30 minutes.",
  },
  {
    title: "Work out pipeline utilisation and fix it",
    kind: "calculate",
    task: "A 6-stage pipeline runs 6 micro-batches per step. Compute the bubble fraction and utilisation. Then find the smallest number of micro-batches that reaches 85% utilisation, and name one memory consequence and one remedy.",
    hints: ["utilisation = M ÷ (M + S − 1)", "solve M ÷ (M + 5) ≥ 0.85"],
    solution: "Bubble = 5 ÷ 11 ≈ 45%; utilisation 55%. For 85%: M ÷ (M + 5) ≥ 0.85 → M ≥ 0.85M + 4.25 → 0.15M ≥ 4.25 → M ≥ 28.3, so 29 micro-batches. Consequence: activations for many more in-flight micro-batches must be stored per stage, raising memory several-fold. Remedy: activation checkpointing (recompute in the backward pass) or smaller micro-batches, balanced against per-micro-batch GPU efficiency.",
  },
  {
    title: "Compute a distillation loss and explain the temperature",
    kind: "calculate",
    task: "Teacher logits over four classes: [6, 3, 1, 0]. Compute the teacher's soft targets at T = 1 and T = 3 (two decimals). Then say which classes the student learns about at each temperature, and why a very high temperature would be a bad choice.",
    hints: ["softmax(logits ÷ T)", "At high T everything tends toward uniform."],
    solution: "T = 1: exp(6, 3, 1, 0) = 403.4, 20.1, 2.7, 1.0; sum 427.2 → [0.94, 0.05, 0.01, 0.00]. T = 3: logits ÷ 3 = [2, 1, 0.33, 0] → exp 7.39, 2.72, 1.40, 1.00; sum 12.5 → [0.59, 0.22, 0.11, 0.08]. At T = 1 the student learns almost only 'class 1 is right'. At T = 3 it also learns that class 2 is a plausible confusion and class 3 less so. At very high T the targets approach uniform [0.25 × 4], carrying no information about which classes are plausible; the signal is washed out.",
  },
  {
    title: "Design the experiment, then critique a paper",
    kind: "think",
    task: "(a) Write an experiment plan to test whether a new tokeniser improves a 1B model's code benchmark score: hypothesis, variable, fixed conditions, metric, noise estimation, decision rule, one ablation, one sanity check. (b) A paper claims its tokeniser gives +4 points, single seed, baseline trained with the paper's own default settings, benchmark released after the model's training data cut-off date. List three concerns and what you would do before adopting it.",
    hints: ["Fix the model, tokens, schedule and seeds; vary only the tokeniser.", "Concerns: seeds, baseline tuning, contamination."],
    solution: "(a) Hypothesis: the new tokeniser raises pass@1 on the code benchmark at equal training tokens. Variable: tokeniser (old vs new). Fixed: 1B architecture, 20B training tokens (counted in bytes to be fair across tokenisers), cosine schedule tuned once per tokeniser, seeds 0–2, frozen evaluation set. Metric: pass@1 primary; general language benchmark as a guard. Noise: three baseline seeds give the standard error. Decision: adopt if the gain exceeds 2 × combined standard error and the guard holds within 1 point. Ablation: the new tokeniser with the old vocabulary size, to separate vocabulary size from the merge algorithm. Sanity check: train with shuffled labels on a small classification probe and confirm chance accuracy. (b) Concerns: single seed, so the 4 points may be noise (need several seeds); baseline at defaults versus a tuned method inflates gains (re-tune the baseline); the benchmark's release date suggests the method's training data may contain it (check contamination; evaluate on a fresh held-out set). Before adopting: reproduce with three seeds and a tuned baseline on your own held-out code tasks.",
  },
];
