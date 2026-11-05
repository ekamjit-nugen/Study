import type { Exercise, LessonBody, Quiz } from "../types";

// Module 1: Introduction to artificial intelligence. One concept per lesson.
// Keys are lesson slugs: m01-<kebab of the concept title>.

export const M01_BODIES: Record<string, LessonBody> = {
  "m01-what-is-artificial-intelligence": {
    simple: "AI is software that does things we would call smart if a person did them. It is a goal, and there are several ways to reach it.",
    concept:
      "Think of the smart things people do: recognise a friend's face in a crowd, understand a question, decide the fastest way home, spot that an email is a scam. **Artificial intelligence** is the name for software that does jobs like these.\n\nThe word hides an important fact: AI is not one technique. It is a goal. Any program that reaches the goal counts, whether it reaches it by following rules a person wrote, by searching through possibilities, or by learning from examples. The program that beat the world chess champion in 1997 did it mostly by searching millions of moves. The program that recognises your face today did it by learning from millions of photos. Both are AI.\n\nSo when someone says 'this product uses AI', the useful question is: which kind, and what did it learn or what rules does it follow?",
    why:
      "Computers were built to do exactly what they are told, very fast. That works for payroll and spreadsheets, where every step can be written down. It fails for jobs where nobody can write the steps down. Try writing the rules for 'is this photo a cat?' or 'is this email rude?'. You cannot list them; you just know.\n\nAI exists to handle that second kind of job: tasks that people do well but cannot fully explain. For most of computing's history those tasks were out of reach. AI is the set of ideas that brought them in.",
    how: [
      "Someone defines the job precisely: input in, decision out. 'Given an email, output spam or not spam.'",
      "They choose a way to reach it. Rules written by hand, a search over possibilities, or learning from examples. Today learning is by far the most common route.",
      "The program is built, then tested on cases it has not seen. If it gets enough of them right, it is useful, even if nobody can explain every decision it makes.",
      "It is placed inside a product, where it makes the decision thousands of times a day, and people watch whether it keeps working as the world changes.",
    ],
    visual: {
      kind: "tree",
      root: "Artificial intelligence (the goal)",
      children: [
        { label: "Rules written by people", children: ["expert systems", "chess search", "spell-check rules"] },
        { label: "Machine learning: rules found from data", children: ["spam filters", "price prediction", "deep learning → image, speech, language models"] },
      ],
      caption: "AI is the goal at the top. The branches are different ways to reach it. Most of this path is about the right-hand branch.",
    },
    everyday: {
      title: "Your phone's photo app",
      text: "Type 'dog' into your phone's photos and it shows your dog. Nobody at the phone company wrote a rule that says 'a dog has four legs and fur'. That rule would also match a cat, a sheep and a sofa with a blanket. Instead the app learned from millions of labelled photos what dog pictures look like. It does a job you do effortlessly and could never write down. That is AI in the everyday sense.",
    },
    engineering: {
      title: "A bank's fraud desk",
      text: "A bank processes millions of card payments a day. A few hundred are fraud. Humans cannot check them all, and hand-written rules ('block anything over £2,000 abroad') block honest customers and miss clever thieves. The bank's fraud model scores every transaction in a few milliseconds, learned from years of past fraud cases, and sends only the suspicious ones to a person. The engineering decisions are about the trade-off: a stricter model catches more fraud but annoys more honest customers. AI gives the score; people set the threshold.",
    },
    creative: {
      title: "The apprentice who cannot be given a manual",
      text: "Imagine hiring an apprentice sommelier. You cannot hand them a rulebook for 'this wine is good'; there is no such book. You can only let them taste a thousand wines with an expert's verdict next to each, and let them form their own sense of it. AI, in its modern form, is that apprentice: it is given examples with answers and left to work out its own rules. The rulebook ends up inside it, in a form even it cannot read back to you.",
    },
    useIt: "You will meet AI as a label on products, in job titles and in news. The practical use of this lesson is a habit: whenever something is called AI, ask what kind it is and what it was trained on or which rules it follows. That question tells you what it can and cannot do, and it is the question every later lesson answers in more detail.",
    takeaways: ["AI is a goal: software doing jobs we would call smart. Not one technique.", "The jobs it targets are ones people do well but cannot fully write down as steps.", "There are several routes: hand-written rules, search, and learning from examples. Learning dominates today.", "Ask of any AI: which kind is it, and what did it learn from?"],
    terms: [["artificial intelligence", "software that does jobs we would call smart if a person did them; a goal, not one method"], ["rule-based system", "a program whose decisions follow rules a person wrote"]],
    reflect: { q: "A thermostat turns the heating on below 19°C. Is that AI?", a: "By the broadest definition it makes a decision, but nobody would call it smart; it follows one rule a person wrote. The useful line is whether the program handles a job people cannot fully write down. A thermostat does not. A system that learns your schedule and heats the house before you get home is closer." },
  },

  "m01-what-is-machine-learning": {
    simple: "Machine learning is building software by showing it examples and letting it find the rules, instead of writing the rules yourself.",
    concept:
      "In ordinary programming you write the rules and the computer applies them to data. **Machine learning** turns this around: you give the computer the data together with the right answers, and it works out the rules.\n\nThe 'rules' it finds are not sentences like 'if the email mentions a prize, it is spam'. They are numbers: thousands or billions of adjustable numbers inside a formula. Learning means adjusting those numbers until the formula gives the right answers on the examples. Once it does, you can feed it a new example it has never seen, and it applies the same formula.\n\nSo machine learning has three ingredients: examples with answers (the data), a formula with adjustable numbers (the model), and a procedure that adjusts the numbers to fit the examples (training). Everything in this path is a variation on those three.",
    why:
      "For many jobs, writing the rules by hand is impossible or never finished. A spam filter built from hand-written rules needs a new rule every time spammers change their wording, and the list grows until nobody understands it. A system that learned from examples just needs new examples.\n\nMachine learning exists for jobs where examples are easy to get and rules are hard to write. That describes most of the interesting problems: recognising images, understanding speech, predicting prices, recommending films, translating languages.",
    how: [
      "Collect examples with answers: ten thousand emails, each marked spam or not.",
      "Choose a model: a formula with adjustable numbers. The simplest gives every word a score and adds the scores up.",
      "Start with random numbers, so the model is wrong on nearly everything.",
      "Show it the examples. For each one, compare its answer with the right answer and nudge the numbers so it would have been slightly less wrong.",
      "Repeat over all the examples many times. The numbers settle into values that make the model mostly right.",
      "Test on examples it never saw during training. If it is still mostly right, it learned something general, not just the examples.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Ordinary programming", points: ["Input: data + rules written by a person", "Output: answers", "Change behaviour: edit the rules"] },
      right: { title: "Machine learning", points: ["Input: data + correct answers", "Output: the rules (as numbers in a model)", "Change behaviour: give different examples"] },
      caption: "Same three things, rearranged. In machine learning the rules come out, not in.",
    },
    everyday: {
      title: "Learning to tell a ripe mango",
      text: "Nobody taught you a rule for ripe mangoes. You squeezed a few dozen, smelled them, ate them, and were sometimes wrong. After enough tries you can pick a ripe one without being able to say how. That is learning from examples with answers. A model does the same, except its 'feel' is a set of numbers it adjusted, and it can process a million mangoes an hour.",
    },
    engineering: {
      title: "A streaming service recommends a film",
      text: "A streaming service has watched billions of choices: who watched what, how far they got, what they picked next. It does not write rules like 'people who like thrillers like crime dramas'. It trains a model on the history, and the model finds the patterns, including ones nobody would have guessed. When you open the app, the model scores every film for you and the top scores are shown. The team's job is not writing rules; it is collecting good data, choosing a model, training it, and measuring whether people watch more of what it suggests.",
    },
    maths: {
      formula: "spam score = w₁·(has 'prize') + w₂·(has 'invoice') + w₃·(number of links) + b",
      meaning: "Each w is an adjustable number (a weight) that says how much that clue counts; b is a starting value. A high score means spam. Training finds the w's and b.",
      worked: [
        "Before training the numbers are random: w₁ = 0.1, w₂ = 0.1, w₃ = 0.1, b = 0.",
        "An email with 'prize', no 'invoice', 5 links: score = 0.1·1 + 0.1·0 + 0.1·5 + 0 = 0.6. The right answer is spam (high), so the model is too low.",
        "Training nudges the numbers that would have helped: w₁ goes up (prize is a spam clue), w₃ goes up a little.",
        "After thousands of nudges on thousands of emails: w₁ = 2.3, w₂ = −1.8, w₃ = 0.4, b = −1.0.",
        "The same email now scores 2.3 + 0 + 2.0 − 1.0 = 3.3: clearly spam. An invoice email with one link scores −1.8 + 0.4 − 1.0 = −2.4: clearly not.",
      ],
      note: "Real spam filters use tens of thousands of clues, but it is this formula, bigger.",
    },
    code: {
      title: "Learning one number from examples",
      lang: "py",
      src: `# Examples: hours studied -> exam score. We let the computer find the rule.
hours  = [1, 2, 3, 4, 5]
scores = [52, 58, 66, 71, 80]

w = 0.0   # the adjustable number: score per hour
b = 50.0  # starting score
rate = 0.01

for step in range(2000):
    for x, y in zip(hours, scores):
        guess = w * x + b
        error = guess - y          # positive: guessed too high
        w -= rate * error * x      # nudge w so the guess moves toward y
        b -= rate * error

print(round(w, 2), round(b, 2))    # about 6.9 and 44.7
print(round(w * 6 + b))            # predict 6 hours: about 86`,
      lines: [
        { code: "hours  = [1, 2, 3, 4, 5]", say: "The inputs: five examples of hours studied." },
        { code: "scores = [52, 58, 66, 71, 80]", say: "The right answers for those examples." },
        { code: "w = 0.0   # the adjustable number: score per hour", say: "The rule has one adjustable number, w. We start it at zero; it knows nothing." },
        { code: "guess = w * x + b", say: "The model's formula: score equals w times hours plus b." },
        { code: "error = guess - y          # positive: guessed too high", say: "Compare with the right answer. The sign says which way we were wrong." },
        { code: "w -= rate * error * x      # nudge w so the guess moves toward y", say: "The nudge. Small step, in the direction that would have made this guess better." },
        { code: "print(round(w, 2), round(b, 2))    # about 6.9 and 44.7", say: "After 2,000 passes the numbers settled: about 6.9 points per hour on top of 44.7. Nobody typed those numbers in." },
      ],
      output: "6.9 44.7\n86",
      note: "This is the whole idea of machine learning in fifteen lines. Later modules only make the formula bigger and the nudging smarter.",
    },
    useIt: "Use machine learning when you can get many examples with answers and cannot write the rules: classification (spam, fraud, defects), prediction (prices, demand, delivery times), ranking (search, recommendations), recognition (images, speech). Do not use it when a clear rule exists; a rule is cheaper, faster and explainable.",
    takeaways: ["Machine learning: give data plus answers, get the rules out as numbers.", "Three ingredients: examples, a model with adjustable numbers, a training procedure that adjusts them.", "Training is nudging numbers to be less wrong, many times.", "It fits jobs with lots of examples and no writable rules."],
    terms: [["machine learning", "building software by letting it find rules from examples with answers"], ["training", "the process of adjusting a model's numbers to fit the examples"], ["model", "the formula with adjustable numbers that produces predictions"]],
    reflect: { q: "Could you train a model to decide whether a number is even?", a: "You could, but you should not: a one-line rule (divide by two, check the remainder) is exact, instant and explainable. Machine learning is for jobs where no such rule exists." },
  },

  "m01-what-is-deep-learning": {
    simple: "Deep learning is machine learning done with neural networks that have many layers, which lets them learn complicated patterns like faces, speech and language.",
    concept:
      "In the last lesson the model was a single formula: multiply each clue by a number, add up. That works when the clues are already good, like 'contains the word prize'. It fails when the input is raw, like the pixels of a photo. No single pixel is a clue for 'cat'.\n\n**Deep learning** stacks many simple formulas in layers. The first layer turns pixels into tiny clues (an edge here, a dark patch there). The next layer combines those into bigger clues (a curve, a corner). Further layers combine those into an eye, an ear, a whiskered face. By the last layer the clues are good enough that 'cat' is an easy call. Nobody designs the clues; training discovers them, layer by layer, from examples.\n\n'Deep' simply means many layers. A network with fifty or a hundred layers is deep; the language models later in this path have around a hundred. Each layer is still the same kind of formula as the spam scorer, repeated and stacked.",
    why:
      "Before deep learning, machine learning needed people to invent the clues. Image experts spent years designing features like 'edge detectors' and 'colour histograms' by hand, and the results were mediocre. Speech recognition needed hand-built sound features. Every new problem needed new expert-built clues.\n\nDeep learning removed that step. Give the raw pixels, raw audio, raw text, and let the layers invent the clues. In 2012 a deep network cut the error rate on a famous image contest almost in half overnight, and the hand-built approach was abandoned within two years. Deep learning exists because the clue-building step was the bottleneck, and layers can learn it.",
    how: [
      "The input is raw numbers: pixel brightnesses, audio samples, token ids.",
      "Layer 1 computes many small weighted sums over the input, each followed by a simple bend (an activation). Each sum learns to respond to one tiny pattern.",
      "Layer 2 does the same over layer 1's outputs, so it responds to combinations of tiny patterns: bigger patterns.",
      "This repeats for as many layers as the network has. Patterns grow from edges to parts to whole objects.",
      "The last layer turns the top-level patterns into the answer: a score per class, or a probability for the next word.",
      "Training adjusts every weight in every layer at once, using the same nudging idea, so the layers learn clues that are useful to the layers above them.",
    ],
    visual: {
      kind: "flow",
      steps: ["pixels", "layer 1: edges, blobs", "layer 2: curves, corners", "layer 3: eyes, ears, fur texture", "layer 4: faces, bodies", "output: cat 0.97, dog 0.02, other 0.01"],
      caption: "Each layer builds on the one before. The features in the middle were never designed; training found them.",
    },
    everyday: {
      title: "Reading handwriting",
      text: "When you read a scribbled note you do not look at ink dots. Your eyes pick out strokes, strokes become letters, letters become words, and words become the meaning. If one letter is a mess, the word still makes sense because the higher level fills it in. A deep network reads the same way: layer by layer, each one making the mess below it a little more meaningful.",
    },
    engineering: {
      title: "Hospital X-ray screening",
      text: "A hospital receives thousands of chest X-rays a week. A deep network trained on a million labelled images flags the ones that look abnormal so a radiologist sees them first. The engineers never told it what pneumonia looks like; it learned the clues from the examples. Their work was elsewhere: getting enough correctly labelled images, checking the network did not learn a shortcut (one famous model learned that images from a particular portable machine were more often sick, and was reading the machine's label, not the lungs), and measuring how often it misses real cases, which matters far more than its overall accuracy.",
    },
    creative: {
      title: "A factory of lookouts",
      text: "Picture a lighthouse with a hundred floors. On the ground floor a thousand lookouts each watch one tiny patch of sea and shout when they see a ripple. The first floor listens only to the ground floor and shouts when the ripples form a line. The next floor shouts when the lines form a hull. By the top floor one lookout says 'ship, heading north'. No single lookout understands ships. The understanding is in the stacking.",
    },
    useIt: "Deep learning is the tool whenever the input is raw and rich: images, audio, video, free text, sensor streams. It needs lots of data and lots of computing. For small tables of clean numbers (a spreadsheet of house prices), simpler machine learning usually wins and is easier to explain.",
    takeaways: ["Deep learning = machine learning with many stacked layers.", "Layers learn their own clues from raw input; nobody designs features any more.", "It needs much data and compute, and it is what makes vision, speech and language models possible.", "For small, clean tabular data, simpler models are often better."],
    terms: [["deep learning", "machine learning with neural networks of many layers"], ["layer", "one stage of a network: many weighted sums over the previous stage's outputs"], ["feature (learned)", "a clue the network discovered for itself, such as an edge or an eye"]],
    reflect: { q: "Why did deep learning only take off around 2012 if the ideas were decades old?", a: "Three things arrived together: enough labelled data (the internet), enough compute (graphics cards repurposed for maths), and a few training tricks that made deep stacks trainable. The idea waited for its ingredients." },
  },

  "m01-what-is-generative-ai": {
    simple: "Generative AI makes new things, such as text, images, code or sound, instead of only sorting or scoring what it is given.",
    concept:
      "Most AI in the first three lessons gives short answers: spam or not, cat or dog, a price. **Generative AI** produces content: a paragraph, a picture, a melody, a working function. The output is not a label; it is a new piece of the same kind of thing it learned from.\n\nThe trick is that generating is predicting, done repeatedly. A language model is trained to predict the next word of real text. Ask it to predict, add its prediction to the text, predict again, and a sentence appears, then a paragraph. An image model learns to predict what a slightly less noisy version of a picture looks like; run it many times from pure noise and a picture emerges. The models are the deep networks of the last lesson; what changed is what they are asked to predict and that they are run in a loop.\n\nThe things that look like creativity, understanding and conversation are the result of predicting extremely well what plausible content comes next, learned from enormous amounts of human-made content.",
    why:
      "Classifying and scoring cover a lot, but much of human work is producing: writing, drawing, coding, explaining, summarising. Until recently software could not produce anything that was not templated. Generative models exist because the same learn-from-examples idea, pointed at 'what comes next' and scaled up on vast data, turns out to produce content good enough to use.\n\nThe practical reason it matters to you as an engineer: for the first time, a program can take an instruction in plain language and produce something useful. That makes AI a building block for ordinary products, not just a specialist's tool.",
    how: [
      "Train a deep network to predict the next piece of content: the next token of text, or a less noisy image.",
      "To generate, give it a starting point: your prompt, or random noise.",
      "It outputs probabilities for what comes next. Pick one (the most likely, or a random draw weighted by probability).",
      "Append the pick and repeat. Each step sees everything generated so far.",
      "Stop at a length limit, an end marker, or when the picture is clean.",
      "A second stage of training, using human feedback, teaches the model to follow instructions and stay helpful rather than merely continuing text.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Prompt", detail: "'Write a two-line poem about rain'" },
        { label: "Predict", detail: "next token probabilities: 'Soft' 0.21, 'The' 0.18, 'Rain' 0.15 …" },
        { label: "Pick", detail: "'Soft'" },
        { label: "Append and predict again", detail: "'Soft drops' … 'Soft drops tap' … until an end marker" },
        { label: "Result", detail: "'Soft drops tap the window pane, / the garden drinks and breathes again.'" },
      ],
      caption: "Generation is prediction in a loop. Every word was chosen from a probability list, one at a time.",
    },
    everyday: {
      title: "Autocomplete, grown up",
      text: "Your phone keyboard suggests the next word. It is a small generative model: it predicts, you pick, it predicts again. A chat assistant is the same idea with a far bigger model, trained on far more text, and allowed to keep picking for a thousand words without you. If you have ever let autocomplete write a whole silly sentence, you have run a generative model in a loop.",
    },
    engineering: {
      title: "Product descriptions for 40,000 items",
      text: "An online retailer gets catalogue data as bare attributes: 'oak, 120 cm, four legs, £240'. Writing 40,000 descriptions by hand would take a team a year. A generative model writes a draft for each from the attributes, in the shop's tone, in minutes. The engineering is in the surroundings: a prompt that forbids inventing features that are not in the data, a check that every claim matches an attribute, a sample read by a person, and a way to regenerate when the catalogue changes. The model writes; the system makes the writing trustworthy.",
    },
    creative: {
      title: "The improviser",
      text: "Imagine a musician who has heard every song ever recorded but has never been told what music is. Hum a few notes and they continue it: not by looking up a song, but because after all that listening they feel what note comes next. Sometimes it is brilliant, sometimes it is a cliché, occasionally it is a note that no song would have, confidently played. That is a generative model: a prodigious sense of what-comes-next, with no guarantee that what comes next is true.",
    },
    useIt: "Generative AI is the engine behind chat assistants, code completion, drafting and summarising tools, image and voice generation. As an engineer you will mostly use it through an API with a prompt, and most of your work will be making its output reliable: constraining it, checking it, grounding it in real data, and measuring it. Those are the later stages of this path.",
    takeaways: ["Generative AI produces content; earlier AI mostly labelled or scored it.", "Generation is prediction in a loop: predict what comes next, append, repeat.", "It is built from the same deep networks, trained to predict content, at a very large scale.", "Fluency is not truth: a plausible next word is not a checked fact."],
    terms: [["generative AI", "models that produce new text, images, code or audio"], ["next-token prediction", "the training task of guessing the next piece of text; generation repeats it"], ["prompt", "the text you give a generative model to start from"]],
    reflect: { q: "If generation is just predicting the next word, how can a model answer a question it has never seen?", a: "Because the most plausible continuation of a question is an answer, and the model has seen millions of question-and-answer patterns. It is not retrieving a stored answer; it is predicting what an answer to this question would look like, word by word. That is also why it can produce a plausible wrong one." },
  },

  "m01-differences-between-ai-ml-dl-and-generative-ai": {
    simple: "They are nested: AI is the goal, machine learning is one way to reach it, deep learning is one kind of machine learning, and generative AI is deep learning used to make content.",
    concept:
      "The four terms are often used as if they were rivals. They are not; they are circles inside circles.\n\n**AI** is the outer circle: any software doing a job we call smart, by any method. **Machine learning** is inside it: the methods that find rules from data rather than from a programmer. **Deep learning** is inside that: machine learning with many-layered neural networks. **Generative AI** is inside deep learning: networks trained to produce content, run in a loop.\n\nSo every generative model is deep learning, every deep learning model is machine learning, and every machine learning model is AI. The reverse is false: a chess engine is AI but not machine learning; a house-price regression is machine learning but not deep learning; an X-ray classifier is deep learning but not generative.",
    why:
      "The names matter because they tell you what a system needs and what it can do. Machine learning needs data; a rule-based AI needs an expert. Deep learning needs a lot of data and a lot of compute; a simple model does not. Generative AI produces things and can produce wrong things fluently; a classifier can only mislabel.\n\nWhen a product, a job description or a news story says 'AI', the first thing an engineer does is locate it in the circles. That tells you the risks, the costs and the skills involved before any details.",
    how: [
      "Ask: does it learn from data, or follow written rules? Rules only: AI but not machine learning.",
      "If it learns: is the model a many-layered neural network? No: classic machine learning. Yes: deep learning.",
      "If deep learning: does it produce content (text, images, audio, code), or labels and numbers? Content: generative AI.",
      "Name what it was trained on and what it outputs. That is the honest description, whatever the marketing says.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Term", "What it is", "Needs", "Example", "Typical failure"],
        rows: [
          ["AI", "software doing a 'smart' job, any method", "depends on the method", "chess engine, spam filter, chatbot", "depends on the method"],
          ["Machine learning", "rules found from data", "examples with answers", "house-price model, fraud scorer", "learned the wrong pattern from bad data"],
          ["Deep learning", "machine learning with many layers", "lots of data and compute", "face recognition, speech to text", "unexplainable mistakes, shortcuts"],
          ["Generative AI", "deep networks that produce content", "enormous data, enormous compute", "chat assistants, image generators", "fluent, confident, wrong"],
        ],
      },
      caption: "Each row is inside the row above. Reading downward, the needs grow and the outputs get richer.",
    },
    everyday: {
      title: "Vehicles, cars, electric cars, self-driving electric cars",
      text: "Every self-driving electric car is an electric car, every electric car is a car, every car is a vehicle. Nobody would say 'is it a car or a vehicle?'. The AI terms nest the same way. 'Is it AI or machine learning?' is the same confusion; the answer is usually 'both, and here is which inner circle it sits in'.",
    },
    engineering: {
      title: "Three systems in one logistics company",
      text: "A parcel company runs three 'AI' systems. Route planning: a search algorithm over roads and time windows, with rules a person wrote. AI, not machine learning; it needs no training data, and its mistakes are explainable. Delivery-time prediction: a model trained on millions of past deliveries, a modest formula over a spreadsheet of features. Machine learning, not deep. Its risk is stale data after a depot moves. The customer chat assistant: a generative language model with the company's policies supplied in the prompt. Its risk is a fluent, wrong promise. Three teams, three skill sets, three kinds of failure, one word in the annual report.",
    },
    useIt: "Use the circles when scoping work: the inner circles cost more, need more data and fail less explainably. A problem that a rule or a simple model solves should not get a generative model. A problem that needs understanding raw text or images will not be solved by rules. Placing the problem first saves months.",
    takeaways: ["AI ⊃ machine learning ⊃ deep learning ⊃ generative AI. Nested, not rival.", "Inner circles need more data and compute and are harder to explain.", "Locate any system in the circles to know its needs, risks and skills.", "Solve with the outermost circle that works."],
    terms: [["classic machine learning", "models that learn from data but are not deep networks, such as linear or tree models"]],
    reflect: { q: "A translation app, a loan-approval model, a thermostat schedule learned from your habits: where does each sit?", a: "Translation: generative AI (it produces text). Loan approval: usually classic machine learning on tabular data; it must be explainable, so deep learning is rare here. Learned thermostat schedule: machine learning, probably a small model; the thermostat's on/off rule itself is not AI at all." },
  },

  "m01-rule-based-systems-vs-machine-learning": {
    simple: "Rules are written by people and are exact and explainable; machine learning finds its own rules from data and handles what people cannot write down. Good systems often use both.",
    concept:
      "A **rule-based system** makes decisions by following conditions a person wrote: 'if the amount is over £5,000 and the card is new, hold the payment'. The rules can be read, tested and argued about. The system does exactly what the rules say and nothing more.\n\nA **machine-learning system** makes decisions by a formula whose numbers were set by training on examples. Its rules are implicit, spread over the numbers, and usually cannot be read back as sentences. It handles patterns nobody wrote, including ones nobody noticed, and it can be wrong in ways nobody predicted.\n\nThe choice is not ideological. Rules win when the logic is known, must be exact, or must be explained to a regulator. Learning wins when the logic is unknown, changes often, or lives in raw data like text and images. Most real systems are a learned model wrapped in rules.",
    why:
      "Rule-based systems were the first AI, and they hit a wall: experts could not write down everything they knew, and the rule lists grew into thousands of contradictory lines that nobody could maintain. Machine learning solved the wall by learning the rules from examples.\n\nBut learning brought its own problems: it needs data, it can learn the wrong thing from biased or stale data, and it cannot promise exact behaviour. So rules came back, not as the brain but as the guard around it: hard limits, safety checks, exceptions the model may not override. The two exist because each fixes the other's weakness.",
    how: [
      "Write down what you know for certain as rules: legal limits, safety constraints, business policy.",
      "Where the decision depends on patterns you cannot write, train a model on examples and let it score or classify.",
      "Combine: the model proposes, the rules veto or override. 'Model says fraud score 0.92, rule says the customer is on the allow-list: let it through and flag for review.'",
      "Log both. When something goes wrong you can see whether a rule fired or the model erred, and fix the right one.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Rule-based", points: ["Rules written by people", "Exact and explainable", "Breaks on cases nobody wrote a rule for", "Maintenance: edit rules; lists grow", "No training data needed"] },
      right: { title: "Machine learning", points: ["Rules found from examples", "Handles patterns nobody can write", "Fails in unexpected ways; hard to explain", "Maintenance: retrain on new data", "Needs lots of good examples"] },
      caption: "Each column's strength is the other's weakness. Real systems take the rules for guarantees and the model for judgement.",
    },
    everyday: {
      title: "A recipe and a cook",
      text: "A recipe is a rule-based system: exact amounts, exact steps, the same result every time, and useless the moment an ingredient is missing. An experienced cook is a learned system: they taste, adjust, substitute, and cannot always tell you why. A good kitchen uses both: the recipe for the parts that must be exact (baking temperatures) and the cook's judgement for the rest.",
    },
    engineering: {
      title: "Credit-card fraud at a payments company",
      text: "The company's first fraud system was 300 rules. It blocked whole countries and still missed new scams. The second was a model trained on labelled transactions; it caught far more and could not be explained to the regulator, who required reasons for every block. The third, the one in production, is both: the model scores every transaction, rules apply the legal must-dos (sanctions lists, spending caps the customer set) and veto model decisions on protected cases, and every decision logs which part made it. Fraud caught went up, complaints went down, and the audit passed.",
    },
    code: {
      title: "The same decision, three ways",
      lang: "py",
      src: `# 1. Rules only
def rules_only(tx):
    if tx["amount"] > 5000 and tx["card_age_days"] < 30:
        return "hold"
    if tx["country"] in BLOCKED:
        return "hold"
    return "allow"

# 2. Model only (the model was trained on past fraud cases)
def model_only(tx):
    return "hold" if fraud_model.score(tx) > 0.9 else "allow"

# 3. Both: the model judges, the rules guarantee
def combined(tx):
    if tx["customer_id"] in ALLOW_LIST:
        return "allow"                      # a rule that the model may not override
    if tx["country"] in SANCTIONED:
        return "hold"                       # a legal rule, no judgement involved
    score = fraud_model.score(tx)
    if score > 0.9:
        return "hold"
    if score > 0.6:
        return "review"                     # a person decides the grey zone
    return "allow"`,
      lines: [
        { code: "if tx[\"amount\"] > 5000 and tx[\"card_age_days\"] < 30:", say: "A rule a person wrote. Exact, explainable, and blind to any pattern it does not mention." },
        { code: "return \"hold\" if fraud_model.score(tx) > 0.9 else \"allow\"", say: "A learned score and a threshold. Catches unwritten patterns; cannot say why." },
        { code: "if tx[\"customer_id\"] in ALLOW_LIST:", say: "In the combined version, guarantees come first. The model is never consulted on these." },
        { code: "return \"review\"                     # a person decides the grey zone", say: "A third outcome the pure versions lacked: when the model is unsure, a person decides." },
      ],
      note: "The combined version is longer and better. The rules carry the promises; the model carries the judgement.",
    },
    useIt: "When designing any decision system, write the rules for what must be true, train a model for what must be judged, and log which one decided. If a regulator, a customer or a colleague asks 'why', you can answer for the rules and measure for the model.",
    takeaways: ["Rules: written, exact, explainable, brittle. Learning: found from data, flexible, opaque, data-hungry.", "Each fixes the other's weakness; real systems use both.", "Rules for guarantees; the model for judgement; a person for the grey zone.", "Log which part made each decision."],
    terms: [["rule-based system", "decisions by conditions a person wrote"], ["threshold", "the score above which a model's output is treated as a yes"]],
    reflect: { q: "Why not let the model learn the allow-list too, from the data?", a: "Because the allow-list is a promise, not a pattern. A model can only reproduce patterns approximately; a promise must hold exactly, every time, and be explainable. Promises are rules." },
  },

  "m01-supervised-learning": {
    simple: "Supervised learning is learning from examples that come with the right answer, so the model can be corrected on every one.",
    concept:
      "**Supervised learning** is machine learning with a teacher. Every training example comes as a pair: the input and the correct output. An email and 'spam'. A house's details and its sale price. A photo and 'cat'. The model makes a guess, is shown the right answer, and adjusts.\n\nThe word 'supervised' refers to those answers, called **labels**. Someone had to produce them: a person tagged the emails, the sale price came from records, a volunteer typed 'cat'. Labels are the expensive part of supervised learning, and their quality limits everything the model can learn.\n\nTwo kinds of answer give two kinds of task. If the label is a category (spam/not, cat/dog/bird), it is **classification**. If it is a number (price, temperature, minutes until delivery), it is **regression**. The maths differs slightly; the idea is identical.",
    why:
      "Having the right answer for each example makes learning direct: the model's mistake on every example is measurable, and every mistake points to how the numbers should change. That makes supervised learning the most reliable and best understood kind, and it is behind most of the machine learning that actually runs in businesses.\n\nThe cost is the labels. Supervised learning exists wherever answers are available or worth paying for: historical records (prices, outcomes), human tagging (content moderation), or natural labels (the next word in a text, which is how language models are trained without anyone tagging anything).",
    how: [
      "Gather labelled examples: inputs paired with correct outputs. Clean them; wrong labels teach wrong rules.",
      "Split them: most for training, some held back for testing.",
      "Choose a model suited to the input and the kind of label.",
      "Train: for each example, predict, compare with the label, adjust. Repeat over the data.",
      "Test on the held-back examples. The score there is the honest measure.",
      "Deploy, and keep collecting labelled examples from real use, because the world drifts.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Input", "Label", "Task type", "Where the labels came from"],
        rows: [
          ["email text", "spam / not spam", "classification", "users clicking 'report spam'"],
          ["house size, location, age", "£312,000", "regression", "land registry records"],
          ["chest X-ray", "normal / abnormal", "classification", "radiologists' reports"],
          ["last 20 words", "the next word", "classification over the vocabulary", "the text itself: free labels"],
          ["sensor readings", "minutes until failure", "regression", "maintenance logs"],
        ],
      },
      caption: "Every row is input plus answer. The last row is how language models get billions of labels for free.",
    },
    everyday: {
      title: "Flashcards",
      text: "Learning vocabulary with flashcards is supervised learning. The front is the input, the back is the label. You guess, flip, and if you were wrong you adjust. After enough cards you can translate words you never had a card for, because you picked up the patterns. A model does exactly this, with numbers instead of memory.",
    },
    engineering: {
      title: "Predicting delivery times at a food-delivery app",
      text: "Every past order is a labelled example: the input is distance, time of day, restaurant, weather, rider count; the label is how many minutes it actually took. Millions of them, free, from the app's own records. The team trains a regression model and shows its estimate to customers. The hard engineering is not the model. It is making sure the features available at prediction time match what was available in training (you do not know the rider's route yet), handling new restaurants with no history, and watching the error every week, because a new motorway changes everything.",
    },
    maths: {
      formula: "accuracy = correct predictions ÷ all predictions;   average error = Σ |predicted − actual| ÷ n",
      meaning: "Classification is scored by the share that was right. Regression is scored by how far off the numbers were, on average. Both are computed on the held-back test examples.",
      worked: [
        "A spam classifier is tested on 200 held-back emails and gets 184 right: accuracy = 184 ÷ 200 = 0.92, or 92%.",
        "A delivery-time model predicts [30, 25, 40] minutes for three orders that took [34, 25, 33].",
        "Errors: |30 − 34| = 4, |25 − 25| = 0, |40 − 33| = 7.",
        "Average error = (4 + 0 + 7) ÷ 3 = 3.7 minutes.",
      ],
      note: "Module 4 shows why these simple scores can mislead and what to use instead.",
    },
    code: {
      title: "Classification with a tiny learned rule",
      lang: "py",
      src: `# Each example: (word count, number of links) -> 1 for spam, 0 for not
examples = [((120, 0), 0), ((15, 6), 1), ((300, 1), 0), ((20, 9), 1), ((45, 4), 1), ((200, 0), 0)]

w_words, w_links, b = 0.0, 0.0, 0.0
rate = 0.001

def predict(words, links):
    score = w_words * words + w_links * links + b
    return 1 if score > 0 else 0

for _ in range(500):
    for (words, links), label in examples:
        error = predict(words, links) - label    # -1, 0 or 1
        w_words -= rate * error * words
        w_links -= rate * error * links
        b -= rate * error

print(predict(25, 7))    # short, many links -> 1 (spam)
print(predict(250, 0))   # long, no links  -> 0`,
      lines: [
        { code: "examples = [((120, 0), 0), ((15, 6), 1), ((300, 1), 0), ((20, 9), 1), ((45, 4), 1), ((200, 0), 0)]", say: "Six labelled examples. The second number in each pair is the label a person provided." },
        { code: "return 1 if score > 0 else 0", say: "Classification: the score is turned into a category by a threshold." },
        { code: "error = predict(words, links) - label    # -1, 0 or 1", say: "The supervision: compare the guess with the label. Zero error means no change." },
        { code: "w_links -= rate * error * links", say: "A wrong guess on a link-heavy spam email pushes the link weight up." },
      ],
      output: "1\n0",
      note: "Six examples is far too few for anything real; the shape of the loop is what matters.",
    },
    useIt: "Reach for supervised learning whenever you have, or can get, examples with answers: fraud, churn, demand, defect detection, medical screening, sentiment, and the pretraining of every language model. Budget for labels first; they decide the ceiling.",
    takeaways: ["Supervised = learning from input–answer pairs; the answers are labels.", "Classification predicts a category; regression predicts a number.", "Labels are the expensive, quality-limiting part; the next word in text is a free label.", "Measure on held-back examples, never on the training ones."],
    terms: [["label", "the correct answer attached to a training example"], ["classification", "predicting a category"], ["regression", "predicting a number"], ["test set", "labelled examples kept out of training to measure honestly"]],
    reflect: { q: "A hospital has 50,000 X-rays but only 2,000 have a radiologist's report. What can supervised learning use?", a: "Only the 2,000 labelled ones directly. The other 48,000 can still help through unsupervised or self-supervised methods (the next lesson and later), which is exactly why those methods matter." },
  },

  "m01-unsupervised-learning": {
    simple: "Unsupervised learning finds structure in data that has no answers attached: groups, patterns, outliers, compact descriptions.",
    concept:
      "**Unsupervised learning** is learning without a teacher. The examples have no labels. The model is not told what to predict; it is asked to find structure in the data itself.\n\nThe common structures are: **clusters**, groups of examples that resemble each other (customers who shop alike); **anomalies**, examples that resemble nothing (a transaction unlike any seen before); and **compressed representations**, a short description of each example that keeps what matters (turning a 10,000-word document into 300 numbers). Nobody says what the groups mean. The model finds them; a person interprets them.\n\nIt is also the cheap way to use data: labels cost money, but unlabelled data is everywhere, and most of the world's data has no answers attached.",
    why:
      "Supervised learning needs labels, and labels are scarce. A retailer has a hundred million purchases and no label saying which 'kind' of customer made each. A security team has a billion log lines and no label saying which are attacks, especially the new attacks. Unsupervised methods exist to get value from exactly that data: find the groups, flag the odd ones, summarise the mass.\n\nIt also prepares the ground for supervised learning. Clustering suggests what categories exist; anomalies suggest what to label first; compressed representations make a later supervised model's job easier. Modern language models begin with a form of unsupervised learning on raw text before any labels are involved.",
    how: [
      "Represent each example as numbers: a customer as [orders per month, average basket, days since last visit].",
      "Define 'similar' as closeness between those number lists.",
      "For clustering: pick k group centres, assign each example to its nearest centre, move each centre to the middle of its group, repeat until nothing moves.",
      "For anomalies: measure how far each example is from everything else; the far ones are the anomalies.",
      "For compression: learn a short code for each example from which the example can be approximately rebuilt.",
      "A person looks at the result and names it: 'cluster 3 is weekend bulk buyers'.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Supervised", points: ["Examples with answers", "Learns to predict the answer", "Scored by correctness", "'Is this email spam?'"] },
      right: { title: "Unsupervised", points: ["Examples without answers", "Learns the structure of the data", "Judged by usefulness", "'What kinds of emails do we get?'"] },
      caption: "The data looks the same minus one column. The question asked of it is different.",
    },
    everyday: {
      title: "Sorting a drawer of loose cables",
      text: "Tip a drawer of cables onto a table and sort them without any instructions. You end up with piles: USB-C, old chargers, audio, mystery. Nobody labelled them; the piles came from similarity. Then one cable fits no pile: that is your anomaly, and probably the one you have been looking for. Unsupervised learning is that sorting, done on numbers.",
    },
    engineering: {
      title: "Finding attack patterns in a million log lines",
      text: "A security team cannot label a billion server logs, and the attacks they most need to catch are the ones nobody has seen before, so there are no labels for them anyway. They turn each session into numbers (requests per minute, endpoints touched, bytes sent) and run anomaly detection: sessions far from the normal mass are flagged. The flagged ones go to an analyst, who labels them, and over months those labels feed a supervised model for the known attacks. Unsupervised finds the unknown; supervised nails the known.",
    },
    maths: {
      formula: "distance between a and b = √((a₁ − b₁)² + (a₂ − b₂)²);   new centre = average of the points assigned to it",
      meaning: "Clustering needs only two operations: how far apart two examples are, and the average position of a group. k-means repeats assign-to-nearest and move-to-average.",
      worked: [
        "Four customers as (orders per month, average basket £): A(1, 20), B(2, 25), C(10, 80), D(12, 90). Choose two starting centres: A and C.",
        "Distances to A: B = √(1 + 25) ≈ 5.1, D = √(121 + 4900) ≈ 70.9. To C: B ≈ 55.6, D ≈ 10.2. So B joins A's group, D joins C's group.",
        "New centres: average of A and B = (1.5, 22.5); average of C and D = (11, 85).",
        "Reassign: nothing moves. Two clusters: occasional small shoppers and frequent big shoppers. A person names them.",
      ],
      note: "Scale matters: basket size in pounds dwarfs orders per month here, so real k-means first rescales each feature.",
    },
    useIt: "Use unsupervised learning for customer segmentation, anomaly and fraud discovery, grouping support tickets or documents by topic, compressing data for search, and as the first stage before labelling. Expect to interpret the output yourself; the model finds structure, not meaning.",
    takeaways: ["Unsupervised = no labels; the model finds structure: clusters, anomalies, compact codes.", "It uses the data nobody labelled, which is most data.", "Results need a person to interpret and name them.", "It often precedes supervised learning: find the groups, label the odd ones."],
    terms: [["cluster", "a group of examples that resemble each other"], ["anomaly", "an example unlike all the others"], ["k-means", "a clustering method that repeatedly assigns points to the nearest centre and moves centres to their group's average"]],
    reflect: { q: "k-means put a customer who buys once a year a £2,000 sofa into the 'frequent big shoppers' cluster. What went wrong?", a: "Basket size dominated the distance because it is measured in pounds while frequency is in small counts. Rescale each feature to a similar range first, or the clusters just reflect whichever feature has the biggest numbers." },
  },

  "m01-reinforcement-learning": {
    simple: "Reinforcement learning is learning by trying actions and getting rewards, so the learner shifts toward actions that lead to good outcomes over time.",
    concept:
      "In **reinforcement learning** there is no answer key and no fixed dataset. There is an **agent** that takes actions in an **environment**, and after each action, or at the end of a sequence, it receives a **reward**: a number saying how well things went. The agent's goal is to learn a **policy**, a way of choosing actions, that collects as much reward as possible over time.\n\nThe hard part is that rewards are delayed and sparse. A chess move is not rewarded; the win fifty moves later is. The agent has to work out which earlier actions deserved credit. The other hard part is exploration: to find better actions it must sometimes try unfamiliar ones, at the risk of doing badly now for knowledge later.\n\nReinforcement learning is how game-playing systems, robot controllers and, since 2022, the final training stage of chat assistants were built.",
    why:
      "Supervised learning needs the right answer for every example. For many problems nobody knows the right answer, only whether the outcome was good: no one can label the correct move in every chess position, the correct torque for a robot joint, or the ideal reply to a user. But a win, a successful grasp, or a user's thumbs-up can be scored.\n\nReinforcement learning exists for problems where you can score outcomes but not label actions, and where actions have consequences that unfold over time. It trades the certainty of labels for the generality of 'do whatever gets a high score'.",
    how: [
      "Define the environment (the game, the warehouse, the chat), the actions available, and the reward signal.",
      "The agent starts with a random policy and acts; mostly it does badly.",
      "Each action and its outcome are recorded, together with the reward that eventually followed.",
      "Credit is assigned backwards: actions that preceded high reward are made more likely, those before low reward less likely.",
      "A share of actions remains exploratory, so the agent keeps discovering better options.",
      "Repeat for millions of episodes, often in simulation, because real-world trial and error is slow and expensive.",
    ],
    visual: {
      kind: "flow",
      steps: ["agent observes the state", "chooses an action (mostly best-known, sometimes a try)", "environment changes and gives a reward", "agent updates its policy: more of what paid off", "back to observing"],
      caption: "The loop never sees a correct answer. It sees scores, and tilts toward actions that preceded good scores.",
    },
    everyday: {
      title: "Training a puppy",
      text: "You cannot explain 'sit' to a puppy. You wait for anything close, reward it, and gradually the puppy's behaviour shifts toward sitting on command. There is no label, only a treat that arrives after the right action. The puppy also tries random things; some of them get treats and become habits. That is the entire structure of reinforcement learning: actions, delayed rewards, and a policy that drifts toward what paid off.",
    },
    engineering: {
      title: "Warehouse robots learning to pick",
      text: "A robotics company wants arms that pick arbitrary items from bins. Labelling the correct motor commands for every object is impossible. Instead, a simulator runs millions of attempts: the arm tries a grasp, the reward is 1 if the item is lifted, 0 otherwise, with a small penalty for time. The policy improves until it grasps most things, then is fine-tuned on real robots with real rewards. The engineering is mostly in the reward design (reward 'item lifted', not 'gripper closed', or it learns to close on nothing) and in making the simulator close enough to reality that the learned policy survives the transfer.",
    },
    creative: {
      title: "The sommelier's second career",
      text: "The apprentice from the first lesson now runs the restaurant. Nobody tells them the right wine for each table; they get a tip at the end of the night. Over a thousand nights they notice: recommend the expensive bottle too often and tips fall; read the table well and tips rise. They are learning from delayed, noisy rewards, and occasionally they suggest an unusual bottle just to find out. That is reinforcement learning with a human agent.",
    },
    maths: {
      formula: "value of an action ← old value + α · (reward + γ · best value of the next state − old value)",
      meaning: "α is the learning rate (how much to move), γ is the discount (how much future reward counts). The agent keeps a value for each action in each state and nudges it toward what it actually got plus what the next state promises.",
      worked: [
        "A robot in a corridor: state 'at the door', action 'turn left'. Current value 0. Rate α = 0.5, discount γ = 0.9.",
        "It turns left, gets reward 0, lands in a state whose best known value is 10 (a charger is near).",
        "Update: 0 + 0.5 · (0 + 0.9 · 10 − 0) = 4.5. 'Turn left at the door' is now valued 4.5, although it earned nothing immediately.",
        "Next visit the same update moves it toward 9: 4.5 + 0.5 · (9 − 4.5) = 6.75. Credit flows backwards from the charger to the turn.",
      ],
      note: "This is Q-learning, one of the simplest reinforcement methods. Large systems replace the table of values with a neural network.",
    },
    useIt: "Reinforcement learning fits control and sequential decisions: robotics, game playing, data-centre cooling, ad bidding, recommendation over time, and the alignment stage of language models (Stage 5). It is data-hungry and reward design is treacherous; for one-shot predictions, supervised learning is simpler and better.",
    takeaways: ["Reinforcement learning: an agent, an environment, actions, delayed rewards, a policy that improves.", "No labels for actions, only scores for outcomes; credit must flow backwards in time.", "Exploration is required and costly; simulators make it affordable.", "Reward design decides what is actually learned; agents exploit sloppy rewards."],
    terms: [["agent (RL)", "the learner that chooses actions"], ["environment", "the world the agent acts in, which returns new states and rewards"], ["reward", "a number scoring how well things went"], ["policy", "the agent's way of choosing actions"]],
    reflect: { q: "A cleaning robot is rewarded for every piece of dirt it picks up. What does it learn to do eventually?", a: "Possibly to knock things over or tip bins so there is more dirt to pick up. Reward the state you want (a clean floor) rather than the action that usually leads to it, or the agent finds the shortcut." },
  },

  "m01-real-world-applications-of-ai": {
    simple: "AI already runs inside things you use daily: each application is one of the learning kinds from this module, chosen to fit the data and the decision.",
    concept:
      "This lesson puts the module together by looking at real systems and asking of each: which kind of AI is it, what does it learn from, and where can it go wrong? The same four questions apply to every product you will build or evaluate.\n\nFour familiar examples. **Spam detection**: supervised classification, trained on emails users reported, failing when spammers change tactics faster than the data. **Movie recommendations**: a mix of supervised learning (predict what you will watch from what you did) and unsupervised structure (people who cluster together), failing by trapping you in what you already like. **Fraud detection**: supervised scoring wrapped in rules, with unsupervised anomaly detection for the unknown, failing on honest customers who behave unusually. **Warehouse robots**: reinforcement learning for grasping and control, supervised deep learning for seeing the items, failing when reality differs from the simulator.\n\nNotice that none of them is 'just a model'. Each is a model plus data collection, plus rules, plus people, plus measurement.",
    why:
      "It is easy to finish a module on definitions and still not recognise AI in the wild, or to hear a product pitch and not know what to ask. Mapping real systems to the kinds of learning turns the definitions into a tool. It also shows the pattern of every AI product: the model is the smallest part, and the work around it (data, guards, measurement, people) is where projects succeed or fail.",
    how: [
      "Name the decision the system makes and how often. 'Flag this transaction, 5,000 times a second.'",
      "Name the data it learns from and who produced the labels, if any.",
      "Classify the learning: supervised, unsupervised, reinforcement, or rules.",
      "Name the failure that matters most and how the system would notice it.",
      "Name the humans: who labels, who reviews the grey zone, who gets blamed.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Application", "Decision", "Learns from", "Kind", "Worst failure", "Human in the loop"],
        rows: [
          ["Spam detection", "spam or inbox, per email", "emails users reported", "supervised classification", "a real email in the spam folder", "users reporting; reviewers for complaints"],
          ["Movie recommendations", "which 20 titles to show", "watch history of millions", "supervised ranking + clustering", "a filter bubble; a children's profile shown horror", "editors curating; parents' controls"],
          ["Fraud detection", "allow, hold or review, per payment", "past fraud cases + unlabelled logs", "supervised scoring + anomaly detection + rules", "an honest customer blocked abroad", "analysts on the review queue"],
          ["Warehouse robots", "how to move and grasp", "simulated and real attempts", "reinforcement learning + supervised vision", "a crushed item or a stalled line", "operators who can stop the line"],
          ["Medical imaging", "flag for a radiologist", "labelled scans", "supervised deep learning", "a missed cancer", "the radiologist always decides"],
          ["Chat assistants", "the next word, thousands of times", "web text + human preferences", "generative + reinforcement from feedback", "a confident wrong answer", "feedback buttons; escalation to people"],
        ],
      },
      caption: "Six systems, six kinds of mistake. The column that varies least is the last one: there is always a person somewhere.",
    },
    everyday: {
      title: "One morning's worth of AI",
      text: "Your phone unlocked by looking at your face (supervised deep learning). Your inbox had three emails in spam (supervised classification). The map app rerouted you around a jam (search over roads, plus a learned traffic predictor). A podcast app suggested a show (ranking from history). Your bank texted to ask whether a card payment abroad was really you (fraud scoring, review threshold). Before 9 am you were the subject of a dozen models.",
    },
    engineering: {
      title: "What the fraud team actually spends its time on",
      text: "At a payments company the fraud model is a few hundred lines of training code. The team is twelve people. They spend their time on: getting labels (every chargeback and every analyst decision flows back as a label within hours), features (a new feature like 'time since last login' takes a week to pipe through safely), thresholds (set with the business, balancing fraud losses against blocked honest customers), monitoring (fraud patterns shift weekly; a model two months old is noticeably worse), and explaining decisions to customers and regulators. The model is important. It is also about a tenth of the work.",
    },
    useIt: "Apply the five questions to anything described as AI, including your own ideas. If you cannot name the data, the kind of learning and the worst failure, the idea is not ready. If you can, you also know what to build around the model, which is most of the project.",
    takeaways: ["Every AI application is a decision, data, a kind of learning, a worst failure and a human.", "Spam: supervised. Recommendations: supervised plus clustering. Fraud: supervised plus anomalies plus rules. Robots: reinforcement plus vision.", "The model is the smallest part; data, guards, measurement and people are the project.", "The worst failure defines the design, not the average accuracy."],
    terms: [["human in the loop", "a person who reviews, decides or can stop the system at a defined point"], ["filter bubble", "a recommendation failure where the system only shows more of what you already consumed"]],
    reflect: { q: "A start-up pitches 'AI that predicts which employees will quit'. Ask the five questions.", a: "Decision: who to flag, how often. Data: past leavers; labels are real but few, and the features (performance reviews, hours) carry bias. Kind: supervised classification. Worst failure: a good employee treated as a flight risk, or a protected group flagged more. Human: who sees the flags and what they are allowed to do with them. The last two questions are where the pitch usually falls apart." },
  },
};

export const M01_QUIZ: Quiz[] = [
  {
    q: "A program plays chess by searching millions of possible moves using rules its authors wrote. Which circle does it sit in?",
    options: ["Generative AI", "Deep learning", "Machine learning", "AI, but not machine learning"],
    answer: 3,
    why: ["It produces no content; it picks moves.", "No layered network is involved.", "It learned nothing from data; its rules were written.", "Correct. It does a 'smart' job by search and written rules, so it is AI without learning."],
    reason: true,
  },
  {
    q: "What does 'learning' change inside a machine-learning model?",
    options: ["The code of the program", "The adjustable numbers (parameters) in its formula", "The training data", "The labels"],
    answer: 1,
    why: ["The code stays the same; training runs it.", "Correct. Training nudges the numbers until the formula fits the examples.", "Data is the input to learning, not what changes.", "Labels are given; the model does not change them."],
  },
  {
    q: "Why did deep learning replace hand-designed features for images?",
    options: ["Computers got cheaper so features were no longer needed", "Layers learn their own features from raw pixels, better than experts designed them", "Images became smaller", "Hand-designed features were illegal"],
    answer: 1,
    why: ["Cheaper compute helped, but the reason is what layers can do with it.", "Correct. Stacked layers discover edges, parts and objects from examples, and beat expert features decisively.", "No.", "No."],
  },
  {
    q: "A chat assistant writes a confident paragraph with a made-up statistic. What best explains it?",
    options: ["It looked up the wrong source", "It predicts plausible next words; plausibility is not truth", "Its rules contained an error", "It was trained only on fiction"],
    answer: 1,
    why: ["Generative models do not look things up unless given a tool.", "Correct. Generation is next-word prediction; a plausible number is as easy to produce as a true one.", "There are no written rules inside.", "Training data is mostly real text; fluency, not fiction, is the cause."],
    reason: true,
  },
  {
    q: "Which pair is correctly matched?",
    options: ["Predicting a house price from its size: unsupervised learning", "Grouping customers by shopping habits with no labels: unsupervised learning", "Learning to grasp objects from success/failure rewards: supervised learning", "Writing product descriptions: reinforcement learning"],
    answer: 1,
    why: ["Prices are labels; that is supervised regression.", "Correct. No labels, structure found from the data: clustering.", "Rewards without labelled actions: reinforcement learning.", "Producing text: generative AI."],
  },
  {
    q: "A fraud system must obey a sanctions list exactly and also catch new scam patterns. What design fits?",
    options: ["Rules only", "A model only, trained on the sanctions list", "Rules for the guarantees, a model for the judgement, a person for the grey zone", "Reinforcement learning"],
    answer: 2,
    why: ["Rules alone miss unwritten patterns.", "A model approximates patterns; a legal list must hold exactly.", "Correct. Promises are rules, judgement is learned, uncertainty goes to a person.", "No delayed rewards or sequential actions here."],
  },
  {
    q: "Why are labels described as the expensive part of supervised learning?",
    options: ["They take up disk space", "Someone has to produce each correct answer, and their quality limits the model", "Models refuse to train without them", "They must be in English"],
    answer: 1,
    why: ["Space is negligible.", "Correct. Labels cost human time or come from records, and wrong labels teach wrong rules.", "True but not why they are expensive.", "No."],
  },
  {
    q: "A cleaning robot rewarded per piece of dirt collected starts tipping over bins. What is the lesson?",
    options: ["Robots are unreliable", "The reward described an action, not the outcome you wanted, and the agent found a shortcut", "Reinforcement learning cannot be used for cleaning", "The learning rate was too high"],
    answer: 1,
    why: ["The robot did exactly what the reward asked.", "Correct. Reward the clean floor, not the pickup count.", "It can; the reward must be designed carefully.", "Step size does not create a wrong goal."],
    reason: true,
  },
];

export const M01_EXERCISES: Exercise[] = [
  {
    title: "Place six products in the circles",
    kind: "think",
    task: "For each, say which circle it sits in (AI only, machine learning, deep learning, generative AI) and what it learns from: a sat-nav route planner; a phone's face unlock; an email autocomplete; a credit-score model; a photo filter that turns pictures into paintings; a thermostat schedule learned from your habits.",
    hints: ["Does it learn from data at all?", "Is the input raw (pixels, text) or a small table of numbers?", "Does it produce content or a label/number?"],
    solution: "Route planner: AI (search and rules), no learning. Face unlock: deep learning, supervised, from labelled face images. Autocomplete: generative AI (small language model), from text. Credit score: classic machine learning (supervised, tabular), from repayment records; kept simple for explainability. Painting filter: generative deep learning, from image pairs or styles. Thermostat schedule: classic machine learning on a few features, from your own usage history.",
  },
  {
    title: "Compute accuracy and average error",
    kind: "calculate",
    task: "A spam filter tested on 250 held-back emails gets 231 right. A delivery model predicts [22, 35, 28, 40] minutes for orders that took [25, 35, 20, 44]. Compute the accuracy and the average absolute error. Then say why a 92% accuracy could still be a bad spam filter.",
    hints: ["accuracy = correct ÷ total", "average error = sum of |predicted − actual| ÷ count"],
    solution: "Accuracy = 231 ÷ 250 = 0.924 = 92.4%. Errors: 3, 0, 8, 4 → average = 15 ÷ 4 = 3.75 minutes. A 92% filter could be bad if the 8% wrong are real emails sent to spam (people miss important mail) or if only 5% of mail is spam, in which case a filter that marks everything as 'not spam' already scores 95%. Accuracy hides which mistakes were made.",
  },
  {
    title: "Fit a rule by hand, then let code do it",
    kind: "code",
    task: "Using the hours → score example from lesson 1.2, change the data to [1, 2, 3, 4, 5] hours and [40, 50, 60, 70, 80] scores. Before running, guess w and b. Run the training loop and compare. Then set the learning rate to 0.1 and describe what happens.",
    hints: ["The data lies exactly on a line; what slope and intercept?", "A big learning rate makes each nudge overshoot."],
    solution: "The line is score = 10 · hours + 30, so w ≈ 10 and b ≈ 30; the loop converges close to that. With rate = 0.1 the updates overshoot and grow each step; w and b blow up to huge or NaN values. Module 5 explains why and how optimisers handle it.",
  },
  {
    title: "Design a reward",
    kind: "think",
    task: "You are training a delivery-route agent with reinforcement learning. Propose a reward signal, then list two ways the agent could 'cheat' it, and fix the reward.",
    hints: ["Reward outcomes, not proxies.", "What would a lazy or reckless courier do to maximise your number?"],
    solution: "A naive reward: +1 per parcel delivered. Cheats: deliver only the nearest parcels and ignore far ones; drive dangerously fast. Better: +1 per parcel delivered on time, −5 per parcel late or missed, −0.1 per minute, −100 for a speed or safety violation, computed over the whole shift so the agent must plan the full route. Then watch for new shortcuts, because there will be some.",
  },
];
