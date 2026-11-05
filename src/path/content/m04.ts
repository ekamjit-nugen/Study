import type { Exercise, LessonBody, Quiz } from "../types";

// Module 4: How models measure their mistakes. One concept per lesson.
// Keys are lesson slugs: m04-<kebab of the concept title>.

export const M04_BODIES: Record<string, LessonBody> = {
  "m04-prediction-error": {
    simple: "Prediction error is the gap between what the model said and what was true, for one example; everything a model learns from starts as this gap.",
    concept:
      "Lesson 2.4 put predictions next to actual values. The **prediction error** is the difference for one example: predicted minus actual for a number, or 'right or wrong' (and how confidently) for a category. It is the raw material of training and of evaluation.\n\nAn error has a sign and a size. Sign: positive means the model guessed too high, negative too low; for a probability, the gap between the predicted probability and the truth (1 or 0). Size: how far off. Both matter, but differently. For deciding which way to nudge a parameter, the sign is what counts. For judging how good the model is, the size is what counts, and the sign is a nuisance, because a model that is +10 on half the examples and −10 on the other half has an average error of zero and is wrong everywhere.\n\nThat nuisance is why the next lessons square the errors or take their absolute value before averaging: to turn a list of signed gaps into one honest number.",
    why:
      "Without a per-example error there is nothing to learn from and nothing to measure. The error is what connects the model's output to reality, one example at a time. Everything else in this module is a way of summarising a list of these errors into a single number a model can shrink, and the choice of summary changes what the model learns to care about.",
    how: [
      "Predict for one example.",
      "Compare with the actual value from the label.",
      "Record the signed error (for numbers) or the probability gap (for classes).",
      "Repeat for every example in the set; you now have a list of errors.",
      "Summarise the list with a loss function (next lesson) for training, and with metrics for reporting.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Example", "Predicted", "Actual", "Signed error", "Absolute error"],
        rows: [["house 1 (£k)", "300", "312", "−12", "12"], ["house 2 (£k)", "470", "455", "+15", "15"], ["house 3 (£k)", "250", "239", "+11", "11"], ["email A (P(spam))", "0.92", "1 (spam)", "−0.08", "0.08"], ["email B (P(spam))", "0.70", "0 (not spam)", "+0.70", "0.70"]],
      },
      caption: "Signed errors say which way the model leaned; absolute errors say how far. The email rows show that a wrong probability is also an error with a size.",
    },
    everyday: {
      title: "Guessing people's ages",
      text: "At a party you guess ages. Guess 35 for someone who is 41: error −6, you guessed low. Guess 50 for someone who is 44: +6, high. Over the evening, if your errors are mostly negative you flatter people; if they are large in both directions you are simply bad at it. The sign tells you your bias; the size tells you your skill. A model's errors are read the same two ways.",
    },
    engineering: {
      title: "Errors feeding two different pipelines",
      text: "A defect-detection system on a packaging line computes the error for every image it classifies, once the human inspector's verdict arrives. The same list of errors feeds two jobs. The training job uses signed errors to adjust the model nightly. The monitoring dashboard uses absolute errors: average size per hour, worst ten per day, and a plot by camera. When camera 3's errors doubled one Tuesday, the dashboard caught it; the lens was dirty. Same errors, two uses.",
    },
    maths: {
      formula: "eᵢ = ŷᵢ − yᵢ   (regression);   eᵢ = p̂ᵢ − yᵢ with yᵢ ∈ {0, 1}   (classification by probability)",
      meaning: "ŷ (y-hat) is the prediction, y the actual value, p̂ the predicted probability, i the example.",
      worked: [
        "House: predicted 300, actual 312: e = −12 (too low).",
        "Email that was spam (y = 1), predicted 0.92: e = 0.92 − 1 = −0.08. Nearly right.",
        "Email that was not spam (y = 0), predicted 0.70: e = 0.70 − 0 = +0.70. Confidently wrong-ish.",
        "Average of signed errors for three houses [−12, +15, +11] = 14 ÷ 3 ≈ +4.7: the model leans a little high. Average of absolute errors = 38 ÷ 3 ≈ 12.7: typical miss of about £12,700.",
      ],
    },
    code: {
      title: "Signed and absolute errors, two readings",
      lang: "py",
      src: `predicted = [300, 470, 250]
actual    = [312, 455, 239]

signed = [p - a for p, a in zip(predicted, actual)]
absolute = [abs(e) for e in signed]

print("signed:", signed, " mean:", round(sum(signed) / 3, 1))        # direction: leans high?
print("absolute:", absolute, " mean:", round(sum(absolute) / 3, 1))  # size: how far off?`,
      lines: [
        { code: "signed = [p - a for p, a in zip(predicted, actual)]", say: "Prediction minus actual per example. The sign survives." },
        { code: "absolute = [abs(e) for e in signed]", say: "Drop the sign to measure size. This is the first step toward a loss." },
        { code: "print(\"signed:\", signed, \" mean:\", round(sum(signed) / 3, 1))        # direction: leans high?", say: "The mean signed error is the bias: here slightly positive, so the model guesses high on average." },
      ],
      output: "signed: [-12, 15, 11]  mean: 4.7\nabsolute: [12, 15, 11]  mean: 12.7",
    },
    useIt: "Always compute per-example errors and keep them, not just a summary. Plot them, group them, look at the worst. The sign tells you about bias, the size about accuracy, and the pattern about missing features or bad data.",
    takeaways: ["Error = prediction − actual, per example; for classes, the probability gap.", "Sign shows direction (bias); size shows how wrong.", "Signed errors cancel; summaries use squares or absolute values.", "Per-example errors feed both training and monitoring."],
    terms: [["prediction error", "the gap between prediction and truth for one example"], ["signed error", "keeps the direction"], ["absolute error", "the size without direction"], ["bias (of errors)", "the average signed error: a lean high or low"]],
    reflect: { q: "A model's mean signed error is 0.1 and its mean absolute error is 30. What do you know?", a: "It barely leans either way (no systematic bias) but is typically wrong by 30. The errors are large and scattered in both directions. Fixing bias would not help; the model needs more signal (better features or a better shape)." },
  },

  "m04-loss-functions-and-why-models-need-them": {
    simple: "A loss function turns the whole list of errors into one number that says how wrong the model is; training is the search for parameters that make that number small.",
    concept:
      "A model makes thousands of errors, one per example. To improve, it needs a single target to shrink. A **loss function** takes all the predictions and all the actual values and returns one number: the loss. Zero means perfect; larger means worse. Training is the search, by gradient descent (module 5), for the parameters that minimise it.\n\nThe loss is chosen, not given, and the choice decides what 'good' means. Mean squared error punishes big misses far more than small ones. Mean absolute error treats a miss of 10 as exactly twice as bad as a miss of 5. Cross-entropy, for classification, punishes confident wrong probabilities savagely and hesitant ones gently. Pick the loss that matches what the mistake costs in the real world, because the model will become whatever the loss rewards.\n\nTwo requirements make a loss usable for training: it must be a single number, and it must be smooth enough that its derivative with respect to every parameter exists and points somewhere useful.",
    why:
      "Gradient descent needs one function to descend. 'Be accurate' is not a function; 'the average squared error over the training set' is. The loss is the bridge between the goal in words and the maths that can be optimised.\n\nIt also exists to encode priorities. If one kind of mistake is expensive (missing a cancer, declining a good customer), the loss can weigh it more, and the model learns to avoid it. A model trained on the wrong loss can be excellent at the wrong thing.",
    how: [
      "Compute the per-example error for every training example.",
      "Apply the loss's per-example penalty: square it, take its absolute value, or take the negative log of the probability given to the true class.",
      "Average (or sum) the penalties into one number: the loss.",
      "Differentiate the loss with respect to each parameter; step against the gradient.",
      "Track the loss over training on both the training set and the validation set (lesson 4.8).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Loss", "Per-example penalty", "Punishes", "Typical use"],
        rows: [["mean squared error (MSE)", "(ŷ − y)²", "big misses much more than small", "regression; when large errors are very costly"], ["mean absolute error (MAE)", "|ŷ − y|", "every unit of miss equally", "regression; robust to outliers"], ["binary cross-entropy", "−log of the probability given to the truth", "confident wrong probabilities", "two-class classification"], ["categorical cross-entropy", "same, over many classes", "confident wrong probabilities", "multi-class; next-token prediction"]],
      },
      caption: "Four losses, four definitions of 'wrong'. The model becomes whatever its loss rewards.",
    },
    everyday: {
      title: "Scoring a darts game",
      text: "Darts could be scored many ways: distance from the bullseye, number of throws that hit the board, or a bonus for the triple-20. Each scoring rule makes players practise differently. The scoring rule is the loss function. Change it and the same players develop different skills. A model is a player who practises only what the scoring rewards.",
    },
    engineering: {
      title: "The wrong loss for a demand forecast",
      text: "A retailer trained a stock-forecast model with mean squared error. It performed well on average but was systematically high on slow-selling items, because MSE's squaring made it terrified of under-predicting a big seller and relaxed about over-predicting small ones. Warehouses filled with slow stock. Switching to a loss that charged 3× for over-stock and 1× for under-stock (a weighted absolute error matching the real costs) cut excess inventory by 20 percent with the same model and data. The loss, not the model, was the problem.",
    },
    maths: {
      formula: "L(θ) = (1/n) Σᵢ ℓ(ŷᵢ, yᵢ)   where θ is all the parameters and ℓ is the per-example penalty",
      meaning: "The loss L depends on the parameters θ through the predictions ŷ. Averaging over n examples gives one number; training minimises L over θ.",
      worked: [
        "Three houses, errors [−12, +15, +11] (£k).",
        "MSE: (144 + 225 + 121) ÷ 3 = 490 ÷ 3 ≈ 163.3 (£k²).",
        "MAE: (12 + 15 + 11) ÷ 3 ≈ 12.7 (£k).",
        "Change house 2's prediction so its error becomes +45: MSE jumps to (144 + 2,025 + 121) ÷ 3 ≈ 763; MAE rises only to (12 + 45 + 11) ÷ 3 ≈ 22.7. Squaring makes one big miss dominate.",
      ],
    },
    code: {
      title: "Three losses on the same errors",
      lang: "py",
      src: `import math

errors = [-12, 15, 11]                 # regression errors in thousands of pounds
mse = sum(e * e for e in errors) / len(errors)
mae = sum(abs(e) for e in errors) / len(errors)
print("MSE", round(mse, 1), " MAE", round(mae, 1))

# classification: probability given to the true class, per email
p_true = [0.92, 0.30, 0.99]            # second email: the model gave the truth only 0.30
bce = -sum(math.log(p) for p in p_true) / len(p_true)
print("cross-entropy", round(bce, 3))
print("penalties:", [round(-math.log(p), 2) for p in p_true])`,
      lines: [
        { code: "mse = sum(e * e for e in errors) / len(errors)", say: "Square each error, average. Big errors dominate." },
        { code: "mae = sum(abs(e) for e in errors) / len(errors)", say: "Absolute value each error, average. Every unit counts the same." },
        { code: "bce = -sum(math.log(p) for p in p_true) / len(p_true)", say: "For classification: the negative log of the probability the model gave the correct answer. Low probability on the truth means a big penalty." },
        { code: "print(\"penalties:\", [round(-math.log(p), 2) for p in p_true])", say: "0.92 costs 0.08; 0.30 costs 1.2; 0.99 costs 0.01. The hesitant mistake is fifteen times the near-miss." },
      ],
      output: "MSE 163.3  MAE 12.7\ncross-entropy 0.432\npenalties: [0.08, 1.2, 0.01]",
    },
    useIt: "Before training anything, write down what a mistake costs in the real problem, then pick or build the loss that matches. Use MSE when big misses are disproportionately bad, MAE when every unit of miss costs the same or outliers are noisy, cross-entropy for probabilities. Watch the loss curve during training; it is the model's own measure of progress.",
    takeaways: ["A loss function summarises all errors into one number to minimise.", "The choice of loss defines what the model will care about.", "MSE: squares; MAE: absolute; cross-entropy: negative log probability of the truth.", "Match the loss to the real cost of mistakes."],
    terms: [["loss function", "a function from predictions and truths to one number"], ["per-example penalty", "the loss's contribution from one example"], ["minimise", "find the parameters that make the loss smallest"], ["θ (theta)", "shorthand for all the parameters together"]],
    reflect: { q: "Why not train a classifier directly on accuracy, the number everyone reports?", a: "Accuracy is a count of right answers: it jumps in steps and is flat everywhere else, so its derivative is zero almost everywhere and gradient descent gets no direction. Cross-entropy is smooth, rewards being more right by degrees, and lowering it raises accuracy. Train on the smooth loss; report the metric." },
  },

  "m04-mean-squared-error-mse": {
    simple: "Mean squared error averages the squared errors: a smooth loss for predicting numbers that punishes large misses much more than small ones.",
    concept:
      "**Mean squared error** is the standard loss for predicting numbers. For each example, square the error; then average over all examples. Squaring does three things. It removes the sign, so high and low misses both count. It makes the penalty grow with the square of the miss: a miss of 10 costs four times a miss of 5, and a miss of 100 costs ten thousand times a miss of 1. And it makes the loss smooth, with a derivative that is simply proportional to the error, which keeps gradient descent well-behaved.\n\nThe cost of squaring is the units: house-price errors in pounds become a loss in pounds squared, which nobody can picture. The **root mean squared error** (RMSE), the square root of MSE, brings it back to pounds and is what people report. The other cost is sensitivity to outliers: one wildly mislabelled example contributes an enormous squared error and can drag the whole fit toward itself.",
    why:
      "MSE exists because it is the loss whose minimum is the mean: if you had to predict one number for many examples, the value that minimises MSE is their average. That makes it the natural loss when the 'expected value' is what you want. Its smooth, simple derivative (two times the error) makes it the easiest loss to optimise, which is why it is the default for regression and why it appeared in every example of module 2 and 3 without being named.",
    how: [
      "Compute each error: ŷᵢ − yᵢ.",
      "Square each one.",
      "Average over the n examples: that is the MSE.",
      "For a human-readable number, take the square root: RMSE, in the original units.",
      "For training, use the gradient: ∂MSE/∂ŷᵢ = 2(ŷᵢ − yᵢ) ÷ n, which flows back to the parameters.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Error (£k)", "Squared", "Share of total MSE"],
        rows: [["−3", "9", "2%"], ["+5", "25", "5%"], ["−4", "16", "3%"], ["+21", "441", "90%"], ["mean of squares", "122.75", "RMSE = √122.75 ≈ 11.1"]],
      },
      caption: "One miss of 21 contributes 90 percent of the loss. Squaring makes the model obsess over its biggest mistakes.",
    },
    everyday: {
      title: "Parking a car",
      text: "Parking 5 cm from the kerb is fine; 20 cm is sloppy; 80 cm blocks the road. The annoyance does not grow in a straight line with the distance; it grows much faster. If you were training yourself to park, you would care enormously about avoiding the 80 cm days and barely at all about shaving 5 cm to 3. That is a squared-error attitude: big misses matter disproportionately.",
    },
    engineering: {
      title: "RMSE on a delivery-time model, and the outlier problem",
      text: "A delivery team reports RMSE of 4.1 minutes on their test set. When they look at the squared errors, one order dominates: predicted 28 minutes, actual 190, because the rider's phone died and the order was reassigned hours later. That single example contributes more to the MSE than a thousand normal ones, and during training it was pulling predictions upward for everything. They cap errors at 60 minutes for training (a 'Huber' style loss) and treat anything beyond as an operations incident, not a prediction error. RMSE drops to 3.4 and predictions for normal orders improve.",
    },
    maths: {
      formula: "MSE = (1/n) Σᵢ (ŷᵢ − yᵢ)²;   RMSE = √MSE;   ∂MSE/∂ŷᵢ = (2/n)(ŷᵢ − yᵢ)",
      meaning: "n examples; the derivative with respect to a prediction is proportional to its error, so the gradient pushes hardest on the biggest misses.",
      worked: [
        "Errors [−3, +5, −4, +21]: squares [9, 25, 16, 441], sum 491, MSE = 491 ÷ 4 = 122.75.",
        "RMSE = √122.75 ≈ 11.1 £k: a 'typical' miss, inflated by the outlier.",
        "Remove the +21 example: squares [9, 25, 16], MSE = 50 ÷ 3 ≈ 16.7, RMSE ≈ 4.1. One example tripled the reported error.",
        "Gradient on the +21 prediction: (2/4) × 21 = 10.5; on the −3 prediction: −1.5. The outlier gets seven times the push.",
      ],
    },
    code: {
      title: "MSE, RMSE, and who dominates",
      lang: "py",
      src: `import math

errors = [-3, 5, -4, 21]
squares = [e * e for e in errors]
mse = sum(squares) / len(errors)
print("MSE", mse, " RMSE", round(math.sqrt(mse), 1))
print("share of loss per example:", [round(s / sum(squares), 2) for s in squares])

without_outlier = errors[:3]
mse2 = sum(e * e for e in without_outlier) / 3
print("without the 21:", "MSE", round(mse2, 1), " RMSE", round(math.sqrt(mse2), 1))`,
      lines: [
        { code: "squares = [e * e for e in errors]", say: "The per-example penalty: the error squared." },
        { code: "print(\"share of loss per example:\", [round(s / sum(squares), 2) for s in squares])", say: "How much each example contributes. The outlier owns the loss." },
        { code: "print(\"without the 21:\", \"MSE\", round(mse2, 1), \" RMSE\", round(math.sqrt(mse2), 1))", say: "One example removed, the typical error drops from 11 to 4. Check for outliers before trusting RMSE." },
      ],
      output: "MSE 122.75  RMSE 11.1\nshare of loss per example: [0.02, 0.05, 0.03, 0.9]\nwithout the 21: MSE 16.7  RMSE 4.1",
    },
    useIt: "Use MSE as the default regression loss and report RMSE in the original units. Before trusting it, look at the distribution of squared errors: if a few examples dominate, inspect them; they are often data errors. When outliers are genuine and you do not want them to dominate, switch to MAE or a Huber loss.",
    takeaways: ["MSE = average of squared errors; RMSE = its square root, in original units.", "Squaring removes the sign and makes big misses dominate.", "Its gradient is proportional to the error: smooth and easy to optimise.", "Sensitive to outliers; check the biggest squared errors."],
    terms: [["mean squared error (MSE)", "the average of squared errors"], ["root mean squared error (RMSE)", "√MSE, in the original units"], ["outlier", "an example with an unusually large error, often a data problem"], ["Huber loss", "squared for small errors, absolute for large: a compromise"]],
    reflect: { q: "Two models have the same RMSE of 5. Model A's errors are all between −7 and +7; Model B is within ±2 on most examples but off by 40 on a few. Which do you prefer?", a: "It depends on the cost of mistakes. For most products, B's many near-perfect predictions are worth more and its few large misses may be data problems to fix separately. RMSE cannot tell these apart; look at the error distribution, and consider MAE, which would clearly favour B." },
  },

  "m04-mean-absolute-error-mae": {
    simple: "Mean absolute error averages the sizes of the errors: every unit of miss costs the same, so outliers do not dominate, and the number is in the original units.",
    concept:
      "**Mean absolute error** averages the absolute values of the errors. A miss of 10 costs exactly twice a miss of 5, no more. The loss is already in the original units (pounds, minutes), so it needs no square root and reads as 'the typical miss'.\n\nBecause it does not square, MAE is **robust**: one wild example contributes its size, not its size squared, and cannot hijack the fit. The value that minimises MAE for a set of numbers is their median, not their mean, which is why MAE-trained models predict 'the middle outcome' rather than 'the average outcome'; for skewed data, like delivery times with a long tail of late orders, that is often what you want.\n\nIts drawback is the kink at zero: the derivative of |e| is +1 for positive errors and −1 for negative ones, with no information about how far off. Gradient descent gets the direction but not the urgency, so it converges more slowly and can oscillate near the minimum.",
    why:
      "MSE's obsession with big misses is sometimes wrong: when outliers are data errors, when every unit of miss really costs the same (a late minute is a late minute), or when the data has a long tail and the median is the honest central prediction. MAE exists for those cases. It also gives a number everyone understands without conversion, which is why it is a common reporting metric even when MSE is the training loss.",
    how: [
      "Compute each error: ŷᵢ − yᵢ.",
      "Take the absolute value of each.",
      "Average over the n examples: that is the MAE, in original units.",
      "For training, the gradient with respect to a prediction is the sign of its error divided by n: +1/n if too high, −1/n if too low.",
      "If the kink causes slow or unstable training, use Huber loss: squared near zero, absolute beyond a threshold.",
    ],
    visual: {
      kind: "compare",
      left: { title: "MSE on errors [−3, 5, −4, 21]", points: ["squares [9, 25, 16, 441]", "loss 122.75, RMSE 11.1", "the 21 owns 90% of the loss", "gradient pushes 7× harder on the outlier"] },
      right: { title: "MAE on the same errors", points: ["sizes [3, 5, 4, 21]", "loss 8.25 (already in £k)", "the 21 owns 64% of the loss", "gradient is ±1 for every example, regardless of size"] },
      caption: "Same errors, two attitudes. MAE is calmer about the outlier and reads in real units; MSE has the smoother gradient.",
    },
    everyday: {
      title: "A taxi meter versus a speeding fine",
      text: "A taxi charges per kilometre: twice the distance, twice the cost, no more. That is absolute error. A speeding fine escalates: a little over costs a little, a lot over costs a licence. That is squared error. Which is right depends on the situation. For 'how late was the parcel', every extra minute usually costs the same, so MAE is the honest measure.",
    },
    engineering: {
      title: "MAE for a long-tailed forecast",
      text: "A hospital predicts how long each A&E patient will wait. Waits are skewed: most are 30 to 90 minutes, a few are six hours. Trained with MSE, the model's predictions were dragged upward by the long waits and most patients were told a longer wait than they experienced. Retrained with MAE, the model predicts the median wait, which matches what most patients see, and the display changed to 'about 45 minutes; some waits are much longer'. MAE on the test set: 18 minutes, a number the ward manager could read directly.",
    },
    maths: {
      formula: "MAE = (1/n) Σᵢ |ŷᵢ − yᵢ|;   ∂MAE/∂ŷᵢ = sign(ŷᵢ − yᵢ) ÷ n",
      meaning: "sign() is +1 for positive, −1 for negative. The derivative carries direction but not magnitude.",
      worked: [
        "Errors [−3, +5, −4, +21]: sizes [3, 5, 4, 21], sum 33, MAE = 33 ÷ 4 = 8.25 £k.",
        "Remove the outlier: [3, 5, 4], MAE = 4.0. The outlier doubled the MAE; under MSE it tripled the RMSE.",
        "Gradients: for the +21 prediction, +1/4; for the −3 prediction, −1/4. Same size, opposite direction. The outlier gets no extra push.",
        "Median property: predicting one number for waits [30, 40, 50, 60, 360]: MSE is minimised by the mean 108; MAE by the median 50. Most patients see 50.",
      ],
    },
    code: {
      title: "MAE versus MSE, and the median property",
      lang: "py",
      src: `errors = [-3, 5, -4, 21]
mae = sum(abs(e) for e in errors) / len(errors)
mse = sum(e * e for e in errors) / len(errors)
print("MAE", mae, " MSE", mse)

waits = [30, 40, 50, 60, 360]
def mae_if_predict(c): return sum(abs(c - w) for w in waits) / len(waits)
def mse_if_predict(c): return sum((c - w) ** 2 for w in waits) / len(waits)

best_mae = min(range(0, 400), key=mae_if_predict)
best_mse = min(range(0, 400), key=mse_if_predict)
print("one number that minimises MAE:", best_mae, " MSE:", best_mse)`,
      lines: [
        { code: "mae = sum(abs(e) for e in errors) / len(errors)", say: "Absolute value, then average. Already in the original units." },
        { code: "best_mae = min(range(0, 400), key=mae_if_predict)", say: "Search for the single prediction with the smallest MAE: it is the median, 50." },
        { code: "best_mse = min(range(0, 400), key=mse_if_predict)", say: "The same search for MSE lands on the mean, 108, pulled up by the one six-hour wait." },
      ],
      output: "MAE 8.25  MSE 122.75\none number that minimises MAE: 50  MSE: 108",
    },
    useIt: "Choose MAE when every unit of miss costs the same, when outliers are noise, or when the median is the honest prediction for skewed data. Report it even when training on MSE, because people understand it. If MAE training is slow or jittery, use Huber loss for the best of both.",
    takeaways: ["MAE = average absolute error, in original units.", "Robust to outliers; minimised by the median.", "Gradient is only a sign: direction without urgency.", "Huber loss combines MSE near zero with MAE far from it."],
    terms: [["mean absolute error (MAE)", "the average size of the errors"], ["robust", "not dominated by a few extreme examples"], ["median", "the middle value; what MAE-trained models predict"], ["sign function", "+1 or −1 depending on the sign of its input"]],
    reflect: { q: "Your model's MAE is 4 minutes but its RMSE is 12 minutes. What does the gap tell you?", a: "RMSE far above MAE means a few errors are very large while most are small: a long tail of big misses. Look at those examples. They are either data problems (fix the data) or a real rare failure mode (decide whether the product must handle it)." },
  },

  "m04-binary-cross-entropy": {
    simple: "Binary cross-entropy is the loss for yes/no predictions made as probabilities: it charges the negative log of the probability the model gave to the true answer, so confident mistakes are expensive.",
    concept:
      "A classifier that says 'spam with probability 0.92' needs a loss that understands probabilities. **Binary cross-entropy** (also called log loss) looks at the probability the model assigned to whatever actually happened and charges −log of it. Gave the truth 0.99: cost 0.01. Gave it 0.5: cost 0.69. Gave it 0.01: cost 4.6. The penalty climbs gently for hesitation and steeply for confident wrongness; a probability of exactly zero on the truth would cost infinity.\n\nFor a label y that is 1 or 0 and a predicted probability p, the per-example loss is −[y·log p + (1 − y)·log(1 − p)]: only one of the two terms is active, picking out log p when the truth is 1 and log(1 − p) when it is 0. Averaged over the set, it is the training loss for nearly every two-class model, from spam filters to medical screening.\n\nIt has a beautiful property: minimising it makes the model's probabilities honest. A model trained to low cross-entropy says 0.9 only when it is right about nine times in ten.",
    why:
      "Squared error on a probability treats 0.9-when-wrong as only slightly worse than 0.6-when-wrong. Real decisions disagree: a model that is confidently wrong causes expensive mistakes, and a model that hedges at 0.6 at least flags its doubt. Cross-entropy encodes that: confidence is rewarded only when earned. It also has a smooth, well-shaped gradient (the error p − y, nothing more) when paired with the sigmoid output (module 7), which makes training stable.",
    how: [
      "The model outputs a probability p for the positive class, usually via a sigmoid.",
      "If the true label is 1, the penalty is −log p. If it is 0, the penalty is −log(1 − p).",
      "Average the penalties over all examples.",
      "Gradient with respect to the model's raw score (before the sigmoid) is simply p − y: push the probability toward the truth, proportionally to the gap.",
      "Report alongside it a metric people read, such as accuracy or precision and recall (module 37).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Truth", "Model's probability of spam", "Probability given to the truth", "Penalty −log", "Reading"],
        rows: [["spam", "0.99", "0.99", "0.01", "confident and right: nearly free"], ["spam", "0.60", "0.60", "0.51", "right but hesitant"], ["not spam", "0.60", "0.40", "0.92", "wrong but hedged"], ["not spam", "0.99", "0.01", "4.61", "confident and wrong: very expensive"]],
      },
      caption: "The same 0.99 costs almost nothing when right and almost five when wrong. Confidence is a bet.",
    },
    everyday: {
      title: "A weather forecaster's reputation",
      text: "A forecaster who says '99 percent chance of sun' and it rains loses far more credibility than one who said '60 percent'. Over a season, the forecaster whose stated chances match what happens is the one you trust. Cross-entropy is that reputation system turned into a number: it is lowest for the forecaster whose probabilities are honest, and it savages confident misses.",
    },
    engineering: {
      title: "Screening for a rare disease",
      text: "A model screens scans for a condition found in 2 percent of patients. Trained with cross-entropy, it outputs honest probabilities, so the hospital can set a low threshold (flag anything above 0.1) to catch nearly every real case at the cost of more false alarms for a radiologist to clear. When the team tried training on accuracy-like targets, the model learned to say 'healthy' for everyone and scored 98 percent. Cross-entropy made the 2 percent expensive to miss, because giving a real case a probability of 0.02 costs −log(0.02) ≈ 3.9 each time.",
    },
    maths: {
      formula: "BCE = −(1/n) Σᵢ [yᵢ log pᵢ + (1 − yᵢ) log(1 − pᵢ)];   per example with truth 1: −log p;  truth 0: −log(1 − p)",
      meaning: "y is the true label (1 or 0), p the predicted probability of 1, log the natural logarithm. Only one term is active per example.",
      worked: [
        "Spam (y = 1), p = 0.92: −log 0.92 = 0.083.",
        "Not spam (y = 0), p = 0.70: −log(1 − 0.70) = −log 0.30 = 1.204.",
        "Spam (y = 1), p = 0.99: −log 0.99 = 0.010.",
        "Average over the three: (0.083 + 1.204 + 0.010) ÷ 3 = 0.432. The one hedged mistake is 93 percent of the loss.",
        "Had the second email been predicted at 0.99: −log 0.01 = 4.605; the average would be 1.566.",
      ],
    },
    code: {
      title: "Binary cross-entropy, example by example",
      lang: "py",
      src: `import math

def bce_one(p, y):
    p = min(max(p, 1e-12), 1 - 1e-12)          # never take log of exactly 0
    return -(y * math.log(p) + (1 - y) * math.log(1 - p))

cases = [(0.92, 1), (0.70, 0), (0.99, 1), (0.99, 0)]
for p, y in cases:
    print(f"p={p:.2f} truth={y}  penalty={bce_one(p, y):.3f}")

batch = cases[:3]
print("average:", round(sum(bce_one(p, y) for p, y in batch) / len(batch), 3))`,
      lines: [
        { code: "p = min(max(p, 1e-12), 1 - 1e-12)          # never take log of exactly 0", say: "Clamping: log(0) is minus infinity. Every library does this quietly." },
        { code: "return -(y * math.log(p) + (1 - y) * math.log(1 - p))", say: "The formula. When y = 1 the second term vanishes; when y = 0 the first does." },
        { code: "cases = [(0.92, 1), (0.70, 0), (0.99, 1), (0.99, 0)]", say: "The last case is the confident mistake: the same 0.99 that was nearly free when right." },
      ],
      output: "p=0.92 truth=1  penalty=0.083\np=0.70 truth=0  penalty=1.204\np=0.99 truth=1  penalty=0.010\np=0.99 truth=0  penalty=4.605\naverage: 0.432",
    },
    useIt: "Use binary cross-entropy for any two-class model that outputs a probability. It trains honest probabilities, which lets you choose thresholds from costs afterwards. Check calibration on the test set (does 0.8 mean 80 percent?). For heavily imbalanced classes, weight the rare class's term so missing it costs more.",
    takeaways: ["Per example: −log of the probability given to the truth.", "Gentle on hesitation, brutal on confident mistakes.", "Trains honest, calibrated probabilities.", "Gradient on the raw score is p − y: simple and stable with a sigmoid."],
    terms: [["binary cross-entropy / log loss", "the loss −log p(truth) for two-class probabilities"], ["calibrated", "stated probabilities match observed frequencies"], ["clamping", "keeping p away from exactly 0 and 1 before taking logs"], ["class weighting", "scaling a class's loss term to make its mistakes costlier"]],
    reflect: { q: "A model outputs 0.5 for every email. What is its cross-entropy, and what does that number mean as a baseline?", a: "−log 0.5 = 0.693 for every example, so the average is 0.693. That is the loss of knowing nothing. A trained model must beat 0.693 to have learned anything; a loss above it means the model is worse than a coin." },
  },

  "m04-categorical-cross-entropy": {
    simple: "Categorical cross-entropy extends log loss to many classes: the model gives a probability to every class, and the loss is the negative log of the probability it gave to the correct one.",
    concept:
      "When there are more than two answers (cat, dog, bird; or any of 50,000 tokens), the model outputs a whole probability distribution: one number per class, summing to 1, produced by softmax (module 7). **Categorical cross-entropy** charges −log of the probability assigned to the correct class and ignores the rest. If the truth is 'bird' and the model gave bird 0.2, the penalty is −log 0.2 = 1.61, regardless of how the other 0.8 was spread.\n\nThis is the loss that trains language models. For each position in the text, the correct next token is the label, the model's distribution over the vocabulary is the prediction, and the loss is −log p(correct token). A loss of 2.3 means the model gives the true next token about e⁻²·³ ≈ 10 percent on average; perplexity (module 14) is exactly e raised to this loss.\n\nLike its binary cousin, it rewards honest confidence and punishes confident error, and its gradient on the raw scores is the clean p − y vector: push the correct class up, all others down, in proportion.",
    why:
      "Multi-class problems need a loss that works on a distribution, not a single probability. Squared error between two distributions does not punish the right things. Categorical cross-entropy looks only at the truth's probability, which is exactly what matters, and it pairs with softmax to give a gradient that is simple and well-scaled no matter how many classes there are, including fifty thousand tokens.",
    how: [
      "The model outputs a probability for every class (softmax over its raw scores).",
      "Find the probability it gave to the correct class.",
      "The penalty is −log of that probability.",
      "Average over examples (or over token positions for a language model).",
      "Gradient on the raw scores: predicted distribution minus the one-hot truth; the correct class is pushed up, the rest down.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model's distribution (cat, dog, bird)", "Truth", "p(truth)", "Penalty"],
        rows: [["0.70, 0.20, 0.10", "cat", "0.70", "0.36"], ["0.70, 0.20, 0.10", "bird", "0.10", "2.30"], ["0.34, 0.33, 0.33", "cat", "0.34", "1.08 (knows nothing)"], ["0.98, 0.01, 0.01", "dog", "0.01", "4.61 (confidently wrong)"]],
      },
      caption: "Only the truth's probability matters. The same distribution costs 0.36 or 2.30 depending on what was true.",
    },
    everyday: {
      title: "A multiple-choice exam with partial credit",
      text: "Imagine an exam where you spread 100 points across the four options for each question, and your score is based on how many points you put on the right one. Putting all 100 on the right answer is perfect; splitting 25 each is a guess; putting 100 on a wrong answer is a disaster. The scoring rule that makes honest confidence the best strategy is exactly cross-entropy.",
    },
    engineering: {
      title: "The training loss of a language model",
      text: "A team pretraining a language model watches one number: the average cross-entropy per token. It starts near log(50,000) ≈ 10.8, the loss of a uniform guess over the vocabulary, and falls to about 2.0 over weeks. At 2.0 the model assigns the true next token e⁻² ≈ 13.5 percent on average, which sounds low until you remember that many positions have several reasonable continuations. The same number, exponentiated, is reported as perplexity ≈ 7.4. Every 'we trained a better model' claim is a lower average −log p(next token).",
    },
    maths: {
      formula: "CCE = −(1/n) Σᵢ log p_i(yᵢ)   where p_i(yᵢ) is the probability example i's model output gave to its true class;   perplexity = e^CCE",
      meaning: "For each example only the truth's probability enters. Perplexity turns the loss into 'how many equally likely options the model is effectively choosing between'.",
      worked: [
        "Distribution (0.70, 0.20, 0.10), truth cat: −log 0.70 = 0.357.",
        "Same distribution, truth bird: −log 0.10 = 2.303.",
        "Uniform over 3 classes, any truth: −log(1/3) = 1.099. Uniform over 50,000 tokens: −log(1/50,000) ≈ 10.82.",
        "A language model with average loss 2.0 has perplexity e² ≈ 7.39: on average as uncertain as choosing among 7.4 equally likely tokens.",
      ],
    },
    code: {
      title: "Categorical cross-entropy over a distribution",
      lang: "py",
      src: `import math

classes = ["cat", "dog", "bird"]

def cce_one(dist, truth):
    p = max(dist[classes.index(truth)], 1e-12)
    return -math.log(p)

print(round(cce_one([0.70, 0.20, 0.10], "cat"), 3))
print(round(cce_one([0.70, 0.20, 0.10], "bird"), 3))
print(round(cce_one([1/3, 1/3, 1/3], "dog"), 3))        # knows nothing

vocab = 50_000
print("uniform over the vocabulary:", round(-math.log(1 / vocab), 2))
print("perplexity at loss 2.0:", round(math.exp(2.0), 2))`,
      lines: [
        { code: "p = max(dist[classes.index(truth)], 1e-12)", say: "Pick out the probability given to the correct class; the other classes are ignored." },
        { code: "return -math.log(p)", say: "The penalty: negative log of that one probability." },
        { code: "print(\"uniform over the vocabulary:\", round(-math.log(1 / vocab), 2))", say: "The loss of a language model that knows nothing: where pretraining starts." },
        { code: "print(\"perplexity at loss 2.0:\", round(math.exp(2.0), 2))", say: "Loss exponentiated: 'effectively choosing among 7.4 tokens'." },
      ],
      output: "0.357\n2.303\n1.099\nuniform over the vocabulary: 10.82\nperplexity at loss 2.0: 7.39",
    },
    useIt: "Use categorical cross-entropy for any multi-class model with a softmax output, including every language model. Read its value against the know-nothing baseline log(number of classes). Report perplexity for language models. Watch for label noise: a mislabelled example forces the model to give high probability to the wrong class and costs a lot.",
    takeaways: ["Penalty = −log of the probability given to the correct class; other classes are ignored.", "Baseline: log(number of classes) is the loss of a uniform guess.", "It is the training loss of language models; perplexity = e^loss.", "Gradient on raw scores: predicted distribution minus one-hot truth."],
    terms: [["categorical cross-entropy", "multi-class log loss"], ["one-hot", "a vector with 1 at the true class and 0 elsewhere"], ["softmax", "the function that turns raw scores into a distribution (module 7)"], ["perplexity", "e to the power of the average cross-entropy"]],
    reflect: { q: "A language model's loss drops from 3.0 to 2.9. In perplexity terms, how much did it improve, and why is a small loss change meaningful?", a: "Perplexity from e³ ≈ 20.1 to e²·⁹ ≈ 18.2: the model is effectively choosing among two fewer options at every token. Because the loss is a log, a drop of 0.1 is a 10 percent improvement in the probability it gives the true token, at every position of every text." },
  },

  "m04-loss-vs-accuracy": {
    simple: "Loss is the smooth number training minimises; accuracy is the share of correct answers people report. They usually move together but can disagree, and only one of them can be trained on.",
    concept:
      "Two numbers describe a classifier and they are often confused. The **loss** (cross-entropy) is what training minimises: it uses the probabilities and is smooth. **Accuracy** is what people report: the fraction of examples where the most likely class was the correct one. It uses only the final decision and ignores how confident it was.\n\nThey can disagree. A model that gives the correct class 0.51 on every example has 100 percent accuracy and a mediocre loss of 0.67. A model that is right with 0.99 on 90 percent of examples and wrong with 0.99 on the other 10 percent has 90 percent accuracy and a terrible loss of about 0.46 from the confident mistakes. Loss sees confidence; accuracy does not.\n\nAccuracy also cannot be trained on directly: it changes in jumps when a prediction crosses the decision line and is flat otherwise, so its gradient is zero almost everywhere. Training needs the loss; reporting needs the metric; good practice tracks both.",
    why:
      "Accuracy is what the business understands, but it hides confidence, hides which class is being got wrong, and is misleading when classes are imbalanced: 98 percent accuracy on a 2 percent disease is achieved by saying 'healthy' to everyone. Loss is the honest signal of how well the model's probabilities match reality, and it is the only one of the two that gradient descent can use. Knowing which number to look at for which purpose avoids both false alarms and false comfort.",
    how: [
      "Train on the loss: it is smooth and rewards better probabilities, not just correct decisions.",
      "After each epoch, compute both the loss and the accuracy on the validation set.",
      "Expect them to move together early. Later, watch for loss rising while accuracy holds: the model is becoming over-confident on mistakes.",
      "Report accuracy only with context: the class balance, and better still precision and recall per class (module 37).",
      "Choose the decision threshold using the probabilities, not the default 0.5, when the costs of mistakes differ.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Loss (cross-entropy)", points: ["uses the probabilities", "smooth; has a gradient", "punishes confident mistakes", "what training minimises", "hard for people to interpret"] },
      right: { title: "Accuracy", points: ["uses only the decision", "jumps; gradient zero almost everywhere", "blind to confidence", "what people report", "misleading with imbalanced classes"] },
      caption: "Train on the left, report the right, watch both.",
    },
    everyday: {
      title: "Passing an exam versus understanding the subject",
      text: "Two students both score 70 percent. One got each right answer by solid reasoning and knew which questions they were unsure of. The other guessed confidently and happened to land on 70. Same accuracy; the first has much lower 'loss', and will do far better on the next exam. A teacher who only looks at the score cannot tell them apart; one who looks at the working can.",
    },
    engineering: {
      title: "The accuracy trap on an imbalanced dataset",
      text: "A payments team celebrates a fraud model with 99.6 percent accuracy, until someone notes that 99.7 percent of transactions are honest: a model that flags nothing scores higher. On the loss, the model is barely better than the baseline. They switch their dashboard to cross-entropy, precision and recall on the fraud class, and the picture changes: the model catches 40 percent of fraud with 70 percent precision, a useful but modest result that accuracy had disguised as near-perfection.",
    },
    maths: {
      formula: "accuracy = (number correct) ÷ n;   loss = −(1/n) Σ log p(truth)",
      meaning: "Accuracy counts decisions; loss sums log-probabilities. Two models with equal accuracy can have very different losses.",
      worked: [
        "Model A: 10 examples, all correct, each with p(truth) = 0.51. Accuracy 100%. Loss = −log 0.51 = 0.673.",
        "Model B: 9 correct at p = 0.99, 1 wrong with p(truth) = 0.01. Accuracy 90%. Loss = (9 × 0.010 + 4.605) ÷ 10 = 0.470.",
        "B has lower loss despite lower accuracy: it is right confidently most of the time. A is right by a whisker every time.",
        "Imbalanced: 2% positive. 'Always negative' accuracy = 98%; its loss, giving the positives p = 0.02: 0.98 × (−log 0.98) + 0.02 × (−log 0.02) = 0.0198 + 0.0782 = 0.098. Low loss and high accuracy, and useless, because it never finds a positive: this is why precision and recall exist.",
      ],
    },
    code: {
      title: "Same accuracy, different loss",
      lang: "py",
      src: `import math

def loss_and_accuracy(preds):
    # preds: list of (probability given to the truth, was the top class correct?)
    loss = sum(-math.log(p) for p, _ in preds) / len(preds)
    acc = sum(1 for _, correct in preds if correct) / len(preds)
    return round(loss, 3), acc

model_a = [(0.51, True)] * 10
model_b = [(0.99, True)] * 9 + [(0.01, False)]
model_c = [(0.90, True)] * 10

for name, m in [("A", model_a), ("B", model_b), ("C", model_c)]:
    print(name, "loss, accuracy =", loss_and_accuracy(m))`,
      lines: [
        { code: "loss = sum(-math.log(p) for p, _ in preds) / len(preds)", say: "Loss reads the probabilities." },
        { code: "acc = sum(1 for _, correct in preds if correct) / len(preds)", say: "Accuracy reads only whether the decision was right." },
        { code: "model_a = [(0.51, True)] * 10", say: "Always barely right: perfect accuracy, poor loss." },
        { code: "model_b = [(0.99, True)] * 9 + [(0.01, False)]", say: "Confidently right nine times, confidently wrong once: lower accuracy, better loss than A." },
      ],
      output: "A loss, accuracy = (0.673, 1.0)\nB loss, accuracy = (0.47, 0.9)\nC loss, accuracy = (0.105, 1.0)",
    },
    useIt: "Train on cross-entropy; monitor both loss and accuracy on the validation set; report accuracy only next to the class balance and, for anything imbalanced, precision and recall. If validation loss rises while accuracy is flat, the model is getting over-confident: stop training or regularise.",
    takeaways: ["Loss uses probabilities and is smooth; accuracy uses decisions and jumps.", "Only loss can be trained on; accuracy is reported.", "Equal accuracy can hide very different confidence and loss.", "With imbalanced classes, accuracy misleads; use per-class metrics."],
    terms: [["accuracy", "share of examples whose top class was correct"], ["metric", "a number reported to people, not necessarily trainable"], ["class imbalance", "one class far more common than another"], ["over-confidence", "high probabilities on wrong answers; rising loss at flat accuracy"]],
    reflect: { q: "During training, validation accuracy stays at 92 percent for ten epochs while validation loss climbs from 0.25 to 0.40. What is happening?", a: "The model is still making the same decisions but is becoming more extreme in its probabilities, including on the examples it gets wrong. That is over-confidence, an early form of overfitting (lesson 4.9). Stop at the epoch with the lowest validation loss." },
  },

  "m04-training-loss-vs-validation-loss": {
    simple: "Training loss is measured on the examples the model learns from; validation loss on examples it never trains on. Their gap over time tells you whether the model is learning or memorising.",
    concept:
      "Lesson 2.2 split the data. This lesson uses the split as a diagnostic. After each epoch, compute the loss twice: on the training set (**training loss**) and on the held-out validation set (**validation loss**). Plot both against the epoch number. That pair of curves is the most informative picture in machine learning.\n\nEarly on, both fall: the model is learning patterns that hold in both sets. At some point the validation loss stops falling and starts rising while the training loss keeps falling: the model has run out of general patterns and is now fitting the training set's particular quirks and noise. The epoch where validation loss is lowest is the best model (lesson 2.12's checkpoint); the widening gap afterwards is overfitting, the next lesson's subject.\n\nIf both curves are high and flat, the model has not learned enough: it is too simple, too briefly trained, or the features lack signal.",
    why:
      "Training loss alone is a liar: it always improves with more training, because that is what training does. Only the validation loss says whether the improvement is real. The two curves together separate three situations that feel identical from inside the training loop: learning well, learning nothing, and memorising. Without the second curve you cannot tell when to stop or whether the model will work in the world.",
    how: [
      "Hold out a validation set before training (10 to 20 percent, or by time).",
      "After every epoch (or every N steps), compute the average loss on the full training set and on the validation set without updating any parameters.",
      "Log both and plot them.",
      "Read the curves: both falling means keep going; validation flat or rising while training falls means stop (early stopping) and keep the best checkpoint.",
      "Act on the shape: a large gap calls for regularisation, more data or a smaller model; both high calls for a bigger model, more features or longer training.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Epoch", "Training loss", "Validation loss", "Gap", "Reading"],
        rows: [["1", "1.80", "1.85", "0.05", "both high: just starting"], ["5", "0.90", "0.95", "0.05", "learning general patterns"], ["10", "0.55", "0.62", "0.07", "still improving"], ["15", "0.38", "0.58", "0.20", "validation bottoms out ← best checkpoint"], ["20", "0.25", "0.66", "0.41", "memorising: validation rising"], ["30", "0.12", "0.81", "0.69", "badly overfitted"]],
      },
      caption: "Training loss falls forever; validation loss turns at epoch 15. Everything after that is memorising.",
    },
    everyday: {
      title: "Practising with an answer key",
      text: "A student practising from one set of past papers, with the answers to hand, gets better at those papers every week. Whether they are learning the subject or memorising those papers only shows when they try a new paper. If new-paper scores stop improving while old-paper scores keep rising, the extra weeks were spent memorising. The new paper is the validation set, and the moment to stop is when it stops improving.",
    },
    engineering: {
      title: "Early stopping on a recommendation model",
      text: "A streaming service trains its ranking model for 40 epochs by default. Plotting both losses, the team finds validation loss bottoms at epoch 9 and is 15 percent worse by epoch 40. They add early stopping: training halts when validation loss has not improved for three consecutive epochs, and the best checkpoint is kept. Training time drops by three-quarters and the deployed model's click-through rate rises, because it was never the epoch-40 model that was best. The curves had been there all along; nobody had plotted them.",
    },
    maths: {
      formula: "gap(t) = L_val(t) − L_train(t);   best epoch t* = argmin_t L_val(t);   stop when L_val has not improved for k epochs (patience k)",
      meaning: "t is the epoch. The gap grows during overfitting. Argmin picks the epoch with the lowest validation loss.",
      worked: [
        "From the table: gap at epoch 5 is 0.05, at epoch 15 is 0.20, at epoch 30 is 0.69. Widening steadily after epoch 10.",
        "Lowest validation loss: 0.58 at epoch 15. That checkpoint is deployed.",
        "With patience 3: validation at 16, 17, 18 is worse than 0.58, so training stops at 18 and the epoch-15 checkpoint is restored.",
        "Continuing to epoch 30 would have produced a model with training loss 0.12 (looks wonderful) and validation 0.81 (40 percent worse than the best).",
      ],
    },
    code: {
      title: "Reading two curves and stopping early",
      lang: "py",
      src: `train_loss = [1.80, 1.40, 1.10, 0.90, 0.75, 0.65, 0.55, 0.48, 0.42, 0.38, 0.33, 0.29, 0.25, 0.21, 0.18]
val_loss   = [1.85, 1.46, 1.17, 0.95, 0.80, 0.70, 0.62, 0.59, 0.58, 0.58, 0.60, 0.63, 0.66, 0.70, 0.74]

best_epoch, best_val, since_best = None, float("inf"), 0
patience = 3
for epoch, (tr, va) in enumerate(zip(train_loss, val_loss), start=1):
    if va < best_val:
        best_val, best_epoch, since_best = va, epoch, 0
    else:
        since_best += 1
    print(f"epoch {epoch:>2}  train {tr:.2f}  val {va:.2f}  gap {va - tr:+.2f}")
    if since_best >= patience:
        print(f"stopping: no improvement for {patience} epochs; best was epoch {best_epoch} (val {best_val})")
        break`,
      lines: [
        { code: "val_loss   = [1.85, 1.46, 1.17, 0.95, 0.80, 0.70, 0.62, 0.59, 0.58, 0.58, 0.60, 0.63, 0.66, 0.70, 0.74]", say: "The validation curve: falls, bottoms at 0.58, then rises. The training curve below it never stops falling." },
        { code: "if va < best_val:", say: "Track the best validation loss and its epoch: that checkpoint is the model." },
        { code: "if since_best >= patience:", say: "Early stopping: a few epochs without improvement and training ends. Patience avoids stopping on a single noisy epoch." },
      ],
      output: "epoch  1  train 1.80  val 1.85  gap +0.05\nepoch  2  train 1.40  val 1.46  gap +0.06\nepoch  3  train 1.10  val 1.17  gap +0.07\nepoch  4  train 0.90  val 0.95  gap +0.05\nepoch  5  train 0.75  val 0.80  gap +0.05\nepoch  6  train 0.65  val 0.70  gap +0.05\nepoch  7  train 0.55  val 0.62  gap +0.07\nepoch  8  train 0.48  val 0.59  gap +0.11\nepoch  9  train 0.42  val 0.58  gap +0.16\nepoch 10  train 0.38  val 0.58  gap +0.20\nepoch 11  train 0.33  val 0.60  gap +0.27\nepoch 12  train 0.29  val 0.63  gap +0.34\nstopping: no improvement for 3 epochs; best was epoch 9 (val 0.58)",
    },
    useIt: "Always log both losses and plot them; it costs nothing and tells you when to stop and what to fix. Use early stopping with a patience of a few epochs and keep the best validation checkpoint. Treat a widening gap as the signal to regularise, and two high flat curves as the signal to add capacity or features.",
    takeaways: ["Training loss always falls; validation loss says whether learning is real.", "The best model is at the lowest validation loss, not the end of training.", "A widening gap is memorising; two high flat curves are underfitting.", "Early stopping with patience automates the decision."],
    terms: [["training loss", "loss on the examples used for training"], ["validation loss", "loss on held-out examples, measured without training on them"], ["early stopping", "ending training when validation loss stops improving"], ["patience", "how many non-improving epochs to tolerate before stopping"]],
    reflect: { q: "Validation loss is lower than training loss for the first few epochs. Is something wrong?", a: "Usually not. Training loss is averaged across an epoch while the parameters are still improving, so it includes earlier, worse batches; validation is measured at the end with the final parameters. Dropout (module 9) also makes training harder than validation. A small reversal early on is normal; a large persistent one suggests the validation set is easier or leaked." },
  },

  "m04-overfitting-and-underfitting": {
    simple: "Underfitting: the model is too simple to capture the pattern. Overfitting: it captures the training set's noise as if it were pattern. Good models sit between, and the validation curve shows where.",
    concept:
      "Every model sits somewhere on a line from too simple to too flexible. **Underfitting** is the too-simple end: a straight line through a curved cloud of points, high loss on training and validation alike, because the model cannot represent the pattern. **Overfitting** is the too-flexible end: a wiggly curve that passes through every training point, including the noisy ones, with low training loss and high validation loss, because it has memorised quirks that do not repeat.\n\nThe sweet spot is a model flexible enough for the real pattern and no more. Where that is depends on how much data you have: more examples let you afford a more flexible model, because the noise averages out. The signs are in lesson 4.8's curves: underfitting shows as two high curves; overfitting as a widening gap.\n\nThe cures are opposite. Underfitting: a bigger model, more features, longer training. Overfitting: more data, a smaller model, regularisation (module 9), early stopping, or dropping noisy features.",
    why:
      "The whole point of a model is to work on data it has not seen. Both failures break that: the underfitted model misses the pattern, the overfitted model adds patterns that are not there. Naming the two ends gives a diagnosis and a direction: once you know which side you are on, you know which lever to pull. Most of module 9 is techniques for staying off the overfitting end while keeping models big.",
    how: [
      "Train, and plot training and validation loss (lesson 4.8).",
      "Both high and close together: underfitting. Increase capacity (bigger model, more features), train longer, lower regularisation.",
      "Training low, validation high and rising: overfitting. Get more data, shrink the model, add regularisation or dropout, stop earlier, remove noisy features.",
      "Both low and close: the sweet spot. Ship, and keep validating as data drifts.",
      "Repeat the diagnosis after every change; the right capacity moves with the data.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Underfitting", points: ["straight line through a U-shaped cloud", "training loss high, validation loss high", "cannot represent the pattern", "fix: more capacity, more features, train longer"] },
      right: { title: "Overfitting", points: ["wiggly curve through every point, noise included", "training loss tiny, validation loss high and rising", "memorised the training set", "fix: more data, less capacity, regularisation, early stopping"] },
      caption: "Same data, two failures. The validation curve tells you which one you have.",
    },
    everyday: {
      title: "Learning to recognise birds",
      text: "Someone who has decided 'all small brown birds are sparrows' is underfitting: the rule is too simple and misses robins, wrens and finches. Someone who concluded from one trip that 'sparrows always sit on the third fence post at 9 am' is overfitting: they memorised the day's accidents as rules. The skilled birder has rules exactly as detailed as the real differences, no simpler and no more.",
    },
    engineering: {
      title: "Finding the right size for a demand model",
      text: "A grocer's demand team tries three models on 50,000 store-days. A linear model: training RMSE 42, validation 43; underfitting, the sales curve around holidays is not a line. A 200-tree ensemble with deep trees: training RMSE 6, validation 38; overfitting, the trees memorised individual store-days. A 200-tree ensemble with shallow trees and a bit of regularisation: training 24, validation 27. The third ships. Six months later, with 200,000 store-days, the deep ensemble is retried and now validates at 24: more data moved the sweet spot toward more capacity.",
    },
    maths: {
      formula: "expected error ≈ bias² + variance + noise;   underfitting: high bias;   overfitting: high variance",
      meaning: "Bias is the error from a model too simple for the pattern. Variance is how much the fitted model would change with a different training sample: a flexible model fits each sample's noise differently. Noise is irreducible. Increasing capacity lowers bias and raises variance.",
      worked: [
        "Linear model on a curved pattern: bias large (say 40² = 1,600), variance small (10), noise 100. Expected error ≈ 1,710, RMSE ≈ 41. Matches the underfitted result.",
        "Very flexible model: bias ≈ 0, variance large (1,300), noise 100. Expected error ≈ 1,400, RMSE ≈ 37. Better than the line, but most of the error is variance: memorised noise.",
        "Moderate model: bias 15² = 225, variance 350, noise 100. Expected error 675, RMSE ≈ 26. The sweet spot balances the two.",
        "Doubling the data roughly halves the variance term; the flexible model's RMSE then falls toward √(0 + 650 + 100) ≈ 27, which is why more data lets you use bigger models.",
      ],
      note: "These are illustrative numbers; the decomposition is exact in theory, approximate in practice.",
    },
    code: {
      title: "Fitting curves of three flexibilities to noisy data",
      lang: "py",
      src: `import random, math
random.seed(1)

# the true pattern is a curve; the data has noise
xs = [i / 4 for i in range(0, 25)]            # 0 to 6: a full wave of sin
truth = lambda x: math.sin(x)
train = [(x, truth(x) + random.gauss(0, 0.25)) for x in xs]
valid = [(x + 0.125, truth(x + 0.125) + random.gauss(0, 0.25)) for x in xs]

def fit_poly(points, degree):
    # least-squares polynomial fit via normal equations (small and simple on purpose)
    n = degree + 1
    A = [[sum(x ** (i + j) for x, _ in points) for j in range(n)] for i in range(n)]
    b = [sum(y * x ** i for x, y in points) for i in range(n)]
    for i in range(n):                       # Gaussian elimination
        piv = A[i][i]
        for j in range(i, n): A[i][j] /= piv
        b[i] /= piv
        for k in range(n):
            if k != i:
                f = A[k][i]
                for j in range(i, n): A[k][j] -= f * A[i][j]
                b[k] -= f * b[i]
    return b

def mse(coeffs, points):
    pred = lambda x: sum(c * x ** i for i, c in enumerate(coeffs))
    return sum((pred(x) - y) ** 2 for x, y in points) / len(points)

for degree in [1, 3, 12]:
    c = fit_poly(train, degree)
    print(f"degree {degree:>2}: train MSE {mse(c, train):.3f}  validation MSE {mse(c, valid):.3f}")`,
      lines: [
        { code: "train = [(x, truth(x) + random.gauss(0, 0.25)) for x in xs]", say: "The data: a smooth curve plus noise. The noise is what an overfitted model memorises." },
        { code: "for degree in [1, 3, 12]:", say: "Three flexibilities: a line, a gentle curve, a wild 12-term polynomial." },
        { code: "print(f\"degree {degree:>2}: train MSE {mse(c, train):.3f}  validation MSE {mse(c, valid):.3f}\")", say: "Degree 1 is high on both (underfit). Degree 12 is lowest on training and worst on validation (overfit). Degree 3 is the sweet spot." },
      ],
      output: "degree  1: train MSE 0.142  validation MSE 0.212\ndegree  3: train MSE 0.042  validation MSE 0.066\ndegree 12: train MSE 0.021  validation MSE 0.281",
      note: "Your exact numbers depend on the random noise, but the pattern is stable: the most flexible model wins on training and loses on validation.",
    },
    useIt: "Diagnose before you tune: plot the two losses, decide which end you are on, pull the matching lever. Expect the right capacity to grow with the data. When a model scores suspiciously well, assume overfitting or leakage until the validation set proves otherwise. Module 9 gives the toolkit for training big models without overfitting.",
    takeaways: ["Underfitting: too simple, both losses high. Overfitting: too flexible, training low and validation high.", "Bias (too simple) versus variance (memorising noise); capacity trades one for the other.", "More data shifts the sweet spot toward bigger models.", "Opposite cures: add capacity, or add data, regularisation and early stopping."],
    terms: [["underfitting", "a model too simple to capture the pattern"], ["overfitting", "a model that fits training noise and fails on new data"], ["capacity", "how flexible a model is; roughly its parameter count"], ["bias–variance trade-off", "simpler models err by rigidity, flexible ones by memorising"]],
    reflect: { q: "A colleague fixes overfitting by removing half the training data so the model 'has less to memorise'. Why is that backwards?", a: "Less data makes overfitting worse: the model can fit the remaining noise more easily and the noise averages out less. The levers for overfitting are more data, less capacity, regularisation and early stopping. Removing data pulls the wrong direction on every one of them." },
  },
};

export const M04_QUIZ: Quiz[] = [
  {
    q: "Mean signed error is +0.2; mean absolute error is 25. What do you conclude?",
    options: ["The model is biased high", "The model is accurate", "The model barely leans either way but is typically wrong by 25", "The loss function is wrong"],
    answer: 2,
    why: ["A mean signed error near zero means no lean.", "A typical miss of 25 is not accurate unless the scale is huge.", "Correct. Sign reads bias; size reads accuracy. Errors are large but balanced.", "Nothing here is about the loss choice."],
  },
  {
    q: "Why do classifiers train on cross-entropy rather than accuracy?",
    options: ["Accuracy is too expensive to compute", "Accuracy jumps in steps so its gradient is zero almost everywhere; cross-entropy is smooth", "Cross-entropy is easier to explain to managers", "Accuracy only works for two classes"],
    answer: 1,
    why: ["Accuracy is trivial to compute.", "Correct. Training needs a slope; counting right answers has none.", "The opposite is true.", "Accuracy works for any number of classes."],
    reason: true,
  },
  {
    q: "Errors are [−2, 3, −1, 30]. Which loss will be most dominated by the last example?",
    options: ["Mean absolute error", "Mean squared error", "Both equally", "Neither; the last example is ignored"],
    answer: 1,
    why: ["Under MAE the 30 is 30 of 36: large, but not overwhelming.", "Correct. Squared, the 30 becomes 900 of 914: 98 percent of the loss.", "Squaring changes the balance dramatically.", "Every example counts in both."],
  },
  {
    q: "A spam email (truth 1) gets probability 0.01 from the model. Its binary cross-entropy penalty is about:",
    options: ["0.01", "0.99", "4.6", "100"],
    answer: 2,
    why: ["That is the probability, not the penalty.", "No.", "Correct. −log(0.01) ≈ 4.6: a confident mistake is expensive.", "Logs grow slowly; it would take p = 10⁻⁴³ to reach 100."],
  },
  {
    q: "A language model's average cross-entropy per token is 1.5. Its perplexity is about:",
    options: ["1.5", "4.5", "15", "0.22"],
    answer: 1,
    why: ["Perplexity is e to the loss, not the loss.", "Correct. e^1.5 ≈ 4.48: as uncertain as choosing among 4.5 equally likely tokens.", "No.", "That is e^(−1.5), the average probability on the truth, not perplexity."],
  },
  {
    q: "Validation accuracy is flat at 91% while validation loss rises from 0.3 to 0.5 over ten epochs. Best action?",
    options: ["Keep training; accuracy is fine", "Stop at the epoch with the lowest validation loss; the model is becoming over-confident", "Switch to MSE", "Increase the learning rate"],
    answer: 1,
    why: ["Rising validation loss is the early sign of overfitting.", "Correct. Decisions are unchanged but probabilities on mistakes are hardening; keep the best checkpoint.", "MSE is for regression.", "That makes training less stable, not less over-confident."],
    reason: true,
  },
  {
    q: "Training loss 0.9, validation loss 0.95, both flat for many epochs. Diagnosis and fix?",
    options: ["Overfitting; add dropout", "Underfitting; add capacity, features or training time", "Leakage; remove features", "Perfect; ship it"],
    answer: 1,
    why: ["Overfitting shows a gap; here there is none.", "Correct. Two high, close curves mean the model cannot represent the pattern.", "Leakage would show suspiciously low loss, not high.", "A loss of 0.9 against a baseline of 0.69 for two balanced classes is worse than a coin."],
  },
  {
    q: "Which change makes overfitting worse?",
    options: ["Adding training examples", "Adding regularisation", "Doubling the model's parameters without more data", "Stopping earlier"],
    answer: 2,
    why: ["More data averages out noise.", "Regularisation constrains the fit.", "Correct. More capacity with the same data means more ability to memorise noise.", "Early stopping cuts overfitting off."],
  },
];

export const M04_EXERCISES: Exercise[] = [
  {
    title: "Compute four losses on one set of predictions",
    kind: "calculate",
    task: "Regression predictions [48, 55, 30, 72] against actuals [50, 50, 40, 70]. Compute MSE, RMSE and MAE. Then, for a classifier, probabilities given to the true class [0.9, 0.6, 0.2, 0.95]: compute the average cross-entropy. Which single example dominates each loss?",
    hints: ["Errors: −2, 5, −10, 2.", "Cross-entropy per example: −ln p."],
    solution: "Squares: 4, 25, 100, 4 → MSE = 133 ÷ 4 = 33.25; RMSE ≈ 5.77. MAE = (2 + 5 + 10 + 2) ÷ 4 = 4.75. The −10 example is 75% of MSE and 53% of MAE. Cross-entropy: −ln 0.9 = 0.105, −ln 0.6 = 0.511, −ln 0.2 = 1.609, −ln 0.95 = 0.051; average = 2.276 ÷ 4 = 0.569; the 0.2 example is 71% of it.",
  },
  {
    title: "Pick the loss for the problem",
    kind: "think",
    task: "For each, name the loss and say why: (a) predicting a taxi fare where every pound of error costs the same; (b) predicting peak electricity demand where a big under-prediction causes a blackout; (c) deciding whether an X-ray shows a fracture; (d) predicting the next word in a sentence; (e) predicting A&E wait times, which have a long tail.",
    hints: ["Does a big miss cost disproportionately more?", "Is the output a probability over classes?"],
    solution: "(a) MAE: linear cost. (b) MSE, or an asymmetric loss that charges under-prediction more: big misses are catastrophic. (c) Binary cross-entropy: two classes, probabilities needed to set a cautious threshold. (d) Categorical cross-entropy over the vocabulary. (e) MAE (predicts the median, robust to the tail), or a quantile loss if you want 'the 90th percentile wait'.",
  },
  {
    title: "Early stopping from a log",
    kind: "code",
    task: "Given these validation losses per epoch: [2.1, 1.6, 1.3, 1.1, 1.0, 0.97, 0.96, 0.96, 0.97, 0.99, 1.02, 1.06], write Python that applies early stopping with patience 2 and prints the stopping epoch and the best epoch. Then rerun with patience 4 and explain the difference.",
    hints: ["Track best so far and how many epochs since it improved.", "With patience 2, stopping happens at epoch 9 (two non-improving epochs after epoch 7)."],
    solution: "val = [2.1, 1.6, 1.3, 1.1, 1.0, 0.97, 0.96, 0.96, 0.97, 0.99, 1.02, 1.06]\ndef early_stop(val, patience):\n    best, best_ep, since = float('inf'), 0, 0\n    for ep, v in enumerate(val, 1):\n        if v < best: best, best_ep, since = v, ep, 0\n        else: since += 1\n        if since >= patience: return ep, best_ep, best\n    return len(val), best_ep, best\nprint(early_stop(val, 2))   # (9, 7, 0.96)\nprint(early_stop(val, 4))   # (11, 7, 0.96)\n\nBoth find epoch 7 as best; patience 4 trains two more epochs before giving up. Larger patience costs time but survives a noisy single bad epoch; smaller patience stops sooner but could quit during a temporary plateau.",
  },
  {
    title: "Diagnose from the curves",
    kind: "think",
    task: "Three training runs. Run 1: train 0.05, val 0.90. Run 2: train 0.80, val 0.82. Run 3: train 0.20, val 0.24. Diagnose each, then propose one change per run and predict how both numbers would move.",
    hints: ["A big gap is overfitting; two high numbers are underfitting."],
    solution: "Run 1: overfitting (tiny training loss, huge gap). Change: add regularisation or more data; expect training loss to rise toward 0.2–0.3 and validation to fall toward 0.4. Run 2: underfitting (both high, close). Change: bigger model or more features; expect both to fall together, e.g. to 0.4 and 0.45. Run 3: healthy (both low, small gap). Change: none needed; maybe a little more capacity to see whether validation improves without the gap widening.",
  },
];
