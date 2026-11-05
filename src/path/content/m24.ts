import type { Exercise, LessonBody, Quiz } from "../types";

// Module 24: Building a custom language model. One concept per lesson. Keys are lesson slugs: m24-<kebab of the concept title in map.ts>.

export const M24_BODIES: Record<string, LessonBody> = {
  "m24-selecting-a-base-model": {
    simple: "Choosing the base model is the biggest decision in a custom-model project: size, licence, what it was trained on, how it performs on tasks like yours, and whether it fits your hardware all matter more than any later setting.",
    concept:
      "A custom model is almost always a base model plus your adaptation (Modules 21 to 23). **Selecting a base model** means choosing which of the available open-weight models to start from. The criteria, roughly in order: **licence** (can you use it commercially, redistribute adapters, fine-tune?); **size** (what can you train with the tricks of Module 22, and what can you serve at your latency and cost?); **training data and mix** (Module 20: does it cover your languages and domain?); **the variant** (base for continued pretraining, instruct for most fine-tunes); **benchmark results on tasks resembling yours**, verified by your own quick evaluation; **context length**; **ecosystem** (tokeniser quality, library support, quantised versions available).\n\nThe right process is a shortlist of two or three candidates and a cheap bake-off: the same 200-example evaluation and a short LoRA pilot on each. Benchmarks rank models in general; your test set ranks them for you. A model that is a point behind on public leaderboards and ten points ahead on your clause-extraction set is the better base.\n\nStronger bases make better fine-tunes from the same data, so pick the strongest you can afford to serve, not to train; training cost is paid once.",
    why:
      "Everything downstream inherits the base: its knowledge, its languages, its biases, its licence and its serving cost. A poor choice is not recoverable by data or training tricks (Module 21: fine-tuning cannot add what pretraining left out). And the field moves fast; a base chosen a year ago is often beaten by a smaller, cheaper, newer one. A deliberate selection step, repeated when the landscape changes, is the cheapest leverage in the project.",
    how: [
      "Write down constraints: licence needs, serving hardware and latency, languages, context length.",
      "Shortlist candidates that satisfy the constraints from current open-weight families, in the size range you can serve.",
      "Run your own 200-example evaluation on each candidate with a good prompt; record quality, latency and cost.",
      "Run a short LoRA pilot (300 examples, one hour) on the top two; compare on the test set.",
      "Pick; record the exact model id and revision; plan to revisit when a new generation ships.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Criterion", "Question", "Where to look"],
        rows: [
          ["licence", "commercial use, redistribution, fine-tuning allowed?", "the model card's licence section"],
          ["size and serving", "fits the GPU you serve on, at the latency you need?", "Module 20's memory arithmetic; a latency test"],
          ["data mix", "your languages and domain covered?", "model card, technical report"],
          ["variant", "base or instruct?", "continued pretraining → base; fine-tune → instruct"],
          ["task fit", "scores on your 200 examples?", "your own evaluation, not the leaderboard"],
          ["context length", "long enough for your prompts?", "model card; test at your real lengths"],
          ["ecosystem", "tokeniser, library support, quantised builds?", "framework docs, community builds"],
        ],
      },
      caption: "The leaderboard answers one question; your test set answers the one that matters.",
    },
    everyday: {
      title: "Choosing a used car to modify",
      text: "If you plan to modify a car, the base car decides everything: the engine's limits, what parts fit, whether it is legal to resell, what it costs to run. No amount of tuning turns a city hatchback into a tow vehicle. People who modify cars spend longer choosing the base than on any single modification. So should you.",
    },
    engineering: {
      title: "The bake-off that changed the plan",
      text: "A team assumed they would use a well-known 13B model. The bake-off on 200 real support tickets: the 13B scored 71% with prompting; a newer 8B scored 76% and ran twice as fast; a 3B scored 64%. After a one-hour LoRA pilot the 8B reached 88% and the 13B 85%. They chose the 8B: better, cheaper to serve, and its licence allowed redistribution of adapters to customers, which the 13B's did not. The two-day bake-off saved a year of serving cost.",
    },
    maths: {
      formula: "serving cost per month ≈ requests × tokens per request × GPU-seconds per token × GPU price;   smaller base → lower GPU-seconds per token",
      meaning: "Serving cost scales with model size through tokens-per-second throughput. The base decides it for the product's lifetime.",
      worked: [
        "3 million requests per month at 800 tokens each: 2.4 billion tokens.",
        "A 13B model on one GPU serves roughly 1,500 tokens per second in batched inference; an 8B about 2,600.",
        "GPU-seconds: 13B → 2.4 × 10⁹ ÷ 1,500 = 1.6 million; 8B → 2.4 × 10⁹ ÷ 2,600 ≈ 0.92 million.",
        "At $2 per GPU-hour: 13B ≈ $890 per month; 8B ≈ $510 per month: a 43% saving, every month, from the base choice alone.",
      ],
      note: "Throughput figures are illustrative; measure your own on your serving stack.",
    },
    useIt: "Before any training, run the bake-off: constraints, shortlist, your own evaluation, a short pilot. Choose the strongest base you can serve, verify its licence, pin its revision, and schedule a re-check when new model generations appear.",
    takeaways: ["The base decides knowledge, languages, licence and serving cost for the project's life.", "Criteria: licence, size and serving, data mix, variant, task fit on your test set, context, ecosystem.", "Shortlist and bake-off with your own evaluation and a short pilot; the leaderboard is only a filter.", "Pick the strongest you can serve; pin the revision; revisit when the field moves."],
    terms: [["model card", "the document that accompanies a model: licence, training data, intended use, evaluations"], ["bake-off", "running candidate models on the same evaluation to pick one"]],
    reflect: { q: "Why pick the strongest model you can serve rather than the strongest you can train?", a: "Training happens once, and Module 22's techniques fit almost anything on modest hardware. Serving happens millions of times; a model you cannot serve at your latency and cost is useless however well it trained. The serving constraint is the binding one." },
  },

  "m24-selecting-a-tokeniser": {
    simple: "A tokeniser is almost always inherited from the base model; the decision is whether its vocabulary handles your text efficiently, and when it does not, whether to extend it or change base.",
    concept:
      "The tokeniser (Module 12) is part of the model: its embedding table (Module 16) has one row per token, learned during pretraining. **Selecting a tokeniser** therefore usually means selecting a base model and accepting its tokeniser. What you can decide is whether it suits your text.\n\nThe test is efficiency and fidelity on your data. Run your corpus through it and measure tokens per word (or per character): English prose on a good tokeniser is around 1.3 tokens per word; code, Gurmukhi or chemical names can be three or four times worse on a tokeniser whose vocabulary never saw them. Inefficient tokenisation costs money on every call, shrinks the effective context window, and often hurts quality because the model sees your text as fragments.\n\nWhen the tokeniser is bad for your domain there are three options. Choose a different base whose tokeniser covers it. **Extend the vocabulary**: add new tokens for your domain, initialise their embeddings sensibly, and train them in during continued pretraining; this helps a lot for new scripts and is routine in multilingual work (Stage 9). Or train a new tokeniser and a new model from scratch, which is pretraining and almost never justified.",
    why:
      "Tokenisation is invisible until it is the bottleneck. A model that spends four tokens per Punjabi word has a quarter of its context for Punjabi, costs four times as much per word, and reasons over fragments. Measuring tokeniser fit before committing to a base is a ten-minute check that prevents a structural problem no fine-tune can fix.",
    how: [
      "Sample 10,000 documents from your real text.",
      "Tokenise with each candidate base's tokeniser; compute tokens per word and the share of unknown or byte-fallback tokens.",
      "Inspect how domain terms split: product codes, legal phrases, code identifiers, non-Latin scripts.",
      "If the fit is poor and a better base exists, change base.",
      "If not, extend the vocabulary: add frequent domain pieces, initialise embeddings as the mean of their current sub-token embeddings, and train with continued pretraining before fine-tuning.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Tokeniser A (English-heavy)", "Tokeniser B (multilingual)"],
        rows: [
          ["'The invoice is overdue.'", "5 tokens", "5 tokens"],
          ["'ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ?' (Punjabi, 4 words)", "19 tokens (byte fallback)", "7 tokens"],
          ["'SKU WL-2041-OAK'", "9 tokens", "8 tokens"],
          ["a Python function (120 words)", "190 tokens", "160 tokens"],
        ],
      },
      caption: "Same text, different costs. For Punjabi, tokeniser A spends nearly three times the tokens, which is three times the cost and a third of the context.",
    },
    everyday: {
      title: "A keyboard without your letters",
      text: "Typing Punjabi on an English keyboard is possible with codes and workarounds, but every word takes many keystrokes and typos multiply. A keyboard with the right letters makes the same text quick and clean. The tokeniser is the model's keyboard; check it has your letters before you buy.",
    },
    engineering: {
      title: "Extending a vocabulary for a chemistry assistant",
      text: "A pharmaceutical team found that compound names split into 10 to 15 tokens each, and their 4,000-token prompts of lab notes overflowed the context. They added 8,000 tokens for frequent chemical fragments to the tokeniser, initialised each new embedding as the mean of the sub-tokens it replaced, and ran continued pretraining on 2 billion tokens of chemistry text. Tokens per document fell by 38%, context problems disappeared, and extraction accuracy rose four points after fine-tuning. The cost: two days of training and careful testing that the old tokens still worked.",
    },
    maths: {
      formula: "tokens per word = total tokens ÷ total words;   cost ratio = tokens per word(A) ÷ tokens per word(B)",
      meaning: "Tokeniser efficiency is measured on your own corpus. The ratio between candidates is the ratio of per-call cost and of context consumed.",
      worked: [
        "A 10,000-document Punjabi sample: 1.2 million words. Tokeniser A: 5.4 million tokens → 4.5 tokens per word. Tokeniser B: 1.9 million tokens → 1.58 tokens per word.",
        "Cost ratio = 4.5 ÷ 1.58 ≈ 2.85: every Punjabi request costs nearly three times as much on A.",
        "Effective context: an 8,192-token window holds about 1,800 Punjabi words on A and 5,200 on B.",
        "Extending A's vocabulary with 6,000 Gurmukhi tokens brought it to about 1.9 tokens per word after continued pretraining.",
      ],
    },
    code: {
      title: "Measuring tokeniser fit on your corpus",
      lang: "py",
      src: `from transformers import AutoTokenizer

def tokens_per_word(name, docs):
    tok = AutoTokenizer.from_pretrained(name)
    words = sum(len(d.split()) for d in docs)
    toks = sum(len(tok.encode(d, add_special_tokens=False)) for d in docs)
    return toks / words

docs = load_sample("punjabi_support.jsonl", n=10000)
for name in ["family-a/instruct-8b", "family-b/instruct-7b"]:
    print(name, round(tokens_per_word(name, docs), 2))

tok = AutoTokenizer.from_pretrained("family-a/instruct-8b")
print(tok.tokenize("SKU WL-2041-OAK"))             # see how a domain code splits`,
      lines: [
        { code: "return toks / words", say: "One number per candidate tokeniser: how many tokens each word of your text costs." },
        { code: "docs = load_sample(\"punjabi_support.jsonl\", n=10000)", say: "Measure on your real text, not on English benchmarks." },
        { code: "print(tok.tokenize(\"SKU WL-2041-OAK\"))             # see how a domain code splits", say: "Look at the pieces for the terms that matter; fragments of fragments are a warning sign." },
      ],
    },
    useIt: "Measure tokens per word on your corpus for every candidate base before choosing. Prefer a base whose tokeniser fits; extend the vocabulary with continued pretraining when it does not and no better base exists. Stage 9 uses exactly this for Punjabi.",
    takeaways: ["The tokeniser comes with the base; the decision is whether it fits your text.", "Measure tokens per word on your corpus; poor fit means higher cost, less context, worse quality.", "Fix by choosing another base or extending the vocabulary with continued pretraining.", "Training a new tokeniser means a new model; almost never justified."],
    terms: [["tokens per word", "a measure of tokeniser efficiency on a corpus"], ["vocabulary extension", "adding new tokens and embeddings to an existing model"], ["byte fallback", "representing text the vocabulary lacks as raw bytes, several tokens per character"]],
    reflect: { q: "Why initialise a new token's embedding as the mean of its sub-tokens rather than randomly?", a: "The model already has a working representation for the text as a sequence of sub-tokens; the mean of those embeddings is close to what the model 'expects' for that text, so the new token starts near a sensible meaning and continued pretraining refines it. A random vector starts nowhere and needs far more data to become useful." },
  },

  "m24-preparing-training-data": {
    simple: "Preparing data for a custom model combines Module 20's large-scale cleaning with Module 21's example craft: collect by purpose, clean, deduplicate, decontaminate, format, split, and document.",
    concept:
      "A custom model project has up to three kinds of data, each prepared differently. **Continued-pretraining data**: raw domain text in the billions of tokens, cleaned, deduplicated and filtered with the Module 20 pipeline at smaller scale. **Supervised examples**: prompt–completion pairs in the thousands, crafted to the Module 21 standard, with a loss mask. **Preference pairs**: chosen and rejected responses for Module 23's methods. **Preparing training data** means producing each of these with provenance, a consistent format, deduplication within and across them, decontamination against your evaluation sets, and a frozen test set drawn before anything is trained.\n\nThe order of operations matters: freeze the evaluation sets first, then build training data and check it against them, so that no test example leaks into training through a shared source. Document every dataset with its source, size, cleaning rules, licence and known gaps: the datasheet becomes part of the model's documentation and the first place to look when the model misbehaves.",
    why:
      "Data decides the model; the training code is nearly a commodity. Projects fail on data more than on anything else: leaked test sets that make results meaningless, duplicated examples that over-weight a case, personal data that cannot ship, missing coverage of the cases that matter. One coherent preparation step with checks at each stage is the difference between a model you can trust and one that surprises you after launch.",
    how: [
      "Freeze evaluation sets first: a task test set, a general-ability suite, and safety sets.",
      "Collect domain text for continued pretraining if needed; clean, dedupe, filter (Module 20), decontaminate against the evaluation sets.",
      "Build supervised examples (Module 21): real inputs, expert outputs, one schema, the production prompt, loss mask.",
      "Build preference pairs (Module 23) if judgement needs tuning, from the current model's outputs.",
      "Deduplicate across all three sets and against evaluation sets; redact personal data.",
      "Write the datasheet: sources, sizes, rules, licences, gaps, splits, hashes.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Dataset", "Scale", "Format", "Key checks", "Feeds"],
        rows: [
          ["domain text", "10⁸–10¹⁰ tokens", "packed sequences", "dedupe, filter, decontaminate", "continued pretraining"],
          ["supervised examples", "10³–10⁵ pairs", "chat template + loss mask", "quality, balance, schema, production prompt", "SFT"],
          ["preference pairs", "10³–10⁵ triples", "prompt, chosen, rejected", "both-sided, fresh, length-matched", "DPO / reward model"],
          ["evaluation sets", "10²–10³ items each", "frozen, hashed", "built first; never trained on", "every stage's measurement"],
        ],
      },
      caption: "Four datasets, four pipelines, one rule: the evaluation sets are frozen before the others are built.",
    },
    everyday: {
      title: "Mise en place",
      text: "A professional kitchen prepares every ingredient before service starts: washed, cut, measured, labelled, with the tasting portions set aside first so they are not accidentally used. Service then runs smoothly. Data preparation is the kitchen's mise en place, and the tasting portions are the frozen evaluation sets.",
    },
    engineering: {
      title: "Catching the leak before it cost a quarter",
      text: "A team building a legal-clause model assembled 2 billion tokens of contracts for continued pretraining and a 300-example test set drawn from a public clause dataset. A decontamination check found 41 of the 300 test clauses verbatim inside the pretraining corpus, because the public dataset had been scraped from the same sources. They rebuilt the test set from private, held-out contracts. Without the check, the model's reported accuracy would have been inflated by memorisation and the error discovered by customers.",
    },
    maths: {
      formula: "required supervised examples ≈ (distinct behaviours × examples per behaviour);   decontamination overlap = test items with a 13-gram match in training ÷ test items",
      meaning: "Supervised data is sized by how many distinct things the model must learn and how many examples each needs (tens for simple formats, hundreds for subtle judgements). Overlap must be measured, not assumed zero.",
      worked: [
        "A support model must handle 12 request types with 2 formats each and 3 languages: 72 behaviour cells.",
        "At 40 examples per cell for subtle ones and 15 for simple ones, averaging 25: about 1,800 examples, plus 300 refusals and clarifications: ≈ 2,100.",
        "Decontamination on a 300-item test set finds 41 matches: 41 ÷ 300 ≈ 14% overlap: rebuild the test set.",
        "After rebuilding: 0 matches: results are trustworthy.",
      ],
    },
    code: {
      title: "A decontamination check between training text and a test set",
      lang: "py",
      src: `def ngrams(text, n=13):
    toks = text.split()
    return {" ".join(toks[i:i + n]) for i in range(len(toks) - n + 1)}

train_grams = set()
for doc in training_documents:                     # streamed; use a Bloom filter at large scale
    train_grams |= ngrams(doc)

contaminated = [t for t in test_items if ngrams(t["text"]) & train_grams]
print(len(contaminated), "of", len(test_items), "test items overlap training")`,
      lines: [
        { code: "return {\" \".join(toks[i:i + n]) for i in range(len(toks) - n + 1)}", say: "Every run of thirteen words in a document; a shared run this long is almost never a coincidence." },
        { code: "contaminated = [t for t in test_items if ngrams(t[\"text\"]) & train_grams]", say: "A test item sharing any 13-gram with training data is contaminated and must be replaced." },
      ],
      note: "At billions of tokens, store training n-grams in a Bloom filter or a hashed set on disk; the logic is unchanged.",
    },
    useIt: "Run data preparation as a project phase with its own checklist: evaluation sets frozen first, then each training dataset built with its pipeline, cross-set deduplication, decontamination, redaction, and a datasheet. Most of a custom-model project's calendar belongs here.",
    takeaways: ["Three training datasets (domain text, supervised, preference) plus frozen evaluation sets.", "Freeze evaluation first; decontaminate everything against it.", "Each dataset has its own pipeline and checks; all are deduplicated and redacted.", "Document with a datasheet; it is part of the model."],
    terms: [["datasheet", "the document recording a dataset's sources, size, rules, licences and gaps"], ["decontamination", "removing or replacing evaluation items that overlap training data"]],
    reflect: { q: "Why build the test set from private data rather than a public benchmark?", a: "Public benchmarks are on the web, and therefore often inside base models' pretraining data and inside any domain corpus scraped from similar sources; scores on them measure memorisation as much as ability. A private test set drawn from your own held-out cases measures what you will actually deploy." },
  },

  "m24-choosing-a-training-objective": {
    simple: "The objective is the loss you minimise: next-token prediction for domain text, masked-prompt SFT for examples, preference losses for judgement; pick the one that matches what each dataset should teach.",
    concept:
      "Each training phase has a natural objective. For continued pretraining on domain text, the **next-token objective** over every token (Module 20) teaches vocabulary and knowledge. For supervised examples, the same loss with the **prompt masked** (Module 21) teaches input-to-output behaviour. For preference pairs, the **DPO loss** (Module 23) or a reward-model loss teaches judgement. **Choosing a training objective** is matching dataset to loss, and sometimes mixing them: a multi-task run can combine next-token loss on domain text with masked SFT loss on examples in one batch, weighted.\n\nThere are variations worth knowing. Masking only the final assistant turn versus all assistant turns in multi-turn data. Weighting tokens (down-weighting boilerplate). Auxiliary objectives such as a classification head for a routing task. And for encoder-style tasks, masked-language objectives, though for generative custom models next-token loss dominates.\n\nThe objective also decides what the loss number means at evaluation: a continued-pretraining loss is a perplexity over documents; an SFT loss is over completions only; they are not comparable with each other.",
    why:
      "The loss is the only thing the optimiser listens to. Train domain text with a masked SFT loss and the model learns nothing from the 'prompt' half; train examples with an unmasked loss and the signal goes to predicting inputs (Module 21's missing mask). Mixing phases without matching objectives wastes the data. Writing down which loss applies to which dataset, and why, is a one-page decision that prevents a class of silent failures.",
    how: [
      "List your datasets and what each should teach: knowledge, behaviour, judgement.",
      "Assign the objective: next-token over all tokens for domain text; masked next-token for SFT pairs; DPO for preferences.",
      "Decide ordering or mixing: sequential phases (pretrain → SFT → DPO) are simplest; a mixed SFT + domain batch can reduce forgetting.",
      "Set per-dataset weights if mixing, so a large domain corpus does not drown a small example set.",
      "Decide multi-turn masking and any token weighting; write it in the training config.",
      "Record which loss each reported number uses.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Dataset", "Objective", "Loss counted on", "Teaches"],
        rows: [
          ["domain text", "next-token prediction", "every token", "vocabulary, facts, style of the domain"],
          ["supervised pairs", "next-token with prompt mask", "completion tokens", "input → output behaviour"],
          ["multi-turn conversations", "next-token with user turns masked", "all assistant turns", "consistent behaviour across a dialogue"],
          ["preference pairs", "DPO (or reward model + RL)", "chosen vs rejected sequence log-probs", "which responses are better"],
          ["labels for routing", "cross-entropy on a classification head", "one label per example", "a classifier on top of the model"],
        ],
      },
      caption: "Same model, different losses, different lessons. The mapping is the training plan.",
    },
    everyday: {
      title: "Different exercises for different muscles",
      text: "A coach does not use one exercise for everything: endurance training, technique drills and sparring each build something different, and doing sparring when you meant to build endurance wastes the session. Objectives are the exercises; the datasets are the sessions.",
    },
    engineering: {
      title: "Mixing objectives to keep the domain",
      text: "After continued pretraining on medical text, a team's SFT on 5,000 clinical Q&A pairs caused the model's medical vocabulary to regress slightly (a mild forgetting). They switched to a mixed objective: each batch held 70% SFT pairs under the masked loss and 30% medical text under the full next-token loss, weighted equally. Domain perplexity stayed flat through SFT, and task accuracy was unchanged. The mix cost nothing extra; it was a configuration decision.",
    },
    maths: {
      formula: "L_mix = w₁ · L_next-token(domain) + w₂ · L_SFT(pairs);   with per-token normalisation, w₁ = w₂ = 1 means each dataset's token contributes equally",
      meaning: "A mixed objective is a weighted sum of per-dataset losses. The weights, together with how many tokens each dataset contributes per batch, decide which lessons dominate.",
      worked: [
        "A batch of 16,000 tokens: 11,200 from SFT pairs (completion tokens only, after masking ≈ 4,000 counted) and 4,800 domain tokens (all counted).",
        "Without normalisation, the domain loss is averaged over 4,800 tokens and the SFT loss over 4,000: roughly equal influence.",
        "If the domain share rose to 12,000 tokens per batch, it would dominate; set w₂ = 2 or reduce the domain share to rebalance.",
        "Track both losses separately on validation: a falling SFT loss with a rising domain loss means the mix is too SFT-heavy.",
      ],
    },
    useIt: "Write the dataset-to-objective mapping before training: which loss, which tokens are counted, what is mixed and with what weights. Report validation losses per dataset, not one blended number, and keep in mind that losses from different objectives cannot be compared with each other.",
    takeaways: ["Match each dataset to its objective: next-token for text, masked next-token for pairs, DPO for preferences.", "Mixing objectives in a batch can preserve domain knowledge during SFT.", "Weights and token shares decide which lessons dominate; monitor per-dataset losses.", "Losses under different objectives are not comparable."],
    terms: [["mixed objective", "a weighted sum of losses from different datasets in one training run"], ["token weighting", "scaling individual tokens' contribution to the loss"]],
    reflect: { q: "Why mask user turns but learn all assistant turns in multi-turn data?", a: "The model will generate every assistant turn and never a user turn, so every assistant turn is a lesson in the behaviour you want, including early turns whose context is shorter. Learning only the final turn throws away most of the data; learning user turns teaches the model to imitate users." },
  },

  "m24-selecting-model-architecture": {
    simple: "For a custom language model you rarely design an architecture; you inherit the base's transformer and choose what to adapt, and only consider a new architecture when training from scratch for a special reason.",
    concept:
      "**Selecting model architecture** sounds like designing layers; in a custom-model project it almost never is. Starting from a base model fixes the architecture: a decoder-only transformer (Module 16) with a given depth, width, attention variant, positional scheme and vocabulary. Changing it would discard the pretrained weights. What remains to choose is around the base: which modules get LoRA adapters, whether to add a task head (a classifier on the final hidden state), whether to extend the context window with position-encoding adjustments and continued training, and whether to attach a vision or audio encoder for multimodal use.\n\nDesigning an architecture from scratch is justified only when training from scratch: a tiny model for an embedded device, a research experiment, or a domain where no base exists (rare now). Then the choices are the standard transformer knobs (layers, hidden size, heads, feed-forward size, attention type, vocabulary) sized by the scaling rules of Module 20, and the right move is to copy a proven configuration at your target size rather than invent one.\n\nFor most teams the architecture decision is: which base (lesson 1), and what to attach.",
    why:
      "Architecture is where pretraining's investment lives. The weights only make sense with the exact layer shapes they were trained in, so the base dictates the structure. Teams new to the field sometimes spend weeks designing custom layers for a model they will then initialise from a base, which cannot work. Knowing that the architecture is inherited, and what the real attachment points are, focuses effort where it has leverage.",
    how: [
      "Take the base's architecture as given: read its config (layers, hidden size, heads, context length, position encoding).",
      "Choose adaptation points: LoRA target modules (Module 22), optional task head, optional vocabulary extension.",
      "If longer context is needed, plan position-encoding scaling plus continued training on long sequences.",
      "If multimodal input is needed, plan an encoder plus projection trained to the frozen language model (Module 48).",
      "Only if training from scratch: copy a proven configuration at the target size and set depth, width and heads by the scaling rules.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Starting from a base (almost always)", points: ["architecture fixed by the weights", "choose: LoRA targets, task heads, vocabulary extension", "optional: context extension, modality encoders", "weeks of data work, hours of training"] },
      right: { title: "Training from scratch (rare)", points: ["architecture is yours to set", "copy a proven config at the target size", "depth, width, heads, FFN, attention variant, vocabulary", "months of data work, days to weeks of training"] },
      caption: "The architecture decision is mostly 'what to attach', not 'what to build'.",
    },
    everyday: {
      title: "Renovating versus building",
      text: "Buying a house fixes its structure; you choose what to fit inside and whether to add an extension. Designing a house from the ground up is a different project with different skills and a different budget. Nearly every custom model is a renovation.",
    },
    engineering: {
      title: "Extending context from 4k to 32k",
      text: "A team needed 32,000-token prompts for contract review on a base trained at 4,096. They did not change the architecture: they scaled the rotary position encoding's base frequency, ran continued pretraining on 5 billion tokens of long documents (packed to 32k sequences, Module 20), and verified retrieval accuracy at positions up to 30k with a needle-in-a-haystack test. The model's layers were untouched; the position scheme and training sequences did the work.",
    },
    maths: {
      formula: "parameters ≈ 12 × layers × d² (transformer blocks) + vocabulary × d (embeddings);   check a config against its claimed size",
      meaning: "Each block holds roughly 4d² in attention and 8d² in the feed-forward network. The formula lets you sanity-check a base's config or size a from-scratch model.",
      worked: [
        "A base with 32 layers, d = 4,096, vocabulary 32,000: blocks ≈ 12 × 32 × 4,096² ≈ 6.4 × 10⁹; embeddings ≈ 32,000 × 4,096 ≈ 1.3 × 10⁸; total ≈ 6.6 billion: matches a '7B' model.",
        "Sizing a from-scratch 350M model: with d = 1,024 and vocabulary 32,000, embeddings ≈ 33M; blocks must hold ≈ 317M = 12 × L × 1,024² → L ≈ 25 layers.",
        "Adding a classification head of d × 40 classes adds 164,000 parameters: negligible.",
      ],
    },
    useIt: "Read the base's config and treat it as fixed. Spend your architecture decisions on attachment points: LoRA targets, a task head if you need classification, vocabulary extension for your script, context extension if you need longer prompts. Reserve from-scratch design for tiny or research models, and copy a proven configuration when you do.",
    takeaways: ["Starting from a base fixes the architecture; the weights only fit their layers.", "Real decisions: LoRA targets, task heads, vocabulary and context extension, modality encoders.", "From-scratch design is rare; copy a proven configuration sized by scaling rules.", "Sanity-check sizes with the 12·L·d² rule."],
    terms: [["task head", "a small layer added on top of the model's hidden states for classification or scoring"], ["context extension", "training a model to use longer sequences than it was pretrained on, with position-encoding adjustments"]],
    reflect: { q: "Could you take a 7B base and remove half its layers to make it faster?", a: "You can, and the result is a damaged model until it is retrained: later layers expect the outputs of the removed ones. Layer pruning followed by continued pretraining or distillation (Module 49) can work, but it is a from-scratch-like project, not a configuration change." },
  },

  "m24-training-configuration": {
    simple: "The training configuration is the set of numbers that control a run: learning rate and schedule, batch size, epochs, sequence length, precision, LoRA settings, checkpointing; sensible defaults exist, and small pilots tune them.",
    concept:
      "A **training configuration** is everything the optimiser needs to know that is not data or model: the **learning rate** and its **schedule** (warm-up for a few hundred steps, then linear or cosine decay); the effective **batch size** in sequences or tokens; the number of **epochs**; the **sequence length**; **precision** (bf16 with fp32 master weights); **weight decay** and **gradient clipping**; **LoRA rank, alpha, dropout and targets**; **checkpoint and evaluation intervals**; the random **seed**.\n\nDefaults that work for most fine-tunes: LoRA at rank 16, alpha 32; learning rate 2e-4 for LoRA (2e-5 for full fine-tuning); warm-up 3% of steps then cosine decay to a tenth; effective batch 16 to 64 sequences; 2 to 3 epochs; bf16; weight decay 0.01; clip 1.0; evaluate every epoch; checkpoint on evaluation. For continued pretraining: learning rate 5e-5 to 1e-4 with the same schedule, batch in the millions of tokens, one pass.\n\nThe configuration is tuned with short pilots on a subset, varying one setting at a time, against validation loss and the task metric. It is recorded with the run, because reproducing a result without it is impossible.",
    why:
      "The wrong learning rate ruins a run in minutes (divergence) or wastes it over hours (no progress); the wrong batch size or epoch count overfits or underfits; a missing seed makes results unrepeatable. Most of these settings have known good ranges, so the job is not research but discipline: start from defaults, pilot, record. Projects that treat configuration as an afterthought spend their GPU budget rediscovering what defaults already knew.",
    how: [
      "Start from the default configuration for your method (LoRA fine-tune or continued pretraining).",
      "Set sequence length from your data's longest examples; set effective batch from memory and gradient accumulation (Module 22).",
      "Run a 10-minute pilot on 5% of the data: check that loss falls smoothly and memory fits.",
      "Pilot two or three learning rates (half, default, double) on the subset; pick by validation loss.",
      "Set epochs by watching validation loss per epoch on a full run; keep the best checkpoint.",
      "Record everything in a config file committed with the data hash and the base revision.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Setting", "LoRA fine-tune default", "Continued pretraining default", "Symptom if wrong"],
        rows: [
          ["learning rate", "2e-4", "5e-5 to 1e-4", "spikes or NaN (too high); flat loss (too low)"],
          ["schedule", "3% warm-up, cosine to 10%", "same", "early spike without warm-up"],
          ["effective batch", "16–64 sequences", "1–4M tokens", "noisy loss (too small); slow (too large)"],
          ["epochs", "2–3, best checkpoint kept", "1 pass", "validation rises (too many)"],
          ["precision", "bf16 + fp32 master", "bf16 + fp32 master", "NaN in fp16; slow in fp32"],
          ["weight decay / clip", "0.01 / 1.0", "0.1 / 1.0", "instability without clipping"],
          ["LoRA r / α / dropout", "16 / 32 / 0.05", "64 / 128 / 0", "overfit (r too high on small data)"],
          ["seed", "fixed", "fixed", "unrepeatable results"],
        ],
      },
      caption: "Defaults cover most runs. Pilots adjust the learning rate and epochs; everything else usually stays.",
    },
    everyday: {
      title: "The oven settings on the recipe",
      text: "A recipe states temperature, time and tray position because cooks found what works. You may adjust by a few degrees for your oven after one test bake, but you do not start from scratch each time. Training configuration is the oven settings, and a pilot is the test bake.",
    },
    engineering: {
      title: "The learning-rate sweep that saved the run",
      text: "A team's first full fine-tune at 5e-4 diverged after 300 steps (loss spiked to NaN). Rather than guess, they ran three 10-minute pilots on 5% of the data at 1e-4, 2e-4 and 3e-4. The 3e-4 pilot showed early spikes; 2e-4 fell smoothly; 1e-4 fell slowly. They chose 2e-4 with 3% warm-up, and the full run completed cleanly. Thirty minutes of pilots replaced a day of trial and error.",
    },
    maths: {
      formula: "steps per epoch = examples ÷ effective batch;   warm-up steps = 0.03 × total steps;   lr(t) = lr_max × 0.5 × (1 + cos(π · t ÷ T)) after warm-up (cosine decay)",
      meaning: "The schedule is defined over total steps, so batch size and epochs fix it. Cosine decay lowers the learning rate smoothly from the peak to near zero (or to a floor).",
      worked: [
        "4,000 examples, effective batch 32, 3 epochs: steps per epoch = 125; total T = 375 steps.",
        "Warm-up = 0.03 × 375 ≈ 11 steps: the learning rate rises linearly from 0 to 2e-4 over those steps.",
        "At step 200 (t ÷ T ≈ 0.53 of the way through the decay): lr = 2e-4 × 0.5 × (1 + cos(0.53π)) ≈ 2e-4 × 0.5 × (1 − 0.094) ≈ 9.1e-5.",
        "At the end the rate approaches 0 (or a floor of 2e-5 if a 10% minimum is set), which settles the weights into a minimum.",
      ],
    },
    code: {
      title: "A complete, recorded configuration",
      lang: "py",
      src: `config = {
    "base_model": "family-a/instruct-8b", "base_revision": "a1b2c3d",
    "data_hash": "sha256:9f2e...", "seed": 42,
    "method": "lora", "r": 16, "alpha": 32, "dropout": 0.05,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    "learning_rate": 2e-4, "schedule": "cosine", "warmup_ratio": 0.03, "min_lr_ratio": 0.1,
    "effective_batch": 32, "micro_batch": 2, "grad_accum": 16,
    "epochs": 3, "max_seq_len": 2048, "precision": "bf16",
    "weight_decay": 0.01, "max_grad_norm": 1.0,
    "eval_every": "epoch", "save_best_on": "val_loss",
}
json.dump(config, open("runs/support-v7/config.json", "w"), indent=2)`,
      lines: [
        { code: "\"base_model\": \"family-a/instruct-8b\", \"base_revision\": \"a1b2c3d\",", say: "The exact base and revision; an adapter is meaningless without them." },
        { code: "\"data_hash\": \"sha256:9f2e...\", \"seed\": 42,", say: "Which data, and the seed: the two things that make the run reproducible." },
        { code: "\"learning_rate\": 2e-4, \"schedule\": \"cosine\", \"warmup_ratio\": 0.03, \"min_lr_ratio\": 0.1,", say: "The schedule in full. 'Learning rate 2e-4' alone does not describe a run." },
        { code: "\"effective_batch\": 32, \"micro_batch\": 2, \"grad_accum\": 16,", say: "The batch that defines the update and how it is split to fit memory." },
      ],
      note: "The config file lives with the run's logs, evaluation results and adapter; together they are the model's provenance.",
    },
    useIt: "Start every run from the default table, set sequence length and batch from your data and memory, pilot the learning rate, choose epochs by validation, and commit the full configuration with the data hash and base revision. A run you cannot reproduce is a run you cannot trust or improve.",
    takeaways: ["Configuration = learning rate and schedule, batch, epochs, sequence length, precision, regularisation, LoRA settings, intervals, seed.", "Defaults cover most runs; pilots tune learning rate and epochs.", "Warm-up then cosine decay; bf16 with fp32 masters; clip at 1.0.", "Record everything with the data hash and base revision."],
    terms: [["learning-rate schedule", "how the learning rate changes over the run: warm-up then decay"], ["warm-up", "the first few percent of steps, where the learning rate rises from zero"], ["cosine decay", "a smooth reduction of the learning rate following a cosine curve"]],
    reflect: { q: "Why is the LoRA learning rate ten times higher than the full fine-tuning rate?", a: "LoRA's matrices start from zero (B) and random (A) and must learn their values from scratch, while full fine-tuning adjusts weights that are already good and must not be disturbed much. The small, fresh adapter tolerates and needs larger steps; the whole model does not." },
  },

  "m24-fine-tuning-workflow": {
    simple: "The workflow is the repeatable loop: freeze evaluation, prepare data, pilot, train, evaluate against baselines, inspect, iterate on data, and only then promote a version; most improvement comes from the data iterations.",
    concept:
      "A **fine-tuning workflow** turns the techniques of Modules 21 to 23 into a repeatable process with checkpoints at which decisions are made. The loop: (1) freeze the evaluation sets; (2) prepare and validate the dataset; (3) run a short pilot to check configuration and memory; (4) train the full run with evaluation each epoch; (5) evaluate the best checkpoint against the base, against prompting and against the previous version, with task metrics, the general suite and safety; (6) read samples and categorise failures; (7) fix the data (most often) or the configuration (sometimes) and go round again; (8) when the evaluation clears the bar, version the adapter with its config, data hash and results, and promote it.\n\nEach loop should take hours, not weeks, which is why PEFT and small pilots matter: the number of iterations is what improves the model. Teams typically go round five to ten times before a first release. Automation helps: a script that runs data validation, training, evaluation and a report in one command means iteration costs attention, not labour.",
    why:
      "A single training run is a guess. The first dataset is never right; the first configuration is close but not tuned; the failures only show in samples. A workflow with fast iterations and fixed decision points turns guessing into engineering. It also produces the artefacts a team needs later: versioned adapters with provenance, evaluation history, and a record of what was tried.",
    how: [
      "Freeze evaluation sets; store their hashes.",
      "Prepare the dataset; run the validation script; record the data hash.",
      "Pilot on 5% for 10 minutes; confirm memory and smooth loss.",
      "Full run with evaluation per epoch; keep the best checkpoint.",
      "Evaluate: task metrics, general suite, safety, cost and latency; compare with base, prompted strong model and the previous version.",
      "Inspect 50 failures; categorise; fix data or config; repeat until the bar is met; then version and promote.",
    ],
    visual: {
      kind: "flow",
      steps: ["freeze evals", "prepare + validate data", "10-min pilot", "full run, eval per epoch", "compare vs baselines", "inspect failures", "fix data (usually) → loop", "version + promote"],
      caption: "The arrow from 'inspect failures' back to 'prepare data' is where the model actually gets better.",
    },
    everyday: {
      title: "Drafts and editing",
      text: "No writer publishes a first draft. They write, read it as a reader would, find the weak passages, revise, and repeat until it is good; then it goes to print with a version number. A fine-tuning workflow is drafting with a training run as the draft and evaluation as the reading.",
    },
    engineering: {
      title: "Seven iterations to a release",
      text: "A team's support-reply model went through seven loops in three weeks. Iteration 1: 78% format compliance; failures were inconsistent openers → rewrote 400 outputs. Iteration 2: 91%; failures on multi-language inputs → added 300 examples. Iteration 3: 93%, but the general suite dropped 6 points → added 20% replay data and halved the learning rate. Iterations 4–6: fixed over-long answers, added refusals, tuned rank. Iteration 7: 97% format, general suite within 1 point, safety unchanged, cost a tenth of the hosted model. Each loop took half a day because training ran in 40 minutes on one GPU.",
    },
    maths: {
      formula: "iterations possible = project days × hours per day ÷ hours per loop;   quality gained ≈ Σ over iterations of (improvement from fixing the top failure category)",
      meaning: "Fast loops mean more iterations, and iterations are where quality comes from. Halving loop time roughly doubles the fixes you can make in a project.",
      worked: [
        "A 15-day project with 6 working hours a day: 90 hours.",
        "Loop time with full fine-tuning on a cluster (queue + 4-hour run + evaluation): ≈ 8 hours → 11 iterations.",
        "Loop time with LoRA on one GPU (40-minute run + evaluation): ≈ 2 hours → 45 iterations.",
        "If each iteration fixes the top failure category, the second team addresses four times as many problems in the same project.",
      ],
    },
    code: {
      title: "One command per iteration",
      lang: "bash",
      src: `#!/usr/bin/env bash
set -euo pipefail
RUN=runs/support-v$(date +%Y%m%d-%H%M)
mkdir -p "$RUN"

python scripts/validate_data.py data/support.jsonl --out "$RUN/data_report.json"   # schema, dedupe, PII, balance
python scripts/train.py --config configs/lora_default.json --data data/support.jsonl --out "$RUN"
python scripts/evaluate.py --adapter "$RUN/adapter" --tests evals/support_test.jsonl --general evals/general.jsonl --safety evals/safety.jsonl --out "$RUN/eval.json"
python scripts/report.py "$RUN" --compare runs/support-v6 --baseline base --baseline prompted
echo "report: $RUN/report.md"`,
      lines: [
        { code: "python scripts/validate_data.py data/support.jsonl --out \"$RUN/data_report.json\"   # schema, dedupe, PII, balance", say: "Data validation runs first, every time; a bad dataset never reaches training." },
        { code: "python scripts/evaluate.py --adapter \"$RUN/adapter\" --tests evals/support_test.jsonl --general evals/general.jsonl --safety evals/safety.jsonl --out \"$RUN/eval.json\"", say: "Task, general and safety evaluations on the frozen sets, in one step." },
        { code: "python scripts/report.py \"$RUN\" --compare runs/support-v6 --baseline base --baseline prompted", say: "The comparison against the previous version and the baselines: the artefact a decision is made from." },
      ],
      note: "The run directory holds config, data hash, adapter, logs, evaluation and report: everything needed to reproduce or roll back.",
    },
    useIt: "Set up the loop before the first run: frozen evals, a validation script, a one-command train-and-evaluate pipeline, and a report that compares against baselines. Then iterate on data. Expect five to ten loops; make each one fast enough to run twice a day.",
    takeaways: ["The workflow is a loop with fixed decision points; data iterations do the improving.", "Freeze evals, validate data, pilot, train, compare, inspect, fix, repeat, version.", "Loop time decides iteration count, and iteration count decides quality.", "Automate validation, training, evaluation and reporting into one command."],
    terms: [["iteration loop", "one cycle of prepare, train, evaluate and fix"], ["promotion", "marking a versioned adapter as the one to deploy"]],
    reflect: { q: "After three iterations the task metric is flat at 91% and the failures are all different. What should you do?", a: "Look harder at the failures: 'all different' usually means the categories are too fine. Group them; if they really are scattered, the remaining errors may be label noise in the test set or genuinely ambiguous cases, and the honest move is to audit the test set and accept 91% rather than keep training." },
  },

  "m24-saving-model-checkpoints": {
    simple: "Save checkpoints on a schedule and on best validation, in a standard format with the tokeniser and config, and keep adapters small and base revisions pinned; a checkpoint you cannot load or identify is worthless.",
    concept:
      "Module 20 covered checkpoints for long pretraining runs. For a custom model the concerns shift to what gets saved and how it is identified. **Saving model checkpoints** in a fine-tuning project means: the adapter (or full weights) at each evaluation point; the optimiser state if you may resume; the tokeniser alongside, because a model without its tokeniser cannot be used; the configuration and the base revision; and the evaluation results that go with that checkpoint.\n\nUse the standard safe serialisation format (safetensors) rather than pickled objects: it loads fast, cannot execute code, and is readable across frameworks. Save the best checkpoint by validation metric, not only the last; and keep a small number of them, deleting the rest, because full checkpoints are large and adapters accumulate.\n\nFor deployment, export a serving artefact: a merged model (Module 22) or the adapter plus a pinned base, converted to the serving engine's format and quantised if required, with its own evaluation run after conversion.",
    why:
      "Checkpoints are the only output of training. Lose one and the GPU hours are gone; mislabel one and nobody knows which adapter is in production; save in an unsafe format and loading it on another machine is a security risk. Deployment conversions (quantisation, format changes) can silently alter behaviour, so the serving artefact needs its own evaluation. These are small disciplines with large consequences.",
    how: [
      "Save at every evaluation point: adapter weights in safetensors, tokeniser files, config, and the metrics for that point.",
      "Keep the best-by-validation checkpoint and the last; delete intermediates after the run unless they are milestones.",
      "Save optimiser state only when resumption is likely; it doubles the size.",
      "Name checkpoints by run id and step; store the base model revision and data hash in the config next to them.",
      "Export the serving artefact; evaluate it after conversion; store it with the same identifiers.",
      "Back up to durable storage; verify checksums.",
    ],
    visual: {
      kind: "tree",
      root: "runs/support-v7/",
      children: [
        { label: "config.json (base revision, data hash, seed, all settings)" },
        { label: "checkpoint-step-250/ (adapter.safetensors, tokenizer files, metrics.json)" },
        { label: "best/ → checkpoint-step-250 (val loss 0.71, format 97%)" },
        { label: "eval.json (task, general, safety, cost, latency)" },
        { label: "serving/ (merged bf16 model, 4-bit build, post-conversion eval.json)" },
      ],
      caption: "Everything needed to reproduce, compare, roll back and deploy, in one directory with one identifier.",
    },
    everyday: {
      title: "Labelled jars in the pantry",
      text: "Preserves without labels are a guessing game a year later; labelled with contents and date, they are useful. A checkpoint without its config, tokeniser and metrics is an unlabelled jar: you know it is a model, not which one or how good.",
    },
    engineering: {
      title: "The production adapter nobody could identify",
      text: "A company's live assistant ran an adapter called 'adapter_final_v2_new'. When quality dropped after a base-model upgrade, nobody could say which base revision it had been trained on or what data; the training run directory had been cleaned up. They retrained from the dataset's last known version, re-evaluated, and introduced the rule: every adapter in production carries its run id, and the run directory with config, data hash and evaluation is retained for as long as the adapter is live.",
    },
    maths: {
      formula: "checkpoint size(adapter) = trainable params × 2 bytes (+ × 8 for optimiser state);   checkpoint size(full) = N × 2 bytes (+ × 8)",
      meaning: "Adapters are small; optimiser state multiplies the size by about five. Full checkpoints are the whole model.",
      worked: [
        "A rank-16 adapter on an 8B model with 42M parameters: 42 × 10⁶ × 2 bytes = 84 MB; with optimiser state ≈ 84 + 336 = 420 MB.",
        "A full fine-tune checkpoint of the same 8B model: 16 GB; with optimiser state ≈ 80 GB.",
        "Ten evaluation points over three epochs: adapters-only ≈ 0.84 GB total; full checkpoints ≈ 160 GB. Keeping adapters for every point is cheap; keeping full checkpoints is not.",
      ],
    },
    code: {
      title: "Saving a checkpoint with everything it needs",
      lang: "py",
      src: `import json, os

def save_checkpoint(model, tokenizer, step, metrics, config, run_dir):
    path = os.path.join(run_dir, f"checkpoint-step-{step}")
    model.save_pretrained(path, safe_serialization=True)      # adapter weights as safetensors
    tokenizer.save_pretrained(path)                           # the model is unusable without it
    json.dump(metrics, open(os.path.join(path, "metrics.json"), "w"), indent=2)
    json.dump(config, open(os.path.join(path, "config.json"), "w"), indent=2)
    if metrics["val_loss"] < best_so_far(run_dir):
        link = os.path.join(run_dir, "best")
        if os.path.islink(link):
            os.unlink(link)
        os.symlink(path, link)                                # "best" always points at the best checkpoint`,
      lines: [
        { code: "model.save_pretrained(path, safe_serialization=True)      # adapter weights as safetensors", say: "The safe format: no code execution on load, fast, portable." },
        { code: "tokenizer.save_pretrained(path)                           # the model is unusable without it", say: "The tokeniser travels with every checkpoint." },
        { code: "json.dump(config, open(os.path.join(path, \"config.json\"), \"w\"), indent=2)", say: "Base revision, data hash, seed and settings are stored next to the weights." },
        { code: "os.symlink(path, link)                                # \"best\" always points at the best checkpoint", say: "A stable name for the checkpoint to evaluate and deploy." },
      ],
    },
    useIt: "Save adapters in safetensors with tokeniser, config and metrics at every evaluation point; keep best and last; pin the base revision; export and re-evaluate the serving artefact; keep the run directory for as long as the adapter is live. Treat checkpoints as versioned releases, not files.",
    takeaways: ["A checkpoint is weights plus tokeniser plus config plus metrics, under a run id.", "Safetensors; best-by-validation and last; optimiser state only if resuming.", "Adapters are megabytes; full checkpoints are the whole model.", "The serving artefact is evaluated after conversion and stored with the same identifiers."],
    terms: [["safetensors", "a safe, fast file format for model weights that cannot execute code on load"], ["serving artefact", "the converted, possibly merged and quantised model actually deployed"]],
    reflect: { q: "Why evaluate the serving artefact separately when the checkpoint already passed evaluation?", a: "Merging, format conversion and quantisation each change the numbers slightly, and serving engines can differ in sampling and tokenisation handling. The thing users get is the artefact, so the artefact is what must pass." },
  },

  "m24-testing-model-outputs": {
    simple: "Testing outputs means reading and probing them: sampled responses across the prompt distribution, edge cases, adversarial inputs, format checks and regressions, before and alongside the metrics.",
    concept:
      "Metrics summarise; **testing model outputs** looks. After a training run, the first thing an engineer does is read: fifty responses to real prompts, side by side with the previous version's. Then probe: edge cases (empty input, very long input, mixed languages, typos), the must-never list (forbidden content, invented references, personal data), format validity on every structured output, consistency across paraphrases of the same question, and behaviour under adversarial inputs (injection attempts, jailbreak framings). Finally, regression: a fixed set of prompts whose outputs are compared with the last release, flagging any that changed materially.\n\nMuch of this can be automated into checks that run with the evaluation: schema validation, forbidden-string scans, length limits, a paraphrase-consistency test, a judge-model comparison against the previous version. But the reading is not optional; it is where new failure categories are discovered, and those become new automated checks.",
    why:
      "A model can hit every metric and still embarrass you: a single invented statute, a 'Sure!' in front of a refusal, an answer that changes when the user adds a comma. Metrics only measure what someone thought to measure. Reading finds the rest, and turning what it finds into checks means the same mistake is caught automatically next time. Testing is how the evaluation suite grows.",
    how: [
      "Read 50 sampled outputs on real prompts, comparing with the previous version; note anything odd.",
      "Run edge cases: empty, huge, mixed-language, typo-ridden, off-topic inputs.",
      "Run must-never checks: forbidden content, personal data, invented references, broken format.",
      "Run paraphrase consistency: five phrasings of twenty questions; answers should agree.",
      "Run adversarial inputs: injection and jailbreak sets.",
      "Diff against the last release on a fixed regression set; review every material change.",
      "Turn each new failure category into an automated check.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Check", "Automated?", "What it catches"],
        rows: [
          ["read 50 samples vs previous version", "no", "new failure types, tone drift"],
          ["schema and format validation", "yes", "broken JSON, missing fields"],
          ["forbidden strings and PII scan", "yes", "unsafe or leaking outputs"],
          ["paraphrase consistency", "yes (judge model)", "unstable answers"],
          ["edge-case inputs", "yes", "crashes, nonsense on empty or huge input"],
          ["adversarial sets", "yes + human review of positives", "injection, jailbreaks"],
          ["regression diff", "yes + review", "unexpected changes between versions"],
        ],
      },
      caption: "Automation runs every time; reading discovers what to automate next.",
    },
    everyday: {
      title: "Test-driving the car after the service",
      text: "The garage's checklist says everything passed. You still drive it round the block: listen, brake, turn, park. Most of the time it is fine; occasionally you hear the rattle the checklist did not cover, and next time it is on the checklist. Reading outputs is the test drive.",
    },
    engineering: {
      title: "The comma that changed the answer",
      text: "A team's paraphrase-consistency test asked a fine-tuned model 'Can I return a mattress?' and 'Can I return a mattress, please?'. The first answer was correct (unopened only); the second said yes. Twelve of 100 question pairs showed such flips. The cause was traced to training outputs that varied by phrasing, and 200 consistency-focused examples fixed it. The test now runs on every version; flips over 2% block promotion.",
    },
    maths: {
      formula: "consistency rate = question groups with all paraphrases agreeing ÷ question groups;   regression rate = prompts whose output changed materially ÷ regression prompts",
      meaning: "Two simple rates for stability. Both are compared against thresholds and against the previous version.",
      worked: [
        "100 questions × 5 paraphrases; a judge model marks agreement within each group: 88 groups agree → consistency 88%; threshold 95%: fails.",
        "After adding consistency examples: 97 groups agree → 97%: passes.",
        "Regression set of 300 prompts; 34 outputs changed materially; review finds 30 improvements and 4 regressions; the 4 are fixed before promotion.",
      ],
    },
    code: {
      title: "Automated output checks",
      lang: "py",
      src: `import json, re

FORBIDDEN = ["guaranteed refund", "as an AI language model"]
PII = re.compile(r"\\b\\d{16}\\b|[\\w.+-]+@[\\w-]+\\.[\\w.]+")

def check_output(prompt, output, schema=None):
    problems = []
    if schema:
        try:
            data = json.loads(output)
            missing = [k for k in schema["required"] if k not in data]
            if missing:
                problems.append("missing: " + ", ".join(missing))
        except json.JSONDecodeError:
            problems.append("invalid JSON")
    low = output.lower()
    problems += ["forbidden: " + f for f in FORBIDDEN if f in low]
    if PII.search(output):
        problems.append("possible PII")
    if len(output) > 2500:
        problems.append("too long")
    return problems`,
      lines: [
        { code: "FORBIDDEN = [\"guaranteed refund\", \"as an AI language model\"]", say: "Phrases that must never appear, collected from past failures." },
        { code: "problems.append(\"invalid JSON\")", say: "For structured outputs, parse failure is a hard fail." },
        { code: "if PII.search(output):", say: "Card-like digit runs and email addresses in an output are a leak until proven otherwise." },
      ],
      note: "Run on every evaluation output; any problem on the must-never list blocks promotion.",
    },
    useIt: "After every run, read fifty outputs against the last version, then run the automated checks: format, forbidden content, personal data, length, paraphrase consistency, edge cases, adversarial sets, regression diff. Convert every new failure type into a check, so the suite grows with the project.",
    takeaways: ["Metrics summarise; reading discovers.", "Checks: format, must-never, PII, length, consistency, edge cases, adversarial, regression.", "Automate what can be automated; keep reading to find the next check.", "Failures from testing become permanent checks."],
    terms: [["paraphrase consistency", "whether the model gives the same answer to differently worded versions of a question"], ["regression set", "fixed prompts whose outputs are compared between versions"]],
    reflect: { q: "The regression diff shows 30 improvements and 4 regressions. Should the version be promoted?", a: "Not yet. Four known regressions are four customers who will meet them; fix them (usually with targeted examples) and re-run. Promotion with known regressions is only acceptable if they are minor, documented, and outweighed by a critical fix elsewhere." },
  },

  "m24-evaluating-model-quality": {
    simple: "Model quality is a scorecard, not a number: task metrics, general ability, safety, consistency, cost and latency, each on frozen sets, compared with baselines, with a bar for promotion.",
    concept:
      "The final lesson of the stage pulls the measurements together. **Evaluating model quality** for a custom model means a scorecard with several rows, each from a frozen evaluation set: the **task metrics** (accuracy, F1, format compliance, rubric scores); the **general-ability suite** for forgetting; **safety** (harmful compliance, over-refusal, jailbreak success); **consistency** and **regression** rates; **cost per request** and **latency** on the serving artefact. Each row has a baseline (the base model with a good prompt, a strong prompted model, the previous version) and a threshold.\n\nThe decision to promote is made from the scorecard, not from any single row. A version that gains three points on the task and loses six on the general suite is not promoted; one that matches the hosted model at a tenth of the cost is, even at equal quality. The scorecard is versioned with the model and becomes the history that shows whether the project is improving.\n\nStatistical care matters: test sets of a few hundred items have margins of several points (Module 21), so differences within the margin are not improvements. Where possible use larger sets, paired comparisons, and a judge calibrated against humans.",
    why:
      "Without a scorecard, teams optimise the one number they look at and are surprised by everything else: a brilliant classifier that stopped refusing, a cheaper model that answers slowly, a fine-tune that beat the base and lost to a better prompt. The scorecard forces every dimension onto the table at once, with baselines, so the promotion decision is honest and the trade-offs are visible. It also gives the project a memory.",
    how: [
      "Define the rows and thresholds before training: task, general, safety, consistency, regression, cost, latency.",
      "Build or reuse a frozen set per row; record sizes and margins of error.",
      "Evaluate every candidate on every row, plus the baselines on the same rows.",
      "Fill the scorecard; flag any row below threshold or materially worse than the previous version.",
      "Decide: promote, iterate, or stop; record the decision and the scorecard with the version.",
      "Revisit thresholds as the product matures; raise bars that are comfortably cleared.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Row", "Set size", "Base + prompt", "Strong hosted", "Previous (v6)", "Candidate (v7)", "Threshold", "Verdict"],
        rows: [
          ["format compliance", "500", "81%", "97%", "95%", "97%", "≥ 95%", "pass"],
          ["answer quality (rubric)", "300", "3.4/5", "4.3/5", "4.0/5", "4.2/5", "≥ 4.0", "pass"],
          ["general suite", "200", "71%", "80%", "69%", "70%", "≥ 68%", "pass"],
          ["harmful compliance", "500", "2.0%", "0.4%", "0.8%", "0.7%", "≤ 1.5%", "pass"],
          ["over-refusal", "300", "1%", "2%", "3%", "2%", "≤ 3%", "pass"],
          ["paraphrase consistency", "100 groups", "84%", "96%", "93%", "97%", "≥ 95%", "pass"],
          ["cost per 1k requests", "—", "$0.90", "$4.20", "$0.35", "$0.35", "≤ $0.50", "pass"],
          ["p95 latency", "—", "2.1 s", "2.8 s", "1.2 s", "1.2 s", "≤ 1.5 s", "pass"],
        ],
      },
      caption: "Every row passes and the candidate beats the previous version where it matters: promote v7. One failing row would have sent it back.",
    },
    everyday: {
      title: "A school report, not a single grade",
      text: "A report card lists every subject with a grade and the class average. A child who improved in maths but stopped attending sport is not simply 'doing better'. The scorecard is the model's report card, and promotion is the decision a parent would make reading the whole thing.",
    },
    engineering: {
      title: "The row that blocked a release",
      text: "A candidate model improved rubric quality from 4.0 to 4.3, which would have been shipped under the old process. The scorecard showed over-refusal at 7% against a threshold of 3%: the new preference data had been one-sided. One more iteration with benign look-alike pairs brought over-refusal to 2% while keeping quality at 4.2. The release went out a week later than it might have, and support tickets about 'the bot refuses everything' never arrived.",
    },
    maths: {
      formula: "margin ≈ 1.96 × √(p(1 − p) ÷ n);   two versions differ significantly only if |p₁ − p₂| exceeds roughly √(margin₁² + margin₂²)",
      meaning: "Each rate has sampling error; a difference between versions must exceed the combined error to be real. Paired comparisons on the same items reduce the error.",
      worked: [
        "Format compliance 95% vs 97% on 500 items: margins ≈ 1.96 × √(0.95 × 0.05 ÷ 500) ≈ 0.019 and ≈ 0.015; combined ≈ 0.024. The 2-point gap is within noise: call it 'at least as good', not 'better'.",
        "Consistency 93% vs 97% on 100 groups: margins ≈ 0.050 and 0.033; combined ≈ 0.06. Also within noise; the set is too small to prove the gain.",
        "To show a 2-point gain on a 95% rate with confidence you need about 2,000 items per version; or use a paired test on the same items, which usually needs far fewer.",
      ],
    },
    useIt: "Keep a scorecard template with rows, sets, baselines and thresholds; fill it for every candidate; promote only when every row clears its bar and the candidate is at least as good as the previous version where it counts. Report margins, and do not claim gains inside them. The scorecard is the stage's final deliverable and the next stage's starting point.",
    takeaways: ["Quality is a scorecard: task, general, safety, consistency, regression, cost, latency.", "Frozen sets, baselines and thresholds for every row, decided before training.", "Promote only on the whole scorecard; one failing row blocks.", "Respect margins of error; small test sets cannot prove small gains."],
    terms: [["scorecard", "the table of evaluation rows, baselines and thresholds a promotion decision is made from"], ["paired comparison", "evaluating two versions on the same items so their difference has less noise"]],
    reflect: { q: "The candidate equals the previous version on every row but costs a third as much. Promote?", a: "Yes, provided 'equals' means within margins on frozen sets and the serving artefact was the thing measured. Cost and latency are rows on the scorecard for exactly this reason: equal quality at lower cost is a real improvement." },
  },
};

export const M24_QUIZ: Quiz[] = [
  {
    q: "What should decide the choice of base model?",
    options: ["The public leaderboard rank alone", "Constraints (licence, serving hardware, languages, context) plus a bake-off on your own evaluation and a short pilot", "The largest model available", "The model with the most downloads"],
    answer: 1,
    why: ["The leaderboard is only a filter.", "Correct. Your test set ranks models for your task; constraints decide what you can ship.", "Serving cost scales with size; pick the strongest you can serve.", "Popularity is not fit."],
    reason: true,
  },
  {
    q: "Your Punjabi text costs 4.5 tokens per word on the chosen base's tokeniser. What are the consequences and options?",
    options: ["No consequences; tokens are free", "Three times the cost and a third of the context compared with a fitting tokeniser; choose another base or extend the vocabulary with continued pretraining", "Train a new tokeniser and keep the weights", "Lower the temperature"],
    answer: 1,
    why: ["Tokens are cost and context.", "Correct. Fit is measured on your corpus; the fixes are another base or vocabulary extension.", "New tokens have no embeddings; the weights do not transfer without training.", "Sampling does not change tokenisation."],
  },
  {
    q: "Why freeze the evaluation sets before building training data?",
    options: ["To make training faster", "So training data can be decontaminated against them and no test item leaks in through shared sources", "Because evaluation sets must be larger", "It does not matter"],
    answer: 1,
    why: ["Speed is unaffected.", "Correct. A leaked test set makes every reported number meaningless.", "Size is separate.", "Order is the whole point."],
  },
  {
    q: "Which objective fits each dataset: domain text, SFT pairs, preference pairs?",
    options: ["DPO for all three", "Next-token over all tokens; next-token with prompt mask; DPO", "Masked next-token for all three", "Cross-entropy on a classification head for all three"],
    answer: 1,
    why: ["DPO needs chosen/rejected pairs.", "Correct. Each dataset teaches something different and needs the matching loss.", "Masking the prompt on domain text wastes half the data.", "A classification head is for labels."],
  },
  {
    q: "A team wants to redesign the layers of a 7B base they will initialise from pretrained weights. What is wrong?",
    options: ["Nothing; this is normal", "Pretrained weights only fit the architecture they were trained in; changing layers discards them. The real choices are what to attach: LoRA targets, heads, vocabulary, context", "Layers cannot be changed in any model", "They need a bigger GPU"],
    answer: 1,
    why: ["It cannot work with inherited weights.", "Correct. Architecture is inherited from the base; design from scratch only when training from scratch.", "They can be changed when training from scratch.", "Hardware is not the issue."],
    reason: true,
  },
  {
    q: "A full fine-tune at learning rate 5e-4 diverged to NaN. What is the right response?",
    options: ["Double the learning rate", "Run 10-minute pilots at a few lower rates with warm-up, pick by validation loss, then rerun", "Remove gradient clipping", "Switch to fp16"],
    answer: 1,
    why: ["That makes divergence worse.", "Correct. The rate was too high; pilots find the stable value cheaply.", "Clipping prevents spikes.", "fp16 is less stable than bf16."],
  },
  {
    q: "What must be saved with a checkpoint for it to be usable and identifiable?",
    options: ["Only the weights", "Weights in safetensors, the tokeniser, the config with base revision and data hash, and the metrics", "The training data", "The GPU"],
    answer: 1,
    why: ["Weights without a tokeniser and provenance are an unlabelled jar.", "Correct. Everything needed to load, reproduce and compare.", "Data is referenced by hash, not copied.", "No."],
  },
  {
    q: "The candidate gains 3 points on the task and loses 6 on the general suite. Promote?",
    options: ["Yes, the task is what matters", "No; the scorecard has a failing row, and the loss is likely forgetting to fix with replay data and gentler training", "Yes, if cost is lower", "Only if the test set is small"],
    answer: 1,
    why: ["Users meet the general failures too.", "Correct. One failing row blocks promotion; iterate.", "Cost does not excuse a regression beyond threshold.", "Small sets make the gain less certain, not the loss more acceptable."],
  },
];

export const M24_EXERCISES: Exercise[] = [
  {
    title: "Run a paper bake-off",
    kind: "think",
    task: "Three candidate bases: A (13B, permissive licence, English-heavy data, 8k context); B (8B, licence forbids redistributing adapters, multilingual data, 32k context); C (3B, permissive, multilingual, 8k context). The product: a Punjabi-English support assistant served on one 24 GB GPU with adapters shipped to customers. Rank them and justify, stating which constraint eliminates any candidate outright.",
    hints: ["Check licence first.", "Check tokeniser fit for Punjabi (multilingual data is a proxy).", "Check serving memory."],
    solution: "B is eliminated outright: the licence forbids redistributing adapters, which the product requires. A: strong, but English-heavy data suggests poor Punjabi tokenisation and knowledge, and 13B in 4-bit (≈ 6.5 GB + cache) fits a 24 GB card but with less headroom. C: multilingual data (likely good Punjabi fit), permissive, small and cheap to serve, but may lack capacity. Ranking: run the bake-off between A and C on the Punjabi test set; expect C to win on tokeniser efficiency and A on English reasoning. If C's quality after a LoRA pilot clears the bar, choose C for cost; otherwise A with vocabulary extension for Punjabi. Context of 8k is sufficient for support.",
  },
  {
    title: "Compute the schedule",
    kind: "calculate",
    task: "You have 6,400 examples, an effective batch of 32 and 2 epochs, peak learning rate 2e-4, warm-up 3%, cosine decay to a floor of 10% of the peak. Compute total steps, warm-up steps, the learning rate at step 100 (during warm-up) and at step 300.",
    hints: ["Steps per epoch = examples ÷ batch.", "Warm-up is linear from 0 to peak.", "After warm-up, lr = floor + (peak − floor) × 0.5 × (1 + cos(π × progress)) where progress runs 0→1 over the decay steps."],
    solution: "Steps per epoch = 6,400 ÷ 32 = 200; total = 400 steps. Warm-up = 0.03 × 400 = 12 steps. Step 100 is after warm-up (12 steps), so it is in decay: progress = (100 − 12) ÷ (400 − 12) ≈ 0.227; cos(0.227π) ≈ 0.755; lr = 2e-5 + 1.8e-4 × 0.5 × 1.755 ≈ 2e-5 + 1.58e-4 ≈ 1.78e-4. Step 300: progress ≈ (300 − 12) ÷ 388 ≈ 0.742; cos(0.742π) ≈ −0.700; lr = 2e-5 + 1.8e-4 × 0.5 × 0.300 ≈ 2e-5 + 2.7e-5 ≈ 4.7e-5. (A step inside warm-up, say step 6, would be 6 ÷ 12 × 2e-4 = 1e-4.)",
  },
  {
    title: "Write the iteration script's evaluate step",
    kind: "code",
    task: "Write Python for evaluate.py that loads an adapter over a pinned base, runs a frozen task test set and a frozen safety set, applies the automated output checks from lesson 9, computes format compliance, accuracy, harmful-compliance rate and over-refusal rate, and writes eval.json. Include a margin of error for each rate.",
    hints: ["Rates: count ÷ n; margin = 1.96 × sqrt(p(1−p)/n).", "Harmful compliance: a classifier or judge over the safety set's harmful prompts; over-refusal: a refusal detector over benign look-alikes."],
    solution: "import json, math\n\ndef rate(k, n):\n    p = k / n if n else 0.0\n    return {'rate': p, 'margin': 1.96 * math.sqrt(p * (1 - p) / n) if n else None, 'n': n}\n\nmodel = load_base_with_adapter(BASE, BASE_REV, ADAPTER)\ntask = [json.loads(l) for l in open('evals/support_test.jsonl')]\nsafety = [json.loads(l) for l in open('evals/safety.jsonl')]\n\nfmt_ok = acc = 0\nfor item in task:\n    out = generate(model, item['prompt'])\n    problems = check_output(item['prompt'], out, schema=item.get('schema'))\n    if 'invalid JSON' not in problems and not any(p.startswith('missing') for p in problems):\n        fmt_ok += 1\n    if matches_expected(out, item['expected']):\n        acc += 1\n\nharm = sum(is_harmful(generate(model, s['prompt'])) for s in safety if s['kind'] == 'harmful')\nrefuse = sum(is_refusal(generate(model, s['prompt'])) for s in safety if s['kind'] == 'benign')\nn_h = sum(s['kind'] == 'harmful' for s in safety); n_b = sum(s['kind'] == 'benign' for s in safety)\n\nresult = {\n    'format_compliance': rate(fmt_ok, len(task)),\n    'accuracy': rate(acc, len(task)),\n    'harmful_compliance': rate(harm, n_h),\n    'over_refusal': rate(refuse, n_b),\n    'base': BASE, 'base_revision': BASE_REV, 'adapter': ADAPTER,\n}\njson.dump(result, open(OUT, 'w'), indent=2)",
  },
  {
    title: "Fill and judge a scorecard",
    kind: "think",
    task: "Candidate v8 vs previous v7 on frozen sets: format 96% vs 97% (n = 500); rubric 4.4 vs 4.2 (n = 300); general suite 70% vs 70% (n = 200); harmful compliance 0.6% vs 0.7% (n = 500); over-refusal 4% vs 2% (n = 300, threshold ≤ 3%); consistency 96% vs 97% (100 groups); cost $0.30 vs $0.35 per 1k; p95 latency 1.1 s vs 1.2 s. Using the margins, decide whether to promote and say what you would do next.",
    hints: ["Compute margins for the rates that moved.", "Check every row against its threshold.", "Only differences beyond combined margins count."],
    solution: "Format: 96% vs 97% on 500 items has margins ≈ 1.7 and 1.5 points; the 1-point drop is noise. Rubric: 4.4 vs 4.2 on 300 items is likely a real gain (a paired test would confirm). General: unchanged. Harmful compliance: unchanged within noise. Over-refusal: 4% exceeds the 3% threshold, and the rise from 2% on 300 items (margins ≈ 2.2 and 1.6 points) is borderline but the threshold is breached. Consistency: within noise. Cost and latency: improved. Verdict: do not promote; the over-refusal row fails. Next: add benign look-alike pairs (or examples) targeting the new refusals, retrain, re-evaluate; if over-refusal returns to ≤ 3% with the rubric gain and cost saving intact, promote v9.",
  },
];
