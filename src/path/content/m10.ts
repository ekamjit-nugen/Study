import type { Exercise, LessonBody, Quiz } from "../types";

// Module 10: Types of neural networks. One concept per lesson.
// Keys are lesson slugs: m10-<kebab of the concept title in map.ts>.

export const M10_BODIES: Record<string, LessonBody> = {
  "m10-feedforward-neural-networks": {
    simple: "A feedforward network passes data in one direction, input to output, through fully connected layers; it is the simplest architecture and the right one for tabular data and for the heads of other networks.",
    concept:
      "A **feedforward neural network**, also called a multi-layer perceptron (MLP), is the architecture Modules 6 to 9 built up: an input vector, a stack of fully connected layers with non-linear activations, an output layer. Data flows forward only; no layer feeds back into an earlier one, and no connections skip across time.\n\nIt treats every input feature identically and independently: feature 7 has no special relationship with feature 8. That is right when the features are a bag of measurements about one thing, a customer, a transaction, a sensor reading, and it is the reason feedforward networks remain the standard for tabular data.\n\nIt is wrong, or wasteful, when the input has structure: pixels next to each other in an image, words in order in a sentence, samples in sequence in audio. A feedforward network must learn that structure from scratch at every position, needs enormous numbers of parameters to do so, and still generalises poorly. The rest of this module is the family of architectures invented for structured data, and each is a feedforward network with its wiring changed to match the data's shape.",
    why:
      "The feedforward network is the baseline against which every other architecture earns its place. It is cheap, fully understood, easy to train with the tools of Module 9, and good enough for a large share of business problems that come as tables. It also lives inside every other architecture: the feedforward block in a transformer, the dense head on a convolutional network, the output projection of a recurrent network. Knowing exactly what it can and cannot do is what tells you when a specialised architecture is needed.",
    how: [
      "Prepare a fixed-length feature vector per example (lesson 8.2).",
      "Stack two to four dense layers (lesson 8.6) with ReLU, typically 64 to 512 units each, with dropout or weight decay.",
      "Add the output layer for the task (lesson 8.4).",
      "Train with mini-batch gradient descent, early stopping on validation.",
      "Compare with a simple baseline (logistic or linear regression, or a gradient-boosted tree); on tabular data the network is not always the winner.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Data", "Structure", "Feedforward suitable?", "Better architecture"],
        rows: [
          ["customer record (42 features)", "none: a bag of measurements", "yes", "—"],
          ["28×28 digit image", "spatial: neighbouring pixels", "works, but wasteful", "convolutional (10.2)"],
          ["sensor readings over time", "sequential", "poor", "recurrent (10.3) or transformer (10.8)"],
          ["a sentence", "sequential, long-range dependencies", "poor", "transformer (10.8)"],
          ["512 features from a conv net", "none: already abstract", "yes, as the head", "—"],
        ],
      },
      caption: "Feedforward networks suit unstructured feature vectors and the top of other networks.",
    },
    everyday: {
      title: "A questionnaire versus a photograph",
      text: "A questionnaire with forty answers is a bag of facts: the order of the questions does not matter. A photograph is not: a pixel means something because of its neighbours. A feedforward network reads everything as a questionnaire. Hand it a photograph and it must learn, separately for every pixel, that neighbours matter, which is why photographs get their own architecture.",
    },
    engineering: {
      title: "Churn: where the MLP is the right tool",
      text: "A telecoms team predicts churn from 42 features per customer. Their feedforward network (42 → 128 → 32 → 1, ReLU, dropout 0.3, AdamW) reaches 0.87 AUC; a gradient-boosted tree reaches 0.88; logistic regression 0.83. They ship the tree for its slightly better score and easier explanations, and keep the network for a second product where features include a learned embedding of browsing history, which trees handle badly. The lesson they draw: on plain tables the feedforward network competes rather than dominates, and must be benchmarked against simpler models every time.",
    },
    maths: {
      formula: "h₁ = ReLU(W₁x + b₁) ;   h₂ = ReLU(W₂h₁ + b₂) ;   ŷ = g(W₃h₂ + b₃)",
      meaning: "A three-layer MLP: two hidden layers and an output with activation g chosen by the task. Each W is a dense weight matrix.",
      worked: [
        "Sizes 42 → 128 → 32 → 1: parameters 42·128 + 128 + 128·32 + 32 + 32·1 + 1 = 5,504 + 4,128 + 33 = 9,665.",
        "Multiplications per prediction ≈ 5,376 + 4,096 + 32 = 9,504: about 10 microseconds on a CPU; a million customers scored in ten seconds.",
        "The same network on a 28×28 image (784 inputs) would need 784·128 = 100,352 first-layer weights and would treat pixel (3,4) and pixel (3,5) as unrelated.",
        "A convolutional first layer of 32 filters of 3×3 reads the same image with 320 parameters (lesson 10.2).",
      ],
    },
    code: {
      title: "A feedforward classifier for tabular data",
      lang: "py",
      src: `import numpy as np
np.random.seed(0)

def relu(z):    return np.maximum(0.0, z)
def sigmoid(z): return 1 / (1 + np.exp(-z))

def he(n_in, n_out): return np.random.randn(n_out, n_in) * np.sqrt(2 / n_in)
W1, b1 = he(42, 128), np.zeros(128)
W2, b2 = he(128, 32), np.zeros(32)
W3, b3 = np.random.randn(1, 32) * np.sqrt(2 / 33), np.zeros(1)

def predict(X):                           # X: customers × 42 standardised features
    h1 = relu(X @ W1.T + b1)
    h2 = relu(h1 @ W2.T + b2)
    return sigmoid(h2 @ W3.T + b3)        # probability of churn

X = np.random.randn(5, 42)
print(predict(X).ravel().round(3))        # five untrained probabilities near 0.5`,
      lines: [
        { code: "W1, b1 = he(42, 128), np.zeros(128)", say: "First dense layer: 42 features in, 128 learned features out, He-initialised for ReLU (Module 9)." },
        { code: "h1 = relu(X @ W1.T + b1)", say: "Forward through layer 1 for a whole batch: one matrix multiply and a ReLU." },
        { code: "return sigmoid(h2 @ W3.T + b3)        # probability of churn", say: "The output head: one sigmoid neuron for a yes/no task." },
      ],
      output: "[0.502 0.467 0.611 0.389 0.52 ]",
      note: "Untrained, so the outputs hover near 0.5. Training is the loop from lesson 8.11.",
    },
    useIt: "Reach for a feedforward network on tabular data with learned embeddings or many interacting features, as the classification head on top of convolutional or transformer features, and as the baseline to beat. Benchmark it against gradient-boosted trees and linear models on plain tables; it does not always win there.",
    takeaways: ["Feedforward = dense layers, data flowing one way; the architecture of Modules 6–9.", "Treats features as an unordered bag: right for tables, wasteful for images and sequences.", "Lives inside every other architecture as the head or the feedforward block.", "On tables, benchmark against trees and linear models."],
    terms: [["feedforward network / MLP", "a stack of dense layers with no feedback or skip across time"], ["tabular data", "rows of fixed features with no spatial or sequential structure"], ["gradient-boosted trees", "a strong non-neural model for tabular data, the usual baseline"]],
    reflect: { q: "Why does a feedforward network need far more training data than a convolutional one to recognise a shape anywhere in an image?", a: "Because it has separate weights for every pixel position, it must see the shape at every position to learn it there. A convolutional network shares one set of weights across positions, so one example teaches all positions at once." },
  },

  "m10-convolutional-neural-networks-cnns": {
    simple: "A convolutional network slides small learned filters across an image, detecting the same pattern wherever it appears; stacking filters and pooling builds edges into shapes into objects with a tiny fraction of the parameters a dense network would need.",
    concept:
      "A **convolutional neural network** (CNN) replaces the dense layer's all-to-all wiring with a small window that slides over the input. A **filter** is a little grid of weights, say 3×3, that is multiplied against every 3×3 patch of the image in turn; each position produces one number, and the grid of those numbers is a **feature map** showing where the filter's pattern occurs. One layer learns many filters (32, 64, 256) and produces one feature map each.\n\nTwo properties make this work. Local connectivity: each output looks only at a small neighbourhood, matching the fact that nearby pixels are related. Weight sharing: the same filter is used at every position, so a vertical-edge detector learned at the top-left works at the bottom-right, and the parameter count does not depend on the image size at all.\n\nBetween convolutional layers, **pooling** shrinks the feature maps (taking the maximum over each 2×2 block, say), so deeper layers see a larger region of the original image with less computation. A typical CNN is a stack of convolution-ReLU-pool groups, each with more filters and smaller maps than the last, followed by a dense head. Early filters learn edges and colours, middle ones textures and parts, late ones whole objects, exactly the hierarchy Module 1 promised.",
    why:
      "Images are large and structured. A dense layer on a modest photo needs billions of weights (lesson 8.5) and learns nothing about translation: an object moved ten pixels is a new problem. Convolutions encode the two facts every image shares, that nearby pixels relate and that patterns can appear anywhere, into the architecture, which cuts parameters by orders of magnitude and lets the network generalise across positions. From 2012 CNNs dominated image recognition, and they remain the standard for vision tasks on limited data and for anything grid-shaped: audio spectrograms, medical scans, game boards.",
    how: [
      "A filter of size k×k×c (c input channels) slides over the input with a step called the stride.",
      "At each position, the filter's weights are multiplied with the patch and summed, plus a bias: one output value.",
      "Each filter yields one feature map; m filters yield m maps, which become the c channels of the next layer.",
      "An activation (ReLU) is applied to every value; pooling then halves the map's width and height.",
      "After several such stages, the maps are flattened or averaged and fed to dense layers for the prediction.",
    ],
    visual: {
      kind: "flow",
      steps: ["image 28×28×1", "conv 3×3, 32 filters → 26×26×32", "ReLU, max-pool 2×2 → 13×13×32", "conv 3×3, 64 filters → 11×11×64", "ReLU, max-pool 2×2 → 5×5×64", "flatten → 1,600", "dense 128 → ReLU", "dense 10 → softmax"],
      caption: "A small digit CNN. Maps shrink and channels grow; the dense head reads 1,600 abstract features instead of 784 raw pixels.",
    },
    everyday: {
      title: "A stencil moved across a wall",
      text: "To find every place a shape appears on a wall, you would not memorise the whole wall; you would hold up a stencil of the shape and slide it across, marking where it fits. One stencil, every position. A filter is a stencil, a feature map is the marks, and a CNN learns which stencils are worth having.",
    },
    engineering: {
      title: "Defect detection on a production line",
      text: "A factory inspects phone screens with a camera. Their CNN: four conv-ReLU-pool stages (32, 64, 128, 256 filters), global average pooling, a two-class head. About 1.2 million parameters, trained on 40,000 labelled images with heavy augmentation (flips, rotations, brightness) because defects are rare and can appear anywhere on the screen; weight sharing means a scratch seen in the corner during training is recognised in the centre at inference. Batch normalisation after every convolution let them use a high learning rate and train in two hours. At inference the model runs at 200 screens per second on one GPU, flags 0.3% for human review, and misses fewer than 1 in 2,000 real defects.",
    },
    maths: {
      formula: "out[i, j] = Σ_{u,v,c} K[u, v, c] · in[i + u, j + v, c] + b ;   output size = (n − k) / stride + 1 ;   parameters = k·k·c·m + m",
      meaning: "K is the k×k×c filter, slid over the input; each output position is one dot product. With no padding, a k-wide filter shrinks an n-wide input to n − k + 1. m filters give m parameters sets.",
      worked: [
        "A 3×3 vertical-edge filter K = [[−1, 0, 1], [−1, 0, 1], [−1, 0, 1]] on a 3×3 patch that is dark on the left (0) and bright on the right (1): [[0, 0, 1], [0, 0, 1], [0, 0, 1]].",
        "Dot product: (−1·0 + 0·0 + 1·1) × 3 rows = 3. Strong response: there is a vertical edge. On a uniform patch of all 1s: (−1 + 0 + 1) × 3 = 0. No edge, no response.",
        "A 28×28 image with a 3×3 filter, stride 1, no padding: 26×26 output. After 2×2 max-pooling: 13×13.",
        "Layer with 64 filters of 3×3 over 32 channels: 3·3·32·64 + 64 = 18,496 parameters, whatever the image size. A dense layer from 13×13×32 = 5,408 inputs to 64 outputs would need 346,176.",
      ],
    },
    code: {
      title: "One convolution and one max-pool, by hand",
      lang: "py",
      src: `import numpy as np

def conv2d(image, kernel):                      # single channel, stride 1, no padding
    h, w = image.shape
    k = kernel.shape[0]
    out = np.zeros((h - k + 1, w - k + 1))
    for i in range(h - k + 1):
        for j in range(w - k + 1):
            out[i, j] = (image[i:i + k, j:j + k] * kernel).sum()
    return out

def max_pool(fm, size=2):
    h, w = fm.shape
    return fm[:h - h % size, :w - w % size].reshape(h // size, size, w // size, size).max(axis=(1, 3))

image = np.zeros((6, 6)); image[:, 3:] = 1.0     # dark left half, bright right half
vertical_edge = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]])
fm = conv2d(image, vertical_edge)
print(fm)                                         # a column of 3s where the edge is
print(max_pool(fm))`,
      lines: [
        { code: "out[i, j] = (image[i:i + k, j:j + k] * kernel).sum()", say: "At each position: the patch times the filter, summed. The same filter at every (i, j): weight sharing." },
        { code: "return fm[:h - h % size, :w - w % size].reshape(h // size, size, w // size, size).max(axis=(1, 3))", say: "Max pooling: keep the largest value in each 2×2 block, halving each dimension." },
        { code: "image = np.zeros((6, 6)); image[:, 3:] = 1.0     # dark left half, bright right half", say: "A toy image with one vertical edge down the middle." },
        { code: "print(fm)                                         # a column of 3s where the edge is", say: "The feature map lights up only along the edge; elsewhere the response is zero." },
      ],
      output: "[[0. 3. 3. 0.]\n [0. 3. 3. 0.]\n [0. 3. 3. 0.]\n [0. 3. 3. 0.]]\n[[3. 3.]\n [3. 3.]]",
      note: "Frameworks compute this as one highly optimised operation across all filters, channels and images.",
    },
    useIt: "Use CNNs for images, video frames, spectrograms, medical scans and any grid-structured data, especially with limited training data where their built-in assumptions help. Start from a proven architecture (a residual network) and a pre-trained model where possible; fine-tune the head. For very large datasets, vision transformers (Module 47) now compete.",
    takeaways: ["Convolution slides small learned filters over the input; one output per position; one feature map per filter.", "Local connectivity and weight sharing cut parameters enormously and give translation invariance.", "Pooling shrinks maps so deeper layers see larger regions.", "The hierarchy edges → parts → objects emerges across the stack."],
    terms: [["filter / kernel", "a small grid of learned weights slid over the input"], ["feature map", "the grid of a filter's responses at every position"], ["pooling", "shrinking a feature map by taking the max or average over blocks"], ["stride", "how many positions the filter moves between applications"]],
    reflect: { q: "A 3×3 filter sees only 9 pixels. How does a late layer come to respond to a whole face?", a: "Through stacking and pooling: each layer's 3×3 window covers 3×3 positions of the previous map, each of which already summarised a larger region. After a few pool-and-convolve stages, a single output value depends on most of the image. This growing window is called the receptive field." },
  },

  "m10-recurrent-neural-networks-rnns": {
    simple: "A recurrent network reads a sequence one step at a time, carrying a hidden state forward that summarises what it has seen, with the same weights reused at every step.",
    concept:
      "Sequences have order and variable length: a sentence, a day of sensor readings, a sound wave. A **recurrent neural network** (RNN) handles both with one idea: process the sequence one element at a time, and keep a **hidden state** vector h that is updated at each step from the current input and the previous hidden state. The same weights are used at every step, so the network has a fixed size whatever the sequence length, and what it learns about step 3 applies to step 300.\n\nAt step t: h_t = tanh(W_x x_t + W_h h_{t−1} + b). The hidden state is the network's memory: everything it knows about the sequence so far, compressed into a vector. An output can be read from h at every step (for tagging each word) or only at the end (for classifying the whole sequence).\n\nTraining unrolls the recurrence through time and backpropagates through every step, which means the gradient is multiplied by W_h at each step backwards. That is Module 9's vanishing and exploding problem again, now across time rather than depth, and it limits plain RNNs to short-range memory of a few dozen steps. The gated cells of the next two lessons were invented to fix that, and transformers (lesson 10.8) later replaced recurrence altogether for most text tasks. RNNs remain in use for streaming signals and small devices.",
    why:
      "A feedforward network needs a fixed-length input and treats positions independently; a CNN handles local structure but has a fixed window. Sequences need something that reads in order, remembers, and handles any length. The RNN's hidden state is that memory, and its shared weights are what let a small network process arbitrarily long input. For years it was the architecture for speech, language and time series.",
    how: [
      "Initialise the hidden state h₀ to zeros.",
      "For each step t, combine the input x_t and the previous state h_{t−1} through the shared weights and a tanh: h_t = tanh(W_x x_t + W_h h_{t−1} + b).",
      "Optionally compute an output y_t = g(W_y h_t + c) at each step.",
      "For sequence classification, use the final h_T; for tagging, use every y_t.",
      "Train by unrolling T steps and backpropagating through all of them (backpropagation through time), with gradient clipping.",
    ],
    visual: {
      kind: "flow",
      steps: ["h₀ = 0", "x₁ → h₁ = tanh(W_x x₁ + W_h h₀ + b)", "x₂ → h₂ = tanh(W_x x₂ + W_h h₁ + b)", "x₃ → h₃ = …", "output from h₃ (or from every h_t)"],
      caption: "The same W_x, W_h and b at every step. The hidden state carries the past forward.",
    },
    everyday: {
      title: "Reading a sentence word by word",
      text: "Reading 'The cat that chased the mouse was black', you hold a running sense of the sentence in your head and update it with each word, so that at 'was' you still know the subject is the cat. You do not reread from the start; you carry a summary. The hidden state is that running summary, and like yours it gets fuzzy about things from long ago.",
    },
    engineering: {
      title: "Predicting the next hour of electricity demand",
      text: "A utility feeds an RNN hourly demand, temperature and a day-of-week code, one hour per step, and reads a prediction for the next hour from the hidden state at every step. Sequences of 168 steps (one week) are cut from years of history. A plain RNN with a 64-dimensional hidden state captured the daily cycle well but lost track of weekly patterns, because the gradient across 168 steps vanished; an LSTM (next lesson) with the same hidden size cut error by a third. Both run on a small CPU, scoring each new hour in microseconds, which is why the team chose recurrence over a transformer for this streaming use.",
    },
    maths: {
      formula: "h_t = tanh(W_x x_t + W_h h_{t−1} + b) ;   y_t = W_y h_t + c ;   ∂h_T/∂h_1 = Π_{t=2}^{T} (W_hᵀ · diag(tanh'(z_t)))",
      meaning: "The state update mixes the new input and the old state through shared weights. The gradient from the last state to the first is a product over every step of W_h times the tanh derivative, which vanishes or explodes with T.",
      worked: [
        "Scalar case: W_x = 1, W_h = 0.5, b = 0. Inputs x = (1, 0, 0).",
        "h₁ = tanh(1 + 0) = 0.762; h₂ = tanh(0 + 0.5 · 0.762) = tanh(0.381) = 0.364; h₃ = tanh(0.5 · 0.364) = tanh(0.182) = 0.180.",
        "The memory of the first input fades by roughly half each step. After 20 steps it is below 10⁻⁵: the network has forgotten.",
        "Gradient across 20 steps: each step contributes W_h · tanh' ≤ 0.5 · 1; the product is at most 0.5¹⁹ ≈ 2 × 10⁻⁶. Learning a dependency 20 steps long is nearly impossible for this cell.",
        "With W_h = 2 instead, the factors exceed 1 and the gradient explodes: 2¹⁹ ≈ 500,000 (before tanh saturation damps it). Clipping is mandatory.",
      ],
    },
    code: {
      title: "A recurrent cell stepping through a sequence",
      lang: "py",
      src: `import numpy as np
np.random.seed(4)

d_in, d_h = 3, 8
W_x = np.random.randn(d_h, d_in) * 0.5
W_h = np.random.randn(d_h, d_h) * 0.3
b = np.zeros(d_h)

def run_rnn(sequence):                  # sequence: steps × d_in
    h = np.zeros(d_h)
    states = []
    for x_t in sequence:
        h = np.tanh(W_x @ x_t + W_h @ h + b)   # same weights every step
        states.append(h)
    return np.array(states)

seq = np.random.randn(5, d_in)
states = run_rnn(seq)
print(states.shape)                      # (5, 8): one hidden state per step
print(np.round(states[-1], 2))           # the final state summarises the whole sequence`,
      lines: [
        { code: "h = np.zeros(d_h)", say: "The memory starts empty." },
        { code: "h = np.tanh(W_x @ x_t + W_h @ h + b)   # same weights every step", say: "The recurrence: new input plus old state through shared weights and a tanh, which keeps the state bounded (Module 7)." },
        { code: "print(states.shape)                      # (5, 8): one hidden state per step", say: "Five steps in, five states out; the network's size did not depend on the sequence length." },
      ],
      output: "(5, 8)\n[ 0.06 -0.4   0.42  0.29  0.24 -0.26  0.28 -0.53]",
    },
    useIt: "Use recurrent networks for streaming signals (sensor data, audio frames, live telemetry), on small devices, and where predictions must be produced step by step with constant memory. For text and anything needing long-range dependencies, use LSTM/GRU cells at minimum and prefer transformers where compute allows.",
    takeaways: ["An RNN processes a sequence step by step, carrying a hidden state as memory, with shared weights.", "Handles any length with a fixed-size network.", "Gradients multiply through time: plain RNNs forget beyond a few dozen steps and need clipping.", "Gated cells extend memory; transformers replaced recurrence for most text."],
    terms: [["recurrent neural network (RNN)", "a network that updates a hidden state at each step of a sequence with shared weights"], ["hidden state", "the vector carried from step to step, summarising the sequence so far"], ["backpropagation through time", "unrolling the recurrence over the steps and backpropagating through all of them"]],
    reflect: { q: "Why must the same weights be used at every time step?", a: "So the network has a fixed number of parameters regardless of sequence length, and so what it learns about the dynamics at one step transfers to every other step. Different weights per step would mean a different network for every length and no generalisation across positions." },
  },

  "m10-long-short-term-memory-lstm": {
    simple: "An LSTM adds a separate cell state with learned gates that decide what to forget, what to write and what to read, so useful information can survive hundreds of steps without the gradient vanishing.",
    concept:
      "The **long short-term memory** cell (LSTM) is the RNN fix for forgetting. Alongside the hidden state h it keeps a **cell state** c, a vector that is updated by addition rather than by repeated multiplication through a tanh. Three **gates**, each a sigmoid layer producing values between 0 and 1, control the flow: the forget gate decides how much of the old cell state to keep, the input gate decides how much of a new candidate to write in, and the output gate decides how much of the cell state to expose as the hidden state.\n\nBecause the cell state's update is c_t = f_t ⊙ c_{t−1} + i_t ⊙ c̃_t, information written at step 5 can be carried to step 500 by a forget gate near 1, and the gradient along that path is multiplied by f_t at each step rather than by a weight matrix and a tanh derivative; with f_t near 1 it neither vanishes nor explodes. The gates are learned, so the cell decides from the data what to remember and for how long.\n\nLSTMs were the dominant sequence model from about 2014 to 2018 for speech recognition, translation and language modelling, and they remain strong for time series and streaming. They cost about four times a plain RNN per step and still process sequences one step at a time, which is what transformers removed.",
    why:
      "The plain RNN's memory decays geometrically and its gradient with it (lesson 10.3), so dependencies longer than a few dozen steps are unlearnable: a sentence's subject, a sensor pattern from the previous week. The LSTM, proposed in 1997 and made practical in the 2010s, creates a protected path through time where information and gradient pass by near-identity operations, the same idea residual connections brought to depth. It made long-range sequence learning possible.",
    how: [
      "At step t, compute three gates from x_t and h_{t−1}: forget f_t, input i_t, output o_t, each a sigmoid of its own weighted sum.",
      "Compute a candidate value c̃_t = tanh(W_c [x_t, h_{t−1}] + b_c).",
      "Update the cell: c_t = f_t ⊙ c_{t−1} + i_t ⊙ c̃_t (keep part of the old, add part of the new).",
      "Expose the hidden state: h_t = o_t ⊙ tanh(c_t).",
      "Backpropagate through time; the cell-state path carries gradient scaled by the forget gates, which can stay near 1.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Forget gate f_t = σ(…)", detail: "0.95 → keep 95% of the old cell state" },
        { label: "Input gate i_t = σ(…), candidate c̃_t = tanh(…)", detail: "i = 0.1, c̃ = 0.8 → write a little of a new value" },
        { label: "Cell update", detail: "c_t = 0.95 · c_{t−1} + 0.1 · 0.8" },
        { label: "Output gate o_t = σ(…)", detail: "0.6 → expose 60% of tanh(c_t) as h_t" },
        { label: "Over 100 steps with f ≈ 0.95", detail: "0.95¹⁰⁰ ≈ 0.006 of the original survives; with f ≈ 0.99, 0.37 survives" },
      ],
      caption: "The gates are learned per step from the data. A forget gate near 1 is a long memory; near 0, a reset.",
    },
    everyday: {
      title: "A notebook with an eraser and a highlighter",
      text: "A plain RNN is memory in your head: it fades. An LSTM is a notebook. At each step you may erase some lines (forget gate), write some new ones (input gate and candidate), and read out the lines you need right now (output gate). Something written on page one can still be there on page five hundred if you never erase it. The notebook is the cell state; what you say aloud is the hidden state.",
    },
    engineering: {
      title: "Speech recognition before transformers",
      text: "A speech team's recogniser around 2016 ran a stack of two bidirectional LSTM layers, 512 units each, over 10-millisecond audio frames, with a softmax over characters at every frame. Bidirectional means one LSTM reads forward and another backward, so each frame's output sees both past and future context. On 1,000 hours of speech it reached a 7% word error rate, down from 12% with plain RNNs, largely because the LSTM could hold a word's beginning across the 30 or 40 frames until its end. The same cell type, with one layer of 128 units, now runs their wake-word detector on a phone at negligible power, which is where LSTMs still outcompete transformers.",
    },
    maths: {
      formula: "f_t = σ(W_f[x_t, h_{t−1}] + b_f) ;   i_t = σ(W_i[…] + b_i) ;   c̃_t = tanh(W_c[…] + b_c) ;   c_t = f_t ⊙ c_{t−1} + i_t ⊙ c̃_t ;   o_t = σ(W_o[…] + b_o) ;   h_t = o_t ⊙ tanh(c_t)",
      meaning: "[x_t, h_{t−1}] is the input and previous hidden state concatenated. ⊙ is element-wise multiplication. Each gate has its own weights; the cell state is updated additively.",
      worked: [
        "Scalar cell, previous c = 2.0, h = 0.5. Gates computed as f = 0.9, i = 0.2, o = 0.7; candidate c̃ = 0.5.",
        "c_t = 0.9 · 2.0 + 0.2 · 0.5 = 1.8 + 0.1 = 1.9.",
        "h_t = 0.7 · tanh(1.9) = 0.7 · 0.956 = 0.669.",
        "Gradient along the cell path over 50 steps with f = 0.98 each: 0.98⁵⁰ ≈ 0.36, versus a plain RNN's 0.5⁵⁰ ≈ 10⁻¹⁵. The dependency is learnable.",
        "Parameters for hidden size H and input size D: four weighted sums, each (D + H) × H + H, so 4(DH + H² + H). For D = 128, H = 512: 4 × (65,536 + 262,144 + 512) = 1,312,768.",
      ],
    },
    code: {
      title: "One LSTM step",
      lang: "py",
      src: `import numpy as np
np.random.seed(5)

def sigmoid(z): return 1 / (1 + np.exp(-z))

D, H = 4, 6
W = np.random.randn(4 * H, D + H) * 0.3            # four gates' weights, stacked
bias = np.zeros(4 * H); bias[:H] = 1.0             # forget-gate bias starts at 1: remember by default

def lstm_step(x, h, c):
    z = W @ np.concatenate([x, h]) + bias
    f, i, o, g = sigmoid(z[:H]), sigmoid(z[H:2*H]), sigmoid(z[2*H:3*H]), np.tanh(z[3*H:])
    c = f * c + i * g                                # additive cell update
    h = o * np.tanh(c)
    return h, c

h, c = np.zeros(H), np.zeros(H)
for t in range(3):
    h, c = lstm_step(np.random.randn(D), h, c)
print(np.round(c, 2))
print(np.round(h, 2))`,
      lines: [
        { code: "bias[:H] = 1.0             # forget-gate bias starts at 1: remember by default", say: "A standard trick: start the forget gate near 0.73 so the cell keeps information until it learns otherwise." },
        { code: "f, i, o, g = sigmoid(z[:H]), sigmoid(z[H:2*H]), sigmoid(z[2*H:3*H]), np.tanh(z[3*H:])", say: "Three sigmoid gates between 0 and 1, and a tanh candidate between −1 and 1, all from one matrix multiply." },
        { code: "c = f * c + i * g                                # additive cell update", say: "Keep a gated fraction of the old cell and add a gated fraction of the new candidate. No tanh, no weight matrix on the carried value." },
        { code: "h = o * np.tanh(c)", say: "The hidden state is a gated view of the cell, bounded by tanh." },
      ],
      output: "[-0.13  0.17  0.04 -0.03 -0.19  0.46]\n[-0.07  0.08  0.02 -0.01 -0.11  0.18]",
    },
    useIt: "Use LSTMs for time series, streaming audio and sensor data, on-device sequence models, and anywhere a transformer is too heavy or the data is a continuous stream. Initialise the forget-gate bias to 1, clip gradients, and consider bidirectional layers when the whole sequence is available at once.",
    takeaways: ["An LSTM keeps a cell state updated by addition, controlled by forget, input and output gates.", "A forget gate near 1 carries information and gradient across hundreds of steps.", "About four times a plain RNN's cost per step; still sequential.", "Dominant for sequences until transformers; still the tool for streams and small devices."],
    terms: [["LSTM", "long short-term memory: a gated recurrent cell with a separate cell state"], ["gate", "a sigmoid-valued vector between 0 and 1 that scales what passes"], ["cell state", "the LSTM's long-term memory vector, updated additively"], ["bidirectional", "two recurrent layers reading the sequence forward and backward, outputs combined"]],
    reflect: { q: "The forget gate is a sigmoid, so it can never be exactly 1. What does that imply over very long sequences?", a: "Even at 0.999 per step, information decays: 0.999¹⁰⁰⁰ ≈ 0.37, 0.999¹⁰⁰⁰⁰ ≈ 0.00005. LSTMs remember far longer than plain RNNs but not indefinitely, which is one reason attention, which reaches back to any position directly, won for very long contexts." },
  },

  "m10-gated-recurrent-units-gru": {
    simple: "A GRU is a simplified gated cell with two gates and no separate cell state; it matches LSTM performance on many tasks with fewer parameters and less computation.",
    concept:
      "The **gated recurrent unit** (GRU), introduced in 2014, keeps the LSTM's key idea, learned gates that protect information across time, with a leaner design. It has two gates instead of three and merges the cell state into the hidden state.\n\nThe **update gate** z_t decides how much of the previous hidden state to keep versus how much of a new candidate to adopt: h_t = (1 − z_t) ⊙ h_{t−1} + z_t ⊙ h̃_t. That single gate plays the roles of both the LSTM's forget and input gates, tied so that what is not kept is replaced. The **reset gate** r_t decides how much of the previous state to use when forming the candidate: h̃_t = tanh(W [x_t, r_t ⊙ h_{t−1}] + b). A reset near 0 lets the cell start fresh for a new sub-sequence.\n\nWith no output gate and no separate cell, the GRU has three weighted sums per step instead of four, about 25% fewer parameters than an LSTM of the same hidden size, and trains a little faster. On many benchmarks the two are indistinguishable; on some, each wins by a little. In practice teams pick by trying both or by default: GRUs for smaller data and faster iteration, LSTMs when the extra control seems to help.",
    why:
      "The LSTM's three gates and two states are more machinery than many tasks need. The GRU asks how little gating preserves the benefit, and the answer, two gates and one state, is enough for most sequence problems. Fewer parameters mean less overfitting on small datasets and faster training, which mattered when sequence models were trained on single GPUs over days.",
    how: [
      "Compute the update gate z_t = σ(W_z [x_t, h_{t−1}] + b_z) and the reset gate r_t = σ(W_r [x_t, h_{t−1}] + b_r).",
      "Form the candidate h̃_t = tanh(W_h [x_t, r_t ⊙ h_{t−1}] + b_h), using a reset-scaled view of the past.",
      "Blend: h_t = (1 − z_t) ⊙ h_{t−1} + z_t ⊙ h̃_t.",
      "Output y_t from h_t as needed.",
      "Train by backpropagation through time; the (1 − z_t) path carries gradient like the LSTM's forget gate.",
    ],
    visual: {
      kind: "compare",
      left: { title: "LSTM", points: ["gates: forget, input, output", "states: cell c and hidden h", "4 weighted sums per step", "parameters 4(DH + H² + H)", "slightly more control"] },
      right: { title: "GRU", points: ["gates: update, reset", "state: hidden h only", "3 weighted sums per step", "parameters 3(DH + H² + H)", "slightly faster, fewer parameters"] },
      caption: "Same purpose, leaner design. Results are usually close; cost always favours the GRU.",
    },
    everyday: {
      title: "A single dial for 'keep or replace'",
      text: "The LSTM has separate controls for erasing old notes and writing new ones. The GRU has one dial: turn it toward 'keep' and the old stays; toward 'replace' and the new takes over. Less to adjust, and for most note-keeping the one dial is all you need. The reset gate is a second, smaller control: 'ignore the old notes while drafting the new one'.",
    },
    engineering: {
      title: "Choosing a cell for a wearable",
      text: "A health-tech team needs an on-device model that classifies activity (walking, running, cycling, rest) from accelerometer streams on a wristband with a tiny processor. They compare LSTM and GRU cells with 32 hidden units: identical accuracy (94.1% and 94.3%), but the GRU has 25% fewer multiplications per step and fits their per-sample compute budget with margin. They also find the GRU trains in two-thirds the time on their 20,000 labelled minutes of data. The choice was made by measurement; the design difference told them where to look.",
    },
    maths: {
      formula: "z_t = σ(W_z[x_t, h_{t−1}] + b_z) ;   r_t = σ(W_r[x_t, h_{t−1}] + b_r) ;   h̃_t = tanh(W_h[x_t, r_t ⊙ h_{t−1}] + b_h) ;   h_t = (1 − z_t) ⊙ h_{t−1} + z_t ⊙ h̃_t",
      meaning: "z blends old and new; r scales how much of the old state informs the candidate. All gates are sigmoids in (0, 1).",
      worked: [
        "Scalar cell, h_{t−1} = 0.8. Gates computed as z = 0.1, r = 0.5; candidate h̃ = tanh(W_h·[x, 0.5 · 0.8] + b) = 0.3 (say).",
        "h_t = 0.9 · 0.8 + 0.1 · 0.3 = 0.72 + 0.03 = 0.75. Mostly kept.",
        "With z = 0.9 instead: h_t = 0.1 · 0.8 + 0.9 · 0.3 = 0.35. Mostly replaced.",
        "Gradient along the kept path over 50 steps with z = 0.02: (1 − 0.02)⁵⁰ = 0.98⁵⁰ ≈ 0.36, like the LSTM's forget path.",
        "Parameters for D = 128, H = 512: 3 × (65,536 + 262,144 + 512) = 984,576, versus the LSTM's 1,312,768.",
      ],
    },
    code: {
      title: "One GRU step",
      lang: "py",
      src: `import numpy as np
np.random.seed(6)

def sigmoid(z): return 1 / (1 + np.exp(-z))

D, H = 4, 6
W_zr = np.random.randn(2 * H, D + H) * 0.3        # update and reset gates
W_h  = np.random.randn(H, D + H) * 0.3            # candidate

def gru_step(x, h):
    zr = sigmoid(W_zr @ np.concatenate([x, h]))
    z, r = zr[:H], zr[H:]
    h_cand = np.tanh(W_h @ np.concatenate([x, r * h]))
    return (1 - z) * h + z * h_cand                 # blend old and new

h = np.zeros(H)
for t in range(3):
    h = gru_step(np.random.randn(D), h)
print(np.round(h, 2))`,
      lines: [
        { code: "z, r = zr[:H], zr[H:]", say: "Two gates from one matrix multiply: update (how much to replace) and reset (how much past to use in the candidate)." },
        { code: "h_cand = np.tanh(W_h @ np.concatenate([x, r * h]))", say: "The candidate state, built from the input and a reset-scaled view of the previous state." },
        { code: "return (1 - z) * h + z * h_cand                 # blend old and new", say: "The single blending equation that replaces the LSTM's forget-and-input pair." },
      ],
      output: "[-0.14  0.06  0.13 -0.21  0.15  0.08]",
    },
    useIt: "Use GRUs as the default gated recurrent cell when data is limited, training speed matters, or the model must run on a small device; try an LSTM when the GRU underperforms. Both are superseded by transformers for most text, and both remain relevant for streaming and embedded sequence tasks.",
    takeaways: ["GRU: two gates (update, reset), one hidden state, no output gate.", "About 25% fewer parameters than an LSTM, similar results on most tasks.", "The (1 − z) path carries long-range information and gradient.", "Choose between LSTM and GRU by measurement."],
    terms: [["GRU", "gated recurrent unit: a two-gate recurrent cell without a separate cell state"], ["update gate", "the gate blending the previous state with the new candidate"], ["reset gate", "the gate controlling how much past state informs the candidate"]],
    reflect: { q: "The GRU ties 'forget' and 'write' into one gate: whatever is not kept is replaced. When might the LSTM's separate gates matter?", a: "When the cell should neither keep nor write for a while: hold its memory while ignoring irrelevant input. An LSTM can set forget ≈ 1 and input ≈ 0; a GRU can approximate it with z ≈ 0, but cannot keep and write large amounts simultaneously either, which the LSTM's additive cell allows." },
  },

  "m10-autoencoders": {
    simple: "An autoencoder learns to compress its input into a small code and reconstruct the input from that code; the code becomes a compact representation useful for compression, denoising and anomaly detection.",
    concept:
      "An **autoencoder** is a network trained to output its own input. That sounds trivial until you add the constraint: between input and output sits a **bottleneck**, a layer far smaller than the input. The first half, the **encoder**, compresses the input to the bottleneck's code vector; the second half, the **decoder**, reconstructs the input from the code. The loss is the reconstruction error, typically mean squared error between input and output. No labels are needed: it is unsupervised learning (Module 1) done with a neural network.\n\nTo reconstruct well through a narrow bottleneck, the encoder must keep what matters and discard what does not. The code therefore captures the input's essential structure: for faces, something like pose, lighting and identity; for sensor readings, the normal operating patterns. That code is useful on its own as a compact feature vector for other tasks.\n\nVariants change the constraint or the training. Denoising autoencoders receive a corrupted input and must reconstruct the clean one. Sparse autoencoders penalise active code units. Variational autoencoders (VAEs) make the code a probability distribution and can generate new examples by sampling it, which makes them an early generative model and a relative of the diffusion models in Module 47.",
    why:
      "Most data is unlabelled, and much of it is high-dimensional with low-dimensional structure. Autoencoders learn that structure from the data alone, giving compression, a feature space for downstream models, and a natural anomaly detector: inputs the model reconstructs badly are inputs unlike its training data. The idea of training a network to predict its own input, or a masked part of it, also underlies how modern language and vision models are pretrained.",
    how: [
      "Build an encoder: layers that shrink the input to a code of size k, much smaller than the input dimension.",
      "Build a decoder: layers that expand the code back to the input's shape.",
      "Train on unlabelled examples with loss = reconstruction error between output and input.",
      "After training, use the encoder's code as features, the full model for compression or denoising, and the reconstruction error as an anomaly score.",
      "For a denoising variant, feed corrupted inputs and reconstruct the clean originals; for a VAE, add a term that keeps the code distribution close to a standard normal.",
    ],
    visual: {
      kind: "flow",
      steps: ["input: 784 pixels", "encoder: 784 → 256 → 32", "code: 32 numbers", "decoder: 32 → 256 → 784", "reconstruction: 784 pixels", "loss: ‖input − reconstruction‖²"],
      caption: "An hourglass. Everything the output has must pass through the 32-number waist.",
    },
    everyday: {
      title: "Describing a room over the phone",
      text: "You describe a room to a friend in twenty words and they draw it. Through that narrow channel you keep what matters, the layout, the big furniture, the colour of the walls, and drop what does not. Your friend's drawing is a reconstruction; your twenty words are the code. If a room is so strange that twenty words cannot capture it, the drawing comes out wrong: that is the anomaly signal.",
    },
    engineering: {
      title: "Catching a failing pump",
      text: "A water utility has thousands of pumps streaming vibration and temperature readings, and almost no labelled failures. They train an autoencoder on windows of readings from healthy pumps: 240 readings compressed to a code of 12 and reconstructed. On healthy data the reconstruction error is small. When a bearing begins to wear, the vibration pattern changes in a way the code cannot represent, the error rises, and an alert fires days before the failure. No one labelled a single failure; the model learned 'normal' and flags departures from it. The team tunes the alert threshold on the error distribution of known-good weeks.",
    },
    maths: {
      formula: "code = E(x) ∈ ℝᵏ ;   x̂ = D(code) ;   L = (1/n) ‖x − x̂‖² ;   anomaly score = ‖x − x̂‖²",
      meaning: "E is the encoder, D the decoder, k the bottleneck size, n the input dimension. The loss is the mean squared reconstruction error; the same quantity on a new input is its anomaly score.",
      worked: [
        "A toy input x = (2, 4, 6, 8), which lies on a line (x = 2 · (1, 2, 3, 4)). A one-number code can capture it: code = 2; decoder multiplies by (1, 2, 3, 4): x̂ = (2, 4, 6, 8). Error 0.",
        "Input x = (2, 4, 6, 9): best one-number code ≈ 2.07 (least squares); x̂ ≈ (2.07, 4.13, 6.2, 8.27); error = (0.07² + 0.13² + 0.2² + 0.73²)/4 ≈ 0.15. Slightly off the line, slightly anomalous.",
        "Input x = (8, 2, 5, 1), nothing like a line: best code ≈ 1.1; x̂ ≈ (1.1, 2.2, 3.3, 4.4); error ≈ (47.6 + 0.04 + 2.9 + 11.6)/4 ≈ 15.5. Strongly anomalous.",
        "Compression ratio for the digit autoencoder: 784 / 32 = 24.5×, with some loss of fine detail.",
      ],
    },
    code: {
      title: "A linear autoencoder and its anomaly score",
      lang: "py",
      src: `import numpy as np
np.random.seed(7)

# normal data lies near a 2-dimensional plane inside 10 dimensions
basis = np.random.randn(2, 10)
normal = np.random.randn(500, 2) @ basis + 0.05 * np.random.randn(500, 10)

# a linear autoencoder with a 2-number bottleneck, fitted by least squares (what gradient descent would find)
U, S, Vt = np.linalg.svd(normal, full_matrices=False)
encoder = Vt[:2].T                     # 10 → 2
decoder = Vt[:2]                       # 2 → 10

def anomaly_score(x):
    code = x @ encoder
    recon = code @ decoder
    return ((x - recon) ** 2).mean()

print(round(anomaly_score(normal[0]), 4))                    # tiny: on the plane
print(round(anomaly_score(np.random.randn(10) * 3), 4))      # large: off the plane`,
      lines: [
        { code: "normal = np.random.randn(500, 2) @ basis + 0.05 * np.random.randn(500, 10)", say: "Ten-dimensional data that really has only two degrees of freedom, plus a little noise: the kind of structure autoencoders find." },
        { code: "encoder = Vt[:2].T                     # 10 → 2", say: "The encoder squeezes 10 numbers to 2. (For a linear autoencoder the optimum is the top principal components; a non-linear one would use dense layers trained by gradient descent.)" },
        { code: "return ((x - recon) ** 2).mean()", say: "Reconstruction error: the training loss, reused as the anomaly score." },
        { code: "print(round(anomaly_score(np.random.randn(10) * 3), 4))      # large: off the plane", say: "A random vector does not fit the learned structure and reconstructs badly." },
      ],
      output: "0.0026\n7.6633",
    },
    useIt: "Use autoencoders for anomaly detection on unlabelled operational data, for learning compact features from large unlabelled sets, for denoising, and as an introduction to representation learning. Set anomaly thresholds from the error distribution on known-normal data. For generation, VAEs are a stepping stone to diffusion models.",
    takeaways: ["An autoencoder reconstructs its input through a bottleneck; the code captures essential structure.", "Trained without labels on reconstruction error.", "Uses: compression, features, denoising, anomaly detection via reconstruction error.", "Variational autoencoders turn the code into a distribution and can generate."],
    terms: [["autoencoder", "a network trained to reconstruct its input through a narrow bottleneck"], ["encoder / decoder", "the compressing and reconstructing halves"], ["bottleneck", "the small middle layer the information must pass through"], ["reconstruction error", "the difference between input and output; the loss and the anomaly score"]],
    reflect: { q: "What happens if the bottleneck is as large as the input?", a: "The network can learn the identity function and copy the input straight through with zero error, learning nothing about structure. The constraint is what forces a useful code; without it (or a substitute such as noise or sparsity), the autoencoder is pointless." },
  },

  "m10-generative-adversarial-networks-gans": {
    simple: "A GAN trains two networks against each other: a generator that makes fake examples and a discriminator that tells fake from real; competition pushes the generator toward realistic output.",
    concept:
      "A **generative adversarial network** (GAN) is two networks in a contest. The **generator** takes a random vector of noise and outputs a candidate example, an image say. The **discriminator** takes an example and outputs the probability that it is real (from the training set) rather than generated. They are trained in alternation: the discriminator learns to catch fakes, then the generator learns to fool the updated discriminator, and so on.\n\nThe generator never sees real data directly. It learns only from the discriminator's gradient: which direction would have made this fake look more real. Over thousands of rounds the generator's outputs move toward the distribution of real examples, and the discriminator ends up unable to tell the difference better than chance.\n\nGANs produced the first convincingly photorealistic generated images (2014 to 2020) and remain in use for image-to-image tasks, super-resolution and data augmentation. They are notoriously hard to train: the two networks must stay balanced, and failures include mode collapse (the generator produces a few outputs repeatedly) and oscillation. Diffusion models (Module 47) have largely replaced GANs for general image generation because they train stably, but the adversarial idea persists in many systems.",
    why:
      "Generating realistic data is hard to define as a loss: what number says a face looks real? GANs sidestep the question by learning the loss: the discriminator is a trained judge of realism, and the generator optimises against it. That made high-quality generation possible without hand-designed measures, and the same adversarial framing now appears in robustness training and in evaluating generated content.",
    how: [
      "Sample noise z; the generator G produces a fake x̂ = G(z).",
      "Sample a batch of real examples x. The discriminator D scores both: D(x) should be near 1, D(x̂) near 0.",
      "Update D to raise D(x) and lower D(x̂) (a binary cross-entropy loss with real = 1, fake = 0).",
      "Update G to raise D(G(z)): make the discriminator believe the fakes, backpropagating through D into G.",
      "Repeat, keeping the two roughly balanced; stop when generated samples look right and D is near 50%.",
    ],
    visual: {
      kind: "flow",
      steps: ["noise z", "generator G → fake image", "discriminator D scores real vs fake", "D learns to catch fakes", "G learns to fool D", "repeat until D ≈ 50%"],
      caption: "Two learners, opposite goals. The generator improves only because the discriminator keeps raising the bar.",
    },
    everyday: {
      title: "The forger and the expert",
      text: "A forger paints copies; an art expert judges them. At first the forgeries are obvious and the expert catches every one, but each rejection tells the forger what gave it away. The forger improves; the expert sharpens; eventually the expert is guessing. The forger never studied the originals directly, only the expert's verdicts. That arms race is a GAN, and its failure modes are familiar: a forger who learns one perfect painting and repeats it (mode collapse), or an expert so good the forger gets no useful hints (vanishing gradient to the generator).",
    },
    engineering: {
      title: "Synthetic training data for a rare defect",
      text: "A manufacturer's defect detector saw a particular hairline crack in only 60 of 100,000 training images, too few to learn. They trained a GAN on crops of the 60 cracks plus augmentations, generating 5,000 varied synthetic cracks, and pasted them into healthy images to balance the training set. Detector recall on that defect rose from 41% to 88% on a held-out real test set. The GAN took three attempts to train: the first collapsed to a single crack shape, the second oscillated, the third worked with a lower learning rate for the discriminator and leaky ReLU throughout. They validated the synthetic data by checking that a classifier trained on it transferred to real cracks, never by eye alone.",
    },
    maths: {
      formula: "L_D = −[log D(x) + log(1 − D(G(z)))] ;   L_G = −log D(G(z)) ;   at equilibrium D(x) = 0.5 everywhere",
      meaning: "The discriminator maximises its accuracy on real and fake; the generator maximises the discriminator's belief that fakes are real (the 'non-saturating' form). When the generated distribution matches the real one, the best discriminator can do is 0.5.",
      worked: [
        "Early training: D(x) = 0.95 for a real image, D(G(z)) = 0.05 for a fake. L_D = −[log 0.95 + log 0.95] ≈ 0.10: the discriminator is comfortable. L_G = −log 0.05 ≈ 3.0: the generator is losing badly, and gets a large gradient.",
        "Mid training: D(x) = 0.7, D(G(z)) = 0.4. L_D = −[log 0.7 + log 0.6] ≈ 0.87; L_G = −log 0.4 ≈ 0.92. Both learning.",
        "Equilibrium: D = 0.5 on everything. L_D = −2 log 0.5 ≈ 1.39; L_G = −log 0.5 ≈ 0.69. Losses no longer tell you quality; you look at samples and use a separate metric.",
        "Mode collapse signature: generator loss drops sharply while generated samples become near-identical; the discriminator then catches the single mode and the losses swing.",
      ],
    },
    code: {
      title: "The adversarial training loop, in outline",
      lang: "py",
      src: `import numpy as np

def train_gan(G, D, real_data, steps, batch=64, noise_dim=100):
    for step in range(steps):
        # 1. discriminator step: real -> 1, fake -> 0
        x_real = sample(real_data, batch)
        x_fake = G.forward(np.random.randn(batch, noise_dim))
        d_loss = bce(D.forward(x_real), 1) + bce(D.forward(x_fake), 0)
        D.backward_and_update(d_loss)

        # 2. generator step: make D believe the fakes are real
        z = np.random.randn(batch, noise_dim)
        g_loss = bce(D.forward(G.forward(z)), 1)
        G.backward_and_update(g_loss)             # gradient flows through D into G; D is not updated here

        if step % 1000 == 0:
            save_samples(G, step)                   # losses are not enough: look at the output`,
      lines: [
        { code: "d_loss = bce(D.forward(x_real), 1) + bce(D.forward(x_fake), 0)", say: "The discriminator's binary cross-entropy: real labelled 1, fake labelled 0." },
        { code: "g_loss = bce(D.forward(G.forward(z)), 1)", say: "The generator's loss: it wants the discriminator to output 1 for its fakes." },
        { code: "G.backward_and_update(g_loss)             # gradient flows through D into G; D is not updated here", say: "The generator learns from the discriminator's gradient without ever seeing real data." },
        { code: "save_samples(G, step)                   # losses are not enough: look at the output", say: "GAN losses are uninformative at equilibrium; inspection and separate metrics judge quality." },
      ],
      note: "bce, sample and the network classes are placeholders for a framework's implementations; the structure is what matters.",
    },
    useIt: "Use GANs for image-to-image translation, super-resolution, synthetic data to balance rare classes, and when a diffusion model is too slow at inference. Expect to tune for stability (leaky ReLU, careful learning rates, spectral normalisation) and to validate generated data by its effect on a downstream task, not by appearance. For general image generation from scratch, diffusion models are now the default.",
    takeaways: ["A GAN is a generator and a discriminator trained against each other.", "The generator learns only from the discriminator's gradient; the discriminator is a learned loss.", "Training is unstable: mode collapse and oscillation are common; losses do not indicate quality.", "Still used for image-to-image tasks and synthetic data; superseded by diffusion for general generation."],
    terms: [["GAN", "generative adversarial network: a generator and a discriminator trained in competition"], ["generator", "the network that maps noise to fake examples"], ["discriminator", "the network that scores examples as real or fake"], ["mode collapse", "the generator producing only a few distinct outputs"]],
    reflect: { q: "Why can a GAN's loss curves look flat while the generated images are improving?", a: "Because both networks improve together: a better generator makes the discriminator's job harder at the same time as the discriminator gets better at it. Each network's loss measures it against a moving opponent, not against a fixed target, so the numbers can hover while the samples change dramatically." },
  },

  "m10-introduction-to-transformers": {
    simple: "A transformer processes all positions of a sequence at once, using attention to let every position look at every other, which makes it parallel to train, able to use long context, and the architecture behind modern language models.",
    concept:
      "The **transformer**, introduced in 2017, is the architecture behind today's language models, and increasingly behind vision and audio models too. It abandons recurrence. Instead of reading a sequence one step at a time and carrying a hidden state, it processes every position in parallel and lets each position gather information from every other position through a mechanism called **attention**.\n\nFor each position, attention computes how relevant every other position is (a score), turns the scores into weights with a softmax, and takes a weighted mix of the other positions' values. 'Was' in 'The cat that chased the mouse was black' can attend directly to 'cat' however many words sit between them; no hidden state has to carry the subject across. That direct reach is what gives transformers their long memory.\n\nA transformer block is attention followed by a position-wise feedforward network, each wrapped in a residual connection with layer normalisation: Module 9's tools assembled. Blocks are stacked, dozens deep. Because attention is order-blind, position information is added to the inputs explicitly. Training is parallel across positions, which is why transformers scale to enormous data and model sizes in a way recurrent networks never could. Stage 4 opens up every part of this.",
    why:
      "Recurrent networks have two hard limits: they process steps in sequence, so training cannot use hardware's parallelism, and information must survive a chain of state updates, so long-range dependencies fade. Attention removes both: all positions are computed at once, and any position can read any other in one step. The result trains faster on more data and uses longer context, and that combination is what made large language models possible.",
    how: [
      "Convert each token to a vector (an embedding) and add a position encoding so order is known.",
      "In each block, compute attention: for every position, score every other position, softmax the scores, and mix the others' values by those weights.",
      "Add the result to the input (residual) and normalise.",
      "Apply a small feedforward network to each position independently; add and normalise again.",
      "Stack many blocks; read the output positions for the task (next-token probabilities, a class, a translation).",
    ],
    visual: {
      kind: "compare",
      left: { title: "Recurrent network", points: ["one step at a time", "memory = a hidden state updated each step", "long-range information fades", "training cannot parallelise across positions"] },
      right: { title: "Transformer", points: ["all positions at once", "memory = attention over every position", "any position reads any other directly", "training parallel across positions; scales to huge data"] },
      caption: "The change that made large language models possible: direct access instead of a chain of memory.",
    },
    everyday: {
      title: "Reading with the whole page in view",
      text: "A recurrent reader hears a sentence word by word through a phone and must remember. A transformer reader has the whole page on the desk and, for each word, glances at whichever other words help: the pronoun looks back to its noun, the verb looks to its subject, in one glance each. That is attention: for every word, a weighted look at all the others.",
    },
    engineering: {
      title: "The same architecture for text, code and images",
      text: "A company's platform team runs three transformers: a 7-billion-parameter language model for support chat, a code model that completes functions, and a vision transformer that reads product photos as a grid of 16×16 patches treated like words. All three are stacks of the same block, differing only in input handling and size. Their serving stack is one system with three sets of weights. Ten years earlier the same three products would have needed an LSTM, a different LSTM and a CNN, with three serving stacks. The transformer's generality is an engineering asset as much as a modelling one.",
    },
    maths: {
      formula: "Attention(Q, K, V) = softmax(QKᵀ / √d) V ;   block: x ← x + Attention(LN(x)); x ← x + FFN(LN(x))",
      meaning: "Q, K, V are the queries, keys and values: three linear projections of the positions' vectors. QKᵀ scores every pair; the softmax turns scores into weights; the weights mix the values. Each block adds attention and a feedforward network to the residual stream. Module 15 derives all of it.",
      worked: [
        "Three positions with scores from position 3 to positions (1, 2, 3) of (2.0, 0.5, 1.0) after scaling.",
        "Softmax: e² = 7.39, e⁰·⁵ = 1.65, e¹ = 2.72; sum 11.76; weights ≈ (0.63, 0.14, 0.23).",
        "Position 3's new value = 0.63 · v₁ + 0.14 · v₂ + 0.23 · v₃: mostly position 1's value. If position 1 is 'cat' and position 3 is 'was', the verb has read its subject directly.",
        "Cost: scoring every pair of n positions is n² operations per block; at n = 4,096 that is 16.8 million per block, which is the reason long contexts are expensive and the topic of Module 40.",
      ],
    },
    code: {
      title: "Scaled dot-product attention",
      lang: "py",
      src: `import numpy as np
np.random.seed(8)

def softmax(z):
    e = np.exp(z - z.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V):                       # each: positions × d
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)             # every position scores every other
    weights = softmax(scores)                 # rows sum to 1
    return weights @ V, weights               # weighted mix of values

n, d = 4, 8
X = np.random.randn(n, d)                     # four positions' vectors
Wq, Wk, Wv = (np.random.randn(d, d) * 0.3 for _ in range(3))
out, w = attention(X @ Wq, X @ Wk, X @ Wv)
print(out.shape)                              # (4, 8): a new vector per position
print(np.round(w, 2))                         # who attended to whom`,
      lines: [
        { code: "scores = Q @ K.T / np.sqrt(d)             # every position scores every other", say: "An n × n table of relevance scores, computed for all positions at once: no loop over time." },
        { code: "weights = softmax(scores)                 # rows sum to 1", say: "Each position's scores become a distribution over the others (Module 7's softmax)." },
        { code: "return weights @ V, weights               # weighted mix of values", say: "Each position's output is a mix of all positions' values, weighted by relevance." },
        { code: "print(np.round(w, 2))                         # who attended to whom", say: "The attention matrix is readable: row i shows where position i looked." },
      ],
      output: "(4, 8)\n[[0.28 0.21 0.3  0.21]\n [0.2  0.35 0.21 0.24]\n [0.31 0.16 0.33 0.2 ]\n [0.2  0.33 0.24 0.23]]",
      note: "Untrained projections give diffuse attention; trained ones produce sharp, meaningful patterns. Stage 4 builds the full block.",
    },
    useIt: "Transformers are the default for text, code, and increasingly vision, audio and multimodal tasks, and the architecture of every model you will call through an API. Understanding attention, the block structure and the n² cost prepares you for Stage 4 (how they work in full), Stage 5 (how they are trained and adapted) and Stage 8 (how they are served efficiently).",
    takeaways: ["Transformers replace recurrence with attention: every position reads every other directly.", "Parallel across positions in training; long context without fading memory.", "A block = attention + feedforward, each with residual and layer normalisation; blocks stack deep.", "Attention costs n² per block; position information is added explicitly."],
    terms: [["transformer", "a sequence architecture built from attention and feedforward blocks, processing all positions in parallel"], ["attention", "a weighted mix of all positions' values, with weights from learned relevance scores"], ["query, key, value", "the three projections attention uses to score and mix positions"], ["position encoding", "information added to inputs so an order-blind model knows each token's position"]],
    reflect: { q: "Attention lets any position read any other in one step. What does that cost that recurrence did not?", a: "Memory and compute that grow with the square of the sequence length, since every pair is scored, and the need to see the whole sequence at once rather than streaming it. Recurrence is linear in length and streams naturally; the transformer trades that for parallelism and direct access." },
  },
};

export const M10_QUIZ: Quiz[] = [
  {
    q: "Which data type is a plain feedforward network the right default for?",
    options: ["Photographs", "Sentences", "Rows of customer features", "Audio streams"],
    answer: 2,
    why: ["Spatial structure wants convolutions.", "Sequential structure wants recurrence or attention.", "Correct. A bag of fixed features with no spatial or sequential structure.", "Streams want recurrent cells."],
  },
  {
    q: "A convolutional layer has 64 filters of 3×3 over 32 input channels. How many parameters, and does the image size matter?",
    options: ["18,496; no", "18,432; yes", "65,536; no", "It depends on the image size"],
    answer: 0,
    why: ["Correct. 3·3·32·64 + 64 = 18,496, independent of image size because filters are shared across positions.", "Forgot the 64 biases, and image size is irrelevant.", "No.", "Weight sharing makes the count independent of image size."],
    reason: true,
  },
  {
    q: "Why do plain RNNs forget information from many steps earlier?",
    options: ["Their hidden state is too small", "The gradient and the signal are multiplied through the same weights at every step, so they vanish or explode with length", "They have no activation function", "They process steps in parallel"],
    answer: 1,
    why: ["Size helps little; the decay is geometric.", "Correct. Module 9's vanishing-gradient problem, across time instead of depth.", "They use tanh.", "They process steps sequentially."],
  },
  {
    q: "What lets an LSTM carry information across hundreds of steps?",
    options: ["A bigger tanh", "A cell state updated by addition, scaled by a forget gate that can stay near 1", "Processing the sequence backwards", "Dropout"],
    answer: 1,
    why: ["No.", "Correct. The additive path with a near-1 gate passes both information and gradient almost unchanged.", "Bidirectional layers add context but do not fix forgetting.", "A regulariser, unrelated."],
    reason: true,
  },
  {
    q: "How does a GRU differ from an LSTM?",
    options: ["It has more gates", "Two gates and no separate cell state, about 25% fewer parameters", "It cannot handle long sequences", "It uses attention"],
    answer: 1,
    why: ["Fewer: update and reset.", "Correct. A leaner gated cell with similar performance on most tasks.", "It handles them about as well as an LSTM.", "No; that is the transformer."],
  },
  {
    q: "An autoencoder's bottleneck is made as wide as its input. What happens?",
    options: ["It compresses better", "It can learn the identity and captures no structure", "It becomes a GAN", "Training fails with NaN"],
    answer: 1,
    why: ["Nothing forces compression.", "Correct. The constraint is what makes the code meaningful; without it, copy-through is the trivial solution.", "No.", "It trains fine and learns nothing useful."],
  },
  {
    q: "In a GAN, what does the generator learn from?",
    options: ["The real images directly", "The discriminator's gradient: which direction would make its fakes look more real", "A hand-written realism score", "Labels"],
    answer: 1,
    why: ["It never sees real data.", "Correct. The discriminator is a learned loss; its gradient flows into the generator.", "No such score exists; that is the point.", "GANs are unsupervised."],
  },
  {
    q: "What does attention give a transformer that a recurrent network lacks?",
    options: ["Fewer parameters", "Each position reads every other position directly, and all positions compute in parallel", "Constant memory for any length", "Deterministic outputs"],
    answer: 1,
    why: ["Transformers are usually larger.", "Correct. Direct access removes fading memory; parallelism enables scale.", "Attention's cost grows with length squared; recurrence is the one with constant memory per step.", "Unrelated."],
  },
];

export const M10_EXERCISES: Exercise[] = [
  {
    title: "Size a small CNN",
    kind: "calculate",
    task: "A CNN takes 32×32×3 images. Layer 1: 32 filters of 3×3, stride 1, no padding, then 2×2 max-pool. Layer 2: 64 filters of 3×3, then 2×2 max-pool. Then flatten, a dense layer of 128, and a 10-class softmax. Compute the feature-map sizes after each stage, the parameter count of every layer, and the total. Compare with a dense network of the same input and the same 128-unit hidden layer.",
    hints: ["Conv output size: n − 3 + 1; pooling halves (round down).", "Conv parameters: 3·3·c·m + m. Dense: n·m + m."],
    solution: "Conv 1: 30×30×32 (896 parameters: 3·3·3·32 + 32); pool: 15×15×32. Conv 2: 13×13×64 (18,496 parameters); pool: 6×6×64 = 2,304 values. Dense 2,304 → 128: 295,040. Output 128 → 10: 1,290. Total ≈ 315,722, most of it in the first dense layer. A dense network 3,072 → 128 → 10 would need 393,344 + 1,290 = 394,634 and would learn nothing position-invariant. The CNN uses fewer parameters, and its 19,392 convolutional parameters do most of the work.",
  },
  {
    title: "Watch a plain RNN forget",
    kind: "code",
    task: "Implement a scalar RNN h_t = tanh(w_x · x_t + w_h · h_{t−1}) with w_x = 1 and w_h = 0.6. Feed a sequence with x₁ = 1 and all later inputs 0, and print h_t for t = 1 to 15. Then implement a scalar 'LSTM-like' cell c_t = f · c_{t−1} + i · x_t with f = 0.95, i = 1, and print c_t for the same input. Comment on the difference.",
    hints: ["The RNN's h shrinks by about w_h each step, further squashed by tanh.", "The cell state shrinks by f per step with no tanh."],
    solution: "RNN: h₁ = tanh(1) = 0.762, h₂ = tanh(0.457) = 0.428, h₃ = 0.251, h₄ = 0.150, h₅ = 0.090, … h₁₅ ≈ 0.0005: the input is forgotten in about ten steps. Cell: c₁ = 1, c₂ = 0.95, c₃ = 0.9025, … c₁₅ = 0.95¹⁴ ≈ 0.488: half the signal survives fifteen steps, and with f = 0.99 it would be 0.87. The additive, gated path decays slowly and controllably; the recurrent tanh path decays geometrically and fast.",
  },
  {
    title: "Attention weights by hand",
    kind: "calculate",
    task: "Four positions have attention scores (already scaled) from position 4 of (1.0, 3.0, 0.0, 2.0). Compute the softmax weights. The values are v₁ = (1, 0), v₂ = (0, 1), v₃ = (1, 1), v₄ = (0, 0). Compute position 4's attention output. Which position did it mostly read, and what single change to the scores would make it read position 1 instead?",
    hints: ["Subtract the max (3.0) first: (−2, 0, −3, −1).", "e⁻² ≈ 0.135, e⁰ = 1, e⁻³ ≈ 0.050, e⁻¹ ≈ 0.368."],
    solution: "Exponentials ≈ (0.135, 1.0, 0.050, 0.368); sum ≈ 1.553; weights ≈ (0.087, 0.644, 0.032, 0.237). Output = 0.087·(1,0) + 0.644·(0,1) + 0.032·(1,1) + 0.237·(0,0) = (0.119, 0.676). Position 4 mostly read position 2. Raising position 1's score above 3.0 (for example to 4.0) would make position 1 dominate; in a trained model that score comes from the dot product of position 4's query with position 1's key.",
  },
  {
    title: "Pick the architecture",
    kind: "think",
    task: "For each task, choose feedforward, CNN, RNN/LSTM/GRU, autoencoder, GAN or transformer, and justify in one sentence: (a) predicting loan default from 60 account features; (b) finding tumours in MRI slices; (c) a wake-word detector running on a smartwatch; (d) flagging unusual network traffic with no labelled attacks; (e) generating extra examples of a rare visual defect; (f) summarising customer emails.",
    hints: ["Think about the data's structure, the compute available, and whether labels exist."],
    solution: "(a) Feedforward (or gradient-boosted trees): tabular, no structure. (b) CNN: images with local structure and limited labelled data; pre-trained backbone if possible. (c) GRU or small LSTM: a continuous audio stream on a tiny processor with constant memory per step. (d) Autoencoder: learn 'normal' from unlabelled traffic and score departures by reconstruction error. (e) GAN (or a diffusion model): generate varied synthetic defects, validated by downstream detector performance. (f) Transformer: text with long-range dependencies and a pre-trained language model available.",
  },
];
