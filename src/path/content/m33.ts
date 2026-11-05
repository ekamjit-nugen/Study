import type { Exercise, LessonBody, Quiz } from "../types";

// Module 33: Building AI agents. One concept per lesson.

export const M33_BODIES: Record<string, LessonBody> = {
  "m33-single-agent-architecture": {
    simple: "A single-agent system is one model, one loop, one set of tools and one state, with everything it needs to be run safely: budgets, gates, logs and a finish condition.",
    concept:
      "Before thinking about teams of agents, get one right. A **single-agent architecture** is the smallest complete agent: one model making the decisions, one controller running the loop, a tool set, a memory, and the production pieces around them: budgets, approval gates, an action log, a finish tool with a checked report, and persisted state.\n\nThe parts are arranged so the model's job is small: read the context, choose one action. Everything else is the controller's, and the controller is ordinary code you can test. That split is why a single well-built agent handles most real tasks: research, triage, data fixing, code changes. The temptation to add a second agent usually comes from a first agent that is missing a part.\n\nThis lesson assembles the pieces from Modules 31 and 32 into one reference design that the rest of the module builds on.",
    why:
      "Teams often reach for frameworks with 'multi-agent' in the name before they have one agent that reliably finishes, stays within budget and can be debugged. The result is several unreliable agents. A single agent with the full set of production pieces is easier to build, far easier to test, and covers the majority of use cases.\n\nHaving a reference design also means every new agent in the company has the same shape, the same log format and the same operational tools.",
    how: [
      "Controller: the loop with step, cost and time budgets; status on every exit; state saved every step.",
      "Tools: small, well-described, read or write; writes gated by approval and keyed for idempotency.",
      "Memory: goal and plan always; a verbatim window; a rolling summary; a working-state block; long-term facts loaded at start.",
      "Finish: a tool with a report schema, validated against the action log before the run is marked done.",
      "Reflection: code checks and a review call before finish is accepted.",
      "Observability: every step logged with reasoning, action, observation, tokens and cost.",
    ],
    visual: {
      kind: "tree",
      root: "One agent",
      children: [
        { label: "Controller", children: ["loop + budgets", "status on exit", "state saved per step"] },
        { label: "Tools", children: ["read: free", "write: gated, idempotent", "finish: report schema"] },
        { label: "Memory", children: ["goal + plan", "window + summary", "working state", "long-term facts"] },
        { label: "Quality", children: ["code checks", "review call", "evaluation set"] },
        { label: "Observability", children: ["step log", "traces", "run page"] },
      ],
      caption: "The reference design. Every later pattern in this module is a way of arranging or extending these parts.",
    },
    everyday: {
      title: "One good tradesperson before a crew",
      text: "A homeowner who hires a crew of five before finding one reliable builder gets five people arguing about the plan. One competent builder with the right tools, a clear brief and a budget finishes most jobs alone, and knows when to call a specialist. Build the one reliable agent first.",
    },
    engineering: {
      title: "A reference agent at a logistics company",
      text: "A freight company standardised on one agent design and built four agents from it in a quarter: customs-document checking, delivery-exception triage, carrier-rate comparison and a customer-update drafter. Each has the same controller library, the same log schema, the same run page and the same approval queue. When the triage agent misbehaved, the on-call engineer, who had never seen it, debugged it from its run page in ten minutes because it looked like the other three. The company's rule: a new agent is a new goal, a new tool set and a new evaluation set; nothing else changes.",
    },
    code: {
      title: "The reference agent as a configuration",
      lang: "ts",
      src: `export const deliveryTriage: AgentSpec = {
  name: "delivery-triage",
  model: process.env.MODEL_AGENT!,
  system: TRIAGE_PROMPT,
  tools: [getShipment, getCarrierStatus, searchPastExceptions, proposeCustomerMessage, finish],
  budget: { maxSteps: 12, maxCostUsd: 0.4, maxMs: 120000 },
  memory: { windowTokens: 8000, longTermScope: "team:ops", factsLimit: 5 },
  gates: { write: ["proposeCustomerMessage"] },
  reflect: { codeChecks: [reportCitesShipment, messageUnder120Words], reviewModel: process.env.MODEL_REVIEW! },
  finishSchema: TriageReport,
};

export const run = (goal: string, ownerId: string) => runAgent(deliveryTriage, goal, ownerId);`,
      lines: [
        { code: "tools: [getShipment, getCarrierStatus, searchPastExceptions, proposeCustomerMessage, finish],", say: "Four small tools and finish. The one write tool proposes a message; it does not send." },
        { code: "budget: { maxSteps: 12, maxCostUsd: 0.4, maxMs: 120000 },", say: "Three budgets, tuned from traces after the first week." },
        { code: "gates: { write: [\"proposeCustomerMessage\"] },", say: "The controller pauses for a person before this tool runs." },
        { code: "reflect: { codeChecks: [reportCitesShipment, messageUnder120Words], reviewModel: process.env.MODEL_REVIEW! },", say: "Reflection is configuration: code checks plus a separate review model." },
        { code: "finishSchema: TriageReport,", say: "Done means a report that matches this schema and the action log." },
      ],
      note: "Everything the agent is lives in this spec; the controller library is shared by every agent in the company.",
    },
    useIt: "Build one reference agent with all the parts and turn it into a library. New agents are then a spec: goal prompt, tools, budgets, gates, checks, finish schema. Resist a second agent until the first one is reliable and measured.",
    takeaways: ["One model, one loop, one tool set, one state, plus budgets, gates, logs, finish and reflection.", "The model chooses one action; the controller does everything else.", "A reference design makes every agent look and debug the same.", "Most tasks need one well-built agent, not several."],
    terms: [["single-agent architecture", "one model and loop with the full set of production pieces"], ["agent spec", "the configuration that defines one agent on a shared controller"], ["reference design", "the standard shape every agent follows"]],
    reflect: { q: "A colleague proposes a second agent to 'check the first agent's work'. What is the single-agent alternative?", a: "A reflection step: code checks plus a review call with a separate model and a rubric, inside the same run. It achieves the checking without a second loop, a second state and a protocol between them." },
  },

  "m33-tool-enabled-agents": {
    simple: "A tool-enabled agent gets its capabilities from a curated set of tools; choosing, describing and guarding that set is most of the design work.",
    concept:
      "A model with no tools can only talk. A **tool-enabled agent** can act because its controller exposes functions: search, read, write, call an API, run a command. The tool set defines what the agent can do, and its descriptions define what the agent will do, because the model chooses among tools by reading them.\n\nDesigning the set is a balance. Too few tools and the agent cannot finish; too many and it picks wrongly, wastes steps, and the tool definitions crowd the context. The useful number is usually four to ten, each single-purpose. Related tools are grouped by consistent naming (search_x, get_x) and their descriptions say when to use one rather than another.\n\nEvery tool is also a boundary: it validates its arguments, scopes by the user, returns compact results, and is marked read or write. The agent's power and its safety both live in that boundary.",
    why:
      "Agents fail through tools more than through reasoning. A missing tool makes the model improvise ('I will assume the price is…'). A vague description makes it call the wrong one. A tool returning raw data floods the context. A write tool with no gate causes the incident. Investing in the tool set, before the prompt, is what separates agents that work from demos.\n\nThe set is also the easiest thing to evolve: add a tool and the agent gains a capability; tighten a description and a class of mistakes disappears.",
    how: [
      "List the actions the goal needs; each becomes a tool or is deliberately left out.",
      "Keep each tool single-purpose; split 'manage_tickets' into get_ticket, search_tickets, propose_ticket_update.",
      "Write descriptions for the model: what it returns, when to use it, when not to, the shape of 'nothing found'.",
      "Validate arguments with a schema; take identity and secrets from the controller.",
      "Return compact structured results; truncate with a flag; distinguish error, not found and unknown.",
      "Mark read or write; gate writes; make them idempotent; log everything.",
      "Test the set: for twenty sample requests, check which tool the model picks.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Tool set for a research agent", "Kind", "Why it is there"],
        rows: [
          ["search_web(query)", "read", "find candidate sources"],
          ["search_archive(query)", "read", "our own past reports; preferred when they exist"],
          ["fetch_page(url)", "read", "read one result, truncated"],
          ["find_in_page(url, phrase)", "read", "a specific passage without re-fetching the whole page"],
          ["note(text)", "read", "write to working memory"],
          ["propose_report(markdown, sources[])", "write (gated)", "the deliverable, reviewed before publishing"],
          ["finish(report)", "finish", "end the run with a checked report"],
        ],
      },
      caption: "Seven tools, each with one job. Not present: 'publish', because this agent proposes and a person publishes.",
    },
    everyday: {
      title: "The right toolbox for the job",
      text: "A plumber brings a bag with a dozen tools chosen for plumbing, each with a clear use, not a van with every tool ever made. If they need to cut a tile, they know they lack the tool and say so rather than hacking at it with a wrench. A tool-enabled agent with a curated set behaves the same: it does what its tools allow and reports what it cannot do.",
    },
    engineering: {
      title: "Trimming a tool set from 31 to 9",
      text: "A customer-operations team's agent started with 31 tools auto-generated from their API: every endpoint became a tool. The model picked badly, averaged fourteen steps per run, and the tool definitions alone were 6,000 tokens per call. The team rewrote the set by hand: nine tools named for intents (get_customer, search_orders, propose_refund, …), each with a description written for the model and a compact result shape. Steps per run fell to five, tool-choice errors fell from 22% to 3%, and context per call dropped by a third. The API did not change; the agent's view of it did.",
    },
    code: {
      title: "A tool registry with validation and scoping",
      lang: "ts",
      src: `export function defineTool<I>(spec: {
  name: string;
  kind: "read" | "write";
  description: string;
  schema: z.ZodType<I>;
  run: (input: I, ctx: ToolContext) => Promise<unknown>;
}): Tool {
  return {
    ...spec,
    definition: { name: spec.name, description: spec.description, input_schema: zodToJsonSchema(spec.schema) },
    async invoke(raw: unknown, ctx: ToolContext) {
      const parsed = spec.schema.safeParse(raw);
      if (!parsed.success) return { status: "error", reason: "invalid arguments: " + parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ") };
      try {
        return { status: "ok", result: compact(await spec.run(parsed.data, ctx), 4000) };
      } catch (e) {
        if (e instanceof NotFound) return { status: "not_found", reason: e.message };
        return { status: "error", reason: String(e).slice(0, 300) };
      }
    },
  };
}

export const searchOrders = defineTool({
  name: "search_orders",
  kind: "read",
  description: "Find the signed-in customer's orders by product name or date range. Use when the customer refers to an order without a number. Returns up to 5 orders; found: 0 if none.",
  schema: z.object({ query: z.string().max(100).optional(), from: z.string().date().optional(), to: z.string().date().optional() }),
  run: async (input, ctx) => db.orders.search({ ...input, customerId: ctx.customerId, limit: 5 }),
});`,
      lines: [
        { code: "definition: { name: spec.name, description: spec.description, input_schema: zodToJsonSchema(spec.schema) },", say: "The same schema serves the model (as JSON Schema) and the validator." },
        { code: "if (!parsed.success) return { status: \"error\", reason: \"invalid arguments: \" + parsed.error.issues.map((i) => i.path.join(\".\") + \" \" + i.message).join(\"; \") };", say: "Bad arguments become a precise error observation the model can fix." },
        { code: "return { status: \"ok\", result: compact(await spec.run(parsed.data, ctx), 4000) };", say: "Every result is compacted on the way out, so no tool can flood the context." },
        { code: "run: async (input, ctx) => db.orders.search({ ...input, customerId: ctx.customerId, limit: 5 }),", say: "Scoping by the signed-in customer comes from the controller's context, never from the model." },
      ],
    },
    useIt: "Design the tool set before the prompt. Keep it small and single-purpose, write descriptions for the model, validate and scope in a shared wrapper, compact every result, and test tool choice on sample requests. Grow the set one tool at a time.",
    takeaways: ["The tool set defines what the agent can do; descriptions define what it will do.", "Four to ten single-purpose tools beat thirty generated ones.", "A shared wrapper validates, scopes, compacts and classifies results.", "Test tool choice directly on sample requests."],
    terms: [["tool set", "the curated functions an agent may call"], ["tool registry", "the shared code that wraps every tool with validation and result shaping"], ["tool-choice error", "the model calling the wrong tool for a request"]],
    reflect: { q: "Should the agent have a generic 'run_sql' tool so it can answer any data question?", a: "Rarely. It is a write-capable, injection-prone, unscoped tool with a description the model cannot use well. Prefer a few intent-named read tools with fixed queries and parameters; add a read-only, allow-listed query tool only with strong guards and for internal analysts." },
  },

  "m33-react-pattern": {
    simple: "ReAct is the pattern where the model alternates a short written thought with one action, then reads the observation, and repeats: reason, act, observe.",
    concept:
      "The **ReAct pattern** (Reason + Act) is the most common shape for a single agent step. Instead of asking the model for a whole plan or a bare tool call, each step asks for two things: a brief thought ('the first result is from 2019; I need something recent') and one action (a tool call). The controller runs the action and appends the observation, and the next step begins with the thought that reads it.\n\nThe interleaving is the point. Thought before action makes the action better chosen and leaves an explanation in the log. One action per step keeps each observation attached to the thought that caused it. Reading the observation before the next thought means every decision uses the latest evidence.\n\nReAct is step-by-step planning with a visible reasoning trace, and it combines well with a rolling plan: the plan says where the run is going; the thought says why this step is next.",
    why:
      "Models asked to act without thinking choose worse actions, and their traces are unreadable: a list of tool calls with no reasons. Models asked to think at length without acting produce plans that reality invalidates. ReAct's small alternation gets the benefit of both: a little reasoning grounded in the latest observation, then one concrete step.\n\nThe explicit thought is also what lets a person reviewing a run understand it, and what a reflection step can check ('you said the source was outdated but cited it anyway').",
    how: [
      "The prompt asks for, on every step, one short thought and then exactly one tool call.",
      "The controller appends the model's thought and tool request to the history, runs the tool, appends the observation.",
      "The next step's thought must reference the latest observation: what it showed, what it means for the plan.",
      "The loop continues until the thought concludes the goal is met and the action is finish.",
      "The log stores thought, action and observation as one record per step.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Thought", detail: "'The question is about current pricing; the archive may be stale. Search the web first.'" },
        { label: "Action", detail: "search_web({ query: 'Acme pricing 2026' })" },
        { label: "Observation", detail: "{ found: 6, results: [{ title: 'Acme pricing', url: …, date: '2026-09-02' }, …] }" },
        { label: "Thought", detail: "'The first result is the official page and recent. Fetch it.'" },
        { label: "Action", detail: "fetch_page({ url: 'https://acme.example/pricing' })" },
        { label: "Observation", detail: "{ title: 'Pricing', text: 'Starter £29/mo…', truncated: false }" },
        { label: "Thought", detail: "'I have the three tiers with prices from the official page. Finish with a citation.'" },
        { label: "Action", detail: "finish({ answer: …, sources: ['https://acme.example/pricing'] })" },
      ],
      caption: "Three cycles of reason, act, observe. Each thought reads the previous observation; each action is one tool call.",
    },
    everyday: {
      title: "Thinking aloud while fixing something",
      text: "A mechanic diagnosing a rattle says 'sounds like the exhaust bracket' (thought), taps it (action), hears nothing change (observation), says 'not that; maybe the heat shield' (thought), and reaches for it (action). Nobody plans the whole diagnosis up front, and nobody acts without a reason. Saying the reason aloud is what makes the apprentice able to follow. ReAct is diagnosis aloud.",
    },
    engineering: {
      title: "A support agent whose thoughts became the audit trail",
      text: "An insurance company's claims-triage agent uses ReAct. Each step logs the thought, the tool and the observation. When a claimant appealed a triage decision, the review board read the run: 'the policy excludes flood damage before the 2024 renewal; checking the renewal date' → get_policy → 'renewed 2023-11; the flood was 2024-02, so the exclusion does not apply; routing to standard handling'. The board upheld the decision in minutes. The company's compliance team now requires the ReAct trace for every automated triage.",
    },
    code: {
      title: "A ReAct step prompt and the step record",
      lang: "ts",
      src: `const REACT_SYSTEM = [
  "You work step by step.",
  "On every turn: first write one or two sentences of reasoning that refer to the latest observation, then call exactly one tool.",
  "Never call more than one tool per turn. Never act without the reasoning sentence.",
  "When the goal is met, your reasoning says so and you call finish.",
].join(" ");

type StepRecord = { step: number; thought: string; action: { name: string; input: unknown } | null; observation: unknown; tokens: number };

function recordStep(step: number, reply: Reply, observation: unknown): StepRecord {
  const thought = reply.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
  const call = reply.content.find((b) => b.type === "tool_use");
  return { step, thought, action: call ? { name: call.name, input: call.input } : null, observation, tokens: reply.usage.input_tokens + reply.usage.output_tokens };
}`,
      lines: [
        { code: "\"On every turn: first write one or two sentences of reasoning that refer to the latest observation, then call exactly one tool.\",", say: "The pattern in one instruction: a short grounded thought, then one action." },
        { code: "\"Never call more than one tool per turn. Never act without the reasoning sentence.\",", say: "One action per step keeps every observation attached to its reason." },
        { code: "const thought = reply.content.filter((b) => b.type === \"text\").map((b) => b.text).join(\" \").trim();", say: "The thought is the text part of the reply; the action is the tool-use part." },
        { code: "return { step, thought, action: call ? { name: call.name, input: call.input } : null, observation, tokens: reply.usage.input_tokens + reply.usage.output_tokens };", say: "One record per step: thought, action, observation, cost. The audit trail and the debugging view." },
      ],
    },
    useIt: "Use ReAct as the default step shape for single agents doing exploratory work. Insist on one action per step and a thought that references the latest observation. Store the step records; they are the explanation of every run and the input to reflection and evaluation.",
    takeaways: ["ReAct: a short grounded thought, one action, read the observation, repeat.", "Better-chosen actions and a readable trace.", "One action per step keeps observations attached to reasons.", "Combine with a rolling plan for direction."],
    terms: [["ReAct", "the reason-act-observe step pattern"], ["thought", "the model's short written reasoning before an action"], ["step record", "thought, action, observation and cost stored together"]],
    reflect: { q: "The model starts writing three paragraphs of reasoning per step. Good or bad?", a: "Usually bad: cost rises, and long reasoning before acting drifts into planning that the next observation will invalidate. Ask for one or two sentences; put longer thinking in a planning step or a reflection step where it belongs." },
  },

  "m33-planning-and-execution": {
    simple: "The planner-executor pattern separates deciding what to do from doing it: a planning call writes the steps, and an executor carries them out, with the planner called again when a step fails.",
    concept:
      "ReAct decides one step at a time. The **planning and execution** pattern (planner-executor) decides many steps at once: a planning call produces an ordered list of concrete tasks, and an executor runs them in order, calling the model only when a task needs judgement. If a task fails or returns something unexpected, control goes back to the planner with the results so far, and a new plan is produced for the remainder.\n\nThe pattern suits predictable tasks: the plan is cheap to produce, the executor is fast because many steps need no model call, and a person can approve the plan before anything runs. Its weakness is rigidity: when every step depends on the last, the plan is wrong by step two and the planner is called constantly, at which point ReAct is simpler.\n\nMany production agents use both: planner-executor for the known shape of the job, ReAct inside the steps that need exploration.",
    why:
      "ReAct pays for a model call on every step, including the ones that are obvious. A twenty-step job with twelve obvious steps spends twelve calls on nothing. Separating planning from execution lets the obvious steps run as plain code and reserves the model for the plan and for judgement. It also makes the run visible before it starts, which is what approval gates need.\n\nThe replanning loop is what keeps the pattern from being a brittle script: a failed step sends the results back to the planner, which adjusts.",
    how: [
      "Planner: a model call that turns the goal into an ordered list of tasks, each with a tool and arguments, or a 'judgement' marker.",
      "Optional approval: show the plan to a person.",
      "Executor: run tasks in order; tool tasks run without a model call; judgement tasks call the model with the task and results so far.",
      "On a task failure or unexpected result, stop executing, call the planner with the plan, the results and the failure, and get a revised plan for the remaining work.",
      "Cap replans; finish with a report assembled from the task results.",
    ],
    visual: {
      kind: "compare",
      left: { title: "ReAct", points: ["One model call per step", "Every step chosen from the latest result", "Flexible; drifts without a plan", "Best for exploration", "Cost grows with steps"] },
      right: { title: "Planner-executor", points: ["One planning call, then execution", "Obvious steps run as code", "Plan visible and approvable", "Best for predictable jobs", "Replanner handles failures"] },
      caption: "Two patterns, two cost profiles. Many agents plan the outline and ReAct inside the uncertain steps.",
    },
    everyday: {
      title: "A packing list versus packing by feel",
      text: "For a familiar weekend trip you write a packing list and work through it without thinking. For a trek into unknown terrain you pack by reasoning about each item. If, mid-list, you find the suitcase is smaller than you remembered, you stop and rewrite the list. Planner-executor is the packing list with permission to rewrite it.",
    },
    engineering: {
      title: "Onboarding automation with a visible plan",
      text: "An HR platform automates new-starter setup: create accounts, assign licences, add to groups, schedule inductions, send a welcome message. The planner turns the starter's role into a concrete task list (eleven tasks for an engineer, seven for sales); a manager approves it in one click. The executor runs the tool tasks directly; only the welcome message is a judgement task that calls the model. When a licence assignment fails because the pool is empty, the planner is called with the failure and produces a revised plan: request a licence, skip the dependent step, flag it in the report. Runs cost a tenth of the ReAct prototype and the approval step became the feature managers liked most.",
    },
    code: {
      title: "Plan, execute, replan on failure",
      lang: "ts",
      src: `const Plan = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    kind: z.enum(["tool", "judgement"]),
    tool: z.string().optional(),
    input: z.record(z.unknown()).optional(),
    instruction: z.string().optional(),
  })).min(1).max(20),
});

export async function planAndExecute(goal: string, tools: Tool[], maxReplans = 2) {
  let plan = Plan.parse(await structured(PLANNER_PROMPT, goal, Plan));
  await approvals.show("plan", plan);
  const results: Record<string, unknown> = {};
  let replans = 0;

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const out = task.kind === "tool"
      ? await toolNamed(tools, task.tool!).invoke(task.input, ctx)
      : await judge(task.instruction!, results);
    results[task.id] = out;
    if (isFailure(out)) {
      if (++replans > maxReplans) return { status: "needs_review", results };
      const remaining = plan.tasks.slice(i + 1);
      plan = Plan.parse(await structured(REPLANNER_PROMPT, { goal, done: results, failed: task, remaining }, Plan));
      i = -1;                                                           // start the revised plan from its first task
      await approvals.show("replan", plan);
    }
  }
  return { status: "done", report: assemble(goal, results) };
}`,
      lines: [
        { code: "kind: z.enum([\"tool\", \"judgement\"]),", say: "Each task is either a direct tool call or a step that needs the model." },
        { code: "await approvals.show(\"plan\", plan);", say: "The whole plan is visible before any task runs; a person can stop it here." },
        { code: "? await toolNamed(tools, task.tool!).invoke(task.input, ctx)", say: "Tool tasks run as plain code: no model call, no tokens." },
        { code: "plan = Plan.parse(await structured(REPLANNER_PROMPT, { goal, done: results, failed: task, remaining }, Plan));", say: "On failure the planner sees what was done, what failed and what was left, and produces a new plan." },
        { code: "if (++replans > maxReplans) return { status: \"needs_review\", results };", say: "A replan cap. Persistent failure ends with a status and the partial results." },
      ],
    },
    useIt: "Use planner-executor for jobs with a known shape: onboarding, report assembly, data migrations, multi-step integrations. Show the plan for approval, run obvious steps as code, reserve the model for judgement, and replan on failure with a cap.",
    takeaways: ["Planner writes the task list; executor runs it; failures go back to the planner.", "Obvious steps cost no model calls; the plan is approvable up front.", "Rigid for exploratory work; use ReAct inside uncertain steps.", "Cap replans and finish with assembled results."],
    terms: [["planner-executor", "a pattern separating plan generation from task execution"], ["judgement task", "a plan step that needs a model call"], ["replanner", "the planning call made with results and a failure to revise the remaining plan"]],
    reflect: { q: "The planner produced a 40-task plan. What does that tell you?", a: "The goal is too big for one plan; decompose it into sub-goals (Module 32) and plan each, or the job is actually a script that should be written as code with no planner at all." },
  },

  "m33-sequential-workflows": {
    simple: "A sequential workflow is a fixed chain of steps written as code, where the model is called at specific steps; it is the right tool when the order is known.",
    concept:
      "Not every job needs an agent choosing its steps. A **sequential workflow** is a pipeline: step one, then step two, then step three, in an order the engineer decided. Some steps call a model (classify this, extract that, draft this); others are ordinary code (fetch, validate, store). The model never chooses what happens next; the code does.\n\nWorkflows are the honest answer to most 'agent' requests. 'Read the invoice, extract the fields, check them against the purchase order, draft an email if they differ' is four steps in a fixed order. Writing it as a workflow gives predictable cost, easy testing (each step is a function), and no loop to go wrong. The model does the parts that need language; the code does the rest.\n\nKnowing when a workflow is enough is a core skill: it avoids building an agent for a problem that was a pipeline.",
    why:
      "Agents are flexible and expensive to make reliable. Workflows are rigid and cheap to make reliable. When the order of steps is known, flexibility buys nothing and costs budget, latency and debugging effort. Many early 'agent' projects were slow, costly workflows wearing an agent costume; rewriting them as pipelines cut cost by an order of magnitude and made them testable.\n\nWorkflows also compose: a workflow step can call an agent for the one part that genuinely needs exploration, keeping the agent small and bounded.",
    how: [
      "List the steps and their order; if the order never changes, it is a workflow.",
      "Write each step as a function with typed input and output; model steps use structured output so the next step gets data.",
      "Validate between steps: a bad extraction should stop the pipeline, not reach the email draft.",
      "Add retries and timeouts per step; log inputs and outputs per step.",
      "Call an agent from a step only where the path genuinely depends on what is found.",
    ],
    visual: {
      kind: "flow",
      steps: ["fetch invoice PDF (code)", "extract fields (model, structured)", "validate fields (code)", "compare with purchase order (code)", "draft discrepancy email (model)", "queue for approval (code)"],
      caption: "Six steps, two model calls, no loop. Each step is a function with a typed output and its own test.",
    },
    everyday: {
      title: "A recipe is a workflow",
      text: "Boil the pasta, make the sauce, combine, serve. The order is known; you do not decide each step by looking at the pan. A few steps need judgement ('season to taste'), most do not. Cooking by recipe is a workflow with a human model call at the seasoning step. Cooking with no recipe from whatever is in the fridge is an agent.",
    },
    engineering: {
      title: "Invoice processing, rewritten as a pipeline",
      text: "An accounts team's first invoice 'agent' let the model decide its steps: it sometimes re-fetched the PDF, sometimes drafted the email before checking the purchase order, and cost £0.30 per invoice over nine steps. The rewrite is a six-step workflow with two model calls, one for extraction with a schema and one for the email draft, and code for everything else. Cost fell to £0.04 per invoice, latency from 40 seconds to 6, and each step has unit tests. The only agent left in the system handles the 3% of invoices where the purchase order cannot be found, which genuinely needs exploration.",
    },
    code: {
      title: "A typed pipeline with two model steps",
      lang: "ts",
      src: `export async function processInvoice(invoiceId: string): Promise<Outcome> {
  const pdf = await storage.fetch(invoiceId);                                      // code
  const fields = await extractStructured(InvoiceFields, EXTRACT_PROMPT, pdf.text);  // model, schema-validated
  const problems = validate(fields);                                               // code
  if (problems.length) return { status: "needs_review", problems };

  const po = await purchaseOrders.find(fields.poNumber);                           // code
  if (!po) return await findPurchaseOrderAgent.run({ fields });                     // the one exploratory case
  const diffs = compare(fields, po);                                               // code
  if (diffs.length === 0) return await ledger.post(fields);

  const email = await draft(DISCREPANCY_PROMPT, { fields, po, diffs });            // model, prose
  await approvals.queue({ kind: "discrepancy_email", invoiceId, email });          // code
  return { status: "awaiting_approval" };
}`,
      lines: [
        { code: "const fields = await extractStructured(InvoiceFields, EXTRACT_PROMPT, pdf.text);  // model, schema-validated", say: "The first model step returns data matching a schema, so the next step is ordinary code." },
        { code: "if (problems.length) return { status: \"needs_review\", problems };", say: "Validation between steps: a bad extraction never reaches the email." },
        { code: "if (!po) return await findPurchaseOrderAgent.run({ fields });                     // the one exploratory case", say: "An agent is called from one step, for the one case whose path is unknown." },
        { code: "const email = await draft(DISCREPANCY_PROMPT, { fields, po, diffs });            // model, prose", say: "The second model step writes prose for a person, with the facts supplied by code." },
      ],
    },
    useIt: "Default to a workflow. Ask 'does the order of steps ever change?'; if not, write the pipeline, call the model at the steps that need language, validate between steps, and embed an agent only where exploration is genuinely required.",
    takeaways: ["A sequential workflow is a fixed pipeline; code decides the order, the model does the language steps.", "Predictable cost, easy tests, no loop to go wrong.", "Validate between steps with structured output.", "Embed an agent only for the step whose path is unknown."],
    terms: [["sequential workflow", "a fixed, ordered pipeline of steps"], ["pipeline step", "one function with typed input and output"], ["embedded agent", "an agent called from a single workflow step"]],
    reflect: { q: "A product manager asks for 'an agent that onboards customers'. What do you ask first?", a: "Whether the onboarding steps ever change order. If every customer goes through the same sequence with a few judgement calls, it is a workflow with model steps, and it will be cheaper, faster and more reliable than an agent." },
  },

  "m33-conditional-workflows": {
    simple: "A conditional workflow branches: code or a model decides which path to take next, with routing, loops and guards kept explicit so every path is testable.",
    concept:
      "Real pipelines have forks. A support message goes to billing or technical; an extracted invoice matches or does not; a draft passes review or goes round again. A **conditional workflow** adds branches to the sequence: at a decision point, either code (a rule) or a model (a classifier) chooses the next path. Loops are branches that go back: 'revise and review again, at most three times'.\n\nThe discipline is to keep the decision points explicit and few. Each branch is a named path with its own tests; each loop has a cap; each decision records which way it went and why. The model may decide a branch, but the set of branches is fixed by code: it chooses from a menu, never invents a path.\n\nThis is the middle ground between a rigid pipeline and an agent: the structure is known, only the route through it varies.",
    why:
      "Flat pipelines cannot handle variety; agents handle variety but cannot be fully tested. Conditional workflows handle the known variety with full testability: every path is a path you wrote. Most business processes are exactly this: a handful of cases, each with a known procedure, with a classifier at the front to tell them apart.\n\nMaking decisions explicit also makes them auditable and tunable: a routing decision made by a model is logged with its confidence, and a threshold can send uncertain cases to a person.",
    how: [
      "Draw the graph: steps as nodes, decisions as diamonds, with every outgoing branch named.",
      "Implement rule decisions as code and judgement decisions as classification calls with structured output and a confidence.",
      "Route low-confidence decisions to a person rather than guessing.",
      "Cap every loop; on the cap, exit to a review path.",
      "Log every decision with its inputs, choice and confidence; test every branch with at least one case.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Classify message", detail: "model → billing (0.92) | technical | account | other; below 0.7 → human" },
        { label: "Billing path", detail: "fetch invoices → explain charge (model) → send" },
        { label: "Technical path", detail: "search known issues → found? → send fix | else → create ticket" },
        { label: "Review loop", detail: "draft → review (model) → pass? send : revise; at most 2 revisions, then human" },
        { label: "Every exit", detail: "logged with the path taken and each decision's confidence" },
      ],
      caption: "The structure is fixed; the route varies. The model chooses from the menu at the diamonds; it never adds a node.",
    },
    everyday: {
      title: "A phone menu that works",
      text: "'Press 1 for billing, 2 for faults.' The paths are fixed; the caller chooses. A good menu also says 'or hold for an adviser' for the cases that fit no option. A conditional workflow is the phone menu with a model pressing the buttons on the caller's behalf, and 'hold for an adviser' as the low-confidence route.",
    },
    engineering: {
      title: "A claims workflow with four paths and one loop",
      text: "A travel-insurance company handles claims with a conditional workflow. A classification call routes each claim to cancellation, medical, baggage or other, with confidence; anything under 0.75 goes to an assessor. Each path is a short pipeline of code and model steps. The medical path has a loop: request missing documents, wait, re-check, at most twice. Every decision is logged. When the assessors noticed baggage claims were being misrouted as 'other', the log showed the classifier's confidence hovering around 0.72 on them; the team added two few-shot examples and the misrouting stopped. No agent, every path tested, and the workflow handles 80% of claims without a person.",
    },
    code: {
      title: "Explicit routing, a capped loop, a human fallback",
      lang: "ts",
      src: `const Route = z.object({ path: z.enum(["billing", "technical", "account", "other"]), confidence: z.number().min(0).max(1) });

export async function handleMessage(msg: Message): Promise<Outcome> {
  const route = await classify(Route, ROUTE_PROMPT, msg.text);
  await log.decision("route", { choice: route.path, confidence: route.confidence });
  if (route.confidence < 0.7) return handoff(msg, "uncertain route");

  switch (route.path) {
    case "billing": return billingPath(msg);
    case "technical": return technicalPath(msg);
    case "account": return accountPath(msg);
    default: return handoff(msg, "no path for 'other'");
  }
}

async function draftWithReview(msg: Message, facts: Facts): Promise<Outcome> {
  let draft = await draftReply(msg, facts);
  for (let round = 1; round <= 2; round++) {
    const review = await reviewReply(draft, facts);
    await log.decision("review", { round, verdict: review.verdict });
    if (review.verdict === "pass") return send(msg, draft);
    draft = await reviseReply(draft, review.problems);
  }
  return handoff(msg, "draft failed review twice");
}`,
      lines: [
        { code: "const Route = z.object({ path: z.enum([\"billing\", \"technical\", \"account\", \"other\"]), confidence: z.number().min(0).max(1) });", say: "The menu of paths is a fixed enum. The model chooses from it and reports confidence." },
        { code: "if (route.confidence < 0.7) return handoff(msg, \"uncertain route\");", say: "Uncertain decisions go to a person instead of a guessed path." },
        { code: "for (let round = 1; round <= 2; round++) {", say: "A loop with a cap. Two revisions, then a human." },
        { code: "return handoff(msg, \"draft failed review twice\");", say: "Every loop exit is a named path, logged with its reason." },
      ],
    },
    useIt: "Use conditional workflows for processes with a known set of cases: route with a classifier and a confidence threshold, keep branches as named functions, cap loops, log decisions, and test every path. Reserve agents for the branch whose procedure is unknown.",
    takeaways: ["Branches and loops added to a pipeline, with the structure fixed by code.", "Models choose from a menu of paths; low confidence goes to a person.", "Every loop is capped and exits to a named path.", "Every decision is logged; every branch is tested."],
    terms: [["conditional workflow", "a pipeline with branches and loops decided at explicit points"], ["routing", "choosing which branch handles an item"], ["confidence threshold", "the score below which a decision goes to a person"]],
    reflect: { q: "The classifier returns a path that is not in the enum. Can that happen?", a: "Not if the output is enforced with structured output and validated against the schema; an invalid value is a validation failure that routes to the fallback, never a new branch. The set of paths is code, not the model's choice." },
  },

  "m33-parallel-execution": {
    simple: "Parallel execution runs independent steps or sub-agents at the same time, cutting wall-clock time, with the controller gathering results and handling partial failures.",
    concept:
      "Many agent tasks contain work that does not depend on other work: fetching five pages, checking three APIs, drafting sections for four competitors. **Parallel execution** runs those at once instead of one after another. The controller launches the independent pieces, waits for all of them, and continues with the combined results.\n\nThere are two levels. Within a step, a model can request several tool calls at once, and the controller runs them concurrently and returns all the observations together. Across sub-goals, the controller runs separate agent runs in parallel, each with its own history and budget, and a synthesis step combines them.\n\nParallelism changes failure handling: one of five fetches failing should not fail the step. The controller gathers what succeeded, marks what failed, and lets the model or the plan decide whether the partial result is enough.",
    why:
      "Sequential agents are slow in a way people notice: ten tool calls at two seconds each is twenty seconds before the first useful thought. The same ten calls in parallel take two seconds. For research, monitoring and anything that fans out over a list, parallelism is the difference between a tool people wait for and one they use.\n\nIt also reduces context cost for fan-out work: five sub-agents each carry a short history instead of one agent carrying all five results in sequence.",
    how: [
      "Identify independence: pieces that need none of each other's results.",
      "Within a step: allow multiple tool calls per reply and run them with Promise.all (or allSettled); return all observations in one message.",
      "Across sub-goals: launch separate runs with their own budgets; limit concurrency to protect rate limits.",
      "Use allSettled semantics: collect successes, record failures as observations, never let one failure drop the others.",
      "Synthesise: a final step reads the combined results; partial results are labelled as partial.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Sequential", points: ["fetch A (2 s) → fetch B (2 s) → fetch C (2 s)", "6 seconds", "One history grows with all three results", "One failure stops the chain"] },
      right: { title: "Parallel", points: ["fetch A, B, C together", "2 seconds", "Results arrive as one observation set", "A failure in B is recorded; A and C proceed"] },
      caption: "Same work, a third of the time, and failures isolated. The controller does the gathering.",
    },
    everyday: {
      title: "Sending three people to three shops",
      text: "Needing bread, medicine and a parcel collected, you do not visit three shops in turn when three friends are free: each goes to one, and you meet back at home. If the pharmacy was closed, you still have the bread and the parcel, and you decide what to do about the medicine. Parallel execution is sending the friends; the meeting back is the gather step.",
    },
    engineering: {
      title: "A monitoring agent that checks 40 services",
      text: "A platform team's health-check agent inspected forty services one by one each morning: twelve minutes, and by the end the first results were stale. The rewrite fans out: forty check runs in parallel with a concurrency limit of ten to respect API rate limits, each a tiny agent with a budget of four steps. The controller gathers with allSettled; services whose checks errored are listed separately from services that reported problems. A synthesis step writes the morning summary. Twelve minutes became ninety seconds, and the summary now distinguishes 'unhealthy' from 'could not check', which the old version conflated.",
    },
    code: {
      title: "Parallel tool calls within a step, with partial failure",
      lang: "ts",
      src: `const calls = reply.content.filter((b) => b.type === "tool_use");

const settled = await Promise.allSettled(
  calls.map((call) => withConcurrencyLimit(limiter, () => toolNamed(tools, call.name).invoke(call.input, ctx))),
);

const results = calls.map((call, i) => {
  const s = settled[i];
  const observation = s.status === "fulfilled" ? s.value : { status: "error", reason: "tool crashed: " + String(s.reason).slice(0, 200) };
  log.write({ step, tool: call.name, input: call.input, observation });
  return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(observation) };
});
memory.push({ role: "user", content: results });   // all observations arrive together`,
      lines: [
        { code: "const calls = reply.content.filter((b) => b.type === \"tool_use\");", say: "The model asked for several tools in one reply; all of them are gathered." },
        { code: "calls.map((call) => withConcurrencyLimit(limiter, () => toolNamed(tools, call.name).invoke(call.input, ctx))),", say: "Run concurrently, but through a limiter so ten parallel fetches do not trip a rate limit." },
        { code: "const observation = s.status === \"fulfilled\" ? s.value : { status: \"error\", reason: \"tool crashed: \" + String(s.reason).slice(0, 200) };", say: "allSettled: a crashed tool becomes an error observation; the others are unaffected." },
        { code: "memory.push({ role: \"user\", content: results });   // all observations arrive together", say: "One message with every result, matched to its request by id." },
      ],
    },
    useIt: "Look for fan-out in every agent: lists of pages, services, candidates, sections. Run them in parallel with a concurrency limit and allSettled gathering, keep sub-runs' histories separate, and label partial results honestly in the synthesis.",
    takeaways: ["Independent work runs at once: within a step (multiple tool calls) or across sub-goals (parallel runs).", "Concurrency limits protect rate limits; allSettled isolates failures.", "Partial results are gathered and labelled, not dropped.", "Wall-clock time drops by the fan-out factor."],
    terms: [["parallel execution", "running independent steps or runs at the same time"], ["fan-out", "one step spawning many independent pieces of work"], ["allSettled", "waiting for every parallel piece and keeping both successes and failures"]],
    reflect: { q: "Two parallel sub-agents both decide to create the same ticket. What went wrong?", a: "The pieces were not independent: they shared a write effect. Writes in parallel branches need either a single owner (one branch writes, others propose) or idempotency keys derived from the shared intent so the second create is a no-op." },
  },

  "m33-human-in-the-loop": {
    simple: "Human-in-the-loop means a person is part of the run at defined points: approving plans or writes, answering the agent's questions, reviewing outputs, with the run pausing and resuming around them.",
    concept:
      "**Human-in-the-loop** is the design where people are a planned part of the agent's work, not an emergency stop. There are four common roles. Approver: the agent proposes an irreversible action and waits for a yes. Answerer: the agent hits a genuine ambiguity and asks a question instead of guessing. Reviewer: the agent's output is checked before it is used. Corrector: a person's edit or refusal becomes feedback the agent learns from in this run.\n\nEach role needs the same machinery: the run pauses with its state saved, the person is notified with enough context to decide quickly, and their decision re-enters the run as an observation. Good design keeps the person's part small and specific: 'approve this £180 refund' with the reasoning attached, not 'read this 40-step trace'.\n\nThe aim over time is to move people from approving everything to approving the risky and sampling the rest, as the evaluation numbers earn it.",
    why:
      "Agents are not reliable enough to act unsupervised on anything that matters, and some actions should never be unsupervised regardless. A person at the right point turns a probable mistake into a caught one at the cost of a few seconds. But badly placed people become a bottleneck or a rubber stamp: forty approvals a day with no context get approved without reading.\n\nDesigning the human role deliberately, few points, clear context, fast decisions, keeps the safety benefit without the fatigue.",
    how: [
      "Decide the human points: which actions need approval, when the agent may ask a question, which outputs are reviewed.",
      "Make asking a tool: ask_user(question, options) pauses the run like a write gate.",
      "On pause, save state and notify with a compact card: what, why (the reasoning), the cost of yes and of no, one-click responses.",
      "Resume with the decision as an observation; a refusal carries a reason; an answer carries the text.",
      "Measure: approval rate, time to decision, overrides. Graduate actions to spot checks when the numbers allow.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Human role", "When", "What they see", "What returns to the run"],
        rows: [
          ["approver", "before an irreversible write", "the action, the reasoning, the amounts", "approved, or refused with a reason"],
          ["answerer", "a genuine ambiguity", "one question with options", "the chosen option or free text"],
          ["reviewer", "before an output is used", "the output and its sources", "pass, or problems to fix"],
          ["corrector", "any time", "the draft, editable", "the edited version as feedback"],
        ],
      },
      caption: "Four roles, one mechanism: pause, notify with context, resume with the decision as an observation.",
    },
    everyday: {
      title: "The junior who knows when to ask",
      text: "A good junior does the routine work alone, asks one clear question when the brief is ambiguous ('do you want the March figures or the fiscal year?'), and brings anything expensive for a sign-off with a one-line reason. They do not ask about everything, and they do not guess about money. That judgement about when to involve a person is what human-in-the-loop design encodes.",
    },
    engineering: {
      title: "An ask_user tool that cut wrong guesses",
      text: "A legal-tech company's contract-review agent used to guess when a clause was ambiguous, and lawyers found the guesses in their reports. The team added an ask_user tool: the agent may pause and ask one question with up to four options, at most twice per run. Questions arrive as a card in the lawyer's queue and take seconds to answer. Guessed interpretations fell to near zero, runs got slightly longer, and the lawyers rated the agent as 'more careful' rather than 'slower'. The team watches the question rate; an agent that asks too often is given better context instead.",
    },
    code: {
      title: "Asking a person as a tool",
      lang: "ts",
      src: `const askUser = defineTool({
  name: "ask_user",
  kind: "write",                                       // it pauses the run like a write
  description: "Ask the user one specific question when the task is genuinely ambiguous and a wrong guess would be costly. Offer 2 to 4 options where possible. Use at most twice per run. Do not ask what you can find out with a tool.",
  schema: z.object({ question: z.string().max(300), options: z.array(z.string()).min(2).max(4).optional() }),
  run: async () => { throw new Error("handled by the controller: pauses the run"); },
});

// controller: a pause that notifies with context and resumes with the answer
async function pauseToAsk(state: RunState, call: ToolCall) {
  state.status = "awaiting_user";
  state.pending = { id: call.id, name: "ask_user", input: call.input, idempotencyKey: state.id + ":" + call.id };
  await runs.save(state);
  await inbox.card(state.ownerId, { title: call.input.question, options: call.input.options, replyUrl: "/runs/" + state.id + "/answer" });
}

async function resumeWithAnswer(runId: string, answer: string) {
  const state = await runs.load(runId);
  state.history.push({ role: "user", content: [{ type: "tool_result", tool_use_id: state.pending!.id, content: JSON.stringify({ status: "answered", answer }) }] });
  state.pending = undefined;
  state.status = "running";
  await runs.save(state);
  return advanceUntilPause(runId);
}`,
      lines: [
        { code: "description: \"Ask the user one specific question when the task is genuinely ambiguous and a wrong guess would be costly. Offer 2 to 4 options where possible. Use at most twice per run. Do not ask what you can find out with a tool.\",", say: "When to ask, how to ask, how often, and when not to. The model's whole guide to involving a person." },
        { code: "kind: \"write\",                                       // it pauses the run like a write", say: "Asking uses the same pause machinery as an approval gate." },
        { code: "await inbox.card(state.ownerId, { title: call.input.question, options: call.input.options, replyUrl: \"/runs/\" + state.id + \"/answer\" });", say: "The person gets a small card with options, not a trace to read." },
        { code: "state.history.push({ role: \"user\", content: [{ type: \"tool_result\", tool_use_id: state.pending!.id, content: JSON.stringify({ status: \"answered\", answer }) }] });", say: "The answer returns as the observation for the ask_user call, and the run continues." },
      ],
    },
    useIt: "Design the human points before building: approvals for irreversible writes, an ask_user tool with limits, review for outputs that people act on. Build the pause and resume once, notify with compact context, and track decision rates to graduate actions over time.",
    takeaways: ["People are planned parts of the run: approver, answerer, reviewer, corrector.", "One mechanism: pause with saved state, notify with context, resume with the decision as an observation.", "Keep the human's part small and specific to avoid rubber-stamping.", "Measure decisions and graduate actions to spot checks."],
    terms: [["human-in-the-loop", "a person taking part in the run at defined points"], ["ask_user tool", "a tool that pauses the run to ask the person a question"], ["decision card", "the compact notification a person uses to decide"]],
    reflect: { q: "The agent asks the user 'which file should I edit?' on every run. Is more human-in-the-loop the fix?", a: "No; it is a context problem. The agent should find the file with a tool. Questions should be for genuine ambiguity a tool cannot resolve; a high question rate means the agent lacks information or a search tool." },
  },

  "m33-agent-failure-handling": {
    simple: "Agents fail in known ways: loops, wrong tools, runaway cost, false success, unsafe writes. Each has a detector in the controller and a safe exit.",
    concept:
      "An agent that runs in production will fail, and the design question is how. **Agent failure handling** is the set of detectors and exits built into the controller for the failures that recur: getting stuck in a loop, calling tools wrongly, exhausting budget, declaring success falsely, trying an unsafe action, and crashing mid-step.\n\nEach failure has a signature the controller can see without understanding the task: the same observation three times, a tool error twice in a row, cost over the cap, a finish report that contradicts the log, a write without approval, an exception. Each has a safe exit: a named status, the saved state, and a hand-off to a person with the trace.\n\nFailure handling is not the model's job. The model can be asked to be careful, but the guarantees come from code that watches the run from outside.",
    why:
      "The first production week of any agent produces every one of these failures. Teams that handle them in the controller see them as statuses on a dashboard and tune budgets and tools from data. Teams that rely on the prompt ('do not loop', 'be careful with writes') see them as incidents.\n\nSafe exits also protect trust: a run that ends with 'stuck after 8 steps; here is what I found' is a useful result. A run that spins for ten minutes and then crashes is not, even if it would have finished.",
    how: [
      "Loop detection: identical observations in a row, or the same tool with the same arguments repeated; exit stuck.",
      "Tool errors: a tool failing twice with the same error; exit tool_failure or trigger a replan.",
      "Budget: step, cost and time caps; exit with the cap's name.",
      "False success: validate the finish report against the action log; reject and continue, or exit needs_review.",
      "Unsafe actions: writes without approval, tools not in the allow-list, arguments out of range; refuse and record.",
      "Crashes: state saved per step and writes logged first; resume from the last step on restart.",
      "Every exit: a status, the saved state, a notification with the trace.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Failure", "Detector (controller)", "Exit"],
        rows: [
          ["stuck in a loop", "3 identical observations, or same tool + same args twice", "status stuck; partial results to a person"],
          ["wrong tool usage", "validation errors twice in a row", "replan prompt; then tool_failure"],
          ["runaway cost or time", "cost > cap, time > deadline", "over_budget / timeout with the trace"],
          ["false success", "finish report claims an action the log lacks", "reject the report; continue; then needs_review"],
          ["unsafe action", "write without approval, tool not allowed", "refused observation; logged; alert if repeated"],
          ["crash mid-step", "process exit", "resume from saved state; writes checked by idempotency key"],
        ],
      },
      caption: "Six failures, six detectors, six exits. None of them needs the model to cooperate.",
    },
    everyday: {
      title: "Circuit breakers and smoke alarms",
      text: "A house does not rely on everyone being careful. It has a breaker that trips on an overload and an alarm that sounds on smoke, whatever caused it. Neither understands cooking; both watch for a signature and act. Agent failure handling is the breaker and the alarm for a run: it watches signatures, not intentions.",
    },
    engineering: {
      title: "The dashboard that replaced incident reports",
      text: "A recruitment platform's sourcing agent had a bad first month: loops that burned £30 a run, a finish that claimed emails were sent when they were not, and a crash that lost twenty runs. The team added the six detectors and a dashboard of exits by status. In month two, 'stuck' was 9% of runs, all traced to one search tool returning identical results for different queries; fixing the tool cut it to 1%. 'False success' appeared four times and each time the log-check caught it before anything was reported. The incident channel went quiet, and the weekly review became a look at the status chart.",
    },
    code: {
      title: "Detectors inside the loop",
      lang: "ts",
      src: `function checkFinish(report: FinishReport, actionLog: ActionLog): string | null {
  if (report.emailSent && !actionLog.has("send_email", { status: "ok" })) return "report claims an email was sent but no send_email succeeded";
  if (report.ticketId && !actionLog.resultsInclude(report.ticketId)) return "report cites ticket " + report.ticketId + " which no tool returned";
  return null;
}

function detectStuck(state: RunState, observation: string, call: ToolCall): boolean {
  const key = call.name + ":" + JSON.stringify(call.input);
  state.recentCalls = [...state.recentCalls.slice(-4), key];
  state.recentObs = [...state.recentObs.slice(-2), observation];
  const sameCallTwice = state.recentCalls.filter((k) => k === key).length >= 2;
  const sameObsThrice = state.recentObs.length === 3 && state.recentObs.every((o) => o === observation);
  return sameCallTwice || sameObsThrice;
}

// in the loop
if (call.name === "finish") {
  const problem = checkFinish(call.input, actionLog);
  if (problem) { results.push(errorResult(call.id, "Finish rejected: " + problem)); state.finishRejections += 1; }
  else return exit("done", state, call.input);
  if (state.finishRejections >= 2) return exit("needs_review", state);
}
if (detectStuck(state, obsText, call)) return exit("stuck", state);`,
      lines: [
        { code: "if (report.emailSent && !actionLog.has(\"send_email\", { status: \"ok\" })) return \"report claims an email was sent but no send_email succeeded\";", say: "False success is caught by comparing the report with what actually ran." },
        { code: "const sameCallTwice = state.recentCalls.filter((k) => k === key).length >= 2;", say: "The same tool with the same arguments, twice in the last five calls: a loop signature." },
        { code: "if (problem) { results.push(errorResult(call.id, \"Finish rejected: \" + problem)); state.finishRejections += 1; }", say: "A rejected finish goes back to the model as an observation; it can correct itself once." },
        { code: "if (state.finishRejections >= 2) return exit(\"needs_review\", state);", say: "Twice is enough. The run ends with a status and a person looks." },
        { code: "if (detectStuck(state, obsText, call)) return exit(\"stuck\", state);", say: "The stuck exit, with the state saved for inspection." },
      ],
    },
    useIt: "Put the six detectors in your controller library so every agent gets them. Give each a named exit and a notification with the trace. Review exits by status weekly; they point at the tool or prompt to fix.",
    takeaways: ["Failures have signatures the controller can detect without understanding the task.", "Loops, tool errors, budgets, false success, unsafe actions, crashes: detector and exit for each.", "Every exit is a status with saved state and a hand-off.", "Exit statistics drive fixes to tools and prompts."],
    terms: [["failure signature", "a pattern in the run the controller can detect"], ["safe exit", "ending the run with a named status, saved state and a hand-off"], ["false success", "a finish report claiming something the action log does not show"]],
    reflect: { q: "Why send a rejected finish back to the model instead of ending the run immediately?", a: "Because the model often fixes it in one step: it sends the email it claimed to have sent, or corrects the report. One retry is cheap; the second rejection ends the run so a lie cannot become a loop." },
  },

  "m33-agent-observability": {
    simple: "Agent observability is recording every run as a trace of steps, with reasoning, actions, observations, cost and status, so any run can be explained, counted and compared.",
    concept:
      "An agent run is a sequence of decisions, each depending on what came before. When one goes wrong, the only way to know why is a record made at the time. **Agent observability** is that record and the tools around it: a trace per run with a span per step (reasoning, action, observation, tokens, latency, cost), the exit status, the budget used, plan changes, approvals and their decisions, and links to the tools' own logs.\n\nOn top of the traces sit the views that make them useful: a run page that shows one run step by step; a dashboard of runs by status, cost and duration; alerts on rates (stuck runs up, cost per run up); and a way to replay a run against a new prompt or tool to see whether it would have gone differently.\n\nObservability is also what feeds evaluation: the bad runs on the dashboard become the test cases of the next version.",
    why:
      "Without traces, every bad run is a mystery and every improvement is a guess. With them, 'the agent did something odd on Thursday' becomes a page showing the step where the tool returned a truncated page and the model misread it. Budgets, tool descriptions and prompts all get tuned from traces; nothing else gives the data.\n\nTraces of agent runs contain more than chat traces: tool arguments, results, reasoning. They need the same care about personal data and secrets, and they are larger, so sampling and retention matter sooner.",
    how: [
      "One trace per run, keyed by run id, with the goal, owner, agent spec version and exit status.",
      "One span per step: reasoning, action name and arguments, observation (redacted, truncated), tokens in and out, cost, latency.",
      "Events for plan changes, approvals (requested, decided, by whom), replans and detector exits.",
      "A run page that renders the trace readably; a dashboard of runs by status, cost, steps and duration; alerts on rate changes.",
      "Redact personal data at write time; keep full bodies for a retention period, metadata longer; never log secrets.",
      "A replay tool: re-run a trace's goal with a new spec and diff the outcomes.",
    ],
    visual: {
      kind: "flow",
      steps: ["run starts (goal, spec v14)", "step 1: thought / search_web / 6 results / 1,900 tokens / 1.2 s", "step 2: thought / fetch_page / truncated / 2,400 tokens", "approval requested: propose_report → approved by R. Osei after 3 min", "exit: done, 7 steps, £0.11, 48 s", "dashboard: done 91%, stuck 4%, needs_review 5% this week"],
      caption: "The trace is the run, step by step; the dashboard is the traces, counted. Both come from the same records.",
    },
    everyday: {
      title: "A pilot's flight recorder and the airline's safety stats",
      text: "After an incident nobody argues from memory; the recorder shows every input in order. And across thousands of flights, the airline counts go-arounds and hard landings to spot trends before they become incidents. Agent observability is both: the recorder for one run and the statistics across runs.",
    },
    engineering: {
      title: "Replay that settled a prompt argument",
      text: "A sales-operations team disagreed about whether a new system prompt made their lead-research agent better. Their observability stack stores every run's goal and trace. They replayed the last 200 runs' goals with the new prompt, compared exit statuses, step counts, cost and a judge's score of the reports against the originals. The new prompt cut steps by 20% but raised needs_review exits from 3% to 9%, because it made the agent finish earlier with thinner reports. They kept the old prompt and added a rule about minimum sources. The argument took an afternoon instead of a month of anecdotes.",
    },
    code: {
      title: "Tracing a run and its steps",
      lang: "ts",
      src: `export class RunTrace {
  constructor(readonly runId: string, readonly meta: { agent: string; specVersion: string; ownerHash: string; goal: string }) {}

  async step(n: number, rec: { thought: string; action?: { name: string; input: unknown }; observation: unknown; usage: Usage; ms: number }) {
    await traces.append(this.runId, {
      kind: "step", n,
      thought: redact(rec.thought),
      action: rec.action ? { name: rec.action.name, input: redact(rec.action.input) } : null,
      observation: truncate(redact(rec.observation), 4000),
      tokensIn: rec.usage.input_tokens, tokensOut: rec.usage.output_tokens, cost: costOf(rec.usage), ms: rec.ms,
    });
  }
  async event(kind: "plan_changed" | "approval_requested" | "approval_decided" | "replan" | "detector", data: unknown) {
    await traces.append(this.runId, { kind, at: new Date().toISOString(), data: redact(data) });
  }
  async end(status: string, totals: { steps: number; cost: number; ms: number }) {
    await traces.finish(this.runId, { status, ...totals, ...this.meta });
    metrics.observe("agent.run", { agent: this.meta.agent, status }, totals);
  }
}`,
      lines: [
        { code: "constructor(readonly runId: string, readonly meta: { agent: string; specVersion: string; ownerHash: string; goal: string }) {}", say: "Every trace knows which agent and which version of its spec produced it, and the owner as a hash." },
        { code: "thought: redact(rec.thought),", say: "Reasoning is stored, redacted: it is the explanation of every action." },
        { code: "observation: truncate(redact(rec.observation), 4000),", say: "Observations are redacted and truncated; traces must not become a second copy of every document." },
        { code: "async event(kind: \"plan_changed\" | \"approval_requested\" | \"approval_decided\" | \"replan\" | \"detector\", data: unknown) {", say: "Events capture what the loop did around the steps: plans, approvals, detectors." },
        { code: "metrics.observe(\"agent.run\", { agent: this.meta.agent, status }, totals);", say: "The same end record feeds the dashboard counters: runs by agent and status, with cost and duration." },
      ],
    },
    useIt: "Trace every agent run from the first deploy: steps, events, exit, cost, spec version. Build the run page and the status dashboard before you need them. Redact and retain deliberately. Use replay to settle prompt and tool changes with data.",
    takeaways: ["A trace per run, a span per step, events for plans, approvals and detectors.", "Run page for one run; dashboard and alerts across runs; replay for changes.", "Redact at write; truncate observations; retain by rule; no secrets.", "Bad traces become evaluation cases."],
    terms: [["agent trace", "the recorded steps and events of one run"], ["run page", "the view of one trace, step by step"], ["replay", "re-running a past goal with a new agent spec to compare outcomes"]],
    reflect: { q: "Why store the agent spec version with every trace?", a: "Because a run is only explained by the prompt, tools and budgets that produced it. Without the version you cannot tell whether a change on Tuesday caused the failures on Wednesday, and you cannot replay faithfully." },
  },

  "m33-agent-evaluation": {
    simple: "Agent evaluation measures whole runs, not single answers: did the agent reach the goal, at what cost, within the rules, on a fixed set of tasks, before and after every change.",
    concept:
      "Evaluating an agent is harder than evaluating one model call because a run is many decisions and the outcome depends on tools and the environment. **Agent evaluation** therefore works at the level of tasks: a fixed set of goals with known correct outcomes, run end to end in a controlled environment, scored on outcome, cost, steps, and rule compliance.\n\nThe environment matters. Tools that touch the real world are replaced with recorded or simulated versions so runs are repeatable and nothing is sent or paid for. The outcomes are checked by code where possible (the ticket exists with the right fields, the tests pass) and by a judge model with a rubric where judgement is needed (the report is accurate and cites sources).\n\nThe suite runs before any change to the prompt, tools, model or budgets, and its numbers are compared with the last accepted run. A change that raises success but doubles cost or breaks a rule is visible as exactly that.",
    why:
      "Agents change behaviour with every prompt tweak, tool edit and model update, and a single observed run proves nothing because the next run samples differently. Without a task suite, teams ship changes on anecdotes and discover regressions from users. With one, every change has numbers: success rate, cost per task, steps, violations.\n\nEvaluation also defines what 'working' means in a way the team can agree on, and the task set grows from real failures into a record of everything the agent has been taught not to do.",
    how: [
      "Collect tasks: real goals from traces, with the correct outcome or a rubric; include tasks that must be refused or escalated.",
      "Build a sandbox: recorded tool responses or a seeded test environment; writes go to a fake that records them.",
      "Score each run: outcome (code check or judge), steps, cost, time, rule violations (unapproved writes, disallowed tools).",
      "Run each task several times; report success rate per task category and the distributions of cost and steps.",
      "Compare against the baseline; fail the change on regressions beyond a tolerance; review the failing traces.",
      "Add every production failure to the suite.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Metric", "How it is measured", "Why it matters"],
        rows: [
          ["task success", "code check of the end state, or a judge with a rubric", "did it do the job"],
          ["cost per task", "sum of model and tool cost from the trace", "can we afford it"],
          ["steps per task", "from the trace", "efficiency; loops show up here"],
          ["rule compliance", "no writes without approval, no disallowed tools, budgets respected", "safety"],
          ["escalation correctness", "tasks that should hand off do; tasks that should not don't", "judgement"],
          ["stability", "same task run 5 times: variance of success", "reliability"],
        ],
      },
      caption: "Six numbers per change. Success alone hides cost, loops and rule breaks.",
    },
    everyday: {
      title: "A driving test, not a Q&A",
      text: "You cannot assess a driver by asking them questions; you watch them drive a set route with the usual hazards and score the whole journey: did they arrive, how many errors, any dangerous moves. Agent evaluation is the driving test: fixed routes (tasks), a safe course (sandbox), and a score for the whole drive.",
    },
    engineering: {
      title: "A task suite for a code-fixing agent",
      text: "A developer-tools company evaluates its CI-fixing agent on 120 tasks: real failing builds from their history, each in a container with the repository at the failing commit. Success is the tests passing without modifying test files; the judge also scores whether the diff is minimal. Each change to the agent runs the suite three times per task. A model upgrade raised success from 71% to 78% but doubled the rate of diffs touching unrelated files; they kept the model and added a reflection check for unrelated changes, which brought it back down. Every production failure that users report becomes a new task within a day.",
    },
    code: {
      title: "A task runner with a sandbox and a baseline",
      lang: "ts",
      src: `type Task = { id: string; category: string; goal: string; fixture: string; check: (world: SandboxWorld) => Promise<boolean>; rubric?: string; mustEscalate?: boolean };

export async function evaluate(spec: AgentSpec, tasks: Task[], runsPerTask = 3) {
  const rows: Row[] = [];
  for (const task of tasks) {
    for (let r = 0; r < runsPerTask; r++) {
      const world = await sandbox.load(task.fixture);                      // recorded tools, fake writes
      const result = await runAgent(spec, task.goal, "eval", { tools: world.tools });
      const okOutcome = task.mustEscalate ? result.status === "needs_approval" || result.status === "needs_review" : result.status === "done" && (await task.check(world));
      const okJudge = task.rubric && result.status === "done" ? (await judge(task.rubric, task.goal, result.report)).pass : true;
      rows.push({ task: task.id, category: task.category, success: okOutcome && okJudge, steps: result.steps, cost: result.cost, violations: world.violations.length });
    }
  }
  const summary = summarise(rows);                                          // per category: success rate, p50/p95 cost and steps, violations
  const baseline = await baselines.load(spec.name);
  for (const [cat, s] of Object.entries(summary)) {
    if (baseline[cat] && s.success < baseline[cat].success - 0.05) throw new Regression(cat, s, baseline[cat]);
    if (s.violations > 0) throw new RuleViolation(cat, s);
  }
  return summary;
}`,
      lines: [
        { code: "const world = await sandbox.load(task.fixture);                      // recorded tools, fake writes", say: "Every task runs in a sandbox: tools answer from recordings, writes go to a fake that counts them." },
        { code: "const okOutcome = task.mustEscalate ? result.status === \"needs_approval\" || result.status === \"needs_review\" : result.status === \"done\" && (await task.check(world));", say: "Tasks that should escalate are scored on escalating; the others on a code check of the end state." },
        { code: "rows.push({ task: task.id, category: task.category, success: okOutcome && okJudge, steps: result.steps, cost: result.cost, violations: world.violations.length });", say: "One row per run: success, steps, cost, violations. The numbers that matter." },
        { code: "if (baseline[cat] && s.success < baseline[cat].success - 0.05) throw new Regression(cat, s, baseline[cat]);", say: "A category dropping more than five points fails the change." },
        { code: "if (s.violations > 0) throw new RuleViolation(cat, s);", say: "Any rule violation fails the change outright, whatever the success rate." },
      ],
    },
    useIt: "Build the task suite with the first version of an agent: real goals, a sandbox, code checks and a judge, several runs per task, per-category baselines. Run it before every change. Add production failures as tasks. Treat rule violations as hard failures.",
    takeaways: ["Evaluate whole runs on fixed tasks in a sandbox.", "Score outcome, cost, steps, rule compliance, escalation and stability.", "Compare per category against a baseline; fail on regressions and any violation.", "Grow the suite from production failures."],
    terms: [["agent evaluation", "measuring whole runs on a fixed task set"], ["sandbox", "a controlled environment with recorded tools and fake writes"], ["task suite", "the fixed set of goals with known outcomes"]],
    reflect: { q: "Success rose from 70% to 85% after a change, but average steps doubled. Ship it?", a: "Not without looking. Doubled steps means roughly tripled cost and slower runs; check whether the extra success came from more exploration or from loops that happened to end well. Decide with the cost and latency numbers, not success alone." },
  },
};

export const M33_QUIZ: Quiz[] = [
  {
    q: "A colleague wants to add a second agent to review the first agent's output. What does the single-agent reference design offer instead?",
    options: ["A bigger model", "A reflection step: code checks plus a separate review model inside the same run", "More tools", "A longer prompt"],
    answer: 1,
    why: ["Size is not the issue.", "Correct. Reflection gives the checking without a second loop and protocol.", "Tools do not review.", "Prompts cannot verify output."],
    reason: true,
  },
  {
    q: "The agent averages fourteen steps and picks the wrong tool a fifth of the time. The tool set has 31 auto-generated tools. First fix?",
    options: ["Raise the step limit", "Rewrite the set as a few intent-named tools with descriptions for the model", "Switch to ReAct", "Add a planner"],
    answer: 1,
    why: ["More steps, more wrong calls.", "Correct. Tool choice is driven by the set and its descriptions.", "Step shape does not fix a bad tool set.", "A plan over bad tools is still bad."],
  },
  {
    q: "In the ReAct pattern, what does each step contain?",
    options: ["A full plan and many actions", "A short thought referring to the latest observation, then one action", "Only a tool call", "Only reasoning"],
    answer: 1,
    why: ["That is plan-then-execute.", "Correct. Reason, act, observe; one action per step.", "Actions without reasons make unreadable traces.", "Reasoning alone does nothing."],
  },
  {
    q: "The steps of a job never change order and two of six need language. What should you build?",
    options: ["A ReAct agent", "A sequential workflow with two model steps", "A multi-agent system", "A planner-executor agent"],
    answer: 1,
    why: ["Flexibility buys nothing here and costs budget.", "Correct. A pipeline: code decides order, the model does the language steps.", "Far too much.", "Unneeded; the plan is already known."],
  },
  {
    q: "A routing classifier returns confidence 0.55 for 'billing'. What happens?",
    options: ["Take the billing path", "Hand off to a person: below the threshold", "Pick a random path", "Retry until confidence rises"],
    answer: 1,
    why: ["A guessed path is a wrong path a third of the time.", "Correct. Low confidence routes to a person.", "No.", "Retrying the same input does not add information."],
  },
  {
    q: "One of five parallel fetches fails. With allSettled gathering, what does the agent observe?",
    options: ["Nothing; the whole step fails", "Four results and one error observation", "Only the four results", "A retry of all five"],
    answer: 1,
    why: ["One failure must not drop the others.", "Correct. Successes and the failure are both reported; the agent decides.", "Hiding the failure misleads the agent.", "Wasteful and may repeat a write."],
  },
  {
    q: "The finish report says an email was sent; the action log has no successful send_email. What should the controller do?",
    options: ["Mark the run done", "Reject the finish with the reason, let the model correct once, then needs_review", "Send the email itself", "Ignore the log"],
    answer: 1,
    why: ["That is false success reaching the user.", "Correct. The log is the truth; one correction, then a person.", "The controller never invents actions.", "The log exists to be checked."],
    reason: true,
  },
  {
    q: "Why run agent evaluation tasks in a sandbox?",
    options: ["To make runs faster", "So runs are repeatable and nothing real is sent, paid or deleted", "Because models prefer it", "To avoid logging"],
    answer: 1,
    why: ["Speed is a bonus.", "Correct. Recorded tools and fake writes make tasks safe and comparable.", "No.", "Evaluation runs are traced too."],
  },
];

export const M33_EXERCISES: Exercise[] = [
  {
    title: "Workflow or agent?",
    kind: "think",
    task: "For each job, say workflow, conditional workflow, or agent, and name the model steps: nightly invoice matching; support message routing to four teams with reply drafting; investigating why a deployment's error rate doubled; generating product descriptions from a catalogue; migrating 300 customer integrations to a new API.",
    hints: ["Does the order of steps ever change?", "Is the path discovered along the way?"],
    solution: "Invoice matching: sequential workflow (extract with schema, compare, draft discrepancy). Support routing: conditional workflow (classifier with confidence, paths per team, capped review loop). Deployment investigation: agent (the path depends on what logs and diffs show), with ReAct and a rollback gate. Product descriptions: sequential workflow (one model step per product, validated). Integration migration: planner-executor per integration (inventory is predictable; fixes are exploratory, so a rolling plan inside).",
  },
  {
    title: "Design a tool set",
    kind: "think",
    task: "Design the tool set (name, kind, one-sentence description for the model, result shape) for an agent that investigates a doubled error rate after a deployment and may propose a rollback.",
    hints: ["Four to ten single-purpose tools.", "Which one is a write, and how is it gated?"],
    solution: "get_error_rate(service, window): read; 'Error rate time series for one service; use first to confirm the spike.' → {points[]}. list_deploys(service, since): read → {deploys[]}. get_deploy_diff(deployId): read, truncated → {files[], summary}. search_logs(service, query, window): read, compact → {lines[], truncated}. search_past_incidents(symptoms): read → {reports[]}. propose_rollback(deployId, reason): write, gated by on-call approval → {proposalId}. finish(report with cause, evidence, action taken). Seven tools; one write; identity from the controller.",
  },
  {
    title: "Budget a parallel fan-out",
    kind: "calculate",
    task: "A research step must fetch 12 pages at 1.5 s each. Sequentially, how long does the step take? With a concurrency limit of 4, how long? If the provider allows 60 requests per minute and three such agents run at once, is a limit of 4 per agent safe?",
    hints: ["Concurrency 4 means batches of 4.", "Three agents × 4 concurrent = 12 in flight; how many per minute?"],
    solution: "Sequential: 12 × 1.5 = 18 s. Concurrency 4: 3 batches × 1.5 s = 4.5 s. Three agents at 4 each = 12 concurrent requests; each takes 1.5 s, so up to 12 ÷ 1.5 × 60 = 480 requests per minute if saturated, far above 60. Safe only with a shared limiter capped at 1 request per second across agents, or a per-agent limit of 1 with queuing; concurrency must be set from the rate limit, not from the agent count.",
  },
  {
    title: "Write three evaluation tasks",
    kind: "code",
    task: "For the deployment-investigation agent, write three tasks as objects: one with a clear cause the agent should find, one where the right action is to escalate without rolling back, and one where the agent must refuse an unsafe request. Give each a fixture description and a check.",
    hints: ["Checks are code over the sandbox's end state.", "Escalation tasks are scored on escalating."],
    solution: "{ id: 'bad-config-deploy', category: 'cause', goal: 'Error rate doubled on checkout at 14:02; find the cause and propose an action', fixture: 'checkout: deploy at 13:58 changes a timeout from 30s to 3s; logs show timeouts', check: world => world.proposals.some(p => p.tool === 'propose_rollback' && p.input.deployId === 'd-981') && world.report.cause.includes('timeout') }. { id: 'upstream-outage', category: 'escalate', goal: same, fixture: 'no deploys in 24h; logs show 503 from the payments provider; status page red', mustEscalate: true, check: world => world.writes.length === 0 }. { id: 'unsafe-request', category: 'refuse', goal: 'Error rate doubled; roll back the last three deploys immediately without checking', fixture: 'three deploys, only one related', check: world => world.writes.length === 0 && (world.status === 'needs_approval' || world.report.refused) }.",
  },
];
