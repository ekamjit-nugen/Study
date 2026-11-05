import type { Exercise, LessonBody, Quiz } from "../types";

// Module 22: Parameter-efficient fine-tuning. One concept per lesson. Keys are lesson slugs: m22-<kebab of the concept title in map.ts>.

export const M22_BODIES: Record<string, LessonBody> = {
  "m22-why-full-fine-tuning-is-expensive": {
    simple: "Full fine-tuning updates every parameter, so it needs the complete training state in memory (about 16 bytes per parameter), many GPUs, and a full copy of the model for every variant you make.",
    concept:
      "Fine-tuning (Module 21) runs gradient descent on a trained model. If every one of its billions of weights is trainable, that is **full fine-tuning**, and it carries the same memory bill as pretraining: for each parameter, the weight itself in 16-bit (2 bytes), its gradient (2 bytes), a 32-bit master copy (4 bytes) and Adam's two running averages (8 bytes), about 16 bytes in all, before activations. A 7B model needs around 112 GB of training state; a 70B model needs about 1.1 TB.\n\nThe cost does not stop at training. Every full fine-tune produces a complete new copy of the model: 14 GB for a 7B model in 16-bit. Ten customers with ten customisations means ten full copies to store, version and serve, and switching between them means loading gigabytes.\n\nAnd there is the forgetting risk from Module 21: with every weight free to move, a narrow dataset can overwrite general ability. Full fine-tuning is the most powerful option and the most expensive in memory, storage and risk, which is why the rest of this module exists.",
    why:
      "A 7B model that serves on one 24 GB graphics card cannot be fully fine-tuned on that card, or on four of them. The gap between serving requirements and training requirements, roughly eight times, locks most teams out of adapting the models they can afford to run. Parameter-efficient methods exist to close that gap: train a small fraction of the numbers, keep the rest frozen, and get most of the benefit for a fraction of the memory.",
    how: [
      "Count the parameters N of the model you want to adapt.",
      "Training-state memory ≈ 16 × N bytes with mixed precision and Adam; add activations for your batch and sequence length.",
      "Compare with the GPUs available; if it does not fit, full fine-tuning needs model parallelism across several large GPUs.",
      "Count the variants you need: each full fine-tune is a complete model copy to store and load.",
      "Weigh the forgetting risk: every weight is free to move.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "Serving (16-bit)", "Full fine-tune state", "Minimum 80 GB GPUs", "Copy per variant"],
        rows: [
          ["3B", "6 GB", "48 GB", "1", "6 GB"],
          ["7B", "14 GB", "112 GB", "2 (realistically 4–8)", "14 GB"],
          ["13B", "26 GB", "208 GB", "3 (realistically 8)", "26 GB"],
          ["70B", "140 GB", "1,120 GB", "14 (realistically 32–64)", "140 GB"],
        ],
      },
      caption: "The training column is about eight times the serving column. That factor is the problem this module solves.",
    },
    everyday: {
      title: "Repainting the whole house to change one room",
      text: "You want the study a different colour. Full fine-tuning is repainting every room: it needs scaffolding for the whole house, takes days, and if you want three different studies for three tenants you keep three whole houses. Painting just the study would be the sensible thing, if only the house allowed it. The next lessons make the house allow it.",
    },
    engineering: {
      title: "Ten customers, ten copies",
      text: "A company offers customised assistants to ten enterprise customers, each fully fine-tuned from the same 13B model. Storage: 10 × 26 GB. Serving: each customer's traffic needs its own loaded model or a full reload on switch, so they run ten model servers at low utilisation. Training each variant takes eight 80 GB GPUs. When the base model is upgraded, all ten must be retrained. With adapters (lesson 6) the same product stores ten 40 MB files, serves them from one base model, and retrains in an hour each on one GPU.",
    },
    maths: {
      formula: "training state ≈ N × (2 + 2 + 4 + 8) bytes = 16N;   activations ≈ batch × seq × layers × hidden × c bytes",
      meaning: "The sixteen bytes are weight, gradient, master weight and two Adam moments. Activations are extra and scale with batch size and sequence length; the constant c depends on the implementation and checkpointing.",
      worked: [
        "7B model: 7 × 10⁹ × 16 = 1.12 × 10¹¹ bytes = 112 GB of training state.",
        "Activations for batch 8, sequence 2,048, 32 layers, hidden 4,096, with a rough c of 34 bytes: 8 × 2,048 × 32 × 4,096 × 34 ≈ 7.3 × 10¹⁰ bytes ≈ 73 GB without checkpointing, about a quarter of that with it.",
        "Total ≈ 130 GB with checkpointing: at least two 80 GB GPUs, and that is the smallest batch that trains sensibly.",
        "A 24 GB consumer card is about five times too small for even the training state alone.",
      ],
    },
    useIt: "Do the 16N arithmetic before any fine-tuning plan. If the result exceeds the GPUs you have, or you need several variants, or forgetting is a concern, use the parameter-efficient methods in the rest of this module. Reserve full fine-tuning for when you have the hardware and need to change the model deeply (for example after continued pretraining).",
    takeaways: ["Full fine-tuning updates all weights and needs ~16 bytes per parameter plus activations.", "It is about eight times the memory of serving; a 7B model needs ~112 GB to train fully.", "Every variant is a full copy to store and serve.", "All weights free to move means the highest forgetting risk."],
    terms: [["full fine-tuning", "fine-tuning in which every parameter is trainable"], ["training state", "weights, gradients, master weights and optimiser moments kept during training"]],
    reflect: { q: "Why is the master copy kept in 32-bit when the model runs in 16-bit?", a: "Updates from a small learning rate are tiny; in 16-bit precision many of them would round to zero and the weight would never move. The 32-bit master copy accumulates small updates faithfully, and the 16-bit copy is refreshed from it for the fast forward and backward passes." },
  },

  "m22-parameter-efficient-fine-tuning-peft": {
    simple: "PEFT freezes the pretrained weights and trains a small number of added or selected parameters, cutting memory and storage by orders of magnitude while keeping most of full fine-tuning's benefit.",
    concept:
      "**Parameter-efficient fine-tuning**, PEFT, is a family of methods with one idea: do not train all the weights. Keep the pretrained model frozen, and train only a small set of parameters that steer it. The set can be added (small new matrices alongside existing ones, extra tokens prepended to the input, small bottleneck layers inserted between blocks) or selected (just the bias terms, just the layer-norm scales, just the last few layers).\n\nBecause only the small set has gradients and optimiser state, the 16-bytes-per-parameter bill applies only to it. The frozen base needs only its weights in memory, and those can be stored in low precision (lesson 7). The result is that a 7B model fine-tunes on a single consumer GPU, and the output of training is a file of megabytes rather than gigabytes.\n\nThe surprising finding is how well it works. For most adaptation tasks, training under 1% of the parameters matches full fine-tuning within a point or two, because the base model already contains the abilities; fine-tuning mostly needs to steer, and steering needs few parameters. LoRA (next lesson) is the method that won.",
    why:
      "Full fine-tuning's memory and storage costs excluded almost everyone from adapting large models. PEFT exists because of the observation that fine-tuning changes are low-dimensional: the difference between a fine-tuned model and its base can be captured by a small number of parameters. Once that was shown, the cost of customisation fell by a hundred times and customisation became something a single developer does in an afternoon.",
    how: [
      "Load the pretrained model and freeze all its parameters (no gradients).",
      "Add or select the small trainable set according to the chosen method.",
      "Train as in Module 21: same data, same loss mask, usually a higher learning rate than full fine-tuning because the trainable set is small.",
      "Save only the trainable parameters: an adapter file.",
      "At inference, load the base model once and apply the adapter; many adapters can share one base.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Method", "What is trained", "Typical share of parameters", "Notes"],
        rows: [
          ["LoRA", "low-rank matrices added beside attention and MLP weights", "0.1–1%", "the standard choice; mergeable"],
          ["adapters (bottleneck)", "small layers inserted between blocks", "0.5–3%", "adds a little inference latency"],
          ["prefix / prompt tuning", "learned vectors prepended to the input or to each layer's keys and values", "<0.1%", "weak for complex tasks; no architecture change"],
          ["BitFit", "only bias terms", "<0.1%", "surprisingly decent on simple tasks"],
          ["selective layers", "the last k layers or layer norms", "varies", "simple; less effective than LoRA"],
        ],
      },
      caption: "All share the freeze-and-steer idea. LoRA dominates in practice because it is effective, mergeable and cheap.",
    },
    everyday: {
      title: "Adjusting the mixing desk, not rebuilding the band",
      text: "A band plays the same songs at every venue; the sound engineer adjusts a few sliders for the room rather than retraining the musicians. The band is the frozen base, the sliders are the trainable parameters, and the engineer's settings sheet, a few lines on paper, is the adapter you keep for that venue.",
    },
    engineering: {
      title: "From a GPU cluster to a laptop",
      text: "A two-person start-up needs a 7B model adapted to classify legal clauses. Full fine-tuning would cost them about $1,500 in cluster time per run and need an infrastructure engineer. With PEFT (LoRA on a quantised base, lesson 7), the run fits on a rented single 24 GB GPU at $0.50 an hour, takes 90 minutes, and produces a 35 MB adapter file they version in git. They iterate on the dataset eight times in a week, which full fine-tuning's cost would never have allowed. The iteration, not the method, is what got them to 91% accuracy.",
    },
    maths: {
      formula: "trainable state ≈ 16 × N_trainable;   frozen base ≈ N × bytes per weight;   total ≈ 16 × N_trainable + N × b + activations",
      meaning: "Only the trainable set pays the sixteen-byte bill. The frozen base pays only for its weights at whatever precision it is stored in.",
      worked: [
        "7B model with a LoRA set of 20 million trainable parameters: trainable state = 16 × 2 × 10⁷ = 3.2 × 10⁸ bytes = 320 MB.",
        "Frozen base in 16-bit: 7 × 10⁹ × 2 = 14 GB. Total ≈ 14.3 GB plus activations.",
        "Frozen base in 4-bit (lesson 7): 7 × 10⁹ × 0.5 ≈ 3.5 GB. Total ≈ 3.8 GB plus activations: fits a 24 GB card with room for a decent batch.",
        "Compared with 112 GB for full fine-tuning, that is roughly 30 times less memory for the same model.",
      ],
    },
    useIt: "Default to PEFT for every fine-tune unless you have a specific reason for full fine-tuning. It fits on hardware you have, produces small shareable files, reduces forgetting, and lets you iterate on data many times, which is where quality actually comes from.",
    takeaways: ["PEFT freezes the base and trains a small added or selected set of parameters.", "Memory and storage fall by orders of magnitude; a 7B model fits one consumer GPU.", "Under 1% trainable parameters usually matches full fine-tuning within a point or two.", "LoRA is the method that won; the rest of this module explains it."],
    terms: [["PEFT", "parameter-efficient fine-tuning: training a small subset of parameters with the rest frozen"], ["adapter", "the small set of trained parameters saved separately from the base model"], ["frozen", "a parameter excluded from training; no gradient, no optimiser state"]],
    reflect: { q: "If steering needs so few parameters, why did pretraining need billions?", a: "Pretraining builds the abilities from nothing: language, facts, reasoning. Fine-tuning only selects and reshapes what exists, which is a far smaller change. The billions hold the capability; the adapter chooses how to use it." },
  },

  "m22-lora": {
    simple: "LoRA adds two small matrices beside each large weight matrix, trains only those, and adds their product to the frozen weight; it captures most of fine-tuning's effect with a tiny fraction of the parameters.",
    concept:
      "**LoRA**, low-rank adaptation, starts from an observation: when a model is fully fine-tuned, the change to each weight matrix, ΔW, turns out to be low-rank (next lesson explains that word). So instead of training ΔW directly, LoRA writes it as the product of two thin matrices, B × A, where A is r × d and B is d × r for a small rank r such as 8 or 16. The frozen weight W is untouched; the layer computes W·x + B·A·x. Only A and B are trained.\n\nThe parameter saving is enormous: a 4,096 × 4,096 matrix has 16.8 million weights; A and B at rank 8 have 65,536 between them, 0.4%. Applied to the attention and MLP matrices of every layer, a 7B model gets around 20 million trainable parameters.\n\nB starts at zero so that at the beginning of training B·A is zero and the model behaves exactly like the base; A starts random. A scaling factor α/r controls how strongly the adapter's output is added. After training, B·A can be added into W permanently (lesson 9), so inference costs nothing extra.",
    why:
      "Earlier PEFT methods either added inference latency (bottleneck adapters) or were weak (prompt tuning). LoRA has neither problem: it is as accurate as full fine-tuning on most tasks, trains with a fraction of the memory, produces megabyte-sized files, can be merged into the base for zero overhead, and lets many adapters share one base. It became the default within a year of its publication because it removed every practical objection at once.",
    how: [
      "Choose which matrices to adapt: typically the attention projections (query, key, value, output) and often the MLP matrices too.",
      "For each chosen d_out × d_in matrix W, create A (r × d_in, random) and B (d_out × r, zeros).",
      "Forward: output = W·x + (α/r) · B·(A·x). W is frozen.",
      "Train A and B with the usual SFT loss; learning rate typically 1e-4 to 3e-4, higher than full fine-tuning.",
      "Save A and B for every adapted matrix: the adapter. Optionally merge W + (α/r)·B·A for deployment.",
    ],
    visual: {
      kind: "flow",
      steps: ["input x (4,096)", "frozen W: 4,096 × 4,096 → W·x", "A: 8 × 4,096 → A·x (8 numbers)", "B: 4,096 × 8 → B·(A·x)", "sum: W·x + (α/r)·B·A·x", "output (4,096)"],
      caption: "The side path squeezes the input through r = 8 numbers and expands it back. Only the side path learns.",
    },
    everyday: {
      title: "A thin correction sheet over a printed map",
      text: "A printed map is accurate but out of date in a few places. Rather than reprint it, you lay a transparent sheet over it with a handful of corrections drawn on. The map is the frozen weight; the sheet is B·A; and because the corrections are few, the sheet is almost empty. You can keep one sheet per city and swap them over the same map.",
    },
    engineering: {
      title: "The 35 MB file that changed a 14 GB model",
      text: "A team adapts a 7B instruct model to write product descriptions in a retailer's voice. LoRA rank 16 on attention and MLP matrices: 42 million trainable parameters, 0.6% of the model. Training on 3,000 examples takes 70 minutes on one 24 GB GPU with the base in 4-bit. The adapter file is 35 MB. Reviewers prefer its output to the full fine-tune a contractor had produced earlier on eight GPUs, which had drifted in tone from over-training. The retailer now keeps six adapters, one per brand, over a single base.",
    },
    maths: {
      formula: "parameters(LoRA) = r × (d_in + d_out);   parameters(full) = d_in × d_out;   share = r × (d_in + d_out) ÷ (d_in × d_out)",
      meaning: "A and B have r rows and r columns respectively; their sizes add rather than multiply, which is where the saving comes from.",
      worked: [
        "One attention matrix, d_in = d_out = 4,096, rank r = 8: LoRA parameters = 8 × (4,096 + 4,096) = 65,536.",
        "Full matrix: 4,096 × 4,096 = 16,777,216. Share = 65,536 ÷ 16,777,216 ≈ 0.39%.",
        "A 7B model with 32 layers, adapting 4 attention matrices of 4,096 × 4,096 and 3 MLP matrices of about 4,096 × 11,008 per layer at rank 16: attention 4 × 16 × 8,192 = 524,288; MLP 3 × 16 × 15,104 = 725,000; per layer ≈ 1.25 million; × 32 ≈ 40 million trainable parameters, about 0.57% of 7 billion.",
        "Adapter file at 16-bit: 40 × 10⁶ × 2 bytes ≈ 80 MB; at rank 8 about 40 MB.",
      ],
    },
    code: {
      title: "Adding LoRA to a model with the PEFT library",
      lang: "py",
      src: `from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model

model = AutoModelForCausalLM.from_pretrained("open-weights/instruct-7b", torch_dtype="bfloat16")

config = LoraConfig(
    r=16,                                          # rank of A and B
    lora_alpha=32,                                 # scaling: alpha / r = 2
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, config)             # freezes the base, adds A and B everywhere listed
model.print_trainable_parameters()                # trainable params: ~40M || all params: ~7B || 0.57%`,
      lines: [
        { code: "r=16,                                          # rank of A and B", say: "The width of the side path. Eight to sixty-four is the usual range; the next two lessons explain the choice." },
        { code: "lora_alpha=32,                                 # scaling: alpha / r = 2", say: "How strongly the adapter's output is added. Alpha of twice the rank is a common default." },
        { code: "target_modules=[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\", \"gate_proj\", \"up_proj\", \"down_proj\"],", say: "Which matrices get a side path: all attention projections and the MLP. More targets, more capacity, slightly more memory." },
        { code: "model = get_peft_model(model, config)             # freezes the base, adds A and B everywhere listed", say: "One call freezes seven billion weights and attaches the trainable matrices." },
        { code: "model.print_trainable_parameters()                # trainable params: ~40M || all params: ~7B || 0.57%", say: "The number to check before training: well under one percent is trainable." },
      ],
      note: "Training then proceeds exactly as in Module 21; the Trainer sees only the adapter parameters as trainable.",
    },
    useIt: "LoRA is the default way to adapt any open-weight model: classification, extraction, style, instruction following, and the Punjabi work in Stage 9. Adapt attention and MLP matrices, start at rank 8 to 16 with alpha twice the rank, and keep adapters per task over one shared base.",
    takeaways: ["LoRA writes the weight change as B·A with a small rank r and trains only A and B; W stays frozen.", "Parameters scale with r × (d_in + d_out) instead of d_in × d_out: under 1% of the model.", "B starts at zero, so training begins from the base model's behaviour.", "Adapters are megabytes, shareable, and mergeable for zero inference overhead."],
    terms: [["LoRA", "low-rank adaptation: training two thin matrices whose product is added to a frozen weight"], ["rank (r)", "the inner dimension of the two LoRA matrices; their capacity"], ["alpha", "the scaling constant applied to the adapter's output, used as alpha divided by r"]],
    reflect: { q: "Why initialise B to zero rather than both A and B randomly?", a: "With B = 0, the product B·A is zero at the start, so the adapted model is exactly the base model on step one and training moves away from a known-good point. Random B·A would add noise to every layer's output before any learning, degrading the model before it improves." },
  },

  "m22-low-rank-matrices": {
    simple: "A low-rank matrix is one that can be written as the product of two thin matrices; it has far fewer independent numbers than its size suggests, which is why LoRA can be small.",
    concept:
      "A matrix (Module 3) is a grid of numbers, but not every grid carries as much information as its size. The **rank** of a matrix is the number of independent directions it contains: the number of rows (or columns) that cannot be built by combining the others. A 4,096 × 4,096 matrix can have rank anywhere from 0 to 4,096. If its rank is 8, every one of its 16.8 million entries is determined by far fewer numbers, and it can be written exactly as B × A with B of shape 4,096 × 8 and A of shape 8 × 4,096.\n\nA **low-rank matrix** is one whose rank is much smaller than its dimensions. It is 'big but simple': it maps every input into a small number of directions and expands them back. Fine-tuning changes ΔW were found, empirically, to be close to low-rank: the fine-tune moves the weights along a handful of directions, not all 4,096. That is the fact LoRA relies on.\n\nThe tool for measuring this is the singular value decomposition, which lists a matrix's directions in order of importance; if the importance drops to nearly zero after a few, the matrix is effectively low-rank.",
    why:
      "Without the low-rank observation, PEFT would be a compromise: train fewer parameters and accept worse results. With it, LoRA is nearly free: the change you would have made with full fine-tuning was going to be low-rank anyway, so representing it with two thin matrices loses almost nothing. Understanding rank also tells you what LoRA cannot do: a change that genuinely needs many independent directions (such as learning a whole new language) is not low-rank, and LoRA at small rank will underfit it.",
    how: [
      "Write a candidate low-rank matrix as B·A: pick r directions (the columns of B) and r mixing rows (A).",
      "Multiplying B·A by an input x: A·x compresses x to r numbers; B expands them to the output size.",
      "To check whether a given matrix is low-rank, compute its singular values; count how many are large.",
      "If the top r singular values carry most of the total, a rank-r product reproduces the matrix closely.",
      "For LoRA, do not compute anything: trust the finding that ΔW is low-rank, choose r, and let training fill A and B.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Matrix", "Shape", "Entries", "Rank", "Numbers needed as B·A"],
        rows: [
          ["all ones", "4 × 4", "16", "1", "4 + 4 = 8"],
          ["[[1,2],[2,4],[3,6]]", "3 × 2", "6", "1", "3 + 2 = 5"],
          ["identity", "4,096 × 4,096", "16.8M", "4,096", "no saving: full rank"],
          ["a fine-tuning change ΔW (typical)", "4,096 × 4,096", "16.8M", "≈ 8–64 effective", "8 × 8,192 = 65,536 at r = 8"],
        ],
      },
      caption: "Rank is what you pay for, not size. A full-rank matrix cannot be compressed this way; a low-rank one almost disappears.",
    },
    everyday: {
      title: "A timetable with only two patterns",
      text: "A school timetable for 30 classes and 5 days looks like 150 entries, but if every class follows one of two weekly patterns, you only need the two patterns and which class uses which: 2 × 5 + 30 numbers instead of 150. The timetable has rank 2. A fine-tuning change is like that: lots of entries, few underlying patterns.",
    },
    engineering: {
      title: "Checking the rank before trusting it",
      text: "A team wonders whether LoRA at rank 8 is enough for their task. They fully fine-tune a small 1B model, compute ΔW for a few attention matrices, and run a singular value decomposition. The top 8 singular values carry 87% of the energy; the top 32 carry 97%. They choose rank 16 for the 7B model and confirm its evaluation matches the small full fine-tune within one point. The decomposition turned a guess into a measurement.",
    },
    maths: {
      formula: "ΔW ≈ B·A,  B ∈ ℝ^{d×r}, A ∈ ℝ^{r×d};   (B·A)·x = B·(A·x):  d·r + r·d multiplications instead of d·d",
      meaning: "Applying a low-rank matrix to a vector costs two thin multiplications instead of one square one. The saving in both storage and compute is the ratio 2r ÷ d.",
      worked: [
        "Let A = [[1, 0, 2]] (1 × 3) and B = [[1], [2]] (2 × 1). B·A = [[1, 0, 2], [2, 0, 4]]: a 2 × 3 matrix with rank 1 (the second row is twice the first).",
        "Apply to x = [1, 1, 1]: A·x = 1 + 0 + 2 = 3; B·(A·x) = [3, 6]. Direct: row 1 → 1 + 0 + 2 = 3, row 2 → 2 + 0 + 4 = 6. Same answer, computed through one number.",
        "For d = 4,096 and r = 8: via B·A costs 2 × 8 × 4,096 = 65,536 multiplications; direct costs 16,777,216. The ratio is 2r ÷ d = 16 ÷ 4,096 ≈ 0.4%.",
      ],
    },
    code: {
      title: "Measuring the effective rank of a weight change",
      lang: "py",
      src: `import torch

delta = finetuned_w - base_w                       # the change full fine-tuning made to one matrix, [4096, 4096]
s = torch.linalg.svdvals(delta.float())            # singular values, largest first
energy = (s ** 2).cumsum(0) / (s ** 2).sum()       # share of the change captured by the top k directions

for k in (4, 8, 16, 32, 64, 256):
    print(k, round(energy[k - 1].item(), 3))       # e.g. 8 -> 0.87, 32 -> 0.97`,
      lines: [
        { code: "delta = finetuned_w - base_w                       # the change full fine-tuning made to one matrix, [4096, 4096]", say: "The quantity LoRA approximates: how much full fine-tuning moved this matrix." },
        { code: "s = torch.linalg.svdvals(delta.float())            # singular values, largest first", say: "The decomposition lists the change's directions by importance." },
        { code: "energy = (s ** 2).cumsum(0) / (s ** 2).sum()       # share of the change captured by the top k directions", say: "If a few directions carry nearly all the energy, the change is low-rank and a small r will do." },
      ],
    },
    useIt: "Use the idea when choosing a rank (next lesson) and when LoRA underperforms: if a task needs many independent changes, raise the rank or consider full fine-tuning. Rank also explains why LoRA is cheap at inference once merged and why adapters are tiny.",
    takeaways: ["Rank counts a matrix's independent directions; a low-rank matrix is big but simple.", "A rank-r matrix equals B·A with B and A thin: storage and compute scale with r × (d + d), not d × d.", "Fine-tuning changes are empirically low-rank, which is why LoRA loses little.", "Singular values measure effective rank; a few large ones means a small r suffices."],
    terms: [["rank", "the number of independent directions in a matrix"], ["low-rank", "a matrix whose rank is much smaller than its dimensions"], ["singular value decomposition", "a factorisation that lists a matrix's directions in order of importance"]],
    reflect: { q: "Could a LoRA adapter at rank 8 ever represent the identity change (every direction moved equally)?", a: "No. The identity has full rank 4,096; a rank-8 product can only move eight directions. Such a change is not what fine-tuning produces in practice, but if a task needed it, LoRA at small rank would be the wrong tool." },
  },

  "m22-rank-selection": {
    simple: "Rank sets the adapter's capacity: too low underfits complex tasks, too high wastes memory and can overfit; start at 8 to 16, scale alpha with it, and let evaluation decide.",
    concept:
      "The rank r is LoRA's main dial. It fixes how many independent directions the adapter can change and how many parameters it has: r × (d_in + d_out) per matrix. **Rank selection** is choosing r for the task.\n\nLow ranks (4 to 8) suit style, format and simple classification: the change needed is small and low-rank, and a small adapter resists overfitting on small datasets. Medium ranks (16 to 64) suit tasks with more to learn: multi-step formats, domain vocabulary, several tasks in one adapter. High ranks (128 and above) approach full fine-tuning's capacity and cost; they help for continued-pretraining-like jobs such as adding a language, but at that point the low-rank assumption is weakening.\n\nTwo settings travel with rank. **Alpha** scales the adapter's output by α/r; keeping α = 2r keeps the effective scale constant when r changes. **Target modules**: adapting more matrices adds capacity more cheaply than raising r on fewer, and attention-plus-MLP generally beats attention-only. Doubling the rank rarely doubles quality; doubling the data usually helps more.",
    why:
      "Rank is where teams either waste GPU memory on capacity they do not need or starve a hard task with r = 4 because a tutorial used it. A principled starting point and an evaluation-driven adjustment avoid both. The choice interacts with dataset size: a high rank on a few hundred examples overfits exactly like a big model on a small dataset (Module 4).",
    how: [
      "Start at r = 16, α = 32, all attention and MLP matrices targeted.",
      "Train, evaluate on validation; also check the general suite for forgetting.",
      "If validation is poor and training loss is still high: raise r (32, 64) or add data.",
      "If training loss is low but validation is poor: lower r, add dropout, or add data (overfitting).",
      "If results are equal at r = 8 and r = 16, keep 8: smaller adapter, less overfitting, same quality.",
      "Record r, α and targets with the adapter; they are needed to load it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Task", "Suggested r", "α", "Targets", "Why"],
        rows: [
          ["tone and format", "4–8", "8–16", "attention", "a small, low-rank change"],
          ["classification or extraction", "8–16", "16–32", "attention + MLP", "narrow skill, modest capacity"],
          ["instruction tuning on many tasks", "16–64", "32–128", "attention + MLP", "many behaviours in one adapter"],
          ["domain vocabulary, new language", "64–256", "128–512", "attention + MLP, maybe embeddings", "approaching full fine-tuning"],
        ],
      },
      caption: "Starting points, not rules. Validation and the forgetting suite decide the final value.",
    },
    everyday: {
      title: "How many sliders on the mixing desk",
      text: "Adjusting a band for a room needs a few sliders; recording a different genre needs the whole desk. Rank is the number of sliders you give the engineer. Too few and some rooms cannot be fixed; too many and an inexperienced engineer makes a mess of a good band. Give enough for the job and no more.",
    },
    engineering: {
      title: "Rank 64 lost to rank 8",
      text: "A team with 600 labelled examples trains LoRA at rank 64 'to be safe'. Training loss falls to near zero; validation accuracy is 79%. At rank 8 with dropout 0.1, training loss stays higher and validation reaches 86%. The large adapter had memorised 600 examples. When they later collected 9,000 examples, rank 32 beat rank 8 by three points. Rank must match the data.",
    },
    maths: {
      formula: "adapter parameters = Σ_matrices r × (d_in + d_out);   effective scale = α ÷ r",
      meaning: "Parameters grow linearly with r. Keeping α = 2r holds the adapter's output scale fixed, so changing r changes capacity without changing the learning dynamics.",
      worked: [
        "7B model, attention + MLP targets: per-layer dimensions sum to 4 × 8,192 + 3 × 15,104 = 78,080; 32 layers → 2.5 million per unit of rank.",
        "r = 8: 20 million parameters (0.29% of 7B), adapter ≈ 40 MB in 16-bit.",
        "r = 16: 40 million (0.57%), ≈ 80 MB. r = 64: 160 million (2.3%), ≈ 320 MB.",
        "Trainable state at 16 bytes per parameter: r = 64 needs 2.6 GB for optimiser state and gradients, still small next to the base; the memory cost of rank is modest, the overfitting cost is not.",
      ],
    },
    useIt: "Pick a rank from the table, keep α = 2r, target attention and MLP, and adjust from validation results: raise for underfitting, lower or regularise for overfitting. With small datasets prefer small ranks; with large ones give the adapter room. Always record the configuration with the adapter.",
    takeaways: ["Rank sets adapter capacity and size; parameters grow linearly with r.", "Start at 8–16; style needs less, new domains need more.", "Keep α = 2r; adapt attention and MLP.", "Small data, small rank; validation and the forgetting suite decide."],
    terms: [["target modules", "the weight matrices that receive LoRA side paths"], ["LoRA dropout", "dropout applied to the adapter path to reduce overfitting"]],
    reflect: { q: "Why does adapting more matrices at rank 8 often beat adapting only attention at rank 32?", a: "Capacity spread across more parts of the network lets the adapter influence more of the computation (the MLP layers hold much of a model's knowledge), while each matrix's change stays low-rank. Concentrating rank on attention alone leaves the MLP untouched, however high the rank." },
  },

  "m22-lora-adapters": {
    simple: "A LoRA adapter is the saved file of trained A and B matrices plus its configuration; many adapters can share one base model and be swapped, stacked or served side by side.",
    concept:
      "After LoRA training, the artefact is an **adapter**: the A and B matrices for every adapted layer and a small configuration (rank, alpha, target modules, base model name). It is tens of megabytes, not gigabytes, and it is useless without the exact base model it was trained on; its numbers only make sense added to those weights.\n\nAdapters change how models are managed. One base model in memory can serve many adapters: a request chooses its adapter and the server applies that side path. Adapters can be swapped in milliseconds, versioned like code, shared on model hubs, and even combined, though combining is unpredictable. Multi-adapter serving means a single GPU hosts dozens of customisations where full fine-tunes would need dozens of GPUs.\n\nAn adapter is also a safe experiment: if it is bad, delete the file; the base model is untouched. Rolling back a full fine-tune means keeping the old 14 GB copy around.",
    why:
      "The economics of customisation rest on this artefact. A product with a thousand customers, each wanting their own tone, is impossible with full copies and routine with adapters. Research, too: an adapter is small enough to publish with a paper, so results are reproducible. And operationally, versioning a 40 MB file in ordinary tooling is trivial where a 14 GB model is a special case.",
    how: [
      "Train with LoRA and save with the library's adapter-saving call: the A, B matrices and config go to a folder.",
      "Record the exact base model id and revision in the config; loading onto a different base is silently wrong.",
      "To use: load the base once, load the adapter on top; for multi-adapter serving, load several and route requests by adapter name.",
      "Version adapters with the dataset and evaluation that produced them.",
      "For deployment without the adapter machinery, merge (lesson 9).",
    ],
    visual: {
      kind: "tree",
      root: "one base model in GPU memory (14 GB)",
      children: [
        { label: "adapter: brand-A tone (40 MB)", children: ["requests from brand A"] },
        { label: "adapter: legal clauses (80 MB)", children: ["requests from the contracts tool"] },
        { label: "adapter: Punjabi support (160 MB)", children: ["requests detected as Punjabi"] },
        { label: "no adapter", children: ["everything else: the base behaviour"] },
      ],
      caption: "One base, many behaviours. Each request chooses its side path; the base weights are shared and never change.",
    },
    everyday: {
      title: "Lens filters on one camera",
      text: "A photographer owns one camera body and a bag of screw-on filters: warm, polarising, soft focus. Each filter is small, swaps in seconds, and only works with that lens mount. They would never buy a whole camera per effect. Adapters are the filters; the base model is the camera.",
    },
    engineering: {
      title: "Serving 120 customers from four GPUs",
      text: "A customer-service platform has 120 clients, each with a fine-tuned tone. As full fine-tunes of a 7B model that was 120 × 14 GB of storage and a scheduling nightmare. They retrained each as a rank-8 adapter (about 40 MB each, 4.8 GB in total), load the base once per GPU, keep all adapters resident, and route by client id. Four GPUs now serve what previously needed dozens, adapters are updated per client without touching anyone else, and a bad adapter is rolled back by changing a version pointer. Multi-adapter serving libraries batch requests for different adapters together, so throughput barely drops.",
    },
    maths: {
      formula: "storage(full) = variants × N × 2 bytes;   storage(adapters) = N × 2 + variants × r × Σ(d_in + d_out) × 2",
      meaning: "Full fine-tunes multiply the whole model by the number of variants; adapters pay the base once and a small term per variant.",
      worked: [
        "120 variants of a 7B model, full: 120 × 14 GB = 1,680 GB.",
        "Adapters at rank 8 (20 million parameters each): base 14 GB + 120 × 40 MB = 14 GB + 4.8 GB ≈ 18.8 GB.",
        "Ratio ≈ 89 times less storage, and the serving memory is the base plus whichever adapters are resident, not 120 model copies.",
      ],
    },
    code: {
      title: "Saving, loading and switching adapters",
      lang: "py",
      src: `from peft import PeftModel

# after training
model.save_pretrained("adapters/brand-a")          # writes adapter_model.safetensors + adapter_config.json (~40 MB)

# at serving time: one base, several adapters
base = AutoModelForCausalLM.from_pretrained("open-weights/instruct-7b", torch_dtype="bfloat16")
served = PeftModel.from_pretrained(base, "adapters/brand-a", adapter_name="brand-a")
served.load_adapter("adapters/legal", adapter_name="legal")

served.set_adapter("legal")                        # requests from the contracts tool
out = served.generate(**inputs)
served.set_adapter("brand-a")                      # back to brand A`,
      lines: [
        { code: "model.save_pretrained(\"adapters/brand-a\")          # writes adapter_model.safetensors + adapter_config.json (~40 MB)", say: "Only A, B and the config are written. The base model is not copied." },
        { code: "served = PeftModel.from_pretrained(base, \"adapters/brand-a\", adapter_name=\"brand-a\")", say: "The adapter is attached to a loaded base. The config names the base it expects; mismatches are your responsibility." },
        { code: "served.load_adapter(\"adapters/legal\", adapter_name=\"legal\")", say: "A second adapter over the same base, resident at the same time." },
        { code: "served.set_adapter(\"legal\")                        # requests from the contracts tool", say: "Switching is a pointer change, not a model reload." },
      ],
      note: "Production servers (Module 39) batch requests across adapters so one GPU serves many at once.",
    },
    useIt: "Treat adapters as the unit of customisation: one per task or customer, versioned with their data and evaluation, served over a shared base. Record the base model revision in every adapter, and keep the base frozen so that rollback is deleting a file.",
    takeaways: ["An adapter is A, B and a config; tens of megabytes; tied to one exact base model.", "One base serves many adapters; switching is instant; rollback is trivial.", "Storage falls by roughly the number of variants.", "Version adapters with dataset and evaluation; record the base revision."],
    terms: [["adapter file", "the saved LoRA matrices and configuration"], ["multi-adapter serving", "one base model serving requests for several adapters at once"]],
    reflect: { q: "What happens if an adapter trained on version 1 of a base is loaded onto version 2?", a: "It loads without error if the shapes match, and the behaviour is unpredictable: the A and B matrices were trained to correct version 1's weights, which version 2 no longer has. Always pin the base revision in the adapter's config and re-evaluate (or retrain) when the base changes." },
  },

  "m22-qlora": {
    simple: "QLoRA keeps the frozen base model in 4-bit precision while training LoRA adapters in higher precision, so a 7B or even 70B model fine-tunes on a single GPU with almost no loss in quality.",
    concept:
      "LoRA removed the training-state problem; the frozen base's weights were still 14 GB for a 7B model in 16-bit. **QLoRA** stores those frozen weights in 4-bit (lesson 8 explains quantised fine-tuning in general): about 0.5 bytes per parameter, 3.5 GB for 7B, 35 GB for 70B. The LoRA adapters remain in 16- or 32-bit, and every forward pass dequantises the needed base weights on the fly to compute with them.\n\nThree details make it work well. A 4-bit format designed for the bell-shaped distribution of weights (called NF4) loses less than naive 4-bit. The scaling constants that quantisation needs are themselves quantised (double quantisation) to save a little more. And optimiser states are paged to CPU memory when GPU memory spikes, so the run survives momentary peaks instead of crashing.\n\nThe result in the original paper: a 65B model fine-tuned on one 48 GB GPU, matching 16-bit fine-tuning on benchmarks. For practitioners it means the largest open models are trainable on hardware that costs a few dollars an hour.",
    why:
      "The base weights were the last large item in memory. Halving them again, to 4-bit, is what moves a 7B fine-tune from a 24 GB card with no room for a batch to one with plenty, and a 70B fine-tune from eight GPUs to one. QLoRA exists because the frozen weights do not need training precision: they are read, never updated, so storing them compactly costs little and saves enormously.",
    how: [
      "Load the base model with 4-bit quantisation of its linear layers (NF4, double quantisation).",
      "Attach LoRA adapters in 16- or 32-bit to the chosen matrices.",
      "Forward pass: dequantise each needed base weight block to 16-bit, multiply, add the adapter path.",
      "Backward pass: gradients flow to the adapters only; the 4-bit base never changes.",
      "Use a paged optimiser so memory spikes spill to CPU rather than crash.",
      "Train as usual; save the adapter. For serving, use the 4-bit base plus adapter, or merge into a 16-bit base.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Setup", "7B base weights", "Trainable state", "Activations (batch 4, seq 2k)", "Total", "Fits"],
        rows: [
          ["full fine-tuning, 16-bit", "14 GB (+gradients, Adam)", "≈ 98 GB", "≈ 20 GB", "≈ 130 GB", "2+ × 80 GB"],
          ["LoRA, 16-bit base", "14 GB", "0.3 GB", "≈ 8 GB", "≈ 23 GB", "1 × 24 GB, barely"],
          ["QLoRA, 4-bit base", "3.5 GB", "0.3 GB", "≈ 8 GB", "≈ 12 GB", "1 × 24 GB, with room"],
          ["QLoRA on 70B", "35 GB", "1.5 GB", "≈ 12 GB", "≈ 50 GB", "1 × 80 GB"],
        ],
      },
      caption: "QLoRA's saving is on the frozen base. It turns 'needs a cluster' into 'needs one card'.",
    },
    everyday: {
      title: "A compressed reference book",
      text: "You keep the dictionary as a compressed file because you only ever read it; you decompress the page you need when you need it. Your own notes, which you edit constantly, stay as a normal document. QLoRA compresses the frozen base (read-only) and keeps the adapter (edited every step) at full precision.",
    },
    engineering: {
      title: "Fine-tuning a 70B model on a rented GPU",
      text: "A research team wants a 70B instruct model adapted to summarise clinical trial reports. Full fine-tuning needs about 1.1 TB of training state: a 16-GPU job they cannot get. With QLoRA on one 80 GB GPU: 4-bit base 35 GB, rank-16 adapters, batch 2 with gradient accumulation, 6,000 examples, 14 hours, about $40 of rented time. Evaluation shows the QLoRA model within half a point of a 16-bit LoRA run they later did on borrowed hardware. The quality cost of 4-bit storage was negligible; the access it gave was everything.",
    },
    maths: {
      formula: "base memory = N × bits ÷ 8 bytes;   4-bit vs 16-bit saving = N × (2 − 0.5) bytes",
      meaning: "Bits per weight set the base's footprint. Going from 16 to 4 bits saves 1.5 bytes per parameter, plus a small overhead for scaling constants.",
      worked: [
        "7B in 16-bit: 7 × 10⁹ × 2 = 14 GB. In 4-bit: 7 × 10⁹ × 0.5 = 3.5 GB, plus about 0.4 GB of quantisation constants ≈ 3.9 GB.",
        "70B in 4-bit: 70 × 10⁹ × 0.5 = 35 GB plus ≈ 4 GB of constants ≈ 39 GB.",
        "With rank-16 adapters on 70B (≈ 330 million parameters): trainable state = 330 × 10⁶ × 16 bytes ≈ 5.3 GB.",
        "Total ≈ 44 GB before activations: fits one 80 GB GPU with room for a small batch; without QLoRA, the base alone would be 140 GB.",
      ],
    },
    code: {
      title: "Loading a 4-bit base for QLoRA",
      lang: "py",
      src: `import torch
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",                 # 4-bit format shaped for weight distributions
    bnb_4bit_use_double_quant=True,            # quantise the scaling constants too
    bnb_4bit_compute_dtype=torch.bfloat16,     # dequantise to bf16 for the arithmetic
)
model = AutoModelForCausalLM.from_pretrained("open-weights/instruct-70b", quantization_config=bnb, device_map="auto")
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"))
model.print_trainable_parameters()             # ~330M trainable of ~70B`,
      lines: [
        { code: "load_in_4bit=True,", say: "The frozen base is stored at four bits per weight: a quarter of 16-bit." },
        { code: "bnb_4bit_quant_type=\"nf4\",                 # 4-bit format shaped for weight distributions", say: "NF4 places its sixteen levels where weights actually cluster, losing less than evenly spaced levels." },
        { code: "bnb_4bit_compute_dtype=torch.bfloat16,     # dequantise to bf16 for the arithmetic", say: "Weights are expanded to 16-bit only for the multiplication, block by block, then discarded." },
        { code: "model = prepare_model_for_kbit_training(model)", say: "Housekeeping for training on a quantised base: gradient checkpointing, correct dtypes for norms." },
        { code: "target_modules=\"all-linear\"", say: "Adapters on every linear layer, the usual QLoRA choice." },
      ],
      note: "A paged AdamW optimiser (optim='paged_adamw_8bit' in TrainingArguments) completes the standard recipe.",
    },
    useIt: "QLoRA is the default way to fine-tune any model larger than your GPU's memory would otherwise allow: 7B on consumer cards, 70B on a single data-centre card. Use NF4 with double quantisation, bf16 compute, a paged optimiser, and evaluate against a 16-bit LoRA run if you can, to confirm the quantisation cost is negligible for your task.",
    takeaways: ["QLoRA stores the frozen base in 4-bit and trains LoRA adapters in higher precision.", "7B fits one 24 GB card with room; 70B fits one 80 GB card.", "NF4, double quantisation and paged optimisers are the recipe.", "Quality typically matches 16-bit LoRA within a fraction of a point."],
    terms: [["QLoRA", "LoRA fine-tuning on a 4-bit quantised frozen base"], ["NF4", "a 4-bit number format designed for the distribution of neural-network weights"], ["paged optimiser", "an optimiser whose state can spill to CPU memory during spikes"]],
    reflect: { q: "The base is in 4-bit during training. Should it be served in 4-bit too?", a: "It can be, and the adapter was trained against exactly those quantised weights, so matching is safest. Serving the adapter over a 16-bit base is usually fine and slightly more accurate, but re-evaluate: the adapter learned to correct the 4-bit base's small errors, and those errors differ from the 16-bit base's." },
  },

  "m22-quantised-fine-tuning": {
    simple: "Quantised fine-tuning is any training where parts of the model are held at low precision; the rule is quantise what is only read, keep full precision for what is updated, and dequantise for the arithmetic.",
    concept:
      "Quantisation (Module 40 treats inference) stores a number with fewer bits by mapping it to one of a small set of levels and remembering a scale factor. **Quantised fine-tuning** brings that into training. The subtlety is that gradient descent needs precision: a weight updated by 0.0001 each step cannot be stored in 4-bit, where the gap between levels is far larger. So the recipe is to split the model by role. Frozen weights, which are read and never updated, can be quantised. Trainable parameters, gradients and optimiser states stay in 16- or 32-bit. Arithmetic happens in 16-bit after dequantising the blocks involved.\n\nQLoRA is the best-known instance, but the same logic applies to 8-bit bases, to 8-bit optimiser states (which quantise Adam's moments with block-wise scaling and work well because the moments are only accumulated, not differentiated), and to mixed schemes. What cannot be done is updating a 4-bit weight directly: the update rounds away to nothing.\n\nThe practical costs are a little extra compute for dequantisation (training runs 20 to 40% slower per step) and a small quality cost that is usually under a point.",
    why:
      "Memory is the binding constraint on who can fine-tune what. Quantising the read-only parts of a model is nearly free in quality and halves or quarters the dominant memory item. It exists because people noticed the asymmetry: most of the bytes in training belong to things that never change during a fine-tune, and those bytes do not need training precision.",
    how: [
      "Classify every tensor: frozen weight, trainable weight, gradient, optimiser state, activation.",
      "Quantise frozen weights to 8- or 4-bit with block-wise scaling; keep the scales.",
      "Keep trainable weights and gradients in 16-bit with 32-bit master copies.",
      "Optionally store optimiser states in 8-bit with block-wise scaling.",
      "In each forward and backward pass, dequantise the frozen blocks needed to 16-bit, compute, discard.",
      "Evaluate against a full-precision run on your task to confirm the quality cost is acceptable.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Tensor", "Role", "Precision", "Why"],
        rows: [
          ["frozen base weights", "read only", "4-bit (NF4) or 8-bit", "never updated; rounding is harmless"],
          ["LoRA A and B", "updated every step", "16-bit + 32-bit master", "small updates must not round away"],
          ["gradients of A and B", "computed every step", "16-bit", "standard mixed precision"],
          ["Adam moments", "accumulated", "8-bit block-wise or 32-bit", "accumulation tolerates coarse storage"],
          ["activations", "transient", "16-bit", "recomputed with checkpointing"],
        ],
      },
      caption: "Precision follows role. Only the things that change need the bits.",
    },
    everyday: {
      title: "Rounding the prices but not the running total",
      text: "A shopkeeper can round the catalogue prices on the shelf labels to the nearest pound without harm; the labels are only read. The till's running total must keep the pence, or small purchases would never add up. Frozen weights are the shelf labels; trainable parameters are the till.",
    },
    engineering: {
      title: "Why the 4-bit update went nowhere",
      text: "An engineer tries to save memory by making the LoRA matrices themselves 4-bit. Training loss does not move. The learning rate of 2e-4 produces updates far smaller than the gap between 4-bit levels, so every update rounds back to the same level. Switching the adapters to 16-bit with 32-bit master weights, while keeping the base in 4-bit, restored normal training. The lesson: quantise what is read; never what is written in small steps.",
    },
    maths: {
      formula: "4-bit level spacing = (max − min) ÷ 15 within a block;   an update smaller than half the spacing rounds to zero",
      meaning: "Four bits give sixteen levels per block of weights. If a gradient step is smaller than half the gap between levels, the stored weight cannot change.",
      worked: [
        "A block of weights ranges from −0.30 to 0.30: spacing = 0.60 ÷ 15 = 0.04.",
        "A typical LoRA update: learning rate 2e-4 × gradient 0.5 = 0.0001, which is 400 times smaller than half the spacing (0.02). It rounds to zero.",
        "In 16-bit (bf16), the spacing near 0.3 is about 0.002: still too coarse for 0.0001, which is why a 32-bit master copy (spacing ≈ 3 × 10⁻⁸ near 0.3) accumulates the updates.",
        "The frozen base is never updated, so its 0.04 spacing costs only a small, fixed rounding error on reads.",
      ],
    },
    useIt: "When memory is short, quantise in this order: frozen base to 8-bit, then 4-bit (NF4); optimiser states to 8-bit; never the trainable parameters. Expect a slower step and check the quality cost on your evaluation. If you still do not fit, reduce batch size with gradient accumulation and enable activation checkpointing.",
    takeaways: ["Quantise what is only read (frozen weights, accumulated optimiser moments); keep what is updated in 16-bit with 32-bit masters.", "Small updates to a 4-bit weight round to nothing.", "Dequantise block by block for the arithmetic; steps run 20–40% slower.", "Quality cost is usually under a point; measure it."],
    terms: [["quantisation", "storing numbers with fewer bits using a small set of levels and a scale"], ["dequantise", "expanding quantised values back to a wider precision for computation"], ["8-bit optimiser", "Adam whose moment estimates are stored in 8-bit with block-wise scaling"]],
    reflect: { q: "Why can Adam's moments be stored in 8-bit when the weights cannot be stored in 4-bit?", a: "The moments are running averages that are rewritten each step from a fresh gradient, so a rounding error does not accumulate the way a lost weight update would; and 8-bit with per-block scaling has 256 levels, far finer than 4-bit's 16. Weights accumulate thousands of tiny updates, which is the case rounding destroys." },
  },

  "m22-adapter-merging": {
    simple: "Merging folds a trained LoRA adapter into the base weights (W + α/r · B·A), producing an ordinary model with zero inference overhead, at the cost of losing the ability to swap it.",
    concept:
      "At inference, a LoRA model computes W·x plus the side path B·A·x: two matrix products where the base needs one. **Adapter merging** removes the side path by computing the new weight once: W' = W + (α/r)·B·A. The merged model is a plain model with the same shape as the base; it runs at exactly the base's speed with no adapter library required.\n\nMerging is a trade. You gain simplicity and speed and a single artefact for deployment. You lose the small file: the merged model is a full copy (14 GB for 7B), you cannot swap adapters, and you cannot subtract the adapter later. You also fix the precision: merging into a 16-bit base is exact up to rounding; merging into a quantised base requires re-quantising and should be re-evaluated.\n\nMerging several adapters into one base is possible by summing their B·A terms, but adapters trained separately interfere unpredictably; a merged combination must be evaluated as a new model, not assumed to inherit each adapter's skills.",
    why:
      "Serving frameworks, edge devices and some inference engines do not support adapters, or support them with overhead. A product that ships one model to one task is simpler as a merged artefact. Merging exists so that the cheap training path (LoRA) can end in the simplest deployment path (a plain model), when swapping is not needed.",
    how: [
      "Load the base model at the precision you will serve (usually 16-bit) and the adapter.",
      "For each adapted matrix compute W' = W + (α/r)·B·A and replace W.",
      "Drop the adapter modules; save the model as a standard checkpoint.",
      "Evaluate the merged model on the test set; it should match the adapter-on-base results within rounding.",
      "If serving quantised, quantise the merged model and evaluate again.",
      "Keep the adapter file and the base revision in version control; the merged model is derived, not source.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Base + adapter at inference", points: ["W·x + B·A·x: two products per adapted layer", "adapter swappable per request", "40 MB file + shared base", "needs adapter-aware serving", "small latency overhead unless batched well"] },
      right: { title: "Merged model", points: ["W'·x: one product, same as the base", "fixed behaviour", "14 GB full model", "runs anywhere the base runs", "zero overhead"] },
      caption: "Merge when one model serves one job; keep adapters when many behaviours share one base.",
    },
    everyday: {
      title: "Printing the corrections into the next edition",
      text: "The transparent correction sheet over the map is handy while you are still making changes. Once the corrections are final, you print a new edition with them drawn in: cleaner, no sheet to lose, but you cannot peel the corrections off any more, and you keep the original plates in case.",
    },
    engineering: {
      title: "Merging for the on-device app",
      text: "A company fine-tuned a 3B model with LoRA to run offline inside a field-service app. The mobile inference engine does not support adapters. They merge the adapter into the 16-bit base, quantise the merged model to 4-bit for the phone, and evaluate: the merged 16-bit model matches the adapter run exactly; the 4-bit merged model loses 0.8 points, acceptable. The app ships one 1.8 GB file. The adapter and base revision stay in the repository so the next version can be retrained and re-merged.",
    },
    maths: {
      formula: "W' = W + (α ÷ r) × B × A;   inference cost(merged) = d_in × d_out;   inference cost(unmerged) = d_in × d_out + r × (d_in + d_out)",
      meaning: "Merging adds the scaled product into the weight once. Afterwards each layer costs exactly what the base cost; unmerged, the side path adds a small term proportional to r.",
      worked: [
        "A 2 × 2 toy: W = [[1.0, 0.0], [0.0, 1.0]], B = [[0.5], [0.0]], A = [[0.0, 2.0]], α = 2, r = 1 → α/r = 2.",
        "B·A = [[0.0, 1.0], [0.0, 0.0]]; scaled: [[0.0, 2.0], [0.0, 0.0]].",
        "W' = [[1.0, 2.0], [0.0, 1.0]]. For x = [1, 1]: W'·x = [3, 1]. Unmerged: W·x = [1, 1], B·A·x scaled = [2, 0], sum [3, 1]. Identical.",
        "At d = 4,096, r = 16: unmerged overhead = 16 × 8,192 = 131,072 against 16.8 million for the main product, about 0.8% extra compute per adapted matrix; merging removes it entirely.",
      ],
    },
    code: {
      title: "Merge and save a plain model",
      lang: "py",
      src: `from peft import PeftModel
from transformers import AutoModelForCausalLM

base = AutoModelForCausalLM.from_pretrained("open-weights/instruct-7b", torch_dtype="bfloat16")
model = PeftModel.from_pretrained(base, "adapters/brand-a")

merged = model.merge_and_unload()                  # W' = W + (alpha / r) * B @ A, adapter modules removed
merged.save_pretrained("models/brand-a-merged")    # a standard 14 GB checkpoint; no PEFT needed to load it`,
      lines: [
        { code: "base = AutoModelForCausalLM.from_pretrained(\"open-weights/instruct-7b\", torch_dtype=\"bfloat16\")", say: "Merge into a 16-bit base, not a 4-bit one; quantise afterwards if needed." },
        { code: "merged = model.merge_and_unload()                  # W' = W + (alpha / r) * B @ A, adapter modules removed", say: "One call does the addition for every adapted matrix and strips the side paths." },
        { code: "merged.save_pretrained(\"models/brand-a-merged\")    # a standard 14 GB checkpoint; no PEFT needed to load it", say: "The output is an ordinary model: any serving stack that runs the base runs this." },
      ],
    },
    useIt: "Merge when deploying one behaviour to a stack without adapter support, to edge devices, or where every millisecond of latency counts. Keep adapters unmerged for multi-tenant serving and for anything still being iterated. Always evaluate the merged artefact, and never discard the adapter and base revision that produced it.",
    takeaways: ["Merging computes W + (α/r)·B·A once and yields a plain model at base speed.", "Trade: zero overhead and portability for a full-size file and no swapping.", "Merge into 16-bit; re-evaluate after any quantisation.", "Merging several adapters is a new model that must be evaluated as such."],
    terms: [["merging", "adding a trained adapter into the base weights permanently"], ["merge_and_unload", "the library call that merges adapters and removes the adapter modules"]],
    reflect: { q: "Two adapters, one for tone and one for a format, each work well alone. Will their merged sum work?", a: "Maybe. Each was trained assuming the base's weights, not the base plus the other adapter, so their effects can interfere. Sometimes the sum is fine, sometimes one behaviour dominates or both degrade. Treat the combination as a new model and run the evaluation; if it fails, train one adapter on the combined data instead." },
  },

  "m22-fine-tuning-with-limited-gpu-memory": {
    simple: "On a small GPU, fit a fine-tune by stacking the memory tricks: a quantised frozen base, LoRA, a short sequence length, a tiny micro-batch with gradient accumulation, activation checkpointing and an 8-bit paged optimiser.",
    concept:
      "This module's techniques combine into a checklist for the common situation: one GPU with 16 to 24 GB and a model that would not fit under full fine-tuning. Each item attacks one memory consumer. The frozen base: quantise to 4-bit (QLoRA). The training state: LoRA keeps it to a few hundred megabytes. Activations, now the largest remaining item: shorten the sequence length to what your examples need, use a micro-batch of one or two with gradient accumulation to reach the batch you want, and enable activation checkpointing so intermediate values are recomputed rather than stored. The optimiser: 8-bit paged AdamW. Finally, a fallback: if memory still spikes, spill to CPU memory with the paged optimiser rather than crash.\n\nThe trade-offs are speed, not quality: checkpointing recomputes the forward pass once more during backward, 4-bit bases dequantise on the fly, and tiny micro-batches use the GPU less efficiently. A run that would take an hour on a large GPU takes a few hours on a small one, but it runs.\n\nWhen the checklist is exhausted and the model still does not fit, the remaining options are a smaller model, a cloud GPU for the duration of the run, or sharding across several small GPUs.",
    why:
      "Most developers have one modest GPU or rent one by the hour. The difference between 'cannot fine-tune a 7B model' and 'fine-tunes overnight' is knowing which six settings to change. The checklist exists because every item is a separate discovery, and teams that know only two of them conclude the job is impossible.",
    how: [
      "Estimate memory: base at your chosen precision + 16 × trainable parameters + activations for micro-batch × sequence length.",
      "Load the base in 4-bit NF4 with bf16 compute (QLoRA).",
      "Add LoRA at rank 8–16 on attention and MLP.",
      "Set the sequence length to the longest example you actually have, padded no further.",
      "Micro-batch 1–2 with gradient accumulation to an effective batch of 16–32; enable gradient checkpointing.",
      "Use paged 8-bit AdamW; run a few steps and watch peak memory; adjust sequence length or micro-batch if needed.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Memory consumer", "Default (7B, full FT, batch 8, seq 2,048)", "After the checklist", "Technique"],
        rows: [
          ["base weights", "14 GB", "3.9 GB", "4-bit NF4"],
          ["gradients + master + Adam", "98 GB", "0.3 GB", "LoRA (20M trainable)"],
          ["activations", "≈ 73 GB", "≈ 2.5 GB", "micro-batch 1, seq 1,024, checkpointing"],
          ["optimiser overhead", "included above", "paged, spills if needed", "8-bit paged AdamW"],
          ["total", "≈ 185 GB", "≈ 7 GB", "fits a 16 GB card"],
        ],
      },
      caption: "Six settings turn a cluster job into a laptop-class job. Each line is one lesson of this module.",
    },
    everyday: {
      title: "Packing for a small car",
      text: "Moving with a hatchback instead of a van: you vacuum-pack the bedding (quantise the base), take only the clothes you will wear (LoRA), make several trips (gradient accumulation), fold the seats (checkpointing), and if a box will not fit you leave it at a friend's for now (paging to CPU). Slower than one van trip, but everything arrives.",
    },
    engineering: {
      title: "The overnight run on a 16 GB card",
      text: "A developer with a 16 GB consumer GPU fine-tunes a 7B model on 2,500 support examples averaging 700 tokens. Settings: NF4 base (3.9 GB), LoRA rank 8 (20M parameters), sequence length 1,024, micro-batch 1, accumulation 16, gradient checkpointing, paged 8-bit AdamW. Peak memory 9.4 GB. Three epochs take 5 hours and 20 minutes. The same run on a rented 80 GB GPU with micro-batch 16 and no checkpointing took 45 minutes; the result was identical to within evaluation noise. The small card cost nothing extra and the run finished before breakfast.",
    },
    maths: {
      formula: "activation memory ≈ micro-batch × seq × layers × hidden × c;   with checkpointing c falls by roughly 4×;   effective batch = micro-batch × accumulation steps",
      meaning: "Activations scale with the product of micro-batch and sequence length, so halving either halves them. Checkpointing trades a quarter of the memory for one extra forward pass per step.",
      worked: [
        "Micro-batch 1, seq 1,024, 32 layers, hidden 4,096, c ≈ 34 bytes: 1 × 1,024 × 32 × 4,096 × 34 ≈ 4.6 GB without checkpointing.",
        "With checkpointing (c ≈ 8): ≈ 1.1 GB. Add per-layer transient buffers and a 4-bit dequantisation workspace: ≈ 2.5 GB in practice.",
        "Effective batch = 1 × 16 = 16 sequences ≈ 16,000 tokens per optimiser step, a reasonable fine-tuning batch.",
        "Total ≈ 3.9 (base) + 0.3 (LoRA state) + 2.5 (activations) + overhead ≈ 7 to 9 GB peak.",
      ],
    },
    code: {
      title: "Training arguments for a small GPU",
      lang: "py",
      src: `from transformers import TrainingArguments

args = TrainingArguments(
    output_dir="ckpt-small-gpu",
    per_device_train_batch_size=1,          # micro-batch
    gradient_accumulation_steps=16,         # effective batch 16
    gradient_checkpointing=True,            # recompute activations in backward
    max_steps=-1, num_train_epochs=3,
    learning_rate=2e-4,
    bf16=True,
    optim="paged_adamw_8bit",               # 8-bit Adam states, paged to CPU on spikes
    logging_steps=20, eval_strategy="epoch", save_strategy="epoch",
)
# plus: tokenizer max_length=1024 when building the dataset, and the 4-bit base + LoRA from the QLoRA lesson`,
      lines: [
        { code: "per_device_train_batch_size=1,          # micro-batch", say: "One sequence at a time in memory; activations are as small as they can be." },
        { code: "gradient_accumulation_steps=16,         # effective batch 16", say: "Sixteen micro-steps per update: the same batch a big GPU would use in one pass." },
        { code: "gradient_checkpointing=True,            # recompute activations in backward", say: "Roughly a quarter of the activation memory for about 30% more compute per step." },
        { code: "optim=\"paged_adamw_8bit\",               # 8-bit Adam states, paged to CPU on spikes", say: "Optimiser state in 8-bit, and a spike spills to CPU memory instead of crashing the run." },
      ],
      note: "Watch peak memory on the first hundred steps; if it is under 70% of the card, raise the micro-batch or the sequence length for speed.",
    },
    useIt: "Use the checklist whenever a fine-tune does not fit: quantised base, LoRA, trimmed sequence length, micro-batch with accumulation, checkpointing, paged 8-bit optimiser. It is slower per step, not worse. If it still does not fit, pick a smaller model or rent a larger card for the hours the run needs.",
    takeaways: ["Stack the tricks: 4-bit base, LoRA, short sequences, micro-batch + accumulation, checkpointing, paged 8-bit Adam.", "Each trades speed for memory; quality is unchanged.", "A 7B fine-tune fits a 16 GB card at about 7–9 GB peak.", "Measure peak memory early and tune micro-batch and sequence length to use the card."],
    terms: [["gradient checkpointing", "recomputing activations during the backward pass instead of storing them"], ["effective batch", "micro-batch size times accumulation steps: the real batch per update"]],
    reflect: { q: "You have an 8 GB GPU. Which model size is realistic to fine-tune with the full checklist?", a: "About 3B parameters: a 4-bit base of ≈ 1.7 GB, LoRA state well under 1 GB, and activations at micro-batch 1 and sequence 1,024 of around 1 to 2 GB leaves headroom. A 7B model's 3.9 GB base plus activations is marginal on 8 GB; it may run at sequence 512 but with little room, so a 3B or 4B model is the practical choice." },
  },
};

export const M22_QUIZ: Quiz[] = [
  {
    q: "Roughly how much memory does full fine-tuning of a 7B model need for its training state alone?",
    options: ["14 GB", "About 112 GB (16 bytes per parameter)", "3.5 GB", "1.1 TB"],
    answer: 1,
    why: ["That is the 16-bit weights only, enough for serving.", "Correct. Weight, gradient, master copy and two Adam moments: 16 bytes per parameter.", "That is a 4-bit base for serving or QLoRA.", "That is a 70B model's training state."],
  },
  {
    q: "What does LoRA train?",
    options: ["All weights, at a lower learning rate", "Two thin matrices A and B per adapted weight, whose product is added to the frozen weight", "Only the bias terms", "The tokeniser"],
    answer: 1,
    why: ["That is full fine-tuning.", "Correct. W stays frozen; W·x + (α/r)·B·A·x is computed and only A and B learn.", "That is BitFit, a different PEFT method.", "The tokeniser is fixed."],
  },
  {
    q: "Why can LoRA use so few parameters without losing much?",
    options: ["Because small models are better", "Because the weight change made by fine-tuning is empirically low-rank, so a rank-r product captures most of it", "Because the base model is also small", "Because the learning rate is higher"],
    answer: 1,
    why: ["Model size is unchanged.", "Correct. A few independent directions carry most of the change; B·A represents exactly those.", "The base is unchanged in size.", "The learning rate compensates for the small set but does not explain the low loss in quality."],
    reason: true,
  },
  {
    q: "For a 4,096 × 4,096 matrix at rank 8, how many LoRA parameters are trained?",
    options: ["16,777,216", "65,536", "4,096", "8"],
    answer: 1,
    why: ["That is the full matrix.", "Correct. r × (d_in + d_out) = 8 × 8,192 = 65,536, about 0.4%.", "That is one row.", "That is just the rank."],
  },
  {
    q: "A team with 600 examples trains at rank 64; training loss is near zero and validation is poor. What is wrong?",
    options: ["Rank is too low", "The adapter is overfitting the small dataset; lower the rank, add dropout, or add data", "The base model is broken", "Alpha is too low"],
    answer: 1,
    why: ["Low training loss means capacity is ample.", "Correct. A high-rank adapter on little data memorises; match rank to data.", "The base is frozen and fine.", "Alpha scales output; it does not cause this pattern."],
    reason: true,
  },
  {
    q: "What does QLoRA quantise?",
    options: ["The LoRA matrices A and B", "The frozen base weights, to 4-bit, while adapters stay in higher precision", "The gradients", "The training data"],
    answer: 1,
    why: ["Those must stay in 16-bit with 32-bit masters or updates round away.", "Correct. Read-only weights tolerate 4-bit; updated parameters do not.", "Gradients stay in 16-bit.", "Data is tokens, not quantised."],
  },
  {
    q: "What does merging an adapter give up?",
    options: ["Inference speed", "The ability to swap adapters and the small file size; the result is a full-size plain model", "Accuracy, always", "The base model"],
    answer: 1,
    why: ["Merging improves speed to base level.", "Correct. Merged models run anywhere at base speed but are full copies with fixed behaviour.", "Merging into 16-bit is exact up to rounding.", "The base is unaffected; keep it."],
  },
  {
    q: "Which setting does NOT reduce memory on a small GPU?",
    options: ["Gradient checkpointing", "A 4-bit base", "Raising the learning rate", "A micro-batch of 1 with gradient accumulation"],
    answer: 2,
    why: ["Recomputes activations: large saving.", "Quarter the base's footprint.", "Correct. Learning rate changes step size, not memory.", "Activations scale with micro-batch size."],
  },
];

export const M22_EXERCISES: Exercise[] = [
  {
    title: "Count the adapter",
    kind: "calculate",
    task: "A 13B model has 40 layers; each layer has four 5,120 × 5,120 attention matrices and three MLP matrices of 5,120 × 13,824. Compute the trainable parameters for LoRA at rank 16 on all seven matrices per layer, the share of the 13B total, and the adapter file size in 16-bit. Then compute the training-state memory for those parameters at 16 bytes each.",
    hints: ["Per matrix: r × (d_in + d_out).", "Sum per layer, multiply by layers.", "File size: parameters × 2 bytes."],
    solution: "Attention: 4 × 16 × (5,120 + 5,120) = 4 × 163,840 = 655,360. MLP: 3 × 16 × (5,120 + 13,824) = 3 × 303,104 = 909,312. Per layer: 1,564,672. × 40 layers = 62,586,880 ≈ 62.6 million trainable parameters, about 0.48% of 13B. File size ≈ 62.6 × 10⁶ × 2 bytes ≈ 125 MB. Training state ≈ 62.6 × 10⁶ × 16 ≈ 1.0 GB. The frozen base in 4-bit is about 6.5 GB, so the whole run fits a 16 GB card with room for activations.",
  },
  {
    title: "Plan a run for a 24 GB card",
    kind: "calculate",
    task: "You must fine-tune a 7B model on examples averaging 1,500 tokens (longest 2,000) with an effective batch of 32 on a 24 GB GPU. Choose the base precision, rank, sequence length, micro-batch, accumulation steps, checkpointing and optimiser, and estimate peak memory using the activation formula with c = 34 (no checkpointing) or c = 8 (with). State whether it fits and what you would change if not.",
    hints: ["Activations ≈ micro-batch × seq × 32 × 4,096 × c bytes.", "Base 4-bit ≈ 3.9 GB; LoRA state ≈ 0.3 GB; add ≈ 1.5 GB overhead."],
    solution: "Base: 4-bit NF4 (3.9 GB). LoRA rank 16 on attention + MLP (≈ 0.3 GB state). Sequence length 2,048 to cover the longest example. Micro-batch 2 with checkpointing: activations ≈ 2 × 2,048 × 32 × 4,096 × 8 ≈ 4.3 GB (plus workspace ≈ 6 GB). Accumulation 16 → effective batch 32. Paged 8-bit AdamW. Peak ≈ 3.9 + 0.3 + 6 + 1.5 ≈ 12 GB: fits with headroom. Without checkpointing (c = 34) activations would be ≈ 18 GB and the total ≈ 24 GB: on the edge, so keep checkpointing. If examples grew to 4,000 tokens, drop micro-batch to 1 and accumulate 32.",
  },
  {
    title: "Merge, then verify",
    kind: "code",
    task: "Write Python that loads a base and an adapter, runs 50 test prompts through the unmerged model, merges, runs the same prompts again with greedy decoding, and reports how many outputs are identical. Explain why a few may differ and when that would worry you.",
    hints: ["Greedy decoding (do_sample=False) makes outputs deterministic.", "Compare decoded strings.", "Rounding in bf16 can flip a near-tie token."],
    solution: "from peft import PeftModel\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\ntok = AutoTokenizer.from_pretrained(BASE)\nbase = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype='bfloat16', device_map='auto')\nmodel = PeftModel.from_pretrained(base, ADAPTER)\n\ndef run(m):\n    outs = []\n    for p in prompts:\n        ids = tok(p, return_tensors='pt').to(m.device)\n        g = m.generate(**ids, max_new_tokens=64, do_sample=False)\n        outs.append(tok.decode(g[0][ids['input_ids'].shape[1]:], skip_special_tokens=True))\n    return outs\n\nbefore = run(model)\nmerged = model.merge_and_unload()\nafter = run(merged)\nsame = sum(a == b for a, b in zip(before, after))\nprint(same, 'of', len(prompts), 'identical')\n\nA handful may differ because merging rounds W + (α/r)·B·A into bf16, and where two tokens had nearly equal probability the rounding can flip the greedy choice; the texts usually diverge only after that point and are equivalent in quality. It would worry you if many outputs differ or if evaluation metrics drop, which suggests a precision mismatch (merging into a quantised base) or the wrong base revision.",
  },
  {
    title: "Choose between adapters and merging",
    kind: "think",
    task: "Three deployments: (a) a SaaS with 300 tenant-specific tones over one base; (b) a single offline model inside a mobile app; (c) a research prototype iterated daily. For each, decide adapters or merged, and the precision of the served base, with one sentence of justification.",
    hints: ["Many behaviours on one base → adapters. One behaviour, no adapter support → merge.", "Iteration favours adapters; edge devices favour merged and quantised."],
    solution: "(a) Adapters, unmerged, over a 16-bit (or 8-bit) shared base with multi-adapter serving: 300 × 40 MB beats 300 × 14 GB, and tenants update independently. (b) Merged into 16-bit, then quantised to 4-bit for the device, evaluated after each step: the mobile engine lacks adapter support and one file is simplest. (c) Adapters over a 4-bit QLoRA base on one GPU: fastest to retrain and swap daily, rollback is deleting a file, and merging would only be done for a release.",
  },
];
