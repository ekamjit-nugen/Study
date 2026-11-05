import type { Exercise, LessonBody, Quiz } from "../types";

// Module 11: Natural language processing. One concept per lesson.
// Keys are lesson slugs: m11-<kebab of the concept title>.

export const M11_BODIES: Record<string, LessonBody> = {
  "m11-what-is-nlp": {
    simple: "Natural language processing is getting computers to do useful things with human language: sort it, search it, translate it, summarise it, generate it.",
    concept:
      "Human language is messy. The same idea can be said a hundred ways, words change meaning with context, and nobody writes a sentence the same way twice. Computers, by contrast, want things exact. **Natural language processing** (NLP) is the field that bridges the two: it covers every technique for turning text or speech into something a program can work with, and for producing language back.\n\nThe jobs are familiar once named. Deciding whether a review is positive or negative. Finding the three documents that answer a question. Translating a sentence. Pulling a date and an amount out of an invoice. Writing a reply. Each of these takes language in, and most of them need the computer to behave as if it understood at least a little of what the words mean.\n\nFor decades NLP was a collection of hand-built tools: dictionaries, grammar rules, word counts. Today most of it runs on the learned models from Stage 2, and the language models of Stage 4 do many NLP jobs at once. But the old tools are still how we think about text, and several of them are still used underneath the new ones.",
    why:
      "Most of the world's information is written in sentences, not tables: emails, reports, contracts, reviews, chat logs, code comments, medical notes. Software that can only read tables leaves all of it untouched. NLP exists so that programs can use that information: route the complaint to the right team, flag the suspicious message, answer the question from the manual, find the one clause that matters in a 90-page contract.\n\nIt also exists because language is the interface people prefer. Nobody wants to fill in forms to ask a question. The moment a program can read a sentence and act on it, the keyboard and the search box become far more powerful.",
    how: [
      "Get the raw text: typed, scanned and recognised, or transcribed from speech.",
      "Clean and split it into units a program can handle: sentences, words, tokens (the next lessons).",
      "Turn the units into numbers: counts of words, weights like TF-IDF, or learned vectors (embeddings, Module 13).",
      "Apply a model to the numbers: a classifier, a search index, a translator, a language model.",
      "Turn the model's output back into something a person uses: a label, a ranked list, a translated sentence, a generated reply.",
    ],
    visual: {
      kind: "flow",
      steps: ["raw text: 'Arrived late and the box was crushed.'", "clean and split: [arrived, late, box, crushed]", "numbers: counts or vectors", "model: classifier", "output: category = delivery, sentiment = negative"],
      caption: "Every NLP system is this pipeline. Modern systems learn the middle steps; classic systems hand-build them. Both start with text and end with something useful.",
    },
    everyday: {
      title: "Your email's spam folder and your phone's autocorrect",
      text: "Two NLP systems you use before breakfast. The spam filter reads each email, turns its words into numbers and scores it (Module 1 showed the formula). Autocorrect reads the letters you typed, compares them to a dictionary and to what words usually follow each other, and offers the most likely fix. Neither understands English the way you do. Both do a narrow language job well enough to be worth billions.",
    },
    engineering: {
      title: "Routing support tickets at a telecoms company",
      text: "A telecoms company receives 40,000 support messages a day. A classifier reads each one and routes it: billing, outage, new order, cancellation. The classic version counted words ('refund' and 'charged' meant billing) and was right about 80% of the time. The current version uses a learned model and reaches 94%, but the engineering around it barely changed: clean the text, strip signatures and quoted replies, handle messages in three languages, keep a human queue for anything the model is unsure about, and measure accuracy weekly against tickets that agents re-routed by hand.",
    },
    useIt: "NLP is behind search, spam filtering, sentiment analysis, chatbots, translation, document extraction, speech assistants, code completion and content moderation. As an engineer you will mostly combine ready-made pieces: a tokeniser, an embedding model, a language model, plus the cleaning and measuring around them. Knowing the classic pipeline tells you where each piece fits and what to check when results are wrong.",
    takeaways: ["NLP = making programs useful with human language: classify, search, extract, translate, generate.", "Every system is a pipeline: raw text → units → numbers → model → useful output.", "Classic NLP hand-built the middle steps; modern NLP learns them; the shape is the same.", "Most of the world's information is text, which is why this matters."],
    terms: [["natural language processing (NLP)", "the field of making computers work with human language"], ["pipeline", "a fixed sequence of processing steps, each feeding the next"]],
    reflect: { q: "A bank wants to 'use AI on customer emails'. Name three different NLP jobs hiding in that sentence.", a: "Classification (route each email to a team, detect complaints), extraction (pull account numbers, dates and amounts into fields), and generation (draft a reply or summarise a thread for an agent). Each is a different pipeline with a different way of measuring success." },
  },

  "m11-how-computers-process-text": {
    simple: "To a computer, text is a sequence of numbered characters; everything meaningful, like words and sentences, has to be built on top of that by a program.",
    concept:
      "A computer does not store the word 'cat'. It stores three numbers, one per character, chosen from a table that maps every character to a code. The table is **Unicode**, and the usual way to write those codes into bytes is UTF-8. 'c' is code 99, 'a' is 97, 't' is 116. A Punjabi letter such as ਕ is code 2581, which takes three bytes in UTF-8 where 'c' takes one.\n\nThat is all the computer knows: a long list of character codes. It has no idea where a word ends, that 'Cat' and 'cat' are the same word, that 'running' and 'ran' share a root, or that a full stop ends a sentence. Every one of those facts has to be computed by a program, and each computation is a decision that can go wrong. Does 'U.S.' end a sentence? Is 'don't' one word or two? Is '🙂' a word?\n\nText processing, then, is the set of programs that turn a character sequence into the units we actually think in: characters into words and tokens, words into sentences, sentences into documents, and then into numbers a model can use.",
    why:
      "Everything downstream depends on getting the units right. A search engine that cannot tell that 'Cat' and 'cat' match will miss half its results. A classifier that treats 'not' and 'good' separately will think 'not good' is positive. A model that splits 'New York' into two unrelated pieces loses the place name. These mistakes happen at the very first step, before any clever model runs, and they are invisible unless you look at the characters.\n\nThe lesson exists so you look. When an NLP system behaves strangely, the first question is: what sequence of codes did it actually receive, and how did it cut it up?",
    how: [
      "Characters arrive as bytes; decode them with the right encoding (almost always UTF-8) to get character codes.",
      "Normalise the codes: some characters have two spellings in Unicode (an accented 'é' can be one code or 'e' plus an accent mark); pick one form.",
      "Split characters into words or tokens using spaces, punctuation and language rules, or a learned tokeniser (Module 12).",
      "Group words into sentences using punctuation and abbreviation lists.",
      "Attach each unit to a number so it can be counted, compared, or fed to a model.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["What you see", "What the computer has", "Decision a program must make"],
        rows: [
          ["cat", "99 97 116", "where the word ends (the space after)"],
          ["Cat", "67 97 116", "is this the same word as 'cat'? (case)"],
          ["don't", "100 111 110 39 116", "one word, or 'do' + 'n't'?"],
          ["ਕਿਤਾਬ", "2581 2623 2724 2622 2604", "five codes, one word; vowel marks are separate codes"],
          ["U.S. is big.", "…46 83 46 32…", "which full stop ends the sentence?"],
        ],
      },
      caption: "The computer sees only the middle column. Every row's right-hand decision is a program somebody had to write or train.",
    },
    everyday: {
      title: "The surname that broke the form",
      text: "Someone named O'Brien types their name into a website and gets 'invalid characters'. Someone named Müller finds their boarding pass printed as 'M?ller'. Someone with a Gurmukhi name sees boxes instead of letters. Each is a text-processing failure: an apostrophe treated as code, an accented letter decoded with the wrong encoding, a font without the script. The person did nothing wrong; the program never decided how to handle those character codes.",
    },
    engineering: {
      title: "A search engine's first ten milliseconds",
      text: "Before a search engine ranks anything, it decodes the query bytes as UTF-8, normalises Unicode so 'café' matches 'cafe', lowercases, splits on spaces and punctuation with special cases for 'C++' and 'e-mail', and looks each piece up in its index. Engineers spend real effort here: a change to how hyphens are split can move millions of results. Logs of zero-result searches are often full of encoding problems: a query that arrived as mojibake (garbled bytes) matches nothing.",
    },
    code: {
      title: "What the computer actually has",
      lang: "py",
      src: `text = "Cat café ਕਿਤਾਬ"

codes = [ord(ch) for ch in text]          # one Unicode code per character
print(codes)

raw = text.encode("utf-8")                 # the bytes on disk or on the wire
print(len(text), "characters,", len(raw), "bytes")

print(text.lower().split())                # a first, naive cut into words
print("Cat".lower() == "cat")              # case decided by a program, not by the computer`,
      lines: [
        { code: "codes = [ord(ch) for ch in text]          # one Unicode code per character", say: "ord gives the Unicode code of each character. This list is the whole of what the machine knows." },
        { code: "raw = text.encode(\"utf-8\")                 # the bytes on disk or on the wire", say: "The same text as bytes. Latin letters take one byte each; the Gurmukhi letters take three each." },
        { code: "print(len(text), \"characters,\", len(raw), \"bytes\")", say: "Characters and bytes are different counts. Many bugs come from mixing them up." },
        { code: "print(text.lower().split())                # a first, naive cut into words", say: "Lowercasing and splitting on spaces is the simplest tokeniser. It already makes decisions: case does not matter, spaces mark words." },
      ],
      output: "[67, 97, 116, 32, 99, 97, 102, 233, 32, 2581, 2623, 2724, 2622, 2604]\n14 characters, 23 bytes\n['cat', 'café', 'ਕਿਤਾਬ']\nTrue",
      note: "Print the codes whenever text behaves oddly. The bug is usually visible there.",
    },
    useIt: "Whenever you build anything that reads text, you decode, normalise and split before any model sees it. Encoding bugs, case handling, apostrophes, hyphens and non-Latin scripts are the first things to test. Logs of 'no results' and 'invalid input' usually point back here.",
    takeaways: ["Text is a sequence of Unicode codes, stored as bytes (UTF-8). Nothing else is given.", "Words, sentences, case, roots and meaning are all computed by programs that can be wrong.", "Characters and bytes are different counts; non-Latin scripts take more bytes.", "When text processing misbehaves, look at the codes first."],
    terms: [["Unicode", "the table that assigns a number to every character in every script"], ["UTF-8", "the common way of writing Unicode codes as bytes; one byte for basic Latin letters, more for other scripts"], ["encoding", "the rule for turning characters into bytes and back"]],
    reflect: { q: "A customer's review contains 'didn’t' with a curly apostrophe and the classifier treats it as a different word from \"didn't\". What went wrong and where?", a: "Normalisation. The curly apostrophe (code 8217) and the straight one (code 39) are different codes, so a naive split sees different words. Map typographic punctuation to plain forms before tokenising, and test with real pasted text, which is full of curly quotes." },
  },

  "m11-text-preprocessing": {
    simple: "Preprocessing is the cleaning done to text before a model sees it: fixing encoding, removing noise, splitting into units, and standardising forms, so the model learns from language rather than from mess.",
    concept:
      "Real text is full of things that are not language: HTML tags, email signatures, quoted replies, tracking links, repeated whitespace, emojis, boilerplate footers. It is also full of variation that a model may not need: capital letters, plural endings, typographic quotes. **Text preprocessing** is the set of steps that strip the noise and reduce the variation before the text is turned into numbers.\n\nThe steps are simple individually: decode and fix the encoding, remove markup, split into sentences and words, lowercase, normalise punctuation, maybe remove very common words, maybe reduce words to their root forms. The craft is in choosing which steps to apply. Lowercasing helps a spam filter and hurts a model that must tell 'Apple' the company from 'apple' the fruit. Removing punctuation helps word counts and destroys a sentiment model's '!!!'.\n\nModern language models need much less of this: they take raw text and learn to cope with capitals and punctuation themselves. But their training data still gets heavy cleaning (Stage 5), and every classic pipeline, every search index and most data-science work still leans on these steps.",
    why:
      "Models learn whatever is in the data, including the mess. A review classifier trained on text with signatures learns that 'Sent from my iPhone' predicts something. A search index that keeps HTML tags matches '<div>' as a word. A count-based model that does not lowercase treats 'Great' and 'great' as unrelated, halving its evidence for each.\n\nPreprocessing exists to remove exactly those effects: it makes the data about the language, and it makes different spellings of the same thing count as the same thing, so a model needs less data to learn the same pattern.",
    how: [
      "Decode bytes to text and repair obvious encoding damage (mojibake) and Unicode variants.",
      "Remove non-language: markup, URLs, email headers and quoted replies, signatures, boilerplate.",
      "Segment into sentences, then into words or tokens.",
      "Normalise: lowercase if case does not carry meaning for the task; standardise quotes, dashes and numbers.",
      "Optionally reduce: remove stop words, stem or lemmatise (the next lessons) when counting words is the goal.",
      "Check a sample by eye and measure the effect on the model; every step is a choice, not a rule.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "raw", detail: "'<p>Great&nbsp;service!!! Arrived in 2 days.</p>  -- Sent from my iPhone'" },
        { label: "strip markup and boilerplate", detail: "'Great service!!! Arrived in 2 days.'" },
        { label: "segment", detail: "['Great service!!!', 'Arrived in 2 days.']" },
        { label: "tokenise + lowercase", detail: "[great, service, !!!, arrived, in, 2, days, .]" },
        { label: "reduce (if counting)", detail: "[great, service, arrive, 2, day]" },
      ],
      caption: "Each step throws something away. Keep '!!!' for sentiment; drop it for topic classification. The task decides.",
    },
    everyday: {
      title: "Tidying before the guests arrive",
      text: "Before a dinner party you clear the post off the table, put the shoes away and wipe the surfaces. You do not knock down walls. Preprocessing is that tidying: remove the clutter that gets in the way, standardise what should look the same, but leave the structure that matters. Over-tidying (removing all punctuation and capitals) can hide the very thing a guest needed to see.",
    },
    engineering: {
      title: "Review classification at a marketplace",
      text: "A marketplace classifies product reviews into topics (delivery, quality, price, service). The first model was trained on raw scraped reviews and learned that the word 'Verified' (from a 'Verified purchase' badge in the HTML) predicted positivity, because verified buyers were happier. Stripping the badge text fixed a bias that nobody had noticed. Later, the team found that lowercasing hurt one class: 'DOA' (dead on arrival) was being merged with 'doa', a brand name. They kept case for that model. Both lessons came from reading samples after each preprocessing step, not from the accuracy number alone.",
    },
    code: {
      title: "A small, explicit preprocessing function",
      lang: "py",
      src: `import re, html, unicodedata

def preprocess(raw, keep_case=False):
    text = html.unescape(raw)                              # &nbsp; -> space, &amp; -> &
    text = re.sub(r"<[^>]+>", " ", text)                   # drop tags
    text = re.sub(r"https?://\\S+", " URL ", text)          # links become one marker
    text = text.split("-- Sent from")[0]                   # cut a known signature
    text = unicodedata.normalize("NFKC", text)             # one spelling per character
    text = text.replace("\\u2019", "'").replace("\\u201c", '"').replace("\\u201d", '"')
    if not keep_case:
        text = text.lower()
    text = re.sub(r"\\s+", " ", text).strip()               # collapse whitespace
    return text

print(preprocess("<p>Great&nbsp;service!!! Arrived in 2 days.</p>  -- Sent from my iPhone"))`,
      lines: [
        { code: "text = re.sub(r\"<[^>]+>\", \" \", text)                   # drop tags", say: "Markup is not language. It is replaced with a space so words on either side do not merge." },
        { code: "text = re.sub(r\"https?://\\S+\", \" URL \", text)          # links become one marker", say: "A link's characters are noise, but the fact there was a link may matter, so it becomes one token." },
        { code: "text = unicodedata.normalize(\"NFKC\", text)             # one spelling per character", say: "Unicode normalisation: composed and decomposed accents, full-width letters and similar variants become one form." },
        { code: "if not keep_case:", say: "Lowercasing is a choice. The parameter makes it visible instead of silently baked in." },
        { code: "text = re.sub(r\"\\s+\", \" \", text).strip()               # collapse whitespace", say: "Runs of spaces, tabs and newlines become one space. Counting words needs clean boundaries." },
      ],
      output: "great service!!! arrived in 2 days.",
      note: "Every regular expression here is a decision. Keep them in one function, test them on real samples, and version the function with the model.",
    },
    useIt: "Preprocessing is the first thing to write and the first thing to check when a text model misbehaves. Keep it in one versioned function, apply exactly the same function at training time and at prediction time, and read samples after each step. For modern language models do less (they handle raw text), but still remove boilerplate and private data.",
    takeaways: ["Preprocessing removes noise and reduces variation before text becomes numbers.", "Every step is a task-dependent choice: lowercasing and punctuation removal help counting and can hurt meaning.", "Apply the same preprocessing at training and at prediction time, from the same code.", "Read samples after each step; accuracy alone hides learned noise like 'Verified'."],
    terms: [["preprocessing", "cleaning and standardising text before modelling"], ["boilerplate", "repeated non-content text: signatures, footers, disclaimers"], ["mojibake", "garbled characters produced by decoding bytes with the wrong encoding"]],
    reflect: { q: "Your sentiment model is trained on lowercased, punctuation-free text. A user writes 'GREAT. Just GREAT.' Which signal did the preprocessing destroy?", a: "The sarcasm cues: capitals for emphasis and the clipped full stops. Lowercasing and punctuation removal turn it into 'great just great', which reads as positive. For sentiment, keep case or add a feature like 'all caps', and keep punctuation." },
  },

  "m11-sentence-segmentation": {
    simple: "Sentence segmentation is cutting a text into sentences, which sounds trivial and is not, because full stops also end abbreviations, numbers and initials.",
    concept:
      "Many NLP tasks work one sentence at a time: translation, summarisation, finding the sentence that answers a question, deciding which sentence of a review is the complaint. Before any of that, the text must be cut into sentences. **Sentence segmentation** (also called sentence boundary detection) is that cut.\n\nThe obvious rule, split on full stops, fails immediately. 'Dr. Smith paid $3.50 at 9 a.m. on Jan. 5.' has five full stops and is one sentence. Question marks and exclamation marks are more reliable but also appear inside quotes and brackets. Some texts have no punctuation at all: chat messages, transcripts, headlines. And other languages use different marks: Hindi and Punjabi use the danda (।), Chinese uses a full-width stop (。), and Thai often uses spaces between sentences and none between words.\n\nReal segmenters combine rules (a full stop followed by a space and a capital letter, not preceded by a known abbreviation) with learned models that have seen many examples of where sentences really end.",
    why:
      "A wrong cut damages everything built on it. Cut 'Dr. Smith' into two sentences and the translation model receives 'Dr.' alone and a sentence that starts mid-thought. Fail to cut at all and a summariser gets a 300-word 'sentence'. A question-answering system that returns sentences will return fragments. Segmentation errors are quiet; they do not crash, they just make every later step slightly worse.\n\nIt exists as its own step because the cut depends on knowledge the raw characters do not carry: which strings are abbreviations, what a number looks like, how a given language marks the end of a thought.",
    how: [
      "Find candidate boundaries: full stops, question and exclamation marks, language-specific marks like the danda, and blank lines.",
      "Rule out false boundaries: the full stop in a known abbreviation ('Dr.', 'e.g.'), inside a number ('3.50'), in an initial ('J. K.'), in a URL or an email address.",
      "Confirm true boundaries: a space and a capital letter (or a new line) usually follow a real sentence end.",
      "For hard cases use a model trained on hand-segmented text; it learns that 'Inc. announced' is usually a boundary and 'Mr. Patel' is not.",
      "Handle texts with no punctuation (chat, transcripts) by line breaks, pauses, or a model that predicts boundaries from the words alone.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Naive split on '.'", "Correct"],
        rows: [
          ["Dr. Smith arrived. He sat down.", "'Dr' | 'Smith arrived' | 'He sat down'", "'Dr. Smith arrived.' | 'He sat down.'"],
          ["It cost $3.50. Cheap!", "'It cost $3' | '50' | 'Cheap!'", "'It cost $3.50.' | 'Cheap!'"],
          ["Visit example.com. Then call.", "'Visit example' | 'com' | 'Then call'", "'Visit example.com.' | 'Then call.'"],
          ["ਮੈਂ ਘਰ ਗਿਆ। ਮੀਂਹ ਪੈ ਰਿਹਾ ਸੀ।", "no split at all (no '.')", "two sentences, split at the danda (।)"],
        ],
      },
      caption: "The naive rule is wrong in every row. Each correct cut needs a piece of knowledge: abbreviations, numbers, domains, scripts.",
    },
    everyday: {
      title: "Reading a text message aloud",
      text: "Read 'meet at 7 bring the stuff ok see u' aloud and you naturally pause in the right places, even with no punctuation, because you know where thoughts end. A program has none of that sense. It has characters. Sentence segmentation is the attempt to give it enough rules, or enough examples, to find the same pauses you found without thinking.",
    },
    engineering: {
      title: "Subtitles for a video platform",
      text: "A video platform generates subtitles from speech recognition, which produces one long unpunctuated stream of words. To show readable subtitles and to translate them, the stream must be cut into sentences. The team trains a boundary model on transcripts that editors had punctuated by hand: it learns from word patterns and pause lengths where a sentence ends. A bad cut shows up instantly on screen as a subtitle that ends mid-phrase, so the metric they watch is the share of subtitle lines that editors move.",
    },
    code: {
      title: "A rule-based segmenter that handles the common traps",
      lang: "py",
      src: `import re

ABBREV = {"dr", "mr", "mrs", "ms", "prof", "inc", "ltd", "e.g", "i.e", "vs", "jan", "feb"}

def segment(text):
    sentences, start = [], 0
    for m in re.finditer(r"[.!?।]+(?=\\s+|$)", text):     # a stop followed by space or end
        end = m.end()
        before = text[start:m.start()].strip().split()
        last = before[-1].lower().rstrip(".") if before else ""
        if m.group().startswith(".") and last in ABBREV:
            continue                                          # 'Dr.' is not a boundary
        sentences.append(text[start:end].strip())
        start = end
    if text[start:].strip():
        sentences.append(text[start:].strip())
    return sentences

print(segment("Dr. Smith paid $3.50 at 9 a.m. on Jan. 5. He left. Was it late?"))`,
      lines: [
        { code: "for m in re.finditer(r\"[.!?।]+(?=\\s+|$)\", text):     # a stop followed by space or end", say: "Candidate boundaries: a stop mark followed by whitespace or the end. The danda is included for Hindi and Punjabi text." },
        { code: "if m.group().startswith(\".\") and last in ABBREV:", say: "The word before the full stop is checked against an abbreviation list. 'Dr.' and 'Jan.' are skipped." },
        { code: "sentences.append(text[start:end].strip())", say: "Everything from the last boundary to this one is a sentence." },
        { code: "if text[start:].strip():", say: "Text with no final stop still forms a last sentence." },
      ],
      output: "['Dr. Smith paid $3.50 at 9 a.m. on Jan. 5.', 'He left.', 'Was it late?']",
      note: "'$3.50' survives because the full stop inside it is not followed by a space. Real libraries add hundreds of such rules or a trained model.",
    },
    useIt: "Use a library segmenter (spaCy, NLTK's Punkt, or a model) rather than splitting on full stops, and test it on your own text: abbreviations in your domain, numbers, URLs, and any non-Latin scripts. Check the output whenever a downstream model gets fragments.",
    takeaways: ["Sentence segmentation finds where thoughts end; full stops alone cannot.", "Abbreviations, numbers, initials, URLs and other scripts are the traps.", "Rules plus a trained model handle most text; unpunctuated text needs a model.", "Errors are quiet and propagate; check the cuts on your own data."],
    terms: [["sentence segmentation", "splitting text into sentences"], ["danda", "the vertical bar (।) that ends sentences in Hindi, Punjabi and other Indic scripts"]],
    reflect: { q: "A legal document uses numbered clauses like '3.1 The tenant shall…' and your segmenter splits '3' from '1 The tenant'. What rule would fix it?", a: "Treat a full stop between digits with no following space as part of a number, not a boundary, and treat a line starting with a clause number as a sentence start. Domain text always needs a few domain rules." },
  },

  "m11-normalisation": {
    simple: "Normalisation makes different spellings of the same thing identical, so a program counts them as one: case, accents, quotes, numbers, spelling variants.",
    concept:
      "The same word can arrive in many surface forms: 'Email', 'email', 'e-mail', 'E-MAIL'. The same character can have two Unicode spellings. Dates come as '5 Jan', '05/01' and 'January 5th'. Numbers come as '1,000', '1000' and '1k'. **Normalisation** is the set of rules that map these variants to one canonical form, so that counting, matching and searching treat them as the same thing.\n\nThe common normalisations are: Unicode normalisation (one code sequence per character), case folding (lowercase everything), punctuation standardisation (curly quotes to straight, dashes to hyphens), whitespace collapsing, number and date canonicalisation, and spelling normalisation (British and American forms, common typos, transliteration variants).\n\nEach one loses information. Case folding loses 'Apple' versus 'apple'. Number canonicalisation loses the difference between '1k' as a count and 'K' as a chemical symbol. So normalisation is chosen per task: aggressive for search and counting, light for models that read meaning, and recorded so the same mapping runs at training and prediction time.",
    why:
      "Without normalisation a model sees ten versions of each word and gets a tenth of the evidence for each. A search for 'cafe' misses 'café'. A product matcher treats 'iPhone 13' and 'iphone13' as different items. An address checker fails on a curly apostrophe. Users do not type canonical forms, and data from different sources is never consistent. Normalisation exists to make the data agree with itself before anything learns from it or searches it.",
    how: [
      "Apply Unicode normalisation (NFC or NFKC) so each character has one code sequence.",
      "Fold case if the task does not need it; for named entities and sentiment, keep it or keep a flag.",
      "Map typographic punctuation to plain forms and collapse whitespace.",
      "Canonicalise numbers, dates, currencies and units into one format, or replace them with placeholders if their exact value does not matter.",
      "Map known spelling variants: regional spellings, hyphenation, transliterations, frequent typos.",
      "Record every rule in code, apply it identically everywhere, and log how often each rule fires.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Variants in the data", "Normalised form", "Rule"],
        rows: [
          ["Email, e-mail, E-MAIL, email", "email", "case fold, remove hyphen in known variants"],
          ["café (one code), café (e + accent)", "café (one code)", "Unicode NFC"],
          ["don’t, don't", "don't", "curly to straight apostrophe"],
          ["1,000 / 1000 / 1k", "1000", "number canonicalisation"],
          ["colour / color", "color", "regional spelling map (choose one side)"],
          ["ਪੰਜਾਬੀ / punjabi / panjabi", "punjabi", "transliteration variants (Stage 9 goes deeper)"],
        ],
      },
      caption: "Each row is a decision. The right-hand rule must run on every input, forever, or the data drifts apart again.",
    },
    everyday: {
      title: "Finding one person in three address books",
      text: "Your phone, your email and your messaging app each have 'Asha Verma', 'asha verma' and 'Verma, Asha'. Merging them means normalising: same case, same name order, same spacing. Get it wrong one way and you have three contacts; get it wrong the other way and two different Priyas become one. That is exactly the trade-off in text normalisation, in miniature.",
    },
    engineering: {
      title: "Product matching at a price-comparison site",
      text: "A price-comparison site receives product names from 300 retailers: 'Samsung Galaxy S23 128GB Black', 'SAMSUNG GALAXY S-23 (128 GB) - Blk', 'Galaxy S23 128gb black'. To show one product with many prices, names are normalised: case folded, punctuation stripped, units standardised ('128 GB' → '128gb'), colour words mapped to a list, brand aliases merged. The team measures the match rate and, separately, the false-merge rate, because merging two different phones is worse than missing one listing. Every normalisation rule is tested against both numbers.",
    },
    code: {
      title: "A normaliser with each rule visible",
      lang: "py",
      src: `import re, unicodedata

SPELLING = {"e-mail": "email", "colour": "color", "panjabi": "punjabi"}

def normalise(text):
    text = unicodedata.normalize("NFKC", text)
    text = text.lower()
    text = text.replace("\\u2019", "'").replace("\\u2013", "-").replace("\\u2014", "-")
    text = re.sub(r"(?<=\\d),(?=\\d{3}\\b)", "", text)          # 1,000 -> 1000
    text = re.sub(r"\\b(\\d+)k\\b", lambda m: m.group(1) + "000", text)   # 1k -> 1000
    words = [SPELLING.get(w, w) for w in text.split()]
    return " ".join(words)

print(normalise("E-MAIL me about the 1,000 Colour samples, 2k units"))`,
      lines: [
        { code: "text = unicodedata.normalize(\"NFKC\", text)", say: "Unicode first: full-width letters, composed accents and compatibility characters become one standard form." },
        { code: "text = text.lower()", say: "Case folding. A deliberate loss: 'Apple' and 'apple' merge." },
        { code: "text = re.sub(r\"(?<=\\d),(?=\\d{3}\\b)\", \"\", text)          # 1,000 -> 1000", say: "Thousands separators are removed only between digits, so a comma in a sentence survives." },
        { code: "words = [SPELLING.get(w, w) for w in text.split()]", say: "A dictionary of known variants maps each to one canonical spelling." },
      ],
      output: "email me about the 1000 color samples, 2000 units",
      note: "The dictionary grows from logs: every variant that caused a missed match becomes a line.",
    },
    useIt: "Normalise before indexing, before counting, before matching records, and before training count-based models. For language models, normalise lightly (Unicode and whitespace) and leave case and punctuation. Always apply the same function at training and prediction time and keep it under version control.",
    takeaways: ["Normalisation maps surface variants to one canonical form so they count as one.", "Every rule loses something; choose per task and record the choice.", "Unicode, case, punctuation, numbers, dates and spelling variants are the usual targets.", "The same normaliser must run everywhere, or data drifts apart again."],
    terms: [["normalisation (text)", "mapping variant forms of the same thing to one canonical form"], ["case folding", "converting all letters to one case so case differences do not matter"], ["canonical form", "the single agreed representation chosen for a value"]],
    reflect: { q: "After adding case folding, your medical-note classifier confuses 'ALS' (a disease) with 'als' (a Dutch word in some notes). What would you do?", a: "Keep case for that model, or add a feature marking all-caps tokens, or protect a list of known acronyms from folding. The general lesson: a normalisation that helps on average can hurt a specific class; look at per-class errors." },
  },

  "m11-stemming": {
    simple: "Stemming chops word endings off by rule so that 'running', 'runs' and 'runner' all become 'run', letting a program count them as one word, at the cost of sometimes producing non-words.",
    concept:
      "English makes many words from one root: connect, connected, connecting, connection, connections. For counting and searching, those five are usually one idea. **Stemming** reduces each to a common stem by cutting off suffixes according to rules: strip '-ing', strip '-ed', turn '-ies' into '-i'. The stem need not be a real word: 'connection' becomes 'connect' but 'happiness' may become 'happi'.\n\nThe best-known stemmer is the Porter stemmer (1980), a list of about sixty rules applied in order. It is fast, needs no dictionary, and is still used in search engines. It is also crude: 'universe' and 'university' both become 'univers' (over-stemming), while 'ran' and 'run' stay apart (under-stemming).\n\nStemming is a trade: you gain matches you would have missed, you lose distinctions you might have needed, and you get stems that are useless to show to a person. It belongs inside an index or a count-based model, never in output.",
    why:
      "A search for 'connect' should probably find a document about 'connections'. A word-count model should treat 'runs' and 'running' as evidence for the same topic, not as two rare words. Without stemming, every form of a word is a separate feature, each with little data, and queries miss documents that use a different form.\n\nStemming exists as the cheap, dictionary-free way to achieve that. It was invented when memory was scarce and it is still the fastest option; lemmatisation (the next lesson) does the same job more carefully and more slowly.",
    how: [
      "Lowercase the word.",
      "Apply suffix rules in a fixed order: plural endings first ('-sses' → '-ss', '-ies' → '-i', '-s' → ''), then verb endings ('-ed', '-ing' when the stem keeps a vowel), then derivational endings ('-ational' → '-ate', '-ness' → '').",
      "Each rule checks the shape of what remains (its 'measure' of vowel-consonant groups) so that 'sing' does not lose its '-ing'.",
      "Stop when no rule applies; the result is the stem.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "Porter stem", "Comment"],
        rows: [
          ["connection, connected, connecting", "connect", "the intended merge"],
          ["happiness", "happi", "not a word; fine inside an index"],
          ["universe, university", "univers", "over-stemming: two meanings merged"],
          ["ran / run", "ran / run", "under-stemming: irregular forms stay apart"],
          ["sing / singing", "sing / sing", "the measure rule keeps 'sing' intact"],
          ["agreed", "agre", "strange but consistent: all forms map the same way"],
        ],
      },
      caption: "Stems are for machines. The errors are systematic, which is why they are tolerable: the same mistake happens to the query and to the document.",
    },
    everyday: {
      title: "Filing by the first few letters",
      text: "Someone filing receipts by shop might write 'Tesco' on the folder and drop in receipts from 'Tesco Express', 'Tesco Extra' and 'TESCO METRO'. The folder label is a stem: a crude cut that groups what belongs together, sometimes too eagerly (a 'Tesco Bank' statement lands there too). Nobody expects the label to be elegant; they expect to find the receipt.",
    },
    engineering: {
      title: "Search inside a help centre",
      text: "A company's help-centre search indexes articles by stemmed words. A customer typing 'cancelling subscriptions' matches an article titled 'How to cancel your subscription' because both reduce to 'cancel' and 'subscript'. Without stemming the match depended on the exact inflection. The team found the over-stemming cases in their logs ('organ' matching 'organisation') and added a short exception list. They also store the original words for display, since a snippet showing 'subscript' would look broken.",
    },
    code: {
      title: "A handful of Porter-style rules",
      lang: "py",
      src: `def stem(word):
    w = word.lower()
    for suffix, repl in [("sses", "ss"), ("ies", "i"), ("ss", "ss"), ("s", "")]:
        if w.endswith(suffix):
            w = w[: -len(suffix)] + repl
            break
    for suffix in ["ingly", "ing", "edly", "ed"]:
        if w.endswith(suffix) and any(c in "aeiou" for c in w[: -len(suffix)]):
            w = w[: -len(suffix)]
            break
    for suffix, repl in [("ational", "ate"), ("tional", "tion"), ("ness", ""), ("ful", "")]:
        if w.endswith(suffix):
            w = w[: -len(suffix)] + repl
            break
    return w

for word in ["connections", "connected", "happiness", "sing", "singing", "relational"]:
    print(word, "->", stem(word))`,
      lines: [
        { code: "for suffix, repl in [(\"sses\", \"ss\"), (\"ies\", \"i\"), (\"ss\", \"ss\"), (\"s\", \"\")]:", say: "Plural rules in order: the longer suffix is tried first so 'classes' does not lose only its final 's'." },
        { code: "if w.endswith(suffix) and any(c in \"aeiou\" for c in w[: -len(suffix)]):", say: "The vowel check is a simplified 'measure': 'sing' keeps its '-ing' because 's' alone has no vowel." },
        { code: "for suffix, repl in [(\"ational\", \"ate\"), (\"tional\", \"tion\"), (\"ness\", \"\"), (\"ful\", \"\")]:", say: "Derivational endings: 'relational' becomes 'relate', 'happiness' becomes 'happi'." },
        { code: "return w", say: "Whatever remains is the stem, word or not." },
      ],
      output: "connections -> connect\nconnected -> connect\nhappiness -> happi\nsing -> sing\nsinging -> sing\nrelational -> relate",
      note: "The real Porter stemmer has five phases and many more rules; the shape is exactly this.",
    },
    useIt: "Use stemming in search indexes and in count-based text models (bag of words, TF-IDF) where speed matters and stems are never shown. Prefer lemmatisation when the output is displayed or when meaning distinctions matter. Never stem text going into a modern language model; it learns inflections itself.",
    takeaways: ["Stemming cuts suffixes by rule to merge word forms; stems may not be words.", "It is fast and needs no dictionary; it over-stems and under-stems systematically.", "Apply the same stemmer to queries and documents so the errors cancel.", "Keep original words for display; stems are for the index."],
    terms: [["stemming", "reducing a word to a stem by cutting suffixes with rules"], ["Porter stemmer", "the classic rule-based English stemmer from 1980"], ["over-stemming / under-stemming", "merging words that should differ, or failing to merge words that should match"]],
    reflect: { q: "Why does it matter less that 'universe' and 'university' both stem to 'univers' in a search engine than it would in a translation system?", a: "In search the same stemmer runs on the query and the documents, so a search for 'universe' finds both, and ranking by other words usually sorts them out; the error is a few extra results. In translation the merged stem would be the input to meaning, and the two meanings cannot be told apart again." },
  },

  "m11-lemmatisation": {
    simple: "Lemmatisation reduces a word to its dictionary form (its lemma) using vocabulary and grammar: 'ran' becomes 'run', 'better' becomes 'good', and the result is always a real word.",
    concept:
      "Where stemming cuts, **lemmatisation** looks up. The lemma of a word is the form you would find in a dictionary: 'run' for 'ran', 'running' and 'runs'; 'good' for 'better' and 'best'; 'mouse' for 'mice'. A lemmatiser uses a vocabulary of words and their forms, plus the word's part of speech, because the same spelling can have different lemmas: 'saw' as a verb is 'see', 'saw' as a noun is 'saw'.\n\nThat makes lemmatisation more accurate and more expensive than stemming. It needs a dictionary for the language, it usually needs a tagger to decide the part of speech first, and it is slower. In return, its output is readable and its merges are linguistically right: irregular forms are handled, and unrelated words are not merged just because they share letters.\n\nFor English the gain over stemming is moderate. For languages with rich inflection, where one noun has a dozen case endings or one verb has a hundred forms, lemmatisation is the only way to merge forms without a huge dictionary of rules.",
    why:
      "Stemming's errors are tolerable inside an index and intolerable anywhere a person reads the result or where meaning must be preserved. Showing 'happi' in a word cloud, 'univers' in a topic label, or merging 'organ' with 'organisation' in a medical-term extractor are all failures. Irregular words, which are among the most common in any language, are untouched by stemming: 'went' never meets 'go'.\n\nLemmatisation exists to merge word forms correctly, including the irregular ones, and to produce something people can read. It costs a dictionary and some compute, and for most applications outside raw search that cost is worth paying.",
    how: [
      "Tokenise the text and tag each token with its part of speech (noun, verb, adjective…), because the lemma depends on it.",
      "Look the word and tag up in a lexicon of inflected forms: ('ran', verb) → 'run'; ('mice', noun) → 'mouse'.",
      "If the word is not in the lexicon, fall back to morphological rules (strip '-s', '-ed', '-ing' with the tag as a guide) or to a learned model that predicts the lemma from the characters.",
      "Return the lemma; keep the original token alongside for display.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Stemming", points: ["rules only, no dictionary", "very fast", "'ran' stays 'ran'; 'better' stays 'better'", "'happiness' → 'happi'", "good enough inside a search index"] },
      right: { title: "Lemmatisation", points: ["dictionary + part of speech", "slower, needs a language model of sorts", "'ran' → 'run'; 'better' → 'good'", "'happiness' → 'happiness'", "right when output is read or meaning matters"] },
      caption: "Same goal, merging word forms; different method, different accuracy, different cost.",
    },
    everyday: {
      title: "Looking a word up properly",
      text: "A child asks what 'mice' means. You do not say 'mic'; you say 'it's the plural of mouse' and look up mouse. You used knowledge of English, not a cutting rule. A lemmatiser is that lookup done automatically, with the same need to know first whether 'saw' is a tool or something you did yesterday.",
    },
    engineering: {
      title: "Extracting symptoms from clinical notes",
      text: "A hospital analytics team pulls symptoms from free-text notes to count how often each appears. Stemming turned 'vomiting', 'vomited' and 'vomits' into 'vomit', which was fine, but also merged 'organ' and 'organisation' and mangled terms into forms that clinicians could not read on the dashboard. Switching to lemmatisation produced counts under 'vomit' and 'organ' correctly, and the dashboard shows real words. The cost was a slower pipeline and a medical lexicon to extend the lemmatiser's dictionary with terms it did not know.",
    },
    code: {
      title: "Lemmatising with a lexicon and a part-of-speech hint",
      lang: "py",
      src: `LEXICON = {
    ("ran", "VERB"): "run", ("running", "VERB"): "run", ("runs", "VERB"): "run",
    ("better", "ADJ"): "good", ("best", "ADJ"): "good",
    ("mice", "NOUN"): "mouse", ("saw", "VERB"): "see", ("saw", "NOUN"): "saw",
    ("went", "VERB"): "go",
}

def lemmatise(word, pos):
    key = (word.lower(), pos)
    if key in LEXICON:
        return LEXICON[key]
    w = word.lower()
    if pos == "NOUN" and w.endswith("s") and not w.endswith("ss"):
        return w[:-1]                                   # fallback rule for regular plurals
    if pos == "VERB" and w.endswith("ing") and len(w) > 5:
        return w[:-3]
    return w

for word, pos in [("ran", "VERB"), ("saw", "VERB"), ("saw", "NOUN"), ("mice", "NOUN"), ("tables", "NOUN"), ("better", "ADJ")]:
    print(word, pos, "->", lemmatise(word, pos))`,
      lines: [
        { code: "(\"saw\", \"VERB\"): \"see\", (\"saw\", \"NOUN\"): \"saw\",", say: "The same spelling has two lemmas. Only the part of speech tells them apart, which is why a tagger runs first." },
        { code: "if key in LEXICON:", say: "Irregular forms are looked up, not computed. 'went' → 'go' is impossible for a stemmer." },
        { code: "if pos == \"NOUN\" and w.endswith(\"s\") and not w.endswith(\"ss\"):", say: "Words outside the lexicon fall back to tag-aware rules: a regular plural noun loses its 's'." },
        { code: "return w", say: "Unknown and uninflected words return unchanged, as real words." },
      ],
      output: "ran VERB -> run\nsaw VERB -> see\nsaw NOUN -> saw\nmice NOUN -> mouse\ntables NOUN -> table\nbetter ADJ -> good",
      note: "Real lemmatisers (spaCy, Stanza) carry lexicons of hundreds of thousands of forms per language and a tagger trained on annotated text.",
    },
    useIt: "Use lemmatisation when results are shown to people (word clouds, topic labels, extracted terms), when irregular words matter, and for languages with rich inflection. Use stemming for raw search speed. Neither is needed before a modern language model, which learns inflection itself.",
    takeaways: ["Lemmatisation maps a word to its dictionary form using a lexicon and part of speech.", "It handles irregular forms and produces real words; it costs a dictionary and a tagger.", "Part of speech decides the lemma when spellings collide ('saw').", "Choose stemming for speed inside indexes, lemmatisation when accuracy or readability matter."],
    terms: [["lemma", "the dictionary form of a word"], ["lemmatisation", "reducing a word to its lemma using vocabulary and grammar"], ["part of speech", "a word's grammatical role: noun, verb, adjective and so on"]],
    reflect: { q: "A lemmatiser turns 'leaves' into 'leaf' in the sentence 'She leaves at nine.' What went wrong, and what would have prevented it?", a: "The part-of-speech tag was wrong or missing: 'leaves' here is a verb (lemma 'leave'), not the plural noun. A tagger that reads the sentence context ('she … at nine') would assign VERB and the lexicon would return 'leave'. Lemmatisation is only as good as the tag." },
  },

  "m11-stop-words": {
    simple: "Stop words are the very common words like 'the', 'is' and 'of' that carry little topic information; count-based systems often drop them, and meaning-based systems keep them.",
    concept:
      "In any pile of English text, a handful of words make up a large share of all the words: 'the', 'of', 'and', 'to', 'a', 'in', 'is', 'that'. They appear in nearly every document, so they say almost nothing about what a document is about. These are **stop words**, and classic NLP systems remove them before counting, because they add size and noise to the counts without adding information.\n\nThe list is a choice, not a fact of the language. Search engines keep lists of a few hundred words; libraries ship default lists; teams add domain words that are common everywhere in their data ('patient' in medical notes, 'order' in a shop's tickets). And the list has famous victims: 'not' is on many lists, and removing it turns 'not good' into 'good'. 'The Who', 'to be or not to be' and 'IT' (information technology) dissolve entirely.\n\nModern models do not remove stop words. Function words carry grammar, negation and tone, and a model that reads sentences needs them. Stop-word removal belongs to the counting era, and it is still right there.",
    why:
      "In a bag-of-words model (two lessons on), every word becomes a feature and every occurrence a count. The word 'the' would dominate every document's counts while telling the classifier nothing, and it would be the biggest entry in every index. Removing stop words shrinks the data, speeds everything up and lets the informative words stand out.\n\nIt exists because when all you do with words is count them, the most frequent words are the least useful. Once a system reads words in order, that stops being true.",
    how: [
      "Take or build a list of stop words for the language; extend it with words that are common across all your documents and useless for the task.",
      "Tokenise and normalise the text first, so 'The' and 'the' are both caught.",
      "Drop every token found in the list.",
      "Check what the task needs: keep negations ('not', 'no', 'never') for sentiment; keep everything for phrase search and for any model that reads order.",
      "Measure: compare model accuracy and index size with and without the list; the list should earn its place.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "sentence", detail: "'The delivery was not on time and the box was damaged.'" },
        { label: "tokens", detail: "[the, delivery, was, not, on, time, and, the, box, was, damaged]" },
        { label: "drop default stop words", detail: "[delivery, time, box, damaged]  ← 'not' is gone" },
        { label: "drop stop words, keep negations", detail: "[delivery, not, time, box, damaged]" },
      ],
      caption: "Topic survives either way: delivery, box, damaged. Sentiment survives only if 'not' is kept. The list must match the task.",
    },
    everyday: {
      title: "Skimming a newspaper",
      text: "Skim a headline-filled page and your eye lands on 'strike', 'election', 'flood'; it slides over 'the', 'of', 'in'. You are doing stop-word removal: ignoring the glue to find the topics. But if a headline says 'No strike after all', skipping 'no' makes you misread it. That is the trade-off exactly.",
    },
    engineering: {
      title: "Shrinking a search index",
      text: "An e-commerce site's search index stored a posting list for every word, and the list for 'the' contained nearly every product description: a huge list that was scanned on any query containing 'the' and contributed nothing to ranking. Removing 300 stop words cut the index by about a third and made queries faster. Then phrase searches broke: 'to be or not to be' (a book) became an empty query. The fix was to keep stop words for exact-phrase matching and drop them for the ordinary ranked search.",
    },
    maths: {
      formula: "share of all words = count of the word ÷ total words",
      meaning: "Stop words are the words whose share is high in every document. A quick way to find candidates: rank words by how many documents contain them.",
      worked: [
        "A small corpus of 10,000 words contains 'the' 620 times, 'delivery' 45 times and 'damaged' 12 times.",
        "Shares: 'the' = 620 ÷ 10,000 = 6.2%; 'delivery' = 0.45%; 'damaged' = 0.12%.",
        "'the' appears in 98% of documents, 'delivery' in 15%, 'damaged' in 3%. A word in 98% of documents cannot separate documents; it is a stop-word candidate.",
        "'delivery' is in 15% of documents: common in this shop's data, but it marks a topic, so it stays unless the task is purely 'which delivery problem?'.",
      ],
      note: "TF-IDF (two lessons on) automates this reasoning by weighting words down as they appear in more documents.",
    },
    code: {
      title: "Removing stop words with the task in mind",
      lang: "py",
      src: `STOP = {"the", "a", "an", "and", "or", "of", "to", "in", "on", "is", "was", "were", "it", "this", "that", "not", "no"}
NEGATIONS = {"not", "no", "never"}

def remove_stop_words(tokens, keep_negations=False):
    keep = NEGATIONS if keep_negations else set()
    return [t for t in tokens if t not in STOP or t in keep]

tokens = "the delivery was not on time and the box was damaged".split()
print(remove_stop_words(tokens))
print(remove_stop_words(tokens, keep_negations=True))`,
      lines: [
        { code: "STOP = {\"the\", \"a\", \"an\", \"and\", \"or\", \"of\", \"to\", \"in\", \"on\", \"is\", \"was\", \"were\", \"it\", \"this\", \"that\", \"not\", \"no\"}", say: "A list is a set of choices. This one includes 'not', as many default lists do." },
        { code: "keep = NEGATIONS if keep_negations else set()", say: "The task decides whether negations survive. Sentiment says yes; topic classification does not care." },
        { code: "return [t for t in tokens if t not in STOP or t in keep]", say: "Every token is kept unless it is on the list and not protected." },
      ],
      output: "['delivery', 'time', 'box', 'damaged']\n['delivery', 'not', 'time', 'box', 'damaged']",
      note: "The 'not' row is the whole lesson: the same list is right for one task and wrong for another.",
    },
    useIt: "Remove stop words for bag-of-words and TF-IDF models, keyword extraction and index size, after checking what the task needs. Keep them for phrase search, sentiment, anything that reads order, and every modern language model.",
    takeaways: ["Stop words are frequent function words that carry little topic information.", "Dropping them helps counting systems and shrinks indexes.", "Lists are choices; negations and phrase names are the usual casualties.", "Models that read order, including all modern language models, keep them."],
    terms: [["stop words", "very common words removed before counting because they carry little topic information"], ["function words", "grammar words like articles, prepositions and auxiliaries, as opposed to content words"]],
    reflect: { q: "A topic model of customer emails keeps producing a topic made of 'please', 'thanks', 'regards', 'hi'. What is happening and what is the fix?", a: "Those words are common across all emails (greetings and sign-offs) and carry no topic, so they behave like stop words for this corpus. Add them to a domain stop list, or strip greeting and signature lines in preprocessing. Default lists never know your domain's glue words." },
  },

  "m11-n-grams": {
    simple: "An n-gram is a run of n consecutive items, usually words: 'new york' is a bigram. Counting n-grams instead of single words keeps short phrases and word order.",
    concept:
      "Counting single words loses order: 'dog bites man' and 'man bites dog' have the same counts. An **n-gram** is a sequence of n items in a row. With words: unigrams are single words ('new', 'york'), bigrams are pairs ('new york', 'york city'), trigrams are triples. With characters: the character trigrams of 'cat' are 'cat' alone, and of 'cats' are 'cat' and 'ats'.\n\nCounting n-grams gives a model a little of the order that single words throw away. 'not good' becomes a bigram with its own count, separate from 'good'. 'new york' becomes one feature instead of two unrelated ones. Character n-grams let a model match misspellings and unknown words by their pieces: 'recieve' shares most of its trigrams with 'receive'.\n\nThe cost is size. The number of possible bigrams is the vocabulary squared, and most of them are rare, so data gets sparse fast. In practice n stays small (2 or 3 for words, 3 to 5 for characters), and the rare n-grams are dropped. Module 14 turns n-gram counts into the first language models.",
    why:
      "Single-word features cannot see negation, names, or idioms. 'Not', 'good' and 'not good' need to be different things to a sentiment model; 'Hong Kong' is a place, not a noun and a verb. Word order carries meaning, and a bag of single words has none. N-grams are the cheapest way to recover a little order without building a model that reads sequences.\n\nCharacter n-grams exist for a different reason: words are too coarse when text has typos, unusual names, new words and agglutinative languages. Pieces of words generalise where whole words cannot. That same insight, pushed further, becomes subword tokenisation in Module 12.",
    how: [
      "Tokenise the text into words (or decide to work on characters).",
      "Slide a window of width n across the sequence, one position at a time; each window is one n-gram.",
      "Optionally add start and end markers so the first and last words get their own n-grams ('<s> new', 'york </s>').",
      "Count each distinct n-gram across the corpus.",
      "Drop n-grams below a minimum count; they are too rare to carry evidence and they bloat the feature space.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Unigrams", "Bigrams", "Character trigrams"],
        rows: [
          ["not good", "not, good", "not good", "not, ot_, t_g, _go, goo, ood"],
          ["new york city", "new, york, city", "new york, york city", "new, ew_, w_y, _yo, yor, ork, …"],
          ["recieve", "recieve", "(none)", "rec, eci, cie, iev, eve"],
          ["receive", "receive", "(none)", "rec, ece, cei, eiv, ive"],
        ],
      },
      caption: "The bigram 'not good' is a feature the unigrams could not express. The two spellings of receive share 'rec' and little else at trigram level, but share more at bigram level: pieces give partial credit.",
    },
    everyday: {
      title: "Predictive text",
      text: "Type 'happy' on a phone and it offers 'birthday' before 'new' because the bigram 'happy birthday' is counted far more often than 'happy new'. Type 'happy new' and it offers 'year'. That is a trigram count. Your keyboard carries a table of common word runs and ranks the next word by them: n-grams in your pocket.",
    },
    engineering: {
      title: "Catching typos and names in product search",
      text: "A retailer's search engine indexed products by words, so 'samsng galaxy' found nothing and a new brand name was invisible until its spelling was added to a dictionary. Switching to character n-grams (3 to 5 letters) made 'samsng' match 'samsung' through shared pieces ('sam', 'ams', 'sun', 'ung') and let unseen names match themselves partially. The index grew several times larger, so the team kept word n-grams for the first pass and character n-grams only as a fallback when the first pass found too little.",
    },
    maths: {
      formula: "number of n-grams in a sequence of L tokens = L − n + 1;   possible distinct word bigrams ≈ V²",
      meaning: "A sentence of L words has L − n + 1 windows of width n. With a vocabulary of V words the space of possible bigrams is V squared, which is why most bigrams are never seen.",
      worked: [
        "'the box was damaged' has L = 4 words. Bigrams: 4 − 2 + 1 = 3: 'the box', 'box was', 'was damaged'. Trigrams: 4 − 3 + 1 = 2.",
        "With start and end markers the sequence is 6 tokens: 5 bigrams, including '<s> the' and 'damaged </s>'.",
        "A vocabulary of V = 50,000 words allows 50,000² = 2.5 billion possible bigrams. A 10-million-word corpus contains at most 10 million bigram occurrences, so almost all possible bigrams have count zero.",
        "That sparsity is why counts below a threshold are dropped and why Module 14 needs smoothing.",
      ],
    },
    code: {
      title: "Counting word and character n-grams",
      lang: "py",
      src: `from collections import Counter

def ngrams(items, n):
    return [tuple(items[i:i + n]) for i in range(len(items) - n + 1)]

sentences = ["the box was damaged", "the box was late", "not good at all", "good box"]

bigrams = Counter()
for s in sentences:
    bigrams.update(ngrams(["<s>"] + s.split() + ["</s>"], 2))
print(bigrams.most_common(3))

def char_ngrams(word, n=3):
    padded = "_" + word + "_"
    return ngrams(list(padded), n)

a, b = set(char_ngrams("receive")), set(char_ngrams("recieve"))
print(len(a & b), "shared of", len(a | b))`,
      lines: [
        { code: "return [tuple(items[i:i + n]) for i in range(len(items) - n + 1)]", say: "The sliding window: every start position from 0 to L − n gives one n-gram of width n." },
        { code: "bigrams.update(ngrams([\"<s>\"] + s.split() + [\"</s>\"], 2))", say: "Start and end markers let 'the' get credit for starting sentences and 'damaged' for ending them." },
        { code: "print(bigrams.most_common(3))", say: "'the box' and 'box was' appear twice each: the beginning of a count table that Module 14 turns into predictions." },
        { code: "padded = \"_\" + word + \"_\"", say: "Padding a word before cutting character n-grams marks its edges, so 'cat' and 'scatter' do not share all their pieces." },
        { code: "print(len(a & b), \"shared of\", len(a | b))", say: "The two spellings of 'receive' overlap partially: enough for a fuzzy match, unlike whole-word matching, which gives zero." },
      ],
      output: "[(('<s>', 'the'), 2), (('the', 'box'), 2), (('box', 'was'), 2)]\n3 shared of 11",
    },
    useIt: "Add bigrams to any bag-of-words model for sentiment or topic (it usually helps a few points). Use character n-grams for search over names and misspellings, language identification, and any text with rare words. Keep n small and drop rare n-grams; Module 14 builds language models from these counts.",
    takeaways: ["An n-gram is n consecutive items; it preserves a little order and phrases.", "Word bigrams capture negation and names; character n-grams handle typos and unknown words.", "The space of n-grams grows as Vⁿ, so most are unseen; keep n small, drop rare ones.", "N-gram counts are the foundation of the first language models (Module 14)."],
    terms: [["n-gram", "a sequence of n consecutive words or characters"], ["unigram / bigram / trigram", "n-grams of length 1, 2 and 3"], ["sparsity", "most possible combinations never appear in the data, so their counts are zero"]],
    reflect: { q: "Why do search engines use character n-grams of length 3 to 5 rather than 1 or 10?", a: "Single characters match everything and carry no information; 10-character pieces are almost whole words and no longer match misspellings or partial names. Lengths of 3 to 5 are specific enough to be informative and short enough to survive a typo." },
  },

  "m11-bag-of-words": {
    simple: "Bag of words turns a document into a list of word counts, ignoring order, so that documents become vectors a model can compare and classify.",
    concept:
      "To run any numeric model on text, each document must become a fixed-length list of numbers. The oldest way is to decide on a vocabulary, say 20,000 words, and represent a document by how many times each vocabulary word appears in it. That list of counts is the document's **bag of words**: a bag because the order is thrown away, as if the words were tipped out and counted.\n\nThe result is a vector with one position per vocabulary word. Most positions are zero, since a review of fifty words touches fifty of the 20,000 slots. Two documents with similar counts are about similar things; a classifier can learn which slots predict which label; a search engine can score how many query words a document contains.\n\nBag of words knows nothing about meaning. 'Cheap' and 'inexpensive' are unrelated slots; 'not good' is the same as 'good, not'. N-grams patch the order problem slightly, TF-IDF (next lesson) fixes the weighting, and embeddings (Module 13) finally give slots meaning. But bag of words is simple, fast, interpretable and still a strong baseline for classifying documents by topic.",
    why:
      "Models need vectors of a fixed length; documents are sequences of variable length. Something has to bridge the two, and counting is the simplest bridge: it works for any document, needs only a vocabulary, and produces numbers a linear classifier can use directly. For a long time it was the only practical bridge, and it powered spam filters, news categorisation and search ranking.\n\nIt exists because counting what words a document contains is already a surprisingly good description of what the document is about. Order and meaning come later; presence and frequency get you most of the way for topic-like tasks.",
    how: [
      "Preprocess and tokenise every document (lowercase, maybe stop words, maybe stemming).",
      "Build the vocabulary: every distinct token across the training documents, or the top K most frequent, each with an index.",
      "For each document, create a vector of length V (vocabulary size) filled with zeros.",
      "For each token in the document, add 1 at that token's index (or set it to 1 for a binary version).",
      "Feed the vectors to a classifier or a similarity measure; store them sparsely, since most entries are zero.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["", "box", "damaged", "delivery", "good", "late", "not"],
        rows: [
          ["D1: 'the box was damaged'", "1", "1", "0", "0", "0", "0"],
          ["D2: 'delivery late, box late'", "1", "0", "1", "0", "2", "0"],
          ["D3: 'not good'", "0", "0", "0", "1", "0", "1"],
          ["D4: 'good, not bad'", "0", "0", "0", "1", "0", "1"],
        ],
      },
      caption: "Stop words dropped. D1 and D2 share 'box' and look related; D3 and D4 are identical vectors despite opposite meaning. That last row is the limit of the method.",
    },
    everyday: {
      title: "Describing a shopping basket by its contents",
      text: "Tip someone's shopping basket out and count: 3 apples, 1 loaf, 2 yoghurts. You now know a lot about the shopper (vegetarian? family?) without knowing the order they picked things up. A bag of words is a document's shopping basket: counts of what is in it, order discarded, enough to guess the topic.",
    },
    engineering: {
      title: "News categorisation at a publisher",
      text: "A publisher sorts incoming wire stories into sections (politics, sport, business, technology). A bag-of-words vector over 30,000 words with a linear classifier reaches 93% accuracy and runs in a millisecond per story, trained on ten years of labelled archives. The team keeps it although newer models reach 96%, because its mistakes are explainable: the weight on 'goal' says sport, the weight on 'shares' says business, and an editor can read the top words behind any decision. Its known weakness is stories about a politician's football club.",
    },
    maths: {
      formula: "document vector d = [count(w₁ in d), count(w₂ in d), …, count(w_V in d)];   similarity(d, q) = Σᵢ dᵢ · qᵢ",
      meaning: "Each document becomes a V-long list of counts. The dot product of two such vectors adds up the products of matching counts: a crude 'how many words do they share, and how often'.",
      worked: [
        "Vocabulary [box, damaged, delivery, good, late, not]. D1 = [1, 1, 0, 0, 0, 0]. D2 = [1, 0, 1, 0, 2, 0].",
        "Query 'late box' → q = [1, 0, 0, 0, 1, 0].",
        "Score(D1, q) = 1·1 + 1·0 + 0 + 0 + 0·1 + 0 = 1. Score(D2, q) = 1·1 + 0 + 0 + 0 + 2·1 + 0 = 3.",
        "D2 ranks first: it shares both query words and mentions 'late' twice. Module 13 refines this with cosine similarity, which stops long documents winning just by being long.",
      ],
    },
    code: {
      title: "Bag of words by hand",
      lang: "py",
      src: `docs = ["the box was damaged", "delivery late box late", "not good", "good not bad"]
STOP = {"the", "was"}

tokens = [[w for w in d.split() if w not in STOP] for d in docs]
vocab = sorted({w for t in tokens for w in t})
index = {w: i for i, w in enumerate(vocab)}

def vectorise(words):
    v = [0] * len(vocab)
    for w in words:
        v[index[w]] += 1
    return v

vectors = [vectorise(t) for t in tokens]
print(vocab)
for d, v in zip(docs, vectors):
    print(v, d)`,
      lines: [
        { code: "vocab = sorted({w for t in tokens for w in t})", say: "The vocabulary is every distinct token seen in training. Its order fixes which position each word owns." },
        { code: "index = {w: i for i, w in enumerate(vocab)}", say: "Word → position. A word not in this map (unseen at training time) has no slot and is ignored." },
        { code: "v = [0] * len(vocab)", say: "Every document starts as all zeros, one slot per vocabulary word." },
        { code: "v[index[w]] += 1", say: "Each occurrence adds one to its slot. Order is gone the moment this runs." },
      ],
      output: "['bad', 'box', 'damaged', 'delivery', 'good', 'late', 'not']\n[0, 1, 1, 0, 0, 0, 0] the box was damaged\n[0, 1, 0, 1, 0, 2, 0] delivery late box late\n[0, 0, 0, 0, 1, 0, 1] not good\n[1, 0, 0, 0, 1, 0, 1] good not bad",
      note: "Libraries do this with sparse matrices so a million documents by 50,000 words fits in memory; the idea is these twelve lines.",
    },
    useIt: "Use bag of words with a linear classifier as the first baseline for any document classification task: it is fast, explainable and often within a few points of far heavier models on topic-like problems. Add bigrams and TF-IDF next. Move to embeddings when meaning, paraphrase or negation matter.",
    takeaways: ["Bag of words = a vector of word counts per document, order discarded.", "It gives any text a fixed-length numeric form a classifier can use.", "It cannot see order, negation or synonyms; n-grams, TF-IDF and embeddings address those in turn.", "Still the right first baseline for topic classification."],
    terms: [["bag of words", "representing a document by counts of each vocabulary word, ignoring order"], ["vocabulary", "the fixed list of words that get a position in the vector"], ["sparse vector", "a vector that is mostly zeros, stored by listing only the non-zero entries"]],
    reflect: { q: "Two reviews: 'the screen is great but the battery is terrible' and 'the battery is great but the screen is terrible'. What does a bag of words see, and what would you add?", a: "Identical vectors; it cannot tell which word 'terrible' attaches to. Bigrams help a little ('battery terrible' vs 'screen terrible'); properly, you need a model that reads order and attaches sentiment to aspects, which is what embeddings and transformers provide later." },
  },

  "m11-tf-idf": {
    simple: "TF-IDF scores a word in a document by how often it appears there (TF) and how rare it is across all documents (IDF), so common everywhere-words count for little and distinctive words count for a lot.",
    concept:
      "Raw counts have a problem: 'the' gets the biggest count in every document, and a word that appears in every document cannot tell documents apart. **TF-IDF** fixes the weighting with two ideas. **Term frequency** (TF): a word that appears often in this document matters for this document. **Inverse document frequency** (IDF): a word that appears in few documents overall is distinctive, and a word in nearly all documents is not. Multiply the two and each word's weight in each document reflects both.\n\nThe effect is that 'the' gets an IDF near zero and vanishes without any stop-word list, 'delivery' in a shop's reviews gets a modest weight, and 'off-gassing' in the one review that mentions it gets a high weight: it is the word that makes that review findable.\n\nTF-IDF was the standard search-ranking weight for decades and still underlies many search engines and most keyword-based classifiers. It is bag of words with better numbers; the vectors are the same shape, just weighted instead of counted.",
    why:
      "Counting treats every occurrence as equal, which makes long documents and common words dominate. Searching for 'damaged box' with raw counts ranks a document that says 'the the the box' highly. Classifying with raw counts gives the classifier huge features for words that mean nothing.\n\nTF-IDF exists to let the informative words speak. It encodes a simple intuition as a formula: a word tells you something about a document when it is frequent in that document and rare elsewhere. That one formula removed the need for most hand-made stop lists and gave search engines a ranking that matched what people expected.",
    how: [
      "Build the bag-of-words counts for every document in the collection.",
      "For each word, count how many documents contain it (its document frequency, df).",
      "Compute IDF for each word: log(N ÷ df), where N is the number of documents; words in every document get IDF 0.",
      "Compute TF for each word in each document: the count, often dampened (1 + log count) so ten mentions are not ten times one mention.",
      "Weight = TF × IDF. Replace the counts in each document vector with these weights; normalise the vector's length so long documents do not win by size.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "In how many of 4 docs (df)", "IDF = log(4 ÷ df)", "Meaning"],
        rows: [
          ["the", "4", "log(1) = 0", "everywhere: contributes nothing"],
          ["box", "2", "log(2) ≈ 0.69", "fairly common: modest weight"],
          ["damaged", "1", "log(4) ≈ 1.39", "distinctive: high weight"],
          ["off-gassing", "1", "log(4) ≈ 1.39", "distinctive: the word that finds this document"],
        ],
      },
      caption: "IDF alone, before multiplying by term frequency. The word in every document is weighted to zero without a stop-word list.",
    },
    everyday: {
      title: "What makes a clue a clue",
      text: "If every suspect in a mystery wears a coat, 'wore a coat' is no clue. If only one has a scar, the scar is the clue. TF-IDF is that reasoning for words: what is special about this document is what is in it that is not in the others. A word everybody uses identifies nobody.",
    },
    engineering: {
      title: "Ranking help-centre articles",
      text: "A software company's help search ranks 2,000 articles by TF-IDF vectors with cosine similarity. A query 'export csv crashes' matches the article about CSV export crashes far above the general 'export' overview, because 'crashes' and 'csv' are rare across the articles (high IDF) and frequent in that one (high TF), while 'export' appears in hundreds of articles and counts for little. The team's only tuning was adding bigrams and lowering the weight of words in boilerplate sections. It served well for years before they added embeddings for queries that used different words from the articles.",
    },
    maths: {
      formula: "tf-idf(w, d) = tf(w, d) × log(N ÷ df(w))",
      meaning: "tf(w, d): how many times word w appears in document d. N: number of documents. df(w): number of documents containing w. The log keeps the rare-word bonus from exploding.",
      worked: [
        "Four documents. D1 = 'the box was damaged'. 'box' appears in 2 documents, 'damaged' in 1, 'the' in all 4.",
        "IDF(the) = log(4/4) = 0. IDF(box) = log(4/2) = 0.693. IDF(damaged) = log(4/1) = 1.386.",
        "In D1 each word appears once, so tf = 1: tf-idf(the) = 0; tf-idf(box) = 0.693; tf-idf(damaged) = 1.386.",
        "D2 = 'delivery late box late': tf(late) = 2, df(late) = 1 → tf-idf(late) = 2 × 1.386 = 2.77. tf-idf(box) = 1 × 0.693 = 0.693.",
        "Query 'damaged box' scores D1 at 1.386 + 0.693 = 2.08 and D2 at 0 + 0.693 = 0.69. D1 wins on the distinctive word, as it should.",
      ],
      note: "Libraries use small variants (adding 1 inside the log, dampening tf) that change the numbers slightly but not the ranking logic.",
    },
    code: {
      title: "TF-IDF from counts",
      lang: "py",
      src: `import math
from collections import Counter

docs = ["the box was damaged", "delivery late box late", "the chair was late", "good chair"]
tokens = [d.split() for d in docs]
N = len(docs)

df = Counter()
for t in tokens:
    df.update(set(t))                                   # count documents, not occurrences

idf = {w: math.log(N / df[w]) for w in df}

def tfidf(words):
    tf = Counter(words)
    return {w: round(tf[w] * idf[w], 3) for w in tf if idf[w] > 0}

for d, t in zip(docs, tokens):
    print(d, "->", tfidf(t))`,
      lines: [
        { code: "df.update(set(t))                                   # count documents, not occurrences", say: "Document frequency counts each document once per word, however many times the word appears in it." },
        { code: "idf = {w: math.log(N / df[w]) for w in df}", say: "The rarer a word across documents, the larger its IDF. A word in all N documents gets log(1) = 0." },
        { code: "return {w: round(tf[w] * idf[w], 3) for w in tf if idf[w] > 0}", say: "Weight = count in this document × IDF. Words with IDF 0 drop out: an automatic stop list." },
      ],
      output: "the box was damaged -> {'box': 0.693, 'damaged': 1.386, 'the': 0.693, 'was': 0.693}\ndelivery late box late -> {'delivery': 1.386, 'late': 1.386, 'box': 0.693}\nthe chair was late -> {'the': 0.693, 'chair': 0.693, 'was': 0.693, 'late': 0.693}\ngood chair -> {'good': 1.386, 'chair': 0.693}",
      note: "With only four documents 'the' still has weight 0.693 because it appears in two of them; in a real corpus it is in nearly all and its IDF collapses to almost zero.",
    },
    useIt: "Use TF-IDF for keyword search ranking, as the vector form for document classifiers, for keyword extraction (the top TF-IDF words of a document are its keywords), and as the keyword half of hybrid search alongside embeddings (Stage 6). It is the baseline that embedding search must beat.",
    takeaways: ["TF-IDF = term frequency × inverse document frequency: frequent here, rare elsewhere.", "Words in every document weigh zero; distinctive words weigh most; no stop list needed.", "Same vector shape as bag of words, better numbers; pair with cosine similarity.", "Still the keyword standard and the baseline for any search system."],
    terms: [["term frequency (TF)", "how often a word appears in one document"], ["inverse document frequency (IDF)", "log of (documents ÷ documents containing the word): high for rare words"], ["document frequency", "the number of documents a word appears in"]],
    reflect: { q: "Someone searches a legal archive for 'the agreement' and gets random results. Explain with TF-IDF, and say what search engines add for this case.", a: "Both words are in nearly every legal document, so their IDF is near zero and no document is distinguished; ranking falls to noise. Engines add phrase matching, field weighting (titles), and, today, embeddings that understand the query's intent rather than its rare words." },
  },

  "m11-traditional-nlp-vs-modern-nlp": {
    simple: "Traditional NLP built the pipeline by hand from counts, rules and dictionaries; modern NLP learns the representation from raw text with neural networks, which handles meaning and order but costs data and compute.",
    concept:
      "Everything in this module so far is **traditional NLP**: a pipeline of hand-designed steps (segment, normalise, stem, remove stop words, count n-grams, weight with TF-IDF) ending in a simple model. Each step is a rule someone chose; the representation is counts; meaning is absent except as word overlap.\n\n**Modern NLP** replaces the middle of the pipeline with learned representations. A tokeniser (Module 12) cuts text into subword pieces; an embedding (Module 13) gives each piece a vector that carries meaning; a neural network, almost always a transformer (Stage 4), reads the pieces in order and produces a representation of the whole sentence that knows 'not good' is negative and 'cheap' is near 'inexpensive'. Nobody writes the rules; they are learned from enormous amounts of text.\n\nModern NLP wins on almost every accuracy benchmark, handles paraphrase and context, and transfers across tasks: one pretrained model serves classification, extraction, search and generation. Traditional NLP wins on cost, speed, transparency and data needs, and it still runs inside most search engines and many production classifiers. Knowing both lets you pick, and lets you debug the modern one when it fails, because it fails in the same places: encoding, tokens, domain words.",
    why:
      "The traditional pipeline hit a ceiling. Counts cannot see meaning, so systems could not match 'cheap' with 'inexpensive', could not resolve 'it' to the thing it referred to, and needed hand-built features for each new language and task. Every improvement was another rule.\n\nModern NLP exists because learning the representation from data removed that ceiling: given enough text, a network learns that words with similar contexts have similar meanings, and that order matters, without anyone writing it down. The jump in quality was large enough that the field reorganised around it within a few years. But the price (data, compute, opacity) means the old tools did not disappear; they moved to where cost and transparency matter most.",
    how: [
      "Traditional: clean → segment → tokenise by rules → normalise, stem, drop stop words → count n-grams → TF-IDF → linear classifier or ranking function. Each step is code you can read.",
      "Modern: light cleaning → subword tokeniser → token embeddings → transformer layers that mix context → a learned output head for the task. Each step is weights learned from data.",
      "Transfer: a modern model is pretrained once on general text and then fine-tuned or prompted for each task, instead of a new pipeline per task.",
      "Hybrid, which is what production usually looks like: traditional tools for cleaning, keyword search and cheap filtering; modern models for meaning-dependent judgement; traditional metrics to evaluate both.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Traditional NLP", points: ["hand-built steps: rules, dictionaries, counts", "representation: word counts, TF-IDF", "no meaning: 'cheap' ≠ 'inexpensive'; 'not good' ≈ 'good'", "cheap, fast, explainable, little data", "a new pipeline per task and language"] },
      right: { title: "Modern NLP", points: ["learned steps: tokeniser, embeddings, transformer", "representation: dense vectors with meaning and context", "handles paraphrase, negation, references", "needs much data and compute; opaque", "one pretrained model, many tasks"] },
      caption: "Not a replacement but a shift of where the work is: from writing rules to collecting data and evaluating.",
    },
    everyday: {
      title: "Two ways to learn a language",
      text: "One learner memorises grammar tables and a dictionary and applies them rule by rule; they are precise, slow, and lost the moment someone uses slang. The other learner lives in the country for a year, hears millions of sentences, and comes out fluent without being able to state a single rule, occasionally confidently wrong about an idiom. Traditional and modern NLP are those two learners. Good teams keep both in the room.",
    },
    engineering: {
      title: "A search team's two-layer system",
      text: "A job-search site runs a hybrid. Layer one is traditional: a TF-IDF inverted index with stemming and bigrams returns 500 candidate postings for a query in a few milliseconds; it is exact, cheap and never surprises anyone. Layer two is modern: an embedding model re-scores those 500 by meaning so that 'remote frontend role' matches postings that say 'work from home React developer'. The modern layer alone would be too slow to scan millions of postings and would miss exact codes like 'SAP FICO'; the traditional layer alone would miss paraphrases. Together they are better than either, and when results look wrong the team checks the traditional layer first because its behaviour can be read.",
    },
    useIt: "Reach for traditional NLP when you need speed, transparency, or have little data: keyword search, simple topic classifiers, keyword extraction, cleaning. Reach for modern NLP when meaning, paraphrase, context or generation matter and you have the data or a pretrained model. Most real systems are hybrids; the rest of this stage builds the modern half.",
    takeaways: ["Traditional NLP: hand-built pipeline, count representations, no meaning, cheap and explainable.", "Modern NLP: learned tokeniser, embeddings and transformers; meaning and context, at a cost.", "The failure points overlap: encoding, tokens, domain vocabulary. Traditional skills debug modern systems.", "Production is usually hybrid: traditional for speed and filtering, modern for judgement."],
    terms: [["traditional NLP", "rule- and count-based language processing"], ["modern NLP", "neural, learned representations of language, usually transformers"], ["hybrid system", "a pipeline combining traditional and modern components"]],
    reflect: { q: "Your modern sentiment model gives 'The film was not bad at all' a negative score. Which traditional-NLP habit would you use to investigate first?", a: "Look at the tokens and the preprocessing: was 'not' removed by a stop list left over from an older pipeline, or did a cleaning step strip the punctuation that marked the clause? Then check the training data for 'not bad' examples. The modern model is only as good as what reached it, and the old pipeline skills show you what did." },
  },
};

export const M11_QUIZ: Quiz[] = [
  {
    q: "A classifier treats 'Great' and 'great' as different words and has half the evidence for each. Which step is missing?",
    options: ["Sentence segmentation", "Case folding (normalisation)", "Stemming", "TF-IDF"],
    answer: 1,
    why: ["Segmentation cuts sentences; it does not merge case variants.", "Correct. Lowercasing maps both to one form so counts combine.", "Stemming cuts suffixes, not capitals.", "TF-IDF reweights but still sees two different words."],
  },
  {
    q: "Why is splitting text on every full stop a poor sentence segmenter?",
    options: ["Full stops are rare", "Abbreviations, numbers, initials and URLs contain full stops that do not end sentences", "Computers cannot detect full stops", "Sentences never end with full stops"],
    answer: 1,
    why: ["They are common.", "Correct. 'Dr.', '$3.50', 'example.com' all break the naive rule.", "They can; the rule is wrong, not the detection.", "Most do."],
  },
  {
    q: "Which pair shows stemming's weakness that lemmatisation fixes?",
    options: ["'running' → 'run' vs 'run'", "'ran' stays 'ran' vs 'ran' → 'run'", "'cats' → 'cat' vs 'cats' → 'cat'", "'the' removed vs 'the' kept"],
    answer: 1,
    why: ["Both methods handle regular '-ing' forms.", "Correct. Irregular forms need a lexicon; rules cannot connect 'ran' to 'run'.", "Both handle regular plurals.", "Stop words are a separate step."],
    reason: true,
  },
  {
    q: "A sentiment model's accuracy drops after stop-word removal. The most likely cause?",
    options: ["The list was too short", "Negations like 'not' were removed, flipping meaning", "Stop words carry topic information", "Stemming was applied first"],
    answer: 1,
    why: ["A longer list would make it worse.", "Correct. 'not good' became 'good'. Keep negations for sentiment.", "They carry grammar and negation, not topic.", "Order of steps is not the issue here."],
  },
  {
    q: "In a four-document collection, 'the' appears in all four and 'off-gassing' in one. Their IDF values are:",
    options: ["Both high", "'the' = 0, 'off-gassing' = log(4) ≈ 1.39", "'the' high, 'off-gassing' zero", "Both zero"],
    answer: 1,
    why: ["A word in every document cannot be distinctive.", "Correct. IDF = log(N ÷ df): log(4/4) = 0 and log(4/1) ≈ 1.39.", "Backwards.", "Only the everywhere-word is zero."],
    reason: true,
  },
  {
    q: "What does a bag-of-words vector lose that an n-gram model partly recovers?",
    options: ["Word frequency", "Word order and short phrases", "Vocabulary size", "Document length"],
    answer: 1,
    why: ["Counts keep frequency.", "Correct. Bigrams like 'not good' and 'new york' restore a little order.", "Both use a vocabulary.", "Both lose length unless normalised."],
  },
  {
    q: "Character n-grams help search mainly because they…",
    options: ["Make the index smaller", "Match misspellings and unseen names through shared pieces", "Remove stop words automatically", "Replace the need for a vocabulary"],
    answer: 1,
    why: ["They make it larger.", "Correct. 'samsng' and 'samsung' share most trigrams; whole words share nothing.", "No.", "They still form a vocabulary of pieces."],
  },
  {
    q: "A production search system uses TF-IDF for candidates and an embedding model to re-rank them. Why not embeddings alone?",
    options: ["Embeddings are illegal for search", "TF-IDF is faster at scanning millions of documents and exact on codes; embeddings add meaning on the shortlist", "TF-IDF understands meaning better", "Embeddings cannot rank"],
    answer: 1,
    why: ["No.", "Correct. A hybrid uses each for what it does well: speed and exactness, then meaning.", "TF-IDF has no notion of meaning.", "They rank well; scanning everything is the cost."],
  },
];

export const M11_EXERCISES: Exercise[] = [
  {
    title: "Compute TF-IDF by hand",
    kind: "calculate",
    task: "Documents: D1 'cheap chair cheap', D2 'cheap table', D3 'wooden table'. Compute tf-idf for every word in D1 and D2 using tf = raw count and idf = ln(N ÷ df). Which word best identifies D1?",
    hints: ["N = 3. df(cheap) = 2, df(chair) = 1, df(table) = 2, df(wooden) = 1.", "ln(3/2) ≈ 0.405, ln(3/1) ≈ 1.099."],
    solution: "IDF: cheap = ln(1.5) ≈ 0.405; chair = ln(3) ≈ 1.099; table ≈ 0.405; wooden ≈ 1.099. D1: tf(cheap) = 2 → 0.811; tf(chair) = 1 → 1.099. D2: cheap → 0.405; table → 0.405. 'chair' best identifies D1 (1.099) even though 'cheap' appears twice, because 'cheap' is also in D2.",
  },
  {
    title: "Design a preprocessing pipeline for two tasks",
    kind: "think",
    task: "List the preprocessing steps you would apply, in order, for (a) a topic classifier over news articles and (b) a sentiment classifier over tweets. Say which steps differ and why.",
    hints: ["Does case matter? Punctuation? Negation? Emoji?", "Which model consumes the output: counts, or a transformer?"],
    solution: "(a) Topic: decode, strip markup/boilerplate, segment, tokenise, lowercase, remove stop words, lemmatise, add bigrams, TF-IDF. Case, punctuation and negation matter little for topic. (b) Sentiment: decode, normalise Unicode and user handles/URLs to placeholders, keep case (or an all-caps flag), keep punctuation and emoji, do NOT remove stop words (negation), tokenise, bigrams; if using a transformer, stop after light cleaning and let the model read raw text. The steps that differ are exactly the ones that destroy sentiment signals.",
  },
  {
    title: "Fix a sentence segmenter",
    kind: "code",
    task: "Extend the rule-based segmenter from the sentence-segmentation lesson so that it does not split inside 'e.g.' and 'i.e.', inside decimal numbers like '3.50', or after a single capital initial like 'J. K. Rowling'. Test it on 'J. K. Rowling, i.e. the author, earned 3.50 million. She wrote more.'",
    hints: ["An initial is a single uppercase letter before the full stop.", "A full stop between two digits is never a boundary."],
    solution: "Add to the skip conditions: `len(last) == 1 and last.isupper()` for initials (check the original token, not the lowercased one), membership of 'e.g' and 'i.e' in the abbreviation set (already there if you strip only the final dot), and a check that the character after the match is not a digit when the character before is a digit (decimals are already safe because '3.50' has no space after the dot). Expected output: ['J. K. Rowling, i.e. the author, earned 3.50 million.', 'She wrote more.'].",
  },
  {
    title: "Bigrams versus unigrams on a tiny sentiment set",
    kind: "code",
    task: "Build bag-of-words vectors with unigrams only and with unigrams plus bigrams for these labelled reviews: 'not good' (neg), 'good' (pos), 'not bad' (pos), 'bad' (neg). Explain why a linear classifier can separate the classes with bigrams but not with unigrams.",
    hints: ["Write out the four vectors for each feature set.", "Can any weights on 'not', 'good', 'bad' alone give the right sign for all four?"],
    solution: "Unigram vectors over [bad, good, not]: 'not good' = [0,1,1] neg; 'good' = [0,1,0] pos; 'not bad' = [1,0,1] pos; 'bad' = [1,0,0] neg. A linear model needs w_good > 0 (from 'good') but w_good + w_not < 0 (from 'not good'), so w_not < 0; and w_bad < 0 but w_bad + w_not > 0, so w_not > 0. Contradiction: not linearly separable. With bigrams, features 'not good' and 'not bad' get their own weights (negative and positive respectively) and the four examples separate easily.",
  },
];
