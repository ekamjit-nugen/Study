import type { StoryPage, Topic } from "../types";

// AI 2.2: prompting that works: instructions, examples, format, what to do when unsure.

const SETTING = "The same online furniture shop. The Help page chat box runs through the server endpoint from lesson 2.1. The answers are correct when the policy covers the question. Nisha has read a hundred transcripts and does not like how the answers read.";
const CAST = "**Nisha** (support lead) has the transcripts. **Dev** (developer) owns the system prompt. **Priya** (product manager) wants the box to sound like the shop.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "The answers are correct but long, chatty, inconsistent in tone, and the box happily answers questions that are none of the shop's business. The one-line system prompt is not doing its job.",
    title: "Correct, and still wrong for the shop",
    text: "Nisha's notes after a hundred chats: answers run to four paragraphs where one sentence would do; some start 'Great question!' and others 'Certainly'; one customer asked for a lasagne recipe and got one; when the policy did not cover a question, the box sometimes said 'I'll check with the team' and sometimes guessed; and the layout varies, so the Help page looks messy.\n\nDev's system prompt is one sentence: 'You answer customer questions for a furniture shop. Use only the policy text you are given.' Everything Nisha dislikes is something that sentence never mentioned.\n\n**This is the problem.** A model does the most plausible thing the prompt implies. A vague prompt gets average chatbot behaviour. The shop needs specific behaviour, and specific behaviour has to be written down.",
  },
  {
    stage: "why",
    point: "The model completes the most likely answer given the prompt. Whatever you leave unspecified, it fills in with the average of everything it has read, which is long, chatty and eager to help with anything.",
    title: "Why vague instructions give average answers",
    text: "Lesson 1.1 again: the model continues the text in the most probable way. A system prompt that says 'answer questions for a shop' is completed by what a typical helpful assistant does across the model's training data: friendly openers, several paragraphs, help with any topic, and a confident guess when unsure, because that is what most assistants in the training text did.\n\nTone, length, scope and the handling of unknowns are not defaults you can rely on. They are decisions. Each one has to be stated, and the clearest way to state a behaviour is to show it: one or two example exchanges in the prompt move the model far more than adjectives do.",
  },
  {
    stage: "concept",
    point: "A working system prompt has six parts: who the assistant is, what it does, the rules, the output format, what to do when unsure, and examples. Instructions first, data after.",
    title: "The six parts of a system prompt",
    text: "**Role.** One line: who the assistant is and for whom. 'You are the support assistant for an online furniture shop.'\n\n**Task.** What it does and does not do. Scope is a rule: 'Answer only questions about the shop's orders, products, delivery, returns and payments. For anything else, say you can only help with the shop.'\n\n**Rules.** The non-negotiables: use only the policy text; never promise refunds, discounts or exceptions; never ask for card numbers.\n\n**Format.** Length, structure, tone: 'At most three sentences. No greeting, no sign-off. Plain English.'\n\n**When unsure.** The exact sentence to use when the policy does not cover the question, so it is always the same sentence.\n\n**Examples.** Two or three short exchanges showing the ideal answer, including one where the right answer is 'I will check with the team'. These are called few-shot examples, and they do more work than any other part.\n\nOrder matters: instructions first, then examples, then the data for this request (policy, history, question) last. Lesson 1.2's caching also wants exactly that order.",
    jargon: [["few-shot examples", "two or three worked input → output pairs placed in the prompt so the model copies the pattern; zero-shot means instructions only"]],
    table: {
      head: ["Part", "One line of Nisha's version"],
      rows: [
        ["Role", "You are the support assistant for the shop's website."],
        ["Task and scope", "Answer only about orders, products, delivery, returns, payments. Otherwise: 'I can only help with questions about the shop.'"],
        ["Rules", "Use only the policy text. Never promise refunds, discounts or exceptions. Never ask for card numbers."],
        ["Format", "At most three sentences. No greeting or sign-off. Plain English."],
        ["When unsure", "Say exactly: 'I'll check that with the team and we'll email you.'"],
        ["Examples", "Three short exchanges, one of them an 'I'll check' case."],
      ],
    },
  },
  {
    stage: "visual",
    point: "Before and after: the one-line prompt against Nisha's six-part prompt, on the same customer question.",
    title: "Before and after, same question",
    text: "Dev runs 'Can I return a desk after 40 days?' with the policy text through both prompts. The old prompt gives four paragraphs that begin with 'Great question!' and end by inviting the customer to ask anything at all. The new prompt gives two sentences, no greeting, the right rule, and an offer that stays inside the policy.",
    visual: {
      kind: "compare",
      left: { title: "One-line prompt", lines: ["'Great question! I'd be happy to help…'", "four paragraphs", "ends with 'feel free to ask me anything!'", "sometimes guesses when the policy is silent"], tone: "warn" },
      right: { title: "Six-part prompt", lines: ["'Returns are accepted within 30 days of delivery, so a return at 40 days is not covered.'", "'If the desk arrived damaged, reply with photos and we will help.'", "two sentences, no greeting", "'I'll check that with the team' when the policy is silent"], tone: "ok" },
      caption: "Same model, same policy, same question.",
    },
  },
  {
    stage: "implement",
    point: "Here is the full system prompt, with the examples, as code. Each part is a labelled section so it can be edited and tested on its own.",
    title: "Nisha's prompt, line by line",
    text: "Dev keeps the prompt in its own file, with headings, so Nisha can read it and so changes show up in code review like any other change. The examples are real exchanges from the transcripts, trimmed to the ideal answer.",
    codes: [
      {
        title: "support-prompt.ts",
        lang: "ts",
        src: `export const SUPPORT_RULES = \`
# Role
You are the support assistant on the website of an online furniture shop.

# Task and scope
Answer customer questions about orders, products, delivery, returns, warranties and payments.
If the question is about anything else, reply exactly: "I can only help with questions about the shop."

# Rules
- Use ONLY the policy text provided below. Do not use outside knowledge about shops.
- Never promise refunds, discounts, exceptions or delivery dates that are not in the policy.
- Never ask for card numbers or passwords.
- If the policy does not cover the question, reply exactly: "I'll check that with the team and we'll email you."

# Format
- At most three sentences. Plain English. No greeting, no sign-off, no emoji.

# Examples
Customer: Can I return a chair after 10 days?
Assistant: Yes. Returns are accepted within 30 days of delivery if the item is unused and in its original packaging. Collection costs 15.

Customer: Do you deliver to Ireland?
Assistant: Yes. Delivery to Ireland takes 5 to 7 working days and costs 25.

Customer: Can you price-match a competitor?
Assistant: I'll check that with the team and we'll email you.
\`;`,
        lines: [
          { sql: "# Role", say: "One line of who it is. Headings make the prompt readable to people and to the model." },
          { sql: "If the question is about anything else, reply exactly: \"I can only help with questions about the shop.\"", say: "Scope as a rule with the exact sentence, so lasagne gets the same reply every time." },
          { sql: "- Use ONLY the policy text provided below. Do not use outside knowledge about shops.", say: "The lesson 1.1 rule, stated so it cannot be read as optional." },
          { sql: "- Never promise refunds, discounts, exceptions or delivery dates that are not in the policy.", say: "The sycophancy fence from lesson 1.4, in words." },
          { sql: "- At most three sentences. Plain English. No greeting, no sign-off, no emoji.", say: "Format is a rule, not a hope. Length is the easiest thing to control this way." },
          { sql: "Customer: Can you price-match a competitor?\nAssistant: I'll check that with the team and we'll email you.", say: "An example of the unsure case. Without it, the model guesses; with it, it copies this." },
        ],
        note: "The policy text and the customer's question still go in the user message, after this. Instructions first, data last.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Three techniques that solve specific problems: delimit the data, ask for reasoning only where it helps, and test every prompt change against the same questions.",
    title: "Three habits that keep a prompt working",
    text: "**Delimit the data.** Wrap the policy and the customer's text in labelled tags so the model can tell instructions from data: `<policy>…</policy>` and `<customer>…</customer>`. It also helps lesson 4.1's injection defence.\n\n**Reasoning where it helps.** For a hard question (several parts, an exception, a calculation) asking the model to work through the steps before answering improves accuracy. For a returns question it adds tokens and nothing else. Reasoning models do this on their own; for others, ask for it only on the hard path.\n\n**Test changes.** Every edit to the prompt is a code change. Run the fifty questions from lesson 1.5 before and after. A prompt that fixes the lasagne case and breaks the delivery case is a regression, and you will not see it by eye.",
    codes: [
      {
        title: "Delimited data in the user message",
        lang: "ts",
        src: `const content = \`<policy>\n\${relevantPolicy}\n</policy>\n\n<customer>\n\${question}\n</customer>\n\nAnswer the customer using only the policy.\`;\n\nconst reply = await client.messages.create({\n  model: process.env.MODEL_SUPPORT!,\n  max_tokens: 300,\n  system: SUPPORT_RULES,\n  messages: [{ role: "user", content }],\n});`,
        lines: [
          { sql: "const content = `<policy>\n${relevantPolicy}\n</policy>", say: "The data has a label and a boundary. The model knows where the policy ends." },
          { sql: "<customer>\n${question}\n</customer>", say: "The customer's text, boxed. Instructions inside it are easier to treat as text, not commands." },
          { sql: "Answer the customer using only the policy.`;", say: "A one-line reminder at the end, after the data. Instructions at the end help when the data is long." },
        ],
        note: "Tags are just text; any consistent markers work. The point is a visible boundary.",
      },
    ],
    ask: "Nisha wants the box to answer in the customer's language if they write in Spanish. Which of the six parts does that go in, and what example would you add?",
  },
  {
    stage: "compare",
    point: "Piling adjectives into the prompt feels like progress. A structured prompt with examples and a test set is what actually changes behaviour and keeps it changed.",
    title: "Adjectives, or structure and examples",
    text: "Two ways to react to Nisha's notes. The first adds words to the one-liner. The second rewrites it into parts with examples and runs the question set.",
    versus: {
      beginner: {
        title: "More adjectives",
        code: "system: \"You are a helpful, concise, professional, friendly, accurate support assistant for a furniture shop. Be brief but thorough. Use only the policy. Be careful.\"",
        points: ["Quick to write.", "'Concise' and 'thorough' cancel; the model picks the average.", "Nothing says what to do with lasagne or an uncovered question.", "No examples, so tone and length still drift.", "Nobody measures whether it got better."],
      },
      engineer: {
        title: "Six parts, examples, a test set",
        points: ["Role, scope with an exact refusal line, rules, format as numbers (three sentences), an exact 'unsure' sentence, three real examples.", "Data delimited and placed after the instructions.", "Prompt lives in a file, reviewed like code.", "Every change runs the fifty-question set; regressions are caught before customers see them."],
      },
      tradeoffs: ["Examples cost tokens on every call; keep them short and cache the prefix (lesson 1.2).", "Exact sentences can sound robotic; that is a product choice, and it beats guessing.", "A test set takes an afternoon to build and must be refreshed from real traffic."],
      when: "Adjectives are fine for a one-off question you type yourself. A prompt that runs thousands of times a day is structured, exemplified and tested.",
    },
  },
  {
    stage: "recap",
    point: "Say exactly what you want, show two or three examples, put instructions before data, give the model an exact sentence for the unsure case, and test every change.",
    title: "Connect it back: Nisha's hundred transcripts",
    text: "The chatty four-paragraph answers were the model's default because length and tone were never specified; the format rule fixed them. The lasagne recipe was missing scope; the scope rule with an exact refusal fixed it. The guesses on uncovered questions were missing an unsure rule and an example of it. The examples did more than any instruction. And the fifty-question run before and after is how Dev knows the new prompt is better everywhere, not just on the cases Nisha noticed.",
    recap: {
      remember: ["Six parts: role, task and scope, rules, format, when unsure, examples.", "Show, don't tell: two or three real examples beat adjectives.", "Instructions first, delimited data last, a one-line reminder at the end.", "Every prompt change runs the question set."],
      mistakes: ["'Be concise but thorough' and other contradictions.", "No scope rule, so the bot helps with anything.", "No exact sentence for the unsure case, so it guesses.", "Editing the prompt by feel and shipping without a test run."],
      production: ["System prompts live in version control with review and tests.", "Exact sentences for refusals and unknowns make transcripts searchable and behaviour predictable.", "Few-shot examples are the first thing to try before considering fine-tuning (lesson 1.3)."],
      next: ["2.3 Structured output: when the answer must be data, not prose.", "2.4 Temperature and friends: the sampling dials.", "3.7 Evals: the question set, automated."],
    },
    ask: "Nisha also wants each chat tagged with a category and a priority for the support dashboard. Prose will not do; the next lesson makes the model return data.",
  },
];

export const A07: Topic = {
  slug: "prompting-that-works",
  title: "Prompting that works: instructions, examples, format",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Write a system prompt with role, scope, rules, format, an unsure rule and examples.", "Use few-shot examples to set tone, length and the unsure behaviour.", "Delimit data from instructions and order the prompt for caching and clarity.", "Treat prompt edits as code changes with a test run."],
  prerequisites: ["first-api-call", "what-models-get-wrong"],
  story: "Briefing a new temp on the help desk: 'be helpful' gets you a chatty generalist; a one-page sheet with the job, the rules, the house style, the exact line for 'I'll check', and three sample replies gets you someone who sounds like the shop by lunchtime.",
  tldr: [
    "A vague prompt gets the model's **average** behaviour: long, chatty, helps with anything, guesses when unsure.",
    "A working system prompt has six parts: **role, task and scope, rules, format, when unsure, examples**.",
    "**Examples** move the model more than adjectives. Instructions first, **delimited data** last.",
    "Prompt edits are code changes: **run the question set** before and after.",
  ],
  words: [
    ["system prompt", "the developer's standing instructions, sent outside the conversation"],
    ["few-shot examples", "worked input → output pairs in the prompt that the model copies"],
    ["scope", "what the assistant will and will not talk about, with an exact refusal line"],
    ["delimiters", "tags or markers around data so the model can tell it from instructions"],
    ["chain of thought", "asking the model to work through steps before answering; useful on hard questions only"],
    ["regression", "a change that fixes one case and breaks another; caught by running the question set"],
  ],
  sections: [],
  quiz: [
    { q: "The bot answers in four paragraphs. The most reliable fix is…", options: ["Add 'be concise' to the prompt", "State a length rule in numbers and show an example of the length", "Lower the temperature", "Reduce max_tokens to 60"], answer: 1, reason: true, whyOptions: ["'Concise' is an adjective the model averages with everything else; it helps a little.", "Correct. 'At most three sentences' plus two three-sentence examples sets the length precisely.", "Temperature affects variety, not length.", "A hard cap cuts answers mid-sentence; use it as a safety net, not as the style."], why: "Numbers and examples beat adjectives." },
    { q: "Where should the customer's message and the policy text go relative to the instructions?", options: ["Before the instructions", "After the instructions, delimited", "Mixed into the rules", "In the system prompt only"], answer: 1, whyOptions: ["Data first buries the rules and defeats caching.", "Correct. Instructions first, data after with clear boundaries, a one-line reminder at the end.", "Mixing makes it impossible to tell rule from data.", "Policy can live in system, but the customer's text belongs in a user turn, delimited."], why: "Instructions first, delimited data last." },
    { q: "What does a few-shot example do that an instruction cannot?", options: ["It changes the model's weights", "It shows the exact shape, tone and length of a good answer", "It increases the context window", "It prevents hallucination"], answer: 1, whyOptions: ["Nothing in a prompt changes weights (lesson 1.3).", "Correct. The model copies patterns; an example is the pattern itself.", "Examples cost tokens; they do not add room.", "Examples shape form; facts still come from the policy."], why: "Show the pattern you want." },
  ],
  practice: [
    { q: "Write the scope rule and the exact refusal sentence for a bot that only helps with the shop's orders and products.", answer: "'Answer only questions about the shop's orders, products, delivery, returns, warranties and payments. For anything else, reply exactly: \"I can only help with questions about the shop.\"' Add one example exchange showing it.", explain: "A scope rule needs the list of allowed topics and the exact line for everything else." },
    { q: "The bot sometimes guesses when the policy does not cover a question. Which two parts of the prompt fix that?", answer: "The 'when unsure' rule with an exact sentence ('I'll check that with the team and we'll email you') and a few-shot example where that sentence is the right answer.", explain: "The rule states it; the example proves it is a normal, expected answer." },
    { q: "You change the prompt to fix a tone problem. What do you do before deploying, and what counts as a failure?", answer: "Run the fixed question set (the fifty from the bake-off) with the old and new prompt and compare grades. Any question that was good before and is wrong now is a regression and blocks the change, even if the tone problem is fixed.", explain: "Prompts are code; changes need tests." },
  ],
  interview: [
    { level: "junior", q: "What belongs in a system prompt?", a: "Role, task and scope with an exact refusal line, the non-negotiable rules, the output format in concrete terms, the exact behaviour when unsure, and two or three example exchanges. The data for the request (documents, the user's text) goes after, delimited." },
    { level: "junior", q: "What are few-shot examples and why do they work?", a: "Worked input-output pairs placed in the prompt. The model predicts continuations from patterns, so a pattern shown directly is copied more reliably than a described one. They set tone, length, format and the handling of edge cases like 'I don't know'." },
    { level: "mid", tricky: true, q: "Adding 'be accurate and never hallucinate' to the prompt: does it work?", a: "Marginally at best. The model has no mechanism to check facts; those words shift tone, not truth. Accuracy comes from putting the facts in the prompt, restricting the model to them, giving it an exact unsure sentence, and testing with an eval set." },
    { level: "mid", q: "When should you ask the model to reason step by step?", a: "On genuinely hard questions: multi-part, arithmetic, exceptions, planning. It raises accuracy at the cost of tokens and latency. On simple lookups it adds nothing. Route: ask for reasoning on the hard path only, or use a reasoning model where the task warrants it, and never show the working to the customer unless they want it." },
    { level: "mid", q: "Why delimit data in the prompt?", a: "So the model can tell your instructions from text it is processing. Tags around the policy and the user's message make 'use only the policy' well defined and make instructions hidden in the user's text easier to treat as data, which matters for prompt injection. It also makes prompts readable in logs." },
    { level: "senior", q: "How do you manage prompts in a production codebase?", a: "As code: one file per prompt with headings, in version control, reviewed in pull requests, with an eval set that runs on every change and in CI. Prompts are versioned and pinned alongside the model version; logs record which prompt version produced each answer so regressions can be traced." },
    { level: "mid", tricky: true, q: "A prompt that worked on model A behaves differently on model B. Is the prompt broken?", a: "Prompts are tuned to a model's training; a new model may weigh instructions and examples differently. Nothing is 'broken', but the prompt needs re-testing on the eval set and usually small edits. This is why a model change is a deliberate, tested change (lesson 1.5)." },
    { level: "junior", q: "How do you stop the assistant answering off-topic questions?", a: "A scope rule that lists the allowed topics and gives an exact sentence for everything else, plus an example of a refusal. The exact sentence makes the behaviour consistent and easy to find in transcripts." },
    { level: "senior", q: "What makes a prompt change a regression, and how do you catch it?", a: "Any case that was correct before and is wrong after, even if the targeted case improved. You catch it by running a fixed, representative set of inputs with expected outputs or grading rules before and after, comparing pass rates per category, and blocking the change on any drop. Edits by eye miss these every time." },
    { level: "mid", q: "How long should a system prompt be?", a: "As long as the behaviour needs and no longer: a few hundred to a couple of thousand tokens is typical with examples. Every token is sent on every call, so keep examples short, cache the prefix, and move large reference material into retrieval rather than the prompt." },
  ],
  remember: [
    "Six parts: role, scope, rules, format, unsure, examples.",
    "Show it, don't describe it: two or three real examples.",
    "Instructions first, delimited data last.",
    "Every prompt edit runs the question set.",
  ],
};
