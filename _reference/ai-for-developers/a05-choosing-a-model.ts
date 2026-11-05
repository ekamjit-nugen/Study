import type { StoryPage, Topic } from "../types";

// AI 1.5: choosing a model. Sizes, open vs closed, multimodal, price, and measuring on your own task.

const SETTING = "The same online furniture shop. The Help page chat box is almost ready to launch (lessons 1.2 to 1.4 shaped it). The provider offers several models at very different prices, and a second provider is cheaper still. Priya has to sign off on the monthly budget and wants one answer: which model?";
const CAST = "**Priya** (product manager) signs the budget. **Dev** (developer) has to pick a model and justify it. **Nisha** (support lead) will judge the answers.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "The pricing page lists models that differ by ten times in price. Priya wants the cheapest; Nisha wants the best answers; nobody knows which model is good enough for a shop's support questions.",
    title: "'The expensive one is ten times the cheap one. Which do we use?'",
    text: "Dev opens the provider's pricing page for Priya. Three models: a small fast one at a fraction of a dollar per million tokens, a middle one a few times that, and a large one roughly ten times the small one. A second provider has an open model that the shop could even run on its own server. Each one claims to be excellent.\n\nPriya's instinct is the cheapest. Nisha's instinct is the biggest, because she has to clean up wrong answers. Dev's instinct is that neither of them has looked at a single answer from any of the three.\n\n**This is the problem.** 'Which model' is a decision about quality, cost, speed and capabilities on *your* task, and the pricing page tells you none of that. You find out by measuring, and the measurement is cheap.",
  },
  {
    stage: "why",
    point: "Models differ in size, training, what they accept, how fast they are and what they cost. Bigger is better on hard tasks and wasted on easy ones; only your own questions can tell you which yours are.",
    title: "Why there is no single best model",
    text: "A model's size (its number of weights, lesson 1.3) is the main dial. More weights usually means better reasoning, better instruction following, fewer mistakes on hard questions, and also slower answers and a higher price per token, because every token runs through every weight.\n\nBut most of a support bot's questions are easy: a returns window, a delivery fee, a 'where is my order'. On those, a small model with the right facts in the prompt answers as well as a large one, for a tenth of the price, three times faster. The large model earns its price on the tricky tenth: multi-part questions, angry customers, edge cases in the policy.\n\nThat is why the pricing page cannot answer Priya. The right question is: on the shop's actual questions, how often is each model good enough, and what does each one cost at the shop's traffic?",
  },
  {
    stage: "concept",
    point: "Compare models on seven things: size tier, hosted or open-weights, context window, what it accepts (text, images, audio), speed, price, and whether it has a reasoning mode.",
    title: "The seven things that differ between models",
    text: "**Size tier.** Small, medium, large. Providers name them differently, but every line-up has the three.\n\n**Hosted or open-weights.** A hosted model is called over the provider's API; you never see the weights. An open-weights model (Llama, Mistral, Gemma and others) can be downloaded and run on your own machines, which lesson 4.7 covers.\n\n**Context window.** 128k, 200k, a million tokens: how much one call may hold (lesson 1.2).\n\n**Modalities.** Text only, or also images, audio, PDFs, video in; some produce images or speech out.\n\n**Speed.** Time to the first token and tokens per second. Small models are much faster.\n\n**Price.** Per million input and output tokens, with caching and batch discounts.\n\n**Reasoning mode.** Some models can 'think' at length before answering, trading more tokens and time for better results on hard problems; wasted on easy ones.",
    jargon: [["reasoning model", "a model, or a mode, that writes a long hidden chain of intermediate steps before the final answer; better on hard maths, code and planning, slower and pricier, and you pay for the hidden tokens"]],
    table: {
      head: ["Tier", "Typical use", "Price (relative)", "Speed"],
      rows: [
        ["Small", "classification, extraction, simple Q&A with facts supplied, high volume", "1×", "fastest"],
        ["Medium", "most assistants, summaries, code help, tool use", "3–5×", "fast"],
        ["Large", "hard reasoning, long documents, subtle instructions, agents", "10–25×", "slower"],
        ["Reasoning mode", "maths, multi-step planning, tricky code", "large + hidden tokens", "slowest"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Measure instead of guessing: the same fifty real questions through each model, graded by the person who will live with the answers.",
    title: "The fifty-question bake-off",
    text: "Dev takes fifty real customer questions from last week's transcripts, with Nisha's ideal answer for each, and runs them through all three models with the same prompt and the same retrieved policy. The script records the answer, the tokens used and the time taken. Nisha grades each answer good, acceptable or wrong.\n\nTwo hours of work, and Priya's question has a number on it instead of an opinion.",
    codes: [
      {
        title: "Same questions, three models",
        lang: "ts",
        src: `const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];\nconst questions = await loadQuestions("transcripts-week1.json");   // 50 real questions + Nisha's ideal answers\n\nfor (const model of MODELS) {\n  let inTok = 0, outTok = 0, ms = 0;\n  const rows = [];\n  for (const q of questions) {\n    const t0 = Date.now();\n    const r = await client.messages.create({\n      model, max_tokens: 300, temperature: 0,\n      system: SUPPORT_RULES,\n      messages: [{ role: "user", content: \`Policy:\\n\${await retrieve(q.text)}\\n\\nCustomer: \${q.text}\` }],\n    });\n    ms += Date.now() - t0;\n    inTok += r.usage.input_tokens; outTok += r.usage.output_tokens;\n    rows.push({ q: q.text, ideal: q.ideal, answer: r.content[0].text });\n  }\n  await writeFile(\`bakeoff-\${model}.json\`, JSON.stringify(rows, null, 2));   // Nisha grades this file\n  console.log(model, { avgMs: ms / questions.length, inTok, outTok });\n}`,
        lines: [
          { sql: "const questions = await loadQuestions(\"transcripts-week1.json\");", say: "Real questions, not invented ones, each with the answer Nisha would have written." },
          { sql: "for (const model of MODELS) {", say: "Everything else identical; only the model changes." },
          { sql: "model, max_tokens: 300, temperature: 0,", say: "Temperature 0 so differences come from the model, not from sampling." },
          { sql: "ms += Date.now() - t0;", say: "Speed is part of the decision." },
          { sql: "inTok += r.usage.input_tokens; outTok += r.usage.output_tokens;", say: "Tokens × price = the monthly cost per model at real traffic (lesson 1.2)." },
          { sql: "await writeFile(`bakeoff-${model}.json`, JSON.stringify(rows, null, 2));", say: "A file per model for a human to grade. Lesson 3.7 automates most of the grading." },
        ],
        note: "Model names are examples; use the current names from the provider's model list.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Read the bake-off as three numbers per model: how many answers were good enough, what a month costs, how long customers wait. Then decide.",
    title: "What the bake-off said",
    text: "Nisha's grades came back. The small model got 41 of 50 good or acceptable; the nine misses were the multi-part questions and two angry emails where it apologised too much and promised a refund. The medium model got 48 of 50 and never promised money. The large model got 49, at four times the medium's cost and twice its waiting time.\n\nDev puts the three numbers side by side with the monthly cost at the shop's traffic from lesson 1.2's arithmetic. The medium model is the obvious pick: one more good answer a week does not justify four times the bill, and nine misses a week is nine angry customers.\n\nOne more idea for later: send the easy questions to the small model and the hard ones to the medium, decided by a quick classification. That is model routing, lesson 3.9.",
    table: {
      head: ["Model", "Good or acceptable (of 50)", "Monthly cost at 2,000 questions/day", "Average wait"],
      rows: [
        ["Small", "41", "~$60", "0.8 s"],
        ["Medium", "48", "~$380", "1.6 s"],
        ["Large", "49", "~$1,500", "3.4 s"],
      ],
    },
    jargon: [["model routing", "sending each request to a different model by its difficulty or type: a cheap model for easy ones, a strong one for hard ones"]],
    ask: "The small model's nine misses were two kinds: multi-part questions and angry customers. Could you detect those two kinds before choosing the model? What would that save?",
  },
  {
    stage: "implement",
    point: "Four more things decide the choice in practice: whether the model can see images, whether the data may leave your servers, how long the context must be, and pinning the version so the answers do not change under you.",
    title: "The questions the bake-off does not answer",
    text: "**Images and files.** Customers will send photos of damaged desks. That needs a model that accepts images (lesson 2.7). The small text-only model is out for that step, whatever its score.\n\n**Where the data may go.** If the policy says customer messages may not leave the shop's region or servers, the options narrow to providers with regional hosting or an open-weights model run in-house (lesson 4.7).\n\n**Context size.** A support question with three retrieved paragraphs needs 5k tokens; summarising a whole year of a customer's tickets needs 100k. Pick a window with headroom.\n\n**The version.** Providers update models under the same family name. Call a pinned version, keep the bake-off as an eval, and re-run it when you move versions. Lesson 1.3's 'the answers changed overnight' is always a version change.",
    codes: [
      {
        title: "Pin the version; make the model a setting",
        lang: "ts",
        src: `// config.ts\nexport const MODELS = {\n  support: process.env.MODEL_SUPPORT ?? "claude-sonnet-5-5-20260601",   // pinned snapshot, not a floating name\n  classify: process.env.MODEL_CLASSIFY ?? "claude-haiku-5-5-20260601",\n  vision: process.env.MODEL_VISION ?? "claude-sonnet-5-5-20260601",\n};\n\n// anywhere in the app\nconst r = await client.messages.create({ model: MODELS.support, ... });`,
        lines: [
          { sql: "support: process.env.MODEL_SUPPORT ?? \"claude-sonnet-5-5-20260601\",", say: "A dated snapshot name, so the provider's next release does not silently change your answers." },
          { sql: "classify: process.env.MODEL_CLASSIFY ?? \"claude-haiku-5-5-20260601\",", say: "A cheap model for the cheap jobs: routing, tagging, extraction." },
          { sql: "const r = await client.messages.create({ model: MODELS.support, ... });", say: "Code never names a model directly; changing models is a config change plus an eval run." },
        ],
        note: "Snapshot names are illustrative; copy the real ones from the provider's model list.",
      },
    ],
  },
  {
    stage: "compare",
    point: "Picking the biggest model for everything is safe-looking and expensive. Defaulting to a medium model, measuring, and routing the easy work to a small one is what experienced teams do.",
    title: "Biggest for everything, or measured and routed",
    text: "Two ways to choose. The first takes the top of the pricing page and never looks back. The second treats the choice as an engineering decision with numbers behind it.",
    versus: {
      beginner: {
        title: "Always the largest model",
        points: ["Fewest wrong answers on day one.", "Ten times the bill of the small model, on questions that mostly did not need it.", "Two to three times the waiting time for every customer.", "No eval set, so nobody notices when the provider's update changes behaviour."],
      },
      engineer: {
        title: "Medium by default, measured, routed, pinned",
        points: ["A fifty-question bake-off with the people who will judge the answers.", "Medium model as the default: good enough on 96%, a quarter of the large model's cost.", "Small model for routing, tagging and the easy majority once routing exists.", "Pinned versions, the bake-off kept as an eval, re-run on every change.", "Images and data-residency needs checked before the price."],
      },
      tradeoffs: ["Routing adds a classification call and a second prompt to maintain.", "A medium model will miss a few hard cases the large one gets; decide what those cost.", "Bake-offs go stale: refresh the questions from real traffic every month."],
      when: "Use the largest model when the task is genuinely hard (complex reasoning, long documents, agents) or when a wrong answer is expensive and volume is low. Everything else starts medium and earns its way up or down with numbers.",
    },
  },
  {
    stage: "recap",
    point: "Choose a model by measuring on your own questions: quality, cost at your traffic, speed. Then check images, data residency and context size, pin the version, and keep the test.",
    title: "Connect it back: Priya's budget, with a number on it",
    text: "Priya wanted the cheapest model and Nisha wanted the biggest. Fifty real questions through all three, graded by Nisha, showed the medium model answers 96% well at a quarter of the large model's cost and half its waiting time; the small model misses the multi-part and angry questions. Images need a vision-capable model for the damage-photo step. The version is pinned, the model name is a setting, and the fifty questions are now the eval that guards every change.",
    recap: {
      remember: ["Models differ in size tier, hosted vs open-weights, context window, modalities, speed, price and reasoning mode.", "Bigger wins on hard questions and is wasted on easy ones; only your questions tell you which you have.", "Decide with a bake-off: real questions, same prompt, graded by the owner of the answers, costed at real traffic.", "Pin versions, make the model a setting, keep the bake-off as an eval."],
      mistakes: ["Choosing from the pricing page alone.", "Using a floating model name in production.", "Forgetting images, data residency or context size until after the choice.", "Running the bake-off once and never again."],
      production: ["Most teams run a medium model by default with a small model for classification and extraction.", "Model routing cuts cost on high-volume features without hurting quality where it matters.", "'It got worse overnight' is a version change; the eval set is how you prove it."],
      next: ["2.1 Your first API call, line by line: the request and response you have been reading.", "3.7 Evals: the bake-off, automated.", "3.9 Cost and latency: caching, batching, routing."],
    },
    ask: "Module 2 starts with the actual API call: messages, roles and the system prompt. You have seen it six times now; next you will read every line of it.",
  },
];

export const A05: Topic = {
  slug: "choosing-a-model",
  title: "Choosing a model: sizes, open vs closed, multimodal, price",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["List the seven ways models differ and say which matter for a given feature.", "Run a bake-off: real questions, same prompt, graded by the answer owner, costed at real traffic.", "Explain why a medium model is the usual default and when the largest is worth it.", "Pin a model version and make the model a configuration setting."],
  prerequisites: ["tokens-context-cost", "what-models-get-wrong"],
  story: "Hiring for a help desk: the most senior person on the market is brilliant and expensive and would spend the day answering 'where is my order'. You hire the solid mid-level person, keep a junior for the easy tickets, and call in the expert for the hard cases.",
  tldr: [
    "Models differ in **size tier**, **hosted vs open-weights**, **context window**, **modalities**, **speed**, **price** and **reasoning mode**.",
    "Bigger is better on hard tasks and wasted on easy ones. Decide with a **bake-off** on your own questions, not the pricing page.",
    "Default to a medium model; small for routing and extraction; large for genuinely hard work.",
    "**Pin the version**, make the model a config setting, keep the bake-off as an eval.",
  ],
  words: [
    ["size tier", "small / medium / large: roughly how many weights, and therefore quality, speed and price"],
    ["open-weights", "a model you can download and run yourself, instead of calling a provider's API"],
    ["modality", "a kind of input or output: text, image, audio, video, files"],
    ["reasoning mode", "the model thinks at length (hidden tokens) before answering; better on hard problems, slower and pricier"],
    ["bake-off", "the same real questions through several models, graded and costed"],
    ["model routing", "sending easy requests to a cheap model and hard ones to a strong one"],
  ],
  sections: [],
  quiz: [
    { q: "The small model scored 41/50, the medium 48/50, the large 49/50. The large costs four times the medium. For a support bot at 2,000 questions a day, which do you pick?", options: ["Large: best score", "Medium: 96% at a quarter of the cost and half the wait", "Small: cheapest", "Alternate between them"], answer: 1, reason: true, whyOptions: ["One extra good answer a week does not justify four times the bill and double the waiting time.", "Correct. Quality is almost identical to the large model on this task, and cost and speed are far better.", "Nine misses a week on a customer-facing bot is nine complaints; too many.", "Random alternation gives you the worst of both; routing by difficulty is the real version of this idea."], why: "Choose on measured quality at real cost and speed." },
    { q: "Which of these is NOT something a bake-off tells you?", options: ["Answer quality on your questions", "Monthly cost at your traffic", "Whether the model accepts images", "Average waiting time"], answer: 2, whyOptions: ["Grades per answer give you this.", "Tokens × price × traffic.", "Correct. Modalities, data residency and context size are checked from the model's spec, before or alongside the bake-off.", "Measured per call."], why: "Capabilities are specs; quality, cost and speed are measurements." },
    { q: "Why pin a dated model version in production?", options: ["Pinned versions are cheaper", "So the provider's next update cannot silently change your answers", "Floating names are rate-limited", "Pinned versions have bigger context windows"], answer: 1, whyOptions: ["Price is the same for the same model.", "Correct. A floating name points at whatever is newest; your eval set and your users would notice the change before you did.", "Rate limits are per account, not per name.", "The window is a property of the model, not the name."], why: "Stability: change models on purpose, with evals, not by surprise." },
  ],
  practice: [
    { q: "Design a bake-off for the shop's 'summarise a customer's ticket history' feature: what are the inputs, who grades, what three numbers come out?", answer: "Inputs: 30 real ticket histories (anonymised) with a summary Nisha would write; same prompt per model. Nisha grades each summary good/acceptable/wrong. Outputs: good-or-acceptable rate, monthly cost at expected volume from the token usage, average time per summary. Histories are long, so context window is also checked.", explain: "Real inputs, the answer owner grading, quality plus cost plus speed." },
    { q: "A feature classifies incoming emails into five categories at 10,000 emails a day. Which tier, and why?", answer: "Small. Classification with clear categories is an easy task; the small model is fastest and cheapest at that volume, and a bake-off will usually show its accuracy matches the medium model. Use structured output (lesson 2.3) for a fixed label.", explain: "Match the tier to the difficulty and the volume." },
    { q: "Customers will send photos of damaged furniture. How does that change the model choice, and what else changes?", answer: "The step that reads photos needs a model that accepts images; text-only models are out for it regardless of price. The rest of the bot can stay on the medium text model; that step can call the vision-capable model only when a photo is attached, which is routing by modality.", explain: "Capabilities first, then price." },
  ],
  interview: [
    { level: "junior", q: "How do you choose which model to use for a feature?", a: "Not from the pricing page. I take a set of real inputs with ideal outputs, run them through candidate models with the same prompt, have the person who owns the answers grade them, and cost each model at expected traffic from the token usage. Then I check capabilities the task needs, images, context size, data residency, and pick the cheapest model that is good enough." },
    { level: "mid", q: "What are the main ways models differ?", a: "Size tier (quality, speed, price), hosted versus open-weights, context window, modalities (text, image, audio, files), latency, price per million tokens, and whether a reasoning mode exists. The first and last are about capability; the others are about fit and constraints." },
    { level: "mid", tricky: true, q: "Isn't the largest model always the safest choice?", a: "It is the fewest-mistakes choice and usually the slowest and most expensive one. On easy, high-volume tasks with facts supplied, a medium or small model matches it, so the extra cost buys nothing, and the extra latency costs users. The safe choice is the one you measured on your task, with evals that keep it safe." },
    { level: "senior", q: "Explain model routing and when it pays off.", a: "A cheap classifier or a rule decides whether a request is easy or hard and sends it to a small or a strong model accordingly. It pays off when volume is high and most requests are easy, which is typical for support, tagging and extraction. The costs are a second prompt to maintain and the risk of misrouting hard cases, which evals measure." },
    { level: "mid", q: "Open-weights or a hosted API?", a: "Hosted when you want the best models, no infrastructure and pay-per-token; open-weights when data must stay in-house, when volume makes per-token pricing worse than a GPU, when you need to fine-tune deeply, or when you need full control of versions. Many teams use both: hosted for the hard features, a small open model in-house for high-volume simple ones." },
    { level: "mid", tricky: true, q: "Our answers got worse this week and we changed nothing. What happened?", a: "Most likely the model name we call is a floating alias and the provider moved it to a new version. Pin dated snapshots, keep an eval set from the original bake-off, and re-run it when upgrading on purpose. If the name was pinned, check the retrieval index and the prompt for changes." },
    { level: "senior", q: "When is a reasoning model worth its cost?", a: "On genuinely hard, multi-step problems: planning, maths, intricate code changes, complex agent tasks, where a wrong answer costs more than the extra tokens and seconds. Not for chat, extraction or summaries, where it adds latency and hidden-token cost for no gain. Measure it in the bake-off like any other model." },
    { level: "junior", q: "What is a context window and how does it affect model choice?", a: "The maximum tokens one call may hold. If the feature needs to read long documents or long histories, the model must have a window with headroom above them; otherwise calls fail. For short questions almost any window is enough, and a smaller, faster model may do." },
    { level: "mid", q: "How does multimodality change the design?", a: "Only the steps that need images, audio or files have to use a model that accepts them; the rest of the feature can run on a cheaper text model. Route by what the request contains, and check the price per image, which is usually counted as a fixed number of tokens." },
    { level: "senior", q: "What would you put in a one-page model decision for a product manager?", a: "The task and the real question set, the candidates, the grading rubric and who graded, a table of quality, monthly cost at expected traffic and latency per model, the capability checks (modalities, context, residency), the recommendation with the reasons, the pinned version, and the plan to re-run the bake-off monthly and on every model change." },
  ],
  remember: [
    "Measure on your questions; the pricing page cannot choose for you.",
    "Medium by default, small for easy volume, large for hard work.",
    "Images, residency and context size are specs to check first.",
    "Pin the version, make the model a setting, keep the bake-off as the eval.",
  ],
};
