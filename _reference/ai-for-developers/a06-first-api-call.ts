import type { StoryPage, Topic } from "../types";

// AI 2.1: the first API call, every line of the request and the response.

const SETTING = "The same online furniture shop. Module 1 decided the design: the website's server sends each customer question, plus the relevant rules, to a model over the provider's API, and shows the reply in the Help page chat box. Dev now has to write that server code for real.";
const CAST = "**Dev** (developer) writes the first version. **Priya** (product manager) tests it on her laptop and finds the first bug. **Nisha** (support lead) supplies the rules text.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Dev's first version called the model straight from the browser with the API key in the page's JavaScript, sent one string instead of messages, and crashed on the reply. Three mistakes that every first attempt makes.",
    title: "The first version, and its three mistakes",
    text: "Dev wrote the chat box in an afternoon: the browser sends the customer's text directly to the provider's API, using the shop's API key pasted into the page's JavaScript, and prints whatever comes back.\n\nPriya tested it. First, the request was rejected: the API wanted a list of messages with roles, not a plain string. Dev fixed that and the reply came back, but the page showed '[object Object]' because the reply is not a string either. Then Priya opened the browser's developer tools and read the API key in plain sight. Anyone visiting the Help page could copy it and run up the shop's bill.\n\n**This is the problem.** The API has a specific shape for what you send and what you get back, and the key is a secret that must never reach a browser. Dev needs to understand the request and the response line by line, and put the call on the server.",
  },
  {
    stage: "why",
    point: "The API is a conversation, not a function call: you send the whole conversation as a list of messages with roles, and the model returns the next message. The key identifies your account and bills it, so it stays on the server.",
    title: "Why messages, roles, and a server",
    text: "The model does not take 'a question'. It takes a conversation so far and writes the next turn (lesson 1.1: the reply is a continuation). So the request is a list of messages, each with a role saying who said it: user for the customer, assistant for the model's earlier replies, and a separate system instruction from you, the developer, that frames everything. One question is a conversation with one user message.\n\nThe reply is also not a string. It is a message with content blocks, because a reply can contain text, a request to call a tool (lesson 3.1), or other kinds of block; plus information about why it stopped and how many tokens it used.\n\nThe API key is the shop's identity to the provider. Whoever has it can make calls that the shop pays for. Browsers show their JavaScript to anyone, so the key can only live on the server, in an environment variable, and the browser talks to the shop's server, never to the provider.",
    jargon: [["environment variable", "a named value set on the server outside the code (for example ANTHROPIC_API_KEY); the program reads it at start-up, and it is never committed to the repository or sent to a browser"]],
  },
  {
    stage: "concept",
    point: "A request has five parts: model, max_tokens, system, messages, and settings. A response has content blocks, a stop reason and usage. Learn these once and every provider looks familiar.",
    title: "The shape of the request and the response",
    text: "**The request.** `model`: which model (lesson 1.5). `max_tokens`: the cap on the reply (lesson 1.2). `system`: your standing instructions, outside the conversation. `messages`: the conversation, oldest first, alternating user and assistant, ending with the user turn you want answered. Optional settings: temperature and friends (lesson 2.4), tools (3.1), streaming (2.5).\n\n**The response.** `content`: a list of blocks; for a plain answer, one text block. `stop_reason`: why it stopped: `end_turn` (finished), `max_tokens` (cut off: your cap was too low), `tool_use` (it wants to call a tool). `usage`: input and output token counts, which is how you watch the bill. `model` and `id` for logging.\n\nEvery provider's API has these same parts with slightly different names. The SDK (the provider's library) builds the HTTP request, sends the key as a header, retries transient failures, and gives you typed objects.",
    table: {
      head: ["Field", "What it is", "Mistake to avoid"],
      rows: [
        ["model", "which model, pinned version", "a floating name that changes under you"],
        ["max_tokens", "cap on the reply length", "too low: cut-off answers; check stop_reason"],
        ["system", "your instructions, outside the conversation", "putting them in a user message where the customer's text can argue with them"],
        ["messages", "the conversation, roles user / assistant", "sending a bare string; forgetting earlier turns"],
        ["content[]", "reply blocks; text has .text", "printing the object; assuming exactly one block"],
        ["stop_reason", "end_turn / max_tokens / tool_use", "ignoring max_tokens cut-offs"],
        ["usage", "input and output tokens", "not logging it"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Here is the smallest correct call, on the server, with every line explained.",
    title: "The smallest correct call",
    text: "This is the whole of a working support answer: the key from the environment, one system instruction, one user message that carries the rules and the question, and the text pulled out of the first content block. Everything later in the course is a variation of these lines.",
    codes: [
      {
        title: "One question, one answer",
        lang: "ts",
        src: `import Anthropic from "@anthropic-ai/sdk";\n\nconst client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst reply = await client.messages.create({\n  model: "claude-sonnet-5-5",\n  max_tokens: 400,\n  system: "You answer customer questions for a furniture shop. Use only the policy text you are given. If it does not cover the question, say you will check with the team.",\n  messages: [\n    { role: "user", content: "Policy:\\n" + policyText + "\\n\\nCustomer: Can I return a desk after 40 days?" },\n  ],\n});\n\nconst text = reply.content.find((b) => b.type === "text")?.text ?? "";\nconsole.log(text, reply.stop_reason, reply.usage);`,
        lines: [
          { sql: "import Anthropic from \"@anthropic-ai/sdk\";", say: "The provider's library (SDK). It builds the HTTP request, adds the key, retries, and types the response." },
          { sql: "const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });", say: "The key comes from the server's environment. This file never runs in a browser." },
          { sql: "model: \"claude-sonnet-5-5\",", say: "Which model answers (lesson 1.5). In real code this is a config setting, pinned to a version." },
          { sql: "max_tokens: 400,", say: "The reply may be at most 400 tokens. A support answer fits; a cut-off would show as stop_reason max_tokens." },
          { sql: "system: \"You answer customer questions for a furniture shop. Use only the policy text you are given.", say: "Your standing instructions. Not part of the conversation; the customer's text cannot overwrite them." },
          { sql: "{ role: \"user\", content: \"Policy:\\n\" + policyText + \"\\n\\nCustomer: Can I return a desk after 40 days?\" },", say: "The one user turn: the facts first, then the question. The model writes the next turn." },
          { sql: "const text = reply.content.find((b) => b.type === \"text\")?.text ?? \"\";", say: "The reply is a list of blocks. Take the text block's text; never print the object." },
          { sql: "console.log(text, reply.stop_reason, reply.usage);", say: "Log why it stopped and what it cost. From day one." },
        ],
      },
    ],
  },
  {
    stage: "implement",
    point: "On the real server the call sits behind an endpoint the browser can talk to. The browser sends the question; the server adds the key, the rules and the instructions; the browser gets only the answer.",
    title: "The endpoint the Help page talks to",
    text: "The browser never sees the key, the system prompt or the policy. It posts the customer's question to the shop's own server. The server builds the request, calls the provider, checks the reply, and returns the answer text. Everything the shop wants to control, the rules, the model, the cost cap, stays on the server.\n\nTwo things Dev adds that the smallest call did not have: a check for cut-off replies, and a catch for provider errors so the customer sees a sentence instead of a stack trace.",
    codes: [
      {
        title: "POST /api/ask",
        lang: "ts",
        src: `import express from "express";\nimport Anthropic from "@anthropic-ai/sdk";\n\nconst app = express();\napp.use(express.json());\nconst client = new Anthropic();   // key from ANTHROPIC_API_KEY\n\napp.post("/api/ask", async (req, res) => {\n  const question = String(req.body.question ?? "").slice(0, 2000);   // the browser sends only this\n  if (!question.trim()) return res.status(400).json({ error: "empty question" });\n\n  try {\n    const reply = await client.messages.create({\n      model: process.env.MODEL_SUPPORT!,\n      max_tokens: 400,\n      system: SUPPORT_RULES,\n      messages: [{ role: "user", content: \`Policy:\\n\${await relevantPolicy(question)}\\n\\nCustomer: \${question}\` }],\n    });\n    const text = reply.content.find((b) => b.type === "text")?.text ?? "";\n    if (reply.stop_reason === "max_tokens") console.warn("answer cut off", reply.usage);\n    console.log({ tokens: reply.usage, stop: reply.stop_reason });\n    res.json({ answer: text });\n  } catch (err) {\n    console.error(err);\n    res.status(502).json({ answer: "Sorry, I could not answer right now. A person will reply by email." });\n  }\n});`,
        lines: [
          { sql: "const question = String(req.body.question ?? \"\").slice(0, 2000);", say: "Only the question crosses from the browser, and it is capped: lesson 1.2's token limits start here." },
          { sql: "model: process.env.MODEL_SUPPORT!,", say: "The model is a setting, not a string in code (lesson 1.5)." },
          { sql: "system: SUPPORT_RULES,", say: "The instructions live on the server; the customer cannot see or change them." },
          { sql: "messages: [{ role: \"user\", content: `Policy:\\n${await relevantPolicy(question)}\\n\\nCustomer: ${question}` }],", say: "Facts the server looked up, then the question. The browser never sees the policy text." },
          { sql: "if (reply.stop_reason === \"max_tokens\") console.warn(\"answer cut off\", reply.usage);", say: "A cut-off answer is a bug you want to know about: raise the cap or shorten the prompt." },
          { sql: "res.status(502).json({ answer: \"Sorry, I could not answer right now. A person will reply by email.\" });", say: "Provider down, rate limited, or a bad request: the customer gets a sentence, the log gets the error. Lesson 3.10 does this properly." },
        ],
        note: "Rate limits, retries and timeouts are lesson 3.10; streaming the answer instead of waiting for all of it is 2.5.",
      },
    ],
  },
  {
    stage: "implement",
    point: "A follow-up question only works if you send the earlier turns again. The server keeps the conversation and resends it, alternating user and assistant.",
    title: "The second question: history",
    text: "Priya's second test: she asked 'What about a chair?' after the desk question and the box had no idea what 'what about' referred to. The model remembers nothing between calls (lesson 1.1), so the server must send the earlier turns again.\n\nThe conversation is a list that alternates user and assistant. The server stores it per chat session, appends the new question, sends the whole list, then appends the reply. Lesson 3.4 handles what to do when the list grows long; for now, the shape.",
    codes: [
      {
        title: "Resend the conversation",
        lang: "ts",
        src: `type Turn = { role: "user" | "assistant"; content: string };\nconst sessions = new Map<string, Turn[]>();   // in memory for now; a database later\n\nasync function answer(sessionId: string, question: string): Promise<string> {\n  const history = sessions.get(sessionId) ?? [];\n  const messages: Turn[] = [...history, { role: "user", content: question }];\n\n  const reply = await client.messages.create({\n    model: process.env.MODEL_SUPPORT!,\n    max_tokens: 400,\n    system: SUPPORT_RULES + "\\n\\nPolicy:\\n" + (await relevantPolicy(question)),\n    messages,\n  });\n  const text = reply.content.find((b) => b.type === "text")?.text ?? "";\n\n  sessions.set(sessionId, [...messages, { role: "assistant", content: text }]);\n  return text;\n}`,
        lines: [
          { sql: "const history = sessions.get(sessionId) ?? [];", say: "Everything said so far in this chat, oldest first." },
          { sql: "const messages: Turn[] = [...history, { role: \"user\", content: question }];", say: "Append the new question. The list must alternate user, assistant, user …" },
          { sql: "system: SUPPORT_RULES + \"\\n\\nPolicy:\\n\" + (await relevantPolicy(question)),", say: "The policy moved into the system prompt so the user turns stay clean. Either place works; this keeps the conversation readable." },
          { sql: "sessions.set(sessionId, [...messages, { role: \"assistant\", content: text }]);", say: "Store the reply as the assistant turn, so the next question has the full context." },
        ],
        note: "'What about a chair?' now works: the desk question and its answer are in the messages.",
      },
    ],
    ask: "The history grows with every message. What limit from lesson 1.2 will it eventually hit, and what are two ways to avoid that? (3.4 answers it.)",
  },
  {
    stage: "compare",
    point: "Calling the provider from the browser with the key in the page is the fast demo. The server endpoint with roles, error handling and logging is the version you can put in front of customers.",
    title: "Browser with the key, or server endpoint",
    text: "Two ways to wire the chat box. Both show an answer on Priya's laptop. One of them is a public API key and a support bot anyone can rewrite.",
    versus: {
      beginner: {
        title: "Browser calls the provider directly",
        lang: "ts",
        code: "// in the page's JavaScript\nconst r = await fetch(\"https://api.provider.com/v1/messages\", {\n  headers: { \"x-api-key\": \"sk-ant-…\" },   // visible to every visitor\n  body: JSON.stringify({ model, messages: [{ role: \"user\", content: question }] }),\n});",
        points: ["No server work; demo in minutes.", "The key is readable by anyone who opens developer tools; they can spend the shop's money.", "The system prompt and policy would also have to be in the browser, where a customer can edit them.", "No logging, no cost cap, no error handling the shop controls."],
      },
      engineer: {
        title: "Browser calls the shop's server; the server calls the provider",
        lang: "ts",
        code: "// browser\nconst r = await fetch(\"/api/ask\", { method: \"POST\", body: JSON.stringify({ sessionId, question }) });\n\n// server: key from the environment, system prompt and policy added here,\n// stop_reason checked, usage logged, errors turned into a friendly sentence",
        points: ["The key never leaves the server.", "Instructions, policy and model choice are under the shop's control.", "Every call is logged with tokens and stop reason.", "Errors become a sentence to the customer and a line in the log.", "Same place to add rate limits, history and streaming later."],
      },
      tradeoffs: ["A server endpoint is more code and needs hosting; that is the cost of controlling a paid, public-facing feature.", "History in server memory is lost on restart; a database comes in 3.4.", "The endpoint can be abused too: add authentication or rate limits before launch (3.10)."],
      when: "Browser-direct is acceptable for a personal tool on your own machine. Anything on a public page goes through your server, from the first commit.",
    },
  },
  {
    stage: "recap",
    point: "Server-side call; messages with roles; system prompt for your rules; read the text block; check stop_reason; log usage; resend history for follow-ups.",
    title: "Connect it back: the three mistakes, fixed",
    text: "The plain string became a messages list with a user role and a separate system instruction. The '[object Object]' became the text of the first text block, with stop_reason and usage read alongside. The key moved into an environment variable on the server, behind an endpoint the browser posts questions to. And Priya's follow-up question works because the server resends the earlier turns. Every later lesson adds one thing to this call.",
    recap: {
      remember: ["Request: model, max_tokens, system, messages (user/assistant, oldest first).", "Response: content blocks (take the text block), stop_reason, usage.", "The key lives in a server environment variable; the browser talks to your server.", "Follow-ups need the history resent; the model keeps nothing."],
      mistakes: ["API key in frontend code or in the repository.", "Sending a bare string or forgetting roles.", "Printing the response object instead of the text block.", "Ignoring stop_reason max_tokens, so answers are silently cut off."],
      production: ["Every AI feature is this endpoint shape: validate input, build the request on the server, read blocks, log usage, handle errors.", "Leaked keys are the most common AI security incident; providers rotate them on request.", "Conversation storage per session is the first piece of state an AI feature needs."],
      next: ["2.2 Prompting that works: what goes in the system prompt.", "2.5 Streaming: show the answer as it is written.", "3.4 Memory and state: what to do when the history grows."],
    },
    ask: "The answers are correct now but long, chatty, and sometimes about things that are not the shop's business. That is a prompt problem: next lesson.",
  },
];

export const A06: Topic = {
  slug: "first-api-call",
  title: "Your first API call: messages, roles, the system prompt",
  minutes: 18,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Build a correct request: model, max_tokens, system, messages with roles.", "Read a response: content blocks, stop_reason, usage.", "Keep the API key on the server behind an endpoint the browser calls.", "Resend conversation history so follow-up questions work."],
  prerequisites: ["what-a-model-does", "tokens-context-cost"],
  story: "Writing to a very capable pen-pal through a locked post box. You include the earlier letters so they know the thread, you keep your house rules on a separate card, you sign with a stamp only you hold, and you read the reply's cover note to see whether they ran out of paper.",
  tldr: [
    "A request is **model + max_tokens + system + messages**; messages alternate **user / assistant**, oldest first.",
    "A response is **content blocks** (take the text block), a **stop_reason** and **usage**.",
    "The **API key** lives in a server environment variable. The browser calls **your** endpoint.",
    "Follow-ups work only if you **resend the history**.",
  ],
  words: [
    ["system prompt", "your standing instructions, sent outside the conversation"],
    ["role", "who said a message: user, assistant, or the system instruction"],
    ["content block", "one piece of a reply: text, a tool request, or other kinds"],
    ["stop_reason", "why the model stopped: end_turn, max_tokens, tool_use"],
    ["usage", "input and output token counts returned with every reply"],
    ["SDK", "the provider's library that wraps the HTTP API"],
  ],
  sections: [],
  quiz: [
    { q: "Where should the provider API key live?", options: ["In the page's JavaScript", "In the repository's config file", "In an environment variable on the server", "In the system prompt"], answer: 2, reason: true, whyOptions: ["Anyone can read a page's JavaScript and spend your money.", "Repositories get cloned, forked and leaked; secrets never go in them.", "Correct. Set on the server, read at start-up, never sent to a browser or committed.", "The system prompt is text sent to the model; it is not a place for secrets."], why: "The key identifies and bills your account; only the server may hold it." },
    { q: "The reply's stop_reason is max_tokens. What happened?", options: ["The model finished normally", "The answer was cut off because your cap was reached", "The input was too long", "The model wants to call a tool"], answer: 1, whyOptions: ["end_turn is the normal finish.", "Correct. Raise max_tokens or shorten what you ask for, and never show a cut-off answer as if it were complete.", "Too-long input is an error, not a stop reason.", "That is tool_use."], why: "stop_reason tells you whether the answer is complete." },
    { q: "A customer asks 'What about a chair?' right after a desk question and the model is confused. Why?", options: ["The model forgot the policy", "The server did not resend the earlier turns", "max_tokens was too low", "The system prompt was missing"], answer: 1, whyOptions: ["The policy is resent per call; that is not the issue.", "Correct. The model sees only the messages in this call; without the desk question and its answer, 'what about' has no referent.", "Length does not affect context between calls.", "The system prompt frames behaviour; it does not carry the conversation."], why: "No memory between calls; the history must be in the messages." },
  ],
  practice: [
    { q: "Write the messages array for a three-turn conversation: customer asks about returns, model answers, customer asks 'and for chairs?'.", answer: "[{role:'user', content:'…returns question…'}, {role:'assistant', content:'…the answer…'}, {role:'user', content:'and for chairs?'}]. Oldest first, alternating, ending with the user turn to answer.", explain: "The model writes the next assistant turn after the last user turn." },
    { q: "Your endpoint returns the whole response object to the browser. Name two things that leak and what you should return instead.", answer: "Usage and model details leak at least, and any system or tool content in future; return only what the page needs: the answer text (and perhaps a message id). Keep usage and stop_reason in server logs.", explain: "The browser gets the minimum; the server keeps the telemetry." },
    { q: "An answer ends mid-sentence. Which field tells you why, and what are two fixes?", answer: "stop_reason === 'max_tokens'. Raise max_tokens to fit real answers with headroom, or ask for shorter answers in the system prompt; and detect the case so a cut-off is never shown as complete.", explain: "Check the stop reason on every reply." },
  ],
  interview: [
    { level: "junior", q: "What are the parts of a chat completion request?", a: "The model, a maximum output length, a system prompt with your instructions, and the conversation as a list of messages with roles (user and assistant, oldest first, ending with the user turn to answer). Optional settings like temperature, tools and streaming go alongside." },
    { level: "junior", q: "Why must the API key never be in frontend code?", a: "Browsers expose their JavaScript; anyone could copy the key and make calls billed to you, and read or change your prompts. The browser calls your server, the server holds the key in an environment variable and makes the provider call." },
    { level: "mid", q: "What is the difference between the system prompt and a user message?", a: "The system prompt is the developer's standing instruction, sent outside the conversation and treated as higher authority than the turns; user messages are the conversation itself. Rules, persona and format go in system; the customer's text and the data for this request go in user turns. Keeping them separate also makes it harder for customer text to argue with your rules." },
    { level: "mid", tricky: true, q: "The model 'remembers' my earlier message in the chat app; why does the API not?", a: "The app is resending the earlier messages on every call. The API is stateless: each request contains the whole conversation the model will see. Your server stores the turns per session and includes them, trimming or summarising when they grow (lesson 3.4)." },
    { level: "mid", q: "What is in a response and what do you check on every reply?", a: "Content blocks (text, tool requests), stop_reason, usage, and the model id. On every reply I read the text block rather than printing the object, check stop_reason for max_tokens cut-offs or tool_use, and log usage for cost tracking." },
    { level: "senior", q: "Design the server endpoint for a customer-facing chat feature.", a: "POST with session id and the user's text; validate and cap the input; load the session history; build the request on the server with the pinned model, system prompt and retrieved facts; call the provider with a timeout and retries; read the text block and stop reason; store the assistant turn; log usage, latency and errors; return only the answer to the browser; rate-limit per user; stream for long answers." },
    { level: "mid", tricky: true, q: "Can I put the policy text in the system prompt instead of the user message?", a: "Yes, and it is often cleaner: instructions and reference material in system, conversation in messages. Two cautions: a system prompt that changes per request defeats prompt caching unless the changing part comes last, and very large documents can bury the rules; keep the rules first and the data after." },
    { level: "junior", q: "What does the SDK do that a raw fetch does not?", a: "Builds the request body, sends the key in the right header, retries transient failures with backoff, handles streaming events, types the response, and keeps up with API changes. You can call the HTTP API directly, but you rewrite those things badly." },
    { level: "senior", q: "What goes wrong when the messages list does not alternate roles?", a: "Most APIs reject consecutive messages with the same role or require the list to start with a user turn; others merge them unpredictably. It usually means a bug in session handling: a reply failed to be stored or a user retried. Normalise before sending: merge adjacent same-role turns and ensure the last turn is the user's." },
    { level: "mid", q: "How do you handle a provider error in a user-facing endpoint?", a: "Catch it, log the details, return a short friendly message with a fallback path (a person will reply), and surface metrics so repeated failures page someone. Distinguish retryable errors (rate limit, overload, timeout) from bad requests (too long, invalid); retry the former with backoff, fix the latter in code." },
  ],
  remember: [
    "Server-side call. Key in the environment. Browser talks to your endpoint.",
    "model, max_tokens, system, messages[user/assistant].",
    "content[].text, stop_reason, usage: read all three.",
    "Resend the history or the model has no idea what 'what about' means.",
  ],
};
