import type { StoryPage, Topic } from "../types";

// AI 3.1: tool calling: the model asks, your code acts.

const SETTING = "The same online furniture shop. The Help page chat box (lessons 2.1 and 2.2) answers questions from the FAQ and the delivery policy. Customers also ask about their own orders ('where is order 4417?'), which live in the shop's Postgres database behind the Node server. The model has never seen that database.";
const CAST = "**Nisha** (support lead) reads the complaints. **Dev** (developer) owns the chat server and the orders database. **Priya** (product manager) wants the chat box to answer order questions without a person.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A customer asked about order 4471. The chat box answered with a shipping date and a courier. There is no order 4471. The model made the whole thing up because it had no way to look anything up.",
    title: "The order that did not exist",
    text: "Monday morning Nisha forwards a transcript. A customer typed: 'Where is my order 4471?' The chat box replied: 'Your order 4471 was dispatched on Friday with DPD and should arrive by Wednesday.' The customer waited until Wednesday. Nothing came. When Nisha looked it up there was no order 4471 at all; the customer had meant 4417, which was still being made.\n\nDev checks the server. The chat box has the FAQ and the delivery policy in its prompt and nothing else. It cannot see the orders table. Asked a question it cannot answer, it did what a model does: it completed the sentence in the most plausible way. A courier name, a day of the week, all invented.\n\n**This is the problem.** Customers ask about their own orders. The answer is in the database. The model has no way to reach it, and no way to say 'I cannot see that', so it guesses, and the guess reads like a fact.",
  },
  {
    stage: "why",
    point: "A model can only write text; it cannot run a query. So the fix is not 'tell it to check', it is to give it a way to ask your code to check, and to wait for the answer.",
    title: "Why 'just tell it to look it up' does nothing",
    text: "Dev's first idea is to add a line to the system prompt: 'Look up the order before answering.' It changes nothing. The model has no hands. It produces tokens (lesson 1.1); it cannot open a connection, call a function or read a file. Telling it to look something up only makes it write text that sounds like it looked something up.\n\nThe second idea is to paste the whole orders table into the prompt. That is ninety thousand rows, more than the context window (lesson 1.2), and it would show every customer's orders to every customer.\n\nWhat works is a conversation in two halves. The model can write text in a fixed shape (lesson 2.3). So let it write a request: 'please run lookup_order with order_id 4471'. Dev's code reads that request, runs the real query, and sends the result back as the next message. Now the model answers with the result in front of it, or says honestly that nothing was found. The model asks; the code acts.",
  },
  {
    stage: "concept",
    point: "Tool calling: you describe functions by name, purpose and parameters. The model may answer by requesting one. Your code runs it and returns the result. The model then answers for real.",
    title: "The tool loop",
    text: "A **tool** is a function your code owns, described to the model as a schema: a name, a sentence saying what it is for and when to use it, and the parameters it takes. You send the list of tools with the request.\n\nThe model then has two ways to reply. It can write text, as before. Or it can emit a **tool use** block: 'call `lookup_order` with `{ order_id: 4471 }`', and stop with a stop reason that says so. Nothing has run yet. Your code sees the block, runs the real function, and sends a **tool result** block back as the next message, carrying the function's output. The model reads it and either answers the customer or asks for another tool. That is the loop, and your code drives every turn of it.\n\nThree things follow. The model never executes anything; it only requests. The description of each tool is the model's only guide to when to use it, so it matters as much as the code. And the result you send back is text the model will trust, so it must be accurate, scoped to this customer, and honest about failure ('no such order' is a result, not an error).",
    jargon: [["tool use block", "the part of the model's reply that names a tool and gives its arguments as JSON; it is a request, not an action"], ["tool result block", "the message your code sends back carrying the function's output, matched to the request by its id"], ["stop reason", "a field in every reply saying why the model stopped: it finished, hit max_tokens, or wants a tool run"]],
    table: {
      head: ["Step", "Who", "What happens"],
      rows: [
        ["1", "your code", "sends the messages plus the list of tool definitions"],
        ["2", "the model", "replies with text, or with a tool use block naming a tool and its arguments"],
        ["3", "your code", "validates the arguments, runs the function, builds a tool result"],
        ["4", "your code", "sends the result as the next message, with the history"],
        ["5", "the model", "answers using the result, or asks for another tool (back to 3)"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Two tools for the chat box: look up one order, and list a customer's recent orders. The descriptions say when to use each; the schemas say exactly what to pass.",
    title: "Describing the tools",
    text: "Dev writes two definitions. The description is written for the model, not for a colleague: what the tool returns, when to call it, and what not to do. The input schema is the same JSON Schema as structured output (lesson 2.3), because a tool call is structured output with a function on the other end.",
    codes: [
      {
        title: "Tool definitions",
        lang: "ts",
        src: `const lookupOrder = {
  name: "lookup_order",
  description: "Get the status, items and delivery estimate of ONE order by its number. Use when the customer gives an order number. Returns found: false if the number does not exist for this customer.",
  input_schema: {
    type: "object",
    properties: {
      order_id: { type: "integer", description: "The order number the customer typed, digits only." },
    },
    required: ["order_id"],
    additionalProperties: false,
  },
} as const;

const listOrders = {
  name: "list_recent_orders",
  description: "List the signed-in customer's last five orders with numbers and statuses. Use when the customer asks about 'my order' without giving a number.",
  input_schema: { type: "object", properties: {}, additionalProperties: false },
} as const;

const tools = [lookupOrder, listOrders];`,
        lines: [
          { sql: "name: \"lookup_order\",", say: "The name your code switches on when the model asks for it." },
          { sql: "description: \"Get the status, items and delivery estimate of ONE order by its number. Use when the customer gives an order number. Returns found: false if the number does not exist for this customer.\",", say: "Written for the model: what it returns, when to use it, and that 'not found' is a normal answer. This sentence does most of the work." },
          { sql: "order_id: { type: \"integer\", description: \"The order number the customer typed, digits only.\" },", say: "One integer parameter. The model fills it from the conversation; your code still validates it." },
          { sql: "input_schema: { type: \"object\", properties: {}, additionalProperties: false },", say: "No parameters: the customer is known from the session, never from the model." },
          { sql: "const tools = [lookupOrder, listOrders];", say: "The list goes with every request. The model chooses among them, or chooses none and just writes text." },
        ],
        note: "Notice what is not a parameter: the customer id. It comes from the login session on the server, so the model can never ask about someone else's orders.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The loop: call the model, run whatever tools it asks for, send the results back, repeat until it answers with text or a step limit is hit.",
    title: "Driving the loop",
    text: "The server function takes the conversation and the signed-in customer. It calls the model with the tools, runs any tool use blocks, appends the results, and calls again. A step limit stops a model that keeps asking for tools, and the model's own messages are kept in the history so it remembers what it asked for.",
    codes: [
      {
        title: "answerWithTools(): the loop",
        lang: "ts",
        src: `export async function answerWithTools(history: Message[], customerId: number): Promise<string> {
  const messages = [...history];
  for (let step = 0; step < 5; step++) {
    const reply = await client.messages.create({
      model: process.env.MODEL_SUPPORT!,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
    messages.push({ role: "assistant", content: reply.content });

    if (reply.stop_reason !== "tool_use") {
      return reply.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    }

    const results = [];
    for (const block of reply.content) {
      if (block.type !== "tool_use") continue;
      const out = await runTool(block.name, block.input, customerId);
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out.data), is_error: out.error });
    }
    messages.push({ role: "user", content: results });
  }
  return "I could not finish checking that. A person from our team will follow up by email.";
}`,
        lines: [
          { sql: "for (let step = 0; step < 5; step++) {", say: "At most five rounds. A model that keeps asking for tools must be stopped by code, not by hope." },
          { sql: "tools,", say: "The tool definitions ride along with every call." },
          { sql: "messages.push({ role: \"assistant\", content: reply.content });", say: "The model's reply, including its tool request, becomes part of the history. Without this it forgets what it asked." },
          { sql: "if (reply.stop_reason !== \"tool_use\") {", say: "No tool requested: the reply is the answer. Return its text." },
          { sql: "const out = await runTool(block.name, block.input, customerId);", say: "Your code runs the function, with the customer id from the session, never from the model." },
          { sql: "results.push({ type: \"tool_result\", tool_use_id: block.id, content: JSON.stringify(out.data), is_error: out.error });", say: "The result is matched to the request by id. is_error tells the model the call failed rather than returned 'nothing'." },
          { sql: "messages.push({ role: \"user\", content: results });", say: "Tool results go back in a user-role message. The next call lets the model read them." },
        ],
        note: "If the model asks for two tools in one reply, both run and both results go back in the same message.",
      },
      {
        title: "runTool(): validate, scope, never throw",
        lang: "ts",
        src: `const LookupInput = z.object({ order_id: z.number().int().positive() });

async function runTool(name: string, input: unknown, customerId: number) {
  try {
    if (name === "lookup_order") {
      const { order_id } = LookupInput.parse(input);
      const order = await db.orders.findFirst({ where: { id: order_id, customerId } });
      if (!order) return { data: { found: false, message: "No order with that number on this account." }, error: false };
      return { data: { found: true, status: order.status, eta: order.eta, items: order.items.map((i) => i.name) }, error: false };
    }
    if (name === "list_recent_orders") {
      const orders = await db.orders.findMany({ where: { customerId }, orderBy: { placedAt: "desc" }, take: 5 });
      return { data: orders.map((o) => ({ id: o.id, status: o.status, placedAt: o.placedAt })), error: false };
    }
    return { data: "Unknown tool: " + name, error: true };
  } catch (e) {
    return { data: "Tool failed: " + String(e), error: true };
  }
}`,
        lines: [
          { sql: "const { order_id } = LookupInput.parse(input);", say: "The model's arguments are untrusted input. Validate them like a form field." },
          { sql: "const order = await db.orders.findFirst({ where: { id: order_id, customerId } });", say: "Scoped to the signed-in customer. Order 4471 belonging to someone else is 'not found' here." },
          { sql: "if (!order) return { data: { found: false, message: \"No order with that number on this account.\" }, error: false };", say: "Not found is a normal result, not an error. The model will tell the customer honestly instead of guessing." },
          { sql: "return { data: \"Unknown tool: \" + name, error: true };", say: "A tool name you did not define is refused. The model only gets what you listed." },
          { sql: "return { data: \"Tool failed: \" + String(e), error: true };", say: "Exceptions become error results. The loop never crashes because a query failed; the model is told and can apologise." },
        ],
        note: "Return only the fields the answer needs. The whole order row, with the card's last four digits, does not belong in the model's context.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Read-only tools can run freely. Tools that change things need a confirmation step, a permission check, and idempotency, because the model will sometimes call them when it should not.",
    title: "Tools that change things",
    text: "Priya's next request: let the chat box cancel an order. A `cancel_order` tool is easy to write and dangerous to expose. The model sometimes misreads intent ('I might cancel if it's late' is not a cancellation), sometimes retries after a timeout, and sometimes follows instructions hidden in data it reads (lesson 4.1).\n\nDev's rules. Every tool is marked read or write. Read tools run on request. Write tools return a proposal ('cancel order 4417, refund £240, confirm?') that the page shows as a button; the real cancellation runs only when the customer clicks, with the customer id from the session. Write tools are idempotent, so a second call with the same arguments does nothing new. And the server logs every tool call with its arguments and result, because the question 'why did it cancel that?' will come.\n\nThe tool result the model sees after a write is the truth of what happened, not what it asked for: 'cancelled, refund queued' or 'order already shipped, cannot cancel'.",
    table: {
      head: ["Tool", "Kind", "Runs when", "Guard"],
      rows: [
        ["lookup_order", "read", "the model asks", "scoped to the session's customer"],
        ["list_recent_orders", "read", "the model asks", "same"],
        ["cancel_order", "write", "the customer confirms in the UI", "idempotent, logged, checks order state"],
        ["send_email", "write", "never from chat", "not offered to this assistant at all"],
      ],
    },
    ask: "The model calls lookup_order with order_id 4471 twice in a row, getting 'not found' both times, then asks a third time. What stops this, and what should the customer see?",
  },
  {
    stage: "compare",
    point: "Pasting data into the prompt gives the model everything, including what it must not see, and still misses the question it was not prepared for. Tools give it exactly what it asks for, scoped and fresh.",
    title: "Prompt stuffing or tool calling",
    text: "Two ways to let a model answer from live data: put the data in the prompt before it asks, or let it ask for what it needs. The first is simpler for one small table; the second is the one that scales and stays safe.",
    versus: {
      beginner: {
        title: "Paste the data into the prompt",
        lang: "ts",
        code: "const orders = await db.orders.findMany({ where: { customerId } });\nconst system = SYSTEM_PROMPT + \"\\n\\nThis customer's orders:\\n\" + JSON.stringify(orders);",
        points: ["Works for a customer with three orders.", "Every call pays for every order, even when the question is about returns.", "Stale the moment the status changes mid-conversation.", "Whatever is in the row (card digits, internal notes) is now in the model's context."],
      },
      engineer: {
        title: "Offer tools; run what is asked, scoped",
        lang: "ts",
        code: "tools: [lookupOrder, listOrders]\n…\nif (reply.stop_reason === \"tool_use\") runTool(block.name, block.input, customerId)",
        points: ["Data is fetched only when a question needs it, fresh each time.", "Each tool returns the few fields the answer needs.", "Customer scoping lives in code, where it can be tested.", "Write actions become proposals the customer confirms."],
      },
      tradeoffs: ["Tools add a round trip: the model asks, your code runs, the model answers; latency roughly doubles for those questions.", "Tool descriptions need tuning; a vague description makes the model call the wrong tool or none.", "For a tiny, fixed, safe dataset (the delivery price table) pasting it in is fine and faster."],
      when: "Live, per-user or large data: tools. Small, static, public data: put it in the prompt.",
    },
  },
  {
    stage: "recap",
    point: "The model asks, your code acts. Describe tools well, validate their arguments, scope them to the user, return honest results, limit the loop, and make write tools confirm.",
    title: "Connect it back: order 4471, honestly",
    text: "The chat box invented a dispatch date because it could not see the database and could not say so. Now it has two read tools. Asked about 4471 it calls lookup_order, gets found: false, and says 'I can't find an order 4471 on your account; your most recent order is 4417, which is being made.' The database stays behind Dev's code, scoped to the signed-in customer, and every call is logged.",
    recap: {
      remember: ["A tool is a function you own, described to the model by name, purpose and parameters.", "The model requests; your code validates, runs, and sends the result back; the model answers.", "Descriptions are the model's only guide; write them for the model.", "Scope by session, return only needed fields, cap the loop, make writes confirm and be idempotent."],
      mistakes: ["Adding 'look it up' to the prompt and expecting a lookup.", "Passing the customer id as a tool parameter the model fills in.", "Throwing on a missing order instead of returning found: false.", "Exposing a write tool with no confirmation and no idempotency."],
      production: ["Order status, account details, bookings, stock checks, internal dashboards, code assistants calling the compiler.", "Lesson 3.2 wraps this loop with planning and stop rules to make an agent.", "Lesson 3.3 packages tools as servers any app can use (MCP)."],
      next: ["3.2 Agents: the loop, its limits and its stop button.", "3.3 MCP: tools as servers any app can plug in.", "4.1 Prompt injection: when the tool result tells the model what to do."],
    },
    ask: "Priya's next ask: 'Can it handle a whole return by itself? Check the order, check the policy, book the courier, email the label.' That is several tools, in an order the model decides. Next lesson.",
  },
];

export const A13: Topic = {
  slug: "tool-calling",
  title: "Tool calling: the model asks, your code acts",
  minutes: 18,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain why a model cannot look anything up and how tool calling fixes that.", "Write tool definitions whose descriptions guide the model and whose schemas constrain it.", "Implement the request → run → result loop with validation, scoping, error results and a step limit.", "Separate read tools from write tools and guard writes with confirmation and idempotency."],
  prerequisites: ["first-api-call", "structured-output"],
  story: "A receptionist with a phone. The receptionist cannot walk into the warehouse, but can ring it and ask 'is order 4417 packed?' and relay the answer. Tool calling is the phone, and your code is the warehouse that decides what to say.",
  tldr: [
    "The model cannot run anything. A **tool** lets it **ask** your code to run a function and read the result.",
    "A tool is a **name, a description for the model, and a JSON schema**; the description does most of the work.",
    "The loop: model requests → code **validates, scopes, runs** → result sent back → model answers. **Cap the steps.**",
    "**Read** tools run freely; **write** tools propose, confirm in the UI, and are idempotent and logged.",
  ],
  words: [
    ["tool", "a function your code owns, described to the model so it can ask for it"],
    ["tool use block", "the model's request to run a tool, with arguments as JSON"],
    ["tool result block", "your code's reply carrying the function's output"],
    ["stop reason", "why the model stopped: finished, length limit, or tool requested"],
    ["read tool / write tool", "a tool that only fetches versus one that changes something"],
    ["idempotent", "safe to run twice with the same arguments; the second run changes nothing"],
  ],
  sections: [],
  quiz: [
    { q: "The chat box invents an order's delivery date. What is the fix?", options: ["Add 'always check the database' to the prompt", "Give it a lookup tool and run the query in your code", "Lower the temperature", "Paste the orders table into the prompt"], answer: 1, reason: true, whyOptions: ["The model has no hands; the instruction produces text that sounds like checking.", "Correct. The model asks, your code runs the real query, the result goes back.", "Temperature changes variety, not knowledge.", "Too large, stale, and it exposes every customer's data."], why: "Give the model a way to ask, not an instruction to pretend." },
    { q: "Who runs the function when the model emits a tool use block?", options: ["The model, on the provider's servers", "Your code, after validating the arguments", "The SDK automatically", "The customer's browser"], answer: 1, whyOptions: ["The model only writes the request.", "Correct. Your code owns the function, the validation and the scoping.", "The SDK can help with the loop but the function is still yours.", "Never; the database is behind the server."], why: "The model requests; you act." },
    { q: "Where should the customer id for lookup_order come from?", options: ["A tool parameter the model fills", "The login session on the server", "The customer's message", "The system prompt"], answer: 1, whyOptions: ["Then the model could ask about any customer.", "Correct. Identity comes from the session; the model never chooses it.", "Messages are untrusted text.", "The system prompt is not per-request identity."], why: "Scope in code, from the session." },
  ],
  practice: [
    { q: "Write the description for a check_stock tool that returns how many of a product are in the warehouse. Say when the model should and should not call it.", answer: "'Return the number of units of ONE product currently in stock and the next restock date, by product id. Use when the customer asks whether something is available or when it will be back. Do not use for prices or delivery times; those are in the policy text.' Schema: { product_id: integer }, required, no extra properties.", explain: "What it returns, when to use it, when not to." },
    { q: "The model asks for lookup_order with order_id '4417abc'. What happens in your code and what does the model see?", answer: "Zod rejects it (not an integer); runTool returns { data: 'Tool failed: …order_id must be an integer', error: true }. The model sees an error result and usually re-asks with 4417 or asks the customer to confirm the number. The database is never queried with bad input.", explain: "Validate arguments; return errors as results." },
    { q: "Design cancel_order so it is safe to expose to the chat box.", answer: "The tool returns a proposal: { order_id, refund, eligible: true/false, confirm_token }. The page shows a confirm button; clicking it calls a normal endpoint with the token and the session's customer id, which checks order state (not shipped), cancels idempotently keyed by order id, logs the action, and returns the real outcome. The model never cancels directly.", explain: "Propose in the model; act on a human click." },
  ],
  interview: [
    { level: "junior", q: "What is tool calling?", a: "You describe functions to the model (name, description, parameters). Instead of answering, the model can reply with a request to call one; your code runs the function and sends the result back; the model then answers using it. The model never executes anything itself." },
    { level: "mid", q: "Walk through the loop for 'where is order 4417?'", a: "Send the messages with the tool list. The model replies with a tool use block: lookup_order {order_id: 4417}, stop reason tool_use. Code validates the arguments, queries scoped to the session's customer, returns a tool result with status and ETA. Call again with the history plus the result; the model writes the answer. A step cap stops runaway loops." },
    { level: "mid", tricky: true, q: "If I write 'always check the database before answering' in the system prompt, will the model check it?", a: "No. The model can only produce text; it has no access to anything. The instruction makes it write answers that sound checked. To actually check, give it a tool and run the query in your code when it asks." },
    { level: "mid", q: "What makes a good tool description?", a: "It is written for the model: what the tool returns, when to call it, when not to, and what a 'not found' looks like. The description is the model's only guide for choosing between tools; vague descriptions cause wrong or missing calls. Keep parameters minimal and typed." },
    { level: "senior", q: "How do you keep tool calling safe?", a: "Validate every argument; take identity from the session, never from the model; scope queries to the user; return only needed fields; return errors and not-found as results so the model tells the truth; cap loop steps; separate read from write tools; make writes propose-then-confirm, idempotent and logged; treat tool results as untrusted text (prompt injection)." },
    { level: "mid", tricky: true, q: "The model called lookup_order and got found: false, but still told the customer the order shipped. Is tool calling broken?", a: "No; the model ignored or misread the result, which is a prompt and model problem. Make the result explicit ('No order 4471 exists on this account'), add a rule in the system prompt to report not-found honestly, add an eval case for it (lesson 3.7), and consider a stronger model for the support assistant." },
    { level: "junior", q: "What is the difference between structured output and tool calling?", a: "Same mechanism: the model fills a schema. Structured output forces one schema and your code reads the data. Tool calling offers several schemas, lets the model choose, runs a function for the chosen one and sends the result back so the model can continue." },
    { level: "senior", q: "Design the tools for a flight-booking assistant.", a: "Read tools: search_flights(from, to, date), get_booking(ref) scoped to the user, fare_rules(fare_id). Write tools: hold_seat and book are proposals that the UI confirms; book is idempotent by an idempotency key, checks price still valid, logs everything. Payment is never a model tool; it is a normal checkout flow. Descriptions state units, date formats and when to use each. A step cap and timeouts on every tool." },
    { level: "mid", q: "Why cap the number of loop steps?", a: "A model can keep asking for tools: retrying a failing call, looping between two tools, or over-exploring. Each step costs money and time. A cap (five, ten) returns a safe message to the user and logs the trace so you can fix the prompt or the tool." },
    { level: "mid", q: "What should a tool return?", a: "Compact, accurate data the answer needs: a few fields, not the whole row; explicit not-found; errors marked as errors. No secrets or internal notes, because whatever goes in the result is in the model's context and may be repeated to the user." },
  ],
  remember: [
    "The model asks; your code validates, scopes, runs and replies.",
    "Descriptions are for the model; they decide which tool gets called.",
    "Identity from the session, never from a parameter.",
    "Not found is a result. Writes propose, confirm, and are idempotent.",
  ],
};
