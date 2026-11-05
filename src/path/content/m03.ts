import type { Exercise, LessonBody, Quiz } from "../types";

// Module 3: Mathematics behind machine learning. One concept per lesson, every idea with numbers you can check by hand.
// Keys are lesson slugs: m03-<kebab of the concept title>.

export const M03_BODIES: Record<string, LessonBody> = {
  "m03-basic-algebra-for-ai": {
    simple: "Algebra is the habit of using letters for numbers you do not know yet, so one formula can describe every house, every email or every delivery at once.",
    concept:
      "Every model in this path is a formula, and formulas are written in **algebra**: letters standing in for numbers. The house-price model from lesson 2.5 was price = 2,100 × area + 40,000. Algebra writes it as y = w·x + b, where x is any house's area, y is its predicted price, and w and b are the numbers training found.\n\nThe letters are not vague. Each one is a box holding a number; the formula says how the boxes combine. Writing y = w·x + b once describes the prediction for every house, because x can be any area. That is the whole point: one expression, infinitely many cases.\n\nThe skills you need are small: substitute a number for a letter, rearrange an equation to get a letter on its own, and read a formula from left to right as a sequence of operations. Nearly all the maths in AI is these three moves, applied to bigger formulas.",
    why:
      "Without algebra you would have to write a separate calculation for every example, and you could never say what a model is in general. Algebra exists so that 'multiply the area by 2,100 and add 40,000' can be said once, as y = 2,100x + 40,000, and then reasoned about: what happens to y if x doubles; what value of x gives y = 300,000.\n\nIt is also the language that every later lesson is written in. A loss function, a gradient, an attention score are all formulas with letters; being comfortable substituting and rearranging makes them readable instead of frightening.",
    how: [
      "Name the unknowns with letters: x for an input, y for an output, w and b for parameters.",
      "Write the relationship as an equation: y = w·x + b.",
      "To use it, substitute: put the number in the letter's place and compute. x = 97, w = 2,100, b = 40,000 gives y = 243,700.",
      "To ask a reverse question, rearrange: to find the area that gives y = 300,000, subtract b from both sides and divide by w: x = (y − b) ÷ w.",
      "Read any new formula the same way: identify what each letter stands for, then follow the operations in order.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Symbol", "Means", "In the house model", "Who sets it"],
        rows: [["x", "an input", "area in m²", "the example"], ["y or ŷ", "the output (ŷ: a prediction)", "price", "computed"], ["w", "a weight", "2,100 per m²", "training"], ["b", "a bias", "40,000", "training"], ["·", "multiply", "w·x = 2,100 × 97", "—"], ["Σ", "add up over a list", "Σ wᵢxᵢ = all features weighted", "—"]],
      },
      caption: "A formula is a small vocabulary. Learn to read the symbols and every later formula is a sentence.",
    },
    everyday: {
      title: "A phone contract",
      text: "A phone plan costs £12 a month plus 5p per minute of calls. For any month, bill = 0.05 × minutes + 12. That is y = w·x + b with w = 0.05 and b = 12. Ask 'how many minutes before the bill hits £20?' and you rearrange: minutes = (20 − 12) ÷ 0.05 = 160. You have done algebra every time you estimated a bill.",
    },
    engineering: {
      title: "Reading a model card",
      text: "A model card for a delivery-time model says: ETA = 4.2 + 1.8·distance_km + 0.9·items + 6.5·is_peak. An engineer joining the team does not need the training code to use this: substitute a 3 km, 2-item order at peak time and get 4.2 + 5.4 + 1.8 + 6.5 = 17.9 minutes. They can also see at a glance that peak time adds 6.5 minutes flat and each kilometre adds 1.8. Algebra makes the model a document anyone can read.",
    },
    maths: {
      formula: "y = w·x + b;   rearranged: x = (y − b) ÷ w",
      meaning: "y output, x input, w weight, b bias. Rearranging keeps both sides equal: whatever you do to one side, do to the other.",
      worked: [
        "Phone plan: w = 0.05, b = 12. For x = 300 minutes: y = 0.05 × 300 + 12 = 15 + 12 = £27.",
        "Reverse: which x gives y = 20? Start from 20 = 0.05x + 12. Subtract 12 from both sides: 8 = 0.05x. Divide both sides by 0.05: x = 160 minutes.",
        "Check by substituting back: 0.05 × 160 + 12 = 8 + 12 = 20. ✓",
      ],
    },
    code: {
      title: "Substitute and rearrange, in code",
      lang: "py",
      src: `w, b = 0.05, 12.0           # 5p per minute, £12 fixed

def bill(minutes):          # y = w*x + b
    return w * minutes + b

def minutes_for(target):    # x = (y - b) / w
    return (target - b) / w

print(bill(300))
print(minutes_for(20))
print(bill(minutes_for(20)))   # substituting back should return 20`,
      lines: [
        { code: "return w * minutes + b", say: "The formula y = w·x + b, with the letters as variables." },
        { code: "return (target - b) / w", say: "The rearranged formula: the same equation solved for x." },
        { code: "print(bill(minutes_for(20)))   # substituting back should return 20", say: "The algebra check: forward then backward lands where you started." },
      ],
      output: "27.0\n160.0\n20.0",
    },
    useIt: "Every formula in this path is used the same two ways: substitute values to compute, and rearrange to answer a reverse question. When a new formula appears, write down what each letter is before anything else; most confusion is an unnamed letter.",
    takeaways: ["Letters are boxes for numbers; one formula describes every example.", "Two moves: substitute to compute, rearrange to solve.", "Name every letter before reading a formula.", "y = w·x + b is the model you already know, written in algebra."],
    terms: [["variable", "a letter standing for a number"], ["equation", "a statement that two expressions are equal"], ["substitute", "replace a letter with its value"], ["rearrange", "solve an equation for a different letter"]],
    reflect: { q: "If w doubles in y = w·x + b, what happens to y?", a: "The w·x part doubles; b does not change. So y does not double unless b is zero. This is why the bias matters: it is the part of the prediction that does not scale with the input." },
  },

  "m03-variables-and-equations": {
    simple: "A variable is a quantity that can take different values; an equation ties variables together so that knowing some of them tells you the others.",
    concept:
      "A **variable** is a named quantity whose value can change: the area of a house, the number of minutes called, the current value of a weight during training. In model formulas there are three families of variable: inputs (x), outputs (y), and parameters (w, b). Inputs change per example; parameters change per training step; outputs are computed from the other two.\n\nAn **equation** is a statement that two expressions are equal, and it is useful because it constrains the variables: if y = 2x + 1 and you know x = 4, then y must be 9. Several equations together constrain several unknowns; two equations can pin down two unknowns exactly.\n\nTraining a model is, at heart, solving equations approximately: find the w and b that make y = w·x + b come out close to the actual price for every house at once. With thousands of houses there are thousands of equations and only two unknowns, so no exact solution exists, and the model settles for the best compromise.",
    why:
      "Variables let you talk about a quantity before you know it, which is the normal situation in modelling: you do not know the weights until training, and you do not know the input until a request arrives. Equations turn vague relationships into precise ones that can be computed and checked.\n\nSeeing training as 'too many equations, too few unknowns' also explains why models are never perfect: with 10,000 houses and two parameters, no single line passes through all 10,000 points. The best line minimises the total mismatch, which is what module 4 measures.",
    how: [
      "Identify the variables and classify them: input, output or parameter.",
      "Write the equation relating them.",
      "If the unknowns are parameters and you have examples, each example gives one equation with the same unknowns.",
      "With as many equations as unknowns, solve exactly. With more equations than unknowns, find the values that come closest to satisfying all of them.",
      "Check the solution by substituting back into each equation.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Two equations, two unknowns: exact", points: ["house A: 80w + b = 250", "house B: 120w + b = 330", "subtract: 40w = 80, so w = 2", "then b = 250 − 160 = 90", "the line fits both perfectly"] },
      right: { title: "Three equations, two unknowns: approximate", points: ["house A: 80w + b = 250", "house B: 120w + b = 330", "house C: 100w + b = 310", "w = 2, b = 90 gives C: 290, off by 20", "no line fits all three; pick the least wrong one"] },
      caption: "Real datasets are the right-hand case with thousands of rows. Training finds the least-wrong parameters.",
    },
    everyday: {
      title: "Splitting a bill",
      text: "Four friends share a meal. Two had the £14 main, two had the £19 main, and everyone shared a £24 bottle. Each person's share is a variable; the total is an equation: 2·14 + 2·19 + 24 = 90, so each pays 90 ÷ 4 = £22.50. You set up variables and an equation without noticing. A model does the same with thousands of 'bills' and finds the shares that fit them all best.",
    },
    engineering: {
      title: "Calibrating a sensor",
      text: "A warehouse's weighing platform reports a raw number r; the true weight is kg = a·r + c, with a and c unknown. An engineer puts two known weights on it: 10 kg reads 412, 50 kg reads 2,012. Two equations: 412a + c = 10 and 2,012a + c = 50. Subtracting gives 1,600a = 40, so a = 0.025 and c = 10 − 0.025·412 = −0.3. Every later reading is converted with those two numbers. That is a two-parameter model fitted exactly from two examples; the fraud model is the same with 200 parameters and a million noisy examples.",
    },
    maths: {
      formula: "Two equations: 80w + b = 250 and 120w + b = 330",
      meaning: "w and b are the unknowns; 80, 120 are inputs; 250, 330 are outputs (in thousands). Subtracting one equation from the other eliminates b.",
      worked: [
        "Subtract the first from the second: (120 − 80)w + (b − b) = 330 − 250, so 40w = 80.",
        "Divide: w = 2.",
        "Substitute into the first: 80 × 2 + b = 250, so b = 250 − 160 = 90.",
        "Check in the second: 120 × 2 + 90 = 330. ✓",
        "Add a third house (100 m², 310): 100 × 2 + 90 = 290, not 310. No exact solution; the best compromise is what training finds.",
      ],
    },
    code: {
      title: "Solving two equations, then seeing why three cannot be solved exactly",
      lang: "py",
      src: `# houses: (area, price in thousands)
A, B, C = (80, 250), (120, 330), (100, 310)

w = (B[1] - A[1]) / (B[0] - A[0])   # eliminate b by subtracting the equations
b = A[1] - w * A[0]
print("w =", w, " b =", b)

for name, (x, y) in [("A", A), ("B", B), ("C", C)]:
    print(name, "predicted", w * x + b, "actual", y)`,
      lines: [
        { code: "w = (B[1] - A[1]) / (B[0] - A[0])   # eliminate b by subtracting the equations", say: "Subtracting the two equations cancels b and leaves w alone: the rearrangement from the worked example." },
        { code: "b = A[1] - w * A[0]", say: "Substitute w back into one equation to get b." },
        { code: "print(name, \"predicted\", w * x + b, \"actual\", y)", say: "A and B fit exactly; C does not. With more equations than unknowns, exactness is gone." },
      ],
      output: "w = 2.0  b = 90.0\nA predicted 250.0 actual 250\nB predicted 330.0 actual 330\nC predicted 290.0 actual 310",
    },
    useIt: "Whenever you set up a model, list its variables by family: inputs, outputs, parameters. Count equations (examples) against unknowns (parameters): fewer examples than parameters means many models fit perfectly and you cannot trust any of them (overfitting, module 4); many more examples than parameters means the fit is a compromise you can measure.",
    takeaways: ["Variables: inputs change per example, parameters change per training step, outputs are computed.", "An equation constrains variables; two equations can pin down two unknowns.", "A dataset is thousands of equations with few unknowns: no exact fit, only a best compromise.", "Check solutions by substituting back."],
    terms: [["unknown", "a variable whose value you are solving for"], ["system of equations", "several equations sharing unknowns"], ["exact solution", "values that satisfy every equation"], ["best fit", "values that come closest when no exact solution exists"]],
    reflect: { q: "A model has 1,000 parameters and you have 500 training examples. Why is a perfect training fit not reassuring?", a: "With more unknowns than equations there are infinitely many parameter settings that fit the 500 examples exactly, and most of them are wrong about everything else. The perfect fit says nothing about new data. You need more examples, fewer parameters, or regularisation (module 9)." },
  },

  "m03-functions-and-graphs": {
    simple: "A function turns an input into exactly one output; its graph draws every input-output pair as a point, and a model is a function you can draw.",
    concept:
      "A **function** is a rule that takes an input and gives back exactly one output. f(x) = 2x + 1 takes 4 and returns 9. The model from module 2 is a function: features in, prediction out. Training does not change what a function is; it changes which function you have, by changing the parameters.\n\nA **graph** draws the function: for every input x along the horizontal axis, a point at height f(x). A straight line is the graph of y = w·x + b: w is the slope (how steep), b is where it crosses the vertical axis. A curve is the graph of something non-linear, like f(x) = x² or the S-shaped sigmoid from module 7.\n\nGraphs matter because training can be seen on them. The loss as a function of a parameter is a curve; training walks downhill on it. The data is a cloud of points; the model is a line or curve through the cloud. If you can picture the graph, you can usually predict what the maths will do.",
    why:
      "Functions give a precise meaning to 'the model predicts': one input, one output, always. Graphs give intuition that formulas hide. Saying 'the loss is convex' means little; seeing a bowl-shaped curve with one lowest point explains immediately why gradient descent works. Saying 'the model underfits' means little; seeing a straight line through a curved cloud of points shows it.\n\nMost debugging of models starts with a plot: predictions against actuals, loss against steps, output against one input. Reading those plots is reading graphs of functions.",
    how: [
      "Write the function: y = f(x).",
      "Pick a range of inputs and compute the output for each.",
      "Plot each (input, output) as a point; join them for a continuous function.",
      "Read the shape: slope (rising, falling, flat), curvature (straight, bowl, S), minima and maxima (lowest and highest points).",
      "For a model with many inputs, plot one input at a time with the others fixed, or plot prediction against actual.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["x", "line: 2x + 1", "bowl: (x − 2)²", "S-curve: 1 ÷ (1 + e^(−x))"],
        rows: [["−2", "−3", "16", "0.12"], ["−1", "−1", "9", "0.27"], ["0", "1", "4", "0.50"], ["1", "3", "1", "0.73"], ["2", "5", "0", "0.88"], ["3", "7", "1", "0.95"], ["4", "9", "4", "0.98"]],
      },
      caption: "Three functions as tables of points. Plotted: a straight line, a bowl with its bottom at x = 2, and an S that flattens toward 0 and 1. All three appear constantly in models.",
    },
    everyday: {
      title: "A temperature chart",
      text: "A hospital's chart of a patient's temperature over a day is a graph of a function: time in, temperature out, one reading per moment. Nobody reads the numbers; they read the shape: rising, peaking at 2 am, falling. The same glance reads a training curve: loss falling fast, then slowly, then flat. Shapes carry the story; numbers carry the detail.",
    },
    engineering: {
      title: "Finding a bad feature from a graph",
      text: "A retail team plots their demand model's predictions against the 'days until payday' feature, holding everything else fixed. The graph is a straight rising line: the linear model can only draw lines. But the actual sales, plotted the same way, form a U: high just after payday, low mid-month, high again before the next one. One graph showed that the feature's effect is a curve, so the line could not capture it. They added a squared term and the U appeared in the model's predictions.",
    },
    maths: {
      formula: "f(x) = w·x + b: slope w, intercept b;   g(x) = (x − 2)²: minimum at x = 2",
      meaning: "Slope is the change in output per unit change in input. The minimum of a bowl is where the slope is zero; training looks for exactly such points.",
      worked: [
        "f(x) = 2x + 1: f(0) = 1 (crosses the vertical axis at 1), f(1) = 3, f(2) = 5. Each step of 1 in x raises y by 2: the slope is 2.",
        "g(x) = (x − 2)²: g(0) = 4, g(1) = 1, g(2) = 0, g(3) = 1. Lowest at x = 2; symmetric either side.",
        "Slope of g near x = 0: from g(0) = 4 to g(1) = 1, a drop of 3 per unit. Near x = 3: from 1 to 4, a rise of 3. Steep far from the bottom, flat at the bottom: the next lesson makes this precise.",
      ],
    },
    code: {
      title: "A function as a table of points",
      lang: "py",
      src: `import math

def line(x):   return 2 * x + 1
def bowl(x):   return (x - 2) ** 2
def s_curve(x): return 1 / (1 + math.exp(-x))

print("  x   line  bowl  s-curve")
for x in range(-2, 5):
    print(f"{x:>3} {line(x):>6} {bowl(x):>5} {s_curve(x):>8.2f}")

lowest = min(range(-2, 5), key=bowl)
print("bowl is lowest at x =", lowest)`,
      lines: [
        { code: "def line(x):   return 2 * x + 1", say: "A function: one input, one output. Here a straight line with slope 2." },
        { code: "def s_curve(x): return 1 / (1 + math.exp(-x))", say: "The sigmoid: an S that squeezes any number into 0 to 1. It returns in module 7." },
        { code: "for x in range(-2, 5):", say: "Evaluating at a range of inputs is how a graph is made." },
        { code: "lowest = min(range(-2, 5), key=bowl)", say: "Finding the lowest point of a function by checking inputs. Training does this cleverly, without checking every input." },
      ],
      output: "  x   line  bowl  s-curve\n -2     -3    16     0.12\n -1     -1     9     0.27\n  0      1     4     0.50\n  1      3     1     0.73\n  2      5     0     0.88\n  3      7     1     0.95\n  4      9     4     0.98\nbowl is lowest at x = 2",
    },
    useIt: "Plot before you reason. Loss against training step, prediction against actual, output against one input: each is the graph of a function, and its shape tells you whether training is working, whether the model is too simple, and where it is wrong. Learn the three shapes (line, bowl, S); most of the path is built from them.",
    takeaways: ["A function: one input, exactly one output. A model is a function.", "A graph draws the input-output pairs; the shape is the story.", "Line: slope and intercept. Bowl: a single lowest point. S: squeezes into 0 to 1.", "Most model debugging is reading graphs."],
    terms: [["function", "a rule giving one output per input"], ["graph", "the plot of a function's input-output pairs"], ["slope", "change in output per unit input"], ["minimum", "the lowest point of a function"]],
    reflect: { q: "Why is a loss shaped like a bowl good news for training?", a: "A bowl has one lowest point, and the slope everywhere points toward it. Walking downhill from anywhere reaches the bottom. Losses with many dips (common in deep networks) can trap training in a dip that is not the lowest; module 5 and module 9 deal with that." },
  },

  "m03-linear-equations": {
    simple: "A linear equation is a weighted sum plus a constant; its graph is a straight line or flat plane, and it is the simplest model and the building block of every bigger one.",
    concept:
      "An equation is **linear** when every variable appears only multiplied by a constant and added: y = 2,100x + 40,000 is linear; y = x² or y = x·z is not. With one input the graph is a straight line. With two inputs, y = w₁x₁ + w₂x₂ + b, the graph is a flat plane in three dimensions. With d inputs it is a flat 'hyperplane' you cannot draw but that behaves the same way: every input's effect is a fixed amount per unit, independent of the others.\n\nThat independence is the strength and the limit. Strength: the weights are readable (each is the effect of one input) and the equation is cheap to compute and easy to fit. Limit: a line cannot bend. If the true relationship is a U, a line will miss it. Neural networks are stacks of linear equations with bends inserted between them (module 7), which is how they keep the cheapness and gain the curves.",
    why:
      "Linear equations are where machine learning starts because they are the simplest thing that can learn: a few parameters, a formula anyone can read, and a fit that can be found exactly for small data. They are also the inner part of every neural network layer, so understanding them is understanding most of the arithmetic inside a transformer.\n\nTheir limit is why the rest of the path exists: the world is not linear, and the question of how to get curves without losing the simplicity is answered by activation functions and depth.",
    how: [
      "List the inputs x₁ … x_d.",
      "Give each a weight w₁ … w_d and add a bias b.",
      "Compute y = w₁x₁ + w₂x₂ + … + w_dx_d + b.",
      "Interpret: changing x_i by 1 changes y by exactly w_i, whatever the other inputs are.",
      "Check for non-linearity in the data (a curve, an interaction between inputs); if present, a linear equation will underfit and you need transformed features or a non-linear model.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Linear (a line can draw it)", points: ["y = 3x + 2", "y = 0.5x₁ − 2x₂ + 7", "price = 2,100·area + 40,000", "each input's effect is a fixed amount per unit"] },
      right: { title: "Not linear (needs a curve)", points: ["y = x²", "y = x₁ · x₂ (inputs multiply each other)", "y = 1 ÷ (1 + e^(−x))", "an input's effect depends on its own size or on other inputs"] },
      caption: "The test: can you write it as weights times inputs, added up, plus a constant? If yes, it is linear.",
    },
    everyday: {
      title: "A pay slip",
      text: "Pay = hourly rate × hours + a fixed allowance. Each extra hour adds exactly the rate, whether it is the first hour or the fortieth. That is a linear equation, and it is why pay slips are easy to check. Overtime at 1.5× after 40 hours breaks linearity: the effect of an hour now depends on how many hours came before. Payroll software handles that with a bend at hour 40, exactly what activation functions do inside networks.",
    },
    engineering: {
      title: "Where a linear model was enough",
      text: "An energy company forecasts a building's daily heating demand from outside temperature, day of week and occupancy. A linear model with four weights explains 92 percent of the variation and runs in a spreadsheet the facilities team already uses. A neural network reached 94 percent. They shipped the linear model: two points of accuracy were not worth losing the ability for a facilities manager to read 'each degree colder adds 38 kWh'. Linear is often enough, and when it is, it wins on simplicity.",
    },
    maths: {
      formula: "y = w₁x₁ + w₂x₂ + b   (a plane);   effect of x₁: Δy = w₁ · Δx₁",
      meaning: "Δ (delta) means 'change in'. In a linear equation the change in output is the weight times the change in input, always, regardless of the other inputs.",
      worked: [
        "Heating: kWh = −38·temp + 120·occupied_fraction + 410.",
        "A day at 5 °C, half occupied: −190 + 60 + 410 = 280 kWh.",
        "The same day at 4 °C: −152 + 60 + 410 = 318 kWh. One degree colder, +38 kWh, as the weight says.",
        "At −10 °C: 380 + 60 + 410 = 850 kWh. The line keeps going; if real boilers hit a maximum, the model will be wrong there: the limit of linear.",
      ],
    },
    code: {
      title: "A linear equation with any number of inputs",
      lang: "py",
      src: `def linear(xs, ws, b):
    total = b
    for x, w in zip(xs, ws):
        total += w * x
    return total

ws = [-38, 120]          # per degree, per occupied fraction
b = 410

print(linear([5, 0.5], ws, b))      # 5 C, half occupied
print(linear([4, 0.5], ws, b))      # one degree colder: +38 exactly
print(linear([4, 1.0], ws, b))      # fully occupied: +60 exactly, independent of temperature`,
      lines: [
        { code: "total += w * x", say: "Weight times input, added up: the definition of linear." },
        { code: "print(linear([4, 0.5], ws, b))      # one degree colder: +38 exactly", say: "Changing one input by 1 changes the output by its weight, nothing more." },
        { code: "print(linear([4, 1.0], ws, b))      # fully occupied: +60 exactly, independent of temperature", say: "Inputs do not interact in a linear equation. If they should, you need a non-linear model." },
      ],
      output: "280.0\n318.0\n378.0",
    },
    useIt: "Start every tabular problem with a linear model: it is a baseline, it is readable, and it may be enough. When the errors show a curve or an interaction, add transformed features (x², x₁·x₂) or move to a non-linear model. Inside neural networks, every layer is a linear equation followed by a bend; module 8 builds on exactly this.",
    takeaways: ["Linear: weights times inputs, added, plus a bias. Graph: line, plane, hyperplane.", "Each input's effect is fixed per unit and independent of the others.", "Readable and cheap; cannot bend or capture interactions.", "The inner arithmetic of every neural network layer."],
    terms: [["linear equation", "a weighted sum plus a constant"], ["hyperplane", "the flat graph of a linear equation with many inputs"], ["interaction", "when one input's effect depends on another"], ["baseline", "the simple model you compare everything against"]],
    reflect: { q: "Is y = 3x + 2x² linear in x? Is it linear in the parameters 3 and 2?", a: "Not linear in x: the x² term bends it. But it is linear in the parameters: y = w₁·x + w₂·(x²) is a weighted sum of two features, x and x². That is why adding squared features lets a 'linear model' draw curves: the model is still linear in what it learns." },
  },

  "m03-derivatives": {
    simple: "A derivative is the slope of a function at one point: how much the output changes for a tiny change in the input. Training uses it to know which way to move.",
    concept:
      "A straight line has one slope everywhere. A curve has a different slope at every point. The **derivative** of a function at a point is that local slope: if you nudge the input by a tiny amount, the output changes by the derivative times that amount.\n\nWritten f′(x) or df/dx, it is itself a function: for the bowl g(x) = (x − 2)², the derivative is g′(x) = 2(x − 2). At x = 0 that is −4 (steeply downhill to the right); at x = 2 it is 0 (flat: the bottom); at x = 3 it is 2 (uphill). The sign tells you which way is down; the size tells you how steep.\n\nThat is exactly what training needs. The loss is a function of each parameter; its derivative says whether increasing the parameter makes the loss bigger or smaller, and by how much. Move against the derivative and the loss falls.",
    why:
      "Without derivatives, finding the lowest point of a function means trying values blindly. With them, every point tells you which way to go. For a model with a billion parameters, blind search is impossible and derivatives are the only way: one derivative per parameter, computed in one pass (module 5), gives the direction for all of them at once.\n\nDerivatives exist in maths for the general question 'how fast is this changing?'; machine learning borrows them for 'which way reduces the error?'.",
    how: [
      "Pick a point x and a tiny step h.",
      "Compute the rise: f(x + h) − f(x).",
      "Divide by the run h: the slope of the tiny segment.",
      "Imagine h shrinking toward zero; the value the ratio settles on is the derivative f′(x).",
      "For common functions, use the known formulas instead: the derivative of x² is 2x; of w·x (with respect to w) is x; of a constant is 0; of a sum is the sum of the derivatives.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["x", "g(x) = (x − 2)²", "g′(x) = 2(x − 2)", "Reading"],
        rows: [["0", "4", "−4", "steep, downhill to the right: increase x"], ["1", "1", "−2", "gentler, still downhill"], ["2", "0", "0", "flat: the minimum"], ["3", "1", "+2", "uphill to the right: decrease x"], ["4", "4", "+4", "steep uphill"]],
      },
      caption: "The derivative's sign says which way is down; its size says how steep. At the minimum it is zero.",
    },
    everyday: {
      title: "A speedometer",
      text: "Your position along a road is a function of time. Your speed is its derivative: how fast position changes right now. A speedometer does not tell you where you are; it tells you how quickly 'where you are' is changing. Training reads the speedometer of the loss: not 'how wrong am I' but 'how fast does wrongness change if I turn this knob'.",
    },
    engineering: {
      title: "Checking derivatives in a model library",
      text: "Every deep-learning library computes derivatives automatically, and library authors test them with the tiny-step method: compute f(x + h) − f(x − h) divided by 2h with h = 0.00001, and compare with the formula's answer. If the two disagree by more than a hair, the derivative code is wrong. This 'gradient check' is run on every new operation added to the library, because a wrong derivative does not crash; it quietly trains the model in the wrong direction.",
    },
    maths: {
      formula: "f′(x) = lim as h→0 of [f(x + h) − f(x)] ÷ h;   for g(x) = (x − 2)²:  g′(x) = 2(x − 2)",
      meaning: "h is a tiny step. The ratio is rise over run; the limit is what it becomes as the step shrinks to nothing.",
      worked: [
        "g(x) = (x − 2)² at x = 3, with h = 0.01: g(3.01) = (1.01)² = 1.0201; g(3) = 1. Rise = 0.0201; divide by 0.01: slope ≈ 2.01.",
        "With h = 0.001: g(3.001) = 1.002001; rise 0.002001; ÷ 0.001 = 2.001. Closer to 2.",
        "The formula says g′(3) = 2(3 − 2) = 2. The tiny-step estimate converges on it.",
        "At x = 2: g′(2) = 0. The bottom of the bowl: no direction is downhill.",
      ],
    },
    code: {
      title: "Derivative by tiny step, against the formula",
      lang: "py",
      src: `def g(x):
    return (x - 2) ** 2

def numeric_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)      # slope of a tiny segment around x

def g_prime(x):
    return 2 * (x - 2)                            # the formula

for x in [0, 1, 2, 3, 4]:
    print(x, round(numeric_derivative(g, x), 4), g_prime(x))`,
      lines: [
        { code: "return (f(x + h) - f(x - h)) / (2 * h)      # slope of a tiny segment around x", say: "Rise over run for a very small run. This works for any function, which is why libraries use it to test their formulas." },
        { code: "return 2 * (x - 2)                            # the formula", say: "The exact derivative of (x − 2)². Formulas are faster and exact; the numeric version is the check." },
        { code: "print(x, round(numeric_derivative(g, x), 4), g_prime(x))", say: "The two agree at every point, and both are zero at the minimum." },
      ],
      output: "0 -4.0 -4\n1 -2.0 -2\n2 0.0 0\n3 2.0 2\n4 4.0 4",
    },
    useIt: "You will rarely compute a derivative by hand after this module; libraries do it. What you keep is the meaning: a derivative is the local slope, its sign is the direction downhill, zero means a flat spot. That meaning is what makes gradient descent, learning rates, vanishing gradients and every training curve make sense.",
    takeaways: ["Derivative = slope at a point = output change per tiny input change.", "Sign says which way is downhill; size says how steep; zero means flat.", "Known formulas: (x²)′ = 2x; (w·x)′ with respect to w is x; constants vanish; sums add.", "Training moves parameters against the derivative of the loss."],
    terms: [["derivative", "the slope of a function at a point"], ["f′(x), df/dx", "notations for the derivative"], ["limit", "the value a ratio approaches as the step shrinks to zero"], ["gradient check", "comparing a formula's derivative with a tiny-step estimate"]],
    reflect: { q: "The derivative of the loss with respect to a weight is +0.3. Should the weight go up or down, and what does 0.3 tell you?", a: "Down: a positive derivative means increasing the weight increases the loss. The 0.3 says the loss changes by about 0.3 per unit change in the weight, so a step of −0.1 should lower the loss by roughly 0.03. Module 5 turns this into the update rule." },
  },

  "m03-gradients": {
    simple: "A gradient is a derivative for a function of many inputs: one slope per input, collected in a vector, pointing in the direction of steepest increase.",
    concept:
      "A model's loss depends on all its parameters at once, not just one. The **gradient** extends the derivative to that case: for a function of several inputs, take the derivative with respect to each one while holding the others fixed (a **partial derivative**), and collect them in a list. For L(w, b) the gradient is [∂L/∂w, ∂L/∂b]: how the loss changes per unit of w, and per unit of b.\n\nThe gradient has a geometric meaning. As a vector it points in the direction in which the function rises fastest, and its length says how fast. So the opposite direction, minus the gradient, is the steepest way down. Training computes the gradient of the loss with respect to every parameter, then steps all parameters against it. That single idea, with a billion partial derivatives computed per step, is what 'gradient descent' means.",
    why:
      "A model with two parameters has a loss shaped like a landscape over a plane; with a billion, a landscape nobody can picture. The gradient is the compass that works in any number of dimensions: it always tells you the steepest way down from where you stand. Without it, improving a billion numbers together would be hopeless.\n\nThe gradient is also the quantity that misbehaves in deep networks: it can shrink to nothing or blow up as it passes through layers (module 9). Knowing it is just a list of slopes makes those problems concrete.",
    how: [
      "Write the loss as a function of all parameters: L(w, b).",
      "For each parameter, take the derivative treating every other parameter as a constant: ∂L/∂w, ∂L/∂b.",
      "Collect them into the gradient vector ∇L = [∂L/∂w, ∂L/∂b].",
      "Interpret: each entry is that parameter's slope; the vector points uphill; its negative points downhill.",
      "Step every parameter a little against its own entry: w ← w − α·∂L/∂w, b ← b − α·∂L/∂b.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "loss surface", detail: "L(w, b) = (w·2 + b − 7)²: the squared error for one example with x = 2 and actual y = 7" },
        { label: "at (w, b) = (1, 1)", detail: "prediction 3, error −4, L = 16" },
        { label: "partial for w", detail: "∂L/∂w = 2·(error)·x = 2·(−4)·2 = −16" },
        { label: "partial for b", detail: "∂L/∂b = 2·(error) = −8" },
        { label: "gradient", detail: "∇L = [−16, −8]: the loss falls fastest if both w and b increase, w twice as urgently" },
      ],
      caption: "One slope per parameter, together a direction. Step against it and the loss drops.",
    },
    everyday: {
      title: "Walking off a hill in fog",
      text: "On a foggy hillside you cannot see the valley, but you can feel the slope under your feet in two directions: forward-back and left-right. Those two feelings are the two partial derivatives; together they tell you the steepest way down, which may be diagonal. Take a step that way, feel again, step again. You reach the valley without ever seeing it. Gradient descent is this walk, in a billion directions at once.",
    },
    engineering: {
      title: "Gradients as a diagnostic",
      text: "A speech-model team logs the size of the gradient every training step. Normally it hovers around 0.5. One afternoon it spikes to 300 and the loss jumps; a batch of corrupted audio produced enormous slopes and the parameters took a huge step into nonsense. They add gradient clipping (cap the length at 1.0) and the run is stable from then on. Later, a different run's gradient size drops to 0.0001 in the early layers: those layers have stopped learning, a vanishing-gradient problem that module 9 explains. The gradient is a health signal, not just a direction.",
    },
    maths: {
      formula: "∇L = [∂L/∂w, ∂L/∂b];   for L = (w·x + b − y)²:  ∂L/∂w = 2(w·x + b − y)·x,  ∂L/∂b = 2(w·x + b − y)",
      meaning: "∂ is a partial derivative: differentiate with respect to one variable, treating the rest as constants. The factor (w·x + b − y) is the error; each partial is 2 × error × (what multiplies that parameter).",
      worked: [
        "Example x = 2, y = 7. Parameters w = 1, b = 1. Prediction = 3, error = 3 − 7 = −4.",
        "∂L/∂w = 2 × (−4) × 2 = −16. ∂L/∂b = 2 × (−4) × 1 = −8. Gradient [−16, −8].",
        "Step with α = 0.05 against the gradient: w = 1 − 0.05×(−16) = 1.8; b = 1 − 0.05×(−8) = 1.4.",
        "New prediction = 1.8×2 + 1.4 = 5.0, error −2, loss 4 (was 16). One step, three-quarters of the loss gone.",
      ],
    },
    code: {
      title: "A gradient with two entries, and one step down",
      lang: "py",
      src: `x, y = 2.0, 7.0                 # one example
w, b = 1.0, 1.0                 # current parameters

def loss(w, b):
    return (w * x + b - y) ** 2

error = w * x + b - y
grad_w = 2 * error * x          # partial derivative with respect to w
grad_b = 2 * error              # partial derivative with respect to b
print("loss", loss(w, b), "gradient", [grad_w, grad_b])

alpha = 0.05
w, b = w - alpha * grad_w, b - alpha * grad_b    # step against the gradient
print("after one step: w", w, "b", b, "loss", loss(w, b))`,
      lines: [
        { code: "grad_w = 2 * error * x          # partial derivative with respect to w", say: "The slope of the loss along the w direction, holding b still." },
        { code: "grad_b = 2 * error              # partial derivative with respect to b", say: "The slope along b. The two together are the gradient." },
        { code: "w, b = w - alpha * grad_w, b - alpha * grad_b    # step against the gradient", say: "Every parameter moves against its own slope, all at once. This line is gradient descent." },
      ],
      output: "loss 16.0 gradient [-16.0, -8.0]\nafter one step: w 1.8 b 1.4 loss 4.0",
    },
    useIt: "Think of every training step as: compute the gradient (one slope per parameter), step against it. When training is unstable, look at the gradient's size; when some layers stop learning, look at their gradients; when someone says 'gradient clipping' or 'vanishing gradients', picture the list of slopes being capped or shrinking.",
    takeaways: ["Gradient = the vector of partial derivatives, one per parameter.", "It points in the direction of steepest increase; minus it is steepest descent.", "Each partial: differentiate with respect to one parameter, others held constant.", "The gradient's size is a training health signal."],
    terms: [["gradient (∇)", "the vector of all partial derivatives"], ["partial derivative (∂)", "the derivative with respect to one variable, others fixed"], ["steepest descent", "moving against the gradient"], ["gradient clipping", "capping the gradient's length to stop huge steps"]],
    reflect: { q: "The gradient for a parameter is exactly zero for several steps in a row. Two possible reasons?", a: "Either the loss is at a flat spot with respect to that parameter (a minimum, a saddle, or a plateau), or the parameter is disconnected from the loss: its input is always zero, or an activation ahead of it is 'dead' (module 7). The first is normal near convergence; the second is a bug or a dead unit." },
  },

  "m03-introduction-to-calculus": {
    simple: "Calculus is the maths of change and accumulation: derivatives measure how fast things change, integrals add up tiny pieces, and training is a derivative problem.",
    concept:
      "The last two lessons used derivatives without naming the field. **Calculus** is the branch of maths that handles quantities that change continuously. It has two halves. **Differentiation** asks how fast a function changes at a point: the derivative, the slope. **Integration** asks how much accumulates over a range: the area under a curve, the total from a rate.\n\nThe two are inverses: differentiate the total and you get the rate; integrate the rate and you get the total. Position and speed are the classic pair: speed is the derivative of position, position is the integral of speed.\n\nMachine learning leans almost entirely on the first half. Training needs derivatives of the loss; backpropagation (module 5) is a systematic way to get them for a huge formula using one more rule, the chain rule. Integration appears less often: in probability (the area under a distribution is 1) and in some evaluation metrics (the area under a curve, module 37).",
    why:
      "Models are continuous: parameters are real numbers that can change by any amount, and the loss changes smoothly with them. Calculus is the only maths that handles smooth change precisely. Counting and algebra alone cannot say 'which way is down from here'; calculus can, in any number of dimensions.\n\nKnowing which half you need keeps the subject small: for this path, derivatives, partial derivatives and the chain rule cover nearly everything. You do not need to be able to integrate by hand to train a model.",
    how: [
      "Differentiation: given f, find f′, the function of slopes. Rules: power rule (xⁿ → n·xⁿ⁻¹), sum rule, constant multiple rule, chain rule (next module).",
      "Use f′ to find where f is flat (f′ = 0): candidates for minima and maxima.",
      "Integration: given a rate, accumulate it over an interval; the area under the curve. Rules reverse the differentiation rules.",
      "In machine learning, differentiate the loss; in probability, integrate (or sum) a distribution to get probabilities.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Differentiation: how fast?", points: ["input: a function f", "output: its slope function f′", "position → speed", "loss → gradient", "used in: every training step"] },
      right: { title: "Integration: how much in total?", points: ["input: a rate", "output: the accumulated amount", "speed → distance", "probability density → probability", "used in: distributions, some metrics"] },
      caption: "Two directions of one idea. Training lives on the left; probability borrows the right.",
    },
    everyday: {
      title: "A car's dashboard",
      text: "The speedometer shows the derivative of your position. The odometer shows the integral of your speed: all the little bits of speed, added up over time, give distance. Drive for an hour at a steady 50 km/h and the odometer rises by 50: the area under a flat speed graph. Vary your speed and the odometer still adds it all up, piece by tiny piece. That adding-up is integration.",
    },
    engineering: {
      title: "A metric that is an integral",
      text: "A fraud team evaluates their classifier with 'area under the ROC curve' (module 37). The curve plots true-positive rate against false-positive rate as the threshold sweeps from strict to lenient; the area under it, from 0 to 1, is a single quality number. Computing that area is integration, done numerically by adding up thin strips. The same team trains the model with derivatives. Both halves of calculus, in one project, each where it fits.",
    },
    maths: {
      formula: "power rule: d/dx (xⁿ) = n·xⁿ⁻¹;   sum rule: (f + g)′ = f′ + g′;   area under a constant rate r over width t = r·t",
      meaning: "The power rule covers most model formulas (x², and x¹ for linear terms). The sum rule lets you differentiate a loss term by term. The area rule is integration in its simplest form.",
      worked: [
        "f(x) = 3x² + 5x + 7. Power rule term by term: 6x + 5 + 0. So f′(x) = 6x + 5.",
        "Where is f flat? 6x + 5 = 0 → x = −5/6 ≈ −0.83. That is where the bowl bottoms out.",
        "Check with a tiny step at x = 1: f(1.001) − f(1) = (3·1.002001 + 5.005 + 7) − 15 = 0.011003; ÷ 0.001 ≈ 11.0. Formula: 6·1 + 5 = 11. ✓",
        "Integration example: a server handles requests at 200 per second for 30 seconds: total = 200 × 30 = 6,000 requests, the area under a flat line.",
      ],
    },
    code: {
      title: "The two halves, numerically",
      lang: "py",
      src: `def f(x):
    return 3 * x**2 + 5 * x + 7

def derivative(fn, x, h=1e-6):           # differentiation: slope at a point
    return (fn(x + h) - fn(x - h)) / (2 * h)

def integral(fn, a, b, n=100_000):       # integration: area under fn from a to b
    width = (b - a) / n
    return sum(fn(a + (i + 0.5) * width) for i in range(n)) * width

print(round(derivative(f, 1), 3))        # formula says 6*1 + 5 = 11
print(round(integral(lambda t: 200, 0, 30)))   # 200 requests/s for 30 s
print(round(integral(f, 0, 2), 3))       # area under the curve from 0 to 2`,
      lines: [
        { code: "return (fn(x + h) - fn(x - h)) / (2 * h)", say: "Differentiation as a tiny-step slope, the same check as lesson 3.5." },
        { code: "return sum(fn(a + (i + 0.5) * width) for i in range(n)) * width", say: "Integration as thin strips: evaluate the function at many points and add up strip areas." },
        { code: "print(round(integral(lambda t: 200, 0, 30)))   # 200 requests/s for 30 s", say: "A flat rate integrated is just rate × time: 6,000." },
      ],
      output: "11.0\n6000\n32.0",
      note: "The exact integral of 3x² + 5x + 7 from 0 to 2 is x³ + 2.5x² + 7x evaluated at 2: 8 + 10 + 14 = 32. The strips agree.",
    },
    useIt: "For this path, calculus means: derivatives to train, the chain rule to get derivatives through layers, and occasionally an integral or a sum to turn a distribution into a probability or a curve into a metric. Keep the two halves straight and you will recognise which one any formula is using.",
    takeaways: ["Calculus = differentiation (rates, slopes) + integration (totals, areas), inverses of each other.", "Training uses differentiation almost exclusively.", "Power rule and sum rule differentiate most model formulas; the chain rule handles nesting.", "Integration shows up in probability and in area-under-curve metrics."],
    terms: [["calculus", "the maths of continuous change and accumulation"], ["differentiation", "finding the rate of change"], ["integration", "accumulating a rate into a total"], ["power rule", "d/dx xⁿ = n·xⁿ⁻¹"]],
    reflect: { q: "Why can a language model with 70 billion parameters be trained without anyone ever solving an integral?", a: "Because training only needs the direction that reduces the loss, which is a derivative question. The chain rule lets a library compute all 70 billion partial derivatives mechanically. Integrals appear only when turning the model's output scores into probabilities, and there the 'integral' is a finite sum over the vocabulary." },
  },

  "m03-vectors": {
    simple: "A vector is an ordered list of numbers treated as one thing, like a point or an arrow in space; features, embeddings and gradients are all vectors.",
    concept:
      "A **vector** is a list of numbers in a fixed order: [84, 2, 0.9] is a three-dimensional vector. It can be read two ways. As a point: the house that has area 84, 2 bedrooms and is 0.9 km from the station sits at those coordinates in a three-dimensional 'feature space'. As an arrow: a direction and a length from the origin.\n\nBoth readings are used. The point reading makes similarity geometric: two houses with nearby feature vectors are similar houses, and lesson 13.9 builds word search on exactly that idea with embedding vectors. The arrow reading makes the gradient (lesson 3.6) a direction to walk.\n\nVectors have a small arithmetic. Add them element by element; multiply by a single number (a scalar) to stretch them; measure their length with Pythagoras extended to any number of dimensions. Their most important product, the dot product, gets its own lesson.",
    why:
      "A single example has many features; a single gradient has many slopes; a single word's meaning (module 13) is captured by hundreds of numbers. Treating each list as one object makes the maths and the code readable: 'the difference between two houses' is one subtraction, not three. It also makes geometry available: distance, direction and angle give intuition for similarity, movement and alignment that plain lists of numbers do not.",
    how: [
      "Write the vector as an ordered list; the position of each number is its dimension.",
      "Add two vectors of the same length element by element: [1, 2] + [3, 4] = [4, 6].",
      "Scale by a number: 2 × [1, 2] = [2, 4]. Scaling by −1 flips the direction.",
      "Length (norm): square each element, add, take the square root. ‖[3, 4]‖ = √(9 + 16) = 5.",
      "Distance between two points: the length of their difference.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Vector", "Dimensions", "As a point", "As an arrow"],
        rows: [["[84, 2, 0.9]", "3", "one house in feature space", "—"], ["[−16, −8]", "2", "—", "the gradient: direction of steepest loss increase"], ["[0.12, −0.33, …, 0.08]", "768", "a word's meaning (module 13)", "—"], ["[3, 4]", "2", "the point (3, 4)", "an arrow of length 5"]],
      },
      caption: "Same object, two readings. Points for similarity, arrows for direction.",
    },
    everyday: {
      title: "A shopping list as a vector",
      text: "Write a shopping list in a fixed order: [milk, bread, eggs, apples]. Your week is [2, 1, 12, 6]. Your neighbour's is [1, 2, 6, 10]. Add them and you have the combined order; subtract and you see how your habits differ. Two households with close vectors shop alike. A supermarket's recommendation model sees every customer as exactly this kind of vector, with thousands of products instead of four.",
    },
    engineering: {
      title: "Anomaly detection as distance between vectors",
      text: "A security team represents each server session as a vector: [requests per minute, distinct endpoints, bytes sent, failed logins, hours since last login]. Normal sessions cluster in one region of this five-dimensional space. Each new session's vector is compared with the centre of the normal cluster; if its distance exceeds a threshold, it is flagged. One flagged session had [900, 40, 2e6, 0, 0.1]: far from the normal [30, 5, 5e4, 0, 20] in nearly every dimension. It was a scraper. The whole detector is vector subtraction and a length.",
    },
    maths: {
      formula: "a + b = [a₁+b₁, …, aₙ+bₙ];   c·a = [c·a₁, …, c·aₙ];   ‖a‖ = √(a₁² + … + aₙ²);   dist(a, b) = ‖a − b‖",
      meaning: "Element-wise addition and scaling; length by the square root of the sum of squares; distance as the length of the difference.",
      worked: [
        "a = [3, 4]: ‖a‖ = √(9 + 16) = √25 = 5.",
        "Sessions: normal centre n = [30, 5], new session s = [90, 45] (requests per minute, distinct endpoints).",
        "s − n = [60, 40]. Distance = √(3,600 + 1,600) = √5,200 ≈ 72.1.",
        "A typical session t = [34, 7]: t − n = [4, 2], distance = √(16 + 4) ≈ 4.5. The new session is sixteen times further from normal.",
      ],
      note: "Features with big numbers dominate distance; real systems rescale each feature first (lesson 1.8 saw this with k-means).",
    },
    code: {
      title: "Vector arithmetic with plain lists",
      lang: "py",
      src: `import math

def add(a, b):      return [x + y for x, y in zip(a, b)]
def scale(c, a):    return [c * x for x in a]
def norm(a):        return math.sqrt(sum(x * x for x in a))
def distance(a, b): return norm([x - y for x, y in zip(a, b)])

normal = [30, 5]
session = [90, 45]
typical = [34, 7]

print(add([1, 2], [3, 4]), scale(2, [1, 2]), norm([3, 4]))
print(round(distance(session, normal), 1), round(distance(typical, normal), 1))`,
      lines: [
        { code: "def add(a, b):      return [x + y for x, y in zip(a, b)]", say: "Element by element. Vectors must have the same length." },
        { code: "def norm(a):        return math.sqrt(sum(x * x for x in a))", say: "Length: Pythagoras in any number of dimensions." },
        { code: "def distance(a, b): return norm([x - y for x, y in zip(a, b)])", say: "Distance is the length of the difference. This one line is the heart of nearest-neighbour search." },
      ],
      output: "[4, 6] [2, 4] 5.0\n72.1 4.5",
    },
    useIt: "See every example, every gradient and every embedding as a vector. Similarity becomes distance or angle; a training step becomes 'move the parameter vector against the gradient vector'. Rescale features before measuring distances, or the largest-valued feature will decide everything.",
    takeaways: ["A vector is an ordered list of numbers: a point in feature space or an arrow.", "Add and scale element-wise; length by root of sum of squares; distance = length of the difference.", "Features, gradients and embeddings are vectors.", "Rescale features before comparing distances."],
    terms: [["vector", "an ordered list of numbers treated as one object"], ["dimension", "one position in the vector; also the vector's length as a count"], ["norm", "the length of a vector"], ["feature space", "the space where each example is a point"]],
    reflect: { q: "Two houses: [80, 2, 1.0] and [85, 2, 1.2] versus [80, 2, 1.0] and [80, 5, 1.0]. Which pair is closer, and does that match intuition?", a: "First pair: difference [5, 0, 0.2], distance ≈ 5.0. Second: [0, 3, 0], distance 3. The maths says the second pair is closer, but three extra bedrooms is a bigger real difference than five square metres. The raw scale of 'area' dwarfs 'bedrooms'; rescaling each feature fixes this." },
  },

  "m03-matrices": {
    simple: "A matrix is a grid of numbers with rows and columns; a dataset is a matrix, and so is a layer's set of weights.",
    concept:
      "A **matrix** is a rectangular grid of numbers. Its **shape** is rows × columns: a 3 × 4 matrix has 3 rows and 4 columns, 12 numbers in all. A matrix is a rank-2 tensor (lesson 2.9); a vector is a matrix with one column (or one row).\n\nTwo matrices appear in every model. The data matrix X: one row per example, one column per feature, so a dataset of 10,000 houses with 4 features is 10,000 × 4. And the weight matrix W of a layer: one row per input and one column per output, so a layer that turns 4 inputs into 8 outputs has a 4 × 8 weight matrix holding 32 weights. Read W[i][j] as 'how much input i contributes to output j'.\n\nMatrices have element-wise arithmetic like vectors (add two of the same shape, scale by a number) and one special operation, matrix multiplication, which is how a whole layer is applied to a whole batch in one go. That operation is the next lesson.",
    why:
      "Models do the same calculation for every example and every output. Writing that as a matrix keeps it compact and lets hardware do it in parallel. A linear model applied to 10,000 houses is one matrix operation instead of 10,000 loops; a neural network is a chain of matrix operations. Graphics cards are, at heart, matrix-multiplication machines, and the sizes of a model's matrices are what 'parameter count' counts.\n\nMatrices also organise thinking: when you know every layer is 'a weight matrix of shape inputs × outputs', you can size any network by reading its shapes.",
    how: [
      "Write the grid; note its shape as rows × columns.",
      "Index an element by row then column: W[1][2] is row 1, column 2 (counting from 0 in code).",
      "Add or subtract matrices of the same shape element by element; scale by a number.",
      "Transpose: swap rows and columns, so a 3 × 4 becomes a 4 × 3. Written Wᵀ.",
      "For a layer: inputs × outputs weights, plus one bias per output. Parameter count = rows × columns + outputs.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Matrix", "Shape", "Rows mean", "Columns mean", "Numbers"],
        rows: [["data X", "10,000 × 4", "examples", "features", "40,000"], ["weights W of a layer", "4 × 8", "inputs", "outputs", "32"], ["an image (greyscale)", "28 × 28", "pixel rows", "pixel columns", "784"], ["attention scores (module 15)", "tokens × tokens", "which token is looking", "which token is looked at", "tokens²"]],
      },
      caption: "Rows and columns always mean something. Naming them is half of understanding a model's shapes.",
    },
    everyday: {
      title: "A timetable",
      text: "A school timetable is a matrix: rows are periods, columns are days, each cell is a subject. You index it by row and column ('Tuesday, period 3'). Transpose it and you get days as rows, periods as columns: same information, different layout. Two teachers' timetables can be compared cell by cell. Nobody is frightened of a timetable; a weight matrix is a timetable of numbers.",
    },
    engineering: {
      title: "Reading a model's shapes to size it",
      text: "An engineer inspects a saved image classifier and lists its weight matrices: 784 × 256, 256 × 128, 128 × 10, with biases of 256, 128 and 10. Multiplying gives 200,704 + 32,768 + 1,280 = 234,752 weights, plus 394 biases: about 235,000 parameters, under 1 MB at 32-bit. They can now say it will run comfortably on a phone, and that the first matrix (784 inputs are the 28 × 28 pixels) holds 85 percent of the parameters, so that is where to look if the model is too big. All from shapes.",
    },
    maths: {
      formula: "A is m × n; A[i][j] is row i, column j;   (A + B)[i][j] = A[i][j] + B[i][j];   (Aᵀ)[i][j] = A[j][i];   layer parameters = inputs × outputs + outputs",
      meaning: "m rows, n columns. Addition is element-wise and needs matching shapes. Transposing swaps the indices.",
      worked: [
        "W = [[1, 2, 3], [4, 5, 6]] is 2 × 3. W[0][2] = 3; W[1][0] = 4.",
        "Wᵀ = [[1, 4], [2, 5], [3, 6]] is 3 × 2.",
        "A layer from 784 inputs to 256 outputs: 784 × 256 = 200,704 weights + 256 biases = 200,960 parameters.",
        "Three such layers in the classifier above total 234,752 + 394 = 235,146 parameters ≈ 0.94 MB at 4 bytes each.",
      ],
    },
    code: {
      title: "Matrices as lists of rows",
      lang: "py",
      src: `W = [[1, 2, 3],
     [4, 5, 6]]                       # 2 rows x 3 columns

def shape(M):     return (len(M), len(M[0]))
def transpose(M): return [[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]
def params(shapes): return sum(r * c + c for r, c in shapes)   # weights + one bias per output

print(shape(W), W[0][2], W[1][0])
print(transpose(W), shape(transpose(W)))
print(params([(784, 256), (256, 128), (128, 10)]))`,
      lines: [
        { code: "W = [[1, 2, 3],", say: "A matrix as a list of rows. Each inner list is one row." },
        { code: "def transpose(M): return [[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]", say: "Swap rows and columns: the new row j is the old column j." },
        { code: "def params(shapes): return sum(r * c + c for r, c in shapes)   # weights + one bias per output", say: "Parameter counting from shapes alone: rows × columns of weights plus a bias per column." },
      ],
      output: "(2, 3) 3 4\n[[1, 4], [2, 5], [3, 6]] (3, 2)\n235146",
    },
    useIt: "Whenever you meet a model, write down its matrices and their shapes with what rows and columns mean. Parameter counts, memory needs and most shape bugs fall out of that list. In code, keep the shape of every matrix in a comment.",
    takeaways: ["A matrix is a rows × columns grid; index by row then column.", "Data: examples × features. Layer weights: inputs × outputs.", "Element-wise add and scale need matching shapes; transpose swaps rows and columns.", "Parameters of a layer = inputs × outputs + outputs."],
    terms: [["matrix", "a grid of numbers with rows and columns"], ["shape", "rows × columns"], ["transpose", "the matrix with rows and columns swapped"], ["weight matrix", "a layer's grid of weights, inputs × outputs"]],
    reflect: { q: "A layer's weight matrix is 512 × 512 and the model has 48 such layers. Roughly how many parameters, and what is the file size at 16 bits?", a: "512 × 512 = 262,144 weights per layer, ×48 ≈ 12.6 million, plus biases (48 × 512 ≈ 25,000, negligible). At 2 bytes each: about 25 MB. Real transformer layers have several matrices each, but the arithmetic is the same." },
  },

  "m03-matrix-multiplication": {
    simple: "Matrix multiplication applies every weight to every input for every example in one operation: each output cell is a row of the left matrix dotted with a column of the right.",
    concept:
      "**Matrix multiplication** combines two matrices into a third. To compute cell (i, j) of the result, take row i of the left matrix and column j of the right, multiply them element by element and add up. For this to work, the left matrix's column count must equal the right matrix's row count: an m × n matrix times an n × p matrix gives an m × p result.\n\nIn a model, X (examples × features) times W (features × outputs) gives predictions (examples × outputs). Row i of X is one example's features; column j of W is the weights for output j; their product-and-sum is exactly the weighted sum from lesson 2.8. So one multiplication computes every example's every output at once. Add the bias vector to each row and you have a whole linear layer.\n\nThe order matters: X·W is not W·X, and often only one of them has matching shapes. Shape checking is the first thing to do when a multiplication fails.",
    why:
      "A neural network is nothing but matrix multiplications with bends between them, and a transformer processing a sentence does hundreds of them per token. Writing the weighted sum as a matrix product lets the whole batch and the whole layer be computed by hardware designed for exactly that: a GPU multiplies large matrices thousands of times faster than a loop in Python. The parameter count and the compute cost of a model are both read off its matrix shapes.",
    how: [
      "Check shapes: left is m × n, right must be n × p. The result is m × p.",
      "For each row i of the left and each column j of the right, multiply corresponding elements and sum: result[i][j] = Σₖ left[i][k] × right[k][j].",
      "Repeat for all m × p cells; each takes n multiplications, so the whole product costs m × n × p multiplications.",
      "For a layer: result = X·W, then add the bias to every row.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "X (2 houses × 3 features)", detail: "[[80, 2, 1.0], [120, 4, 3.0]]" },
        { label: "W (3 features × 1 output)", detail: "[[2.1], [15], [−9]]  (per m², per bedroom, per km)" },
        { label: "row 0 · column 0", detail: "80×2.1 + 2×15 + 1.0×(−9) = 168 + 30 − 9 = 189" },
        { label: "row 1 · column 0", detail: "120×2.1 + 4×15 + 3.0×(−9) = 252 + 60 − 27 = 285" },
        { label: "X·W (2 × 1), then + bias 40", detail: "[[229], [325]]: both houses' prices (in thousands), one operation" },
      ],
      caption: "Each cell of the result is one row dotted with one column. Shapes: (2 × 3)·(3 × 1) = (2 × 1).",
    },
    everyday: {
      title: "Costing several recipes at once",
      text: "Rows: recipes, with how much flour, sugar and butter each needs. Columns of the second table: the price per gram at two shops. Multiplying gives a table of recipe × shop costs: every recipe costed at every shop in one sweep, each cell a sum of quantity times price. Change a shop's prices and recompute the whole table in one go. That is matrix multiplication, and a spreadsheet does it with one formula.",
    },
    engineering: {
      title: "Why GPUs became AI hardware",
      text: "A speech model's main layer multiplies a 1,024 × 4,096 input block by a 4,096 × 4,096 weight matrix: about 17 billion multiplications per batch. A CPU core doing a few billion per second would take seconds; a GPU with thousands of small cores does it in a millisecond, because every cell of the result is independent and can be computed in parallel. The team's entire optimisation effort is keeping those matrices full and the GPU busy. Matrix multiplication is not one operation among many in deep learning; it is where nearly all the time goes.",
    },
    maths: {
      formula: "(X·W)[i][j] = Σₖ X[i][k] · W[k][j];   shapes: (m × n)·(n × p) = (m × p);   cost: m·n·p multiplications",
      meaning: "k runs over the shared dimension (features). Each result cell is a dot product of a row and a column.",
      worked: [
        "X = [[80, 2, 1], [120, 4, 3]] (2 × 3), W = [[2.1], [15], [−9]] (3 × 1). Shared dimension 3 matches.",
        "Cell (0,0): 80·2.1 + 2·15 + 1·(−9) = 168 + 30 − 9 = 189.",
        "Cell (1,0): 120·2.1 + 4·15 + 3·(−9) = 252 + 60 − 27 = 285.",
        "Result (2 × 1): [[189], [285]]. Add bias 40 to each: [[229], [325]]. Cost: 2 × 3 × 1 = 6 multiplications.",
        "Try W·X: (3 × 1)·(2 × 3): inner dimensions 1 and 2 do not match. Undefined. Order matters.",
      ],
    },
    code: {
      title: "Matrix multiplication by hand, then a whole layer",
      lang: "py",
      src: `def matmul(A, B):
    n = len(B)
    assert len(A[0]) == n, f"shape mismatch: {len(A)}x{len(A[0])} times {n}x{len(B[0])}"
    return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(len(B[0]))] for i in range(len(A))]

X = [[80, 2, 1.0],
     [120, 4, 3.0]]                 # 2 houses x 3 features
W = [[2.1], [15], [-9]]             # 3 features x 1 output
b = [40]

out = matmul(X, W)
preds = [[cell + b[j] for j, cell in enumerate(row)] for row in out]
print(out)
print(preds)                        # every house's price in one go`,
      lines: [
        { code: "assert len(A[0]) == n, f\"shape mismatch: {len(A)}x{len(A[0])} times {n}x{len(B[0])}\"", say: "The shape rule: the left's columns must equal the right's rows. Most matrix bugs stop here." },
        { code: "return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(len(B[0]))] for i in range(len(A))]", say: "Every cell: row i of A dotted with column j of B. Three nested loops; GPUs do them in parallel." },
        { code: "preds = [[cell + b[j] for j, cell in enumerate(row)] for row in out]", say: "Add the bias to each output. X·W + b is one linear layer applied to a whole batch." },
      ],
      output: "[[189.0], [285.0]]\n[[229.0], [325.0]]",
    },
    useIt: "Read every layer as X·W + b and check the shapes before anything else: (batch × inputs)·(inputs × outputs). Estimate compute from m × n × p. When a library reports a shape error, line up the inner dimensions; when a model is slow, find its biggest matrix product.",
    takeaways: ["Result cell = row of left dotted with column of right; inner dimensions must match.", "(m × n)·(n × p) = (m × p), costing m·n·p multiplications.", "A linear layer on a batch is X·W + b: one multiplication for everything.", "Order matters; GPUs exist for this operation."],
    terms: [["matrix multiplication", "combining matrices by row-times-column sums"], ["inner dimension", "the shared size that must match"], ["batch computation", "processing all examples in one matrix operation"], ["FLOPs of a layer", "roughly 2 × m × n × p"]],
    reflect: { q: "A layer takes 768 inputs to 3,072 outputs, and a batch holds 512 tokens. How many multiplications for one pass, and what shape is the result?", a: "(512 × 768)·(768 × 3,072): 512 × 768 × 3,072 ≈ 1.2 billion multiplications; result 512 × 3,072. A transformer has dozens of such layers per token batch, which is why the arithmetic is counted in billions of FLOPs." },
  },

  "m03-dot-product": {
    simple: "The dot product multiplies two vectors element by element and adds the results into one number that measures how aligned they are; it is the weighted sum and the heart of attention.",
    concept:
      "The **dot product** of two vectors of the same length is a single number: multiply matching elements and add. [1, 2, 3] · [4, 5, 6] = 4 + 10 + 18 = 32. You have already used it twice without the name: a linear model's weighted sum is weights · features, and each cell of a matrix product is a row dotted with a column.\n\nIts geometric meaning is what makes it everywhere. The dot product equals the product of the two lengths times the cosine of the angle between them. Same direction: large positive. At right angles: zero. Opposite: large negative. So for vectors of similar length, the dot product is a similarity score: 'how much do these point the same way?'. Divide by both lengths and you get the cosine itself, from −1 to 1, the **cosine similarity** that module 13 uses to compare meanings.\n\nIn a transformer, every attention score (module 15) is a dot product between a query vector and a key vector: 'how relevant is that token to this one?'.",
    why:
      "Models constantly need one number that says how well two lists of numbers match: how well a set of features matches a set of weights, how similar two embeddings are, how much one token should attend to another. The dot product is the cheapest such number (n multiplications and n additions) and it has the right behaviour: it rewards agreement in every dimension and penalises disagreement. That is why it is the inner operation of linear layers, matrix multiplication, similarity search and attention alike.",
    how: [
      "Line up the two vectors; they must have the same length.",
      "Multiply element by element.",
      "Add the products: that is the dot product.",
      "To get a similarity between −1 and 1, divide by the product of the two lengths (cosine similarity).",
      "Interpret: positive means aligned, zero means unrelated (orthogonal), negative means opposed.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["a", "b", "a · b", "cosine similarity", "Reading"],
        rows: [["[1, 0]", "[1, 0]", "1", "1.00", "same direction"], ["[1, 0]", "[0, 1]", "0", "0.00", "unrelated (right angle)"], ["[1, 0]", "[−1, 0]", "−1", "−1.00", "opposite"], ["[3, 4]", "[6, 8]", "50", "1.00", "same direction, different lengths"], ["[2, 1]", "[1, 2]", "4", "0.80", "fairly aligned"]],
      },
      caption: "The dot product grows with alignment and with length; cosine similarity keeps only the alignment.",
    },
    everyday: {
      title: "Matching a job to a candidate",
      text: "A job wants skills [Python 5, SQL 3, writing 2]; a candidate has [Python 4, SQL 4, writing 0]. Multiply and add: 20 + 12 + 0 = 32. Another candidate [1, 1, 5]: 5 + 3 + 10 = 18. The first fits better, and the number says so, by rewarding strength exactly where the job cares. That is a dot product; a recruiter does it by eye, a recommendation system does it a million times a second.",
    },
    engineering: {
      title: "Similar-product search with dot products",
      text: "An online retailer represents every product as a 256-number vector learned from browsing data (module 13 shows how). 'Customers who viewed this also viewed' is computed by taking the current product's vector and dot-producting it with every other product's vector, normalised to cosine similarity, then showing the top ten. For 200,000 products that is 200,000 dot products of length 256, about 50 million multiplications, done in milliseconds as one matrix-vector product. The entire recommendation feature is 'which vectors point the same way as this one?'.",
    },
    maths: {
      formula: "a · b = Σᵢ aᵢbᵢ = ‖a‖ ‖b‖ cos θ;   cosine similarity = (a · b) ÷ (‖a‖ ‖b‖)",
      meaning: "θ is the angle between the vectors. The cosine is 1 at 0°, 0 at 90°, −1 at 180°.",
      worked: [
        "a = [3, 4], b = [6, 8]. a · b = 18 + 32 = 50.",
        "‖a‖ = 5, ‖b‖ = 10. Cosine = 50 ÷ (5 × 10) = 1.0: exactly the same direction (b is 2a).",
        "a = [2, 1], c = [1, 2]. a · c = 2 + 2 = 4. ‖a‖ = ‖c‖ = √5 ≈ 2.236. Cosine = 4 ÷ 5 = 0.8: aligned but not identical.",
        "a = [2, 1], d = [−1, 2]. a · d = −2 + 2 = 0: orthogonal, no alignment at all.",
      ],
    },
    code: {
      title: "Dot product and cosine similarity",
      lang: "py",
      src: `import math

def dot(a, b):    return sum(x * y for x, y in zip(a, b))
def norm(a):      return math.sqrt(dot(a, a))
def cosine(a, b): return dot(a, b) / (norm(a) * norm(b))

job = [5, 3, 2]                     # how much the job wants Python, SQL, writing
cand1 = [4, 4, 0]
cand2 = [1, 1, 5]
print(dot(job, cand1), dot(job, cand2))

print(round(cosine([3, 4], [6, 8]), 2), round(cosine([2, 1], [1, 2]), 2), round(cosine([2, 1], [-1, 2]), 2))`,
      lines: [
        { code: "def dot(a, b):    return sum(x * y for x, y in zip(a, b))", say: "Multiply matching elements, add. The weighted sum from module 2 is this with weights and features." },
        { code: "def norm(a):      return math.sqrt(dot(a, a))", say: "A vector's length is the square root of its dot product with itself." },
        { code: "def cosine(a, b): return dot(a, b) / (norm(a) * norm(b))", say: "Divide out the lengths and only the angle remains: a similarity from −1 to 1." },
      ],
      output: "32 18\n1.0 0.8 0.0",
    },
    useIt: "Recognise the dot product wherever it hides: a weighted sum, a matrix-product cell, an attention score, a similarity. When comparing things by meaning, use cosine similarity so length does not dominate. When speed matters, remember a million dot products is one matrix multiplication.",
    takeaways: ["Dot product: multiply element-wise, add; one number for two vectors.", "Equals length × length × cos(angle): a measure of alignment.", "Cosine similarity divides out the lengths: −1 to 1.", "It is the weighted sum, the matrix-product cell, the attention score and the similarity search."],
    terms: [["dot product", "the sum of element-wise products of two vectors"], ["cosine similarity", "the dot product divided by both lengths"], ["orthogonal", "at right angles; dot product zero"], ["alignment", "how much two vectors point the same way"]],
    reflect: { q: "Why does similarity search usually use cosine similarity rather than the raw dot product?", a: "Because raw dot products grow with vector length, so a long vector would look 'similar' to everything. Cosine keeps only the direction, which is what carries meaning in embeddings. Many systems normalise all vectors to length 1 first, after which dot product and cosine are the same thing and the search is a single matrix multiplication." },
  },

  "m03-probability": {
    simple: "Probability is a number from 0 to 1 for how likely something is; models output probabilities so that their confidence can be measured, compared and combined.",
    concept:
      "A **probability** measures how likely an outcome is, on a scale from 0 (impossible) to 1 (certain). Across all the possible outcomes of a question, the probabilities add up to 1. A fair coin: heads 0.5, tails 0.5. An email: spam 0.92, not spam 0.08.\n\nModels that classify do not really answer 'spam'; they answer 'spam with probability 0.92', and a threshold turns that into a decision. Language models go further: for the next token they output a probability for every word in the vocabulary, tens of thousands of numbers summing to 1, and generation is drawing from that list (module 18).\n\nTwo rules do most of the work. For independent events, the probability that both happen is the product: P(A and B) = P(A) × P(B). The probability of A given that B is known to be true is the **conditional probability** P(A | B), read 'A given B', which is how a language model's 'next token given the previous ones' is written.",
    why:
      "A plain yes/no answer hides how sure the model is, and sureness is what decisions need: a fraud score of 0.51 and one of 0.99 both say 'fraud' but deserve different treatment. Probabilities make confidence a number, so thresholds can be tuned, rare events can be reasoned about, and many small uncertainties can be combined by multiplication. They are also what the main loss function for classification (module 4) is built on: it punishes a confident wrong probability much more than a hesitant one.",
    how: [
      "List the possible outcomes of the question.",
      "Assign each a number from 0 to 1 so that they add up to 1. From data: count how often each outcome occurred and divide by the total.",
      "For 'both A and B' with independent events, multiply.",
      "For 'A given B', restrict to the cases where B holds and recount: P(A | B) = P(A and B) ÷ P(B).",
      "Turn a probability into a decision with a threshold chosen for the costs involved; keep the probability for anything downstream.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Question", "Outcomes and probabilities", "Sum"],
        rows: [["fair coin", "heads 0.5, tails 0.5", "1"], ["this email", "spam 0.92, not spam 0.08", "1"], ["next token after 'the cat sat on the'", "mat 0.31, floor 0.12, sofa 0.09, … (50,000 entries)", "1"], ["die roll", "1 to 6, each ≈ 0.167", "1"]],
      },
      caption: "Every model output over a set of classes is a list like these: numbers from 0 to 1 that add to 1.",
    },
    everyday: {
      title: "The weather forecast",
      text: "'70 percent chance of rain' is a probability. It does not say it will rain; it says that on days like this, it rains about seven times in ten. You use it with a threshold: above 50 percent you take an umbrella. A forecast that only said 'rain' or 'dry' would be less useful, because you could not decide differently for 55 percent and 95 percent.",
    },
    engineering: {
      title: "Thresholds on a fraud probability",
      text: "A payments company's model outputs a fraud probability. The ops team sets three thresholds: below 0.3, approve; 0.3 to 0.9, approve but queue for review; above 0.9, decline and alert. The thresholds come from costs: a missed fraud costs the full amount, a wrongly declined customer costs future business. Shifting the top threshold from 0.9 to 0.8 catches 12 percent more fraud and doubles the false declines. The probability lets the business make that choice; a bare 'fraud' label would not.",
    },
    maths: {
      formula: "P(A) = count(A) ÷ total;   P(A and B) = P(A) × P(B) for independent A, B;   P(A | B) = P(A and B) ÷ P(B)",
      meaning: "Probabilities from data are frequencies. Independence means one event does not change the other's chance. The conditional formula restricts the world to cases where B happened.",
      worked: [
        "Out of 10,000 emails, 1,500 were spam: P(spam) = 0.15.",
        "Two independent fair coins both heads: 0.5 × 0.5 = 0.25.",
        "Of the 1,500 spam emails, 1,200 contain a link; of the 8,500 others, 1,700 do. P(link | spam) = 1,200 ÷ 1,500 = 0.8; P(link | not spam) = 1,700 ÷ 8,500 = 0.2.",
        "P(spam | link): spam-with-link is 1,200 out of 2,900 emails with links: 1,200 ÷ 2,900 ≈ 0.41. A link raises the spam probability from 0.15 to 0.41.",
      ],
    },
    code: {
      title: "Probabilities from counts, and a conditional",
      lang: "py",
      src: `emails = 10_000
spam = 1_500
spam_with_link = 1_200
ham_with_link = 1_700

p_spam = spam / emails
p_link_given_spam = spam_with_link / spam
p_link_given_ham = ham_with_link / (emails - spam)
p_spam_given_link = spam_with_link / (spam_with_link + ham_with_link)

print("P(spam) =", p_spam)
print("P(link | spam) =", p_link_given_spam, " P(link | not spam) =", p_link_given_ham)
print("P(spam | link) =", round(p_spam_given_link, 3))
print("two heads:", 0.5 * 0.5)`,
      lines: [
        { code: "p_spam = spam / emails", say: "A probability from data: how often it happened, divided by the total." },
        { code: "p_link_given_spam = spam_with_link / spam", say: "Conditional: restrict to the spam emails, then count links among them." },
        { code: "p_spam_given_link = spam_with_link / (spam_with_link + ham_with_link)", say: "The reverse conditional: restrict to emails with links, then count spam among them. This is what a classifier estimates." },
      ],
      output: "P(spam) = 0.15\nP(link | spam) = 0.8  P(link | not spam) = 0.2\nP(spam | link) = 0.414\ntwo heads: 0.25",
    },
    useIt: "Keep model outputs as probabilities for as long as possible and threshold at the last moment, with thresholds chosen from costs. Read 'P(next token | previous tokens)' as the thing a language model computes. When combining independent chances, multiply; when a condition is known, restrict and recount.",
    takeaways: ["Probability: 0 to 1; over all outcomes it sums to 1.", "From data, probability is a frequency: count ÷ total.", "Independent events multiply; conditionals restrict and recount.", "Models output probabilities; decisions come from thresholds."],
    terms: [["probability", "a number from 0 to 1 for how likely an outcome is"], ["conditional probability P(A | B)", "the probability of A among the cases where B is true"], ["independent", "one event does not change the other's probability"], ["threshold", "the probability above which a decision is made"]],
    reflect: { q: "A model says 0.99 spam for an email that is not spam, and 0.55 spam for another that is not spam. Which mistake is worse, and why does that matter for training?", a: "The 0.99 one: the model was confidently wrong. A good loss for classification (module 4's cross-entropy) punishes the confident mistake far more than the hesitant one, so training pushes the model to be sure only when it has reason to be." },
  },

  "m03-mean-variance-and-standard-deviation": {
    simple: "The mean is the average; the variance is the average squared distance from the mean; the standard deviation is its square root, a spread in the original units.",
    concept:
      "Three numbers summarise a list of values. The **mean** is the familiar average: add everything, divide by the count. It says where the values are centred.\n\nThe **variance** says how spread out they are: for each value take its distance from the mean, square it (so negatives do not cancel positives and big distances count more), and average those squares. The **standard deviation** is the square root of the variance, which brings the spread back to the original units: a standard deviation of 4 minutes means deliveries typically land within a few minutes of the mean.\n\nThese three appear throughout machine learning. The mean squared error (module 4) is a variance of the errors. Features are rescaled by subtracting the mean and dividing by the standard deviation so that every feature has a similar range, which training needs. Batch normalisation (module 9) does the same inside the network, on the fly.",
    why:
      "A single number like 'average delivery time 30 minutes' hides whether deliveries are all within 28 to 32 or scattered between 10 and 60. The spread is often the more important fact: it is what makes a promise reliable or a feature noisy. Standard deviation gives spread a number in units people understand.\n\nFor training, spread matters because gradient descent struggles when one feature ranges over thousands and another over fractions (lesson 2.6 saw b crawl for this reason). Standardising every feature to mean 0 and standard deviation 1 puts them on an equal footing.",
    how: [
      "Mean: μ = (sum of values) ÷ n.",
      "Deviations: each value minus μ.",
      "Variance: σ² = (sum of squared deviations) ÷ n.",
      "Standard deviation: σ = √σ².",
      "Standardise a value: z = (value − μ) ÷ σ, the number of standard deviations above or below the mean.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Delivery minutes", "Deviation from mean 30", "Squared"],
        rows: [["26", "−4", "16"], ["28", "−2", "4"], ["30", "0", "0"], ["32", "2", "4"], ["34", "4", "16"], ["mean = 30", "sum = 0", "sum = 40 → variance 8 → sd ≈ 2.83"]],
      },
      caption: "Deviations always sum to zero, which is why they are squared. The square root returns the spread to minutes.",
    },
    everyday: {
      title: "Two bus routes with the same average",
      text: "Route A arrives in 20, 21, 19, 20, 20 minutes. Route B: 10, 30, 15, 25, 20. Both average 20. Route A's standard deviation is under 1 minute; Route B's is about 7. If you have a train to catch, the average is useless and the spread is everything. You already judge reliability by spread; variance is the number for it.",
    },
    engineering: {
      title: "Standardising features before training",
      text: "A churn model has features 'monthly spend' (mean £42, standard deviation £30) and 'support calls' (mean 1.2, standard deviation 1.5). Trained raw, the spend feature's gradient is twenty times larger and training zigzags for hours. The team standardises both: each value becomes (value − mean) ÷ sd, computed from the training set only and applied identically at inference. Training converges in minutes, and the learned weights become comparable: a weight of 0.8 on standardised spend and 0.3 on standardised calls means spend matters more, per standard deviation. The same means and sds are saved with the model, because production inputs must be standardised the same way.",
    },
    maths: {
      formula: "μ = Σxᵢ ÷ n;   σ² = Σ(xᵢ − μ)² ÷ n;   σ = √σ²;   z = (x − μ) ÷ σ",
      meaning: "μ (mu) is the mean, σ² (sigma squared) the variance, σ the standard deviation, z the standardised value.",
      worked: [
        "Values 26, 28, 30, 32, 34: sum 150, n = 5, μ = 30.",
        "Deviations −4, −2, 0, 2, 4; squares 16, 4, 0, 4, 16; sum 40; σ² = 8.",
        "σ = √8 ≈ 2.83 minutes.",
        "A delivery of 36 minutes: z = (36 − 30) ÷ 2.83 ≈ 2.1 standard deviations above the mean: unusually slow.",
        "Route B (10, 30, 15, 25, 20): μ = 20, deviations −10, 10, −5, 5, 0, squares 100, 100, 25, 25, 0, σ² = 50, σ ≈ 7.07.",
      ],
      note: "Some formulas divide by n − 1 instead of n when estimating from a sample; for large n the difference is negligible.",
    },
    code: {
      title: "Mean, variance, standard deviation, standardisation",
      lang: "py",
      src: `import math

def mean(xs):     return sum(xs) / len(xs)
def variance(xs):
    m = mean(xs)
    return sum((x - m) ** 2 for x in xs) / len(xs)
def sd(xs):       return math.sqrt(variance(xs))
def standardise(xs):
    m, s = mean(xs), sd(xs)
    return [round((x - m) / s, 2) for x in xs]

route_a = [20, 21, 19, 20, 20]
route_b = [10, 30, 15, 25, 20]
print(mean(route_a), mean(route_b))
print(round(sd(route_a), 2), round(sd(route_b), 2))

spend = [10, 42, 100, 42, 16]
print(standardise(spend))`,
      lines: [
        { code: "return sum((x - m) ** 2 for x in xs) / len(xs)", say: "Variance: average of the squared deviations. Squaring stops the negatives cancelling." },
        { code: "def sd(xs):       return math.sqrt(variance(xs))", say: "Back to the original units with a square root." },
        { code: "return [round((x - m) / s, 2) for x in xs]", say: "Standardising: each value as 'how many standard deviations from the mean'. Features go into models in this form." },
      ],
      output: "20.0 20.0\n0.63 7.07\n[-1.01, 0.0, 1.82, 0.0, -0.82]",
    },
    useIt: "Report a spread with every average. Standardise features using the training set's mean and standard deviation, save those numbers with the model, and apply them identically in production. Read 'z = 3' as 'three standard deviations out: rare', which is the basis of many anomaly detectors.",
    takeaways: ["Mean: the centre. Variance: average squared deviation. Standard deviation: its square root, in original units.", "Mean squared error is a variance of errors.", "Standardise features: (x − μ) ÷ σ, with μ and σ from training data, reused at inference.", "A z-score says how unusual a value is."],
    terms: [["mean (μ)", "the average"], ["variance (σ²)", "the average squared distance from the mean"], ["standard deviation (σ)", "the square root of variance"], ["standardisation / z-score", "rescaling to mean 0 and standard deviation 1"]],
    reflect: { q: "A team standardises their test set using the test set's own mean and standard deviation. What is wrong?", a: "At inference time a single new example has no 'set' to compute a mean from; it must be standardised with the training set's numbers, which the model learned under. Using test statistics also leaks information about the test distribution into evaluation. Compute μ and σ once on training data and reuse them everywhere." },
  },

  "m03-probability-distributions": {
    simple: "A probability distribution lists every possible outcome with its probability; a model's output over classes or tokens is one, and the bell curve describes most measurements.",
    concept:
      "A **probability distribution** is the full picture of a random quantity: every value it could take, each with its probability, all adding up to 1. For a die it is six bars of height 1/6. For a classifier it is one bar per class: [spam 0.92, not spam 0.08]. For a language model it is fifty thousand bars, one per token, most of them tiny.\n\nWhen the quantity is a continuous number, like a delivery time, the distribution is a curve, and probabilities are areas under it (integration, lesson 3.7). The most important curve is the **normal distribution**, the bell curve, described by just a mean and a standard deviation: about 68 percent of values fall within one standard deviation of the mean, 95 percent within two, 99.7 percent within three. Measurement noise, heights, errors of a reasonable model: all roughly normal.\n\nA distribution's spread is its uncertainty. A model whose output distribution puts 0.98 on one class is confident; one spread evenly over ten classes knows nothing. Temperature (module 18) is a dial that sharpens or flattens the output distribution before sampling from it.",
    why:
      "A single number cannot express uncertainty; a distribution can. Saying 'the delivery will take 30 minutes' invites complaints at 36; saying 'mean 30, standard deviation 3, so 95 percent arrive within 24 to 36' lets a product show an honest window. For models, the output distribution is the whole answer: generation samples from it, calibration asks whether its probabilities are honest, and the loss (module 4) compares it with the true outcome.\n\nThe normal distribution matters because so many things follow it, which lets a mean and standard deviation stand in for an entire curve.",
    how: [
      "Identify the quantity and its possible values: classes, tokens, or a range of numbers.",
      "Discrete case: assign a probability to each value, summing to 1. From data: count and divide.",
      "Continuous case: describe the curve, often by its mean and standard deviation if roughly normal.",
      "Read probabilities as areas: P(between a and b) is the area under the curve from a to b.",
      "Use the distribution: pick the most likely value, sample from it, or report an interval.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Distribution", "Values", "Probabilities", "Shape"],
        rows: [["die", "1–6", "1/6 each", "flat bars"], ["classifier output", "spam, not spam", "0.92, 0.08", "two bars, one tall"], ["next token", "50,000 tokens", "mat 0.31, floor 0.12, … tail of tiny values", "one spike, long tail"], ["delivery minutes", "any number", "bell curve, μ = 30, σ = 3", "68% in 27–33, 95% in 24–36"]],
      },
      caption: "Discrete distributions are bars; continuous ones are curves. Both sum (or integrate) to 1.",
    },
    everyday: {
      title: "Shoe sizes in a shop",
      text: "A shoe shop stocks most pairs in sizes 7 to 10 and few in size 4 or 13, because adult shoe sizes follow a bell curve around a mean. The buyer does not know who will walk in, but knows the distribution, and orders stock to match its shape. A model's output distribution is the same kind of knowledge: not which token comes next, but how likely each one is.",
    },
    engineering: {
      title: "Honest delivery windows from a distribution",
      text: "A delivery app once showed a single ETA and got complaints whenever it was wrong. The team changed the model to predict a mean and a standard deviation per order, checked that actual times were roughly normal around the mean, and showed a window of mean ± 2σ: '24 to 36 minutes'. Complaints about lateness fell by half with no change in actual delivery times. The information was always there; the distribution let them show it. They also monitor whether 95 percent of deliveries really land in the window; when it drops to 85 percent, the model's σ is too small and needs retraining.",
    },
    maths: {
      formula: "Σ P(x) = 1 over all outcomes;   normal: 68% within μ ± σ, 95% within μ ± 2σ, 99.7% within μ ± 3σ",
      meaning: "The sum-to-one rule defines a distribution. The 68/95/99.7 rule is the normal curve's shape in three numbers.",
      worked: [
        "Classifier output [0.92, 0.08]: sums to 1. Most likely class: spam.",
        "Delivery times normal with μ = 30, σ = 3: 95 percent of deliveries fall in 30 ± 6 = 24 to 36 minutes.",
        "A delivery at 40 minutes is (40 − 30) ÷ 3 = 3.3 standard deviations out: beyond the 99.7 percent band, rarer than 1 in 300. Investigate.",
        "A flat distribution over 10 classes gives each 0.1: maximum uncertainty. A spike of 0.98 on one class: near certainty.",
      ],
    },
    code: {
      title: "A discrete distribution from counts, and a normal check",
      lang: "py",
      src: `import math
from collections import Counter

next_words = ["mat"] * 31 + ["floor"] * 12 + ["sofa"] * 9 + ["roof"] * 5 + ["table"] * 3 + ["moon"] * 1 + ["other"] * 39
counts = Counter(next_words)
total = sum(counts.values())
dist = {w: c / total for w, c in counts.items()}
print({w: round(p, 2) for w, p in dist.items()})
print("sums to", round(sum(dist.values()), 6))

mu, sigma = 30, 3
def within(k):            # share of a normal distribution within k standard deviations
    return math.erf(k / math.sqrt(2))
print(round(within(1), 3), round(within(2), 3), round(within(3), 4))
print("window:", mu - 2 * sigma, "to", mu + 2 * sigma)`,
      lines: [
        { code: "dist = {w: c / total for w, c in counts.items()}", say: "Counts divided by the total: a distribution over next words. A language model produces this kind of table, but over its whole vocabulary." },
        { code: "print(\"sums to\", round(sum(dist.values()), 6))", say: "The defining property: the probabilities add to 1." },
        { code: "return math.erf(k / math.sqrt(2))", say: "The area under a normal curve within k standard deviations, using the error function. The 68/95/99.7 rule falls out." },
        { code: "print(\"window:\", mu - 2 * sigma, \"to\", mu + 2 * sigma)", say: "A 95 percent window: how a single prediction becomes an honest range." },
      ],
      output: "{'mat': 0.31, 'floor': 0.12, 'sofa': 0.09, 'roof': 0.05, 'table': 0.03, 'moon': 0.01, 'other': 0.39}\nsums to 1.0\n0.683 0.954 0.9973\nwindow: 24 to 36",
    },
    useIt: "Treat a model's output as a distribution, not a label: sample from it, threshold it, or report an interval. Check whether errors are roughly normal and whether stated probabilities are honest (if the model says 0.9, it should be right about 90 percent of the time). Use the 68/95/99.7 rule to turn a mean and standard deviation into a range people can plan around.",
    takeaways: ["A distribution: every outcome with its probability, summing to 1.", "Discrete: bars (classes, tokens). Continuous: curves (times, errors); probabilities are areas.", "The normal curve: mean and standard deviation; 68/95/99.7.", "Spread is uncertainty; model outputs are distributions to be sampled, thresholded or reported as ranges."],
    terms: [["probability distribution", "all outcomes with their probabilities"], ["normal distribution", "the bell curve, set by a mean and standard deviation"], ["discrete / continuous", "countable outcomes vs a range of numbers"], ["calibration", "whether stated probabilities match real frequencies"]],
    reflect: { q: "A language model's next-token distribution is [the 0.5, a 0.3, an 0.1, … tiny values]. What does 'greedy decoding' pick, and what would sampling do differently?", a: "Greedy picks 'the', the tallest bar, every time. Sampling draws from the distribution: 'the' half the time, 'a' three times in ten, occasionally something rarer. Module 18 adds temperature, which reshapes this distribution before the draw." },
  },
};

export const M03_QUIZ: Quiz[] = [
  {
    q: "In y = w·x + b with w = 0.05 and b = 12, which x gives y = 20?",
    options: ["400", "160", "8", "0.4"],
    answer: 1,
    why: ["That would need b = 0.", "Correct. Subtract 12 from both sides (8 = 0.05x), divide by 0.05: x = 160.", "8 is the intermediate value before dividing.", "No."],
  },
  {
    q: "The derivative of a loss with respect to a weight is −3. What should happen to the weight?",
    options: ["Decrease it", "Increase it", "Set it to zero", "Nothing can be concluded"],
    answer: 1,
    why: ["A negative derivative means increasing the weight lowers the loss.", "Correct. Move against the derivative: the slope is negative, so going right (increasing) goes downhill.", "Zero is not implied by the slope.", "The sign alone tells you the direction."],
    reason: true,
  },
  {
    q: "A loss function of two parameters has gradient [4, −1] at the current point. Which statement is right?",
    options: ["Both parameters should increase", "The loss rises fastest in the direction [4, −1], so step toward [−4, 1]", "The first parameter is at its minimum", "The gradient has no direction"],
    answer: 1,
    why: ["The first should decrease (positive slope), the second increase.", "Correct. The gradient points uphill; stepping against it is steepest descent.", "A partial of 4 means a steep slope, not a minimum.", "A gradient is a vector: it has direction and length."],
  },
  {
    q: "Which product is defined, and what shape does it give? A is 3 × 5, B is 5 × 2.",
    options: ["B·A, giving 5 × 5", "A·B, giving 3 × 2", "A·B, giving 5 × 5", "Both A·B and B·A"],
    answer: 1,
    why: ["B·A would need B's columns (2) to equal A's rows (3): undefined.", "Correct. A's columns (5) match B's rows (5); the result is A's rows × B's columns.", "The result takes the outer dimensions, 3 and 2.", "Only one order has matching inner dimensions."],
  },
  {
    q: "Two embedding vectors have cosine similarity 0.95. What does that tell you?",
    options: ["They have nearly the same length", "They point in nearly the same direction, so they likely mean similar things", "They are orthogonal", "One is the negative of the other"],
    answer: 1,
    why: ["Cosine ignores length entirely.", "Correct. Cosine near 1 means a small angle between them.", "Orthogonal would be 0.", "That would be −1."],
  },
  {
    q: "Of 2,000 transactions, 100 were fraud; 80 of those were at night; 300 of the 1,900 honest ones were at night. What is P(fraud | night)?",
    options: ["0.05", "0.8", "0.21", "0.16"],
    answer: 2,
    why: ["That is P(fraud) overall.", "That is P(night | fraud).", "Correct. Night transactions: 80 + 300 = 380; fraud among them: 80 ÷ 380 ≈ 0.21.", "No."],
    reason: true,
  },
  {
    q: "Two routes both average 20 minutes; one has standard deviation 1, the other 7. Which fact matters for catching a train, and why?",
    options: ["The mean; both are the same so the routes are equivalent", "The standard deviation; the low-spread route is reliable, the other is a gamble", "Neither; only the maximum matters", "The variance units are minutes"],
    answer: 1,
    why: ["Equal means hide very different reliability.", "Correct. Spread is uncertainty; a standard deviation of 7 means arrivals scattered over a 20-minute band.", "The maximum is one sample; spread summarises them all.", "Variance is in minutes squared; standard deviation is in minutes."],
  },
  {
    q: "Delivery times are normal with mean 30 and standard deviation 3. About what share of deliveries take between 24 and 36 minutes?",
    options: ["68%", "95%", "99.7%", "50%"],
    answer: 1,
    why: ["That is within one standard deviation: 27 to 33.", "Correct. 24 to 36 is μ ± 2σ.", "That is ± 3σ: 21 to 39.", "No."],
  },
];

export const M03_EXERCISES: Exercise[] = [
  {
    title: "Take a gradient step by hand",
    kind: "calculate",
    task: "A one-feature model y = w·x + b has w = 0.5, b = 1. One training example: x = 4, actual y = 10. Loss is the squared error. Compute the prediction, the error, the two partial derivatives, and the new w and b after one step with learning rate 0.02. Then compute the new loss.",
    hints: ["∂L/∂w = 2 · error · x;  ∂L/∂b = 2 · error.", "Step: parameter − rate × partial."],
    solution: "Prediction = 0.5·4 + 1 = 3. Error = 3 − 10 = −7. Loss = 49. ∂L/∂w = 2·(−7)·4 = −56; ∂L/∂b = −14. New w = 0.5 − 0.02·(−56) = 1.62; new b = 1 − 0.02·(−14) = 1.28. New prediction = 1.62·4 + 1.28 = 7.76; error −2.24; loss ≈ 5.02. One step cut the loss by about 90 percent.",
  },
  {
    title: "Multiply a batch through a layer",
    kind: "calculate",
    task: "X = [[1, 2], [3, 0], [0, 1]] (three examples, two features). W = [[1, −1, 2], [0, 3, 1]] (two inputs, three outputs). b = [1, 1, 1]. Compute X·W + b and state its shape. How many multiplications did it take?",
    hints: ["Each result cell: row of X dotted with column of W.", "Shape (3 × 2)·(2 × 3) = 3 × 3; cost 3 × 2 × 3."],
    solution: "Row 0 [1,2]: [1·1+2·0, 1·(−1)+2·3, 1·2+2·1] = [1, 5, 4]. Row 1 [3,0]: [3, −3, 6]. Row 2 [0,1]: [0, 3, 1]. Add bias 1 to every cell: [[2, 6, 5], [4, −2, 7], [1, 4, 2]]. Shape 3 × 3. Multiplications: 3 × 2 × 3 = 18.",
  },
  {
    title: "Build cosine similarity search",
    kind: "code",
    task: "Write Python with a small 'catalogue' of five products as 3-number vectors and a query vector. Compute cosine similarity between the query and every product and print the products in order of similarity. Then scale one product's vector by 10 and show that its ranking does not change.",
    hints: ["cosine(a, b) = dot(a, b) / (norm(a) · norm(b))", "Scaling a vector changes its dot product but not its cosine."],
    solution: "import math\ndef dot(a,b): return sum(x*y for x,y in zip(a,b))\ndef norm(a): return math.sqrt(dot(a,a))\ndef cos(a,b): return dot(a,b)/(norm(a)*norm(b))\ncatalogue = {'oak table':[0.9,0.1,0.2],'pine table':[0.8,0.2,0.1],'sofa':[0.1,0.9,0.3],'lamp':[0.2,0.3,0.9],'bench':[0.7,0.3,0.1]}\nquery = [0.85,0.15,0.15]\nranked = sorted(catalogue, key=lambda k: -cos(query, catalogue[k]))\nprint(ranked)\ncatalogue['pine table'] = [x*10 for x in catalogue['pine table']]\nprint(sorted(catalogue, key=lambda k: -cos(query, catalogue[k])))\n\nBoth prints give the same order (oak table, pine table, bench, sofa, lamp): cosine ignores length.",
  },
  {
    title: "Standardise and spot the outlier",
    kind: "calculate",
    task: "Response times in ms: 120, 130, 125, 135, 128, 122, 410. Compute the mean and standard deviation of the first six, then the z-score of the seventh. Is it an anomaly? What happens to the mean and standard deviation if you include the seventh when computing them, and why does that matter for anomaly detection?",
    hints: ["Mean of the six = 760 ÷ 6.", "A z-score above 3 is beyond the 99.7% band of a normal distribution."],
    solution: "Six values: mean = 126.67. Deviations: −6.67, 3.33, −1.67, 8.33, 1.33, −4.67; squares ≈ 44.4, 11.1, 2.8, 69.4, 1.8, 21.8; sum ≈ 151.3; variance ≈ 25.2; sd ≈ 5.0. z for 410 = (410 − 126.67) ÷ 5.0 ≈ 56: an extreme anomaly. Including 410 in the statistics gives mean ≈ 167 and sd ≈ 100, so 410's z drops to about 2.4 and looks far less unusual: outliers inflate the spread they are judged against. Compute the baseline from known-normal data, or use robust statistics (median and median absolute deviation).",
  },
];
