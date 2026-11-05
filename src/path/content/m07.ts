import type { Exercise, LessonBody, Quiz } from "../types";

// Module 7: Activation functions. One concept per lesson.
// Keys are lesson slugs: m07-<kebab of the concept title in map.ts>.

export const M07_BODIES: Record<string, LessonBody> = {
  "m07-activation-functions": {
    simple: "Activation functions are the small fixed curves between layers; there are only a handful in common use, and each has a shape, a range and a derivative that decide where it fits.",
    concept:
      "Module 6 showed that a neuron needs a non-linear step after its weighted sum. This module is about the menu of **activation functions** engineers actually choose from. There are fewer than ten that matter, and they fall into three families.\n\nSquashing curves, sigmoid and tanh, take any number and compress it into a fixed range: 0 to 1, or −1 to 1. They are smooth and were the standard for decades. Rectifiers, ReLU and its relatives (leaky ReLU, GELU), pass positive values through and suppress negatives; they are cheap and train deep networks well, and they dominate hidden layers today. Normalising functions, softmax above all, act on a whole vector at once and turn scores into probabilities that sum to 1; they live at the output of classifiers.\n\nEach function is described by three things: its shape, its output range, and its derivative. The shape decides what the output means; the range decides what the next layer receives; the derivative decides how much gradient flows backwards during training, which is the property that separates the ones that work in deep networks from the ones that do not.",
    why:
      "If any non-linear bend would do, why a whole module? Because the choice changes whether a deep network trains at all. Sigmoid's derivative is at most 0.25 and shrinks toward zero away from the middle; stack ten sigmoid layers and the gradient reaching the first layer is multiplied by ten tiny numbers. ReLU's derivative is exactly 1 for positive inputs, so gradients pass through unchanged. The switch from sigmoid to ReLU around 2011 is one of the handful of changes that made deep learning practical.\n\nThe output layer is a separate decision: there the function must produce the kind of number the task needs, a probability, a set of probabilities, or an unbounded value.",
    how: [
      "Decide the layer's role: hidden (feature building) or output (producing the prediction).",
      "For hidden layers, pick from the rectifier family; ReLU is the default, GELU in transformers, leaky ReLU when dead neurons appear.",
      "For the output, pick by task: sigmoid for one yes/no probability, softmax for one-of-many classes, none (linear) for regression.",
      "Check the derivative along the path gradients take: flat regions (sigmoid's tails, ReLU's negative side) block learning there.",
      "Confirm by experiment: training speed and validation accuracy, not intuition, settle close calls.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Function", "Family", "Range", "Derivative (max)", "Typical place"],
        rows: [
          ["sigmoid", "squashing", "(0, 1)", "0.25 at z = 0", "binary output"],
          ["tanh", "squashing", "(−1, 1)", "1 at z = 0", "recurrent nets, some hidden layers"],
          ["ReLU", "rectifier", "[0, ∞)", "1 for z > 0, 0 for z < 0", "hidden layers (default)"],
          ["leaky ReLU", "rectifier", "(−∞, ∞)", "1 or a small slope", "hidden layers, when ReLUs die"],
          ["GELU", "rectifier (smooth)", "≈ [−0.17, ∞)", "≈ 1 for large z", "transformers"],
          ["softmax", "normalising", "each in (0, 1), sum 1", "depends on all entries", "multi-class output"],
          ["linear", "none", "(−∞, ∞)", "1", "regression output"],
        ],
      },
      caption: "Three families, seven functions. The derivative column is why ReLU-style functions won the hidden layers.",
    },
    everyday: {
      title: "Three ways to answer 'how sure are you?'",
      text: "Ask three people the same question. One always answers with a percentage, never 0 or 100 (sigmoid). One answers from 'strongly no' to 'strongly yes' through 'neutral' (tanh). One says nothing at all unless they are positive, and then says exactly how positive (ReLU). None is wrong; each is the right person for a different job, and you would not put the silent one in charge of giving odds.",
    },
    engineering: {
      title: "The activation audit",
      text: "An image-classification team inherits a model with tanh in all twelve hidden layers and a sigmoid output for ten classes. Their audit changes two things. Hidden layers move to ReLU: training to the same accuracy takes a third of the time because gradients reach the early layers. The output moves to softmax: the ten sigmoid outputs had been summing to 1.7 on some images, so 'the most likely class' was ambiguous; softmax makes them a proper distribution. Two configuration lines, each justified by a property in the table above.",
    },
    useIt: "You will pick an activation every time you define a layer. The rule of thumb covers 95% of cases: ReLU (or GELU in transformers) inside, task-matched function at the output. The remaining lessons in this module give you the reasons, so that when the rule of thumb fails you know which property to change.",
    takeaways: ["Three families: squashing (sigmoid, tanh), rectifiers (ReLU, leaky ReLU, GELU), normalising (softmax).", "Shape gives meaning, range feeds the next layer, derivative decides trainability.", "Hidden layers: rectifiers. Output: match the task.", "Sigmoid to ReLU in hidden layers was one of the changes that made deep learning work."],
    terms: [["squashing function", "an activation that compresses any input into a fixed range"], ["rectifier", "an activation that passes positives and suppresses negatives, like ReLU"], ["derivative of an activation", "its slope, which scales the gradient passing back through the neuron"]],
    reflect: { q: "Why is the derivative, not the shape, the property that decides which activation goes in hidden layers?", a: "Because hidden layers are trained through the chain rule: the gradient reaching a layer is a product of the derivatives of every activation after it. Shapes that look similar can have derivatives that differ a hundredfold once multiplied through ten layers." },
  },

  "m07-why-non-linear-functions-are-necessary": {
    simple: "Only non-linear activations let a network represent curves and interactions; with linear ones, any depth equals a single straight-line model.",
    concept:
      "A function is **linear** when scaling its input scales its output in proportion and adding inputs adds outputs: f(2x) = 2f(x) and f(x + y) = f(x) + f(y). Multiplying by a matrix and adding a constant is linear (strictly, affine, but the point is the same). Lesson 6.8 showed what follows: linear functions compose into linear functions, so a stack of linear layers is one linear layer.\n\nThe consequence for what a network can represent is severe. A linear model draws one flat boundary and makes every input contribute independently. It cannot say 'this matters only when that is also true'. It cannot bend a boundary around a cluster. It cannot approximate a sine wave or an image's edge structure.\n\nA **non-linear** activation breaks the proportionality. ReLU's output is not proportional to its input (double a negative z and the output stays zero). Because of that, a layer of ReLU neurons can carve the input space into regions with different linear rules in each, and the next layer can combine regions. With enough neurons, two layers with one non-linearity can approximate any reasonable continuous function. That result is the universal approximation theorem, and it only holds because of the activation.",
    why:
      "Real relationships are rarely proportional. House prices do not rise forever with size; fraud risk depends on amount and device together; a pixel's meaning depends on its neighbours. Interactions and curves are the norm. Non-linear activations are the mechanism that lets a model built from simple weighted sums express them.\n\nUnderstanding this precisely also tells you what non-linearity does not buy: it is not 'intelligence' or 'understanding'; it is the ability to bend. Everything else still comes from data and training.",
    how: [
      "Each ReLU neuron splits its input space with a flat boundary: on one side it outputs zero, on the other a linear function.",
      "A layer of n such neurons splits the space into many regions, each a different combination of which neurons are on.",
      "The next layer takes a weighted sum of those outputs: within each region that is linear, but the rules differ between regions.",
      "The result is a piecewise-linear function: flat facets that together approximate a curve, like a polygon approximating a circle.",
      "More neurons mean more facets and a closer approximation; more layers let facets be combined into facets of facets.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Linear model", points: ["one flat boundary", "each input acts independently", "cannot fit y = x², XOR, or a circle", "depth adds nothing"] },
      right: { title: "One hidden layer with ReLU", points: ["many flat pieces joined at bends", "inputs can interact through shared neurons", "fits curves and enclosed regions to any precision with enough neurons", "depth composes pieces into richer pieces"] },
      caption: "The bend is the whole difference.",
    },
    everyday: {
      title: "A straight fence and a hedge",
      text: "You want to keep sheep in a field with a pond in the middle. A single straight fence, however long, cannot separate the pond from the grass. A hedge that can turn corners can go round it. A linear model is the straight fence; the activation gives the fence corners.",
    },
    engineering: {
      title: "Fitting a demand curve",
      text: "A retailer's demand forecaster predicts units sold from price and day. Demand falls as price rises, but not in a straight line: it collapses at a psychological threshold and flattens at the low end. A linear model fits a slope and misses both ends by 30%. A network with eight ReLU neurons in one hidden layer fits the curve as a handful of straight segments with bends near the threshold, cutting error by half. Nobody told it where the threshold was; the bends landed there because the data pulled them there.",
    },
    maths: {
      formula: "ReLU pieces: f(x) = Σᵢ vᵢ · max(0, wᵢx + bᵢ)  approximates any continuous curve on an interval",
      meaning: "Each term is a 'hinge' that is zero until x passes −bᵢ/wᵢ and then rises with slope vᵢwᵢ. Adding hinges builds a piecewise-linear curve.",
      worked: [
        "Target: y = x² on [0, 2]. Use three hinges at 0, 1 and 1.5.",
        "f(x) = 1.0·max(0, x) + 2.0·max(0, x − 1) + 2.0·max(0, x − 1.5). Slopes: 1 on [0,1], 3 on [1,1.5], 5 beyond.",
        "f(0.5) = 0.5 (true 0.25); f(1) = 1 (true 1); f(1.5) = 1.5 + 1.0 = 2.5 (true 2.25); f(2) = 2 + 2 + 1 = 5 (true 4).",
        "Rough with three hinges; with twenty hinges the error falls below 0.01. Training would place the hinges and slopes automatically.",
      ],
      note: "A linear model fits y = x² on this interval with a single slope and is off by up to 1 whatever slope it picks.",
    },
    code: {
      title: "Three hinges approximate a curve",
      lang: "py",
      src: `import numpy as np

def hinge(x, knot, slope):
    return slope * np.maximum(0.0, x - knot)

xs = np.linspace(0, 2, 5)
approx = hinge(xs, 0.0, 1.0) + hinge(xs, 1.0, 2.0) + hinge(xs, 1.5, 2.0)
print(np.round(xs ** 2, 2))      # true
print(np.round(approx, 2))       # three ReLU pieces`,
      lines: [
        { code: "return slope * np.maximum(0.0, x - knot)", say: "One ReLU neuron seen as a hinge: zero until x passes the knot, then a straight slope." },
        { code: "approx = hinge(xs, 0.0, 1.0) + hinge(xs, 1.0, 2.0) + hinge(xs, 1.5, 2.0)", say: "A weighted sum of three hinges, which is exactly a one-hidden-layer ReLU network with three neurons." },
        { code: "print(np.round(approx, 2))       # three ReLU pieces", say: "Close to x² already; more hinges get closer. No linear model could bend at all." },
      ],
      output: "[0.   0.25 1.   2.25 4.  ]\n[0.  0.5 1.  2.5 5. ]",
    },
    useIt: "Whenever a relationship has thresholds, saturation or interactions, a linear model will underfit and a network with non-linear activations will not. This is also the argument for keeping a non-linear feedforward block in every transformer layer: attention alone is mostly linear mixing; the activation adds the bend.",
    takeaways: ["Linear means proportional and additive; stacks of linear layers stay linear.", "Non-linear activations let layers carve the input into regions with different rules.", "A ReLU network is piecewise linear: flat pieces joined at bends, approximating any curve with enough pieces.", "Non-linearity buys the ability to bend, nothing more; data and training do the rest."],
    terms: [["linear function", "one where scaling the input scales the output proportionally and inputs add"], ["piecewise linear", "made of straight segments joined at corners"], ["universal approximation", "the result that one hidden non-linear layer can approximate any continuous function given enough neurons"]],
    reflect: { q: "If one hidden layer can approximate anything, why use deep networks at all?", a: "Because 'enough neurons' can be astronomically many for one layer, while a deep network reuses pieces: edges built once serve every shape above them. Depth makes the approximation efficient and learnable, not merely possible." },
  },

  "m07-linear-activation": {
    simple: "A linear activation is no bend at all: output equals input. It is wrong inside a network and right at a regression output, where you want an unbounded number.",
    concept:
      "The **linear activation** (also called the identity) is f(z) = z. The neuron's output is its weighted sum, untouched. Sometimes a scaled version f(z) = c·z is meant, but scaling can be absorbed into the weights, so it changes nothing.\n\nInside a network it is a mistake, for the reason the last two lessons established: a linear layer followed by another layer collapses into one layer. But there is exactly one place where it is the right choice: the output of a regression model, where the prediction is a quantity (a price, a temperature, a delivery time) that should not be squashed into a fixed range or clipped at zero. There the network's final layer takes the last hidden layer's features and combines them linearly into the answer.\n\nIt is also used, deliberately, in a few internal spots: the projection layers that change a vector's size inside transformers are linear, because a non-linear block always follows them.",
    why:
      "Every activation squashes or clips, and some outputs must not be. A model predicting house prices with a sigmoid output could never say more than 1; with ReLU it could never say a negative change in price. Linear output lets the prediction take any real value, and pairs naturally with mean squared error (Module 4), whose gradient with respect to a linear output is simply prediction minus target.\n\nNaming it explicitly also stops a common bug: frameworks default to 'no activation' when none is specified, so a hidden layer with a missing activation silently becomes linear and the model quietly loses depth.",
    how: [
      "The last hidden layer produces a feature vector h after its own non-linear activation.",
      "The output layer computes y = w·h + b with no function applied.",
      "The loss, usually mean squared error, compares y with the target directly.",
      "The gradient flows back through the output as (y − target), unscaled by any activation derivative.",
      "Inside the network, the engineer checks that every hidden layer has a non-linear activation, so the only linear step is the final combination.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Output task", "Right activation", "Why linear would fail / succeed"],
        rows: [
          ["predict a price in pounds", "linear", "succeeds: any positive or negative value allowed"],
          ["predict temperature change (can be negative)", "linear", "succeeds: ReLU would forbid negatives"],
          ["probability of fraud", "sigmoid", "linear would output 1.7 or −0.3; not a probability"],
          ["one of ten digits", "softmax", "linear scores do not sum to 1"],
          ["hidden layer features", "ReLU / GELU", "linear collapses the layer into its neighbour"],
        ],
      },
      caption: "Linear is for the output of a regression and almost nowhere else.",
    },
    everyday: {
      title: "A scale, not a verdict",
      text: "A kitchen scale reports the weight as a number: 212 grams, 1.4 kilos, whatever is on it. It does not say 'heavy' or 'light'; that judgement is for you. A regression output is a scale: it should report the quantity, not squash it into a yes/no. The linear activation keeps it honest.",
    },
    engineering: {
      title: "The delivery-time model capped at one",
      text: "A logistics team builds a network to predict delivery minutes and, copying a classifier template, leaves a sigmoid on the output. Every prediction is between 0 and 1, the loss plateaus, and someone suggests scaling targets by dividing by 120. That works until a 150-minute delivery appears and the model literally cannot say it. Switching the output to linear and the loss to mean squared error fixed the model in one change. Templates carry their output activations with them; check the output layer against the task every time.",
    },
    maths: {
      formula: "y = w · h + b ;   MSE loss L = ½(y − t)² ;   ∂L/∂y = y − t",
      meaning: "h is the last hidden layer's output, t the target. With a linear output, the loss gradient is simply the error, which flows straight into the weights.",
      worked: [
        "h = (1.2, 0.0, 3.0), w = (10, 5, 4), b = 20: y = 12 + 0 + 12 + 20 = 44 minutes.",
        "Target t = 50. Error y − t = −6; loss ½ · 36 = 18.",
        "Gradient on w: (y − t) · h = (−7.2, 0, −18). Each weight moves to raise y toward 50; the weight on the zero feature does not move.",
        "With a sigmoid output instead, y would be σ(44) ≈ 1.0 and the derivative σ'(44) ≈ 0: no gradient at all. The model could never learn.",
      ],
    },
    code: {
      title: "A regression head",
      lang: "py",
      src: `import numpy as np

h = np.array([1.2, 0.0, 3.0])       # features from the last hidden layer (after ReLU)
w = np.array([10.0, 5.0, 4.0])
b = 20.0

y = w @ h + b                        # linear output: no activation
t = 50.0
loss = 0.5 * (y - t) ** 2
grad_w = (y - t) * h                 # gradient of the loss on the output weights
print(y, loss, grad_w)`,
      lines: [
        { code: "y = w @ h + b                        # linear output: no activation", say: "The prediction is the weighted sum itself. It can be 44 or 440 or −4." },
        { code: "loss = 0.5 * (y - t) ** 2", say: "Mean squared error for one example (Module 4 covers the choice)." },
        { code: "grad_w = (y - t) * h                 # gradient of the loss on the output weights", say: "With a linear output the gradient is just the error times the features: nothing shrinks it." },
      ],
      output: "44.0 18.0 [ -7.2  -0.  -18. ]",
    },
    useIt: "Use a linear output for any regression: prices, durations, counts (sometimes with a log transform), coordinates, sensor values. Verify output activations whenever you reuse a model template, and verify hidden layers are not accidentally linear whenever a deep model performs like a shallow one.",
    takeaways: ["Linear activation means f(z) = z: no bend.", "Wrong inside the network (collapse), right at a regression output (unbounded prediction).", "Pairs with mean squared error; the output gradient is just the error.", "A squashing function at a regression output caps what the model can say and can kill the gradient."],
    terms: [["identity / linear activation", "f(z) = z; the output equals the weighted sum"], ["regression head", "the final linear layer that turns features into a predicted quantity"]],
    reflect: { q: "A team predicts counts of items sold and wants to forbid negative predictions. Should they use ReLU at the output?", a: "They can, but a ReLU output has zero gradient whenever it predicts zero, so the model can get stuck predicting zero for rare items. Common alternatives are a linear output on log(count + 1), or a softplus output, which stays positive and keeps a gradient." },
  },

  "m07-sigmoid": {
    simple: "Sigmoid squashes any number into (0, 1) along an S-curve, which makes it the natural output for a yes/no probability and a poor choice for deep hidden layers.",
    concept:
      "The **sigmoid** function is σ(z) = 1 / (1 + e^(−z)). Feed it a large negative number and it returns almost 0; a large positive number, almost 1; zero gives exactly 0.5. Plotted, it is an S that rises smoothly through the middle and flattens at both ends.\n\nIts output can be read as a probability: σ(z) is the model's belief that the answer is 'yes'. With binary cross-entropy as the loss (Module 4), a sigmoid output plus that loss has an elegant gradient: prediction minus target, exactly like the linear-plus-MSE pair. That is why nearly every binary classifier ends in a sigmoid.\n\nIts derivative is σ(z)(1 − σ(z)), at most 0.25 at z = 0 and tiny in the tails. That small derivative is harmless at a single output and damaging in a stack of hidden layers, where it multiplies through every layer and starves the early ones of gradient. Sigmoid belongs at outputs and gates, not in the body of a deep network.",
    why:
      "Models need a way to output a probability. A raw weighted sum ranges over all real numbers; the sigmoid is the smooth, monotonic map from that range to (0, 1), and it is the mathematically natural one: it is the inverse of the log-odds, so a sigmoid neuron is literally logistic regression. Thresholding it at 0.5 gives a decision; keeping it gives a confidence.\n\nIt was also the default hidden activation for decades, which is why old code and old papers are full of it, and why the vanishing-gradient problem (Module 9) was such a wall until ReLU replaced it.",
    how: [
      "Compute z = w·x + b.",
      "Compute e^(−z); it is huge for negative z and near zero for positive z.",
      "σ(z) = 1 / (1 + e^(−z)): between 0 and 1, with 0.5 at z = 0.",
      "For a decision, compare with a threshold (0.5, or stricter if false alarms are costly).",
      "For training with binary cross-entropy, the gradient at the output is σ(z) − t, which pushes z up when the target is 1 and down when it is 0.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["z", "e^(−z)", "σ(z)", "σ'(z) = σ(1−σ)", "Reading"],
        rows: [
          ["−6", "403", "0.002", "0.002", "confident no; almost no gradient"],
          ["−2", "7.39", "0.12", "0.105", "probably no"],
          ["0", "1", "0.50", "0.25", "unsure; gradient at its largest"],
          ["2", "0.135", "0.88", "0.105", "probably yes"],
          ["6", "0.0025", "0.998", "0.002", "confident yes; almost no gradient"],
        ],
      },
      caption: "The curve is steep only near zero. In the tails both the output and its slope flatten.",
    },
    everyday: {
      title: "How sure a weather presenter sounds",
      text: "A presenter never says the chance of rain is 110% or −5%. As the evidence piles up, their stated chance creeps toward 100 but never reaches it, and once they are at 99 another cloud barely moves them. That creeping, capped confidence is the sigmoid, and the 'barely moves them' at the ends is the flat tail that makes it a bad hidden activation.",
    },
    engineering: {
      title: "Calibrating a fraud score",
      text: "A payments team's fraud model ends in a sigmoid, so each transaction gets a number from 0 to 1 that reads as a probability. Because it is a probability, the team can set thresholds by cost: block above 0.95, review between 0.6 and 0.95, allow below. They check calibration monthly: among transactions scored around 0.8, roughly 80% should turn out fraudulent. When a model update broke calibration (scores around 0.8 were only 50% fraud), the thresholds no longer meant what the business thought; the sigmoid output had drifted. Probability outputs are useful precisely because they can be checked against reality.",
    },
    maths: {
      formula: "σ(z) = 1 / (1 + e^(−z)) ;   σ'(z) = σ(z)(1 − σ(z)) ;   logit: z = ln(p / (1 − p))",
      meaning: "e^(−z) is the exponential of −z. The derivative is the output times one minus the output. The logit is the inverse: the z that would produce probability p.",
      worked: [
        "z = 2: e^(−2) ≈ 0.135; σ = 1 / 1.135 ≈ 0.881.",
        "Derivative: 0.881 × 0.119 ≈ 0.105.",
        "z = −2: e^(2) ≈ 7.389; σ = 1 / 8.389 ≈ 0.119 = 1 − 0.881, the mirror of z = 2.",
        "Ten sigmoid layers each at z = 2 multiply the gradient by 0.105 ten times: 0.105¹⁰ ≈ 1.6 × 10⁻¹⁰. The first layer would receive effectively nothing.",
        "Logit of p = 0.9: ln(0.9 / 0.1) = ln 9 ≈ 2.197. A neuron needs z ≈ 2.2 to say '90%'.",
      ],
    },
    code: {
      title: "Sigmoid, its derivative and the vanishing product",
      lang: "py",
      src: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

z = np.array([-6.0, -2.0, 0.0, 2.0, 6.0])
s = sigmoid(z)
print(np.round(s, 3))                 # outputs
print(np.round(s * (1 - s), 3))       # derivatives: largest 0.25 at z = 0
print((0.105) ** 10)                  # ten layers at z = 2: gradient shrinks ~10 billion times`,
      lines: [
        { code: "return 1 / (1 + np.exp(-z))", say: "The S-curve in one line." },
        { code: "print(np.round(s * (1 - s), 3))       # derivatives: largest 0.25 at z = 0", say: "The derivative needs no extra formula: output times one minus output." },
        { code: "print((0.105) ** 10)                  # ten layers at z = 2: gradient shrinks ~10 billion times", say: "The vanishing-gradient problem in one number. This is why sigmoid left the hidden layers." },
      ],
      output: "[0.002 0.119 0.5   0.881 0.998]\n[0.002 0.105 0.25  0.105 0.002]\n1.6288946267774416e-10",
    },
    useIt: "Use sigmoid at the output of binary classifiers (fraud, churn, spam, disease present) and as gates inside LSTMs and attention variants where a value between 0 and 1 scales something. Pair it with binary cross-entropy. Avoid it in deep hidden layers; use ReLU-family functions there.",
    takeaways: ["σ(z) = 1 / (1 + e^(−z)): an S-curve from 0 to 1, 0.5 at zero.", "Read the output as a probability; threshold it for a decision; check calibration.", "Derivative σ(1 − σ) peaks at 0.25 and vanishes in the tails.", "Right at binary outputs and gates; wrong in deep hidden stacks."],
    terms: [["sigmoid", "the S-curve 1 / (1 + e^(−z)) mapping any number into (0, 1)"], ["logit", "the pre-sigmoid value z; the inverse of the sigmoid"], ["calibration", "whether predicted probabilities match observed frequencies"]],
    reflect: { q: "A sigmoid output gives 0.5 for an example. What does that tell you about z, and what should a cautious system do?", a: "z is 0: the evidence is balanced. A cautious system treats such cases as 'unsure' and routes them to review or asks for more information, rather than flipping a coin at the threshold." },
  },

  "m07-tanh": {
    simple: "Tanh is a sigmoid stretched to run from −1 to 1 and centred on zero, which makes it a better-behaved squashing function for hidden layers and the classic choice inside recurrent networks.",
    concept:
      "**Tanh**, the hyperbolic tangent, is tanh(z) = (e^z − e^(−z)) / (e^z + e^(−z)). Its shape is the same S as the sigmoid, but it runs from −1 to 1 and passes through zero at z = 0. In fact tanh(z) = 2σ(2z) − 1: a sigmoid scaled and shifted.\n\nThe shift matters. A sigmoid's outputs are all positive, so every neuron in the next layer receives inputs with a positive average, which biases their weighted sums and makes gradient steps zig-zag. Tanh outputs are centred on zero, so the next layer sees balanced inputs and trains more smoothly. Its derivative is 1 − tanh²(z), up to 1 at z = 0, four times the sigmoid's peak.\n\nIt still saturates: for |z| above about 3 the output is within 0.005 of ±1 and the derivative is nearly zero. So tanh is better than sigmoid for hidden layers but still suffers in deep stacks, which is why it survives mainly inside recurrent cells (LSTM, GRU in Module 10), where its bounded, signed output is exactly what the cell state needs.",
    why:
      "Before ReLU, tanh was the recommended hidden activation precisely because of zero-centring: networks with tanh trained noticeably faster than with sigmoid, for no change in cost. Later, the same property made it the choice for recurrent networks, where a cell's memory must be bounded (so it cannot blow up over hundreds of steps) and able to represent 'negative' as well as 'positive' information.\n\nIt also appears wherever a signed, bounded value is wanted: an output in [−1, 1] such as a steering angle for a robot, or a normalised sentiment.",
    how: [
      "Compute z = w·x + b.",
      "tanh(z) = (e^z − e^(−z)) / (e^z + e^(−z)), or equivalently 2σ(2z) − 1.",
      "Output lies in (−1, 1), with sign matching z and magnitude saturating toward 1 for |z| > 3.",
      "For training, the derivative is 1 − tanh²(z): 1 at the centre, near 0 in the tails.",
      "The next layer receives zero-centred inputs, which keeps its weighted sums balanced.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["z", "sigmoid σ(z)", "tanh(z)", "tanh'(z) = 1 − tanh²"],
        rows: [
          ["−3", "0.047", "−0.995", "0.010"],
          ["−1", "0.269", "−0.762", "0.420"],
          ["0", "0.5", "0", "1.0"],
          ["1", "0.731", "0.762", "0.420"],
          ["3", "0.953", "0.995", "0.010"],
        ],
      },
      caption: "Same S, different range. Tanh is centred on zero and twice as steep at the middle.",
    },
    everyday: {
      title: "A steering wheel",
      text: "A steering wheel goes from full left (−1) through straight ahead (0) to full right (+1). Turning harder past full lock does nothing more. The response is signed, bounded and smooth: tanh. A sigmoid would be a wheel that only turns right, from 'slightly' to 'fully', with no straight-ahead at zero.",
    },
    engineering: {
      title: "Keeping a recurrent memory bounded",
      text: "A speech team's recurrent network processes audio frames one at a time, carrying a memory vector across thousands of steps. With a linear update the memory values grew without bound and the model produced nonsense after a few seconds of audio. Using tanh in the update keeps every memory value between −1 and 1 no matter how many steps pass, while still allowing 'negative' evidence (a sound that argues against a phoneme). Bounded and signed is exactly what a long-running memory needs, and it is why LSTM and GRU cells (Module 10) use tanh for their candidate states.",
    },
    maths: {
      formula: "tanh(z) = (e^z − e^(−z)) / (e^z + e^(−z)) = 2σ(2z) − 1 ;   tanh'(z) = 1 − tanh²(z)",
      meaning: "A ratio of exponentials; equivalently a rescaled sigmoid. The derivative is one minus the square of the output.",
      worked: [
        "z = 1: e¹ ≈ 2.718, e^(−1) ≈ 0.368. tanh = (2.718 − 0.368) / (2.718 + 0.368) = 2.350 / 3.086 ≈ 0.762.",
        "Check via sigmoid: σ(2) ≈ 0.881; 2 · 0.881 − 1 = 0.762. Same.",
        "Derivative: 1 − 0.762² = 1 − 0.581 ≈ 0.42, compared with sigmoid's 0.197 at z = 1.",
        "z = 3: tanh ≈ 0.995, derivative ≈ 0.01. Saturated: ten such layers multiply the gradient by 10⁻²⁰.",
      ],
    },
    code: {
      title: "Tanh as a shifted sigmoid",
      lang: "py",
      src: `import numpy as np

def sigmoid(z): return 1 / (1 + np.exp(-z))

z = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
print(np.round(np.tanh(z), 3))                 # built-in tanh
print(np.round(2 * sigmoid(2 * z) - 1, 3))     # identical: 2σ(2z) − 1
print(np.round(1 - np.tanh(z) ** 2, 3))        # derivative`,
      lines: [
        { code: "print(np.round(np.tanh(z), 3))                 # built-in tanh", say: "NumPy has tanh built in; the outputs run from −0.995 to 0.995." },
        { code: "print(np.round(2 * sigmoid(2 * z) - 1, 3))     # identical: 2σ(2z) − 1", say: "The same numbers from a rescaled sigmoid, confirming the identity." },
        { code: "print(np.round(1 - np.tanh(z) ** 2, 3))        # derivative", say: "One at the centre, almost zero at ±3: better than sigmoid, still saturating." },
      ],
      output: "[-0.995 -0.762  0.     0.762  0.995]\n[-0.995 -0.762  0.     0.762  0.995]\n[0.01  0.42  1.    0.42  0.01 ]",
    },
    useIt: "Choose tanh for the candidate state in recurrent cells, for outputs that must be signed and bounded (control signals, normalised scores), and for shallow networks where a smooth squashing function is wanted. For deep feedforward stacks, prefer ReLU-family functions, which do not saturate on the positive side.",
    takeaways: ["tanh is a sigmoid scaled to (−1, 1) and centred on zero: tanh(z) = 2σ(2z) − 1.", "Zero-centred outputs make the next layer's training smoother than sigmoid's.", "Derivative 1 − tanh² peaks at 1 but still vanishes in the tails.", "Its home is inside recurrent cells and at signed, bounded outputs."],
    terms: [["tanh", "the hyperbolic tangent: an S-curve from −1 to 1 through the origin"], ["zero-centred", "outputs whose average is around zero, positive and negative alike"], ["saturation", "the flat region of a squashing function where the output stops changing and the derivative is near zero"]],
    reflect: { q: "Why does a positive-only activation like sigmoid make the next layer's gradient steps zig-zag?", a: "The gradient on each weight is the error times the input to that weight. If all inputs are positive, all of a neuron's weight gradients share the sign of the error, so the whole weight vector can only move in two diagonal directions per step. Zero-centred inputs let different weights move in different directions at once." },
  },

  "m07-relu": {
    simple: "ReLU keeps positive values and zeroes negatives: max(0, z). It is cheap, does not saturate for positive inputs, and is the default activation for hidden layers.",
    concept:
      "The **rectified linear unit**, ReLU, is the simplest useful activation: f(z) = max(0, z). Negative pre-activations become zero; positive ones pass through unchanged. It is not smooth (there is a corner at zero) and it is not bounded, and both of those are features.\n\nFor positive z the derivative is exactly 1, so gradients flow back through an active ReLU neuron without shrinking. That is the property that made deep networks trainable: a hundred ReLU layers pass a gradient as well as one, provided the neurons along the path are active. For negative z the derivative is 0: the neuron is off and contributes nothing, forwards or backwards.\n\nThe zero side also gives sparsity. In a trained network roughly half the ReLU neurons are off for any given input, which means each input activates a different subset of the network: a cheap kind of specialisation. The cost is the 'dying ReLU' problem: a neuron whose pre-activation is negative for every input in the data outputs zero always, gets no gradient, and never recovers. Leaky ReLU (next lesson) is the usual fix.",
    why:
      "Deep networks with sigmoid or tanh could not be trained past a few layers because the gradients vanished through the saturating tails. ReLU has no positive-side tail: its slope is 1 all the way up. When researchers switched to ReLU around 2011, networks with many more layers suddenly trained, and the computation per neuron fell to a single comparison. Almost every convolutional and feedforward network since uses ReLU or a close relative inside.",
    how: [
      "Compute z = w·x + b.",
      "If z > 0, output z; otherwise output 0. One comparison.",
      "Forward: positive neurons pass their value; negative ones contribute nothing to the next layer.",
      "Backward: the gradient through an active neuron is multiplied by 1 (unchanged); through an inactive neuron it is multiplied by 0 (blocked).",
      "Over training, each neuron's weights and bias settle so that it is active for the inputs where it is useful and silent otherwise.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Sigmoid in a hidden layer", points: ["output in (0, 1), always positive", "derivative ≤ 0.25, vanishes in the tails", "needs an exponential per neuron", "every neuron always 'a bit on'"] },
      right: { title: "ReLU in a hidden layer", points: ["output in [0, ∞)", "derivative 1 when active, 0 when off", "one comparison per neuron", "about half the neurons off for any input: sparse"] },
      caption: "ReLU trades smoothness for an unshrinking gradient and near-zero cost.",
    },
    everyday: {
      title: "A one-way valve",
      text: "A one-way valve in a pipe lets water flow forward freely and stops it flowing back. No resistance in the open direction, complete block in the other. ReLU is that valve for numbers: positives pass untouched, negatives are blocked entirely. Nothing is squashed on the open side, which is why signals and gradients travel through many valves without weakening.",
    },
    engineering: {
      title: "From seven layers to fifty",
      text: "An image-recognition team's 2010 model had seven layers with tanh and could not be made deeper: adding layers made validation accuracy worse because the early layers stopped learning. Replacing tanh with ReLU let them train nineteen layers with better accuracy, and with residual connections (Module 9) later, fifty and more. Their profiling showed another gain: the activation went from the most expensive part of the forward pass (an exponential per neuron) to negligible. The same team now monitors the fraction of dead ReLUs per layer as a health metric; above 20% they switch that layer to leaky ReLU.",
    },
    maths: {
      formula: "ReLU(z) = max(0, z) ;   ReLU'(z) = 1 if z > 0, else 0 ;   gradient through k active layers: × 1ᵏ = 1",
      meaning: "The output equals z or 0. The derivative is a step: 1 on the active side, 0 on the inactive side. Multiplying k ones changes nothing.",
      worked: [
        "z = (−2.0, 0.3, 4.1, −0.1) → ReLU = (0, 0.3, 4.1, 0). Two of four neurons are off.",
        "Backward through this layer: the incoming gradient (g₁, g₂, g₃, g₄) becomes (0, g₂, g₃, 0).",
        "Through ten layers where the path stays active: gradient × 1¹⁰ = unchanged. With sigmoid at z = 2 (lesson 7.4) it was × 1.6 × 10⁻¹⁰.",
        "Dying neuron: if a neuron's bias drifts to −50 while its inputs stay in [0, 1] with weights in [−1, 1], z ≤ −45 for all data. Output 0, gradient 0, forever.",
      ],
    },
    code: {
      title: "ReLU forward and backward",
      lang: "py",
      src: `import numpy as np

z = np.array([-2.0, 0.3, 4.1, -0.1])
a = np.maximum(0.0, z)                    # forward
mask = (z > 0).astype(float)              # derivative: 1 where active, 0 where off
incoming_grad = np.array([0.5, 0.5, 0.5, 0.5])
grad_z = incoming_grad * mask             # backward

print(a)                                  # [0.  0.3 4.1 0. ]
print(mask)                               # [0. 1. 1. 0.]
print(grad_z)                             # [0.  0.5 0.5 0. ]`,
      lines: [
        { code: "a = np.maximum(0.0, z)                    # forward", say: "One comparison per neuron. No exponentials." },
        { code: "mask = (z > 0).astype(float)              # derivative: 1 where active, 0 where off", say: "The derivative is a mask of ones and zeros; it is computed from the sign of z alone." },
        { code: "grad_z = incoming_grad * mask             # backward", say: "Active neurons pass the gradient through unchanged; off neurons block it." },
      ],
      output: "[0.  0.3 4.1 0. ]\n[0. 1. 1. 0.]\n[0.  0.5 0.5 0. ]",
    },
    useIt: "Use ReLU as the default hidden activation in feedforward and convolutional networks. Monitor the fraction of dead neurons per layer; if it climbs, lower the learning rate or switch to leaky ReLU or GELU. Never use it at a regression output that must be negative, and never at a probability output.",
    takeaways: ["ReLU(z) = max(0, z): positives pass, negatives become zero.", "Derivative 1 when active, so gradients do not shrink through deep stacks.", "Cheap (one comparison) and sparse (about half the neurons off per input).", "Risk: dead neurons that never recover; watch for them."],
    terms: [["ReLU", "rectified linear unit, max(0, z)"], ["sparsity (activation)", "many neurons outputting exactly zero for a given input"], ["dying ReLU", "a neuron stuck at zero output for every input, receiving no gradient"]],
    reflect: { q: "ReLU is unbounded above. Why is that not a problem the way sigmoid's bounds are?", a: "Bounds were a problem because of the flat tails that kill gradients, not because large outputs are bad in themselves. ReLU's unbounded side keeps a slope of 1 everywhere, so the gradient never dies there. Very large activations can still cause numerical trouble, which normalisation layers (Module 9) handle." },
  },

  "m07-leaky-relu": {
    simple: "Leaky ReLU gives negative inputs a small slope instead of zero, so a neuron can never die completely and always keeps a trickle of gradient.",
    concept:
      "**Leaky ReLU** is ReLU with a small escape hatch: f(z) = z for z > 0, and f(z) = αz for z ≤ 0, with α a small constant such as 0.01. Positive values pass unchanged exactly as in ReLU. Negative values are not zeroed but shrunk to one-hundredth of their size.\n\nThe point is the derivative on the negative side: α instead of 0. A neuron whose pre-activation is negative for every input still passes a small gradient backwards, so training can move its weights and bias until it becomes active again. The dying-ReLU problem from the last lesson cannot happen: no neuron is ever permanently silent.\n\nVariants choose α differently. Parametric ReLU (PReLU) learns α per channel during training. Randomised leaky ReLU samples α during training as a regulariser. In practice α = 0.01 to 0.2 is set once and left alone, and the gain is modest: leaky ReLU rarely beats ReLU by much, but it removes a failure mode, which is worth a lot when a run is expensive.",
    why:
      "A dead ReLU neuron is wasted capacity: it occupies parameters and compute and contributes nothing, and once dead it cannot be revived by training. In some settings (high learning rates, poorly scaled inputs, generative adversarial networks) 30 to 40% of a layer can die. Leaky ReLU exists to make that impossible at almost no cost: one extra multiplication on the negative side.\n\nIt also keeps a little information from negative pre-activations instead of discarding it, which some tasks, particularly in GANs and audio, benefit from.",
    how: [
      "Compute z = w·x + b.",
      "If z > 0, output z. Otherwise output α·z, a small negative number.",
      "Forward: strongly negative z still produces a small negative output rather than exactly zero.",
      "Backward: the gradient is multiplied by 1 on the positive side and by α on the negative side; never by 0.",
      "A neuron that is currently negative for all inputs keeps receiving α-scaled gradient and can drift back into the active region.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["z", "ReLU", "Leaky ReLU (α = 0.01)", "ReLU'", "Leaky ReLU'"],
        rows: [
          ["−50", "0", "−0.5", "0", "0.01"],
          ["−2", "0", "−0.02", "0", "0.01"],
          ["0.3", "0.3", "0.3", "1", "1"],
          ["4.1", "4.1", "4.1", "1", "1"],
        ],
      },
      caption: "Identical on the positive side. On the negative side, a small output and, crucially, a small non-zero derivative.",
    },
    everyday: {
      title: "A door that is never fully locked",
      text: "A ReLU neuron that dies is a door that has locked itself from the inside with no key. A leaky ReLU leaves the door on the latch: closed enough that almost nothing gets through, but a persistent push (gradient, step after step) can open it again. The latch costs nothing when the door is open.",
    },
    engineering: {
      title: "Reviving a generator",
      text: "A team training a generative adversarial network for synthetic product photos saw the generator collapse: after a few thousand steps it produced the same grey blob for every input. Inspection showed 38% of the ReLU neurons in its early layers were dead, killed by the large, noisy gradients GAN training produces. Switching to leaky ReLU with α = 0.2 in the generator and discriminator, a standard choice in that field, cut the dead fraction to under 2% and the collapse stopped. The fix was one argument in the layer definition.",
    },
    maths: {
      formula: "f(z) = z (z > 0), αz (z ≤ 0) ;   f'(z) = 1 (z > 0), α (z ≤ 0)",
      meaning: "α is a small fixed slope, often 0.01. On the negative side both the output and the derivative are scaled by α rather than zeroed.",
      worked: [
        "α = 0.01. z = −50: output −0.5; derivative 0.01.",
        "A dead ReLU neuron with z = −50 for all inputs: gradient 0, no change, forever.",
        "The same neuron under leaky ReLU: each step moves its bias by learning rate × 0.01 × error signal. With learning rate 0.1 and an error signal of 2 per step, the bias moves 0.002 per step; after 25,000 steps it has moved 50 and the neuron is back at z = 0 and alive.",
        "At z = 4.1 the two functions agree exactly: output 4.1, derivative 1.",
      ],
    },
    code: {
      title: "Leaky ReLU and its derivative",
      lang: "py",
      src: `import numpy as np

def leaky_relu(z, alpha=0.01):
    return np.where(z > 0, z, alpha * z)

def leaky_relu_grad(z, alpha=0.01):
    return np.where(z > 0, 1.0, alpha)

z = np.array([-50.0, -2.0, 0.3, 4.1])
print(leaky_relu(z))          # [-0.5  -0.02  0.3   4.1 ]
print(leaky_relu_grad(z))     # [0.01 0.01 1.   1.  ]`,
      lines: [
        { code: "return np.where(z > 0, z, alpha * z)", say: "Pick z where positive, α·z where not. One extra multiplication compared with ReLU." },
        { code: "return np.where(z > 0, 1.0, alpha)", say: "The derivative is never zero: α on the negative side keeps the gradient alive." },
        { code: "print(leaky_relu_grad(z))     # [0.01 0.01 1.   1.  ]", say: "Compare with ReLU's mask (0, 0, 1, 1): the first two neurons can still learn." },
      ],
      output: "[-0.5  -0.02  0.3   4.1 ]\n[0.01 0.01 1.   1.  ]",
    },
    useIt: "Reach for leaky ReLU when dead neurons appear in monitoring, in GANs and other adversarial setups, and in networks trained with aggressive learning rates. Keep ReLU where it already works; the difference in accuracy is usually small, and consistency across a codebase matters.",
    takeaways: ["Leaky ReLU = ReLU with slope α on the negative side.", "Its derivative is never zero, so neurons cannot die permanently.", "α is small (0.01 to 0.2) and usually fixed; PReLU learns it.", "A cheap insurance policy, not a big accuracy gain."],
    terms: [["leaky ReLU", "ReLU with a small negative-side slope α"], ["PReLU", "parametric ReLU: the negative slope is learned"]],
    reflect: { q: "If leaky ReLU removes a failure mode at no cost, why is ReLU still the default?", a: "Because the failure mode is uncommon with good initialisation and learning rates, ReLU's exact zeros give clean sparsity, frameworks and hardware are tuned for it, and results are usually equal. Defaults change only when the gain is consistent." },
  },

  "m07-gelu": {
    simple: "GELU is a smooth version of ReLU that scales each input by the probability a standard normal variable is below it; it is the activation inside most transformers.",
    concept:
      "The **Gaussian error linear unit**, GELU, is f(z) = z · Φ(z), where Φ is the cumulative distribution function of the standard normal distribution: the probability that a random number drawn from a bell curve is less than z. For large positive z, Φ(z) ≈ 1 and GELU ≈ z, like ReLU. For large negative z, Φ(z) ≈ 0 and GELU ≈ 0, like ReLU. Near zero it curves smoothly instead of having a corner, and it dips slightly below zero (its minimum is about −0.17 at z ≈ −0.75) before rising.\n\nThe interpretation: instead of a hard gate that keeps or kills the input, GELU keeps the input with a probability that depends on how large it is. It is a soft, stochastic-looking gate made deterministic.\n\nGELU came with the transformer era: BERT, GPT and nearly every large language model use it (or a close variant, SwiGLU) in their feedforward blocks. In those models it trains slightly better than ReLU, and its smoothness suits the optimisers used. A cheap approximation with a tanh exists for speed.",
    why:
      "ReLU's corner at zero and its exact zeros are fine for convolutional networks but, in very large transformer models, a smooth activation gave measurably better results, and GELU was the one that won the comparisons. Its justification combines ReLU's shape with the idea of dropout (Module 9): multiplying an input by a Bernoulli gate whose probability depends on the input, then taking the expectation. That gives a principled smooth curve rather than an arbitrary one.\n\nYou will meet it mostly as a given: the activation inside pre-trained language models, which you will not change.",
    how: [
      "Compute z = w·x + b.",
      "Compute Φ(z), the standard normal probability of a value below z: 0.5 at z = 0, ≈ 0.84 at z = 1, ≈ 0.16 at z = −1.",
      "Output z · Φ(z): nearly z for z ≫ 0, nearly 0 for z ≪ 0, a smooth dip in between.",
      "For speed, use the tanh approximation 0.5·z·(1 + tanh(√(2/π)·(z + 0.044715·z³))).",
      "Backward: the derivative is Φ(z) + z·φ(z), where φ is the bell curve itself; it is smooth and never exactly zero on a range, so no hard dead zone.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["z", "Φ(z)", "GELU = z·Φ(z)", "ReLU", "Difference"],
        rows: [
          ["−3", "0.0013", "−0.004", "0", "almost none"],
          ["−1", "0.159", "−0.159", "0", "a small negative output"],
          ["−0.75", "0.227", "−0.170", "0", "GELU's minimum"],
          ["0", "0.5", "0", "0", "none"],
          ["1", "0.841", "0.841", "1", "slightly less than ReLU"],
          ["3", "0.9987", "2.996", "3", "almost none"],
        ],
      },
      caption: "GELU agrees with ReLU far from zero and smooths the corner, dipping slightly negative on the way.",
    },
    everyday: {
      title: "A bouncer who gets stricter smoothly",
      text: "A ReLU bouncer has one rule: positive you are in, otherwise out. A GELU bouncer lets you in with a probability that rises smoothly with how good you look: at 'average' it is a coin flip, well above average it is nearly certain, well below it is nearly hopeless. Averaged over the night, the amount of each person that 'gets in' traces the GELU curve.",
    },
    engineering: {
      title: "The activation you inherit",
      text: "A team fine-tunes a pre-trained language model for contract summarisation. They never choose an activation: the model's twelve feedforward blocks already use GELU, chosen by the people who pretrained it on hundreds of billions of tokens. What matters to the team is knowing what it is when they read the architecture, write a custom layer that must match it, or quantise the model and need the activation's range (the small negative dip means 'clip at zero' would be wrong). Understanding GELU is less about choosing it and more about not breaking it.",
    },
    maths: {
      formula: "GELU(z) = z · Φ(z) ;   Φ(z) = P(N(0,1) ≤ z) ;   approx: 0.5 z (1 + tanh(√(2/π)(z + 0.044715 z³)))",
      meaning: "Φ is the normal distribution's cumulative probability (Module 3). The approximation replaces it with a tanh expression that is cheap to compute.",
      worked: [
        "z = 1: Φ(1) ≈ 0.8413, GELU ≈ 0.841. (ReLU would give 1.)",
        "z = −1: Φ(−1) ≈ 0.1587, GELU ≈ −0.159. (ReLU: 0.)",
        "z = −0.75: Φ ≈ 0.2266, GELU ≈ −0.170, the lowest the function goes.",
        "Approximation at z = 1: √(2/π) ≈ 0.7979; inner = 0.7979 · (1 + 0.0447) ≈ 0.8336; tanh ≈ 0.6823; 0.5 · 1 · 1.6823 ≈ 0.841. Matches to three decimals.",
      ],
    },
    code: {
      title: "GELU exact and approximate",
      lang: "py",
      src: `import numpy as np
from math import erf, sqrt, pi

def gelu(z):
    return z * 0.5 * (1 + erf(z / sqrt(2)))          # exact: z * Phi(z)

def gelu_approx(z):
    return 0.5 * z * (1 + np.tanh(sqrt(2 / pi) * (z + 0.044715 * z ** 3)))

for z in (-3.0, -1.0, -0.75, 0.0, 1.0, 3.0):
    print(f"{z:5.2f}  {gelu(z):7.3f}  {gelu_approx(z):7.3f}")`,
      lines: [
        { code: "return z * 0.5 * (1 + erf(z / sqrt(2)))          # exact: z * Phi(z)", say: "Φ(z) written with the error function erf, which maths libraries provide." },
        { code: "return 0.5 * z * (1 + np.tanh(sqrt(2 / pi) * (z + 0.044715 * z ** 3)))", say: "The tanh approximation used in many frameworks for speed." },
        { code: "print(f\"{z:5.2f}  {gelu(z):7.3f}  {gelu_approx(z):7.3f}\")", say: "Exact and approximate agree to about three decimal places everywhere." },
      ],
      output: "-3.00   -0.004   -0.004\n-1.00   -0.159   -0.159\n-0.75   -0.170   -0.170\n 0.00    0.000    0.000\n 1.00    0.841    0.841\n 3.00    2.996    2.996",
    },
    useIt: "You will use GELU by inheritance in every transformer you fine-tune or serve, and by choice when building transformer-style blocks from scratch. Know its small negative range when quantising or clipping activations, and know that SwiGLU and similar gated variants in newer models are relatives of the same idea.",
    takeaways: ["GELU(z) = z·Φ(z): a smooth ReLU that gates by the normal probability of z.", "Agrees with ReLU far from zero; smooth near zero; dips to about −0.17.", "The activation inside most transformers and language models.", "A tanh approximation computes it cheaply."],
    terms: [["GELU", "Gaussian error linear unit: z times the standard normal CDF of z"], ["cumulative distribution function (CDF)", "the probability that a random value falls below a given number"], ["SwiGLU", "a gated activation variant used in newer language models"]],
    reflect: { q: "GELU can output negative numbers while ReLU cannot. Does that break the sparsity argument for ReLU?", a: "Partly. GELU's negative outputs are tiny (never below −0.17) and it does not produce exact zeros, so activations are not sparse in the strict sense. Transformers accept that trade: smoothness helped more than exact sparsity in their training." },
  },

  "m07-softmax": {
    simple: "Softmax turns a list of scores into probabilities that add up to 1, keeping their order; it is the output function for choosing one class among many.",
    concept:
      "**Softmax** acts on a whole vector, not one number. Given scores z₁ … zₖ, one per class, it returns pᵢ = e^(zᵢ) / Σⱼ e^(zⱼ). Each output is between 0 and 1, the outputs sum to exactly 1, and the biggest score gets the biggest probability. It is a smooth version of 'pick the maximum': hence the name.\n\nThe exponential does two things. It makes every value positive, so the division produces valid probabilities. And it stretches differences: a score 2 higher than another gets e² ≈ 7.4 times the probability. Scores far below the top vanish to almost nothing, while close scores share the probability.\n\nSoftmax is the standard output of multi-class classifiers (which digit, which product category, which of 50,000 next tokens) and the core of attention in transformers (Module 15), where it turns similarity scores into weights. Paired with categorical cross-entropy (Module 4), its output gradient is again prediction minus target, one entry per class.",
    why:
      "A classifier with k classes needs k outputs that can be read together: 'how likely is each?' Independent sigmoids give k numbers that need not sum to anything and can all be high at once. Softmax forces a single distribution over the classes, so the answer is both a choice (the largest) and a confidence (how much of the mass it holds), and the loss can compare the whole distribution with the true class.\n\nThe same need appears whenever a model must spread a fixed budget over options: attention over words, mixture-of-experts routing, sampling the next token. Softmax is the generic tool for 'scores to a distribution'.",
    how: [
      "The output layer produces one raw score (logit) per class: z = (z₁, …, zₖ).",
      "For numerical safety subtract the largest score from all of them; softmax is unchanged by this.",
      "Exponentiate each score: e^(zᵢ − max).",
      "Divide each by the sum of all exponentials. The results are probabilities summing to 1.",
      "Prediction: the class with the highest probability. Loss: −log of the probability given to the true class.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Logits", detail: "cat 2.0 · dog 1.0 · bird −1.0" },
        { label: "Exponentials", detail: "e² = 7.39 · e¹ = 2.72 · e⁻¹ = 0.37" },
        { label: "Sum", detail: "10.48" },
        { label: "Probabilities", detail: "cat 0.705 · dog 0.259 · bird 0.035" },
        { label: "Check", detail: "0.705 + 0.259 + 0.035 = 1.0; order preserved; gaps stretched" },
      ],
      caption: "Three scores become one distribution. A 1-point lead in logits becomes a 2.7× lead in probability.",
    },
    everyday: {
      title: "Dividing a pie by enthusiasm",
      text: "Three friends rate three films 2, 1 and −1. You have one evening (one pie) to divide. Softmax says: give the top film most of the evening but not all; give the −1 film a sliver. If the ratings were 20, 10, −10, the top film would get practically the whole evening. Softmax turns relative preferences into shares that always add up to the whole.",
    },
    engineering: {
      title: "Ten digits, one distribution",
      text: "A handwritten-digit reader ends in a layer of ten neurons, one per digit, followed by softmax. On a clear '7' the output is 0.98 for seven and crumbs elsewhere. On a sloppy digit it might be 0.46 for seven and 0.41 for one: the top class still wins, but the near-tie is visible, and the team routes such cases to a human in their cheque-processing pipeline. With ten independent sigmoids the same image might have scored 0.9 for both seven and one, with no way to compare them. The engineering value of softmax is that its outputs are comparable.",
    },
    maths: {
      formula: "pᵢ = e^(zᵢ) / Σⱼ e^(zⱼ) ;   softmax(z − c) = softmax(z) for any constant c",
      meaning: "Each probability is its exponential over the total of all exponentials. Subtracting a constant from every score cancels out, which is used to avoid overflow.",
      worked: [
        "z = (2.0, 1.0, −1.0). Exponentials: 7.389, 2.718, 0.368. Sum: 10.475.",
        "p = (0.705, 0.259, 0.035). Sum = 1.000. The largest score has the largest probability.",
        "Double the scores: z = (4, 2, −2). Exponentials 54.6, 7.39, 0.135; p = (0.879, 0.119, 0.002). Same order, sharper.",
        "Stability: with z = (1000, 999), e¹⁰⁰⁰ overflows. Subtract 1000: z' = (0, −1); e⁰ = 1, e⁻¹ = 0.368; p = (0.731, 0.269). Correct and finite.",
        "Loss on a true label of 'dog' (index 1) for the first case: −ln(0.259) ≈ 1.35. If the model had said 0.9 for dog, the loss would be −ln(0.9) ≈ 0.105.",
      ],
    },
    code: {
      title: "A numerically safe softmax",
      lang: "py",
      src: `import numpy as np

def softmax(z):
    shifted = z - z.max()                 # same result, no overflow
    e = np.exp(shifted)
    return e / e.sum()

z = np.array([2.0, 1.0, -1.0])
p = softmax(z)
print(np.round(p, 3), p.sum())            # [0.705 0.259 0.035] 1.0
print(np.round(softmax(2 * z), 3))        # sharper: [0.879 0.119 0.002]
print(softmax(np.array([1000.0, 999.0]))) # [0.731 0.269], no overflow`,
      lines: [
        { code: "shifted = z - z.max()                 # same result, no overflow", say: "Subtracting the maximum does not change the answer and keeps the exponentials small." },
        { code: "return e / e.sum()", say: "Each exponential divided by the total: probabilities that sum to 1." },
        { code: "print(np.round(softmax(2 * z), 3))        # sharper: [0.879 0.119 0.002]", say: "Scaling the scores up sharpens the distribution. This scaling is the 'temperature' idea in Module 18." },
      ],
      output: "[0.705 0.259 0.035] 1.0\n[0.879 0.119 0.002]\n[0.73105858 0.26894142]",
    },
    useIt: "Softmax is the output of every multi-class classifier and of every language model's next-token prediction, and it is inside every attention layer. In practice frameworks fuse it with the cross-entropy loss for stability, so you often specify logits and let the loss apply softmax. Reading a softmax output as a distribution, and checking its calibration, is routine model evaluation.",
    takeaways: ["Softmax: exponentiate each score, divide by the sum; probabilities summing to 1, order preserved.", "Differences in scores become ratios in probability; scaling scores sharpens or softens.", "Subtract the maximum first to avoid overflow.", "Output of multi-class classifiers and language models; the core of attention."],
    terms: [["softmax", "the function turning a vector of scores into a probability distribution"], ["logits", "the raw per-class scores that softmax reads"], ["distribution (output)", "a set of non-negative numbers summing to 1, one per option"]],
    reflect: { q: "Why not just pick the class with the highest score and skip softmax?", a: "For the final decision you do pick the highest, and softmax does not change which that is. Softmax matters for training (the loss needs probabilities to compare with the truth and a smooth gradient), for confidence (how far ahead the winner is), and for sampling and attention, where the whole distribution is used." },
  },

  "m07-choosing-activation-functions": {
    simple: "Choose activations by position and task: rectifiers in hidden layers (ReLU by default, GELU in transformers), and at the output whatever produces the kind of number the task needs.",
    concept:
      "With the menu covered, the choice becomes a short decision procedure. Inside the network, in hidden layers, the question is trainability: use a rectifier. ReLU is the default for feedforward and convolutional networks; GELU for transformer-style blocks; leaky ReLU when dead neurons show up or in adversarial training; tanh inside recurrent cells. Sigmoid has no place in deep hidden stacks.\n\nAt the output, the question is meaning: the function must produce what the loss and the consumer expect. One probability: sigmoid with binary cross-entropy. One class of many: softmax with categorical cross-entropy. Several independent yes/no labels on the same input (a photo can contain both a cat and a dog): one sigmoid per label. A quantity: linear with mean squared or absolute error. A bounded signed value: tanh scaled to the range.\n\nThe decision is nearly always determined by these rules. When it is not, the tie-breaker is an experiment with the validation metric, never intuition about curve shapes.",
    why:
      "Activation choice is one of the few architectural decisions with no good automatic default across all positions: the right function at the output is wrong in the middle and vice versa. A mismatch is also a silent failure: the model trains and produces numbers, but they are capped, uncomparable, or starved of gradient. Having the rules in hand turns a class of mysterious underperformance into a two-minute check.",
    how: [
      "List every layer and mark it hidden or output.",
      "For each hidden layer choose from the rectifier family by architecture: ReLU (CNN/MLP), GELU (transformer), tanh (recurrent cell state), leaky ReLU (dead-neuron or GAN settings).",
      "For the output, name the task: binary, multi-class, multi-label, regression, bounded signed. Map it to sigmoid, softmax, per-label sigmoid, linear, scaled tanh.",
      "Match the loss to the output: BCE with sigmoid, cross-entropy with softmax, MSE/MAE with linear.",
      "Train briefly and check: dead-neuron fraction per hidden layer, output range on a batch, calibration of probabilities. Adjust only what the checks flag.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Position / task", "Activation", "Loss", "Example"],
        rows: [
          ["hidden, feedforward or CNN", "ReLU", "—", "digit recogniser, product-image classifier"],
          ["hidden, transformer feedforward block", "GELU (or SwiGLU)", "—", "language model layers"],
          ["recurrent cell state", "tanh (gates: sigmoid)", "—", "LSTM for speech frames"],
          ["hidden, dead neurons or GAN", "leaky ReLU", "—", "image generator"],
          ["output, one yes/no", "sigmoid", "binary cross-entropy", "fraud, churn"],
          ["output, one of k classes", "softmax", "categorical cross-entropy", "which digit, next token"],
          ["output, several independent labels", "sigmoid per label", "BCE per label", "tags on a photo"],
          ["output, a quantity", "linear", "MSE or MAE", "price, minutes"],
          ["output, bounded signed", "tanh × range", "MSE", "steering angle"],
        ],
      },
      caption: "The decision table. Almost every network you build is a row from the top half plus a row from the bottom half.",
    },
    everyday: {
      title: "Choosing a container by what goes in it",
      text: "You pour water into a jug, carry sand in a bucket and keep coins in a purse; nobody picks a container before knowing the contents. Output activations are containers for the prediction: a probability needs one that holds 0 to 1, a price needs one with no lid, ten exclusive classes need one that divides a whole. Hidden layers are the pipes between containers, and there you pick whatever flows best.",
    },
    engineering: {
      title: "A review checklist that catches three bugs a year",
      text: "A machine-learning platform team added four lines to their model review checklist: output activation matches task; loss matches output activation; no sigmoid or tanh in feedforward hidden layers; dead-ReLU fraction logged. In the first year the checklist caught a churn model with a softmax over two classes and a sigmoid loss (training on the wrong gradient), a regression model with a sigmoid output (capped at 1), and a tagging model with softmax where labels were not exclusive (it could only ever pick one tag). None of the three would have crashed; all three would have shipped worse models.",
    },
    maths: {
      formula: "output ∘ loss pairs: (sigmoid, BCE) and (softmax, CE) and (linear, MSE) all give ∂L/∂z = prediction − target",
      meaning: "For each matched pair, the gradient at the output's pre-activation is simply the error. Mismatched pairs lose this and often train badly.",
      worked: [
        "Binary, target 1, logit z = 0.5: σ(0.5) = 0.622; gradient on z = 0.622 − 1 = −0.378 (push z up). Matched.",
        "Multi-class, target 'dog' = (0, 1, 0), softmax p = (0.705, 0.259, 0.035): gradient on logits = p − target = (0.705, −0.741, 0.035). Dog's logit is pushed up, the others down. Matched.",
        "Regression, target 50, linear y = 44: gradient = 44 − 50 = −6. Matched.",
        "Mismatched: sigmoid output with MSE, target 1, z = 5: σ = 0.993, error 0.007, times σ' = 0.0066 → gradient ≈ 0.00005. Nearly nothing, even though the prediction is slightly wrong; with BCE it would be 0.007, over a hundred times larger.",
      ],
    },
    useIt: "Run the decision table on every model you define or review. The checks take minutes and prevent silent failures: capped outputs, incomparable scores, starved gradients. When you inherit a pre-trained model, read its activations before modifying any layer so your additions match.",
    takeaways: ["Hidden layers: rectifiers (ReLU default, GELU in transformers, tanh in recurrent states, leaky ReLU for dead neurons or GANs).", "Output: sigmoid (one probability), softmax (one of many), per-label sigmoid (independent labels), linear (quantity), scaled tanh (bounded signed).", "Match the loss to the output; matched pairs give gradient = prediction − target.", "Verify with checks: dead fraction, output range, calibration; tie-break by experiment."],
    terms: [["multi-label classification", "several independent yes/no labels on one input, using one sigmoid each"], ["matched output and loss", "an activation-loss pair whose output gradient is simply prediction minus target"]],
    reflect: { q: "A model must predict both whether a parcel is damaged (yes/no) and its weight. How many outputs and which activations?", a: "Two output heads on the same hidden features: one sigmoid neuron with binary cross-entropy for damage, one linear neuron with MSE (or MAE) for weight. The losses are added, usually with a weighting so neither dominates." },
  },
};

export const M07_QUIZ: Quiz[] = [
  {
    q: "Why did ReLU replace sigmoid in hidden layers?",
    options: ["It is smoother", "Its derivative is 1 for positive inputs, so gradients do not shrink through deep stacks", "It outputs probabilities", "It has more parameters"],
    answer: 1,
    why: ["ReLU has a corner; sigmoid is smoother.", "Correct. Sigmoid's derivative is at most 0.25 and vanishes in the tails; ReLU passes gradient unchanged when active.", "ReLU is unbounded and not a probability.", "Neither has parameters."],
    reason: true,
  },
  {
    q: "Which output activation and loss suit 'which of ten digits is this?'",
    options: ["Sigmoid and MSE", "Softmax and categorical cross-entropy", "Linear and MAE", "Ten sigmoids and BCE"],
    answer: 1,
    why: ["A single sigmoid cannot choose among ten.", "Correct. One distribution over the ten exclusive classes, with its matched loss.", "A regression output cannot represent a class.", "Ten sigmoids suit independent labels, not one exclusive choice."],
  },
  {
    q: "A sigmoid hidden layer sits at z ≈ 6 for most inputs. What happens during training?",
    options: ["It learns fast because outputs are near 1", "Almost no gradient passes through: σ'(6) ≈ 0.002", "It becomes a ReLU", "Nothing changes"],
    answer: 1,
    why: ["High output is not high gradient.", "Correct. The flat tail starves everything before it of gradient.", "No.", "The layer and those before it stop learning, which is a change for the worse."],
  },
  {
    q: "What problem does leaky ReLU fix?",
    options: ["Overflow in exponentials", "Neurons that die with zero output and zero gradient", "Outputs not summing to 1", "Slow matrix multiplication"],
    answer: 1,
    why: ["Leaky ReLU has no exponential.", "Correct. A small negative-side slope keeps a trickle of gradient so neurons can recover.", "That is softmax's job.", "Unrelated."],
  },
  {
    q: "tanh(z) equals which expression?",
    options: ["σ(z) − 0.5", "2σ(2z) − 1", "σ(z)²", "max(0, z) − max(0, −z)"],
    answer: 1,
    why: ["Range would be (−0.5, 0.5), not (−1, 1).", "Correct. Scale the sigmoid's input by 2, its output by 2, shift down by 1.", "Always positive; tanh is signed.", "That equals z itself."],
  },
  {
    q: "Why subtract the maximum logit before computing softmax?",
    options: ["It changes the probabilities to be more accurate", "It prevents overflow in the exponentials without changing the result", "It makes the sum equal to 1", "It is required by cross-entropy"],
    answer: 1,
    why: ["The probabilities are identical either way.", "Correct. softmax(z − c) = softmax(z), and the largest exponential becomes e⁰ = 1.", "The division already does that.", "The loss works either way; the subtraction is for numerical safety."],
    reason: true,
  },
  {
    q: "Where is GELU most likely to be found?",
    options: ["At a regression output", "In the feedforward blocks of transformers", "As an LSTM gate", "In a logistic regression"],
    answer: 1,
    why: ["Regression outputs are linear.", "Correct. BERT, GPT-style models and most language models use GELU or a close variant there.", "Gates use sigmoid.", "Logistic regression is a single sigmoid."],
  },
  {
    q: "A regression model for delivery minutes has a sigmoid output. What is the most likely symptom?",
    options: ["It predicts negative times", "Every prediction is between 0 and 1 and the loss plateaus", "It trains faster", "It outputs probabilities that sum to 1"],
    answer: 1,
    why: ["Sigmoid cannot output negatives either.", "Correct. The output is capped and the saturated tail kills the gradient.", "It trains worse, not faster.", "A single sigmoid is not a distribution over classes."],
  },
];

export const M07_EXERCISES: Exercise[] = [
  {
    title: "Compute four activations by hand",
    kind: "calculate",
    task: "For z = 1.5, compute sigmoid, tanh, ReLU and leaky ReLU (α = 0.1), and the derivative of each at that point. Then do the same for z = −1.5. Use e^1.5 ≈ 4.48 and e^−1.5 ≈ 0.223.",
    hints: ["σ = 1 / (1 + e^(−z)); σ' = σ(1 − σ).", "tanh = (e^z − e^(−z)) / (e^z + e^(−z)); tanh' = 1 − tanh².", "ReLU' is 1 or 0; leaky ReLU' is 1 or α."],
    solution: "z = 1.5: σ = 1 / (1 + 0.223) ≈ 0.818, σ' ≈ 0.149; tanh = (4.48 − 0.223) / (4.48 + 0.223) ≈ 0.905, tanh' ≈ 0.181; ReLU = 1.5, ReLU' = 1; leaky = 1.5, leaky' = 1. z = −1.5: σ ≈ 0.182, σ' ≈ 0.149; tanh ≈ −0.905, tanh' ≈ 0.181; ReLU = 0, ReLU' = 0; leaky = −0.15, leaky' = 0.1. Note the rectifiers keep a full gradient of 1 on the positive side where the squashing functions have already dropped below 0.2.",
  },
  {
    title: "Softmax and the loss",
    kind: "calculate",
    task: "Logits for four product categories are (1.2, 0.3, 2.1, −0.5). Compute the softmax probabilities, the predicted class, and the cross-entropy loss if the true class is the first one. Then explain what happens to the probabilities if every logit is multiplied by 3.",
    hints: ["Subtract the max (2.1) first.", "Loss = −ln(p of the true class)."],
    solution: "Shifted: (−0.9, −1.8, 0, −2.6); exponentials ≈ (0.407, 0.165, 1.0, 0.074); sum ≈ 1.646; p ≈ (0.247, 0.100, 0.608, 0.045). Predicted class: the third. Loss for true class 1: −ln(0.247) ≈ 1.40. Multiplying logits by 3 sharpens the distribution: the third class rises toward about 0.93 and the others shrink, the order unchanged.",
  },
  {
    title: "Measure dead ReLUs",
    kind: "code",
    task: "Write a function dead_fraction(Z) that takes a matrix of pre-activations (rows = examples, columns = neurons) and returns the fraction of neurons that are ≤ 0 for every example. Test it on a random matrix, then on one where you set two columns to −5 everywhere. Say what you would do if a real layer reported 30%.",
    hints: ["A neuron is dead if (Z[:, j] <= 0).all().", "np.mean over the per-neuron booleans gives the fraction."],
    solution: "def dead_fraction(Z): return float(np.mean((Z <= 0).all(axis=0))). On np.random.randn(1000, 50) the fraction is 0.0 (every neuron is positive for some example); after Z[:, :2] = -5 it is 0.04 (2 of 50). At 30% in a real layer: lower the learning rate, check input scaling and initialisation (Module 9), and switch the layer to leaky ReLU or GELU so the dead units can recover.",
  },
  {
    title: "Fix the output heads",
    kind: "think",
    task: "A single model must output: (a) whether a support email is urgent, (b) which of six departments it belongs to, (c) which of twelve topic tags apply (any number), (d) the expected handling time in minutes. For each, name the output activation, the number of output neurons and the loss, and say which of the four would be wrong to implement with softmax.",
    hints: ["Exclusive choice vs independent labels.", "Quantities are unbounded."],
    solution: "(a) 1 neuron, sigmoid, binary cross-entropy. (b) 6 neurons, softmax, categorical cross-entropy. (c) 12 neurons, one sigmoid each, binary cross-entropy per tag. (d) 1 neuron, linear, MSE or MAE. Softmax would be wrong for (c), because tags are not exclusive and softmax forces them to compete for a total of 1, and wrong for (d), which is not a classification at all. (a) could technically use a 2-way softmax, but a single sigmoid is the standard equivalent.",
  },
];
