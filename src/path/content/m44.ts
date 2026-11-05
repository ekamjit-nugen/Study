import type { Exercise, LessonBody, Quiz } from "../types";

// Module 44: Punjabi language data engineering. One concept per lesson.
// Keys are lesson slugs: m44-<kebab of the concept title in map.ts>.

export const M44_BODIES: Record<string, LessonBody> = {
  "m44-punjabi-language-datasets": {
    simple: "Punjabi datasets exist but are small, scattered across two scripts, and mostly Gurmukhi; knowing what is out there is the first step before collecting your own.",
    concept:
      "A **dataset** for a language is any organised collection a model can learn from or be tested on: raw text, sentence pairs with translations, labelled examples, recorded speech with transcripts. For Punjabi the shelf is short but not empty. Monolingual Gurmukhi text comes from the Punjabi Wikipedia (tens of thousands of articles), news sites, and large Indic crawls assembled by research groups. Parallel Punjabi–English sentences exist in the millions from mined corpora such as Samanantar. Benchmarks such as FLORES-200 include Gurmukhi Punjabi (code pan_Guru) for translation, and Indic evaluation suites cover a few tasks. Speech datasets such as Common Voice have Punjabi recordings.\n\nShahmukhi is far thinner: a small Western Punjabi Wikipedia (code pnb), and text on Pakistani sites that is usually tagged as Urdu by language detectors. Romanised Punjabi has no curated datasets at all; it lives in chat logs and social comments.\n\nEvery dataset also has a licence, a collection method and a quality level. A mined parallel corpus contains misaligned pairs; a crawl contains Hindi mislabelled as Punjabi; a Wikipedia dump contains lists and tables. Inventory means knowing the size, the script, the licence and the faults.",
    why:
      "Teams either assume nothing exists and waste months, or assume a dataset is clean and train on junk. An inventory tells you what to download, what to measure against, what to clean, and what you must build yourself. For Punjabi, the inventory also shows the shape of the problem: Gurmukhi has a foundation, Shahmukhi needs separation from Urdu, and Romanised needs collection from scratch.",
    how: [
      "List candidate sources by type: monolingual text, parallel, labelled tasks, benchmarks, speech.",
      "For each, record script, size (documents, sentences, words), licence, collection method and known faults.",
      "Download samples and look at them: a hundred random lines reveal boilerplate, wrong languages and encoding damage.",
      "Decide the role of each: training text, fine-tuning examples, evaluation (never both training and evaluation).",
      "Record the gaps: tasks or scripts with nothing, which become your collection plan.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Type", "Gurmukhi examples", "Shahmukhi examples", "Romanised", "Typical faults"],
        rows: [
          ["monolingual text", "Punjabi Wikipedia (pa), news, Indic crawls (e.g. IndicCorp, Sangraha)", "pnb Wikipedia, Urdu-tagged crawls", "none curated", "boilerplate, Hindi mixed in, OCR errors"],
          ["parallel with English", "Samanantar, mined web pairs", "very little", "none", "misaligned pairs, machine-translated text"],
          ["labelled tasks", "sentiment, NER, classification in Indic suites", "almost none", "none", "small, domain-narrow"],
          ["benchmarks", "FLORES-200 (pan_Guru), Indic evaluation suites", "FLORES-200 (pnb_Arab) for Western Punjabi", "none", "few tasks, few examples"],
          ["speech", "Common Voice Punjabi and others", "little", "n/a", "accent and dialect imbalance"],
        ],
      },
      caption: "Names change as projects are released; the columns' shape (Gurmukhi thin, Shahmukhi thinner, Romanised absent) has been stable.",
    },
    everyday: {
      title: "Checking the cupboard before shopping",
      text: "Before cooking for twenty people you open every cupboard, note what is there, check the dates, and write a shopping list for the rest. You do not assume the rice is fine because the bag is big, and you do not buy more of what you already have. A dataset inventory is the same walk through the cupboards, with 'is this actually Punjabi?' as the sniff test.",
    },
    engineering: {
      title: "Starting a Punjabi translation project",
      text: "A team building Punjabi–English translation for legal notices begins with the inventory. They find a few million mined parallel sentences (useful but noisy: 8% are misaligned on inspection), the FLORES-200 Gurmukhi test set (useful as a benchmark, useless for legal vocabulary), and no legal-domain Punjabi at all. The plan writes itself: train on the mined corpus after filtering, benchmark on FLORES to compare models, and commission 3,000 legal sentence pairs translated by professionals as the real test set and fine-tuning data. Three weeks of inventory saved a quarter of blind training.",
    },
    code: {
      title: "Inventory a dataset: size, script, sample",
      lang: "py",
      src: `import re, random
from datasets import load_dataset

GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")
ARABIC = re.compile(r"[\\u0600-\\u06FF]")

ds = load_dataset("wikimedia/wikipedia", "20231101.pa", split="train")   # Punjabi Wikipedia dump
print("documents:", len(ds))

sample = random.sample(range(len(ds)), 500)
scripts = {"guru": 0, "arab": 0, "other": 0}
words = 0
for i in sample:
    text = ds[i]["text"]
    words += len(text.split())
    key = "guru" if GURMUKHI.search(text) else "arab" if ARABIC.search(text) else "other"
    scripts[key] += 1

print("script mix in sample:", scripts)
print("estimated words:", words * len(ds) // 500)
print(ds[sample[0]]["text"][:300])`,
      lines: [
        { code: "ds = load_dataset(\"wikimedia/wikipedia\", \"20231101.pa\", split=\"train\")   # Punjabi Wikipedia dump", say: "One line fetches a dump. The language code pa is Gurmukhi Punjabi; pnb is Western Punjabi in Shahmukhi." },
        { code: "sample = random.sample(range(len(ds)), 500)", say: "Never inspect the first rows; sample at random to see the real mix." },
        { code: "key = \"guru\" if GURMUKHI.search(text) else \"arab\" if ARABIC.search(text) else \"other\"", say: "A script check per document. 'other' documents in a Punjabi dump are usually lists, numbers or mislabelled text." },
        { code: "print(ds[sample[0]][\"text\"][:300])", say: "Read a few. The inventory is not complete until a person has looked at the text." },
      ],
      note: "Repeat for every source. Record the numbers in a table with the licence and the faults you saw.",
    },
    useIt: "Start every Punjabi project with a written inventory: sources, scripts, sizes, licences, faults, and the role each will play. Use public benchmarks to compare models and your own commissioned sets to measure your domain. Expect to build the Shahmukhi and Romanised parts yourself.",
    takeaways: ["Punjabi has a usable Gurmukhi foundation, a thin Shahmukhi one, and no Romanised datasets.", "Inventory size, script, licence, collection method and faults; sample and read.", "Never use the same data for training and evaluation.", "Gaps in the inventory are the collection plan."],
    terms: [["monolingual corpus", "text in one language with no labels or translations"], ["language code", "pa or pan_Guru for Gurmukhi Punjabi; pnb or pnb_Arab for Western Punjabi in Shahmukhi"], ["mined parallel corpus", "translation pairs found automatically on the web, useful but noisy"]],
    reflect: { q: "A crawl labelled 'Punjabi' turns out to be 15% Hindi. Why does that happen and what does it do to a model?", a: "Hindi and Punjabi share vocabulary and Devanagari-written Punjabi exists, so language detectors confuse them; some sites also mix both. A model trained on it drifts toward Hindi forms and grammar in its Punjabi output. Filter by script and by a stricter language identifier before training." },
  },

  "m44-gurmukhi-script": {
    simple: "Gurmukhi is the script of Punjabi in India: consonant letters carry an inherent vowel, vowel signs attach around them, and a few marks (bindi, tipi, addak, nukta) change sound; a model has to handle all of these as separate code points.",
    concept:
      "**Gurmukhi** (ਗੁਰਮੁਖੀ) is an abugida: each consonant letter carries a built-in 'a' sound, and other vowels are written as signs attached above, below, before or after the letter. It has 35 basic letters, with six more formed by adding a dot called the nukta (਼) for sounds borrowed from Persian and English (ਸ਼ sh, ਜ਼ z, ਫ਼ f, ਖ਼ kh, ਗ਼ gh, ਲ਼ ḷ). Three letters are vowel carriers (ੳ, ਅ, ੲ) used when a vowel starts a word or follows another vowel.\n\nNine vowel signs (ਾ ਿ ੀ ੁ ੂ ੇ ੈ ੋ ੌ) combine with consonants: ਕ + ਾ = ਕਾ (kaa), ਕ + ਿ = ਕਿ (ki). The sign ਿ is drawn to the left of the consonant but stored after it in Unicode, which matters for every string operation. Three more marks: bindi (ਂ) and tipi (ੰ) nasalise, addak (ੱ) doubles the following consonant. Subjoined forms (੍ਹ, ੍ਰ, ੍ਵ) attach a second consonant below: ਪ੍ਰ (pr) in ਪ੍ਰੀਤ.\n\nIn Unicode, Gurmukhi occupies U+0A00 to U+0A7F. A visual syllable such as ਕਿੱ is three code points: letter, vowel sign, addak. Counting, slicing and comparing strings by code point can split a syllable in half.",
    why:
      "Tokenisers, normalisers, search and display all operate on code points, and Gurmukhi's code points do not line up with what readers see. A program that treats ਿ as 'the next character' will put it in the wrong place; a tokeniser that splits between a consonant and its vowel sign produces meaningless pieces; a search that ignores the nukta will confuse ਸ (s) and ਸ਼ (sh). Knowing the script's structure is what lets you write correct code for it.",
    how: [
      "Identify letters: consonants U+0A15–U+0A39, vowel carriers and independent vowels U+0A05–U+0A14, nukta letters U+0A33, U+0A36, U+0A59–U+0A5E.",
      "Identify marks: vowel signs U+0A3E–U+0A4C, virama U+0A4D (used for subjoined letters), nukta U+0A3C, bindi U+0A02, tipi U+0A70, addak U+0A71.",
      "Group code points into grapheme clusters (a base letter plus its attached marks) before counting or slicing.",
      "Normalise nukta letters: the precomposed ਸ਼ (U+0A36) and the pair ਸ + ਼ are equivalent; Unicode normalisation (NFC) resolves them to the pair, because the precomposed forms are composition exclusions.",
      "Keep marks with their base in every operation: tokenisation, truncation, highlighting, transliteration.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Written", "Code points", "Reading", "Note"],
        rows: [
          ["ਕਾ", "ਕ U+0A15, ਾ U+0A3E", "kaa", "sign after the letter, drawn after"],
          ["ਕਿ", "ਕ U+0A15, ਿ U+0A3F", "ki", "sign stored after, drawn before"],
          ["ਕਿੱਥੇ", "ਕ ਿ ੱ ਥ ੇ", "kitthe (where)", "addak doubles the ਥ; five code points, two syllables"],
          ["ਪ੍ਰੀਤ", "ਪ ੍ ਰ ੀ ਤ", "preet (love)", "virama joins ਰ below ਪ"],
          ["ਸ਼ vs ਸ", "ਸ ਼ vs ਸ", "sh vs s", "the nukta dot changes the sound; NFC keeps the two-code-point form"],
        ],
      },
      caption: "What you see and what is stored differ. Every string operation must respect the clusters.",
    },
    everyday: {
      title: "A word is a word, not a row of boxes",
      text: "Cut the word ਕਿੱਥੇ after the first two code points and you get ਕਿ (ki) and ੱਥੇ, which starts with a doubling mark that doubles nothing: nonsense on screen. Readers never think of a vowel sign as separate from its letter, any more than an English reader thinks of the dot on an i as a separate character. Software has to be taught to see the word the way the reader does.",
    },
    engineering: {
      title: "The search box that could not find ਸ਼ਹਿਰ",
      text: "A city-services app's search found ਸਹਿਰ (a misspelling) but not ਸ਼ਹਿਰ (city), because the index had stored the word from one source as the precomposed letter ਸ਼ (U+0A36) and the query arrived as ਸ + nukta from a phone keyboard. The strings were different code points for the same letter. The fix was Unicode NFC normalisation on both index and query, which converts the precomposed form to the two-code-point form for Gurmukhi. Search recall for nukta words rose from 40% to 100% overnight, and the same normalisation went into the tokeniser input.",
    },
    code: {
      title: "See the code points, then group them into clusters",
      lang: "py",
      src: `import unicodedata
import regex   # the 'regex' package supports \\X grapheme clusters

word = "ਕਿੱਥੇ"
for ch in word:
    print(f"U+{ord(ch):04X}", unicodedata.name(ch, "?"))

clusters = regex.findall(r"\\X", word)
print(len(word), "code points;", len(clusters), "grapheme clusters:", clusters)

sh_precomposed = "\\u0A36"
sh_pair = "\\u0A38\\u0A3C"
print(sh_precomposed == sh_pair, unicodedata.normalize("NFC", sh_precomposed) == unicodedata.normalize("NFC", sh_pair))`,
      lines: [
        { code: "print(f\"U+{ord(ch):04X}\", unicodedata.name(ch, \"?\"))", say: "Each code point with its Unicode name: GURMUKHI LETTER KA, GURMUKHI VOWEL SIGN I, GURMUKHI ADDAK, and so on." },
        { code: "clusters = regex.findall(r\"\\X\", word)", say: "\\X matches one grapheme cluster: a base letter with its marks. This is the unit readers see." },
        { code: "print(len(word), \"code points;\", len(clusters), \"grapheme clusters:\", clusters)", say: "Five code points, two clusters. Count and slice by clusters, never by code points." },
        { code: "print(sh_precomposed == sh_pair, unicodedata.normalize(\"NFC\", sh_precomposed) == unicodedata.normalize(\"NFC\", sh_pair))", say: "Different code points, same letter; equal only after normalisation." },
      ],
      output: "U+0A15 GURMUKHI LETTER KA\nU+0A3F GURMUKHI VOWEL SIGN I\nU+0A71 GURMUKHI ADDAK\nU+0A25 GURMUKHI LETTER THA\nU+0A47 GURMUKHI VOWEL SIGN EE\n5 code points; 2 grapheme clusters: ['ਕਿੱ', 'ਥੇ']\nFalse True",
    },
    useIt: "Whenever code touches Gurmukhi text: normalise to NFC first, operate on grapheme clusters for counting, slicing and highlighting, keep vowel signs and marks with their base letter in tokenisation and truncation, and remember that ਿ is stored after the letter it appears before. These rules prevent most Gurmukhi bugs in search, display and training data.",
    takeaways: ["Gurmukhi is an abugida: consonants carry 'a'; vowel signs and marks attach as separate code points.", "What is seen (a syllable) is several code points; use grapheme clusters.", "ਿ is drawn before but stored after its consonant; nukta letters have two encodings; NFC resolves them.", "Marks must stay with their base in every operation."],
    terms: [["abugida", "a script where consonants carry an inherent vowel and other vowels are marks"], ["grapheme cluster", "a base character plus its attached marks: the unit a reader sees"], ["nukta", "the dot ਼ that turns ਸ into ਸ਼ (sh) and marks other borrowed sounds"], ["virama", "the mark ੍ that joins a subjoined consonant below another"]],
    reflect: { q: "A truncation function cuts text at 100 code points. What can go wrong for Gurmukhi and what is the fix?", a: "It can cut between a consonant and its vowel sign or addak, leaving a dangling mark that renders as a box or attaches to the next letter. Cut at grapheme-cluster boundaries instead, and ideally at word boundaries." },
  },

  "m44-shahmukhi-script": {
    simple: "Shahmukhi writes Punjabi in a modified Perso-Arabic script, right to left, usually without short vowels; it shares its letters with Urdu, which makes detection, normalisation and data separation the main engineering problems.",
    concept:
      "**Shahmukhi** (شاہ مکھی) is the script of Punjabi in Pakistan, where most Punjabi speakers live. It is an abjad: letters mostly represent consonants and long vowels, and short vowels are usually left out, to be inferred by the reader. It is written right to left, letters change shape depending on their position in a word, and it is normally printed in the Nastaliq style shared with Urdu.\n\nShahmukhi uses the Urdu letter set plus a few additions for Punjabi sounds: ݨ (U+0768) for the retroflex n (Gurmukhi ਣ) and ࣇ (U+08C7) for the retroflex l (ਲ਼). Because the rest of the alphabet is Urdu's, a Shahmukhi text looks like Urdu to a language detector and to a model; the difference is in the words and grammar, not the letters.\n\nTwo Unicode facts dominate the engineering. First, Arabic-script letters have variants: the Arabic yeh ي (U+064A) and the Farsi/Urdu yeh ی (U+06CC), the Arabic kaf ك (U+0643) and the Urdu kaf ک (U+06A9), and heh forms ه / ہ / ھ. Text typed on different keyboards mixes them, so equal words compare unequal. Second, zero-width joiners and non-joiners (U+200D, U+200C) are inserted by keyboards to control letter joining and must be normalised.",
    why:
      "If you ignore Shahmukhi, you ignore the larger half of Punjabi speakers. If you treat it as Urdu, your model reads Punjabi words as Urdu mistakes and answers in Urdu. If you ignore its letter variants, your search, deduplication and tokenisation split the same word into several. Handling Shahmukhi properly means: separate it from Urdu in data, normalise its letter forms, and evaluate it as its own script.",
    how: [
      "Detect the Arabic script range (U+0600–U+06FF plus supplements) and then distinguish Punjabi from Urdu by vocabulary and function words (lesson 46.2), not by letters.",
      "Normalise letter variants to the Urdu/Shahmukhi forms: ي→ی, ك→ک, ه→ہ where appropriate, ة→ہ, and remove stray ZWJ/ZWNJ and tatweel (ـ).",
      "Keep right-to-left handling to the display layer; store text in logical order as Unicode expects.",
      "Accept that short vowels are absent: transliteration to Gurmukhi must restore them with a dictionary (lesson 43.9).",
      "Build or source Shahmukhi evaluation data separately; Gurmukhi scores say nothing about it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Gurmukhi", "Shahmukhi", "Romanised", "English", "Shahmukhi note"],
        rows: [
          ["ਪੰਜਾਬੀ", "پنجابی", "Punjabi", "Punjabi", "short 'a' in پن is not written"],
          ["ਪਾਣੀ", "پاݨی", "paani", "water", "ݨ is a Shahmukhi-only letter for ਣ"],
          ["ਮੈਂ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ", "میں گھر جا رہا ہاں", "main ghar ja riha haan", "I am going home", "ہاں uses the Urdu heh ہ (U+06C1)"],
          ["ਕਿੱਥੇ", "کتھے", "kithe", "where", "the doubled t (addak) is not marked"],
          ["ਸ਼ੁਕਰੀਆ", "شکریہ", "shukriya", "thank you", "the word itself is shared with Urdu"],
        ],
      },
      caption: "The same sentences in both scripts. Shahmukhi drops information (short vowels, doubling) that Gurmukhi writes.",
    },
    everyday: {
      title: "Handwriting that looks like someone else's",
      text: "Two cousins have near-identical handwriting; one writes letters in Punjabi, the other in Urdu. A stranger sorting the letters by handwriting alone puts them in one pile. Only by reading the words ('ਕਿੱਥੇ' is کتھے in Punjabi, کہاں in Urdu) can you sort them. Language detectors that look only at the script are the stranger; Shahmukhi needs a reader who knows the vocabulary.",
    },
    engineering: {
      title: "Separating Shahmukhi Punjabi from Urdu in a crawl",
      text: "A team wants Shahmukhi training text. Their crawl of Pakistani sites yields 40 million Arabic-script sentences, almost all tagged Urdu by the standard detector. They build a small classifier on function words and spellings that differ (Punjabi اے, وچ, نوں, کتھے, ہیگا versus Urdu ہے, میں, کو, کہاں, ہے), trained on 5,000 hand-checked sentences, and find 2.1 million Punjabi sentences: a corpus that did not exist as far as the detector was concerned. Before training they normalise yeh, kaf and heh variants, which merged 9% of 'distinct' words into their correct forms.",
    },
    code: {
      title: "Normalise Shahmukhi letter variants",
      lang: "py",
      src: `import re
import unicodedata

VARIANTS = {
    "\\u064A": "\\u06CC",   # Arabic yeh  -> Farsi/Urdu yeh  ی
    "\\u0643": "\\u06A9",   # Arabic kaf  -> Urdu kaf        ک
    "\\u0629": "\\u06C1",   # teh marbuta -> heh goal        ہ
    "\\u0647": "\\u06C1",   # Arabic heh  -> heh goal        ہ (word-final, usually)
}
INVISIBLES = re.compile(r"[\\u200B\\u200C\\u200D\\u0640]")   # zero-width chars and tatweel

def normalise_shahmukhi(text):
    text = unicodedata.normalize("NFC", text)
    text = INVISIBLES.sub("", text)
    return "".join(VARIANTS.get(ch, ch) for ch in text)

a = "كتاب"          # typed with Arabic kaf
b = "کتاب"          # typed with Urdu kaf
print(a == b, normalise_shahmukhi(a) == normalise_shahmukhi(b))`,
      lines: [
        { code: "\"\\u064A\": \"\\u06CC\",   # Arabic yeh  -> Farsi/Urdu yeh  ی", say: "The two yehs look the same in most fonts and are different code points. Shahmukhi and Urdu use ی." },
        { code: "INVISIBLES = re.compile(r\"[\\u200B\\u200C\\u200D\\u0640]\")   # zero-width chars and tatweel", say: "Keyboards insert joiners and the stretching mark tatweel; they change nothing readable and break equality." },
        { code: "return \"\".join(VARIANTS.get(ch, ch) for ch in text)", say: "Map each variant to the canonical form; everything else passes through." },
        { code: "print(a == b, normalise_shahmukhi(a) == normalise_shahmukhi(b))", say: "'book' typed two ways: unequal before, equal after." },
      ],
      output: "False True",
      note: "The heh mapping is a simplification; some words need ھ (do-chashmi heh) kept for aspiration. A real normaliser uses a word list for the exceptions.",
    },
    useIt: "Treat Shahmukhi as its own script and language variant: detect it by vocabulary, not letters; normalise yeh, kaf, heh and invisible characters before anything else; store text in logical order and leave direction to display; transliterate to Gurmukhi with vowel restoration when you want to reuse Gurmukhi resources; evaluate it separately.",
    takeaways: ["Shahmukhi is Punjabi in a Perso-Arabic abjad: right to left, short vowels usually omitted, letters shared with Urdu plus ݨ and ࣇ.", "Detection must use vocabulary; the script alone says 'Urdu'.", "Normalise letter variants (ي/ی, ك/ک, heh forms) and zero-width characters.", "Shahmukhi data must be separated from Urdu and evaluated on its own."],
    terms: [["abjad", "a script that writes consonants and long vowels, leaving short vowels to the reader"], ["Nastaliq", "the calligraphic style in which Urdu and Shahmukhi are usually printed"], ["zero-width joiner / non-joiner", "invisible characters that control whether letters connect"]],
    reflect: { q: "Why does a Gurmukhi-trained model's good score tell you almost nothing about Shahmukhi?", a: "The two scripts share no code points, so the model's Gurmukhi token knowledge does not transfer at the token level; Shahmukhi is read through Urdu-trained tokens, with different ambiguities (missing vowels) and a constant pull toward Urdu. Only a Shahmukhi test set measures it." },
  },

  "m44-romanised-punjabi": {
    simple: "Romanised Punjabi is Punjabi typed in Latin letters with no standard spelling; it is the most common form in chat and the hardest for models, so it needs its own data and handling.",
    concept:
      "**Romanised Punjabi** is what most Punjabi speakers type on phones: 'ki haal hai', 'kal milde aan', 'mainu nahi pata'. There is no agreed spelling. The same word is spelled by sound, by habit and by phone autocorrect: ਕਿੱਥੇ appears as kithe, kithay, kitthe, kithhe; ਹਾਂ as haan, han, haa; ਵਧੀਆ as vadhia, vadiya, wadhia, vadhiya. Vowel length, aspiration and retroflex sounds are inconsistently marked or dropped.\n\nTo a model, Romanised Punjabi looks like misspelled English or Hindi: the tokeniser cuts it into English subwords, and the model's English knowledge offers no help with their meanings. Language detectors tag it as English, Hindi, Indonesian or 'unknown'. It also overlaps with Romanised Hindi and Urdu, which share many words.\n\nHandling it well needs three things: data collected from where it actually occurs (chat, comments, support messages), a tolerant notion of spelling (variant maps and fuzzy matching), and often a transliteration step to Gurmukhi so better-resourced tools can take over.",
    why:
      "Romanised text is where Punjabi users are. Support inboxes, app reviews and social media are mostly Romanised; a product that only handles Gurmukhi misses most of its real input. It is also the form with the least data and the worst model support, so it is where a Punjabi project's effort has the biggest effect, and where ignoring the problem hides it in 'English' error buckets.",
    how: [
      "Collect Romanised text from real channels with consent and anonymisation; synthetic transliteration from Gurmukhi does not reproduce real spelling habits.",
      "Build a variant map: for frequent words, list observed spellings and a canonical form, from logs and native speakers.",
      "Detect Romanised Punjabi by function words (hai, nahi, tusi, mainu, kithe, kiven, sanu) rather than by script.",
      "Normalise lightly (lowercase, collapse repeated letters like 'haaan', map known variants), then either process directly with a model trained on Romanised data or transliterate to Gurmukhi.",
      "Evaluate on a Romanised test set drawn from real messages, separately from Gurmukhi.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Gurmukhi", "Observed Romanised spellings (from chat)", "Canonical choice", "Why it varies"],
        rows: [
          ["ਕਿੱਥੇ", "kithe, kithay, kitthe, kithhe, kithey", "kithe", "addak and vowel length unmarked"],
          ["ਹਾਂ ਜੀ", "haan ji, han ji, haanji, hanji", "haan ji", "long vowel and nasal; spacing"],
          ["ਵਧੀਆ", "vadhia, vadiya, wadhia, badhiya", "vadhia", "v/w, aspiration, final vowel"],
          ["ਤੁਸੀਂ", "tusi, tussi, tusin, tusee", "tusi", "nasal bindi dropped"],
          ["ਮੈਨੂੰ", "mainu, mainnu, menu, meinu", "mainu", "vowel quality; 'menu' collides with English"],
        ],
      },
      caption: "Five words, twenty-two spellings. The canonical column is a project decision, not a standard.",
    },
    everyday: {
      title: "Reading a friend's texts",
      text: "A friend texts 'kl mlde aa, 7 bje' and you read it instantly as 'kal milde aan, 7 baje' (meeting tomorrow at 7). You fill in vowels, fix the spacing and guess from context. You can do it because you know the language and the friend. A model that has only seen English and tidy Gurmukhi has neither; it sees 'kl' and 'mlde' as typos. Romanised Punjabi is readable only to someone who already knows it, which is why it needs its own data.",
    },
    engineering: {
      title: "The app reviews nobody could read",
      text: "A fintech app's review analysis tagged 38% of Indian reviews as 'English, unclear'. A sample showed they were Romanised Punjabi and Hindi: 'app bahut slow hai yaar', 'paise kat gaye refund nahi aaya'. The team built a 4,000-review labelled set (language, sentiment, topic) with bilingual annotators, trained a word-level language tagger, and routed Punjabi reviews through transliteration to Gurmukhi before the existing sentiment model. Sentiment accuracy on those reviews went from a coin toss to 84%, and 'unclear' fell to 6%. The reviews had been readable all along, just not to the pipeline.",
    },
    maths: {
      formula: "spelling entropy of a word = −Σ p(variant) · log₂ p(variant)   (bits);  higher means more spread over spellings",
      meaning: "Count how often each spelling of a word occurs in your logs and turn the spread into one number. Words with high entropy need variant maps or fuzzy matching most.",
      worked: [
        "ਕਿੱਥੇ in 1,000 messages: kithe 520, kithay 230, kitthe 150, kithhe 100. Probabilities 0.52, 0.23, 0.15, 0.10.",
        "Entropy = −(0.52·log₂0.52 + 0.23·log₂0.23 + 0.15·log₂0.15 + 0.10·log₂0.10) ≈ −(−0.491 − 0.488 − 0.411 − 0.332) ≈ 1.72 bits.",
        "ਹਾਂ: haan 900, han 100. Entropy ≈ −(0.9·log₂0.9 + 0.1·log₂0.1) ≈ 0.47 bits: nearly standard.",
        "Sort words by entropy; the top hundred get hand-built variant maps, the rest rely on fuzzy matching.",
      ],
    },
    code: {
      title: "Light normalisation of Romanised Punjabi",
      lang: "py",
      src: `import re

VARIANTS = {
    "kithay": "kithe", "kitthe": "kithe", "kithhe": "kithe", "kithey": "kithe",
    "han": "haan", "hanji": "haan ji", "haanji": "haan ji",
    "vadiya": "vadhia", "wadhia": "vadhia", "badhiya": "vadhia",
    "tussi": "tusi", "tusin": "tusi", "mainnu": "mainu", "meinu": "mainu",
}
PUNJABI_HINTS = {"hai", "nahi", "tusi", "mainu", "sanu", "kithe", "kiven", "ki", "haan", "ji", "aa", "ne", "nu", "da", "di", "de"}

def normalise_roman(text):
    text = text.lower()
    text = re.sub(r"(.)\\1{2,}", r"\\1\\1", text)          # haaaan -> haan
    words = [VARIANTS.get(w, w) for w in text.split()]
    return " ".join(words)

def looks_punjabi(text):
    words = set(normalise_roman(text).split())
    return len(words & PUNJABI_HINTS) >= 2

msg = "Kithay ho tussi? Haaaan ji kal milde aan"
print(normalise_roman(msg))
print(looks_punjabi(msg), looks_punjabi("where are you, see you tomorrow"))`,
      lines: [
        { code: "text = re.sub(r\"(.)\\1{2,}\", r\"\\1\\1\", text)          # haaaan -> haan", say: "Collapse three or more repeated letters to two; emphasis spelling is common in chat." },
        { code: "words = [VARIANTS.get(w, w) for w in text.split()]", say: "Known variants map to the canonical spelling; unknown words pass through unchanged." },
        { code: "return len(words & PUNJABI_HINTS) >= 2", say: "Two Punjabi function words in a message is a strong signal; English and Hindi share few of them." },
        { code: "print(looks_punjabi(msg), looks_punjabi(\"where are you, see you tomorrow\"))", say: "The same meaning in Romanised Punjabi and English: only the first trips the detector." },
      ],
      output: "kithe ho tusi? haan ji kal milde aan\nTrue False",
      note: "A production system replaces the hand map with one mined from logs and a fuzzy matcher (lesson 44.7), and adds a learned transliterator to Gurmukhi.",
    },
    useIt: "Expect Romanised input as the default in chat and reviews. Collect it from real channels, mine variant maps from logs, detect by function words, normalise lightly, and either train on Romanised data or transliterate to Gurmukhi before models that know Gurmukhi. Always report Romanised accuracy as its own number.",
    takeaways: ["Romanised Punjabi has no standard spelling and is the most common form in chat.", "Models and detectors read it as broken English or Hindi.", "Collect real Romanised data; synthetic transliteration misses real habits.", "Variant maps, function-word detection and transliteration to Gurmukhi are the working tools."],
    terms: [["Romanised Punjabi", "Punjabi written in Latin letters by sound, with no standard spelling"], ["variant map", "a table from observed spellings to a chosen canonical form"], ["function word", "a short grammatical word (hai, nu, di) that identifies a language more reliably than content words"]],
    reflect: { q: "Why not generate Romanised training data by transliterating the Gurmukhi corpus with rules?", a: "Rule transliteration produces one consistent spelling per word, while real users produce many inconsistent ones; a model trained on tidy synthetic text still fails on 'kithay', 'tussi' and 'menu'. Synthetic data can supplement, but the spelling variety must come from real messages." },
  },

  "m44-unicode-and-text-encoding": {
    simple: "Unicode gives every character a number, UTF-8 stores those numbers as bytes, and normalisation makes equivalent sequences compare equal; Punjabi text breaks whenever any of the three is mishandled.",
    concept:
      "**Unicode** assigns every character in every script a code point: ਕ is U+0A15, ک is U+06A9, k is U+006B. **UTF-8** is the usual way to store code points as bytes: ASCII letters take one byte, Gurmukhi and Arabic-script letters take two or three. So ਪਾਣੀ is four code points and twelve bytes, while 'paani' is five of each. Byte-level tokenisers see those twelve bytes, which is why Gurmukhi is expensive for them.\n\nUnicode also allows the same visible text to be written as different code-point sequences: ਸ਼ as one code point or as ਸ plus a nukta; a Shahmukhi word with the Arabic or the Urdu kaf. **Normalisation** (the NFC and NFD forms) converts equivalent sequences to a standard one so that comparison, search and deduplication work. For Gurmukhi, NFC produces the decomposed nukta form (base letter plus ਼), because the precomposed letters are excluded from composition.\n\nThe last layer is the grapheme cluster: the unit a reader sees (ਕਿੱ), which may be several code points. Length, slicing and cursor movement should use clusters.",
    why:
      "Encoding errors are silent. Text that was saved as Latin-1 and read as UTF-8 becomes mojibake (à¨ªà¨¾); a database column with the wrong collation sorts Gurmukhi randomly; two spellings of the same word fail to deduplicate; a tokeniser trained on unnormalised text learns two tokens for one letter. Every Punjabi pipeline must settle encoding and normalisation at its entrance, once, and the rest of the system can forget about it.",
    how: [
      "Read and write all text as UTF-8 explicitly; never rely on a platform default.",
      "Normalise to NFC at every entry point: files, API requests, user input, scraped pages.",
      "Strip or normalise invisible characters (zero-width joiners, byte-order marks, soft hyphens) unless they are meaningful.",
      "Count and slice by grapheme clusters; store in logical order; leave right-to-left rendering to the display layer.",
      "Detect mojibake and double-encoding early with a sanity check: Gurmukhi text should contain code points in U+0A00–U+0A7F, not Latin-1 symbols.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Code points", "UTF-8 bytes", "Note"],
        rows: [
          ["k", "1 (U+006B)", "1", "ASCII"],
          ["ਕ", "1 (U+0A15)", "3 (E0 A8 95)", "three bytes per Gurmukhi letter"],
          ["ਪਾਣੀ", "4", "12", "byte-level tokenisers see 12 units"],
          ["ک", "1 (U+06A9)", "2 (DA A9)", "two bytes per Arabic-script letter"],
          ["ਸ਼ (one code point) vs ਸ਼ (two)", "1 vs 2", "3 vs 6", "equal only after NFC"],
          ["à¨ªà¨¾à¨£à©€", "8 Latin-1 symbols", "16", "mojibake: UTF-8 bytes of ਪਾਣੀ read as Latin-1"],
        ],
      },
      caption: "The same word costs different amounts in bytes depending on script, and looks like garbage if the encoding is wrong.",
    },
    everyday: {
      title: "The name that arrived as symbols",
      text: "You have seen it: an email greeting 'Dear à¤°à¤¾à¤œ' or a receipt with 'â€™' where an apostrophe should be. That is text written in one encoding and read in another. For Punjabi the stakes are higher: an entire invoice, a form, a court notice can become unreadable. The characters were fine; the bytes were interpreted with the wrong rulebook.",
    },
    engineering: {
      title: "The duplicate articles that would not merge",
      text: "A news archive had 12,000 'unique' Gurmukhi headlines that reduced to 9,100 after normalisation: the rest were duplicates written with precomposed nukta letters, stray zero-width joiners from a CMS plugin, and a batch with a byte-order mark at the start of every line. One normalisation function at the ingestion point (UTF-8 decode, NFC, strip invisibles) removed 24% phantom duplicates, fixed search, and shrank the tokeniser's vocabulary of junk pieces. The lesson the team wrote down: normalise at the door, never downstream.",
    },
    maths: {
      formula: "UTF-8 size: U+0000–U+007F → 1 byte; U+0080–U+07FF → 2 bytes; U+0800–U+FFFF → 3 bytes; above → 4 bytes",
      meaning: "The code point's range decides how many bytes it takes. Gurmukhi (U+0A00–U+0A7F) is in the three-byte range; Arabic script (U+0600–U+06FF) in the two-byte range; Latin letters one byte.",
      worked: [
        "ਪਾਣੀ: 4 code points, all in U+0A00–U+0A7F → 4 × 3 = 12 bytes.",
        "پاݨی: 4 code points in U+0600–U+077F → 4 × 2 = 8 bytes.",
        "'paani': 5 ASCII code points → 5 bytes.",
        "A 100-word Gurmukhi paragraph averaging 5 letters per word ≈ 500 code points ≈ 1,500 bytes, versus ≈ 600 bytes for comparable English. A byte-level tokeniser starts from 2.5× more units before merging.",
      ],
    },
    code: {
      title: "Decode safely, normalise, detect mojibake",
      lang: "py",
      src: `import unicodedata

def read_text(path):
    with open(path, "rb") as f:
        raw = f.read()
    if raw.startswith(b"\\xef\\xbb\\xbf"):
        raw = raw[3:]                                   # drop a UTF-8 byte-order mark
    text = raw.decode("utf-8", errors="strict")        # fail loudly on bad bytes
    text = unicodedata.normalize("NFC", text)
    return text.replace("\\u200b", "").replace("\\u00ad", "")

def looks_like_mojibake(text):
    return "à¨" in text or "Ã" in text or "â€" in text

word = "ਪਾਣੀ"
print(len(word), "code points,", len(word.encode("utf-8")), "bytes")
broken = word.encode("utf-8").decode("latin-1")
print(broken, looks_like_mojibake(broken))
print(broken.encode("latin-1").decode("utf-8") == word)`,
      lines: [
        { code: "if raw.startswith(b\"\\xef\\xbb\\xbf\"):", say: "A byte-order mark at the start of a file is invisible and breaks the first word; strip it." },
        { code: "text = raw.decode(\"utf-8\", errors=\"strict\")        # fail loudly on bad bytes", say: "Strict decoding surfaces encoding problems at ingestion instead of hiding them as replacement characters." },
        { code: "text = unicodedata.normalize(\"NFC\", text)", say: "Equivalent sequences become one sequence. Do this once, at the door." },
        { code: "broken = word.encode(\"utf-8\").decode(\"latin-1\")", say: "How mojibake happens: correct UTF-8 bytes read with the wrong decoder." },
        { code: "print(broken.encode(\"latin-1\").decode(\"utf-8\") == word)", say: "And how it is undone, if you catch it before anything else mangles it." },
      ],
      output: "4 code points, 12 bytes\nà¨ªà¨¾à¨£à©€ True\nTrue",
    },
    useIt: "Set the encoding rules for the whole pipeline at the ingestion layer: UTF-8 strict, NFC, invisibles stripped, grapheme-aware lengths. Add a mojibake check to data validation. Keep these rules identical for training data, retrieval indexes and live user input, or the model will see three versions of every word.",
    takeaways: ["Unicode numbers characters; UTF-8 stores them as 1–4 bytes; Gurmukhi letters are 3 bytes each.", "Equivalent sequences must be normalised (NFC) before comparing, searching or training.", "Grapheme clusters are the unit for counting and slicing.", "Normalise once at the door and fail loudly on bad bytes."],
    terms: [["code point", "the number Unicode assigns to a character"], ["UTF-8", "the byte encoding that stores code points in one to four bytes"], ["NFC", "Unicode normalisation form C: a standard composition for equivalent sequences"], ["mojibake", "garbled text from reading bytes with the wrong encoding"]],
    reflect: { q: "NFC is described as 'composed', yet for Gurmukhi nukta letters it produces the two-code-point form. Why is that still correct behaviour?", a: "Unicode lists the precomposed Gurmukhi nukta letters as composition exclusions, so NFC deliberately leaves them decomposed. Both NFC and NFD therefore give the same two-code-point form, which is exactly what you want: one canonical sequence to compare against." },
  },

  "m44-punjabi-text-normalisation": {
    simple: "Normalisation makes every way of writing the same Punjabi text identical before anything else sees it: encoding, script variants, mark ordering, punctuation, digits and whitespace.",
    concept:
      "**Text normalisation** is a fixed sequence of transformations applied to all text at the entrance of a pipeline, so that two inputs that mean the same thing become byte-identical. For Punjabi the sequence has script-specific steps on top of the generic ones.\n\nGeneric: UTF-8 decoding, Unicode NFC, removal of zero-width and control characters, whitespace collapsing, and consistent punctuation (the Gurmukhi full stop ਦੰਡੀ । versus the Latin full stop; the Arabic question mark ؟ versus ?).\n\nGurmukhi: nukta letters to their canonical form (NFC does this), fixing vowel-sign ordering errors from keyboards (a sihari ਿ typed before its consonant), mapping Gurmukhi digits (੦–੯) and Devanagari look-alikes to the chosen digit set, and removing stray viramas.\n\nShahmukhi: letter-variant mapping (yeh, kaf, heh forms), removal of tatweel and joiners, and Arabic-Indic digits (۰–۹) to the chosen set.\n\nRomanised: lowercasing, collapsing repeated letters, variant maps. The one rule that matters more than any step: apply the same normaliser to training data, indexes and live input.",
    why:
      "Without normalisation, the same word exists in several forms, so tokenisers learn junk pieces, search misses, deduplication fails, and evaluation compares outputs against references that differ only in invisible ways. Normalising once at the entrance removes a whole class of bugs that are otherwise rediscovered in every component.",
    how: [
      "Decode as UTF-8 and apply NFC.",
      "Remove zero-width characters, byte-order marks, soft hyphens and tatweel.",
      "Apply script-specific maps: Shahmukhi letter variants; Gurmukhi vowel-sign reordering; digit sets; punctuation equivalents.",
      "Collapse whitespace and trim; decide once whether ਦੰਡੀ । is kept or mapped to a full stop (keep it for display, map it for matching).",
      "Version the normaliser and record its version with every dataset, index and model, because changing it changes everything downstream.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "decode + NFC", detail: "bytes → code points; equivalent sequences unified" },
        { label: "strip invisibles", detail: "U+200B, U+200C, U+200D, U+FEFF, U+00AD, U+0640 removed" },
        { label: "script maps", detail: "ي→ی, ك→ک; sihari reordering; ੧੨੩ → 123; ؟ → ?" },
        { label: "whitespace + punctuation", detail: "collapse spaces, trim, consistent quotes and full stops" },
        { label: "Romanised extras", detail: "lowercase, collapse repeats, variant map" },
      ],
      caption: "One function, applied everywhere, versioned. Order matters: NFC before the maps, maps before matching.",
    },
    everyday: {
      title: "Addresses on envelopes",
      text: "Post offices receive 'Flat 3, 12 Mall Road', '12 MALL RD FLAT 3' and '12, mall road, flat-3' and must deliver all three to one door. They normalise: uppercase, expand abbreviations, fixed field order. Nobody rewrites the sorting machine for every spelling; one normaliser feeds it. Punjabi text has the same spread of harmless variation, and the same cure.",
    },
    engineering: {
      title: "The evaluation that scored 12 points too low",
      text: "A translation model's Gurmukhi output was scored against references and came out at chrF 41 when the team expected 50. Inspection showed the references used precomposed nukta letters and Gurmukhi full stops, while the model emitted decomposed nukta forms and Latin full stops: visually identical, byte-different. Applying the same normaliser to outputs and references before scoring raised the score to chrF 53. No model changed. The team added a rule: evaluation always normalises both sides with the versioned normaliser.",
    },
    code: {
      title: "A versioned Punjabi normaliser",
      lang: "py",
      src: `import re
import unicodedata

NORMALISER_VERSION = "pa-norm-1.2"

INVISIBLES = re.compile(r"[\\u200B\\u200C\\u200D\\uFEFF\\u00AD\\u0640]")
SHAHMUKHI_MAP = str.maketrans({"\\u064A": "\\u06CC", "\\u0643": "\\u06A9", "\\u0629": "\\u06C1"})
GURMUKHI_DIGITS = str.maketrans("੦੧੨੩੪੫੬੭੮੯", "0123456789")
ARABIC_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")
SIHARI_BEFORE_CONSONANT = re.compile(r"\\u0A3F([\\u0A15-\\u0A39\\u0A59-\\u0A5E])")

def normalise(text, script):
    text = unicodedata.normalize("NFC", text)
    text = INVISIBLES.sub("", text)
    if script == "guru":
        text = SIHARI_BEFORE_CONSONANT.sub(r"\\1\\u0A3F", text)     # keyboard put ਿ before its letter
        text = text.translate(GURMUKHI_DIGITS)
    elif script == "arab":
        text = text.translate(SHAHMUKHI_MAP).translate(ARABIC_DIGITS)
        text = text.replace("\\u061F", "?")
    elif script == "latn":
        text = text.lower()
        text = re.sub(r"(.)\\1{2,}", r"\\1\\1", text)
    return re.sub(r"\\s+", " ", text).strip()

print(normalise("ਿਕੱਥੇ  ਹੋ ਤੁਸੀਂ ੨੦੨੫", "guru"))
print(normalise("كتھے ہو ؟", "arab"))`,
      lines: [
        { code: "NORMALISER_VERSION = \"pa-norm-1.2\"", say: "Every dataset, index and model records which normaliser produced its text. Change the rules, bump the version, rebuild." },
        { code: "SIHARI_BEFORE_CONSONANT = re.compile(r\"\\u0A3F([\\u0A15-\\u0A39\\u0A59-\\u0A5E])\")", say: "A sihari (ਿ) stored before a consonant is a keyboard error; it must be stored after the letter it visually precedes." },
        { code: "text = SIHARI_BEFORE_CONSONANT.sub(r\"\\1\\u0A3F\", text)     # keyboard put ਿ before its letter", say: "Swap them. Renders identically, now matches correctly typed text." },
        { code: "text = text.translate(SHAHMUKHI_MAP).translate(ARABIC_DIGITS)", say: "Letter variants and Arabic-Indic digits to canonical forms for Shahmukhi." },
        { code: "return re.sub(r\"\\s+\", \" \", text).strip()", say: "Whitespace last, for every script." },
      ],
      output: "ਕਿੱਥੇ ਹੋ ਤੁਸੀਂ 2025\nکتھے ہو ?",
    },
    useIt: "Write one normaliser per project, versioned, applied to training data, retrieval indexes, evaluation references and live input alike. Keep display-only transformations (digits, dandas) separate from matching transformations if the product must show text as the user wrote it.",
    takeaways: ["Normalisation makes equivalent Punjabi inputs byte-identical before any model or index sees them.", "Steps: NFC, invisibles, script-specific maps (variants, sihari order, digits, punctuation), whitespace, Romanised extras.", "Apply the same versioned normaliser everywhere, including evaluation.", "A normaliser change is a data change: rebuild and re-measure."],
    terms: [["text normalisation", "a fixed transformation making equivalent text identical"], ["sihari", "the Gurmukhi vowel sign ਿ, drawn before but stored after its consonant"], ["danda", "the Indic full stop । (ਦੰਡੀ in Gurmukhi)"]],
    reflect: { q: "Why must the evaluation references be normalised with the same function as the model output?", a: "Otherwise the score measures byte differences that no reader would notice (nukta encoding, punctuation code points) and reports the model as worse than it is. Normalising both sides makes the score about the language." },
  },

  "m44-spelling-variation": {
    simple: "Punjabi words are spelled several ways in every script; a data pipeline needs to treat the variants as one word for matching while keeping what the user wrote for display.",
    concept:
      "Beyond encoding, Punjabi has genuine **spelling variation**: different people write the same word differently, and all forms are in use. In Gurmukhi: ਕਿਉਂ / ਕਿਓਂ (why), ਨਹੀਂ / ਨਹੀ (no, with or without the bindi), ਗੱਲ / ਗਲ (talk, with or without the addak), tipi versus bindi for nasalisation (ਸਿੰਘ / ਸਿਂਘ), and loanwords like ਟਰੇਨ / ਟ੍ਰੇਨ (train). In Shahmukhi: with or without short-vowel marks, hamza variants, and competing conventions for Punjabi-only sounds. In Romanised text the variation is extreme, as the earlier lesson showed.\n\nTwo approaches cover it. A **variant map** lists observed spellings with a canonical form for frequent words, built from logs and native speakers. **Fuzzy matching** handles the long tail by measuring how different two strings are (edit distance) and treating small differences, especially in known-variable marks, as equal. Models tolerate variation only if they saw it in training, so variation also belongs in the data, not just the matcher.",
    why:
      "Exact matching loses recall: a search for ਨਹੀਂ misses documents with ਨਹੀ; a classifier trained on ਕਿਉਂ sees ਕਿਓਂ as a new word; deduplication keeps near-identical sentences. Over-aggressive matching loses precision: ਗਲ (cheek) and ਗੱਲ (talk) differ by one addak and mean different things. The engineering is in choosing which differences to ignore and where.",
    how: [
      "Mine frequent words and their spellings from your corpus and logs; have native speakers mark which are variants of one word and which are different words.",
      "Build a variant map for the top few thousand words per script.",
      "For the long tail, use edit distance with weights: ignoring a bindi/tipi or addak difference costs little, substituting a consonant costs a lot.",
      "Use the canonical form for matching, indexing and deduplication; keep the original for display and for training the model to accept variation.",
      "Include natural variation in training and evaluation data so models learn to read all forms.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Script", "Variants of one word", "Different words that look like variants", "Rule"],
        rows: [
          ["Gurmukhi", "ਨਹੀਂ / ਨਹੀ; ਕਿਉਂ / ਕਿਓਂ; ਸਿੰਘ / ਸਿਂਘ", "ਗੱਲ (talk) vs ਗਲ (cheek); ਦਿਲ (heart) vs ਦਿੱਲ (rare)", "nasal and addak differences are cheap but not free; check a dictionary"],
          ["Shahmukhi", "with/without zabar, zer, pesh; ہے / ہی spacing", "کل (tomorrow) vs کُل (total) with a mark", "treat short-vowel marks as optional"],
          ["Romanised", "kithe / kithay / kitthe", "menu (ਮੈਨੂੰ) vs menu (English)", "context or a language tag decides"],
        ],
      },
      caption: "Some one-mark differences are harmless; some change the meaning. The map encodes which.",
    },
    everyday: {
      title: "Colour, color, and the dictionary",
      text: "English readers accept 'colour' and 'color' as one word, and know 'desert' and 'dessert' are two, though each pair differs by a letter. They learned which differences matter. Punjabi has far more of these pairs and no single dictionary everyone follows. A matcher without that knowledge either merges 'desert' with 'dessert' or splits 'colour' from 'color'.",
    },
    engineering: {
      title: "Search recall on a Gurmukhi legal corpus",
      text: "A legal-document search for Punjab courts returned 61% of relevant documents on a 400-query test. Analysis showed a third of the misses were spelling variants: ਨੋਟਿਸ / ਨੋਟਸ (notice), ਅਪੀਲ / ਅਪੀਲ਼, bindi-tipi swaps, and loanwords spelled by ear. The team built a 6,000-word variant map with two legal clerks and added weighted edit-distance matching (nasal and addak differences cost 0.2, consonant substitutions 1.0, threshold 0.5 for short words). Recall rose to 86%; precision fell by only two points because the dictionary of real minimal pairs blocked the dangerous merges.",
    },
    maths: {
      formula: "weighted edit distance d(a, b) = minimum total cost of insertions, deletions and substitutions turning a into b;   match if d ÷ max(len a, len b) < threshold",
      meaning: "Each edit has a cost; cheap costs for marks that commonly vary, expensive for consonants. Dividing by length makes the threshold fair across short and long words.",
      worked: [
        "ਨਹੀਂ vs ਨਹੀ: one deletion of a bindi, cost 0.2. Lengths 4 and 3 (code points). Normalised distance 0.2 ÷ 4 = 0.05 < 0.5 → match.",
        "ਗੱਲ vs ਗਲ: one deletion of an addak, cost 0.2, normalised 0.2 ÷ 3 ≈ 0.07 → would match, wrongly. The minimal-pair dictionary lists (ਗੱਲ, ਗਲ) as distinct and overrides.",
        "ਕਿਉਂ vs ਕਿਓਂ: one substitution of vowel sign ਉ for ਓ, cost 0.5 (vowel class), normalised 0.5 ÷ 4 ≈ 0.13 → match.",
        "ਦਿਲ vs ਦਿਨ: one consonant substitution, cost 1.0, normalised 1.0 ÷ 3 ≈ 0.33 → under 0.5, so the threshold alone would match; the dictionary again blocks (heart vs day). Thresholds need the dictionary.",
      ],
    },
    code: {
      title: "Weighted edit distance for Gurmukhi",
      lang: "py",
      src: `NASAL = {"\\u0A02", "\\u0A70"}        # bindi, tipi
ADDAK = {"\\u0A71"}
VOWEL_SIGNS = set("\\u0A3E\\u0A3F\\u0A40\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B\\u0A4C")
MINIMAL_PAIRS = {("ਗੱਲ", "ਗਲ"), ("ਦਿਲ", "ਦਿਨ")}

def cost(a, b):
    if a == b: return 0.0
    if a in NASAL and b in NASAL: return 0.1
    if a in VOWEL_SIGNS and b in VOWEL_SIGNS: return 0.5
    return 1.0

def cost_indel(ch):
    if ch in NASAL or ch in ADDAK: return 0.2
    return 1.0

def distance(a, b):
    prev = [0.0]
    for ch in b:
        prev.append(prev[-1] + cost_indel(ch))
    for i, ca in enumerate(a, 1):
        cur = [prev[0] + cost_indel(ca)]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + cost_indel(ca), cur[j - 1] + cost_indel(cb), prev[j - 1] + cost(ca, cb)))
        prev = cur
    return prev[-1]

def same_word(a, b, threshold=0.5):
    if (a, b) in MINIMAL_PAIRS or (b, a) in MINIMAL_PAIRS: return False
    return distance(a, b) / max(len(a), len(b)) < threshold

print(same_word("ਨਹੀਂ", "ਨਹੀ"), same_word("ਗੱਲ", "ਗਲ"), same_word("ਕਿਉਂ", "ਕਿਓਂ"))`,
      lines: [
        { code: "if a in NASAL and b in NASAL: return 0.1", say: "Swapping bindi for tipi is almost free: the same word, two conventions." },
        { code: "if ch in NASAL or ch in ADDAK: return 0.2", say: "Dropping or adding a nasal or doubling mark is cheap; people do it constantly." },
        { code: "cur.append(min(prev[j] + cost_indel(ca), cur[j - 1] + cost_indel(cb), prev[j - 1] + cost(ca, cb)))", say: "The standard edit-distance recurrence with weighted costs: the cheapest way to turn one string into the other." },
        { code: "if (a, b) in MINIMAL_PAIRS or (b, a) in MINIMAL_PAIRS: return False", say: "The dictionary of real distinct words overrides the distance. Distance alone cannot know that ਗੱਲ and ਗਲ differ in meaning." },
      ],
      output: "True False True",
    },
    useIt: "Use variant maps for frequent words and weighted fuzzy matching for the tail in search, deduplication and evaluation matching; guard both with a minimal-pair list from native speakers. Keep original spellings in training data so models learn to read every form, and keep the user's spelling in anything you display back.",
    takeaways: ["Punjabi words have real, accepted spelling variants in every script.", "Variant maps for the head, weighted edit distance for the tail, a minimal-pair dictionary to block wrong merges.", "Canonical forms for matching; original forms for display and for training.", "Nasal and addak differences are cheap but can change meaning."],
    terms: [["spelling variant", "an accepted alternative spelling of the same word"], ["edit distance", "the cost of the cheapest sequence of edits turning one string into another"], ["minimal pair", "two different words that differ by one mark or letter"]],
    reflect: { q: "Why keep the original spelling in training data instead of normalising everything to the canonical form?", a: "Users will write the variants, so the model must have seen them; a model trained only on canonical forms is brittle at inference. Canonical forms are for matching and indexing; the model needs the real distribution." },
  },

  "m44-dialect-variation": {
    simple: "Punjabi has several dialects that differ in grammar, vocabulary and sound; a dataset drawn from one region makes a model that misreads the others, so dialect must be collected, tagged and evaluated.",
    concept:
      "Punjabi is not one uniform language. **Dialect variation** across regions shows in verbs, pronouns, vocabulary and pronunciation. Majhi (around Lahore and Amritsar) is the usual written standard. Malwai (southern Indian Punjab) says ਐ for ਹੈ ('is'): ਕੀ ਹਾਲ ਐ. Doabi (between the Beas and Sutlej) has its own forms. Pothohari and other western dialects (around Rawalpindi) differ enough that some treat them as separate; Saraiki, spoken in the south of Pakistani Punjab, is often counted as a distinct language with its own letters. Western Punjabi as a whole uses ਏ/اے for 'is' and has different verb endings: ਮੈਂ ਜਾਨਾ ਵਾਂ versus ਮੈਂ ਜਾਂਦਾ ਹਾਂ.\n\nFor data this means: a corpus from newspapers is Majhi-standard; a corpus from Malwai village WhatsApp groups is not. A model trained on one will stumble on the other, and a test set in the standard dialect hides it. Dialect also correlates with script: Pakistani dialects are written in Shahmukhi, so dialect and script problems arrive together.",
    why:
      "A support assistant that understands Amritsar but not Bathinda or Rawalpindi serves a fraction of Punjabi speakers while reporting good scores on standard text. Dialect imbalance is also a fairness issue: rural and western speakers are the least represented online and the most likely to be misread. Tagging dialect in data lets you measure the gap and fix it where it is worst.",
    how: [
      "Decide the dialect scheme you will tag (a handful of groups: Majhi, Malwai, Doabi, Pothohari/western, Saraiki if in scope).",
      "Collect data deliberately from each region and channel; metadata such as location or community can seed the tags.",
      "Have native speakers from each region tag a sample; measure agreement, because dialect boundaries are fuzzy.",
      "Report model quality per dialect; add data where the gap is largest.",
      "In the product, accept any dialect on input and reply in the standard register unless the product is regional, in which case match the user.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Meaning", "Majhi (standard)", "Malwai", "Western / Pothohari (Shahmukhi)", "Note"],
        rows: [
          ["How are you?", "ਕੀ ਹਾਲ ਹੈ?", "ਕੀ ਹਾਲ ਐ?", "کی حال اے؟", "'is' = ਹੈ / ਐ / ਏ(اے)"],
          ["I am going", "ਮੈਂ ਜਾਂਦਾ ਹਾਂ", "ਮੈਂ ਜਾਨਾਂ", "میں جانا واں", "verb ending differs"],
          ["where", "ਕਿੱਥੇ", "ਕਿੱਥੇ", "کتھے / کِدھر", "mostly shared"],
          ["boy", "ਮੁੰਡਾ", "ਮੁੰਡਾ", "منڈا / جاتک", "vocabulary varies in the west"],
        ],
      },
      caption: "Dialects overlap heavily; the differences cluster in function words and verb forms, which are exactly the words detectors and models key on.",
    },
    everyday: {
      title: "The relative from the other side",
      text: "At a wedding a cousin from Rawalpindi says 'ਮੈਂ ਆਨਾ ਵਾਂ' and the Ludhiana side laughs kindly at the ending; a Bathinda uncle says 'ਕੀ ਹਾਲ ਐ' and the Amritsar side notices the ਐ. Everyone understands everyone, with a half-second's adjustment. A model trained only on newspaper Punjabi never makes that adjustment; it treats the Rawalpindi ending as an error and the ਐ as a typo.",
    },
    engineering: {
      title: "Intent detection that failed in Malwa",
      text: "An agricultural advice assistant was trained on 20,000 Gurmukhi questions, mostly from a Jalandhar-based partner. Field testing in Bathinda showed intent accuracy of 71% against 88% in Jalandhar. The difference was dialect: Malwai verb forms and local crop vocabulary. The team tagged 3,000 Malwai questions with a local NGO, added them to training with up-weighting, and built a per-dialect evaluation set. Malwai accuracy rose to 85%, Jalandhar stayed at 88%. The dashboard now shows four dialect columns instead of one average.",
    },
    maths: {
      formula: "dialect gap = accuracy(standard dialect) − accuracy(dialect D);   data need ∝ gap × share of users in D",
      meaning: "Measure the gap per dialect, then prioritise data collection where the gap and the number of affected users are both large.",
      worked: [
        "Accuracy: Majhi 88%, Doabi 84%, Malwai 71%, Pothohari 62%. Gaps: 0, 4, 17, 26 points.",
        "User shares: Majhi 35%, Doabi 20%, Malwai 30%, Pothohari 15%.",
        "Priority score = gap × share: Doabi 0.8, Malwai 5.1, Pothohari 3.9. Malwai first, Pothohari second, even though Pothohari's gap is larger.",
        "After adding Malwai data, recompute; priorities shift as gaps close.",
      ],
    },
    code: {
      title: "A simple dialect-marker scorer for Gurmukhi",
      lang: "py",
      src: `MARKERS = {
    "malwai":   {"ਐ", "ਜਾਨਾਂ", "ਆਨਾਂ", "ਕਰਨਾਂ", "ਸੀਗਾ", "ਹੈਗਾ"},
    "western":  {"ਏ", "ਵਾਂ", "ਜਾਨਾ", "ਆਨਾ", "ਕਿਦੋਂ", "ਤੁਸਾਂ"},
    "majhi":    {"ਹੈ", "ਹਾਂ", "ਜਾਂਦਾ", "ਆਉਂਦਾ", "ਕਰਦਾ"},
}

def dialect_scores(text):
    words = set(text.replace("?", "").replace("।", "").split())
    return {d: len(words & marks) for d, marks in MARKERS.items()}

for s in ["ਕੀ ਹਾਲ ਐ, ਕੱਲ੍ਹ ਮੈਂ ਜਾਨਾਂ", "ਕੀ ਹਾਲ ਹੈ, ਕੱਲ੍ਹ ਮੈਂ ਜਾਂਦਾ ਹਾਂ", "ਮੈਂ ਆਨਾ ਵਾਂ"]:
    scores = dialect_scores(s)
    print(max(scores, key=scores.get), scores)`,
      lines: [
        { code: "\"malwai\":   {\"ਐ\", \"ਜਾਨਾਂ\", \"ਆਨਾਂ\", \"ਕਰਨਾਂ\", \"ਸੀਗਾ\", \"ਹੈਗਾ\"},", say: "Marker words collected from native speakers. Function words and verb endings, not topics." },
        { code: "return {d: len(words & marks) for d, marks in MARKERS.items()}", say: "Count markers per dialect. Crude, but enough to tag a corpus for a first measurement." },
        { code: "print(max(scores, key=scores.get), scores)", say: "The dialect with most markers wins; ties and zero scores should be labelled 'unknown' in a real tagger." },
      ],
      output: "malwai {'malwai': 2, 'western': 0, 'majhi': 0}\nmajhi {'malwai': 0, 'western': 0, 'majhi': 3}\nwestern {'malwai': 0, 'western': 2, 'majhi': 0}",
      note: "A production tagger is a classifier trained on region-tagged text; the marker list is how you bootstrap its training set.",
    },
    useIt: "Tag dialect in your Punjabi datasets, collect deliberately from each region and channel, evaluate per dialect, and prioritise data where gap times user share is largest. Accept all dialects on input; choose the reply register deliberately.",
    takeaways: ["Punjabi dialects differ in function words, verb forms and vocabulary; the written standard is Majhi.", "Data from one region trains a model that misreads others; standard test sets hide it.", "Tag dialect, measure per dialect, prioritise by gap × user share.", "Dialect and script problems arrive together for western Punjabi."],
    terms: [["dialect", "a regional variety of a language with its own grammar and vocabulary"], ["Majhi", "the Punjabi dialect of Lahore and Amritsar, used as the written standard"], ["Saraiki", "a southern variety often treated as a separate language, written in Shahmukhi with extra letters"]],
    reflect: { q: "Should the assistant reply in the user's dialect?", a: "Usually reply in the standard register, which every speaker understands, unless the product is regional or the user clearly prefers their dialect; imitating a dialect badly reads as mockery. Always accept every dialect on input." },
  },

  "m44-punjabi-english-code-switching": {
    simple: "Punjabi-English mixing is the dominant form of real Punjabi text; building a dataset for it means tagging language at the word level, in both Gurmukhi and Roman script, from real messages.",
    concept:
      "Lesson 43.8 introduced code-switching in general; this lesson is about building the **Punjabi-English code-switched dataset** a product needs. Real messages mix in predictable ways: Punjabi grammar with English nouns and verbs ('ਮੈਂ ਕੱਲ੍ਹ office ਨਹੀਂ ਆਵਾਂਗਾ', 'meeting cancel ਹੋ ਗਈ'); Romanised Punjabi with English ('mainu order di update chahidi hai'); English frames with Punjabi tags ('send me the invoice na'); and verbs made from English words with Punjabi endings ('cancel ਕਰ ਦਿੱਤਾ', 'update karo').\n\nA code-switched dataset needs **word-level language tags**: each token labelled Punjabi, English, named entity, or other, plus a script tag. With those tags you can measure the mixing level, train a tagger, and teach models to keep English terms as written while answering in Punjabi. Annotation guidelines must settle the hard cases: is 'order' English or a Punjabi loanword? (Tag by origin, and let the model learn that loanwords are normal.) What about 'karo' attached to an English verb? (Punjabi.)",
    why:
      "Without a code-switched dataset you cannot measure how your product handles real messages, cannot train it to, and cannot even sort your support inbox by language. The dataset is also what makes the Romanised problem tractable: word-level tags let you transliterate only the Punjabi words and leave 'router', 'OTP' and 'refund' alone.",
    how: [
      "Sample real messages from the product's channels across scripts, with consent and anonymisation (lesson 44.10).",
      "Write annotation guidelines with examples for every hard case: loanwords, English verbs with Punjabi endings, names, numbers, emoji.",
      "Tag each word with language (pa, en, ne for named entity, other) and script (guru, arab, latn); use two annotators and measure agreement.",
      "Compute the mixing level per message and keep the distribution; the dataset should match traffic, not textbook text.",
      "Use it to train a word-level tagger, to evaluate the assistant on mixed input, and to select fine-tuning examples.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Message", "Word-level tags (language/script)", "Pattern"],
        rows: [
          ["ਮੇਰਾ order ਅਜੇ deliver ਨਹੀਂ ਹੋਇਆ", "ਮੇਰਾ pa/guru · order en/latn · ਅਜੇ pa/guru · deliver en/latn · ਨਹੀਂ pa/guru · ਹੋਇਆ pa/guru", "Punjabi frame, English verb and noun"],
          ["mainu order di update chahidi hai", "mainu pa/latn · order en/latn · di pa/latn · update en/latn · chahidi pa/latn · hai pa/latn", "Romanised mix; script tag cannot separate them"],
          ["send me the invoice na", "send en · me en · the en · invoice en · na pa/latn", "English frame, Punjabi tag"],
          ["Amazon wale ne refund kar ditta", "Amazon ne · wale pa · ne pa · refund en · kar pa · ditta pa", "named entity, English noun, Punjabi light verb"],
        ],
      },
      caption: "Word-level tags are the dataset. Script helps only in the first row; the rest needs language knowledge.",
    },
    everyday: {
      title: "Writing down how people actually talk",
      text: "If you transcribed a day of conversation in a Punjabi office, almost no sentence would be pure Punjabi or pure English. 'Client ne call kita, bolya proposal Monday tak bhej do.' Anyone who has worked there finds it perfectly normal. A dataset of this speech, with each word's language marked, is what teaches a model to find it normal too. A dataset of newspaper Punjabi teaches it something nobody says.",
    },
    engineering: {
      title: "Building a 10,000-message code-switched corpus",
      text: "A delivery company's support team exported 60,000 anonymised chat messages. A script-based filter kept messages with any Gurmukhi or with Romanised Punjabi function words: 23,000. Two annotators from the support team tagged 10,000 at word level using guidelines that settled loanwords (tag by origin), light verbs ('kar', 'ho' are Punjabi), entities and numbers. Agreement on language tags was 94%; disagreements, mostly on words like 'time' and 'problem', were resolved by rule. The corpus trained a word-level tagger (97% accuracy) and became the assistant's evaluation set, bucketed by mixing level. The assistant's measured accuracy fell from 84% on the old pure-Gurmukhi set to 66% on this one, and the team finally had the real number to improve.",
    },
    maths: {
      formula: "Cohen's κ = (p₀ − pₑ) ÷ (1 − pₑ),  where p₀ is observed agreement and pₑ the agreement expected by chance",
      meaning: "Two annotators tagging the same words agree partly by luck. Kappa corrects for that; above 0.8 is strong agreement, below 0.6 means the guidelines are unclear.",
      worked: [
        "Two annotators tag 1,000 words as pa or en. Both say pa on 620, both say en on 300, they disagree on 80. p₀ = (620 + 300) ÷ 1,000 = 0.92.",
        "Annotator A says pa on 660 words (0.66), B on 650 (0.65). Expected agreement by chance pₑ = 0.66 × 0.65 + 0.34 × 0.35 = 0.429 + 0.119 = 0.548.",
        "κ = (0.92 − 0.548) ÷ (1 − 0.548) = 0.372 ÷ 0.452 ≈ 0.82: strong agreement; the guidelines work.",
        "If disagreements had been 200 (p₀ = 0.80), κ ≈ 0.56: rewrite the guidelines before tagging more.",
      ],
    },
    code: {
      title: "A word-level language tagger from dictionaries (bootstrap)",
      lang: "py",
      src: `import re

GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")
ROMAN_PUNJABI = {"mainu", "sanu", "tusi", "tuhanu", "hai", "nahi", "kar", "karo", "ditta", "kita", "da", "di", "de", "nu", "ne", "wale", "chahidi", "aa", "haan", "ji", "na", "kithe", "kadon"}
ENGLISH = {"order", "update", "refund", "deliver", "delivery", "invoice", "send", "me", "the", "cancel", "meeting", "office", "otp", "router"}

def tag_word(word):
    w = word.strip(".,!?").lower()
    if GURMUKHI.search(w): return "pa/guru"
    if w[:1].isupper() or word[:1].isupper(): return "ne"
    if w in ROMAN_PUNJABI: return "pa/latn"
    if w in ENGLISH: return "en"
    if w.isdigit(): return "num"
    return "unk"

def tag(message):
    return [(w, tag_word(w)) for w in message.split()]

print(tag("Amazon wale ne refund kar ditta"))
print(tag("mainu order di update chahidi hai"))`,
      lines: [
        { code: "if GURMUKHI.search(w): return \"pa/guru\"", say: "Gurmukhi words are Punjabi with certainty; script settles them." },
        { code: "if w[:1].isupper() or word[:1].isupper(): return \"ne\"", say: "A capitalised Latin word mid-message is usually a name or brand: a named entity, tagged separately." },
        { code: "if w in ROMAN_PUNJABI: return \"pa/latn\"", say: "Function words and light verbs identify Romanised Punjabi." },
        { code: "return \"unk\"", say: "Everything unknown is left for annotators; the unk list is the list of words to add to the dictionaries or to a learned tagger." },
      ],
      output: "[('Amazon', 'ne'), ('wale', 'pa/latn'), ('ne', 'pa/latn'), ('refund', 'en'), ('kar', 'pa/latn'), ('ditta', 'pa/latn')]\n[('mainu', 'pa/latn'), ('order', 'en'), ('di', 'pa/latn'), ('update', 'en'), ('chahidi', 'pa/latn'), ('hai', 'pa/latn')]",
      note: "This bootstraps annotation: annotators correct the tags rather than starting from nothing. The corrected corpus trains a real sequence tagger.",
    },
    useIt: "Build a word-level tagged code-switched corpus from real messages before claiming any Punjabi accuracy. Use it to evaluate by mixing level, to train a tagger that drives transliteration of only the Punjabi words, and to pick fine-tuning examples that match traffic. Measure annotator agreement with kappa and fix guidelines below 0.8.",
    takeaways: ["Real Punjabi text is code-switched; the dataset must be too, in the real proportions.", "Tag language and script per word; settle loanwords, light verbs and entities in written guidelines.", "Measure annotator agreement with Cohen's kappa; rewrite guidelines below 0.8.", "The tagged corpus drives evaluation, tagger training and selective transliteration."],
    terms: [["word-level language tag", "a label per token saying which language (and script) it belongs to"], ["light verb", "a Punjabi verb like ਕਰਨਾ or ਹੋਣਾ attached to an English word to make a new verb"], ["Cohen's kappa", "agreement between two annotators corrected for chance"]],
    reflect: { q: "Should 'order' in 'mera order kithe hai' be tagged English or Punjabi?", a: "By origin, English, with the understanding that it is a normal loanword; the guideline should say so and apply consistently. What matters is that the tagger lets the pipeline leave 'order' untransliterated and the model learn that such words are expected inside Punjabi sentences." },
  },

  "m44-punjabi-data-collection": {
    simple: "Collecting Punjabi data means finding where the language actually lives (web, archives, speech, your own product), getting the right to use it, separating it from Hindi and Urdu, and recording where every piece came from.",
    concept:
      "**Data collection** for a low-resource language is active work: the data is not in one place and not labelled as yours to take. Sources for Punjabi: public web text (news sites, Wikipedia, government portals, religious and literary archives), existing research corpora, scanned books and newspapers (through OCR), speech (radio, interviews, voice notes) through transcription, and, most valuable for a product, your own channels: support chats, reviews, forms, with user consent and anonymisation.\n\nThree questions govern every source. Rights: what licence or consent allows training and redistribution? Identity: is this actually Punjabi, in which script and dialect, or Hindi and Urdu mislabelled? Provenance: can you trace each document back to its source, date and licence, so you can remove it later or explain it to an auditor?\n\nFor Shahmukhi, collection means mining Urdu-tagged sources with a Punjabi classifier. For Romanised, it means your own channels and consented social data, because nothing curated exists. For speech-to-text pipelines, it means transcripts checked by native speakers, because automatic transcripts of Punjabi are still poor.",
    why:
      "Models are what they ate. A Punjabi model trained on scraped text of unknown rights is a legal risk; one trained on Hindi mislabelled as Punjabi is a quality disaster; one trained without provenance cannot honour a takedown request or a user's deletion. Collection done properly is slower and yields less text, and it is the only kind that can be deployed.",
    how: [
      "List candidate sources per script with the licence or consent basis for each; drop sources without a usable basis.",
      "Crawl or export with rate limits and robots rules; keep the raw copy and the URL, date and licence in a manifest.",
      "Run language and script identification tuned for Punjabi versus Hindi and Urdu; keep the scores so borderline documents can be reviewed.",
      "For speech and scans, transcribe or OCR, then have native speakers check a sample and estimate the error rate.",
      "For product data: anonymise (lesson 44.11), apply the consent policy, and record which users' data is included so deletion requests can be honoured.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Source", "Script", "Rights basis", "Identity risk", "Provenance"],
        rows: [
          ["Punjabi Wikipedia", "Gurmukhi", "open licence (attribution, share-alike)", "low", "dump date + article id"],
          ["news sites", "Gurmukhi / Shahmukhi", "check terms; often not for redistribution", "Hindi/Urdu articles mixed in", "URL + crawl date"],
          ["Urdu-tagged Pakistani sites", "Shahmukhi", "check terms", "mostly Urdu; classifier needed", "URL + classifier score"],
          ["scanned books", "Gurmukhi", "public domain only if old enough", "OCR errors", "book id + page"],
          ["your support chats", "all three", "user consent under your privacy policy", "low after tagging", "message id + user consent flag"],
          ["social media comments", "Romanised", "platform terms; often restricted", "Romanised Hindi mixed in", "post id + platform"],
        ],
      },
      caption: "Every row needs all five columns filled before a single sentence goes into training.",
    },
    everyday: {
      title: "Collecting family recipes",
      text: "To compile a family cookbook you ask each relative for their recipes, note who gave which one, and ask whether it may be printed. You do not photocopy a published cookbook and call it the family's. You also check that the 'Punjabi' recipe from a cousin's friend is not actually a Gujarati dish with a Punjabi name. Data collection has the same manners: ask, record, verify.",
    },
    engineering: {
      title: "Separating Shahmukhi Punjabi from Urdu at scale",
      text: "A team needs Shahmukhi text. They crawl 300 Pakistani news and literature sites with explicit permission from twelve and open licences on four more, keeping a manifest of URL, date and licence. The standard language identifier tags 98% as Urdu. They train a Punjabi-versus-Urdu classifier on 6,000 sentences hand-labelled by Lahore annotators, using function words (اے, وچ, نوں, کتھے, ساڈا versus ہے, میں, کو, کہاں, ہمارا) and verb endings. Applied to 9 million sentences it finds 540,000 Punjabi with high confidence; 80,000 borderline sentences go to review. The resulting corpus, with provenance, is the first usable Shahmukhi training set the company has.",
    },
    maths: {
      formula: "expected usable sentences = crawled × P(actually Punjabi) × P(rights usable) × (1 − duplicate rate)",
      meaning: "Each filter removes a share; multiply the survival rates to plan how much to crawl for a target corpus size.",
      worked: [
        "Target: 500,000 usable Shahmukhi sentences.",
        "Rates: P(Punjabi | Urdu-tagged crawl) ≈ 0.06; P(rights usable) ≈ 0.4 (only permitted and open sites); duplicate rate ≈ 0.25.",
        "Survival = 0.06 × 0.4 × 0.75 = 0.018. Needed crawl ≈ 500,000 ÷ 0.018 ≈ 27.8 million sentences.",
        "Changing the rights filter to include only open-licence sites (P ≈ 0.1) would need over 100 million sentences; negotiating permissions is the cheaper path.",
      ],
    },
    code: {
      title: "A collection manifest with language scores",
      lang: "py",
      src: `import csv, hashlib, time
import fasttext   # lid.176 model covers 'pa' (Gurmukhi) and 'pnb' (Western Punjabi); still verify by hand

lid = fasttext.load_model("lid.176.bin")

def record(url, text, licence, writer):
    labels, probs = lid.predict(text.replace("\\n", " ")[:1000], k=3)
    top = labels[0].replace("__label__", "")
    writer.writerow({
        "url": url,
        "fetched_at": time.strftime("%Y-%m-%d"),
        "licence": licence,
        "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "lang_top": top,
        "lang_prob": round(float(probs[0]), 3),
        "lang_alt": ";".join(l.replace("__label__", "") for l in labels[1:]),
        "chars": len(text),
    })

with open("manifest.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["url", "fetched_at", "licence", "sha256", "lang_top", "lang_prob", "lang_alt", "chars"])
    writer.writeheader()
    for url, text, licence in crawled_pages:
        record(url, text, licence, writer)`,
      lines: [
        { code: "lid = fasttext.load_model(\"lid.176.bin\")", say: "An off-the-shelf language identifier with Punjabi labels. It is a first pass, not a verdict; Hindi/Punjabi and Urdu/Punjabi confusions are common." },
        { code: "labels, probs = lid.predict(text.replace(\"\\n\", \" \")[:1000], k=3)", say: "Top three guesses with probabilities, so borderline documents can be routed to review instead of silently kept or dropped." },
        { code: "\"sha256\": hashlib.sha256(text.encode(\"utf-8\")).hexdigest(),", say: "A content hash per document: exact duplicates are found later by matching hashes, and takedowns can locate every copy." },
        { code: "\"licence\": licence,", say: "The rights basis travels with the document from the first second. No licence, no row." },
      ],
      note: "The manifest is the provenance record. It is as important as the text, and it is what lets you answer 'where did this sentence come from?' a year later.",
    },
    useIt: "Plan collection per script with a rights basis for every source, keep a manifest with URL, date, licence, hash and language scores, separate Punjabi from Hindi and Urdu with a tuned classifier, verify samples with native speakers, and treat your own consented product data as the most valuable source for the Romanised and code-switched forms.",
    takeaways: ["Punjabi data is scattered and mislabelled; collection is active, per script.", "Rights, identity and provenance must be settled before text enters training.", "Shahmukhi comes from Urdu-tagged sources via a Punjabi classifier; Romanised from your own consented channels.", "Keep a manifest; it is what makes deletion, audits and debugging possible."],
    terms: [["provenance", "the recorded origin of each piece of data: source, date, licence"], ["language identification", "automatically guessing a text's language; needs tuning for Punjabi versus Hindi and Urdu"], ["manifest", "a table listing every collected document with its metadata"]],
    reflect: { q: "A rich source has no clear licence but 'everyone uses it'. What do you do?", a: "Leave it out, or get written permission. A corpus you cannot explain to a lawyer or an auditor is a corpus you may have to delete, along with every model trained on it. The manifest column 'licence' must never be blank." },
  },

  "m44-punjabi-data-cleaning": {
    simple: "Cleaning removes what should not be in a Punjabi corpus: boilerplate, wrong languages, broken encoding, OCR damage, machine-translated junk and personal data, while keeping the natural variation that models must learn.",
    concept:
      "Raw collected text is mostly not what you want. **Data cleaning** is the sequence of filters and fixes that turns it into training material. For Punjabi the usual list is: strip navigation menus, cookie banners and comment forms (boilerplate); drop documents or lines in Hindi, Urdu or English that slipped past identification; repair or drop mojibake and malformed Unicode; detect and fix or drop OCR errors in scanned text (common Gurmukhi confusions: ਘ/ਧ, ਵ/ਥ, lost nuktas, broken vowel signs); drop machine-translated pages, which are fluent but subtly wrong Punjabi and poison a model's style; drop very short lines, lists and tables; and remove or mask personal data (names, phone numbers, addresses, ids).\n\nCleaning is a balance. Too little and the model learns menus and Hindi; too much and it never sees the spelling variation, slang and code-switching that real users write. The rule: remove what is not language or not Punjabi; keep everything that a Punjabi speaker actually wrote.",
    why:
      "Garbage dominates small corpora. In a crawl, boilerplate can be half the tokens; a few thousand machine-translated pages can outnumber real literary text; a hundred OCR'd books with 10% character errors teach a model to misspell. Because Punjabi data is scarce, every bad document is a larger share than it would be for English, so cleaning matters more, not less.",
    how: [
      "Extract main content from HTML with a boilerplate remover; drop lines shorter than a few words and lines that repeat across many pages.",
      "Apply normalisation (lesson 44.6) and a strict decode; drop documents with mojibake markers or invalid code points.",
      "Run language identification per line; drop lines confidently in another language; keep code-switched lines whose dominant language is Punjabi.",
      "Score OCR quality (share of invalid clusters, dictionary hit rate) and drop pages below a threshold; fix frequent known confusions with a dictionary.",
      "Detect machine translation with a classifier or heuristics (unnatural word order, English punctuation habits, translated boilerplate) and drop it.",
      "Mask personal data with pattern and entity detection; keep a count of what was masked.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Problem", "Example", "Detection", "Action"],
        rows: [
          ["boilerplate", "ਹੋਰ ਪੜ੍ਹੋ · ਸਾਂਝਾ ਕਰੋ · ਕੂਕੀ ਨੀਤੀ (read more · share · cookie policy)", "line repeats across pages; short", "drop"],
          ["wrong language", "a Hindi paragraph inside a Punjabi site", "per-line language id", "drop the line"],
          ["mojibake", "à¨ªà¨¾à¨£à©€", "Latin-1 marker patterns", "repair if possible, else drop"],
          ["OCR damage", "ਪੰਜਾਧੀ for ਪੰਜਾਬੀ", "dictionary hit rate; known confusion pairs", "fix known pairs; drop pages below threshold"],
          ["machine translation", "fluent but 'translated-sounding' Punjabi with English punctuation", "classifier; source-site hints", "drop"],
          ["personal data", "ਫ਼ੋਨ 98765 43210, ਨਾਮ ਹਰਪ੍ਰੀਤ ਸਿੰਘ", "regex + entity tagger", "mask, count"],
        ],
      },
      caption: "Each problem has a cheap detector. Run them in this order; log how much each removes.",
    },
    everyday: {
      title: "Sorting donated books for a library",
      text: "A library receives boxes of donated books. Some are water-damaged (mojibake), some are in Hindi though the box says Punjabi (wrong language), some are photocopies with smudged pages (OCR damage), some are bad translations of English bestsellers (machine translation), and a few have the previous owner's address inside the cover (personal data). The librarian does not throw out books for having dialect words or old spellings; those are the collection. Cleaning is that sorting, with the same judgement about what counts as damage.",
    },
    engineering: {
      title: "Cleaning a Gurmukhi web crawl",
      text: "A 40-million-line Gurmukhi crawl went through the pipeline: boilerplate removal dropped 38% of lines; per-line language id removed 9% (mostly Hindi and English); mojibake and invalid Unicode 1%; OCR-damaged pages from two archive sites 4%; a machine-translation classifier trained on 2,000 labelled pages removed 6% (several 'Punjabi' news sites were auto-translated from Hindi); personal-data masking touched 0.7% of lines. 42% of the crawl survived: 17 million lines. A model trained on the cleaned corpus scored 11 points higher on the Punjabi evaluation than one trained on the raw crawl, with less than half the tokens.",
    },
    maths: {
      formula: "OCR quality estimate = dictionary hit rate = words found in a Punjabi word list ÷ total words;   drop page if rate < threshold",
      meaning: "Scanned text with many character errors produces words not in any dictionary. The hit rate is a cheap proxy for character accuracy; calibrate the threshold on pages a person has checked.",
      worked: [
        "Page A: 400 words, 372 in the dictionary → hit rate 0.93. A person checks: about 2% character errors. Keep.",
        "Page B: 400 words, 268 in the dictionary → 0.67. Checked: 11% character errors, many broken vowel signs. Drop.",
        "Calibration over 50 checked pages shows hit rate 0.85 corresponds to roughly 4% character error; set the threshold at 0.85.",
        "Caution: dialect-rich or slang pages also have lower hit rates. Review a sample of rejected pages to make sure you are dropping damage, not dialect.",
      ],
    },
    code: {
      title: "A line-level cleaning pass",
      lang: "py",
      src: `import re
from collections import Counter

PHONE = re.compile(r"\\b\\d{5}[ -]?\\d{5}\\b")
EMAIL = re.compile(r"\\S+@\\S+")
GURMUKHI_CHARS = re.compile(r"[\\u0A00-\\u0A7F]")

def gurmukhi_share(line):
    letters = [c for c in line if c.isalpha()]
    if not letters: return 0.0
    return sum(1 for c in letters if GURMUKHI_CHARS.match(c)) / len(letters)

def clean_lines(lines, boilerplate_counts, min_words=4):
    kept, stats = [], Counter()
    for line in lines:
        line = line.strip()
        if len(line.split()) < min_words:
            stats["short"] += 1; continue
        if boilerplate_counts[line] > 20:
            stats["boilerplate"] += 1; continue
        if gurmukhi_share(line) < 0.5:
            stats["other_language"] += 1; continue
        masked = EMAIL.sub("[EMAIL]", PHONE.sub("[PHONE]", line))
        if masked != line: stats["masked_pii"] += 1
        kept.append(masked)
    return kept, stats

kept, stats = clean_lines(raw_lines, Counter(raw_lines))
print(len(kept), "kept;", dict(stats))`,
      lines: [
        { code: "if boilerplate_counts[line] > 20:", say: "A line that appears identically on more than twenty pages is navigation or legal text, not writing." },
        { code: "if gurmukhi_share(line) < 0.5:", say: "Lines where under half the letters are Gurmukhi are mostly another language; code-switched Punjabi lines with a few English words pass." },
        { code: "masked = EMAIL.sub(\"[EMAIL]\", PHONE.sub(\"[PHONE]\", line))", say: "Phone numbers and emails are replaced with placeholders rather than dropping the line, so the language is kept and the data is not." },
        { code: "print(len(kept), \"kept;\", dict(stats))", say: "Always report what each filter removed. A filter that drops 60% of lines deserves a look." },
      ],
      note: "Per-line language identification, OCR scoring and machine-translation detection are added as further filters in the same loop. Each one logs its count.",
    },
    useIt: "Build a cleaning pipeline with one filter per problem, in order, each logging how much it removed; calibrate thresholds on hand-checked samples; mask rather than drop lines with personal data; and review rejected samples to confirm you removed damage and not dialect, slang or code-switching.",
    takeaways: ["Raw Punjabi crawls are mostly boilerplate, wrong languages and damage; cleaning matters more for a scarce language.", "Filters: boilerplate, language per line, encoding, OCR quality, machine translation, personal data.", "Keep natural variation; remove what is not Punjabi or not language.", "Log every filter's removals and review what was dropped."],
    terms: [["boilerplate", "repeated page furniture such as menus and footers"], ["OCR", "optical character recognition: turning scanned images into text, imperfectly"], ["machine-translated text", "text produced by a translation system, fluent but unnatural, which poisons a corpus"]],
    reflect: { q: "Your language filter drops lines with under 50% Gurmukhi letters. What legitimate Punjabi does it lose?", a: "Heavily code-switched messages ('ਮੇਰਾ order delivery date change ਕਰ ਦੋ') and Romanised Punjabi entirely. Keep a separate path for those: a word-level tagger or function-word detection, so the corpus reflects how people write." },
  },

  "m44-punjabi-dataset-deduplication": {
    simple: "Deduplication removes exact and near-identical documents so the model does not memorise repeated text and so test data never overlaps training data; for Punjabi it must run after normalisation and per script.",
    concept:
      "Web corpora repeat themselves: syndicated news articles, quoted scripture, copied product descriptions, the same forum post mirrored on five sites. **Deduplication** finds and removes copies. Exact duplicates are found by hashing normalised text. Near-duplicates (the same article with a different headline or a few changed words) need similarity: shingling the text into overlapping word n-grams and comparing sets, made fast at scale with MinHash signatures.\n\nFor Punjabi two details matter. Normalise first, or the same article in precomposed and decomposed nukta forms counts as two. And deduplicate within and across scripts carefully: a Gurmukhi article and its Shahmukhi transliteration are the same content for a reader but different training signal; most teams keep both, deliberately.\n\nDeduplication also protects evaluation: if a test sentence or its near-copy is in the training set, the score is inflated. Cross-split deduplication is mandatory before any number is reported.",
    why:
      "Repeated text makes a model memorise rather than generalise, wastes training compute, and for a small corpus can make one site's style dominate. Duplicates across train and test produce scores that are not real. In a language with little data, a few heavily mirrored sources can be a large fraction of the corpus; one team found that 18% of a Gurmukhi crawl was copies of a handful of religious texts.",
    how: [
      "Normalise all text (lesson 44.6) and hash each document; drop exact duplicates, keeping the copy with the best provenance.",
      "Shingle each document into word 5-grams (or character n-grams for short texts); compute MinHash signatures.",
      "Use locality-sensitive hashing to find candidate pairs; compute Jaccard similarity for candidates; merge documents above a threshold (0.8 is common).",
      "Deduplicate across splits: remove any training document that is a near-duplicate of a test or validation document.",
      "Record what was removed and why; duplicates of scripture or law may be legitimate to keep once with a note.",
    ],
    visual: {
      kind: "flow",
      steps: ["normalise", "exact hash → drop identical", "shingle into word 5-grams", "MinHash signature per document", "LSH buckets → candidate pairs", "Jaccard ≥ 0.8 → merge", "cross-split check: nothing in train near test"],
      caption: "Exact duplicates are cheap; near-duplicates need signatures. The final check protects your evaluation numbers.",
    },
    everyday: {
      title: "The same forward, fifty times",
      text: "In a family WhatsApp group the same Gurmukhi good-morning message arrives from twelve relatives, sometimes with a different emoji or a changed name. If you were learning Punjabi from that group, you would learn that one message very well and little else. A corpus full of mirrored news and forwarded texts teaches a model the same way. Deduplication keeps one copy of the forward.",
    },
    engineering: {
      title: "Inflated scores from leaked test data",
      text: "A Punjabi sentiment model reported 94% accuracy, far above anything published. Investigation found the test set had been sampled from the same review scrape as the training set, and 23% of test reviews had near-duplicates in training (the site showed the same review on several product pages). After cross-split deduplication at Jaccard 0.7, test accuracy was 81%. The team added the cross-split check to the data pipeline so no number could be reported without it, and published both figures with the explanation.",
    },
    maths: {
      formula: "Jaccard(A, B) = |A ∩ B| ÷ |A ∪ B|  over the sets of shingles;   P(MinHash values agree) = Jaccard(A, B)",
      meaning: "Jaccard measures how much two documents' shingle sets overlap. MinHash lets you estimate it from a short signature instead of comparing whole sets, which is what makes deduplication feasible on millions of documents.",
      worked: [
        "Two short texts shingled into word 3-grams. A: {ਮੈਂ ਕੱਲ੍ਹ ਘਰ, ਕੱਲ੍ਹ ਘਰ ਜਾ, ਘਰ ਜਾ ਰਿਹਾ, ਜਾ ਰਿਹਾ ਹਾਂ}. B: {ਮੈਂ ਕੱਲ੍ਹ ਘਰ, ਕੱਲ੍ਹ ਘਰ ਜਾ, ਘਰ ਜਾ ਰਹੀ, ਜਾ ਰਹੀ ਹਾਂ} (feminine form).",
        "Intersection = 2 shingles; union = 6. Jaccard = 2 ÷ 6 ≈ 0.33: related, not duplicates. Keep both.",
        "A and A′ = A with one emoji appended: shingles identical except one new 3-gram. Intersection 4, union 5. Jaccard = 0.8 → merge.",
        "With 128 MinHash values, the estimate of 0.8 has a standard error of about √(0.8 × 0.2 ÷ 128) ≈ 0.035, precise enough for a 0.8 threshold.",
      ],
    },
    code: {
      title: "Near-duplicate detection with MinHash",
      lang: "py",
      src: `from datasketch import MinHash, MinHashLSH

def shingles(text, n=5):
    words = text.split()
    return {" ".join(words[i:i + n]) for i in range(max(1, len(words) - n + 1))}

def signature(text, num_perm=128):
    m = MinHash(num_perm=num_perm)
    for s in shingles(text):
        m.update(s.encode("utf-8"))
    return m

lsh = MinHashLSH(threshold=0.8, num_perm=128)
signatures = {}
duplicates = []
for doc_id, text in normalised_docs:            # already normalised, exact duplicates already removed
    sig = signature(text)
    near = lsh.query(sig)
    if near:
        duplicates.append((doc_id, near[0]))     # drop doc_id, keep the earlier one
        continue
    lsh.insert(doc_id, sig)
    signatures[doc_id] = sig

print(len(signatures), "unique;", len(duplicates), "near-duplicates dropped")`,
      lines: [
        { code: "return {\" \".join(words[i:i + n]) for i in range(max(1, len(words) - n + 1))}", say: "Word 5-grams as the shingles. Two documents sharing most 5-grams are copies with small edits." },
        { code: "m.update(s.encode(\"utf-8\"))", say: "Each shingle is hashed into the MinHash signature; 128 values stand in for the whole set." },
        { code: "lsh = MinHashLSH(threshold=0.8, num_perm=128)", say: "Locality-sensitive hashing finds candidates above 0.8 estimated Jaccard without comparing every pair." },
        { code: "duplicates.append((doc_id, near[0]))     # drop doc_id, keep the earlier one", say: "Keep the first seen (or the one with the best provenance); record the pair so the decision can be audited." },
      ],
      note: "Run the same code with the test set inserted first and the training set queried against it to remove cross-split leaks.",
    },
    useIt: "Deduplicate after normalisation: exact by hash, near by MinHash at about 0.8 Jaccard, and always across splits before reporting any score. Decide deliberately whether Gurmukhi and Shahmukhi versions of one text are kept as separate training signal. Log every merge.",
    takeaways: ["Duplicates cause memorisation, wasted compute and inflated test scores.", "Exact duplicates by hash after normalisation; near-duplicates by shingles, MinHash and LSH.", "Cross-split deduplication is mandatory before any evaluation number.", "Decide and document policy for cross-script copies."],
    terms: [["shingle", "an overlapping n-gram of words used to compare documents"], ["MinHash", "a short signature whose agreement rate estimates Jaccard similarity"], ["Jaccard similarity", "intersection over union of two sets"]],
    reflect: { q: "Why must deduplication run after normalisation rather than before?", a: "Before normalisation, the same text with precomposed versus decomposed nukta letters, different digit sets or stray zero-width characters hashes differently and shingles differently, so copies survive. Normalise first, then everything that is the same text looks the same." },
  },

  "m44-dataset-annotation": {
    simple: "Annotation adds the labels a model learns from; for Punjabi it needs native-speaker annotators per script, written guidelines with hard cases settled, and agreement measured before the labels are trusted.",
    concept:
      "**Annotation** is the human work of attaching labels to examples: sentiment, intent, named entities, the correct answer to a question, the better of two replies. The labels are the ceiling of supervised learning (lesson 1.7): a model cannot be more accurate than the labels it learned from, and inconsistent labels teach it noise.\n\nFor Punjabi, annotation has extra requirements. Annotators must be native readers of the script they label: a Gurmukhi reader cannot label Shahmukhi, and someone who speaks Punjabi but reads only Roman letters cannot label Gurmukhi. Guidelines must settle Punjabi-specific hard cases: which script a mixed message counts as, how to label loanwords, how to treat dialect forms, whether honorifics (ਜੀ) affect sentiment. Agreement between annotators is measured (Cohen's kappa, lesson 44.9); low agreement means the guidelines, not the annotators, need work.\n\nThe process is iterative: write guidelines, label a pilot set with two annotators, measure agreement, discuss disagreements, revise the guidelines, then scale. A small gold set labelled by experts and triple-checked becomes the reference for evaluating everything, including the annotators.",
    why:
      "Labels are expensive, and for Punjabi the pool of qualified annotators is small. Spending that budget on vague guidelines produces labels nobody can trust and models nobody can evaluate. Good annotation turns the scarce resource of native speakers' judgement into a dataset that will be used for years, and the gold set is what makes every later quality number meaningful.",
    how: [
      "Define the label schema: the classes or structures, with definitions and three examples each, including Punjabi-specific edge cases.",
      "Recruit native-speaker annotators per script and dialect; train them on the guidelines with a practice set.",
      "Run a pilot: two annotators label the same 300 items; compute agreement; review every disagreement together.",
      "Revise the guidelines with the resolved cases; repeat the pilot until kappa is above 0.8.",
      "Scale with periodic overlap (say 10% of items double-labelled) to monitor drift; build a triple-checked gold set of a few hundred items for evaluation.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "schema", detail: "labels, definitions, examples, Punjabi edge cases (honorifics, loanwords, dialect, script)" },
        { label: "pilot", detail: "two native annotators × 300 items; kappa; disagreement review" },
        { label: "revise", detail: "guidelines updated with resolved cases; repeat until κ ≥ 0.8" },
        { label: "scale", detail: "single labels with 10% overlap; drift monitored weekly" },
        { label: "gold set", detail: "300–500 items, three annotators, adjudicated; frozen; used only for evaluation" },
      ],
      caption: "Most of the time is spent before scaling. That is where quality is decided.",
    },
    everyday: {
      title: "Marking exams fairly",
      text: "Two teachers marking the same essays give different grades until they agree on a marking scheme: what earns full marks, what loses them, how to treat a brilliant essay with bad spelling. After a few essays marked together, their grades converge. Annotation is marking at scale, and the marking scheme is the guideline document. Without it, every teacher grades a different exam.",
    },
    engineering: {
      title: "Sentiment labels for Punjabi app reviews",
      text: "A team labelled 8,000 Punjabi app reviews for sentiment (positive, negative, neutral, mixed). The first pilot had kappa 0.58. Disagreements clustered on three cases: sarcasm ('ਬਹੁਤ ਵਧੀਆ, ਤੀਜੀ ਵਾਰ paisa kat gaya' — 'very good, money deducted for the third time'), reviews with a complaint and a thank-you, and short Romanised reviews with no clear polarity. The revised guidelines defined 'mixed', ruled sarcasm by the complaint, and allowed 'neutral' for unclear short text. The second pilot reached kappa 0.84. A 400-review gold set was triple-labelled and adjudicated; the model's reported accuracy is always against that set, with the kappa quoted next to it.",
    },
    maths: {
      formula: "Cohen's κ = (p₀ − pₑ) ÷ (1 − pₑ);  for more than two annotators use Fleiss' κ;  report κ alongside every labelled dataset",
      meaning: "Agreement corrected for chance. It tells readers of your results how reliable the labels are; a model cannot be expected to agree with labels more than the annotators agree with each other.",
      worked: [
        "Three-class sentiment, two annotators, 300 items. Observed agreement 246 ÷ 300 = 0.82.",
        "Annotator A's label shares: positive 0.40, negative 0.45, neutral 0.15. B's: 0.38, 0.47, 0.15. pₑ = 0.40×0.38 + 0.45×0.47 + 0.15×0.15 = 0.152 + 0.2115 + 0.0225 = 0.386.",
        "κ = (0.82 − 0.386) ÷ (1 − 0.386) = 0.434 ÷ 0.614 ≈ 0.71: acceptable, not strong. Review the disagreements before scaling.",
        "If the model later scores 85% against these labels, remember that annotators themselves agreed only 82% of the time; the model is at the human ceiling, and the next gain comes from better guidelines, not a bigger model.",
      ],
    },
    code: {
      title: "Compute agreement and list disagreements",
      lang: "py",
      src: `from collections import Counter

def cohen_kappa(labels_a, labels_b):
    n = len(labels_a)
    agree = sum(1 for a, b in zip(labels_a, labels_b) if a == b) / n
    ca, cb = Counter(labels_a), Counter(labels_b)
    expected = sum((ca[k] / n) * (cb[k] / n) for k in set(ca) | set(cb))
    return (agree - expected) / (1 - expected)

a = ["pos", "neg", "neu", "neg", "pos", "mixed", "neg", "pos", "neu", "neg"]
b = ["pos", "neg", "neu", "neg", "neg", "mixed", "neg", "pos", "pos", "neg"]
print("kappa:", round(cohen_kappa(a, b), 2))

for i, (x, y) in enumerate(zip(a, b)):
    if x != y:
        print("item", i, "A:", x, "B:", y, "->", texts[i])`,
      lines: [
        { code: "agree = sum(1 for a, b in zip(labels_a, labels_b) if a == b) / n", say: "Observed agreement: the share of items both annotators labelled the same." },
        { code: "expected = sum((ca[k] / n) * (cb[k] / n) for k in set(ca) | set(cb))", say: "Chance agreement from each annotator's label frequencies." },
        { code: "return (agree - expected) / (1 - expected)", say: "Kappa: how much better than chance. Report it with the dataset." },
        { code: "print(\"item\", i, \"A:\", x, \"B:\", y, \"->\", texts[i])", say: "The disagreements are the guideline's to-do list. Read every one." },
      ],
      output: "kappa: 0.72\nitem 4 A: pos B: neg -> ਬਹੁਤ ਵਧੀਆ, ਤੀਜੀ ਵਾਰ paisa kat gaya\nitem 8 A: neu B: pos -> theek hai ji",
    },
    useIt: "Before labelling Punjabi data at scale: write guidelines with Punjabi-specific hard cases, recruit native readers per script, run double-labelled pilots until kappa exceeds 0.8, keep 10% overlap while scaling, and build a frozen, adjudicated gold set for evaluation. Publish kappa with every dataset and every model score.",
    takeaways: ["Labels are the ceiling; inconsistent labels teach noise.", "Native readers per script; guidelines that settle sarcasm, honorifics, loanwords, dialect and mixed script.", "Pilot, measure kappa, revise, repeat; scale with overlap; freeze a gold set.", "Report agreement next to accuracy; a model cannot beat its labels."],
    terms: [["annotation guidelines", "the written rules annotators follow, with examples of hard cases"], ["gold set", "a small, expert-labelled, adjudicated set used only for evaluation"], ["adjudication", "resolving annotator disagreements by discussion or a senior annotator"]],
    reflect: { q: "Kappa is 0.85 but the model only reaches 70% on the gold set. Where is the problem?", a: "In the model or the training data, not the labels: annotators agree strongly, so the task is well defined. Check whether the training labels came from the same guidelines, whether the training set matches the gold set's script and dialect mix, and whether the model's tokeniser handles the script." },
  },

  "m44-training-and-test-splits-for-punjabi": {
    simple: "Splitting data into training, validation and test sets must keep the test honest: no leaks, the same script and dialect mix as real traffic, and frozen once chosen.",
    concept:
      "Models are trained on one part of the data and judged on another they never saw (lesson 4.8). The **split** decides whether the judgement is honest. For Punjabi, three things make a naive random split dishonest. Leakage: near-duplicate sentences, or many messages from the same user, end up on both sides, so the test measures memory. Imbalance: a random split from a Gurmukhi-heavy corpus gives a test set that barely contains Shahmukhi, Romanised or Malwai examples, so their scores are noise. Drift: real traffic changes over time, so a test set from the same months as training over-estimates future performance.\n\nThe remedies: deduplicate across splits; split by group (user, document, source) rather than by sentence; stratify so each script, dialect and mixing level has enough test examples to measure; use a time-based split when the product's data has a timeline; and freeze the test set, with a version, so every model is compared on the same questions. The validation set, used for choosing settings during training, follows the same rules and is separate from the test set.",
    why:
      "An honest test set is the only thing standing between a team and self-deception. A leaked or unbalanced split produces a high number that collapses in production, usually for exactly the users with the least representation. For Punjabi, where the interesting cases (Shahmukhi, Romanised, dialect) are the minority of the corpus, stratification is what makes their scores exist at all.",
    how: [
      "Define the groups that must not straddle splits: user id, document id, source site, conversation.",
      "Deduplicate within and across groups (lesson 44.12).",
      "Choose the split type: group-based random for static corpora, time-based for product data (train on earlier months, test on later).",
      "Stratify by script, dialect and mixing level so the test set has at least a few hundred examples of each you intend to report.",
      "Freeze the test set with a version number; never train on it; rebuild only when the traffic distribution has clearly changed, and bump the version.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Split", "Share", "How chosen", "Used for"],
        rows: [
          ["training", "~80%", "everything not in validation or test, by group", "fitting the model"],
          ["validation", "~10%", "group-based, stratified", "choosing settings, early stopping"],
          ["test", "~10% (min. a few hundred per stratum)", "group-based, stratified, time-aware, frozen, versioned", "the one reported number per script and dialect"],
          ["gold set (within test)", "300–500 items", "triple-annotated (lesson 44.13)", "the reference for the headline score"],
        ],
      },
      caption: "The shares are conventions; the rules (no leaks, stratified, frozen) are not negotiable.",
    },
    everyday: {
      title: "Practice papers and the real exam",
      text: "A student who sees the real exam questions during practice scores well and learns nothing. A student who practises only on easy, familiar topics is shocked by the exam's hard section. Honest preparation keeps the exam sealed and makes practice cover every topic in the proportions the exam will have. The test set is the sealed exam, stratified so that Shahmukhi and Romanised questions are on it in numbers that count.",
    },
    engineering: {
      title: "A time-based split that predicted the drop",
      text: "A Punjabi intent classifier for a utility company's chatbot was first evaluated on a random split: 89%. The team re-split by time (train on January to August, test on September and October) and by conversation: 81%. The eight-point difference was real: new billing terms, a new app version and monsoon-season queries had shifted the language. They stratified the test set to guarantee 400 Romanised and 300 Shahmukhi conversations, which the random split had under-represented, and found Shahmukhi at 64%. The frozen test set v2 became the release gate; every month's new conversations feed a candidate v3, used only after the current version is retired.",
    },
    maths: {
      formula: "standard error of an accuracy estimate ≈ √(p(1 − p) ÷ n);  choose n per stratum so the error is small enough to see the changes you care about",
      meaning: "A score measured on few examples is noisy. The error shrinks with the square root of the number of test examples in that stratum, which is why small strata need deliberate stratification.",
      worked: [
        "Shahmukhi stratum with n = 40 examples, measured accuracy p = 0.64: standard error ≈ √(0.64 × 0.36 ÷ 40) ≈ √0.00576 ≈ 0.076. The true value could easily be 0.56 or 0.72; a 5-point improvement would be invisible.",
        "With n = 300: error ≈ √(0.2304 ÷ 300) ≈ 0.028. A 5-point change is now about two standard errors: detectable.",
        "Rule of thumb: at least 300 test examples per stratum you intend to report; a thousand if you need to see 2-point changes.",
      ],
    },
    code: {
      title: "A grouped, stratified, time-aware split",
      lang: "py",
      src: `import hashlib
from collections import defaultdict

def bucket(group_id, test_share=0.1, val_share=0.1):
    h = int(hashlib.sha256(group_id.encode("utf-8")).hexdigest(), 16) % 1000 / 1000
    if h < test_share: return "test"
    if h < test_share + val_share: return "validation"
    return "train"

splits = defaultdict(list)
counts = defaultdict(lambda: defaultdict(int))
for row in rows:                                  # each row: text, user_id, script, dialect, month
    if row["month"] >= "2026-09":                 # the latest months are test-only, whatever the hash says
        name = "test"
    else:
        name = bucket(row["user_id"])
    splits[name].append(row)
    counts[name][(row["script"], row["dialect"])] += 1

for stratum, n in sorted(counts["test"].items()):
    flag = "" if n >= 300 else "   <-- too few to report; collect more"
    print("test", stratum, n, flag)`,
      lines: [
        { code: "h = int(hashlib.sha256(group_id.encode(\"utf-8\")).hexdigest(), 16) % 1000 / 1000", say: "Hashing the group id (here the user) gives a stable, reproducible split: all of one user's messages land on the same side." },
        { code: "if row[\"month\"] >= \"2026-09\":                 # the latest months are test-only, whatever the hash says", say: "A time component: the most recent data is never trained on, so the test reflects what the model will face next." },
        { code: "counts[name][(row[\"script\"], row[\"dialect\"])] += 1", say: "Count each stratum in the test set. This is the stratification check." },
        { code: "flag = \"\" if n >= 300 else \"   <-- too few to report; collect more\"", say: "A stratum under 300 examples cannot support a reported score; the fix is collecting, not reporting a noisy number." },
      ],
      note: "Freeze the resulting test set as a file with a version in its name. The split function and its inputs are part of the dataset's provenance.",
    },
    useIt: "Split Punjabi data by group and time, deduplicate across splits, stratify so every script and dialect you report has at least a few hundred test examples, freeze and version the test set, and never let training touch it. Report scores per stratum with their sample sizes.",
    takeaways: ["A naive random split leaks (same user, near-duplicates) and under-represents minority scripts and dialects.", "Split by group and time; deduplicate across splits; stratify by script, dialect and mixing level.", "At least 300 test examples per reported stratum; the standard error says why.", "Freeze and version the test set; it is the release gate."],
    terms: [["data leakage", "test information reaching the training set, inflating scores"], ["stratified split", "a split that guarantees each subgroup is represented in every part"], ["time-based split", "training on earlier data and testing on later data to mimic deployment"]],
    reflect: { q: "Your Romanised Punjabi test stratum has 45 examples and accuracy 0.71. A colleague reports 'Romanised accuracy 71%'. What is wrong with that sentence?", a: "The standard error is about ±0.07, so the true accuracy could plausibly be anywhere from the low 60s to the high 70s; the figure should be reported with its sample size and uncertainty, or the stratum should be grown to a few hundred examples before it is reported at all." },
  },
};

export const M44_QUIZ: Quiz[] = [
  {
    q: "A search index stores ਸ਼ਹਿਰ with the precomposed letter ਸ਼ and a query arrives as ਸ + nukta. What fixes the miss?",
    options: ["A bigger index", "Unicode NFC normalisation on both index and query", "Lowercasing", "Removing the nukta from everything"],
    answer: 1,
    why: ["Size is irrelevant.", "Correct. Equivalent sequences become one sequence; Gurmukhi NFC yields the two-code-point form for both.", "Gurmukhi has no case.", "The nukta changes meaning (ਸ vs ਸ਼); removing it merges different words."],
    reason: true,
  },
  {
    q: "Why does a standard language detector tag most Shahmukhi Punjabi as Urdu?",
    options: ["Shahmukhi is Urdu", "The letters are shared; only vocabulary and grammar differ, and the detector looks at characters", "Punjabi has no script", "Detectors do not support Arabic script"],
    answer: 1,
    why: ["Different language, same letters.", "Correct. Detection must use function words and spellings specific to Punjabi.", "No.", "They support it; they cannot tell the languages apart by it."],
  },
  {
    q: "Which is the best source of Romanised Punjabi training data?",
    options: ["Transliterating the Gurmukhi corpus with rules", "Real messages from your own channels, with consent and anonymisation", "English text", "Shahmukhi text"],
    answer: 1,
    why: ["Rules produce one tidy spelling per word; users produce many.", "Correct. Real spelling habits only exist in real messages.", "No.", "Different script entirely."],
  },
  {
    q: "The word ਗੱਲ (talk) and ਗਲ (cheek) differ by one addak. What should a fuzzy matcher do?",
    options: ["Always merge them; the difference is one mark", "Treat addak differences as cheap but let a minimal-pair dictionary block this merge", "Never use fuzzy matching", "Remove all addaks first"],
    answer: 1,
    why: ["They are different words.", "Correct. Cheap edits for commonly varying marks, with a dictionary of real minimal pairs as the override.", "Fuzzy matching is needed for the long tail of variants.", "That merges many distinct words."],
    reason: true,
  },
  {
    q: "A model trained on Jalandhar-area text scores 88% there and 71% in Bathinda. What is the most likely cause and fix?",
    options: ["Bathinda users type badly; ignore it", "Dialect imbalance (Malwai forms); collect and tag Malwai data, evaluate per dialect", "The model is too small", "Bathinda has worse internet"],
    answer: 1,
    why: ["Users are the product.", "Correct. Measure per dialect; prioritise by gap × user share.", "Size does not create dialect knowledge.", "Irrelevant."],
  },
  {
    q: "Two annotators agree on 80% of items but kappa is 0.56. What does that mean?",
    options: ["The labels are excellent", "Much of the agreement is chance; the guidelines are unclear and need revision before scaling", "One annotator should be fired", "Kappa is broken"],
    answer: 1,
    why: ["Raw agreement overstates reliability.", "Correct. Review disagreements, fix guidelines, re-pilot until kappa is above 0.8.", "Disagreement is a guideline problem first.", "No."],
  },
  {
    q: "A test set sampled randomly from the same scrape as training gives 94% accuracy; after cross-split deduplication it gives 81%. Which number is real?",
    options: ["94%, it is higher", "81%; the first was inflated by near-duplicate test items present in training", "The average", "Neither"],
    answer: 1,
    why: ["Higher is not truer.", "Correct. Leakage measured memory, not generalisation.", "No.", "81% is the honest one."],
  },
  {
    q: "Why run deduplication after normalisation rather than before?",
    options: ["It is faster", "Unnormalised copies differ in invisible ways (nukta encoding, zero-width characters) and would not be detected", "Normalisation deletes duplicates", "Order does not matter"],
    answer: 1,
    why: ["Speed is not the reason.", "Correct. Copies must look identical to be caught.", "It does not; it makes them identical.", "It matters."],
  },
  {
    q: "A test stratum has 45 Romanised examples. What should the report say?",
    options: ["'Romanised accuracy 71%'", "The score with its sample size and uncertainty, or nothing until the stratum has a few hundred examples", "Nothing; Romanised does not matter", "'Romanised accuracy 100%'"],
    answer: 1,
    why: ["The standard error is about ±7 points; the bare number misleads.", "Correct. Small strata need more data before their scores mean anything.", "It is the most common form of real input.", "No."],
  },
];

export const M44_EXERCISES: Exercise[] = [
  {
    title: "Write the normaliser specification",
    kind: "think",
    task: "List, in order, the steps of a Punjabi normaliser for a support assistant that receives Gurmukhi, Shahmukhi and Romanised input, and state for each step whether it applies to matching only or also to text shown back to the user.",
    hints: ["NFC before anything script-specific.", "Users should see their own spelling and digits in replies."],
    solution: "1. UTF-8 strict decode (both). 2. NFC (both). 3. Strip zero-width characters, BOM, soft hyphen, tatweel (both). 4. Gurmukhi: sihari reordering (both); digits ੦–੯ → 0–9 (matching only). 5. Shahmukhi: ي→ی, ك→ک, heh variants with a word-list exception (both); Arabic-Indic digits → 0–9 (matching only); ؟ → ? (matching only). 6. Romanised: lowercase, collapse repeated letters, variant map (matching only; replies use the canonical form). 7. Collapse whitespace (both). Version the normaliser; store the version with every index and dataset.",
  },
  {
    title: "Compute kappa and decide",
    kind: "calculate",
    task: "Two annotators label 500 Shahmukhi reviews as positive/negative. Both say positive on 210, both negative on 190, and they disagree on 100. Annotator A labels 270 positive overall; B labels 250 positive. Compute observed agreement, expected agreement and kappa, and say whether to scale annotation.",
    hints: ["p₀ = agreements ÷ total.", "pₑ = P(A pos)·P(B pos) + P(A neg)·P(B neg)."],
    solution: "p₀ = 400 ÷ 500 = 0.80. P(A pos) = 0.54, P(B pos) = 0.50; P(A neg) = 0.46, P(B neg) = 0.50. pₑ = 0.54×0.50 + 0.46×0.50 = 0.27 + 0.23 = 0.50. κ = (0.80 − 0.50) ÷ (1 − 0.50) = 0.60. Below 0.8: do not scale yet; review the 100 disagreements, revise the guidelines (likely sarcasm, mixed reviews, short Romanised text), and re-pilot.",
  },
  {
    title: "Plan a crawl for a Shahmukhi corpus",
    kind: "calculate",
    task: "You need 300,000 usable Shahmukhi sentences. From a pilot: 5% of Urdu-tagged crawled sentences are Punjabi, 35% of sources have a usable licence, and 20% of what remains are near-duplicates. How many sentences must you crawl? What single change to the plan reduces that most?",
    hints: ["Multiply the survival rates.", "Which factor is under your control?"],
    solution: "Survival = 0.05 × 0.35 × 0.80 = 0.014. Crawl ≈ 300,000 ÷ 0.014 ≈ 21.4 million sentences. The licence factor is the most changeable: negotiating permission with the largest Punjabi-heavy sites could lift 0.35 to 0.7, halving the crawl to about 10.7 million; targeting known Punjabi-literature sites also raises the 5% Punjabi rate.",
  },
  {
    title: "Build the split for a chatbot dataset",
    kind: "code",
    task: "You have 120,000 chatbot conversations with user id, script, dialect and month. Write pseudocode or Python for a split that (a) keeps each user on one side, (b) reserves the last two months for test, (c) guarantees at least 300 test conversations for each of Gurmukhi, Shahmukhi and Romanised, and (d) is reproducible. Say what you do if a stratum falls short.",
    hints: ["Hash the user id for stability.", "Count strata after splitting; if short, move whole users from train to test, not individual messages."],
    solution: "Hash user_id → bucket (test 10%, validation 10%, train 80%); override to test for conversations in the last two months. Count test conversations by script. If a script has fewer than 300, iterate over train users with that script (sorted by hash for reproducibility) and move entire users into test until the count reaches 300, then re-run cross-split deduplication. Save the split as a versioned file listing conversation ids per split; freeze it. Report per-script scores with counts.",
  },
];
