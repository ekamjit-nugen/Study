import type { Exercise, LessonBody, Quiz } from "../types";

// Module 5: How models improve. The training loop and the optimisers, one concept per lesson.
// Keys are lesson slugs: m05-<kebab of the concept title>.

export const M05_BODIES: Record<string, LessonBody> = {
  "m05-optimisation": {
    simple: "Optimisation is the search for the parameter values that make the loss as small as possible; training a model is one big optimisation problem.",
    concept:
      "Module 4 turned 'how wrong is the model' into one number, the loss, that depends on every parameter. **Optimisation** is the job of finding the parameter values that make that number smallest. Training is optimisation: nothing more, nothing less.\n\nPicture the loss as a landscape. Each parameter is one direction you can move in; the height at any point is the loss for those parameter values. With two parameters it is a real landscape of hills and valleys; with a billion it is a landscape in a billion dimensions, but the task is the same: find a low point. For a linear model with squared error the landscape is a single bowl and the bottom can be found exactly. For a neural network it is rugged, with many valleys, and the best you can do is walk downhill from a sensible start and settle somewhere good.\n\nThe walk is done by an **optimiser**: an algorithm that looks at the slope under its feet (the gradient, lesson 3.6) and takes a step. Every optimiser in this module is a different way of choosing the step.",
    why:
      "Guessing parameters at random and keeping the best would need astronomically many guesses for even a small model. Optimisation turns a hopeless search into a directed walk: at every point, the gradient says which way is down, so each step improves on the last. That is what makes models with billions of parameters trainable at all.\n\nThinking of training as optimisation also gives you a vocabulary for its failures: stuck in a shallow valley (a local minimum), oscillating across a narrow one (step too big), crawling along a flat plain (step too small or gradient vanished).",
    how: [
      "Define the objective: the loss as a function of all parameters, L(θ).",
      "Start somewhere: initial parameters, usually small random numbers.",
      "Measure the slope: compute the gradient of L at the current θ.",
      "Step: move θ a little in the downhill direction, by a rule the optimiser defines.",
      "Repeat until the loss stops falling, a step budget is used up, or validation loss turns (module 4).",
    ],
    visual: {
      kind: "flow",
      steps: ["loss landscape L(θ)", "start at random θ₀", "gradient: which way is down?", "step: θ ← θ − α·∇L", "lower loss", "repeat thousands of times", "a low point: the trained model"],
      caption: "Optimisation is a walk downhill on the loss landscape. The rest of this module is about how to take the steps.",
    },
    everyday: {
      title: "Finding the lowest point of a field blindfolded",
      text: "Blindfolded in a hilly field, you can still find a low spot: feel which way the ground slopes under your feet and step that way; repeat. You will not see the whole field, you may end up in a dip rather than the deepest valley, and if you take huge strides you will overshoot the bottom and climb the far side. Every issue in training an optimiser has a version of this walk.",
    },
    engineering: {
      title: "Two landscapes, two difficulties",
      text: "A logistics team fits a linear model of delivery time with squared error: the loss is a perfect bowl, and the exact bottom can be computed in one shot from the data with a formula. Their deep-learning colleagues train an image model with 30 million parameters: the loss is a rugged landscape where no formula exists, and they run an optimiser for 100,000 steps, watching the loss curve, adjusting the step size, and accepting a good valley rather than the global best. Same word, optimisation; radically different jobs. Knowing which landscape you are on decides the tools.",
    },
    maths: {
      formula: "θ* = argmin_θ L(θ);   iterative solution: θ_{t+1} = θ_t − α ∇L(θ_t)",
      meaning: "θ* is the parameter setting with the lowest loss. argmin means 'the argument that minimises'. The iterative rule steps against the gradient with step size α.",
      worked: [
        "One parameter, loss L(w) = (w − 3)², a bowl with its bottom at w = 3.",
        "Gradient: L′(w) = 2(w − 3). Start at w = 0: gradient −6.",
        "Step with α = 0.25: w = 0 − 0.25 × (−6) = 1.5. Loss falls from 9 to 2.25.",
        "Next: gradient 2(1.5 − 3) = −3; w = 1.5 + 0.75 = 2.25; loss 0.5625. Each step halves the distance to the bottom.",
        "After 10 steps w ≈ 2.997. Never exactly 3, but close enough; that is what 'converged' means.",
      ],
    },
    code: {
      title: "Optimising one parameter by walking downhill",
      lang: "py",
      src: `def loss(w):      return (w - 3) ** 2
def gradient(w):  return 2 * (w - 3)

w = 0.0
alpha = 0.25
for step in range(1, 11):
    w = w - alpha * gradient(w)
    print(f"step {step:>2}: w = {w:.4f}  loss = {loss(w):.5f}")`,
      lines: [
        { code: "def gradient(w):  return 2 * (w - 3)", say: "The slope of the bowl: negative left of 3, positive right of it, zero at the bottom." },
        { code: "w = w - alpha * gradient(w)", say: "The entire idea of optimisation by gradient: step against the slope." },
        { code: "print(f\"step {step:>2}: w = {w:.4f}  loss = {loss(w):.5f}\")", say: "Watching the walk: each step halves the remaining distance; the loss shrinks by a quarter each time." },
      ],
      output: "step  1: w = 1.5000  loss = 2.25000\nstep  2: w = 2.2500  loss = 0.56250\nstep  3: w = 2.6250  loss = 0.14062\nstep  4: w = 2.8125  loss = 0.03516\nstep  5: w = 2.9062  loss = 0.00879\nstep  6: w = 2.9531  loss = 0.00220\nstep  7: w = 2.9766  loss = 0.00055\nstep  8: w = 2.9883  loss = 0.00014\nstep  9: w = 2.9941  loss = 0.00003\nstep 10: w = 2.9971  loss = 0.00001",
    },
    useIt: "Whenever training misbehaves, think in landscape terms: is the step too big (bouncing), too small (crawling), is the gradient gone (flat plain), is the model stuck in a poor valley? Every optimiser setting in this module is a tool for one of those situations.",
    takeaways: ["Training = minimising the loss over the parameters.", "The loss is a landscape; the gradient is the slope; the optimiser chooses the step.", "Linear models have a bowl with an exact bottom; networks have rugged landscapes and settle for a good valley.", "Converged means close enough, not exact."],
    terms: [["optimisation", "finding the parameters that minimise the loss"], ["loss landscape", "the loss as a surface over parameter space"], ["optimiser", "the algorithm that chooses each parameter step"], ["local minimum", "a valley that is lower than its surroundings but not the lowest overall"]],
    reflect: { q: "Why does training a linear model with squared error never get 'stuck', while training a deep network can?", a: "A linear model's squared-error loss is a single bowl: every downhill walk reaches the one bottom. A deep network's loss has many valleys, ridges and flat regions, so a downhill walk can settle in a valley that is not the lowest, or stall on a plateau. Modules 5 and 9 are mostly about walking that landscape well." },
  },

  "m05-derivatives-in-model-training": {
    simple: "Training needs, for every parameter, the derivative of the loss with respect to that parameter: how much the loss would change if that one number moved.",
    concept:
      "Lesson 3.5 introduced derivatives as slopes. In training, the function is the loss and the variable is a parameter. The **derivative of the loss with respect to a parameter**, written ∂L/∂w, answers one question: if I nudge w up by a tiny amount, does the loss go up or down, and how fast?\n\nFor a linear model with squared error on one example, the answer has a clean form. The loss is (w·x + b − y)². The derivative with respect to w is 2·(w·x + b − y)·x: two, times the error, times the input that w multiplies. With respect to b it is 2·(w·x + b − y): two times the error. The pattern holds in general: the derivative for a parameter is the error signal times whatever that parameter was multiplying. A parameter that multiplied a big input gets a big derivative; one whose input was zero gets none.\n\nThese derivatives are computed for every parameter at every step. For a billion parameters that sounds impossible by hand, and it is; the chain rule and backpropagation (next lessons) make it mechanical.",
    why:
      "The derivative is the only information an optimiser has. It cannot see the landscape; it can only feel the slope at the current point, one parameter at a time. Getting the derivatives right, for all parameters, efficiently, is the central engineering problem of training, and it is why deep-learning libraries exist: their core feature is computing these derivatives automatically for any model you can write.",
    how: [
      "Write the loss for one example as a function of the parameters.",
      "Differentiate with respect to each parameter using the rules from module 3: power rule, sum rule, and (next lesson) the chain rule.",
      "Notice the structure: each derivative is the error times the parameter's input.",
      "For a batch, average the per-example derivatives.",
      "Hand the list of derivatives (the gradient) to the optimiser.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Parameter", "What it multiplies", "Derivative of (w·x + b − y)²", "With x = 3, error = −2"],
        rows: [["w", "the input x", "2 · error · x", "2 × (−2) × 3 = −12"], ["b", "the constant 1", "2 · error · 1", "2 × (−2) × 1 = −4"], ["a weight whose input is 0", "0", "2 · error · 0", "0: no update, however large the error"]],
      },
      caption: "Every derivative is the error signal times the parameter's own input. Inputs decide which parameters learn from a mistake.",
    },
    everyday: {
      title: "Adjusting a recipe after a bad cake",
      text: "The cake is too sweet (the error). Which ingredient's amount should change, and by how much? Sugar, obviously, and a lot; it multiplies sweetness directly. The flour, a little, since it dilutes. The baking time, not at all, since it does not touch sweetness. You just computed derivatives of 'sweetness error' with respect to each ingredient: the error times how much that ingredient affects the outcome.",
    },
    engineering: {
      title: "Automatic differentiation in a library",
      text: "An engineer writes a model as ordinary code: a few matrix multiplications, an activation, a loss. They never write a derivative. The library records each operation as it runs and, when asked, works backwards through the record applying the derivative rule for each operation, producing ∂L/∂θ for every one of the model's parameters. This is automatic differentiation, and it is the reason a researcher can try a new architecture in an afternoon. Under the hood it is exactly the rules of module 3, applied by a machine.",
    },
    maths: {
      formula: "L = (w·x + b − y)²;   ∂L/∂w = 2(w·x + b − y)·x;   ∂L/∂b = 2(w·x + b − y)",
      meaning: "The bracket is the error. Each partial derivative is 2 × error × the thing that parameter multiplies.",
      worked: [
        "Example: x = 3, y = 10. Parameters w = 2, b = 2. Prediction = 8, error = 8 − 10 = −2, loss = 4.",
        "∂L/∂w = 2 × (−2) × 3 = −12: increasing w lowers the loss, steeply.",
        "∂L/∂b = 2 × (−2) = −4: increasing b lowers the loss, less steeply.",
        "Check ∂L/∂w numerically: with w = 2.001, prediction 8.003, loss (−1.997)² = 3.988; change −0.012 over 0.001 = −12. ✓",
      ],
    },
    code: {
      title: "Derivatives for every parameter, checked numerically",
      lang: "py",
      src: `x, y = 3.0, 10.0
w, b = 2.0, 2.0

def loss(w, b):
    return (w * x + b - y) ** 2

error = w * x + b - y
dL_dw = 2 * error * x            # the formula
dL_db = 2 * error

h = 1e-6
num_dw = (loss(w + h, b) - loss(w - h, b)) / (2 * h)    # tiny-step check
num_db = (loss(w, b + h) - loss(w, b - h)) / (2 * h)

print("formula:", dL_dw, dL_db)
print("numeric:", round(num_dw, 4), round(num_db, 4))`,
      lines: [
        { code: "dL_dw = 2 * error * x            # the formula", say: "Error times the input w multiplies: the slope of the loss along w." },
        { code: "dL_db = 2 * error", say: "The bias multiplies a constant 1, so its derivative is just the scaled error." },
        { code: "num_dw = (loss(w + h, b) - loss(w - h, b)) / (2 * h)    # tiny-step check", say: "The gradient check from lesson 3.5. Libraries run exactly this to validate their derivative code." },
      ],
      output: "formula: -12.0 -4.0\nnumeric: -12.0 -4.0",
    },
    useIt: "You will rarely derive these by hand, but you should be able to read them: a parameter's derivative is the error signal scaled by its input. That explains why standardising inputs matters (big inputs make big derivatives), why dead inputs do not learn, and what the library is doing when you call backward().",
    takeaways: ["∂L/∂θ: how the loss changes if one parameter moves.", "For a linear model: 2 × error × the parameter's input.", "Inputs scale derivatives; zero input, zero learning.", "Libraries compute all of these automatically; the chain rule is how."],
    terms: [["∂L/∂w", "the partial derivative of the loss with respect to w"], ["error signal", "the factor (prediction − truth) that every derivative shares"], ["automatic differentiation", "a library computing derivatives of code by recording operations"], ["backward()", "the library call that computes all parameter derivatives"]],
    reflect: { q: "Two features: one ranges 0–1, the other 0–10,000. Both have the same true importance. Which weight gets the larger derivative, and what does that do to training?", a: "The 0–10,000 feature's weight: its derivative is error × input, so it is thousands of times larger. Gradient descent then takes huge steps on that weight and tiny ones on the other, zigzagging or diverging. Standardising features (lesson 3.13) puts them on equal footing." },
  },

  "m05-chain-rule": {
    simple: "The chain rule gives the derivative of a function built from other functions: multiply the derivatives of each link. It is how the loss's slope is traced back through every layer.",
    concept:
      "A model is a chain of operations: multiply by weights, add a bias, apply an activation, multiply again, compute a loss. The loss depends on the first weights only through everything that comes after. The **chain rule** says how to differentiate through such a chain: the derivative of the whole is the product of the derivatives of the links.\n\nIf y = f(u) and u = g(x), then dy/dx = (dy/du) × (du/dx). Each factor is a local question ('how does this step respond to its input?'), and the answers multiply. For a chain of ten operations there are ten factors. The rule works for any length, which is why a derivative can be traced from the loss, through every layer, back to the first parameter.\n\nThe multiplication also explains a famous problem: if several links have derivatives below 1, the product shrinks toward zero (vanishing gradients); if several are above 1, it explodes. Module 9 deals with both. The chain rule is both the engine of training and the source of its best-known failure.",
    why:
      "Without the chain rule, differentiating a network would mean expanding its entire formula, layer by layer, into one unimaginable expression and differentiating that. With it, each operation needs to know only its own derivative, and the library multiplies them together in order. That locality is what makes automatic differentiation possible and what lets you compose any operations you like into a trainable model.",
    how: [
      "Write the computation as a chain of simple steps: u = g(x), then y = f(u).",
      "Differentiate each step with respect to its own input: du/dx and dy/du.",
      "Multiply: dy/dx = dy/du × du/dx.",
      "For longer chains, keep multiplying, one factor per step, from the output back to the input.",
      "When a value feeds into several later steps, add up the contributions from each path.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "chain", detail: "x → u = w·x + b → p = sigmoid(u) → L = (p − y)²" },
        { label: "local derivatives", detail: "dL/dp = 2(p − y);   dp/du = p(1 − p);   du/dw = x" },
        { label: "chain rule", detail: "dL/dw = dL/dp × dp/du × du/dw" },
        { label: "with numbers", detail: "p = 0.7, y = 1, x = 2: 2(−0.3) × 0.7·0.3 × 2 = (−0.6) × 0.21 × 2 = −0.252" },
      ],
      caption: "Three links, three local derivatives, one product. A deep network is the same with more links.",
    },
    everyday: {
      title: "Exchange rates in a row",
      text: "You change pounds to euros at 1.15, euros to Swiss francs at 0.95, francs to yen at 170. How many yen per pound? Multiply the rates: 1.15 × 0.95 × 170 ≈ 185.7. Each rate is a local 'how much does the next thing change per unit of this thing'. The chain rule is exactly this: derivatives are rates, and rates through a chain multiply.",
    },
    engineering: {
      title: "A fifty-layer product",
      text: "A speech-recognition network has 50 layers. The derivative of the loss with respect to a weight in layer 1 is a product of 50 local derivatives. In an early version each layer's activation had a derivative of at most 0.25 (sigmoid), so the product for the first layer was around 0.25⁵⁰ ≈ 10⁻³⁰: layer 1 received no usable gradient and never learned. Switching to an activation with derivative 1 over most of its range (ReLU, module 7) and adding skip connections (module 9) brought the product back to a sensible size. The fix was a direct consequence of the chain rule's multiplication.",
    },
    maths: {
      formula: "dy/dx = (dy/du)·(du/dx);   for a chain of n steps: a product of n local derivatives",
      meaning: "Each factor is the derivative of one step with respect to its input. Multiply them from the output back to the parameter.",
      worked: [
        "Model: u = w·x + b, p = σ(u) (sigmoid), loss L = (p − y)². Take x = 2, y = 1, and suppose p = 0.7.",
        "dL/dp = 2(p − y) = 2(0.7 − 1) = −0.6.",
        "dp/du for the sigmoid is p(1 − p) = 0.7 × 0.3 = 0.21.",
        "du/dw = x = 2.",
        "dL/dw = −0.6 × 0.21 × 2 = −0.252. Increasing w raises p toward the truth and lowers the loss.",
        "Vanishing: with ten sigmoid layers in a row, the product includes ten factors of at most 0.25: ≤ 0.25¹⁰ ≈ 10⁻⁶. The first layer's gradient all but disappears.",
      ],
    },
    code: {
      title: "The chain rule through three links, checked numerically",
      lang: "py",
      src: `import math

x, y = 2.0, 1.0
w, b = 0.2, 0.4

def sigmoid(u): return 1 / (1 + math.exp(-u))
def forward(w, b):
    u = w * x + b
    p = sigmoid(u)
    return u, p, (p - y) ** 2

u, p, L = forward(w, b)
dL_dp = 2 * (p - y)
dp_du = p * (1 - p)
du_dw = x
chain = dL_dp * dp_du * du_dw                     # the chain rule

h = 1e-6
numeric = (forward(w + h, b)[2] - forward(w - h, b)[2]) / (2 * h)
print("p =", round(p, 4))
print("chain rule:", round(chain, 6), " numeric:", round(numeric, 6))`,
      lines: [
        { code: "u = w * x + b", say: "Link one: the linear step." },
        { code: "p = sigmoid(u)", say: "Link two: the activation. Its derivative p(1 − p) is at most 0.25." },
        { code: "chain = dL_dp * dp_du * du_dw                     # the chain rule", say: "Three local derivatives multiplied: the slope of the loss with respect to w." },
        { code: "numeric = (forward(w + h, b)[2] - forward(w - h, b)[2]) / (2 * h)", say: "The tiny-step check agrees, so the chain was assembled correctly." },
      ],
      output: "p = 0.69\nchain rule: -0.26527  numeric: -0.26527",
    },
    useIt: "Read any deep model as a chain and remember that gradients multiply through it. That single fact predicts vanishing and exploding gradients, explains why activations and initialisation matter, and tells you why residual connections help. When a library's backward pass fails or produces NaN, the product of local derivatives is the first place to look.",
    takeaways: ["Derivative of a chain = product of the local derivatives.", "Each operation only needs its own derivative; the library multiplies.", "Products of small factors vanish; of large factors explode.", "A value used in several places sums its contributions."],
    terms: [["chain rule", "differentiate a composition by multiplying local derivatives"], ["local derivative", "one operation's derivative with respect to its own input"], ["vanishing gradient", "a product of small derivatives shrinking toward zero"], ["exploding gradient", "a product of large derivatives growing without bound"]],
    reflect: { q: "A ten-layer network uses an activation whose derivative is exactly 1 wherever the unit is active. What happens to the chain-rule product compared with sigmoid?", a: "Active units contribute a factor of 1, so the product does not shrink layer by layer; the gradient reaching early layers stays usable. That is the practical reason ReLU (module 7) replaced sigmoid inside deep networks. Inactive units contribute 0, which brings a different problem (dead units)." },
  },

  "m05-forward-propagation": {
    simple: "Forward propagation is running an input through the model, operation by operation, to produce a prediction and then the loss, saving each intermediate value for the backward pass.",
    concept:
      "**Forward propagation** (the forward pass) is the model computing its output: take the input, apply the first operation, feed the result to the next, and so on until the prediction comes out. Then compare with the truth to get the loss. It is the same computation as inference (lesson 2.3) with one addition: during training, every intermediate value is kept, because the backward pass will need them.\n\nFor the small model of the last lesson: u = w·x + b, then p = σ(u), then L = (p − y)². Three steps, three stored values (u, p, L). For a deep network: a matrix multiplication and an activation per layer, each result stored, dozens of layers deep. Those stored values are the activations, and holding them for a whole batch is the main reason training needs far more memory than inference.\n\nThe forward pass is also where shapes must line up (lesson 2.9): each operation's output shape must match the next operation's expected input.",
    why:
      "Nothing can be learned until the model has made a prediction and been scored, so every training step starts with a forward pass. Keeping the intermediates is what makes the backward pass efficient: the chain rule needs each operation's input to compute its local derivative (the sigmoid's derivative is p(1 − p), which needs p), and recomputing them would double the work. The forward pass is half of every training step and all of every inference.",
    how: [
      "Take one example (or a batch) and the current parameters.",
      "Apply operation 1 to the input; store the result.",
      "Apply operation 2 to that result; store it. Continue through every layer.",
      "The final operation produces the prediction.",
      "Compute the loss from the prediction and the truth; store it. The forward pass is complete; the stored values are ready for the backward pass.",
    ],
    visual: {
      kind: "flow",
      steps: ["input x = 2", "u = w·x + b = 0.8 (stored)", "p = σ(u) = 0.69 (stored)", "L = (p − 1)² = 0.096 (stored)"],
      caption: "Left to right, each value feeding the next. Everything in brackets is kept for the backward pass.",
    },
    everyday: {
      title: "Cooking from a recipe, keeping the bowls",
      text: "You follow a recipe: mix dry ingredients (bowl 1), beat eggs and sugar (bowl 2), combine (bowl 3), bake (the result). Normally you wash up as you go. But if the cake comes out wrong and you want to work out which step caused it, you need to look at every bowl. Forward propagation in training is cooking without washing up: every intermediate is kept so the blame can be traced.",
    },
    engineering: {
      title: "Why training needs four times the memory",
      text: "A team can run inference on their 7B-parameter model on a 16 GB card, but training it needs far more. The forward pass on a batch of 4,000 tokens stores every layer's activations: dozens of matrices of 4,000 × 4,096 numbers each, several gigabytes in all, on top of the weights, the gradients and the optimiser state. They use 'activation checkpointing': store only some layers' activations and recompute the rest during the backward pass, trading extra compute for memory. The trade-off exists because the forward pass's stored values are what the backward pass consumes.",
    },
    maths: {
      formula: "a₀ = x;   aₖ = fₖ(aₖ₋₁; θₖ) for k = 1 … n;   ŷ = aₙ;   L = ℓ(ŷ, y)",
      meaning: "Each layer k applies its function f with its parameters θ to the previous activation a. The last activation is the prediction; the loss compares it with the truth.",
      worked: [
        "x = 2, w = 0.2, b = 0.4, y = 1.",
        "a₁ = u = 0.2 × 2 + 0.4 = 0.8.",
        "a₂ = p = σ(0.8) = 1 ÷ (1 + e⁻⁰·⁸) ≈ 0.690.",
        "L = (0.690 − 1)² ≈ 0.096.",
        "Stored: u = 0.8, p = 0.690, L = 0.096. The backward pass will reuse p for the sigmoid's derivative.",
      ],
    },
    code: {
      title: "A forward pass that keeps its intermediates",
      lang: "py",
      src: `import math

def sigmoid(u): return 1 / (1 + math.exp(-u))

def forward(x, y, params):
    w, b = params
    cache = {}                      # everything the backward pass will need
    cache["x"] = x
    cache["u"] = w * x + b          # layer 1: linear
    cache["p"] = sigmoid(cache["u"])   # layer 2: activation
    cache["loss"] = (cache["p"] - y) ** 2
    return cache

cache = forward(x=2.0, y=1.0, params=(0.2, 0.4))
for k, v in cache.items():
    print(f"{k:>4} = {v:.4f}")`,
      lines: [
        { code: "cache = {}                      # everything the backward pass will need", say: "The defining feature of a training forward pass: intermediates are kept, not discarded." },
        { code: "cache[\"u\"] = w * x + b          # layer 1: linear", say: "First operation, result stored." },
        { code: "cache[\"p\"] = sigmoid(cache[\"u\"])   # layer 2: activation", say: "Second operation, fed by the first, result stored. The backward pass needs p for the sigmoid's derivative." },
        { code: "cache[\"loss\"] = (cache[\"p\"] - y) ** 2", say: "The loss ends the forward pass." },
      ],
      output: "   x = 2.0000\n   u = 0.8000\n   p = 0.6900\nloss = 0.0961",
    },
    useIt: "Think of every model as a forward pass: a sequence of operations with shapes, each producing a stored activation during training. Memory estimates for training come from these activations; shape bugs show up here; and when debugging a model, printing the intermediate activations layer by layer is the first step.",
    takeaways: ["Forward propagation: input → layers → prediction → loss.", "Same arithmetic as inference, but intermediates are stored for the backward pass.", "Stored activations are why training needs much more memory than inference.", "Shapes must chain correctly through every operation."],
    terms: [["forward propagation / forward pass", "computing the prediction and loss from an input"], ["activation (value)", "the output of a layer during the forward pass"], ["cache", "the stored intermediates for backpropagation"], ["activation checkpointing", "recomputing some activations in the backward pass to save memory"]],
    reflect: { q: "Why is inference cheaper in memory than training, if the forward computation is identical?", a: "Inference can discard each layer's output as soon as the next layer has consumed it, so only one or two activations live at a time. Training keeps all of them for the backward pass, plus gradients and optimiser state. Same arithmetic, very different bookkeeping." },
  },

  "m05-backpropagation": {
    simple: "Backpropagation computes the derivative of the loss for every parameter in one backward sweep, applying the chain rule layer by layer from the loss back to the input.",
    concept:
      "After the forward pass stored every intermediate, **backpropagation** (backprop) walks the chain in reverse. It starts with the derivative of the loss with respect to the prediction, then asks each layer, from last to first: given the derivative with respect to your output, what is the derivative with respect to your input, and with respect to your parameters? Each answer is one chain-rule multiplication using the stored forward values. The derivative with respect to the input is passed to the layer before; the derivative with respect to the parameters is recorded as that layer's gradient.\n\nOne backward sweep yields the gradient for every parameter in the model, at a cost of roughly twice the forward pass. That efficiency is why deep learning is feasible: computing a billion derivatives by nudging each parameter separately would need a billion forward passes; backprop needs one.\n\nBackprop is not a learning rule; it is a derivative-computing procedure. The optimiser (the following lessons) decides what to do with the gradients.",
    why:
      "The chain rule says the gradient for an early parameter is a product of many local derivatives. Naively, computing it for each parameter separately repeats most of that product again and again. Backprop notices that the product is shared: everything from the loss down to a given layer is the same for all parameters in that layer and all layers before it. Computing from the loss backwards, reusing each partial product, gets every gradient with no repeated work. It is dynamic programming applied to the chain rule.",
    how: [
      "Run the forward pass, storing activations.",
      "Start at the end: compute dL/dŷ, the derivative of the loss with respect to the prediction.",
      "For the last layer, use the chain rule to get dL/d(its parameters) and dL/d(its input), using the stored activations.",
      "Pass dL/d(input) to the previous layer as its dL/d(output); repeat step 3.",
      "Continue to the first layer. Every parameter now has its gradient.",
      "Hand the gradients to the optimiser; it updates the parameters; repeat from step 1 with the next batch.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "forward (stored)", detail: "x = 2 → u = 0.8 → p = 0.69 → L = 0.096" },
        { label: "backward step 1", detail: "dL/dp = 2(p − y) = 2(0.69 − 1) = −0.62" },
        { label: "backward step 2", detail: "dL/du = dL/dp × p(1 − p) = −0.62 × 0.214 = −0.133" },
        { label: "backward step 3", detail: "dL/dw = dL/du × x = −0.133 × 2 = −0.265;   dL/db = dL/du × 1 = −0.133" },
        { label: "result", detail: "gradient [−0.265, −0.133] for one example, ready for the optimiser" },
      ],
      caption: "The same chain as the forward pass, walked backwards, each step reusing a stored value and the value passed from the step after it.",
    },
    everyday: {
      title: "Tracing blame through a relay team",
      text: "A relay team loses by two seconds. To know how much each runner contributed, you work backwards from the finish: the last runner's split explains part of it, and the rest is passed to the third runner, then to the second, then the first. Each runner's share is computed once, using what the runner after them reported. You never re-run the race per runner. That reverse accounting is backpropagation.",
    },
    engineering: {
      title: "What loss.backward() actually does",
      text: "In a typical training script three lines do the work: a forward pass, loss.backward(), optimiser.step(). The middle line is backprop. The library has recorded every operation of the forward pass in a graph; backward() walks that graph in reverse topological order, calling each operation's derivative function with the gradient flowing in and the stored inputs, accumulating ∂L/∂θ into every parameter's .grad field. For a model with 7 billion parameters this takes about twice as long as the forward pass and produces 7 billion derivatives, which the optimiser then consumes. No one on the team ever writes a derivative.",
    },
    maths: {
      formula: "δ_out = ∂L/∂ŷ;   for each layer from last to first:  ∂L/∂θₖ = δₖ · (∂aₖ/∂θₖ),   δₖ₋₁ = δₖ · (∂aₖ/∂aₖ₋₁)",
      meaning: "δₖ is the gradient flowing into layer k from above. Each layer multiplies it by its local derivatives: one with respect to its parameters (recorded), one with respect to its input (passed back).",
      worked: [
        "Forward: x = 2, w = 0.2, b = 0.4, y = 1: u = 0.8, p = 0.690, L = 0.096.",
        "δ at the prediction: dL/dp = 2(0.690 − 1) = −0.620.",
        "Through the sigmoid: dL/du = −0.620 × p(1 − p) = −0.620 × 0.214 = −0.133.",
        "Through the linear layer: dL/dw = −0.133 × x = −0.265; dL/db = −0.133.",
        "Both negative: increase w and b to lower the loss. With α = 1 one step gives w = 0.465, b = 0.533, and the loss drops to about 0.035.",
      ],
    },
    code: {
      title: "Forward, then backward by hand, then one optimiser step",
      lang: "py",
      src: `import math

def sigmoid(u): return 1 / (1 + math.exp(-u))

def forward(x, y, w, b):
    u = w * x + b
    p = sigmoid(u)
    return u, p, (p - y) ** 2

def backward(x, y, u, p):
    dL_dp = 2 * (p - y)             # derivative of the loss w.r.t. the prediction
    dL_du = dL_dp * p * (1 - p)     # back through the sigmoid
    dL_dw = dL_du * x               # back through the linear layer, to w
    dL_db = dL_du * 1               # ... and to b
    return dL_dw, dL_db

x, y = 2.0, 1.0
w, b = 0.2, 0.4
for step in range(1, 4):
    u, p, L = forward(x, y, w, b)
    gw, gb = backward(x, y, u, p)
    print(f"step {step}: loss {L:.4f}  grad ({gw:.3f}, {gb:.3f})")
    w, b = w - 1.0 * gw, b - 1.0 * gb     # optimiser step, learning rate 1.0`,
      lines: [
        { code: "dL_dp = 2 * (p - y)             # derivative of the loss w.r.t. the prediction", say: "Backprop starts at the loss and asks how it responds to the prediction." },
        { code: "dL_du = dL_dp * p * (1 - p)     # back through the sigmoid", say: "One layer back: multiply by the sigmoid's local derivative, using the stored p." },
        { code: "dL_dw = dL_du * x               # back through the linear layer, to w", say: "The parameter gradient: the incoming gradient times the input w multiplied." },
        { code: "w, b = w - 1.0 * gw, b - 1.0 * gb     # optimiser step, learning rate 1.0", say: "Backprop produced the gradients; this separate line is the optimiser using them." },
      ],
      output: "step 1: loss 0.0961  grad (-0.265, -0.133)\nstep 2: loss 0.0353  grad (-0.115, -0.057)\nstep 3: loss 0.0219  grad (-0.075, -0.037)",
    },
    useIt: "You will call backward() rather than write it, but keep the picture: one reverse sweep, each layer multiplying the gradient from above by its local derivative using stored forward values. That picture explains memory costs, why gradients vanish or explode, what 'detach' or 'no_grad' do, and why a bug in one layer's derivative silently corrupts every layer before it.",
    takeaways: ["Backprop = the chain rule applied backwards through the stored forward pass.", "One sweep gives every parameter's gradient at about twice the forward cost.", "Each layer: gradient in × local derivative → gradient to parameters (recorded) and to input (passed back).", "Backprop computes gradients; the optimiser applies them."],
    terms: [["backpropagation", "computing all parameter gradients by a reverse sweep"], ["δ (delta)", "the gradient flowing into a layer from the layers after it"], ["computational graph", "the recorded sequence of operations from the forward pass"], ["optimiser.step()", "applying the computed gradients to the parameters"]],
    reflect: { q: "If backprop needs the stored forward values, what happens to memory when the batch size doubles?", a: "Stored activations double, because there is one set per example. Weights and gradients do not change. That is why batch size is limited by memory, and why activation checkpointing trades compute for memory on large models." },
  },

  "m05-gradients-in-training": {
    simple: "In training, the gradient is the full list of parameter derivatives from one backward pass; its size, direction and health decide what every optimiser step does.",
    concept:
      "Lesson 3.6 defined the gradient; backprop (lesson 5.5) computes it. This lesson is about what to do with it and what to watch. After each backward pass there is one number per parameter: the **gradient**. Stacked together, for a 7B model, it is a vector of seven billion numbers, the same shape as the parameters themselves.\n\nThree properties matter. Direction: minus the gradient is the steepest way down from here. Size (the norm): how steep the landscape is; big gradients mean big steps, which can be good (fast) or bad (unstable). Health: gradients that are all zero (nothing learns), tiny in early layers (vanishing), huge (exploding), or NaN (a numerical failure) each signal a specific problem.\n\nGradients from a batch are the average over its examples. That average is noisy: a different batch gives a somewhat different gradient. The noise is not a bug; the next lessons use it.",
    why:
      "The gradient is the only thing the optimiser sees, so its quality decides the quality of training. Watching it is the cheapest diagnostic there is: a single number, the gradient norm, logged per step, catches exploding batches, dead layers and broken losses before the loss curve shows anything. Most training-stability techniques (clipping, normalisation, warm-up) are about keeping gradients in a healthy range.",
    how: [
      "After backward(), read each parameter's gradient; the whole set is one vector.",
      "Compute its norm: the square root of the sum of all squared entries. Log it every step.",
      "Check health: norm near zero means nothing is learning; norm exploding means the step will be wild; NaN means a numerical failure upstream.",
      "If the norm exceeds a threshold, clip: scale the whole gradient down so its norm equals the threshold, keeping the direction.",
      "Hand the (possibly clipped) gradient to the optimiser.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Gradient norm over steps", "Reading", "Action"],
        rows: [["0.5, 0.4, 0.6, 0.5 …", "healthy, steady", "none"], ["0.5, 0.4, 300, 0.5", "one exploding batch", "gradient clipping; check that batch's data"], ["0.5, 0.3, 0.1, 0.01, 0.001", "fading: learning is dying", "check learning rate, activations, vanishing gradients (module 9)"], ["0.5, 0.6, NaN", "numerical failure", "lower the learning rate; check for log(0) or division by zero"], ["0.0, 0.0, 0.0", "nothing connected", "a bug: loss not depending on parameters, frozen layers, dead units"]],
      },
      caption: "One logged number tells a story. Learn to read it before the loss curve does.",
    },
    everyday: {
      title: "The steering wheel's resistance",
      text: "Driving, you feel the road through the wheel: a steady pull is normal, a sudden violent jerk means you hit something, no resistance at all means the steering has failed. You react to the feel long before you see the consequence. The gradient norm is the feel of training: steady is good, a jerk is an exploding batch, nothing at all is a disconnected model.",
    },
    engineering: {
      title: "Clipping saves a language-model run",
      text: "A team pretraining a language model logs the gradient norm. It sits around 1.0 for days, then spikes to 50 on one step: a batch containing a long run of repeated characters produced an extreme loss. Without clipping, the parameters would have taken a step fifty times normal and the loss would have jumped, sometimes unrecoverably. With clipping at norm 1.0, the step kept its direction and normal size, and the run continued. They also flagged the batch: it came from a corrupted file. Gradient clipping is standard in every large training run for exactly this reason.",
    },
    maths: {
      formula: "‖g‖ = √(Σᵢ gᵢ²);   clipped g = g · min(1, c ÷ ‖g‖)",
      meaning: "g is the gradient vector, ‖g‖ its norm, c the clipping threshold. If the norm exceeds c the whole vector is scaled down to norm c; the direction is unchanged.",
      worked: [
        "Gradient g = [3, 4]: norm = √(9 + 16) = 5.",
        "Threshold c = 1: scale factor min(1, 1/5) = 0.2; clipped g = [0.6, 0.8], norm 1, same direction.",
        "Gradient g = [0.3, 0.4]: norm 0.5 < 1; factor min(1, 2) = 1; unchanged.",
        "Batch average: three examples give gradients [−2, 1], [−1, 3], [−3, 2]; the batch gradient is their mean [−2, 2]. Each example's gradient differs; the mean is the signal, the spread is the noise.",
      ],
    },
    code: {
      title: "Gradient norm, clipping, and batch averaging",
      lang: "py",
      src: `import math

def norm(g): return math.sqrt(sum(v * v for v in g))

def clip(g, c=1.0):
    n = norm(g)
    factor = min(1.0, c / n) if n > 0 else 1.0
    return [round(v * factor, 4) for v in g]

print(norm([3, 4]), clip([3, 4]), clip([0.3, 0.4]))

per_example = [[-2, 1], [-1, 3], [-3, 2]]
batch_grad = [sum(g[i] for g in per_example) / len(per_example) for i in range(2)]
print("batch gradient:", batch_grad)

log = [0.5, 0.4, 300, 0.5]
print("alerts:", [i for i in range(1, len(log)) if log[i] > 10 * log[i - 1]])`,
      lines: [
        { code: "def norm(g): return math.sqrt(sum(v * v for v in g))", say: "The gradient's size: one number for the whole vector." },
        { code: "factor = min(1.0, c / n) if n > 0 else 1.0", say: "Clipping: scale down only when the norm exceeds the threshold; never scale up." },
        { code: "batch_grad = [sum(g[i] for g in per_example) / len(per_example) for i in range(2)]", say: "A batch's gradient is the average of its examples' gradients." },
      ],
      output: "5.0 [0.6, 0.8] [0.3, 0.4]\nbatch gradient: [-2.0, 2.0]\nalerts: [2]",
    },
    useIt: "Log the gradient norm on every run. Clip it in any large or long training. Read the log: steady is healthy, spikes point at bad batches, decay points at vanishing gradients or a dead model, NaN means a numerical problem. The gradient is the training process's vital sign.",
    takeaways: ["The gradient is one derivative per parameter, computed by backprop, averaged over the batch.", "Its norm is the key health signal: log it every step.", "Clipping caps the norm, keeps the direction, and prevents exploding steps.", "Zero, vanishing, exploding and NaN gradients each diagnose a specific failure."],
    terms: [["gradient norm", "the length of the gradient vector"], ["gradient clipping", "scaling the gradient down to a maximum norm"], ["batch gradient", "the average of per-example gradients"], ["NaN", "'not a number': the result of a numerical failure such as log(0)"]],
    reflect: { q: "A colleague suggests clipping each gradient entry individually to ±1 instead of scaling the whole vector. What changes?", a: "Per-entry clipping changes the direction: large entries are flattened while small ones are untouched, so the step no longer points downhill as steeply as possible. Norm clipping preserves the direction and only limits the length, which is why it is the standard choice." },
  },

  "m05-gradient-descent": {
    simple: "Gradient descent is the basic optimiser: repeatedly step every parameter against its gradient, scaled by a learning rate, so the loss goes down.",
    concept:
      "All the pieces are now in place. **Gradient descent** is the loop: compute the loss, backpropagate to get the gradient, move every parameter a small step against its gradient, repeat. The step size is the learning rate α: new parameter = old parameter − α × gradient.\n\nIt works because the gradient is the direction of steepest increase, so stepping the opposite way decreases the loss, at least for a small enough step. Near the bottom of a valley the gradient shrinks, so the steps shrink too, and the parameters settle. On a bowl-shaped loss this reaches the minimum; on a rugged one it reaches a local minimum or a flat region, which may still be a good model.\n\nEverything that follows in this module is a refinement of this one rule: how much data to use per step (batch, stochastic, mini-batch), and how to make the step smarter than a fixed multiple of the gradient (momentum, RMSProp, Adam).",
    why:
      "Gradient descent is the simplest algorithm that scales to any number of parameters: one gradient computation, one vector update, per step. It needs no formula for the minimum and no knowledge of the landscape beyond the local slope, which is all backprop provides. Every model you will meet is trained by some variant of it; understanding the plain version makes every variant a small modification.",
    how: [
      "Initialise parameters θ.",
      "Forward pass: compute the loss on the training data.",
      "Backward pass: compute the gradient ∇L(θ).",
      "Update: θ ← θ − α ∇L(θ).",
      "Repeat steps 2–4 until the loss stops improving or a step budget is reached.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Step", "w", "b", "Gradient (∂w, ∂b)", "Loss"],
        rows: [["0", "0.00", "0.00", "(−51.7, −9.1)", "26.28"], ["1", "0.52", "0.09", "(−24.5, −4.3)", "5.95"], ["2", "0.76", "0.13", "(−11.6, −2.0)", "1.38"], ["3", "0.88", "0.15", "(−5.5, −0.9)", "0.35"], ["10", "0.98", "0.17", "(−0.0, 0.1)", "0.06"], ["200", "1.01", "0.04", "(−0.0, 0.0)", "0.05"]],
      },
      caption: "Fitting a line to eight noisy points with α = 0.01. Big early steps, then settling; the loss floors at 0.05 because the data is noisy.",
    },
    everyday: {
      title: "Tuning a shower",
      text: "The water is too cold. You turn the tap toward hot: a big turn when it is very cold, a small nudge when it is nearly right. If you always turned it the same large amount you would swing between scalding and freezing. The gradient is how far from right the temperature is; the learning rate is how much you turn per degree of wrongness. Gradient descent is a careful shower-tuner.",
    },
    engineering: {
      title: "The three lines of every training script",
      text: "Open any deep-learning training loop and the heart is three lines: compute the loss from a forward pass; call backward() to get gradients; call step() on the optimiser to update the parameters. A fourth line zeroes the gradients so the next batch starts fresh. Everything else in a 500-line script is data loading, logging, checkpointing and evaluation. Teams spend months on the surrounding code and on the choice of learning rate; the algorithm in the middle has not changed since the 1950s.",
    },
    maths: {
      formula: "θ_{t+1} = θ_t − α ∇L(θ_t)",
      meaning: "θ_t is the parameter vector at step t, α the learning rate, ∇L the gradient. One vector subtraction per step.",
      worked: [
        "Data: eight points with x = 1 … 8 and y ≈ x plus noise (the code below lists them). Model y = w·x + b, MSE loss. Start w = 0, b = 0: every prediction is 0, loss 26.28.",
        "Gradient at the start: ∂L/∂w = (2/8) Σ (ŷ − y)·x = (2/8)(−0.9·1 − 1.8·2 − 3.4·3 − … − 8.3·8) ≈ −51.7; ∂L/∂b = (2/8) Σ (ŷ − y) ≈ −9.1. Both negative: w and b must rise.",
        "Step 1 with α = 0.01: w = 0 − 0.01 × (−51.7) = 0.52; b = 0.09. Loss falls to 5.95: a single step removed three-quarters of it.",
        "As the fit improves the gradient shrinks and so do the steps; by step 10 the loss is 0.06 and by step 200 the parameters barely move: converged at w ≈ 1.01, b ≈ 0.04.",
      ],
      note: "The code below reproduces every number in the table.",
    },
    code: {
      title: "Plain gradient descent on a two-parameter model",
      lang: "py",
      src: `xs = [1, 2, 3, 4, 5, 6, 7, 8]
ys = [0.9, 1.8, 3.4, 3.9, 5.2, 6.1, 6.8, 8.3]      # roughly y = x, with noise
n = len(xs)

def loss(w, b):
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / n

def gradient(w, b):
    errs = [(w * x + b - y) for x, y in zip(xs, ys)]
    return (2 / n) * sum(e * x for e, x in zip(errs, xs)), (2 / n) * sum(errs)

w, b, alpha = 0.0, 0.0, 0.01
for step in range(0, 201):
    gw, gb = gradient(w, b)
    if step in (0, 1, 2, 3, 10, 200):
        print(f"step {step:>3}: w {w:.2f}  b {b:.2f}  grad ({gw:.1f}, {gb:.1f})  loss {loss(w, b):.2f}")
    w, b = w - alpha * gw, b - alpha * gb`,
      lines: [
        { code: "return (2 / n) * sum(e * x for e, x in zip(errs, xs)), (2 / n) * sum(errs)", say: "The gradient of mean squared error: error times input for w, error alone for b, averaged (lesson 5.2)." },
        { code: "w, b = w - alpha * gw, b - alpha * gb", say: "Gradient descent in one line: every parameter steps against its own gradient, scaled by the learning rate." },
        { code: "if step in (0, 1, 2, 3, 10, 200):", say: "Printing a few steps shows the shape of training: big moves, then settling." },
      ],
      output: "step   0: w 0.00  b 0.00  grad (-51.7, -9.1)  loss 26.28\nstep   1: w 0.52  b 0.09  grad (-24.5, -4.3)  loss 5.95\nstep   2: w 0.76  b 0.13  grad (-11.6, -2.0)  loss 1.38\nstep   3: w 0.88  b 0.15  grad (-5.5, -0.9)  loss 0.35\nstep  10: w 0.98  b 0.17  grad (-0.0, 0.1)  loss 0.06\nstep 200: w 1.01  b 0.04  grad (-0.0, 0.0)  loss 0.05",
    },
    useIt: "Every training loop you write or read is this: loss, backward, step. Start with plain gradient descent to understand a new problem's landscape, then move to mini-batches and Adam (the following lessons) for real models. When training fails, come back to this loop and check each of its three parts.",
    takeaways: ["θ ← θ − α ∇L, repeated: that is gradient descent.", "Steps shrink as the gradient shrinks near a minimum.", "It needs only local slope information, so it scales to any model.", "Every other optimiser is a refinement of the step."],
    terms: [["gradient descent", "repeated steps against the gradient"], ["update rule", "the formula that computes new parameters from old ones"], ["step budget", "a maximum number of updates"], ["zero the gradients", "clearing accumulated gradients before the next backward pass"]],
    reflect: { q: "In the example, the loss settles at 0.05 and never reaches 0. Has gradient descent failed?", a: "No. The data is noisy; no straight line passes through all eight points, so the minimum possible MSE is above zero. Gradient descent found that minimum. A loss of exactly zero on noisy data would mean overfitting, not success." },
  },

  "m05-learning-rate": {
    simple: "The learning rate is the step size of gradient descent: too large and training bounces or explodes, too small and it crawls; it is the single most important hyperparameter.",
    concept:
      "The update θ ← θ − α ∇L has one knob: α, the **learning rate**. It scales every step. With the gradient pointing downhill, α decides how far to go in that direction before looking again.\n\nThree regimes. Too small: each step barely moves; training takes forever and may stall on a plateau. About right: the loss falls quickly and smoothly to a good value. Too large: steps overshoot the valley floor and land on the far slope, higher than before; the loss oscillates or grows without bound, and eventually the numbers overflow to NaN.\n\nThere is no universal good value: it depends on the loss's steepness, which depends on the model, the data scale and the batch size. Practitioners search over a range (0.1, 0.01, 0.001, 0.0001) and watch the loss curve. Most modern training also changes α over time: a **warm-up** from small to the target value, then a **decay** toward zero, so early steps are cautious and late steps are fine-grained.",
    why:
      "Gradient descent only knows the slope at the current point; it does not know how far the valley floor is. The learning rate is a guess about that distance, and the guess is the difference between a run that converges in an hour and one that diverges in a minute. Because it affects every step of every parameter, no other hyperparameter has such leverage, which is why it is always the first thing to tune and the first suspect when training fails.",
    how: [
      "Pick a starting value from experience: around 0.001 for Adam, 0.01 to 0.1 for plain gradient descent on standardised data.",
      "Run briefly with values spaced by factors of ten; plot the loss curves.",
      "Choose the largest value whose loss falls smoothly; smaller is slower, larger is unstable.",
      "Add a schedule: warm up over the first few hundred steps, then decay (linear, cosine or step-wise) over the run.",
      "If the loss spikes or goes to NaN mid-run, lower α; if it plateaus early, consider raising it or checking the gradients.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Learning rate", "Loss after 5 steps", "Loss after 50 steps", "Behaviour"],
        rows: [["0.0001", "28.9", "25.6", "crawling: barely moved"], ["0.001", "25.9", "12.2", "slow but steady"], ["0.01", "0.44", "0.41", "just right: converged"], ["0.05", "exploding", "NaN", "overshoots the valley every step"]],
      },
      caption: "The same model and data under four learning rates. Factors of ten separate crawling, converging and exploding.",
    },
    everyday: {
      title: "Walking to a spot in the dark",
      text: "You are told the lamp post is ahead of you. Tiny steps get you there safely but take all night. Confident strides get you there in a minute. Giant leaps carry you past it, then past it again on the way back, never landing on it. The right stride length depends on how far the post is, and you do not know that, so you take big strides first and shorten them as you sense you are close. That is a learning-rate schedule.",
    },
    engineering: {
      title: "Warm-up and decay on a transformer",
      text: "A team training a transformer finds that starting at the target learning rate of 0.0003 diverges in the first hundred steps: the random initial parameters produce huge gradients. They add a linear warm-up from 0 to 0.0003 over 2,000 steps, then a cosine decay to near zero over the remaining 100,000. Training is stable from the first step and the final loss is 4 percent lower than a constant rate achieved, because the small late steps settle into a sharper valley. Nearly every large-model recipe includes this shape; the exact numbers are found by sweeps.",
    },
    maths: {
      formula: "θ ← θ − α ∇L;   warm-up: α_t = α_max · t ÷ T_warm;   cosine decay: α_t = α_max · ½(1 + cos(π t ÷ T))",
      meaning: "t is the step, T_warm the warm-up length, T the total steps. Warm-up rises linearly; cosine decay falls smoothly to zero.",
      worked: [
        "One-dimensional bowl L(w) = w², gradient 2w, start w = 10.",
        "α = 0.1: w → 10 − 0.1·20 = 8, then 6.4, 5.12 … shrinking by 20 percent per step. Converges.",
        "α = 0.5: w → 10 − 0.5·20 = 0. Perfect in one step (lucky: exactly the right stride).",
        "α = 1.1: w → 10 − 1.1·20 = −12, then −12 − 1.1·(−24) = 14.4, then −17.3 … growing by 20 percent per step. Diverges.",
        "Rule for this bowl: converges if α < 1 (the curvature decides); real losses have different curvatures in different directions, which is why one α rarely suits all parameters: the motivation for Adam.",
      ],
    },
    code: {
      title: "Four learning rates on the same bowl",
      lang: "py",
      src: `def run(alpha, steps=8):
    w = 10.0
    path = []
    for _ in range(steps):
        w = w - alpha * (2 * w)         # gradient of w^2 is 2w
        path.append(round(w, 2))
        if abs(w) > 1e6:
            return path + ["diverged"]
    return path

for alpha in [0.05, 0.3, 0.5, 1.1]:
    print(alpha, run(alpha))

# a schedule: warm up for 3 steps, then decay
import math
def schedule(t, T=10, T_warm=3, a_max=0.5):
    if t < T_warm:
        return a_max * (t + 1) / T_warm
    return a_max * 0.5 * (1 + math.cos(math.pi * (t - T_warm) / (T - T_warm)))
print([round(schedule(t), 3) for t in range(10)])`,
      lines: [
        { code: "w = w - alpha * (2 * w)         # gradient of w^2 is 2w", say: "The update on a simple bowl. Only alpha changes between runs." },
        { code: "for alpha in [0.05, 0.3, 0.5, 1.1]:", say: "Crawl, converge, hit it in one, diverge: the four regimes." },
        { code: "return a_max * (t + 1) / T_warm", say: "Warm-up: the learning rate ramps up linearly over the first steps." },
        { code: "return a_max * 0.5 * (1 + math.cos(math.pi * (t - T_warm) / (T - T_warm)))", say: "Cosine decay: smoothly down to zero by the end." },
      ],
      output: "0.05 [9.0, 8.1, 7.29, 6.56, 5.9, 5.31, 4.78, 4.3]\n0.3 [4.0, 1.6, 0.64, 0.26, 0.1, 0.04, 0.02, 0.01]\n0.5 [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]\n1.1 [-12.0, 14.4, -17.28, 20.74, -24.88, 29.86, -35.83, 43.0]\n[0.167, 0.333, 0.5, 0.5, 0.475, 0.406, 0.306, 0.194, 0.094, 0.025]",
    },
    useIt: "Tune the learning rate first, by factors of ten, watching the curve. Use warm-up for anything with random initialisation and large gradients early, and decay to finish well. When a run diverges, halve the rate; when it crawls, raise it or check the gradient norm. Adam (lesson 5.14) makes the choice easier but not unnecessary.",
    takeaways: ["The learning rate scales every step: the most important hyperparameter.", "Too small crawls; too large oscillates or diverges to NaN.", "Search by factors of ten; take the largest stable value.", "Schedules: warm up from small, decay to small."],
    terms: [["learning rate (α)", "the step-size multiplier in the update rule"], ["warm-up", "ramping the learning rate up over early steps"], ["decay / schedule", "lowering the learning rate over the run"], ["divergence", "the loss growing without bound because steps overshoot"]],
    reflect: { q: "Why does the right learning rate change when you switch from standardised features to raw ones with values in the thousands?", a: "Gradients scale with input values (lesson 5.2), so raw features make the loss much steeper along those weights. A step that was right before now overshoots. Standardising keeps the landscape's steepness similar in every direction, which is exactly why it makes learning rates easier to choose." },
  },

  "m05-batch-gradient-descent": {
    simple: "Batch gradient descent computes the gradient over the entire training set before each step: exact and steady, but each step costs a full pass over the data.",
    concept:
      "How much data goes into each gradient? **Batch gradient descent** (full-batch) uses all of it: every example's gradient is computed and averaged, then one parameter update is made. The gradient is the true gradient of the training loss, not an estimate, so each step points exactly downhill on the training landscape and the loss curve is smooth.\n\nThe price is time and memory. One step requires a forward and backward pass over every example, so a dataset of ten million rows gives one update per ten million examples processed. For small datasets (thousands of rows) that is fine and even ideal. For large ones it is hopeless: a model would make a handful of updates per hour.\n\nFull-batch descent is also the baseline the other two variants are measured against: stochastic (one example per step) and mini-batch (a few dozen to a few thousand) trade exactness for many more updates per pass.",
    why:
      "The gradient of the average loss is the average of the gradients, so computing it over all the data gives the exact direction. For problems small enough to afford it, that exactness means no noise, no wasted zigzagging and reliable convergence; classical statistics and many tabular models are trained this way. Understanding it makes clear what the faster variants give up: not correctness on average, but exactness per step.",
    how: [
      "Load the entire training set.",
      "Forward pass on every example; compute the average loss.",
      "Backward pass; average the gradients over all examples.",
      "Update the parameters once.",
      "Repeat. One update per epoch.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Batch (full) gradient descent", points: ["gradient over all n examples", "exact direction, smooth loss curve", "one update per pass over the data", "memory: all activations at once", "good for small datasets and convex problems"] },
      right: { title: "The alternatives (next lessons)", points: ["stochastic: 1 example per update, noisy, n updates per pass", "mini-batch: 32–4,096 examples per update, the standard", "noise helps escape poor valleys", "memory: one batch at a time", "required for large datasets"] },
      caption: "Exactness per step versus updates per pass. Full batch wins the first, loses the second.",
    },
    everyday: {
      title: "Reading every review before changing the menu",
      text: "A restaurant owner could read all 10,000 customer reviews before making any change to the menu: the decision would be perfectly informed, and made once a year. Or read a handful each morning and adjust a little daily: each change is based on less, but there are 365 of them. Full-batch descent is the once-a-year owner.",
    },
    engineering: {
      title: "Where full-batch is the right tool",
      text: "An insurer fits a pricing model with 40 parameters on 80,000 policies. The whole dataset fits in memory, the loss is convex, and a full-batch step takes 20 milliseconds. Two hundred steps converge in four seconds with a perfectly smooth loss curve, and the result is reproducible to the last digit, which the regulator appreciates. Their colleagues training an image model on 14 million photos cannot do this: one full-batch step would take an hour and need terabytes of activation memory. Same algorithm, opposite verdicts.",
    },
    maths: {
      formula: "∇L(θ) = (1/n) Σᵢ₌₁ⁿ ∇ℓᵢ(θ);   θ ← θ − α ∇L(θ);   cost per update: n forward-backward passes",
      meaning: "The exact gradient is the average over all n examples' gradients. One update costs a full pass.",
      worked: [
        "Four examples with per-example gradients for w: [−3, −1, 2, −2]. Full-batch gradient = (−3 − 1 + 2 − 2) ÷ 4 = −1.0.",
        "Update with α = 0.1: w moves by +0.1. Exactly downhill on the average loss.",
        "Dataset of 10 million examples at 1 millisecond each: one update per 10,000 seconds, about 3 hours. 1,000 updates would take four months.",
        "The same compute spent on mini-batches of 1,000 gives 10,000 updates per pass: a thousand times more steps, each approximately right.",
      ],
    },
    code: {
      title: "Full-batch descent: one update per pass",
      lang: "py",
      src: `xs = [1, 2, 3, 4, 5, 6, 7, 8]
ys = [0.9, 1.8, 3.4, 3.9, 5.2, 6.1, 6.8, 8.3]

def full_batch_gradient(w, b):
    n = len(xs)
    errs = [(w * x + b - y) for x, y in zip(xs, ys)]          # every example
    return (2 / n) * sum(e * x for e, x in zip(errs, xs)), (2 / n) * sum(errs)

w, b, alpha = 0.0, 0.0, 0.01
updates = 0
for epoch in range(100):
    gw, gb = full_batch_gradient(w, b)                        # one gradient per epoch
    w, b = w - alpha * gw, b - alpha * gb
    updates += 1
print(f"after {updates} updates: w {w:.3f}  b {b:.3f}")`,
      lines: [
        { code: "errs = [(w * x + b - y) for x, y in zip(xs, ys)]          # every example", say: "The whole dataset contributes to every gradient." },
        { code: "gw, gb = full_batch_gradient(w, b)                        # one gradient per epoch", say: "One pass over the data, one update. 100 epochs, 100 updates." },
        { code: "print(f\"after {updates} updates: w {w:.3f}  b {b:.3f}\")", say: "Smooth and exact; the next lesson gets many more updates from the same passes." },
      ],
      output: "after 100 updates: w 0.997  b 0.095",
    },
    useIt: "Use full-batch gradient descent when the data fits in memory and the loss is convex: tabular models, logistic regression, small fits where reproducibility matters. For anything large or deep, move to mini-batches; the exactness is not worth the thousandfold fewer updates.",
    takeaways: ["Full-batch: average the gradient over every example, then update once.", "Exact direction and a smooth curve; one update per epoch.", "Cost and memory scale with the whole dataset.", "Right for small, convex problems; impractical for large or deep ones."],
    terms: [["batch gradient descent", "updating once per full pass over the data"], ["convex", "a bowl-shaped loss with one minimum"], ["updates per epoch", "how many parameter changes one pass through the data yields"], ["reproducible", "the same run gives the same result every time"]],
    reflect: { q: "Full-batch descent on a convex loss is guaranteed to reach the minimum. Why is that guarantee less valuable than it sounds for deep learning?", a: "Deep-learning losses are not convex, so the guarantee does not apply; and the exact gradient of the training loss is not even what you want, since the goal is low validation loss. The noise of mini-batches helps escape poor valleys and acts as a mild regulariser. Exactness on the wrong objective is not worth its cost." },
  },

  "m05-stochastic-gradient-descent-sgd": {
    simple: "Stochastic gradient descent updates after every single example: each step uses a noisy estimate of the gradient, but there are as many updates as examples, and the noise helps.",
    concept:
      "**Stochastic gradient descent** (SGD) is the opposite extreme from full-batch: compute the gradient on one example, update, move to the next example, update again. A pass over a million examples gives a million updates instead of one.\n\nEach single-example gradient is a noisy estimate of the true gradient: it points roughly downhill on average but wobbles from example to example. So the parameters do not glide to the minimum; they jitter toward it, and the loss curve is jagged. The jitter has two effects. It makes SGD slower to settle precisely at a minimum (it keeps bouncing around it, so the learning rate must decay to let it rest). And it helps on rugged landscapes: the random kicks push the parameters out of shallow valleys and saddle points that full-batch descent would sit in.\n\nIn practice, 'SGD' usually means mini-batch SGD (next lesson), and the name stuck even when the batch is 512. Pure one-example SGD is mostly a teaching case and a tool for streaming data.",
    why:
      "Full-batch descent wastes the information in each example by waiting for all of them before acting. SGD acts immediately: if the first thousand examples already say 'w should increase', why wait for the other million to agree? The expected direction of each noisy step is still the true gradient, so on average SGD goes the right way, and it gets there with far less computation. The noise, which looks like a defect, turns out to be a feature on non-convex landscapes.",
    how: [
      "Shuffle the training set.",
      "Take one example; forward pass; compute its loss.",
      "Backward pass on that one example: a noisy gradient.",
      "Update the parameters immediately.",
      "Move to the next example. One epoch gives n updates. Decay the learning rate over time so the jitter shrinks.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "example 1", detail: "gradient [−3, 1] → step; roughly downhill" },
        { label: "example 2", detail: "gradient [−1, 3] → step; a different direction, still roughly downhill" },
        { label: "example 3", detail: "gradient [−3, 2] → step" },
        { label: "average of the three", detail: "[−2.3, 2.0]: the direction full-batch would have taken, in one step" },
        { label: "net effect", detail: "three noisy steps that together approximate one exact step, but with three chances to react" },
      ],
      caption: "Each step is a noisy guess; their sum tracks the true gradient. More steps, each less certain.",
    },
    everyday: {
      title: "Adjusting a sales pitch after every customer",
      text: "A market trader changes their patter a little after each customer: a word that worked, a joke that fell flat. Any single customer is a poor guide, and the trader sometimes over-reacts to one grumpy person. But over a day of two hundred customers, the pitch improves far faster than it would if they changed nothing until the week's sales figures arrived. The noise is real, and so is the speed.",
    },
    engineering: {
      title: "Online learning on a stream of clicks",
      text: "An ad-ranking system receives thousands of click outcomes per second and must keep its model current. Waiting for a daily full-batch retrain would leave it stale for hours. Instead it runs SGD on the live stream: every outcome (clicked or not) produces one gradient and one small update. The model drifts continuously toward current behaviour, and a sudden change in traffic (a new campaign) is reflected within minutes. The learning rate is kept small and constant so the model keeps adapting rather than settling, a deliberate use of SGD's restlessness.",
    },
    maths: {
      formula: "θ ← θ − α ∇ℓᵢ(θ)  for a single random example i;   E[∇ℓᵢ(θ)] = ∇L(θ)",
      meaning: "ℓᵢ is one example's loss. E[·] is the expected value: averaged over the random choice of example, the single-example gradient equals the full gradient, so SGD is unbiased but noisy.",
      worked: [
        "Per-example gradients for w on four examples: [−3, −1, 2, −2]. True gradient: −1.0.",
        "SGD with α = 0.1 visits them in order: w changes by +0.3, +0.1, −0.2, +0.2. Net +0.4 after four updates.",
        "Full-batch with the same α: one update of +0.1. SGD moved four times as far in the same pass, because it took four steps.",
        "The third step went uphill (+2 gradient, w decreased); the noise. On average over many passes the moves cancel to the true direction.",
        "Variance of a single-example gradient here: values −3, −1, 2, −2 around mean −1 have squared deviations 4, 0, 9, 1: variance 3.5. Averaging k examples divides this by k: the motivation for mini-batches.",
      ],
    },
    code: {
      title: "SGD: one example, one update",
      lang: "py",
      src: `import random
random.seed(0)

xs = [1, 2, 3, 4, 5, 6, 7, 8]
ys = [0.9, 1.8, 3.4, 3.9, 5.2, 6.1, 6.8, 8.3]

def example_gradient(w, b, x, y):
    e = w * x + b - y
    return 2 * e * x, 2 * e                                  # one example only

w, b, alpha = 0.0, 0.0, 0.01
updates = 0
for epoch in range(100):
    order = list(zip(xs, ys))
    random.shuffle(order)
    for x, y in order:
        gw, gb = example_gradient(w, b, x, y)
        w, b = w - alpha * gw, b - alpha * gb                # update after every example
        updates += 1
print(f"after {updates} updates: w {w:.3f}  b {b:.3f}")`,
      lines: [
        { code: "return 2 * e * x, 2 * e                                  # one example only", say: "A gradient from a single example: cheap, noisy, unbiased." },
        { code: "random.shuffle(order)", say: "Shuffling every epoch so the sequence of noisy steps does not repeat a pattern." },
        { code: "w, b = w - alpha * gw, b - alpha * gb                # update after every example", say: "Eight updates per epoch instead of one. 800 updates from the same 100 passes." },
      ],
      output: "after 800 updates: w 0.981  b -0.070",
    },
    useIt: "Use pure SGD for streaming data where the model must adapt continuously, and as the mental model for why mini-batch training works. For normal training, use mini-batches: they keep SGD's many-updates advantage while averaging away most of the noise.",
    takeaways: ["SGD: one example, one update; n updates per epoch.", "Each gradient is noisy but unbiased: right on average.", "Noise slows precise convergence but helps escape poor valleys.", "Decay the learning rate so the jitter shrinks as you approach the minimum."],
    terms: [["stochastic gradient descent (SGD)", "updating after each single example"], ["unbiased estimate", "right on average, wrong on any single try"], ["online learning", "updating continuously from a stream of examples"], ["saddle point", "a flat point that is a minimum in some directions and a maximum in others"]],
    reflect: { q: "With a constant learning rate, SGD never quite settles; the loss keeps jittering near the minimum. Is that always bad?", a: "Not for a live system that must track changing data, where constant adaptation is the goal. For a fixed dataset it is wasteful, and decaying the learning rate lets the parameters rest at the bottom. The right choice depends on whether the world the model describes is standing still." },
  },

  "m05-mini-batch-gradient-descent": {
    simple: "Mini-batch gradient descent averages the gradient over a small group of examples per step: enough updates per epoch to be fast, enough averaging to be stable, and the shape hardware likes.",
    concept:
      "Between one example and all of them lies the standard practice. **Mini-batch gradient descent** takes a batch of B examples (32, 256, 4,096 …), averages their gradients, and updates once. An epoch of n examples gives n ÷ B updates.\n\nAveraging B gradients cuts the noise: the variance of the estimate drops in proportion to B, so a batch of 64 is eight times less noisy than a single example and the loss curve is reasonably smooth while still delivering thousands of updates per pass. And a batch is a matrix: B rows of features, multiplied through the model in one tensor operation (lesson 3.10), which is exactly what GPUs do fastest. Batch size is therefore both a statistical choice and a hardware choice.\n\nLarger batches give more accurate gradients and better hardware use but fewer updates per epoch and more memory; they also tolerate a larger learning rate. Smaller batches are noisier, update more often, and often generalise slightly better. Common defaults: 32 to 256 for small models; thousands of tokens per batch for language models, limited by GPU memory.",
    why:
      "Pure SGD wastes hardware (one example at a time cannot fill a GPU) and is noisy; full-batch wastes updates. Mini-batches are the compromise that works: the gradient is accurate enough, the update count is high enough, and every batch is one big matrix multiplication. Nearly all deep learning is trained this way, and 'SGD' in papers almost always means mini-batch SGD.",
    how: [
      "Shuffle the training set each epoch.",
      "Split it into batches of B examples.",
      "For each batch: forward pass on the B examples at once (a matrix), compute the average loss.",
      "Backward pass: the average gradient over the batch.",
      "Update once per batch. Repeat for all batches; that is one epoch.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Batch size B", "Updates per epoch (n = 8,192)", "Gradient noise (relative)", "GPU use", "Memory for activations"],
        rows: [["1 (SGD)", "8,192", "1.0", "poor: cannot fill the hardware", "tiny"], ["32", "256", "0.18", "fair", "small"], ["256", "32", "0.06", "good", "moderate"], ["8,192 (full)", "1", "0 (exact)", "good, if it fits", "everything at once"]],
      },
      caption: "Noise falls as 1/√B; updates fall as 1/B. The middle rows are where training lives.",
    },
    everyday: {
      title: "Tasting a spoonful of the soup",
      text: "To judge a pot of soup you do not taste a single grain of salt (too noisy) or drink the whole pot (too much). You taste a spoonful: enough to average out the odd bits, small enough to taste often as you adjust. A mini-batch is the spoonful, and the number of spoonfuls per pot is your updates per epoch.",
    },
    engineering: {
      title: "Choosing a batch size for an image model",
      text: "A team training a product-image classifier on one GPU tries batch sizes 16, 64, 256 and 1,024 with the learning rate scaled accordingly. At 16 the GPU sits half idle and each epoch takes twice as long. At 1,024 the model runs out of memory. At 64 and 256 both train well; 256 is faster per epoch, 64 reaches a slightly better validation accuracy. They pick 128 with gradient accumulation (summing gradients over two batches of 64 before stepping) to get the memory profile of 64 with the effective batch of 128. Batch size was a tuning knob with three constraints: noise, speed and memory.",
    },
    maths: {
      formula: "∇L_B(θ) = (1/B) Σ_{i∈batch} ∇ℓᵢ(θ);   Var[∇L_B] = Var[∇ℓᵢ] ÷ B;   updates per epoch = n ÷ B",
      meaning: "The batch gradient is the average over its B examples. Averaging divides the variance by B, so the noise (standard deviation) falls as 1/√B.",
      worked: [
        "Single-example gradient variance 3.5 (from the previous lesson). With B = 4: variance 0.875, standard deviation ≈ 0.94. With B = 64: variance ≈ 0.055, standard deviation ≈ 0.23.",
        "Noise down by a factor of four needs sixteen times the batch: diminishing returns.",
        "n = 8,192, B = 64: 128 updates per epoch. B = 256: 32 updates. Same compute per epoch, four times fewer steps.",
        "Rule of thumb: when you multiply the batch size by k, multiply the learning rate by about k (or √k) to keep progress per epoch similar; the larger average supports a bigger step.",
      ],
    },
    code: {
      title: "Mini-batches: the standard training loop",
      lang: "py",
      src: `import random
random.seed(0)

xs = [1, 2, 3, 4, 5, 6, 7, 8]
ys = [0.9, 1.8, 3.4, 3.9, 5.2, 6.1, 6.8, 8.3]
B = 4

def batch_gradient(w, b, batch):
    errs = [(w * x + b - y) for x, y in batch]
    n = len(batch)
    return (2 / n) * sum(e * x for e, (x, _) in zip(errs, batch)), (2 / n) * sum(errs)

w, b, alpha = 0.0, 0.0, 0.01
updates = 0
for epoch in range(100):
    data = list(zip(xs, ys))
    random.shuffle(data)
    for start in range(0, len(data), B):
        batch = data[start:start + B]                       # B examples at a time
        gw, gb = batch_gradient(w, b, batch)
        w, b = w - alpha * gw, b - alpha * gb
        updates += 1
print(f"after {updates} updates: w {w:.3f}  b {b:.3f}")`,
      lines: [
        { code: "B = 4", say: "The batch size: a hyperparameter balancing noise, updates and memory." },
        { code: "batch = data[start:start + B]                       # B examples at a time", say: "Slicing the shuffled data into batches. In a real library this is a DataLoader." },
        { code: "return (2 / n) * sum(e * x for e, (x, _) in zip(errs, batch)), (2 / n) * sum(errs)", say: "The gradient averaged over the batch: less noisy than one example, cheaper than all." },
        { code: "w, b = w - alpha * gw, b - alpha * gb", say: "One update per batch: two per epoch here, 200 over the run." },
      ],
      output: "after 200 updates: w 1.000  b 0.043",
    },
    useIt: "Default to mini-batches. Start with 32 to 256 for small models and the largest that fits memory for large ones; scale the learning rate with the batch; use gradient accumulation when the batch you want does not fit. Remember that batch size changes both the statistics and the speed, so re-tune the learning rate when you change it.",
    takeaways: ["Mini-batch: average the gradient over B examples, update, repeat.", "Noise falls as 1/√B; updates per epoch fall as 1/B.", "A batch is a matrix: the shape GPUs process fastest.", "Scale the learning rate when scaling the batch; accumulate gradients when memory is short."],
    terms: [["mini-batch", "a group of B examples processed in one step"], ["batch size", "B, the number of examples per update"], ["gradient accumulation", "summing gradients over several batches before one update"], ["DataLoader", "the library component that shuffles and batches data"]],
    reflect: { q: "A model trains to the same loss with batch 64 in 50 epochs and batch 1,024 in 50 epochs, but the second run finishes in a quarter of the time. Why might the first still be preferred?", a: "Smaller batches take sixteen times more updates and their noise acts as a regulariser; such runs often reach slightly better validation accuracy and generalise better. If wall-clock time matters more than the last half-percent, the large batch wins; the right answer depends on which you are optimising for." },
  },

  "m05-momentum": {
    simple: "Momentum keeps a running average of past gradients and steps along that average, so progress builds up in consistent directions and cancels out in directions that flip-flop.",
    concept:
      "Plain gradient descent forgets the past: each step uses only the current gradient. On a long narrow valley, that is wasteful. The gradient points mostly across the valley (steep walls) and only slightly along it (gentle floor), so steps zigzag from wall to wall and crawl toward the bottom.\n\n**Momentum** fixes this by remembering. It keeps a velocity vector: a running average of recent gradients, with a decay factor β (typically 0.9) that weights recent gradients more. The parameters step along the velocity rather than the raw gradient. Components of the gradient that keep the same sign (along the valley) accumulate and the velocity grows; components that alternate (across the valley) cancel and the velocity stays small. The result is faster progress along the floor and less bouncing off the walls.\n\nThe name is the physics: a ball rolling downhill does not stop at every pebble; it carries momentum through small bumps and settles in the deeper valleys. The same carry-through helps escape shallow local minima and plateaus.",
    why:
      "Real loss landscapes are badly conditioned: steep in some directions, flat in others. One learning rate cannot suit both: small enough for the steep walls means crawling along the flat floor. Momentum makes the effective step adapt to consistency rather than steepness, which is often a dramatic speed-up for no extra gradient computations. It also smooths the noise of mini-batches, since random wobbles cancel in the average.",
    how: [
      "Keep a velocity vector v, the same shape as the parameters, initialised to zero.",
      "Each step: v ← β·v + ∇L. The old velocity decays by β; the new gradient is added.",
      "Update: θ ← θ − α·v.",
      "With β = 0.9, the velocity is roughly the sum of the last ten gradients: consistent directions grow up to ten-fold, alternating ones cancel.",
      "Tune β (0.9 is standard) and remember that the effective step is larger than α alone.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Plain gradient descent in a narrow valley", points: ["gradient mostly points across the valley", "each step bounces to the opposite wall", "slow progress along the floor", "must use a small α to avoid overshooting the walls"] },
      right: { title: "With momentum (β = 0.9)", points: ["across-valley components alternate sign and cancel", "along-valley components accumulate", "velocity builds along the floor: up to 10× the step", "carries through small bumps and shallow dips"] },
      caption: "Same gradients, different use. Momentum turns a zigzag into a glide.",
    },
    everyday: {
      title: "Pushing a heavy trolley",
      text: "A loaded supermarket trolley does not change direction the instant you push: it keeps rolling the way it was going and your push nudges it. Small sideways bumps in the floor barely deflect it, while a steady push in one direction builds up speed. That is momentum: steady pushes accumulate, random knocks are smoothed out, and you cross the car park faster than if the trolley stopped dead between every push.",
    },
    engineering: {
      title: "Momentum on a badly scaled problem",
      text: "A team's recommendation model has one group of parameters with gradients a hundred times steeper than the rest. With plain gradient descent they had to use a learning rate small enough for the steep group, and the rest of the model learned at a crawl: 40 epochs to converge. Adding momentum with β = 0.9 let the flat directions accumulate velocity while the steep ones kept cancelling: 9 epochs to the same loss, with no change to the model or data. Momentum, or an optimiser containing it, is now the default on every run they do.",
    },
    maths: {
      formula: "v_t = β v_{t−1} + ∇L(θ_t);   θ_{t+1} = θ_t − α v_t;   steady gradient g gives v → g ÷ (1 − β)",
      meaning: "v is the velocity, β the decay. With a constant gradient the velocity converges to g ÷ (1 − β): ten times g when β = 0.9.",
      worked: [
        "One direction with constant gradient g = 1, β = 0.9: v₁ = 1, v₂ = 1.9, v₃ = 2.71, v₄ = 3.44, … → 10. The step grows toward ten times a plain step.",
        "Another direction alternating +1, −1, +1, −1: v₁ = 1, v₂ = −0.1, v₃ = 0.91, v₄ = −0.18, … bounded near ±0.5. The zigzag is damped to half a plain step.",
        "Ratio of effective step sizes between the two directions: about 20 to 1, from the same α. The optimiser has effectively given each direction its own learning rate.",
      ],
    },
    code: {
      title: "Momentum: consistent directions build, alternating ones cancel",
      lang: "py",
      src: `beta = 0.9

def velocities(gradients):
    v, out = 0.0, []
    for g in gradients:
        v = beta * v + g
        out.append(round(v, 2))
    return out

steady = [1.0] * 12              # the valley floor: always the same direction
zigzag = [1.0, -1.0] * 6         # the valley walls: flipping every step
print("steady:", velocities(steady))
print("zigzag:", velocities(zigzag))`,
      lines: [
        { code: "v = beta * v + g", say: "The whole of momentum: decay the old velocity, add the new gradient." },
        { code: "steady = [1.0] * 12              # the valley floor: always the same direction", say: "A consistent gradient: the velocity climbs toward 10 (that is 1 ÷ (1 − 0.9))." },
        { code: "zigzag = [1.0, -1.0] * 6         # the valley walls: flipping every step", say: "An alternating gradient: the velocity stays small. Bouncing is damped." },
      ],
      output: "steady: [1.0, 1.9, 2.71, 3.44, 4.1, 4.69, 5.22, 5.7, 6.13, 6.51, 6.86, 7.18]\nzigzag: [1.0, -0.1, 0.91, -0.18, 0.84, -0.25, 0.78, -0.3, 0.73, -0.34, 0.69, -0.38]",
    },
    useIt: "Use momentum (or an optimiser that includes it) for almost everything; β = 0.9 is a safe default. Expect to lower the raw learning rate a little, since the effective step is larger. If training oscillates even with momentum, the learning rate is still too high; if it is sluggish in some directions, the next two lessons add per-parameter scaling.",
    takeaways: ["Momentum steps along a decayed running average of gradients.", "Consistent directions accumulate up to 1 ÷ (1 − β) times; alternating ones cancel.", "Faster along valleys, less bouncing off walls, smoother through noise.", "β = 0.9 is the standard; effective steps are larger than α."],
    terms: [["momentum", "stepping along an accumulated average of past gradients"], ["velocity", "the running average vector"], ["β (beta)", "the decay factor on the velocity, usually 0.9"], ["conditioning", "how differently steep a loss is in different directions"]],
    reflect: { q: "Momentum can overshoot a minimum and climb the far side before turning back. Why is that usually acceptable?", a: "Because the overshoot is small and self-correcting (the gradient reverses and the velocity decays), and the speed gained along flat directions far outweighs a little oscillation near the end. Decaying the learning rate late in training removes the residual wobble." },
  },

  "m05-rmsprop": {
    simple: "RMSProp gives every parameter its own learning rate by dividing each gradient by a running average of its recent size, so steep directions take small steps and flat ones take large steps.",
    concept:
      "Momentum helps with directions that zigzag, but it still uses one learning rate for all parameters. Some parameters see gradients in the hundreds and some in the thousandths, and no single α suits both. **RMSProp** (root mean square propagation) scales each parameter's step by the inverse of how large its gradients have recently been.\n\nIt keeps, for every parameter, a running average of the squared gradient, s ← β·s + (1 − β)·g², with β typically 0.9 or 0.99. The update divides the gradient by the square root of s: θ ← θ − α · g ÷ (√s + ε). A parameter whose gradients are usually large gets divided by a large number and takes small steps; one whose gradients are usually tiny gets divided by a tiny number and takes steps of a sensible size. Every parameter ends up moving by roughly α per step regardless of its raw gradient scale.\n\nThe ε (around 10⁻⁸) stops division by zero. RMSProp was invented for exactly the badly scaled, non-stationary problems of deep learning, and its per-parameter scaling is one half of Adam.",
    why:
      "Different parameters live on different scales: a first-layer weight on a raw pixel, a bias deep in the network, an embedding for a rare word that gets a gradient once an hour. A global learning rate must be small enough for the largest gradients and therefore starves the rest. Per-parameter scaling by recent gradient magnitude equalises progress across the model, which makes the learning rate far easier to choose and training far more robust to how features and layers are scaled.",
    how: [
      "Keep s, the same shape as the parameters, initialised to zero.",
      "Each step: s ← β·s + (1 − β)·g², element by element (g² is each entry squared).",
      "Update: θ ← θ − α · g ÷ (√s + ε), element by element.",
      "Typical values: β = 0.9 to 0.99, α = 0.001, ε = 10⁻⁸.",
      "Because steps are normalised, α means 'about how far each parameter moves per step' and is less sensitive to the problem's scale.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Parameter", "Typical gradient", "√s (recent size)", "Scaled step g ÷ √s", "Plain step with α = 0.001"],
        rows: [["w₁ (raw pixel weight)", "500", "≈ 500", "≈ 1 → moves 0.001", "0.5: far too big"], ["w₂ (deep bias)", "0.02", "≈ 0.02", "≈ 1 → moves 0.001", "0.00002: far too small"], ["w₃ (rare embedding)", "0 most steps, 3 occasionally", "small", "large when it fires → moves ≈ 0.001 or more", "near zero: never learns"]],
      },
      caption: "Dividing by recent size puts every parameter on the same footing: each moves about α per step.",
    },
    everyday: {
      title: "Volume controls on a mixing desk",
      text: "A sound engineer has a loud drum microphone and a quiet flute microphone. Turning one master volume knob cannot serve both: loud enough for the flute deafens with the drums. So each channel has its own gain, set by how loud that source usually is. RMSProp gives each parameter its own gain, set automatically from how large its gradients usually are.",
    },
    engineering: {
      title: "Rescuing rare-feature learning",
      text: "A search team's model has embeddings for ten million query terms. Common terms get gradients every batch; rare ones get a gradient a few times a day. With a global learning rate small enough for the common terms, the rare terms barely moved in a week of training. Switching to RMSProp, each rare term's s stayed tiny, so when its gradient finally arrived the step was full-sized. Rare-query relevance improved measurably within two days, and nothing else about the model changed.",
    },
    maths: {
      formula: "s_t = β s_{t−1} + (1 − β) g_t²;   θ_{t+1} = θ_t − α · g_t ÷ (√s_t + ε)",
      meaning: "s tracks the mean squared gradient per parameter; its square root is the recent gradient size. Dividing normalises the step.",
      worked: [
        "Parameter with steady gradient 500, β = 0.9: s after many steps ≈ 500² = 250,000; √s = 500; step = α × 500 ÷ 500 = α = 0.001.",
        "Parameter with steady gradient 0.02: s ≈ 0.0004; √s = 0.02; step = α × 0.02 ÷ 0.02 = 0.001. Same movement, despite a 25,000-fold difference in gradient.",
        "First step from s = 0: s = 0.1 × 500² = 25,000, √s ≈ 158, step = 0.001 × 500 ÷ 158 ≈ 0.0032. Early steps are larger than α until s warms up; Adam fixes this with bias correction.",
        "Plain descent with α = 0.001 would move the first parameter 0.5 per step (unstable) and the second 0.00002 (frozen).",
      ],
    },
    code: {
      title: "RMSProp equalises step sizes across parameters",
      lang: "py",
      src: `import math

alpha, beta, eps = 0.001, 0.9, 1e-8

def rmsprop_steps(gradients):
    s, steps = 0.0, []
    for g in gradients:
        s = beta * s + (1 - beta) * g * g
        steps.append(round(alpha * g / (math.sqrt(s) + eps), 5))
    return steps

big = [500.0] * 6        # a parameter with huge gradients
small = [0.02] * 6       # a parameter with tiny gradients
print("big:  ", rmsprop_steps(big))
print("small:", rmsprop_steps(small))
print("plain steps would be:", alpha * 500, "and", alpha * 0.02)`,
      lines: [
        { code: "s = beta * s + (1 - beta) * g * g", say: "The running average of the squared gradient, one per parameter." },
        { code: "steps.append(round(alpha * g / (math.sqrt(s) + eps), 5))", say: "The gradient divided by its recent size: the step is about alpha whatever the gradient's scale." },
        { code: "print(\"plain steps would be:\", alpha * 500, \"and\", alpha * 0.02)", say: "Without scaling: one parameter leaps 0.5, the other creeps 0.00002. RMSProp makes both move about 0.001." },
      ],
      output: "big:   [0.00316, 0.00229, 0.00192, 0.00171, 0.00156, 0.00146]\nsmall: [0.00316, 0.00229, 0.00192, 0.00171, 0.00156, 0.00146]\nplain steps would be: 0.5 and 0.02",
    },
    useIt: "Reach for per-parameter scaling whenever gradients vary widely across the model: embeddings, mixed-scale inputs, recurrent networks. In practice you will use Adam, which contains RMSProp's idea; understanding RMSProp tells you what Adam's second moment is doing and why the learning rate becomes 'about how far parameters move'.",
    takeaways: ["RMSProp divides each gradient by the root of its running mean square: a per-parameter learning rate.", "Steep parameters take small steps, flat ones large steps; all move about α.", "Makes α robust to the scale of features and layers; rescues rarely updated parameters.", "It is the second half of Adam."],
    terms: [["RMSProp", "per-parameter scaling by recent gradient magnitude"], ["second moment", "the running average of squared gradients, s"], ["ε (epsilon)", "a tiny constant preventing division by zero"], ["adaptive learning rate", "a step size that differs per parameter and changes over time"]],
    reflect: { q: "RMSProp's first steps are larger than α because s starts at zero and has not yet 'warmed up'. Why could that matter at the start of training?", a: "Early parameters are random and gradients are large and unreliable; oversized first steps can throw the model into a bad region or cause divergence. Adam's bias correction scales s up during the first steps to fix exactly this, and learning-rate warm-up (lesson 5.8) is a second guard." },
  },

  "m05-adam-optimiser": {
    simple: "Adam combines momentum (a running average of gradients) with RMSProp (a running average of squared gradients), corrects both for start-up bias, and is the default optimiser for deep learning.",
    concept:
      "**Adam** (adaptive moment estimation) keeps two running averages per parameter. The first moment m is the momentum-style average of gradients, with decay β₁ = 0.9: the direction, smoothed. The second moment v is the RMSProp-style average of squared gradients, with decay β₂ = 0.999: the recent size. The update steps along m divided by √v: smoothed direction, normalised size.\n\nBoth averages start at zero and are therefore too small in the first steps. Adam corrects this with **bias correction**: m̂ = m ÷ (1 − β₁ᵗ) and v̂ = v ÷ (1 − β₂ᵗ), which scale the early estimates up to their true expected size and then fade to no effect as t grows. The result is an optimiser that behaves sensibly from step one, needs little tuning (α = 0.001 works for a remarkable range of problems), handles badly scaled parameters, and smooths mini-batch noise.\n\nIt is not magic: it can converge to slightly worse minima than carefully tuned SGD with momentum on some vision tasks, and it uses two extra numbers per parameter (three times the memory of the parameters themselves for training state).",
    why:
      "Momentum solved zigzagging; RMSProp solved scale. Deep networks have both problems at once, plus noisy mini-batch gradients and a start from random parameters. Adam puts the two fixes together with a start-up correction, and the combination turned out to work well enough, out of the box, that it became the default for transformers, language models and most research. Its popularity is itself a reason to use it: recipes, learning rates and schedules in the literature assume it.",
    how: [
      "Initialise m = 0 and v = 0 (same shape as the parameters) and the step counter t = 0.",
      "Each step, with gradient g: t ← t + 1; m ← β₁m + (1 − β₁)g; v ← β₂v + (1 − β₂)g².",
      "Bias-correct: m̂ = m ÷ (1 − β₁ᵗ), v̂ = v ÷ (1 − β₂ᵗ).",
      "Update: θ ← θ − α · m̂ ÷ (√v̂ + ε).",
      "Defaults: α = 0.001, β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸. Combine with warm-up and decay on α for large models.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "gradient g", detail: "from backprop on this batch" },
        { label: "first moment m (momentum)", detail: "m ← 0.9·m + 0.1·g: smoothed direction" },
        { label: "second moment v (RMSProp)", detail: "v ← 0.999·v + 0.001·g²: recent size" },
        { label: "bias correction", detail: "m̂ = m ÷ (1 − 0.9ᵗ),  v̂ = v ÷ (1 − 0.999ᵗ): undo the zero start" },
        { label: "step", detail: "θ ← θ − 0.001 · m̂ ÷ (√v̂ + 10⁻⁸)" },
      ],
      caption: "Two averages, one correction, one normalised step. Every parameter gets its own smoothed, scaled update.",
    },
    everyday: {
      title: "A cruise control that learns the road",
      text: "A good cruise control does two things: it smooths your speed so you do not jerk at every small gradient change (momentum), and it applies more throttle on a steep hill and less on the flat so the car's speed stays steady whatever the road (adaptive scaling). And when you first switch it on it does not assume the road is flat just because it has no history yet; it corrects for not knowing. That is Adam.",
    },
    engineering: {
      title: "Adam as the transformer default",
      text: "A team fine-tuning a language model for customer support never tries another optimiser. Adam (in its AdamW form, next lesson) with α = 0.00002, β₁ = 0.9, β₂ = 0.98, a 500-step warm-up and linear decay is the recipe copied from the model's own paper, and it works on the first run. The memory cost is real: for their 7B model, Adam's two moment tensors add 14 billion numbers to the training state, which is why training needs far more GPU memory than inference and why 8-bit optimiser variants exist. They accept it; a run that works first time is worth the memory.",
    },
    maths: {
      formula: "m_t = β₁ m_{t−1} + (1−β₁) g_t;   v_t = β₂ v_{t−1} + (1−β₂) g_t²;   m̂ = m_t ÷ (1−β₁ᵗ);   v̂ = v_t ÷ (1−β₂ᵗ);   θ ← θ − α m̂ ÷ (√v̂ + ε)",
      meaning: "m and v are the two moments; the hats are bias-corrected versions; t is the step count. The step is the corrected direction divided by the corrected size.",
      worked: [
        "Step 1, gradient g = 2, defaults: m = 0.1 × 2 = 0.2; v = 0.001 × 4 = 0.004.",
        "Bias correction: m̂ = 0.2 ÷ (1 − 0.9) = 2.0; v̂ = 0.004 ÷ (1 − 0.999) = 4.0. The corrected estimates are exactly g and g², as they should be after one observation.",
        "Step: 0.001 × 2.0 ÷ √4.0 = 0.001 × 1.0 = 0.001. The parameter moves by α, the normalised step.",
        "Without correction the step would be 0.001 × 0.2 ÷ √0.004 ≈ 0.0032: three times too large at the start, which is RMSProp's early-step problem.",
        "After many steps with steady g = 2: m → 2, v → 4, step → 0.001 again. With noisy gradients of mean 2 and varying sign, m shrinks (cancellation) while v does not, and steps automatically become smaller: noise damped.",
      ],
    },
    code: {
      title: "Adam from scratch on one parameter",
      lang: "py",
      src: `import math

def adam_run(gradients, alpha=0.001, b1=0.9, b2=0.999, eps=1e-8):
    m = v = 0.0
    theta, steps = 0.0, []
    for t, g in enumerate(gradients, start=1):
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        m_hat = m / (1 - b1 ** t)          # bias correction
        v_hat = v / (1 - b2 ** t)
        step = alpha * m_hat / (math.sqrt(v_hat) + eps)
        theta -= step
        steps.append(round(step, 5))
    return steps

print("steady gradient 2:  ", adam_run([2.0] * 5))
print("steady gradient 500:", adam_run([500.0] * 5))
print("noisy +2/-2:        ", adam_run([2.0, -2.0, 2.0, -2.0, 2.0]))`,
      lines: [
        { code: "m = b1 * m + (1 - b1) * g", say: "First moment: the momentum average of gradients." },
        { code: "v = b2 * v + (1 - b2) * g * g", say: "Second moment: the RMSProp average of squared gradients." },
        { code: "m_hat = m / (1 - b1 ** t)          # bias correction", say: "Scaling up the early estimate so step one is already sensible." },
        { code: "step = alpha * m_hat / (math.sqrt(v_hat) + eps)", say: "Direction divided by size: about alpha per step for any gradient scale, smaller when the gradient's sign keeps flipping." },
      ],
      output: "steady gradient 2:   [0.001, 0.001, 0.001, 0.001, 0.001]\nsteady gradient 500: [0.001, 0.001, 0.001, 0.001, 0.001]\nnoisy +2/-2:         [0.001, -5e-05, 0.00034, -5e-05, 0.0002]",
    },
    useIt: "Start every deep-learning project with Adam (or AdamW) at α = 0.001 (lower, around 10⁻⁵ to 10⁻⁴, for fine-tuning pretrained models), with warm-up and decay. Budget for its memory: two extra tensors the size of the parameters. If a mature recipe for your task uses SGD with momentum, try that too; otherwise Adam is the right default.",
    takeaways: ["Adam = momentum (first moment) + RMSProp (second moment) + bias correction.", "Per-parameter, normalised, smoothed steps; sensible from step one.", "Defaults α = 0.001, β₁ = 0.9, β₂ = 0.999 work across most problems.", "Costs two extra parameter-sized tensors of training state."],
    terms: [["Adam", "adaptive moment estimation: momentum plus RMSProp with bias correction"], ["first moment (m)", "the running average of gradients"], ["second moment (v)", "the running average of squared gradients"], ["bias correction", "scaling early moment estimates to undo the zero initialisation"]],
    reflect: { q: "In the noisy +2/−2 example, Adam's steps shrink toward zero while a steady gradient of 2 gives constant steps. Why is this the behaviour you want?", a: "A gradient that keeps flipping sign means the parameter is bouncing across a valley or responding to noise; small steps are right. A steady gradient means a consistent downhill direction; full steps are right. Adam reads the difference from m (which cancels) versus v (which does not)." },
  },

  "m05-adamw-optimiser": {
    simple: "AdamW is Adam with weight decay applied directly to the parameters rather than mixed into the gradient, which makes regularisation work properly with adaptive steps; it is the standard for transformers.",
    concept:
      "Models overfit (lesson 4.9) partly by growing some weights very large. A classic cure is **weight decay**: at every step, shrink every parameter slightly toward zero, so only weights that the data keeps pushing up stay large. With plain gradient descent, weight decay and 'L2 regularisation' (adding the squared weights to the loss) are the same thing.\n\nWith Adam they are not. If decay is added to the loss, it enters the gradient and gets divided by √v like everything else, so parameters with large gradients are barely decayed and parameters with small gradients are decayed heavily: the opposite of what regularisation intends. **AdamW** fixes this by applying the decay separately, straight to the parameters, after the adaptive step: θ ← θ − α·(m̂ ÷ (√v̂ + ε)) − α·λ·θ. Every parameter shrinks by the same fraction, independent of its gradient history.\n\nThe change is one line, and it measurably improves generalisation. AdamW is the optimiser behind nearly every modern transformer and language model; when a paper says 'Adam', check whether it means AdamW.",
    why:
      "Adam's per-parameter scaling is excellent for the data-driven part of the update and wrong for the regularisation part: regularisation should treat all weights equally. Decoupling the two restores the intended behaviour, so weight decay can be tuned independently of the learning rate and does what it says. Because large models rely on weight decay to generalise, this detail matters at scale, which is why AdamW displaced Adam as the default.",
    how: [
      "Run the Adam update exactly as in the previous lesson: moments, bias correction, normalised step.",
      "Separately, shrink the parameters: θ ← θ − α·λ·θ, where λ is the weight-decay coefficient (0.01 to 0.1 is common).",
      "Do not add λ·θ to the gradient; that is the coupled version that breaks under adaptive scaling.",
      "Usually exclude biases and normalisation parameters from decay; decay the weight matrices.",
      "Tune λ with the validation loss like any regulariser: more decay for small data or large models.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Adam with L2 in the loss (coupled)", points: ["gradient ← g + λθ", "then divided by √v", "parameters with big gradients: decay almost cancelled", "parameters with tiny gradients: decay dominates", "regularisation strength varies per parameter by accident"] },
      right: { title: "AdamW (decoupled)", points: ["adaptive step uses g only", "then θ ← θ − αλθ for every parameter", "every weight shrinks by the same fraction", "λ and α can be tuned independently", "the standard for transformers and language models"] },
      caption: "One line moved from the gradient to the update. The effect on generalisation is real.",
    },
    everyday: {
      title: "A gym membership fee",
      text: "Imagine a club that charged its monthly fee as a percentage of how much you used the equipment: heavy users pay almost nothing extra, light users pay the most. That is weight decay coupled into an adaptive update: backwards. AdamW charges everyone the same flat fee regardless of usage, which is what a fee is supposed to do.",
    },
    engineering: {
      title: "The one-line change in a fine-tuning recipe",
      text: "A team fine-tunes a transformer and gets validation loss 0.62 with Adam plus L2 regularisation in the loss. A colleague swaps in AdamW with λ = 0.01, decaying only the weight matrices, and reruns with everything else identical: validation loss 0.58, and the gap between training and validation loss narrows. The model's large attention weights, which had gradients big enough to neutralise coupled decay, are now regularised like everything else. Every recipe in the team's cookbook now says AdamW.",
    },
    maths: {
      formula: "Adam step: θ ← θ − α m̂ ÷ (√v̂ + ε);   AdamW adds: θ ← θ − α λ θ   (applied separately)",
      meaning: "λ (lambda) is the weight-decay coefficient. The decay is a fixed fraction αλ of each parameter per step, independent of its gradient.",
      worked: [
        "α = 0.001, λ = 0.01: each step shrinks every decayed weight by 0.001 × 0.01 = 0.00001, i.e. 0.001 percent. Over 100,000 steps: a factor of about e⁻¹ ≈ 0.37 unless the data pushes back.",
        "A weight of 2.0 with no gradient pressure decays to 2.0 × 0.99999¹⁰⁰⁰⁰⁰ ≈ 0.74. A weight the data keeps pushing up stays large; decay only wins where the data is indifferent.",
        "Coupled version for a parameter with √v̂ ≈ 500 (large gradients): effective decay 0.00001 ÷ 500: negligible. For one with √v̂ ≈ 0.01: effective decay 0.001: a hundred times stronger than intended. AdamW gives both 0.00001.",
      ],
    },
    code: {
      title: "Adam versus AdamW on two parameters with different gradient scales",
      lang: "py",
      src: `import math

def run(coupled, grad_scale, steps=2000, alpha=0.001, lam=0.01, b1=0.9, b2=0.999, eps=1e-8):
    theta, m, v = 1.0, 0.0, 0.0
    for t in range(1, steps + 1):
        g = grad_scale * (1 if t % 2 else -1)          # zero-mean noise: the data is indifferent
        if coupled:
            g = g + lam * theta                        # L2 mixed into the gradient
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        step = alpha * (m / (1 - b1 ** t)) / (math.sqrt(v / (1 - b2 ** t)) + eps)
        theta -= step
        if not coupled:
            theta -= alpha * lam * theta               # AdamW: decay applied directly
    return round(theta, 4)

for scale in [0.01, 100.0]:
    print(f"gradient scale {scale:>6}: coupled Adam -> {run(True, scale)}   AdamW -> {run(False, scale)}")`,
      lines: [
        { code: "g = grad_scale * (1 if t % 2 else -1)          # zero-mean noise: the data is indifferent", say: "A parameter the data does not care about: its gradient flips sign. Regularisation should shrink it." },
        { code: "g = g + lam * theta                        # L2 mixed into the gradient", say: "The coupled version: decay goes through Adam's scaling and is distorted by the gradient scale." },
        { code: "theta -= alpha * lam * theta               # AdamW: decay applied directly", say: "The decoupled version: the same fractional shrink for every parameter." },
        { code: "for scale in [0.01, 100.0]:", say: "Two parameters, gradients 10,000× apart. AdamW shrinks both equally; coupled Adam shrinks one and ignores the other." },
      ],
      output: "gradient scale   0.01: coupled Adam -> 0.1905   AdamW -> 0.9785\ngradient scale  100.0: coupled Adam -> 0.998   AdamW -> 0.9785",
      note: "With coupled decay, the tiny-gradient weight is shrunk by 80 percent while the large-gradient weight loses 0.2 percent. AdamW decays both by the same 2 percent over 2,000 steps.",
    },
    useIt: "Use AdamW rather than Adam whenever you use weight decay, which for transformers and large models is always. Decay the weight matrices, not biases or normalisation parameters. Tune λ (0.01–0.1) on validation loss. When reproducing a paper, check which optimiser its 'Adam' really was.",
    takeaways: ["Weight decay shrinks parameters toward zero each step; it fights overfitting.", "Coupling decay into Adam's gradient distorts it per parameter; AdamW applies it separately.", "AdamW: one extra line, consistently better generalisation.", "The default optimiser for modern transformers and language models."],
    terms: [["weight decay", "shrinking parameters by a small fraction every step"], ["L2 regularisation", "adding the sum of squared weights to the loss"], ["decoupled", "applied directly to the parameters, outside the adaptive step"], ["λ (lambda)", "the weight-decay coefficient"]],
    reflect: { q: "Why are biases and normalisation scale parameters usually excluded from weight decay?", a: "They do not multiply inputs, so large values do not create the sharp, overfitted functions that decay is meant to prevent; shrinking them toward zero just handicaps the model (a bias of zero is not 'simpler' in any useful sense). Decay the weight matrices, where the overfitting capacity lives." },
  },

  "m05-the-complete-model-training-loop": {
    simple: "The training loop puts everything together: batches, forward pass, loss, backward pass, optimiser step, validation, checkpoints and early stopping, repeated until the model is good.",
    concept:
      "Every lesson in Stage 1 was a part; this is the whole. A **training loop** is the program that turns data and an untrained model into a trained one. Its core is four lines repeated for every batch: forward pass to get the loss; backward pass to get the gradients; optimiser step to update the parameters; zero the gradients for the next batch. Around that core: shuffle and batch the data each epoch; after each epoch (or every N steps) evaluate on the validation set without updating; log both losses and the gradient norm; save a checkpoint and keep the best; stop early when validation stops improving; adjust the learning rate on a schedule.\n\nThe same loop trains a two-parameter line and a 70-billion-parameter language model. What changes is scale: the data loader streams from disk, the forward and backward passes run on many GPUs, checkpoints are gigabytes, and a run takes weeks. The structure is identical, and so are the diagnostics: the two loss curves and the gradient norm.\n\nThe Stage 1 project asks you to build this loop by hand once. After that you will use a library's version, but you will know what every line does.",
    why:
      "Models are not trained by a formula; they are trained by this loop, and nearly every training failure is a failure of one of its parts: a leaked validation set, gradients not zeroed, a learning rate without warm-up, a checkpoint never saved, stopping too late. Knowing the loop as a sequence of named parts lets you find which one broke. It is also the shared vocabulary of every training script, paper and library you will meet.",
    how: [
      "Prepare: split data into training and validation; standardise features with training statistics; initialise the model and the optimiser (AdamW, with a learning-rate schedule).",
      "For each epoch: shuffle the training set and cut it into mini-batches.",
      "For each batch: forward pass → loss; backward pass → gradients; clip the gradient norm; optimiser step; zero the gradients; log the loss, the gradient norm and the learning rate.",
      "After each epoch: compute the validation loss with gradients disabled; log it; save a checkpoint; track the best validation loss.",
      "Stop when validation has not improved for a patience of a few epochs or the step budget is reached; restore the best checkpoint; evaluate once on the test set.",
    ],
    visual: {
      kind: "flow",
      steps: ["split + standardise", "init model + optimiser + schedule", "epoch: shuffle, batch", "batch: forward → loss → backward → clip → step → zero", "epoch end: validate, log, checkpoint", "early stop? no → next epoch", "yes → restore best, test once"],
      caption: "The whole of Stage 1 in one diagram. Every box is a lesson you have done.",
    },
    everyday: {
      title: "A training season",
      text: "An athlete's season is a loop: daily sessions (batches) with feedback from a coach (loss and gradient), small adjustments to technique (steps), a weekly time trial on a course they never train on (validation), a log book (checkpoints and metrics), and a coach who stops the block when times stop improving rather than pushing into injury (early stopping). The competition at the end is the test set: run once, no retakes.",
    },
    engineering: {
      title: "The same loop at two scales",
      text: "A data scientist trains a churn model on a laptop: 40 features, 80,000 rows, mini-batches of 256, AdamW at 0.001 with cosine decay, early stopping after 3 idle epochs; the run takes 90 seconds and the script is 60 lines. A research team pretrains a language model: 2 trillion tokens streamed from object storage, batches of 4 million tokens across 1,024 GPUs, AdamW at 0.0003 with 2,000-step warm-up and cosine decay, gradient clipping at 1.0, checkpoints every hour, validation every 1,000 steps; the run takes six weeks. Both scripts have the same seven parts in the same order; the researchers' version just has more code around each one.",
    },
    maths: {
      formula: "per batch:  L = (1/B) Σ ℓ(f(xᵢ; θ), yᵢ);   g = ∇_θ L;   g ← g · min(1, c ÷ ‖g‖);   θ ← AdamW(θ, g, α_t);   α_t from the schedule",
      meaning: "Everything from the module in one line per operation: batch loss, gradient, clipping, the optimiser's update, the scheduled learning rate.",
      worked: [
        "Dataset 8,192 rows, batch 64: 128 steps per epoch. 30 epochs: 3,840 steps. Warm-up 200 steps, then cosine decay to step 3,840.",
        "Step 1: α = 0.001 × 1 ÷ 200 = 0.000005. Step 200: α = 0.001. Step 2,020 (halfway through decay): α = 0.001 × ½(1 + cos(π/2)) = 0.0005. Step 3,840: α ≈ 0.",
        "Validation after each epoch: losses 1.9, 1.2, 0.9, 0.78, 0.71, 0.68, 0.67, 0.67, 0.68, 0.70. Best at epoch 7 (0.67, tie with 8); patience 3 stops after epoch 10; restore epoch 7.",
        "Test loss on the restored checkpoint: 0.69, reported once.",
      ],
    },
    code: {
      title: "The complete loop, by hand, on a two-parameter model",
      lang: "py",
      src: `import random, math
random.seed(42)

# data: y = 2x + 1 with noise; standardised x
raw = [(x, 2 * x + 1 + random.gauss(0, 1.0)) for x in range(-20, 21)]
random.shuffle(raw)
train, valid = raw[:32], raw[32:]
mu = sum(x for x, _ in train) / len(train)
sd = math.sqrt(sum((x - mu) ** 2 for x, _ in train) / len(train))
std = lambda x: (x - mu) / sd                               # training statistics, reused for validation

def loss_and_grad(w, b, batch):
    errs = [(w * std(x) + b - y) for x, y in batch]
    n = len(batch)
    return (sum(e * e for e in errs) / n,
            (2 / n) * sum(e * std(x) for e, (x, _) in zip(errs, batch)),
            (2 / n) * sum(errs))

w, b = 0.0, 0.0
m = [0.0, 0.0]; v = [0.0, 0.0]; t = 0                       # AdamW state
alpha, lam, B, patience = 0.5, 0.001, 8, 3
best, best_params, since = float("inf"), (w, b), 0

for epoch in range(1, 101):
    random.shuffle(train)
    for s in range(0, len(train), B):
        batch = train[s:s + B]
        _, gw, gb = loss_and_grad(w, b, batch)                # forward + backward
        t += 1
        params, grads, new = [w, b], [gw, gb], []
        for i in range(2):                                    # AdamW step
            m[i] = 0.9 * m[i] + 0.1 * grads[i]
            v[i] = 0.999 * v[i] + 0.001 * grads[i] ** 2
            mh, vh = m[i] / (1 - 0.9 ** t), v[i] / (1 - 0.999 ** t)
            new.append(params[i] - alpha * mh / (math.sqrt(vh) + 1e-8) - alpha * lam * params[i])
        w, b = new
    val_loss, _, _ = loss_and_grad(w, b, valid)               # validation: no update
    if val_loss < best:
        best, best_params, since = val_loss, (w, b), 0        # checkpoint the best
    else:
        since += 1
    if epoch % 10 == 0 or since >= patience:
        print(f"epoch {epoch:>3}  val loss {val_loss:.3f}  best {best:.3f}")
    if since >= patience:
        print("early stop; restoring best"); break

w, b = best_params
print(f"final: w {w:.3f} (per standardised x)  b {b:.3f}")`,
      lines: [
        { code: "std = lambda x: (x - mu) / sd                               # training statistics, reused for validation", say: "Standardisation with training-set statistics, applied identically everywhere (lesson 3.13)." },
        { code: "_, gw, gb = loss_and_grad(w, b, batch)                # forward + backward", say: "The forward pass and the backward pass for one mini-batch (lessons 5.4, 5.5, 5.11)." },
        { code: "new.append(params[i] - alpha * mh / (math.sqrt(vh) + 1e-8) - alpha * lam * params[i])", say: "The AdamW update: bias-corrected moments, normalised step, decoupled decay (lessons 5.14, 5.15)." },
        { code: "val_loss, _, _ = loss_and_grad(w, b, valid)               # validation: no update", say: "Validation after each epoch, gradients ignored (lesson 4.8)." },
        { code: "best, best_params, since = val_loss, (w, b), 0        # checkpoint the best", say: "The best checkpoint is kept (lesson 2.12)." },
        { code: "print(\"early stop; restoring best\"); break", say: "Early stopping with patience (lesson 4.8). The restored parameters are the model." },
      ],
      output: "epoch  10  val loss 42.655  best 42.655\nepoch  20  val loss 1.342  best 1.342\nepoch  30  val loss 0.905  best 0.867\nearly stop; restoring best\nfinal: w 24.140 (per standardised x)  b 1.148",
      note: "The slope is 24.1 per standardised unit because x was divided by its standard deviation (≈ 12.2); 24.1 ÷ 12.2 ≈ 1.98, the true slope of 2. The intercept recovers the true 1 within the noise. The validation loss floors near the noise variance, 1.0, as it should.",
    },
    useIt: "Build this loop once by hand (the Stage 1 project), then use a library's. When any training run misbehaves, walk the loop: is the validation set clean, are features standardised with training statistics, are gradients zeroed and clipped, is the learning rate warmed up and decayed, is the best checkpoint kept, does early stopping fire? Every bug lives in one of those boxes.",
    takeaways: ["The loop: batch → forward → loss → backward → clip → step → zero; validate, checkpoint, early-stop per epoch.", "Identical structure from a line fit to a language model.", "Standardise with training statistics; validate without updating; keep the best checkpoint; test once.", "Diagnose failures by walking the loop's parts."],
    terms: [["training loop", "the program that repeatedly updates a model from batches of data"], ["zero the gradients", "clearing accumulated gradients before each backward pass"], ["no_grad / eval mode", "running the model for validation without recording gradients"], ["step budget", "the maximum number of updates in a run"]],
    reflect: { q: "In the code, the final slope is reported 'per standardised x'. What must a serving system store alongside w and b to make predictions on raw x?", a: "The training mean and standard deviation (mu and sd) used to standardise x. Without them, the model's w applies to the wrong scale. Preprocessing statistics are part of the model artefact (lesson 2.10), not a detail of the training script." },
  },
};

export const M05_QUIZ: Quiz[] = [
  {
    q: "What does an optimiser actually see when it decides a step?",
    options: ["The whole loss landscape", "Only the gradient at the current parameters (and its own running statistics)", "The validation loss", "The test set"],
    answer: 1,
    why: ["It never sees the landscape; that is why it must walk.", "Correct. Local slope plus whatever history it keeps (momentum, second moments).", "Validation is for you, not the optimiser.", "Never."],
  },
  {
    q: "A chain of eight sigmoid layers: each local derivative is at most 0.25. What is the maximum chain-rule product reaching layer 1?",
    options: ["2", "0.25", "0.25⁸ ≈ 0.000015", "8 × 0.25 = 2"],
    answer: 2,
    why: ["No.", "That is one layer.", "Correct. Derivatives multiply through the chain, so the gradient reaching early layers vanishes.", "They multiply, not add."],
    reason: true,
  },
  {
    q: "Why does training need far more memory than inference for the same model?",
    options: ["Training uses bigger weights", "The forward pass stores every activation for backprop, plus gradients and optimiser state", "Inference skips the first layers", "The loss function is large"],
    answer: 1,
    why: ["The weights are the same.", "Correct. Activations for the whole batch, a gradient per parameter, and Adam's two moments per parameter.", "No.", "The loss is one number."],
  },
  {
    q: "Backpropagation is:",
    options: ["A learning rule that decides step sizes", "A procedure that computes every parameter's gradient in one reverse sweep", "Another name for gradient descent", "A way to initialise weights"],
    answer: 1,
    why: ["That is the optimiser's job.", "Correct. Chain rule applied backwards through the stored forward pass; the optimiser then uses the result.", "Gradient descent uses the gradients backprop provides.", "No."],
  },
  {
    q: "Loss goes 2.0, 1.1, 0.6, then 3.4, 19, NaN. Most likely cause?",
    options: ["Learning rate too small", "Learning rate too large: steps overshoot and diverge", "Too much data", "Batch size too small"],
    answer: 1,
    why: ["Too small would crawl, not explode.", "Correct. Overshooting grows the loss each step until the numbers overflow.", "Data volume does not cause divergence.", "Smaller batches add noise, not runaway growth."],
    reason: true,
  },
  {
    q: "Going from batch size 64 to 1,024 (same data, same epochs). Which is true?",
    options: ["16× more updates per epoch", "Gradient noise falls by about 4× and updates per epoch fall 16×", "The gradient becomes exact", "Memory use falls"],
    answer: 1,
    why: ["Fewer updates, not more.", "Correct. Noise scales with 1/√B (√16 = 4); updates with 1/B.", "Only the full dataset gives the exact gradient.", "Activation memory grows with the batch."],
  },
  {
    q: "A gradient component alternates +1, −1 every step. Under momentum with β = 0.9, its velocity:",
    options: ["Grows toward 10", "Stays small, near ±0.5", "Becomes exactly zero", "Grows without bound"],
    answer: 1,
    why: ["That is what a steady gradient does.", "Correct. Alternating signs cancel in the running average; the zigzag is damped.", "Not exactly zero; it oscillates with a small amplitude.", "No."],
  },
  {
    q: "What does Adam's second moment v do to a parameter whose gradients are consistently huge?",
    options: ["Makes its steps huge", "Divides its step by a large √v so it moves about α like everyone else", "Ignores it", "Sets it to zero"],
    answer: 1,
    why: ["The opposite.", "Correct. Per-parameter normalisation: steep parameters take small steps.", "No.", "No."],
  },
  {
    q: "Why does AdamW exist?",
    options: ["Adam was too slow", "Weight decay mixed into Adam's gradient is distorted by per-parameter scaling; AdamW applies it directly", "Adam cannot handle mini-batches", "AdamW uses less memory"],
    answer: 1,
    why: ["Speed is the same.", "Correct. Decoupled decay shrinks every weight by the same fraction, as regularisation should.", "Adam handles them fine.", "Same memory."],
  },
  {
    q: "Where in the training loop is the validation set used?",
    options: ["In every batch's gradient", "After each epoch, to compute a loss without updating parameters, for checkpoint selection and early stopping", "Only at the very end", "To standardise the features"],
    answer: 1,
    why: ["Never in gradients; that would be training on it.", "Correct. Measured, not learned from; it decides when to stop and which checkpoint to keep.", "That is the test set.", "Standardisation uses training statistics."],
  },
];

export const M05_EXERCISES: Exercise[] = [
  {
    title: "Backpropagate through a two-layer chain by hand",
    kind: "calculate",
    task: "Model: u = w·x + b, p = sigmoid(u), L = (p − y)². Take x = 1, y = 0, w = 1, b = 0. Compute the forward pass (u, p, L), then dL/dp, dL/du, dL/dw, dL/db. Then take one gradient-descent step with α = 2 and recompute the loss. (sigmoid(1) ≈ 0.731.)",
    hints: ["dp/du = p(1 − p).", "The truth is 0, so the loss wants p to fall: expect negative updates to w and b."],
    solution: "u = 1, p ≈ 0.731, L ≈ 0.534. dL/dp = 2(0.731 − 0) = 1.462. dp/du = 0.731 × 0.269 ≈ 0.197. dL/du ≈ 0.288. dL/dw = 0.288 × 1 = 0.288; dL/db = 0.288. Step: w = 1 − 2 × 0.288 = 0.424; b = −0.576. New u = −0.152, p ≈ 0.462, L ≈ 0.213. The loss fell from 0.534 to 0.213.",
  },
  {
    title: "Implement momentum and compare",
    kind: "code",
    task: "Write Python that minimises L(w₁, w₂) = 50·w₁² + w₂² (a narrow valley: steep in w₁, flat in w₂) from (1, 1) with plain gradient descent and with momentum (β = 0.9), both at α = 0.01, for 200 steps. Print the final point and the loss for each. Which reaches the minimum (0, 0) faster, and in which coordinate?",
    hints: ["Gradient is (100·w₁, 2·w₂).", "Plain descent crawls in w₂ (gradient small) while being stable in w₁; momentum accumulates in w₂."],
    solution: "def grad(w): return [100 * w[0], 2 * w[1]]\ndef loss(w): return 50 * w[0] ** 2 + w[1] ** 2\nw = [1.0, 1.0]\nfor _ in range(200):\n    g = grad(w); w = [w[i] - 0.01 * g[i] for i in range(2)]\nprint('plain', [round(x, 4) for x in w], round(loss(w), 5))\nw, v = [1.0, 1.0], [0.0, 0.0]\nfor _ in range(200):\n    g = grad(w); v = [0.9 * v[i] + g[i] for i in range(2)]; w = [w[i] - 0.01 * v[i] for i in range(2)]\nprint('momentum', [round(x, 4) for x in w], round(loss(w), 5))\n\nPlain descent: w₁ reaches ~0 quickly but w₂ is still ≈ 0.018 after 200 steps (it shrinks by only 2% per step). Momentum: w₂ is driven to ≈ 0 (the consistent gradient accumulates ~10×) while w₁ oscillates briefly and settles. Momentum wins, in the flat coordinate.",
  },
  {
    title: "Design a learning-rate schedule",
    kind: "think",
    task: "You are training for 10,000 steps with AdamW. Propose a schedule (warm-up length, peak rate, decay shape) for (a) fine-tuning a pretrained transformer on 2,000 labelled examples and (b) training a small model from scratch on standardised tabular data. Justify each number in a sentence.",
    hints: ["Pretrained models want small peaks (10⁻⁵ to 10⁻⁴) to avoid wrecking what they know.", "From-scratch models tolerate larger rates; warm-up protects against large early gradients."],
    solution: "(a) Warm-up 300 steps (3%), peak 2 × 10⁻⁵, linear decay to zero at 10,000, weight decay 0.01 on matrices only: small peak protects pretrained weights; warm-up guards the first noisy steps; linear decay is the convention from the original fine-tuning recipes. (b) Warm-up 200 steps, peak 10⁻³ (Adam's default works on standardised data), cosine decay to 10⁻⁵, weight decay 0.01: larger rate because the model starts random and has nothing to protect; cosine gives fine late steps for a sharp minimum.",
  },
  {
    title: "Find the bug in a training loop",
    kind: "think",
    task: "A loop reports training loss falling to 0.02 and validation loss stuck at 1.9. On inspection: features were standardised using the full dataset's mean and sd; gradients are zeroed after the optimiser step; the model is evaluated on validation with dropout still active; checkpoints are saved every epoch but the last one is deployed. List every problem and its fix.",
    hints: ["Four separate issues are described.", "Which ones explain the gap between 0.02 and 1.9?"],
    solution: "1. Standardising with the full dataset leaks validation statistics into training; fix: compute mean and sd on the training set only. 2. Zeroing after the step is fine as long as it happens before the next backward pass; if it is zeroed after step and again never before backward, it is fine; the common bug is never zeroing, which accumulates gradients; verify the order is backward → step → zero (or zero → backward → step). 3. Dropout active during validation makes validation loss pessimistic and noisy; fix: switch the model to evaluation mode. 4. Deploying the last checkpoint ignores early stopping; fix: track the best validation loss and restore that checkpoint. The 0.02 vs 1.9 gap is mainly overfitting (lesson 4.9) made worse by dropout-at-eval and no best-checkpoint selection; also add regularisation or stop earlier.",
  },
];
