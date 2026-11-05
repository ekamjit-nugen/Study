import type { StoryPage, Topic } from "../types";

// AI 3.4: memory and state: history, summaries, user facts.

const SETTING = "The same online furniture shop. The Help page chat box keeps a conversation going by resending the messages (lesson 2.1) and can look up orders (lesson 3.1). Each conversation lives only in the browser tab; close it and it is gone. Customers come back the next day, on their phone, expecting the chat to remember. Nisha's team keeps a notes field per customer in the support tool ('prefers email', 'open return on 4417').";
const CAST = "**Nisha** (support lead) sees customers repeating themselves. **Dev** (developer) owns the chat server and its database. **Priya** (product manager) wants 'it should just remember me'. **Kabir** (owner) asks what the shop is allowed to keep.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A customer continued yesterday's conversation and the chat box had no idea what yesterday was. Another's long chat grew past the context window and the early messages, with the delivery address, silently fell off.",
    title: "'As I said yesterday'",
    text: "Nisha forwards two transcripts.\n\nThe first: a customer opens the chat on their phone and types 'As I said yesterday, I want the walnut one, not the oak. Can you change it?' The chat box replies: 'Could you tell me which order and which item you mean?' Yesterday's conversation happened in a laptop tab that is now closed. The server never stored it. Nothing connects the two chats except the customer, who is now annoyed.\n\nThe second: a customer spent forty minutes choosing a sofa, gave their delivery address in message three, and asked in message sixty 'so is delivery to my address free?' The chat box asked for the address. Dev checks: the conversation had grown past the token budget, the code trimmed the oldest messages (lesson 2.6), and message three went with them.\n\n**This is the problem.** The model remembers nothing between calls (lesson 1.1); whatever it 'remembers' is what the code sends it. Right now the code sends the current tab's messages, trimmed from the top. Yesterday is not there, and neither is anything old enough to be trimmed.",
  },
  {
    stage: "why",
    point: "'Memory' is three different things with three different answers: the current conversation, a compressed version of a long one, and durable facts about the person. Treating them as one list of messages fails all three.",
    title: "Why one message list cannot remember",
    text: "Every call starts from zero. The model reads what is in the request and nothing else. So memory is a storage and retrieval problem on Dev's side, and the two transcripts fail for two different reasons.\n\nYesterday failed because the conversation was never stored. The fix is a database row per conversation, keyed by the customer, so a new tab or a new device can continue it. Message three failed because a long conversation cannot be sent whole, and trimming from the top throws away exactly the facts stated early. The fix is to keep a running **summary** of what was trimmed, so the address survives in a sentence even when the message is gone.\n\nAnd there is a third thing hiding in Priya's 'it should remember me'. Some facts should outlive any conversation: the customer prefers email; they have an open return; they asked not to be offered extended warranties. Those are not messages at all. They are a small profile the code maintains and shows the model at the start, with the customer able to see and delete it.\n\nThree layers, each with a different lifetime: the verbatim recent messages, the summary of the rest, and the facts about the person.",
  },
  {
    stage: "concept",
    point: "Layered memory: the last N messages verbatim, a rolling summary of older ones, and a short list of user facts. The prompt is built from the three on every call; each layer is stored and expires differently.",
    title: "Three layers with three lifetimes",
    text: "**Conversation state.** Every message, stored in a table keyed by conversation id and customer id. A customer's open conversation can be resumed from any device. It is the source of truth; the model sees a window of it.\n\n**Rolling summary.** When the conversation grows past a budget, the code asks the model to fold the oldest messages into a short summary of facts and decisions ('customer wants the walnut finish; delivery address is 12 Elm Road; prefers Saturday'), stores it on the conversation, and sends summary plus the last twelve messages verbatim. Recent turns keep their exact wording; old turns keep their facts.\n\n**User facts.** A few durable statements per customer with a source and an expiry: 'prefers email (said 2026-11-03)', 'open return on order 4417 (from the orders table, live)'. They are extracted with structured output (lesson 2.3) or come from real records, are shown to the customer in their account, and go into the system prompt under a heading that says they may be out of date.\n\nWhat the model gets is always the same shape: system prompt with facts, then the summary as the first message, then the verbatim window. The model does not know there are layers. The code does.",
    jargon: [["rolling summary", "a short text the code keeps updating: each time old messages are trimmed, their facts are folded into it"], ["user facts", "durable statements about a customer kept outside any conversation, with a source and an expiry, visible to the customer"], ["verbatim window", "the most recent messages sent word for word, so tone and exact phrasing are preserved"]],
    table: {
      head: ["Layer", "Stored where", "Lives for", "Sent as"],
      rows: [
        ["conversation messages", "conversations table, per customer", "the conversation (archived after 30 days)", "the last 12, verbatim"],
        ["rolling summary", "a column on the conversation", "the conversation", "the first message, labelled as a summary"],
        ["user facts", "customer_facts table", "until expiry or the customer deletes them", "a short list in the system prompt"],
        ["live records (open return, orders)", "the real tables", "always current", "fetched by tools when needed, never copied"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Building the prompt from the three layers is a small function. The summary is appended to as messages are trimmed, so facts move from the window into the summary instead of disappearing.",
    title: "Assembling what the model sees",
    text: "Dev writes one function that takes a conversation and the customer's facts and returns the messages for the call. If the verbatim part is over budget, the oldest messages are summarised into the stored summary first. Only then is the window cut.",
    codes: [
      {
        title: "buildContext(): facts + summary + window",
        lang: "ts",
        src: `const WINDOW = 12;
const WINDOW_TOKENS = 6000;

export async function buildContext(conv: Conversation, facts: UserFact[]) {
  if (countTokens(conv.messages.slice(-WINDOW)) > WINDOW_TOKENS || conv.messages.length > WINDOW) {
    const old = conv.messages.slice(0, -WINDOW);
    if (old.length > 0) {
      conv.summary = await foldIntoSummary(conv.summary, old);
      conv.messages = conv.messages.slice(-WINDOW);
      await saveConversation(conv);
    }
  }

  const factLines = facts.filter((f) => !f.expiresAt || f.expiresAt > new Date()).map((f) => "- " + f.text + " (source: " + f.source + ")");
  const system = SYSTEM_PROMPT + "\\n\\nKnown about this customer (may be out of date; confirm before acting on it):\\n" + (factLines.join("\\n") || "- nothing yet");

  const messages = [];
  if (conv.summary) messages.push({ role: "user", content: "<summary_of_earlier_conversation>\\n" + conv.summary + "\\n</summary_of_earlier_conversation>" }, { role: "assistant", content: "Understood. I have the earlier context." });
  messages.push(...conv.messages);
  return { system, messages };
}`,
        lines: [
          { sql: "const old = conv.messages.slice(0, -WINDOW);", say: "Everything older than the last twelve messages. These are about to leave the window." },
          { sql: "conv.summary = await foldIntoSummary(conv.summary, old);", say: "Their facts are folded into the summary before they go. The address in message three survives as a sentence." },
          { sql: "conv.messages = conv.messages.slice(-WINDOW);", say: "Only now is the window cut. The stored conversation keeps everything; the window is what is sent." },
          { sql: "const factLines = facts.filter((f) => !f.expiresAt || f.expiresAt > new Date()).map((f) => \"- \" + f.text + \" (source: \" + f.source + \")\");", say: "Expired facts are dropped. Each fact carries its source so the model can say 'you mentioned last week that…'." },
          { sql: "const system = SYSTEM_PROMPT + \"\\n\\nKnown about this customer (may be out of date; confirm before acting on it):\\n\" + (factLines.join(\"\\n\") || \"- nothing yet\");", say: "Facts go in the system prompt under an honest heading. The model is told to confirm, not assume." },
          { sql: "if (conv.summary) messages.push({ role: \"user\", content: \"<summary_of_earlier_conversation>\\n\" + conv.summary + \"\\n</summary_of_earlier_conversation>\" }, { role: \"assistant\", content: \"Understood. I have the earlier context.\" });", say: "The summary enters as a delimited first exchange, so the model treats it as context rather than as the customer's latest words." },
        ],
        note: "foldIntoSummary is one model call with a strict prompt: facts, decisions and open questions only, under 150 words, keep everything from the previous summary unless contradicted.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Facts are extracted with structured output at the end of a conversation, stored with a source and an expiry, and shown to the customer. Live data stays live: an open return is read from the orders table, not remembered.",
    title: "Remembering the right things",
    text: "When a conversation goes quiet, a job runs one structured-output call over it asking for durable facts worth keeping. The schema limits what counts: preferences, standing requests, constraints. It does not store anything the orders table already knows, and it never stores payment details, health or other sensitive information. Each fact has a source message, a date and an expiry. The customer sees the list under 'What we remember' and can delete any line.",
    codes: [
      {
        title: "extractFacts(): what is worth keeping",
        lang: "ts",
        src: `const Facts = z.object({
  facts: z.array(z.object({
    text: z.string().max(120),
    kind: z.enum(["preference", "standing_request", "constraint"]),
    confidence: z.number().min(0).max(1),
  })).max(5),
});

export async function extractFacts(conv: Conversation): Promise<UserFact[]> {
  const reply = await client.messages.create({
    model: process.env.MODEL_CLASSIFY!,
    max_tokens: 500,
    temperature: 0,
    system: "Extract durable facts about this customer that would help future support conversations. Only preferences, standing requests and constraints. Never order details, payment, health, or anything sensitive. Skip anything uncertain.",
    tools: [factsTool],
    tool_choice: { type: "tool", name: "record_facts" },
    messages: [{ role: "user", content: "<conversation>\\n" + transcript(conv) + "\\n</conversation>" }],
  });
  const parsed = Facts.safeParse(reply.content.find((b) => b.type === "tool_use")?.input);
  if (!parsed.success) return [];
  return parsed.data.facts
    .filter((f) => f.confidence >= 0.8)
    .map((f) => ({ customerId: conv.customerId, text: f.text, kind: f.kind, source: "chat on " + today(), expiresAt: addDays(new Date(), 180) }));
}`,
        lines: [
          { sql: "kind: z.enum([\"preference\", \"standing_request\", \"constraint\"]),", say: "Three kinds of fact and nothing else. 'Lives at 12 Elm Road' is not a kind; the account holds addresses." },
          { sql: "})).max(5),", say: "At most five per conversation. Memory that grows without limit becomes noise and a liability." },
          { sql: "system: \"Extract durable facts about this customer that would help future support conversations. Only preferences, standing requests and constraints. Never order details, payment, health, or anything sensitive. Skip anything uncertain.\",", say: "The exclusions are in the instruction and enforced again by the schema and by review." },
          { sql: ".filter((f) => f.confidence >= 0.8)", say: "Only confident facts are kept. A guessed preference is worse than none." },
          { sql: "source: \"chat on \" + today(), expiresAt: addDays(new Date(), 180) }));", say: "Every fact says where it came from and when it stops being trusted." },
        ],
        note: "The 'open return on 4417' line in Nisha's notes is not a fact to extract. It is live data; a tool reads it from the orders table when the conversation needs it.",
      },
    ],
    ask: "A customer wrote 'I'm moving house next month so deliver to the new place'. Is that a user fact, conversation state, or something else, and what should the code do with it?",
  },
  {
    stage: "implement",
    point: "Memory is personal data. Keep little, say where it came from, expire it, show it to the person, let them delete it, and never let one customer's memory reach another's conversation.",
    title: "What the shop is allowed to keep",
    text: "Kabir asks the question the lawyers will ask: what are we storing about people and why? Dev's answers become rules.\n\nConversations are kept thirty days for continuity and support, then archived without the message bodies. Summaries hold facts, not phrasing, and are deleted with the conversation. User facts are few, typed, sourced, expiring, visible in the account and deletable with one tap; deleting a fact also removes it from any cached prompt. Nothing sensitive is extracted, and the extraction prompt and schema both say so.\n\nAnd the mistake that would be worst of all: every query that loads messages, summaries or facts is keyed by the signed-in customer id from the session. A bug that loads the wrong customer's facts puts one person's life into another's chat. Dev writes the test for that before the feature ships.",
    table: {
      head: ["Data", "Keep for", "Who can see it", "Deleted how"],
      rows: [
        ["messages", "30 days", "the customer, support staff", "archive job; account deletion"],
        ["rolling summary", "with the conversation", "same", "with the conversation"],
        ["user facts", "180 days or until deleted", "the customer (account page), support", "one tap by the customer; expiry"],
        ["extracted sensitive data", "never stored", "nobody", "not collected"],
      ],
    },
  },
  {
    stage: "compare",
    point: "Resending everything forever is simple until it is impossible, and it treats a delivery address and 'thanks!' as equally worth keeping. Layered memory keeps recent wording, old facts and durable preferences each in the right place.",
    title: "One growing list, or three layers",
    text: "Both approaches 'remember'. The first does it by never forgetting; the second by deciding what to keep and for how long.",
    versus: {
      beginner: {
        title: "Store and resend every message",
        lang: "ts",
        code: "const messages = await db.messages.findMany({ where: { conversationId } });\nconst reply = await client.messages.create({ system, messages });   // grows forever",
        points: ["Fixes 'yesterday' as soon as messages are stored.", "Cost grows with every turn; eventually the window overflows and trimming eats early facts.", "Nothing survives across conversations.", "Every stored message is personal data with no plan for expiry."],
      },
      engineer: {
        title: "Window + rolling summary + typed facts",
        lang: "ts",
        code: "const { system, messages } = await buildContext(conv, facts);\n// system: prompt + sourced, expiring facts\n// messages: [summary exchange] + last 12 verbatim",
        points: ["Bounded cost per call regardless of conversation length.", "Early facts survive as summary sentences.", "Preferences outlive the conversation and are visible to the customer.", "Live data stays in its tables and is read by tools."],
      },
      tradeoffs: ["Summarising costs a model call now and then, and a bad summary can drop a detail; keep the window generous and the summary prompt strict.", "Facts need a UI, an expiry and a deletion path; that is product work, not just a table.", "For short, one-off conversations the simple approach is fine; add layers when conversations get long or customers return."],
      when: "Short single sessions: store and resend. Long or returning conversations: the three layers, keyed by the customer, with retention rules.",
    },
  },
  {
    stage: "recap",
    point: "The model remembers nothing; your code does. Store conversations per customer, keep a verbatim window plus a rolling summary, maintain a few sourced and expiring facts the customer can see, and read live data with tools.",
    title: "Connect it back: the walnut one",
    text: "Yesterday's chat is now a row the phone can resume, so 'the walnut one' resolves. The address in message three survived in the summary when the window moved on. The chat box opens with 'Known about this customer: prefers email', confirms before acting on it, and the customer can delete that line from their account page. Open returns are not remembered; they are looked up, which is how they stay true.",
    recap: {
      remember: ["Memory is code: stored conversations, a rolling summary, typed user facts.", "Fold old messages into the summary before cutting the window.", "Facts are few, typed, sourced, expiring, visible and deletable.", "Live data is read by tools, never memorised.", "Everything is keyed by the signed-in customer."],
      mistakes: ["Trimming from the top with no summary.", "Storing every message forever with no retention rule.", "Extracting sensitive details or order facts as 'memory'.", "Loading memory by a conversation id without checking the customer."],
      production: ["Support assistants, shopping assistants, coding assistants that remember project conventions, personal assistants with preferences.", "Lesson 3.6 uses retrieval to pull relevant earlier conversations instead of summarising them all.", "Lesson 4.3 sets the privacy rules this lesson applied."],
      next: ["3.5 Embeddings: searching by meaning.", "3.6 RAG: answers grounded in your own documents.", "4.3 Privacy and PII: what may be stored and sent."],
    },
    ask: "Priya wants the chat box to answer from the full help centre: two hundred articles, far too many for a prompt. Finding the right article for a question is the next problem. Next lesson.",
  },
];

export const A16: Topic = {
  slug: "memory-and-state",
  title: "Memory and state: history, summaries, user facts",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain why a model has no memory and what 'memory' therefore means in code.", "Separate conversation state, rolling summaries and user facts, with a lifetime for each.", "Build the prompt from the three layers so early facts survive trimming.", "Extract and store user facts safely: typed, sourced, expiring, visible, deletable, scoped to the customer."],
  prerequisites: ["first-api-call", "structured-output", "long-inputs"],
  story: "A good receptionist's notebook. The current conversation is on the pad in front of them; last week's is a few lines in the notebook; and 'prefers email' is on a sticky note on the customer's file, dated, and they will ask before relying on it.",
  tldr: [
    "The model **remembers nothing** between calls. Memory is what your code **stores and sends**.",
    "Three layers: **verbatim window** of recent messages, a **rolling summary** of older ones, a short list of **user facts**.",
    "Fold old messages into the summary **before** cutting the window, so early facts survive.",
    "Facts are **few, typed, sourced, expiring, visible, deletable**, and **keyed by the signed-in customer**. Live data is read by **tools**.",
  ],
  words: [
    ["conversation state", "the stored messages of one conversation, per customer, resumable from any device"],
    ["rolling summary", "a short, updated text holding the facts from messages that left the window"],
    ["verbatim window", "the most recent N messages sent exactly as written"],
    ["user facts", "durable preferences and requests about a person, with source and expiry"],
    ["retention", "how long each kind of stored data is kept before deletion"],
  ],
  sections: [],
  quiz: [
    { q: "A customer's delivery address from message 3 is gone by message 60. What was missing?", options: ["A bigger model", "A rolling summary that captured the address before the window moved on", "A longer system prompt", "Temperature 0"], answer: 1, reason: true, whyOptions: ["Any model only sees what is sent.", "Correct. Fold old messages into a summary first; then cut the window.", "The system prompt is not where conversation facts go.", "Sampling has nothing to do with it."], why: "Summarise before you trim." },
    { q: "Which belongs in user facts: 'prefers email', 'open return on 4417', 'card ends 1234'?", options: ["All three", "Only 'prefers email'", "Only 'open return on 4417'", "None"], answer: 1, whyOptions: ["Live data and payment details must not be memorised.", "Correct. A preference is durable and harmless; the return is live data for a tool; the card is never stored as memory.", "The return is read from the orders table when needed.", "Preferences are exactly what facts are for."], why: "Durable, harmless preferences only; live data via tools." },
    { q: "Why do facts carry a source and an expiry?", options: ["To make the table bigger", "So the model can cite where it learned them, and stale facts stop being used", "Because the SDK requires it", "They do not need them"], answer: 1, whyOptions: ["No.", "Correct. 'You mentioned on 3 Nov…' is honest; a six-month-old preference should lapse.", "It is your schema.", "Unsourced, permanent facts become wrong and creepy."], why: "Facts are claims with provenance and a shelf life." },
  ],
  practice: [
    { q: "Write the prompt for foldIntoSummary.", answer: "'You maintain a running summary of a customer support conversation for a furniture shop. Given the previous summary and the messages being removed, write an updated summary under 150 words containing only: facts the customer stated (preferences, addresses, chosen items), decisions made, and open questions. Keep every point from the previous summary unless the new messages contradict it. No greetings, no tone, no speculation.' Delimit the previous summary and the messages with tags; temperature 0.", explain: "Facts, decisions, open questions; carry forward; strict length." },
    { q: "A test to prevent cross-customer memory leaks: what does it do?", answer: "Create two customers with distinct facts and conversations. Sign in as customer A, call buildContext for A's conversation, assert no string from B's facts or messages appears in system or messages. Also assert that requesting B's conversation id while signed in as A returns not found. Run it in CI.", explain: "Key everything by the session's customer and prove it." },
    { q: "Conversations are kept 30 days but a customer asks to delete everything today. What runs?", answer: "Delete the customer's conversations, summaries and facts; purge any prompt cache entries containing them; keep only a tombstone record of the deletion. Confirm in the account page. Any analytics copies must be deleted or already anonymised.", explain: "Deletion must reach every copy, including caches." },
  ],
  interview: [
    { level: "junior", q: "Does a language model remember previous conversations?", a: "No. Every call starts from nothing and sees only what is sent. Anything that looks like memory is the application storing earlier messages, summaries or facts and including them in the prompt." },
    { level: "mid", q: "How do you keep a long conversation within the context window without losing early facts?", a: "Keep the recent messages verbatim and maintain a rolling summary of the older ones: when messages are about to leave the window, fold their facts, decisions and open questions into the summary with a strict prompt, then cut the window. Send the summary as the first exchange followed by the recent messages." },
    { level: "mid", tricky: true, q: "Should I store the delivery address the customer typed as a 'memory' fact?", a: "No. Addresses live in the account where they are validated and editable; memory facts should be preferences and standing requests. Live data (orders, returns, addresses) is read by tools when needed so it is always current, and sensitive data is never extracted into memory." },
    { level: "senior", q: "Design long-term memory for a support assistant.", a: "Conversations stored per customer with retention; a rolling summary per conversation; a customer_facts table with text, kind (preference, standing request, constraint), source, created and expiry, extracted by a structured-output job with confidence thresholds and exclusions for sensitive data; facts shown in the account page and deletable; all loads keyed by the session's customer with a leak test in CI; live data via tools; a deletion path that reaches caches." },
    { level: "mid", q: "How are user facts shown to the model?", a: "A short list in the system prompt under a heading like 'Known about this customer (may be out of date; confirm before acting)', each with its source and date. Expired facts are filtered out. The model is instructed to confirm rather than assume." },
    { level: "mid", tricky: true, q: "The summary dropped a detail and the model gave a wrong answer. Is summarisation the wrong approach?", a: "It is the right approach with a weak summary. Make the summary prompt strict (facts, decisions, open questions; carry forward everything not contradicted), keep a generous verbatim window, and for very long histories use retrieval over the stored messages instead of relying on the summary alone. Add the failing case to evals." },
    { level: "junior", q: "What is conversation state and where does it live?", a: "The messages of one conversation, stored in a database keyed by conversation and customer so it can be resumed from any device. The model sees a window of it, not the table." },
    { level: "senior", q: "What privacy rules apply to memory?", a: "Collect little: typed facts, not transcripts of everything. Say where each fact came from and when it expires. Show the customer what is kept and let them delete it. Exclude sensitive categories at extraction. Set retention for messages and summaries. Key every read by the authenticated customer and test for cross-customer leaks. Make deletion reach caches and analytics." },
    { level: "mid", q: "When is 'store everything and resend it' acceptable?", a: "Short, single-session conversations with no need for continuity across devices or days, where the total stays well inside the context budget. Once conversations get long or customers return, move to window plus summary plus facts." },
    { level: "mid", q: "How do live records and memory differ?", a: "Memory is what the code chose to keep about the person; live records are the real tables. An open return is live: a tool reads it so it is always current. A preference is memory: stored once with provenance and expiry. Copying live data into memory makes it stale." },
  ],
  remember: [
    "The model forgets everything; your code remembers on purpose.",
    "Window + summary + facts, assembled on every call.",
    "Summarise before trimming.",
    "Few facts, sourced, expiring, visible, deletable, per customer.",
  ],
};
