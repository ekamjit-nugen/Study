import type { Exercise, LessonBody, Quiz } from "../types";

// Module 43: Multilingual AI fundamentals. One concept per lesson.
// Keys are lesson slugs: m43-<kebab of the concept title in map.ts>.

export const M43_BODIES: Record<string, LessonBody> = {
  "m43-multilingual-ai": {
    simple: "Multilingual AI is a model, or a system of models, that works across many languages, and the gap between its best and worst language is the thing to measure.",
    concept:
      "Most AI systems are built, tested and marketed in English. **Multilingual AI** means a system that reads, understands and produces more than one language, ideally with similar quality in each. A single model can do this: it is trained on text from many languages at once, and inside it the same machinery handles a Hindi question, a French review and a Punjabi complaint.\n\nThe important word is 'similar'. A model that is excellent in English and poor in Punjabi is still called multilingual, but a Punjabi speaker does not get the product the English speaker gets. So the practical definition is: for each language you care about, how good is it, and how far behind the best language is it? That gap is what the rest of this module explains and what the next three modules close for Punjabi.\n\nThree things decide the gap: how much text in that language the model saw, how well its tokeniser handles that language's script, and whether anyone measured quality in that language at all.",
    why:
      "Around 7,000 languages are spoken; a few dozen have most of the internet's text. A model trained on the internet learns English deeply, Spanish and Chinese well, and Punjabi, Swahili or Quechua only thinly. Without deliberate effort, products built on such models serve a fraction of humanity well and the rest badly, while looking as if they serve everyone.\n\nMultilingual AI exists as a field because the gap does not close itself. It takes measurement per language, data collection, tokeniser choices, and sometimes extra training. A company that sells to Punjab, Nigeria or Vietnam needs these skills; so does anyone who wants AI to be fair.",
    how: [
      "Decide which languages the product must serve, and in which scripts (Punjabi alone has two scripts and a Romanised form).",
      "Measure the model in each: the same test questions translated, scored per language. The numbers, not the marketing, say what you have.",
      "Find the cause of each gap: too few tokens of that language in training, a tokeniser that shreds its script, missing evaluation data, or a cultural gap in the examples.",
      "Close the gap with the cheapest effective tool: better prompts and retrieval first, then more data and fine-tuning, then a different model.",
      "Keep measuring per language in production; models and users change.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Language", "Share of web text (rough)", "Typical model quality", "Why"],
        rows: [
          ["English", "~50%", "best", "most training text, most evaluation, tokeniser built around it"],
          ["Spanish, German, French, Chinese", "a few % each", "very good", "large corpora, Latin or well-supported scripts"],
          ["Hindi", "under 1%", "good", "large speaker base, growing data, Devanagari widely supported"],
          ["Punjabi (Gurmukhi)", "well under 0.1%", "fair to weak", "little web text, two scripts, few benchmarks"],
          ["Punjabi (Shahmukhi)", "far less again", "weak", "mostly written as Urdu online; almost no labelled data"],
        ],
      },
      caption: "Quality follows data. The share figures are rough and shift yearly, but the order has been stable for a decade.",
    },
    everyday: {
      title: "The same question, three languages",
      text: "Ask a chat assistant 'What documents do I need to renew a passport?' in English and you get a crisp list. Ask in Hindi and you get a good answer with the odd awkward phrase. Ask in Gurmukhi Punjabi, ਪਾਸਪੋਰਟ ਰੀਨਿਊ ਕਰਨ ਲਈ ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਚਾਹੀਦੇ ਹਨ?, and you may get a mix of Punjabi and Hindi words, a Hindi answer, or English. Same model, three products. The user in Ludhiana notices; the dashboard in San Francisco does not, unless someone measured per language.",
    },
    engineering: {
      title: "A telecom's support bot across India",
      text: "An Indian telecom launches a support bot in twelve languages using one multilingual model. The English and Hindi test sets pass at 90%. The team builds a 200-question test set per language with native speakers, and finds Punjabi at 61%, Odia at 48%. The cheap fixes come first: retrieval over Punjabi help articles raised Punjabi to 78% because the model's weakness was knowledge, not grammar. For Odia, the tokeniser produced five times as many tokens per sentence as English, so answers hit length limits; a model with a better tokeniser was swapped in for that language only. Per-language measurement turned one average into twelve decisions.",
    },
    creative: {
      title: "The interpreter who learned from signs",
      text: "Imagine an interpreter who learned every language by reading whatever text they walked past for ten years. In a city full of English signs they became fluent. Punjabi they met only on a few shop fronts and a poster. Ask them anything in English and they answer like a local; ask in Punjabi and they understand the gist, reach for a Hindi word, and sometimes guess. They are not lazy; the city simply showed them more English. A multilingual model is that interpreter, and the 'city' is the training data.",
    },
    maths: {
      formula: "quality gap (language L) = score(best language) − score(L);   relative gap = gap ÷ score(best language)",
      meaning: "The same test, scored per language. The gap tells you how much a user of language L loses compared with the best-served user; the relative gap lets you compare across different tests.",
      worked: [
        "A 200-question support test. English scores 182 correct = 91%. Hindi 168 = 84%. Punjabi (Gurmukhi) 122 = 61%.",
        "Gap for Hindi = 91 − 84 = 7 points; relative gap = 7 ÷ 91 ≈ 0.08.",
        "Gap for Punjabi = 91 − 61 = 30 points; relative gap = 30 ÷ 91 ≈ 0.33: a Punjabi user gets a third less correct help.",
        "After adding Punjabi retrieval, Punjabi scores 156 = 78%: gap 13 points, relative 0.14. The number says the fix worked and how much is left.",
      ],
    },
    code: {
      title: "Score one test set per language",
      lang: "py",
      src: `# questions[lang] is a list of (question, expected_answer) pairs, translated by native speakers
def score(lang, answer_fn):
    correct = 0
    for question, expected in questions[lang]:
        reply = answer_fn(question)
        if expected.lower() in reply.lower():
            correct += 1
    return correct / len(questions[lang])

results = {lang: score(lang, ask_model) for lang in ["en", "hi", "pa-Guru", "pa-Arab"]}
best = max(results.values())
for lang, s in results.items():
    print(lang, round(s, 2), "gap", round(best - s, 2))`,
      lines: [
        { code: "for question, expected in questions[lang]:", say: "The same questions in every language, each with the answer a native speaker expects." },
        { code: "if expected.lower() in reply.lower():", say: "A simple check: does the key fact appear? Module 37 has stricter graders; this is enough to see the gap." },
        { code: "results = {lang: score(lang, ask_model) for lang in [\"en\", \"hi\", \"pa-Guru\", \"pa-Arab\"]}", say: "Language codes name the script too: pa-Guru is Punjabi in Gurmukhi, pa-Arab in Shahmukhi. They are measured separately." },
        { code: "print(lang, round(s, 2), \"gap\", round(best - s, 2))", say: "One line per language. The gap column is the product's honesty report." },
      ],
      output: "en 0.91 gap 0.0\nhi 0.84 gap 0.07\npa-Guru 0.61 gap 0.3\npa-Arab 0.44 gap 0.47",
      note: "The output is illustrative. Your own numbers will differ; the point is that you have them.",
    },
    useIt: "Any product with users in more than one language: support bots, search, document assistants, moderation. Start every multilingual project with a per-language test set; it tells you which language needs which fix, and it stops 'the model supports 100 languages' from standing in for 'the model works for our users'.",
    takeaways: ["Multilingual means works in many languages; the gap between languages is what matters.", "The gap comes from training data share, tokeniser fit, and whether quality was ever measured.", "Measure per language and per script with the same test; the gap is a number.", "Fix the cause: retrieval, prompts, data, tokeniser, or a different model, in that order of cost."],
    terms: [["multilingual AI", "a model or system that works across many languages"], ["quality gap", "how far a language's score falls below the best-served language on the same test"], ["language code", "a short tag such as pa-Guru (Punjabi, Gurmukhi script) that names a language and script"]],
    reflect: { q: "A vendor says their model 'supports Punjabi'. What three questions turn that claim into something you can use?", a: "Which script (Gurmukhi, Shahmukhi, Romanised)? What score on what test, compared with English on the same test? And how many Punjabi tokens does a typical sentence cost, since that affects price, speed and length limits?" },
  },

  "m43-multilingual-vs-cross-lingual-models": {
    simple: "A multilingual model handles each language on its own; a cross-lingual model also connects them, so what it learned in one language helps it in another.",
    concept:
      "Two words that sound alike but describe different abilities. A **multilingual** model can operate in several languages: ask in French, it answers in French; ask in Punjabi, it answers in Punjabi. Nothing in that definition says the languages are connected inside the model.\n\n**Cross-lingual** describes the connection. A cross-lingual model represents a sentence by its meaning in a way that is shared across languages, so 'the order is late', 'la commande est en retard' and ਆਰਡਰ ਲੇਟ ਹੈ land near each other inside the model. That sharing lets three things happen: you can search English documents with a Punjabi query; you can train a classifier on English examples and apply it to Punjabi (called zero-shot transfer); and knowledge learned mostly from English text becomes partly available to the low-resource language.\n\nMost modern large models are both, to a degree: they are multilingual by training and cross-lingual because the shared layers push meanings together. The degree is the engineering question. Transfer is strong between related languages with shared script and weak across unrelated ones with different scripts, which is exactly Punjabi's situation relative to English.",
    why:
      "Low-resource languages cannot be served by their own data alone; there is not enough of it. Cross-lingual transfer is the escape: let the model learn the task from the language that has data and carry it to the language that does not. A fraud-message classifier trained on fifty thousand English examples can work usefully on Punjabi messages with only a few hundred Punjabi examples, because the model already connects the two.\n\nUnderstanding the difference also stops a common mistake: assuming that because a model answers in Punjabi, it reasons as well in Punjabi. It may answer fluently while its understanding came through a weak link to English. Measuring transfer tells you how strong the link is.",
    how: [
      "During training the model sees many languages through the same layers, with the same next-token objective.",
      "Shared vocabulary pieces (numbers, names, loanwords, code) and parallel sentences (translations) act as anchors that pull the languages' representations together.",
      "With enough anchors, sentences with the same meaning get similar internal vectors regardless of language: a shared meaning space.",
      "A task learned in one language (a classifier head, an instruction style) then applies to other languages through that shared space.",
      "Transfer strength falls with distance: different script, different grammar, few shared words, little parallel data.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Multilingual (separate)", points: ["Works in each language it saw", "Quality tracks each language's own data", "A task must be taught in every language", "Search works only within one language"] },
      right: { title: "Cross-lingual (connected)", points: ["Shared meaning space across languages", "Tasks learned in English transfer to Punjabi", "Query in one language, find documents in another", "Transfer is weaker across scripts and families"] },
      caption: "Every cross-lingual model is multilingual; the reverse is not guaranteed.",
    },
    everyday: {
      title: "Two bilingual colleagues",
      text: "One colleague speaks English and Punjabi but learned them separately: explain a new rule in English and they still need it explained again in Punjabi. The other learned them side by side and translates in their head without noticing: tell them once, in either language, and they apply it in both. The second colleague is cross-lingual. When you have time to explain something only once, in English, you want the second one.",
    },
    engineering: {
      title: "Spam detection for a Punjabi messaging app",
      text: "A messaging app has 60,000 labelled English spam messages and 400 Punjabi ones. Training only on Punjabi gives 71% accuracy. Training a cross-lingual encoder on the English set and testing on Punjabi with zero Punjabi training examples gives 79%: the task transferred. Adding the 400 Punjabi examples on top gives 88%. The team then checks the Romanised Punjabi messages ('free recharge jaldi click karo') separately: 74%, because Romanised Punjabi sits further from both English and Gurmukhi in the model's space. They collect 600 more Romanised examples and reach 86%.",
    },
    maths: {
      formula: "transfer gain = score(train on English, test on Punjabi) − score(train on Punjabi only, test on Punjabi)",
      meaning: "A positive gain means the model carried the task across languages; the size says how strong the cross-lingual link is for that pair and that task.",
      worked: [
        "Spam task. Punjabi-only training (400 examples): 71% on the Punjabi test set.",
        "English training (60,000 examples), zero Punjabi: 79% on the same Punjabi test. Transfer gain = 79 − 71 = +8 points.",
        "Both: 88%. The Punjabi examples add 9 points on top of transfer; neither alone reaches it.",
        "Same experiment, Romanised Punjabi test set: English-only 68%, Romanised-only (300 examples) 70%, both 86%. Transfer gain ≈ −2: Romanised text is barely connected to English in this model, so its own data matters more.",
      ],
    },
    code: {
      title: "Zero-shot transfer with a cross-lingual encoder",
      lang: "py",
      src: `# A sentence encoder that maps many languages into one vector space (e.g. a multilingual sentence-transformer).
from sklearn.linear_model import LogisticRegression

train_vectors = encoder.encode(english_messages)        # 60,000 English messages
clf = LogisticRegression(max_iter=1000).fit(train_vectors, english_labels)

pa_vectors = encoder.encode(punjabi_messages)           # Gurmukhi messages, never seen in training
pa_pred = clf.predict(pa_vectors)
print("zero-shot Punjabi accuracy:", (pa_pred == punjabi_labels).mean())

# Then add the few hundred Punjabi examples and retrain
both_vectors = encoder.encode(english_messages + punjabi_train)
clf2 = LogisticRegression(max_iter=1000).fit(both_vectors, english_labels + punjabi_train_labels)`,
      lines: [
        { code: "train_vectors = encoder.encode(english_messages)        # 60,000 English messages", say: "Every message becomes a vector in the shared space; the classifier learns on English vectors only." },
        { code: "pa_vectors = encoder.encode(punjabi_messages)           # Gurmukhi messages, never seen in training", say: "Punjabi messages go through the same encoder. If the space is truly shared, spam lands where English spam landed." },
        { code: "pa_pred = clf.predict(pa_vectors)", say: "The English-trained classifier is applied to Punjabi with no Punjabi examples: zero-shot transfer." },
        { code: "both_vectors = encoder.encode(english_messages + punjabi_train)", say: "The usual best: transfer plus a little target-language data." },
      ],
      note: "The encoder does the cross-lingual work; the classifier is ordinary. Choosing an encoder that covers Gurmukhi well is the decision that matters.",
    },
    useIt: "Use cross-lingual transfer whenever a task has rich English data and thin Punjabi data: classification, intent detection, moderation, search. Measure transfer per script; Romanised and Shahmukhi Punjabi often transfer worse than Gurmukhi and need their own examples. Treat a model's fluent Punjabi output as a hint, not proof, that its understanding transferred.",
    takeaways: ["Multilingual: works in many languages. Cross-lingual: connects them in a shared meaning space.", "Transfer lets English data teach a task that then works in Punjabi.", "Transfer is strongest between close languages and shared scripts; Romanised and Shahmukhi Punjabi transfer worse.", "Measure the transfer gain per script before relying on it."],
    terms: [["cross-lingual transfer", "a task learned in one language working in another through a shared representation"], ["zero-shot transfer", "applying a model to a language it had no task examples in"], ["shared meaning space", "an internal representation where sentences with the same meaning sit close regardless of language"]],
    reflect: { q: "Your Punjabi intent classifier trained on English only gets 80% on Gurmukhi but 55% on Romanised Punjabi. What does that tell you and what do you do?", a: "The shared space connects Gurmukhi to English reasonably but barely connects Romanised Punjabi, probably because the tokeniser treats Romanised text as broken English. Collect Romanised examples, consider transliterating Romanised input to Gurmukhi before encoding (lesson 43.9), and report the two scripts separately." },
  },

  "m43-language-representation": {
    simple: "Inside a model every language is just vectors; whether two languages share a good representation depends on the tokens they are cut into and the text the model learned from.",
    concept:
      "A model never sees letters or words. Text is cut into tokens, each token is swapped for a vector of numbers, and layers transform those vectors. **Language representation** is the question of what those vectors look like for a given language: are the tokens meaningful pieces or random shards of bytes? Are the vectors for Punjabi words spread sensibly, or crammed into a small, poorly trained corner?\n\nFor English the representation is excellent: common words are single tokens with rich, well-trained vectors. For Punjabi in Gurmukhi, an English-centric tokeniser may cut ਪਾਣੀ (water) into four or more byte fragments, none of which means 'water' on its own, and each fragment's vector was trained on a tiny amount of text. The model must reassemble meaning from shards every time. Shahmukhi text shares byte fragments with Urdu and Arabic, which helps and hurts: the pieces are better trained, but the model may read Punjabi as slightly wrong Urdu.\n\nRomanised Punjabi is the strange case: 'paani', 'kithe', 'changa' are cut into English-looking subwords with English vectors. The model sees familiar pieces carrying unfamiliar meanings.",
    why:
      "The representation sets a ceiling. If a language is tokenised into meaningless fragments with poorly trained vectors, no prompt will make the model fluent and no fine-tuning will be cheap. Engineers who understand representation can predict which languages a model will struggle with before running a single test, and can choose or adapt tokenisers to fix the root cause rather than the symptoms.\n\nIt also explains cost: a language that costs four times the tokens costs four times the money and fills the context window four times faster, for the same meaning.",
    how: [
      "The tokeniser splits text using a vocabulary learned mostly from the training corpus; frequent strings become single tokens, rare strings become many small ones.",
      "Each token id selects a row of the embedding matrix: its vector. Rows for frequent tokens are updated millions of times in training; rows for rare ones barely move.",
      "Layers combine token vectors using attention; the model can rebuild a word's meaning from fragments, but it spends capacity and context on doing so.",
      "Words that share tokens across languages (names, numbers, loanwords, Urdu and Shahmukhi letters) share vectors, creating bridges between languages.",
      "The output side mirrors the input: generating Punjabi means predicting many fragment tokens in a row, each a chance to go wrong.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Meaning", "Tokens on an English-centric tokeniser (typical)", "Tokens on an Indic-aware tokeniser (typical)"],
        rows: [
          ["water", "water", "1", "1"],
          ["ਪਾਣੀ", "water (Gurmukhi)", "5–8 (byte fragments)", "1–2"],
          ["پانی", "water (Shahmukhi)", "2–3 (shared with Urdu)", "1–2"],
          ["paani", "water (Romanised)", "2 ('pa' + 'ani')", "2"],
          ["ਮੈਂ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ", "I am going home", "18–30", "5–7"],
        ],
      },
      caption: "Same meaning, very different token counts. Counts vary by tokeniser; the pattern does not.",
    },
    everyday: {
      title: "Reading a word letter by letter",
      text: "Read the English word 'tomorrow' and you take it in at a glance. Now read 'ਕੱਲ੍ਹ' (tomorrow in Punjabi) if you have never learned Gurmukhi: you see five marks, work out each, and still are not sure how they combine. That is what an English-centric model does with every Punjabi word: it reads shards and assembles. It can get there, but slowly, expensively, and with more mistakes.",
    },
    engineering: {
      title: "Why the Punjabi answers got cut off",
      text: "A document assistant returned complete answers in English but truncated ones in Gurmukhi. The limit was 300 output tokens. An English answer of 120 words used about 160 tokens; the Punjabi translation of the same answer used 520 tokens on the model's tokeniser and was cut mid-sentence. The team measured tokens per word per language, raised the output limit for Gurmukhi requests to 900, and reported Punjabi cost per answer at 3.3 times English. Later they moved Punjabi to a model whose tokeniser was trained with Indic text, which brought the ratio down to 1.4 and improved quality at the same time, because the representation was better, not just cheaper.",
    },
    maths: {
      formula: "fertility(language) = tokens ÷ words;   cost ratio = fertility(language) ÷ fertility(English)",
      meaning: "Fertility is how many tokens the tokeniser spends per word. It is the simplest measure of how well a language is represented, and it predicts price, speed and context usage.",
      worked: [
        "English sentence: 'I am going home tomorrow' = 5 words, 5 tokens. Fertility = 5 ÷ 5 = 1.0.",
        "Gurmukhi: ਮੈਂ ਕੱਲ੍ਹ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ = 6 words; an English-centric tokeniser gives, say, 27 tokens. Fertility = 27 ÷ 6 = 4.5.",
        "Cost ratio = 4.5 ÷ 1.0 = 4.5: the same sentence costs 4.5 times as much and fills the context window 4.5 times faster.",
        "Indic-aware tokeniser: 9 tokens for the same sentence. Fertility = 1.5; cost ratio 1.5. The representation, not the language, was the problem.",
      ],
    },
    code: {
      title: "Measure fertility per script",
      lang: "py",
      src: `from transformers import AutoTokenizer

samples = {
    "en":      "I am going home tomorrow",
    "pa-Guru": "ਮੈਂ ਕੱਲ੍ਹ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ",
    "pa-Arab": "میں کل گھر جا رہا ہاں",
    "pa-Latn": "main kal ghar ja riha haan",
}

for name in ["gpt2", "ai4bharat/IndicBERTv2-MLM-only"]:
    tok = AutoTokenizer.from_pretrained(name)
    print(name)
    for lang, text in samples.items():
        tokens = tok.tokenize(text)
        words = text.split()
        print("  ", lang, len(tokens), "tokens for", len(words), "words -> fertility", round(len(tokens) / len(words), 2))`,
      lines: [
        { code: "\"pa-Guru\": \"ਮੈਂ ਕੱਲ੍ਹ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ\",", say: "The same sentence in each script. pa-Latn is Romanised Punjabi, written with Latin letters." },
        { code: "for name in [\"gpt2\", \"ai4bharat/IndicBERTv2-MLM-only\"]:", say: "Two tokenisers: an English-centric one and one trained with Indian languages. Swap in whichever models you are considering." },
        { code: "tokens = tok.tokenize(text)", say: "The actual pieces the model will see. Print them too; the shards are instructive." },
        { code: "print(\"  \", lang, len(tokens), \"tokens for\", len(words), \"words -> fertility\", round(len(tokens) / len(words), 2))", say: "Fertility per language per tokeniser: the number that predicts cost, speed and quality." },
      ],
      note: "Run this before choosing a model for any language. A fertility above 3 is a warning sign.",
    },
    useIt: "When choosing a model for Punjabi or any non-English language, check tokeniser fertility per script first; it predicts cost, context usage, truncation and part of the quality gap. When fine-tuning, know that poorly trained fragment vectors need more data to improve. When budgeting, multiply English token estimates by the measured ratio.",
    takeaways: ["Languages exist inside a model only as tokens and vectors; the quality of that representation sets a ceiling.", "English-centric tokenisers shred Gurmukhi into byte fragments with weak vectors; Shahmukhi shares pieces with Urdu; Romanised Punjabi borrows English pieces.", "Fertility (tokens per word) is the quick measure; it predicts cost, truncation and quality.", "Fix representation with a better tokeniser or model, not with prompts."],
    terms: [["fertility", "tokens per word for a language under a given tokeniser"], ["embedding matrix", "the table with one vector per token id, learned in training"], ["byte fragment", "a token that is part of a character's bytes rather than a meaningful piece of text"]],
    reflect: { q: "Why might Shahmukhi Punjabi get better token vectors than Gurmukhi Punjabi on a general model, yet still be understood worse?", a: "Shahmukhi letters are shared with Urdu and Arabic, which have far more web text, so the token vectors are well trained. But the model learned those tokens in Urdu contexts, so it tends to read Punjabi words as Urdu, mis-guessing meaning and grammar. Well-trained pieces with the wrong language model behind them." },
  },

  "m43-low-resource-languages": {
    simple: "A low-resource language is one with little digital text, few labelled datasets and few tools, regardless of how many people speak it.",
    concept:
      "'Resource' here means what a model can learn from: digitised text, parallel translations, labelled datasets, dictionaries, benchmarks, tokenisers, and people who have built tools. A **low-resource language** has little of these. It is not about speakers: Punjabi has over 100 million speakers and is low-resource; Icelandic has 370,000 and is better resourced in some ways because of deliberate government investment.\n\nThe shortage compounds. Little text means weak base models; weak base models mean nobody builds products; no products means no user data; no benchmarks means nobody notices how bad it is. Breaking the loop is deliberate work: collect, clean, label, measure, publish.\n\nPunjabi has three extra handicaps: its two scripts split what data exists; much Shahmukhi writing online is counted as Urdu; and a large share of everyday digital Punjabi is Romanised in chats and comments, which is neither standardised nor collected.",
    why:
      "AI quality follows data, so without attention, low-resource languages get the worst products. For a company, that is lost customers; for a society, it is unequal access to information, services and education. The field exists to change the loop: techniques that get more out of little data (transfer, synthetic data, multilingual training) and the unglamorous work of building the resources.\n\nFor an engineer building a Punjabi assistant, this lesson sets expectations: the base model will be weaker, the datasets will have to be built, and evaluation will have to be created before anything can be claimed.",
    how: [
      "Inventory what exists: monolingual text (Wikipedia, news, books), parallel corpora (Punjabi–English translations), labelled sets (sentiment, NER, QA), benchmarks (FLORES-200 includes Gurmukhi Punjabi), and tokeniser support.",
      "Measure the base model on what exists, per script, to know the starting point.",
      "Use transfer from high-resource languages for tasks; use retrieval to supply knowledge the model lacks.",
      "Build the missing resources in the order that pays off: an evaluation set first (small, native-speaker checked), then task data, then larger text collections.",
      "Share what you build where you can; every published Punjabi dataset raises the floor for the next team.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Resource", "English", "Hindi", "Punjabi (Gurmukhi)", "Punjabi (Shahmukhi)"],
        rows: [
          ["Wikipedia articles (rough order)", "millions", "hundreds of thousands", "tens of thousands", "a few thousand"],
          ["parallel sentences with English", "huge", "tens of millions", "a few million (e.g. Samanantar)", "very few"],
          ["labelled task datasets", "thousands", "dozens", "a handful", "almost none"],
          ["benchmarks", "many", "several", "FLORES, a few Indic suites", "rare"],
          ["tokeniser support", "native", "good", "varies by model", "via Urdu"],
        ],
      },
      caption: "Orders of magnitude, not exact counts. The right-hand columns are where the work is.",
    },
    everyday: {
      title: "Learning a language from what is on the shelf",
      text: "Want to learn French? Every bookshop has courses, novels, films with subtitles, apps, and tutors. Want to learn Punjabi? There are far fewer materials, the Gurmukhi and Shahmukhi books do not overlap, and most of what friends text each other is in Roman letters nobody teaches. A learner with the French shelf gets fluent faster, not because French is easier, but because the resources exist. Models learn the same way, from the same uneven shelf.",
    },
    engineering: {
      title: "A health-information service in rural Punjab",
      text: "An NGO builds a WhatsApp assistant answering maternal-health questions in Punjabi. The base model answers Gurmukhi questions with Hindi-flavoured, sometimes wrong, medical advice. The team's first product is not the bot; it is 300 questions and verified answers written by local nurses, in Gurmukhi and Romanised Punjabi, used as the evaluation set and as the retrieval corpus. With retrieval over those answers, the assistant stops inventing and starts quoting. Later, 2,000 real user questions, anonymised and labelled by the nurses, become fine-tuning data. The resource was built as part of the product, because it did not exist to be downloaded.",
    },
    maths: {
      formula: "expected quality ≈ f(log tokens seen in the language);   each 10× more data gives a roughly similar step up",
      meaning: "Model quality in a language improves roughly with the logarithm of how much text of that language it saw: going from 1 million to 10 million tokens helps about as much as going from 10 million to 100 million. Small amounts of data therefore matter a lot at the low end.",
      worked: [
        "Suppose a model's Punjabi benchmark score is 40 at 10 million Punjabi training tokens and 52 at 100 million: +12 points per 10× more data.",
        "To reach 64 you would expect to need about 1 billion Punjabi tokens; to reach 76, about 10 billion, which may not exist in Gurmukhi anywhere.",
        "The practical reading: the first 100 million tokens are the cheapest gain; after that, fine-tuning on task data, retrieval, and transfer give more per rupee than scraping more text.",
      ],
      note: "The numbers are a stylised example of the log-linear pattern reported in scaling studies, not a formula to plan budgets with.",
    },
    code: {
      title: "Inventory a language's resources from a corpus listing",
      lang: "py",
      src: `# A rough inventory: how many documents and tokens of each script do we actually have?
import re
from collections import Counter

GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")
ARABIC   = re.compile(r"[\\u0600-\\u06FF]")

counts = Counter()
tokens = Counter()
for doc in corpus:                       # an iterator over text documents
    if GURMUKHI.search(doc):
        script = "pa-Guru"
    elif ARABIC.search(doc):
        script = "pa-Arab (or Urdu)"
    else:
        script = "latin (Romanised or English)"
    counts[script] += 1
    tokens[script] += len(doc.split())

for script in counts:
    print(script, counts[script], "docs", tokens[script], "words")`,
      lines: [
        { code: "GURMUKHI = re.compile(r\"[\\u0A00-\\u0A7F]\")", say: "The Gurmukhi Unicode block. One match is enough to say a document contains Gurmukhi text." },
        { code: "ARABIC   = re.compile(r\"[\\u0600-\\u06FF]\")", say: "Shahmukhi uses the Arabic block, as does Urdu. Telling them apart needs lesson 46.2; here they are counted together, honestly labelled." },
        { code: "tokens[script] += len(doc.split())", say: "Word counts per script: the inventory of what you have to learn from." },
      ],
      note: "Run it over every text source you can reach: crawls, archives, your own product's logs. The numbers are usually smaller than hoped, and that is the point.",
    },
    useIt: "Before any Punjabi AI project, inventory the resources per script and measure the base model. Plan to build the evaluation set and task data yourself; budget for native speakers. Use transfer and retrieval to stretch little data. Publish what you can; low-resource languages improve one dataset at a time.",
    takeaways: ["Low-resource means little text, labels, benchmarks and tooling, not few speakers.", "The shortage is a loop: little data, weak models, no products, no new data. Breaking it is deliberate.", "Punjabi's two scripts and Romanised usage split and hide its data.", "Build the evaluation set first; data quality beats data quantity at the low end."],
    terms: [["low-resource language", "a language with little digital text, labelled data and tooling for AI"], ["parallel corpus", "sentences paired with their translations in another language"], ["benchmark", "a published test set used to compare models fairly"]],
    reflect: { q: "Punjabi has far more speakers than Dutch. Why does a typical model handle Dutch far better?", a: "Resources, not speakers: Dutch has a wealthy, fully digitised, single-script online presence with decades of text, parallel data with English, and benchmarks. Punjabi's online text is thin, split across two scripts and Romanised chat, and rarely labelled. Models learn from what was written down and collected." },
  },

  "m43-high-resource-vs-low-resource-languages": {
    simple: "The resource gap between languages decides what techniques work: high-resource languages get quality from scale, low-resource ones from transfer, retrieval and careful data.",
    concept:
      "Put the previous two lessons side by side. A **high-resource language** (English, Chinese, Spanish, German, Japanese) has enormous text, plentiful labels and benchmarks, and tokenisers built with it in mind. A **low-resource language** has the opposite. The gap is not a ranking of languages; it is a difference in what tools work.\n\nFor a high-resource language the standard recipe is: pick a strong model, prompt well, measure, fine-tune if needed. Scale does the rest. For a low-resource language the same recipe produces a fluent-looking model that is often wrong, because scale was never there. The working recipe changes: lean on cross-lingual transfer, supply knowledge through retrieval, build small high-quality datasets, choose or adapt tokenisers, and evaluate relentlessly, per script.\n\nMany languages sit in between (Hindi, Arabic, Vietnamese, Turkish): good base models, thin task data. Punjabi is firmly in the low-resource group, with Gurmukhi slightly better placed than Shahmukhi and Romanised.",
    why:
      "Teams waste months applying the high-resource recipe to a low-resource language and concluding that 'AI does not work for Punjabi'. It does; the recipe was wrong. Knowing which side of the gap a language is on tells you what to try first, what to budget for, and what to promise. It also sets fairness expectations: a product cannot honestly claim equal quality across languages without the extra work on the low-resource side.",
    how: [
      "Classify each target language and script by resources: text volume, labelled data, benchmarks, tokeniser fit. Measure rather than assume.",
      "For high-resource languages: model choice, prompting, evaluation, optional fine-tuning.",
      "For low-resource languages: measure the base model; add retrieval for knowledge; use transfer from a related high-resource language; build a small gold evaluation set with native speakers; fine-tune on carefully built task data; pick an Indic-aware tokeniser or model.",
      "Report quality per language and script in the product; do not average across them.",
      "Revisit yearly: models improve unevenly, and a language can move up the ladder.",
    ],
    visual: {
      kind: "compare",
      left: { title: "High-resource recipe", points: ["Strong general model works out of the box", "Prompting fixes most issues", "Benchmarks exist; compare models in an afternoon", "Fine-tune only for style or narrow tasks", "Cost: standard per-token price"] },
      right: { title: "Low-resource recipe", points: ["Base model weak; measure first", "Retrieval supplies knowledge the model lacks", "Build your own evaluation set with native speakers", "Transfer from English; fine-tune on small clean data", "Cost: several × tokens per sentence; budget for it"] },
      caption: "Same goal, different tools. Using the left column for Punjabi produces fluent nonsense.",
    },
    everyday: {
      title: "Cooking from a full pantry or an empty one",
      text: "With a full pantry you follow the recipe as written. With three ingredients you cook differently: you substitute, you borrow from a neighbour, you make smaller portions and taste constantly. A chef who insists on the full recipe with an empty pantry produces nothing; a chef who adapts produces a good meal. High-resource languages are the full pantry; low-resource ones need the second kind of cooking.",
    },
    engineering: {
      title: "One assistant, two recipes",
      text: "A bank launches an assistant in English and Punjabi. English: a strong hosted model, a system prompt, a 500-case eval, done in six weeks at 93%. Punjabi, same model and prompt: 58% on a test set built with Punjabi-speaking staff, with answers drifting into Hindi. The Punjabi track takes a different path: retrieval over Punjabi versions of the bank's policies (to 74%), a model with an Indic tokeniser (to 80%), 1,500 fine-tuning examples written by staff from real anonymised queries (to 87%), and a rule that Romanised input is transliterated to Gurmukhi before the model sees it (Romanised accuracy from 61% to 83%). Same product, four extra months, a different recipe, and an honest per-language dashboard.",
    },
    maths: {
      formula: "cost per answer(language) = tokens(language) × price;   tokens(language) = tokens(English) × fertility ratio",
      meaning: "Low-resource languages usually cost more per answer because their tokenisation is worse. Budget with the measured ratio, not the English estimate.",
      worked: [
        "English answer: 160 input + 150 output tokens. At an illustrative £2 per million input tokens and £8 per million output tokens: 160 × 0.000002 + 150 × 0.000008 = £0.00032 + £0.0012 = £0.00152.",
        "Gurmukhi with fertility ratio 3.3: 528 input + 495 output tokens: £0.001056 + £0.00396 = £0.005016, about 3.3× the English cost.",
        "With an Indic-aware model at ratio 1.4: 224 + 210 tokens: £0.000448 + £0.00168 = £0.002128. Switching models cut Punjabi cost by more than half.",
        "At 50,000 Punjabi answers a day, the difference is roughly £144 a day, before counting the quality gain.",
      ],
      note: "Prices are illustrative; use your provider's current ones.",
    },
    useIt: "Classify every language in your product by resources before planning. Give low-resource languages their own track with retrieval, transfer, a native-speaker evaluation set, tokeniser-aware model choice and separate budgets. Report quality and cost per language. The next three modules apply this recipe to Punjabi end to end.",
    takeaways: ["High-resource: scale works; low-resource: scale is absent, so use transfer, retrieval, careful data and per-script evaluation.", "The wrong recipe makes people conclude a language 'cannot be done'.", "Low-resource languages cost more per answer; budget with measured fertility.", "Never average quality across languages; report each."],
    terms: [["high-resource language", "a language with abundant text, labels, benchmarks and tooling"], ["gold evaluation set", "a small test set checked by native speakers, used as the reference for quality"]],
    reflect: { q: "A manager proposes shipping Punjabi 'with the same setup as English and seeing what users say'. What do you say?", a: "Users will say it is bad, and some will be given wrong answers before they do. Build a 200-question Punjabi test set first; it costs a week and tells you whether retrieval, a tokeniser change or fine-tuning is needed before launch. Ship with a per-language quality number you can stand behind." },
  },

  "m43-multilingual-tokenisers": {
    simple: "A multilingual tokeniser is built from text in many languages so each gets sensible pieces; how a tokeniser was trained decides which languages it serves well.",
    concept:
      "A tokeniser's vocabulary is learned from a corpus: frequent character sequences become tokens. A **multilingual tokeniser** is trained on a mix of languages so that Gurmukhi, Arabic-script and Latin-script text all get reasonably sized pieces. The design choices are the vocabulary size (more slots to share), the language mix of the training corpus (how many slots each language earns), and the base units (bytes, characters, or Unicode-aware pieces).\n\nTwo things go wrong for Punjabi. First, if the corpus is 90% English, Punjabi earns few vocabulary slots and is cut into byte fragments. Second, byte-level tokenisers treat each Gurmukhi character as three bytes, so a vowel sign or the nukta dot can become its own token; the model then has to learn Punjabi spelling at the byte level. Tokenisers trained with sampling that boosts small languages, or with dedicated Indic vocabularies, give Punjabi whole syllables and common words as single tokens.\n\nYou rarely train a tokeniser yourself, but you choose models by their tokenisers, and you can extend a tokeniser's vocabulary for a language before fine-tuning.",
    why:
      "The tokeniser is fixed when a model is trained; no prompt changes it. If it shreds Punjabi, every downstream step pays: higher cost, shorter effective context, weaker representation, worse generation. Choosing a model with a Punjabi-friendly tokeniser is often the single biggest quality and cost lever for a Punjabi product, bigger than prompting and often bigger than fine-tuning.",
    how: [
      "Collect a training corpus for the tokeniser with a deliberate language mix; small languages are often up-sampled so they earn vocabulary.",
      "Run a subword algorithm (BPE, unigram, lesson 12.5–12.8) to build a vocabulary of a chosen size, say 128,000 or 256,000 pieces.",
      "Pieces that are frequent across the mix survive: common Gurmukhi syllables and words get their own ids if Punjabi was in the mix with enough weight.",
      "At use time the tokeniser greedily matches the longest known pieces; a word with no good pieces falls back to characters or bytes.",
      "To adapt an existing tokeniser: add new tokens for a language's frequent pieces, resize the embedding matrix, and train the new vectors on that language's text.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Tokeniser design", "Gurmukhi ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ (greeting)", "What happens"],
        rows: [
          ["byte-level, English-heavy corpus", "20–30 tokens", "each three-byte character is split; vowel signs become separate tokens"],
          ["byte-level, balanced multilingual corpus", "6–10 tokens", "common syllables earned pieces; still some splits"],
          ["Indic-aware, large vocabulary", "3–5 tokens", "whole words ਸਤਿ, ਸ੍ਰੀ, ਅਕਾਲ are single tokens"],
          ["extended vocabulary (base + 8,000 Punjabi pieces)", "4–6 tokens", "the fix you can apply yourself before fine-tuning"],
        ],
      },
      caption: "The same three-word greeting, four tokenisers. Counts are typical ranges.",
    },
    everyday: {
      title: "A keyboard with the wrong letters",
      text: "Imagine typing Punjabi on a keyboard that has only English keys plus a 'special character' menu. Every Gurmukhi letter takes three clicks. You can write anything, but slowly, and you make mistakes in the menus. A Gurmukhi keyboard has the letters on the keys. The English-heavy tokeniser is the first keyboard; a multilingual tokeniser with Punjabi in its vocabulary is the second.",
    },
    engineering: {
      title: "Extending a tokeniser before fine-tuning",
      text: "A team wants to fine-tune an open-weight model for Gurmukhi customer support. Its tokeniser spends 4.8 tokens per Punjabi word. They train 8,000 new BPE pieces on 50 million words of Gurmukhi text, add them to the vocabulary, resize the embedding matrix, and continue pretraining on the Gurmukhi corpus for a few hundred million tokens so the new vectors learn. Fertility drops to 1.6, fine-tuning examples fit in a third of the context, inference cost falls by two thirds, and the fine-tuned model's Punjabi evaluation score rises 9 points over fine-tuning without the vocabulary change.",
    },
    maths: {
      formula: "vocabulary slots earned by a language ≈ proportional to its (up-sampled) share of the tokeniser training corpus",
      meaning: "Roughly, languages earn vocabulary in proportion to how much of the tokeniser's training text they contribute. Up-sampling small languages (counting their text several times) is how designers give them a fair share.",
      worked: [
        "Corpus: 1,000 million words, Punjabi 2 million (0.2%). Vocabulary 128,000. Naive share for Punjabi ≈ 0.002 × 128,000 = 256 pieces: barely the alphabet and a few syllables.",
        "Up-sample Punjabi 20×: effective 40 million of 1,038 million ≈ 3.9%. Share ≈ 0.039 × 128,000 ≈ 4,900 pieces: common syllables and hundreds of frequent words become single tokens.",
        "Fertility typically falls from around 4.5 to around 1.8 with that change, cutting Punjabi cost by about 60%.",
      ],
      note: "Real algorithms do not allocate slots exactly by share, but the proportionality is a good mental model.",
    },
    code: {
      title: "Add Punjabi pieces to an existing tokeniser",
      lang: "py",
      src: `from tokenizers import Tokenizer, models, trainers, pre_tokenizers
from transformers import AutoTokenizer, AutoModelForCausalLM

# 1. Learn frequent Gurmukhi pieces from a Punjabi corpus
bpe = Tokenizer(models.BPE(unk_token="[UNK]"))
bpe.pre_tokenizer = pre_tokenizers.Whitespace()
trainer = trainers.BpeTrainer(vocab_size=8000, min_frequency=20)
bpe.train(files=["punjabi_gurmukhi.txt"], trainer=trainer)
new_pieces = list(bpe.get_vocab().keys())

# 2. Add them to the base model's tokeniser and resize the embedding table
base = AutoTokenizer.from_pretrained("your-open-weight-model")
added = base.add_tokens([p for p in new_pieces if p not in base.get_vocab()])
model = AutoModelForCausalLM.from_pretrained("your-open-weight-model")
model.resize_token_embeddings(len(base))
print("added", added, "pieces; vocab now", len(base))
# 3. Continue pretraining on Punjabi text so the new vectors learn (see module 22 for LoRA, module 20 for the loop)`,
      lines: [
        { code: "trainer = trainers.BpeTrainer(vocab_size=8000, min_frequency=20)", say: "Learn up to 8,000 pieces that appear at least 20 times in the Punjabi corpus: syllables and common words." },
        { code: "added = base.add_tokens([p for p in new_pieces if p not in base.get_vocab()])", say: "Only genuinely new pieces are added; the base vocabulary keeps its ids so nothing else shifts." },
        { code: "model.resize_token_embeddings(len(base))", say: "The embedding matrix gets new rows for the new tokens. They start random and must be trained." },
        { code: "# 3. Continue pretraining on Punjabi text so the new vectors learn (see module 22 for LoRA, module 20 for the loop)", say: "Without this step the new tokens are worse than fragments. Hundreds of millions of Gurmukhi tokens is a realistic budget." },
      ],
      note: "Measure fertility before and after; the drop is your proof the extension worked.",
    },
    useIt: "Choose models by tokeniser fit for Punjabi: measure fertility on Gurmukhi, Shahmukhi and Romanised samples. For open-weight fine-tuning, extend the vocabulary with Punjabi pieces and continue pretraining before task fine-tuning. For hosted models, the tokeniser is fixed; pick the provider whose fertility for Punjabi is lowest.",
    takeaways: ["Tokenisers earn vocabulary per language from their training mix; small languages need up-sampling or dedicated vocabularies.", "Byte-level English-heavy tokenisers shred Gurmukhi into character and vowel-sign fragments.", "Tokeniser fit is often the biggest lever for Punjabi quality and cost.", "You can extend an open-weight model's tokeniser with Punjabi pieces, then train the new vectors."],
    terms: [["multilingual tokeniser", "a tokeniser whose vocabulary was learned from many languages"], ["up-sampling", "repeating a small language's text so it earns a fairer share of vocabulary or training"], ["vocabulary extension", "adding new tokens for a language to an existing tokeniser and training their vectors"]],
    reflect: { q: "After extending the vocabulary, Punjabi fertility dropped but evaluation got worse. What was skipped?", a: "Training the new embeddings. New tokens start with random vectors; without continued pretraining on Punjabi text the model sees meaningless ids where it used to see weak-but-trained fragments. Continue pretraining first, then fine-tune on the task." },
  },

  "m43-language-imbalance-in-training-data": {
    simple: "Training corpora are dominated by English, so a model's attention, vocabulary and knowledge are unequally distributed; sampling and data curation are how designers push back.",
    concept:
      "Web-scale corpora reflect who writes online. English is roughly half of the text; the next dozen languages take most of the rest; thousands of languages share the final sliver. **Language imbalance** is this skew carried into training, and it shapes the model in three ways. Vocabulary: the tokeniser gives slots to what is frequent. Knowledge: the facts, idioms and cultural references the model knows come mostly from English sources. Behaviour: instruction-following and safety training are usually done mostly in English, so the model is better behaved there.\n\nModel builders counter imbalance with **sampling**: when assembling training batches they take a smaller language's text more often than its share, using a temperature-style rule that flattens the distribution. They also add parallel data and translated instruction sets. The result is less skewed than the raw web, never balanced.\n\nFor Punjabi this means: the base model has seen some Gurmukhi, very little Shahmukhi labelled as Punjabi, and Romanised Punjabi mostly as noise in English data. Its 'knowledge' of Punjab is largely what English and Hindi sources say about it.",
    why:
      "Imbalance explains behaviours that otherwise look like bugs: answers drifting into Hindi or English mid-sentence, Punjabi idioms translated literally from English, refusals and safety rules that work in English but not in Punjabi, and confident errors about local facts. Recognising imbalance as the cause points to real fixes: supply local knowledge through retrieval, add Punjabi instruction data, and test safety in Punjabi separately.",
    how: [
      "The raw corpus is collected from crawls, books and code; language identification tags each document; the resulting shares are wildly uneven.",
      "A sampling rule assigns each language a probability for batch selection, usually share raised to a power below 1 (temperature sampling), so small languages are seen more than their share but still less than large ones.",
      "Parallel corpora and translated instruction datasets are added so the model links languages and learns to follow instructions beyond English.",
      "Safety and preference training is done in a handful of languages; others inherit it partially through transfer.",
      "The finished model's per-language quality mirrors the final mix, which is why benchmarks per language matter more than the headline.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Language", "Raw share of corpus", "Share after temperature sampling (α = 0.3)", "Effect"],
        rows: [
          ["English", "50%", "≈ 24%", "still dominant, but less so"],
          ["Hindi", "0.8%", "≈ 6.6%", "seen eight times more often than raw"],
          ["Punjabi (Gurmukhi)", "0.05%", "≈ 2.9%", "seen about sixty times more often than raw"],
          ["Shahmukhi tagged as Punjabi", "0.002%", "≈ 1.1%", "boosted, but there is so little that quality stays low"],
        ],
      },
      caption: "Temperature sampling flattens the mix (shares are illustrative, computed with the formula below). Boosting cannot create text that does not exist.",
    },
    everyday: {
      title: "A library where one shelf is a wall",
      text: "Picture a library where English fills an entire wall, Hindi a bookcase, and Punjabi half a shelf, most of it in one script. A reader who wanders at random becomes an English expert. A librarian who wants fairness sends the reader to the small shelves more often than chance, so they read every Punjabi book several times. The reader learns far more Punjabi than wandering would give, but still cannot know what was never written. Sampling is the librarian; the half-shelf is the limit.",
    },
    engineering: {
      title: "Why the assistant answered in Hindi",
      text: "A Punjabi support bot kept replying in Hindi to Gurmukhi questions about anything technical. The trace showed the pattern: everyday questions got Punjabi, questions about 'router', 'invoice', 'refund' got Hindi. The model had seen those topics discussed in Hindi and English far more than in Punjabi, so its most probable continuation switched language. Two fixes: a system rule and examples that forced Gurmukhi output, and retrieval of Punjabi help articles so the technical vocabulary arrived in the prompt in Gurmukhi. A third, later: fine-tuning on 1,200 Punjabi technical Q&A pairs, which removed the drift at the source.",
    },
    maths: {
      formula: "p_sampled(L) = share(L)^α ÷ Σ share(L′)^α,  with α between 0 and 1 (α = 1 keeps raw shares; α → 0 makes all languages equal)",
      meaning: "Each language's raw share is raised to a power below 1, which shrinks big shares more than small ones, then everything is rescaled to add up to 1. Smaller α means a flatter, fairer mix.",
      worked: [
        "Three languages, raw shares: English 0.50, Hindi 0.008, Punjabi 0.0005. Take α = 0.3.",
        "Powers: 0.50^0.3 ≈ 0.812; 0.008^0.3 ≈ 0.235; 0.0005^0.3 ≈ 0.102. (Ignoring other languages for the example.)",
        "Sum ≈ 1.149. Sampled shares: English 0.812 ÷ 1.149 ≈ 0.71; Hindi ≈ 0.20; Punjabi ≈ 0.09.",
        "Punjabi went from 0.05% to about 9% of batches in this three-language example: a huge boost, bought by showing the same small corpus many times, which risks memorising it.",
      ],
    },
    code: {
      title: "Temperature sampling over languages",
      lang: "py",
      src: `import random

raw_share = {"en": 0.50, "hi": 0.008, "pa": 0.0005}

def sampling_weights(shares, alpha=0.3):
    powered = {lang: s ** alpha for lang, s in shares.items()}
    total = sum(powered.values())
    return {lang: p / total for lang, p in powered.items()}

weights = sampling_weights(raw_share, alpha=0.3)
print({lang: round(w, 2) for lang, w in weights.items()})

def next_batch_language():
    langs = list(weights)
    return random.choices(langs, weights=[weights[l] for l in langs])[0]

print([next_batch_language() for _ in range(10)])`,
      lines: [
        { code: "powered = {lang: s ** alpha for lang, s in shares.items()}", say: "Raising to a power below 1 pulls big and small shares closer together." },
        { code: "return {lang: p / total for lang, p in powered.items()}", say: "Rescale so the weights add up to 1 again; these are the batch probabilities." },
        { code: "return random.choices(langs, weights=[weights[l] for l in langs])[0]", say: "Each training batch picks a language by these weights; Punjabi now appears far more often than its raw share." },
      ],
      output: "{'en': 0.71, 'hi': 0.2, 'pa': 0.09}\n['en', 'en', 'hi', 'en', 'pa', 'en', 'hi', 'en', 'en', 'pa']",
    },
    useIt: "When a Punjabi model drifts into Hindi or English, misses local facts, or ignores safety rules it follows in English, diagnose imbalance and treat it: force the output language with rules and examples, supply local knowledge by retrieval, add Punjabi instruction and safety data when fine-tuning, and test safety per language. When choosing a model, prefer ones whose builders document their language mix and sampling.",
    takeaways: ["Training corpora are heavily skewed to English; the model's vocabulary, knowledge and behaviour follow.", "Temperature sampling boosts small languages during training but cannot invent missing text.", "Language drift mid-answer is an imbalance symptom: fix with output rules, retrieval and Punjabi instruction data.", "Safety and instruction training are mostly English; test them in Punjabi."],
    terms: [["language imbalance", "the uneven share of languages in training data and its effect on the model"], ["temperature sampling (languages)", "a rule that flattens language shares when picking training batches"], ["language drift", "a model switching to another language mid-answer because it is more probable there"]],
    reflect: { q: "A model builder reports 'Punjabi was up-sampled 60×'. Does that mean the model knows Punjabi as well as Hindi?", a: "No. Up-sampling shows the same small Punjabi corpus many times; it improves fluency and vocabulary but cannot add facts, styles or domains that were never written. Hindi's far larger raw corpus still gives broader knowledge. Measure both on your own test set." },
  },

  "m43-code-switching": {
    simple: "Code-switching is mixing two languages in one sentence or conversation; real Punjabi users do it constantly, and models trained on tidy single-language text handle it badly unless taught.",
    concept:
      "People who speak two languages mix them: a Punjabi sentence with English nouns, an English sentence with a Punjabi tag, or a switch mid-conversation. **Code-switching** is that mixing. In Punjab and the diaspora it is the normal register of chat, support messages and speech: ਮੈਂ ਕੱਲ੍ਹ office ਨਹੀਂ ਆਵਾਂਗਾ, meeting cancel ਹੋ ਗਈ ('I won't come to the office tomorrow, the meeting got cancelled'). In Romanised form: 'mainu order di update chahidi hai, delivery kadon hai?' ('I need an update on my order, when is delivery?').\n\nModels are trained mostly on documents in one language at a time, so mixed text looks like noise. Language identification mislabels it, tokenisers switch modes mid-word, and the model may answer in the wrong language or misunderstand the Punjabi part. Script mixing adds a layer: Gurmukhi with Latin-script English words is common, and so is everything in Latin script.\n\nHandling code-switching well means collecting mixed examples, evaluating on mixed inputs, and designing the pipeline (detection, normalisation, prompts) to expect mixing rather than treat it as an error.",
    why:
      "A Punjabi product that only works on pure Punjabi fails most real messages. Support transcripts, social posts and voice notes are mixed. If the evaluation set is pure Gurmukhi, the dashboard says 85% while users experience 60%. Code-switching is the gap between the textbook language and the language people actually use, and it must be designed for, measured and trained on.",
    how: [
      "Collect real mixed-language text from the product's own channels (anonymised) rather than from Wikipedia-like sources.",
      "Tag the switching pattern in the evaluation set: intra-sentence mixing, script mixing, tag switches, so results can be split by pattern.",
      "Detect language per message, not per document, and allow 'mixed' as a label instead of forcing a single language.",
      "Instruct the model to accept mixed input and reply in the user's dominant language and script, with examples that show it.",
      "Include mixed examples in fine-tuning data in the proportion they occur in real traffic.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Pattern", "Example", "Typical model failure"],
        rows: [
          ["Punjabi frame, English nouns", "ਮੇਰਾ order ਅਜੇ deliver ਨਹੀਂ ਹੋਇਆ", "treats as Hindi; answers in Hindi"],
          ["All Romanised, mixed", "mera order abhi tak deliver nahi hoya", "reads as broken English or Hindi; misses 'hoya' as Punjabi"],
          ["English frame, Punjabi tag", "Refund kab milega yaar, dasso?", "ignores the Punjabi; answers only the English part"],
          ["Script switch mid-conversation", "Gurmukhi question, then 'ok thanks'", "switches reply language to English permanently"],
        ],
      },
      caption: "Each pattern breaks a different part of the pipeline. The evaluation set should contain all of them.",
    },
    everyday: {
      title: "How the family group chat actually reads",
      text: "Open a Punjabi family's group chat and you will not find pure Gurmukhi paragraphs. You will find 'Beta, dinner te aa jana, 8 baje' (come for dinner at 8), 'Haan ji, thoda late hovanga' (yes, I'll be a bit late), a voice note, and a Gurmukhi forward from an uncle. Any assistant meant for these people has to read that chat as it is. A model that needs textbook Punjabi is like a relative who insists everyone speak properly: ignored.",
    },
    engineering: {
      title: "Evaluating a support bot on the messages it actually gets",
      text: "A telecom's Punjabi bot scored 84% on a Gurmukhi test set and received constant complaints. The team sampled 500 real messages: 12% pure Gurmukhi, 31% Gurmukhi with English words, 49% Romanised mixed, 8% Shahmukhi or Urdu. On the real mix the bot scored 58%. They rebuilt the test set to match the traffic, added a rule 'reply in the script the user wrote in, Punjabi words for Punjabi, keep English technical terms as written', added 800 mixed examples to fine-tuning, and routed Romanised input through transliteration where it helped. Real-traffic accuracy rose to 79%, and the dashboard finally matched the complaints queue.",
    },
    maths: {
      formula: "code-mixing index (CMI) = 100 × (N − max_lang_tokens) ÷ N,  where N is the number of language tokens in the utterance",
      meaning: "A simple score for how mixed a sentence is: 0 means one language only; the higher the score, the more evenly the languages are mixed. It lets you report accuracy by mixing level.",
      worked: [
        "'mainu order di update chahidi hai' has 6 words: Punjabi 4 (mainu, di, chahidi, hai), English 2 (order, update). CMI = 100 × (6 − 4) ÷ 6 ≈ 33.",
        "'ਮੇਰਾ order ਅਜੇ deliver ਨਹੀਂ ਹੋਇਆ': 6 words, Punjabi 4, English 2. CMI ≈ 33 as well, but script-mixed; tag it separately.",
        "'Refund kab milega yaar, dasso?': 5 words, Hindi/Punjabi 4, English 1. CMI = 100 × (5 − 4) ÷ 5 = 20.",
        "Bucket the test set by CMI (0, 1–25, 26–50) and report accuracy per bucket: a bot at 90% on CMI 0 and 55% on CMI 26–50 has a code-switching problem, not a Punjabi problem.",
      ],
    },
    code: {
      title: "Tag words by script and compute a mixing score",
      lang: "py",
      src: `import re

GURMUKHI = re.compile(r"^[\\u0A00-\\u0A7F]+$")
ARABIC = re.compile(r"^[\\u0600-\\u06FF\\u0750-\\u077F]+$")
LATIN = re.compile(r"^[A-Za-z]+$")

def script_of(word):
    w = word.strip(".,!?؟")
    if GURMUKHI.match(w): return "guru"
    if ARABIC.match(w): return "arab"
    if LATIN.match(w): return "latn"
    return "other"

def mixing_index(text):
    scripts = [script_of(w) for w in text.split()]
    scripts = [s for s in scripts if s != "other"]
    if not scripts: return 0.0
    dominant = max(scripts.count(s) for s in set(scripts))
    return round(100 * (len(scripts) - dominant) / len(scripts), 1)

print(mixing_index("ਮੇਰਾ order ਅਜੇ deliver ਨਹੀਂ ਹੋਇਆ"))
print(mixing_index("mainu order di update chahidi hai"))`,
      lines: [
        { code: "def script_of(word):", say: "Script per word is cheap and reliable; language per word (is 'order' English or a Punjabi loanword?) is harder and needs a dictionary or a model." },
        { code: "dominant = max(scripts.count(s) for s in set(scripts))", say: "The most common script in the message; everything else counts as mixing." },
        { code: "return round(100 * (len(scripts) - dominant) / len(scripts), 1)", say: "The code-mixing index for scripts. For all-Latin text it returns 0 even when the words are mixed Punjabi and English; that needs word-level language tagging." },
      ],
      output: "33.3\n0.0",
      note: "The second line shows the limit: Romanised mixing is invisible to script detection. Lesson 46.2 and a word-level language tagger handle that.",
    },
    useIt: "Build Punjabi evaluation sets from real traffic with its real mixing; report accuracy by mixing pattern; instruct the model to accept mixed input and reply in the user's script; include mixed examples in fine-tuning; let language detection say 'mixed'. The assistant should feel like a bilingual colleague, not a language teacher.",
    takeaways: ["Code-switching is the normal register of real Punjabi users; pure-script test sets overstate quality.", "Patterns differ: Punjabi frame with English nouns, Romanised mixing, tag switches, script switches; each breaks something different.", "Measure by mixing level and script; design detection to allow 'mixed'.", "Train and prompt with mixed examples in real proportions."],
    terms: [["code-switching", "mixing two languages within a sentence or conversation"], ["script mixing", "using two writing systems in one message, such as Gurmukhi with Latin-script English words"], ["code-mixing index", "a 0–100 score of how evenly languages are mixed in an utterance"]],
    reflect: { q: "Your bot is told 'always reply in Punjabi'. A user writes 'router restart karke dekhya, still not working'. What should the reply look like?", a: "Punjabi in the user's script (Romanised here), keeping technical words as the user used them: 'Theek hai, router nu 30 second lai band karo, phir on karo; je fer vi light red hai ta mainu dasso.' Translating 'router' into a Punjabi coinage would confuse the user; switching to Gurmukhi would too." },
  },

  "m43-transliteration": {
    simple: "Transliteration rewrites the same words in a different script, Gurmukhi to Roman letters or to Shahmukhi, without translating; it is a core tool for connecting Punjabi's three written forms.",
    concept:
      "Translation changes the language; **transliteration** changes only the writing system. ਪੰਜਾਬ, پنجاب and 'Punjab' are one word in three scripts. For Punjabi, transliteration connects three worlds: Gurmukhi (India), Shahmukhi (Pakistan) and Romanised text (chat, search boxes, diaspora). A model or dataset strong in one script can serve the others if transliteration is good.\n\nIt is harder than a letter table. Gurmukhi and Shahmukhi do not map one to one: Shahmukhi has several letters for sounds Gurmukhi writes with one (س, ص, ث all become ਸ), and Shahmukhi often omits short vowels that Gurmukhi writes, so Shahmukhi → Gurmukhi needs a dictionary or a model to restore them. Romanised Punjabi has no standard at all: 'ਕਿੱਥੇ' appears as kithe, kithay, kitthe, kithhe. Gurmukhi → Roman is a rule; Roman → Gurmukhi is a guess ranked by a model.\n\nIn practice: rule-based tables for Gurmukhi → Roman and Gurmukhi ↔ Shahmukhi with a dictionary for the ambiguous cases, and a learned model for Roman → Gurmukhi.",
    why:
      "Without transliteration, every Punjabi resource is a third of its potential: Gurmukhi training data helps only Gurmukhi users; a Shahmukhi speaker cannot search a Gurmukhi knowledge base; a user typing Romanised Punjabi into a search box finds nothing. Transliteration lets one knowledge base, one model and one evaluation set serve all three forms, and it is the practical fix for Romanised input, which models handle worst of all.",
    how: [
      "Detect the source script (lesson 46.3).",
      "For Gurmukhi → Roman, apply a letter-and-vowel-sign table (ISO 15919 or a simpler practical scheme), handling conjuncts, tipi/bindi nasalisation and addak doubling.",
      "For Gurmukhi ↔ Shahmukhi, apply the table, then resolve ambiguities (which س/ص/ث; missing short vowels) with a word dictionary and frequency.",
      "For Roman → Gurmukhi, generate candidates by rules, then rank them with a model trained on pairs, or use a sequence model directly.",
      "Keep names, brands and English words as they are; transliterating 'WhatsApp' helps nobody.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Gurmukhi", "Shahmukhi", "Romanised (common)", "ISO 15919", "English"],
        rows: [
          ["ਪਾਣੀ", "پانی", "paani / pani", "pāṇī", "water"],
          ["ਕਿੱਥੇ", "کتھے", "kithe / kithay", "kitthē", "where"],
          ["ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ست سری اکال", "sat sri akal", "sati srī akāl", "(Sikh greeting)"],
          ["ਧੰਨਵਾਦ", "دھنواد", "dhanwaad / dhanvad", "dhannvād", "thank you"],
          ["ਚੰਗਾ", "چنگا", "changa", "cangā", "good / fine"],
        ],
      },
      caption: "One word, four spellings. Only the ISO column is deterministic; the Romanised column is whatever people type.",
    },
    everyday: {
      title: "Writing your name on a form abroad",
      text: "A person named ਹਰਪ੍ਰੀਤ writes 'Harpreet' on a British form, and a cousin in Lahore writes ہرپریت. The name did not change; the letters did. The same person's friends text 'harpreet', 'Harpret' and 'hrpreet'. A system that wants to find all of them in one database needs transliteration both ways and tolerance for spelling. That is exactly the Punjabi search problem, at the scale of every word.",
    },
    engineering: {
      title: "One knowledge base, three scripts",
      text: "A government services assistant has 2,000 help articles in Gurmukhi. Shahmukhi users and Romanised typers found nothing. The team added transliteration at two points: queries in Shahmukhi or Roman are transliterated to Gurmukhi before retrieval (Roman → Gurmukhi with a model trained on 50,000 chat-derived pairs, Shahmukhi → Gurmukhi with rules plus a 30,000-word dictionary), and answers are transliterated back to the user's script before display. Retrieval recall for Romanised queries rose from 31% to 76%; for Shahmukhi from 12% to 68%. Names and English terms were protected by a 'do not transliterate' list.",
    },
    maths: {
      formula: "character error rate (CER) = (substitutions + insertions + deletions) ÷ characters in the correct output",
      meaning: "Transliteration quality is scored by edit distance at the character level against a reference, because a single wrong vowel sign makes a different word.",
      worked: [
        "Reference Gurmukhi: ਕਿੱਥੇ (6 code points: ਕ ਿ ੱ ਥ ੇ … counting the vowel sign and addak as characters: ਕ, ਿ, ੱ, ਥ, ੇ = 5).",
        "System output: ਕਿਥੇ (missing the addak ੱ): one deletion. CER = 1 ÷ 5 = 0.20.",
        "Over a 1,000-word test set, total edits 410 against 5,900 characters: CER = 410 ÷ 5,900 ≈ 0.07. Report by direction: Roman → Gurmukhi is usually several times worse than Gurmukhi → Roman.",
      ],
    },
    code: {
      title: "A rule-based Gurmukhi → Roman transliterator (simplified)",
      lang: "py",
      src: `# A practical scheme, not ISO 15919: readable Roman letters, no diacritics.
CONS = {"ਕ": "k", "ਖ": "kh", "ਗ": "g", "ਘ": "gh", "ਚ": "ch", "ਛ": "chh", "ਜ": "j", "ਝ": "jh",
        "ਟ": "t", "ਠ": "th", "ਡ": "d", "ਢ": "dh", "ਣ": "n", "ਤ": "t", "ਥ": "th", "ਦ": "d", "ਧ": "dh",
        "ਨ": "n", "ਪ": "p", "ਫ": "ph", "ਬ": "b", "ਭ": "bh", "ਮ": "m", "ਯ": "y", "ਰ": "r", "ਲ": "l",
        "ਵ": "v", "ਸ": "s", "ਸ਼": "sh", "ਹ": "h", "ਅ": "a", "ਆ": "aa", "ਇ": "i", "ਈ": "ee", "ਉ": "u", "ਊ": "oo", "ਏ": "e", "ਐ": "ai", "ਓ": "o", "ਔ": "au"}
VOWEL_SIGNS = {"ਾ": "aa", "ਿ": "i", "ੀ": "ee", "ੁ": "u", "ੂ": "oo", "ੇ": "e", "ੈ": "ai", "ੋ": "o", "ੌ": "au"}
NASAL = {"ੰ": "n", "ਂ": "n"}
ADDAK = "ੱ"

def gurmukhi_to_roman(word):
    out = []
    double_next = False
    for ch in word:
        if ch == ADDAK:
            double_next = True
        elif ch in CONS:
            r = CONS[ch]
            out.append(r[0] + r if double_next else r)
            double_next = False
        elif ch in VOWEL_SIGNS:
            out.append(VOWEL_SIGNS[ch])
        elif ch in NASAL:
            out.append(NASAL[ch])
        else:
            out.append(ch)
    return "".join(out)

print(gurmukhi_to_roman("ਪਾਣੀ"), gurmukhi_to_roman("ਕਿੱਥੇ"), gurmukhi_to_roman("ਚੰਗਾ"))`,
      lines: [
        { code: "VOWEL_SIGNS = {\"ਾ\": \"aa\", \"ਿ\": \"i\", \"ੀ\": \"ee\", \"ੁ\": \"u\", \"ੂ\": \"oo\", \"ੇ\": \"e\", \"ੈ\": \"ai\", \"ੋ\": \"o\", \"ੌ\": \"au\"}", say: "Vowel signs attach to the previous consonant. ਿ is written before the consonant on screen but stored after it, so this loop handles it naturally." },
        { code: "if ch == ADDAK:", say: "The addak ੱ doubles the next consonant: ਕਿੱਥੇ → kitthe." },
        { code: "out.append(r[0] + r if double_next else r)", say: "Doubling by repeating the first letter of the consonant's Roman form." },
        { code: "print(gurmukhi_to_roman(\"ਪਾਣੀ\"), gurmukhi_to_roman(\"ਕਿੱਥੇ\"), gurmukhi_to_roman(\"ਚੰਗਾ\"))", say: "paanee, kitthe, changaa: readable, consistent, and unlike what people actually type, which is the reverse direction's problem." },
      ],
      output: "paanee kitthe changaa",
      note: "Gurmukhi → Roman is rules. Roman → Gurmukhi needs a model, because 'kithe' could come from several spellings. Libraries such as indic-transliteration and Aksharamukha cover the standard schemes.",
    },
    useIt: "Use transliteration to make one Gurmukhi knowledge base and model serve Shahmukhi and Romanised users: transliterate queries in, answers out. Use rules for Gurmukhi → Roman and Gurmukhi ↔ Shahmukhi with a dictionary, a learned model for Roman → Gurmukhi, and a protect-list for names and English terms. Score it with character error rate per direction.",
    takeaways: ["Transliteration changes script, not language; it links Gurmukhi, Shahmukhi and Romanised Punjabi.", "Gurmukhi → Roman is rules; Shahmukhi ↔ Gurmukhi needs a dictionary; Roman → Gurmukhi needs a model.", "It multiplies the value of every Punjabi resource and fixes Romanised input.", "Measure with character error rate per direction; protect names and English words."],
    terms: [["transliteration", "rewriting text in another script while keeping the words"], ["ISO 15919", "a standard scheme for Romanising Indic scripts with diacritics"], ["character error rate", "edits per character against a reference; the score for transliteration"]],
    reflect: { q: "Why is Shahmukhi → Gurmukhi harder than Gurmukhi → Shahmukhi?", a: "Shahmukhi usually omits short vowels and uses several letters for one sound, so the Gurmukhi vowels and the exact consonant must be inferred from the word, which needs a dictionary or a model. Going the other way, Gurmukhi gives all the information and the mapping is mostly a table." },
  },

  "m43-cross-lingual-embeddings": {
    simple: "Cross-lingual embeddings put sentences from different languages into one vector space, so a Punjabi query can find an English document and Punjabi text can be clustered with its translations.",
    concept:
      "An embedding model turns text into a vector that captures meaning (module 13). A **cross-lingual embedding** model is trained so that the same meaning in different languages lands at nearly the same point: 'my order is late', ਮੇਰਾ ਆਰਡਰ ਲੇਟ ਹੈ and میرا آرڈر لیٹ اے should have vectors with cosine similarity close to 1, while 'how do I return a sofa?' sits elsewhere, in every language.\n\nThey are trained with parallel sentences: the model is rewarded when a sentence and its translation are close and penalised when unrelated sentences are close (contrastive training). Models such as LaBSE and multilingual sentence encoders cover a hundred or more languages; coverage of Gurmukhi is usually present, Shahmukhi is weaker because training pairs are scarce, and Romanised Punjabi is weakest of all because almost no parallel data exists for it.\n\nThe measure is how well the space aligns: given a Punjabi sentence, is its English translation the nearest English vector? That retrieval accuracy, per script, is the number to check before building search on it.",
    why:
      "A Punjabi product rarely has a Punjabi version of every document. Cross-lingual embeddings let a Gurmukhi question search an English help centre, group Punjabi and English feedback about the same issue, and reuse English-labelled data. They are also how retrieval-augmented generation (module 28) works across languages. Without them every language needs its own index and its own documents.",
    how: [
      "Start from a multilingual encoder whose tokeniser covers the target scripts.",
      "Train on parallel sentence pairs with a contrastive objective: pull a sentence and its translation together, push it away from other sentences in the batch.",
      "Add monolingual data and multilingual tasks so the space keeps meaning within each language too.",
      "At use time, embed documents (any language) once and store them; embed each query and search by cosine similarity.",
      "Evaluate alignment per language pair and script: translation retrieval accuracy on held-out pairs.",
    ],
    visual: {
      kind: "flow",
      steps: ["Gurmukhi query ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ?", "cross-lingual encoder", "vector [0.12, −0.33, …]", "nearest stored vectors", "English article 'Where is my order?' (cosine 0.86)", "answer generated in Punjabi from the English article"],
      caption: "The query and the document never share a word or a script; they meet in the vector space.",
    },
    everyday: {
      title: "The same joke in two languages",
      text: "Tell a friend a joke in Punjabi and then tell its translation in English; they laugh in the same place. The meaning is the same point, reached by two roads. A cross-lingual embedding model is built to put both tellings at that same point. A monolingual embedding model would file them in two unrelated drawers, and a search in one drawer would never find the other.",
    },
    engineering: {
      title: "Punjabi queries over an English help centre",
      text: "A retailer has 1,400 English help articles and no Punjabi ones. They embed the articles with a cross-lingual encoder and let Gurmukhi queries search them; the answer is generated in Punjabi from the English article. On a 300-query test set, translation-retrieval accuracy is 81% for Gurmukhi queries, 63% for Shahmukhi, 44% for Romanised. For Romanised and Shahmukhi they add transliteration to Gurmukhi before embedding, lifting both above 75%. Later, as Punjabi articles are written, they are added to the same index: the space is shared, so nothing else changes.",
    },
    maths: {
      formula: "cosine(a, b) = (a · b) ÷ (‖a‖ ‖b‖);   alignment accuracy = share of Punjabi sentences whose nearest English vector is their own translation",
      meaning: "Cosine similarity compares directions of two vectors regardless of length. Alignment accuracy turns that into a test: for each Punjabi sentence, is the closest English sentence the right one?",
      worked: [
        "Toy 3-dimensional vectors. Punjabi ਮੇਰਾ ਆਰਡਰ ਲੇਟ ਹੈ → a = [0.8, 0.1, 0.5]. English 'my order is late' → b = [0.7, 0.2, 0.6]. English 'how do I return a sofa' → c = [0.1, 0.9, 0.2].",
        "a · b = 0.56 + 0.02 + 0.30 = 0.88. ‖a‖ = √(0.64 + 0.01 + 0.25) ≈ 0.949; ‖b‖ = √(0.49 + 0.04 + 0.36) ≈ 0.943. cosine(a, b) ≈ 0.88 ÷ 0.895 ≈ 0.98.",
        "a · c = 0.08 + 0.09 + 0.10 = 0.27; ‖c‖ ≈ 0.927. cosine(a, c) ≈ 0.27 ÷ 0.880 ≈ 0.31.",
        "The translation wins (0.98 vs 0.31): one correct retrieval. Over 300 test pairs, 243 correct → alignment accuracy 81%.",
      ],
    },
    code: {
      title: "Cross-lingual retrieval and an alignment check",
      lang: "py",
      src: `from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/LaBSE")   # a cross-lingual sentence encoder

english_docs = ["Where is my order?", "How do I return a sofa?", "Delivery times by region"]
doc_vectors = model.encode(english_docs, normalize_embeddings=True)

query = "ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ?"
q = model.encode([query], normalize_embeddings=True)[0]
scores = doc_vectors @ q                      # cosine, because the vectors are normalised
best = int(np.argmax(scores))
print(english_docs[best], round(float(scores[best]), 2))

# Alignment accuracy over held-out (punjabi, english) pairs
pa_vecs = model.encode([p for p, e in pairs], normalize_embeddings=True)
en_vecs = model.encode([e for p, e in pairs], normalize_embeddings=True)
nearest = np.argmax(pa_vecs @ en_vecs.T, axis=1)
print("alignment accuracy:", np.mean(nearest == np.arange(len(pairs))))`,
      lines: [
        { code: "doc_vectors = model.encode(english_docs, normalize_embeddings=True)", say: "The English documents are embedded once. Normalising makes the dot product equal to cosine similarity." },
        { code: "query = \"ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ?\"", say: "A Gurmukhi query: 'Where is my order?'. Not a single character in common with the documents." },
        { code: "scores = doc_vectors @ q                      # cosine, because the vectors are normalised", say: "One number per document. The highest is the best match across languages." },
        { code: "nearest = np.argmax(pa_vecs @ en_vecs.T, axis=1)", say: "For every Punjabi sentence, the index of its nearest English sentence." },
        { code: "print(\"alignment accuracy:\", np.mean(nearest == np.arange(len(pairs))))", say: "How often the nearest English sentence is the true translation: the alignment score for this script." },
      ],
      output: "Where is my order? 0.86\nalignment accuracy: 0.81",
      note: "Run the alignment check for Gurmukhi, Shahmukhi and Romanised pairs separately; they will differ, and that decides where transliteration is needed.",
    },
    useIt: "Use cross-lingual embeddings for Punjabi search over English documents, mixed-language clustering of feedback, cross-lingual RAG and reuse of English labels. Check alignment accuracy per script before relying on it, and transliterate Romanised and Shahmukhi input to Gurmukhi where alignment is weak. Module 45 builds Punjabi search and RAG on this foundation.",
    takeaways: ["Cross-lingual embeddings place the same meaning at the same point across languages.", "They are trained on parallel pairs with a contrastive objective; coverage follows parallel data, so Gurmukhi > Shahmukhi > Romanised.", "Alignment accuracy per script is the test; cosine similarity is the measure.", "They enable Punjabi queries over English documents and cross-lingual RAG."],
    terms: [["cross-lingual embedding", "a vector representation shared across languages"], ["contrastive training", "pulling matching pairs together and pushing non-matching ones apart"], ["alignment accuracy", "how often a sentence's nearest neighbour in another language is its translation"]],
    reflect: { q: "Alignment is 81% for Gurmukhi but 44% for Romanised Punjabi on the same encoder. Why, and what is the cheapest fix?", a: "The encoder saw little or no Romanised Punjabi in its parallel training data, so 'mera order kithe hai' is embedded as if it were odd English. The cheapest fix is transliterating Romanised queries to Gurmukhi before embedding, which the encoder does understand; collecting Romanised parallel pairs for fine-tuning comes later." },
  },
};

export const M43_QUIZ: Quiz[] = [
  {
    q: "A model scores 91% in English and 61% in Gurmukhi Punjabi on the same support test. Which statement is most useful?",
    options: ["The model does not support Punjabi", "The relative gap is about a third; now find whether the cause is data, tokeniser or knowledge", "Punjabi is a harder language", "The test is unfair to Punjabi"],
    answer: 1,
    why: ["It clearly produces Punjabi; the question is how well.", "Correct. Quantify the gap, then diagnose the cause, then pick the fix.", "Difficulty is not the issue; resources are.", "The same test translated by native speakers is exactly the fair comparison."],
    reason: true,
  },
  {
    q: "What does 'cross-lingual' add beyond 'multilingual'?",
    options: ["More languages", "A shared meaning space so tasks and searches transfer between languages", "Faster inference", "Better grammar"],
    answer: 1,
    why: ["Count of languages is multilinguality.", "Correct. Connection, not coverage: a Punjabi query can find an English document.", "No.", "Not necessarily."],
  },
  {
    q: "Gurmukhi fertility is 4.5 tokens per word on one model and 1.5 on another. What follows?",
    options: ["Nothing; fertility is cosmetic", "The second model is roughly three times cheaper for Punjabi and likely better, because its tokeniser represents Gurmukhi properly", "The first model is more accurate", "Fertility only affects English"],
    answer: 1,
    why: ["Fertility drives cost, context usage and representation quality.", "Correct. Tokeniser fit is often the biggest lever for a low-resource language.", "Shredding a script never helps accuracy.", "It affects every language differently; that is the point of measuring it."],
  },
  {
    q: "Why can up-sampling Punjabi 60× during training not make it as good as Hindi?",
    options: ["Up-sampling is illegal", "It repeats a small corpus; it cannot add facts or domains that were never written", "Punjabi has no grammar", "Hindi is up-sampled too"],
    answer: 1,
    why: ["No.", "Correct. Sampling flattens the mix but cannot create missing text.", "No.", "Irrelevant to the limit."],
    reason: true,
  },
  {
    q: "A bot scores 84% on a pure-Gurmukhi test set and users complain constantly. The likeliest explanation?",
    options: ["Users are wrong", "Real messages are code-switched and Romanised; the test set does not match the traffic", "The model is too slow", "The pass mark is too high"],
    answer: 1,
    why: ["Complaints are data.", "Correct. Build the test set from real traffic with its real mixing.", "Speed does not explain wrong answers.", "No."],
  },
  {
    q: "Which transliteration direction needs a learned model rather than a letter table?",
    options: ["Gurmukhi → Roman", "Roman → Gurmukhi", "Both are tables", "Neither is possible"],
    answer: 1,
    why: ["Gurmukhi gives full information; rules suffice.", "Correct. Romanised spelling is unstandardised and ambiguous; candidates must be ranked by a model.", "Roman → Gurmukhi is not.", "Both are routinely done."],
  },
  {
    q: "Alignment accuracy of a cross-lingual encoder is 81% for Gurmukhi and 44% for Romanised Punjabi. Cheapest fix for Romanised search?",
    options: ["Train a new encoder from scratch", "Transliterate Romanised queries to Gurmukhi before embedding", "Tell users to type in Gurmukhi", "Lower the similarity threshold"],
    answer: 1,
    why: ["Expensive and slow.", "Correct. The encoder already understands Gurmukhi; transliteration gets Romanised input there.", "Users will not.", "A threshold does not fix a misaligned space."],
  },
  {
    q: "A Punjabi assistant replies in Hindi whenever the topic is technical. Root cause?",
    options: ["A bug in the tokeniser", "Language imbalance: technical topics were seen far more in Hindi and English, so the most probable continuation switches language", "The user asked in Hindi", "Temperature too low"],
    answer: 1,
    why: ["The tokeniser does not choose languages.", "Correct. Fix with output-language rules and examples, Punjabi retrieval, and Punjabi instruction data.", "The trace shows Gurmukhi questions.", "Sampling settings do not create drift by topic."],
  },
];

export const M43_EXERCISES: Exercise[] = [
  {
    title: "Build a per-language quality report",
    kind: "think",
    task: "You have 150 support questions in English. Plan how to turn them into a per-language, per-script evaluation for Punjabi (Gurmukhi, Shahmukhi, Romanised) and Hindi, including who translates, what counts as correct, and how you will report gaps.",
    hints: ["Native speakers translate and also write the expected answer in their script.", "Romanised questions should come from real chat, not from transliterating Gurmukhi."],
    solution: "Have two native speakers per script translate each question and expected answer; a third resolves disagreements. For Romanised Punjabi, collect real user phrasings from logs instead of transliterating. Define correct as 'the expected fact is present and the answer is in the user's script'. Score each of the five sets with the same grader; report the score, the gap to English and the relative gap per set; split Punjabi further by code-mixing level. Rerun on every model or prompt change.",
  },
  {
    title: "Compute fertility and cost",
    kind: "calculate",
    task: "An English answer uses 180 input and 140 output tokens. Measured fertility ratios for Gurmukhi are 3.8 on model A and 1.5 on model B. At £2 per million input tokens and £8 per million output tokens, compute the cost per Punjabi answer on each model and the monthly saving at 30,000 answers a day.",
    hints: ["Scale both input and output tokens by the ratio.", "Cost = input tokens × input price + output tokens × output price."],
    solution: "Model A: 684 input + 532 output tokens → 684 × 0.000002 + 532 × 0.000008 = £0.001368 + £0.004256 = £0.005624. Model B: 270 + 210 → £0.00054 + £0.00168 = £0.00222. Saving per answer £0.003404; per day × 30,000 = £102.12; per month (30 days) ≈ £3,064, before counting the quality gain from the better tokeniser.",
  },
  {
    title: "Temperature sampling by hand",
    kind: "calculate",
    task: "Raw shares: English 0.60, Hindi 0.01, Punjabi 0.001 (ignore other languages). Compute the sampled shares with α = 0.5 and with α = 0.2. Which α gives Punjabi more than 10% of batches, and what is the risk of using it?",
    hints: ["Raise each share to the power α, then divide by the sum.", "0.001^0.5 = √0.001 ≈ 0.0316."],
    solution: "α = 0.5: powers 0.775, 0.100, 0.0316; sum 0.906; shares ≈ 0.855, 0.110, 0.035 (Punjabi 3.5%). α = 0.2: powers 0.903, 0.398, 0.251; sum 1.552; shares ≈ 0.582, 0.256, 0.162 (Punjabi 16%). α = 0.2 passes 10%, but Punjabi's tiny corpus would be repeated many times over, so the model risks memorising it and overfitting; quality gains flatten and English may degrade.",
  },
  {
    title: "Write the code-switching rule for a support bot",
    kind: "think",
    task: "Write the instruction (two to four sentences) that tells a model how to handle mixed Punjabi/English input and in what form to reply, and give three example input/output pairs covering Gurmukhi-with-English, Romanised, and an English message with a Punjabi tag.",
    hints: ["Reply in the user's script.", "Keep English technical terms as the user wrote them."],
    solution: "Instruction: 'Users write Punjabi, English, or a mix, in Gurmukhi, Shahmukhi or Roman letters. Reply in Punjabi using the same script the user used; keep product and technical terms (order, refund, router) in English as the user wrote them; if the user writes only English, reply in English.' Examples: 'ਮੇਰਾ order ਕਦੋਂ ਆਵੇਗਾ?' → 'ਤੁਹਾਡਾ order ਕੱਲ੍ਹ ਸ਼ਾਮ ਤੱਕ deliver ਹੋ ਜਾਵੇਗਾ।'; 'refund kadon milega?' → 'Refund 5 din vich tuhade card te aa javega.'; 'Still waiting for my parcel yaar' → 'Sorry for the wait; your parcel is out for delivery today.'",
  },
];
