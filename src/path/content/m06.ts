import type { Exercise, LessonBody, Quiz } from "../types";

// Module 6: Understanding artificial neurons. One concept per lesson.
// Keys are lesson slugs: m06-<kebab of the concept title in map.ts>.

export const M06_BODIES: Record<string, LessonBody> = {
  "m06-artificial-neuron": {
    simple: "An artificial neuron is a tiny calculator: it multiplies each input by a weight, adds them up with a bias, and passes the total through a simple curve to make its output.",
    concept:
      "Every neural network, from the one that reads your handwriting to the one behind a chat assistant, is built from one repeated part. An **artificial neuron** takes a handful of numbers in, does one small calculation, and gives one number out.\n\nThe calculation has three steps. First, every input is multiplied by its own adjustable number, a weight, which says how much that input matters. Second, the products are added together, plus one more adjustable number called the bias. Third, the total is pushed through a simple fixed curve called an activation function, which bends the output so it cannot be a plain straight-line sum.\n\nThat is all. A neuron on its own can only draw one straight boundary through its inputs. Its power comes from being copied thousands of times and arranged in layers, where the outputs of one group become the inputs of the next. The spam scorer from Module 1 was already a neuron without the bend; this module adds the bend and explains why it matters.",
    why:
      "Machine learning needs a building block that is simple enough to run billions of times a second and adjustable enough that training can shape it. A neuron is exactly that: a few multiplications, an addition, one curve. The weights and bias are the parameters training tunes, and the activation is what lets stacks of neurons represent shapes that a single formula never could.\n\nIt exists because the alternative, writing a different formula for every task, does not scale. One repeated unit with adjustable numbers can be arranged to approximate almost any function, as long as there are enough of them and they are trained well.",
    how: [
      "Receive inputs x₁, x₂, … xₙ as numbers: pixel brightnesses, a customer's spend, a sound sample.",
      "Multiply each input by its weight: w₁·x₁, w₂·x₂, … The weights are the neuron's memory of what matters.",
      "Add the products together and add the bias b. This total is called z, the pre-activation.",
      "Apply the activation function f to z. The output is f(z), one number.",
      "Pass that number on as an input to the next layer of neurons, or report it as the answer.",
    ],
    visual: {
      kind: "flow",
      steps: ["inputs x₁, x₂, x₃", "multiply by weights w₁, w₂, w₃", "add up, plus bias b → z", "activation f(z)", "output a"],
      caption: "One neuron, left to right. Everything a network does is this diagram repeated and connected.",
    },
    everyday: {
      title: "Deciding whether to take an umbrella",
      text: "You look at three things: the sky (dark or clear), the forecast (rain chance) and whether you have a coat. Each counts differently: a dark sky counts a lot, the coat counts a little. You weigh them, add a personal bias (you hate getting wet), and if the total crosses a line, you take the umbrella. That is a neuron: inputs, weights, bias, a threshold-like decision.",
    },
    engineering: {
      title: "The first neuron of a handwritten-digit reader",
      text: "A digit image is 28 by 28 pixels, so 784 inputs between 0 (white) and 1 (black). One neuron in the first layer has 784 weights and one bias. After training, its weights form a faint picture: positive where ink tends to be for a loop, negative elsewhere. Show it a '0' and the weighted sum is large; show it a '1' and it is small. Six hundred such neurons, each sensitive to a different stroke, feed the next layer. Engineers never set those 784 weights by hand; training from Module 5 does, and they inspect them afterwards to check the neuron learned a stroke and not a shortcut.",
    },
    maths: {
      formula: "z = w₁·x₁ + w₂·x₂ + … + wₙ·xₙ + b ;   a = f(z)",
      meaning: "x are the inputs, w the weights (one per input), b the bias, z the weighted sum, f the activation function, a the neuron's output.",
      worked: [
        "Inputs: x = (2, 0.5, −1). Weights: w = (0.4, 1.0, 0.3). Bias b = 0.1.",
        "Products: 0.4·2 = 0.8; 1.0·0.5 = 0.5; 0.3·(−1) = −0.3.",
        "Sum plus bias: z = 0.8 + 0.5 − 0.3 + 0.1 = 1.1.",
        "Activation ReLU (keep positives, zero out negatives): a = max(0, 1.1) = 1.1. With sigmoid instead: a = 1 / (1 + e^(−1.1)) ≈ 0.75.",
      ],
      note: "The same three inputs with different weights would give a different z. Training is the search for weights that give useful z's.",
    },
    code: {
      title: "One neuron in plain Python",
      lang: "py",
      src: `import math

def neuron(inputs, weights, bias, activation="relu"):
    z = bias
    for x, w in zip(inputs, weights):
        z += w * x                      # weighted sum
    if activation == "relu":
        return max(0.0, z)
    return 1 / (1 + math.exp(-z))       # sigmoid

x = [2.0, 0.5, -1.0]
w = [0.4, 1.0, 0.3]
print(neuron(x, w, 0.1))                 # 1.1
print(neuron(x, w, 0.1, "sigmoid"))      # 0.750…`,
      lines: [
        { code: "z = bias", say: "Start the running total from the bias, the one number not tied to any input." },
        { code: "z += w * x                      # weighted sum", say: "Each input is multiplied by its own weight and added in. This loop is the whole 'thinking' of the neuron." },
        { code: "return max(0.0, z)", say: "ReLU activation: negative totals become zero, positive ones pass through unchanged." },
        { code: "return 1 / (1 + math.exp(-z))       # sigmoid", say: "Sigmoid activation: squashes any total into a number between 0 and 1." },
        { code: "print(neuron(x, w, 0.1))                 # 1.1", say: "The worked example from the maths section, confirmed by code." },
      ],
      output: "1.1\n0.7502601055951177",
      note: "Real libraries do this with matrix operations across thousands of neurons at once; the arithmetic is identical.",
    },
    useIt: "You will never write a single neuron in production, but you will read every network as neurons: a layer's weight matrix is just many neurons' weight lists stacked, a parameter count is weights plus biases, and a saturated or dead neuron (lesson 6.8 and Module 7) is a neuron whose activation stopped responding. Understanding one neuron lets you reason about all of them.",
    takeaways: ["A neuron: multiply inputs by weights, add the bias, apply an activation.", "Weights and bias are the parameters that training adjusts.", "The activation bends the output; without it a neuron is a straight-line formula.", "Networks are this unit copied and connected in layers."],
    terms: [["artificial neuron", "a unit that computes a weighted sum of its inputs plus a bias, then applies an activation function"], ["pre-activation (z)", "the weighted sum plus bias, before the activation function"], ["activation (a)", "the neuron's output after the activation function"]],
    reflect: { q: "A neuron has weights (0, 0, 0) and bias 5. What does it output for any input, and is it useful?", a: "Always f(5), whatever the inputs: a constant. On its own it is useless, but a constant can still be useful downstream, and training will move those zero weights the moment the error depends on them." },
  },

  "m06-biological-vs-artificial-neuron": {
    simple: "The artificial neuron borrows a sketch of the brain cell, inputs, a threshold, an output, but it is a formula, not a model of biology.",
    concept:
      "A brain cell, the **biological neuron**, receives electrical signals from thousands of other cells through branches called dendrites. If enough signal arrives in a short time, the cell fires: it sends a spike down its long fibre, the axon, to other cells. The connections between cells, called synapses, strengthen or weaken with use. That is how brains learn.\n\nThe artificial neuron keeps the outline and drops the biology. Dendrites become inputs; synapse strengths become weights; 'enough signal' becomes a weighted sum compared against a bias; firing becomes an activation function; the axon becomes the output passed to the next layer. No timing, no chemistry, no spikes; just numbers.\n\nThe resemblance is a useful picture and nothing more. Artificial networks learn by gradient descent, a maths procedure brains do not use. They run in layers in lockstep; brains run asynchronously and in parallel with feedback everywhere. Calling it a neuron honours the inspiration, but reasoning about networks by brain analogies leads to wrong conclusions quickly.",
    why:
      "The question comes up constantly, from interviewers and from headlines: is this a brain? Knowing exactly what was borrowed and what was not lets you answer precisely. It also protects your engineering judgement: a network is not conscious because it has 'neurons', will not generalise like a child because it has 'synapses', and cannot be fixed by making it 'more like a brain' without saying which property you mean.\n\nThe analogy did drive real progress: the idea of many simple adaptive units connected together came from biology in the 1940s and 1950s, long before it worked in practice. That history is worth knowing; the biology is not needed to build anything.",
    how: [
      "Biological: thousands of dendrites collect chemical and electrical signals of varying strength and timing.",
      "Artificial: a fixed list of numeric inputs, each multiplied by a weight.",
      "Biological: when the membrane voltage crosses a threshold, the cell fires an all-or-nothing spike and resets.",
      "Artificial: the weighted sum plus bias goes through a smooth or piecewise function; the output is a number, not a spike.",
      "Biological: synapses change strength through local rules influenced by timing and chemistry.",
      "Artificial: all weights change together by gradient descent on a loss computed at the output.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Brain cell", "Artificial neuron", "Kept?"],
        rows: [
          ["dendrites receiving signals", "inputs x", "yes, as the idea of many inputs"],
          ["synapse strength", "weight w", "yes, as an adjustable number"],
          ["firing threshold", "bias b and activation f", "roughly"],
          ["all-or-nothing spike with timing", "a continuous number", "no"],
          ["local learning rules", "gradient descent from a loss", "no"],
          ["86 billion cells, each with ~7,000 connections", "layers of identical units", "the scale, not the structure"],
        ],
      },
      caption: "The outline survived; the mechanism did not. Artificial neurons are formulas named after cells.",
    },
    everyday: {
      title: "A paper aeroplane and a bird",
      text: "A paper aeroplane borrows the wing from a bird: a flat surface that air flows over. It does not flap, has no feathers, and does not get tired. Nobody says the aeroplane 'is' a bird. The artificial neuron borrows the bird's wing in the same way: the shape of the idea, none of the living machinery.",
    },
    engineering: {
      title: "What an engineer actually uses from biology",
      text: "A team building a speech recogniser never looks at neuroscience. They choose layer sizes, activation functions and learning rates by experiment and by measured validation accuracy. The one place the biological word matters is communication: when a product manager asks whether the model 'understands' speech the way a person does, the engineer explains that it is a large learned function mapping sound features to letters, trained by gradient descent, with no auditory cortex and no understanding to speak of. Clear expectations prevent promises the system cannot keep.",
    },
    useIt: "Use the comparison when explaining neural networks to non-engineers and when interviewers probe whether you understand what the model is. Keep the brain picture for intuition about many simple units combining, and drop it the moment you reason about training, generalisation or failure, where the maths, not the biology, is what applies.",
    takeaways: ["Inputs, weights, a threshold-like bias and an output were borrowed from the brain cell.", "Spikes, timing, chemistry and local learning rules were not.", "Networks learn by gradient descent, which brains do not use.", "Use the analogy for intuition only; reason about networks with maths."],
    terms: [["biological neuron", "a brain cell that fires an electrical spike when enough input signal arrives"], ["synapse", "the connection between brain cells whose strength changes with learning"]],
    reflect: { q: "Why might 'make the network more brain-like' be a poor engineering instruction?", a: "Because it does not name a measurable property. 'Add feedback connections' or 'use sparse activation' are instructions that can be tested; 'brain-like' is not. Progress in deep learning came from maths and experiments, not from copying biology more faithfully." },
  },

  "m06-inputs-and-weights": {
    simple: "Inputs are the numbers a neuron receives; weights are the numbers it multiplies them by, and the weights are what learning changes.",
    concept:
      "A neuron sees the world as a list of numbers called **inputs**. For a digit image, each pixel's darkness is one input. For a loan application, income, age and debt are inputs. The neuron does not know what the numbers mean; it only sees their values.\n\nEach input has a partner number inside the neuron, its **weight**. The weight multiplies the input before anything is added up, so it decides how much that input influences the output and in which direction. A weight of 2.0 amplifies an input; a weight of 0.1 nearly ignores it; a weight of −1.5 makes a large input push the output down.\n\nWeights are the neuron's knowledge. Before training they are random and the neuron responds to nonsense. Training (Module 5) nudges each weight toward values that make the output useful. After training, reading a neuron's weights tells you what it learned to look for, which is how engineers inspect what a layer is doing.",
    why:
      "A neuron needs a way to treat inputs differently: a dark sky matters more than a stray cloud. Multiplying by a per-input number is the simplest way to express 'how much this one matters', and it is differentiable, which means gradient descent can adjust it smoothly.\n\nSeparating inputs (given by the data) from weights (owned and learned by the model) is also the division that makes machine learning work: data arrives and leaves; weights stay and improve. Everything called a 'parameter count' is counting weights, plus biases.",
    how: [
      "The input list arrives in a fixed order: input 1 is always the same measurement (say, pixel 1), so weight 1 always pairs with it.",
      "Each weight starts at a small random value so different neurons start differently.",
      "The neuron multiplies input by weight, pair by pair. A product's sign says whether that input pushes up or down; its size says how hard.",
      "During training, the gradient of the loss with respect to each weight says which way to move it; weights paired with inputs that would have helped are moved so they help more next time.",
      "After training, weights are frozen for inference; the same input list then always gives the same output.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Input (loan application)", "Value x", "Weight w after training", "Product w·x", "Reading"],
        rows: [
          ["monthly income (£000s)", "3.2", "+0.9", "+2.88", "income pushes the approval score up"],
          ["existing debt (£000s)", "12.0", "−0.25", "−3.00", "debt pushes it down, strongly"],
          ["years at address", "4", "+0.1", "+0.40", "stability helps a little"],
          ["day of week applied", "2", "0.0", "0.00", "irrelevant: training drove the weight to zero"],
        ],
      },
      caption: "The weights were learned, not written. Their signs and sizes are the model's opinion of each input.",
    },
    everyday: {
      title: "Marks that count differently",
      text: "A course grade is 60% exam, 30% coursework, 10% attendance. Each component is an input; each percentage is a weight. Score 80 on the exam, 70 on coursework, 100 attendance: 0.6·80 + 0.3·70 + 0.1·100 = 48 + 21 + 10 = 79. Change the weights and the same marks give a different grade. A neuron's weights are the same idea, except nobody chose them; they were learned.",
    },
    engineering: {
      title: "Reading the weights of a fraud neuron",
      text: "A payments team trains a small network on transactions. One first-layer neuron ends up with a large positive weight on 'transaction amount', a large positive weight on 'new device', a negative weight on 'customer age in months', and nearly zero on 'hour of day'. The team reads it as 'large amounts from new devices on young accounts': a plausible fraud pattern. When another neuron shows a large weight on the merchant's postcode, they investigate and find a data leak: a single merchant had been mislabelled, and the network learned the label from the postcode. Reading weights caught a bug that accuracy numbers hid.",
    },
    maths: {
      formula: "contribution of input i = wᵢ · xᵢ ;   z = Σᵢ wᵢ·xᵢ + b",
      meaning: "Each input's contribution is its value times its weight. The sign of the product says the direction; its size says the strength. z adds all contributions and the bias.",
      worked: [
        "Inputs x = (3.2, 12.0, 4, 2), weights w = (0.9, −0.25, 0.1, 0.0), bias b = −0.5.",
        "Contributions: 2.88, −3.00, 0.40, 0.00.",
        "z = 2.88 − 3.00 + 0.40 + 0.00 − 0.5 = −0.22.",
        "Doubling income to 6.4 adds 0.9 · 3.2 = 2.88 more: z becomes 2.66. Doubling the day-of-week input changes nothing, because its weight is 0.",
      ],
    },
    code: {
      title: "Inputs and weights as vectors",
      lang: "py",
      src: `import numpy as np

x = np.array([3.2, 12.0, 4.0, 2.0])      # one loan application
w = np.array([0.9, -0.25, 0.1, 0.0])     # learned weights
b = -0.5

contributions = w * x                    # element by element
z = contributions.sum() + b
print(contributions)                     # [ 2.88 -3.    0.4   0.  ]
print(round(z, 2))                       # -0.22`,
      lines: [
        { code: "x = np.array([3.2, 12.0, 4.0, 2.0])      # one loan application", say: "The inputs as a vector (Module 3): one number per measurement, in a fixed order." },
        { code: "w = np.array([0.9, -0.25, 0.1, 0.0])     # learned weights", say: "One weight per input, in the same order. These came out of training." },
        { code: "contributions = w * x                    # element by element", say: "NumPy multiplies pair by pair. Each product is one input's say in the decision." },
        { code: "z = contributions.sum() + b", say: "Add them all and the bias: the pre-activation from lesson 6.1." },
      ],
      output: "[ 2.88 -3.    0.4   0.  ]\n-0.22",
    },
    useIt: "Whenever a model misbehaves, inspecting weights and contributions is a first diagnostic: which inputs dominate, which are ignored, whether an input that should not matter (a postcode, an ID) carries a large weight. For tabular models, per-input contributions are also the basis of the explanations regulators ask for.",
    takeaways: ["Inputs come from the data; weights live in the model and are learned.", "Each weight scales one input: sign gives direction, size gives strength.", "A weight near zero means the input is ignored.", "Reading trained weights shows what a neuron looks for, and can expose data bugs."],
    terms: [["input", "one number the neuron receives, from data or from the previous layer"], ["weight", "the learned number that multiplies an input"], ["contribution", "an input times its weight: that input's share of the weighted sum"]],
    reflect: { q: "Two inputs are measured in different units: income in pounds (around 30,000) and age in years (around 40). Why does this make training harder?", a: "The income input is a thousand times larger, so its weight needs to be a thousand times smaller to have a comparable effect, and gradient steps that suit one weight are wrong for the other. Rescaling inputs to similar ranges (normalisation) fixes it; Module 9 covers the same idea inside the network." },
  },

  "m06-bias": {
    simple: "The bias is the one number a neuron adds that does not depend on any input: it shifts the output up or down and sets where the neuron switches on.",
    concept:
      "Besides a weight per input, every neuron has one extra parameter, the **bias**. It is added to the weighted sum regardless of what the inputs are. If all inputs were zero, the neuron's pre-activation would be exactly the bias.\n\nThe bias moves the neuron's switching point. With a ReLU activation, the neuron outputs zero until the weighted sum exceeds minus the bias; a bias of −3 means the inputs must push the sum past 3 before the neuron responds. With a sigmoid, the bias shifts the whole S-curve left or right, deciding how much evidence is needed for a 0.5 output.\n\nIt is easy to confuse this bias with 'bias' in the social sense, a model treating groups unfairly. They are unrelated. The parameter bias is a single adjustable number; the fairness problem is about data and outcomes (Module 19). In this lesson and the rest of Stage 2, bias means the parameter.",
    why:
      "Without a bias, a neuron's boundary is forced to pass through the origin: with zero inputs it must output f(0). Many real decisions need a threshold that does not sit at zero. A spam neuron should fire only when the evidence is strong, not whenever any evidence exists; a temperature sensor neuron should switch at 19 degrees, not at zero. The bias provides that freedom with one extra number.\n\nIt also lets later layers shift signals into the useful range of their activation functions. Much of what batch normalisation does later (Module 9) is a learned, cleverer version of what biases do crudely.",
    how: [
      "The neuron computes the weighted sum of its inputs as before.",
      "It adds the bias b, a learned number, to that sum: z = Σ w·x + b.",
      "The activation reads z. For ReLU, the neuron is 'on' only when Σ w·x > −b, so −b is the switching threshold.",
      "During training the bias receives a gradient like any weight; its gradient is simply the error signal, because the bias's 'input' is a constant 1.",
      "The bias settles where the neuron's threshold makes the loss smallest.",
    ],
    visual: {
      kind: "compare",
      left: { title: "No bias", points: ["z = w·x", "boundary passes through the origin", "a neuron cannot say 'only above 19 degrees'", "with zero inputs the output is fixed at f(0)"] },
      right: { title: "With bias", points: ["z = w·x + b", "boundary shifts to where it is needed", "threshold at −b, learned from data", "with zero inputs the output is f(b), also learned"] },
      caption: "One extra number per neuron buys the freedom to set the threshold anywhere.",
    },
    everyday: {
      title: "A thermostat's set point",
      text: "A thermostat compares the room temperature with a set point and switches the heating on when the room is colder. The weight on the temperature reading is fixed; the set point is the bias. Move it from 19 to 21 and the same readings now trigger the heating sooner. Nothing about the sensor changed; the threshold did.",
    },
    engineering: {
      title: "A defect detector that fired on everything",
      text: "A factory trains a tiny network to flag defective bottles from camera features. In an early version a developer removed biases 'to simplify'. The first-layer neurons could then only draw boundaries through the origin of the feature space, and because every feature was positive (brightness, edge counts), each neuron was either always on or always off. The network could not separate anything and accuracy stuck at the base rate. Restoring the biases let neurons fire only when a feature exceeded a learned level, and the detector reached 98%. The lesson stuck: a parameter that looks optional is there for a reason.",
    },
    maths: {
      formula: "z = w·x + b ;   ReLU neuron switches on when w·x > −b",
      meaning: "b shifts z by a constant. For a ReLU, the output is zero until the weighted sum exceeds −b, so −b acts as the threshold.",
      worked: [
        "One input x = temperature. Weight w = −1 (colder should turn heating on), bias b = 19.",
        "At x = 17: z = −17 + 19 = 2 → ReLU output 2 (heating on, strength 2).",
        "At x = 21: z = −21 + 19 = −2 → ReLU output 0 (off).",
        "Change the bias to 21: at x = 20, z = −20 + 21 = 1 → on. The same sensor now triggers at a higher temperature.",
      ],
      note: "With a sigmoid, the bias sets where the output crosses 0.5: z = 0 when w·x = −b.",
    },
    code: {
      title: "Shifting the threshold with the bias",
      lang: "py",
      src: `def heating(temp, w=-1.0, b=19.0):
    z = w * temp + b
    return max(0.0, z)                 # ReLU: positive means 'heat', bigger means 'more'

for b in (19.0, 21.0):
    print(b, [heating(t, b=b) for t in (17, 19, 20, 21)])
# 19.0 [2.0, 0.0, 0.0, 0.0]
# 21.0 [4.0, 2.0, 1.0, 0.0]`,
      lines: [
        { code: "z = w * temp + b", say: "The weighted sum plus the bias. The bias does not touch the temperature; it shifts the total." },
        { code: "return max(0.0, z)                 # ReLU: positive means 'heat', bigger means 'more'", say: "The neuron is on only when z is positive, so the bias decides at which temperature that happens." },
        { code: "for b in (19.0, 21.0):", say: "Same weight, two biases: the switching point moves from 19 to 21 degrees." },
      ],
      output: "19.0 [2.0, 0.0, 0.0, 0.0]\n21.0 [4.0, 2.0, 1.0, 0.0]",
    },
    useIt: "Every layer in every framework has a bias vector by default; the parameter count of a layer is inputs × outputs + outputs because of it. You will see biases disabled deliberately only when a normalisation layer follows and makes them redundant. When a neuron is 'dead' (always zero), a very negative bias is often the cause.",
    takeaways: ["The bias is added to the weighted sum and does not depend on inputs.", "It sets the neuron's threshold: for ReLU, the neuron fires when the sum exceeds −b.", "Without it, every boundary must pass through the origin.", "Parameter bias has nothing to do with unfair bias in data."],
    terms: [["bias (parameter)", "the learned constant added to a neuron's weighted sum"], ["threshold", "the level the weighted sum must exceed for the neuron to switch on; −b for a ReLU neuron"], ["dead neuron", "a neuron whose output is zero for every input, often because its bias became very negative"]],
    reflect: { q: "A layer's biases are all exactly 0 after training. What might that tell you?", a: "Either the task genuinely needed boundaries through the origin (rare), or the biases were frozen or disabled, or a normalisation layer after it absorbed their job. Check the configuration before assuming the model learned nothing there." },
  },

  "m06-weighted-sum": {
    simple: "The weighted sum is the neuron's total: every input times its weight, added together with the bias. It is the one number the activation function will bend.",
    concept:
      "Put the last three lessons together and you get the **weighted sum**: z = w₁x₁ + w₂x₂ + … + wₙxₙ + b. It collapses many inputs into one number that says how strongly the evidence points in the neuron's direction. Positive means 'yes, strongly'; negative means 'no'; near zero means 'unsure'.\n\nIn Module 3 this operation had a name: the dot product of the weight vector and the input vector, plus a constant. That matters because dot products can be computed for thousands of neurons at once as one matrix multiplication, which is why networks run fast on graphics cards.\n\nThe weighted sum is also a straight-line formula. Doubling all inputs doubles z minus the bias; the surface it draws over the inputs is flat. Everything curved in a neural network comes from what happens next, the activation function; the weighted sum itself is linear, and that limitation is the subject of lesson 6.8.",
    why:
      "A neuron must combine many pieces of evidence into one decision. Adding weighted inputs is the simplest combination that lets each input count differently, is cheap to compute, and has a clean derivative with respect to every weight (the input itself), which is exactly what backpropagation in Module 5 needs.\n\nIt also scales: 784 pixel inputs, 4,096 feature inputs, 12,288 numbers from a previous transformer layer; the weighted sum handles any count with the same formula, and hardware is built to compute millions of them in parallel.",
    how: [
      "Line up the inputs x and the weights w in the same order.",
      "Multiply pair by pair to get the contributions.",
      "Add all contributions and the bias b. The result z is the weighted sum (pre-activation).",
      "For a whole layer, stack each neuron's weights as a row of a matrix W; then z for all neurons at once is W·x + b, one matrix-vector product.",
      "Hand z to the activation function.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Inputs", detail: "x = (1.0, 0.0, 0.5)" },
        { label: "Weights", detail: "w = (2.0, −1.0, 4.0), bias b = −1.5" },
        { label: "Contributions", detail: "2.0, 0.0, 2.0" },
        { label: "Weighted sum", detail: "z = 2.0 + 0.0 + 2.0 − 1.5 = 2.5" },
        { label: "Interpretation", detail: "positive and fairly large: the evidence points the neuron's way" },
      ],
      caption: "Three inputs, one number. The sign and size of z are what the activation reads next.",
    },
    everyday: {
      title: "A shopping basket total",
      text: "Three apples at 30p, no bread, half a kilo of rice at £4 per kilo, minus a £1.50 voucher. The total is 0.90 + 0 + 2.00 − 1.50 = £1.40. Quantities are inputs, prices are weights, the voucher is the bias. The till does a weighted sum. A neuron's z is the same sum, where the 'prices' were learned.",
    },
    engineering: {
      title: "One matrix multiply for a whole layer",
      text: "A product-image classifier has a first layer of 512 neurons reading 2,048 features. Computing 512 separate weighted sums with loops would be slow. Instead the weights live in a 512 × 2,048 matrix and the layer computes all 512 sums in one matrix-vector multiplication, and for a batch of 256 images, one matrix-matrix multiplication of 512 × 2,048 by 2,048 × 256. A graphics card does that in well under a millisecond. Framework code never mentions neurons; it mentions matrices, because the weighted sum is a dot product and dot products batch perfectly.",
    },
    maths: {
      formula: "z = w · x + b = Σᵢ wᵢxᵢ + b ;   for a layer: z = W x + b",
      meaning: "w · x is the dot product of the weight vector and the input vector. For a layer, W is a matrix with one row per neuron, so z becomes a vector with one entry per neuron.",
      worked: [
        "x = (1.0, 0.0, 0.5). Neuron A: w = (2.0, −1.0, 4.0), b = −1.5 → z = 2.0 + 0 + 2.0 − 1.5 = 2.5.",
        "Neuron B: w = (−1.0, 3.0, 0.0), b = 0.5 → z = −1.0 + 0 + 0 + 0.5 = −0.5.",
        "Stack as a matrix W = [[2.0, −1.0, 4.0], [−1.0, 3.0, 0.0]], b = (−1.5, 0.5).",
        "W x + b = (2.0 + 0 + 2.0, −1.0 + 0 + 0) + (−1.5, 0.5) = (2.5, −0.5): both neurons in one operation.",
      ],
    },
    code: {
      title: "Two neurons as one matrix multiply",
      lang: "py",
      src: `import numpy as np

x = np.array([1.0, 0.0, 0.5])
W = np.array([[2.0, -1.0, 4.0],      # neuron A's weights
              [-1.0, 3.0, 0.0]])     # neuron B's weights
b = np.array([-1.5, 0.5])

z = W @ x + b                        # all weighted sums at once
print(z)                             # [ 2.5 -0.5]`,
      lines: [
        { code: "W = np.array([[2.0, -1.0, 4.0],      # neuron A's weights", say: "Each row of the matrix is one neuron's weight list (lesson 6.3)." },
        { code: "b = np.array([-1.5, 0.5])", say: "One bias per neuron, as a vector." },
        { code: "z = W @ x + b                        # all weighted sums at once", say: "The @ operator is matrix multiplication (Module 3). One line computes every neuron's z." },
      ],
      output: "[ 2.5 -0.5]",
    },
    useIt: "Every dense layer, every attention score, every embedding lookup is a weighted sum in matrix form. Knowing that lets you estimate compute (multiplications ≈ inputs × outputs per example), understand why batching speeds things up, and read framework shapes: a layer declared as (2048 → 512) is a 512 × 2048 weight matrix plus 512 biases.",
    takeaways: ["z = w·x + b: the dot product of weights and inputs plus the bias.", "The sign and size of z say how strongly the evidence points the neuron's way.", "A layer's weighted sums are one matrix multiplication, which is why networks are fast on GPUs.", "The weighted sum is linear; the activation adds the curve."],
    terms: [["weighted sum", "the inputs times their weights, added together with the bias"], ["dot product", "multiply two vectors element by element and add the results (Module 3)"], ["weight matrix", "a layer's weights arranged with one row per neuron"]],
    reflect: { q: "A layer maps 784 inputs to 128 neurons. How many multiplications does one image need?", a: "784 × 128 = 100,352 multiplications (plus 128 additions of biases). For a batch of 64 images, 64 times that, done as one matrix multiplication." },
  },

  "m06-activation-function": {
    simple: "The activation function is the fixed curve a neuron applies to its weighted sum, turning a straight-line total into an output that can bend, clip or squash.",
    concept:
      "After the weighted sum, the neuron applies an **activation function**: a simple, fixed mathematical function with no parameters of its own. It takes the single number z and returns the neuron's output a = f(z).\n\nThe common ones are each one line. ReLU returns max(0, z): negatives become zero, positives pass through. Sigmoid returns 1 / (1 + e^(−z)): an S-curve from 0 to 1, useful when the output should read as a probability. Tanh is a similar S-curve from −1 to 1. Softmax is applied across a whole layer and turns a list of scores into probabilities that add up to 1. Module 7 looks at each in turn.\n\nWhat they share is being non-linear: the output is not a straight-line function of z. That single property is what lets layers of neurons represent curved boundaries and complicated shapes. The weighted sum gathers evidence; the activation decides how the evidence is expressed.",
    why:
      "If neurons only did weighted sums, a stack of layers would collapse into one weighted sum, because a linear function of a linear function is still linear (lesson 6.8 proves it with numbers). Depth would buy nothing. The activation function breaks that collapse: it inserts a bend between layers, and bends composed with bends can trace any shape.\n\nActivations also shape what a neuron's output means. A sigmoid output can be read as a probability; a ReLU output as 'how strongly this feature is present, zero if absent'. Choosing the activation is choosing the vocabulary a layer speaks.",
    how: [
      "The neuron computes z = w·x + b.",
      "It passes z into a fixed function f. No weights are involved; f is the same for every neuron in the layer.",
      "f reshapes z: clips it (ReLU), squashes it to a range (sigmoid, tanh), or normalises a whole vector (softmax).",
      "The result a is the neuron's output and the next layer's input.",
      "During training, the derivative of f at z scales the gradient flowing back through the neuron; functions with flat regions pass little gradient there.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Activation", "Formula", "Output range", "z = −2", "z = 0", "z = 2"],
        rows: [
          ["ReLU", "max(0, z)", "0 to ∞", "0", "0", "2"],
          ["Sigmoid", "1 / (1 + e^(−z))", "0 to 1", "0.12", "0.5", "0.88"],
          ["Tanh", "(e^z − e^(−z)) / (e^z + e^(−z))", "−1 to 1", "−0.96", "0", "0.96"],
          ["Linear (none)", "z", "−∞ to ∞", "−2", "0", "2"],
        ],
      },
      caption: "The same three z values through four activations. Only the linear one leaves them as a straight line.",
    },
    everyday: {
      title: "A dimmer switch, a light switch and a volume knob",
      text: "A dimmer that turns the light up smoothly from off to full is a sigmoid: push harder and it brightens, but it can never go past full. A light switch that stays off until you push past a point and then lets everything through is a ReLU. A volume knob with no limit is linear. Each turns the same push into a different kind of response, and that response shape is the activation function.",
    },
    engineering: {
      title: "Changing one activation changed a speech model's training",
      text: "A speech-recognition team had a six-layer network using sigmoid activations everywhere. Training was painfully slow and the deeper layers barely changed. They swapped the hidden-layer activations for ReLU, kept a softmax at the output, and left everything else alone. Training time to the same accuracy dropped by about two-thirds. The reason, covered in Module 9, is that sigmoid's flat ends pass almost no gradient backwards, while ReLU passes it unchanged for positive inputs. One line of configuration, chosen for its derivative, not its shape at the output.",
    },
    maths: {
      formula: "a = f(z) ;   ReLU: f(z) = max(0, z) ;   sigmoid: σ(z) = 1 / (1 + e^(−z))",
      meaning: "f is a fixed function applied to the weighted sum z. e is the constant 2.718…; e^(−z) shrinks as z grows, so σ(z) rises toward 1.",
      worked: [
        "z = 1.1 (from lesson 6.1). ReLU: max(0, 1.1) = 1.1.",
        "Sigmoid: e^(−1.1) ≈ 0.333; 1 + 0.333 = 1.333; 1 / 1.333 ≈ 0.75.",
        "z = −1.1. ReLU: 0. Sigmoid: e^(1.1) ≈ 3.004; 1 / 4.004 ≈ 0.25.",
        "Note the symmetry: σ(−z) = 1 − σ(z). A sigmoid neuron that says 0.75 for one input says 0.25 for its mirror image.",
      ],
    },
    code: {
      title: "Three activations side by side",
      lang: "py",
      src: `import numpy as np

def relu(z):    return np.maximum(0.0, z)
def sigmoid(z): return 1 / (1 + np.exp(-z))
def tanh(z):    return np.tanh(z)

z = np.array([-2.0, 0.0, 2.0])
print(relu(z))       # [0. 0. 2.]
print(sigmoid(z))    # [0.119 0.5   0.881]
print(tanh(z))       # [-0.964  0.     0.964]`,
      lines: [
        { code: "def relu(z):    return np.maximum(0.0, z)", say: "Element by element: anything below zero becomes zero." },
        { code: "def sigmoid(z): return 1 / (1 + np.exp(-z))", say: "The S-curve. Large negative z → near 0; large positive z → near 1." },
        { code: "z = np.array([-2.0, 0.0, 2.0])", say: "The same three pre-activations fed to each function, matching the table." },
      ],
      output: "[0. 0. 2.]\n[0.11920292 0.5        0.88079708]\n[-0.96402758  0.          0.96402758]",
    },
    useIt: "You choose activations when designing a network: ReLU-family functions inside, sigmoid or softmax at a classification output, none at a regression output. When training stalls or outputs saturate, the activation is one of the first things to check. Module 7 gives the decision rules.",
    takeaways: ["The activation is a fixed, parameter-free function applied to z.", "It is non-linear, which is what makes depth useful.", "Different activations give outputs different meanings: probability, presence, signed strength.", "Its derivative controls how much gradient flows back through the neuron."],
    terms: [["activation function", "the fixed curve applied to a neuron's weighted sum"], ["ReLU", "max(0, z): zero for negatives, identity for positives"], ["sigmoid", "an S-curve squashing any number into (0, 1)"], ["non-linear", "not a straight line: the output is not proportional to the input"]],
    reflect: { q: "Why does the activation have no weights of its own?", a: "Its job is to add a fixed bend; the learnable shaping happens in the weights and bias before it. Some modern variants do add a learnable slope, but the standard ones stay fixed so the layer's behaviour remains easy to reason about and cheap to compute." },
  },

  "m06-how-a-neuron-produces-an-output": {
    simple: "A neuron's output is one pass through the whole pipeline: inputs times weights, plus bias, through the activation; the number that comes out is what the next layer sees.",
    concept:
      "This lesson follows one real input all the way through a neuron so the pieces from the previous lessons become one motion. The neuron below is from a tiny network that flags suspicious log-ins: three inputs, three weights, a bias, a sigmoid. Its **output** is a number between 0 and 1 that later layers, or a threshold, will turn into a decision.\n\nThe inputs are measurements of one log-in: how many failed password attempts preceded it, whether the device is new (1) or known (0), and the distance in thousands of kilometres from the user's usual location. The weights were learned from past incidents. The bias is negative, so the neuron stays quiet unless the evidence is strong.\n\nFollowing the numbers shows what each part does: weights turn raw measurements into signed evidence, the bias sets how much evidence is needed, and the sigmoid turns the total into something readable as a probability of 'suspicious'.",
    why:
      "Seeing the formula is not the same as seeing it run. Engineers debug networks by doing exactly this: taking one example and tracing its numbers through a neuron or layer to see where an unexpected output came from. The habit of tracing turns a network from a black box into a sequence of small, checkable steps.\n\nIt also makes inference concrete: once trained, a network is nothing but this computation repeated, layer by layer, for every example. There is no reasoning, no search; just arithmetic.",
    how: [
      "Read the inputs for one log-in: failed attempts = 4, new device = 1, distance = 2.5 (thousand km).",
      "Multiply by the learned weights (0.6, 1.5, 0.8): 2.4, 1.5, 2.0.",
      "Add the contributions and the bias −4.0: z = 2.4 + 1.5 + 2.0 − 4.0 = 1.9.",
      "Apply the sigmoid: a = 1 / (1 + e^(−1.9)) ≈ 0.87.",
      "Pass 0.87 on. A threshold of 0.5 would flag this log-in; a next layer might combine it with other neurons' outputs first.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Inputs", detail: "failed attempts 4 · new device 1 · distance 2.5" },
        { label: "× weights", detail: "0.6 · 1.5 · 0.8 → contributions 2.4, 1.5, 2.0" },
        { label: "+ bias", detail: "−4.0 → z = 1.9" },
        { label: "sigmoid", detail: "a = 0.87" },
        { label: "Meaning", detail: "strong evidence of a suspicious log-in" },
      ],
      caption: "One log-in, one neuron, one number out. Change any input and every later number shifts.",
    },
    everyday: {
      title: "A doorman's quick judgement",
      text: "A doorman glances at three things: is the person on the list, are they dressed for the event, are they with someone known. Each counts differently, the doorman has a default of 'no' unless convinced, and the result is a feeling between 'definitely not' and 'definitely yes' that becomes a decision at the door. The neuron does the same with numbers and never gets tired or inconsistent.",
    },
    engineering: {
      title: "Tracing a false alarm",
      text: "A security team's log-in model flagged the chief executive's log-in from a conference abroad as suspicious. Tracing one neuron showed why: distance contributed 0.8 × 6.0 = 4.8 on its own, enough to pass the bias even with zero failed attempts and a known device. The fix was not in the neuron but in the data: distance was unbounded, so one feature could dominate. They capped the distance feature and retrained; the neuron's weight on distance fell and the alarm stopped. The trace pointed at the right fix in minutes.",
    },
    maths: {
      formula: "a = σ(w · x + b) = 1 / (1 + e^(−(w·x + b)))",
      meaning: "The full neuron in one expression: dot product, plus bias, through the sigmoid σ.",
      worked: [
        "x = (4, 1, 2.5), w = (0.6, 1.5, 0.8), b = −4.0.",
        "w · x = 2.4 + 1.5 + 2.0 = 5.9; z = 5.9 − 4.0 = 1.9.",
        "e^(−1.9) ≈ 0.150; a = 1 / 1.150 ≈ 0.870.",
        "A known device from home (x = (0, 0, 0)): z = −4.0, a = 1 / (1 + e^4) ≈ 0.018. Quiet, as the bias intends.",
        "Four failed attempts alone (x = (4, 0, 0)): z = 2.4 − 4.0 = −1.6, a ≈ 0.17. Suspicious-ish, not flagged at 0.5.",
      ],
    },
    code: {
      title: "The full pass, three log-ins",
      lang: "py",
      src: `import numpy as np

w = np.array([0.6, 1.5, 0.8])     # failed attempts, new device, distance (thousand km)
b = -4.0

def suspicious(x):
    z = w @ x + b
    return 1 / (1 + np.exp(-z))

logins = {
    "conference, new laptop": np.array([4, 1, 2.5]),
    "home, known phone":      np.array([0, 0, 0.0]),
    "typo-prone, at home":    np.array([4, 0, 0.0]),
}
for name, x in logins.items():
    print(f"{name:24s} {suspicious(x):.3f}")`,
      lines: [
        { code: "z = w @ x + b", say: "Weighted sum plus bias in one line: the dot product from lesson 6.5." },
        { code: "return 1 / (1 + np.exp(-z))", say: "Sigmoid: the output is now a number between 0 and 1 that reads as 'probability of suspicious'." },
        { code: "\"home, known phone\":      np.array([0, 0, 0.0]),", say: "All inputs zero: the output is the sigmoid of the bias alone, about 0.018." },
        { code: "print(f\"{name:24s} {suspicious(x):.3f}\")", say: "Three log-ins, three outputs; the same arithmetic each time." },
      ],
      output: "conference, new laptop   0.870\nhome, known phone        0.018\ntypo-prone, at home      0.168",
    },
    useIt: "Tracing a single example through a neuron or layer is a daily debugging tool: it explains a surprising prediction, exposes a dominating feature, and verifies that a deployed model matches the trained one. Every 'why did the model say that?' investigation starts with this pass.",
    takeaways: ["Output = activation(weights · inputs + bias), computed left to right.", "Weights turn measurements into evidence; the bias sets how much is needed; the activation makes the total readable.", "With all inputs at zero the output is f(b).", "Tracing one example through the arithmetic is how networks get debugged."],
    terms: [["output (of a neuron)", "the activation value passed to the next layer or used as the prediction"], ["trace", "following one example's numbers through the model step by step"]],
    reflect: { q: "The sigmoid output was 0.87 and the threshold is 0.5. Does raising the threshold to 0.9 change the neuron?", a: "No. The neuron's output is still 0.87; only the decision rule applied after it changed. Thresholds live outside the neuron, which is why the same model can be made stricter or looser without retraining." },
  },

  "m06-why-a-neuron-needs-activation": {
    simple: "Without an activation, stacking neurons is pointless: any number of linear layers collapses into one linear layer, which can only draw straight boundaries.",
    concept:
      "Take away the activation function and a neuron is just z = w·x + b, a straight-line formula. Feed that into another such neuron and you get a straight-line formula of a straight-line formula. The algebra below shows what happens: the two collapse into a single straight-line formula with different numbers. Ten linear layers equal one linear layer. Depth buys nothing.\n\nA straight-line formula can only separate inputs with a flat boundary: a line in two dimensions, a plane in three. Many real problems are not like that. The classic example is the XOR pattern: output 1 when exactly one of two inputs is 1. No single straight line separates the 1s from the 0s, so no linear network, however deep, can learn it. Add one activation between two layers and a two-layer network solves it easily.\n\nThat is why a neuron needs an **activation**: the non-linearity is the only thing that lets layers compose into something more expressive than one layer. It is not decoration; it is the reason networks work.",
    why:
      "The value of deep learning (Module 1) was that layers build features on features: edges into shapes into objects. That building only happens if each layer can produce something a single formula could not. Non-linear activations make each layer a genuine new step rather than a rewriting of the previous one.\n\nUnderstanding this also explains design choices you will meet later: why there is an activation after nearly every layer, why the output layer often has none (a regression wants a plain number), and why 'adding more layers' to a linear model is a mistake people actually make.",
    how: [
      "Layer 1 without activation: h = W₁x + b₁.",
      "Layer 2 without activation: y = W₂h + b₂ = W₂(W₁x + b₁) + b₂.",
      "Multiply out: y = (W₂W₁)x + (W₂b₁ + b₂). Call W = W₂W₁ and b = W₂b₁ + b₂.",
      "So y = Wx + b: a single linear layer. The same holds for any number of layers.",
      "Insert an activation f: y = W₂ f(W₁x + b₁) + b₂. f cannot be absorbed into a matrix, so the layers no longer collapse, and the function can bend.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Two linear layers", points: ["y = W₂(W₁x + b₁) + b₂", "= (W₂W₁)x + (W₂b₁ + b₂)", "one straight boundary", "cannot solve XOR"] },
      right: { title: "Linear → ReLU → linear", points: ["y = W₂ max(0, W₁x + b₁) + b₂", "does not simplify", "boundaries can bend and join", "solves XOR with two hidden neurons"] },
      caption: "One activation between the layers is the difference between a ruler and a pencil.",
    },
    everyday: {
      title: "Folding paper",
      text: "Sliding a sheet of paper across a table, then sliding it again, is still one slide: you could have done it in a single move. Fold the paper between the slides and now the two moves together do something a single slide never could. Linear layers slide; the activation folds. Only the fold makes the second move worth doing.",
    },
    engineering: {
      title: "The churn model that would not improve",
      text: "A telecoms team built a churn predictor and, hoping for more power, stacked three layers without activations between them, because a template they copied had the activation commented out. Validation accuracy matched a plain logistic regression exactly, however many layers they added, and they spent a week tuning learning rates. A reviewer spotted the missing activations; with ReLU between layers the same network beat the baseline by several points, because customer behaviour has interactions (high usage AND recent complaints) that no straight boundary captures.",
    },
    maths: {
      formula: "XOR: inputs (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0 ;   solution: h₁ = ReLU(x₁ + x₂ − 0.5), h₂ = ReLU(x₁ + x₂ − 1.5), y = h₁ − 3h₂",
      meaning: "Two hidden ReLU neurons compute 'at least one input on' and 'both inputs on'; the output subtracts three times the second from the first. Without ReLU, h₂ would be negative for some inputs and the trick fails.",
      worked: [
        "(0,0): h₁ = ReLU(−0.5) = 0, h₂ = ReLU(−1.5) = 0, y = 0 − 0 = 0. Read as 0. Correct.",
        "(1,0): h₁ = ReLU(0.5) = 0.5, h₂ = ReLU(−0.5) = 0, y = 0.5 → above 0, read as 1. Correct.",
        "(0,1): same as (1,0) by symmetry: y = 0.5. Correct.",
        "(1,1): h₁ = ReLU(1.5) = 1.5, h₂ = ReLU(0.5) = 0.5, y = 1.5 − 3 · 0.5 = 0. Read as 0. Correct.",
        "Without ReLU, h₂(0,0) = −1.5 and y(0,0) = −0.5 − 3 · (−1.5) = 4 → wrongly read as 1. The clipping at zero is what makes it work.",
      ],
      note: "Checking the arithmetic on every case is exactly how you verify a hand-built network.",
    },
    code: {
      title: "XOR: linear fails, one ReLU succeeds",
      lang: "py",
      src: `import numpy as np

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
target = np.array([0, 1, 1, 0])

def hidden(x, relu):
    h = np.array([x.sum() - 0.5, x.sum() - 1.5])
    return np.maximum(0, h) if relu else h

for relu in (False, True):
    out = [hidden(x, relu) @ np.array([1.0, -3.0]) for x in X]
    pred = [1 if o > 0 else 0 for o in out]
    print("relu" if relu else "linear", pred, "target", list(target))`,
      lines: [
        { code: "h = np.array([x.sum() - 0.5, x.sum() - 1.5])", say: "Two hidden neurons with weights (1, 1) and biases −0.5 and −1.5: 'at least one on' and 'both on'." },
        { code: "return np.maximum(0, h) if relu else h", say: "The only difference between the two runs: clip negatives to zero, or do not." },
        { code: "out = [hidden(x, relu) @ np.array([1.0, -3.0]) for x in X]", say: "The output neuron: h₁ − 3h₂." },
        { code: "print(\"relu\" if relu else \"linear\", pred, \"target\", list(target))", say: "Linear gets (0,0) wrong; ReLU matches the target on all four." },
      ],
      output: "linear [1, 1, 1, 0] target [0, 1, 1, 0]\nrelu [0, 1, 1, 0] target [0, 1, 1, 0]",
    },
    useIt: "Always place a non-linear activation between consecutive layers; leave it out only at a regression output or where a following layer supplies it. When a deep model performs exactly like a linear baseline, check for missing activations before tuning anything else. The same reasoning explains why transformers keep a non-linear feedforward block in every layer.",
    takeaways: ["Linear layers stacked collapse into one linear layer; depth needs non-linearity.", "A linear model can only draw flat boundaries and cannot learn XOR.", "One activation between layers lets boundaries bend and solves XOR with two hidden neurons.", "A deep model matching a linear baseline usually has its activations missing."],
    terms: [["linear", "a straight-line relationship: scaling the input scales the output, with no bends"], ["XOR", "the 'exactly one' pattern: a two-input problem no straight line can separate"], ["collapse", "when stacked linear layers simplify to a single linear layer"]],
    reflect: { q: "A network has activations between its layers but none on its final layer. Is that a mistake?", a: "Usually not. For regression the output should be any real number, so no squashing is wanted; for classification a softmax or sigmoid is applied at the output, often inside the loss function rather than as a layer. What must never be missing are the activations between hidden layers." },
  },
};

export const M06_QUIZ: Quiz[] = [
  {
    q: "A neuron has inputs (1, 2), weights (0.5, −1) and bias 1. With ReLU, what is its output?",
    options: ["−0.5", "0", "0.5", "1.5"],
    answer: 1,
    why: ["That is z before the activation: 0.5 − 2 + 1 = −0.5.", "Correct. z = −0.5 and ReLU clips negatives to zero.", "The sign of the sum is negative, not positive.", "The bias alone is not the output."],
  },
  {
    q: "What does a weight near zero mean for its input?",
    options: ["The input is very important", "The input is ignored by that neuron", "The input must be rescaled", "The neuron is dead"],
    answer: 1,
    why: ["A large magnitude would mean important.", "Correct. The contribution w·x is near zero whatever the input's value.", "Scale is a separate concern; a zero weight already ignores the input.", "A dead neuron outputs zero for all inputs; one zero weight does not cause that."],
  },
  {
    q: "What does the bias do in a ReLU neuron?",
    options: ["Scales all inputs equally", "Sets the threshold the weighted sum must exceed to switch the neuron on", "Makes the output a probability", "Removes unfair patterns from the data"],
    answer: 1,
    why: ["Scaling is what weights do.", "Correct. The neuron fires when w·x > −b, so −b is the threshold.", "That is the sigmoid's job.", "The parameter bias is unrelated to fairness."],
    reason: true,
  },
  {
    q: "Why are a layer's weighted sums computed as one matrix multiplication?",
    options: ["Because matrices are more accurate", "Because each neuron's weighted sum is a dot product, and stacking the weight rows into a matrix computes all of them at once", "Because activations require matrices", "Because biases cannot be added otherwise"],
    answer: 1,
    why: ["Accuracy is the same.", "Correct. W·x + b gives every neuron's z in one hardware-friendly operation.", "Activations are applied element by element afterwards.", "Biases are a vector added after the product."],
  },
  {
    q: "Which statement about the activation function is true?",
    options: ["It has its own weights that training adjusts", "It is a fixed non-linear function applied to the weighted sum", "It only matters at the output layer", "It converts inputs to weights"],
    answer: 1,
    why: ["Standard activations have no parameters.", "Correct. It adds the bend; the learnable shaping is in the weights and bias.", "It matters between every pair of layers.", "No."],
  },
  {
    q: "Two layers with no activation between them are equivalent to what?",
    options: ["A deeper network", "A single linear layer", "A ReLU network", "Nothing; they cannot be composed"],
    answer: 1,
    why: ["Depth without non-linearity adds no expressive power.", "Correct. W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂).", "ReLU is exactly what is missing.", "They compose fine; the result is just linear."],
    reason: true,
  },
  {
    q: "What was kept from the biological neuron in the artificial one?",
    options: ["Spike timing and chemistry", "Many weighted inputs combined against a threshold", "Local learning rules at each synapse", "Asynchronous firing"],
    answer: 1,
    why: ["Dropped entirely.", "Correct. Inputs, adjustable strengths and a threshold-like bias survived as a sketch.", "Artificial networks learn by gradient descent on a global loss.", "Layers run in lockstep."],
  },
  {
    q: "A sigmoid neuron outputs 0.87 for an input. Which change does NOT alter that number?",
    options: ["Changing the bias", "Changing a weight", "Raising the decision threshold from 0.5 to 0.9", "Changing the input"],
    answer: 2,
    why: ["The bias shifts z and therefore the output.", "A weight changes a contribution and therefore z.", "Correct. The threshold is applied after the neuron; the neuron's output stays 0.87.", "Inputs feed z directly."],
  },
];

export const M06_EXERCISES: Exercise[] = [
  {
    title: "Trace a neuron by hand",
    kind: "calculate",
    task: "A neuron has weights (0.3, −0.8, 1.2), bias 0.4 and inputs (2, 1, 0.5). Compute z, the ReLU output and the sigmoid output. Then find the smallest change to the bias that makes the ReLU output exactly 0.",
    hints: ["Contributions first, then add the bias.", "sigmoid(z) = 1 / (1 + e^(−z)); e^(−0.4) ≈ 0.670.", "ReLU is 0 when z ≤ 0."],
    solution: "Contributions: 0.6, −0.8, 0.6. z = 0.6 − 0.8 + 0.6 + 0.4 = 0.8. ReLU: 0.8. Sigmoid: 1 / (1 + e^(−0.8)) ≈ 1 / 1.449 ≈ 0.69. For ReLU output 0 the bias must drop by at least 0.8, to −0.4 or lower, so that z ≤ 0.",
  },
  {
    title: "Build a two-neuron layer with NumPy",
    kind: "code",
    task: "Write a function layer(x, W, b, activation) that computes a whole layer's outputs for an input vector, supporting 'relu' and 'sigmoid'. Test it with W = [[1, −1], [0.5, 0.5]], b = [0, −0.5] and x = [1, 2]. Then extend it to accept a batch of inputs as a matrix X with one row per example.",
    hints: ["z = W @ x + b for one example.", "For a batch, z = X @ W.T + b gives one row per example."],
    solution: "def layer(x, W, b, activation='relu'): z = W @ x + b; return np.maximum(0, z) if activation == 'relu' else 1 / (1 + np.exp(-z)). With the given values z = (1·1 + (−1)·2 + 0, 0.5·1 + 0.5·2 − 0.5) = (−1, 1), ReLU → (0, 1), sigmoid → (0.27, 0.73). For a batch: z = X @ W.T + b, shape (examples, neurons); the activation applies element by element.",
  },
  {
    title: "Why the collapse happens",
    kind: "think",
    task: "Take W₁ = [[2, 0], [0, 3]], b₁ = [1, −1], W₂ = [[1, 1]], b₂ = [0.5]. Compute the single linear layer (W, b) that equals the two layers composed without activation, and check it on x = (1, 1). Then explain in two sentences why inserting a ReLU prevents this simplification.",
    hints: ["W = W₂W₁, b = W₂b₁ + b₂.", "ReLU is not a matrix: it cannot be multiplied into W₂."],
    solution: "W = W₂W₁ = [[2, 3]]; b = W₂b₁ + b₂ = (1 − 1) + 0.5 = 0.5. Check: two layers on x = (1, 1): h = (3, 2), y = 5 + 0.5 = 5.5; single layer: 2 + 3 + 0.5 = 5.5. ReLU prevents the simplification because max(0, ·) is applied element by element to h and depends on the sign of each entry; no fixed matrix can reproduce 'keep positives, zero negatives' for all inputs, so W₂ cannot be merged with W₁.",
  },
  {
    title: "Design a neuron for a rule you know",
    kind: "build",
    task: "Design the weights and bias of a single ReLU neuron that outputs a positive number only when a parcel is both heavy (weight over 20 kg) and far (distance over 100 km), given inputs (weight in kg, distance in km). Explain why a single neuron cannot express 'heavy OR far but not both'.",
    hints: ["Rescale inputs in your head: weight/20 and distance/100 both exceed 1 when the condition holds.", "AND needs both to be large; think of the XOR lesson for the second part."],
    solution: "Using inputs w' = weight/20 and d' = distance/100: weights (1, 1), bias −1.9 gives z = w' + d' − 1.9, positive only when both are above about 1 (e.g. 1.0 + 1.0 − 1.9 = 0.1); a heavy-but-near parcel gives 1.0 + 0.5 − 1.9 < 0. In raw units: weights (1/20, 1/100), bias −1.9. 'Heavy OR far but not both' is XOR, which is not linearly separable, so no single neuron with any weights can express it; it needs a hidden layer with an activation, as in lesson 6.8.",
  },
];
