import type { Exercise, LessonBody, Quiz } from "../types";

// Module 34: Multi-agent systems. One concept per lesson.

export const M34_BODIES: Record<string, LessonBody> = {
  "m34-multi-agent-systems": {
    simple: "A multi-agent system is several agents, each with its own goal, tools and context, working on parts of one job and exchanging results through a structure your code defines.",
    concept:
      "One agent with one context can only hold so much and can only be good at so much. A **multi-agent system** splits a job across several agents: each has its own prompt, tools, memory and budget, and they pass work and results between them. A research agent gathers sources, a writing agent drafts, a reviewing agent checks, and something coordinates them.\n\nThe agents do not talk freely. They communicate through structures the code defines: a supervisor that assigns tasks, a shared document they read and write, messages with a fixed schema. The structure is what makes the system predictable; without it, several models exchanging prose is an expensive way to produce confusion.\n\nMulti-agent systems are a tool for scale and specialisation, not a default. They add coordination cost, more places to fail, and harder debugging. Module 33's single agent should be exhausted first.",
    why:
      "Three limits push a single agent past its best. Context: a long job fills one window with everything, and quality drops. Specialisation: a prompt tuned for careful reviewing is a poor drafter, and one prompt cannot be both. Parallelism: independent parts waiting in one loop waste time. Splitting into agents addresses all three: each has a short, relevant context, a prompt for its role, and can run alongside the others.\n\nThe cost is real: every boundary between agents is a place where information is lost, duplicated or misread. The design task is to keep the boundaries few and well-typed.",
    how: [
      "Split the job by role or by part: who gathers, who drafts, who checks; or one agent per competitor, per service, per file.",
      "Give each agent its own spec: prompt, tools, budget, finish schema. Keep contexts separate.",
      "Define how they exchange work: a supervisor assigning tasks, a shared store, or typed messages.",
      "Let the controller own the structure: ordering, parallelism, retries, the final assembly.",
      "Trace the whole system as one run with sub-runs, so a failure can be followed across agents.",
    ],
    visual: {
      kind: "tree",
      root: "Competitor report (system run)",
      children: [
        { label: "Supervisor agent", children: ["splits the job", "assigns tasks", "assembles the report"] },
        { label: "Research agents ×3 (parallel)", children: ["one per competitor", "tools: search, fetch, archive", "output: sourced facts"] },
        { label: "Writer agent", children: ["input: the three fact sets", "output: draft sections"] },
        { label: "Reviewer agent", children: ["input: draft + facts", "output: pass or problems"] },
      ],
      caption: "Four roles, five agents. Each has a short context and a prompt for its job; the supervisor and the controller hold the structure.",
    },
    everyday: {
      title: "A newsroom, not a lone reporter",
      text: "A big story is not written by one person doing everything. Reporters gather, a writer shapes, an editor checks, and a desk editor assigns and assembles. Each is good at their part and sees only what they need. The desk's rules about who hands what to whom are what stop it becoming chaos. A multi-agent system is a newsroom with the desk's rules written as code.",
    },
    engineering: {
      title: "From one overloaded agent to four",
      text: "A due-diligence firm's single agent produced memos from forty sources in one run. By step thirty its context held everything and the memos repeated themselves and missed late sources. The rebuild split it: a supervisor plans the memo's sections; four research agents run in parallel, one per section, each with a fresh context; a writer agent drafts from their structured outputs; a reviewer agent checks claims against the facts. Memo quality, scored by analysts, rose from 6.1 to 8.3 out of 10; total cost rose 30% because of the extra coordination calls, which the firm judged worth it. The team's note: 'the gain came from short contexts and a dedicated reviewer, not from the agents being clever together'.",
    },
    useIt: "Reach for multiple agents when one agent's context is overflowing, when one prompt cannot serve two roles well, or when independent parts could run in parallel. Define the structure before the prompts, keep boundaries typed, and trace the system as one run.",
    takeaways: ["Several agents with separate contexts, prompts and budgets, exchanging work through a defined structure.", "Motivated by context limits, specialisation and parallelism.", "Boundaries cost: information loss, more failures, harder debugging.", "Exhaust the single agent first; then design the structure before the agents."],
    terms: [["multi-agent system", "several agents cooperating on one job through a defined structure"], ["role", "the job one agent in the system is for"], ["boundary", "a hand-off point between agents where information is passed"]],
    reflect: { q: "A single agent is failing because its tool descriptions are poor. Will splitting it into three agents help?", a: "No. Each of the three inherits the bad tools and adds coordination cost. Fix the single agent's tools first; split only when the remaining problem is context size, role conflict or parallelism." },
  },

  "m34-why-use-multiple-agents": {
    simple: "Use multiple agents for three reasons only: separate contexts, specialised roles, and parallel work. If none applies, one agent is better.",
    concept:
      "The question 'why use multiple agents?' has a short honest answer and a long marketing one. The short answer has three parts.\n\n**Context isolation.** Each agent sees only what its task needs. A reviewer that never saw the research notes judges the draft on its own merits; a research agent for competitor B is not confused by competitor A's pages. Short, relevant contexts produce better decisions and cost less per step.\n\n**Specialisation.** A prompt, tool set and model chosen for one role: a cheap fast model for gathering, a careful model for reviewing, a strong model for synthesis. One agent would need one compromise prompt and one model for everything.\n\n**Parallelism.** Independent parts run at the same time, each with its own loop, cutting wall-clock time by the fan-out.\n\nEverything else attributed to multi-agent systems, 'emergent collaboration', 'agents debating', is either one of these three in disguise or a cost.",
    why:
      "Naming the real reasons protects against the common failure: adding agents because it sounds advanced, and ending with a slow, expensive system that is hard to debug and no better than one agent. When a proposal to add an agent cannot name which of the three reasons it serves, it should not be added.\n\nThe reasons also tell you how to split: by context (one agent per document set), by role (gather, draft, review), or by independent part (one per item in a list). Each gives a different structure.",
    how: [
      "Ask: is the single agent's context too long for its decisions? Split by context.",
      "Ask: does one prompt have to do two jobs that want different instructions or models? Split by role.",
      "Ask: are there independent parts waiting in sequence? Split by part and run in parallel.",
      "If none is true, stay with one agent and fix its tools, prompt or budgets.",
      "When splitting, choose the structure that matches the reason: supervisor for roles, fan-out for parts, shared store for context.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Reason", "Symptom in the single agent", "Split", "Structure"],
        rows: [
          ["context isolation", "quality drops late in long runs; cross-contamination between items", "by document set or item", "fan-out with separate contexts"],
          ["specialisation", "one prompt fighting itself (careful vs creative); one model too slow or too weak for part of the job", "by role", "supervisor or pipeline of roles"],
          ["parallelism", "sequential steps on independent items; long wall-clock", "by independent part", "parallel sub-runs, gathered"],
          ["none of these", "tools, prompt or budgets are the problem", "do not split", "fix the single agent"],
        ],
      },
      caption: "Three reasons, three splits. The last row is the most common correct decision.",
    },
    everyday: {
      title: "When to hire a second person",
      text: "A one-person shop hires a second person when the owner cannot hold everything in their head (context), when the shop needs skills the owner lacks (specialisation), or when customers queue while one job blocks another (parallelism). Hiring because 'bigger shops have more staff' leads to two people in each other's way. The same three reasons govern adding agents.",
    },
    engineering: {
      title: "A translation pipeline that split by role, and one that did not",
      text: "A localisation company tested two designs for translating product pages. Design A: one agent translates and self-checks. Design B: a translator agent on a fast model, a reviewer agent on a careful model with a glossary and style guide, and a fixer agent that applies the reviewer's notes. B cost 40% more per page and scored measurably better on terminology, because the reviewer's prompt could be strict in a way a self-checking translator's could not: a specialisation gain. The same company tried splitting a simple classification job into 'classifier' and 'verifier' agents and found no quality gain for double the cost; they reverted. The difference: the translation reviewer needed a different prompt and model; the classifier verifier did not.",
    },
    useIt: "Before adding an agent, write down which of the three reasons it serves and what symptom in the single agent proves it. If you cannot, do not add it. If you can, the reason tells you the split and the structure.",
    takeaways: ["Three reasons: context isolation, specialisation, parallelism.", "Each has a symptom in the single agent and a matching split.", "No reason: keep one agent and fix it.", "Agents added without a reason add cost and failure points only."],
    terms: [["context isolation", "giving each agent only the information its task needs"], ["specialisation", "a prompt, tools and model chosen for one role"], ["fan-out", "running one agent per independent item in parallel"]],
    reflect: { q: "A proposal says two agents should 'debate' the answer to improve accuracy. Which reason is that?", a: "It is a form of specialisation (a critic role) and can be done as a reflection step inside one run with a separate review model. Framed as a debate between agents it costs more for the same check; ask for the evaluation numbers before building it." },
  },

  "m34-agent-specialisation": {
    simple: "A specialised agent has a prompt, tool set, model and budget chosen for one role, and does that role better and cheaper than a general agent would.",
    concept:
      "**Agent specialisation** means designing each agent for one job. A gatherer gets search tools, a fast model, a prompt about coverage and citations, and a generous step budget. A reviewer gets no search tools at all, a careful model, a rubric, and a small budget. A writer gets the style guide and a strong model. None of them is told about the others' jobs.\n\nSpecialisation works because prompts and models trade off: strictness against creativity, speed against depth, breadth against precision. A single agent must pick one point on each trade-off for the whole job; specialised agents pick the right point for each part. It also makes evaluation sharper: each role has its own task suite and its own numbers.\n\nThe risk is over-specialisation: ten agents for ten micro-roles, with more hand-offs than work. Roles should be as few as the trade-offs require.",
    why:
      "Role conflict is visible in single-agent prompts: 'be thorough but concise', 'be creative but never invent facts', 'search widely but finish quickly'. Each pair is two roles wanting different settings. The model splits the difference and does both halves adequately. Separating the roles lets each be done well, and lets the cheaper role run on a cheaper model, which often pays for the extra coordination.\n\nSpecialised agents are also reusable: a good reviewer agent serves every pipeline that produces drafts.",
    how: [
      "List the roles in the job and the trade-off each wants: breadth or precision, speed or depth, creativity or strictness.",
      "For each role write a prompt that pushes hard in its direction, with no instructions for other roles.",
      "Choose a model per role: fast and cheap for gathering and classifying, strong for synthesis, careful for review.",
      "Give each role only the tools it needs; a reviewer with search tools starts researching instead of reviewing.",
      "Set a budget per role and a finish schema that produces the input the next role expects.",
      "Evaluate each role on its own task suite.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Role", "Prompt pushes toward", "Model", "Tools", "Budget"],
        rows: [
          ["gatherer", "coverage, citations, recency", "fast, cheap", "search, fetch, archive", "15 steps"],
          ["writer", "clarity, structure, house style", "strong", "none (input is the fact set)", "2 steps"],
          ["reviewer", "strictness, evidence, rubric", "careful, separate from the writer", "none", "1 step"],
          ["fixer", "minimal edits addressing each note", "mid", "none", "2 steps"],
        ],
      },
      caption: "Four roles, four different settings. A single agent would need one compromise for all of them.",
    },
    everyday: {
      title: "A surgeon does not also run the pharmacy",
      text: "Hospitals specialise because the jobs want different temperaments and tools: the anaesthetist is calm and watchful, the surgeon decisive, the pharmacist exacting. Asking one person to be all three in one procedure produces an average of the three. Specialised agents are the hospital's division of labour applied to a job.",
    },
    engineering: {
      title: "Specialising the reviewer paid for itself",
      text: "A grant-writing service used one agent to draft and self-review proposals; self-reviews passed everything. They split out a reviewer agent: a careful model, a strict rubric from past funder feedback, no drafting tools, and a prompt that never saw the drafting instructions. The reviewer rejected 35% of first drafts, mostly for unsupported impact claims, which human editors confirmed were the funders' most common objection. Draft agents moved to a cheaper, faster model because the reviewer caught their errors; the net cost per proposal fell 15% while acceptance by human editors rose.",
    },
    code: {
      title: "Two specs for two roles",
      lang: "ts",
      src: `export const gatherer: AgentSpec = {
  name: "gatherer",
  model: process.env.MODEL_FAST!,
  system: "You gather facts for a report. Prefer recent, primary sources. Record every fact with its url and date. Cover the whole brief before going deep. Finish with a fact list; do not write prose.",
  tools: [searchWeb, searchArchive, fetchPage, finishFacts],
  budget: { maxSteps: 15, maxCostUsd: 0.3, maxMs: 120000 },
  finishSchema: FactList,
};

export const reviewer: AgentSpec = {
  name: "reviewer",
  model: process.env.MODEL_CAREFUL!,
  system: "You review a draft against a fact list and a rubric. For every claim, find the supporting fact or mark it unsupported. Be strict. Output problems only; if none, say pass. You do not rewrite.",
  tools: [finishReview],
  budget: { maxSteps: 1, maxCostUsd: 0.1, maxMs: 30000 },
  finishSchema: Review,
};`,
      lines: [
        { code: "model: process.env.MODEL_FAST!,", say: "The gatherer runs on a fast, cheap model: its job is coverage, not judgement." },
        { code: "system: \"You gather facts for a report. Prefer recent, primary sources. Record every fact with its url and date. Cover the whole brief before going deep. Finish with a fact list; do not write prose.\",", say: "Pushes toward breadth and citations; says nothing about writing or reviewing." },
        { code: "tools: [finishReview],", say: "The reviewer has no search tools. It can only review." },
        { code: "budget: { maxSteps: 1, maxCostUsd: 0.1, maxMs: 30000 },", say: "One step: read, judge, report. A reviewer that explores is doing the wrong job." },
        { code: "finishSchema: Review,", say: "Its output is typed so the fixer or the supervisor can act on it without parsing prose." },
      ],
    },
    useIt: "Specialise when a prompt is fighting itself or a role wants a different model. Give each role its own prompt, tools, model, budget and finish schema; keep roles few; evaluate each on its own suite. Reuse good role agents across pipelines.",
    takeaways: ["One role per agent: prompt, tools, model and budget chosen for it.", "Resolves prompt trade-offs that a single agent must compromise on.", "Cheaper roles on cheaper models often pay for the coordination.", "Few roles; typed outputs between them; a suite per role."],
    terms: [["specialised agent", "an agent whose prompt, tools, model and budget serve one role"], ["role conflict", "one prompt demanding opposite behaviours"], ["finish schema", "the typed output a role produces for the next role"]],
    reflect: { q: "Should the reviewer agent see the writer's system prompt?", a: "No. The reviewer judges the draft against the facts and the rubric; knowing the writer's instructions biases it toward excusing the draft. Separate contexts are part of the specialisation." },
  },

  "m34-supervisor-architecture": {
    simple: "In a supervisor architecture one agent plans and assigns work to specialised worker agents, collects their results, and decides what happens next; workers never talk to each other.",
    concept:
      "The **supervisor architecture** is the simplest multi-agent structure: a tree one level deep. The supervisor is itself an agent with a goal, a plan and a special set of tools: one per worker. Calling the 'research' tool runs the research agent on a sub-task and returns its typed result. The supervisor reads results, assigns more work or finishes with the assembled output.\n\nWorkers are isolated: each gets only the sub-task text and whatever the supervisor passes explicitly. They do not see the supervisor's plan or each other's results unless the supervisor includes them. That isolation is the point: short contexts and clear responsibility. All the coordination logic, ordering, retries, parallel dispatch, lives in the supervisor's prompt and the controller.\n\nIt suits jobs with a natural decomposition into roles or parts and a clear assembly step at the end.",
    why:
      "Letting agents message each other freely produces loops of polite prose and no accountability. A supervisor gives the system one place where the plan lives, one place where results are judged, and one place to put budgets and approval gates for the whole job. When a run goes wrong, the supervisor's trace shows what was assigned and what came back.\n\nIt also keeps workers simple and reusable: a worker is just a single agent from Module 33 with a typed finish, called like a tool.",
    how: [
      "Build each worker as a single agent with a goal template, tools, budget and a finish schema.",
      "Wrap each worker as a tool for the supervisor: name, description of what it is good for, input schema (the sub-task), output schema (the finish).",
      "Give the supervisor a prompt about planning, delegating, judging results and assembling; its own budget covers the whole job.",
      "The controller runs worker calls like any tool, in parallel when the supervisor requests several at once.",
      "Approval gates and detectors apply at both levels: a worker's write pauses the worker; the supervisor sees a needs_approval result.",
      "Trace the supervisor run with worker runs as children.",
    ],
    visual: {
      kind: "flow",
      steps: ["supervisor: plan 'three sections'", "calls research(A), research(B), research(C) in parallel", "receives three fact lists", "calls write(sections, facts)", "calls review(draft, facts) → 2 problems", "calls fix(draft, problems)", "assembles; finish"],
      caption: "Workers are tools from the supervisor's point of view. They never see each other; the supervisor sees everything it needs.",
    },
    everyday: {
      title: "A project manager with specialists",
      text: "A project manager does not do the plumbing or the wiring; they decide what is needed, send the plumber and the electrician in the right order, check the work, and sign off. The plumber and the electrician do not coordinate with each other; they report to the manager. That is a supervisor architecture with human workers.",
    },
    engineering: {
      title: "A supervisor for software-change tickets",
      text: "A SaaS company's ticket agent is a supervisor with four workers: investigate (reads code and logs, read-only), implement (edits in a branch and runs tests), test-writer (adds tests for the change), and review (judges the diff against the ticket). The supervisor reads the ticket, calls investigate, decides whether the change is safe to attempt, calls implement and test-writer, then review, and finishes by opening a pull request, which is the one write gate. Workers have budgets of 10 to 20 steps; the supervisor has 12. The team found the supervisor's own prompt was the hardest to write: it needed to judge worker outputs ('investigation says the cause is unclear: stop and ask a person') rather than just chain them.",
    },
    code: {
      title: "A worker wrapped as a supervisor tool",
      lang: "ts",
      src: `function asTool(worker: AgentSpec, description: string, input: z.ZodType<any>): Tool {
  return defineTool({
    name: worker.name,
    kind: "read",                                    // the worker's own writes are gated inside the worker
    description,
    schema: input,
    run: async (task, ctx) => {
      const result = await runAgent(worker, renderTask(task), ctx.ownerId, { parentRunId: ctx.runId });
      if (result.status === "needs_approval") return { status: "needs_approval", proposal: result.proposal, runId: result.runId };
      if (result.status !== "done") return { status: "worker_failed", reason: result.status, partial: result.partial };
      return { status: "ok", result: result.report };     // typed by the worker's finish schema
    },
  });
}

export const supervisor: AgentSpec = {
  name: "ticket-supervisor",
  model: process.env.MODEL_STRONG!,
  system: SUPERVISOR_PROMPT,   // plan, delegate, judge each result, assemble; stop and ask when a worker reports an unclear cause
  tools: [
    asTool(investigate, "Investigate a ticket: reads code and logs, returns probable cause, affected files and confidence. Use first.", z.object({ ticket: z.string() })),
    asTool(implement, "Implement a described change in a branch and run tests. Use only when investigation confidence is high.", z.object({ change: z.string(), files: z.array(z.string()) })),
    asTool(review, "Review a diff against the ticket. Returns pass or problems.", z.object({ diffRef: z.string(), ticket: z.string() })),
    openPullRequest,                                   // write, gated
    finish,
  ],
  budget: { maxSteps: 12, maxCostUsd: 3, maxMs: 900000 },
};`,
      lines: [
        { code: "const result = await runAgent(worker, renderTask(task), ctx.ownerId, { parentRunId: ctx.runId });", say: "A worker call is a full agent run, linked to the parent for tracing." },
        { code: "if (result.status === \"needs_approval\") return { status: \"needs_approval\", proposal: result.proposal, runId: result.runId };", say: "A worker's pause surfaces to the supervisor as a result, so the gate works at either level." },
        { code: "return { status: \"ok\", result: result.report };     // typed by the worker's finish schema", say: "The supervisor receives structured output, never the worker's whole history." },
        { code: "asTool(implement, \"Implement a described change in a branch and run tests. Use only when investigation confidence is high.\", z.object({ change: z.string(), files: z.array(z.string()) })),", say: "The description tells the supervisor when a worker is appropriate, like any tool." },
        { code: "budget: { maxSteps: 12, maxCostUsd: 3, maxMs: 900000 },", say: "The supervisor's budget bounds the whole job, including every worker it calls." },
      ],
    },
    useIt: "Use a supervisor when a job decomposes into roles with a clear assembly. Build workers as single agents with typed finishes, wrap them as tools, and put the judgement about what to do with results in the supervisor's prompt. Budget and trace at both levels.",
    takeaways: ["One supervisor plans, delegates, judges and assembles; workers are isolated and called like tools.", "Workers are Module 33 agents with typed finish schemas.", "Coordination lives in the supervisor's prompt and the controller, not in worker chatter.", "Gates and budgets apply at both levels; traces nest."],
    terms: [["supervisor", "the agent that assigns work to workers and assembles results"], ["worker", "a specialised agent called by the supervisor on a sub-task"], ["nested run", "a worker run linked to its parent supervisor run"]],
    reflect: { q: "Why should a worker not see the supervisor's full plan?", a: "Context isolation: the worker does its sub-task better with only the sub-task, and it cannot wander into other workers' jobs. If a worker needs some context, the supervisor passes it explicitly in the task." },
  },

  "m34-coordinator-architecture": {
    simple: "A coordinator architecture replaces the supervising agent with code: a fixed graph of agents and hand-offs, where the model decides only inside each node.",
    concept:
      "The supervisor was an agent deciding who does what. The **coordinator architecture** moves that decision into code. The coordinator is a workflow graph: nodes are agents (or plain functions), edges are hand-offs, and the graph's shape is fixed by the engineer. The research node always runs before the writing node; the review node always follows the writer; a failed review always loops back to the writer at most twice.\n\nModels still decide inside nodes: how to research, what to write, whether to pass the review. But they never decide the route. That is the trade: less flexibility, far more predictability, lower cost (no supervisor calls), and complete testability of the structure.\n\nMost production multi-agent systems are coordinators with a few conditional edges, because the shape of the job is usually known and only the content varies.",
    why:
      "A supervising agent spends tokens deciding things that are always the same, and occasionally decides them wrongly: skipping review, calling research twice, assembling before all parts arrived. When the order of roles is known, those decisions belong in code, where they cost nothing and never vary. Debugging is simpler too: the graph says what should have happened; the trace says what did.\n\nThe supervisor remains right when the route genuinely depends on results. The coordinator is right the rest of the time.",
    how: [
      "Draw the graph: nodes (agents or functions), edges, and the conditions on conditional edges (review passed? retries left?).",
      "Implement each node as a single agent spec or a plain function with typed input and output.",
      "Implement the coordinator as code that runs nodes in graph order, passing typed outputs along edges, running independent nodes in parallel.",
      "Put loop caps on cyclic edges and a named exit for every terminal state.",
      "Trace the whole graph as one run; each node is a child run or a span.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Supervisor (agent decides the route)", points: ["Flexible: can skip, repeat, reorder", "Costs supervisor model calls", "Route can be wrong", "Right when the route depends on results"] },
      right: { title: "Coordinator (code decides the route)", points: ["Fixed graph with conditional edges", "No coordination tokens", "Route is always correct by construction", "Right when the shape of the job is known"] },
      caption: "Same workers either way. The question is whether the route needs judgement or just conditions.",
    },
    everyday: {
      title: "An assembly line with skilled stations",
      text: "On a bicycle assembly line, frames always go to painting before wheels are fitted, and quality control always comes last; nobody decides the order per bike. Each station still uses skill on each frame. The line is the coordinator; the stations are the agents. A custom workshop where the builder decides the order per bike is the supervisor.",
    },
    engineering: {
      title: "A content pipeline as a coordinator graph",
      text: "A publishing company produces explainer articles with a coordinator: outline (agent) → draft (agent) → fact-check (agent, with a search tool) → style edit (agent) → review (agent) → publish-proposal (gated write). Conditional edges: a failed fact-check returns to draft with notes (at most twice); a failed review returns to style edit (once). The graph never changes; only the article does. When they compared it with a supervisor version, the coordinator cost 35% less per article, ran 20% faster, and never produced the supervisor's occasional 'skipped fact-check' failure. They keep a supervisor only for one-off research commissions where the shape is unknown.",
    },
    code: {
      title: "A coordinator graph with a capped loop",
      lang: "ts",
      src: `export async function produceArticle(brief: Brief, ownerId: string): Promise<Outcome> {
  const outline = await node(outlineAgent, { brief }, ownerId);
  let draft = await node(draftAgent, { brief, outline }, ownerId);

  for (let attempt = 1; attempt <= 3; attempt++) {                         // fact-check loop, capped
    const check = await node(factCheckAgent, { draft, brief }, ownerId);
    if (check.verdict === "pass") break;
    if (attempt === 3) return { status: "needs_review", reason: "fact-check failed three times", draft, problems: check.problems };
    draft = await node(draftAgent, { brief, outline, revise: check.problems }, ownerId);
  }

  const styled = await node(styleAgent, { draft, styleGuide: STYLE }, ownerId);
  const review = await node(reviewAgent, { draft: styled, brief }, ownerId);
  if (review.verdict !== "pass") return { status: "needs_review", reason: "editorial review failed", draft: styled, problems: review.problems };

  return proposePublish(styled, ownerId);                                   // gated write
}

async function node<I, O>(spec: AgentSpec, input: I, ownerId: string): Promise<O> {
  const result = await runAgent(spec, renderInput(input), ownerId, { parentRunId: currentRun() });
  if (result.status !== "done") throw new NodeFailed(spec.name, result);
  return result.report as O;
}`,
      lines: [
        { code: "const outline = await node(outlineAgent, { brief }, ownerId);", say: "The route is code: outline first, always. No model decides this." },
        { code: "for (let attempt = 1; attempt <= 3; attempt++) {                         // fact-check loop, capped", say: "A conditional edge with a cap: back to draft on failure, three attempts at most." },
        { code: "if (attempt === 3) return { status: \"needs_review\", reason: \"fact-check failed three times\", draft, problems: check.problems };", say: "The loop's exit is a named status with the evidence." },
        { code: "return proposePublish(styled, ownerId);                                   // gated write", say: "The only irreversible step is a gated proposal at the end of the graph." },
        { code: "if (result.status !== \"done\") throw new NodeFailed(spec.name, result);", say: "A node that does not finish is a graph failure with the node's name attached." },
      ],
    },
    useIt: "Default to a coordinator for any multi-agent job with a known shape: write the graph as code, use single agents as nodes, cap loops, name exits, and trace as one run. Use a supervisor agent only where the route itself needs judgement.",
    takeaways: ["The coordinator is code: a fixed graph of agent nodes with conditional edges.", "Models decide inside nodes, never the route.", "Cheaper, more predictable and fully testable than a supervisor agent.", "Right for known job shapes; supervisor for unknown routes."],
    terms: [["coordinator", "code that runs agents in a fixed graph"], ["node", "one agent or function in the graph"], ["conditional edge", "a hand-off taken only when a condition holds"]],
    reflect: { q: "The graph has a node 'decide which experts to consult' that varies per input. Coordinator or supervisor?", a: "A coordinator with a routing node: a classification call picks from a fixed menu of expert nodes, and code runs the chosen ones. The route varies, but within a menu the engineer defined; a supervisor is needed only if the menu itself is open-ended." },
  },

  "m34-agent-communication": {
    simple: "Agents communicate through typed messages and results defined by your code, never through free conversation; the schema is the protocol.",
    concept:
      "When one agent's output becomes another's input, that hand-off is **agent communication**. The reliable form is structured: a finish schema on the sender, a typed input on the receiver, and the controller carrying one to the other. The research agent produces { facts: [{claim, url, date}] }; the writer receives exactly that. No prose crosses the boundary.\n\nThe unreliable form is agents exchanging natural-language messages: 'Here are my findings, let me know if you need more.' It reads well in demos and fails in production: the receiver misparses, the sender omits, both drift into chat, and nobody can validate what passed. Where agents must ask each other things, the question is a typed request with a typed answer, routed by the controller.\n\nCommunication also needs provenance: each item carries which agent produced it, from which sources, so the next agent and the final reader can trace claims back.",
    why:
      "Boundaries between agents are where information is lost. A schema makes the loss explicit and testable: if the writer needs dates and the research schema has no date field, that is a visible gap, not a silent omission in prose. Validation at the boundary catches a worker that finished badly before its output pollutes the next stage.\n\nTyped communication also makes the system replaceable piece by piece: any agent that produces the schema can replace the research agent, including a plain function or a human.",
    how: [
      "Define a schema for every hand-off; the sender's finish tool enforces it; the receiver's input renders it.",
      "Validate at the boundary; a schema failure is a worker failure, handled by the controller.",
      "Attach provenance to every item: producing agent, run id, sources.",
      "For agent-to-agent questions, use a typed request/response through the controller, with a cap on exchanges.",
      "Never let one agent's raw history or system prompt flow to another.",
      "Log every hand-off with its payload size and validation result.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Hand-off", "Schema", "Carried by", "Validated"],
        rows: [
          ["research → writer", "{ facts: [{ claim, url, date, confidence }] }", "controller", "at the writer's input"],
          ["writer → reviewer", "{ draft: markdown, factRefs: [ids] }", "controller", "at the reviewer's input"],
          ["reviewer → fixer", "{ verdict, problems: [{ location, issue, factRef? }] }", "controller", "at the fixer's input"],
          ["worker → supervisor", "the worker's finish schema", "the tool result", "by the controller before the supervisor sees it"],
          ["any agent → any agent (question)", "{ question, options? } / { answer }", "controller, capped", "both directions"],
        ],
      },
      caption: "Every arrow is a schema. Prose never crosses a boundary; references do.",
    },
    everyday: {
      title: "A lab form, not a corridor chat",
      text: "A doctor orders a blood test on a form with fixed fields, and the lab returns results on a form with fixed fields. Nobody relies on a corridor conversation to pass a potassium level. Structured forms are why results arrive complete and comparable. Agent communication works when it is the form, not the chat.",
    },
    engineering: {
      title: "The free-text hand-off that lost the dates",
      text: "A market-intelligence team's first pipeline had the research agent write a prose summary for the writer agent. Reports started citing figures without dates, and when challenged nobody could find where a number came from. The rewrite defined a facts schema with claim, url, date and confidence, enforced by the research agent's finish tool and validated before the writer ran. Dates appeared in every report; a failed validation surfaced two research runs a week that were finishing with empty fact lists, which had previously produced confident, fact-free prose.",
    },
    code: {
      title: "A typed hand-off with provenance",
      lang: "ts",
      src: `export const Fact = z.object({
  id: z.string(),
  claim: z.string().max(300),
  url: z.string().url(),
  date: z.string().date().optional(),
  confidence: z.number().min(0).max(1),
  producedBy: z.object({ agent: z.string(), runId: z.string() }),
});
export const FactList = z.object({ facts: z.array(Fact).min(1).max(60), coverageNotes: z.string().max(500) });

export const Problem = z.object({ location: z.string(), issue: z.string().max(200), factRef: z.string().optional() });
export const Review = z.object({ verdict: z.enum(["pass", "fix"]), problems: z.array(Problem).max(20) });

// the controller carries one agent's finish to the next agent's input, validating on the way
async function handoff<T>(schema: z.ZodType<T>, from: RunResult, toAgent: string): Promise<T> {
  const parsed = schema.safeParse(from.report);
  if (!parsed.success) throw new HandoffFailed(from.agent, toAgent, parsed.error.message);
  await log.handoff({ from: from.agent, to: toAgent, bytes: JSON.stringify(from.report).length, ok: true });
  return parsed.data;
}`,
      lines: [
        { code: "producedBy: z.object({ agent: z.string(), runId: z.string() }),", say: "Every fact names the agent and run that produced it. Claims can be traced back." },
        { code: "export const FactList = z.object({ facts: z.array(Fact).min(1).max(60), coverageNotes: z.string().max(500) });", say: "The research agent's finish must contain at least one fact. An empty list fails here, not in the report." },
        { code: "export const Review = z.object({ verdict: z.enum([\"pass\", \"fix\"]), problems: z.array(Problem).max(20) });", say: "The reviewer's output is a verdict and located problems, which the fixer can act on mechanically." },
        { code: "if (!parsed.success) throw new HandoffFailed(from.agent, toAgent, parsed.error.message);", say: "A bad hand-off is a named failure between two named agents." },
      ],
    },
    useIt: "Define a schema for every boundary before writing the agents, enforce it with finish tools, validate on hand-off, and carry provenance. Treat prose between agents as a bug. Log hand-offs so a missing field is found in minutes.",
    takeaways: ["Agents communicate through typed results, carried and validated by the controller.", "Schemas make information loss visible and testable.", "Provenance travels with every item.", "Agent-to-agent questions are typed and capped; raw histories never cross."],
    terms: [["hand-off", "passing one agent's output to another's input"], ["provenance", "which agent, run and sources an item came from"], ["protocol (agents)", "the set of schemas that define how agents exchange work"]],
    reflect: { q: "Two agents 'negotiate' a plan over six prose messages in a demo. What would the production version look like?", a: "One planning call producing a typed plan, optionally one typed review of it, then execution. Six prose rounds are six chances to drift and nothing to validate; the negotiation's value, if any, is a review step." },
  },

  "m34-shared-memory": {
    simple: "Shared memory is a store several agents read and write during a job, such as a fact base or a task board, with ownership rules so they do not overwrite or confuse each other.",
    concept:
      "Besides hand-offs, agents can cooperate through a **shared memory**: a store all of them can read and some can write. A fact base that research agents append to and the writer reads. A task board where the supervisor posts tasks and workers mark them done. A document that the writer edits and the reviewer annotates. The store outlives any single agent's context and lets information flow without being carried through hand-offs.\n\nShared memory needs rules, because concurrent agents writing to one store recreate every classic concurrency problem: overwrites, duplicates, reading half-written data. The rules are simple: each region has one writer; writes are appends with ids rather than edits in place; readers see versions; the controller, not the agents, resolves conflicts.\n\nUsed well, shared memory keeps every agent's context small (read what you need) and gives people a live view of the job (open the board).",
    why:
      "Hand-offs alone force everything through the supervisor or along the pipeline, and some information is needed by several agents at once: the fact base by the writer and the reviewer, the task board by everyone. Passing copies loses consistency; a shared store keeps one version. It also survives failures: a research agent that crashed has already appended its facts.\n\nThe risks are the same as any shared mutable state, which is why the rules matter more than the store technology.",
    how: [
      "Choose the shared structures: a fact base, a task board, a shared document, each as a table or document in a store.",
      "Assign ownership: who may write each structure or region; everyone else reads.",
      "Make writes appends with ids and timestamps; avoid in-place edits; keep versions for documents.",
      "Expose the store to agents as tools: add_fact, list_facts(topic), claim_task, complete_task, with the controller enforcing ownership.",
      "Give people a view of the store: the board is the progress page.",
      "Clear or archive the store when the job ends; it is job-scoped, not long-term memory.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Structure", "Writers", "Readers", "Rule"],
        rows: [
          ["fact base", "research agents (append only)", "writer, reviewer, people", "facts have ids and provenance; never edited, only superseded"],
          ["task board", "supervisor posts; workers claim and complete", "everyone", "one claimant per task; completion carries the result id"],
          ["draft document", "writer (versions)", "reviewer, fixer, people", "reviewer annotates by location; fixer writes a new version"],
          ["decision log", "supervisor", "everyone", "append only; the audit trail of the job"],
        ],
      },
      caption: "One writer per region, append-only where possible, versions for documents. The store is the job's single source of truth.",
    },
    everyday: {
      title: "The whiteboard in the incident room",
      text: "During an incident, responders write what they know on a shared whiteboard: timeline, suspects, who is doing what. Nobody carries all of it in their head, and newcomers read the board to catch up. One person owns the timeline; others add findings with their initials. The board is shared memory with ownership rules; it works because of the initials and the one owner, not because of the marker pens.",
    },
    engineering: {
      title: "A fact base that made research agents restartable",
      text: "A policy-analysis firm runs six research agents in parallel on a brief. Originally each returned its facts at the end; if one crashed at step 14, its work was lost. Now each appends facts to a shared fact base as it finds them, with its agent id and sources. A crashed agent is simply restarted and told which topics already have facts. The writer reads the base by topic; the reviewer checks claims against it by id; analysts watch the base fill up in real time. Lost work dropped to zero and the writer's context shrank, because it reads only the topics for the section it is writing.",
    },
    code: {
      title: "A fact base as tools with ownership enforced",
      lang: "ts",
      src: `export const addFact = defineTool({
  name: "add_fact",
  kind: "write",
  description: "Append one verified fact to the job's shared fact base. Include the source url and date. Do not add duplicates; search first with list_facts.",
  schema: z.object({ topic: z.string(), claim: z.string().max(300), url: z.string().url(), date: z.string().date().optional(), confidence: z.number().min(0).max(1) }),
  run: async (input, ctx) => {
    if (ctx.agentRole !== "research") throw new Forbidden("only research agents write facts");      // ownership
    const id = await factBase.append(ctx.jobId, { ...input, producedBy: { agent: ctx.agentName, runId: ctx.runId }, at: now() });
    return { id };
  },
});

export const listFacts = defineTool({
  name: "list_facts",
  kind: "read",
  description: "List facts in the shared fact base for a topic, newest first, up to 30. Use before researching a topic and when writing or reviewing.",
  schema: z.object({ topic: z.string(), limit: z.number().int().max(30).default(30) }),
  run: async ({ topic, limit }, ctx) => factBase.list(ctx.jobId, { topic, limit }),
});`,
      lines: [
        { code: "if (ctx.agentRole !== \"research\") throw new Forbidden(\"only research agents write facts\");      // ownership", say: "Ownership is enforced by the controller's context, not by asking agents to behave." },
        { code: "const id = await factBase.append(ctx.jobId, { ...input, producedBy: { agent: ctx.agentName, runId: ctx.runId }, at: now() });", say: "Append only, with provenance and a timestamp. Nothing is overwritten." },
        { code: "description: \"List facts in the shared fact base for a topic, newest first, up to 30. Use before researching a topic and when writing or reviewing.\",", say: "Readers are told when to look, which stops duplicate research and lets the writer read only its topic." },
        { code: "run: async ({ topic, limit }, ctx) => factBase.list(ctx.jobId, { topic, limit }),", say: "The store is scoped to the job; another job's facts are invisible." },
      ],
    },
    useIt: "Add shared memory when several agents need the same information or when work must survive an agent's failure. Define structures, assign one writer per region, append with ids and provenance, expose through tools with ownership enforced, and give people a view.",
    takeaways: ["A job-scoped store that agents read and write through tools.", "One writer per region; appends with ids; versions for documents.", "Keeps contexts small and work durable across agent failures.", "People watch the job through the same store."],
    terms: [["shared memory (agents)", "a job-scoped store several agents read and write"], ["ownership", "which agent may write a region of the store"], ["append-only", "writes add records and never change existing ones"]],
    reflect: { q: "Two research agents both add the same fact. Is that a bug?", a: "A minor one, and expected. The tools say 'search first', but races happen. Handle it in the store: dedupe by url plus claim similarity at read time, or let the writer agent treat duplicates as corroboration. Do not make agents coordinate to avoid it." },
  },

  "m34-task-delegation": {
    simple: "Task delegation is how a supervisor or coordinator hands a bounded piece of work to a worker: a precise task, the inputs it needs, a budget, and a required output shape.",
    concept:
      "**Task delegation** is the act of giving a worker agent a sub-task. Done well, the delegated task is a small goal in its own right: a clear outcome, the specific inputs the worker needs (and nothing else), constraints, a budget, and the schema its result must match. Done badly, it is a vague instruction with the supervisor's whole context attached, and the worker either repeats the supervisor's work or wanders.\n\nDelegation also carries authority. A worker should be able to do only what its task needs: the research worker gets read tools, the implementation worker gets a branch to edit, never the main branch. The supervisor delegating a task cannot grant more than it has; approval gates stay with the action, whoever requests it.\n\nFinally, delegation sets expectations for failure: what the worker should return when it cannot finish, so the supervisor can decide rather than guess.",
    why:
      "The quality of a multi-agent system is mostly the quality of its delegated tasks. A worker given 'look into competitor B' returns something different every time; a worker given 'list B's pricing tiers with prices and the source url, as of this month; return found: false if no public pricing exists' returns something the writer can use. Precise delegation is also what makes workers cheap: a bounded task needs a small budget and a fast model.\n\nAuthority scoping is the safety side: a system where any worker can do anything is a system where a mistaken delegation causes an incident.",
    how: [
      "Write the task like a goal: outcome, constraints, output schema, failure instruction.",
      "Attach only the inputs the worker needs: the brief's relevant section, the ids it must use, facts it should not re-research.",
      "Set the worker's budget from the task size; a lookup is 5 steps, an investigation 20.",
      "Scope authority: the worker's tool set is the minimum for the task; writes keep their gates.",
      "Tell the worker what to return when it cannot finish: partial results with a reason, never a guess.",
      "Validate the returned result against the schema before using it.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Vague delegation", points: ["'Look into competitor B'", "Whole supervisor context attached", "No budget stated", "Any tools", "Returns prose of varying shape"] },
      right: { title: "Precise delegation", points: ["'List B's public pricing tiers with prices and source url, as of this month'", "Inputs: B's name and website; existing facts to skip", "Budget: 8 steps, £0.15", "Tools: search, fetch only", "Returns FactList, or found: false with reason"] },
      caption: "The right column is a complete small goal. Its worker can be cheap, fast and reliable.",
    },
    everyday: {
      title: "A good handover note",
      text: "A nurse handing over a patient at shift change does not say 'keep an eye on bed 4'. They say what to watch, what has been done, what to do if a reading crosses a threshold, and when to call the doctor. The next nurse can act without re-examining everything. A delegated task is a handover note for an agent.",
    },
    engineering: {
      title: "Scoping authority in a code-change system",
      text: "A fintech's supervisor delegates implementation to a worker agent. Early on the worker had the supervisor's full tool set, including merge. A mis-delegated task ('apply the fix') led the worker to merge to main. The rebuild gives each delegated task a tool allow-list: implementation workers get read, edit-in-branch and run-tests, never merge or push to main; the merge is a gated proposal only the supervisor can make, and only after review. The task template also requires 'files you may touch', and the worker's edit tool refuses paths outside it. Incidents from delegated changes went to zero; the worker's budget was halved because its scope was smaller.",
    },
    code: {
      title: "A delegation template with authority and failure instructions",
      lang: "ts",
      src: `type Delegation = {
  outcome: string;
  inputs: Record<string, unknown>;
  constraints: string[];
  outputSchema: z.ZodTypeAny;
  budget: Budget;
  allowedTools: string[];
  onFailure: string;
};

function renderTask(d: Delegation): string {
  return [
    "Task: " + d.outcome,
    "Inputs: " + JSON.stringify(d.inputs),
    "Constraints: " + d.constraints.map((c) => "- " + c).join(" "),
    "If you cannot complete the task: " + d.onFailure,
    "Finish by calling finish with the required output.",
  ].join("\\n");
}

const pricingTask: Delegation = {
  outcome: "List the public pricing tiers of the named competitor with prices and the source url, as of this month.",
  inputs: { competitor: "Northwind", website: "https://northwind.example", knownFacts: ["f-102", "f-118"] },
  constraints: ["Use only pages on the competitor's own domain or a named reseller.", "Do not research anything except pricing."],
  outputSchema: FactList,
  budget: { maxSteps: 8, maxCostUsd: 0.15, maxMs: 60000 },
  allowedTools: ["search_web", "fetch_page", "finish"],
  onFailure: "Call finish with found: false and a one-line reason (for example: no public pricing page). Do not estimate prices.",
};`,
      lines: [
        { code: "allowedTools: string[];", say: "Authority is part of the delegation: the worker's tools are the minimum for this task." },
        { code: "\"If you cannot complete the task: \" + d.onFailure,", say: "The worker is told what a good failure looks like, so it never guesses." },
        { code: "inputs: { competitor: \"Northwind\", website: \"https://northwind.example\", knownFacts: [\"f-102\", \"f-118\"] },", say: "Only the inputs the task needs, including which facts already exist so they are not re-researched." },
        { code: "budget: { maxSteps: 8, maxCostUsd: 0.15, maxMs: 60000 },", say: "A bounded task gets a small budget; the supervisor's budget covers the sum." },
        { code: "onFailure: \"Call finish with found: false and a one-line reason (for example: no public pricing page). Do not estimate prices.\",", say: "An explicit ban on the failure mode that would corrupt the report." },
      ],
    },
    useIt: "Template every delegation: outcome, inputs, constraints, output schema, budget, allowed tools, failure instruction. Scope tools to the task and keep write gates with the action. Validate results on return.",
    takeaways: ["A delegated task is a complete small goal with its own inputs, budget and schema.", "Authority is scoped per task: minimum tools, gates stay with the action.", "Tell the worker what to return on failure.", "Precise delegation is what makes workers cheap and reliable."],
    terms: [["task delegation", "handing a bounded sub-task to a worker agent"], ["authority scoping", "limiting a worker's tools to what its task needs"], ["failure instruction", "what a worker must return when it cannot finish"]],
    reflect: { q: "The supervisor attaches its entire history to each delegated task 'so the worker has context'. What goes wrong?", a: "Context isolation is lost: the worker's context is long and full of other workers' results, its decisions drift toward the supervisor's job, and cost per worker step rises. Pass the specific inputs, not the history." },
  },

  "m34-multi-agent-collaboration": {
    simple: "Collaboration between agents is the structured back-and-forth that improves a result: a reviewer's problems go to a fixer, a critic's objections go to a planner, in capped rounds with typed messages.",
    concept:
      "Hand-offs are one-way. **Multi-agent collaboration** is a loop between roles: write, review, fix, review again. Or plan, critique, revise. The value is that a second agent with a different prompt sees what the first could not, and the first can act on it. The structure keeps it productive: each round is a typed exchange (problems in, revisions out), the number of rounds is capped, and a judge (code or a model) decides when the loop has converged.\n\nThe collaboration patterns that work in production are few: writer–reviewer–fixer; planner–critic; generator–verifier for code and tests; and a small panel of independent evaluators whose scores are aggregated. All of them have a defined protocol and a stopping rule. 'Agents chatting until they agree' is not one of them.\n\nCollaboration costs rounds of model calls; it is used where quality matters more than cost, and its benefit is measured, not assumed.",
    why:
      "A single agent reviewing its own work is lenient; it shares its own blind spots. A separate agent with a reviewing prompt and no stake in the draft finds real problems. Feeding those problems back as a typed list to a fixer, rather than as prose to the original writer, produces minimal, targeted changes. Two or three rounds catch most of what one review catches and avoid the endless polishing that an uncapped loop produces.\n\nMeasuring the benefit matters because collaboration is where cost multiplies: three rounds of review and fix is six model calls on top of the draft.",
    how: [
      "Choose a pattern: writer–reviewer–fixer, planner–critic, generator–verifier, or an evaluator panel.",
      "Define the message schema for each direction: problems with locations; revisions with what changed.",
      "Set a round cap (two or three) and a convergence rule: reviewer passes, or the number of problems stops falling.",
      "Keep the roles' contexts separate; the reviewer sees the draft and the facts, not the writer's history.",
      "Log every round; measure quality against a baseline with no collaboration to confirm the rounds are worth their cost.",
    ],
    visual: {
      kind: "flow",
      steps: ["writer: draft v1", "reviewer: 4 problems (located)", "fixer: v2, changes listed", "reviewer: 1 problem", "fixer: v3", "reviewer: pass → done (3 rounds max)"],
      caption: "Typed problems in, listed changes out, a cap and a convergence rule. The loop improves the draft and then stops.",
    },
    everyday: {
      title: "An editor and a writer, two rounds",
      text: "A magazine piece goes to an editor who returns numbered notes; the writer addresses each and sends it back; a second pass clears the rest. A good editor does not rewrite, and a good process does not go to a fifth round. The numbered notes are the typed messages; the two rounds are the cap.",
    },
    engineering: {
      title: "Generator and verifier for database migrations",
      text: "A data-platform team generates schema migrations with an agent. A generator agent writes the migration and a rollback; a verifier agent, on a different model with the schema and a checklist (reversibility, locking behaviour, index creation strategy), returns located problems; the generator revises. Capped at three rounds. On their evaluation set, one round of verification caught 62% of the problems human reviewers would have flagged, two rounds caught 78%, three rounds 80%: they set the cap at two. Human review time per migration fell by half.",
    },
    code: {
      title: "A writer–reviewer–fixer loop with a cap and convergence",
      lang: "ts",
      src: `export async function collaborate(brief: Brief, facts: FactList, ownerId: string, maxRounds = 3) {
  let draft = (await node(writerAgent, { brief, facts }, ownerId)).draft;
  let previousProblems = Number.POSITIVE_INFINITY;

  for (let round = 1; round <= maxRounds; round++) {
    const review = await node<Review>(reviewerAgent, { draft, facts, rubric: RUBRIC }, ownerId);
    await log.round({ round, problems: review.problems.length });
    if (review.verdict === "pass") return { status: "done", draft, rounds: round };
    if (review.problems.length >= previousProblems) return { status: "needs_review", draft, problems: review.problems, reason: "not converging" };
    previousProblems = review.problems.length;
    const fixed = await node<Fixed>(fixerAgent, { draft, problems: review.problems, facts }, ownerId);
    draft = fixed.draft;
  }
  return { status: "needs_review", draft, reason: "round cap reached" };
}`,
      lines: [
        { code: "const review = await node<Review>(reviewerAgent, { draft, facts, rubric: RUBRIC }, ownerId);", say: "The reviewer sees the draft, the facts and the rubric: not the writer's history or prompt." },
        { code: "if (review.verdict === \"pass\") return { status: \"done\", draft, rounds: round };", say: "Convergence by verdict: the loop stops the moment the reviewer passes it." },
        { code: "if (review.problems.length >= previousProblems) return { status: \"needs_review\", draft, problems: review.problems, reason: \"not converging\" };", say: "Convergence by trend: if problems stop falling, a person looks instead of a fourth round." },
        { code: "const fixed = await node<Fixed>(fixerAgent, { draft, problems: review.problems, facts }, ownerId);", say: "The fixer gets located problems, not prose, and returns a draft with its changes listed." },
      ],
    },
    useIt: "Use collaboration loops where output quality matters and a separate reviewing role catches real problems: documents, code, migrations, plans. Type the messages, cap the rounds, define convergence, isolate contexts, and measure the gain against no collaboration.",
    takeaways: ["Collaboration is a capped, typed loop between roles: review and fix, plan and critique, generate and verify.", "A separate reviewer with its own prompt finds what self-review misses.", "Convergence rules stop the loop; a cap bounds the cost.", "Measure the benefit; rounds multiply cost."],
    terms: [["collaboration loop", "a capped exchange between agent roles that improves a result"], ["convergence rule", "the condition that ends the loop: a pass, or no improvement"], ["evaluator panel", "several independent reviewers whose verdicts are aggregated"]],
    reflect: { q: "Would three reviewers voting beat one reviewer?", a: "Sometimes, for subjective quality, if they are genuinely different (different prompts or models) and the vote is aggregated by code. For factual checks one careful reviewer with the facts is usually enough. Try it on the evaluation set; do not assume." },
  },

  "m34-multi-agent-failure-modes": {
    simple: "Multi-agent systems fail in ways single agents cannot: lost information at boundaries, duplicated work, cascading errors, deadlocks, runaway cost, and blame that falls between agents. Each has a design remedy.",
    concept:
      "Every boundary between agents is a new way to fail. The recurring **multi-agent failure modes**: information loss (the writer never got the dates), duplicated work (two researchers on the same topic), cascading errors (one bad fact set poisons the draft, the review and the fix), deadlock (a worker waits on an approval the supervisor is waiting to assign), runaway cost (nested loops: a supervisor retrying a worker that is itself looping), silent partial failure (a worker's empty result treated as 'nothing to report'), and unclear accountability (the final error cannot be traced to the agent that caused it).\n\nNone of these is fixed by better prompts. They are fixed by the structure: schemas at boundaries, ownership of tasks, validation between stages, a single budget for the whole job, timeouts on waits, provenance on every item, and tracing that nests sub-runs under the job.\n\nThe discipline is to anticipate them in the design and detect them in the controller, exactly as single-agent failures were handled in Module 33.",
    why:
      "A single agent's failures are visible in one trace. A multi-agent system's failures hide between traces: the supervisor's run looks fine, each worker's run looks fine, and the report is wrong because of what was lost in a hand-off. Teams that do not design for these modes spend their time reading five traces to find a missing field.\n\nCost failures are also larger: a loop inside a loop multiplies, and a system with seven agents can spend seven budgets on a job that should have cost one.",
    how: [
      "Boundaries: a schema and validation on every hand-off; required fields for what downstream needs.",
      "Duplication: a task board with one claimant per task; a shared fact base searched before researching.",
      "Cascades: validate each stage's output before the next stage; a failed validation stops the pipeline at that stage.",
      "Deadlock: timeouts on every wait; approvals routed to a queue outside any agent's loop.",
      "Cost: one budget for the whole job that sub-run budgets draw from; nested step caps; a detector for repeated worker calls with the same task.",
      "Partial failure: workers return explicit statuses; empty results are distinguished from 'not found' and from errors.",
      "Accountability: provenance on every item; traces nested under the job id; a run page that shows the whole tree.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Failure", "How it looks", "Remedy"],
        rows: [
          ["information loss", "report lacks dates nobody dropped on purpose", "schema with required fields; validation at the boundary"],
          ["duplicated work", "two workers research the same thing", "task board with claims; search the fact base first"],
          ["cascading error", "one bad input, three bad stages", "validate per stage; stop at the first bad output"],
          ["deadlock", "job waits forever", "timeouts; approvals in an external queue"],
          ["runaway cost", "nested loops; a job costs 10×", "one job budget; nested caps; same-task retry detector"],
          ["silent partial failure", "empty worker result read as 'nothing'", "explicit statuses; empty ≠ not found ≠ error"],
          ["unclear accountability", "cannot find which agent caused it", "provenance; nested traces; one run page for the tree"],
        ],
      },
      caption: "Seven failures that appear only when agents are combined. All are structural; none is a prompt problem.",
    },
    everyday: {
      title: "The relay baton",
      text: "Relay teams lose races in the hand-over, not the running. The baton is dropped, two runners both wait, one starts early. Teams train the hand-over far more than the sprint. Multi-agent systems lose at the boundaries for the same reason, and the remedy is the same: practise and standardise the hand-over.",
    },
    engineering: {
      title: "The £400 report",
      text: "A consultancy's five-agent report system produced one report that cost £400 instead of the usual £6. The trace tree showed it: the supervisor had retried the research worker eleven times because the worker's finish failed validation (a url field missing on one fact), and the worker, retried with the same task, made the same mistake every time. Three structural fixes: the supervisor's same-task retry detector (cap at two), a job-level budget that the worker runs draw from, and a validation error that returns the specific problem to the worker so a retry can fix it. The next validation failure cost one extra worker run and succeeded on the second.",
    },
    code: {
      title: "A job budget shared across nested runs, and a same-task retry cap",
      lang: "ts",
      src: `class JobBudget {
  constructor(public remainingUsd: number, public remainingSteps: number, readonly deadline: number) {}
  child(fraction: number): Budget {                                   // a worker may use at most a fraction of what is left
    return { maxCostUsd: this.remainingUsd * fraction, maxSteps: Math.floor(this.remainingSteps * fraction), maxMs: Math.max(0, this.deadline - Date.now()) };
  }
  charge(cost: number, steps: number) {
    this.remainingUsd -= cost;
    this.remainingSteps -= steps;
    if (this.remainingUsd <= 0 || this.remainingSteps <= 0 || Date.now() > this.deadline) throw new JobOverBudget();
  }
}

const taskAttempts = new Map<string, number>();
async function delegate(worker: AgentSpec, task: Delegation, job: JobBudget, ownerId: string) {
  const key = worker.name + ":" + hash(task);
  const attempts = (taskAttempts.get(key) ?? 0) + 1;
  taskAttempts.set(key, attempts);
  if (attempts > 2) throw new RepeatedDelegation(worker.name, task);     // the same task twice is enough
  const result = await runAgent(worker, renderTask(task), ownerId, { budget: job.child(0.3) });
  job.charge(result.cost, result.steps);
  return result;
}`,
      lines: [
        { code: "child(fraction: number): Budget {                                   // a worker may use at most a fraction of what is left", say: "Worker budgets are carved from the job's remaining budget, so nested loops cannot multiply spend." },
        { code: "if (this.remainingUsd <= 0 || this.remainingSteps <= 0 || Date.now() > this.deadline) throw new JobOverBudget();", say: "One job-level check stops the whole tree, whichever agent spent the last pound." },
        { code: "if (attempts > 2) throw new RepeatedDelegation(worker.name, task);     // the same task twice is enough", say: "The £400 report cannot happen: the same task to the same worker is capped at two attempts." },
        { code: "job.charge(result.cost, result.steps);", say: "Every worker run is charged to the job as it finishes." },
      ],
    },
    useIt: "Design for the seven failures before building: schemas and validation at boundaries, a task board, per-stage validation, timeouts, a job budget with nested caps and a retry detector, explicit worker statuses, provenance and nested traces. Review the trace tree, not individual traces.",
    takeaways: ["Boundaries create new failures: loss, duplication, cascades, deadlock, runaway cost, silent partials, lost accountability.", "All are structural; none is fixed by prompts.", "One job budget feeds all nested runs; same-task retries are capped.", "Provenance and nested traces make the tree debuggable."],
    terms: [["cascading error", "one bad output corrupting every later stage"], ["job budget", "a single budget for the whole multi-agent job that sub-runs draw from"], ["trace tree", "the nested traces of a job and all its agent runs"]],
    reflect: { q: "A worker returns { facts: [] } and the writer produces a confident report. Which failure is this and where is the fix?", a: "Silent partial failure crossing a boundary. The fix is at the boundary: the FactList schema requires at least one fact, so the empty result fails validation and the supervisor sees a worker failure instead of the writer seeing 'no facts, write anyway'." },
  },
};

export const M34_QUIZ: Quiz[] = [
  {
    q: "Which is a valid reason to split one agent into several?",
    options: ["Multi-agent systems are more advanced", "One prompt is fighting itself: careful reviewing versus creative drafting", "The framework supports it", "The model is expensive"],
    answer: 1,
    why: ["Not a reason; a cost.", "Correct. Specialisation: separate roles want separate prompts and models.", "Support is not a need.", "Splitting adds model calls; it does not reduce cost by itself."],
    reason: true,
  },
  {
    q: "In a supervisor architecture, how do workers communicate with each other?",
    options: ["Through free-text messages", "They do not; each reports to the supervisor, which passes what is needed", "Through a shared system prompt", "By reading each other's histories"],
    answer: 1,
    why: ["Prose between agents is unvalidated and drifts.", "Correct. Workers are isolated; the supervisor carries typed results between them.", "Prompts are per role.", "Histories never cross boundaries."],
  },
  {
    q: "The order of roles in a job never changes. Supervisor agent or coordinator?",
    options: ["Supervisor agent", "Coordinator: a fixed graph in code, with models deciding only inside nodes", "Neither; a single agent", "Both at once"],
    answer: 1,
    why: ["A supervisor spends tokens deciding what is always the same.", "Correct. A known shape belongs in code; it is cheaper and always correct.", "A single agent may still be right if the job is small, but the question is about structuring roles.", "Redundant."],
  },
  {
    q: "What should cross the boundary between a research agent and a writer agent?",
    options: ["The research agent's full history", "A typed fact list with provenance, validated on hand-off", "A prose summary", "The research agent's system prompt"],
    answer: 1,
    why: ["Long, noisy, and breaks context isolation.", "Correct. Schemas make loss visible; provenance makes claims traceable.", "Prose loses fields silently.", "Never."],
  },
  {
    q: "Two research agents might research the same topic. Best remedy?",
    options: ["Tell them to coordinate", "A task board with one claimant per task and a shared fact base searched first", "Run them sequentially", "A bigger supervisor model"],
    answer: 1,
    why: ["Agents coordinating by chat is the failure, not the fix.", "Correct. Ownership of tasks and a shared store remove the race structurally.", "Loses the parallelism that motivated two agents.", "Size does not prevent duplication."],
  },
  {
    q: "A writer–reviewer–fixer loop has run four rounds and the problem count is 3, 3, 3, 3. What should happen?",
    options: ["Keep going until pass", "Stop: not converging; hand to a person with the problems", "Switch the reviewer off", "Restart from the first draft"],
    answer: 1,
    why: ["An uncapped loop is cost without progress.", "Correct. A convergence rule ends the loop when problems stop falling.", "Removing the check does not fix the draft.", "Wasteful and likely to repeat."],
    reason: true,
  },
  {
    q: "A delegated task should include:",
    options: ["The supervisor's entire history", "Outcome, specific inputs, constraints, output schema, budget, allowed tools, failure instruction", "Only a one-line instruction", "All tools the system has"],
    answer: 1,
    why: ["Breaks context isolation and bloats the worker.", "Correct. A complete small goal with scoped authority.", "Vague tasks return varying results.", "Authority should be the minimum for the task."],
  },
  {
    q: "A supervisor retried a failing worker eleven times with the same task. Which remedies apply?",
    options: ["A better worker prompt only", "A same-task retry cap, a job-level budget feeding worker budgets, and validation errors that tell the worker what to fix", "A larger worker budget", "Removing validation"],
    answer: 1,
    why: ["The structure allowed eleven identical retries; prompts cannot cap that.", "Correct. All three are controller-level fixes.", "More budget, more waste.", "Validation is what caught the bad output."],
  },
];

export const M34_EXERCISES: Exercise[] = [
  {
    title: "Justify or refuse a split",
    kind: "think",
    task: "For each single-agent problem, say whether splitting into multiple agents is justified, which reason applies, and the structure: (a) a research agent whose reports get worse after step 25; (b) a classifier that is wrong 10% of the time; (c) a report job where five sections are independent and take 4 minutes each in sequence; (d) a drafting agent whose self-reviews pass everything.",
    hints: ["Context, specialisation, parallelism, or none.", "What symptom proves the reason?"],
    solution: "(a) Yes: context isolation; fan-out by topic with separate contexts and a shared fact base. (b) No: accuracy is a prompt, examples or model problem; a 'verifier agent' doubles cost without a new role. (c) Yes: parallelism; coordinator with five parallel section nodes and a synthesis node. (d) Yes: specialisation; a reviewer agent with its own prompt, a careful model, no drafting tools, in a capped review–fix loop.",
  },
  {
    title: "Define the protocol",
    kind: "code",
    task: "Write the Zod schemas for the three hand-offs in an outline → draft → fact-check pipeline: Outline, Draft, and FactCheck (verdict plus located problems with optional fact references). Include provenance on the draft.",
    hints: ["Every hand-off is a schema.", "Problems need a location the fixer can act on."],
    solution: "const Outline = z.object({ sections: z.array(z.object({ id: z.string(), heading: z.string(), points: z.array(z.string()).min(1) })).min(2) }); const Draft = z.object({ markdown: z.string().min(200), sectionIds: z.array(z.string()), factRefs: z.array(z.string()), producedBy: z.object({ agent: z.string(), runId: z.string() }) }); const FactCheck = z.object({ verdict: z.enum(['pass', 'fix']), problems: z.array(z.object({ sectionId: z.string(), quote: z.string().max(200), issue: z.string().max(200), factRef: z.string().optional() })).max(20) }).",
  },
  {
    title: "Budget a job",
    kind: "calculate",
    task: "A job has a budget of £2.00. The supervisor gives each worker run 30% of the remaining budget. Three workers run in sequence, each spending its full allowance. How much is left after the third, and why does carving from the remainder (rather than giving each worker £0.60) protect the job?",
    hints: ["After each worker: remaining × 0.7.", "What happens with fixed £0.60 allowances if a worker is retried four times?"],
    solution: "After worker 1: £1.40; after 2: £0.98; after 3: £0.686 left. Each later worker gets less, and the total can never exceed £2 no matter how many workers run, because allowances shrink geometrically. With fixed £0.60 allowances, four retries of one worker would cost £2.40, more than the whole job budget.",
  },
  {
    title: "Diagnose from a trace tree",
    kind: "think",
    task: "A report has a fabricated statistic. The trace tree shows: research worker A finished with 12 facts; research worker B finished with 0 facts (status done); the writer produced three sections; the reviewer passed. Name the failure modes and the structural fixes, in order of where they should have fired.",
    hints: ["Which boundary let an empty result through?", "Why did the reviewer pass a fabricated number?"],
    solution: "Silent partial failure: worker B's empty result crossed the boundary as 'done'; fix: FactList requires min 1 fact, so validation fails and the supervisor sees a worker failure. Cascading error: the writer, given no facts for its section, invented one; fix: the writer's delegation says 'if a section has no facts, write a gap note, never estimate'. Reviewer weakness: it passed an unsupported claim; fix: the reviewer must map every numeric claim to a fact id, and unmapped claims are automatic problems. Accountability: provenance on each claim would have shown the statistic had no producing fact.",
  },
];
