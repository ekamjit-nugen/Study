import type { StoryPage, Topic } from "../types";

// AI 2.4: temperature, top-p, max tokens, stop sequences.

const SETTING = "The same online furniture shop. The model now does two jobs: steady support answers and email tags (lessons 2.2 and 2.3), and, from this week, Priya's new request: five different marketing blurbs per product for the newsletter. One set of settings is used for all of it.";
const CAST = "**Priya** (product manager) wants lively, varied blurbs. **Nisha** (support lead) wants the same answer to the same question every time. **Dev** (developer) has one call with one set of knobs.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "With the default settings, the five marketing blurbs come out nearly identical and dull. When Dev turns up the variety, support answers start to wobble. One global setting is serving two opposite needs.",
    title: "Dull blurbs, wobbly answers",
    text: "Priya asked for five different blurbs per product for the newsletter. Dev called the model five times with the same prompt. The five blurbs were almost the same sentence with a word swapped. Priya: 'these are boring'.\n\nDev found the setting that controls variety, temperature, and turned it up for everything. The blurbs became lively. The next morning Nisha reported that the returns question now sometimes said 30 days and sometimes 'about a month', and once said 'contact us for details' for a question the policy clearly covered.\n\n**This is the problem.** The knobs that control how the model picks each token are set per call, and the right values for creative writing are the wrong values for support. Dev needs to know what each knob does and set them per task.",
  },
  {
    stage: "why",
    point: "At each step the model has a list of possible next tokens with probabilities. The settings decide how that list is sampled: always the top one, or sometimes a less likely one.",
    title: "Why there is a dial at all",
    text: "Lesson 1.1: for every position, the model produces probabilities for every possible next token. Something has to pick one. Always picking the top token gives the most 'expected' text: steady, repetitive, safe. Picking from the whole distribution according to the probabilities gives variety, surprise, and occasionally nonsense.\n\nTemperature reshapes the probabilities before picking: low temperature sharpens them (the top token dominates), high temperature flattens them (less likely tokens get a real chance). Top-p trims the list to the smallest set of tokens whose probabilities add up to p before sampling from it. Both are ways of asking: how adventurous should each pick be?\n\nFor a blurb, adventurous is the point. For 'how many days to return a desk', the only correct behaviour is the most likely token, every time, because the fact is in the prompt and the most likely continuation is the one that repeats it.",
    jargon: [["probability distribution", "the model's list of every possible next token with how likely each is; sampling means picking one at random according to those odds"]],
  },
  {
    stage: "concept",
    point: "Four settings: temperature (how adventurous), top-p (how much of the list to consider), max_tokens (how long), stop sequences (where to stop). Set them per task.",
    title: "The four knobs",
    text: "**Temperature.** 0 to about 1 (some APIs allow 2). 0: nearly deterministic, the most likely token each time. Around 0.7: natural, varied prose. 1 and above: creative to chaotic. Facts, classification, code: 0. Marketing, brainstorming, names: 0.8 to 1.\n\n**Top-p (nucleus sampling).** Consider only the most likely tokens whose probabilities add up to p. 0.9 drops the long tail of weird tokens; 1 considers everything. Providers advise setting temperature or top-p, not both.\n\n**max_tokens.** The cap on the answer. Not a target: the model does not try to fill it. Set it to the longest acceptable answer with headroom, and check stop_reason for cut-offs (lesson 2.1).\n\n**Stop sequences.** Strings that end the answer the moment they appear: useful when you ask for a list and want it to stop at a marker, or when generating one item at a time.\n\nTemperature 0 is not the same as 'no mistakes' (lesson 1.4): it makes a wrong answer repeatable, not right.",
    table: {
      head: ["Task", "temperature", "top-p", "max_tokens", "Why"],
      rows: [
        ["Support answer from policy", "0", "default", "300", "repeat the fact in the prompt, same words every time"],
        ["Email tagging (structured)", "0", "default", "200", "the most likely label, consistently"],
        ["Marketing blurbs, 5 variants", "0.9", "0.95", "120", "variety is the product; cap length"],
        ["Code generation", "0 to 0.2", "default", "as needed", "correctness over creativity"],
        ["Brainstorm 20 product names", "1.0", "0.95", "200", "surprise wanted; a person filters"],
        ["Summarising a ticket", "0.2", "default", "250", "faithful, slight natural variation ok"],
      ],
    },
  },
  {
    stage: "visual",
    point: "The same prompt at temperature 0 and 1, five times each: steady on the left, varied on the right.",
    title: "Five runs, two temperatures",
    text: "Dev reuses the five-runs script from lesson 1.4 on the blurb prompt. At 0, the five blurbs are the same sentence. At 1, they differ in structure and vocabulary; one is slightly over the top, which is what Priya's filter is for.",
    visual: {
      kind: "compare",
      left: { title: "temperature 0, five runs", lines: ["'A sturdy standing desk with a quiet motor…'", "'A sturdy standing desk with a quiet motor…'", "'A sturdy standing desk with a quiet motor…'", "(identical)", "(identical)"], tone: "accent" },
      right: { title: "temperature 1, five runs", lines: ["'Stand up for your back: a desk that rises with you.'", "'Quiet motor, solid oak top, zero wobble at full height.'", "'Meetings are better standing. So is everything else.'", "'From 72 to 120 cm in eight seconds, silently.'", "'The desk that ends the 3 pm slump.' (Priya's pick)"], tone: "ok" },
      caption: "Same prompt, same model. Only the sampling changed.",
    },
  },
  {
    stage: "implement",
    point: "Settings live with the task, not in one global place. A small table of presets, chosen by name, keeps support steady and marketing lively.",
    title: "Presets per task",
    text: "Dev replaces the one shared call with a map of presets. Each task names its preset; the preset carries temperature, top-p and max_tokens. Changing the newsletter's creativity cannot touch the support bot again.",
    codes: [
      {
        title: "presets.ts",
        lang: "ts",
        src: `export const PRESETS = {\n  support:   { temperature: 0,   max_tokens: 300 },\n  classify:  { temperature: 0,   max_tokens: 200 },\n  summarise: { temperature: 0.2, max_tokens: 250 },\n  blurb:     { temperature: 0.9, top_p: 0.95, max_tokens: 120, stop_sequences: ["\\n\\n"] },\n  brainstorm:{ temperature: 1.0, top_p: 0.95, max_tokens: 400 },\n} as const;\n\nexport async function ask(preset: keyof typeof PRESETS, system: string, user: string) {\n  const p = PRESETS[preset];\n  const reply = await client.messages.create({\n    model: process.env.MODEL_SUPPORT!,\n    system,\n    messages: [{ role: "user", content: user }],\n    ...p,\n  });\n  if (reply.stop_reason === "max_tokens") console.warn(preset, "cut off");\n  return reply.content.find((b) => b.type === "text")?.text ?? "";\n}\n\n// five different blurbs\nconst blurbs = await Promise.all([1, 2, 3, 4, 5].map(() => ask("blurb", BLURB_RULES, productFacts)));`,
        lines: [
          { sql: "support:   { temperature: 0,   max_tokens: 300 },", say: "Facts from the prompt, repeated the same way every time." },
          { sql: "blurb:     { temperature: 0.9, top_p: 0.95, max_tokens: 120, stop_sequences: [\"\\n\\n\"] },", say: "Adventurous sampling, the long tail trimmed, one short paragraph, stop at the first blank line." },
          { sql: "    ...p,", say: "The preset's settings spread into the call. The task picks the preset by name; nobody edits numbers in five places." },
          { sql: "if (reply.stop_reason === \"max_tokens\") console.warn(preset, \"cut off\");", say: "A cut-off is a sign the preset's cap is too small for this task." },
          { sql: "const blurbs = await Promise.all([1, 2, 3, 4, 5].map(() => ask(\"blurb\", BLURB_RULES, productFacts)));", say: "Five independent samples at temperature 0.9: five genuinely different blurbs." },
        ],
        note: "Temperature 0 is still not deterministic down to the bit on most providers; it is 'nearly always the same', which is what support needs.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Two settings people get wrong: max_tokens is a cap, not a target; and 'more temperature' is not 'more creative' past a point, it is 'more broken'.",
    title: "Two misunderstandings",
    text: "**max_tokens is a cap.** Setting it to 2,000 does not make answers longer; the prompt decides length (lesson 2.2's format rule). Setting it too low cuts answers mid-sentence. Set it to the longest acceptable answer plus headroom, and watch stop_reason.\n\n**Temperature past 1.** The curve is not 'more creative forever'. Somewhere above 1 the long tail of unlikely tokens takes over and the text stops making sense: invented words, broken grammar, wandering topics. Priya's blurbs peaked at about 0.9; at 1.5 they were unusable. For creative work, raise temperature in steps and keep a person choosing.",
    codes: [
      {
        title: "A stop sequence for one-item-at-a-time generation",
        lang: "ts",
        src: `// generate exactly one product name per call, stopping at the newline\nconst reply = await client.messages.create({\n  model: process.env.MODEL_SUPPORT!,\n  max_tokens: 20,\n  temperature: 1.0,\n  stop_sequences: ["\\n"],\n  system: "Suggest one product name. Reply with the name only.",\n  messages: [{ role: "user", content: productFacts }],\n});\nconst name = reply.content[0].type === "text" ? reply.content[0].text.trim() : "";`,
        lines: [
          { sql: "stop_sequences: [\"\\n\"],", say: "The moment the model writes a newline, the answer ends. No list, no second name, no 'Here are some ideas:'." },
          { sql: "max_tokens: 20,", say: "A name is a few tokens; the cap is a safety net, not the stopping rule." },
        ],
      },
    ],
    ask: "A colleague sets temperature 0 for code generation and complains the model keeps producing the same wrong fix. What would you change, and what would you not change?",
  },
  {
    stage: "compare",
    point: "One global setting forces a compromise that suits nobody. Presets per task give each job the sampling it needs and keep changes from leaking across.",
    title: "One setting for everything, or presets per task",
    text: "Two ways to run support, tagging and marketing from the same model. The first uses one call with one temperature for every feature. The second gives each task a named preset and lets nothing leak between them.",
    versus: {
      beginner: {
        title: "One shared call, one temperature",
        code: "const reply = await client.messages.create({ model, temperature: 0.7, max_tokens: 1000, ... });   // used by every feature",
        points: ["Simple.", "0.7 makes support answers vary and blurbs merely okay.", "max_tokens 1000 for everything: no cut-off protection where it matters, no cap where it matters.", "A tweak for the newsletter changes the support bot."],
      },
      engineer: {
        title: "Named presets, chosen by task",
        code: "ask(\"support\", …)   // temperature 0, 300 tokens\nask(\"blurb\", …)     // temperature 0.9, top_p 0.95, 120 tokens, stop at blank line",
        points: ["Each task gets the sampling it needs.", "Caps match each task's real answer length; cut-offs are logged per preset.", "Changing marketing creativity cannot touch support.", "Presets are reviewed with the prompt and tested with the question set."],
      },
      tradeoffs: ["More configuration to maintain; it is a small table.", "Presets drift from reality unless cut-off and usage logs are watched.", "Temperature 0 does not fix facts (lesson 1.4) and does not guarantee identical bytes."],
      when: "A single setting is fine for a single-purpose script. The moment a model serves two kinds of task, presets.",
    },
  },
  {
    stage: "recap",
    point: "Temperature and top-p control how adventurous each token pick is; max_tokens caps length; stop sequences end the answer. Set them per task: 0 for facts and labels, high for variety.",
    title: "Connect it back: steady support, lively blurbs",
    text: "The blurbs were dull because temperature 0 picks the most likely sentence five times. The support answers wobbled because the fix for the blurbs was applied to everything. Presets per task gave marketing 0.9 with a trimmed tail and a short cap, and gave support 0 with a cap that fits real answers. Stop sequences let Dev generate one clean name per call. And temperature 0 still needs the facts in the prompt; it repeats, it does not verify.",
    recap: {
      remember: ["Temperature: 0 for facts, labels and code; 0.7 to 1 for prose and ideas; above 1 breaks.", "Top-p trims the long tail; set one of temperature or top-p, not both.", "max_tokens is a cap, not a target; check stop_reason.", "Stop sequences end the answer at a marker; presets per task."],
      mistakes: ["One global temperature for support and marketing.", "Believing temperature 0 means correct or bit-identical.", "max_tokens far too high (no protection) or too low (cut-offs).", "Raising temperature past 1 hoping for creativity."],
      production: ["Classification, extraction and RAG answers run at 0; generation features run at 0.7 to 1 with a human choosing.", "Cut-off rates per preset are a standard dashboard metric.", "Presets are versioned with prompts and covered by evals."],
      next: ["2.5 Streaming: show the first words immediately.", "2.6 Long inputs: when the prompt will not fit.", "3.7 Evals: measuring the variance you allow."],
    },
    ask: "The blurbs are good, the support answers are steady, and customers still watch a spinner for three seconds. Next lesson: streaming.",
  },
];

export const A09: Topic = {
  slug: "sampling-settings",
  title: "Temperature, top-p, max tokens and stop sequences",
  minutes: 14,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain what temperature and top-p change about how a token is picked.", "Choose settings per task: 0 for facts and labels, high for variety.", "Use max_tokens as a cap with stop_reason checks, and stop sequences to end answers cleanly.", "Keep settings as named presets so tasks cannot interfere."],
  prerequisites: ["what-a-model-does", "first-api-call"],
  story: "A writer who can be told how daring to be with each word: play it safe and you get the same careful sentence every time; take risks and you get five different openings, one of them brilliant and one of them odd. You choose the setting per job, not per writer.",
  tldr: [
    "**Temperature** reshapes the next-token odds: 0 = most likely every time; ~0.7–1 = varied; above 1 = broken.",
    "**Top-p** keeps only the most likely tokens up to a probability mass; set one of temperature or top-p.",
    "**max_tokens** is a cap, not a target; watch stop_reason. **Stop sequences** end the answer at a marker.",
    "Set them **per task** with named presets: 0 for facts, labels and code; high for prose and ideas.",
  ],
  words: [
    ["temperature", "how adventurous each token pick is: 0 steady, 1 varied"],
    ["top-p (nucleus sampling)", "sample only from the most likely tokens whose odds add up to p"],
    ["max_tokens", "the cap on answer length"],
    ["stop sequence", "a string that ends the answer the moment it appears"],
    ["preset", "a named bundle of settings chosen per task"],
    ["deterministic", "the same input always gives the same output; temperature 0 is nearly, not fully, this"],
  ],
  sections: [],
  quiz: [
    { q: "Five blurbs at temperature 0 come out nearly identical. Why?", options: ["max_tokens is too low", "At 0 the most likely token is picked every time, so the same text is produced", "The prompt is too long", "The model is cached"], answer: 1, reason: true, whyOptions: ["Length is not the issue; the content repeats.", "Correct. Variety comes from sampling less likely tokens; at 0 there is none.", "Prompt length does not affect variety.", "Caching affects price, not the answer."], why: "Temperature 0 removes variety by design." },
    { q: "Which task should run at temperature 0?", options: ["Brainstorming product names", "Classifying emails into fixed categories", "Writing newsletter blurbs", "Generating five taglines"], answer: 1, whyOptions: ["Names want surprise.", "Correct. The most likely label, consistently; variety here is noise.", "Blurbs want variety.", "Variants want variety."], why: "Facts and labels: 0. Ideas: high." },
    { q: "max_tokens is set to 2000 but answers are still short. Why?", options: ["The model ignores max_tokens", "max_tokens is a cap, not a target; the prompt decides length", "top-p is too low", "The stop sequence fired"], answer: 1, whyOptions: ["It is honoured as a limit.", "Correct. Raise length with the prompt's format rules; max_tokens only prevents overruns.", "top-p affects which tokens, not how many.", "Only if you set one; the default is none."], why: "A cap limits; it does not lengthen." },
  ],
  practice: [
    { q: "Pick settings for: (a) extracting an order number from an email; (b) writing a friendly reply draft a person will edit; (c) generating ten gift-guide headlines.", answer: "(a) temperature 0, small max_tokens, structured output. (b) temperature 0.3–0.5, max_tokens sized to a short email. (c) temperature 0.9–1.0, top-p 0.95, stop sequence per headline or a numbered list cap, a person picks.", explain: "Match adventurousness to the task; cap length to the real answer." },
    { q: "A support answer at temperature 0 is consistently wrong. Which knob fixes it?", answer: "None of the sampling knobs. Temperature 0 makes the answer repeatable; the fact must be put in the prompt (retrieval) or fetched with a tool, and the prompt must restrict the model to it.", explain: "Sampling settings control variety, not truth (lesson 1.4)." },
    { q: "Explain stop_sequences: ['\\n'] with max_tokens 20 for generating one product name per call.", answer: "The model stops at the first newline, so it cannot produce a list or a preamble on following lines; max_tokens 20 is the safety cap in case it never writes a newline. Together they yield exactly one short line per call.", explain: "Stop sequence is the stopping rule; the cap is the backstop." },
  ],
  interview: [
    { level: "junior", q: "What does temperature do?", a: "It controls how adventurous each next-token pick is. At 0 the model takes the most likely token each time, giving steady, repeatable text; higher values give less likely tokens a chance, producing variety and, past about 1, nonsense. Use 0 for facts, classification and code; 0.7 to 1 for prose and ideas." },
    { level: "mid", q: "Temperature vs top-p?", a: "Both shape sampling. Temperature rescales all the probabilities; top-p cuts the list to the most likely tokens whose probabilities sum to p, dropping the tail. Providers advise changing one, not both. Temperature is the usual dial; top-p around 0.9 to 0.95 removes rare bizarre tokens in creative tasks." },
    { level: "mid", tricky: true, q: "Does temperature 0 make the model deterministic and correct?", a: "Nearly deterministic: most providers do not guarantee identical bytes, but the same input gives the same answer almost always. Not correct: it repeats whatever the most likely continuation is, right or wrong. Truth comes from facts in the prompt and tools, not from sampling settings." },
    { level: "junior", q: "What is max_tokens and how do you set it?", a: "The cap on how many tokens the model may write in one reply. It is not a target. Set it to the longest acceptable answer plus headroom, keep it small for short tasks to bound cost and latency, and check stop_reason for max_tokens so cut-off answers are detected." },
    { level: "mid", q: "What are stop sequences for?", a: "Strings that end generation the moment they appear, so you can stop at a newline for one-item outputs, at a marker after a section, or before the model starts a second example. They give a precise stopping rule where max_tokens is only a safety net." },
    { level: "senior", q: "How do you manage sampling settings across a product with many AI features?", a: "Named presets per task type kept with the prompts in version control, chosen by name in code so no feature edits numbers inline; cut-off rates and usage logged per preset; presets covered by the eval set so a change is measured. Facts and labels at 0; generation at 0.7 to 1 with human selection." },
    { level: "mid", tricky: true, q: "To get more creative output we set temperature to 1.8. Why did quality collapse?", a: "At high temperature the distribution flattens so far that rare, inappropriate tokens get picked often; the text drifts, invents words and loses grammar. Creativity peaks below about 1 for most models; combine ~0.9 with top-p 0.95 and generate several candidates for a person to choose from." },
    { level: "mid", q: "How do you generate N distinct variants of something?", a: "N independent calls at a high temperature (0.8 to 1) with top-p trimming the tail, a short max_tokens, and a stop sequence if each call should return exactly one item; or one call asking for a numbered list, which tends to produce less diverse items. Then a person or a scoring step picks." },
    { level: "junior", q: "Why would the same prompt give different answers on two runs?", a: "Because tokens are sampled from probabilities whenever temperature is above 0. For tasks that must be consistent, set temperature 0; for tasks that should vary, that behaviour is the feature." },
    { level: "senior", q: "What is the relationship between sampling settings and evals?", a: "Evals must run with the production preset, because results differ by temperature. For tasks run above 0, run each eval case several times and measure a pass rate rather than a single pass/fail. Changing a preset is a change that re-runs the evals." },
  ],
  remember: [
    "Temperature 0 for facts, labels and code. High for prose and ideas. Above 1 breaks.",
    "One of temperature or top-p, not both.",
    "max_tokens caps; the prompt decides length. Watch stop_reason.",
    "Presets per task; a marketing tweak must not touch support.",
  ],
};
