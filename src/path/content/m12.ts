import type { Exercise, LessonBody, Quiz } from "../types";

// Module 12: Tokenisation. One concept per lesson.
// Keys are lesson slugs: m12-<kebab of the concept title>.

export const M12_BODIES: Record<string, LessonBody> = {
  "m12-tokens": {
    simple: "A token is the unit a model actually reads and writes: often a word, sometimes a piece of a word, sometimes punctuation. Prices, limits and speeds are all counted in tokens.",
    concept:
      "A model never sees letters or words. It sees a sequence of numbered units called **tokens**. A tokeniser cuts text into those units and gives each one a number. 'The cat sat' might become three tokens; 'unbelievable' might become three tokens too ('un', 'believ', 'able'); a full stop is usually its own token; a rare name becomes several small pieces.\n\nTokens are the model's alphabet. Its vocabulary is the fixed list of tokens it knows, typically between 30,000 and 250,000 of them. Everything it reads is made of those, and everything it writes is chosen from them, one at a time. That is why the context window (how much a model can read), the price (per million tokens), and the speed (tokens per second) are all counted in tokens: a token is the model's step.\n\nA useful rule of thumb for English: one token is about three-quarters of a word, so 100 words is about 130 tokens. Other languages and code are different, often costlier, and the next lessons explain why.",
    why:
      "Words are the wrong unit for a model. There are millions of them, new ones appear daily, misspellings are infinite, and other languages glue words together or have no spaces at all. Characters are the wrong unit too: a sentence becomes hundreds of items, and each one means almost nothing on its own.\n\nTokens sit between the two. A fixed, medium-sized vocabulary of word pieces can spell any text, including words never seen before, while keeping common words as single units. That compromise is why every modern language model is built on tokens, and why understanding them explains so much about what models can and cannot do.",
    how: [
      "A tokeniser is trained once on a large corpus: it learns which pieces of text are common enough to deserve their own token.",
      "At run time, input text is cut into the longest matching pieces from that vocabulary.",
      "Each piece is replaced by its number (its token ID).",
      "The model reads the sequence of IDs and produces, one step at a time, the ID of the next token.",
      "The output IDs are mapped back to their text pieces and joined.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Tokens (illustrative)", "Count"],
        rows: [
          ["The cat sat.", "The | cat | sat | .", "4"],
          ["unbelievable", "un | believ | able", "3"],
          ["Nguyen", "N | gu | yen", "3"],
          ["ਕਿਤਾਬ (book, Punjabi)", "ਕ | ਿ | ਤ | ਾ | ਬ", "5 (often one per character or byte)"],
          ["def add(a, b):", "def | add | ( | a | , | b | ):", "7"],
        ],
      },
      caption: "Common English words are one token each. Rare words, names, other scripts and code break into more pieces, and cost more.",
    },
    everyday: {
      title: "Lego bricks, not sculptures",
      text: "A Lego set does not contain a brick for every possible shape. It has a few hundred brick types that can be combined into anything. Tokens are the bricks: common words are big single bricks, rare words are built from smaller ones, and the model's vocabulary is the parts box. You can build any word, but unusual words need more bricks.",
    },
    engineering: {
      title: "Why the Japanese customers cost three times as much",
      text: "A support team added a chat assistant and watched the bill. Japanese conversations cost about three times as much as English ones for the same number of characters, and hit the context limit sooner. The reason was tokens: the tokeniser had been trained mostly on English, so Japanese characters were split into many pieces. The fix was partly a model with a more multilingual tokeniser, and partly budgeting: context limits and prices were set per token, so the team now counts tokens per language in its cost model instead of assuming words.",
    },
    maths: {
      formula: "tokens ≈ words × 1.3 (English prose);   cost = tokens × price per token",
      meaning: "A rough conversion for English; the real count comes from the tokeniser. Everything downstream (cost, context, speed) multiplies the token count.",
      worked: [
        "A 1,500-word support article ≈ 1,500 × 1.3 ≈ 1,950 tokens.",
        "At a price of 3 per million input tokens: 1,950 ÷ 1,000,000 × 3 = 0.00585 per read of the article.",
        "Reading it 20,000 times a day: 20,000 × 0.00585 ≈ 117 per day. Shorten the article to 800 words and the daily cost roughly halves.",
        "A context window of 8,000 tokens holds about 6,000 English words, or far fewer words of a language the tokeniser splits finely.",
      ],
    },
    code: {
      title: "Counting tokens with a real tokeniser",
      lang: "py",
      src: `# pip install tokenizers  (Hugging Face)
from tokenizers import Tokenizer

tok = Tokenizer.from_pretrained("bert-base-uncased")

for text in ["The cat sat.", "unbelievable", "Nguyen", "def add(a, b):"]:
    enc = tok.encode(text)
    print(len(enc.tokens), enc.tokens)`,
      lines: [
        { code: "tok = Tokenizer.from_pretrained(\"bert-base-uncased\")", say: "A trained tokeniser is downloaded with its vocabulary. Different models have different tokenisers; counts differ between them." },
        { code: "enc = tok.encode(text)", say: "Text in, tokens out: the cut pieces and their IDs." },
        { code: "print(len(enc.tokens), enc.tokens)", say: "The count is what you pay for and what fills the context window. The pieces show why." },
      ],
      output: "6 ['[CLS]', 'the', 'cat', 'sat', '.', '[SEP]']\n5 ['[CLS]', 'unbelievable', '[SEP]']\n4 ['[CLS]', 'nguyen', '[SEP]']\n9 ['[CLS]', 'def', 'add', '(', 'a', ',', 'b', ')', ':', '[SEP]']",
      note: "This tokeniser happens to know 'unbelievable' and 'nguyen' whole; another may split them. The [CLS] and [SEP] markers are special tokens, covered later in this module.",
    },
    useIt: "Count tokens, not words, when estimating cost, choosing a context limit, chunking documents, or comparing languages. Use the tokeniser of the model you call; counts differ between models. Expect non-English text, code and rare names to cost more per character.",
    takeaways: ["A token is the model's unit: often a word, often a word piece, sometimes a character.", "Vocabulary = the fixed set of tokens; everything is spelled from it.", "Cost, context window and speed are all measured in tokens.", "English ≈ 1.3 tokens per word; other scripts and code are usually costlier."],
    terms: [["token", "the unit of text a model reads and writes"], ["tokeniser", "the program that cuts text into tokens and maps them to IDs"], ["vocabulary (tokens)", "the fixed list of tokens a model knows"]],
    reflect: { q: "Two prompts have the same number of characters: one in English, one in Hindi. Why might the Hindi one hit the context limit first?", a: "The tokeniser was trained mostly on English, so English words are single tokens while Hindi characters split into several tokens each. Same characters, more tokens, less room in the window and a higher bill." },
  },

  "m12-word-based-tokenisation": {
    simple: "Word-based tokenisation treats each word as one token, which is simple and readable but needs a huge vocabulary and still fails on any word it has not seen.",
    concept:
      "The most natural way to cut text is at spaces and punctuation: every word becomes a token. **Word-based tokenisation** is what the classic NLP pipeline did (Module 11), and it is what people mean when they say 'the model knows 50,000 words'.\n\nIt has two serious problems. The vocabulary explodes: English has hundreds of thousands of word forms, and plurals, tenses, typos and names add more without limit. A vocabulary of 50,000 words still leaves many sentences with words outside it. And anything outside the vocabulary becomes a single 'unknown' token, so 'Nguyen', 'unbelievably' and 'COVID-19' all collapse into the same meaningless symbol. The model cannot tell them apart or learn anything about them.\n\nThere is also no good definition of a word in many languages: Chinese and Japanese write without spaces, German and Turkish glue words together, and 'don't', 'New York' and 'e-mail' test the rules even in English.",
    why:
      "Word tokens are easy to understand and match how people think about text, which is why they came first. They still work well for count-based models over a known domain. But language models must handle open vocabulary: every name, every typo, every new word, every language. A method that maps all of those to 'unknown' throws away exactly the information that makes a sentence specific.\n\nThe lesson exists to show the failure clearly, because every later tokeniser is a response to it.",
    how: [
      "Split the text on whitespace.",
      "Separate punctuation from words ('sat.' → 'sat', '.').",
      "Apply language rules for contractions and compounds ('don't' → 'do', \"n't\").",
      "Look each word up in the vocabulary; replace unknown words with a single UNK token.",
      "Map each word to its ID.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "Word tokens", "Problem"],
        rows: [
          ["The cat sat.", "The, cat, sat, .", "fine"],
          ["Nguyen arrived.", "UNK, arrived, .", "the name is lost"],
          ["unbelievably cheap", "UNK, cheap", "'unbelievably' not in vocabulary though 'believe' is"],
          ["Donaudampfschiff", "UNK", "German compound: one 'word', four ideas"],
          ["我喜欢猫", "UNK (no spaces)", "no word boundaries to split on"],
        ],
      },
      caption: "Every row beyond the first hides information inside UNK. The model learns nothing from an UNK.",
    },
    everyday: {
      title: "A phrasebook with no spelling section",
      text: "A tourist phrasebook lists whole phrases. It is perfect until you need a word that is not in it, and then you have nothing: no way to build the word from parts. Word-based vocabularies are phrasebooks. Subword tokenisers, coming next, add the alphabet pages at the back.",
    },
    engineering: {
      title: "The customer-name problem in a chat classifier",
      text: "A bank trained an intent classifier with word tokens from its own transcripts. It worked on the test set and then failed on live traffic: customers mention their names, account products and local places, most of which had been seen zero times in training and became UNK. Two messages differing only in a product name produced identical token sequences. Moving to a subword tokeniser let unseen words keep their pieces ('Flexi', 'Saver') and the classifier recovered. The lesson the team wrote down: whole-word vocabularies freeze the world at training time.",
    },
    code: {
      title: "A word tokeniser and its UNK problem",
      lang: "py",
      src: `import re

VOCAB = {"the", "cat", "sat", "arrived", "cheap", "believe", ".", "do", "n't"}

def word_tokenise(text):
    words = re.findall(r"n't|\\w+|[^\\w\\s]", text.replace("n't", " n't").lower())
    return [w if w in VOCAB else "[UNK]" for w in words]

for t in ["The cat sat.", "Nguyen arrived.", "Unbelievably cheap", "Don't."]:
    print(t, "->", word_tokenise(t))`,
      lines: [
        { code: "words = re.findall(r\"n't|\\w+|[^\\w\\s]\", text.replace(\"n't\", \" n't\").lower())", say: "Split on word characters and punctuation, with one hand-written rule for contractions. Every language needs its own such rules." },
        { code: "return [w if w in VOCAB else \"[UNK]\" for w in words]", say: "Anything outside the vocabulary becomes the same token. 'Nguyen' and 'unbelievably' are now indistinguishable." },
      ],
      output: "The cat sat. -> ['the', 'cat', 'sat', '.']\nNguyen arrived. -> ['[UNK]', 'arrived', '.']\nUnbelievably cheap -> ['[UNK]', 'cheap']\nDon't. -> ['do', \"n't\", '.']",
      note: "Note that 'believe' is in the vocabulary and still cannot help with 'unbelievably'. Word tokens have no notion of parts.",
    },
    useIt: "Word tokenisation is still fine for count-based models (TF-IDF, bag of words) over a closed domain, and for readable features. Do not use it for language models or anything facing open vocabulary: names, typos, new terms, other languages.",
    takeaways: ["Word-based tokens: one word, one token; simple and readable.", "Vocabulary explodes and every unseen word becomes UNK, losing its information.", "Many languages have no clear word boundaries at all.", "Every later tokeniser exists to fix the UNK problem."],
    terms: [["word-based tokenisation", "cutting text into whole words as tokens"], ["UNK (unknown token)", "the single token used for any word outside the vocabulary"], ["open vocabulary", "the reality that new words keep appearing and must be handled"]],
    reflect: { q: "A word-level model has seen 'happy' and 'unhappy' but never 'unhappily'. What does it know about 'unhappily'?", a: "Nothing. It becomes UNK, with no link to 'unhappy' or 'happy', despite sharing almost all its letters. A tokeniser that cuts into pieces ('un', 'happ', 'ily') would hand the model those links for free." },
  },

  "m12-character-based-tokenisation": {
    simple: "Character-based tokenisation makes every character a token: the vocabulary is tiny and nothing is ever unknown, but sequences become very long and each token carries almost no meaning.",
    concept:
      "The opposite extreme from words is to cut at every character. **Character-based tokenisation** gives the model an alphabet-sized vocabulary (a few hundred symbols, or 256 if you work on bytes) and spells everything from it. There is no UNK: any word, name, typo or script can be written, because every character is in the vocabulary.\n\nThe price is length and meaning. 'The cat sat' is 11 tokens instead of 3; a 500-word paragraph is around 3,000 tokens. The model must read five times as many steps to cover the same text, attention costs grow with the square of the length (Stage 4), and the context window fills five times faster. And a single character means almost nothing: the model has to learn, from scratch, that 'c', 'a', 't' in a row is an animal, and relearn similar facts for every word.\n\nCharacter and byte tokenisation survive in specific places: models for languages without spaces, speech and OCR systems, and as the fallback layer inside subword tokenisers, which is where the next lesson goes.",
    why:
      "Word tokenisation fails on anything unseen; character tokenisation cannot fail that way, which is why it was the first answer to the UNK problem. It also sidesteps every argument about where words begin and end, in any language, and it handles typos gracefully: 'recieve' and 'receive' share almost all their characters.\n\nIt exists as the reliable extreme, and the reason it is rarely used alone shows what a good tokeniser must balance: never unknown, but not so fine that sequences become unmanageable and tokens meaningless.",
    how: [
      "Define the vocabulary as every character (or every byte value, 0–255).",
      "Map each character of the input to its ID; no lookup can fail.",
      "Feed the long sequence to the model, which must learn word-level patterns across many positions.",
      "On output, generate one character at a time and join them.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Word tokens", points: ["'The cat sat' → 3 tokens", "vocabulary: hundreds of thousands", "unseen word → UNK", "each token carries a whole word's meaning"] },
      right: { title: "Character tokens", points: ["'The cat sat' → 11 tokens", "vocabulary: a few hundred", "nothing is ever unknown", "each token carries almost no meaning; sequences are long"] },
      caption: "Two extremes. Subword tokenisation (next) takes the middle: short sequences, no UNK.",
    },
    everyday: {
      title: "Spelling everything out",
      text: "Imagine dictating a letter to someone who can only write one letter at a time and has never heard of words. They will never misunderstand a name, and they will never finish the letter before lunch. That is character tokenisation: perfectly general, painfully slow, and with all the understanding left to the listener.",
    },
    engineering: {
      title: "OCR for shipping labels",
      text: "A logistics company reads handwritten and printed addresses from parcel photos. The recognition model works character by character, because labels contain every kind of name, postcode and abbreviation, in several scripts, and a word vocabulary would fail constantly. The output is then matched against an address database. Character level is right here because the inputs are short (a few lines) and open-ended; the team would never use it for reading the full customs documents, where sequences would be thousands of characters long.",
    },
    maths: {
      formula: "sequence length ≈ characters;   attention cost ∝ length²",
      meaning: "A character model's sequence is as long as the text in characters. Because attention compares every position with every other, cost grows with the square of that length.",
      worked: [
        "A 500-word English paragraph ≈ 2,800 characters (including spaces) ≈ 650 subword tokens.",
        "Character tokens: 2,800 positions. Subword: 650. Ratio ≈ 4.3×.",
        "Attention cost ratio ≈ 4.3² ≈ 18.5×. The same paragraph costs roughly eighteen times more attention compute at character level.",
        "An 8,000-token context holds about 8,000 characters ≈ 1,400 words at character level, versus about 6,000 words with subwords.",
      ],
    },
    code: {
      title: "Character and byte tokenisation in two lines",
      lang: "py",
      src: `text = "Nguyen sat. ਕਿਤਾਬ"

chars = list(text)                       # one token per character
bytes_ = list(text.encode("utf-8"))      # one token per byte: vocabulary of 256

print(len(chars), chars)
print(len(bytes_), bytes_[:8], "...")`,
      lines: [
        { code: "chars = list(text)                       # one token per character", say: "The whole tokeniser. Nothing can be unknown; the sequence is as long as the text." },
        { code: "bytes_ = list(text.encode(\"utf-8\"))      # one token per byte: vocabulary of 256", say: "Working on bytes shrinks the vocabulary to 256 and makes every script spellable, at the cost of three tokens per Gurmukhi letter." },
      ],
      output: "17 ['N', 'g', 'u', 'y', 'e', 'n', ' ', 's', 'a', 't', '.', ' ', 'ਕ', 'ਿ', 'ਤ', 'ਾ', 'ਬ']\n27 [78, 103, 117, 121, 101, 110, 32, 115] ...",
      note: "17 characters became 27 bytes: the Punjabi word costs 15 bytes for 5 letters. Byte-level fallback is how subword tokenisers guarantee they can spell anything.",
    },
    useIt: "Use character or byte tokens for short, open-ended inputs (OCR, speech, names, DNA), for languages without word boundaries when no subword tokeniser exists, and as the fallback layer inside subword schemes. Avoid them for long text with a transformer; the sequence length is prohibitive.",
    takeaways: ["Character tokens: tiny vocabulary, nothing unknown, any script.", "Sequences are several times longer; attention cost grows with the square of length.", "Each token carries little meaning; the model must learn words from scratch.", "Used for short open inputs and as the fallback inside subword tokenisers."],
    terms: [["character-based tokenisation", "one token per character"], ["byte-level tokenisation", "one token per byte of the UTF-8 encoding; vocabulary of 256"], ["sequence length", "the number of tokens the model must process for one input"]],
    reflect: { q: "Why does a byte-level vocabulary of 256 guarantee no UNK, while a character vocabulary of a few hundred might not?", a: "Every possible text is a sequence of bytes, and all 256 byte values are in the vocabulary, so anything can be spelled. A character list is finite and can miss a rare symbol, emoji or script; the first time one appears, it is unknown." },
  },

  "m12-subword-tokenisation": {
    simple: "Subword tokenisation keeps common words whole and splits rare words into meaningful pieces, so the vocabulary stays medium-sized, nothing is unknown, and sequences stay short.",
    concept:
      "Words are too many and characters are too small. **Subword tokenisation** takes the middle: a vocabulary of a few tens of thousands of pieces, chosen so that frequent words are single tokens and rarer words are spelled from frequent fragments. 'cat' is one token. 'unbelievably' becomes 'un', 'believ', 'ably'. 'Nguyen' becomes 'N', 'gu', 'yen'. Every character is also in the vocabulary, so nothing is ever unknown.\n\nThe pieces are not chosen by a linguist. They are learned from a corpus by counting: the algorithms in the next lessons (BPE, WordPiece, Unigram) all start from characters and build up pieces that occur often. The result is a vocabulary tuned to the data it was trained on, which is why a tokeniser trained on English splits Hindi into many small pieces.\n\nThis is the design behind every modern language model's tokeniser. It fixes the UNK problem of words, keeps sequences about 1.3 tokens per English word rather than 5 characters, and gives the model a chance to see that 'unhappy' and 'unhappily' share pieces.",
    why:
      "Models need an open vocabulary and short sequences at the same time. Words give short sequences and fail on unseen text; characters never fail and give long sequences. Neither alone is acceptable for a model that must read any text in any language at reasonable cost.\n\nSubwords exist because frequency makes the compromise possible: most of the text people write is made of a few thousand common words, and the long tail can be spelled from parts. Choosing the pieces by counting lets one algorithm serve any language and any domain without hand-written rules.",
    how: [
      "Start with a vocabulary of all characters (or bytes), so anything can be spelled.",
      "Count how often pieces occur in a large training corpus.",
      "Repeatedly add the most useful larger piece (a frequent pair of existing pieces, or the piece that best explains the text) until the vocabulary reaches a target size, such as 32,000.",
      "At run time, cut each word into the longest pieces available in the vocabulary, left to right or by the best overall split.",
      "Mark pieces that continue a word (for example '##ably' or a leading '▁' for word starts) so text can be rebuilt exactly.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Word", "Subword tokens", "Why"],
        rows: [
          ["cat", "cat", "very frequent: one piece"],
          ["unbelievably", "un, believ, ably", "rare whole; made of common fragments"],
          ["Nguyen", "N, gu, yen", "rare name; small pieces, never UNK"],
          ["tokenization", "token, ization", "a frequent stem plus a frequent suffix"],
          ["ਕਿਤਾਬ", "ਕਿ, ਤਾ, ਬ (if trained on Punjabi) or 5+ pieces (if not)", "depends on the training corpus"],
        ],
      },
      caption: "The vocabulary decides the cut. Train it on English and English is cheap; train it on many languages and the pieces are shared more fairly.",
    },
    everyday: {
      title: "Reading an unfamiliar word",
      text: "Meet 'photosynthesising' for the first time and you do not stall. You see 'photo', 'synthes', 'ising' and have a good guess before anyone explains. You read in pieces when a whole word is unfamiliar. Subword tokenisation gives a model the same move: familiar words whole, unfamiliar words as familiar parts.",
    },
    engineering: {
      title: "A product search that stopped failing on new brands",
      text: "An online retailer's search model used word tokens and could not handle new brand names until someone updated a dictionary. After switching to a subword tokeniser trained on product titles, a new brand like 'Zinovia' tokenised as 'Zin', 'ov', 'ia', pieces the model had seen in other names, so it could be indexed and matched the day it appeared. The team also trained the tokeniser on their own titles rather than using a general one, which cut average tokens per title by a quarter, because 'stainless', 'bluetooth' and model-number patterns became single pieces.",
    },
    maths: {
      formula: "compression = characters ÷ tokens;   a good tokeniser maximises it on its target text",
      meaning: "Fewer tokens per character means shorter sequences and lower cost. The number depends on how well the vocabulary matches the text.",
      worked: [
        "English sentence of 60 characters: word tokens ≈ 12, characters = 60, subwords ≈ 15. Compression: subwords 60 ÷ 15 = 4 characters per token.",
        "The same meaning in Hindi, 55 characters: an English-trained subword vocabulary gives ≈ 40 tokens (1.4 chars/token); a multilingual one gives ≈ 18 (3.1 chars/token).",
        "At the same price per token, the Hindi text costs 40 ÷ 15 ≈ 2.7× the English text with the first tokeniser and 18 ÷ 15 = 1.2× with the second.",
      ],
      note: "This ratio is the single number to check when choosing a model for a non-English product.",
    },
    code: {
      title: "Greedy longest-match subword cutting",
      lang: "py",
      src: `VOCAB = {"un", "believ", "ably", "cat", "token", "ization", "N", "gu", "yen", "a", "b", "l", "y"}

def cut(word):
    pieces, i = [], 0
    while i < len(word):
        for j in range(len(word), i, -1):          # try the longest piece first
            if word[i:j] in VOCAB:
                pieces.append(word[i:j])
                i = j
                break
        else:
            pieces.append(word[i])                 # fall back to the single character
            i += 1
    return pieces

for w in ["cat", "unbelievably", "tokenization", "Nguyen", "ably"]:
    print(w, "->", cut(w))`,
      lines: [
        { code: "for j in range(len(word), i, -1):          # try the longest piece first", say: "From the current position, try the longest substring that is in the vocabulary. Common whole words win immediately." },
        { code: "pieces.append(word[i:j])", say: "A match becomes a token; the cut moves on." },
        { code: "pieces.append(word[i])                 # fall back to the single character", say: "If no piece matches, a single character is emitted. Because characters are in the vocabulary, this never fails." },
      ],
      output: "cat -> ['cat']\nunbelievably -> ['un', 'believ', 'ably']\ntokenization -> ['token', 'ization']\nNguyen -> ['N', 'gu', 'yen']\nably -> ['ably']",
      note: "Real tokenisers add word-boundary markers and sometimes choose the globally best split rather than the greedy one (Unigram, later in this module).",
    },
    useIt: "Every modern model uses subword tokenisation; your job is to choose a model whose tokeniser suits your text (language, domain, code), count tokens with it, and train your own tokeniser only when you train your own model on a special domain.",
    takeaways: ["Subwords: frequent words whole, rare words as frequent pieces, characters as the floor.", "No UNK, short sequences, a medium vocabulary learned by counting.", "The training corpus shapes the pieces; mismatched text costs more tokens.", "BPE, WordPiece and Unigram are the three ways of choosing the pieces."],
    terms: [["subword tokenisation", "cutting words into learned pieces: whole for common words, fragments for rare ones"], ["word piece / subword", "a token that is part of a word"], ["compression (tokeniser)", "characters per token; higher is cheaper"]],
    reflect: { q: "A tokeniser trained only on medical papers is used for casual tweets. What happens to the token counts and why?", a: "Tweets get many more tokens per character: slang, abbreviations and emoji were rare in the training corpus, so they have no single pieces and are spelled from fragments. Compression falls, cost and sequence length rise. The vocabulary mirrors its training data." },
  },

  "m12-byte-pair-encoding-bpe": {
    simple: "Byte pair encoding builds a subword vocabulary by starting from characters and repeatedly merging the most frequent adjacent pair into a new token until the vocabulary is the size you want.",
    concept:
      "**Byte pair encoding** (BPE) is the most common way to learn a subword vocabulary. It began as a compression trick in 1994 and was adapted for translation in 2016; GPT-style models use it. The idea is counting pairs.\n\nStart by splitting every word in a large corpus into characters. Count every adjacent pair of symbols across the corpus. Take the most frequent pair, say 't' followed by 'h', and merge it into a new symbol 'th'. Replace every occurrence. Now count pairs again, with 'th' available as a symbol, and merge the most frequent again, perhaps 'th' + 'e' → 'the'. Repeat for as many merges as you want tokens: 30,000 merges gives a vocabulary of the characters plus 30,000 learned pieces.\n\nThe list of merges, in order, is the tokeniser. To tokenise new text, split it into characters and apply the same merges in the same order; whatever pieces remain are the tokens. Frequent words get merged all the way into single tokens; rare words stop partway and stay as several pieces; anything can always fall back to characters.",
    why:
      "Subword tokenisation needs a way to choose the pieces, automatically, from data, in any language. BPE is the simplest procedure that does this: it needs only counting and merging, it adapts to whatever text it is given, and its vocabulary size is set by one number. Working on bytes rather than characters (byte-level BPE) makes the base vocabulary exactly 256 symbols, so any text in any script, plus emoji and binary-looking junk, can be tokenised without a special case.\n\nIt exists because frequency is a good enough guide to what deserves a token: what people write often should be cheap to represent.",
    how: [
      "Collect a corpus; split each word into characters and add an end-of-word marker so pieces know where words end.",
      "Count all adjacent symbol pairs across the corpus.",
      "Merge the most frequent pair into a single new symbol; record the merge.",
      "Repeat counting and merging until the desired number of merges.",
      "To tokenise new text: split into characters, apply the recorded merges in order, output the resulting pieces.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "corpus", detail: "low (5×), lower (2×), newest (6×), widest (3×)" },
        { label: "characters", detail: "l o w _, l o w e r _, n e w e s t _, w i d e s t _" },
        { label: "most frequent pair", detail: "'e'+'s' appears 9 times (newest 6 + widest 3) → merge to 'es'" },
        { label: "next", detail: "'es'+'t' 9 times → 'est'; then 'l'+'o' 7 times → 'lo'; then 'lo'+'w' 7 times → 'low'" },
        { label: "after 4 merges", detail: "low → [low]; lower → [low, e, r]; newest → [n, e, w, est]; widest → [w, i, d, est]" },
      ],
      caption: "Four merges and the common word 'low' is one token, while 'est' is a shared suffix piece. Rare pieces stay as characters.",
    },
    everyday: {
      title: "Shorthand that grows with use",
      text: "A note-taker invents a squiggle for 'the' because it comes up constantly, then one for 'tion', then one for 'ment'. They keep adding squiggles for whatever they write most, and keep the alphabet for everything else. After a year their shorthand is a BPE vocabulary: the most frequent sequences have become single marks, in the order they earned it.",
    },
    engineering: {
      title: "Training a tokeniser for a code assistant",
      text: "A team building a code-completion model trained their BPE tokeniser on source code rather than prose. Common constructs such as 'self.', '    ' (four spaces), '):' and 'return' became single tokens, cutting tokens per line by about 30% compared with a general-text tokeniser, which meant the model saw more code in the same context window and ran faster. They counted tokens for a sample of real files with both tokenisers before deciding; the compression ratio decided it. The downside they accepted: the same tokeniser is worse on English comments, which were a minority of the text.",
    },
    maths: {
      formula: "vocabulary size = base symbols + number of merges;   merge choice = argmax over pairs of count(pair)",
      meaning: "Each merge adds one token. The pair with the highest count across the corpus is merged next.",
      worked: [
        "Corpus: low ×5, lower ×2, newest ×6, widest ×3. Pair counts: (e,s) = 6 + 3 = 9; (s,t) = 9; (l,o) = 5 + 2 = 7; (o,w) = 7; (n,e) = 6; (w,e) = 6 + 0 = 6 (newest only, 'lower' has w,e too: 2) → 8.",
        "Highest is a tie between (e,s) and (s,t) at 9; take (e,s) → 'es'. Now (es,t) = 9 is highest → 'est'.",
        "Next: (l,o) = 7 → 'lo'; then (lo,w) = 7 → 'low'. Four merges; vocabulary = characters + 4.",
        "Tokenise 'lowest' (unseen): l o w e s t → apply merges: es → est → lo → low: [low, est]. Two meaningful pieces for a word never in the corpus.",
      ],
    },
    code: {
      title: "BPE training in thirty lines",
      lang: "py",
      src: `from collections import Counter

corpus = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
words = {tuple(w) + ("_",): n for w, n in corpus.items()}     # characters + end marker

def pair_counts(words):
    counts = Counter()
    for symbols, n in words.items():
        for a, b in zip(symbols, symbols[1:]):
            counts[(a, b)] += n
    return counts

def merge(words, pair):
    out = {}
    for symbols, n in words.items():
        new, i = [], 0
        while i < len(symbols):
            if i < len(symbols) - 1 and (symbols[i], symbols[i + 1]) == pair:
                new.append(symbols[i] + symbols[i + 1]); i += 2
            else:
                new.append(symbols[i]); i += 1
        out[tuple(new)] = n
    return out

merges = []
for _ in range(4):
    best = pair_counts(words).most_common(1)[0][0]
    merges.append(best)
    words = merge(words, best)
print(merges)
print(list(words))`,
      lines: [
        { code: "words = {tuple(w) + (\"_\",): n for w, n in corpus.items()}     # characters + end marker", say: "Every word starts as characters with an end marker, each with its corpus count." },
        { code: "counts[(a, b)] += n", say: "Pair counts are weighted by how often the word occurs; a pair in a common word counts more." },
        { code: "best = pair_counts(words).most_common(1)[0][0]", say: "The most frequent adjacent pair is the next merge." },
        { code: "words = merge(words, best)", say: "The merge is applied everywhere, and the loop counts again with the new symbol available." },
        { code: "print(merges)", say: "The ordered merge list is the trained tokeniser. Apply the same merges to new text to tokenise it." },
      ],
      output: "[('e', 's'), ('es', 't'), ('est', '_'), ('l', 'o')]\n[('l', 'o', 'w', '_'), ('l', 'o', 'w', 'e', 'r', '_'), ('n', 'e', 'w', 'est_'), ('w', 'i', 'd', 'est_')]",
      note: "With the end marker included, 'est_' becomes a piece meaning 'est at the end of a word'. Real runs do tens of thousands of merges over gigabytes of text.",
    },
    useIt: "Know BPE to read a model's tokeniser files (a vocabulary and a merge list), to understand why token counts differ between models, and to train a domain tokeniser (code, chemistry, a new language) when you train your own model. Byte-level BPE is what GPT-family and Llama-family models use.",
    takeaways: ["BPE: start from characters, repeatedly merge the most frequent adjacent pair, stop at the target vocabulary size.", "The ordered merge list is the tokeniser; apply it to new text.", "Frequent words become single tokens; rare words stay as pieces; characters or bytes are the floor.", "Byte-level BPE needs only 256 base symbols and handles any script."],
    terms: [["byte pair encoding (BPE)", "a subword vocabulary learned by repeatedly merging the most frequent adjacent pair"], ["merge", "one learned rule joining two symbols into one token"], ["byte-level BPE", "BPE run on UTF-8 bytes so the base vocabulary is exactly 256 symbols"]],
    reflect: { q: "Two tokenisers are trained with BPE on the same corpus, one with 8,000 merges and one with 64,000. How will they differ on a rare medical term?", a: "The 64,000-merge vocabulary has had more chances to merge rarer sequences, so the term is likely fewer, larger pieces; the 8,000 one spells it from smaller fragments. Bigger vocabularies give shorter sequences but a larger embedding table and rarer, less-trained tokens." },
  },

  "m12-wordpiece": {
    simple: "WordPiece builds a subword vocabulary like BPE but picks merges by how much they improve the likelihood of the training text, not just by raw pair frequency, and marks continuation pieces with '##'.",
    concept:
      "**WordPiece** is Google's variant of subword tokenisation, used by BERT and its family. It looks like BPE from the outside: a vocabulary of pieces, common words whole, rare words split, characters as the floor. The difference is in how a new piece is chosen.\n\nBPE merges the pair that appears most often. WordPiece merges the pair that most increases how well the vocabulary explains the corpus: it scores each candidate pair by its count divided by the counts of its two parts. A pair of two very common symbols scores low even if the pair is frequent, because the parts already explain it well; a pair whose parts rarely appear apart scores high, because they clearly belong together. In effect it prefers merges that are surprising, not merely frequent.\n\nWordPiece also writes its tokens differently: a piece that continues a word is prefixed with '##', so 'unbelievably' becomes 'un', '##believ', '##ably'. At run time it cuts each word greedily into the longest pieces in the vocabulary, left to right.",
    why:
      "Raw frequency can choose merges that are common without being meaningful: 'e' followed by a space, or 's' followed by 't', occur constantly simply because both parts are everywhere. Scoring a merge against its parts favours pieces that form a unit, such as a suffix or a morpheme, which tends to give tokens that line up better with meaning.\n\nWordPiece exists as that refinement: same idea as BPE, a slightly better criterion for what deserves a token, and a notation that makes word boundaries explicit so text can be reconstructed and models can tell a word start from a continuation.",
    how: [
      "Split the corpus into characters; mark non-initial characters with '##'.",
      "For every adjacent pair, compute score = count(pair) ÷ (count(first) × count(second)).",
      "Merge the highest-scoring pair into a new token; repeat until the vocabulary reaches the target size.",
      "To tokenise a word: take the longest vocabulary piece that matches from the start, then repeat on the rest with '##' pieces.",
      "If no piece matches at some position, the whole word becomes UNK (BERT keeps an UNK, unlike byte-level BPE).",
    ],
    visual: {
      kind: "compare",
      left: { title: "BPE", points: ["merge the most frequent pair", "frequent-but-obvious pairs merge early", "pieces marked by word-end or word-start symbols", "byte-level variant has no UNK"] },
      right: { title: "WordPiece", points: ["merge the pair with highest count ÷ (count(a) × count(b))", "prefers pairs that belong together", "continuation pieces marked with ##", "greedy longest-match at run time; may produce UNK"] },
      caption: "Same shape, different criterion and notation. Models in the BERT family use WordPiece; GPT-style models use BPE.",
    },
    everyday: {
      title: "Which pairs are really a pair",
      text: "'Of the' is one of the most common two-word sequences in English, but nobody would call it a unit; 'of' and 'the' are simply everywhere. 'Pitch black' is rarer, yet the two words almost never appear apart in that sense, so they clearly belong together. WordPiece's score captures that difference: it asks not how often a pair occurs, but how much more often than you would expect from the parts alone.",
    },
    engineering: {
      title: "Reading BERT's tokens in a classifier's errors",
      text: "A team using a BERT-based model to classify support tickets noticed systematic errors on messages containing product codes like 'XR-440B'. Printing the WordPiece tokens showed 'x', '##r', '-', '44', '##0', '##b': six pieces with no relation to the product. They added the codes' common prefixes to the training data for fine-tuning and, more usefully, pre-mapped known codes to a product name before tokenising. The '##' markers were what made the problem visible: they showed exactly where the word had been broken.",
    },
    maths: {
      formula: "score(a, b) = count(ab) ÷ (count(a) × count(b))",
      meaning: "The pair's count divided by the product of its parts' counts. High when the parts mostly appear together; low when both parts are common everywhere.",
      worked: [
        "In a small corpus: count('e') = 400, count('s') = 300, count('es') = 60. Score = 60 ÷ (400 × 300) = 0.0005.",
        "count('q') = 12, count('u') = 150, count('qu') = 12. Score = 12 ÷ (12 × 150) = 0.0067.",
        "Although 'es' occurs five times as often as 'qu', 'qu' scores thirteen times higher, because 'q' never appears without 'u'. WordPiece merges 'qu' first; BPE would merge 'es' first.",
      ],
    },
    code: {
      title: "WordPiece-style tokenisation of a word",
      lang: "py",
      src: `VOCAB = {"un", "##believ", "##ably", "believ", "##able", "cat", "##s", "x", "##r", "-", "44", "##0", "##b"}

def wordpiece(word):
    pieces, start = [], 0
    while start < len(word):
        end, found = len(word), None
        while start < end:
            piece = word[start:end] if start == 0 else "##" + word[start:end]
            if piece in VOCAB:
                found = piece
                break
            end -= 1
        if found is None:
            return ["[UNK]"]
        pieces.append(found)
        start = end
    return pieces

for w in ["unbelievably", "cats", "xr-440b", "zebra"]:
    print(w, "->", wordpiece(w))`,
      lines: [
        { code: "piece = word[start:end] if start == 0 else \"##\" + word[start:end]", say: "A piece at the start of the word is plain; any later piece carries the ## continuation mark." },
        { code: "if piece in VOCAB:", say: "Longest match first: the window shrinks from the whole remaining word down until a vocabulary piece matches." },
        { code: "return [\"[UNK]\"]", say: "If some position matches nothing, the whole word is unknown. This is how BERT's tokeniser behaves; byte-level BPE would never reach this line." },
      ],
      output: "unbelievably -> ['un', '##believ', '##ably']\ncats -> ['cat', '##s']\nxr-440b -> ['x', '##r', '-', '44', '##0', '##b']\nzebra -> ['[UNK]']",
      note: "'zebra' is UNK only because this toy vocabulary lacks its letters as pieces; a real WordPiece vocabulary contains every character, so UNK is rare but possible for unusual symbols.",
    },
    useIt: "You meet WordPiece whenever you use BERT-family models for classification, search embeddings or extraction. Print the tokens when such a model misbehaves on codes, names or non-English text; the '##' pieces show exactly how the word was cut.",
    takeaways: ["WordPiece = subword vocabulary chosen by likelihood gain (count ÷ product of part counts), not raw frequency.", "Continuation pieces are marked with ##; word starts are plain.", "Greedy longest-match at run time; UNK is possible but rare.", "Used by BERT and relatives; BPE by GPT and Llama families."],
    terms: [["WordPiece", "Google's subword tokeniser that scores merges by likelihood gain and marks continuations with ##"], ["continuation piece", "a subword that attaches to the previous piece inside a word"], ["likelihood gain", "how much better the vocabulary explains the corpus after a merge"]],
    reflect: { q: "Why would 'un' + 'believ' score higher in WordPiece than 's' + 't', even if 'st' is more frequent?", a: "'s' and 't' are each extremely common on their own, so their product in the denominator is huge and the score is small. 'believ' rarely appears except after 'un' or alone as a stem, so the pair's count is close to the parts' counts and the score is high: the parts belong together." },
  },

  "m12-sentencepiece": {
    simple: "SentencePiece is a tokeniser toolkit that works on raw text without pre-splitting on spaces, treating the space as a normal character, so it handles any language the same way and can rebuild the exact original text.",
    concept:
      "BPE and WordPiece, as first used, assumed text had already been cut into words at spaces. That assumption breaks for Chinese, Japanese and Thai, which have no spaces, and it loses information even in English: after tokenising you cannot tell whether a space was there. **SentencePiece** removes the assumption. It treats the input as a raw sequence of characters, including spaces, and learns pieces over that sequence. The space is replaced by a visible symbol, '▁', which becomes part of tokens: 'The cat' might become '▁The', '▁cat'.\n\nBecause spaces are ordinary characters, the same tokeniser works for every language without language-specific splitting rules, and because every character is kept, the original text can be rebuilt exactly from the tokens. SentencePiece can learn its vocabulary with BPE or with the Unigram method (next lesson); it is the tool, not the algorithm.\n\nLlama, T5, mT5 and many multilingual models use SentencePiece. Its '▁' marks are the visible fingerprint.",
    why:
      "Pre-splitting on spaces smuggles language-specific rules into the tokeniser and makes it impossible to reverse exactly. Multilingual models needed one procedure that treats a space-separated language and a space-less language identically. They also needed lossless tokenisation: for translation, code and formatting, 'where were the spaces' matters.\n\nSentencePiece exists to make tokenisation language-independent and reversible, from raw text to tokens and back, so that one vocabulary can serve a hundred languages and the decoder can reproduce whitespace exactly.",
    how: [
      "Normalise the raw text (Unicode NFKC by default) and replace every space with the '▁' symbol.",
      "Treat the result as one character sequence; no word splitting.",
      "Learn a vocabulary over that sequence with BPE or Unigram, so pieces can include '▁' (word starts) and even cross word boundaries if that is frequent.",
      "At run time, encode the raw text directly into pieces and IDs.",
      "Decode by concatenating pieces and turning '▁' back into spaces: the original text returns exactly.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text", "SentencePiece tokens", "Note"],
        rows: [
          ["The cat sat.", "▁The, ▁cat, ▁sat, .", "▁ marks a word start; decoding restores spaces"],
          ["我喜欢猫", "▁我, 喜欢, 猫", "no spaces in the input; pieces learned anyway"],
          ["tokenization", "▁token, ization", "same as other subword methods inside a word"],
          ["  two spaces", "▁, ▁two, ▁spaces", "every space survives; reversible"],
        ],
      },
      caption: "The visible ▁ is the design: space is just a character, so every language and every whitespace pattern is handled the same way.",
    },
    everyday: {
      title: "Recording the pauses too",
      text: "A court stenographer records not only the words but where the speaker paused, so the transcript can be read back exactly. A sloppy note-taker writes the words and loses the pauses; nobody can reconstruct the rhythm. SentencePiece is the stenographer: spaces are recorded as part of the tokens, and the text can be played back as written.",
    },
    engineering: {
      title: "One tokeniser for a 100-language translation model",
      text: "A team training a multilingual translation model needed one vocabulary across languages with spaces, without spaces, and with different scripts. They trained a 250,000-piece SentencePiece vocabulary on a corpus balanced across languages, so that no language was spelled letter by letter. Balancing mattered: an earlier attempt trained on web text as found gave English 30 times more data than Punjabi, and Punjabi text tokenised into three times as many pieces per sentence. They also relied on reversibility: translated output had to preserve double spaces and line breaks in formatted documents, which the ▁ markers make possible.",
    },
    code: {
      title: "Training and using a SentencePiece model",
      lang: "py",
      src: `# pip install sentencepiece
import sentencepiece as spm

# a small corpus file, one sentence per line
spm.SentencePieceTrainer.train(input="corpus.txt", model_prefix="sp", vocab_size=2000, model_type="unigram")

sp = spm.SentencePieceProcessor(model_file="sp.model")
text = "The cat sat.  Twice."
pieces = sp.encode(text, out_type=str)
ids = sp.encode(text)
print(pieces)
print(ids[:5], "...")
print(sp.decode(ids) == text)`,
      lines: [
        { code: "spm.SentencePieceTrainer.train(input=\"corpus.txt\", model_prefix=\"sp\", vocab_size=2000, model_type=\"unigram\")", say: "Training takes raw text, a target vocabulary size and an algorithm (unigram or bpe). No pre-tokenisation step." },
        { code: "pieces = sp.encode(text, out_type=str)", say: "Encoding gives the pieces; word starts carry the ▁ mark." },
        { code: "print(sp.decode(ids) == text)", say: "Decoding returns the exact original, double space included: the tokeniser is lossless." },
      ],
      output: "['▁The', '▁cat', '▁sat', '.', '▁', '▁Twice', '.']\n[48, 213, 390, 7, 3] ...\nTrue",
      note: "The exact pieces depend on the corpus; the shape (▁ marks, reversibility) is the point.",
    },
    useIt: "Expect SentencePiece under Llama, T5 and most multilingual models. When you need a tokeniser for a new language or mixed scripts, train SentencePiece on a balanced corpus. When output formatting matters (code, documents), its reversibility is what preserves whitespace.",
    takeaways: ["SentencePiece tokenises raw text; space is a character marked ▁.", "No language-specific pre-splitting, so one vocabulary serves every language.", "Lossless: decoding reproduces the original text exactly.", "A toolkit that can learn with BPE or Unigram; used by Llama, T5 and multilingual models."],
    terms: [["SentencePiece", "a language-independent, reversible tokeniser toolkit that treats spaces as characters"], ["▁ (word-start marker)", "the symbol SentencePiece uses in place of a space"], ["lossless tokenisation", "tokens from which the exact original text can be rebuilt"]],
    reflect: { q: "A model's output of a Python snippet comes back with indentation collapsed. Which tokeniser property was missing, and which toolkit has it?", a: "Reversibility of whitespace: the tokeniser normalised or dropped runs of spaces, so the decoder could not restore them. SentencePiece keeps every space as a ▁ piece, and byte-level BPE keeps them as bytes; a word-splitting tokeniser does not." },
  },

  "m12-unigram-tokenisation": {
    simple: "Unigram tokenisation starts with a large candidate vocabulary and prunes it down, keeping the pieces that best explain the text; at run time it picks the most probable split of each word rather than a greedy one.",
    concept:
      "BPE and WordPiece build a vocabulary bottom-up by merging. **Unigram tokenisation** goes top-down. It starts with a very large set of candidate pieces (all frequent substrings) and assigns each a probability. The 'unigram' in the name means each piece is treated as independent: the probability of a tokenisation of a word is the product of its pieces' probabilities.\n\nTraining repeatedly asks: if I removed this piece, how much worse would the corpus's probability get? Pieces whose removal hurts least are pruned, in batches, until the vocabulary reaches the target size. What survives is the set of pieces that together explain the text best.\n\nAt run time, a word may have several valid splits ('un' + 'believable' or 'unbeliev' + 'able'); Unigram picks the one with the highest total probability, not the greedy longest match. It can also sample a different split sometimes during training, which acts as data augmentation and makes the model robust to tokenisation noise. SentencePiece uses Unigram by default.",
    why:
      "Merging bottom-up commits early: once 'es' is merged, every later decision is built on it, and there is no way to ask whether a different set of pieces would explain the text better overall. Unigram exists to make the vocabulary choice global: start wide, keep what the whole corpus says is worth keeping, and choose splits by probability rather than by a fixed left-to-right rule.\n\nThe probabilistic view also gives something BPE cannot: multiple plausible tokenisations of the same text, usable to train models that do not depend on one exact cut.",
    how: [
      "Seed a large candidate vocabulary: all characters plus the most frequent substrings in the corpus.",
      "Estimate a probability for each piece from how often it is used in the best tokenisations of the corpus.",
      "For each piece, compute the loss in corpus probability if it were removed.",
      "Remove the least useful 10–20% of pieces (never single characters); re-estimate; repeat until the target size.",
      "To tokenise a word, find the split whose pieces' probabilities multiply to the highest value (Viterbi search); optionally sample among the top splits during training.",
    ],
    visual: {
      kind: "compare",
      left: { title: "BPE / WordPiece (bottom-up)", points: ["start: characters", "grow by merging pairs", "one deterministic split per word", "early merges are permanent"] },
      right: { title: "Unigram (top-down)", points: ["start: a huge candidate set", "shrink by pruning the least useful pieces", "best-probability split; can sample alternatives", "every piece judged against the whole corpus"] },
      caption: "Opposite directions, similar vocabularies in the end. Unigram adds a probability to every piece and a choice among splits.",
    },
    everyday: {
      title: "Packing by removing, not adding",
      text: "One traveller packs by adding items one by one until the bag is full; another lays out everything they might need and removes what they would miss least until it fits. The second method sees the whole trip at once and rarely leaves out the essentials. Unigram is the second traveller: start with far too many pieces, remove the ones the text can best do without.",
    },
    engineering: {
      title: "Subword regularisation for a noisy-input model",
      text: "A team building a model to read user-typed addresses found it brittle: a one-letter typo changed the tokenisation entirely and the prediction with it. They switched to a SentencePiece Unigram tokeniser and, during training, sampled one of the top few splits for each word instead of always the best. The model saw 'Birmingham' as '▁Birm, ingham' one time and '▁Bir, ming, ham' another, and learned to be robust to how a word was cut. Accuracy on typo-laden test addresses rose several points with no change to the model.",
    },
    maths: {
      formula: "P(split) = Π P(piece);   best split = argmax over splits of Π P(piece)",
      meaning: "A tokenisation's probability is the product of its pieces' probabilities. The tokeniser chooses the split with the largest product.",
      worked: [
        "Piece probabilities: P(un) = 0.01, P(believ) = 0.002, P(able) = 0.02, P(unbeliev) = 0.0001, P(ably) = 0.005, P(believable) = 0.0005.",
        "Split A: un + believ + ably → 0.01 × 0.002 × 0.005 = 1.0 × 10⁻⁷.",
        "Split B: un + believable → wait, the word is 'unbelievably', so B must be un + believ + able + ly; with P(ly) = 0.03: 0.01 × 0.002 × 0.02 × 0.03 = 1.2 × 10⁻⁸.",
        "Split C: unbeliev + ably → 0.0001 × 0.005 = 5 × 10⁻⁷.",
        "C wins (5 × 10⁻⁷ > 1 × 10⁻⁷ > 1.2 × 10⁻⁸): fewer pieces with decent probability beat more pieces. In log space these are sums of logs, which is how the search is done.",
      ],
      note: "Greedy longest-match would have taken 'unbeliev' first anyway here; the methods differ when a long early piece forces bad later pieces.",
    },
    code: {
      title: "Choosing the most probable split",
      lang: "py",
      src: `import math

P = {"un": 0.01, "believ": 0.002, "able": 0.02, "ably": 0.005, "unbeliev": 0.0001, "ly": 0.03, "u": 0.001, "n": 0.002}

def best_split(word):
    best = [None] * (len(word) + 1)       # best[i] = (log prob, pieces) for word[:i]
    best[0] = (0.0, [])
    for end in range(1, len(word) + 1):
        for start in range(end):
            piece = word[start:end]
            if piece in P and best[start] is not None:
                score = best[start][0] + math.log(P[piece])
                if best[end] is None or score > best[end][0]:
                    best[end] = (score, best[start][1] + [piece])
    return best[len(word)]

score, pieces = best_split("unbelievably")
print(pieces, round(score, 2))`,
      lines: [
        { code: "best = [None] * (len(word) + 1)       # best[i] = (log prob, pieces) for word[:i]", say: "Dynamic programming: the best way to tokenise each prefix of the word is stored and reused." },
        { code: "score = best[start][0] + math.log(P[piece])", say: "Log probabilities add. Extending a prefix with a piece costs that piece's log probability." },
        { code: "if best[end] is None or score > best[end][0]:", say: "Keep only the highest-scoring way to reach each position. This is the Viterbi search." },
        { code: "return best[len(word)]", say: "The entry for the whole word is the most probable split." },
      ],
      output: "['unbeliev', 'ably'] -14.51",
      note: "Sampling a split instead of taking the best one is a few more lines: that is subword regularisation.",
    },
    useIt: "Unigram is what you get by default from SentencePiece, so it underlies many multilingual and Llama-era models. Use its sampling feature when training models on noisy input (typos, OCR, speech) to make them robust to tokenisation changes.",
    takeaways: ["Unigram prunes a large candidate vocabulary down to the pieces that best explain the corpus.", "Each piece has a probability; the tokenisation of a word is its most probable split.", "Sampling alternative splits during training makes models robust to tokenisation noise.", "SentencePiece's default algorithm; bottom-up BPE and top-down Unigram end up similar in practice."],
    terms: [["unigram tokenisation", "a top-down subword method that prunes pieces by their contribution to corpus probability"], ["Viterbi search", "a dynamic-programming method for finding the best-scoring path, here the best split"], ["subword regularisation", "training with randomly sampled alternative tokenisations to improve robustness"]],
    reflect: { q: "Why can Unigram offer several tokenisations of the same word while BPE always gives one?", a: "Unigram assigns probabilities to pieces and evaluates whole splits, so it can rank many valid splits and sample among them. BPE applies a fixed ordered list of merges, which is deterministic: one input, one output." },
  },

  "m12-special-tokens": {
    simple: "Special tokens are reserved vocabulary entries that mark structure rather than text: start and end of a sequence, padding, unknown, and the boundaries between speakers in a chat.",
    concept:
      "A model's input is a flat sequence of tokens, so anything about structure has to be put into the sequence itself. **Special tokens** are vocabulary entries reserved for that job. They never appear in ordinary text; the tokeniser inserts them.\n\nThe common ones: a beginning-of-sequence token so the model knows where text starts; an end-of-sequence token so it knows where to stop generating; a padding token to fill shorter sequences in a batch to the same length; an unknown token for unspellable input (in tokenisers that have one); separator tokens between two pieces of input (question and passage); and, in chat models, tokens marking where the system, the user and the assistant each begin and end. A chat template is just a recipe for which special tokens go where.\n\nThey matter because the model learned their meaning during training. Leave out the end token and the model may ramble; mark a user turn with the wrong token and the model may treat the user's words as its own.",
    why:
      "Without markers, a model cannot tell whether a sequence has ended, whether two sentences belong together, or who is speaking. These facts are not in the words; they are about the words. Special tokens exist to carry that meta-information inside the only channel the model has, the token sequence, in a way the model has seen millions of times during training.\n\nThey also make batching possible: sequences of different lengths can be padded to one length and the padding masked out, so a whole batch runs as one matrix operation.",
    how: [
      "Reserve IDs in the vocabulary for each special token; ensure the tokeniser never produces them from ordinary text.",
      "Prepend a start token and append an end token to each training sequence; the model learns to emit the end token when it is done.",
      "Pad shorter sequences in a batch with the pad token and pass an attention mask so padded positions are ignored.",
      "For chat, apply the model's template: role markers around each message in a fixed order.",
      "At generation time, stop when the end token (or a stop sequence) is produced, and strip special tokens before showing text.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "Typical names", "Job"],
        rows: [
          ["begin", "<s>, [CLS], <|begin_of_text|>", "marks the start; some models use it to hold a sentence-level summary"],
          ["end", "</s>, [SEP], <|eot_id|>, <|endoftext|>", "marks the end; generation stops here"],
          ["pad", "<pad>, [PAD]", "fills batches; masked out of attention"],
          ["unknown", "<unk>, [UNK]", "unspellable input (absent in byte-level tokenisers)"],
          ["role markers", "<|user|>, <|assistant|>, <|system|>", "who is speaking in a chat template"],
        ],
      },
      caption: "The names differ by model family; the roles are the same. Using one model's markers with another is a silent, common bug.",
    },
    everyday: {
      title: "Stage directions in a script",
      text: "A play script contains lines the audience never hears: 'Enter Hamlet', 'Exit', 'Aside', '[curtain]'. They tell actors where things start, who speaks, and when it ends. Special tokens are the stage directions of a token sequence: never spoken, essential for the performance to make sense.",
    },
    engineering: {
      title: "The chatbot that never stopped",
      text: "A team swapped the model behind their assistant for a newer one and the replies started running on into imagined follow-up questions from the user. The cause: they built the prompt with the old model's role markers, and the new model, which used different special tokens, saw no end-of-turn marker it recognised, so it kept predicting a conversation. Applying the new model's chat template fixed it in a line. They added a test that renders a sample conversation through the template and checks for the model's own end token.",
    },
    code: {
      title: "A chat template rendered into tokens",
      lang: "py",
      src: `SPECIAL = {"bos": "<s>", "eos": "</s>", "user": "<|user|>", "assistant": "<|assistant|>", "end": "<|end|>", "pad": "<pad>"}

def render_chat(messages):
    out = [SPECIAL["bos"]]
    for m in messages:
        out.append(SPECIAL[m["role"]])
        out.append(m["content"])
        out.append(SPECIAL["end"])
    out.append(SPECIAL["assistant"])          # the model continues from here
    return " ".join(out)

def pad_batch(seqs, length):
    return [s + [SPECIAL["pad"]] * (length - len(s)) for s in seqs], [[1] * len(s) + [0] * (length - len(s)) for s in seqs]

print(render_chat([{"role": "user", "content": "Is the shop open on Sunday?"}]))
padded, mask = pad_batch([["<s>", "hi", "</s>"], ["<s>", "see", "you", "soon", "</s>"]], 5)
print(padded[0], mask[0])`,
      lines: [
        { code: "out.append(SPECIAL[m[\"role\"]])", say: "Each message is wrapped in the marker for its role. The model learned during training that text after <|user|> is the user's." },
        { code: "out.append(SPECIAL[\"assistant\"])          # the model continues from here", say: "The prompt ends with the assistant marker, so the next tokens the model predicts are its reply." },
        { code: "return [s + [SPECIAL[\"pad\"]] * (length - len(s)) for s in seqs], [[1] * len(s) + [0] * (length - len(s)) for s in seqs]", say: "Padding makes every sequence the same length; the mask tells attention which positions are real." },
      ],
      output: "<s> <|user|> Is the shop open on Sunday? <|end|> <|assistant|>\n['<s>', 'hi', '</s>', '<pad>', '<pad>'] [1, 1, 1, 0, 0]",
      note: "Real templates are shipped with the model (a Jinja template in the tokeniser config) and must be used as given.",
    },
    useIt: "Always render prompts through the model's own chat template, stop on its end token, and strip special tokens from output. When batching for training or evaluation, pad with the pad token and pass the attention mask. When swapping models, check the special tokens first.",
    takeaways: ["Special tokens carry structure (start, end, padding, roles) inside the token sequence.", "The model learned their meaning in training; wrong or missing markers cause rambling or confused roles.", "Padding plus an attention mask makes batching possible.", "Use each model's own template and end token; they differ between families."],
    terms: [["special token", "a reserved vocabulary entry that marks structure rather than text"], ["chat template", "the fixed arrangement of role markers a chat model expects"], ["attention mask", "a list of ones and zeros telling the model which positions are real tokens and which are padding"]],
    reflect: { q: "A user types the literal text '<|assistant|>' into a chat box. What could go wrong, and how do tokenisers prevent it?", a: "If the text were turned into the real special token, the user could impersonate the assistant or break the template, a form of prompt injection. Tokenisers are configured not to produce special tokens from ordinary text (the string is split into normal pieces), and applications escape or strip such strings as well." },
  },

  "m12-token-ids": {
    simple: "A token ID is the integer that stands for a token in the vocabulary; models work entirely on these integers, and each ID selects a row of the embedding table.",
    concept:
      "Once text is cut into tokens, each token is replaced by an integer: its **token ID**, its position in the vocabulary. 'the' might be 262, 'cat' 3797, '.' 13. The model never sees the strings again; it sees [262, 3797, 13]. On the way out, the model produces an ID per step, and the tokeniser's decode turns IDs back into pieces and joins them.\n\nThe ID is not a value, only a name. 263 is not 'one more than the' in any sense; the numbers are arbitrary labels. What gives an ID meaning is the **embedding table**: a matrix with one row per vocabulary entry, where row 262 is the vector the model learned for 'the' (Module 13 and Stage 4). Looking up a token is reading its row.\n\nBecause IDs are arbitrary, they are tied to one tokeniser. The same ID means different tokens in different vocabularies, which is why a model must always be used with its own tokeniser and why mixing them produces nonsense rather than an error.",
    why:
      "Neural networks compute with numbers, not strings, and they need a fixed-size input per position. An integer per token is the smallest possible representation and the key into the embedding table that turns an arbitrary label into a learned vector. The ID layer exists as the exact boundary between text and maths: everything before it is tokenisation, everything after it is the model.\n\nUnderstanding that boundary explains several practical facts: why vocabulary size sets the embedding table size, why saving and sharing models requires sharing the tokeniser, and why 'the model output token 50256' is a complete description of a step.",
    how: [
      "The vocabulary is a list; each entry's index is its ID.",
      "Encode: tokenise, then map each piece to its index.",
      "The embedding layer holds a V × d matrix (V tokens, d numbers each); the model gathers the rows for the input IDs.",
      "The model's last layer produces V scores per position; the chosen score's index is the output ID.",
      "Decode: map each output ID to its piece, join, and restore spaces and special handling.",
    ],
    visual: {
      kind: "flow",
      steps: ["'The cat sat.'", "tokens: ▁The | ▁cat | ▁sat | .", "IDs: [450, 3797, 2563, 29889]", "embedding rows: 4 vectors of d numbers", "model", "output ID per step: 29871 …", "decode: text"],
      caption: "The arrows in the middle are the whole model; the arrows at the ends are the tokeniser. IDs are the handshake between them.",
    },
    everyday: {
      title: "Seat numbers, not names",
      text: "A theatre's booking system stores seat 'F12', not 'the one with the good view'. The number is a label; the view is a property stored elsewhere, in the seating chart. Token IDs are seat numbers; the embedding table is the seating chart that says what each seat is like. Change theatres and F12 is a different seat entirely: a different tokeniser, a different vocabulary.",
    },
    engineering: {
      title: "The silent mismatch",
      text: "An engineer fine-tuned a model with its own tokeniser, then served it behind an API wrapper that, for speed, used a cached tokeniser from a different model with a similar name. Nothing crashed: IDs are integers, and the shapes matched. The outputs were fluent garbage. The bug took a day to find because every component worked; only the mapping from text to ID had changed. The fix was to load the tokeniser from the same checkpoint directory as the model and to add a test that round-trips a sentence through tokenise and decode.",
    },
    maths: {
      formula: "embedding table size = V × d;   lookup(id) = row id of the table",
      meaning: "V is the vocabulary size, d the embedding dimension. Every token ID selects one row of d numbers.",
      worked: [
        "A vocabulary of V = 32,000 tokens with d = 4,096 numbers per token: table size = 32,000 × 4,096 = 131 million parameters.",
        "At 2 bytes per number (16-bit), that is 262 MB just for the lookup table.",
        "A vocabulary of 256,000 (a multilingual model) at the same d: 1.05 billion parameters, about 2.1 GB. Vocabulary size is a real cost.",
        "Encoding 'The cat sat.' gives 4 IDs, so the input to the first layer is a 4 × 4,096 block of numbers gathered from the table.",
      ],
    },
    code: {
      title: "IDs in and out, and the round-trip test",
      lang: "py",
      src: `vocab = ["<pad>", "<s>", "</s>", "▁The", "▁cat", "▁sat", ".", "▁dog"]
to_id = {tok: i for i, tok in enumerate(vocab)}

def encode(pieces):
    return [to_id[p] for p in pieces]

def decode(ids):
    text = "".join(vocab[i] for i in ids if vocab[i] not in {"<pad>", "<s>", "</s>"})
    return text.replace("▁", " ").strip()

pieces = ["<s>", "▁The", "▁cat", "▁sat", ".", "</s>"]
ids = encode(pieces)
print(ids)
print(decode(ids))
assert decode(encode(pieces)) == "The cat sat."     # the round-trip test every service should run`,
      lines: [
        { code: "to_id = {tok: i for i, tok in enumerate(vocab)}", say: "The ID is the position in the vocabulary list. Nothing more." },
        { code: "return [to_id[p] for p in pieces]", say: "Encoding replaces each piece with its integer. This list is the model's input." },
        { code: "text = \"\".join(vocab[i] for i in ids if vocab[i] not in {\"<pad>\", \"<s>\", \"</s>\"})", say: "Decoding looks each ID up, drops special tokens and joins the pieces." },
        { code: "assert decode(encode(pieces)) == \"The cat sat.\"     # the round-trip test every service should run", say: "If the tokeniser and the vocabulary do not match, this is where it shows." },
      ],
      output: "[1, 3, 4, 5, 6, 2]\nThe cat sat.",
    },
    useIt: "Load the tokeniser from the same source as the model, every time. Add a round-trip test to any service that tokenises. Remember that vocabulary size multiplies into the embedding table, which matters for memory when choosing or training models.",
    takeaways: ["A token ID is the token's index in the vocabulary: a label, not a value.", "IDs select rows of the embedding table, where meaning lives.", "IDs are tied to one tokeniser; mismatches produce fluent nonsense, not errors.", "Vocabulary size × embedding dimension is the size of the lookup table."],
    terms: [["token ID", "the integer index of a token in the vocabulary"], ["embedding table", "the matrix with one learned vector per vocabulary entry"], ["round-trip test", "checking that decode(encode(text)) returns the original text"]],
    reflect: { q: "Why does swapping in the wrong tokeniser produce fluent but meaningless output instead of an error?", a: "The model only checks that IDs are integers within its vocabulary range, which they are. Each ID still selects a valid embedding row, so the model computes a perfectly fluent continuation, of the wrong tokens. Only the mapping from text to meaning was broken, and nothing in the pipeline checks it." },
  },

  "m12-vocabulary-size": {
    simple: "Vocabulary size is how many distinct tokens a tokeniser has; bigger means shorter sequences but a larger embedding table and rarer, less-trained tokens, so it is a trade-off chosen per model.",
    concept:
      "A tokeniser's **vocabulary size** is the number of distinct tokens it can produce, from a few thousand to over a quarter of a million. It is set when the tokeniser is trained (the number of BPE merges, the Unigram target) and it shapes everything.\n\nA bigger vocabulary has more whole words and longer pieces, so text becomes fewer tokens: cheaper to read, more fits in the context window, and each token carries more meaning. But every token needs a row in the embedding table and a column in the output layer, so parameters and memory grow; the rarest tokens appear so seldom in training that their embeddings are poorly learned; and the final softmax over the vocabulary gets more expensive at every generated step.\n\nA smaller vocabulary has the opposite profile: longer sequences, smaller tables, every token well trained. Typical choices: around 32,000 for English-centred models, 100,000–150,000 for strong general models, 250,000 for broad multilingual ones, where many scripts must share the space.",
    why:
      "Someone has to pick the number, and the pick changes cost, quality and language fairness at once. Too small and non-English text and code are spelled from fragments, filling the context and the bill. Too large and the table bloats while thousands of tokens are seen a handful of times, so the model handles them badly. The decision also fixes the model's shape for its whole life: changing the vocabulary later means retraining the embedding and output layers.\n\nThe lesson exists so the number is understood as a lever with consequences on both sides, rather than a default.",
    how: [
      "Collect the text the model will serve: languages, code, domains, in representative proportions.",
      "Train candidate tokenisers at several sizes (for example 32k, 64k, 128k).",
      "Measure tokens per character on held-out samples per language and domain; watch the fairness gap between languages.",
      "Estimate embedding-table memory and output-layer cost for each size.",
      "Check the long tail: how many tokens would appear fewer than, say, 100 times in the training corpus.",
      "Choose the size that balances compression, memory and tail quality for the intended use.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Vocabulary", "Tokens for 1,000 English words", "Tokens for 1,000 Hindi words", "Embedding table at d = 4,096"],
        rows: [
          ["8,000", "≈ 1,600", "≈ 6,000", "33 M parameters"],
          ["32,000", "≈ 1,300", "≈ 4,000", "131 M"],
          ["128,000", "≈ 1,250", "≈ 1,800", "524 M"],
          ["256,000 (multilingual)", "≈ 1,250", "≈ 1,400", "1,049 M"],
        ],
      },
      caption: "Illustrative numbers. English stops improving early; the gain from large vocabularies is mostly for other languages, paid for in table size.",
    },
    everyday: {
      title: "How many words in the dictionary",
      text: "A pocket dictionary with 5,000 entries fits in a coat; you look up more often and sometimes have to piece a meaning together from parts. An unabridged dictionary covers almost everything but weighs five kilograms, and most of its entries you will never open. Vocabulary size is the same choice between a light book you consult often and a heavy one you rarely need in full.",
    },
    engineering: {
      title: "Choosing 128k for a bilingual assistant",
      text: "A company building an English and Hindi assistant compared tokenisers. Their English-trained 32k vocabulary spelled Hindi at about three times the tokens per word of English, so Hindi users hit context limits and paid more. A 128k vocabulary trained on a corpus balanced between the two languages brought the gap down to about 1.3× while increasing the embedding table from 131 M to 524 M parameters, acceptable on their hardware. They also checked that the extra tokens were well used: fewer than 2% appeared under 100 times in training. The decision was recorded with the measurements, because it cannot be cheaply reversed.",
    },
    maths: {
      formula: "embedding parameters = V × d;   output-layer parameters = d × V;   per-step softmax cost ∝ V",
      meaning: "Vocabulary size multiplies into two large matrices and into the cost of every generated token.",
      worked: [
        "V = 32,000, d = 4,096: embedding = 131 M, output layer = 131 M, total 262 M parameters tied to vocabulary (some models share the two matrices, halving it).",
        "V = 128,000: embedding = 524 M, output = 524 M, total 1.05 B. Four times the vocabulary, four times those parameters.",
        "Sequence saving for Hindi (from the table above): 4,000 → 1,800 tokens per 1,000 words, a 55% reduction in per-token compute for Hindi text.",
        "For a model whose other layers total 6 B parameters, going from 32k to 128k adds about 13% to the parameter count and removes 55% of the per-request cost for Hindi users: worth it if Hindi is a large share of traffic.",
      ],
    },
    useIt: "When choosing a model for non-English or code-heavy work, compare tokens per character on your own text; it is the practical face of vocabulary size. When training a tokeniser, pick the size from measurements, not habit, and record them. Expect multilingual models to carry large vocabularies and larger embedding tables.",
    takeaways: ["Vocabulary size trades sequence length against table size and tail quality.", "Bigger helps non-English and code most; English saturates early.", "Embedding and output layers scale with V × d; softmax cost with V.", "Choose by measuring tokens per character on representative text."],
    terms: [["vocabulary size", "the number of distinct tokens a tokeniser can produce"], ["long tail (tokens)", "the many rare tokens that appear seldom in training and are poorly learned"], ["tokens per character", "the compression measure used to compare tokenisers on a text"]],
    reflect: { q: "A tokeniser with 500,000 tokens would make every sequence very short. Why does nobody do it?", a: "Most of those tokens would be extremely rare, so their embeddings would be barely trained and the model would handle them poorly; the embedding and output matrices would be enormous; and every generated token would require a softmax over half a million entries. Past a point, shorter sequences stop paying for the cost." },
  },

  "m12-why-models-use-tokens-instead-of-words": {
    simple: "Models use tokens because tokens give an open vocabulary with no unknowns, short sequences, shared pieces across related words and languages, and a fixed-size output layer, which words cannot provide together.",
    concept:
      "This lesson gathers the module's threads into one answer. Models use tokens, not words, for five reasons that work together.\n\nNo unknowns: every string can be spelled from pieces, down to characters or bytes, so names, typos, new words and any script are representable. Short sequences: common words stay single tokens, so text is about 1.3 tokens per English word rather than 5 characters. Shared structure: 'unhappy', 'unhappily' and 'happiness' share pieces, so what the model learns about one helps the others; the same holds across languages with shared roots or scripts. A fixed output layer: the model predicts over a vocabulary of fixed size at every step, which is only possible if that vocabulary is closed, and tokens close it without losing coverage. And learnability: a vocabulary learned from data fits the data; frequent things are cheap, rare things are spelled.\n\nWords fail the first and third; characters fail the second; tokens pass all five.",
    why:
      "The question comes up constantly from people new to models: why not just use words? The answer matters because it explains model behaviour that otherwise looks mysterious: why a model miscounts letters in a word (it never sees letters), why it struggles with some names, why it is worse at arithmetic on long numbers (digits are chunked unpredictably), why other languages cost more, and why some prompts behave differently with a trailing space. Each of these is a token effect. Knowing the reasons for tokens lets you predict their side effects.",
    how: [
      "Coverage: check that the tokeniser can spell any input (byte or character floor).",
      "Compression: check tokens per character on the target text; it should be well above 1 for prose.",
      "Sharing: check that morphological relatives share pieces (print a few).",
      "Fixed output: the model's final layer has one column per token, so the vocabulary must be fixed at training time.",
      "Fit: the vocabulary should be trained on text like the text the model will serve.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Requirement", "Words", "Characters", "Subword tokens"],
        rows: [
          ["no unknown input", "fails (UNK)", "passes", "passes"],
          ["short sequences", "passes", "fails (5× longer)", "passes (≈1.3× words)"],
          ["shared pieces across related words", "fails", "partly", "passes"],
          ["fixed, closed output vocabulary", "only with UNK", "passes", "passes"],
          ["works for every language", "fails (no boundaries in some)", "passes", "passes with a suitable corpus"],
        ],
      },
      caption: "Read the columns: subwords are the only option that passes every row. That is the whole reason.",
    },
    everyday: {
      title: "Why postcodes, not full addresses",
      text: "A delivery network sorts parcels by postcode, not by the full address written on each one. Postcodes are a fixed, learnable set; addresses are infinite and messy. Yet the postcode is fine enough that the last step (the street) is easy. Tokens are the postcodes of language: a fixed set, fine enough to reach any word, coarse enough to be learnable.",
    },
    engineering: {
      title: "Explaining the counting bug to a product manager",
      text: "A product manager filed a bug: the model said 'strawberry' had two r's. The engineer's explanation came straight from this module: the model sees tokens, perhaps 'str', 'aw', 'berry', and never sees individual letters unless it reasons about them; spelling questions are a known weakness of token-based models. The fix for their use case (checking product names for typos) was not a bigger model but a tiny traditional NLP step: a character-level comparison in code, with the model used only for judgement. Knowing why tokens exist told them where the boundary of the model's competence was.",
    },
    code: {
      title: "Seeing the token effects that explain model quirks",
      lang: "py",
      src: `from tokenizers import Tokenizer
tok = Tokenizer.from_pretrained("gpt2")

for text in ["strawberry", " strawberry", "12345678", "happiness unhappily", "Nguyen"]:
    enc = tok.encode(text)
    print(repr(text), "->", enc.tokens)`,
      lines: [
        { code: "for text in [\"strawberry\", \" strawberry\", \"12345678\", \"happiness unhappily\", \"Nguyen\"]:", say: "Five probes: a spelling question, the same word with a leading space, a long number, two related words, a name." },
        { code: "print(repr(text), \"->\", enc.tokens)", say: "The tokens show why the model cannot count letters (it never sees them), why a leading space changes the tokens, and how digits are chunked." },
      ],
      output: "'strawberry' -> ['straw', 'berry']\n' strawberry' -> ['Ġstrawberry']\n'12345678' -> ['123', '456', '78']\n'happiness unhappily' -> ['happ', 'iness', 'Ġunh', 'app', 'ily']\n'Nguyen' -> ['N', 'gu', 'yen']",
      note: "The Ġ is this tokeniser's mark for a leading space. Note that 'strawberry' with and without a space tokenises completely differently; prompts are sensitive to such details.",
    },
    useIt: "Use this reasoning to explain and work around model quirks: spelling and letter counting, arithmetic on long numbers, name handling, trailing-space sensitivity, multilingual cost. Where a task is really about characters, do that part in code.",
    takeaways: ["Tokens give coverage, short sequences, shared pieces, a fixed output vocabulary and a data-fitted vocabulary at once.", "Words fail on coverage and sharing; characters fail on length.", "Many model quirks (spelling, digits, spaces, language cost) are token effects.", "Character-level tasks belong in code, not in the model."],
    terms: [["closed vocabulary", "a fixed set of tokens the model predicts over"], ["token effect", "a model behaviour caused by how text was cut into tokens rather than by the model's knowledge"]],
    reflect: { q: "A model is asked to reverse the string 'tokenization' and gets it slightly wrong. Which of the five reasons for tokens predicts this?", a: "Short sequences: the word is a couple of tokens, so the model never sees its letters in order and must reconstruct them from what it has learned about the tokens' spellings. Reversing characters is a character-level task; the right tool is a line of code." },
  },

  "m12-how-tokenisation-affects-model-performance": {
    simple: "Tokenisation changes what a model can learn and how well: it sets sequence length, decides which words share pieces, fixes the cost per language, and causes specific weaknesses in spelling, numbers and rare terms.",
    concept:
      "The tokeniser is fixed before training and never changes, so its choices are baked into everything the model does. **Tokenisation affects model performance** in four ways.\n\nLength: a text that becomes more tokens costs more compute, fits less context, and gives attention more positions to spread over, which can dilute what matters. Granularity: if a domain term is one token, the model learns a dedicated vector for it; if it is five fragments, the model must assemble the meaning each time, and it does so less reliably. Fairness: a language or domain that tokenises poorly gets fewer effective examples per token in training and higher cost at inference, so the model is worse and more expensive for it. Arithmetic and characters: numbers chunked into irregular pieces ('1234' as '12' + '34' but '1235' as '123' + '5') make digit-level reasoning hard; words seen as pieces make spelling and letter counting hard.\n\nNone of this is fixable at prompt time. It is decided by the tokeniser's training data and size, and it is a reason to inspect tokens, not just outputs, when a model underperforms on a specific kind of input.",
    why:
      "Teams tend to debug models by changing prompts or models and never look at the tokens. Yet a large share of 'the model is bad at X' turns out to be 'the tokeniser cuts X badly'. The weakness cannot be prompted away; it can be worked around (preprocess codes, route character tasks to code, choose a model whose tokeniser fits) only if it is recognised. This lesson exists to connect the symptoms to the cause.",
    how: [
      "When a model underperforms on a category of input, tokenise a sample and look at the pieces.",
      "Count tokens per character for that category versus ordinary text; a large ratio means poor fit.",
      "Check whether key terms are single tokens or fragments; fragmented terms are learned less well.",
      "Check digits and codes: irregular chunking predicts arithmetic and lookup errors.",
      "Work around: pre-normalise codes and numbers, move character-level work into code, or choose a model with a better-fitting tokeniser; for your own models, train the tokeniser on the right corpus.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Symptom", "Token cause", "Workaround"],
        rows: [
          ["wrong letter counts, bad anagrams", "words are whole or few-piece tokens; letters are invisible", "do character tasks in code"],
          ["arithmetic errors on long numbers", "digits chunked irregularly", "use a calculator tool; or models that tokenise digits singly"],
          ["poor handling of product codes and IDs", "codes shatter into unrelated fragments", "map codes to names before the model; exact lookup in code"],
          ["worse quality and higher cost in Punjabi or Hindi", "script spelled from small pieces; fewer training examples per token", "choose a multilingual tokeniser; budget per language"],
          ["different answer with a trailing space", "the space changes the token sequence", "normalise whitespace in prompts"],
        ],
      },
      caption: "Each symptom is routinely blamed on the model. Each is in the tokeniser, and each has a workaround outside the model.",
    },
    everyday: {
      title: "Reading through the wrong glasses",
      text: "Give a sharp reader glasses that blur every third letter and they will misread names, mangle numbers and tire quickly, while still following the story perfectly. The reader is fine; the glasses decide what reaches them. A tokeniser is the model's glasses, chosen once and worn forever.",
    },
    engineering: {
      title: "The pharmacy model that failed on drug names",
      text: "A healthcare company fine-tuned a general model to extract drug names and doses from prescriptions. It did well on common drugs and badly on rare ones. Tokenising the failures showed rare drug names split into four to seven fragments, often sharing pieces with unrelated words. Two fixes worked together: a dictionary pass that recognised known drug names in code before the model saw the text, and a larger model with a tokeniser trained on more medical text, which cut the average fragments per drug name from five to two. Extraction accuracy on rare drugs rose from 71% to 93%. No prompt change had moved it at all.",
    },
    maths: {
      formula: "effective training examples per token ≈ corpus tokens for that language ÷ tokens per sentence;   inference cost ∝ tokens",
      meaning: "A poorly fitting tokeniser both reduces how much the model learned per unit of meaning and raises how much each request costs.",
      worked: [
        "Two languages each with 100 million sentences in the training corpus. English: 20 tokens per sentence → 2 billion tokens. Punjabi with an English-trained tokeniser: 65 tokens per sentence → 6.5 billion tokens.",
        "The Punjabi tokens are spread over more positions per sentence, so each token's embedding sees less coherent context; the model's quality per sentence is lower despite more tokens.",
        "At inference, a Punjabi request costs 65 ÷ 20 = 3.25× an equivalent English one.",
        "A multilingual tokeniser bringing Punjabi to 28 tokens per sentence cuts inference cost to 1.4× and concentrates training signal on fewer, more meaningful pieces.",
      ],
    },
    code: {
      title: "A quick tokeniser fitness check",
      lang: "py",
      src: `from tokenizers import Tokenizer
tok = Tokenizer.from_pretrained("gpt2")

samples = {
    "english": "The patient was prescribed amoxicillin twice daily.",
    "codes": "Order WL-2041-B, batch 7781Q, SKU 4419-XR.",
    "punjabi": "ਮਰੀਜ਼ ਨੂੰ ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ ਦਵਾਈ ਦਿੱਤੀ ਗਈ।",
}
for name, text in samples.items():
    n = len(tok.encode(text).tokens)
    print(f"{name:8} {len(text):3} chars {n:3} tokens {len(text)/n:4.1f} chars/token")`,
      lines: [
        { code: "n = len(tok.encode(text).tokens)", say: "Token count per sample category." },
        { code: "print(f\"{name:8} {len(text):3} chars {n:3} tokens {len(text)/n:4.1f} chars/token\")", say: "Characters per token is the fitness number. Prose around 4; codes and unsupported scripts far lower." },
      ],
      output: "english   51 chars  11 tokens  4.6 chars/token\ncodes     42 chars  22 tokens  1.9 chars/token\npunjabi   42 chars  48 tokens  0.9 chars/token",
      note: "With this English-trained tokeniser, Punjabi costs more than one token per character. Run the same check with candidate models before choosing one for a language.",
    },
    useIt: "Add a tokeniser check to model selection: tokens per character on your real inputs, by category. When a model fails on a category, inspect the tokens before changing prompts. Move character- and digit-level work into code, and map codes to names before the model.",
    takeaways: ["The tokeniser is fixed before training; its cuts shape what the model can learn.", "Fragmented terms are learned worse; poorly fitting languages cost more and perform worse.", "Spelling, counting and arithmetic weaknesses are token effects.", "Inspect tokens when debugging; work around at the edges, in code and in model choice."],
    terms: [["tokeniser fit", "how well a tokeniser's vocabulary matches a text, measured as characters per token"], ["fragmentation", "a term being split into many small pieces"]],
    reflect: { q: "Would retraining the model on more pharmacy text, keeping the same tokeniser, have fixed the drug-name problem?", a: "Partly: the model would learn the fragment sequences of common drugs better. But rare names would still shatter into fragments shared with unrelated words, and new drugs would arrive fragmented. The tokeniser sets the ceiling; data moves you toward it, not above it." },
  },

  "m12-multilingual-tokenisation": {
    simple: "A multilingual tokeniser must share one vocabulary across many scripts and languages; how the training corpus is balanced decides which languages are cheap, which are expensive, and which the model serves well.",
    concept:
      "One model serving many languages needs one tokeniser whose vocabulary covers them all. **Multilingual tokenisation** is the problem of building that shared vocabulary fairly. Every language competes for the same fixed number of tokens: pieces given to English are not available for Punjabi, Arabic or Japanese.\n\nIf the training corpus is mostly English, BPE and Unigram spend most merges on English pieces, and other languages are left with characters or bytes, which means long sequences, high cost and worse model quality for them. Balancing the corpus (sampling less-common languages more often than their share of the web) spreads the vocabulary more evenly, at a small cost to English compression. Scripts matter too: languages sharing a script (Hindi and Marathi in Devanagari; Punjabi written in Gurmukhi versus Shahmukhi) can share pieces; unrelated scripts cannot.\n\nByte-level fallback guarantees coverage of any script, but coverage is not fitness: a script spelled byte by byte costs three to four tokens per character.",
    why:
      "Models are increasingly expected to work for everyone, and the tokeniser is where language inequality is first built in. A tokeniser trained on web text as found gives English-speaking users cheaper, better service than Punjabi-speaking users of the same model, invisibly, before any training of the model itself. The problem exists because vocabulary is finite and corpora are unbalanced; the lesson exists so the imbalance is measured and corrected rather than inherited.",
    how: [
      "Assemble a corpus with every target language and script, and record each language's share.",
      "Resample so that lower-resource languages are over-represented relative to the raw web (a common rule raises small languages' sampling probability by a power like 0.3–0.7).",
      "Normalise Unicode consistently across scripts (NFKC), and decide how to treat script-specific marks (combining vowel signs in Indic scripts should stay attached to their consonants).",
      "Train a large vocabulary (100k–250k) with SentencePiece or byte-level BPE.",
      "Measure tokens per character for each language on held-out text; iterate on sampling until the spread is acceptable.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Language", "Share of raw web corpus", "Tokens per 100 characters (web-as-found tokeniser)", "Tokens per 100 characters (balanced tokeniser)"],
        rows: [
          ["English", "45%", "24", "26"],
          ["Spanish", "6%", "28", "27"],
          ["Hindi", "0.4%", "95", "38"],
          ["Punjabi (Gurmukhi)", "0.02%", "180", "45"],
          ["Japanese", "3%", "60", "40"],
        ],
      },
      caption: "Illustrative. The balanced tokeniser costs English two tokens per hundred characters and gives Punjabi a fourfold improvement.",
    },
    everyday: {
      title: "Seats at a shared table",
      text: "A shared vocabulary is a table with a fixed number of seats. If seats are handed out by who shouts loudest, English takes most of them and small languages stand at the back. A balanced tokeniser is a host who reserves seats so every language can sit, even if the loudest guest gets slightly fewer. The dinner is better for almost everyone.",
    },
    engineering: {
      title: "Budgeting a multilingual support assistant",
      text: "A company launching a support assistant in English, Hindi and Punjabi compared two models. Model A's tokeniser (English-centred) made Punjabi conversations cost about seven times English ones and truncated long Punjabi messages against the context limit. Model B, with a 256k multilingual vocabulary, brought Punjabi to about 1.8×. B's per-token price was higher, yet its blended cost across the three languages was lower, and its Punjabi answers were measurably better in evaluation, because the model had learned from coherent pieces rather than byte fragments. The tokeniser check decided the choice before any prompt was written.",
    },
    code: {
      title: "Measuring fairness across languages",
      lang: "py",
      src: `from tokenizers import Tokenizer

texts = {
    "en": "The parcel will arrive on Tuesday morning.",
    "hi": "पार्सल मंगलवार सुबह पहुंचेगा।",
    "pa": "ਪਾਰਸਲ ਮੰਗਲਵਾਰ ਸਵੇਰੇ ਪਹੁੰਚੇਗਾ।",
}

for model in ["gpt2", "xlm-roberta-base"]:
    tok = Tokenizer.from_pretrained(model)
    base = len(tok.encode(texts["en"]).tokens)
    row = [f"{lang}: {len(tok.encode(t).tokens) / base:4.1f}x" for lang, t in texts.items()]
    print(model, *row)`,
      lines: [
        { code: "base = len(tok.encode(texts[\"en\"]).tokens)", say: "English token count as the baseline; other languages are reported relative to it." },
        { code: "row = [f\"{lang}: {len(tok.encode(t).tokens) / base:4.1f}x\" for lang, t in texts.items()]", say: "The ratio per language is the fairness number: how much more each language costs for the same message." },
      ],
      output: "gpt2 en:  1.0x hi:  4.9x pa:  5.6x\nxlm-roberta-base en:  1.0x hi:  1.3x pa:  1.6x",
      note: "The English-trained tokeniser charges Punjabi five to six times as much; the multilingual one under two. Exact ratios vary with the sentence.",
    },
    useIt: "Before choosing a model for a multilingual product, measure token ratios per language on your own messages. When training a tokeniser for several languages, balance the corpus and check per-language compression. Expect scripts beyond Latin to need deliberate attention; Stage 9 covers Punjabi in depth.",
    takeaways: ["One vocabulary shared across languages: pieces given to one are taken from another.", "Unbalanced corpora make small languages expensive and poorly served before the model is even trained.", "Balance the corpus, use a large vocabulary, and measure tokens per character per language.", "Byte fallback guarantees coverage, not fitness."],
    terms: [["multilingual tokeniser", "one tokeniser whose vocabulary spans many languages and scripts"], ["corpus balancing", "resampling training text so smaller languages get a fairer share of the vocabulary"], ["low-resource language", "a language with little available text data, such as Punjabi relative to English"]],
    reflect: { q: "Hindi and Marathi both use Devanagari. Does a tokeniser trained on Hindi serve Marathi as well as Hindi?", a: "Better than a Latin-only tokeniser, because the characters and many syllable pieces are shared, but not as well as Hindi: Marathi's common words and endings differ, so they are spelled from smaller pieces. Script sharing helps at the character level; word-level pieces still need that language's text." },
  },

  "m12-script-and-code-switching-considerations": {
    simple: "Real text mixes scripts and languages in one message, and the same language can be written in several scripts; tokenisers and models must handle these mixes, or they fail on exactly the messages real users send.",
    concept:
      "People do not write in one tidy language. A message can switch language mid-sentence (**code-switching**: 'kal meeting cancel ho gayi, sorry'), write one language in another script (Romanised Punjabi: 'ki haal hai' for ਕੀ ਹਾਲ ਹੈ), mix scripts with numbers, emoji and product codes, or use a script in non-standard ways. Tokenisers and models trained on clean single-language text handle these mixes badly: Romanised Hindi tokenises as odd English fragments, mixed-script messages fall apart at every boundary, and the model's language identification flips back and forth.\n\nThe considerations are practical. Does the tokeniser have pieces for the Romanised form of the language, not only the native script? Does the training corpus contain real mixed messages? Is script normalisation (transliteration to one script) applied before the model, and is it reversible? Are language and script detected per message, or per span within a message?\n\nStage 9 treats Punjabi's three scripts in depth. Here the point is that the mixing is normal, that it is where tokenisers trained on clean text are weakest, and that handling it is mostly data and preprocessing work.",
    why:
      "Benchmarks are written in clean, single-script text; users are not. Chat logs from India, Nigeria, the Philippines or Switzerland are full of switching and Romanised writing. A product that handles only the textbook form of a language fails on a large share of its real messages, and the failures are invisible in evaluation unless the test set contains the mix. This lesson exists to put the mix on the checklist.",
    how: [
      "Collect real messages and measure how much switching, Romanisation and script mixing they contain.",
      "Check the tokeniser on those samples: tokens per character for Romanised text and for mixed-script text.",
      "Decide a normalisation strategy: transliterate Romanised text to the native script before the model (and keep the original for display), or train with both forms present.",
      "Detect language and script per span if the model routes by language; a per-message guess is wrong on mixed messages.",
      "Include switched and Romanised examples in fine-tuning data and in the evaluation set.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Message", "What is happening", "Risk for a clean-text tokeniser/model"],
        rows: [
          ["kal meeting cancel ho gayi, sorry", "Hindi in Latin script + English", "Romanised Hindi becomes meaningless English fragments; language detector says English"],
          ["ਆਰਡਰ #4417 ਕਦੋਂ ਆਵੇਗਾ?", "Gurmukhi + ASCII code", "script boundaries fragment both sides; the code may be mangled"],
          ["tusi great ho 🙏", "Romanised Punjabi + English + emoji", "no pieces for Romanised Punjabi; emoji as bytes"],
          ["کی حال ہے / ਕੀ ਹਾਲ ਹੈ / ki haal hai", "one phrase, three scripts", "treated as three unrelated inputs"],
        ],
      },
      caption: "All four rows are ordinary messages for millions of users. A model evaluated only on clean text has never seen them.",
    },
    everyday: {
      title: "The family group chat",
      text: "A family chat moves between Punjabi in Gurmukhi from the grandparents, Romanised Punjabi from the cousins, English from the teenagers and emoji from everyone, often within one message. No one in the family finds it confusing. A system that can only read one of those forms is excluded from most of the conversation.",
    },
    engineering: {
      title: "Transliteration in front of the model",
      text: "A fintech support assistant for India received 40% of Hindi messages in Latin script. The model's tokeniser had no pieces for Romanised Hindi, and intent accuracy on those messages was 20 points below Devanagari ones. The team added a transliteration step: a small model and dictionary map Romanised Hindi spans to Devanagari before the main model, with the original kept for the reply. Accuracy on Romanised messages rose to within 4 points of native script. They also added per-span language detection, because messages mixed English product terms with Hindi, and per-message detection had been routing half of them wrongly.",
    },
    code: {
      title: "Spotting script mixing in a message",
      lang: "py",
      src: `import unicodedata

def script_of(ch):
    if ch.isdigit() or not ch.isalpha():
        return "other"
    name = unicodedata.name(ch, "")
    return name.split()[0] if name else "unknown"     # LATIN, GURMUKHI, ARABIC, DEVANAGARI ...

def script_spans(text):
    spans, current, start = [], None, 0
    for i, ch in enumerate(text):
        s = script_of(ch)
        if s == "other":
            continue
        if s != current:
            if current:
                spans.append((current, text[start:i].strip()))
            current, start = s, i
    if current:
        spans.append((current, text[start:].strip()))
    return spans

print(script_spans("ਆਰਡਰ #4417 kadon aavega? please check"))`,
      lines: [
        { code: "return name.split()[0] if name else \"unknown\"     # LATIN, GURMUKHI, ARABIC, DEVANAGARI ...", say: "Unicode names begin with the script: 'GURMUKHI LETTER KA', 'LATIN SMALL LETTER A'. That first word identifies the script of each character." },
        { code: "if s != current:", say: "A change of script starts a new span. Each span can then be detected, transliterated or tokenised on its own." },
        { code: "print(script_spans(\"ਆਰਡਰ #4417 kadon aavega? please check\"))", say: "A Gurmukhi word, then Latin text that is Romanised Punjabi followed by English: the Latin span needs language detection, not just script detection." },
      ],
      output: "[('GURMUKHI', 'ਆਰਡਰ'), ('LATIN', '#4417 kadon aavega? please check')]",
      note: "Script detection is easy; telling Romanised Punjabi from English within the Latin span needs a language model or a dictionary, which Stage 9 builds.",
    },
    useIt: "Put real mixed messages in every evaluation set. Measure tokeniser fitness on Romanised and mixed text. Add transliteration and per-span language detection in front of the model when a user base writes a language in Latin script. Treat switching as normal input, not as an edge case.",
    takeaways: ["Real messages switch languages, mix scripts and Romanise; clean-text models are weakest there.", "Tokenisers trained on native scripts have no pieces for Romanised forms.", "Transliterate or train on both forms; detect language per span, not per message.", "Evaluate on the mix, or the failure is invisible."],
    terms: [["code-switching", "mixing two or more languages within one message or sentence"], ["Romanisation", "writing a language in the Latin alphabet instead of its native script"], ["script detection", "identifying which writing system each span of text uses"]],
    reflect: { q: "Your language detector labels 'kal meeting cancel ho gayi' as English with 80% confidence. What does that tell you about the detector's training data, and what should the pipeline do?", a: "The detector was trained on English and native-script Hindi, never on Romanised Hindi, so Latin letters look English to it. The pipeline needs a detector trained with Romanised samples (or a dictionary of common Romanised words), and should route by span: 'meeting' and 'cancel' are English, the rest is Hindi." },
  },
};

export const M12_QUIZ: Quiz[] = [
  {
    q: "Why do language models use subword tokens rather than whole words?",
    options: ["Words are too short", "Whole-word vocabularies cannot spell unseen words (UNK) and grow without bound; subwords cover everything with a fixed vocabulary and short sequences", "Subwords are easier for humans to read", "Words cannot be converted to numbers"],
    answer: 1,
    why: ["Length is not the issue.", "Correct. Coverage, short sequences, shared pieces and a fixed output vocabulary, all at once.", "They are harder to read; that is not the goal.", "Any string can be numbered; coverage and size are the problems."],
    reason: true,
  },
  {
    q: "In BPE training, which pair is merged at each step?",
    options: ["The longest pair", "The most frequent adjacent pair", "A random pair", "The pair with the highest likelihood gain"],
    answer: 1,
    why: ["Length is not the criterion.", "Correct. BPE counts adjacent pairs and merges the most frequent.", "No.", "That is WordPiece's criterion."],
  },
  {
    q: "What does the '##' prefix mean in a WordPiece token like '##ably'?",
    options: ["The token is a number", "The token continues the previous piece within a word", "The token is special", "The token is unknown"],
    answer: 1,
    why: ["No.", "Correct. ## marks a continuation; word-initial pieces have no prefix.", "Special tokens use brackets like [SEP].", "Unknown is [UNK]."],
  },
  {
    q: "A model built for English costs Punjabi users five times as much per message. The root cause is:",
    options: ["Punjabi has more words", "The tokeniser was trained mostly on English, so Punjabi is spelled from many small pieces", "The model is slower in Punjabi", "Unicode makes Punjabi larger"],
    answer: 1,
    why: ["Word counts are similar.", "Correct. Vocabulary pieces went to English; Punjabi tokenises to many tokens per character.", "Speed per token is the same; there are more tokens.", "Bytes are larger, but tokens, not bytes, are billed."],
    reason: true,
  },
  {
    q: "Which property does SentencePiece add that word-splitting tokenisers lack?",
    options: ["Faster training", "Reversible, language-independent tokenisation that treats spaces as characters", "Smaller models", "No need for a vocabulary"],
    answer: 1,
    why: ["Not the point.", "Correct. Spaces become ▁ pieces; any language works the same way; decode returns the exact text.", "Vocabulary size is separate.", "It still learns a vocabulary."],
  },
  {
    q: "After swapping to a new model, replies run on into invented user turns. Most likely cause?",
    options: ["Temperature too high", "The prompt uses the old model's special tokens, so the new model sees no end-of-turn marker it knows", "The vocabulary is too small", "Padding was omitted"],
    answer: 1,
    why: ["Would change wording, not structure.", "Correct. Chat templates differ; use the new model's own role and end tokens.", "Unrelated.", "Padding only affects batching."],
  },
  {
    q: "A model says 'strawberry' has two r's. Which explanation is right?",
    options: ["It was trained on bad data", "It sees tokens like 'straw' and 'berry', never individual letters, so letter counting is outside what it reads", "Its vocabulary is too large", "The question was ambiguous"],
    answer: 1,
    why: ["Data is not the cause.", "Correct. Spelling and counting are character-level tasks; tokens hide the characters.", "Size is irrelevant here.", "No."],
  },
  {
    q: "Doubling the vocabulary size from 64k to 128k mainly:",
    options: ["Halves the model's parameters", "Shortens sequences (most for non-English text) while enlarging the embedding and output layers and adding rarer tokens", "Removes the need for special tokens", "Makes English twice as cheap"],
    answer: 1,
    why: ["It increases them.", "Correct. The trade-off: compression versus table size and tail quality.", "Unrelated.", "English saturates early; the gain is elsewhere."],
  },
  {
    q: "A message 'ਆਰਡਰ #4417 kadon aavega? please check' is sent to a per-message language detector. Why is per-span detection better?",
    options: ["It is faster", "The message mixes Gurmukhi, Romanised Punjabi and English; one label for all of it is wrong for most of it", "Per-message detection cannot read numbers", "There is no difference"],
    answer: 1,
    why: ["Speed is not the reason.", "Correct. Code-switching and script mixing need handling per span.", "Numbers are not the issue.", "There is a large difference on mixed messages."],
  },
];

export const M12_EXERCISES: Exercise[] = [
  {
    title: "Run BPE by hand",
    kind: "calculate",
    task: "Corpus: 'hug' ×10, 'pug' ×5, 'pun' ×12, 'bun' ×4, 'hugs' ×5. Split into characters (no end marker). Perform the first three BPE merges, showing pair counts each time, and then tokenise the unseen word 'bugs'.",
    hints: ["Count each adjacent pair weighted by word frequency.", "After a merge, recount with the new symbol."],
    solution: "Initial pairs: (u,g) = 10+5+5 = 20; (h,u) = 15; (p,u) = 17; (u,n) = 16; (g,s) = 5; (b,u) = 4. Merge 1: 'ug' (20). Now (h,ug) = 15, (p,ug) = 5, (p,u) = 12, (u,n) = 16, (ug,s) = 5, (b,u) = 4. Merge 2: 'un' (16). Now (p,un) = 12, (b,un) = 4, (h,ug) = 15, (p,ug) = 5. Merge 3: 'hug' (15). Tokenise 'bugs': b u g s → apply 'ug' → [b, ug, s]; 'un' and 'hug' do not apply. Result: ['b', 'ug', 's'], three pieces for a word never seen.",
  },
  {
    title: "Compute the cost of a vocabulary choice",
    kind: "calculate",
    task: "A model has d = 2,048. Compare V = 32,000 with V = 160,000: compute the embedding-table parameters for each (ignore the output layer). If the larger vocabulary cuts Hindi tokens per message from 300 to 120 and Hindi is 30% of 1 million daily messages, how many Hindi tokens per day does it save?",
    hints: ["Parameters = V × d.", "Saved tokens = messages × share × (old − new)."],
    solution: "32,000 × 2,048 = 65.5 M parameters; 160,000 × 2,048 = 327.7 M, an extra 262 M. Hindi messages per day = 300,000; saving per message = 180 tokens; total = 54 million tokens per day. Whether that justifies 262 M extra parameters depends on hardware and price per token, which is exactly the trade-off the lesson describes.",
  },
  {
    title: "Measure tokeniser fitness on your own text",
    kind: "code",
    task: "Using the tokenizers library, load two tokenisers (for example 'gpt2' and 'xlm-roberta-base'). For ten sentences of your choice in two languages plus three strings of product codes, print characters per token for each tokeniser and each category. Which tokeniser would you choose for a bilingual product, and why?",
    hints: ["chars/token = len(text) / len(tokens).", "Average per category, then compare."],
    solution: "Expected pattern: both tokenisers give around 4 chars/token on English; the English-centred one drops to about 1 on Indic scripts and to around 2 on codes; the multilingual one stays near 2.5–3 on Indic text. Choose the multilingual tokeniser's model for a bilingual product unless English quality or price differences outweigh a 3× token cost on the second language; record the numbers with the decision.",
  },
  {
    title: "Render a chat template correctly",
    kind: "code",
    task: "Given a model whose template is '<|im_start|>role\\ncontent<|im_end|>\\n' per message with the final line '<|im_start|>assistant\\n', write render(messages) and show the output for a system message, a user message and no assistant reply yet. Then explain what would happen if the final '<|im_start|>assistant' line were omitted.",
    hints: ["Each message is wrapped identically; the prompt ends by opening the assistant's turn.", "Think about what the model predicts next if the assistant turn is not opened."],
    solution: "render returns '<|im_start|>system\\nYou are a support assistant.<|im_end|>\\n<|im_start|>user\\nIs the shop open on Sunday?<|im_end|>\\n<|im_start|>assistant\\n'. Without the final line, the most likely continuation after '<|im_end|>\\n' is another '<|im_start|>' followed by a role the model chooses, often 'user': the model may write the user's next message instead of answering, which is the runaway-conversation bug from the special-tokens lesson.",
  },
];
