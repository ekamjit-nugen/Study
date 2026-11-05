import type { Exercise, LessonBody, Quiz } from "../types";

// Module 18: How LLMs generate responses. One concept per lesson.
// Running example: after the prompt "The capital of France is", a five-token vocabulary
// [Paris, Lyon, the, a, London] receives logits [4.0, 2.0, 1.0, 0.5, 0.0].
// Softmax gives probabilities [0.811, 0.110, 0.040, 0.024, 0.015]. Every lesson reuses these numbers.

export const M18_BODIES: Record<string, LessonBody> = {
  "m18-prompt-processing": {
    simple: "Before any token is generated, the whole prompt is formatted, tokenised and run through the model once; this pass builds the cache the answer will be written from and decides the first token's odds.",
    concept:
      "**Prompt processing** is the first phase of a response. The provider takes your system text and messages, lays them out in the model's chat template with special tokens between turns, tokenises the result, and runs the full sequence through the transformer in one parallel pass (the prefill from Module 17). Every block's keys and values for every prompt token are stored; the last position's logits become the distribution for the first output token.\n\nThree things are decided in this phase and cannot be undone later: what the model will be able to see (anything that did not fit the context window is gone), how the pieces are separated (the template marks who said what; a document pasted into a user turn is just more user text), and the cost of the call's input side. Time to first token is almost entirely this pass.\n\nNothing has been generated yet. The prompt pass is reading, not writing, and it is the same computation whether the answer will be one word or a thousand.",
    why:
      "Separating the reading pass from the writing loop lets the reading be parallel and cacheable: all prompt tokens are processed at once, and a prefix that repeats across calls (a system prompt, a long document) can be reused instead of recomputed. It also explains two things developers hit immediately: why a longer prompt makes the first token slower but not the streaming afterwards, and why the way you format the prompt (what goes in the system turn, how documents are delimited) matters, since the template is the only structure the model receives.",
    how: [
      "Assemble the chat template: system turn, then alternating user and assistant turns, each wrapped in the model's special tokens.",
      "Tokenise the whole string into ids; count them against the context window; truncate or reject if too long.",
      "Run one forward pass over all prompt tokens with the causal mask; store keys and values per block.",
      "Take the last position's output vector; project to logits over the vocabulary.",
      "Hand the logits to the decoding loop; the prompt is never processed again in this call.",
    ],
    visual: {
      kind: "flow",
      steps: ["system + messages", "chat template with special tokens", "token ids (e.g. 1,240 of them)", "one parallel pass; KV cache filled", "logits for the first answer token: Paris 4.0, Lyon 2.0, …"],
      caption: "Reading happens once. The logits at the end of the prompt start the answer.",
    },
    everyday: {
      title: "Reading the whole question before you start writing",
      text: "In an exam you read the question, the attached extract and the instructions completely before writing a word. Reading takes longer for a long extract, but your writing speed afterwards is the same. If a page of the extract is missing, you will never know it existed. The prompt pass is that reading: thorough, once, and limited to what was handed to you.",
    },
    engineering: {
      title: "A document that was never read",
      text: "A legal-review tool pasted contracts into the prompt after a long system prompt and the conversation history. For contracts over about forty pages, the provider truncated the input from the end, and the model answered confidently about the first thirty pages only, because that was all it had read. The team added a token count before the call, a hard error when a contract would not fit, and a chunking path for long ones. The lesson: what the prompt pass did not read does not exist for the model, and it will not tell you.",
    },
    maths: {
      formula: "tokens = |template(system, messages)|;   t_first ≈ prefill(tokens);   logits₁ = W_out · h_last",
      meaning: "The prompt's token count drives the first-token latency; the last hidden state gives the first output distribution.",
      worked: [
        "A system prompt of 800 tokens, four earlier turns of 150 tokens each (600) and a new 90-token question with template tokens (≈ 20): about 1,510 input tokens.",
        "Prefill cost on a 7B model ≈ 1.3×10¹⁰ FLOPs per token × 1,510 ≈ 2×10¹³ FLOPs; roughly 0.2 to 0.5 seconds on a server accelerator, which is the time to first token.",
        "The running example's first logits: [4.0, 2.0, 1.0, 0.5, 0.0] for [Paris, Lyon, the, a, London]: the model's view of the first output token after reading the prompt.",
      ],
    },
    code: {
      title: "Counting the prompt before sending it",
      lang: "ts",
      src: `const WINDOW = 8192;
const RESERVE = 1000;                               // room for the answer

const request = {
  model: "claude-sonnet-5-5",
  max_tokens: RESERVE,
  system: systemPrompt,
  messages: history.concat([{ role: "user", content: question + "\\n\\n<document>\\n" + contract + "\\n</document>" }]),
};

const count = await client.messages.countTokens({ model: request.model, system: request.system, messages: request.messages });
if (count.input_tokens + RESERVE > WINDOW) {
  throw new Error("Prompt would be truncated: " + count.input_tokens + " tokens; split the document.");
}
const reply = await client.messages.create(request);`,
      lines: [
        { code: "messages: history.concat([{ role: \"user\", content: question + \"\\n\\n<document>\\n\" + contract + \"\\n</document>\" }]),", say: "The document is user text with delimiters. The template is the only structure the model gets, so mark boundaries yourself." },
        { code: "const count = await client.messages.countTokens({ model: request.model, system: request.system, messages: request.messages });", say: "Count what the prompt pass will read, including template tokens, before paying for it." },
        { code: "if (count.input_tokens + RESERVE > WINDOW) {", say: "Prompt plus answer must fit. Fail loudly instead of letting the end of the contract vanish." },
      ],
    },
    useIt: "Treat the prompt pass as a budget and a boundary: count tokens, reserve space for the answer, delimit documents, keep stable content first for caching, and never assume the model saw something that did not fit. Every later lesson in this module starts from the logits this pass produces.",
    takeaways: ["The prompt is formatted, tokenised and read in one parallel pass before any generation.", "That pass fills the KV cache and produces the first token's logits.", "It sets time to first token and the input cost; it is cacheable for repeated prefixes.", "What did not fit was never read, and the model will not say so."],
    terms: [["prompt processing (prefill)", "the single parallel pass over the prompt that precedes generation"], ["chat template", "the special-token layout that separates system, user and assistant turns"]],
    reflect: { q: "Why does changing one word at the start of a long system prompt slow down the first token on the next call?", a: "Cached prefixes must match exactly; one changed token means the prefix from that point is recomputed in the prompt pass instead of being reused." },
  },

  "m18-tokenisation-during-inference": {
    simple: "At inference the prompt is split into the model's vocabulary tokens and mapped to ids exactly as in training; the count and the splits decide cost, context use and sometimes quality.",
    concept:
      "**Tokenisation during inference** is the same byte-pair process as in training (Module 12), applied to your prompt. The tokeniser is a fixed table of merges: it scans the text, applies merges greedily, and emits ids. 'Paris' may be one token; 'Parisienne' three; a product code such as 'WL-2041' five or six; a Punjabi sentence many more than its English translation.\n\nTwo consequences matter at inference. Counting: every token costs money and context space, and the count is only known after tokenisation, so estimate with a rule of thumb (about 1.3 tokens per English word, more for other languages and code) and measure with the tokeniser when it matters. Splitting: the model reasons over tokens, not characters, so tasks that depend on characters (counting letters, reversing a string, exact spelling of rare words) are hard for it, and numbers are split in ways that make arithmetic unnatural ('12345' might be '123' + '45').\n\nThe output side tokenises too, in reverse: generated ids are joined back into text, and partial multi-byte characters are buffered until complete when streaming.",
    why:
      "Models never see text; they see ids from a fixed vocabulary. Many surprising behaviours are tokenisation effects: a model that cannot count the r's in 'strawberry' (it sees 'str' + 'aw' + 'berry'), a price list that costs more tokens in one currency format than another, a name spelled consistently in English and inconsistently in Hindi. Engineers who know this stop blaming the model's intelligence and fix the input: spell out characters when characters matter, choose formats that tokenise cleanly, and budget by measured counts.",
    how: [
      "Normalise the text as the tokeniser expects (unicode form, whitespace).",
      "Split into pre-tokens (words, punctuation, digit runs) and apply the merge table greedily to each.",
      "Map each resulting token to its id; add template special tokens.",
      "Count ids; compare with the window and the price.",
      "For output: detokenise ids to text, buffering incomplete byte sequences when streaming.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Likely tokens", "Count", "Note"],
        rows: [
          ["The capital of France is", "[The] [ capital] [ of] [ France] [ is]", "5", "common words, one each"],
          ["Parisienne", "[Par] [isi] [enne]", "3", "rarer word, split"],
          ["WL-2041", "[W] [L] [-] [204] [1]", "5", "codes fragment; keyword search handles them better"],
          ["12345 + 678", "[123] [45] [ +] [ 678]", "4", "digit grouping is arbitrary, which hurts arithmetic"],
          ["strawberry", "[str] [aw] [berry]", "3", "the model never sees individual letters"],
        ],
      },
      caption: "Illustrative splits. The model reasons about these units, not characters.",
    },
    everyday: {
      title: "Reading in syllables",
      text: "Imagine you could only read words as pre-printed syllable blocks and never see individual letters. You would read fluently, but 'how many letters in this word?' would be a puzzle, and a word printed in blocks you had rarely seen would feel foreign even if its letters were familiar. That is the model's experience of text.",
    },
    engineering: {
      title: "A date format that cost 40% more",
      text: "A logistics team sent shipment tables to a model with timestamps like '2026-11-05T14:32:07.000Z'. Each timestamp was about 14 tokens. Reformatting to '5 Nov 14:32' cut it to 5 and, across 400-row tables, reduced input tokens by 40% with no loss in answer quality. They also found the model mis-sorted times in the long format because the digit splits varied; the short format fixed that too. Tokenisation shaped both the bill and the behaviour.",
    },
    maths: {
      formula: "cost_in = tokens(prompt) × p_in;   tokens ≈ words × r_language;   r_en ≈ 1.3, r_code ≈ 1.5–2, r_low-resource ≈ 3–6",
      meaning: "Token counts come from the tokeniser; the ratios let you estimate before measuring.",
      worked: [
        "A 600-word English brief ≈ 780 tokens; the same brief translated into Punjabi with an English-centred vocabulary ≈ 600 × 5 = 3,000 tokens.",
        "A 400-row table with a 14-token timestamp per row spends 5,600 tokens on timestamps; at 5 tokens each, 2,000. Saving 3,600 tokens per call at 3 units per million is small per call and large over a million calls.",
        "In the running example, the prompt 'The capital of France is' is 5 tokens; the first output token is chosen from a 5-token toy vocabulary in later lessons, but a real vocabulary has 32,000 to 200,000 candidates.",
      ],
    },
    code: {
      title: "Inspecting tokens before and after",
      lang: "py",
      src: `# Generic tokeniser interface: encode(text) -> ids, decode(ids) -> text
text = "The capital of France is Paris. Strawberry has 3 r's. Code: WL-2041"
ids = tokenizer.encode(text)
pieces = [tokenizer.decode([i]) for i in ids]

print(len(ids), "tokens")
print(pieces)

# Streaming output: buffer until a complete character is available
buffer = b""
for token_id in generated_ids:
    buffer += tokenizer.decode_bytes([token_id])
    try:
        print(buffer.decode("utf-8"), end="")
        buffer = b""
    except UnicodeDecodeError:
        pass                         # wait for the rest of a multi-byte character`,
      lines: [
        { code: "pieces = [tokenizer.decode([i]) for i in ids]", say: "Decoding one id at a time shows exactly how the text was split; do this once for every format you send." },
        { code: "buffer += tokenizer.decode_bytes([token_id])", say: "A token can be a fragment of a character in non-Latin scripts; bytes are accumulated." },
        { code: "pass                         # wait for the rest of a multi-byte character", say: "Printing half a character would corrupt the stream; wait for the full sequence." },
      ],
    },
    useIt: "Measure tokens for your real inputs and formats; choose formats that tokenise compactly; when characters matter, spell them out or use a tool; and expect weakness on character-level and digit-level tasks. For multilingual products, token ratios per language are a cost and quality metric to track (Stage 9).",
    takeaways: ["Inference tokenisation is the training tokeniser applied to your prompt; ids, not text, enter the model.", "Counts set cost and context use; estimate by ratio, confirm by measuring.", "Character- and digit-level tasks are hard because the model never sees characters.", "Output is detokenised in reverse, with buffering for partial characters when streaming."],
    terms: [["detokenisation", "joining output token ids back into text"], ["pre-token", "a word-like chunk the tokeniser splits before applying merges"]],
    reflect: { q: "A model is asked to reverse the string 'tokenisation' and gets it wrong. Is a bigger model the fix?", a: "Probably not; the model sees three or four tokens, not twelve letters. Spelling the word out with spaces between letters, or calling a tool, fixes it regardless of size." },
  },

  "m18-token-embeddings-during-inference": {
    simple: "Each prompt token id is looked up in the embedding table and combined with its position, producing the vectors that enter block 1; this is a lookup, not a computation, and it is identical to training.",
    concept:
      "At inference, **token embeddings** are fetched exactly as in Module 16: the id selects a row of the embedding table, and positional information is added (or, with rotary embeddings, applied inside attention). The table is frozen; nothing is learned at inference. For a 1,500-token prompt this is 1,500 row fetches, trivial next to the attention and feed-forward work that follows.\n\nTwo inference-time facts come from the embeddings. The first is that identical tokens at different positions enter as different vectors, so repeated words are not confused with each other. The second is that a token's starting vector is all the model initially knows about it: a rare token or an unusual fragment begins with a weak vector and depends entirely on context from attention to acquire meaning. That is why a made-up product code in a prompt is understood only through the words around it, and why defining such codes in the prompt helps.\n\nFor generation, the chosen output token is embedded the same way before it is fed back in for the next step, so the loop closes: logits → token id → embedding → next prediction.",
    why:
      "The embedding step is where the fixed vocabulary meets the live prompt, and it is the reason tokenisation decisions carry through to behaviour: whatever the tokeniser produced is looked up here, and nothing can be added or corrected afterwards. Understanding that the first representation of each token is a frozen lookup clarifies what prompting can and cannot do: it can surround a weak token with strong context, but it cannot give the model a new token.",
    how: [
      "For each prompt id, fetch row E[id] from the frozen embedding table.",
      "Add the positional vector for its index, or mark the position for rotary attention.",
      "Stack the rows into X⁰ (n × d) and pass to the first block.",
      "During decoding, embed each newly chosen token the same way and append it as the next input.",
      "The output projection, often the same table transposed, closes the loop from vectors back to token ids.",
    ],
    visual: {
      kind: "flow",
      steps: ["ids [464, 3797, 3332, …]", "E[ids]: frozen rows", "+ positions", "X⁰ → block 1", "… → logits → chosen id → E[id] → next step"],
      caption: "A lookup at the start, and the same lookup for every generated token.",
    },
    everyday: {
      title: "Looking up each word's meaning before reading the sentence",
      text: "Reading in a second language, you recognise each word's dictionary meaning instantly for common words and have only a vague sense for rare ones; you then use the sentence to sharpen the vague ones. The dictionary lookup is the embedding; the sharpening is attention. If a word is not in your dictionary at all, you can only guess from context, which is the model's situation with unknown codes.",
    },
    engineering: {
      title: "Defining codes in the prompt",
      text: "A retailer's assistant was asked about 'SKU WL-2041' and treated it as noise, because the fragments [W][L][-][204][1] had weak embeddings. The fix was not a new model but a glossary line at the top of the prompt: 'WL-2041 is the walnut side table, 45 cm, £240.' Attention then linked the fragments to the description, and answers became accurate. The embedding of the code never changed; its context did.",
    },
    maths: {
      formula: "X⁰[i] = E[id_i] + P[i];   lookup cost ≈ n × d reads",
      meaning: "Each input vector is one table row plus a position; the whole step is memory reads, not arithmetic.",
      worked: [
        "d = 4,096 and a 1,500-token prompt: 1,500 × 4,096 ≈ 6.1 million numbers read, about 12 MB in 16-bit; negligible next to the 2×10¹³ FLOPs of the prompt pass.",
        "The word 'Paris' at position 7 and 'Paris' at position 90 enter as E[Paris] + P[7] and E[Paris] + P[90]: the same token, two different vectors.",
        "At decode step t, one row is fetched for the just-chosen token: 4,096 numbers, then a full pass through the blocks.",
      ],
    },
    code: {
      title: "The embedding step in the generation loop",
      lang: "py",
      src: `import numpy as np
rng = np.random.default_rng(0)

V, d = 5, 4
E = rng.normal(0, 0.3, (V, d))                 # frozen at inference
P = rng.normal(0, 0.1, (64, d))                # positions

def embed(ids, start_pos):
    return np.stack([E[t] + P[start_pos + k] for k, t in enumerate(ids)])

prompt_ids = [0, 1, 2]                         # three prompt tokens
X0 = embed(prompt_ids, start_pos=0)            # (3, d) -> block 1 during prefill
print(X0.shape)

chosen = 3                                     # the token the decoder just picked
x_next = embed([chosen], start_pos=len(prompt_ids))   # (1, d) -> block 1 during decode
print(x_next.shape)`,
      lines: [
        { code: "E = rng.normal(0, 0.3, (V, d))                 # frozen at inference", say: "The table is fixed; inference only reads it." },
        { code: "return np.stack([E[t] + P[start_pos + k] for k, t in enumerate(ids)])", say: "Row lookup plus position; the position offset matters during decoding, where new tokens continue the count." },
        { code: "x_next = embed([chosen], start_pos=len(prompt_ids))   # (1, d) -> block 1 during decode", say: "The chosen token re-enters through the same lookup, at the next position." },
      ],
      output: "(3, 4)\n(1, 4)",
    },
    useIt: "When a prompt contains identifiers, codes or rare terms, give them context or definitions, because their embeddings alone carry little; and when adding special tokens for a fine-tune, remember they need new, trained rows in this table.",
    takeaways: ["Inference embeds tokens by frozen lookup plus position; nothing is learned.", "The same token at different positions is a different input vector.", "A rare token's meaning comes from context, not from its embedding.", "Generated tokens are embedded the same way to continue the loop."],
    terms: [["frozen weights", "parameters that are read but never updated during inference"]],
    reflect: { q: "Why can a prompt-level glossary fix a model's handling of an unknown code when fine-tuning the embedding would take thousands of examples?", a: "Attention can immediately route the code's fragments to the glossary's well-embedded words within the same prompt; training a new embedding row needs enough examples to shape it from random, and the prompt route needs none." },
  },

  "m18-transformer-forward-pass": {
    simple: "The forward pass runs the current sequence through every block to produce logits at the last position; at decode time only the newest token is computed, attending to the cache of everything before it.",
    concept:
      "The **forward pass** at inference is the data flow of Module 16 with one optimisation: the KV cache. During prefill the whole prompt goes through all N blocks at once; each block stores its keys and values for every position. During decode, only the newest token's vector goes through the blocks. In each attention sub-layer it computes its own query, key and value, appends the key and value to that block's cache, and attends over the full cache. The feed-forward sub-layer processes just the one token. After the last block, the final normalisation and output projection give the logits for the next token.\n\nSo one decode step is: one embedding lookup, N × (attention over the cache + FFN), one projection. The work per step is roughly 2 × parameters FLOPs plus attention over the cache length, and the weights must be read from memory in full, which makes the step memory-bound (Module 17).\n\nThe forward pass is deterministic: the same cache and the same new token give the same logits. All variation in outputs comes afterwards, from how a token is chosen from the logits.",
    why:
      "Without the cache, generating the t-th token would require re-running the entire sequence of t tokens through the model, making the cost of a response grow with the square of its length. With the cache, each step costs about the same, and generating a thousand tokens is a thousand roughly equal steps. Understanding the forward pass as 'one token through all blocks against a cache' is what makes serving behaviour predictable: memory grows with context, time per token is nearly constant, and batching helps because the weights are the expensive read.",
    how: [
      "Embed the newest token at its position.",
      "For each block: normalise; compute q, k, v for this token; append k, v to the block's cache; attend q over all cached keys and values (causal by construction); add the residual.",
      "Normalise; run the FFN on this token's vector; add the residual.",
      "After the last block: final normalisation, output projection → logits over the vocabulary.",
      "Pass the logits to the token-selection step; the chosen token starts the next forward pass.",
    ],
    visual: {
      kind: "flow",
      steps: ["new token vector", "block 1: attend over cache₁ (+ append), FFN", "block 2 … block N", "final norm + output projection", "logits: Paris 4.0, Lyon 2.0, the 1.0, a 0.5, London 0.0"],
      caption: "One token in, one logit vector out, cache grown by one position in every block.",
    },
    everyday: {
      title: "Adding one line to a letter you have already read",
      text: "Having read a long letter, you write one more line of reply. You do not re-read the whole letter from the top; you keep it in mind (the cache) and glance at the parts relevant to the new line. Each new line costs about the same effort. If you had to re-read everything for every line, long replies would be impossibly slow.",
    },
    engineering: {
      title: "Memory, not compute, ran out first",
      text: "A team serving a 13B model found that at 64 concurrent conversations the server slowed sharply and then refused requests, while GPU utilisation was only 40%. The cause was cache memory: each conversation's keys and values occupied about 400 KB per token across the blocks, and 64 conversations at 6,000 tokens each needed 150 GB, more than the GPU had. They capped context, evicted idle caches, and moved to a serving engine that pages cache memory in fixed blocks. The forward pass itself had never been the bottleneck.",
    },
    maths: {
      formula: "step FLOPs ≈ 2·params + 2·N·d·L;   cache after L tokens = 2·N·n_kv·d_head·L·bytes",
      meaning: "Each decode step costs the parameter term plus attention over the current length L; the cache grows linearly with L.",
      worked: [
        "7B model, N = 32, d = 4,096, 8 KV heads of 128: at L = 2,000 the attention term is 2·32·4,096·2,000 ≈ 5.2×10⁸ versus the parameter term 1.3×10¹⁰; attention is 4% of the step.",
        "Cache at L = 2,000: 2·32·8·128·2,000·2 bytes ≈ 262 MB per conversation; 64 conversations ≈ 16.8 GB.",
        "Without a cache, step t would cost 2·params·t: generating 1,000 tokens would total 2·params·(1+2+…+1,000) ≈ 2·params·500,500, five hundred times the cached cost.",
      ],
    },
    code: {
      title: "A decode step against a per-block cache",
      lang: "py",
      src: `import numpy as np

def softmax(s):
    e = np.exp(s - s.max()); return e / e.sum()

def decode_step(x, blocks, cache, W_out):
    # x: the newest token's vector (d,). cache[b] holds (K, V) arrays for block b.
    for b, W in enumerate(blocks):
        q, k, v = x @ W["q"], x @ W["k"], x @ W["v"]
        K, V = cache[b]
        K = np.vstack([K, k]); V = np.vstack([V, v])         # append this token's key and value
        cache[b] = (K, V)
        w = softmax(K @ q / np.sqrt(len(q)))                 # attend over everything so far
        x = x + (w @ V) @ W["o"]                             # attention + residual
        x = x + np.tanh(x @ W["w1"]) @ W["w2"]               # FFN + residual (stand-in)
    return x @ W_out                                         # logits for the next token`,
      lines: [
        { code: "q, k, v = x @ W[\"q\"], x @ W[\"k\"], x @ W[\"v\"]", say: "Only the new token's projections are computed; the past's keys and values already exist." },
        { code: "K = np.vstack([K, k]); V = np.vstack([V, v])         # append this token's key and value", say: "The cache grows by one row per block per step: this is the memory that scales with context." },
        { code: "w = softmax(K @ q / np.sqrt(len(q)))                 # attend over everything so far", say: "One query against all cached keys. Causality is automatic: the cache holds only the past." },
        { code: "return x @ W_out                                         # logits for the next token", say: "The output of a forward pass is a logit vector; choosing a token from it is the next lesson's job." },
      ],
    },
    useIt: "The forward pass is where serving cost is decided: per-token time from parameters and bandwidth, memory from cache length, throughput from batching. When you size hardware or set context limits (Modules 39 and 40), you are reasoning about this loop.",
    takeaways: ["Decode runs one token through all blocks, attending over cached keys and values.", "Per-step cost is nearly constant; cache memory grows with length.", "The pass is deterministic; variation comes from token selection.", "Without the cache, generation cost would be quadratic in length."],
    terms: [["decode step", "one forward pass of the newest token producing the next logits"], ["cache eviction", "freeing cached keys and values of idle or finished conversations"]],
    reflect: { q: "If the forward pass is deterministic, why does the same prompt give different answers on different days?", a: "Token selection may sample randomly; the provider may batch requests differently, changing floating-point rounding; and the model or system prompt may have been updated. The forward pass itself, given identical inputs and weights, is the same." },
  },

  "m18-logits": {
    simple: "Logits are the raw scores the model assigns to every token in the vocabulary for the next position; they are unbounded numbers whose differences, not absolute values, carry the meaning.",
    concept:
      "The output projection (Module 16) turns the last position's vector into one number per vocabulary token: the **logits**. In the running example, after 'The capital of France is', the five-token vocabulary gets [Paris 4.0, Lyon 2.0, the 1.0, a 0.5, London 0.0]. A real model produces 32,000 to 200,000 of these at once.\n\nLogits are not probabilities. They can be negative, they do not sum to anything, and adding the same constant to all of them changes nothing after softmax. What matters is their differences: Paris is 2.0 above Lyon, which after softmax will mean about e² ≈ 7.4 times more likely. Logits are the natural place to intervene because every decoding control is an edit to this vector: temperature scales it, top-k and top-p zero out parts of it, repetition penalties subtract from entries, and grammar constraints set forbidden entries to minus infinity.\n\nAPIs expose logits indirectly as log-probabilities after softmax, which preserve the same differences and are often returned for the top few tokens.",
    why:
      "Keeping the raw scores separate from probabilities gives the decoding stage a clean place to work. Softmax is non-linear and sums to one, so adjusting probabilities directly is awkward; adjusting logits and then applying softmax is simple and composable. It also mirrors training: the cross-entropy loss is computed from these same logits, so the model learns to make the right token's logit stand out, not to produce calibrated probabilities as such.",
    how: [
      "Take the final normalised hidden state h for the last position (d numbers).",
      "Multiply by the output matrix: logits = h · W_out, giving V numbers.",
      "Optionally edit: divide by temperature, mask forbidden or out-of-top-k tokens, penalise repeats.",
      "Apply softmax to get probabilities; choose a token.",
      "For analysis, convert to log-probabilities: log p_v = logit_v − log Σ e^{logit_u}.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "Logit", "Difference from Paris", "Meaning after softmax"],
        rows: [
          ["Paris", "4.0", "0", "the favourite"],
          ["Lyon", "2.0", "−2.0", "e^−2 ≈ 1/7.4 as likely as Paris"],
          ["the", "1.0", "−3.0", "1/20 as likely"],
          ["a", "0.5", "−3.5", "1/33 as likely"],
          ["London", "0.0", "−4.0", "1/55 as likely"],
        ],
      },
      caption: "The running example's logits. Only the gaps matter.",
    },
    everyday: {
      title: "Judges' raw scores before the leaderboard",
      text: "In a competition each judge writes raw marks on a card: 9.2, 7.8, 6.0. The marks themselves are not odds of winning; the gaps are what rank the competitors, and a judge who adds one point to everyone changes nothing. The leaderboard, where marks become places and percentages, is softmax. Logits are the cards.",
    },
    engineering: {
      title: "Using log-probabilities to flag uncertain extractions",
      text: "A team extracting invoice totals asked the API to return log-probabilities for the generated tokens. When the top token's log-probability for the first digit was below −0.7 (probability under 50%), they routed the invoice to a human. The gap between the top two logits turned out to be a reliable uncertainty signal: invoices with a close second candidate were wrong five times more often. The model's confidence was readable in its logits before any answer was shown.",
    },
    maths: {
      formula: "logits = h · W_out;   softmax invariant: softmax(z + c) = softmax(z);   log p_v = z_v − log Σ_u e^{z_u}",
      meaning: "A linear map gives the scores; shifting all scores equally changes nothing; log-probabilities are logits minus a shared constant.",
      worked: [
        "Running example: z = [4.0, 2.0, 1.0, 0.5, 0.0]. Σ e^z = 54.6 + 7.39 + 2.72 + 1.65 + 1.00 = 67.36; log of that = 4.21.",
        "Log-probabilities: 4.0 − 4.21 = −0.21 (Paris), 2.0 − 4.21 = −2.21 (Lyon), −3.21, −3.71, −4.21.",
        "Shift test: z + 10 = [14, 12, 11, 10.5, 10]; Σ e^z = e¹⁰ × 67.36; log = 14.21; log-probabilities: 14 − 14.21 = −0.21: unchanged.",
        "Probability of Paris: e^{−0.21} = 0.81. Gap to Lyon of 2.0 logits is a ratio of e² = 7.39.",
      ],
    },
    code: {
      title: "From logits to log-probabilities, and reading uncertainty",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
logits = np.array([4.0, 2.0, 1.0, 0.5, 0.0])

logZ = np.log(np.exp(logits).sum())              # log of the normaliser
logprobs = logits - logZ                          # same gaps, now log-probabilities
probs = np.exp(logprobs)

order = np.argsort(logits)[::-1]
top, second = order[0], order[1]
print(dict(zip(vocab, logprobs.round(2))))
print("gap between top two logits:", logits[top] - logits[second])
print("confident" if logits[top] - logits[second] > 1.5 else "uncertain: route to review")`,
      lines: [
        { code: "logprobs = logits - logZ                          # same gaps, now log-probabilities", say: "Subtracting one constant turns logits into log-probabilities; the differences between tokens are untouched." },
        { code: "print(\"gap between top two logits:\", logits[top] - logits[second])", say: "The gap is an uncertainty signal: a small gap means a close call." },
      ],
      output: "{'Paris': -0.21, 'Lyon': -2.21, 'the': -3.21, 'a': -3.71, 'London': -4.21}\ngap between top two logits: 2.0\nconfident",
    },
    useIt: "Logits and log-probabilities are what you read when you want confidence, what you edit when you constrain output to a grammar or a set of labels, and what every sampling setting operates on. Ask for log-probabilities from your API when uncertainty matters.",
    takeaways: ["Logits are raw per-token scores from the output projection; unbounded, unnormalised.", "Only differences matter; adding a constant changes nothing.", "All decoding controls edit the logit vector before softmax.", "Log-probabilities are logits minus a constant and expose confidence."],
    terms: [["log-probability", "the natural log of a token's probability; logit minus the log normaliser"], ["normaliser", "the sum of exponentiated logits that softmax divides by"]],
    reflect: { q: "A model returns top-two log-probabilities of −0.05 and −3.2 for a label. How sure is it?", a: "Very: probabilities 0.95 and 0.04. A gap of 3 in log space is a factor of about 20. Whether that confidence is well calibrated is a separate question for evaluation." },
  },

  "m18-softmax-probabilities": {
    simple: "Softmax converts the logits into a probability distribution over the vocabulary: every token gets a share between 0 and 1, the shares sum to 1, and the highest logit gets the largest share.",
    concept:
      "The **softmax** function from Module 7, applied to the output logits, gives the model's next-token distribution. For the running example, [4.0, 2.0, 1.0, 0.5, 0.0] becomes [0.811, 0.110, 0.040, 0.024, 0.015]. Paris gets 81%, not 100%: the model is confident but leaves room for alternatives, and that room is what sampling (later lessons) draws from.\n\nSoftmax exaggerates gaps: each logit unit of difference is a factor of e ≈ 2.72 in probability. Because the exponential never reaches zero, every token in the vocabulary keeps a tiny probability, including nonsense ones; with 100,000 tokens the long tail can add up to a meaningful share, which is one reason top-k and top-p truncation exist.\n\nThe distribution is what the model was trained to produce: the cross-entropy loss during pretraining compared exactly this softmax output with the actual next token. So the probabilities are meaningful, but calibrated only on average over training-like text; on unusual inputs they can be confidently wrong (Module 19).",
    why:
      "Choosing a token requires a distribution, not a list of scores: to sample, to measure confidence, to compare across steps, you need numbers that sum to one. Softmax is the standard map because it is smooth (so training can push probabilities around), order-preserving, and gives the exponential sensitivity to gaps that makes a clear favourite dominate while keeping alternatives alive. The same function that trained the model now drives its generation.",
    how: [
      "Take the logit vector z over the vocabulary.",
      "Subtract the maximum (for numerical safety) and exponentiate every entry.",
      "Divide by the sum of all exponentials.",
      "The result p sums to 1; p_v is the model's probability that token v comes next.",
      "Either pick the maximum (greedy) or draw from p (sampling), possibly after truncating the tail.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Logits", detail: "[4.0, 2.0, 1.0, 0.5, 0.0]" },
        { label: "Exponentials", detail: "[54.60, 7.39, 2.72, 1.65, 1.00]" },
        { label: "Sum", detail: "67.36" },
        { label: "Probabilities", detail: "[0.811, 0.110, 0.040, 0.024, 0.015] — sums to 1" },
      ],
      caption: "The running example's distribution. These five numbers are reused by every later lesson in the module.",
    },
    everyday: {
      title: "From a shortlist to betting odds",
      text: "A pundit rates five candidates for a job: strong, decent, weak, weak, weak. Turning that into odds, 'strong' might be 80%, 'decent' 11%, and the rest share the remaining 9%. Nobody gets exactly zero; surprises happen. Softmax is the conversion from the pundit's ratings to the bookmaker's percentages.",
    },
    engineering: {
      title: "The long tail that produced gibberish",
      text: "A team sampling from the full distribution of a 150,000-token vocabulary at temperature 1 saw occasional bizarre tokens in otherwise fluent text. Each strange token had a probability around 0.0001, but there were tens of thousands of them, so together they claimed several percent of every draw. Truncating the distribution to the smallest set covering 95% of the mass (top-p, two lessons on) removed the gibberish without noticeable loss of variety. The arithmetic of a long tail was the whole bug.",
    },
    maths: {
      formula: "p_v = e^{z_v} / Σ_u e^{z_u}",
      meaning: "Each probability is its exponentiated logit over the total.",
      worked: [
        "z = [4.0, 2.0, 1.0, 0.5, 0.0]: e^z = [54.60, 7.39, 2.72, 1.65, 1.00]; sum 67.36.",
        "p = [54.60/67.36, 7.39/67.36, 2.72/67.36, 1.65/67.36, 1.00/67.36] = [0.811, 0.110, 0.040, 0.024, 0.015].",
        "Check: 0.811 + 0.110 + 0.040 + 0.024 + 0.015 = 1.000.",
        "Tail arithmetic: 50,000 tokens at 0.0001 each sum to 0.05, a 5% chance per step of drawing one of them if nothing truncates the tail.",
      ],
    },
    code: {
      title: "The next-token distribution",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
logits = np.array([4.0, 2.0, 1.0, 0.5, 0.0])

def softmax(z):
    e = np.exp(z - z.max())          # subtract max: identical result, no overflow
    return e / e.sum()

p = softmax(logits)
for t, pr in zip(vocab, p):
    print(f"{t:7s} {pr:.3f}")
print("sum:", round(p.sum(), 6))`,
      lines: [
        { code: "e = np.exp(z - z.max())          # subtract max: identical result, no overflow", say: "The usual safety shift; probabilities are unchanged because softmax is shift-invariant." },
        { code: "return e / e.sum()", say: "Divide by the total so the five numbers sum to one." },
      ],
      output: "Paris   0.811\nLyon    0.110\nthe     0.040\na       0.024\nLondon  0.015\nsum: 1.0",
    },
    useIt: "The distribution is what you sample from, what temperature reshapes, and what top-k and top-p truncate; it is also the source of the log-probabilities APIs return. When you reason about 'how random is this model', you are reasoning about this vector's shape.",
    takeaways: ["Softmax turns logits into a distribution over the vocabulary that sums to 1.", "Each logit unit of gap is a factor of e in probability.", "No token gets exactly zero; a long tail can sum to a few percent.", "The distribution is what training optimised and what decoding draws from."],
    terms: [["next-token distribution", "the softmax probabilities over the vocabulary at one position"], ["long tail", "the many low-probability tokens whose total share can be significant"]],
    reflect: { q: "Why is 'the model is 81% sure it is Paris' only approximately meaningful?", a: "The number is calibrated on average over training-like text, not guaranteed per input; on unfamiliar prompts the model can assign high probability to a wrong token. Evaluation measures calibration (Module 37)." },
  },

  "m18-selecting-the-next-token": {
    simple: "Given the distribution, the system must pick one token; the picking rule, deterministic or random, truncated or not, is where all the variety and all the controllability of generated text come from.",
    concept:
      "The model's work ends at the probability distribution. **Selecting the next token** is a separate step, done by the serving code, and it can follow many rules. The simplest takes the most likely token every time (greedy, next lesson). Others draw at random in proportion to the probabilities (sampling), after reshaping them with temperature or cutting off the tail with top-k or top-p. Repetition penalties and grammar constraints are further edits before the draw.\n\nThis step is why the same model can be a careful classifier and a playful story generator: the weights are identical; only the selection rule differs. It is also why outputs vary between runs when sampling is on, and why they can be made repeatable by turning it off.\n\nAll selection rules take the logit vector, optionally edit it, apply softmax, and choose. The chosen token id is appended, embedded, and the next forward pass begins. The remaining lessons of this module are each one rule or one edit.",
    why:
      "Always taking the most likely token sounds ideal but produces repetitive, generic text and gets stuck in loops, because the most likely continuation of 'I think that' is often another 'I think that'. Sampling introduces variety and often better quality, but the tail of the distribution contains nonsense, so truncation is needed. Different tasks want different trade-offs: exact extraction wants determinism; brainstorming wants variety. Making selection a configurable step lets one model serve all of them.",
    how: [
      "Receive logits for the next position.",
      "Apply edits in order: repetition penalty, temperature scaling, top-k or top-p truncation, grammar mask.",
      "Softmax the edited logits.",
      "Pick: argmax (greedy) or a random draw proportional to probability.",
      "Check stop conditions (end token, stop sequence, max_tokens); otherwise append and continue.",
    ],
    visual: {
      kind: "flow",
      steps: ["logits", "penalties", "÷ temperature", "top-k / top-p cut", "grammar mask", "softmax", "argmax or random draw", "token"],
      caption: "The selection pipeline. Each stage is one of the next lessons.",
    },
    everyday: {
      title: "Choosing from a menu",
      text: "The menu lists dishes with how much you fancy each. One diner always orders their favourite (greedy); another picks at random, weighted by appeal, but only among the dishes they rate at least 'decent' (truncated sampling); a third flips a coin between the top two when feeling adventurous (high temperature). Same menu, same tastes, different rules, different meals.",
    },
    engineering: {
      title: "Two endpoints, one model",
      text: "A product team runs one model behind two endpoints. The extraction endpoint uses greedy selection and a JSON grammar mask: same input, same output, always valid. The marketing-copy endpoint uses temperature 0.9 with top-p 0.95 and returns three samples for a human to choose from. Neither required a different model or prompt; both are selection settings, and switching one accidentally to the other's settings was the cause of their only serious incident, when extraction briefly became creative.",
    },
    maths: {
      formula: "token ~ Rule(softmax(edit(z)))   where Rule ∈ {argmax, categorical draw}",
      meaning: "Edit the logits, normalise, then either take the maximum or draw a token with probability equal to its share.",
      worked: [
        "Running example p = [0.811, 0.110, 0.040, 0.024, 0.015]. Greedy picks Paris every time.",
        "Sampling: draw u uniformly in [0, 1). Cumulative probabilities: Paris up to 0.811, Lyon to 0.921, the to 0.961, a to 0.985, London to 1.000. u = 0.63 → Paris; u = 0.90 → Lyon; u = 0.99 → London.",
        "Over 1,000 draws expect about 811 Paris, 110 Lyon, 40 the, 24 a, 15 London.",
      ],
    },
    code: {
      title: "The selection pipeline as a function",
      lang: "py",
      src: `import numpy as np
rng = np.random.default_rng(42)

def select(logits, temperature=1.0, top_k=None, top_p=None, greedy=False, forbidden=()):
    z = logits.astype(float).copy()
    z[list(forbidden)] = -np.inf                       # grammar / blocklist mask
    if greedy or temperature == 0:
        return int(np.argmax(z))
    z = z / temperature                                # temperature scaling
    if top_k is not None:                              # keep only the k largest
        cutoff = np.sort(z)[-top_k]
        z[z < cutoff] = -np.inf
    p = np.exp(z - z.max()); p /= p.sum()
    if top_p is not None:                              # keep the smallest set covering top_p of the mass
        order = np.argsort(p)[::-1]
        keep = order[np.cumsum(p[order]) - p[order] < top_p]
        mask = np.full_like(p, 0.0); mask[keep] = 1.0
        p = p * mask / (p * mask).sum()
    return int(rng.choice(len(p), p=p))

logits = np.array([4.0, 2.0, 1.0, 0.5, 0.0])
print(select(logits, greedy=True), [select(logits) for _ in range(8)])`,
      lines: [
        { code: "z[list(forbidden)] = -np.inf                       # grammar / blocklist mask", say: "Forbidden tokens get minus infinity before anything else: they can never be chosen." },
        { code: "z = z / temperature                                # temperature scaling", say: "Temperature reshapes the distribution (three lessons on)." },
        { code: "p = np.exp(z - z.max()); p /= p.sum()", say: "Softmax on the edited logits." },
        { code: "return int(rng.choice(len(p), p=p))", say: "The random draw. With greedy=True this line is never reached." },
      ],
      note: "The first number is the greedy choice (Paris); the list is eight random draws, mostly 0 with an occasional 1 (Lyon).",
    },
    useIt: "Choose selection settings per task, not per model: deterministic for extraction, classification and code that must compile; sampled with truncation for drafts, ideas and dialogue. Record the settings with every output you log, because they explain variation as much as the prompt does.",
    takeaways: ["Token selection is a separate, configurable step after the model's distribution.", "Greedy is deterministic; sampling draws in proportion to probability.", "Edits (temperature, top-k, top-p, penalties, masks) reshape the distribution before the draw.", "Same model, different rules, different behaviour."],
    terms: [["token selection (decoding)", "the rule that picks one token from the next-token distribution"], ["categorical draw", "a random choice where each option's chance equals its probability"]],
    reflect: { q: "A colleague says 'the model is non-deterministic'. What is the more precise statement?", a: "The forward pass is deterministic; the selection rule may be random. With greedy decoding and fixed weights the output is repeatable, up to numerical differences from batching on the server." },
  },

  "m18-autoregressive-generation": {
    simple: "Generation is a loop: choose a token, append it to the sequence, run the model again, and repeat; each token is conditioned on everything before it, including the model's own earlier choices.",
    concept:
      "**Autoregressive generation** means producing a sequence one element at a time, feeding each output back as input. The model predicts token 1 from the prompt, token 2 from the prompt plus token 1, and so on. Its own choices become part of its context, so an early choice shapes everything after it: pick 'Lyon' at step 1 and the sentence will continue as if Lyon were the capital.\n\nThe loop ends when the model emits an end-of-sequence token, when a stop sequence appears, or when max_tokens is reached. Each iteration is one decode step (Module 17), roughly constant in cost, so a response's total time is proportional to its length.\n\nTwo properties follow. The model cannot revise: there is no going back to change token 1 once token 50 reveals it was wrong, which is why models sometimes continue confidently down a mistaken path. And probability compounds: a 20-token answer with each token at 0.9 has a joint probability of 0.9²⁰ ≈ 0.12, so even a 'confident' answer is one of many the model could have given.",
    why:
      "A transformer outputs one distribution per position; to produce more than one new token it must be re-run with the new token included, because the second token's distribution depends on the first. That makes generation inherently sequential, which is why output tokens cost more time and money than input tokens, why streaming shows text appearing word by word, and why techniques like speculative decoding (Module 40) exist to produce several tokens per pass. It is also why the quality of the first few tokens matters so much: everything is conditioned on them.",
    how: [
      "Run the prompt pass; obtain logits for position n+1.",
      "Select a token; append its id to the sequence.",
      "Run a decode step for the new token against the cache; obtain logits for position n+2.",
      "Repeat until an end token, a stop sequence or max_tokens.",
      "Detokenise the generated ids; return or stream them.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Prompt", detail: "The capital of France is" },
        { label: "Step 1", detail: "p = [Paris 0.81, Lyon 0.11, …] → 'Paris'" },
        { label: "Step 2", detail: "context now '… is Paris' → p = [. 0.70, , 0.20, and 0.05, …] → '.'" },
        { label: "Step 3", detail: "context '… is Paris.' → p = [<end> 0.60, It 0.15, …] → <end>" },
        { label: "Output", detail: "'Paris.'" },
      ],
      caption: "Each step conditions on the previous choice. A different step-1 choice would have changed every later distribution.",
    },
    everyday: {
      title: "Improvising a story aloud",
      text: "Telling a story to a child, you invent it one sentence at a time, and each sentence has to follow from the last. If you say the hero is a dragon, you are stuck with a dragon; you cannot quietly make it a knight three sentences later. The story could have gone a hundred ways, and the one you told is a product of each small choice. Models generate exactly like that.",
    },
    engineering: {
      title: "Why the first line of a generated SQL query matters most",
      text: "A text-to-SQL feature produced wrong queries that were internally consistent: the model chose the wrong table in the first line and then wrote correct joins and filters against it. Because generation is autoregressive, the wrong table was in the context for every later token and nothing could correct it. The fix was to make the first decision better: retrieve the three most relevant tables and list them in the prompt, so step 1 chose from the right options. Later-token quality was never the problem.",
    },
    maths: {
      formula: "p(y_1 … y_T | x) = ∏_{t=1}^{T} p(y_t | x, y_1 … y_{t−1});   time ≈ T × t_step",
      meaning: "The sequence probability is the product of each token's conditional probability; time is linear in the number of tokens.",
      worked: [
        "Three steps with chosen-token probabilities 0.81, 0.70, 0.60: joint probability 0.81 × 0.70 × 0.60 = 0.34 for 'Paris.' plus end.",
        "A 20-token answer at 0.9 per token: 0.9²⁰ = 0.12. At 0.99 per token: 0.82. Long answers are inherently low-probability objects.",
        "At 25 ms per decode step, a 400-token answer takes 10 s; a 40-token answer takes 1 s. Length, not prompt, dominates total time.",
      ],
    },
    code: {
      title: "The generation loop with stop conditions",
      lang: "py",
      src: `def generate(prompt_ids, model, select, max_tokens=256, end_id=2, stop_sequences=()):
    cache = model.new_cache()
    logits = model.prefill(prompt_ids, cache)        # read the prompt once
    out = []
    for _ in range(max_tokens):
        token = select(logits)                       # the selection rule
        if token == end_id:
            break                                    # the model chose to stop
        out.append(token)
        text = model.detokenize(out)
        if any(text.endswith(s) for s in stop_sequences):
            return text[: -len(next(s for s in stop_sequences if text.endswith(s)))]
        logits = model.decode_step(token, cache)     # one more step, conditioned on everything so far
    return model.detokenize(out)`,
      lines: [
        { code: "logits = model.prefill(prompt_ids, cache)        # read the prompt once", say: "Reading, once. Then the loop." },
        { code: "token = select(logits)                       # the selection rule", say: "Greedy or sampling; the previous lesson's function." },
        { code: "if token == end_id:", say: "The model's own stop signal, learned in training." },
        { code: "logits = model.decode_step(token, cache)     # one more step, conditioned on everything so far", say: "The chosen token is now context. Autoregression in one line." },
      ],
    },
    useIt: "Design for a left-to-right, non-revising writer: put the information it needs before it starts, make early decisions easy, ask for an outline before a long answer, cap length with max_tokens, and stream so users see progress. Speculative decoding and parallel sampling (later modules) are optimisations of this loop.",
    takeaways: ["Generation appends each chosen token and re-runs the model; every token conditions on all earlier ones.", "The model cannot revise; early tokens shape the rest.", "Sequence probability is a product and shrinks with length.", "Time is linear in output length; stops come from an end token, stop sequences or max_tokens."],
    terms: [["autoregressive", "producing a sequence one element at a time, feeding each back as input"], ["end-of-sequence token", "a special token the model emits to finish"]],
    reflect: { q: "Why does asking a model to 'think step by step' before answering often improve the final answer?", a: "Because the reasoning tokens become context for the answer tokens; the model conditions its conclusion on an explicit chain it has written, instead of having to produce the conclusion in the first few tokens." },
  },

  "m18-greedy-decoding": {
    simple: "Greedy decoding always picks the single most probable token; it is deterministic and fast but can produce repetitive or locally optimal text.",
    concept:
      "**Greedy decoding** is the simplest selection rule: at every step, take the token with the highest probability. In the running example it always chooses Paris. No randomness is involved, so the same prompt gives the same output every time (up to numerical noise from the server), which is exactly what extraction, classification and code generation want.\n\nIts weakness is that the most probable token at each step does not give the most probable sequence overall, and it does not give the best-sounding text either. Greedy text tends toward the generic: common phrases, safe words, and loops, because once the model has written 'the the' the most likely next token can be 'the' again. Human-written text is not a sequence of most-likely words; it is surprising in small ways, and greedy decoding removes all surprise.\n\nBeam search is a related deterministic rule that keeps the few best partial sequences at each step instead of one; it helps for short, precise outputs such as translation and is rarely used for open-ended chat.",
    why:
      "Determinism is valuable: tests can be repeated, outputs can be cached, and a classifier that gives different labels on different days is useless. Greedy decoding gives that for free and is the right default whenever there is a correct answer. The reason it is not the universal default is text quality: for anything a person will read as prose, a little randomness reads better, and for tasks with many acceptable answers, variety is a feature. Knowing both sides lets you set the rule per task rather than per model.",
    how: [
      "Compute the next-token distribution (or just the logits; the maximum is the same).",
      "Choose the token with the highest value.",
      "Append it and continue; no random numbers are drawn.",
      "Optionally add a repetition penalty to break loops while staying deterministic.",
      "Expose this as temperature 0 in most APIs.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Greedy (temperature 0)", points: ["Always the top token: Paris, Paris, Paris", "Deterministic and repeatable", "Best for extraction, classification, code, tests", "Can loop and sound generic"] },
      right: { title: "Sampling (temperature > 0)", points: ["Paris most often, sometimes Lyon", "Varies between runs", "Better prose, more ideas", "Needs tail truncation"] },
      caption: "The running example under both rules.",
    },
    everyday: {
      title: "Always taking the busiest road",
      text: "A driver who always takes the road with the most traffic at each junction, on the theory that it must be the main route, can end up circling a ring road forever: each junction's most popular exit leads back to the ring. Greedy decoding is that driver. Most of the time the busiest road is right; sometimes the sequence of locally obvious choices is a loop.",
    },
    engineering: {
      title: "Determinism for a regression test suite",
      text: "A team's evaluation suite for an extraction model was flaky: the same inputs gave different outputs across runs, and failures could not be reproduced. They set temperature to 0 for the extraction endpoint and for the suite. Outputs became repeatable, the suite went from 4% flaky to zero, and cached responses could be served for identical inputs. For their separate summarisation endpoint they kept sampling but ran each test case three times and required all to pass, since greedy summaries read worse.",
    },
    maths: {
      formula: "y_t = argmax_v p(v | x, y_<t);   greedy sequence probability ≥ any single sampled run, but not the maximum over sequences",
      meaning: "Pick the top token each step. The result is locally optimal; the globally most probable sequence may differ.",
      worked: [
        "Running example: greedy picks Paris (0.811). Then, say, '.' (0.70), then end (0.60): sequence probability 0.34.",
        "A counter-example in miniature: step 1 options A 0.55 / B 0.45; after A the best continuation has 0.3; after B it has 0.9. Greedy takes A then 0.3: joint 0.165. B then 0.9 gives 0.405, more probable overall. Greedy missed it because it never looked ahead.",
        "Beam search with width 2 keeps both A and B and finds the 0.405 path.",
      ],
    },
    code: {
      title: "Greedy, and a loop it can fall into",
      lang: "py",
      src: `import numpy as np

def greedy(logits):
    return int(np.argmax(logits))

# A toy model whose most likely next token after "the" is "the" again
def toy_logits(last_token):
    if last_token == "the":
        return {"the": 2.0, "cat": 1.9, ".": 0.5}
    return {"the": 1.0, "cat": 0.5, ".": 2.0}

vocab = ["the", "cat", "."]
seq = ["the"]
for _ in range(5):
    scores = toy_logits(seq[-1])
    nxt = vocab[greedy(np.array([scores[v] for v in vocab]))]
    seq.append(nxt)
print(" ".join(seq))          # a loop: greedy never escapes "the"`,
      lines: [
        { code: "return int(np.argmax(logits))", say: "Greedy in one line: the index of the largest score." },
        { code: "return {\"the\": 2.0, \"cat\": 1.9, \".\": 0.5}", say: "'the' beats 'cat' by a hair, every time; a sampler would pick 'cat' almost half the time and escape." },
      ],
      output: "the the the the the the",
    },
    useIt: "Use greedy (temperature 0) for anything with a right answer or that must be reproducible: extraction, classification, code, evaluation suites, cached responses. Pair it with a repetition penalty if loops appear. Use sampling for prose and ideas.",
    takeaways: ["Greedy picks the top token every step; deterministic and fast.", "Locally optimal, not globally; can loop and sound generic.", "The right default for extraction, classification, code and tests.", "Beam search is its look-ahead cousin for short precise outputs."],
    terms: [["greedy decoding", "always selecting the most probable next token"], ["beam search", "keeping the best few partial sequences at each step and choosing the best complete one"]],
    reflect: { q: "If greedy is deterministic, why might two runs on a hosted API still differ slightly?", a: "The server batches requests differently, which changes floating-point summation order and can flip a near-tie between tokens; and the provider may update the model. Determinism holds for the rule, not for the whole system." },
  },

  "m18-random-sampling": {
    simple: "Sampling draws the next token at random in proportion to its probability, so the model's text varies between runs and escapes the generic patterns of greedy decoding.",
    concept:
      "**Random sampling** selects the next token by drawing from the next-token distribution: a token with probability 0.81 is chosen 81% of the time, one with 0.11 about 11% of the time. Over a whole response, thousands of such draws make every run different, which is the variety users notice in chat assistants and the reason regenerating gives a new answer.\n\nSampling from the full, unmodified distribution is called temperature 1. It reproduces the statistics of the training text: the model's text is as surprising, on average, as the text it learned from. That is usually too random for careful tasks and sometimes too tame for creative ones, so two families of controls exist: temperature, which reshapes the distribution, and truncation (top-k, top-p), which removes the tail. The next lessons cover each.\n\nBecause draws are random, sampling needs a random-number generator; providing a fixed seed makes the sequence of draws repeatable, which some APIs expose for testing.",
    why:
      "Human language is not maximally predictable, and text produced by always choosing the predictable word reads as flat and often loops. Sampling restores the natural unpredictability and, in practice, produces answers people rate higher for open-ended tasks. It also enables generating several candidates for a person or a judge to choose from, and it is the basis of techniques that sample multiple reasoning paths and vote. The cost is non-determinism, which is why sampling is a per-task choice.",
    how: [
      "Compute the next-token distribution p (possibly after temperature and truncation).",
      "Draw a uniform random number u in [0, 1).",
      "Walk the cumulative probabilities until they exceed u; the token at that point is chosen.",
      "Append and continue; each step draws afresh.",
      "To reproduce a run, fix the random seed and keep all settings identical.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "Probability", "Cumulative", "Chosen when u falls in"],
        rows: [
          ["Paris", "0.811", "0.811", "[0, 0.811)"],
          ["Lyon", "0.110", "0.921", "[0.811, 0.921)"],
          ["the", "0.040", "0.961", "[0.921, 0.961)"],
          ["a", "0.024", "0.985", "[0.961, 0.985)"],
          ["London", "0.015", "1.000", "[0.985, 1.000)"],
        ],
      },
      caption: "The running example as a roulette wheel. One draw in six or seven gives something other than Paris.",
    },
    everyday: {
      title: "A spinner with unequal wedges",
      text: "A board-game spinner has a huge wedge for 'move forward', a small one for 'move back' and a sliver for 'lose a turn'. Most spins move you forward, but not all, and no two games are alike. Sampling spins that wheel for every word, with wedge sizes set by the model's probabilities.",
    },
    engineering: {
      title: "Generating three headlines instead of one",
      text: "A news product wanted headline suggestions. With greedy decoding every regeneration returned the same safe headline. With sampling at temperature 0.8 they generate three in parallel for each article; editors pick one about 70% of the time versus 35% when offered a single greedy headline. The team logs the seed with each generation so an editor's favourite can be reproduced exactly if the article is re-run.",
    },
    maths: {
      formula: "P(choose v) = p_v;   choose the smallest v such that Σ_{u ≤ v} p_u > U, U ~ Uniform(0, 1)",
      meaning: "Inverse-transform sampling: a uniform draw mapped through the cumulative distribution.",
      worked: [
        "Cumulative from the running example: [0.811, 0.921, 0.961, 0.985, 1.000].",
        "U = 0.42 → Paris; U = 0.85 → Lyon; U = 0.95 → the; U = 0.999 → London.",
        "Probability of not choosing Paris on a given step: 0.189. Over a 10-step answer where each step had a similar favourite, the chance that every step took the favourite is 0.811¹⁰ ≈ 0.12: sampled runs almost always differ from the greedy one somewhere.",
      ],
    },
    code: {
      title: "Sampling with a seed",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
p = np.array([0.811, 0.110, 0.040, 0.024, 0.015])

def sample(p, rng):
    u = rng.random()                         # uniform in [0, 1)
    return int(np.searchsorted(np.cumsum(p), u, side="right"))   # first cumulative > u

rng = np.random.default_rng(seed=7)          # fixed seed: the draws are repeatable
draws = [vocab[sample(p, rng)] for _ in range(12)]
print(draws)

counts = {v: 0 for v in vocab}
rng = np.random.default_rng(seed=0)
for _ in range(10000):
    counts[vocab[sample(p, rng)]] += 1
print({k: round(c / 10000, 3) for k, c in counts.items()})`,
      lines: [
        { code: "u = rng.random()                         # uniform in [0, 1)", say: "One random number per token: the only source of randomness in generation." },
        { code: "return int(np.searchsorted(np.cumsum(p), u, side=\"right\"))   # first cumulative > u", say: "Map the uniform draw through the cumulative distribution: the roulette wheel." },
        { code: "rng = np.random.default_rng(seed=7)          # fixed seed: the draws are repeatable", say: "A seed makes sampling reproducible, which tests and audits need." },
      ],
      note: "The twelve draws are mostly Paris with an occasional Lyon or 'the'; over 10,000 draws the frequencies land within a few thousandths of the probabilities.",
    },
    useIt: "Use sampling for prose, dialogue, ideas and anything where several good answers exist; generate multiple candidates when a person or a judge can choose; log seeds and settings for reproducibility; and always pair sampling with temperature and truncation tuned to the task.",
    takeaways: ["Sampling draws tokens in proportion to their probability; runs differ.", "Temperature 1 reproduces the training text's level of surprise.", "Variety improves open-ended text and enables multiple candidates.", "A fixed seed makes sampling reproducible."],
    terms: [["sampling", "choosing the next token randomly according to the distribution"], ["seed", "the starting value of a random-number generator, which fixes the sequence of draws"]],
    reflect: { q: "Why does 'regenerate' in a chat app produce a different answer even though nothing else changed?", a: "The selection step is sampling: each token is a fresh random draw, so a new run follows a different path through the same distributions. With temperature 0 the answer would repeat." },
  },

  "m18-temperature": {
    simple: "Temperature divides the logits before softmax: below 1 it sharpens the distribution toward the favourite, above 1 it flattens it toward uniform; it changes how adventurous sampling is.",
    concept:
      "**Temperature** T is a single number applied to the logits: p = softmax(z / T). At T = 1 the distribution is the model's own. As T falls toward 0 the gaps between logits grow (dividing by a small number), so the favourite's share rises toward 100% and sampling becomes greedy. As T rises above 1 the gaps shrink, the distribution flattens, and rare tokens get a real chance; at very high T every token is nearly equally likely and the text dissolves into noise.\n\nIn the running example, T = 0.5 doubles every gap: Paris goes from 81% to 98%. T = 2 halves them: Paris drops to 53%, London rises from 1.5% to 7%.\n\nTemperature is the most used sampling control. Typical settings: 0 to 0.3 for extraction, classification and code; 0.5 to 0.8 for assistants and summaries; 0.8 to 1.2 for brainstorming and fiction. It does not change which token is most likely, only how often the others are picked, and it does not add knowledge: a wrong favourite stays wrong at any temperature.",
    why:
      "One model has to serve a precise contract reader and a playful story writer. Retraining for each is absurd; a dial that scales the distribution's sharpness gives both from the same weights and the same prompt. The name comes from physics, where temperature sets how often a system visits improbable states; the formula is the same Boltzmann distribution. Temperature exists because the right amount of randomness is a property of the task, and this is the cheapest way to set it.",
    how: [
      "Take the logits z.",
      "Divide every logit by T (T > 0). T < 1 widens the gaps; T > 1 narrows them.",
      "Apply softmax to z / T.",
      "Sample from the result (or take argmax, which T does not affect).",
      "Treat T = 0 as greedy by convention.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "logit", "T = 0.5", "T = 1", "T = 2"],
        rows: [
          ["Paris", "4.0", "0.978", "0.811", "0.526"],
          ["Lyon", "2.0", "0.018", "0.110", "0.194"],
          ["the", "1.0", "0.002", "0.040", "0.118"],
          ["a", "0.5", "0.001", "0.024", "0.091"],
          ["London", "0.0", "0.000", "0.015", "0.071"],
        ],
      },
      caption: "The same logits at three temperatures. The order never changes; the shares do.",
    },
    everyday: {
      title: "How strictly a chef follows the recipe",
      text: "At low temperature the chef makes the dish exactly as written every night: reliable, identical, a little dull. At medium, they vary a herb or a garnish. At high, they improvise freely and sometimes serve something strange. The recipe (the model) is the same; the dial is how much they deviate from the most likely choice at each step.",
    },
    engineering: {
      title: "One global setting that broke two features",
      text: "A product set temperature 0.9 everywhere because the marketing copy looked good. The support assistant then gave slightly different refund answers to identical questions, and the invoice extractor occasionally produced invented totals. Splitting the setting per endpoint, 0.2 for support, 0 for extraction, 0.9 for marketing, fixed both without touching prompts. The team's rule now: temperature is a property of the task, set next to the prompt, never global.",
    },
    maths: {
      formula: "p_v(T) = e^{z_v/T} / Σ_u e^{z_u/T}",
      meaning: "Divide logits by T before softmax; gaps scale by 1/T.",
      worked: [
        "T = 0.5: z/T = [8, 4, 2, 1, 0]; exponentials [2981, 54.6, 7.39, 2.72, 1.00]; sum 3046.7; p = [0.978, 0.018, 0.002, 0.001, 0.000].",
        "T = 2: z/T = [2, 1, 0.5, 0.25, 0]; exponentials [7.39, 2.72, 1.65, 1.28, 1.00]; sum 14.04; p = [0.526, 0.194, 0.118, 0.091, 0.071].",
        "Ratio Paris : Lyon is e^{2/T}: at T = 0.5 it is e⁴ ≈ 55; at T = 1, e² ≈ 7.4; at T = 2, e¹ ≈ 2.7.",
        "As T → ∞ all exponentials → 1 and p → [0.2, 0.2, 0.2, 0.2, 0.2]; as T → 0 p → [1, 0, 0, 0, 0].",
      ],
    },
    code: {
      title: "Temperature on the running example",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
logits = np.array([4.0, 2.0, 1.0, 0.5, 0.0])

def softmax_T(z, T):
    s = z / T                           # the whole effect of temperature is this division
    e = np.exp(s - s.max())
    return e / e.sum()

for T in (0.5, 1.0, 2.0):
    p = softmax_T(logits, T)
    print(f"T={T}: " + ", ".join(f"{v} {pr:.3f}" for v, pr in zip(vocab, p)))`,
      lines: [
        { code: "s = z / T                           # the whole effect of temperature is this division", say: "One division. Small T stretches the gaps; large T squeezes them." },
        { code: "for T in (0.5, 1.0, 2.0):", say: "The three columns of the table above." },
      ],
      output: "T=0.5: Paris 0.978, Lyon 0.018, the 0.002, a 0.001, London 0.000\nT=1.0: Paris 0.811, Lyon 0.110, the 0.040, a 0.024, London 0.015\nT=2.0: Paris 0.526, Lyon 0.194, the 0.118, a 0.091, London 0.071",
    },
    useIt: "Set temperature per task: near 0 for anything with a right answer, moderate for assistants, higher for creative work; combine with top-p to keep the tail out; and remember it cannot make a wrong model right, only more or less varied.",
    takeaways: ["Temperature divides logits before softmax: < 1 sharpens, > 1 flattens.", "It changes shares, not order; 0 is greedy.", "Typical: 0–0.3 precise, 0.5–0.8 assistant, 0.8–1.2 creative.", "A per-task setting, never global."],
    terms: [["temperature", "the divisor applied to logits before softmax that controls randomness"], ["Boltzmann distribution", "the physics formula softmax-with-temperature comes from"]],
    reflect: { q: "At temperature 0 the model still answered a factual question wrongly. Would lowering temperature further help?", a: "No; 0 is already greedy. The wrong token had the highest logit, which is a knowledge or prompting problem (retrieval, better context), not a sampling one." },
  },

  "m18-top-k-sampling": {
    simple: "Top-k sampling keeps only the k most probable tokens, renormalises, and samples among them; it removes the long tail with a fixed-size cut.",
    concept:
      "**Top-k sampling** truncates the distribution to its k highest-probability tokens, sets the rest to zero, rescales the survivors to sum to 1, and samples from them. With k = 2 in the running example only Paris and Lyon survive: 0.811 and 0.110 become 0.881 and 0.119. Everything else, including London, is impossible.\n\nThe purpose is to stop the long tail (Module 18.6) from contributing nonsense: with a 100,000-token vocabulary, thousands of tiny probabilities can sum to a few percent, and a draw that lands there produces a bizarre token. Top-k with k around 40 to 100 removes that risk while keeping plenty of variety.\n\nIts weakness is the fixed size. When the model is very sure (one token at 95%), k = 50 still lets 49 unlikely tokens compete for the remaining 5%. When the model is unsure (fifty plausible next words), k = 50 may cut off reasonable options. Top-p (next lesson) fixes this by cutting on probability mass rather than count.",
    why:
      "Sampling from the full distribution was found early to produce occasional incoherent tokens that derailed otherwise good text, and raising quality by lowering temperature made text dull. Truncation was the answer: keep sampling's variety among the plausible tokens, but forbid the implausible ones outright. Top-k was the first such rule, is trivial to implement, and remains common, often combined with top-p and temperature.",
    how: [
      "Compute the distribution (after temperature).",
      "Find the k largest probabilities.",
      "Set all other probabilities to zero (equivalently, their logits to −∞).",
      "Divide the survivors by their sum so they total 1.",
      "Sample from the truncated distribution.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "p (full)", "p (top-k = 2)", "p (top-k = 3)"],
        rows: [
          ["Paris", "0.811", "0.881", "0.844"],
          ["Lyon", "0.110", "0.119", "0.114"],
          ["the", "0.040", "0", "0.042"],
          ["a", "0.024", "0", "0"],
          ["London", "0.015", "0", "0"],
        ],
      },
      caption: "Keep k, zero the rest, rescale. The survivors' ratios to each other are unchanged.",
    },
    everyday: {
      title: "A shortlist before the vote",
      text: "A committee receives forty applications, shortlists five, and then chooses among those by discussion. Candidate thirty-eight never had a chance, which is the point: the shortlist stops a weak candidate slipping through on a strange day. Top-k is the shortlist; sampling is the discussion.",
    },
    engineering: {
      title: "Removing the one-in-a-thousand gibberish token",
      text: "A dialogue system at temperature 1.0 produced a nonsensical token roughly once per thousand, enough to appear in a few conversations a day with visible user complaints. Setting top-k = 50 eliminated the reports. The team later moved to top-p because, in short factual answers where the model was 99% sure, top-k = 50 still allowed odd alternatives about 1% of the time; but top-k alone had already removed the worst of it in an afternoon.",
    },
    maths: {
      formula: "p'_v = p_v / Σ_{u ∈ TopK} p_u if v ∈ TopK, else 0",
      meaning: "Survivors are rescaled by the mass they jointly held.",
      worked: [
        "k = 2: survivors Paris 0.811 and Lyon 0.110, total 0.921. Rescaled: 0.811/0.921 = 0.881, 0.110/0.921 = 0.119.",
        "k = 3: add 'the' 0.040; total 0.961; rescaled [0.844, 0.114, 0.042].",
        "Tail removed with k = 2: 0.079, the share that could have produced 'the', 'a' or 'London' as the capital of France.",
      ],
    },
    code: {
      title: "Top-k truncation",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
p = np.array([0.811, 0.110, 0.040, 0.024, 0.015])

def top_k(p, k):
    keep = np.argsort(p)[::-1][:k]            # indices of the k largest
    q = np.zeros_like(p)
    q[keep] = p[keep]                         # zero everything else
    return q / q.sum()                        # renormalise the survivors

for k in (2, 3):
    q = top_k(p, k)
    print(f"k={k}: " + ", ".join(f"{v} {pr:.3f}" for v, pr in zip(vocab, q)))`,
      lines: [
        { code: "keep = np.argsort(p)[::-1][:k]            # indices of the k largest", say: "The shortlist: a fixed number of tokens regardless of how the mass is spread." },
        { code: "return q / q.sum()                        # renormalise the survivors", say: "Rescale so the shortlist's probabilities sum to 1; their ratios are unchanged." },
      ],
      output: "k=2: Paris 0.881, Lyon 0.119, the 0.000, a 0.000, London 0.000\nk=3: Paris 0.844, Lyon 0.114, the 0.042, a 0.000, London 0.000",
    },
    useIt: "Use top-k (40–100) as a safety cut when sampling, especially with large vocabularies; combine with temperature; prefer top-p when the model's certainty varies a lot between steps, as it does in most conversations.",
    takeaways: ["Top-k keeps the k most probable tokens and samples among them.", "It removes the long tail's chance of nonsense.", "A fixed k is too loose when the model is sure and too tight when it is not.", "Commonly combined with temperature and top-p."],
    terms: [["top-k sampling", "sampling restricted to the k most probable tokens"], ["truncation", "zeroing part of the distribution before sampling"]],
    reflect: { q: "Why does top-k = 1 behave exactly like greedy decoding?", a: "Only the single most probable token survives, with probability rescaled to 1, so the draw always returns it." },
  },

  "m18-top-p-sampling": {
    simple: "Top-p (nucleus) sampling keeps the smallest set of top tokens whose probabilities add up to at least p, so the cut adapts: few tokens when the model is sure, many when it is not.",
    concept:
      "**Top-p sampling**, also called nucleus sampling, sorts tokens by probability, accumulates from the top, and keeps tokens until the running total reaches p (say 0.9). The kept set, the nucleus, is renormalised and sampled. When the model is confident the nucleus is tiny: in the running example, Paris alone is 0.811, Paris plus Lyon is 0.921, so with p = 0.9 the nucleus is {Paris, Lyon}. When the model is spread over many plausible tokens, the nucleus grows to include them all.\n\nThat adaptivity is the advantage over top-k. The same p = 0.9 gives one or two candidates in a factual answer and dozens in a creative sentence, matching the model's own uncertainty at each step. Typical values are 0.9 to 0.95.\n\nTop-p is usually combined with temperature (temperature first, then the cut) and sometimes with a loose top-k as a hard ceiling. Setting both temperature and top-p aggressively compounds their effects, so most guidance is to adjust one and leave the other near its default.",
    why:
      "A fixed count of candidates cannot be right for every step of a sentence: after 'The capital of France is' there is one good answer; after 'She opened the door and saw' there are hundreds. Cutting on probability mass follows the model's own confidence, keeping the tail out where it matters and the variety in where it is wanted. Nucleus sampling was introduced after studies showed that pure sampling degenerated into nonsense and that greedy or beam search degenerated into repetition; it became the default in most assistants.",
    how: [
      "Compute the distribution (after temperature).",
      "Sort tokens by probability, highest first.",
      "Accumulate probabilities down the list; stop at the first token where the total reaches p; keep everything up to and including it.",
      "Zero the rest; renormalise the kept set.",
      "Sample from the nucleus.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token (sorted)", "p", "cumulative", "in nucleus, p = 0.9?", "in nucleus, p = 0.95?"],
        rows: [
          ["Paris", "0.811", "0.811", "yes", "yes"],
          ["Lyon", "0.110", "0.921", "yes (reaches 0.9)", "yes"],
          ["the", "0.040", "0.961", "no", "yes (reaches 0.95)"],
          ["a", "0.024", "0.985", "no", "no"],
          ["London", "0.015", "1.000", "no", "no"],
        ],
      },
      caption: "The nucleus is whatever it takes to reach p. Here two tokens at p = 0.9, three at p = 0.95.",
    },
    everyday: {
      title: "Inviting guests until the room is mostly full",
      text: "You invite people in order of how likely they are to come, and stop once you expect 90% attendance. For a popular event that is a short list; for an uncertain one, a long list. You never use a fixed number of invitations, because the right number depends on how sure you are of each guest. That is top-p.",
    },
    engineering: {
      title: "Switching from top-k to top-p for a coding assistant",
      text: "A code-completion team used top-k = 40 with temperature 0.7. In boilerplate (where the model was 99% sure of the next token) the 39 alternatives still caused rare syntax slips; in comments and names (where many options were fine) 40 felt limiting. Moving to top-p = 0.95 cut syntax errors in completions by a third and raised acceptance of suggested names, with no prompt change. The cut now tracks the model's certainty token by token.",
    },
    maths: {
      formula: "Nucleus = smallest prefix of sorted tokens with Σ p ≥ p*;   p'_v = p_v / Σ_{u ∈ Nucleus} p_u",
      meaning: "Keep the top tokens until their mass reaches the threshold, then rescale.",
      worked: [
        "p* = 0.9: cumulative 0.811 (Paris) < 0.9; add Lyon → 0.921 ≥ 0.9. Nucleus {Paris, Lyon}; rescaled [0.881, 0.119].",
        "p* = 0.95: 0.921 < 0.95; add 'the' → 0.961. Nucleus of three; rescaled [0.811, 0.110, 0.040] / 0.961 = [0.844, 0.114, 0.042].",
        "Contrast a flat case: five tokens at 0.2 each. p* = 0.9 keeps all five; top-k = 2 would have kept only two despite equal plausibility.",
      ],
    },
    code: {
      title: "Nucleus truncation",
      lang: "py",
      src: `import numpy as np

vocab = ["Paris", "Lyon", "the", "a", "London"]
p = np.array([0.811, 0.110, 0.040, 0.024, 0.015])

def top_p(p, p_star):
    order = np.argsort(p)[::-1]
    cum = np.cumsum(p[order])
    n_keep = int(np.searchsorted(cum, p_star)) + 1   # tokens needed to reach p_star
    keep = order[:n_keep]
    q = np.zeros_like(p)
    q[keep] = p[keep]
    return q / q.sum()

for ps in (0.9, 0.95):
    q = top_p(p, ps)
    print(f"p={ps}: " + ", ".join(f"{v} {pr:.3f}" for v, pr in zip(vocab, q)))`,
      lines: [
        { code: "cum = np.cumsum(p[order])", say: "Running total down the sorted list." },
        { code: "n_keep = int(np.searchsorted(cum, p_star)) + 1   # tokens needed to reach p_star", say: "The nucleus size is whatever reaches the threshold: 2 at 0.9, 3 at 0.95 here." },
        { code: "return q / q.sum()", say: "Rescale the nucleus to sum to 1." },
      ],
      output: "p=0.9: Paris 0.881, Lyon 0.119, the 0.000, a 0.000, London 0.000\np=0.95: Paris 0.844, Lyon 0.114, the 0.042, a 0.000, London 0.000",
    },
    useIt: "Make top-p (0.9–0.95) your default truncation when sampling; pair it with a task-appropriate temperature; adjust one dial at a time. For deterministic tasks none of this applies, since temperature 0 ignores truncation.",
    takeaways: ["Top-p keeps the smallest top set reaching probability mass p, then samples.", "The cut adapts to the model's confidence at each step.", "Typical p is 0.9–0.95; combine with temperature, adjust one at a time.", "Preferred over top-k for conversation and prose."],
    terms: [["top-p (nucleus) sampling", "sampling restricted to the top tokens whose probabilities sum to p"], ["nucleus", "the kept set of tokens under top-p"]],
    reflect: { q: "With temperature 0.3 and top-p 0.9 on the running example, what is the nucleus?", a: "At T = 0.3 Paris's share rises to about 0.998, which already exceeds 0.9, so the nucleus is {Paris} alone; low temperature and top-p together make the output effectively greedy." },
  },

  "m18-repetition-penalties": {
    simple: "Repetition penalties lower the logits of tokens that have already appeared, discouraging loops and verbatim repeats without forbidding them outright.",
    concept:
      "Models, especially under greedy or low-temperature decoding, can fall into loops: repeating a phrase, re-listing the same items, or echoing the prompt. A **repetition penalty** edits the logits before sampling: tokens that already appear in the context (or in the generated text) have their logits reduced. Three common forms exist. A multiplicative penalty divides positive logits of seen tokens by a factor (say 1.2). A frequency penalty subtracts an amount proportional to how many times a token has appeared. A presence penalty subtracts a fixed amount if the token has appeared at all.\n\nThe effect is a thumb on the scale: a repeated token can still be chosen if it is far ahead, but close calls now go to new tokens. Set too high, the penalty breaks necessary repetition: a name that must recur, a closing bracket, the word 'the'. Set modestly (1.1 to 1.3 multiplicative, or 0.1 to 0.5 for the additive forms), it removes loops with little side effect.\n\nPenalties apply to token ids, not meaning, so a synonym escapes them, and in languages where common function words are single tokens the penalty can distort grammar if overused.",
    why:
      "The autoregressive loop (Module 18.8) feeds the model its own output, and a model that has just written 'very very' is, by its own statistics, likely to write 'very' again: repetition is self-reinforcing. Lowering temperature makes it worse; raising it adds noise everywhere. A targeted edit that only touches already-used tokens addresses the loop directly, which is why nearly every serving stack offers one.",
    how: [
      "Keep a count of token ids seen in the context and the generated output.",
      "Before softmax, for each seen token: divide its logit by the penalty factor if positive (multiply if negative), or subtract frequency × count and presence × 1.",
      "Proceed with temperature, truncation and sampling as usual.",
      "Tune on real outputs: raise the penalty until loops disappear, then back off if required repeats (names, brackets) start to break.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "logit", "seen before?", "× penalty 1.5 (divide if > 0)", "effect"],
        rows: [
          ["Paris", "4.0", "yes", "2.67", "still the favourite, by less"],
          ["Lyon", "2.0", "no", "2.0", "unchanged; now close to Paris"],
          ["the", "1.0", "yes", "0.67", "pushed down"],
          ["a", "0.5", "no", "0.5", "unchanged"],
          ["London", "0.0", "no", "0.0", "unchanged"],
        ],
      },
      caption: "A multiplicative penalty on the running example, pretending Paris and 'the' already appeared. The gap between Paris and Lyon shrinks from 2.0 to 0.67.",
    },
    everyday: {
      title: "A host steering the conversation away from a repeated story",
      text: "At dinner, Uncle starts telling the fishing story for the third time. A good host does not forbid it; they gently lower its appeal by changing the subject, so unless Uncle is really determined, something new gets said. A repetition penalty is that nudge: already-told tokens are made a little less attractive, not banned.",
    },
    engineering: {
      title: "A summariser that listed the same bullet five times",
      text: "A meeting-notes summariser at temperature 0.2 sometimes produced the same action item repeatedly. A frequency penalty of 0.3 removed the repeats. Raising it to 1.0 in testing caused a new failure: the names of attendees, which must appear in several items, began to be replaced by pronouns and mis-spellings, because their tokens were penalised each time they recurred. The team settled at 0.3 and added an eval case for 'the same name in three bullets'.",
    },
    maths: {
      formula: "multiplicative: z'_v = z_v / r (z_v > 0) or z_v · r (z_v ≤ 0) for seen v;   additive: z'_v = z_v − α·count_v − β·[count_v > 0]",
      meaning: "Seen tokens have their logits reduced, by a factor or by amounts tied to frequency and presence.",
      worked: [
        "Running example with Paris seen once, r = 1.5: Paris 4.0 → 2.67. Softmax of [2.67, 2.0, 1.0, 0.5, 0.0]: exponentials [14.4, 7.39, 2.72, 1.65, 1.00], sum 27.2 → Paris 0.53, Lyon 0.27, the 0.10, a 0.06, London 0.04.",
        "Additive with α = 0.5 and Paris seen 3 times: 4.0 − 1.5 = 2.5; with β = 0.5 presence as well: 2.0, level with Lyon.",
        "A token already at logit −1 under a multiplicative penalty becomes −1.5: penalties push negative logits further down, as intended.",
      ],
    },
    code: {
      title: "Applying a frequency and presence penalty",
      lang: "py",
      src: `import numpy as np
from collections import Counter

vocab = ["Paris", "Lyon", "the", "a", "London"]
logits = np.array([4.0, 2.0, 1.0, 0.5, 0.0])
history = ["Paris", "the", "Paris", "Paris"]           # tokens already in the context/output

def penalise(logits, history, alpha=0.5, beta=0.3):
    z = logits.copy()
    counts = Counter(history)
    for i, tok in enumerate(vocab):
        c = counts.get(tok, 0)
        if c:
            z[i] -= alpha * c + beta                   # frequency and presence penalties
    return z

z = penalise(logits, history)
print(dict(zip(vocab, z.round(2))))`,
      lines: [
        { code: "counts = Counter(history)", say: "How many times each token has appeared so far." },
        { code: "z[i] -= alpha * c + beta                   # frequency and presence penalties", say: "Paris, seen three times, loses 1.5 + 0.3 = 1.8; 'the', seen once, loses 0.8; the rest are untouched." },
      ],
      output: "{'Paris': 2.2, 'Lyon': 2.0, 'the': 0.2, 'a': 0.5, 'London': 0.0}",
    },
    useIt: "Reach for a modest repetition penalty when you see loops or repeated items, especially at low temperature; test that necessary repeats (names, code tokens) survive; and treat it as a patch, since a better prompt or a slightly higher temperature often removes the cause.",
    takeaways: ["Penalties reduce logits of already-seen tokens to discourage loops.", "Multiplicative, frequency and presence forms; modest values.", "Too strong breaks necessary repetition and grammar.", "A patch for a symptom of autoregressive self-reinforcement."],
    terms: [["repetition penalty", "a logit reduction for tokens already present in the text"], ["frequency penalty", "a reduction proportional to how often a token has appeared"], ["presence penalty", "a fixed reduction for any token that has appeared"]],
    reflect: { q: "Why might a repetition penalty hurt code generation more than prose?", a: "Code repeats tokens by necessity: brackets, keywords, variable names. Penalising them pushes the model toward wrong identifiers or unbalanced syntax; prose has synonyms to fall back on, code does not." },
  },

  "m18-stop-sequences": {
    simple: "A stop sequence is a string that ends generation the moment it appears, giving your code a precise cut-off point without waiting for the model's own end token or the length limit.",
    concept:
      "Generation normally ends when the model emits its end-of-sequence token or when max_tokens is reached. **Stop sequences** add a third rule: the serving code watches the generated text and stops as soon as any of a list of strings appears, returning the text before it. Typical stops: a delimiter you asked the model to write ('###', '</answer>'), the start of the next turn in a transcript ('\\nUser:'), or a closing fence for a code block.\n\nStops operate on text, not tokens: the serving layer detokenises as it goes and checks for the strings, so a stop may land mid-token and the cut is made at the character level. They are checked after each decode step and are exact matches, so whitespace and case matter.\n\nStops do not change the model's distribution; they only truncate output. They are a cheap way to keep answers in a format: ask for exactly one item followed by a marker, stop at the marker, and the model cannot ramble on, even if it would have.",
    why:
      "Models often continue past the useful answer: adding a second example, starting a hypothetical next question, or writing explanation after the code you wanted. Waiting for the end token wastes output tokens and complicates parsing; max_tokens cuts at an arbitrary place. A stop sequence lets the prompt define the boundary ('answer, then write ###') and the server enforce it precisely. It is also the standard way to prevent a model from role-playing both sides of a dialogue when the prompt is a transcript.",
    how: [
      "Design the prompt so the model will emit a known marker right after the wanted content.",
      "Pass the marker(s) as stop sequences in the request.",
      "The server checks the detokenised output after every step; on a match it stops and strips the marker.",
      "Also set max_tokens as a backstop in case the marker never appears.",
      "Treat stop sequences as part of the prompt contract: change one, change the other.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Prompt", detail: "'Give the capital, then write ###.'" },
        { label: "Generated so far", detail: "'Paris'" },
        { label: "Next tokens", detail: "' ###' appears" },
        { label: "Server", detail: "matches the stop sequence; stops; returns 'Paris'" },
        { label: "Not generated", detail: "'The capital of Germany is…' never costs a token" },
      ],
      caption: "The model might have continued; the stop sequence makes continuing impossible.",
    },
    everyday: {
      title: "A buzzer at the end of the allotted answer",
      text: "In a quiz show the contestant answers and says 'final answer'; the host stops them there, whatever they were about to add. The phrase is the stop sequence: agreed in advance, recognised instantly, and it means anything after it is not part of the answer.",
    },
    engineering: {
      title: "Keeping a transcript model to one side of the dialogue",
      text: "A roleplay feature prompts the model with a transcript ending in 'Assistant:'. Without stops, the model wrote the assistant's line and then invented the user's next line and its own reply, three turns at a time, wasting tokens and confusing the UI. Adding '\\nUser:' as a stop sequence cut generation exactly after the assistant's line. Output tokens per turn dropped by 60% and the parsing code lost its hacks.",
    },
    maths: {
      formula: "stop at the smallest t such that detok(y_1 … y_t) ends with s for some s ∈ Stops;   return detok(y_1 … y_t) minus s",
      meaning: "Generation halts at the first step whose decoded text ends with a stop string; the string is removed.",
      worked: [
        "Expected answer length 5 tokens plus a 2-token marker versus a model that would otherwise write 120 tokens before its end token: stops save about 113 output tokens per call.",
        "At 15 units per million output tokens and 200,000 calls a day: 113 × 200,000 × 15 / 10⁶ ≈ 339 units per day saved.",
        "Backstop: max_tokens = 50 bounds the cost if the marker is never produced.",
      ],
    },
    code: {
      title: "A request with stop sequences and a backstop",
      lang: "ts",
      src: `const reply = await client.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 50,                                   // backstop if the marker never appears
  stop_sequences: ["###", "\\nUser:"],              // exact strings; whitespace matters
  system: "Answer with the capital city only, then write ### on the same line.",
  messages: [{ role: "user", content: "France" }],
});

const text = reply.content[0].type === "text" ? reply.content[0].text : "";
console.log(JSON.stringify(text));                 // "Paris " (the marker is stripped)
console.log(reply.stop_reason);                     // "stop_sequence"`,
      lines: [
        { code: "stop_sequences: [\"###\", \"\\nUser:\"],              // exact strings; whitespace matters", say: "Two stops: the marker the prompt requested, and a transcript guard." },
        { code: "system: \"Answer with the capital city only, then write ### on the same line.\",", say: "The prompt and the stop sequence are one contract: ask for the marker, stop at the marker." },
        { code: "console.log(reply.stop_reason);                     // \"stop_sequence\"", say: "The response says why it stopped: end token, max_tokens or a stop sequence. Log it; a run of max_tokens stops means the marker is being missed." },
      ],
    },
    useIt: "Use stop sequences to cut output at a boundary you define, to keep transcript prompts to one turn, and to save output tokens; always pair with max_tokens; watch stop_reason in logs to see whether your contract is being honoured.",
    takeaways: ["Stop sequences end generation when a string appears; the string is stripped.", "They truncate output; they do not change the model's distribution.", "Pair a marker in the prompt with the same marker as a stop.", "Keep max_tokens as a backstop and monitor stop_reason."],
    terms: [["stop sequence", "a string whose appearance ends generation"], ["stop_reason", "the response field saying why generation ended"]],
    reflect: { q: "A response has stop_reason 'max_tokens' when you expected 'stop_sequence'. What happened?", a: "The model never wrote the marker before the length cap, so the output is probably truncated mid-answer; the prompt's instruction to write the marker is being ignored, or the cap is too low for the answer." },
  },

  "m18-streaming-responses": {
    simple: "Streaming sends each token to the client as soon as it is generated, so users see text appear within a fraction of a second instead of waiting for the whole answer.",
    concept:
      "**Streaming** delivers the output of the generation loop incrementally. After the prompt pass, each decode step's token is detokenised and pushed to the client over a long-lived connection (server-sent events or a chunked HTTP response), rather than being buffered until the end token. The user sees the first words after the prompt pass, typically under a second, and then text flowing at the model's tokens-per-second rate.\n\nStreaming changes nothing about the model or the tokens produced; the total time to the last token is the same. What changes is perceived latency: a 10-second answer that starts appearing at 0.5 seconds feels responsive, while the same answer delivered all at once after 10 seconds feels broken. It also enables interruption: a user can stop a long answer, and the server can cancel the loop and stop paying for tokens.\n\nOn the client, streaming requires handling partial text: rendering as it arrives, buffering incomplete characters and markdown, and dealing with a stream that ends in an error after some text has been shown.",
    why:
      "Autoregressive generation is inherently slow for long answers (Module 18.8), and nothing can make a 400-token answer arrive in less than 400 decode steps. Streaming turns that constraint into an acceptable experience by showing progress, and it reflects the loop honestly: tokens really are produced one at a time. It also saves money and time on abandoned answers, since a cancelled stream stops the server loop.",
    how: [
      "The client opens a request with streaming enabled.",
      "The server runs the prompt pass, then for each decode step detokenises the new token and writes it to the stream as an event.",
      "The client appends each event's text to the display, buffering partial characters or unclosed markdown.",
      "On the end token, a stop sequence or max_tokens, the server sends a final event with the stop reason and usage, and closes the stream.",
      "If the client disconnects, the server cancels the loop and frees the cache.",
    ],
    visual: {
      kind: "flow",
      steps: ["request (stream: true)", "prompt pass ≈ 0.4 s", "event: 'Paris'", "event: ' is'", "event: ' the' …", "final event: stop_reason, usage", "stream closed"],
      caption: "Tokens leave the server as they are made. The first event is the time-to-first-token.",
    },
    everyday: {
      title: "A live commentary versus a match report",
      text: "A radio commentary tells you what is happening as it happens; a match report arrives an hour later with the same facts. The game takes ninety minutes either way, but one lets you follow along and switch off when you have heard enough. Streaming is the commentary.",
    },
    engineering: {
      title: "Abandonment fell when the first word arrived sooner",
      text: "A support chat showed a spinner until the whole answer was ready: a median of 6 seconds. A third of users left before it appeared. Switching to streaming put the first words on screen at about 0.7 seconds, and although the full answer still took 6 seconds, abandonment fell to a tenth. A Stop button that cancels the server loop cut wasted output tokens by 15%, because users stopped answers that had already said what they needed.",
    },
    maths: {
      formula: "t_first ≈ prefill;   t_token_k ≈ t_first + k × t_step;   perceived wait = t_first (streaming) vs t_first + T × t_step (buffered)",
      meaning: "Streaming moves the perceived wait from the end of generation to its start.",
      worked: [
        "Prompt pass 0.5 s, 25 ms per token, 300-token answer: buffered delivery after 0.5 + 300 × 0.025 = 8.0 s; streamed, first word at 0.5 s, last at 8.0 s.",
        "If users abandon after 3 s of nothing, buffered loses most of them; streamed shows 100 tokens by then.",
        "A user who stops after 120 tokens saves 180 × 15 / 10⁶ units in output cost, and frees the server 4.5 s early.",
      ],
    },
    code: {
      title: "Streaming from the API to a page",
      lang: "ts",
      src: `app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  const stream = client.messages.stream({
    model: "claude-sonnet-5-5",
    max_tokens: 600,
    messages: req.body.messages,
  });

  req.on("close", () => stream.abort());                 // user left or pressed Stop: cancel the loop

  stream.on("text", (delta) => {
    res.write("data: " + JSON.stringify({ text: delta }) + "\\n\\n");   // one event per token chunk
  });
  const final = await stream.finalMessage();
  res.write("data: " + JSON.stringify({ done: true, stop_reason: final.stop_reason, usage: final.usage }) + "\\n\\n");
  res.end();
});`,
      lines: [
        { code: "const stream = client.messages.stream({", say: "Ask the provider to stream; tokens arrive as events instead of one response." },
        { code: "req.on(\"close\", () => stream.abort());                 // user left or pressed Stop: cancel the loop", say: "Cancellation propagates to the model: no more tokens are generated or billed." },
        { code: "res.write(\"data: \" + JSON.stringify({ text: delta }) + \"\\n\\n\");   // one event per token chunk", say: "Server-sent events: each delta goes to the browser immediately." },
        { code: "res.write(\"data: \" + JSON.stringify({ done: true, stop_reason: final.stop_reason, usage: final.usage }) + \"\\n\\n\");", say: "The final event carries why it stopped and the token counts for logging." },
      ],
    },
    useIt: "Stream any answer a person reads live; render incrementally and handle partial characters, markdown and mid-stream errors; wire a Stop control to cancellation; and log the final event's stop reason and usage. Do not stream when code consumes the output whole (structured extraction): wait for the complete, validated result.",
    takeaways: ["Streaming sends tokens as they are generated; total time is unchanged, perceived latency drops to the prompt pass.", "Enables cancellation, which saves tokens and compute.", "Clients must handle partial text and errors after partial output.", "Stream for people; buffer for code."],
    terms: [["streaming", "delivering generated tokens incrementally over an open connection"], ["server-sent events", "a simple HTTP format for pushing a sequence of events to a browser"], ["time to first token", "the delay before the first streamed token, mostly the prompt pass"]],
    reflect: { q: "Why is streaming a bad fit for an endpoint that returns JSON for another program to parse?", a: "Partial JSON is unparseable and cannot be validated; the consumer needs the whole, checked object. Stream to humans, who can read partial text; buffer for code." },
  },
};

export const M18_QUIZ: Quiz[] = [
  {
    q: "What does the prompt pass produce?",
    options: ["The whole answer", "The KV cache for the prompt and the logits for the first output token", "A summary of the prompt", "The tokeniser"],
    answer: 1,
    why: ["Nothing has been generated yet.", "Correct. Reading the prompt once fills the cache and yields the first distribution.", "No.", "The tokeniser is fixed beforehand."],
  },
  {
    q: "Logits [4.0, 2.0, 1.0, 0.5, 0.0] → which is closest to the softmax probabilities?",
    options: ["[0.4, 0.2, 0.1, 0.05, 0.0]", "[0.81, 0.11, 0.04, 0.02, 0.01]", "[0.2, 0.2, 0.2, 0.2, 0.2]", "[1, 0, 0, 0, 0]"],
    answer: 1,
    why: ["Logits are not probabilities and do not sum to 1.", "Correct. e⁴/67.36 ≈ 0.81 and so on.", "That would need equal logits.", "Softmax never gives exact zeros."],
    reason: true,
  },
  {
    q: "A model keeps repeating 'the the the' under greedy decoding. Which fix addresses the cause most directly?",
    options: ["Larger context window", "A modest repetition penalty or a little sampling", "Lower temperature", "More input tokens"],
    answer: 1,
    why: ["Unrelated.", "Correct. Loops are self-reinforcing under greedy; penalising seen tokens or sampling breaks them.", "Greedy is already temperature 0; lower is impossible.", "No."],
  },
  {
    q: "What does temperature 0.5 do to the distribution [0.81, 0.11, 0.04, 0.02, 0.01]?",
    options: ["Flattens it toward uniform", "Sharpens it: the favourite rises to about 0.98", "Reorders the tokens", "Removes the tail"],
    answer: 1,
    why: ["That is temperature > 1.", "Correct. Dividing logits by 0.5 doubles the gaps.", "Temperature never changes the order.", "Truncation is top-k/top-p."],
  },
  {
    q: "Why is top-p usually preferred to top-k for conversation?",
    options: ["It is faster", "Its cut adapts to the model's confidence at each step", "It always keeps more tokens", "It is deterministic"],
    answer: 1,
    why: ["Both are cheap.", "Correct. Few candidates when sure, many when unsure; top-k is a fixed count.", "Sometimes fewer, sometimes more.", "Both are sampling rules."],
    reason: true,
  },
  {
    q: "With p = 0.9 on the running example, what is the nucleus?",
    options: ["{Paris}", "{Paris, Lyon}", "{Paris, Lyon, the}", "all five"],
    answer: 1,
    why: ["0.811 is below 0.9.", "Correct. 0.811 + 0.110 = 0.921 reaches 0.9.", "That is the p = 0.95 nucleus.", "No."],
  },
  {
    q: "A stop sequence does which of the following?",
    options: ["Changes the model's probabilities", "Ends generation when a given string appears and strips it", "Increases max_tokens", "Makes output deterministic"],
    answer: 1,
    why: ["It never touches the distribution.", "Correct. A text-level cut defined by your contract with the prompt.", "max_tokens is separate and should still be set.", "Determinism is temperature 0."],
  },
  {
    q: "Streaming reduces which of these?",
    options: ["Total generation time", "Perceived latency and tokens wasted on abandoned answers", "The number of output tokens", "The prompt pass time"],
    answer: 1,
    why: ["The last token arrives at the same time.", "Correct. Text appears after the prompt pass, and cancellation stops the loop.", "The same tokens are produced unless cancelled.", "The prompt pass is unchanged."],
  },
  {
    q: "Why is a 20-token answer with 0.9 probability per token a low-probability object overall?",
    options: ["Because tokens are independent", "Because sequence probability is the product of per-token probabilities: 0.9²⁰ ≈ 0.12", "Because of the tokeniser", "It is not; it is 0.9"],
    answer: 1,
    why: ["They are conditional, but the probability still multiplies.", "Correct. Autoregressive probability compounds over length.", "No.", "The product shrinks with every token."],
  },
];

export const M18_EXERCISES: Exercise[] = [
  {
    title: "Temperature by hand",
    kind: "calculate",
    task: "Logits [3.0, 1.0, 0.0] for tokens [yes, no, maybe]. Compute the probabilities at T = 1, T = 0.5 and T = 3.",
    hints: ["Divide logits by T first.", "e³ = 20.1, e¹ = 2.72, e⁰ = 1; e⁶ = 403, e² = 7.39; e¹ = 2.72, e^{1/3} = 1.40."],
    solution: "T = 1: [20.1, 2.72, 1] / 23.8 = [0.84, 0.11, 0.04]. T = 0.5: logits [6, 2, 0] → [403, 7.39, 1] / 411 = [0.98, 0.02, 0.002]. T = 3: logits [1, 0.33, 0] → [2.72, 1.40, 1] / 5.12 = [0.53, 0.27, 0.20]. Order is unchanged; the shares move toward the favourite as T falls and toward uniform as T rises.",
  },
  {
    title: "Top-k versus top-p on a flat distribution",
    kind: "calculate",
    task: "Ten tokens with probabilities [0.15, 0.14, 0.13, 0.12, 0.11, 0.10, 0.09, 0.08, 0.05, 0.03]. What survives under top-k = 3 and under top-p = 0.9? Which better reflects the model's uncertainty?",
    hints: ["Accumulate from the top for top-p."],
    solution: "Top-k = 3 keeps the first three (0.42 of the mass), rescaled to [0.36, 0.33, 0.31]: it discards seven plausible tokens. Top-p = 0.9: cumulative reaches 0.92 after eight tokens, so eight survive. Top-p reflects that the model is genuinely unsure; top-k imposed a false certainty.",
  },
  {
    title: "Implement the full selection pipeline",
    kind: "code",
    task: "Write select(logits, history, temperature, top_p, repetition_alpha, forbidden) that applies, in order, a frequency penalty, a forbidden-token mask, temperature, softmax, top-p truncation and a seeded random draw. Run it 1,000 times on the running example with history ['Paris'], temperature 0.8, top-p 0.95, alpha 0.5, and report the frequency of each token.",
    hints: ["Penalty and mask edit logits; temperature divides; truncate after softmax; renormalise before drawing.", "Use np.random.default_rng(seed)."],
    solution: "After the penalty Paris drops to 3.5; at T = 0.8 logits [4.375, 2.5, 1.25, 0.625, 0] → probabilities ≈ [0.82, 0.13, 0.04, 0.02, 0.01]; top-p 0.95 keeps Paris, Lyon, the (cumulative 0.99 ≥ 0.95 after three); renormalised ≈ [0.83, 0.13, 0.04]. Over 1,000 draws expect roughly 830 Paris, 130 Lyon, 40 'the', and never 'a' or 'London'.",
  },
  {
    title: "Design the decoding settings",
    kind: "think",
    task: "For each feature choose temperature, top-p, repetition penalty, stop sequences and streaming, and justify: (a) extracting line items from receipts into JSON; (b) a support chat assistant; (c) generating five product-name ideas; (d) a code-completion suggestion in an editor.",
    hints: ["Right answer → deterministic; many good answers → sampling; code consumed by programs → no streaming."],
    solution: "(a) T = 0, no top-p needed, no penalty, stop at the closing brace or use a JSON grammar, no streaming (validate the whole object). (b) T ≈ 0.5, top-p 0.9, light presence penalty 0.1, stop at '\\nUser:' if transcript-style, streaming on with a Stop button. (c) T ≈ 1.0, top-p 0.95, frequency penalty 0.5 so names differ, stop after five lines, streaming optional. (d) T ≈ 0.2, top-p 0.95, no penalty (code repeats tokens), stop at a blank line or end of function, streaming on for responsiveness.",
  },
];
