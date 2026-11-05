import type { StoryPage, Topic } from "../types";

// AI 2.6: long inputs: summarise, chunk, map-reduce, and when to retrieve instead.

const SETTING = "The same online furniture shop. Nisha wants two new things from the model: a one-paragraph summary of a customer's entire history (some customers have hundreds of messages) before the box answers them, and a weekly summary of all support conversations for the owner. Both inputs are far bigger than anything the chat box has sent so far.";
const CAST = "**Nisha** (support lead) wants the summaries. **Dev** (developer) hits the limits from lesson 1.2 immediately. **Priya** (product manager) wants the weekly summary on Monday morning.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A customer's full history is 400 messages. The weekly transcript pile is 600,000 tokens. The first does not fit comfortably and is answered badly; the second does not fit at all.",
    title: "The history that would not fit",
    text: "Dev tried the obvious thing for Nisha's first request: paste the customer's whole history into the prompt and ask for a summary. For most customers it worked. For the heaviest ones, 400 messages, it took twelve seconds, cost more than a day of normal chat, and the summary missed the one thing Nisha cared about: a complaint from the middle of the history. Facts near the start and the end were summarised; the middle was skimmed.\n\nThe weekly summary was worse. All of last week's conversations are around 600,000 tokens. The context window is 200,000. The request was rejected before the model saw a word.\n\n**This is the problem.** Some inputs are bigger than the window, and inputs that fit are still read worse the longer they get. Dev needs ways to cut a long input down to what the model can read well.",
  },
  {
    stage: "why",
    point: "The window is a hard limit, and even inside it the model pays less attention to the middle of a very long prompt. Long input also costs more and takes longer on every single call.",
    title: "Why long inputs fail twice",
    text: "The first failure is the ceiling from lesson 1.2: input plus output must fit in the context window, or the request is refused.\n\nThe second is quieter. When a prompt is very long, the model's answers lean on what is near the beginning and the end. Facts buried in the middle of 150,000 tokens are used less reliably; researchers call it lost in the middle. A summary of 400 messages that misses the complaint from message 212 is this effect, not a bug in Dev's code.\n\nAnd every token of input is paid for and read before the first output token (lesson 1.2). Sending a whole history to answer 'where is my order' is slow and expensive even when it fits.\n\nSo the goal is never 'fit it in'. It is 'send the part that matters, in a form the model reads well'.",
    jargon: [["lost in the middle", "the observed tendency of models to use facts at the start and end of a very long prompt more than facts in the middle"]],
  },
  {
    stage: "concept",
    point: "Four tools, chosen by the question: trim, split-and-summarise (map-reduce), retrieve the relevant part, or hand the model a tool to look things up. Structure what you do send.",
    title: "Four ways to shrink an input",
    text: "**Trim.** Keep the newest N messages, or the last M tokens. Right for conversation history where recent context matters most (lesson 3.4 adds a running summary of the older part).\n\n**Split and summarise (map-reduce).** Cut the input into chunks that fit comfortably, summarise each chunk (map), then summarise the summaries (reduce). Right for 'summarise all of this': the weekly report, a long document. Costs several calls; parallelisable.\n\n**Retrieve.** Index the material once, then for each question fetch only the pieces that match. Right for 'answer this question from a big corpus': the 40-page policy, the knowledge base, a customer's history when the question is specific. Lesson 3.6 builds it.\n\n**Tools.** Let the model ask for what it needs: 'look up order 4471', 'fetch the last complaint'. Right when the data lives in a system and the question decides which part matters. Lesson 3.1.\n\nWhatever you send, structure it: headings, labelled sections, the most important facts first and last, and the instruction after the data. Structure is how the model finds things in a long prompt.",
    table: {
      head: ["The question sounds like", "Tool", "Calls", "Where taught"],
      rows: [
        ["continue this conversation", "trim + running summary", "1", "3.4 memory"],
        ["summarise all of it", "map-reduce", "chunks + 1", "this lesson"],
        ["answer this from a big corpus", "retrieve the relevant pieces", "1 + a search", "3.6 RAG"],
        ["find the specific record, then answer", "tools", "2+", "3.1 tool calling"],
        ["it fits and it is all relevant", "send it, structured, instruction last", "1", "this lesson"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Map-reduce for the weekly report: split the transcripts into chunks, summarise each in parallel, then summarise the summaries.",
    title: "The weekly summary that fits",
    text: "Six hundred thousand tokens of transcripts become sixty chunks of ten thousand. Each chunk is summarised into two hundred tokens with the same instruction, in parallel. The sixty summaries, twelve thousand tokens, are then summarised once into the paragraph Priya wants. Every call is small and fast; the only slow part is waiting for sixty calls, which run at the same time.",
    visual: {
      kind: "flow",
      steps: [
        { label: "600k tokens", sub: "last week's transcripts", tone: "warn" },
        { label: "Split", sub: "60 chunks × 10k tokens, on conversation boundaries" },
        { label: "Map", sub: "60 parallel calls → 60 summaries of 200 tokens" },
        { label: "Reduce", sub: "1 call over 12k tokens → the weekly paragraph", tone: "ok" },
      ],
      caption: "Nothing is ever sent that does not fit, and the final summary reads a tidy 12k instead of a buried 600k.",
    },
  },
  {
    stage: "implement",
    point: "The map step summarises each chunk with the same instruction; the reduce step summarises the summaries. Chunks split on real boundaries, never mid-conversation.",
    title: "Map-reduce in code",
    text: "Two functions. The chunker splits on conversation boundaries and keeps each chunk under a token budget. The map step asks for a structured mini-summary so the reduce step has consistent material; the reduce step writes the final report. Dev keeps the map output short and specific: themes, counts, notable complaints, with the conversation ids so Nisha can follow up.",
    codes: [
      {
        title: "weeklySummary()",
        lang: "ts",
        src: `function chunkConversations(convs: Conversation[], budgetTokens = 10_000): Conversation[][] {\n  const chunks: Conversation[][] = [[]];\n  let used = 0;\n  for (const c of convs) {\n    const t = estimateTokens(c.text);\n    if (used + t > budgetTokens && chunks[chunks.length - 1].length) { chunks.push([]); used = 0; }\n    chunks[chunks.length - 1].push(c); used += t;\n  }\n  return chunks;\n}\n\nasync function summariseChunk(convs: Conversation[]): Promise<string> {\n  const r = await client.messages.create({\n    model: process.env.MODEL_SUPPORT!, max_tokens: 300, temperature: 0.2,\n    system: "Summarise these support conversations in at most 150 words: main themes, counts per theme, and any complaint that needs follow-up with its conversation id. Facts only.",\n    messages: [{ role: "user", content: convs.map((c) => \`<conversation id="\${c.id}">\\n\${c.text}\\n</conversation>\`).join("\\n") }],\n  });\n  return textOf(r);\n}\n\nexport async function weeklySummary(convs: Conversation[]): Promise<string> {\n  const chunks = chunkConversations(convs);\n  const partials = await Promise.all(chunks.map(summariseChunk));          // map, in parallel\n  const r = await client.messages.create({                                   // reduce\n    model: process.env.MODEL_SUPPORT!, max_tokens: 600, temperature: 0.2,\n    system: "You write the weekly support report for the shop's owner: one paragraph of themes with numbers, then a bullet list of complaints needing follow-up. Use only the summaries provided.",\n    messages: [{ role: "user", content: partials.map((p, i) => \`<summary chunk="\${i + 1}">\\n\${p}\\n</summary>\`).join("\\n") }],\n  });\n  return textOf(r);\n}`,
        lines: [
          { sql: "if (used + t > budgetTokens && chunks[chunks.length - 1].length) { chunks.push([]); used = 0; }", say: "Start a new chunk when the next conversation would overflow the budget. Conversations are never cut in half." },
          { sql: "system: \"Summarise these support conversations in at most 150 words: main themes, counts per theme, and any complaint that needs follow-up with its conversation id. Facts only.\",", say: "The map instruction: short, specific, the same for every chunk, with ids so nothing is lost." },
          { sql: "const partials = await Promise.all(chunks.map(summariseChunk));", say: "Sixty small calls at once. Each one fits easily and finishes in a couple of seconds." },
          { sql: "system: \"You write the weekly support report for the shop's owner: one paragraph of themes with numbers, then a bullet list of complaints needing follow-up. Use only the summaries provided.\",", say: "The reduce instruction reads 12k tokens of tidy summaries, not 600k of raw chat." },
        ],
        note: "Counts in the final report are the model adding up counts from the partials, which lesson 1.4 warned about. For exact numbers, count in code and pass them in.",
      },
    ],
  },
  {
    stage: "implement",
    point: "For the customer-history summary, the right tool depends on the question. A general summary: map-reduce over the history. A specific question: retrieve the relevant messages, or trim to the recent ones.",
    title: "The customer history, three ways",
    text: "Nisha's first request hides three different needs. Before answering any question: a short summary of the whole history, which is map-reduce over that customer's messages, cached and refreshed when new messages arrive. Answering 'what happened with my damaged chair?': retrieval, fetch the messages that mention the chair (lesson 3.6). Continuing the current chat: trim to recent messages plus the cached summary (lesson 3.4).\n\nWhatever is sent, Dev structures it: the summary first, then the relevant messages with dates, then the question, then one line of instruction.",
    codes: [
      {
        title: "Structured, important things first and last",
        lang: "ts",
        src: `const content = \`<customer_summary>\n\${cachedSummary}            // map-reduce output, refreshed when new messages arrive\n</customer_summary>\n\n<relevant_messages>\n\${relevant.map((m) => \`[\${m.date}] \${m.role}: \${m.text}\`).join("\\n")}   // retrieved, not everything\n</relevant_messages>\n\n<question>\n\${question}\n</question>\n\nAnswer the question using the summary and messages above. If they do not contain the answer, say so.\`;`,
        lines: [
          { sql: "<customer_summary>", say: "The whole history, compressed once, at the top where the model reads carefully." },
          { sql: "${relevant.map((m) => `[${m.date}] ${m.role}: ${m.text}`).join(\"\\n\")}", say: "Only the messages that match the question, each dated. A few hundred tokens, not forty thousand." },
          { sql: "Answer the question using the summary and messages above. If they do not contain the answer, say so.`;", say: "The instruction last, after the data, where it is read last and followed best." },
        ],
      },
    ],
    ask: "The reduce step says 'about 40 complaints about delivery'. Nisha needs the exact number for the owner. Which part of the pipeline should produce it, and how?",
  },
  {
    stage: "compare",
    point: "Buying a bigger window and pasting everything is the tempting answer. Shrinking the input to what the question needs is faster, cheaper and more accurate, and it works for inputs no window can hold.",
    title: "A bigger window, or a smaller input",
    text: "Two reactions to the history that would not fit. The first buys a model with a bigger window and pastes everything in. The second sends only what the question needs, in a structured form, using the four tools from this lesson.",
    versus: {
      beginner: {
        title: "Use the model with the biggest window and paste everything",
        points: ["No pipeline to build.", "Every call reads hundreds of thousands of tokens: slow (lesson 1.2) and expensive on every question.", "Facts in the middle are used less reliably; the summary still misses message 212.", "The weekly pile is bigger than any window; it fails anyway."],
      },
      engineer: {
        title: "Send what the question needs, structured",
        points: ["Trim for conversations, map-reduce for 'summarise all', retrieval for 'answer from a corpus', tools for 'look it up'.", "Each call is small: fast first token, low cost, no buried facts.", "Works for inputs of any size.", "Exact numbers come from code, not from the model adding."],
      },
      tradeoffs: ["Map-reduce makes many calls; summaries of summaries can lose detail, so keep ids and ask for specifics.", "Retrieval needs an index and can miss a piece; lesson 3.6 and evals handle that.", "A large window is still useful for a single long document you must read in full; structure it and put the instruction last."],
      when: "Fits comfortably and all of it is relevant: send it, structured. Otherwise shrink: trim, map-reduce, retrieve, or tools, by the shape of the question.",
    },
  },
  {
    stage: "recap",
    point: "Never aim to 'fit it in'. Send the part that matters, in a structured form: trim, map-reduce, retrieve, or tools, chosen by what the question asks.",
    title: "Connect it back: the history and the weekly pile",
    text: "The 400-message history fitted and was still read badly, because facts in the middle of a long prompt are used less; the fix was a cached map-reduce summary plus retrieved messages for specific questions. The 600,000-token week did not fit at all; map-reduce turned it into sixty small summaries and one report. Exact counts moved into code. Every call is now small, fast and accurate, and the size of the input no longer decides whether the feature works.",
    recap: {
      remember: ["Two limits: the window (hard) and attention in the middle (soft). Long input also costs and delays every call.", "Trim for conversations; map-reduce for 'summarise all'; retrieve for 'answer from a corpus'; tools for 'look it up'.", "Structure what you send: labelled sections, important facts first and last, instruction last.", "Exact numbers come from code."],
      mistakes: ["Pasting an entire history to answer one question.", "Splitting chunks mid-conversation or mid-document.", "Trusting counts the model added up across summaries.", "Buying a bigger window instead of shrinking the input."],
      production: ["Weekly and daily reports over transcripts, logs and tickets are map-reduce jobs.", "Customer context before an answer is a cached summary plus retrieval.", "Document Q&A at any scale is retrieval, never 'paste the manual'."],
      next: ["2.7 Images, audio and files: inputs that are not text.", "3.4 Memory and state: the running summary for conversations.", "3.6 RAG: retrieval done properly."],
    },
    ask: "Customers are now sending photos of damaged furniture and voice notes. The model reads text. Or does it? Next lesson.",
  },
];

export const A11: Topic = {
  slug: "long-inputs",
  title: "Long inputs: summarise, chunk, map-reduce",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain the two ways long inputs fail: the window and lost-in-the-middle.", "Choose between trim, map-reduce, retrieval and tools from the shape of the question.", "Implement map-reduce summarisation with safe chunk boundaries and parallel map calls.", "Structure a long prompt so the model finds what matters."],
  prerequisites: ["tokens-context-cost", "prompting-that-works"],
  story: "Asking a colleague to brief you on a year of email. Nobody reads all of it aloud. They skim each month into a line, then combine the lines; and when you ask about one incident, they search for it instead of rereading the year.",
  tldr: [
    "Long input fails twice: the **context window** is a hard limit, and facts in the **middle** of a long prompt are used less.",
    "Four tools by question: **trim** (conversations), **map-reduce** (summarise all), **retrieve** (answer from a corpus), **tools** (look it up).",
    "**Map-reduce**: chunk on real boundaries, summarise each in parallel, summarise the summaries.",
    "**Structure** what you send; instruction last; exact numbers from code.",
  ],
  words: [
    ["context window", "the hard limit on tokens per call"],
    ["lost in the middle", "facts in the middle of a long prompt are used less reliably"],
    ["chunk", "a piece of a long input small enough to process well"],
    ["map-reduce", "summarise each chunk (map), then summarise the summaries (reduce)"],
    ["retrieval", "fetching only the pieces of a corpus that match a question"],
    ["running summary", "a maintained summary of older conversation turns, kept short"],
  ],
  sections: [],
  quiz: [
    { q: "A 150k-token history fits in the 200k window, but the summary keeps missing a complaint from the middle. Why?", options: ["The model ran out of tokens", "Facts in the middle of very long prompts are used less reliably", "The temperature was too high", "The complaint was not in the history"], answer: 1, reason: true, whyOptions: ["It fitted; this is not the window.", "Correct. Lost in the middle: structure the input, or summarise in chunks so nothing is buried.", "Temperature affects wording, not attention.", "It was there; it was buried."], why: "Fitting is not the same as being read well." },
    { q: "Last week's transcripts are 600k tokens. The owner wants one paragraph. Which approach?", options: ["Find a model with a 1M window", "Map-reduce: summarise chunks in parallel, then summarise the summaries", "Send the first 200k tokens", "Ask the model to be brief"], answer: 1, whyOptions: ["Bigger windows still read the middle poorly and cost per token; and next month will be bigger.", "Correct. Every call is small, the work parallelises, and it scales to any size.", "That drops four days of the week.", "Brevity of output does not change the input size."], why: "Summarise all of it: map-reduce." },
    { q: "A customer asks 'what happened with my damaged chair?' and has 400 messages of history. Best approach?", options: ["Send all 400 messages", "Retrieve the messages that mention the chair and send those", "Send the newest 10 messages", "Ask the customer to repeat the story"], answer: 1, whyOptions: ["Slow, expensive, and the answer may be buried.", "Correct. The question is specific; retrieval sends the relevant few.", "The chair incident may be months old.", "The data exists; use it."], why: "Specific question over a big history: retrieve." },
  ],
  practice: [
    { q: "Sketch the chunking rule for a pile of support conversations and say why you never split inside a conversation.", answer: "Accumulate whole conversations into a chunk until adding the next would exceed the token budget (e.g. 10k), then start a new chunk. Splitting inside a conversation would separate a question from its answer, so a chunk summary could misreport what happened.", explain: "Chunk boundaries follow meaning, not byte counts." },
    { q: "The reduce step reports 'around 40 delivery complaints'. How do you get the exact number into the report?", answer: "Have the map step return structured output per chunk (counts per theme as numbers), sum them in code, and pass the totals into the reduce prompt as given facts, or insert them into the report after. Never let the model add across chunks.", explain: "Lesson 1.4: no calculator inside the model; compute in code." },
    { q: "You must send one long contract in full for a clause-by-clause review. It fits. How do you arrange the prompt?", answer: "Put the task and any definitions first, the contract with numbered clause headings as labelled data, and the detailed instruction (what to flag, output format) last, after the document. Consider asking for clause-by-clause structured output so nothing in the middle is skipped.", explain: "Structure and instruction placement counter lost-in-the-middle." },
  ],
  interview: [
    { level: "junior", q: "What do you do when an input is bigger than the context window?", a: "Do not try to fit it. Choose by the question: trim to the recent part for conversations, map-reduce for 'summarise everything', retrieval to fetch only the relevant pieces for a question over a corpus, or a tool so the model can look up what it needs. Then structure what you send." },
    { level: "mid", q: "Explain map-reduce summarisation.", a: "Split the input into chunks on natural boundaries that fit comfortably, summarise each chunk with the same specific instruction, ideally in parallel, then summarise the collection of summaries into the final output. Keep identifiers and ask for specifics in the map step so detail survives, and compute exact numbers in code rather than letting the reduce step add." },
    { level: "mid", tricky: true, q: "We moved to a model with a 1M-token window, so can we stop chunking?", a: "No. Every token is still billed and read before the first output token, so huge prompts are slow and expensive per call; and models use facts in the middle of very long prompts less reliably. A big window helps when one long document must be read whole; it does not replace sending only what the question needs." },
    { level: "mid", q: "What is lost-in-the-middle and how do you mitigate it?", a: "The tendency to use information at the start and end of a long prompt more than the middle. Mitigate by sending less (retrieval), summarising in chunks, structuring with headings and labels, placing the most important facts first and last, putting the instruction after the data, and asking for structured, itemised output so each part is addressed." },
    { level: "senior", q: "Design the pipeline for a weekly report over hundreds of thousands of support messages.", a: "Chunk conversations on boundaries to a token budget; map each chunk with a structured summary (themes, counts, follow-ups with ids) in parallel with concurrency limits and retries; sum counts in code; reduce the summaries into the report with the computed numbers given as facts; cache chunk summaries by conversation id so reruns only process new data; evaluate against a human-written report monthly." },
    { level: "mid", tricky: true, q: "The chunk summaries were fine but the final report lost important details. What went wrong?", a: "Summaries of summaries compress twice; detail not explicitly asked for in the map step is gone by the reduce step. Fix by making the map output structured and specific (ids, counts, quotes for notable complaints), by keeping chunk summaries longer, or by a two-level reduce. Also check chunk boundaries did not split conversations." },
    { level: "junior", q: "How should you structure a long prompt?", a: "Labelled sections with tags or headings, the most important material first and last, data clearly separated from instructions, and the detailed instruction after the data. Structure is how the model locates things in a long input." },
    { level: "senior", q: "When is retrieval better than map-reduce, and vice versa?", a: "Retrieval when a question needs a few relevant pieces from a big corpus: cheap per question, precise, needs an index. Map-reduce when the task genuinely concerns all of the input: summaries, reports, global themes. Many systems use both: map-reduce to build summaries, retrieval to answer questions over them." },
    { level: "mid", q: "How do you keep a chat's history from growing past the window?", a: "Keep the recent turns verbatim, maintain a running summary of older turns refreshed every few messages, and store durable facts about the user separately; send summary plus recent turns plus facts. Lesson 3.4 covers the details." },
    { level: "mid", q: "Why compute counts in code rather than in the reduce step?", a: "Models predict text, not sums; a reduce step adding numbers across sixty summaries will be wrong sometimes and confident always. Have the map step emit numbers in a schema, sum them in code, and hand the totals to the reduce prompt as facts." },
  ],
  remember: [
    "Two failures: the window, and the middle.",
    "Trim, map-reduce, retrieve, or tools, by the shape of the question.",
    "Chunk on real boundaries; map in parallel; reduce once.",
    "Structure the prompt; instruction last; numbers from code.",
  ],
};
