import type { Exercise, LessonBody, Quiz } from "../types";

// Module 45: Building Punjabi AI models. One concept per lesson.
// Keys are lesson slugs: m45-<kebab of the concept title in map.ts>.

export const M45_BODIES: Record<string, LessonBody> = {
  "m45-evaluating-existing-multilingual-models": {
    simple: "Before building anything, measure the models that already exist on Punjabi tasks, per script, with the same harness, so every later decision starts from numbers.",
    concept:
      "Several families of models claim Punjabi: large hosted chat models, open-weight multilingual models, translation models trained on Indic languages, and multilingual encoders for classification and embeddings. **Evaluating existing models** means running all the candidates through one harness on the tasks your product needs, in Gurmukhi, Shahmukhi and Romanised Punjabi, and reading the table before choosing.\n\nThe harness has three parts: task sets (translation pairs, labelled classification examples, question–answer pairs with context, retrieval queries with relevant documents), scorers suited to each task (chrF for translation, accuracy and F1 for classification, character-level F1 for extractive answers, recall for retrieval, a calibrated judge for free-form answers), and a fixed prompt or fine-tuning recipe per model so the comparison is fair.\n\nThe result is a table: rows are models, columns are tasks × scripts, cells are scores with sample sizes. It usually shows that no single model wins everywhere: one translates Gurmukhi best, another classifies code-switched text best, a third is the only one that reads Shahmukhi as Punjabi rather than Urdu.",
    why:
      "Choosing a model by reputation wastes the scarcest thing a Punjabi project has: the time of native speakers. The harness is built once and reused for every model release, every prompt change and every fine-tune. It turns 'which model is best for Punjabi?' into a query over a table, and it reveals that the answer differs by script and task, which changes the architecture: a product may route Shahmukhi to one model and Gurmukhi to another.",
    how: [
      "Define the tasks the product needs and gather 200–500 examples per task per script from the gold sets built in module 44.",
      "Pick the scorer per task; for free-form generation use a judge model with a Punjabi rubric, calibrated against human grades (lesson 45.12).",
      "Write one prompt template per task, with the output language and script stated; use it unchanged for every chat model.",
      "Run every candidate; record scores, latency, tokens per example and cost per 1,000 examples.",
      "Read the table by column: the best model per task and script, and the gap to the next. Decide routing, fine-tuning and data collection from it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model (illustrative)", "Translate pa→en chrF (Guru)", "Classify intent acc. (Guru)", "Classify intent acc. (Latn)", "QA F1 (Guru)", "Reads Shahmukhi as Punjabi?", "Cost / 1k"],
        rows: [
          ["hosted chat model A", "58", "84%", "71%", "67", "partly (drifts to Urdu)", "£3.10"],
          ["hosted chat model B", "61", "79%", "68%", "70", "yes", "£5.40"],
          ["open-weight 8B multilingual", "49", "72%", "55%", "58", "no", "£0.40 (own GPU)"],
          ["Indic translation model", "66", "n/a", "n/a", "n/a", "yes (pnb_Arab)", "£0.15"],
          ["multilingual encoder, fine-tuned", "n/a", "89%", "81%", "n/a", "with Punjabi data", "£0.05"],
        ],
      },
      caption: "No row wins every column. The product routes by task and script. Numbers are illustrative of the pattern, not a ranking of real products.",
    },
    everyday: {
      title: "Test-driving three cars on the same road",
      text: "Nobody buys a car from the brochure alone; they drive the three shortlisted ones on the same road, with the same passengers, and compare. One is quiet on the motorway and useless on village tracks; another is the reverse. A model harness is the same road for every model, and Punjabi's village tracks are Shahmukhi and Romanised input.",
    },
    engineering: {
      title: "The evaluation that changed the architecture",
      text: "A Punjabi government-services assistant was to be built on one hosted model. The harness, built in three weeks with 400 examples per task per script, showed: the chosen model answered Gurmukhi questions well (judge score 7.8/10) but replied to Shahmukhi questions in Urdu 40% of the time (5.1/10), while a competitor handled Shahmukhi properly (7.2/10) but cost 70% more. A dedicated Indic translation model beat both on translation by 8 chrF points. The final design routed by script and task across three models, cost 20% less than the single-model plan, and had the harness as its regression test from day one.",
    },
    maths: {
      formula: "chrF = (1 + β²) · P · R ÷ (β² · P + R),  with character n-gram precision P and recall R, β = 2",
      meaning: "chrF scores translation by overlapping character n-grams between output and reference, weighting recall twice as much as precision. It suits Punjabi better than word-based BLEU because spelling variants and morphology still share most characters.",
      worked: [
        "Reference: ਮੇਰਾ ਆਰਡਰ ਲੇਟ ਹੈ. Output: ਮੇਰਾ ਆਰਡਰ ਦੇਰ ਨਾਲ ਹੈ (a valid paraphrase). Suppose character 1–6-gram precision P = 0.62 and recall R = 0.58 after averaging.",
        "chrF = (1 + 4) × 0.62 × 0.58 ÷ (4 × 0.62 + 0.58) = 5 × 0.3596 ÷ (2.48 + 0.58) = 1.798 ÷ 3.06 ≈ 0.588 → 58.8.",
        "A word-level BLEU for the same pair would be near zero (only ਮੇਰਾ, ਆਰਡਰ and ਹੈ match as whole words); chrF credits the shared characters and the paraphrase.",
        "Report chrF over the whole test set, per direction and per script, with the reference set's version.",
      ],
    },
    code: {
      title: "A minimal harness: translation and classification per script",
      lang: "py",
      src: `from sacrebleu.metrics import CHRF
chrf = CHRF()

def eval_translation(model, pairs):            # pairs: list of (source, reference)
    outputs = [model.translate(src) for src, _ in pairs]
    refs = [[ref for _, ref in pairs]]
    return chrf.corpus_score(outputs, refs).score

def eval_classification(model, items):        # items: list of (text, label)
    correct = sum(1 for text, label in items if model.classify(text) == label)
    return correct / len(items)

table = {}
for name, model in candidates.items():
    table[name] = {}
    for script in ["guru", "arab", "latn"]:
        table[name][("translate", script)] = round(eval_translation(model, translation_sets[script]), 1)
        table[name][("intent", script)] = round(eval_classification(model, intent_sets[script]), 3)

for name, scores in table.items():
    print(name, scores)`,
      lines: [
        { code: "chrf = CHRF()", say: "sacrebleu's chrF implementation: the standard scorer for Indic translation, character-based." },
        { code: "return chrf.corpus_score(outputs, refs).score", say: "Corpus-level chrF over the whole set, not an average of sentence scores." },
        { code: "for script in [\"guru\", \"arab\", \"latn\"]:", say: "Every task is run three times, once per script. The cells are what tell you where each model fails." },
        { code: "table[name][(\"intent\", script)] = round(eval_classification(model, intent_sets[script]), 3)", say: "Accuracy per script. Add latency and cost columns from the same loop." },
      ],
      note: "Each model's translate() and classify() wrap its own prompt or pipeline; the prompts are fixed per task and stored with the harness.",
    },
    useIt: "Build the harness before choosing a model and keep it as the regression suite. Run it on every candidate, every release and every prompt or fine-tuning change. Decide routing per script and task from its table, and quote its numbers, with sample sizes, in every claim about Punjabi support.",
    takeaways: ["Measure every candidate model on your tasks, per script, with one harness.", "Use task-appropriate scorers: chrF for translation, accuracy/F1 for classification, character F1 for extraction, calibrated judges for prose.", "No model wins everywhere; route by task and script.", "The harness is the regression suite for everything that follows."],
    terms: [["evaluation harness", "the fixed set of tasks, scorers and prompts used to compare models"], ["chrF", "a character n-gram F-score for translation quality, well suited to Indic scripts"], ["routing by script", "sending Gurmukhi, Shahmukhi and Romanised requests to different models"]],
    reflect: { q: "A model scores best on Gurmukhi translation and worst on Shahmukhi classification. Does the product use it?", a: "For Gurmukhi translation, yes; for Shahmukhi classification, no. Routing by task and script is normal. The harness exists so that the answer is 'use it here, not there' rather than one global choice." },
  },

  "m45-punjabi-tokeniser-analysis": {
    simple: "Tokeniser analysis measures how a candidate model cuts Punjabi: tokens per word, whether it splits inside syllables, and how it treats each script, because that decides cost, context and part of quality.",
    concept:
      "Lesson 43.3 introduced fertility; **tokeniser analysis** is the fuller inspection you run on every candidate model. Three measurements. Fertility per script: tokens per word on Gurmukhi, Shahmukhi and Romanised samples drawn from real traffic. Cluster integrity: how often a token boundary falls inside a grapheme cluster, splitting a consonant from its vowel sign or nukta, which forces the model to spell Punjabi at the mark level. Vocabulary coverage: what share of the thousand most frequent Punjabi words are single tokens, and how many fall back to byte pieces.\n\nAlso worth a look: how the tokeniser treats the danda (।), Gurmukhi digits, and mixed-script messages, and whether Shahmukhi tokens are shared with Urdu (they will be). The analysis is cheap, needs no GPU, and predicts cost exactly and quality roughly.",
    why:
      "A tokeniser that needs 4.5 tokens per Gurmukhi word makes Punjabi three to four times more expensive than English, halves the usable context, and gives the model a representation built from shards. These effects are invisible in a demo and dominant in production. Running the analysis first can rule a model out in an hour, before a single evaluation example is labelled.",
    how: [
      "Collect 2,000 real sentences per script from the cleaned corpus and from product logs.",
      "For each candidate tokeniser, tokenise every sentence; compute tokens per word and bytes per token per script.",
      "Detect boundaries inside grapheme clusters: tokenise, decode each token, and check whether any token starts with a combining mark.",
      "Compute coverage: the share of the top-1,000 words that are a single token.",
      "Tabulate per model and script; set a threshold (fertility under 2.5, cluster splits under 5%) for models to proceed to the full harness.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Tokeniser (illustrative)", "Fertility Guru", "Fertility Arab", "Fertility Latn", "Cluster splits (Guru)", "Top-1k single-token (Guru)"],
        rows: [
          ["English-centric byte BPE, 50k vocab", "4.6", "2.8", "1.9", "38%", "3%"],
          ["multilingual, 128k vocab", "2.3", "1.9", "1.8", "9%", "41%"],
          ["multilingual, 256k vocab", "1.7", "1.6", "1.7", "4%", "63%"],
          ["Indic-specialised", "1.3", "1.5", "1.9", "1%", "82%"],
        ],
      },
      caption: "Fertility and cluster splits fall as vocabulary and Indic coverage grow. Romanised fertility barely changes because it borrows English pieces either way.",
    },
    everyday: {
      title: "Counting syllables with the wrong rules",
      text: "Ask someone who knows only English to count the syllables in ਪੰਜਾਬੀ. They will guess from the marks and get it wrong, because the rules they know do not apply. A tokeniser trained on English applies English rules to Gurmukhi and gets pieces that no Punjabi speaker would recognise as units. Tokeniser analysis is checking whether the tokeniser knows the rules of the script before you trust it with the language.",
    },
    engineering: {
      title: "The model ruled out in an afternoon",
      text: "A team shortlisted three open-weight models for a Gurmukhi assistant. Tokeniser analysis on 2,000 support messages showed fertility of 4.4, 2.1 and 1.5, and cluster-split rates of 35%, 7% and 2%. The first model would have cost three times the third per message and truncated long answers at the same output limit. It was dropped before any GPU time was spent. The remaining two went to the full harness; the one with fertility 1.5 also scored 6 points higher on generation quality, which the team attributed in part to never having to assemble syllables from marks.",
    },
    maths: {
      formula: "cluster split rate = tokens that begin with a combining mark ÷ total tokens;   effective context (words) = context window (tokens) ÷ fertility",
      meaning: "The split rate shows how often the tokeniser cuts inside a visual syllable. Dividing the context window by fertility gives how many Punjabi words actually fit.",
      worked: [
        "Model with 8,000-token context and Gurmukhi fertility 4.6: effective context ≈ 8,000 ÷ 4.6 ≈ 1,740 Punjabi words. English at fertility 1.3 fits ≈ 6,150 words in the same window.",
        "Model with 128,000-token context and fertility 1.7: ≈ 75,000 Punjabi words. The window is large enough that fertility matters mostly for cost.",
        "Split rate: 2,000 sentences, 31,000 tokens, 11,800 of them starting with a vowel sign, nukta, addak or bindi → 38%. The model is spelling Punjabi at the mark level for more than a third of its tokens.",
      ],
    },
    code: {
      title: "Fertility, cluster splits and coverage per script",
      lang: "py",
      src: `import unicodedata
from collections import Counter
from transformers import AutoTokenizer

def is_combining(ch):
    return unicodedata.category(ch) in ("Mn", "Mc")      # non-spacing and spacing marks (vowel signs, nukta, bindi)

def analyse(tokeniser_name, sentences, top_words):
    tok = AutoTokenizer.from_pretrained(tokeniser_name)
    n_tokens = n_words = splits = 0
    for s in sentences:
        ids = tok.encode(s, add_special_tokens=False)
        pieces = [tok.decode([i]) for i in ids]
        n_tokens += len(ids)
        n_words += len(s.split())
        splits += sum(1 for p in pieces if p and is_combining(p.lstrip(" ")[:1] or " "))
    single = sum(1 for w in top_words if len(tok.encode(w, add_special_tokens=False)) == 1)
    return {"fertility": round(n_tokens / n_words, 2), "cluster_splits": round(splits / n_tokens, 3), "top1k_single": round(single / len(top_words), 2)}

for name in candidate_tokenisers:
    for script, sents in samples.items():
        print(name, script, analyse(name, sents, top_words[script]))`,
      lines: [
        { code: "return unicodedata.category(ch) in (\"Mn\", \"Mc\")      # non-spacing and spacing marks (vowel signs, nukta, bindi)", say: "Unicode categories identify combining marks in any script; a token that begins with one was cut from its base letter." },
        { code: "pieces = [tok.decode([i]) for i in ids]", say: "Decode each token on its own to see what piece of text it represents." },
        { code: "splits += sum(1 for p in pieces if p and is_combining(p.lstrip(\" \")[:1] or \" \"))", say: "Count tokens that start with a mark: the cluster-split rate." },
        { code: "single = sum(1 for w in top_words if len(tok.encode(w, add_special_tokens=False)) == 1)", say: "Coverage: how many of the most frequent words are one token." },
      ],
      note: "Use real sentences from your traffic, not Wikipedia; chat text has different words, spellings and mixing.",
    },
    useIt: "Run tokeniser analysis on every candidate before anything else; drop models with Gurmukhi fertility above about 2.5 or cluster splits above 5–10% unless you will extend the vocabulary (lesson 43.6). Use the fertility ratio in cost and context planning, and re-run the analysis whenever a provider updates a tokeniser.",
    takeaways: ["Measure fertility, cluster splits and top-word coverage per script for every candidate.", "Cluster splits mean the model spells Punjabi at the mark level; avoid or fix with vocabulary extension.", "Effective context in words is the window divided by fertility.", "The analysis is cheap and can rule models out before evaluation."],
    terms: [["cluster split", "a token boundary inside a grapheme cluster"], ["vocabulary coverage", "the share of frequent words that are single tokens"], ["effective context", "how many words of a language fit in the context window"]],
    reflect: { q: "Romanised fertility is similar across all tokenisers in the table. Why, and does that make Romanised Punjabi cheap?", a: "Romanised text is Latin letters, which every tokeniser covers with English subwords, so the count barely changes. It is cheap in tokens but poorly represented in meaning: the pieces are English fragments with English vectors, which is why Romanised quality is lowest despite low cost." },
  },

  "m45-punjabi-text-classification": {
    simple: "Punjabi text classification assigns labels to Punjabi text; the reliable recipe is a multilingual encoder fine-tuned on a few thousand labelled examples per script, compared against a prompted model on the same test set.",
    concept:
      "**Text classification** maps a piece of text to one of a fixed set of labels: intent (order status, refund, complaint), topic, urgency, language, spam. For Punjabi there are two practical routes. A prompted large model: describe the labels, give examples, ask for structured output (module 27); it needs no training data and handles Gurmukhi reasonably, Romanised less well. A fine-tuned encoder: take a multilingual encoder that covers Gurmukhi, add a classification head, and train on labelled examples; it is small, fast, cheap and usually more accurate once a few thousand labels exist, and it learns Romanised and code-switched forms if they are in the data.\n\nThe choice is empirical: evaluate both on the same per-script test set (lesson 44.14), with F1 per class, not just accuracy, because the interesting classes (complaints, urgent) are rare. Most teams start with the prompted model to launch, label the resulting traffic, and switch to the fine-tuned encoder when it wins.",
    why:
      "Classification is the workhorse of Punjabi products: routing support messages, tagging feedback, detecting language and script, filtering abuse. It is also where labelled Punjabi data pays off fastest, because a few thousand examples turn a mediocre prompted result into a strong, cheap model. Getting it right unlocks the rest: the right route, the right language, the right model.",
    how: [
      "Define the label set with guidelines and a gold test set per script (module 44).",
      "Baseline with a prompted model: labels described, two examples per label, structured output, temperature 0; score per script and class.",
      "Fine-tune a multilingual encoder with a classification head on the labelled training set; validate; score on the same test set.",
      "Compare F1 per class per script, cost and latency; pick per route or combine (encoder first, prompted model for low-confidence cases).",
      "Keep labelling production traffic, especially misclassified and low-confidence messages, and retrain monthly.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Prompted large model", points: ["No training data needed", "Good on Gurmukhi, weaker on Romanised", "Slow and costly per message", "Hard to guarantee consistent labels"] },
      right: { title: "Fine-tuned multilingual encoder", points: ["Needs ~2,000+ labelled examples", "Learns Romanised and code-switched forms from data", "Milliseconds, fractions of a penny", "Stable labels; confidence scores for routing"] },
      caption: "Launch with the left, label traffic, move to the right. Keep both for the low-confidence tail.",
    },
    everyday: {
      title: "Sorting the post",
      text: "A new clerk sorts letters by reading each one carefully and asking a supervisor about the odd ones (the prompted model). After a month of seeing thousands of letters, they sort at a glance and only ask about the genuinely strange ones (the fine-tuned encoder with a confidence threshold). The second clerk is faster, cheaper and more consistent, and still has someone to ask.",
    },
    engineering: {
      title: "Routing 40,000 Punjabi support messages a month",
      text: "A telecom's Punjabi support queue needed intent routing across 14 intents. A prompted model launched at 81% accuracy on Gurmukhi and 66% on Romanised, costing about £0.004 per message. Over two months the team labelled 9,000 messages (stratified by script) with two annotators (kappa 0.86). A fine-tuned multilingual encoder reached 90% on Gurmukhi and 83% on Romanised, at under £0.0001 per message, with macro-F1 of 0.86 against the prompted model's 0.74; the rare 'legal threat' class went from F1 0.41 to 0.79. Messages under 0.6 confidence (7%) still go to the prompted model; everything else is routed in milliseconds.",
    },
    maths: {
      formula: "precision = TP ÷ (TP + FP);  recall = TP ÷ (TP + FN);  F1 = 2PR ÷ (P + R);  macro-F1 = mean of per-class F1",
      meaning: "Per-class F1 shows how each label performs; macro-F1 averages them so rare classes count as much as common ones, which accuracy hides.",
      worked: [
        "Class 'legal threat' in a 1,000-message test set: 40 true cases. Model flags 50, of which 30 are correct. TP = 30, FP = 20, FN = 10.",
        "Precision = 30 ÷ 50 = 0.60; recall = 30 ÷ 40 = 0.75; F1 = 2 × 0.60 × 0.75 ÷ 1.35 ≈ 0.667.",
        "Accuracy over all 1,000 messages could be 90% while this class's F1 is 0.67, because the class is 4% of the data.",
        "Macro-F1 over 14 classes = average of the 14 F1 values; a rare class at 0.41 pulls it down visibly, which is the point.",
      ],
    },
    code: {
      title: "Fine-tune a multilingual encoder for Punjabi intents",
      lang: "py",
      src: `from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset

MODEL = "ai4bharat/IndicBERTv2-MLM-only"      # a multilingual encoder with Gurmukhi coverage
tok = AutoTokenizer.from_pretrained(MODEL)
labels = sorted({row["label"] for row in train_rows})
label2id = {l: i for i, l in enumerate(labels)}

def encode(batch):
    enc = tok(batch["text"], truncation=True, max_length=128)
    enc["labels"] = [label2id[l] for l in batch["label"]]
    return enc

train = Dataset.from_list(train_rows).map(encode, batched=True)
dev = Dataset.from_list(dev_rows).map(encode, batched=True)

model = AutoModelForSequenceClassification.from_pretrained(MODEL, num_labels=len(labels))
args = TrainingArguments(output_dir="pa-intent", learning_rate=3e-5, num_train_epochs=4, per_device_train_batch_size=32, eval_strategy="epoch", save_strategy="epoch", load_best_model_at_end=True, metric_for_best_model="f1_macro")
trainer = Trainer(model=model, args=args, train_dataset=train, eval_dataset=dev, compute_metrics=macro_f1_metrics)
trainer.train()
print(trainer.evaluate())`,
      lines: [
        { code: "MODEL = \"ai4bharat/IndicBERTv2-MLM-only\"      # a multilingual encoder with Gurmukhi coverage", say: "An encoder whose tokeniser was built with Indic scripts; check its fertility first (lesson 45.2)." },
        { code: "enc = tok(batch[\"text\"], truncation=True, max_length=128)", say: "Support messages are short; 128 tokens covers nearly all of them at a good fertility." },
        { code: "model = AutoModelForSequenceClassification.from_pretrained(MODEL, num_labels=len(labels))", say: "A fresh classification head on top of the pretrained encoder; the encoder's Punjabi knowledge is reused." },
        { code: "args = TrainingArguments(output_dir=\"pa-intent\", learning_rate=3e-5, num_train_epochs=4, per_device_train_batch_size=32, eval_strategy=\"epoch\", save_strategy=\"epoch\", load_best_model_at_end=True, metric_for_best_model=\"f1_macro\")", say: "Select the best epoch by macro-F1 on the validation set, so rare classes drive model selection." },
      ],
      note: "Train on all scripts together with the script in the data; evaluate per script. If Romanised lags, add Romanised examples rather than a separate model.",
    },
    useIt: "Use classification for routing, tagging, language and script detection, and abuse filtering in Punjabi products. Launch prompted, label traffic by script, fine-tune an encoder, compare per-class F1 per script, route low-confidence cases to the larger model, and retrain monthly.",
    takeaways: ["Two routes: prompted large model (no data) and fine-tuned multilingual encoder (a few thousand labels, cheap, accurate).", "Compare on the same per-script test set with per-class and macro F1.", "Fine-tuned encoders learn Romanised and code-switched forms if the data has them.", "Combine: encoder first, large model for low-confidence cases."],
    terms: [["classification head", "a small output layer added to an encoder to predict labels"], ["macro-F1", "the average of per-class F1 scores, giving rare classes equal weight"], ["confidence threshold", "the score below which a prediction is sent to a slower, stronger model or a person"]],
    reflect: { q: "The fine-tuned encoder beats the prompted model on Gurmukhi but not on Shahmukhi. Why might that be?", a: "The encoder's tokeniser or pretraining may barely cover Shahmukhi, or the Shahmukhi training examples are too few; the prompted model's general Urdu knowledge carries it. Check Shahmukhi fertility and example counts; add Shahmukhi labels or route Shahmukhi to the prompted model." },
  },

  "m45-punjabi-sentiment-analysis": {
    simple: "Sentiment analysis for Punjabi labels opinion as positive, negative, neutral or mixed; the hard parts are sarcasm, honorifics, code-mixing and the lack of labelled data, so the labels and the test set matter more than the model.",
    concept:
      "**Sentiment analysis** is classification of opinion: is this review, comment or message positive, negative, neutral, or mixed? For Punjabi it inherits every difficulty of lesson 45.3 and adds its own. Politeness markers (ਜੀ, ਧੰਨਵਾਦ) appear in angry messages too; sarcasm ('ਬਹੁਤ ਵਧੀਆ ਸਰਵਿਸ, ਤਿੰਨ ਦਿਨ ਤੋਂ ਕੋਈ ਜਵਾਬ ਨਹੀਂ' — 'great service, no reply for three days') inverts the surface words; emoji carry much of the signal in chat; Romanised reviews pack complaint and praise in one line; and regional expressions of displeasure are indirect.\n\nThe recipe: a four-label scheme with 'mixed' as a real class, guidelines that resolve sarcasm by the complaint and honorifics as neutral, a stratified gold set, a prompted baseline, then a fine-tuned encoder. Pretrained sentiment models for English or Hindi do not transfer well to Punjabi slang and sarcasm; zero-shot transfer gives a start, not a product.",
    why:
      "Sentiment drives product decisions: which features anger users, which regions are unhappy, whether a release helped. A model that reads 'ਬਹੁਤ ਵਧੀਆ' as positive in a sarcastic complaint reports happiness where there is fury. In Punjabi the mismatch between surface words and intent is common enough that unlabelled, untested sentiment is worse than none.",
    how: [
      "Define the labels (positive, negative, neutral, mixed) with Punjabi examples and sarcasm, honorific and emoji rules.",
      "Label 3,000–5,000 items stratified by script and source with two annotators; freeze a gold set of 400.",
      "Baseline with a prompted model using the same guideline text as its instruction and structured output.",
      "Fine-tune a multilingual encoder on the labelled set; add aspect labels (delivery, price, app, staff) if the product needs them.",
      "Report per-class F1 per script; sample disagreements monthly and refresh the labels as slang and products change.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Surface words", "Correct label", "Rule"],
        rows: [
          ["ਬਹੁਤ ਵਧੀਆ ਸਰਵਿਸ, ਤਿੰਨ ਦਿਨ ਤੋਂ ਕੋਈ ਜਵਾਬ ਨਹੀਂ", "positive + complaint", "negative", "sarcasm: the complaint decides"],
          ["ਧੰਨਵਾਦ ਜੀ, paisa refund ho gaya", "honorific + resolution", "positive", "resolution decides; honorific neutral"],
          ["app theek hai par delivery bahut late", "praise + complaint", "mixed", "two aspects, opposite polarity"],
          ["ਆਰਡਰ ਕੱਲ੍ਹ ਆਇਆ।", "statement", "neutral", "no opinion expressed"],
          ["😡😡 2 ghante hold te", "emoji + fact", "negative", "emoji carries the sentiment"],
        ],
      },
      caption: "The surface words mislead in three of five rows. The guidelines encode the rules; the model learns them from the labels.",
    },
    everyday: {
      title: "'Great, just great'",
      text: "Everyone understands that 'great, just great' said after dropping the groceries is not praise. Children learn it from tone and context; a model learns it only from examples labelled by people who heard the tone. Punjabi has its own versions, with ਜੀ and ਵਧੀਆ doing the same work as 'great'. A sentiment model without those examples takes every 'ਵਧੀਆ' at face value.",
    },
    engineering: {
      title: "Finding the real complaints in app reviews",
      text: "A ride-hailing app's Punjabi reviews were summarised as 72% positive by a Hindi sentiment model applied to transliterated text. A 2,000-review labelled set (kappa 0.83 after one guideline revision) showed 48% positive, 31% negative, 14% mixed, 7% neutral: a quarter of 'positive' reviews were sarcastic or mixed. A fine-tuned Punjabi encoder reached macro-F1 0.81 against the Hindi model's 0.52. The product team's dashboard changed the same week; the top negative aspect, driver cancellations in Ludhiana, had been invisible under the old numbers.",
    },
    maths: {
      formula: "confusion matrix entry C[i][j] = count of items with true label i predicted as j;  per-class recall = C[i][i] ÷ Σⱼ C[i][j]",
      meaning: "The confusion matrix shows which labels are mistaken for which. For sentiment, the diagonal is correct predictions; the 'negative predicted as positive' cell is the sarcasm problem, and its size is what to watch.",
      worked: [
        "Test set 400 items: true negative 124. Predicted: 98 negative, 21 positive, 5 mixed. Negative recall = 98 ÷ 124 ≈ 0.79.",
        "The 21 negatives predicted positive are inspected: 17 are sarcastic reviews containing ਵਧੀਆ or ਸ਼ਾਨਦਾਰ. That is a labelled failure pattern.",
        "Adding 300 sarcastic examples to training and retraining: negatives predicted positive fall to 8; negative recall ≈ 0.90.",
        "Report the matrix per script; Romanised reviews often show more negative→mixed confusion because praise and complaint sit in one line.",
      ],
    },
    code: {
      title: "Prompted sentiment baseline with structured output",
      lang: "py",
      src: `GUIDELINES = """Label the Punjabi review as positive, negative, neutral or mixed.
Rules: sarcasm counts as negative (praise words next to a complaint); polite words like ji and dhanvaad do not make a review positive;
emoji carry sentiment; a review with praise for one thing and a complaint about another is mixed; a plain statement with no opinion is neutral.
The review may be in Gurmukhi, Shahmukhi or Roman letters, often mixed with English."""

def classify_sentiment(review):
    reply = client.messages.create(
        model=MODEL_CLASSIFY,
        max_tokens=100,
        temperature=0,
        system=GUIDELINES,
        tools=[sentiment_tool],                       # schema: label enum + confidence + aspect
        tool_choice={"type": "tool", "name": "label_review"},
        messages=[{"role": "user", "content": "<review>" + review + "</review>"}],
    )
    block = next(b for b in reply.content if b.type == "tool_use")
    return block.input["label"], block.input["confidence"]

print(classify_sentiment("ਬਹੁਤ ਵਧੀਆ ਸਰਵਿਸ, ਤਿੰਨ ਦਿਨ ਤੋਂ ਕੋਈ ਜਵਾਬ ਨਹੀਂ"))`,
      lines: [
        { code: "Rules: sarcasm counts as negative (praise words next to a complaint); polite words like ji and dhanvaad do not make a review positive;", say: "The annotation guidelines become the model's instructions, so the baseline and the labels follow the same rules." },
        { code: "tools=[sentiment_tool],                       # schema: label enum + confidence + aspect", say: "Structured output with an enum: the label can only be one of the four; confidence lets low-certainty reviews go to review." },
        { code: "return block.input[\"label\"], block.input[\"confidence\"]", say: "Data, not prose. The same function scores the gold set so the baseline can be compared with the fine-tuned encoder." },
      ],
      output: "('negative', 0.86)",
      note: "The fine-tuned encoder from lesson 45.3 replaces this once labels exist; keep this path for low-confidence items.",
    },
    useIt: "Use Punjabi sentiment for review and feedback dashboards, escalation of angry messages and release monitoring. Treat 'mixed' as a real class, write sarcasm and honorific rules into guidelines and prompts, label per script, fine-tune an encoder, and watch the negative-predicted-as-positive cell of the confusion matrix.",
    takeaways: ["Punjabi sentiment is hard because surface words (ਵਧੀਆ, ਜੀ) mislead; sarcasm, honorifics, emoji and code-mixing need explicit rules.", "Four labels including mixed; guidelines shared by annotators and the prompted baseline.", "Fine-tune an encoder on stratified labels; evaluate per class and per script with a confusion matrix.", "Hindi or English sentiment models do not transfer to Punjabi slang."],
    terms: [["sentiment analysis", "classifying text by the opinion it expresses"], ["confusion matrix", "a table of true labels against predicted labels"], ["aspect", "the thing an opinion is about, such as delivery or price"]],
    reflect: { q: "A review says 'ਸ਼ਾਨਦਾਰ app, bas crash ho jandi hai har vaar' (brilliant app, it just crashes every time). Positive, negative or mixed?", a: "Mixed under the guidelines if the praise is sincere, negative if the 'brilliant' is sarcastic; the deciding evidence is 'crashes every time', which makes negative the safer label and sarcasm the likely reading. The guideline should say which, and annotators should follow it consistently." },
  },

  "m45-punjabi-translation": {
    simple: "Punjabi translation works best with models trained on Indic parallel data, scored with chrF and human checks per direction and script, and never trusted blindly for legal, medical or financial text.",
    concept:
      "**Machine translation** for Punjabi means Gurmukhi ↔ English, Shahmukhi ↔ English, and the special case Gurmukhi ↔ Shahmukhi, which is transliteration plus dialect adjustment rather than translation. Options: general chat models (decent for Gurmukhi, erratic for Shahmukhi, prone to Hindi vocabulary); dedicated multilingual translation models that list Punjabi explicitly (NLLB-200 with pan_Guru and pnb_Arab; IndicTrans2 for Gurmukhi) and are usually better and far cheaper; and fine-tuned versions on your domain.\n\nQuality differs by direction: Punjabi → English is easier (English is well modelled) than English → Punjabi, where models produce Hindi-flavoured or stiff Punjabi. It differs by domain: everyday text translates well, legal and medical text badly. And it must be measured: chrF against references per direction and script, plus human adequacy and fluency ratings on a sample, because chrF cannot see a confidently wrong number or a reversed negation.",
    why:
      "Translation is how a Punjabi product reuses everything that exists in English: help articles, policies, labelled data, and the answers of a stronger English model. It is also the riskiest component: a mistranslated dosage, deadline or refund condition harms users while reading fluently. Knowing which models to use, which direction is weak, and how to measure and gate quality is what makes translation safe to build on.",
    how: [
      "Build reference sets: 500–1,000 sentence pairs per direction and script from your domain, translated by professionals.",
      "Evaluate candidates (dedicated translation models, chat models, fine-tuned variants) with chrF per direction and script; add a human rating on 100 items per cell.",
      "Normalise outputs and references identically before scoring (lesson 44.6).",
      "Fine-tune the best dedicated model on domain pairs if the domain gap is large; re-evaluate.",
      "Gate by use: machine-only for low-stakes text, human review for legal, medical and financial text; show the source language on request.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Direction", "Typical difficulty", "Common failure", "Scorer"],
        rows: [
          ["Gurmukhi → English", "easier", "dropped honorifics, flattened idioms", "chrF + adequacy rating"],
          ["English → Gurmukhi", "harder", "Hindi vocabulary, formal register, gender errors", "chrF + fluency rating by native speaker"],
          ["Shahmukhi → English", "harder", "read as Urdu; Punjabi idioms mistranslated", "chrF + adequacy"],
          ["English → Shahmukhi", "hardest", "output is Urdu, not Punjabi", "chrF + 'is this Punjabi?' check"],
          ["Gurmukhi ↔ Shahmukhi", "transliteration + dialect", "missing vowels; eastern/western word choice", "character error rate + native review"],
        ],
      },
      caption: "Report each cell separately. The worst cell is usually English → Shahmukhi, and it is the one that quietly turns Punjabi products into Urdu ones.",
    },
    everyday: {
      title: "The bilingual cousin as translator",
      text: "A cousin who grew up in Toronto translates your Punjabi message to English beautifully, and translates the English reply back into something your grandmother says 'sounds like a TV announcer from Delhi'. The same person, two directions, two qualities. Machine translation has exactly this asymmetry, and for the same reason: more practice in one direction than the other.",
    },
    engineering: {
      title: "Translating a help centre into Gurmukhi",
      text: "A bank needed 1,200 English help articles in Gurmukhi. A chat model's output read as formal Hindi-Punjabi and mistranslated 14 of 80 sampled financial terms. A dedicated Indic translation model scored 9 chrF points higher and kept the terms better; fine-tuning it on 2,500 professionally translated banking sentences added another 6 points and fixed the register. The pipeline then: machine translation, a glossary enforcer for 300 banking terms, a fluency pass by a Punjabi editor at 20% of the cost of full human translation, and a chrF regression test on the reference set for every model update.",
    },
    maths: {
      formula: "chrF per cell (direction × script × domain);   human adequacy (1–5) and fluency (1–5) on a 100-item sample;  gate: deploy machine-only only where adequacy ≥ 4.5 and no critical errors in the sample",
      meaning: "Automatic scores track progress; human ratings catch the errors that matter. The gate combines both and is set per use.",
      worked: [
        "English → Gurmukhi, banking domain, 800 references. Model A chrF 52.3, model B 61.1, B fine-tuned 67.4.",
        "Human sample of 100 for B fine-tuned: adequacy mean 4.6, fluency 4.3, critical errors (wrong number, reversed condition) 2 of 100.",
        "Gate: adequacy passes, but two critical errors in 100 means roughly 2% of articles would carry a dangerous mistake. Financial articles therefore get human review; marketing copy goes machine-only.",
        "After adding a glossary enforcer and re-sampling: critical errors 0 of 100; the gate opens for FAQ articles, not for terms and conditions.",
      ],
    },
    code: {
      title: "Translate with a dedicated multilingual model and score it",
      lang: "py",
      src: `from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sacrebleu.metrics import CHRF

MODEL = "facebook/nllb-200-distilled-600M"         # lists Punjabi as pan_Guru (Gurmukhi) and pnb_Arab (Shahmukhi)
tok = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL)

def translate(text, src="eng_Latn", tgt="pan_Guru"):
    tok.src_lang = src
    enc = tok(text, return_tensors="pt", truncation=True, max_length=256)
    out = model.generate(**enc, forced_bos_token_id=tok.convert_tokens_to_ids(tgt), max_new_tokens=256, num_beams=4)
    return tok.batch_decode(out, skip_special_tokens=True)[0]

print(translate("Your order will be delivered tomorrow evening."))

outputs = [translate(src) for src, _ in reference_pairs]
score = CHRF().corpus_score(outputs, [[ref for _, ref in reference_pairs]]).score
print("chrF en->pa_Guru:", round(score, 1))`,
      lines: [
        { code: "MODEL = \"facebook/nllb-200-distilled-600M\"         # lists Punjabi as pan_Guru (Gurmukhi) and pnb_Arab (Shahmukhi)", say: "A translation model that names both Punjabi scripts explicitly. Check the language list of any model you consider." },
        { code: "out = model.generate(**enc, forced_bos_token_id=tok.convert_tokens_to_ids(tgt), max_new_tokens=256, num_beams=4)", say: "The target language is forced by its code; beam search gives steadier translations than sampling." },
        { code: "print(translate(\"Your order will be delivered tomorrow evening.\"))", say: "Expect something like ਤੁਹਾਡਾ ਆਰਡਰ ਕੱਲ੍ਹ ਸ਼ਾਮ ਨੂੰ ਡਿਲੀਵਰ ਕੀਤਾ ਜਾਵੇਗਾ। Read it; a native speaker will tell you about the register." },
        { code: "score = CHRF().corpus_score(outputs, [[ref for _, ref in reference_pairs]]).score", say: "chrF against your own references; normalise both sides first." },
      ],
      note: "Swap tgt to pnb_Arab for Shahmukhi and check that the output is Punjabi, not Urdu; this is the cell most worth a human look.",
    },
    useIt: "Use dedicated Indic translation models for Punjabi, fine-tuned on domain pairs where the gap is large; measure chrF per direction, script and domain, plus human ratings; enforce glossaries; gate machine-only use by stakes; and treat English → Shahmukhi as the weakest cell until proven otherwise.",
    takeaways: ["Dedicated multilingual translation models usually beat chat models for Punjabi, especially into Punjabi.", "Quality differs by direction, script and domain; score every cell.", "chrF tracks progress; human ratings and critical-error counts gate deployment.", "Gurmukhi ↔ Shahmukhi is transliteration plus dialect, not translation."],
    terms: [["machine translation", "automatic translation between languages"], ["adequacy and fluency", "human ratings of whether meaning is preserved and whether output reads naturally"], ["glossary enforcer", "a step that forces agreed translations of key terms"]],
    reflect: { q: "English → Shahmukhi output reads perfectly but a Lahore colleague says 'this is Urdu'. What happened and how do you check automatically?", a: "The model defaulted to Urdu, the dominant language in that script. Run a Punjabi-versus-Urdu classifier on outputs (lesson 44.10) and count Punjabi function words (اے, وچ, نوں); add that check to the harness as a hard failure." },
  },

  "m45-punjabi-question-answering": {
    simple: "Punjabi question answering returns an answer to a Punjabi question, either extracted from a given passage or generated from retrieved context; the answer must be in the user's script and checkable against its source.",
    concept:
      "**Question answering** (QA) comes in two shapes. Extractive QA: given a passage and a question, return the span of the passage that answers it; scored by exact match and character-level F1 against reference spans. Generative QA: given a question (and usually retrieved context, module 28), write an answer; scored by a judge against a reference and by faithfulness to the context.\n\nFor Punjabi the practical constraints are: the question may arrive in any of the three scripts; the context is often English or Gurmukhi; the answer must come back in the user's script; and the model must be allowed to say the context does not contain the answer, because a Punjabi model that cannot find the answer will otherwise invent one in Hindi-flavoured Punjabi. Training data is scarce; translated English QA sets (translated SQuAD-style data) give a start, and a few hundred real Punjabi questions with native-speaker answers are worth more than ten thousand translated ones.",
    why:
      "QA is what users actually want from a Punjabi assistant: 'ਪਾਸਪੋਰਟ ਰੀਨਿਊ ਕਰਨ ਲਈ ਕੀ ਚਾਹੀਦਾ ਹੈ?' answered from the right page, in Punjabi, with a source. It combines retrieval, cross-lingual understanding, generation in a low-resource script and honesty, so it is where the earlier modules meet, and where errors are most visible to users.",
    how: [
      "Collect real Punjabi questions per script from logs; pair each with a source passage and a native-speaker answer; freeze a test set with 'not answerable' cases included.",
      "Detect script and transliterate Romanised and Shahmukhi questions to Gurmukhi for retrieval if alignment is weak (lesson 43.10).",
      "Retrieve passages (Punjabi or English) with a cross-lingual encoder; rerank.",
      "Prompt the generator with numbered sources, the rule to answer only from them in the user's script, and permission to decline; or use an extractive model when the context is Punjabi and spans suffice.",
      "Score: character F1 for extractive; judge-rated correctness and faithfulness for generative; per script; plus the decline rate on unanswerable questions.",
    ],
    visual: {
      kind: "flow",
      steps: ["question (any script): passport renew karan lai ki chahida?", "script detect → transliterate to Gurmukhi", "cross-lingual retrieval over English + Gurmukhi pages", "rerank; numbered sources", "generate answer in the user's script, cite [1]", "judge: correct? faithful? right script?"],
      caption: "Every arrow is a module from earlier in the path. The Punjabi-specific steps are script handling and the per-script checks.",
    },
    everyday: {
      title: "Asking the clerk at the counter",
      text: "You ask a government clerk in Punjabi what you need to renew a passport. A good clerk looks at the list on the wall (the source), tells you in Punjabi, and points at the list. A bad clerk recites from memory in Hindi and gets one item wrong. The assistant should be the good clerk: answer from the page, in your language, with the page in view, and say 'that is not on my list' when it is not.",
    },
    engineering: {
      title: "A citizen-services QA assistant",
      text: "A state portal built Punjabi QA over 3,000 English and Gurmukhi service pages. Evaluation on 600 real questions (200 per script, 15% unanswerable): with retrieval alone and a chat model, correctness was 71% Gurmukhi, 58% Shahmukhi, 52% Romanised, and 23% of unanswerable questions got invented answers. Adding transliteration to Gurmukhi before retrieval, a cite-or-decline prompt, and a reranker raised correctness to 82/74/76% and cut invented answers to 4%. Fine-tuning the generator on 1,500 real Punjabi Q&A pairs raised Gurmukhi fluency ratings from 3.6 to 4.4 and removed most Hindi vocabulary.",
    },
    maths: {
      formula: "character-level F1 = 2PR ÷ (P + R), with P and R computed over characters (grapheme clusters) shared between predicted and reference spans;  exact match = 1 if identical after normalisation else 0",
      meaning: "Word-level F1 punishes Punjabi spelling variants and morphology; character-level F1 over grapheme clusters credits near-matches. Exact match is the strict companion.",
      worked: [
        "Reference span: ਦੋ ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫੋਟੋਆਂ (two passport-size photos), 18 clusters ignoring spaces. Prediction: ਦੋ ਪਾਸਪੋਰਟ ਸਾਇਜ਼ ਫੋਟੋ (spelling variant, singular).",
        "Shared clusters ≈ 15; prediction length 16. P = 15 ÷ 16 ≈ 0.94; R = 15 ÷ 18 ≈ 0.83; F1 ≈ 2 × 0.94 × 0.83 ÷ 1.77 ≈ 0.88. Exact match = 0.",
        "Word-level F1 for the same pair would be 2 × (2/4) × (2/4) ÷ 1 = 0.5: it misses that the answer is essentially right.",
        "Report both, per script; a big gap between them means spelling variation, not wrong answers.",
      ],
    },
    code: {
      title: "Generative QA in the user's script with cite-or-decline",
      lang: "py",
      src: `def answer_punjabi(question, script, sources):
    source_block = "\\n\\n".join(f"[{i + 1}] {s['title']}\\n{s['text']}" for i, s in enumerate(sources))
    script_name = {"guru": "Gurmukhi Punjabi", "arab": "Shahmukhi Punjabi (not Urdu)", "latn": "Romanised Punjabi"}[script]
    system = ("Answer the user's question ONLY from the numbered sources. Reply in " + script_name + ". "
              "Cite sources like [2]. If the sources do not contain the answer, say so in the same script and do not guess. "
              "Keep English technical terms as written in the sources.")
    reply = client.messages.create(
        model=MODEL_QA,
        max_tokens=500,
        temperature=0.2,
        system=system,
        messages=[{"role": "user", "content": "<sources>\\n" + source_block + "\\n</sources>\\n\\n<question>\\n" + question + "\\n</question>"}],
    )
    return "".join(b.text for b in reply.content if b.type == "text")

print(answer_punjabi("ਪਾਸਪੋਰਟ ਰੀਨਿਊ ਕਰਨ ਲਈ ਕੀ ਚਾਹੀਦਾ ਹੈ?", "guru", retrieved))`,
      lines: [
        { code: "script_name = {\"guru\": \"Gurmukhi Punjabi\", \"arab\": \"Shahmukhi Punjabi (not Urdu)\", \"latn\": \"Romanised Punjabi\"}[script]", say: "The reply script is set from detection, and Shahmukhi is spelled out as 'not Urdu', which measurably reduces drift." },
        { code: "\"Cite sources like [2]. If the sources do not contain the answer, say so in the same script and do not guess. \"", say: "Permission to decline, in the user's script. Without it the model invents." },
        { code: "\"Keep English technical terms as written in the sources.\")", say: "Users expect 'passport', 'OTP', 'app' as written; forced Punjabi coinages confuse." },
        { code: "messages=[{\"role\": \"user\", \"content\": \"<sources>\\n\" + source_block + \"\\n</sources>\\n\\n<question>\\n\" + question + \"\\n</question>\"}],", say: "Sources delimited as data, the question as the task, as in module 26." },
      ],
      note: "The judge (lesson 45.12) checks correctness, faithfulness to the sources and whether the reply is actually in the requested script.",
    },
    useIt: "Build Punjabi QA as retrieval plus generation with script detection, transliteration where alignment is weak, cite-or-decline prompting in the user's script, and per-script evaluation that includes unanswerable questions. Use extractive QA when passages are Punjabi and spans suffice; fine-tune the generator on real Punjabi Q&A once a few hundred exist.",
    takeaways: ["QA is extractive (span) or generative (from retrieved context); Punjabi needs script handling and permission to decline.", "Real Punjabi questions with native answers beat large translated sets.", "Score with character-level F1 (extractive) and judged correctness, faithfulness and script (generative), per script, including unanswerable cases.", "Say 'not Urdu' for Shahmukhi output; keep English terms as written."],
    terms: [["extractive QA", "returning the span of a passage that answers the question"], ["generative QA", "writing an answer from retrieved context"], ["unanswerable question", "a test case whose correct response is to decline"]],
    reflect: { q: "Why include unanswerable questions in the Punjabi QA test set?", a: "Because the failure that harms users most is a confident invented answer, and a test set with only answerable questions never measures it. The decline rate on unanswerable items is a first-class metric, per script." },
  },

  "m45-punjabi-embeddings": {
    simple: "Punjabi embeddings are vectors for Punjabi text from a model that covers its scripts; measure alignment and retrieval per script, and fine-tune with Punjabi pairs when the off-the-shelf model falls short.",
    concept:
      "An **embedding model for Punjabi** must do two things: place Gurmukhi, Shahmukhi and Romanised text with the same meaning close together, and place Punjabi text close to its English equivalent so cross-lingual search works (lesson 43.10). Off-the-shelf multilingual embedding models usually handle Gurmukhi moderately, Shahmukhi through Urdu, and Romanised poorly.\n\nEvaluation uses three numbers per script: alignment accuracy with English (translation retrieval), same-language retrieval recall on a Punjabi query–document set, and clustering purity on labelled topics. When they fall short, fine-tune the embedding model with contrastive pairs: Punjabi–English translations, Punjabi paraphrases, question–answer pairs, and Romanised–Gurmukhi pairs of the same sentence, which teaches the model that 'mera order kithe hai' and ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ mean the same. A few tens of thousands of pairs move alignment by tens of points.",
    why:
      "Every retrieval feature (search, RAG, deduplication, clustering of feedback) rests on the embedding model. A model that embeds Romanised Punjabi as noise makes every one of those features fail for the most common input. Measuring and fine-tuning embeddings is the single highest-leverage model work in a Punjabi product after tokeniser choice.",
    how: [
      "Build evaluation pairs per script: 1,000 Punjabi–English translations, 500 query–relevant-document pairs, and a labelled topic set.",
      "Score candidate embedding models: alignment accuracy, retrieval recall@5, clustering purity, per script; note fertility and speed.",
      "Collect training pairs: translations, paraphrases, Q&A, and Romanised–Gurmukhi transliteration pairs from real messages.",
      "Fine-tune with a contrastive loss (in-batch negatives) for a few epochs; keep an English and Hindi slice in training so alignment with them does not degrade.",
      "Re-score per script; deploy the fine-tuned model with a version tag; re-embed indexes (module 29).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Metric (illustrative)", "Off-the-shelf multilingual encoder", "After fine-tuning with 40k Punjabi pairs"],
        rows: [
          ["alignment with English, Gurmukhi", "81%", "90%"],
          ["alignment with English, Shahmukhi", "63%", "84%"],
          ["alignment with English, Romanised", "44%", "79%"],
          ["Gurmukhi query → Gurmukhi doc recall@5", "72%", "88%"],
          ["Romanised query → Gurmukhi doc recall@5", "31%", "77%"],
          ["English alignment (regression check)", "—", "unchanged within 1 point"],
        ],
      },
      caption: "Romanised–Gurmukhi pairs are the training data that moves the last two rows most.",
    },
    everyday: {
      title: "Filing by meaning, not by spelling",
      text: "A good office assistant files 'mera order kithe hai', ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ and 'where is my order' in the same folder, because they are the same request. A new assistant who files by first letter puts them in three cabinets. Fine-tuning the embedding model is training the assistant to file by meaning across scripts, by showing them thousands of 'these two are the same' examples.",
    },
    engineering: {
      title: "Fixing search for Romanised queries",
      text: "A pharmacy app's Punjabi search over a Gurmukhi medicine-information base returned relevant results for 72% of Gurmukhi queries and 31% of Romanised ones. The team mined 28,000 Romanised–Gurmukhi sentence pairs from support chats (where agents replied in Gurmukhi to Romanised questions) and 15,000 Punjabi–English translation pairs, and fine-tuned the multilingual sentence encoder for two epochs with in-batch negatives. Romanised recall@5 rose to 77%, Gurmukhi to 86%, English alignment stayed flat. The index was re-embedded overnight with the new model version.",
    },
    maths: {
      formula: "contrastive (in-batch) loss for pair (qᵢ, dᵢ) = −log( exp(sim(qᵢ, dᵢ) ÷ τ) ÷ Σⱼ exp(sim(qᵢ, dⱼ) ÷ τ) )",
      meaning: "For each query, its true document should score higher than every other document in the batch. τ (temperature) sharpens the comparison. Minimising this pulls true pairs together and pushes others apart.",
      worked: [
        "Batch of 3 pairs. Query q₁ = 'mera order kithe hai'. Cosine similarities to d₁ (ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ) 0.55, d₂ (ਵਾਪਸੀ ਨੀਤੀ, returns policy) 0.40, d₃ (ਡਿਲੀਵਰੀ ਸਮਾਂ, delivery time) 0.48. τ = 0.05.",
        "Scaled: 11.0, 8.0, 9.6. exp: 59,874; 2,981; 14,765. Softmax for d₁ = 59,874 ÷ 77,620 ≈ 0.77. Loss = −log 0.77 ≈ 0.26.",
        "After training, similarities might be 0.85, 0.20, 0.30: scaled 17, 4, 6; softmax for d₁ ≈ 0.99998; loss ≈ 0.00002. The true pair dominates.",
      ],
    },
    code: {
      title: "Fine-tune a sentence encoder with Punjabi pairs",
      lang: "py",
      src: `from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2")

examples = []
for roman, gurmukhi in roman_gurmukhi_pairs:            # same sentence, two scripts
    examples.append(InputExample(texts=[roman, gurmukhi]))
for pa, en in translation_pairs:                       # Punjabi–English translations
    examples.append(InputExample(texts=[pa, en]))
for q, doc in question_passage_pairs:                  # questions with the passage that answers them
    examples.append(InputExample(texts=[q, doc]))

loader = DataLoader(examples, shuffle=True, batch_size=64)
loss = losses.MultipleNegativesRankingLoss(model)
model.fit(train_objectives=[(loader, loss)], epochs=2, warmup_steps=200, show_progress_bar=True)
model.save("pa-embed-v2")`,
      lines: [
        { code: "examples.append(InputExample(texts=[roman, gurmukhi]))", say: "A Romanised sentence and its Gurmukhi form as a positive pair: this is what teaches cross-script alignment." },
        { code: "examples.append(InputExample(texts=[pa, en]))", say: "Translation pairs keep Punjabi aligned with English for cross-lingual search." },
        { code: "loss = losses.MultipleNegativesRankingLoss(model)", say: "In-batch negatives: every other pair in the batch is a negative; the loss from the maths above." },
        { code: "model.save(\"pa-embed-v2\")", say: "A versioned model. Every index built with it records the version, because vectors from different versions are incompatible." },
      ],
      note: "Evaluate per script before and after; include an English slice in training to guard English alignment.",
    },
    useIt: "Choose the Punjabi embedding model by per-script alignment and retrieval scores, fine-tune with transliteration, translation and Q&A pairs when scores fall short, version the model, and re-embed indexes on every change. This one model underpins search, RAG, deduplication and clustering for the whole product.",
    takeaways: ["Punjabi embeddings must align scripts with each other and with English; off-the-shelf models are weakest on Romanised.", "Measure alignment, retrieval recall and clustering purity per script.", "Fine-tune with contrastive pairs; Romanised–Gurmukhi pairs move the needle most.", "Version the model; re-embed indexes on change."],
    terms: [["contrastive fine-tuning", "training with pairs that should be close and in-batch negatives that should be far"], ["in-batch negatives", "using the other examples in a batch as the non-matching comparisons"], ["clustering purity", "how well embedding clusters match known topic labels"]],
    reflect: { q: "After fine-tuning on Punjabi pairs, English retrieval fell 6 points. What happened and how do you prevent it?", a: "The model drifted toward the Punjabi pairs and partly forgot its English alignment (catastrophic forgetting). Mix an English and Hindi slice into the training pairs, use fewer epochs or a lower learning rate, and keep the English alignment score as a regression gate." },
  },

  "m45-punjabi-semantic-search": {
    simple: "Punjabi semantic search combines script detection, transliteration, cross-lingual embeddings and keyword matching so a query in any script finds the right Punjabi or English document.",
    concept:
      "**Semantic search** for Punjabi assembles earlier pieces into one query path. A query arrives in any script. Detect the script; if alignment for that script is weak, transliterate to Gurmukhi (lesson 43.9). Embed with the fine-tuned Punjabi embedding model (lesson 45.7) and find nearest documents, which may be Gurmukhi, Shahmukhi or English. In parallel, run keyword search, because product codes, names and numbers embed badly, and because exact Gurmukhi matches deserve a boost; the keyword index uses the same normaliser and variant maps (module 44). Fuse the two rankings (module 29), rerank the top candidates with a multilingual reranker, and return results with snippets in the user's script where possible.\n\nEvaluate with recall@5 per query script and per document language, on real queries. The common surprise is that Romanised queries, after transliteration, perform almost as well as Gurmukhi ones, and that keyword search still wins on identifiers.",
    why:
      "Search is the first thing Punjabi users try and the first place they give up. A search box that handles only Gurmukhi or only exact words fails most real queries. Semantic search with script handling is what makes a Punjabi knowledge base usable by people who type the way they talk.",
    how: [
      "Index documents: normalise, chunk, embed with the versioned Punjabi model, and build a keyword index with the same normaliser and variant maps.",
      "At query time: detect script; transliterate Romanised and Shahmukhi to Gurmukhi when their alignment is below threshold; keep the original for keyword search.",
      "Run embedding search and keyword search; fuse by reciprocal rank.",
      "Rerank the top 20 with a multilingual cross-encoder that reads query and document together.",
      "Return results with the document's language tagged; translate or transliterate snippets to the user's script if the product needs it; log the query, script and clicks for evaluation.",
    ],
    visual: {
      kind: "flow",
      steps: ["query: 'passport renew kiven karna'", "script = latn → transliterate → ਪਾਸਪੋਰਟ ਰੀਨਿਊ ਕਿਵੇਂ ਕਰਨਾ", "embed (pa-embed-v2) → nearest chunks", "keyword search on original + transliterated", "reciprocal rank fusion", "cross-encoder rerank top 20", "results: Gurmukhi page [1], English page [2]"],
      caption: "Transliteration feeds the embedding path; the keyword path keeps the user's original text for codes and names.",
    },
    everyday: {
      title: "The librarian who speaks all three",
      text: "Ask a librarian for 'passport renew wali book' and they do not say 'we file by Gurmukhi title'. They understand the request, know the Gurmukhi and English books on the subject, and bring both. They also know that 'form 12A' means an exact code, not a meaning to interpret. Semantic search with keyword fusion is that librarian: meaning for sentences, exact matching for codes.",
    },
    engineering: {
      title: "Search over a Punjabi agricultural knowledge base",
      text: "An agri-advisory service indexed 8,000 Gurmukhi and English articles. Baseline keyword search had recall@5 of 54% for Gurmukhi queries and 19% for Romanised. Adding the fine-tuned embedding path raised Gurmukhi to 79%; adding transliteration for Romanised queries raised Romanised to 71%; fusion with keyword search kept pesticide product codes and variety names (which embeddings confused) at 92% recall; a cross-encoder reranker added 4–6 points everywhere. The final numbers, by query script: Gurmukhi 86%, Romanised 78%, Shahmukhi 72%, measured on 900 real farmer queries.",
    },
    maths: {
      formula: "RRF score(d) = Σ over rankings r of 1 ÷ (k + rank_r(d)), k = 60;   recall@5 = share of queries whose relevant document is in the top 5",
      meaning: "Reciprocal rank fusion merges the embedding and keyword rankings without normalising scores; recall@5 per script is the headline metric.",
      worked: [
        "Document A: rank 1 in embedding search, rank 8 in keyword search. RRF = 1 ÷ 61 + 1 ÷ 68 ≈ 0.0164 + 0.0147 = 0.0311.",
        "Document B (a page with the exact product code): rank 15 in embedding search, rank 1 in keyword search. RRF = 1 ÷ 75 + 1 ÷ 61 ≈ 0.0133 + 0.0164 = 0.0297.",
        "A edges B, but both sit at the top; the reranker then reads the query and decides. Without fusion, B would be lost at rank 15.",
        "Recall@5 over 300 Romanised queries: 234 have the relevant document in the top 5 → 78%.",
      ],
    },
    code: {
      title: "The Punjabi query path",
      lang: "py",
      src: `def search_punjabi(query, limit=5):
    script = detect_script(query)                                  # lesson 46.3
    q_guru = transliterate_to_gurmukhi(query) if script in ("latn", "arab") else query
    q_vec = embed_model.encode([normalise(q_guru, "guru")], normalize_embeddings=True)[0]

    by_meaning = vector_index.search(q_vec, top_k=20)              # [(doc_id, score)]
    by_words = keyword_index.search(normalise(query, script), top_k=20) + keyword_index.search(normalise(q_guru, "guru"), top_k=20)

    fused = {}
    for ranking in (by_meaning, by_words):
        for rank, (doc_id, _) in enumerate(ranking, start=1):
            fused[doc_id] = fused.get(doc_id, 0.0) + 1.0 / (60 + rank)
    candidates = sorted(fused, key=fused.get, reverse=True)[:20]

    reranked = reranker.rank(q_guru, [docs[d]["text"] for d in candidates])     # multilingual cross-encoder
    top = [candidates[i] for i in reranked[:limit]]
    log_query(query, script, top)
    return [{"id": d, "lang": docs[d]["lang"], "title": docs[d]["title"]} for d in top]`,
      lines: [
        { code: "q_guru = transliterate_to_gurmukhi(query) if script in (\"latn\", \"arab\") else query", say: "Romanised and Shahmukhi queries are moved to Gurmukhi for the embedding path, where the model is strongest." },
        { code: "by_words = keyword_index.search(normalise(query, script), top_k=20) + keyword_index.search(normalise(q_guru, \"guru\"), top_k=20)", say: "Keyword search runs on both the original (for codes, names) and the transliterated form." },
        { code: "fused[doc_id] = fused.get(doc_id, 0.0) + 1.0 / (60 + rank)", say: "Reciprocal rank fusion, as in module 29." },
        { code: "reranked = reranker.rank(q_guru, [docs[d][\"text\"] for d in candidates])     # multilingual cross-encoder", say: "The reranker reads query and document together; multilingual ones handle a Gurmukhi query against an English page." },
        { code: "log_query(query, script, top)", say: "Logged with the script, so recall can be reported per script from real traffic." },
      ],
    },
    useIt: "Build Punjabi search as detect → transliterate → embed + keyword → fuse → rerank, with one normaliser and one versioned embedding model throughout. Evaluate recall@5 per query script on real queries, keep keyword search for identifiers, and log queries with their script to grow the evaluation set.",
    takeaways: ["Punjabi search needs script detection and transliteration in front of embeddings.", "Keep keyword search in parallel for codes and exact matches; fuse by reciprocal rank; rerank.", "One normaliser and one embedding model version for index and queries.", "Measure recall@5 per query script on real traffic."],
    terms: [["semantic search", "retrieval by meaning using embeddings"], ["hybrid search", "combining embedding and keyword rankings"], ["cross-encoder reranker", "a model that scores a query and a document read together"]],
    reflect: { q: "Why keep the original Romanised query for the keyword index when the embedding path uses the transliterated form?", a: "Codes, brand names and English words ('form 12A', 'Paytm', 'OTP') are typed exactly and should match exactly; transliterating them to Gurmukhi would mangle them. The embedding path wants meaning in Gurmukhi; the keyword path wants the user's literal text." },
  },

  "m45-punjabi-rag": {
    simple: "Punjabi RAG grounds answers in Punjabi or English documents: chunk Gurmukhi on its own sentence marks, retrieve with the Punjabi search path, generate in the user's script with citations, and evaluate retrieval and faithfulness per script.",
    concept:
      "**Retrieval-augmented generation for Punjabi** is module 28's pipeline with the Punjabi pieces inserted. Ingestion: Gurmukhi text is split into sentences on the danda (।) and question mark, not only on Latin full stops; chunks keep the heading context; each chunk is tagged with its language and script. Retrieval: the search path from lesson 45.8, which handles any query script. Generation: the cite-or-decline prompt in the user's script (lesson 45.6), with the rule that English sources may be answered in Punjabi and that English technical terms stay as written.\n\nEvaluation splits into retrieval recall per query script and answer quality per script: correctness, faithfulness to the sources (no claims beyond them), script correctness (Punjabi, not Hindi or Urdu), and decline behaviour on unanswerable questions. The most common Punjabi-specific failure is faithful-but-wrong-language: a correct answer in Hindi-flavoured Punjabi or in Urdu, which a judge must be told to penalise.",
    why:
      "RAG is how a Punjabi assistant becomes trustworthy with little Punjabi training data: the facts come from documents, the model only reads and writes. For a low-resource language this is the main route to accuracy, because fixing a document is easier than fixing a model, and a cited answer can be checked by a user who does not trust the machine.",
    how: [
      "Ingest: normalise; split Gurmukhi on ।, ?, ! and Shahmukhi on ۔, ؟; chunk by headings to ~300 tokens on the chosen tokeniser (fertility matters here); tag language and script; embed with the versioned Punjabi model.",
      "Retrieve with the hybrid, script-aware path; rerank; gate on a minimum score.",
      "Generate with numbered sources and the script-specific cite-or-decline instruction; cap output length allowing for Gurmukhi fertility.",
      "Post-check: a script classifier on the answer (Gurmukhi? Shahmukhi not Urdu?) with a retry or fallback if wrong.",
      "Evaluate: recall@5 per query script; judge-rated correctness, faithfulness and script per script; decline rate on unanswerable items.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Stage", "Punjabi-specific change", "Why"],
        rows: [
          ["chunking", "split on danda । and ؟; chunk size set in tokens of the chosen model", "Gurmukhi sentences do not end in '.'; fertility changes how much text fits"],
          ["indexing", "language + script tag per chunk; one normaliser", "filter and report by language; equal text must hash equal"],
          ["retrieval", "script detection, transliteration, hybrid, multilingual reranker", "queries arrive in three scripts"],
          ["generation", "reply script named ('Shahmukhi Punjabi, not Urdu'); English terms kept; decline allowed", "drift to Hindi/Urdu; invented answers"],
          ["post-check", "script classifier on the output; retry on failure", "a correct answer in the wrong language is a failure"],
          ["evaluation", "per script: recall, correctness, faithfulness, script, decline rate", "averages hide the Shahmukhi and Romanised gaps"],
        ],
      },
      caption: "The pipeline is module 28's; every row adds one Punjabi rule.",
    },
    everyday: {
      title: "Open-book, in the reader's language",
      text: "A tutor helps a student with an English textbook. The student asks in Punjabi; the tutor finds the page, explains it in Punjabi, keeps the technical English words, and says 'that is not in this book' when it is not. The tutor never answers from memory alone, and never slips into Hindi because the book is in English. That is Punjabi RAG done right.",
    },
    engineering: {
      title: "A hospital's Punjabi patient-information assistant",
      text: "A hospital built RAG over 900 patient leaflets (English, with 300 translated to Gurmukhi). Baseline evaluation on 450 real questions: recall@5 81% Gurmukhi, 58% Romanised; answer correctness 76%; faithfulness 88%; 19% of Gurmukhi answers contained Hindi vocabulary a reviewer flagged; 14% of unanswerable questions got invented answers. Fixes: sentence splitting on the danda (chunks had been cutting mid-sentence), transliteration for Romanised queries, the 'reply in Gurmukhi Punjabi; keep English medical terms' rule, a script post-check with one retry, and a decline rule. After: recall 86/79%, correctness 85%, faithfulness 95%, Hindi-vocabulary flags 4%, invented answers 3%. Dosage questions are routed to a human-reviewed path regardless.",
    },
    maths: {
      formula: "faithfulness = supported claims ÷ all claims in the answer;   script correctness = answers judged to be in the requested script ÷ all answers;   report both per query script",
      meaning: "Faithfulness counts how much of the answer is backed by the sources; script correctness counts how often the answer is actually Punjabi in the right script. Both are judged per answer and averaged.",
      worked: [
        "An answer makes 4 claims; the judge finds 3 supported by the cited sources, 1 not. Faithfulness for that answer = 3 ÷ 4 = 0.75.",
        "Over 150 Gurmukhi answers: 540 claims, 513 supported → faithfulness 0.95. Over 150 Romanised answers: 520 claims, 468 supported → 0.90; Romanised retrieval misses more, so the model fills gaps.",
        "Script correctness: 150 Shahmukhi answers, 131 judged Punjabi (not Urdu) → 0.87. The 19 failures are the drift problem, now a number.",
        "Decline rate on 60 unanswerable questions: 58 declined → 0.97; the other 2 are invented answers, reviewed by hand.",
      ],
    },
    code: {
      title: "Punjabi-aware sentence splitting and chunking",
      lang: "py",
      src: `import re

SENTENCE_END = re.compile(r"(?<=[।?!۔؟\\.])\\s+")         # danda, Latin and Urdu punctuation

def split_sentences(text):
    return [s.strip() for s in SENTENCE_END.split(text) if s.strip()]

def chunk_document(doc, tok, max_tokens=300, overlap_sentences=1):
    chunks = []
    for section in split_by_headings(doc["body"]):
        sentences = split_sentences(section["text"])
        buf, buf_tokens = [], 0
        for s in sentences:
            n = len(tok.encode(s, add_special_tokens=False))
            if buf and buf_tokens + n > max_tokens:
                chunks.append(make_chunk(doc, section, buf))
                buf, buf_tokens = buf[-overlap_sentences:], sum(len(tok.encode(x, add_special_tokens=False)) for x in buf[-overlap_sentences:])
            buf.append(s); buf_tokens += n
        if buf: chunks.append(make_chunk(doc, section, buf))
    return chunks

def make_chunk(doc, section, sentences):
    text = doc["title"] + " > " + section["heading"] + "\\n\\n" + " ".join(sentences)
    return {"doc_id": doc["id"], "lang": doc["lang"], "script": doc["script"], "text": normalise(text, doc["script"])}`,
      lines: [
        { code: "SENTENCE_END = re.compile(r\"(?<=[।?!۔؟\\.])\\s+\")         # danda, Latin and Urdu punctuation", say: "Gurmukhi sentences end in । and Shahmukhi in ۔; a splitter that only knows '.' produces chunks that cut mid-sentence." },
        { code: "n = len(tok.encode(s, add_special_tokens=False))", say: "Chunk size is measured in the generator's tokens, so Gurmukhi fertility is accounted for automatically." },
        { code: "buf, buf_tokens = buf[-overlap_sentences:], sum(len(tok.encode(x, add_special_tokens=False)) for x in buf[-overlap_sentences:])", say: "One sentence of overlap so a rule split across chunks is whole in one of them." },
        { code: "return {\"doc_id\": doc[\"id\"], \"lang\": doc[\"lang\"], \"script\": doc[\"script\"], \"text\": normalise(text, doc[\"script\"])}", say: "Language and script travel with the chunk; the text is normalised with the same function used on queries." },
      ],
    },
    useIt: "Build Punjabi RAG by adding script-aware chunking, retrieval, generation and post-checks to the standard pipeline; evaluate recall, correctness, faithfulness, script correctness and decline rate per query script; and route high-stakes questions (dosages, legal deadlines) to human-reviewed paths regardless of scores.",
    takeaways: ["Punjabi RAG = module 28 plus script rules at every stage.", "Chunk on Punjabi sentence marks and in the generator's tokens.", "Name the reply script, keep English terms, allow declining, and post-check the output script.", "Evaluate per script, including script correctness and decline rate."],
    terms: [["faithfulness", "the share of an answer's claims supported by its sources"], ["script correctness", "whether an answer is in the requested script and language"], ["post-check", "an automatic check on the model's output with a retry or fallback"]],
    reflect: { q: "Faithfulness is 95% but reviewers still flag many Gurmukhi answers. What are they likely flagging?", a: "Language quality rather than facts: Hindi vocabulary, unnatural register, wrong gender agreement. Faithfulness does not measure those; add script and fluency judgements (lesson 45.12) and fine-tune the generator on real Punjabi answers (lesson 45.10)." },
  },

  "m45-fine-tuning-multilingual-models": {
    simple: "Fine-tuning a multilingual model for Punjabi teaches it your task and your register with a few thousand examples, while mixing in other languages so it does not forget what it knew.",
    concept:
      "Module 21 covered fine-tuning in general; here the question is what changes for Punjabi. **Fine-tuning a multilingual model** on Punjabi data does three things: it teaches the task format (answer support questions, extract fields), it shifts the register (natural Punjabi instead of Hindi-flavoured translationese), and it strengthens the scripts the base model handled weakly. The data is instruction–response pairs: real Punjabi questions with native-speaker answers, per script, in the proportions of your traffic, plus a slice of English and Hindi pairs so the model's other abilities and its cross-lingual links do not decay (catastrophic forgetting, lesson 21.9).\n\nTwo decisions dominate. The base model: pick by tokeniser fit and harness scores, not size. The data mix: too little Punjabi and nothing changes; only Punjabi and the model forgets English, loses instruction-following, and sometimes starts answering English questions in Punjabi. A typical mix is 60–70% Punjabi across scripts, the rest English and Hindi, with explicit 'reply in the user's language' examples.",
    why:
      "Prompting and retrieval get a Punjabi assistant to 'correct'; fine-tuning gets it to 'sounds like us'. It removes Hindi vocabulary, fixes gender and honorific usage, teaches Romanised and Shahmukhi output, and cuts prompt length because the behaviour is in the weights. For a low-resource language it is also the only way to make a model fluent in forms it barely saw in pretraining.",
    how: [
      "Assemble 2,000–10,000 instruction–response pairs: real questions, native answers, per script in traffic proportions, with system prompts matching production.",
      "Add 30–40% English and Hindi pairs, including language-switch cases, to prevent forgetting.",
      "Format with the model's chat template; validate every example (script of the answer, length, no personal data).",
      "Train with LoRA (lesson 45.11) for a few epochs; validate on a held-out per-script set each epoch; stop when validation stops improving.",
      "Run the full harness (lesson 45.1) before and after; check English and Hindi scores for regression; ship with a version tag.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Data slice", "Share", "Purpose"],
        rows: [
          ["Gurmukhi Q&A, real, native answers", "35%", "task + register in the main script"],
          ["Romanised Q&A, real", "20%", "reading and writing Romanised Punjabi"],
          ["Shahmukhi Q&A, real", "10%", "Punjabi (not Urdu) output in Arabic script"],
          ["code-switched Q&A", "5%", "keeping English terms, handling mixed input"],
          ["English Q&A (same domain)", "20%", "prevent forgetting; cross-lingual link"],
          ["Hindi Q&A", "5%", "prevent forgetting; reduce confusion between Hindi and Punjabi by contrast"],
          ["language-switch examples", "5%", "'reply in the language the user wrote in'"],
        ],
      },
      caption: "A mix like this keeps the model multilingual while making it Punjabi-fluent. Adjust shares to your traffic.",
    },
    everyday: {
      title: "Learning the house style",
      text: "A new support agent who speaks Punjabi still sounds like a textbook on day one: too formal, Hindi words, wrong honorifics. After reading a few thousand of the team's best replies, they sound like the team. They do not forget English in the process, because half the queue is still English. Fine-tuning is that reading of the best replies, with the English queue kept in view.",
    },
    engineering: {
      title: "Removing Hindi from a Punjabi assistant",
      text: "A retail assistant's Gurmukhi replies were rated 3.4/5 for naturalness; reviewers flagged Hindi vocabulary in 26% of replies and wrong gender agreement in 11%. The team fine-tuned the base model with LoRA on 6,500 real Q&A pairs (4,200 Gurmukhi, 1,300 Romanised, 400 Shahmukhi, 600 English) for three epochs. Naturalness rose to 4.4, Hindi flags fell to 5%, gender errors to 2%; the English harness scores moved by less than one point. A first attempt with Punjabi-only data had raised naturalness to 4.5 but dropped English instruction-following by 9 points and made the model reply in Punjabi to some English questions; the English slice fixed it.",
    },
    maths: {
      formula: "validation loss per script, per epoch;  stop at the epoch where held-out Punjabi loss is lowest while English loss has not risen more than a tolerance",
      meaning: "Track loss on held-out examples separately per language. Punjabi loss falling is the gain; English loss rising is forgetting. The stopping rule balances them.",
      worked: [
        "Held-out losses (lower is better). Epoch 0 (base): Gurmukhi 2.41, Romanised 2.88, English 1.62.",
        "Epoch 1: 1.95, 2.30, 1.63. Epoch 2: 1.78, 2.11, 1.66. Epoch 3: 1.72, 2.05, 1.74. Epoch 4: 1.71, 2.04, 1.85.",
        "Tolerance for English: +0.08. Epoch 2 is the last within tolerance (1.66 vs 1.62) with most of the Punjabi gain; epochs 3 and 4 trade English for tiny Punjabi improvements. Choose epoch 2.",
        "Confirm with the harness: Punjabi judge score up 1.1 points, English unchanged, which the losses predicted.",
      ],
    },
    code: {
      title: "Format and validate the fine-tuning set",
      lang: "py",
      src: `import json, re
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained(BASE_MODEL)
GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")
ARABIC = re.compile(r"[\\u0600-\\u06FF]")

def script_of(text):
    if GURMUKHI.search(text): return "guru"
    if ARABIC.search(text): return "arab"
    return "latn"

rows, dropped = [], 0
for ex in examples:                                   # {system, question, answer, expected_script}
    if script_of(ex["answer"]) != ex["expected_script"]:
        dropped += 1; continue                        # an answer in the wrong script would teach drift
    messages = [{"role": "system", "content": ex["system"]}, {"role": "user", "content": ex["question"]}, {"role": "assistant", "content": ex["answer"]}]
    text = tok.apply_chat_template(messages, tokenize=False)
    if len(tok.encode(text)) > 1024:
        dropped += 1; continue
    rows.append({"text": text, "script": ex["expected_script"], "lang": ex.get("lang", "pa")})

with open("sft_punjabi_v3.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\\n")
print(len(rows), "examples;", dropped, "dropped;", {s: sum(1 for r in rows if r["script"] == s) for s in ("guru", "arab", "latn")})`,
      lines: [
        { code: "if script_of(ex[\"answer\"]) != ex[\"expected_script\"]:", say: "Every answer is checked for its script. A Gurmukhi question answered in Hindi or Roman letters in the training data teaches exactly the drift you are trying to remove." },
        { code: "text = tok.apply_chat_template(messages, tokenize=False)", say: "The base model's own chat template, so the fine-tuned format matches how it will be called in production." },
        { code: "if len(tok.encode(text)) > 1024:", say: "Length in the model's tokens; Gurmukhi examples are longer in tokens than they look." },
        { code: "print(len(rows), \"examples;\", dropped, \"dropped;\", {s: sum(1 for r in rows if r[\"script\"] == s) for s in (\"guru\", \"arab\", \"latn\")})", say: "The script mix of the final set, checked against the target mix before training starts." },
      ],
      note: "The English and Hindi slices go through the same validation with their own expected scripts.",
    },
    useIt: "Fine-tune when prompting and retrieval leave the assistant correct but unnatural, or when Romanised and Shahmukhi output is weak: real Punjabi pairs per script in traffic proportions, an English and Hindi slice against forgetting, LoRA, per-script validation losses, and the full harness before and after.",
    takeaways: ["Fine-tuning teaches task, register and weak scripts; it needs real Punjabi pairs, not translated ones.", "Mix in English and Hindi to prevent forgetting and language confusion.", "Validate answers' scripts in the training data; watch per-language validation loss.", "Run the harness before and after; regressions in English count as failures."],
    terms: [["instruction–response pair", "a training example of a prompt and the ideal answer"], ["data mix", "the shares of languages and scripts in the fine-tuning set"], ["chat template", "the model's format for system, user and assistant turns"]],
    reflect: { q: "After fine-tuning on Punjabi only, the model answers some English questions in Punjabi. Why, and what fixes it?", a: "It learned that answers are in Punjabi, regardless of the question's language, because every example said so; and it partly forgot English. Add English examples and explicit language-switch examples ('reply in the user's language'), and keep English scores as a regression gate." },
  },

  "m45-lora-fine-tuning-for-punjabi": {
    simple: "LoRA lets you fine-tune a large multilingual model for Punjabi on one modest GPU by training small added matrices; the Punjabi-specific choices are the target layers, rank, data mix and, if needed, vocabulary extension first.",
    concept:
      "Module 22 explained **LoRA**: instead of updating all of a model's weights, train small low-rank matrices added to chosen layers, a fraction of a percent of the parameters, and merge or load them at inference. For Punjabi the mechanics are the same; the choices differ. Target modules: include the attention projections and the feed-forward layers, because register and vocabulary changes live in both. Rank: 16–64 is usual; Punjabi tends to need the higher end because it is changing the model's language behaviour, not just its format. Learning rate and epochs: conservative, with per-script validation. Quantised base (QLoRA) when the GPU is small: a 7–8B model trains on a single 24 GB card.\n\nIf the tokeniser shreds Gurmukhi (lesson 45.2), LoRA on the attention layers cannot fix it; extend the vocabulary and train the new embeddings first (lesson 43.6), then LoRA. Embedding rows for new tokens must be trainable, which LoRA alone does not make them.",
    why:
      "Full fine-tuning of a multilingual model is out of reach for most Punjabi teams: it needs many large GPUs and risks forgetting. LoRA makes fine-tuning a few-hundred-rupee experiment that can be repeated weekly as data grows, and its adapters are small files that can be swapped per script or domain. It is the practical route to a model that is fluent in your users' Punjabi.",
    how: [
      "Check tokeniser fit; extend vocabulary and train new embeddings first if fertility or cluster splits are bad.",
      "Load the base model (4-bit quantised if memory is tight); configure LoRA on attention and feed-forward modules, rank 32, alpha 64, dropout 0.05.",
      "Train on the validated Punjabi mix (lesson 45.10) for 2–4 epochs with a small learning rate; evaluate per-script validation loss each epoch.",
      "Merge the adapter into the base weights for serving, or keep adapters separate to swap by script or domain.",
      "Run the harness; keep the adapter, its data version and its scores together.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Setting", "Typical Punjabi choice", "Why"],
        rows: [
          ["target modules", "q, k, v, o projections + gate/up/down (feed-forward)", "vocabulary and register need the feed-forward layers, not only attention"],
          ["rank r", "32 (16–64)", "language behaviour is a bigger change than format"],
          ["alpha", "2 × r", "a common scaling; tune with validation"],
          ["learning rate", "1e-4 to 2e-4", "conservative to limit forgetting"],
          ["epochs", "2–4, early stop on per-script loss", "overfitting shows first in English loss rising"],
          ["quantisation", "4-bit base (QLoRA) on 24 GB; 16-bit on 80 GB", "fits one GPU; small quality cost"],
          ["trainable extras", "new embedding rows if vocabulary was extended", "LoRA alone leaves them frozen"],
        ],
      },
      caption: "Starting points, not laws; the per-script validation loss decides.",
    },
    everyday: {
      title: "Adjusting a suit instead of tailoring a new one",
      text: "A well-made suit nearly fits; a tailor takes in the waist and shortens the sleeves in an hour instead of making a new suit over weeks. LoRA is the alteration: small, targeted changes to a model that already mostly fits, done on a small machine. If the suit is the wrong size entirely (a tokeniser that cannot read Gurmukhi), alterations will not save it; that is the vocabulary extension step first.",
    },
    engineering: {
      title: "A Punjabi support model on a single GPU",
      text: "A team with one 24 GB GPU fine-tuned an 8B open-weight multilingual model for Gurmukhi and Romanised support. Tokeniser fertility was 1.9, acceptable without extension. QLoRA with rank 32 on all attention and feed-forward modules, 6,500 examples, three epochs, took five hours. Judge-rated naturalness rose from 3.5 to 4.3, Romanised output accuracy from 71% to 84%, English harness scores unchanged. The adapter is 180 MB; a second adapter trained later on 900 Shahmukhi examples is loaded only for Shahmukhi requests. Each adapter is stored with its data version and harness report.",
    },
    maths: {
      formula: "trainable parameters per adapted matrix = r × (d_in + d_out);   full matrix = d_in × d_out;   share = r (d_in + d_out) ÷ (d_in d_out)",
      meaning: "LoRA trains two thin matrices whose product has rank r. For big square matrices the share is tiny, which is why it fits on one GPU.",
      worked: [
        "An attention projection with d_in = d_out = 4,096. Full: 4,096 × 4,096 ≈ 16.8 million parameters.",
        "LoRA rank 32: 32 × (4,096 + 4,096) = 262,144 parameters, about 1.6% of the matrix.",
        "Across, say, 32 layers × 7 adapted matrices of similar size: ≈ 59 million trainable parameters against 8 billion in the model: under 1%.",
        "Optimizer memory scales with trainable parameters, so training fits on a 24 GB card with the base model in 4-bit (about 5 GB) plus activations.",
      ],
    },
    code: {
      title: "QLoRA fine-tuning for Punjabi",
      lang: "py",
      src: `import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset

BASE = "your-open-weight-multilingual-8b"
tok = AutoTokenizer.from_pretrained(BASE)
quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)
model = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=quant, device_map="auto")
model = prepare_model_for_kbit_training(model)

lora = LoraConfig(r=32, lora_alpha=64, lora_dropout=0.05, task_type="CAUSAL_LM",
                  target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
model = get_peft_model(model, lora)
model.print_trainable_parameters()

data = load_dataset("json", data_files={"train": "sft_punjabi_v3.jsonl", "validation": "sft_punjabi_v3_dev.jsonl"})
args = TrainingArguments(output_dir="pa-lora-v3", num_train_epochs=3, per_device_train_batch_size=4, gradient_accumulation_steps=8,
                         learning_rate=1.5e-4, bf16=True, eval_strategy="epoch", save_strategy="epoch", logging_steps=20, load_best_model_at_end=True)
trainer = SFTTrainer(model=model, args=args, train_dataset=data["train"], eval_dataset=data["validation"], processing_class=tok, dataset_text_field="text")
trainer.train()
model.save_pretrained("pa-lora-v3/adapter")`,
      lines: [
        { code: "quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type=\"nf4\", bnb_4bit_compute_dtype=torch.bfloat16)", say: "The base model is loaded in 4-bit so an 8B model fits a 24 GB GPU; compute happens in bfloat16." },
        { code: "target_modules=[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\", \"gate_proj\", \"up_proj\", \"down_proj\"])", say: "Attention and feed-forward modules both get adapters; Punjabi register lives in both." },
        { code: "model.print_trainable_parameters()", say: "Expect under 1% trainable. If vocabulary was extended, also unfreeze the embedding and output rows." },
        { code: "learning_rate=1.5e-4, bf16=True, eval_strategy=\"epoch\", save_strategy=\"epoch\", logging_steps=20, load_best_model_at_end=True)", say: "Evaluate each epoch and keep the best; add a per-script loss callback so English regression is visible." },
        { code: "model.save_pretrained(\"pa-lora-v3/adapter\")", say: "The adapter alone, a few hundred megabytes, versioned with its data and harness report." },
      ],
      note: "Module names differ between model families; check the model's architecture for the right projection names.",
    },
    useIt: "Use LoRA (or QLoRA on small GPUs) for every Punjabi fine-tune: adapters on attention and feed-forward layers, rank around 32, conservative learning rate, per-script validation, vocabulary extension first if the tokeniser is poor. Keep adapters versioned and swappable by script or domain.",
    takeaways: ["LoRA trains under 1% of parameters; QLoRA fits an 8B model on one 24 GB GPU.", "For Punjabi, adapt feed-forward layers too and use a higher rank; validate per script.", "A bad tokeniser is not fixed by LoRA: extend the vocabulary and train its embeddings first.", "Adapters are small, versioned, and can be swapped per script or domain."],
    terms: [["LoRA adapter", "the small trained matrices added to a model's layers"], ["QLoRA", "LoRA on a 4-bit quantised base model to save memory"], ["target modules", "the layers that receive adapters"]],
    reflect: { q: "Fertility is 4.6 and LoRA fine-tuning barely improves Gurmukhi quality. What was missed?", a: "The representation: the tokeniser shreds Gurmukhi, and adapters on attention and feed-forward layers cannot change how text is cut or give fragment tokens meaning. Extend the vocabulary with Punjabi pieces, train the new embedding rows on Punjabi text, then apply LoRA." },
  },

  "m45-evaluating-punjabi-model-quality": {
    simple: "Punjabi model quality is a report card per script: automatic scores where they exist, a calibrated judge in Punjabi for prose, human ratings for the sample, and the failure modes that matter counted explicitly.",
    concept:
      "Earlier lessons each had a metric; **evaluating Punjabi model quality** combines them into one report that the team and the product can act on. For each script (Gurmukhi, Shahmukhi, Romanised) and each task: an automatic score (chrF, accuracy, F1, recall), a judge score for free-form answers, and a human rating on a fixed sample. On top of these, four Punjabi-specific checks counted as rates: wrong-script or wrong-language output (Hindi, Urdu, English when Punjabi was requested); Hindi or Urdu vocabulary intrusion flagged by reviewers; unnatural register (translationese); and invented answers on unanswerable questions.\n\nThe judge model needs a Punjabi rubric and calibration: a native speaker grades 100 answers, the judge grades the same 100, and the rubric is revised until agreement is strong (module 37). Judges tend to be lenient about Hindi vocabulary and register unless the rubric names them. Finally, scores carry sample sizes and the gold set version, and the report is produced by one script so it can be rerun on every change.",
    why:
      "A single accuracy number hides exactly the failures Punjabi users notice: a correct answer in Urdu, a fluent reply full of Hindi words, a polite invention. The report card makes each of those a number per script, so a release can be judged, a regression caught, and the next investment chosen with evidence. It is also what lets the team answer honestly when asked 'how good is the Punjabi?'.",
    how: [
      "Assemble the gold sets per task and script with their versions (module 44).",
      "Run automatic scorers per task; run the judge with the Punjabi rubric on generative tasks; sample 100 items per script for human ratings.",
      "Count the Punjabi-specific failure rates: wrong script/language, vocabulary intrusion, register, invented answers.",
      "Calibrate the judge quarterly against human grades; report the agreement.",
      "Produce one report with all numbers, sample sizes and versions; make it the release gate with thresholds per script.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Measure", "Gurmukhi", "Shahmukhi", "Romanised", "Threshold"],
        rows: [
          ["intent accuracy (n = 500 each)", "90%", "82%", "84%", "≥ 80%"],
          ["QA correctness, judge (n = 300)", "85%", "74%", "78%", "≥ 75%"],
          ["faithfulness (claims supported)", "95%", "92%", "91%", "≥ 90%"],
          ["wrong script / language rate", "1%", "9%", "3%", "≤ 5%"],
          ["Hindi/Urdu vocabulary intrusion (human sample)", "4%", "11%", "6%", "≤ 8%"],
          ["invented answers on unanswerable (n = 60)", "3%", "7%", "5%", "≤ 5%"],
          ["naturalness, human (1–5, n = 100)", "4.4", "3.8", "4.1", "≥ 4.0"],
          ["judge–human agreement (κ)", "0.81", "0.74", "0.79", "≥ 0.75"],
        ],
      },
      caption: "The Shahmukhi column fails four thresholds: that is the release decision and the next quarter's work, in one table.",
    },
    everyday: {
      title: "A school report, not a single grade",
      text: "A report that says '78%' tells a parent nothing. One that says 'maths strong, essay writing weak, keeps switching to Hindi in Punjabi class, excellent at admitting when unsure' tells them what to do. The per-script report card is the second kind: a list of specific strengths and failures with numbers, for each script, so the next term's work is obvious.",
    },
    engineering: {
      title: "The release that the report stopped",
      text: "A new model version scored two points higher on the average of all Punjabi tests, and the team planned to ship. The report card showed why the average rose: Gurmukhi correctness up 5, Romanised up 3, Shahmukhi down 6, with the wrong-language rate for Shahmukhi doubling to 14% because the new base model defaulted to Urdu more often. The release was held for Shahmukhi, which stayed on the previous version behind the script router, while Gurmukhi and Romanised shipped. A Shahmukhi adapter fixed the regression three weeks later. Without per-script numbers the regression would have shipped inside a better average.",
    },
    maths: {
      formula: "weighted quality = Σ over scripts of (share of traffic in script × score in script);  but gate on each script's own thresholds, never on the weighted number alone",
      meaning: "A traffic-weighted score is useful for trend lines; it must not be the gate, because a minority script can fail completely while the weighted score barely moves.",
      worked: [
        "Traffic: Gurmukhi 45%, Romanised 40%, Shahmukhi 15%. Correctness: 85%, 78%, 74%. Weighted = 0.45×85 + 0.40×78 + 0.15×74 = 38.25 + 31.2 + 11.1 = 80.55.",
        "Shahmukhi drops to 60% after a regression: weighted = 38.25 + 31.2 + 9.0 = 78.45, a 2-point fall that looks minor.",
        "Per-script gate: Shahmukhi 60% < 75% threshold → fail. The gate catches what the weighted number softens.",
        "Judge calibration: κ between judge and human on 100 Shahmukhi answers = 0.74, just under threshold; re-check the rubric's handling of Urdu vocabulary before trusting the Shahmukhi judge scores.",
      ],
    },
    code: {
      title: "A Punjabi judge with a calibrated rubric and the report assembly",
      lang: "py",
      src: `RUBRIC = """You are grading an assistant's answer to a Punjabi question. Grade strictly.
1. correct: does the answer give the right information according to the reference? (yes/partly/no)
2. faithful: are all claims supported by the provided sources? (yes/no)
3. script_ok: is the answer written in the requested script and language? Hindi words in Gurmukhi text, Urdu words or Urdu grammar in Shahmukhi text, or a reply in English when Punjabi was requested all count as NO.
4. natural: does it read like a native Punjabi speaker wrote it (not translated from English or Hindi)? (1-5)
Output JSON with these four fields and a one-line reason."""

def judge(question, answer, reference, sources, script):
    reply = client.messages.create(model=MODEL_JUDGE, max_tokens=200, temperature=0, system=RUBRIC,
        tools=[verdict_tool], tool_choice={"type": "tool", "name": "verdict"},
        messages=[{"role": "user", "content": f"<script>{script}</script><question>{question}</question><reference>{reference}</reference><sources>{sources}</sources><answer>{answer}</answer>"}])
    return next(b for b in reply.content if b.type == "tool_use").input

def report(results):                                   # results: list of judge outputs with script
    out = {}
    for script in ("guru", "arab", "latn"):
        rs = [r for r in results if r["script"] == script]
        n = len(rs)
        out[script] = {"n": n,
                       "correct": round(sum(1 for r in rs if r["correct"] == "yes") / n, 3),
                       "faithful": round(sum(1 for r in rs if r["faithful"] == "yes") / n, 3),
                       "wrong_script_rate": round(sum(1 for r in rs if r["script_ok"] == "no") / n, 3),
                       "natural_mean": round(sum(r["natural"] for r in rs) / n, 2)}
    return out`,
      lines: [
        { code: "3. script_ok: is the answer written in the requested script and language? Hindi words in Gurmukhi text, Urdu words or Urdu grammar in Shahmukhi text, or a reply in English when Punjabi was requested all count as NO.", say: "The rubric names the Punjabi failures explicitly; a judge left to its own judgement is lenient about them." },
        { code: "4. natural: does it read like a native Punjabi speaker wrote it (not translated from English or Hindi)? (1-5)", say: "Register as a graded field, calibrated against native-speaker ratings before it is trusted." },
        { code: "tools=[verdict_tool], tool_choice={\"type\": \"tool\", \"name\": \"verdict\"},", say: "Structured verdicts, so the report is computed, not parsed." },
        { code: "\"wrong_script_rate\": round(sum(1 for r in rs if r[\"script_ok\"] == \"no\") / n, 3),", say: "The wrong-script rate per script: the number that stopped the release in the story above." },
      ],
      note: "Calibrate: run the judge on 100 human-graded answers per script, compute kappa, revise the rubric until it passes; repeat each quarter.",
    },
    useIt: "Produce the per-script report card for every model, prompt or data change, with automatic scores, calibrated judge scores, human samples and the four Punjabi failure rates; gate releases on per-script thresholds, never on an average; and keep the judge calibrated against native speakers.",
    takeaways: ["Quality is a report card per script, not a number.", "Count wrong-script output, vocabulary intrusion, register and invented answers explicitly.", "Calibrate the judge with a Punjabi rubric against native-speaker grades; report kappa.", "Gate on per-script thresholds; weighted averages hide minority-script regressions."],
    terms: [["report card", "the per-script, per-task table of scores, rates and sample sizes"], ["judge calibration", "checking a judge model's grades against human grades and revising the rubric"], ["vocabulary intrusion", "words from Hindi or Urdu appearing in Punjabi output"]],
    reflect: { q: "The judge agrees with humans at κ 0.81 on Gurmukhi but 0.62 on Shahmukhi. Can you use the Shahmukhi judge scores?", a: "Not as a gate. The judge is probably failing to detect Urdu intrusion; add explicit Urdu-versus-Punjabi examples to the rubric, consider a separate Punjabi-versus-Urdu classifier as a hard check, and rely on human ratings for Shahmukhi until kappa passes." },
  },

  "m45-comparing-gurmukhi-shahmukhi-and-romanised-performance": {
    simple: "Comparing the three written forms side by side shows where a Punjabi system is weak and why; the fix differs per form, and transliteration pivots are the experiment that tells you which fix.",
    concept:
      "The three forms of Punjabi behave as three different languages inside most models. **Comparing Gurmukhi, Shahmukhi and Romanised performance** is the analysis that explains the report card's columns. The usual pattern: Gurmukhi is best because it has the most data and benchmarks; Shahmukhi is undermined by Urdu, which the model knows better and defaults to; Romanised is undermined by English, whose tokens it borrows, and by spelling chaos.\n\nThe diagnostic tool is the **transliteration pivot**: take the same test questions, transliterate Romanised and Shahmukhi inputs to Gurmukhi before the model, and compare scores with and without the pivot. If the pivot recovers most of the gap, the model's problem is reading the script, and transliteration at the input is the fix. If the pivot does not help, the problem is elsewhere: output generation in that script, missing domain knowledge, or dialect. Do the same for output: generate in Gurmukhi and transliterate out, versus generating directly in the target script.\n\nThe comparison also feeds product decisions: which scripts get machine-only paths, which get a human fallback, and where data collection money goes next.",
    why:
      "Without the comparison, teams either overfit to Gurmukhi (the only form with public benchmarks) and ship something most users cannot use well, or they spend on fine-tuning when a transliteration step would have fixed the input side for free. The pivot experiment costs a day and routinely changes the roadmap.",
    how: [
      "Take the per-script gold sets with the same questions in all three forms where possible.",
      "Run the baseline: each form processed directly. Record per-script scores.",
      "Run the input pivot: Romanised and Shahmukhi transliterated to Gurmukhi before the model; same scoring.",
      "Run the output pivot: generate in Gurmukhi, transliterate to the user's script; score script correctness and naturalness.",
      "Attribute each gap to input reading, output generation or knowledge; choose the fix per form: transliteration, fine-tuning, data, or routing to a different model.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Form", "Direct (illustrative)", "Input pivot to Gurmukhi", "Output pivot from Gurmukhi", "Diagnosis", "Fix"],
        rows: [
          ["Gurmukhi", "85%", "—", "—", "baseline", "fine-tune for register; more data"],
          ["Shahmukhi", "71%", "79%", "script-correct 97% but naturalness 3.4", "reading is half the gap; direct generation drifts to Urdu; transliterated output lacks vowels/dialect", "input pivot + Shahmukhi adapter for output"],
          ["Romanised", "66%", "81%", "script-correct 99%, naturalness 4.0 (users accept)", "mostly a reading problem", "input pivot; output via transliteration is acceptable"],
        ],
      },
      caption: "The pivots split each gap into reading, writing and knowing. The fixes differ, and so do their costs.",
    },
    everyday: {
      title: "Three doors to the same room",
      text: "A clinic has three entrances. The Gurmukhi door is wide and signposted; the Shahmukhi door is hidden behind an Urdu sign, so people walk into the wrong clinic; the Romanised door has no sign at all, so people guess. Inside, the same doctor waits. Transliteration is putting a proper sign on each door and a corridor to the same room. Whether the doctor then speaks your dialect is a separate matter, which is the output-side question.",
    },
    engineering: {
      title: "The pivot experiment that saved a fine-tune",
      text: "A team planned a Romanised fine-tune after Romanised QA scored 15 points below Gurmukhi. The input-pivot experiment (transliterate Romanised questions to Gurmukhi with a model trained on 50,000 chat pairs) recovered 12 of the 15 points in one day. The fine-tune was cancelled; the transliterator was improved instead. For Shahmukhi, the pivot recovered only 8 of 14 points and transliterated output was rated unnatural, so a Shahmukhi output adapter was trained. The budget went where the experiment said, and the Romanised fine-tuning data was repurposed as transliteration pairs.",
    },
    maths: {
      formula: "gap(form) = score(Gurmukhi) − score(form);   recovered by input pivot = score(pivot) − score(direct);   residual = gap − recovered",
      meaning: "The recovered part is what transliteration fixes (a reading problem); the residual points at generation, knowledge or dialect.",
      worked: [
        "Romanised: gap = 85 − 66 = 19. Pivot score 81: recovered = 81 − 66 = 15; residual = 4. Reading problem; transliteration is the fix.",
        "Shahmukhi: gap = 85 − 71 = 14. Pivot 79: recovered = 8; residual = 6. Half reading, half elsewhere; check output drift and dialect vocabulary.",
        "Cost comparison: a transliterator is one cheap model call per query; a fine-tune is days of work and a GPU. Spend on the residual, not the recovered part.",
        "Repeat after each change; the gaps move, and so do the fixes.",
      ],
    },
    code: {
      title: "The pivot experiment",
      lang: "py",
      src: `def run(items, mode):
    scores = []
    for q, ref, script in items:                      # the same questions in each form
        q_in = q
        if mode in ("input_pivot", "both") and script in ("latn", "arab"):
            q_in = transliterate_to_gurmukhi(q)
        out_script = "guru" if mode in ("output_pivot", "both") else script
        answer = assistant(q_in, reply_script=out_script)
        if mode in ("output_pivot", "both") and script != "guru":
            answer = transliterate_from_gurmukhi(answer, to=script)
        scores.append(judge_correct(answer, ref))
    return round(sum(scores) / len(scores), 3)

for script in ("guru", "arab", "latn"):
    items = gold[script]
    direct = run(items, "direct")
    in_pivot = run(items, "input_pivot") if script != "guru" else direct
    out_pivot = run(items, "output_pivot") if script != "guru" else direct
    print(script, "direct", direct, "input pivot", in_pivot, "output pivot", out_pivot, "recovered", round(in_pivot - direct, 3))`,
      lines: [
        { code: "q_in = transliterate_to_gurmukhi(q)", say: "The input pivot: the model reads Gurmukhi instead of the user's script." },
        { code: "out_script = \"guru\" if mode in (\"output_pivot\", \"both\") else script", say: "The output pivot: the model writes Gurmukhi and a transliterator produces the user's script." },
        { code: "answer = transliterate_from_gurmukhi(answer, to=script)", say: "Gurmukhi → Shahmukhi needs vowel handling and dialect vocabulary; Gurmukhi → Roman is rules. Judge naturalness separately." },
        { code: "print(script, \"direct\", direct, \"input pivot\", in_pivot, \"output pivot\", out_pivot, \"recovered\", round(in_pivot - direct, 3))", say: "The recovered column is the decision: large means transliterate, small means fine-tune or collect data." },
      ],
    },
    useIt: "Run the pivot experiment whenever a script lags: it tells you whether to add transliteration at the input, train an output adapter, collect data, or route to another model. Keep the three-column view in every report, and plan data collection by residual gap times traffic share.",
    takeaways: ["The three forms fail for different reasons: Gurmukhi lacks data, Shahmukhi is pulled toward Urdu, Romanised borrows English tokens and has no spelling.", "Input and output transliteration pivots split each gap into reading, writing and knowledge.", "Transliteration fixes reading cheaply; adapters and data fix writing and knowledge.", "Decide and budget per form; re-run after every change."],
    terms: [["transliteration pivot", "processing a script via Gurmukhi by transliterating at the input or output"], ["recovered gap", "the part of a script's deficit removed by the pivot"], ["residual gap", "the deficit left after the pivot, pointing at generation, knowledge or dialect"]],
    reflect: { q: "The output pivot gives Shahmukhi answers that are script-correct 97% of the time but rated unnatural. Why, and what do you do?", a: "Rule transliteration from Gurmukhi produces Shahmukhi with eastern vocabulary and sometimes wrong vowel handling; it is Punjabi but not how Lahore writes. Train a small Shahmukhi output adapter on real Shahmukhi answers, or add a dialect-aware post-editor, and keep the input pivot for reading." },
  },
};

export const M45_QUIZ: Quiz[] = [
  {
    q: "Three models are candidates for a Punjabi assistant. What is the first thing to run?",
    options: ["A demo with a few questions", "Tokeniser analysis per script, then the harness on gold sets per script and task", "A fine-tune of each", "A survey of users"],
    answer: 1,
    why: ["Demos hide the Shahmukhi and Romanised gaps.", "Correct. Fertility and cluster splits rule models out in an hour; the harness decides per task and script.", "Fine-tuning before measuring wastes GPU and labels.", "Users cannot tell you tokeniser fertility."],
    reason: true,
  },
  {
    q: "Why is chrF preferred over BLEU for Punjabi translation?",
    options: ["It is faster", "It scores character n-grams, so spelling variants and morphology still get credit", "BLEU does not support Unicode", "chrF ignores references"],
    answer: 1,
    why: ["Speed is similar.", "Correct. Word-level BLEU gives near zero to valid paraphrases with variant spellings.", "It does.", "It needs references like BLEU."],
  },
  {
    q: "A sentiment model labels 'ਬਹੁਤ ਵਧੀਆ ਸਰਵਿਸ, ਤਿੰਨ ਦਿਨ ਤੋਂ ਕੋਈ ਜਵਾਬ ਨਹੀਂ' positive. What is the fix?",
    options: ["Lower the temperature", "Add sarcasm rules to the guidelines and sarcastic examples to the training data; watch the negative→positive cell", "Remove the word ਵਧੀਆ", "Use an English sentiment model"],
    answer: 1,
    why: ["Sampling is not the cause.", "Correct. The surface words mislead; labelled sarcasm teaches the model, and the confusion matrix tracks it.", "ਵਧੀਆ is sincere praise most of the time.", "English models do not know Punjabi sarcasm."],
  },
  {
    q: "English → Shahmukhi output reads fluently but a Lahore reviewer says it is Urdu. Which check belongs in the harness?",
    options: ["chrF only", "A Punjabi-versus-Urdu classifier and function-word count on outputs, as a hard failure", "Spell check", "Nothing; fluent is enough"],
    answer: 1,
    why: ["chrF cannot see the language switch.", "Correct. Script correctness is a first-class metric for Shahmukhi.", "Spelling is fine; the language is wrong.", "Users notice immediately."],
  },
  {
    q: "After fine-tuning the embedding model on Punjabi pairs, English retrieval dropped 6 points. What prevents this?",
    options: ["More Punjabi pairs", "An English and Hindi slice in the training pairs, fewer epochs, and an English alignment regression gate", "A bigger model", "Removing Romanised pairs"],
    answer: 1,
    why: ["More Punjabi-only data worsens forgetting.", "Correct. Keep other languages in the mix and gate on their scores.", "Size does not stop forgetting.", "Romanised pairs are the most valuable ones."],
    reason: true,
  },
  {
    q: "Why keep keyword search alongside embeddings in Punjabi semantic search?",
    options: ["Embeddings are slow", "Codes, names and English terms are typed exactly and embed badly; fusion keeps them findable", "Keyword search is always better", "Embeddings do not work on Gurmukhi"],
    answer: 1,
    why: ["Speed is not the reason.", "Correct. 'form 12A' and brand names need exact matching; reciprocal rank fusion combines both.", "It misses meaning.", "They work, especially after fine-tuning."],
  },
  {
    q: "Gurmukhi fertility is 4.6 and LoRA fine-tuning barely helps. What was skipped?",
    options: ["A higher learning rate", "Vocabulary extension with trained embeddings before LoRA", "More epochs", "A bigger rank"],
    answer: 1,
    why: ["The problem is representation, not step size.", "Correct. LoRA on attention and feed-forward layers cannot fix how text is cut into fragments.", "More epochs overfit the same fragments.", "Rank does not change the tokeniser."],
  },
  {
    q: "A new model raises the average Punjabi score by 2 points but Shahmukhi falls 6 with wrong-language output doubling. Ship?",
    options: ["Yes, the average improved", "Ship for Gurmukhi and Romanised behind the script router; hold Shahmukhi on the previous version until fixed", "No, hold everything", "Yes, Shahmukhi is a minority"],
    answer: 1,
    why: ["Averages hide minority-script regressions.", "Correct. Per-script gates and routing make partial releases possible.", "Two scripts improved; routing lets them ship.", "Minority users are users."],
  },
  {
    q: "The input pivot recovers 15 of a 19-point Romanised gap. What is the fix?",
    options: ["A Romanised fine-tune", "Transliteration at the input; spend the fine-tuning budget on the 4-point residual or elsewhere", "Collect more Romanised data first", "Route Romanised users to Gurmukhi keyboards"],
    answer: 1,
    why: ["The experiment says reading was the problem; transliteration fixes it cheaply.", "Correct. Spend on the residual, not the recovered part.", "Data may help later; the cheap fix comes first.", "Users will not change how they type."],
  },
];

export const M45_EXERCISES: Exercise[] = [
  {
    title: "Design the harness table",
    kind: "think",
    task: "For a Punjabi banking assistant that must classify intents, answer questions from policy documents, and translate notices, list the harness columns (task × script), the scorer for each, the sample size per cell, and the three Punjabi-specific rates you will add. Say which cells could justify routing to different models.",
    hints: ["Every task runs per script.", "Free-form answers need a calibrated judge; translation needs chrF plus human ratings."],
    solution: "Columns: intent accuracy and macro-F1 (Guru, Arab, Latn; 500 each); QA correctness, faithfulness, script correctness (judge, 300 each) plus decline rate on 60 unanswerable each; translation chrF en→pa_Guru, pa_Guru→en, en→pnb_Arab (800 references each) plus adequacy/fluency on 100. Added rates: wrong-script/language, Hindi/Urdu vocabulary intrusion (human sample), invented answers. Routing: the Shahmukhi QA cell and the en→pnb_Arab cell commonly favour a different model than Gurmukhi; intent classification favours a fine-tuned encoder for all scripts.",
  },
  {
    title: "Compute the report-card gate",
    kind: "calculate",
    task: "Traffic shares: Gurmukhi 50%, Romanised 35%, Shahmukhi 15%. Correctness: 86%, 80%, 62%. Thresholds: 75% per script. Compute the traffic-weighted correctness, state the gate decision, and compute the standard error of the Shahmukhi figure if it was measured on 120 items.",
    hints: ["Weighted = Σ share × score.", "SE = √(p(1−p)/n)."],
    solution: "Weighted = 0.5×86 + 0.35×80 + 0.15×62 = 43 + 28 + 9.3 = 80.3%. Gate: Shahmukhi 62% < 75% → fail for Shahmukhi; Gurmukhi and Romanised pass. SE for Shahmukhi = √(0.62×0.38/120) = √0.00196 ≈ 0.044, so the true value is plausibly 53–71%, still below threshold; hold Shahmukhi on the previous version and grow the test set.",
  },
  {
    title: "Attribute the gaps with the pivot experiment",
    kind: "calculate",
    task: "Direct scores: Gurmukhi 84, Shahmukhi 69, Romanised 63. Input-pivot scores: Shahmukhi 77, Romanised 80. Output-pivot naturalness: Shahmukhi 3.3, Romanised 4.1 (threshold 4.0). For each non-Gurmukhi form compute the gap, the recovered part and the residual, and recommend the fix and where the data budget goes.",
    hints: ["Recovered = pivot − direct; residual = gap − recovered.", "Naturalness below threshold means transliterated output is not acceptable."],
    solution: "Shahmukhi: gap 15, recovered 8, residual 7; output pivot unnatural (3.3) → use input transliteration, and train a Shahmukhi output adapter on real Shahmukhi answers; budget: Shahmukhi output data. Romanised: gap 21, recovered 17, residual 4; output pivot acceptable (4.1) → input transliteration and output via transliteration; budget: transliteration pairs, not a fine-tune. Data money goes mostly to Shahmukhi answers and Romanised–Gurmukhi pairs.",
  },
  {
    title: "Plan the fine-tuning mix",
    kind: "think",
    task: "You have 5,000 real Gurmukhi Q&A pairs, 1,800 Romanised, 500 Shahmukhi, and access to 20,000 English pairs in the same domain. Traffic is 45/40/15 across the scripts. Propose the training mix in counts, the validation sets, the stopping rule, and the regression checks.",
    hints: ["Keep 30–40% non-Punjabi to prevent forgetting.", "Validate per script; gate on English not rising."],
    solution: "Train: Gurmukhi 4,500, Romanised 1,600, Shahmukhi 450 (hold out 10% of each for validation), English 3,500 sampled from the 20,000, Hindi 500 if available, 300 language-switch examples: about 10,850 total, roughly 62% Punjabi. Validation: 500/200/50 per script plus 300 English, with per-script loss logged each epoch. Stop at the epoch with lowest Punjabi loss while English loss is within +0.08 of the base. Regression checks: full harness before and after; English and Hindi scores must not fall more than 1 point; Shahmukhi wrong-language rate must not rise. Note that 450 Shahmukhi examples is thin; plan a Shahmukhi-specific adapter when more data arrives.",
  },
];
