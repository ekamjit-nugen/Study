import type { StoryPage, Topic } from "../types";

// AI 3.7: evals: tests for things that are never exactly right.

const SETTING = "The same online furniture shop. The Help page chat box now answers from the help centre with citations (lesson 3.6), tags support emails (lesson 2.3) and looks up orders (lesson 3.1). Priya changes the system prompt about twice a week for tone and scope. Nisha checks quality by reading thirty transcripts every Monday morning, which takes two hours. The code has unit tests; the prompts have none.";
const CAST = "**Nisha** (support lead) grades transcripts by hand. **Priya** (product manager) edits prompts. **Dev** (developer) deploys the changes and gets the blame. **Kabir** (owner) asks whether the chat box is getting better or worse.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A prompt edit to make replies warmer silently broke the mattress-returns answer. Nobody noticed for ten days because the only check was Nisha reading a sample on Mondays, and the sample did not contain a mattress question.",
    title: "The friendlier prompt that broke returns",
    text: "On a Tuesday Priya edits the system prompt: 'Be warm and reassuring; avoid blunt refusals.' The replies do read nicer. Ten days later Nisha finds a transcript where a customer asked about returning an opened mattress and the chat box said 'Don't worry, we'll sort it out for you!' The rule is unopened only. The source chunk was right there in the prompt; the new instruction to avoid blunt refusals had pushed the model into softening it into a false yes.\n\nDev looks for how to catch this. Unit tests cover the code, and the code did nothing wrong. Nisha's Monday review is thirty random transcripts out of two thousand; the chance of a mattress question being in it was small. Kabir asks the obvious question: is the chat box better or worse than last month? Nobody can say.\n\n**This is the problem.** Every prompt and model change changes behaviour, nobody measures the behaviour, and the measurement that exists is slow, small and random. The feature needs tests, and ordinary tests do not fit, because the right answer is never exactly one string.",
  },
  {
    stage: "why",
    point: "Normal tests compare output to an exact expected value. Model output is sampled prose that varies by design. So the test must check properties of the answer, not its exact text, and it must run on enough cases that a change shows up as a number.",
    title: "Why assertEqual does not work here",
    text: "A unit test says: for this input, the output is exactly this. The mattress answer can be phrased a hundred correct ways and a hundred wrong ones, and tomorrow's phrasing differs from today's (lesson 1.4). An exact-match test fails on correct answers and passes on nothing useful.\n\nBut properties are stable even when wording is not. The mattress answer must say unopened only; must cite the hygiene article; must not say yes. The email tagger must return 'returns' for this email. The order lookup must say 'not found' for 4471. Each property can be checked by code, by a regex, or, for judgement calls like 'is this reply warm but accurate?', by a second model given a rubric.\n\nAnd one case is not a test. A single answer is a sample; the behaviour is the rate. Fifty mattress-style questions with a pass rate of 96% last week and 71% this week is a regression you can see. So an **eval** is a set of cases, each with a check, run together, reported as numbers, compared with the last run. It is the unit test suite for behaviour.",
  },
  {
    stage: "concept",
    point: "An eval is cases plus graders plus a runner. Cases come from real traffic and known failures; graders are exact match, code checks or a model with a rubric; the runner reports pass rates by category against a baseline and fails the build on regression.",
    title: "Cases, graders, runner, baseline",
    text: "**Cases.** Each is an input and what must be true of the output. The best cases are real: Nisha's failed transcripts, the zero-result searches, the emails the tagger got wrong. Fifty to two hundred per feature is plenty to start. Include cases for what must not happen: a staff-only fact, a refund promise, an invented order.\n\n**Graders.** Three kinds, cheapest first. Exact or set match for structured output: the tag is 'returns'. Code checks for properties: the answer contains '[1]', does not contain 'yes', is under 120 words, declines when it should. A **model-graded** check for judgement: a second model call with a rubric ('Is every claim supported by the sources? Is the tone warm without changing the policy?') returning a structured verdict. Model graders are checked against a handful of human-graded answers before being trusted.\n\n**Runner.** Runs every case against the current prompt and model, several times for the flaky ones, and reports pass rate per category. **Baseline.** The last accepted run's numbers; a drop beyond a tolerance fails the build, exactly like a failing test. Every production failure becomes a new case, so the suite grows toward what actually goes wrong.",
    jargon: [["grader", "the check applied to one case's output: exact match, a code assertion, or a model with a rubric"], ["rubric", "the written criteria a model grader scores against, specific enough that two people would agree"], ["baseline", "the numbers from the last accepted run, which the new run is compared with"], ["golden set", "the curated cases with known-good expectations, kept small, real and reviewed"]],
    table: {
      head: ["Grader", "Use for", "Example", "Cost"],
      rows: [
        ["exact / set match", "structured output", "tag === 'returns'", "free"],
        ["code check", "properties of prose", "cites [n]; no 'yes'; under 120 words; declined", "free"],
        ["model with rubric", "judgement", "faithful to sources? warm but accurate?", "one cheap call per case"],
        ["pairwise preference", "tone and style changes", "old vs new answer: which is better, and why?", "one call per pair"],
        ["human review", "calibrating the model grader", "20 answers graded by Nisha, compared with the judge", "slow; do it once per rubric"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Cases are data: an input, a category, and the checks. Keeping them in a file lets Nisha add one from any bad transcript without touching code.",
    title: "The case file",
    text: "Dev keeps the help-chat cases in a JSON file next to the tests. Each case has the question, the audience, a category for reporting, and checks of three kinds: strings that must appear, strings that must not, whether a decline is expected, and a rubric for the model grader. Nisha adds the mattress case the day she finds it.",
    codes: [
      {
        title: "evals/help-chat.cases.json (two cases)",
        lang: "json",
        src: `[
  {
    "id": "returns-mattress-opened",
    "category": "returns",
    "input": { "question": "I opened my mattress last week, can I still return it?", "audience": "customer" },
    "mustInclude": ["unopened"],
    "mustNotInclude": ["yes, you can", "we'll sort it out"],
    "mustCite": "hygiene-items-and-mattresses",
    "rubric": "The answer must state that opened mattresses cannot be returned, kindly, without implying an exception exists."
  },
  {
    "id": "no-coverage-isle-of-wight",
    "category": "coverage",
    "input": { "question": "Do you deliver to the Isle of Wight?", "audience": "customer" },
    "expectDecline": true,
    "mustNotInclude": ["yes", "we deliver"]
  }
]`,
        lines: [
          { sql: "\"id\": \"returns-mattress-opened\",", say: "A stable id, so the same case can be tracked across runs and linked from the transcript that caused it." },
          { sql: "\"category\": \"returns\",", say: "Pass rates are reported per category; a regression in returns shows even if the total barely moves." },
          { sql: "\"mustNotInclude\": [\"yes, you can\", \"we'll sort it out\"],", say: "The cheapest grader. The exact phrase from the bad transcript becomes a forbidden string." },
          { sql: "\"mustCite\": \"hygiene-items-and-mattresses\",", say: "A code check on the returned sources: the right article must be among the citations." },
          { sql: "\"rubric\": \"The answer must state that opened mattresses cannot be returned, kindly, without implying an exception exists.\"", say: "The judgement part, written so a person and a model grader would agree." },
          { sql: "\"expectDecline\": true,", say: "A case for what must not happen: here the system must say the help centre does not cover it." },
        ],
        note: "Fifty cases like these cover the help chat; the email tagger has its own file with expected tags.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The runner is an ordinary test file: it runs every case, applies the code checks, calls the model grader with a rubric and structured output, and fails if a category's pass rate falls below the stored baseline.",
    title: "The eval runner, in vitest",
    text: "The runner lives with the other tests but runs on its own command, because it costs money and takes minutes. It calls the real answer function, applies cheap checks first, then the model grader only where a rubric exists. Results are written to a report and compared with the baseline file; the test fails on a drop beyond tolerance.",
    codes: [
      {
        title: "evals/help-chat.eval.ts",
        lang: "ts",
        src: `import cases from "./help-chat.cases.json";
import baseline from "./help-chat.baseline.json";

const Verdict = z.object({ pass: z.boolean(), reason: z.string().max(200) });

async function grade(c: Case, out: { answer: string; sources: { slug: string }[] }) {
  const a = out.answer.toLowerCase();
  const failures: string[] = [];
  for (const s of c.mustInclude ?? []) if (!a.includes(s.toLowerCase())) failures.push("missing: " + s);
  for (const s of c.mustNotInclude ?? []) if (a.includes(s.toLowerCase())) failures.push("forbidden: " + s);
  if (c.mustCite && !out.sources.some((s) => s.slug === c.mustCite)) failures.push("not cited: " + c.mustCite);
  if (c.expectDecline !== undefined && isDecline(out) !== c.expectDecline) failures.push("decline mismatch");
  if (failures.length === 0 && c.rubric) {
    const judged = await judge(c.rubric, c.input.question, out.answer);
    if (!judged.pass) failures.push("rubric: " + judged.reason);
  }
  return failures;
}

async function judge(rubric: string, question: string, answer: string) {
  const reply = await client.messages.create({
    model: process.env.MODEL_JUDGE!,
    max_tokens: 200,
    temperature: 0,
    system: "You grade customer support answers strictly against a rubric. Output pass only if every requirement is met.",
    tools: [verdictTool],
    tool_choice: { type: "tool", name: "verdict" },
    messages: [{ role: "user", content: "<rubric>" + rubric + "</rubric>\\n<question>" + question + "</question>\\n<answer>" + answer + "</answer>" }],
  });
  return Verdict.parse(reply.content.find((b) => b.type === "tool_use")?.input);
}

describe("help chat evals", () => {
  const results: Record<string, { pass: number; total: number; failures: string[] }> = {};

  it.each(cases)("$id", async (c) => {
    const out = await answerFromHelp(c.input.question, c.input.audience);
    const failures = await grade(c, out);
    const cat = (results[c.category] ??= { pass: 0, total: 0, failures: [] });
    cat.total += 1;
    if (failures.length === 0) cat.pass += 1;
    else cat.failures.push(c.id + ": " + failures.join("; "));
  });

  afterAll(() => {
    for (const [cat, r] of Object.entries(results)) {
      const rate = r.pass / r.total;
      const floor = (baseline[cat] ?? 0) - 0.03;
      expect(rate, cat + " pass rate " + rate.toFixed(2) + " below baseline\\n" + r.failures.join("\\n")).toBeGreaterThanOrEqual(floor);
    }
    writeReport(results);
  });
});`,
        lines: [
          { sql: "for (const s of c.mustNotInclude ?? []) if (a.includes(s.toLowerCase())) failures.push(\"forbidden: \" + s);", say: "Code checks first. They are free and catch the Tuesday regression on their own." },
          { sql: "if (failures.length === 0 && c.rubric) {", say: "The model grader runs only when the cheap checks pass and a rubric exists. Money is spent on judgement, not on string matching." },
          { sql: "model: process.env.MODEL_JUDGE!,", say: "A separate, pinned model for grading. Changing the judge changes the scores, so it changes rarely." },
          { sql: "system: \"You grade customer support answers strictly against a rubric. Output pass only if every requirement is met.\",", say: "Strict by instruction; structured output (lesson 2.3) gives a boolean and a reason, never prose to parse." },
          { sql: "it.each(cases)(\"$id\", async (c) => {", say: "One test per case, so the report names exactly which case failed." },
          { sql: "const floor = (baseline[cat] ?? 0) - 0.03;", say: "Three points of tolerance for sampling noise. Below that, the build fails like any other test." },
          { sql: "expect(rate, cat + \" pass rate \" + rate.toFixed(2) + \" below baseline\\n\" + r.failures.join(\"\\n\")).toBeGreaterThanOrEqual(floor);", say: "The failure message lists the failing cases and why, so Priya sees which answers her edit broke." },
        ],
        note: "Run with `npm run evals` before merging a prompt change; the baseline file is updated deliberately when a better run is accepted.",
      },
    ],
  },
  {
    stage: "implement",
    point: "A suite is only as good as its cases and its graders: keep cases real and growing, calibrate model graders against people, run flaky cases several times, and separate 'is it correct' from 'is it better'.",
    title: "Keeping the suite honest",
    text: "Four habits make the difference between an eval that catches regressions and one that passes while customers complain.\n\nCases come from production. Every bad transcript Nisha finds becomes a case the same day, with the forbidden phrase from the transcript. Cases are also written for what must not happen, and a few are deliberately out of scope so declines are tested too.\n\nGraders are calibrated. Before trusting the rubric judge, Nisha grades twenty answers by hand; if the judge disagrees with her more than twice, the rubric is rewritten until they agree. A judge nobody checked is a random number generator with a confident voice.\n\nFlaky cases are run three times and counted as passed only if all three pass, because a customer gets one answer, not the best of three.\n\nCorrect and better are different questions. The pass-rate suite answers 'did anything break?'. For 'is the warmer prompt actually nicer?', a pairwise run shows a judge the old and new answers to the same question in random order and asks which is better and why. Priya reads the reasons; the numbers alone would hide that 'warmer' sometimes meant 'wrong'.",
    table: {
      head: ["Habit", "Why"],
      rows: [
        ["every production failure becomes a case", "the suite grows toward real failures, not imagined ones"],
        ["cases for declines and forbidden content", "the worst failures are things that should never be said"],
        ["calibrate the judge against human grades", "a rubric the judge misreads measures nothing"],
        ["run flaky cases three times, all must pass", "customers see one sample"],
        ["pairwise runs for style changes", "pass rates cannot say which tone is better"],
        ["pin the judge model; change it deliberately", "a new judge shifts every score"],
      ],
    },
    ask: "Priya's warmer prompt now passes the suite at 97% but the pairwise run says the old answers were preferred 60% of the time, mostly 'the new ones are vague'. What do you tell her, and what case do you add?",
  },
  {
    stage: "compare",
    point: "Reading thirty random transcripts a week finds problems late and cannot say whether a change helped. A case file with cheap checks, a calibrated judge and a baseline turns every prompt edit into a measured, reversible change.",
    title: "Monday reading, or a suite in CI",
    text: "Two ways to know whether the chat box works. One costs Nisha two hours a week and misses most things; the other costs a few pounds a run and names the case that broke.",
    versus: {
      beginner: {
        title: "Spot checks and vibes",
        lang: "ts",
        code: "// Monday: Nisha reads 30 of 2,000 transcripts\n// Tuesday: Priya edits the prompt, it 'reads nicer', deploy\n// Day 12: a customer is refused at the door with the mattress",
        points: ["Needs no code.", "Finds the failure ten days late, if at all.", "Cannot compare two prompts or two models.", "Knowledge of what broke lives in one person's memory."],
      },
      engineer: {
        title: "Cases + graders + baseline, run before every change",
        lang: "ts",
        code: "npm run evals\n// returns: 48/50 (baseline 0.96)  ✓\n// coverage: 9/10 (baseline 0.90) ✓\n// tone (pairwise vs old): new preferred 38% — reasons attached",
        points: ["The Tuesday edit fails the returns category before deploy.", "Every production failure becomes a permanent case.", "Prompt and model changes are compared by number and by reason.", "Kabir's question has an answer: a trend line."],
      },
      tradeoffs: ["A run costs money and minutes; keep it off the per-commit path and on the prompt-change path.", "Model graders need calibration and a pinned judge; they are a test of the rubric as much as the answer.", "A suite that is never updated with new failures slowly measures the wrong things."],
      when: "Any model-backed feature that will be changed after launch: build the suite before the second prompt edit.",
    },
  },
  {
    stage: "recap",
    point: "Evals are unit tests for behaviour: real cases, cheap checks first, a calibrated model grader for judgement, pass rates per category against a baseline, every failure becoming a case.",
    title: "Connect it back: the mattress case, forever",
    text: "The warmer prompt would have failed the returns category on the day it was written: 'we'll sort it out' is a forbidden string in the mattress case, and the rubric judge, calibrated against Nisha, marks the softened answer as failing. Priya still ships tone changes, now with a pairwise report that says whether warmer meant better. Nisha's Monday reading is thirty minutes of adding cases instead of two hours of hunting. Kabir gets a chart.",
    recap: {
      remember: ["Model output varies; test properties and rates, not exact strings.", "Cases from production, including what must not happen and what must be declined.", "Graders: exact match, code checks, then a pinned, calibrated model judge with a rubric.", "Per-category pass rates against a baseline; regression fails the build.", "Pairwise runs for 'better', pass rates for 'broken'."],
      mistakes: ["Exact-match tests on prose.", "Trusting a model grader nobody calibrated.", "A suite of invented cases that never grows from real failures.", "Deploying prompt edits without running anything."],
      production: ["Support assistants, classifiers, extraction jobs, code generation, search quality: all have eval suites in mature teams.", "The retrieval recall and faithfulness checks from lessons 3.5 and 3.6 are two of the categories here.", "Lesson 3.8 supplies the production transcripts the cases come from; lesson 4.4 extends this to whole systems."],
      next: ["3.8 Tracing and feedback: debugging a bad answer.", "3.9 Cost and latency: caching, batching, routing.", "4.4 Testing systems that are never exactly the same."],
    },
    ask: "A customer complains that Thursday's answer was wrong. Dev cannot find which chunks were retrieved, which prompt version ran or what the model said, because none of it was recorded. Next lesson.",
  },
];

export const A19: Topic = {
  slug: "evals",
  title: "Evals: tests for things that are never exactly right",
  minutes: 18,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain why exact-match tests fail for model output and what to test instead.", "Build a case file from real failures, including declines and forbidden content.", "Write graders: code checks first, then a pinned, calibrated model judge with structured verdicts.", "Run evals per category against a baseline, fail on regression, and use pairwise runs for style changes."],
  prerequisites: ["structured-output", "what-models-get-wrong", "rag"],
  story: "A driving test, not a spelling test. Nobody checks that the driver turned the wheel exactly 23 degrees; the examiner checks properties: stopped at the line, checked the mirror, did not hit the cone. Fifty manoeuvres, scored, compared with last time.",
  tldr: [
    "Model output is sampled prose, so tests check **properties and pass rates**, not exact strings.",
    "An **eval** = **cases** (real, including must-nots and declines) + **graders** + a **runner** with a **baseline**.",
    "Graders in order of cost: **exact match**, **code checks**, a **pinned, calibrated model judge** with a rubric.",
    "Pass rates **per category** fail the build on regression; **pairwise** runs answer 'is it better?'.",
  ],
  words: [
    ["eval", "a set of cases with graders, run together and reported as pass rates"],
    ["case", "one input plus what must be true of the output"],
    ["grader", "the check for a case: match, code assertion, or model with a rubric"],
    ["rubric", "written criteria a model grader scores against"],
    ["baseline", "the last accepted run's numbers, used for comparison"],
    ["pairwise comparison", "a judge choosing between two answers to the same input"],
  ],
  sections: [],
  quiz: [
    { q: "Why not assert that the mattress answer equals a known-good string?", options: ["Strings are slow to compare", "Correct answers vary in wording; the test would fail good answers and catch nothing useful", "The model cannot produce strings", "It would work fine"], answer: 1, reason: true, whyOptions: ["Speed is irrelevant.", "Correct. Check properties (says unopened, cites the article, does not say yes) and rates across many cases.", "It produces nothing but strings.", "It fails on the next phrasing."], why: "Properties and rates, not exact text." },
    { q: "Which grader runs first, and why?", options: ["The model judge, it is most accurate", "Code checks, they are free and catch most regressions", "Human review", "Pairwise comparison"], answer: 1, whyOptions: ["Expensive and only needed for judgement.", "Correct. Forbidden strings and required citations catch the Tuesday regression at no cost.", "Humans calibrate graders; they do not run every case.", "Pairwise answers a different question."], why: "Cheap first; spend on judgement." },
    { q: "Before trusting a model grader with a rubric, what do you do?", options: ["Nothing; models are good at grading", "Compare its verdicts with a person's on a sample and fix the rubric until they agree", "Raise its temperature", "Use the same model that wrote the answers"], answer: 1, whyOptions: ["An uncalibrated judge measures nothing.", "Correct. Calibration turns a rubric into a measurement.", "Grading wants temperature 0.", "Independence matters; use a separate pinned judge."], why: "Calibrate, pin, then trust." },
  ],
  practice: [
    { q: "Write three cases for the email tagger.", answer: "{ id: 'damaged-sofa-photo', input: email about a torn sofa with photo mention, expect: { category: 'damaged', priority: 'urgent' } }; { id: 'ambiguous-greeting', input: 'Hi, just checking in', expect: { category: 'other' }, maxConfidence: 0.6 }; { id: 'payment-double-charge', input: email about being charged twice, expect: { category: 'payment', priority: 'urgent' } }. Grader: exact match on category and priority; confidence threshold check on the ambiguous one.", explain: "Structured output gets exact-match graders." },
    { q: "Design the pairwise run for a tone change.", answer: "For each of 40 real questions, generate answers with the old and new prompt. Show a pinned judge both in random order with the sources, ask which better satisfies 'accurate to the sources and warm', and require a one-sentence reason. Report the preference rate and group the reasons. Swap the order and re-run to check position bias. A person reads a sample of the reasons before deciding.", explain: "Random order, reasons, position check, human read." },
    { q: "A case passes two of three runs. Pass or fail, and what do you do?", answer: "Fail; a customer gets one sample. Investigate: usually the prompt is ambiguous or the retrieval is borderline for that question. Fix the cause (clarify the rule, add the right chunk, lower temperature for that path) and keep the case. Flakiness is a finding, not noise to ignore.", explain: "All runs must pass; flakiness points at a real weakness." },
  ],
  interview: [
    { level: "junior", q: "What is an eval?", a: "A test suite for a model-backed feature: a set of real input cases, each with checks on what the output must and must not contain or do, run together and reported as pass rates against a baseline. It replaces exact-match assertions, which do not work for sampled prose." },
    { level: "mid", q: "What kinds of graders do you use?", a: "Exact or set match for structured output; code checks for properties of prose (required and forbidden strings, citations, length, decline detection); a pinned model with a rubric returning a structured verdict for judgement; pairwise comparison for style changes; and a small human-graded sample to calibrate the model grader." },
    { level: "mid", tricky: true, q: "My LLM judge says 98% of answers are good. Can I trust that?", a: "Not until it is calibrated: grade twenty or thirty answers by hand and compare. Judges are lenient by default, biased toward longer answers and toward the first option in pairwise runs, and sensitive to rubric wording. Fix the rubric until human and judge agree, pin the judge model, and keep a human sample in every release." },
    { level: "senior", q: "How do you set up evals for a team that changes prompts often?", a: "A case file per feature, owned jointly by product and engineering, grown from production failures; cheap code graders plus a calibrated rubric judge; a runner that reports per-category pass rates and fails on a drop below baseline; a pairwise mode for tone changes; a command that runs before any prompt or model change merges; a dashboard of the trend. The baseline is updated deliberately when a better run is accepted." },
    { level: "mid", q: "Where do good eval cases come from?", a: "Production: bad transcripts, zero-result searches, misclassified emails, complaints. Add the forbidden phrase or the expected value from the real failure. Add cases for declines and for content that must never appear. Invented cases are a starting point only." },
    { level: "mid", tricky: true, q: "The eval passes at 97% but customers still complain. What is wrong?", a: "The cases do not cover what customers hit: the suite has stopped growing, or the graders are too lenient, or the production distribution shifted (new products, a new language). Pull recent complaints into cases, re-calibrate the judge, and sample live traffic into the suite regularly." },
    { level: "junior", q: "Why run evals per category instead of one overall score?", a: "A regression in one area (returns) can hide inside a stable total when other categories are large. Per-category rates localise the break and tell product which area their change affected." },
    { level: "senior", q: "How do evals, unit tests and monitoring relate?", a: "Unit tests check code deterministically on every commit. Evals check behaviour statistically on every prompt or model change, cost money and take minutes. Monitoring checks production continuously (feedback rates, decline rates, cost) and feeds new cases back into the evals. All three are needed; none replaces another." },
    { level: "mid", q: "How do you handle non-determinism in evals?", a: "Temperature 0 where the feature uses it; otherwise run flaky cases several times and require all to pass; use tolerance bands on pass rates (a few points) so sampling noise does not fail builds; treat persistent flakiness as a defect to fix in the prompt or retrieval." },
    { level: "mid", q: "What is a pairwise eval and when do you use it?", a: "Showing a judge two answers to the same input (old prompt vs new, model A vs B) in random order and asking which is better and why. Use it for style and quality changes where no pass/fail property exists. Check for position bias by swapping order, and read the reasons." },
  ],
  remember: [
    "Properties and pass rates, not exact strings.",
    "Real cases, including must-nots and declines; every failure becomes a case.",
    "Code checks first; a pinned, calibrated judge for judgement.",
    "Per-category baseline; regression fails the build; pairwise for 'better'.",
  ],
};
