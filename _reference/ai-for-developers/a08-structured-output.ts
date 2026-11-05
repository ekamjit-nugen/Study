import type { StoryPage, Topic } from "../types";

// AI 2.3: structured output: JSON your code can trust.

const SETTING = "The same online furniture shop. Besides the Help page chat box, Nisha wants every incoming support email tagged automatically with a category (returns, delivery, damaged, payment, other) and a priority (low, normal, urgent) so the dashboard can sort them. Dev's server already calls the model (lesson 2.1).";
const CAST = "**Nisha** (support lead) wants the tags on the dashboard. **Dev** (developer) has to turn the model's answer into data. **Priya** (product manager) will show the dashboard to the owner.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Dev asked the model to 'reply with the category and priority' and parsed the prose with regular expressions. The wording changed from email to email, the parser broke, and the dashboard filled with 'unknown'.",
    title: "The parser that broke on Tuesday",
    text: "Dev's first version asked the model: 'Read this email and tell me its category and priority.' The replies looked fine: 'This is a delivery question with normal priority.' Dev wrote a regular expression to pull out the two words.\n\nOn Tuesday the replies started saying 'I'd classify this as a delivery enquiry; I would consider the priority to be normal.' The regex found nothing. Other replies said 'Category: Delivery / Priority: Normal', with capitals and a slash. One said 'This seems urgent-ish'. By Wednesday half the dashboard said 'unknown'.\n\n**This is the problem.** The dashboard needs two fields with fixed values. The model produces prose, and prose varies. Parsing prose is a losing game; the model has to be made to return data.",
  },
  {
    stage: "why",
    point: "Free text is the model's natural output and it varies by design. Code needs fixed fields with fixed values. The fix is to ask for a specific shape and to check it before using it.",
    title: "Why prose cannot be parsed reliably",
    text: "Every answer is sampled text (lesson 1.1), so the same request produces different phrasings, and a prompt tweak or a model update changes them again. A parser written against last week's phrasing is a bet that nothing changes. It always loses.\n\nWhat code needs is a value from a known set: category is one of five strings, priority is one of three. Those are not sentences; they are fields. So the request has to say 'return exactly these fields in this shape', the model has to be held to it, and the code has to verify the shape before trusting it, because the model can still get it wrong.\n\nThree layers: describe the shape, make the model fill it, validate the result.",
  },
  {
    stage: "concept",
    point: "Structured output means asking for JSON that matches a schema. Providers can enforce the schema; your code validates it anyway; invalid answers are retried, never used.",
    title: "Schema, enforce, validate",
    text: "A **schema** describes the shape: which fields, which types, which allowed values. JSON Schema is the common language for it; libraries like Zod build the same thing in TypeScript and validate against it.\n\n**Enforcing.** Providers offer ways to make the model fill a schema rather than write prose: a JSON mode, a response-format option, or (with Anthropic) defining the schema as a tool the model must call, so its 'answer' is a filled-in object. The output is then valid JSON in the right shape almost always.\n\n**Validating.** 'Almost always' is not always. The code parses the JSON and checks it against the schema; a field with an unexpected value is rejected. The usual policy: retry once with the error message included, then fall back (tag as 'other, normal' and flag for a person).\n\nTwo more rules. Give enumerations, not free text, for anything the dashboard filters on. And include a confidence or 'unsure' option so the model has somewhere to put doubt instead of forcing a wrong label.",
    jargon: [["enum", "a field whose value must be one of a fixed list, e.g. priority ∈ {low, normal, urgent}; the model cannot invent 'urgent-ish'"], ["Zod", "a TypeScript library that defines a schema in code and validates data against it, giving typed results"]],
    table: {
      head: ["Layer", "What it does", "If skipped"],
      rows: [
        ["Schema", "defines fields, types, allowed values", "the model guesses a shape; every reply differs"],
        ["Enforce", "the provider makes the model fill the schema", "prose with JSON somewhere inside it, sometimes"],
        ["Validate", "your code checks the result against the schema", "one bad value corrupts the dashboard"],
        ["Retry / fallback", "re-ask once with the error; else a safe default", "a crash, or 'unknown' forever"],
      ],
    },
  },
  {
    stage: "visual",
    point: "The schema for Nisha's tags, as a tool the model must call. Four fields, two of them enums, one for doubt.",
    title: "The tag schema",
    text: "Dev writes the shape once. Category and priority are enums. A short reason field makes the output explainable on the dashboard. A confidence number gives the model a place to say it is unsure, which the code uses to route low-confidence emails to a person.",
    codes: [
      {
        title: "The schema, as a tool definition",
        lang: "ts",
        src: `const tagEmail = {\n  name: "tag_email",\n  description: "Classify one customer support email.",\n  input_schema: {\n    type: "object",\n    properties: {\n      category: { type: "string", enum: ["returns", "delivery", "damaged", "payment", "other"] },\n      priority: { type: "string", enum: ["low", "normal", "urgent"] },\n      reason: { type: "string", description: "One sentence explaining the choice." },\n      confidence: { type: "number", minimum: 0, maximum: 1 },\n    },\n    required: ["category", "priority", "reason", "confidence"],\n    additionalProperties: false,\n  },\n} as const;`,
        lines: [
          { sql: "name: \"tag_email\",", say: "The model 'calls' this to answer; the call's arguments are the data you want." },
          { sql: "category: { type: \"string\", enum: [\"returns\", \"delivery\", \"damaged\", \"payment\", \"other\"] },", say: "Five allowed values and nothing else. 'other' is the escape hatch so the model never has to invent a category." },
          { sql: "priority: { type: \"string\", enum: [\"low\", \"normal\", \"urgent\"] },", say: "Three values. No 'urgent-ish'." },
          { sql: "confidence: { type: \"number\", minimum: 0, maximum: 1 },", say: "A place for doubt. Low confidence sends the email to a person instead of a wrong tag." },
          { sql: "required: [\"category\", \"priority\", \"reason\", \"confidence\"],", say: "All four must be present; a missing field is invalid, not 'null'." },
        ],
        note: "The same JSON Schema works with other providers' JSON modes; only the wrapper differs.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The call forces the model to use the tool, the result is read from the tool-use block, and Zod validates it before anything touches the dashboard.",
    title: "Ask, enforce, validate, retry",
    text: "Dev sends the email with the tool defined and tells the model it must call that tool. The reply contains a tool-use block whose input is the filled object. Zod checks it; on failure the code asks once more with the validation error, then falls back.",
    codes: [
      {
        title: "tagEmail(): data in, data out",
        lang: "ts",
        src: `import { z } from "zod";\n\nconst Tag = z.object({\n  category: z.enum(["returns", "delivery", "damaged", "payment", "other"]),\n  priority: z.enum(["low", "normal", "urgent"]),\n  reason: z.string().max(200),\n  confidence: z.number().min(0).max(1),\n});\ntype Tag = z.infer<typeof Tag>;\n\nexport async function tagEmailText(email: string, attempt = 1): Promise<Tag> {\n  const reply = await client.messages.create({\n    model: process.env.MODEL_CLASSIFY!,\n    max_tokens: 200,\n    temperature: 0,\n    system: "You classify support emails for a furniture shop. Use 'other' when unsure and set confidence accordingly.",\n    tools: [tagEmail],\n    tool_choice: { type: "tool", name: "tag_email" },\n    messages: [{ role: "user", content: \`<email>\\n\${email.slice(0, 4000)}\\n</email>\` }],\n  });\n\n  const block = reply.content.find((b) => b.type === "tool_use");\n  const parsed = Tag.safeParse(block?.input);\n  if (parsed.success) return parsed.data;\n\n  if (attempt === 1) return tagEmailText(email + "\\n\\n(Previous answer was invalid: " + parsed.error.message + ")", 2);\n  return { category: "other", priority: "normal", reason: "could not classify", confidence: 0 };\n}`,
        lines: [
          { sql: "const Tag = z.object({", say: "The same shape as the tool schema, in Zod, so the validated result is a typed object." },
          { sql: "temperature: 0,", say: "Classification wants the most likely label, consistently (lesson 2.4)." },
          { sql: "tools: [tagEmail],", say: "The schema goes to the model as a tool it can fill in." },
          { sql: "tool_choice: { type: \"tool\", name: \"tag_email\" },", say: "Not optional: the model must answer by calling this tool. No prose." },
          { sql: "const block = reply.content.find((b) => b.type === \"tool_use\");", say: "The answer is the tool-use block's input, already parsed JSON." },
          { sql: "const parsed = Tag.safeParse(block?.input);", say: "Validate anyway. Enforcement is 'almost always'; this is 'always'." },
          { sql: "if (attempt === 1) return tagEmailText(email + \"\\n\\n(Previous answer was invalid: \" + parsed.error.message + \")\", 2);", say: "One retry with the error shown. Models fix a named mistake well." },
          { sql: "return { category: \"other\", priority: \"normal\", reason: \"could not classify\", confidence: 0 };", say: "The fallback: a safe default with confidence 0, which the dashboard routes to a person." },
        ],
        note: "Low confidence, say under 0.6, goes to Nisha's team. The dashboard never shows a guess as a fact.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Structured output is the right tool whenever code consumes the answer: extraction, classification, routing, form filling. It is the wrong tool for the customer-facing reply itself.",
    title: "Where else this applies, and where it does not",
    text: "Once the pattern exists, Dev finds uses everywhere: pulling the order number and the problem out of a free-text complaint; extracting delivery address fields from a pasted email; deciding which of five internal tools should handle a request (lesson 3.1 builds on exactly this); producing a product description with fixed fields for the catalogue.\n\nWhere not to use it: the customer's reply in the chat box. That is prose for a human, and forcing it into fields makes it stilted. The rule: if code reads it, structure it; if a person reads it, write it.",
    table: {
      head: ["Task", "Structured?", "Fields"],
      rows: [
        ["Tag an email for the dashboard", "yes", "category (enum), priority (enum), confidence"],
        ["Extract an address from a pasted email", "yes", "name, line1, city, postcode, country, missing[]"],
        ["Pick which internal action handles a request", "yes", "action (enum), arguments"],
        ["Write the reply the customer reads", "no", "prose, formatted by the prompt (lesson 2.2)"],
        ["Summarise a ticket for Nisha", "partly", "summary (string) plus next_step (enum)"],
      ],
    },
    ask: "An address extractor returns a postcode for an email that had none. Which schema feature would have let the model say 'missing' instead of inventing one?",
  },
  {
    stage: "compare",
    point: "Regex over prose works until the wording moves. Schema plus enforcement plus validation plus a fallback works when the wording moves, because wording is no longer involved.",
    title: "Parse the prose, or demand the shape",
    text: "Two ways to get tags out of a model. The first reads sentences; the second reads fields.",
    versus: {
      beginner: {
        title: "Ask in prose, parse with regex",
        lang: "ts",
        code: "const text = reply.content[0].text;   // \"This is a delivery question with normal priority.\"\nconst category = /(returns|delivery|damaged|payment)/i.exec(text)?.[1] ?? \"unknown\";\nconst priority = /(low|normal|urgent)/i.exec(text)?.[1] ?? \"unknown\";",
        points: ["Works on the first ten replies.", "Breaks when phrasing, capitalisation or order changes.", "'I would not call this urgent' matches 'urgent'.", "No place for the model to express doubt; every email gets a confident wrong tag or 'unknown'."],
      },
      engineer: {
        title: "Schema, forced tool call, validation, retry, fallback",
        lang: "ts",
        code: "tools: [tagEmail], tool_choice: { type: \"tool\", name: \"tag_email\" }\n…\nconst parsed = Tag.safeParse(block?.input);\nif (!parsed.success) retryOnceThenFallback();\nif (parsed.data.confidence < 0.6) routeToPerson();",
        points: ["Enums make invalid values impossible to store.", "Validation catches the rare malformed reply before it reaches the dashboard.", "Confidence lets doubt become a human review instead of a wrong tag.", "The same pattern serves extraction, routing and tool calling."],
      },
      tradeoffs: ["Schemas take design: too strict and the model fights it, too loose and the dashboard fills with 'other'.", "A forced tool call still needs the email delimited and the prompt to define each category; the schema does not explain the business.", "Retries cost a second call; keep them to one and measure how often they happen."],
      when: "Any time code reads the model's answer: structure it. When a person reads it: prose, shaped by the prompt.",
    },
  },
  {
    stage: "recap",
    point: "If code reads it, make it data: a schema with enums, enforced by the provider, validated by you, retried once, with a fallback and a confidence field.",
    title: "Connect it back: the dashboard without 'unknown'",
    text: "The parser broke because it bet on wording, and wording is sampled. Nisha's tags are now a schema with five categories and three priorities, filled by a forced tool call, validated by Zod, retried once on error and defaulted to 'other, normal, confidence 0' otherwise. Low-confidence emails go to a person. The dashboard shows only values that were allowed by the schema, and 'unknown' is gone.",
    recap: {
      remember: ["Code needs fields; the model writes prose. Ask for a schema.", "Enums for anything you filter on; a confidence or 'missing' field for doubt.", "Enforce with the provider (tool call, JSON mode); validate with Zod anyway.", "Retry once with the error, then fall back to a safe default."],
      mistakes: ["Parsing prose with regular expressions.", "Schemas with free-text fields where enums were needed.", "Trusting the output without validation because 'JSON mode never fails'.", "No fallback, so one malformed reply breaks the job."],
      production: ["Email triage, ticket routing, address and invoice extraction, catalogue enrichment, content moderation labels.", "Tool calling (lesson 3.1) is this pattern: the model fills a schema and your code acts on it.", "Confidence thresholds are how teams decide what needs a human."],
      next: ["2.4 Temperature, top-p, max tokens and stop sequences.", "3.1 Tool calling: the model asks, your code acts.", "3.7 Evals: measuring tag accuracy against Nisha's labels."],
    },
    ask: "Priya now wants two things from one model: steady classifications and lively marketing copy. The same settings cannot give both. Next lesson.",
  },
];

export const A08: Topic = {
  slug: "structured-output",
  title: "Structured output: JSON your code can trust",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain why prose cannot be parsed reliably and what to ask for instead.", "Define a schema with enums and a confidence field and get the model to fill it.", "Validate every structured reply, retry once with the error, and fall back safely.", "Decide when an answer should be data and when it should be prose."],
  prerequisites: ["first-api-call", "prompting-that-works"],
  story: "A form instead of a letter. Ask a colleague 'what do you think of this email?' and you get a paragraph; hand them a form with two drop-downs and a confidence slider and you get something a spreadsheet can read, every time.",
  tldr: [
    "If **code** reads the answer, ask for **data**: JSON matching a **schema**, not prose.",
    "Use **enums** for anything you filter on, and a **confidence** or 'missing' field for doubt.",
    "**Enforce** with the provider (forced tool call or JSON mode), then **validate** with Zod anyway.",
    "**Retry once** with the error; then a safe **fallback** that routes to a person.",
  ],
  words: [
    ["schema", "a description of the data shape: fields, types, allowed values"],
    ["JSON Schema", "the common format for describing JSON shapes"],
    ["enum", "a field limited to a fixed list of values"],
    ["tool_choice", "forcing the model to answer by filling a named tool's schema"],
    ["Zod", "a TypeScript schema and validation library"],
    ["fallback", "the safe default used when the model's answer is invalid"],
  ],
  sections: [],
  quiz: [
    { q: "The model's reply is 'I'd say this is a delivery enquiry, priority normal.' Your regex expects 'category: delivery'. What is the real fix?", options: ["A better regex", "Ask for JSON matching a schema and validate it", "Lower the temperature", "Add 'be consistent' to the prompt"], answer: 1, reason: true, whyOptions: ["The next phrasing will break the better regex too.", "Correct. Fields, not sentences: the wording stops mattering.", "Temperature 0 helps consistency but still produces prose.", "The model cannot keep a promise about phrasing across calls."], why: "Make the output data, then validate it." },
    { q: "Why validate with Zod when the provider enforces the schema?", options: ["Zod is faster", "Enforcement is almost always, not always; validation makes it always", "Zod adds fields", "You do not need to"], answer: 1, whyOptions: ["Speed is irrelevant here.", "Correct. A rare malformed or out-of-range value must be caught before it reaches your data.", "Validation checks; it does not add.", "Skipping validation is how one bad reply corrupts a dashboard."], why: "Enforce, then verify." },
    { q: "Which field lets the model avoid a wrong label when an email is ambiguous?", options: ["reason", "priority", "confidence (or an 'other' enum value)", "max_tokens"], answer: 2, whyOptions: ["Reason explains; it does not express doubt.", "Priority is one of the labels.", "Correct. Confidence, or an explicit 'other'/'unsure' value, gives doubt somewhere to go so it can be routed to a person.", "max_tokens is a length cap."], why: "Design the schema so doubt has a place." },
  ],
  practice: [
    { q: "Design the schema for extracting a delivery address from a pasted email, including how the model signals missing parts.", answer: "object { name, line1, line2?, city, postcode, country (enum or ISO code), missing: array of enum[name, line1, city, postcode, country] }, with required fields and additionalProperties false; 'missing' lets the model list what the email did not contain instead of inventing it.", explain: "A place for 'not there' prevents invented postcodes." },
    { q: "Your tagging job runs on 10,000 emails a night. What do you log and what thresholds do you set?", answer: "Log per email: the tag, confidence, tokens, whether a retry happened, whether validation failed. Thresholds: confidence under 0.6 goes to a person; retry rate over 2% or validation failures over 0.5% raise an alert because the prompt, schema or model has changed.", explain: "Structured output is measurable; measure it." },
    { q: "A colleague wants the customer-facing chat reply returned as JSON with fields 'greeting', 'answer', 'closing'. Good idea?", answer: "No. A person reads that reply; forcing it into fields produces stilted text and the fields add nothing the prompt's format rules do not. Keep the reply as prose; structure only what code consumes (for example a separate 'needs_human: boolean' field alongside it is fine).", explain: "Code reads it: structure. Person reads it: prose." },
  ],
  interview: [
    { level: "junior", q: "What is structured output and when do you use it?", a: "Asking the model to answer in a defined data shape, usually JSON matching a schema, instead of prose. Use it whenever code consumes the answer: classification, extraction, routing, form filling. Keep prose for text a person reads." },
    { level: "mid", q: "How do you make a model return valid JSON?", a: "Three layers: describe the shape as a JSON schema with enums and required fields; make the provider enforce it (a forced tool call, JSON mode or response_format); then validate the result in code with a library like Zod, retry once with the validation error, and fall back to a safe default. The last layer is what makes it reliable." },
    { level: "mid", tricky: true, q: "JSON mode guarantees valid JSON, so I can skip validation?", a: "Valid JSON is not the same as the right shape or the right values: a field can be missing, a number out of range, an enum misspelled, or the content wrong. Validation against your schema is cheap and turns 'almost always' into 'always', with a retry and fallback for the rest." },
    { level: "mid", q: "Why use enums rather than free text for labels?", a: "Enums make invalid values impossible to store and make dashboards and filters reliable; the model cannot produce 'urgent-ish'. Include an 'other' or 'unsure' value so the model is never forced into a wrong label, and a confidence field so doubt can be routed to a person." },
    { level: "senior", q: "Design a robust extraction pipeline for invoices arriving as emails.", a: "A schema with the fields the finance system needs, enums for currency and status, a 'missing' array, and confidence per field or overall. Delimit the email, force the tool call at temperature 0, validate with Zod, retry once with the error, fall back to a review queue. Log tokens, retries and validation failures; evaluate accuracy against a labelled set weekly; sample low-confidence items to a person." },
    { level: "mid", tricky: true, q: "The model returns a perfectly valid object with the wrong category 20% of the time. Is structured output failing?", a: "No; the shape is right and the content is wrong, which is a prompt, examples or model problem, not a format problem. Improve the category definitions and add few-shot examples per category, lower the confidence threshold for human review, and measure against labelled data. Structured output guarantees the shape, never the judgement." },
    { level: "junior", q: "What is a confidence field for?", a: "A place for the model to express doubt so your code can act on it: route low-confidence items to a person, show them differently, or ask a follow-up. Without it, every answer looks equally sure." },
    { level: "senior", q: "How does structured output relate to tool calling?", a: "They are the same mechanism. A tool definition is a schema; when the model 'calls' a tool it fills that schema; your code validates and acts. Forcing a single tool gives structured output; offering several tools and letting the model choose gives tool calling (lesson 3.1)." },
    { level: "mid", q: "What do you do when the model returns invalid data?", a: "Never use it. Retry once, including the validation error so the model can correct the specific mistake; if it fails again, fall back to a safe default that is visibly marked (confidence 0, 'needs review'), log the failure, and alert if the failure rate rises, because that signals a prompt or model change." },
    { level: "mid", q: "Should the customer-facing reply be structured?", a: "The reply itself should be prose shaped by the prompt's format rules; people read it. It is fine to return prose plus a small structured envelope for code, such as needs_human or a category, as separate fields." },
  ],
  remember: [
    "Code reads it → schema. Person reads it → prose.",
    "Enums for labels; a confidence or 'missing' field for doubt.",
    "Enforce with the provider; validate with Zod anyway.",
    "Retry once with the error; then a safe, visible fallback.",
  ],
};
