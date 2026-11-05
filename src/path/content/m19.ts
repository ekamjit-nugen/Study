import type { Exercise, LessonBody, Quiz } from "../types";

// Module 19: Understanding LLM limitations. One concept per lesson.
// Builds on Module 18's generation mechanics: every limitation here follows from how the next token is produced.

export const M19_BODIES: Record<string, LessonBody> = {
  "m19-hallucinations": {
    simple: "A hallucination is a fluent, confident statement the model produced that is false or unsupported: an invented citation, a non-existent function, a wrong date, delivered in the same tone as the truth.",
    concept:
      "A **hallucination** is output that reads as fact but is not grounded in anything real: a court case that was never decided, a library function that does not exist, a statistic with no source, a plausible but wrong answer to 'what is the capital of Australia'. The defining feature is not the error but the presentation: the model does not flag doubt, because it has no internal marker that separates recalled facts from fluent invention.\n\nHallucinations come in degrees. Some are outright fabrications (a made-up paper with a made-up author); some are blends (a real author attached to a wrong title); some are subtle (a correct procedure with one wrong parameter). They are most common where the model's training data is thin or contradictory, where the prompt asks for specifics the model does not have, and where the model is pushed to answer rather than allowed to decline.\n\nThey are not bugs in a particular model that the next version will fix completely; they are a consequence of next-token prediction, which the next lesson explains. Every system built on an LLM has to be designed on the assumption that some outputs will be hallucinated.",
    why:
      "The word exists because the failure is unlike ordinary software errors. A database either has the record or returns nothing; it never returns a plausible fake. A model that writes text one token at a time will, when the right fact is not available, still produce the most plausible-looking continuation, and plausibility is what it was trained to maximise. Naming the phenomenon lets teams plan for it: detect it, reduce it, and decide which tasks can tolerate it and which cannot.",
    how: [
      "The prompt asks for a specific fact or detail.",
      "The model's weights hold the fact weakly, wrongly, or not at all; the next-token distribution has no strongly supported continuation.",
      "The model still produces tokens, choosing the most plausible pattern: a name that sounds like a name, a year that sounds right.",
      "Autoregression commits to the invention; later tokens elaborate it consistently.",
      "The output is fluent and confident, so nothing in its form signals that it is false.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Kind", "Example", "Why it happens", "Typical defence"],
        rows: [
          ["fabricated entity", "a paper, case or product that does not exist", "pattern of 'author, title, year' learned; specifics missing", "retrieval; require citations to supplied sources"],
          ["blended fact", "right author, wrong title", "two memories merged in the weights", "verification against a source of truth"],
          ["wrong specific", "a function with a plausible but non-existent parameter", "the API changed or was rarely seen", "tools: run the code, check the docs"],
          ["confident guess", "a date or number stated as fact", "nothing penalised guessing during training", "ask for uncertainty; allow 'I do not know'"],
          ["instruction-driven", "'cite three sources' produces three fakes", "the prompt demanded output the model cannot ground", "only ask for what the context contains"],
        ],
      },
      caption: "Different shapes, one cause: plausible continuation without grounding.",
    },
    everyday: {
      title: "The friend who never says 'I don't know'",
      text: "Everyone knows someone who answers every question with total confidence. Ask them the year a film came out and they say '1994' instantly, right about two times in three, and nothing in their voice tells you which times. You learn to check anything that matters. An LLM is that friend, at scale, and the checking is your system's job.",
    },
    engineering: {
      title: "The lawyer's brief with six invented cases",
      text: "In 2023 a lawyer filed a court brief citing six precedents produced by a chatbot. None existed; the model had generated case names, citations and quotations in perfect legal style. The court sanctioned the lawyer. Engineering lesson, now standard in legal-tech products: never let a model cite from memory. Retrieve the real documents, show them to the model, require every citation to point at a supplied passage, and verify each citation against the database before the brief leaves the system.",
    },
    maths: {
      formula: "P(at least one false claim in an answer) = 1 − ∏_i (1 − h_i)   over claims i with hallucination rates h_i",
      meaning: "Even a low per-claim error rate compounds across an answer with many claims.",
      worked: [
        "A model that is wrong on 3% of specific claims, asked for an answer containing 10 claims: P(all correct) = 0.97¹⁰ ≈ 0.74; about one answer in four contains a false claim.",
        "At 30 claims (a long report): 0.97³⁰ ≈ 0.40; most reports contain at least one.",
        "Grounding that cuts the per-claim rate to 0.5%: 0.995³⁰ ≈ 0.86. Reducing the rate per claim matters more than shortening answers.",
      ],
    },
    code: {
      title: "Only accept citations that exist",
      lang: "ts",
      src: `// The model answers with [n] markers that must refer to supplied passages; anything else is rejected.
const sources = await retrieve(question, { limit: 5 });                 // real passages with ids 1..5
const prompt = "Answer only from the numbered sources. Cite each claim as [n]. If the sources do not cover it, say so.\\n\\n"
  + sources.map((s, i) => "[" + (i + 1) + "] " + s.text).join("\\n\\n") + "\\n\\nQuestion: " + question;

const answer = await ask(prompt);
const cited = [...answer.matchAll(/\\[(\\d+)\\]/g)].map((m) => Number(m[1]));
const invalid = cited.filter((n) => n < 1 || n > sources.length);
if (invalid.length > 0 || cited.length === 0) {
  return { answer: "I could not find this in the available documents.", sources: [] };   // never show an ungrounded answer
}
return { answer, sources: [...new Set(cited)].map((n) => sources[n - 1]) };`,
      lines: [
        { code: "const sources = await retrieve(question, { limit: 5 });                 // real passages with ids 1..5", say: "The model is given real material to cite; it is not asked to remember." },
        { code: "const invalid = cited.filter((n) => n < 1 || n > sources.length);", say: "A citation to [7] when only five sources exist is a hallucinated reference, caught in code." },
        { code: "return { answer: \"I could not find this in the available documents.\", sources: [] };   // never show an ungrounded answer", say: "An honest decline beats a fluent invention. The system, not the model, enforces it." },
      ],
    },
    useIt: "Assume hallucinations will occur and design around them: ground answers in retrieved documents, use tools for facts and calculations, require and verify citations, let the model decline, validate structured outputs, and route high-stakes claims to people. Modules 28 and 37 give the mechanisms and the measurements.",
    takeaways: ["A hallucination is fluent, confident, false output with no signal of doubt.", "It is a consequence of next-token prediction, not a fixable bug.", "Per-claim error compounds across long answers.", "Defend in the system: ground, verify, allow declining, use tools."],
    terms: [["hallucination", "confident output that is false or unsupported"], ["grounding", "supplying real sources the model must answer from"]],
    reflect: { q: "Why does asking a model to 'cite three sources' make hallucination more likely, not less?", a: "It demands specific references the model may not have; the instruction is satisfied by producing three reference-shaped strings, which is exactly what plausible continuation yields. Citations must come from supplied text, not memory." },
  },

  "m19-why-hallucinations-happen": {
    simple: "Hallucinations happen because the model is trained to produce the most plausible next token, not to check truth; when the true continuation is unknown, the plausible one is produced instead, with nothing to mark the difference.",
    concept:
      "The mechanism is in Modules 14 and 18. Pretraining rewards one thing: assigning high probability to the token that actually came next in the training text. A model that writes 'the study, published in 2019 by' and continues with a plausible surname gets low loss on average, because that is what such sentences usually contain. Nothing in the objective rewards saying 'I do not know', and nothing distinguishes 'I have seen this exact fact many times' from 'this is the kind of thing that goes here'.\n\nAt generation, the next-token distribution is always produced, and some token is always chosen. If the correct fact is strongly represented in the weights, its tokens dominate and the answer is right. If it is weakly represented, the distribution spreads across plausible alternatives, and sampling or greedy decoding picks one; the output looks identical in both cases. Autoregression then builds on the chosen token, so a single wrong pick becomes a coherent paragraph of invention.\n\nFine-tuning for assistance adds pressure in the same direction: models are rewarded for helpful, complete-looking answers, and an unhedged answer often rates higher than a cautious one. Alignment training now tries to teach declining and uncertainty, with partial success.",
    why:
      "Teams that treat hallucination as a knowledge gap try to fix it with more training data and are disappointed; teams that treat it as a decoding accident try temperature 0 and are disappointed. Understanding that it comes from the objective itself, plausibility without a truth signal, points to the fixes that work: give the model the truth in context (retrieval), give it tools that return facts, make 'I do not know' an acceptable answer, and verify outside the model. It also explains why bigger models hallucinate less but never zero: they have seen more, so more facts are strongly represented, but the mechanism is unchanged.",
    how: [
      "Training: cross-entropy rewards the most likely next token; no term rewards truth or penalises confident guesses.",
      "Memory: facts are stored diffusely in the weights with varying strength; rare or conflicting facts are weak.",
      "Generation: a distribution is always produced; weak knowledge gives a spread distribution, but a token is still chosen.",
      "Autoregression: the chosen token becomes context, and the model continues consistently with it.",
      "Presentation: fluency comes from the model's language skill, which is strong regardless of whether the content is grounded.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Well-known fact: 'capital of France is'", points: ["Seen millions of times", "Distribution: Paris 0.99", "Any decoding picks Paris", "Right, and looks confident"] },
      right: { title: "Obscure fact: 'the 1987 mayor of Tromsø was'", points: ["Seen rarely or never", "Distribution: spread over Norwegian-looking names", "Decoding picks one anyway", "Wrong, and looks exactly as confident"] },
      caption: "The output's form does not reveal which column it came from. That is the whole problem.",
    },
    everyday: {
      title: "Finishing a sentence in a language you half know",
      text: "Speaking a second language, you reach a word you do not know and, rather than stop, produce something that sounds right: the right shape, the right ending. Sometimes it is a real word; sometimes not. You did it because stopping felt worse than guessing, and because your sense of what sounds right is far stronger than your memory of the specific word. The model's fluency and the model's facts are separate in just that way.",
    },
    engineering: {
      title: "The API parameter that did not exist",
      text: "A code assistant kept suggesting a `retries` option on an HTTP client that had no such option. The training data contained many libraries that do have it, so the pattern 'client config has a retries field' was strong while the specific library's absence of it left no trace. Temperature 0 did not help: the wrong token had the highest probability. The fix was a tool: the assistant now reads the installed library's type definitions and the model is told to use only options that appear in them. The hallucination rate on configuration code fell from 9% to under 1%.",
    },
    maths: {
      formula: "L = −log p(x_{next});   no term for truth;   argmax over a spread distribution still returns a token",
      meaning: "The training loss is about the probability of the observed token. A flat distribution at inference yields a low-confidence pick that looks the same as a high-confidence one once decoded.",
      worked: [
        "Strong fact: p(Paris) = 0.99, decoded: Paris. Log-probability −0.01.",
        "Weak fact: p over 50 plausible names, the top at 0.06. Greedy decodes the 0.06 name. Log-probability −2.8. The text 'The mayor was Ola Hansen' is produced in both cases; only the log-probability differs, and the user never sees it.",
        "Reading the log-probability is one of the few internal signals: an answer whose key tokens sit below −1.5 (probability under about 0.22) is a candidate for 'not sure', which Module 18's logits lesson used for routing.",
      ],
    },
    code: {
      title: "Using the model's own confidence to decline",
      lang: "py",
      src: `# Pseudocode: compare the top candidate's probability on the critical token with a threshold
logits = model.next_logits(prompt + " The mayor was")
probs = softmax(logits)
top_p, top_id = probs.max(), probs.argmax()

if top_p < 0.3:
    answer = "I am not confident about this; I could not find a reliable record."   # decline instead of guessing
else:
    answer = decode_from(top_id)

# Better still: avoid relying on memory at all
record = lookup_tool("mayor of Tromsø", year=1987)          # a tool that returns a fact or nothing
answer = record.name if record else "No record found."`,
      lines: [
        { code: "if top_p < 0.3:", say: "A spread distribution is the model's version of doubt. Reading it lets the system decline before inventing." },
        { code: "record = lookup_tool(\"mayor of Tromsø\", year=1987)          # a tool that returns a fact or nothing", say: "The real fix: a source that can return nothing, which the model cannot." },
      ],
    },
    useIt: "Expect hallucination wherever the model must recall specifics; prefer supplying facts to asking for them; read log-probabilities when they are available; and remember that model size lowers the rate without changing the mechanism. Design the system so a wrong plausible answer is caught before it reaches a user.",
    takeaways: ["The training objective rewards plausibility, never truth; there is no 'I do not know' signal.", "Weak knowledge gives a spread distribution; decoding still picks a token.", "Autoregression turns one wrong token into a consistent invention.", "Fixes: supply facts, use tools, allow declining, verify outside the model."],
    terms: [["plausibility", "how typical a continuation is of the training text, which is what the model optimises"], ["calibration", "how well a model's stated or implicit confidence matches how often it is right"]],
    reflect: { q: "Would a model trained to say 'I do not know' whenever unsure solve hallucination?", a: "It would help if the model could reliably tell when it is unsure, but its sense of its own uncertainty is itself learned and imperfect; alignment training improves it, and systems still need external grounding and verification." },
  },

  "m19-model-knowledge-vs-real-time-information": {
    simple: "A model's knowledge is whatever was in its training data, frozen in its weights; it has no access to the present unless your system puts current information into the prompt or gives it a tool.",
    concept:
      "What a model 'knows' is stored in its parameters and was fixed when training ended. It includes an enormous amount about the world up to that point, blurred and compressed, and nothing after. It does not know today's date, the current price of anything, whether a server is up, what is in your database, or what happened last week. Asked such things, it will either say it cannot know (if aligned to do so) or produce a plausible answer from stale patterns (a hallucination of the time-dependent kind).\n\n**Real-time information** has to be supplied at inference. There are two ways: put it in the prompt (today's date, a retrieved document, a database row) so the model can read it in context, or give the model a tool it can call (a search, a database query, an API) and feed the result back. In both cases the model reasons over the supplied information with its general knowledge; it never updates its weights.\n\nThis separation is a feature as much as a limit: it means the same model can be given different, private, current information per request without retraining, which is the basis of retrieval-augmented generation (Module 28) and tool use (Module 27).",
    why:
      "Weights are expensive and slow to change; the world changes constantly; and most useful information is private to an organisation and never in any training set. A model that could only use what it was trained on would be a general-purpose essayist, not a component you can build with. Keeping knowledge in the weights and information in the context lets models be reused across every company and every day, at the cost of requiring the system to supply what the moment needs.",
    how: [
      "Identify what the task needs that the model cannot know: the date, user data, live state, recent events, private documents.",
      "Fetch it in your code (database, API, search index).",
      "Place it in the prompt with clear labels, or expose it as a tool the model can call.",
      "Instruct the model to prefer supplied information over its memory, and to say when the information is missing.",
      "Refresh per request; never rely on the model to remember between calls.",
    ],
    visual: {
      kind: "compare",
      left: { title: "In the weights (training)", points: ["Language, reasoning patterns, general facts up to the cutoff", "Fixed; identical for every user", "Blurred: specifics may be wrong", "Free to use, no fetch"] },
      right: { title: "In the context (inference)", points: ["Today's date, this user's data, live records, recent news", "Supplied per request by your code or a tool", "Exact, if your source is", "Costs tokens; must be fetched and formatted"] },
      caption: "Knowledge is general and stale; information is specific and fresh. Good systems combine them.",
    },
    everyday: {
      title: "A brilliant consultant just back from a year abroad",
      text: "They know the industry deeply, but nothing that happened while they were away, and nothing about your company's internal numbers. You do not retrain them; you hand them a briefing pack and give them access to the dashboards. Their expertise plus your current data is what you are paying for. The model is the consultant; the prompt and tools are the pack and the dashboards.",
    },
    engineering: {
      title: "The assistant that quoted last year's prices",
      text: "A travel company's assistant answered fare questions from the model's memory and quoted prices from its training data, a year out of date. Customers booked expecting the quoted fares. The fix was architectural: the assistant now calls a fares API for any price question and is instructed never to state a price not returned by the tool. The model's knowledge of how fares work remained useful for explaining fare rules; the numbers come from the live system every time.",
    },
    maths: {
      formula: "answer = f(weights, context);   context = fetch(now, user, query);   weights fixed since the cutoff",
      meaning: "The output depends on frozen weights and a per-request context; anything time-dependent must come through the context.",
      worked: [
        "Cost of supplying information: a 1,200-token retrieved passage at 3 units per million tokens ≈ 0.0036 units per request; at 100,000 requests a day ≈ 360 units. Compared with retraining a model on new data, orders of magnitude cheaper and instantly current.",
        "Staleness: a model trained with data to March answers a June question about 'the latest version' with the March version 100% of the time unless told otherwise; one line in the prompt ('Today is 5 June; the current version is 4.2') fixes it for that request.",
      ],
    },
    code: {
      title: "Supplying what the model cannot know",
      lang: "ts",
      src: `const today = new Date().toISOString().slice(0, 10);
const account = await db.accounts.findUnique({ where: { id: userId } });        // private, current data
const fares = await faresApi.quote({ from, to, date });                            // live external data

const system = [
  "You are a travel assistant.",
  "Today's date is " + today + ".",
  "Use only the fare information provided below for prices; never state a price from memory.",
  "If the information needed is not provided, say so.",
].join("\\n");

const context = "<account>\\n" + JSON.stringify({ tier: account.tier, credits: account.credits }) + "\\n</account>\\n"
  + "<fares>\\n" + JSON.stringify(fares) + "\\n</fares>";

const reply = await ask({ system, messages: [{ role: "user", content: context + "\\n\\n" + question }] });`,
      lines: [
        { code: "\"Today's date is \" + today + \".\",", say: "The model does not know the date. One line supplies it." },
        { code: "const fares = await faresApi.quote({ from, to, date });                            // live external data", say: "Fetched by your code at request time; the model never had this and never will in its weights." },
        { code: "\"Use only the fare information provided below for prices; never state a price from memory.\",", say: "Prefer context over memory, explicitly. Without this, a stale price can still surface." },
      ],
    },
    useIt: "For every feature, list what the model must know that it cannot: dates, user state, live data, recent events, private documents. Supply each through the prompt or a tool, label it, and instruct the model to prefer it. Treat the weights as a well-read but out-of-date colleague.",
    takeaways: ["Knowledge lives in frozen weights; information must be supplied per request.", "The model does not know the date, live state, private data or recent events.", "Supply via the prompt or tools; instruct the model to prefer supplied facts.", "The separation is what makes one model reusable everywhere."],
    terms: [["real-time information", "facts that change or are private and must be fetched at request time"], ["in-context information", "data placed in the prompt for the model to read"]],
    reflect: { q: "A user asks the assistant 'what did I order last time?'. Where must the answer come from?", a: "From your database, fetched by your code and placed in the prompt or returned by a tool. The model has no memory of previous sessions and no access to your data." },
  },

  "m19-knowledge-cutoff": {
    simple: "The knowledge cutoff is the date after which the model's training data contains nothing; the model may not know newer events, versions or facts, and may not realise that it does not.",
    concept:
      "Every model has a **knowledge cutoff**: the point in time up to which its training text was collected. Events after it are absent. Many things change after a cutoff: software versions and APIs, prices, office holders, laws, product names, and the answer to 'what is the latest'. The model will often answer such questions from pre-cutoff patterns without flagging it, because from inside the weights the past looks like the present.\n\nThe cutoff is also fuzzy at the edge. Text about an event accumulates for months after it happens, so the last few months before the cutoff are thinly covered; the model may know that something happened but little detail. Model cards state the cutoff; assistants are often trained to mention it when asked about recent events, with varying reliability.\n\nThe cutoff is not a context limit and not a bug: it is simply when the reading stopped. The remedy is the same as the previous lesson's: supply current information in the prompt or through tools.",
    why:
      "Users assume a system that speaks fluently about the world is up to date, and the model's confident tone reinforces it. Engineers need to know the cutoff to judge which questions the model can answer from memory (stable facts well before the cutoff), which it will answer wrongly (anything that changed since), and which it will answer thinly (events just before the cutoff). Knowing it also shapes product copy: stating the cutoff to users prevents a class of complaints.",
    how: [
      "Read the model card for the stated cutoff date.",
      "Classify your questions: stable (unchanged for years), volatile (changes often), recent (near or after the cutoff).",
      "Answer stable questions from the model if accuracy requirements allow; supply current data for volatile and recent ones.",
      "Tell the model today's date and, where relevant, that its knowledge may be out of date.",
      "Re-evaluate when you switch models: a newer cutoff changes which facts are safe.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Long before the cutoff", detail: "well covered: 'When was the Eiffel Tower built?' → reliable" },
        { label: "Months before the cutoff", detail: "thinly covered: knows it happened, few details" },
        { label: "After the cutoff", detail: "absent: 'What is the latest version of X?' → stale answer, stated confidently" },
        { label: "Fix", detail: "supply the current fact in the prompt or via a tool" },
      ],
      caption: "Reliability falls toward the cutoff and drops to nothing beyond it.",
    },
    everyday: {
      title: "An encyclopaedia printed in a particular year",
      text: "A 2019 encyclopaedia is excellent on Roman history and useless on anything from 2020. It does not warn you; the entry for 'current prime minister' simply states the 2019 answer as fact. You check the print date on the spine before trusting a time-sensitive entry. The knowledge cutoff is the print date, and the model does not have it on its spine; you must know it.",
    },
    engineering: {
      title: "Code that compiled two years ago",
      text: "A developer tool generated code for a web framework using an API that had been renamed after the model's cutoff; every snippet failed to compile. Users blamed the tool. The fix was to detect the framework version in the user's project and inject the relevant section of the current documentation into the prompt, with an instruction to follow it over memory. Compile failures from stale APIs fell by 90%. The model's general skill with the framework was still valuable; only its version knowledge was stale.",
    },
    maths: {
      formula: "P(correct | stable fact) high;   P(correct | changed since cutoff) ≈ 0 without context;   coverage(t) rises for months after an event, so coverage(cutoff − ε) is low",
      meaning: "Reliability depends on the fact's age relative to the cutoff and on how much text accumulated about it before training.",
      worked: [
        "A benchmark of 200 'latest version' questions on a model with a six-month-old cutoff: 38% correct from memory; 97% when the current version was stated in the prompt.",
        "Questions about events in the final month before the cutoff: 55% correct in detail, versus 91% for events a year earlier, consistent with thin late coverage.",
      ],
      note: "Illustrative figures; the pattern, not the exact numbers, is what to expect.",
    },
    code: {
      title: "Injecting current facts for a known-volatile topic",
      lang: "ts",
      src: `const MODEL_CUTOFF = "2025-03";                      // from the model card; update when the model changes
const volatile = /latest|current|newest|this year|price|version/i.test(question);

let context = "Today's date is " + today + ". Your training data ends around " + MODEL_CUTOFF + ".";
if (volatile) {
  const facts = await currentFacts(question);          // docs, release notes, a search, a database
  context += "\\nCurrent information (prefer this over memory):\\n" + facts;
}

const reply = await ask({ system: context, messages: [{ role: "user", content: question }] });`,
      lines: [
        { code: "const MODEL_CUTOFF = \"2025-03\";                      // from the model card; update when the model changes", say: "The cutoff is a fact about the model you must carry in configuration." },
        { code: "const volatile = /latest|current|newest|this year|price|version/i.test(question);", say: "A cheap guess at which questions need fresh facts; a classifier or always-on retrieval is the stronger version." },
        { code: "context += \"\\nCurrent information (prefer this over memory):\\n\" + facts;", say: "Supplied facts, labelled as current, with an instruction to prefer them." },
      ],
    },
    useIt: "Know your model's cutoff, state the date in the prompt, route volatile questions through retrieval or tools, inject current docs for versioned APIs, and tell users what the assistant can and cannot know. Re-check all of this when you change models.",
    takeaways: ["The cutoff is when training text stopped; nothing after it is known.", "Coverage is thin for the months just before the cutoff.", "The model will state stale facts confidently.", "Supply current information; tell the model the date."],
    terms: [["knowledge cutoff", "the date after which a model's training data contains nothing"], ["volatile fact", "a fact that changes often and should not be answered from memory"]],
    reflect: { q: "Why might a model know that a major election happened but get the result wrong, when the election was a month before its cutoff?", a: "Little text about the result had accumulated by the cutoff, so the model saw the event discussed in anticipation far more than in retrospect, and its strongest patterns are the pre-result ones." },
  },

  "m19-context-window-limitations": {
    simple: "The context window bounds what the model can see in one call, and within it, attention is not uniform: long prompts cost more, and information buried in the middle is used less reliably.",
    concept:
      "Module 17 defined the **context window**; this lesson is about how it limits behaviour. First, the hard limit: anything beyond the window is simply not seen, and if the serving layer truncates rather than rejects, the model answers from a partial prompt without knowing it. Second, the soft limits inside the window. Attention spreads over more tokens as the prompt grows, so each token's influence is diluted; studies show that facts placed in the middle of a very long prompt are recalled less reliably than facts at the start or end. Reasoning over many scattered pieces degrades faster than recall of a single fact. And cost and latency grow with length, so a long window used fully is slow and expensive.\n\nThird, the window is per call. Nothing persists; a conversation that exceeds the window loses its beginning unless the system summarises or stores it.\n\nLong windows (hundreds of thousands of tokens) are real and useful for reading whole documents, but 'it fits' is not the same as 'it is used well'. Retrieval that puts the few relevant passages near the question usually beats stuffing the window.",
    why:
      "Teams see a large window and assume the problem of context is solved: paste everything in. The results disappoint in three ways: answers that ignore a passage that was there, bills that scale with the whole corpus per question, and latency of many seconds. Understanding the soft limits explains those results and leads to the practices that work: select, order, and summarise rather than stuff.",
    how: [
      "Count tokens; know the hard limit and leave room for the answer.",
      "Select what goes in: retrieve relevant passages rather than whole documents.",
      "Order for attention: put the most important material at the start or just before the question; avoid burying it.",
      "For long conversations, keep recent turns verbatim and summarise older ones.",
      "Measure: test recall of planted facts at different positions and lengths for your model and task.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Position of the needed fact", "Recall in a 4k prompt", "Recall in a 100k prompt", "Lesson"],
        rows: [
          ["start", "98%", "92%", "beginnings are seen well"],
          ["middle", "96%", "70%", "the middle of a long prompt is weakest"],
          ["end (near the question)", "99%", "96%", "put the key passage close to the question"],
        ],
      },
      caption: "Illustrative 'needle in a haystack' pattern. The exact numbers vary by model; the shape is consistent.",
    },
    everyday: {
      title: "A desk piled high",
      text: "You can read any sheet on your desk, but when the pile is a thousand pages the one you need in the middle is easy to miss, and the whole pile takes all day to go through. A good assistant hands you the three relevant pages and puts the crucial one on top. The window is the desk; retrieval is the assistant.",
    },
    engineering: {
      title: "Stuffing the window cost more and answered worse",
      text: "A legal team put entire 300-page contracts into a 200k-token window and asked clause-specific questions. Accuracy on their test set was 71%, latency 25 seconds, cost high. Switching to retrieving the ten most relevant clauses (about 4k tokens) placed just before the question raised accuracy to 89%, latency to 3 seconds, and cut cost by 95%. For questions needing the whole document (a global consistency check) they still use the full window, but as the exception.",
    },
    maths: {
      formula: "cost ∝ n;   attention per token ∝ 1/n (diluted);   prompt-pass FLOPs ∝ n²",
      meaning: "Linear cost in tokens, diluted attention per token, and quadratic compute in the prompt pass.",
      worked: [
        "A 200k-token prompt at 3 units per million input tokens: 0.6 units per question; 1,000 questions a day: 600 units. The 4k retrieval version: 0.012 per question, 12 per day.",
        "Prompt-pass attention compute scales as n²: 200k versus 4k is (50)² = 2,500 times more attention work, which is why latency went from 3 to 25 seconds even with optimised kernels.",
        "If recall of a middle fact is 70% and an answer needs three such facts: 0.7³ ≈ 0.34 chance all three are used. With retrieval placing them near the question at 96%: 0.96³ ≈ 0.88.",
      ],
    },
    code: {
      title: "Testing your own model's recall by position",
      lang: "py",
      src: `# A needle-in-a-haystack probe: plant a fact at a position, ask for it, measure recall
import random

def probe(ask, filler_tokens, position_fraction, trials=20):
    hits = 0
    for _ in range(trials):
        code = str(random.randint(100000, 999999))
        needle = "The confirmation code is " + code + "."
        filler = make_filler(filler_tokens)                 # unrelated text of the given length
        cut = int(len(filler) * position_fraction)
        prompt = filler[:cut] + " " + needle + " " + filler[cut:] + "\\n\\nWhat is the confirmation code?"
        hits += code in ask(prompt)
    return hits / trials

for n in (4000, 32000, 100000):
    print(n, [round(probe(ask, n, f), 2) for f in (0.0, 0.5, 1.0)])   # start, middle, end`,
      lines: [
        { code: "cut = int(len(filler) * position_fraction)", say: "Plant the fact at the start, the middle or the end of the filler." },
        { code: "hits += code in ask(prompt)", say: "Did the model's answer contain the planted code? Recall is the hit rate." },
        { code: "print(n, [round(probe(ask, n, f), 2) for f in (0.0, 0.5, 1.0)])   # start, middle, end", say: "Three positions at three lengths: your model's own version of the table above." },
      ],
    },
    useIt: "Treat the window as a budget and a reliability gradient: retrieve rather than stuff, place key material near the question, summarise old conversation, and run a position-recall probe on any model you adopt for long-document work. Module 28 builds the retrieval pipeline.",
    takeaways: ["Beyond the window nothing is seen; truncation is silent.", "Within it, attention dilutes and middle positions are weakest; cost grows linearly, prompt compute quadratically.", "Retrieval plus good ordering beats stuffing.", "Measure recall by position for your model."],
    terms: [["needle in a haystack", "a test that plants a fact in filler text and checks whether the model can retrieve it"], ["attention dilution", "each token's influence falling as the prompt grows"]],
    reflect: { q: "A million-token window is announced. Does that make retrieval obsolete?", a: "No. Cost still scales with tokens, latency with the square of the prompt, and recall still degrades in the middle; retrieval chooses the few thousand tokens that matter. The big window helps for whole-document tasks, not for every question." },
  },

  "m19-prompt-sensitivity": {
    simple: "Small changes in wording, order or formatting of a prompt can change the model's answer noticeably, because the model continues the exact token sequence it is given, not the intent behind it.",
    concept:
      "**Prompt sensitivity** is the observation that two prompts a person would call equivalent can produce different outputs: 'List the risks' versus 'What are the risks?', a bullet list versus a paragraph of context, the examples in a different order, an extra blank line. The model does not see intent; it sees tokens, and every token shifts the next-token distribution a little. Sometimes the shift is harmless; sometimes it flips a classification or changes the format of an extraction.\n\nSensitivity is highest where the model's distribution is already spread: ambiguous tasks, borderline cases, weakly known facts. It is lower for clear tasks with strong instructions and examples. It also interacts with sampling: at temperature 0 the same prompt gives the same answer, but a one-word change can still flip it.\n\nThe practical consequence is that prompts are code: they need versioning, tests and change control. A prompt that worked on ten examples may fail on the eleventh, and an edit that improves tone can silently break accuracy. Module 26 covers prompt engineering and testing in full.",
    why:
      "Developers coming from conventional software expect that equivalent inputs give equivalent outputs; models break that expectation, and the breakage is invisible until measured. Knowing that prompts are sensitive explains flaky behaviour, motivates evaluation suites, and sets the discipline of changing one thing at a time and measuring. It also explains why published prompt tricks are unreliable: what helped one model on one task may hurt another.",
    how: [
      "Hold the prompt fixed and version it like source code.",
      "Build an evaluation set of inputs with expected outputs (Module 37).",
      "When editing, change one element, run the set, compare.",
      "Reduce sensitivity with clear structure: explicit instructions, delimited inputs, a few consistent examples, a fixed output format.",
      "Prefer structured outputs with validation so format drift is caught.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Prompt variant", "Classification accuracy on 500 tickets", "Note"],
        rows: [
          ["'Classify this ticket: {text}'", "81%", "baseline"],
          ["'Classify this ticket into one of: billing, delivery, damage, other. Ticket: {text}'", "88%", "labels made explicit"],
          ["… plus three examples", "92%", "examples anchor the format and the borderline cases"],
          ["… examples in a different order", "90%", "order matters; the last example is weighted most"],
          ["… with 'Be concise.' appended", "89%", "an unrelated instruction still moved the number"],
        ],
      },
      caption: "Illustrative. Each row is a small edit; none is neutral.",
    },
    everyday: {
      title: "Asking a question two ways",
      text: "Ask a colleague 'any problems with the report?' and you get 'no, it's fine'. Ask 'what would you change in the report?' and you get three suggestions. Same person, same report, different framing, different answer. People are prompt-sensitive too; models are more so, and less able to ask what you meant.",
    },
    engineering: {
      title: "The tone edit that broke extraction",
      text: "A product manager added 'Respond warmly and conversationally' to a shared system prompt used by both a chat feature and an invoice extractor. The extractor began wrapping its JSON in friendly sentences, and the parser failed on 15% of invoices overnight. The team split the prompts, put the extractor's under test with 200 fixed invoices, and made prompt changes go through the same review as code. Prompt sensitivity turned a copy edit into an outage.",
    },
    maths: {
      formula: "Δp = p(answer | prompt′) − p(answer | prompt);   sensitivity ≈ |Δp| averaged over an evaluation set",
      meaning: "Measure how much the probability of the desired answer moves when the prompt changes, across many inputs.",
      worked: [
        "An extraction task scored on 200 documents: prompt A 94% field accuracy; prompt A with one sentence reordered 91%; with a format example added 97%. The spread of six points from edits a reader would call cosmetic is typical.",
        "At temperature 0.7, the same prompt repeated ten times on a borderline ticket gave the same label 7 times; at temperature 0, 10 times. Sensitivity to wording remained: a synonym in the instruction flipped the temperature-0 label.",
      ],
      note: "Illustrative numbers; measure your own.",
    },
    code: {
      title: "Prompts under version control and test",
      lang: "ts",
      src: `// prompts/extract-invoice.v3.ts
export const EXTRACT_INVOICE = {
  version: "v3",
  system: [
    "You extract fields from invoices.",
    "Return only a JSON object with keys: vendor, date (YYYY-MM-DD), total (number), currency (ISO code).",
    "If a field is missing, use null. Do not add any text outside the JSON.",
  ].join("\\n"),
  examples: [
    { input: "ACME Ltd … Total due £240.00 … 5 Nov 2026", output: { vendor: "ACME Ltd", date: "2026-11-05", total: 240, currency: "GBP" } },
  ],
};

// prompts/extract-invoice.test.ts
test("v3 keeps field accuracy on the fixed set", async () => {
  const results = await runOn(FIXED_INVOICES, EXTRACT_INVOICE);     // 200 invoices with known fields
  expect(accuracy(results)).toBeGreaterThanOrEqual(0.95);
});`,
      lines: [
        { code: "version: \"v3\",", say: "Prompts carry versions; a change is a new version, reviewed and tested." },
        { code: "\"If a field is missing, use null. Do not add any text outside the JSON.\",", say: "Explicit format rules reduce sensitivity to incidental wording elsewhere." },
        { code: "expect(accuracy(results)).toBeGreaterThanOrEqual(0.95);", say: "A fixed evaluation set turns sensitivity from a surprise into a measured number." },
      ],
    },
    useIt: "Treat prompts as code: version, test, review, change one thing at a time; use explicit structure and examples; validate outputs; and never share one prompt across features with different requirements. Module 26 turns this into a method.",
    takeaways: ["Equivalent-looking prompts can give different answers; the model sees tokens, not intent.", "Sensitivity is highest on ambiguous inputs and weak knowledge.", "Reduce it with explicit instructions, delimiters, examples and fixed formats.", "Version and test prompts like source code."],
    terms: [["prompt sensitivity", "the variation in output caused by small changes in the prompt"], ["evaluation set", "a fixed collection of inputs with expected outputs used to measure changes"]],
    reflect: { q: "Why might adding a positive example for one category lower accuracy on another?", a: "The example shifts the model's expectations toward that category's pattern; borderline inputs from other categories now look more like it. Balanced examples across categories prevent the tilt." },
  },

  "m19-non-deterministic-outputs": {
    simple: "The same prompt can produce different outputs because sampling is random, server batching changes rounding, and providers update models; you can reduce variation but should design for it.",
    concept:
      "**Non-determinism** in LLM outputs has three sources. The first and largest is sampling (Module 18): at any temperature above zero, token choice is a random draw. The second is numerical: on servers that batch many requests together, the order of floating-point operations can differ between runs, and a near-tie between two tokens can flip even at temperature 0. The third is drift: hosted models are updated, system prompts evolve, and the version behind a name may change.\n\nThe practical picture: with temperature 0 and a pinned model version, outputs are usually identical and occasionally differ on borderline tokens; with sampling, they differ routinely. Both are normal.\n\nNon-determinism matters most where software expects repeatability: tests, caches, audits, and any workflow that compares outputs across time. Design for it: use temperature 0 where correctness is defined, validate structure rather than exact text, run flaky checks several times, pin model versions, and log the settings and version with every output.",
    why:
      "Conventional tests assert exact equality and fail on a single changed character, so teams either disable them or chase phantom failures. Caches keyed on input assume identical output. Audits ask 'why did it say this last month?' and cannot re-run the moment. Understanding the sources of variation lets teams pick the right tool for each: determinism settings for repeatability, property-based checks instead of exact-match tests, and logging instead of re-running.",
    how: [
      "Decide per feature whether determinism matters (extraction, classification: yes; prose: no).",
      "Set temperature 0 and pin the model version where it matters; expect rare numerical flips even then.",
      "Write tests that check properties (valid JSON, required fields, a label in the allowed set, a cited source exists) rather than exact strings.",
      "For sampled features, run tests several times and require all runs to pass, or use a judge with a rubric.",
      "Log model version, prompt version, settings and the output for every call so past behaviour can be explained without re-running.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Source", "Effect", "Control"],
        rows: [
          ["sampling (temperature > 0)", "routine variation in wording and sometimes content", "temperature 0 where correctness is defined"],
          ["batched floating point", "rare flips on near-tied tokens, even at temperature 0", "accept; validate properties, not exact text"],
          ["model or prompt updates", "systematic change over time", "pin versions; re-run evaluations on change"],
          ["context differences", "different retrieved passages or dates", "log inputs; make retrieval deterministic for tests"],
        ],
      },
      caption: "Four sources, four responses. Only the first is fully under your control.",
    },
    everyday: {
      title: "Asking the same expert twice",
      text: "Ask a doctor the same question on two days and you get the same diagnosis in different words, and occasionally a different emphasis. You would not call the doctor broken; you would check the substance, not the phrasing. Testing an LLM by exact text match is like faulting the doctor for choosing a synonym.",
    },
    engineering: {
      title: "A test suite that failed on Mondays",
      text: "A team's integration tests compared model output to saved strings and failed intermittently, more after the provider's weekly deployment. Investigation found three causes: sampling at temperature 0.3 in the classifier (fixed: temperature 0), a model alias that resolved to a new version after each deployment (fixed: pinned version), and a date in the prompt. They rewrote the assertions to check the label set, JSON validity and required fields, and kept exact-string checks only for the deterministic classifier. Flakiness fell from 8% of runs to under 0.2%.",
    },
    maths: {
      formula: "P(identical outputs over k runs) = ∏ over tokens of P(same choice);   at T = 0 ≈ 1 − (number of near-ties × flip rate)",
      meaning: "With sampling, identical long outputs are vanishingly unlikely; at temperature 0, variation comes only from near-ties and is rare.",
      worked: [
        "A 100-token answer at temperature 0.7 where each token's top choice has average probability 0.85: P(all 100 identical to a reference run) ≈ 0.85¹⁰⁰ ≈ 10⁻⁷. Exact-match tests are hopeless.",
        "At temperature 0 with one near-tie (gap under 0.01 logits) per 500 tokens and a flip rate of 20% on near-ties: a 100-token answer differs with probability ≈ 100/500 × 0.2 = 4%. Rare, but not zero.",
        "Running a sampled check three times and requiring all three to pass turns a 90%-reliable property into a test that fails 27% of the time: use a judge or reduce temperature instead.",
      ],
    },
    code: {
      title: "Property-based assertions and full logging",
      lang: "ts",
      src: `const LABELS = new Set(["billing", "delivery", "damage", "other"]);

async function classify(ticket: string) {
  const reply = await client.messages.create({
    model: "claude-sonnet-5-5",              // pin a specific version where repeatability matters
    temperature: 0,                              // deterministic choice
    max_tokens: 10,
    system: PROMPT.system,                       // versioned prompt
    messages: [{ role: "user", content: ticket }],
  });
  const label = (reply.content[0].type === "text" ? reply.content[0].text : "").trim().toLowerCase();
  log({ promptVersion: PROMPT.version, model: reply.model, temperature: 0, input: ticket, output: label, usage: reply.usage });
  return label;
}

test("labels are always from the allowed set", async () => {
  for (const t of SAMPLE_TICKETS) expect(LABELS.has(await classify(t))).toBe(true);   // a property, not an exact string
});`,
      lines: [
        { code: "temperature: 0,                              // deterministic choice", say: "Removes sampling as a source of variation; numerical flips on near-ties remain possible." },
        { code: "log({ promptVersion: PROMPT.version, model: reply.model, temperature: 0, input: ticket, output: label, usage: reply.usage });", say: "Everything needed to explain a past output without re-running it." },
        { code: "for (const t of SAMPLE_TICKETS) expect(LABELS.has(await classify(t))).toBe(true);   // a property, not an exact string", say: "The assertion survives synonyms and rewordings; it fails only on a real defect." },
      ],
    },
    useIt: "Set determinism where correctness is defined, test properties instead of strings, repeat or judge sampled outputs, pin versions, and log settings with outputs. Module 37 and Module 41 extend this to evaluation and monitoring.",
    takeaways: ["Variation comes from sampling, batched numerics and model updates.", "Temperature 0 plus a pinned version gives near-determinism; rare flips remain.", "Test properties, not exact text; log everything needed to explain the past.", "Design workflows that tolerate wording changes."],
    terms: [["non-determinism", "the same input producing different outputs across runs"], ["property-based test", "a check that an output satisfies a rule rather than matching a fixed string"]],
    reflect: { q: "A cache keyed on the exact prompt returns a stored answer; is that safe for a sampled feature?", a: "It is consistent, which may be fine, but it silently removes the variety the feature was configured for, and it will not reflect model updates. Decide deliberately: cache deterministic features; for sampled ones, cache only if repeat answers are acceptable." },
  },

  "m19-bias-in-language-models": {
    simple: "Models learn the patterns of their training text, including its stereotypes and imbalances, and reproduce them in outputs; bias is measurable, partly reducible, and a design responsibility.",
    concept:
      "**Bias** in a language model is any systematic tendency in its outputs that treats groups, topics or viewpoints unevenly in ways that are unwarranted by the task. It enters through the training data: text written by people reflects their societies, including stereotypes about gender, ethnicity, religion, age, nationality and class; some groups and languages are heavily over-represented and others nearly absent; and the loudest voices online are not a fair sample of anyone. Pretraining compresses all of it.\n\nBias shows up as associations (an occupation paired with one gender more than the data of the real world warrants), as uneven quality (better answers about some countries than others), as default assumptions (an unnamed 'user' given a particular profile), and as skewed judgements in tasks like scoring CVs or moderating comments. Alignment training reduces the most visible forms, but subtle statistical bias persists and can be amplified when a model's outputs are used to make decisions at scale.\n\nMeasuring bias is possible (paired prompts differing only in a group attribute; evaluation sets across languages and demographics) and is the starting point of managing it.",
    why:
      "A model used to screen applicants, triage patients, moderate speech or draft communications makes thousands of decisions a day; a small systematic tilt becomes a large aggregate harm and often a legal liability. Engineers who assume the model is neutral will not look; engineers who know bias is inherited from data will measure it, constrain the tasks the model is used for, and keep people in the loop for consequential decisions. Bias is also a quality issue: a model that performs worse for some users is a worse product.",
    how: [
      "Identify decisions the model influences and the groups that could be affected.",
      "Build paired or stratified evaluation sets: same input with a group attribute varied; inputs across languages and regions.",
      "Measure differences in outputs, scores or error rates between groups.",
      "Mitigate: constrain the task (score against explicit criteria, not free judgement), remove irrelevant attributes from inputs, add instructions and examples, use a human decision for consequential outcomes.",
      "Re-measure after changes and on every model update; publish what you measured.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Where bias enters", "How it shows", "A measurement"],
        rows: [
          ["training text stereotypes", "'the nurse… she', 'the engineer… he'", "pronoun completion rates for occupations"],
          ["data imbalance across languages", "worse answers in low-resource languages", "accuracy by language on the same questions"],
          ["imbalanced examples in fine-tuning", "one tone or viewpoint treated as default", "paired prompts differing only in viewpoint"],
          ["downstream use", "CV scores differ by name", "identical CVs with names from different groups"],
        ],
      },
      caption: "Bias is inherited and then amplified by how the model is used. Each row has a test.",
    },
    everyday: {
      title: "Learning the world from one newspaper",
      text: "Someone who learned everything from a single newspaper's archive would hold that paper's assumptions without knowing they were assumptions. They would speak fluently and sincerely, and some of what they said would be lopsided. A model learned from a vast but still skewed archive. The remedy is not to pretend the skew is absent but to test for it where it matters.",
    },
    engineering: {
      title: "The CV screener that preferred one name",
      text: "A recruiting tool used a model to rank CVs. An audit sent identical CVs with different names and found a consistent gap in scores between name groups. The team stopped using free-form ranking. They now have the model extract specific, job-relevant facts (years of experience with named tools, certifications) into structured fields; the ranking is done by explicit rules on those fields; names and photos are removed before the model sees the CV; and a recruiter reviews every shortlist. The audit is re-run monthly and on every model change.",
    },
    maths: {
      formula: "bias gap = mean(score | group A) − mean(score | group B) on paired inputs;   disparate error = error_rate(A) − error_rate(B)",
      meaning: "Compare outputs or error rates across groups on inputs that differ only in the group attribute.",
      worked: [
        "500 paired CVs, identical except the name: mean score 7.1 for group A, 6.6 for group B; gap 0.5 on a 10-point scale with a standard error of 0.08: a real, measurable tilt.",
        "After moving to structured extraction with names removed: 6.9 versus 6.9; gap 0.0 ± 0.08.",
        "Accuracy of a support classifier: 93% on English tickets, 81% on Punjabi tickets, a 12-point disparity that is a product defect as well as a fairness issue.",
      ],
      note: "Illustrative; the point is that bias is a number you can compute and track.",
    },
    code: {
      title: "A paired-prompt bias probe",
      lang: "py",
      src: `# Vary only the group attribute; compare the model's numeric scores
import statistics

base_cv = open("cv_template.txt").read()          # contains the placeholder {NAME}
groups = {"A": ["Amelia Clarke", "Oliver Hughes"], "B": ["Gurpreet Kaur", "Amandeep Singh"]}

def score(cv_text):
    reply = ask("Score this CV from 1 to 10 for the data analyst role. Reply with the number only.\\n\\n" + cv_text, temperature=0)
    return float(reply.strip())

results = {g: [score(base_cv.replace("{NAME}", n)) for n in names for _ in range(25)] for g, names in groups.items()}
for g, s in results.items():
    print(g, round(statistics.mean(s), 2))
print("gap:", round(statistics.mean(results["A"]) - statistics.mean(results["B"]), 2))`,
      lines: [
        { code: "base_cv = open(\"cv_template.txt\").read()          # contains the placeholder {NAME}", say: "Everything identical except the attribute under test." },
        { code: "results = {g: [score(base_cv.replace(\"{NAME}\", n)) for n in names for _ in range(25)] for g, names in groups.items()}", say: "Repeated scoring per name gives a mean per group." },
        { code: "print(\"gap:\", round(statistics.mean(results[\"A\"]) - statistics.mean(results[\"B\"]), 2))", say: "The number to track. Zero is the goal; a non-zero gap means the task design must change." },
      ],
    },
    useIt: "Before using a model in any decision that affects people, measure group differences with paired and stratified tests; prefer structured, criteria-based tasks over free judgement; strip irrelevant attributes; keep humans responsible for consequential outcomes; re-test on every change. Stage 9 returns to the language dimension of this.",
    takeaways: ["Bias is inherited from training text and can be amplified in use.", "It appears as skewed associations, uneven quality across groups and languages, and skewed judgements.", "It is measurable with paired and stratified evaluations.", "Mitigate by constraining the task, removing irrelevant attributes, and keeping people in the loop."],
    terms: [["bias (model)", "systematic unevenness in outputs across groups or topics not warranted by the task"], ["paired prompts", "inputs identical except for one attribute, used to measure bias"]],
    reflect: { q: "Why is 'remove the name from the CV' not enough on its own?", a: "Other features correlate with group membership (addresses, schools, language style, gaps for caregiving), and the model can pick them up. Structured, criteria-based extraction plus human review addresses the proxies that name removal misses." },
  },

  "m19-multilingual-performance-limitations": {
    simple: "Models are strongest in the languages that dominate their training data, usually English; in others they are slower, costlier, less accurate and more prone to errors, with the gap widest for low-resource languages.",
    concept:
      "Training corpora are dominated by English (often more than half of all tokens), with a long tail of other languages, some with a tiny share. The consequences compound. The tokeniser (Module 12), built mostly on English, splits other scripts into many fragments, so the same sentence costs more tokens and the model has fewer, weaker units to reason with. Less training text means weaker knowledge and grammar for that language. Alignment data is often English-first, so instruction following and safety behaviour are less consistent elsewhere. And evaluation benchmarks are mostly English, so the gaps are under-measured.\n\n**Low-resource languages**, those with little digital text, are affected most: Punjabi, for example, is spoken by over a hundred million people but has far less online text than its speaker count suggests, and it is written in two scripts plus romanised forms, which splits the data further. Models may understand such a language reasonably while writing it awkwardly, translate into it with errors, and switch to English unprompted.\n\nThe limits are measurable and improving with multilingual tokenisers and data, but any multilingual product must test per language rather than assume parity. Stage 9 addresses this in depth.",
    why:
      "Products ship globally, and teams who test only in English discover the gaps from users: wrong answers, broken formatting, English replies to non-English questions, and bills several times higher per conversation. Understanding the mechanism (tokeniser, data share, alignment coverage) explains why a model that is excellent in English can be mediocre in another language and tells teams what to measure and which models to prefer for which languages.",
    how: [
      "Measure tokens per word for each target language with the candidate model's tokeniser.",
      "Build an evaluation set per language, translated by native speakers, with the same tasks across languages.",
      "Compare accuracy, format compliance, language consistency (does it reply in the right language?) and cost per conversation.",
      "Prefer models with multilingual vocabularies and training for the languages you serve; consider translation pipelines or fine-tuning for the weakest.",
      "Monitor per-language metrics in production; gaps shift with model updates.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Language", "Share of training text (typical)", "Tokens per word", "Task accuracy (same questions)", "Cost per conversation"],
        rows: [
          ["English", "50–60%", "1.3", "91%", "1.0×"],
          ["Spanish", "4–5%", "1.6", "87%", "1.3×"],
          ["Hindi", "<1%", "3–4", "76%", "2.8×"],
          ["Punjabi (Gurmukhi)", "≪1%", "4–6", "64%", "4.2×"],
        ],
      },
      caption: "Illustrative pattern. Less data, more tokens, lower accuracy, higher cost, all at once.",
    },
    everyday: {
      title: "Someone fluent in one language and conversational in others",
      text: "A colleague is a brilliant writer in English, decent in Spanish, and can get by in Hindi with effort and mistakes. Given the same task in each, the English version is polished in minutes; the Hindi version takes longer, costs more effort, and needs checking. The model is that colleague, and the difference is how much it has read in each language.",
    },
    engineering: {
      title: "The assistant that answered Punjabi questions in English",
      text: "A public-services assistant was launched in English and Punjabi. In Punjabi it often replied in English, misread Gurmukhi numerals, and cost four times more per conversation. The team added a language-detection step, an explicit instruction to reply in the user's language and script, few-shot examples in Gurmukhi, and switched to a model with a multilingual tokeniser that cut tokens per word from five to two. Reply-language accuracy went from 71% to 98% and cost halved. They now track every metric per language.",
    },
    maths: {
      formula: "cost_lang ≈ tokens_per_word_lang / tokens_per_word_en × cost_en;   accuracy_lang falls with log(data share)",
      meaning: "Cost scales with tokenisation efficiency; accuracy tracks, roughly, the logarithm of how much training text the language had.",
      worked: [
        "English 1.3 tokens per word, Punjabi 5.2 with an English-centred tokeniser: 4.0× the tokens for the same content; a 60-token English reply becomes 240 tokens.",
        "With a multilingual tokeniser at 2.0 tokens per word: 1.5×; a 60-token reply becomes 92 tokens. The tokeniser alone changes cost by a factor of 2.6.",
        "A 2,000-token context holds about 1,500 English words or, at 5.2 tokens per word, about 385 Punjabi words: a quarter of the usable context.",
      ],
    },
    code: {
      title: "Per-language evaluation and language-consistency check",
      lang: "py",
      src: `# Same questions in several languages; measure accuracy and whether the reply is in the right language
from collections import defaultdict

results = defaultdict(lambda: {"n": 0, "correct": 0, "right_language": 0, "tokens": 0})

for case in eval_set:                         # each case: language, question, expected answer
    reply, usage = ask(case.question, system="Reply in the same language and script as the question.")
    r = results[case.language]
    r["n"] += 1
    r["correct"] += judge(reply, case.expected)                 # rubric-based check
    r["right_language"] += detect_language(reply) == case.language
    r["tokens"] += usage.input_tokens + usage.output_tokens

for lang, r in results.items():
    print(lang, f"acc={r['correct']/r['n']:.2f} lang_ok={r['right_language']/r['n']:.2f} tokens/case={r['tokens']/r['n']:.0f}")`,
      lines: [
        { code: "for case in eval_set:                         # each case: language, question, expected answer", say: "The same tasks across languages: the only way to see the gap." },
        { code: "r[\"right_language\"] += detect_language(reply) == case.language", say: "Replying in English to a Punjabi question is a failure that accuracy alone would miss." },
        { code: "r[\"tokens\"] += usage.input_tokens + usage.output_tokens", say: "Cost per case per language, the third number to track." },
      ],
    },
    useIt: "For any language beyond English: measure tokens per word, accuracy, reply-language consistency and cost per language; choose models with multilingual vocabularies; add explicit language instructions and in-language examples; and plan for fine-tuning or translation where gaps remain. Stage 9 builds a full Punjabi system on these foundations.",
    takeaways: ["Performance tracks training-data share; English dominates.", "Tokenisation inefficiency multiplies cost and shrinks usable context for other languages.", "Low-resource languages suffer most, including script and romanisation splits.", "Test and monitor per language; choose multilingual-first models."],
    terms: [["low-resource language", "a language with little available digital text for training"], ["language consistency", "whether the model replies in the language and script of the question"]],
    reflect: { q: "A model scores 90% on an English benchmark. What does that tell you about its Punjabi performance?", a: "Almost nothing; the gap can be 20 to 30 points and the tokeniser may make it four times more expensive. Only a Punjabi evaluation set answers the question." },
  },

  "m19-why-llms-can-produce-incorrect-answers-confidently": {
    simple: "Confidence in an LLM's output is a property of its language, not its knowledge: fluency is learned from all text, truth only from some, and the model has no reliable internal signal to tell them apart.",
    concept:
      "This lesson gathers the module's threads. An LLM produces **confident incorrect answers** because of four facts that combine. Fluency and facts are learned separately: the model has read enough to write perfect prose about anything, but only partial, blurred facts about most things, so style is always available even when substance is not. The objective never penalised confident guessing: plausible continuations scored well in training whether or not they were true. Decoding always produces a token: a spread distribution still yields an answer, decoded in the same confident register. And alignment rewards helpfulness: unhedged, complete-looking answers were often preferred during preference training, which teaches the model to sound sure.\n\nThe model does have faint signals of its own uncertainty, in the spread of its distribution and in learned habits of hedging, but they are unreliable and invisible to the user by default. So the surface of an answer carries no information about its reliability. That is the single most important thing to design around.\n\nEvery defence in this path follows from it: supply facts rather than ask for them, give tools that can return nothing, require citations to supplied sources, validate outputs in code, read log-probabilities where available, measure accuracy on evaluation sets, and keep people responsible for consequential decisions.",
    why:
      "Users and developers calibrate trust by tone; a hesitant answer invites checking, a confident one does not. An LLM's tone is uniform, so the usual cue is gone, and the failure mode is quiet: wrong answers that nobody checks. Naming the reasons makes the response concrete. Teams that understand it stop asking 'how do we make the model never wrong' and start asking 'how do we make wrong outputs detectable and harmless', which is a solvable engineering problem.",
    how: [
      "Fluency is learned from all training text; facts are learned only where text about them existed, so style outruns substance.",
      "Training rewarded plausibility; nothing rewarded admitting ignorance.",
      "Decoding always selects a token; a flat distribution produces an answer indistinguishable in form from a sharp one.",
      "Alignment favoured helpful, complete answers, reinforcing a confident register.",
      "Result: the output's confidence is uninformative; reliability must be established outside the model.",
    ],
    visual: {
      kind: "flow",
      steps: ["fluency from all text", "facts from some text", "plausibility objective", "a token is always chosen", "helpfulness-tuned register", "confident prose, right or wrong"],
      caption: "Each step is a lesson in this module. Together they make tone a useless signal of truth.",
    },
    everyday: {
      title: "A newsreader reading whatever is on the autocue",
      text: "A professional newsreader delivers every line in the same assured voice, whether it is a verified report or a typo on the autocue. You cannot tell from the delivery which is which; you can only tell by checking the source. The model is the newsreader, its weights are the autocue, and the checking is yours.",
    },
    engineering: {
      title: "Designing a medical-information assistant that cannot be trusted by tone",
      text: "A health-information service built an assistant with the explicit assumption that every answer might be confidently wrong. Each answer must cite a passage from a vetted guideline set retrieved for the question; citations are verified in code; answers without a supporting passage are replaced by a referral; the model is told to state uncertainty and is evaluated on whether it does; dosage numbers are never generated, only quoted from the source; and a clinician reviews a daily sample. Over a year, the measured rate of unsupported medical claims reaching users was zero, not because the model stopped hallucinating but because nothing it hallucinated could get through.",
    },
    maths: {
      formula: "P(wrong | sounds confident) ≈ P(wrong):   tone carries ≈ 0 bits about correctness;   reliability = f(grounding, verification, evaluation), not f(tone)",
      meaning: "Confidence of expression is nearly independent of correctness; reliability must be engineered.",
      worked: [
        "On a set of 1,000 factual questions, a model answered 88% correctly. Among answers rated 'confident' by readers: 89% correct. Among 'hedged' answers: 85% correct. The 4-point difference is far too small to use as a filter: readers would wrongly trust 11% of confident answers.",
        "With retrieval and citation checking, the same questions: 97% correct, and every incorrect answer was flagged as 'not found in sources' rather than stated. Reliability came from the system.",
        "Log-probability as a signal: answers whose key token had probability under 0.4 were wrong 46% of the time versus 6% above 0.4: a weak but real internal signal, usable for routing when exposed.",
      ],
      note: "Illustrative figures; the relationships match what evaluations typically find.",
    },
    code: {
      title: "Reliability as a pipeline, not a prompt",
      lang: "ts",
      src: `async function reliableAnswer(question: string) {
  const sources = await retrieve(question, { limit: 5 });                          // 1. supply facts
  if (sources.length === 0) return refer("No vetted source covers this question.");

  const draft = await ask(groundedPrompt(question, sources), { temperature: 0, logprobs: true });   // 2. deterministic, with confidence
  const check = validateCitations(draft.text, sources);                             // 3. verify in code
  if (!check.ok) return refer("The answer could not be supported by the sources.");

  if (draft.minKeyTokenProb < 0.4) return refer("Low confidence; a specialist will follow up.");   // 4. read the model's own doubt
  if (containsNumbersNotInSources(draft.text, sources)) return refer("Numbers must be quoted, not generated.");

  await sampleForHumanReview(question, draft.text, 0.05);                            // 5. people stay in the loop
  return { answer: draft.text, sources: check.cited };
}`,
      lines: [
        { code: "const sources = await retrieve(question, { limit: 5 });                          // 1. supply facts", say: "Do not ask the model to remember; give it what it should answer from." },
        { code: "const check = validateCitations(draft.text, sources);                             // 3. verify in code", say: "Every claim must point at supplied text; the check is code, not trust." },
        { code: "if (draft.minKeyTokenProb < 0.4) return refer(\"Low confidence; a specialist will follow up.\");   // 4. read the model's own doubt", say: "The one internal signal that exists, used for routing rather than ignored." },
        { code: "await sampleForHumanReview(question, draft.text, 0.05);                            // 5. people stay in the loop", say: "A standing sample keeps measurement honest and catches what the rules miss." },
      ],
    },
    useIt: "Build every LLM feature on the premise that confident wrong answers will occur: ground, use tools, verify, validate, read confidence signals, measure on evaluation sets, and keep humans responsible where it matters. The next stages supply each of those mechanisms in turn.",
    takeaways: ["Fluency is learned from everything; facts from some things; tone reveals nothing.", "Training rewarded plausibility and helpfulness, not admitting ignorance.", "Decoding always yields an answer, in the same register.", "Reliability is engineered outside the model: grounding, verification, evaluation, people."],
    terms: [["register", "the tone and style of language, independent of its content"], ["confident error", "a wrong answer delivered without any marker of doubt"]],
    reflect: { q: "If the model's tone is uninformative, what should a product show the user instead?", a: "Provenance: the sources an answer was drawn from, whether a claim was verified, and an explicit 'not found' when it was not. Users can calibrate trust on evidence; they cannot on prose." },
  },
};

export const M19_QUIZ: Quiz[] = [
  {
    q: "What is the root cause of hallucination?",
    options: ["Low temperature", "The model is trained to produce plausible continuations with no signal that separates known facts from fluent invention", "A small context window", "Bugs in the tokeniser"],
    answer: 1,
    why: ["Temperature changes variety, not truth; greedy decoding still hallucinates.", "Correct. Plausibility is the objective; truth never was.", "The window limits what is seen, not what is invented.", "No."],
    reason: true,
  },
  {
    q: "A model answers 'what is today's date?' with a date from last year. Why?",
    options: ["It is broken", "Its knowledge is frozen at the training cutoff and nothing in the prompt supplied the date", "The context window is full", "Temperature is too high"],
    answer: 1,
    why: ["It is behaving as designed.", "Correct. Real-time information must be put in the prompt or fetched by a tool.", "No.", "No."],
  },
  {
    q: "Where in a very long prompt is a needed fact most likely to be missed?",
    options: ["At the start", "In the middle", "At the end", "Position does not matter"],
    answer: 1,
    why: ["Starts are seen well.", "Correct. Recall of middle positions degrades in long prompts.", "Ends, near the question, are seen best.", "Measured studies show it matters."],
  },
  {
    q: "Adding 'be concise' to a shared prompt changed an extractor's accuracy. What does this illustrate?",
    options: ["Non-determinism", "Prompt sensitivity: the model continues tokens, not intent, so any edit can move outputs", "A knowledge cutoff", "Bias"],
    answer: 1,
    why: ["The change was systematic, not random.", "Correct. Prompts are code: version, test, and do not share across features.", "No.", "No."],
  },
  {
    q: "At temperature 0 with a pinned model, two runs of the same prompt differ in one word. Most likely cause?",
    options: ["Sampling", "A near-tie between tokens flipped by floating-point differences from server batching", "The knowledge cutoff moved", "The tokeniser changed"],
    answer: 1,
    why: ["Temperature 0 removes sampling.", "Correct. Rare numerical flips remain; test properties, not exact strings.", "No.", "Unlikely with a pinned version."],
    reason: true,
  },
  {
    q: "Identical CVs with different names receive different scores. What is the right response?",
    options: ["Add 'be fair' to the prompt", "Measure the gap, remove irrelevant attributes, move to structured criteria-based extraction, and keep a human decision", "Use a bigger model", "Lower the temperature"],
    answer: 1,
    why: ["Instructions do not remove learned associations.", "Correct. Constrain the task and keep people responsible; re-measure on every change.", "Size does not remove bias.", "Determinism does not remove bias."],
  },
  {
    q: "A model costs four times more per conversation in Punjabi than in English. The main cause?",
    options: ["Punjabi answers are longer", "The tokeniser splits Punjabi into many more tokens per word", "The model is slower in Punjabi", "Pricing differs by language"],
    answer: 1,
    why: ["Content is the same.", "Correct. Tokens per word is 4–6 with an English-centred vocabulary; a multilingual tokeniser fixes much of it.", "Speed per token is the same.", "Pricing is per token regardless of language."],
  },
  {
    q: "Why can the confidence of an answer's wording not be used to judge its truth?",
    options: ["Because models are always wrong", "Because fluency is learned from all text and facts only from some; decoding always produces a confident-sounding token", "Because of the context window", "It can; confident answers are reliable"],
    answer: 1,
    why: ["They are often right; the point is that tone does not tell you when.", "Correct. Reliability must come from grounding, verification and evaluation.", "No.", "Measured: tone carries almost no information about correctness."],
  },
];

export const M19_EXERCISES: Exercise[] = [
  {
    title: "Classify the failure",
    kind: "think",
    task: "For each incident, name the limitation from this module and the first defence you would add: (a) the assistant cites a regulation section that does not exist; (b) it quotes a product price from eighteen months ago; (c) it answers a Punjabi question in English; (d) it gives a different label to the same ticket on two days; (e) it ignores a clause on page 180 of a 300-page contract placed whole in the prompt.",
    hints: ["Hallucination, cutoff/real-time, multilingual, non-determinism, context-window limits."],
    solution: "(a) Hallucination: retrieve the regulation text and require citations to supplied passages, verified in code. (b) Knowledge cutoff / real-time information: fetch prices from the live system and forbid prices from memory. (c) Multilingual limitation: detect language, instruct reply-in-same-language, add in-language examples, consider a multilingual-tokeniser model. (d) Non-determinism: temperature 0, pinned version, property-based tests. (e) Context-window limitation (lost in the middle): retrieve relevant clauses and place them near the question.",
  },
  {
    title: "Compound error rate",
    kind: "calculate",
    task: "A report-writing feature produces answers with about 25 factual claims. The per-claim hallucination rate is 2% from memory and 0.3% with retrieval and citation checking. Compute the probability that a report contains at least one false claim in each setting, and the number of flawed reports per 1,000.",
    hints: ["P(at least one) = 1 − (1 − h)^25."],
    solution: "From memory: 1 − 0.98^25 = 1 − 0.603 = 0.397 → about 397 flawed reports per 1,000. With retrieval: 1 − 0.997^25 = 1 − 0.928 = 0.072 → about 72 per 1,000. Grounding cut flawed reports by more than five times; shortening reports to 10 claims would only bring the memory case to 1 − 0.98^10 = 18%.",
  },
  {
    title: "Build a needle-in-a-haystack probe",
    kind: "code",
    task: "Implement the position-recall probe from the context-window lesson against any model you can call: plant a random six-digit code at the start, middle and end of filler text of 2k, 16k and 64k tokens, 20 trials each, and tabulate recall. Then repeat with the needle placed immediately before the question.",
    hints: ["Generate filler from unrelated paragraphs; ensure the code never appears in the filler.", "Use temperature 0 so differences come from position, not sampling."],
    solution: "A typical result shows near-perfect recall at 2k everywhere, a dip for the middle position at 16k and a clear drop at 64k, with the end position and 'just before the question' holding up best. The table is your model's reliability gradient; use it to decide how much context to send and where to put the key passage.",
  },
  {
    title: "Design for confident errors",
    kind: "build",
    task: "Sketch the pipeline for a tax-information assistant that must never present an unsupported figure: list each defence (grounding, tools, verification, confidence signal, validation, human sampling), what it catches, and what the user sees when it triggers.",
    hints: ["Each defence should turn a hallucination into a visible 'not supported' rather than a silent wrong answer."],
    solution: "Retrieve vetted guidance passages (catches memory errors; user sees cited sources). Figures come only from a rates tool or quoted passages (catches invented numbers; user sees the source line). Citation validation in code (catches fake references; user sees 'not covered, speak to an adviser'). Log-probability threshold on key tokens (catches spread distributions; user sees a low-confidence referral). Schema validation for structured parts (catches format drift; request is retried or referred). 5% human review with weekly reporting (catches what rules miss; feeds the evaluation set). The model's tone is never shown as a signal; provenance is.",
  },
];
