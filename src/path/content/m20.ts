import type { Exercise, LessonBody, Quiz } from "../types";

// Module 20: LLM pretraining. One concept per lesson. Keys are lesson slugs: m20-<kebab of the concept title in map.ts>.

export const M20_BODIES: Record<string, LessonBody> = {
  "m20-pretraining-in-depth": {
    simple: "Pretraining is the long first phase where a model reads an enormous pile of text and learns, token by token, to predict what comes next; everything it 'knows' comes from this.",
    concept:
      "In Module 17 you met pretraining as a name. Here it becomes a process you could run yourself, given enough money. **Pretraining** takes a transformer (Module 16) whose weights are random numbers, and a corpus of trillions of tokens (Module 12), and does one thing over and over: show the model a stretch of text, ask it to predict the next token at every position, measure how wrong it was with cross-entropy (Module 4), and nudge every weight with gradient descent (Module 5). Repeat for a few hundred thousand steps.\n\nNothing else happens. No one teaches it grammar, facts or code. Those appear because predicting the next token well, across the whole internet, requires absorbing grammar, facts and code. The model that comes out is called a **base model**: a very good autocomplete that has read more than any person, but has no idea it is supposed to be helpful. Later modules add that.\n\nThe pipeline has stages: gather and clean data, cut it into token sequences, batch them, run the forward and backward passes across many GPUs, save checkpoints, and pay the bill. Each stage is one lesson in this module.",
    why:
      "Before pretraining, every language task needed its own model and its own labelled data: one for sentiment, one for translation, one for question answering. Pretraining exists because of a discovery: a single model trained only to predict the next token on enough text learns a general representation of language that transfers to all of those tasks with little or no extra data.\n\nIt is expensive once, and then every downstream use is cheap. That economics is why a handful of labs train base models and everyone else adapts them.",
    how: [
      "Collect raw text at scale: web crawls, books, code, papers. Clean, deduplicate and filter it (the next lessons).",
      "Tokenise everything with one fixed tokeniser and pack the token ids into fixed-length sequences, such as 4,096 tokens each.",
      "Initialise a transformer with random weights. Choose its size and the number of tokens it will see, usually about twenty tokens per parameter.",
      "For each batch: forward pass to get next-token probabilities at every position, cross-entropy loss against the real next tokens, backward pass for gradients, an AdamW step.",
      "Spread the work over hundreds or thousands of GPUs; save a checkpoint every few hours; watch the loss curve and the evaluation set.",
      "Stop when the token budget is spent. The result is a base model, ready for fine-tuning and alignment (Modules 21 to 23).",
    ],
    visual: {
      kind: "flow",
      steps: ["raw text (trillions of tokens)", "clean, dedupe, filter", "tokenise and pack into sequences", "batches of ~4M tokens", "forward → loss → backward → AdamW, on many GPUs", "checkpoints", "base model"],
      caption: "The whole of pretraining is this line, run for weeks. The only learning signal is 'what token came next'.",
    },
    everyday: {
      title: "Learning a language by reading everything",
      text: "Imagine someone who never attends a lesson but reads every book, newspaper, forum and manual in a library for years, always trying to guess the next word before turning the page. They end up fluent, widely informed and able to finish any sentence in the right style. They have not been taught anything on purpose. That is a base model after pretraining: fluent, knowledgeable, and not yet trained to answer you.",
    },
    engineering: {
      title: "A lab plans a 7-billion-parameter model",
      text: "A research team decides on a 7B model and a budget of 2 trillion training tokens. They assemble a corpus of about 15 trillion raw tokens, which cleaning and deduplication cut to 2.5 trillion usable ones. They reserve 1,024 GPUs for roughly a week, set a batch of 4 million tokens, and plan a checkpoint every 1,000 steps. The engineering risks are not the maths; they are a data pipeline that silently includes the test sets, a node failure at step 300,000 with no recent checkpoint, and a learning-rate schedule that diverges on day three. All three have happened to real teams.",
    },
    maths: {
      formula: "training compute ≈ 6 × N × D FLOPs   (N = parameters, D = training tokens)",
      meaning: "Every token costs about six floating-point operations per parameter: two for the forward pass, four for the backward pass. This one line sizes the budget for any pretraining run.",
      worked: [
        "N = 7 × 10⁹ parameters, D = 2 × 10¹² tokens.",
        "Compute = 6 × 7 × 10⁹ × 2 × 10¹² = 8.4 × 10²² FLOPs.",
        "One A100 GPU delivers about 3 × 10¹⁴ useful FLOPs per second at realistic utilisation.",
        "Time on one GPU = 8.4 × 10²² ÷ 3 × 10¹⁴ = 2.8 × 10⁸ seconds ≈ 78,000 GPU-hours.",
        "On 1,024 GPUs: 78,000 ÷ 1,024 ≈ 76 hours, about three days of wall-clock time.",
      ],
      note: "Published figures for 7B models trained on 2T tokens are in this range. The formula ignores attention's quadratic term, which matters for very long sequences.",
    },
    code: {
      title: "The pretraining loop, stripped to its skeleton",
      lang: "py",
      src: `import torch

model = Transformer(vocab=32000, d_model=4096, layers=32)      # random weights
optim = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.1)

for step, batch in enumerate(token_batches):                   # batch: [B, T] token ids
    inputs, targets = batch[:, :-1], batch[:, 1:]              # predict position t+1 from positions <= t
    logits = model(inputs)                                     # [B, T-1, vocab]
    loss = torch.nn.functional.cross_entropy(logits.reshape(-1, 32000), targets.reshape(-1))
    loss.backward()
    optim.step()
    optim.zero_grad()
    if step % 1000 == 0:
        torch.save(model.state_dict(), f"ckpt-{step}.pt")`,
      lines: [
        { code: "model = Transformer(vocab=32000, d_model=4096, layers=32)      # random weights", say: "A transformer of a chosen size, starting from random numbers. Nothing is known yet." },
        { code: "inputs, targets = batch[:, :-1], batch[:, 1:]              # predict position t+1 from positions <= t", say: "The targets are the same tokens shifted one place left. The label for every position is simply the next token." },
        { code: "loss = torch.nn.functional.cross_entropy(logits.reshape(-1, 32000), targets.reshape(-1))", say: "Cross-entropy (Module 4) at every position at once: how surprised the model was by what actually came next." },
        { code: "loss.backward()", say: "Backpropagation (Module 5) through all 32 layers." },
        { code: "optim.step()", say: "AdamW nudges every one of the billions of weights." },
        { code: "torch.save(model.state_dict(), f\"ckpt-{step}.pt\")", say: "A checkpoint: the weights on disk, so a crash costs hours, not weeks." },
      ],
      note: "Real training adds mixed precision, gradient clipping, a learning-rate schedule and distribution across GPUs. The loop itself is this.",
    },
    useIt: "You will almost never pretrain a model yourself; you will choose one (Module 24) and adapt it (Modules 21 to 23). Understanding pretraining tells you what a base model can and cannot know, why its knowledge stops at a date, why it costs what it costs, and why a fine-tune on a few thousand examples can only steer, never replace, what trillions of tokens put in.",
    takeaways: ["Pretraining = next-token prediction on trillions of tokens, from random weights, with gradient descent.", "The output is a base model: fluent and knowledgeable, not yet helpful.", "Compute ≈ 6 × parameters × tokens; a 7B model on 2T tokens is tens of thousands of GPU-hours.", "Expensive once, cheap to reuse: that is why everyone adapts base models instead of training them."],
    terms: [["pretraining", "the first, largest training phase: next-token prediction on a huge corpus"], ["base model", "the model straight out of pretraining, before any instruction or preference training"], ["corpus", "the collection of text a model is trained on"]],
    reflect: { q: "If the only signal is 'predict the next token', where does a model's knowledge of chemistry come from?", a: "From chemistry text. To predict the next token in a chemistry textbook well, the model must internalise what chemistry sentences say; otherwise its predictions would be wrong and the loss high. Knowledge is a by-product of prediction, which is also why it can be confidently wrong where the text was wrong or missing." },
  },

  "m20-training-corpora": {
    simple: "A training corpus is the mixture of text sources a model learns from; its size and its mix decide what the model will be good at.",
    concept:
      "A **training corpus** is not 'the internet'. It is a deliberately assembled mixture: web pages filtered for quality, books, academic papers, source code, reference works, forums, sometimes transcripts, in chosen proportions. Each source teaches something different. Code teaches structure and precise syntax; books teach long coherent prose; forums teach conversation; papers teach reasoning in formal registers.\n\nTwo numbers describe a corpus: its size in tokens and its **data mix**, the share of each source. A model trained on 30% code writes better code than one trained on 5%, and slightly worse poetry. Labs tune the mix on small models first, then scale the winning recipe.\n\nSize matters alongside parameters. The compute-optimal rule of thumb is about twenty tokens of training data per parameter, but models meant to be cheap at inference are trained far beyond that, because a smaller model that has read more is cheaper to serve forever.",
    why:
      "Models are what they read. A corpus with little code makes a poor coding assistant; one with little medical text makes a model that invents drug names; one dominated by low-quality web pages makes a model that writes like low-quality web pages. The corpus also sets the model's languages: a corpus that is 90% English produces a model that is weak in Punjabi, however large it is (Stage 9 returns to this).\n\nAssembling the corpus is therefore the first real design decision of a model, made before any GPU is switched on.",
    how: [
      "List candidate sources: web crawls, books, code repositories, papers, encyclopaedias, Q&A sites, licensed datasets.",
      "Estimate each source's size in tokens after cleaning and its quality.",
      "Choose a mix: percentages per source, and how many times high-value sources may be repeated.",
      "Train small models on candidate mixes and compare them on a broad evaluation set.",
      "Scale the chosen mix to the full token budget; record exactly what went in, for reproducibility and legal review.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Source", "Teaches", "Typical share", "Risk"],
        rows: [
          ["filtered web crawl", "breadth, everyday language, recent topics", "60–70%", "low quality, duplicates, personal data"],
          ["books", "long coherent prose, narrative, vocabulary", "5–10%", "licensing"],
          ["source code", "syntax, structure, step-by-step reasoning", "10–20%", "licences, secrets in repos"],
          ["papers and reference", "formal reasoning, facts", "5–10%", "dense, narrow"],
          ["conversation and Q&A", "dialogue, instructions", "2–5%", "toxicity, noise"],
        ],
      },
      caption: "Shares are illustrative; every lab's recipe differs. The mix is tuned, not guessed.",
    },
    everyday: {
      title: "A reading diet",
      text: "A child who reads only comics writes vividly and spells badly; one who reads only textbooks writes stiffly and knows a lot. A balanced diet gives both. A model's corpus is its reading diet, chosen on purpose, and the proportions show up in everything it writes afterwards.",
    },
    engineering: {
      title: "Choosing the mix for a coding-first model",
      text: "A company wants a model for its developer tools. They start from an open recipe of 15% code and run three small 300-million-parameter models with 15%, 35% and 55% code. The 55% model scores best on code benchmarks but noticeably worse on reading comprehension, which their product also needs for documentation questions. They settle on 35%, add a licensed set of technical manuals, and record the final mix in a datasheet that legal and the model card both use. The decision took two weeks of small-model runs and saved a wasted month on the big one.",
    },
    maths: {
      formula: "compute-optimal tokens ≈ 20 × parameters;   tokens seen per source = mix share × total tokens",
      meaning: "The twenty-to-one rule says how much data a model of a given size can make good use of in one training run. The second line converts a mix percentage into a token count.",
      worked: [
        "A 7B model: compute-optimal data ≈ 20 × 7 × 10⁹ = 1.4 × 10¹¹, i.e. 140 billion tokens.",
        "Most teams train far past that for cheaper inference later: 2 trillion tokens is about 14× the optimum.",
        "With a 15% code share and 2 trillion total tokens, the model reads 0.15 × 2 × 10¹² = 300 billion tokens of code.",
        "If the cleaned code source holds only 150 billion tokens, each is seen twice: two epochs on that source.",
      ],
      note: "The twenty-to-one figure comes from scaling-law experiments; it is a planning tool, not a law of nature.",
    },
    useIt: "When choosing a base model (Module 24), read its data mix: it predicts strengths and gaps better than the parameter count. When your task is in a language or domain the corpus barely covered, expect to supply that text yourself through fine-tuning or retrieval.",
    takeaways: ["A corpus is a chosen mixture of sources with a size in tokens and a mix in percentages.", "The mix shapes the model's strengths; it is tuned on small models before the big run.", "About twenty tokens per parameter is compute-optimal; serving-optimised models train far beyond it.", "What was not in the corpus is not in the model."],
    terms: [["data mix", "the share of each source in a training corpus"], ["compute-optimal", "the data size at which a model of a given size uses a training budget best"]],
    reflect: { q: "Why would a lab train a 7B model on 2T tokens when 140B is 'optimal'?", a: "Optimal there means best loss for a fixed training budget. If the model will be served to millions of users, a smaller model that trained longer is cheaper on every single inference, and the extra training cost is paid once." },
  },

  "m20-data-collection": {
    simple: "Data collection gathers the raw text: crawling the web, licensing books and code, and recording where every piece came from.",
    concept:
      "**Data collection** is the plumbing that brings trillions of tokens into one place. The largest source is the web, reached through crawls: programs that follow links, download pages and store the HTML. Public crawl archives already hold petabytes; labs either use those or run their own crawlers with stricter rules. Other sources arrive differently: books and news through licences, code through public repositories with permissive licences, papers through open archives, and specialist data through purchase or partnerships.\n\nEvery item carries **provenance**: its URL or source, the date fetched, the licence, and a content hash. Provenance makes later steps possible: removing a site that asks to be excluded, proving that a benchmark was not in the training data, and answering a regulator's question about where a sentence came from.\n\nCollection is not neutral. The crawler's rules (which domains, which languages, how deep) already shape the model before cleaning begins.",
    why:
      "A model's knowledge has a hard limit: the collected data. If collection never reached legal rulings, agricultural manuals or Punjabi forums, no later step can add them. Collection also carries the legal and ethical weight: copyrighted text, personal information, pages that forbid crawling. Doing it carelessly produces a model that cannot be shipped; doing it without provenance produces one that cannot be audited.\n\nIt exists as a separate discipline because the scale breaks ordinary tools. Downloading, storing and indexing petabytes is an engineering project of its own.",
    how: [
      "Define scope: languages, domains, date range, and what to exclude (sites opting out, paywalled content, known toxic domains).",
      "Fetch: run crawlers that respect robots rules and rate limits, or import an existing crawl archive.",
      "Record provenance for every document: source, URL, fetch time, licence, hash.",
      "Add licensed and curated sources with their contracts recorded.",
      "Store raw data immutably, so cleaning and filtering can be re-run with new rules without re-fetching.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Scope", detail: "which languages, domains, dates; which sites are excluded" },
        { label: "Fetch", detail: "crawlers or crawl archives; licensed books, code, papers" },
        { label: "Provenance", detail: "URL, time, licence, hash stored with every document" },
        { label: "Raw store", detail: "petabytes, immutable, re-processable" },
      ],
      caption: "Collection ends with raw, traceable data. Cleaning starts from this store and never destroys it.",
    },
    everyday: {
      title: "Stocking a library",
      text: "A librarian buying books for a new library decides which shelves exist before any reader arrives: if no money goes to local history, there is no local history section, however good the catalogue later becomes. They also keep the receipts, so that when a publisher asks whether a title was bought legitimately, there is an answer. Collection is the buying and the receipts.",
    },
    engineering: {
      title: "Honouring an opt-out, a year later",
      text: "A news publisher asks a lab to remove its articles from future training. Because every document in the raw store carries its source domain, the lab can list the 2.3 million affected pages in an hour, exclude the domain in the next cleaning run, and show the publisher the count. A lab that had merged everything into one anonymous text blob could only say 'we will try'. Provenance turned a legal crisis into a filter rule.",
    },
    maths: {
      formula: "raw tokens ≈ pages × average tokens per page;   storage ≈ pages × average bytes per page",
      meaning: "Two multiplications size the collection job: how many tokens the crawl yields, and how many bytes must be stored.",
      worked: [
        "A crawl of 5 billion pages at an average of 1,200 tokens of main text per page yields 5 × 10⁹ × 1,200 = 6 × 10¹² raw tokens.",
        "Cleaning typically keeps 15–25%: about 1 to 1.5 trillion usable tokens from this crawl alone.",
        "Raw HTML averages around 80 KB per page: 5 × 10⁹ × 80 KB = 400 TB of raw storage before any text extraction.",
      ],
      note: "The large gap between raw and usable tokens is why collection must gather far more than the model will read.",
    },
    useIt: "In practice you will collect data at a smaller scale for fine-tuning (Module 21) and for retrieval (Module 28). The same rules apply: define scope, respect opt-outs and licences, keep provenance for every document, and store raw data so that processing can be redone.",
    takeaways: ["Collection gathers raw text from crawls, licences and public archives at petabyte scale.", "Provenance (source, time, licence, hash) is recorded for every document from the start.", "Scope decisions made during collection shape the model before cleaning begins.", "Raw data is stored immutably; cleaning and filtering are re-runnable layers on top."],
    terms: [["crawl", "automatically downloading web pages by following links"], ["provenance", "the recorded origin of a document: where, when and under what licence it was obtained"]],
    reflect: { q: "Why keep the raw crawl after the cleaned version exists?", a: "Because cleaning rules improve and change. A new deduplication method, a new opt-out or a new quality filter must be applied to the raw data; if only the cleaned text survived, every rule change would require re-crawling." },
  },

  "m20-data-cleaning": {
    simple: "Data cleaning turns raw web pages and files into plain, readable text by stripping markup, boilerplate, junk and broken encodings.",
    concept:
      "Raw crawl data is mostly not prose. A web page's HTML is tags, scripts, menus, cookie banners, adverts and footers wrapped around a few paragraphs of actual content. **Data cleaning** extracts the content and discards the wrapper, then repairs what remains: fixes character encodings, normalises whitespace and punctuation, removes pages that are mostly navigation or lists of links, and drops documents that are too short, too repetitive or not in a target language.\n\nCleaning is rule-based and cheap per document, which matters when there are billions of them. It is also lossy by design: a model trained on uncleaned HTML learns to produce HTML, and one trained on cookie banners learns to say 'Accept all cookies' in the middle of a paragraph.\n\nThe output of cleaning is still unfiltered for quality (next lessons); it is simply text, in the right language, with the furniture removed.",
    why:
      "Every token in the corpus costs compute to train on, so tokens of navigation menus are wasted money. Worse, they are wasted in a way that damages the model: boilerplate repeated across millions of pages becomes a strong pattern the model reproduces. Early models trained on lightly cleaned crawls produced fragments like 'Share this article' and 'Read more' unprompted.\n\nCleaning exists to make the corpus mean what it appears to mean: documents of human language, one per page.",
    how: [
      "Extract main content from HTML: find the article body, drop headers, footers, menus, scripts, styles and adverts.",
      "Repair encodings so that characters display correctly; normalise whitespace, quotes and dashes.",
      "Detect the language of each document and keep only target languages.",
      "Apply document-level rules: minimum length, maximum share of symbols or digits, maximum repetition of lines, no 'lorem ipsum' or placeholder pages.",
      "Apply line-level rules: drop lines that are mostly links, buttons, or shorter than a few words.",
      "Keep statistics per rule so the team can see what each one removed and tune it.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Before cleaning", points: ["<nav> Home | Products | Login", "Accept all cookies", "<p>Interest rates rose for the third time…</p>", "Share · Tweet · Email", "© 2024 Example Ltd"] },
      right: { title: "After cleaning", points: ["Interest rates rose for the third time this year, the central bank said on Tuesday, citing…", "(language: en, 412 words, kept)"] },
      caption: "One page, one paragraph of content, four lines of furniture. Cleaning keeps the paragraph.",
    },
    everyday: {
      title: "Reading a newspaper with the adverts cut out",
      text: "Hand someone a stack of newspapers and ask them to learn about the economy. They will skip the adverts, the weather box, the page numbers and the 'continued on page 7' lines without thinking. A program has no such instinct; it must be told, rule by rule, what is the article and what is the furniture around it.",
    },
    engineering: {
      title: "The model that said 'Enable JavaScript'",
      text: "A team notices their new model occasionally writes 'Please enable JavaScript to view this content' in the middle of an answer. Tracing it back with provenance, they find 40 million crawled pages whose main content was behind a script, so the extractor had kept only that error message. A new document rule, dropping any page whose extracted text is under 50 words or matches a list of known placeholder phrases, removes them. Retraining a small model confirms the phrase is gone. Cleaning rules usually come from exactly this kind of embarrassment.",
    },
    maths: {
      formula: "kept share = kept tokens ÷ raw tokens;   cost of junk = junk tokens × 6 × N FLOPs",
      meaning: "The first line measures how aggressive cleaning is. The second prices what training on junk would have cost, using the compute formula from the first lesson.",
      worked: [
        "A crawl of 6 trillion raw tokens is cleaned to 1.3 trillion: kept share = 1.3 ÷ 6 ≈ 22%.",
        "Suppose cleaning had been skipped and 4.7 trillion junk tokens trained a 7B model: 4.7 × 10¹² × 6 × 7 × 10⁹ ≈ 2 × 10²³ FLOPs.",
        "At about 3 × 10¹⁴ FLOPs per GPU-second that is roughly 180,000 GPU-hours spent learning menus and cookie banners.",
      ],
    },
    code: {
      title: "A document-level cleaning rule",
      lang: "py",
      src: `import re

PLACEHOLDERS = ["enable javascript", "lorem ipsum", "page not found", "accept all cookies"]

def keep_document(text: str) -> bool:
    words = text.split()
    if len(words) < 50:
        return False                                   # a stub, a menu, an error page
    letters = sum(c.isalpha() for c in text)
    if letters / max(len(text), 1) < 0.6:
        return False                                   # mostly symbols, numbers or markup
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if len(set(lines)) < 0.7 * len(lines):
        return False                                   # the same line repeated: boilerplate
    low = text.lower()
    if any(p in low for p in PLACEHOLDERS):
        return False
    return True`,
      lines: [
        { code: "if len(words) < 50:", say: "Short documents are almost always stubs or navigation, not prose worth learning from." },
        { code: "if letters / max(len(text), 1) < 0.6:", say: "A page that is mostly digits and symbols is a table dump or leftover markup." },
        { code: "if len(set(lines)) < 0.7 * len(lines):", say: "If many lines are identical, the page is boilerplate: the same line repeated." },
        { code: "if any(p in low for p in PLACEHOLDERS):", say: "Known junk phrases, collected from past embarrassments, reject the page outright." },
      ],
      note: "Real pipelines have dozens of such rules, each with a counter showing how many documents it removed.",
    },
    useIt: "You will clean data for fine-tuning sets (Module 21) and for retrieval corpora (Module 28), where the same junk, boilerplate from PDFs and exported tickets, pollutes results. Extract content, normalise, drop stubs and repeats, and count what each rule removes.",
    takeaways: ["Cleaning extracts content from markup and removes boilerplate, broken encodings and junk pages.", "Junk tokens cost training compute and teach the model to reproduce junk.", "Rules are cheap, document- and line-level, and tuned by looking at what they remove.", "Cleaning keeps text in the target languages; quality filtering comes next."],
    terms: [["boilerplate", "text repeated across many pages that carries no content: menus, footers, banners"], ["content extraction", "pulling the main text out of a web page's markup"]],
    reflect: { q: "A cleaning rule drops every document under 50 words. What useful data might it throw away?", a: "Short but valuable items: dictionary entries, short poems, code snippets, error messages with their fixes, product specifications. Good pipelines treat sources differently: a 50-word minimum for web pages, a different rule for a code or reference source." },
  },

  "m20-data-deduplication": {
    simple: "Deduplication removes copies and near-copies of the same text, so the model does not over-learn and memorise whatever happened to be repeated most.",
    concept:
      "The web repeats itself. The same news article appears on hundreds of sites; the same licence text heads millions of files; the same product description is on every reseller; the same forum post is quoted again and again. **Deduplication** finds these repeats and keeps one copy.\n\nThere are two levels. **Exact deduplication** hashes each document (or each paragraph) and drops identical hashes. **Near-deduplication** catches texts that differ slightly, such as the same article with a different date line, using fingerprints that are similar when the text is similar; a common method is MinHash over word shingles. Both run at the scale of billions of documents, so they are engineered as big sorting and bucketing jobs rather than pairwise comparisons.\n\nWhat counts as a duplicate is a choice: a paragraph quoted in ten different documents may be kept once or ten times; a lab decides how many repeats of high-value text are acceptable.",
    why:
      "Repetition distorts learning in two ways. A passage seen a thousand times is weighted a thousand times more than one seen once, so the model's sense of what is normal tilts toward whatever was copied most, which tends to be spam, licences and syndicated content. And a passage seen many times gets memorised verbatim; the model will then reproduce it, including any personal data or copyrighted text inside it.\n\nExperiments show that deduplicated corpora train better models with fewer tokens. Deduplication exists because removing data made models better, which surprised people the first time.",
    how: [
      "Normalise text lightly (lowercase, collapse whitespace) so trivial differences do not hide duplicates.",
      "Exact pass: hash every document; group by hash; keep one per group.",
      "Near pass: split each document into overlapping word shingles; compute a MinHash signature; bucket signatures so that similar documents land together; compare within buckets.",
      "Decide a similarity threshold (say 80% shared shingles) and which copy to keep (often the one with the best provenance).",
      "Optionally deduplicate at paragraph level across documents for boilerplate that survived cleaning.",
      "Record removal counts; a sudden jump signals a crawl problem.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Kind", "Example", "Caught by", "Keep"],
        rows: [
          ["exact copy", "the same press release on 300 sites", "document hash", "one"],
          ["near copy", "the same article with different dates and a changed headline", "MinHash similarity 0.92", "one"],
          ["shared paragraph", "a licence header in 2 million files", "paragraph hash", "a few"],
          ["legitimate quote", "a famous sentence quoted in many essays", "below threshold", "all"],
        ],
      },
      caption: "The threshold decides where near-copy ends and legitimate reuse begins.",
    },
    everyday: {
      title: "The same joke told at every table",
      text: "If you learned about a wedding by listening at every table, and one guest's joke had been repeated at all twenty, you would come away thinking it was the most important thing that happened. Hearing it once would have been plenty. Deduplication is making sure each thing is heard about as often as it was actually said.",
    },
    engineering: {
      title: "The licence that the model recited",
      text: "An early code model, asked to write a file, often began with the full text of a popular open-source licence. The licence appeared at the top of millions of files in the corpus, so the model had seen it more than almost any other passage. After paragraph-level deduplication capped it to a handful of copies, the behaviour disappeared and code benchmarks improved slightly, because the training budget went to code instead of to the same 300 words.",
    },
    maths: {
      formula: "Jaccard similarity J(A, B) = |A ∩ B| ÷ |A ∪ B|   over the sets of word shingles",
      meaning: "Two documents are compared by the share of word sequences they have in common. MinHash estimates this number quickly without building the full sets for every pair.",
      worked: [
        "Document A: 'the bank raised rates again today' → 3-word shingles: {the bank raised, bank raised rates, raised rates again, rates again today} (4 shingles).",
        "Document B: 'the bank raised rates again yesterday' → {the bank raised, bank raised rates, raised rates again, rates again yesterday}.",
        "Shared: 3 shingles. Union: 5 shingles. J = 3 ÷ 5 = 0.6.",
        "With a threshold of 0.8 these are kept as different; with 0.5 they are near-duplicates. Real documents have thousands of shingles and far clearer scores.",
      ],
    },
    useIt: "Deduplicate every dataset you train or index: fine-tuning sets often contain the same ticket pasted twice, and retrieval corpora hold the same policy page in three formats. Hash first, then near-dedupe, and look at what was removed.",
    takeaways: ["Repeats distort what the model thinks is normal and cause verbatim memorisation.", "Exact dedup uses hashes; near dedup uses MinHash over shingles with a similarity threshold.", "Deduplicated corpora train better models with fewer tokens.", "Decide how many copies of high-value repeated text to keep."],
    terms: [["near-duplicate", "a document that differs from another only slightly"], ["shingle", "a short overlapping run of words used to fingerprint a document"], ["MinHash", "a technique that estimates how similar two sets are from small signatures"]],
    reflect: { q: "Should a fine-tuning dataset of support replies keep two near-identical examples?", a: "Usually not. The second adds almost no information and doubles the weight of that phrasing. Keep one, unless the small difference is exactly what you are teaching (for example, the same question with a different customer tier and a different correct answer)." },
  },

  "m20-data-filtering": {
    simple: "Data filtering keeps the documents worth learning from and drops the low-quality, toxic, private or contaminated ones, using classifiers and rules.",
    concept:
      "After cleaning and deduplication the corpus is text, but not all of it is text you want a model to imitate. **Data filtering** scores documents and keeps those above a bar. The bars are of several kinds. **Quality**: does this read like something a careful person wrote? A small classifier trained to tell reference-quality text from random crawl text gives each document a score. **Safety**: toxic, hateful or explicit content is down-weighted or removed. **Privacy**: personal data such as phone numbers, emails and addresses is removed or the document dropped. **Contamination**: any document containing a known evaluation benchmark is removed, so later scores are honest.\n\nFiltering is a dial, not a switch. Keep too little and the corpus loses breadth, slang and the messy language real users write; keep too much and the model learns from spam. Labs tune the thresholds on small training runs.",
    why:
      "Cleaning removes what is not prose; filtering removes prose that would make the model worse or dangerous. Models trained on quality-filtered data outperform models trained on everything, even at the same token count. Privacy filtering prevents a model from reciting someone's phone number. Contamination filtering is what makes benchmark results mean anything: a model that trained on the test questions is not being tested.\n\nFiltering exists because 'more data' stops being better once the extra data is worse than what you had.",
    how: [
      "Train a quality classifier: positives from trusted sources (encyclopaedias, curated articles), negatives from random crawl; score every document.",
      "Run safety classifiers and keyword rules; remove or down-sample flagged documents.",
      "Scan for personal data patterns (emails, phone numbers, ID numbers); redact or drop.",
      "Remove benchmark contamination: n-gram overlap search against all evaluation sets that will be used.",
      "Choose thresholds by training small models on filtered versions and comparing evaluations.",
      "Report per-filter removal rates and sample the removed documents by hand to catch over-filtering.",
    ],
    visual: {
      kind: "flow",
      steps: ["cleaned, deduplicated text", "quality score ≥ threshold", "safety screen", "privacy redaction", "benchmark decontamination", "training-ready corpus"],
      caption: "Each gate removes a few percent. Together they decide what the model will consider normal writing.",
    },
    everyday: {
      title: "Choosing which letters to learn from",
      text: "If you wanted to learn to write good letters you would study well-written ones, skip chain letters and scams, black out the bank details in the ones you keep, and certainly not practise on the exam paper you are about to sit. Filtering is those four decisions, applied to billions of documents by programs.",
    },
    engineering: {
      title: "The benchmark that was in the training data",
      text: "A lab reports a striking score on a maths benchmark. A rival finds that a popular tutoring site had posted the benchmark's questions with solutions, and that site was in the crawl. An n-gram overlap check finds 38% of the test questions present in training data nearly verbatim. The lab re-filters with decontamination, retrains, and reports a lower but honest score. Since then, decontamination has been a standard step and papers report overlap rates alongside results.",
    },
    maths: {
      formula: "contaminated = share of test items whose 13-gram appears in training data;   adjusted score computed on clean items only",
      meaning: "Overlap is measured by exact runs of thirteen tokens shared between a test item and any training document. The honest score uses only items with no overlap.",
      worked: [
        "A benchmark has 1,000 questions; 380 have a 13-token run found in the corpus: contamination = 380 ÷ 1,000 = 38%.",
        "The model scores 90% on contaminated items and 62% on clean items.",
        "Reported overall score = (380 × 0.90 + 620 × 0.62) ÷ 1,000 = (342 + 384.4) ÷ 1,000 ≈ 72.6%.",
        "Honest score on clean items only: 62%. The gap of ten points is memorisation, not ability.",
      ],
    },
    code: {
      title: "Scoring documents with a quality classifier",
      lang: "py",
      src: `from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import HashingVectorizer

vec = HashingVectorizer(n_features=2**20, ngram_range=(1, 2))
clf = LogisticRegression(max_iter=1000)

X_train = vec.transform(reference_docs + random_crawl_docs)
y_train = [1] * len(reference_docs) + [0] * len(random_crawl_docs)
clf.fit(X_train, y_train)

def quality(doc: str) -> float:
    return clf.predict_proba(vec.transform([doc]))[0, 1]   # probability it looks like reference text

kept = [d for d in corpus if quality(d) > 0.3]`,
      lines: [
        { code: "y_train = [1] * len(reference_docs) + [0] * len(random_crawl_docs)", say: "The classifier learns the difference between curated writing and random crawl; it never sees your rules spelled out." },
        { code: "return clf.predict_proba(vec.transform([doc]))[0, 1]   # probability it looks like reference text", say: "Every document gets a score from 0 to 1 instead of a yes or no." },
        { code: "kept = [d for d in corpus if quality(d) > 0.3]", say: "The threshold is deliberately low: keep breadth, drop only what is clearly junk. It is tuned by small training runs." },
      ],
      note: "A simple linear classifier is enough at this scale and runs on billions of documents cheaply.",
    },
    useIt: "Filter fine-tuning data the same way: score examples for quality, remove personal data, and make sure your evaluation set is not in your training set. The contamination check in particular catches a mistake that silently inflates every number you report.",
    takeaways: ["Filtering keeps quality, removes toxicity and personal data, and decontaminates benchmarks.", "Quality is scored by a small classifier trained on good versus random text; thresholds are tuned by small runs.", "Over-filtering loses breadth; under-filtering teaches spam.", "Decontamination is what makes reported scores honest."],
    terms: [["quality classifier", "a small model that scores how much a document resembles trusted, well-written text"], ["contamination", "evaluation data accidentally present in training data"], ["decontamination", "removing training documents that overlap with evaluation sets"]],
    reflect: { q: "A quality filter trained on encyclopaedia text as 'good' would remove what kind of valuable data?", a: "Informal but useful text: forum answers, chat logs, dialect, slang, humour, and the way real users phrase questions. A model filtered only toward encyclopaedic style writes stiffly and understands casual input worse. Good filters use several 'good' sources and a low threshold." },
  },

  "m20-training-token-sequences": {
    simple: "Before training, the cleaned text is tokenised and packed into fixed-length sequences, so every batch is a rectangle of token ids the model can process at once.",
    concept:
      "A transformer processes a fixed window of tokens at a time (Module 17's context window). Training data must therefore arrive as **training sequences** of exactly that length, say 4,096 tokens each. Documents are rarely that length: a tweet is 20 tokens, a book is 100,000. So the pipeline tokenises every document with the model's tokeniser (Module 12), then **packs** them: it concatenates documents end to end, separated by a special end-of-document token, and cuts the stream into equal pieces.\n\nPacking means one sequence can hold the end of one article, two short posts and the start of a third document. That is accepted because the end-of-document token tells the model that a new context begins, and because leaving sequences unpadded wastes compute. Some pipelines mask attention so tokens cannot look across the document boundary; others let them, having found it makes little difference at scale.\n\nThe result is a huge array of shape [number of sequences, sequence length]: the model's entire reading list as one rectangle of integers.",
    why:
      "GPUs are fast only when they do the same operation on a rectangle of numbers at once. Variable-length inputs force padding (wasted tokens) or small batches (wasted hardware). Packing turns an irregular pile of documents into dense, uniform sequences with nearly zero waste, so the compute formula from lesson one holds and the training bill is spent on real tokens.\n\nFixing the sequence length also fixes the model's context window; a model trained on 4,096-token sequences has learned positions up to 4,096 and nothing beyond.",
    how: [
      "Tokenise every cleaned document with the final tokeniser; store token ids, not text.",
      "Shuffle documents so that a sequence is not dominated by one source or one site.",
      "Concatenate: document ids, end-of-document token, next document, and so on, into one long stream.",
      "Cut the stream into sequences of the training length (for example 4,096).",
      "Optionally add attention masks at document boundaries; optionally keep track of document ids for analysis.",
      "Write sequences to sharded binary files that trainers can read at high speed.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Stream position", "Content", "Tokens"],
        rows: [
          ["0–1,811", "end of a news article", "1,812"],
          ["1,812", "<eod>", "1"],
          ["1,813–1,930", "a forum reply", "118"],
          ["1,931", "<eod>", "1"],
          ["1,932–4,095", "first 2,164 tokens of a manual (continues in the next sequence)", "2,164"],
        ],
      },
      caption: "One 4,096-token training sequence, packed from three documents. No padding; the manual continues in the next sequence.",
    },
    everyday: {
      title: "Reading in fixed-length sittings",
      text: "Suppose you read for exactly one hour at a time, whatever the material. Some sittings finish a short story and start a novel; some are mid-chapter at both ends. You still learn to read well, because 'start of a new piece' is obvious from the heading. Packed sequences are those hour-long sittings, and the end-of-document token is the heading.",
    },
    engineering: {
      title: "Why the model lost its place at 4,097",
      text: "A team deploys a model trained on 2,048-token sequences and users paste 6,000-token documents. Quality collapses past position 2,048, because the model never saw any token at a later position during training. The fix was not a prompt change; it was continued training on 8,192-token sequences with adjusted position encodings. Sequence length at training time is a hard property of the model, decided in this packing step.",
    },
    maths: {
      formula: "sequences = total tokens ÷ sequence length;   padding waste = padded tokens ÷ all tokens",
      meaning: "The first line counts how many training sequences a corpus yields. The second measures what unpacked, padded batches would have thrown away.",
      worked: [
        "A 2 trillion-token corpus at 4,096 tokens per sequence: 2 × 10¹² ÷ 4,096 ≈ 488 million sequences.",
        "Without packing, with one document per sequence and an average document of 900 tokens, each sequence would carry 900 real tokens and 3,196 padding tokens.",
        "Padding waste = 3,196 ÷ 4,096 ≈ 78%: nearly four-fifths of the compute would process nothing.",
        "Packed sequences carry only the end-of-document tokens as overhead: about 1 in 900, 0.1%.",
      ],
    },
    code: {
      title: "Packing tokenised documents into sequences",
      lang: "py",
      src: `import numpy as np

SEQ_LEN = 4096
EOD = tokenizer.eos_token_id

stream = []
for doc in shuffled_documents:
    stream.extend(tokenizer.encode(doc))
    stream.append(EOD)

n_seqs = len(stream) // SEQ_LEN
packed = np.array(stream[: n_seqs * SEQ_LEN], dtype=np.int32).reshape(n_seqs, SEQ_LEN)
np.save("train-shard-000.npy", packed)          # shape [n_seqs, 4096]`,
      lines: [
        { code: "stream.extend(tokenizer.encode(doc))", say: "Each document becomes token ids, appended to one long stream." },
        { code: "stream.append(EOD)", say: "The end-of-document marker separates documents inside a sequence." },
        { code: "packed = np.array(stream[: n_seqs * SEQ_LEN], dtype=np.int32).reshape(n_seqs, SEQ_LEN)", say: "The stream is cut into equal rows: a rectangle of integers, no padding." },
      ],
      note: "Production pipelines shard the output across thousands of files and record which documents landed in which sequence.",
    },
    useIt: "Fine-tuning data (Module 21) is packed the same way, often with masks so one example cannot see another. When your prompts will be longer than the training sequence length, choose a base model trained on long sequences; no prompt trick fixes positions the model never saw.",
    takeaways: ["Documents are tokenised, shuffled, concatenated with end-of-document tokens, and cut into fixed-length sequences.", "Packing removes padding waste, so compute is spent on real tokens.", "The training sequence length fixes the model's context window.", "Sequences are stored as sharded arrays of token ids."],
    terms: [["packing", "concatenating documents and cutting the stream into fixed-length training sequences"], ["end-of-document token", "a special token marking where one document ends and the next begins"], ["shard", "one file holding a slice of a very large dataset"]],
    reflect: { q: "A packed sequence contains the end of a cookery article and the start of a legal contract. Does the model get confused?", a: "Less than you would expect: the end-of-document token and the abrupt change of style tell it a new context has begun, and the loss at those first few tokens is simply higher. Some pipelines mask attention across the boundary to be safe; at scale both choices train well." },
  },

  "m20-next-token-prediction-objective": {
    simple: "The training objective is a single number: the average cross-entropy of the model's prediction for every next token. Lowering it is the whole of pretraining.",
    concept:
      "Module 14 introduced next-token prediction as what a language model does. In training it is written as an **objective**: a loss function the optimiser minimises. For each position in a sequence, the model outputs a probability distribution over the vocabulary (Module 18's logits and softmax). The loss at that position is the negative log of the probability it gave to the token that actually came next. The **next-token prediction objective** is the average of that loss over every position in every sequence.\n\nThis is categorical cross-entropy (Module 4) applied at every token at once, with the labels coming free from the text itself. A loss of 2.0 nats means the model gave the true next token a probability of e⁻² ≈ 13.5% on average; a loss of 1.0 means about 37%.\n\nEverything the model learns is in service of this number. It never sees a question, a rubric or a reward during pretraining. That simplicity is why pretraining scales: the objective is defined for any text in any language.",
    why:
      "A learning signal must be available for every token of trillions, cheaply, with no human in the loop. Next-token prediction is the only objective that satisfies all three: the label is the next token, it exists everywhere, and it costs nothing to compute. It is also surprisingly demanding: to predict the next token of a legal argument, a proof or a joke, the model has to model law, logic and humour.\n\nAlternatives exist, such as predicting masked words in the middle (used by encoder models, Module 17), but for generation the next-token objective wins, because generation is literally predicting the next token.",
    how: [
      "Take a sequence of tokens t₁ … tₙ. The inputs are t₁ … tₙ₋₁; the targets are t₂ … tₙ.",
      "The model produces logits for every input position; softmax turns them into probabilities over the vocabulary.",
      "At position i, the loss is −log p(tᵢ₊₁ | t₁ … tᵢ): minus the log of the probability assigned to the real next token.",
      "Average over all positions and all sequences in the batch: this is the batch loss.",
      "Backpropagate the batch loss; the optimiser updates all weights to make the true next tokens more probable.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Context so far", "True next token", "p(true token)", "loss = −ln p"],
        rows: [
          ["The capital of France is", "Paris", "0.82", "0.20"],
          ["The capital of France is Paris", ".", "0.60", "0.51"],
          ["I had eggs and", "toast", "0.15", "1.90"],
          ["I had eggs and", "regret", "0.004", "5.52"],
        ],
      },
      caption: "Confident, right predictions cost little; surprises cost a lot. The model's whole job is to be less surprised by real text.",
    },
    everyday: {
      title: "A guessing game with a scorekeeper",
      text: "Cover a page and reveal it one word at a time, guessing each next word and saying how sure you are. A strict scorekeeper fines you heavily when you were sure and wrong, lightly when you hedged, and almost nothing when you were sure and right. Playing this game for years over every book in a library is pretraining. The total fine is the loss.",
    },
    engineering: {
      title: "Watching the loss curve during a run",
      text: "A training dashboard shows the loss falling from about 10.4 at step zero (uniform guessing over a 32,000-token vocabulary) to around 2.0 by the end. The engineers watch for three shapes: a sudden spike, which usually means a bad batch or a learning rate too high; a plateau, which can mean the data has become repetitive; and a loss on the held-out evaluation set that stops tracking the training loss, which means memorisation. The loss curve is the only vital sign the run has, and the objective is what it measures.",
    },
    maths: {
      formula: "L = −(1/N) Σᵢ ln p(tᵢ₊₁ | t₁…tᵢ);   ln(32,000) ≈ 10.37 at uniform guessing",
      meaning: "The loss is the average negative log probability of the true next tokens. A model that knows nothing spreads probability evenly over the vocabulary and scores the natural log of the vocabulary size.",
      worked: [
        "Four positions with true-token probabilities 0.82, 0.60, 0.15 and 0.004.",
        "Losses: −ln 0.82 = 0.20; −ln 0.60 = 0.51; −ln 0.15 = 1.90; −ln 0.004 = 5.52.",
        "Average L = (0.20 + 0.51 + 1.90 + 5.52) ÷ 4 = 8.13 ÷ 4 ≈ 2.03.",
        "Perplexity (Module 14) = e^L = e^2.03 ≈ 7.6: on average the model is as unsure as if choosing among 7.6 equally likely tokens.",
      ],
    },
    code: {
      title: "The objective in a few lines",
      lang: "py",
      src: `import torch
import torch.nn.functional as F

def next_token_loss(model, batch):            # batch: [B, T] token ids
    inputs = batch[:, :-1]
    targets = batch[:, 1:]
    logits = model(inputs)                    # [B, T-1, V]
    log_probs = F.log_softmax(logits, dim=-1)
    picked = log_probs.gather(-1, targets.unsqueeze(-1)).squeeze(-1)   # log p of the true next token
    return -picked.mean()`,
      lines: [
        { code: "targets = batch[:, 1:]", say: "The labels are the input shifted by one. No human wrote them." },
        { code: "log_probs = F.log_softmax(logits, dim=-1)", say: "Softmax over the vocabulary, in log space for numerical stability." },
        { code: "picked = log_probs.gather(-1, targets.unsqueeze(-1)).squeeze(-1)   # log p of the true next token", say: "At each position, pick out the log probability the model gave to what actually came next." },
        { code: "return -picked.mean()", say: "Negative, averaged: the batch loss. Lower means less surprised." },
      ],
      note: "F.cross_entropy does the same in one call; this version shows where the number comes from.",
    },
    useIt: "You will read loss values on every training dashboard and in every model paper. Knowing that loss 2.0 means about 13.5% probability on the true token, and that e^loss is perplexity, lets you compare runs, spot divergence, and judge whether a fine-tune actually learned anything.",
    takeaways: ["The objective is average cross-entropy over every next token in the corpus.", "Labels come free from the text; no human annotation is needed.", "Loss = −ln p(true token); perplexity = e^loss; uniform guessing scores ln(vocabulary size).", "The loss curve is the main vital sign of a training run."],
    terms: [["objective", "the loss function training minimises"], ["nat", "the unit of a natural-log loss; a loss of 1 nat means probability 1/e ≈ 37% on the true token"]],
    reflect: { q: "Why does a lower pretraining loss not guarantee a more helpful assistant?", a: "Because the objective rewards predicting what text does say, not what a user needs. A model that perfectly predicts forum text will also predict the rudeness, the errors and the tangents in it. Helpfulness is added afterwards by fine-tuning and alignment (Modules 21 and 23)." },
  },

  "m20-training-batches": {
    simple: "A training batch is the group of sequences processed in one step; its size in tokens sets how noisy each gradient is and how well the GPUs are used.",
    concept:
      "Module 5 introduced mini-batches. In pretraining the **batch** is measured in tokens, not examples, because every sequence has the same length: a batch of 1,024 sequences of 4,096 tokens is a 4-million-token batch. Each step, the model sees the whole batch, the loss is averaged over all its tokens, one gradient is computed and one optimiser update is applied.\n\nBatch size is a trade-off. Bigger batches give a gradient that is a better estimate of the true direction, use the hardware more fully, and allow a higher learning rate, but each step costs more and there are fewer steps in the budget. Beyond a point, called the critical batch size, doubling the batch no longer halves the number of steps needed, so the extra tokens per step are wasted. Labs often start with a smaller batch and ramp it up as training proceeds.\n\nWhen a batch does not fit in GPU memory, it is split into micro-batches whose gradients are accumulated before one update; the effective batch is unchanged.",
    why:
      "One sequence at a time would make a gradient so noisy that training would wander, and would leave a GPU mostly idle. All sequences at once is impossible in memory and would allow only one update. The batch is where statistics meets hardware: large enough for a stable gradient and full GPUs, small enough to allow many updates within the token budget.\n\nIt matters commercially: a batch half as large as the critical size doubles the wall-clock time for the same result.",
    how: [
      "Choose the batch size in tokens, typically 1 to 4 million for large runs, often ramped from smaller.",
      "Compute sequences per batch = batch tokens ÷ sequence length.",
      "Split the batch across GPUs (data parallelism, lesson 11), and within a GPU into micro-batches that fit in memory.",
      "Run forward and backward on each micro-batch, accumulating gradients.",
      "After the last micro-batch, average the gradients across GPUs and apply one optimiser step.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Batch", detail: "4,194,304 tokens = 1,024 sequences × 4,096" },
        { label: "Across GPUs", detail: "256 GPUs → 4 sequences each" },
        { label: "Micro-batches", detail: "memory fits 1 sequence at a time → 4 micro-steps, gradients accumulated" },
        { label: "One update", detail: "gradients averaged over all 256 GPUs → AdamW step" },
      ],
      caption: "Many forward and backward passes, one update. The batch is defined by the update, not by what fits on one card.",
    },
    everyday: {
      title: "Marking exams in piles",
      text: "A teacher adjusting how they teach could change their method after every single exam paper (noisy, exhausting) or after reading all 300 (slow, one change a term). Reading thirty at a time and adjusting after each pile balances the two. The pile is the batch; the adjustment is the optimiser step.",
    },
    engineering: {
      title: "Doubling the batch and gaining nothing",
      text: "A team with spare GPUs doubles the batch from 4M to 8M tokens expecting to finish in half the steps. The loss per token seen is slightly worse, and the run needs almost the same number of steps, so it costs nearly twice as much compute for the same result. They were already past the critical batch size. They instead keep 4M and use the extra GPUs to run a second experiment. The critical batch size is measured, not assumed.",
    },
    maths: {
      formula: "steps = training tokens ÷ batch tokens;   sequences per GPU = (batch tokens ÷ sequence length) ÷ GPUs",
      meaning: "The token budget and the batch size fix the number of optimiser updates; the GPU count fixes how the batch is split.",
      worked: [
        "Budget 2 × 10¹² tokens, batch 4,194,304 tokens: steps = 2 × 10¹² ÷ 4.19 × 10⁶ ≈ 477,000 updates.",
        "Sequence length 4,096: sequences per batch = 4,194,304 ÷ 4,096 = 1,024.",
        "On 256 GPUs: 1,024 ÷ 256 = 4 sequences per GPU per step.",
        "If one GPU holds only 1 sequence in memory, use 4 micro-batches with gradient accumulation: same batch, same update.",
      ],
    },
    code: {
      title: "Gradient accumulation: a big batch on a small GPU",
      lang: "py",
      src: `ACCUM = 4                      # micro-batches per optimiser step

optim.zero_grad()
for i, micro in enumerate(micro_batches):
    loss = next_token_loss(model, micro) / ACCUM     # scale so the sum equals the mean over the full batch
    loss.backward()                                   # gradients add up across micro-batches
    if (i + 1) % ACCUM == 0:
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optim.step()
        optim.zero_grad()`,
      lines: [
        { code: "loss = next_token_loss(model, micro) / ACCUM     # scale so the sum equals the mean over the full batch", say: "Each micro-batch contributes a quarter, so four of them average to the full-batch loss." },
        { code: "loss.backward()                                   # gradients add up across micro-batches", say: "Backward does not clear gradients; they accumulate until the step." },
        { code: "if (i + 1) % ACCUM == 0:", say: "Only every fourth micro-batch triggers an update: the effective batch is four micro-batches." },
        { code: "torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)", say: "Clipping caps the gradient's size, a standard guard against the spikes seen in large runs." },
      ],
    },
    useIt: "You will set batch sizes for every fine-tune (Module 21) and often hit memory limits on a single GPU. Gradient accumulation gives you the batch you want on the hardware you have, and knowing the token budget divided by batch tells you how many steps to expect.",
    takeaways: ["Batches are counted in tokens; millions per step is normal for pretraining.", "Larger batches: steadier gradients and fuller GPUs, but fewer steps; beyond the critical size the extra is wasted.", "Steps = tokens ÷ batch tokens.", "Gradient accumulation builds a large batch from micro-batches that fit in memory."],
    terms: [["batch (tokens)", "the number of tokens processed before one optimiser update"], ["micro-batch", "a slice of the batch that fits in memory; several are accumulated per update"], ["critical batch size", "the batch size beyond which larger batches stop reducing the steps needed"]],
    reflect: { q: "Why does gradient accumulation give the same result as a bigger GPU, and what does it not give you?", a: "The gradient summed over four micro-batches equals the gradient of the full batch, so the update is identical. What it does not give is speed: the four passes run one after another, so the step takes four times as long as it would on a GPU that held the whole batch." },
  },

  "m20-training-epochs": {
    simple: "An epoch is one pass through the whole corpus; pretraining usually makes about one, because fresh text teaches more than repeated text.",
    concept:
      "In Module 9 an **epoch** was one full pass over the training set, and small models train for many of them. Pretraining is different: the corpus is so large relative to the compute budget that the model often sees each token only once. A 2-trillion-token budget on a 2-trillion-token corpus is exactly one epoch.\n\nWhen a lab wants to train on more tokens than it has, it repeats data. Experiments show that up to around four passes over the same text, repeated tokens are nearly as useful as fresh ones; beyond that, the gains shrink fast and the model begins to memorise. High-value sources such as books and reference text are often repeated two or three times on purpose while low-value web text is seen once; the mix (lesson two) specifies this.\n\nSo in pretraining, 'how many epochs' becomes 'how many times is each source repeated', and the answer is small.",
    why:
      "Compute is the scarce resource and fresh text is the best use of it: every repeated token teaches a little less than a new one and increases memorisation. But usable text is not infinite; the supply of high-quality public text is a real constraint for the largest models. Epoch decisions exist because labs are balancing a finite corpus against a growing compute budget, and the rules for how much repetition is safe came from careful experiments.",
    how: [
      "Compare the token budget with the corpus size: budget ÷ corpus = epochs if everything is treated equally.",
      "Assign repeat counts per source: high-quality sources up to 3–4 passes, low-quality 1 pass, some sources sub-sampled below 1.",
      "Shuffle so that repeats of a document are spread across the run rather than adjacent.",
      "Hold out an evaluation set that is never repeated or seen; watch for the training loss falling while the held-out loss rises.",
      "Stop repeating a source if the held-out loss on that domain stops improving.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Small model, small dataset (Module 9)", points: ["50,000 examples", "30 to 100 epochs", "overfitting is the main risk", "early stopping on validation loss"] },
      right: { title: "Pretraining", points: ["2 trillion tokens", "about 1 epoch; up to 4 on the best sources", "running out of good data is the main risk", "repeat the best, see the rest once"] },
      caption: "Same word, opposite regime. Pretraining is data-limited, not example-limited.",
    },
    everyday: {
      title: "Re-reading a good book",
      text: "Reading a great book a second time still teaches you something; the fifth reading teaches little and you start reciting lines. Reading a different good book instead teaches more. Pretraining re-reads the best books a few times and reads everything else once, because the library is enormous and the time is limited.",
    },
    engineering: {
      title: "Running out of English",
      text: "Planning a very large model, a lab finds that its budget calls for 15 trillion tokens but its cleaned, deduplicated, high-quality corpus holds 9 trillion. Options: repeat the best 3 trillion tokens three times (allowed by the four-epoch finding), add lower-quality web text at one pass, add more code and other languages, or generate synthetic text with an existing model (Module 49 returns to this). They choose a mix of the first three and keep a held-out set per source to detect over-repetition. Data supply, not GPUs, had become the limit.",
    },
    maths: {
      formula: "epochs per source = tokens trained on from the source ÷ tokens available from the source",
      meaning: "Repetition is decided per source. The mix share and the budget give the tokens trained on; the cleaned corpus gives the tokens available.",
      worked: [
        "Budget 2 trillion tokens; books are 8% of the mix: 0.08 × 2 × 10¹² = 160 billion book tokens trained on.",
        "The cleaned book corpus holds 55 billion tokens: epochs = 160 ÷ 55 ≈ 2.9 passes over the books.",
        "Web text is 65% of the mix: 1.3 trillion trained on, 2.1 trillion available: 1.3 ÷ 2.1 ≈ 0.62 epochs, so 38% of the web text is never seen.",
        "Both are within the range experiments found safe: under four passes on repeated sources.",
      ],
    },
    useIt: "In fine-tuning (Module 21) you are back in the small-data regime and will run several epochs with early stopping. In pretraining-scale work, think in repeats per source and watch held-out loss per domain. Either way, repeated data memorises faster than it generalises.",
    takeaways: ["Pretraining usually makes about one pass; repetition is decided per source.", "Up to roughly four passes over good data is nearly as useful as fresh data; beyond that, memorisation.", "High-quality sources are repeated on purpose; low-quality text is seen once or sub-sampled.", "Data supply is a real limit for the largest models."],
    terms: [["epoch (pretraining)", "one pass over a source; often fractional or a small integer per source"], ["sub-sampling", "using only a fraction of an available source"]],
    reflect: { q: "Why is a held-out set still needed if the model only sees each token once?", a: "Because repeated sources are seen more than once, and because even one pass can overfit to the corpus's quirks (its boilerplate, its date range). A held-out set that mirrors the mix shows whether loss improvements are general or memorisation of the particular text." },
  },

  "m20-distributed-training": {
    simple: "Distributed training spreads one training run across many GPUs by splitting the data, the model's layers, or its tensors, and keeps them in step with constant communication.",
    concept:
      "No single GPU can hold a large model's weights, gradients and optimiser states, let alone finish trillions of tokens in time. **Distributed training** divides the work across hundreds or thousands of GPUs in three ways that are usually combined.\n\n**Data parallelism**: every GPU holds a full copy of the model and processes a different slice of the batch; after the backward pass, gradients are averaged across GPUs so all copies take the same step. **Tensor parallelism**: a single layer's big matrices are split across GPUs, each computing part of the multiplication and exchanging results. **Pipeline parallelism**: different layers live on different GPUs, and micro-batches flow through them like an assembly line.\n\nSharded optimisers reduce memory further by splitting the optimiser states and gradients across data-parallel GPUs so no GPU holds everything. All of this depends on fast interconnects; the cost of communicating gradients can rival the cost of computing them. Module 49 goes deeper; here the goal is to know what the three splits are and why all three are needed.",
    why:
      "The arithmetic forces it. A 70-billion-parameter model needs about 1.1 terabytes for weights, gradients and Adam states in mixed precision; the largest single GPUs hold 80 to 192 gigabytes. And even if it fit, one GPU would take centuries over the token budget. Distribution exists to make training both possible (memory) and finish within weeks (time), and the engineering of keeping thousands of GPUs synchronised without one straggler stalling everything is a large part of what a lab actually does.",
    how: [
      "Shard the model: tensor parallelism inside a node where GPUs share a fast link; pipeline parallelism across a few nodes for the layer stack.",
      "Replicate that sharded model across many groups of nodes with data parallelism; each group gets a different slice of the batch.",
      "Shard optimiser states and gradients across the data-parallel replicas to save memory.",
      "Each step: forward and backward on local data, all-reduce gradients across replicas, optimiser step on each shard.",
      "Overlap communication with computation; checkpoint regularly; detect and replace failed nodes automatically.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Parallelism", "What is split", "What is communicated", "Good for"],
        rows: [
          ["data", "the batch", "gradients, every step (all-reduce)", "scaling to many nodes"],
          ["tensor", "a layer's matrices", "partial results inside every layer", "GPUs with a very fast link in one node"],
          ["pipeline", "the layer stack", "activations between stages", "models too deep for one node"],
          ["sharded optimiser", "optimiser states and gradients", "gathered on demand", "cutting per-GPU memory"],
        ],
      },
      caption: "Large runs use all four at once, for example tensor ×8, pipeline ×4, data ×32 on 1,024 GPUs.",
    },
    everyday: {
      title: "Building a car in a factory",
      text: "One worker could build a car alone, very slowly. A factory splits the work three ways: several assembly lines build cars at once (data parallelism); within a line, each station does one stage as cars move past (pipeline parallelism); and a heavy part like the engine is assembled by a team working on it together (tensor parallelism). The lines must stay in step and parts must move between stations quickly, or everyone waits.",
    },
    engineering: {
      title: "The straggler that cost a day",
      text: "A 1,024-GPU run slowed by 30% overnight. Monitoring showed every step waiting at the gradient all-reduce for one node whose network link had degraded. Because data parallelism synchronises every step, the slowest GPU sets the pace of all 1,024. The team evicted the node, restored from a checkpoint taken 40 minutes earlier, and added an alert for per-node step time. Distributed training turns one slow link into a global slowdown, which is why health monitoring is part of the training code.",
    },
    maths: {
      formula: "memory per parameter (mixed precision, Adam) ≈ 16 bytes;   GPUs needed ≥ total memory ÷ memory per GPU",
      meaning: "Weights in 16-bit (2 bytes), gradients (2), fp32 master weights (4), and Adam's two moment estimates (8) sum to 16 bytes per parameter before activations.",
      worked: [
        "A 70B model: 70 × 10⁹ × 16 bytes = 1.12 × 10¹² bytes ≈ 1.1 TB.",
        "On 80 GB GPUs: 1,120 ÷ 80 = 14 GPUs just to hold the training state, with nothing left for activations.",
        "With a sharded optimiser across 32 data-parallel replicas and tensor parallelism ×8, each GPU holds a fraction of each piece and has room for activations.",
        "The same 70B model in 16-bit for inference needs only 140 GB: two 80 GB GPUs. Training needs about eight times the memory of serving.",
      ],
    },
    useIt: "You will meet distributed training when fine-tuning anything above a few billion parameters (Module 22 shows the cheaper path) and when reading model papers that list their parallelism layout. The memory arithmetic tells you which GPU count a job needs before you request it.",
    takeaways: ["Data, tensor and pipeline parallelism split the batch, the matrices and the layers; big runs combine all three.", "Sharded optimisers cut per-GPU memory by splitting states across replicas.", "Training state needs about 16 bytes per parameter; serving needs about 2.", "Every step synchronises, so the slowest GPU sets the pace; monitoring is part of the job."],
    terms: [["data parallelism", "each GPU trains a full model copy on a different slice of the batch and gradients are averaged"], ["tensor parallelism", "one layer's matrices split across GPUs"], ["pipeline parallelism", "different layers on different GPUs, with micro-batches flowing through"], ["all-reduce", "the communication step that sums or averages a tensor across all GPUs"]],
    reflect: { q: "Why not use data parallelism alone, with a thousand copies of the model?", a: "Because a 70B model's training state does not fit on one GPU at all, so there is nothing to copy. Tensor and pipeline parallelism exist to make a single replica fit; data parallelism then multiplies the replicas for speed." },
  },

  "m20-checkpoints": {
    simple: "A checkpoint is a saved snapshot of the model's weights and optimiser state, taken regularly so a crash costs hours instead of weeks and so earlier versions can be revisited.",
    concept:
      "Module 2 mentioned checkpoints as saved parameters. In a pretraining run a **checkpoint** is more: all weights, the optimiser's moment estimates (Module 5's Adam), the learning-rate schedule position, the data loader's position in the corpus, and the random seeds. With all of these, training can resume and produce exactly the sequence of updates it would have produced anyway.\n\nCheckpoints are large. A 70B model's training state is about 1.1 terabytes; writing it from a thousand GPUs to shared storage takes minutes, during which training pauses unless the write is asynchronous. Teams balance checkpoint frequency against that cost: every 30 to 60 minutes is common.\n\nCheckpoints also serve as history. Intermediate checkpoints show how capabilities emerged over training, let a team roll back past a bad data shard, and provide the base for experiments such as continued pretraining on a new domain.",
    why:
      "Hardware fails. In a week-long run on thousands of GPUs, a node failure every few hours is normal. Without checkpoints, every failure would restart the run from zero. With them, the loss is the time since the last snapshot plus the restart. Checkpoints also make the run inspectable: a problem noticed on day five (a contaminated shard, a loss spike) can be fixed by returning to day four. The whole practice of modern training assumes frequent, complete checkpoints.",
    how: [
      "Decide what to save: weights, optimiser state, schedule step, data position, seeds, and the exact code version.",
      "Choose the interval from failure rate and write cost: often every 1,000 steps or every hour.",
      "Write shards in parallel from every GPU to durable shared storage; verify with checksums.",
      "Keep a rolling window of recent checkpoints plus milestones (every 10% of the run) for history.",
      "On failure: detect, replace the node, load the last good checkpoint, resume; the loss curve should continue seamlessly.",
      "At the end, save the final weights alone in a serving format, much smaller than the training checkpoint.",
    ],
    visual: {
      kind: "flow",
      steps: ["step 300,000: checkpoint written", "step 300,640: node fails", "cluster evicts node, allocates spare", "load checkpoint 300,000", "resume; 640 steps repeated", "loss curve continues as if nothing happened"],
      caption: "A failure costs the steps since the last checkpoint plus the restart time, not the run.",
    },
    everyday: {
      title: "Saving a long document",
      text: "Anyone who has lost three hours of writing to a crash now presses save every few minutes. A training run is a document that takes weeks to write on a machine that crashes every few hours. Checkpoints are the save button, pressed automatically, with the added habit of keeping dated copies so you can go back to Tuesday's version.",
    },
    engineering: {
      title: "Rolling back past a poisoned shard",
      text: "Day six of a run: the loss spikes and does not recover. Investigation shows a data shard full of repeated junk that slipped past filtering. The team does not start over. They load the checkpoint from before the shard was reached, remove the shard from the data order, and resume; two days of compute are kept and one is repeated. They also keep the pre-spike checkpoint permanently, because comparing it with the post-recovery model later answered a research question about how much damage bad data does.",
    },
    maths: {
      formula: "expected lost work per failure ≈ checkpoint interval ÷ 2;   checkpoint overhead = write time ÷ interval",
      meaning: "On average a failure lands halfway through an interval. Shorter intervals lose less work but spend more time writing.",
      worked: [
        "A 70B training state of 1.1 TB written at 20 GB/s takes 55 seconds.",
        "Interval 1 hour: overhead = 55 ÷ 3,600 ≈ 1.5%; expected loss per failure ≈ 30 minutes.",
        "Interval 15 minutes: overhead = 55 ÷ 900 ≈ 6%; expected loss per failure ≈ 7.5 minutes.",
        "With one failure every 6 hours, the hourly interval loses about 30 minutes per 6 hours (8%) plus 1.5% overhead; the 15-minute interval loses 2% plus 6%. The hourly interval is slightly cheaper here; asynchronous writes change the sums.",
      ],
    },
    useIt: "Every fine-tune you run (Module 24) should checkpoint: a colab session ending or a spot instance being reclaimed is the small-scale version of a node failure. Save optimiser state too if you want to resume exactly, and keep the best-validation checkpoint, not just the last.",
    takeaways: ["A training checkpoint holds weights, optimiser state, schedule, data position and seeds, so training can resume exactly.", "Interval is set by failure rate against write cost; hourly is typical for large runs.", "Checkpoints enable rollback past bad data and provide a history of the run.", "The final serving weights are far smaller than a training checkpoint."],
    terms: [["training checkpoint", "a complete snapshot of training state, not just weights"], ["rollback", "resuming from an earlier checkpoint to undo later steps"]],
    reflect: { q: "Why save the optimiser state and not just the weights?", a: "Adam's moment estimates carry the recent history of gradients; resuming without them restarts the optimiser cold, which changes the trajectory and often causes a loss bump. For exact resumption, and for a loss curve that continues seamlessly, the optimiser state is part of the state." },
  },

  "m20-training-costs": {
    simple: "Training cost is GPU-hours times the hourly price, plus data, people and failed runs; the compute formula lets you estimate it before spending anything.",
    concept:
      "The **training cost** of a model is dominated by GPU time, and GPU time follows from the compute formula: about 6 × parameters × tokens FLOPs, divided by what each GPU actually delivers per second, divided again by how many you can keep busy. Multiply the resulting GPU-hours by the hourly price (cloud rental or the amortised cost of owned hardware) and you have the headline number.\n\nThe headline is not the whole bill. Add the engineering months spent on data pipelines, the small-model experiments that chose the mix and the hyperparameters, the runs that diverged and were restarted, the evaluation, and the storage and network for petabytes of data. Teams often budget the final run at one third of the total project.\n\nUtilisation is the quiet variable. A GPU's advertised peak is rarely reached; real runs achieve 30 to 50% of it because of communication, memory bandwidth and idle time. Halving utilisation doubles the bill.",
    why:
      "Training costs decide who can build base models and why most teams adapt them instead. A back-of-envelope estimate, done before anything is bought, prevents the two expensive mistakes: a project that could never afford its own run, and a run that is sized by hope rather than arithmetic. It also explains the industry's shape: a few labs with the capital for base models, and everyone else paying per token or fine-tuning.",
    how: [
      "Fix the model size N and the token budget D; compute FLOPs = 6 × N × D.",
      "Estimate useful FLOPs per GPU-second: peak × utilisation (often 0.3 to 0.5).",
      "GPU-hours = FLOPs ÷ (useful FLOPs per second × 3,600).",
      "Multiply by the hourly price; add a contingency of 20 to 50% for restarts and experiments.",
      "Add the non-GPU costs: data, people, storage, evaluation.",
      "Compare with the alternative: renting an existing model per token, or fine-tuning one.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "Tokens", "GPU-hours (A100, 40% util.)", "Compute at $2/GPU-hour", "Who does this"],
        rows: [
          ["1B", "20B", "≈ 110", "≈ $220", "a student, in a day"],
          ["7B", "2T", "≈ 78,000", "≈ $160,000", "a well-funded team"],
          ["70B", "15T", "≈ 5.8 million", "≈ $12 million", "a large lab"],
          ["400B+", "15T+", "tens of millions", "$50–100 million+", "a handful of companies"],
        ],
      },
      caption: "Compute only; data, people and failed runs typically double or triple these figures.",
    },
    everyday: {
      title: "Quoting a building before laying a brick",
      text: "A builder estimates a house from floor area times a rate per square metre, then adds the architect, the permits, the weather delays and the wall that has to be redone. The quote is approximate but it tells you whether you can afford the house at all. The compute formula is the rate per square metre; the rest of the bill is everything builders know to add.",
    },
    engineering: {
      title: "The start-up that did the sums",
      text: "A start-up wants its own 7B base model to avoid depending on an API. The estimate: 2T tokens, 78,000 A100-hours at $2, about $160,000 for the final run; plus three months of two engineers on data ($120,000), small-model experiments ($40,000), one expected restart ($50,000), and evaluation. Total about $400,000 and five months, for a model that will trail open-weight releases within a year. They instead fine-tune an open-weight 7B model with LoRA (Module 22) for under $2,000 and keep the base-model plan on file. The arithmetic made the decision.",
    },
    maths: {
      formula: "GPU-hours = (6 × N × D) ÷ (peak FLOPs/s × utilisation × 3,600);   cost = GPU-hours × price",
      meaning: "The compute formula over the real delivered rate gives hours; hours times price gives money.",
      worked: [
        "N = 7 × 10⁹, D = 2 × 10¹²: FLOPs = 8.4 × 10²².",
        "A100 peak ≈ 3.1 × 10¹⁴ FLOPs/s at bf16; at 40% utilisation ≈ 1.25 × 10¹⁴ useful.",
        "GPU-seconds = 8.4 × 10²² ÷ 1.25 × 10¹⁴ = 6.7 × 10⁸; GPU-hours = 6.7 × 10⁸ ÷ 3,600 ≈ 187,000.",
        "At $2 per GPU-hour: about $374,000. At 60% utilisation the same run costs about $249,000: utilisation is worth $125,000 here.",
      ],
      note: "Earlier lessons used a rounder 3 × 10¹⁴ useful figure; real numbers depend on the GPU generation, precision and the code. The method is what matters.",
    },
    useIt: "Use the formula whenever anyone proposes training or continuing to train a model, including fine-tunes: tokens × parameters × 6, over delivered FLOPs, times price. It takes five minutes and settles most build-versus-adapt debates before they start.",
    takeaways: ["GPU-hours = 6ND ÷ delivered FLOPs per second ÷ 3,600; cost = hours × price.", "Utilisation (30–50%) and failed runs change the bill by large factors.", "Compute is often only a third of a training project's cost.", "The arithmetic is why most teams adapt base models rather than train them."],
    terms: [["GPU-hour", "one GPU running for one hour; the unit training is priced in"], ["utilisation", "the share of a GPU's peak arithmetic rate a real run achieves"]],
    reflect: { q: "A vendor quotes a GPU at twice the peak FLOPs of your current one for 1.5× the price. Is the run cheaper?", a: "Only if utilisation holds. Faster arithmetic makes communication and memory bandwidth a larger share of each step, so utilisation often drops on faster cards. Measure delivered FLOPs on your actual training code before deciding; the quote is in peak, the bill is in delivered." },
  },

  "m20-gpu-requirements": {
    simple: "A model's GPU requirement is set by memory first and speed second: weights, gradients, optimiser states and activations must fit, then the interconnect must keep thousands of cards in step.",
    concept:
      "A **GPU** runs the matrix multiplications of training thousands of times faster than a CPU, and its onboard memory, **VRAM**, holds the model while it works. For training, the question 'which GPUs, and how many' has two parts.\n\nMemory: each parameter needs about 16 bytes of training state in mixed precision (lesson 11), plus activations saved during the forward pass for the backward pass, which grow with batch size and sequence length. Activation checkpointing trades compute for memory by recomputing activations instead of storing them.\n\nSpeed and connectivity: the GPUs must exchange gradients every step, so the links between them matter as much as the cards. Within a server, GPUs share a very fast link; between servers, a high-speed network. A cluster is sized by memory arithmetic, then by how many cards can be used at decent utilisation before communication dominates.\n\nFor inference, requirements are far lower: only weights plus a cache; Module 40 covers that side.",
    why:
      "The whole module's economics rest on GPUs: they are the scarce, expensive resource that sets the pace and the bill. Choosing too few leaves the model unable to fit; too many wastes money on idle cards waiting at synchronisation points. The memory arithmetic is simple and must be done before hardware is reserved, because a cluster reserved for a month cannot be resized when the run fails to start.",
    how: [
      "Compute the training-state memory: parameters × 16 bytes (mixed precision with Adam).",
      "Estimate activation memory per GPU from batch size, sequence length, hidden size and layers; apply activation checkpointing if needed.",
      "Divide by per-GPU memory to get the minimum card count; apply tensor and pipeline parallelism to fit one replica.",
      "Multiply replicas by data parallelism to reach the wall-clock target.",
      "Check the interconnect: fast links within nodes for tensor parallelism; a high-bandwidth network for gradient all-reduce.",
      "Benchmark a few hundred steps to measure delivered FLOPs; resize if utilisation is poor.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model", "Weights (16-bit)", "Training state (16 B/param)", "Fits on", "Serving (16-bit weights)"],
        rows: [
          ["7B", "14 GB", "112 GB", "2 × 80 GB GPUs minimum; 8 for comfort", "1 × 24 GB GPU (with 4-bit: ~4 GB)"],
          ["13B", "26 GB", "208 GB", "4 × 80 GB minimum", "2 × 24 GB, or 1 × 80 GB"],
          ["70B", "140 GB", "1.1 TB", "16 × 80 GB minimum; hundreds for speed", "2 × 80 GB (4-bit: ~40 GB)"],
        ],
      },
      caption: "Training needs about eight times the memory of serving; parallelism makes a single replica fit, then replicas add speed.",
    },
    everyday: {
      title: "Hiring a removal van",
      text: "Moving house, you first ask whether everything fits in the van at all; only then do you ask how many vans would make the move quick. GPU sizing is the same: memory decides whether the model fits, and the number of cards decides how fast the run finishes. Hiring ten small vans that cannot each take the piano does not help.",
    },
    engineering: {
      title: "Fitting a 7B fine-tune on one card",
      text: "A developer has a single 24 GB GPU and wants to fine-tune a 7B model. Full fine-tuning needs 112 GB of training state: impossible. With LoRA (Module 22) the trainable parameters drop to a few million, so optimiser state is negligible, and 4-bit quantisation of the frozen base (QLoRA) brings weights to about 4 GB. Activations for a batch of 4 sequences of 2,048 tokens with checkpointing fit in the remaining space. The same model that needs sixteen data-centre GPUs for full training fine-tunes overnight on a desktop card.",
    },
    maths: {
      formula: "training memory ≈ N × 16 bytes + activations;   serving memory ≈ N × bytes per weight + KV cache",
      meaning: "Training state is the fixed part; activations scale with batch and sequence length. Serving needs only the weights at the stored precision plus a cache that grows with context.",
      worked: [
        "7B model, full fine-tuning: 7 × 10⁹ × 16 bytes = 112 GB of training state before activations.",
        "Same model served in 16-bit: 7 × 10⁹ × 2 bytes = 14 GB. In 4-bit: 7 × 10⁹ × 0.5 bytes = 3.5 GB plus a small overhead.",
        "LoRA with 8 million trainable parameters: trainable state = 8 × 10⁶ × 16 = 128 MB; the frozen base in 4-bit ≈ 3.5 GB; total under 5 GB plus activations.",
        "So the same 7B model needs 112 GB, 14 GB, or under 5 GB depending on what you are doing with it.",
      ],
    },
    useIt: "Before any training or serving job, do the bytes-per-parameter sum for the precision and method you plan to use; it tells you whether a job fits on the hardware you have, whether to use LoRA and quantisation, and how many GPUs to reserve. Module 40 extends the same arithmetic to inference at scale.",
    takeaways: ["Memory decides whether a model fits; GPU count and interconnect decide how fast it trains.", "Training state ≈ 16 bytes per parameter; serving ≈ 2 bytes in 16-bit, 0.5 in 4-bit.", "Parallelism makes one replica fit; data parallelism adds speed.", "LoRA plus quantisation lets a 7B model fine-tune on one consumer GPU."],
    terms: [["VRAM", "the memory on a GPU; what must hold the model and its working data"], ["activation checkpointing", "recomputing intermediate values in the backward pass instead of storing them, to save memory"], ["interconnect", "the links between GPUs that carry gradients and activations"]],
    reflect: { q: "Why does serving a model need so much less memory than training it?", a: "Serving keeps only the weights (and a cache of past attention keys and values). Training additionally keeps gradients for every weight, the optimiser's two running averages per weight, higher-precision master copies, and the activations needed to compute gradients. Those extras are what the 16 bytes per parameter counts." },
  },
};

export const M20_QUIZ: Quiz[] = [
  {
    q: "What is the only learning signal during pretraining?",
    options: ["Human ratings of answers", "The next token in the text", "Labels written by annotators", "A reward from a simulator"],
    answer: 1,
    why: ["That comes later, in alignment training (Module 23).", "Correct. Every label is simply the token that followed; no human annotation is involved.", "Pretraining uses no hand-written labels.", "That is reinforcement learning, not pretraining."],
  },
  {
    q: "Roughly how much compute does training a 7B model on 2T tokens take, using the 6ND rule?",
    options: ["About 8 × 10²² FLOPs", "About 1.4 × 10¹⁰ FLOPs", "About 6 × 10¹² FLOPs", "It cannot be estimated before training"],
    answer: 0,
    why: ["Correct. 6 × 7 × 10⁹ × 2 × 10¹² = 8.4 × 10²² FLOPs, tens of thousands of GPU-hours.", "That is just 2 × N; the formula multiplies by tokens too.", "That is just 3 × D; parameters are missing.", "The 6ND formula gives a good estimate before anything is bought."],
    reason: true,
  },
  {
    q: "Why does deduplication improve a model even though it removes data?",
    options: ["Smaller datasets always train faster", "Repeated text is over-weighted and memorised verbatim; removing repeats spends compute on real variety", "GPUs cannot process duplicate rows", "Deduplication adds new tokens"],
    answer: 1,
    why: ["Smaller is not the point; better-weighted is.", "Correct. A passage seen a thousand times dominates and gets memorised; deduplicated corpora train better models with fewer tokens.", "They can; the problem is statistical, not mechanical.", "It removes, not adds."],
  },
  {
    q: "A benchmark's questions were found in the training corpus. What is the honest fix?",
    options: ["Report the score anyway", "Remove overlapping documents from training (decontamination) and report the score on clean items", "Train longer so the model forgets them", "Use a bigger model"],
    answer: 1,
    why: ["The score would measure memorisation.", "Correct. Decontaminate the corpus and compute the score on items with no overlap.", "Models do not forget on purpose; the data must be removed.", "Size does not remove contamination."],
  },
  {
    q: "Why are documents packed end to end into fixed-length sequences?",
    options: ["To keep every document separate", "So batches are dense rectangles with almost no padding, and compute is spent on real tokens", "Because documents are all the same length", "To make the model forget document boundaries"],
    answer: 1,
    why: ["Packing mixes documents in one sequence, separated by an end-of-document token.", "Correct. One document per padded sequence would waste most of the compute.", "They vary enormously; that is why packing is needed.", "The end-of-document token marks boundaries."],
  },
  {
    q: "A team doubles the batch size and the run needs almost the same number of steps. What happened?",
    options: ["The learning rate was too low", "They were already past the critical batch size, so the extra tokens per step were wasted", "The data was contaminated", "The checkpoint interval was too long"],
    answer: 1,
    why: ["Possibly, but the symptom matches the batch-size ceiling.", "Correct. Beyond the critical batch size, larger batches stop reducing the steps needed.", "Contamination affects scores, not step counts.", "Checkpoints do not affect convergence."],
    reason: true,
  },
  {
    q: "Which of these is NOT saved in a training checkpoint for exact resumption?",
    options: ["Optimiser moment estimates", "The data loader position", "The learning-rate schedule step", "The raw training corpus"],
    answer: 3,
    why: ["Needed so Adam resumes warm.", "Needed so no tokens are skipped or repeated.", "Needed so the schedule continues.", "Correct. The corpus is stored separately; the checkpoint records the position in it, not the data."],
  },
  {
    q: "A 7B model needs about 112 GB to train fully but about 14 GB to serve in 16-bit. Why?",
    options: ["Serving uses a smaller vocabulary", "Training keeps gradients, Adam states, master weights and activations, about 16 bytes per parameter; serving keeps only 2-byte weights plus a cache", "Serving removes half the layers", "Training stores the corpus in memory"],
    answer: 1,
    why: ["The vocabulary is unchanged.", "Correct. Training state is roughly eight times the weights alone.", "All layers are used in both.", "The corpus streams from disk."],
  },
];

export const M20_EXERCISES: Exercise[] = [
  {
    title: "Cost a pretraining run",
    kind: "calculate",
    task: "A team plans a 13B-parameter model on 3 trillion tokens using H100 GPUs with a peak of about 9.9 × 10¹⁴ bf16 FLOPs/s at 40% utilisation, rented at $3 per GPU-hour. Compute the FLOPs, the GPU-hours, the compute cost, and the wall-clock time on 512 GPUs. Then add 30% contingency and state the figure you would put in a budget.",
    hints: ["FLOPs = 6 × N × D.", "Useful FLOPs/s = peak × utilisation.", "Wall-clock hours = GPU-hours ÷ GPUs."],
    solution: "FLOPs = 6 × 13 × 10⁹ × 3 × 10¹² = 2.34 × 10²³. Useful per GPU-second = 9.9 × 10¹⁴ × 0.4 = 3.96 × 10¹⁴. GPU-seconds = 2.34 × 10²³ ÷ 3.96 × 10¹⁴ ≈ 5.9 × 10⁸; GPU-hours ≈ 164,000. Cost ≈ 164,000 × $3 ≈ $492,000. On 512 GPUs: 164,000 ÷ 512 ≈ 320 hours ≈ 13.4 days. With 30% contingency: about $640,000 for compute alone, plus data, people and evaluation.",
  },
  {
    title: "Size the GPUs",
    kind: "calculate",
    task: "For the same 13B model, compute the training-state memory at 16 bytes per parameter and the minimum number of 80 GB GPUs needed to hold it with no room for activations. Then compute the serving memory in 16-bit and in 4-bit, and say what single consumer GPU (24 GB) could do with it.",
    hints: ["Training: N × 16 bytes. Serving: N × 2 bytes (16-bit) or N × 0.5 bytes (4-bit)."],
    solution: "Training state = 13 × 10⁹ × 16 = 208 GB → minimum 3 × 80 GB GPUs (240 GB), realistically 8 or more for activations and speed. Serving 16-bit = 26 GB (does not fit one 24 GB card; two cards or one 80 GB). Serving 4-bit ≈ 6.5 GB plus overhead: fits a 24 GB consumer GPU with room for a long context. With LoRA on a 4-bit base, fine-tuning also fits that card.",
  },
  {
    title: "Write a filtering rule and predict its damage",
    kind: "code",
    task: "Write a Python function that rejects documents with more than 30% of lines shorter than four words (a navigation-heavy page). Then list two kinds of valuable document it would wrongly reject and how you would protect them.",
    hints: ["Count lines, count short lines, compare the ratio.", "Think about poetry, code, tables, dialogue."],
    solution: "def mostly_short_lines(text):\n    lines = [l for l in text.splitlines() if l.strip()]\n    if not lines:\n        return True\n    short = sum(1 for l in lines if len(l.split()) < 4)\n    return short / len(lines) > 0.3\n\nWrongly rejected: poetry and song lyrics (short lines by nature), source code and config files, dialogue transcripts, tables and lists of specifications. Protect them by applying the rule only to the web-page source and not to code or curated sources, or by exempting documents whose provenance marks them as poetry, code or structured data.",
  },
  {
    title: "Plan the epochs",
    kind: "think",
    task: "Your cleaned corpus holds 900B tokens of web text, 60B of books, 200B of code and 40B of papers. Your budget is 1.5T tokens and you want a mix of 55% web, 10% books, 30% code, 5% papers. Compute the tokens trained on per source and the epochs per source, and flag any source that exceeds four passes.",
    hints: ["Tokens per source = share × budget; epochs = tokens trained on ÷ tokens available."],
    solution: "Web: 0.55 × 1.5T = 825B over 900B available → 0.92 epochs. Books: 150B over 60B → 2.5 epochs. Code: 450B over 200B → 2.25 epochs. Papers: 75B over 40B → 1.9 epochs. All under four passes, so the plan is within the range experiments found safe. If the books share were raised to 20% (300B over 60B = 5 epochs) it would exceed the limit; you would need more book data or a lower share.",
  },
];
