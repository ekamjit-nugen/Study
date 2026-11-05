import type { Exercise, LessonBody, Quiz } from "../types";

// Module 27: Structured outputs and tool calling. One concept per lesson.

export const M27_BODIES: Record<string, LessonBody> = {
  "m27-structured-outputs": {
    simple: "Structured output means asking the model for data in a fixed shape, usually JSON matching a schema, so code can read it instead of parsing prose.",
    concept:
      "When a person reads the model's answer, prose is right. When code reads it, prose is a trap: the wording varies between calls and a parser written against one phrasing breaks on the next. **Structured output** asks the model to answer as data: named fields with fixed types and, where possible, fixed allowed values, in a shape you describe up front.\n\nThree layers make it reliable. Describe the shape (a schema: field names, types, allowed values, which are required). Make the model fill that shape rather than write freely (providers offer JSON modes or, more robustly, a forced tool call whose arguments are the data). Validate the result in code before using it, because 'almost always valid' is not 'always'.\n\nStructured output is the mechanism behind classification, extraction, routing, form filling and tool calling. The rest of this module is its parts and its uses.",
    why:
      "Every pipeline that puts a model's answer into a database, a dashboard or another function needs a value, not a sentence. 'This looks like a delivery question of normal priority' is unusable to code; { category: 'delivery', priority: 'normal' } is a row. Without structure, teams write regular expressions against prose, and those break the day the model phrases things differently. Structure removes wording from the problem entirely, and a validated shape means one malformed answer cannot corrupt a thousand rows.",
    how: [
      "Decide the fields code needs and their types; use enumerations for anything you filter or branch on.",
      "Write the shape as a JSON Schema (or a Zod schema that generates one).",
      "Send the schema with the request as a tool the model must call, or through the provider's JSON mode.",
      "Parse the returned object and validate it against the same schema.",
      "On failure, retry once with the validation error in the prompt; then fall back to a safe default and flag for a person.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Prose, parsed by regex", points: ["'I would classify this as a delivery enquiry, normal priority.'", "Regex finds 'delivery' and 'normal'… until the wording changes", "'not urgent' matches 'urgent'", "No way to express doubt"] },
      right: { title: "Structured, validated", points: ["{ category: 'delivery', priority: 'normal', confidence: 0.86 }", "Enumerations make invalid values impossible", "Validation rejects a malformed answer before it is stored", "A confidence field routes doubt to a person"] },
      caption: "Same question, same model. Only the shape of the answer changed, and with it the reliability.",
    },
    everyday: {
      title: "A form instead of a letter",
      text: "Ask a colleague 'what do you think of this application?' and you get a paragraph. Give them a form with three drop-downs and a comment box and you get something a spreadsheet can total, every time, from every colleague. Structured output hands the model a form.",
    },
    engineering: {
      title: "Support email tagging for a dashboard",
      text: "A support team wants every incoming email tagged with a category and a priority so the dashboard can sort them. The first version asked the model to 'say the category and priority' and parsed the sentence; within a week half the dashboard said unknown. The rewrite defines a schema with two enumerations and a confidence number, forces the model to fill it, validates with a library, retries once on failure and defaults to 'other, normal, confidence 0' otherwise. Low-confidence emails go to a person. The dashboard has shown only valid values since.",
    },
    code: {
      title: "Shape, enforce, validate",
      lang: "ts",
      src: `import { z } from "zod";

const Tag = z.object({
  category: z.enum(["returns", "delivery", "damaged", "payment", "other"]),
  priority: z.enum(["low", "normal", "urgent"]),
  confidence: z.number().min(0).max(1),
});

const tagTool = {
  name: "tag_email",
  description: "Classify one support email.",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ["returns", "delivery", "damaged", "payment", "other"] },
      priority: { type: "string", enum: ["low", "normal", "urgent"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["category", "priority", "confidence"],
    additionalProperties: false,
  },
} as const;

const reply = await client.messages.create({
  model: process.env.MODEL_SMALL!, max_tokens: 100, temperature: 0,
  system: "You classify support emails. Use 'other' when unsure and set confidence accordingly.",
  tools: [tagTool], tool_choice: { type: "tool", name: "tag_email" },
  messages: [{ role: "user", content: "<email>" + emailText + "</email>" }],
});
const parsed = Tag.safeParse(reply.content.find((b) => b.type === "tool_use")?.input);
const tag = parsed.success ? parsed.data : { category: "other", priority: "normal", confidence: 0 };`,
      lines: [
        { code: "category: z.enum([\"returns\", \"delivery\", \"damaged\", \"payment\", \"other\"]),", say: "The shape in code: five allowed values, with 'other' as the escape hatch." },
        { code: "tools: [tagTool], tool_choice: { type: \"tool\", name: \"tag_email\" },", say: "Enforcement: the model must answer by filling this tool's schema, not with prose." },
        { code: "const parsed = Tag.safeParse(reply.content.find((b) => b.type === \"tool_use\")?.input);", say: "Validation: the returned object is checked against the schema before anything trusts it." },
        { code: "const tag = parsed.success ? parsed.data : { category: \"other\", priority: \"normal\", confidence: 0 };", say: "A safe default with confidence zero, which the dashboard routes to a person." },
      ],
    },
    useIt: "Whenever code consumes a model's answer, structure it: classification, extraction, routing, form filling, decisions. Keep prose for text a person reads. Describe the shape, force it, validate it, retry once, fall back visibly.",
    takeaways: ["Code reads it: structure it. A person reads it: prose.", "Three layers: schema, enforcement, validation; plus retry and fallback.", "Enumerations for anything you filter on; a confidence or 'other' for doubt.", "One malformed answer must never reach the data."],
    terms: [["structured output", "a model answer in a fixed data shape rather than prose"], ["schema", "a description of the data shape: fields, types, allowed values"], ["validation", "checking a returned object against the schema in code"], ["fallback", "the safe default used when the answer is invalid"]],
    reflect: { q: "The customer-facing reply itself: should it be structured?", a: "No. A person reads it, so it should be prose shaped by the prompt's format rules. Structure a small envelope around it if code needs flags, such as needs_human, as separate fields." },
  },

  "m27-json-responses": {
    simple: "JSON is the usual format for structured answers: text that encodes objects, lists, strings, numbers and booleans, which every language can parse.",
    concept:
      "**JSON** (JavaScript Object Notation) is the text format almost all structured output uses. An object is a set of named fields in braces; a list is values in square brackets; values are strings in double quotes, numbers, true, false or null. It is readable by people and parsed natively by every programming language.\n\nA model can write JSON because it has seen enormous amounts of it, but it writes it as text, token by token, and text can go wrong: a trailing comma, a comment, a stray explanation before the opening brace, a string with an unescaped quote. So a **JSON response** needs the same discipline as any text: ask for JSON only, with no surrounding prose; parse it; and treat a parse failure as an invalid answer, not a crash.\n\nProviders' JSON modes and tool calls reduce the failure rate dramatically by constraining generation to valid JSON. Your parser still runs, because the shape and the values can be wrong even when the syntax is right.",
    why:
      "Code needs a format it can parse without guessing, and JSON is the one every stack already handles. Asking a model for JSON turns its answer into something a database column, an API response or a function argument can take directly. But JSON written freely by a model is text with a syntax, and syntax errors on one answer in two hundred are enough to break a nightly job. That is why JSON responses are requested, constrained and parsed defensively rather than trusted.",
    how: [
      "Say exactly what JSON to produce: field names, types, an example object, and 'output only the JSON, no explanation'.",
      "Prefer a constrained mode (JSON mode or a forced tool) over free text.",
      "Parse with the language's JSON parser inside a try block.",
      "If parsing fails, try a tolerant recovery (strip text before the first brace and after the last), then validate; if still bad, retry once.",
      "Never apply a regex to JSON text; parse it to an object and read fields.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Model output", "Problem", "Caught by"],
        rows: [
          ["Here is the JSON: { … }", "prose before the brace", "strip-then-parse recovery, or JSON mode"],
          ["{ \"total\": 1,200.50 }", "a thousands separator makes the number invalid", "parse failure → retry with the error"],
          ["{ \"date\": \"next Friday\" }", "valid JSON, wrong type of value", "schema validation, not the parser"],
          ["{ \"status\": \"approved\", }", "trailing comma", "parse failure → retry; JSON mode prevents it"],
        ],
      },
      caption: "The parser catches syntax; the schema catches meaning. Both run.",
    },
    everyday: {
      title: "A delivery label versus a note on the box",
      text: "'To Sam, the flat above the bakery, second bell' is a note a courier might decode. A label with name, street, postcode in their boxes is JSON: a fixed layout every courier and every sorting machine reads the same way. Ask for the label, and check the postcode field actually holds a postcode.",
    },
    engineering: {
      title: "Meeting notes to action items",
      text: "A company tool turns meeting transcripts into a list of action items for a task tracker. The model is asked for a JSON array of objects with owner, action and due date. In the first week the job crashed twice: once on a trailing comma, once on an explanation the model added before the array. The fixes: a JSON-only instruction with an example, a strip-then-parse step, a retry with the parse error quoted, and a per-item validation that rejects objects without an owner. The job has not crashed since, and rejected items are shown to the meeting organiser for a quick manual fix.",
    },
    code: {
      title: "Parse defensively, then validate",
      lang: "ts",
      src: `function parseJsonAnswer(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{") >= 0 ? Math.min(...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0)) : -1;
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start < 0 || end <= start) throw new Error("no JSON found");
    return JSON.parse(text.slice(start, end + 1));      // recover from prose around the JSON
  }
}

const ActionItems = z.array(z.object({ owner: z.string().min(1), action: z.string().min(5), due: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).nullable() }));

const reply = await client.messages.create({
  model: process.env.MODEL_MID!, max_tokens: 800, temperature: 0,
  system: "Extract action items from the meeting transcript. Output ONLY a JSON array of objects {owner, action, due} where due is YYYY-MM-DD or null. No explanation, no markdown.",
  messages: [{ role: "user", content: "<transcript>" + transcript + "</transcript>" }],
});
const items = ActionItems.safeParse(parseJsonAnswer(textOf(reply)));`,
      lines: [
        { code: "return JSON.parse(text);", say: "The language's parser first. Never a regex over JSON." },
        { code: "return JSON.parse(text.slice(start, end + 1));      // recover from prose around the JSON", say: "If the model added words around the JSON, cut to the outermost braces or brackets and try again." },
        { code: "const ActionItems = z.array(z.object({ owner: z.string().min(1), action: z.string().min(5), due: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).nullable() }));", say: "Syntax is not enough: each item's fields are checked for meaning, such as a real date format." },
        { code: "system: \"Extract action items from the meeting transcript. Output ONLY a JSON array of objects {owner, action, due} where due is YYYY-MM-DD or null. No explanation, no markdown.\",", say: "The shape, an example of it, and the 'only JSON' rule, in the instruction." },
      ],
      note: "A forced tool call (next lessons) avoids the recovery step entirely; keep the validation regardless.",
    },
    useIt: "Request JSON for any answer code consumes; prefer constrained modes; parse with a real parser, recover from surrounding prose, validate the shape and values, retry once with the error, and fall back. This is the base layer that schemas and tool calls build on.",
    takeaways: ["JSON is the shared format for structured answers; the model writes it as text.", "Ask for JSON only; parse with the language's parser; recover from surrounding prose.", "Syntax validity is not shape validity; validate fields and values after parsing.", "Constrained modes cut failures; validation stays."],
    terms: [["JSON", "a text format for objects, lists, strings, numbers, booleans and null"], ["parse", "turning JSON text into an in-memory object"], ["JSON mode", "a provider option that constrains the model's output to valid JSON"]],
    reflect: { q: "The model returns valid JSON with the right fields but the total is the subtotal, not the grand total. Which layer catches it?", a: "None of the format layers: syntax and schema are both satisfied. This is a content error, caught by a business check (does the total equal the printed total?) or by evaluation on labelled invoices." },
  },

  "m27-json-schema": {
    simple: "JSON Schema is the standard language for describing a JSON shape: field names, types, allowed values, required fields. Providers use it to constrain output and validators use it to check output.",
    concept:
      "**JSON Schema** is a JSON document that describes other JSON documents. It says an object has these properties, each of this type, these ones required, this string must be one of these values (an enum), this number lies between these bounds, no extra properties allowed. It is the common language between you, the model provider and your validator.\n\nThe same schema does two jobs. Sent with the request as a tool's input schema or a response format, it tells the model exactly what to produce, and constrained generation keeps the output inside it. Used in your code with a validator, it checks what came back. Libraries such as Zod build the schema in TypeScript and give you both the JSON Schema to send and a typed validator to run.\n\nSchema design is where the reliability is decided: enumerations instead of free strings for anything branched on, a field for doubt, descriptions on fields the model might misread, and no optional field that should be required.",
    why:
      "'Return the category and priority' leaves the model to invent field names, spellings and values. A schema fixes all of them, so the model, the validator and the database agree on what a valid answer is. It also carries intent: descriptions tell the model what a field means, enumerations tell it what is allowed, required tells it what it may not skip. One artefact, written once, used by the request and the check.",
    how: [
      "List the fields code needs. For each: type, whether required, allowed values, bounds, and a one-line description.",
      "Replace free-text fields with enumerations wherever code branches on the value; add 'other' or 'unknown' as a value.",
      "Add a field for doubt: confidence, or a 'missing' list, so the model can say it is unsure.",
      "Set additionalProperties to false so stray fields are rejected.",
      "Generate the JSON Schema from your validator definition (Zod, Pydantic) so request and check never drift.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Schema feature", "Example", "What it prevents"],
        rows: [
          ["type", "\"type\": \"number\"", "a total returned as the string '1,200.50'"],
          ["enum", "\"enum\": [\"low\", \"normal\", \"urgent\"]", "'urgent-ish'"],
          ["required", "\"required\": [\"total\", \"currency\"]", "a missing field treated as absent rather than invalid"],
          ["minimum / maximum", "\"minimum\": 0, \"maximum\": 1", "confidence 7"],
          ["description", "\"description\": \"Legal name as printed, not the brand\"", "the brand name in the supplier field"],
          ["additionalProperties: false", "", "fields you did not ask for"],
        ],
      },
      caption: "Each feature closes a class of wrong answers before validation even runs.",
    },
    everyday: {
      title: "A tax form's instructions",
      text: "A tax form says: box 12, whole pounds only, leave blank if not applicable, choose one of the three categories printed. That is a schema in prose: types, bounds, required-ness and enumerations. The form works because the taxpayer and the computer that reads the form agree on the rules before anything is written.",
    },
    engineering: {
      title: "Invoice extraction with a shared schema",
      text: "A finance team's invoice extractor had drifted: the prompt asked for 'total', the validator checked 'amount', and the database column was 'grand_total'. The fix was one Zod schema: supplier_name (string, description 'legal name as printed'), invoice_date and due_date (ISO strings, nullable), total (number, minimum 0), currency (enum of ISO codes), missing (array of field names the invoice did not contain). The JSON Schema is generated from it for the request; the same object validates the response; the database mapping is written once against it. The three definitions cannot drift because there is only one.",
    },
    code: {
      title: "One definition, two uses",
      lang: "ts",
      src: `import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const Invoice = z.object({
  supplier_name: z.string().describe("Legal name as printed on the invoice, not the brand"),
  invoice_date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).nullable(),
  due_date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).nullable(),
  total: z.number().min(0).describe("Grand total including tax, as a plain number"),
  currency: z.enum(["GBP", "EUR", "USD"]),
  missing: z.array(z.enum(["supplier_name", "invoice_date", "due_date", "total", "currency"])).describe("Fields not present on the invoice"),
}).strict();

export const invoiceTool = {
  name: "record_invoice",
  description: "Record the fields extracted from ONE invoice.",
  input_schema: zodToJsonSchema(Invoice),           // the request side
} as const;

export function validateInvoice(input: unknown) {
  return Invoice.safeParse(input);                  // the response side
}`,
      lines: [
        { code: "supplier_name: z.string().describe(\"Legal name as printed on the invoice, not the brand\"),", say: "A description travels into the JSON Schema and tells the model what the field means." },
        { code: "currency: z.enum([\"GBP\", \"EUR\", \"USD\"]),", say: "An enumeration: the model cannot return '£' or 'pounds'." },
        { code: "missing: z.array(z.enum([\"supplier_name\", \"invoice_date\", \"due_date\", \"total\", \"currency\"])).describe(\"Fields not present on the invoice\"),", say: "A place for doubt: the model lists what was absent instead of inventing it." },
        { code: "}).strict();", say: "No extra properties. Stray fields are rejected." },
        { code: "input_schema: zodToJsonSchema(Invoice),           // the request side", say: "The JSON Schema for the request is generated from the same definition the validator uses." },
      ],
    },
    useIt: "Define every structured output as a schema in code, generate the JSON Schema from it for the request, validate the response with it, and map the database from it. Design with enumerations, required fields, descriptions and a field for doubt.",
    takeaways: ["JSON Schema describes shape: types, enums, required, bounds, descriptions, no extras.", "One definition serves the request (constrain) and the response (validate).", "Enumerations for branching values; a field for doubt; descriptions for ambiguous fields.", "Generate the schema from the validator so they cannot drift."],
    terms: [["JSON Schema", "a standard JSON document that describes the shape of JSON data"], ["enum (schema)", "a fixed list of allowed values for a field"], ["Zod", "a TypeScript library for defining schemas and validating data against them"], ["strict / additionalProperties false", "a schema rule rejecting fields not listed"]],
    reflect: { q: "Why make 'missing' an enum array rather than a free-text note?", a: "So code can act on it: a missing total routes to a person automatically; a note saying 'couldn't find the total' would need parsing. The doubt field is structured for the same reason the data fields are." },
  },

  "m27-constrained-generation": {
    simple: "Constrained generation makes the model produce only tokens that keep the output valid against a schema or grammar, so malformed JSON becomes nearly impossible.",
    concept:
      "Left alone, a model picks the next token from its whole vocabulary, and nothing stops it writing a comma where the JSON needs a brace. **Constrained generation** changes the picking: at each step, tokens that would make the output invalid under the schema or grammar are masked out, and the model chooses among the rest. The result is guaranteed to be syntactically valid and, for enumerations and types, structurally valid.\n\nProviders expose this as JSON mode, response formats with a schema, or forced tool calls whose arguments must match the tool's input schema. Open-weight serving stacks let you supply a grammar or a schema directly. The model still decides the content; the constraint only forbids impossible shapes.\n\nWhat constraints cannot do is make the content correct. A constrained model can return a perfectly valid object with the wrong category. Constraints remove a class of failure (malformed output); validation and evaluation handle the rest.",
    why:
      "Free-text JSON fails on a small share of calls, and at volume a small share is many failures: a job over ten thousand documents that breaks fifty times a night. Retries and recovery code help but cost time and money and still leak errors. Constraining the generation itself removes syntax failures almost entirely and makes enumerations impossible to violate, which is why forced tool calls are the standard way to get structured output from the major APIs.",
    how: [
      "Define the schema (previous lesson).",
      "Request constrained output: a forced tool call with the schema as input_schema, or the provider's structured response format.",
      "The provider masks invalid tokens at each step; the model fills the fields.",
      "Parse the returned object directly (no prose recovery needed) and validate it, because type-level constraints do not check meaning.",
      "Measure the remaining failures: they are content errors, fixed by prompt, examples or model choice.",
    ],
    visual: {
      kind: "flow",
      steps: ["schema", "model picks the next token", "constraint masks tokens that would break the schema", "valid JSON, field by field", "validation checks meaning", "content errors → prompt and evals"],
      caption: "The constraint sits inside generation. It guarantees shape, not truth.",
    },
    everyday: {
      title: "A form with drop-downs instead of text boxes",
      text: "A paper form lets you write 'urgent-ish' in the priority box. A web form with a drop-down does not; you can only pick one of the listed values. The drop-down is constrained generation: it cannot stop you choosing the wrong value, but it makes an impossible value impossible.",
    },
    engineering: {
      title: "Nightly classification of ten thousand product listings",
      text: "A marketplace classifies new listings into 400 categories every night. With free-text JSON, about 1% of outputs were malformed: a comment, a category name slightly misspelled, a missing quote. Fifty failures a night needed retries and sometimes manual fixes. Switching to a forced tool call with the category as an enumeration of the 400 codes brought malformed outputs to zero; every answer is a valid code. The remaining errors, about 3% of listings in the wrong category, are content errors, and the team works on them with examples and evals rather than parsers.",
    },
    code: {
      title: "Forcing the shape with a tool call",
      lang: "ts",
      src: `const classifyTool = {
  name: "classify_listing",
  description: "Assign ONE marketplace category code to the listing.",
  input_schema: {
    type: "object",
    properties: {
      category_code: { type: "string", enum: CATEGORY_CODES },       // 400 allowed codes
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["category_code", "confidence"],
    additionalProperties: false,
  },
} as const;

const reply = await client.messages.create({
  model: process.env.MODEL_SMALL!, max_tokens: 60, temperature: 0,
  system: "Classify the product listing into exactly one category.",
  tools: [classifyTool],
  tool_choice: { type: "tool", name: "classify_listing" },           // the model must call this tool
  messages: [{ role: "user", content: "<listing>" + listingText + "</listing>" }],
});
const block = reply.content.find((b) => b.type === "tool_use");
const result = Classification.parse(block?.input);                   // still validated: meaning, not just shape`,
      lines: [
        { code: "category_code: { type: \"string\", enum: CATEGORY_CODES },       // 400 allowed codes", say: "An enumeration of every valid code. A misspelled or invented code cannot be generated." },
        { code: "tool_choice: { type: \"tool\", name: \"classify_listing\" },           // the model must call this tool", say: "Forcing the tool means the answer is the tool's arguments, constrained to its schema. No prose." },
        { code: "const result = Classification.parse(block?.input);                   // still validated: meaning, not just shape", say: "Validation stays. The shape is guaranteed; the content is not." },
      ],
    },
    useIt: "Use a forced tool call or structured response format for every structured output in production; it removes malformed answers and enum violations. Keep validation for meaning, and spend your effort on content accuracy, which constraints cannot buy.",
    takeaways: ["Constrained generation masks invalid tokens so output always matches the schema's shape.", "Forced tool calls and structured response formats are how providers expose it.", "It guarantees syntax and enumerations, not correctness.", "Validation and evals remain for content."],
    terms: [["constrained generation", "generation where tokens that would break a schema or grammar are forbidden"], ["forced tool call", "requiring the model to answer by filling a named tool's schema"], ["grammar", "a formal description of allowed output, used by some serving stacks"]],
    reflect: { q: "With constraints, malformed outputs went to zero but the category accuracy did not change. Why?", a: "Constraints decide which outputs are possible, not which are right. The model chose a valid wrong code for the same reason it chose a wrong name before. Accuracy is a prompt, example and model problem." },
  },

  "m27-function-calling": {
    simple: "Function calling lets the model ask your code to run a function: it returns a request with the function name and arguments, your code runs it and sends the result back, and the model continues.",
    concept:
      "A model can only write text; it cannot query a database, call an API or send an email. **Function calling** (also called tool calling) gives it a way to ask. You describe functions it may request: a name, a description of what each does and when to use it, and a schema for its arguments. The model, instead of answering, can reply with a structured request: call lookup_order with order_id 4417. Your code runs the real function and sends the result back as a new message. The model reads the result and either answers or asks for another function.\n\nIt is structured output with a loop around it. The request is a schema-shaped object; the difference is that your code acts on it and the conversation continues. The model never executes anything; it only requests, and every request passes through your code, where it can be validated, scoped, logged and refused.\n\nThis is the mechanism behind assistants that check orders, book appointments, search documents or run calculations, and the foundation of agents in Stage 7.",
    why:
      "Without function calling, a model asked about an order it cannot see will make one up, because completing the sentence is all it can do. Pasting the whole database into the prompt is impossible, stale and unsafe. Function calling lets the model fetch exactly what a question needs, fresh, through code you control. It turns the model from a text generator into a coordinator of your existing functions, while keeping every action in your hands.",
    how: [
      "Define each function: name, a description written for the model, a JSON Schema for its arguments.",
      "Send the definitions with the request. The model may answer with text or with a tool-use block naming a function and arguments.",
      "If it requested a function: validate the arguments, run the function with identity from the session, build a tool-result message with the output.",
      "Send the history plus the result back; the model continues, possibly requesting another function.",
      "Cap the number of rounds; return the final text when the model stops requesting.",
    ],
    visual: {
      kind: "flow",
      steps: ["request with tool definitions", "model: tool_use { name: lookup_order, input: { order_id: 4417 } }", "your code validates, runs the real function", "tool_result message with the output", "model answers using the result (or asks again)"],
      caption: "The model asks; your code acts. The loop repeats until the model answers in text.",
    },
    everyday: {
      title: "A receptionist with a phone",
      text: "The receptionist cannot walk into the warehouse, but they can ring it and ask 'is order 4417 packed?' and relay the answer. Function calling is the phone. The warehouse (your code) decides what it is willing to say, and the receptionist never gets the keys.",
    },
    engineering: {
      title: "Order status in a retailer's chat",
      text: "A retailer's chat assistant was inventing delivery dates for orders it could not see. The team defined one function, lookup_order(order_id), returning status, items and an estimated date, scoped to the signed-in customer. Now when a customer asks about order 4417, the model requests the function, the server runs the query, and the model answers from the real record; for an order that does not exist, the function returns found: false and the model says so. A second function, list_recent_orders, handles 'my order' without a number. No date has been invented since, and every lookup is logged.",
    },
    code: {
      title: "The loop, in full",
      lang: "ts",
      src: `export async function answerWithTools(history: Message[], customerId: number): Promise<string> {
  const messages = [...history];
  for (let round = 0; round < 5; round++) {
    const reply = await client.messages.create({
      model: process.env.MODEL_MID!, max_tokens: 600,
      system: SUPPORT_SYSTEM,
      tools: [lookupOrder, listRecentOrders],
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
  return "I could not finish checking that. A person will follow up by email.";
}`,
      lines: [
        { code: "tools: [lookupOrder, listRecentOrders],", say: "The function definitions ride along with every request." },
        { code: "messages.push({ role: \"assistant\", content: reply.content });", say: "The model's reply, including its request, joins the history so it remembers what it asked." },
        { code: "if (reply.stop_reason !== \"tool_use\") {", say: "No request means the reply is the answer; return its text." },
        { code: "const out = await runTool(block.name, block.input, customerId);", say: "Your code runs the function, with the customer's identity from the session, never from the model." },
        { code: "results.push({ type: \"tool_result\", tool_use_id: block.id, content: JSON.stringify(out.data), is_error: out.error });", say: "The result is matched to the request by id; errors are marked so the model knows the call failed." },
        { code: "for (let round = 0; round < 5; round++) {", say: "At most five rounds. A model that keeps asking is stopped by code." },
      ],
    },
    useIt: "Use function calling whenever an answer depends on live data or an action: orders, bookings, stock, calculations, searches. Your code validates arguments, scopes by the session, runs the function, returns honest results and caps the loop. Agents (Stage 7) are this loop with planning and budgets.",
    takeaways: ["The model requests a function with structured arguments; your code runs it and returns the result; the model continues.", "The model never executes anything; every request passes through your code.", "Identity from the session, arguments validated, results honest, rounds capped.", "Structured output with a loop: the foundation of assistants and agents."],
    terms: [["function calling / tool calling", "the model requesting that your code run a described function"], ["tool-use block", "the model's structured request: function name and arguments"], ["tool result", "the message your code sends back with the function's output"]],
    reflect: { q: "If you add 'always check the database before answering' to the system prompt, will the model check it?", a: "No. The model can only write text; the instruction makes it write answers that sound checked. It needs a function it can request, and your code to run it." },
  },

  "m27-tool-definitions": {
    simple: "A tool definition is what the model sees of a function: its name, a description of what it does and when to use it, and a schema for its arguments. The description does most of the work.",
    concept:
      "The model never sees your code. It sees the **tool definition**: a name, a description and an input schema. From those alone it decides whether to call the function, which one, and with what arguments. So the definition is written for the model, not for a colleague reading the codebase.\n\nThe description is the key. A good one says what the function returns, when to call it, when not to, and what a 'not found' result looks like, in a few plain sentences. The schema uses the same craft as structured output: typed arguments, enumerations where values are fixed, descriptions on each argument, required fields, no extras.\n\nWhat is not in the definition matters too. Anything the model must not control, such as which customer's data to read, is not an argument; it comes from the session in code. The definition exposes exactly the choices the model is allowed to make and no others.",
    why:
      "A vague description produces wrong calls: the model calls a search tool when it should look up an order, passes a name where an id was needed, or never calls anything and guesses. A definition that explains purpose, conditions and the shape of results makes the model's choice reliable, and a schema that excludes dangerous arguments makes the choice safe. The definition is the contract between a capable but literal model and your code.",
    how: [
      "Name the function with a verb and object in snake_case: lookup_order, create_ticket.",
      "Write the description: what it returns, when to use it, when not to, and how failure or absence is reported.",
      "Define the input schema: each argument typed, described, enumerated where fixed; mark required ones; forbid extras.",
      "Leave out anything the model must not decide: identity, permissions, internal ids it cannot know.",
      "Test the definitions by asking the model questions and checking which tool it picks and with what arguments.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Weak definition", points: ["name: 'order'", "description: 'Gets order'", "input: { id: string }", "The model calls it with a product name; calls it for every message"] },
      right: { title: "Strong definition", points: ["name: 'lookup_order'", "description: 'Return the status, items and delivery estimate of ONE order by its number. Use when the customer gives an order number. Returns found: false if it does not exist.'", "input: { order_id: integer, description: 'the order number the customer typed, digits only' }, required", "Called only when a number is present, with the right argument"] },
      caption: "Same function underneath. The right-hand definition is what makes the model use it correctly.",
    },
    everyday: {
      title: "Labels on the office phone's speed-dial",
      text: "A speed-dial button labelled 'W' gets pressed at random. One labelled 'Warehouse: ask about order status, give the order number' gets pressed at the right moment with the right question. The model is a new temp at that phone; the labels are the tool definitions.",
    },
    engineering: {
      title: "A shipping-cost calculator the model kept misusing",
      text: "A retailer added a calculate_shipping function with arguments weight and destination. The model called it for questions about delivery times, passed country names in different languages, and sometimes guessed the weight. The definition was rewritten: 'Return the shipping cost in GBP for ONE parcel. Use only when the customer asks about cost, not delivery time. weight_kg: number from the product record (never guess; if unknown, ask the customer). destination: ISO 3166 country code.' With destination as an enumeration of served countries and weight described as coming from the record, misuse dropped to near zero, and the 'never guess' instruction turned invented weights into a question back to the customer.",
    },
    code: {
      title: "A definition written for the model",
      lang: "ts",
      src: `export const calculateShipping = {
  name: "calculate_shipping",
  description: "Return the shipping cost in GBP for ONE parcel to a served country. Use only when the customer asks about shipping COST, not delivery time. If the parcel weight is unknown, do not guess: ask the customer for the product so weight can be looked up.",
  input_schema: {
    type: "object",
    properties: {
      weight_kg: { type: "number", minimum: 0.01, maximum: 60, description: "Parcel weight in kilograms, from the product record." },
      destination: { type: "string", enum: SERVED_COUNTRY_CODES, description: "ISO 3166-1 alpha-2 code of the destination country." },
      express: { type: "boolean", description: "True only if the customer explicitly asked for express delivery." },
    },
    required: ["weight_kg", "destination"],
    additionalProperties: false,
  },
} as const;`,
      lines: [
        { code: "description: \"Return the shipping cost in GBP for ONE parcel to a served country. Use only when the customer asks about shipping COST, not delivery time. If the parcel weight is unknown, do not guess: ask the customer for the product so weight can be looked up.\",", say: "What it returns, when to use it, when not to, and what to do when an argument is unknown." },
        { code: "weight_kg: { type: \"number\", minimum: 0.01, maximum: 60, description: \"Parcel weight in kilograms, from the product record.\" },", say: "Bounded, described, and the source of the value named so the model does not invent it." },
        { code: "destination: { type: \"string\", enum: SERVED_COUNTRY_CODES, description: \"ISO 3166-1 alpha-2 code of the destination country.\" },", say: "An enumeration: the model cannot pass 'Deutschland' or an unserved country." },
        { code: "required: [\"weight_kg\", \"destination\"],", say: "Express is optional with a clear default; the two cost inputs are not." },
      ],
      note: "Nothing identifies the customer here. Scoping to the customer happens in the code that runs the function.",
    },
    useIt: "Write every tool definition as if briefing a literal new colleague: purpose, conditions, result shape, failure shape, typed and described arguments, nothing the model must not decide. Then test which tools the model picks for a set of questions; the definitions are a prompt and deserve the same testing.",
    takeaways: ["The model sees only the definition; it decides calls from the description and the schema.", "Descriptions say what, when, when not, and how absence is reported.", "Arguments are typed, described, enumerated, required; identity is never an argument.", "Test tool selection like any prompt."],
    terms: [["tool definition", "the name, description and input schema the model sees for a function"], ["input schema", "the JSON Schema for a tool's arguments"], ["snake_case", "naming with underscores, the convention for tool names"]],
    reflect: { q: "Why is the customer id not an argument of lookup_order?", a: "Because the model would fill it in, and then any customer could ask about any order by typing a number. Identity comes from the authenticated session in your code; the model only supplies the choices it is allowed to make." },
  },

  "m27-tool-selection": {
    simple: "Tool selection is the model deciding whether to call a tool, which one, and with what arguments, from the conversation and the definitions. Your code can leave it free, force a tool, or forbid tools.",
    concept:
      "Given several tools, the model performs **tool selection** on every turn: answer directly, or request one or more tools, choosing by matching the conversation against each definition's description. The quality of that choice depends almost entirely on how clearly the definitions distinguish the tools and when each applies.\n\nYour code sets the policy with tool_choice. Auto lets the model decide (the default for assistants). Any requires that it call some tool. A named tool forces that one (structured output). None forbids tools for this turn, useful when you want a plain text answer. Choosing the policy per call is part of designing the feature: a classifier forces its tool; a chat assistant runs auto; a final 'summarise what you did' turn runs none.\n\nSelection can be wrong in both directions: calling a tool that was not needed (cost, latency, side effects) or not calling one that was (a guessed answer). Both are measured with a test set of questions and expected tool calls.",
    why:
      "The value of tools comes from using them at the right moment. An assistant that looks up an order for 'hello' wastes calls; one that answers 'where is my order' without looking it up invents a date. Selection decides which happens, and because it is driven by text the model reads, it is a prompt-engineering problem: definitions, system instructions and examples shape it. Giving code the tool_choice lever means the parts of the flow that must be deterministic (always classify, never act here) are not left to the model.",
    how: [
      "Write definitions whose descriptions do not overlap: each says when to use it and when another tool applies.",
      "In the system message, add selection rules: 'Only look up orders when the customer gives a number; otherwise ask for it.'",
      "Set tool_choice per call: auto for assistants, a named tool for structured output, none for text-only turns.",
      "Build a test set: questions with the expected tool (or no tool) and expected arguments; score selection accuracy.",
      "Fix misselection with description changes and examples before changing the model.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["tool_choice", "Meaning", "Use when"],
        rows: [
          ["auto", "the model decides whether and which", "assistants with several tools"],
          ["any", "must call some tool", "every turn must produce an action or a classification"],
          ["{ type: 'tool', name: X }", "must call tool X", "structured output; a fixed first step"],
          ["none", "no tools this turn", "a final text summary; a turn that must be prose"],
        ],
      },
      caption: "The policy is your code's; the pick within the policy is the model's.",
    },
    everyday: {
      title: "A switchboard operator",
      text: "A caller says 'my parcel hasn't arrived'. A good operator connects them to deliveries, not to sales, and does not transfer at all if the caller just wants opening hours. The operator decides from the words and the directory. The directory entries are the tool definitions; management can also say 'always route to triage first' (forced) or 'handle it yourself today' (none).",
    },
    engineering: {
      title: "A field-service assistant with six tools",
      text: "An assistant for engineers in the field had six tools: find a part, check stock, book a van, log a job, look up a manual, raise an incident. Early on it booked vans when engineers asked where a van was, and logged jobs for messages that were just questions. The team built a 120-question selection test set with expected tools. Rewriting descriptions to state when not to use each tool, adding four selection rules to the system message, and forcing none on the final summary turn took selection accuracy from 78% to 96%. The remaining errors were ambiguous questions, where the assistant now asks before acting.",
    },
    code: {
      title: "Selection policy per turn, and a selection test",
      lang: "ts",
      src: `// policy: assistants decide; the closing summary never calls tools
const reply = await client.messages.create({
  model: process.env.MODEL_MID!, max_tokens: 600,
  system: FIELD_SYSTEM + "\\nSelection rules: book_van only when the engineer asks to book, never to answer 'where is'. log_job only after the engineer confirms the job is complete.",
  tools: FIELD_TOOLS,
  tool_choice: isClosingTurn ? { type: "none" } : { type: "auto" },
  messages,
});

// selection test: question -> expected tool (or null)
const cases = [
  { q: "where is my van?", expect: null },
  { q: "book me a van for tomorrow 8am", expect: "book_van" },
  { q: "do we have part 44-A in stock?", expect: "check_stock" },
];
for (const c of cases) {
  const r = await client.messages.create({ model: process.env.MODEL_MID!, max_tokens: 200, system: FIELD_SYSTEM, tools: FIELD_TOOLS, messages: [{ role: "user", content: c.q }] });
  const picked = r.content.find((b) => b.type === "tool_use")?.name ?? null;
  console.log(c.q, picked === c.expect ? "ok" : "WRONG: " + picked);
}`,
      lines: [
        { code: "system: FIELD_SYSTEM + \"\\nSelection rules: book_van only when the engineer asks to book, never to answer 'where is'. log_job only after the engineer confirms the job is complete.\",", say: "Selection rules in the system message resolve the cases where descriptions alone were ambiguous." },
        { code: "tool_choice: isClosingTurn ? { type: \"none\" } : { type: \"auto\" },", say: "Code decides the policy per turn: the model chooses freely, except on the closing turn where tools are forbidden." },
        { code: "const picked = r.content.find((b) => b.type === \"tool_use\")?.name ?? null;", say: "The test reads which tool was picked, or none, and compares with the expectation." },
      ],
    },
    useIt: "Design tool selection deliberately: non-overlapping descriptions, selection rules in the system message, tool_choice per turn, and a test set of questions with expected tools. Measure selection accuracy as its own number; it is where assistants silently go wrong.",
    takeaways: ["Selection is driven by the definitions and the conversation; it is a prompt problem.", "tool_choice sets the policy: auto, any, a named tool, none.", "Both over-calling and under-calling are failures; measure them with a test set.", "Fix with descriptions, rules and examples first."],
    terms: [["tool selection", "the model's choice of whether and which tool to call"], ["tool_choice", "the request setting that constrains that choice"], ["selection accuracy", "the share of test questions where the expected tool (or none) was chosen"]],
    reflect: { q: "The model calls check_stock for almost every message, including greetings. What is the likely cause?", a: "A description that reads like 'useful for product questions' with no 'when not' clause, or a system message that praises tool use. Add 'only when the engineer asks about availability of a specific part' and a rule that greetings get a plain reply." },
  },

  "m27-tool-execution": {
    simple: "Tool execution is your code running the requested function: validate the arguments, add identity and permissions from the session, run it with a timeout, and never let the model's input reach a system unchecked.",
    concept:
      "When the model requests a tool, nothing has happened yet. **Tool execution** is the part your code owns: take the tool-use block, check that the tool exists and is allowed for this user, validate the arguments against the schema (the model's output is untrusted input), add what the model may not supply (the customer id, the tenant, the permissions), run the real function with a timeout, and capture the result or the error.\n\nThe model's arguments are treated exactly like form input from a stranger. They are validated for type and range, scoped to what this user may touch, and logged. A request for a tool that is not in the allowed set is refused with an error result, not executed.\n\nFor tools that change things (send, book, refund), execution is split: the tool call produces a proposal, a person confirms, and only then does the function run, with an idempotency key so a retry cannot repeat it. Read-only tools run immediately.",
    why:
      "Execution is where a model's mistake becomes a real-world effect: a query against the wrong customer, an email to the wrong person, a refund twice. The model cannot be made perfectly reliable, but execution can be made safe: validation stops malformed arguments, session scoping stops cross-customer access, timeouts stop hangs, confirmation stops irreversible surprises, and logging makes every action explainable. The loop is only as safe as this step.",
    how: [
      "Look up the tool by name in an allowlist for this feature and user; unknown or disallowed names return an error result.",
      "Validate the arguments with the tool's schema; reject anything out of type or range.",
      "Inject identity and scope from the session: customer id, tenant, role.",
      "Run the function with a timeout; catch exceptions and turn them into error results.",
      "For write tools, record a pending action and return a proposal; execute only after confirmation, with an idempotency key.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "tool_use block", detail: "{ name: 'lookup_order', input: { order_id: 4417 } }" },
        { label: "allowlist", detail: "is lookup_order enabled for this feature and user? else error result" },
        { label: "validate", detail: "order_id is a positive integer? else error result" },
        { label: "scope", detail: "customerId from the session added to the query" },
        { label: "run with timeout", detail: "db.orders.findFirst({ id, customerId }), 5 s" },
        { label: "result", detail: "{ found: true, status: 'shipped', eta: '2026-11-08' } or { found: false }" },
      ],
      caption: "Five checks between the model's request and the database. None of them are optional.",
    },
    everyday: {
      title: "A bank teller with a request slip",
      text: "A customer hands over a slip saying 'withdraw £500 from account 1234'. The teller checks the slip is complete, checks the customer's identity, checks the account is theirs, checks the balance, and only then counts the money. If the slip says 'account 9999', the teller does not pay out just because the slip is neatly written. The model's tool request is the slip; your execution code is the teller.",
    },
    engineering: {
      title: "The lookup that could have read any customer",
      text: "A retailer's first tool implementation took the model's arguments and ran them straight into the query: lookup_order(order_id). Any customer who typed another customer's order number got that order's details, because the model dutifully passed the number along. The fix was in execution, not in the model: the query gained a customerId from the session, arguments were validated with the schema, unknown tools were refused, and every call was logged with the session id. A later review found a timeout missing on the courier API tool, which had hung a conversation for two minutes; a five-second timeout and an error result fixed that too.",
    },
    code: {
      title: "runTool: allowlist, validate, scope, timeout, never throw",
      lang: "ts",
      src: `const LookupInput = z.object({ order_id: z.number().int().positive() });

export async function runTool(name: string, input: unknown, session: Session): Promise<{ data: unknown; error: boolean }> {
  if (!session.allowedTools.has(name)) return { data: "Tool not available: " + name, error: true };
  try {
    if (name === "lookup_order") {
      const { order_id } = LookupInput.parse(input);                           // the model's arguments are untrusted
      const order = await withTimeout(5000, db.orders.findFirst({ where: { id: order_id, customerId: session.customerId } }));
      if (!order) return { data: { found: false, message: "No order with that number on this account." }, error: false };
      return { data: { found: true, status: order.status, eta: order.eta, items: order.items.map((i) => i.name) }, error: false };
    }
    if (name === "cancel_order") {
      const { order_id, reason } = CancelInput.parse(input);
      const pending = await pendingActions.create({ kind: "cancel_order", order_id, reason, customerId: session.customerId });
      return { data: { proposal: "Cancel order " + order_id + "? Awaiting the customer's confirmation.", pendingId: pending.id }, error: false };
    }
    return { data: "Unknown tool: " + name, error: true };
  } catch (e) {
    await auditLog.write({ tool: name, session: session.id, error: String(e) });
    return { data: "Tool failed: " + String(e), error: true };
  }
}`,
      lines: [
        { code: "if (!session.allowedTools.has(name)) return { data: \"Tool not available: \" + name, error: true };", say: "An allowlist per session. A tool the model should not have is refused, not run." },
        { code: "const { order_id } = LookupInput.parse(input);                           // the model's arguments are untrusted", say: "Schema validation on the model's output, like any form field." },
        { code: "const order = await withTimeout(5000, db.orders.findFirst({ where: { id: order_id, customerId: session.customerId } }));", say: "Scoped to the session's customer and bounded by a timeout." },
        { code: "const pending = await pendingActions.create({ kind: \"cancel_order\", order_id, reason, customerId: session.customerId });", say: "A write tool does not write. It records a proposal; a person confirms; then it runs once." },
        { code: "return { data: \"Tool failed: \" + String(e), error: true };", say: "Exceptions become error results. The loop never crashes because a query failed." },
      ],
    },
    useIt: "Implement one runTool entry point per feature with an allowlist, schema validation, session scoping, timeouts, error results and an audit log. Split write tools into propose and confirm. This is the same function an agent runner (Stage 7) and an MCP server (Module 35) sit on.",
    takeaways: ["The model's arguments are untrusted input: validate, scope, bound.", "Identity and permissions come from the session, never from the model.", "Timeouts and error results keep the loop alive; the audit log makes it explainable.", "Write tools propose; a person confirms; execution is idempotent."],
    terms: [["tool execution", "your code running a requested function safely"], ["allowlist", "the set of tools a feature or user may use"], ["session scoping", "limiting a function to the authenticated user's data"], ["idempotency key", "a unique id that makes a repeated write a no-op"]],
    reflect: { q: "The model requests delete_account with the right arguments for the signed-in user. Should it run?", a: "Not directly. Irreversible actions run only after the person confirms a proposal in the UI, and some should not be model-callable at all. The model requesting it correctly is not consent." },
  },

  "m27-tool-responses": {
    simple: "A tool response is what your code sends back after running a function: compact, honest data the model will trust, including explicit 'not found' and marked errors, and nothing the user should not see.",
    concept:
      "After execution, your code writes a **tool response** (a tool-result message) and the model reads it as fact. What you put in it shapes the answer the user gets. Three rules follow.\n\nBe compact: return the fields the answer needs, not the whole database row. Every byte goes into the model's context, costs tokens, and may be repeated to the user; a card's last four digits or an internal note do not belong there.\n\nBe honest and explicit: 'not found' is a normal result with a clear message, not an empty object the model might read as 'no information'. Errors are marked as errors so the model can apologise or retry rather than treat 'Tool failed: timeout' as data about the order.\n\nBe structured: JSON with named fields, dates in ISO format, units stated. The model reads structured results more reliably than prose, and your evals can check the answer against the result.",
    why:
      "The model has no other source of truth for what the tool found. A response that is vague, bloated or wrong produces an answer that is vague, expensive or wrong, with the model's full confidence. 'Not found' returned as an empty string becomes 'your order has no status yet'; a stack trace returned as data becomes a quoted stack trace in the chat; a full customer record becomes a leaked phone number. Designing responses is designing the model's understanding of reality.",
    how: [
      "Decide the response shape per tool like a small API: named fields, types, units, formats.",
      "Include a found or status flag; for absence, return a sentence the model can relay.",
      "Mark failures with is_error so the model treats them as failures.",
      "Strip anything sensitive or irrelevant before returning; keep internal ids out unless the model needs them for a follow-up call.",
      "Log the response alongside the request, so a wrong answer can be traced to what the model was told.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Situation", "Poor response", "Good response"],
        rows: [
          ["order found", "the entire row with 40 fields", "{ found: true, status: 'shipped', eta: '2026-11-08', items: ['Oak desk'] }"],
          ["order missing", "{}", "{ found: false, message: 'No order 4471 on this account.' }"],
          ["database timeout", "'Error: ETIMEDOUT at …' as data", "is_error: true, content: 'Order lookup timed out; try again shortly.'"],
          ["stock check", "'12'", "{ sku: '44-A', in_stock: 12, restock_date: '2026-11-15', unit: 'pieces' }"],
        ],
      },
      caption: "The right-hand column is what the model should believe; the left makes it believe the wrong things.",
    },
    everyday: {
      title: "Answering the phone from the warehouse",
      text: "The receptionist asks about order 4417. A good warehouse answer is 'shipped yesterday, arrives Friday, one oak desk'. A bad one is reading the whole packing database aloud, or silence when the order is not there, or 'the printer jammed' said in the same tone as a status. What the warehouse says is what the customer ends up hearing.",
    },
    engineering: {
      title: "The stock tool that answered with a number",
      text: "An assistant's check_stock tool returned a bare number: '12'. The model sometimes read it as a price, sometimes as a quantity, and once told a customer twelve was the delivery day. The response was redesigned as an object: sku, in_stock, unit, restock_date, warehouse. Misreadings stopped. The same review found that lookup_order returned the full record including the customer's phone number and an internal fraud score, which the model had once mentioned; the response was trimmed to five fields. Every tool response is now reviewed like a public API, because to the model it is one.",
    },
    code: {
      title: "A response designed for the model",
      lang: "ts",
      src: `type StockResponse =
  | { found: true; sku: string; in_stock: number; unit: "pieces"; restock_date: string | null; warehouse: string }
  | { found: false; message: string };

async function checkStock(sku: string): Promise<StockResponse> {
  const row = await db.stock.findUnique({ where: { sku } });
  if (!row) return { found: false, message: "No product with SKU " + sku + "." };
  return {
    found: true,
    sku: row.sku,
    in_stock: row.quantity,
    unit: "pieces",
    restock_date: row.restockAt ? row.restockAt.toISOString().slice(0, 10) : null,
    warehouse: row.warehouseCode,
  };                                                   // nothing else: no cost price, no supplier, no internal notes
}

// in the loop
results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(await checkStock(args.sku)), is_error: false });`,
      lines: [
        { code: "| { found: false; message: string };", say: "Absence is a typed, explicit result with a sentence the model can relay." },
        { code: "in_stock: row.quantity,", say: "Named and typed. '12' alone was ambiguous; in_stock: 12 is not." },
        { code: "restock_date: row.restockAt ? row.restockAt.toISOString().slice(0, 10) : null,", say: "Dates in ISO format; null when there is none, never a guess." },
        { code: "};                                                   // nothing else: no cost price, no supplier, no internal notes", say: "The response is the public surface. Anything not needed for the answer is left out." },
      ],
    },
    useIt: "Design every tool response as a small public API: named fields, units, ISO dates, explicit absence, marked errors, no sensitive or irrelevant data. Log it with the request. What the model is told is what the user will be told.",
    takeaways: ["The model treats the response as truth; design it accordingly.", "Compact, structured, explicit about absence, marked on error.", "Strip sensitive and irrelevant fields; the response can be repeated to the user.", "Log responses with requests for tracing."],
    terms: [["tool response / tool result", "the message your code returns to the model after running a tool"], ["is_error", "the flag marking a tool result as a failure"], ["ISO date", "a date written as YYYY-MM-DD, unambiguous across locales"]],
    reflect: { q: "Should a tool response ever include an internal record id?", a: "Only when the model needs it to make a follow-up call, such as cancel_order(order_id). Even then, prefer ids the user already knows, and keep internal keys out when they serve no purpose in the conversation." },
  },

  "m27-multiple-tool-calls": {
    simple: "A model can request several tools in one turn, or chain calls across turns using earlier results. Your code runs independent calls in parallel and dependent ones in sequence, within a round limit.",
    concept:
      "Questions often need more than one function. 'Is the oak desk in stock and when would it arrive in Leeds?' needs a stock check and a shipping estimate. The model handles this in two ways. **Parallel tool calls**: one reply containing several tool-use blocks, when the calls do not depend on each other; your code runs them together and returns all the results in one message. **Sequential calls** across rounds: the model asks for one tool, reads the result, then asks for another that uses it, such as finding a customer's latest order before checking its status.\n\nYour loop already supports both: run every tool-use block in the reply, return all results, call again. The design choices are how to run independent calls (concurrently, with Promise.all), how many rounds to allow, and how to keep the model from wandering: a cap on rounds, a budget on tokens, and tool definitions that make the right sequence obvious.",
    why:
      "Real tasks are multi-step, and forcing one tool per turn makes them slow and awkward: each round is another model call with the whole history. Parallel calls cut latency for independent lookups; sequential rounds let the model use what it learned. Without limits, though, multi-step becomes a loop that keeps calling, so the cap on rounds and the budget are what make multiple calls safe. This is where the tool loop starts to look like an agent, which Stage 7 takes further.",
    how: [
      "In the loop, collect every tool-use block from the reply, not just the first.",
      "Run independent calls concurrently and build one tool-result per block, each with its tool_use_id.",
      "Return all results in a single user message; the model sees them together.",
      "If the model requests another tool using earlier results, repeat; count rounds and stop at the cap.",
      "Write definitions so the natural order is clear (find the order, then check its status), and log the sequence for debugging.",
    ],
    visual: {
      kind: "flow",
      steps: ["user: 'stock and delivery to Leeds for the oak desk?'", "model: [check_stock(44-A), calculate_shipping(12kg, GB)]", "code: both run in parallel → two results", "model: answers with both", "(sequential case) model: list_recent_orders → result → lookup_order(4417) → result → answer"],
      caption: "Parallel when independent, sequential when one call needs another's result.",
    },
    everyday: {
      title: "A travel agent planning a trip",
      text: "Asked for a weekend in Lisbon, the agent checks flights and hotels at the same time (independent), and only after choosing the flight checks the airport transfer time (dependent on the arrival). They also stop after a few rounds and ask you a question rather than searching forever. That is a multi-call loop with a cap.",
    },
    engineering: {
      title: "An operations dashboard answering compound questions",
      text: "An internal assistant for an operations team answers questions like 'which of today's late deliveries are high-value customers and who is their account manager?'. One turn needs late_deliveries, then customer_tier for each, then account_manager for the high-value ones. The model requests late_deliveries, then in the next round requests customer_tier for all ten in parallel, then account_manager for the three that matter. The loop runs parallel blocks with Promise.all and allows six rounds. Latency for the question fell from 40 seconds (one call at a time) to 9. A round cap of six stops the rare case where the model keeps refining.",
    },
    code: {
      title: "Parallel results in one message, rounds capped",
      lang: "ts",
      src: `const MAX_ROUNDS = 6;

for (let round = 0; round < MAX_ROUNDS; round++) {
  const reply = await client.messages.create({ model: process.env.MODEL_MID!, max_tokens: 800, system: OPS_SYSTEM, tools: OPS_TOOLS, messages });
  messages.push({ role: "assistant", content: reply.content });
  if (reply.stop_reason !== "tool_use") return textOf(reply);

  const calls = reply.content.filter((b) => b.type === "tool_use");
  const outputs = await Promise.all(calls.map((c) => runTool(c.name, c.input, session)));   // independent calls run together
  messages.push({
    role: "user",
    content: calls.map((c, i) => ({ type: "tool_result", tool_use_id: c.id, content: JSON.stringify(outputs[i].data), is_error: outputs[i].error })),
  });
  await trace.span("tool_round", { round, tools: calls.map((c) => c.name) });
}
return "That question needed more steps than I can take. A colleague will follow up.";`,
      lines: [
        { code: "const calls = reply.content.filter((b) => b.type === \"tool_use\");", say: "Every tool request in the reply, not just the first." },
        { code: "const outputs = await Promise.all(calls.map((c) => runTool(c.name, c.input, session)));   // independent calls run together", say: "Independent lookups run concurrently; ten tier checks take the time of one." },
        { code: "content: calls.map((c, i) => ({ type: \"tool_result\", tool_use_id: c.id, content: JSON.stringify(outputs[i].data), is_error: outputs[i].error })),", say: "All results go back in one message, each matched to its request by id." },
        { code: "for (let round = 0; round < MAX_ROUNDS; round++) {", say: "Sequential rounds are allowed up to a cap; the cap is what stops wandering." },
      ],
      note: "Write tools inside a parallel batch still follow the propose-and-confirm rule; they do not run just because they arrived together.",
    },
    useIt: "Support multiple tool-use blocks per reply, run independent ones in parallel, allow a bounded number of sequential rounds, and trace each round. Compound questions in dashboards, support and research assistants depend on it; agents in Stage 7 add planning and budgets on top.",
    takeaways: ["One reply can hold several tool requests; one message returns all their results.", "Independent calls in parallel, dependent calls across rounds.", "Cap the rounds and trace each one.", "Write tools keep their confirmation gate even inside a batch."],
    terms: [["parallel tool calls", "several tool requests in one model reply, run concurrently"], ["sequential tool calls", "a tool request that depends on an earlier result, across rounds"], ["round cap", "the maximum number of tool rounds the loop allows"]],
    reflect: { q: "The model requests lookup_order in round 1, then the same lookup again in round 2 with the same arguments. What should the loop do?", a: "Detect the repeat and return the cached result with a note, or count repeats toward the cap. Repeating identical calls usually means the result was unclear to the model; improve the response shape and the definition." },
  },

  "m27-error-handling-in-tool-workflows": {
    simple: "Tools fail: bad arguments, missing records, timeouts, downstream outages. Each failure goes back to the model as a marked error result, so the loop keeps going and the model can recover or hand over honestly.",
    concept:
      "A tool workflow has more places to fail than a plain call: the model can send wrong arguments, the function can throw, the downstream service can time out, the result can be empty. **Error handling in tool workflows** means every one of those becomes an error result the model sees, never an exception that kills the loop or a silent empty result it misreads.\n\nThe pattern: runTool never throws. Validation failures return 'invalid arguments: order_id must be a positive integer' with is_error true; the model usually corrects itself. Not-found returns a normal result with found: false; it is information, not an error. Timeouts and outages return an error naming the tool and suggesting a retry; the model can try once more or tell the user. After a cap on retries or rounds, the loop ends with an honest status and a handoff.\n\nWrite tools add one rule: a timeout on a write is an unknown outcome, not a failure. Only idempotent writes may be retried, and the pending action record is checked first.",
    why:
      "Without this, one failing lookup becomes a crashed conversation, or worse, an answer built on a misread blank. With it, the model becomes resilient: it corrects a malformed argument, tells the customer the order was not found, apologises that stock cannot be checked right now, and the loop always ends in a state the system understands. Errors are inevitable in any workflow that touches other systems; what varies is whether the user sees a crash, a lie or an honest sentence.",
    how: [
      "Validate arguments and return a descriptive error result on failure; the model can fix and retry.",
      "Return absence as data (found: false) with a message, not as an error and not as emptiness.",
      "Catch exceptions and timeouts and return an error result naming the tool and whether a retry is sensible.",
      "Count tool errors and rounds; after the cap, end the loop with a status and a handoff message.",
      "For writes: on timeout, check the pending action's state before any retry; never re-run without an idempotency key.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Failure", "What goes back to the model", "What the model usually does"],
        rows: [
          ["malformed arguments", "is_error: 'order_id must be a positive integer; you sent \"4417abc\"'", "re-requests with 4417"],
          ["record not found", "{ found: false, message: 'No order 4471 on this account.' }", "tells the customer, offers to check another number"],
          ["timeout / outage", "is_error: 'Stock service timed out; a retry in a moment may succeed.'", "retries once, or apologises and continues"],
          ["disallowed tool", "is_error: 'Tool not available.'", "answers without it or asks a person"],
          ["cap reached", "(loop ends) status: step_limit, handoff message", "nothing; the system takes over"],
        ],
      },
      caption: "Every row ends with the loop alive and the user told the truth.",
    },
    everyday: {
      title: "A courier whose scanner fails",
      text: "The scanner will not read a label. A good courier does not abandon the round or deliver to a guessed address; they try once more, then ring the depot, and if that fails they leave a card saying what happened. The parcel's status is always known. Tool error handling gives the model the same options: retry, ask, or report, never guess and never vanish.",
    },
    engineering: {
      title: "The assistant that survived a stock-service outage",
      text: "A retailer's stock service went down for an hour. The old assistant crashed on every stock question and the chat showed a generic error. The rewritten runTool returned is_error results naming the service; the model told customers 'I can't check stock right now; I can look up your order or you can try again in a few minutes', and the rest of the conversation worked. The loop also caught a subtler bug: the model had been passing SKUs with a trailing space, which the validator now reports back as an argument error, and the model corrects it on the next round without any human noticing.",
    },
    code: {
      title: "Errors as results, and a loop that always ends",
      lang: "ts",
      src: `let toolErrors = 0;
for (let round = 0; round < MAX_ROUNDS; round++) {
  const reply = await client.messages.create({ model: process.env.MODEL_MID!, max_tokens: 600, system: SUPPORT_SYSTEM, tools, messages });
  messages.push({ role: "assistant", content: reply.content });
  if (reply.stop_reason !== "tool_use") return { status: "done", text: textOf(reply) };

  const results = [];
  for (const block of reply.content) {
    if (block.type !== "tool_use") continue;
    const out = await runTool(block.name, block.input, session);        // never throws; errors come back as { error: true }
    if (out.error) toolErrors++;
    results.push({ type: "tool_result", tool_use_id: block.id, content: typeof out.data === "string" ? out.data : JSON.stringify(out.data), is_error: out.error });
  }
  messages.push({ role: "user", content: results });
  if (toolErrors >= 3) return { status: "tool_failures", text: "I'm having trouble reaching our systems. A colleague will follow up by email." };
}
return { status: "step_limit", text: "That took more steps than I can take here. A colleague will follow up." };`,
      lines: [
        { code: "const out = await runTool(block.name, block.input, session);        // never throws; errors come back as { error: true }", say: "The contract that keeps the loop alive: failures are values, not exceptions." },
        { code: "if (out.error) toolErrors++;", say: "Errors are counted so repeated failures end the loop instead of burning rounds." },
        { code: "results.push({ type: \"tool_result\", tool_use_id: block.id, content: typeof out.data === \"string\" ? out.data : JSON.stringify(out.data), is_error: out.error });", say: "The error reaches the model marked as an error, with a human-readable message it can act on." },
        { code: "if (toolErrors >= 3) return { status: \"tool_failures\", text: \"I'm having trouble reaching our systems. A colleague will follow up by email.\" };", say: "An honest exit with a status the rest of the system can handle." },
      ],
    },
    useIt: "Make runTool never throw, return absence as data and failures as marked errors, count errors and rounds, and end every loop with a status and an honest message. Treat write timeouts as unknown outcomes. This is the resilience that agents, MCP servers and production assistants all inherit.",
    takeaways: ["Every failure becomes an error result the model can act on; the loop never crashes.", "Not found is data; timeouts and outages are marked errors with retry advice.", "Count errors and rounds; exit with a status and a handoff.", "Write timeouts are unknown outcomes: check state, retry only with idempotency."],
    terms: [["error result", "a tool result marked is_error with a message the model can act on"], ["handoff", "ending the loop by passing the user to a person with an honest message"], ["unknown outcome", "a write whose request timed out and may or may not have happened"]],
    reflect: { q: "A tool returns an empty array for 'recent orders' and the model says the customer has never ordered. Error handling or response design?", a: "Response design: an empty array is ambiguous between 'no orders' and 'lookup returned nothing'. Return { orders: [], message: 'No orders in the last 12 months on this account.' } so the model relays the truth with its scope." },
  },

  "m27-reliable-tool-integrations": {
    simple: "A reliable tool integration treats each tool as a small, tested, observable service: a clear contract, validation on both sides, timeouts, idempotent writes, confirmation for anything irreversible, logs, and a test set for selection and results.",
    concept:
      "The earlier lessons each covered one piece. **Reliable tool integrations** is the whole: everything that must be true for a tool loop to run in production without surprises. The tool has a contract (definition and response shape) that is versioned like an API. Arguments are validated; identity is scoped. Calls have timeouts and never throw. Reads run freely; writes propose, confirm, and execute once with an idempotency key. Every call is logged with its arguments, result, duration and the conversation it belonged to. Selection and results are covered by a test set that runs on every change to a definition, a prompt or a model.\n\nThe integration also has limits the model never sees: a round cap, an error cap, a token budget, and an allowlist per feature. And it has a human path: whenever the loop cannot finish, the user gets an honest message and a person gets the trace.",
    why:
      "A tool loop combines two unreliable things, a sampled model and external services, and puts real actions at the end. Each piece can be made safe, but reliability is the property of the whole: a validated argument on an unscoped query is still a leak; a confirmed write without idempotency is still a double refund; a perfect loop with no logs is undebuggable. Teams that treat tools as services, with contracts, tests and observability, get assistants that stay correct as prompts, models and downstream systems change.",
    how: [
      "Contract: definition (name, description, input schema) and response shape in one versioned module per tool.",
      "Safety: validate arguments, scope to the session, allowlist per feature, timeouts, error results, propose-confirm-execute for writes with idempotency keys.",
      "Limits: round cap, error cap, token budget per conversation.",
      "Observability: log every call (tool, arguments, result summary, duration, error) under the conversation's trace id.",
      "Tests: a selection set (question → expected tool and arguments) and a result set (tool result → expected answer properties), run on every change.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Property", "Mechanism", "Failure it prevents"],
        rows: [
          ["correct selection", "clear definitions, selection rules, selection tests", "wrong tool, no tool, over-calling"],
          ["safe execution", "validation, session scoping, allowlist", "malformed queries, cross-customer access"],
          ["liveness", "timeouts, error results, round and error caps", "hangs, crashes, endless loops"],
          ["safe writes", "propose → confirm → execute once with idempotency key", "duplicate refunds, unconfirmed actions"],
          ["explainability", "trace id, per-call log, response logging", "'why did it say that?' with no answer"],
          ["stability over time", "versioned contracts, tests on every change", "a prompt or model change silently breaking tool use"],
        ],
      },
      caption: "Reliability is all six rows at once.",
    },
    everyday: {
      title: "A well-run pharmacy counter",
      text: "A prescription is checked against the patient's record, dispensed once with a label and a log entry, confirmed with the patient, and anything unusual goes to the pharmacist. Nobody relies on the assistant being careful; the process is careful. A reliable tool integration is that process around a model.",
    },
    engineering: {
      title: "From demo to production in a support assistant",
      text: "A company's support assistant went from a two-day demo to production over six weeks, and the work was almost entirely integration reliability. Each tool got a module with its definition, response type and tests. runTool gained the allowlist, validation, scoping, timeouts and error results. cancel_order became propose-confirm-execute with an idempotency key after a duplicate cancellation in staging. A 150-case selection set and a 60-case result set run in CI. Every call is traced. The model and prompt have changed four times since; the tests caught two regressions in tool selection before deploy, and no incident has reached a customer.",
    },
    code: {
      title: "A tool module: contract, execution and tests together",
      lang: "ts",
      src: `// tools/lookupOrder.ts
export const definition = {
  name: "lookup_order",
  description: "Return status, items and delivery estimate of ONE order by number. Use when the customer gives an order number. Returns found: false if it does not exist for this customer.",
  input_schema: { type: "object", properties: { order_id: { type: "integer", description: "The order number the customer typed." } }, required: ["order_id"], additionalProperties: false },
} as const;

export const Input = z.object({ order_id: z.number().int().positive() });
export type Output = { found: true; status: string; eta: string | null; items: string[] } | { found: false; message: string };

export async function execute(input: unknown, session: Session): Promise<Output> {
  const { order_id } = Input.parse(input);
  const order = await withTimeout(5000, db.orders.findFirst({ where: { id: order_id, customerId: session.customerId } }));
  return order ? { found: true, status: order.status, eta: order.eta, items: order.items.map((i) => i.name) } : { found: false, message: "No order " + order_id + " on this account." };
}

export const selectionCases = [
  { q: "where is order 4417?", expect: { tool: "lookup_order", input: { order_id: 4417 } } },
  { q: "where is my order?", expect: { tool: "list_recent_orders" } },
  { q: "what are your opening hours?", expect: { tool: null } },
];`,
      lines: [
        { code: "export const definition = {", say: "The contract the model sees, next to the code that honours it, in one module." },
        { code: "export const Input = z.object({ order_id: z.number().int().positive() });", say: "The validator for the model's arguments, exported so the runner and the tests share it." },
        { code: "export type Output = { found: true; status: string; eta: string | null; items: string[] } | { found: false; message: string };", say: "The response shape is a type: explicit absence, no extra fields." },
        { code: "const order = await withTimeout(5000, db.orders.findFirst({ where: { id: order_id, customerId: session.customerId } }));", say: "Scoped and bounded in the execution itself." },
        { code: "export const selectionCases = [", say: "Selection tests live with the tool. A definition change runs them." },
      ],
    },
    useIt: "Organise each tool as a module with its definition, validator, response type, execution and tests; run selection and result tests in CI; trace every call; gate writes. This is the standard a support assistant, an agent and an MCP server all need, and the rest of the path assumes it.",
    takeaways: ["Reliability is the whole: contract, safety, limits, observability, tests.", "One module per tool holding definition, validator, response type, execution and cases.", "Writes: propose, confirm, execute once; reads: free, scoped, bounded.", "Tests on every change to definitions, prompts or models."],
    terms: [["tool contract", "the versioned definition and response shape of a tool"], ["selection test", "a question with the tool and arguments the model should choose"], ["trace id", "the identifier tying every call in a conversation together"]],
    reflect: { q: "A model upgrade passes all your prompt evals but the assistant starts calling calculate_shipping for delivery-time questions. Which test should have caught it?", a: "The selection set, with cases for delivery-time questions expecting no shipping-cost call. Tool selection is a behaviour that changes with the model and needs its own tests." },
  },
};

export const M27_QUIZ: Quiz[] = [
  {
    q: "The model's prose answer is parsed with a regex and the dashboard fills with 'unknown' after a wording change. What is the fix?",
    options: ["A better regex", "Ask for a schema-shaped answer, enforce it with a forced tool call, validate it", "Lower the temperature", "A bigger model"],
    answer: 1,
    why: ["The next phrasing breaks it again.", "Correct. Make wording irrelevant: fields, enforcement, validation.", "Steadier prose is still prose.", "Model size does not change the format problem."],
    reason: true,
  },
  {
    q: "Which failure does constrained generation prevent, and which does it not?",
    options: ["Prevents wrong categories; not malformed JSON", "Prevents malformed JSON and invalid enum values; not wrong content", "Prevents everything", "Prevents nothing"],
    answer: 1,
    why: ["It is the other way round.", "Correct. Shape is guaranteed; meaning still needs validation and evals.", "A valid wrong answer is still possible.", "It removes a whole class of failures."],
  },
  {
    q: "Why is the customer id not a parameter of lookup_order?",
    options: ["Schemas cannot hold ids", "The model would fill it, letting any customer read any order; identity comes from the session", "It is too long", "The model does not know ids"],
    answer: 1,
    why: ["They can; it is a design choice.", "Correct. Scoping lives in execution, from the authenticated session.", "No.", "The model would happily pass whatever the user typed."],
  },
  {
    q: "A tool times out while cancelling an order. What should happen before any retry?",
    options: ["Retry immediately", "Check the pending action's state; retry only with the same idempotency key", "Tell the customer it was cancelled", "Cancel again with a new request"],
    answer: 1,
    why: ["The first cancel may have gone through.", "Correct. A write timeout is an unknown outcome; idempotency makes a repeat safe.", "Unknown outcome; do not assert it.", "That risks two cancellations or two refunds."],
    reason: true,
  },
  {
    q: "A stock tool returns the bare string '12'. What goes wrong?",
    options: ["Nothing", "The model may read it as a price, a day or a count; return a named, typed object with units", "It is too short to tokenise", "The API rejects it"],
    answer: 1,
    why: ["It caused real misreadings.", "Correct. Named fields and units make the result unambiguous.", "No.", "No."],
  },
  {
    q: "What does tool_choice: { type: 'none' } do?",
    options: ["Removes all tools permanently", "Forbids tool calls for this turn, forcing a text answer", "Forces the first tool", "Lets the model decide"],
    answer: 1,
    why: ["It is per request.", "Correct. Useful for a closing summary turn.", "That would be a named tool choice.", "That is auto."],
  },
  {
    q: "The model requests two independent lookups in one reply. How should the loop run them?",
    options: ["One at a time, across two rounds", "Concurrently, returning both results in one message matched by id", "Only the first", "Refuse"],
    answer: 1,
    why: ["Slower for no benefit.", "Correct. Parallel execution; results matched to requests by tool_use_id.", "The model asked for both for a reason.", "No."],
  },
  {
    q: "Where should the selection tests for a tool live and when should they run?",
    options: ["Nowhere; selection is the model's job", "With the tool's module, run on every change to definitions, prompts or models", "Only in production logs", "In the README"],
    answer: 1,
    why: ["Selection changes with prompts and models and must be guarded.", "Correct. Definition, validator, execution and cases together, run in CI.", "Logs detect after the fact; tests prevent.", "No."],
  },
];

export const M27_EXERCISES: Exercise[] = [
  {
    title: "Design a schema for appointment requests",
    kind: "think",
    task: "Patients email a clinic asking for appointments. Design the structured output schema that turns one email into data for the booking system: which fields, which are enumerations, where doubt goes, and what the validator rejects.",
    hints: ["What does the booking system actually need?", "Where can the model say it is unsure?", "Which values must never be free text?"],
    solution: "Fields: request_type (enum: new_appointment, reschedule, cancel, question), preferred_dates (array of YYYY-MM-DD, may be empty), preferred_time (enum: morning, afternoon, any), clinician (string or null, only if named), urgency (enum: routine, soon, urgent), reason_summary (string ≤ 200 chars), missing (array of enum field names the email lacks), confidence (0–1). Validator rejects dates not in ISO format or in the past, unknown enum values, extra fields; urgency 'urgent' or confidence under 0.6 routes to a receptionist.",
  },
  {
    title: "Write a tool definition and its response shape",
    kind: "code",
    task: "Define a create_support_ticket tool for an assistant: name, description (what, when, when not), input schema with enumerations and descriptions, and the response type. Then explain why it must be a propose-and-confirm tool.",
    hints: ["What may the model decide, and what must the session supply?", "What does the model need back to continue the conversation?"],
    solution: "definition: name 'create_support_ticket'; description 'Propose a support ticket for the signed-in customer when their issue cannot be resolved in chat. Use only after trying available lookups. Do not use for questions answered by the help centre.'; input: { category: enum[returns, delivery, damaged, payment, other], summary: string ≤ 300 described as 'the customer's issue in their words', priority: enum[low, normal, urgent] }, required all three, no extras. Response: { proposal: string, pendingId: string } then after confirmation { created: true, ticket_id, eta_hours }. Propose-and-confirm because a ticket creates work and emails for people; the customer should see 'Create a ticket about X?' and click, and the execution must be idempotent by pendingId so a retry does not open two tickets.",
  },
  {
    title: "Trace a failing loop",
    kind: "think",
    task: "A conversation log shows: round 1 lookup_order('4417 ') → error 'invalid arguments'; round 2 lookup_order(4417) → found; round 3 lookup_order(4417) → found; round 4 lookup_order(4417) → found; round 5 cap reached, handoff. Diagnose each step and propose two fixes.",
    hints: ["Why did the model repeat an identical call?", "What should the loop do about identical repeats?"],
    solution: "Round 1: the model passed a string with a space; validation returned an error result and the model corrected itself, which is the system working. Rounds 2–4: the model got a valid result but kept re-requesting, which usually means the response did not answer what it needed (for example no delivery estimate field) or the system prompt did not tell it to answer after a lookup. Fixes: enrich the response (eta, items, status) and add 'after lookup_order returns found: true, answer the customer' to the system message; and in the loop, detect an identical repeated call and return the cached result with a note, counting repeats toward the cap.",
  },
  {
    title: "Build the selection test set",
    kind: "build",
    task: "For an assistant with tools lookup_order, list_recent_orders, check_stock, calculate_shipping and create_support_ticket, write ten test questions with the expected tool (or none) and arguments, including at least three 'none' cases and two ambiguous cases where the assistant should ask a question instead of calling.",
    hints: ["Cover each tool once with a clear case.", "Ambiguous: a question that mentions two tools' subjects without enough detail."],
    solution: "1 'where is order 4417?' → lookup_order {order_id: 4417}. 2 'has my latest order shipped?' → list_recent_orders. 3 'is the oak desk in stock?' → check_stock {sku resolved from product name or ask}. 4 'how much is shipping for a 12kg parcel to France?' → calculate_shipping {weight_kg: 12, destination: 'FR'}. 5 'nobody has replied to my email for a week' → create_support_ticket (propose). 6 'what are your opening hours?' → none. 7 'thanks, that's all' → none. 8 'do you ship to Spain?' → none (policy answer, not a cost). 9 'how much to ship it?' with no product → ask which product (none). 10 'can I return order 4417 and how much will shipping cost?' → lookup_order then ask about the return item before any shipping calculation.",
  },
];
