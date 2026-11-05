import type { Exercise, LessonBody, Quiz } from "../types";

// Module 13: Embeddings. One concept per lesson.
// Keys are lesson slugs: m13-<kebab of the concept title>.

export const M13_BODIES: Record<string, LessonBody> = {
  "m13-numerical-representation-of-text": {
    simple: "Before any model can use text, each word or document must become numbers; how those numbers are chosen decides whether the model can see meaning at all.",
    concept:
      "Every model in this path computes with numbers. Text is not numbers. So between text and model there is always a **numerical representation**: a rule that turns a word, a sentence or a document into a list of numbers, a vector. Module 11 gave documents count vectors; Module 12 gave tokens integer IDs. Neither carries meaning: counts know which words are present, and an ID is a label.\n\nThe quality of a representation is whether distances between the numbers reflect relationships between the texts. If 'cheap' and 'inexpensive' map to nearby vectors, a model can treat them alike without being told. If they map to unrelated vectors, the model has to learn the connection from scratch, every time, from examples. The history of NLP representations is a move from arbitrary numbers (one-hot, IDs) to numbers that carry meaning (embeddings), and from numbers fixed per word to numbers that change with context.\n\nThis module walks that path: one-hot vectors, learned word embeddings (Word2Vec, GloVe, FastText), how to measure similarity between vectors, and finally embeddings that depend on the sentence around the word.",
    why:
      "A representation is where a model's possibilities are decided. With count vectors, a search engine can only match words that appear literally; with meaning-bearing vectors it can match paraphrases. With one-hot word vectors, a classifier that learned 'excellent' means positive knows nothing about 'superb'; with embeddings it generalises. Choosing the representation is choosing what the model can notice, so it deserves its own module before the models that use it.",
    how: [
      "Decide the unit: characters, tokens, words, sentences or documents.",
      "Choose a mapping from each unit to a vector: a count, a one-hot position, or a learned embedding.",
      "Make sure the vectors have a fixed length so a model can take them as input.",
      "Define a distance or similarity between vectors (the lessons on cosine similarity) and check it matches intuition: similar things close, different things far.",
      "Feed the vectors to the model; if the model does badly on paraphrase or unseen words, suspect the representation first.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Representation", "'cheap' becomes", "Does 'cheap' sit near 'inexpensive'?", "Carries meaning?"],
        rows: [
          ["token ID", "4471", "no: 4471 and 9023 are just labels", "no"],
          ["one-hot", "[0, 0, …, 1, …, 0] with one 1 in slot 4471", "no: all words are equally far apart", "no"],
          ["count / TF-IDF (document level)", "a weight in the document's vector", "only if they co-occur in the same documents", "weakly"],
          ["word embedding", "[0.21, −0.57, 0.08, …] (300 numbers)", "yes: learned from contexts", "yes, one meaning per word"],
          ["contextual embedding", "different vector in each sentence", "yes, and 'cheap shot' differs from 'cheap price'", "yes, in context"],
        ],
      },
      caption: "Reading down the rows is reading this module in order. The last two rows are what modern NLP runs on.",
    },
    everyday: {
      title: "Describing people by numbers",
      text: "Give every person in a company an employee number and you can find them, but 1042 is no more like 1043 than like 9000. Describe them instead by a few numbers (years of experience, floor they sit on, team size) and suddenly people with similar numbers really are similar: you can find 'someone like Asha' by looking nearby. Embeddings do the second thing for words: numbers chosen so that nearness means likeness.",
    },
    engineering: {
      title: "Why the search team changed representation",
      text: "A documentation site's search used TF-IDF vectors. Queries using different words from the page ('turn off notifications' versus a page titled 'Disable alerts') returned nothing, and the logs showed 30% of queries hitting zero results. Switching the representation to sentence embeddings, with no change to the rest of the search pipeline, dropped zero-result queries to 8%, because 'turn off' and 'disable' sit close in embedding space. The team kept TF-IDF alongside for exact matches on command names, which embeddings handle less reliably.",
    },
    useIt: "Whenever text enters a model or an index, ask what representation it is using and whether that representation can express the relationships the task needs: exact words (counts), meaning (embeddings), meaning in context (contextual embeddings). Many failures of 'the model' are failures of the representation underneath.",
    takeaways: ["Text must become vectors; the representation decides what the model can see.", "IDs and one-hot vectors carry no meaning; counts carry presence; embeddings carry meaning.", "A good representation puts similar texts near each other.", "Suspect the representation first when a model cannot generalise across wording."],
    terms: [["numerical representation", "the rule that turns text into vectors a model can use"], ["vector (text)", "a fixed-length list of numbers standing for a word, sentence or document"], ["similarity", "a number saying how alike two vectors, and so two texts, are"]],
    reflect: { q: "A spam filter trained on count vectors catches 'free prize' but misses 'complimentary reward'. What representation change would help and why?", a: "Word or sentence embeddings: 'free' and 'complimentary', 'prize' and 'reward', land near each other in embedding space because they appear in similar contexts, so the filter's knowledge about one transfers to the other. Counts treat them as unrelated slots." },
  },

  "m13-one-hot-encoding": {
    simple: "One-hot encoding represents a word as a vector that is all zeros except a single one at the word's position, which is simple and exact but makes every word equally distant from every other.",
    concept:
      "The simplest way to turn a word into a vector is **one-hot encoding**: make a vector as long as the vocabulary, put a 1 in the slot belonging to the word and 0 everywhere else. 'cat' might be [0, 0, 1, 0, 0]; 'dog' is [0, 0, 0, 1, 0]. The vector says exactly which word it is and nothing else.\n\nTwo properties follow. Every one-hot vector is the same distance from every other: 'cat' is as far from 'dog' as from 'economics'. And the vectors are enormous and almost empty: a 50,000-word vocabulary gives 50,000-dimensional vectors with one non-zero entry.\n\nOne-hot vectors are still everywhere, mostly hidden. The input to an embedding layer is logically one-hot (the token ID selects a row, which is the same as multiplying a one-hot vector by the embedding matrix). The output of a language model is compared with a one-hot target: the true next token. One-hot is the honest starting point; everything learned is an improvement on it.",
    why:
      "Models need vector inputs and one-hot is the representation that assumes nothing: it does not claim any two words are related. That is also its failure. With no notion of similarity, a model must learn every fact about every word separately, and a word seen rarely in training is nearly useless. The lesson exists because one-hot is the baseline embeddings are measured against, and because understanding it explains what an embedding layer actually computes.",
    how: [
      "Fix a vocabulary of V words and give each an index.",
      "For a word with index i, create a vector of V zeros and set position i to 1.",
      "For a document, add the one-hot vectors of its words to get a count vector (bag of words).",
      "Multiplying a one-hot vector by a V × d matrix selects row i: this is exactly an embedding lookup.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "cat", "dog", "economics", "cheap", "inexpensive"],
        rows: [
          ["cat →", "1", "0", "0", "0", "0"],
          ["dog →", "0", "1", "0", "0", "0"],
          ["cheap →", "0", "0", "0", "1", "0"],
          ["inexpensive →", "0", "0", "0", "0", "1"],
        ],
      },
      caption: "Each row is a word; each column a slot. The dot product of any two different rows is 0: by this representation, no two words have anything in common.",
    },
    everyday: {
      title: "A light switch per word",
      text: "Imagine a wall with a switch for every word in the language. To say 'cat', flip the cat switch; everything else stays off. It is unambiguous, and it tells you nothing about cats: the cat switch is next to the dog switch only by the accident of where the electrician put it. That is one-hot encoding.",
    },
    engineering: {
      title: "Categorical features in a fraud model",
      text: "A fraud model takes the merchant category of a transaction (grocery, fuel, electronics, 400 categories). The team one-hot encodes it: 400 columns, one set to 1. This works well for a tree-based model and is interpretable, but a rare category seen 30 times in training contributes almost nothing. When they later replaced one-hot categories with learned 16-number embeddings for each category, trained alongside the model, rare categories inherited behaviour from similar ones (a new 'e-scooter rental' category landed near 'bike rental') and detection improved on exactly those transactions.",
    },
    maths: {
      formula: "one-hot(i) · one-hot(j) = 1 if i = j else 0;   one-hot(i) × E = row i of E",
      meaning: "The dot product of two one-hot vectors is 1 for the same word and 0 otherwise: no notion of similarity. Multiplying a one-hot vector by a matrix E picks out one row, which is how embedding lookup works.",
      worked: [
        "Vocabulary [cat, dog, cheap, inexpensive]. cheap = [0, 0, 1, 0], inexpensive = [0, 0, 0, 1]. Dot product = 0·0 + 0·0 + 1·0 + 0·1 = 0.",
        "cheap · cheap = 1. Every word is as similar to itself as possible and not at all similar to any other word.",
        "Let E be a 4 × 2 matrix with rows [0.9, 0.1], [0.8, 0.2], [0.1, 0.9], [0.2, 0.8]. cheap × E = 0·row1 + 0·row2 + 1·row3 + 0·row4 = [0.1, 0.9].",
        "inexpensive × E = [0.2, 0.8]. Now cheap and inexpensive are close: the matrix E, once learned, is the embedding table, and the one-hot vector is just a row selector.",
      ],
    },
    code: {
      title: "One-hot vectors and what multiplying by a matrix does",
      lang: "py",
      src: `vocab = ["cat", "dog", "cheap", "inexpensive"]

def one_hot(word):
    v = [0] * len(vocab)
    v[vocab.index(word)] = 1
    return v

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

print(one_hot("cheap"), one_hot("inexpensive"))
print("similarity:", dot(one_hot("cheap"), one_hot("inexpensive")))

E = [[0.9, 0.1], [0.8, 0.2], [0.1, 0.9], [0.2, 0.8]]      # a tiny 'embedding table'
def lookup(word):
    v = one_hot(word)
    return [sum(v[i] * E[i][k] for i in range(len(vocab))) for k in range(2)]

print(lookup("cheap"), lookup("inexpensive"))`,
      lines: [
        { code: "v[vocab.index(word)] = 1", say: "A single 1 at the word's slot. The vector is as long as the vocabulary." },
        { code: "print(\"similarity:\", dot(one_hot(\"cheap\"), one_hot(\"inexpensive\")))", say: "Zero. Two different words share nothing under one-hot encoding." },
        { code: "return [sum(v[i] * E[i][k] for i in range(len(vocab))) for k in range(2)]", say: "Multiplying by the table selects one row. This is the entire computation an embedding layer does." },
      ],
      output: "[0, 0, 1, 0] [0, 0, 0, 1]\nsimilarity: 0\n[0.1, 0.9] [0.2, 0.8]",
      note: "Real embedding layers skip the multiplication and index the row directly, but the meaning is identical.",
    },
    useIt: "Use one-hot encoding for small categorical features in classic models, and understand it as what sits logically at the input of every embedding layer and at the target of every language model's output. When a one-hot feature has many rare values, replace it with a learned embedding.",
    takeaways: ["One-hot: a vector with one 1 at the word's slot; exact, huge, sparse.", "All words are equally far apart; no similarity is expressed.", "One-hot × matrix = row lookup: the embedding layer in disguise.", "Rare values learn nothing under one-hot; embeddings fix that."],
    terms: [["one-hot encoding", "a vector of zeros with a single 1 marking the item"], ["sparse", "mostly zeros"], ["row lookup", "selecting one row of a matrix, equivalent to multiplying by a one-hot vector"]],
    reflect: { q: "In a one-hot world, how many examples of the word 'superb' does a classifier need before it learns 'superb' is positive, if it has already seen 'excellent' a thousand times?", a: "As many as it would with no knowledge of 'excellent' at all, because the two vectors share nothing. With embeddings that place 'superb' near 'excellent', a handful of examples, or none, would do." },
  },

  "m13-word-embeddings": {
    simple: "A word embedding is a short, dense vector learned for each word so that words used in similar contexts get similar vectors; it is the first representation in which 'cheap' and 'inexpensive' are close.",
    concept:
      "A **word embedding** replaces the one-hot vector with a dense vector of a few hundred numbers, learned from text. The learning rule rests on an old observation from linguistics: you shall know a word by the company it keeps. Words that appear in the same kinds of contexts ('a ___ hotel', 'surprisingly ___') tend to mean similar things. Train a model to predict a word from its neighbours, or neighbours from a word, and the vectors it has to invent to do that job end up arranged by meaning.\n\nThe result is a table: one vector per vocabulary word, typically 100 to 300 numbers each. Nobody labels the dimensions; they are whatever the training found useful. But the geometry is meaningful: similar words cluster, and some directions correspond to relations, famously king − man + woman ≈ queen.\n\nA word embedding is static: one vector per word, however the word is used. 'bank' gets one vector that blends the river and the money. That limit is what contextual embeddings, later in this module, remove.",
    why:
      "One-hot vectors force a model to learn every word in isolation and leave rare words meaningless. Word embeddings share knowledge: whatever is learned about 'excellent' transfers to 'superb' because their vectors are close. They also compress: 300 numbers instead of 50,000, dense instead of sparse, which makes every downstream model smaller and faster.\n\nThey exist because contexts are free: no labels are needed, just text, and there is more text than anyone can read. Word2Vec in 2013 showed that cheap training on billions of words produced vectors good enough to improve almost every NLP task, and the field moved to learned representations permanently.",
    how: [
      "Choose a vocabulary and a dimension d (say 300). Initialise a V × d table with small random numbers.",
      "Slide a window over a large corpus; for each centre word, note its neighbours within the window.",
      "Train a small model to predict neighbours from the centre word (or the reverse), adjusting the table's rows by gradient descent.",
      "Words that predict similar neighbours are pushed toward similar vectors; words with different contexts are pushed apart.",
      "After training, keep the table; the model that used it is discarded. Each row is the word's embedding.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "dim 1", "dim 2", "dim 3", "…", "Nearest neighbours after training"],
        rows: [
          ["cheap", "0.21", "−0.57", "0.08", "…", "inexpensive, affordable, bargain"],
          ["inexpensive", "0.19", "−0.52", "0.11", "…", "cheap, affordable, low-cost"],
          ["expensive", "0.25", "0.61", "0.05", "…", "costly, pricey, overpriced"],
          ["cat", "−0.44", "0.02", "0.73", "…", "kitten, dog, pet"],
        ],
      },
      caption: "The columns have no names. The rows for 'cheap' and 'inexpensive' are nearly the same numbers; 'expensive' shares a sign pattern with them in some dimensions (it is about price) and differs in others (opposite price).",
    },
    everyday: {
      title: "Guessing a word from its neighbours",
      text: "Cover a word in a sentence: 'We stayed at a surprisingly ___ hotel near the station.' You can list candidates: cheap, nice, quiet, large. You cannot say 'photosynthesis'. The words that fit the gap are the words that mean similar things. Word embeddings are built by making a model play that game billions of times; the vectors that let it win are vectors arranged by meaning.",
    },
    engineering: {
      title: "A review classifier that finally generalised",
      text: "A retailer's review classifier used bag-of-words features. It knew 'broken' was bad and had never seen 'shattered', so a review saying the vase arrived shattered was scored neutral. Replacing the input with averaged word embeddings (pretrained on a large corpus, then fine-tuned a little on reviews) let 'shattered', 'cracked' and 'smashed' inherit the badness of 'broken'. Accuracy rose four points overall and far more on reviews using unusual vocabulary. The vectors came from a public 300-dimensional model; the team's own data was only used to adjust the final classifier.",
    },
    maths: {
      formula: "embedding table E ∈ ℝ^(V × d);   vec(w) = E[row of w];   similar contexts ⇒ small distance between rows",
      meaning: "V words, d dimensions. Each word's vector is its row. Training moves rows so that words with similar neighbours have similar rows.",
      worked: [
        "Vocabulary of 50,000 words, d = 300: table of 15 million numbers, versus 50,000 × 50,000 = 2.5 billion for one-hot vectors stacked as a matrix.",
        "Toy 2-dimensional vectors after training: cheap = [0.9, −0.4], inexpensive = [0.85, −0.45], cat = [−0.3, 0.8].",
        "Distance cheap–inexpensive = √((0.05)² + (0.05)²) ≈ 0.07. Distance cheap–cat = √((1.2)² + (1.2)²) ≈ 1.70.",
        "The classifier learns a weight direction once; 'inexpensive' lands on the same side as 'cheap' automatically.",
      ],
    },
    code: {
      title: "Using pretrained word vectors",
      lang: "py",
      src: `# pip install gensim
import gensim.downloader as api

wv = api.load("glove-wiki-gigaword-100")       # 400k words, 100 numbers each

print(wv["cheap"][:5])
print(wv.most_similar("cheap", topn=4))
print(wv.similarity("cheap", "inexpensive"), wv.similarity("cheap", "cat"))
print(wv.most_similar(positive=["king", "woman"], negative=["man"], topn=1))`,
      lines: [
        { code: "wv = api.load(\"glove-wiki-gigaword-100\")       # 400k words, 100 numbers each", say: "A table trained by someone else on Wikipedia and news; you download the rows and never retrain." },
        { code: "print(wv[\"cheap\"][:5])", say: "The first five of the hundred numbers for 'cheap'. They mean nothing individually." },
        { code: "print(wv.most_similar(\"cheap\", topn=4))", say: "The nearest rows in the table. Meaning emerged from contexts; nobody wrote a synonym list." },
        { code: "print(wv.most_similar(positive=[\"king\", \"woman\"], negative=[\"man\"], topn=1))", say: "Vector arithmetic: directions in the space encode relations, imperfectly but strikingly." },
      ],
      output: "[-0.5431  0.1023  0.7716 -0.2219  0.5174]\n[('cheaper', 0.78), ('expensive', 0.76), ('affordable', 0.71), ('inexpensive', 0.70)]\n0.70 0.12\n[('queen', 0.77)]",
      note: "Notice 'expensive' is a near neighbour of 'cheap': both are about price. Embeddings capture relatedness, not only sameness.",
    },
    useIt: "Use pretrained word embeddings as input features for classic classifiers and small networks, for similarity and synonym discovery, and as the first layer of any text model you train yourself. For meaning in context (ambiguous words, whole sentences), move to contextual embeddings.",
    takeaways: ["A word embedding is a learned dense vector; similar contexts give similar vectors.", "Knowledge transfers between related words; rare words borrow from neighbours.", "Static: one vector per word regardless of use; 'bank' is blended.", "Embeddings capture relatedness (cheap ~ expensive), not just synonymy."],
    terms: [["word embedding", "a dense vector learned for a word from its contexts"], ["dense vector", "a vector whose entries are mostly non-zero, as opposed to sparse"], ["distributional hypothesis", "the idea that words used in similar contexts have similar meanings"]],
    reflect: { q: "Why is 'expensive' one of the nearest neighbours of 'cheap' in a word-embedding space, and is that a bug?", a: "Both words appear in the same contexts ('a ___ hotel', 'too ___ for me'), so their context-based vectors are close; the embedding encodes 'about price', not 'low price'. It is not a bug but a property: embeddings capture relatedness. A sentiment classifier on top must learn the direction that separates them." },
  },

  "m13-word2vec": {
    simple: "Word2Vec is the 2013 method that made word embeddings practical: a tiny neural network trained to predict words from their neighbours, with its weights kept as the embedding table.",
    concept:
      "**Word2Vec** is not a model you use for predictions; it is a training trick for producing an embedding table. It sets up a very small network with one hidden layer, whose only job is to predict words near each other in text. The network is trained on billions of words with a fast approximation, and then thrown away. What remains is its input weight matrix: one row per word, which turns out to be an excellent embedding.\n\nIt comes in two flavours, covered in the next two lessons. CBOW (continuous bag of words) predicts the centre word from the surrounding words. Skip-gram predicts the surrounding words from the centre word. Both rely on the same idea: a word's vector must carry enough information to predict its typical neighbours, and words with the same neighbours end up with the same vectors.\n\nWord2Vec's importance was practical. It trained on a billion words in hours on a laptop, the vectors improved almost every NLP task, and the arithmetic property (king − man + woman ≈ queen) showed that geometry in the space meant something. It set the pattern every later representation follows: learn from raw text, keep the representation, discard the training task.",
    why:
      "Earlier methods for learning word vectors existed but were slow (they involved large matrix factorisations) or produced poor vectors. Word2Vec made two engineering choices that changed the field: a prediction task so simple that each training step is a few vector operations, and approximations (negative sampling, hierarchical softmax) that avoid computing a score for every vocabulary word at every step. Speed made scale possible, and scale made the vectors good. It exists because the quality of embeddings turned out to depend more on the amount of text than on the cleverness of the model.",
    how: [
      "Build the vocabulary from the corpus; discard very rare words.",
      "Initialise two matrices: input embeddings (V × d) and output embeddings (V × d).",
      "Slide a window (say 5 words each side) across the corpus, producing (centre, neighbour) pairs.",
      "For each pair, make the model score the true neighbour high and a few randomly chosen non-neighbours low (negative sampling); update both matrices by gradient descent.",
      "After one or a few passes over the corpus, keep the input matrix as the word embeddings.",
    ],
    visual: {
      kind: "flow",
      steps: ["corpus: 'the surprisingly cheap hotel near the station'", "window pairs: (cheap, surprisingly), (cheap, hotel), (cheap, near) …", "tiny network: vec(cheap) should score 'hotel' high and random 'carburettor' low", "gradient step moves vec(cheap) toward contexts it shares with 'inexpensive'", "after billions of pairs: the input matrix is the embedding table"],
      caption: "The prediction task is a pretext. Nobody cares whether the network can predict 'hotel'; they care about the rows it had to learn to try.",
    },
    everyday: {
      title: "Learning a city by walking it",
      text: "You never study a map, but after a year of walking you know which streets are near which, because you keep arriving at the same corners from the same directions. Word2Vec learns the map of words by repeatedly arriving at each word from its neighbours. The map is a by-product of the walking; it is also the only thing worth keeping.",
    },
    engineering: {
      title: "Product embeddings from shopping baskets",
      text: "An online grocer applied Word2Vec not to words but to products: each basket is a 'sentence', each product a 'word'. Products bought together are neighbours. The resulting vectors put oat milk near almond milk and near granola, with no product catalogue information at all. The team uses the vectors for 'customers also bought' suggestions and for finding substitutes when an item is out of stock. The same training code, unchanged, because Word2Vec only needs sequences of items with meaningful co-occurrence.",
    },
    maths: {
      formula: "score(w, c) = vec_in(w) · vec_out(c);   loss = −log σ(score(w, c)) − Σ over k negatives log σ(−score(w, n_k))",
      meaning: "The dot product of a word's input vector and a context's output vector is the score. The loss pushes the true context's score up (through the sigmoid σ) and k random words' scores down.",
      worked: [
        "d = 2 for illustration. vec_in(cheap) = [0.5, 0.1], vec_out(hotel) = [0.4, 0.3], vec_out(carburettor) = [−0.2, 0.6].",
        "score(cheap, hotel) = 0.5·0.4 + 0.1·0.3 = 0.23. score(cheap, carburettor) = 0.5·(−0.2) + 0.1·0.6 = −0.04.",
        "σ(0.23) ≈ 0.557; σ(0.04) ≈ 0.51. Loss ≈ −log 0.557 − log 0.51 ≈ 0.585 + 0.673 = 1.26.",
        "The gradient moves vec_in(cheap) toward vec_out(hotel) and away from vec_out(carburettor). After many such steps with 'inexpensive' sharing the context 'hotel', the two input vectors converge.",
      ],
      note: "Negative sampling with k = 5 to 20 random words replaces a softmax over the full vocabulary, which is what makes training fast.",
    },
    code: {
      title: "Training Word2Vec on a small corpus",
      lang: "py",
      src: `from gensim.models import Word2Vec

sentences = [
    "the cheap hotel near the station was clean".split(),
    "an inexpensive hotel near the airport was noisy".split(),
    "the expensive hotel by the river was quiet".split(),
    "a cheap flight to the coast was late".split(),
    "an inexpensive flight to the islands was early".split(),
] * 50                                       # repeat so the toy corpus has enough pairs

model = Word2Vec(sentences, vector_size=20, window=2, min_count=1, sg=1, negative=5, epochs=30, seed=1)
vectors = model.wv

print(vectors.similarity("cheap", "inexpensive"))
print(vectors.similarity("cheap", "quiet"))
print(vectors.most_similar("hotel", topn=2))`,
      lines: [
        { code: "model = Word2Vec(sentences, vector_size=20, window=2, min_count=1, sg=1, negative=5, epochs=30, seed=1)", say: "sg=1 chooses skip-gram; negative=5 draws five random non-neighbours per pair; window=2 looks two words each side." },
        { code: "vectors = model.wv", say: "The embedding table is all that is kept. The prediction network is discarded." },
        { code: "print(vectors.similarity(\"cheap\", \"inexpensive\"))", say: "Both words appear before 'hotel' and 'flight' in the same slots, so their vectors converge." },
      ],
      output: "0.81\n0.09\n[('flight', 0.63), ('station', 0.41)]",
      note: "On fifty copies of five sentences the numbers are rough; on a billion words they become the vectors everyone downloads.",
    },
    useIt: "Use Word2Vec to train embeddings for any sequence data with meaningful co-occurrence: words in a specialised corpus, products in baskets, songs in playlists, pages in browsing sessions. For general English, download pretrained vectors instead. For context-dependent meaning, use transformer embeddings.",
    takeaways: ["Word2Vec trains a tiny predict-the-neighbour network and keeps its input weights as embeddings.", "Negative sampling makes each step cheap, so billions of words are feasible.", "The task is a pretext; the representation is the product.", "Works for any co-occurring items, not only words."],
    terms: [["Word2Vec", "a fast method for learning word embeddings by predicting neighbouring words"], ["negative sampling", "training against a few random non-neighbours instead of the whole vocabulary"], ["pretext task", "a task trained only to produce a useful representation as a by-product"]],
    reflect: { q: "Why is the Word2Vec network thrown away after training when it took hours to train?", a: "Its purpose was never to predict neighbours; that task was a device to force the input matrix into a meaningful arrangement. The matrix is the deliverable. Predicting neighbours is of no use on its own, so the network that does it has no further value." },
  },

  "m13-cbow": {
    simple: "CBOW (continuous bag of words) is the Word2Vec variant that predicts a centre word from the average of its surrounding words' vectors; it is fast and works well for frequent words.",
    concept:
      "**CBOW** sets the prediction task one way round: given the words around a gap, predict the word in the gap. For the sentence 'the surprisingly cheap hotel near', with 'cheap' as the centre and a window of two, the inputs are 'the', 'surprisingly', 'hotel', 'near', and the target is 'cheap'.\n\nThe model averages the input vectors of the context words into one vector and uses it to score candidate centre words. Averaging is what 'bag' means: the order of the context words is ignored, only their combination matters. Because several context words contribute to each prediction, the gradient signal is smoothed, which makes CBOW train quickly and gives good vectors for common words. The same smoothing makes it weaker for rare words, whose few occurrences are averaged away among their neighbours.\n\nCBOW is the natural choice when the corpus is large and the vocabulary is dominated by frequent words, and when training time matters.",
    why:
      "Of the two ways to set up the neighbour-prediction task, CBOW is the one closer to how people fill in gaps: from the surroundings to the missing word. It is several times faster than skip-gram because one averaged context produces one prediction per window instead of one prediction per neighbour. It exists as the speed-oriented variant; skip-gram (next lesson) trades that speed for better handling of rare words.",
    how: [
      "For each position in the corpus, take the words within the window on each side as context and the word at the position as the target.",
      "Look up the input vector of each context word and average them.",
      "Score the target word (and a few negative samples) by dot product with the averaged vector.",
      "Update the output vector of the target and the input vectors of all context words by gradient descent.",
      "Repeat over the corpus; keep the input vectors.",
    ],
    visual: {
      kind: "flow",
      steps: ["context: the, surprisingly, ▁, hotel, near", "average of the four context vectors", "score candidates: cheap (high), carburettor (low)", "update: four context input vectors + target output vector"],
      caption: "Many words in, one word out. The averaging smooths training and favours common words.",
    },
    everyday: {
      title: "Guessing the missing word on a torn page",
      text: "A page is torn and one word is missing: 'We booked a surprisingly ___ hotel near the station.' You read all the surrounding words together, weigh them as a whole, and guess 'cheap' or 'nice'. You do not guess from one neighbour at a time. CBOW makes that whole-context guess, and learns from being wrong.",
    },
    engineering: {
      title: "Embeddings for a 300-million-message chat corpus",
      text: "A messaging company wanted vectors for its own vocabulary (slang, product names, abbreviations) from 300 million messages. Skip-gram training was estimated at several days on their machine; CBOW finished overnight with vectors of similar quality for everything frequent, which was most of what their autocomplete needed. They later ran skip-gram on a smaller sample specifically to improve vectors for rare terms, and merged the two tables. The choice between the variants was a scheduling decision as much as a quality one.",
    },
    maths: {
      formula: "h = (1/|C|) Σ over c in C of vec_in(c);   score(w) = h · vec_out(w)",
      meaning: "h is the average of the context words' input vectors (C is the set of context words). The target word's score is its output vector dotted with h.",
      worked: [
        "d = 2. vec_in(the) = [0.1, 0.0], vec_in(surprisingly) = [0.3, 0.4], vec_in(hotel) = [0.5, 0.2], vec_in(near) = [0.1, 0.2].",
        "h = ([0.1, 0.0] + [0.3, 0.4] + [0.5, 0.2] + [0.1, 0.2]) ÷ 4 = [1.0, 0.8] ÷ 4 = [0.25, 0.2].",
        "vec_out(cheap) = [0.6, 0.4]: score = 0.25·0.6 + 0.2·0.4 = 0.23. vec_out(carburettor) = [−0.4, 0.1]: score = −0.1 + 0.02 = −0.08.",
        "Loss pushes 'cheap' up and 'carburettor' down; the gradient on h is split equally among the four context words' input vectors, which is the smoothing effect.",
      ],
    },
    code: {
      title: "A CBOW forward pass by hand",
      lang: "py",
      src: `import math

vec_in = {"the": [0.1, 0.0], "surprisingly": [0.3, 0.4], "hotel": [0.5, 0.2], "near": [0.1, 0.2]}
vec_out = {"cheap": [0.6, 0.4], "carburettor": [-0.4, 0.1]}

def average(vectors):
    n = len(vectors)
    return [sum(v[k] for v in vectors) / n for k in range(len(vectors[0]))]

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

context = ["the", "surprisingly", "hotel", "near"]
h = average([vec_in[w] for w in context])
for target in vec_out:
    score = sum(a * b for a, b in zip(h, vec_out[target]))
    print(target, round(score, 3), "prob", round(sigmoid(score), 3))`,
      lines: [
        { code: "h = average([vec_in[w] for w in context])", say: "The bag: all context vectors averaged into one, order ignored." },
        { code: "score = sum(a * b for a, b in zip(h, vec_out[target]))", say: "One dot product per candidate. The true centre word should score highest." },
        { code: "print(target, round(score, 3), \"prob\", round(sigmoid(score), 3))", say: "Sigmoid turns the score into a probability for the 'is this the centre word?' question used by negative sampling." },
      ],
      output: "cheap 0.23 prob 0.557\ncarburettor -0.08 prob 0.48",
      note: "Training would now nudge every vector involved: the gradient of the loss flows to the four context rows and to the two output rows.",
    },
    useIt: "Choose CBOW when you need embeddings quickly from a large corpus and care most about frequent words: autocomplete vocabularies, large-scale product or item embeddings, a first pass on any corpus. Switch to skip-gram when rare terms matter.",
    takeaways: ["CBOW predicts the centre word from the averaged context vectors.", "Fast: one prediction per window; smooth gradients; strong on frequent words.", "Weaker on rare words, which get averaged away.", "The order of context words is ignored (the 'bag')."],
    terms: [["CBOW (continuous bag of words)", "the Word2Vec variant predicting a word from its averaged context"], ["context window", "the words within a fixed distance on each side of a position"], ["centre word", "the word at the current position, predicted by CBOW"]],
    reflect: { q: "Why does averaging the context make rare words' embeddings worse under CBOW?", a: "A rare word appears in few windows, and in each it is one of several context words sharing the gradient, so it receives a small, diluted update. Its vector barely moves from random. Skip-gram instead updates the rare word's vector directly for every one of its neighbours." },
  },

  "m13-skip-gram": {
    simple: "Skip-gram is the Word2Vec variant that predicts each surrounding word from the centre word; it is slower than CBOW but learns better vectors for rare words and is the more widely used of the two.",
    concept:
      "**Skip-gram** flips CBOW: from the centre word, predict each of its neighbours. For 'the surprisingly cheap hotel near' with centre 'cheap' and a window of two, the training pairs are (cheap → the), (cheap → surprisingly), (cheap → hotel), (cheap → near). Each pair is a separate prediction, so one window produces several updates to the centre word's vector.\n\nThat is why skip-gram handles rare words well: every occurrence of a rare word yields as many updates as it has neighbours, each applied directly to its own vector. The cost is training time, several times CBOW's, because there are several predictions per position instead of one.\n\nSkip-gram with negative sampling is the configuration most people mean by 'Word2Vec'. Its vectors are the ones that showed the famous analogies, and it is the default in most libraries. Two tricks matter in practice: subsampling very frequent words (so 'the' does not dominate every window) and weighting nearby neighbours more than distant ones.",
    why:
      "Specialised corpora are full of rare but important words: drug names, part numbers, local slang, technical terms. CBOW's averaging leaves those with poor vectors. Skip-gram exists to give every word, however rare, direct training signal from its contexts, which is exactly what a domain embedding needs. The extra compute is paid once at training time; the better rare-word vectors are used forever.",
    how: [
      "For each position, take the centre word and each neighbour within the window as a separate (centre, neighbour) pair.",
      "Optionally skip some occurrences of very frequent words (subsampling) so they do not swamp the pairs.",
      "For each pair, score the true neighbour and k random negative words by dot product with the centre word's input vector.",
      "Update the centre word's input vector and the output vectors of the neighbour and the negatives.",
      "Repeat over the corpus; keep the input vectors.",
    ],
    visual: {
      kind: "compare",
      left: { title: "CBOW", points: ["context → centre", "one prediction per window", "fast; smooth gradients", "frequent words good, rare words poor"] },
      right: { title: "Skip-gram", points: ["centre → each neighbour", "several predictions per window", "slower; direct updates per word", "rare words good; the common default"] },
      caption: "Same corpus, same window, same negative sampling; the direction of prediction decides who gets the gradient.",
    },
    everyday: {
      title: "Learning a person from what they say about others",
      text: "You could learn about someone by asking their friends (CBOW: the context describes the centre). Or you could listen to that person describe everyone they know (skip-gram: the centre describes the context). The second method tells you a lot even about someone you have met only once, because every remark they make is evidence about them. That is why skip-gram serves rare words well.",
    },
    engineering: {
      title: "Embeddings for radiology report terms",
      text: "A hospital team trained embeddings on two million radiology reports to power a search tool. Many clinically important terms appear a few hundred times in millions of words. With CBOW, those terms' nearest neighbours were noise. With skip-gram, 'pneumothorax' sat near 'collapsed', 'lung' and 'apex', and 'ground-glass' near 'opacity' and 'infiltrate'. The run took four times longer; the resulting search found relevant reports for rare findings, which was the point of the project.",
    },
    maths: {
      formula: "for each pair (w, c): loss = −log σ(vec_in(w) · vec_out(c)) − Σ over k negatives log σ(−vec_in(w) · vec_out(n_k))",
      meaning: "The centre word's input vector is scored against the true neighbour's output vector (pushed up) and against k random words' output vectors (pushed down). The centre vector gets a gradient from every pair it appears in.",
      worked: [
        "Centre 'pneumothorax' appears 200 times with a window of 5 each side: up to 200 × 10 = 2,000 pairs, so 2,000 direct updates to its vector.",
        "Under CBOW it would be a context word in those 2,000 windows, sharing each gradient with about 9 other words: roughly 2,000 ÷ 10 = 200 units of update. Ten times less signal.",
        "With k = 5 negatives, each pair costs 6 dot products of length d; at d = 300 that is 1,800 multiplications per pair, trivial per pair and enormous over a billion pairs.",
      ],
    },
    code: {
      title: "Skip-gram pairs and one update step",
      lang: "py",
      src: `import random, math

def skip_gram_pairs(tokens, window=2):
    pairs = []
    for i, centre in enumerate(tokens):
        for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
            if j != i:
                pairs.append((centre, tokens[j]))
    return pairs

tokens = "the surprisingly cheap hotel near the station".split()
pairs = skip_gram_pairs(tokens)
print(len(pairs), pairs[:4])

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

vec_in = {w: [random.uniform(-0.5, 0.5) for _ in range(2)] for w in tokens}
vec_out = {w: [random.uniform(-0.5, 0.5) for _ in range(2)] for w in tokens}
lr = 0.1
centre, context, negative = "cheap", "hotel", "station"
for other, label in [(context, 1), (negative, 0)]:
    score = sum(a * b for a, b in zip(vec_in[centre], vec_out[other]))
    g = sigmoid(score) - label                   # gradient of the loss w.r.t. the score
    vec_in[centre] = [a - lr * g * b for a, b in zip(vec_in[centre], vec_out[other])]
    vec_out[other] = [b - lr * g * a for a, b in zip(vec_in[centre], vec_out[other])]
print("updated", [round(x, 3) for x in vec_in["cheap"]])`,
      lines: [
        { code: "pairs.append((centre, tokens[j]))", say: "Each neighbour becomes its own training pair with the centre word. A window of two on each side gives up to four pairs per position." },
        { code: "g = sigmoid(score) - label                   # gradient of the loss w.r.t. the score", say: "Positive label 1 pulls the score up; negative label 0 pushes it down. This single number is the whole gradient signal for the pair." },
        { code: "vec_in[centre] = [a - lr * g * b for a, b in zip(vec_in[centre], vec_out[other])]", say: "The centre word's vector moves toward the true neighbour's output vector and away from the negative's. Direct, every pair." },
      ],
      output: "24 [('the', 'surprisingly'), ('the', 'cheap'), ('surprisingly', 'the'), ('surprisingly', 'cheap')]\nupdated [0.213, -0.097]",
      note: "Seven tokens give 24 pairs; a billion-token corpus gives several billion, each one this cheap.",
    },
    useIt: "Use skip-gram with negative sampling as the default for training embeddings on your own corpus, especially when rare domain terms matter: medical, legal, technical, product data. Use CBOW only when training time is the constraint and rare words are not.",
    takeaways: ["Skip-gram predicts each neighbour from the centre word: several direct updates per occurrence.", "Rare words get real vectors; training is slower than CBOW.", "With negative sampling, it is the standard Word2Vec configuration.", "Subsampling frequent words and weighting near neighbours improve it in practice."],
    terms: [["skip-gram", "the Word2Vec variant predicting context words from the centre word"], ["subsampling", "randomly dropping some occurrences of very frequent words during training"], ["training pair", "one (centre, neighbour) example"]],
    reflect: { q: "In skip-gram, why does increasing the window size from 2 to 10 make the embeddings capture topic rather than syntax?", a: "Nearby words (within 2) are mostly grammatical neighbours: articles, adjectives, verbs that attach to the word, so small windows learn function and part of speech. Words 10 positions away are about the same subject but not grammatically tied, so large windows learn topical similarity. The window decides what 'similar' means." },
  },

  "m13-glove": {
    simple: "GloVe learns word vectors from global co-occurrence counts: it builds a word-by-word count matrix from the whole corpus and fits vectors whose dot products predict the log of those counts.",
    concept:
      "Word2Vec learns from one window at a time and never looks at the corpus as a whole. **GloVe** (Global Vectors) does the opposite: it first counts, over the entire corpus, how often every pair of words appears near each other, producing a large co-occurrence matrix. Then it fits vectors so that for every pair of words, the dot product of their vectors (plus two bias terms) is close to the logarithm of their co-occurrence count.\n\nThe log is the key. Ratios of co-occurrence probabilities carry meaning: 'ice' co-occurs with 'solid' far more than 'steam' does, and 'steam' with 'gas' far more than 'ice' does, while both co-occur with 'water' about equally. Fitting dot products to log counts makes vector differences encode those ratios, which is why GloVe vectors show the same analogy arithmetic as Word2Vec.\n\nGloVe and Word2Vec produce vectors of similar quality; GloVe's advantage is that it uses global statistics efficiently and trains with a weighted least-squares objective that is easy to parallelise. Stanford's pretrained GloVe vectors (trained on Wikipedia, news and web crawl) became the most downloaded word embeddings of the 2010s.",
    why:
      "Word2Vec's window-by-window training wastes information: the same pair of words is seen thousands of times and each occurrence is processed separately. Counting first, then fitting, uses every occurrence at once. GloVe exists to combine the strength of count-based methods (global statistics) with the strength of prediction-based methods (dense, meaningful vectors), and to make explicit what the vectors are supposed to encode: ratios of co-occurrence.",
    how: [
      "Slide a window over the corpus once and count, for every pair of words (i, j), how often j appears within the window of i, weighting nearer words more.",
      "Store the counts as a sparse matrix X; most pairs never co-occur and are skipped.",
      "Initialise vectors wᵢ and context vectors w̃ⱼ and biases bᵢ, b̃ⱼ.",
      "Minimise Σ f(Xᵢⱼ) (wᵢ · w̃ⱼ + bᵢ + b̃ⱼ − log Xᵢⱼ)² over all non-zero pairs, where f caps the influence of very frequent pairs.",
      "Use wᵢ + w̃ᵢ as the final embedding of word i.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Co-occurrence with →", "solid", "gas", "water", "fashion"],
        rows: [
          ["ice", "high", "low", "high", "low"],
          ["steam", "low", "high", "high", "low"],
          ["ratio P(·|ice) / P(·|steam)", "large", "small", "≈ 1", "≈ 1"],
        ],
      },
      caption: "The ratio row is what GloVe makes vectors encode: 'solid' and 'gas' distinguish ice from steam; 'water' and 'fashion' do not. Vector differences capture exactly these ratios.",
    },
    everyday: {
      title: "A seating chart from who sits together",
      text: "Keep a tally for a year of which colleagues sit together at lunch. Then draw a seating chart so that pairs who often share a table sit close and pairs who never do sit far apart. You did not watch any single lunch while drawing; you used the totals. GloVe draws the chart of words from the totals of who appears near whom.",
    },
    engineering: {
      title: "Dropping in pretrained GloVe vectors",
      text: "A start-up building a job-matching tool needed word vectors on day one with no corpus of their own. They loaded the 300-dimensional GloVe vectors trained on web text, averaged the vectors of each job title and skill, and had a working 'similar roles' feature in an afternoon: 'frontend developer' near 'UI engineer', 'data analyst' near 'business intelligence'. When they later had enough of their own postings, they fine-tuned on them. Pretrained GloVe is the standard answer to 'we need embeddings now'.",
    },
    maths: {
      formula: "J = Σᵢⱼ f(Xᵢⱼ) · (wᵢ · w̃ⱼ + bᵢ + b̃ⱼ − log Xᵢⱼ)²",
      meaning: "For every co-occurring pair, the squared difference between the predicted value (dot product plus biases) and the log count, weighted by f so huge counts do not dominate.",
      worked: [
        "Suppose X(ice, solid) = 400 and X(ice, gas) = 5. Targets: log 400 ≈ 5.99 and log 5 ≈ 1.61.",
        "With 2-d vectors w(ice) = [1.5, 0.5], w̃(solid) = [2.0, 1.0], w̃(gas) = [0.2, 1.0], biases all 0.5: pred(ice, solid) = 1.5·2.0 + 0.5·1.0 + 1.0 = 4.5; pred(ice, gas) = 0.3 + 0.5 + 1.0 = 1.8.",
        "Errors: (4.5 − 5.99)² ≈ 2.22 and (1.8 − 1.61)² ≈ 0.04. The gradient will push w(ice) further toward w̃(solid).",
        "The difference of the two predictions (4.5 − 1.8 = 2.7) approximates log(400/5) ≈ 4.38: the vectors are being fitted to a ratio, which is the design.",
      ],
      note: "f(X) = (X / x_max)^0.75 for X below x_max, else 1: rare pairs count a little, frequent pairs count fully but not more.",
    },
    code: {
      title: "A miniature GloVe: counts, then fitting",
      lang: "py",
      src: `import math, random
from collections import Counter

corpus = ("ice is solid water " * 20 + "steam is gas water " * 20 + "ice cold solid " * 10 + "steam hot gas " * 10).split()
vocab = sorted(set(corpus))
X = Counter()
for i, w in enumerate(corpus):
    for j in range(max(0, i - 2), min(len(corpus), i + 3)):
        if j != i:
            X[(w, corpus[j])] += 1.0 / abs(i - j)          # nearer neighbours weigh more

d, lr = 4, 0.05
W = {w: [random.uniform(-0.5, 0.5) for _ in range(d)] for w in vocab}
Wc = {w: [random.uniform(-0.5, 0.5) for _ in range(d)] for w in vocab}
b, bc = {w: 0.0 for w in vocab}, {w: 0.0 for w in vocab}

for epoch in range(200):
    for (i, j), x in X.items():
        f = min(1.0, (x / 20) ** 0.75)
        pred = sum(a * c for a, c in zip(W[i], Wc[j])) + b[i] + bc[j]
        err = pred - math.log(x)
        W[i] = [a - lr * f * err * c for a, c in zip(W[i], Wc[j])]
        Wc[j] = [c - lr * f * err * a for a, c in zip(W[i], Wc[j])]
        b[i] -= lr * f * err
        bc[j] -= lr * f * err

def cos(a, b):
    return sum(x * y for x, y in zip(a, b)) / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))
print(round(cos(W["ice"], W["solid"]), 2), round(cos(W["ice"], W["gas"]), 2))`,
      lines: [
        { code: "X[(w, corpus[j])] += 1.0 / abs(i - j)          # nearer neighbours weigh more", say: "The global count matrix, built in one pass. A neighbour at distance 2 contributes half as much as one at distance 1." },
        { code: "f = min(1.0, (x / 20) ** 0.75)", say: "The weighting function: rare pairs count less, and the weight saturates so 'is water' cannot dominate." },
        { code: "err = pred - math.log(x)", say: "The fit target is the log of the count, which is what makes differences of vectors encode ratios of probabilities." },
        { code: "print(round(cos(W[\"ice\"], W[\"solid\"]), 2), round(cos(W[\"ice\"], W[\"gas\"]), 2))", say: "After fitting, 'ice' is closer to 'solid' than to 'gas', purely from counts." },
      ],
      output: "0.71 -0.12",
      note: "Toy numbers vary by random seed; the sign pattern is stable.",
    },
    useIt: "Use pretrained GloVe vectors when you need good general-purpose word embeddings immediately. Train GloVe on your own corpus when you want vectors grounded in global statistics and easy, parallel training. In practice GloVe and skip-gram vectors are interchangeable for most downstream uses.",
    takeaways: ["GloVe counts co-occurrences over the whole corpus, then fits vectors to the log counts.", "Vector differences encode ratios of co-occurrence probabilities: the source of analogy arithmetic.", "Quality similar to Word2Vec; uses global statistics efficiently.", "Stanford's pretrained GloVe vectors are the standard download."],
    terms: [["GloVe", "Global Vectors: word embeddings fitted to global co-occurrence counts"], ["co-occurrence matrix", "a table of how often each pair of words appears near each other"], ["weighted least squares", "fitting by minimising weighted squared errors"]],
    reflect: { q: "GloVe fits dot products to log counts rather than raw counts. What would go wrong with raw counts?", a: "Raw counts span many orders of magnitude ('is water' versus 'ice fashion'), so a few huge pairs would dominate the squared error and the fit would ignore everything else; and ratios, which carry meaning, would become differences of enormous numbers. The log compresses the range and turns ratios into differences." },
  },

  "m13-fasttext": {
    simple: "FastText builds a word's vector from the vectors of its character n-grams, so misspelled, rare and unseen words still get sensible embeddings and morphology is shared across related words.",
    concept:
      "Word2Vec and GloVe give each whole word its own vector and nothing to words they never saw. **FastText** (from Facebook AI, 2016) represents a word as the sum of vectors for its character n-grams plus a vector for the whole word. 'where' with n = 3 is '<wh', 'whe', 'her', 'ere', 're>' (the angle brackets mark the word's edges), and its embedding is the sum of those five pieces' vectors and its own.\n\nThree things follow. A word never seen in training still has an embedding, built from n-grams that were seen. Misspellings land near the correct word because they share most n-grams. And words sharing morphology share pieces: 'unhappiness', 'unhappy' and 'happiness' overlap heavily, so what is learned about one informs the others. This matters most for languages with rich word formation and for noisy text.\n\nFastText trains with the skip-gram objective; only the word representation changed. It is also known for an extremely fast text classifier built on the same ideas, and for pretrained vectors in 157 languages.",
    why:
      "Whole-word embeddings fail exactly where real text is hardest: typos, rare inflections, compound words, new terms, and languages where one root takes dozens of endings. A model with a vector for 'run' and 'running' but not 'runnings' is stuck, although the three are obviously related in their letters. FastText exists to let embeddings see inside words, giving every word, seen or unseen, a vector assembled from shareable parts. It is the embedding-era answer to the same problem subword tokenisation solved for language models.",
    how: [
      "For each word in the vocabulary, mark its boundaries and extract all character n-grams for n from 3 to 6 (plus the whole word).",
      "Hash the n-grams into a fixed number of buckets (say 2 million) so the table stays bounded.",
      "Define the word's vector as the sum of its n-gram vectors and its whole-word vector.",
      "Train with skip-gram and negative sampling; gradients flow into the n-gram vectors, so pieces shared across words are updated by all of them.",
      "For an unseen word at run time, sum the vectors of its n-grams; the whole-word vector is absent but the pieces carry it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "Character 3-grams (edges marked)", "Shared with 'unhappy'"],
        rows: [
          ["unhappy", "<un, unh, nha, hap, app, ppy, py>", "—"],
          ["unhappiness", "<un, unh, nha, hap, app, ppi, pin, ine, nes, ess, ss>", "<un, unh, nha, hap, app"],
          ["happily", "<ha, hap, app, ppi, pil, ily, ly>", "hap, app"],
          ["unhapyp (typo)", "<un, unh, nha, hap, apy, pyp, yp>", "<un, unh, nha, hap"],
        ],
      },
      caption: "Overlapping pieces give overlapping vectors. The typo, never seen in training, still lands near 'unhappy'.",
    },
    everyday: {
      title: "Reading a smudged word",
      text: "A rain-smudged sign reads 'PHARM_CY'. You read it instantly, because the pieces you can see belong overwhelmingly to one word. FastText gives embeddings that same resilience: a word is its pieces, and most of the pieces survive a smudge, a typo or an unusual ending.",
    },
    engineering: {
      title: "Search over user-typed product reviews in Hindi and Punjabi",
      text: "A marketplace indexed reviews in several Indian languages where users typed with inconsistent spelling and in both native scripts and Latin transliteration. Whole-word embeddings had no vector for most of the forms. FastText vectors, trained on the reviews themselves, placed 'bahut accha', 'bohot acha' and 'bht achha' close together, because they share character n-grams, and gave usable vectors to inflected forms never seen in training. Zero-vector lookups fell from 23% of query words to under 1%. The team kept a note that this is a stopgap: transformer models with subword tokenisers (Stage 4 and Stage 9) handle the same problem with context too.",
    },
    maths: {
      formula: "vec(w) = vec_word(w) + Σ over g in G(w) of vec(g),   G(w) = the character n-grams of w",
      meaning: "A word's embedding is the sum of its own vector (if it has one) and the vectors of its character n-grams.",
      worked: [
        "d = 2. n-gram vectors: '<un' = [0.1, 0.2], 'unh' = [0.0, 0.3], 'nha' = [0.1, 0.1], 'hap' = [0.4, −0.1], 'app' = [0.3, −0.1], 'ppy' = [0.1, 0.0], 'py>' = [0.0, 0.1]; whole-word 'unhappy' = [0.2, 0.2].",
        "vec(unhappy) = [0.2, 0.2] + [0.1+0.0+0.1+0.4+0.3+0.1+0.0, 0.2+0.3+0.1−0.1−0.1+0.0+0.1] = [0.2, 0.2] + [1.0, 0.5] = [1.2, 0.7].",
        "Unseen 'unhapyp': n-grams '<un', 'unh', 'nha', 'hap' known; 'apy', 'pyp', 'yp>' unseen (zero). vec = [0.1+0.0+0.1+0.4, 0.2+0.3+0.1−0.1] = [0.6, 0.5]. No whole-word vector.",
        "Cosine between [1.2, 0.7] and [0.6, 0.5] ≈ 0.96: the typo sits almost on top of the real word.",
      ],
    },
    code: {
      title: "FastText vectors for seen and unseen words",
      lang: "py",
      src: `from gensim.models import FastText

sentences = [s.split() for s in [
    "the service was unhappy and slow", "very unhappy with the unhappiness of staff",
    "happily the delivery was quick", "happy customer happy shop", "slow service made me unhappy",
] * 40]

model = FastText(sentences, vector_size=20, window=2, min_count=1, min_n=3, max_n=5, epochs=30, seed=1)
wv = model.wv

print("unhapyp" in wv.key_to_index)              # the typo was never in the corpus
print(round(wv.similarity("unhappy", "unhapyp"), 2))
print(round(wv.similarity("unhappy", "unhappiness"), 2))
print(round(wv.similarity("unhappy", "quick"), 2))`,
      lines: [
        { code: "model = FastText(sentences, vector_size=20, window=2, min_count=1, min_n=3, max_n=5, epochs=30, seed=1)", say: "Same skip-gram training as Word2Vec; min_n and max_n set the character n-gram lengths used inside words." },
        { code: "print(\"unhapyp\" in wv.key_to_index)              # the typo was never in the corpus", say: "False: the word has no entry. Word2Vec would raise an error here." },
        { code: "print(round(wv.similarity(\"unhappy\", \"unhapyp\"), 2))", say: "A vector is built from the typo's n-grams anyway, and it is close to the correct word." },
      ],
      output: "False\n0.87\n0.79\n0.08",
      note: "Toy figures; with real corpora the pattern is the same: unseen and misspelled words get useful vectors.",
    },
    useIt: "Use FastText for embeddings over noisy or morphologically rich text (user-generated content, transliterated Indian languages, German or Turkish), for fast baseline classifiers, and whenever you need vectors for words outside the training vocabulary. Pretrained vectors exist for 157 languages.",
    takeaways: ["FastText = a word's vector is the sum of its character n-gram vectors.", "Unseen and misspelled words get sensible embeddings from their pieces.", "Morphology is shared: related words overlap in n-grams.", "Same skip-gram training; different representation of the word."],
    terms: [["FastText", "word embeddings built from character n-gram vectors"], ["character n-gram", "a run of n consecutive characters inside a word, with edge markers"], ["out-of-vocabulary word", "a word not seen during training"]],
    reflect: { q: "Why does FastText help more for Turkish than for English?", a: "Turkish builds long words by adding many suffixes to a root, so a root appears in dozens of surface forms, most of them rare. Whole-word embeddings see each form separately; n-gram embeddings share the root's pieces across all of them. English has comparatively few inflections, so the gain is smaller." },
  },

  "m13-semantic-similarity": {
    simple: "Semantic similarity is a number for how close two texts are in meaning, computed by comparing their embeddings; it is what lets search match paraphrases and lets systems group things by what they mean.",
    concept:
      "With meaning-bearing vectors in hand, the question 'how alike are these two texts?' becomes geometry. **Semantic similarity** is a score, usually between 0 and 1 or −1 and 1, that says how close two texts are in meaning. Two sentences that say the same thing in different words score high; two that share words but mean different things score low.\n\nFor single words the score comes from the word vectors directly. For sentences and documents, each text is first turned into one vector, either by averaging its word vectors (crude but workable) or by a model trained to produce sentence embeddings (far better; Module 28 and Stage 6 use these). Then the two vectors are compared, almost always with cosine similarity (a later lesson in this module).\n\nSemantic similarity is a relatedness score, not an equivalence test. 'The delivery was late' and 'The delivery was early' score high: same topic, opposite facts. Treat the number as 'about the same thing', and add other checks when facts must match.",
    why:
      "Exact word matching misses most of the ways people say the same thing, and it cannot rank: a document either contains the word or does not. A similarity score lets a system find the nearest meanings among millions of candidates, rank them, cluster them and deduplicate them. It exists because meaning comparison is the operation underneath search, recommendation, grouping and retrieval-augmented generation, and embeddings make it a single dot product.",
    how: [
      "Turn each text into one vector: look up word vectors and average them, or run a sentence-embedding model.",
      "Normalise the vectors to unit length so that length (which tracks text length and frequency) does not affect the score.",
      "Compute cosine similarity: the dot product of the two unit vectors.",
      "Interpret with a threshold learned from examples: above 0.8 might mean 'near duplicate', 0.5 'related', below 0.2 'unrelated'; the numbers depend on the model.",
      "Validate on pairs with human judgements before trusting any threshold.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text A", "Text B", "Word overlap", "Semantic similarity (illustrative)"],
        rows: [
          ["turn off notifications", "disable alerts", "none", "0.82"],
          ["the delivery was late", "the parcel arrived after the promised date", "one word", "0.79"],
          ["the delivery was late", "the delivery was early", "most words", "0.74 (same topic, opposite fact)"],
          ["the delivery was late", "how do I change my password", "one word", "0.08"],
        ],
      },
      caption: "Overlap and similarity disagree in both directions. The third row is the warning: similarity is relatedness, not agreement.",
    },
    everyday: {
      title: "'Is this the same complaint?'",
      text: "A receptionist hears 'the lift's stuck again' and 'the elevator isn't moving' and files them as one issue, without any shared words. They would not file 'the lift is working perfectly' with them, although it shares more words. A good similarity score mimics the receptionist: meaning first, words second. A naive one mimics a keyword search.",
    },
    engineering: {
      title: "Deduplicating support tickets",
      text: "A SaaS company gets the same bug reported by hundreds of customers in different words. An engineer embeds each new ticket with a sentence-embedding model and compares it with open tickets by cosine similarity; anything above 0.85 is suggested as a duplicate for an agent to confirm. The threshold was set by scoring 500 ticket pairs that agents had already labelled as duplicates or not. The system halved the time agents spent triaging. Its known failure is the opposite-fact case: 'export works after update' and 'export broken after update' score high, so agents still confirm.",
    },
    maths: {
      formula: "sim(A, B) = (a · b) ÷ (‖a‖ ‖b‖),   where a and b are the texts' embedding vectors",
      meaning: "The dot product of the two vectors, divided by their lengths: the cosine of the angle between them. Same direction gives 1, unrelated gives about 0.",
      worked: [
        "Sentence vectors (3-d toy): A = 'turn off notifications' = [0.8, 0.3, 0.1]; B = 'disable alerts' = [0.7, 0.4, 0.0]; C = 'change my password' = [0.1, 0.2, 0.9].",
        "A · B = 0.56 + 0.12 + 0 = 0.68. ‖A‖ = √(0.64 + 0.09 + 0.01) = √0.74 ≈ 0.86. ‖B‖ = √(0.49 + 0.16) ≈ 0.81. sim(A, B) = 0.68 ÷ (0.86 × 0.81) ≈ 0.98.",
        "A · C = 0.08 + 0.06 + 0.09 = 0.23. ‖C‖ = √(0.01 + 0.04 + 0.81) ≈ 0.93. sim(A, C) = 0.23 ÷ (0.86 × 0.93) ≈ 0.29.",
        "A and B are near-synonyms by this measure; A and C are weakly related (both are settings actions).",
      ],
    },
    code: {
      title: "Sentence similarity with an embedding model",
      lang: "py",
      src: `# pip install sentence-transformers
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

pairs = [
    ("turn off notifications", "disable alerts"),
    ("the delivery was late", "the parcel arrived after the promised date"),
    ("the delivery was late", "the delivery was early"),
    ("the delivery was late", "how do I change my password"),
]
for a, b in pairs:
    ea, eb = model.encode(a), model.encode(b)
    print(round(float(util.cos_sim(ea, eb)), 2), "|", a, "/", b)`,
      lines: [
        { code: "model = SentenceTransformer(\"all-MiniLM-L6-v2\")", say: "A small model trained to make whole-sentence vectors comparable, far better than averaging word vectors." },
        { code: "ea, eb = model.encode(a), model.encode(b)", say: "Each sentence becomes one vector of a few hundred numbers." },
        { code: "print(round(float(util.cos_sim(ea, eb)), 2), \"|\", a, \"/\", b)", say: "Cosine similarity of the two vectors: the semantic similarity score." },
      ],
      output: "0.63 | turn off notifications / disable alerts\n0.71 | the delivery was late / the parcel arrived after the promised date\n0.78 | the delivery was late / the delivery was early\n0.12 | the delivery was late / how do I change my password",
      note: "The late/early pair scores highest of all: the model sees two sentences about delivery timing. Semantic similarity is not fact checking.",
    },
    useIt: "Use semantic similarity for search over meaning, duplicate detection, clustering feedback, recommending related content, and retrieval for RAG. Calibrate thresholds on labelled pairs, and add exact checks wherever facts (dates, polarity, numbers) must agree.",
    takeaways: ["Semantic similarity = closeness of two texts' embedding vectors, usually by cosine.", "It finds paraphrases that word overlap misses, and ignores overlap that misleads.", "It measures relatedness, not agreement: opposite facts on the same topic score high.", "Calibrate thresholds on human-labelled pairs."],
    terms: [["semantic similarity", "a score for how close two texts are in meaning"], ["sentence embedding", "a single vector representing a whole sentence or passage"], ["threshold", "the score above which two texts are treated as similar for a task"]],
    reflect: { q: "A duplicate detector merges 'refund received, thanks' with 'refund not received' because they score 0.88. Which property of similarity caused this, and what one extra check would prevent it?", a: "Similarity measures topic relatedness, and both are about refund receipt. Add a cheap polarity check (negation words, or a small classifier for sentiment or outcome) that must agree before a merge is allowed." },
  },

  "m13-embedding-dimensions": {
    simple: "The embedding dimension is how many numbers each vector has; more dimensions can hold more distinctions but cost more memory and compute and need more data to learn, so typical values run from 50 to a few thousand.",
    concept:
      "Every embedding is a vector of some fixed length, its **dimension**: 50, 100, 300 for classic word vectors; 384, 768, 1,024, 1,536 or 3,072 for modern sentence embeddings; up to several thousand for the internal vectors of large language models. Nobody labels the dimensions; each is just a coordinate the training was free to use.\n\nMore dimensions give the vectors more room to keep distinctions apart: in 2-d, 'cheap' cannot be near both 'inexpensive' and 'shoddy' without those two being near each other; in 300-d it can. Beyond a point, extra dimensions stop helping: the model has no further distinctions to store, the vectors get noisier, and every downstream cost grows linearly with dimension, from the embedding table (V × d) to the index that searches millions of vectors.\n\nSome modern embedding models are trained so that the first k dimensions already form a good smaller embedding, letting you truncate a 3,072-dimension vector to 256 for cheap search and keep the full vector for precise reranking.",
    why:
      "Dimension is a cost lever that is set once and paid everywhere: storage for every vector, memory for every index, time for every similarity computation, and parameters in every table. Too small and meanings collide; too large and the system is slow and expensive without gaining accuracy. The lesson exists so the number is chosen by measurement, and so that 'this vector has 1,536 numbers' reads as a cost and a capacity rather than a mysterious constant.",
    how: [
      "Start from the dimension of a pretrained model you intend to use; it is fixed by that model.",
      "If training your own, try a few sizes (50, 100, 300 for word vectors) and measure the downstream task, not just training loss.",
      "Estimate storage: number of vectors × d × bytes per number; and search cost, which scales with d.",
      "If the model supports truncation, evaluate accuracy at several truncated sizes and keep the smallest that meets the target.",
      "Prefer a smaller dimension when data is limited; high dimensions with little data overfit and produce noisy vectors.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Dimension", "Typical use", "Storage for 10 million vectors (float32)", "Note"],
        rows: [
          ["50", "classic word vectors, small data", "2 GB", "coarse; collisions between meanings"],
          ["300", "GloVe / Word2Vec standard", "12 GB", "the classic sweet spot for words"],
          ["768", "BERT-size sentence embeddings", "31 GB", "common in search systems"],
          ["1,536", "large API embedding models", "61 GB", "precise; often truncatable"],
          ["3,072", "largest API embeddings", "123 GB", "diminishing returns for most tasks"],
        ],
      },
      caption: "Storage grows in a straight line with dimension; accuracy does not. Measure where your task stops improving.",
    },
    everyday: {
      title: "How many questions to describe a film",
      text: "Describe films with two numbers (how funny, how scary) and comedies and horrors separate, but a courtroom drama and a romance land in the same spot. Add 'how romantic', 'how talky', 'how long', and they separate. Add a thousand more questions and most are redundant, every answer costs time, and small differences between two films become noise. Embedding dimension is how many questions the vector answers.",
    },
    engineering: {
      title: "Cutting an index from 1,536 to 256 dimensions",
      text: "A news company indexed 40 million articles with 1,536-dimension embeddings and found the vector index needed 250 GB of memory. The embedding model supported truncation; they measured search quality (recall of known relevant articles in the top 10) at 1,536, 768, 512 and 256 dimensions and found 256 lost under two points of recall. They store 256-dimension vectors in the index (42 GB) and recompute the full vector only for the top 100 candidates when reranking. The cost of the index fell by 83%; search latency fell with it.",
    },
    maths: {
      formula: "storage = n × d × bytes;   similarity cost per comparison ∝ d;   embedding table = V × d",
      meaning: "n vectors of d numbers each. Every cost that touches a vector scales with d.",
      worked: [
        "10 million vectors at d = 1,536 in float32 (4 bytes): 10,000,000 × 1,536 × 4 = 61.4 GB.",
        "Same vectors truncated to d = 256: 10.2 GB. Six times smaller.",
        "A search comparing a query with 10 million vectors does 10,000,000 × d multiplications: 15.4 billion at d = 1,536 versus 2.6 billion at d = 256.",
        "Using 16-bit numbers instead of 32-bit halves storage again: 5.1 GB at d = 256, at a small cost in precision.",
      ],
    },
    code: {
      title: "Measuring what dimensions buy you",
      lang: "py",
      src: `import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")        # 384 dimensions
docs = ["disable alerts", "turn off notifications", "reset my password", "change login password", "track my parcel"]
E = model.encode(docs, normalize_embeddings=True)
print(E.shape)

def nearest(query_vec, matrix):
    sims = matrix @ query_vec
    return docs[int(np.argmax(sims))], round(float(np.max(sims)), 2)

q = model.encode("switch off push messages", normalize_embeddings=True)
for d in [384, 128, 32]:
    Ed = E[:, :d] / np.linalg.norm(E[:, :d], axis=1, keepdims=True)
    qd = q[:d] / np.linalg.norm(q[:d])
    print(d, nearest(qd, Ed))`,
      lines: [
        { code: "E = model.encode(docs, normalize_embeddings=True)", say: "Five documents become a 5 × 384 matrix of unit-length vectors." },
        { code: "Ed = E[:, :d] / np.linalg.norm(E[:, :d], axis=1, keepdims=True)", say: "Truncate to the first d dimensions and re-normalise. This model was not trained for truncation, so quality may drop faster than with one that was." },
        { code: "print(d, nearest(qd, Ed))", say: "Does the right document still win at 128 and at 32 dimensions? Measure instead of guessing." },
      ],
      output: "(5, 384)\n384 ('turn off notifications', 0.69)\n128 ('turn off notifications', 0.66)\n32 ('disable alerts', 0.58)",
      note: "At 32 dimensions the nearest result changed. Where the change starts to hurt depends on the task and the model; run this on your own data.",
    },
    useIt: "Treat the dimension as a cost you pay per vector forever: estimate storage and search cost before indexing millions of items, truncate when the model supports it, and measure recall at each size. For your own small-data embeddings, prefer modest dimensions.",
    takeaways: ["Dimension = how many numbers per vector; more room for distinctions, more cost everywhere.", "Storage, index memory and similarity time scale linearly with d.", "Accuracy saturates; measure where, and truncate when the model allows.", "Small data wants small dimensions."],
    terms: [["embedding dimension", "the number of entries in an embedding vector"], ["truncation (embeddings)", "keeping only the first k dimensions of a vector trained to allow it"], ["vector index", "a data structure for finding nearest vectors among millions quickly"]],
    reflect: { q: "Why might a 50-dimension embedding trained on a small corpus beat a 1,000-dimension one trained on the same corpus?", a: "With little data, 1,000 dimensions have far more freedom than the corpus can constrain: the vectors fit noise and co-occurrence accidents, and similar words do not land reliably together. Fifty dimensions force the training to use each coordinate for a real, well-supported distinction." },
  },

  "m13-embedding-vectors": {
    simple: "An embedding vector is the concrete list of numbers for one item; in practice you create, store, normalise, index and compare these vectors, and treating them well is most of the engineering of embedding systems.",
    concept:
      "The previous lessons explained where embeddings come from. This one is about handling the vectors themselves. An **embedding vector** is a fixed-length array of floating-point numbers produced by an embedding model for one item: a word, a sentence, a document, an image, a product. All vectors from one model share a dimension and a geometry; vectors from different models are not comparable at all.\n\nIn a working system, vectors are produced once and reused: compute the embedding of each document when it is indexed, store it next to the document's ID, and at query time embed only the query. Vectors are usually normalised to unit length so that cosine similarity reduces to a dot product. They are stored as float32 or float16, sometimes quantised to 8-bit integers to save space. They are compared in bulk by matrix multiplication and searched with vector indexes (Module 29).\n\nTwo rules keep systems correct: always embed queries and documents with the same model and version, and re-embed everything if the model changes. A vector is only meaningful relative to the other vectors from the same model.",
    why:
      "Most embedding failures in production are not about the model but about the vectors: a query embedded with a different model than the index, vectors stored without normalisation and compared by dot product, an index built from an old version, or 100 million vectors that no longer fit in memory. The lesson exists to make the vector a first-class object with rules: one model, normalised, stored with its version, batched when computed, indexed when searched.",
    how: [
      "Choose one embedding model and record its name and version with every vector you store.",
      "Compute embeddings in batches (hundreds of texts per call) rather than one at a time; it is far faster.",
      "Normalise each vector to unit length and store it as float32 (or float16/int8 after checking accuracy).",
      "Store the vector with the item's ID and metadata; build a vector index when the collection is large.",
      "At query time, embed the query with the same model, normalise, and compute dot products against the stored vectors (or query the index).",
      "When the model changes, re-embed the whole collection; never mix vectors from two models.",
    ],
    visual: {
      kind: "flow",
      steps: ["documents", "embedding model v2 (batch)", "unit-length vectors + IDs + 'model: v2'", "vector index", "query → embedding model v2 → unit vector", "dot products → top k IDs"],
      caption: "The model appears twice and must be the same both times. Everything between is storage and arithmetic.",
    },
    everyday: {
      title: "Coordinates on one map",
      text: "Two friends arrange to meet at grid reference 51.5, −0.12. It works because both use the same map. If one uses a street map and the other a hiking map with a different grid, the same numbers point to different places and they never meet. Embedding vectors are coordinates on the model's map; use one map.",
    },
    engineering: {
      title: "The index that silently went stale",
      text: "An e-commerce search team upgraded their embedding model for better multilingual quality. The query path picked up the new model on deploy; the index of 8 million product vectors was still from the old model. Nothing errored; search quality simply collapsed, because old and new vectors lived in unrelated spaces. They caught it from a drop in click-through within an hour, rolled the query model back, re-embedded the catalogue overnight in batches, and switched both sides together. Afterwards every stored vector carried the model version and the query path refused to run against a mismatched index.",
    },
    maths: {
      formula: "unit vector û = u ÷ ‖u‖;   cosine(u, v) = û · v̂;   batch similarities = Q × Dᵀ",
      meaning: "Dividing a vector by its length makes it unit length. Then cosine similarity is a plain dot product, and comparing many queries with many documents is one matrix multiplication.",
      worked: [
        "u = [3, 4]: ‖u‖ = √(9 + 16) = 5; û = [0.6, 0.8]. v = [4, 3]: v̂ = [0.8, 0.6].",
        "cosine = 0.6·0.8 + 0.8·0.6 = 0.96. Without normalising, u · v = 12 + 12 = 24, a number that depends on the lengths and cannot be compared across pairs.",
        "Ten queries against one million documents at d = 384: Q is 10 × 384, D is 1,000,000 × 384; Q × Dᵀ is 10 × 1,000,000 similarities in one call, about 3.8 billion multiplications.",
      ],
    },
    code: {
      title: "Embed, normalise, store, search",
      lang: "py",
      src: `import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

docs = ["disable alerts", "turn off notifications", "reset my password", "track my parcel"]
doc_vecs = model.encode(docs, batch_size=64, normalize_embeddings=True)       # one batch call
index = {"model": MODEL_NAME, "ids": list(range(len(docs))), "vectors": doc_vecs.astype(np.float32)}

def search(query, index, k=2):
    assert index["model"] == MODEL_NAME, "index was built with a different model"
    q = model.encode([query], normalize_embeddings=True)[0]
    sims = index["vectors"] @ q
    top = np.argsort(-sims)[:k]
    return [(docs[i], round(float(sims[i]), 2)) for i in top]

print(search("switch off push messages", index))`,
      lines: [
        { code: "doc_vecs = model.encode(docs, batch_size=64, normalize_embeddings=True)       # one batch call", say: "All documents embedded in one batched call and normalised to unit length; this runs once at index time." },
        { code: "index = {\"model\": MODEL_NAME, \"ids\": list(range(len(docs))), \"vectors\": doc_vecs.astype(np.float32)}", say: "Vectors stored with their IDs and the model's name. The name is what prevents the stale-index bug." },
        { code: "assert index[\"model\"] == MODEL_NAME, \"index was built with a different model\"", say: "A one-line guard: refuse to search an index built by a different model." },
        { code: "sims = index[\"vectors\"] @ q", say: "Because everything is unit length, one matrix-vector product gives every cosine similarity." },
      ],
      output: "[('turn off notifications', 0.69), ('disable alerts', 0.58)]",
      note: "For millions of documents, replace the matrix product with a vector index (Module 29); the rules about the model and normalisation stay.",
    },
    useIt: "In any embedding system: batch the computation, normalise, store vectors with IDs and the model version, index at scale, embed queries with the same model, and re-embed on model changes. These rules prevent the silent failures that account for most embedding bugs.",
    takeaways: ["A vector is meaningful only relative to vectors from the same model and version.", "Normalise to unit length; cosine becomes a dot product; batches become matrix products.", "Store vectors with IDs and the model version; re-embed everything when the model changes.", "Compute in batches; index at scale."],
    terms: [["embedding vector", "the array of numbers an embedding model produces for one item"], ["unit normalisation", "scaling a vector to length 1"], ["re-embedding", "recomputing every stored vector after changing the embedding model"]],
    reflect: { q: "You switch your embedding model to one with the same dimension (768). Can you keep the old index?", a: "No. Same dimension does not mean same space; the new model's coordinates are unrelated to the old model's, so similarities between old document vectors and new query vectors are meaningless. Re-embed everything and switch both sides together." },
  },

  "m13-cosine-similarity": {
    simple: "Cosine similarity measures the angle between two vectors: 1 means they point the same way, 0 means unrelated, −1 means opposite; it ignores vector length, which is why it is the standard way to compare embeddings.",
    concept:
      "Two vectors can be compared by distance (how far apart their endpoints are) or by direction (how small the angle between them is). **Cosine similarity** uses direction: it is the cosine of the angle between the vectors, computed as their dot product divided by the product of their lengths. Identical directions give 1; a right angle gives 0; opposite directions give −1.\n\nDirection is the right thing to compare for embeddings because length carries little meaning: a long document's averaged vector or a frequent word's vector may be longer or shorter without being more or less 'about' something. Cosine strips length out and asks only what the vector points toward. For unit-length vectors, the cosine is simply the dot product, which is why systems normalise vectors once and then use dot products everywhere.\n\nTypical embedding models produce similarities mostly in the 0 to 1 range (negative values are rare because the vectors share a general 'is text' direction), and the useful scale differs by model, so thresholds are always calibrated per model.",
    why:
      "Raw dot products reward long vectors and plain distance punishes them, so neither compares meaning cleanly. Cosine exists to make similarity about orientation alone, which matches what embeddings encode. It is also cheap: after normalisation, a similarity is one dot product, and millions of them are one matrix multiplication, which is what makes embedding search fast.",
    how: [
      "Compute the dot product of the two vectors: multiply position by position and add.",
      "Compute each vector's length: the square root of the sum of its squared entries.",
      "Divide the dot product by the product of the two lengths.",
      "Or normalise both vectors to unit length first; then the dot product alone is the cosine.",
      "Interpret relative to the model's scale and a calibrated threshold.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Vectors", "Angle", "Cosine", "Meaning"],
        rows: [
          ["[1, 0] and [2, 0]", "0°", "1.0", "same direction; different lengths do not matter"],
          ["[1, 1] and [1, 0]", "45°", "0.71", "related"],
          ["[1, 0] and [0, 1]", "90°", "0.0", "unrelated"],
          ["[1, 0] and [−1, 0]", "180°", "−1.0", "opposite"],
        ],
      },
      caption: "The first row is the point: [1, 0] and [2, 0] have cosine 1 although their distance is 1. Cosine sees direction only.",
    },
    everyday: {
      title: "Two people pointing",
      text: "Ask two people to point at what they are talking about. If their arms point the same way, they mean the same thing, whether one arm is longer. If their arms make a right angle, they mean different things. Cosine similarity measures the angle between the pointing arms and ignores arm length.",
    },
    engineering: {
      title: "A recommendation bug fixed by normalising",
      text: "A music service computed song similarities by raw dot product of embeddings. Popular songs, whose vectors were longer because they appeared in more training contexts, dominated every recommendation list regardless of genre. Switching to cosine similarity (normalising every vector at index time) made recommendations follow genre and mood instead of popularity, and let the team add a separate, explicit popularity term that they could tune on purpose rather than by accident.",
    },
    maths: {
      formula: "cos(a, b) = (a · b) ÷ (‖a‖ × ‖b‖),   a · b = Σᵢ aᵢ bᵢ,   ‖a‖ = √(Σᵢ aᵢ²)",
      meaning: "Dot product over the product of lengths. Lengths are square roots of sums of squares.",
      worked: [
        "a = [0.8, 0.3, 0.1] ('turn off notifications'), b = [0.7, 0.4, 0.0] ('disable alerts').",
        "a · b = 0.8×0.7 + 0.3×0.4 + 0.1×0.0 = 0.56 + 0.12 + 0 = 0.68.",
        "‖a‖ = √(0.64 + 0.09 + 0.01) = √0.74 ≈ 0.860. ‖b‖ = √(0.49 + 0.16 + 0) = √0.65 ≈ 0.806.",
        "cos = 0.68 ÷ (0.860 × 0.806) = 0.68 ÷ 0.693 ≈ 0.981.",
        "Now scale b by 10: b' = [7, 4, 0]. a · b' = 6.8; ‖b'‖ ≈ 8.06; cos = 6.8 ÷ (0.860 × 8.06) ≈ 0.981. Unchanged, as intended.",
      ],
    },
    code: {
      title: "Cosine similarity three ways",
      lang: "py",
      src: `import math
import numpy as np

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

a = [0.8, 0.3, 0.1]
b = [0.7, 0.4, 0.0]
print(round(cosine(a, b), 3), round(cosine(a, [7, 4, 0]), 3))     # scaling b changes nothing

A = np.array([a, [0.1, 0.2, 0.9]])            # two "documents"
A = A / np.linalg.norm(A, axis=1, keepdims=True)
q = np.array(b) / np.linalg.norm(b)
print(np.round(A @ q, 3))                      # all cosines at once, as dot products of unit vectors`,
      lines: [
        { code: "return dot / (na * nb)", say: "The definition: dot product divided by the two lengths." },
        { code: "print(round(cosine(a, b), 3), round(cosine(a, [7, 4, 0]), 3))     # scaling b changes nothing", say: "Multiplying a vector by 10 leaves the cosine identical. Length is ignored." },
        { code: "A = A / np.linalg.norm(A, axis=1, keepdims=True)", say: "Normalise once at index time." },
        { code: "print(np.round(A @ q, 3))                      # all cosines at once, as dot products of unit vectors", say: "With unit vectors, a matrix-vector product returns every cosine similarity in one step." },
      ],
      output: "0.981 0.981\n[0.981 0.247]",
    },
    useIt: "Use cosine similarity for all embedding comparisons: search, deduplication, clustering, retrieval. Normalise at index time so the hot path is dot products or matrix multiplications. Calibrate thresholds per model; a 0.8 from one model is not a 0.8 from another.",
    takeaways: ["Cosine similarity = the cosine of the angle between two vectors: direction, not length.", "1 same, 0 unrelated, −1 opposite; embeddings mostly live between 0 and 1.", "Unit-normalise once; then cosine is a dot product and batches are matrix products.", "Thresholds are model-specific; calibrate."],
    terms: [["cosine similarity", "the dot product of two vectors divided by the product of their lengths"], ["dot product", "the sum of position-wise products of two vectors"], ["vector length (norm)", "the square root of the sum of squared entries"]],
    reflect: { q: "When would Euclidean distance between embeddings rank results differently from cosine similarity, and when would they agree?", a: "They differ when vectors have different lengths: a long vector can be far in distance from a short one that points the same way. After unit normalisation, distance and cosine give the same ranking, because for unit vectors distance² = 2 − 2·cosine." },
  },

  "m13-contextual-embeddings": {
    simple: "A contextual embedding is a vector for a word computed from the whole sentence it is in, so the same word gets different vectors in different sentences; it is what transformer models produce at every layer.",
    concept:
      "Every embedding so far was static: one vector per word, the same in every sentence. 'Bank' has one vector, somewhere between the river and the money. A **contextual embedding** is computed fresh for each occurrence, by a model that reads the surrounding words. 'Bank' in 'the river bank' and 'bank' in 'the bank approved the loan' come out as different vectors, each near the words that fit that meaning.\n\nThe models that do this are the transformers of Stage 4: they start from static token embeddings and pass them through layers of attention, where every token's vector is updated using the vectors of the tokens around it. The vectors at the output of these layers are the contextual embeddings. Sentence-embedding models go one step further and pool the token vectors into a single vector for the whole text, which is what semantic search uses.\n\nContextual embeddings resolve ambiguity, capture negation and word order, and represent phrases and sentences as wholes. They cost a model run per text rather than a table lookup, which is the price of context.",
    why:
      "Static embeddings cannot tell which 'bank' you mean, cannot see that 'not good' differs from 'good', and have nothing to say about a sentence beyond the average of its words. Many language tasks turn on exactly those things. Contextual embeddings exist because the meaning of a word is determined by its context, and a representation that reads the context can encode that meaning. The 2018 models (ELMo, then BERT) that first did this at scale improved nearly every benchmark at once.",
    how: [
      "Tokenise the text and look up each token's static embedding (the embedding table).",
      "Add position information so the model knows the order of tokens.",
      "Pass the sequence through transformer layers; at each layer, every token's vector is recomputed as a mixture of the vectors of the tokens it attends to.",
      "Take the output vectors: one per token, each informed by the whole text. These are the contextual embeddings.",
      "For a sentence vector, pool the token vectors (mean, or a special token's vector) with a model trained so the pooled vector is comparable across sentences.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Static (Word2Vec, GloVe, FastText)", points: ["one vector per word, from a table", "'bank' is one blended vector", "'not good' ≈ 'good' + 'not'", "lookup: microseconds", "no sentence vector beyond averaging"] },
      right: { title: "Contextual (transformers)", points: ["a vector per occurrence, from a model run", "'bank' differs by sentence", "'not good' encoded as a unit", "a forward pass: milliseconds", "pooled vectors represent whole sentences"] },
      caption: "The table became a model. The cost went up, and so did everything the vectors can express.",
    },
    everyday: {
      title: "The same word, two conversations",
      text: "Someone says 'that was sick' at a hospital and at a skate park. You never hesitate: context sets the meaning before the word lands. A static embedding is a dictionary entry that lists both meanings at once; a contextual embedding is your instant, situated understanding of which one is meant.",
    },
    engineering: {
      title: "Legal clause search that understands 'terminate'",
      text: "A legal-tech company indexed contract clauses for search. With static embeddings, 'terminate' pulled clauses about ending agreements and clauses about terminating employees and clauses about termination fees with equal confidence. With contextual sentence embeddings, a query 'early termination penalty' matched fee clauses and not dismissals, because the model's vector for each clause encoded what kind of termination it concerned. Precision in the top ten rose from 48% to 81% on their test queries. The index cost rose too: embedding 20 million clauses took a GPU day instead of a CPU hour.",
    },
    maths: {
      formula: "h⁽⁰⁾ᵢ = E[tokenᵢ] + posᵢ;   h⁽ˡ⁺¹⁾ᵢ = Layer(h⁽ˡ⁾₁ … h⁽ˡ⁾ₙ)ᵢ;   contextual embedding of token i = h⁽ᴸ⁾ᵢ",
      meaning: "Each token starts as its static embedding plus a position vector. Every layer recomputes every token's vector from all tokens' vectors. After L layers, token i's vector depends on the whole sequence.",
      worked: [
        "Two sentences share the token 'bank'. At layer 0, h₀(bank) is identical in both: the table row plus a position vector.",
        "At layer 1, 'bank' in 'river bank' mixes in 'river'; 'bank' in 'bank approved loan' mixes in 'approved' and 'loan'. The two vectors now differ.",
        "By the last layer the two 'bank' vectors are far apart: cosine between them might be 0.35, while each is close (0.8+) to 'shore' and 'lender' respectively.",
        "The static embedding would have given cosine 1.0 between the two occurrences, because it is the same row.",
      ],
      note: "Stage 4 opens up the Layer function: attention and feed-forward networks.",
    },
    code: {
      title: "The same word, different vectors",
      lang: "py",
      src: `# pip install transformers torch
import torch
from transformers import AutoTokenizer, AutoModel

tok = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

def vector_of(sentence, word):
    enc = tok(sentence, return_tensors="pt")
    with torch.no_grad():
        out = model(**enc).last_hidden_state[0]         # one vector per token
    idx = enc.input_ids[0].tolist().index(tok.convert_tokens_to_ids(word))
    return out[idx]

cos = torch.nn.functional.cosine_similarity
b1 = vector_of("they sat on the river bank", "bank")
b2 = vector_of("the bank approved the loan", "bank")
b3 = vector_of("the lender approved the mortgage", "lender")
print(round(float(cos(b1, b2, dim=0)), 2), round(float(cos(b2, b3, dim=0)), 2))`,
      lines: [
        { code: "out = model(**enc).last_hidden_state[0]         # one vector per token", say: "The model's last layer: a contextual vector for every token in the sentence." },
        { code: "idx = enc.input_ids[0].tolist().index(tok.convert_tokens_to_ids(word))", say: "Find where the word of interest sits and take its vector." },
        { code: "print(round(float(cos(b1, b2, dim=0)), 2), round(float(cos(b2, b3, dim=0)), 2))", say: "'bank' by the river versus 'bank' that lends: not the same vector. The lending 'bank' is closer to 'lender' than to the other 'bank'." },
      ],
      output: "0.47 0.63",
      note: "Exact values vary by model; the pattern (same word, different vectors by context) is the whole point.",
    },
    useIt: "Use contextual embeddings, through sentence-embedding models, for semantic search, RAG retrieval, clustering, classification features and deduplication. Use static embeddings only where a table lookup's speed matters more than context. Stage 4 explains the transformer that computes them.",
    takeaways: ["A contextual embedding is computed per occurrence from the whole text; the same word gets different vectors.", "Produced by transformer layers that mix each token's vector with its neighbours'.", "Resolves ambiguity, negation and order; represents whole sentences when pooled.", "Costs a model run instead of a lookup."],
    terms: [["contextual embedding", "a vector for a token computed from its whole sentence"], ["pooling", "combining per-token vectors into one vector for the whole text"], ["hidden state", "a token's vector at some layer inside a model"]],
    reflect: { q: "Why can a contextual embedding model represent 'not good' correctly when a static one cannot?", a: "The static model has separate rows for 'not' and 'good', and any combination (average, sum) is a fixed function that cannot flip meaning. The contextual model recomputes 'good''s vector after attending to 'not', so the output vector for that occurrence lands near 'bad'. Context changes the vector itself." },
  },

  "m13-static-vs-contextual-embeddings": {
    simple: "Static embeddings are fast table lookups with one meaning per word; contextual embeddings are model runs that capture meaning in context; choose by whether the task needs context and what you can afford per text.",
    concept:
      "This lesson closes the module with the decision. **Static embeddings** (Word2Vec, GloVe, FastText) are a table: one vector per word, computed once, looked up in microseconds, with no notion of the sentence. **Contextual embeddings** (from transformers, usually through sentence-embedding models) are computed by running a model over the text, cost milliseconds and a GPU at scale, and encode what the words mean together.\n\nThey are not simply old and new. Static embeddings remain the right choice for lightweight features in classic models, for extremely high-volume or on-device work, for item embeddings over non-text sequences (products, songs), and for languages or domains where you can train on your own corpus quickly. Contextual embeddings are the right choice whenever the task depends on disambiguation, negation, phrasing or whole-sentence meaning: search, retrieval for generation, duplicate detection, clustering of free text.\n\nA practical middle ground is common: contextual sentence embeddings computed once per document at index time (the expensive part, done offline), and cheap operations (dot products, static lookups) at query time.",
    why:
      "Teams default to the most powerful option and then meet its cost, or default to the cheapest and meet its ceiling. The choice has a structure: what does the task need, how many texts, how fast, on what hardware. Laying it out prevents both mistakes and makes the hybrid designs obvious. The lesson exists to turn the module's methods into a decision you can make in a minute.",
    how: [
      "Ask whether the task depends on context: ambiguity, negation, word order, phrase meaning. If yes, contextual.",
      "Ask about volume and latency: millions of texts per hour on CPU, or on-device, favours static or precomputed contextual vectors.",
      "Ask whether the items are words at all: products, users, songs, pages use static item embeddings trained on your sequences.",
      "Ask about data: a specialised corpus with no pretrained model favours training your own static embeddings quickly; general text favours pretrained contextual models.",
      "Design the hybrid: embed documents with a contextual model offline, store vectors, and keep the query path cheap.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Need", "Static", "Contextual", "Typical choice"],
        rows: [
          ["word similarity, synonyms, analogies", "good", "overkill", "static"],
          ["features for a classic classifier", "good, cheap", "better, costlier", "static first; contextual if accuracy matters"],
          ["semantic search over documents", "weak (averaging)", "strong", "contextual at index time, dot products at query time"],
          ["disambiguation, negation, phrase meaning", "cannot", "yes", "contextual"],
          ["item embeddings (products, songs)", "natural fit (Word2Vec on sequences)", "n/a", "static"],
          ["on-device, millions per hour", "fits", "often too slow", "static or precomputed contextual"],
        ],
      },
      caption: "Most rows have a clear winner. The search row is the hybrid most production systems use.",
    },
    everyday: {
      title: "A dictionary and a friend",
      text: "A dictionary gives every word's meanings in a flash and never knows which one you need. A knowledgeable friend reads the whole message and tells you what it meant, but takes a moment and cannot answer ten thousand questions a second. You use the dictionary for quick lookups and the friend when the meaning matters. Static and contextual embeddings are the dictionary and the friend.",
    },
    engineering: {
      title: "Two embeddings in one recommendation system",
      text: "A news app uses both. Static item embeddings, trained with Word2Vec on reading sessions (each session a sentence, each article a word), power 'readers of this also read' in real time on cheap servers: a lookup and a dot product per request. Contextual sentence embeddings of article text, computed once when an article is published, power 'more like this story' and the search box, where the meaning of the text matters. Each system does what it is good at; the team's write-up noted that trying to do both with contextual embeddings had doubled their serving cost for no gain in the first use case.",
    },
    maths: {
      formula: "static cost per text ≈ tokens × lookup;   contextual cost per text ≈ layers × tokens² × d (attention) + layers × tokens × d² (feed-forward)",
      meaning: "A static embedding costs a lookup per token. A contextual embedding costs a full transformer pass whose cost grows with the number of layers, the square of the token count, and the dimension.",
      worked: [
        "A 100-token document, d = 384, 6 layers (a small sentence-embedding model). Attention ≈ 6 × 100² × 384 ≈ 23 million operations; feed-forward ≈ 6 × 100 × 384² × 8 (the usual expansion) ≈ 708 million. Total about 0.7 billion operations.",
        "Static: 100 lookups and an average: a few thousand operations. Roughly a hundred-thousand-fold difference.",
        "For 10 million documents indexed once, the contextual cost is 7 × 10¹⁵ operations: hours on a GPU, done offline. For 1,000 queries per second, each query is one short contextual pass (fine) plus dot products against stored vectors (cheap).",
      ],
    },
    code: {
      title: "The hybrid: contextual at index time, cheap at query time",
      lang: "py",
      src: `import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

# offline, once per document (the expensive part)
docs = ["early termination penalty", "dismissal of an employee", "contract ending fees", "notice period for staff"]
doc_vecs = model.encode(docs, normalize_embeddings=True)
np.save("doc_vecs.npy", doc_vecs)

# online, per query (one short model pass + a matrix product)
stored = np.load("doc_vecs.npy")
q = model.encode(["fee for ending the agreement early"], normalize_embeddings=True)[0]
scores = stored @ q
for i in np.argsort(-scores)[:2]:
    print(round(float(scores[i]), 2), docs[i])`,
      lines: [
        { code: "doc_vecs = model.encode(docs, normalize_embeddings=True)", say: "The contextual model runs over every document once, offline, in batches. This is where the compute goes." },
        { code: "np.save(\"doc_vecs.npy\", doc_vecs)", say: "The vectors are stored; the model does not run over documents again until they change." },
        { code: "q = model.encode([\"fee for ending the agreement early\"], normalize_embeddings=True)[0]", say: "At query time the model runs once, on a short text." },
        { code: "scores = stored @ q", say: "Everything else is a dot product per document: static-embedding cheap." },
      ],
      output: "0.74 early termination penalty\n0.61 contract ending fees",
      note: "The two termination senses are separated by the contextual vectors; the query path stayed cheap. This pattern is the backbone of Stage 6's retrieval systems.",
    },
    useIt: "Choose static embeddings for word-level tasks, item sequences, and extreme volume; contextual embeddings for anything that depends on meaning in context; and the hybrid (contextual offline, cheap online) for search and retrieval. This decision recurs in Stages 6 and 9.",
    takeaways: ["Static: table lookup, one meaning per word, cheap; contextual: model run, meaning in context, costly.", "Decide by context dependence, volume, latency, item type and available data.", "Search systems use contextual vectors computed offline and dot products online.", "Both remain in use; the choice is structural, not generational."],
    terms: [["static embedding", "a fixed vector per word from a table"], ["contextual embedding", "a per-occurrence vector from a model run"], ["offline / online", "work done ahead of time in batch versus work done per request"]],
    reflect: { q: "A team wants 'similar products' for 50 million items with sub-10-millisecond latency and no GPU at query time. Which embedding approach, and why?", a: "Static item embeddings trained with Word2Vec on purchase or browsing sequences, stored normalised in a vector index. Query time is a lookup and an index search, no model run. Contextual text embeddings of product descriptions could be precomputed too, but the sequence-based static vectors capture 'bought together' behaviour that descriptions do not." },
  },
};

export const M13_QUIZ: Quiz[] = [
  {
    q: "Why can a model using one-hot word vectors not benefit from knowing 'excellent' when it meets 'superb'?",
    options: ["One-hot vectors are too short", "Every pair of different one-hot vectors has dot product zero, so no similarity is expressed", "'superb' is a rare word", "One-hot encoding is only for documents"],
    answer: 1,
    why: ["They are very long.", "Correct. One-hot vectors are all equally far apart; nothing learned about one word transfers to another.", "Rarity is a separate problem.", "It applies to any category, including words."],
    reason: true,
  },
  {
    q: "What does Word2Vec keep after training, and why is the rest discarded?",
    options: ["The prediction network, because it predicts neighbours well", "The input embedding matrix, because the neighbour-prediction task was only a pretext", "The corpus", "The negative samples"],
    answer: 1,
    why: ["Predicting neighbours has no use of its own.", "Correct. The rows the network had to learn are the deliverable; the network is scaffolding.", "The corpus is the input, not the output.", "They are random draws used during training."],
  },
  {
    q: "Which Word2Vec variant gives better vectors for rare words, and why?",
    options: ["CBOW, because it averages contexts", "Skip-gram, because every occurrence yields direct updates to the rare word's own vector", "They are identical", "CBOW, because it is faster"],
    answer: 1,
    why: ["Averaging dilutes the rare word's signal.", "Correct. Skip-gram predicts each neighbour from the centre word, updating its vector per pair.", "They differ in exactly this.", "Speed does not help rare words."],
  },
  {
    q: "GloVe fits vector dot products to the logarithm of co-occurrence counts. What does this make vector differences encode?",
    options: ["Word length", "Ratios of co-occurrence probabilities, which carry meaning (ice/steam with solid/gas)", "Alphabetical order", "Document frequency"],
    answer: 1,
    why: ["No.", "Correct. Log counts turn probability ratios into differences, which is why analogy arithmetic works.", "No.", "That is TF-IDF."],
  },
  {
    q: "A misspelled word never seen in training still gets a sensible vector under FastText because…",
    options: ["FastText memorises typos", "Its vector is the sum of character n-gram vectors, most of which it shares with the correct spelling", "It uses a spell checker", "It has a larger vocabulary"],
    answer: 1,
    why: ["Nothing is memorised about unseen words.", "Correct. Pieces are shared; the typo's pieces overlap the real word's.", "No spell checker is involved.", "Vocabulary size is not the mechanism."],
    reason: true,
  },
  {
    q: "Two embeddings: a = [3, 4] and b = [6, 8]. Their cosine similarity is:",
    options: ["0", "0.5", "1", "Depends on the model"],
    answer: 2,
    why: ["They point the same way.", "No.", "Correct. b is a scaled copy of a; cosine ignores length, so the angle is 0 and the cosine is 1.", "Cosine of two given vectors is just arithmetic."],
  },
  {
    q: "'The delivery was late' and 'The delivery was early' get a high semantic-similarity score. This shows that similarity…",
    options: ["Is broken", "Measures topic relatedness, not agreement of facts", "Depends on word count", "Ignores the word 'delivery'"],
    answer: 1,
    why: ["It is working as designed.", "Correct. Both are about delivery timing; polarity needs a separate check.", "No.", "It uses it heavily."],
  },
  {
    q: "You upgrade the embedding model but leave the document index built with the old one. The likely outcome is:",
    options: ["An error at query time", "Silently meaningless results, because old and new vectors are in unrelated spaces", "Slightly better search", "No change"],
    answer: 1,
    why: ["Dimensions may match; nothing fails loudly.", "Correct. Re-embed everything and switch both sides together; store the model version with the vectors.", "Quality collapses.", "It changes a lot."],
  },
  {
    q: "Which task needs contextual rather than static embeddings?",
    options: ["Finding synonyms of 'cheap'", "Distinguishing 'river bank' from 'bank loan' in search results", "Product-to-product recommendations from baskets", "Counting words"],
    answer: 1,
    why: ["Static word vectors do this well.", "Correct. Only a model that reads the sentence can separate the two senses.", "Static item embeddings fit this best.", "No embeddings needed."],
  },
];

export const M13_EXERCISES: Exercise[] = [
  {
    title: "Cosine similarity by hand",
    kind: "calculate",
    task: "Compute the cosine similarity between a = [1, 2, 2] and b = [2, 1, 2], and between a and c = [−1, 0, 0]. Then normalise a to unit length and verify that a·b computed with unit vectors gives the same cosine.",
    hints: ["‖a‖ = √(1 + 4 + 4) = 3.", "cos = (a·b) ÷ (‖a‖‖b‖)."],
    solution: "a·b = 2 + 2 + 4 = 8; ‖a‖ = 3; ‖b‖ = √(4 + 1 + 4) = 3; cos(a, b) = 8 ÷ 9 ≈ 0.889. a·c = −1; ‖c‖ = 1; cos(a, c) = −1 ÷ 3 ≈ −0.333. Unit a = [1/3, 2/3, 2/3], unit b = [2/3, 1/3, 2/3]; dot = 2/9 + 2/9 + 4/9 = 8/9 ≈ 0.889, the same.",
  },
  {
    title: "Skip-gram pairs and a count table",
    kind: "calculate",
    task: "For the sentence 'cheap hotel near cheap station' with a window of 1, list all skip-gram (centre, context) pairs. Then build the symmetric co-occurrence count table that GloVe would start from, and say which two words have the highest count with 'cheap'.",
    hints: ["Window 1 means one neighbour each side.", "Count each unordered pair once per occurrence for the GloVe table."],
    solution: "Pairs: (cheap, hotel), (hotel, cheap), (hotel, near), (near, hotel), (near, cheap), (cheap, near), (cheap, station), (station, cheap): 8 pairs. Co-occurrence counts: cheap–hotel 1, hotel–near 1, near–cheap 1, cheap–station 1. 'cheap' co-occurs once each with hotel, near and station; no winner in this tiny sentence, which illustrates why embeddings need large corpora.",
  },
  {
    title: "Build a tiny semantic search",
    kind: "code",
    task: "Using sentence-transformers (or averaged GloVe vectors if you prefer), embed 20 short FAQ questions of your choice, normalise them, and write search(query, k) returning the top k by cosine similarity. Test with five paraphrased queries and report how many return the right FAQ at rank 1. Then try truncating the vectors to a quarter of their dimensions and repeat.",
    hints: ["normalize_embeddings=True, then a matrix product.", "Keep the FAQ list and queries in a file so you can rerun."],
    solution: "A working solution embeds the FAQ list once (model.encode with normalisation), stores the matrix, embeds each query, computes scores = matrix @ q, and sorts. Expect 4–5 of 5 paraphrases at rank 1 with full vectors; truncation to a quarter usually keeps 3–5, depending on the model, demonstrating the dimension trade-off. Report both numbers and note any query where the change flipped the result.",
  },
  {
    title: "Static or contextual?",
    kind: "think",
    task: "For each system, say whether you would use static embeddings, contextual embeddings, or the hybrid, and why: (a) autocomplete suggesting the next word on a phone keyboard; (b) grouping 100,000 free-text survey answers by theme; (c) 'customers who bought this also bought' for 5 million products; (d) a legal search engine over contract clauses.",
    hints: ["Ask: does meaning depend on context? What is the volume and latency? Are the items words?"],
    solution: "(a) Static (or a small on-device language model): latency and device limits dominate, context is short. (b) Contextual sentence embeddings computed once, then clustering: meaning of whole answers matters, done offline. (c) Static item embeddings trained on purchase sequences: items are not text, volume is huge, 'bought together' is the signal. (d) Hybrid: contextual embeddings of clauses at index time (disambiguation like 'terminate' matters), dot products at query time, plus keyword search for exact terms.",
  },
];
