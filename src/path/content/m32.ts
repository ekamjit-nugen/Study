import type { Exercise, LessonBody, Quiz } from "../types";

// Module 32: Agent memory and planning. One concept per lesson.

export const M32_BODIES: Record<string, LessonBody> = {
  "m32-agent-memory": {
    simple: "An agent remembers nothing on its own; its memory is whatever your code stores and puts back in front of the model, in layers with different lifetimes.",
    concept:
      "A model starts every call from nothing. What looks like an agent remembering is the controller sending the right things back: the messages of this run, a summary of what happened earlier, facts saved from previous runs, and results fetched from stores. **Agent memory** is the name for all of that machinery: what is kept, where, for how long, and what is put into the context on each step.\n\nIt helps to think in layers. The run's own messages are the most detailed and the shortest-lived. A summary of them lasts the run but holds less. Facts about the user or the project last across runs. External stores (documents, databases) last indefinitely and are read on demand rather than carried in the context. Each layer answers a different question: what just happened, what happened earlier in this run, what do we know in general, and where can I look it up.\n\nDesigning memory means deciding, for each kind of information, which layer it belongs in and when it leaves.",
    why:
      "Without memory design, agents fail in two opposite ways. They forget: a long run trims early messages and the agent loses the constraint stated at the start. Or they drown: every message is kept, the context fills, cost climbs with every step, and the model's attention spreads thin over pages of old tool output. Either way the decision at step twelve is made without the right information.\n\nMemory is also where agents learn across runs. A research agent that re-discovers the company's preferred sources every morning is wasting steps that a single stored fact would save.",
    how: [
      "Classify each piece of information: this step's result, this run's history, durable facts, or external knowledge.",
      "Keep the recent steps verbatim; they carry the exact details the next decision needs.",
      "Fold older steps into a running summary when the context grows past a budget.",
      "Store durable facts in a keyed store with a source and an expiry; load the relevant ones at the start of a run.",
      "Leave external knowledge where it is and give the agent tools to fetch it.",
      "Rebuild the context from the layers on every step; the model never sees the layers, only the result.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Holds", "Lives for", "Goes into the context as"],
        rows: [
          ["working memory", "the current step's plan, result and reasoning", "one step", "the latest messages"],
          ["short-term memory", "this run's messages and tool results", "the run", "the last N messages, verbatim"],
          ["run summary", "facts and decisions from trimmed messages", "the run", "one summary message"],
          ["long-term memory", "facts across runs: preferences, decisions, learned sources", "weeks to months, with expiry", "a short list in the system prompt"],
          ["external memory", "documents, databases, previous reports", "indefinitely", "fetched by tools when needed"],
        ],
      },
      caption: "Five layers, five lifetimes. The art is moving information down the table at the right moment.",
    },
    everyday: {
      title: "A doctor's three kinds of notes",
      text: "During an appointment a doctor holds the conversation in their head. At the end they write a summary in the file. The file also carries durable facts: allergies, long-term conditions. And the full test results sit in the lab system, pulled up when needed. Nobody expects the doctor to remember every word of every visit; the layers do the remembering. An agent's memory is the same set of layers.",
    },
    engineering: {
      title: "A project-management agent that stopped re-learning",
      text: "A software company's agent triages incoming tickets and drafts responses. At first each run started cold: it would search the codebase to learn which team owned which service, every time, costing six steps. The team added long-term memory: a store of 'service → owning team' facts, learned by the agent and confirmed by a person, loaded into the prompt at the start of each run with their dates. Runs dropped to two steps for the common case, and a monthly expiry on each fact forced a re-check when teams reorganised.",
    },
    useIt: "Before building an agent, draw the memory table for it: what information exists, which layer it belongs in, when it expires. Build the context assembler from the layers rather than appending to one list, and give every stored fact a source and a date.",
    takeaways: ["The model remembers nothing; the controller rebuilds the context every step.", "Layers: working, short-term, run summary, long-term, external.", "Each layer has a lifetime and a place in the context.", "Move information down the layers as it ages; fetch external knowledge with tools."],
    terms: [["agent memory", "everything the controller stores and re-supplies to the model"], ["context assembler", "the code that builds each step's messages from the memory layers"], ["expiry", "the date after which a stored fact is no longer trusted"]],
    reflect: { q: "An agent's context has grown to 60,000 tokens by step 15. Which layer is missing?", a: "The run summary. Old steps are being kept verbatim instead of folded into a summary, so every call re-sends everything. Trim with a summary and the context stays bounded." },
  },

  "m32-short-term-memory": {
    simple: "Short-term memory is the run's own history: the messages, tool calls and results so far, kept verbatim for the recent steps so the next decision has exact details.",
    concept:
      "**Short-term memory** is the list of messages for the current run: the goal, the plan, every tool request, every observation, every piece of reasoning. It is what the model is sent on each step, and it is why the agent can say 'the second search already covered that'.\n\nIts strength is precision. The exact error message, the exact price, the exact file path are all there, word for word. Its weakness is size. Every step adds to it, every call re-sends all of it, and a long run can push it past the context window or into a region where the model's attention is spread too thin to find what matters.\n\nSo short-term memory is kept verbatim only for a window of recent steps. Older steps are either dropped, which loses facts, or folded into a summary, which keeps the facts and drops the wording. The window size is a budget: enough recent detail to act on, few enough tokens to afford on every call.",
    why:
      "The model needs exact details for the next action: the id returned by the last tool, the line number in the last error. Paraphrasing those costs accuracy. But the model does not need the exact wording of step one by step twenty, only what step one established. Keeping everything verbatim is the single most common reason agent runs become slow and expensive.\n\nA bounded verbatim window with a summary behind it gives both: precision where it matters, compactness where it does not.",
    how: [
      "Append every message, tool request and observation to the run's history as it happens; this is the source of truth and is stored, not only held in RAM.",
      "Choose a window: the last N messages or the last T tokens, say 12 messages or 8,000 tokens.",
      "On each step, send the goal, the plan, the summary of anything older than the window, and the window verbatim.",
      "When the window overflows, fold the oldest messages into the summary before dropping them from the window.",
      "Keep tool results compact at the source so the window holds more steps for the same tokens.",
    ],
    visual: {
      kind: "flow",
      steps: ["goal + plan (always)", "summary of steps 1–8", "steps 9–14 verbatim", "the new step", "model call"],
      caption: "What the model sees at step 15. The full history is stored; only the recent window travels with each call.",
    },
    everyday: {
      title: "The last few minutes of a conversation",
      text: "In a long meeting you remember the last few exchanges word for word and the earlier hour as a gist: 'we agreed the deadline, Sam objected to the budget'. You could not repeat Sam's sentence, but you know the point. That split, exact for recent and gist for older, is exactly how short-term memory and the run summary divide the work.",
    },
    engineering: {
      title: "A coding agent's window, measured",
      text: "A developer-tools team measured their coding agent's context over 500 runs. Tool outputs (test logs, file contents) were 80% of tokens; the model's own reasoning was 15%. Keeping all of it verbatim, step 20 sent 90,000 tokens. They set a window of the last 10 messages, truncated file reads to the relevant region, and folded older steps into a summary that listed files changed and test status. Step 20 now sends 18,000 tokens, and the agent's fix rate rose slightly, because the error it was working on was no longer buried under twenty old logs.",
    },
    code: {
      title: "A verbatim window with a token budget",
      lang: "ts",
      src: `const WINDOW_TOKENS = 8000;

export function recentWindow(history: Message[]): { window: Message[]; older: Message[] } {
  let used = 0;
  let i = history.length;
  while (i > 0 && used + countTokens(history[i - 1]) <= WINDOW_TOKENS) {
    used += countTokens(history[i - 1]);
    i--;
  }
  // never split a tool request from its result: back up to a user-role boundary
  while (i > 0 && i < history.length && history[i].role !== "user") i--;
  return { window: history.slice(i), older: history.slice(0, i) };
}`,
      lines: [
        { code: "const WINDOW_TOKENS = 8000;", say: "The budget for verbatim history. Tune it from traces; 8,000 tokens suits most tool-heavy agents." },
        { code: "while (i > 0 && used + countTokens(history[i - 1]) <= WINDOW_TOKENS) {", say: "Walk backwards from the newest message until the budget is spent." },
        { code: "while (i > 0 && i < history.length && history[i].role !== \"user\") i--;", say: "A tool request and its result must stay together; the cut moves to a clean boundary." },
        { code: "return { window: history.slice(i), older: history.slice(0, i) };", say: "Two lists: the window travels with the call; the older part is summarised." },
      ],
    },
    useIt: "Give every agent a stored history and a bounded verbatim window. Measure what fills the window; it is usually tool output, which is cheaper to trim at the tool than to carry. Pair the window with a run summary so nothing established is lost.",
    takeaways: ["Short-term memory is the run's message history; the model needs its exact details for recent steps.", "Kept whole in storage; sent as a bounded window.", "Never split a tool request from its result.", "Trim tool outputs at the source to fit more steps in the window."],
    terms: [["short-term memory", "the current run's message history"], ["verbatim window", "the recent messages sent exactly as written"], ["token budget", "the maximum tokens the window may use per call"]],
    reflect: { q: "Why store the full history if only the window is sent?", a: "For people and for recovery. The full history is the trace you debug from, the record you audit, and the state you resume from after a pause or a crash. The window is for the model; the store is for everyone else." },
  },

  "m32-long-term-memory": {
    simple: "Long-term memory is what the agent keeps between runs: a small set of facts with a source and an expiry, loaded when relevant, visible and deletable.",
    concept:
      "Some things are worth knowing next week: the user prefers short answers, the finance team owns the billing service, the client's fiscal year ends in March. **Long-term memory** is a store of such facts, written at the end of a run and read at the start of later ones. It is not the message history; it is distilled.\n\nEach fact carries where it came from, when it was learned, and when it stops being trusted. At the start of a run the controller loads the facts relevant to the goal and the user and puts them in the system prompt under a heading that says they may be out of date. The model treats them as context to confirm, not truths to assume.\n\nLong-term memory must stay small. Hundreds of facts become noise; five relevant ones are a head start. Extraction is selective, and facts the agent can look up live are not stored at all.",
    why:
      "Agents that start every run from zero waste steps rediscovering the same things, and they annoy people by asking what they were told last week. Agents that store everything become unpredictable: a stale fact from three months ago shapes today's decision, and nobody knows why.\n\nA deliberate long-term memory fixes both: few facts, each with provenance and a shelf life, shown to the person and removable. The same design keeps memory within privacy rules, which matters as soon as the facts are about people.",
    how: [
      "At the end of a run, ask the model to propose durable facts: preferences, decisions, learned mappings. Use structured output with a small schema and a confidence field.",
      "Keep only confident facts of allowed kinds; never store secrets, credentials or sensitive personal data.",
      "Store each with its text, kind, source (which run, which message), created date and expiry.",
      "At the start of a run, select facts by user, project and relevance to the goal; load at most a handful.",
      "Show the facts to the person in a settings page; let them delete any.",
      "Expire facts automatically; a fact re-confirmed by a later run gets a new expiry.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Run ends", detail: "the agent fixed a build by learning that the service uses pnpm, not npm" },
        { label: "Extract", detail: "{ text: 'repo acme/api uses pnpm', kind: 'project_fact', confidence: 0.95 }" },
        { label: "Store", detail: "source: run 8812, step 4; created 2026-11-05; expires 2027-02-05" },
        { label: "Next run", detail: "system prompt: 'Known (may be outdated): repo acme/api uses pnpm (learned 2026-11-05)'" },
        { label: "Confirm or correct", detail: "the agent runs pnpm install directly; if it fails, the fact is marked wrong" },
      ],
      caption: "One fact saves three exploratory steps on every later run, and it carries its own date and source.",
    },
    everyday: {
      title: "The notes a good assistant keeps",
      text: "A personal assistant keeps a short page of facts about you: tea not coffee, no meetings before ten, the dentist is Dr Rao. They do not transcribe every conversation. When something changes, they cross it out. If you asked to see the page, you could. Long-term memory for an agent is that page, with dates on every line.",
    },
    engineering: {
      title: "Memory with provenance in a research assistant",
      text: "A consultancy's research agent serves forty analysts. Early on it stored free-text 'memories' and analysts started seeing odd assumptions: 'the client prefers European sources' had been learned from one analyst's run and applied to everyone. The rebuild scoped every fact to a user or a project, typed it (preference, source rule, client fact), attached the run it came from, set a 90-day expiry, and added a settings page listing each analyst's facts with a delete button. Odd assumptions stopped, and the page itself became popular: analysts used it to check what the agent believed.",
    },
    code: {
      title: "Extracting a few typed facts at the end of a run",
      lang: "ts",
      src: `const Facts = z.object({
  facts: z.array(z.object({
    text: z.string().max(140),
    kind: z.enum(["preference", "project_fact", "decision", "source_rule"]),
    confidence: z.number().min(0).max(1),
  })).max(4),
});

export async function rememberFromRun(run: Run): Promise<Fact[]> {
  const reply = await client.messages.create({
    model: process.env.MODEL_SMALL!,
    max_tokens: 400,
    temperature: 0,
    system: "From this agent run, list up to 4 facts worth remembering for future runs: user preferences, stable project facts, decisions, rules about sources. Never include secrets, credentials or personal data. Skip anything uncertain or already available by lookup.",
    tools: [factsTool],
    tool_choice: { type: "tool", name: "record_facts" },
    messages: [{ role: "user", content: transcriptOf(run) }],
  });
  const parsed = Facts.safeParse(reply.content.find((b) => b.type === "tool_use")?.input);
  if (!parsed.success) return [];
  return parsed.data.facts
    .filter((f) => f.confidence >= 0.85)
    .map((f) => ({ ...f, scope: run.userId, source: "run " + run.id, createdAt: today(), expiresAt: inDays(90) }));
}`,
      lines: [
        { code: "})).max(4),", say: "At most four facts per run. Memory that grows without limit becomes noise." },
        { code: "kind: z.enum([\"preference\", \"project_fact\", \"decision\", \"source_rule\"]),", say: "Only allowed kinds. Anything else, including personal data, has no slot." },
        { code: "system: \"From this agent run, list up to 4 facts worth remembering for future runs: user preferences, stable project facts, decisions, rules about sources. Never include secrets, credentials or personal data. Skip anything uncertain or already available by lookup.\",", say: "Selective by instruction: durable, not lookup-able, not sensitive." },
        { code: ".filter((f) => f.confidence >= 0.85)", say: "Low-confidence facts are dropped. A guessed preference is worse than none." },
        { code: ".map((f) => ({ ...f, scope: run.userId, source: \"run \" + run.id, createdAt: today(), expiresAt: inDays(90) }));", say: "Scoped, sourced, dated, expiring. Every fact can be explained and will lapse." },
      ],
    },
    useIt: "Add long-term memory once an agent runs repeatedly for the same people or projects. Keep it typed, scoped, sourced, expiring and visible. Load a handful of relevant facts per run and instruct the model to confirm before relying on them.",
    takeaways: ["Long-term memory is distilled facts across runs, not transcripts.", "Each fact: kind, scope, source, date, expiry; shown and deletable.", "Store only durable, non-sensitive facts that cannot be looked up live.", "Load a few relevant facts per run; tell the model they may be stale."],
    terms: [["long-term memory", "facts kept across runs"], ["provenance", "where and when a fact was learned"], ["scope", "the user or project a fact applies to"]],
    reflect: { q: "Should the agent remember that a customer's current open ticket is #4471?", a: "No. The ticket is live data; a tool can read it and it will be correct. Memory is for things that are stable and not otherwise reachable. Storing live data makes it stale the moment it changes." },
  },

  "m32-working-memory": {
    simple: "Working memory is the small set of things the agent is actively using right now: the current plan step, the last result, and the variables it is carrying between steps.",
    concept:
      "Between the full history and the long-term store there is a third thing: what the agent is working with at this moment. The current plan step, the id returned two steps ago that the next call needs, the running list of sources found so far. This is **working memory**: small, structured, and rebuilt or updated every step.\n\nIn a plain loop, working memory is implicit: the model re-reads the whole history and hopes to find the id. That works until the history is long or the id is buried in a big tool result. Explicit working memory makes it reliable: the controller keeps a small state object (current step, collected items, pending questions) and renders it at the top of the context every call, so the model does not have to search for it.\n\nThe model can update working memory through a tool ('note: source 3 is unreliable') and the controller keeps it between steps. It is the agent's scratchpad.",
    why:
      "Models are good at reading what is in front of them and bad at finding one number in forty pages of history. Agents that carry state only in the history lose it: they repeat a search because the earlier result scrolled out of the window, or they use the wrong id because two similar ones appear in old results. An explicit scratchpad puts the few live values where the model will see them on every step.\n\nIt also makes runs resumable and inspectable: the state object tells a person exactly where the agent is.",
    how: [
      "Define a small state shape for the agent: current plan step, items collected so far, open questions, key ids.",
      "Render the state as a compact block at the start of each call, after the goal and plan.",
      "Give the model a tool to update the state: add an item, mark a step done, record a key value.",
      "Have the controller update it automatically where it can: step counters, ids returned by tools.",
      "Persist the state with the run so a pause or crash resumes from it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Working memory field", "Example value", "Who updates it"],
        rows: [
          ["plan_step", "3 of 5: fetch the press release", "controller, when the model marks a step done"],
          ["sources_found", "[{url, title, date}] × 3", "model, via add_source tool"],
          ["key_ids", "{ hold_id: 'H-99', calendar_event: 'ev_12' }", "controller, from tool results"],
          ["open_questions", "['is the March date confirmed?']", "model"],
          ["budget_left", "7 steps, £0.21", "controller"],
        ],
      },
      caption: "A few fields, always visible, always current. The history is where they came from; this is where they live now.",
    },
    everyday: {
      title: "The sticky note on the monitor",
      text: "While debugging you keep a sticky note: the request id, the three things you have ruled out, the one thing to try next. You could re-derive all of it from your terminal scrollback, but you would not, because the note is faster and you trust it. The agent's working memory is the sticky note, rewritten every step.",
    },
    engineering: {
      title: "A travel agent that stopped losing the hold",
      text: "A travel start-up's booking agent would place a 30-minute hold on a flight, continue checking hotels, and then, at the booking step, search the flight again because the hold id was buried under hotel results. Sometimes it placed a second hold. The fix was a state block rendered at the top of every call: current holds with their expiry times, the chosen flight, the chosen hotel, the step in the plan. Double holds disappeared, and runs got shorter because the model stopped re-reading old results to find what it already had.",
    },
    code: {
      title: "A state block rendered every step",
      lang: "ts",
      src: `type State = { planStep: number; planTotal: number; holds: { id: string; expires: string }[]; chosen: Record<string, string>; questions: string[] };

function renderState(s: State, budget: BudgetLeft): string {
  return [
    "<state>",
    "plan step: " + s.planStep + " of " + s.planTotal,
    "holds: " + (s.holds.length ? s.holds.map((h) => h.id + " (expires " + h.expires + ")").join(", ") : "none"),
    "chosen: " + JSON.stringify(s.chosen),
    "open questions: " + (s.questions.join("; ") || "none"),
    "budget left: " + budget.steps + " steps, £" + budget.cost.toFixed(2),
    "</state>",
  ].join("\\n");
}

// the controller keeps ids the model would otherwise have to dig for
function afterTool(state: State, name: string, result: any) {
  if (name === "hold_flight" && result.hold_id) state.holds.push({ id: result.hold_id, expires: result.expires });
  if (name === "mark_step_done") state.planStep = Math.min(state.planTotal, state.planStep + 1);
}`,
      lines: [
        { code: "\"holds: \" + (s.holds.length ? s.holds.map((h) => h.id + \" (expires \" + h.expires + \")\").join(\", \") : \"none\"),", say: "The live holds, with expiry, in one line the model cannot miss." },
        { code: "\"budget left: \" + budget.steps + \" steps, £\" + budget.cost.toFixed(2),", say: "The model is told how much room it has; it plans differently with two steps left than with twenty." },
        { code: "if (name === \"hold_flight\" && result.hold_id) state.holds.push({ id: result.hold_id, expires: result.expires });", say: "The controller captures the id from the tool result; the model never has to find it in the history." },
        { code: "if (name === \"mark_step_done\") state.planStep = Math.min(state.planTotal, state.planStep + 1);", say: "A tiny tool lets the model advance the plan; the controller keeps the count honest." },
      ],
    },
    useIt: "Give any agent that carries ids, collections or a multi-step plan an explicit state block. Let the controller fill what it can from tool results; let the model update the rest through small tools. Persist the state with the run.",
    takeaways: ["Working memory is the handful of live values the next step needs.", "Rendered at the top of every call, so the model reads it instead of searching history.", "Updated by the controller from tool results and by the model through small tools.", "Persisted with the run for resume and inspection."],
    terms: [["working memory", "the small, structured state an agent is actively using"], ["state block", "the rendered working memory placed in the context each step"], ["scratchpad", "a place the model can write notes to itself between steps"]],
    reflect: { q: "Why not just put everything in the state block and drop the history?", a: "Because the state block is a summary of live values, not evidence. The history holds the actual results, errors and reasoning the model may need to re-examine and that people need to audit. Keep both; keep the state small." },
  },

  "m32-conversation-memory": {
    simple: "Conversation memory lets an agent continue a dialogue across turns and sessions: the messages are stored per conversation, resumed on return, and summarised when long.",
    concept:
      "Many agents are conversational: a person talks to them over minutes, days or weeks. **Conversation memory** is the storage and retrieval of that dialogue so the agent can continue it: 'as I said yesterday' works because yesterday's messages are in a store keyed by the conversation, not in a browser tab.\n\nIt is short-term memory with persistence and identity. Each conversation has an id and an owner; its messages are stored as they happen; when the person returns, from any device, the controller loads the conversation and builds the context from it. Long conversations get the same treatment as long runs: a verbatim window plus a rolling summary of older turns.\n\nThe agent's tool calls inside a conversation are part of it, but they are usually summarised more aggressively than the person's words: the person's requests matter for weeks, the search results from Tuesday do not.",
    why:
      "A dialogue that resets every session is a form with extra steps. People expect to continue; an agent that cannot makes them repeat context and loses the decisions already made. Storing conversations also makes them reviewable: a support lead can read what was said, and an agent can be evaluated on real dialogues.\n\nThe risk is the other direction: conversations are personal, they accumulate, and a bug that loads the wrong one leaks one person's words into another's chat. Conversation memory needs ownership checks and retention rules from day one.",
    how: [
      "Create a conversation record with an id, the owner, and timestamps.",
      "Append every message and tool exchange as it happens, in order.",
      "On each turn, load the conversation by id after checking the requester owns it.",
      "Build the context: durable facts, the rolling summary, the recent window verbatim.",
      "When the window overflows, fold the oldest turns into the summary, keeping the person's requests and decisions and dropping stale tool output.",
      "Archive or delete conversations by a retention rule; let the owner delete at will.",
    ],
    visual: {
      kind: "flow",
      steps: ["Tuesday, laptop: 'find me a Berlin hotel near the venue'", "stored: conversation c-812, messages 1–14", "Thursday, phone: 'go with the second one'", "load c-812 (owner check) → summary + last 12 turns", "the agent knows which 'second one'"],
      caption: "Continuity comes from the store and the owner check, not from the model.",
    },
    everyday: {
      title: "Picking up a phone call where you left off",
      text: "When a friend calls back after being cut off, you both continue without re-explaining, because you each remember the call. If one of you had amnesia, the second call would start from 'hello, who is this?'. Conversation memory is the agent's cure for amnesia between sessions: the store remembers so the model does not have to.",
    },
    engineering: {
      title: "A procurement assistant across a two-week negotiation",
      text: "A manufacturing company's procurement assistant helps buyers negotiate with suppliers over days. Each supplier thread is a conversation with its own id; messages, supplier quotes and the agent's tool lookups are stored in it. The context on each turn is: buyer facts (approval limits), a summary of the thread so far (quotes received, positions taken), and the last ten turns verbatim. Quotes from last week are in the summary as numbers; the long email that carried them is not. Buyers switch between laptop and phone without noticing, and auditors can read any thread end to end.",
    },
    code: {
      title: "Loading a conversation safely and building the context",
      lang: "ts",
      src: `export async function contextFor(conversationId: string, requesterId: string) {
  const conv = await conversations.get(conversationId);
  if (!conv || conv.ownerId !== requesterId) throw new NotFound();        // never leak another person's thread

  const { window, older } = recentWindow(conv.messages);
  if (older.length > conv.summarisedUpTo) {
    conv.summary = await foldIntoSummary(conv.summary, older.slice(conv.summarisedUpTo));
    conv.summarisedUpTo = older.length;
    await conversations.save(conv);
  }

  const facts = await longTermMemory.forUser(requesterId, 5);
  const system = SYSTEM_PROMPT + "\\n\\nKnown about this user (may be out of date):\\n" + facts.map((f) => "- " + f.text).join("\\n");
  const messages = [];
  if (conv.summary) messages.push({ role: "user", content: "<earlier_in_this_conversation>\\n" + conv.summary + "\\n</earlier_in_this_conversation>" }, { role: "assistant", content: "Understood." });
  messages.push(...window);
  return { system, messages };
}`,
      lines: [
        { code: "if (!conv || conv.ownerId !== requesterId) throw new NotFound();        // never leak another person's thread", say: "The owner check comes first. A wrong id returns not found, never someone else's conversation." },
        { code: "conv.summary = await foldIntoSummary(conv.summary, older.slice(conv.summarisedUpTo));", say: "Only turns not yet summarised are folded in, so the summary call stays small." },
        { code: "const facts = await longTermMemory.forUser(requesterId, 5);", say: "A few durable facts about the person join the context, labelled as possibly stale." },
        { code: "if (conv.summary) messages.push({ role: \"user\", content: \"<earlier_in_this_conversation>\\n\" + conv.summary + \"\\n</earlier_in_this_conversation>\" }, { role: \"assistant\", content: \"Understood.\" });", say: "The summary enters as a delimited exchange so the model treats it as context, not as the person's latest words." },
      ],
    },
    useIt: "Store conversations per owner with ownership checks, build the context from summary plus window plus facts, and set retention. Summarise tool output harder than the person's words. Test that one user can never load another's conversation.",
    takeaways: ["Conversation memory = stored, owned, resumable dialogue.", "Context per turn: facts, rolling summary, recent window.", "The person's requests and decisions survive summarisation; stale tool output does not.", "Ownership checks and retention are part of the design, not an afterthought."],
    terms: [["conversation memory", "stored dialogue that can be resumed across sessions and devices"], ["rolling summary", "a summary updated as older turns leave the window"], ["retention rule", "how long conversations are kept before deletion"]],
    reflect: { q: "A person asks the agent to forget this conversation. What must happen?", a: "Delete the messages, the summary and any facts extracted from it, and purge any cached contexts. A deletion that leaves the summary or the facts behind is not a deletion." },
  },

  "m32-external-memory": {
    simple: "External memory is knowledge kept outside the context in stores the agent can search: documents, databases, past runs. The agent fetches what it needs instead of carrying everything.",
    concept:
      "The context window is small and expensive; the world's information is large and cheap to store. **External memory** is everything the agent can reach through tools rather than through its messages: a document index, a database, a vector store of past conversations, a filesystem. The agent does not remember these things; it knows how to look them up.\n\nThe pattern is retrieval on demand. The agent decides it needs the returns policy, calls a search tool, gets the three relevant passages, and reasons with them for a step or two. Then they fall out of the window and the knowledge is back in the store, where it stays current. This is retrieval-augmented generation applied inside an agent loop, with the agent choosing when to retrieve.\n\nPast runs can be external memory too: index previous reports or solved tickets, and a new run can find 'how did we handle this last time' without any of it living in long-term facts.",
    why:
      "Carrying knowledge in the context does not scale: it costs tokens on every step, it goes stale, and it cannot hold a company's documents. Storing it as long-term facts does not scale either: thousands of facts are noise. External memory is how agents know a lot without paying for all of it on every call, and how they stay current, because the store is the source of truth.\n\nIt also keeps memory governable: documents in a store have owners, permissions and versions; the same facts pasted into prompts have none.",
    how: [
      "Put knowledge where it lives best: documents in a searchable index, records in a database, past runs in an archive with embeddings.",
      "Give the agent a search tool per store, with a description that says what the store holds and when to use it.",
      "Filter by permission in the store's query, so the agent can only retrieve what the user may see.",
      "Return compact passages with ids and dates, enough to reason with, not whole documents.",
      "Let retrieved passages leave the window naturally; the store remains the source of truth.",
      "Cite what was retrieved in the final output so people can check it.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Carried in context", points: ["Paste the manual into the prompt", "Costs tokens every step", "Stale when the manual changes", "Cannot hold more than the window", "No permissions"] },
      right: { title: "External memory", points: ["Index the manual; a search tool", "Costs tokens only when retrieved", "Current: the store is the truth", "Unlimited size", "Permissions enforced in the query"] },
      caption: "The agent learns where to look, not what to carry.",
    },
    everyday: {
      title: "Knowing which shelf, not every page",
      text: "A good librarian does not memorise the books. They know the catalogue: which shelf has building regulations, which drawer has last year's maps. Asked a question, they fetch the right volume, find the page, and put it back. An agent with external memory is a librarian with a catalogue of search tools.",
    },
    engineering: {
      title: "An incident agent that reads past incidents",
      text: "A payments company's incident agent investigates alerts. Its external memory has three stores: runbooks (a document index), service metadata (a database), and past incident reports (an archive indexed by embeddings). When an alert fires, the agent searches past incidents for similar symptoms first; in a third of cases it finds a report from months ago with the fix. The reports are never in the prompt by default; the agent retrieves two or three when the symptoms match. When the team rewrites a runbook, the next run reads the new version, because nothing was copied anywhere.",
    },
    code: {
      title: "A search tool over past runs",
      lang: "ts",
      src: `const searchPastIncidents: Tool = {
  name: "search_past_incidents",
  kind: "read",
  description: "Find past incident reports with similar symptoms. Use before investigating from scratch. Returns up to 3 reports with id, date, summary and the fix applied. Returns found: 0 if nothing similar exists.",
  schema: z.object({ symptoms: z.string().max(500) }),
  async run({ symptoms }, ctx) {
    const [vector] = await embed([symptoms], "query");
    const hits = await archive.nearest(vector, { limit: 3, where: { team: ctx.user.team } });   // permission in the query
    return { found: hits.length, reports: hits.map((h) => ({ id: h.id, date: h.date, summary: h.summary.slice(0, 600), fix: h.fix })) };
  },
};`,
      lines: [
        { code: "description: \"Find past incident reports with similar symptoms. Use before investigating from scratch. Returns up to 3 reports with id, date, summary and the fix applied. Returns found: 0 if nothing similar exists.\",", say: "The model learns what this store holds and when to reach for it." },
        { code: "const [vector] = await embed([symptoms], \"query\");", say: "Search by meaning: symptoms described differently still find the same past incident." },
        { code: "const hits = await archive.nearest(vector, { limit: 3, where: { team: ctx.user.team } });   // permission in the query", say: "The user's team scopes the search inside the store. Retrieval cannot return what they may not see." },
        { code: "return { found: hits.length, reports: hits.map((h) => ({ id: h.id, date: h.date, summary: h.summary.slice(0, 600), fix: h.fix })) };", say: "Compact passages with ids and dates: enough to reason and to cite." },
      ],
    },
    useIt: "Move any body of knowledge larger than a page out of prompts and into a store with a search tool. Index past runs so the agent can learn from history without storing facts. Put permissions in the query, return compact passages, and cite them.",
    takeaways: ["External memory is knowledge reached by tools, not carried in context.", "Retrieval on demand keeps context small and knowledge current.", "Past runs, indexed, let agents reuse solutions.", "Permissions live in the store's query; outputs cite what was retrieved."],
    terms: [["external memory", "stores the agent searches with tools instead of carrying in context"], ["retrieval on demand", "fetching knowledge only when a step needs it"], ["archive", "an indexed store of past runs or reports"]],
    reflect: { q: "The agent retrieved a runbook passage at step 3 and needs it again at step 11 after it left the window. What should happen?", a: "It retrieves again; that is cheap and guarantees the current version. If this happens often, the passage belongs in working memory for the run (a 'pinned passages' field), not in long-term facts." },
  },

  "m32-planning-strategies": {
    simple: "There are several ways an agent can plan: all at once up front, one step at a time, or a mix that plans a few steps ahead and replans as results arrive. Each suits different tasks.",
    concept:
      "Planning is not one technique. **Plan-then-execute** writes the whole plan first and follows it, which suits predictable tasks and lets a person approve the plan. **Step-by-step** (the ReAct style, covered fully in Module 33) chooses each action from the latest result, which suits exploratory tasks where the next step cannot be known. **Rolling plans** keep a short plan of the next two or three steps and extend it as results come in, a middle ground that handles surprises without losing the thread.\n\nTwo more strategies help with hard goals. **Decomposition** splits a large goal into sub-goals, each planned on its own. **Multiple candidate plans** ask the model for two or three plans and pick the cheapest or most likely, which costs a few extra tokens and avoids committing to a bad first idea.\n\nThe choice is a design decision per agent, made by how predictable the task is and how expensive a wrong step would be.",
    why:
      "A single strategy fails somewhere. Plan-then-execute wastes effort when the first result changes everything. Pure step-by-step drifts and forgets. The expensive mistakes come from mismatches: a fully planned agent in an exploratory task follows a plan that step two proved wrong; a step-by-step agent in a predictable task spends ten steps on what a plan would have done in four.\n\nNaming the strategies lets you pick deliberately and lets a person reading a trace understand why the agent behaved as it did.",
    how: [
      "Ask how predictable the task is: can the steps be listed before starting? Mostly yes → plan-then-execute.",
      "Ask how expensive a wrong step is: high → plan up front and show the plan for approval.",
      "Ask how much the first results change the picture: a lot → rolling plan or step-by-step.",
      "For large goals, decompose into sub-goals and plan each one with the strategy that fits it.",
      "Log which strategy was used and compare success and cost per strategy across runs.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Strategy", "How it works", "Fits", "Risk"],
        rows: [
          ["plan-then-execute", "full plan first, then follow it", "predictable tasks; approvals needed", "follows a plan the first result invalidated"],
          ["step-by-step (ReAct)", "choose each action from the latest result", "exploration, debugging", "drift; forgetting the goal"],
          ["rolling plan", "plan 2–3 steps, extend as results arrive", "most real tasks", "slightly more tokens"],
          ["decomposition", "split into sub-goals, plan each", "large goals", "sub-goals that overlap or conflict"],
          ["candidate plans", "write 2–3 plans, pick one", "costly tasks", "extra planning tokens"],
        ],
      },
      caption: "Pick by predictability and the cost of a wrong step. Most production agents use a rolling plan with decomposition for big goals.",
    },
    everyday: {
      title: "Three ways to plan a day of errands",
      text: "Some days you write the full route in the morning and follow it: post office, bank, shops. Some days you just do the next thing and see. Most days you plan the next two stops and adjust when the bank has a queue. Big days, like moving house, you split into chunks (kitchen, bedroom, van) and plan each. Nobody uses one method for everything; agents should not either.",
    },
    engineering: {
      title: "A migration agent that chose its strategy by task",
      text: "A SaaS company built an agent to migrate customer integrations to a new API. The migration had two phases. Phase one, inventory (list every integration, its version, its owner), was predictable: plan-then-execute, with the plan shown to the integrations lead. Phase two, fixing each integration, was exploratory: each one failed differently. The agent used a rolling plan per integration: inspect, plan two steps, act, replan. Traces showed phase one at four steps per run with no replans, phase two at nine steps with two or three replans each, and the team could see at a glance which phase a slow run was in.",
    },
    code: {
      title: "A rolling plan: extend as results arrive",
      lang: "ts",
      src: `const ROLLING_SYSTEM = [
  "You work toward the goal with a rolling plan.",
  "Keep a plan of the next 2 or 3 steps in your <plan> block.",
  "After each observation, update the plan: remove done steps, add new ones if the result changed the picture, and say why in one line.",
  "Then take exactly one action.",
].join(" ");

function renderPlan(plan: string[]) {
  return "<plan>\\n" + plan.map((s, i) => (i + 1) + ". " + s).join("\\n") + "\\n</plan>";
}

// the model updates the plan through a tool, so the controller can log every change
const updatePlan: Tool = {
  name: "update_plan",
  kind: "read",
  description: "Replace the rolling plan with the next 2 or 3 steps. Call after each observation, before acting.",
  schema: z.object({ steps: z.array(z.string()).min(1).max(3), reason: z.string().max(200) }),
  async run({ steps, reason }, ctx) {
    ctx.state.plan = steps;
    await ctx.log.write({ step: ctx.step, planChanged: steps, reason });
    return { ok: true };
  },
};`,
      lines: [
        { code: "\"Keep a plan of the next 2 or 3 steps in your <plan> block.\",", say: "Short horizon: enough to keep the thread, short enough to change cheaply." },
        { code: "\"After each observation, update the plan: remove done steps, add new ones if the result changed the picture, and say why in one line.\",", say: "Replanning is expected and explained, so the trace shows why the path changed." },
        { code: "schema: z.object({ steps: z.array(z.string()).min(1).max(3), reason: z.string().max(200) }),", say: "The plan is structured data, not prose, so the controller can log and compare it." },
        { code: "await ctx.log.write({ step: ctx.step, planChanged: steps, reason });", say: "Every plan change is a log line. Runs with many changes are the ones to inspect." },
      ],
    },
    useIt: "Choose a strategy per agent, or per phase: plan-then-execute where steps are predictable or approval is needed; a rolling plan for most tasks; decomposition for big goals. Log the strategy and plan changes so you can compare them.",
    takeaways: ["Plan-then-execute, step-by-step, rolling plans, decomposition, candidate plans.", "Choose by predictability and the cost of a wrong step.", "Rolling plans handle surprises without losing the thread.", "Log plan changes; they explain the run."],
    terms: [["plan-then-execute", "write the whole plan first, then follow it"], ["rolling plan", "a short plan of the next few steps, extended as results arrive"], ["candidate plans", "several plans drafted, one chosen"]],
    reflect: { q: "An agent fixes CI failures. Which strategy for 'find which commit broke the build' and which for 'write the fix'?", a: "Finding the commit is predictable (bisect, read the diff): plan-then-execute. Writing the fix is exploratory (edit, test, see what else breaks): rolling plan. One agent, two phases, two strategies." },
  },

  "m32-task-decomposition": {
    simple: "Task decomposition breaks a big goal into smaller sub-goals that can each be planned, run, checked and sometimes delegated on their own.",
    concept:
      "'Produce a competitor report' is too large to plan step by step; the plan would be thirty lines and wrong by step five. **Task decomposition** splits it: list the competitors, gather pricing for each, gather recent news for each, write a section per competitor, write the summary. Each sub-goal is small enough to plan properly, has a clear output, and can be checked when it finishes.\n\nDecomposition produces a tree: the goal at the root, sub-goals below, and at the leaves the tasks an agent can do in a few steps. The tree is a plan with structure, and it gives the controller places to do useful things: run independent branches in parallel, check each leaf's output before moving on, retry one branch without redoing the others, or hand a branch to a different agent.\n\nThe model does the splitting, usually in one call at the start, and may split further when a sub-goal turns out to be large.",
    why:
      "Long flat plans fail because errors compound: a mistake at step three corrupts everything after it, and the model cannot tell where things went wrong. Sub-goals with their own outputs isolate failures: the pricing branch failed, the news branch did not, retry pricing. They also make progress visible (three of five sections done) and allow parallelism, which turns a forty-minute run into ten.\n\nDecomposition is also how agents stay within context budgets: each sub-goal runs with its own short history instead of one history for the whole job.",
    how: [
      "Ask the model to split the goal into 3 to 7 sub-goals, each with an expected output and a note on dependencies.",
      "Check the split: do the sub-goals cover the goal, and do any overlap or conflict?",
      "Run independent sub-goals as separate runs, in parallel where possible, each with its own budget and short history.",
      "Validate each sub-goal's output against its expected shape before using it.",
      "Combine the outputs in a final step: usually a synthesis call that reads the sub-results and writes the deliverable.",
      "Retry or replan a single failed sub-goal without restarting the rest.",
    ],
    visual: {
      kind: "tree",
      root: "Competitor report for the board",
      children: [
        { label: "1. List competitors (3 steps)", children: ["output: 5 names with websites"] },
        { label: "2. Pricing per competitor (parallel ×5)", children: ["output per competitor: plans and prices with source"] },
        { label: "3. News per competitor (parallel ×5)", children: ["output per competitor: 3 items from the last 90 days"] },
        { label: "4. Write sections (depends on 2 and 3)", children: ["output: 5 sections, 150 words each"] },
        { label: "5. Summary and recommendations", children: ["output: 300 words citing sections"] },
      ],
      caption: "A tree instead of a list. Branches 2 and 3 run in parallel; a failed pricing lookup is retried alone.",
    },
    everyday: {
      title: "Cooking a three-course dinner",
      text: "Nobody plans a dinner party as one list of ninety steps. You split it: starter, main, dessert, table. Dessert can be made the day before; the main's sauce can simmer while you plate the starter. If the dessert fails, you buy ice cream and the main is unaffected. That is decomposition with parallel branches and isolated failures.",
    },
    engineering: {
      title: "Due diligence in parallel",
      text: "An investment firm's agent produces first-pass due-diligence memos. The goal is split into company facts, market, financials, risks and team, each a sub-goal with a required output schema. The five run in parallel with their own budgets; the financials branch is allowed more steps and a stronger model. A synthesis step writes the memo from the five validated outputs. When the market branch fails (a paywalled source), only it is retried with a different source list, and the memo still ships within the hour. The firm's analysts review the memo section by section, which the decomposition made natural.",
    },
    code: {
      title: "Split, run branches, synthesise",
      lang: "ts",
      src: `const Split = z.object({
  subgoals: z.array(z.object({
    id: z.string(),
    goal: z.string(),
    expectedOutput: z.string(),
    dependsOn: z.array(z.string()).default([]),
  })).min(2).max(7),
});

export async function runDecomposed(goal: string, tools: Tool[]) {
  const split = Split.parse(await structured(SPLIT_PROMPT, goal, Split));
  const results: Record<string, unknown> = {};
  const pending = new Set(split.subgoals.map((s) => s.id));

  while (pending.size > 0) {
    const ready = split.subgoals.filter((s) => pending.has(s.id) && s.dependsOn.every((d) => d in results));
    if (ready.length === 0) throw new Error("dependency cycle in decomposition");
    const outs = await Promise.all(ready.map((s) => runAgent(s.goal + "\\nExpected output: " + s.expectedOutput + inputsFrom(s, results), tools, { maxSteps: 12, maxCostUsd: 0.5 })));
    ready.forEach((s, i) => {
      if (outs[i].status !== "done") throw new SubgoalFailed(s.id, outs[i]);
      results[s.id] = outs[i].report;
      pending.delete(s.id);
    });
  }
  return synthesise(goal, results);
}`,
      lines: [
        { code: "dependsOn: z.array(z.string()).default([]),", say: "Each sub-goal names what it needs. The controller orders and parallelises from this." },
        { code: "const ready = split.subgoals.filter((s) => pending.has(s.id) && s.dependsOn.every((d) => d in results));", say: "Everything whose inputs exist runs in this wave; independent branches run together." },
        { code: "const outs = await Promise.all(ready.map((s) => runAgent(s.goal + \"\\nExpected output: \" + s.expectedOutput + inputsFrom(s, results), tools, { maxSteps: 12, maxCostUsd: 0.5 })));", say: "Each branch is its own run with its own short history and budget." },
        { code: "if (outs[i].status !== \"done\") throw new SubgoalFailed(s.id, outs[i]);", say: "A failed branch is identified by id; the caller can retry just that one." },
        { code: "return synthesise(goal, results);", say: "The final step reads the validated sub-results and writes the deliverable." },
      ],
    },
    useIt: "Decompose any goal that would need more than about ten steps or that has independent parts. Give each sub-goal an expected output, run independent ones in parallel with their own budgets, validate outputs, and synthesise. Retry branches, not the whole job.",
    takeaways: ["Big goals become a tree of sub-goals with their own outputs.", "Independent branches run in parallel with their own histories and budgets.", "Failures are isolated and retried per branch.", "A synthesis step combines validated outputs."],
    terms: [["task decomposition", "splitting a goal into smaller sub-goals"], ["sub-goal", "a piece of the goal with its own expected output"], ["synthesis", "the final step that combines sub-results into the deliverable"]],
    reflect: { q: "The model split 'write the report' into 14 sub-goals. Good?", a: "Probably too fine: 14 branches mean 14 budgets, 14 validations and a synthesis reading 14 inputs. Aim for 3 to 7 at each level and let a large sub-goal split itself further when it runs." },
  },

  "m32-reflection": {
    simple: "Reflection is the agent checking its own work before calling it done: re-reading the goal, comparing the result against it, and fixing what falls short.",
    concept:
      "A model's first draft is often nearly right and occasionally wrong in a way it would notice if asked. **Reflection** is that asking. Before the agent finishes, it is prompted to review its result against the goal: are all requirements met, are the sources real, does the code compile, is anything invented? If the review finds problems, the agent fixes them and reviews again, up to a limit.\n\nReflection can be done by the same model in a separate call with a reviewer's instruction, or by a different model, or by code: running the tests, validating the schema, checking that cited urls were actually fetched. The strongest form mixes them: code checks what code can check, and a model review covers judgement.\n\nIt costs an extra call or two per run and typically catches a meaningful share of errors, which is why most production agents reflect before finishing.",
    why:
      "Models produce fluent output whether or not it is right, and the loop's pressure is to finish. Without a review step, the first plausible result ships. Reflection adds the pause a careful person takes before sending: read it once more against what was asked.\n\nIt matters most for outputs people act on: reports, code, emails. A reflection step that catches one invented citation per twenty runs pays for its tokens many times over in trust.",
    how: [
      "When the agent proposes to finish, run the code checks first: schema, tests, link verification, length limits.",
      "Then a review call: give the goal, the result and a rubric; ask for a list of specific problems or 'none'.",
      "If problems are found, feed them back as an observation and let the agent fix them.",
      "Limit review rounds to two or three; persistent failure ends the run with status needs_review.",
      "Log the review verdicts; they are the raw material for improving prompts and tools.",
    ],
    visual: {
      kind: "flow",
      steps: ["agent: 'finished; here is the report'", "code checks: 4 citations, 2 urls never fetched", "review call: 'two citations are not from sources you read; the March figure has no source'", "agent: fetches the sources, fixes two citations, removes the figure", "code checks pass; review: 'none'", "finish"],
      caption: "Two kinds of reflection: code catches what is checkable; the review call catches judgement errors. The agent fixes and tries again.",
    },
    everyday: {
      title: "Reading the email once more before sending",
      text: "The habit of re-reading an email against the question you were asked catches the missing attachment and the paragraph that answers a different question. It takes thirty seconds and saves the embarrassed follow-up. Reflection gives the agent that thirty seconds, with a checklist.",
    },
    engineering: {
      title: "A coding agent with code and model review",
      text: "A fintech's coding agent proposes pull requests. Before it finishes, three checks run: the test suite, a linter, and a check that every file it changed was in its plan. Then a separate review call reads the diff against the ticket with a rubric: does it do what the ticket asked, does it touch anything unrelated, are there tests for the change. Findings go back to the agent for one fix round. Over three months, the review step rejected 18% of first drafts, mostly for missing tests and unrelated changes, and human reviewers reported that the PRs that reached them were noticeably cleaner.",
    },
    code: {
      title: "Reflect before finishing",
      lang: "ts",
      src: `const Review = z.object({ problems: z.array(z.string()).max(8), verdict: z.enum(["pass", "fix"]) });

async function reflect(goal: string, result: string, evidence: Evidence): Promise<z.infer<typeof Review>> {
  const codeProblems = [
    ...uncitedSources(result, evidence.fetchedUrls).map((u) => "cited but never fetched: " + u),
    ...(wordCount(result) > 350 ? ["over the 300-word limit"] : []),
  ];
  if (codeProblems.length > 0) return { problems: codeProblems, verdict: "fix" };

  const reply = await client.messages.create({
    model: process.env.MODEL_REVIEW!,
    max_tokens: 400,
    temperature: 0,
    system: "You review an agent's result against its goal. List specific problems: unmet requirements, unsupported claims, invented details, wrong format. If there are none, verdict pass.",
    tools: [reviewTool],
    tool_choice: { type: "tool", name: "review" },
    messages: [{ role: "user", content: "<goal>" + goal + "</goal>\\n<result>" + result + "</result>" }],
  });
  return Review.parse(reply.content.find((b) => b.type === "tool_use")?.input);
}`,
      lines: [
        { code: "...uncitedSources(result, evidence.fetchedUrls).map((u) => \"cited but never fetched: \" + u),", say: "Code checks first: a citation to a url the run never fetched is a definite problem, no model needed." },
        { code: "if (codeProblems.length > 0) return { problems: codeProblems, verdict: \"fix\" };", say: "Cheap checks short-circuit the expensive review." },
        { code: "model: process.env.MODEL_REVIEW!,", say: "A separate, pinned model for reviewing, so the reviewer is not the author." },
        { code: "system: \"You review an agent's result against its goal. List specific problems: unmet requirements, unsupported claims, invented details, wrong format. If there are none, verdict pass.\",", say: "A rubric, and permission to say 'none'. Reviews that must find something invent problems." },
      ],
    },
    useIt: "Add reflection to any agent whose output people act on: code checks for the checkable, a separate review call with a rubric for judgement, a fix round or two, and a status for results that still fail. Log verdicts to find systematic weaknesses.",
    takeaways: ["Reflection reviews the result against the goal before finishing.", "Code checks first; model review for judgement; a different model as reviewer.", "Problems go back as observations; limit the fix rounds.", "Review logs show where the agent is systematically weak."],
    terms: [["reflection", "the agent reviewing and correcting its own result before finishing"], ["rubric", "the written criteria a review checks against"], ["fix round", "one cycle of review findings and corrections"]],
    reflect: { q: "Should the reviewer see the agent's full history or only the goal and result?", a: "Mostly the goal and result, plus specific evidence (what was fetched, test output). The full history biases the reviewer toward the agent's reasoning; a fresh look at the output is the point." },
  },

  "m32-replanning": {
    simple: "Replanning is what the agent does when a step fails or a result changes the picture: it revises the plan explicitly instead of pushing on or giving up.",
    concept:
      "Plans meet reality at step two. A tool fails, a source is paywalled, the data is not where the plan assumed, a person refuses an action. **Replanning** is the agent's response: recognise that the plan no longer fits, decide what to do instead, record the change, and continue. It is the difference between an agent that recovers and one that repeats the failing step until the budget ends.\n\nGood replanning has triggers and limits. Triggers: an error observation, a refusal, a result that contradicts an assumption, a sub-goal that cannot be met. Limits: a count of replans per run, after which the agent stops and reports, because endless replanning is a loop with extra steps.\n\nReplanning is also where agents decide to give up well: 'the pricing page is unavailable for two competitors; I will report the three I could verify and flag the gap' is a replan, and a good one.",
    why:
      "The failure mode without replanning is obvious in traces: the same search five times, the same failing command ten times, an agent that 'tries again' until the step limit. The failure mode with uncontrolled replanning is subtler: an agent that changes course every step and never finishes. The design has to produce the middle: change course when a trigger fires, say why, and stop after a few changes.\n\nExplicit replanning also makes runs explainable. A trace with 'replan: source unavailable, switching to the regulator's filings' tells a reviewer what happened; a trace of silent course changes does not.",
    how: [
      "Define replanning triggers: error or refusal observations, contradicting results, repeated identical observations, a sub-goal marked impossible.",
      "On a trigger, prompt the model to replan: state what failed, what it now believes, and the new next steps.",
      "Record the replan as a plan update with its reason.",
      "Count replans; after a limit (say three), end the run with status needs_review and a clear report of what was and was not achieved.",
      "Prefer graceful degradation over abandonment: deliver the verified part and flag the gap.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Trigger", "Bad response", "Good replan"],
        rows: [
          ["fetch_page: 403 paywall", "fetch the same url again", "'source paywalled; use the regulator's filing instead'"],
          ["run_tests: same failure as last step", "edit the same line again", "'my fix did not change the result; read the test to see what it expects'"],
          ["reviewer refused 'send email'", "ask to send it again", "'refused; draft a shorter version and ask once more, or finish with the draft attached'"],
          ["three identical observations", "a fourth attempt", "controller intervenes: stuck; report"],
          ["2 of 5 sources unavailable", "give up on the report", "'report the 3 verified; flag 2 gaps and why'"],
        ],
      },
      caption: "Each trigger has a bad reflex and a good replan. The good ones say why and change something.",
    },
    everyday: {
      title: "The road is closed",
      text: "A driver who finds the road closed does not sit at the barrier retrying. They look at the map, pick another route, and tell the passenger why they are now going through town. If three roads are closed, they say so and suggest the train. That is replanning with a reason and a limit.",
    },
    engineering: {
      title: "A data-pipeline agent that learned to degrade",
      text: "A media company's agent builds a weekly metrics report from six data sources. Early runs failed whole when one source's API was down, after retrying it fifteen times. The rebuilt agent treats an API error as a replan trigger: it marks the source unavailable, continues with the other five, and finishes with a report that has a visible 'missing: ad revenue (API down since 09:14)' line. Replans are capped at three; the fourth problem ends the run with a needs_review status and a list of what was gathered. Report delivery went from 70% of weeks to 98%, with honest gaps instead of silent failures.",
    },
    code: {
      title: "Trigger, replan, limit, degrade",
      lang: "ts",
      src: `const MAX_REPLANS = 3;

function isTrigger(obs: Observation, state: State): boolean {
  return obs.status === "error" || obs.status === "refused" || obs.status === "not_found" || state.repeats >= 1;
}

async function maybeReplan(obs: Observation, state: State, memory: Message[]) {
  if (!isTrigger(obs, state)) return;
  state.replans += 1;
  if (state.replans > MAX_REPLANS) {
    memory.push({ role: "user", content: "You have replanned " + MAX_REPLANS + " times. Do not try further approaches. Call finish now with what you have verified so far and list each gap with its reason." });
    return;
  }
  memory.push({ role: "user", content: "The last step did not go as planned (" + obs.status + ": " + obs.reason + "). Replan: state what you now believe, choose a different approach, and update the plan with the reason. If the goal cannot be fully met, plan to deliver the verified part and flag the gap." });
}`,
      lines: [
        { code: "return obs.status === \"error\" || obs.status === \"refused\" || obs.status === \"not_found\" || state.repeats >= 1;", say: "The triggers: a failure, a refusal, nothing found, or the same observation twice." },
        { code: "if (state.replans > MAX_REPLANS) {", say: "A cap. After three course changes the agent must finish with what it has." },
        { code: "memory.push({ role: \"user\", content: \"You have replanned \" + MAX_REPLANS + \" times. Do not try further approaches. Call finish now with what you have verified so far and list each gap with its reason.\" });", say: "Graceful degradation is instructed explicitly: deliver the verified part, name the gaps." },
        { code: "memory.push({ role: \"user\", content: \"The last step did not go as planned (\" + obs.status + \": \" + obs.reason + \"). Replan: state what you now believe, choose a different approach, and update the plan with the reason. If the goal cannot be fully met, plan to deliver the verified part and flag the gap.\" });", say: "The replan prompt names the failure and demands a different approach with a reason." },
      ],
    },
    useIt: "Define replan triggers and a replan cap in every agent's controller. Make the replan prompt demand a different approach and a reason. Teach the agent to degrade gracefully: deliver what is verified and name what is missing.",
    takeaways: ["Replan on triggers: errors, refusals, contradictions, repeats.", "A replan changes the approach and records why.", "Cap replans; then finish with the verified part and flagged gaps.", "Degrading gracefully beats both abandoning and looping."],
    terms: [["replanning", "revising the plan when a step fails or the picture changes"], ["trigger", "an observation that should cause a replan"], ["graceful degradation", "delivering the achievable part and flagging the rest"]],
    reflect: { q: "After a tool error the agent replans to 'try the same tool with the same arguments but more carefully'. Is that a replan?", a: "No; nothing changed. The replan prompt should require a different approach, and the controller's repeat detector will catch the identical retry if the prompt does not." },
  },

  "m32-state-management": {
    simple: "State management is keeping a run's full state (memory, plan, working values, budget, status) in storage so it can pause, resume, recover from crashes and be inspected.",
    concept:
      "Everything an agent run is made of, the message history, the plan, the working memory, the budget left, the pending approval, the status, is its **state**. **State management** is the discipline of keeping that state somewhere durable and consistent, so the run is not lost when the process restarts, can pause for hours waiting for a person, and can be opened by someone who wants to know what happened.\n\nThe practical rule: the run's state lives in a store (a database row or document), and the controller loads it, advances it one step, and saves it. The in-memory copy is a cache. A crash loses at most the step in progress, and since tool calls are logged before they run, even that is recoverable.\n\nState also has a lifecycle: created, running, awaiting approval, done, failed, archived. Transitions are explicit, and only certain transitions are allowed, which stops a finished run from being resumed by accident.",
    why:
      "Agent runs are long-lived and interactive. A run that exists only in a process's memory dies with the process, cannot wait for a person without holding a connection open, and cannot be examined from another machine. Teams that start with in-memory state rebuild it within weeks, usually after the first deploy kills every active run.\n\nDurable state also enables the operational tools that matter: a dashboard of active runs, retry of a failed step, a replay of a run against a new prompt, and the audit trail a regulated business needs.",
    how: [
      "Define the state record: id, owner, goal, status, history, summary, working memory, plan, budget used, pending action, timestamps.",
      "Load, step, save: each loop iteration reads the state, performs one step, and writes it back.",
      "Log every tool call before it runs, with an idempotency key for writes, so a crash mid-step cannot cause a duplicate.",
      "Make status transitions explicit: running → awaiting_approval → running → done; done is final.",
      "Expose the state: a page per run showing status, plan, steps, budget and the pending action.",
      "Archive finished runs by a retention rule; keep the metadata longer than the bodies.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "created", detail: "goal and budget saved; status running" },
        { label: "running", detail: "load → model → tool (logged first) → save, repeat" },
        { label: "awaiting_approval", detail: "pending write saved; a person is notified; the process is free" },
        { label: "running (resumed)", detail: "the decision becomes an observation; the loop continues from the saved state" },
        { label: "done / failed / stuck", detail: "final; report stored; run visible on the dashboard" },
        { label: "archived", detail: "bodies trimmed after 30 days; metadata kept" },
      ],
      caption: "A run's lifecycle. Every transition is saved; a crash anywhere resumes from the last save.",
    },
    everyday: {
      title: "A case file, not a conversation",
      text: "A solicitor working a case keeps a file: every letter, the current position, what is waiting on whom. If they are off sick, a colleague opens the file and continues. If the client calls, the file says where things stand. An agent run managed as a case file can be picked up by any process, paused for a week, and explained to anyone.",
    },
    engineering: {
      title: "The deploy that killed forty runs",
      text: "A customer-operations team ran their refund agent with state in memory. A routine deploy restarted the service and forty in-progress runs vanished, including six that were waiting for a manager's approval; the customers had to start again. The rebuild put every run in a database table with a status column, logged tool calls before execution with idempotency keys, and moved approvals to a queue. The next deploy interrupted thirty runs mid-step; all thirty resumed from their last saved step within a minute, and the two that had been mid-write were correctly recognised as already done by their keys.",
    },
    code: {
      title: "Load, step, save",
      lang: "ts",
      src: `export async function advance(runId: string): Promise<RunState> {
  const state = await runs.load(runId);
  if (state.status !== "running") return state;                       // only running runs advance

  const reply = await callModel(contextFrom(state));
  state.history.push({ role: "assistant", content: reply.content });
  state.costUsd += costOf(reply.usage);
  state.step += 1;

  const call = reply.content.find((b) => b.type === "tool_use");
  if (!call) { state.status = "unfinished"; return runs.save(state); }
  if (call.name === "finish") { state.status = "done"; state.report = call.input; return runs.save(state); }

  if (isWrite(call.name)) {
    state.status = "awaiting_approval";
    state.pending = { id: call.id, name: call.name, input: call.input, idempotencyKey: runId + ":" + call.id };
    return runs.save(state);                                           // the process is now free
  }

  await runs.logToolStart(runId, state.step, call);                    // logged before it runs
  const obs = await observe(toolNamed(call.name), call.input);
  state.history.push({ role: "user", content: [{ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(obs) }] });
  if (state.step >= state.budget.maxSteps) state.status = "step_limit";
  return runs.save(state);
}`,
      lines: [
        { code: "const state = await runs.load(runId);", say: "The store is the truth. Every step begins by loading it." },
        { code: "if (state.status !== \"running\") return state;                       // only running runs advance", say: "Explicit lifecycle: a done or awaiting run cannot be advanced by accident." },
        { code: "state.pending = { id: call.id, name: call.name, input: call.input, idempotencyKey: runId + \":\" + call.id };", say: "A pending write is saved with a key, so approval can run it exactly once, even after a crash." },
        { code: "await runs.logToolStart(runId, state.step, call);                    // logged before it runs", say: "The intent is recorded before the effect. A crash between the two is detectable." },
        { code: "return runs.save(state);", say: "One step, one save. The next advance, on any machine, continues from here." },
      ],
    },
    useIt: "Store every run's state from the first version: load, step, save; log writes before they run with idempotency keys; make status transitions explicit; build a run page. It is the foundation for pauses, approvals, recovery, dashboards and audits.",
    takeaways: ["A run's state is everything about it; keep it in a store, not in a process.", "Load, step, save: a crash loses at most one step.", "Log writes before running them, with idempotency keys.", "Explicit statuses; done is final; archive by rule."],
    terms: [["run state", "the complete, durable record of a run"], ["status transition", "a permitted move between lifecycle states"], ["idempotency key", "a unique id that makes a repeated write a no-op"]],
    reflect: { q: "Why save after every step rather than at the end of the run?", a: "Because runs pause, crash and get deployed over. Saving per step means any process can continue the run from its last step, and a person can see live progress. Saving only at the end loses everything that happened before a failure." },
  },
};

export const M32_QUIZ: Quiz[] = [
  {
    q: "An agent's context has reached 70,000 tokens by step 18. What is the most likely missing piece?",
    options: ["A larger model", "A rolling summary folding older steps out of the verbatim window", "More tools", "A higher step limit"],
    answer: 1,
    why: ["Size does not fix growth.", "Correct. Without a summary, every step re-sends every earlier step.", "More tools mean more output to carry.", "More steps would make it worse."],
    reason: true,
  },
  {
    q: "Which belongs in long-term memory?",
    options: ["The customer's current open ticket number", "The customer prefers replies in Spanish", "Yesterday's search results", "The agent's API key"],
    answer: 1,
    why: ["Live data; a tool reads it fresh.", "Correct. A durable preference that cannot be looked up and is not sensitive.", "Stale within hours; belongs in the run's history or nowhere.", "Secrets never go into memory."],
  },
  {
    q: "What is working memory for?",
    options: ["Storing the whole history", "Holding the few live values the next step needs, rendered where the model will see them", "Replacing tools", "Caching web pages"],
    answer: 1,
    why: ["That is short-term memory.", "Correct. Ids, the current plan step, collected items: a scratchpad kept current every step.", "Tools fetch; working memory holds.", "Pages belong in external memory."],
  },
  {
    q: "A knowledge base of 2,000 documents should be:",
    options: ["Pasted into the system prompt", "Stored as long-term facts", "Kept as external memory with a search tool", "Summarised once into the plan"],
    answer: 2,
    why: ["Far beyond the window and stale when documents change.", "Thousands of facts are noise.", "Correct. Retrieve on demand; the store stays the truth; permissions in the query.", "A summary loses the detail every question needs."],
  },
  {
    q: "Which planning strategy fits 'find the commit that broke the build'?",
    options: ["Pure step-by-step with no plan", "Plan-then-execute, because the steps are predictable", "Candidate plans", "No planning; just retry"],
    answer: 1,
    why: ["Predictable tasks lose time without a plan.", "Correct. Bisect, read the diff: known steps, plan up front.", "Extra planning for a task with one obvious method.", "Retrying is not a strategy."],
  },
  {
    q: "The agent's fetch returns 403 three times in a row for the same url. What should happen?",
    options: ["A fourth attempt", "A replan trigger: a different source, with the reason recorded; the controller also detects the repeat", "End the run as done", "Increase the timeout"],
    answer: 1,
    why: ["Identical retries are the loop going nowhere.", "Correct. Replan with a different approach; the repeat detector backs it up.", "Nothing was achieved.", "A 403 is a refusal, not slowness."],
    reason: true,
  },
  {
    q: "Why run code checks before the model review in a reflection step?",
    options: ["Code is always right", "Code checks are free and catch definite problems, so the expensive review runs only when needed", "Models cannot review", "To use more tokens"],
    answer: 1,
    why: ["Code checks only what is checkable.", "Correct. An uncited url or a failed test needs no model to find.", "They can, for judgement.", "The opposite."],
  },
  {
    q: "Why save run state after every step?",
    options: ["To slow the agent down", "So a crash, deploy or pause loses at most one step and any process can resume", "Because the SDK requires it", "To avoid logging"],
    answer: 1,
    why: ["Saving is cheap.", "Correct. Durable state is what makes pauses, approvals, recovery and dashboards possible.", "No SDK requires it.", "Logging and saving go together."],
  },
];

export const M32_EXERCISES: Exercise[] = [
  {
    title: "Draw the memory table",
    kind: "think",
    task: "For a travel-booking agent, list eight pieces of information it handles (e.g. the traveller's passport expiry, a flight hold id, the airline's baggage rules, last week's conversation) and place each in a layer: working, short-term, run summary, long-term or external. Give a lifetime for each.",
    hints: ["Live data belongs in external memory, read by tools.", "Ids needed by the next step belong in working memory."],
    solution: "Flight hold id: working (until the hold expires). Chosen flight: working. Search results from step 2: short-term, then summary. Traveller's seat preference: long-term (180 days, deletable). Passport expiry: long-term only if the traveller gave it; better fetched from their profile (external). Airline baggage rules: external, searched. Last week's conversation: conversation memory, summarised. Budget left: working, controller-maintained.",
  },
  {
    title: "Size a verbatim window",
    kind: "calculate",
    task: "A tool result averages 1,200 tokens and the model's reasoning 150 tokens per step. You want the window to hold the last 6 steps plus a 2,000-token goal-and-plan block and a 600-token summary. How many tokens does each call send? If input costs £3 per million and a run has 20 steps, what is the run's input cost with the window versus keeping all 20 steps verbatim?",
    hints: ["Per step the model adds 150 + 1,200 = 1,350 tokens.", "Keeping everything: step k sends 2,000 + k × 1,350."],
    solution: "Windowed: 2,000 + 600 + 6 × 1,350 = 10,700 tokens per call (after step 6); 20 steps ≈ 20 × 10,700 = 214,000 tokens → £0.64. All verbatim: sum over k=1..20 of (2,000 + 1,350k) = 40,000 + 1,350 × 210 = 323,500 tokens → £0.97, and growing faster with more steps. The window also keeps the latest error from being buried.",
  },
  {
    title: "Write the decomposition",
    kind: "think",
    task: "Decompose 'prepare a briefing on three competitors for Monday's board meeting' into 3–7 sub-goals with expected outputs and dependencies. Mark which can run in parallel.",
    hints: ["What must exist before sections can be written?", "What is independent per competitor?"],
    solution: "1 Confirm the three competitors and their websites (output: list). 2 Per competitor, in parallel: pricing and plans with sources (output: table). 3 Per competitor, in parallel: news from the last 90 days (output: 3 items with dates). 4 Per competitor, depends on 2 and 3: a 150-word section. 5 Depends on all 4: a 300-word summary with three recommendations and citations. Sub-goals 2 and 3 run in parallel across competitors; 4 runs in parallel once its inputs exist.",
  },
  {
    title: "Specify the state record",
    kind: "code",
    task: "Write the TypeScript type for a run's durable state, including status with its allowed values, and list the allowed status transitions.",
    hints: ["Think about pause, resume, crash and audit.", "Which statuses are final?"],
    solution: "type RunState = { id: string; ownerId: string; goal: string; status: 'running' | 'awaiting_approval' | 'done' | 'unfinished' | 'step_limit' | 'over_budget' | 'stuck' | 'failed'; history: Message[]; summary?: string; working: Record<string, unknown>; plan: string[]; step: number; costUsd: number; budget: Budget; pending?: { id: string; name: string; input: unknown; idempotencyKey: string }; report?: unknown; createdAt: string; updatedAt: string }. Transitions: running → awaiting_approval → running; running → done | unfinished | step_limit | over_budget | stuck | failed (all final). Final states never return to running; a new run is created instead.",
  },
];
