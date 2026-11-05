import type { StoryPage, Topic } from "../types";

// AI 1.2: tokens, the context window, and what you pay for.

const SETTING = "The same online furniture shop. Dev is now building the 'Ask us anything' chat box for the website's Help page. The server sends each customer question to a model over an API and shows the reply. The shop's rules live in a 40-page PDF: returns, delivery, warranties, payment, discounts.";
const CAST = "**Dev** builds the chat box. **Priya** (product manager) owns the budget for it. **Nisha** (support lead) wrote the 40-page rules document.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Dev pasted the whole 40-page rules document into every question. Answers became slow, the monthly bill was far above the estimate, and one day the model refused the request as too long.",
    title: "The bill that was ten times the estimate",
    text: "Lesson 1.1 ended with a rule: the model only knows what is in the prompt. So Dev did the obvious thing. For every customer question, the server sends the entire rules document (all 40 pages) followed by the question. The answers are now correct; they quote the right return window and the right delivery fees.\n\nThree problems appeared within a week. Each answer takes six to ten seconds to start. The provider's invoice for the first week is ten times what Priya estimated, and the chat box has only had a few hundred questions. And when Nisha added a new section to the document, the model started refusing some requests with an error that said the input was too long.\n\n**This is the problem.** The model is priced and limited by how much text it reads and writes, and Dev is making it read 40 pages to answer a one-line question about delivery fees.",
  },
  {
    stage: "why",
    point: "The model does not keep the document between calls. Every call re-reads everything you send, and you pay per piece of text it reads and writes.",
    title: "Why the document costs money every single time",
    text: "In lesson 1.1 the model was a loop that reads the prompt and predicts one token at a time. Two consequences follow.\n\nFirst, there is no memory between calls. The 40 pages Dev sent for question one are gone when question two arrives, so the server sends them again. Every question is a fresh read of the whole document.\n\nSecond, the provider charges for work, and the work is reading and writing tokens. Reading 40 pages is about 25,000 tokens. At a few dollars per million tokens that is a fraction of a cent per question, which sounds like nothing, until it is multiplied by thousands of questions a day and by the fact that reading all of it takes time before the first word of the answer appears.\n\nThird, there is a hard ceiling on how much text one call may contain. The document plus the question plus the answer must fit inside it. Nisha's new section pushed some requests over the line.",
    jargon: [["invoice line: input vs output", "providers charge separately for tokens you send (input) and tokens the model writes (output); output is usually several times more expensive per token, but input is usually far larger"]],
  },
  {
    stage: "concept",
    point: "Tokens are the unit of everything: price, speed and the size limit. The context window is the most tokens one call may hold, in and out together.",
    title: "Tokens, the context window and the price list",
    text: "A **token** is a piece of text, usually a word or part of a word. In English, 100 tokens is roughly 75 words. Code and other languages take more tokens per word. The model reads tokens and writes tokens; it never sees letters or words directly. That is why models are bad at counting letters and why prices, speeds and limits are all stated in tokens.\n\nThe **context window** is the maximum number of tokens one call may contain: your system prompt, the conversation so far, any documents you paste, and the answer, added together. Common sizes today are 128,000 or 200,000 tokens; some models go to a million. Anything that does not fit is an error, not a warning.\n\nThe price list has two numbers per model: cost per million input tokens and cost per million output tokens. Output costs more per token, but input is usually most of the bill, because you send the same instructions and documents again and again.",
    jargon: [["tokenizer", "the fixed rule a model uses to cut text into tokens; each model family has its own, so the same text can be 1,000 tokens for one model and 1,100 for another"]],
    table: {
      head: ["Text", "About how many tokens"],
      rows: [
        ["one English word", "1.3"],
        ["a customer question (20 words)", "25–30"],
        ["one page of the rules document (500 words)", "650"],
        ["the whole 40-page document", "25,000"],
        ["a typical answer (120 words)", "160"],
        ["a 128k context window", "about 95,000 words: a long novel"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Work out the bill with arithmetic, not guesses. Tokens per call × calls per day × price per token.",
    title: "The arithmetic Priya wanted on day one",
    text: "Dev writes the estimate as a small script so Priya can change the numbers herself. The shape matters more than the exact prices, which change every few months: input tokens per call, output tokens per call, calls per day, and the two prices.\n\nThe result explains the invoice. With the whole document in every call, almost all of the cost is input tokens, and the input is the same 25,000 tokens every time.",
    codes: [
      {
        title: "Estimate the monthly bill",
        lang: "ts",
        src: `const PRICE_IN_PER_M = 3;     // $ per million input tokens (check the provider's page)\nconst PRICE_OUT_PER_M = 15;   // $ per million output tokens\n\nfunction monthlyCost(inputTokens: number, outputTokens: number, callsPerDay: number): number {\n  const perCall = (inputTokens / 1e6) * PRICE_IN_PER_M + (outputTokens / 1e6) * PRICE_OUT_PER_M;\n  return perCall * callsPerDay * 30;\n}\n\n// whole 40-page document in every call\nconsole.log(monthlyCost(25_000 + 30, 160, 2_000));   // ≈ 4,650\n\n// only the 2 relevant pages (lesson 3.6 shows how to find them)\nconsole.log(monthlyCost(1_300 + 30, 160, 2_000));    //   ≈ 380`,
        lines: [
          { sql: "const perCall = (inputTokens / 1e6) * PRICE_IN_PER_M + (outputTokens / 1e6) * PRICE_OUT_PER_M;", say: "Cost of one call: input tokens at the input price plus output tokens at the output price." },
          { sql: "return perCall * callsPerDay * 30;", say: "Times the number of calls a month." },
          { sql: "console.log(monthlyCost(25_000 + 30, 160, 2_000));", say: "25,000 tokens of document plus a 30-token question, a 160-token answer, 2,000 questions a day: thousands a month, almost all of it input." },
          { sql: "console.log(monthlyCost(1_300 + 30, 160, 2_000));", say: "Send only the two relevant pages and the same traffic costs about a twelfth." },
        ],
        note: "Replace the two prices with today's numbers from the provider's pricing page; the shape of the result does not change.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Count tokens before you send them, cap what the model may write back, and keep the fixed part of the prompt identical so the provider can cache it.",
    title: "Three settings that cut the bill today",
    text: "Finding the two relevant pages needs retrieval, which is lesson 3.6. There are three things Dev can do this afternoon.\n\nCount tokens before calling. The provider's library can count the tokens of a request without running it, so the server can refuse or trim an input that would not fit instead of discovering the error from the model.\n\nCap the output. max_tokens limits how much the model may write. A support answer does not need 2,000 tokens; 300 is plenty, and it bounds both cost and the time the customer waits.\n\nKeep the fixed part identical. Providers cache a long, unchanged start of the prompt (the system prompt, the document) and charge much less to read it again. That only works if the fixed text is byte-for-byte the same on every call and comes first, before the part that changes.",
    jargon: [["prompt caching", "the provider remembers a long, unchanged start of your prompt and charges a fraction of the price to read it again on the next call; the part that changes must come after it"]],
    codes: [
      {
        title: "Count, cap, cache",
        lang: "ts",
        src: `const RULES = await fs.readFile("rules.txt", "utf8");   // fixed text, identical every call\n\nconst count = await client.messages.countTokens({\n  model: "claude-sonnet-5-5",\n  system: RULES,\n  messages: [{ role: "user", content: question }],\n});\nif (count.input_tokens > 150_000) throw new Error("input too long for this model");\n\nconst reply = await client.messages.create({\n  model: "claude-sonnet-5-5",\n  max_tokens: 300,                                   // a support answer, not an essay\n  system: [{ type: "text", text: RULES, cache_control: { type: "ephemeral" } }],   // cache the fixed part\n  messages: [{ role: "user", content: question }],   // the part that changes comes last\n});\nconsole.log(reply.usage);   // { input_tokens, output_tokens, cache_read_input_tokens, ... }`,
        lines: [
          { sql: "const count = await client.messages.countTokens({", say: "Ask the provider how many tokens this request is, without running it." },
          { sql: "if (count.input_tokens > 150_000) throw new Error(\"input too long for this model\");", say: "Fail early, in your code, with a message you control." },
          { sql: "max_tokens: 300,", say: "The most the model may write: bounds cost and waiting time." },
          { sql: "system: [{ type: \"text\", text: RULES, cache_control: { type: \"ephemeral\" } }],", say: "Mark the fixed text as cacheable. On the next call the provider reads it from cache at a fraction of the price." },
          { sql: "console.log(reply.usage);", say: "Every response reports the tokens it used. Log it; this is how you watch the bill." },
        ],
        note: "The exact field names belong to one provider's library; every provider has the same three ideas.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The clock follows the tokens too. Time to the first word depends on input size; total time depends on output size.",
    title: "Why the answer took eight seconds to start",
    text: "Priya's other complaint was speed. The model must read every input token before it can write the first output token, so a 25,000-token prompt means a long pause before anything appears. Then each output token takes a few milliseconds, so a 300-token answer streams out over a couple of seconds.\n\nThe two fixes are the same as for cost: send less, and write less. Lesson 2.5 adds a third: stream the answer so the customer sees the first words as soon as they exist instead of waiting for the whole reply.",
    table: {
      head: ["Change", "Effect on cost", "Effect on waiting"],
      rows: [
        ["Send 2 pages instead of 40", "about 12× cheaper", "first word in under a second instead of 6–10"],
        ["max_tokens 300 instead of 2,000", "caps the output cost", "caps the longest wait"],
        ["Cache the fixed prefix", "much cheaper input", "faster first token on cache hits"],
        ["Stream the answer (2.5)", "none", "the first words appear immediately"],
      ],
    },
    ask: "The conversation history grows with every message the customer sends. What happens to cost and to the context window over a long chat, and what would you do about it? (Lesson 3.4.)",
  },
  {
    stage: "compare",
    point: "Pasting everything into every call works and is wasteful. Sending only what is needed, caching the rest and capping the answer is the same quality at a fraction of the cost and delay.",
    title: "Paste everything, or send what is needed",
    text: "Two ways to give the model the shop's rules. Both produce correct answers today. One scales to thousands of questions a day; the other produces invoices.",
    versus: {
      beginner: {
        title: "The whole document, every call",
        lang: "ts",
        code: "const reply = await client.messages.create({\n  model, max_tokens: 2000,\n  messages: [{ role: \"user\", content: `${WHOLE_DOCUMENT}\\n\\nQuestion: ${question}` }],\n});",
        points: ["Simple: one file, one call.", "25,000 input tokens per question; the bill is almost all input.", "6–10 seconds before the first word.", "Breaks the day the document outgrows the context window.", "No caching: the document is inside the part that changes."],
      },
      engineer: {
        title: "The relevant pages, cached rules, capped answer",
        lang: "ts",
        code: "const pages = await findRelevantPages(question, 2);   // lesson 3.6\nconst reply = await client.messages.create({\n  model, max_tokens: 300,\n  system: [{ type: \"text\", text: RULES_SHORT, cache_control: { type: \"ephemeral\" } }],\n  messages: [{ role: \"user\", content: `Relevant policy:\\n${pages}\\n\\nQuestion: ${question}` }],\n});\nlog(reply.usage);",
        points: ["About 1,500 input tokens per question.", "Fixed instructions cached; only the pages and the question are new each time.", "First word in under a second.", "Usage logged on every call, so the bill is never a surprise."],
      },
      tradeoffs: ["Finding the relevant pages needs a search step and can miss a page; the next chapters show how to make it reliable.", "A short max_tokens can cut off a long answer; pick a limit from real answers, not a guess.", "Caching has a minimum size and expires after minutes; it pays off for busy endpoints, not rare ones."],
      when: "Pasting everything is fine for a one-off script or a small document. Anything that runs per customer request gets the second design before launch.",
    },
  },
  {
    stage: "recap",
    point: "Tokens are the unit of price, speed and limits. Send less, cap the answer, cache the fixed part, log the usage.",
    title: "Connect it back: the invoice, explained",
    text: "The bill was ten times the estimate because every question re-read 40 pages of rules, and the model charges for every token it reads. The eight-second pause was the same 25,000 tokens being read before the first word. The 'too long' error was the document plus the question plus the answer crossing the context window.\n\nThe fix is to send the model what it needs for this question, keep the fixed instructions identical so they can be cached, cap the answer, and log the usage on every call. The same arithmetic, tokens times price, explains every provider's pricing page.",
    recap: {
      remember: ["A token is about three-quarters of a word; everything is counted in tokens.", "The context window is the limit on input plus output together; over it is an error.", "Cost = input tokens × input price + output tokens × output price; input is usually most of it.", "Send less, cap max_tokens, cache the fixed prefix, log usage."],
      mistakes: ["Pasting a whole document into every call.", "Estimating cost per call instead of per month at real traffic.", "Putting the changing part of the prompt before the fixed part, which defeats caching.", "Not logging usage until the invoice arrives."],
      production: ["Every AI feature's budget is a tokens-per-call × calls spreadsheet.", "Support bots, summarisers and code assistants all live or die on input size.", "'Context length exceeded' in the error log means someone's history or document grew past the window."],
      next: ["1.3 How a model is trained, and why your data is not in it.", "2.5 Streaming: show the first words immediately.", "3.6 RAG: finding the two relevant pages."],
    },
    ask: "Priya asks: 'Instead of sending the rules every time, can we just train the model on them once?' That is the next lesson.",
  },
];

export const A02: Topic = {
  slug: "tokens-context-cost",
  title: "Tokens, the context window and what you pay for",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain what a token is and estimate the tokens in a piece of text.", "State what the context window limits and what happens when a call exceeds it.", "Estimate a monthly bill from tokens per call, calls per day and the two prices.", "Cut cost and latency with four moves: send less, cap output, cache the fixed prefix, log usage."],
  prerequisites: ["what-a-model-does"],
  story: "A translator who charges per word, forgets everything the moment you leave the room, and can only hold so many pages in their hands at once. Bring the whole archive to every visit and you pay for the whole archive every visit.",
  tldr: [
    "A **token** is a piece of a word, about three-quarters of one. Models read, write, price and limit everything in tokens.",
    "The **context window** is the most tokens one call may hold, input and output together. Over it is an error.",
    "Cost is tokens × price, input and output priced separately. Input is usually most of the bill because you resend the same text.",
    "Four fixes: send only what is needed, cap **max_tokens**, **cache** the fixed prefix, log **usage** on every call.",
  ],
  words: [
    ["token", "a piece of text, roughly three-quarters of a word; the unit of everything"],
    ["context window", "the maximum tokens a single call may contain, in and out together"],
    ["input / output tokens", "what you send vs what the model writes; priced separately"],
    ["max_tokens", "the cap on how many tokens the model may write in one answer"],
    ["prompt caching", "the provider re-uses an unchanged start of your prompt at a lower price"],
    ["usage", "the token counts the API returns with every answer"],
  ],
  sections: [],
  quiz: [
    { q: "The server sends a 40-page document with every question. Where does most of the cost go?", options: ["Output tokens, because answers are expensive", "Input tokens, because the document is re-read on every call", "The API key", "Network bandwidth"], answer: 1, reason: true, whyOptions: ["Output tokens cost more each, but a 160-token answer is tiny next to 25,000 tokens of input.", "Correct. The model keeps nothing between calls, so the document is read again every time, and reading is what you pay for.", "Keys are free; usage is billed.", "Bandwidth is negligible compared with token pricing."], why: "No memory between calls means the same input is paid for again and again." },
    { q: "What happens when system prompt + history + answer exceed the context window?", options: ["The model summarises automatically", "The oldest messages are silently dropped", "The call fails with an error", "The answer is truncated but the call succeeds"], answer: 2, whyOptions: ["No provider summarises for you; that is your code's job (lesson 3.4).", "Nothing is dropped for you; the request is rejected.", "Correct. Over the window is an error, which is why you count tokens before calling.", "max_tokens truncates output; exceeding the window rejects the whole request."], why: "The window is a hard limit on the whole call." },
    { q: "Which change does NOT reduce the cost of a call?", options: ["Sending two relevant pages instead of forty", "Lowering max_tokens", "Caching the fixed system prompt", "Streaming the answer"], answer: 3, whyOptions: ["Fewer input tokens: cheaper.", "Fewer output tokens at most: cheaper and bounded.", "Cached prefix tokens are billed at a fraction.", "Correct. Streaming changes when you see the words, not how many tokens are read or written."], why: "Streaming improves waiting time, not the token count." },
  ],
  practice: [
    { q: "A customer question is about 30 tokens, the system prompt 400, the two relevant pages 1,300, the answer 160. At $3 per million input and $15 per million output, what does one call cost, roughly?", answer: "About $0.0076: 1,730 input tokens ≈ $0.0052 plus 160 output tokens ≈ $0.0024.", explain: "Input: 1,730 / 1,000,000 × 3. Output: 160 / 1,000,000 × 15. The arithmetic is the whole skill; the prices are whatever the pricing page says today." },
    { q: "The chat keeps the full conversation history and sends it every time. A customer has sent 60 messages. What goes wrong, and what is the first fix?", answer: "Each call re-reads all 60 messages: cost and delay grow with every message, and eventually the history crosses the context window and calls fail. First fix: keep only the last N messages, or summarise the older ones into a short paragraph.", explain: "History is input tokens like anything else. Lesson 3.4 covers summaries and stored facts." },
    { q: "Dev puts the customer's question first and the fixed rules after it. Why does prompt caching stop helping?", answer: "Caching works on an unchanged prefix. With the question first, the prefix differs on every call, so there is never a cache hit. Fixed text goes first, changing text last.", explain: "The cache matches from the start of the prompt forward; the first differing token ends the match." },
  ],
  interview: [
    { level: "junior", q: "What is a token?", a: "The unit a language model reads and writes: a word or a piece of a word, about three-quarters of an English word on average. Pricing, speed and the context window are all measured in tokens, which is also why models are poor at counting letters: they never see them." },
    { level: "junior", q: "What is the context window?", a: "The maximum number of tokens one request may contain: system prompt, conversation history, documents and the answer together. Exceeding it is an error, not a truncation, so applications count tokens before calling and trim history or documents to fit." },
    { level: "mid", q: "Why is input usually most of an AI feature's cost even though output tokens are pricier?", a: "Because the same instructions, documents and history are sent again on every call while the answer is short. A 25,000-token prompt with a 160-token answer is 99% input. The fixes are sending only what is needed, caching the fixed prefix and trimming history." },
    { level: "mid", tricky: true, q: "If we pay for a bigger context window, can we stop worrying about prompt size?", a: "No. A bigger window raises the ceiling, but every token you send is still read, billed and adds to the time before the first word; models also get worse at using facts buried in very long prompts. The window is a limit, not a free resource. Send what the question needs." },
    { level: "mid", q: "What does max_tokens do, and what happens if it is too low?", a: "It caps how many tokens the model may write in one answer, bounding cost and the longest wait. Too low and the answer is cut off mid-sentence; the response says it stopped because of the limit, so you can detect it. Pick a value from real answer lengths with headroom." },
    { level: "senior", q: "Explain prompt caching and the one design rule that makes it work.", a: "Providers can store the processed form of a long, unchanged start of your prompt and charge a fraction to reuse it within a few minutes. The rule is ordering: the fixed part, system prompt and documents, must come first and be byte-identical on every call; the part that changes, the user's question, comes last. Any change in the prefix, even a timestamp, defeats it." },
    { level: "mid", tricky: true, q: "The same text is 1,000 tokens on one model and 1,180 on another. Is one of them wrong?", a: "No. Each model family has its own tokenizer, its own rules for cutting text into pieces, so counts differ, and so do costs for the same text. Count with the tokenizer of the model you call; the provider's count endpoint does that for you." },
    { level: "mid", q: "How does latency relate to tokens?", a: "The model must read all input tokens before writing the first output token, so time to first token grows with input size. Then each output token takes a few milliseconds, so total time grows with answer length. Send less for a faster start, cap output for a bounded finish, and stream so the user sees words immediately." },
    { level: "senior", q: "A product manager asks for a cost estimate for an AI feature. What do you need and how do you present it?", a: "Tokens per call split into fixed prefix, variable input and output; calls per day; the model's two prices; and the expected cache hit rate. Present a per-month number at expected traffic with a worst case, and show which lever moves it most, usually input size. Then log real usage from day one and compare." },
    { level: "junior", tricky: true, q: "Does the model remember the document we sent in the previous request?", a: "No. Each request is independent; the model sees only what is in it. If the document is needed again it must be sent again, which is exactly why input dominates cost and why caching the unchanged prefix matters." },
  ],
  remember: [
    "Tokens: about three-quarters of a word. Everything is counted in them.",
    "Context window = input + output limit. Over it is an error.",
    "Cost = tokens × price, in and out. Input is usually most of it.",
    "Send less, cap output, cache the fixed prefix first, log usage.",
  ],
};
