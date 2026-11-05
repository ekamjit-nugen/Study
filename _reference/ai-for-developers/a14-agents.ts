import type { StoryPage, Topic } from "../types";

// AI 3.2: agents: the loop, its limits and its stop button.

const SETTING = "The same online furniture shop. The Help page chat box can now look up orders with tools (lesson 3.1). Priya wants it to handle a whole return on its own: check the order, check the 30-day returns policy, book a courier collection, and email the customer a label. The shop has an orders database, a courier API (book a collection, costs money per booking) and an email service.";
const CAST = "**Priya** (product manager) wants returns handled without a person. **Dev** (developer) builds the loop. **Nisha** (support lead) will be the person it escalates to. **Kabir** (owner) sees the courier bill.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Dev's first 'return agent' was the tool loop with no limits. In one afternoon of testing it booked two couriers for one return, told a customer the return was done when nothing was booked, and ran forty steps on a question it could not answer.",
    title: "The afternoon the agent ran wild",
    text: "Dev builds it in a day: the same loop as lesson 3.1 with five tools (lookup_order, returns_policy, book_courier, email_label, refund) and the instruction 'handle the customer's return'. No step limit this time, because 'a return might need many steps'.\n\nTesting goes badly in three different ways. A courier API call times out; the model does not see a result, assumes it did not happen, and books again. Two collections, two charges. A customer asks about returning a mattress (not returnable, hygiene rule); the model reads the policy, then lookup_order, then the policy again, then the order again, forty times, until Dev kills it. And in one run the model writes 'Your return is all set!' having called no write tool at all, because nothing told it that saying so is not the same as doing so.\n\n**This is the problem.** Letting the model decide the order of steps is exactly what makes returns possible without a person. It is also what lets it loop, duplicate, and declare victory. Freedom needs limits, and the limits must be code.",
  },
  {
    stage: "why",
    point: "An agent is the tool loop plus the freedom to choose which tool comes next. The model only knows what the history shows it, so a lost result looks like 'never happened', and nothing tells it when it is finished unless you give it a way to say so.",
    title: "Why freedom without limits goes wrong",
    text: "In lesson 3.1 the code asked one question and the model needed one tool. Here the model chooses a sequence, and three facts about models bite.\n\nIt only knows what is in the messages. If a tool timed out and no result was appended, the model has no evidence the booking happened. Retrying is the reasonable thing to do from where it sits. The duplicate is the code's fault for not recording the attempt.\n\nIt has no sense of progress. Each call is a fresh read of the history. Reading the policy again looks as sensible as the first time, so a question with no answer becomes a loop. Only a counter outside the model knows this is step forty.\n\nIt finishes by writing text. 'All set!' is a completion, not a status report. Unless 'done' is itself a tool with required fields (what was booked, which email was sent), the model can end whenever the text feels finished.\n\nSo an agent is defined less by its intelligence than by its boundaries: a budget of steps, time and money; a required way to finish; a record of every attempted action; and a gate before anything irreversible.",
  },
  {
    stage: "concept",
    point: "An agent is a loop with a goal, tools, state, a budget and stop conditions. The model picks the next step; the code decides whether it may take it and when the loop ends.",
    title: "The parts of an agent",
    text: "Strip away the hype and an **agent** is five things.\n\nA **goal**: the first user message ('customer 812 wants to return order 4417'). **Tools**: read tools, write tools, and one more called `finish` whose schema forces a real status report. **State**: the message history, plus a log the code keeps of every tool attempted, including ones that timed out. A **budget**: maximum steps, maximum spend, a deadline. **Stop conditions**: the model calls finish; the budget runs out; a write tool needs a person's confirmation; or the model stops asking for tools without finishing, which is a failure, not a success.\n\nThe model's job is to choose the next tool from the history. The code's job is everything else: run the tool, record the attempt before running a write, append the result, check the budget, pause for confirmation, and end the loop with an explicit status that the rest of the system can act on.",
    jargon: [["budget", "the limits a run may not exceed: steps, money, wall-clock time; the code checks them, the model never sees them"], ["stop condition", "a rule in code that ends the loop: finished, over budget, needs a person, or gave up"], ["approval gate", "a pause before an irreversible action: the agent proposes, a person confirms, the loop resumes with the real result"]],
    table: {
      head: ["Stop condition", "Who triggers it", "What the system does"],
      rows: [
        ["finish tool called", "the model", "store the report; show the customer the summary"],
        ["step limit (say 12)", "the code", "status step_limit; hand to Nisha with the trace"],
        ["cost or time budget", "the code", "status over_budget; same handoff"],
        ["write tool requested", "the code", "pause; save state; ask the person; resume with the real result"],
        ["text reply, no tool, no finish", "the code", "status unfinished; never shown as success"],
      ],
    },
  },
  {
    stage: "visual",
    point: "The finish tool turns 'all set!' into a report with required fields. If the model has not booked a courier, it cannot honestly fill in the booking reference, and the code can check.",
    title: "Done is a tool",
    text: "Dev adds a tool the model must call to end a run. Its schema asks for what was actually done. The code compares the report with its own log of tool calls: a report that claims a booking the log does not contain is rejected and the loop continues with that mismatch as a result.",
    codes: [
      {
        title: "The finish tool",
        lang: "ts",
        src: `const finish = {
  name: "finish",
  description: "Call this exactly once when the return is fully handled or cannot be handled. Report only actions that tools confirmed.",
  input_schema: {
    type: "object",
    properties: {
      outcome: { type: "string", enum: ["return_booked", "not_eligible", "needs_person"] },
      courier_booking_ref: { type: "string", description: "The reference returned by book_courier, if any." },
      label_email_sent: { type: "boolean" },
      summary_for_customer: { type: "string", description: "Two sentences in plain language." },
      reason_for_person: { type: "string", description: "Required when outcome is needs_person." },
    },
    required: ["outcome", "label_email_sent", "summary_for_customer"],
    additionalProperties: false,
  },
} as const;`,
        lines: [
          { sql: "description: \"Call this exactly once when the return is fully handled or cannot be handled. Report only actions that tools confirmed.\",", say: "The only way to end the run. 'Cannot be handled' is a valid ending; the model is not forced to succeed." },
          { sql: "outcome: { type: \"string\", enum: [\"return_booked\", \"not_eligible\", \"needs_person\"] },", say: "Three outcomes, one of them 'hand to a person'. The mattress case ends here instead of looping." },
          { sql: "courier_booking_ref: { type: \"string\", description: \"The reference returned by book_courier, if any.\" },", say: "A field the model can only fill from a real tool result. The code checks it against the log." },
          { sql: "label_email_sent: { type: \"boolean\" },", say: "Required. 'All set!' without an email is now a visible false claim." },
        ],
        note: "The code rejects a report that claims return_booked without a booking ref that appears in its own log.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The runner enforces the budget, records every write before running it, pauses for confirmation on writes, and returns a status the rest of the system can act on. The model never sees any of this machinery.",
    title: "The bounded loop",
    text: "The runner is the lesson 3.1 loop with four additions: a budget check every step, an action log written before any write tool runs, a pause when a write needs a person, and a status on every exit. Write tools do not run inside the loop at all; the loop stops, the proposal is shown, and a separate call resumes it.",
    codes: [
      {
        title: "runAgent(): budget, log, gates, status",
        lang: "ts",
        src: `type Budget = { maxSteps: number; maxCostUsd: number; deadline: number };
type Exit = { status: "done" | "needs_confirmation" | "step_limit" | "over_budget" | "timeout" | "unfinished"; messages: Message[]; report?: unknown; proposal?: unknown };

export async function runAgent(messages: Message[], customerId: number, budget: Budget, log: ActionLog): Promise<Exit> {
  let spent = 0;
  for (let step = 1; step <= budget.maxSteps; step++) {
    if (Date.now() > budget.deadline) return { status: "timeout", messages };
    const reply = await client.messages.create({
      model: process.env.MODEL_AGENT!,
      max_tokens: 1000,
      system: AGENT_PROMPT,
      tools: [...readTools, ...writeTools, finish],
      messages,
    });
    spent += costOf(reply.usage);
    messages.push({ role: "assistant", content: reply.content });
    if (spent > budget.maxCostUsd) return { status: "over_budget", messages };

    const calls = reply.content.filter((b) => b.type === "tool_use");
    if (calls.length === 0) return { status: "unfinished", messages };

    const results = [];
    for (const call of calls) {
      if (call.name === "finish") {
        const problem = log.contradicts(call.input);
        if (!problem) return { status: "done", report: call.input, messages };
        results.push({ type: "tool_result", tool_use_id: call.id, content: "Report rejected: " + problem, is_error: true });
        continue;
      }
      if (isWriteTool(call.name)) {
        await log.pending(call, messages);
        return { status: "needs_confirmation", proposal: call.input, messages };
      }
      results.push(await runReadTool(call, customerId));
    }
    messages.push({ role: "user", content: results });
  }
  return { status: "step_limit", messages };
}`,
        lines: [
          { sql: "for (let step = 1; step <= budget.maxSteps; step++) {", say: "The step counter lives in code. The model never learns it is on step forty; the loop just ends." },
          { sql: "if (Date.now() > budget.deadline) return { status: \"timeout\", messages };", say: "A deadline so a customer is not left waiting while the agent thinks." },
          { sql: "if (spent > budget.maxCostUsd) return { status: \"over_budget\", messages };", say: "Money is a budget too. One return may not cost more than the item." },
          { sql: "if (calls.length === 0) return { status: \"unfinished\", messages };", say: "Text without finish is not success. The system treats it as a failed run." },
          { sql: "const problem = log.contradicts(call.input);", say: "The report is checked against the code's own log. A claimed booking with no booking in the log is rejected." },
          { sql: "await log.pending(call, messages);", say: "Before any write, the attempt is recorded. A later timeout cannot turn into a second booking." },
          { sql: "return { status: \"needs_confirmation\", proposal: call.input, messages };", say: "The loop stops here. The customer sees 'Book a collection for Tuesday, £6?' and a button." },
        ],
        note: "Every exit carries the messages, so a person can read the whole trace, and so a confirmed write can resume the run.",
      },
      {
        title: "resume(): after the customer clicks confirm",
        lang: "ts",
        src: `export async function resume(pendingId: string, approved: boolean, budget: Budget) {
  const p = await log.loadPending(pendingId);
  const result = approved
    ? await runWriteTool(p.call, p.customerId, { idempotencyKey: pendingId })
    : { data: "The customer declined this action. Do not retry it.", error: false };
  await log.settle(pendingId, result);
  p.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: p.call.id, content: JSON.stringify(result.data), is_error: result.error }] });
  return runAgent(p.messages, p.customerId, budget, log);
}`,
        lines: [
          { sql: "? await runWriteTool(p.call, p.customerId, { idempotencyKey: pendingId })", say: "The write runs once, keyed by the pending id. A retry with the same key is a no-op at the courier API." },
          { sql: ": { data: \"The customer declined this action. Do not retry it.\", error: false };", say: "A decline is a result too. The model learns it and can offer an alternative instead of asking again." },
          { sql: "return runAgent(p.messages, p.customerId, budget, log);", say: "The loop resumes from the saved history with the real result in place." },
        ],
      },
    ],
  },
  {
    stage: "implement",
    point: "If you already know the steps and their order, write a workflow and call the model only for the judgement calls. Use an agent when the path depends on what is found along the way.",
    title: "Workflow or agent",
    text: "Halfway through, Dev notices that most returns follow the same path: look up the order, check eligibility against the policy, book, email. The model's freedom to reorder steps is not helping; it is the source of the loops. So the common case becomes a **workflow**: plain code that does the four steps in order, calling the model only for the two judgement calls (is the reason eligible under the policy? write the customer's summary).\n\nThe agent stays for the long tail: a damaged item that needs photos checked, a partial return of a three-piece set, a customer who changes their mind halfway. There the path really does depend on what the tools return. Priya gets both: fast and cheap for the ninety percent, flexible for the rest, with a person at the end of every budget.",
    table: {
      head: ["Situation", "Use", "Why"],
      rows: [
        ["Standard return: look up, check, book, email", "workflow", "the steps are known; code controls order and cost"],
        ["Classify a return reason against the policy", "one model call", "a judgement, not a sequence"],
        ["Damaged item with photos, partial sets, changed minds", "bounded agent", "the next step depends on what is found"],
        ["Anything irreversible", "either, with an approval gate", "a person confirms before money moves"],
      ],
    },
    ask: "A run ends with status step_limit after twelve steps on a mattress return. What should the customer see, what should Nisha see, and what should Dev change?",
  },
  {
    stage: "compare",
    point: "An unbounded loop with write tools inside it is a bill and a support incident. A bounded loop with a finish tool, an action log and approval gates is a feature.",
    title: "The naive loop and the bounded one",
    text: "Both versions let the model choose the next tool. The difference is everything the code does around that choice.",
    versus: {
      beginner: {
        title: "while (true) with every tool",
        lang: "ts",
        code: "while (true) {\n  const reply = await call(messages, allTools);\n  if (reply.stop_reason !== \"tool_use\") return text(reply);\n  for (const c of toolCalls(reply)) messages.push(await run(c));   // writes run here\n}",
        points: ["Works on the happy path in the demo.", "A timeout becomes a duplicate booking.", "An unanswerable question becomes an infinite loop.", "'All set!' ends the run with nothing done."],
      },
      engineer: {
        title: "Budget, log, finish tool, approval gates, status",
        lang: "ts",
        code: "for (step ≤ maxSteps, cost ≤ maxCost, now ≤ deadline) {\n  … finish → check against log → done\n  … write tool → log.pending → pause for confirmation\n  … read tool → run → append result\n}\nreturn { status, messages }",
        points: ["Every run ends with a status the system acts on.", "Writes are recorded before they run and are idempotent.", "A person confirms anything that costs money.", "The trace is kept for debugging and for Nisha."],
      },
      tradeoffs: ["The bounded loop needs state storage for pauses and a resume path; that is real engineering.", "Approval gates add a click for the customer; reserve them for irreversible actions.", "Budgets that are too tight end good runs early; tune them from traces."],
      when: "Agents for paths you cannot script; workflows for paths you can; a bounded loop either way.",
    },
  },
  {
    stage: "recap",
    point: "An agent is a loop you own: goal, tools, state, budget, stop conditions. Finish is a tool; writes are logged, idempotent and confirmed; every exit has a status; common paths become workflows.",
    title: "Connect it back: returns, bounded",
    text: "The wild afternoon came from a loop with no edges. Now the standard return is a workflow with two model calls. Unusual returns run through a bounded agent with twelve steps, a cost cap and a deadline; writes pause for a click and run once; finish is a report checked against the log; and anything that cannot finish lands with Nisha together with the full trace. Kabir's courier bill went back to one booking per return.",
    recap: {
      remember: ["Agent = loop + goal + tools + state + budget + stop conditions. The code owns all but the choice.", "Done is a tool with required fields, checked against the action log.", "Record a write before running it; make it idempotent; gate it behind a person.", "Every exit returns a status. Text without finish is failure.", "Script what you can; agent what you cannot."],
      mistakes: ["No step, cost or time budget.", "Write tools that run inside the loop without a record or a confirmation.", "Treating a text reply as completion.", "Using an agent for a four-step path that code could run."],
      production: ["Returns and refunds, incident triage, data-fixing bots, coding agents, research assistants.", "The same runner pattern is used by coding agents: tools, budgets, approval before destructive commands.", "Traces from these runs are the raw material of lesson 3.8."],
      next: ["3.3 MCP: tools as servers any app can plug in.", "3.4 Memory and state: what the agent should remember next week.", "4.1 Prompt injection: when a tool result tells the agent what to do."],
    },
    ask: "Dev now has five tools for the chat box, four for the returns agent, and a colleague's internal dashboard wants the same ones. Copying tool code between apps is already going wrong. Next lesson.",
  },
];

export const A14: Topic = {
  slug: "agents",
  title: "Agents: the loop, its limits and its stop button",
  minutes: 18,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Define an agent as a loop with a goal, tools, state, a budget and stop conditions, and say which parts the code owns.", "Explain why unbounded loops duplicate actions, spin, and declare false success.", "Implement a bounded runner with a finish tool, an action log, approval gates and exit statuses.", "Decide between a scripted workflow and an agent for a given task."],
  prerequisites: ["tool-calling"],
  story: "A new employee with a company card. You would not say 'sort out the returns' and walk away. You would give them a checklist for the usual case, a spending limit, a rule to ask before booking anything, and a form to fill in when they are done. That is an agent.",
  tldr: [
    "An **agent** is the tool loop where the model picks the next step. The **code** owns the budget, the log, the gates and the exit.",
    "**Finish is a tool** with required fields; the code checks the report against what actually ran.",
    "**Record a write before running it**, make it **idempotent**, and **pause for a person** before anything irreversible.",
    "Every run ends with a **status**. If the steps are known, write a **workflow** and call the model only for judgement.",
  ],
  words: [
    ["agent", "a loop where the model chooses the next tool, bounded by code"],
    ["budget", "limits on steps, cost and time enforced by the runner"],
    ["stop condition", "a code rule that ends the loop with a status"],
    ["finish tool", "the required way to end a run: a report with fields the code can check"],
    ["approval gate", "a pause before a write tool runs until a person confirms"],
    ["action log", "the code's record of every tool attempted, written before writes run"],
    ["workflow", "a scripted sequence of steps where the model is called only for judgement"],
  ],
  sections: [],
  quiz: [
    { q: "A courier booking timed out and the agent booked again. Whose fault?", options: ["The model's: it should remember", "The code's: the attempt was not recorded before running, and the tool was not idempotent", "The courier API's", "The customer's"], answer: 1, reason: true, whyOptions: ["The model only knows what the history shows; no result means no evidence.", "Correct. Log before writing, key the write so a retry is a no-op, and send the timeout back as a result.", "APIs time out; the runner must be built for it.", "No."], why: "Duplicates are prevented in code, not by the model's memory." },
    { q: "The model replies 'Your return is all set!' with no tool calls. What status?", options: ["done", "unfinished", "needs_confirmation", "step_limit"], answer: 1, whyOptions: ["Nothing ran; done is only through the finish tool.", "Correct. Text without finish is a failed run, handed to a person.", "No write was proposed.", "The budget did not end it."], why: "Completion is a tool, not a sentence." },
    { q: "A return always needs the same four steps. What should you build?", options: ["An agent with all four tools", "A workflow in code that calls the model for the judgement calls", "A bigger model", "A longer system prompt"], answer: 1, whyOptions: ["Freedom to reorder known steps only adds loops and cost.", "Correct. Script the known path; use the model where judgement is needed.", "Capability is not the issue.", "Prompts do not enforce order."], why: "Script what you can." },
  ],
  practice: [
    { q: "Write the stop conditions for a 'fix the failing test' coding agent and say what each exit shows the developer.", answer: "finish (tests pass, report lists files changed and the test output); step_limit at 30; cost cap; deadline 10 minutes; needs_confirmation before any command that deletes files or pushes; unfinished when the model stops without finish. Each exit shows the trace, the diff so far, and the status; only done is presented as success.", explain: "Every exit is explicit and visible." },
    { q: "The finish report says return_booked with courier_booking_ref 'CR-1029', but the action log has no book_courier call. What does the runner do?", answer: "Rejects the report with an error result ('Report rejected: no booking was made in this run'), appends it, and continues the loop within budget. If the model then books (pausing for confirmation) and reports again, the report is accepted. If budget ends first, status step_limit goes to a person.", explain: "The log is the truth; the report must match it." },
    { q: "Design the approval gate for the refund tool so the customer experience is good.", answer: "The agent proposes { order_id, amount, method } with a one-line reason. The page shows 'Refund £240 to your card ending 1234?' with Confirm and Not now. Confirm calls resume with approved true; the refund runs once with the pending id as idempotency key; the real outcome goes back as the tool result and the agent writes the summary. Not now returns a declined result so the agent offers alternatives.", explain: "Propose, confirm, run once, report the truth." },
  ],
  interview: [
    { level: "junior", q: "What is an AI agent?", a: "A loop in which a model decides which tool to call next toward a goal, your code runs the tool and feeds the result back, until the model finishes or the code stops it. The code owns the tools, the budget, the stop conditions and the record of what ran." },
    { level: "mid", q: "What stop conditions does a production agent need?", a: "A finish tool the model must call with a checked report; a step limit; a cost cap; a deadline; a pause for human confirmation before irreversible writes; and treating a text reply without finish as a failed run. Each exit returns a status the system can act on." },
    { level: "mid", tricky: true, q: "The agent booked a courier twice after a timeout. Should I add 'never book twice' to the prompt?", a: "It will not help reliably: the model saw no result, so from its view the first booking never happened. Fix it in code: record the attempt before running the write, make the write idempotent with a key, and return the timeout as a tool result so the model knows an attempt was made." },
    { level: "senior", q: "When would you not use an agent?", a: "When the steps are known: write a workflow in code and call the model only for judgement (classify, summarise, extract). Agents are for paths that depend on what is discovered along the way. Most 'agent' features are workflows with two or three model calls, and they are cheaper, faster and easier to test." },
    { level: "mid", q: "How do you handle an action that needs human approval mid-run?", a: "The runner stops when a write tool is requested, saves the message history and the pending call, and returns a needs_confirmation status with the proposal. The UI asks the person. A resume endpoint runs the write once (idempotency key), appends the real result as the tool result, and continues the loop within the remaining budget." },
    { level: "mid", tricky: true, q: "Is a bigger model the fix for an agent that loops?", a: "Rarely. Looping is usually a missing stop condition, a tool that returns the same unhelpful result, or no honest way to say 'cannot do this'. Add a step budget, a finish outcome for needs_person, and clearer tool results. Then consider the model." },
    { level: "junior", q: "Why make 'finish' a tool?", a: "So the run ends with a structured report (outcome, references, what was sent) that code can validate against the action log, instead of free text like 'all set!' that may describe nothing that happened." },
    { level: "senior", q: "Design a bounded agent for incident triage in an on-call system.", a: "Goal: the alert. Read tools: get_logs, get_metrics, recent_deploys, runbook_search. Write tools: page_engineer, rollback (proposal and confirmation). Finish reports severity, probable cause, evidence links and actions taken. Budget: 15 steps, 3 minutes, cost cap. Every exit posts the trace to the incident channel; unfinished or budget exits page a human with the trace. Idempotent writes keyed by alert id." },
    { level: "mid", q: "What should the action log contain?", a: "For every tool call: the run id, step, tool name, arguments, time started, result or error, and for writes an idempotency key and a settled flag. It is written before writes run. It is used to reject false finish reports, to debug runs, and to prove to a customer or auditor what happened." },
    { level: "mid", q: "How do budgets get tuned?", a: "From traces: look at the distribution of steps and cost for successful runs and set limits a little above the normal maximum; look at runs that hit limits and decide whether they were real failures or good runs cut short. Budgets are product decisions as much as technical ones (a return should not cost more than the item)." },
  ],
  remember: [
    "The model chooses the step; the code owns the loop.",
    "Done is a tool with a checked report. Text is not completion.",
    "Log before writing; idempotent writes; a person before money moves.",
    "Known steps → workflow. Unknown path → bounded agent.",
  ],
};
