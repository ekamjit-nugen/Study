import type { Exercise, LessonBody, Quiz } from "../types";

// Module 2: How machine learning works. One concept per lesson.
// Keys are lesson slugs: m02-<kebab of the concept title>.

export const M02_BODIES: Record<string, LessonBody> = {
  "m02-datasets-features-and-labels": {
    simple: "A dataset is a table of examples; each column you feed in is a feature, and the column you want the model to predict is the label.",
    concept:
      "Everything a model learns comes from a **dataset**: a collection of examples, almost always laid out like a spreadsheet. Each row is one example (one house, one card payment, one delivery). Each column is one thing you know about it.\n\nThe columns split into two kinds. The **features** are the inputs: the house's floor area, its number of bedrooms, the distance to the station. The **label** is the answer you want the model to produce: the sale price. During training the model sees both; after training it sees only the features and must produce the label.\n\nChoosing the features is a design decision, not a given. 'Date listed' is a column in the estate agent's file, but 'days on the market' is a better feature for predicting price. Turning raw columns into useful features is called **feature engineering**, and it is often where a project is won.",
    why:
      "A model cannot look at a house. It can only look at numbers, and only at the numbers you give it. The dataset is the entire world as far as the model is concerned: if the dataset has no column for 'next to a motorway', the model cannot learn that motorways lower prices, however obvious that is to a person.\n\nSo features and labels exist to make the problem precise: these inputs, this output. Get the label wrong (predicting the asking price when you meant the sale price) and the model learns the wrong thing perfectly. Get the features wrong and no amount of training can recover what is missing.",
    how: [
      "Decide the question: one row per what, predicting what? One row per house, predicting sale price.",
      "Collect the raw columns from wherever they live: the listing database, the land registry, a map service.",
      "Pick and shape the features: numbers the model can use, computed from the raw columns (area, bedrooms, distance to station, days on market).",
      "Attach the label to each row from the source of truth (the registered sale price, not the listing price).",
      "Check the table: missing values, duplicates, impossible numbers (a house with 400 bedrooms), and labels that leaked into features.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["house_id", "area_m2 (feature)", "bedrooms (feature)", "km_to_station (feature)", "days_on_market (feature)", "sale_price (label)"],
        rows: [
          ["101", "84", "2", "0.9", "21", "312,000"],
          ["102", "142", "4", "3.4", "63", "455,000"],
          ["103", "61", "1", "0.4", "9", "239,000"],
          ["104", "97", "3", "1.8", "35", "?  ← what the model must predict"],
        ],
      },
      caption: "Rows are examples. Feature columns go in; the label column is what comes out. The last row is a new house at prediction time: features known, label unknown.",
    },
    everyday: {
      title: "A doctor's intake form",
      text: "When you see a doctor, the intake form is a feature list: age, weight, blood pressure, smoker or not, symptoms. The diagnosis is the label. A medical model is trained on thousands of old forms with their eventual diagnosis attached. If the form never asked about family history, the model can never use it, no matter how much it would help.",
    },
    engineering: {
      title: "Fraud features at a card issuer",
      text: "The raw transaction record has a dozen columns: amount, merchant, time, country. The fraud team's feature table has over two hundred, nearly all computed: amount divided by the card's average, minutes since the last transaction, number of countries used today, whether the merchant was ever seen with this card. The label is 'confirmed fraud' from chargebacks, which arrives weeks later. Most of the team's engineering effort goes into computing those features identically in training and in the live system that scores payments in 20 milliseconds.",
    },
    maths: {
      formula: "X is an n × d matrix of features (n examples, d features); y is a vector of n labels; the model learns f so that f(X) ≈ y",
      meaning: "n is the number of rows, d the number of feature columns. X holds every input number; y holds the answers. The model is a function from a row of X to a prediction.",
      worked: [
        "Three houses, two features (area, bedrooms): X = [[84, 2], [142, 4], [61, 1]], so n = 3 and d = 2.",
        "Labels in thousands: y = [312, 455, 239].",
        "A new house with features [97, 3] is a new row for X; its y is what the model must fill in.",
      ],
      note: "Matrices and vectors get their own lessons in module 3; here they are just the shape of the table.",
    },
    code: {
      title: "A dataset as lists of features and labels",
      lang: "py",
      src: `# One row per house: features in X, the label in y
X = [
    [84, 2, 0.9, 21],     # area m2, bedrooms, km to station, days on market
    [142, 4, 3.4, 63],
    [61, 1, 0.4, 9],
]
y = [312_000, 455_000, 239_000]

feature_names = ["area_m2", "bedrooms", "km_to_station", "days_on_market"]

# A derived feature: price per square metre is NOT allowed here, it uses the label.
# A good derived feature: rooms per 100 m2
for row in X:
    row.append(round(row[1] / row[0] * 100, 2))
feature_names.append("rooms_per_100m2")

print(len(X), "examples,", len(feature_names), "features")
print(X[0])`,
      lines: [
        { code: "X = [", say: "The feature table: one inner list per example." },
        { code: "y = [312_000, 455_000, 239_000]", say: "The labels, in the same order as the rows of X. Row 0 goes with label 0." },
        { code: "# A derived feature: price per square metre is NOT allowed here, it uses the label.", say: "A feature computed from the label would leak the answer into the input. The model would look perfect and be useless." },
        { code: "row.append(round(row[1] / row[0] * 100, 2))", say: "Feature engineering: a new column computed from existing features only." },
      ],
      output: "3 examples, 5 features\n[84, 2, 0.9, 21, 2.38]",
    },
    useIt: "Every supervised project starts by writing down one row per what, which columns are features, and where the label comes from. Do it before any model: unclear labels and leaked features are the two most common reasons a model that scores well in the lab fails in use.",
    takeaways: ["A dataset is a table: rows are examples, columns are features, one column is the label.", "Features are chosen and computed, not just found; this is feature engineering.", "The label must come from the truth you want to predict, not a proxy.", "Never compute a feature from the label."],
    terms: [["dataset", "the table of examples a model learns from"], ["feature", "an input column"], ["label", "the answer column the model learns to predict"], ["feature engineering", "computing useful input columns from raw data"], ["leakage", "a feature that secretly contains the label"]],
    reflect: { q: "To predict whether a patient will be readmitted within 30 days, someone adds the feature 'number of follow-up appointments booked'. What is wrong?", a: "Follow-ups are booked after the discharge decision and often because the patient was readmitted or looked likely to be. The feature leaks the future into the input. At prediction time, on the day of discharge, it does not exist yet." },
  },

  "m02-training-data-vs-testing-data": {
    simple: "Split your examples: the model learns from the training set and is scored on the test set it never saw, because a model can look perfect on examples it memorised.",
    concept:
      "Give a student the exam questions in advance and their mark tells you nothing. A model is the same. If you measure it on the examples it trained on, it can score well simply by remembering them, and you learn nothing about how it will do on new data.\n\nSo the dataset is split before training. The **training set** (typically 70 to 80 percent of the rows) is what the model learns from. The **test set** (the rest) is locked away and used once, at the end, to measure how the model does on examples it has never seen. Often a third slice, the **validation set**, is used during development to compare settings without touching the test set.\n\nThe test score is the honest number. Everything you tell anyone about the model's accuracy should come from it.",
    why:
      "Models have enough adjustable numbers to memorise. A model with a million parameters trained on ten thousand rows can fit every row exactly, including the noise and the typos, and report 100 percent accuracy on the training set while being wrong on half of new cases. This is the overfitting problem that module 4 covers in depth.\n\nThe split exists to catch it. If training accuracy is 99 percent and test accuracy is 71 percent, the model memorised. Without a held-out set, that gap is invisible until the model is in production and customers notice.",
    how: [
      "Shuffle the rows so the split is random, unless time matters (see step 4).",
      "Cut: 80 percent training, 20 percent test. Store the test rows somewhere the training code cannot reach.",
      "If you will compare many settings, cut a validation set out of the training part and use it for those comparisons.",
      "For data with a time order (payments, prices), split by date instead: train on the past, test on the most recent period, because that is how the model will be used.",
      "Train on the training set only. Measure on the test set once, at the end. If you measure, change, and measure again many times, the test set slowly becomes a training set.",
    ],
    visual: {
      kind: "flow",
      steps: ["all 10,000 labelled rows", "shuffle", "8,000 training rows → the model learns", "2,000 test rows → locked away", "final score on the 2,000 only"],
      caption: "The model never sees the test rows during training. Their score is the one you report.",
    },
    everyday: {
      title: "Practice papers and the real exam",
      text: "A student who only ever re-does the same practice paper learns that paper. To know whether they understand the subject, you give them a paper they have not seen. The practice papers are the training set, the unseen paper is the test set, and a student who scores 100 on practice and 60 on the real thing has memorised rather than learned.",
    },
    engineering: {
      title: "Splitting by time at a payments company",
      text: "A fraud team once split their transactions randomly and reported 97 percent accuracy. In production the model scored 84. The random split had put Tuesday's transactions in training and Tuesday's near-identical ones in test, so the model was tested on data it had effectively seen. When they split by date, training on January to October and testing on November, the lab number dropped to 85 and matched production. Time-ordered data must be split by time, because the future is what the model will face.",
    },
    maths: {
      formula: "train share = n_train ÷ n;   generalisation gap = score_train − score_test",
      meaning: "n is the total number of examples. The gap between the training score and the test score is the first sign of memorising.",
      worked: [
        "10,000 rows, 80/20 split: n_train = 8,000, n_test = 2,000.",
        "Model A: training accuracy 0.91, test accuracy 0.89 → gap 0.02. It learned something general.",
        "Model B: training accuracy 0.99, test accuracy 0.72 → gap 0.27. It memorised; module 4 shows how to fix that.",
      ],
    },
    code: {
      title: "A train/test split by hand",
      lang: "py",
      src: `import random

rows = list(range(10_000))          # pretend each number is one labelled example
random.seed(7)                      # same shuffle every run, so results are repeatable
random.shuffle(rows)

cut = int(len(rows) * 0.8)
train = rows[:cut]
test = rows[cut:]

print(len(train), "training rows,", len(test), "test rows")
assert not set(train) & set(test)   # no example appears in both`,
      lines: [
        { code: "random.seed(7)                      # same shuffle every run, so results are repeatable", say: "A fixed seed means you and a colleague get the same split, so scores can be compared." },
        { code: "random.shuffle(rows)", say: "Shuffle first, so the split is not 'the first 80 percent', which might all be one region or one month." },
        { code: "cut = int(len(rows) * 0.8)", say: "80 percent for training. The exact share matters less than keeping the test set untouched." },
        { code: "assert not set(train) & set(test)   # no example appears in both", say: "The one rule: nothing in the test set may also be in training. Duplicates are the usual way this breaks." },
      ],
      output: "8000 training rows, 2000 test rows",
    },
    useIt: "Split before you look at the data in detail, keep the test set out of reach, split by time for anything time-ordered, and watch the gap between training and test scores. When a model's reported accuracy seems too good, the first question is always 'measured on what?'.",
    takeaways: ["Train on one part of the data, score on a part the model never saw.", "The test score is the only honest number; use it once.", "A validation set is for comparing settings during development.", "Time-ordered data is split by time, not at random."],
    terms: [["training set", "the examples the model learns from"], ["test set", "held-out examples used once to measure the model"], ["validation set", "a slice used during development to compare settings"], ["generalisation", "doing well on examples that were not in training"]],
    reflect: { q: "A team improves their model fifty times, checking the test score after each change, and reports the best test score. What has gone wrong?", a: "They used the test set as a validation set. Fifty peeks let them pick settings that happen to suit those particular 2,000 rows, so the reported score is optimistic. They should have compared on a validation set and touched the test set once at the end." },
  },

  "m02-training-vs-inference": {
    simple: "Training is the slow, expensive phase where a model adjusts its numbers from examples; inference is the fast phase where the finished model answers one new input.",
    concept:
      "A model lives two separate lives. During **training** it is shown examples with answers, over and over, and its internal numbers are adjusted after each mistake. This happens once, or occasionally, on powerful machines, and it can take minutes for a small model or months for a large one.\n\nDuring **inference** the numbers are frozen. The model takes one new input and runs it through the formula once to produce a prediction. No examples, no answers, no adjustment. This happens millions of times a day, on ordinary servers or phones, and each run takes milliseconds for a small model or a few seconds for a large language model.\n\nThe two phases use the same formula but differ in everything else: how long they take, what hardware they need, what data they see, and who pays for them.",
    why:
      "Confusing the two phases causes real mistakes. People expect a chatbot to 'learn' from the conversation; it does not, because inference changes nothing. People size a server for training when all it will do is inference, or try to run inference on a laptop for a model that only fits training hardware. And cost models go wrong: training is a one-off bill, inference is a bill per request, forever.\n\nSeparating them makes the system clear: a training pipeline that produces a model file, and a serving system that loads the file and answers requests.",
    how: [
      "Training: load the training set, start with random parameters, loop over the examples adjusting parameters after each mistake, stop when the validation score stops improving.",
      "Save the finished parameters to a file: the model artefact.",
      "Inference: a serving program loads the file once into memory.",
      "For each request, run the input through the formula with the frozen parameters and return the output. Nothing is written back.",
      "To improve the model, go back to step 1 with more or newer data, produce a new file, and swap it in.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Training", points: ["Sees examples with answers", "Changes the parameters", "Runs once or occasionally", "Hours to months on GPUs", "Cost: one bill per training run"] },
      right: { title: "Inference", points: ["Sees one input, no answer", "Parameters frozen", "Runs per request, millions of times", "Milliseconds to seconds", "Cost: per request, forever"] },
      caption: "Same formula, two lives. A model file is the hand-off between them.",
    },
    everyday: {
      title: "Learning to drive, then driving",
      text: "Learning to drive is training: lessons, mistakes, corrections, an instructor's feedback, weeks of effort. Driving to work is inference: you apply what you learned, quickly, without an instructor and without changing much. You do not re-learn to drive every morning, and one odd junction does not rewrite your skills. A model is the same, except it genuinely learns nothing during the drive.",
    },
    engineering: {
      title: "A translation service's two systems",
      text: "A translation company retrains its model every quarter on a cluster of GPUs for about a week, producing a 3 GB model file. That file is copied to two hundred inference servers around the world, each loading it once and translating around 500 sentences a second with the parameters frozen. The training team and the serving team are different people with different budgets: training cost is a quarterly line item; inference cost scales with customers. When users report a bad translation, nothing changes until the next training run includes the correction.",
    },
    maths: {
      formula: "training cost ≈ steps × cost per step (once);   inference cost ≈ requests × cost per request (ongoing)",
      meaning: "Training cost is paid per run. Inference cost is paid per use, so it dominates for anything popular.",
      worked: [
        "A model costs £2,000 to train once.",
        "Each prediction costs £0.0004 and the product serves 10 million predictions a month: £4,000 per month in inference.",
        "After one month inference has already cost twice the training; after a year, 24 times. Optimising inference matters more than optimising training for a product at scale.",
      ],
    },
    code: {
      title: "Train once, save, load, predict",
      lang: "py",
      src: `import json

# --- training phase: learn the slope and intercept from examples ---
hours = [1, 2, 3, 4, 5]
scores = [52, 58, 66, 71, 80]
w, b = 0.0, 50.0
for step in range(2000):
    for x, y in zip(hours, scores):
        error = (w * x + b) - y
        w -= 0.01 * error * x
        b -= 0.01 * error

with open("model.json", "w") as f:
    json.dump({"w": w, "b": b}, f)          # the model artefact

# --- inference phase: load frozen parameters, answer one request ---
with open("model.json") as f:
    params = json.load(f)

def predict(hours_studied):
    return params["w"] * hours_studied + params["b"]   # nothing is adjusted here

print(round(predict(6)))`,
      lines: [
        { code: "for step in range(2000):", say: "Training is the loop: many passes, parameters changing after every example." },
        { code: "json.dump({\"w\": w, \"b\": b}, f)          # the model artefact", say: "The hand-off: the learned numbers are written to a file. Real models are gigabytes, but it is the same idea." },
        { code: "params = json.load(f)", say: "Inference starts by loading the file once." },
        { code: "return params[\"w\"] * hours_studied + params[\"b\"]   # nothing is adjusted here", say: "One formula evaluation per request. No error, no update: the model cannot learn here." },
      ],
      output: "86",
    },
    useIt: "Design every AI system as two parts: a training pipeline that produces a versioned model file, and a serving path that loads it and answers requests. Budget them separately, and remember that a deployed model learns nothing from use until you retrain it.",
    takeaways: ["Training adjusts parameters from examples; inference applies frozen parameters to new input.", "A model file is the hand-off between the two phases.", "Inference is cheap per request but runs forever; it usually dominates cost.", "A deployed model does not learn from the conversations it has."],
    terms: [["training", "the phase where parameters are adjusted from examples"], ["inference", "the phase where a frozen model produces a prediction"], ["model artefact", "the saved file of learned parameters"], ["serving", "running inference for requests in production"]],
    reflect: { q: "A customer says 'I corrected the chatbot yesterday and it made the same mistake today'. What do you tell them?", a: "The chatbot was doing inference; its parameters are frozen and a conversation changes nothing inside it. Corrections only take effect if they are collected and used in a future training run, or if the product stores them and feeds them back into the prompt (a later stage of this path)." },
  },

  "m02-predictions-and-actual-values": {
    simple: "A prediction is what the model says; the actual value is what really happened; the difference between them is the error that training tries to shrink.",
    concept:
      "For every example, two numbers matter. The **prediction** is the model's output: 'this house will sell for £330,000', 'this email is spam with probability 0.92'. The **actual value** is the truth, the label from the dataset: it sold for £312,000; the email was spam.\n\nThe gap between them is the **error**, sometimes called the residual. £330,000 minus £312,000 is an error of £18,000, too high. Every example has its own error, and the pattern of errors tells you how the model is doing: are they small, are they mostly positive (the model guesses high), are they huge for one kind of house?\n\nTraining is a loop of predict, compare with actual, adjust. Evaluation is predict, compare with actual, summarise. Both start with putting these two numbers side by side.",
    why:
      "Without the comparison, a model's output is just an opinion. The actual value is what makes learning possible: it is the signal that says which direction was wrong and by how much. It is also what makes evaluation possible: a thousand predictions next to a thousand actual values is a measurable thing; a thousand predictions alone is not.\n\nThe pairing also exposes bad labels. If the model predicts £310,000 for a house whose 'actual' price is £31,000, the error is probably a missing zero in the data, not a bad model.",
    how: [
      "Run the model on an example to get its prediction.",
      "Look up the actual value for that example from the labels.",
      "Compute the error: prediction minus actual for numbers; right or wrong, or a probability gap, for categories.",
      "Record the error alongside the example so patterns can be found: by region, by size, by time.",
      "Feed the errors into training (to adjust) or into evaluation (to summarise, module 4).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Delivery", "Predicted minutes", "Actual minutes", "Error (pred − actual)", "Reading"],
        rows: [
          ["#1", "30", "34", "−4", "a little optimistic"],
          ["#2", "25", "25", "0", "spot on"],
          ["#3", "40", "33", "+7", "pessimistic"],
          ["#4", "22", "61", "−39", "something unusual happened: investigate"],
        ],
      },
      caption: "Each row pairs a prediction with the truth. The errors, not the predictions, tell you about the model.",
    },
    everyday: {
      title: "Guessing the bill",
      text: "Before the restaurant bill arrives you guess £48. It is £56. Your error is −8: you guessed low. Do that at every meal for a year and you will notice a pattern: you always forget the drinks. That is the error pattern pointing at a missing feature. Next year your guesses include the drinks and the errors shrink.",
    },
    engineering: {
      title: "Error analysis on a delivery-time model",
      text: "A food-delivery team plots prediction minus actual for a week of orders. Most errors sit within five minutes, but orders from one district are all 15 minutes late. The model is not bad; a bridge closed and the map data did not know. The pattern in the errors found a data problem no overall accuracy number would have shown. They add a 'live road closures' feature and the district's errors return to normal within a day.",
    },
    maths: {
      formula: "error_i = ŷ_i − y_i   (ŷ is the prediction, y the actual value, i the example)",
      meaning: "A positive error means the model guessed too high; negative, too low. For a category, the error is 1 if wrong and 0 if right, or the gap between the predicted probability and 1 for the true class.",
      worked: [
        "Predicted 30, actual 34: error = 30 − 34 = −4 (too low).",
        "Predicted 40, actual 33: error = +7 (too high).",
        "Spam classifier predicts probability 0.92 for an email that was spam (actual 1): probability gap = 1 − 0.92 = 0.08, small. For an email that was not spam (actual 0): gap = 0.92 − 0 = 0.92, a confident mistake.",
      ],
      note: "Module 4 turns a whole list of errors into one number, the loss.",
    },
    code: {
      title: "Predictions next to actual values",
      lang: "py",
      src: `predicted = [30, 25, 40, 22]
actual    = [34, 25, 33, 61]

errors = [p - a for p, a in zip(predicted, actual)]
print("errors:", errors)

too_high = sum(1 for e in errors if e > 0)
too_low = sum(1 for e in errors if e < 0)
print("too high:", too_high, " too low:", too_low)

worst = max(range(len(errors)), key=lambda i: abs(errors[i]))
print("worst example:", worst, "with error", errors[worst])`,
      lines: [
        { code: "errors = [p - a for p, a in zip(predicted, actual)]", say: "Prediction minus actual, for every example, in one line. zip pairs them up in order." },
        { code: "too_high = sum(1 for e in errors if e > 0)", say: "Counting the sign of errors shows whether the model leans one way." },
        { code: "worst = max(range(len(errors)), key=lambda i: abs(errors[i]))", say: "The largest absolute error is where to look first; it is often a data problem, not a model problem." },
      ],
      output: "errors: [-4, 0, 7, -39]\ntoo high: 1  too low: 2\nworst example: 3 with error -39",
    },
    useIt: "Always keep predictions and actual values side by side, during training and after deployment. Look at the biggest errors by hand, group errors by category, and check whether the model leans high or low. The pattern of errors is the most useful diagnostic you have, more than any single score.",
    takeaways: ["Prediction is the model's output; actual is the label; error is the difference.", "Errors drive training (adjust) and evaluation (summarise).", "Patterns in errors point at missing features and bad data.", "Look at the worst errors by hand."],
    terms: [["prediction", "the model's output for one example"], ["actual value", "the true label"], ["error / residual", "prediction minus actual"], ["error analysis", "studying the pattern of errors to find what to fix"]],
    reflect: { q: "A model's errors average exactly zero. Is it a good model?", a: "Not necessarily. Errors of +40 and −40 average zero. The average sign tells you about bias (leaning high or low); the size of the errors, which module 4 measures with squared or absolute values, tells you about accuracy." },
  },

  "m02-what-is-a-machine-learning-model": {
    simple: "A model is a formula with adjustable numbers inside: it turns input features into a prediction, and training sets the numbers.",
    concept:
      "The word gets used loosely, so here is the precise meaning. A **machine learning model** is a function from features to a prediction, with adjustable numbers inside called parameters. Feed in the features of a house and it returns a price. The shape of the formula is chosen by a person (this is the **model type** or architecture); the values of the numbers are found by training.\n\nThe simplest model multiplies each feature by a number and adds the results: price = 2,100 × area + 15,000 × bedrooms − 9,000 × km_to_station + 40,000. That is a linear model with four parameters. A decision tree is a model made of if-then splits learned from data. A neural network is a model made of layers of such formulas. The language models later in this path are the same idea with billions of numbers.\n\nSo a model is not a program that someone wrote line by line. It is a formula template plus the numbers that training poured into it.",
    why:
      "The idea exists because of a division of labour. People are good at choosing the shape of a problem: price probably depends on area and location, so give the formula those inputs. People are bad at finding the exact numbers: is a bedroom worth £15,000 or £22,000, and does it depend on the area? Data answers that, through training.\n\nSeparating shape (chosen) from numbers (learned) is what makes machine learning engineering rather than guessing. You can try a different shape, train it, and compare. The shape is your hypothesis about the world; the numbers are what the world says back.",
    how: [
      "Choose the model type: what kind of formula, with how many adjustable numbers, matching the kind of data (a table, images, text).",
      "Initialise the parameters, usually with small random numbers.",
      "Define how an input flows through the formula to an output. This is the model's forward computation.",
      "Train: adjust the parameters so outputs match labels (module 5).",
      "Use: the finished model is the shape plus the learned numbers, saved as a file.",
    ],
    visual: {
      kind: "flow",
      steps: ["features: area 97, bedrooms 3, km 1.8", "model: 2,100·area + 15,000·bed − 9,000·km + 40,000", "prediction: £272,500"],
      caption: "A model is the box in the middle: a fixed shape, with numbers (2,100; 15,000; −9,000; 40,000) that training chose.",
    },
    everyday: {
      title: "A recipe with blanks",
      text: "Imagine a cake recipe where the method is fixed (mix, bake, cool) but the quantities are blank. You bake it fifty times, adjusting the blanks each time by how the cake came out, until it is right. The method is the model type; the quantities are the parameters; your fifty attempts are training. The finished recipe card, method plus numbers, is the model.",
    },
    engineering: {
      title: "Choosing a model type for churn",
      text: "A telecoms company wants to predict which customers will leave. Their data is a table of 40 features per customer. The data scientist tries three model types: a linear model (fast, explainable, 41 parameters), a gradient-boosted tree ensemble (more accurate on tables, thousands of split rules), and a small neural network. The tree model wins on the validation set by three points, and it is explainable enough for the retention team, so it ships. The choice of shape was an experiment, not a belief.",
    },
    maths: {
      formula: "ŷ = w₁x₁ + w₂x₂ + w₃x₃ + b",
      meaning: "x are the features of one example, w are the learned weights (one per feature), b is the learned intercept, ŷ is the prediction. Four parameters for three features.",
      worked: [
        "Learned parameters: w₁ = 2,100 (per m²), w₂ = 15,000 (per bedroom), w₃ = −9,000 (per km to station), b = 40,000.",
        "A 97 m², 3-bedroom house 1.8 km from the station: ŷ = 2,100·97 + 15,000·3 − 9,000·1.8 + 40,000.",
        "= 203,700 + 45,000 − 16,200 + 40,000 = £272,500.",
        "Change w₃ to −12,000 and the same house predicts £267,100: the parameters are the model's opinions about the world.",
      ],
    },
    code: {
      title: "A model as a class: shape plus parameters",
      lang: "py",
      src: `class LinearModel:
    def __init__(self, n_features):
        self.w = [0.0] * n_features     # one weight per feature, learned later
        self.b = 0.0                    # the intercept, learned later

    def predict(self, x):
        total = self.b
        for wi, xi in zip(self.w, x):
            total += wi * xi
        return total

model = LinearModel(3)
model.w = [2100, 15000, -9000]          # pretend training found these
model.b = 40000

print(model.predict([97, 3, 1.8]))`,
      lines: [
        { code: "class LinearModel:", say: "The model type: a fixed shape. Every LinearModel computes the same kind of formula." },
        { code: "self.w = [0.0] * n_features     # one weight per feature, learned later", say: "The parameters, starting empty. Training fills them in." },
        { code: "total += wi * xi", say: "The forward computation: each feature times its weight, added up." },
        { code: "model.w = [2100, 15000, -9000]          # pretend training found these", say: "Here the numbers are typed in to show the idea; module 5 finds them from data." },
      ],
      output: "272500.0",
    },
    useIt: "When someone says 'the model', ask two things: what shape (linear, tree, network, transformer) and what numbers (how many parameters, trained on what). The shape tells you what it can represent and how explainable it is; the numbers tell you what it learned. Picking the shape is an experiment to run, not a belief to hold.",
    takeaways: ["A model is a formula with adjustable numbers: shape chosen by people, numbers found by training.", "Linear models, trees and neural networks are different shapes.", "The saved model is the shape plus the learned numbers.", "Try several shapes and let the validation score choose."],
    terms: [["model", "a function from features to prediction with learnable parameters"], ["model type / architecture", "the fixed shape of the formula"], ["linear model", "prediction = weighted sum of features plus an intercept"], ["forward computation", "running an input through the formula to get an output"]],
    reflect: { q: "Two teams train the same linear model on the same data and get the same parameters. A third team trains a neural network and gets different predictions. Which is 'right'?", a: "None is right by construction; each is a hypothesis. The validation and test scores decide. The linear teams agreeing is expected: same shape, same data, same answer. The network has a different shape and can represent patterns the line cannot, which may help or may overfit." },
  },

  "m02-what-does-it-mean-for-a-model-to-learn": {
    simple: "Learning means changing the model's parameters, a little at a time, so its predictions get closer to the actual values across the training set.",
    concept:
      "'The model learned' sounds mysterious. It is not. **Learning** is the process of changing the parameters so that the errors on the training examples get smaller. Nothing else changes: not the code, not the formula's shape, not the data. Only the numbers.\n\nIt works by repetition. Show an example; the model predicts; compare with the actual value; nudge every parameter slightly in the direction that would have reduced that error; move to the next example. After enough passes the parameters settle at values where the errors are small for most examples. That settled set of numbers is what the model 'knows'.\n\nWhat is learned is a pattern in the numbers, not an understanding. A house-price model that learned w₂ = 15,000 does not know what a bedroom is. It found that, in the data, each extra bedroom came with about £15,000 more. If the data changes, that number is simply wrong.",
    why:
      "Learning exists so that nobody has to find the parameters by hand. For four parameters you could guess and check. For a million, or seventy billion, you cannot. The mechanical nudge-toward-less-error procedure scales to any number of parameters because every parameter is adjusted the same way at once.\n\nUnderstanding learning as 'parameters moving to reduce error' also demystifies the failures: if the training data has a bias, the parameters learn it faithfully; if the data is from last year, the parameters describe last year.",
    how: [
      "Start with parameters set to small random numbers; predictions are nonsense.",
      "Take an example. Predict. Compute the error.",
      "For each parameter, work out which direction would have made this error smaller (module 5 shows how), and move it a small step that way.",
      "Repeat for every example in the training set. One full pass is an epoch.",
      "Repeat for many epochs, watching the error shrink. Stop when it stops shrinking on the validation set.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Epoch", "w (per m²)", "b", "Average error on training set"],
        rows: [["0 (random)", "0.3", "12", "£261,000"], ["1", "870", "3,400", "£92,000"], ["5", "1,960", "28,000", "£31,000"], ["20", "2,090", "39,100", "£19,500"], ["50", "2,100", "40,000", "£19,200"], ["100", "2,100", "40,000", "£19,200 (stopped improving)"]],
      },
      caption: "Learning, visible: the parameters move and the error falls, then both settle. The final numbers are the learned model.",
    },
    everyday: {
      title: "Tuning a guitar by ear",
      text: "You pluck a string, hear it is flat, turn the peg a little, pluck again. Each pluck is a prediction, each listen is a comparison, each turn is a parameter update. You never calculate the frequency; you just keep nudging in the direction that sounds less wrong until it sounds right. Six strings tuned at once, by the same procedure, is a six-parameter model learning.",
    },
    engineering: {
      title: "Watching a fraud model learn, and learn the wrong thing",
      text: "A bank trained a fraud model and watched the training error fall nicely. On inspection, one parameter had grown huge: the weight on 'transaction made at 3 am'. The training data came from a period when one fraud ring worked nights, so the model learned 'night equals fraud' faithfully. It was learning correctly, from data that no longer described the world. The team rebalanced the data across time and the parameter shrank. Learning is only as good as what it learns from.",
    },
    maths: {
      formula: "w_new = w_old − α · (direction that increases the error)",
      meaning: "α (alpha) is a small step size. Moving against the direction that increases error decreases it. For a linear model with one feature, that direction for w is error × x.",
      worked: [
        "One feature (area). Current w = 1,000, b = 0. Example: area 100, actual price 250,000. Prediction = 100,000; error = 100,000 − 250,000 = −150,000 (too low).",
        "Direction for w: error × x = −150,000 × 100 = −15,000,000. Step α = 0.00000001.",
        "w_new = 1,000 − 0.00000001 × (−15,000,000) = 1,000 + 0.15 = 1,000.15. A tiny nudge upward, because the prediction was too low.",
        "Thousands of such nudges across thousands of houses move w to about 2,100.",
      ],
      note: "Why this is the right direction, and how to choose α, is module 5. Here the point is: learning is nudging numbers.",
    },
    code: {
      title: "Learning, printed as it happens",
      lang: "py",
      src: `areas  = [84, 142, 61, 120, 75]            # m2
prices = [312, 455, 239, 410, 290]         # thousands of pounds

w, b = 0.0, 0.0
alpha = 0.00005

for epoch in range(1, 6):
    for x, y in zip(areas, prices):
        error = (w * x + b) - y
        w -= alpha * error * x
        b -= alpha * error
    avg_err = sum(abs((w * x + b) - y) for x, y in zip(areas, prices)) / len(areas)
    print(f"epoch {epoch}: w={w:.2f} b={b:.3f} avg error={avg_err:.1f}k")`,
      lines: [
        { code: "w, b = 0.0, 0.0", say: "Before learning: the model knows nothing, every prediction is 0." },
        { code: "error = (w * x + b) - y", say: "Predict, then compare with the actual value." },
        { code: "w -= alpha * error * x", say: "The nudge. Too low (negative error) pushes w up; too high pushes it down." },
        { code: "avg_err = sum(abs((w * x + b) - y) for x, y in zip(areas, prices)) / len(areas)", say: "After each pass, measure how wrong the model still is. Watching this fall, then flatten, is watching learning." },
      ],
      output: "epoch 1: w=3.53 b=0.033 avg error=24.8k\nepoch 2: w=3.53 b=0.036 avg error=24.8k\nepoch 3: w=3.53 b=0.038 avg error=24.8k\nepoch 4: w=3.53 b=0.041 avg error=24.8k\nepoch 5: w=3.53 b=0.043 avg error=24.8k",
      note: "The slope lands near 3.53 thousand pounds per square metre within the first pass, then b creeps up by a few pounds per epoch. With this tiny step size b will take ages to reach its right value; module 5 explains why features of different sizes need different treatment.",
    },
    useIt: "When a model behaves oddly, remember what learning is: parameters moved to fit the training data. So ask what the data contained. A biased dataset produces biased parameters; stale data produces stale parameters; a leaked label produces a parameter that reads the answer. Learning is faithful, not wise.",
    takeaways: ["Learning = adjusting parameters to shrink errors on the training examples. Nothing else changes.", "It is repetition: predict, compare, nudge, for every example, for many epochs.", "The parameters learn whatever pattern the data has, including bias and staleness.", "Watch the error fall and settle; that curve is learning made visible."],
    terms: [["learning", "changing parameters to reduce training error"], ["epoch", "one full pass through the training set"], ["update / nudge", "one small change to a parameter after an error"], ["convergence", "when the parameters stop changing because the error stops falling"]],
    reflect: { q: "After training, you double every house's price in the dataset and retrain. What happens to the parameters, and did the model 'understand' anything?", a: "The weights and intercept roughly double, because the pattern in the numbers doubled. The model understood nothing about prices or inflation; it fit whatever numbers it was given. That is exactly what learning is." },
  },

  "m02-parameters-vs-hyperparameters": {
    simple: "Parameters are the numbers training changes inside the model; hyperparameters are the settings you choose before training that control how it learns.",
    concept:
      "Two kinds of numbers are involved in any model, and mixing them up causes confusion.\n\n**Parameters** live inside the model and are set by training: the weights and the intercept of a linear model, every connection strength in a neural network. You never type them in; the data decides them. A '7B model' has seven billion of these.\n\n**Hyperparameters** live outside the model and are set by you before training starts: the step size for each nudge (the learning rate), how many passes to make (epochs), how many examples to process at a time (batch size), how many layers the network has and how wide they are. Training does not change them. You choose them, train, look at the validation score, and choose again.\n\nA rule of thumb: if the data sets it, it is a parameter. If you set it, it is a hyperparameter.",
    why:
      "The distinction exists because the learning procedure itself has knobs. The nudge-toward-less-error loop needs to know how big a nudge, how many times, on how much data. Those choices cannot be learned by the same loop, since they define the loop. So they are set from outside, by experience, by rules of thumb, or by systematic search.\n\nGetting hyperparameters wrong is the most common reason a model that should work does not: a learning rate ten times too big makes training explode; ten times too small makes it crawl. The same model shape with the same data can succeed or fail on hyperparameters alone.",
    how: [
      "Choose the hyperparameters: model size, learning rate, epochs, batch size, regularisation strength.",
      "Train: the parameters are set by the data under those settings.",
      "Score on the validation set.",
      "Change one hyperparameter, retrain from scratch, score again. Repeat, by hand or with an automated search.",
      "Keep the hyperparameters with the best validation score; measure once on the test set.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Parameters", points: ["Inside the model", "Set by training, from the data", "Weights, biases, every connection", "Millions to billions of them", "Saved in the model file"] },
      right: { title: "Hyperparameters", points: ["Outside the model", "Set by you, before training", "Learning rate, epochs, batch size, layers, width", "A handful to a few dozen", "Saved in the training config"] },
      caption: "The data writes the left column; you write the right one.",
    },
    everyday: {
      title: "Studying for an exam",
      text: "What you know after studying is the parameters: the facts and skills that went into your head. How you studied is the hyperparameters: how many hours a day, how long each session, whether you did practice questions or re-read notes. Changing how you study changes what ends up in your head, but your study plan is not itself a fact about chemistry.",
    },
    engineering: {
      title: "A hyperparameter search for an image classifier",
      text: "A team training a defect detector for a factory line has a model with 11 million parameters and six hyperparameters that matter: learning rate, batch size, number of epochs, dropout rate, image size and augmentation strength. They run 60 training jobs overnight with different combinations, each one training all 11 million parameters from scratch, and pick the combination with the best validation accuracy. The winning learning rate was 0.001; at 0.01 every run diverged, at 0.0001 none finished learning in time. Six numbers chosen by search; 11 million chosen by data.",
    },
    maths: {
      formula: "w ← w − α · g   (w: parameter, updated by training;  α: learning rate, a hyperparameter you choose;  g: the error direction)",
      meaning: "The same update formula contains both kinds: w changes every step; α stays fixed for the whole run.",
      worked: [
        "Error direction g = 4 for some parameter currently at w = 10.",
        "With α = 0.1: w becomes 10 − 0.4 = 9.6. A sensible step.",
        "With α = 1.0: w becomes 10 − 4 = 6. Big jump; may overshoot the best value.",
        "With α = 0.001: w becomes 9.996. Thousands of steps needed to move anywhere.",
        "Same model, same data, same error; only the hyperparameter differs, and the outcome of training differs.",
      ],
    },
    code: {
      title: "Three runs, three learning rates",
      lang: "py",
      src: `def train(alpha, epochs=200):
    xs = [1, 2, 3, 4, 5]
    ys = [3, 5, 7, 9, 11]            # the true rule is y = 2x + 1
    w, b = 0.0, 0.0                   # parameters: set by the data
    for _ in range(epochs):           # epochs: a hyperparameter
        for x, y in zip(xs, ys):
            err = (w * x + b) - y
            w -= alpha * err * x      # alpha: a hyperparameter
            b -= alpha * err
        if abs(w) > 1e9:
            return "diverged"         # the numbers blew up
    return round(w, 3), round(b, 3)

for alpha in [0.001, 0.02, 0.5]:
    print(alpha, train(alpha))`,
      lines: [
        { code: "w, b = 0.0, 0.0                   # parameters: set by the data", say: "These two numbers are what training changes." },
        { code: "for _ in range(epochs):           # epochs: a hyperparameter", say: "How many passes: your choice, fixed for the run." },
        { code: "w -= alpha * err * x      # alpha: a hyperparameter", say: "The step size is yours too. It is in the update rule but training never changes it." },
        { code: "for alpha in [0.001, 0.02, 0.5]:", say: "A tiny hyperparameter search: three values, three runs from scratch." },
      ],
      output: "0.001 (2.096, 0.652)\n0.02 (2.002, 0.99)\n0.5 diverged",
      note: "Too small: still short of the true 2 and 1 after 200 epochs. Right: almost exactly 2 and 1. Too big: each step overshoots further than the last and the numbers blow up.",
    },
    useIt: "Keep parameters and hyperparameters in separate places: the model file and the training config. Record the config with every trained model so a result can be reproduced. When training misbehaves, check the hyperparameters first, especially the learning rate; when the model is simply wrong on the task, check the data.",
    takeaways: ["Parameters: inside the model, set by data. Hyperparameters: outside, set by you.", "Learning rate, epochs, batch size and model size are the hyperparameters that matter most.", "Hyperparameters are found by search over validation scores, retraining each time.", "Record the config with the model."],
    terms: [["parameter", "a number inside the model set by training"], ["hyperparameter", "a training setting chosen before training"], ["learning rate", "the step size of each parameter update"], ["hyperparameter search", "training with many settings and keeping the best by validation score"]],
    reflect: { q: "A colleague says 'the model has 50 parameters: 48 weights, the learning rate and the number of epochs'. Correct them.", a: "The model has 49 parameters at most (48 weights plus an intercept, if there is one). Learning rate and epochs are hyperparameters: they control training and are not inside the model. They belong in the training config, not the model file." },
  },

  "m02-weights-and-biases": {
    simple: "A weight says how much one input counts; a bias shifts the result up or down regardless of input. Together they are the parameters of the simplest model.",
    concept:
      "The two kinds of parameter in almost every model have plain names. A **weight** multiplies an input. A weight of 2,100 on floor area says 'each square metre adds £2,100'. A weight near zero says 'this input barely matters'. A negative weight says 'more of this lowers the answer'. There is one weight per input per output.\n\nA **bias** is added after the multiplications and does not depend on any input. It is the model's answer when every input is zero: the baseline. For house prices, it is roughly the price of the land and the paperwork before any rooms exist. Without a bias, a model with all-zero inputs would be forced to predict zero, which is rarely right.\n\nIn a neural network every neuron has its own weights (one per incoming connection) and its own bias. A model with seven billion parameters is mostly weights, with a bias per neuron.",
    why:
      "Weights exist because inputs matter by different amounts and in different directions, and only the data knows how much. Bias exists because the right answer is almost never zero when the inputs are zero: a line that must pass through the origin cannot fit most data. The two together let a straight line go anywhere: the weights set the slope, the bias sets where it sits.\n\nNote the other meaning of the word: 'bias' as in an unfair model that treats groups differently. That is a different concept (lesson 19.8). Here bias is just the intercept.",
    how: [
      "For each input feature, multiply its value by that feature's weight.",
      "Add all the products together.",
      "Add the bias.",
      "The sum is the model's output (for a linear model) or, in a neural network, the number passed to the activation function (module 6).",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "inputs", detail: "area 97, bedrooms 3, km to station 1.8" },
        { label: "× weights", detail: "97 × 2,100 = 203,700;  3 × 15,000 = 45,000;  1.8 × (−9,000) = −16,200" },
        { label: "sum", detail: "203,700 + 45,000 − 16,200 = 232,500" },
        { label: "+ bias", detail: "232,500 + 40,000 = 272,500" },
        { label: "output", detail: "£272,500" },
      ],
      caption: "Weights scale each input; the bias shifts the total. Four numbers, one prediction.",
    },
    everyday: {
      title: "A taxi fare",
      text: "A taxi charges £3 to get in and £1.80 per kilometre. The £1.80 is the weight on distance: each kilometre adds that much. The £3 is the bias: what you pay at zero kilometres. A fare model with no bias would charge nothing for a very short hop, which no taxi does. Add a weight on waiting time and you have a two-feature linear model.",
    },
    engineering: {
      title: "Reading the weights of a loan model",
      text: "A lender trains a linear model to estimate default risk from a dozen features. The weights are the model's explanation: a large positive weight on 'missed payments last year' and a small negative weight on 'years at current address'. A regulator can read them. When the weight on an applicant's postcode turned out large, the team realised the model was using location as a stand-in for income, removed the feature, and retrained. Weights make simple models explainable, which is why lenders often prefer them to networks.",
    },
    maths: {
      formula: "ŷ = Σᵢ wᵢ xᵢ + b",
      meaning: "Σ means add up over all features i. wᵢ is the weight for feature i, xᵢ its value, b the bias. One output, d weights, one bias: d + 1 parameters.",
      worked: [
        "Taxi: w_distance = 1.80, w_wait = 0.40 per minute, b = 3.00.",
        "A 6 km ride with 5 minutes waiting: ŷ = 1.80·6 + 0.40·5 + 3.00 = 10.80 + 2.00 + 3.00 = £15.80.",
        "Set b = 0: the same ride costs £12.80 and a 0 km ride costs £0. The bias is the fixed starting point.",
        "Set w_wait = 0: waiting is ignored; the model says waiting does not matter.",
      ],
    },
    code: {
      title: "Weights and bias, and what each does",
      lang: "py",
      src: `def fare(km, wait_min, w_km=1.80, w_wait=0.40, bias=3.00):
    return w_km * km + w_wait * wait_min + bias

print(fare(6, 5))                       # normal ride
print(fare(0, 0))                       # the bias alone
print(fare(6, 5, bias=0.0))             # no bias: cheaper for everyone
print(fare(6, 5, w_wait=0.0))           # waiting ignored
print(fare(6, 5, w_km=-1.0))            # a negative weight: longer rides cost less (nonsense here, but legal)`,
      lines: [
        { code: "return w_km * km + w_wait * wait_min + bias", say: "The whole linear model: each input times its weight, plus the bias." },
        { code: "print(fare(0, 0))                       # the bias alone", say: "With zero inputs, the output is the bias. That is what the bias means." },
        { code: "print(fare(6, 5, w_wait=0.0))           # waiting ignored", say: "A zero weight switches a feature off." },
        { code: "print(fare(6, 5, w_km=-1.0))            # a negative weight: longer rides cost less (nonsense here, but legal)", say: "Weights can be negative; the data decides the sign. A negative weight on distance to a station is sensible for house prices." },
      ],
      output: "15.8\n3.0\n12.8\n13.8\n-1.0",
    },
    useIt: "For simple models, read the weights: they say what the model thinks matters and in which direction. For large networks you cannot read billions of them, but the mechanics are the same, and knowing that a 'parameter count' is mostly weights explains model size, memory and cost in later modules.",
    takeaways: ["Weight: multiplies an input; sign says direction, size says importance.", "Bias: added after; the output when all inputs are zero.", "A linear model with d features has d weights and 1 bias.", "In networks, every neuron has its own weights and bias; billions of parameters are mostly weights."],
    terms: [["weight", "a parameter that multiplies an input"], ["bias (intercept)", "a parameter added to the weighted sum"], ["weighted sum", "inputs times weights, added up"], ["explainable model", "one whose parameters a person can read and interpret"]],
    reflect: { q: "A house-price model has a bias of £40,000 and the weight on 'number of bathrooms' is −£8,000. Should you panic?", a: "Not immediately. Bathrooms correlate with other features (area, bedrooms) that already carry the price; the model may be using the bathroom weight to correct an over-count elsewhere. Correlated features make individual weights hard to read. Check by removing the feature and comparing validation scores." },
  },

  "m02-tensors": {
    simple: "A tensor is a grid of numbers with any number of dimensions: a single number, a list, a table, a stack of tables. Models store and process everything as tensors.",
    concept:
      "Models work on numbers arranged in grids, and there is one word for all the grid shapes: **tensor**. A single number is a tensor with zero dimensions (a scalar). A list of numbers, like one house's features, is a one-dimensional tensor (a vector). A table, like the whole dataset, is two-dimensional (a matrix). A colour photo is three-dimensional: height × width × three colour channels. A batch of 32 photos is four-dimensional.\n\nThe number of dimensions is the tensor's **rank**, and the size along each dimension is its **shape**. A batch of 32 photos of 224 by 224 pixels has shape (32, 224, 224, 3). Reading shapes is a daily skill: most bugs in model code are two tensors whose shapes do not line up.\n\nTensors are not a new kind of maths. They are the bookkeeping that lets a computer apply the same operation to millions of numbers at once, which is what makes modern models fast.",
    why:
      "A neural network does billions of multiplications per prediction. Written as loops over single numbers, that would take forever in Python. Written as operations on whole tensors ('multiply this 512 × 512 table by that one'), it runs on hardware built for exactly that: graphics cards process entire grids in one go.\n\nSo tensors exist for speed and for clarity. Speed, because one tensor operation replaces a million scalar ones. Clarity, because a model's data flow can be described as shapes: (batch, features) in, (batch, 1) out.",
    how: [
      "Represent every piece of data as a grid of numbers with a declared shape: features as (n, d), images as (n, height, width, channels), text as (n, tokens).",
      "Represent the model's parameters as tensors too: a layer's weights as a (inputs, outputs) matrix, its biases as an (outputs,) vector.",
      "Express each computation as a tensor operation: matrix multiplication, element-wise addition, reshaping.",
      "Let the library (NumPy, PyTorch, JAX) run each operation over all elements at once, on a CPU or GPU.",
      "Check shapes at every step: the output of one operation must have the shape the next expects.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Rank", "Name", "Example", "Shape"],
        rows: [
          ["0", "scalar", "a single price: 312,000", "()"],
          ["1", "vector", "one house's features", "(4,)"],
          ["2", "matrix", "the dataset of 10,000 houses", "(10000, 4)"],
          ["3", "3-tensor", "one colour photo", "(224, 224, 3)"],
          ["4", "4-tensor", "a batch of 32 photos", "(32, 224, 224, 3)"],
        ],
      },
      caption: "Same idea, more dimensions. The shape is the tensor's label; operations must agree on it.",
    },
    everyday: {
      title: "A spreadsheet with tabs",
      text: "One cell is a scalar. One row is a vector. One sheet is a matrix. A workbook with twelve monthly sheets of the same layout is a three-dimensional tensor: month × row × column. Asking 'total sales for March, row 7' is indexing into a 3-tensor. Nobody finds workbooks mysterious; tensors are workbooks with as many tab-levels as you need.",
    },
    engineering: {
      title: "A shape bug in a vision model",
      text: "A team's product-image classifier trained fine but gave nonsense in production. The training pipeline produced images with shape (height, width, channels); the production camera library produced (channels, height, width). Same numbers, different order of dimensions, and the model read red values as rows. Nothing crashed, because the total count matched. The fix was one transpose and a shape assertion at the model's entrance. Shape checks are the unit tests of tensor code.",
    },
    maths: {
      formula: "A tensor of shape (d₁, d₂, …, dₖ) holds d₁ × d₂ × … × dₖ numbers",
      meaning: "Multiply the sizes to get the element count, which decides memory and compute.",
      worked: [
        "One house: shape (4,) → 4 numbers.",
        "Dataset: shape (10000, 4) → 40,000 numbers.",
        "A batch of 32 photos (32, 224, 224, 3) → 32 × 224 × 224 × 3 = 4,816,896 numbers; at 4 bytes each, about 19 MB in memory.",
        "A layer's weight matrix (4096, 4096) → 16,777,216 numbers; a model with hundreds of such layers reaches billions, which is lesson 2.11.",
      ],
    },
    code: {
      title: "Tensors and shapes with NumPy",
      lang: "py",
      src: `import numpy as np

price = np.array(312_000)                    # rank 0: a scalar
house = np.array([84, 2, 0.9, 21])           # rank 1: a vector of 4 features
data = np.array([[84, 2, 0.9, 21],
                 [142, 4, 3.4, 63],
                 [61, 1, 0.4, 9]])           # rank 2: a matrix, 3 houses x 4 features
photos = np.zeros((32, 224, 224, 3))         # rank 4: a batch of blank colour images

for name, t in [("price", price), ("house", house), ("data", data), ("photos", photos)]:
    print(name, "rank", t.ndim, "shape", t.shape, "elements", t.size)

weights = np.array([2100, 15000, -9000, -50])
print(data @ weights + 40000)                # one operation predicts all three houses at once`,
      lines: [
        { code: "house = np.array([84, 2, 0.9, 21])           # rank 1: a vector of 4 features", say: "One example as a vector. Shape (4,)." },
        { code: "photos = np.zeros((32, 224, 224, 3))         # rank 4: a batch of blank colour images", say: "Four dimensions: batch, height, width, colour. Nearly five million numbers." },
        { code: "print(name, \"rank\", t.ndim, \"shape\", t.shape, \"elements\", t.size)", say: "Rank, shape and size are the three facts to check about any tensor." },
        { code: "print(data @ weights + 40000)                # one operation predicts all three houses at once", say: "The @ is matrix multiplication (lesson 3.10). One line applies the model to every row; no loop." },
      ],
      output: "price rank 0 shape () elements 1\nhouse rank 1 shape (4,) elements 4\ndata rank 2 shape (3, 4) elements 12\nphotos rank 4 shape (32, 224, 224, 3) elements 4816896\n[237250. 364450. 179050.]",
    },
    useIt: "Think in shapes. Write the shape of every tensor as a comment in model code, assert shapes at module boundaries, and when something is wrong, print shapes before anything else. Memory and compute budgets are also shape arithmetic: multiply the dimensions.",
    takeaways: ["A tensor is a grid of numbers with a rank (dimensions) and a shape (sizes).", "Scalars, vectors, matrices and images are tensors of rank 0, 1, 2 and 3.", "Models are tensor operations, which hardware runs over all elements at once.", "Most bugs are shape bugs; check shapes."],
    terms: [["tensor", "a grid of numbers with any number of dimensions"], ["rank", "the number of dimensions"], ["shape", "the size along each dimension"], ["batch", "several examples stacked along a first dimension"]],
    reflect: { q: "A sentence of 12 tokens, each represented by 768 numbers, in a batch of 8 sentences: what is the tensor's shape and how many numbers is that?", a: "Shape (8, 12, 768): batch, tokens, numbers per token. 8 × 12 × 768 = 73,728 numbers. This is exactly the shape that flows through a language model (module 16)." },
  },

  "m02-where-model-parameters-are-stored": {
    simple: "Parameters are stored as tensors in a model file on disk, loaded into memory (RAM or GPU memory) to run; the file is the model, and its size decides what hardware can hold it.",
    concept:
      "After training, the learned numbers have to live somewhere. In memory, during training and inference, they are tensors: one weight matrix and one bias vector per layer, held in RAM or, for speed, in the memory of a graphics card. On disk, between uses, they are written to a **model file** (a checkpoint, lesson 2.12): all the tensors, with their names and shapes, in a format a library can load back.\n\nThe file is the model. Copy it and you have copied everything the model learned. Delete it and the training has to be redone. Its size is the parameter count times the bytes per number: a billion parameters stored as 16-bit numbers is about two gigabytes.\n\nWhere the file goes to run matters as much as where it sits: a model must fit in the memory of the machine that runs it, and loading it from disk takes time, so serving systems load once and keep it resident.",
    why:
      "Parameters are the expensive output of training; losing or mis-storing them wastes the whole run. Storage also decides who can use the model: a 2 GB file runs on a laptop, a 140 GB file needs several GPUs. And the format matters for sharing: a standard file lets another team, or another company, load the model without the training code.\n\nUnderstanding storage also explains open-weight models (lesson 17.14): what gets published is literally the file of tensors.",
    how: [
      "During training, parameters live in memory as tensors, updated every step.",
      "Periodically and at the end, every tensor is serialised: its name, shape, number type and raw bytes are written to a file.",
      "The file is stored and versioned: object storage, a model registry, a hub.",
      "To serve, a process reads the file into memory once, on the CPU or straight onto the GPU.",
      "Requests use the in-memory tensors; nothing is read from disk per request.",
    ],
    visual: {
      kind: "flow",
      steps: ["training: tensors in GPU memory, changing", "save: tensors → model file (names, shapes, bytes)", "store: object storage / registry / hub, versioned", "load: file → RAM or GPU memory, once", "serve: requests read the resident tensors"],
      caption: "Disk between runs, memory while running. The file size is parameters × bytes per parameter.",
    },
    everyday: {
      title: "A recipe book and the kitchen counter",
      text: "A cook's knowledge is in a recipe book on the shelf. To cook, they open it on the counter and keep it there through the evening; they do not walk back to the shelf for every ingredient. The book is the model file; the counter is memory; the evening's cooking is serving. If the book is too big for the counter, you cannot cook from it.",
    },
    engineering: {
      title: "Sizing a server for a 7B model",
      text: "A team wants to run a 7-billion-parameter language model for an internal tool. Stored at 16 bits per parameter the file is about 14 GB, so the serving GPU needs more than 14 GB of memory plus working space; they pick a 24 GB card. Loading takes 40 seconds from local disk, so the server loads once at start-up and keeps the model resident. Later they quantise the file to 4 bits (lesson 40.10), the file drops to about 4 GB, and the same model runs on a 8 GB card. The storage format decided the hardware bill.",
    },
    maths: {
      formula: "file size ≈ parameters × bytes per parameter",
      meaning: "Common sizes: 4 bytes (32-bit float), 2 bytes (16-bit), 1 byte (8-bit integer), 0.5 byte (4-bit).",
      worked: [
        "A linear model with 5 parameters at 4 bytes: 20 bytes. Trivial.",
        "A 7B model at 2 bytes: 7 × 10⁹ × 2 = 14 GB.",
        "The same model at 0.5 byte (4-bit): 3.5 GB, plus a little overhead.",
        "A 70B model at 2 bytes: 140 GB, more than any single consumer GPU holds, so it is split across several.",
      ],
    },
    code: {
      title: "Saving and loading parameters as tensors",
      lang: "py",
      src: `import numpy as np

# parameters in memory after training
params = {
    "layer1.weight": np.random.randn(4, 8).astype(np.float32),
    "layer1.bias": np.zeros(8, dtype=np.float32),
    "out.weight": np.random.randn(8, 1).astype(np.float32),
    "out.bias": np.zeros(1, dtype=np.float32),
}
total = sum(t.size for t in params.values())
print("parameters:", total, " bytes:", sum(t.nbytes for t in params.values()))

np.savez("model.npz", **params)          # the model file: names, shapes, bytes

loaded = np.load("model.npz")            # a serving process does this once
for name in loaded.files:
    print(name, loaded[name].shape, loaded[name].dtype)`,
      lines: [
        { code: "\"layer1.weight\": np.random.randn(4, 8).astype(np.float32),", say: "A named tensor: a 4-input, 8-output layer's weights, stored as 32-bit floats (4 bytes each)." },
        { code: "print(\"parameters:\", total, \" bytes:\", sum(t.nbytes for t in params.values()))", say: "Count and size: 4×8 + 8 + 8×1 + 1 = 49 parameters, 196 bytes." },
        { code: "np.savez(\"model.npz\", **params)          # the model file: names, shapes, bytes", say: "Serialising: every tensor with its name goes into one file. This is a checkpoint." },
        { code: "loaded = np.load(\"model.npz\")            # a serving process does this once", say: "Loading back. Real libraries do the same with a format like safetensors, straight onto the GPU." },
      ],
      output: "parameters: 49  bytes: 196\nlayer1.weight (4, 8) float32\nlayer1.bias (8,) float32\nout.weight (8, 1) float32\nout.bias (1,) float32",
    },
    useIt: "Treat model files as the valuable artefact they are: version them, store them durably, record which data and config produced them. Before choosing hardware, compute parameters × bytes per parameter. Load once and keep the model resident when serving.",
    takeaways: ["Parameters live in memory as tensors and on disk as a model file of named tensors.", "The file is the model: copy it, version it, protect it.", "File size = parameters × bytes per parameter; this decides the hardware.", "Serving loads once and keeps the tensors in memory."],
    terms: [["model file", "the serialised tensors of a trained model"], ["serialisation", "writing in-memory tensors to bytes on disk"], ["resident", "kept in memory while serving, not reloaded per request"], ["model registry", "a versioned store of model files with their metadata"]],
    reflect: { q: "Why does an 'open-weight' model release consist of files several gigabytes in size rather than source code?", a: "Because the model is its parameters. The architecture code is small and public; the learned tensors are the gigabytes. Publishing the file of weights is publishing the model." },
  },

  "m02-what-do-7b-14b-and-70b-parameters-mean": {
    simple: "7B means seven billion learned numbers inside the model. More parameters can capture more patterns but cost more memory, compute and money to train and run.",
    concept:
      "Model names like 7B, 14B and 70B are parameter counts: **B stands for billion**. A 7B model has about seven billion weights and biases (lesson 2.8), stored as tensors (lesson 2.9) in a file of several gigabytes (lesson 2.10).\n\nThe count is a rough measure of capacity: how much pattern a model can hold. A 70B model can represent finer distinctions, more facts and longer chains of reasoning than a 7B one, trained on the same data. It is not a quality score on its own; a well-trained 7B model often beats a badly trained 70B one, and the amount and quality of training data matters as much as size.\n\nWhat the count does determine directly is cost. Every parameter must be stored, loaded into memory, and used in arithmetic for every token the model reads or writes. Ten times the parameters is roughly ten times the memory and ten times the compute per token.",
    why:
      "Size is the first question when choosing a model because it sets the hardware and the bill before any quality question is asked. A 7B model runs on a laptop; a 70B model needs a server with several GPUs or an API. Teams need a quick way to compare, and the parameter count is that way: coarse but honest about cost.\n\nIt also explains why 'bigger is better' has a limit in practice: the biggest model that fits your budget and latency target is the ceiling, and inside that ceiling, training data and method decide quality.",
    how: [
      "Parameters are counted by adding up the sizes of every weight and bias tensor in the architecture.",
      "For a transformer language model, most come from a few big matrices per layer, repeated across dozens of layers (module 16); 7B means roughly 32 layers of about 200 million parameters each.",
      "Memory to run ≈ parameters × bytes per parameter, plus working memory that grows with the input length.",
      "Compute per token ≈ 2 × parameters floating-point operations; a 70B model does ten times the arithmetic of a 7B one for every token.",
      "Training compute ≈ 6 × parameters × training tokens; large models are trained on trillions of tokens, so training cost grows with both.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Size", "Parameters", "File at 16-bit", "Runs on", "Typical use"],
        rows: [
          ["0.5B", "500 million", "1 GB", "a phone", "autocomplete, simple classification"],
          ["7B", "7 billion", "14 GB", "a laptop with a good GPU, or one server GPU", "assistants for narrow tasks, local tools"],
          ["14B", "14 billion", "28 GB", "one large GPU", "stronger reasoning, still self-hostable"],
          ["70B", "70 billion", "140 GB", "several GPUs or an API", "general assistants, complex tasks"],
          ["400B+", "hundreds of billions", "close to a terabyte", "a cluster; API only for most teams", "frontier models"],
        ],
      },
      caption: "Each step up roughly multiplies memory and per-token cost. Quality rises too, but not in proportion, and training data matters as much.",
    },
    everyday: {
      title: "Engine size",
      text: "A car's engine size tells you about power, fuel use and price, before you know whether the car is any good. A small engine in a well-designed car beats a big engine in a badly designed one on most roads, but the big engine will always burn more fuel. Parameter count is engine size: a cost you pay for every mile, and a ceiling on power, not a guarantee of it.",
    },
    engineering: {
      title: "Picking a size for a support assistant",
      text: "A company needs an assistant that answers questions from its own help articles. The team tests three sizes with the same retrieval setup. The 7B model gets 84 percent on their evaluation set and answers in 0.8 seconds on one GPU. The 70B model gets 91 percent but needs four GPUs and takes 3 seconds. The 14B model gets 89 percent on one large GPU in 1.4 seconds. They ship the 14B model: the last two points of quality from 70B would have cost four times the hardware and twice the wait. The parameter count set the trade-off; the evaluation set made the decision.",
    },
    maths: {
      formula: "memory ≈ P × bytes;   compute per token ≈ 2P FLOPs;   training compute ≈ 6 × P × T",
      meaning: "P is the parameter count, T the number of training tokens, FLOPs are floating-point operations (one multiply or add).",
      worked: [
        "7B at 16-bit: memory ≈ 7 × 10⁹ × 2 bytes = 14 GB.",
        "Compute per generated token: 2 × 7 × 10⁹ = 14 GFLOPs; a GPU doing 100 TFLOPs per second could in principle generate thousands of tokens a second, but memory bandwidth limits it to tens or hundreds.",
        "Training 7B on 2 trillion tokens: 6 × 7 × 10⁹ × 2 × 10¹² = 8.4 × 10²² FLOPs. On 1,000 GPUs at 10¹⁵ FLOPs per second each, that is about 8.4 × 10⁴ seconds of perfect utilisation, roughly a day; in practice weeks, because utilisation is far from perfect.",
        "70B on the same data: ten times all of the above.",
      ],
      note: "These are rules of thumb that get you within a factor of two; module 40 refines them.",
    },
    code: {
      title: "Rough cost of a model from its parameter count",
      lang: "py",
      src: `def model_costs(params_billions, bytes_per_param=2, training_tokens_trillions=2.0):
    p = params_billions * 1e9
    memory_gb = p * bytes_per_param / 1e9
    flops_per_token = 2 * p
    training_flops = 6 * p * training_tokens_trillions * 1e12
    return memory_gb, flops_per_token, training_flops

for size in [0.5, 7, 14, 70]:
    mem, per_token, train = model_costs(size)
    print(f"{size:>4}B  memory {mem:6.1f} GB  per-token {per_token/1e9:6.1f} GFLOPs  training {train:.1e} FLOPs")`,
      lines: [
        { code: "memory_gb = p * bytes_per_param / 1e9", say: "Parameters times bytes each. At 2 bytes a 7B model needs 14 GB just to hold the weights." },
        { code: "flops_per_token = 2 * p", say: "Every parameter is used about twice (a multiply and an add) per token." },
        { code: "training_flops = 6 * p * training_tokens_trillions * 1e12", say: "Training does roughly three times the work of inference per token, over trillions of tokens." },
      ],
      output: " 0.5B  memory    1.0 GB  per-token    1.0 GFLOPs  training 6.0e+21 FLOPs\n   7B  memory   14.0 GB  per-token   14.0 GFLOPs  training 8.4e+22 FLOPs\n  14B  memory   28.0 GB  per-token   28.0 GFLOPs  training 1.7e+23 FLOPs\n  70B  memory  140.0 GB  per-token  140.0 GFLOPs  training 8.4e+23 FLOPs",
    },
    useIt: "Use the parameter count as the first filter when choosing a model: it tells you memory, latency and price. Then evaluate the smallest candidates that fit on your own task before paying for a bigger one. Quote sizes with their precision ('7B at 4-bit') because bytes per parameter change the hardware answer.",
    takeaways: ["7B = seven billion learned parameters, mostly weights.", "More parameters: more capacity, and proportionally more memory and compute per token.", "Size is a cost measure and a capacity ceiling, not a quality score.", "Pick the smallest size that passes your evaluation."],
    terms: [["parameter count", "the total number of learned numbers in a model"], ["B", "billion, in model names"], ["FLOPs", "floating-point operations; a unit of compute"], ["capacity", "how much pattern a model can represent"]],
    reflect: { q: "A 7B model trained on 4 trillion tokens of carefully filtered data scores higher than a 13B model trained on 1 trillion tokens of raw web text. Is that surprising?", a: "No. Parameter count is capacity, not learning. The smaller model saw four times as much, and better, data; the larger model's extra capacity was partly wasted on noise. Size, data quantity and data quality all matter, and size is only the easiest to read from the name." },
  },

  "m02-model-checkpoints-and-learned-parameters": {
    simple: "A checkpoint is a saved snapshot of all the model's parameters at one moment in training, so training can resume, the best version can be kept, and the model can be shared.",
    concept:
      "Training a model can take hours, days or months, and machines fail. A **checkpoint** is a snapshot of everything needed to continue: all the parameter tensors, usually the optimiser's own state (module 5), and the step count. It is written to disk at intervals, every few hundred steps or every epoch.\n\nCheckpoints serve three purposes. Recovery: if the job crashes at hour 30, restart from the hour-29 checkpoint instead of hour 0. Selection: the model at the end of training is not always the best; the checkpoint with the best validation score is the one to keep. Sharing: a checkpoint is a complete, loadable model, so 'releasing a model' means publishing a checkpoint.\n\nThe final checkpoint, stripped of training-only state, is the model file from lesson 2.10. The two words are nearly interchangeable; checkpoint emphasises the moment in training, model file emphasises the artefact.",
    why:
      "Without checkpoints, a single failure wastes the whole run, and the whole run is expensive. Without keeping several, you cannot go back to the point before the model started overfitting (module 4). And without a standard checkpoint format, every team would need every other team's training code to use their models.\n\nCheckpoints also make experiments comparable: the same checkpoint evaluated on the same test set gives the same number, which is what reproducibility means for a model.",
    how: [
      "Every N steps, pause and write all parameter tensors, the optimiser state and the step counter to a file named for the step.",
      "Also evaluate on the validation set and record the score next to the checkpoint.",
      "Keep the last few checkpoints for recovery and the best-scoring one for deployment; delete the rest to save space.",
      "On a crash, load the latest checkpoint and continue from its step.",
      "At the end, export the best checkpoint's parameters alone, without optimiser state, as the model file to serve or share.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "step 0", detail: "random parameters; validation loss 2.90" },
        { label: "step 2,000 · checkpoint", detail: "validation loss 1.42" },
        { label: "step 4,000 · checkpoint", detail: "validation loss 1.11  ← best" },
        { label: "step 6,000 · checkpoint", detail: "validation loss 1.19 (starting to overfit)" },
        { label: "step 6,400 · crash", detail: "restart from step 6,000 checkpoint, not from zero" },
        { label: "export", detail: "step 4,000 parameters → model file" },
      ],
      caption: "Snapshots at intervals. The best one, not the last one, becomes the model.",
    },
    everyday: {
      title: "Saving a long document",
      text: "Writing a thesis over months, you save constantly and keep dated copies. If the laptop dies you lose an hour, not a year. If chapter three went wrong last week, you open last week's copy. When it is finished, you send the final copy, not the folder of drafts. Checkpoints are the dated copies; the model file is the final submission.",
    },
    engineering: {
      title: "Checkpoints on a week-long training run",
      text: "A speech-recognition team trains for seven days on 64 GPUs, checkpointing every hour to shared storage: each checkpoint is 9 GB. Twice during the week a node fails and the job restarts from the last checkpoint, losing under an hour each time. Validation word-error-rate is logged with each checkpoint, and it is lowest at day five, after which it creeps up. They export the day-five checkpoint as the release, 4.5 GB without optimiser state, and keep day four and day six for comparison. Without checkpoints the two failures would have cost two full restarts, a fortnight of GPU time.",
    },
    maths: {
      formula: "checkpoint size ≈ parameters × bytes × (1 + optimiser state factor);   expected loss per failure ≈ interval ÷ 2",
      meaning: "Optimisers like Adam keep two extra numbers per parameter, so a training checkpoint is about three times the model file. The time lost to a crash averages half the checkpoint interval.",
      worked: [
        "A 1.5B model at 4 bytes: model file 6 GB; with Adam's two extra tensors, checkpoint ≈ 18 GB.",
        "Checkpoint every hour: a crash loses on average 30 minutes of compute.",
        "Checkpoint every 10 minutes: average loss 5 minutes, but 6 × 18 GB = 108 GB written per hour; storage and write time become the cost.",
        "Teams pick an interval where (expected loss × crash rate) balances write cost: often 30 to 60 minutes for big runs.",
      ],
    },
    code: {
      title: "Checkpoint, crash, resume, keep the best",
      lang: "py",
      src: `import json, os

def save_checkpoint(step, params, val_loss):
    with open(f"ckpt_{step}.json", "w") as f:
        json.dump({"step": step, "params": params, "val_loss": val_loss}, f)

def latest_checkpoint():
    files = [f for f in os.listdir(".") if f.startswith("ckpt_")]
    if not files:
        return None
    with open(max(files, key=lambda n: int(n[5:-5]))) as f:
        return json.load(f)

ckpt = latest_checkpoint()
step = ckpt["step"] if ckpt else 0               # resume where we stopped
params = ckpt["params"] if ckpt else {"w": 0.0, "b": 0.0}
best = (float("inf"), None)

while step < 6000:
    step += 1
    params["w"] += 0.001                           # pretend this is a training step
    if step % 2000 == 0:
        val_loss = abs(params["w"] - 4.0)          # pretend validation: best near w = 4
        save_checkpoint(step, params, val_loss)
        if val_loss < best[0]:
            best = (val_loss, step)
print("best checkpoint: step", best[1])`,
      lines: [
        { code: "json.dump({\"step\": step, \"params\": params, \"val_loss\": val_loss}, f)", say: "A checkpoint: the step, every parameter, and the validation score recorded next to it." },
        { code: "step = ckpt[\"step\"] if ckpt else 0               # resume where we stopped", say: "On restart, training continues from the saved step instead of zero." },
        { code: "if step % 2000 == 0:", say: "The checkpoint interval: a trade-off between time lost on a crash and storage written." },
        { code: "if val_loss < best[0]:", say: "Track the best checkpoint by validation score. That is the one to export, whatever came later." },
      ],
      output: "best checkpoint: step 4000",
    },
    useIt: "Checkpoint any training run longer than a coffee break, log the validation score with each, keep the best and the last few, and export the best as the model file. When you download an open-weight model, you are downloading someone's chosen checkpoint; the step and data it came from are part of its identity.",
    takeaways: ["A checkpoint is a snapshot of parameters (and optimiser state) at a training step.", "They enable recovery, choosing the best version, and sharing.", "The best validation checkpoint, not the last, becomes the model.", "Training checkpoints are bigger than model files because of optimiser state."],
    terms: [["checkpoint", "a saved snapshot of a model mid-training"], ["optimiser state", "extra per-parameter numbers some optimisers keep (module 5)"], ["resume", "continuing training from a checkpoint"], ["export", "writing a checkpoint's parameters as a serving-ready model file"]],
    reflect: { q: "Your training run finished and the final model scores 71 on validation, but the step-4,000 checkpoint scored 76. Which do you deploy, and what does the gap tell you?", a: "Deploy the step-4,000 checkpoint. The gap says the model overfitted after that point: training kept reducing training loss while validation got worse (module 4). Next run, stop earlier or add regularisation." },
  },
};

export const M02_QUIZ: Quiz[] = [
  {
    q: "A feature 'number of refund requests after purchase' is added to a model that predicts whether a purchase will be refunded. What is the problem?",
    options: ["Too many features slow training", "The feature leaks the label: it is only known after the thing being predicted", "Refunds are not numeric", "It is a hyperparameter"],
    answer: 1,
    why: ["One feature changes nothing about speed.", "Correct. At prediction time, before the purchase is refunded, this feature does not exist; in training it reveals the answer.", "Counts are numeric.", "It is a column of data, not a training setting."],
    reason: true,
  },
  {
    q: "Training accuracy 98%, test accuracy 74%. What happened?",
    options: ["The test set is broken", "The model memorised the training examples instead of learning something general", "The learning rate was too small", "Nothing; 74% is fine"],
    answer: 1,
    why: ["Possible but unlikely; the pattern is classic.", "Correct. A large gap between training and test scores is the signature of memorising, which module 4 calls overfitting.", "A too-small rate gives low scores on both.", "The gap is the problem, whatever the absolute number."],
  },
  {
    q: "A deployed chatbot is corrected by a user. Does its model change?",
    options: ["Yes, immediately", "No; inference uses frozen parameters, and only retraining changes them", "Only if the user is an admin", "Yes, after midnight"],
    answer: 1,
    why: ["Inference adjusts nothing.", "Correct. Learning happens in training; a served model's parameters are frozen until a new model file replaces it.", "Permissions do not change how inference works.", "No."],
  },
  {
    q: "Which is a hyperparameter?",
    options: ["The weight on floor area", "The bias of the output layer", "The learning rate", "A connection strength in layer 3"],
    answer: 2,
    why: ["Set by training: a parameter.", "Set by training: a parameter.", "Correct. You choose it before training; training never changes it.", "Set by training: a parameter."],
  },
  {
    q: "A taxi model has bias £3 and weight £1.80 per km. What does the bias represent?",
    options: ["The price per kilometre", "The fare when the distance is zero", "The maximum fare", "A sign the model is unfair"],
    answer: 1,
    why: ["That is the weight.", "Correct. The bias is the output when all inputs are zero: the fixed starting charge.", "No upper limit exists in a linear model.", "That is a different meaning of the word 'bias'."],
  },
  {
    q: "A batch of 16 greyscale images, each 28 × 28 pixels. What is the tensor shape and how many numbers?",
    options: ["(28, 28), 784", "(16, 28, 28), 12,544", "(16, 784, 3), 37,632", "(28, 28, 16, 3), 37,632"],
    answer: 1,
    why: ["That is one image, not a batch of 16.", "Correct. Batch × height × width = 16 × 28 × 28 = 12,544. Greyscale has no colour dimension.", "No colour channel for greyscale, and 784 is already height × width.", "Wrong order and an invented colour dimension."],
    reason: true,
  },
  {
    q: "Roughly how much memory does a 7B model need just for its weights at 16 bits per parameter?",
    options: ["700 MB", "7 GB", "14 GB", "140 GB"],
    answer: 2,
    why: ["Off by twenty.", "That would be 8 bits per parameter.", "Correct. 7 × 10⁹ × 2 bytes = 14 GB.", "That is a 70B model."],
  },
  {
    q: "Training finished at step 10,000 (validation loss 1.3). The step-6,000 checkpoint had validation loss 1.1. Which goes to production?",
    options: ["Step 10,000, it trained longest", "Step 6,000, it scored best on data the model had not seen", "Average the two", "Neither; retrain"],
    answer: 1,
    why: ["Longer training made it worse here: it overfitted.", "Correct. Keep the checkpoint with the best validation score; that is what checkpoints are for.", "Averaging parameters is a real technique but not the simple answer here.", "A good checkpoint exists; use it, then fix the run next time."],
  },
];

export const M02_EXERCISES: Exercise[] = [
  {
    title: "Design a dataset for delivery-time prediction",
    kind: "think",
    task: "List eight features and the label for a model that predicts how many minutes a food delivery will take. For each feature say where it comes from and whether it is available at the moment the prediction is made. Flag any that would leak the label.",
    hints: ["The prediction is made when the order is placed.", "'Time the rider was assigned' happens after the order is placed."],
    solution: "Label: actual minutes from order to delivery, from the delivery log. Features available at order time: distance restaurant to customer (map), time of day, day of week, restaurant's average prep time over the last 30 days, current number of open orders at the restaurant, number of riders online nearby, weather, order size (item count). Leaks: 'rider assignment time', 'pickup time', 'route taken' all happen after the prediction and must not be features.",
  },
  {
    title: "Compute a prediction and its error by hand",
    kind: "calculate",
    task: "A house model has weights: area £2,050 per m², bedrooms £12,000, km to station −£7,500, and bias £55,000. Compute the prediction for a 110 m², 3-bedroom house 2.2 km from the station. It actually sold for £335,000. What is the error, and did the model guess high or low?",
    hints: ["Multiply each feature by its weight, add them, add the bias.", "error = prediction − actual"],
    solution: "2,050 × 110 = 225,500; 12,000 × 3 = 36,000; −7,500 × 2.2 = −16,500; sum = 245,000; plus bias 55,000 = £300,000. Error = 300,000 − 335,000 = −35,000: the model guessed low by £35,000.",
  },
  {
    title: "Size a model's memory",
    kind: "calculate",
    task: "A model has 32 layers, each with a 4,096 × 4,096 weight matrix and a 4,096 bias, plus an output matrix of 4,096 × 32,000. Count the parameters. How many gigabytes is the model file at 16 bits per parameter? At 4 bits?",
    hints: ["Per layer: 4,096 × 4,096 + 4,096.", "Bytes = parameters × bits ÷ 8."],
    solution: "Per layer: 16,777,216 + 4,096 = 16,781,312; × 32 = 537,001,984. Output: 4,096 × 32,000 = 131,072,000. Total ≈ 668 million parameters. At 16 bits (2 bytes): ≈ 1.34 GB. At 4 bits (0.5 byte): ≈ 0.33 GB. (Real transformer layers have several matrices each; the method is the same.)",
  },
  {
    title: "Split by time and compare",
    kind: "code",
    task: "Write Python that creates 1,000 fake transactions with a 'day' field from 1 to 100 and a label. Split them two ways: randomly 80/20, and by time (days 1–80 train, 81–100 test). Print how many test rows from each split have a 'day' value that also appears in the training set.",
    hints: ["For the time split the answer should be zero.", "Use random.seed so the result is repeatable."],
    solution: "import random\nrandom.seed(1)\nrows = [{'day': random.randint(1, 100), 'label': random.randint(0, 1)} for _ in range(1000)]\nrandom.shuffle(rows)\nrand_train, rand_test = rows[:800], rows[800:]\ntime_train = [r for r in rows if r['day'] <= 80]\ntime_test = [r for r in rows if r['day'] > 80]\ndays_in = lambda train: {r['day'] for r in train}\nprint(sum(r['day'] in days_in(rand_train) for r in rand_test))   # nearly all 200\nprint(sum(r['day'] in days_in(time_train) for r in time_test))   # 0\n\nThe random split tests on days the model saw; the time split tests on the future, which is the honest setting for time-ordered data.",
  },
];
