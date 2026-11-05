import type { Exercise, LessonBody, Quiz } from "../types";

// Module 17: Large language models. One concept per lesson.
// Reference numbers: a "7B" decoder with d = 4,096, 32 blocks, 32 heads, d_ff = 11,008, vocabulary 32,000, context 8,192.

export const M17_BODIES: Record<string, LessonBody> = {
  "m17-llms": {
    simple: "A large language model is a transformer decoder with billions of parameters, trained on a huge amount of text to predict the next token, which turns out to be enough to follow instructions, write code and hold conversations.",
    concept:
      "A **large language model** (LLM) is the transformer of Module 16, scaled up and trained on a large slice of the written internet. Its only task during pretraining is next-token prediction (Module 14): given the text so far, assign a probability to every possible next token. Done at the scale of hundreds of billions of parameters and trillions of tokens, that task forces the model to absorb grammar, facts, styles, programming languages and the patterns of reasoning that appear in text, because all of them help predict what comes next.\n\nAfter pretraining, a second, much smaller training stage (Stage 5) teaches the model to behave as an assistant: answer questions, follow instructions, refuse harmful requests. The result is what you talk to through a chat interface or an API.\n\nWhat an LLM is not: it is not a database of facts (facts are blurred into weights), not a reasoning engine with guarantees (it produces plausible continuations), and not aware of anything after its training data. Modules 18 and 19 make those limits concrete; this module describes what the thing is.",
    why:
      "Before LLMs, every language task needed its own model and labelled data: one for sentiment, one for translation, one for summarisation. LLMs changed the economics: one pretrained model, prompted in plain language, performs tasks it was never explicitly trained on, often better than the specialised models. That is why they became a general building block for software. Understanding what they are, a very large next-token predictor with an assistant layer on top, is the foundation for using them well: it explains both their breadth and their failures.",
    how: [
      "Collect trillions of tokens of text and code; clean and deduplicate it (Module 20).",
      "Train a decoder transformer with billions of parameters to predict the next token, for weeks on thousands of GPUs.",
      "Fine-tune on examples of instructions and good answers so the model answers rather than merely continues (Module 21).",
      "Align with human preference data so answers are helpful, honest and safe (Module 23).",
      "Serve it behind an API: tokenise the prompt, run the forward pass, decode tokens one at a time (Module 18).",
    ],
    visual: {
      kind: "flow",
      steps: ["web text + code (trillions of tokens)", "pretraining: next-token prediction", "base model (completes text)", "instruction tuning + alignment", "assistant model (answers, follows rules)", "API / chat"],
      caption: "The base model is a continuation machine; the assistant layer makes it answer. Both are the same transformer.",
    },
    everyday: {
      title: "A well-read friend who has never left the library",
      text: "Imagine someone who has read almost everything ever written but has never been outside, never checked a fact against the world, and remembers it all as a blur of what usually follows what. Ask them anything and they answer fluently, usually right, sometimes confidently wrong, and always from memory. They cannot tell you what happened yesterday. That is an LLM, and it explains why you should give it the newspaper (context) rather than ask it to recall the news.",
    },
    engineering: {
      title: "One model replacing six",
      text: "A customer-support platform ran six specialised models: intent classification, language detection, sentiment, entity extraction, summarisation and reply drafting, each with its own training pipeline and labelled dataset. They replaced five of them with one instruction-tuned LLM and carefully written prompts, keeping only the small classifier for routing because it was cheaper per request. Maintenance fell from six pipelines to one prompt library plus an evaluation suite. The trade: higher cost per call and a new failure mode, confident but wrong extractions, which they caught with structured output and validation (Stage 6).",
    },
    maths: {
      formula: "p(x_{t+1} | x_1 … x_t) = softmax(W_out · Transformer(x_1 … x_t)[t])",
      meaning: "The whole model is a function from a token sequence to a probability distribution over the next token.",
      worked: [
        "A 7B model: 32 blocks, d = 4,096. Per block ≈ 4·4,096² (attention) + 3·4,096·11,008 (a gated FFN) ≈ 67M + 135M ≈ 202M; 32 blocks ≈ 6.5B; embeddings 32,000 × 4,096 ≈ 131M; total ≈ 6.7B, rounded to '7B'.",
        "Training on 2 trillion tokens at ≈ 6 FLOPs per parameter per token: 6 · 7×10⁹ · 2×10¹² ≈ 8.4×10²² FLOPs; at 10¹⁵ FLOP/s sustained across a cluster, about 970 days of one-device time, so around a thousand devices for a month.",
      ],
    },
    code: {
      title: "What calling an LLM looks like",
      lang: "ts",
      src: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();   // reads the API key from the environment

const reply = await client.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 200,
  system: "You answer questions about European geography in one sentence.",
  messages: [{ role: "user", content: "What is the capital of Australia?" }],
});

console.log(reply.content[0].type === "text" ? reply.content[0].text : "");
console.log(reply.usage);          // input and output token counts`,
      lines: [
        { code: "const client = new Anthropic();   // reads the API key from the environment", say: "The model runs on the provider's servers; your code sends tokens and receives tokens." },
        { code: "system: \"You answer questions about European geography in one sentence.\",", say: "The assistant layer makes the model follow instructions like this one. Note the question is outside the stated scope; a good assistant model will say so or answer briefly anyway." },
        { code: "console.log(reply.usage);          // input and output token counts", say: "Everything is counted in tokens: the prompt you sent and the answer generated." },
      ],
      note: "Stage 6 covers the API in depth. Here the point is the shape: text in, text out, tokens counted.",
    },
    useIt: "You will use LLMs through APIs or run open-weight ones yourself for drafting, summarising, extracting, classifying, coding and conversation. Knowing that it is a next-token predictor with an assistant layer tells you what to supply (context, instructions, examples) and what to verify (facts, numbers, anything with consequences).",
    takeaways: ["An LLM is a scaled-up decoder transformer trained to predict the next token on vast text.", "Prediction at that scale yields grammar, facts, code and instruction-following as side effects.", "A smaller alignment stage turns a continuation machine into an assistant.", "It is not a database, not a verified reasoner, and knows nothing after its training data."],
    terms: [["large language model (LLM)", "a billion-parameter-scale transformer trained on text to predict the next token"], ["base model", "the pretrained model before instruction tuning; it continues text rather than answering"], ["assistant model", "a base model fine-tuned and aligned to follow instructions"]],
    reflect: { q: "If the training task is only next-token prediction, where does the ability to answer questions come from?", a: "Text is full of questions followed by answers, so predicting the continuation of a question means producing an answer. Instruction tuning then makes that the default behaviour instead of one of many possible continuations." },
  },

  "m17-what-makes-a-model-large": {
    simple: "'Large' means billions of parameters, trained on trillions of tokens with enormous compute; all three grow together, and capabilities appear as they do.",
    concept:
      "Three quantities make a model **large**: the number of parameters (the adjustable weights), the number of training tokens, and the compute spent, which is roughly the product of the two. A 7B model has 7 billion parameters; the largest have over a trillion. Training sets grew from a few billion tokens in 2018 to tens of trillions. Compute grew by a factor of millions.\n\nThe discovery that justified the growth is the **scaling law**: loss on held-out text falls smoothly and predictably as parameters, data and compute increase, following a power law, with no sign of flattening across many orders of magnitude. Alongside the smooth loss curve, specific abilities (arithmetic, following multi-step instructions, translating low-resource languages) tend to appear at particular scales, which is why a 70B model can do things a 7B model cannot, even though both were trained the same way.\n\nLarge also means expensive to run: a 70B model needs around 140 GB of memory in 16-bit precision and several GPUs to serve, while a 7B model fits on one. Size is therefore a trade between capability and cost (Module 40).",
    why:
      "Engineers needed to know whether spending ten times more would help, and by how much, before committing millions to a training run. Scaling laws answered that: you can predict a bigger model's loss from smaller ones. They also revealed a balance: for a fixed compute budget, parameters and tokens should grow together (roughly 20 tokens per parameter), rather than building a huge model and under-training it. That insight reshaped how models were built after 2022, producing smaller models trained on far more data that match larger, older ones.",
    how: [
      "Choose a compute budget C (FLOPs you can afford).",
      "Scaling guidance: parameters N and tokens D should both grow, with D ≈ 20 N for compute-optimal training.",
      "Train several small models, fit the loss-versus-compute curve, and extrapolate to the target.",
      "Train the large model; check that the loss lands on the predicted curve.",
      "Evaluate capabilities on benchmarks; some appear only above a certain scale.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model class", "Parameters", "Training tokens (typical)", "Memory to serve (16-bit)", "Runs on"],
        rows: [
          ["small", "1–3B", "1–3T", "2–6 GB", "a laptop or phone"],
          ["mid", "7–13B", "2–15T", "14–26 GB", "one GPU"],
          ["large", "30–70B", "5–15T", "60–140 GB", "2–8 GPUs"],
          ["frontier", "hundreds of billions to trillions", "10T+", "terabytes", "a cluster"],
        ],
      },
      caption: "Parameters, data and serving cost rise together. The right size is the smallest that does the job.",
    },
    everyday: {
      title: "Learning a language from books",
      text: "Someone who reads a hundred books in Spanish gets by; a thousand, and they write well; ten thousand, and they pick up regional idioms and legal phrasing nobody taught them. The jump is not only in how much they read but in how much they can hold: a bigger memory and more reading reinforce each other. Model scale works the same way, with parameters as memory and tokens as reading, and some skills only showing up past a threshold.",
    },
    engineering: {
      title: "Picking a size for a document-extraction product",
      text: "A team compared 3B, 8B and 70B models on extracting fields from invoices. Accuracy: 71%, 89%, 93%. Cost per thousand documents: 0.4, 1.1 and 9.5 units; latency 0.3, 0.8 and 4 seconds. The 8B model with a few examples in the prompt and validation on top reached 92%, within a point of the 70B at a ninth of the cost. They shipped the 8B and routed the 2% of documents it was unsure about to the 70B. Scaling laws told them the jump from 8B to 70B would help; measurement told them how much it was worth.",
    },
    maths: {
      formula: "L(N, D) ≈ E + A/N^α + B/D^β;   compute-optimal: D ≈ 20 N;   C ≈ 6 N D",
      meaning: "Loss falls as a power law in parameters N and tokens D toward an irreducible floor E; for a given compute C, balance N and D.",
      worked: [
        "Budget C = 10²³ FLOPs. With D = 20N: C = 6 · N · 20N = 120 N², so N = √(10²³ / 120) ≈ 2.9×10¹⁰ ≈ 29B parameters and D ≈ 580B tokens.",
        "Under-trained alternative: N = 100B with D = 170B tokens uses the same compute but sits far from the optimum; a 29B model trained on 580B tokens reaches lower loss.",
        "Illustrative power law with α = 0.07: increasing N by 10× lowers the A/N^α term by a factor 10^0.07 ≈ 1.17, about 15%. Gains are real but slow, which is why data and compute matter as much as size.",
      ],
      note: "The constants are from published fits and vary by setup; the shapes are what matter.",
    },
    useIt: "You will choose model sizes for every feature you build, trading accuracy against cost and latency. Scaling laws explain why newer small models beat older large ones (more data per parameter), why benchmarks jump at certain sizes, and why serving cost rises with capability; measurement on your own task decides.",
    takeaways: ["Large = billions of parameters, trillions of tokens, enormous compute, growing together.", "Loss follows predictable power laws; some abilities appear only past a scale threshold.", "Compute-optimal training balances parameters and data (≈ 20 tokens per parameter).", "Size is a cost: pick the smallest model that meets the bar, measured."],
    terms: [["parameter count", "the number of learned weights, the usual measure of model size"], ["scaling law", "the predictable power-law relation between loss and parameters, data and compute"], ["compute-optimal", "the split of a fixed compute budget between model size and data that minimises loss"]],
    reflect: { q: "A 2024 7B model outperforms a 2020 175B model on many tasks. How is that possible?", a: "It was trained on roughly a hundred times more tokens per parameter, with better data and training recipes. Parameters are only one of the three ingredients; the old model was badly under-trained by later standards." },
  },

  "m17-parameters-and-model-size": {
    simple: "The parameter count is the sum of all the matrices in the embeddings, attention, feed-forward and output layers; it sets the memory a model needs and the compute per token.",
    concept:
      "A model's **parameters** are every learned number inside it: the embedding table, the four attention matrices per block, the feed-forward matrices per block, the normalisation scales, and the output projection if untied. Adding them up gives the figure on the label, and because each parameter is used about once per token in a forward pass, the figure also predicts compute: roughly two floating-point operations per parameter per token.\n\nMemory follows from the count times the bytes per number: 2 bytes in 16-bit precision, 1 byte in 8-bit, half a byte in 4-bit (Module 40). A 7B model is 14 GB in 16-bit. Training needs several times more, for gradients and optimiser state.\n\nNot all parameters are equal. Embedding parameters are looked up, not multiplied, so they cost memory but little compute. FFN parameters are the majority and do most of the work. Mixture-of-experts models (Module 47) have many parameters but use only a fraction per token, so 'size' and 'cost per token' separate; for dense models they move together.",
    why:
      "Engineers need the count to answer practical questions: will it fit on this GPU, how many tokens per second can it produce, how much will a million requests cost, how long will training take? The count also lets you decode a model card: a '70B' model with 80 blocks and d = 8,192 is consistent with the formula, and a model that claims 70B but runs like 10B is probably a mixture of experts. Being able to estimate the count from the architecture, and the architecture from the count, is a basic literacy skill in this field.",
    how: [
      "Embeddings: V × d (plus a positional table if learned).",
      "Per block attention: W_Q, W_K, W_V, W_O, each d × d → 4·d² (less with grouped-query attention).",
      "Per block FFN: W₁ (d × d_ff) and W₂ (d_ff × d) → 2·d·d_ff; gated variants have three matrices → 3·d·d_ff.",
      "Multiply the per-block total by the number of blocks N; add embeddings; add V × d again if the output projection is untied.",
      "Memory = parameters × bytes per parameter; forward compute ≈ 2 × parameters per token.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Component", "Formula", "7B-class example (d = 4,096, N = 32, d_ff = 11,008, V = 32,000)", "Share"],
        rows: [
          ["embeddings", "V · d", "131M", "2%"],
          ["attention (all blocks)", "N · 4 · d²", "2.15B", "32%"],
          ["FFN (all blocks, gated)", "N · 3 · d · d_ff", "4.33B", "64%"],
          ["norms", "N · 2 · d (approx.)", "0.3M", "~0%"],
          ["output projection", "V · d (if untied)", "131M", "2%"],
          ["total", "", "≈ 6.7B", "100%"],
        ],
      },
      caption: "Where the 7 billion live. The feed-forward layers dominate, as Module 16 said.",
    },
    everyday: {
      title: "Reading a car's specification sheet",
      text: "Engine size, weight and fuel consumption on a spec sheet are linked: a bigger engine weighs more and uses more fuel per mile. You do not need to see the car to know that a 5-litre engine will not be economical. Parameter count is the engine size of a model: from it you can estimate the memory (weight) and the compute per token (fuel) before you ever run it.",
    },
    engineering: {
      title: "Will it fit?",
      text: "A team wanted to run a 13B model on a GPU with 24 GB of memory. In 16-bit the weights alone are 26 GB: it does not fit. In 8-bit, 13 GB of weights leave room for the KV cache and activations at modest context lengths; in 4-bit, 6.5 GB leaves plenty. They measured quality at each precision on their task (Module 40), found 8-bit indistinguishable from 16-bit and 4-bit slightly worse, and deployed 8-bit. The decision took an hour because the arithmetic was done before the download.",
    },
    maths: {
      formula: "params ≈ V·d + N·(4d² + 3·d·d_ff);   memory ≈ params × bytes;   FLOPs/token ≈ 2 × params",
      meaning: "Count the matrices, multiply by bytes for memory and by two for compute per token.",
      worked: [
        "d = 4,096, d_ff = 11,008, N = 32, V = 32,000: attention 32 · 4 · 4,096² = 2.15×10⁹; FFN 32 · 3 · 4,096 · 11,008 = 4.33×10⁹; embeddings 1.31×10⁸; total ≈ 6.6×10⁹.",
        "Memory in 16-bit: 6.6×10⁹ × 2 bytes ≈ 13.2 GB; in 4-bit ≈ 3.3 GB.",
        "Compute: ≈ 1.3×10¹⁰ FLOPs per token; 500 generated tokens ≈ 6.6×10¹² FLOPs.",
        "Training memory in mixed precision with the Adam optimiser is roughly 16 bytes per parameter: ≈ 106 GB for the 7B model, before activations.",
      ],
    },
    code: {
      title: "A parameter calculator",
      lang: "py",
      src: `def count_params(d, n_blocks, d_ff, vocab, gated_ffn=True, tied_output=True):
    embeddings = vocab * d
    attention = 4 * d * d
    ffn = (3 if gated_ffn else 2) * d * d_ff
    norms = 2 * 2 * d                          # two norms per block, scale + shift
    per_block = attention + ffn + norms
    output = 0 if tied_output else vocab * d
    return embeddings + n_blocks * per_block + output

p = count_params(d=4096, n_blocks=32, d_ff=11008, vocab=32000)
print(f"{p/1e9:.2f}B parameters")
print(f"{p*2/1e9:.1f} GB in 16-bit, {p*0.5/1e9:.1f} GB in 4-bit")
print(f"{2*p/1e9:.1f} GFLOPs per token")`,
      lines: [
        { code: "ffn = (3 if gated_ffn else 2) * d * d_ff", say: "Modern models use a gated FFN with three matrices; the original transformer used two." },
        { code: "output = 0 if tied_output else vocab * d", say: "Weight tying removes the output projection from the count." },
        { code: "print(f\"{p*2/1e9:.1f} GB in 16-bit, {p*0.5/1e9:.1f} GB in 4-bit\")", say: "Memory is parameters times bytes. This line answers 'will it fit?'." },
      ],
      output: "6.61B parameters\n13.2 GB in 16-bit, 3.3 GB in 4-bit\n13.2 GFLOPs per token",
    },
    useIt: "Use the count to size hardware, estimate cost per token, sanity-check model cards and compare candidates before testing. When a vendor quotes a parameter count, you can now derive the serving footprint; when a GPU is quoted, you can derive what fits.",
    takeaways: ["Parameters = embeddings + N × (attention + FFN) + output; FFN dominates.", "Memory ≈ parameters × bytes per parameter; compute ≈ 2 × parameters per token.", "Training needs several times the inference memory.", "Mixture-of-experts separates parameter count from per-token cost."],
    terms: [["gated FFN", "a feed-forward variant with three matrices (two expansions multiplied together, one contraction)"], ["grouped-query attention", "sharing key and value projections across groups of heads to shrink attention parameters and cache"]],
    reflect: { q: "Two models both say '8B'. One is dense; one is a mixture of experts activating 2B per token. Which is cheaper to serve, and which needs more memory?", a: "The mixture is cheaper per token (2B worth of compute) but needs memory for all 8B of weights, so it is faster but not smaller. The dense model costs 8B per token and the same memory." },
  },

  "m17-transformer-based-language-models": {
    simple: "Every current LLM is a transformer; the families differ by which attention mask they use and whether there is an encoder, which decides what each family is good at.",
    concept:
      "A **transformer-based language model** is any language model built from the blocks of Module 16. They fall into three families by layout. **Encoder-only** models (BERT and its descendants) read with bidirectional attention and are used for understanding: classification, tagging, embeddings. **Decoder-only** models (GPT, Llama, Claude, and most assistants) read left to right with the causal mask and generate text. **Encoder-decoder** models (T5, translation systems, Whisper for speech) read with an encoder and write with a decoder joined by cross-attention.\n\nThe families also differ in how they are pretrained. Encoders use masked-token prediction; decoders use next-token prediction; encoder-decoders use span corruption or next-token prediction on the output given the input. Each objective matches its layout: you cannot generate with an encoder's objective, and a decoder's objective needs the causal mask.\n\nSince 2022 the decoder-only family has dominated for general assistants, because next-token prediction scales most simply and one causal model can do every task by instruction. Encoders remain the workhorses of search and classification; encoder-decoders remain strong where the input must be understood whole before writing.",
    why:
      "Choosing the wrong family is a common and costly mistake: using a chat model to classify a million tickets when an encoder does it fifty times cheaper, or trying to make an encoder write summaries. The families exist because one architecture serves three different jobs with small changes, and knowing which job each family is built for lets you match the tool to the task. It also explains the history: BERT-style encoders led understanding benchmarks from 2018, decoders took over generation and then everything else as they scaled, and encoder-decoders kept their niche in translation and speech.",
    how: [
      "Identify the task's shape: label out (encoder), text out from a prompt (decoder), or text out from a separate input sequence (encoder-decoder).",
      "Check the model's mask and objective on its card: bidirectional + masked tokens, causal + next token, or both halves + cross-attention.",
      "Encoder: add a task head and fine-tune, or use its pooled vectors for search.",
      "Decoder: prompt it, optionally fine-tune it, and decode token by token.",
      "Encoder-decoder: feed the source to the encoder and generate from the decoder; fine-tune for the pair of sequences.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Family", "Attention", "Pretraining objective", "Strengths", "Examples"],
        rows: [
          ["encoder-only", "bidirectional", "masked-token prediction", "classification, tagging, embeddings, reranking", "BERT, RoBERTa, embedding models"],
          ["decoder-only", "causal", "next-token prediction", "generation, chat, code, instruction following", "GPT, Llama, Claude, Mistral"],
          ["encoder-decoder", "bidirectional encoder, causal decoder, cross-attention", "span corruption / seq-to-seq", "translation, summarisation, speech-to-text", "T5, BART, Whisper"],
        ],
      },
      caption: "Three families of one architecture. The mask and the objective decide the family.",
    },
    everyday: {
      title: "Readers, writers and interpreters",
      text: "A proofreader reads a whole page and marks it up: an encoder. A novelist writes forward, each sentence building on the last: a decoder. An interpreter listens to a whole sentence in one language and then speaks it in another: an encoder-decoder. All three know the language; they are organised for different jobs.",
    },
    engineering: {
      title: "A search stack that uses all three",
      text: "An enterprise search product uses an encoder to embed documents and queries (fast, bidirectional, cheap per document), a small encoder-based reranker to score the top candidates against the query, and a decoder-only model to write the final answer from the reranked passages with citations. For the multilingual corpus, an encoder-decoder translation model normalises documents to English at index time. Four transformers, three families, each where its layout fits. Replacing any one with a chat model would raise cost or lower quality.",
    },
    maths: {
      formula: "encoder: p(x_masked | x_visible);   decoder: p(x_{t+1} | x_≤t);   encoder-decoder: p(y_{t+1} | y_≤t, x)",
      meaning: "The three objectives: predict hidden tokens from both sides; predict the next token from the left; predict the next output token from the output so far and the whole input.",
      worked: [
        "Cost to classify a 256-token document: encoder (110M params) ≈ 2 · 110M · 256 ≈ 5.6×10¹⁰ FLOPs, one pass.",
        "Decoder-only (7B) asked to output a one-word label: prompt pass ≈ 2 · 7B · 256 ≈ 3.6×10¹² plus a few generated tokens: about 64× more compute for the same decision.",
        "Encoder-decoder summarising 1,000 tokens into 100 with a 600M model: encoder ≈ 2 · 300M · 1,000 = 6×10¹¹ once; decoder ≈ 2 · 300M · 100 = 6×10¹⁰; total ≈ 6.6×10¹¹, mostly in the one-off encoding.",
      ],
    },
    code: {
      title: "Three families, three call shapes",
      lang: "py",
      src: `# Pseudocode with the shape of each family's use

# Encoder-only: label from a whole input
vector = encoder("The screen arrived cracked.")          # one pass, bidirectional
label = classifier_head(vector)                          # "damaged"

# Decoder-only: text from a prompt, token by token
prompt = "Classify the ticket as damaged, delivery or other: The screen arrived cracked.\\nLabel:"
label = decoder.generate(prompt, max_tokens=3)           # " damaged"

# Encoder-decoder: text from a separate input sequence
source = "La pantalla llego rota."
encoded = encoder(source)                                # read once
translation = decoder.generate(cross_attend_to=encoded)  # "The screen arrived broken."`,
      lines: [
        { code: "vector = encoder(\"The screen arrived cracked.\")          # one pass, bidirectional", say: "The encoder reads everything at once and returns vectors; a head makes the decision." },
        { code: "label = decoder.generate(prompt, max_tokens=3)           # \" damaged\"", say: "The decoder writes the answer as text, which works but costs a generation loop." },
        { code: "translation = decoder.generate(cross_attend_to=encoded)  # \"The screen arrived broken.\"", say: "The encoder-decoder reads the source separately and writes while looking at it." },
      ],
    },
    useIt: "Match the family to the task before choosing a model: encoders for labels and vectors at scale, decoders for anything that must be written or reasoned about in prose, encoder-decoders for translation and transcription. Most products use more than one.",
    takeaways: ["All LLMs are transformers; families differ by mask and by having an encoder.", "Encoder-only: understanding. Decoder-only: generation and instruction following. Encoder-decoder: sequence transformation.", "Each family has a matching pretraining objective.", "Mixing families in one product is normal and cheaper than using a chat model for everything."],
    terms: [["encoder-only model", "a bidirectional transformer used for understanding tasks"], ["decoder-only model", "a causal transformer used for generation"], ["span corruption", "an encoder-decoder pretraining objective that hides spans of input and generates them"]],
    reflect: { q: "Why did decoder-only models win for general assistants rather than encoder-decoders?", a: "One causal sequence can hold any mix of instruction, context and answer, so one model does every task without a fixed input/output split; next-token prediction scales simply on raw text; and the prompt itself is where context goes, making a separate encoder unnecessary." },
  },

  "m17-decoder-only-models": {
    simple: "Decoder-only models put the prompt and the answer in one causal sequence and predict the next token; they are the architecture behind nearly every chat and code assistant.",
    concept:
      "A **decoder-only model** is a stack of causal transformer blocks with no encoder and no cross-attention. Everything it works with, system instructions, conversation history, documents you paste in, and the answer it writes, is one sequence of tokens. Answer tokens attend to prompt tokens through ordinary self-attention under the causal mask (Module 15), so 'reading the prompt' and 'writing the answer' are the same operation applied to different positions.\n\nThis has consequences you will feel in every product. The model cannot look ahead: it commits to each token before writing the next. The prompt is processed once and its keys and values cached; each new token then attends to the whole cache, which is why long prompts cost time up front and memory throughout (Module 40). And because the model only ever continues a sequence, the distinction between 'instruction', 'data' and 'answer' is one it has to infer from formatting and training, not one the architecture enforces. That last fact is the root of prompt injection (Module 26).\n\nThe GPT series, Llama, Mistral, Claude and most open-weight models are decoder-only.",
    why:
      "Decoder-only models won because of simplicity and scale. One objective (next token), one data type (raw text), one sequence format, and a straightforward way to grow: more blocks, wider layers, more data. Instruction tuning showed that such a model could be steered by text alone, which removed the need for task-specific heads or encoders. The same model that writes code can classify, translate and summarise if asked, which makes it a general interface. Serving is also simple: one loop, one cache.",
    how: [
      "Format the conversation as one token sequence with special tokens marking system, user and assistant turns.",
      "Run the prompt through the causal blocks once, storing each block's keys and values (the KV cache).",
      "Take the last position's logits, choose a token (Module 18), append it.",
      "Run only the new token through the blocks, attending to the cache; append its keys and values.",
      "Repeat until a stop token or a length limit; the generated tokens are detokenised to text.",
    ],
    visual: {
      kind: "flow",
      steps: ["[system] instructions [user] question [assistant]", "prompt pass: build KV cache for all prompt tokens", "predict token 1 from the last position", "append; one more pass for the new token only", "… until <end>", "detokenise → answer"],
      caption: "One sequence, one mask. Reading the prompt and writing the answer are the same mechanism.",
    },
    everyday: {
      title: "Answering a letter by writing underneath it",
      text: "You receive a letter and write your reply directly below it on the same page, line by line, re-reading what is above as you go. You cannot change a line once written; you can only write the next. Everything on the page, including any notes someone scribbled in the margin, is just text you might take as part of the letter. That page is a decoder-only model's context.",
    },
    engineering: {
      title: "Why the system prompt goes first and why it is cached",
      text: "A support assistant has a 1,500-token system prompt, a 2,000-token policy document and a few hundred tokens of conversation per call. Because the model is causal, placing the stable parts first means their keys and values are identical across calls and can be cached by the provider; the team's prompt-cache hit rate reached 90% and input cost fell by two thirds. Placing the user's question before the policy would have made every prefix different. The architecture, not the vendor's pricing page, dictated the prompt layout.",
    },
    maths: {
      formula: "p(answer | prompt) = ∏_t p(a_t | prompt, a_<t);   per-token cost with cache ≈ 2·params + 2·N·d·(len(prompt) + t)",
      meaning: "The answer's probability is a product over its tokens, each conditioned on the prompt and the earlier answer tokens; each token's attention cost grows with the total length so far.",
      worked: [
        "A 3-token answer with per-token probabilities 0.6, 0.5, 0.9 has joint probability 0.27; a model's 'confidence' in a whole answer is the product of many such numbers, so it is always small.",
        "7B model, d = 4,096, N = 32, prompt 3,000 tokens: attention per generated token ≈ 2 · 32 · 4,096 · 3,000 ≈ 7.9×10⁸, about 6% of the 1.3×10¹⁰ parameter cost. At a 60,000-token prompt it is 1.6×10¹⁰, exceeding the parameter cost.",
        "KV cache size for the 3,000-token prompt: 2 (K and V) · 32 blocks · 3,000 · 4,096 · 2 bytes ≈ 1.6 GB in 16-bit. Long prompts are memory as much as time.",
      ],
    },
    code: {
      title: "A chat turn as one sequence",
      lang: "py",
      src: `def format_chat(system, turns):
    # The special tokens are model-specific; the shape is universal: one flat sequence.
    seq = "<|system|>\\n" + system + "\\n"
    for role, text in turns:
        seq += "<|" + role + "|>\\n" + text + "\\n"
    seq += "<|assistant|>\\n"                     # the model continues from here
    return seq

prompt = format_chat(
    "You are a concise assistant for a software company.",
    [("user", "What does the causal mask do?")],
)
print(prompt)
# The model's answer is appended token by token after the last line.`,
      lines: [
        { code: "seq = \"<|system|>\\n\" + system + \"\\n\"", say: "System instructions are just the first tokens of the sequence, marked by a special token the model was trained to respect." },
        { code: "seq += \"<|assistant|>\\n\"                     # the model continues from here", say: "The answer is a continuation. Nothing architectural separates it from the prompt." },
      ],
      output: "<|system|>\nYou are a concise assistant for a software company.\n<|user|>\nWhat does the causal mask do?\n<|assistant|>\n",
      note: "Providers apply this template for you; seeing it explains why formatting and order matter.",
    },
    useIt: "Every assistant you build on will be decoder-only, so design for it: stable content first for caching, context before question, explicit markers between instructions and data, and awareness that the model treats everything as one text and cannot revise what it has written.",
    takeaways: ["Decoder-only: one causal sequence holds instructions, context and answer.", "Prompt tokens are read once and cached; answer tokens attend to the cache.", "The model cannot look ahead or revise.", "Instruction versus data is a convention, not an architectural boundary."],
    terms: [["KV cache", "stored keys and values of earlier tokens, reused by each new token's attention"], ["chat template", "the special-token format that marks system, user and assistant turns in one sequence"]],
    reflect: { q: "Why can a decoder-only model not 'plan the ending first' when writing a story?", a: "It emits tokens left to right under the causal mask and never revisits them; any plan must be written out as tokens (for example an outline) before the story, which is exactly what chain-of-thought prompting exploits." },
  },

  "m17-encoder-only-models": {
    simple: "Encoder-only models read text bidirectionally and output vectors or labels; they are small, fast and still the best tool for classification, tagging and search.",
    concept:
      "An **encoder-only model** keeps just the encoder half of the transformer: bidirectional self-attention, no causal mask, no generation. It is pretrained with masked-token prediction: hide about 15% of the tokens and predict them from both sides. Because every token sees the whole input, the vectors it produces are the richest possible per-token representations for that text.\n\nThree uses dominate. Classification: pool the output (usually the first token's vector or the mean) and train a small head. Token tagging: a classifier on every position for entities, parts of speech or spans that answer a question. Embeddings: train the pooled vector so that similar texts land close together, then use it for semantic search and clustering (Module 13, Stage 6). Most embedding and reranking models in production are encoders.\n\nEncoders are typically 20 to 500 million parameters: tiny next to decoders, cheap to run on CPUs, fast to fine-tune on a few thousand labels, and deterministic (no sampling). Their limit is that they cannot write: the output is always a vector or a label.",
    why:
      "A great deal of language work is understanding, not writing, and understanding benefits from reading the whole text at once. Encoders were the first transformers to beat humans on reading benchmarks, and they remain the most efficient way to turn text into labels and vectors. They exist in the LLM era because cost matters: classifying a million documents with a 7B chat model is possible and absurd when a 100M encoder does it faster and often better after fine-tuning on the same labels.",
    how: [
      "Pretrain: mask 15% of tokens, run the bidirectional stack, predict the masked tokens; add a sentence-pair objective if desired.",
      "Fine-tune for classification: add a head on the pooled vector, train on labelled examples (often a few thousand suffice).",
      "Fine-tune for embeddings: train with pairs of similar and dissimilar texts so cosine similarity reflects meaning.",
      "Serve: one forward pass per input, batched; no decoding loop.",
      "Deploy on CPU or small GPU; latency in milliseconds.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Encoder-only", points: ["Sees whole input both ways", "Outputs vectors / labels", "20M–500M parameters", "Milliseconds on CPU", "Cannot generate"] },
      right: { title: "Decoder-only", points: ["Sees left context only", "Outputs text", "1B–1T parameters", "Seconds, GPU", "Can do everything, expensively"] },
      caption: "For labels and vectors, the left column wins on cost and often on accuracy after fine-tuning.",
    },
    everyday: {
      title: "A sorter versus a writer",
      text: "A postal sorter glances at each envelope and drops it in the right bin, thousands an hour, without writing a word. A correspondent reads one letter and composes a reply, slowly. You would not ask the correspondent to sort the mail. Encoders are sorters; decoders are correspondents.",
    },
    engineering: {
      title: "Content moderation at scale",
      text: "A platform screens 50 million comments a day for policy violations. They tried a decoder-only model with a classification prompt: accurate, but 20 ms per comment on an expensive GPU, and non-deterministic. They fine-tuned a 125M encoder on 80,000 labelled comments (some labelled by the decoder model, then checked by humans): 2 ms per comment on CPU, equal precision, higher recall, fully deterministic. The decoder now labels only the 0.5% of comments the encoder is unsure about, and generates the training data for the next encoder.",
    },
    maths: {
      formula: "L = −Σ_{i ∈ masked} log p(x_i | x_visible);   fine-tune: ŷ = softmax(W·pool(H) + b)",
      meaning: "Pretraining predicts hidden tokens from the rest; fine-tuning puts a classifier on the pooled output.",
      worked: [
        "BERT-base: 12 blocks, d = 768, 12 heads, d_ff = 3,072, vocabulary 30,522. Blocks: 12 · (4·768² + 2·768·3,072) ≈ 85M; embeddings ≈ 23.4M; total ≈ 110M.",
        "A 128-token comment through it: ≈ 2 · 110M · 128 ≈ 2.8×10¹⁰ FLOPs, about 2 ms on a modern CPU core cluster.",
        "Masked training on 512-token sequences hides ≈ 77 tokens per sequence; each is a prediction over the 30,522-entry vocabulary.",
      ],
    },
    code: {
      title: "Mean pooling an encoder's outputs into one vector",
      lang: "py",
      src: `import numpy as np

# Stand-in encoder outputs: one vector per token (3 tokens, d = 4), plus a padding mask
H = np.array([[0.2, 0.9, 0.1, 0.0],
              [1.0, 0.1, 0.3, 0.2],
              [0.3, 0.8, 0.0, 0.1]])
mask = np.array([1, 1, 1])                     # 1 for real tokens, 0 for padding

pooled = (H * mask[:, None]).sum(0) / mask.sum()    # mean over real tokens
unit = pooled / np.linalg.norm(pooled)              # normalise for cosine similarity

W_cls = np.array([[1.5, -1.0, 0.2, 0.0], [-1.0, 1.2, 0.0, 0.3]])   # 2 classes x d
scores = W_cls @ pooled
print(unit.round(3))
print(scores.round(2), "-> class", int(np.argmax(scores)))`,
      lines: [
        { code: "pooled = (H * mask[:, None]).sum(0) / mask.sum()    # mean over real tokens", say: "Pooling: the whole input becomes one vector, ignoring padding." },
        { code: "unit = pooled / np.linalg.norm(pooled)              # normalise for cosine similarity", say: "A unit vector is what an embedding model returns; cosine similarity is then a dot product." },
        { code: "scores = W_cls @ pooled", say: "Or put a classification head on the same vector." },
      ],
      output: "[0.448 0.538 0.119 0.09 ]\n[0.17 0.21] -> class 1",
    },
    useIt: "Use encoders for classification, moderation, routing, entity extraction, semantic search embeddings and reranking. Fine-tune them with labels a decoder can help produce. Reserve decoders for text that must be written.",
    takeaways: ["Encoders read bidirectionally and output vectors or labels, never text.", "Pretrained by masked-token prediction; fine-tuned with small heads.", "Tiny and fast: CPUs, milliseconds, deterministic.", "The standard engine of search, classification and moderation."],
    terms: [["pooling", "combining per-token vectors into one vector for the whole input"], ["reranker", "an encoder that scores a query–document pair for relevance"]],
    reflect: { q: "An embedding model is listed as '335M parameters, encoder'. Why would it be a poor choice for writing product descriptions?", a: "It has no decoder and was never trained to predict next tokens; it can only map text to vectors. Writing needs a causal model with a generation loop." },
  },

  "m17-encoder-decoder-models": {
    simple: "Encoder-decoder models read an input with an encoder and write an output with a decoder; they remain the standard for translation and speech-to-text and are efficient when inputs are long and outputs short.",
    concept:
      "An **encoder-decoder model** keeps both halves of the original transformer (Module 16). Its pretraining objectives are sequence-to-sequence: T5 was trained with span corruption (hide spans of the input, generate them in order), BART with reconstructing corrupted text, Whisper with transcribing audio to text. At use time the encoder reads the source fully and once; the decoder generates the target token by token, cross-attending to the encoder output at every step.\n\nThis family excels when there is a clear source and a clear target: translation, summarisation, speech recognition, grammar correction, question answering from a given passage. The encoder's bidirectional reading gives the best representation of the source; the decoder's causal writing gives fluent output; cross-attention supplies an explicit alignment between them.\n\nFor open-ended assistants the decoder-only family took over, but encoder-decoders of a few hundred million parameters still outperform much larger decoders per unit of cost on fixed transformation tasks, and they are easy to fine-tune for a specific pair of sequences.",
    why:
      "When the input must be understood completely before any output is produced, and the output is a transformation of the input rather than free continuation, splitting reading from writing is both more accurate and cheaper. Reading happens once with full context; writing reuses it. The cross-attention weights give an interpretable account of what each output token came from, which matters in translation and transcription where errors must be traced. These models exist because 'sequence in, different sequence out' is a large, stable class of problems with its own best architecture.",
    how: [
      "Encoder: embed and process the source with bidirectional blocks; keep the output vectors.",
      "Decoder: start from a begin token; each block does causal self-attention over the target so far, cross-attention to the encoder output, then the FFN.",
      "Project the last decoder position to logits, choose a token, append.",
      "Repeat until the end token; the encoder output is computed once and reused.",
      "Fine-tune on (source, target) pairs with teacher forcing: feed the true target shifted by one and score every position.",
    ],
    visual: {
      kind: "flow",
      steps: ["source: audio frames / French text / long article", "encoder (once) → vectors", "decoder: <start> → token 1 (cross-attends)", "→ token 2 … → <end>", "target: transcript / English text / summary"],
      caption: "Read once, write many. The encoder output is the decoder's reference material.",
    },
    everyday: {
      title: "Simultaneous interpretation, done carefully",
      text: "A conference interpreter listens to a complete sentence, holds its meaning, then speaks it in the target language, glancing mentally back at parts of the original as needed. Listening fully first is the encoder; speaking in order is the decoder; the glances back are cross-attention. Interpreters who start speaking too early, like a decoder-only model reading left to right, make more errors on sentences whose ending changes the meaning.",
    },
    engineering: {
      title: "Transcribing call-centre audio",
      text: "A company transcribes 100,000 hours of calls a month with an encoder-decoder speech model. The encoder turns 30-second audio windows into vectors; the decoder writes the transcript. Because the encoder runs once per window and the decoder output is short, throughput is high: hundreds of hours of audio per GPU-hour. They fine-tuned the decoder on 50 hours of their own transcribed calls to learn product names and accents, improving word accuracy from 91% to 96%. A decoder-only text model could not take audio at all without a separate encoder in front, which is the same architecture by another name.",
    },
    maths: {
      formula: "p(y | x) = ∏_t p(y_t | y_<t, Enc(x));   cost ≈ 2·N_enc·|x| + 2·N_dec·|y| + cross-attention |y|·|x|·d",
      meaning: "The encoder's cost scales with the input length once; the decoder's with the output length; cross-attention with their product times the width.",
      worked: [
        "A 600M encoder-decoder (300M each half) summarising a 2,000-token article into 150 tokens: encoder 2 · 300M · 2,000 = 1.2×10¹²; decoder 2 · 300M · 150 = 9×10¹⁰; cross-attention ≈ 150 · 2,000 · 1,024 · 2 · 12 blocks ≈ 7.4×10⁹. Total ≈ 1.3×10¹², dominated by the one-off reading.",
        "The same with a 7B decoder-only model: ≈ 2 · 7B · 2,150 ≈ 3×10¹³, about 23 times more.",
        "Fine-tuning data: 10,000 (article, summary) pairs is typically enough to adapt a pretrained encoder-decoder to a new domain.",
      ],
    },
    code: {
      title: "Teacher forcing: training on a (source, target) pair",
      lang: "py",
      src: `# Pseudocode for one training step of an encoder-decoder model
source_ids = tokenize("La pantalla llego rota.")
target_ids = tokenize("<start> The screen arrived broken. <end>")

enc = encoder(source_ids)                         # read the source once, bidirectionally

decoder_input = target_ids[:-1]                   # <start> The screen arrived broken.
decoder_labels = target_ids[1:]                   #        The screen arrived broken. <end>

logits = decoder(decoder_input, cross_attend_to=enc)   # causal over the target, cross to the source
loss = cross_entropy(logits, decoder_labels)           # every target position scored at once
loss.backward()`,
      lines: [
        { code: "enc = encoder(source_ids)                         # read the source once, bidirectionally", say: "The encoder's single pass produces the vectors the decoder will consult." },
        { code: "decoder_input = target_ids[:-1]                   # <start> The screen arrived broken.", say: "Teacher forcing: the decoder sees the true target shifted right, so all positions train in parallel." },
        { code: "logits = decoder(decoder_input, cross_attend_to=enc)   # causal over the target, cross to the source", say: "Self-attention over the target is causal; cross-attention to the source is unrestricted." },
      ],
    },
    useIt: "Choose encoder-decoders for translation, transcription, summarisation of long inputs, grammar correction and any fixed input-to-output mapping with lots of examples. They fine-tune quickly and serve cheaply. For conversation and open tasks, use decoder-only.",
    takeaways: ["Encoder reads once; decoder writes with cross-attention; trained sequence to sequence.", "Best for translation, speech-to-text, summarisation and other input-to-output transformations.", "Efficient when the input is long and the output short.", "Cross-attention gives an interpretable alignment."],
    terms: [["teacher forcing", "training a decoder on the true previous tokens rather than its own predictions"], ["sequence-to-sequence", "a task mapping one sequence to another"]],
    reflect: { q: "Speech models like Whisper are encoder-decoders. What does the encoder take as input, and what would be lost in a decoder-only design?", a: "The encoder takes audio features (spectrogram frames), read bidirectionally so each frame is understood in the light of the whole utterance. A decoder-only design would have to read audio left to right and could not look ahead to disambiguate sounds, and would need an audio front-end anyway." },
  },

  "m17-gpt-style-architecture": {
    simple: "GPT-style means a decoder-only transformer trained on next-token prediction and then scaled: the specific recipe that most modern LLMs follow, with a few now-standard refinements.",
    concept:
      "**GPT-style architecture** names the recipe that the GPT series established and that most open and closed LLMs follow: a decoder-only transformer with pre-norm blocks, learned or rotary positions, tied embeddings, trained on next-token prediction over web-scale text. The 2018 original had 12 blocks and 117 million parameters; GPT-2 reached 1.5 billion in 2019; GPT-3 reached 175 billion in 2020 and showed that scale alone brought few-shot learning, the ability to do a new task from a handful of examples in the prompt.\n\nThe modern refinements, seen in Llama and its descendants, are small and consistent: RMSNorm instead of LayerNorm, rotary position embeddings, a gated FFN with the SwiGLU activation, no biases, and grouped-query attention to shrink the KV cache. None changes the shape of the computation from Module 16; they improve stability, length generalisation and serving cost.\n\nSo when a model card says 'a standard decoder-only transformer', this is what it means, and reading one config file tells you the whole architecture: number of blocks, d_model, number of heads and KV heads, d_ff, vocabulary size, context length, positional scheme.",
    why:
      "Having one dominant recipe made progress cumulative: optimisations, serving frameworks, fine-tuning methods and interpretability tools all target the same structure, so an improvement anywhere helps every model. Teams building with LLMs benefit because configs are comparable and tooling is shared. The recipe also makes the scaling laws of the previous lessons apply: the architecture stayed fixed while parameters, data and compute grew, which is why the curves are so clean.",
    how: [
      "Tokenise with a byte-pair tokeniser (Module 12), vocabulary 32k–200k.",
      "Embed tokens (tied with the output), add rotary positions inside attention.",
      "Stack N pre-norm blocks: RMSNorm → grouped-query causal attention → residual; RMSNorm → gated FFN (SwiGLU) → residual.",
      "Final RMSNorm, tied output projection, softmax.",
      "Train with next-token prediction using AdamW, a cosine learning-rate schedule and long sequences; then instruction-tune and align.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Setting", "GPT-2 (2019)", "Llama-style 7B (2023)", "What it changes"],
        rows: [
          ["blocks / d_model", "48 / 1,600 (XL)", "32 / 4,096", "depth and width"],
          ["positions", "learned table (1,024)", "rotary (RoPE)", "length generalisation"],
          ["normalisation", "LayerNorm, pre-norm", "RMSNorm, pre-norm", "speed, stability"],
          ["FFN", "GELU, 4d", "SwiGLU gated, ≈ 2.7d × 3 matrices", "quality per parameter"],
          ["attention", "multi-head", "grouped-query (fewer KV heads)", "KV cache size"],
          ["biases", "yes", "none", "simplicity"],
          ["context", "1,024", "4,096–128k", "how much fits in a prompt"],
        ],
      },
      caption: "The same skeleton with refinements. A config file lists exactly these fields.",
    },
    everyday: {
      title: "A standard bicycle",
      text: "Every modern bicycle is two wheels, a diamond frame, a chain and gears. Manufacturers differ in materials, gearing and small geometry choices, but a mechanic who knows one can fix any. GPT-style architecture is the diamond frame of language models: once you know it, every model card reads like a parts list.",
    },
    engineering: {
      title: "Reading a config file to plan a deployment",
      text: "A team evaluating an open-weight model opened its config: 80 blocks, d_model 8,192, 64 attention heads, 8 KV heads, d_ff 28,672, vocabulary 128,000, context 128k, RoPE. From that: ≈ 70B parameters, 140 GB in 16-bit, KV cache per token = 2 · 80 · 8 · 128 · 2 bytes ≈ 328 KB (thanks to 8 KV heads rather than 64), so a 32k-token conversation needs about 10 GB of cache. They provisioned two 80 GB GPUs with tensor parallelism and a cache budget of 16 GB, which handled their concurrency target. No benchmark was needed for the sizing.",
    },
    maths: {
      formula: "KV cache per token = 2 · N · n_kv_heads · d_head · bytes;   params ≈ V·d + N·(2d² + 2·d·n_kv·d_head + 3·d·d_ff)",
      meaning: "Grouped-query attention replaces the K and V projections' d × d with d × (n_kv · d_head), shrinking both parameters and cache.",
      worked: [
        "7B-class config: N = 32, 32 heads, d_head = 128, 8 KV heads (grouped-query), d = 4,096. Cache per token = 2 · 32 · 8 · 128 · 2 bytes = 131 KB; with 32 KV heads it would be 524 KB.",
        "A 16k-token context: 2.1 GB of cache with grouped-query versus 8.4 GB without.",
        "SwiGLU FFN with d_ff = 11,008: 3 · 4,096 · 11,008 ≈ 135M per block, versus the classic 2 · 4,096 · 16,384 ≈ 134M at 4d: similar size, better quality in practice.",
      ],
    },
    code: {
      title: "A model config and what it implies",
      lang: "py",
      src: `config = {
    "n_blocks": 32, "d_model": 4096, "n_heads": 32, "n_kv_heads": 8,
    "d_ff": 11008, "vocab": 32000, "context": 8192,
    "positions": "rope", "norm": "rmsnorm", "ffn": "swiglu", "tie_embeddings": True,
}

d_head = config["d_model"] // config["n_heads"]
kv_per_token = 2 * config["n_blocks"] * config["n_kv_heads"] * d_head * 2   # bytes, 16-bit
attn = config["n_blocks"] * (2 * config["d_model"] ** 2 + 2 * config["d_model"] * config["n_kv_heads"] * d_head)
ffn = config["n_blocks"] * 3 * config["d_model"] * config["d_ff"]
params = config["vocab"] * config["d_model"] + attn + ffn

print(f"{params/1e9:.2f}B params, {params*2/1e9:.1f} GB weights")
print(f"{kv_per_token/1024:.0f} KB cache per token, {kv_per_token*config['context']/1e9:.2f} GB at full context")`,
      lines: [
        { code: "\"n_blocks\": 32, \"d_model\": 4096, \"n_heads\": 32, \"n_kv_heads\": 8,", say: "The whole architecture in one line: depth, width, heads, and how many KV heads (grouped-query)." },
        { code: "kv_per_token = 2 * config[\"n_blocks\"] * config[\"n_kv_heads\"] * d_head * 2   # bytes, 16-bit", say: "Cache per token depends on KV heads, not query heads; that is the point of grouping." },
        { code: "attn = config[\"n_blocks\"] * (2 * config[\"d_model\"] ** 2 + 2 * config[\"d_model\"] * config[\"n_kv_heads\"] * d_head)", say: "Q and O are full d × d; K and V are smaller under grouped-query attention." },
      ],
      output: "5.80B params, 11.6 GB weights\n128 KB cache per token, 1.07 GB at full context",
    },
    useIt: "You will read config files to size deployments, compare models and understand fine-tuning options; knowing the standard recipe lets you spot what is unusual about a model (a mixture of experts, a different positional scheme, a tiny KV head count) and what that implies for cost and behaviour.",
    takeaways: ["GPT-style = decoder-only, next-token pretraining, pre-norm blocks, tied embeddings, scaled up.", "Modern refinements: RMSNorm, RoPE, SwiGLU gated FFN, grouped-query attention, no biases.", "A config file specifies the whole architecture; parameters and cache follow from it.", "One shared recipe is why tooling and scaling laws transfer across models."],
    terms: [["SwiGLU", "a gated activation used in modern FFNs: one expansion is multiplied by a sigmoid-gated copy of another"], ["few-shot learning", "doing a new task from a few examples placed in the prompt, without weight updates"], ["n_kv_heads", "the number of key/value heads in grouped-query attention"]],
    reflect: { q: "Why do the refinements matter if the computation's shape is unchanged?", a: "They change training stability (pre-norm, RMSNorm), behaviour beyond the training length (RoPE), quality per parameter (SwiGLU) and serving cost (grouped-query attention). Same skeleton, better engineering; the scaling curves shift down." },
  },

  "m17-llm-vocabulary": {
    simple: "An LLM's vocabulary is its fixed list of tokens, typically 32,000 to 200,000 entries learned by byte-pair encoding; its size trades efficiency on text against embedding-table size and rare-token quality.",
    concept:
      "The **vocabulary** of an LLM is the set of tokens its tokeniser can produce and its embedding table can look up (Module 12). It is fixed at training time. Common words are single tokens; rare words, names, code identifiers and non-English text are split into several. Every input and output passes through it, so it determines how many tokens a text costs, how well the model handles each language and script, and how large the embedding and output matrices are.\n\nSize matters in two directions. A larger vocabulary compresses text into fewer tokens (cheaper, longer effective context, better for multilingual text) but makes the embedding table and output projection bigger and leaves rare tokens with little training signal. Vocabularies grew from 32,000 (early Llama) to 128,000 and 200,000 in recent models, mostly to serve non-English languages and code better.\n\nThe vocabulary also contains special tokens: beginning and end of sequence, turn markers for chat, padding, and sometimes tool-call delimiters. Those tokens are how formatting conventions reach the model.",
    why:
      "A model can only represent text through its vocabulary. A vocabulary trained mostly on English makes Hindi or Punjabi cost three to five times more tokens per sentence, which means higher cost, less text fitting in the context, and worse quality, because the model has seen those fragments less often. Choosing and sizing the vocabulary is therefore a product decision as much as a technical one. It also fixes a hard limit: a word that never appears in the vocabulary can only be built from pieces, and nothing after training can add a token without resizing the embedding table.",
    how: [
      "Collect a representative corpus across the languages and code the model should serve.",
      "Train a byte-pair (or similar) tokeniser to the chosen vocabulary size; add special tokens.",
      "Size the embedding table (V × d) and output projection accordingly.",
      "Pretrain; the tokeniser and vocabulary are frozen from now on.",
      "At use time, measure tokens per word for the target languages to estimate cost and context use.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Tokens with a 32k English-centred vocabulary", "Tokens with a 128k multilingual vocabulary"],
        rows: [
          ["The screen arrived cracked.", "5", "5"],
          ["La pantalla llegó rota.", "9", "6"],
          ["ਸਕ੍ਰੀਨ ਟੁੱਟੀ ਹੋਈ ਆਈ।", "24", "9"],
          ["def parse_invoice(path):", "7", "5"],
        ],
      },
      caption: "Illustrative counts. The same meaning costs very different numbers of tokens depending on the vocabulary.",
    },
    everyday: {
      title: "A keyboard with a limited set of keys",
      text: "A keyboard with keys for whole common words would type English quickly, but a word it has no key for would need spelling out letter by letter, and a language with a different script would be slow and awkward. A model's vocabulary is that keyboard: text that matches it flows; text that does not is spelled out expensively.",
    },
    engineering: {
      title: "Budgeting a multilingual assistant",
      text: "A company estimated costs for a support assistant in English, Spanish and Punjabi using a model with a 32k vocabulary. Measured tokens per average message: 60, 95 and 240. Punjabi conversations cost four times the English ones and hit the context limit on long tickets. Switching to a model with a 128k multilingual vocabulary cut Punjabi messages to about 90 tokens, saving money and, more importantly, fitting whole tickets in context. They now measure tokens per language before choosing any model, and Stage 9 makes this a central topic.",
    },
    maths: {
      formula: "embedding params = V · d;   cost per text = tokens(text) × price per token;   tokens per word varies by language and vocabulary",
      meaning: "Vocabulary size sets the embedding table; tokens per word sets the cost of each language.",
      worked: [
        "V = 32,000, d = 4,096: embedding table 131M parameters; tied output adds none. V = 128,000: 524M, four times larger, about 7% of a 7B model.",
        "A 400-word English email ≈ 530 tokens at 1.3 tokens per word; the same email in Punjabi with the 32k vocabulary at 5 tokens per word ≈ 2,000 tokens.",
        "At a price of 3 units per million input tokens, 10,000 such emails cost 16 units in English and 60 in Punjabi; a better vocabulary (2 tokens per word) brings Punjabi to 24.",
      ],
    },
    code: {
      title: "Measuring tokens per word before choosing a model",
      lang: "py",
      src: `# Any tokeniser library exposes an encode() that returns token ids; shown here generically.
samples = {
    "en": "The screen arrived cracked and the box was wet.",
    "es": "La pantalla llego rota y la caja estaba mojada.",
    "pa": "ਸਕ੍ਰੀਨ ਟੁੱਟੀ ਹੋਈ ਆਈ ਅਤੇ ਡੱਬਾ ਗਿੱਲਾ ਸੀ।",
}

def tokens_per_word(tokenizer, text):
    return len(tokenizer.encode(text)) / len(text.split())

for lang, text in samples.items():
    ratio = tokens_per_word(tokenizer, text)
    print(f"{lang}: {ratio:.1f} tokens per word")`,
      lines: [
        { code: "return len(tokenizer.encode(text)) / len(text.split())", say: "Tokens divided by words: the efficiency of the vocabulary for this language." },
        { code: "print(f\"{lang}: {ratio:.1f} tokens per word\")", say: "Run this for every language you serve, for every model you consider. The numbers drive cost and context." },
      ],
      output: "en: 1.2 tokens per word\nes: 1.6 tokens per word\npa: 4.8 tokens per word",
      note: "The output shows a typical English-centred vocabulary; a multilingual one brings the last line down to around 2.",
    },
    useIt: "Check tokens per word for your languages and your code before committing to a model; it predicts cost, context fit and often quality. Know the special tokens of the chat template you use, and never assume a vocabulary can be extended after training without re-training the embedding rows.",
    takeaways: ["The vocabulary is a fixed list of 32k–200k tokens from byte-pair encoding, plus special tokens.", "Larger vocabularies compress text better, especially non-English, at the cost of a bigger embedding table.", "Tokens per word varies widely by language; measure it.", "Special tokens carry the chat format to the model."],
    terms: [["vocabulary size (V)", "the number of distinct tokens a model can read or write"], ["tokens per word", "a measure of how efficiently a vocabulary encodes a language"]],
    reflect: { q: "A vendor raises its vocabulary from 32k to 128k in the next model version. Name one benefit and one cost.", a: "Benefit: fewer tokens for non-English text and code, so cheaper and more fits in context. Cost: a four times larger embedding table and output projection, and rarer tokens that each receive less training, which can hurt unless the data is large." },
  },

  "m17-context-window": {
    simple: "The context window is the maximum number of tokens the model can attend to in one call, prompt and answer together; anything beyond it is not seen, and cost and memory grow with how much of it you use.",
    concept:
      "The **context window** is the longest sequence a model can process: system prompt, conversation history, documents, and the tokens it generates, all added together. It is set by training (the positions the model has seen) and by the serving setup (the KV cache memory available). Early models had 512 to 2,048 tokens; current ones range from 8,000 to over a million.\n\nThe window is a hard boundary, not a soft one: tokens past it are either rejected or silently dropped, and the model has no knowledge that anything was cut. Within the window, attention cost grows with length (n² for the prompt pass, n per generated token), the KV cache grows linearly, and quality can degrade on information placed in the middle of a very long prompt, a measured effect sometimes called 'lost in the middle'.\n\nA large window does not make the model remember across calls: each call starts empty (Module 19 and Stage 7). It is working memory, not long-term memory.",
    why:
      "Because a decoder-only model can only use what is in its sequence, the window is the single most important limit on what you can give it: a contract, a codebase, a day of chat logs. It is also where money goes, since input tokens are priced and attention over a long prompt costs time and memory. Understanding the window explains why summarisation and retrieval (Stage 6) exist: they are strategies for fitting the right information into a finite window, not conveniences.",
    how: [
      "Count tokens for everything you intend to send: system, history, documents, and the expected answer length.",
      "Check the model's window and the serving limit; leave headroom for the answer.",
      "If the total exceeds the window, trim history, summarise old turns, or retrieve only relevant passages.",
      "Place the most important content near the start or end, where attention is most reliable in long prompts.",
      "Monitor tokens per call in production; the window is a budget, not a goal.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "System prompt", detail: "1,500 tokens" },
        { label: "Policy document", detail: "2,000 tokens" },
        { label: "Conversation so far", detail: "3,200 tokens" },
        { label: "Reserved for the answer", detail: "800 tokens" },
        { label: "Total", detail: "7,500 of an 8,192 window: fits, with 692 to spare" },
      ],
      caption: "The window is one budget shared by everything in the call, including what the model will write.",
    },
    everyday: {
      title: "A desk of a fixed size",
      text: "You can only work with the papers that fit on your desk. A bigger desk holds more, but you still cannot read a page that is in the filing cabinet, and if the desk is covered in papers the one you need may be buried in the middle. Every new task starts with a cleared desk. The context window is the desk; retrieval is the assistant who fetches the right file from the cabinet.",
    },
    engineering: {
      title: "The customer whose address fell off the desk",
      text: "A support assistant with a 4,096-token window kept the full conversation in the prompt. After about forty turns, the oldest messages were trimmed to fit, and one of them held the delivery address. The assistant then asked for the address again, and the customer complained it had 'forgotten'. The fix was a rolling summary of trimmed turns kept at the top of the prompt, plus the address stored as a field in the account rather than in chat text (Stage 7). The window did not change; what was placed in it did.",
    },
    maths: {
      formula: "tokens_in + tokens_out ≤ window;   prompt cost ∝ n² (attention) + n·params;   cache ≈ n × KB per token",
      meaning: "The total must fit; compute grows faster than linearly in the prompt length; memory grows linearly.",
      worked: [
        "A 7B model with 128 KB of cache per token: a 100,000-token prompt needs 12.8 GB of cache, close to the weights' own 13 GB.",
        "Prompt-pass attention FLOPs at d = 4,096, 32 blocks: 2 · 32 · 4,096 · n². For n = 8,000: 1.7×10¹³; for n = 128,000: 4.3×10¹⁵, 256 times more, while the parameter term grows only 16 times.",
        "Input pricing at 3 units per million tokens: a 100k-token prompt costs 0.3 units per call; a thousand calls a day is 300 units, which is why prompt caching and retrieval pay for themselves.",
      ],
    },
    code: {
      title: "Fitting a conversation into the window",
      lang: "ts",
      src: `type Msg = { role: "user" | "assistant"; content: string; tokens: number };

const WINDOW = 8192;
const RESERVED_FOR_ANSWER = 800;

function fit(system: string, systemTokens: number, history: Msg[], summary: string, summaryTokens: number): Msg[] {
  const budget = WINDOW - RESERVED_FOR_ANSWER - systemTokens - summaryTokens;
  const kept: Msg[] = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {   // newest first
    if (used + history[i].tokens > budget) break;
    kept.unshift(history[i]);
    used += history[i].tokens;
  }
  return kept;                                        // older turns live on in the summary
}`,
      lines: [
        { code: "const budget = WINDOW - RESERVED_FOR_ANSWER - systemTokens - summaryTokens;", say: "The answer needs room too; reserve it before filling the window." },
        { code: "for (let i = history.length - 1; i >= 0; i--) {   // newest first", say: "Keep the most recent turns verbatim; they matter most." },
        { code: "return kept;                                        // older turns live on in the summary", say: "What falls off the desk should be summarised, not lost; Stage 7 builds that summary." },
      ],
    },
    useIt: "Every prompt you build is a window-budgeting exercise: count tokens, reserve for the answer, trim or retrieve, and watch cost. Long windows make some things possible (whole contracts, large code files) but do not replace retrieval, memory design or caching.",
    takeaways: ["The window is the hard limit on prompt plus answer tokens in one call.", "Cost grows with length: n² attention in the prompt pass, linear cache memory.", "Information in the middle of very long prompts is used less reliably.", "It is working memory for one call, not memory across calls."],
    terms: [["context window", "the maximum tokens a model attends to in one call"], ["lost in the middle", "the measured drop in a model's use of information placed mid-prompt in long contexts"]],
    reflect: { q: "If a model has a 200k-token window, why not always send the whole knowledge base?", a: "Cost per call scales with tokens, latency rises sharply with attention over long prompts, the cache may not fit alongside other users, and relevant facts buried in the middle are used less reliably. Retrieval sends the few thousand tokens that matter." },
  },

  "m17-input-and-output-tokens": {
    simple: "Input tokens are what you send (prompt, history, documents); output tokens are what the model generates; they are counted and priced separately because they cost the provider different amounts.",
    concept:
      "Every call has two token counts. **Input tokens** are everything in the prompt: system text, messages, documents, tool results. **Output tokens** are the tokens the model writes in response. Providers report both in the response and price them separately, with output tokens usually several times more expensive per token than input.\n\nThe price difference reflects how the work differs. Input tokens are processed in one parallel pass (the prompt pass), which is efficient. Output tokens are produced one at a time, each a full pass through the model attending to everything before it, which is slow and memory-bound; the hardware is tied up for the duration. Input tokens that repeat across calls (a long system prompt) can be cached and charged less; output tokens never can.\n\nFor latency, input tokens set the time to first token (the prompt pass), and output tokens set the total time (one step each). A 2,000-token answer takes roughly a thousand times longer to write than a 2-token one, whatever the prompt.",
    why:
      "Token accounting is how LLM products are costed, budgeted and optimised. A team that does not know its input/output split cannot explain its bill, and the levers are different: input cost responds to caching, trimming and retrieval; output cost responds to asking for shorter answers, structured output and stopping early. Latency follows the same split: a slow first token means a long prompt; a slow answer means a long output. Separating the two is the first step in every cost or speed investigation.",
    how: [
      "Before the call, count or estimate input tokens (tokeniser or a rule of thumb: about 1.3 tokens per English word).",
      "Set max_tokens to cap the output; ask for brevity or a structured format when a person does not need prose.",
      "After the call, read usage.input_tokens and usage.output_tokens from the response.",
      "Cost = input × input price + output × output price; cached input is charged at a lower rate.",
      "Log both per feature; optimise input with caching and retrieval, output with format and length limits.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["", "Input tokens", "Output tokens"],
        rows: [
          ["what", "prompt: system, history, documents, tool results", "the model's answer"],
          ["how processed", "one parallel prompt pass", "one sequential step per token"],
          ["latency effect", "time to first token", "total generation time"],
          ["price", "lower; cached prefixes cheaper still", "higher per token"],
          ["levers", "cache, trim, retrieve, shorter prompts", "max_tokens, brevity, structured output, stop sequences"],
        ],
      },
      caption: "Two counts, two cost structures, two sets of fixes.",
    },
    everyday: {
      title: "A consultation fee and a writing fee",
      text: "A lawyer charges one rate to read the papers you bring (fast, done in one sitting) and a higher rate per page to draft a document (slow, one page at a time). Bringing fewer or pre-sorted papers lowers the first bill; asking for a two-page memo instead of a twenty-page report lowers the second. Input and output tokens are those two bills.",
    },
    engineering: {
      title: "Finding the expensive half of a bill",
      text: "A team's monthly LLM bill doubled. Usage logs split by feature showed the summariser's output tokens had tripled: a prompt change had removed 'in three sentences', and summaries grew to a page. Input tokens were flat. Restoring the length instruction and setting max_tokens to 200 brought the bill back within a day. Without the input/output split in their logs they would have investigated prompt sizes and found nothing.",
    },
    maths: {
      formula: "cost = in × p_in + cached_in × p_cached + out × p_out;   time ≈ t_prompt(in) + out × t_step",
      meaning: "Cost is a weighted sum of the two counts; time is a prompt pass plus one step per output token.",
      worked: [
        "A call with 3,000 input tokens (2,000 of them a cached system prompt), 400 output tokens; prices per million: input 3, cached input 0.3, output 15 units.",
        "Cost = 1,000 × 3 + 2,000 × 0.3 + 400 × 15 = 3,000 + 600 + 6,000 = 9,600 micro-units ≈ 0.0096 units. Output is 62% of the cost despite being 12% of the tokens.",
        "Time with t_step = 20 ms and a 0.4 s prompt pass: 0.4 + 400 × 0.02 = 8.4 s. Halving the answer length saves 4 s; halving the prompt saves 0.2 s.",
      ],
    },
    code: {
      title: "Reading usage and costing a call",
      lang: "ts",
      src: `const PRICE = { input: 3, cachedInput: 0.3, output: 15 };   // units per million tokens

const reply = await client.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 200,                                        // caps output tokens and cost
  system: [{ type: "text", text: LONG_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: question }],
});

const u = reply.usage;
const cached = u.cache_read_input_tokens ?? 0;
const cost = ((u.input_tokens - cached) * PRICE.input + cached * PRICE.cachedInput + u.output_tokens * PRICE.output) / 1e6;
console.log({ input: u.input_tokens, cached, output: u.output_tokens, cost: cost.toFixed(5) });`,
      lines: [
        { code: "max_tokens: 200,                                        // caps output tokens and cost", say: "The output budget. The model stops here even mid-sentence, so set it with the task in mind." },
        { code: "system: [{ type: \"text\", text: LONG_SYSTEM_PROMPT, cache_control: { type: \"ephemeral\" } }],", say: "A cached prefix: identical input tokens across calls are charged at the lower rate." },
        { code: "const cost = ((u.input_tokens - cached) * PRICE.input + cached * PRICE.cachedInput + u.output_tokens * PRICE.output) / 1e6;", say: "The cost formula, from the three counts the response reports." },
      ],
    },
    useIt: "Log input, cached and output tokens for every feature from the first day; set max_tokens deliberately; and when a bill or a latency number moves, split it before you act. Stage 6 and Stage 8 build cost controls on exactly this accounting.",
    takeaways: ["Input tokens = the prompt; output tokens = the answer; counted and priced separately.", "Output is slower and pricier per token; input can be cached.", "Input drives time to first token; output drives total time.", "Different levers for each: cache and retrieve input; cap and structure output."],
    terms: [["input tokens", "tokens sent in the prompt"], ["output tokens", "tokens the model generates"], ["max_tokens", "the cap on output tokens for one call"]],
    reflect: { q: "A request's time to first token is 6 seconds but the answer then streams quickly. What should you look at?", a: "The input side: a very long prompt makes the prompt pass slow. Trim history, retrieve less, or use prompt caching so the prefix is not recomputed; output settings will not help." },
  },

  "m17-pretraining": {
    simple: "Pretraining is the enormous first training stage: the model reads trillions of tokens and learns to predict the next one, acquiring language, knowledge and skills as a by-product.",
    concept:
      "**Pretraining** is where an LLM's capability comes from. A randomly initialised transformer is shown text in long sequences and, at every position, asked to predict the next token; the cross-entropy loss (Module 4) is backpropagated and the weights updated, trillions of times. Nothing is labelled by people: the text itself provides the answers. Over weeks on thousands of accelerators, the loss falls from random (about 10.4 nats for a 32k vocabulary) to around 2, and along the way the model learns spelling, grammar, facts, code, several languages, and patterns of argument, because all of them reduce the loss.\n\nThe output of pretraining is the **base model**: a continuation engine. Ask it a question and it may answer, or may continue with more questions, because both appear in text. It has no notion of being an assistant. The far cheaper stages that follow (Module 21 and 23) shape it into one.\n\nPretraining decides the knowledge cutoff, the languages the model is good at, and most of its raw ability. It is also where the cost is: tens of millions of dollars for frontier models, which is why most teams use pretrained models and never run this stage themselves. Module 20 covers it in depth.",
    why:
      "Supervised learning needs labelled examples, and no one can label enough examples to teach a model all of language. Next-token prediction turns every document ever written into training data for free, and the task is hard enough that solving it well requires understanding. Pretraining exists because it is the only known way to get broad capability at scale, and its cost is why capability is concentrated in a few models that everyone else adapts.",
    how: [
      "Assemble a corpus: web pages, books, code, papers; filter, deduplicate and balance it (Module 20).",
      "Tokenise everything and pack it into fixed-length sequences (for example 8,192 tokens).",
      "Initialise the transformer randomly; set the optimiser (AdamW), learning-rate schedule and batch size (millions of tokens per step).",
      "For each batch: forward pass, cross-entropy at every position against the next token, backward pass, update. Checkpoint regularly.",
      "Stop when the token budget is spent; evaluate the base model on held-out text and benchmarks.",
    ],
    visual: {
      kind: "flow",
      steps: ["corpus: trillions of tokens", "sequences of 8k tokens", "random transformer", "predict next token at every position; loss ≈ 10", "… weeks of updates …", "base model; loss ≈ 2"],
      caption: "No labels, one objective, enormous scale. The capability is a side effect of the loss falling.",
    },
    everyday: {
      title: "Learning to finish sentences from a lifetime of reading",
      text: "Nobody taught you grammar by labelling sentences; you absorbed it by reading and hearing millions of them until the next word usually felt obvious. Along the way you picked up facts, idioms and how arguments go. Pretraining is that process compressed into weeks and scaled to more text than any person could read in a thousand lifetimes.",
    },
    engineering: {
      title: "Why a company fine-tunes rather than pretrains",
      text: "A bank considered training its own 7B model from scratch on financial text so that it would 'know finance'. The estimate: 2 trillion tokens of general text were still needed for basic language ability (their financial corpus was 20 billion tokens), about 1,000 GPUs for a month, a team of ten, and a result that would trail public models. They instead took an open-weight base model and continued pretraining on their 20 billion financial tokens for a week on 64 GPUs, then instruction-tuned it. It matched their needs at under 2% of the cost. Pretraining is a public good most teams build on, not redo.",
    },
    maths: {
      formula: "L = −(1/T) Σ_t log p(x_{t+1} | x_≤t);   compute ≈ 6 · N · D;   random-start loss = ln(V)",
      meaning: "Average next-token cross-entropy over all T positions; total compute is six FLOPs per parameter per training token; an untrained model's loss is the log of the vocabulary size.",
      worked: [
        "V = 32,000: initial loss ln(32,000) ≈ 10.4 nats (every token equally likely). A trained 7B model reaches ≈ 1.9 on web text: it assigns the actual next token an average probability of e^{−1.9} ≈ 15%, with many tokens far higher.",
        "N = 7×10⁹, D = 2×10¹²: compute 6 · 7×10⁹ · 2×10¹² = 8.4×10²² FLOPs. At 40% utilisation of accelerators doing 10¹⁵ FLOP/s each, that is 8.4×10²² / (4×10¹⁴) ≈ 2.1×10⁸ device-seconds ≈ 2,400 device-days: 1,000 devices for 2.4 days, or 100 for 24.",
        "Batch of 4 million tokens per step: 2×10¹² / 4×10⁶ = 500,000 optimiser steps.",
      ],
    },
    code: {
      title: "The pretraining loop, stripped down",
      lang: "py",
      src: `# Pseudocode: what the trillion-token loop does at its core
model = Transformer(config)                      # random weights
opt = AdamW(model.parameters(), lr=3e-4, weight_decay=0.1)

for step, batch in enumerate(token_stream(seq_len=8192, batch_tokens=4_000_000)):
    inputs = batch[:, :-1]                        # tokens 1..T-1
    targets = batch[:, 1:]                        # tokens 2..T: the next token at every position
    logits = model(inputs)                        # (batch, T-1, vocab), causal
    loss = cross_entropy(logits, targets)         # average over every position
    loss.backward()
    clip_grad_norm(model.parameters(), 1.0)
    opt.step(); opt.zero_grad()
    set_learning_rate(opt, step)                  # warm-up then cosine decay
    if step % 1000 == 0:
        save_checkpoint(model, opt, step)`,
      lines: [
        { code: "targets = batch[:, 1:]                        # tokens 2..T: the next token at every position", say: "The labels are the text shifted by one. No human labelled anything." },
        { code: "loss = cross_entropy(logits, targets)         # average over every position", say: "Every position is a training example; a 8,192-token sequence is 8,191 of them." },
        { code: "set_learning_rate(opt, step)                  # warm-up then cosine decay", say: "The schedule from Module 5, stretched over hundreds of thousands of steps." },
        { code: "save_checkpoint(model, opt, step)", say: "Checkpoints (Module 2) protect weeks of compute from a crash and let others resume or fine-tune." },
      ],
    },
    useIt: "You will almost never pretrain, but you will pick models by what their pretraining gave them: cutoff date, languages, code coverage, size. Continued pretraining on your own domain text is a realistic middle path (Module 24), and understanding the objective explains why base models continue rather than answer.",
    takeaways: ["Pretraining = next-token prediction on trillions of tokens, no labels.", "It produces a base model that continues text and holds most of the capability and knowledge.", "Cost ≈ 6 FLOPs per parameter per token; weeks on thousands of accelerators.", "Teams build on pretrained models; a few organisations pretrain."],
    terms: [["pretraining", "the large first training stage on raw text"], ["continued pretraining", "further next-token training of an existing model on domain text"], ["nats", "the unit of cross-entropy when using natural logarithms"]],
    reflect: { q: "Why does a base model sometimes respond to 'What is the capital of France?' with more questions instead of an answer?", a: "Because lists of questions are common in its training text, so 'more questions' is a likely continuation. It was trained to continue, not to answer; instruction tuning changes the default." },
  },

  "m17-inference": {
    simple: "Inference is running the trained model to produce output: a prompt pass over the input, then one forward pass per generated token, each attending to a cache of everything so far.",
    concept:
      "**Inference** (Module 2) for an LLM has two phases. The **prefill** phase runs the whole prompt through the model in one parallel pass, computing every block's keys and values for every prompt token and storing them in the KV cache; its output is the first token's logits. The **decode** phase then runs one token at a time: the new token goes through the blocks, attends to the cache, produces logits, a token is chosen, and the loop repeats until a stop condition. Each decode step reads all the weights once, so it is limited by memory bandwidth rather than arithmetic, which is why generation speed is measured in tokens per second and is similar whether the prompt was short or long.\n\nNothing changes in the weights during inference; the model is frozen. Randomness enters only in how the next token is chosen (Module 18). Multiple requests are batched to share the weight reads, which raises throughput at some cost to each request's latency.\n\nServing systems (Modules 39 and 40) are engineering around these two phases: fast prefill, cached prefixes, batched decoding, and cache memory management.",
    why:
      "Training happens once; inference happens billions of times, so its cost and latency are what users and budgets feel. The two-phase structure explains most of what you will observe: time to first token depends on prompt length (prefill), tokens per second depends on model size and hardware bandwidth (decode), and memory depends on the cache. Knowing the phases tells you which lever to pull: shorten prompts or cache them for faster first tokens; use smaller models or quantisation for faster streaming; limit concurrency or context for memory.",
    how: [
      "Tokenise the prompt and apply the chat template.",
      "Prefill: one forward pass over all prompt tokens; store keys and values per block; take the last position's logits.",
      "Choose the first output token from the logits.",
      "Decode: feed the new token alone through the blocks, attending to the cache; append its keys and values; choose the next token.",
      "Stop at an end token, a stop sequence or max_tokens; detokenise the output; free the cache.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Prefill", points: ["All prompt tokens at once", "Compute-bound: big matrix multiplies", "Cost grows with prompt length (n² attention)", "Sets time to first token", "Can be cached for repeated prefixes"] },
      right: { title: "Decode", points: ["One token per step", "Memory-bound: every weight read per step", "Cost per step ≈ constant plus cache reads", "Sets tokens per second", "Batched across requests to share weight reads"] },
      caption: "Two phases with different bottlenecks. Serving optimisations target each separately.",
    },
    everyday: {
      title: "Reading the brief, then dictating",
      text: "A consultant reads the whole brief first (prefill), which takes longer for a thick brief, then dictates the response sentence by sentence at a steady pace (decode). The dictation speed does not depend on the brief's thickness, only on how fast they speak. If three clients wait, the consultant can dictate a sentence for each in turn, keeping busy (batching) while each client waits a little longer per sentence.",
    },
    engineering: {
      title: "Diagnosing slow responses",
      text: "Users complained an assistant was slow. Traces showed time to first token at 4 seconds and then 40 tokens per second. The 4 seconds were prefill over a 12,000-token prompt that included the full conversation history every time. The team enabled prefix caching for the stable system prompt and trimmed history to the last twenty turns with a summary; time to first token fell to 0.6 seconds. The streaming speed was already fine for the model size, so they left it alone. Separating the phases pointed at the right fix.",
    },
    maths: {
      formula: "t_first ≈ prefill(n_in);   t_total ≈ t_first + n_out / (tokens per second);   decode step time ≈ weight bytes / memory bandwidth",
      meaning: "First-token latency depends on the prompt; streaming speed depends on how fast the hardware can read all the weights once per token.",
      worked: [
        "A 7B model in 16-bit has 14 GB of weights. On hardware with 2 TB/s memory bandwidth, one decode step reads them in 14 / 2,000 ≈ 7 ms, so about 140 tokens per second for one request before overheads.",
        "In 4-bit the weights are 3.5 GB: about 1.75 ms per step, roughly 570 tokens per second. Quantisation speeds decoding because decoding is memory-bound.",
        "Batching 16 requests reads the weights once per step for all 16: per-request step time barely changes, throughput rises 16 times, until the cache memory runs out.",
        "Prefill of a 12,000-token prompt at 1.3×10¹⁰ FLOPs per token ≈ 1.6×10¹⁴ FLOPs: about 0.5 to 2 seconds depending on hardware, which matches the 'slow first token' symptom.",
      ],
    },
    code: {
      title: "Prefill then decode, with a cache",
      lang: "py",
      src: `# Pseudocode for inference with a KV cache
cache = [None] * n_blocks                          # per-block keys and values seen so far

def forward(token_ids, cache):
    # Runs the given tokens through every block, appending their K and V to the cache,
    # and returns logits for the last position.
    ...

prompt_ids = tokenize(apply_chat_template(system, messages))
logits = forward(prompt_ids, cache)                # PREFILL: all prompt tokens at once
out = []
for _ in range(max_tokens):
    next_id = choose(logits)                       # greedy or sampling (Module 18)
    if next_id == END or hits_stop_sequence(out):
        break
    out.append(next_id)
    logits = forward([next_id], cache)             # DECODE: one token, attends to the cache
print(detokenize(out))`,
      lines: [
        { code: "logits = forward(prompt_ids, cache)                # PREFILL: all prompt tokens at once", say: "The prompt pass: parallel, compute-heavy, fills the cache, yields the first logits." },
        { code: "next_id = choose(logits)                       # greedy or sampling (Module 18)", say: "The only place randomness can enter: how a token is picked from the logits." },
        { code: "logits = forward([next_id], cache)             # DECODE: one token, attends to the cache", say: "Each step processes a single token but reads every weight; the cache supplies the past." },
      ],
    },
    useIt: "Inference's two phases map directly onto the latency and cost numbers you will manage: optimise prefill with caching and shorter prompts; optimise decode with smaller or quantised models and streaming; manage memory by bounding context and concurrency. Modules 39 and 40 turn this into serving design.",
    takeaways: ["Inference = prefill (whole prompt, parallel) + decode (one token per step, cached).", "Prefill sets time to first token; decode sets tokens per second.", "Decode is memory-bound: smaller weights stream faster; batching shares weight reads.", "Weights are frozen; only token choice is random."],
    terms: [["prefill", "the parallel pass over the prompt that fills the KV cache"], ["decode", "the token-by-token generation phase"], ["memory-bound", "limited by how fast data can be read from memory rather than by arithmetic"]],
    reflect: { q: "Why does a 4-bit model often generate faster than a 16-bit one, when the arithmetic is the same number of operations?", a: "Decoding reads every weight once per token and is limited by memory bandwidth; four times fewer bytes means up to four times faster steps, regardless of the operation count." },
  },

  "m17-open-weight-vs-proprietary-models": {
    simple: "Open-weight models can be downloaded and run on your own hardware; proprietary models are used through a provider's API. The choice trades control and data locality against capability, convenience and operational burden.",
    concept:
      "An **open-weight model** publishes its trained parameters under a licence that lets you download, run, fine-tune and often redistribute them (Llama, Mistral, Qwen, Gemma and many others). 'Open weights' is not the same as open source: the training data and code are usually not released, and licences vary in what commercial use they allow. A **proprietary model** is available only through its provider's API (the GPT, Claude and Gemini families): you send tokens, you receive tokens, and the weights never leave the provider.\n\nThe trade-offs are practical. Proprietary models usually lead on capability and are zero-effort to operate; you pay per token and accept that data transits the provider, that the model can change, and that you depend on their uptime and pricing. Open-weight models give full control: data stays on your machines, the model version is pinned forever, you can fine-tune deeply and serve at marginal cost at scale; in return you run the infrastructure (Modules 39 and 40), and the strongest open models trail the strongest proprietary ones, though the gap narrows.\n\nMany organisations use both: a proprietary model for hard or rare tasks, an open-weight model fine-tuned for high-volume or sensitive ones.",
    why:
      "The decision is driven by requirements that have nothing to do with architecture: whether data may leave your network, how predictable costs must be at volume, whether you need a frozen model version for compliance, how much engineering capacity you have, and how strong the model must be. Open-weight models exist because many organisations need control; proprietary APIs exist because most teams want capability without operations. Knowing both, and the licence terms, is part of designing any AI product responsibly.",
    how: [
      "List the constraints: data residency and privacy, volume and cost ceiling, need for fine-tuning, latency targets, compliance on model versioning, available engineering.",
      "Benchmark candidate models on your own evaluation set (Module 37), not public leaderboards alone.",
      "For open-weight: check the licence for your use, size the hardware, plan serving and monitoring.",
      "For proprietary: check data-handling terms, rate limits, version pinning and pricing at your projected volume.",
      "Decide per feature; route between models where it pays (Stage 8).",
    ],
    visual: {
      kind: "compare",
      left: { title: "Open-weight", points: ["Download and run anywhere; data stays local", "Pin the exact version forever", "Deep fine-tuning; marginal cost at scale", "You run the GPUs, serving, updates", "Licence terms vary; check them"] },
      right: { title: "Proprietary API", points: ["Strongest capability, no operations", "Pay per token; costs scale with use", "Data transits the provider under their terms", "Model versions can be retired or changed", "Fine-tuning limited to what the provider offers"] },
      caption: "Neither is simply better; the constraints decide.",
    },
    everyday: {
      title: "Owning a car or using taxis",
      text: "A taxi is available anywhere, you pay per trip, and someone else handles maintenance; but you cannot modify it, the fare can change, and your trips are on the company's records. Owning a car costs upfront and needs upkeep, but it is always yours, goes where you choose, and is cheap per mile if you drive a lot. Open-weight models are the car; APIs are the taxi. Many households have both.",
    },
    engineering: {
      title: "A hospital's two-model design",
      text: "A hospital group wanted clinical-note summaries and a general-purpose assistant for staff. Patient data could not leave their network, so note summarisation runs on an open-weight 8B model fine-tuned on their de-identified notes, served on two on-premise GPUs; the version is pinned, which their regulator required. The staff assistant, which handles no patient data, uses a proprietary API for its stronger reasoning and zero maintenance. The split cost less than either option alone would have for both jobs, and each model meets its own constraints.",
    },
    maths: {
      formula: "API cost ≈ tokens × price;   self-hosted cost ≈ (hardware + operations) / tokens served;   break-even where they cross",
      meaning: "API cost scales linearly with usage; self-hosting is a fixed cost spread over usage. At high enough volume the fixed cost wins.",
      worked: [
        "Proprietary: 50 million tokens per day at a blended 5 units per million = 250 units per day ≈ 7,500 per month.",
        "Self-hosted 8B model: one GPU server at 3,000 per month plus 2,000 of engineering time, serving up to 200 million tokens per day. Cost ≈ 5,000 per month regardless of usage up to capacity.",
        "Break-even at 5,000 / 5 units per million ≈ 1 billion tokens per month ≈ 33 million per day. Above that, self-hosting is cheaper; below, the API is, before counting the capability difference.",
      ],
    },
    code: {
      title: "The same request against an API and against a local server",
      lang: "ts",
      src: `// Proprietary: the provider's SDK, the model lives on their servers
const apiReply = await anthropic.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 300,
  messages: [{ role: "user", content: prompt }],
});

// Open-weight: a local server (vLLM, Ollama, etc.) exposing an OpenAI-style endpoint on your machine
const localReply = await fetch("http://localhost:8000/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model: "my-finetuned-8b", max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
}).then((r) => r.json());

// Same shape of call; different place the tokens go and different bill.`,
      lines: [
        { code: "model: \"claude-sonnet-5-5\",", say: "A hosted model named by the provider; you cannot pin it beyond the versions they keep." },
        { code: "const localReply = await fetch(\"http://localhost:8000/v1/chat/completions\", {", say: "The open-weight model behind a local server. The prompt never leaves your network." },
        { code: "body: JSON.stringify({ model: \"my-finetuned-8b\", max_tokens: 300, messages: [{ role: \"user\", content: prompt }] }),", say: "Your own fine-tuned version, frozen as long as you like." },
      ],
      note: "Most teams wrap both behind one internal interface so features can switch models without code changes (Stage 8).",
    },
    useIt: "Decide per feature using data, cost, control and capability constraints; benchmark on your own evaluations; read licences; and design an abstraction so you can route or switch. Module 47 covers running open-weight models locally in detail.",
    takeaways: ["Open-weight: downloadable parameters, full control, your infrastructure, variable licences.", "Proprietary: API access, strongest capability, no operations, data leaves your network, versions can change.", "Decide by constraints and measured quality, per feature.", "Using both, with routing, is common."],
    terms: [["open-weight model", "a model whose parameters are published for download"], ["proprietary model", "a model available only through its provider's API"], ["model licence", "the terms under which published weights may be used"]],
    reflect: { q: "A start-up with no infrastructure team must process customer contracts that may not leave the EU. Which option, and what would change your answer?", a: "An open-weight model hosted in an EU data centre they control, or a provider that contractually guarantees EU processing and no training on their data; capability needs and volume would decide between them, and a strong EU-hosted managed offering could make the API route viable without an ops team." },
  },
};

export const M17_QUIZ: Quiz[] = [
  {
    q: "What single objective is used to pretrain an LLM?",
    options: ["Answer questions correctly", "Predict the next token", "Classify sentences", "Translate between languages"],
    answer: 1,
    why: ["Answering emerges; it is not the objective.", "Correct. Next-token prediction on raw text, with no human labels.", "That is an encoder fine-tuning task.", "A possible downstream task, not the pretraining objective."],
  },
  {
    q: "Two models: a 2020 model with 175B parameters trained on 300B tokens, and a 2024 model with 8B parameters trained on 15T tokens. Why can the small one compete?",
    options: ["Parameters do not matter", "It has far more training tokens per parameter and better data, so it is much closer to compute-optimal", "It uses a different architecture", "Benchmarks are broken"],
    answer: 1,
    why: ["They matter, but they are one of three ingredients.", "Correct. ~1,900 tokens per parameter versus ~2; the older model was badly under-trained.", "Both are GPT-style decoders.", "The effect is real and measured."],
    reason: true,
  },
  {
    q: "A 13B model in 16-bit precision needs about how much memory for its weights?",
    options: ["6.5 GB", "13 GB", "26 GB", "52 GB"],
    answer: 2,
    why: ["That is 4-bit.", "That is 8-bit.", "Correct. 13 billion × 2 bytes.", "Training-time memory can reach this; inference weights are 26 GB."],
  },
  {
    q: "Which family should classify ten million short texts a day most cheaply?",
    options: ["Decoder-only with a classification prompt", "Encoder-only fine-tuned with a classification head", "Encoder-decoder", "Any; cost is the same"],
    answer: 1,
    why: ["Works, but tens of times more compute and a generation loop.", "Correct. One bidirectional pass, milliseconds on CPU, deterministic.", "Built for sequence-to-sequence, not labels.", "Costs differ by orders of magnitude."],
  },
  {
    q: "Why is the system prompt placed first in a decoder-only model's context?",
    options: ["The model reads the end first", "So its keys and values are identical across calls and can be cached; later tokens attend to it", "Because the API requires it", "It makes no difference"],
    answer: 1,
    why: ["Causal models read left to right.", "Correct. A stable prefix is cacheable, and everything after it can attend to it.", "The architecture, not the API, is the reason.", "Order changes cost and behaviour."],
    reason: true,
  },
  {
    q: "A request has 20,000 input tokens and 100 output tokens. Which lever most reduces its time to first token?",
    options: ["Lower max_tokens", "Shorter or cached prompt", "Higher temperature", "A larger vocabulary"],
    answer: 1,
    why: ["Affects total time, not first token.", "Correct. First-token latency is the prefill over the prompt.", "Sampling does not change latency.", "Not a per-request lever."],
  },
  {
    q: "What does a model's context window limit?",
    options: ["Its total knowledge", "The tokens it can attend to in one call, prompt plus answer", "Its parameter count", "How many users it can serve"],
    answer: 1,
    why: ["Knowledge is in the weights.", "Correct. A hard per-call limit; beyond it, tokens are not seen.", "Unrelated.", "That is a serving matter."],
  },
  {
    q: "Which is a reason to choose an open-weight model over a proprietary API?",
    options: ["It is always more capable", "Data must stay on your own infrastructure and the version must be pinned", "It needs no engineering", "It is always cheaper"],
    answer: 1,
    why: ["The strongest proprietary models usually lead.", "Correct. Control over data and versions is the classic driver.", "You run the serving stack yourself.", "Cheaper only above a volume break-even."],
  },
  {
    q: "Decoding a token on a 7B model reads 14 GB of weights on hardware with 2 TB/s bandwidth. Roughly how many tokens per second for one request?",
    options: ["14", "140", "1,400", "14,000"],
    answer: 1,
    why: ["Too slow.", "Correct. 14 GB / 2,000 GB/s = 7 ms per token ≈ 140 per second, before overheads.", "Would need ten times the bandwidth or 4-bit weights and more.", "No."],
  },
];

export const M17_EXERCISES: Exercise[] = [
  {
    title: "Size a deployment from a config",
    kind: "calculate",
    task: "A model config: 40 blocks, d_model 5,120, 40 heads, 8 KV heads, d_ff 13,824 (gated), vocabulary 128,000, tied embeddings, context 32k. Estimate parameters, 16-bit weight memory, KV cache per token and cache at full context. Will it fit on one 80 GB GPU with 4 concurrent 8k-token conversations?",
    hints: ["d_head = 5,120 / 40 = 128.", "Attention per block ≈ 2·d² + 2·d·8·128; FFN per block = 3·d·d_ff.", "Cache per token = 2 · blocks · kv_heads · d_head · 2 bytes."],
    solution: "Attention per block: 2·5,120² + 2·5,120·1,024 ≈ 52.4M + 10.5M = 62.9M; FFN: 3·5,120·13,824 ≈ 212M; per block ≈ 275M; 40 blocks ≈ 11.0B; embeddings 128,000·5,120 ≈ 655M; total ≈ 11.7B → ≈ 23.4 GB in 16-bit. Cache per token: 2·40·8·128·2 = 164 KB; at 32k ≈ 5.4 GB; four 8k conversations ≈ 5.4 GB. Weights plus cache ≈ 29 GB plus activations: fits comfortably on 80 GB.",
  },
  {
    title: "Cost a feature",
    kind: "calculate",
    task: "A feature makes 20,000 calls a day, each with a 2,500-token system prompt (cacheable), 600 tokens of fresh input and 350 output tokens. Prices per million: input 3, cached input 0.3, output 15. Compute the daily cost with and without prompt caching, and the share of cost that is output.",
    hints: ["Without caching all 3,100 input tokens are full price.", "With caching, 2,500 are at 0.3."],
    solution: "Without caching per call: 3,100·3 + 350·15 = 9,300 + 5,250 = 14,550 micro-units; daily 20,000 × 0.01455 = 291 units. With caching: 600·3 + 2,500·0.3 + 350·15 = 1,800 + 750 + 5,250 = 7,800; daily 156 units. Output share: 5,250 / 7,800 ≈ 67% with caching; shortening answers is now the main lever.",
  },
  {
    title: "Choose a family per task",
    kind: "think",
    task: "For each, pick encoder-only, decoder-only or encoder-decoder and justify in one sentence: (a) deduplicating near-identical support articles, (b) turning meeting audio into minutes, (c) an internal chatbot over HR policies, (d) detecting toxic comments at 10,000 per second, (e) translating a product catalogue into eight languages.",
    hints: ["Labels and vectors → encoder; free text from a prompt → decoder; sequence in, different sequence out → encoder-decoder."],
    solution: "(a) Encoder-only embeddings with cosine similarity. (b) Encoder-decoder speech model for transcription, then a decoder-only model to write minutes. (c) Decoder-only with retrieval over the policies. (d) Fine-tuned encoder-only classifier for throughput and determinism, with a decoder for edge cases. (e) Encoder-decoder translation model; a decoder-only model works but costs more per catalogue.",
  },
  {
    title: "Write the break-even analysis",
    kind: "think",
    task: "Your team spends 12,000 units a month on a proprietary API for a high-volume summarisation feature (about 2.4 billion tokens). An open-weight 8B model scores within 2 points on your evaluation. Self-hosting would cost 4,000 a month in hardware and 3,000 in engineering time. List the questions you would answer before switching, beyond the arithmetic.",
    hints: ["Think about quality on the tail, operations, versioning, data, and the cost of being wrong."],
    solution: "Arithmetic favours switching (7,000 vs 12,000). Before deciding: Is the 2-point gap concentrated in important cases? Can we meet latency and uptime targets with our own serving? Who is on call? Do we gain anything from version pinning or data locality that matters to customers? What is the migration cost and the rollback plan? Could we route only the easy 80% to the open model and keep the API for the rest, capturing most of the saving with less risk?",
  },
];
