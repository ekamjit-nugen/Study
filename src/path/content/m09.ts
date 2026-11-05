import type { Exercise, LessonBody, Quiz } from "../types";

// Module 9: Deep learning concepts. One concept per lesson.
// Keys are lesson slugs: m09-<kebab of the concept title in map.ts>.

export const M09_BODIES: Record<string, LessonBody> = {
  "m09-deep-networks": {
    simple: "A deep network has many layers, which makes it powerful and also fragile: signals and gradients must survive a long chain, and this module is the set of techniques that keep them alive.",
    concept:
      "A **deep network** is simply a network with many layers: tens, sometimes hundreds. Module 8 explained why depth pays: features composed from features, reused across the whole network. This module is about the price, and how it is paid.\n\nThe price comes from the chain. A signal passing forward through fifty layers is multiplied by fifty weight matrices and bent by fifty activations; a gradient passing backward is multiplied by fifty derivatives. If each step shrinks the value a little, fifty steps shrink it to nothing; if each grows it a little, fifty steps explode it. Early deep networks did exactly this: past five or six layers they stopped training, and for years 'deep' meant 'does not work'.\n\nThe fixes arrived between 2010 and 2016 and are now standard equipment: initialising weights at the right scale, activations that do not saturate, normalising the values flowing between layers, shortcuts that let signals skip layers, and regularisation that stops large networks memorising. Each lesson in this module is one of those tools. With all of them, networks of a hundred layers train routinely; without them, ten is hard.",
    why:
      "Every modern model you will use, from image classifiers to language models, is deep, and every one of them depends on these techniques. You rarely invent them, but you constantly configure them: an initialisation scheme, a normalisation layer, a dropout rate, a residual block. When a deep model fails to train, the diagnosis is almost always one of this module's topics, and the fix is one of its tools.",
    how: [
      "Stack layers deep enough for the task's hierarchy: a handful for tabular data, dozens for images and text.",
      "Initialise every weight at a scale chosen so the forward signal keeps its size through the stack (Xavier or He).",
      "Use non-saturating activations (ReLU family) so backward gradients keep their size.",
      "Normalise activations between layers (batch or layer normalisation) so each layer sees inputs in a stable range.",
      "Add residual connections so every layer has a shortcut around it for signals and gradients.",
      "Regularise (dropout, weight decay, early stopping) so the extra capacity generalises rather than memorises.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Problem of depth", "Symptom in training", "Tool", "Lesson"],
        rows: [
          ["gradients shrink through layers", "early layers never change; loss flat", "ReLU, He init, residuals", "9.2, 9.6, 9.10"],
          ["gradients grow through layers", "loss jumps to NaN", "gradient clipping, good init, normalisation", "9.3, 9.4"],
          ["activations drift in scale", "slow, erratic training", "batch / layer normalisation", "9.8, 9.9"],
          ["too much capacity", "train loss ≪ validation loss", "dropout, weight decay, early stopping", "9.7, 9.11"],
          ["signal lost across many layers", "deeper model worse than shallower", "residual connections", "9.10"],
        ],
      },
      caption: "Depth's failure modes and the standard fixes. Modern architectures include all of them by default.",
    },
    everyday: {
      title: "Chinese whispers with fifty people",
      text: "A message whispered down a line of five people arrives slightly garbled. Down a line of fifty it arrives as nonsense, or as silence when someone forgets it, or as a shout when someone exaggerates. To make a long line work you need rules: speak at a steady volume (normalisation), start with a clear message (initialisation), let people skip forward when the chain breaks (residual connections). Deep networks are long lines, and this module is the set of rules.",
    },
    engineering: {
      title: "From 8 layers to 152",
      text: "The image-recognition contest that drove deep learning shows the progression in numbers. 2012: an 8-layer network with ReLU and dropout, error 16%. 2014: 19 and 22 layers with careful initialisation, error 7%. 2015: 152 layers with batch normalisation and residual connections, error 3.6%, better than the human baseline. The teams that tried 30 or 50 plain layers in between saw accuracy fall, not rise; depth only helped once the stabilisers existed. A team building an image model today starts from a residual, normalised architecture and never has to rediscover this.",
    },
    maths: {
      formula: "signal after L layers ∝ Πₗ sₗ ;   gradient after L layers ∝ Πₗ gₗ",
      meaning: "sₗ is how much layer l scales the forward signal; gₗ how much it scales the backward gradient. Products of many factors slightly below 1 vanish; slightly above 1, explode.",
      worked: [
        "Each layer scales the gradient by 0.9: after 50 layers, 0.9⁵⁰ ≈ 0.005. The first layer gets half a percent of the output's gradient.",
        "Each layer scales it by 1.1: 1.1⁵⁰ ≈ 117. Updates to the first layer are a hundred times too large; training diverges.",
        "Each layer scales it by exactly 1.0: 1.0⁵⁰ = 1. The goal of initialisation, normalisation and residuals is to make every factor close to 1.",
        "With a residual connection the factor is roughly 1 + small, and the 1 passes through untouched however deep the stack.",
      ],
    },
    useIt: "Treat this module as the checklist for any deep model: initialisation scheme, activation choice, normalisation layers, residual connections, regularisation. When reading an architecture, locate each; when a deep model fails, test each. The tools are a few lines of configuration and the difference between a model that trains and one that does not.",
    takeaways: ["Deep = many layers; power from composition, fragility from the long chain.", "Signals and gradients are products of per-layer factors; products of many factors vanish or explode.", "Initialisation, non-saturating activations, normalisation, residuals and regularisation keep the factors near 1 and the capacity useful.", "Every modern architecture includes all of them."],
    terms: [["deep network", "a network with many layers, typically more than a handful"], ["stabiliser", "a technique that keeps signals and gradients a sensible size through a deep stack"]],
    reflect: { q: "Why did adding layers make early networks worse rather than merely no better?", a: "Because without stabilisers extra layers actively damaged the signal: gradients vanished so early layers stayed random, and the random early layers scrambled the input for everything above. More layers meant more damage. Residual connections fixed this by making an extra layer harmless at worst." },
  },

  "m09-vanishing-gradients": {
    simple: "Vanishing gradients happen when the backward signal shrinks at every layer, so by the time it reaches the early layers it is too small to teach them anything.",
    concept:
      "Backpropagation (Module 5) computes each layer's gradient by multiplying the gradient from the layer above by two things: the layer's weights and the derivative of its activation. If that product is typically smaller than 1, each layer passes on a smaller gradient than it received. Across many layers the gradient shrinks geometrically until the early layers receive almost nothing. This is the **vanishing gradient** problem.\n\nThe classic culprit is the sigmoid activation, whose derivative is at most 0.25 and much less away from zero (Module 7). Ten sigmoid layers multiply the gradient by at most 0.25¹⁰, roughly one in a million. Small initial weights make it worse: multiplying by a matrix of small numbers shrinks a vector. The result is a network whose last layers learn and whose first layers stay at their random initial values, so the whole model behaves like a shallow network sitting on top of noise.\n\nThe fixes attack the factors: use activations whose derivative is 1 over a wide range (ReLU), initialise weights so each layer preserves scale (He initialisation), normalise activations, and add residual connections that give the gradient a path that bypasses the multiplications entirely.",
    why:
      "For twenty years this problem was the reason deep networks did not work. Recognising it is essential because its symptom is quiet: training does not crash, the loss does drop a little as the top layers adapt, and the model simply plateaus well below what it should achieve. An engineer who knows the pattern checks the gradient magnitudes per layer and sees the early layers at zero; one who does not spends weeks tuning learning rates.",
    how: [
      "The output layer's gradient is computed from the loss; call its size 1.",
      "The layer below receives it multiplied by the weights and by its activation derivative; for sigmoid, by at most 0.25.",
      "Each further layer multiplies by another factor below 1.",
      "After k layers the gradient is a product of k small factors: roughly cᵏ for c < 1, which tends to zero.",
      "The optimiser's update for an early layer is learning rate × gradient ≈ 0. Those weights never move.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer (from the top)", "Factor (sigmoid, |z| ≈ 2)", "Gradient reaching this layer", "Learns?"],
        rows: [
          ["output", "—", "1.0", "yes"],
          ["1 below", "0.105", "0.105", "yes"],
          ["3 below", "0.105³", "0.0012", "barely"],
          ["6 below", "0.105⁶", "1.3 × 10⁻⁶", "no"],
          ["10 below", "0.105¹⁰", "1.6 × 10⁻¹⁰", "no"],
        ],
      },
      caption: "The gradient after each sigmoid layer at a typical pre-activation. The bottom of a ten-layer network receives effectively nothing.",
    },
    everyday: {
      title: "Feedback that fades down the chain",
      text: "A customer complains to the shop manager, who mentions it to the regional manager, who summarises it for the director, who notes it in a report to the board. By the fourth retelling the complaint is a line item nobody acts on. Each person passes on a fraction of the urgency. The people at the bottom of the chain, where the problem could be fixed, hear almost nothing. That fading is the vanishing gradient, with the roles reversed: the signal starts at the top (the loss) and fades on its way down to the first layer.",
    },
    engineering: {
      title: "The six-layer speech model that was really two",
      text: "A speech team's six-layer sigmoid network reached 71% accuracy and would not improve. An engineer logged the average absolute gradient per layer: output layer 0.02, then 0.004, 0.0005, 0.00004, and the two lowest layers at zero to four decimal places. The first four layers had not moved from initialisation; the model was effectively two trained layers reading random features. Switching to ReLU with He initialisation put every layer's gradient within a factor of three of the output's, and accuracy rose to 84% with no other change. Logging per-layer gradient norms became a standard panel on their training dashboard.",
    },
    maths: {
      formula: "∂L/∂W⁽¹⁾ ∝ Πₗ₌₂ᴸ (W⁽ˡ⁾ᵀ · f'(z⁽ˡ⁾)) ;   for sigmoid f' ≤ 0.25, so |gradient| ≲ 0.25ᴸ⁻¹ · Π|W|",
      meaning: "The gradient on the first layer is a product over every layer above it of the weights times the activation derivative. If each factor is below 1, the product shrinks geometrically with depth L.",
      worked: [
        "Sigmoid at z = 0 everywhere (the best case): f' = 0.25. Weights scaled so |W| ≈ 1. Ten layers: 0.25⁹ ≈ 3.8 × 10⁻⁶.",
        "Learning rate 0.1: the first layer's update is 0.1 × 3.8 × 10⁻⁶ ≈ 4 × 10⁻⁷ per step. After a million steps the weights have moved about 0.4 in total, less than their random initial spread.",
        "ReLU with the neuron active: f' = 1. Ten layers with |W| ≈ 1: 1⁹ = 1. The first layer gets the same gradient size as the last.",
        "ReLU with small initial weights, |W| ≈ 0.5: 0.5⁹ ≈ 0.002. The activation is fixed but the weight scale still shrinks it; this is why initialisation (lesson 9.4) matters even with ReLU.",
      ],
    },
    code: {
      title: "Measuring the gradient at every layer",
      lang: "py",
      src: `import numpy as np

def gradient_through(depth, deriv, weight_scale, trials=1000):
    sizes = []
    for _ in range(trials):
        g = 1.0
        for _ in range(depth):
            g *= deriv * np.random.uniform(0.5, 1.5) * weight_scale
        sizes.append(abs(g))
    return np.median(sizes)

for name, deriv, w in [("sigmoid, |W|=1", 0.25, 1.0), ("relu, |W|=1", 1.0, 1.0), ("relu, |W|=0.5", 1.0, 0.5)]:
    print(f"{name:18s} depth 10: {gradient_through(10, deriv, w):.2e}   depth 30: {gradient_through(30, deriv, w):.2e}")`,
      lines: [
        { code: "g *= deriv * np.random.uniform(0.5, 1.5) * weight_scale", say: "One layer's effect on the gradient: the activation derivative times a weight factor with some randomness." },
        { code: "return np.median(sizes)", say: "The typical gradient size after the whole stack, over many random draws." },
        { code: "for name, deriv, w in [(\"sigmoid, |W|=1\", 0.25, 1.0), (\"relu, |W|=1\", 1.0, 1.0), (\"relu, |W|=0.5\", 1.0, 0.5)]:", say: "Three settings: sigmoid, ReLU at the right weight scale, ReLU with weights too small." },
      ],
      output: "sigmoid, |W|=1     depth 10: 8.84e-07   depth 30: 7.25e-19\nrelu, |W|=1        depth 10: 9.18e-01   depth 30: 7.80e-01\nrelu, |W|=0.5      depth 10: 8.97e-04   depth 30: 7.27e-10",
      note: "Your numbers will differ slightly because of the random draws; the orders of magnitude will not.",
    },
    useIt: "Log the gradient norm per layer during training; early layers at or near zero mean vanishing gradients. Fix with ReLU-family activations, He initialisation, normalisation layers and residual connections, in that order of cheapness. In recurrent networks (Module 10) the same problem appears across time steps, and LSTM gates were invented to solve it.",
    takeaways: ["Gradients are products of per-layer factors; factors below 1 make them vanish with depth.", "Sigmoid's derivative (≤ 0.25) and small weights are the classic causes.", "Symptom: early layers never change; the model plateaus as if shallow.", "Fixes: ReLU, He initialisation, normalisation, residual connections."],
    terms: [["vanishing gradient", "a gradient that shrinks toward zero as it passes back through layers"], ["gradient norm", "the overall size of a layer's gradient; the quantity to log per layer"]],
    reflect: { q: "Why does a vanishing gradient not cause an error or a crash?", a: "Because nothing is invalid: the arithmetic is correct and the numbers are finite. The updates are merely tiny. The only evidence is in the magnitudes, which is why per-layer gradient logging is the diagnostic." },
  },

  "m09-exploding-gradients": {
    simple: "Exploding gradients are the mirror problem: per-layer factors above 1 multiply into enormous gradients, updates overshoot, and the loss becomes NaN; gradient clipping and good initialisation stop it.",
    concept:
      "If each layer multiplies the backward gradient by a factor above 1, the product grows geometrically with depth. The gradients reaching early layers become huge, the optimiser takes enormous steps, the weights jump to absurd values, the next forward pass produces overflow, and the loss prints as NaN (not a number). This is the **exploding gradient** problem.\n\nIt comes from large weights: a weight matrix whose entries are too big scales every vector it multiplies, forward and backward. Poor initialisation causes it from the start; a learning rate that is too high causes it mid-training by growing the weights step by step until they tip over. Recurrent networks are especially prone, because the same weight matrix is applied at every time step, so a factor of 1.1 across 100 steps is 1.1¹⁰⁰ ≈ 14,000.\n\nThe fixes are direct. Initialise weights at the scale that preserves signal size (lesson 9.4). Normalise activations so the forward values cannot drift large. And as a safety net, **gradient clipping**: if the gradient's overall norm exceeds a threshold, scale it down to that threshold before the update. Clipping does not fix the cause but it prevents the catastrophe, and nearly every training script for deep or recurrent models includes it.",
    why:
      "Exploding gradients destroy a run abruptly: hours of training end in a NaN loss and a corrupted checkpoint. Unlike vanishing gradients, they are loud, but by the time the loss is NaN the weights are already garbage and the run must restart from a checkpoint. Knowing the early warning (gradient norms climbing over a few steps, loss spiking) and having clipping in place turns a lost day into a logged warning.",
    how: [
      "A layer with large weights multiplies the backward gradient by a factor above 1.",
      "Through k such layers (or k time steps of a recurrent network), the gradient grows like cᵏ for c > 1.",
      "The optimiser update, learning rate × gradient, becomes far larger than the weights themselves.",
      "Weights jump; the next forward pass produces huge activations; exponentials in softmax or sigmoid overflow; the loss is infinite or NaN.",
      "With clipping: before the update, if ‖gradient‖ > threshold, multiply the gradient by threshold / ‖gradient‖. Its direction is kept, its size is capped.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Vanishing", points: ["per-layer factor < 1", "gradient → 0 with depth", "quiet: loss plateaus, early layers frozen", "fix the cause: ReLU, He init, residuals"] },
      right: { title: "Exploding", points: ["per-layer factor > 1", "gradient → ∞ with depth", "loud: loss spikes, then NaN", "fix the cause: init, normalisation; safety net: clipping"] },
      caption: "Two sides of the same product. Both are solved by keeping every factor near 1.",
    },
    everyday: {
      title: "Feedback through a microphone",
      text: "A microphone picks up its own speaker, the speaker plays it louder, the microphone picks that up, and in a second the room is screaming. Each pass through the loop amplifies by a little more than 1, and the product runs away. The sound engineer's fix is the same as the deep-learning one: turn the gain down (initialisation and learning rate) and put a limiter on the output (gradient clipping) so no single pass can exceed a ceiling.",
    },
    engineering: {
      title: "The NaN at step 4,000",
      text: "A team training a language model saw the loss fall smoothly for four thousand steps, spike to 12, then print NaN. Their logged gradient norm told the story: steady around 1.5 for most of the run, then 3, 9, 40, 500 over the last ten steps before the crash. One batch of unusual text had produced a large gradient, the update enlarged some weights, and every subsequent step amplified it. They restarted from the step-3,900 checkpoint with gradient clipping at norm 1.0 and a slightly lower learning rate; the same batch now produced a clipped step, the norm stayed near 1.5, and the run finished. Clipping is now in their default configuration.",
    },
    maths: {
      formula: "‖g‖ = √(Σ gᵢ²) ;   if ‖g‖ > c: g ← g · c / ‖g‖ ;   recurrent factor: Wᵏ grows as λₘₐₓᵏ",
      meaning: "The gradient norm is the length of the vector of all gradients. Clipping rescales it to length c when it is longer. In a recurrent network the same matrix applied k times grows with the k-th power of its largest eigenvalue λₘₐₓ.",
      worked: [
        "Gradient on three weights: g = (30, 40, 0). Norm = √(900 + 1600) = 50. Threshold c = 5: scale by 5/50 = 0.1 → g = (3, 4, 0), norm 5, same direction.",
        "Learning rate 0.1 without clipping: the weights move by (3, 4, 0) in one step, likely larger than the weights themselves. With clipping: (0.3, 0.4, 0).",
        "Recurrent network, weight matrix with λₘₐₓ = 1.1, sequence of 100 steps: 1.1¹⁰⁰ ≈ 13,781. With λₘₐₓ = 0.9: 0.9¹⁰⁰ ≈ 0.00003. Only λₘₐₓ ≈ 1 survives long sequences.",
        "Overflow: a softmax logit of 1,000 gives e¹⁰⁰⁰, beyond the largest 32-bit float (≈ 3.4 × 10³⁸). The forward pass itself breaks once weights are large.",
      ],
    },
    code: {
      title: "Gradient clipping by global norm",
      lang: "py",
      src: `import numpy as np

def clip_by_global_norm(grads, max_norm=1.0):
    total = np.sqrt(sum(float((g ** 2).sum()) for g in grads))
    if total > max_norm:
        scale = max_norm / total
        grads = [g * scale for g in grads]
    return grads, total

g1 = np.array([[30.0, 40.0]])
g2 = np.array([0.0])
clipped, norm_before = clip_by_global_norm([g1, g2], max_norm=5.0)
print(norm_before, clipped[0])                 # 50.0 [[3. 4.]]
print(np.sqrt((clipped[0] ** 2).sum()))        # 5.0`,
      lines: [
        { code: "total = np.sqrt(sum(float((g ** 2).sum()) for g in grads))", say: "One norm across every layer's gradient together: the global norm." },
        { code: "scale = max_norm / total", say: "The factor that brings the norm down to the threshold; direction unchanged." },
        { code: "grads = [g * scale for g in grads]", say: "Every gradient scaled by the same factor, so the relative sizes between layers are preserved." },
        { code: "print(norm_before, clipped[0])                 # 50.0 [[3. 4.]]", say: "Norm 50 clipped to 5; the (30, 40) direction is kept as (3, 4)." },
      ],
      output: "50.0 [[3. 4.]]\n5.0",
    },
    useIt: "Enable gradient clipping (global norm around 1.0) for recurrent networks, transformers and any deep model; log the pre-clip norm so you can see when it fires. If it fires constantly, lower the learning rate or fix initialisation: clipping should be a safety net, not the main control. A NaN loss means restart from the last good checkpoint with clipping on.",
    takeaways: ["Exploding gradients: per-layer factors above 1 multiply into huge updates and a NaN loss.", "Causes: large weights from poor initialisation or a high learning rate; worst in recurrent networks.", "Clipping caps the gradient's norm while keeping its direction.", "Fix causes with initialisation and normalisation; keep clipping as a safety net and log when it fires."],
    terms: [["exploding gradient", "a gradient that grows without bound through layers or time steps"], ["gradient clipping", "scaling a gradient down to a maximum norm before the update"], ["NaN", "'not a number': the result of overflow or invalid arithmetic, which poisons every later computation"]],
    reflect: { q: "Clipping keeps a run alive, but what does it cost if it fires on every step?", a: "The effective learning rate becomes whatever the clip allows, not what you set, and the optimiser's adaptive statistics see distorted gradients. Constant clipping means the real problem (learning rate, initialisation, a bad layer) is unaddressed and training is slower and less predictable than it should be." },
  },

  "m09-weight-initialisation": {
    simple: "Weight initialisation sets the starting values of every weight; the right scale keeps signals and gradients the same size through the stack, and the wrong scale vanishes or explodes them before training even begins.",
    concept:
      "Before training, every weight must have a value. **Weight initialisation** is the choice of those starting values, and it matters more than it looks. Weights must be random, so that neurons in the same layer start different and can learn different features (identical weights would receive identical gradients and stay identical forever). And they must be the right size: too small and the forward signal shrinks to zero layer by layer, too large and it blows up, and the backward gradient does the same.\n\nThe principle is to preserve variance. If a layer has n inputs each of variance 1 and weights of variance v, its output's variance is roughly n·v (a sum of n independent terms). To keep the output's variance at 1, choose v = 1/n: weights drawn from a distribution with standard deviation 1/√n. Variations of this rule, adjusted for the activation function, are the Xavier and He schemes of the next two lessons.\n\nBiases are usually initialised to zero. With a good weight scale, zero biases leave the activations centred and every ReLU roughly half-on, which is where training can start.",
    why:
      "Initialisation is the cheapest stabiliser and the one that acts first: before any gradient step, a badly scaled network already has vanished or exploded activations, and no learning rate rescues it. Historically, deep networks became trainable partly because researchers worked out the right scales; today frameworks use good defaults, but you still need to know them to spot a custom layer initialised at the wrong scale, to understand why a run is dead from step one, and to initialise anything you build by hand.",
    how: [
      "For each layer, note its fan-in n (number of inputs per neuron) and, for some schemes, its fan-out m.",
      "Choose the target variance for the weights from the scheme: 1/n (basic), 2/(n + m) (Xavier), 2/n (He).",
      "Draw each weight independently from a normal or uniform distribution with that variance.",
      "Set biases to zero (or a small positive constant for ReLU layers in some recipes).",
      "Check: run one forward pass on a batch and print the standard deviation of activations at each layer; it should stay roughly constant.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Weight std for a 512-input layer", "Activation std after 1 layer", "After 10 layers", "After 50 layers", "Verdict"],
        rows: [
          ["0.001", "≈ 0.02", "≈ 10⁻¹⁷", "0", "vanished: every activation is zero"],
          ["0.044 (= 1/√512)", "≈ 1", "≈ 1", "≈ 1", "preserved"],
          ["0.1", "≈ 2.3", "≈ 3,900", "≈ 10¹⁸", "exploded: overflow"],
        ],
      },
      caption: "Three starting scales for the same network, before any training. Only the middle one leaves a trainable network.",
    },
    everyday: {
      title: "Setting the volume before the show",
      text: "A sound engineer sets every channel's gain before the band plays. Set them all near zero and the audience hears nothing; crank them all and the first chord is a wall of distortion. The right starting gains let the music through at a level where adjustments during the show actually mean something. Initialisation sets the gains; training is the show.",
    },
    engineering: {
      title: "The custom layer that killed the run",
      text: "A recommendation team added a hand-written layer to a framework model and initialised its weights with a standard normal (standard deviation 1) because the tutorial they copied did. The layer had 2,048 inputs, so its outputs had a standard deviation around 45, the next layer's about 2,000, and the softmax at the top overflowed on the first batch: loss NaN at step 0. Changing the initialisation to standard deviation √(2/2048) ≈ 0.031 made the run train normally. Their code review now requires every custom layer to state its initialisation scheme.",
    },
    maths: {
      formula: "Var(z) = n · Var(w) · Var(x)   ⇒   Var(w) = 1/n keeps Var(z) = Var(x) ;   std(w) = 1/√n",
      meaning: "z = Σ wᵢxᵢ over n inputs with independent weights and inputs. The variance of a sum of n independent products is n times the product of their variances. Choosing Var(w) = 1/n cancels the n.",
      worked: [
        "n = 512 inputs of variance 1. Weights with std 0.1 → Var(w) = 0.01: Var(z) = 512 × 0.01 × 1 = 5.12, std ≈ 2.26. Each layer multiplies the std by ≈ 2.26; ten layers: 2.26¹⁰ ≈ 3,500.",
        "Weights with std 1/√512 ≈ 0.0442 → Var(w) = 1/512: Var(z) = 512 × (1/512) × 1 = 1. Preserved at every layer.",
        "Weights with std 0.001 → Var(w) = 10⁻⁶: Var(z) = 512 × 10⁻⁶ = 0.0005, std ≈ 0.023 per layer; ten layers: 0.023¹⁰ ≈ 4 × 10⁻¹⁷.",
        "Fan-in matters: a layer with 64 inputs needs std 1/8 = 0.125; one with 4,096 inputs needs 1/64 ≈ 0.016. One fixed scale cannot serve both.",
      ],
    },
    code: {
      title: "Watching activations through 20 layers",
      lang: "py",
      src: `import numpy as np
np.random.seed(0)

def activation_std_through(depth, n, weight_std):
    x = np.random.randn(1000, n)                 # a batch of inputs, variance 1
    for _ in range(depth):
        W = np.random.randn(n, n) * weight_std
        x = x @ W                                # linear layers only, to isolate the scale
    return x.std()

n = 512
for ws in (0.001, 1 / np.sqrt(n), 0.1):
    print(f"std {ws:.4f}: after 1 layer {activation_std_through(1, n, ws):8.3g}   after 20 layers {activation_std_through(20, n, ws):8.3g}")`,
      lines: [
        { code: "x = np.random.randn(1000, n)                 # a batch of inputs, variance 1", say: "Inputs standardised to variance 1, as lesson 8.2 prescribes." },
        { code: "W = np.random.randn(n, n) * weight_std", say: "Weights drawn from a normal distribution with the chosen standard deviation." },
        { code: "x = x @ W                                # linear layers only, to isolate the scale", say: "Only the weight scale is being tested here; the activation's own effect is the next two lessons." },
        { code: "for ws in (0.001, 1 / np.sqrt(n), 0.1):", say: "Too small, just right, too large." },
      ],
      output: "std 0.0010: after 1 layer   0.0224   after 20 layers 9.69e-34\nstd 0.0442: after 1 layer    0.999   after 20 layers    0.982\nstd 0.1000: after 1 layer     2.26   after 20 layers 1.17e+07",
    },
    useIt: "Rely on framework defaults for standard layers, which implement Xavier or He, but check the scheme whenever you write a custom layer, load weights from another source, or see a run that is dead or NaN at step zero. Printing per-layer activation standard deviations after one forward pass is a thirty-second sanity check worth running on every new architecture.",
    takeaways: ["Weights start random (to break symmetry) and at a scale that preserves variance: std ≈ 1/√fan-in.", "Too small → activations and gradients vanish before training; too large → they explode.", "Biases start at zero.", "Check with one forward pass: activation std should be roughly constant across layers."],
    terms: [["weight initialisation", "the choice of starting values for a network's weights"], ["fan-in", "the number of inputs to a neuron or layer"], ["symmetry breaking", "starting neurons with different random weights so they can learn different features"]],
    reflect: { q: "Why would initialising every weight to the same constant, even the 'right' size, fail?", a: "All neurons in a layer would compute the same output and receive the same gradient, so they would update identically and remain copies of one another forever. The layer would have the capacity of a single neuron. Randomness is what breaks the symmetry." },
  },

  "m09-xavier-initialisation": {
    simple: "Xavier (Glorot) initialisation sets weight variance to 2 / (fan-in + fan-out), balancing forward and backward signal sizes; it is the right choice for sigmoid and tanh layers.",
    concept:
      "**Xavier initialisation**, also called Glorot initialisation after its author, is the first widely used principled scheme. The previous lesson showed that Var(w) = 1/fan-in preserves the forward signal. But the backward gradient passes through the same weights in the other direction, where the relevant count is the fan-out (the number of neurons the layer feeds). Preserving the backward signal wants Var(w) = 1/fan-out. Xavier compromises: Var(w) = 2 / (fan-in + fan-out), the harmonic middle of the two.\n\nIn practice the weights are drawn from a normal distribution with that variance, or from a uniform distribution on [−a, a] with a = √(6 / (fan-in + fan-out)), which has the same variance.\n\nThe derivation assumes the activation is roughly linear near zero and symmetric, which is true of tanh and approximately of sigmoid. For ReLU it is not: ReLU zeroes half of its inputs, halving the variance at every layer, and Xavier-initialised ReLU networks slowly vanish. That gap is why He initialisation (next lesson) exists. Xavier remains the default for tanh and sigmoid layers and for the linear projections inside many transformer implementations.",
    why:
      "Before Xavier's 2010 paper, initialisation was folklore: small random numbers of some scale someone had found to work. The paper gave a formula tied to the layer's shape and showed that with it, deeper tanh networks trained where they previously had not. It turned initialisation from a guess into an engineering calculation, and every later scheme is a refinement of its argument.",
    how: [
      "Note the layer's fan-in n and fan-out m.",
      "Compute the variance 2 / (n + m).",
      "Draw weights from Normal(0, 2/(n + m)), or Uniform(−√(6/(n+m)), √(6/(n+m))).",
      "Use for layers followed by tanh, sigmoid or no activation.",
      "Verify with one forward pass that activation variance stays roughly constant and one backward pass that gradient norms do too.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "fan-in n", "fan-out m", "Xavier variance 2/(n+m)", "std", "uniform bound √(6/(n+m))"],
        rows: [
          ["784 → 256", "784", "256", "0.00192", "0.0438", "0.0759"],
          ["256 → 256", "256", "256", "0.00391", "0.0625", "0.108"],
          ["256 → 10", "256", "10", "0.00752", "0.0867", "0.150"],
        ],
      },
      caption: "Xavier scales per layer. Narrow layers get larger weights; the last layer's small fan-out raises its variance.",
    },
    everyday: {
      title: "A door that must swing both ways",
      text: "A kitchen door that swings both ways needs its spring set for traffic in both directions: tuned only for waiters going out, it slams on those coming in. Xavier is a spring set for two-way traffic: the forward signal going one way, the gradient the other. The compromise is the average of the two ideal settings.",
    },
    engineering: {
      title: "Why the transformer's projections use Xavier",
      text: "A team implementing a transformer from scratch chose He initialisation everywhere, since 'it is for deep networks'. Their attention projections (query, key, value), which have no activation after them, produced attention logits with twice the intended variance, so the softmax was sharp from the start and training was erratic. Switching those linear projections to Xavier, matching the reference implementation, brought the logit scale down and training stabilised. The rule they wrote down: He for layers followed by ReLU-family activations, Xavier for linear projections and tanh/sigmoid layers.",
    },
    maths: {
      formula: "Var(w) = 2 / (n_in + n_out) ;   uniform bound a = √(6 / (n_in + n_out))",
      meaning: "Forward preservation wants 1/n_in, backward wants 1/n_out; Xavier takes the harmonic mean, 2/(n_in + n_out). A uniform distribution on [−a, a] has variance a²/3, so a = √(3 · Var).",
      worked: [
        "Layer 784 → 256: Var(w) = 2 / 1040 ≈ 0.00192; std ≈ 0.0438.",
        "Forward check: Var(z) = 784 × 0.00192 × 1 ≈ 1.51 (slightly above 1, because the compromise favours the smaller fan-out a little).",
        "Backward check: gradient variance ≈ 256 × 0.00192 ≈ 0.49 per layer (slightly below 1). Neither direction drifts far from 1.",
        "Uniform version: a = √(6 / 1040) ≈ 0.0759; variance a²/3 = 0.00576/3 ≈ 0.00192. Same variance, different shape.",
        "With ReLU after this layer: the activation halves the variance to ≈ 0.75 per layer; ten layers: 0.75¹⁰ ≈ 0.056. Xavier under-scales ReLU networks, which is He's correction.",
      ],
    },
    code: {
      title: "Xavier normal and uniform",
      lang: "py",
      src: `import numpy as np

def xavier_normal(n_in, n_out):
    std = np.sqrt(2.0 / (n_in + n_out))
    return np.random.randn(n_out, n_in) * std

def xavier_uniform(n_in, n_out):
    a = np.sqrt(6.0 / (n_in + n_out))
    return np.random.uniform(-a, a, size=(n_out, n_in))

W1 = xavier_normal(784, 256)
W2 = xavier_uniform(784, 256)
print(round(W1.std(), 4), round(W2.std(), 4))   # both ≈ 0.0438

x = np.random.randn(1000, 784)
print(round((x @ W1.T).std(), 3))               # ≈ 1.23 (variance ≈ 1.5), before any activation`,
      lines: [
        { code: "std = np.sqrt(2.0 / (n_in + n_out))", say: "The Xavier standard deviation from the layer's two sizes." },
        { code: "a = np.sqrt(6.0 / (n_in + n_out))", say: "The uniform bound that gives the same variance." },
        { code: "print(round(W1.std(), 4), round(W2.std(), 4))   # both ≈ 0.0438", say: "Two distributions, one variance; either is 'Xavier'." },
        { code: "print(round((x @ W1.T).std(), 3))               # ≈ 1.23 (variance ≈ 1.5), before any activation", say: "The forward signal stays near unit scale, as designed." },
      ],
      output: "0.0438 0.0438\n1.229",
    },
    useIt: "Use Xavier for tanh and sigmoid layers, for linear projections without a following activation (attention projections, output heads), and as the framework default it usually is for such layers. Use He instead for ReLU-family layers. When a custom layer needs initialising, pick by the activation that follows it.",
    takeaways: ["Xavier: Var(w) = 2/(fan-in + fan-out), balancing forward and backward signal sizes.", "Normal or uniform forms with the same variance.", "Right for tanh, sigmoid and linear layers; under-scales ReLU layers by half per layer.", "Pick the scheme by the activation that follows the layer."],
    terms: [["Xavier (Glorot) initialisation", "weights with variance 2/(fan-in + fan-out)"], ["fan-out", "the number of neurons a layer's outputs feed"]],
    reflect: { q: "Why does Xavier use the average of 1/fan-in and 1/fan-out rather than just 1/fan-in?", a: "Because the same weights carry the gradient backward, where fan-out plays the role fan-in plays forward. Preserving only the forward signal can let the backward gradient drift by the ratio fan-in/fan-out per layer; the compromise keeps both within a modest factor of 1." },
  },

  "m09-he-initialisation": {
    simple: "He initialisation doubles Xavier's variance to 2 / fan-in, compensating for ReLU zeroing half its inputs; it is the standard for ReLU-family networks.",
    concept:
      "**He initialisation** (after Kaiming He, 2015) is the ReLU correction. A ReLU outputs zero for half of a symmetric input distribution, so the variance of what passes through is half the variance of the pre-activation. A layer initialised to preserve variance into z then loses half of it in the activation; stack twenty such layers and the signal is 2⁻²⁰ of its starting size. He's fix is to start with twice the variance: Var(w) = 2 / fan-in, so that after the ReLU halves it, the output variance is back to 1.\n\nThe weights are drawn from Normal(0, 2/fan-in), standard deviation √(2/fan-in), or the uniform equivalent with bound √(6/fan-in). Only fan-in appears; the scheme preserves the forward signal exactly and accepts whatever the backward direction gets, which in practice is close enough.\n\nHe initialisation with ReLU was the combination that made 30-layer plain networks trainable in 2015 and, together with batch normalisation and residual connections, 150-layer ones. It is the default initialisation for convolutional and dense ReLU layers in every major framework. For leaky ReLU the factor is adjusted to 2/(1 + α²); for GELU, He is used as is.",
    why:
      "The variance halving is exact and compounds brutally: a ReLU network initialised with Xavier has activations shrinking by √2 per layer, which at depth twenty is a thousandfold and at depth fifty is a millionfold. The result is a network whose later layers see near-zero inputs and whose gradients vanish correspondingly. He initialisation removes that decay with one factor of 2, which is why it matters as much as the choice of ReLU itself.",
    how: [
      "Note the layer's fan-in n (inputs per neuron; for a convolution, k × k × channels).",
      "Set Var(w) = 2/n; std = √(2/n).",
      "Draw weights from Normal(0, 2/n) or Uniform(−√(6/n), √(6/n)).",
      "Biases to zero.",
      "Check activation std after a ReLU at each layer: it should stay near 1 (precisely, the std of the post-ReLU values is about 0.58 while the pre-activation std stays near 1).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Scheme", "Var(w)", "Pre-activation variance per layer", "After ReLU", "After 20 ReLU layers"],
        rows: [
          ["Xavier (n = m)", "1/n", "1", "0.5", "0.5²⁰ ≈ 10⁻⁶"],
          ["He", "2/n", "2 → but input variance was 1, so z has variance 2 × 0.5 = 1", "0.5 of 2 = 1", "1"],
          ["He on leaky ReLU, α = 0.2", "2/((1 + α²) n)", "≈ 1.92/n per input", "≈ 1", "1"],
        ],
      },
      caption: "He's factor of 2 exactly cancels ReLU's halving, layer after layer.",
    },
    everyday: {
      title: "Pouring twice as much because half spills",
      text: "If every time you pass a bucket down a line half the water spills, and you want a full bucket to arrive, you must start each handover with two buckets' worth. He initialisation is pouring double because ReLU spills half.",
    },
    engineering: {
      title: "A 30-layer network that finally trained",
      text: "An image team's 30-layer plain ReLU network with Xavier initialisation sat at chance accuracy for the first five epochs: activations at the top layer had standard deviation around 10⁻⁵, so the output layer saw essentially zeros and the gradient flowing back was negligible. They changed one argument, the initialisation to He, and the same network started learning from the first hundred steps, reaching 88% where the Xavier run had stalled. Their later residual network needed He too; without it, the residual stream was fine but each block's internal layers still vanished.",
    },
    maths: {
      formula: "Var(ReLU(z)) = ½ Var(z) for symmetric z ;   Var(z) = n · Var(w) · Var(x) ;   He: Var(w) = 2/n  ⇒  Var(ReLU(z)) = Var(x)",
      meaning: "ReLU keeps half the mass of a symmetric distribution, halving the variance. Doubling the weight variance restores it, so each layer's post-ReLU variance equals its input variance.",
      worked: [
        "n = 512, Var(x) = 1. He: Var(w) = 2/512 = 0.0039, std ≈ 0.0625.",
        "Var(z) = 512 × 0.0039 × 1 = 2. After ReLU: ½ × 2 = 1. Preserved.",
        "Xavier with n = m = 512: Var(w) = 2/1024 ≈ 0.00195. Var(z) = 1; after ReLU 0.5. Twenty layers: 0.5²⁰ ≈ 9.5 × 10⁻⁷.",
        "Convolution with 3 × 3 filters over 64 channels: fan-in = 3 · 3 · 64 = 576; He std = √(2/576) ≈ 0.0589.",
        "Leaky ReLU, α = 0.2: keeps variance (1 + 0.04)/2 = 0.52 of z; He-adjusted Var(w) = 2/(1.04 · 512) ≈ 0.00376.",
      ],
    },
    code: {
      title: "He versus Xavier through 20 ReLU layers",
      lang: "py",
      src: `import numpy as np
np.random.seed(1)

def relu(z): return np.maximum(0.0, z)

def final_std(depth, n, scheme):
    x = np.random.randn(2000, n)
    for _ in range(depth):
        var = 2.0 / n if scheme == "he" else 2.0 / (n + n)
        W = np.random.randn(n, n) * np.sqrt(var)
        x = relu(x @ W)
    return x.std()

for scheme in ("xavier", "he"):
    print(scheme, round(final_std(20, 512, scheme), 6))`,
      lines: [
        { code: "var = 2.0 / n if scheme == \"he\" else 2.0 / (n + n)", say: "He: 2/fan-in. Xavier with equal fan-in and fan-out: 1/fan-in. A factor of two between them." },
        { code: "x = relu(x @ W)", say: "A linear layer followed by ReLU, twenty times." },
        { code: "print(scheme, round(final_std(20, 512, scheme), 6))", say: "Xavier's activations have shrunk a thousandfold; He's are still near their original scale." },
      ],
      output: "xavier 0.000654\nhe 0.57621",
      note: "0.576 is the expected post-ReLU standard deviation when the pre-activation has variance 1: half the mass at zero, the rest a half-normal.",
    },
    useIt: "Use He initialisation for every layer followed by ReLU, leaky ReLU or GELU: dense, convolutional, and the feedforward blocks of transformers. It is the framework default for ReLU layers; confirm it when writing custom layers or porting weights. Use Xavier for tanh, sigmoid and plain linear projections.",
    takeaways: ["ReLU halves the variance; He doubles the weight variance to 2/fan-in to compensate.", "Preserves the forward signal exactly through any depth of ReLU layers.", "Default for ReLU, leaky ReLU (with a small adjustment) and GELU layers.", "Xavier-initialised ReLU networks shrink by √2 per layer and stall at depth."],
    terms: [["He (Kaiming) initialisation", "weights with variance 2/fan-in, for ReLU-family layers"], ["half-normal distribution", "the positive half of a normal distribution; what ReLU leaves of a symmetric input"]],
    reflect: { q: "GELU is not exactly ReLU; why is He initialisation still used for it?", a: "GELU passes slightly more than half the variance (its negative side is small but non-zero), so He over-corrects by a few percent per layer. In practice normalisation layers in transformers absorb that difference, and He is close enough that nobody bothers with a GELU-specific factor." },
  },

  "m09-dropout": {
    simple: "Dropout randomly switches off a fraction of neurons on every training step, so the network cannot rely on any single neuron and learns redundant, more general features; at inference everything is on.",
    concept:
      "**Dropout** is a regularisation technique: during training, for each example in each batch, every neuron in a dropout layer is kept with probability p (say 0.8) or set to zero with probability 1 − p. The pattern of which neurons are dropped is drawn fresh for every example and every step. The surviving activations are scaled up by 1/p so their expected total stays the same.\n\nThe effect is that no neuron can depend on a specific other neuron being present, because it might not be. Features that only work in combination with one particular partner are unreliable under dropout; features that are useful on their own, and combinations with many redundant partners, survive. The network is pushed toward robust, distributed representations rather than brittle co-adaptations, which is what generalisation needs.\n\nAt inference, dropout is switched off: every neuron is present and no scaling is applied (the 1/p during training already compensated). A model with dropout behaves, approximately, like an average over an enormous ensemble of thinned networks, which is a second explanation of why it generalises. Typical rates: keep 0.5 to 0.8 in large dense layers; 0.9 or no dropout in convolutional layers; 0.9 in transformers.",
    why:
      "Large networks memorise. With millions of parameters and tens of thousands of examples, a network can learn the training set by rote, including its noise, and fail on new data (Module 4). Dropout, introduced in 2012, was the single most effective cheap defence: it adds no parameters, costs almost nothing, and in the paper that introduced it cut error rates on several benchmarks by a quarter. It remains in nearly every architecture, with its rate tuned per layer.",
    how: [
      "Choose a keep probability p for the layer (0.5 to 0.9).",
      "During training, for each forward pass, draw a random mask of 0s and 1s the same shape as the layer's output, with each entry 1 with probability p.",
      "Multiply the activations by the mask and divide by p (inverted dropout).",
      "Backward: the gradient passes only through the kept neurons, scaled by the same 1/p.",
      "At inference, skip the mask entirely: use all activations unchanged.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Activations", detail: "a = (2.0, 1.0, 0.5, 3.0), keep probability p = 0.5" },
        { label: "Random mask", detail: "m = (1, 0, 1, 0) this step; a different draw next step" },
        { label: "Apply and rescale", detail: "a · m / p = (4.0, 0, 1.0, 0)" },
        { label: "Expected value", detail: "each neuron contributes p × (a/p) = a on average, so the layer's scale is unchanged" },
        { label: "Inference", detail: "mask off: (2.0, 1.0, 0.5, 3.0), no scaling" },
      ],
      caption: "Inverted dropout: drop, rescale during training, do nothing at inference.",
    },
    everyday: {
      title: "Training a team with random absences",
      text: "A football manager runs every training session with a random few players missing. Nobody can build a plan around one teammate always being there; everyone learns to cover several roles, and the team stops depending on a star. On match day everyone plays, and the team is more robust than one that always trained at full strength. Dropout is random absences at training, full squad at inference.",
    },
    engineering: {
      title: "The churn model that stopped memorising",
      text: "A telecoms churn model with two dense layers of 512 units reached training loss 0.05 and validation loss 0.48 by epoch 12: textbook overfitting on 40,000 customers. Adding dropout with keep probability 0.5 after each hidden layer changed the curves: training loss settled at 0.28, validation at 0.31, and the gap stayed small through 40 epochs. Validation accuracy rose from 79% to 86%. The engineer also noticed that with dropout the training loss is always higher than it 'should' be, since the network is handicapped during training; they learned to compare models by validation loss only.",
    },
    maths: {
      formula: "training: ã = a ⊙ m / p, m ~ Bernoulli(p) ;   E[ã] = a ;   inference: ã = a",
      meaning: "m is a random 0/1 mask with P(1) = p; ⊙ is element-wise multiplication. Dividing by p makes the expected activation equal the undropped one, so inference needs no adjustment.",
      worked: [
        "a = (2.0, 1.0, 0.5, 3.0), p = 0.5. Expected number kept: 2 of 4.",
        "Mask (1, 0, 1, 0): ã = (2.0/0.5, 0, 0.5/0.5, 0) = (4.0, 0, 1.0, 0). Sum 5.0.",
        "Mask (0, 1, 1, 1): ã = (0, 2.0, 1.0, 6.0). Sum 9.0.",
        "Average over all 16 masks: each entry is kept half the time at double size, so E[ã] = (2.0, 1.0, 0.5, 3.0) = a, sum 6.5. Individual steps vary; the expectation matches inference.",
        "Number of distinct thinned networks a 512-unit layer can produce: 2⁵¹²; the trained model is effectively an average over a sample of them.",
      ],
    },
    code: {
      title: "Inverted dropout, training and inference",
      lang: "py",
      src: `import numpy as np
np.random.seed(3)

def dropout(a, keep=0.5, training=True):
    if not training:
        return a                                   # inference: everything on, no scaling
    mask = (np.random.rand(*a.shape) < keep).astype(float)
    return a * mask / keep

a = np.array([2.0, 1.0, 0.5, 3.0])
for step in range(3):
    print("train step", step, dropout(a, keep=0.5))
print("inference   ", dropout(a, training=False))

many = np.mean([dropout(a) for _ in range(100000)], axis=0)
print("average over 100k steps", np.round(many, 2))       # ≈ a`,
      lines: [
        { code: "return a                                   # inference: everything on, no scaling", say: "The single switch that must be set correctly in production (lesson 8.12)." },
        { code: "mask = (np.random.rand(*a.shape) < keep).astype(float)", say: "A fresh random mask every call: 1 with probability keep." },
        { code: "return a * mask / keep", say: "Zero the dropped neurons and scale the rest up, so the expected value is unchanged." },
        { code: "print(\"average over 100k steps\", np.round(many, 2))       # ≈ a", say: "Averaged over many steps, dropout leaves the activations where they were: that is why inference needs no correction." },
      ],
      output: "train step 0 [4. 2. 0. 6.]\ntrain step 1 [0. 2. 0. 0.]\ntrain step 2 [4. 0. 1. 6.]\ninference    [2.  1.  0.5 3. ]\naverage over 100k steps [2.   1.   0.5  3.  ]",
      note: "Your masks will differ with a different seed; the average will not.",
    },
    useIt: "Add dropout after large dense layers (keep 0.5–0.8) and inside transformer blocks (keep ≈ 0.9) when validation loss diverges from training loss. Tune the rate by validation; remove it if the model underfits. Always confirm dropout is off at inference, and compare models by validation metrics, since dropout inflates training loss.",
    takeaways: ["Dropout zeroes a random subset of neurons per example per step during training, rescaling the rest by 1/p.", "It prevents co-adaptation and approximates an ensemble of thinned networks, which improves generalisation.", "Off at inference, with no scaling needed thanks to inverted dropout.", "A cheap, parameter-free regulariser for networks that overfit."],
    terms: [["dropout", "randomly disabling neurons during training to regularise"], ["keep probability", "the chance a neuron is retained on a given step"], ["co-adaptation", "features that only work in the presence of specific other features; what dropout discourages"]],
    reflect: { q: "Why does the training loss of a model with dropout look worse than the same model without it, even when it generalises better?", a: "Because during training the network is handicapped: on every step a random portion of it is missing. The loss measures that handicapped network. At inference the full network runs and performs better than its training loss suggests, which is why validation loss is the honest comparison." },
  },

  "m09-batch-normalisation": {
    simple: "Batch normalisation standardises each feature across the current mini-batch, then rescales it with two learned parameters, keeping every layer's inputs in a stable range so deep networks train faster and more reliably.",
    concept:
      "Lesson 8.2 standardised the network's inputs so no feature dominated. **Batch normalisation** does the same thing inside the network, at every layer, during training. For each feature (each neuron's output in a layer), it computes the mean and variance across the examples in the current mini-batch, subtracts the mean and divides by the standard deviation, and then multiplies by a learned scale γ and adds a learned shift β. The layer's outputs are thus always centred and scaled before the next layer sees them, whatever the previous layers are doing.\n\nTwo things make it work in practice. The learned γ and β mean normalisation never removes capacity: the network can undo it if a different scale is useful. And during training the layer keeps running averages of the batch means and variances; at inference, with no batch to compute from, it uses those saved statistics instead, so a single example gets a deterministic output.\n\nThe benefits are large: training is less sensitive to initialisation and learning rate, converges several times faster, and tolerates far deeper stacks. The cost is a dependence on batch size (small batches give noisy statistics) and the training/inference mode switch that, forgotten, produces wrong predictions (lesson 8.12). Batch normalisation is standard in convolutional networks; sequence models mostly use layer normalisation (next lesson) instead.",
    why:
      "As training updates every layer, the distribution of each layer's inputs keeps shifting: the layer below changed, so what arrives looks different from what this layer's weights were tuned for. Every layer is chasing a moving target. Batch normalisation fixes each layer's input distribution to mean 0 and variance 1 (before γ and β), so layers stop chasing one another and can use larger learning rates. It was introduced in 2015 and, with residual connections, is what made 100-plus-layer networks train.",
    how: [
      "For a layer's output over a mini-batch of B examples, compute each feature's mean μ and variance σ² across the B values.",
      "Normalise: x̂ = (x − μ) / √(σ² + ε), with ε a tiny constant to avoid division by zero.",
      "Rescale: y = γ x̂ + β, with γ and β learned per feature (initialised to 1 and 0).",
      "Update running averages: μ_run ← 0.9 μ_run + 0.1 μ, likewise for σ², for use at inference.",
      "At inference, normalise with μ_run and σ²_run, so each example's output does not depend on other examples.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Batch of one feature", detail: "x = (4, 6, 8, 10) across four examples" },
        { label: "Statistics", detail: "μ = 7, σ² = 5, σ ≈ 2.236" },
        { label: "Normalise", detail: "x̂ = (−1.34, −0.45, 0.45, 1.34)" },
        { label: "Rescale with learned γ = 2, β = 1", detail: "y = (−1.68, 0.11, 1.89, 3.68)" },
        { label: "Inference later, one example x = 9", detail: "uses running μ ≈ 7, σ ≈ 2.24: x̂ = 0.89, y = 2.79" },
      ],
      caption: "One feature through batch normalisation. γ and β let the layer choose any scale and shift after the standardisation.",
    },
    everyday: {
      title: "Grading on a curve, every lesson",
      text: "A teacher grades each test on a curve: scores are converted to 'how far above or below the class average', so a hard test and an easy test produce comparable marks. Then the school applies its own scale and offset to report grades. Batch normalisation grades every layer's outputs on the curve of the current batch, then applies a learned scale and offset, so the next layer always receives marks it knows how to read.",
    },
    engineering: {
      title: "Four times faster, and a bug at serving time",
      text: "An image team added batch normalisation after every convolution in a 20-layer model. Training to their target accuracy went from 60 epochs to 15, and a learning rate ten times higher than before was stable. Then the serving team reported that the same image got different predictions depending on what else was in the request batch: the model had been exported in training mode, so inference was normalising with batch statistics. Switching to inference mode fixed it. They added a test that checks a single image's prediction equals its prediction inside a batch of random others.",
    },
    maths: {
      formula: "μ = (1/B) Σ xᵢ ;   σ² = (1/B) Σ (xᵢ − μ)² ;   x̂ᵢ = (xᵢ − μ) / √(σ² + ε) ;   yᵢ = γ x̂ᵢ + β",
      meaning: "Statistics are over the B examples of the batch, per feature. ε (about 10⁻⁵) prevents division by zero. γ and β are learned.",
      worked: [
        "x = (4, 6, 8, 10): μ = 28/4 = 7; deviations (−3, −1, 1, 3); σ² = (9 + 1 + 1 + 9)/4 = 5; σ ≈ 2.236.",
        "x̂ = (−3, −1, 1, 3)/2.236 = (−1.342, −0.447, 0.447, 1.342). Mean 0, variance 1.",
        "γ = 2, β = 1: y = (−1.683, 0.106, 1.894, 3.683).",
        "Running statistics after this batch, starting from μ_run = 0, σ²_run = 1 with momentum 0.9: μ_run = 0.7, σ²_run = 0.9 + 0.5 = 1.4. After many batches they converge to the true feature statistics.",
        "Batch of size 2 instead: x = (4, 10), μ = 7, σ² = 9: a different, noisier estimate. Tiny batches make batch normalisation unreliable.",
      ],
    },
    code: {
      title: "Batch normalisation with running statistics",
      lang: "py",
      src: `import numpy as np

class BatchNorm:
    def __init__(self, features, momentum=0.9, eps=1e-5):
        self.gamma, self.beta = np.ones(features), np.zeros(features)
        self.run_mean, self.run_var = np.zeros(features), np.ones(features)
        self.momentum, self.eps = momentum, eps

    def forward(self, X, training=True):             # X: batch × features
        if training:
            mean, var = X.mean(axis=0), X.var(axis=0)
            self.run_mean = self.momentum * self.run_mean + (1 - self.momentum) * mean
            self.run_var  = self.momentum * self.run_var  + (1 - self.momentum) * var
        else:
            mean, var = self.run_mean, self.run_var
        x_hat = (X - mean) / np.sqrt(var + self.eps)
        return self.gamma * x_hat + self.beta

bn = BatchNorm(1)
bn.gamma[:] = 2.0; bn.beta[:] = 1.0
print(np.round(bn.forward(np.array([[4.0], [6.0], [8.0], [10.0]])).ravel(), 3))
print(np.round(bn.forward(np.array([[9.0]]), training=False).ravel(), 3))`,
      lines: [
        { code: "mean, var = X.mean(axis=0), X.var(axis=0)", say: "Per-feature statistics across the batch, during training." },
        { code: "self.run_mean = self.momentum * self.run_mean + (1 - self.momentum) * mean", say: "A running average that will stand in for the batch at inference." },
        { code: "mean, var = self.run_mean, self.run_var", say: "Inference mode: saved statistics, so one example's output is deterministic." },
        { code: "return self.gamma * x_hat + self.beta", say: "The learned scale and shift, so normalisation never limits what the layer can express." },
      ],
      output: "[-1.683  0.106  1.894  3.683]\n[11.516]",
      note: "The inference value uses running statistics after only one batch (mean 0.7, variance 1.4), hence the odd number; after many batches it converges to what the table shows.",
    },
    useIt: "Use batch normalisation after convolutions and dense layers in feedforward and convolutional networks trained with batches of 32 or more. Set the layer to inference mode when serving, and test that a single example's prediction does not depend on its batch. For small batches or sequence models, use layer normalisation instead.",
    takeaways: ["Standardise each feature across the batch, then rescale with learned γ and β.", "Stabilises every layer's input distribution: faster training, higher learning rates, deeper stacks.", "Keeps running statistics for inference; the mode switch is essential.", "Depends on batch size; sequence models prefer layer normalisation."],
    terms: [["batch normalisation", "normalising each feature across the mini-batch, then applying a learned scale and shift"], ["running statistics", "exponential averages of batch means and variances kept for inference"], ["γ and β", "the learned per-feature scale and shift after normalisation"]],
    reflect: { q: "If batch normalisation standardises a layer's outputs, why keep γ and β at all?", a: "Because mean 0 and variance 1 is not always the best input for the next layer; a ReLU might want a positive shift, a sigmoid a particular spread. γ and β let the network choose, and if the identity is best they can learn to undo the normalisation entirely." },
  },

  "m09-layer-normalisation": {
    simple: "Layer normalisation standardises each example across its own features instead of across the batch, so it works for any batch size and sequence length; it is the normalisation inside transformers.",
    concept:
      "**Layer normalisation** keeps the idea of batch normalisation (standardise, then rescale with learned γ and β) but changes what is averaged over. Instead of computing a feature's mean and variance across the examples in the batch, it computes, for one example, the mean and variance across all the features of that layer's output. Each example is normalised on its own.\n\nThat removes batch normalisation's weaknesses. There is no dependence on batch size: a batch of one works. There is no training/inference difference: the same computation runs in both modes, with no running statistics to save. And for sequences of varying length, where batch statistics are awkward (which positions of which sequences form a 'batch'?), normalising each position's vector on its own is natural.\n\nLayer normalisation is used in every transformer, usually once or twice per block, and in recurrent networks. Its sibling, RMS normalisation, drops the mean subtraction and divides by the root-mean-square alone; many recent language models use it for speed. Convolutional vision networks mostly keep batch normalisation, where its batch-level statistics help; everything sequential has moved to layer normalisation.",
    why:
      "Transformers process variable-length sequences, often one at a time at inference, and are trained on enormous models where batch statistics across devices are expensive to synchronise. Batch normalisation fits none of that. Layer normalisation gives the same stabilising effect (inputs to each sub-layer at a predictable scale, allowing deep stacks and high learning rates) with per-example computation. Without it, transformer training is far more fragile.",
    how: [
      "Take one example's vector of d features at the layer's output (for a sequence, one position's vector).",
      "Compute the mean μ and variance σ² over those d values.",
      "Normalise: x̂ = (x − μ) / √(σ² + ε).",
      "Rescale with learned per-feature γ and β: y = γ x̂ + β.",
      "Do exactly the same at inference; nothing is stored between batches.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Batch normalisation", points: ["statistics per feature, across the batch", "needs batches of ≥ 32; noisy below", "running statistics for inference; mode switch", "standard in convolutional nets"] },
      right: { title: "Layer normalisation", points: ["statistics per example, across its features", "batch size irrelevant; batch of 1 fine", "identical in training and inference", "standard in transformers and recurrent nets"] },
      caption: "The same normalise-then-rescale idea over a different axis. The axis decides where each is usable.",
    },
    everyday: {
      title: "Judging each essay against its own average sentence",
      text: "Batch normalisation is grading on the class curve: your mark depends on who else sat the test. Layer normalisation is judging each essay on its own: how each sentence compares with that essay's typical sentence. The second needs no classmates, gives the same verdict whenever it is applied, and suits essays of any length.",
    },
    engineering: {
      title: "Serving one request at a time",
      text: "A team ported a sequence model from batch normalisation to layer normalisation before deployment. With batch normalisation, serving single requests had meant using running statistics gathered during training on padded batches of 64, which did not match the distribution of real single requests, and accuracy dropped two points at serving time. With layer normalisation the model computed exactly the same thing in training and in production, for any batch size and any sequence length, and the gap vanished. The port also removed the mode-switch bug class from their code base entirely.",
    },
    maths: {
      formula: "μ = (1/d) Σⱼ xⱼ ;   σ² = (1/d) Σⱼ (xⱼ − μ)² ;   x̂ⱼ = (xⱼ − μ) / √(σ² + ε) ;   yⱼ = γⱼ x̂ⱼ + βⱼ   (RMSNorm: yⱼ = γⱼ xⱼ / √(mean(x²) + ε))",
      meaning: "Sums run over the d features of one example. γ and β have one entry per feature. RMSNorm skips μ and uses the root-mean-square.",
      worked: [
        "One example's layer output: x = (1, 3, 5, 7), d = 4. μ = 4; deviations (−3, −1, 1, 3); σ² = 20/4 = 5; σ ≈ 2.236.",
        "x̂ = (−1.342, −0.447, 0.447, 1.342). With γ = (1, 1, 1, 1), β = 0: y = x̂.",
        "A second example x = (10, 30, 50, 70): μ = 40, σ ≈ 22.36, x̂ = the same (−1.342, −0.447, 0.447, 1.342). Layer normalisation removes the overall scale of each example.",
        "RMSNorm on x = (1, 3, 5, 7): mean(x²) = (1 + 9 + 25 + 49)/4 = 21; rms ≈ 4.583; y = (0.218, 0.655, 1.091, 1.527). No centring, cheaper.",
      ],
    },
    code: {
      title: "Layer normalisation and RMS normalisation",
      lang: "py",
      src: `import numpy as np

def layer_norm(X, gamma, beta, eps=1e-5):          # X: examples × features
    mean = X.mean(axis=1, keepdims=True)
    var  = X.var(axis=1, keepdims=True)
    return gamma * (X - mean) / np.sqrt(var + eps) + beta

def rms_norm(X, gamma, eps=1e-5):
    rms = np.sqrt((X ** 2).mean(axis=1, keepdims=True) + eps)
    return gamma * X / rms

X = np.array([[1.0, 3.0, 5.0, 7.0], [10.0, 30.0, 50.0, 70.0]])
g, b = np.ones(4), np.zeros(4)
print(np.round(layer_norm(X, g, b), 3))
print(np.round(rms_norm(X[:1], g), 3))`,
      lines: [
        { code: "mean = X.mean(axis=1, keepdims=True)", say: "axis=1: across each example's features, not across the batch. This one argument is the whole difference from batch normalisation." },
        { code: "return gamma * (X - mean) / np.sqrt(var + eps) + beta", say: "Normalise, then the learned scale and shift, exactly as before." },
        { code: "rms = np.sqrt((X ** 2).mean(axis=1, keepdims=True) + eps)", say: "RMSNorm: no mean subtraction, just divide by the root-mean-square." },
        { code: "print(np.round(layer_norm(X, g, b), 3))", say: "Two examples differing only in scale normalise to identical rows." },
      ],
      output: "[[-1.342 -0.447  0.447  1.342]\n [-1.342 -0.447  0.447  1.342]]\n[[0.218 0.655 1.091 1.527]]",
    },
    useIt: "Use layer normalisation in transformers (it is already there), recurrent networks, and any model served one example at a time or trained with tiny batches. Prefer RMSNorm when following recent language-model designs. Keep batch normalisation for convolutional vision networks with healthy batch sizes.",
    takeaways: ["Layer normalisation standardises across an example's features; batch normalisation across the batch.", "Batch-size independent and identical in training and inference.", "The normalisation inside transformers and recurrent networks; RMSNorm is a cheaper variant.", "Choose by architecture: batch norm for conv nets, layer norm for sequences."],
    terms: [["layer normalisation", "normalising one example's features to mean 0 and variance 1, then rescaling"], ["RMSNorm", "layer normalisation without mean subtraction, dividing by the root-mean-square"]],
    reflect: { q: "Layer normalisation makes examples (1, 3, 5, 7) and (10, 30, 50, 70) identical. When could that be a loss of information?", a: "When the overall magnitude of the vector carries meaning, such as the intensity of a signal. The learned γ can only restore a fixed per-feature scale, not the per-example one. In practice, layers before the normalisation and the residual stream carry that information, which is one reason transformers normalise inside branches rather than on the main path." },
  },

  "m09-residual-connections": {
    simple: "A residual connection adds a block's input to its output, so each block learns only a correction and the signal and gradient always have a straight path through the network; it is what makes very deep networks trainable.",
    concept:
      "A **residual connection**, or skip connection, wires a layer's input straight to its output: instead of y = F(x), the block computes y = x + F(x). F, the layers inside the block, now learns the residual, the difference between the input and the desired output, rather than the whole output.\n\nTwo things follow. If the best thing a block can do is nothing, it only needs F(x) = 0, which is easy (small weights) rather than requiring F to learn the identity function, which is hard. So adding blocks can never make the network worse than without them, and deeper really is at least as good. And in the backward pass, the gradient through y = x + F(x) is 1 + F'(x): the '1' passes the gradient straight through, untouched by the block's weights and activations. A 100-block network has a direct path from the loss to every block, and vanishing gradients through the stack stop being a problem.\n\nResidual connections appeared in 2015 (ResNet) and immediately allowed 152-layer image networks. Every transformer block has two of them, around attention and around the feedforward sub-layer; the 'residual stream' running through a language model is the sum of every block's contribution so far. They combine with normalisation: normalise, apply F, add to the stream.",
    why:
      "Before residuals, a 56-layer plain network performed worse than a 20-layer one on both training and test data: not overfitting, but an inability to optimise. The extra 36 layers should have been able to learn the identity and do no harm, yet gradient descent could not find that solution. Residual connections make 'do no harm' the default and let gradients bypass any block. They turned depth from a liability into the main lever of progress.",
    how: [
      "Group a few layers (two convolutions, or attention plus feedforward) into a block F.",
      "Compute F(x) from the block's input x.",
      "Add: y = x + F(x). If shapes differ, project x with a small linear layer first so the addition is defined.",
      "Backward: the gradient on x is the gradient on y plus the gradient through F; the first term is the direct path.",
      "Stack many blocks; the running sum x + F₁ + F₂ + … is the residual stream that every block reads and writes.",
    ],
    visual: {
      kind: "flow",
      steps: ["x", "block F: norm → layer → activation → layer", "F(x)", "y = x + F(x)", "next block reads y"],
      caption: "The input skips around the block and is added back. The shortcut carries both the signal forward and the gradient backward.",
    },
    everyday: {
      title: "Editing a document instead of rewriting it",
      text: "Ask fifty editors in turn to improve a document. If each must rewrite it from scratch, a mediocre editor halfway down ruins it, and the last editor sees nothing of the original. If each may only mark corrections on the existing text, a mediocre editor just marks little, the good ones add value, and the original survives to the end. Residual blocks are editors who make corrections; the document is the residual stream.",
    },
    engineering: {
      title: "56 layers worse than 20, until the shortcut",
      text: "The original ResNet experiment is worth knowing in numbers. On the same image task, a plain 20-layer network reached 8.75% error; a plain 56-layer network, 10.6%: deeper was worse, in training error as well as test. Adding residual connections to the 56-layer network, with no other change, brought it to 6.97%, and 110 residual layers reached 6.4%. A team today building a deep model, whether for images or sequences, starts from residual blocks and never faces the plain-network collapse. When they prune blocks from a trained residual model for speed, accuracy degrades gracefully, because each block was only ever a correction.",
    },
    maths: {
      formula: "y = x + F(x) ;   ∂y/∂x = I + ∂F/∂x ;   through L blocks: ∂y_L/∂x₀ = Π (I + Fₗ') = I + Σ Fₗ' + …",
      meaning: "I is the identity. The product of (1 + small) factors expands to 1 plus a sum of terms; the leading 1 is the direct path, never multiplied by any block's Jacobian.",
      worked: [
        "Suppose each block's own derivative is F' = 0.1 (a small correction). Plain stack of 20 blocks, where only F' multiplies: 0.1²⁰ = 10⁻²⁰, vanished. Residual stack, where the factor is 1 + F' = 1.1: 1.1²⁰ ≈ 6.7, alive and of usable size.",
        "To keep the residual product near 1, blocks are normalised and initialised so F' is small, often with the last layer of each block initialised near zero: then 1 + F' ≈ 1 and the product over 100 blocks stays near 1.",
        "Identity is free: if F's weights are zero, y = x exactly. A plain block would need its weights to form an identity matrix to achieve the same, which random initialisation is nowhere near.",
        "Transformer block: y₁ = x + Attention(LN(x)); y₂ = y₁ + FFN(LN(y₁)). Two residual additions per block; a 32-block model has 64 contributions summed into the stream.",
      ],
      note: "Keep the two quantities apart: F' is the block's own derivative, and 1 + F' is the residual block's total factor. Mixing them up is a common slip.",
    },
    code: {
      title: "Gradient through plain and residual stacks",
      lang: "py",
      src: `import numpy as np
np.random.seed(2)

def block_jacobian(d, scale):
    return np.random.randn(d, d) * scale / np.sqrt(d)   # a small random Jacobian F'

d, depth = 32, 40
plain = np.eye(d)
resid = np.eye(d)
for _ in range(depth):
    J = block_jacobian(d, 0.5)
    plain = J @ plain                   # y = F(x): gradient multiplies by F' alone
    resid = (np.eye(d) + J) @ resid     # y = x + F(x): gradient multiplies by I + F'

g = np.ones(d)
print("plain    gradient norm after 40 blocks:", np.linalg.norm(plain @ g).round(6))
print("residual gradient norm after 40 blocks:", np.linalg.norm(resid @ g).round(3))`,
      lines: [
        { code: "plain = J @ plain                   # y = F(x): gradient multiplies by F' alone", say: "Forty small Jacobians multiplied together: the gradient vanishes." },
        { code: "resid = (np.eye(d) + J) @ resid     # y = x + F(x): gradient multiplies by I + F'", say: "The identity is added before each multiplication: the direct path survives." },
        { code: "print(\"residual gradient norm after 40 blocks:\", np.linalg.norm(resid @ g).round(3))", say: "Same blocks, same depth; the residual stack passes a gradient of sensible size." },
      ],
      output: "plain    gradient norm after 40 blocks: 1e-06\nresidual gradient norm after 40 blocks: 17.164",
      note: "Exact numbers depend on the random seed; the contrast between a vanished gradient and a usable one does not.",
    },
    useIt: "Build any network deeper than a handful of layers from residual blocks: normalise, transform, add. Use a projection on the shortcut when shapes change. In transformers, treat the residual stream as the model's working memory that each block edits. When pruning or analysing a deep model, reason block by block, since each is a separable correction.",
    takeaways: ["Residual: y = x + F(x); the block learns a correction, not the whole mapping.", "The identity path carries signal forward and gradient backward unchanged, through any depth.", "Extra blocks can never hurt at initialisation, so depth becomes safe.", "Every transformer block has two residual connections; the residual stream is their running sum."],
    terms: [["residual connection", "adding a block's input to its output: y = x + F(x)"], ["residual stream", "the running sum passing through a stack of residual blocks"], ["Jacobian", "the matrix of all partial derivatives of a vector output with respect to a vector input"]],
    reflect: { q: "If residual connections let gradients bypass blocks, could a network learn to ignore all its blocks and just pass the input through?", a: "It could at initialisation, which is the point: doing nothing is the safe starting state. Training then adds corrections wherever they reduce the loss. A trained residual network uses its blocks heavily; the shortcut is a floor on how bad things can get, not a ceiling on how good." },
  },

  "m09-regularisation": {
    simple: "Regularisation is any technique that makes a model generalise better at some cost to fitting the training data: weight decay, dropout, early stopping, data augmentation and more.",
    concept:
      "Module 4 defined overfitting: training loss falls while validation loss rises, because the model memorises specifics of the training examples. **Regularisation** is the family of techniques that fight it, by limiting or discouraging the complexity a model can use to memorise. Every regulariser trades a little training fit for better performance on unseen data.\n\nThe common ones. **Weight decay** (L2 regularisation) adds a penalty proportional to the squared weights to the loss, so the optimiser prefers small weights and smoother functions. **Dropout** (lesson 9.7) randomly disables neurons. **Early stopping** halts training when validation loss stops improving. **Data augmentation** creates extra training examples by transforming real ones (flipping and cropping images, adding noise to audio), so the model sees more variety than it can memorise. **Label smoothing** softens the targets so the model is not pushed to absolute certainty. And the simplest regulariser of all is a smaller model.\n\nThey stack: a typical image model uses weight decay, dropout in the head, augmentation and early stopping together. The right amount is found by validation, never by training loss, which regularisation always makes worse.",
    why:
      "Deep networks have far more parameters than the examples they train on, so without constraints they can fit the training set perfectly, noise included, and generalise poorly. Regularisation is how the capacity of a large model is pointed at patterns that transfer rather than at details that do not. It is also the most common tuning lever after the learning rate: a model that overfits is usually fixed by more regularisation, not by a different architecture.",
    how: [
      "Diagnose: plot training and validation loss. A widening gap means overfitting; regularise more. Both high means underfitting; regularise less or enlarge the model.",
      "Add weight decay: loss' = loss + λ Σ w²; λ around 10⁻⁴ to 10⁻², tuned by validation.",
      "Add dropout after large layers; augment the data where realistic transformations exist.",
      "Train with early stopping on validation loss; keep the best checkpoint.",
      "Compare configurations by validation metric only; accept that training loss rises.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Regulariser", "What it does", "Cost", "Typical setting"],
        rows: [
          ["weight decay (L2)", "penalises large weights; smoother functions", "slightly higher training loss", "λ = 10⁻⁴ to 10⁻²"],
          ["dropout", "random neuron removal in training", "slower convergence", "keep 0.5–0.9"],
          ["early stopping", "stops before memorisation sets in", "needs a validation set", "patience 3–10 epochs"],
          ["data augmentation", "more varied training examples", "more compute per epoch", "flips, crops, noise, masking"],
          ["label smoothing", "targets 0.9/0.1 instead of 1/0", "slightly less confident outputs", "ε = 0.1"],
          ["smaller model", "less capacity to memorise", "may underfit", "halve width or depth"],
        ],
      },
      caption: "Six ways to make a model generalise. Most production models use three or four at once.",
    },
    everyday: {
      title: "Studying to understand rather than to memorise",
      text: "A student who memorises last year's exam answers word for word does brilliantly on last year's paper and badly on this year's. A student who practises varied problems (augmentation), is told not to obsess over any single example (dropout), keeps their notes concise (weight decay) and stops cramming when mock results stop improving (early stopping) does slightly worse on last year's paper and much better on this year's. Regularisation is studying for the exam you have not seen.",
    },
    engineering: {
      title: "Three regularisers on a medical-image model",
      text: "A team training a chest-X-ray classifier on 12,000 labelled images watched validation loss bottom out at epoch 7 and climb while training loss kept falling. They added, one at a time and measured each: weight decay 10⁻⁴ (validation AUC 0.84 → 0.86), dropout keep 0.7 before the output (→ 0.88), and augmentation with small rotations, crops and brightness changes (→ 0.91), with early stopping throughout. Each step raised training loss and lowered validation loss. The final model generalised to a second hospital's images at 0.89, where the unregularised one had scored 0.79.",
    },
    maths: {
      formula: "L_reg = L + λ Σ w² ;   ∂L_reg/∂w = ∂L/∂w + 2λw ;   update: w ← w(1 − 2ηλ) − η ∂L/∂w",
      meaning: "λ sets the penalty strength; η is the learning rate. The gradient of the penalty is proportional to the weight, so each step shrinks every weight by a factor before the usual update: hence 'weight decay'.",
      worked: [
        "A weight w = 0.8, λ = 0.01, η = 0.1, data gradient ∂L/∂w = 0.2.",
        "Penalty gradient: 2 × 0.01 × 0.8 = 0.016. Total gradient 0.216.",
        "Update: w ← 0.8 − 0.1 × 0.216 = 0.7784. Equivalently, decay factor 1 − 2 × 0.1 × 0.01 = 0.998: 0.8 × 0.998 − 0.02 = 0.7784.",
        "A weight with zero data gradient decays by 0.2% per step; after 1,000 steps it is 0.8 × 0.998¹⁰⁰⁰ ≈ 0.108. Weights the data does not need fade away.",
        "Label smoothing with ε = 0.1 on 10 classes: the true class target becomes 0.9 + 0.01 = 0.91 and each other class 0.01, so the model is never rewarded for pushing a logit to infinity.",
      ],
    },
    code: {
      title: "Weight decay inside the update",
      lang: "py",
      src: `import numpy as np

def sgd_step(w, grad, lr=0.1, weight_decay=0.01):
    return w - lr * (grad + 2 * weight_decay * w)

w = 0.8
print(round(sgd_step(w, grad=0.2), 4))            # 0.7784

# a weight the data never pushes on fades away
w = 0.8
for _ in range(1000):
    w = sgd_step(w, grad=0.0)
print(round(w, 4))                                 # ≈ 0.108`,
      lines: [
        { code: "return w - lr * (grad + 2 * weight_decay * w)", say: "The data gradient plus the penalty's gradient, 2λw, in one step." },
        { code: "print(round(sgd_step(w, grad=0.2), 4))            # 0.7784", say: "Matches the worked example." },
        { code: "w = sgd_step(w, grad=0.0)", say: "With no data gradient, only the decay acts; the weight shrinks a little every step." },
      ],
      output: "0.7784\n0.108",
      note: "Adam-style optimisers apply decay slightly differently (AdamW, Module 5); the effect is the same.",
    },
    useIt: "Apply regularisation whenever validation loss diverges from training loss: weight decay almost always, dropout in large dense layers and transformer blocks, augmentation whenever label-preserving transformations exist, early stopping always. Tune strength by validation. If both losses are high, you are underfitting and should regularise less.",
    takeaways: ["Regularisation trades training fit for generalisation.", "Weight decay, dropout, early stopping, augmentation, label smoothing and smaller models are the main tools; they stack.", "Diagnose by the gap between training and validation loss; tune by validation only.", "Training loss going up under regularisation is expected, not a problem."],
    terms: [["regularisation", "techniques that improve generalisation by constraining or perturbing the model during training"], ["weight decay (L2)", "a penalty on squared weights that shrinks every weight each step"], ["data augmentation", "creating extra training examples by transforming real ones"], ["label smoothing", "replacing hard 0/1 targets with slightly softened ones"]],
    reflect: { q: "Why is a bigger dataset the best regulariser of all?", a: "Because every regulariser is a substitute for information the model lacks: more real examples constrain the model directly, with no handicap and no tuning. Augmentation is the attempt to manufacture that information when collecting more data is impossible." },
  },

  "m09-epochs-batches-and-iterations": {
    simple: "An iteration is one update on one mini-batch; an epoch is one pass over the whole training set; the batch size links them and trades gradient noise, memory and speed.",
    concept:
      "Three words describe how training is counted. A **mini-batch** is the group of examples processed together in one step. An **iteration** is one such step: forward pass on the batch, loss, backward pass, parameter update. An **epoch** is one complete pass over the training set, so the number of iterations per epoch is the training-set size divided by the batch size.\n\nThe batch size is a hyperparameter with real consequences. Small batches (8, 16, 32) give noisy gradient estimates, which means more iterations per epoch, more updates, and a regularising jitter that often helps generalisation; they also use little memory. Large batches (256, 1,024 and up) give smoother, more accurate gradients, fewer updates per epoch, better hardware utilisation, and need a larger learning rate to make the same progress; past a point they generalise slightly worse and need special scheduling. Memory for stored activations (lesson 8.7) scales with batch size, which often sets the practical maximum.\n\nTraining length is set in epochs or total iterations, with early stopping deciding the actual end. Learning-rate schedules are usually expressed per iteration or per epoch: a warm-up over the first few hundred iterations, then a decay across the planned epochs.",
    why:
      "Every training log, every paper and every framework setting speaks in these units, and the batch size interacts with the learning rate, the memory budget and the quality of the result. Misreading them leads to concrete mistakes: comparing two runs by epochs when their batch sizes differ, setting a learning rate tuned for batch 32 on batch 512, or planning compute without knowing iterations per epoch.",
    how: [
      "Choose a batch size B that fits memory, typically 32 to 256 for most models, larger for pretraining.",
      "Iterations per epoch = ceil(N / B) for a training set of N examples.",
      "Each iteration: sample the next B examples (shuffled each epoch), forward, loss, backward, update.",
      "After each epoch, validate, log, checkpoint, and step the learning-rate schedule.",
      "Train for a planned number of epochs or iterations, stopping early if validation stalls.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Batch size", "Iterations per epoch (N = 60,000)", "Gradient noise", "Memory for activations", "Updates in 10 epochs"],
        rows: [
          ["16", "3,750", "high", "small", "37,500"],
          ["64", "938", "moderate", "moderate", "9,380"],
          ["256", "235", "low", "large", "2,350"],
          ["1,024", "59", "very low", "very large", "590"],
        ],
      },
      caption: "Same data, same epochs, very different numbers of updates. Batch size changes what an epoch means.",
    },
    everyday: {
      title: "Reading a textbook: pages, sessions and re-reads",
      text: "You read a textbook in study sessions. A session covers a chunk of pages (a batch), after which you update your notes (an iteration). Finishing the whole book once is an epoch; most people need a few. Tiny sessions mean many note updates but each based on little; huge sessions mean few updates, each well-founded but rare. Neither is wrong; it is a trade-off, and the book is the same either way.",
    },
    engineering: {
      title: "Two runs, 'same number of epochs', very different results",
      text: "Two engineers compared models trained for 20 epochs and could not explain why one was far better. One had used batch 32 (37,500 updates), the other batch 512 (2,340 updates) with the same learning rate. The second had simply not taken enough steps, and its larger batches needed a higher learning rate to compensate. Re-running the batch-512 model with a learning rate scaled up and a warm-up matched the first. Their team now reports runs in total iterations and effective batch size, and uses the linear scaling rule (learning rate proportional to batch size, within limits) as the starting point.",
    },
    maths: {
      formula: "iterations per epoch = ⌈N / B⌉ ;   total iterations = epochs × ⌈N / B⌉ ;   gradient noise ∝ 1/√B ;   linear scaling: η_B ≈ η_32 × B/32",
      meaning: "N examples, batch size B. The mini-batch gradient's standard error falls with the square root of B. The linear scaling rule adjusts the learning rate η when the batch changes.",
      worked: [
        "N = 60,000, B = 64: ⌈60,000/64⌉ = 938 iterations per epoch; 20 epochs = 18,760 updates.",
        "B = 512: 118 iterations per epoch; 20 epochs = 2,360 updates, eight times fewer.",
        "Noise: batch 512 gradients are √(512/64) ≈ 2.8 times less noisy than batch 64 gradients.",
        "Linear scaling: a learning rate of 0.05 at batch 32 suggests about 0.05 × 512/32 = 0.8 at batch 512, usually with a warm-up of a few hundred iterations and a cap where the rule breaks down.",
        "Memory: activations of 24 layers × 1,024 width × 4 bytes × 2 tensors ≈ 196 KB per example; batch 512 needs ≈ 100 MB for activations alone, batch 4,096 about 800 MB, before weights, gradients and optimiser state.",
      ],
    },
    code: {
      title: "Epochs, batches and iterations in a loop",
      lang: "py",
      src: `import math
import numpy as np

N, B, epochs = 60000, 64, 3
iters_per_epoch = math.ceil(N / B)
step = 0
for epoch in range(epochs):
    order = np.random.permutation(N)                 # new shuffle each epoch
    for i in range(0, N, B):
        batch_idx = order[i:i + B]                   # the last batch may be smaller
        step += 1                                    # one iteration = one update
        # forward, loss, backward, update on batch_idx
    print(f"epoch {epoch}: {iters_per_epoch} iterations, {step} updates so far")`,
      lines: [
        { code: "iters_per_epoch = math.ceil(N / B)", say: "60,000 examples in batches of 64: 938 iterations, the last one with 32 examples." },
        { code: "order = np.random.permutation(N)                 # new shuffle each epoch", say: "Every epoch sees different batch compositions, which keeps gradient noise from repeating." },
        { code: "step += 1                                    # one iteration = one update", say: "The quantity learning-rate schedules and compute budgets actually count." },
      ],
      output: "epoch 0: 938 iterations, 938 updates so far\nepoch 1: 938 iterations, 1876 updates so far\nepoch 2: 938 iterations, 2814 updates so far",
    },
    useIt: "Set batch size by memory and task, then set the learning rate for that batch size; report runs in iterations and effective batch size, not epochs alone; schedule learning rate by iteration with a warm-up; and when scaling batch size up for throughput, scale the learning rate and verify on validation. Module 20 revisits these at pretraining scale.",
    takeaways: ["Iteration = one mini-batch update; epoch = one pass over the data; iterations per epoch = N/B.", "Small batches: noisy gradients, many updates, low memory. Large: smooth gradients, few updates, high memory, need larger learning rates.", "Compare runs by iterations and batch size, not epochs alone.", "Shuffle each epoch; schedule by iteration; stop early by validation."],
    terms: [["mini-batch", "the group of examples processed in one training step"], ["iteration", "one forward-backward-update step"], ["epoch", "one full pass over the training set"], ["linear scaling rule", "increasing the learning rate in proportion to the batch size"]],
    reflect: { q: "Why might a model trained with batch 16 generalise slightly better than the same model trained with batch 1,024, even with learning rates tuned for each?", a: "The noise in small-batch gradients acts as a regulariser: it keeps the optimiser from settling into sharp minima that fit the training set tightly and tends toward flatter ones that transfer better. Large batches follow the exact gradient more faithfully and can find sharper, less general solutions." },
  },
};

export const M09_QUIZ: Quiz[] = [
  {
    q: "A 12-layer sigmoid network trains, but its first six layers never change from initialisation. What is happening?",
    options: ["Exploding gradients", "Vanishing gradients: sigmoid derivatives (≤ 0.25) multiply to nearly zero by the early layers", "Overfitting", "The batch size is too large"],
    answer: 1,
    why: ["Exploding gradients produce NaN, not frozen layers.", "Correct. The gradient reaching early layers is a product of many small factors.", "Overfitting shows as a train/validation gap, not frozen layers.", "Batch size does not freeze layers."],
    reason: true,
  },
  {
    q: "Training runs smoothly, then the loss spikes and prints NaN. Which single change would most likely have prevented the crash?",
    options: ["More dropout", "Gradient clipping by global norm", "A larger batch size", "Xavier instead of He initialisation"],
    answer: 1,
    why: ["Dropout regularises; it does not cap gradient size.", "Correct. Clipping keeps a sudden large gradient from blowing up the weights.", "Batch size does not bound gradients.", "Initialisation acts at the start, not mid-run."],
  },
  {
    q: "Why does He initialisation use variance 2/fan-in rather than Xavier's 2/(fan-in + fan-out)?",
    options: ["He is for wider layers", "ReLU zeroes half its inputs, halving the variance, so the weights start with double the variance to compensate", "Xavier is deprecated", "He uses a uniform distribution"],
    answer: 1,
    why: ["Width is not the issue.", "Correct. The factor of 2 exactly cancels ReLU's halving at every layer.", "Xavier remains right for tanh, sigmoid and linear layers.", "Either distribution can be used for either scheme."],
  },
  {
    q: "A model with dropout (keep 0.5) has training loss 0.30 and validation loss 0.28. Is something wrong?",
    options: ["Yes, validation should never beat training", "No: dropout handicaps the network during training, so training loss is inflated; the full network at inference does better", "Yes, the dropout rate is too low", "Yes, the data is leaking"],
    answer: 1,
    why: ["With dropout it is common and expected.", "Correct. Training loss is measured on a randomly thinned network.", "The rate is irrelevant to this effect.", "Leakage would show as suspiciously good validation, not a small inversion like this."],
    reason: true,
  },
  {
    q: "Which normalisation should a transformer use, and why?",
    options: ["Batch normalisation, because batches are large", "Layer normalisation, because it is independent of batch size and sequence length and identical in training and inference", "No normalisation; residual connections suffice", "Dropout"],
    answer: 1,
    why: ["Batch statistics are awkward for variable-length sequences and single-example inference.", "Correct. Per-example normalisation suits sequences and serving.", "Residuals help gradients but do not control activation scale.", "Dropout is a regulariser, not a normaliser."],
  },
  {
    q: "A plain 56-layer network trains worse than a 20-layer one. Residual connections fix this because:",
    options: ["They add parameters", "Each block learns only a correction and the identity path carries signal and gradient through any depth", "They reduce the learning rate", "They remove the need for activations"],
    answer: 1,
    why: ["Residual connections add no parameters (unless a projection is needed).", "Correct. Doing nothing is the default, and the gradient has a direct route.", "No.", "Blocks still contain activations."],
  },
  {
    q: "Training and validation losses are both high and flat. What should you NOT do?",
    options: ["Increase model capacity", "Check initialisation and learning rate", "Add more regularisation", "Train longer with a schedule"],
    answer: 2,
    why: ["Underfitting may need capacity.", "A dead or stalled run often traces to these.", "Correct. Both losses high means underfitting; regularisation makes fitting harder, not easier.", "Sometimes the run simply needs more steps."],
  },
  {
    q: "Two runs train for 20 epochs on 60,000 examples: one at batch 32, one at batch 1,024 with the same learning rate. Why is the second likely worse?",
    options: ["Large batches overfit", "It takes 32 times fewer updates and its learning rate was not scaled up to compensate", "1,024 does not divide 60,000", "Large batches cause vanishing gradients"],
    answer: 1,
    why: ["Possibly a little, but not the main effect here.", "Correct. Epochs are not updates; the large-batch run barely moved.", "A partial final batch is harmless.", "Batch size does not affect gradient flow through layers."],
  },
];

export const M09_EXERCISES: Exercise[] = [
  {
    title: "Vanish or explode?",
    kind: "calculate",
    task: "A 30-layer network has, at every layer, an activation derivative of 0.9 and a weight factor of 1.2 on the backward gradient. Compute the gradient reaching layer 1 relative to the output. Then compute it if the weight factor is 1.0, and if it is 0.8. State which case needs clipping and which needs re-initialisation.",
    hints: ["Per-layer factor = derivative × weight factor; raise it to the 29th power.", "1.08²⁹ and 0.72²⁹ are the extremes."],
    solution: "Factor 0.9 × 1.2 = 1.08; 1.08²⁹ ≈ 9.3: gradients grow about ninefold, borderline exploding; clipping and a smaller learning rate help, better initialisation fixes it. Factor 0.9 × 1.0 = 0.9; 0.9²⁹ ≈ 0.047: shrinking to 5%, mild vanishing. Factor 0.9 × 0.8 = 0.72; 0.72²⁹ ≈ 7 × 10⁻⁵: vanished; the early layers will not train. That case needs re-initialisation at the right scale (He for ReLU), residual connections and normalisation, not clipping.",
  },
  {
    title: "Initialise a four-layer network correctly",
    kind: "code",
    task: "Write NumPy code that builds weight matrices for a network 784 → 512 → 256 → 128 → 10 with ReLU hidden layers and a softmax output, using He initialisation for the ReLU layers and Xavier for the output. Push a batch of 1,000 standardised inputs through (ReLU after each hidden layer) and print the standard deviation of activations after each layer. Then repeat with every weight drawn with std 0.01 and compare.",
    hints: ["He std = √(2/fan_in); Xavier std = √(2/(fan_in + fan_out)).", "Post-ReLU std should sit near 0.58 at every hidden layer with He."],
    solution: "sizes = [784, 512, 256, 128, 10]; for the three hidden layers W = randn(out, in) * sqrt(2/in); for the output W = randn(10, 128) * sqrt(2/(128+10)). With He the post-ReLU stds are all about 0.58 and the output logits have std near 1. With std 0.01 everywhere the activations shrink by roughly a factor of 0.01·√(in)/√2 per layer: about 0.2, 0.07, 0.01, and the logits are around 10⁻⁴, so the softmax is uniform and gradients are negligible: a dead network before training starts.",
  },
  {
    title: "Batch versus layer normalisation by hand",
    kind: "calculate",
    task: "A layer outputs, for a batch of 3 examples with 2 features, the matrix [[2, 10], [4, 20], [6, 30]]. Compute the batch-normalised output (per feature across examples) and the layer-normalised output (per example across features), with γ = 1, β = 0, ε = 0. Explain in one sentence why the layer-normalised rows are identical.",
    hints: ["Batch norm: standardise each column.", "Layer norm: standardise each row."],
    solution: "Batch norm: column 1 has mean 4, std √(8/3) ≈ 1.633 → (−1.225, 0, 1.225); column 2 has mean 20, std 8.165 → (−1.225, 0, 1.225). Output [[−1.225, −1.225], [0, 0], [1.225, 1.225]]. Layer norm: each row (a, 5a) has mean 3a and std 2a → (−1, 1) for every row. Output [[−1, 1], [−1, 1], [−1, 1]]. The rows are identical because every example is a scaled copy of (1, 5) and layer normalisation removes each example's own scale.",
  },
  {
    title: "Design the regularisation plan",
    kind: "think",
    task: "A product-image classifier (8 classes, 15,000 images, a 40-layer convolutional network) reaches training accuracy 99.8% and validation accuracy 81% after 30 epochs. Propose a plan of four changes in the order you would apply them, say what you expect each to do to training and validation accuracy, and name the one metric you would use to decide whether to keep each.",
    hints: ["Cheapest and most reliable first.", "Augmentation is powerful for images.", "Training accuracy is expected to fall."],
    solution: "1. Early stopping on validation loss with patience 5: no new capacity, stops the late memorisation; training accuracy falls slightly, validation rises a little. 2. Data augmentation (random crops, flips, colour jitter): the biggest expected gain for images; training accuracy drops noticeably (harder examples), validation rises several points. 3. Weight decay 10⁻⁴ (or AdamW): smoother weights; small validation gain. 4. Dropout keep 0.7 before the final dense layer: further narrows the gap. Decide each by validation accuracy (or loss) on a fixed held-out set; never by training accuracy, which every step will lower. If validation plateaus well below the target after all four, consider a smaller or pre-trained network and more data.",
  },
];
