import type { Exercise, LessonBody, Quiz } from "../types";

// Module 14: Language model fundamentals. One concept per lesson.
// Keys are lesson slugs: m14-<kebab of the concept title>.

export const M14_BODIES: Record<string, LessonBody> = {
  "m14-language-models": {
    simple: "A language model assigns probabilities to sequences of words or tokens; in practice it predicts what comes next, and everything from autocomplete to chat assistants is that prediction used in a loop.",
    concept:
      "A **language model** is a model of how likely any piece of text is. Give it 'The cat sat on the' and it should say that 'mat' is likely, 'floor' plausible, 'photosynthesis' nearly impossible. Give it a whole sentence and it can say how probable that sentence is compared with another. That single ability, scoring text, is the root of everything in Stages 4 and 6.\n\nThe practical form of the ability is next-token prediction: a probability over the vocabulary for what follows the text so far. Scoring a sentence is multiplying those probabilities along it; generating a sentence is picking from them one token at a time. Autocomplete, spell correction, speech recognition (which of several similar-sounding sentences is likely?), translation and chat assistants are all language models used for scoring or generating.\n\nModels in this module are small and count-based, so the mechanism is visible. The models of Stage 4 are enormous and learned, but they are language models in exactly this sense: a function from text so far to a probability over the next token.",
    why:
      "Language is sequential and uncertain: at every point there are many possible continuations, some far more likely than others. Any system that reads or writes language needs a way to rank possibilities: which transcription of a mumbled sentence, which spelling, which translation, which reply. A language model is that ranking function. It exists because 'how likely is this text?' turns out to be the question beneath most language tasks, and because it can be learned from raw text with no labels at all, using the text's own next words as the answers.",
    how: [
      "Choose the unit: words or tokens (Module 12).",
      "Define the model as a function from the preceding tokens to a probability distribution over the next token.",
      "Estimate the function from a corpus: by counting (this module) or by training a neural network (Stage 4).",
      "Score a text by multiplying the probability of each token given the ones before it.",
      "Generate text by repeatedly sampling or choosing the next token and appending it.",
    ],
    visual: {
      kind: "flow",
      steps: ["text so far: 'The cat sat on the'", "language model", "P(next): mat 0.31, floor 0.12, sofa 0.09, … photosynthesis 0.000001", "pick 'mat' → append → predict again"],
      caption: "One step of a language model. Scoring a sentence runs this once per token and multiplies; generating runs it in a loop.",
    },
    everyday: {
      title: "Finishing someone's sentence",
      text: "When a friend says 'Can you pass the…' you already have 'salt' ready. You are a language model: years of hearing sentences have given you a sense of what follows what. You can also tell a garbled phone message is probably 'running late' rather than 'running lake', because the first is far more likely. That ranking of likely text is what the model learns.",
    },
    engineering: {
      title: "Speech recognition picks the likely sentence",
      text: "A voice assistant's acoustic model hears sounds that could be 'recognise speech' or 'wreck a nice beach'; acoustically they are close. A language model scores both: the first is a common phrase, the second a strange one, and the assistant outputs the likely one. The same component fixes 'their/there/they're' in dictation and ranks candidate transcriptions in call-centre analytics. Engineers tune the balance between how much to trust the sounds and how much to trust the language model, because the language model will confidently 'correct' an unusual but true sentence into a common wrong one.",
    },
    maths: {
      formula: "P(w₁, w₂, …, wₙ) = Π P(wᵢ | w₁ … wᵢ₋₁)",
      meaning: "The probability of a whole sequence is the product of the probability of each token given everything before it. A language model supplies each factor.",
      worked: [
        "P('the cat sat') = P(the | start) × P(cat | the) × P(sat | the cat).",
        "Suppose the model gives 0.2, 0.05 and 0.3. Product = 0.2 × 0.05 × 0.3 = 0.003.",
        "P('the cat photosynthesised') = 0.2 × 0.05 × 0.00001 = 0.0000001. The model prefers the first sentence by a factor of 30,000.",
        "In practice the logs are added instead of the probabilities multiplied: log 0.003 ≈ −5.8 versus log 10⁻⁷ ≈ −16.1, which avoids numbers too small for a computer to represent.",
      ],
    },
    code: {
      title: "A language model is a function from prefix to probabilities",
      lang: "py",
      src: `import math

# a toy model: fixed probabilities for a few continuations
TABLE = {
    ("the",): {"cat": 0.05, "dog": 0.04, "weather": 0.02},
    ("the", "cat"): {"sat": 0.3, "slept": 0.2, "photosynthesised": 0.00001},
    (): {"the": 0.2, "a": 0.15},
}

def next_token_probs(prefix):
    return TABLE.get(tuple(prefix), {})

def sequence_log_prob(tokens):
    total = 0.0
    for i, tok in enumerate(tokens):
        p = next_token_probs(tokens[:i]).get(tok, 1e-9)
        total += math.log(p)
    return total

print(next_token_probs(["the", "cat"]))
print(round(sequence_log_prob(["the", "cat", "sat"]), 2))
print(round(sequence_log_prob(["the", "cat", "photosynthesised"]), 2))`,
      lines: [
        { code: "def next_token_probs(prefix):", say: "The whole interface of a language model: text so far in, a distribution over the next token out." },
        { code: "p = next_token_probs(tokens[:i]).get(tok, 1e-9)", say: "Scoring a sequence uses the same function once per token, looking up the probability of the token that actually came next." },
        { code: "total += math.log(p)", say: "Logs are added rather than probabilities multiplied, so tiny numbers do not underflow." },
      ],
      output: "{'sat': 0.3, 'slept': 0.2, 'photosynthesised': 1e-05}\n-5.81\n-16.12",
      note: "Replace TABLE with counts (next lessons) or a neural network (Stage 4) and the two functions stay exactly the same.",
    },
    useIt: "Think of every language task as scoring or generating with a language model: it tells you what the model can do (rank, continue, fill gaps) and what it cannot (verify facts, which are not probabilities of text). The next lessons build one from counts so the mechanism is concrete.",
    takeaways: ["A language model gives probabilities to text; its working form is next-token prediction.", "Scoring multiplies per-token probabilities; generating picks tokens in a loop.", "It is learned from raw text, with the next token as the free label.", "Speech, spelling, translation and chat are all this one ability applied."],
    terms: [["language model", "a model that assigns probabilities to sequences of tokens"], ["next-token distribution", "the probabilities a language model gives to every possible next token"], ["scoring", "computing how probable a given text is under the model"]],
    reflect: { q: "A language model gives 'the capital of Australia is Sydney' a higher probability than 'the capital of Australia is Canberra'. Is the model broken?", a: "No. It models what text is likely, and that sentence is written often because the mistake is common. Probability of text is not truth of text. Making models prefer true statements is extra work (Stage 5's alignment and Stage 6's retrieval), on top of language modelling." },
  },

  "m14-statistical-language-models": {
    simple: "A statistical language model estimates the probability of the next word from counts in a corpus: how often did this word follow these words before?",
    concept:
      "Before neural networks, language models were tables of counts. A **statistical language model** estimates the probability of a word given the preceding words by counting how often that sequence occurred in a large corpus and dividing by how often the preceding words occurred. If 'the cat' appears 1,000 times and 'the cat sat' 300 times, the estimate of P(sat | the cat) is 0.3.\n\nThat simple rule is the maximum-likelihood estimate: the probability that makes the observed counts most likely. It has one fatal weakness, which the rest of this module is about: any sequence not seen in the corpus gets probability zero, and most possible sequences have never been seen. Statistical models manage this by limiting how many preceding words they condition on (n-grams, next lesson) and by smoothing: moving a little probability from seen events to unseen ones.\n\nThese models ran speech recognition, machine translation and spelling correction for thirty years, and they are still used where speed and simplicity matter. They are also the clearest way to see what a language model is before the counts are replaced by learned weights.",
    why:
      "To predict the next word you need an estimate of its probability, and the most direct source of probabilities is frequencies in text. Counting is cheap, transparent and needs no training beyond reading the corpus once. Statistical models exist because, for decades, counting was the only feasible way to build language models at scale, and because their failures (zero counts, limited context) define exactly the problems that later models solve.",
    how: [
      "Tokenise a large corpus.",
      "Decide how much preceding context to use (the previous word, the previous two words, …).",
      "Count every (context, next word) pair and every context.",
      "Estimate P(next | context) = count(context, next) ÷ count(context).",
      "Apply smoothing so unseen pairs get small non-zero probabilities, and back off to shorter contexts when a context was never seen.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Context", "Next word", "Count(context, next)", "Count(context)", "P(next | context)"],
        rows: [
          ["the cat", "sat", "300", "1,000", "0.30"],
          ["the cat", "slept", "150", "1,000", "0.15"],
          ["the cat", "purred", "0", "1,000", "0.00 (never seen: the problem)"],
          ["the", "cat", "5,000", "250,000", "0.02"],
        ],
      },
      caption: "Probabilities are ratios of counts. 'Purred' after 'the cat' is perfectly plausible and gets zero because the corpus happened not to contain it.",
    },
    everyday: {
      title: "The regular at the café",
      text: "A barista who has served the same customer 100 times knows that after 'I'll have a…' comes 'flat white' 70 times and 'tea' 25 times, so they start the flat white. They have a statistical language model of one customer. The day the customer asks for a hot chocolate, the barista has a count of zero and is surprised, which is exactly the limitation.",
    },
    engineering: {
      title: "Spelling correction on a search engine",
      text: "A search engine's 'did you mean' feature uses a statistical language model over queries. When someone types 'recieve payment', the engine considers candidate corrections and scores each by how often it appears in past queries: 'receive payment' has a high count, 'relieve payment' a low one. Counts over billions of queries make this fast and accurate for common phrases. For rare or new phrases, counts are zero or tiny, and the engine falls back to shorter contexts (just 'receive') and to character similarity, which is smoothing and back-off in production.",
    },
    maths: {
      formula: "P(w | context) = count(context, w) ÷ count(context)",
      meaning: "The maximum-likelihood estimate: the fraction of times the context was followed by w.",
      worked: [
        "Corpus counts: 'the cat' = 1,000; 'the cat sat' = 300; 'the cat slept' = 150; 'the cat purred' = 0.",
        "P(sat | the cat) = 300 ÷ 1,000 = 0.30. P(slept | the cat) = 0.15. P(purred | the cat) = 0 ÷ 1,000 = 0.",
        "Any sentence containing 'the cat purred' now has probability 0, however natural. One zero factor kills the whole product.",
        "A simple fix (add-one smoothing with a vocabulary of 10,000): P(purred | the cat) = (0 + 1) ÷ (1,000 + 10,000) ≈ 0.00009. Small, but not zero. P(sat | the cat) becomes 301 ÷ 11,000 ≈ 0.027: smoothing takes mass from the seen to give to the unseen.",
      ],
      note: "Add-one smoothing is crude; real systems use Kneser-Ney smoothing, which is better at guessing which unseen words are plausible.",
    },
    code: {
      title: "A count-based model with add-one smoothing",
      lang: "py",
      src: `from collections import Counter, defaultdict

corpus = "the cat sat . the cat slept . the cat sat . the dog sat . the cat slept .".split()
vocab = set(corpus)

pair_counts = defaultdict(Counter)        # context word -> Counter of next words
for prev, nxt in zip(corpus, corpus[1:]):
    pair_counts[prev][nxt] += 1

def prob(prev, nxt, smooth=0):
    c = pair_counts[prev]
    return (c[nxt] + smooth) / (sum(c.values()) + smooth * len(vocab))

print("P(sat|cat) =", round(prob("cat", "sat"), 2))
print("P(purred|cat) =", prob("cat", "purred"))
print("P(purred|cat) smoothed =", round(prob("cat", "purred", smooth=1), 3))`,
      lines: [
        { code: "pair_counts[prev][nxt] += 1", say: "Reading the corpus once builds the count table: for each word, how often each next word followed it." },
        { code: "return (c[nxt] + smooth) / (sum(c.values()) + smooth * len(vocab))", say: "The estimate is a ratio of counts. With smooth=0 it is the raw maximum-likelihood estimate; with smooth=1 every word gets one phantom count." },
        { code: "print(\"P(purred|cat) =\", prob(\"cat\", \"purred\"))", say: "Zero. The corpus never had 'cat purred', so the unsmoothed model says it is impossible." },
      ],
      output: "P(sat|cat) = 0.5\nP(purred|cat) = 0.0\nP(purred|cat) smoothed = 0.1",
      note: "The smoothed value is large only because the toy vocabulary is tiny; with 50,000 words it would be a small fraction of a percent.",
    },
    useIt: "Count-based models are still the right tool for fast, transparent ranking over short contexts: query correction, keyboard suggestions, language identification, scoring candidate transcriptions. They are also the mental model for what every language model does: estimate P(next | context), from data.",
    takeaways: ["Statistical language models estimate P(next | context) from corpus counts.", "The estimate is count(context, next) ÷ count(context).", "Unseen sequences get zero; smoothing and back-off repair that.", "Transparent, fast, and the baseline every neural model is compared against."],
    terms: [["statistical language model", "a language model whose probabilities come from counts"], ["maximum-likelihood estimate", "the probability that makes the observed counts most likely: a ratio of counts"], ["smoothing", "shifting a little probability from seen events to unseen ones so nothing is zero"]],
    reflect: { q: "Why does one zero probability in a sentence ruin the whole sentence's score, and what does that imply for scoring long documents?", a: "The sentence probability is a product, and anything times zero is zero; the model declares the whole text impossible because of one unseen pair. Long documents almost always contain some unseen pair, so without smoothing every long document scores zero. Smoothing is not optional." },
  },

  "m14-n-gram-language-models": {
    simple: "An n-gram language model predicts the next word from only the previous n − 1 words, which keeps the count table manageable; bigger n sees more context but runs out of data faster.",
    concept:
      "Conditioning on the entire preceding text is impossible with counts: almost no long context has ever been seen before. An **n-gram language model** makes the Markov assumption: the next word depends only on the previous n − 1 words. A bigram model (n = 2) uses one previous word; a trigram (n = 3) uses two; a 5-gram uses four.\n\nThis turns language modelling into counting n-grams (Module 11): P(sat | the cat) is estimated from trigram counts of 'the cat sat' and bigram counts of 'the cat'. The table size and the data needed grow with n. A bigram model over 50,000 words has 2.5 billion possible entries; a trigram model has 125 trillion. Most are never observed, so higher-order models rely heavily on smoothing and on backing off: if 'the cat purred' was never seen, use P(purred | cat); if that was never seen, use P(purred).\n\nN-gram models were the state of the art until around 2012, and 5-gram models trained on trillions of words still appear in production speech and translation systems. Their limit is memory: a 5-gram model cannot connect a pronoun to a noun ten words back.",
    why:
      "Counts need repetition, and long contexts never repeat. The Markov assumption trades context for data: by looking back only a few words, the model sees each context often enough to estimate probabilities. It exists as the practical compromise that made statistical language modelling work at all, and its failure mode, no memory beyond n − 1 words, is the specific problem that recurrent networks and then transformers were built to solve.",
    how: [
      "Choose n (2 to 5 in practice).",
      "Add start and end markers to each sentence so the first and last words have contexts.",
      "Count all n-grams and all (n − 1)-grams in the corpus.",
      "Estimate P(wᵢ | wᵢ₋ₙ₊₁ … wᵢ₋₁) = count(n-gram) ÷ count((n − 1)-gram), with smoothing.",
      "When an (n − 1)-gram context is unseen, back off to the (n − 2)-gram model, and so on down to unigram.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "Predicts 'sat' from", "Possible contexts (V = 50,000)", "Strength", "Weakness"],
        rows: [
          ["unigram (n = 1)", "nothing", "1", "never unseen", "ignores all context"],
          ["bigram (n = 2)", "'cat'", "50,000", "cheap, robust", "cannot see 'the big black cat'"],
          ["trigram (n = 3)", "'black cat'", "2.5 billion", "good local grammar", "sparse; needs smoothing"],
          ["5-gram", "'the big black cat'", "6 × 10¹⁸", "fluent phrases", "most contexts never seen; huge tables"],
        ],
      },
      caption: "Each step up in n gains context and loses data. Back-off lets a 5-gram model fall down this table when a context was never seen.",
    },
    everyday: {
      title: "Predictive text's short memory",
      text: "Phone keyboards historically used trigram models: they suggest the next word from the previous two. Type 'the weather is' and 'nice' appears. Type a sentence about your sister, then 'she', and the keyboard has no idea 'she' refers to anyone: it saw only the last two words. The suggestions are fluent two words at a time and clueless beyond that. That is the n-gram window in daily use.",
    },
    engineering: {
      title: "A 5-gram model in a translation system",
      text: "A translation system of the early 2010s generated many candidate English sentences for each French input and used a 5-gram language model, trained on 100 billion words of English and stored in a compressed data structure of several gigabytes, to score their fluency. Engineers found it fixed word order and article choice beautifully and did nothing for agreement across clauses: 'the committee … they has decided' passed because no 5-gram spanned the distance. Replacing the 5-gram scorer with a neural language model was the single largest quality gain in the system's history.",
    },
    maths: {
      formula: "P(wᵢ | wᵢ₋₂, wᵢ₋₁) ≈ count(wᵢ₋₂ wᵢ₋₁ wᵢ) ÷ count(wᵢ₋₂ wᵢ₋₁)   (trigram);   P(sentence) ≈ Π P(wᵢ | wᵢ₋₂, wᵢ₋₁)",
      meaning: "A trigram model conditions on the previous two words only, and the sentence probability multiplies those local estimates.",
      worked: [
        "Counts: 'the cat' = 1,000; 'the cat sat' = 300; 'cat sat' = 500; 'cat sat on' = 400; 'sat on' = 2,000; 'sat on the' = 1,500.",
        "Trigram: P(sat | the cat) = 300 ÷ 1,000 = 0.30. P(on | cat sat) = 400 ÷ 500 = 0.80. P(the | sat on) = 1,500 ÷ 2,000 = 0.75.",
        "P('the cat sat on the' | 'the cat') ≈ 0.30 × 0.80 × 0.75 = 0.18.",
        "The model never looked beyond two words back. If the sentence began 'The cats', the trigram 'cats sat on' would be counted separately and probably less often, with no sense that cats and cat are related: an n-gram model knows only strings.",
      ],
    },
    code: {
      title: "A trigram model with back-off to bigrams",
      lang: "py",
      src: `from collections import Counter

text = ("<s> the cat sat on the mat </s> <s> the cat slept on the sofa </s> "
        "<s> the dog sat on the mat </s> <s> a cat sat on the rug </s>").split()

uni, bi, tri = Counter(text), Counter(zip(text, text[1:])), Counter(zip(text, text[1:], text[2:]))

def p(w, prev2, prev1):
    if bi[(prev2, prev1)] > 0 and tri[(prev2, prev1, w)] > 0:
        return tri[(prev2, prev1, w)] / bi[(prev2, prev1)]           # trigram estimate
    if uni[prev1] > 0 and bi[(prev1, w)] > 0:
        return 0.4 * bi[(prev1, w)] / uni[prev1]                     # back off to bigram, discounted
    return 0.4 * 0.4 * (uni[w] + 1) / (sum(uni.values()) + len(uni)) # back off to smoothed unigram

print(round(p("sat", "the", "cat"), 2))       # seen trigram
print(round(p("purred", "the", "cat"), 4))    # unseen: falls to unigram
print(round(p("mat", "on", "the"), 2))`,
      lines: [
        { code: "uni, bi, tri = Counter(text), Counter(zip(text, text[1:])), Counter(zip(text, text[1:], text[2:]))", say: "Three count tables from one pass: unigrams, bigrams and trigrams, including the sentence markers." },
        { code: "return tri[(prev2, prev1, w)] / bi[(prev2, prev1)]           # trigram estimate", say: "When the trigram was seen, its count over its context's count is the estimate." },
        { code: "return 0.4 * bi[(prev1, w)] / uni[prev1]                     # back off to bigram, discounted", say: "Unseen trigram: use the bigram estimate, scaled down because it is a weaker guess. The 0.4 is a stand-in for a properly computed back-off weight." },
        { code: "return 0.4 * 0.4 * (uni[w] + 1) / (sum(uni.values()) + len(uni)) # back off to smoothed unigram", say: "The last resort: the word's overall frequency, smoothed so even never-seen words get something." },
      ],
      output: "0.67\n0.0045\n0.67",
      note: "Proper back-off (Katz, Kneser-Ney) computes the discounts so the probabilities still sum to one; the structure is this.",
    },
    useIt: "Use n-gram models when you need a fast, transparent fluency score or next-word suggestion with short context and lots of data: keyboards, query correction, language identification, lightweight reranking. Expect them to miss anything beyond a few words back; for that, use neural language models.",
    takeaways: ["An n-gram model conditions on the previous n − 1 words (the Markov assumption).", "Bigger n sees more context and needs exponentially more data; back-off and smoothing fill the gaps.", "Fluent locally, blind beyond the window: no long-range memory.", "Still used where speed and simplicity win; replaced by neural models where context matters."],
    terms: [["n-gram language model", "a language model that predicts from the previous n − 1 words"], ["Markov assumption", "the assumption that the next item depends only on a fixed number of previous items"], ["back-off", "using a shorter context's estimate when the longer context was never seen"]],
    reflect: { q: "Why would a 7-gram model trained on the same corpus as a trigram model often perform worse, not better?", a: "Almost no 6-word context repeats in the corpus, so nearly every 7-gram estimate is backed off anyway, and the few that are not are estimated from one or two occurrences, which is noise. More context only helps when there is enough data to see it repeated. Neural models escape this because they generalise across similar contexts instead of matching them exactly." },
  },

  "m14-next-word-prediction": {
    simple: "Next-word prediction is the task of guessing the word that follows a piece of text; it is the training signal for language models because every text provides its own answers for free.",
    concept:
      "**Next-word prediction** is both a task and a training recipe. The task: given the words so far, output a probability for every word in the vocabulary being next. The recipe: take any text, hide the next word, ask the model to predict it, compare with the real next word, adjust the model, repeat for every position in a corpus. No one has to label anything; the text is its own answer key.\n\nThat is why language models can be trained on the whole internet while a sentiment classifier is stuck with the few thousand reviews someone labelled. Every sentence ever written is a long sequence of next-word examples. Module 1 called this a free label; here it becomes the engine.\n\nThe task sounds trivial and is not. To predict the next word well across all text, a model has to pick up grammar, facts, style, reasoning patterns and world knowledge, because all of them affect what word comes next. The ambition of modern language models is the bet that predicting the next word well enough requires understanding a great deal, and that bet has largely paid off.",
    why:
      "Supervised learning needs labels and labels are scarce. Next-word prediction turns unlabelled text into an unlimited supply of training examples, which is what made it possible to train models on trillions of words. It exists as the pretext task for language: nobody wants next-word prediction as a product (autocomplete aside), but a model that does it well has learned a representation of language that transfers to almost every other language task.",
    how: [
      "Take a text and tokenise it: [t₁, t₂, …, tₙ].",
      "For each position i, the input is [t₁ … tᵢ₋₁] and the target is tᵢ.",
      "The model outputs a distribution over the vocabulary; the loss is how little probability it gave the true tᵢ (cross-entropy, Module 4).",
      "Adjust the model by gradient descent to raise the probability of the true next word.",
      "Repeat across billions of positions; every one is a labelled example that cost nothing to label.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Input (words so far)", "Target (next word)", "What a good prediction needs"],
        rows: [
          ["The capital of France is", "Paris", "a fact"],
          ["She put the book on the", "shelf / table", "world knowledge about where books go"],
          ["If it rains tomorrow, the match will be", "cancelled / postponed", "reasoning about consequences"],
          ["Dear Sir or", "Madam", "a convention"],
          ["def fibonacci(n): if n < 2: return", "n", "code semantics"],
        ],
      },
      caption: "Five next-word examples, five different skills. A model that predicts all of them well has learned all five, with no labels but the text itself.",
    },
    everyday: {
      title: "Learning a language from overheard conversations",
      text: "A child learns to speak without a single grammar lesson, by hearing sentences and gradually predicting how they go. Nobody labels the sentences; the sentences are the lessons. Next-word prediction is that process made explicit and run at a scale no child could match: a trillion overheard sentences, each one a lesson.",
    },
    engineering: {
      title: "Pretraining a code model on a company's repositories",
      text: "A company trained a code-completion model on its own 400 million lines of code with no annotation at all: the training task was next-token prediction over source files. The model learned the company's internal APIs, naming conventions and error-handling patterns because predicting the next token in that codebase requires them. The only data work was filtering: removing generated files, secrets and duplicated vendored libraries. Everything else came free from the text.",
    },
    maths: {
      formula: "loss at position i = −log P(tᵢ | t₁ … tᵢ₋₁);   training loss = average over all positions",
      meaning: "The model is penalised by the negative log of the probability it assigned to the word that actually came next. Confident and right costs little; confident and wrong costs a lot.",
      worked: [
        "Text: 'the cat sat'. The model's predictions: P(cat | the) = 0.05; P(sat | the cat) = 0.30.",
        "Losses: −log 0.05 ≈ 3.0; −log 0.30 ≈ 1.2. Average ≈ 2.1.",
        "After training, P(cat | the) = 0.08 and P(sat | the cat) = 0.45: losses 2.5 and 0.8, average 1.65. Lower loss means the model finds real text less surprising.",
        "The next lesson's perplexity is e raised to this average: e^2.1 ≈ 8.2 before, e^1.65 ≈ 5.2 after. 'As confused as if choosing among 8 words' became 'among 5'.",
      ],
    },
    code: {
      title: "Turning any text into training examples",
      lang: "py",
      src: `text = "the cat sat on the mat".split()

examples = [(text[:i], text[i]) for i in range(1, len(text))]
for context, target in examples:
    print(" ".join(context).ljust(22), "->", target)

print(len(examples), "training examples from", len(text), "words, no labels needed")`,
      lines: [
        { code: "examples = [(text[:i], text[i]) for i in range(1, len(text))]", say: "Every position becomes one example: everything before it is the input, the word at it is the answer." },
        { code: "print(len(examples), \"training examples from\", len(text), \"words, no labels needed\")", say: "A six-word sentence gives five examples. A trillion-word corpus gives a trillion." },
      ],
      output: "the                    -> cat\nthe cat                -> sat\nthe cat sat            -> on\nthe cat sat on         -> the\nthe cat sat on the     -> mat\n5 training examples from 6 words, no labels needed",
      note: "In practice all positions of a sequence are predicted in one pass with a mask that hides the future (Stage 4), but the examples are exactly these.",
    },
    useIt: "Next-word prediction is why you can pretrain a language model on any text you have, from code to contracts, without annotation. When you fine-tune or evaluate a model, you are measuring this same loss on your own text. And when you understand that the model was trained only to predict the next word, many of its behaviours, from fluency to confident errors, become predictable.",
    takeaways: ["Next-word prediction: input the words so far, output a distribution over the next word.", "Every text is its own training data; no labels are needed.", "Doing it well across all text requires grammar, facts, reasoning and style, which is why it works as a pretext.", "The loss is the negative log probability of the true next word."],
    terms: [["next-word prediction", "the task of predicting the word that follows a text"], ["self-supervised learning", "training on data that supplies its own answers, like the next word of a text"], ["cross-entropy loss (language)", "the negative log probability the model gave the true next token"]],
    reflect: { q: "If a model is only ever trained to predict the next word, how can it answer a question it has never seen?", a: "Because the most probable continuation of a question, in the text it learned from, is an answer, and the model has seen millions of question-answer patterns. It is not retrieving a stored answer; it is predicting what an answer would look like, word by word, using everything it absorbed to predict words well. That is also why the answer can be fluent and wrong." },
  },

  "m14-next-token-prediction": {
    simple: "Next-token prediction is next-word prediction done over tokens rather than words; it is the exact training objective of modern language models and the reason their vocabulary, cost and behaviour are all defined in tokens.",
    concept:
      "Modern models do not predict words; they predict tokens (Module 12). **Next-token prediction** is the same objective as next-word prediction with the unit changed: given the tokens so far, output a probability for each of the V tokens in the vocabulary being next. The change of unit has consequences that run through everything.\n\nThe output layer has one score per token, so vocabulary size fixes its width. A word that is several tokens is predicted piece by piece: 'un', then 'believ', then 'ably', each conditioned on the pieces before. Generation stops when the model predicts an end-of-sequence token. Code, numbers and other languages are predicted through whatever pieces the tokeniser gives them, which is why tokenisation quality shows up as model quality.\n\nEvery large language model in Stage 4 is trained on exactly this: trillions of (tokens so far → next token) examples, a cross-entropy loss, gradient descent. The chat behaviour added later (Stage 5) is a thin layer on top of a next-token predictor.",
    why:
      "Words would make the output layer impossibly wide and leave unseen words unpredictable; characters would make sequences too long and each prediction nearly meaningless. Tokens are the unit that makes the objective trainable at scale: a fixed vocabulary of tens of thousands, every text spellable, sequences short enough. Next-token prediction exists as the practical form of language modelling, and knowing that it is the whole objective is the key to understanding what these models are and are not.",
    how: [
      "Tokenise the corpus into IDs with the model's tokeniser.",
      "For each position, the input is the IDs so far and the target is the next ID.",
      "The model maps the input to V scores (logits); softmax turns them into probabilities (Stage 4 lesson).",
      "The loss is −log of the probability given to the true next ID, averaged over positions.",
      "Train by gradient descent across the corpus; at inference, generate by sampling the next ID repeatedly until the end token.",
    ],
    visual: {
      kind: "flow",
      steps: ["IDs so far: [450, 3797, 2563]  ('▁The ▁cat ▁sat')", "model", "logits: one score per token (V of them)", "softmax → probabilities", "loss = −log P(true next ID)   or   pick an ID to generate"],
      caption: "Training and generation share every step but the last. The model never sees words, only IDs.",
    },
    everyday: {
      title: "Finishing a word letter-group by letter-group",
      text: "Play a game where you must continue text in chunks: given 'unbel', you say 'iev'; given 'unbeliev', you say 'ably'. You can still produce whole words, but you are committing to them in pieces, and a chunk that starts badly ('unbel' then 'ongs') leads somewhere odd. That is how a token model writes: one piece at a time, each piece shaped by the pieces already down.",
    },
    engineering: {
      title: "Why the model's answer changed when a trailing space was removed",
      text: "A team's prompt ended with 'Answer: ' and the model's replies were oddly formatted. Removing the trailing space fixed it. The reason is next-token prediction over tokens: with a trailing space, the next token had to be one that does not start with a space, which is a different and rarer set of tokens than the space-prefixed words the model usually produces after 'Answer:'. The prompt had pushed the model into an unusual part of its prediction space. Understanding that the model predicts tokens, and that spaces belong to tokens, made the fix obvious.",
    },
    maths: {
      formula: "P(next = k | tokens so far) = softmax(logits)ₖ = exp(zₖ) ÷ Σⱼ exp(zⱼ);   loss = −log P(next = true token)",
      meaning: "The model outputs a score zₖ for each of the V tokens; softmax converts the scores to probabilities that sum to 1; the loss is the negative log of the true token's probability.",
      worked: [
        "A toy vocabulary of 4 tokens with logits z = [2.0, 1.0, 0.5, −1.0] for the next position.",
        "exp(z) = [7.39, 2.72, 1.65, 0.37]; sum = 12.13.",
        "Probabilities = [0.609, 0.224, 0.136, 0.030].",
        "If the true next token is index 1 (probability 0.224), loss = −log 0.224 ≈ 1.50. If it had been index 0, loss = −log 0.609 ≈ 0.50. Training nudges the logits so the true token's score rises.",
      ],
    },
    code: {
      title: "One next-token step with a real model",
      lang: "py",
      src: `import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

ids = tok("The cat sat on the", return_tensors="pt").input_ids
with torch.no_grad():
    logits = model(ids).logits[0, -1]                 # scores for the next token, one per vocabulary entry
probs = torch.softmax(logits, dim=0)
top = torch.topk(probs, 5)
for p, i in zip(top.values, top.indices):
    print(round(float(p), 3), repr(tok.decode(i)))

true_id = tok(" mat").input_ids[0]
print("loss if next is ' mat':", round(float(-torch.log(probs[true_id])), 2))`,
      lines: [
        { code: "logits = model(ids).logits[0, -1]                 # scores for the next token, one per vocabulary entry", say: "The model's output at the last position: 50,257 scores, one per token in GPT-2's vocabulary." },
        { code: "probs = torch.softmax(logits, dim=0)", say: "Softmax turns scores into a probability distribution over the next token." },
        { code: "for p, i in zip(top.values, top.indices):", say: "The five most likely next tokens. Note the leading spaces: they are part of the tokens." },
        { code: "print(\"loss if next is ' mat':\", round(float(-torch.log(probs[true_id])), 2))", say: "The training loss for this position if the real text continued with ' mat'." },
      ],
      output: "0.112 ' floor'\n0.071 ' bed'\n0.058 ' ground'\n0.041 ' couch'\n0.035 ' mat'\nloss if next is ' mat': 3.35",
      note: "GPT-2's exact numbers differ slightly by version. The point is the shape: a distribution over tokens, and a loss from the true one.",
    },
    useIt: "Knowing that the objective is next-token prediction explains model quirks (spaces, spelling, numbers), tells you what fine-tuning changes (the same loss on your text), and clarifies what a model is: a very good estimator of P(next token | context), not a database or a reasoner by design.",
    takeaways: ["Next-token prediction = next-word prediction over tokens; the exact objective of modern language models.", "The output is V logits → softmax → probabilities; loss is −log P(true token).", "Words are predicted in pieces; spaces belong to tokens; generation ends at the end token.", "Everything else a chat model does sits on top of this one objective."],
    terms: [["next-token prediction", "predicting the next token ID given the IDs so far"], ["logits", "the model's raw scores for each token before softmax"], ["end-of-sequence token", "the special token whose prediction stops generation"]],
    reflect: { q: "Why does fine-tuning a chat model on your support transcripts use the same loss as pretraining on the internet?", a: "Because the model is a next-token predictor and that is the only thing it can be trained to do: raise the probability of the tokens that actually appear. Fine-tuning changes which tokens are likely (your style, your facts) by running the identical objective on different text." },
  },

  "m14-conditional-probability": {
    simple: "Conditional probability is the probability of one thing given that another is known; a language model is nothing but conditional probabilities of the next token given the text so far.",
    concept:
      "The probability of 'sat' on its own is small: most words are not 'sat'. The probability of 'sat' given that the previous words are 'the cat' is much larger. **Conditional probability**, written P(A | B) and read 'the probability of A given B', is the probability of A once B is known. It is computed as P(A and B) ÷ P(B): of the cases where B happens, the fraction where A also happens.\n\nA language model is a conditional probability machine. Every prediction is P(next token | tokens so far). Module 3 introduced probability; this lesson makes the conditional form concrete, because it is the quantity the whole of language modelling estimates, and because the chain rule in the next lesson turns these conditionals into the probability of whole sentences.\n\nTwo habits follow. Conditioning changes everything: P(mat) and P(mat | the cat sat on the) are wildly different numbers. And the thing being conditioned on is the context, which is why what you put in a prompt changes the answer: you are changing B.",
    why:
      "Language is predictable only given context. Without conditioning, the best guess for any word is 'the', which is useless; with the right context, the next word is often nearly certain. Conditional probability is the mathematical form of 'given what we know so far', and it exists in this module because every formula that follows, chain rule, n-grams, perplexity, is built from it. Understanding P(A | B) as a ratio of counts also demystifies what a count-based model computes.",
    how: [
      "Identify the event A (the next token) and the condition B (the tokens so far).",
      "From data, count how often B occurs and how often A and B occur together.",
      "P(A | B) = count(A and B) ÷ count(B), equivalently P(A and B) ÷ P(B).",
      "Check that, for a fixed B, the conditional probabilities of all possible A sum to 1.",
      "Change B and recompute: a different context gives a different distribution.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Condition B (context)", "P(sat | B)", "P(mat | B)", "Most likely next"],
        rows: [
          ["(nothing)", "0.001", "0.0002", "the"],
          ["the cat", "0.30", "0.00", "sat"],
          ["the cat sat on the", "0.00", "0.31", "mat"],
          ["def fibonacci(n): return", "0.00", "0.00", "fibonacci"],
        ],
      },
      caption: "Same events, different conditions, completely different probabilities. The prompt is the condition.",
    },
    everyday: {
      title: "Umbrellas and clouds",
      text: "On a random day the chance you take an umbrella is low. Given that the sky is dark grey at breakfast, it is high. The umbrella did not change; what you know did. P(umbrella | dark sky) is conditional probability, and a language model's P(mat | the cat sat on the) is the same idea with text as the sky.",
    },
    engineering: {
      title: "Conditioning in a product-search autocomplete",
      text: "A retailer's search box suggests completions. Unconditioned, the top suggestions are the most common queries overall ('iphone', 'tv'), which are useless. Conditioned on the characters typed so far ('wire'), the suggestions become 'wireless headphones', 'wireless charger'. Conditioned additionally on the user's recent category ('garden'), 'wire fencing' rises to the top. Every improvement the team made was adding something to the condition: typed prefix, category, season, device. The model is a table of conditional probabilities and the engineering is choosing what to condition on.",
    },
    maths: {
      formula: "P(A | B) = P(A ∩ B) ÷ P(B) = count(A and B) ÷ count(B)",
      meaning: "The probability of A given B is the joint probability of both divided by the probability of B; with counts, it is the fraction of B-cases that are also A-cases.",
      worked: [
        "A corpus of 1,000,000 bigrams. 'the cat' appears 1,000 times; 'the cat sat' appears 300 times (as a trigram).",
        "P(sat | the cat) = 300 ÷ 1,000 = 0.30.",
        "Unconditioned: 'sat' appears 1,000 times in 1,000,000 positions: P(sat) = 0.001. Conditioning on 'the cat' raised it 300-fold.",
        "Check the distribution sums to 1: if the other continuations of 'the cat' are 'slept' (150), 'is' (250), 'was' (200), 'ran' (100): 300 + 150 + 250 + 200 + 100 = 1,000 = count(the cat). The conditional probabilities 0.30 + 0.15 + 0.25 + 0.20 + 0.10 = 1.0.",
      ],
    },
    code: {
      title: "Conditional probabilities from counts, summing to one",
      lang: "py",
      src: `from collections import Counter

text = "the cat sat . the cat slept . the cat sat . the cat is here . the dog sat .".split()
joint = Counter(zip(text, text[1:]))          # count(B, A) for adjacent pairs
single = Counter(text)                         # count(B)

def conditional(a, b):
    return joint[(b, a)] / single[b]

print("P(sat | cat) =", round(conditional("sat", "cat"), 2))
print("P(sat | dog) =", round(conditional("sat", "dog"), 2))
print("P(sat) =", round(single["sat"] / len(text), 3))

dist = {a: round(conditional(a, "cat"), 2) for (b, a) in joint if b == "cat"}
print(dist, "sum =", round(sum(dist.values()), 2))`,
      lines: [
        { code: "return joint[(b, a)] / single[b]", say: "The definition in code: count of the pair over the count of the condition." },
        { code: "print(\"P(sat | cat) =\", round(conditional(\"sat\", \"cat\"), 2))", say: "Given 'cat', 'sat' is likely. Given 'dog', it is certain in this tiny corpus." },
        { code: "dist = {a: round(conditional(a, \"cat\"), 2) for (b, a) in joint if b == \"cat\"}", say: "All continuations of one condition form a distribution." },
        { code: "print(dist, \"sum =\", round(sum(dist.values()), 2))", say: "They sum to one: a conditional distribution is a complete set of probabilities for 'what comes next'." },
      ],
      output: "P(sat | cat) = 0.5\nP(sat | dog) = 1.0\nP(sat) = 0.143\n{'sat': 0.5, 'slept': 0.25, 'is': 0.25} sum = 1.0",
    },
    useIt: "Read every prompt as a condition: what you include changes the distribution the model predicts from. Read every model output as a sample from P(next | context). When a count-based or neural model seems to behave strangely, ask what it was conditioned on.",
    takeaways: ["P(A | B) = P(A and B) ÷ P(B): the probability of A once B is known.", "A language model estimates P(next token | tokens so far); the prompt is B.", "For a fixed condition, the probabilities of all next tokens sum to 1.", "Changing the condition changes everything, which is why prompts matter."],
    terms: [["conditional probability", "the probability of one event given that another has occurred"], ["joint probability", "the probability of two events occurring together"], ["condition / context", "the known information the probability is computed given"]],
    reflect: { q: "Two prompts differ only by adding 'You are a pirate.' at the start. Explain in terms of conditional probability why the replies differ.", a: "The model samples from P(next | prompt). The prefix changes the condition B, and in the training text sentences following pirate framing contain 'arr', 'matey' and nautical words far more often, so those tokens' conditional probabilities rise. Nothing about the model changed; the condition did." },
  },

  "m14-probability-of-a-sequence": {
    simple: "The probability of a whole sequence is the product of each token's conditional probability given the tokens before it (the chain rule), computed in log space so the numbers stay usable.",
    concept:
      "A language model gives the probability of the next token. To score a whole sentence, use the **chain rule of probability**: the probability of a sequence is the probability of the first token, times the probability of the second given the first, times the probability of the third given the first two, and so on. P(w₁ w₂ w₃) = P(w₁) × P(w₂ | w₁) × P(w₃ | w₁ w₂). No approximation is involved; this is exactly true for any sequence.\n\nIt is also the reason a next-token predictor is a complete language model: if you can give each conditional, you can score anything. N-gram models approximate the conditionals with short contexts; neural models approximate them with the full context.\n\nThe products become astronomically small (a 100-token sentence might have probability 10⁻²⁰⁰), so in practice logs are added: log P(sequence) = Σ log P(wᵢ | w₁ … wᵢ₋₁). Dividing that sum by the number of tokens gives the average log probability per token, which is the quantity perplexity (two lessons on) is built from, and which training loss is the negative of.",
    why:
      "Scoring whole texts is what many tasks need: which transcription of this audio, which translation, which of two paraphrases is more natural, how surprising is this document. The chain rule exists as the bridge from per-token predictions to whole-text probabilities, and log-space arithmetic exists because without it the numbers underflow to zero on any real text. Together they make 'how likely is this text?' computable.",
    how: [
      "Tokenise the sequence and add a start marker.",
      "For each position i, get P(wᵢ | w₁ … wᵢ₋₁) from the model.",
      "Take the log of each probability and add them up: the sequence's log probability.",
      "If needed, exponentiate to get the probability itself (rarely needed; the log is what is compared).",
      "Divide by the number of tokens to get a per-token average, comparable across texts of different lengths.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Position", "Token", "P(token | before)", "log P", "Running sum"],
        rows: [
          ["1", "the", "0.20", "−1.61", "−1.61"],
          ["2", "cat", "0.05", "−3.00", "−4.61"],
          ["3", "sat", "0.30", "−1.20", "−5.81"],
          ["4", "on", "0.80", "−0.22", "−6.03"],
          ["5", "the", "0.75", "−0.29", "−6.32"],
          ["6", "mat", "0.31", "−1.17", "−7.49"],
        ],
      },
      caption: "The sequence probability is e^(−7.49) ≈ 0.00056; the per-token average is −7.49 ÷ 6 ≈ −1.25. Each row is one conditional probability from the model.",
    },
    everyday: {
      title: "The odds of a whole journey",
      text: "The chance of a train journey going smoothly is the chance the first train is on time, times the chance the connection works given you arrived on time, times the chance the last leg is fine given all that. Every leg conditions on the previous ones, and the whole trip's odds are the product. Sentences are journeys through tokens; the chain rule multiplies the legs.",
    },
    engineering: {
      title: "Choosing between transcriptions",
      text: "A call-centre analytics system receives three candidate transcriptions of the same audio from the acoustic model: 'I'd like to cancel my order', 'I'd like to cancel my odour', 'I'd like to council my order'. It scores each with a language model using the chain rule in log space: the first sums to about −18, the others to −31 and −29. The first wins by a wide margin, and the system never needed a rule about odours. The same scoring ranks candidate translations and spelling corrections.",
    },
    maths: {
      formula: "P(w₁ … wₙ) = Π P(wᵢ | w₁ … wᵢ₋₁);   log P(w₁ … wₙ) = Σ log P(wᵢ | w₁ … wᵢ₋₁)",
      meaning: "The chain rule: a sequence's probability is the product of its conditionals. In logs, the product becomes a sum.",
      worked: [
        "'the cat sat': P(the) = 0.2, P(cat | the) = 0.05, P(sat | the cat) = 0.3.",
        "Product: 0.2 × 0.05 × 0.3 = 0.003. Logs: −1.61 + (−3.00) + (−1.20) = −5.81; e^(−5.81) ≈ 0.003. Same answer.",
        "A 100-token text with average per-token probability 0.1 has probability 0.1¹⁰⁰ = 10⁻¹⁰⁰, far below what a 64-bit float can hold as a product of many small numbers. Its log is 100 × log 0.1 = −230.3: an ordinary number.",
        "Per-token average log probability = −230.3 ÷ 100 = −2.303 = log 0.1. Length-normalised, so a 10-token and a 1,000-token text can be compared.",
      ],
    },
    code: {
      title: "Scoring sequences with a real model",
      lang: "py",
      src: `import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

def log_prob(text):
    ids = tok(tok.bos_token + text, return_tensors="pt").input_ids
    with torch.no_grad():
        logits = model(ids).logits[0, :-1]                  # predictions for positions 2..n
    logp = torch.log_softmax(logits, dim=-1)
    targets = ids[0, 1:]
    token_logps = logp[range(len(targets)), targets]        # log P(true token | before), per position
    return float(token_logps.sum()), float(token_logps.mean())

for s in ["I'd like to cancel my order.", "I'd like to cancel my odour.", "I'd like to council my order."]:
    total, per_token = log_prob(s)
    print(round(total, 1), round(per_token, 2), s)`,
      lines: [
        { code: "logits = model(ids).logits[0, :-1]                  # predictions for positions 2..n", say: "One forward pass gives the next-token scores at every position at once; the last position predicts beyond the text and is dropped." },
        { code: "token_logps = logp[range(len(targets)), targets]        # log P(true token | before), per position", say: "Pick out, at each position, the log probability of the token that actually came next. These are the chain rule's factors." },
        { code: "return float(token_logps.sum()), float(token_logps.mean())", say: "The sum is the sequence's log probability; the mean is the per-token average that perplexity uses." },
      ],
      output: "-29.4 -3.27 I'd like to cancel my order.\n-45.8 -5.09 I'd like to cancel my odour.\n-41.2 -4.58 I'd like to council my order.",
      note: "Exact values vary by model version. The ranking is what matters, and it is right.",
    },
    useIt: "Use sequence scoring to rank candidates (transcriptions, translations, corrections), to detect unusual or machine-generated text, and to measure how well a model fits a document. Always work in log space and compare per-token averages across texts of different lengths.",
    takeaways: ["Chain rule: P(sequence) = product of P(token | all previous tokens). Exactly true.", "A next-token predictor is therefore a complete language model.", "Compute in logs: sums instead of products; no underflow.", "Per-token average log probability compares texts of different lengths and feeds perplexity."],
    terms: [["chain rule of probability", "a joint probability equals the product of successive conditional probabilities"], ["log probability", "the natural logarithm of a probability; sums replace products"], ["underflow", "a number too small for the computer to represent, rounding to zero"]],
    reflect: { q: "Two texts: a 5-token headline with log probability −12 and a 50-token paragraph with log probability −90. Which does the model find more natural?", a: "Compare per token: −12 ÷ 5 = −2.4 for the headline, −90 ÷ 50 = −1.8 for the paragraph. The paragraph is more natural per token despite its lower total; totals always fall with length, so only averages are comparable." },
  },

  "m14-language-model-training": {
    simple: "Training a language model means adjusting its parameters so that the probability it gives to the real next tokens in a corpus goes up; for count models that is counting, for neural models it is gradient descent on the next-token loss.",
    concept:
      "**Language-model training** has one goal whatever the model: make real text probable. For a count-based model, training is literally counting the corpus once and dividing. For a neural model, training is the loop from Module 5 applied to next-token prediction: feed a batch of token sequences, compute the loss (average negative log probability of the true next tokens), compute gradients, update the parameters, repeat.\n\nThe data pipeline matters as much as the loop. The corpus is cleaned and deduplicated, tokenised once into a long stream of IDs, and cut into fixed-length windows (say 2,048 tokens). Each window yields a prediction at every position. Batches of windows are fed to the model; one pass over the corpus is an epoch, and large models usually see each token only once or a few times because the corpus is so large.\n\nA held-out slice of the corpus is never trained on. The model's loss on it, reported as perplexity, is the honest measure of whether the model is learning language or memorising text. When validation loss stops falling, the model has learned what it can from that data at that size.",
    why:
      "A model is only as good as what training made it, and language-model training has its own shape: self-supervised, data-hungry, measured by a loss on held-out text, sensitive to data quality and duplication, and expensive enough that choices are made before the run rather than by trial. The lesson exists so that 'pretrained on X' reads as a specific procedure with specific failure modes, and so that fine-tuning (Stage 5), which is this same loop on new text, is understood as nothing exotic.",
    how: [
      "Prepare the corpus: collect, clean, deduplicate, filter for quality; tokenise into one stream of IDs.",
      "Cut the stream into windows of the model's context length; shuffle windows into batches.",
      "For each batch: forward pass to get logits at every position; loss = mean −log P(true next token); backward pass; optimiser step.",
      "Periodically compute the loss on a held-out validation set; track perplexity; save checkpoints.",
      "Stop when validation loss plateaus or the token budget is spent; keep the best checkpoint.",
    ],
    visual: {
      kind: "flow",
      steps: ["corpus (cleaned, deduplicated)", "tokenise → stream of IDs", "windows of 2,048 tokens → batches", "forward: logits at every position", "loss: −log P(true next) averaged", "backward + optimiser step", "every N steps: validation perplexity, checkpoint"],
      caption: "The Module 5 training loop with next-token loss. The data preparation steps on the left are where most of the human effort goes.",
    },
    everyday: {
      title: "Learning to predict a friend's texts",
      text: "After years of messages you can guess how a friend will finish a sentence. You were never corrected by a teacher; each message corrected you by itself, because the real next words arrived. If you only ever read their messages about football, you would predict football well and everything else badly. Training a language model is that experience at scale, and the corpus is the friend.",
    },
    engineering: {
      title: "A small domain model trained overnight",
      text: "A legal-tech team pretrained a 125-million-parameter model on 3 billion tokens of contracts and case law, on four GPUs, in two days. The run itself was routine; the work was the data: deduplicating near-identical filings (which otherwise dominated the loss), removing scanned-document noise, holding out 1% of documents for validation. They watched validation perplexity fall from 40 to 9 over the run and stopped when it flattened. The model, fine-tuned afterwards for clause extraction, beat a general model five times its size on their task, because its training text was their text.",
    },
    maths: {
      formula: "L(θ) = −(1/N) Σᵢ log P_θ(tᵢ | t₁ … tᵢ₋₁);   θ ← θ − η ∇L(θ)",
      meaning: "The loss L is the average negative log probability of the true next tokens across N positions, as a function of the parameters θ. Each step moves the parameters against the gradient, scaled by the learning rate η.",
      worked: [
        "A batch of 8 windows × 2,048 tokens = 16,384 predictions. Suppose the average −log P is 3.2 at step 1,000.",
        "Perplexity = e^3.2 ≈ 24.5: the model is 'as uncertain as choosing among 24.5 tokens' on average.",
        "At step 50,000 the average is 2.1: perplexity e^2.1 ≈ 8.2. The model has become three times less confused per token.",
        "If the validation loss at step 50,000 is 2.15 and training loss is 2.10, the gap is small: no overfitting. If training were 1.4 and validation 2.9, the model would be memorising training text.",
      ],
    },
    code: {
      title: "The training loop for a tiny neural language model",
      lang: "py",
      src: `import torch, torch.nn as nn

# toy data: a stream of token IDs and a vocabulary of 50
ids = torch.randint(0, 50, (20000,))
CTX, BATCH = 16, 32

class TinyLM(nn.Module):
    def __init__(self, vocab=50, d=32):
        super().__init__()
        self.emb = nn.Embedding(vocab, d)
        self.rnn = nn.GRU(d, d, batch_first=True)
        self.out = nn.Linear(d, vocab)
    def forward(self, x):
        h, _ = self.rnn(self.emb(x))
        return self.out(h)                                  # logits at every position

model, opt = TinyLM(), torch.optim.Adam(TinyLM().parameters(), lr=1e-3)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

for step in range(300):
    starts = torch.randint(0, len(ids) - CTX - 1, (BATCH,))
    x = torch.stack([ids[s:s + CTX] for s in starts])        # inputs: tokens so far
    y = torch.stack([ids[s + 1:s + CTX + 1] for s in starts])  # targets: the next tokens
    logits = model(x)
    loss = loss_fn(logits.reshape(-1, 50), y.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()
    if step % 100 == 0:
        print(step, round(float(loss), 3), "perplexity", round(float(torch.exp(loss)), 1))`,
      lines: [
        { code: "x = torch.stack([ids[s:s + CTX] for s in starts])        # inputs: tokens so far", say: "A batch of windows cut from the token stream. Each is a sequence of inputs." },
        { code: "y = torch.stack([ids[s + 1:s + CTX + 1] for s in starts])  # targets: the next tokens", say: "The targets are the same windows shifted by one: at every position, the next token." },
        { code: "loss = loss_fn(logits.reshape(-1, 50), y.reshape(-1))", say: "Cross-entropy between the predicted distribution and the true next token, averaged over every position in the batch." },
        { code: "opt.zero_grad(); loss.backward(); opt.step()", say: "The Module 5 loop: gradients, then a step. Nothing about language modelling changes it." },
        { code: "print(step, round(float(loss), 3), \"perplexity\", round(float(torch.exp(loss)), 1))", say: "Perplexity is the exponential of the loss. On random data it stays near 50 (the vocabulary size); on real text it falls." },
      ],
      output: "0 3.92 perplexity 50.4\n100 3.91 perplexity 49.9\n200 3.91 perplexity 49.9",
      note: "The data here is random, so nothing is learnable and perplexity stays at the vocabulary size. Replace ids with tokenised real text and watch it fall: that is the whole of language-model training.",
    },
    useIt: "You will rarely pretrain from scratch, but you will fine-tune (the same loop on your text), evaluate (the same loss on held-out text) and prepare data (the part that decides quality). Watch validation perplexity, deduplicate, hold out properly, and treat the loss as the model's measure of fit to your text.",
    takeaways: ["Training makes real text probable: counting for count models, gradient descent on next-token loss for neural ones.", "Data preparation (clean, deduplicate, tokenise, window, hold out) is most of the work.", "Validation perplexity is the honest progress measure; a training/validation gap means memorisation.", "Fine-tuning is this same loop on different text."],
    terms: [["pretraining corpus", "the large body of text a language model is first trained on"], ["context window (training)", "the fixed number of tokens in each training sequence"], ["validation set", "held-out text never trained on, used to measure real learning"]],
    reflect: { q: "A model's training perplexity is 4 and its validation perplexity is 30 after many epochs on a small corpus. What happened and what would you change?", a: "It memorised the training text: it predicts text it has seen almost perfectly and generic text poorly. Train for fewer epochs, use more or more varied data, add regularisation or dropout, and pick the checkpoint with the lowest validation perplexity rather than the last one." },
  },

  "m14-model-vocabulary": {
    simple: "A model's vocabulary is the fixed set of tokens it can read and predict, fixed when the tokeniser is trained; it bounds what the model can represent and sets the width of its output layer.",
    concept:
      "A language model's **vocabulary** is the list of tokens its tokeniser produces and its output layer scores. It is fixed before training and does not change afterwards: the embedding table has one row per entry, the output layer has one column per entry, and training shaped both. A token outside the vocabulary cannot be read except as pieces, and cannot be produced at all.\n\nFor a count-based model, the vocabulary is simply the set of words seen in the corpus, plus an unknown symbol. For a neural model it is the tokeniser's vocabulary from Module 12: tens of thousands of subword pieces, learned from a corpus, including special tokens for structure.\n\nTwo consequences matter in practice. The vocabulary decides what is cheap: text that tokenises to few pieces was common in the tokeniser's training data. And the vocabulary is tied to the model: a checkpoint is useless without its exact vocabulary, and extending the vocabulary (adding domain tokens, a new language) means adding rows and columns that must then be trained.",
    why:
      "Everything a model does passes through its vocabulary twice, on the way in and on the way out. The lesson exists because vocabulary is where language models meet the limits of their design: the set is closed, it was chosen by someone else's corpus, and it quietly decides cost and quality per language and domain. Knowing this prevents a class of mistakes (mismatched tokenisers, expecting new symbols to work, ignoring per-language cost) and explains why extending a model to a new domain sometimes starts with its vocabulary.",
    how: [
      "Train the tokeniser on a corpus; the resulting pieces plus special tokens are the vocabulary.",
      "Size the embedding table (V × d) and output layer (d × V) to the vocabulary.",
      "Train the model; every row and column is shaped by how its token appears in the data.",
      "Ship the vocabulary with the model checkpoint; load both together, always.",
      "To extend: add new tokens, initialise their rows (often from the average of their pieces), and fine-tune so they are learned.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model family (illustrative)", "Vocabulary size", "Source of pieces", "Consequence"],
        rows: [
          ["count-based n-gram", "every word in the corpus (+UNK)", "words", "unseen words → UNK"],
          ["BERT-style", "~30,000 WordPiece", "English Wikipedia + books", "English cheap; other scripts fragmented"],
          ["GPT-style", "~50,000–100,000 byte-level BPE", "web text", "anything spellable; code and other languages costlier"],
          ["multilingual models", "~250,000 SentencePiece", "balanced multilingual corpus", "fairer across scripts; large embedding table"],
        ],
      },
      caption: "The vocabulary carries the fingerprint of the tokeniser's training corpus, and the model inherits it for life.",
    },
    everyday: {
      title: "A keyboard with a fixed set of keys",
      text: "A typewriter has a fixed set of keys. Any letter not on it cannot be typed, however hard you press, and a document in a script the typewriter lacks has to be approximated with whatever keys exist. A model's vocabulary is its set of keys: chosen when the machine was built, and the limit of what it can produce.",
    },
    engineering: {
      title: "Adding chemistry tokens to a model",
      text: "A pharmaceutical team fine-tuned a general model on chemistry papers and found molecule names like 'acetylsalicylic' shattering into six or seven pieces, which the model handled poorly. They extended the vocabulary with 2,000 common chemical fragments, initialised each new row as the average of the rows of its old pieces, resized the output layer, and fine-tuned. Average tokens per molecule name fell from 6.1 to 2.3, and extraction accuracy rose eight points. The cost was a model that is no longer interchangeable with its base: it must always ship with its extended vocabulary.",
    },
    maths: {
      formula: "parameters tied to vocabulary = V × d (embeddings) + d × V (output) = 2 V d  (or V d if shared)",
      meaning: "Both the input table and the output layer scale with vocabulary size times model dimension.",
      worked: [
        "V = 50,000, d = 768 (a small model): 2 × 50,000 × 768 = 76.8 million parameters in vocabulary-tied layers. If the model has 125 million parameters total, that is over 60%.",
        "Extending by 2,000 tokens adds 2 × 2,000 × 768 ≈ 3.1 million parameters that start untrained.",
        "For a large model with d = 8,192 and V = 128,000: 2 × 128,000 × 8,192 ≈ 2.1 billion vocabulary parameters, a few percent of a 70-billion model.",
      ],
    },
    code: {
      title: "Inspecting and extending a vocabulary",
      lang: "py",
      src: `from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

print("vocabulary size:", len(tok))
print("acetylsalicylic ->", tok.tokenize("acetylsalicylic"))

added = tok.add_tokens(["acetylsalicylic", "ibuprofen"])
model.resize_token_embeddings(len(tok))              # new rows in the embedding table and output layer
print("added", added, "new size:", len(tok))
print("acetylsalicylic ->", tok.tokenize("acetylsalicylic"))
print("embedding rows:", model.get_input_embeddings().weight.shape)`,
      lines: [
        { code: "print(\"acetylsalicylic ->\", tok.tokenize(\"acetylsalicylic\"))", say: "A chemistry word shatters into pieces under a web-text vocabulary." },
        { code: "added = tok.add_tokens([\"acetylsalicylic\", \"ibuprofen\"])", say: "New entries appended to the vocabulary. The tokeniser will now emit them whole." },
        { code: "model.resize_token_embeddings(len(tok))              # new rows in the embedding table and output layer", say: "The model must grow to match: new embedding rows and output columns, randomly initialised, to be learned by fine-tuning." },
      ],
      output: "vocabulary size: 50257\nacetylsalicylic -> ['acet', 'yls', 'al', 'icy', 'lic']\nadded 2 new size: 50259\nacetylsalicylic -> ['acetylsalicylic']\nembedding rows: torch.Size([50259, 768])",
      note: "Until fine-tuning, the new rows know nothing; the model treats the new token as noise. Vocabulary extension is step one of two.",
    },
    useIt: "Load vocabulary and model together, always. Check how your domain's key terms tokenise before fine-tuning. Extend the vocabulary when important terms fragment badly, then fine-tune so the new tokens are learned, and version the extended vocabulary with the model.",
    takeaways: ["The vocabulary is the fixed set of tokens a model reads and predicts; it sets the embedding and output sizes.", "It inherits its tokeniser's corpus: cheap for that corpus's language and domain, costly elsewhere.", "A checkpoint without its exact vocabulary is useless.", "Extending the vocabulary adds untrained rows that fine-tuning must teach."],
    terms: [["model vocabulary", "the fixed set of tokens a model can read and produce"], ["vocabulary extension", "adding tokens to a trained model's vocabulary and resizing its embedding and output layers"], ["tied embeddings", "sharing the input embedding table and the output layer's weights"]],
    reflect: { q: "After adding 2,000 chemistry tokens, the model's outputs became worse before fine-tuning. Why?", a: "The new rows are random, so whenever the tokeniser now emits a new token, the model receives a meaningless embedding where it used to receive known pieces. Until fine-tuning teaches the new rows, the extension removes information. Extension and fine-tuning are one operation in two steps." },
  },

  "m14-perplexity": {
    simple: "Perplexity is the standard score for a language model: the exponential of its average per-token loss, read as 'how many tokens is the model effectively choosing between'; lower is better.",
    concept:
      "How good is a language model? The direct measure is how probable it finds real text it has not seen. **Perplexity** packages that as one number: take the average negative log probability per token on a held-out text (the loss), and raise e to that power. A model with perplexity 20 is, on average, as uncertain as if it were choosing uniformly among 20 tokens at each step. Perplexity 1 would mean it predicts every token with certainty; perplexity equal to the vocabulary size means it has learned nothing.\n\nPerplexity is comparable only under fixed conditions: the same tokeniser (a model that uses more tokens per word has an easier per-token task), the same text, and the same context length. Within those conditions it is the measure that language-model research and training runs track, and the number that falls as a model trains.\n\nIt is a measure of fit to text, not of usefulness. A model can have excellent perplexity on web text and still be unhelpful, unsafe or wrong; Stage 5 and Stage 8 add the measures that matter for products. But for 'is this model learning language?' perplexity is the answer.",
    why:
      "Training needs a single number that improves as the model improves and that can be compared across checkpoints and between models. Loss is that number, but loss in nats per token is hard to interpret. Perplexity turns the same quantity into 'effective number of choices', which people can reason about: perplexity 8 versus 24 is clearer than loss 2.1 versus 3.2. It exists as the readable form of the training objective evaluated on honest data.",
    how: [
      "Hold out text the model never trained on; tokenise it with the model's tokeniser.",
      "Run the model over it and record, at every position, log P(true next token | context).",
      "Average the negative log probabilities: this is the cross-entropy loss per token.",
      "Perplexity = e raised to that average (or 2 raised to it, if logs were base 2).",
      "Compare only across runs that share tokeniser, text and context length.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Average loss per token (nats)", "Perplexity = e^loss", "Reads as", "Typical of"],
        rows: [
          ["log(50,000) ≈ 10.8", "50,000", "choosing uniformly over the whole vocabulary", "an untrained model"],
          ["4.6", "100", "100-way uncertainty", "a weak n-gram model on general text"],
          ["3.0", "20", "20-way", "a decent small neural model"],
          ["2.1", "8", "8-way", "a good model on in-domain text"],
          ["0", "1", "certainty at every token", "impossible for real text (text has genuine uncertainty)"],
        ],
      },
      caption: "Perplexity makes the loss readable. Real text is unpredictable, so a floor exists above 1 even for a perfect model.",
    },
    everyday: {
      title: "How many guesses do you need?",
      text: "In a guessing game, a friend thinks of the next word of a sentence. If you usually need about three guesses, you are a perplexity-3 player for that friend's sentences; if you need twenty, perplexity 20. A stranger whose sentences you cannot anticipate pushes you toward the whole dictionary. Perplexity counts the guesses a model would need.",
    },
    engineering: {
      title: "Perplexity as a data-quality alarm",
      text: "A team fine-tuning a model on customer chat logs tracked perplexity on a held-out slice of the logs each epoch: it fell from 31 to 9, then rose to 11 at epoch 5, so they kept the epoch-4 checkpoint. Later they ran the model's perplexity over new incoming logs weekly as a drift check: when a product launch changed how customers wrote, perplexity on new logs jumped from 9 to 16 before any accuracy metric moved, giving them two weeks' warning to collect new data. Perplexity measured fit, and fit is what drifts first.",
    },
    maths: {
      formula: "PPL = exp( −(1/N) Σᵢ log P(tᵢ | t₁ … tᵢ₋₁) ) = exp(average loss)",
      meaning: "Average the negative log probabilities over N tokens, then exponentiate. Equivalently, the inverse geometric mean of the per-token probabilities.",
      worked: [
        "Held-out text 'the cat sat on the mat' with per-token log probabilities −1.61, −3.00, −1.20, −0.22, −0.29, −1.17 (from the sequence-probability lesson). Sum = −7.49; N = 6.",
        "Average loss = 7.49 ÷ 6 ≈ 1.25 nats per token.",
        "Perplexity = e^1.25 ≈ 3.5. The model behaves as if choosing among 3.5 equally likely tokens at each step of this sentence.",
        "If a different tokeniser cut the same sentence into 9 tokens, each easier to predict, the per-token average might be 0.9 and perplexity e^0.9 ≈ 2.5, despite identical knowledge. Only compare perplexities under the same tokeniser.",
      ],
    },
    code: {
      title: "Computing a model's perplexity on a text",
      lang: "py",
      src: `import math, torch
from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

def perplexity(text):
    ids = tok(tok.bos_token + text, return_tensors="pt").input_ids
    with torch.no_grad():
        loss = model(ids, labels=ids).loss                  # mean −log P(true next token) over positions
    return math.exp(float(loss)), len(ids[0]) - 1

for text in ["The cat sat on the mat and purred softly.", "Mat the purred cat on softly the sat and.", "Yesterday the committee approved the budget for the new library."]:
    ppl, n = perplexity(text)
    print(round(ppl, 1), "over", n, "tokens |", text)`,
      lines: [
        { code: "loss = model(ids, labels=ids).loss                  # mean −log P(true next token) over positions", say: "Passing the text as its own labels makes the model compute the average next-token loss directly." },
        { code: "return math.exp(float(loss)), len(ids[0]) - 1", say: "Exponentiate the average loss: perplexity. The token count is reported because comparisons need it." },
        { code: "for text in [\"The cat sat on the mat and purred softly.\", \"Mat the purred cat on softly the sat and.\", \"Yesterday the committee approved the budget for the new library.\"]:", say: "The same words scrambled should be far more perplexing; ordinary prose should be low." },
      ],
      output: "38.2 over 10 tokens | The cat sat on the mat and purred softly.\n1894.6 over 11 tokens | Mat the purred cat on softly the sat and.\n27.5 over 13 tokens | Yesterday the committee approved the budget for the new library.",
      note: "Scrambled text has fifty times the perplexity of the same words in order. Perplexity measures how well the model's expectations match the text.",
    },
    useIt: "Use perplexity to track training and fine-tuning, to choose checkpoints, to compare models under identical conditions, to detect distribution drift in incoming text, and as a quick signal of whether a document is in-domain for a model. Do not use it as a measure of helpfulness or correctness.",
    takeaways: ["Perplexity = e^(average per-token loss): the effective number of choices per token; lower is better.", "Comparable only with the same tokeniser, text and context length.", "Tracks fit to text: training progress, checkpoint choice, drift.", "Says nothing about usefulness, safety or truth."],
    terms: [["perplexity", "the exponential of a language model's average per-token loss on held-out text"], ["nats", "the unit of a natural-log loss; a loss of 1 nat per token gives perplexity e ≈ 2.72"], ["held-out text", "text kept out of training to measure the model honestly"]],
    reflect: { q: "Model A has perplexity 12 and model B has perplexity 9 on the same test set, but each used its own tokeniser. Can you conclude B is better?", a: "No. If B's tokeniser splits text into more, easier pieces, its per-token perplexity is lower for that reason alone. To compare, either use the same tokeniser or convert both to perplexity per character (or per word) by accounting for how many tokens each produced." },
  },

  "m14-why-language-models-predict-rather-than-understand-like-humans": {
    simple: "A language model is trained only to predict text; what looks like understanding is a very good model of what people write, which overlaps with understanding in many places and differs from it in predictable ones.",
    concept:
      "Everything in this module points to one fact: a **language model predicts text**. It was trained to raise the probability of the next token in human writing, and nothing else. When it answers a question, explains a joke or writes code, it is producing the continuation that human text makes most probable, using whatever regularities it absorbed to do that well.\n\nThat is why its behaviour overlaps so much with understanding: predicting human text well requires modelling the grammar, facts, reasoning patterns and intentions that shaped the text. It is also why it differs. The model has no access to the world, only to text about the world; it has no goal of being right, only of being likely; it has no memory beyond its context window; it cannot check anything; and it treats a confident wrong sentence that people often write as more probable than a correct one they rarely write.\n\nSo the honest description is neither 'it understands' nor 'it is just autocomplete'. It is a model of language use, extraordinarily good, whose competence tracks how well the thing you ask for is represented in text, and whose failures appear exactly where text and truth come apart.",
    why:
      "Engineers who think the model understands over-trust it: they skip verification, give it tools it should not have, and are surprised by confident errors. Engineers who think it is 'just predicting' under-use it: they miss that prediction over enough text yields reasoning-like behaviour that is genuinely useful. The lesson exists to put a precise picture in place before Stage 4 opens the architecture and Stage 6 builds products: the model predicts, prediction encodes a lot, and the gaps are specific.",
    how: [
      "Ask what text the model's training data contained about the task; competence tracks representation in text.",
      "Expect fluent output regardless of correctness: fluency is what was optimised.",
      "Expect facts to be as reliable as they are common and consistent in text; rare, recent or contested facts are unreliable.",
      "Expect reasoning to work where similar reasoning appears in text, and to fail on novel structure, long chains or exact arithmetic.",
      "Supply what the model lacks from outside: facts via retrieval, actions via tools, checking via code and people (Stages 6–8).",
    ],
    visual: {
      kind: "compare",
      left: { title: "Where prediction looks like understanding", points: ["grammar, style, tone, register", "common facts stated consistently in text", "explanations and arguments that appear often", "code for well-trodden tasks", "translation and paraphrase"] },
      right: { title: "Where prediction and understanding come apart", points: ["facts rarely or inconsistently stated; anything after training", "exact arithmetic and counting", "checking its own claims against reality", "novel reasoning chains with no textual precedent", "knowing what it does not know"] },
      caption: "Both columns follow from one objective. Products are built by using the left and guarding the right.",
    },
    everyday: {
      title: "The brilliant exam student who never left the library",
      text: "Imagine someone who has read everything ever written but has never seen the world. They can discuss any subject fluently, pass most exams, and write in any style. Ask them what the weather is now, and they will tell you, confidently, from what weather reports usually say. They are not lying; they are continuing the text. A language model is that student, and the fix is the same: give them a window, a calculator, and a reason to say 'I don't know'.",
    },
    engineering: {
      title: "The citation that did not exist",
      text: "A legal team used a model to draft a brief and it cited a case, with a plausible name, court and year, that had never existed. The model had predicted what a citation in that position of that kind of paragraph looks like, which it had seen thousands of times, and produced a perfect example of the form. No understanding of 'this case must exist' was ever part of the objective. The team's fix was structural: citations now come from a retrieval tool over a real case database, and the model is only allowed to quote what the tool returned. The model predicts; the tool knows.",
    },
    useIt: "Design every AI feature around this picture. Use the model for what text represents well: language, style, common knowledge, common reasoning. Supply from outside what it lacks: current facts, private data, calculations, actions, verification. Treat fluency as no evidence of correctness, and build evaluation around the failures this lesson predicts.",
    takeaways: ["A language model is trained to predict text and nothing else.", "Prediction over enough text encodes grammar, facts, reasoning patterns and style; that is the overlap with understanding.", "The gaps are specific: no world access, no truth objective, no memory, no self-checking, confident errors where text is wrong or rare.", "Products use the overlap and guard the gaps with retrieval, tools, checks and people."],
    terms: [["text prediction", "producing the most probable continuation of text, the model's sole objective"], ["fluency", "producing natural, well-formed language, independent of correctness"], ["grounding", "connecting a model's output to real data or tools rather than to text patterns alone"]],
    reflect: { q: "A model explains a physics concept beautifully and then gets a simple numerical calculation wrong in the same answer. Why is this not a contradiction?", a: "Explanations of that concept appear thousands of times in text, so the model predicts them well. Exact arithmetic on specific numbers appears rarely with those numbers, and tokens of digits are chunked awkwardly, so prediction is unreliable there. Both behaviours come from the same objective; one task is well represented in text, the other is not." },
  },
};

export const M14_QUIZ: Quiz[] = [
  {
    q: "What does a language model fundamentally compute?",
    options: ["Whether a sentence is true", "A probability distribution over the next token given the tokens so far", "The meaning of a word", "The grammar rules of a language"],
    answer: 1,
    why: ["Probability of text is not truth.", "Correct. Everything else, from scoring to chat, is built on this.", "Meaning may be encoded but is not the output.", "Grammar is absorbed, not computed as rules."],
    reason: true,
  },
  {
    q: "Why does a count-based model give zero probability to 'the cat purred'?",
    options: ["Cats do not purr in text", "The trigram was never seen in the corpus, and the estimate is a ratio of counts", "The model is too large", "Purred is not a word"],
    answer: 1,
    why: ["They do; the corpus just lacked it.", "Correct. Maximum-likelihood counts give zero to anything unseen; smoothing fixes it.", "Size is irrelevant.", "It is a word."],
  },
  {
    q: "Increasing an n-gram model's n from 3 to 7 on the same corpus usually…",
    options: ["Improves everything", "Makes most contexts unseen, so estimates are noisy or backed off; often worse", "Reduces vocabulary size", "Removes the need for smoothing"],
    answer: 1,
    why: ["More context needs far more data.", "Correct. Long contexts rarely repeat; the model falls back to shorter n-grams anyway.", "Unrelated.", "It needs smoothing more."],
  },
  {
    q: "Why is next-word (or next-token) prediction called self-supervised?",
    options: ["The model supervises itself", "The training labels are the text's own next words; no human labelling is needed", "It uses no training data", "It only works on supervised datasets"],
    answer: 1,
    why: ["Loosely, but the point is where the labels come from.", "Correct. Every text is its own answer key, which is why models can train on trillions of words.", "It uses enormous amounts of data.", "The opposite."],
  },
  {
    q: "The chain rule lets a next-token predictor score whole sentences because…",
    options: ["Sentences are short", "P(sequence) is exactly the product of successive conditional probabilities", "It averages word frequencies", "It ignores order"],
    answer: 1,
    why: ["Length is irrelevant.", "Correct. P(w₁w₂w₃) = P(w₁)P(w₂|w₁)P(w₃|w₁w₂), computed in logs.", "No.", "Order is central."],
    reason: true,
  },
  {
    q: "A model's average loss is 2.3 nats per token on held-out text. Its perplexity is about…",
    options: ["2.3", "10", "100", "0.1"],
    answer: 1,
    why: ["Perplexity is e^loss, not the loss.", "Correct. e^2.3 ≈ 10: the model behaves as if choosing among 10 tokens.", "That would be loss ≈ 4.6.", "Perplexity is never below 1."],
  },
  {
    q: "Model A (perplexity 12) and model B (perplexity 9) used different tokenisers on the same text. What can you conclude?",
    options: ["B is better", "Nothing yet: per-token perplexity depends on how the tokeniser splits the text", "A is better", "Both are untrained"],
    answer: 1,
    why: ["Not without the same tokeniser.", "Correct. Compare per character or per word, or use one tokeniser.", "No.", "No."],
  },
  {
    q: "Training perplexity 4, validation perplexity 30. What happened?",
    options: ["Perfect training", "The model memorised the training text (overfitting); choose an earlier checkpoint and add data", "The validation set is broken", "Perplexity cannot differ between sets"],
    answer: 1,
    why: ["A large gap is the classic overfitting sign.", "Correct. It fits seen text and generalises poorly.", "Possible but unlikely; overfitting is the usual cause.", "It routinely does."],
  },
  {
    q: "A model fabricates a plausible but non-existent legal citation. The root cause is that the model…",
    options: ["Was trained on fake cases", "Predicts what a citation looks like in that position, with no objective of the case existing", "Has a bug", "Was asked ambiguously"],
    answer: 1,
    why: ["Real citations taught it the form.", "Correct. Prediction of text, not truth; the fix is grounding through retrieval.", "It is working as designed.", "No."],
  },
];

export const M14_EXERCISES: Exercise[] = [
  {
    title: "Build a bigram model and score sentences",
    kind: "code",
    task: "From the corpus '<s> the cat sat </s> <s> the dog sat </s> <s> the cat ran </s> <s> a dog ran </s>', compute bigram conditional probabilities with add-one smoothing (vocabulary = all distinct tokens including markers). Score '<s> the cat ran </s>' and '<s> a cat sat </s>' in log space and report which is more probable and its perplexity per token.",
    hints: ["P(w | prev) = (count(prev, w) + 1) ÷ (count(prev) + V).", "Perplexity = exp(−average log probability over the predicted tokens)."],
    solution: "Tokens: <s>, the, cat, sat, </s>, dog, ran, a → V = 8. Counts: '<s> the' 3, '<s> a' 1, 'the cat' 2, 'the dog' 1, 'a dog' 1, 'cat sat' 1, 'cat ran' 1, 'dog sat' 1, 'dog ran' 1, 'sat </s>' 2, 'ran </s>' 2. '<s> the cat ran </s>': P(the|<s>) = (3+1)/(4+8) = 0.333; P(cat|the) = (2+1)/(3+8) = 0.273; P(ran|cat) = (1+1)/(2+8) = 0.2; P(</s>|ran) = (2+1)/(2+8) = 0.3. Log sum = −1.10 − 1.30 − 1.61 − 1.20 = −5.21; perplexity = exp(5.21/4) ≈ 3.7. '<s> a cat sat </s>': P(a|<s>) = 2/12 = 0.167; P(cat|a) = (0+1)/(1+8) = 0.111; P(sat|cat) = 0.2; P(</s>|sat) = 0.3. Log sum = −1.79 − 2.20 − 1.61 − 1.20 = −6.80; perplexity ≈ 5.5. The first sentence is more probable.",
  },
  {
    title: "Count the free labels",
    kind: "calculate",
    task: "A corpus has 2 billion tokens. How many next-token training examples does it contain? If a model sees each token once in training with batches of 1 million tokens, how many optimiser steps is one epoch? If a labelled sentiment dataset has 50,000 examples, how many times more training signal does the corpus provide?",
    hints: ["Every position but the first is an example.", "Steps = tokens ÷ tokens per batch."],
    solution: "About 2 billion examples (one per position). Steps per epoch = 2,000,000,000 ÷ 1,000,000 = 2,000. The corpus offers 2,000,000,000 ÷ 50,000 = 40,000 times more examples than the labelled set, which is why self-supervised pretraining dominates.",
  },
  {
    title: "Perplexity as a drift detector",
    kind: "think",
    task: "You run a support chatbot and compute the base model's perplexity on each week's incoming messages. For eight weeks it is 9–10; in week nine it is 17. List three possible causes, how you would tell them apart, and what you would do for each.",
    hints: ["Think about what changed: the users, the product, or the pipeline.", "Perplexity measures fit between the model's expectations and the text."],
    solution: "Causes: (1) a product launch or event changed what customers write about (new vocabulary, new topics): inspect the highest-perplexity messages, see new terms, collect them for fine-tuning data. (2) A pipeline change: a different tokeniser version, broken preprocessing, encoding bug: check that a fixed reference set still scores 9–10 under the current pipeline. (3) A new user segment or language: check language detection and message sources. Action for each: gather data and fine-tune; fix the pipeline; add language handling. Perplexity alerted you weeks before accuracy metrics would.",
  },
  {
    title: "Draw the boundary",
    kind: "think",
    task: "For a model that only predicts text, classify each request as 'well represented in text (expect good results)', 'needs grounding (supply from outside)', or 'needs a tool (compute in code)': explain recursion to a beginner; state today's exchange rate; multiply 48,213 by 7,719; summarise this attached contract; recommend a restaurant near the user; write a regex for UK postcodes; say whether a cited paper exists.",
    hints: ["Ask: does the training text contain this, consistently? Is it current or private? Is it exact arithmetic or verification?"],
    solution: "Well represented: explain recursion; write a UK postcode regex (common, though verify it). Needs grounding: today's exchange rate (current), summarise the attached contract (private, must be in the prompt), restaurant near the user (location and current listings), whether a cited paper exists (verification against a database). Needs a tool: the multiplication (exact arithmetic). Each 'grounding' item is Stage 6 material; each 'tool' item is Stage 7.",
  },
];
