import type { Exercise, LessonBody, Quiz } from "../types";

// Module 46: Punjabi AI product. One concept per lesson.
// Keys are lesson slugs: m46-<kebab of the concept title in map.ts>.

export const M46_BODIES: Record<string, LessonBody> = {
  "m46-punjabi-ai-application-architecture": {
    simple: "A Punjabi AI product is the standard assistant architecture with a language-and-script layer in front, a script-aware router in the middle, and per-script measurement at the end.",
    concept:
      "Every component from Stages 6 to 8 appears in a Punjabi product; the **Punjabi application architecture** adds a thin layer at three points. At the entrance: detect language and script (lessons 46.2–46.3), normalise with the versioned normaliser (46.4), and transliterate when the pivot experiment said to (46.5). In the middle: route by script and task to the model or adapter that scored best for that cell (45.1, 45.13), run retrieval over the Punjabi knowledge base (46.8), and generate with the reply-script rule. At the exit: post-check the output's script and language, record the trace with script tags, and collect feedback per script (46.9).\n\nAround it, the loop that keeps it improving (46.10): traces and feedback become labelled data, labelled data becomes gold sets and fine-tunes, the harness gates each release, and the dashboards (46.12) are per script. The design principle: the script is a first-class attribute of every request, document, model call, metric and decision, from the first byte to the last chart.",
    why:
      "Teams who bolt Punjabi onto an English assistant discover the problems one at a time in production: Urdu replies, Romanised queries finding nothing, a dashboard that hides Shahmukhi inside a healthy average. Designing the script layer in from the start costs a few components and saves the rewrite. It also makes the product honest: every number it reports can be split by script.",
    how: [
      "Entrance: language and script detection with a 'mixed' outcome; normalisation; optional transliteration to Gurmukhi for retrieval and reading.",
      "Routing: a table from (task, script) to model, adapter and prompt version, driven by the harness.",
      "Core: retrieval over the Punjabi knowledge base and English sources; generation with the reply-script rule; tools as in Stage 7.",
      "Exit: script and language post-check with retry or fallback; trace with script, dialect and mixing tags; feedback widgets in the user's script.",
      "Loop: feedback and traces → labelling queue → gold sets and training data → harness → release gate; dashboards per script.",
    ],
    visual: {
      kind: "flow",
      steps: ["request", "detect language + script", "normalise (versioned)", "transliterate if needed", "route by (task, script)", "retrieve: Punjabi KB + English sources", "generate in user's script", "post-check script", "trace + feedback (per script)", "improvement loop"],
      caption: "The grey boxes of a standard assistant with the script carried through every step.",
    },
    everyday: {
      title: "A clinic that takes patients in three languages",
      text: "At the reception desk someone notes the language you speak and the script you read (entrance). You are sent to a doctor who speaks it (routing). The doctor reads your file, which may be in English, and explains in your language (core). Before you leave, someone checks you understood and asks how it went (exit). The clinic's monthly review looks at waiting times and complaints per language (loop). A Punjabi AI product is that clinic.",
    },
    engineering: {
      title: "Retrofitting versus designing in",
      text: "Two companies built Punjabi support assistants. The first added Punjabi to an English assistant by translating the system prompt: six months of incident tickets followed (Urdu replies, Romanised queries failing, Hindi vocabulary, a dashboard average that hid all of it). The second designed the script layer first: detection, normalisation, routing table, post-check and per-script traces, with a harness of 400 items per script before launch. Its launch report had three columns, Shahmukhi flagged as 'assisted by human fallback', and its first quarter's incidents were about content, not language. The second team's extra up-front work was about three weeks.",
    },
    code: {
      title: "The request handler, with the script carried through",
      lang: "ts",
      src: `export async function handlePunjabiRequest(req: ChatRequest, session: Session): Promise<ChatReply> {
  const trace = new Trace({ feature: "pa-assistant", conversationId: req.conversationId, customerHash: hash(session.customerId) });
  const detected = await trace.span("detect", { text: req.text }, () => detectLanguageAndScript(req.text));     // { lang, script, mixed, confidence }
  const script = detected.script === "unknown" ? session.preferredScript : detected.script;
  const normalised = normalise(req.text, script, NORMALISER_VERSION);
  const forReading = script === "guru" ? normalised : await trace.span("transliterate", { script }, () => toGurmukhi(normalised, script));

  const route = ROUTES[req.task][script];                        // model, adapter, promptVersion, chosen by the harness
  const sources = await trace.span("retrieve", { script }, () => searchPunjabi(forReading, { audience: session.audience, limit: 20 }));
  const answer = await trace.span("generate", { route }, () => generateInScript(route, req.text, forReading, sources, script));

  const check = await trace.span("postcheck", { script }, () => checkScript(answer, script));
  const final = check.ok ? answer : await fallbackForScript(route, req.text, sources, script, trace);
  trace.meta.script = script; trace.meta.mixed = detected.mixed; trace.meta.dialect = detected.dialect;
  await trace.end();
  return { text: final, sources: sources.slice(0, 3), traceId: trace.id, script };
}`,
      lines: [
        { code: "const detected = await trace.span(\"detect\", { text: req.text }, () => detectLanguageAndScript(req.text));     // { lang, script, mixed, confidence }", say: "Detection is the first span. Its output decides everything after it, so it is traced." },
        { code: "const forReading = script === \"guru\" ? normalised : await trace.span(\"transliterate\", { script }, () => toGurmukhi(normalised, script));", say: "The pivot from lesson 45.13, applied only where the experiment showed it helps; the original text is kept for display and keyword search." },
        { code: "const route = ROUTES[req.task][script];                        // model, adapter, promptVersion, chosen by the harness", say: "A table, not an if-chain: the harness fills it, and changing a cell is a configuration change." },
        { code: "const final = check.ok ? answer : await fallbackForScript(route, req.text, sources, script, trace);", say: "A wrong-script answer never reaches the user; the fallback retries with a stricter prompt or a different model." },
        { code: "trace.meta.script = script; trace.meta.mixed = detected.mixed; trace.meta.dialect = detected.dialect;", say: "Script, mixing and dialect on every trace: this is what makes per-script dashboards and labelling queues possible." },
      ],
    },
    useIt: "Design the script layer in from the first sprint: detection, normalisation, transliteration, a routing table, a post-check and script-tagged traces. Every later lesson in this module fills in one of those boxes. The payoff is a product whose every number can be split by script, and whose Punjabi failures are caught before users see them.",
    takeaways: ["The Punjabi product is the standard assistant plus a script layer at entrance, middle and exit.", "Script is a first-class attribute of every request, document, call, metric and decision.", "Route by (task, script) from a harness-driven table; post-check output script.", "The improvement loop and dashboards are per script."],
    terms: [["script layer", "the detection, normalisation, transliteration, routing and post-check components that handle Punjabi's three written forms"], ["routing table", "a configuration mapping task and script to model, adapter and prompt version"], ["post-check", "an automatic check that the answer is in the requested script and language"]],
    reflect: { q: "Why should the routing be a table rather than code with if-statements?", a: "Because the harness changes the best choice per cell over time, and a table lets you change one cell (Shahmukhi QA → new adapter) without a deploy of logic, with the harness report as the justification. It also makes the current routing readable in one place." },
  },

  "m46-language-detection": {
    simple: "Language detection decides whether a message is Punjabi, Hindi, Urdu, English or mixed; for Punjabi it must use function words and allow 'mixed', because scripts alone cannot separate Punjabi from its neighbours.",
    concept:
      "**Language detection** labels a text with its language. Off-the-shelf detectors are trained on clean documents and confuse Punjabi's neighbours: Gurmukhi is distinctive, but Shahmukhi reads as Urdu, Romanised Punjabi reads as English, Hindi or Indonesian, and Devanagari-written Punjabi (rare but real) reads as Hindi. Short chat messages make it worse.\n\nA Punjabi product needs a detector built for its traffic: script detection first (lesson 46.3), then a per-script language decision. In Arabic script: Punjabi versus Urdu by function words and verb endings. In Latin script: Romanised Punjabi versus English versus Romanised Hindi by function words. In Gurmukhi: Punjabi by default, with a Hindi check for transliterated Hindi. The output is a language, a confidence and a 'mixed' flag with the dominant language, not a single hard label; the router and the reply-script rule use all three. The detector is itself a classifier (lesson 45.3) trained on labelled messages, evaluated per script, and monitored, because new slang and products shift its inputs.",
    why:
      "The detector decides the route, the reply language and the metrics bucket. A wrong detection cascades: a Punjabi message routed as Urdu gets an Urdu reply; a Romanised Punjabi message detected as English gets English; and both are logged in the wrong bucket, so the dashboard never shows the mistake. Detection errors are the quietest, most expensive errors in a Punjabi product.",
    how: [
      "Detect script and dominant script with Unicode ranges; handle mixed-script messages.",
      "Within the script, apply a language classifier: function-word and character n-gram features, or a small fine-tuned encoder, trained on labelled real messages.",
      "Return language, confidence, and mixed-language information (word-level tags when needed, lesson 44.9).",
      "Use session history: a user who has written Punjabi for five turns and sends 'ok' is still a Punjabi user.",
      "Evaluate per script on real messages; log low-confidence detections to the labelling queue.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Message", "Script", "Off-the-shelf detector says", "Correct", "Decided by"],
        rows: [
          ["ਮੇਰਾ ਆਰਡਰ ਕਿੱਥੇ ਹੈ?", "Gurmukhi", "pa", "pa", "script"],
          ["میرا آرڈر کتھے اے؟", "Arabic", "ur", "pa (Shahmukhi)", "اے, کتھے are Punjabi; Urdu would be ہے, کہاں"],
          ["mera order kithe hai", "Latin", "en / id / hi", "pa (Romanised)", "kithe, mera…hai pattern; 'kithe' is Punjabi, Hindi is 'kahan'"],
          ["ok thanks", "Latin", "en", "pa user, English message", "session history → reply in Punjabi"],
          ["ਮੇਰਾ order cancel ਕਰ ਦੋ", "mixed", "pa", "pa, mixed", "dominant script + word tags"],
        ],
      },
      caption: "The detector that ships is the one that gets rows two to five right.",
    },
    everyday: {
      title: "Hearing which language a friend is speaking",
      text: "On the phone you know within two words whether your friend is speaking Punjabi or Hindi, even though half the words are shared, because of the small words: 'kithe' not 'kahan', 'ae' not 'hai', 'nu' not 'ko'. You do not need the whole sentence, and you do not get confused when an English word appears. A good detector listens for the same small words and is just as relaxed about the English ones.",
    },
    engineering: {
      title: "The detector that was routing Punjabi to the Urdu model",
      text: "A payments app's traces showed 31% of Shahmukhi conversations ending in a thumbs-down. The language detector (a general library) labelled 92% of Shahmukhi Punjabi as Urdu, so those users were routed to the Urdu assistant and answered in Urdu. The team trained a Punjabi-versus-Urdu classifier on 8,000 labelled Arabic-script messages (function words plus character trigrams; 96% accuracy) and added session history. Shahmukhi thumbs-downs fell to 12% in a week. The incident had been invisible on the dashboard because the misdetected conversations were counted as Urdu successes.",
    },
    maths: {
      formula: "P(lang | message) ∝ P(lang) · Π over words P(word | lang)  (a naive Bayes detector);  decide the language with the highest posterior; report confidence = max posterior",
      meaning: "Each word gives evidence for a language in proportion to how much more often it appears there; multiplying the evidence (or adding logs) across words gives the decision, and the margin gives the confidence.",
      worked: [
        "Arabic-script message: میرا آرڈر کتھے اے. Word evidence (log-odds Punjabi vs Urdu, from training counts): میرا 0.0 (shared), آرڈر 0.0 (shared), کتھے +3.2 (Punjabi; Urdu uses کہاں), اے +2.8 (Punjabi; Urdu uses ہے).",
        "Total log-odds = +6.0 → posterior for Punjabi ≈ 1 ÷ (1 + e⁻⁶) ≈ 0.9975. Confident Punjabi.",
        "Message: میرا آرڈر کہاں ہے: evidence 0, 0, −3.0, −2.5 → −5.5 → Punjabi ≈ 0.004: confident Urdu.",
        "Message: میرا آرڈر (two shared words): total 0 → 0.5. Low confidence: use session history, or ask the user, and queue the message for labelling.",
      ],
    },
    code: {
      title: "Language detection per script with function-word evidence",
      lang: "py",
      src: `import math, re

GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")
ARABIC = re.compile(r"[\\u0600-\\u06FF\\u0750-\\u077F]")

# log-odds (Punjabi vs the neighbour language) learned from labelled messages; a few shown
ARAB_EVIDENCE = {"اے": 2.8, "کتھے": 3.2, "وچ": 2.5, "نوں": 2.6, "ساڈا": 2.4, "ہے": -2.5, "کہاں": -3.0, "میں": -0.8, "کو": -2.2, "ہمارا": -2.3}
LATN_EVIDENCE = {"kithe": 3.0, "mainu": 2.9, "sanu": 2.7, "tusi": 2.8, "nu": 1.5, "da": 0.8, "di": 0.9, "kahan": -3.0, "mujhe": -2.8, "aap": -1.5, "the": -2.0, "is": -1.8, "my": -1.9}

def detect(text, history_lang=None):
    if GURMUKHI.search(text):
        return {"lang": "pa", "script": "guru", "confidence": 0.99}
    table = ARAB_EVIDENCE if ARABIC.search(text) else LATN_EVIDENCE
    script = "arab" if ARABIC.search(text) else "latn"
    words = re.findall(r"[\\w\\u0600-\\u06FF]+", text.lower())
    logodds = sum(table.get(w, 0.0) for w in words)
    p_pa = 1 / (1 + math.exp(-logodds))
    neighbour = "ur" if script == "arab" else "en"
    if abs(logodds) < 1.0 and history_lang:
        return {"lang": history_lang, "script": script, "confidence": 0.6, "from_history": True}
    return {"lang": "pa" if p_pa >= 0.5 else neighbour, "script": script, "confidence": round(max(p_pa, 1 - p_pa), 3)}

print(detect("میرا آرڈر کتھے اے"))
print(detect("mera order kithe hai"))
print(detect("ok thanks", history_lang="pa"))`,
      lines: [
        { code: "ARAB_EVIDENCE = {\"اے\": 2.8, \"کتھے\": 3.2, \"وچ\": 2.5, \"نوں\": 2.6, \"ساڈا\": 2.4, \"ہے\": -2.5, \"کہاں\": -3.0, \"میں\": -0.8, \"کو\": -2.2, \"ہمارا\": -2.3}", say: "Punjabi function words push positive, Urdu ones negative; the numbers come from counting labelled messages." },
        { code: "logodds = sum(table.get(w, 0.0) for w in words)", say: "Evidence adds up across the message; shared words contribute nothing." },
        { code: "if abs(logodds) < 1.0 and history_lang:", say: "A short or neutral message defers to the conversation's history instead of guessing." },
        { code: "return {\"lang\": \"pa\" if p_pa >= 0.5 else neighbour, \"script\": script, \"confidence\": round(max(p_pa, 1 - p_pa), 3)}", say: "Language, script and confidence together; the router treats low confidence differently from a confident label." },
      ],
      output: "{'lang': 'pa', 'script': 'arab', 'confidence': 0.998}\n{'lang': 'pa', 'script': 'latn', 'confidence': 0.998}\n{'lang': 'pa', 'script': 'latn', 'confidence': 0.6, 'from_history': True}",
      note: "A production detector learns the evidence table from thousands of labelled messages (or fine-tunes a small encoder) and adds character n-grams for words not in the table.",
    },
    useIt: "Build and own the language detector: script first, then a per-script Punjabi-versus-neighbour classifier trained on your labelled messages, with confidence, a mixed flag and session history. Evaluate it per script, monitor its confidence distribution, and send low-confidence messages to the labelling queue.",
    takeaways: ["General detectors label Shahmukhi as Urdu and Romanised Punjabi as English or Hindi.", "Detect script first, then language within the script using function words; allow 'mixed'.", "Return confidence and use session history for short messages.", "Detection errors cascade into routing, reply language and metrics; evaluate and monitor the detector itself."],
    terms: [["language detection", "classifying a text's language"], ["function-word evidence", "log-odds contributed by small grammatical words that differ between neighbouring languages"], ["session history", "the languages a user has used earlier in the conversation, used to resolve short messages"]],
    reflect: { q: "A user writes 'ਹਾਂ ਜੀ' then 'ok' then 'kal aa jao'. What should the detector say for each and why?", a: "Gurmukhi Punjabi (script); English word but Punjabi user by history, so reply in Punjabi; Romanised Punjabi (kal, aa, jao are Punjabi function and verb forms; Hindi would be 'kal aa jao' too, so history and 'jao' versus 'aao' tip it). The reply script follows the user's script per message: Gurmukhi, then Gurmukhi (history), then Romanised." },
  },

  "m46-script-detection": {
    simple: "Script detection finds which writing systems a message uses and which dominates, by Unicode ranges, and flags mixed-script messages; it is cheap, exact, and the first decision in the pipeline.",
    concept:
      "**Script detection** is simpler than language detection and comes before it. Every character belongs to a Unicode block: Gurmukhi (U+0A00–U+0A7F), Arabic and its supplements (U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF for letters such as ࣇ), Devanagari (U+0900–U+097F), Latin. Count the letters per script, ignoring digits, punctuation and emoji, and the dominant script is the one with most letters; a message with letters from two scripts is mixed, and the share of each is recorded.\n\nThree outputs matter: the dominant script (drives the reply script), the mixing share (drives the mixed flag and keyword handling), and 'no letters' (emoji-only or numeric messages, which defer to history). Romanised Punjabi and English are both Latin; script detection cannot separate them, which is why language detection follows. Devanagari in a Punjabi product usually means Hindi, occasionally Punjabi typed in Devanagari; it is routed to the Hindi path with a Punjabi check.",
    why:
      "The reply must be in the user's script, retrieval must transliterate the right inputs, the normaliser must apply the right rules, and metrics must be bucketed by script. All of these need an exact, instant answer to 'which script is this?'. Script detection is a dozen lines of code that every other Punjabi component depends on, and getting it wrong (counting punctuation, missing the Arabic supplement blocks) breaks them quietly.",
    how: [
      "Normalise first (NFC), so combining marks are attached to their letters.",
      "For each character, classify by Unicode block; count only letters and combining marks, skipping digits, punctuation, spaces, emoji and symbols.",
      "Compute the share per script; the dominant script is the largest share; mixed if the second share exceeds a threshold (say 15%).",
      "Return dominant, shares, and a 'no letters' flag; the language detector takes it from there.",
      "Log the distribution of scripts per day; a sudden change usually means a keyboard app update or a new user segment.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Script", "Unicode blocks", "Means in a Punjabi product", "Next step"],
        rows: [
          ["Gurmukhi", "U+0A00–U+0A7F", "Punjabi (rarely transliterated Hindi)", "language = pa; Hindi check optional"],
          ["Arabic", "U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF", "Shahmukhi Punjabi or Urdu", "Punjabi-vs-Urdu detector"],
          ["Latin", "A–Z, a–z, Latin-1 letters", "Romanised Punjabi, English, Romanised Hindi", "Latin-script language detector"],
          ["Devanagari", "U+0900–U+097F", "Hindi (rarely Devanagari Punjabi)", "Hindi path with Punjabi check"],
          ["none", "digits, emoji, punctuation only", "a reply like '👍' or '2'", "use session history"],
        ],
      },
      caption: "Script detection sorts by block; it never decides language on its own for Arabic and Latin scripts.",
    },
    everyday: {
      title: "Sorting post by the alphabet on the envelope",
      text: "A sorting clerk glances at an envelope and knows instantly whether the address is in Gurmukhi, Arabic script or Latin letters, without reading a word. That glance decides which desk gets the letter. The clerk does not try to tell Punjabi from Urdu at this step; the desk's reader does that. Script detection is the glance.",
    },
    engineering: {
      title: "The missing Unicode block",
      text: "A Shahmukhi assistant replied in Gurmukhi to some users. The script detector counted letters in U+0600–U+06FF only; messages typed on a particular keyboard used ݨ (U+0768, in the Arabic Supplement block) and ࣇ (U+08C7, Arabic Extended-B), which were classed as 'other'. Messages with several such letters tipped to 'no letters' or to a tiny Latin share, and the fallback script was Gurmukhi. Adding the supplement blocks fixed it. The team then added a daily check: the share of messages with 'other' letters should be near zero, and any rise pages someone.",
    },
    maths: {
      formula: "share(script) = letters in script ÷ all letters;   dominant = argmax share;   mixed if second-largest share ≥ 0.15",
      meaning: "Only letters count. The threshold for 'mixed' should be set from data: too low flags every message with one English word; too high misses genuine mixing.",
      worked: [
        "ਮੇਰਾ order cancel ਕਰ ਦੋ: Gurmukhi letters (with marks) 13, Latin letters 11. Shares: Gurmukhi 0.54, Latin 0.46 → dominant Gurmukhi, mixed.",
        "mera order kithe hai 😡: Latin 17, no other letters; emoji ignored → Latin 1.0, not mixed; language detection decides Romanised Punjabi.",
        "میرا آرڈر کتھے اے: Arabic 13 → Arabic 1.0 → Punjabi-vs-Urdu detector.",
        "'2' alone: no letters → defer to history.",
      ],
    },
    code: {
      title: "Script detection by Unicode block",
      lang: "py",
      src: `import unicodedata

def block_of(ch):
    cp = ord(ch)
    if 0x0A00 <= cp <= 0x0A7F: return "guru"
    if 0x0600 <= cp <= 0x06FF or 0x0750 <= cp <= 0x077F or 0x08A0 <= cp <= 0x08FF: return "arab"
    if 0x0900 <= cp <= 0x097F: return "deva"
    if ch.isascii() and ch.isalpha() or 0x00C0 <= cp <= 0x024F: return "latn"
    return None

def detect_script(text, mixed_threshold=0.15):
    text = unicodedata.normalize("NFC", text)
    counts = {}
    for ch in text:
        if not (ch.isalpha() or unicodedata.category(ch) in ("Mn", "Mc")):
            continue                                      # skip digits, punctuation, emoji, spaces
        b = block_of(ch)
        if b: counts[b] = counts.get(b, 0) + 1
    total = sum(counts.values())
    if total == 0:
        return {"dominant": None, "shares": {}, "mixed": False}
    shares = {b: round(n / total, 2) for b, n in counts.items()}
    ordered = sorted(shares.items(), key=lambda kv: kv[1], reverse=True)
    mixed = len(ordered) > 1 and ordered[1][1] >= mixed_threshold
    return {"dominant": ordered[0][0], "shares": shares, "mixed": mixed}

print(detect_script("ਮੇਰਾ order cancel ਕਰ ਦੋ"))
print(detect_script("میرا آرڈر کتھے اے"))
print(detect_script("👍 2"))`,
      lines: [
        { code: "if 0x0600 <= cp <= 0x06FF or 0x0750 <= cp <= 0x077F or 0x08A0 <= cp <= 0x08FF: return \"arab\"", say: "All three Arabic blocks, so Shahmukhi's extra letters (ݨ, ࣇ) count as Arabic script." },
        { code: "if not (ch.isalpha() or unicodedata.category(ch) in (\"Mn\", \"Mc\")):", say: "Letters and combining marks only; a vowel sign is part of its script's count, punctuation and emoji are not." },
        { code: "mixed = len(ordered) > 1 and ordered[1][1] >= mixed_threshold", say: "Mixed when the second script is a real share, not a stray character." },
        { code: "return {\"dominant\": None, \"shares\": {}, \"mixed\": False}", say: "No letters at all: the caller uses session history instead of guessing." },
      ],
      output: "{'dominant': 'guru', 'shares': {'guru': 0.54, 'latn': 0.46}, 'mixed': True}\n{'dominant': 'arab', 'shares': {'arab': 1.0}, 'mixed': False}\n{'dominant': None, 'shares': {}, 'mixed': False}",
    },
    useIt: "Put script detection first in every Punjabi request path and document ingestion job: normalise, count letters by block including the Arabic supplement blocks, report dominant script, shares and a mixed flag, defer to history when there are no letters, and monitor the daily script distribution for surprises.",
    takeaways: ["Script detection is exact and cheap: count letters by Unicode block after NFC.", "Report dominant script, shares and mixed; never decide language from script alone for Arabic and Latin.", "Include the Arabic supplement blocks for Shahmukhi's extra letters.", "No letters → session history; monitor the script distribution daily."],
    terms: [["Unicode block", "a range of code points assigned to one script"], ["dominant script", "the script with the most letters in a message"], ["mixed-script message", "a message with a substantial share of letters from two scripts"]],
    reflect: { q: "Why skip digits and punctuation when counting letters for script detection?", a: "A Gurmukhi message with a long order number would otherwise look mostly Latin or 'other', and a message of emoji and a full stop would be classed by the full stop. Only letters and their marks carry script information." },
  },

  "m46-text-normalisation-in-the-product": {
    simple: "In the product, the versioned normaliser runs at the API edge on every input, the same version is used for indexes and evaluation, and the user's original text is preserved for display.",
    concept:
      "Module 44 built the normaliser; **normalisation in the product** is about where it runs and how its version is managed. It runs once, at the entrance, as middleware: every message, every uploaded document, every knowledge-base edit passes through the same function with the same version. The output has two forms: the matching form (normalised, used for detection, retrieval, deduplication, caching keys and evaluation) and the display form (the user's original text with only encoding and invisible-character fixes), because users should see their own spelling and digits echoed back, not a canonicalised version.\n\nThe version is the contract. Indexes record the normaliser version they were built with; a new version means a rebuild. The harness records it so scores are comparable. Caches key on normalised text plus version. And the normaliser is tested like code: a fixed set of input–output pairs per script, run in CI, so a change to the sihari rule or a Shahmukhi letter map cannot slip through unnoticed.",
    why:
      "A normaliser that runs in some paths and not others, or at different versions, produces the subtle bugs of module 44 at production scale: a query that matches in testing and not in production, a cache that never hits for Shahmukhi, an evaluation that scores lower than the live system. Making it middleware with a version makes those bugs structurally impossible.",
    how: [
      "Implement the normaliser as a library with a version constant and a test file of input–output pairs per script.",
      "Run it as middleware at the API edge for messages, and in the ingestion job for documents; produce matching and display forms.",
      "Store the version with every index, cache namespace, dataset and harness run.",
      "On a version change: rebuild indexes, invalidate caches, re-run the harness, compare.",
      "Monitor: the share of inputs changed by normalisation per script, which reveals keyboard and encoding issues in the wild.",
    ],
    visual: {
      kind: "flow",
      steps: ["request text", "decode + NFC + strip invisibles", "display form (kept)", "script-specific rules (variants, sihari, digits, punctuation)", "matching form", "detection · retrieval · cache key · trace", "index built with the same version"],
      caption: "Two forms leave the normaliser: one for people, one for machines. Both carry the version.",
    },
    everyday: {
      title: "The reception desk that fixes the paperwork, not your name",
      text: "A good receptionist corrects the form's formatting (date order, capital letters) so the file system can find you, but does not change how you spell your own name on the badge you wear. The matching form is the file; the display form is the badge. One desk does both, for everyone, the same way every day.",
    },
    engineering: {
      title: "The cache that never hit for Shahmukhi",
      text: "A Punjabi FAQ assistant cached answers by question text. Cache hit rate: Gurmukhi 41%, Shahmukhi 3%. Shahmukhi questions arrived with different yeh and kaf variants and zero-width characters from different keyboards, so identical questions had different keys. Moving normalisation into the edge middleware and keying the cache on the matching form plus the normaliser version raised Shahmukhi hits to 37%. The same change fixed a mismatch between the harness (which normalised) and production (which had not), explaining a 6-point gap between test and live scores.",
    },
    maths: {
      formula: "change rate(script) = inputs where matching form ≠ display form ÷ inputs in that script;   cache hit rate = hits ÷ lookups, keyed on (matching form, version)",
      meaning: "The change rate shows how much normalisation is doing per script, a health signal for keyboards and encodings; the hit rate shows whether equivalent inputs are being recognised as equivalent.",
      worked: [
        "A day of traffic: Gurmukhi 20,000 messages, 2,400 changed by normalisation (12%, mostly sihari order and nukta forms). Shahmukhi 6,000 messages, 3,900 changed (65%: yeh/kaf variants and zero-width joiners). Romanised 15,000, 9,100 changed (61%: lowercasing and repeats).",
        "A jump of Gurmukhi change rate from 12% to 40% in one day pointed at a popular keyboard update that started emitting sihari before the consonant.",
        "Cache: 6,000 Shahmukhi lookups, 180 hits before (3%), 2,220 after (37%), with the same questions. Nothing about the questions changed; the keys did.",
      ],
    },
    code: {
      title: "Normalisation middleware with two forms and a version",
      lang: "ts",
      src: `import { normalise, NORMALISER_VERSION } from "./normalise";   // the module-44 normaliser, ported

export function normalisationMiddleware(req: Request, res: Response, next: NextFunction) {
  const raw = String(req.body.text ?? "");
  const display = normalise(raw, "display");                      // decode, NFC, invisibles only
  const script = detectScript(display).dominant ?? req.session.preferredScript ?? "guru";
  const matching = normalise(display, script);                     // script-specific rules
  req.text = { raw, display, matching, script, normaliserVersion: NORMALISER_VERSION };
  res.setHeader("X-Normaliser-Version", NORMALISER_VERSION);
  metrics.increment("normalise.changed", { script, changed: String(matching !== display) });
  next();
}

export function cacheKey(text: { matching: string; script: string; normaliserVersion: string }, task: string) {
  return sha256([task, text.script, text.normaliserVersion, text.matching].join("\\u0000"));
}`,
      lines: [
        { code: "const display = normalise(raw, \"display\");                      // decode, NFC, invisibles only", say: "The display form keeps the user's spelling and digits; it is what the reply echoes." },
        { code: "const matching = normalise(display, script);                     // script-specific rules", say: "The matching form feeds detection, retrieval and caching. Same function the index used." },
        { code: "req.text = { raw, display, matching, script, normaliserVersion: NORMALISER_VERSION };", say: "Everything downstream reads from this object; nobody re-normalises with their own rules." },
        { code: "metrics.increment(\"normalise.changed\", { script, changed: String(matching !== display) });", say: "The change rate per script, on the dashboard. Spikes mean a keyboard or encoding issue in the wild." },
        { code: "return sha256([task, text.script, text.normaliserVersion, text.matching].join(\"\\u0000\"));", say: "Cache keys include the version, so a normaliser change cannot serve stale answers for inputs that now normalise differently." },
      ],
    },
    useIt: "Run the normaliser as edge middleware and in ingestion with a single version; keep display and matching forms; put the version on indexes, caches, datasets and harness runs; test it in CI with per-script pairs; and watch the per-script change rate as a health signal.",
    takeaways: ["One normaliser, one version, at the edge and in ingestion.", "Two forms: display for people, matching for machines.", "Version on every index, cache key, dataset and harness run; change means rebuild.", "The per-script change rate is a monitoring signal."],
    terms: [["matching form", "the fully normalised text used for detection, retrieval and caching"], ["display form", "the user's text with only encoding and invisible-character fixes"], ["normaliser version", "the identifier stored with everything that depends on the normaliser's rules"]],
    reflect: { q: "Why not normalise the knowledge-base articles when they are written, once, and skip normalisation at query time?", a: "Queries arrive from every keyboard and encoding; if they are not normalised with the same rules, they will not match the normalised index. Both sides must pass through the same function and version, every time." },
  },

  "m46-translation-and-transliteration-workflows": {
    simple: "In the product, translation and transliteration are workflows with caches, glossaries and review queues: transliterate to connect scripts, translate to reuse English content, and route high-stakes text to people.",
    concept:
      "Lessons 43.9 and 45.5 covered the techniques; **workflows** are how they run in a product. Three recurring flows. Input pivot: transliterate Romanised and Shahmukhi queries to Gurmukhi for retrieval and reading (per the pivot experiment), keeping the original for display and keyword search. Content reuse: translate English knowledge-base articles into Gurmukhi (machine translation, glossary enforcement, editor review for high-stakes articles), store the translations as first-class articles with their source version, and re-translate when the English source changes. Output pivot: when a model answers in Gurmukhi for a Romanised or Shahmukhi user, transliterate the answer out, with a naturalness check for Shahmukhi.\n\nEach flow has a cache (the same sentence transliterated or translated once), a glossary (terms that must not change), a quality gate (chrF regression on reference sets; script post-check), and a review queue (human editors for legal, medical and financial content, and for low-confidence machine output). The flows are versioned: translation model version and glossary version are stored with every translated text.",
    why:
      "Translation and transliteration touch every Punjabi answer and document. Done ad hoc they are slow (re-translating the same sentence), inconsistent (a term translated three ways) and unsafe (a machine-translated refund policy with a wrong number). Done as workflows with caches, glossaries, gates and queues, they are cheap, consistent and gated by stakes.",
    how: [
      "Define the flows and their triggers: query input, article publish or update, answer output.",
      "Add a cache keyed on (text matching form, direction, model version, glossary version).",
      "Enforce a glossary of fixed terms (product names, legal terms) before and after machine translation.",
      "Gate: automatic checks (script post-check, chrF regression on references, number and entity preservation) and a review queue for high-stakes categories and low-confidence outputs.",
      "Store outputs with source version, model version, glossary version and reviewer; re-run when any input changes.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Flow", "Trigger", "Tool", "Cache key", "Gate", "Human queue"],
        rows: [
          ["input pivot", "Romanised / Shahmukhi query", "transliteration model", "matching text + direction + model version", "none (fast path); logged", "sampled weekly"],
          ["content reuse", "English article published or changed", "translation model + glossary", "article id + source version + model + glossary", "chrF regression, number/entity check, script check", "legal, medical, financial; low confidence"],
          ["output pivot", "answer generated in Gurmukhi for another script", "transliteration + naturalness check", "answer text + target script + model version", "script post-check; naturalness for Shahmukhi", "low naturalness → direct generation retry"],
          ["user-visible translation", "'show in English' button", "translation model", "text + direction + model", "none; labelled as machine translation", "none"],
        ],
      },
      caption: "Four flows, one pattern: cache, glossary, gate, queue, version.",
    },
    everyday: {
      title: "The office translator's filing cabinet",
      text: "A good office translator keeps a cabinet of everything already translated, a list of the company's fixed terms, a rule about which documents the lawyer must check, and a note on each translation of which dictionary edition was used. They do not retranslate last week's letter from scratch, do not invent a new word for 'refund' each time, and do not send a contract out unchecked. The workflow is that cabinet, list, rule and note.",
    },
    engineering: {
      title: "Keeping 1,200 translated articles in sync",
      text: "A bank's Gurmukhi help centre is machine-translated from English with a 300-term glossary and editor review for 'terms and conditions' and 'fees' categories. Each Gurmukhi article stores the English source version, the translation model version and the glossary version. A nightly job finds English articles changed since their translation's source version and re-translates them (cache hits for unchanged paragraphs keep cost down), runs the number and entity check (every amount, date and product name in the English must appear in the Gurmukhi), and queues high-stakes ones for an editor. When the translation model was upgraded, the job re-translated everything, the chrF regression gate on 800 references passed, and 23 articles failed the number check and went to review; two had a wrong fee.",
    },
    maths: {
      formula: "number preservation = numbers in source that appear in target ÷ numbers in source;  gate: must be 1.0 for financial, legal and medical content",
      meaning: "chrF cannot see a wrong amount. Counting whether every number, date and code in the source appears in the translation is a cheap exact check that catches the errors that matter most.",
      worked: [
        "Source: 'A late fee of ₹250 applies after 15 days; the annual rate is 18.5%.' Numbers: 250, 15, 18.5.",
        "Translation A: ਲੇਟ ਫੀਸ ₹250, 15 ਦਿਨ, 18.5% → 3 of 3 present → 1.0, passes.",
        "Translation B renders the rate as 18% → 2 of 3 → 0.67, fails the gate; queued for an editor regardless of its chrF.",
        "Over 1,200 articles, 23 failed; the gate costs nothing and caught two real fee errors that reviewers had missed in a prior manual pass.",
      ],
    },
    code: {
      title: "Translate-with-cache-glossary-gate for an article",
      lang: "ts",
      src: `export async function translateArticle(article: Article, glossary: Glossary): Promise<Translation> {
  const paragraphs = article.body.split(/\\n\\s*\\n/);
  const out: string[] = [];
  for (const p of paragraphs) {
    const key = cacheKey({ matching: normalise(p, "latn"), script: "latn", normaliserVersion: NORMALISER_VERSION }, "translate:en>pa_Guru:" + MT_MODEL_VERSION + ":" + glossary.version);
    const cached = await cache.get(key);
    if (cached) { out.push(cached); continue; }
    const protectedText = glossary.protect(p);                       // wraps fixed terms so the model keeps them
    const translated = await mt.translate(protectedText, { src: "eng_Latn", tgt: "pan_Guru" });
    const restored = glossary.restore(translated);                   // swaps wrappers for the agreed Gurmukhi terms
    await cache.set(key, restored);
    out.push(restored);
  }
  const body = out.join("\\n\\n");
  const checks = { numbers: numbersPreserved(article.body, body), script: detectScript(body).dominant === "guru" };
  const needsReview = HIGH_STAKES.has(article.category) || checks.numbers < 1 || !checks.script;
  return { articleId: article.id, sourceVersion: article.version, body, mtModel: MT_MODEL_VERSION, glossaryVersion: glossary.version, checks, status: needsReview ? "review" : "published" };
}`,
      lines: [
        { code: "const key = cacheKey({ matching: normalise(p, \"latn\"), script: \"latn\", normaliserVersion: NORMALISER_VERSION }, \"translate:en>pa_Guru:\" + MT_MODEL_VERSION + \":\" + glossary.version);", say: "Paragraph-level cache keyed on text, direction, model and glossary versions: unchanged paragraphs are never re-translated." },
        { code: "const protectedText = glossary.protect(p);                       // wraps fixed terms so the model keeps them", say: "Fixed terms are shielded before translation and restored after, so 'Standing Instruction' is always the agreed Gurmukhi phrase." },
        { code: "const checks = { numbers: numbersPreserved(article.body, body), script: detectScript(body).dominant === \"guru\" };", say: "The two cheap gates: every number survived, and the output is actually Gurmukhi." },
        { code: "const needsReview = HIGH_STAKES.has(article.category) || checks.numbers < 1 || !checks.script;", say: "Stakes and failed checks route to a human; everything else publishes with its versions recorded." },
      ],
    },
    useIt: "Run translation and transliteration as versioned workflows: cache at paragraph or sentence level, enforce a glossary, gate with number and script checks plus chrF regression, queue high-stakes and low-confidence outputs for editors, and store every output with its source, model and glossary versions so changes propagate.",
    takeaways: ["Three flows: input pivot, content reuse, output pivot; one pattern: cache, glossary, gate, queue, version.", "Number and entity preservation is the gate chrF cannot provide.", "High-stakes categories always get a human; machine output is labelled as such.", "Store versions so source changes and model upgrades trigger re-runs."],
    terms: [["glossary enforcement", "protecting fixed terms through translation and restoring their agreed forms"], ["number preservation", "a check that every number in the source appears in the translation"], ["review queue", "the list of outputs waiting for a human editor"]],
    reflect: { q: "The translation model is upgraded and chrF improves on the reference set. Can you publish all re-translated articles automatically?", a: "Only the ones that pass the number and script checks and are not high-stakes; the chrF gate is corpus-level and cannot vouch for any single article. The 23-of-1,200 failures in the example are why the per-article gates exist." },
  },

  "m46-punjabi-conversational-assistant": {
    simple: "A Punjabi conversational assistant is the module 25–27 assistant with a Punjabi system prompt, a reply-script rule, honorific-aware tone, code-switch tolerance, and tools, all measured per script.",
    concept:
      "The **conversational assistant** is the product most users meet. Its system prompt sets identity, scope and rules, as in Stage 6, with Punjabi additions: reply in the user's script and language ('Shahmukhi Punjabi, not Urdu'); use the respectful register (ਤੁਸੀਂ / تسی, honorific ਜੀ) by default and mirror the user's level of formality; keep English technical terms as the user wrote them; handle mixed input without comment; and decline in the user's script when sources do not cover the question. Memory (module 32) stores the user's preferred script and dialect as facts. Tools (module 27) are unchanged, but their results are rendered in the user's script, including digits and dates in the local format.\n\nThe assistant's behaviour is tested with per-script conversation evals: multi-turn cases with script switches, formality, sarcasm, tool use and declines. The judge rubric from lesson 45.12 scores script, naturalness and correctness per turn.",
    why:
      "A Punjabi user judges the assistant in the first reply: the wrong script, an Urdu or Hindi flavour, a stiff 'you' where ਜੀ was expected, or an English answer to a Romanised question ends the conversation. The rules that prevent those are a few lines of prompt and a few components, but only if they are written, tested per script and kept in the loop.",
    how: [
      "Write the system prompt with Punjabi rules: reply script and language, register and honorifics, English terms kept, mixed input accepted, decline in script, local formats for numbers and dates.",
      "Detect script per message; set the reply script per message, with session preference as the default for scriptless messages.",
      "Store preferred script, dialect and formality as memory facts (module 32), confirmable by the user.",
      "Wire tools; render tool results in the user's script with Gurmukhi or Latin digits by preference.",
      "Evaluate with multi-turn per-script conversation cases; post-check every reply's script; log traces with script tags.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Rule", "Gurmukhi example", "Romanised example", "Why"],
        rows: [
          ["reply in the user's script", "ਤੁਹਾਡਾ ਆਰਡਰ ਕੱਲ੍ਹ ਆਵੇਗਾ ਜੀ।", "Tuhada order kal aavega ji.", "users read what they type"],
          ["respectful register by default", "ਤੁਸੀਂ … ਜੀ", "tusi … ji", "ਤੂੰ (tu) is intimate or rude from a stranger"],
          ["keep English terms", "ਤੁਹਾਡਾ refund 5 ਦਿਨ ਵਿੱਚ ਆ ਜਾਵੇਗਾ", "tuhada refund 5 din vich aa javega", "coinages confuse"],
          ["decline in script", "ਮਾਫ਼ ਕਰਨਾ ਜੀ, ਇਹ ਜਾਣਕਾਰੀ ਮੇਰੇ ਕੋਲ ਨਹੀਂ ਹੈ।", "Maaf karna ji, eh jaankari mere kol nahi hai.", "an honest no beats an invented yes"],
          ["mixed input accepted", "user: ਮੇਰਾ order late ਹੈ → reply in Gurmukhi", "user: order late hai yaar → Romanised", "never correct the user's language"],
        ],
      },
      caption: "Five rules that decide the first impression. All five are in the system prompt and tested per script.",
    },
    everyday: {
      title: "The shopkeeper who answers you the way you asked",
      text: "Walk into a shop in Ludhiana and ask in Punjabi; the shopkeeper answers in Punjabi, with ਜੀ. Ask in English; they answer in English. Mix the two; they mix back without blinking. They never say 'please speak properly', and they never switch to Hindi because the price list is printed in it. The assistant should be that shopkeeper, and the system prompt is its training.",
    },
    engineering: {
      title: "A telecom assistant's first week in Punjabi",
      text: "Launch day traces: 18% of Gurmukhi replies contained Hindi words, 9% used ਤੂੰ to customers, Romanised questions got Gurmukhi replies 30% of the time, and Shahmukhi users got Urdu 40% of the time. All four were prompt and routing gaps, fixed in a week: explicit register and script rules with examples, per-message script detection for the reply, 'Shahmukhi Punjabi, not Urdu' wording with three examples, and the output post-check. Week two: Hindi words 4%, ਤੂੰ 0.3%, wrong reply script 2%, Shahmukhi-as-Urdu 6% (later 2% with an adapter). The multi-turn per-script eval, built from those first-week traces, is now the release gate.",
    },
    maths: {
      formula: "wrong-reply-script rate = replies whose detected script ≠ requested script ÷ replies;  register violation rate = replies using ਤੂੰ/تُو to a customer ÷ replies;  both per script, per release",
      meaning: "Two cheap automatic counts that catch the two most common first-impression failures; they come straight from the post-check and a word match on traces.",
      worked: [
        "Day 1: 12,000 Romanised questions, 3,600 answered in Gurmukhi → wrong-reply-script 0.30. After per-message reply-script setting: 240 → 0.02.",
        "Day 1: 20,000 Gurmukhi replies, 1,800 containing ਤੂੰ or ਤੇਰਾ → 0.09. After the register rule with examples: 60 → 0.003.",
        "Both rates are alert conditions: above 0.05 for an hour after a deploy pages the on-call, because a prompt edit is the usual cause.",
      ],
    },
    code: {
      title: "The Punjabi system prompt and reply-script wiring",
      lang: "ts",
      src: `const PUNJABI_RULES = (script: Script, formality: "respectful" | "casual") => \`
# Language and script
- Reply in \${SCRIPT_NAME[script]}. \${script === "arab" ? "Write Punjabi, NOT Urdu: use اے/وچ/نوں/کتھے, never ہے/میں/کو/کہاں as Urdu would." : ""}
- The user may mix Punjabi and English, in any script. Accept it; never comment on their language or correct it.
- Keep English product and technical words exactly as the user wrote them (order, refund, OTP, app).
# Register
- \${formality === "respectful" ? "Use the respectful form (ਤੁਸੀਂ / tusi / تسی) and 'ji'. Never use ਤੂੰ / tu / تُو with a customer." : "Mirror the user's casual tone, still polite."}
# Honesty
- If the sources do not contain the answer, say so in \${SCRIPT_NAME[script]} and offer a next step. Never guess.
# Formats
- Dates as DD/MM/YYYY; amounts in ₹ with Latin digits\${script === "guru" ? " unless the user wrote Gurmukhi digits" : ""}.\`;

export async function reply(conv: Conversation, msg: NormalisedText, sources: Chunk[]) {
  const script = msg.script ?? conv.memory.preferredScript ?? "guru";
  const system = BASE_SYSTEM_PROMPT + PUNJABI_RULES(script, conv.memory.formality ?? "respectful");
  const out = await generate(ROUTES.chat[script], system, buildMessages(conv, sources, msg.display));
  const ok = detectScript(out).dominant === (script === "latn" ? "latn" : script) && !REGISTER_VIOLATION[script].test(out);
  return ok ? out : await retryStricter(script, system, conv, sources, msg);
}`,
      lines: [
        { code: "- Reply in ${SCRIPT_NAME[script]}. ${script === \"arab\" ? \"Write Punjabi, NOT Urdu: use اے/وچ/نوں/کتھے, never ہے/میں/کو/کہاں as Urdu would.\" : \"\"}", say: "The reply script is injected per message, and the Shahmukhi rule names the exact function words, which measurably cuts Urdu drift." },
        { code: "- The user may mix Punjabi and English, in any script. Accept it; never comment on their language or correct it.", say: "Code-switch tolerance as a rule; assistants otherwise sometimes 'helpfully' correct users." },
        { code: "- ${formality === \"respectful\" ? \"Use the respectful form (ਤੁਸੀਂ / tusi / تسی) and 'ji'. Never use ਤੂੰ / tu / تُو with a customer.\" : \"Mirror the user's casual tone, still polite.\"}", say: "Register from memory; respectful by default." },
        { code: "const ok = detectScript(out).dominant === (script === \"latn\" ? \"latn\" : script) && !REGISTER_VIOLATION[script].test(out);", say: "The post-check: right script and no register violation, from the same detectors used everywhere else." },
        { code: "return ok ? out : await retryStricter(script, system, conv, sources, msg);", say: "A failed check never reaches the user; a stricter retry or a fallback model answers instead." },
      ],
    },
    useIt: "Write the Punjabi rules into the system prompt per message (script, register, English terms, mixed input, decline, formats), store script and formality preferences as memory, post-check every reply, and gate releases on multi-turn per-script conversation evals and the wrong-script and register-violation rates.",
    takeaways: ["The Punjabi assistant is the standard assistant plus five rules: reply script, register, English terms kept, mixed input accepted, decline in script.", "Set the reply script per message with session preference as fallback; name 'Shahmukhi Punjabi, not Urdu' explicitly.", "Post-check script and register; count violations per script.", "Evaluate with multi-turn per-script conversation cases built from real traces."],
    terms: [["register", "the level of formality and respect in language, such as ਤੁਸੀਂ versus ਤੂੰ"], ["honorific", "a respect marker such as ਜੀ"], ["reply-script rule", "the instruction that the answer is written in the script the user used"]],
    reflect: { q: "A user starts in Gurmukhi, then sends 'ok thanks', then a Romanised question. What script does each reply use?", a: "Gurmukhi; Gurmukhi (the message has no Punjabi script, so the session preference applies); Romanised (per-message detection). The preference updates to Romanised only if the user keeps writing that way, and the user can set it explicitly." },
  },

  "m46-punjabi-document-assistant": {
    simple: "A Punjabi document assistant takes uploaded documents, including scanned Gurmukhi and Shahmukhi PDFs, extracts and checks the text, indexes it with the Punjabi pipeline, and answers questions about it with citations in the user's script.",
    concept:
      "A **document assistant** lets a user upload a file (a notice, a contract, a form, a report) and ask about it. For Punjabi the upload is the hard part. Many Punjabi documents are scans or image-based PDFs; text extraction needs OCR with Gurmukhi and Shahmukhi support (Tesseract has 'pan' and 'urd' models; Shahmukhi usually goes through the Urdu model with a Punjabi post-check; commercial OCR services vary widely in Gurmukhi quality). OCR output has errors; the dictionary hit rate from lesson 44.11 estimates quality, and pages below threshold are flagged so the assistant can warn the user instead of answering from garbage.\n\nAfter extraction: normalise, split on Punjabi sentence marks, chunk with headings, embed with the Punjabi model, and answer with the RAG path from lesson 45.9, citing page numbers. The user may ask in any script about a document in any script; transliteration and cross-lingual embeddings bridge them. Documents are private: per-user indexes, deletion on request, and no document text in logs beyond redacted snippets.",
    why:
      "Letters from government offices, court notices, bank statements and school forms in Punjabi are exactly what people need help reading. A document assistant that cannot OCR Gurmukhi, or answers confidently from a 30%-error scan, is worse than none. The pipeline's job is to make extraction honest and the answers checkable against the page.",
    how: [
      "Accept uploads; detect whether the PDF has a text layer or is image-only; for images and scans, run OCR with the Gurmukhi or Urdu model chosen by a script check on a sample region.",
      "Score OCR quality per page with the dictionary hit rate; flag pages below threshold and tell the user which pages are unreliable.",
      "Normalise, split, chunk with page numbers and headings, embed; keep the index private to the user.",
      "Answer with the Punjabi RAG path: cite page numbers; decline when the document does not cover the question; reply in the user's script.",
      "Offer 'show the original page' next to every citation; delete the document and index on request or after retention.",
    ],
    visual: {
      kind: "flow",
      steps: ["upload PDF or photo", "text layer? else OCR (pan / urd model)", "OCR quality per page (dictionary hit rate)", "normalise · split on । ۔ · chunk with page numbers", "embed into the user's private index", "question in any script → transliterate → retrieve → answer with [page n]", "'show page' · delete on request"],
      caption: "The two Punjabi-specific boxes are OCR model choice and OCR quality scoring; everything else is the standard document pipeline with the Punjabi pieces.",
    },
    everyday: {
      title: "Reading a letter for a relative",
      text: "An older relative hands you a photographed court notice in Gurmukhi and asks what it means and when the date is. You read it, point at the line with the date, and say 'the photo is blurry on page two, I cannot read that part'. The assistant should do exactly that: answer from the text, point at the page, and admit where the scan is unreadable.",
    },
    engineering: {
      title: "Court notices and bank letters",
      text: "A legal-aid NGO built a document assistant for Punjabi notices. Their first OCR run on 500 scanned notices had a median dictionary hit rate of 0.71; a third of pages were below 0.6 and produced invented 'dates'. They switched the Gurmukhi OCR model, added image preprocessing (deskew, contrast), and set a 0.8 threshold below which the assistant says 'ਇਹ ਪੰਨਾ ਸਾਫ਼ ਨਹੀਂ ਪੜ੍ਹਿਆ ਗਿਆ' (this page could not be read clearly) and asks for a better photo. Median hit rate rose to 0.91; invented dates disappeared from the eval; and every answer cites the page, with a thumbnail of the cited region beside it.",
    },
    maths: {
      formula: "page quality = dictionary hits ÷ words on the page;  answerable = pages with quality ≥ 0.8;  warn if the retrieved chunks come from pages below threshold",
      meaning: "OCR errors do not announce themselves; the hit rate against a Punjabi word list is the proxy. The threshold is calibrated on hand-checked pages, and the warning is attached to any answer that relied on a weak page.",
      worked: [
        "A 4-page notice: hit rates 0.93, 0.88, 0.57, 0.90. Page 3 (a stamped, skewed page) is below 0.8.",
        "Question: 'ਪੇਸ਼ੀ ਦੀ ਤਾਰੀਖ ਕੀ ਹੈ?' (what is the hearing date?). Retrieval returns chunks from pages 1 and 3.",
        "The answer cites page 1 for the date and warns that page 3 could not be read reliably, instead of combining a clear date with a garbled one.",
        "Calibration: on 60 hand-checked pages, hit rate 0.8 corresponded to about 5% character errors; below that, numbers and dates become unreliable, which is why the threshold sits there.",
      ],
    },
    code: {
      title: "OCR a Punjabi scan with quality scoring",
      lang: "py",
      src: `import re
import pytesseract
from PIL import Image, ImageOps

GURMUKHI = re.compile(r"[\\u0A00-\\u0A7F]")

def ocr_page(image_path, script_hint=None):
    img = ImageOps.autocontrast(ImageOps.grayscale(Image.open(image_path)))
    lang = {"guru": "pan", "arab": "urd"}.get(script_hint, "pan+urd+eng")
    text = pytesseract.image_to_string(img, lang=lang, config="--psm 6")
    text = normalise(text, script_hint or ("guru" if GURMUKHI.search(text) else "arab"))
    return text

def page_quality(text, wordlist):
    words = [w for w in re.findall(r"[\\w\\u0A00-\\u0A7F\\u0600-\\u06FF]+", text) if len(w) > 1]
    if not words: return 0.0
    hits = sum(1 for w in words if w in wordlist)
    return round(hits / len(words), 2)

pages = []
for i, path in enumerate(page_images, start=1):
    text = ocr_page(path, script_hint="guru")
    q = page_quality(text, punjabi_wordlist)
    pages.append({"page": i, "text": text, "quality": q, "reliable": q >= 0.8})
    print("page", i, "quality", q, "" if q >= 0.8 else "<-- unreliable; ask for a clearer photo")`,
      lines: [
        { code: "img = ImageOps.autocontrast(ImageOps.grayscale(Image.open(image_path)))", say: "Cheap preprocessing (greyscale, contrast) lifts OCR accuracy on phone photos noticeably; deskewing helps further." },
        { code: "lang = {\"guru\": \"pan\", \"arab\": \"urd\"}.get(script_hint, \"pan+urd+eng\")", say: "Tesseract's Gurmukhi model is 'pan'; Shahmukhi goes through 'urd'. With no hint, try all three and let the script check sort it out." },
        { code: "hits = sum(1 for w in words if w in wordlist)", say: "The dictionary hit rate: OCR damage produces non-words." },
        { code: "pages.append({\"page\": i, \"text\": text, \"quality\": q, \"reliable\": q >= 0.8})", say: "Quality and reliability travel with each page into the index, so answers can warn." },
      ],
      note: "Commercial OCR services may do better on Gurmukhi; measure them with the same hit rate on your own scans before choosing.",
    },
    useIt: "Build the Punjabi document assistant on the standard document pipeline with script-aware OCR, per-page quality scoring and warnings, Punjabi chunking and embedding, page-cited answers in the user's script, and strict privacy: per-user indexes, redacted logs, deletion on request.",
    takeaways: ["Punjabi documents are often scans; OCR model choice and quality scoring decide whether answers are honest.", "Score every page; warn when an answer relies on an unreliable page; ask for a better photo.", "Cite page numbers and show the original region beside the answer.", "Documents are private: per-user indexes, redacted logs, deletion."],
    terms: [["OCR", "optical character recognition: extracting text from images of pages"], ["text layer", "the embedded text in a PDF, absent in image-only scans"], ["dictionary hit rate", "the share of OCR output words found in a word list, a proxy for OCR accuracy"]],
    reflect: { q: "Why warn the user about an unreadable page rather than just omitting it from the answer?", a: "Because the user does not know the page existed in the assistant's view; an answer that silently ignores the page with the hearing date is wrong without looking wrong. The warning lets them re-photograph the page or read it themselves." },
  },

  "m46-punjabi-knowledge-base": {
    simple: "The Punjabi knowledge base is the curated set of articles the assistant answers from: authored or translated into Gurmukhi, viewable in every script, versioned, re-indexed on change, and grown from the questions users ask that it cannot answer.",
    concept:
      "A **knowledge base** is the content behind RAG. For Punjabi it has four properties. Authored quality: articles are written or translated into natural Gurmukhi by people who write Punjabi well, with the glossary applied, because the assistant's answers can only be as good as the articles. Script coverage: each article is stored in Gurmukhi as the canonical form, with Shahmukhi and Romanised views produced by transliteration (reviewed for Shahmukhi), so users in any script see the content. Versioning: every edit creates a version; indexes record which version they hold; the assistant cites the version it used. Gap-driven growth: the questions the assistant declined, and the low-confidence retrievals, are clustered weekly into 'questions we cannot answer', which become the writing backlog.\n\nMetadata per article: language, script, audience, category, stakes, last reviewed, and the source English article if translated. The knowledge base is the product's memory of facts; the model is only its reader.",
    why:
      "A Punjabi assistant with a thin or stale knowledge base invents, or declines, or answers from English pages with Hindi-flavoured translations. The knowledge base is where a Punjabi team's domain experts contribute without touching models, and its gap report is the most actionable list in the product: it says exactly what to write next.",
    how: [
      "Define the article model: canonical Gurmukhi body, metadata, versions, derived views per script, source link if translated.",
      "Author or translate with the workflows of lesson 46.5; review by stakes.",
      "On publish: normalise, chunk, embed, update the index with the article version; regenerate script views.",
      "Weekly: cluster declined and low-confidence questions by embedding; rank clusters by volume; assign articles to write.",
      "Quarterly: review articles older than their review period; retire or update; re-run the harness after large content changes.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Field", "Example", "Used for"],
        rows: [
          ["id, version", "kb-0412, v7", "citations, index freshness"],
          ["canonical body (Gurmukhi)", "ਵਾਪਸੀ 30 ਦਿਨਾਂ ਦੇ ਅੰਦਰ…", "retrieval, generation"],
          ["views", "Shahmukhi (reviewed), Romanised (rules)", "display in the user's script"],
          ["audience, category, stakes", "customer, returns, medium", "retrieval filters, review rules"],
          ["source", "en-0412 v12 (translated)", "re-translate when the English changes"],
          ["last reviewed, owner", "2026-09-14, returns team", "staleness checks"],
          ["gap cluster origin", "cluster 'mattress returns' (84 questions)", "why it was written; measure its effect"],
        ],
      },
      caption: "An article is a record with versions and views, not a blob of text.",
    },
    everyday: {
      title: "The shop's answer book",
      text: "A busy shop keeps a book of answers to the questions customers keep asking, written clearly in Punjabi, with a note of who wrote each page and when. When a customer asks something not in the book, the clerk writes the question on the last page; every Monday the owner turns those into new answers. The assistant's knowledge base is that book, with the Monday ritual automated into a gap report.",
    },
    engineering: {
      title: "From 190 declined questions to 12 articles",
      text: "A utility company's Punjabi assistant declined 9% of questions in its first month. The weekly gap report clustered 1,900 declined and low-confidence questions into 40 clusters; the top 12 covered 61% of them (meter reading submission, new-connection documents, bill disputes in Romanised Punjabi). Twelve Gurmukhi articles were written by the support team using the glossary, reviewed, published with Shahmukhi views checked by a Lahore-based editor. The decline rate fell to 3.5% the following month, and the gap report's top cluster is now 'solar net-metering', the next article.",
    },
    maths: {
      formula: "coverage = answered questions ÷ all questions;   cluster value = questions in cluster ÷ all declined;   write articles in order of cluster value until the marginal cluster is small",
      meaning: "Coverage is the knowledge base's headline metric; cluster value ranks what to write. The ranking usually shows a steep head: a dozen articles cover most of the gap.",
      worked: [
        "Month 1: 21,000 questions, 1,890 declined → coverage 0.91.",
        "Clusters: meter reading 310 (16% of declined), new connection 280 (15%), bill dispute 240 (13%), … the top 12 sum to 1,150 (61%).",
        "After 12 articles, month 2: 23,000 questions, 805 declined → coverage 0.965. The articles removed roughly the predicted share.",
        "The 13th cluster is 70 questions (3.7% of the original gap); writing continues but the return per article is now smaller, which is the signal to also look at retrieval misses rather than content only.",
      ],
    },
    code: {
      title: "The weekly gap report",
      lang: "py",
      src: `import numpy as np
from sklearn.cluster import AgglomerativeClustering

# questions the assistant declined or answered from weak retrieval this week, with script tags
gaps = [t for t in traces_this_week if t["declined"] or t["top_score"] < 0.5]
texts = [t["question_gurmukhi"] for t in gaps]                 # transliterated to Gurmukhi for clustering
vectors = embed_model.encode(texts, normalize_embeddings=True)

clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=0.35, metric="cosine", linkage="average")
labels = clustering.fit_predict(vectors)

report = []
for label in set(labels):
    members = [g for g, l in zip(gaps, labels) if l == label]
    centre = vectors[labels == label].mean(axis=0)
    rep = members[int(np.argmax(vectors[labels == label] @ centre))]["question_gurmukhi"]
    scripts = {s: sum(1 for m in members if m["script"] == s) for s in ("guru", "arab", "latn")}
    report.append({"size": len(members), "example": rep, "scripts": scripts, "share_of_gap": round(len(members) / len(gaps), 3)})

for row in sorted(report, key=lambda r: r["size"], reverse=True)[:15]:
    print(row)`,
      lines: [
        { code: "gaps = [t for t in traces_this_week if t[\"declined\"] or t[\"top_score\"] < 0.5]", say: "Both explicit declines and weak retrievals count as gaps; the second kind hides answers that were probably poor." },
        { code: "texts = [t[\"question_gurmukhi\"] for t in gaps]                 # transliterated to Gurmukhi for clustering", say: "Clustering in one script so the same question in three scripts lands in one cluster." },
        { code: "clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=0.35, metric=\"cosine\", linkage=\"average\")", say: "Clusters by meaning without choosing a count in advance; the threshold is tuned by looking at a few clusters." },
        { code: "scripts = {s: sum(1 for m in members if m[\"script\"] == s) for s in (\"guru\", \"arab\", \"latn\")}", say: "Each cluster shows which scripts asked; a Romanised-heavy cluster may need a Romanised example in the article." },
      ],
      note: "The report goes to the content team as a ranked backlog; each written article records the cluster it closes, so its effect can be measured next week.",
    },
    useIt: "Treat the knowledge base as a versioned content product: canonical Gurmukhi with script views, metadata for retrieval and review, re-indexing on publish, and a weekly gap report that turns declined questions into a ranked writing backlog. Measure coverage per script monthly.",
    takeaways: ["The knowledge base is the facts; the model only reads them. Its quality bounds the assistant's.", "Canonical Gurmukhi with transliterated views; Shahmukhi views reviewed.", "Versions on articles and indexes; citations name the version.", "Grow it from declined and weak-retrieval questions, clustered and ranked weekly."],
    terms: [["knowledge base", "the curated articles an assistant answers from"], ["gap report", "the weekly ranked list of question clusters the assistant could not answer"], ["coverage", "the share of questions the knowledge base can answer"]],
    reflect: { q: "Coverage is 96% but Shahmukhi users still complain the assistant 'does not know anything'. What is the likely cause?", a: "Coverage is averaged; Shahmukhi retrieval probably fails (missing views, poor transliteration, alignment) even though the content exists. Compute coverage per script, and check whether Shahmukhi questions are reaching the Gurmukhi articles through the pivot." },
  },

  "m46-punjabi-user-feedback-collection": {
    simple: "Feedback from Punjabi users is collected in their script with one tap, tied to the trace, bucketed by script and dialect, and turned into evaluation cases and training data every week.",
    concept:
      "**User feedback** is the cheapest honest signal a product gets. For Punjabi it must be collected in a way users will actually use: thumbs up and down with labels in the user's script (ਠੀਕ ਹੈ / ਗ਼ਲਤ ਹੈ, theek hai / galat hai, ٹھیک اے / غلط اے), an optional comment box that accepts any script, and quick reason chips for a thumbs-down ('wrong language', 'did not understand me', 'wrong answer', 'rude'). Implicit signals matter as much: the user rephrased, switched script, asked for a human, or left.\n\nEvery signal attaches to the trace id, so it carries the script, dialect, mixing level, route and prompt version. Feedback is then aggregated per script and per route on the dashboard, and the negative cases flow to a labelling queue where annotators confirm the problem and write the correct answer; those become evaluation cases and fine-tuning examples. The loop is weekly and visible: users who report problems should see the fix.",
    why:
      "Punjabi users are the only reliable judges of Punjabi quality, and they are generous with feedback if asking is easy and in their language. Without their signal the team relies on judges calibrated on last quarter's data. With it, every wrong-language reply and every misunderstood Romanised question becomes a data point, bucketed by script, and the evaluation set grows from the exact failures users meet.",
    how: [
      "Add thumbs and reason chips in the user's script under every reply; a free-text comment in any script; a 'talk to a person' button that counts as feedback.",
      "Record implicit signals from the conversation: rephrase, script switch, escalation, abandonment.",
      "Attach every signal to the trace id; keep script, dialect, mixing level, route and prompt version with it.",
      "Aggregate per script and route; alert on rate changes after deploys.",
      "Weekly: send negative and 'wrong language' cases to annotators; add confirmed cases to the evaluation set and the fine-tuning queue; close the loop with users where possible.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Signal", "How collected", "Tells you", "Goes to"],
        rows: [
          ["👍 / 👎 with script-specific labels", "one tap under the reply", "overall quality per script", "dashboard; 👎 to labelling queue"],
          ["reason chip: 'wrong language'", "shown after 👎", "script/language drift the post-check missed", "detector and prompt fixes; eval cases"],
          ["reason chip: 'did not understand me'", "after 👎", "detection or Romanised reading failure", "transliteration and detector training data"],
          ["comment (any script)", "optional box", "specifics; dialect words", "annotators"],
          ["rephrase / script switch", "implicit, from the conversation", "the first reply failed silently", "weak-retrieval and misdetection analysis"],
          ["'talk to a person'", "button", "the assistant failed or the user needs a human", "escalation rate per script; eval cases"],
        ],
      },
      caption: "Explicit feedback is a sample; implicit signals cover everyone. Both key on the trace.",
    },
    everyday: {
      title: "Asking 'was that helpful?' in the customer's language",
      text: "A shop that asks 'ਕੀ ਇਹ ਮਦਦਗਾਰ ਸੀ?' gets answers; one that asks 'Was this helpful?' of a Punjabi grandmother gets silence. And a shop that notices a customer asking the same thing twice knows the first answer failed, whether or not they complained. The feedback system is the question in the right language plus the habit of noticing repeats.",
    },
    engineering: {
      title: "The 'wrong language' chip",
      text: "A ride-hailing assistant added reason chips to thumbs-down in Punjabi. In the first month 'wrong language' was the top reason for Shahmukhi users (46% of their thumbs-downs) and 'did not understand me' for Romanised users (52%). The chips localised two problems the overall thumbs-down rate had blurred together: Urdu drift on Shahmukhi output, and Romanised detection failing on short messages. Each got its own fix and its own evaluation category. Thumbs-down rates fell from 19% to 8% (Shahmukhi) and 16% to 7% (Romanised) over the next two months, and the 1,400 confirmed negative cases became the per-script evaluation set's largest source.",
    },
    maths: {
      formula: "thumbs-down rate(script, route) = 👎 ÷ (👍 + 👎);  reason share = chip count ÷ 👎;  escalation rate = 'talk to a person' ÷ conversations;  all per script, with sample sizes",
      meaning: "Rates per script and route, with reason breakdowns, point at the component that failed; sample sizes keep small scripts honest.",
      worked: [
        "Shahmukhi, week 1: 420 👍, 98 👎 → thumbs-down 0.19. Reason chips: wrong language 45, did not understand 20, wrong answer 25, other 8 → 'wrong language' share 0.46.",
        "After the Shahmukhi adapter: 510 👍, 44 👎 → 0.079; 'wrong language' 6 → share 0.14. The fix is visible in the reason mix, not only the rate.",
        "Escalation: Romanised conversations 3,200, 'talk to a person' 410 → 0.13, against 0.06 for Gurmukhi; the gap itself is a finding.",
        "Standard error on the Shahmukhi rate at n = 554: √(0.079 × 0.921 ÷ 554) ≈ 0.011, so a week-to-week move of 1 point is noise; 3 points is real.",
      ],
    },
    code: {
      title: "Feedback endpoint with script-aware chips and trace linkage",
      lang: "ts",
      src: `const REASONS = ["wrong_language", "not_understood", "wrong_answer", "rude", "other"] as const;
const LABELS: Record<Script, Record<string, string>> = {
  guru: { up: "ਠੀਕ ਹੈ", down: "ਗ਼ਲਤ ਹੈ", wrong_language: "ਗ਼ਲਤ ਭਾਸ਼ਾ", not_understood: "ਮੇਰੀ ਗੱਲ ਨਹੀਂ ਸਮਝੀ", wrong_answer: "ਜਵਾਬ ਗ਼ਲਤ", rude: "ਰੁੱਖਾ", other: "ਹੋਰ" },
  latn: { up: "theek hai", down: "galat hai", wrong_language: "galat bhasha", not_understood: "meri gall nahi samjhi", wrong_answer: "jawab galat", rude: "rukha", other: "hor" },
  arab: { up: "ٹھیک اے", down: "غلط اے", wrong_language: "غلط زبان", not_understood: "میری گل نہیں سمجھی", wrong_answer: "جواب غلط", rude: "رُکھا", other: "ہور" },
};

app.post("/api/feedback", requireCustomer, async (req, res) => {
  const { traceId, rating, reason, comment } = Feedback.parse(req.body);     // rating: "up" | "down"; reason ∈ REASONS
  const t = await traceStore.get(traceId);
  if (!t || t.customerHash !== hash(req.customer.id)) return res.status(404).end();
  await feedbackStore.write({ traceId, rating, reason, comment: comment?.slice(0, 500), script: t.meta.script, dialect: t.meta.dialect, route: t.meta.route, promptVersion: t.meta.promptVersion, at: new Date() });
  if (rating === "down") await labellingQueue.add({ traceId, reason, script: t.meta.script });
  metrics.increment("feedback", { script: t.meta.script, rating, reason: reason ?? "none" });
  res.status(204).end();
});

export const feedbackLabels = (script: Script) => LABELS[script];`,
      lines: [
        { code: "guru: { up: \"ਠੀਕ ਹੈ\", down: \"ਗ਼ਲਤ ਹੈ\", wrong_language: \"ਗ਼ਲਤ ਭਾਸ਼ਾ\", not_understood: \"ਮੇਰੀ ਗੱਲ ਨਹੀਂ ਸਮਝੀ\", wrong_answer: \"ਜਵਾਬ ਗ਼ਲਤ\", rude: \"ਰੁੱਖਾ\", other: \"ਹੋਰ\" },", say: "Labels in the user's own script; the chips are how users name the failure without typing." },
        { code: "await feedbackStore.write({ traceId, rating, reason, comment: comment?.slice(0, 500), script: t.meta.script, dialect: t.meta.dialect, route: t.meta.route, promptVersion: t.meta.promptVersion, at: new Date() });", say: "Script, dialect, route and prompt version are copied from the trace, so the dashboard can slice without joining." },
        { code: "if (rating === \"down\") await labellingQueue.add({ traceId, reason, script: t.meta.script });", say: "Every thumbs-down goes to annotators; confirmed cases become evaluation and training data." },
        { code: "metrics.increment(\"feedback\", { script: t.meta.script, rating, reason: reason ?? \"none\" });", say: "The per-script, per-reason counters that drive alerts after deploys." },
      ],
    },
    useIt: "Collect feedback in the user's script with one tap and reason chips, record implicit signals, attach everything to script-tagged traces, slice by script and route, alert on changes after deploys, and run the weekly loop from thumbs-down to labelled case to evaluation and training data.",
    takeaways: ["Ask in the user's script; reason chips name the failure without typing.", "Implicit signals (rephrase, script switch, escalation) cover everyone.", "Key feedback to traces; slice by script, dialect, route and prompt version.", "Weekly: negatives to annotators, confirmed cases to evaluation and fine-tuning."],
    terms: [["reason chip", "a one-tap label a user picks to say why a reply was bad"], ["implicit feedback", "signals inferred from behaviour such as rephrasing or escalating"], ["labelling queue", "the list of flagged interactions waiting for annotators"]],
    reflect: { q: "Why send every thumbs-down to annotators rather than just counting them?", a: "A count says how often; an annotated case says what went wrong and what the right answer was, in the user's own words and script. Those cases are the most realistic evaluation and fine-tuning data a Punjabi product can get." },
  },

  "m46-model-improvement-pipeline": {
    simple: "The improvement pipeline is the weekly loop that turns traces and feedback into labelled data, grows the gold sets, retrains adapters, runs the harness and ships behind per-script gates.",
    concept:
      "A Punjabi assistant launches weak in at least one script and improves only if improvement is a routine, not a project. The **model improvement pipeline** is that routine. Inputs: traces (with script, route, confidence, retrieval scores), feedback (explicit and implicit), the gap report and the detector's low-confidence cases. Steps: sample and prioritise (negatives, low confidence, under-represented scripts and dialects); label with the guidelines (module 44) and measure agreement; split new labels between the frozen gold sets (versioned, growing slowly) and training data; retrain the detector, the embedding model and the LoRA adapters on a schedule; run the harness and the per-script report card; ship through the routing table with a canary; watch the dashboards. Every artefact (dataset, adapter, prompt, normaliser) has a version, and the release record lists all of them.\n\nThe cadence: labelling continuous, retraining weekly or fortnightly, gold-set additions monthly with review, judge recalibration quarterly.",
    why:
      "Models that are not retrained drift behind their users: new products, new slang, new keyboards, seasonal questions. For a low-resource language the gap at launch is large, so the rate of improvement is the product's real quality metric. A pipeline makes improvement predictable and lets the team say 'Shahmukhi will pass its threshold in about six weeks' with evidence.",
    how: [
      "Collect: nightly export of traces with feedback, tagged by script, dialect, route, confidence and retrieval score.",
      "Prioritise: a sampling rule that over-samples thumbs-down, low confidence, weak retrieval and under-represented scripts and dialects.",
      "Label: annotators per script with the guidelines; measure kappa weekly; adjudicate.",
      "Split: a slice to the gold sets (frozen, versioned, reviewed), the rest to training; cross-split deduplicate.",
      "Train and evaluate: detector, embeddings, adapters on their schedules; harness and report card; compare with the current release.",
      "Ship: update the routing table for cells that pass their gates; canary 10% per script; promote or roll back from dashboards.",
    ],
    visual: {
      kind: "flow",
      steps: ["traces + feedback (per script)", "prioritised sample", "annotators (κ checked)", "gold set vN+1 (small) · training set", "retrain: detector · embeddings · adapters", "harness → report card per script", "routing table update · canary 10%", "dashboards → next week's sample"],
      caption: "A loop, run weekly. Each box has a version and an owner.",
    },
    everyday: {
      title: "A restaurant's weekly menu meeting",
      text: "Every Monday the kitchen reads the week's comment cards and the dishes sent back, decides which recipes to adjust, tries the changes at a staff lunch (the harness), puts the improved dish on a few tables first (the canary), and checks the cards again next week. A restaurant that never holds the meeting serves the same mistakes for years. The pipeline is the Monday meeting, with scripts instead of dishes.",
    },
    engineering: {
      title: "Six weeks of the loop on Shahmukhi",
      text: "At launch, Shahmukhi QA correctness was 61% with a 14% wrong-language rate. The pipeline over-sampled Shahmukhi thumbs-downs (120–180 labelled per week by two Lahore annotators, kappa 0.84), grew the Shahmukhi gold set from 120 to 400 items over two months, and trained a Shahmukhi adapter fortnightly on the accumulating training data (380, then 760, then 1,150 examples). Report card by week: 61/14%, 66/11%, 71/8%, 74/6%, 77/4%, 79/3%. The cell passed its thresholds (75%, ≤5%) in week five and shipped through the routing table with a canary; the dashboard confirmed thumbs-down fell from 19% to 8%.",
    },
    maths: {
      formula: "sampling weight(trace) = base × (1 + 3·[thumbs-down]) × (1 + 2·[low confidence]) × (1 + 2·[weak retrieval]) × script boost;  script boost = target share ÷ current share",
      meaning: "Multiplicative weights make the labelled sample rich in failures and in the scripts you need to lift, instead of mirroring traffic where Gurmukhi dominates.",
      worked: [
        "Target labelling shares: Gurmukhi 40%, Romanised 35%, Shahmukhi 25%. Traffic: 50%, 40%, 10%. Script boosts: 0.8, 0.875, 2.5.",
        "A Shahmukhi trace with thumbs-down and low confidence: weight = 1 × 4 × 3 × 1 × 2.5 = 30. A Gurmukhi trace with thumbs-up and high confidence: 1 × 1 × 1 × 1 × 0.8 = 0.8.",
        "Sampling 600 traces a week by these weights yields roughly 150 Shahmukhi cases instead of the 60 that uniform sampling would give, most of them failures: exactly the data the adapter needs.",
        "Keep 10% of the sample uniform (unweighted) so the gold set also reflects normal traffic and the report card is not biased toward failures.",
      ],
    },
    code: {
      title: "The weekly pipeline, as a job",
      lang: "py",
      src: `def weekly_pipeline(week):
    traces = export_traces(week)                                             # with script, route, confidence, retrieval score, feedback
    sample = weighted_sample(traces, n=600, targets={"guru": 0.40, "latn": 0.35, "arab": 0.25}, uniform_share=0.10)
    labelled = labelling_queue.collect(sample)                               # returns items with annotator labels and agreement
    assert labelled.kappa_per_script.min() >= 0.75, "guidelines need revision before training"

    gold_add, train_add = split_new_labels(labelled, gold_share=0.15)        # small slice to gold, reviewed
    gold = gold_sets.append(gold_add, version=f"gold-{week}")
    train = training_sets.append(dedupe_against(train_add, gold))

    artefacts = {}
    artefacts["detector"] = train_detector(train.language_labels)
    artefacts["embed"] = finetune_embeddings(train.pairs) if week.is_fortnight else current("embed")
    for script in ("guru", "latn", "arab"):
        artefacts[f"adapter-{script}"] = train_lora(train.by_script(script)) if week.is_fortnight else current(f"adapter-{script}")

    card = run_harness(artefacts, gold)                                       # per-script report card
    for (task, script), cell in card.items():
        if cell.passes(THRESHOLDS[task][script]) and cell.better_than(current_card[(task, script)]):
            routing_table.canary(task, script, artefacts, share=0.10)
    release_log.record(week, artefacts, card, gold.version, NORMALISER_VERSION)
    return card`,
      lines: [
        { code: "sample = weighted_sample(traces, n=600, targets={\"guru\": 0.40, \"latn\": 0.35, \"arab\": 0.25}, uniform_share=0.10)", say: "The weighted sample from the maths above, with a uniform slice so the gold set stays representative." },
        { code: "assert labelled.kappa_per_script.min() >= 0.75, \"guidelines need revision before training\"", say: "Low agreement stops the pipeline: training on inconsistent labels makes the model worse." },
        { code: "gold_add, train_add = split_new_labels(labelled, gold_share=0.15)        # small slice to gold, reviewed", say: "The gold sets grow slowly and are versioned; most new labels go to training, deduplicated against the gold." },
        { code: "if cell.passes(THRESHOLDS[task][script]) and cell.better_than(current_card[(task, script)]):", say: "Per-cell gates: a new adapter ships only where it passes and improves, through the routing table, as a canary." },
        { code: "release_log.record(week, artefacts, card, gold.version, NORMALISER_VERSION)", say: "Every release lists every version it is made of, so any later number can be traced to its inputs." },
      ],
    },
    useIt: "Run the improvement pipeline weekly from launch: prioritised sampling by failure and script, labelling with agreement checks, slow growth of versioned gold sets, scheduled retraining of detector, embeddings and adapters, the per-script report card as the gate, canaries through the routing table, and a release log of versions. Report the rate of improvement per script, not only the level.",
    takeaways: ["Improvement is a weekly routine, not a project: traces → sample → labels → gold and training → retrain → harness → canary.", "Over-sample failures and under-represented scripts; keep a uniform slice.", "Agreement gates labelling; per-cell thresholds gate shipping.", "Version everything; log every release's inputs."],
    terms: [["improvement pipeline", "the recurring loop from production data to retrained, evaluated, shipped models"], ["weighted sampling", "choosing traces to label with probabilities that favour failures and target scripts"], ["canary", "shipping a change to a small share of traffic before all of it"]],
    reflect: { q: "Why keep the gold sets growing slowly rather than adding every new labelled case to them?", a: "The gold sets are the ruler; if they change wholesale each week, scores are not comparable across releases. A small, reviewed monthly addition keeps them current without breaking the trend line; most labels are more useful as training data." },
  },

  "m46-punjabi-product-deployment": {
    simple: "Deploying the Punjabi product means a gateway that routes by task and script to models and adapters, caches keyed on normalised text, budgets that account for Gurmukhi token costs, and fallbacks per script.",
    concept:
      "**Deployment** for a Punjabi product follows module 39 with script-specific wiring. The gateway carries the detected script on every request and consults the routing table: Gurmukhi QA to model A with adapter G, Shahmukhi to model B with adapter S, Romanised through transliteration to model A, intent classification to the fine-tuned encoder for all scripts. Adapters are loaded per route (merged for the main one, hot-swappable for the others). Caches key on the normalised matching form plus script and versions. Rate limits and budgets are per route, because Gurmukhi answers cost several times English ones in tokens on some models; the fertility ratios from lesson 45.2 go straight into capacity planning.\n\nFallbacks are per script: when the Shahmukhi adapter is down, requests fall back to the input-pivot path with a 'transliterated reply' flag rather than to Urdu. Latency budgets allow for transliteration and post-check hops. Rollouts are canaries per script, promoted from per-script dashboards.",
    why:
      "A deployment that treats all requests alike will under-provision Gurmukhi (more tokens), misroute Shahmukhi when a component fails, and roll out a change to every script at once, so a regression in one hides in the average. Script-aware routing, budgeting and fallbacks make the three forms independently operable and independently safe.",
    how: [
      "Gateway: attach script and detection confidence to each request; look up (task, script) in the routing table; add timeouts for the extra hops.",
      "Models and adapters: serve the main route merged; load other adapters by route; version-pin everything; health-check per route.",
      "Caches: key on matching form, script, task and versions; separate namespaces per script to measure hit rates.",
      "Budgets: per-route concurrency and token budgets from fertility ratios and traffic shares; alert on cost per answer per script.",
      "Fallbacks: per script, ordered (adapter → pivot path → retrieval-only answer in script → human handoff); never fall back to another language.",
      "Rollouts: canary per script via the routing table; promote on per-script dashboards; roll back one cell at a time.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["(task, script)", "Route", "Fallback chain", "Token budget factor"],
        rows: [
          ["chat, guru", "model A + adapter G (merged)", "A without adapter → retrieval-only in Gurmukhi → human", "×1.7 of English"],
          ["chat, latn", "transliterate → model A + adapter G → reply via Romanised adapter", "rules transliteration out → retrieval-only → human", "×1.9"],
          ["chat, arab", "model B + adapter S", "pivot path (transliterate in and out) flagged → retrieval-only → human", "×1.6"],
          ["intent, all", "fine-tuned encoder", "prompted model A", "×1.0 (tiny)"],
          ["translate en→pa", "Indic translation model", "model B with glossary", "×1.5"],
        ],
      },
      caption: "One row per cell. Fallbacks stay in the user's script; budgets come from measured fertility.",
    },
    everyday: {
      title: "A help desk with three counters",
      text: "A government office has counters for Gurmukhi, Shahmukhi and Roman-script forms, each staffed by someone who reads that script, with a queue and a budget of its own. If the Shahmukhi clerk is off sick, a colleague who reads Gurmukhi uses the transliteration sheet rather than sending Shahmukhi speakers to the Urdu office. A new form is tried at one counter before the others. The deployment is that office.",
    },
    engineering: {
      title: "The adapter outage that did not become an Urdu outage",
      text: "A retail assistant's Shahmukhi adapter server failed during a deploy. The routing table's fallback chain sent Shahmukhi requests to the pivot path: transliterate the question to Gurmukhi, answer with the main model, transliterate the reply to Shahmukhi, with a 'transliterated reply' tag in the trace. For forty minutes Shahmukhi naturalness dropped (judge 3.5 instead of 4.2) but the wrong-language rate stayed under 3% and no user got Urdu. The dashboard's per-script latency and fallback-rate panels showed the incident; the on-call rolled back the adapter deploy for that one cell. Without the per-script fallback, the default would have been the base model, which answers Shahmukhi in Urdu.",
    },
    maths: {
      formula: "token budget per script = requests × (input tokens_en + output tokens_en) × fertility ratio;  capacity = Σ scripts;  cost per answer(script) = tokens(script) × price(route)",
      meaning: "Plan concurrency and spend with measured fertility ratios per route; a Gurmukhi answer on a model with ratio 1.7 needs 70% more token throughput than the English estimate.",
      worked: [
        "Daily: 30,000 Gurmukhi, 24,000 Romanised, 6,000 Shahmukhi answers. English baseline 320 tokens per answer.",
        "Tokens: Gurmukhi 30,000 × 320 × 1.7 = 16.3 million; Romanised 24,000 × 320 × 1.9 = 14.6 million (transliteration hops included); Shahmukhi 6,000 × 320 × 1.6 = 3.1 million. Total ≈ 34 million tokens a day.",
        "Without fertility factors the plan would have budgeted 19.2 million: a 44% under-provision that would have shown up as rate limits at peak.",
        "Cost per answer at illustrative blended prices: Gurmukhi £0.0019, Romanised £0.0022, Shahmukhi £0.0031 (a pricier model B): the dashboard shows these three lines, and the Shahmukhi line is the one to watch when traffic grows.",
      ],
    },
    code: {
      title: "The routing table and per-script fallback",
      lang: "ts",
      src: `export const ROUTES: Record<Task, Record<Script, Route>> = {
  chat: {
    guru: { model: "A", adapter: "pa-guru-v7", promptVersion: "p14", budgetFactor: 1.7, fallbacks: ["A:no-adapter", "retrieval-only", "human"] },
    latn: { model: "A", adapter: "pa-guru-v7", via: "transliterate-in", replyVia: "pa-latn-v3", promptVersion: "p14", budgetFactor: 1.9, fallbacks: ["rules-translit-out", "retrieval-only", "human"] },
    arab: { model: "B", adapter: "pa-arab-v4", promptVersion: "p14b", budgetFactor: 1.6, fallbacks: ["pivot-path", "retrieval-only", "human"] },
  },
  intent: { guru: ENCODER, latn: ENCODER, arab: ENCODER },
};

export async function callWithFallback(task: Task, script: Script, input: Input, trace: Trace): Promise<Output> {
  const route = ROUTES[task][script];
  const chain = [route, ...route.fallbacks.map((f) => FALLBACK_ROUTES[f](route))];
  for (const r of chain) {
    if (breaker(r).isOpen()) continue;
    try {
      const out = await withTimeout(serve(r, input), TIMEOUTS[task]);
      if (task === "chat" && detectScript(out.text).dominant !== targetScript(script)) throw new WrongScript(r);
      trace.meta.route = r.name; trace.meta.fallbackDepth = chain.indexOf(r);
      return out;
    } catch (e) {
      breaker(r).failure(e); metrics.increment("route.failure", { task, script, route: r.name });
    }
  }
  return humanHandoff(script, input);
}`,
      lines: [
        { code: "latn: { model: \"A\", adapter: \"pa-guru-v7\", via: \"transliterate-in\", replyVia: \"pa-latn-v3\", promptVersion: \"p14\", budgetFactor: 1.9, fallbacks: [\"rules-translit-out\", \"retrieval-only\", \"human\"] },", say: "The Romanised cell encodes the pivot: transliterate in, answer with the Gurmukhi adapter, reply through a Romanised adapter, with a rules-based transliteration as the first fallback." },
        { code: "arab: { model: \"B\", adapter: \"pa-arab-v4\", promptVersion: \"p14b\", budgetFactor: 1.6, fallbacks: [\"pivot-path\", \"retrieval-only\", \"human\"] },", say: "Shahmukhi's fallback is the pivot path, never the base model, so an outage cannot become Urdu replies." },
        { code: "if (task === \"chat\" && detectScript(out.text).dominant !== targetScript(script)) throw new WrongScript(r);", say: "A wrong-script answer counts as a route failure and moves to the next fallback." },
        { code: "trace.meta.route = r.name; trace.meta.fallbackDepth = chain.indexOf(r);", say: "Which route answered and how deep the fallback went, on the trace, so dashboards show fallback rate per script." },
      ],
    },
    useIt: "Deploy with a script-aware gateway and routing table, per-route adapters and health checks, caches keyed on normalised text and versions, token budgets from fertility ratios, per-script fallback chains that never change language, and per-script canaries and rollbacks.",
    takeaways: ["Route by (task, script) from a table; adapters and prompts are versioned per cell.", "Budget tokens per script with measured fertility; cost per answer per script on the dashboard.", "Fallbacks stay in the user's script: adapter → pivot → retrieval-only → human.", "Canary and roll back one cell at a time."],
    terms: [["gateway", "the service that receives requests, applies limits and routes them"], ["fallback chain", "the ordered alternatives tried when a route fails"], ["budget factor", "the fertility-based multiplier applied to English token estimates for a script"]],
    reflect: { q: "Why is 'the base model without any adapter' an acceptable fallback for Gurmukhi but not for Shahmukhi?", a: "The base model answers Gurmukhi in Punjabi, just less naturally; it answers Shahmukhi in Urdu, which is a language failure. Shahmukhi's fallback must go through the Gurmukhi path with transliteration so the reply stays Punjabi." },
  },

  "m46-punjabi-production-monitoring": {
    simple: "Production monitoring for a Punjabi product is the module 41 dashboard split by script, with wrong-language rate, fallback rate, detection confidence and feedback as first-class panels and alerts.",
    concept:
      "Module 41 covered observability; **Punjabi production monitoring** is the same tracing and dashboards with the script dimension everywhere and four Punjabi-specific signals. Wrong-language rate: an automatic classifier on every reply (script detection plus Punjabi-versus-Urdu and Hindi-vocabulary checks), per script and route. Detection health: the distribution of detection confidence and the share of 'mixed' and 'unknown', per day; a shift means a keyboard update, a new user segment or a detector regression. Fallback depth: how often each script fell down its chain, and to where. Feedback and escalation rates per script and reason.\n\nAlongside: latency and time to first token per script (transliteration hops and fertility make them differ), cost per answer per script, cache hit rate per script, retrieval score distributions per query script, and the gap-report size. Alerts fire on per-script rate changes, especially in the hour after a deploy, and on any script's wrong-language rate crossing its threshold. The weekly review reads the per-script panels first and the averages last.",
    why:
      "Every failure in this module hides inside an average: Urdu replies to a minority script, Romanised detection failing on short messages, a Shahmukhi adapter outage replaced by a slightly worse pivot. Per-script monitoring is what lets a small team run a three-script product safely: the panels say which script, which component, since when.",
    how: [
      "Tag every trace, metric and log line with script, dialect, mixing flag, route, adapter and prompt version.",
      "Compute reply-language checks automatically on a sample (or all) replies: script match, Urdu drift, Hindi vocabulary; emit rates per script.",
      "Dashboards: one row per script with volume, latency, cost, cache hits, wrong-language rate, fallback depth, detection confidence, feedback and escalation.",
      "Alerts: per-script thresholds on wrong-language rate, fallback rate, thumbs-down rate and detection 'unknown' share; deploy-window alerts at tighter thresholds.",
      "Weekly review: per-script panels, the gap report, the labelling queue size and the improvement pipeline's report card trend.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Panel", "Gurmukhi", "Romanised", "Shahmukhi", "Alert"],
        rows: [
          ["answers / day", "30,100", "24,400", "6,050", "−30% day on day"],
          ["wrong-language rate", "0.8%", "1.9%", "2.6%", "> 5% for 30 min"],
          ["fallback depth ≥ 1", "0.4%", "1.1%", "3.8%", "> 10% for 15 min"],
          ["detection 'unknown' share", "0.2%", "4.1%", "1.0%", "doubles vs 7-day median"],
          ["p95 time to first token", "1.6 s", "2.1 s", "1.9 s", "> 3 s for 10 min"],
          ["cost per answer", "£0.0019", "£0.0022", "£0.0031", "> 1.5× 7-day median"],
          ["thumbs-down rate", "6%", "7%", "8%", "> 12% for 1 h, or +4 pts after deploy"],
          ["escalation rate", "5%", "8%", "9%", "+3 pts vs 7-day median"],
        ],
      },
      caption: "Three columns, always. The averages are a fourth column, read last.",
    },
    everyday: {
      title: "A school that reports by class, not by school",
      text: "A head teacher who looks only at the whole-school average never notices that one class has lost its teacher. Reporting by class shows it in a day. A Punjabi product reporting by script is the same discipline: the Shahmukhi column is a small class that an average will always hide.",
    },
    engineering: {
      title: "The keyboard update caught by detection health",
      text: "One Tuesday the Romanised 'unknown' detection share rose from 4% to 13% with no deploy. The detection-health panel localised it to messages from one Android keyboard version, which had started auto-capitalising and inserting zero-width joiners into Romanised text; the detector's function-word matching failed on the altered words. The normaliser's invisible-character rule was extended and the detector retrained on the new samples the same week. Thumbs-down for Romanised had risen only 2 points, within noise; the detection panel saw it first, a week before users would have made it obvious.",
    },
    maths: {
      formula: "alert when rate_now − median₇ₐ > k · √(p(1 − p) ÷ n);  choose k ≈ 3 so that noise on small scripts does not page, but real shifts do",
      meaning: "Alert thresholds should respect sample size: a 2-point rise on 300 Shahmukhi answers is noise, on 30,000 Gurmukhi answers it is real. Scaling the threshold by the standard error makes alerts fair across scripts.",
      worked: [
        "Shahmukhi wrong-language rate, hourly: n = 250, p = 0.026. SE = √(0.026 × 0.974 ÷ 250) ≈ 0.010. Alert if the rate exceeds 0.026 + 3 × 0.010 = 0.056.",
        "Gurmukhi, hourly: n = 1,250, p = 0.008. SE ≈ 0.0025. Alert above 0.008 + 0.0075 = 0.0155.",
        "A deploy pushes Shahmukhi to 0.09 and Gurmukhi to 0.012: Shahmukhi alerts, Gurmukhi does not; both are the right calls.",
        "Fixed thresholds (say 5% for all) would have paged on Shahmukhi noise at 5.1% and missed a real Gurmukhi regression to 1.4%.",
      ],
    },
    code: {
      title: "Reply-language checks and per-script alerts",
      lang: "ts",
      src: `// Runs on every reply (or a sample at high volume); emits the Punjabi-specific metrics.
export async function monitorReply(trace: Trace, reply: string, requestedScript: Script) {
  const script = detectScript(reply).dominant;
  const wrongScript = script !== targetScript(requestedScript);
  const urduDrift = requestedScript === "arab" && !wrongScript && (await punjabiVsUrdu(reply)).lang === "ur";
  const hindiWords = requestedScript === "guru" ? countHindiVocabulary(reply) : 0;
  const tags = { script: requestedScript, route: trace.meta.route, promptVersion: trace.meta.promptVersion };
  metrics.increment("reply.total", tags);
  if (wrongScript || urduDrift) metrics.increment("reply.wrong_language", { ...tags, kind: wrongScript ? "script" : "urdu" });
  if (hindiWords > 0) metrics.increment("reply.hindi_vocab", tags);
  metrics.observe("reply.fallback_depth", trace.meta.fallbackDepth ?? 0, tags);
}

// Alert rule: rate above the 7-day median by more than 3 standard errors, evaluated per script every 5 minutes.
export function shouldAlert(rateNow: number, n: number, median7d: number, k = 3): boolean {
  const p = Math.max(median7d, 1 / Math.max(n, 1));
  const se = Math.sqrt((p * (1 - p)) / Math.max(n, 1));
  return n >= 50 && rateNow - median7d > k * se;
}`,
      lines: [
        { code: "const urduDrift = requestedScript === \"arab\" && !wrongScript && (await punjabiVsUrdu(reply)).lang === \"ur\";", say: "Right script, wrong language: the Shahmukhi failure that script detection alone cannot see, checked by the Punjabi-versus-Urdu classifier." },
        { code: "const hindiWords = requestedScript === \"guru\" ? countHindiVocabulary(reply) : 0;", say: "A word-list count of common Hindi intrusions in Gurmukhi replies; a rising trend means prompt or model drift." },
        { code: "if (wrongScript || urduDrift) metrics.increment(\"reply.wrong_language\", { ...tags, kind: wrongScript ? \"script\" : \"urdu\" });", say: "The wrong-language counter, tagged by script, route and prompt version, so a bad deploy is visible in one panel." },
        { code: "return n >= 50 && rateNow - median7d > k * se;", say: "The standard-error alert rule: fair across big and small scripts; no alert on fewer than 50 samples." },
      ],
    },
    useIt: "Monitor per script from day one: tag everything with script and route, compute reply-language checks automatically, build the per-script dashboard rows, alert with sample-size-aware thresholds and tighter deploy-window rules, and read the per-script panels before the averages in every weekly review.",
    takeaways: ["Split every metric by script; averages hide the minority-script failures.", "Four Punjabi signals: wrong-language rate, detection health, fallback depth, feedback and escalation per script.", "Alert thresholds scaled by standard error treat small and large scripts fairly.", "Detection health often catches problems a week before users complain."],
    terms: [["wrong-language rate", "the share of replies not in the requested script and language"], ["detection health", "the daily distribution of language-detection confidence and unknown or mixed shares"], ["fallback depth", "how far down its fallback chain a request went"]],
    reflect: { q: "The overall thumbs-down rate is flat at 6.5% but the Shahmukhi column shows 14%. What does a flat average mean here?", a: "Nothing good: Shahmukhi is a tenth of traffic, so its doubling moves the average by less than a point. The per-script panel is the real signal; the average would have let the regression run for weeks." },
  },
};

export const M46_QUIZ: Quiz[] = [
  {
    q: "Where should 'which script is this request in?' be decided in a Punjabi product?",
    options: ["In the model's system prompt", "At the entrance, before normalisation and routing, and carried on the trace", "After generation", "Nowhere; the model handles it"],
    answer: 1,
    why: ["The prompt cannot route or tag metrics.", "Correct. Script is a first-class attribute from the first byte to the dashboard.", "Too late to route or normalise.", "Unhandled script is how Urdu replies happen."],
    reason: true,
  },
  {
    q: "A general language detector labels Shahmukhi Punjabi as Urdu. What is the fix?",
    options: ["Trust it; they are similar", "A per-script Punjabi-versus-Urdu classifier using function words, plus session history and a confidence score", "Ask users to type in Gurmukhi", "Disable detection"],
    answer: 1,
    why: ["They are different languages; the routing goes wrong.", "Correct. Script first, then language within the script, with confidence.", "Users will not.", "Then every reply script is a guess."],
  },
  {
    q: "A script detector counts only U+0600–U+06FF as Arabic script. What breaks?",
    options: ["Nothing", "Shahmukhi-specific letters like ݨ and ࣇ in supplement blocks are not counted, tipping some messages to the wrong script", "Gurmukhi detection", "English detection"],
    answer: 1,
    why: ["Real users typed exactly those letters.", "Correct. Include the Arabic Supplement and Extended blocks.", "Unaffected.", "Unaffected."],
  },
  {
    q: "The Shahmukhi cache hit rate is 3% while Gurmukhi is 41%. Most likely cause?",
    options: ["Shahmukhi users ask unique questions", "Cache keys are not normalised, so letter variants and zero-width characters make identical questions different keys", "The cache is too small", "Shahmukhi is rare"],
    answer: 1,
    why: ["Questions repeat in every language.", "Correct. Key on the matching form plus the normaliser version.", "Size does not explain a per-script gap.", "Rarity lowers absolute hits, not the hit rate."],
  },
  {
    q: "A translated bank article has a better chrF but renders 18.5% as 18%. Which gate catches it?",
    options: ["chrF", "Number preservation check, routing the article to review", "Script post-check", "None"],
    answer: 1,
    why: ["chrF sees a near-perfect match.", "Correct. Every number in the source must appear in the target; a miss queues the article.", "The script is fine.", "It must be caught."],
    reason: true,
  },
  {
    q: "What should a Shahmukhi request fall back to when its adapter is down?",
    options: ["The base model", "The pivot path: transliterate in and out through the Gurmukhi route, flagged in the trace", "The Urdu assistant", "An error page"],
    answer: 1,
    why: ["The base model replies in Urdu.", "Correct. Less natural, still Punjabi, and visible on the dashboard.", "A language failure.", "Users deserve an answer."],
  },
  {
    q: "A scanned notice has a page with dictionary hit rate 0.57. What does the document assistant do?",
    options: ["Answer from it anyway", "Mark the page unreliable, warn the user, and avoid relying on it for numbers and dates", "Delete the page", "Translate it first"],
    answer: 1,
    why: ["Invented dates come from exactly such pages.", "Correct. Honest warnings and a request for a clearer photo.", "The user needs to know it exists.", "Translation of garbage is garbage."],
  },
  {
    q: "The overall thumbs-down rate is flat but the Shahmukhi column doubled. What does the average tell you?",
    options: ["Everything is fine", "Almost nothing; a minority script's regression barely moves an average, so per-script panels are the real signal", "Shahmukhi users are harsh", "The dashboard is broken"],
    answer: 1,
    why: ["A doubling is a regression.", "Correct. Read per-script panels first; alert with sample-size-aware thresholds per script.", "No.", "The average is behaving as averages do."],
  },
  {
    q: "Why over-sample Shahmukhi thumbs-downs when choosing traces to label?",
    options: ["To make the gold set all failures", "To get enough failure examples for the script that needs to improve, while keeping a uniform slice for representativeness", "Because Gurmukhi is perfect", "To save money"],
    answer: 1,
    why: ["A uniform slice is kept so the gold set reflects normal traffic.", "Correct. Weighted sampling by failure and target script, plus a uniform share.", "No script is.", "Labelling costs the same per item."],
  },
];

export const M46_EXERCISES: Exercise[] = [
  {
    title: "Draw the request path for one message",
    kind: "think",
    task: "Trace the message 'mera refund kadon aayega?' through the architecture: every component it touches, what each outputs, and which fields end up on the trace. State what the reply looks like and what the post-check verifies.",
    hints: ["Script detection → language detection → normalise → transliterate → route → retrieve → generate → post-check → trace."],
    solution: "Script detection: Latin, not mixed. Language detection: Romanised Punjabi (kadon, aayega, mera…? pattern), confidence high. Normaliser: display 'mera refund kadon aayega?', matching lowercased same. Transliteration in: ਮੇਰਾ refund ਕਦੋਂ ਆਵੇਗਾ? (refund kept). Route: (chat, latn) → model A + Gurmukhi adapter via pivot, reply via Romanised adapter, prompt p14. Retrieval: hybrid over the Gurmukhi KB with the transliterated query, keyword on original; top chunks on refund timelines. Generation: Romanised Punjabi, respectful, 'refund' kept, cites [1]: 'Tuhada refund 5-7 din vich tuhade account vich aa javega ji [1].' Post-check: dominant script Latin, no ਤੂੰ/tu, language Punjabi by function words. Trace: script latn, mixed false, dialect unknown, route chat/latn, promptVersion p14, retrieval scores, fallbackDepth 0, normaliser version.",
  },
  {
    title: "Compute per-script alert thresholds",
    kind: "calculate",
    task: "Hourly wrong-language rates and volumes: Gurmukhi 0.9% on 1,400 replies; Romanised 2.0% on 1,100; Shahmukhi 2.8% on 220. Using the rule 'alert if rate exceeds the 7-day median by more than 3 standard errors' (median = current rates), compute each script's alert threshold. A deploy moves the rates to 1.5%, 2.6% and 7.5%. Which scripts alert?",
    hints: ["SE = √(p(1−p)/n).", "Threshold = median + 3·SE."],
    solution: "Gurmukhi: SE = √(0.009×0.991/1400) ≈ 0.00252; threshold ≈ 0.009 + 0.0076 = 1.66% → 1.5% does not alert. Romanised: SE = √(0.02×0.98/1100) ≈ 0.00422; threshold ≈ 3.27% → 2.6% does not alert. Shahmukhi: SE = √(0.028×0.972/220) ≈ 0.01112; threshold ≈ 6.14% → 7.5% alerts. Only Shahmukhi pages, which is right: its rise is both large and beyond noise, while the others are within noise.",
  },
  {
    title: "Plan the token budget and cost per script",
    kind: "calculate",
    task: "Daily answers: Gurmukhi 40,000, Romanised 30,000, Shahmukhi 8,000. English baseline 300 tokens per answer. Fertility factors 1.7, 1.9, 1.6. Blended prices per million tokens: route A £4, route B (Shahmukhi) £7. Romanised adds 60 tokens of transliteration-model calls at £1 per million. Compute daily tokens, cost per answer per script and the total daily cost.",
    hints: ["Tokens = answers × 300 × factor; Romanised adds 60 × answers at its own price."],
    solution: "Gurmukhi: 40,000×300×1.7 = 20.4M tokens → £81.60 → £0.00204 per answer. Romanised: 30,000×300×1.9 = 17.1M tokens on A → £68.40, plus 30,000×60 = 1.8M at £1 → £1.80; total £70.20 → £0.00234 per answer. Shahmukhi: 8,000×300×1.6 = 3.84M tokens on B → £26.88 → £0.00336 per answer. Daily total ≈ £178.68. Shahmukhi is the most expensive per answer; watch it as traffic grows and consider whether an adapter on route A could serve it.",
  },
  {
    title: "Design the weekly improvement run",
    kind: "think",
    task: "Write the agenda and the artefacts of one weekly pipeline run for a product with the three scripts: what is sampled and why, what the annotators produce, what gets retrained, what the gate is, how it ships, and what the release log records.",
    hints: ["Weighted sample with a uniform slice; kappa gate; small gold additions; per-cell thresholds; canary; versions."],
    solution: "Sample 600 traces: weights ×4 for thumbs-down, ×3 for low detection confidence, ×3 for weak retrieval, script boosts to reach 40/35/25 Gurmukhi/Romanised/Shahmukhi, plus 10% uniform. Annotators per script label language, correctness, script-ok and the ideal answer; kappa per script must be ≥ 0.75 or the run stops and guidelines are revised. 15% of labels, reviewed, go to gold-set vN+1; the rest to training after cross-split deduplication. Retrain: detector weekly; embeddings and the three adapters fortnightly. Gate: per-(task, script) thresholds on the report card and improvement over the current card. Ship: routing-table canary at 10% per passing cell, promote after 24 h of per-script dashboards within thresholds. Release log: week, adapter versions, detector and embedding versions, prompt versions, gold-set version, normaliser version, report card, canary outcome.",
  },
];
