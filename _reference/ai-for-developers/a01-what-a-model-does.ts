import type { StoryPage, Topic } from "../types";

// AI 1.1: what a language model actually does. The same shop; Priya in product wants a chatbot.

const SETTING = "**The shop** is a small online furniture store: desks, chairs, lamps, a few books and accessories. Customers buy on its website. When they have a question ('can I return this?', 'where is my order?') they email support, and a person answers each email by hand, which takes hours. Nothing on the website answers questions automatically yet.";
const CAST = "**Priya** is the product manager for the website: she decides what gets built. **Dev** is the developer who builds it. **Nisha** runs the support team that answers the emails today.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Priya tested a chat model on a real customer email about returns. It gave a confident, friendly answer. The answer was false: nothing in it came from the shop. She wants to put it on the website anyway.",
    title: "The chatbot that invented a refund policy",
    text: "Support gets about two hundred customer emails a week, and a person answers each one. Priya wants to cut that work. Her idea: an 'Ask us anything' chat box on the website's Help page, where a customer types a question and gets an answer immediately, with no person involved.\n\nTo see if that could work, she opened a chat model on her laptop (a chat window like ChatGPT or Claude, nothing built by the shop) and pasted in a real customer email: 'Can I return a desk after 40 days?' The model replied: 'Yes, you can return it within 45 days of delivery, and we will arrange free collection.' It read like a support agent wrote it. So she asked Dev: put this on the Help page by Friday.\n\nDev checked the shop's actual rules before building anything. Returns are accepted within **30** days, not 45, and collection costs 15; it is not free. The model had never seen the shop's rules. It wrote what a typical shop would say, in a typical shop's tone, and that happened to be wrong for this shop.\n\n**This is the problem.** If that chat box goes on the Help page, customers will be told things the shop never promised, in a confident voice, and the shop will have to honour them or argue. The model sounds right whether or not it is right. Before building the chat box, you need to know why.",
    jargon: [["chat model", "a language model wrapped in a chat window: you type a message, it replies with a message. Underneath it is still text in, text out, and it has no connection to the shop"]],
  },
  {
    stage: "why",
    point: "A language model predicts the next word. It does not look anything up, so it has no way to know when it is wrong.",
    title: "Why it sounded so sure",
    text: "A language model does one thing: given some text, it guesses the most likely next word, writes it, and guesses again.\n\nDuring training it read a huge amount of text, including many shop websites and support emails. In that text, 'Can I return a desk after 40 days? Yes, within' is usually followed by a number of days and a polite policy. So that is what it wrote.\n\nIt has no table of the shop's rules. It has no connection to the shop's database. It has no idea of true or false. It only knows what text usually comes next. A refund policy is exactly the kind of text that usually comes next, so the answer is fluent and wrong at the same time.\n\nThe confidence is not a setting you can turn down. Fluent text is what the machine makes. Truth has to come from outside it.",
    jargon: [["training", "the phase, before you ever use the model, when it read a huge pile of text and tuned itself to predict the next word; it is not learning while you chat"]],
  },
  {
    stage: "concept",
    point: "The model turns your text into tokens, predicts the next token, adds it, and repeats until it stops. Every answer is built this way.",
    title: "A model is a next-token machine run in a loop",
    text: "Here are the words you will meet everywhere.\n\nThe text you send is the **prompt**. The model cuts it into **tokens** (pieces of words). For the whole prompt it works out, for every token it knows, how likely that token is to come next. It picks one (usually a likely one, not always the top one), adds it to the text, and does the same again for the next token. It stops when it picks a special stop token. Running the model this way is called **inference**. The model itself is an **LLM**, a large language model.\n\nThree facts follow from this, and every later lesson uses them:\n\n1. The model knows only its training text, which stops at some date.\n2. It can only use what is in the prompt.\n3. Because tokens are picked from probabilities, the same prompt can give a different answer next time.",
    visual: {
      kind: "flow",
      steps: [
        { label: "Prompt", sub: "'Can I return a desk after 40 days? Yes, within'", tone: "accent" },
        { label: "Tokens", sub: "cut into pieces: Can / I / return / a / desk …" },
        { label: "Next-token odds", sub: "' 30' 41% · ' 45' 22% · ' 14' 9% …" },
        { label: "Pick one", sub: "' 45' (likely, not certain)", tone: "warn" },
        { label: "Add it, repeat", sub: "… until a stop token", tone: "ok" },
      ],
      caption: "One prediction per token. A 200-word answer is about 260 runs of this loop.",
    },
  },
  {
    stage: "visual",
    point: "Twenty lines of code that do the same job as a real model, so you can see the loop with your own eyes.",
    title: "The smallest possible language model",
    text: "This tiny model knows one thing: for each word in a short text, which word came after it, and how often. To answer, it takes your last word, picks the most common follower, adds it, and repeats.\n\nIt is very small, but it has the same shape as a real model. Replace 'count which word followed' with billions of learned numbers that look at every earlier token, and you have a modern model.",
    codes: [
      {
        title: "A model that learned from one paragraph",
        lang: "ts",
        src: `const text = "you can return a desk within 30 days. you can return a chair within 30 days. returns are free in store.";\nconst words = text.split(" ");\n\n// training: count which word follows which\nconst next: Record<string, Record<string, number>> = {};\nfor (let i = 0; i < words.length - 1; i++) {\n  (next[words[i]] ??= {})[words[i + 1]] = (next[words[i]]?.[words[i + 1]] ?? 0) + 1;\n}\n\n// inference: predict the most likely next word, append, repeat\nfunction generate(prompt: string, n = 6): string {\n  const out = prompt.split(" ");\n  for (let i = 0; i < n; i++) {\n    const options = next[out[out.length - 1]];\n    if (!options) break;\n    const best = Object.entries(options).sort((a, b) => b[1] - a[1])[0][0];\n    out.push(best);\n  }\n  return out.join(" ");\n}\n\ngenerate("you can");   // "you can return a desk within 30 days."`,
        lines: [
          { sql: "const next: Record<string, Record<string, number>> = {};", say: "The model's whole memory: for each word, a count of which words came after it." },
          { sql: "(next[words[i]] ??= {})[words[i + 1]] = (next[words[i]]?.[words[i + 1]] ?? 0) + 1;", say: "Training: read the text once and count every pair. 'return' → 'a' twice, 'within' → '30' twice." },
          { sql: "const options = next[out[out.length - 1]];", say: "Inference: look at the last word and fetch what usually follows it." },
          { sql: "const best = Object.entries(options).sort((a, b) => b[1] - a[1])[0][0];", say: "Pick the most likely follower. A real model picks from the odds instead of always taking the top one." },
          { sql: "out.push(best);", say: "Add it and go round again. This loop is what writes whole paragraphs." },
        ],
        note: "Ask it 'returns are' and it says 'free in store', because that followed in its text. Ask about a lamp and it has nothing. A real model would make something up from similar text.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The real model is called over an API. It answers from the messages you send, so put the shop's actual policy in the prompt and the answer becomes right.",
    title: "The same loop, through an API",
    text: "For the Help page chat box, Dev cannot use Priya's chat window; the website's server has to call the model itself. The real model is too big to run on the shop's server, so the server calls it over HTTP: send the conversation as a list of messages, get the next message back. The provider's library wraps the HTTP call. Underneath, it is the loop from the toy, on a model with billions of numbers.\n\nTwo things to see in the code. The answer only knows what is in the messages, so Dev puts the shop's actual return policy in; now the model completes text that contains the truth. And the reply is a continuation, not a lookup: leave the policy out and you get Priya's invented 45 days again.",
    jargon: [["message", "one turn in the conversation you send: a role (system, user or assistant) and its text; the reply is the next assistant message"]],
    codes: [
      {
        title: "Ask with the facts in the prompt",
        lang: "ts",
        src: `import Anthropic from "@anthropic-ai/sdk";\nconst client = new Anthropic();   // reads ANTHROPIC_API_KEY from the environment\n\nconst policy = "Returns: 30 days from delivery, unused, in original packaging. Collection costs 15.";\n\nconst reply = await client.messages.create({\n  model: "claude-sonnet-5-5",\n  max_tokens: 300,\n  system: "You answer customer questions for a furniture shop. Use ONLY the policy you are given. If the policy does not cover the question, say you will check with the team.",\n  messages: [\n    { role: "user", content: \`Policy: \${policy}\\n\\nCustomer: Can I return a desk after 40 days?\` },\n  ],\n});\nconsole.log(reply.content[0].text);\n// "I'm sorry, returns are accepted within 30 days of delivery, so a return at 40 days\n//  would not be covered under our policy. ..."`,
        lines: [
          { sql: "const client = new Anthropic();", say: "The provider's library. The secret key is read from the server's environment, never written in code." },
          { sql: "const policy = \"Returns: 30 days from delivery, unused, in original packaging. Collection costs 15.\";", say: "The truth, from the shop, not from the model's memory." },
          { sql: "model: \"claude-sonnet-5-5\",", say: "Which model to run. Sizes trade quality for speed and price (lesson 1.5)." },
          { sql: "max_tokens: 300,", say: "The most tokens it may write back: a cap on length and on cost." },
          { sql: "system: \"You answer customer questions for a furniture shop. Use ONLY the policy you are given.", say: "Standing instructions from you, the developer, placed before everything else." },
          { sql: "{ role: \"user\", content: `Policy: ${policy}\\n\\nCustomer: Can I return a desk after 40 days?` },", say: "The user turn: the policy text and the question together. What is here, the model can use; what is not, it cannot." },
          { sql: "console.log(reply.content[0].text);", say: "The next assistant message: a continuation of everything above." },
        ],
        note: "Same model Priya used. The only change is what is in the prompt.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Five things you will see models do wrong. Each one comes from the loop, and each one has a fix in a later lesson.",
    title: "Watch the machine, not the magic",
    text: "Dev shows Priya three quick tests. Ask the same question three times and the wording changes each time, sometimes the number too: tokens are picked from probabilities. Ask about a product launched last month and the model has never seen it: its knowledge stops at its training date. Ask it to add up a long invoice and it is often wrong: it is predicting text that looks like a sum, not computing one.\n\nNone of this makes the tool useless. It is the shape of the tool. Each row below has its own lesson and its own fix.",
    table: {
      head: ["What you see", "Why", "What fixes it (lesson)"],
      rows: [
        ["Different answer each run", "tokens are picked from probabilities", "temperature 0, structured output, evals (2.4, 2.3, 3.7)"],
        ["Confident wrong facts", "completing likely text, no lookup", "put the facts in the prompt: RAG (3.6)"],
        ["Knows nothing after a date", "training text ends there", "retrieval, tools, web search (3.5, 3.6)"],
        ["Bad at arithmetic, dates, counting", "predicting text, not computing", "tool calling: let code compute (3.1)"],
        ["Forgets the last conversation", "nothing is kept between calls", "send history or summaries (3.4)"],
      ],
    },
    ask: "If the model only completes text, what is it reliably good at? Name two things a support team could use it for safely.",
  },
  {
    stage: "compare",
    point: "You can treat the model as an oracle that knows the answer, or as a good writer that must be handed the facts. Only the second is safe for customers.",
    title: "Trust the model, or feed the model",
    text: "Two ways to build the Help page chat box. Both use the same model. The first sends the customer's question to the model and shows the customer whatever comes back. The second looks up the shop's relevant rules first (return policy, delivery times, prices), gives them to the model together with instructions, and checks the answer before the customer sees it.",
    versus: {
      beginner: {
        title: "Ask the model and show the answer",
        lang: "ts",
        code: "const reply = await client.messages.create({\n  model, max_tokens: 500,\n  messages: [{ role: \"user\", content: customerQuestion }],\n});\nshowToCustomer(reply.content[0].text);",
        points: ["Works in minutes and demos well.", "Every policy, price and date in the answer comes from the model's memory of other shops.", "No way to know when it is wrong; it sounds the same either way.", "Changes its answer between runs."],
      },
      engineer: {
        title: "Give it the facts, limit its job, check its output",
        lang: "ts",
        code: "const facts = await findRelevantPolicy(customerQuestion);   // your data, lesson 3.6\nconst reply = await client.messages.create({\n  model, max_tokens: 500, temperature: 0,\n  system: RULES,   // only use the facts; say when you cannot answer; never promise refunds\n  messages: [{ role: \"user\", content: `Facts:\\n${facts}\\n\\nQuestion: ${customerQuestion}` }],\n});\nconst text = reply.content[0].text;\nif (mentionsMoney(text)) await queueForHuman(text); else showToCustomer(text);",
        points: ["The answer can only contain what you gave it, plus wording.", "The rules say what to do when the facts do not cover the question.", "Money and promises go to a person; the model drafts, people decide.", "Temperature 0 keeps the wording steady for the same facts."],
      },
      tradeoffs: ["Feeding facts needs a way to find the right facts (retrieval, lesson 3.6). That is real work.", "A strict system prompt makes the bot say 'I'll check' more often. For a shop that is the right trade.", "Human review adds a delay on a few questions and removes the risk on all of them."],
      when: "The first design is fine for a demo or a brainstorming tool, where a wrong answer costs nothing. Anything a customer reads as the shop's word gets the second design.",
    },
  },
  {
    stage: "recap",
    point: "The model completes text. Facts go in the prompt, rules go in the system prompt, checks go on the output. That is the whole lesson.",
    title: "Connect it back: the refund policy, explained",
    text: "Priya's chat window invented a 45-day policy because a language model predicts the next token from its training text, and a plausible policy is the most likely way to continue a customer's question. It had no facts from the shop because none were in the prompt. The Help page chat box will behave exactly the same way unless the shop's rules are put in front of it.\n\nThe fix was not a smarter model. It was three moves: put the truth in the prompt, tell the model to use only that, and keep promises about money with people. Every lesson in this course is one of those three moves done well.",
    recap: {
      remember: ["A language model predicts the next token, in a loop, from its training text and your prompt. That is all it does.", "It knows nothing you did not put in the prompt, and nothing after its training date.", "Fluent and confident is the default; correct is your job: facts in, rules on, checks after.", "Tokens are picked from probabilities, so answers vary; temperature 0 steadies them."],
      mistakes: ["Treating an answer as a lookup instead of a completion.", "Asking for facts, numbers or dates the model cannot have.", "Shipping the demo design to customers because it sounded right in a demo."],
      production: ["Support assistants, code assistants and search summaries all follow facts in, rules on, checks after.", "Incidents that start with 'the bot promised…' are the oracle design in production.", "Every provider's pricing, limits and speed come from the token loop."],
      next: ["1.2 Tokens, the context window and what you pay for.", "1.3 How a model is trained, without the maths.", "2.1 Your first API call, line by line."],
    },
    ask: "If every answer continues the prompt, what limits how much of the shop's policy you can paste in? That is the next lesson.",
  },
];

export const A01: Topic = {
  slug: "what-a-model-does",
  title: "What a language model actually does",
  minutes: 18,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain in one sentence what a language model does, and why its answers sound confident whether or not they are right.", "Trace a prompt through tokens, next-token odds, sampling and the loop.", "Name the three consequences: frozen knowledge, prompt-only context, sampled answers.", "Choose between 'trust the model' and 'feed the model' for a real feature."],
  prerequisites: [],
  story: "A very well-read parrot: it has heard every conversation in the world and can continue any sentence beautifully. It has never looked anything up, and it does not know which of the things it says are true.",
  tldr: [
    "A language model **predicts the next token**, appends it, and repeats. Chat is that loop with your messages as the prompt.",
    "It knows only its training text (frozen at a date) plus whatever is in the prompt. Nothing else exists for it.",
    "Fluent is free; correct is your job: facts in the prompt, rules in the system prompt, checks on the output.",
    "Tokens are sampled, so the same prompt can give different answers; temperature 0 makes it steadier.",
  ],
  words: [
    ["LLM", "large language model: a program trained on vast text to predict the next token"],
    ["token", "a piece of a word; the unit the model reads, writes and is priced in"],
    ["prompt", "everything you send: instructions, data, the question"],
    ["inference", "running the model to get an answer; each API call is one"],
    ["sampling", "picking the next token from the model's probabilities, which is why answers vary"],
    ["hallucination", "a fluent, confident, made-up answer: the loop doing its job without facts"],
  ],
  sections: [],
  quiz: [
    { q: "The chat model said 'returns within 45 days, free collection'. Where did that come from?", options: ["The shop's website", "The model's training text: what shops usually say", "A lookup in the shop's database", "A random guess"], answer: 1, reason: true, whyOptions: ["The shop's rules were never in the prompt, so the model could not have read them.", "Correct. It completed the question with the most likely policy text it had seen during training: another shop's.", "A model has no connection to any database unless you give it a tool.", "Not random: it is the most likely continuation, which is why it sounds so right."], why: "A model continues text from training patterns; nothing in the prompt, nothing in the answer." },
    { q: "What does a language model do, in one sentence?", options: ["Searches the internet for the answer", "Predicts the next token, adds it, and repeats", "Runs code to work out the answer", "Looks up facts in its database"], answer: 1, whyOptions: ["No search unless you add a tool.", "Correct. Every answer is that loop applied to your prompt.", "No code runs inside the model.", "There is no database inside a model, only weights."], why: "Next token, in a loop." },
    { q: "You want the chat box to give the shop's real return window. The reliable way is…", options: ["Ask the model to be accurate", "Put the shop's policy in the prompt and tell the model to use only that", "Raise the temperature", "Use a bigger model and hope"], answer: 1, whyOptions: ["It has no way to be accurate about facts it was never given.", "Correct. Facts in, rules on; the model's job becomes wording the policy, not knowing it.", "Temperature changes variety, not truth.", "Bigger models still complete text without your facts."], why: "Facts in the prompt; the model words them." },
  ],
  practice: [
    {
      q: "A colleague says 'the model looked up our return policy and got it wrong'. What actually happened, in one sentence?",
      answer: "It did not look anything up; it continued the question with the most likely policy text from its training data, which was another shop's.",
      explain: "There is no lookup step inside a model. Every answer is a continuation of the prompt from training patterns. If the policy was not in the prompt, the model could not have used it.",
    },
    {
      q: "You ask 'What is 17 × 23?' and get 391 most times, 381 sometimes. Why, and what is the right fix for a feature that needs the number?",
      answer: "The model is predicting digits that look like an answer, sampled from probabilities; it is not computing. Let code compute: a calculator tool the model calls, or do the arithmetic outside the model entirely.",
      explain: "Text prediction is unreliable for computation. Tool calling (lesson 3.1) gives the model a way to ask your code for the exact value.",
    },
    {
      q: "Priya wants the chatbot to tell customers about a product launched last week. The model has never heard of it. What are your options?",
      answer: "Put the product's details in the prompt for every question where they are relevant: either always (if short) or by retrieving the matching text first (RAG). Fine-tuning is not the tool for fresh facts.",
      explain: "Knowledge is frozen at the training cutoff; new facts must arrive through the prompt. Retrieval scales that to a whole catalogue.",
    },
  ],
  interview: [
    { level: "junior", q: "In one sentence, what does a large language model do?", a: "Given some text, it predicts the most likely next token, appends it, and repeats until it produces a stop token. Chat, code and summaries are all that loop applied to a prompt." },
    { level: "junior", q: "Why does a model 'hallucinate'?", a: "Because it is completing text, not checking facts. When the prompt does not contain the answer, the most likely continuation is still a fluent, plausible one, and the model has no internal signal that it is making things up. The fix is to supply the facts in the prompt and to verify outputs, not to ask it to be more careful." },
    { level: "mid", tricky: true, q: "If I set temperature to 0, will the model stop hallucinating?", a: "No. Temperature controls which token is picked from the probabilities; at 0 it takes the most likely one, so answers become more repeatable, not more true. A model with no facts in the prompt will give the same confident wrong answer every time." },
    { level: "mid", q: "What does the model know about today's date or last week's news?", a: "Nothing, unless it is in the prompt. Its knowledge is frozen at the training cutoff. Applications that need current information retrieve it (search, a database, an API) and paste it into the prompt, or give the model a tool to fetch it." },
    { level: "mid", tricky: true, q: "The model answered correctly in testing ten times out of ten. Can we ship it as the source of truth?", a: "No. Ten samples from a probabilistic process are not a guarantee, and the questions customers ask will differ from the tests. Ship it as a writer that is given the facts, with rules for when it cannot answer and a check or a human on anything that commits the business, and measure it with evals over hundreds of cases." },
    { level: "senior", q: "Explain inference cost and latency from first principles.", a: "Every output token is one pass of the model over the whole context so far, so cost grows with input tokens plus output tokens, and latency grows with the number of output tokens. That is why prices are per million tokens in and out, why long prompts cost more, why streaming shows text as soon as the first token exists, and why caching an unchanged prompt prefix saves money." },
    { level: "mid", q: "What is the difference between training and inference?", a: "Training adjusts the model's billions of numbers by reading vast text, once, at enormous cost; after it the model is frozen. Inference runs the frozen model on your prompt to produce tokens; it is what every API call does. Nothing you send at inference time changes the weights." },
    { level: "junior", tricky: true, q: "Does the model remember our previous conversation?", a: "No. Each call sees only the messages you send. 'Memory' in chat products is the application re-sending the earlier messages, a summary of them, or stored facts about the user. If you do not send it, the model has never seen it." },
    { level: "senior", q: "A product manager wants an AI feature. What three questions do you ask before choosing the design?", a: "Where will the facts come from (the model's memory is not a source of truth)? What happens when it is wrong (what does a mistake cost, and who catches it)? How will we know it is working (which evals, which metrics)? The answers decide between a demo-style call and a retrieval-plus-rules-plus-review design." },
    { level: "mid", q: "Why are models bad at counting letters or doing long arithmetic?", a: "They see tokens, not characters, and they predict text rather than execute steps, so 'strawberry has three r's' or a six-digit multiplication are patterns they may or may not have learned. Reasoning modes help; the reliable fix is a tool: let code count or compute and hand the result back." },
  ],
  remember: [
    "Next token, in a loop. That is the whole machine.",
    "It knows the prompt and its training text. Nothing else.",
    "Facts in, rules on, checks after.",
    "Sampled tokens: expect variation; temperature 0 for steadiness, not truth.",
  ],
};
