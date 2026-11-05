import type { Exercise, LessonBody, Quiz } from "../types";

// Module 16: Transformer architecture. One concept per lesson.
// Numbers used throughout: a small transformer with d_model = 512, 8 heads, feed-forward width 2048, vocabulary 32,000;
// and the three-token example "The cat sat" from Module 15 where a hand calculation helps.

export const M16_BODIES: Record<string, LessonBody> = {
  "m16-transformers": {
    simple: "A transformer is a stack of identical blocks, each made of attention plus a small feed-forward network, that turns a sequence of token vectors into a sequence of better token vectors.",
    concept:
      "The **transformer** is the architecture behind every modern language model. It was introduced in 2017 for translation and has barely changed since. Its building block is simple: a multi-head self-attention layer (Module 15) that lets tokens exchange information, followed by a **feed-forward network** applied to each token on its own, with residual connections and layer normalisation wrapped around both. Stack that block N times (6 in the original, 32 to 100 in large models) and add an input stage that turns tokens into vectors and an output stage that turns vectors into predictions.\n\nTwo things make it different from everything before. There is no recurrence: the whole sequence is processed at once, so training is parallel. And there is no convolution: distance between tokens does not matter to attention, so a word can relate to another a thousand positions away in one step.\n\nThe same block serves three layouts: an encoder (bidirectional attention, for understanding), a decoder (causal attention, for generating), and an encoder-decoder pair joined by cross-attention (for transforming one sequence into another). The next three lessons cover those; the rest of the module walks through the block piece by piece.",
    why:
      "Recurrent models could not train on huge corpora because each token waited for the previous one, and they could not connect distant words because the signal faded. Convolutional models were parallel but saw only a local window per layer. Attention fixed both, but attention alone is just a weighted average: it cannot compute anything new about a single token. The transformer's insight was to alternate the two operations: attention to move information between tokens, then a feed-forward network to process each token's gathered information. Alternate them a few dozen times and the model can represent grammar, facts and reasoning patterns. The design scaled smoothly from millions to hundreds of billions of parameters, which no earlier architecture did.",
    how: [
      "Input: tokens become vectors (token embeddings plus positional information).",
      "Block, step one: multi-head self-attention mixes information between positions; a residual connection adds the input back; layer normalisation keeps the scale steady.",
      "Block, step two: a feed-forward network transforms each position independently; residual and normalisation again.",
      "Repeat the block N times; each block has its own weights.",
      "Output: a final projection turns each position's vector into scores over the vocabulary, softmaxed into probabilities.",
    ],
    visual: {
      kind: "flow",
      steps: ["tokens", "embeddings + positions", "block 1: attention → feed-forward", "block 2 … block N", "output projection", "probabilities over the vocabulary"],
      caption: "The whole architecture in one line. Every block has the same shape; only the learned numbers differ.",
    },
    everyday: {
      title: "A newsroom with meetings and desks",
      text: "Reporters sit at their desks writing their own stories (feed-forward: each works on their own material). Every hour they meet, swap what they have learned, and go back to their desks (attention: information moves between people). After a few rounds of meet-and-write, every story reflects what the whole room knows. The transformer is that rhythm, repeated N times, with every reporter working at the same time.",
    },
    engineering: {
      title: "One architecture, many products",
      text: "A company runs three transformer-based systems from one codebase: a 110-million-parameter encoder that classifies incoming documents, a 7-billion-parameter decoder that drafts replies, and a 600-million-parameter encoder-decoder that translates between the languages their customers use. The block code is shared; the three differ only in attention masking, whether cross-attention is present, depth, width, and the training data. When they optimised the attention kernel, all three systems got faster. That reuse is why the industry standardised on one architecture.",
    },
    maths: {
      formula: "Block(X) = FFN(LayerNorm(X + Attn(X))) + (X + Attn(X)),   with LayerNorm around the FFN as well",
      meaning: "Each block adds attention's output to its input, normalises, adds the feed-forward output, normalises. The input and output of a block have the same shape, n × d.",
      worked: [
        "Original transformer: d_model = 512, 8 heads, feed-forward width 2048, N = 6 blocks in encoder and decoder.",
        "Per block: attention ≈ 4 · 512² = 1.05 million parameters; feed-forward ≈ 2 · 512 · 2048 = 2.10 million; total ≈ 3.15 million.",
        "Six encoder blocks ≈ 18.9 million; the decoder adds cross-attention (another 1.05 million per block), ≈ 25.2 million. With embeddings the published model had about 65 million parameters.",
        "GPT-2 small: d = 768, 12 blocks, feed-forward 3072: per block ≈ 4·768² + 2·768·3072 ≈ 7.1 million; 12 blocks ≈ 85 million; plus a 50,257 × 768 embedding table ≈ 38.6 million; total ≈ 124 million.",
      ],
    },
    code: {
      title: "The skeleton of a transformer, in pseudocode-like Python",
      lang: "py",
      src: `def transformer(tokens, blocks, embed, unembed):
    x = embed(tokens)                 # token vectors + positions, shape (n, d)
    for block in blocks:              # N identical blocks with their own weights
        x = x + block.attention(x)    # tokens exchange information
        x = block.norm1(x)
        x = x + block.ffn(x)          # each token is processed on its own
        x = block.norm2(x)
    return unembed(x)                 # scores over the vocabulary at each position`,
      lines: [
        { code: "x = embed(tokens)                 # token vectors + positions, shape (n, d)", say: "The input stage: ids become vectors that carry meaning and position." },
        { code: "for block in blocks:              # N identical blocks with their own weights", say: "The stack. Six blocks in 2017, dozens now." },
        { code: "x = x + block.attention(x)    # tokens exchange information", say: "Attention plus a residual: information moves between positions and the original is kept." },
        { code: "x = x + block.ffn(x)          # each token is processed on its own", say: "The feed-forward network works on one position at a time; this is where most parameters live." },
        { code: "return unembed(x)                 # scores over the vocabulary at each position", say: "The output stage: vectors become next-token scores." },
      ],
      note: "Real implementations differ in where the normalisation goes (before or after each sub-layer); the shape of the loop is universal.",
    },
    useIt: "You will read model cards that say '32 layers, 4096 hidden, 32 heads' and know exactly what is inside; you will choose between encoder, decoder and encoder-decoder models for a task; and you will understand why depth and width set the cost of every token you pay for.",
    takeaways: ["A transformer is N identical blocks of attention + feed-forward, with residuals and normalisation.", "Attention moves information between tokens; the feed-forward network processes each token.", "No recurrence (parallel training) and no locality (any distance in one step).", "Encoder, decoder and encoder-decoder are three layouts of the same block."],
    terms: [["transformer", "the attention-plus-feed-forward architecture behind modern language models"], ["block (layer)", "one attention sub-layer and one feed-forward sub-layer with their residuals and normalisations"], ["d_model", "the width of every token vector throughout the model"]],
    reflect: { q: "If attention alone can relate any two tokens, why is the feed-forward network needed at all?", a: "Attention only averages existing vectors; it cannot compute a new feature of a token, such as 'this is a past-tense verb' from the mixed information. The feed-forward network does that per token. Without it, stacking attention layers would still produce only averages of the inputs." },
  },

  "m16-encoder-architecture": {
    simple: "An encoder is a transformer stack with bidirectional attention: every token sees the whole input, which makes it ideal for understanding tasks like classification and search.",
    concept:
      "The **encoder** is the transformer layout for reading. Its blocks use self-attention with no causal mask, so each token can attend to tokens before and after it. The output is one contextual vector per input token, and nothing is generated. To get a decision out of it, you add a small head on top: for classification, pool the vectors (often by taking the vector of a special first token) and apply a linear layer; for tagging, apply a classifier to every position; for search, use the pooled vector as the document's embedding.\n\nBecause an encoder sees both directions, its representation of a word is informed by its full context. 'Bank' in 'the bank approved the loan' is resolved by words on both sides. That is why encoder models, from BERT onwards, dominated classification, question answering over a passage, named-entity tagging and embedding-based retrieval.\n\nThe price of bidirectionality is that an encoder cannot generate text: it was never trained to predict a next token it could not see. Encoders are trained instead with masked-token prediction: hide 15% of the tokens and predict them from both sides.",
    why:
      "Many business tasks do not need generation: is this email spam, which product does this review mention, which paragraph answers this question, how similar are these two documents? For those, seeing the whole input at once is strictly better than reading left to right, and it is cheaper: no decoding loop, one forward pass per input, and the models can be small. An encoder gives the best representation per token because every token has the maximum context, and its outputs can be reused: embed a million documents once and compare them forever.",
    how: [
      "Tokenise the input and add a special classification token at the front (and a separator between two segments if there are two).",
      "Embed tokens and positions; run N blocks of bidirectional self-attention and feed-forward.",
      "Take the outputs: one vector per token, each informed by the whole input.",
      "Attach a task head: a classifier on the first token's vector, or a per-token classifier, or use the pooled vector as an embedding.",
      "Fine-tune the whole stack plus the head on labelled examples for the task.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Encoder", points: ["Attention looks both ways", "Output: one vector per input token", "Trained by masked-token prediction", "Used for classification, tagging, embeddings, extractive QA"] },
      right: { title: "Decoder (next lesson)", points: ["Attention looks left only", "Output: next-token probabilities", "Trained by next-token prediction", "Used for generation and chat"] },
      caption: "Same block; the mask and the training objective decide which it is.",
    },
    everyday: {
      title: "Reading a whole letter before deciding what it is",
      text: "To sort post into bills, invitations and junk you read the whole letter, glancing back and forth, then decide. You do not announce a verdict after the first line. An encoder reads like that: every word in the light of every other, then one judgement. A decoder reads like someone speaking the letter aloud as they write it, never allowed to look ahead.",
    },
    engineering: {
      title: "Routing support tickets with a small encoder",
      text: "A help-desk platform routes 200,000 tickets a day to twelve teams. They fine-tuned a 110-million-parameter encoder on 50,000 labelled tickets. It reads each ticket once, pools the first token's vector and predicts the team, in about 8 milliseconds on a CPU. A generative model could do the same job by writing the team name, but it would cost fifty times more per ticket and be no more accurate, because the task is understanding, not writing. The same encoder's pooled vectors also power their 'similar tickets' search.",
    },
    maths: {
      formula: "H = EncoderBlocks(E + P),   ŷ = softmax(W_cls · H[0] + b)",
      meaning: "Embeddings E plus positions P go through the blocks to give H, one row per token; the classifier reads the first row.",
      worked: [
        "A 12-block encoder with d = 768 and 12 heads, like BERT-base: per block ≈ 4·768² + 2·768·3072 ≈ 7.1 million parameters, 12 blocks ≈ 85 million, embeddings ≈ 24 million, total ≈ 110 million.",
        "Classifying one 128-token ticket: attention cost per block ≈ 128² · 768 ≈ 12.6 million multiply-adds for scores; the whole pass is a few hundred million operations, a few milliseconds on a CPU.",
        "Masked training: hide 15% of 128 tokens ≈ 19 tokens; the loss is cross-entropy over the vocabulary at those 19 positions, each predicted from both sides.",
      ],
    },
    code: {
      title: "A classification head on top of an encoder",
      lang: "py",
      src: `import numpy as np

def encoder(X):                       # stands in for N bidirectional blocks
    return X                          # returns one contextual vector per token

X = np.array([[0.2, 0.9], [1.0, 0.1], [0.3, 0.8]])   # [CLS], "refund", "please"
H = encoder(X)

cls_vector = H[0]                     # the first token summarises the whole input
W_cls = np.array([[2.0, -1.0], [-1.5, 1.5], [0.1, 0.1]])   # 3 teams x d
scores = W_cls @ cls_vector
probs = np.exp(scores) / np.exp(scores).sum()
print(probs.round(2))                 # probability per team`,
      lines: [
        { code: "cls_vector = H[0]                     # the first token summarises the whole input", say: "Bidirectional attention let the [CLS] token gather the whole ticket; its vector is the summary." },
        { code: "W_cls = np.array([[2.0, -1.0], [-1.5, 1.5], [0.1, 0.1]])   # 3 teams x d", say: "The task head: one small matrix mapping the summary to team scores." },
        { code: "probs = np.exp(scores) / np.exp(scores).sum()", say: "Softmax over teams; the highest is the routing decision." },
      ],
      output: "[0.14 0.78 0.08]",
    },
    useIt: "Reach for an encoder when the output is a label, a span or a vector: classification, entity tagging, extractive QA, semantic search and reranking (Stage 6). They are small, fast, cheap to fine-tune, and run on CPUs. Reach for a decoder when the output is text.",
    takeaways: ["Encoders use bidirectional attention: every token sees the whole input.", "Output is one vector per token; a task head turns it into a label, span or embedding.", "Trained with masked-token prediction; cannot generate.", "Best choice for understanding tasks: small, fast, accurate."],
    terms: [["encoder", "a transformer that reads with bidirectional attention and outputs token vectors"], ["masked-token prediction", "training by hiding some tokens and predicting them from both sides"], ["[CLS] token", "a special first token whose output vector is used to represent the whole input"]],
    reflect: { q: "Why can an encoder produce better document embeddings than a decoder of the same size?", a: "Every token in an encoder has seen the full document; in a decoder the early tokens have seen almost nothing, so a pooled vector mixes well-informed and poorly-informed positions. Decoder-based embedders work around this with tricks, but the encoder has the advantage built in." },
  },

  "m16-decoder-architecture": {
    simple: "A decoder is a transformer stack with causal attention: each token sees only the past, so the model can be trained to predict the next token and used to generate text one token at a time.",
    concept:
      "The **decoder** is the transformer layout for writing. Its self-attention uses the causal mask from Module 15, so position i attends only to positions 1 … i. Each position's output vector is projected to scores over the vocabulary, read as 'what token comes next here?'. Training feeds a text and scores every position's prediction against the actual next token, all in one parallel pass. Generation feeds a prompt, takes the last position's prediction, appends the chosen token, and repeats.\n\nThe original transformer's decoder also had a cross-attention sub-layer to read the encoder's output. The decoder-only models that dominate today (GPT-style, Module 17) drop that sub-layer: the prompt and the answer are one sequence, and ordinary causal self-attention lets answer tokens read prompt tokens.\n\nA decoder sees less context per token than an encoder (left only), but what it learns is the distribution of text itself, which turns out to contain grammar, facts, reasoning patterns and the ability to follow instructions once it is large enough and aligned (Stage 5).",
    why:
      "Generation requires a model that can produce a token without knowing what comes after, because at generation time nothing comes after yet. The causal mask makes the training situation match the generation situation exactly, which is what lets the model's training predictions carry over. The decoder's objective, next-token prediction on raw text, needs no labels and works on any text, so it scales to trillions of tokens; that scale is what produced the capabilities of modern assistants. Encoders need masked tokens and task heads; decoders need only text and a loop.",
    how: [
      "Embed the input tokens with positions.",
      "Run N blocks whose self-attention carries the causal mask; in an encoder-decoder model each block also cross-attends to the encoder output.",
      "Project every position's final vector to vocabulary scores (logits) and softmax.",
      "Training: compare each position's distribution with the true next token; sum the losses; one backward pass updates everything.",
      "Generation: take the last position's distribution, choose a token (Module 18), append it, and run again, reusing cached keys and values for earlier positions.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Prompt", detail: "'The cat sat' → positions 1, 2, 3" },
        { label: "Causal blocks", detail: "position 3 attends to 1, 2, 3; position 1 only to itself" },
        { label: "Predict at the last position", detail: "logits over the vocabulary: 'on' 0.62, 'down' 0.21, …" },
        { label: "Append and repeat", detail: "'The cat sat on' → predict position 4's next token" },
      ],
      caption: "Training scores all positions at once; generation uses only the last one, then loops.",
    },
    everyday: {
      title: "Finishing someone's sentence",
      text: "A friend starts a sentence and stops; you supply the next word from everything they said so far. They add your word, continue, stop again. You never know what they will say later, and you do not need to. A decoder is that game played by a model with itself: predict, append, predict, with every prediction based only on what has been said.",
    },
    engineering: {
      title: "Why a code assistant's suggestions cannot depend on the code below the cursor",
      text: "A team shipped a code-completion model and users asked why it ignored the function defined further down the file. The model is a decoder: it sees only text before the cursor. The fix was not architectural but in the prompt: the editor now moves relevant code from below the cursor into the context above it, with a marker, so causal attention can reach it. Some completion models are trained with a 'fill in the middle' format that places the suffix before the prefix for the same reason. Knowing the mask is one-directional told the team what to change.",
    },
    maths: {
      formula: "L = −(1/n) Σ_i log p(x_{i+1} | x_1 … x_i)",
      meaning: "The training loss is the average negative log probability the model gives to each actual next token, given the tokens before it.",
      worked: [
        "Text 'The cat sat on' with predictions at three positions. Suppose the model gives p(cat | The) = 0.05, p(sat | The cat) = 0.20, p(on | The cat sat) = 0.60.",
        "Negative logs: −ln 0.05 = 3.00, −ln 0.20 = 1.61, −ln 0.60 = 0.51.",
        "Average loss = (3.00 + 1.61 + 0.51) / 3 = 1.71. Lower is better; a perfect model would give probability 1 to every actual token, loss 0.",
        "All three positions were scored in one forward pass thanks to the causal mask: no leak, full parallelism.",
      ],
    },
    code: {
      title: "The generation loop",
      lang: "py",
      src: `import numpy as np

vocab = ["The", "cat", "sat", "on", "mat", "."]

def decoder_logits(token_ids):
    # Stands in for the causal transformer: returns scores for the NEXT token
    # at the last position. A real model computes these from attention over the prefix.
    table = {
        ("The",): [0.1, 3.0, 0.2, 0.1, 0.5, 0.0],
        ("The", "cat"): [0.0, 0.1, 2.5, 0.3, 0.2, 0.1],
        ("The", "cat", "sat"): [0.0, 0.0, 0.1, 2.8, 0.4, 0.6],
        ("The", "cat", "sat", "on"): [1.2, 0.1, 0.0, 0.1, 2.9, 0.2],
    }
    return np.array(table.get(tuple(vocab[i] for i in token_ids), [0, 0, 0, 0, 0, 3.0]))

ids = [0]                                   # prompt: "The"
for _ in range(5):
    logits = decoder_logits(ids)            # one forward pass over the prefix
    next_id = int(np.argmax(logits))        # greedy choice (Module 18 covers the alternatives)
    ids.append(next_id)                     # append and go round again
print(" ".join(vocab[i] for i in ids))`,
      lines: [
        { code: "logits = decoder_logits(ids)            # one forward pass over the prefix", say: "The decoder reads everything generated so far and scores the next token at the last position." },
        { code: "next_id = int(np.argmax(logits))        # greedy choice (Module 18 covers the alternatives)", say: "Pick a token from the scores. Greedy takes the highest; sampling is the alternative." },
        { code: "ids.append(next_id)                     # append and go round again", say: "The chosen token becomes part of the input for the next step. This loop is autoregressive generation." },
      ],
      output: "The cat sat on mat .",
    },
    useIt: "Every chat, code and writing assistant you will call is a decoder. Its one-directional view explains prompt design (put context before the question), its loop explains per-token latency and pricing, and its next-token objective explains both its fluency and its tendency to produce plausible falsehoods (Module 19).",
    takeaways: ["Decoders use causal attention and predict the next token at every position.", "Training is parallel over all positions; generation is a loop over the last position.", "Decoder-only models fold the prompt into the same sequence as the answer.", "Next-token prediction needs only raw text, so it scales to enormous data."],
    terms: [["decoder", "a transformer with causal attention trained to predict the next token"], ["logits", "the raw scores over the vocabulary before softmax (Module 18)"], ["autoregressive", "generating one token at a time, each conditioned on the previous ones"]],
    reflect: { q: "Why does training a decoder on a 4,000-token document give 4,000 training examples rather than one?", a: "Each position predicts its own next token under the causal mask, so every position is a separate prediction with its own loss, all computed in one pass. That is where the data efficiency of language-model pretraining comes from." },
  },

  "m16-encoder-decoder-architecture": {
    simple: "An encoder-decoder transformer reads the input with an encoder and writes the output with a decoder that cross-attends to the encoder's vectors; it is the natural shape for translation and summarisation.",
    concept:
      "The **encoder-decoder** layout is the original transformer. The encoder reads the source sequence with bidirectional attention and produces one vector per source token. The decoder generates the target sequence token by token with causal self-attention, and in every block it also has a **cross-attention** sub-layer (Module 15) whose queries come from the target and whose keys and values come from the encoder's output. So each target token can look at the whole source while being written.\n\nThe two halves have different jobs and can have different sizes. The encoder runs once per input; the decoder runs once per output token, reusing the encoder's vectors each time. That makes encoder-decoder models efficient when the input is long and the output short, such as summarising a report into three sentences.\n\nModels like T5 and the translation systems in production use this layout. Decoder-only models can do the same tasks by concatenating input and output, and at large scale they often win on flexibility, but the encoder-decoder shape remains the clearest match for 'sequence in, different sequence out'.",
    why:
      "Translation, summarisation, speech-to-text and question answering from a passage all have an input that should be understood fully before writing begins, and an output that is written left to right. Bidirectional encoding gives the best understanding; causal decoding gives correct generation; cross-attention joins them with an explicit alignment. Separating the halves also saves compute: the expensive reading of a long input happens once, while the cheap writing loop reuses it, and the alignment weights give an interpretable account of what each output token was based on.",
    how: [
      "Encoder: embed the source tokens, run N bidirectional blocks, keep the final vectors H_src.",
      "Decoder, per block: causal self-attention over the target so far, then cross-attention with queries from the target and keys/values from H_src, then the feed-forward network.",
      "Project the decoder's last position to vocabulary scores and choose the next target token.",
      "Append and repeat; H_src is computed once and reused for every target token.",
      "Training: feed the full target shifted by one position and score every position in parallel, as with any decoder.",
    ],
    visual: {
      kind: "flow",
      steps: ["source tokens → encoder (bidirectional) → H_src", "target so far → decoder self-attention (causal)", "cross-attention: target queries × H_src keys/values", "feed-forward → next target token", "append, repeat; H_src reused"],
      caption: "Read once, write many times, looking back at the reading each time.",
    },
    everyday: {
      title: "Dictating a summary after reading a report",
      text: "You read a ten-page report carefully, forming a picture of it (encoding). Then you dictate a short summary sentence by sentence, glancing back at specific pages as you need them (cross-attention) while keeping your dictation grammatical and in order (causal decoding). You do not re-read the whole report for every sentence; your understanding of it is already there.",
    },
    engineering: {
      title: "Translating product listings for twenty markets",
      text: "A marketplace translates listings into twenty languages with an encoder-decoder model. Each listing is encoded once; then twenty decoders, one per target language (or one decoder with a language tag), generate from the same encoding. Encoding a 300-token listing is the expensive step; generating 60-token translations reuses it, so adding a language costs little. The cross-attention maps are logged for quality checks: a translation whose tokens attend mostly to the wrong source phrase is flagged for human review before it goes live.",
    },
    maths: {
      formula: "H_src = Enc(source);   p(y_t | y_<t, source) = softmax(W · DecBlock(y_<t, H_src)[t])",
      meaning: "The encoder output is fixed; each target token's distribution depends on the previous targets and on H_src through cross-attention.",
      worked: [
        "Costs for a 1,000-token document summarised into 100 tokens with d = 512: encoding attention ≈ 1,000² · 512 ≈ 512 million score multiply-adds per block, done once.",
        "Each decoder step cross-attends 1 query to 1,000 keys: ≈ 1,000 · 512 ≈ 0.5 million per block, times 100 steps ≈ 51 million per block in total: a tenth of the encoding cost.",
        "A decoder-only model doing the same task would re-run attention over the 1,100-token sequence at training time and keep a 1,000-token KV cache at inference; comparable in practice, but the encoder-decoder split makes the one-off reading explicit.",
      ],
    },
    code: {
      title: "One decoder block with cross-attention",
      lang: "py",
      src: `import numpy as np

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V, causal=False):
    S = Q @ K.T / np.sqrt(K.shape[1])
    if causal:
        S = np.where(np.triu(np.ones_like(S, dtype=bool), 1), -np.inf, S)
    return softmax_rows(S) @ V

H_src = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # encoder output for "Le chat dort"
Y = np.array([[0.5, 0.5], [0.0, 1.0]])                   # target so far: "The", "cat"

y1 = Y + attention(Y, Y, Y, causal=True)                 # self-attention over the target (masked)
y2 = y1 + attention(y1, H_src, H_src)                    # cross-attention: target queries, source keys/values
y3 = y2 + np.tanh(y2)                                    # a stand-in feed-forward network
print(y3.round(2))`,
      lines: [
        { code: "y1 = Y + attention(Y, Y, Y, causal=True)                 # self-attention over the target (masked)", say: "First sub-layer: the target reads itself, left to right only." },
        { code: "y2 = y1 + attention(y1, H_src, H_src)                    # cross-attention: target queries, source keys/values", say: "Second sub-layer: the target reads the encoded source. Queries from Y, keys and values from H_src." },
        { code: "y3 = y2 + np.tanh(y2)                                    # a stand-in feed-forward network", say: "Third sub-layer: per-token processing. Real blocks use two linear layers with an activation." },
      ],
    },
    useIt: "Choose encoder-decoder for translation, summarisation, speech recognition and any task where a long input is transformed into a shorter output and alignment matters. Choose decoder-only for open-ended generation, chat and when one model must do many tasks from instructions. Many production translation and transcription systems are encoder-decoders; most assistants are decoder-only.",
    takeaways: ["Encoder reads bidirectionally once; decoder writes causally, cross-attending to the encoder output.", "Decoder blocks have three sub-layers: self-attention, cross-attention, feed-forward.", "Efficient when input is long and output short; the encoding is reused.", "Cross-attention weights give an interpretable alignment."],
    terms: [["encoder-decoder", "a transformer with a reading stack and a writing stack joined by cross-attention"], ["H_src", "the encoder's output vectors, one per source token, reused for every target token"]],
    reflect: { q: "A decoder-only model can translate by concatenating 'French: … English:'. What does it lose compared with an encoder-decoder?", a: "Bidirectional encoding of the source (early source tokens never see later ones), a separate reusable encoding, and an explicit alignment. It gains flexibility: the same model does any task from an instruction, which is why assistants are built that way." },
  },

  "m16-transformer-input-pipeline": {
    simple: "Before any attention happens, text is turned into token ids, the ids into embedding vectors, and position information is added, giving the n × d matrix the blocks work on.",
    concept:
      "The **input pipeline** is everything between a string and the first transformer block. Three steps. Tokenisation (Module 12) splits the text into tokens from the model's vocabulary and maps each to an integer id; 'The cat sat' might become [464, 3797, 3332]. Embedding looks each id up in a table of size vocabulary × d_model to get a d-dimensional vector (next lesson). Positional encoding (the lesson after) adds information about where each token sits, because attention on its own has no idea of order.\n\nThe result is a matrix X with one row per token and d_model columns. Everything the blocks do is a transformation of that matrix, and its shape never changes until the output projection. Special tokens are added here too: a beginning-of-sequence marker, separators between a system prompt and a user message, and padding to fill a batch to a common length, with a padding mask so the filler is ignored.\n\nThe pipeline is deterministic and fast; its choices (vocabulary, context length, special tokens) are fixed when the model is trained and must be reproduced exactly when it is used.",
    why:
      "Transformers compute with vectors, not characters, and attention is a set operation that would treat 'cat sat' and 'sat cat' identically without position information. So the input stage has to solve three problems: compress text into a manageable number of units, give each unit a learnable vector, and mark its position. Doing this consistently matters more than it looks: a different tokeniser, a missing special token or positions that exceed what the model saw in training all silently degrade quality, and most 'the model got worse after we changed something' bugs in deployed systems turn out to be input-pipeline mismatches.",
    how: [
      "Normalise the text as the tokeniser expects (Unicode form, whitespace handling).",
      "Tokenise into vocabulary ids; add special tokens for the start, segment boundaries and the chat format.",
      "Truncate or reject inputs longer than the context window; pad shorter sequences in a batch and build the padding mask.",
      "Look up each id in the embedding table to get its vector.",
      "Add positional information to each vector; the result is X, ready for block 1.",
    ],
    visual: {
      kind: "flow",
      steps: ["'The cat sat'", "tokens: [The] [cat] [sat]", "ids: [464, 3797, 3332]", "embeddings: 3 × d vectors", "+ positions 0, 1, 2", "X: 3 × d matrix → block 1"],
      caption: "Text to numbers to vectors to positioned vectors. The blocks never see text.",
    },
    everyday: {
      title: "Checking in luggage",
      text: "At the airport your bag is weighed, given a numbered tag, and a destination sticker is attached before it goes on the belt. The belt system only ever handles tagged, stickered bags; it never sees your name. The input pipeline tags each token with an id (the tag), gives it a vector (the bag's recorded contents) and a position sticker, and puts it on the belt into the first block.",
    },
    engineering: {
      title: "The quality drop that was a tokeniser version",
      text: "A team upgraded the serving library for a document model and saw accuracy fall by four points on their eval set with no model change. The new library shipped a tokeniser that normalised quotation marks differently, so a few percent of tokens became ids the model had rarely seen in training. Pinning the tokeniser version and adding a test that tokenises 200 fixed strings and compares the ids restored the accuracy. Their checklist now treats the input pipeline as part of the model: same tokeniser, same special tokens, same truncation rule, same maximum length.",
    },
    maths: {
      formula: "X = E[ids] + P[0 … n−1],   shape n × d_model",
      meaning: "Row i of X is the embedding of token id i plus the positional vector for position i.",
      worked: [
        "Vocabulary 32,000 and d_model = 512: the embedding table has 32,000 × 512 = 16.4 million numbers.",
        "'The cat sat' → 3 ids → 3 lookups → a 3 × 512 matrix; adding positions is 3 × 512 additions.",
        "A 4,096-token context with a batch of 8 gives X of shape 8 × 4,096 × 512 ≈ 16.8 million numbers in memory before the first block.",
      ],
    },
    code: {
      title: "From string to X",
      lang: "py",
      src: `import numpy as np

vocab = {"<bos>": 0, "The": 1, "cat": 2, "sat": 3, "<pad>": 4}
d = 4
rng = np.random.default_rng(1)
E = rng.normal(0, 0.1, (len(vocab), d))        # embedding table: vocab x d
P = rng.normal(0, 0.1, (8, d))                 # positional vectors for positions 0..7

def prepare(text, max_len=5):
    ids = [vocab["<bos>"]] + [vocab[w] for w in text.split()]
    ids = ids[:max_len]                                      # truncate to the context limit
    mask = [True] * len(ids) + [False] * (max_len - len(ids))   # real tokens vs padding
    ids = ids + [vocab["<pad>"]] * (max_len - len(ids))
    X = E[ids] + P[: max_len]                                # embeddings + positions
    return np.array(ids), np.array(mask), X

ids, mask, X = prepare("The cat sat")
print(ids, mask)
print(X.shape)`,
      lines: [
        { code: "ids = [vocab[\"<bos>\"]] + [vocab[w] for w in text.split()]", say: "Tokenise (here, naively by spaces) and add the beginning-of-sequence special token." },
        { code: "ids = ids[:max_len]                                      # truncate to the context limit", say: "Anything beyond the context window is cut; the model never sees it." },
        { code: "mask = [True] * len(ids) + [False] * (max_len - len(ids))   # real tokens vs padding", say: "The padding mask for attention: filler tokens must not be attended to." },
        { code: "X = E[ids] + P[: max_len]                                # embeddings + positions", say: "Table lookups plus positional vectors: the matrix the blocks work on." },
      ],
      output: "[0 1 2 3 4] [ True  True  True  True False]\n(5, 4)",
    },
    useIt: "You will configure this pipeline every time you serve or fine-tune a model: tokeniser version, chat template with its special tokens, maximum length and truncation side. Token counting for cost and context limits (Module 17) is this pipeline's first step, and most silent quality regressions in production trace back to it.",
    takeaways: ["Input pipeline: tokenise to ids, embed to vectors, add positions; result X is n × d.", "Special tokens, truncation and padding masks are set here and must match training.", "The blocks never see text, only X.", "Pin the tokeniser and test it like part of the model."],
    terms: [["special token", "a reserved vocabulary entry marking structure: start, separator, padding, end"], ["truncation", "cutting input that exceeds the context window"], ["embedding table", "the vocabulary × d matrix of learned token vectors"]],
    reflect: { q: "Why must the serving tokeniser be identical to the training tokeniser, when the text is the same?", a: "The model learned meanings for specific ids. A different split of the same text produces different ids, some of which the model saw rarely or never, so the embeddings it looks up carry the wrong or weak meanings." },
  },

  "m16-token-embeddings": {
    simple: "A token embedding is the learned vector looked up for each token id; the table of all of them is the model's first layer and often its largest single matrix.",
    concept:
      "A **token embedding** is a row in a learned table E of shape (vocabulary size × d_model). Token id 3797 means 'take row 3797'. The row is a vector of d numbers that the model adjusts during training so that tokens used in similar ways end up with similar vectors, the same idea as the word embeddings of Module 13, but now learned jointly with the whole transformer rather than separately.\n\nAt the start of training the table is random. Gradients from every prediction that involved a token flow back into its row, so frequent tokens get well-shaped vectors quickly and rare tokens stay noisier. In decoder models the same table is often reused at the output: the final projection to vocabulary scores uses Eᵀ, which ties input and output meanings together and saves parameters.\n\nThe embedding is the only place where the model's knowledge is attached to a specific token identity; everything after it works on vectors. That is why a token the model has never seen in training (a new product code, a rare name) starts from an almost meaningless vector and relies entirely on context to be understood.",
    why:
      "Transformers need a dense, learnable representation of each token so that similar tokens behave similarly and so that the rest of the network can compute with fixed-size vectors. A one-hot vector of size 32,000 would be wasteful and would make every token equally distant from every other. A learned table gives the model a geometry of meaning to start from, lets it share what it learns about 'cat' with what it learns about 'cats', and, because the table is trained end to end, shapes the vectors for exactly the predictions the model has to make.",
    how: [
      "Allocate a table E of size V × d (V = vocabulary size) and initialise it with small random numbers.",
      "For an input of n ids, gather the n rows: X_tok = E[ids].",
      "Add positional information and run the blocks; the prediction loss is computed.",
      "Backpropagation sends gradient to exactly the rows that were used; those rows move a little.",
      "Over training the rows organise: similar tokens cluster, and directions come to encode properties like number, tense or topic.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["id", "token", "embedding (first 4 of d numbers)"],
        rows: [
          ["464", "The", "[0.12, −0.03, 0.40, …]"],
          ["3797", "cat", "[0.55, 0.31, −0.08, …]"],
          ["17254", "cats", "[0.53, 0.29, −0.10, …]"],
          ["3332", "sat", "[−0.21, 0.44, 0.17, …]"],
        ],
      },
      caption: "Rows for 'cat' and 'cats' end up close because they are used alike. The table is learned, not written.",
    },
    everyday: {
      title: "Name tags that fill in over time",
      text: "On the first day at a new job everyone's name tag tells you nothing but a name. After months you have attached a rich picture to each one: who to ask about what, who sits near whom. The tag is the id; the picture is the embedding, and it was built from every interaction. Someone who joined last week still has a nearly blank picture, which is exactly how a rare token looks to a model.",
    },
    engineering: {
      title: "Adding product codes to a retail assistant",
      text: "A retailer's assistant handled questions about 'SKU-88213' badly: the code was split into several rare tokens whose embeddings carried almost no information. Two fixes were compared. Adding the codes as new vocabulary entries with freshly initialised embeddings and fine-tuning helped only after thousands of examples per code. Mapping each code to its product name in the prompt ('SKU-88213 (walnut side table)') helped immediately, because the name's tokens had rich embeddings. They shipped the second. The lesson: an embedding is only as good as the training data behind its token.",
    },
    maths: {
      formula: "X_tok = E[ids],   E ∈ ℝ^{V × d};   parameters in E = V · d",
      meaning: "The lookup selects rows; the table's size is vocabulary times width.",
      worked: [
        "V = 32,000, d = 4,096 (a 7-billion-parameter class model): E has 131 million numbers, about 2% of the model.",
        "V = 50,257, d = 768 (GPT-2 small): 38.6 million, about 31% of that small model. Embeddings dominate small models and are minor in large ones.",
        "Tying the output projection to Eᵀ saves another V · d parameters: 131 million in the first case.",
      ],
    },
    code: {
      title: "Lookup, and how gradients reach only the used rows",
      lang: "py",
      src: `import numpy as np
rng = np.random.default_rng(0)

V, d = 6, 3
E = rng.normal(0, 0.1, (V, d))               # the embedding table, learned
ids = np.array([1, 2, 2])                     # "cat", "sat", "sat"

X = E[ids]                                    # gather rows: 3 x d
print(X.shape)

# Suppose the loss wants each used row to move by g (a stand-in gradient)
g = np.array([[0.1, 0.0, -0.1], [0.0, 0.2, 0.0], [0.0, 0.2, 0.0]])
grad_E = np.zeros_like(E)
np.add.at(grad_E, ids, g)                     # scatter: rows 1 and 2 get gradient; row 2 twice
print(grad_E.round(2))`,
      lines: [
        { code: "X = E[ids]                                    # gather rows: 3 x d", say: "Embedding is a lookup: ids select rows. No arithmetic yet." },
        { code: "np.add.at(grad_E, ids, g)                     # scatter: rows 1 and 2 get gradient; row 2 twice", say: "Only used rows learn, and a token used twice gets twice the signal. Rare tokens stay near their random start." },
      ],
      output: "(3, 3)\n[[0.  0.  0. ]\n [0.1 0. -0.1]\n [0.  0.4 0. ]\n [0.  0.  0. ]\n [0.  0.  0. ]\n [0.  0.  0. ]]",
    },
    useIt: "Embedding size and vocabulary size set a model's memory footprint and explain why rare tokens, misspellings and codes are weak spots. When you fine-tune with new special tokens you must resize and initialise this table; when you build retrieval you may reuse an encoder's token embeddings as a starting point.",
    takeaways: ["A token embedding is a learned row in a V × d table, looked up by id.", "Trained end to end with the model; frequent tokens learn well, rare ones stay noisy.", "Often tied to the output projection.", "The only place token identity enters the model."],
    terms: [["embedding lookup", "selecting the row of the table that matches a token id"], ["weight tying", "reusing the embedding table as the output projection"]],
    reflect: { q: "Why is a misspelled word often handled worse than a rare but correctly spelled one?", a: "A misspelling is split into unusual fragments whose embeddings were rarely trained together, so the model starts from weaker vectors; a rare word at least has a consistent token with a consistent, if small, training signal." },
  },

  "m16-positional-encoding": {
    simple: "Positional encoding adds a position-dependent pattern to each token vector so attention, which otherwise ignores order, can tell first from last.",
    concept:
      "Attention treats the input as a set: if you shuffle the tokens, the scores between any pair are the same, so the outputs are just shuffled. Word order would be lost. **Positional encoding** fixes this by adding a vector that depends on position i to the embedding at position i, before the first block. After that, two identical tokens at different positions have different vectors, and attention can learn patterns like 'attend to the previous token'.\n\nThe original transformer used fixed sinusoidal encodings: coordinate 2k of position i holds sin(i / 10000^{2k/d}) and coordinate 2k+1 holds cos of the same. Low coordinates oscillate fast (every position differs), high coordinates slowly (they encode coarse position). The pattern has a useful property: the encoding of position i + k is a fixed linear function of the encoding of i, so relative offsets are easy for attention to pick up.\n\nAlternatives are learned position embeddings (a table of max-length rows, used by GPT-2 and BERT) and, in most current models, rotary position embeddings (RoPE), which rotate the query and key vectors by a position-dependent angle inside attention so that scores depend directly on the distance between tokens.",
    why:
      "Order carries meaning: 'dog bites man' and 'man bites dog' contain the same tokens. Recurrent models got order for free from reading sequentially; attention gave that up to gain parallelism, so order has to be put back explicitly. Sinusoids were chosen because they need no parameters, extend to any length in principle, and encode relative position in a form that a dot product can read. Later designs moved position inside attention (RoPE) because that generalises better to lengths longer than those seen in training, which matters as context windows grew from 512 tokens to hundreds of thousands.",
    how: [
      "For each position i from 0 to n−1 build a d-dimensional vector P[i].",
      "Sinusoidal: for coordinate pairs k, set P[i][2k] = sin(i / 10000^{2k/d}) and P[i][2k+1] = cos(i / 10000^{2k/d}).",
      "Add it to the token embedding: X[i] = E[token_i] + P[i].",
      "Run the blocks; attention can now compute scores that depend on position differences.",
      "Learned or rotary variants replace step 2 and 3: a learned table, or a rotation applied to Q and K in every attention layer.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["position", "sin(i/1)", "cos(i/1)", "sin(i/100)", "cos(i/100)"],
        rows: [
          ["0", "0.00", "1.00", "0.00", "1.00"],
          ["1", "0.84", "0.54", "0.01", "1.00"],
          ["2", "0.91", "−0.42", "0.02", "1.00"],
          ["3", "0.14", "−0.99", "0.03", "1.00"],
        ],
      },
      caption: "Sinusoidal encodings for d = 4. The first pair changes every step; the second pair changes slowly and encodes coarse position.",
    },
    everyday: {
      title: "Page numbers in a loose-leaf binder",
      text: "Pull the pages out of a binder and shuffle them; the words are all still there but the book is gone. Page numbers let you restore it, and they do more: from two page numbers you can tell how far apart two passages are. Positional encoding stamps a page number onto every token in a form arithmetic can use, so attention can say 'the token three before me' as easily as 'the token that mentions cats'.",
    },
    engineering: {
      title: "A model that fell apart beyond its training length",
      text: "A team deployed a document model trained on 2,048-token windows and let users send 4,000 tokens. Quality past position 2,048 collapsed: the learned position table had no rows beyond its training length, and padding it with new random rows gave the model positions it had never seen. They switched to a model using rotary embeddings and a length-extension technique that scales the rotation angles, which degraded gracefully to 8,000 tokens with modest fine-tuning. Positional design is now a line in their model-selection checklist, next to context length.",
    },
    maths: {
      formula: "P[i][2k] = sin(i / 10000^{2k/d}),   P[i][2k+1] = cos(i / 10000^{2k/d})",
      meaning: "Each pair of coordinates is a sine and cosine at a wavelength that grows geometrically with k.",
      worked: [
        "d = 4, so pairs k = 0 and k = 1 with wavelength factors 10000^0 = 1 and 10000^{2/4} = 100.",
        "Position 1: sin(1) = 0.84, cos(1) = 0.54, sin(1/100) = 0.01, cos(1/100) = 1.00 → P[1] = [0.84, 0.54, 0.01, 1.00].",
        "Position 2: sin(2) = 0.91, cos(2) = −0.42, sin(0.02) = 0.02, cos(0.02) = 1.00 → P[2] = [0.91, −0.42, 0.02, 1.00].",
        "Token 'cat' with embedding [0.5, 0.3, −0.1, 0.2] at position 2 enters the model as [1.41, −0.12, −0.08, 1.20]; the same token at position 1 would be [1.34, 0.84, −0.09, 1.20]: different vectors for the same word.",
      ],
    },
    code: {
      title: "Sinusoidal positions",
      lang: "py",
      src: `import numpy as np

def positional_encoding(n, d):
    P = np.zeros((n, d))
    for i in range(n):
        for k in range(d // 2):
            wavelength = 10000 ** (2 * k / d)
            P[i, 2 * k] = np.sin(i / wavelength)
            P[i, 2 * k + 1] = np.cos(i / wavelength)
    return P

P = positional_encoding(4, 4)
print(P.round(2))

cat = np.array([0.5, 0.3, -0.1, 0.2])
print((cat + P[1]).round(2), (cat + P[2]).round(2))   # same token, two positions`,
      lines: [
        { code: "wavelength = 10000 ** (2 * k / d)", say: "Coordinate pairs get geometrically longer wavelengths: fast oscillation first, slow last." },
        { code: "P[i, 2 * k] = np.sin(i / wavelength)", say: "Sine for even coordinates, cosine for odd; together they encode position as an angle." },
        { code: "print((cat + P[1]).round(2), (cat + P[2]).round(2))   # same token, two positions", say: "The addition makes 'cat' at position 1 and 'cat' at position 2 distinguishable to attention." },
      ],
      output: "[[ 0.    1.    0.    1.  ]\n [ 0.84  0.54  0.01  1.  ]\n [ 0.91 -0.42  0.02  1.  ]\n [ 0.14 -0.99  0.03  1.  ]]\n[1.34 0.84 -0.09 1.2 ] [1.41 -0.12 -0.08 1.2 ]",
    },
    useIt: "Positional scheme determines how a model behaves beyond its training length, which you will care about when choosing models for long documents and when reading about context extension. Model cards state it (learned, sinusoidal, RoPE, ALiBi); it also explains why some models lose accuracy on information placed in the middle of very long prompts.",
    takeaways: ["Attention ignores order; positional encoding adds it to each token vector.", "Sinusoidal encodings are fixed, parameter-free and encode relative offsets.", "Learned tables are limited to the training length; rotary embeddings extend better.", "Same token at different positions enters the model as different vectors."],
    terms: [["positional encoding", "a position-dependent vector added to token embeddings"], ["rotary position embedding (RoPE)", "rotating queries and keys by position so scores depend on relative distance"], ["context extension", "techniques for using a model beyond its training length"]],
    reflect: { q: "Without positional encoding, could a transformer still tell that 'sat' follows 'cat'?", a: "No. Attention scores depend only on content, so the model would see a bag of tokens. The causal mask leaks a little order (earlier tokens see fewer others), which is why some decoder models can work with no explicit positions, but weakly." },
  },

  "m16-self-attention-layer": {
    simple: "The self-attention sub-layer is multi-head attention wrapped with a residual connection and layer normalisation: tokens exchange information, then the original is added back and the result is rescaled.",
    concept:
      "Inside a transformer block, the first sub-layer is the **self-attention layer**: multi-head self-attention from Module 15, plus two pieces of plumbing. The **residual connection** adds the sub-layer's input to its output, so the token keeps its own vector and gains context rather than being replaced. **Layer normalisation** rescales each token's vector to a standard size so the numbers stay well-behaved as blocks stack. Those two are covered in their own lessons; here the point is how the attention sub-layer fits.\n\nThe sub-layer's job is communication. It is the only place in the block where position i reads position j. Everything else in the block works on one position at a time. So if a fact needs to travel from the word 'Lisbon' to the word 'there', it travels in a self-attention layer, possibly across several blocks.\n\nIn decoder models the self-attention carries the causal mask; in encoders it does not. Modern implementations place the normalisation before the attention (pre-norm), which trains more stably in deep stacks; the original placed it after (post-norm).",
    why:
      "Attention alone produces a weighted average of value vectors, which is a different kind of thing from the input: it has lost the token's own identity and its scale depends on the weights. The residual keeps identity; normalisation keeps scale. Together they let dozens of attention layers be stacked without the signal exploding, vanishing or drifting, which is the problem that stopped deep networks before these tricks (Module 9). The sub-layer structure is the same in every block, so one well-tuned design works at any depth.",
    how: [
      "Take the block's input X (n × d).",
      "Pre-norm: compute LayerNorm(X).",
      "Run multi-head self-attention on the normalised input, with the causal mask if this is a decoder.",
      "Add the result to the original X: X₁ = X + Attention(LayerNorm(X)).",
      "Pass X₁ to the feed-forward sub-layer.",
    ],
    visual: {
      kind: "flow",
      steps: ["X", "LayerNorm", "multi-head self-attention (mask if decoder)", "+ X (residual)", "X₁ → feed-forward sub-layer"],
      caption: "Pre-norm arrangement, used by most current models.",
    },
    everyday: {
      title: "Taking notes in a meeting without losing your own view",
      text: "You go into a meeting with your own opinion written down. You listen, take notes on what others said that matters to you, and add those notes beside your opinion rather than crossing it out. Then you tidy the page so it fits on one sheet. Listening is attention; adding beside is the residual; tidying is normalisation. You leave with your view plus context, legibly.",
    },
    engineering: {
      title: "Where a long-document model spends its time",
      text: "Profiling a 32-block model on 8,000-token inputs showed the self-attention sub-layers taking 70% of the time, although they hold only a third of the parameters. The reason is the n² score matrix: at 8,000 tokens, each head computes 64 million scores per block, and the feed-forward layers, being per token, scale only with n. The team's optimisation effort went entirely into the attention sub-layer (fused kernels and a KV cache), and latency fell by half with no change to the model's weights. Knowing which sub-layer does what pointed them to the right place.",
    },
    maths: {
      formula: "X₁ = X + MultiHead(LayerNorm(X))",
      meaning: "The sub-layer output is the input plus the attention of its normalised version; the shape stays n × d.",
      worked: [
        "d = 512, 8 heads: attention parameters per sub-layer ≈ 4 · 512² = 1,048,576, plus 2 · 512 = 1,024 for layer-norm scale and shift.",
        "Compute per sub-layer for n tokens: projections ≈ 4 · n · 512² plus scores ≈ 2 · n² · 512. At n = 512 the two are equal; at n = 8,000 the scores term is 16 times larger.",
        "Running example, V = X and weights for 'sat' [0.25, 0.25, 0.50]: attention output [0.75, 0.75]; residual adds X[2] = [1, 1] → [1.75, 1.75] before normalisation.",
      ],
    },
    code: {
      title: "The sub-layer with residual and pre-norm",
      lang: "py",
      src: `import numpy as np

def layer_norm(X, eps=1e-5):
    mean = X.mean(axis=1, keepdims=True)
    var = X.var(axis=1, keepdims=True)
    return (X - mean) / np.sqrt(var + eps)

def softmax_rows(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def self_attention(Xn, causal=True):           # single head, identity projections for clarity
    S = Xn @ Xn.T / np.sqrt(Xn.shape[1])
    if causal:
        S = np.where(np.triu(np.ones_like(S, dtype=bool), 1), -np.inf, S)
    return softmax_rows(S) @ Xn

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
X1 = X + self_attention(layer_norm(X))           # residual around attention on the normalised input
print(X1.round(2))`,
      lines: [
        { code: "def self_attention(Xn, causal=True):           # single head, identity projections for clarity", say: "The communication step. In a real block this is multi-head with learned projections." },
        { code: "X1 = X + self_attention(layer_norm(X))           # residual around attention on the normalised input", say: "Normalise, attend, add back the original. The whole sub-layer in one line." },
      ],
      note: "Layer-norm of a 2-d vector is degenerate (it always gives ±1), so the numbers here are illustrative; with d = 512 it behaves as intended.",
    },
    useIt: "The attention sub-layer is where latency goes for long inputs and where the KV cache lives, so it is the part you tune when serving (Module 40). It is also where interpretability work happens: heads and their weights are read from this sub-layer.",
    takeaways: ["Self-attention sub-layer = LayerNorm → multi-head attention → residual add.", "It is the block's only cross-position step; all else is per token.", "Residual keeps identity, normalisation keeps scale.", "Its cost grows with n², so it dominates on long inputs."],
    terms: [["sub-layer", "one of the two halves of a transformer block, with its own residual and normalisation"], ["pre-norm", "applying layer normalisation before the sub-layer rather than after"]],
    reflect: { q: "If you removed the residual connection around attention in every block, what would stacking 32 blocks do to a token's vector?", a: "Each block would replace the vector with a weighted average of others, so after many blocks every position would converge toward the same averaged vector and lose its identity. Residuals prevent this collapse." },
  },

  "m16-feedforward-network": {
    simple: "The feed-forward network is a two-layer network applied to each token separately: it expands the vector, applies a non-linearity, and projects back; it holds most of a transformer's parameters.",
    concept:
      "The second sub-layer of each block is the **feed-forward network** (FFN), sometimes called the MLP. It takes one token's vector (d numbers), multiplies by W₁ to expand it to a hidden size d_ff (usually 4·d), applies an activation such as ReLU or GELU (Module 7), and multiplies by W₂ to bring it back to d. The same two matrices are used for every position, but each position is processed independently; no information moves between tokens here.\n\nWhy expand and contract? The hidden layer gives the network room to detect many features of the token's current vector at once (d_ff detectors), and the non-linearity lets it respond to combinations. Research into trained models finds that FFN neurons act like keys and values of a memory: a neuron fires on a particular pattern (a key) and writes a particular direction into the output (a value). Facts such as 'the capital of France' appear to be stored largely in FFN layers.\n\nWith d_ff = 4·d, the FFN has 8·d² parameters per block against 4·d² for attention, so two-thirds of a transformer's weights sit in its feed-forward networks.",
    why:
      "Attention mixes vectors but cannot change what a single vector means in a non-linear way: a weighted average of inputs stays within the span of the inputs. To compute 'this token is now a plural noun whose referent is an animal', the model needs a per-token non-linear transformation, and that is the FFN. Alternating the two gives the transformer its power: attention gathers the right information to each position; the FFN turns gathered information into new features and stored knowledge. The expansion factor of four was found empirically and has stayed standard.",
    how: [
      "Take the sub-layer input X₁ (after the attention sub-layer), normalise it.",
      "Expand: H = activation(LayerNorm(X₁) · W₁ + b₁), where W₁ is d × d_ff.",
      "Contract: F = H · W₂ + b₂, where W₂ is d_ff × d.",
      "Residual: X₂ = X₁ + F. This is the block's output.",
      "Every row (token) goes through the same W₁, W₂ independently, so this step is embarrassingly parallel.",
    ],
    visual: {
      kind: "flow",
      steps: ["token vector (d = 512)", "× W₁ → 2048 hidden units", "GELU", "× W₂ → back to 512", "+ residual"],
      caption: "Expand, bend, contract, add. Per token, same weights everywhere.",
    },
    everyday: {
      title: "A specialist desk after the meeting",
      text: "After the meeting (attention) each reporter sits alone and works through their notes: they check them against what they know, draw conclusions, and write new lines that were in nobody's notes. That private work, done by everyone separately with the same training, is the feed-forward network. The room shares information; the desk produces new understanding from it.",
    },
    engineering: {
      title: "Fact storage and the FFN",
      text: "An interpretability team studying a 7-billion-parameter model located the FFN neurons in middle layers that activated for 'the Eiffel Tower is in'. By editing a handful of those neurons' output directions they changed the model's answer to 'Rome' while leaving unrelated facts intact, a technique now used to patch outdated facts cheaply. They also found that trimming FFN hidden units that almost never activated cut 20% of parameters with a negligible accuracy loss. Both results depended on the FFN being a per-token memory, separate from attention's routing.",
    },
    maths: {
      formula: "FFN(x) = GELU(x·W₁ + b₁)·W₂ + b₂,   W₁ ∈ ℝ^{d × d_ff},   W₂ ∈ ℝ^{d_ff × d}",
      meaning: "Two linear maps with a non-linearity between, applied to one token's vector.",
      worked: [
        "d = 512, d_ff = 2048: W₁ has 512 · 2048 = 1,048,576 parameters; W₂ the same; total ≈ 2.1 million per block, double the attention sub-layer's 1.05 million.",
        "Tiny example, d = 2, d_ff = 3, x = [1, 1], W₁ = [[1, −1, 0.5], [0, 1, 0.5]], b₁ = 0: x·W₁ = [1, 0, 1]; ReLU → [1, 0, 1].",
        "W₂ = [[1, 0], [0, 1], [0.5, 0.5]]: [1, 0, 1]·W₂ = [1.5, 0.5]. Add the residual x: [2.5, 1.5]. The token's vector changed direction; attention alone could not have done that.",
      ],
    },
    code: {
      title: "The FFN on every token at once",
      lang: "py",
      src: `import numpy as np

def gelu(z):
    return 0.5 * z * (1 + np.tanh(np.sqrt(2 / np.pi) * (z + 0.044715 * z ** 3)))

d, d_ff = 2, 3
W1 = np.array([[1.0, -1.0, 0.5], [0.0, 1.0, 0.5]])   # d x d_ff: expand
W2 = np.array([[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]])   # d_ff x d: contract

X1 = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # three tokens after attention
H = gelu(X1 @ W1)              # (3, 3): each token expanded independently
F = H @ W2                     # (3, 2): back to d
X2 = X1 + F                    # residual
print(H.round(2))
print(X2.round(2))`,
      lines: [
        { code: "W1 = np.array([[1.0, -1.0, 0.5], [0.0, 1.0, 0.5]])   # d x d_ff: expand", say: "The expansion matrix: d_ff feature detectors over the token's vector." },
        { code: "H = gelu(X1 @ W1)              # (3, 3): each token expanded independently", say: "One matrix multiply handles all tokens, but no row reads another: per-token processing." },
        { code: "X2 = X1 + F                    # residual", say: "Add the new features to the token's vector. This is the block's output." },
      ],
      output: "[[ 0.84 -0.16  0.35]\n [ 0.    0.84  0.35]\n [ 0.84  0.    0.84]]\n[[2.02 0.02]\n [0.17 2.01]\n [2.26 1.42]]",
    },
    useIt: "FFN size (d_ff) and the activation are listed on every model card; FFN layers are where mixture-of-experts models (Module 47) place their experts, where most pruning and quantisation gains come from, and where fact-editing techniques operate. When a model 'knows' something, the FFN is probably where.",
    takeaways: ["FFN = expand (d → 4d), non-linearity, contract (4d → d), per token, with a residual.", "It gives the block non-linear per-token computation that attention cannot do.", "Holds about two-thirds of a transformer's parameters.", "Behaves like a key–value memory where facts are stored."],
    terms: [["feed-forward network (FFN)", "the per-token two-layer network in each block"], ["d_ff", "the hidden width of the FFN, usually 4 × d_model"], ["GELU", "a smooth activation function used in most transformers"]],
    reflect: { q: "Why does an FFN with d_ff = 4d not need to see other tokens?", a: "Because attention already delivered the relevant information from other tokens into this token's vector. The FFN's job is to compute with what has arrived, which is a per-token operation by design." },
  },

  "m16-residual-connections-in-transformers": {
    simple: "Every sub-layer's output is added to its input, so each block refines a running 'residual stream' instead of replacing it, which keeps deep stacks trainable.",
    concept:
      "A **residual connection** (Module 9) in a transformer means that each sub-layer computes a correction and adds it to what came in: X_out = X_in + SubLayer(X_in). Over a whole model this creates the **residual stream**: a single n × d matrix that flows from the embeddings to the output, with every attention and feed-forward sub-layer reading from it and writing a small update back.\n\nTwo consequences. Gradients have a direct path from the loss to every block, because the derivative of X_in + f(X_in) with respect to X_in contains a 1 that does not shrink; this is why 100-block models train at all. And the model becomes additive: the final vector for a token is its embedding plus the sum of every update any sub-layer wrote. Interpretability research reads models this way, asking which sub-layer wrote the direction that produced an answer.\n\nResiduals also set a constraint: every sub-layer must output exactly d numbers per token, because it is added to a d-vector. That is why the FFN contracts back to d and why multi-head attention ends with W_O.",
    why:
      "Without residuals, a 32-block transformer would be a 64-sub-layer composition of functions, and gradients would have to pass through all 64 multiplications to reach the embeddings, vanishing or exploding on the way. Early deep networks failed exactly like that. Residuals make every sub-layer optional at initialisation (if its weights are near zero it adds nothing and the stream passes through unchanged) so depth costs nothing until a layer learns to be useful. They also make the function the model computes smoother to optimise, which is why transformers scale with depth where older designs plateaued.",
    how: [
      "Start the residual stream as X⁰ = embeddings + positions.",
      "For each sub-layer s, compute an update u_s = SubLayer_s(LayerNorm(X)) and set X ← X + u_s.",
      "Attention updates move information between positions; FFN updates add per-token features.",
      "After the last block, the stream X is normalised once more and projected to the vocabulary.",
      "Backpropagation sends the output gradient straight down the stream to every sub-layer and the embeddings.",
    ],
    visual: {
      kind: "flow",
      steps: ["X⁰ = embed + pos", "+ attn₁ update", "+ ffn₁ update", "+ attn₂ update", "… + ffn_N update", "LayerNorm → vocabulary scores"],
      caption: "One stream, many small additions. Each sub-layer reads the stream and writes back a correction.",
    },
    everyday: {
      title: "A shared document with tracked changes",
      text: "A team edits one document in turn. Nobody rewrites it from scratch; each person adds a few changes on top of what is there. If one editor has nothing to add, the document passes through unchanged. At the end you can see exactly who contributed which sentence. The residual stream is that document; each sub-layer is one editor's pass.",
    },
    engineering: {
      title: "Skipping layers to serve faster",
      text: "A latency-sensitive team found that for easy inputs, the residual stream barely changed after block 20 of 32: the later updates were tiny. They added an early-exit rule: if the stream's change in a block falls below a threshold, skip the remaining blocks and project the current stream to the output. Because the stream is additive, exiting early simply omits small corrections rather than breaking the computation. Average latency fell 35% with a 0.4-point accuracy cost on their benchmark, which they accepted for the interactive product and not for the batch one.",
    },
    maths: {
      formula: "X^{L} = X^{0} + Σ_{s=1}^{2N} u_s,   ∂X^{L}/∂X^{0} = I + Σ ∂u_s/∂X^{0}",
      meaning: "The final stream is the initial embedding plus all updates; its derivative contains the identity, so gradient always has a path of strength 1.",
      worked: [
        "Running example: 'sat' enters as X⁰ = [1, 1]. Attention update (from the earlier calculation, before normalisation effects) ≈ [−0.25, −0.25] giving [0.75, 0.75]; with the residual the stream is [1, 1] + [−0.25, −0.25]… in a real block the update is computed on the normalised input and added to the raw stream.",
        "Suppose each of 64 sub-layers scales gradient by 0.9 when composed without residuals: 0.9⁶⁴ ≈ 0.001. With residuals the direct path contributes 1 regardless of depth.",
        "Norm growth: if each update has typical size 0.1 relative to the stream, after 64 updates the stream has grown; layer normalisation at each sub-layer input keeps the reads at a fixed scale.",
      ],
    },
    code: {
      title: "Reading a model as a sum of updates",
      lang: "py",
      src: `import numpy as np
rng = np.random.default_rng(3)

d = 4
x0 = rng.normal(0, 1, d)                          # X0: embedding + position for one token
stream = x0.copy()
updates = []
for s in range(6):                                # three blocks x two sub-layers
    u = rng.normal(0, 0.2, d)                     # a stand-in sub-layer update
    updates.append(u)
    stream = stream + u                           # the residual add

print(np.allclose(stream, x0 + sum(updates)))     # final = embedding + every update
largest = int(np.argmax([np.linalg.norm(u) for u in updates]))
print("sub-layer with the biggest contribution:", largest)`,
      lines: [
        { code: "stream = stream + u                           # the residual add", say: "Every sub-layer adds to the same stream; nothing is overwritten." },
        { code: "largest = int(np.argmax([np.linalg.norm(u) for u in updates]))", say: "Because the final vector is a sum, you can ask which sub-layer contributed most: the basis of many interpretability methods." },
      ],
      output: "True\nsub-layer with the biggest contribution: 4",
    },
    useIt: "The residual stream is the mental model behind layer skipping, early exit, model editing, activation steering and most interpretability tools you will read about. It also explains why you can delete or swap a block in a fine-tuned model and the model degrades gracefully rather than failing.",
    takeaways: ["Each sub-layer adds an update to the residual stream rather than replacing it.", "Gradients get a direct path of strength 1 to every block, so depth is trainable.", "The model is additive: final vector = embedding + all updates.", "Every sub-layer must output d numbers per token to be added."],
    terms: [["residual stream", "the running n × d matrix that every sub-layer reads from and adds to"], ["early exit", "stopping after fewer blocks when the stream has stopped changing much"]],
    reflect: { q: "At initialisation a sub-layer's weights are small. What does the block compute then, and why is that helpful?", a: "Almost the identity: the update is near zero and the stream passes through. Training can then grow each sub-layer's contribution from nothing, which is far easier to optimise than starting from a deep composition that scrambles the input." },
  },

  "m16-layer-normalisation-in-transformers": {
    simple: "Layer normalisation rescales each token's vector to zero mean and unit spread before each sub-layer, so values stay in a stable range no matter how deep the model or how long the input.",
    concept:
      "**Layer normalisation** (Module 9) acts on one token's vector at a time: subtract the mean of its d numbers, divide by their standard deviation, then multiply by a learned scale γ and add a learned shift β. In a transformer it is applied at the input of every sub-layer (pre-norm) and once more before the output projection. Unlike batch normalisation it needs no statistics across examples, so it works for any batch size, any sequence length and at generation time with one token.\n\nIts job is to keep the residual stream readable. The stream grows as updates accumulate, and different tokens can have very different magnitudes. Each sub-layer wants inputs of a consistent size so that its weights, tuned once, work everywhere. Normalising the read, but not the stream itself, gives the sub-layer a clean input while the stream keeps its additive history.\n\nA common variant, RMSNorm, skips the mean subtraction and divides by the root mean square only; it is slightly cheaper and used in many recent models. Both are 'normalisation' in model cards.",
    why:
      "Deep stacks amplify small differences: without normalisation, the values flowing through block 30 might be a hundred times larger than at block 1 for some tokens and tiny for others, making one learning rate wrong for everyone and softmax inside attention either saturated or flat. Batch normalisation, which worked for vision, breaks on variable-length sequences and tiny batches. Layer normalisation computes everything from the token's own vector, so it is deterministic, length-independent and available during one-token-at-a-time generation. Placing it before each sub-layer (pre-norm) rather than after was the change that let models go from 12 to 100 blocks without careful warm-up schedules.",
    how: [
      "Take one token's d-vector x from the residual stream.",
      "Compute its mean μ and variance σ² over the d coordinates.",
      "Normalise: x̂ = (x − μ) / √(σ² + ε), with a tiny ε for safety.",
      "Scale and shift with learned vectors: y = γ ⊙ x̂ + β.",
      "Feed y to the sub-layer; the stream itself is left unnormalised and receives the sub-layer's update.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Token vector", detail: "[2.0, 4.0, 6.0, 8.0]" },
        { label: "Mean and spread", detail: "μ = 5.0, σ = 2.24" },
        { label: "Normalise", detail: "[−1.34, −0.45, 0.45, 1.34]" },
        { label: "Scale and shift (γ = 1, β = 0)", detail: "unchanged; learned γ, β can rescale any coordinate" },
      ],
      caption: "Whatever size the vector arrived at, the sub-layer sees a standard one.",
    },
    everyday: {
      title: "Adjusting the volume between songs",
      text: "A playlist mixes a quiet acoustic track with a loud rock track. Automatic volume levelling brings each song to the same loudness before it plays, so you are not blasted or straining, and the songs themselves are not altered on the album. Layer normalisation levels each token's vector before each sub-layer listens to it, while the residual stream keeps the original recording.",
    },
    engineering: {
      title: "A training run saved by moving the norm",
      text: "A team training a 24-block model from scratch with post-norm (the original placement) saw loss diverge after a few thousand steps unless they used a long learning-rate warm-up and a small peak rate. Switching to pre-norm, normalising the input of each sub-layer instead of its output, let them train with a higher learning rate and no instability, and the run finished 30% faster. Their later models use RMSNorm for a small extra speed-up. Normalisation placement is now a fixed part of their architecture template.",
    },
    maths: {
      formula: "LN(x) = γ ⊙ (x − μ) / √(σ² + ε) + β,   μ = (1/d) Σ x_i,   σ² = (1/d) Σ (x_i − μ)²",
      meaning: "Per token: centre, scale to unit variance, then apply a learned per-coordinate scale and shift.",
      worked: [
        "x = [2, 4, 6, 8]: μ = 5; deviations [−3, −1, 1, 3]; σ² = (9 + 1 + 1 + 9) / 4 = 5; σ = 2.236.",
        "x̂ = [−3, −1, 1, 3] / 2.236 = [−1.34, −0.45, 0.45, 1.34].",
        "With γ = [1, 1, 2, 1] and β = [0, 0, 0, 0.5]: y = [−1.34, −0.45, 0.89, 1.84]. The learned parameters let the model undo or reshape the normalisation where useful.",
        "Parameters per norm: 2·d = 1,024 at d = 512; negligible beside the sub-layers.",
      ],
    },
    code: {
      title: "Layer norm and RMSNorm",
      lang: "py",
      src: `import numpy as np

def layer_norm(x, gamma, beta, eps=1e-5):
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return gamma * (x - mu) / np.sqrt(var + eps) + beta

def rms_norm(x, gamma, eps=1e-5):
    rms = np.sqrt((x ** 2).mean(axis=-1, keepdims=True) + eps)
    return gamma * x / rms

x = np.array([[2.0, 4.0, 6.0, 8.0], [0.1, 0.2, 0.3, 0.4]])   # two tokens, very different sizes
g, b = np.ones(4), np.zeros(4)
print(layer_norm(x, g, b).round(2))
print(rms_norm(x, g).round(2))`,
      lines: [
        { code: "mu = x.mean(axis=-1, keepdims=True)", say: "Statistics over the token's own coordinates, not over the batch." },
        { code: "return gamma * (x - mu) / np.sqrt(var + eps) + beta", say: "Centre, scale, then learned γ and β." },
        { code: "print(layer_norm(x, g, b).round(2))", say: "Two tokens of wildly different magnitude come out on the same scale." },
      ],
      output: "[[-1.34 -0.45  0.45  1.34]\n [-1.34 -0.45  0.45  1.34]]\n[[0.37 0.73 1.1  1.46]\n [0.37 0.73 1.1  1.46]]",
    },
    useIt: "Normalisation type and placement appear in model configs (LayerNorm vs RMSNorm, pre vs post) and matter when you fine-tune (their small γ, β parameters are often among the few trained in parameter-efficient methods) and when you quantise, because normalisation outputs are where outlier values appear.",
    takeaways: ["Layer norm standardises each token's vector per sub-layer input; learned γ and β restore flexibility.", "Needs no batch statistics, so it works at any length and during generation.", "Pre-norm placement made very deep transformers trainable.", "RMSNorm is a cheaper variant used by many recent models."],
    terms: [["layer normalisation", "per-token standardisation with learned scale and shift"], ["RMSNorm", "normalisation by root mean square only, without centring"], ["γ, β", "the learned scale and shift vectors of a normalisation layer"]],
    reflect: { q: "Why is the residual stream itself not normalised, only the sub-layer inputs?", a: "Normalising the stream would erase the accumulated magnitudes that encode how strongly earlier layers wrote, and would put a non-identity operation on the gradient path. Normalising the reads keeps the sub-layers stable while the stream stays additive." },
  },

  "m16-output-projection": {
    simple: "The output projection turns each position's final vector into one score per vocabulary token; softmax over those scores gives the probability of each possible next token.",
    concept:
      "After the last block and a final normalisation, each position holds a d-dimensional vector. The **output projection** (also called the unembedding or language-model head) multiplies it by a matrix W_out of shape d × V to produce V numbers, one per vocabulary entry. These are the **logits**: raw, unnormalised scores. Softmax converts them to probabilities that sum to 1 over the vocabulary.\n\nIn many decoder models W_out is the transpose of the input embedding table (weight tying), so a position's vector is scored by its dot product with every token's embedding: the next token is the one whose embedding the model's final vector points toward most. That ties input and output meaning together and saves V·d parameters.\n\nFor encoders used for classification, this projection is replaced by a small task head. For decoders it is the last step before decoding (Module 18): at training, every position's logits are compared with the true next token; at generation, only the last position's logits are used to choose what comes next.",
    why:
      "Everything inside the transformer works in a d-dimensional space that has no direct meaning. To make a prediction the model has to map that space back onto the vocabulary, and a linear projection is the simplest map that lets every token compete on an equal footing. Tying it to the embedding table adds a sensible bias: tokens that enter the model similarly are predicted similarly. The logits being raw scores rather than probabilities is deliberate: softmax, temperature and the other decoding controls all operate on logits, so keeping them separate gives the decoding stage its dials.",
    how: [
      "Take the final residual stream X^L (n × d) and apply the final layer normalisation.",
      "Multiply by W_out (d × V): logits = LN(X^L) · W_out, shape n × V.",
      "For training, compute softmax at every position and the cross-entropy against the actual next tokens.",
      "For generation, take the last row of logits, apply temperature and sampling rules, and pick a token.",
      "If weights are tied, W_out = Eᵀ, so each logit is the dot product of the final vector with a token's embedding.",
    ],
    visual: {
      kind: "flow",
      steps: ["final vector for the last position (d = 512)", "× W_out (512 × 32,000)", "32,000 logits", "softmax", "probabilities: 'on' 0.62, 'down' 0.21, …"],
      caption: "One matrix multiply turns a point in model space into a bet over every token.",
    },
    everyday: {
      title: "The scoreboard at the end of a talent show",
      text: "The judges' notes on each act are rich and in their own shorthand. At the end they must be turned into one score per contestant so a winner can be read off. The output projection is that step: the model's internal notes about the current position become one score per possible next token, and softmax turns scores into odds.",
    },
    engineering: {
      title: "Restricting the vocabulary at the output for a structured task",
      text: "A team generating SQL from questions found the model occasionally emitted tokens that could never be valid SQL. Since the output projection produces a logit for every token, they masked the logits of tokens not allowed by their grammar at each step (setting them to −∞ before softmax), a technique called constrained decoding. The model's internal computation was untouched; only the final scoring changed. Invalid-SQL rates dropped from 6% to 0% and the approach cost nothing at training time. Understanding that the projection is a plain linear step over the vocabulary made the fix obvious.",
    },
    maths: {
      formula: "logits = LN(X^L) · W_out,   p(token v) = e^{logit_v} / Σ_u e^{logit_u}",
      meaning: "A d × V matrix gives one score per token; softmax normalises across the whole vocabulary.",
      worked: [
        "A toy vocabulary of five tokens; the final vector's logits are [4.0, 2.0, 1.0, 0.5, 0.0] for [Paris, Lyon, the, a, London] after 'The capital of France is'.",
        "Exponentials: e⁴ = 54.6, e² = 7.39, e¹ = 2.72, e^0.5 = 1.65, e⁰ = 1.00; total 67.36.",
        "Probabilities: 0.81, 0.11, 0.04, 0.02, 0.01. Module 18 reuses exactly these numbers for temperature and top-p.",
        "Cost: with d = 4,096 and V = 32,000 the projection is 131 million multiply-adds per position, often the single largest matrix multiply at generation time.",
      ],
    },
    code: {
      title: "From final vector to probabilities",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
d = 3
E = np.array([[1.0, 0.5, 0.0],      # Paris
              [0.6, 0.4, 0.0],      # Lyon
              [0.0, 0.0, 1.0],      # the
              [0.0, 0.2, 0.8],      # a
              [0.2, 0.0, 0.0]])     # London
W_out = E.T                          # tied weights: d x V

final_vector = np.array([3.5, 1.0, 0.8])          # the last position's normalised stream
logits = final_vector @ W_out                     # one score per token
probs = np.exp(logits - logits.max()); probs /= probs.sum()
for t, l, p in zip(vocab, logits, probs):
    print(f"{t:7s} logit {l:5.2f}  prob {p:.3f}")`,
      lines: [
        { code: "W_out = E.T                          # tied weights: d x V", say: "The output matrix is the embedding table transposed: each token is scored by how well the final vector matches its embedding." },
        { code: "logits = final_vector @ W_out                     # one score per token", say: "The projection: five logits from a three-dimensional vector." },
        { code: "probs = np.exp(logits - logits.max()); probs /= probs.sum()", say: "Softmax over the vocabulary gives the next-token distribution." },
      ],
      output: "Paris   logit  4.00  prob 0.745\nLyon    logit  2.50  prob 0.166\nthe     logit  0.80  prob 0.030\na       logit  0.84  prob 0.032\nLondon  logit  0.70  prob 0.027",
    },
    useIt: "The logits are where decoding controls operate: temperature, top-k, top-p, repetition penalties, stop sequences and grammar constraints all edit this vector before softmax (Module 18). Log-probabilities returned by APIs are this distribution; token-level confidence and calibration work reads it.",
    takeaways: ["The output projection maps the final d-vector to V logits, one per token.", "Softmax over the logits gives next-token probabilities.", "Often tied to the embedding table.", "Decoding controls and constraints act on the logits."],
    terms: [["output projection (unembedding)", "the d × V matrix producing vocabulary scores"], ["logit", "a raw score for one vocabulary token before softmax"], ["constrained decoding", "masking logits of tokens a grammar forbids"]],
    reflect: { q: "Why is the projection often the most expensive single step at generation time even though attention has the n² cost?", a: "Per generated token, attention with a KV cache costs n·d per layer, but the projection costs d·V with V around 32,000 to 150,000, often larger than n. For short contexts the output projection dominates; for very long contexts attention does." },
  },

  "m16-complete-transformer-data-flow": {
    simple: "From text to prediction: tokenise, embed, add positions, run N blocks of attention and feed-forward on the residual stream, normalise, project to logits, softmax. Every piece has now been covered.",
    concept:
      "This lesson follows one input through a complete decoder transformer, naming each step with the lesson that explained it. Text → tokens → ids (input pipeline). Ids → embedding rows, plus positional encoding → X⁰, the start of the residual stream. For each of N blocks: normalise, multi-head causal self-attention, add to the stream; normalise, feed-forward, add to the stream. After the last block: final normalisation, output projection to logits, softmax to probabilities. Training compares every position's probabilities with the true next token; generation samples from the last position and loops.\n\nThe shape discipline makes it coherent: the stream is n × d from the first block to the last; attention produces n × d; the FFN produces n × d; only the embedding (V × d) and the projection (d × V) touch the vocabulary. Every parameter in the model belongs to one of six places: embeddings, attention projections, FFN matrices, normalisation scales, the output projection, and biases.\n\nSeen whole, the transformer is a machine that repeatedly asks 'what else in this text matters to each token?' and 'what does each token now mean?', then bets on the next token.",
    why:
      "Each lesson in this module isolated one part; real understanding is being able to trace an input end to end and say, at every step, what the shape is, what was learned, and what could go wrong. That trace is what you use when a model misbehaves (which stage?), when you read a config file (which numbers?), when you estimate cost (which multiplications?) and when you explain the architecture in an interview. It is also the base for Modules 17 and 18, which scale this machine up and describe how its output is turned into text.",
    how: [
      "Input pipeline: 'The cat sat' → ids [464, 3797, 3332] → X⁰ = E[ids] + P[0..2], shape 3 × d.",
      "Block 1 attention: LN(X⁰) → multi-head causal attention → add to stream.",
      "Block 1 FFN: LN(stream) → expand, GELU, contract → add to stream.",
      "Repeat for blocks 2 … N; the stream stays 3 × d.",
      "Final LN → × W_out → logits 3 × V → softmax per position.",
      "Training: cross-entropy of position i's distribution against token i+1. Generation: sample from position 3's distribution, append, repeat.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Stage", "Shape after", "Parameters (d = 512, V = 32k, 8 heads, d_ff = 2048)", "Lesson"],
        rows: [
          ["tokenise + embed + position", "n × 512", "16.4M embedding (+ positions)", "16.5, 16.6, 16.7"],
          ["attention sub-layer (×N)", "n × 512", "1.05M per block", "15.11, 16.8"],
          ["feed-forward sub-layer (×N)", "n × 512", "2.10M per block", "16.9"],
          ["residual + norms (×N)", "n × 512", "2k per block", "16.10, 16.11"],
          ["final norm + output projection", "n × 32,000", "tied: 0 extra; untied: 16.4M", "16.12"],
          ["softmax → next-token probabilities", "n × 32,000", "0", "18.6"],
        ],
      },
      caption: "The whole model as a table. For N = 6 the total is about 35 million parameters; for N = 32 with d = 4,096 it is about 7 billion.",
    },
    everyday: {
      title: "Following a parcel from doorstep to doorstep",
      text: "A parcel is labelled (tokenised), scanned into the system with a barcode (embedded) and a route tag (position). It passes through a chain of depots; at each one it is sorted alongside other parcels (attention) and then processed individually, weighed and relabelled (feed-forward), always keeping its original barcode (residual). At the final depot the system decides which van it goes on (output projection) with a confidence for each (softmax). You can trace every step.",
    },
    engineering: {
      title: "Estimating serving cost from the data flow",
      text: "Before buying GPUs, a team estimated the cost of a 7-billion-parameter decoder: roughly 2 multiply-adds per parameter per token (every parameter is used once per token, forward only), so 14 billion operations per generated token, plus attention over the context. At 1,000 output tokens per request and a GPU doing about 300 trillion operations per second at realistic efficiency, that is about 50 milliseconds of pure compute per request, before memory limits. The estimate, built from nothing but the data flow and the parameter table, was within 30% of what they measured, and it set the budget.",
    },
    maths: {
      formula: "FLOPs per token ≈ 2 · (parameters) + 2 · N · n · d   (forward pass)",
      meaning: "Every weight is multiplied and added once per token; attention adds a term growing with context length n per block.",
      worked: [
        "7B model, d = 4,096, N = 32, context n = 2,000: parameter term 2 · 7×10⁹ = 1.4×10¹⁰; attention term 2 · 32 · 2,000 · 4,096 ≈ 5.2×10⁸. Attention is about 4% of the work at this context length.",
        "At n = 100,000: attention term ≈ 2.6×10¹⁰, nearly twice the parameter term. Long contexts shift the cost into attention.",
        "Training is about three times the forward cost (forward plus backward), so ≈ 6 · parameters per token: 4.2×10¹⁰ per token for the 7B model, 4.2×10²² for a trillion tokens.",
      ],
    },
    code: {
      title: "The full forward pass, compactly",
      lang: "py",
      src: `import numpy as np

def layer_norm(X): return (X - X.mean(1, keepdims=True)) / np.sqrt(X.var(1, keepdims=True) + 1e-5)
def softmax_rows(S): e = np.exp(S - S.max(1, keepdims=True)); return e / e.sum(1, keepdims=True)
def gelu(z): return 0.5 * z * (1 + np.tanh(np.sqrt(2 / np.pi) * (z + 0.044715 * z ** 3)))

def attention(Xn, W):
    Q, K, V = Xn @ W["q"], Xn @ W["k"], Xn @ W["v"]
    S = Q @ K.T / np.sqrt(K.shape[1])
    S = np.where(np.triu(np.ones_like(S, dtype=bool), 1), -np.inf, S)     # causal
    return softmax_rows(S) @ V @ W["o"]

def ffn(Xn, W): return gelu(Xn @ W["w1"]) @ W["w2"]

def transformer(ids, E, P, blocks, W_out):
    X = E[ids] + P[: len(ids)]                      # input pipeline
    for W in blocks:                                 # N blocks
        X = X + attention(layer_norm(X), W)          # attention sub-layer + residual
        X = X + ffn(layer_norm(X), W)                # feed-forward sub-layer + residual
    logits = layer_norm(X) @ W_out                   # output projection
    return softmax_rows(logits)                      # next-token probabilities per position

rng = np.random.default_rng(0)
V, d, d_ff, N = 6, 8, 16, 2
E = rng.normal(0, 0.3, (V, d)); P = rng.normal(0, 0.1, (16, d))
blocks = [{k: rng.normal(0, 0.3, s) for k, s in [("q", (d, d)), ("k", (d, d)), ("v", (d, d)), ("o", (d, d)), ("w1", (d, d_ff)), ("w2", (d_ff, d))]} for _ in range(N)]
probs = transformer(np.array([1, 2, 3]), E, P, blocks, E.T)
print(probs.shape, probs[-1].round(2))`,
      lines: [
        { code: "X = E[ids] + P[: len(ids)]                      # input pipeline", say: "Embeddings plus positions: the residual stream begins." },
        { code: "X = X + attention(layer_norm(X), W)          # attention sub-layer + residual", say: "Pre-norm, causal multi-head attention (one head here), residual add." },
        { code: "X = X + ffn(layer_norm(X), W)                # feed-forward sub-layer + residual", say: "Pre-norm, expand-GELU-contract, residual add." },
        { code: "logits = layer_norm(X) @ W_out                   # output projection", say: "Final norm and the tied projection to vocabulary scores." },
        { code: "return softmax_rows(logits)                      # next-token probabilities per position", say: "Every position predicts its next token; generation uses the last row." },
      ],
      output: "(3, 6) [0.14 0.21 0.09 0.33 0.11 0.12]",
      note: "Forty lines, random weights, but structurally the same as a 70-billion-parameter model. Training is what fills the matrices with meaning.",
    },
    useIt: "You can now read any transformer config, estimate its memory (parameters × bytes per parameter) and compute (≈ 2 × parameters per token), locate a bug by stage, and explain to anyone what happens between a prompt and a prediction. Modules 17 and 18 build directly on this trace.",
    takeaways: ["Text → ids → embeddings + positions → N × (attention, FFN) on the residual stream → norm → logits → softmax.", "The stream is n × d throughout; only embeddings and the projection touch the vocabulary.", "Parameters live in six places; FFNs hold most of them.", "Forward cost ≈ 2 × parameters per token plus an attention term that grows with context."],
    terms: [["forward pass", "running the input through every stage to get predictions"], ["FLOPs", "floating-point operations, the unit for estimating compute cost"]],
    reflect: { q: "Trace where a factual error in 'The capital of Australia is Sydney' could come from, by stage.", a: "Not the input pipeline (tokens are fine). Attention may have correctly linked 'Australia' and 'capital'. The FFN layers, where facts are stored, may hold a stronger association for Sydney than Canberra because Sydney appears more often in text. The output projection then scores Sydney higher. The fix is in the knowledge, not the architecture: retrieval or fine-tuning (Stages 5 and 6)." },
  },
};

export const M16_QUIZ: Quiz[] = [
  {
    q: "What does the feed-forward sub-layer do that attention cannot?",
    options: ["Move information between tokens", "Compute non-linear new features of each token on its own", "Add positional information", "Normalise the stream"],
    answer: 1,
    why: ["That is attention's job.", "Correct. Attention only averages existing vectors; the FFN transforms each token non-linearly and stores most of the model's knowledge.", "Positions are added in the input pipeline.", "Layer norm does that."],
    reason: true,
  },
  {
    q: "Which layout fits a document summariser whose input is long and output short, with an interpretable alignment?",
    options: ["Encoder only", "Decoder only", "Encoder-decoder", "A recurrent network"],
    answer: 2,
    why: ["Cannot generate.", "Works, but re-reads the whole sequence and has no separate reusable encoding.", "Correct. Encode once, decode with cross-attention, alignment from the cross-attention weights.", "Replaced by transformers for these tasks."],
  },
  {
    q: "Why is positional encoding necessary?",
    options: ["To make vectors longer", "Because attention is order-blind: shuffled tokens give shuffled but identical outputs", "To reduce the vocabulary", "To speed up training"],
    answer: 1,
    why: ["Dimension is unchanged.", "Correct. Without positions the model sees a bag of tokens.", "No.", "It adds a little work, not speed."],
  },
  {
    q: "A model has d = 1024 and d_ff = 4096. Roughly what share of a block's parameters are in the FFN?",
    options: ["One third", "One half", "Two thirds", "All"],
    answer: 2,
    why: ["Attention is about one third.", "No.", "Correct. FFN ≈ 2 · 1024 · 4096 = 8.4M; attention ≈ 4 · 1024² = 4.2M; FFN is two thirds.", "Attention and norms hold the rest."],
    reason: true,
  },
  {
    q: "What does the residual connection guarantee for training?",
    options: ["That every layer learns the same thing", "A gradient path of strength 1 from the loss to every block", "That the vocabulary is tied", "That attention is causal"],
    answer: 1,
    why: ["No.", "Correct. ∂(x + f(x))/∂x contains the identity, so depth does not vanish the gradient.", "Weight tying is separate.", "Masks are separate."],
  },
  {
    q: "Where do decoding controls like temperature act?",
    options: ["On the embeddings", "On the logits from the output projection, before softmax", "Inside the FFN", "On the positional encodings"],
    answer: 1,
    why: ["No.", "Correct. The output projection gives raw scores; temperature, top-p and constraints edit them before softmax.", "No.", "No."],
  },
  {
    q: "A model trained on 2,048-token windows degrades badly at 4,000 tokens. Most likely cause?",
    options: ["The FFN is too small", "A learned positional table with no rows past 2,048, or positions never seen in training", "Softmax overflow", "The vocabulary is too large"],
    answer: 1,
    why: ["Size would show at all lengths.", "Correct. Positional design determines behaviour beyond the training length; rotary schemes extend better.", "Handled by the max-subtraction trick.", "No."],
  },
  {
    q: "Why is layer normalisation used instead of batch normalisation in transformers?",
    options: ["It has more parameters", "It works per token, so it needs no batch statistics and works at any length and during one-token generation", "It is older", "It replaces the residual"],
    answer: 1,
    why: ["Both are tiny.", "Correct. Batch statistics break on variable-length sequences and batch size one.", "No.", "Residuals stay."],
  },
];

export const M16_EXERCISES: Exercise[] = [
  {
    title: "Count the parameters of a real model",
    kind: "calculate",
    task: "A decoder has V = 50,000, d = 2,048, 24 blocks, 16 heads, d_ff = 8,192, tied output weights. Estimate the total parameters (ignore biases and norms).",
    hints: ["Embeddings: V · d.", "Per block: attention 4 · d², FFN 2 · d · d_ff."],
    solution: "Embeddings: 50,000 · 2,048 = 102.4M. Attention per block: 4 · 2,048² = 16.8M. FFN per block: 2 · 2,048 · 8,192 = 33.6M. Per block 50.4M; 24 blocks = 1.21B. Total ≈ 1.31B parameters. Tied weights add nothing for the output.",
  },
  {
    title: "Positional vectors by hand",
    kind: "calculate",
    task: "With d = 4, compute the sinusoidal positional encoding for position 3, and explain which coordinates distinguish positions 3 and 4 most.",
    hints: ["Wavelengths 1 and 100.", "sin(3) = 0.14, cos(3) = −0.99, sin(0.03) = 0.03, cos(0.03) = 1.00."],
    solution: "P[3] = [0.14, −0.99, 0.03, 1.00]. P[4] = [sin 4, cos 4, sin 0.04, cos 0.04] = [−0.76, −0.65, 0.04, 1.00]. The first pair (wavelength 1) changes a lot between 3 and 4; the second pair barely moves. Fast coordinates distinguish neighbours; slow ones encode coarse position.",
  },
  {
    title: "Estimate compute and latency",
    kind: "calculate",
    task: "A 13-billion-parameter decoder generates 500 tokens with a 1,500-token prompt. Using ≈ 2 × parameters FLOPs per token (ignore attention), how many FLOPs for the generation, and how long on hardware sustaining 2×10¹⁴ FLOP/s?",
    hints: ["Per token: 2 · 13×10⁹.", "Multiply by 500 output tokens; the prompt is processed once (add it if you like)."],
    solution: "Per token 2.6×10¹⁰ FLOPs; 500 tokens ≈ 1.3×10¹³. Prompt processing adds 1,500 · 2.6×10¹⁰ ≈ 3.9×10¹³ once. Total ≈ 5.2×10¹³ FLOPs ≈ 0.26 s at 2×10¹⁴ FLOP/s of pure compute. Real latency is higher because generation is memory-bound (Module 40), but this is the floor.",
  },
  {
    title: "Build a two-block transformer and inspect the stream",
    kind: "code",
    task: "Starting from the forward-pass code in the last lesson, record the residual stream after each sub-layer for the last token and print the norm of each update. Then remove the residual adds and observe what happens to the stream across blocks.",
    hints: ["Keep a list of X copies inside the loop.", "Without residuals, set X = attention(...) and X = ffn(...) instead of adding."],
    solution: "With residuals, the update norms are modest and the stream's norm grows slowly; each sub-layer contributes a visible but bounded change. Without residuals, the stream after block 2 is a function only of the last sub-layer's output: the token's original embedding is gone, and with random weights the vectors for all positions become nearly identical (collapse toward an average), illustrating why residuals are essential.",
  },
];
