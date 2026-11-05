import type { Exercise, LessonBody, Quiz } from "../types";

// Module 8: Neural network architecture. One concept per lesson.
// Keys are lesson slugs: m08-<kebab of the concept title in map.ts>.

export const M08_BODIES: Record<string, LessonBody> = {
  "m08-neural-networks": {
    simple: "A neural network is layers of neurons where each layer's outputs are the next layer's inputs; together they turn raw numbers into a prediction through a chain of learned transformations.",
    concept:
      "Modules 6 and 7 built one neuron and chose its activation. A **neural network** is many of them arranged in layers. The first layer reads the raw input; every later layer reads the outputs of the layer before it; the last layer produces the prediction. Every neuron in a layer sees the same inputs but has its own weights, so each learns to respond to a different pattern.\n\nThe network is one big function from input to output, built from small identical parts. Its parameters are all the weights and biases of all the neurons, often millions of them. Training (Module 5) adjusts them together so the whole chain produces the right outputs, and the intermediate layers end up computing features nobody designed: edges, then shapes, then objects, as Module 1 described.\n\nThis module takes the network apart layer by layer: what the input, hidden and output layers do, how neurons connect, how a forward pass flows, why depth and width matter, how many parameters there are, and what training and inference look like for the whole thing.",
    why:
      "One neuron draws one flat boundary. Real tasks need curved boundaries, interactions and features built from features. Stacking layers with non-linear activations gives exactly that (lesson 7.2): each layer bends the representation a little more, and the composition of many small bends can trace any shape. Layers also share work: a feature computed once in an early layer is reused by every neuron above it, which is far cheaper than each output neuron rediscovering it.\n\nThe layered structure is also what makes networks computable: each layer is one matrix multiplication plus an activation, which hardware does extremely fast.",
    how: [
      "The input layer holds the raw numbers for one example, say 784 pixel values.",
      "Hidden layer 1: each of its neurons computes a weighted sum over all 784 inputs plus a bias, then an activation. The layer outputs one number per neuron.",
      "Hidden layer 2 does the same over layer 1's outputs, and so on for as many hidden layers as the design has.",
      "The output layer computes the final scores and applies the task's output activation (softmax for ten digits).",
      "During training, the loss at the output is sent backwards through the same layers to adjust every weight; during inference, only the forward pass runs.",
    ],
    visual: {
      kind: "flow",
      steps: ["input layer: 784 pixels", "hidden layer 1: 128 ReLU neurons", "hidden layer 2: 64 ReLU neurons", "output layer: 10 softmax neurons", "prediction: '7' with probability 0.96"],
      caption: "A small digit classifier. Each arrow is a full set of connections; each box is one matrix multiply and an activation.",
    },
    everyday: {
      title: "An assembly line for decisions",
      text: "A car factory does not have one worker who builds a car. Stations each do one transformation: press panels, weld, paint, fit. Each station's output is the next station's input, and the car emerges at the end. A network is an assembly line for numbers: raw pixels go in, each layer transforms them a little, and a prediction comes out. The stations learned their jobs from examples rather than from a manual.",
    },
    engineering: {
      title: "Reading a model summary",
      text: "A developer joins a team and runs the framework's summary on their churn model. It prints four layers: an input of 42 customer features, a dense layer of 128 ReLU units (5,504 parameters), a dense layer of 32 ReLU units (4,128 parameters), and an output of one sigmoid unit (33 parameters). Total 9,665 parameters. From that one printout they know the architecture, can estimate the compute per prediction (about ten thousand multiplications), can see that the output matches a binary task, and can spot that the first layer holds most of the parameters, so that is where regularisation will matter. This module is what makes that printout readable.",
    },
    maths: {
      formula: "a⁽⁰⁾ = x ;   a⁽ˡ⁾ = f⁽ˡ⁾(W⁽ˡ⁾ a⁽ˡ⁻¹⁾ + b⁽ˡ⁾) for l = 1 … L ;   ŷ = a⁽ᴸ⁾",
      meaning: "a⁽ˡ⁾ is the vector of layer l's outputs, W⁽ˡ⁾ its weight matrix, b⁽ˡ⁾ its biases, f⁽ˡ⁾ its activation. The input is layer 0's output; the prediction is the last layer's.",
      worked: [
        "Tiny network: 2 inputs, hidden layer of 2 ReLU neurons, 1 sigmoid output. x = (1, 2).",
        "W⁽¹⁾ = [[1, −1], [0.5, 0.5]], b⁽¹⁾ = (0, −0.5): z⁽¹⁾ = (1 − 2 + 0, 0.5 + 1 − 0.5) = (−1, 1); a⁽¹⁾ = ReLU = (0, 1).",
        "W⁽²⁾ = [[2, 3]], b⁽²⁾ = (−1): z⁽²⁾ = 0 + 3 − 1 = 2; ŷ = σ(2) ≈ 0.88.",
        "Parameters: layer 1 has 2×2 + 2 = 6, layer 2 has 1×2 + 1 = 3; total 9. Every one of them was involved in producing 0.88.",
      ],
    },
    code: {
      title: "A whole network in a dozen lines",
      lang: "py",
      src: `import numpy as np

def relu(z):    return np.maximum(0.0, z)
def sigmoid(z): return 1 / (1 + np.exp(-z))

layers = [
    (np.array([[1.0, -1.0], [0.5, 0.5]]), np.array([0.0, -0.5]), relu),     # hidden
    (np.array([[2.0, 3.0]]),              np.array([-1.0]),      sigmoid),  # output
]

def forward(x):
    a = x
    for W, b, f in layers:
        a = f(W @ a + b)
    return a

print(forward(np.array([1.0, 2.0])))     # [0.88079708]`,
      lines: [
        { code: "layers = [", say: "A network is a list of layers; each layer is a weight matrix, a bias vector and an activation." },
        { code: "a = x", say: "The input is the first 'activation'." },
        { code: "a = f(W @ a + b)", say: "One layer: weighted sums for all its neurons, plus biases, through the activation. Repeated for each layer." },
        { code: "return a", say: "After the last layer, a is the prediction." },
      ],
      output: "[0.88079708]",
      note: "Frameworks add convenience and speed; the computation is this loop.",
    },
    useIt: "You will read, build and debug networks as lists of layers: shapes, activations, parameter counts. Every architecture in later stages (convolutional, recurrent, transformer) is a variation on which layers are used and how they connect; the forward loop above is the common skeleton.",
    takeaways: ["A network is layers of neurons; each layer's output is the next layer's input.", "The whole thing is one function with millions of parameters, trained together.", "Each layer is one matrix multiply plus an activation.", "Reading a model summary means reading layers, shapes and parameter counts."],
    terms: [["neural network", "a stack of layers of neurons forming one learned function"], ["layer", "a group of neurons that all read the previous layer's outputs"], ["forward pass", "running the input through every layer to get the prediction"]],
    reflect: { q: "Two neurons in the same layer receive identical inputs. Why do they not compute the same thing?", a: "Because their weights differ. They start from different random values and training pushes them apart as each becomes useful for a different pattern. If they did start identical they would stay identical, which is why initialisation is random (Module 9)." },
  },

  "m08-input-layer": {
    simple: "The input layer is the raw data as a fixed-length list of numbers; it has no weights, and its size and scaling are decided by how you prepare the data.",
    concept:
      "The **input layer** is not really a layer of neurons; it is the vector of numbers that represents one example. For a 28×28 grey image it is 784 values between 0 and 1. For a customer it might be 42 features: age, tenure, monthly spend, one-hot encoded plan type. For text, it is token ids that a later embedding layer turns into vectors (Stage 3).\n\nIt has no parameters. Its job is to be the right shape and the right scale. The shape is fixed by the architecture: every example must provide exactly the same number of inputs in the same order. The scale matters because the first hidden layer's weighted sums add inputs together; if one input ranges over thousands and another over fractions, the big one dominates and training struggles. Inputs are therefore normalised: scaled to similar ranges, often mean 0 and standard deviation 1 per feature.\n\nEverything the network can ever know about an example passes through this vector. What is left out (a feature not included) can never be used; what is encoded badly (a category as an arbitrary number) misleads every layer above.",
    why:
      "Networks compute with numbers of a fixed shape. The world provides images of different sizes, text of different lengths and records with missing fields. The input layer is the contract between the messy world and the fixed network: this many numbers, in this order, in this range. Most data-preparation work in a machine-learning project exists to honour that contract, and most 'the model is bad' investigations end at the input: a feature leaking the answer, a category encoded as if it were ordered, a scale a thousand times off.",
    how: [
      "Decide the features: which measurements the model may see. Exclude anything unavailable at prediction time or that leaks the label.",
      "Encode non-numbers: categories as one-hot vectors (one 1 among zeros) or as learned embeddings; dates as cyclical features; text as token ids.",
      "Handle missing values: fill with a typical value and add a 'was missing' flag, or drop the example.",
      "Scale each feature: subtract the training mean and divide by the training standard deviation, or map to [0, 1]. Save those statistics for inference.",
      "Assemble the vector in a fixed order and feed it to the first hidden layer.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Raw field", "Encoding", "Input numbers", "Why"],
        rows: [
          ["age = 34", "standardise: (34 − 40) / 12", "−0.5", "similar scale to other features"],
          ["plan = 'premium' (of basic/standard/premium)", "one-hot", "0, 0, 1", "no false ordering between plans"],
          ["signup month = December", "cyclical: sin, cos of 2π·12/12", "0.0, 1.0", "December is next to January"],
          ["28×28 image", "pixels / 255", "784 values in [0, 1]", "consistent range"],
          ["income missing", "fill with median + flag", "0.0, 1", "the network can learn what 'missing' means"],
        ],
      },
      caption: "The input layer is these columns laid end to end. Every decision here shapes what the network can learn.",
    },
    everyday: {
      title: "A form with fixed boxes",
      text: "A passport application has fixed boxes in a fixed order: surname here, date of birth there, a photo of exactly this size. The office can process millions of forms because every form has the same shape. Write your date of birth in the surname box and everything downstream goes wrong. The input layer is the form; data preparation is filling it in correctly.",
    },
    engineering: {
      title: "The feature that was a hundred times too big",
      text: "A delivery-time model trained poorly for a week. Its inputs were distance in metres (tens of thousands), hour of day (0 to 23) and item count (1 to 10). The first layer's weighted sums were dominated by distance; the other features' weights could barely move at a learning rate that kept distance stable. Standardising every feature (subtract mean, divide by standard deviation, with statistics saved from the training set and reused at inference) fixed training in one run. The same team later caught a leak: 'actual courier assigned' was in the inputs, which is not known at prediction time. Input discipline is half of model quality.",
    },
    maths: {
      formula: "x_std = (x − μ) / σ   per feature, with μ and σ computed on the training set only",
      meaning: "μ is the feature's mean, σ its standard deviation (Module 3). After standardising, each feature has mean 0 and standard deviation 1, so no feature dominates the first layer's sums.",
      worked: [
        "Distance over the training set: μ = 12,000 m, σ = 8,000 m. A distance of 20,000 m → (20,000 − 12,000) / 8,000 = 1.0.",
        "Hour of day: μ = 13, σ = 5. Hour 18 → (18 − 13) / 5 = 1.0.",
        "Both features are now 1.0: equally far above typical, and the first layer's weights can treat them on equal terms.",
        "At inference a new distance of 4,000 m uses the same μ and σ: (4,000 − 12,000) / 8,000 = −1.0. Never recompute statistics on new data.",
      ],
    },
    code: {
      title: "Building the input vector",
      lang: "py",
      src: `import numpy as np

# statistics computed once on the training set
mu    = np.array([12000.0, 13.0, 3.0])     # distance m, hour, item count
sigma = np.array([8000.0, 5.0, 2.0])
plans = ["basic", "standard", "premium"]

def input_vector(distance_m, hour, items, plan):
    numeric = (np.array([distance_m, hour, items]) - mu) / sigma
    one_hot = np.array([1.0 if plan == p else 0.0 for p in plans])
    return np.concatenate([numeric, one_hot])

print(input_vector(20000, 18, 5, "premium"))   # [1. 1. 1. 0. 0. 1.]`,
      lines: [
        { code: "mu    = np.array([12000.0, 13.0, 3.0])     # distance m, hour, item count", say: "Training-set statistics, saved with the model. They never change at inference." },
        { code: "numeric = (np.array([distance_m, hour, items]) - mu) / sigma", say: "Standardise each numeric feature so they share a scale." },
        { code: "one_hot = np.array([1.0 if plan == p else 0.0 for p in plans])", say: "A category becomes a 1 in its own position; no plan is 'bigger' than another." },
        { code: "return np.concatenate([numeric, one_hot])", say: "Fixed order, fixed length: six numbers, every time." },
      ],
      output: "[1. 1. 1. 0. 0. 1.]",
    },
    useIt: "Every model you train starts with this: choose features available at prediction time, encode categories without false order, fill and flag missing values, standardise with saved statistics, and fix the order. Mismatches between training-time and inference-time input preparation are among the most common production bugs; keep the preparation code shared between both.",
    takeaways: ["The input layer is the example as a fixed-length vector; it has no weights.", "Features must be available at prediction time and must not leak the label.", "Encode categories as one-hot or embeddings; standardise numeric features with training statistics.", "Same preparation code at training and inference."],
    terms: [["input layer", "the vector of numbers representing one example"], ["one-hot encoding", "representing a category as a vector with a single 1"], ["standardisation", "scaling a feature to mean 0 and standard deviation 1"], ["leakage", "an input that contains information about the label that would not be available at prediction time"]],
    reflect: { q: "Why must μ and σ come from the training set and not from each new batch at inference?", a: "The network learned weights assuming inputs scaled by the training statistics. Rescaling with different statistics changes what each input value means, so the same customer would get a different prediction depending on who else was in the batch." },
  },

  "m08-hidden-layers": {
    simple: "Hidden layers are the layers between input and output; they build intermediate features nobody specified, each one a little more abstract than the last.",
    concept:
      "A **hidden layer** is any layer that is neither the input nor the output. It is 'hidden' only in the sense that its values are not shown to the user: nobody asked for them, and they are not part of the prediction. They are the network's working notes.\n\nEach hidden layer transforms the previous layer's representation into a new one. Early hidden layers respond to simple, local patterns in the input: a stroke in a digit image, a pair of correlated customer features. Later ones combine those into larger patterns. Because every hidden neuron has a non-linear activation, each layer can express combinations ('this and that but not the other') that no single weighted sum could.\n\nThe number of hidden layers is the network's depth; the number of neurons in each is its width (lesson 8.9). Both are hyperparameters: chosen by the designer, not learned. A network with no hidden layer is logistic or linear regression; one hidden layer can already approximate any function given enough neurons; several hidden layers do it far more efficiently.",
    why:
      "Raw inputs are rarely in a form where a single weighted sum can make the decision. Pixels do not indicate a '7'; 'pixel 312 is dark' is almost meaningless alone. Hidden layers exist to translate the raw input, step by step, into a representation where the final decision is easy: by the last hidden layer, a '7' is a point far from every other digit, and the output layer just draws lines between regions.\n\nThey also give reuse: a hidden feature like 'a vertical stroke on the right' serves the detectors for 1, 4, 7 and 9 at once.",
    how: [
      "Layer 1 reads the input vector and computes its neurons' weighted sums and activations; its outputs are the first set of learned features.",
      "Layer 2 reads those features and computes combinations of them; its outputs are more abstract features.",
      "Each further hidden layer repeats this, building features of features.",
      "The output layer reads the last hidden layer, which by now holds features chosen so that the final decision is simple.",
      "During training, every hidden layer receives gradient from the layers above it and adjusts its features to be more useful to them.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Input", detail: "784 pixel brightnesses: no single one means anything" },
        { label: "Hidden 1 (128)", detail: "stroke detectors: 'dark diagonal in the top left', 'horizontal bar mid-height'" },
        { label: "Hidden 2 (64)", detail: "part detectors: 'closed loop at the top', 'long vertical on the right'" },
        { label: "Output (10)", detail: "'loop on top + vertical right' → 9; 'bar on top + diagonal' → 7" },
      ],
      caption: "What each hidden layer tends to learn in a digit classifier. Nobody specified the strokes; they emerge because they help the layer above.",
    },
    everyday: {
      title: "Rough work on the side of the page",
      text: "Solving a long division, you write intermediate numbers in the margin: the partial products, the remainders. Nobody asked for them; the question wants the final answer. But you could not get there without them, and each line builds on the one before. Hidden layers are the margin: the intermediate quantities the network needs on the way to the answer.",
    },
    engineering: {
      title: "Looking at what a hidden layer learned",
      text: "An e-commerce team trains a network on product images to predict the category. Curious, they visualise what the first hidden layer's neurons respond to by finding the image patches that activate each neuron most. Neuron 17 lights up for horizontal wood grain; neuron 44 for fabric weave; neuron 91 for metallic shine. Layer two's neurons combine them: one fires for 'wood grain plus four thin vertical structures' (table legs). The team never programmed any of it, and the visualisation becomes a debugging tool: when a later model confuses sofas with beds, they find a hidden neuron responding to 'large rectangular cushion' that both share.",
    },
    maths: {
      formula: "h⁽¹⁾ = f(W⁽¹⁾x + b⁽¹⁾) ;   h⁽²⁾ = f(W⁽²⁾h⁽¹⁾ + b⁽²⁾) ;   …",
      meaning: "Each hidden layer applies its own weights, biases and activation to the previous layer's output h. Each h is a vector whose length is that layer's width.",
      worked: [
        "Input x of length 784; hidden layer 1 of width 128: W⁽¹⁾ is 128 × 784, h⁽¹⁾ has 128 entries.",
        "Hidden layer 2 of width 64: W⁽²⁾ is 64 × 128, h⁽²⁾ has 64 entries.",
        "One digit image passes through 784 → 128 → 64 numbers before the output layer sees 64 features instead of 784 pixels.",
        "Without the activation f, h⁽²⁾ = W⁽²⁾W⁽¹⁾x + … would be one 64 × 784 linear map: the two hidden layers would be one (lesson 6.8).",
      ],
    },
    useIt: "Design hidden layers by starting from a known-good shape for the data type (two or three dense layers of a few hundred units for tabular data; convolutional stacks for images; transformer blocks for text) and adjusting by validation results. Inspect hidden activations when debugging: dead units, saturated units, or units that respond to a leaked feature all show up there.",
    takeaways: ["Hidden layers sit between input and output and hold the network's intermediate features.", "Early layers detect simple local patterns; later layers combine them.", "Depth and width are design choices; the features themselves are learned.", "Visualising hidden activations is a debugging and interpretation tool."],
    terms: [["hidden layer", "a layer between the input and the output, computing learned intermediate features"], ["representation", "the vector of values a layer produces for an input; what the example 'looks like' to the next layer"]],
    reflect: { q: "If one hidden layer can approximate any function, what does a second hidden layer add in practice?", a: "Efficiency and learnability. Features built in layer one are reused by every neuron in layer two, so complex functions need far fewer total neurons than one enormous layer would, and gradient descent finds good hierarchical features more easily than one flat layer of them." },
  },

  "m08-output-layer": {
    simple: "The output layer turns the last hidden features into the prediction, with as many neurons as the task has outputs and the activation the task needs.",
    concept:
      "The **output layer** is the last layer. Its neurons produce the numbers the user or the loss function actually consumes. Its size and activation are dictated by the task, not by design taste (lesson 7.10): one sigmoid neuron for a yes/no probability, k softmax neurons for one of k classes, one linear neuron per predicted quantity, one sigmoid per label for independent tags.\n\nIt reads the last hidden layer, which training has shaped so that the output's job is easy: ideally a linear separation of classes or a linear read-out of a quantity. In that sense the whole network is a feature extractor with a simple classifier or regressor bolted on the end, and that is how practitioners often use it: keep a trained network's hidden layers and replace only the output layer to adapt it to a new task.\n\nThe output layer is also where the loss attaches. The pairing of output activation and loss (sigmoid with binary cross-entropy, softmax with categorical cross-entropy, linear with squared error) is what makes the first backward step simply 'prediction minus target'.",
    why:
      "The internal representation of a network is arbitrary: 64 numbers that mean something only to the layers around them. Someone has to translate those into a decision in the world's terms. The output layer is that translation, and because its meaning is fixed by the task, it is the one layer whose shape you can read off the problem statement before writing any code.",
    how: [
      "Count the outputs the task needs: 1 for binary or a single quantity, k for k classes, m for m independent labels or m quantities.",
      "Create that many neurons reading the last hidden layer.",
      "Apply the task's activation: sigmoid, softmax, linear, or per-label sigmoid.",
      "Attach the matched loss. Frameworks often fuse softmax or sigmoid into the loss for numerical stability, in which case the layer outputs raw logits.",
      "At inference, convert the output to the decision: threshold a probability, take the argmax of a distribution, or report the quantity.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Task", "Output neurons", "Activation", "Decision rule"],
        rows: [
          ["spam or not", "1", "sigmoid", "p > threshold"],
          ["which digit (0–9)", "10", "softmax", "argmax"],
          ["tags on a photo (12 possible)", "12", "sigmoid each", "each p > its threshold"],
          ["delivery minutes", "1", "linear", "the number"],
          ["x and y of a landmark", "2", "linear", "the pair"],
          ["next token (vocabulary 50,000)", "50,000", "softmax", "argmax or sample"],
        ],
      },
      caption: "The output layer is read off the task. The hidden layers are where the design freedom lives.",
    },
    everyday: {
      title: "The last person before the customer",
      text: "In a kitchen, many cooks prepare components, but one person plates the dish and hands it over. The plate must match the order: a soup in a bowl, a steak on a plate. The output layer is the plating station: it takes whatever the kitchen produced and presents it in the form the order demands.",
    },
    engineering: {
      title: "Swapping the head",
      text: "A medical-imaging team has a network trained for months to classify chest X-rays into 14 findings (14 sigmoid outputs). A new project needs a severity score from 0 to 10. They keep every hidden layer, which already extracts useful anatomical features, delete the 14-neuron output layer, and add one linear neuron trained with squared error on a few thousand scored scans. Training takes an afternoon because only the new head and a light touch of the top layers need to change. Replacing the output layer, 'the head', is the standard way to reuse a trained network.",
    },
    maths: {
      formula: "ŷ = g(W⁽ᴸ⁾ h⁽ᴸ⁻¹⁾ + b⁽ᴸ⁾) ;   with matched loss: ∂L/∂z⁽ᴸ⁾ = ŷ − t",
      meaning: "g is the output activation; h⁽ᴸ⁻¹⁾ the last hidden layer; z⁽ᴸ⁾ the output logits. For sigmoid+BCE, softmax+CE and linear+MSE the gradient at the logits is the prediction minus the target.",
      worked: [
        "Last hidden layer h = (0.0, 1.0, 2.0) with 3 features; 10-class output: W⁽ᴸ⁾ is 10 × 3, b⁽ᴸ⁾ has 10 entries; parameters 10·3 + 10 = 40.",
        "Suppose the logits come out as z = (…, 2.0 for class 7, 0.5 for class 1, …) and softmax gives p₇ = 0.96, p₁ = 0.02.",
        "Target is class 7: gradient on logit 7 = 0.96 − 1 = −0.04 (push up slightly); on logit 1 = 0.02 − 0 = 0.02 (push down slightly). The network is nearly right, so the corrections are small.",
        "Had the target been class 1: gradient on logit 7 = 0.96 (push down hard), on logit 1 = 0.02 − 1 = −0.98 (push up hard).",
      ],
    },
    useIt: "Define the output layer from the task statement before anything else; everything upstream is negotiable, the output is not. Use head-swapping to adapt pre-trained networks. In production, keep the decision rule (threshold, argmax, sampling) outside the model so it can be tuned without retraining.",
    takeaways: ["The output layer's size and activation are fixed by the task.", "It translates the last hidden representation into the prediction.", "Matched output and loss give a first gradient of prediction minus target.", "Swapping the output head reuses a trained network for a new task."],
    terms: [["output layer", "the final layer producing the prediction"], ["head", "the output layer (and sometimes the top few layers) that adapts a network to a task"], ["argmax", "the index of the largest value; the chosen class in a softmax output"]],
    reflect: { q: "Why keep the decision threshold outside the model instead of baking it into the output layer?", a: "Because the threshold is a business choice (how costly a false alarm is versus a miss) and may change weekly, while the model is expensive to retrain. A probability output plus an external threshold separates the two concerns." },
  },

  "m08-neurons-and-connections": {
    simple: "A connection is one weight linking one neuron's output to another's input; the pattern of which neurons connect to which is the network's wiring, and it is where architectures differ.",
    concept:
      "Every weight in a network is a **connection**: a line from a neuron in one layer to a neuron in the next, carrying the first neuron's output multiplied by the weight. A neuron with 784 inputs has 784 incoming connections. A layer of 128 neurons reading 784 inputs has 784 × 128 = 100,352 connections, plus 128 biases.\n\nIn the simplest networks every neuron connects to every neuron in the next layer (lesson 8.6). Other architectures restrict the wiring on purpose. Convolutional layers connect each neuron only to a small neighbourhood of the input and share the same weights across positions. Recurrent layers connect a layer to itself across time steps. Transformers compute connections on the fly from the data through attention. Residual connections (Module 9) wire a layer's input directly to a later layer's output.\n\nThe wiring diagram is the architecture. The weights on the wires are what training learns. Choosing an architecture is deciding which connections exist and which share weights, and that choice encodes what you know about the data: images have local structure, sequences have order, and so on.",
    why:
      "Fully connecting everything is the most general wiring but also the most expensive and the hardest to train: a 1,000 × 1,000 colour image fully connected to a layer of 1,000 neurons would need three billion weights, and it would have to learn separately that an edge at the top left and the same edge at the bottom right are the same thing. Restricting and sharing connections injects prior knowledge, slashes parameter counts and makes learning possible from far less data. The history of neural architectures is a history of clever wiring.",
    how: [
      "Decide which neurons in layer l−1 each neuron in layer l reads: all of them (dense), a local window (convolutional), the same layer's previous output (recurrent), or a data-dependent set (attention).",
      "Decide which connections share a weight: none (dense) or all windows at all positions (convolutional).",
      "Count the resulting parameters: that is the memory the model needs and a rough measure of its capacity.",
      "Initialise every connection's weight randomly (Module 9) and train.",
      "Optionally add skip connections that carry a layer's input forward unchanged, to help deep stacks train.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Wiring", "Each neuron reads", "Weight sharing", "Built for"],
        rows: [
          ["fully connected (dense)", "every neuron of the previous layer", "none", "tabular data, final layers"],
          ["convolutional", "a small local window", "same weights at every position", "images, audio, anything with local structure"],
          ["recurrent", "the input and its own previous output", "same weights at every time step", "sequences, in order"],
          ["attention", "a weighted mix of all positions, weights computed from the data", "shared projections", "text and anything where any position may matter"],
          ["residual / skip", "adds the layer's input to its output", "—", "making deep stacks trainable"],
        ],
      },
      caption: "Same neurons, different wires. The wiring is what each architecture name refers to.",
    },
    everyday: {
      title: "Who talks to whom in an office",
      text: "In a tiny company everyone talks to everyone: fully connected, and it stops working at fifty people. Larger companies wire communication on purpose: teams talk within themselves (local), the same reporting template is used in every team (shared weights), and a few people connect teams across the building (skip connections). The organisation chart is the architecture; how much each person listens to each other is the weights.",
    },
    engineering: {
      title: "Three billion weights or three hundred thousand",
      text: "A team wants a network to inspect 1,000 × 1,000 photos of circuit boards for defects. Fully connecting the three million input values to even a 1,000-neuron first layer means three billion weights: 12 gigabytes of parameters before any training, and no hope of learning from their 20,000 photos. A convolutional first layer with 64 filters of 5 × 5 × 3 has 4,864 weights and reads the same local patterns everywhere on the board. Their whole network ends at 300,000 parameters and trains in an hour. Nothing about the neurons changed; only how they were wired.",
    },
    maths: {
      formula: "dense connections between layers of sizes n and m: n × m weights + m biases ;   convolutional: k × k × c × m weights for m filters of size k × k over c channels",
      meaning: "A dense layer's parameters scale with the product of the layer sizes. A convolutional layer's scale with the filter size and count, independent of the image size.",
      worked: [
        "Dense: 784 → 128: 784 × 128 + 128 = 100,480 parameters.",
        "Dense on a 1,000 × 1,000 × 3 image → 1,000 neurons: 3,000,000 × 1,000 + 1,000 ≈ 3.0 billion.",
        "Convolutional on the same image: 64 filters of 5 × 5 × 3: 5 · 5 · 3 · 64 + 64 = 4,864. The image size does not appear.",
        "Ratio: about 600,000 times fewer parameters, because every filter is reused at every position.",
      ],
    },
    code: {
      title: "Counting connections",
      lang: "py",
      src: `def dense_params(n_in, n_out):
    return n_in * n_out + n_out

def conv_params(k, channels_in, filters):
    return k * k * channels_in * filters + filters

print(dense_params(784, 128))              # 100480
print(dense_params(1000 * 1000 * 3, 1000)) # 3000001000
print(conv_params(5, 3, 64))               # 4864`,
      lines: [
        { code: "return n_in * n_out + n_out", say: "Every input connects to every output, plus one bias per output." },
        { code: "return k * k * channels_in * filters + filters", say: "A filter is a small k×k window over all input channels, reused everywhere; the image size never appears." },
        { code: "print(dense_params(1000 * 1000 * 3, 1000)) # 3000001000", say: "Three billion weights to fully connect a photo. This is why images get convolutions (Module 10)." },
      ],
      output: "100480\n3000001000\n4864",
    },
    useIt: "When choosing or reading an architecture, ask what each neuron is connected to and which connections share weights; that tells you the parameter count, the inductive bias and the data the design suits. The specific wirings (convolutional, recurrent, attention) are Module 10 and Stage 4.",
    takeaways: ["A connection is one weight from one neuron's output to another's input.", "Architectures differ in which connections exist and which share weights.", "Restricting and sharing connections encodes knowledge about the data and cuts parameters enormously.", "Parameter count follows directly from the wiring."],
    terms: [["connection", "a weighted link from a neuron's output to another neuron's input"], ["weight sharing", "using the same weight for many connections, as in convolutions"], ["skip connection", "a wire carrying a layer's input directly to a later point"]],
    reflect: { q: "A dense layer and a convolutional layer have the same number of neurons. Which has more parameters, and why can that be the less powerful one for images?", a: "The dense layer has far more, since each neuron has its own weights for every input. On images that is a weakness: it must learn each pattern separately at every position, from limited data, while the convolutional layer learns it once and applies it everywhere." },
  },

  "m08-fully-connected-layers": {
    simple: "A fully connected (dense) layer connects every input to every neuron: one weight matrix, one bias vector, one activation. It is the workhorse of tabular models and the final layers of most networks.",
    concept:
      "A **fully connected layer**, also called a dense or linear layer, is the layer Modules 6 and 7 have been describing all along: each of its m neurons reads all n inputs, so the layer is an m × n weight matrix W, a bias vector b of length m, and an activation applied element by element. Its forward computation is a = f(Wx + b).\n\nIt makes no assumption about the input's structure. Input 1 and input 2 are treated no differently from input 1 and input 700. That generality is right for tabular data, where features have no spatial or sequential relation, and for the final layers of any network, where the previous layer's features are already abstract. It is wrong, or at least wasteful, for raw images and sequences, where local structure matters and convolutional or attention layers do better (Module 10).\n\nDense layers are also where parameter counts explode: n × m grows fast. The classic design keeps them small and near the top of a network, after cheaper layers have reduced the input to a compact feature vector.",
    why:
      "Something has to combine features freely once they exist. After a convolutional stack has produced 512 abstract features of an image, deciding the class means weighing all 512 together, and a dense layer is the natural tool. For tabular data, there is no structure to exploit, so dense layers are the whole network. And a dense layer is the simplest thing to reason about: shapes, parameter counts and compute follow from two numbers.",
    how: [
      "Choose the width m (number of neurons). The input size n is fixed by the previous layer.",
      "Allocate W (m × n) and b (m), initialised randomly (Module 9).",
      "Forward: z = Wx + b; a = f(z). For a batch of B examples, Z = XWᵀ + b with X of shape B × n.",
      "Backward: the gradient on W is the outer product of the error at z with the input x (summed over the batch); on b, the error at z; on x, Wᵀ times the error, which is what flows to the previous layer.",
      "Stack several, each with a non-linear activation, to build a multi-layer perceptron (MLP).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Input size n", "Width m", "Weights n×m", "Biases", "Total"],
        rows: [
          ["dense 1", "42", "128", "5,376", "128", "5,504"],
          ["dense 2", "128", "32", "4,096", "32", "4,128"],
          ["output", "32", "1", "32", "1", "33"],
          ["whole MLP", "", "", "", "", "9,665"],
        ],
      },
      caption: "The churn model from lesson 8.1, counted. Dense layers are fully described by their input and output sizes.",
    },
    everyday: {
      title: "A committee where everyone hears everything",
      text: "Picture a committee of 128 members who each listen to all 42 witnesses and form an opinion with their own personal weighting of each witness. Then a second committee of 32 listens to all 128 opinions. Everyone hears everything; nothing is assumed about who should listen to whom. That is a fully connected layer: maximally general and, for large numbers of witnesses, expensive.",
    },
    engineering: {
      title: "Where the dense layers went in an image model",
      text: "An early image classifier (2012) had convolutional layers followed by two dense layers of 4,096 units; those two layers held over 50 million of the model's 60 million parameters and most of its overfitting. Later designs shrank the convolutional output with pooling to a few hundred or thousand features and used one small dense layer, or none, at the top. A team modernising an old product-image model cut its parameter count by 80% and improved validation accuracy by replacing the dense block with global average pooling and a single dense output. Dense layers are the right tool at the top and a liability when they are large and early.",
    },
    maths: {
      formula: "a = f(Wx + b) ;   for a batch: A = f(XWᵀ + b) ;   multiplications per example = n × m",
      meaning: "W is m × n, x is length n, b and a are length m. For a batch, X stacks examples as rows and the transpose lines the shapes up. Compute scales with n × m.",
      worked: [
        "Dense 42 → 128: 42 × 128 = 5,376 multiplications per example; 128 additions of biases.",
        "A batch of 256 customers: 256 × 5,376 ≈ 1.4 million multiplications, one matrix multiply, well under a millisecond on a GPU.",
        "Backward on W for one example: the error vector δ (length 128) times xᵀ (length 42) gives a 128 × 42 gradient, one entry per weight.",
        "Backward to the previous layer: Wᵀδ, a length-42 vector, is the gradient on x, which the previous layer then uses.",
      ],
    },
    code: {
      title: "A dense layer with its backward pass",
      lang: "py",
      src: `import numpy as np

class Dense:
    def __init__(self, n_in, n_out):
        self.W = np.random.randn(n_out, n_in) * np.sqrt(2 / n_in)   # He init (Module 9)
        self.b = np.zeros(n_out)

    def forward(self, X):                  # X: batch × n_in
        self.X = X
        self.Z = X @ self.W.T + self.b
        return np.maximum(0.0, self.Z)     # ReLU

    def backward(self, dA):                # dA: gradient on the output, batch × n_out
        dZ = dA * (self.Z > 0)
        self.dW = dZ.T @ self.X / len(self.X)
        self.db = dZ.mean(axis=0)
        return dZ @ self.W                 # gradient on the input, for the previous layer

layer = Dense(42, 128)
out = layer.forward(np.random.randn(256, 42))
print(out.shape, layer.W.size + layer.b.size)   # (256, 128) 5504`,
      lines: [
        { code: "self.W = np.random.randn(n_out, n_in) * np.sqrt(2 / n_in)   # He init (Module 9)", say: "The weight matrix: one row per neuron, one column per input, randomly initialised at a sensible scale." },
        { code: "self.Z = X @ self.W.T + self.b", say: "The whole batch's weighted sums in one matrix multiply." },
        { code: "dZ = dA * (self.Z > 0)", say: "Backward through ReLU: pass the gradient where the neuron was active." },
        { code: "self.dW = dZ.T @ self.X / len(self.X)", say: "The gradient on every weight at once: error times input, averaged over the batch." },
        { code: "return dZ @ self.W                 # gradient on the input, for the previous layer", say: "What flows to the layer below: the chain rule (Module 5) in one line." },
      ],
      output: "(256, 128) 5504",
    },
    useIt: "Use dense layers for tabular data (two or three of them, a few hundred units wide), as the head of convolutional and transformer models, and inside transformer blocks as the feedforward sub-layer. Keep them small when the input is large; reduce the input first with layers that exploit structure.",
    takeaways: ["A dense layer: every input to every neuron; a = f(Wx + b).", "Parameters n×m + m; compute n×m per example; both grow fast with size.", "Right for tabular data and the top of networks; wasteful on raw images and sequences.", "The backward pass is two matrix products: one for the weights, one to pass gradient down."],
    terms: [["fully connected / dense layer", "a layer where each neuron reads every input"], ["multi-layer perceptron (MLP)", "a stack of dense layers with non-linear activations"], ["batch dimension", "the first axis of the data matrix, one row per example"]],
    reflect: { q: "A dense layer has 1,000 inputs and 1,000 neurons. Roughly how much memory do its weights take in 32-bit floats, and what does that imply for very wide layers?", a: "A million weights × 4 bytes = about 4 MB for one layer. Wide dense layers multiply quickly: ten such layers are 40 MB, and a 10,000 × 10,000 layer is 400 MB. Parameter memory, not compute, often limits dense width." },
  },

  "m08-forward-propagation-through-multiple-layers": {
    simple: "Forward propagation runs an input through every layer in order, each layer transforming the previous output, until the last layer emits the prediction; every intermediate value is kept for the backward pass.",
    concept:
      "**Forward propagation** is the computation that produces a prediction: take the input, apply layer 1, take its output and apply layer 2, and so on to the output layer. Lesson 8.1 showed it for a tiny network; this lesson follows the numbers through three layers and points out what is saved along the way.\n\nTwo things are worth seeing. First, every layer only ever sees the layer before it; layer 3 has no access to the raw input, only to layer 2's description of it. That is why intermediate representations matter: anything lost in an early layer is gone. Second, the values at every layer, the pre-activations z and the activations a, are stored, because the backward pass (Module 5) needs them: the gradient on a layer's weights involves its input, and the gradient through ReLU involves the sign of its z. Memory during training is dominated by these stored activations, not by the weights.\n\nAt inference nothing needs storing, so the same pass uses far less memory and can run on much smaller hardware.",
    why:
      "The forward pass is both the product (prediction) and half of the training loop (the other half, backpropagation, retraces it). Understanding it as a sequence of stored transformations explains why training needs several times the memory of inference, why batch size is limited by memory, and why a model's latency is the sum of its layers' costs. It is also the pass you trace when debugging a strange prediction.",
    how: [
      "Prepare the input vector (lesson 8.2) and store it as a⁽⁰⁾.",
      "For each layer l from 1 to L: compute z⁽ˡ⁾ = W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾, then a⁽ˡ⁾ = f⁽ˡ⁾(z⁽ˡ⁾). Store both if training.",
      "The final a⁽ᴸ⁾ is the prediction; compare it with the target to get the loss if training.",
      "For a batch, every step is a matrix operation over all examples at once; shapes are batch × layer width.",
      "At inference, discard each layer's values as soon as the next layer has used them.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "a⁽⁰⁾ = x", detail: "(1.0, 2.0)" },
        { label: "layer 1: z = W₁x + b₁ → ReLU", detail: "z = (−1.0, 1.0, 2.5) → a⁽¹⁾ = (0, 1.0, 2.5)" },
        { label: "layer 2: z = W₂a⁽¹⁾ + b₂ → ReLU", detail: "z = (3.0, −0.5) → a⁽²⁾ = (3.0, 0)" },
        { label: "layer 3: z = W₃a⁽²⁾ + b₃ → sigmoid", detail: "z = 0.5 → ŷ = 0.62" },
        { label: "stored for backward", detail: "x, z⁽¹⁾, a⁽¹⁾, z⁽²⁾, a⁽²⁾, z⁽³⁾, ŷ" },
      ],
      caption: "Three layers, every intermediate value kept. Layer 3 never sees (1.0, 2.0); it sees (3.0, 0).",
    },
    everyday: {
      title: "Passing a message down a line of translators",
      text: "A message passes through three translators: English to French, French to German, German to Japanese. The third translator never sees the English; they work only from the German. If the first translator dropped a word, no one downstream can recover it. And if you later want to find where a mistranslation happened, you need each intermediate version, which is why, during training, every layer's output is kept.",
    },
    engineering: {
      title: "Why the batch size would not go above 32",
      text: "A team training a 24-layer model on a 16 GB GPU found that a batch of 64 crashed with out-of-memory while the weights were only 400 MB. The culprit was stored activations: each layer kept a batch × width matrix for the backward pass, and across 24 layers at batch 64 that was over 12 GB. Options they used: a smaller batch, mixed precision (16-bit activations halve the memory), and activation checkpointing, which discards some stored values and recomputes them during the backward pass. Inference on the same model ran happily at batch 512, because nothing is stored.",
    },
    maths: {
      formula: "a⁽ˡ⁾ = f(W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾) ;   activation memory per layer ≈ batch × width × bytes per value",
      meaning: "The recurrence defines the forward pass. The memory formula counts the stored activations needed for training.",
      worked: [
        "x = (1, 2). W₁ = [[1, −1], [0.5, 0.5], [0.5, 1]], b₁ = (0, −0.5, 0): z⁽¹⁾ = (1 − 2, 0.5 + 1 − 0.5, 0.5 + 2) = (−1, 1, 2.5); a⁽¹⁾ = (0, 1, 2.5).",
        "W₂ = [[1, 1, 0.8], [0, −1, 0.2]], b₂ = (0, 0): z⁽²⁾ = (0 + 1 + 2.0, 0 − 1 + 0.5) = (3.0, −0.5); a⁽²⁾ = (3.0, 0).",
        "W₃ = [[0.5, 2]], b₃ = (−1): z⁽³⁾ = 1.5 + 0 − 1 = 0.5; ŷ = σ(0.5) ≈ 0.62.",
        "Memory: batch 64, widths (1024, 1024, …) over 24 layers, 4 bytes: 64 × 1,024 × 4 ≈ 262 KB per layer per stored tensor; two tensors (z and a) × 24 layers ≈ 12.6 MB for these sizes, and proportionally more for the wide layers of real models.",
      ],
    },
    code: {
      title: "Forward pass that remembers",
      lang: "py",
      src: `import numpy as np

def relu(z):    return np.maximum(0.0, z)
def sigmoid(z): return 1 / (1 + np.exp(-z))

layers = [
    (np.array([[1.0, -1.0], [0.5, 0.5], [0.5, 1.0]]), np.array([0.0, -0.5, 0.0]), relu),
    (np.array([[1.0, 1.0, 0.8], [0.0, -1.0, 0.2]]),   np.array([0.0, 0.0]),       relu),
    (np.array([[0.5, 2.0]]),                           np.array([-1.0]),           sigmoid),
]

def forward(x, training=True):
    cache = [x]
    a = x
    for W, b, f in layers:
        z = W @ a + b
        a = f(z)
        if training:
            cache.append((z, a))      # kept for backpropagation
    return a, cache

y, cache = forward(np.array([1.0, 2.0]))
print(np.round(y, 2), len(cache))     # [0.62] 4`,
      lines: [
        { code: "cache = [x]", say: "The input is the first thing stored; layer 1's weight gradient will need it." },
        { code: "z = W @ a + b", say: "This layer's weighted sums, reading only the previous layer's output a." },
        { code: "cache.append((z, a))      # kept for backpropagation", say: "Both z (for the activation's derivative) and a (as the next layer's input) are stored during training." },
        { code: "y, cache = forward(np.array([1.0, 2.0]))", say: "The prediction is 0.62, matching the worked example, and the cache holds four entries: the input plus three layers." },
      ],
      output: "[0.62] 4",
    },
    useIt: "Forward propagation is what you profile for latency (sum of layer costs), what you trace to debug a prediction, and what sets training memory (stored activations × batch). When memory is tight, reduce batch size, use lower precision, or recompute activations instead of storing them.",
    takeaways: ["The forward pass applies layers in order; each sees only the previous output.", "Training stores every layer's z and a for the backward pass; inference stores nothing.", "Training memory is dominated by stored activations, which scale with batch size.", "Trace the pass to debug; profile it for latency."],
    terms: [["forward propagation", "computing the prediction by applying every layer in sequence"], ["activation memory", "the stored intermediate values needed for backpropagation"], ["activation checkpointing", "discarding some stored activations and recomputing them during the backward pass to save memory"]],
    reflect: { q: "Layer 2 produced (3.0, 0): its second neuron is off. What can layer 3 learn about the input from that neuron?", a: "Nothing for this example: a zero carries no information, and no gradient will flow back through it. Layer 3 relies entirely on the first neuron here. If the second neuron is off for every example, it is dead (Module 7) and the network has effectively one feature at that point." },
  },

  "m08-why-stacking-linear-layers-alone-is-insufficient": {
    simple: "Layers without non-linear activations collapse into a single linear map however many you stack, so depth only helps when each layer bends its output.",
    concept:
      "This lesson revisits the result from lessons 6.8 and 7.2 at the level of whole networks, because it is the single most common silent mistake in model definitions and because it explains design rules you will see everywhere.\n\nA layer without an activation computes a linear (affine) map: a matrix times the input plus a vector. Compose two: W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂). That is another matrix times x plus another vector. Compose a hundred and it is still one matrix and one vector. The capacity of the whole stack is exactly the capacity of one layer whose width is the smallest layer in the stack (a bottleneck), no more.\n\nThe effect on what the network can do is drastic: one flat boundary for classification, one plane for regression, no interactions, no XOR, no digit recognition beyond what a linear classifier manages (about 92% on MNIST, against 99% for a small non-linear network). Non-linear activations between layers are what make a stack a hierarchy rather than a disguise for a single layer.",
    why:
      "Frameworks make it easy to stack layers, and some layers (projections, embeddings, certain normalisations) are deliberately linear. Knowing exactly when linearity collapses and when it is harmless lets you read architectures correctly: a transformer has linear projections everywhere, but every block also contains a non-linear feedforward sub-layer and a softmax in attention, so it does not collapse. A model summary with two dense layers and no activation between them is a bug.",
    how: [
      "Write each linear layer as Wx + b.",
      "Substitute layer 1's output into layer 2: W₂(W₁x + b₁) + b₂.",
      "Expand: (W₂W₁)x + (W₂b₁ + b₂). Name the products: a single W and b.",
      "Repeat for any number of layers; the result stays Wx + b.",
      "Insert f between layers: W₂f(W₁x + b₁) + b₂. Because f is not a matrix, no expansion exists; the layers stay distinct.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Three linear layers 784→256→128→10", points: ["parameters: ~234,000", "equivalent to one 784→10 layer with at most 128 effective directions", "MNIST accuracy ≈ 92%", "the extra 226,000 parameters buy nothing"] },
      right: { title: "The same with ReLU between layers", points: ["parameters: ~234,000", "a genuine three-layer hierarchy", "MNIST accuracy ≈ 98–99%", "the parameters now build features of features"] },
      caption: "Identical sizes, identical cost, six accuracy points apart, because of two activation functions.",
    },
    everyday: {
      title: "Three discounts that are really one",
      text: "A shop applies 10% off, then 20% off, then 5% off. Three steps, but they are one multiplication: 0.9 × 0.8 × 0.95 = 0.684, a single 31.6% discount. No sequence of percentage discounts can do anything a single percentage cannot. Linear layers are percentage discounts: however many you chain, it is one. A 'buy one get one free' rule, which bends the price depending on quantity, is the non-linearity.",
    },
    engineering: {
      title: "The architecture review that found no activations",
      text: "A recommendation team's new model had 'four dense layers' and performed exactly like their old logistic regression, to the third decimal. An architecture review printed the layers: Dense(512), Dense(256), Dense(128), Dense(1, sigmoid). No activations on the first three; the framework's default is linear. The model was a 2,000-feature logistic regression with 400,000 unnecessary parameters and a bottleneck of 128. Adding ReLU to the three hidden layers lifted the offline metric by 9% that afternoon. The reviewer's checklist item was one line: 'activation between every pair of hidden layers'.",
    },
    maths: {
      formula: "W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂) ;   rank(W₂W₁) ≤ min(rank W₁, rank W₂)",
      meaning: "The composition is one affine map. Its rank, the number of independent directions it can represent, is at most the smallest layer width in the stack.",
      worked: [
        "W₁ = [[1, 2], [0, 1]], b₁ = (1, 0); W₂ = [[1, 1], [2, 0]], b₂ = (0, 1).",
        "W₂W₁ = [[1·1 + 1·0, 1·2 + 1·1], [2·1 + 0·0, 2·2 + 0·1]] = [[1, 3], [2, 4]].",
        "W₂b₁ + b₂ = (1 + 0, 2 + 0) + (0, 1) = (1, 3).",
        "Check on x = (1, 1). Two layers: h = W₁x + b₁ = (1 + 2 + 1, 0 + 1 + 0) = (4, 1); W₂h + b₂ = (4 + 1 + 0, 8 + 0 + 1) = (5, 9). One layer: W₂W₁x = (1 + 3, 2 + 4) = (4, 6); plus (1, 3) = (5, 9). Equal.",
        "With a 784→128→10 linear stack, the overall map has rank ≤ 128: the 784 pixels are first squeezed to 128 directions and nothing after can recover more.",
      ],
      note: "Always verify a hand-expanded composition on a concrete vector; it is the quickest way to catch an arithmetic slip.",
    },
    code: {
      title: "Collapsing a linear stack into one layer",
      lang: "py",
      src: `import numpy as np

W1, b1 = np.array([[1.0, 2.0], [0.0, 1.0]]), np.array([1.0, 0.0])
W2, b2 = np.array([[1.0, 1.0], [2.0, 0.0]]), np.array([0.0, 1.0])
x = np.array([1.0, 1.0])

two_layers = W2 @ (W1 @ x + b1) + b2
W, b = W2 @ W1, W2 @ b1 + b2
one_layer = W @ x + b
print(two_layers, one_layer)                      # [5. 9.] [5. 9.]

relu = lambda z: np.maximum(0, z)
print(W2 @ relu(W1 @ np.array([-3.0, 1.0]) + b1) + b2, W @ np.array([-3.0, 1.0]) + b)   # differ`,
      lines: [
        { code: "W, b = W2 @ W1, W2 @ b1 + b2", say: "The collapsed layer: one matrix and one bias computed from the two." },
        { code: "print(two_layers, one_layer)                      # [5. 9.] [5. 9.]", say: "Identical outputs: the second layer added no capacity." },
        { code: "print(W2 @ relu(W1 @ np.array([-3.0, 1.0]) + b1) + b2, W @ np.array([-3.0, 1.0]) + b)   # differ", say: "With a ReLU in between, the outputs no longer match: the stack is now a different, richer function." },
      ],
      output: "[5. 9.] [5. 9.]\n[1. 1.] [-1.  5.]",
    },
    useIt: "Put a non-linear activation between every pair of trainable hidden layers unless a design deliberately uses a linear projection followed by a non-linear block. When reviewing a model, print the layers with their activations; when a deep model matches a linear baseline, check this first.",
    takeaways: ["Composed linear layers equal one linear layer; width is capped by the narrowest layer.", "Only non-linear activations make depth real.", "Deliberately linear layers exist (projections) but are always followed by non-linearity somewhere in the block.", "A deep model performing like logistic regression is the classic symptom."],
    terms: [["affine map", "a matrix multiplication plus a constant vector; what a layer without activation computes"], ["rank", "the number of independent directions a matrix can produce; a bottleneck limits it"], ["bottleneck", "the narrowest layer in a stack, which caps the whole stack's linear capacity"]],
    reflect: { q: "Attention in a transformer is mostly linear projections. Why does a transformer not collapse?", a: "Because each block also contains a feedforward sub-layer with a GELU activation and the attention weights pass through a softmax, which is non-linear. The projections are linear on purpose; the block as a whole is not." },
  },

  "m08-network-depth-and-width": {
    simple: "Depth is the number of layers, width the neurons per layer; depth builds features of features efficiently, width adds capacity within a level, and both are tuned against validation data.",
    concept:
      "Two numbers describe a plain network's shape. **Depth** is how many layers it has. **Width** is how many neurons a layer has (it can differ per layer). A 784→128→64→10 network has depth 3 (counting the trainable layers) and widths 128, 64, 10.\n\nThey buy different things. Width gives a layer more features to work with at the same level of abstraction: more stroke detectors in layer 1. Depth lets features be composed: strokes into parts into digits. For the same parameter budget, deeper networks usually represent complex functions more compactly, because a feature learned once low down is reused by everything above it, whereas a shallow wide network must build every complex pattern directly from the input.\n\nDepth has costs. Gradients must travel through every layer, and without the tricks of Module 9 (good initialisation, normalisation, residual connections) deep stacks fail to train. Width has costs too: parameters grow with the product of adjacent widths, and very wide dense layers overfit on small data. Modern practice: deep (tens to hundreds of layers) with moderate width, held up by residual connections and normalisation.",
    why:
      "Choosing a shape is the first design decision after the input and output, and getting it badly wrong wastes a training budget: too small and the model underfits (it cannot even fit the training data); too large and it overfits or will not train. Understanding what depth and width each contribute turns the choice from guesswork into a search in the right direction: start from a known shape for the data type, and widen or deepen based on which failure you see.",
    how: [
      "Start from a reference shape for the data: 2–3 dense layers of 128–512 for tabular; a known convolutional or transformer configuration for images or text.",
      "Train and compare training loss with validation loss (Module 4).",
      "Training loss high: the model underfits. Add width or depth, or train longer.",
      "Training loss low, validation loss high: it overfits. Reduce size, add regularisation (Module 9), or get more data.",
      "Deeper than about 10 dense layers: add residual connections and normalisation or training will stall.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Wider", points: ["more features per level", "parameters grow with width²", "shallow-wide can fit anything in principle but needs many units", "trains easily; overfits on small data"] },
      right: { title: "Deeper", points: ["features of features; reuse", "parameters grow linearly with depth", "same function with far fewer units for hierarchical data", "harder to train past ~10 layers without residuals and normalisation"] },
      caption: "Width is capacity per level; depth is composition across levels. Real data is hierarchical, so depth usually pays.",
    },
    everyday: {
      title: "A bigger team or a longer pipeline",
      text: "To make a dictionary faster you can hire more people to each write entries from scratch (wider), or set up stages: researchers, drafters, editors, proofreaders (deeper). The pipeline reuses work: one researcher's notes serve every drafter. For a dictionary, the pipeline wins by a mile. For a one-off task with no shared steps, the big flat team is fine. Hierarchical work favours depth.",
    },
    engineering: {
      title: "Same parameters, two shapes",
      text: "A speech team compares two networks of about two million parameters each on the same data: one with two very wide layers (1,400 units each), one with six layers of about 450. The deep one reaches 5% lower error and, when they probe its layers, shows a clear progression from frequency patterns to phoneme-like units. The wide one has to learn phoneme patterns directly from raw spectral features and does so less reliably. The deep one also needed batch normalisation to train at all; without it, its loss did not move for the first epoch. Depth paid, once it could be trained.",
    },
    maths: {
      formula: "dense parameters ≈ Σₗ nₗ₋₁ · nₗ ;   doubling width ×4 parameters; doubling depth ×2 parameters",
      meaning: "Each dense layer contributes the product of its input and output widths. Width enters squared (adjacent layers both widen); depth enters linearly.",
      worked: [
        "784→128→10: 784·128 + 128·10 = 100,352 + 1,280 ≈ 101,600 weights.",
        "Double the width, 784→256→10: 200,704 + 2,560 ≈ 203,000: about 2× here because the input side is fixed; between two hidden layers it would be 4×.",
        "Double the depth, 784→128→128→10: 100,352 + 16,384 + 1,280 ≈ 118,000: about 1.2×, because the added layer is 128×128.",
        "A second 128-wide layer costs 16,384 parameters and adds a level of composition; widening to 256 costs ~100,000 and adds none.",
      ],
    },
    useIt: "Pick an initial shape from a reference architecture for your data type; diagnose underfitting versus overfitting from the two loss curves; grow depth before width for hierarchical data; add residuals and normalisation when going deep. Record the shapes you try and their validation results; shape search is a normal part of the work.",
    takeaways: ["Depth = number of layers; width = neurons per layer.", "Width adds features at a level; depth composes features across levels and reuses them.", "Parameters grow with width² and linearly with depth.", "Deep stacks need residual connections and normalisation to train."],
    terms: [["depth", "the number of trainable layers"], ["width", "the number of neurons in a layer"], ["underfitting", "the model cannot even fit the training data well"]],
    reflect: { q: "A tabular model with 20 features and 5,000 training rows underfits at 64→64→1 and overfits at 1024→1024→1. What would you try?", a: "Something between, such as 256→128→1 with dropout, and check both loss curves; also question whether the features themselves carry the signal, since with only 5,000 rows a large network is rarely the answer." },
  },

  "m08-parameters-in-a-neural-network": {
    simple: "A network's parameters are every weight and bias in every layer; you count them layer by layer, and the total sets memory, training cost and how much data the model needs.",
    concept:
      "Module 2 introduced **parameters** as the adjustable numbers inside a model and explained what 7B means. In a neural network they are concrete: every connection's weight and every neuron's bias, across all layers. Nothing else is learned; activations, layer shapes and learning rates are fixed choices.\n\nCounting is mechanical. A dense layer from n inputs to m neurons has n·m weights and m biases. A convolutional layer has k·k·c·m weights and m biases for m filters of size k over c channels, regardless of image size. An embedding table of v tokens with d dimensions has v·d. A transformer block has a fixed formula in its width (Stage 4). Add the layers and you have the model's size.\n\nThe count matters three ways. Memory: 4 bytes per parameter in 32-bit, so 7 billion parameters is 28 GB before anything else. Compute: each parameter is used about once per example in the forward pass, so cost per prediction scales with the count. Data: a model with far more parameters than training examples can memorise them, which is the overfitting of Module 4, unless regularised.",
    why:
      "The parameter count is the first number anyone asks about a model, and it is derivable from the architecture alone. Being able to compute it lets you estimate whether a model fits on a GPU, how long training will take, whether your dataset is large enough, and whether a summary printout is telling the truth. It also demystifies large models: 7 billion is not magic, it is the sum of some tables and some matrices.",
    how: [
      "List the layers with their input and output sizes.",
      "For each dense layer add n·m + m. For each convolutional layer add k·k·c·m + m. For each embedding table add v·d.",
      "Ignore activations, pooling and dropout: they have no parameters. Normalisation layers add a few (two per feature).",
      "Sum. Compare with the framework's summary to check your understanding.",
      "Multiply by bytes per parameter for memory; by 2 for rough forward FLOPs per example; compare with the number of training examples for an overfitting sanity check.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Shape", "Weights", "Biases", "Parameters"],
        rows: [
          ["input", "784", "0", "0", "0"],
          ["dense + ReLU", "784 → 128", "100,352", "128", "100,480"],
          ["dense + ReLU", "128 → 64", "8,192", "64", "8,256"],
          ["dense + softmax", "64 → 10", "640", "10", "650"],
          ["total", "", "109,184", "202", "109,386"],
        ],
      },
      caption: "The digit classifier from lesson 8.1, fully counted. 92% of the parameters sit in the first layer.",
    },
    everyday: {
      title: "Counting the dials on a mixing desk",
      text: "A sound engineer's mixing desk has 32 channels with 12 knobs each plus 8 master controls: 392 dials. That number tells you how long a sound check takes, how many settings a preset must store, and how easily a novice can make a mess. A network's parameters are its dials; the count tells you the same three things about training, memory and overfitting.",
    },
    engineering: {
      title: "Will it fit on the GPU?",
      text: "A team wants to fine-tune a 7-billion-parameter language model on a 24 GB GPU. The arithmetic: 7B × 4 bytes = 28 GB for weights alone in 32-bit, so no. In 16-bit, 14 GB for weights, but full training also needs gradients (another 14 GB) and optimiser state (Adam keeps two more copies: 28 GB). Still no. Their options follow directly from the count: 8-bit or 4-bit weights (Stage 5), and LoRA, which trains a few million added parameters instead of all 7 billion. The decision took five minutes of multiplication.",
    },
    maths: {
      formula: "P = Σ dense (nₗ₋₁ nₗ + nₗ) + Σ conv (k² c m + m) + Σ embed (v d) ;   memory ≈ P × bytes ;   training memory ≈ P × (bytes for weights + gradients + optimiser state)",
      meaning: "P is the parameter count. Training keeps extra copies per parameter: the gradient, and for Adam two moving averages.",
      worked: [
        "Digit classifier: 100,480 + 8,256 + 650 = 109,386 parameters; × 4 bytes ≈ 437 KB.",
        "Convolutional first layer, 32 filters of 3×3 over 1 channel: 3·3·1·32 + 32 = 320 parameters, for any image size.",
        "Embedding table for 50,000 tokens × 768 dimensions: 38.4 million parameters, typically the largest single table in a small language model.",
        "7B model, Adam, 16-bit weights and gradients, 32-bit optimiser state: 7B × (2 + 2 + 8) = 84 GB of training memory. Why fine-tuning needs tricks.",
      ],
    },
    code: {
      title: "A parameter counter",
      lang: "py",
      src: `def count_params(spec):
    total = 0
    for kind, *dims in spec:
        if kind == "dense":
            n_in, n_out = dims
            total += n_in * n_out + n_out
        elif kind == "conv":
            k, c_in, filters = dims
            total += k * k * c_in * filters + filters
        elif kind == "embed":
            vocab, d = dims
            total += vocab * d
    return total

digits = [("dense", 784, 128), ("dense", 128, 64), ("dense", 64, 10)]
print(count_params(digits))                       # 109386
print(count_params([("embed", 50000, 768)]))      # 38400000
print(count_params(digits) * 4 / 1024, "KB")      # 427.3 KB`,
      lines: [
        { code: "total += n_in * n_out + n_out", say: "A dense layer: weights plus one bias per output neuron." },
        { code: "total += k * k * c_in * filters + filters", say: "A convolutional layer depends on filter size and count, never on image size." },
        { code: "total += vocab * d", say: "An embedding table: one vector of d numbers per token in the vocabulary." },
        { code: "print(count_params(digits))                       # 109386", say: "Matches the table: the counter and the hand count agree." },
      ],
      output: "109386\n38400000\n427.2890625 KB",
    },
    useIt: "Count parameters whenever you size a model, choose hardware, plan fine-tuning or judge overfitting risk. Compare your count with the framework's summary to confirm the architecture is what you think. For large models, the count times bytes per value is the first line of every capacity plan.",
    takeaways: ["Parameters = all weights and biases; count them per layer and add.", "Dense: n·m + m. Convolutional: k²·c·m + m. Embedding: v·d.", "Count × bytes = memory; training needs several copies per parameter.", "Far more parameters than examples means overfitting risk."],
    terms: [["parameter count", "the total number of learned weights and biases in a model"], ["optimiser state", "the extra per-parameter values an optimiser like Adam keeps during training"]],
    reflect: { q: "Two models have the same parameter count: one is 784→128→10, the other 784→64→64→64→10. Which is likely better on digits and why?", a: "The second, slightly: for similar cost it has three levels of composition instead of one, and the digit task is hierarchical. But the difference at this scale is small, and only a validation comparison settles it." },
  },

  "m08-training-a-neural-network": {
    simple: "Training a network is the Module 5 loop at scale: forward pass on a batch, loss, backward pass through every layer, optimiser step; repeated for epochs while watching validation loss.",
    concept:
      "Modules 4 and 5 built the training loop for a single formula. **Training a neural network** is the same loop applied to all the layers at once. One iteration: take a mini-batch of examples, run the forward pass and store the activations, compute the loss against the targets, run the backward pass to get the gradient of the loss with respect to every weight and bias in every layer, and let the optimiser update them all. One epoch is a pass over the whole training set; training runs for many epochs.\n\nWhat changes with depth is the backward pass. The gradient at the output flows to the last layer's weights and, through the chain rule, to the previous layer's output, then to that layer's weights, and so on down to layer 1. Each layer's gradient depends on its stored input and its activation's derivative. Backpropagation (Module 5) is this bookkeeping done efficiently, and frameworks do it automatically.\n\nAround the loop sit the practices that make it work: shuffling data each epoch, a learning-rate schedule, validation after each epoch, early stopping when validation loss rises, and checkpoints so a run can resume. Module 9 adds the stabilisers deep networks need.",
    why:
      "A network's millions of parameters cannot be set by hand or by any closed formula; the only known method that works at scale is iterative gradient-based training. Everything in deployment, from accuracy to fairness, is determined in this loop, and most failures (underfitting, overfitting, divergence, dead units) are visible in its logs if you know what to look for. Being fluent in the loop is what lets you fix a model rather than retry it blindly.",
    how: [
      "Split data into training, validation and test; prepare inputs (lesson 8.2); initialise weights randomly (Module 9).",
      "For each epoch, shuffle the training set and cut it into mini-batches.",
      "For each batch: forward pass (store activations), compute the loss, backward pass (gradients for every layer), optimiser step (update every parameter).",
      "After each epoch: compute validation loss and metric without updating; log both; save a checkpoint.",
      "Stop when validation loss stops improving for several epochs; keep the best checkpoint; evaluate once on the test set.",
    ],
    visual: {
      kind: "flow",
      steps: ["batch of 64 images + labels", "forward: 784→128→64→10, store activations", "loss: cross-entropy vs labels", "backward: gradients for W₃,b₃ then W₂,b₂ then W₁,b₁", "optimiser: update all 109,386 parameters", "next batch … end of epoch → validation → repeat"],
      caption: "One iteration of the loop. 60,000 training images at batch 64 is 938 iterations per epoch.",
    },
    everyday: {
      title: "Rehearsing a play, scene by scene",
      text: "A cast rehearses a scene (a batch), the director notes what went wrong (the loss), each actor is told how to adjust (the gradients), they adjust (the update), and they move to the next scene. After the whole play (an epoch) they run it for a test audience (validation). When test audiences stop reacting better, rehearsals stop (early stopping) and the best run is the one they perform (the best checkpoint).",
    },
    engineering: {
      title: "Reading a training log",
      text: "A churn model's log over 20 epochs: training loss falls steadily from 0.69 to 0.21; validation loss falls to 0.34 at epoch 8, then creeps up to 0.41 by epoch 20. The engineer reads it immediately: the model started memorising around epoch 8. Early stopping would have kept the epoch-8 checkpoint; a dropout layer (Module 9) would delay the divergence. In another run, both losses sit at 0.69 for five epochs then drop suddenly: a learning rate too low at the start, or an initialisation that left every ReLU off. The log is the diagnostic; the loop is where every symptom originates.",
    },
    maths: {
      formula: "for each batch: L = (1/B) Σ loss(ŷᵢ, tᵢ) ;   ∂L/∂W⁽ˡ⁾ = δ⁽ˡ⁾ a⁽ˡ⁻¹⁾ᵀ ;   δ⁽ˡ⁻¹⁾ = (W⁽ˡ⁾ᵀ δ⁽ˡ⁾) ⊙ f'(z⁽ˡ⁻¹⁾) ;   W ← W − η ∂L/∂W",
      meaning: "B is the batch size; δ⁽ˡ⁾ is the error at layer l's pre-activation; ⊙ is element-wise product; η is the learning rate. The error flows down one layer at a time, scaled by the activation derivative.",
      worked: [
        "Output layer, softmax + cross-entropy: δ⁽³⁾ = ŷ − t. For ŷ = (0.1, 0.7, 0.2) and t = (0, 1, 0): δ⁽³⁾ = (0.1, −0.3, 0.2).",
        "Gradient on W⁽³⁾ (3 × 2) with a⁽²⁾ = (3.0, 0): δ⁽³⁾ a⁽²⁾ᵀ = [[0.3, 0], [−0.9, 0], [0.6, 0]]. The second column is zero: the dead neuron teaches nothing.",
        "Error at layer 2: W⁽³⁾ᵀ δ⁽³⁾ gives a length-2 vector; multiply by ReLU'(z⁽²⁾) = (1, 0) → the second entry becomes 0. The off neuron blocks the gradient.",
        "Update with η = 0.1: each weight moves by −0.1 × its gradient. The weight linked to the wrongly low 'class 2' logit (gradient −0.9) increases by 0.09.",
      ],
    },
    code: {
      title: "The training loop, in full",
      lang: "py",
      src: `import numpy as np

def train(model, X, y, X_val, y_val, epochs=20, batch=64, lr=0.05):
    best, best_state, bad_epochs = np.inf, None, 0
    for epoch in range(epochs):
        order = np.random.permutation(len(X))            # shuffle each epoch
        for i in range(0, len(X), batch):
            idx = order[i:i + batch]
            probs = model.forward(X[idx], training=True)
            loss = cross_entropy(probs, y[idx])
            model.backward(probs, y[idx])                # gradients for every layer
            model.step(lr)                               # update every parameter
        val_loss = cross_entropy(model.forward(X_val), y_val)
        print(epoch, round(loss, 3), round(val_loss, 3))
        if val_loss < best:
            best, best_state, bad_epochs = val_loss, model.state(), 0
        else:
            bad_epochs += 1
            if bad_epochs == 3:                          # early stopping
                break
    model.load(best_state)
    return model`,
      lines: [
        { code: "order = np.random.permutation(len(X))            # shuffle each epoch", say: "Different batches every epoch, so the gradient noise does not repeat." },
        { code: "probs = model.forward(X[idx], training=True)", say: "Forward pass on one mini-batch, storing activations for the backward pass." },
        { code: "model.backward(probs, y[idx])                # gradients for every layer", say: "Backpropagation from the output down to layer 1." },
        { code: "model.step(lr)                               # update every parameter", say: "The optimiser moves every weight and bias against its gradient." },
        { code: "val_loss = cross_entropy(model.forward(X_val), y_val)", say: "Once per epoch, measure on data the model never trains on; no stored activations, no update." },
        { code: "if bad_epochs == 3:                          # early stopping", say: "Three epochs without improvement: stop, and keep the best checkpoint rather than the last." },
      ],
      note: "Frameworks hide forward/backward/step behind a few calls; the structure of the loop is exactly this.",
    },
    useIt: "Every model you train runs this loop; your job is to read its logs and intervene: adjust the learning rate, add regularisation, stop early, fix the data. Keep validation strictly separate, save checkpoints, log both losses every epoch, and seed the randomness so runs can be reproduced.",
    takeaways: ["Training = repeated (forward, loss, backward, update) on mini-batches, over epochs.", "Backpropagation sends the output error down layer by layer, scaled by each activation's derivative.", "Validation loss after each epoch is the signal for early stopping and overfitting.", "Shuffle, schedule the learning rate, checkpoint, seed."],
    terms: [["iteration", "one forward-backward-update step on one mini-batch"], ["early stopping", "halting training when validation loss stops improving, keeping the best checkpoint"], ["learning-rate schedule", "a planned change of the learning rate over training, usually decreasing"]],
    reflect: { q: "Why is validation loss computed without storing activations or updating weights?", a: "Because it measures the model, not trains it. Storing nothing keeps it cheap, and updating on validation data would make validation loss an unreliable estimate of performance on unseen data, which is its only purpose." },
  },

  "m08-neural-network-inference": {
    simple: "Inference is running only the forward pass on new inputs with frozen weights: no gradients, no stored activations, often batched and optimised, and it is what users actually experience.",
    concept:
      "Once training stops, the parameters are frozen and the network becomes a fixed function. **Inference** is applying that function to new inputs: one forward pass per example, with no backward pass, no loss, no stored activations and no updates. The output is the prediction, converted into a decision by a rule chosen outside the model.\n\nBecause nothing is stored, inference needs far less memory than training and runs on smaller hardware: a model trained on a cluster of GPUs can serve on one GPU, a CPU, or a phone. Because the weights are fixed, the computation can be optimised aggressively: lower precision (16-bit or 8-bit numbers), fused operations, compiled graphs, and batching many requests through one pass.\n\nTwo details matter in practice. Layers that behave differently in training and inference (dropout, batch normalisation in Module 9) must be switched to inference mode, or predictions will be wrong. And the input preparation must be identical to training's (lesson 8.2), with the same saved statistics. Most inference bugs are one of these two.",
    why:
      "Training happens once; inference happens millions of times, in production, under latency and cost constraints, on hardware the training team did not choose. The forward pass is the same arithmetic, but the engineering around it is a separate discipline (Stage 8). Understanding what inference does and does not need lets you size servers, pick precision, meet latency targets and avoid the train/inference mismatches that silently degrade a deployed model.",
    how: [
      "Load the trained weights and switch every layer to inference mode (no dropout; normalisation uses saved statistics).",
      "Prepare the input exactly as in training, with the saved scaling statistics and encodings.",
      "Run the forward pass under a 'no gradient' setting so nothing is stored.",
      "Convert the output to a decision: threshold, argmax or sample, using rules set by the product.",
      "Batch concurrent requests when latency allows; use lower precision and compiled kernels for speed; log inputs, outputs and timings for monitoring.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Training", points: ["forward + backward + update", "stores every activation", "memory: weights + gradients + optimiser state + activations", "dropout on, normalisation uses batch statistics", "runs once, for hours or days"] },
      right: { title: "Inference", points: ["forward only", "stores nothing", "memory: weights (often in lower precision)", "dropout off, normalisation uses saved statistics", "runs millions of times, in milliseconds"] },
      caption: "Same forward pass, different everything else.",
    },
    everyday: {
      title: "Studying for the exam and sitting it",
      text: "Revision is training: you work through problems, check answers, adjust your understanding, repeat for weeks. The exam is inference: you apply what you know to new questions, quickly, with no feedback and no changing your mind afterwards. You do not bring the textbook to the exam, just as inference does not carry the training machinery.",
    },
    engineering: {
      title: "The model that was 3% worse in production",
      text: "A fraud model scored 0.91 AUC in validation and 0.88 in production, and nobody could explain the gap until an engineer compared inference code with training code line by line. Two differences: the production service standardised features with statistics recomputed from each day's traffic rather than the saved training statistics, and a batch-normalisation layer had been left in training mode, so each request's output depended on the other requests in its batch. Fixing both restored 0.91. The forward pass was correct; the surroundings were not.",
    },
    maths: {
      formula: "inference memory ≈ P × bytes ;   latency ≈ Σₗ cost(layer l) ;   throughput ≈ batch / latency",
      meaning: "With no stored activations or optimiser state, memory is just the parameters. Latency is the sum of layer costs for one pass; batching amortises fixed costs across requests.",
      worked: [
        "Digit classifier: 109,386 parameters × 4 bytes ≈ 0.44 MB; in 8-bit, 0.11 MB. It fits anywhere.",
        "Forward multiplications per image: 100,352 + 8,192 + 640 ≈ 109,000; at 10 GFLOP/s on a phone CPU that is about 0.01 ms.",
        "A 7B language model in 16-bit: 14 GB of weights; generating one token touches every weight once, so a GPU with 1 TB/s memory bandwidth needs at least 14 ms per token just to read them.",
        "Batching 16 requests through the same pass: the weights are read once for all 16, so per-token cost drops toward 1 ms each, at the price of waiting to fill the batch.",
      ],
    },
    code: {
      title: "Inference mode",
      lang: "py",
      src: `import numpy as np

class Model:
    def predict(self, raw_inputs):
        self.training = False                       # dropout off, saved normalisation stats
        X = prepare(raw_inputs, self.saved_mu, self.saved_sigma)   # same preparation as training
        a = X
        for layer in self.layers:
            a = layer.forward(a, store=False)       # no activations kept
        return a

model = load_checkpoint("churn-best.npz")
probs = model.predict(todays_customers)
decisions = probs > 0.35                            # threshold set by the business, outside the model`,
      lines: [
        { code: "self.training = False                       # dropout off, saved normalisation stats", say: "The single most common inference bug is forgetting this switch." },
        { code: "X = prepare(raw_inputs, self.saved_mu, self.saved_sigma)   # same preparation as training", say: "Training-time statistics, loaded with the model, never recomputed." },
        { code: "a = layer.forward(a, store=False)       # no activations kept", say: "Forward only; nothing is saved for a backward pass that will never run." },
        { code: "decisions = probs > 0.35                            # threshold set by the business, outside the model", say: "The decision rule lives in the application, so it can change without retraining." },
      ],
    },
    useIt: "Serving any model: switch to inference mode, reuse the exact training preprocessing, run without gradients, batch where latency allows, lower precision where accuracy holds, and monitor inputs and outputs for drift. Stage 8 covers the infrastructure; the correctness rules start here.",
    takeaways: ["Inference = forward pass with frozen weights: no gradients, no stored activations.", "Needs far less memory than training; can run on much smaller hardware.", "Switch layers to inference mode and reuse training preprocessing exactly.", "Decision rules live outside the model; batching and precision trade latency for throughput and cost."],
    terms: [["inference", "using a trained model to predict on new inputs"], ["inference mode", "the setting where dropout is off and normalisation uses saved statistics"], ["throughput", "predictions completed per second"]],
    reflect: { q: "A 7B-parameter model needs 14 GB in 16-bit and the GPU has 24 GB. Can it serve a batch of 32 long prompts?", a: "Weights fit, but inference still needs working memory for activations of the current pass and, for language models, the KV cache that grows with prompt length and batch size (Module 40). A batch of 32 long prompts can easily exceed the remaining 10 GB; batch size and context length must be budgeted together." },
  },
};

export const M08_QUIZ: Quiz[] = [
  {
    q: "A network is 784 → 128 → 64 → 10 with ReLU hidden layers and softmax output. How many parameters does it have?",
    options: ["109,184", "109,386", "100,480", "986"],
    answer: 1,
    why: ["That is the weights only; biases are parameters too.", "Correct. 100,480 + 8,256 + 650.", "That is only the first layer.", "That is the sum of the widths, not the connections."],
  },
  {
    q: "Which layer has no parameters?",
    options: ["The input layer", "A dense hidden layer", "The output layer", "A convolutional layer"],
    answer: 0,
    why: ["Correct. It is just the example's numbers; its 'design' is data preparation.", "n·m weights plus m biases.", "It has weights and biases like any dense layer.", "Filters are parameters."],
  },
  {
    q: "A model's inputs are distance in metres (thousands) and item count (1–10). Training is slow and unstable. Most likely fix?",
    options: ["Add more layers", "Standardise each feature with training-set statistics", "Use softmax at the output", "Reduce the batch size"],
    answer: 1,
    why: ["Depth does not fix input scale.", "Correct. The large feature dominates the first layer's sums; equal scales let all weights train.", "Unrelated.", "Does not address scale."],
    reason: true,
  },
  {
    q: "Why does training need much more memory than inference for the same model?",
    options: ["The weights are bigger during training", "Every layer's activations are stored for the backward pass, plus gradients and optimiser state", "Inference uses a different, smaller network", "Training runs on CPU"],
    answer: 1,
    why: ["Weights are the same size.", "Correct. Inference stores nothing and keeps only the weights.", "It is the same network.", "Hardware does not change the memory need."],
  },
  {
    q: "Three dense layers with no activation between them are equivalent to what?",
    options: ["A three-level feature hierarchy", "One dense layer whose rank is capped by the narrowest layer", "A convolutional network", "Nothing; the model will not run"],
    answer: 1,
    why: ["Without non-linearity there is no hierarchy.", "Correct. Affine maps compose into one affine map; width is capped by the bottleneck.", "No.", "It runs; it just has no extra capacity."],
    reason: true,
  },
  {
    q: "For the same parameter budget, why do deeper networks usually beat wider shallow ones on images and speech?",
    options: ["Deeper networks have more parameters", "Features learned in early layers are reused by every layer above, so hierarchical patterns are represented compactly", "Width causes vanishing gradients", "Deeper networks need less data"],
    answer: 1,
    why: ["The budget is fixed.", "Correct. Depth composes and reuses features; width must build every pattern from scratch.", "Depth, not width, is what makes gradients vanish.", "They often need more care to train, not less data."],
  },
  {
    q: "What should the output layer be for predicting a customer's spend next month in pounds?",
    options: ["One sigmoid neuron", "Ten softmax neurons", "One linear neuron", "One ReLU neuron, always"],
    answer: 2,
    why: ["Spend is not a probability.", "Spend is not a class.", "Correct. A quantity wants an unbounded output with a squared or absolute error loss.", "ReLU forbids negatives and can get stuck at zero; linear is the standard choice."],
  },
  {
    q: "A model scores well in validation and worse in production. Which inference bug is most likely?",
    options: ["The forward pass arithmetic differs", "Layers left in training mode or preprocessing statistics recomputed on live data", "The learning rate was too high", "The output layer was removed"],
    answer: 1,
    why: ["The arithmetic is the same code path.", "Correct. Train/inference mismatches in mode or preprocessing are the classic cause.", "Learning rate only matters during training.", "The model would not produce predictions at all."],
  },
];

export const M08_EXERCISES: Exercise[] = [
  {
    title: "Count a model by hand",
    kind: "calculate",
    task: "A tabular model has 30 input features, dense layers of 256, 128 and 64 units with ReLU, and 3 softmax outputs. Count its parameters, its multiplications per example, and its weight memory in 32-bit. Then say which single layer you would shrink first if the model overfits, and why.",
    hints: ["Dense: n·m + m.", "Multiplications ≈ n·m per layer.", "4 bytes per parameter."],
    solution: "Layers: 30→256: 7,680 + 256 = 7,936; 256→128: 32,768 + 128 = 32,896; 128→64: 8,192 + 64 = 8,256; 64→3: 192 + 3 = 195. Total 49,283 parameters; ≈ 48,832 multiplications per example; ≈ 197 KB. Shrink the 256→128 layer first: it holds two-thirds of the parameters, so it is where memorisation capacity concentrates, and the 30-feature input does not need 256 first-layer units.",
  },
  {
    title: "Trace a forward pass",
    kind: "calculate",
    task: "Input x = (2, −1). Layer 1: W = [[1, 1], [−1, 2], [0.5, 0]], b = (0, 1, −2), ReLU. Layer 2: W = [[1, −1, 2]], b = (0.5), sigmoid. Compute every intermediate value and the output. Which hidden neuron contributes nothing to the output, and what would its weight gradient be?",
    hints: ["z = Wx + b for each layer; ReLU zeroes negatives.", "A zero activation feeds nothing forward and receives no gradient."],
    solution: "Layer 1: z = (2 − 1, −2 − 2 + 1, 1 + 0 − 2) = (1, −3, −1); a = (1, 0, 0). Layer 2: z = 1·1 + (−1)·0 + 2·0 + 0.5 = 1.5; output σ(1.5) ≈ 0.82. Hidden neurons 2 and 3 are off: they contribute nothing, and their weight gradients for this example are zero because ReLU'(z) = 0 blocks the error.",
  },
  {
    title: "Build and train a two-layer network",
    kind: "code",
    task: "Using NumPy only, implement a 2 → 8 → 1 network (ReLU hidden, sigmoid output) and train it on the XOR data from Module 6 with mini-batches of 4 (the whole set), learning rate 0.5, for 2,000 iterations, using binary cross-entropy. Print the four predictions. Then remove the ReLU and show that training fails.",
    hints: ["Output gradient for sigmoid + BCE is prediction − target.", "Hidden gradient: (W₂ᵀ δ) ⊙ (z₁ > 0).", "Initialise weights with np.random.randn(...) * 0.5; seed it."],
    solution: "With ReLU, predictions converge to roughly (0.02, 0.98, 0.98, 0.02) for inputs (0,0), (0,1), (1,0), (1,1). Without ReLU the hidden layer is linear, the network collapses to logistic regression, and the best it can do is about 0.5 for every input, since XOR is not linearly separable. The core of the implementation: forward z1 = X@W1.T + b1; a1 = relu(z1); z2 = a1@W2.T + b2; p = sigmoid(z2). Backward d2 = p − y; dW2 = d2.T@a1/4; db2 = d2.mean(0); d1 = (d2@W2) * (z1 > 0); dW1 = d1.T@X/4; db1 = d1.mean(0); then subtract lr times each gradient.",
  },
  {
    title: "Diagnose from the log",
    kind: "think",
    task: "Three training logs. (A) Training loss 0.69 for ten epochs, validation 0.69. (B) Training loss falls to 0.05; validation falls to 0.30 at epoch 6 then rises to 0.45. (C) Training loss falls to 0.40 and plateaus; validation 0.42 and plateaus. Give the most likely diagnosis and one fix for each.",
    hints: ["0.69 is the binary cross-entropy of always predicting 0.5.", "Training low, validation rising = memorising.", "Both plateauing above the target = capacity or features."],
    solution: "(A) The model is not learning at all: learning rate far too low, dead ReLUs from bad initialisation, or a bug such as inputs not connected to the loss. Fix: check that the loss changes with a huge learning rate, verify initialisation and input scaling. (B) Overfitting from epoch 6: early stopping at the best checkpoint, add dropout or weight decay, or get more data. (C) Underfitting: the model lacks capacity or the features lack signal; add width or depth, train longer with a schedule, or engineer better inputs.",
  },
];
