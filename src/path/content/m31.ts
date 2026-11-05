import type { Exercise, LessonBody, Quiz } from "../types";

// Module 31: Agentic AI fundamentals. One concept per lesson.

export const M31_BODIES: Record<string, LessonBody> = {
  "m31-agentic-ai": {
    simple: "Agentic AI is a model that does not just answer once, but works toward a goal: it decides a step, acts through a tool, looks at what happened, and decides again until the job is done.",
    concept:
      "Everything so far in this path produced one answer per request. You send a prompt, the model writes a reply, the exchange is over. **Agentic AI** changes the shape of the exchange. Instead of one reply, the model is given a goal, a set of actions it may take, and a loop: pick an action, your code runs it, the result comes back, pick the next action, until the model says it is finished or your code stops it.\n\nThe model still only produces text. What makes the system agentic is the code around it: the loop that feeds results back, the tools that turn the model's requests into real effects, and the limits that decide when to stop. An agent is a model plus a loop plus tools plus limits, and the engineering is mostly in the last three.\n\nThe word 'agent' is used loosely in marketing. In this path it means exactly this: a model-driven loop where the model chooses the next step based on what it has observed so far.",
    why:
      "A single reply is enough when the question can be answered from what is in the prompt. Many useful jobs are not like that. Booking a trip means searching flights, checking the dates against a calendar, comparing prices, then booking. Fixing a failing test means reading the error, opening the file, editing it, running the tests again, maybe three times. Nobody can write the whole sequence in advance because each step depends on what the previous one revealed.\n\nAgentic AI exists for jobs where the path is discovered along the way. The model's judgement about what to do next, applied repeatedly, replaces a script that nobody could have written up front.",
    how: [
      "Your code gives the model a goal and a list of tools it may ask for, each described by name, purpose and parameters.",
      "The model replies either with text, or with a request to run a tool with specific arguments.",
      "Your code runs the tool, records what happened, and sends the result back as the next message.",
      "The model reads the result and decides again: another tool, or a final answer.",
      "Your code counts steps, time and cost, and ends the loop when the model finishes or a limit is hit.",
    ],
    visual: {
      kind: "flow",
      steps: ["goal + tools", "model picks an action", "code runs the tool", "result appended to the history", "model picks the next action", "finish, or a limit stops it"],
      caption: "The model decides; the code acts, records and limits. Every arrow back to the model carries what just happened.",
    },
    everyday: {
      title: "Asking a colleague to sort out a trip",
      text: "If you ask a colleague to 'get me to the Berlin conference next month', they do not answer in one sentence. They check your calendar, look up flights, notice the return clashes with a meeting, ask you about it, then book. Each step depends on what the last one showed. An agent is software that works the same way, with a model doing the deciding and your code doing the looking up and the booking.",
    },
    engineering: {
      title: "A coding agent fixing a failing test",
      text: "A software team runs an agent on every failing CI job. It is given the goal 'make the tests pass', and tools to read files, edit files and run the test command. A typical run: run tests, read the stack trace, open the failing file, make an edit, run tests again, see a different failure, fix that, run tests, pass, finish. Seven steps, none of which could have been scripted, because the second failure only appeared after the first fix. The team's work was not the model; it was the tools, the step limit of twenty, and the rule that the agent proposes a pull request rather than pushing to main.",
    },
    creative: {
      title: "A detective, not an oracle",
      text: "An oracle answers your question and falls silent. A detective takes a case, interviews a witness, learns something that sends them to a second witness, checks a record, and only then names the culprit. Agentic AI is the detective: the value is in the sequence of small investigations, each chosen because of what the previous one turned up.",
    },
    useIt: "Reach for an agent when the steps cannot be known in advance: research tasks, debugging, multi-system lookups, data fixing, anything where 'it depends what we find'. When the steps are known, a script that calls the model once or twice is cheaper, faster and easier to test. Module 33 shows how to decide.",
    takeaways: ["Agentic AI = a model choosing the next step in a loop, with tools and limits owned by your code.", "The model still only produces text; the loop and tools make it act.", "It fits jobs whose path is discovered along the way.", "The engineering is in the tools, the limits and the record of what ran."],
    terms: [["agent", "a model-driven loop that chooses and takes actions toward a goal"], ["tool", "a function your code runs when the model asks for it"], ["agent loop", "the repeated cycle of decide, act, observe"]],
    reflect: { q: "A chatbot that answers questions from a help centre in one call: is it an agent?", a: "No. It makes one decision (the answer) and never observes the result of an action. It becomes an agent when it can, say, look up an order, see the result, and decide whether to ask a follow-up or escalate." },
  },

  "m31-ai-assistant-vs-ai-agent": {
    simple: "An assistant answers; an agent acts. The difference is whether the model can take steps in the world and see their results before it is done.",
    concept:
      "An **AI assistant** takes your message and produces a reply. It may be very capable, it may use documents you supplied, but each turn ends with text for you to read and act on. You are the one who books the flight, edits the file, sends the email.\n\nAn **AI agent** is given the ability to take those steps itself, through tools, and to look at what happened before deciding the next one. The assistant tells you how to fix the bug; the agent edits the file, runs the tests and tells you it passed, or that it did not and why.\n\nThe line between them is not intelligence. The same model can be either. The line is the loop: does the model observe the consequences of actions and act again, or does it hand everything back to a person after one reply? Most products sit on a spectrum: an assistant with one lookup tool is a small agent; an agent that asks before every write is close to an assistant.",
    why:
      "The distinction matters because the two need different engineering and carry different risks. An assistant can be wrong, and the person reading it catches the error before anything happens. An agent can be wrong and have already sent the email. So agents need budgets, permission checks, logs and ways to stop, which an assistant does not.\n\nTeams that call an assistant an agent underestimate the work; teams that build an agent and think of it as an assistant skip the safety work. Naming the thing correctly decides what you build around it.",
    how: [
      "Ask: after the model replies, who takes the next action? If always a person, it is an assistant.",
      "Ask: can the model request an action, see its result, and request another without a person in between? If yes, it is an agent.",
      "For an agent, ask which actions change the world (send, pay, delete, deploy) and which only read. Reads can run freely; writes need gates.",
      "Design the stop conditions before the first run: step limit, cost limit, time limit, and which actions pause for approval.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Assistant", points: ["One reply per message", "A person acts on the reply", "Wrong answers are caught by the reader", "Needs: a good prompt, good context", "Example: 'here is how to fix the bug'"] },
      right: { title: "Agent", points: ["Many steps per goal", "The model acts through tools", "Wrong actions may already have happened", "Needs: tools, budgets, gates, logs", "Example: 'I fixed the bug; tests pass'"] },
      caption: "Same model, different loop, different risks. The right column needs everything the left column needs, and more.",
    },
    everyday: {
      title: "A travel guidebook and a travel agent",
      text: "A guidebook tells you which trains run to the coast and which hotels are good; you make every call yourself. A travel agent, given your dates and budget, books the train, reserves the hotel and sends you the tickets. You trust the agent with your card, so you want them to confirm before they pay. The guidebook needs no such trust. That difference in trust is the whole difference between an AI assistant and an AI agent.",
    },
    engineering: {
      title: "Two versions of the same support product",
      text: "A telecoms company shipped a support assistant first: it read the customer's question and the account page and drafted a reply for a human agent to send. Six months later they shipped the agent version: it could look up the account, apply a credit under £20, and reset a router, then tell the customer what it had done. The assistant needed a prompt and an evaluation set. The agent needed all of that plus a tool permission list, a credit limit enforced in code, an action log for audits, and an approval step for anything above £20. The second project took four times as long, and the extra time was entirely the loop's safety work.",
    },
    useIt: "Use the distinction when scoping a feature. If a person will act on every reply, build an assistant and spend the effort on prompt quality and context. If the model will act, budget for tools, gates, logging and evaluation before writing the first prompt.",
    takeaways: ["Assistant: replies, a person acts. Agent: acts through tools and observes results.", "The difference is the loop, not the model's intelligence.", "Agents can be wrong after the action happened, so they need budgets, gates and logs.", "Name it correctly and you know what to build around it."],
    terms: [["AI assistant", "a model that answers; a person takes every action"], ["AI agent", "a model that takes actions through tools and observes their results"], ["gate", "a point where an action waits for a person's approval"]],
    reflect: { q: "An assistant that can run one read-only database query per message: assistant or agent?", a: "A small agent. It acts (the query) and reads the result before replying. Because the action is read-only the risk is low, but if it could loop (query, read, query again) it is fully an agent and needs a step limit." },
  },

  "m31-agent-architecture": {
    simple: "An agent has five parts: a goal, a model that decides, tools that act, a memory of what happened, and a controller that runs the loop and enforces limits.",
    concept:
      "Strip any agent framework down and the same five parts appear. The **goal** is what the run is for, usually the first user message. The **model** reads the history and chooses the next action. The **tools** are functions your code runs on request. The **memory** is the record of everything so far: messages, tool calls, results. The **controller** is your code: it calls the model, runs tools, appends results, checks limits, and decides when the run is over.\n\nThe parts are separate on purpose. The model can be swapped for a cheaper one without touching the tools. A tool can be added without changing the controller. The memory can move from an in-process array to a database so a run survives a restart. The controller holds the rules that never change: step limits, which tools need approval, what counts as finished.\n\nThis **agent architecture** is the same whether the agent plans a holiday or fixes code. Only the goal, the tools and the limits differ.",
    why:
      "Frameworks hide these parts behind a single 'run' call, and that is fine until something goes wrong: a run costs £40, an email is sent twice, a step limit is hit and nobody knows why. Then you need to see the parts. Which tool ran? What did the model see before it decided? What rule should have stopped it?\n\nKnowing the architecture lets you build an agent from scratch in a hundred lines, debug a framework's agent when it misbehaves, and talk precisely about where a change belongs: 'that is a controller rule, not a prompt change'.",
    how: [
      "The controller starts a run: it creates the memory with the goal as the first message and sets the budget.",
      "It calls the model with the memory and the tool definitions.",
      "If the model requests a tool, the controller validates the arguments, runs the tool, and appends the request and the result to the memory.",
      "It checks the budget: steps, cost, time. Over budget means the run ends with a status.",
      "If the model replies with a final answer or a finish signal, the run ends with that result.",
      "Everything the controller did is written to a log for later inspection.",
    ],
    visual: {
      kind: "tree",
      root: "Agent",
      children: [
        { label: "Goal", children: ["the first message", "success criteria"] },
        { label: "Model", children: ["reads memory", "chooses the next action"] },
        { label: "Tools", children: ["read tools", "write tools (gated)"] },
        { label: "Memory", children: ["messages", "tool calls and results"] },
        { label: "Controller", children: ["the loop", "budgets", "approval gates", "the log"] },
      ],
      caption: "Five parts. Your code owns four of them; the model owns one decision per step.",
    },
    everyday: {
      title: "A kitchen during service",
      text: "A restaurant kitchen has an order (the goal), a head chef deciding what to cook next (the model), stations that fry, grill and plate (the tools), the ticket rail showing what has been done (the memory), and the pass where the manager checks every plate and watches the clock (the controller). Nobody would let the chef also be the manager and the station and the ticket rail. Separating the parts is what makes the kitchen run under pressure.",
    },
    engineering: {
      title: "A research agent, part by part",
      text: "A news organisation's research agent takes a question like 'what has this company said about layoffs this year?'. Goal: the question plus a required output format. Model: a mid-sized model, swapped for a larger one when the question is marked complex. Tools: web search, fetch page, read internal archive, all read-only. Memory: the message list, persisted to a database every step so a crashed run resumes. Controller: fifteen steps maximum, five minutes, a cost cap, and a finish tool that must list sources. When an editor reports a bad answer, the log shows exactly which pages were read and what the model saw before it wrote each line.",
    },
    code: {
      title: "The five parts in one small controller",
      lang: "ts",
      src: `type Budget = { maxSteps: number; maxCostUsd: number };

export async function runAgent(goal: string, tools: Tool[], budget: Budget) {
  const memory: Message[] = [{ role: "user", content: goal }];          // memory
  let cost = 0;
  for (let step = 1; step <= budget.maxSteps; step++) {                 // controller loop
    const reply = await client.messages.create({                        // model decides
      model: process.env.MODEL_AGENT!,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      tools: tools.map(toDefinition),
      messages: memory,
    });
    cost += costOf(reply.usage);
    memory.push({ role: "assistant", content: reply.content });
    if (cost > budget.maxCostUsd) return { status: "over_budget", memory };
    if (reply.stop_reason !== "tool_use") return { status: "done", memory };
    const results = [];
    for (const block of reply.content) {
      if (block.type !== "tool_use") continue;
      const result = await runTool(tools, block.name, block.input);     // tools act
      log.write({ step, tool: block.name, input: block.input, result });
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
    }
    memory.push({ role: "user", content: results });
  }
  return { status: "step_limit", memory };
}`,
      lines: [
        { code: "const memory: Message[] = [{ role: \"user\", content: goal }];          // memory", say: "The memory starts as the goal. Everything that happens is appended to it." },
        { code: "for (let step = 1; step <= budget.maxSteps; step++) {                 // controller loop", say: "The loop and its step limit belong to the controller, never to the model." },
        { code: "const reply = await client.messages.create({                        // model decides", say: "One model call per step. The model sees the whole memory and the tool list." },
        { code: "if (cost > budget.maxCostUsd) return { status: \"over_budget\", memory };", say: "A cost budget, checked every step. The run ends with a status, not an exception." },
        { code: "const result = await runTool(tools, block.name, block.input);     // tools act", say: "Your code runs the function the model asked for, after validating the arguments." },
        { code: "log.write({ step, tool: block.name, input: block.input, result });", say: "Every action is logged with its step. This is what you read when a run goes wrong." },
      ],
      note: "Approval gates for write tools and a required finish tool are added in Module 33. This is the skeleton every agent shares.",
    },
    useIt: "Use the five-part view when building, choosing or debugging an agent. Building: write the controller first, then the tools, then the prompt. Choosing a framework: check that you can see and change each part. Debugging: find which part failed before touching the prompt.",
    takeaways: ["Goal, model, tools, memory, controller: every agent has all five.", "Your code owns the controller, tools and memory; the model owns one decision per step.", "Keep the parts separate so each can change alone.", "Limits and logs live in the controller, never in the prompt."],
    terms: [["controller", "the code that runs the loop, runs tools, enforces budgets and ends the run"], ["memory (agent)", "the record of messages, tool calls and results for one run"], ["budget", "the step, cost and time limits a run may not exceed"]],
    reflect: { q: "A framework lets you set a step limit in the prompt: 'stop after ten steps'. Where should it live instead?", a: "In the controller. The model cannot count reliably and can be talked out of a prompt instruction; a loop counter in code cannot. Prompts guide behaviour; the controller guarantees it." },
  },

  "m31-goals-and-tasks": {
    simple: "A goal is what the run must achieve, written so that 'done' can be checked. Tasks are the smaller steps the agent chooses on the way there.",
    concept:
      "The **goal** is the first thing an agent sees and the thing every later decision is measured against. A vague goal makes a vague agent: 'help with the trip' can end anywhere. A good goal says what must be true at the end, what is out of scope, and what the output should look like: 'Find three return flights from Manchester to Berlin on 12 to 15 March under £250, list them with times and prices, and do not book anything.'\n\n**Tasks** are the steps the agent takes toward the goal: search flights, filter by price, format the list. The agent proposes tasks; the goal decides whether they were enough. When a task fails, the goal is what the agent returns to in order to choose another.\n\nThe discipline is the same as writing a good ticket for a colleague. Say the outcome, the constraints and the format, and leave the method to them.",
    why:
      "Models follow the goal they are given, literally. 'Book the cheapest flight' with no date range will book a flight at 5 am on the wrong day. 'Fix the tests' with no scope will delete a failing test. The goal is the only thing standing between a capable agent and a confidently wrong outcome, and it is the cheapest part to get right.\n\nA checkable goal also makes evaluation possible: if the goal says 'three flights under £250', a test can verify the output without a person reading it.",
    how: [
      "Write the outcome: what must be true when the run ends.",
      "Add constraints: budget, dates, what must not happen ('do not book', 'do not delete tests').",
      "Specify the output shape: a list, a file, a structured object.",
      "Say what to do when the goal cannot be met: report why, do not improvise.",
      "Let the agent choose the tasks; do not script them in the goal unless the order genuinely matters.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Weak goal", "What goes wrong", "Strong goal"],
        rows: [
          ["Book me a flight to Berlin", "wrong day, wrong price, booked without asking", "Find three options 12–15 March under £250; list times and prices; do not book"],
          ["Fix the tests", "deletes the failing test", "Make the tests pass by changing src/ only; do not modify tests/; stop and report if the test itself is wrong"],
          ["Summarise the research", "a paragraph with no sources", "Write 200 words on X with at least four cited sources from the last year; say if fewer than four exist"],
        ],
      },
      caption: "Outcome, constraints, format, and what to do on failure. Each strong goal can be checked by a test.",
    },
    everyday: {
      title: "Sending someone to the shops",
      text: "'Get some food' sends a teenager back with crisps. 'Get what we need for Thursday's curry for six people, under £25, and text me if the shop has no coriander' gets the right bag. The second request is a goal with an outcome, a constraint, a scope and a rule for failure. Agents need the second kind for the same reason teenagers do.",
    },
    engineering: {
      title: "A data-fixing agent and its scope line",
      text: "An e-commerce company ran an agent to fix inconsistent product categories. The first goal said 'clean up the categories'. The agent merged two real categories it judged similar and 300 products vanished from a landing page. The rewritten goal said: 'For each product whose category is empty or not in the approved list, propose a category from the approved list; output a CSV of product id, proposed category, confidence; change nothing.' The agent's job became proposing; a person applied the changes above a confidence threshold. Same model, same tools, different goal, no incident.",
    },
    useIt: "Every agent run should begin with a goal you could hand to a careful contractor: outcome, constraints, format, failure rule. Store goals as templates with variables, review them like code, and write an evaluation case for each one that checks the output shape.",
    takeaways: ["The goal is the first message and the measure of every later step.", "Outcome, constraints, output shape, and what to do if it cannot be met.", "Tasks are the agent's; the goal is yours.", "A checkable goal makes the run testable."],
    terms: [["goal", "the outcome a run must achieve, with its constraints and output shape"], ["task", "one step the agent chooses toward the goal"], ["scope", "what the agent may and may not touch"]],
    reflect: { q: "Why not put the exact list of tasks in the goal, since you know the usual path?", a: "Because then you have a script, and a script does not need an agent. If the path is known, write it as code and call the model only for judgement calls. Give an agent the goal when the path depends on what is found." },
  },

  "m31-planning": {
    simple: "Planning is the agent writing down, before acting, the steps it expects to take, so each step is chosen against a plan rather than on impulse.",
    concept:
      "Left alone, a model in a loop picks the next step from the latest result, which is how loops drift: three searches on the same term, a detail investigated that does not matter, the goal forgotten by step ten. **Planning** asks the model to produce a plan first: a short ordered list of what it intends to do and why. The plan is kept in the memory, so every later decision is made with the plan in view.\n\nThe plan is not a contract. Results change plans; that is the point of an agent. But having a plan means a change is a decision ('skip step 3, the API already returned what I needed') rather than a drift. The controller can also use the plan: show it to a person for approval before any action, or compare it with what actually ran to spot runs that lost their way.\n\nPlanning costs one extra model call at the start and pays for itself on any task longer than three steps.",
    why:
      "Without a plan, each step is chosen from the most recent result, and the most recent result is a poor guide to the whole task. A page fetched by a research agent is full of interesting links; a model deciding from that page alone will follow them. A plan written against the goal says 'two sources on pricing, one on layoffs, then write', and the links are measured against it.\n\nPlanning also makes agents inspectable. A person can read a five-line plan in seconds and stop a bad run before it costs anything, which is impossible when the only visible thing is a stream of tool calls.",
    how: [
      "Before any tool runs, ask the model for a plan: 3 to 8 numbered steps, each naming the tool it expects to use and what it expects to learn.",
      "Keep the plan in the memory as an assistant message, so it is visible on every later call.",
      "Optionally show the plan to a person and wait for approval before acting.",
      "At each step the model picks the next action with the plan in view; it may revise the plan, and if it does, the revision is recorded.",
      "At the end, compare the plan with the actions taken; large differences are worth a look.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Goal", detail: "'What has Acme said publicly about layoffs this year? 200 words, four sources.'" },
        { label: "Plan", detail: "1 search news for 'Acme layoffs 2026'; 2 fetch the two most credible results; 3 search Acme's press releases; 4 fetch one; 5 write 200 words with four citations." },
        { label: "Act", detail: "step 1 returns 9 results; step 2 fetches two; step 3 finds a press release that contradicts one article" },
        { label: "Revise", detail: "'Adding step 3b: fetch the earlier article to check the date.' recorded in memory" },
        { label: "Finish", detail: "200 words, four sources, one note about the contradiction" },
      ],
      caption: "The plan is written once, kept in view, revised explicitly. Drift becomes a visible decision.",
    },
    everyday: {
      title: "A shopping list versus wandering the aisles",
      text: "Go to a supermarket without a list and you come out with what caught your eye. Go with a list and you still pick up the olives you noticed, but you also come out with the milk you went for. The list did not stop you adapting; it stopped you forgetting. A plan does the same for an agent.",
    },
    engineering: {
      title: "A coding agent that shows its plan first",
      text: "A development-tools company added a planning step to their coding agent after watching runs edit files unrelated to the ticket. Now the agent first writes a plan: which files it will read, which it expects to change, and which tests it will run. The plan is shown in the pull-request draft before any edit happens; a developer can adjust it. Runs that changed files not in the plan dropped from a quarter to under five percent, and reviewers said the plan was the most useful thing in the PR description.",
    },
    code: {
      title: "A planning step before the loop",
      lang: "ts",
      src: `async function makePlan(goal: string, tools: Tool[]): Promise<string> {
  const reply = await client.messages.create({
    model: process.env.MODEL_AGENT!,
    max_tokens: 600,
    system: "You plan before acting. Write 3 to 8 numbered steps. For each step name the tool you expect to use and what you expect to learn. Do not act; only plan.",
    messages: [{ role: "user", content: "Goal:\\n" + goal + "\\n\\nTools available: " + tools.map((t) => t.name).join(", ") }],
  });
  return reply.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

export async function runWithPlan(goal: string, tools: Tool[], budget: Budget) {
  const plan = await makePlan(goal, tools);
  await approvals.show("plan", plan);                       // optional: a person reads it first
  const memory: Message[] = [
    { role: "user", content: goal },
    { role: "assistant", content: "My plan:\\n" + plan },
    { role: "user", content: "Proceed with the plan. If you change it, say which step and why." },
  ];
  return runLoop(memory, tools, budget);
}`,
      lines: [
        { code: "system: \"You plan before acting. Write 3 to 8 numbered steps. For each step name the tool you expect to use and what you expect to learn. Do not act; only plan.\",", say: "The planning call has no tools; it can only write. That is what stops it acting." },
        { code: "await approvals.show(\"plan\", plan);                       // optional: a person reads it first", say: "A five-line plan is something a person can approve in seconds, before any cost." },
        { code: "{ role: \"assistant\", content: \"My plan:\\n\" + plan },", say: "The plan is put in the memory as the model's own words, so every later step sees it." },
        { code: "{ role: \"user\", content: \"Proceed with the plan. If you change it, say which step and why.\" },", say: "Revisions are allowed but must be explicit, so they appear in the log." },
      ],
    },
    useIt: "Add a planning step to any agent that runs more than three steps or touches anything irreversible. Show the plan to people where the cost of a wrong run is high. Log plan revisions and compare plans with actions in your evaluation.",
    takeaways: ["A plan is a short ordered list written before acting and kept in view.", "It turns drift into explicit, logged revisions.", "A plan can be approved by a person before any cost.", "One extra call; worth it beyond three steps."],
    terms: [["plan", "the agent's written list of intended steps, kept in memory"], ["drift", "a loop choosing steps from the latest result until it loses the goal"]],
    reflect: { q: "The agent's plan says five steps; it finished in two because the first search found everything. Problem?", a: "No. A plan is a guide, not a contract. The run should record that steps 3 to 5 were skipped and why. The problem would be the reverse: twelve actions against a five-step plan with no recorded revision." },
  },

  "m31-reasoning-and-execution": {
    simple: "Reasoning is the model thinking through what to do next; execution is your code doing it. Keeping them separate is what makes an agent both smart and safe.",
    concept:
      "At each step an agent does two different things. **Reasoning** is the model's part: reading the memory, weighing the plan against the latest result, and choosing an action. It is text: 'the first search returned a press release dated last year, so I should search again with the current year'. **Execution** is the code's part: running the tool the model chose, with validated arguments, inside limits, and recording the result.\n\nThe model never executes anything. It produces a request; the controller decides whether to honour it. That gap is where every safety rule lives: argument validation, permission checks, approval gates, rate limits. A model that reasons well but executes nothing is harmless; a controller that executes without reasoning is a script. The agent is the two together, with a boundary between them.\n\nModern models can be asked to show their reasoning before each action. Visible reasoning makes runs easier to debug and often improves the choice itself, at the cost of more tokens.",
    why:
      "If the model's text could directly cause effects, every mistake in its reasoning would be an incident. The boundary between reasoning and execution means a mistake becomes a bad request that code can refuse: a tool that does not exist, an argument out of range, a write without approval. It also means the two halves can be improved separately: better prompts and models for reasoning, better validation and limits for execution.\n\nThe boundary is also where you can watch. Logging the reasoning next to the action tells you why the agent did what it did, which is the first question after anything goes wrong.",
    how: [
      "The model reads the memory and writes its reasoning: what it learned from the last result and what it intends to do.",
      "It emits a tool request: a name and arguments, as structured data.",
      "The controller validates: does the tool exist, do the arguments match the schema, is the tool allowed at this step?",
      "If the tool writes, the controller checks for an approval; if missing, it pauses the run.",
      "The controller executes the tool and records reasoning, request and result together.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Reasoning (the model)", points: ["Reads memory and plan", "Interprets the last result", "Chooses the next action", "Produces text and a tool request", "Can be wrong; costs nothing yet"] },
      right: { title: "Execution (your code)", points: ["Validates the request", "Checks permissions and budgets", "Runs the tool", "Records reasoning + action + result", "Can refuse; this is where safety lives"] },
      caption: "The model proposes; the controller disposes. Everything between the two columns is a check you can add.",
    },
    everyday: {
      title: "A navigator and a driver",
      text: "In a rally car the navigator reads the notes and calls the turns; the driver turns the wheel. The navigator can call a turn that does not exist; the driver, seeing a wall, does not take it. Reasoning and execution in an agent are the navigator and the driver, and the driver's refusal to go through walls is the controller's validation.",
    },
    engineering: {
      title: "An incident-triage agent that reasons out loud",
      text: "An on-call platform's agent investigates alerts. Each step it writes a line of reasoning ('error rate rose at 14:02, the last deploy was 13:58, I will fetch the deploy diff') and then requests a tool. The controller logs the reasoning with the tool call. During a post-incident review an engineer found the agent had correctly identified the deploy but then reasoned 'rolling back will fix it' and requested a rollback. The controller had paused for approval because rollback is a write tool; the engineer approved. The review praised two things: the reasoning that made the decision auditable, and the gate that made it the engineer's call.",
    },
    code: {
      title: "Reasoning recorded, execution guarded",
      lang: "ts",
      src: `for (const block of reply.content) {
  if (block.type === "text") reasoning = block.text;                  // what the model thought
  if (block.type !== "tool_use") continue;

  const tool = tools.find((t) => t.name === block.name);
  if (!tool) { results.push(errorResult(block.id, "unknown tool " + block.name)); continue; }

  const parsed = tool.schema.safeParse(block.input);                   // validate before anything runs
  if (!parsed.success) { results.push(errorResult(block.id, "invalid arguments: " + parsed.error.message)); continue; }

  if (tool.kind === "write" && !approvals.has(runId, block.id)) {       // writes wait for a person
    await log.write({ step, reasoning, requested: block.name, input: parsed.data, status: "awaiting_approval" });
    return { status: "needs_approval", proposal: { tool: block.name, input: parsed.data, reasoning }, memory };
  }

  const result = await tool.run(parsed.data);                          // execution
  await log.write({ step, reasoning, tool: block.name, input: parsed.data, result });
  results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
}`,
      lines: [
        { code: "if (block.type === \"text\") reasoning = block.text;                  // what the model thought", say: "The model's reasoning arrives as text next to its tool request. Keep it; it goes in the log." },
        { code: "if (!tool) { results.push(errorResult(block.id, \"unknown tool \" + block.name)); continue; }", say: "A request for a tool you did not offer is refused and reported back as a result, not executed." },
        { code: "const parsed = tool.schema.safeParse(block.input);                   // validate before anything runs", say: "Arguments are untrusted. The schema check sits between reasoning and execution." },
        { code: "if (tool.kind === \"write\" && !approvals.has(runId, block.id)) {       // writes wait for a person", say: "A write without an approval pauses the run and returns the proposal with its reasoning." },
        { code: "await log.write({ step, reasoning, tool: block.name, input: parsed.data, result });", say: "Reasoning, action and result stored together: the sentence that explains every line of the log." },
      ],
    },
    useIt: "Keep the two halves apart in any agent: ask the model to reason briefly before each action, treat every request as untrusted input, and put validation, permissions and approvals between the request and the run. Log them side by side.",
    takeaways: ["Reasoning is the model's text; execution is the controller's act.", "Every safety check lives in the gap between them.", "Requests are untrusted input: validate, permission-check, gate.", "Log reasoning next to action so runs explain themselves."],
    terms: [["reasoning", "the model's written thinking about what to do next"], ["execution", "the controller running the requested tool after checks"], ["validation", "checking a tool request's name and arguments before running it"]],
    reflect: { q: "Does showing the model's reasoning to the user make the agent safer?", a: "It makes it more explainable, which helps people catch mistakes and helps you debug. Safety comes from the checks the controller performs on the request; reasoning text alone can be wrong and confident." },
  },

  "m31-tool-usage": {
    simple: "Tools are how an agent touches the world. The model picks a tool by reading its description, so the description is as important as the code behind it.",
    concept:
      "A **tool** is a function your code exposes to the model, described by a name, a sentence about what it does and when to use it, and a schema for its arguments. The model never sees the code; it sees the description. When it decides a tool is needed, it emits the name and arguments; the controller runs the function and returns the output.\n\nTool usage in an agent differs from a single tool call in two ways. First, the agent chooses among several tools, repeatedly, so descriptions must tell tools apart: 'search the web' and 'search the internal archive' need to say when each is right. Second, results feed later decisions, so what a tool returns shapes the whole run: a result that is vague, huge or missing the key field sends the agent down the wrong path.\n\nGood tools are small, well-described, return compact structured results, and say clearly when they found nothing.",
    why:
      "The model's only knowledge of a tool is its description and its past results. A description that says 'gets data' will be called for the wrong things or not at all; a result that dumps a 40,000-token page fills the context and hides the answer. Teams that spend their time on prompts and neglect tools get agents that reason beautifully about the wrong information.\n\nTools are also the attack surface and the cost centre: every call costs time and sometimes money, and a write tool can do damage. Designing them carefully is most of agent engineering.",
    how: [
      "Name the tool for what it does: search_flights, read_file, create_ticket.",
      "Write the description for the model: what it returns, when to use it, when not to, and what 'nothing found' looks like.",
      "Define arguments with a schema, minimal and typed; identity and secrets come from the controller, never from arguments.",
      "Return compact, structured results with the fields the agent needs; truncate long content with a note.",
      "Mark the tool read or write; write tools need approval gates and idempotency.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Tool", "Description (for the model)", "Returns", "Kind"],
        rows: [
          ["search_flights", "Find flights between two airports on a date. Use when the traveller gives a route and date. Returns up to 10 options; found: 0 if none.", "list of {flight, depart, arrive, price}", "read"],
          ["read_calendar", "List the traveller's events in a date range. Use to check clashes before proposing times.", "list of {title, start, end}", "read"],
          ["hold_booking", "Reserve a flight for 30 minutes without paying. Use only after the traveller confirms the option.", "{hold_id, expires}", "write (gated)"],
          ["fetch_page", "Fetch a web page as text, truncated to 6,000 tokens. Use after search to read a specific result.", "{title, text, truncated}", "read"],
        ],
      },
      caption: "Each description says what, when, and what nothing looks like. Writes are marked so the controller can gate them.",
    },
    everyday: {
      title: "Labels on the drawers",
      text: "A new assistant in a workshop is only as good as the labels on the drawers. 'Screws' is useless; 'wood screws, 30–50 mm' lets them bring the right one. And when they come back with the wrong screw, the lesson is usually that the label was wrong, not the assistant. Tool descriptions are labels; most tool mistakes are label mistakes.",
    },
    engineering: {
      title: "The research agent that read whole pages",
      text: "A market-research firm's agent had a fetch_page tool that returned the full page. Runs filled their context window after four fetches and then answered from whatever survived. The fix was in the tool, not the prompt: return the title, the first 6,000 tokens, and a flag saying it was truncated, plus a second tool, find_in_page, for a specific phrase. Runs went from twelve steps and frequent context overflow to six steps and answers with the right quotes.",
    },
    code: {
      title: "A tool described for the model and guarded by code",
      lang: "ts",
      src: `const fetchPage: Tool = {
  name: "fetch_page",
  kind: "read",
  description: "Fetch one web page as plain text, truncated to 6,000 tokens. Use after search_web to read a specific result. Returns truncated: true when the page was cut; use find_in_page for a phrase deeper in the page.",
  schema: z.object({ url: z.string().url() }),
  async run({ url }) {
    if (!allowedHost(url)) return { error: "host not allowed" };
    const html = await fetch(url, { signal: AbortSignal.timeout(8000) }).then((r) => r.text());
    const text = htmlToText(html);
    const cut = truncateTokens(text, 6000);
    return { title: titleOf(html), text: cut.text, truncated: cut.truncated };
  },
};`,
      lines: [
        { code: "description: \"Fetch one web page as plain text, truncated to 6,000 tokens. Use after search_web to read a specific result. Returns truncated: true when the page was cut; use find_in_page for a phrase deeper in the page.\",", say: "What it does, when to use it, what the result means, and which tool to use instead. The model's whole guide." },
        { code: "schema: z.object({ url: z.string().url() }),", say: "One typed argument. The controller validates it before run() is called." },
        { code: "if (!allowedHost(url)) return { error: \"host not allowed\" };", say: "A guard in the tool itself: the model cannot send the agent to arbitrary hosts." },
        { code: "const cut = truncateTokens(text, 6000);", say: "Compact results keep the context usable for later steps." },
        { code: "return { title: titleOf(html), text: cut.text, truncated: cut.truncated };", say: "Structured, with an honest flag. The model knows when it has not seen everything." },
      ],
    },
    useIt: "Spend tool-design time in proportion: for every hour on the prompt, an hour on tool descriptions and result shapes. Keep tools small and single-purpose, truncate and structure results, mark writes, and test each tool's description by asking the model which tool it would use for ten sample requests.",
    takeaways: ["The model chooses tools by their descriptions; write them for the model.", "Results shape the run: compact, structured, honest about truncation and 'not found'.", "Identity and secrets come from the controller, not arguments.", "Read tools run freely; write tools are gated."],
    terms: [["tool description", "the text the model reads to decide when to call a tool"], ["truncation", "cutting a long result short, with a flag saying so"], ["read / write tool", "a tool that only fetches versus one that changes something"]],
    reflect: { q: "The agent keeps calling search_web when it should call search_archive. Prompt problem or tool problem?", a: "Almost always a tool problem: the two descriptions do not say when each applies. Fix the descriptions ('archive: our own past reports; web: everything else') before adding instructions to the prompt." },
  },

  "m31-observation-and-feedback": {
    simple: "Observation is what the agent sees after each action; feedback is what it learns from it. Both come back through the controller, and the agent can only be as good as what it is shown.",
    concept:
      "After the controller runs a tool, something happened in the world: a search returned results, a file changed, a request failed. The **observation** is the part of that the agent gets to see, appended to its memory as the tool result. It is the agent's only window onto the effects of its actions.\n\n**Feedback** is observation that carries a judgement: the tests failed with this message, the booking was refused because the seat was gone, the user said no. Feedback lets the agent correct course. An agent without feedback repeats mistakes; an agent with misleading feedback makes new ones confidently.\n\nThe controller decides what the agent observes. A timeout can be reported as 'the request timed out; the outcome is unknown' or silently dropped; the difference decides whether the agent retries safely or books twice. Shaping observations is as much the controller's job as running tools.",
    why:
      "Models have no senses. Everything an agent 'knows' about its actions is what the controller told it. If the test runner's output is cut off before the error, the agent cannot fix the error. If a failed payment returns an empty object, the agent may believe it succeeded. Most mysterious agent behaviour traces back to an observation that was missing, vague or wrong.\n\nFeedback is also where people enter the loop: a reviewer's comment on a draft, a user's thumbs-down, an approval refused with a reason. Delivering that as a clear observation turns a failed run into a corrected one.",
    how: [
      "After each tool runs, build the observation: the result, or an explicit error with a reason, or 'outcome unknown' for timeouts.",
      "Keep it compact and specific: the failing assertion, not the whole log; the refusal reason, not just 'failed'.",
      "Include feedback from people as observations in the same format: 'Reviewer: the summary omits the March figures.'",
      "Let the model respond to feedback before the next action; its revised reasoning is logged.",
      "Track repeated identical observations; three in a row usually means the agent is stuck and the controller should intervene.",
    ],
    visual: {
      kind: "flow",
      steps: ["action: run_tests", "world: 2 tests fail", "observation: 'FAIL test_total: expected 42 got 41 (line 18)'", "model: 'off by one in the rounding; edit line 18'", "action: edit_file", "observation: 'ok'", "action: run_tests", "observation: 'all 40 passed'"],
      caption: "The agent only moves because each observation is specific enough to act on. 'Tests failed' alone would loop.",
    },
    everyday: {
      title: "Parking by the beeps",
      text: "Reversing into a space with parking sensors, you move by the beeps: faster beeps, stop sooner. With no sensors you are guessing; with sensors that beep randomly you hit the wall anyway. The beeps are observations; their accuracy decides the parking. An agent reverses by the beeps its controller gives it.",
    },
    engineering: {
      title: "A deploy agent and the dropped timeout",
      text: "A platform team's agent deployed services and ran a smoke test. One afternoon the smoke-test tool timed out and the controller, written to return only successes or failures, returned an empty result. The agent read the empty result as 'nothing wrong' and marked the deploy healthy; the service was down for twenty minutes. The fix was one line in the controller: timeouts now return { status: 'unknown', reason: 'timed out after 30s' }, and the prompt says an unknown result must be treated as a failure until re-checked. The agent now re-runs the smoke test once and then pages a person.",
    },
    code: {
      title: "Observations that tell the truth",
      lang: "ts",
      src: `async function observe(tool: Tool, input: unknown): Promise<Observation> {
  const started = Date.now();
  try {
    const result = await withTimeout(tool.run(input), tool.timeoutMs ?? 10000);
    return { status: "ok", result: compact(result, 4000), ms: Date.now() - started };
  } catch (e) {
    if (e instanceof TimeoutError) return { status: "unknown", reason: "timed out after " + tool.timeoutMs + " ms; the action may or may not have happened" };
    if (e instanceof NotFound) return { status: "not_found", reason: e.message };
    return { status: "error", reason: String(e).slice(0, 500) };
  }
}

// a person's feedback enters the same way
function reviewerFeedback(note: string): Observation {
  return { status: "feedback", reason: "Reviewer: " + note };
}`,
      lines: [
        { code: "return { status: \"ok\", result: compact(result, 4000), ms: Date.now() - started };", say: "Success carries a compact result and how long it took; long results are trimmed with a note." },
        { code: "if (e instanceof TimeoutError) return { status: \"unknown\", reason: \"timed out after \" + tool.timeoutMs + \" ms; the action may or may not have happened\" };", say: "A timeout is 'unknown', never 'failed' or silence. The agent learns it must check before retrying a write." },
        { code: "if (e instanceof NotFound) return { status: \"not_found\", reason: e.message };", say: "Not found is a normal observation, distinct from an error, so the agent does not retry it." },
        { code: "return { status: \"feedback\", reason: \"Reviewer: \" + note };", say: "A person's comment becomes an observation in the same shape as a tool result." },
      ],
    },
    useIt: "Audit every tool's possible outcomes and decide what the agent observes for each: success, not found, error, timeout, partial. Route human feedback through the same channel. Watch for repeated observations as a sign the agent is stuck.",
    takeaways: ["The agent knows only what the controller shows it after each action.", "Observations must be specific, compact and honest: unknown is not success.", "Feedback, including from people, is an observation with a judgement.", "Repeated identical observations mean the controller should step in."],
    terms: [["observation", "what the agent is shown after an action"], ["feedback", "an observation carrying a judgement the agent can learn from"], ["unknown outcome", "a result status for actions whose effect could not be confirmed"]],
    reflect: { q: "Should the agent see the full 2,000-line test output or a summary?", a: "The failing assertions with file and line, plus counts. The full log hides the error in noise and costs tokens on every later step. If the agent needs more, give it a tool to fetch a section of the log." },
  },

  "m31-agent-loops": {
    simple: "The agent loop is decide, act, observe, repeat, until a finish condition or a limit. The limits are what make it a loop you can run in production.",
    concept:
      "Put the earlier pieces together and the **agent loop** appears: the model decides, the controller executes, the observation returns, and the model decides again. Each pass through the loop is a **step**. A run is a sequence of steps that ends in one of a few ways: the model finishes, a budget is exhausted, a write needs approval, or the model stops asking for tools without finishing.\n\nThe loop is simple to write and easy to get wrong in three ways. It can run forever if nothing counts steps. It can spend unboundedly if nothing counts cost. And it can end ambiguously if 'done' is just the model writing text that sounds final. Production loops therefore have a step budget, a cost budget, a time budget, a required way to finish, and a status on every exit.\n\nA loop with these properties can be left running without a person watching. One without them cannot.",
    why:
      "An unbounded loop turns small mistakes into large bills. A model that misreads a result will keep trying; a tool that always returns the same unhelpful answer will be called forty times; a model that believes it has finished will say 'all done' with nothing done. Each of these has happened to real teams in their first week.\n\nBounded loops also make agents measurable: a run that ends with status step_limit after twelve steps is data you can act on, whereas a run killed by hand after ten minutes is not.",
    how: [
      "Start the loop with the goal in memory and a budget: steps, cost, time.",
      "Each step: call the model, append its reply, check the cost budget.",
      "If the reply requests tools, run them (pausing for approval on writes), append observations.",
      "If the reply calls the finish tool, validate the report and end with status done.",
      "If the reply has no tool call and no finish, end with status unfinished.",
      "If a budget is exhausted, end with its status; always return the memory for inspection.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Exit", "Triggered by", "What the system does next"],
        rows: [
          ["done", "the model calls finish with a valid report", "deliver the result"],
          ["needs_approval", "a write tool was requested", "ask a person; resume with their decision"],
          ["step_limit / over_budget / timeout", "the controller's counters", "hand the trace to a person; tune budgets from data"],
          ["unfinished", "text without finish or tools", "treat as failure, never as success"],
        ],
      },
      caption: "Every exit has a name. A loop that can only end in 'done' or a crash is not ready for production.",
    },
    everyday: {
      title: "A timer on the stove",
      text: "You can reduce a sauce by tasting and stirring until it is right; that is the loop. You also set a timer, because 'until it is right' with no timer is how pans get burnt when the phone rings. The step budget is the timer: it does not decide when the sauce is done, it decides when you must stop regardless.",
    },
    engineering: {
      title: "Budgets tuned from traces at a logistics company",
      text: "A logistics firm's routing agent started with a step limit of 50, chosen by guess. Traces over a month showed successful runs took 4 to 11 steps, and every run over 15 steps ended badly: stuck re-querying a depot that returned the same empty result. They set the limit to 15, added a rule that three identical observations end the run with status stuck, and routed those runs to a dispatcher with the trace. Cost per run fell by a third and the dispatcher's queue became a list of real anomalies instead of a list of loops.",
    },
    maths: {
      formula: "expected cost per run ≈ steps × (input tokens per step × input price + output tokens per step × output price);   input tokens per step grow with the memory",
      meaning: "Every step re-sends the whole memory, so input tokens grow roughly linearly with step number, and total cost grows roughly with the square of the step count. Doubling the step budget can quadruple the worst-case bill.",
      worked: [
        "Memory starts at 2,000 tokens (goal, plan, tool definitions) and grows by about 800 tokens per step (request plus observation).",
        "Step 1 sends 2,000 tokens; step 10 sends 2,000 + 9 × 800 = 9,200 tokens.",
        "Ten steps send 2,000 + 2,800 + … + 9,200 = 56,000 input tokens in total; at £2.50 per million that is £0.14 for input alone.",
        "Twenty steps send 2,000 × 20 + 800 × (0 + 1 + … + 19) = 40,000 + 152,000 = 192,000 tokens, about £0.48: 3.4 times the cost for twice the steps.",
      ],
      note: "This is why step budgets matter more than they look, and why Module 32 trims memory.",
    },
    code: {
      title: "A loop with every exit named",
      lang: "ts",
      src: `export async function loop(memory: Message[], tools: Tool[], budget: Budget): Promise<Exit> {
  const deadline = Date.now() + budget.maxMs;
  let cost = 0;
  let lastObservation = "";
  let repeats = 0;
  for (let step = 1; step <= budget.maxSteps; step++) {
    if (Date.now() > deadline) return { status: "timeout", memory };
    const reply = await callModel(memory, tools);
    cost += costOf(reply.usage);
    memory.push({ role: "assistant", content: reply.content });
    if (cost > budget.maxCostUsd) return { status: "over_budget", memory };

    const calls = reply.content.filter((b) => b.type === "tool_use");
    if (calls.length === 0) return { status: "unfinished", memory };

    const results = [];
    for (const call of calls) {
      if (call.name === "finish") return { status: "done", report: call.input, memory };
      if (isWrite(call.name) && !approved(call)) return { status: "needs_approval", proposal: call, memory };
      const obs = await observe(toolNamed(call.name), call.input);
      const text = JSON.stringify(obs);
      repeats = text === lastObservation ? repeats + 1 : 0;
      lastObservation = text;
      if (repeats >= 2) return { status: "stuck", memory };
      results.push({ type: "tool_result", tool_use_id: call.id, content: text });
    }
    memory.push({ role: "user", content: results });
  }
  return { status: "step_limit", memory };
}`,
      lines: [
        { code: "if (Date.now() > deadline) return { status: \"timeout\", memory };", say: "Wall-clock budget, checked before each model call." },
        { code: "if (calls.length === 0) return { status: \"unfinished\", memory };", say: "Text alone does not end a run successfully. The model must call finish." },
        { code: "if (call.name === \"finish\") return { status: \"done\", report: call.input, memory };", say: "The one way to succeed: a finish call whose report the caller can validate." },
        { code: "if (isWrite(call.name) && !approved(call)) return { status: \"needs_approval\", proposal: call, memory };", say: "A write pauses the loop and hands the proposal to a person." },
        { code: "if (repeats >= 2) return { status: \"stuck\", memory };", say: "Three identical observations in a row: the loop is going nowhere, so the controller ends it." },
        { code: "return { status: \"step_limit\", memory };", say: "The step budget is the last line of defence, and it returns the memory for inspection." },
      ],
    },
    useIt: "Use this loop shape for every agent: budgets for steps, cost and time; finish as a tool; writes that pause; a stuck detector; a named status on every exit. Tune the budgets from traces after a week, not from guesses.",
    takeaways: ["Decide, act, observe, repeat; a step is one pass.", "Budgets for steps, cost and time; cost grows roughly with the square of steps.", "Finish is a tool; text alone is unfinished.", "Every exit has a status; the memory always comes back."],
    terms: [["step", "one pass through the loop: a model call plus any tool runs"], ["finish tool", "the tool the model must call to end a run successfully"], ["exit status", "the named reason a run ended"]],
    reflect: { q: "Why return the memory on every exit, even over_budget?", a: "Because the memory is the only explanation of what happened. A person handling the failed run needs to see what the agent tried, and you need it to tune budgets and fix tools. A status without a trace is a mystery." },
  },

  "m31-autonomous-vs-supervised-agents": {
    simple: "An autonomous agent runs to completion on its own; a supervised agent pauses for a person at defined points. Most production agents are supervised for anything irreversible.",
    concept:
      "An **autonomous agent** is given a goal and a budget and runs until it finishes or a limit stops it, with no person in the loop. A **supervised agent** has checkpoints where a person must look: approving a plan, confirming a write, reviewing a draft before it is sent. The run pauses, saves its state, and resumes when the person decides.\n\nThe choice is per action, not per agent. The same research agent can search and read autonomously and pause before publishing. The question for each tool is: if this action is wrong, can it be undone cheaply? Reads can be autonomous. Sending, paying, deleting and deploying cannot be undone, so they are supervised until the agent has earned trust through measured results.\n\nSupervision costs a person's time and adds delay. Autonomy costs the risk of unrecoverable mistakes. Teams move actions from supervised to autonomous one at a time, as the evaluation numbers justify it.",
    why:
      "Fully autonomous agents are attractive and dangerous in exactly the same way: nobody has to watch. In the first weeks of any agent, the reasons it fails are unknown, and an autonomous write tool turns each unknown failure into an incident. Supervision makes early failures cheap: the person at the gate catches them.\n\nFully supervised agents, on the other hand, are slow and tire the supervisor into rubber-stamping. The useful design is a spectrum: autonomous where mistakes are cheap, supervised where they are not, and a path for actions to graduate.",
    how: [
      "Classify every tool: reversible (read, draft, propose) or irreversible (send, pay, delete, deploy, publish).",
      "Run reversible actions autonomously within budgets.",
      "For irreversible actions, pause the run, save its state, and show the proposal with the reasoning to a person.",
      "Resume on approval with the real result as the observation; on refusal, give the reason as feedback and continue.",
      "Measure approval rates per action; when a person approves an action type 99% of the time over months, consider automating it with a spot check.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Autonomous", points: ["Runs to completion alone", "Fast; no waiting on people", "Mistakes happen before anyone sees them", "Right for reversible actions and proven paths", "Needs tight budgets and strong evaluation"] },
      right: { title: "Supervised", points: ["Pauses at defined checkpoints", "A person approves plans, writes, outputs", "Mistakes are caught at the gate", "Right for irreversible actions and new agents", "Costs attention; gates must stay meaningful"] },
      caption: "Per action, not per agent. Reads autonomous, writes supervised, and actions graduate as the numbers allow.",
    },
    everyday: {
      title: "A new employee's first month",
      text: "A new hire can read any file on day one. Sending an invoice needs a manager's sign-off for the first month. After a hundred correct invoices, the sign-off becomes a weekly spot check. Nobody designs that progression as 'trust'; it is reversibility and track record. Agents graduate the same way, and the sign-off is the approval gate.",
    },
    engineering: {
      title: "A marketing agent that graduated one action at a time",
      text: "A retailer's content agent drafts product descriptions, proposes price-label text and publishes to the storefront. At launch all three paused for a person. After two months, drafts were approved 98% of the time with trivial edits, so drafting became autonomous with a 5% random review. Price text stayed supervised because a wrong price is a legal problem. Publishing stayed supervised for a different reason: the approval rate was high, but the cost of the 2% was a live wrong page. The team keeps a table of action, approval rate, cost of error, and status, and reviews it monthly.",
    },
    code: {
      title: "Pause, persist, resume",
      lang: "ts",
      src: `// The loop returned needs_approval. Save everything and ask a person.
async function pauseForApproval(runId: string, exit: NeedsApproval) {
  await runs.save(runId, { memory: exit.memory, pending: exit.proposal, status: "awaiting" });
  await inbox.notify(ownerOf(runId), {
    title: "Agent wants to " + exit.proposal.name,
    detail: JSON.stringify(exit.proposal.input, null, 2),
    reasoning: exit.proposal.reasoning,
    approveUrl: "/runs/" + runId + "/approve",
    refuseUrl: "/runs/" + runId + "/refuse",
  });
}

// A person clicked approve or refuse.
async function resume(runId: string, approved: boolean, note?: string) {
  const saved = await runs.load(runId);
  const observation = approved
    ? await observe(toolNamed(saved.pending.name), saved.pending.input)
    : { status: "refused", reason: note ?? "The reviewer declined this action. Do not retry it; propose an alternative or finish." };
  saved.memory.push({ role: "user", content: [{ type: "tool_result", tool_use_id: saved.pending.id, content: JSON.stringify(observation) }] });
  return loop(saved.memory, tools, remainingBudget(saved));
}`,
      lines: [
        { code: "await runs.save(runId, { memory: exit.memory, pending: exit.proposal, status: \"awaiting\" });", say: "The run is persisted, so a person can take an hour, and a server restart loses nothing." },
        { code: "reasoning: exit.proposal.reasoning,", say: "The reviewer sees why the agent wants to act, not only what." },
        { code: ": { status: \"refused\", reason: note ?? \"The reviewer declined this action. Do not retry it; propose an alternative or finish.\" };", say: "A refusal is feedback. The agent learns it, and is told not to ask again." },
        { code: "return loop(saved.memory, tools, remainingBudget(saved));", say: "The loop resumes from the saved memory with whatever budget is left." },
      ],
    },
    useIt: "Start every new agent supervised for irreversible actions and autonomous for reads. Build pause and resume into the controller from the first version. Keep a per-action table of approval rate and cost of error, and graduate actions deliberately, with spot checks.",
    takeaways: ["Autonomy is decided per action by reversibility and track record.", "Reads run alone; sends, payments, deletes and deploys pause for a person.", "Pause means persist the run; resume means feed the decision back as an observation.", "Actions graduate from supervised to autonomous on measured approval rates."],
    terms: [["autonomous agent", "runs to completion with no person in the loop"], ["supervised agent", "pauses at checkpoints for a person's decision"], ["reversible action", "one whose effects can be undone cheaply"]],
    reflect: { q: "Approvals for a 'send email' action are at 99.5% after six months. Automate it?", a: "Look at the 0.5% first: what did those emails say, and what did they cost? If the worst case is a mild embarrassment, automate with a daily spot check. If one of them would have gone to a regulator or a customer with a wrong promise, keep the gate; the approval rate is not the only number." },
  },
};

export const M31_QUIZ: Quiz[] = [
  {
    q: "What makes a system 'agentic' rather than a chat assistant?",
    options: ["It uses a larger model", "The model can take actions through tools, observe the results and act again before finishing", "It has a longer system prompt", "It remembers previous conversations"],
    answer: 1,
    why: ["Model size does not change the shape of the exchange.", "Correct. The loop of decide, act, observe is what makes it an agent.", "Prompts shape answers, not the loop.", "Memory helps, but a chatbot with memory is still an assistant."],
    reason: true,
  },
  {
    q: "Which part of the agent owns the step limit?",
    options: ["The model, via an instruction in the prompt", "The controller, as a loop counter in code", "The tools", "The user"],
    answer: 1,
    why: ["Models cannot count reliably and can be talked past an instruction.", "Correct. A counter in code is a guarantee; a prompt is a suggestion.", "Tools do what they are asked.", "The user sets the budget; the controller enforces it."],
  },
  {
    q: "A tool times out. What should the agent observe?",
    options: ["Nothing; skip to the next step", "status: ok with an empty result", "status: unknown with a note that the action may or may not have happened", "status: failed"],
    answer: 2,
    why: ["Silence makes the agent assume the action never happened and retry writes.", "An empty success is read as 'nothing wrong'.", "Correct. Unknown tells the agent to check before retrying anything irreversible.", "A timeout is not a confirmed failure; the write may have gone through."],
    reason: true,
  },
  {
    q: "Why write a plan before the first action?",
    options: ["To use more tokens", "So each step is chosen against the goal, and drift becomes an explicit, logged revision", "Because the SDK requires it", "To avoid using tools"],
    answer: 1,
    why: ["Tokens are the cost, not the purpose.", "Correct. A plan in memory keeps the goal in view and makes changes visible.", "No SDK requires planning.", "Plans guide tool use; they do not replace it."],
  },
  {
    q: "The model replies with a paragraph saying 'All done!' and no tool call. What status does the loop return?",
    options: ["done", "unfinished", "step_limit", "needs_approval"],
    answer: 1,
    why: ["Done requires the finish tool with a report.", "Correct. Text without finish or tools is treated as a failed run.", "No budget was hit.", "No write was requested."],
  },
  {
    q: "Which action should be autonomous in a brand-new research agent?",
    options: ["Publishing the report to the company blog", "Searching the web and reading pages", "Sending the report to the client", "Deleting outdated reports"],
    answer: 1,
    why: ["Publishing is irreversible and public.", "Correct. Reads are reversible; they can run alone within budgets.", "Sending cannot be unsent.", "Deletion is irreversible."],
  },
  {
    q: "The agent keeps choosing search_web when search_archive was right. First thing to fix?",
    options: ["Switch to a larger model", "The two tools' descriptions, so they say when each applies", "Raise the step limit", "Lower the temperature"],
    answer: 1,
    why: ["The model chose by the descriptions it was given.", "Correct. Tool choice is driven by descriptions; most tool mistakes are description mistakes.", "More steps means more wrong searches.", "Sampling is not the cause."],
  },
  {
    q: "Why does cost grow faster than the step count in an agent loop?",
    options: ["Models charge more per step", "Each step re-sends the whole memory, which grows every step", "Tools get slower", "Output tokens double each step"],
    answer: 1,
    why: ["Prices per token are constant.", "Correct. Input tokens per step grow with memory, so total cost grows roughly with the square of steps.", "Tool speed does not change token cost.", "Output per step is roughly constant."],
  },
];

export const M31_EXERCISES: Exercise[] = [
  {
    title: "Classify five products",
    kind: "think",
    task: "For each, say assistant or agent, and if agent, which actions should be supervised: a chatbot that drafts replies for a support person; a bot that reads tickets and assigns them to teams; a script that summarises each morning's news; a coding tool that edits files and runs tests; a travel tool that searches and books flights.",
    hints: ["Who takes the next action after the model replies?", "Which actions cannot be undone?"],
    solution: "Draft replies: assistant (a person sends). Ticket assigner: agent; assigning is reversible, autonomous with monitoring. Morning summary: not an agent, a one-call workflow. Coding tool: agent; reads and edits autonomous in a branch, pushing or merging supervised. Travel tool: agent; search autonomous, booking supervised until approval data justifies automating holds.",
  },
  {
    title: "Rewrite a weak goal",
    kind: "think",
    task: "Rewrite 'clean up the customer database' as a strong goal with outcome, constraints, output shape and a failure rule.",
    hints: ["What must be true at the end?", "What must the agent never do?"],
    solution: "'For every customer record with a missing or invalid email or a duplicated name and postcode, propose a fix: a corrected email where derivable, or a merge of duplicates. Output a CSV of record id, proposed change, confidence 0–1, evidence. Do not modify any record. If more than 10% of records are affected, stop and report the counts instead of proposing fixes.'",
  },
  {
    title: "Cost of a loop",
    kind: "calculate",
    task: "Memory starts at 3,000 tokens and grows 1,000 tokens per step. Input costs £3 per million tokens. Compute the total input tokens and cost for 8 steps and for 16 steps. By what factor did cost rise when steps doubled?",
    hints: ["Step k sends 3,000 + (k − 1) × 1,000 tokens.", "Sum an arithmetic series: n × (first + last) ÷ 2."],
    solution: "8 steps: first 3,000, last 10,000, total = 8 × 13,000 ÷ 2 = 52,000 tokens → £0.156. 16 steps: first 3,000, last 18,000, total = 16 × 21,000 ÷ 2 = 168,000 tokens → £0.504. Doubling steps multiplied cost by 3.2.",
  },
  {
    title: "Write the observations",
    kind: "code",
    task: "For a tool send_invoice that can succeed, fail validation, time out, or find no customer, write the four observations the agent should receive, as JSON objects with status and reason, and say which ones the agent may retry.",
    hints: ["Which outcomes are certain and which are unknown?", "Retrying a write after a timeout needs an idempotency key."],
    solution: "{ status: 'ok', invoiceId: 'INV-1042' } — no retry needed. { status: 'error', reason: 'validation: amount must be positive' } — fix the arguments, then retry. { status: 'unknown', reason: 'timed out after 10 s; the invoice may have been sent' } — do not blindly retry; check with get_invoice or retry only with the same idempotency key. { status: 'not_found', reason: 'no customer with id 77' } — do not retry; report or ask.",
  },
];
