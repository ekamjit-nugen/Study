import type { Exercise, LessonBody, Quiz } from "../types";

// Module 15: Attention mechanism. One concept per lesson.
// Running example used across the module: three tokens "The cat sat" with 2-d vectors
// x1 = [1, 0], x2 = [0, 1], x3 = [1, 1], and Q = K = V = X (identity weight matrices), so every number can be checked by hand.

export const M15_BODIES: Record<string, LessonBody> = {
  "m15-limitations-of-traditional-sequence-models": {
    simple: "Older sequence models read text one word at a time and squeeze everything they have read into one memory, so by the end of a long sentence the beginning has faded.",
    concept:
      "Before attention, the standard way to process text was a **recurrent network** (Module 10): read token one, update a memory vector, read token two, update the memory again, and so on to the end. Whatever the model needs from the sentence has to survive inside that one memory vector, which is the same size whether the sentence has five words or five hundred.\n\nThat design has three built-in problems. The memory is a bottleneck: everything about 'The contract, which was signed in Lisbon by the two companies after months of negotiation, expires…' must fit in one fixed list of numbers by the time the model reaches 'expires'. Distance hurts: the gradient that teaches the model to connect 'expires' with 'contract' has to travel back through every step in between, and it shrinks on the way (vanishing gradients, Module 9). And it is slow: step 400 cannot start until step 399 is finished, so a long document cannot use a GPU's thousands of parallel units.\n\nAttention was invented to remove all three at once: let every position look directly at every other position, with no memory bottleneck and no sequential chain.",
    why:
      "Translation systems in the early 2010s were recurrent encoder-decoders: read the whole source sentence into one vector, then write the translation from it. They worked on short sentences and fell apart on long ones; quality dropped measurably after about twenty words, because one vector could not hold a paragraph. Researchers added attention in 2014 so the decoder could look back at every source word while writing each target word, and long-sentence quality jumped. In 2017 the transformer removed the recurrence entirely and kept only attention. Every modern language model descends from that decision, so understanding what recurrence could not do is the clearest way to see what attention is for.",
    how: [
      "A recurrent model processes tokens in order; at each step it combines the new token with its memory vector to make a new memory vector.",
      "The memory vector has a fixed size, so information from early tokens is overwritten or compressed as later tokens arrive.",
      "To learn a long-range link, training must push a gradient back through every intermediate step, and each step multiplies it by a factor usually below one.",
      "Because step t needs step t−1, the whole sequence is processed serially; a thousand-token document means a thousand dependent steps.",
      "Attention replaces the chain with direct lookups: each token computes how relevant every other token is and reads from them in one parallel operation.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Recurrent reading", points: ["One token per step, in order", "Everything squeezed into one memory vector", "Far-apart words connect only through many steps", "Cannot run positions in parallel"] },
      right: { title: "Attention reading", points: ["All tokens visible at once", "Each token keeps its own vector", "Any two words connect in one hop", "Every position computed in parallel on a GPU"] },
      caption: "The right-hand column is what the rest of this module builds.",
    },
    everyday: {
      title: "Taking a phone message without a notepad",
      text: "Someone dictates a long message and you are not allowed to write anything down. By the time they reach the end you remember the last few details clearly and the first ones vaguely: the name of the street has gone, the time has blurred. That is a fixed-size memory being overwritten. Attention is being handed the whole message on paper so you can glance back at any line while you reply.",
    },
    engineering: {
      title: "Machine translation hitting the twenty-word wall",
      text: "A translation team in 2014 measured their recurrent encoder-decoder on sentences grouped by length. Up to fifteen words, quality was good. Past twenty, it dropped steadily, and past forty the output often lost whole clauses, because the encoder's single vector could not carry them. Adding an attention layer that let the decoder consult every source word directly made the curve flat: forty-word sentences translated nearly as well as ten-word ones. The same experiment, repeated today with a transformer, shows no length wall until the context window itself runs out.",
    },
    maths: {
      formula: "h_t = f(W·h_{t−1} + U·x_t)   and   ∂L/∂h_1 = ∂L/∂h_T · ∏ (∂h_t/∂h_{t−1})",
      meaning: "Each memory h_t is made from the previous memory and the new token. The gradient reaching the first step is a product of one factor per step; if each factor is below one the product vanishes.",
      worked: [
        "Suppose each step's factor is 0.8 and the sentence has 10 tokens: the gradient reaching token 1 is scaled by 0.8¹⁰ ≈ 0.11.",
        "At 50 tokens: 0.8⁵⁰ ≈ 0.00001. The first word effectively cannot be learned from the last word's error.",
        "With attention there is no product of steps: the first and last token connect through one weight, so the gradient is scaled by that single factor.",
      ],
    },
    code: {
      title: "A recurrent read versus a direct look-back",
      lang: "py",
      src: `import numpy as np

tokens = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # "The", "cat", "sat"

# Recurrent: one memory vector, updated per token
memory = np.zeros(2)
W = 0.5 * np.eye(2)
for x in tokens:
    memory = np.tanh(W @ memory + x)       # earlier tokens fade through W each step
print(memory.round(2))                      # one vector for the whole sentence

# Attention-style: the last token looks directly at every token
query = tokens[2]
scores = tokens @ query                     # one dot product per earlier token
print(scores)                               # [1. 1. 2.]: direct links, no chain`,
      lines: [
        { code: "memory = np.tanh(W @ memory + x)       # earlier tokens fade through W each step", say: "The recurrent update: the old memory is multiplied by W every step, so 'The' is scaled down twice before 'sat' is read." },
        { code: "print(memory.round(2))                      # one vector for the whole sentence", say: "Whatever the model knows about the sentence lives in these two numbers." },
        { code: "scores = tokens @ query                     # one dot product per earlier token", say: "The attention idea: the current token compares itself with every token directly. No chain, no fading." },
      ],
      output: "[0.81 0.83]\n[1. 1. 2.]",
      note: "The second approach is the seed of the whole module: compare, weigh, read.",
    },
    useIt: "You will rarely build a recurrent model now, but you will meet their limits in disguise: a pipeline that summarises a document by feeding it through a fixed-size summary, or a chat memory that compresses history into one paragraph (Stage 7), has the same bottleneck. Recognising it tells you when to give the model direct access to the source instead.",
    takeaways: ["Recurrent models read in order and keep one fixed-size memory; long inputs overflow it.", "Gradients across many steps vanish, so distant words are hard to connect.", "Serial steps cannot use a GPU's parallelism.", "Attention gives every token a direct look at every other token, in parallel."],
    terms: [["recurrent network", "a model that reads a sequence one step at a time, carrying a memory vector forward"], ["bottleneck", "a fixed-size vector that everything about the input must pass through"]],
    reflect: { q: "A recurrent model translates 'The keys that I left on the table yesterday are gone' and renders 'are' as singular. Which limitation is showing?", a: "The link between 'keys' (plural) and 'are' spans eight tokens; the memory holding 'keys' has been overwritten by 'table' and 'yesterday'. Attention would let 'are' look straight at 'keys'." },
  },

  "m15-attention": {
    simple: "Attention lets each token compute how relevant every other token is and read a weighted mix of them, so the model focuses on what matters for the next prediction.",
    concept:
      "**Attention** is a way for one position in a sequence to gather information from all the others, weighted by relevance. For the token 'it' in 'The cat sat on the mat because it was tired', the model needs 'cat' far more than 'mat'. Attention computes a score between 'it' and every other token, turns the scores into weights that add up to one, and produces a new vector for 'it' that is mostly 'cat' with a little of everything else.\n\nThe three steps are always the same: compare (a score for each pair), normalise (scores become weights via softmax, Module 7), and mix (a weighted sum of the other tokens' vectors). The scores are learned, not hand-written: training adjusts the comparison so that useful tokens score high.\n\nEverything in this module is a refinement of those three steps: what exactly is compared (queries and keys), what is mixed (values), how to keep the scores well behaved (scaling), how to stop a token from peeking at the future (masks), and how to look for several things at once (heads).",
    why:
      "A sentence is not a bag of words and not a chain either; it is a web of links. The verb agrees with a subject that may be ten words back; a pronoun points at a noun two sentences earlier; the word 'bank' means something different next to 'river' than next to 'loan'. A model that predicts the next token well must follow those links. Attention exists to make the links explicit and learnable: for every token, which other tokens should shape its meaning right now? Because it is a weighted sum, the model can blend several sources, and because the weights are computed fresh for every input, the same model handles any sentence structure without being told it in advance.",
    how: [
      "Take the vector of the token that is 'looking' (for now, its embedding from Module 13).",
      "Compare it with the vector of every token in the sequence to get one score per token; higher means more relevant.",
      "Apply softmax to the scores so they become weights between 0 and 1 that sum to 1.",
      "Multiply every token's vector by its weight and add them up: that sum is the output for the looking token.",
      "Do this for every token at once, so each position gets its own context-aware vector.",
    ],
    visual: {
      kind: "flow",
      steps: ["token 'sat' looks at [The, cat, sat]", "scores: 1, 1, 2", "softmax → weights 0.25, 0.25, 0.50", "weighted sum of the three vectors", "new vector for 'sat' = [0.75, 0.75]"],
      caption: "Compare, normalise, mix. The numbers come from the module's running example and are worked through in the next lessons.",
    },
    everyday: {
      title: "Reading a recipe while cooking",
      text: "When the recipe says 'add it now', your eyes jump back to the ingredient list to find what 'it' is, skim past the steps you have done, and land on 'the onion mixture'. You did not re-read the whole page; you weighted the parts by relevance and pulled one phrase forward. Attention does that for every word, every time it predicts the next one.",
    },
    engineering: {
      title: "Pronoun resolution in a support assistant",
      text: "A customer writes: 'I ordered the lamp and the rug last week. The rug arrived damaged. Can I return it?' A keyword system cannot tell what 'it' is. An attention-based model, when processing 'it', assigns most of its weight to 'rug' (recent, damaged) and little to 'lamp'. Engineers can inspect those weights to debug a wrong answer: if the model replied about the lamp, the attention map usually shows the mistake, which is one reason attention-based models are easier to probe than the recurrent ones they replaced.",
    },
    maths: {
      formula: "output_i = Σ_j weight_ij · x_j,   where weight_ij = softmax_j(score_ij)",
      meaning: "Token i's new vector is a weighted sum over all tokens j; the weights are the normalised scores between i and j.",
      worked: [
        "Running example: x1 = [1, 0] (The), x2 = [0, 1] (cat), x3 = [1, 1] (sat). Token 3 looks at all three.",
        "Scores by dot product with x3: x1·x3 = 1, x2·x3 = 1, x3·x3 = 2.",
        "Softmax of [1, 1, 2]: e¹ = 2.72, e¹ = 2.72, e² = 7.39; total 12.83; weights 0.21, 0.21, 0.58.",
        "Output = 0.21·[1, 0] + 0.21·[0, 1] + 0.58·[1, 1] = [0.79, 0.79]. 'sat' now carries mostly itself plus a share of 'The' and 'cat'.",
      ],
      note: "The next lessons refine this: separate projections for comparing and mixing, and scaling the scores before softmax.",
    },
    code: {
      title: "Attention in six lines",
      lang: "py",
      src: `import numpy as np

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # The, cat, sat

def softmax(s):
    e = np.exp(s - s.max())
    return e / e.sum()

scores = X @ X[2]                 # how relevant is each token to 'sat'?
weights = softmax(scores)         # normalise to a distribution
output = weights @ X              # weighted mix of all token vectors
print(scores, weights.round(2), output.round(2))`,
      lines: [
        { code: "scores = X @ X[2]                 # how relevant is each token to 'sat'?", say: "Compare: a dot product between the looking token and every token." },
        { code: "weights = softmax(scores)         # normalise to a distribution", say: "Normalise: softmax turns [1, 1, 2] into [0.21, 0.21, 0.58]." },
        { code: "output = weights @ X              # weighted mix of all token vectors", say: "Mix: the new vector for 'sat' is the weighted sum of the three rows." },
      ],
      output: "[1. 1. 2.] [0.21 0.21 0.58] [0.79 0.79]",
    },
    useIt: "Attention is inside every model you will call through an API, every embedding model you will use for search, and every vision model that reads images as patches. You will also use the idea directly when designing retrieval (Stage 6): choose what to put in front of the model so that attention has the right things to weigh.",
    takeaways: ["Attention = compare, normalise, mix: scores, softmax weights, weighted sum.", "Every token gets a context-aware vector built from the tokens that matter to it.", "The comparison is learned, so relevance is whatever helps prediction.", "It runs for all positions at once, in parallel."],
    terms: [["attention", "a learned, weighted lookup from one token to all others"], ["attention weight", "the normalised share of one token's output that comes from another token"]],
    reflect: { q: "If every weight were equal, what would attention compute?", a: "The plain average of all token vectors, the same for every position, which is a bag of words. Attention is useful exactly because the weights differ by token and by context." },
  },

  "m15-query-key-and-value": {
    simple: "Each token is turned into three vectors: a query (what I am looking for), a key (what I offer to be found by) and a value (what I pass on if chosen).",
    concept:
      "Comparing raw embeddings with each other, as the last lesson did, forces one vector to play two roles: being the thing that searches and the thing being searched. Attention separates the roles with three learned projections. From each token's vector x the model computes a **query** q = x·W_Q, a **key** k = x·W_K and a **value** v = x·W_V, where W_Q, W_K and W_V are weight matrices learned in training.\n\nThe query is the question the token is asking ('I am a pronoun; who is my noun?'). The key is how a token advertises itself ('I am a singular noun, recently mentioned'). Scores are query-dot-key, so a token scores high with the tokens whose keys match its query. The value is what gets mixed into the output once a token is chosen; it can carry different information from the key, because being findable and being useful are different jobs.\n\nWith Q = K = V = X (the identity projections of the running example) the maths is the same as the last lesson. Real models learn three different matrices, which is what lets 'it' find 'cat' even though their raw embeddings are nothing alike.",
    why:
      "Without separate projections, a token can only attend to tokens that look like itself, because a dot product of similar vectors is high. But the words a token needs are usually different from it: a verb needs its subject, a pronoun needs a noun, 'bank' needs 'river'. Queries and keys let the model learn a matching rule between different kinds of tokens. Values exist because what you want to read from a token is not the same as what made it findable: the key for 'cat' might encode 'singular animal noun' while its value carries the richer meaning used to shape 'it'. Three roles, three matrices, and all of them learned from data.",
    how: [
      "Start with the token vectors X (one row per token, dimension d).",
      "Multiply by three learned matrices: Q = X·W_Q, K = X·W_K, V = X·W_V. Each is a table with one row per token.",
      "Scores are the dot products of queries with keys: token i's query against every token j's key.",
      "Softmax the scores per query to get weights; multiply the weights by the value rows and sum.",
      "Training adjusts W_Q, W_K and W_V so that queries find the keys whose values help prediction.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Role", "Made from", "Used for", "Analogy"],
        rows: [
          ["query q", "x · W_Q", "scoring against keys", "the search phrase you type"],
          ["key k", "x · W_K", "being scored by queries", "the title of a document"],
          ["value v", "x · W_V", "what is mixed into the output", "the document's content"],
        ],
      },
      caption: "Three projections of the same token, each learned for its own job.",
    },
    everyday: {
      title: "A library catalogue",
      text: "You search a catalogue with a phrase (the query). Each book has a short catalogue entry written to be found (the key). When an entry matches your phrase you take the book itself off the shelf (the value). The entry and the book are different things: the entry is tuned for matching, the book for reading. If the catalogue were just the books' full text, matching would be slow and noisy.",
    },
    engineering: {
      title: "Debugging a chatbot that confuses two dates",
      text: "A model keeps answering 'When does the warranty end?' with the purchase date instead of the expiry date. Inspecting the learned projections shows the query for 'end' matches keys for any date-like token almost equally; the key projection has not learned to distinguish 'purchased on' from 'valid until'. The fix was more training examples with both dates present, after which the key for the expiry date encoded its 'until' context and the query found it. Knowing that matching lives in W_Q and W_K told the team where to look and what data to add.",
    },
    maths: {
      formula: "q_i = x_i·W_Q,   k_j = x_j·W_K,   v_j = x_j·W_V,   score_ij = q_i · k_j",
      meaning: "Each token gets three vectors by multiplying its embedding by three learned matrices; a score compares one token's query with another's key.",
      worked: [
        "Let d = 2, W_Q = W_K = identity, and W_V = [[1, 0], [0, 2]] (doubles the second coordinate).",
        "For x2 = [0, 1] (cat): q2 = [0, 1], k2 = [0, 1], v2 = [0, 2].",
        "For x3 = [1, 1] (sat): q3 = [1, 1], k3 = [1, 1], v3 = [1, 2].",
        "Score of sat's query against cat's key: q3·k2 = 1·0 + 1·1 = 1. Score against its own key: q3·k3 = 2.",
        "If sat attends fully to cat it would read cat's value [0, 2], not cat's key [0, 1]: the value is what flows forward.",
      ],
    },
    code: {
      title: "Three projections from one token",
      lang: "py",
      src: `import numpy as np

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # The, cat, sat
W_Q = np.eye(2)
W_K = np.eye(2)
W_V = np.array([[1.0, 0.0], [0.0, 2.0]])            # values carry a different emphasis

Q = X @ W_Q      # one query per token
K = X @ W_K      # one key per token
V = X @ W_V      # one value per token

scores = Q @ K.T                                     # every query against every key
print(scores)
print(V)`,
      lines: [
        { code: "W_V = np.array([[1.0, 0.0], [0.0, 2.0]])            # values carry a different emphasis", say: "A value matrix that differs from the key matrix: what is read can differ from what is matched." },
        { code: "Q = X @ W_Q      # one query per token", say: "Each row of Q is one token's question." },
        { code: "scores = Q @ K.T                                     # every query against every key", say: "A 3×3 table: row i is token i's query scored against all three keys." },
      ],
      output: "[[1. 0. 1.]\n [0. 1. 1.]\n [1. 1. 2.]]\n[[1. 0.]\n [0. 2.]\n [1. 2.]]",
    },
    useIt: "Queries, keys and values are the vocabulary of every discussion about attention: the KV cache that makes generation fast (Module 40) stores keys and values; retrieval systems (Stage 6) are query-against-key search at document scale; and cross-attention (later in this module) is simply queries from one sequence against keys and values from another.",
    takeaways: ["Three learned projections per token: query (asks), key (is found), value (is read).", "Scores are query·key; outputs are weighted sums of values.", "Separating the roles lets different kinds of tokens find each other.", "All three matrices are learned from data."],
    terms: [["query", "the vector a token uses to search the others"], ["key", "the vector a token exposes to be matched against"], ["value", "the vector a token contributes to outputs when selected"], ["projection", "multiplying a vector by a learned matrix to get a new vector"]],
    reflect: { q: "Why not reuse the key as the value and save a matrix?", a: "Because the best vector for being matched (compact, discriminative) is rarely the best vector for carrying meaning forward. Some efficient models do share them, and they pay a small quality cost for it." },
  },

  "m15-attention-scores": {
    simple: "An attention score is one number per pair of tokens, the dot product of a query and a key, saying how strongly one token should attend to another before normalisation.",
    concept:
      "An **attention score** measures the match between one token's query and another token's key. It is computed as a dot product (Module 3): multiply the two vectors position by position and add up. A large positive score means the key points in the same direction as the query, which the model has learned to mean 'relevant'; a score near zero means unrelated; a negative score means actively unlike.\n\nFor a sequence of n tokens there are n×n scores, laid out as a matrix: row i holds token i's query scored against every key. In the running example the matrix is [[1, 0, 1], [0, 1, 1], [1, 1, 2]]. Row 3 says 'sat' matches 'The' with 1, 'cat' with 1 and itself with 2.\n\nScores are raw: they can be any size and do not add up to anything. They become usable weights only after scaling and softmax, which the next two lessons cover. But the scores are where the model's judgement lives, because the learned matrices W_Q and W_K decide which pairs score high.",
    why:
      "The model needs a way to express 'how much' rather than just 'whether' two tokens relate, and it needs it for every pair at once so that no link is impossible. A matrix of dot products gives exactly that: n² numbers from one matrix multiplication, which GPUs do extremely fast. The dot product is the right comparison because it rewards vectors that agree in many coordinates at once; training can then shape queries and keys so that agreement encodes any relation it finds useful, from grammatical agreement to topic similarity to 'this is the token right before me'.",
    how: [
      "Compute Q and K from the token vectors (previous lesson).",
      "For each pair (i, j), take the dot product q_i · k_j: multiply coordinate by coordinate and sum.",
      "Arrange the results as an n×n matrix S = Q·Kᵀ; row i is query i, column j is key j.",
      "Read the matrix: large entries are strong matches, zeros are indifference, negatives are mismatches.",
      "Pass the matrix on to scaling and softmax, one row at a time.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["query ↓ / key →", "The [1,0]", "cat [0,1]", "sat [1,1]"],
        rows: [
          ["The [1,0]", "1", "0", "1"],
          ["cat [0,1]", "0", "1", "1"],
          ["sat [1,1]", "1", "1", "2"],
        ],
      },
      caption: "The score matrix S = Q·Kᵀ for the running example. Row 'sat' is used in the next lessons.",
    },
    everyday: {
      title: "Matching a shopping list to shelf labels",
      text: "You walk down an aisle with a list that says 'something crunchy, salty, for a party'. Each shelf label gives a few properties of what sits there. Crisps score high on all three, bread on one, bananas on none. You have not picked anything yet; you have just given every shelf a number. That number is an attention score, and the dot product is the counting of matched properties.",
    },
    engineering: {
      title: "Reading an attention-score heat map to explain a translation error",
      text: "A translation team noticed 'she' in a target sentence where the source said 'he'. They dumped the score matrix for that decoding step: the query for the pronoun scored 3.1 against the key for a nearby feminine noun and only 1.4 against the actual antecedent, which was farther back. The scores pinpointed that the model had learned 'prefer the nearest noun' more strongly than 'prefer the agreeing noun'. Targeted training examples with distant antecedents raised the second score above the first. Scores are the first thing engineers look at when attention goes wrong.",
    },
    maths: {
      formula: "score_ij = q_i · k_j = Σ_m q_i[m] · k_j[m]",
      meaning: "Multiply matching coordinates of the query and key and sum them. With d coordinates there are d multiplications per pair.",
      worked: [
        "q_sat = [1, 1], k_The = [1, 0]: 1·1 + 1·0 = 1.",
        "q_sat = [1, 1], k_cat = [0, 1]: 1·0 + 1·1 = 1.",
        "q_sat = [1, 1], k_sat = [1, 1]: 1·1 + 1·1 = 2.",
        "Row for 'sat' is [1, 1, 2]. With a real model, d is 64 or 128 per head and the sums have that many terms.",
      ],
    },
    code: {
      title: "The score matrix as one matrix multiply",
      lang: "py",
      src: `import numpy as np

Q = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # queries for The, cat, sat
K = Q.copy()                                         # keys (identity projection)

S = Q @ K.T            # n x n scores: S[i, j] = q_i . k_j
print(S)
print(S[2])            # how 'sat' scores every token`,
      lines: [
        { code: "S = Q @ K.T            # n x n scores: S[i, j] = q_i . k_j", say: "All nine dot products in one operation. For 1,000 tokens that is a million scores, still one multiply on a GPU." },
        { code: "print(S[2])            # how 'sat' scores every token", say: "Row 3 is [1, 1, 2]: the raw judgement before normalisation." },
      ],
      output: "[[1. 0. 1.]\n [0. 1. 1.]\n [1. 1. 2.]]\n[1. 1. 2.]",
    },
    useIt: "You will see score matrices as heat maps in model-debugging tools and papers, and you will compute dot-product scores yourself when ranking documents against a query in retrieval (Stage 6), where the same operation is called similarity. Knowing that n tokens means n² scores also explains why long contexts are expensive (Module 40).",
    takeaways: ["A score is a query·key dot product: one number per token pair.", "n tokens give an n×n score matrix from one matrix multiply.", "Scores are raw and unnormalised; they encode the model's learned judgement of relevance.", "Scaling and softmax turn them into weights."],
    terms: [["attention score", "the raw query·key dot product for one token pair"], ["score matrix", "the n×n table of all pairwise scores, S = Q·Kᵀ"]],
    reflect: { q: "Doubling the length of the input does what to the number of scores?", a: "Quadruples it: n² grows four times when n doubles. This is why context length has a real cost and why Module 40 spends a lesson on attention efficiency." },
  },

  "m15-scaled-dot-product-attention": {
    simple: "Dividing the scores by the square root of the key size keeps them in a range where softmax still spreads its weights, instead of collapsing onto one token.",
    concept:
      "**Scaled dot-product attention** is the standard formula: Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V. The only new ingredient is the division by √d_k, where d_k is the length of the key vectors.\n\nThe reason is size. A dot product adds d_k terms, so with longer vectors the scores get larger in magnitude just because there are more terms, not because the match is stronger. With d_k = 64 and ordinary-sized entries, scores of 8 or 12 are common. Softmax of large numbers is almost a hard choice: one weight near 1, the rest near 0. The model would then attend to a single token, and the gradient through softmax would be nearly zero, so training stalls. Dividing by √d_k brings the scores back to roughly unit scale, keeping softmax soft and the gradients alive.\n\nWhy the square root exactly: if query and key entries are independent with variance 1, the dot product has variance d_k, so its standard deviation is √d_k. Dividing by that gives variance 1 whatever d_k is.",
    why:
      "The transformer paper reported that without the scaling, attention with large d_k trained noticeably worse. The mechanism is the softmax saturation from Module 7: when inputs differ by many units, the outputs are all but one-hot, and the derivative of softmax at those points is tiny. Tiny derivatives mean tiny gradients to W_Q and W_K, so the model cannot improve what it attends to. A single division fixes it, which is why every implementation includes it and why the function is named after it.",
    how: [
      "Compute the score matrix S = Q·Kᵀ as before.",
      "Divide every entry by √d_k, the square root of the key dimension.",
      "Apply softmax to each row to obtain weights.",
      "Multiply the weights by V to produce outputs.",
      "During training, gradients flow back through a softmax that is not saturated, so queries and keys keep learning.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Unscaled, d_k = 64, scores [8, 4]", points: ["softmax → [0.98, 0.02]", "nearly one-hot", "gradient through softmax ≈ 0", "model cannot adjust what it attends to"] },
      right: { title: "Scaled by √64 = 8, scores [1, 0.5]", points: ["softmax → [0.62, 0.38]", "a genuine blend", "healthy gradient", "both tokens keep influencing the output"] },
      caption: "Same scores, one division. The right column is what training needs.",
    },
    everyday: {
      title: "Grading on a curve",
      text: "Two exams: one marked out of 10, one out of 1,000. A 2-point gap on the first is a real difference; on the second it is noise. If you ranked students by raw gaps you would overreact to the big-exam numbers. Dividing by a scale that depends on the exam's size puts the gaps on one footing. Attention scores from long vectors are the 1,000-point exam; √d_k is the curve.",
    },
    engineering: {
      title: "A training run that would not learn",
      text: "An engineer prototyping a small transformer for log-line classification dropped the √d_k term to simplify the code. Loss fell for a few hundred steps and then flattened far above the baseline. Attention maps showed every head locked onto one token per row from early on. Restoring the division made the maps softer, gradients to the attention matrices grew by orders of magnitude, and the model matched the baseline. The whole fix was one character in a line of code, and the symptom, frozen one-hot attention, is now the first thing they check.",
    },
    maths: {
      formula: "Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V",
      meaning: "Scores divided by the square root of the key length, softmaxed row by row, then used to weight the values.",
      worked: [
        "Running example, d_k = 2, so √d_k = 1.414. Row for 'sat': [1, 1, 2] ÷ 1.414 = [0.71, 0.71, 1.41].",
        "Softmax: e^0.71 = 2.03, e^0.71 = 2.03, e^1.41 = 4.10; total 8.16; weights [0.25, 0.25, 0.50].",
        "Compare with unscaled weights from two lessons ago, [0.21, 0.21, 0.58]: scaling spread the weights slightly.",
        "A bigger case: d_k = 64, raw scores [8, 4]. Unscaled softmax: e⁸ = 2981, e⁴ = 54.6 → [0.98, 0.02]. Scaled by 8: [1, 0.5] → e¹ = 2.72, e^0.5 = 1.65 → [0.62, 0.38].",
        "Output for 'sat' (V = X): 0.25·[1, 0] + 0.25·[0, 1] + 0.50·[1, 1] = [0.75, 0.75].",
      ],
    },
    code: {
      title: "The complete function",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d_k = K.shape[1]
    S = Q @ K.T / np.sqrt(d_k)        # scaled scores
    W = softmax_rows(S)               # one distribution per query
    return W @ V, W

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # The, cat, sat
out, W = attention(X, X, X)
print(W.round(2))
print(out.round(2))`,
      lines: [
        { code: "S = Q @ K.T / np.sqrt(d_k)        # scaled scores", say: "The division by √d_k. With d_k = 2 it is 1.414; with 64 it is 8." },
        { code: "W = softmax_rows(S)               # one distribution per query", say: "Each row becomes weights that sum to 1. Row 3 is [0.25, 0.25, 0.50]." },
        { code: "return W @ V, W", say: "Weights times values gives the outputs; the weights are returned too, so they can be inspected." },
      ],
      output: "[[0.5  0.19 0.31]\n [0.19 0.5  0.31]\n [0.25 0.25 0.5 ]]\n[[0.81 0.5 ]\n [0.5  0.81]\n [0.75 0.75]]",
      note: "This function, with masks and multiple heads added, is the core of every transformer.",
    },
    useIt: "You will not usually write this function in production, but you will read it in every framework and paper, and the scaling explains behaviour you will meet later: why attention becomes sharper in some layers, and why some long-context tricks adjust the temperature of attention. In interviews, 'why √d_k?' is a standard question.",
    takeaways: ["Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V.", "Dot products grow with vector length; √d_k brings them back to unit scale.", "Without scaling, softmax saturates and gradients vanish.", "The running example gives weights [0.25, 0.25, 0.50] and output [0.75, 0.75] for 'sat'."],
    terms: [["d_k", "the dimension (length) of the key vectors"], ["scaling", "dividing scores by √d_k so their size does not depend on vector length"]],
    reflect: { q: "Would dividing by d_k instead of √d_k also work?", a: "It would keep scores small, but too small: for large d_k the scores would all be near zero, softmax would become almost uniform, and attention could not focus. √d_k is the value that makes the variance exactly 1." },
  },

  "m15-softmax-in-attention": {
    simple: "Softmax turns a row of raw scores into weights between 0 and 1 that add up to 1, exaggerating the gaps so the best matches dominate without excluding the rest.",
    concept:
      "The **softmax** function from Module 7 is reused here for a different purpose. There it converted a network's final scores into class probabilities. In attention it converts one token's row of scores into a probability distribution over the other tokens: how much of each to read.\n\nSoftmax does two things. It exponentiates every score, so differences become ratios: a score 1 unit higher gets e ≈ 2.72 times the weight. Then it divides by the sum, so the weights add up to 1. The result is never exactly zero, so no token is completely ignored, and never exactly 1, so no token is the whole output. How sharp the distribution is depends on how spread out the scores are, which is exactly why the previous lesson scaled them.\n\nApplied row by row, softmax gives each query its own distribution. The matrix of these distributions is what people mean by 'the attention weights' or 'the attention map'.",
    why:
      "Raw scores could be used as weights directly, but they can be negative or huge, and their sum varies, so the output's size would swing with the input. The model needs weights that are positive and sum to one, so that the output is a genuine average of values and stays on the same scale as the inputs. Softmax provides that, and its exponential shape adds a useful property: it amplifies the strongest matches while keeping a small share for everything else, which lets the model commit to 'cat' for 'it' without losing the rest of the sentence.",
    how: [
      "Take one row of scaled scores, one number per key.",
      "Subtract the row's maximum from every entry (this changes nothing in the result but prevents overflow when exponentiating).",
      "Exponentiate every entry: e to the power of the score.",
      "Divide each exponentiated entry by the sum of all of them in the row.",
      "The row now holds positive weights summing to 1; repeat for every row.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Scaled scores for 'sat'", detail: "[0.71, 0.71, 1.41]" },
        { label: "Exponentiate", detail: "[2.03, 2.03, 4.10]" },
        { label: "Sum", detail: "8.16" },
        { label: "Divide", detail: "[0.25, 0.25, 0.50]: weights that add up to 1" },
      ],
      caption: "The exponentials double the gap between 0.71 and 1.41; the division makes it a share.",
    },
    everyday: {
      title: "Splitting attention at a dinner party",
      text: "At a table of six you do not listen to one person exclusively or to all equally. You give most of your attention to the person telling the story, some to the friend who interjects, and a little to the rest so you notice if your name comes up. Your attention adds up to one: more for one person means less for others. Softmax formalises that split from the scores.",
    },
    engineering: {
      title: "Numerical overflow in a home-made attention layer",
      text: "A team implemented attention from scratch for an on-device model and saw NaN outputs on long inputs. The scores reached 90 in places, and e⁹⁰ overflows 32-bit floating point. The standard fix, subtracting the row maximum before exponentiating, gives identical weights (the subtraction cancels in the division) and keeps every exponent at or below zero. Every framework does this silently; writing your own attention is how you learn why.",
    },
    maths: {
      formula: "weight_j = e^{s_j} / Σ_m e^{s_m}",
      meaning: "Each weight is its own exponentiated score divided by the sum of all exponentiated scores in the row.",
      worked: [
        "Scaled scores for 'sat': [0.71, 0.71, 1.41].",
        "Exponentials: e^0.71 = 2.03, e^0.71 = 2.03, e^1.41 = 4.10. Sum = 8.16.",
        "Weights: 2.03/8.16 = 0.25, 0.25, 4.10/8.16 = 0.50. Sum check: 1.00.",
        "Subtracting the maximum first: [−0.70, −0.70, 0] → e: [0.50, 0.50, 1.00], sum 2.00 → [0.25, 0.25, 0.50]. Identical, with no large exponents.",
      ],
    },
    code: {
      title: "Row-wise softmax, numerically safe",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    shifted = S - S.max(axis=1, keepdims=True)   # largest entry per row becomes 0
    e = np.exp(shifted)
    return e / e.sum(axis=1, keepdims=True)

S = np.array([[0.71, 0.71, 1.41],
              [90.0, 0.0, 0.0]])                 # a row that would overflow without the shift
print(softmax_rows(S).round(3))`,
      lines: [
        { code: "shifted = S - S.max(axis=1, keepdims=True)   # largest entry per row becomes 0", say: "The shift. The weights come out identical, and no exponent exceeds e⁰ = 1." },
        { code: "e = np.exp(shifted)", say: "Exponentiate: differences become ratios." },
        { code: "return e / e.sum(axis=1, keepdims=True)", say: "Divide by the row sum so each row adds up to 1." },
      ],
      output: "[[0.25  0.25  0.5  ]\n [1.    0.    0.   ]]",
    },
    useIt: "You will read attention maps that are softmax outputs, and you will meet softmax again at the model's output layer where it produces next-token probabilities (Module 18). The same saturation and overflow issues recur there, and temperature, the dial you will use most in API calls, is a division applied just before this function.",
    takeaways: ["Softmax turns a row of scores into positive weights that sum to 1.", "Exponentiation turns score differences into ratios: +1 score ≈ ×2.72 weight.", "Nothing gets exactly zero, so no token is fully ignored.", "Subtract the row maximum first to avoid overflow; the result is unchanged."],
    terms: [["attention map", "the matrix of softmax weights, one row per query"], ["overflow", "a number too large for the computer's floating-point format, producing infinity or NaN"]],
    reflect: { q: "Two keys score 3 and 1. What is the ratio of their weights, regardless of the other keys?", a: "e² ≈ 7.4 to 1. Softmax ratios depend only on score differences, which is why scaling the scores changes how sharp the distribution is." },
  },

  "m15-attention-weights": {
    simple: "Attention weights are the softmax outputs: for each token, the share of its output that comes from every other token. They are what the model 'looked at', and you can read them.",
    concept:
      "**Attention weights** are the final, normalised numbers that decide the mix. For token i, the weight w_ij says what fraction of i's new vector comes from token j's value. Weights are non-negative and sum to 1 across j, so the output is a weighted average of value vectors. The full set is an n×n matrix, usually drawn as a heat map with queries down the side and keys along the top.\n\nTwo readings of the weights are useful. Per row: 'what did this token attend to?' For 'it' you hope to see most weight on the noun it refers to. Per column: 'which tokens were attended to by everyone?' Often a few tokens, such as the first token or punctuation, collect weight from many rows; they act as a default to lean on when nothing specific matters.\n\nWeights are not the model's full reasoning, since values and later layers transform what is read, but they are the most interpretable part of a transformer, and they are the quantity the next lessons manipulate with masks and split across heads.",
    why:
      "A model that learned to predict well but could not be inspected would be hard to trust or debug. Weights give engineers a window: a wrong answer can often be traced to the wrong token receiving the weight. They also matter for efficiency work, because attention weights that are nearly all zero suggest the computation could be sparse, and for the KV cache (Module 40), which exists because past keys and values are reused by every new query's weights.",
    how: [
      "Compute scaled scores and softmax them row by row to get the weight matrix W.",
      "Multiply W by V: output_i = Σ_j w_ij · v_j.",
      "To inspect, pick a query row and sort the weights; the top entries are what that token used.",
      "To find 'attention sinks', sum each column; a tall column is a token many queries lean on.",
      "Remember that weights change with every input and every layer and head; they are a snapshot, not a rule.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["query ↓ / key →", "The", "cat", "sat", "row sum"],
        rows: [
          ["The", "0.50", "0.19", "0.31", "1.00"],
          ["cat", "0.19", "0.50", "0.31", "1.00"],
          ["sat", "0.25", "0.25", "0.50", "1.00"],
        ],
      },
      caption: "The weight matrix for the running example, computed by the scaled-attention code two lessons ago. Every row sums to 1.",
    },
    everyday: {
      title: "A budget pie chart",
      text: "A household budget says 50% rent, 25% food, 25% everything else. It is a set of shares that add to the whole, and it tells you at a glance what dominates. A row of attention weights is the same pie: what share of this token's new meaning comes from each other token. Reading the chart does not tell you what was bought, only where the money went; weights tell you where the attention went, not what the values contained.",
    },
    engineering: {
      title: "Finding why a summariser kept quoting the title",
      text: "A document summariser produced summaries that repeated the headline almost verbatim. Column sums of the attention weights across layers showed the title tokens receiving far more weight than any body sentence, from nearly every query. The cause was in the training data: summaries in the corpus often began with the title, so the model learned to lean on it. The team rebalanced the training set and added examples whose summaries did not copy titles; afterwards the column sums spread across the body and the summaries improved. The weights did not fix the problem, but they showed exactly where it was.",
    },
    maths: {
      formula: "output_i = Σ_j w_ij · v_j,   with w_ij ≥ 0 and Σ_j w_ij = 1",
      meaning: "Each output is a convex combination of the value vectors: a weighted average that stays within the span of the values.",
      worked: [
        "Row for 'sat': w = [0.25, 0.25, 0.50]; values (V = X): v1 = [1, 0], v2 = [0, 1], v3 = [1, 1].",
        "output = 0.25·[1, 0] + 0.25·[0, 1] + 0.50·[1, 1] = [0.25 + 0.50, 0.25 + 0.50] = [0.75, 0.75].",
        "Column sums of the weight matrix above: The = 0.94, cat = 0.94, sat = 1.12. 'sat' is attended to slightly more overall.",
      ],
    },
    code: {
      title: "Reading the weights",
      lang: "py",
      src: `import numpy as np

tokens = ["The", "cat", "sat"]
W = np.array([[0.50, 0.19, 0.31],
              [0.19, 0.50, 0.31],
              [0.25, 0.25, 0.50]])

for i, row in enumerate(W):
    top = np.argsort(row)[::-1]
    print(tokens[i], "->", [(tokens[j], round(row[j], 2)) for j in top])

print("attended-to overall:", dict(zip(tokens, W.sum(axis=0).round(2))))`,
      lines: [
        { code: "top = np.argsort(row)[::-1]", say: "Sort one query's weights from largest to smallest: what did this token use most?" },
        { code: "print(\"attended-to overall:\", dict(zip(tokens, W.sum(axis=0).round(2))))", say: "Column sums: which tokens does the whole sequence lean on." },
      ],
      output: "The -> [('The', 0.5), ('sat', 0.31), ('cat', 0.19)]\ncat -> [('cat', 0.5), ('sat', 0.31), ('The', 0.19)]\nsat -> [('sat', 0.5), ('The', 0.25), ('cat', 0.25)]\nattended-to overall: {'The': 0.94, 'cat': 0.94, 'sat': 1.12}",
    },
    useIt: "Attention weights are the first diagnostic for 'why did the model say that?', they appear in interpretability tools and papers, and they explain two engineering facts you will rely on: the KV cache stores exactly what weights are applied to, and long prompts cost n² because there are n² weights per head per layer.",
    takeaways: ["Weights are softmax outputs: non-negative, summing to 1 per query.", "Output = weighted average of value vectors.", "Rows show what a token used; columns show which tokens everyone leans on.", "Weights are interpretable but partial: values and later layers do the rest."],
    terms: [["convex combination", "a weighted sum whose weights are non-negative and add to 1"], ["attention sink", "a token, often the first, that collects weight from many queries as a default"]],
    reflect: { q: "A row of weights is [0.98, 0.01, 0.01]. What does that suggest about the scores, and is it good?", a: "The scores were far apart, so softmax nearly saturated. Sometimes that is right (a pronoun with one clear antecedent); if it happens everywhere it suggests scores are too large and gradients are weak, the problem scaling is meant to prevent." },
  },

  "m15-self-attention": {
    simple: "Self-attention is attention where the queries, keys and values all come from the same sequence, so every token builds its new meaning from the other tokens around it.",
    concept:
      "**Self-attention** means the sequence attends to itself: Q, K and V are all computed from the same token vectors. Each token asks a question of every token in the same text, including itself, and rewrites its own vector as a mix of what it found. After one self-attention layer, the vector for 'bank' in 'river bank' has absorbed 'river', and the vector for 'it' has absorbed its noun. The outputs are contextual embeddings, the idea introduced in Module 13, produced by a concrete mechanism.\n\nThe running example has been self-attention all along: 'sat' looked at 'The', 'cat' and 'sat'. The word 'self' distinguishes it from cross-attention (next lesson), where the queries come from one sequence and the keys and values from another.\n\nSelf-attention is applied in every layer of a transformer, so a token's vector is refined repeatedly: layer one captures neighbouring words, deeper layers capture clauses, references and topics, because by then each vector already summarises its neighbourhood.",
    why:
      "Meaning depends on context, and the context of a word is the rest of its sentence and document. A static embedding gives 'bank' one vector for both meanings; a recurrent model gives it context only from the left and only through a fading memory. Self-attention lets every token read every other token in both directions (in an encoder) in one step, which is why models built on it learned representations that beat everything before them on understanding tasks. It is also fully parallel: the whole sequence is one matrix multiplication, so training on billions of tokens became affordable.",
    how: [
      "Take the sequence's token vectors X (n rows).",
      "Project to Q, K and V with the layer's three matrices: all three from the same X.",
      "Compute scaled scores Q·Kᵀ/√d_k, softmax per row, multiply by V.",
      "Each output row is a contextualised version of the corresponding input token.",
      "Pass the outputs to the rest of the block (Module 16) and repeat in the next layer with new matrices.",
    ],
    visual: {
      kind: "flow",
      steps: ["X: embeddings of 'The cat sat'", "Q, K, V from the same X", "weights: each token over all three", "outputs: 'sat' = [0.75, 0.75] etc.", "X': contextual vectors, one per token"],
      caption: "In and out have the same shape: n tokens, d numbers each. Only the contents changed.",
    },
    everyday: {
      title: "A group of friends adjusting their stories",
      text: "Five friends each tell their version of last night. As each one listens to the others, their own account shifts: a time gets corrected, a detail is borrowed, a name is filled in. Nobody speaks to an outside judge; the group refines itself. After a round, each story is still that person's story, but informed by all the others. That round is one self-attention layer.",
    },
    engineering: {
      title: "Contextual embeddings for a code-search tool",
      text: "A developer-tools team built search over a codebase. Static word vectors treated 'close' in 'close the connection' and 'close to the limit' identically, so queries about resource cleanup returned threshold checks. Switching to a self-attention encoder gave each occurrence of 'close' a vector shaped by its neighbours: one near 'connection', 'socket', 'release'; the other near 'limit', 'threshold'. Search precision on their internal benchmark went from 61% to 84% with no change to the query side, because the index itself now understood context.",
    },
    maths: {
      formula: "SelfAttention(X) = softmax(X·W_Q · (X·W_K)ᵀ / √d_k) · X·W_V",
      meaning: "All three projections are of the same X. Input and output are both n×d.",
      worked: [
        "With W_Q = W_K = W_V = I and X = [[1,0],[0,1],[1,1]], the outputs are the rows computed earlier: The → [0.81, 0.50], cat → [0.50, 0.81], sat → [0.75, 0.75].",
        "Notice 'The' moved from [1, 0] toward 'sat' and 'cat': its new vector carries context. 'sat' is now midway between its neighbours and itself.",
        "Count the parameters: three d×d matrices, 3·2·2 = 12 numbers here; for d = 512, 3·512·512 ≈ 786,000 per layer before the output projection.",
      ],
    },
    code: {
      title: "A self-attention layer with learned matrices",
      lang: "py",
      src: `import numpy as np
rng = np.random.default_rng(0)

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

class SelfAttention:
    def __init__(self, d):
        self.W_Q = rng.normal(0, 0.5, (d, d))
        self.W_K = rng.normal(0, 0.5, (d, d))
        self.W_V = rng.normal(0, 0.5, (d, d))
    def __call__(self, X):
        Q, K, V = X @ self.W_Q, X @ self.W_K, X @ self.W_V   # all from the same X
        W = softmax_rows(Q @ K.T / np.sqrt(X.shape[1]))
        return W @ V

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
layer = SelfAttention(d=2)
print(layer(X).round(2))          # same shape as X, new contents`,
      lines: [
        { code: "Q, K, V = X @ self.W_Q, X @ self.W_K, X @ self.W_V   # all from the same X", say: "The defining line of self-attention: one sequence supplies queries, keys and values." },
        { code: "W = softmax_rows(Q @ K.T / np.sqrt(X.shape[1]))", say: "Scaled scores and softmax, as before." },
        { code: "print(layer(X).round(2))          # same shape as X, new contents", say: "Three rows in, three rows out; each row now reflects its neighbours. Training would set the matrices; here they are random." },
      ],
    },
    useIt: "Self-attention is the layer you are paying for in every API call and the layer inside every embedding model you use for search. Its n² cost is the reason context windows are limited and priced per token, and its bidirectional form is why encoder models are strong at classification and retrieval while decoder models (with the causal mask, two lessons on) are used to generate.",
    takeaways: ["Self-attention: Q, K, V all from the same sequence.", "Each token's output is a context-aware rewrite of itself.", "Stacked layers refine from neighbours to clauses to topics.", "Fully parallel; same shape in and out."],
    terms: [["self-attention", "attention where queries, keys and values come from one sequence"], ["contextual embedding", "a token vector that has absorbed information from the surrounding tokens"]],
    reflect: { q: "After self-attention, does 'The' still 'know' it was 'The'?", a: "Partly: its output is a mix that still includes its own value (weight 0.5 here), and the residual connection in Module 16 adds the original vector back, so the identity is preserved alongside the context." },
  },

  "m15-cross-attention": {
    simple: "Cross-attention takes queries from one sequence and keys and values from another, so a decoder writing a translation can look at the source sentence while it writes.",
    concept:
      "**Cross-attention** is attention between two different sequences. The queries come from the sequence being produced (the target: a translation, a summary, a caption), and the keys and values come from another sequence the model is conditioning on (the source: the original sentence, the document, the image). Each target token asks 'which parts of the source matter for me right now?' and reads a weighted mix of the source's values.\n\nThe mechanics are identical to self-attention: scaled dot products, softmax, weighted sum. The only change is where Q and K, V come from. The score matrix is no longer square; it is (target length) × (source length).\n\nCross-attention is how encoder-decoder transformers (Module 16) connect their two halves, and it is the modern form of the 2014 idea that let translation handle long sentences. It also appears wherever a model reads one modality to produce another: text tokens attending to image patches, or a speech decoder attending to audio frames.",
    why:
      "Many tasks have an input and a different output: French in, English out; a long article in, three sentences out; pixels in, a caption out. Self-attention over the output alone would ignore the input; concatenating input and output into one sequence works (decoder-only models do it) but mixes two things with different roles. Cross-attention keeps the source and target separate, lets the source be encoded once and reused for every target token, and gives a clean, inspectable alignment between what is written and what it was based on. In translation that alignment matrix is nearly a word-by-word dictionary learned from data.",
    how: [
      "Encode the source sequence into vectors (self-attention over the source).",
      "Compute keys and values from the source vectors: K_src = S·W_K, V_src = S·W_V.",
      "While producing the target, compute each target token's query from its own vector: Q_tgt = T·W_Q.",
      "Scores = Q_tgt · K_srcᵀ / √d_k, a (target × source) matrix; softmax each row.",
      "Each target token reads a weighted mix of source values and continues through the block.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["target ↓ / source →", "Le", "chat", "dort"],
        rows: [
          ["The", "0.85", "0.10", "0.05"],
          ["cat", "0.08", "0.88", "0.04"],
          ["sleeps", "0.05", "0.10", "0.85"],
        ],
      },
      caption: "A cross-attention map for translating 'Le chat dort' to English. Rows are target queries, columns are source keys; it is not square and it reads like an alignment.",
    },
    everyday: {
      title: "Translating with the original open beside you",
      text: "A translator writes the English sentence while glancing at the French. For each English word they look at the part of the French sentence it corresponds to, sometimes one word, sometimes a phrase, and sometimes they look back at an earlier clause to get the tense right. The English text is what they are writing (queries); the French is what they consult (keys and values). They never rewrite the French.",
    },
    engineering: {
      title: "Image captioning that points at what it describes",
      text: "A product-photo captioning system encodes each image into a grid of patch vectors and generates captions with a decoder that cross-attends to the grid. When the caption says 'walnut legs', the cross-attention row for 'walnut' lights up on the patches containing the legs. The team uses those maps in two ways: to show a highlighted region in the review tool so a human can verify the caption, and to catch captions that mention objects whose attention lands on the background, a reliable sign of a made-up detail.",
    },
    maths: {
      formula: "CrossAttention(T, S) = softmax(T·W_Q · (S·W_K)ᵀ / √d_k) · S·W_V",
      meaning: "Queries from the target T (m rows), keys and values from the source S (n rows); scores are m×n.",
      worked: [
        "Source S = [[1, 0], [0, 1], [1, 1]] (three French tokens), target so far T = [[0, 1]] (one English token). W = I, d_k = 2.",
        "Scores for the target token: [0, 1]·[1, 0] = 0, [0, 1]·[0, 1] = 1, [0, 1]·[1, 1] = 1; scaled: [0, 0.71, 0.71].",
        "Softmax: e⁰ = 1, e^0.71 = 2.03, 2.03; total 5.06 → [0.20, 0.40, 0.40].",
        "Output = 0.20·[1, 0] + 0.40·[0, 1] + 0.40·[1, 1] = [0.60, 0.80]: the target token read mostly from source tokens 2 and 3.",
      ],
    },
    code: {
      title: "Queries from one sequence, keys and values from another",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

source = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # encoded "Le chat dort"
target = np.array([[0.0, 1.0]])                           # the English token being written

Q = target            # queries from the target
K = source            # keys from the source
V = source            # values from the source
W = softmax_rows(Q @ K.T / np.sqrt(2))
print(W.round(2))                 # 1 x 3: not square
print((W @ V).round(2))`,
      lines: [
        { code: "Q = target            # queries from the target", say: "The sequence being produced asks the questions." },
        { code: "K = source            # keys from the source", say: "The sequence being consulted answers them; the source is never rewritten." },
        { code: "print(W.round(2))                 # 1 x 3: not square", say: "One target token, three source tokens: an alignment row, not a square map." },
      ],
      output: "[[0.2 0.4 0.4]]\n[[0.6 0.8]]",
    },
    useIt: "Cross-attention is the bridge inside translation, summarisation and captioning models, and inside multimodal models (Module 48) that read images or audio. When you use a retrieval system (Stage 6) you are doing cross-attention's job by hand at the document level: choosing which source to put in front of the model's queries.",
    takeaways: ["Cross-attention: queries from the target, keys and values from the source.", "Same maths as self-attention; the score matrix is target × source.", "It connects encoder to decoder and one modality to another.", "Its weights read as an alignment between output and input."],
    terms: [["cross-attention", "attention from one sequence's queries to another sequence's keys and values"], ["alignment", "a mapping showing which source parts each output part was based on"]],
    reflect: { q: "In a decoder-only chat model there is no separate encoder. Where does the 'cross' attention to your prompt happen?", a: "Inside self-attention: the prompt and the answer are one sequence, so answer tokens attend to prompt tokens through ordinary self-attention with a causal mask. Cross-attention as a separate layer exists only when the source is encoded separately." },
  },

  "m15-causal-attention": {
    simple: "Causal attention blocks every token from attending to tokens that come after it, so a model trained to predict the next token cannot cheat by reading it.",
    concept:
      "**Causal attention** (also called masked self-attention) is self-attention with one rule: token i may attend only to tokens 1 … i, never to i+1 onward. In the score matrix, every entry above the diagonal is set to minus infinity before softmax, so its weight becomes exactly zero.\n\nThe reason is the training objective. A language model is trained to predict the next token at every position of a text at once (Module 14). If 'cat' could attend to 'sat', then predicting 'sat' from the position of 'cat' would be trivial: just copy it. The mask makes every position see only its past, so the prediction at each position is a genuine forecast, and all n predictions can still be computed in one parallel pass.\n\nAt generation time the mask is what makes the model consistent with its training: the newest token attends to everything before it, which is all that exists. Decoder-only models (GPT-style, Module 17) use causal attention in every layer; encoder models do not, which is why they can read both directions but cannot generate.",
    why:
      "Parallel training is the whole economic basis of large models: a 4,000-token document gives 4,000 training examples from one forward pass. That only works if position i's prediction cannot see position i+1. The alternative, running the model once per token with only the past as input, would be thousands of times slower. The causal mask gets parallelism and honesty at once: compute everything together, but let each position use only what a real predictor would have had. It also makes the KV cache possible (Module 40), because past keys and values never change when a new token is added.",
    how: [
      "Compute the full scaled score matrix as usual.",
      "Add a mask: 0 where key position ≤ query position, −∞ where key position > query position.",
      "Apply softmax row by row; e^{−∞} = 0, so future tokens get weight exactly 0 and the rest renormalise.",
      "Multiply by V. Each output depends only on its own and earlier tokens.",
      "Train with next-token prediction at every position in parallel; generate one token at a time with the same mask.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["query ↓ / key →", "The", "cat", "sat"],
        rows: [
          ["The", "1.00", "masked", "masked"],
          ["cat", "0.33", "0.67", "masked"],
          ["sat", "0.25", "0.25", "0.50"],
        ],
      },
      caption: "Causal weights for the running example: a lower triangle. 'The' can see only itself; 'cat' sees two tokens; 'sat' sees all three.",
    },
    everyday: {
      title: "Guessing the next word of a story read aloud",
      text: "A friend reads a story aloud and pauses before each word so you can guess it. You can use everything they have read so far and nothing after, because you have not heard it. If you had the book open, guessing would be meaningless. Causal attention is keeping the book closed for every position at once, so the model is tested fairly on all of them in one go.",
    },
    engineering: {
      title: "A leak that made a model look perfect",
      text: "A team fine-tuning a decoder for log-anomaly prediction reported near-zero loss after one epoch and were suspicious. They had built a custom attention module and forgotten the causal mask. Every position could read the token it was supposed to predict, so the model learned to copy. On held-out data generated one token at a time, output was gibberish. Adding the triangular mask brought training loss back to a believable level and the generated output became coherent. Suspiciously good training loss on a next-token task is now their standing signal to check the mask.",
    },
    maths: {
      formula: "masked_score_ij = score_ij if j ≤ i, else −∞;   weights = softmax(masked_score / √d_k)",
      meaning: "Future positions get −∞ before softmax, which makes their weight exactly 0 and renormalises the rest.",
      worked: [
        "Row for 'cat' (position 2), scaled scores [0, 0.71, 0.71]. Mask position 3: [0, 0.71, −∞].",
        "Exponentials: e⁰ = 1, e^0.71 = 2.03, e^{−∞} = 0; total 3.03.",
        "Weights: [0.33, 0.67, 0]. Output = 0.33·[1, 0] + 0.67·[0, 1] = [0.33, 0.67].",
        "Row for 'The': only itself is visible, so its weight is 1 and its output is its own value [1, 0].",
      ],
    },
    code: {
      title: "Adding the triangular mask",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])      # The, cat, sat
S = X @ X.T / np.sqrt(2)                                 # scaled scores

n = len(X)
mask = np.triu(np.ones((n, n), dtype=bool), k=1)         # True above the diagonal = future
S_masked = np.where(mask, -np.inf, S)                    # future scores become -inf
W = softmax_rows(S_masked)
print(W.round(2))
print((W @ X).round(2))`,
      lines: [
        { code: "mask = np.triu(np.ones((n, n), dtype=bool), k=1)         # True above the diagonal = future", say: "The upper triangle marks every (query, key) pair where the key comes later." },
        { code: "S_masked = np.where(mask, -np.inf, S)                    # future scores become -inf", say: "Minus infinity before softmax gives weight exactly zero after it." },
        { code: "print(W.round(2))", say: "A lower-triangular weight matrix: each row only uses positions up to itself." },
      ],
      output: "[[1.   0.   0.  ]\n [0.33 0.67 0.  ]\n [0.25 0.25 0.5 ]]\n[[1.   0.  ]\n [0.33 0.67]\n [0.75 0.75]]",
    },
    useIt: "Every chat and code model you call is causal, which explains behaviours you will design around: the model cannot revise an earlier token in the light of a later one (so it cannot 'plan the ending first'), prompt order matters, and the cost of a long prompt is paid once because past keys and values are cached and reused by each new token.",
    takeaways: ["Causal attention masks future positions with −∞ so their weight is zero.", "It lets next-token training run for all positions in parallel without leaking the answer.", "Decoder (generating) models are causal in every layer; encoders are not.", "It is what makes the KV cache valid: past keys and values never change."],
    terms: [["causal mask", "the triangular pattern that hides future positions from each query"], ["decoder-only", "a transformer that uses causal self-attention and generates left to right"]],
    reflect: { q: "Why can an encoder model like those used for search not simply be used to write text?", a: "Its attention is bidirectional: each position was trained seeing the whole input, so it has no notion of 'predict what comes next'. Generation needs the causal mask baked into training." },
  },

  "m15-multi-head-attention": {
    simple: "Multi-head attention runs several smaller attentions in parallel, each with its own projections, so the model can look for different kinds of relationships at the same time.",
    concept:
      "A single attention layer produces one weight distribution per token, which means one kind of relationship at a time. But a token often needs several: 'it' needs its antecedent, the verb it belongs to, and the tone of the clause. **Multi-head attention** splits the model dimension d into h **heads**, each with its own smaller W_Q, W_K and W_V of size d × d/h. Each head computes scaled dot-product attention independently, producing an output of size d/h. The h outputs are concatenated back to size d and passed through a final learned matrix W_O.\n\nBecause each head has its own projections, each can learn to attend to something different. In trained models, individual heads have been found that track subject–verb agreement, previous-token position, coreference, or punctuation structure. No one assigns these roles; they emerge because specialising helps prediction.\n\nThe computational cost is about the same as one full-size attention: h heads of size d/h do the same total work as one head of size d. What changes is expressiveness: h different weight maps instead of one.",
    why:
      "One softmax distribution forces a compromise: if 'it' should attend 60% to its noun and 40% to the verb, a single head can do that, but it cannot attend to the noun's identity and the verb's tense as separate signals, because the mix collapses them into one vector. Heads give the model separate channels. The transformer paper used 8 heads of 64 dimensions and found it clearly better than one head of 512. Large models use 32 to 128 heads. The idea mirrors convolutional filters in vision (Module 10): many small detectors looking for different patterns, rather than one big one.",
    how: [
      "Choose h heads; each head has dimension d_h = d / h.",
      "For head i, project X to Q_i, K_i, V_i using that head's own matrices (d × d_h each).",
      "Run scaled dot-product attention in each head independently, with the same mask if any.",
      "Concatenate the h outputs side by side to get an n × d matrix.",
      "Multiply by W_O (d × d) to mix the heads' information; this is the layer's output.",
    ],
    visual: {
      kind: "flow",
      steps: ["X (n × d)", "h sets of Q, K, V (each n × d/h)", "h attention maps, computed in parallel", "concatenate → n × d", "W_O → output (n × d)"],
      caption: "Same work as one big head, but h independent views of the sequence.",
    },
    everyday: {
      title: "Several editors reading the same draft",
      text: "A publisher sends a manuscript to four editors: one checks grammar, one checks facts, one checks tone, one checks structure. Each reads the whole text but attends to different things, and each returns their own marked-up copy. The author then merges the four sets of notes into one revision. Multi-head attention is the four editors; W_O is the merge.",
    },
    engineering: {
      title: "Finding the head that tracks brackets in a code model",
      text: "A team building a code-completion model studied its attention heads to understand why it rarely produced unbalanced brackets. One head in a middle layer attended, from every closing bracket, almost entirely to the matching opening bracket, regardless of distance. Another head attended from each token to the previous token, giving local order. Knowing these heads existed let the team test a smaller model by checking whether the same specialisations emerged; when they did not, the smaller model also produced more bracket errors, which guided how far they could shrink it.",
    },
    maths: {
      formula: "MultiHead(X) = Concat(head_1, …, head_h) · W_O,   head_i = Attention(X·W_Q^i, X·W_K^i, X·W_V^i)",
      meaning: "Each head is a complete attention with its own small projections; outputs are joined and mixed by W_O.",
      worked: [
        "Let d = 512 and h = 8, so d_h = 64. Each head's W_Q, W_K, W_V are 512 × 64: 3 · 512 · 64 = 98,304 parameters per head.",
        "Across 8 heads: 786,432. Plus W_O at 512 × 512 = 262,144. Total multi-head attention parameters: 1,048,576 ≈ 1.05 million per layer.",
        "Compare one head of size 512: 3 · 512 · 512 = 786,432 for Q, K, V, the same as the 8 heads combined. Splitting costs nothing extra.",
        "In the running example with d = 2 and h = 2, each head has d_h = 1: head 1 might read only the first coordinate, head 2 only the second, giving two different one-dimensional attention maps.",
      ],
    },
    code: {
      title: "Two heads on the running example",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def head(X, W_Q, W_K, W_V):
    Q, K, V = X @ W_Q, X @ W_K, X @ W_V
    return softmax_rows(Q @ K.T / np.sqrt(K.shape[1])) @ V

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # The, cat, sat; d = 2, h = 2, d_h = 1
e1 = np.array([[1.0], [0.0]])                         # head 1 projects onto coordinate 1
e2 = np.array([[0.0], [1.0]])                         # head 2 projects onto coordinate 2

h1 = head(X, e1, e1, e1)
h2 = head(X, e2, e2, e2)
concat = np.hstack([h1, h2])                           # n x d again
W_O = np.eye(2)
print((concat @ W_O).round(2))`,
      lines: [
        { code: "e1 = np.array([[1.0], [0.0]])                         # head 1 projects onto coordinate 1", say: "A head's projection is d × d_h: here 2 × 1. This head sees only the first feature of each token." },
        { code: "h1 = head(X, e1, e1, e1)", say: "Each head is a full attention on its own slice." },
        { code: "concat = np.hstack([h1, h2])                           # n x d again", say: "Side by side, the heads restore the original width." },
        { code: "print((concat @ W_O).round(2))", say: "W_O mixes the heads; here the identity keeps them separate so you can see each head's contribution." },
      ],
      output: "[[0.73 0.27]\n [0.27 0.73]\n [0.73 0.73]]",
      note: "Head 1 made 'The' and 'sat' similar on coordinate 1; head 2 did the same for 'cat' and 'sat' on coordinate 2. Two relationships, computed at once.",
    },
    useIt: "Head counts and head sizes appear in every model card and config file you will read (for example 32 heads × 128 dims); grouped-query attention, which shares keys and values across heads to shrink the KV cache (Module 40), only makes sense once you know what a head is; and interpretability tools report findings per head.",
    takeaways: ["Multi-head attention runs h small attentions with separate projections, then concatenates and mixes.", "Each head can learn a different relationship.", "Total cost equals one big head; expressiveness is much higher.", "W_O combines the heads into the layer's output."],
    terms: [["head", "one independent attention with its own smaller projections"], ["W_O", "the output matrix that mixes the concatenated heads"]],
    reflect: { q: "If every head learned the same thing, would multi-head attention be useless?", a: "It would waste capacity, and in trained models some heads are indeed redundant; pruning studies remove a third of heads with little loss. But the heads that specialise carry most of the benefit, which single-head attention cannot provide." },
  },

  "m15-attention-masks": {
    simple: "A mask is a pattern of allowed and forbidden query–key pairs applied before softmax; the causal mask is one kind, and padding masks and sparse patterns are others.",
    concept:
      "An **attention mask** is a matrix the same shape as the score matrix that says which pairs are allowed. Forbidden pairs have their score replaced by −∞ before softmax, so they receive zero weight. The causal mask from two lessons ago is the most famous, but masks serve several jobs.\n\nA **padding mask** hides filler tokens. Batches of sequences must be the same length, so short ones are padded with a special token; the mask stops real tokens from attending to the padding. A **prefix mask** lets a prompt be read bidirectionally while the answer is generated causally. **Sparse masks** restrict each token to a window of neighbours plus a few global tokens, cutting the n² cost for very long inputs. And a **document mask** in training keeps unrelated documents packed into one sequence from attending to each other.\n\nAll of these are the same mechanism: add 0 where allowed, −∞ where not, then softmax. The model's weights never need to know about the mask; the mask simply decides which keys exist for a given query.",
    why:
      "Attention by default lets everything see everything, which is wrong in several practical situations: a model must not see its future during training, must not treat padding as content, must not blend two unrelated documents, and sometimes cannot afford all n² pairs. Changing the architecture for each case would be expensive; a mask handles them all with a cheap elementwise operation before softmax. Masks are also how efficient attention variants are expressed: block-sparse or sliding-window attention is just a structured mask, often implemented so that forbidden blocks are never computed at all.",
    how: [
      "Build a boolean matrix M of shape (queries × keys): true where attention is allowed.",
      "Combine masks by logical AND: causal AND not-padding, for example.",
      "Convert to additive form: 0 where allowed, −∞ (or a very large negative number) where forbidden.",
      "Add it to the scaled scores before softmax.",
      "Softmax renormalises over the allowed keys only; forbidden keys get weight 0.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Mask", "Allowed pairs", "Used for"],
        rows: [
          ["causal", "key position ≤ query position", "next-token training and generation"],
          ["padding", "key is a real token, not filler", "batching sequences of different lengths"],
          ["prefix (bidirectional prompt)", "prompt tokens see all prompt tokens; answer tokens are causal", "some encoder-decoder-style instruction models"],
          ["sliding window", "|query − key| ≤ w, plus a few global tokens", "long inputs at reduced cost"],
          ["document", "query and key belong to the same document", "packing many short texts into one training sequence"],
        ],
      },
      caption: "Different rules, one mechanism: −∞ before softmax.",
    },
    everyday: {
      title: "Reading with a ruler",
      text: "Some readers slide a ruler down the page so only the current line and those above are visible: that is a causal mask. A redacted document with black bars is a padding or document mask: the words under the bars cannot be read, and the rest is read normally. A newspaper read column by column is a document mask between columns. In every case the text is unchanged; what you are allowed to look at is.",
    },
    engineering: {
      title: "Packing short support tickets into long training sequences",
      text: "A team fine-tuning a model on 400,000 short support tickets found training slow, because each ticket of 80 tokens was padded to the 2,048-token context and most compute went on padding. They packed about 25 tickets into each sequence and added a document mask so tokens of one ticket could not attend to another's. Throughput rose 18-fold. When they first forgot the document mask, the model learned to continue one ticket with the next one's text, a bug that showed up as replies mentioning unrelated customers' orders. The mask fixed it without changing anything else.",
    },
    maths: {
      formula: "weights = softmax((Q·Kᵀ)/√d_k + M),   M_ij = 0 if allowed, −∞ if forbidden",
      meaning: "The mask is added to the scaled scores; −∞ entries vanish after exponentiation.",
      worked: [
        "Running example with a padding mask hiding token 1 ('The' treated as padding), query 'sat', scaled scores [0.71, 0.71, 1.41].",
        "Add M = [−∞, 0, 0]: [−∞, 0.71, 1.41]. Exponentials: [0, 2.03, 4.10]; total 6.13.",
        "Weights [0, 0.33, 0.67]. Output = 0.33·[0, 1] + 0.67·[1, 1] = [0.67, 1.00].",
        "Combining with the causal mask for query 'cat' (position 2): allowed keys are positions ≤ 2 and not padding: only 'cat' itself → weight 1 on itself.",
      ],
    },
    code: {
      title: "Composing causal and padding masks",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # The, cat, sat
S = X @ X.T / np.sqrt(2)
n = len(X)

causal = np.tril(np.ones((n, n), dtype=bool))          # key <= query
is_real = np.array([False, True, True])                # pretend 'The' is padding
padding = np.broadcast_to(is_real, (n, n))             # a key is allowed only if it is real
allowed = causal & padding

M = np.where(allowed, 0.0, -np.inf)                    # additive mask
W = softmax_rows(S + M)
print(W.round(2))`,
      lines: [
        { code: "causal = np.tril(np.ones((n, n), dtype=bool))          # key <= query", say: "Lower triangle: the causal rule as a boolean matrix." },
        { code: "padding = np.broadcast_to(is_real, (n, n))             # a key is allowed only if it is real", say: "Every query sees the same column pattern: padded keys are forbidden for everyone." },
        { code: "allowed = causal & padding", say: "Masks compose with AND." },
        { code: "M = np.where(allowed, 0.0, -np.inf)                    # additive mask", say: "Zero keeps a score; minus infinity deletes it after softmax." },
      ],
      output: "[[ nan  nan  nan]\n [0.   1.   0.  ]\n [0.   0.33 0.67]]",
      note: "Row 1 is NaN: the padding query 'The' has no allowed keys at all. Real code either lets padding queries attend to themselves or drops their outputs.",
    },
    useIt: "You will set masks indirectly through tokeniser padding options and model configs, and directly if you fine-tune with packed sequences. Understanding them explains model-card phrases such as 'sliding-window attention with a 4,096-token window', and the NaN-from-empty-row bug is a classic you will recognise when it appears.",
    takeaways: ["A mask marks allowed query–key pairs; forbidden pairs get −∞ before softmax.", "Causal, padding, prefix, sliding-window and document masks are all the same mechanism.", "Masks compose with AND.", "A query with no allowed keys yields NaN; handle padding queries explicitly."],
    terms: [["padding", "filler tokens added so sequences in a batch have equal length"], ["sliding-window attention", "a mask allowing each token to see only a fixed number of neighbours"], ["sequence packing", "placing several short texts in one training sequence, separated by a document mask"]],
    reflect: { q: "Why does a sliding-window mask reduce compute, when the mask itself is still n×n?", a: "Because implementations that know the pattern skip computing the forbidden blocks altogether; the n×n mask is the specification, not the cost. With a window of w, each query scores only w keys, so the work is n·w instead of n²." },
  },
};

export const M15_QUIZ: Quiz[] = [
  {
    q: "A recurrent model translates long sentences badly but short ones well. Which limitation explains it?",
    options: ["Too few parameters", "Everything must pass through one fixed-size memory that overwrites early tokens", "Softmax saturation", "Missing attention masks"],
    answer: 1,
    why: ["Size would hurt short sentences too.", "Correct. The bottleneck vector cannot hold a long sentence, and gradients across many steps vanish.", "Softmax is not part of a plain recurrent model.", "Masks are an attention concept."],
    reason: true,
  },
  {
    q: "In Q, K, V terms, what is a score?",
    options: ["query · value", "key · value", "query · key", "value · value"],
    answer: 2,
    why: ["Values are what is read, not what is matched.", "Keys are matched against queries, not values.", "Correct. The dot product of one token's query with another's key.", "No."],
  },
  {
    q: "Why divide scores by √d_k?",
    options: ["To make them positive", "To keep softmax from saturating as vectors get longer, so gradients survive", "To normalise the weights to sum to 1", "Because the paper said so"],
    answer: 1,
    why: ["Scaling does not change sign.", "Correct. Dot products grow with d_k; without scaling softmax becomes one-hot and stops learning.", "Softmax does the normalising.", "The reason is the variance of dot products."],
    reason: true,
  },
  {
    q: "The scaled scores for a query are [0.71, 0.71, 1.41]. Which is closest to the softmax weights?",
    options: ["[0.33, 0.33, 0.33]", "[0.25, 0.25, 0.50]", "[0.10, 0.10, 0.80]", "[0, 0, 1]"],
    answer: 1,
    why: ["Equal weights would need equal scores.", "Correct. e^0.71 ≈ 2.03 twice and e^1.41 ≈ 4.10, over a total of 8.16.", "Too sharp for a 0.7 gap.", "Softmax never gives exact zeros."],
  },
  {
    q: "What does the causal mask prevent?",
    options: ["Attending to padding", "A token attending to tokens after it", "Attention to the first token", "Scores above 1"],
    answer: 1,
    why: ["That is the padding mask.", "Correct. Future positions get −∞ so next-token training cannot leak the answer.", "No.", "Scores are unbounded; masks do not clip them."],
  },
  {
    q: "What distinguishes cross-attention from self-attention?",
    options: ["It uses a different softmax", "Queries come from one sequence, keys and values from another", "It has no values", "It is only used in vision"],
    answer: 1,
    why: ["Same softmax.", "Correct. The target asks, the source answers; the score matrix is target × source.", "It has values from the source.", "It is used in translation, summarisation, captioning and more."],
  },
  {
    q: "Eight heads of dimension 64 versus one head of dimension 512: what changes?",
    options: ["Eight heads cost eight times more", "Eight heads can learn eight different relationships for the same total cost", "One head is more expressive", "Nothing"],
    answer: 1,
    why: ["Total projection work is the same.", "Correct. Separate projections per head let each specialise; cost is unchanged.", "One head gives one weight map per token.", "Expressiveness differs greatly."],
  },
  {
    q: "A query's row in the weight matrix comes out as NaN. Most likely cause?",
    options: ["Learning rate too high", "The mask forbade every key for that query, so softmax divided by zero", "Too many heads", "d_k is not a square number"],
    answer: 1,
    why: ["Possible elsewhere, but NaN in one row points at the mask.", "Correct. A padding query with all keys masked has an empty row; let it attend to itself or drop it.", "No.", "d_k need not be square."],
  },
];

export const M15_EXERCISES: Exercise[] = [
  {
    title: "Attention by hand",
    kind: "calculate",
    task: "Tokens x1 = [2, 0], x2 = [0, 2], x3 = [1, 1], with Q = K = V = X and d_k = 2. Compute the scaled scores for query x3, the softmax weights and the output vector.",
    hints: ["Scores: x3·x1 = 2, x3·x2 = 2, x3·x3 = 2.", "Divide by √2 ≈ 1.414 before softmax."],
    solution: "Scores [2, 2, 2] → scaled [1.41, 1.41, 1.41] → all equal, so softmax gives [1/3, 1/3, 1/3]. Output = (1/3)·([2,0] + [0,2] + [1,1]) = [1, 1]. Lesson: equal scores mean a plain average, whatever their size.",
  },
  {
    title: "Causal weights",
    kind: "calculate",
    task: "Using the module's running example (x1 = [1,0], x2 = [0,1], x3 = [1,1], d_k = 2), compute the causal attention weights and output for query 'cat' (position 2).",
    hints: ["Only keys 1 and 2 are allowed.", "Scaled scores for cat: [0, 0.71, masked]."],
    solution: "Allowed scaled scores [0, 0.71]. Exponentials [1, 2.03], total 3.03 → weights [0.33, 0.67, 0]. Output = 0.33·[1,0] + 0.67·[0,1] = [0.33, 0.67].",
  },
  {
    title: "Count the parameters",
    kind: "calculate",
    task: "A model has d = 1024 and 16 heads. How many parameters are in one multi-head attention layer (Q, K, V projections for all heads plus W_O)? Ignore biases.",
    hints: ["d_h = 1024 / 16 = 64.", "Per head: 3 · d · d_h. Then W_O is d × d."],
    solution: "Per head: 3 · 1024 · 64 = 196,608. For 16 heads: 3,145,728. W_O: 1024 · 1024 = 1,048,576. Total ≈ 4.19 million, the same as 4·d² regardless of the number of heads.",
  },
  {
    title: "Implement sliding-window attention",
    kind: "code",
    task: "Extend the mask code from the last lesson so each query can attend only to itself and the w = 1 previous token (causal plus window). Run it on the running example and print the weights.",
    hints: ["Allowed when 0 ≤ query − key ≤ w.", "Build it with np.arange and broadcasting, then AND with the causal mask."],
    solution: "q = np.arange(n)[:, None]; k = np.arange(n)[None, :]; allowed = (q - k >= 0) & (q - k <= 1); M = np.where(allowed, 0.0, -np.inf); W = softmax_rows(S + M). Weights: row 1 [1, 0, 0]; row 2 [0.33, 0.67, 0]; row 3 [0, 0.33, 0.67] ('sat' can no longer see 'The').",
  },
];
