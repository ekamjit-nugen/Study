import type { Exercise, LessonBody, Quiz } from "../types";

// Module 30: Building AI features. The common product features and the pattern behind each.

export const M30_BODIES: Record<string, LessonBody> = {
  "m30-ai-chat-applications": {
    simple: "A chat application is a loop: keep the conversation, send it to the model with your instructions, stream the answer back, and keep what came back.",
    concept:
      "An **AI chat application** looks like magic from the outside and is a small, repeating loop from the inside. The user types a message. Your server adds it to the stored conversation, puts your standing instructions (the system prompt, lesson 25.5) in front, sends the whole thing to the model's API (lesson 25.3), and streams the reply to the screen as it is produced (lesson 25.8). The reply is stored too, so the next turn includes it.\n\nEverything else in a chat product is built around that loop: a database row per conversation, a limit on how much history is sent (lesson 25.12), tools the model may call (Module 27), documents it may search (Module 28), checks on what it says (Module 38), and a record of each call so you can debug it later (Module 41). None of those replace the loop; they decorate it.\n\nThe mistake beginners make is to put the loop in the browser. The API key would then be visible to anyone, and the conversation would vanish with the tab. The loop lives on your server; the browser only shows it.",
    why:
      "Chat is the most natural interface people have: no forms, no menus, just asking. Before language models, building a chat interface meant writing a decision tree for every possible question, and users hit the edges within minutes. A model-backed chat answers questions nobody scripted.\n\nIt also makes every other feature reachable. Document questions, order lookups, summaries and translations can all sit behind one text box, which is why the chat loop is the first thing most AI products build and the thing the rest plug into.",
    how: [
      "The browser sends the user's message and a conversation id to your server.",
      "The server loads the conversation from the database, appends the new message, and trims or summarises old turns to fit a token budget.",
      "The server builds the request: system prompt, optional tools and retrieved documents, then the messages.",
      "It calls the model with streaming on, forwards each text chunk to the browser as it arrives, and records tokens, latency and the reply.",
      "When the reply ends, the server stores it as the assistant's turn and the browser shows feedback buttons and a reference id.",
      "The next message repeats from step 1 with the longer conversation.",
    ],
    visual: {
      kind: "flow",
      steps: ["browser: message + conversation id", "server: load history, append, trim", "build request: system + tools + messages", "model API, streaming", "server: forward chunks, log the call", "store the reply", "browser: show text, feedback, ref"],
      caption: "The chat loop. The browser never holds the key or the history; the server does.",
    },
    everyday: {
      title: "A conversation with a helpful librarian",
      text: "Ask a librarian a question and they answer from what they know. Ask a follow-up and they remember what you asked a moment ago, because they were there. Come back tomorrow and they need the context again. A chat application is a librarian whose memory is a database row: it 'remembers' exactly as much of the conversation as the server sends back each time, and nothing more.",
    },
    engineering: {
      title: "A help desk assistant for a software company",
      text: "A software company adds chat to its support site. The server keeps a conversations table (id, user, created, messages as JSON), a system prompt describing the product and the tone, and a token budget of 6,000 for history. Each turn streams over server-sent events so the first words appear within a second. Every call is logged with a trace id the user can quote. In week two they add retrieval over the documentation and a tool that checks licence status, without changing the loop. By week four the dashboard shows 61% of conversations ending without a human ticket.",
      code: {
        title: "The chat endpoint, with streaming",
        lang: "ts",
        src: `app.post("/api/chat", requireUser, async (req, res) => {
  const { conversationId, message } = ChatInput.parse(req.body);
  const conv = await conversations.load(conversationId, req.user.id);
  conv.messages.push({ role: "user", content: message });
  const history = trimToBudget(conv.messages, 6000);

  res.setHeader("Content-Type", "text/event-stream");
  let reply = "";
  const stream = client.messages.stream({
    model: process.env.MODEL_CHAT!,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: history,
  });
  stream.on("text", (chunk) => {
    reply += chunk;
    res.write("data: " + JSON.stringify({ text: chunk }) + "\\n\\n");
  });
  await stream.finalMessage();
  conv.messages.push({ role: "assistant", content: reply });
  await conversations.save(conv);
  res.write("data: [DONE]\\n\\n");
  res.end();
});`,
        lines: [
          { code: "const conv = await conversations.load(conversationId, req.user.id);", say: "The history lives on the server, loaded by conversation and by the signed-in user so nobody can read another person's chat." },
          { code: "const history = trimToBudget(conv.messages, 6000);", say: "Only as much history as the budget allows is sent; the stored conversation keeps everything." },
          { code: "system: SYSTEM_PROMPT,", say: "Your standing instructions go in front of every call." },
          { code: "res.write(\"data: \" + JSON.stringify({ text: chunk }) + \"\\n\\n\");", say: "Each chunk is forwarded to the browser as a server-sent event the moment it arrives." },
          { code: "conv.messages.push({ role: \"assistant\", content: reply });", say: "The finished reply becomes part of the conversation for the next turn." },
        ],
        note: "Tools, retrieved documents and guardrails are added inside this handler later; the loop stays the same.",
      },
    },
    useIt: "Build the loop once and reuse it: customer support, internal help desks, onboarding assistants, coding assistants inside your product. Before adding features, make sure the basics hold: server-side key and history, a token budget, streaming, logging and feedback. Then plug in retrieval, tools and checks one at a time, measuring each.",
    takeaways: ["A chat app is a loop: load history, add instructions, call the model, stream, store.", "The loop lives on the server; the browser only displays it.", "History is trimmed to a budget each turn; the database keeps the full record.", "Retrieval, tools, guardrails and tracing plug into the loop without changing it."],
    terms: [["conversation id", "the key under which a chat's messages are stored and reloaded"], ["server-sent events", "a simple one-way stream from server to browser, used to show text as it is generated"]],
    reflect: { q: "Why not keep the conversation in the browser's memory and send it all each time?", a: "The API key would have to be in the browser, the history would vanish with the tab, and the server could not enforce budgets, log calls or apply checks. The browser is a display; the server owns the loop." },
  },

  "m30-document-question-answering": {
    simple: "Document question-answering lets people ask questions of their own files: find the right passages first, then have the model answer from them with references.",
    concept:
      "**Document question-answering** is the feature behind 'ask your PDF', 'chat with the handbook' and 'what does this contract say about termination?'. The user has documents; the model has never seen them; the feature bridges the two.\n\nIt is retrieval-augmented generation (Module 28) wearing a product face. Documents are ingested, split into chunks and embedded once. A question is embedded, the nearest chunks are found and reranked, and the model answers from those chunks with numbered references, or says the documents do not cover it. The product work is in the edges: handling uploads and permissions, showing the source passages so the user can check, and dealing with the question that spans several documents.\n\nThe feature's honesty depends entirely on retrieval. If the right passage is not found, the model will still answer, from its own memory, which is how confident wrong answers happen. So the design keeps the model on a short leash: only the sources, cite each claim, decline when nothing applies.",
    why:
      "Organisations run on documents nobody reads: policies, manuals, contracts, meeting notes. Search finds documents; people still have to read them. A model can read for them, but only if it is given the right pages, because it has never seen the company's files and its context window cannot hold all of them.\n\nDocument question-answering exists because pasting a whole document library into a prompt is impossible and letting the model answer from memory is dangerous. Retrieval picks the pages; the model reads them; the citations let a person verify.",
    how: [
      "Ingest: extract text from each file, split by headings into chunks of a few hundred tokens, store chunks with the document id, page, and who may read it; embed them.",
      "Ask: embed the question; run vector and keyword search filtered by the user's permissions; take the top twenty chunks.",
      "Rerank the twenty against the question; keep the best five if their scores are good enough, else answer 'not covered'.",
      "Prompt: rules (answer only from sources, cite as [n], say when sources are silent), the numbered chunks, the question.",
      "Show the answer with the references as links that open the source page; log which chunks were used.",
      "Measure: a set of real questions with the chunk that should answer each; recall and faithfulness on every change.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Question", detail: "'How many days of notice does the lease require?'" },
        { label: "Retrieve", detail: "20 chunks from the lease and two related letters, filtered to this user's files" },
        { label: "Rerank and gate", detail: "top 5 kept; best score 0.82" },
        { label: "Generate", detail: "'The lease requires 60 days' written notice [1]; a shorter period applies for breach [3].'" },
        { label: "Verify", detail: "[1] opens page 7 of the lease" },
      ],
      caption: "The user sees an answer and a page they can check. The system saw a search and a short prompt.",
    },
    everyday: {
      title: "Asking a colleague who has the file open",
      text: "If you ask a colleague 'what does the lease say about notice?' and they have the lease open, they read the clause and tell you, pointing at it. If they do not have it open, they might guess from memory and be wrong. Document question-answering is the first colleague: it opens the file to the right page before answering, and shows you the page.",
    },
    engineering: {
      title: "A legal team's contract assistant",
      text: "A legal team uploads 4,000 contracts. Each is chunked by clause, tagged with the client and matter, and embedded. A lawyer asks 'which of our supplier contracts allow termination for convenience?'. The question is run as a search across the supplier set, then the model summarises each hit with the clause quoted and a link. Permissions are a filter in the query, so an associate on one matter never retrieves another matter's files. The team's evaluation set is 80 questions with the clause that answers each; recall at five is 91%, and the three misses are scanned PDFs with bad text extraction, which is the next fix.",
    },
    maths: {
      formula: "recall@5 = (questions whose answering chunk is in the top 5) ÷ (all test questions)",
      meaning: "The share of test questions for which retrieval surfaced the right chunk among the five sent to the model. If retrieval misses, the answer cannot be right except by luck.",
      worked: [
        "80 test questions; for 73 the correct chunk appears in the top five: recall@5 = 73 ÷ 80 = 0.9125, about 91%.",
        "After re-extracting the scanned PDFs, 77 of 80 hit: 77 ÷ 80 = 0.9625, about 96%.",
        "Faithfulness is measured separately: of 77 answers with the right chunk present, 75 contained only supported claims: 75 ÷ 77 ≈ 97%.",
      ],
      note: "Two numbers, two halves of the system. A drop in either points at a different fix.",
    },
    useIt: "Policy and HR assistants, contract review, product manuals, research libraries, support knowledge bases. Start with a permission filter in the retrieval query, chunk by headings, show sources, allow 'not covered', and build the question set before you tune anything.",
    takeaways: ["Document Q&A is retrieval first, generation second, citations always.", "Permissions are a filter in the search query, never an instruction to the model.", "The model answers only from the retrieved chunks and may decline.", "Measure retrieval recall and answer faithfulness separately, on real questions."],
    terms: [["source passage", "the chunk of a document the answer was built from, shown so the user can check"], ["faithfulness", "whether every claim in the answer is supported by the retrieved passages"]],
    reflect: { q: "A user asks a question whose answer is spread across three documents. What breaks, and what helps?", a: "A single top chunk cannot hold it; the answer needs several sources. Retrieve more candidates, rerank, and prompt the model to combine numbered sources; if the question is really three questions, split it (a planning step) and answer each." },
  },

  "m30-summarisation": {
    simple: "Summarisation turns a long text into a short one that keeps what matters; the product decides what 'matters' means and checks nothing was invented.",
    concept:
      "**Summarisation** asks the model to write a shorter text that preserves the important content of a longer one. It sounds like one feature; it is a family. A two-line summary of a support ticket for a dashboard. Bullet points of a meeting transcript with decisions and owners. An abstract of a research paper. Each has a different idea of 'important', and the prompt has to say which.\n\nTwo things make summaries good or bad. The instruction: a summary 'for a manager who will decide whether to escalate' is a different text from a summary 'for the customer'. And the length and shape: a word limit, a fixed set of headings, a bullet count. Without them the model writes a generic paragraph.\n\nAnd one thing makes summaries dangerous: the model can add things that were not in the source, especially plausible details. So a summarisation feature checks its output against the input, by rules (every named number must appear in the source) or by a second model call, and shows the source alongside.",
    why:
      "People produce far more text than anyone can read: tickets, transcripts, reports, threads. Summaries are how decisions get made, and before language models they were written by people, slowly, or not at all. A model writes a usable summary in seconds.\n\nThe feature exists wherever reading is the bottleneck: triaging support queues, catching up on meetings, reviewing documents, briefing executives. It fails wherever the summary is trusted without the source, so good products keep the two together.",
    how: [
      "Define the purpose, the reader and the shape in the system prompt: 'for the on-call engineer; three bullets: what broke, impact, next step; under 60 words'.",
      "Delimit the source text and give it to the model; for long texts, chunk and summarise in parts, then summarise the summaries (map-reduce).",
      "Ask for structure when code will use it: a JSON object with fields rather than prose.",
      "Check the output: numbers, names and dates in the summary must appear in the source; flag or regenerate otherwise.",
      "Show the summary with the source available, and let the reader expand to the original.",
      "Evaluate on a set of real documents with human-written reference summaries, by rubric and by spot reads.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Summary for", "Shape", "Keep", "Drop"],
        rows: [
          ["support dashboard", "one line, under 20 words", "problem, product, urgency", "greetings, history, tone"],
          ["meeting notes", "bullets: decisions, actions with owners, open questions", "who agreed to what", "small talk, tangents"],
          ["executive brief", "three paragraphs: situation, numbers, recommendation", "figures with units", "process detail"],
          ["research abstract", "150 words: question, method, result, limit", "the result and its size", "related work"],
        ],
      },
      caption: "'Summarise this' is four different tasks. The prompt must pick one.",
    },
    everyday: {
      title: "Telling a friend about a film",
      text: "You tell one friend 'it's a heist film, funny, two hours' and another 'the twist is that the brother was in on it'. Same film, different summaries, because the friends need different things. A summarisation prompt is the decision about which friend you are talking to; without it, the model picks for you, and usually picks the blandest.",
    },
    engineering: {
      title: "Summarising incident calls for the morning report",
      text: "An operations team records every incident bridge. A nightly job transcribes each call, chunks the transcript into ten-minute pieces, summarises each into 'what was observed, what was tried, what changed', then combines those into one incident summary with a timeline and open actions. A rule checks that every timestamp and service name in the summary exists in the transcript. The morning report is read by the duty manager with a link to the full transcript beside each incident. Reading time dropped from an hour to ten minutes, and the one hallucinated service name in the first week was caught by the check.",
      code: {
        title: "A structured summary with a consistency check",
        lang: "ts",
        src: `const Summary = z.object({
  what_broke: z.string().max(120),
  impact: z.string().max(120),
  next_step: z.string().max(120),
  services: z.array(z.string()).max(5),
});

export async function summariseIncident(transcript: string) {
  const reply = await client.messages.create({
    model: process.env.MODEL_SUMMARY!,
    max_tokens: 300,
    temperature: 0.2,
    system: "Summarise an incident call for the duty manager. Only facts stated in the transcript. Name services exactly as they appear.",
    tools: [summaryTool],
    tool_choice: { type: "tool", name: "incident_summary" },
    messages: [{ role: "user", content: "<transcript>\\n" + transcript.slice(0, 30000) + "\\n</transcript>" }],
  });
  const s = Summary.parse(reply.content.find((b) => b.type === "tool_use")?.input);
  const unknown = s.services.filter((name) => !transcript.includes(name));
  if (unknown.length) throw new Error("summary names services not in the transcript: " + unknown.join(", "));
  return s;
}`,
        lines: [
          { code: "const Summary = z.object({", say: "The summary is data with fixed fields, because a dashboard will display it, not a person reading prose." },
          { code: "system: \"Summarise an incident call for the duty manager. Only facts stated in the transcript. Name services exactly as they appear.\",", say: "Reader, purpose and the grounding rule in one instruction." },
          { code: "tool_choice: { type: \"tool\", name: \"incident_summary\" },", say: "Structured output (Module 27): the model must fill the schema." },
          { code: "const unknown = s.services.filter((name) => !transcript.includes(name));", say: "The check: every service the summary names must appear in the source text." },
          { code: "if (unknown.length) throw new Error(\"summary names services not in the transcript: \" + unknown.join(\", \"));", say: "An invented name fails loudly instead of reaching the morning report." },
        ],
      },
    },
    useIt: "Ticket triage, meeting notes, document review, executive briefs, release notes from commit logs, long-thread catch-ups. Always state reader, purpose, shape and length; keep the source one click away; check names and numbers against the source; evaluate against human summaries.",
    takeaways: ["'Summarise' is not one task; the prompt must name the reader, purpose, shape and length.", "Long inputs: chunk, summarise, then summarise the summaries.", "Check the summary against the source for invented names, numbers and dates.", "Keep the source beside the summary so readers can verify."],
    terms: [["map-reduce summarisation", "summarise each chunk, then summarise the chunk summaries"], ["reference summary", "a human-written summary used to evaluate the model's"]],
    reflect: { q: "A model summary of a contract says 'the penalty is 5%' and the contract says 2%. Which safeguard catches it?", a: "A rule that every number in the summary must appear in the source would flag 5%; a second-model faithfulness check would too. Showing the source beside the summary lets a reader catch what the rules miss." },
  },

  "m30-information-extraction": {
    simple: "Information extraction pulls specific fields out of messy text (names, dates, amounts, items) into a fixed data shape that code can use.",
    concept:
      "**Information extraction** reads unstructured text and fills in a form. An invoice email becomes {supplier, invoice number, date, total, currency, line items}. A job advert becomes {title, location, salary range, skills}. A doctor's note becomes {symptoms, medications, follow-up date}. The input is prose; the output is data.\n\nIt is structured output (Module 27) applied to reading rather than answering. The schema defines the fields and their types; the model fills them from the text; your code validates the result. Two design choices matter. First, every field needs a way to say 'not present', or the model will invent a value to fill the gap. Second, extracted values should be checked against the source where possible: a total that does not appear in the text is suspect.\n\nExtraction is often the quiet workhorse of an AI product: no chat, no personality, just thousands of documents a day turning into rows in a database.",
    why:
      "Businesses receive information as text written for people: emails, PDFs, forms, notes. Before it can be used by software it must become fields, and for decades that meant people retyping it or brittle rules that broke on every new layout. A model reads any layout and understands which number is the total.\n\nExtraction exists because the gap between 'text humans write' and 'data systems need' is where enormous amounts of human time go, and a model closes most of it, with validation closing the rest.",
    how: [
      "Design the schema: fields, types, allowed values, and an explicit 'missing' or null option for each optional field.",
      "Delimit the source text and instruct the model to extract only what is stated, never to infer values that are absent.",
      "Force the schema with a tool call or JSON mode; parse and validate with Zod.",
      "Cross-check extracted values against the text: strings must appear verbatim or nearly so; totals should match the sum of items when both are present.",
      "Route low confidence or failed checks to a person; store the rest.",
      "Evaluate on labelled documents: per-field accuracy, and the rate of invented values.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Input: an email", points: ["'Hi, attached is invoice INV-2291 from Northwind Supplies for the March delivery, total £1,284.50 inc VAT, due 30 April.'", "'Let me know if the PO number is needed.'"] },
      right: { title: "Output: a record", points: ["supplier: Northwind Supplies", "invoice_number: INV-2291", "total: 1284.50, currency: GBP", "due_date: 2026-04-30", "po_number: null (not stated)", "confidence: 0.94"] },
      caption: "The PO number is null, not guessed. The schema gave the model a way to say 'not here'.",
    },
    everyday: {
      title: "Filling in a form from a letter",
      text: "A clerk reads a letter and fills in the boxes on a form: name here, date there, amount in the last box. When the letter does not say the date, a good clerk leaves the box empty and flags it; a bad clerk writes a plausible date. Extraction is the clerk, and the schema is the form, with an 'unknown' box that makes the honest choice possible.",
    },
    engineering: {
      title: "Accounts payable at a logistics firm",
      text: "A logistics firm receives 3,000 supplier invoices a month as PDFs and emails in dozens of layouts. An extraction job pulls supplier, invoice number, dates, line items and totals into a schema with nulls allowed. Checks: the line items must sum to the subtotal within a penny; the invoice number must appear verbatim in the text; the due date must be after the invoice date. Records that fail a check or score below 0.8 confidence go to a clerk's queue (about 7%). The rest post automatically. Per-field accuracy on a labelled set of 400 invoices is above 98% for totals and dates; supplier names are the weakest field because of abbreviations, so a lookup table normalises them.",
      code: {
        title: "Extraction with 'missing' allowed and a cross-check",
        lang: "ts",
        src: `const Invoice = z.object({
  supplier: z.string().nullable(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  total: z.number().nullable(),
  currency: z.enum(["GBP", "EUR", "USD"]).nullable(),
  line_items: z.array(z.object({ description: z.string(), amount: z.number() })),
  confidence: z.number().min(0).max(1),
});

export async function extractInvoice(text: string) {
  const reply = await client.messages.create({
    model: process.env.MODEL_EXTRACT!,
    max_tokens: 800,
    temperature: 0,
    system: "Extract invoice fields. Use null for anything not stated in the document. Never guess. Copy identifiers exactly.",
    tools: [invoiceTool],
    tool_choice: { type: "tool", name: "invoice" },
    messages: [{ role: "user", content: "<document>\\n" + text + "\\n</document>" }],
  });
  const inv = Invoice.parse(reply.content.find((b) => b.type === "tool_use")?.input);
  const problems: string[] = [];
  if (inv.invoice_number && !text.includes(inv.invoice_number)) problems.push("invoice number not in text");
  const sum = inv.line_items.reduce((n, i) => n + i.amount, 0);
  if (inv.total !== null && inv.line_items.length > 0 && Math.abs(sum - inv.total) > 0.01) problems.push("items do not sum to total");
  return { inv, needsReview: problems.length > 0 || inv.confidence < 0.8, problems };
}`,
        lines: [
          { code: "supplier: z.string().nullable(),", say: "Every optional field can be null. That is the model's way to say 'not stated' instead of inventing." },
          { code: "system: \"Extract invoice fields. Use null for anything not stated in the document. Never guess. Copy identifiers exactly.\",", say: "The instruction repeats what the schema allows, because both together are more reliable than either." },
          { code: "if (inv.invoice_number && !text.includes(inv.invoice_number)) problems.push(\"invoice number not in text\");", say: "Identifiers are checked verbatim against the source. A made-up number cannot pass." },
          { code: "if (inv.total !== null && inv.line_items.length > 0 && Math.abs(sum - inv.total) > 0.01) problems.push(\"items do not sum to total\");", say: "Arithmetic the model cannot fake: items must add up to the total." },
          { code: "return { inv, needsReview: problems.length > 0 || inv.confidence < 0.8, problems };", say: "Anything doubtful goes to a person; the rest flows on." },
        ],
      },
    },
    useIt: "Invoices and receipts, CVs and job adverts, medical notes, property listings, support tickets into fields, scientific papers into tables, forms of every kind. Design nulls in, cross-check against the source, route doubt to people, measure per field.",
    takeaways: ["Extraction = schema + 'extract only what is stated' + validation.", "Every optional field can be null, or the model fills gaps with guesses.", "Cross-check identifiers verbatim and totals arithmetically.", "Low confidence and failed checks go to a person; measure accuracy per field."],
    terms: [["per-field accuracy", "the share of documents where a given field was extracted correctly"], ["cross-check", "verifying an extracted value against the source text or against other fields"]],
    reflect: { q: "Why is temperature 0 used for extraction but not for writing marketing copy?", a: "Extraction wants the single most likely reading of the text, consistently; variety is a defect. Marketing copy wants variety. The sampling dial (lesson 18.11) follows the task." },
  },

  "m30-classification": {
    simple: "Classification assigns each input to one of a fixed set of labels; with a language model it is a prompt, an enumerated schema, and a measured accuracy.",
    concept:
      "**Classification** with a language model means asking it to choose a label from a list you define: this email is 'billing', 'technical' or 'other'; this review is 'positive', 'neutral' or 'negative'; this message is 'safe' or 'needs review'. The model reads the text and picks.\n\nIt is the oldest machine-learning task (Module 1) done without training a model of your own. You describe each label in the prompt, give a few examples of each, force the answer through a schema with an enum (Module 27), and validate. For many business tasks that gets you most of the way on day one, with no labelled dataset to assemble.\n\nThe trade-off is cost and speed: a language model call per item is slower and dearer than a small trained classifier. So the common path is to start with the language model, collect the labelled results it produces, and later train a cheap dedicated model on them when volume justifies it, keeping the language model for the hard cases.",
    why:
      "Sorting things into buckets is everywhere: routing tickets, moderating content, tagging products, prioritising alerts, filtering spam. Training a classifier used to need thousands of labelled examples and a data scientist. A language model classifies from a description of the labels, so a team can ship a router in an afternoon and refine it with evidence.\n\nIt exists as a feature because so much of operations is 'look at this and decide which pile it belongs in', and that is exactly what a model with an enum schema does, consistently, at any hour.",
    how: [
      "Define the labels and write a one-line definition of each, with the boundaries ('a refund request is billing, not technical, even if the app crashed').",
      "Add two or three examples per label, including hard ones near the boundaries.",
      "Force the output through a schema with an enum, plus a confidence number and an 'other' or 'unsure' label.",
      "Run at temperature 0; validate; route low-confidence items to a person.",
      "Build a labelled test set from real items; measure accuracy, and precision and recall per label (Module 37).",
      "When volume is high, train a small classifier on the accumulated labels and keep the language model for the uncertain ones.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Input", "Label", "Confidence", "Routed to"],
        rows: [
          ["'Charged twice for March'", "billing", "0.97", "billing queue"],
          ["'App crashes when I export'", "technical", "0.95", "engineering queue"],
          ["'Do you ship to Ireland?'", "sales", "0.91", "sales queue"],
          ["'Hi, just checking in'", "other", "0.58", "a person"],
          ["'Crash during checkout, then charged twice'", "billing", "0.62", "a person (two labels fit)"],
        ],
      },
      caption: "The enum stops invented labels; the confidence sends the ambiguous ones to people.",
    },
    everyday: {
      title: "Sorting the post",
      text: "A receptionist sorts the morning post into trays: invoices, complaints, applications, junk. Most envelopes are obvious. A few are not, and a good receptionist puts them on the manager's desk rather than guessing. A classification feature is the receptionist with written tray definitions and a 'not sure' tray that a person empties.",
    },
    engineering: {
      title: "Routing support tickets at a telecoms provider",
      text: "A telecoms provider receives 20,000 tickets a day. A prompt defines seven queues with boundary rules and three examples each. Output is an enum plus confidence. Tickets under 0.7 confidence (about 9%) go to a triage team, whose decisions are stored as labels. After two months there are 400,000 labelled tickets; a small trained classifier now handles 85% of tickets at a tenth of the cost, the language model handles the rest, and both are measured weekly against a 1,000-ticket test set: 94% accuracy overall, with 'billing' and 'cancellation' the pair most often confused.",
      code: {
        title: "A classifier from a prompt and an enum",
        lang: "py",
        src: `LABELS = {
    "billing": "charges, refunds, invoices, payment methods; includes refund requests even when caused by a bug",
    "technical": "errors, crashes, connectivity, device setup",
    "sales": "pricing, plans, availability, upgrades before purchase",
    "cancellation": "closing an account or ending a contract",
    "other": "anything that fits none of the above, or is unclear",
}

def classify(ticket_text: str) -> dict:
    description = "\\n".join(f"- {name}: {rule}" for name, rule in LABELS.items())
    reply = client.messages.create(
        model=MODEL_CLASSIFY,
        max_tokens=100,
        temperature=0,
        system="Classify a support ticket into exactly one label.\\n" + description + "\\nIf two labels fit or none fits, choose 'other' and lower the confidence.",
        tools=[label_tool],                       # enum of LABELS keys + confidence 0..1
        tool_choice={"type": "tool", "name": "label"},
        messages=[{"role": "user", "content": "<ticket>\\n" + ticket_text[:4000] + "\\n</ticket>"}],
    )
    result = next(b for b in reply.content if b.type == "tool_use").input
    assert result["label"] in LABELS
    return result                               # {"label": "billing", "confidence": 0.93}`,
        lines: [
          { code: "\"billing\": \"charges, refunds, invoices, payment methods; includes refund requests even when caused by a bug\",", say: "Each label has a definition with its boundary. The boundary sentence does most of the work." },
          { code: "\"other\": \"anything that fits none of the above, or is unclear\",", say: "An escape label, so the model is never forced into a wrong bucket." },
          { code: "temperature=0,", say: "The same ticket should get the same label every time." },
          { code: "tools=[label_tool],                       # enum of LABELS keys + confidence 0..1", say: "The schema's enum makes invalid labels impossible; the confidence field makes doubt visible." },
          { code: "assert result[\"label\"] in LABELS", say: "Validate anyway, even though the enum should guarantee it." },
        ],
      },
    },
    useIt: "Ticket routing, content moderation, review sentiment, product tagging, alert priority, lead qualification, intent detection in chat. Start with a prompt and enum, measure per label, route doubt to people, and graduate to a trained classifier when the volume and the labels are there.",
    takeaways: ["Classification with a model: define labels with boundaries, give examples, force an enum, validate.", "Always include an 'other' or 'unsure' label and a confidence field.", "Measure precision and recall per label on real items, not just overall accuracy.", "High volume: train a small classifier on the labels the model produced; keep the model for hard cases."],
    terms: [["enum label", "one of a fixed list of allowed categories"], ["confusion", "two labels the model mixes up, visible in a confusion matrix (Module 37)"]],
    reflect: { q: "The model classifies 'crash during checkout, then charged twice' as 'technical'. The business wants it in 'billing'. What do you change?", a: "The label definitions: add the boundary rule that money problems win even when caused by a bug, and add that ticket as a few-shot example. Then re-run the test set to see the effect across all labels, not just this one." },
  },

  "m30-translation": {
    simple: "Translation with a language model is a prompt with the source text, the target language, the audience and the terms that must stay fixed, plus a check that nothing was dropped or added.",
    concept:
      "**Translation** is one of the tasks language models do best, because so much of their training text exists in several languages. Ask for a text in another language and the result is usually fluent. But a product translation is more than fluent: it keeps the meaning, the tone, the formatting, the product names, the numbers and the legal phrases exactly, and it does so for every string in the app, every time.\n\nSo a translation feature is a prompt that says more than 'translate': who the reader is, how formal to be, which terms are fixed (a glossary), what must not be translated (code, placeholders like {name}, brand names), and what to do with ambiguity. Then a check: the translated text has the same placeholders, the same numbers and roughly the same length as the source, and back-translating it gives the original meaning.\n\nQuality is uneven across languages. High-resource languages translate well; lower-resource ones, and specialised domains, need review, a glossary and evaluation by native speakers (Module 43 goes deeper).",
    why:
      "Products reach people in many languages, and professional translation is slow and expensive: a new feature's strings used to wait weeks. A model translates a thousand strings in minutes, well enough to ship with a reviewer's pass, and translates customer messages in both directions in real time.\n\nIt exists as a feature because language is the first wall a product hits outside its home market, and the model lowers it. It stays a feature with checks because 'fluent and wrong' is worse than 'not translated'.",
    how: [
      "Build the instruction: source and target language, audience and formality, a glossary of fixed terms, and the rule to leave placeholders, code and names untouched.",
      "Send the text delimited, in reasonable pieces (a string, a paragraph, a page), with context for short strings ('a button label on the checkout page').",
      "Validate: placeholders and numbers match the source; length is within a sensible ratio; forbidden translations of glossary terms did not appear.",
      "Optionally back-translate and compare meanings with a second model call for high-stakes text.",
      "Route legal, medical and marketing text to human review; ship UI strings and chat messages with spot checks.",
      "Evaluate per language with native-speaker ratings on a fixed sample, and track the languages that score low.",
    ],
    visual: {
      kind: "flow",
      steps: ["source string + context", "prompt: target, audience, glossary, keep {placeholders}", "model", "checks: placeholders, numbers, length, glossary", "review queue for risky text", "ship"],
      caption: "The model is one step. The checks and the review decide whether the translation can ship.",
    },
    everyday: {
      title: "A friend who speaks both languages",
      text: "A bilingual friend can translate your message in seconds. They will still ask 'formal or casual?', 'should I keep the product name in English?', and 'this joke does not work in Spanish; want a different one?'. A translation feature gives the model those answers up front in the prompt, because it cannot ask.",
    },
    engineering: {
      title: "Localising a banking app into twelve languages",
      text: "A banking app has 9,000 interface strings. A job translates each string with its screen context into twelve languages, a glossary of 300 fixed terms (account types, legal phrases) and the rule that {amount} and {date} placeholders stay verbatim. Checks reject any translation with a missing placeholder or a changed number. Legal and error messages go to professional reviewers; everything else ships after a native speaker spot-checks 5%. Ratings per language show two low-resource languages at 3.4 out of 5 against 4.6 for the rest; those two get full review and a larger glossary, and Module 43 explains why they lag.",
      code: {
        title: "Translation with a glossary and placeholder checks",
        lang: "ts",
        src: `const GLOSSARY = { "savings account": "Sparkonto", "overdraft": "Dispokredit" };

export async function translateString(text: string, context: string, target: string) {
  const glossary = Object.entries(GLOSSARY).map(([en, t]) => en + " -> " + t).join("; ");
  const reply = await client.messages.create({
    model: process.env.MODEL_TRANSLATE!,
    max_tokens: 400,
    temperature: 0.2,
    system: "Translate UI text from English to " + target + ". Formal register. Keep placeholders like {amount} exactly. Do not translate brand names. Glossary: " + glossary + ". Output only the translation.",
    messages: [{ role: "user", content: "Context: " + context + "\\n<text>" + text + "</text>" }],
  });
  const out = reply.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const placeholders = (s: string) => (s.match(/\\{[a-z_]+\\}/g) ?? []).sort().join(",");
  if (placeholders(out) !== placeholders(text)) throw new Error("placeholders changed: " + text);
  if (out.length > text.length * 2.5 || out.length < text.length * 0.3) throw new Error("length looks wrong: " + text);
  return out;
}`,
        lines: [
          { code: "const GLOSSARY = { \"savings account\": \"Sparkonto\", \"overdraft\": \"Dispokredit\" };", say: "Fixed terms the product has decided on. The model must not improvise these." },
          { code: "system: \"Translate UI text from English to \" + target + \". Formal register. Keep placeholders like {amount} exactly. Do not translate brand names. Glossary: \" + glossary + \". Output only the translation.\",", say: "Target, register, placeholders, names, glossary, output shape: everything a bilingual colleague would ask." },
          { code: "messages: [{ role: \"user\", content: \"Context: \" + context + \"\\n<text>\" + text + \"</text>\" }],", say: "Short strings are ambiguous without context: 'Close' the button or 'close' the distance." },
          { code: "if (placeholders(out) !== placeholders(text)) throw new Error(\"placeholders changed: \" + text);", say: "A translation that lost {amount} would break the app at runtime; it is rejected here." },
          { code: "if (out.length > text.length * 2.5 || out.length < text.length * 0.3) throw new Error(\"length looks wrong: \" + text);", say: "A crude but useful check: a translation three times longer probably contains an explanation, not a translation." },
        ],
      },
    },
    useIt: "Interface localisation, multilingual support chat, translating documents and reviews, subtitles. State audience and register, fix terms with a glossary, protect placeholders and names, check placeholders and numbers, review risky text, and rate quality per language with native speakers.",
    takeaways: ["Translation needs audience, register, a glossary and protection for placeholders and names.", "Check placeholders, numbers and length; back-translate high-stakes text.", "Review legal, medical and marketing text; spot-check the rest.", "Quality varies by language; measure per language with native speakers."],
    terms: [["glossary (translation)", "a list of terms with their fixed translations"], ["back-translation", "translating the output back to the source language to check the meaning survived"]],
    reflect: { q: "A model translates a marketing slogan perfectly literally and it falls flat. Is the model wrong?", a: "It did what it was asked. Slogans need transcreation, which is a different instruction: 'adapt this for a Spanish audience, keeping the intent, not the words'. Marketing text also belongs in the human-review queue." },
  },

  "m30-semantic-search": {
    simple: "Semantic search finds results by meaning rather than by matching words: embed the query and the documents, return the nearest, and combine with keyword search for exact terms.",
    concept:
      "**Semantic search** as a product feature answers the complaint every search box gets: 'I typed what I meant and it found nothing'. Keyword search matches characters; people's words differ from the document's words. Semantic search embeds both into vectors (Module 13) and returns the documents whose meaning is closest.\n\nThe feature has four parts. An index: every searchable item embedded with a pinned model and stored in a vector store (Module 29) with metadata. A query path: embed the query with the same model, fetch the nearest items, filter by metadata and permissions. A keyword path alongside, because product codes, names and exact phrases embed badly; the two result lists are fused by rank. And a feedback loop: clicks and zero-result queries become the test set that measures recall and guides tuning.\n\nIt is not a replacement for keyword search; it is its partner. The best search boxes run both and let each cover the other's blind spot.",
    why:
      "Search is how people reach most of what a product holds, and keyword search fails whenever vocabulary differs: 'sofa smells' versus 'off-gassing', 'stop my order' versus 'cancel'. Synonym lists never finish. Embeddings capture meaning learned from vast text, so the match no longer depends on sharing a word.\n\nThe feature exists because zero-result searches are lost customers, unanswered questions and support tickets, and because embedding search became cheap enough to run on every query.",
    how: [
      "Choose and pin an embedding model; embed every searchable item (title plus body) in batches; store vectors with ids, metadata and permissions.",
      "At query time, embed the query with the same model; fetch the top k nearest with metadata and permission filters applied in the query.",
      "Run keyword search in parallel; fuse the two ranked lists with reciprocal rank fusion.",
      "Optionally rerank the top results with a cross-encoder for precision at the top.",
      "Show results with highlights; log the query, results and clicks.",
      "Build a test set from real queries with expected results; measure recall at k; re-run on every change to the model, chunking or fusion.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Keyword search", points: ["'table wobbles' → 0 results", "'WL-2041' → the exact product", "fast, exact, explainable", "blind to meaning"] },
      right: { title: "Semantic + keyword, fused", points: ["'table wobbles' → 'Uneven legs: adjusting the feet'", "'WL-2041' → still the exact product", "one embedding call per query", "needs a pinned model and an index"] },
      caption: "Fusing both keeps the exact matches and adds the meaning matches.",
    },
    everyday: {
      title: "A shop assistant who understands what you mean",
      text: "Ask a good shop assistant for 'something to stop my chair scratching the floor' and they bring felt pads, though you never said 'felt' or 'pads'. A keyword catalogue needs the exact words. Semantic search is the assistant: it has learned which things mean the same, so your words can be yours.",
    },
    engineering: {
      title: "Search across a company's internal documents",
      text: "A consultancy's intranet holds 200,000 documents across wikis, slide decks and PDFs. Keyword search had a 34% zero-result rate. The team embedded chunks of every document with a pinned model into Postgres with pgvector, kept full-text search, fused the two, and filtered by the user's access groups inside the query. A reranker reorders the top twenty. The zero-result rate fell to 5%; recall at five on a 300-query test set rose from 48% to 90%. The remaining misses are mostly acronyms, handled by a small synonym table on the keyword side. Clicks feed the test set weekly.",
      code: {
        title: "Hybrid search with permission filtering",
        lang: "ts",
        src: `export async function search(query: string, user: User, limit = 10) {
  const [qv] = await embed([query], "query");
  const groups = user.groups;

  const byMeaning: { id: number; rank: number }[] = await db.$queryRaw(
    "SELECT id, row_number() OVER (ORDER BY embedding <=> $1) AS rank FROM docs WHERE access_group = ANY($2) ORDER BY embedding <=> $1 LIMIT 20",
    toVector(qv), groups);

  const byWords: { id: number; rank: number }[] = await db.$queryRaw(
    "SELECT id, row_number() OVER (ORDER BY ts_rank(tsv, plainto_tsquery($1)) DESC) AS rank FROM docs WHERE tsv @@ plainto_tsquery($1) AND access_group = ANY($2) LIMIT 20",
    query, groups);

  const score = new Map<number, number>();
  for (const list of [byMeaning, byWords]) for (const r of list) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (60 + Number(r.rank)));
  const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  return db.docs.findMany({ where: { id: { in: ids } } });
}`,
        lines: [
          { code: "const [qv] = await embed([query], \"query\");", say: "The query is embedded with the same pinned model as the documents." },
          { code: "\"SELECT id, row_number() OVER (ORDER BY embedding <=> $1) AS rank FROM docs WHERE access_group = ANY($2) ORDER BY embedding <=> $1 LIMIT 20\",", say: "Nearest by cosine distance, with the user's access groups as a filter inside the query, so forbidden documents are never candidates." },
          { code: "\"SELECT id, row_number() OVER (ORDER BY ts_rank(tsv, plainto_tsquery($1)) DESC) AS rank FROM docs WHERE tsv @@ plainto_tsquery($1) AND access_group = ANY($2) LIMIT 20\",", say: "The keyword side, with the same permission filter. This is where exact codes and names are found." },
          { code: "for (const list of [byMeaning, byWords]) for (const r of list) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (60 + Number(r.rank)));", say: "Reciprocal rank fusion: high in either list scores well, high in both scores best." },
        ],
      },
    },
    maths: {
      formula: "fused score(d) = Σ over lists 1 ÷ (60 + rank of d in that list)",
      meaning: "Each list contributes a small score that is larger for better ranks; 60 is a smoothing constant that stops a single first place from dominating.",
      worked: [
        "Document A is rank 1 in the meaning list and rank 5 in the keyword list: 1/61 + 1/65 ≈ 0.0164 + 0.0154 = 0.0318.",
        "Document B is rank 2 in the meaning list only: 1/62 ≈ 0.0161.",
        "Document C is rank 1 in the keyword list only: 1/61 ≈ 0.0164.",
        "Order: A (in both lists) first, then C, then B. Appearing in both lists beat a top rank in one.",
      ],
    },
    useIt: "Product search, documentation and intranet search, support article lookup, finding similar tickets or papers, the retrieval step of document Q&A. Pin the model, index with metadata and permissions, fuse with keyword search, rerank the top, and measure recall on real queries.",
    takeaways: ["Semantic search matches meaning; keyword search matches words; run both and fuse.", "Same embedding model for documents and queries; store its name; re-embed on change.", "Permissions and metadata are filters inside the query.", "Clicks and zero-result queries become the test set; measure recall at k on every change."],
    terms: [["reciprocal rank fusion", "merging ranked lists by summing 1 ÷ (k + rank) per list"], ["zero-result rate", "the share of searches that return nothing; the first number a search team watches"]],
    reflect: { q: "After switching to a better embedding model, search quality collapsed. What happened?", a: "Only the query side was switched, or only the documents were re-embedded. Vectors from different models are not comparable. Re-embed everything, then switch the query side in the same deploy, and run the recall test set before and after." },
  },

  "m30-recommendation-systems": {
    simple: "A recommendation system suggests items a person is likely to want, from what they and people like them did before; models add understanding of content and a way to explain the suggestion.",
    concept:
      "A **recommendation system** answers 'what should I show this person next?'. Films, products, articles, jobs, songs. The classic approach needs no language model at all: look at what people did (watched, bought, clicked) and find patterns. **Collaborative filtering** says 'people who liked what you liked also liked this'. **Content-based** recommendation says 'this is similar to what you liked', using the items' attributes.\n\nEmbeddings made content-based recommendation much better: embed every item's description and every user's history, and 'similar' becomes a vector distance, across words the items never share. Language models add two more things: they can read a new item with no history and place it (the cold-start problem), and they can explain a recommendation in a sentence the user understands.\n\nThe feature is less about the model than about the loop: what you show changes what people do, which changes what you learn. A recommender that only shows more of the same traps people; good ones mix in exploration and measure what people actually do, not just what they click.",
    why:
      "Catalogues are too big to browse: a streaming service has tens of thousands of titles, a shop hundreds of thousands of products. Without recommendations people see the front page and leave. Recommendations exist to turn a catalogue into a short list for each person, and they drive a large share of what gets watched, bought and read.\n\nModels enter because behaviour data is sparse for new users and new items, and because people trust a suggestion with a reason more than a bare list.",
    how: [
      "Collect signals: views, purchases, time spent, skips, ratings, with timestamps.",
      "Build item vectors: from behaviour (items bought together) and from content (embedding the description); combine.",
      "Build a user vector from their recent history, weighted toward recent and strong signals.",
      "Candidate generation: the few hundred nearest items by vector, plus popular and new items for exploration; filter out what they already have.",
      "Ranking: a model scores each candidate for this user with features (recency, price, diversity); the top ten are shown.",
      "Explain: a short reason per item, generated from the matching attributes; measure with A/B tests on real outcomes, not clicks alone.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Signals", detail: "watched: two heist films, one cooking show; skipped: a horror trailer" },
        { label: "User vector", detail: "close to 'crime, ensemble, witty' and 'food documentary'" },
        { label: "Candidates", detail: "300 nearest titles + 20 trending + 10 new releases, minus already watched" },
        { label: "Ranked", detail: "a heist comedy, a chef biography, a caper series …" },
        { label: "Explained", detail: "'Because you watched two heist films: a witty caper with a big ensemble.'" },
      ],
      caption: "Candidates come from similarity; the order comes from a ranking model; the sentence comes from a language model.",
    },
    everyday: {
      title: "The record-shop owner",
      text: "A good record-shop owner remembers what you bought, notices what you lingered over, and says 'if you liked that, try this; it's the same producer'. They also slip in something new now and then to see what you make of it. That is a recommender: memory of behaviour, similarity, a reason, and a little exploration.",
    },
    engineering: {
      title: "Recommendations for a second-hand marketplace",
      text: "A second-hand marketplace has a cold-start problem on both sides: every listing is unique and most buyers are new. Behaviour data alone cannot help. The team embeds each listing's title and description with an embedding model and builds a buyer vector from the listings they viewed in the session. Candidates are the nearest listings in the same city; a ranking model reorders by price fit and freshness. A language model writes a one-line reason ('similar to the oak desk you viewed, 20 minutes closer'). An A/B test over four weeks shows a 12% lift in messages sent to sellers, measured on sessions, not clicks.",
      code: {
        title: "Content-based candidates with a session vector",
        lang: "py",
        src: `import numpy as np

def session_vector(viewed_ids, item_vectors, decay=0.7):
    # most recent view counts most
    weights = np.array([decay ** i for i in range(len(viewed_ids))][::-1])
    vectors = np.stack([item_vectors[i] for i in viewed_ids])
    v = (weights[:, None] * vectors).sum(axis=0) / weights.sum()
    return v / np.linalg.norm(v)

def candidates(session_v, item_vectors, exclude, k=300):
    ids = [i for i in item_vectors if i not in exclude]
    matrix = np.stack([item_vectors[i] for i in ids])
    scores = matrix @ session_v                         # cosine similarity, vectors are unit length
    top = np.argsort(-scores)[:k]
    return [(ids[t], float(scores[t])) for t in top]`,
        lines: [
          { code: "weights = np.array([decay ** i for i in range(len(viewed_ids))][::-1])", say: "Recent views weigh more than old ones: the last view has weight 1, the one before 0.7, and so on." },
          { code: "v = (weights[:, None] * vectors).sum(axis=0) / weights.sum()", say: "The session vector is a weighted average of the viewed items' vectors." },
          { code: "ids = [i for i in item_vectors if i not in exclude]", say: "Already viewed or sold items are never candidates." },
          { code: "scores = matrix @ session_v                         # cosine similarity, vectors are unit length", say: "One matrix multiplication scores every item against the session." },
        ],
        note: "At scale the matrix multiplication becomes a vector-index query (Module 29); the idea is the same.",
      },
    },
    maths: {
      formula: "session vector = Σ wᵢ · vᵢ ÷ Σ wᵢ, with wᵢ = decay^(age of view i)",
      meaning: "Each viewed item's vector vᵢ contributes in proportion to a weight that shrinks with how long ago it was viewed.",
      worked: [
        "Three views, newest last, with decay 0.7: weights 0.49, 0.7, 1.0 (oldest to newest).",
        "Item vectors (2-d for the example): v₁ = (1, 0), v₂ = (0.6, 0.8), v₃ = (0, 1).",
        "Weighted sum = 0.49·(1, 0) + 0.7·(0.6, 0.8) + 1.0·(0, 1) = (0.49 + 0.42, 0.56 + 1.0) = (0.91, 1.56).",
        "Divide by 2.19: (0.42, 0.71). Normalise to unit length: ≈ (0.51, 0.86). The session leans toward the newest item's direction.",
      ],
    },
    useIt: "Streaming, shopping, news, music, jobs, courses, 'related items' on any page. Combine behaviour and content vectors, add exploration, explain each item, and measure outcomes with experiments. Watch for filter bubbles and for what the system does to new users and new items.",
    takeaways: ["Recommenders combine behaviour (collaborative) and content (embeddings) similarity.", "Embeddings and language models solve cold start and provide explanations.", "Candidates by similarity, order by a ranking model, with exploration mixed in.", "Measure real outcomes with A/B tests; clicks alone mislead."],
    terms: [["collaborative filtering", "recommending from the behaviour of similar users"], ["cold start", "new users or items with no behaviour history"], ["exploration", "deliberately showing some items outside the user's known taste to learn more"]],
    reflect: { q: "A recommender shows only crime dramas to someone who watched two. What rule would you add?", a: "Diversity in ranking (penalise candidates too similar to those already chosen) and a slot or two of exploration; measure whether people watch the explored items. A system that only narrows learns nothing new about the person." },
  },

  "m30-conversational-memory": {
    simple: "Conversational memory is what your code chooses to send back to a model that forgets everything: recent messages verbatim, a summary of older ones, and a few durable facts about the user.",
    concept:
      "A model has no memory between calls (lesson 25.12). **Conversational memory** is the feature that makes a chat feel continuous anyway, and it is three different things with three lifetimes.\n\nThe **window**: the last several messages, sent word for word, so tone and exact phrasing are preserved. The **rolling summary**: when old messages are trimmed to fit the token budget, their facts and decisions are folded into a short text that is sent first, so the address given in message three survives message sixty. And **user facts**: a few durable preferences kept outside any conversation ('prefers email', 'uses a wheelchair-accessible entrance'), with a source and an expiry, shown to the user and deletable.\n\nWhat memory must not become is a dump of everything: it grows, it costs, it holds personal data, and old facts go stale. Live data (an open order, an account balance) is never memorised; a tool reads it when needed so it is always current.",
    why:
      "Users expect to be remembered: within a conversation ('as I said'), across sessions ('yesterday I asked about'), and across time ('you know I prefer mornings'). Sending the whole history forever hits the context window and the budget, and trimming from the top deletes exactly the early facts people rely on.\n\nMemory as a designed feature exists to give the model the right context at a bounded cost, and to give the user control over what is kept about them.",
    how: [
      "Store every message in a conversation record keyed by the user, so any device can resume it.",
      "Before each call, if the history exceeds the budget, summarise the oldest messages into the rolling summary (facts, decisions, open questions), then cut the window.",
      "Build the request: system prompt with the user's facts under an honest heading, the summary as a first exchange, then the verbatim window.",
      "After a conversation goes quiet, extract durable facts with structured output into a facts table with source and expiry, excluding sensitive categories.",
      "Show the facts to the user with a delete control; filter expired facts out of prompts.",
      "Read live data with tools; never copy it into memory.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Layer", "Holds", "Lives", "Sent as"],
        rows: [
          ["window", "the last 12 messages, verbatim", "the conversation", "the messages list"],
          ["rolling summary", "facts and decisions from trimmed messages", "the conversation", "a delimited first exchange"],
          ["user facts", "a few preferences with source and expiry", "180 days or until deleted", "a short list in the system prompt"],
          ["live data", "orders, balances, bookings", "the real tables", "fetched by a tool when needed"],
        ],
      },
      caption: "Four kinds of context, four lifetimes. Only the first three are 'memory'.",
    },
    everyday: {
      title: "A good receptionist's notebook",
      text: "The current conversation is on the pad in front of the receptionist. Last week's is a few lines in the notebook. 'Prefers afternoon appointments' is a sticky note on your file, dated, and they will check it is still true before booking. Your current booking is not on the note; they look it up in the system. That is layered memory.",
    },
    engineering: {
      title: "A travel assistant that remembers the right things",
      text: "A travel company's assistant keeps a window of twelve messages and a rolling summary per trip conversation, so 'the earlier flight we discussed' resolves even after a long chat. User facts hold 'window seat', 'vegetarian meals', 'avoids red-eye flights', each with the date it was said and a 180-day expiry, visible in the account page. Passport numbers and payment details are excluded by the extraction schema and never stored as memory; current bookings are read by a tool. A test in the build creates two users and asserts no fact from one appears in the other's prompt. Complaints of 'it forgot what I said' fell by 70% after the summary layer shipped.",
      code: {
        title: "Building the context from three layers",
        lang: "ts",
        src: `export async function buildContext(conv: Conversation, facts: UserFact[], budgetTokens = 6000) {
  if (countTokens(conv.messages) > budgetTokens) {
    const old = conv.messages.slice(0, -12);
    conv.summary = await foldIntoSummary(conv.summary, old);
    conv.messages = conv.messages.slice(-12);
    await saveConversation(conv);
  }
  const live = facts.filter((f) => !f.expiresAt || f.expiresAt > new Date());
  const factLines = live.map((f) => "- " + f.text + " (said " + f.source + ")").join("\\n");
  const system = SYSTEM_PROMPT + "\\n\\nKnown about this traveller (may be out of date; confirm before relying on it):\\n" + (factLines || "- nothing yet");
  const messages = [];
  if (conv.summary) {
    messages.push({ role: "user", content: "<earlier_conversation_summary>\\n" + conv.summary + "\\n</earlier_conversation_summary>" });
    messages.push({ role: "assistant", content: "Understood, I have the earlier context." });
  }
  messages.push(...conv.messages);
  return { system, messages };
}`,
        lines: [
          { code: "const old = conv.messages.slice(0, -12);", say: "Everything older than the last twelve messages is about to leave the window." },
          { code: "conv.summary = await foldIntoSummary(conv.summary, old);", say: "Their facts are folded into the summary before they go; nothing stated early is simply lost." },
          { code: "const live = facts.filter((f) => !f.expiresAt || f.expiresAt > new Date());", say: "Expired facts are dropped; memory has a shelf life." },
          { code: "const system = SYSTEM_PROMPT + \"\\n\\nKnown about this traveller (may be out of date; confirm before relying on it):\\n\" + (factLines || \"- nothing yet\");", say: "Facts enter under an honest heading; the model is told to confirm, not assume." },
          { code: "messages.push({ role: \"user\", content: \"<earlier_conversation_summary>\\n\" + conv.summary + \"\\n</earlier_conversation_summary>\" });", say: "The summary is delimited and placed first, as context rather than as the user's latest words." },
        ],
      },
    },
    useIt: "Any assistant people return to: support, travel, shopping, coding assistants that remember project conventions, personal assistants. Design the three layers, exclude sensitive data from facts, let users see and delete, key everything by the signed-in user, and test for cross-user leaks.",
    takeaways: ["The model forgets; your code remembers, deliberately: window, rolling summary, user facts.", "Summarise before trimming so early facts survive.", "Facts are few, sourced, expiring, visible and deletable; sensitive data is never extracted.", "Live data is read by tools, not memorised; everything is keyed by the user."],
    terms: [["rolling summary", "a short text updated with the facts of messages that leave the window"], ["user facts", "durable preferences stored outside any conversation with source and expiry"]],
    reflect: { q: "Should 'has an open complaint about order 4417' be a stored user fact?", a: "No. It is live data that changes when the complaint closes; a tool should read it from the support system when the conversation needs it. Memory holds durable preferences, not current state." },
  },

  "m30-multimodal-application-basics": {
    simple: "Multimodal features send images, audio and documents to a model alongside text; the model describes and extracts, and your code decides what to do with the result.",
    concept:
      "A **multimodal application** lets users give the model more than text: a photo of a damaged parcel, a voice message, a scanned form, a chart. Modern models accept images and documents directly in the message, as content blocks beside the text (Module 48 explains how they work inside). Audio is usually transcribed first by a speech model, then the transcript is sent as text.\n\nThe product pattern is the same as every other feature in this module: get the input into a shape the model accepts (resize the image, extract or transcribe), ask a specific question with a specific output shape, validate the answer, and keep a person in charge of decisions. The model describes what it sees; it does not approve a refund.\n\nThree practical facts shape these features. Images cost tokens in proportion to their size, so resize before sending. Models can misread small text, numbers and handwriting, so extracted values need checks like any extraction. And what the model says about an image is an opinion, not evidence; the image itself is kept for the person who decides.",
    why:
      "Much of what users have is not text: receipts, photos, screenshots, voice notes, scanned forms. Before multimodal models those needed separate systems or a person to turn them into words. Now one request can say 'here is the photo and the customer's message; is the item damaged, and how?'.\n\nThe feature exists because the easiest thing for a user to do is point a camera or speak, and a product that accepts that removes the step where most users give up.",
    how: [
      "Accept the file; validate type and size; store it with the conversation or ticket.",
      "Prepare it: resize images to a sensible longest side; convert PDFs to text or page images; transcribe audio with a speech model.",
      "Send text and media together in one message, with a precise question and a schema for the answer (what is visible, what is damaged, what the receipt says, with confidence).",
      "Validate the structured answer; cross-check extracted numbers; treat descriptions as opinions.",
      "Show the person the media and the model's reading side by side; the person decides anything with consequences.",
      "Log tokens and cost per request; images are expensive, so measure.",
    ],
    visual: {
      kind: "flow",
      steps: ["photo + message", "resize to 1,200 px", "model: describe damage, fill schema", "validate; confidence 0.88", "agent sees photo + reading", "decision by a person"],
      caption: "The model reads; the person decides; the photo stays as evidence.",
    },
    everyday: {
      title: "Sending a photo to a friend who knows cars",
      text: "You send a friend a photo of a scratch and ask 'is this bad?'. They say 'looks like paint, not metal, should polish out'. You still take it to the garage before paying anyone. The friend's reading is useful and fast; it is not the verdict. A multimodal feature is that friend, with a schema for the answer.",
    },
    engineering: {
      title: "Damage claims for a parcel courier",
      text: "A courier's claims team receives 2,000 photos a day with free-text complaints. A feature resizes each photo to 1,200 pixels, sends it with the complaint and asks for a structured reading: item type, visible damage (none, cosmetic, structural), whether packaging is shown, and a confidence. Claims read as 'none' with high confidence are queued low; 'structural' claims are queued first with the photo and the reading side by side for an adjuster. Numbers on receipts are cross-checked against the order value. The model never approves a claim. Adjusters handle 40% more claims a day, and the audit found no model reading used as the sole basis for a payout.",
      code: {
        title: "An image and a question, with a structured answer",
        lang: "ts",
        src: `export async function readDamagePhoto(jpegBase64: string, complaint: string) {
  const reply = await client.messages.create({
    model: process.env.MODEL_VISION!,
    max_tokens: 300,
    temperature: 0,
    system: "You describe parcel photos for a claims team. Report only what is visible. Do not decide the claim.",
    tools: [damageTool],
    tool_choice: { type: "tool", name: "damage_reading" },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpegBase64 } },
        { type: "text", text: "Customer says: " + complaint + "\\nDescribe the item and any visible damage." },
      ],
    }],
  });
  const reading = Damage.parse(reply.content.find((b) => b.type === "tool_use")?.input);
  return reading;   // { item, damage: "none" | "cosmetic" | "structural", packaging_visible, confidence }
}`,
        lines: [
          { code: "system: \"You describe parcel photos for a claims team. Report only what is visible. Do not decide the claim.\",", say: "The model's job is description. The decision is a person's." },
          { code: "{ type: \"image\", source: { type: \"base64\", media_type: \"image/jpeg\", data: jpegBase64 } },", say: "The image is a content block in the same message as the text, already resized to keep tokens down." },
          { code: "{ type: \"text\", text: \"Customer says: \" + complaint + \"\\nDescribe the item and any visible damage.\" },", say: "Text and image together: the complaint gives context for what to look for." },
          { code: "const reading = Damage.parse(reply.content.find((b) => b.type === \"tool_use\")?.input);", say: "A structured, validated reading with an enum for damage and a confidence, like any extraction." },
        ],
        note: "Audio takes one more step: a speech-to-text call first, then the transcript goes in as text.",
      },
    },
    maths: {
      formula: "image tokens ≈ (width × height) ÷ 750",
      meaning: "A common approximation for how many tokens an image costs: proportional to its pixel count. Resizing is the cost control.",
      worked: [
        "A phone photo of 4,000 × 3,000 pixels: 12,000,000 ÷ 750 = 16,000 tokens, roughly the length of a short book chapter.",
        "Resized to 1,200 × 900: 1,080,000 ÷ 750 = 1,440 tokens, about eleven times cheaper.",
        "At 2,000 photos a day the difference is about 29 million tokens a day; the damage is just as visible at 1,200 pixels.",
      ],
      note: "Exact formulas differ by provider; the proportionality to pixels is what matters.",
    },
    useIt: "Damage and warranty claims, receipt and form capture, accessibility descriptions, voice-note support, screenshot debugging, document review. Resize, transcribe, ask a specific question with a schema, validate, keep the media for the decider, and watch the cost per request.",
    takeaways: ["Images and documents go in as content blocks beside text; audio is transcribed first.", "Resize images: tokens scale with pixels.", "Ask a specific question with a schema; validate like any extraction.", "The model describes; a person decides; the media stays as evidence."],
    terms: [["content block", "one part of a message: text, an image, or a document"], ["transcription", "turning speech into text with a speech-recognition model before sending it to a language model"]],
    reflect: { q: "A model reads a receipt total as £48.00; the receipt says £46.00. Which part of the design catches it?", a: "The cross-check: the extracted total is compared with the order record or with the sum of the line items, and a mismatch routes the claim to a person with the image shown. Multimodal extraction needs the same checks as text extraction." },
  },
};

export const M30_QUIZ: Quiz[] = [
  {
    q: "Where does the chat loop (history, instructions, model call, storage) belong, and why?",
    options: ["In the browser, so it is fast", "On the server, so the key stays secret and history, budgets, logging and checks can be enforced", "In the model provider's dashboard", "In a spreadsheet"],
    answer: 1,
    why: ["A browser-held key is public, and history dies with the tab.", "Correct. The browser displays; the server owns the loop and everything around it.", "Providers host models, not your conversations and rules.", "No."],
    reason: true,
  },
  {
    q: "A document assistant gives a confident answer that the documents do not support. Which half failed first?",
    options: ["Generation only", "Retrieval: the right passage was not found, so the model answered from memory", "The database", "The user's question"],
    answer: 1,
    why: ["Generation misbehaved, but it was given nothing to be faithful to.", "Correct. Measure recall; gate weak retrieval so the model declines instead of improvising.", "Storage is not the issue.", "Questions are what the system exists for."],
  },
  {
    q: "What must a summarisation prompt specify beyond 'summarise this'?",
    options: ["The model's name", "The reader, the purpose, the shape and the length", "The temperature only", "Nothing; models know what matters"],
    answer: 1,
    why: ["Irrelevant to the content.", "Correct. 'Summarise' is many tasks; the prompt picks one.", "Sampling settings do not define what to keep.", "Without guidance the model writes the blandest generic paragraph."],
  },
  {
    q: "Why must every optional field in an extraction schema allow null?",
    options: ["To save tokens", "So the model can say 'not stated' instead of inventing a value", "Because JSON requires it", "It does not matter"],
    answer: 1,
    why: ["Tokens are not the reason.", "Correct. Without an honest option the model fills gaps with plausible guesses.", "JSON allows either.", "It is the difference between data and fiction."],
    reason: true,
  },
  {
    q: "A classifier built from a prompt reaches 94% accuracy at 20,000 items a day. What is the usual next step?",
    options: ["Stop measuring", "Train a small classifier on the accumulated labels for the easy cases and keep the model for the hard ones", "Raise the temperature", "Remove the 'other' label"],
    answer: 1,
    why: ["Measurement continues forever.", "Correct. The model's labels become training data; cost drops and the model handles doubt.", "Classification wants temperature 0.", "The escape label prevents forced wrong answers."],
  },
  {
    q: "Which check catches a translation that would crash the app?",
    options: ["Spell check", "Comparing the set of {placeholders} in the output with the source", "Counting vowels", "Asking the model if it is sure"],
    answer: 1,
    why: ["Spelling does not break code.", "Correct. A lost or altered placeholder breaks string formatting at runtime.", "No.", "Self-assessment is not a check."],
  },
  {
    q: "Why run keyword search alongside semantic search?",
    options: ["Semantic search is too slow", "Codes, names and exact phrases embed badly; fusing both lists covers each one's blind spot", "Keyword search understands meaning better", "To use more servers"],
    answer: 1,
    why: ["Speed is fine with an index.", "Correct. Meaning from vectors, exactness from words, merged by rank.", "It matches characters, not meaning.", "No."],
  },
  {
    q: "A recommender keeps showing a user the same genre. What is missing?",
    options: ["A bigger model", "Diversity in ranking and some exploration, measured by real outcomes", "More of the same signals", "Nothing; that is what they like"],
    answer: 1,
    why: ["Model size is not the problem.", "Correct. Narrowing only learns nothing new; exploration and diversity fix it, and outcomes show whether it worked.", "More of the same deepens the bubble.", "People's tastes are wider than their last three clicks."],
  },
  {
    q: "Which of these belongs in stored user facts?",
    options: ["The customer's card number", "Their current open order", "'Prefers window seats', with the date it was said and an expiry", "The full chat transcript forever"],
    answer: 2,
    why: ["Sensitive data is never memorised.", "Live data is read by a tool so it stays current.", "Correct. A durable preference with provenance and a shelf life, visible and deletable.", "Unbounded, costly, and a privacy liability."],
  },
  {
    q: "A photo of a damaged parcel is 4,000 × 3,000 pixels. What should happen before it reaches the model?",
    options: ["Nothing; detail matters", "Resize it: tokens scale with pixels and the damage is visible at 1,200 pixels", "Convert it to text by hand", "Send it twice for accuracy"],
    answer: 1,
    why: ["Full size costs about eleven times more for no benefit.", "Correct. Resizing is the cost control for image features.", "That is what the model does.", "Twice the cost, no more truth."],
  },
];

export const M30_EXERCISES: Exercise[] = [
  {
    title: "Pick the pattern",
    kind: "think",
    task: "For each request, name the feature pattern from this module and the one check you would never skip: (a) 'turn these 300 CVs into a table'; (b) 'let staff ask questions about our 40 HR policies'; (c) 'tag incoming reviews as positive or negative'; (d) 'write a one-line summary of each ticket for the board'; (e) 'show shoppers items like the one they are viewing'.",
    hints: ["Data out of text? Extraction.", "Answers from your documents? Document Q&A with retrieval.", "Fixed labels? Classification with an enum."],
    solution: "(a) Information extraction: nulls allowed, identifiers checked against the text. (b) Document question-answering: permissions filtered in retrieval, citations shown. (c) Classification: enum with 'other', confidence, per-label precision and recall. (d) Summarisation: reader and shape in the prompt, names and numbers checked against the ticket. (e) Recommendation: content embeddings for candidates, exclude already viewed, diversity, outcomes measured.",
  },
  {
    title: "Compute the fused ranking",
    kind: "calculate",
    task: "Meaning search ranks documents [A, B, C, D]; keyword search ranks [C, E, A]. Using reciprocal rank fusion with k = 60, compute each document's score and the final order.",
    hints: ["Score = sum over lists of 1 ÷ (60 + rank).", "A document missing from a list contributes nothing from that list."],
    solution: "A: 1/61 + 1/63 ≈ 0.01639 + 0.01587 = 0.03226. B: 1/62 ≈ 0.01613. C: 1/63 + 1/61 ≈ 0.01587 + 0.01639 = 0.03226. D: 1/64 ≈ 0.01563. E: 1/62 ≈ 0.01613. Order: A and C tie at the top (both in both lists), then B and E tie, then D. Ties are broken by the better single rank or by a reranker.",
  },
  {
    title: "Write the extraction schema",
    kind: "code",
    task: "Write a Zod (or JSON Schema) schema for extracting a job advert: title, company, location, remote (yes/no/hybrid), salary minimum and maximum with currency, required skills (list), and a confidence. Make missing information expressible. Then list two cross-checks you would run on the result.",
    hints: ["Which fields can legitimately be absent?", "Which values must appear verbatim in the text?"],
    solution: "z.object({ title: z.string(), company: z.string().nullable(), location: z.string().nullable(), remote: z.enum(['yes','no','hybrid','unknown']), salary_min: z.number().nullable(), salary_max: z.number().nullable(), currency: z.enum(['GBP','EUR','USD']).nullable(), skills: z.array(z.string()).max(15), confidence: z.number().min(0).max(1) }). Cross-checks: salary_min ≤ salary_max when both present; every skill string appears in the advert text (case-insensitive); company name appears verbatim; route confidence under 0.8 to review.",
  },
  {
    title: "Design the memory layers",
    kind: "build",
    task: "You are building a tutoring assistant that students use over a whole term. Design its memory: what goes in the window, what the rolling summary keeps, which user facts are stored (with expiry), what is never stored, and what is read live from the school system.",
    hints: ["What would a good human tutor write in their notes versus look up?", "What must a minor's data policy exclude?"],
    solution: "Window: the last 12 messages of the current session. Rolling summary: topics covered this session, questions the student struggled with, what was explained and how. User facts (term-long expiry, visible to student and teacher, deletable): preferred explanation style (examples first), subjects being studied, recurring weak spots ('fractions'). Never stored: health details, family circumstances, anything the student says about other people, grades as memory. Live via tools: the timetable, current assignments and their due dates, the official grade book. Every read keyed by the student's account; a leak test in the build.",
  },
];
