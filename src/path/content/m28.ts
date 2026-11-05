import type { Exercise, LessonBody, Quiz } from "../types";

// Module 28: Retrieval-augmented generation (RAG). One concept per lesson.

export const M28_BODIES: Record<string, LessonBody> = {
  "m28-rag": {
    simple: "RAG is retrieval-augmented generation: before asking the model, your code searches your own documents for the relevant passages and puts them in the prompt, so the answer is grounded in your data.",
    concept:
      "A language model knows what was in its training data, up to a cutoff, and nothing about your company's policies, your product manuals or yesterday's contract. **Retrieval-augmented generation** fixes that without retraining: when a question arrives, your code first retrieves the passages from your documents that are most relevant to it, then sends those passages with the question to the model, with instructions to answer from them and cite them.\n\nThe two halves give it the name. Retrieval is search: find the right few hundred words among millions. Generation is the model writing an answer that uses them. The model never sees the whole document collection; it sees a question and the handful of passages the search chose.\n\nRAG is the standard way to build assistants over private, changing or large document sets: help centres, legal files, manuals, internal wikis. The rest of this module is its parts, from ingesting documents to measuring whether the answers are faithful.",
    why:
      "Pasting all your documents into every prompt is impossible (they do not fit), expensive (you pay for every token every time) and unsafe (every document is exposed to every question). Fine-tuning a model on your documents is slow, costly, goes stale the moment a document changes, and does not make the model cite sources. Retrieval sends only what each question needs, stays current as documents change, enforces who may see what in the search itself, and lets every answer point to its evidence.",
    how: [
      "Ingest: split each document into chunks, compute an embedding for each, store chunks with their metadata and vectors.",
      "At question time: embed the question and search for the most similar chunks, filtered by permission.",
      "Rerank the candidates with a more careful model and keep the best few.",
      "Build a prompt: rules, the chunks as numbered sources, the question.",
      "Generate an answer that cites the sources, or says the documents do not cover it; evaluate retrieval and faithfulness separately.",
    ],
    visual: {
      kind: "flow",
      steps: ["documents → chunks → embeddings → vector store", "question → embedding", "search: top 20 similar chunks (permission filtered)", "rerank → top 5", "prompt: rules + numbered sources + question", "answer with [n] citations, or 'not covered'"],
      caption: "The top row happens once per document; the rest happens on every question.",
    },
    everyday: {
      title: "An open-book exam with a librarian",
      text: "You may not know the answer, but you are allowed to bring books, and a librarian hands you the three pages that matter. You answer from those pages and write the page numbers in the margin. If the pages do not cover the question, you say so rather than guessing. RAG is the librarian plus the rule about page numbers.",
    },
    engineering: {
      title: "A help-centre assistant for a software company",
      text: "A company has 600 help articles and a chat box that used to answer from the model's general knowledge, confidently and often wrongly about the product's own features. With RAG, articles are chunked and embedded nightly and on edit; each question retrieves the top chunks, filtered to the customer's plan; the model answers only from them and cites the article. Wrong-feature answers dropped to near zero, staff-only articles never reach customers because the filter runs in the search, and every answer links to its source so customers and support staff can check it.",
    },
    code: {
      title: "RAG in thirty lines",
      lang: "ts",
      src: `export async function answerFromDocs(question: string, audience: "customer" | "staff") {
  const [qv] = await embed([question]);                                    // 1. embed the question
  const candidates = await searchChunks(qv, { audience, limit: 20 });      // 2. nearest chunks, permission filtered
  const top = (await rerank(question, candidates)).slice(0, 5);            // 3. the best five

  if (top.length === 0 || top[0].score < 0.5) {
    return { answer: "I couldn't find this in our documentation.", sources: [] };
  }
  const sources = top.map((c, i) => "[" + (i + 1) + "] " + c.title + "\\n" + c.text).join("\\n\\n");
  const reply = await client.messages.create({
    model: process.env.MODEL_MID!, max_tokens: 500, temperature: 0.2,
    system: "Answer ONLY from the numbered sources. Cite each claim like [2]. If the sources do not answer the question, say so.",
    messages: [{ role: "user", content: "<sources>\\n" + sources + "\\n</sources>\\n<question>" + question + "</question>" }],
  });
  return { answer: textOf(reply), sources: top.map((c) => ({ id: c.id, title: c.title })) };
}`,
      lines: [
        { code: "const [qv] = await embed([question]);                                    // 1. embed the question", say: "The question becomes a vector with the same model the chunks used." },
        { code: "const candidates = await searchChunks(qv, { audience, limit: 20 });      // 2. nearest chunks, permission filtered", say: "The search returns the closest chunks the asker is allowed to see." },
        { code: "const top = (await rerank(question, candidates)).slice(0, 5);            // 3. the best five", say: "A second, careful scoring picks the five that actually answer the question." },
        { code: "if (top.length === 0 || top[0].score < 0.5) {", say: "A gate: weak retrieval means an honest 'not covered', without a model call." },
        { code: "system: \"Answer ONLY from the numbered sources. Cite each claim like [2]. If the sources do not answer the question, say so.\",", say: "Grounding rules: only the sources, cite them, decline when they are silent." },
      ],
      note: "Every function here gets its own lesson in this module.",
    },
    useIt: "Use RAG for any assistant that must answer from your own documents: support, legal, HR, engineering wikis, product manuals, research libraries. Use plain prompting when the material is small and static enough to paste; use fine-tuning for style, not for facts.",
    takeaways: ["RAG: retrieve the relevant passages, then generate from them with citations.", "Ingest once per document; retrieve, rerank and generate per question.", "Permission is enforced in the search; the model never sees forbidden text.", "Answers cite evidence or decline; both halves are measured."],
    terms: [["RAG", "retrieval-augmented generation: search your documents, then answer from the results"], ["retrieval", "finding the passages relevant to a question"], ["grounding", "answering from supplied text rather than the model's memory"], ["citation", "a marker tying a claim to a numbered source"]],
    reflect: { q: "Context windows are now huge. Why not put the whole help centre in every prompt?", a: "Cost and latency on every question, quality loss as attention spreads over hundreds of pages, no permission control, and re-sending everything whenever a document changes. Retrieval sends the five chunks that matter; long context helps when one document must be read whole." },
  },

  "m28-why-llms-need-external-knowledge": {
    simple: "A model's knowledge is frozen at training time, general rather than yours, and recalled rather than looked up. Anything private, recent or precise has to be supplied in the prompt.",
    concept:
      "Three limits make **external knowledge** necessary. The model's knowledge stops at its training cutoff: a policy changed last month is unknown to it. Its knowledge is general: it has read the public web, not your contracts, your tickets or your internal wiki. And its knowledge is recalled, not looked up: it reproduces patterns from training, which is why it produces a plausible refund policy rather than your refund policy, and why it cannot tell the difference.\n\nAsked about something outside those limits, the model does not stop. It completes the text in the most plausible way, which reads exactly like a real answer. That is the failure RAG prevents: by supplying the actual text, you replace recall with reading, and you give the model something to cite and something to be silent about.\n\nExternal knowledge can arrive through retrieval (this module), through tools that query live systems (Module 27), or by pasting a document into the prompt when it is small. Retrieval is the one that scales to large and changing collections.",
    why:
      "The gap between what a model knows and what your users ask is where confident wrong answers come from, and they are the most damaging failure an assistant can have: a customer acts on a policy that does not exist, a lawyer relies on a clause that was never there. Supplying the real text turns the model from a source into a reader, and reading is something it does well. RAG exists because the knowledge problem cannot be solved inside the model for private, changing, precise information.",
    how: [
      "Identify what the model cannot know: your documents, recent changes, exact figures, per-user data.",
      "Decide the channel: retrieval for large or changing collections; tools for live records; direct inclusion for small static text.",
      "Supply the text in the prompt as delimited sources with instructions to answer only from them.",
      "Make 'the sources do not cover this' a required, normal output.",
      "Keep the sources current: re-index on change, so the supplied text is never older than the document.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Question", "What the model has", "What happens without external knowledge", "The fix"],
        rows: [
          ["What is our return window?", "thousands of other companies' policies", "a plausible 30-day answer that may be wrong", "retrieve the policy chunk"],
          ["What changed in the API last week?", "nothing after the cutoff", "an invented change log", "retrieve the release notes"],
          ["What is the balance on account 4417?", "no access to your database", "a made-up figure", "a tool call"],
          ["Explain what a vector is", "plenty", "a good answer", "nothing needed"],
        ],
      },
      caption: "The last row is the model's home ground. The others need the text supplied.",
    },
    everyday: {
      title: "A brilliant new hire on day one",
      text: "They know the industry cold and can write beautifully, and they have never seen your policies, your customers or last week's decisions. Ask them for your refund policy and they will produce a plausible one from experience. Hand them the actual document and they will read it and quote it. Nobody would call that a flaw in the hire; it is why you give them the handbook.",
    },
    engineering: {
      title: "The legal assistant that cited a clause that did not exist",
      text: "A property firm's assistant was asked about break clauses in a lease and answered with a confident paragraph about a six-month notice period. The lease had no break clause; the model had reproduced a typical one. The firm's fix was to supply the lease text with every question and to require a clause citation for every statement, with 'the lease does not address this' as an allowed answer. The assistant's answers became checkable, and a reviewer can now see in seconds whether a claim has a source.",
    },
    maths: {
      formula: "P(correct) without sources ≈ how often the training distribution matches your case;   with sources ≈ P(retrieved) × P(faithful | retrieved)",
      meaning: "Without supplied text, correctness depends on your case being typical. With RAG it depends on two measurable things: whether the right passage was retrieved, and whether the model stayed faithful to it.",
      worked: [
        "A company's return window is 14 days; most retailers' is 30. Without sources, a model answers '30 days' most of the time: perhaps 20% correct for this company.",
        "With retrieval: suppose recall of the right chunk is 0.93 and faithfulness given the right chunk is 0.97. Correct ≈ 0.93 × 0.97 ≈ 0.90.",
        "Improving recall to 0.98 raises it to about 0.95. Each factor is a dial you can measure and turn; the no-sources number is not.",
      ],
    },
    useIt: "Before building any assistant, list what it must know that the model cannot: that list is your retrieval corpus and your tool list. Supply it, require citations, allow silence, and keep it current. Never let an assistant answer about your facts from its memory.",
    takeaways: ["Model knowledge is frozen, general and recalled; yours is current, private and precise.", "Without supplied text, the model completes plausibly and confidently, which is the dangerous failure.", "Supply text by retrieval, tools or direct inclusion; require citations; allow 'not covered'.", "Correctness becomes two measurable factors: retrieved, and faithful."],
    terms: [["training cutoff", "the date after which a model has seen no text"], ["recall (model)", "reproducing patterns from training rather than reading supplied text"], ["external knowledge", "information supplied in the prompt or via tools rather than from the model's training"]],
    reflect: { q: "Would retraining the model on your documents every night solve the knowledge problem?", a: "Partly and expensively: it would still not cite sources, would still blend your facts with general patterns, would lag by a day, and could not enforce who may see what. Retrieval solves all four more cheaply." },
  },

  "m28-rag-architecture": {
    simple: "A RAG system has an offline ingestion pipeline (documents to indexed chunks) and an online query pipeline (question to cited answer), joined by the vector store and a shared embedding model.",
    concept:
      "**RAG architecture** separates two flows that run at different times and scales. The ingestion pipeline runs when documents are added or changed: extract text, split into chunks, attach metadata (source, section, audience, date), embed, store. The query pipeline runs on every question: embed the question, search with filters, rerank, build the prompt, generate, log.\n\nThe pieces that join them are the vector store, which the ingestion side writes and the query side reads, and the embedding model, which must be the same on both sides or the vectors are not comparable. Around them sit the things every production system needs: a queue for ingestion jobs, a re-index trigger on document edits, an evaluation harness with labelled questions, and tracing that records which chunks each answer used.\n\nEach component is replaceable: a different chunker, a different store, a different reranker. The contracts between them (chunk shape, metadata fields, score ranges) are what you design carefully.",
    why:
      "Treating RAG as one function hides the fact that its halves fail differently and are fixed differently. Ingestion problems (bad extraction, poor chunking, stale index) show up as the right passage never being found; query problems (weak search, no reranking, bad prompts) show up as the right passage being found and ignored. A clear architecture lets you measure each stage, swap components and keep the index fresh without touching the query path.",
    how: [
      "Ingestion: a job per document: extract → chunk → metadata → embed → upsert; delete old chunks first; triggered on create and edit.",
      "Storage: chunks with text, metadata and vector; indexes on the vector and on filter fields.",
      "Query: embed → filtered search → rerank → gate → prompt → generate → cite; each stage logged under one trace id.",
      "Evaluation: a labelled question set run against retrieval (recall) and generation (faithfulness) on every change.",
      "Operations: queue for ingestion, freshness check, cost and latency per stage.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Ingestion (per document)", detail: "extract → chunk → metadata → embed → store; re-run on edit" },
        { label: "Store", detail: "chunks + metadata + vectors; filter indexes" },
        { label: "Query (per question)", detail: "embed → search(filters) → rerank → gate → prompt → generate" },
        { label: "Evaluation", detail: "labelled questions: recall@k, faithfulness; runs on every change" },
        { label: "Tracing", detail: "which chunks, which scores, which prompt version, per answer" },
      ],
      caption: "Two pipelines, one store, one embedding model, and the harness that keeps them honest.",
    },
    everyday: {
      title: "A library and its reference desk",
      text: "Cataloguing happens in the back room whenever books arrive: each is labelled, summarised and shelved. The reference desk works when a reader asks: find the shelf, pull the three best books, hand over the pages, note the call numbers. Both use the same catalogue. Nobody re-catalogues the library because a reader asked a question.",
    },
    engineering: {
      title: "Separating the pipelines at a documentation company",
      text: "A company's first RAG assistant re-embedded documents inside the request handler whenever it saw a new one; questions took fifteen seconds and the index was inconsistent. They split it: an ingestion worker fed by a queue of document-change events (create, edit, delete), a store with chunk metadata and two indexes, and a query service that only reads. Questions now take under two seconds, edits are searchable within a minute, and when retrieval quality dipped after a chunker change, the evaluation harness pointed at ingestion rather than the prompt, which saved a week.",
    },
    code: {
      title: "The two entry points",
      lang: "ts",
      src: `// ingestion worker: runs on document create / edit / delete events
export async function ingest(docId: string) {
  const doc = await documents.get(docId);
  await chunkStore.deleteByDocument(docId);                        // old chunks never linger
  if (doc.deleted) return;
  const text = await extractText(doc);
  const chunks = chunkDocument(text, { title: doc.title, audience: doc.audience, updatedAt: doc.updatedAt });
  const vectors = await embed(chunks.map((c) => c.text));
  await chunkStore.upsert(chunks.map((c, i) => ({ ...c, docId, embedding: vectors[i], embedModel: EMBED_MODEL })));
}

// query service: read-only
export async function answer(question: string, user: User, trace: Trace) {
  const [qv] = await trace.span("embed", () => embed([question]));
  const candidates = await trace.span("search", () => chunkStore.search(qv, { filter: { audience: user.audience }, limit: 20 }));
  const top = await trace.span("rerank", () => rerank(question, candidates, 5));
  return trace.span("generate", () => generateGrounded(question, top));
}`,
      lines: [
        { code: "await chunkStore.deleteByDocument(docId);                        // old chunks never linger", say: "Ingestion is idempotent: delete, then insert, so an edited document cannot leave stale chunks behind." },
        { code: "const chunks = chunkDocument(text, { title: doc.title, audience: doc.audience, updatedAt: doc.updatedAt });", say: "Metadata travels with every chunk from the start; filters later depend on it." },
        { code: "await chunkStore.upsert(chunks.map((c, i) => ({ ...c, docId, embedding: vectors[i], embedModel: EMBED_MODEL })));", say: "Each chunk stores which embedding model made its vector, so a model change can be detected." },
        { code: "const candidates = await trace.span(\"search\", () => chunkStore.search(qv, { filter: { audience: user.audience }, limit: 20 }));", say: "The query path only reads, with the permission filter inside the search and a trace span per stage." },
      ],
    },
    useIt: "Build RAG as two pipelines and a store from the start: an event-driven ingestion worker, a read-only query service, shared metadata contracts, an evaluation harness and per-stage tracing. The separation is what lets you tune, swap and operate each half.",
    takeaways: ["Ingestion (offline, per document) and query (online, per question) are separate pipelines.", "They share the store and the embedding model; the metadata contract joins them.", "Ingestion is idempotent and triggered by document events; the query path is read-only.", "Evaluate retrieval and generation separately; trace every stage."],
    terms: [["ingestion pipeline", "the offline flow that turns documents into indexed chunks"], ["query pipeline", "the online flow that turns a question into a cited answer"], ["upsert", "insert or replace a record by key, so re-runs are safe"], ["vector store", "the database holding chunks with their embeddings"]],
    reflect: { q: "Where does a permission check belong: ingestion, storage or query?", a: "All three cooperate: ingestion attaches the audience to each chunk, storage indexes it, and the query applies it as a filter inside the search. It must never be left to the prompt." },
  },

  "m28-document-ingestion": {
    simple: "Document ingestion is the pipeline that takes a source document and produces indexed chunks: fetch, extract, clean, chunk, enrich with metadata, embed, store, and repeat whenever the document changes.",
    concept:
      "**Document ingestion** is everything that happens between a file existing and its content being retrievable. It starts with a source (a file upload, a wiki page, a database row, a web page) and a trigger (created, edited, deleted). It extracts text from the format, cleans it (boilerplate, headers, broken encodings), splits it into chunks, attaches metadata, computes embeddings, and writes to the store, replacing anything the previous version left.\n\nIngestion is a batch-shaped job with a freshness requirement: it must process thousands of documents at first load and one document within a minute of an edit. So it runs as a worker fed by a queue, idempotently (running twice on the same version produces the same index), with a record per document of what version was indexed and when.\n\nThe quality of every answer is capped here. A passage that was never extracted, was split mid-sentence, or lost its heading cannot be retrieved well no matter how good the search is.",
    why:
      "Most RAG failures that look like search problems are ingestion problems: a PDF whose tables came out as word soup, a heading dropped so the chunk says 'unopened only' with no mention of mattresses, a stale version still in the index after an edit, a staff-only document ingested without its audience tag. Ingestion is the least glamorous part and the one that decides whether the right text exists to be found.",
    how: [
      "Listen for document events (create, update, delete) and enqueue an ingestion job with the document id and version.",
      "Fetch the source; extract text appropriate to the format; normalise whitespace and encoding; strip boilerplate.",
      "Chunk by structure (headings, paragraphs) within a token budget; prefix each chunk with its document title and section.",
      "Attach metadata: document id, version, title, section, audience, language, updated date, source URL.",
      "Embed in batches; delete the document's old chunks; insert the new ones; record the indexed version.",
    ],
    visual: {
      kind: "flow",
      steps: ["event: document 812 edited (v7)", "queue job {doc: 812, version: 7}", "fetch + extract text", "clean + chunk + metadata", "embed in batches", "delete v6 chunks → insert v7 chunks", "record: 812 indexed at v7"],
      caption: "A job per document version, safe to re-run, with a record of what the index holds.",
    },
    everyday: {
      title: "Receiving stock at a warehouse",
      text: "A delivery arrives; someone checks it, unpacks it, labels every item with its product code and location, puts it on the right shelf and updates the stock system. If the same delivery note is scanned twice, the system must not double the stock. Ingestion is goods-in for documents, and the labels are the metadata.",
    },
    engineering: {
      title: "A compliance firm's regulation library",
      text: "A compliance firm indexes thousands of regulatory documents that change often. Their first ingestion ran weekly and re-embedded everything; edits were invisible for days and the bill was large. The rebuild: a queue fed by the document system's change events, a worker that processes one document version per job, idempotent delete-then-insert, metadata with jurisdiction, effective date and audience, and a freshness monitor that alerts if any document's indexed version lags its current version by more than ten minutes. Costs fell (only changed documents are embedded) and a regulation updated at 9:00 is answerable by 9:02.",
    },
    code: {
      title: "An idempotent ingestion job",
      lang: "ts",
      src: `export async function ingestJob(job: { docId: string; version: number }) {
  const indexed = await indexState.get(job.docId);
  if (indexed?.version === job.version) return;                       // already done: re-runs are no-ops

  const doc = await sources.fetch(job.docId);
  if (!doc || doc.deleted) {
    await chunkStore.deleteByDocument(job.docId);
    await indexState.set(job.docId, { version: job.version, chunks: 0, at: new Date() });
    return;
  }
  const raw = await extractText(doc);                                  // format-specific: PDF, HTML, DOCX, markdown
  const text = clean(raw);                                             // whitespace, encoding, boilerplate
  const chunks = chunkDocument(text, { title: doc.title, docId: doc.id, version: job.version, audience: doc.audience, language: doc.language, updatedAt: doc.updatedAt, url: doc.url });

  const vectors = [];
  for (const batch of inBatches(chunks, 64)) vectors.push(...(await embed(batch.map((c) => c.text))));

  await chunkStore.transaction(async (tx) => {
    await tx.deleteByDocument(job.docId);
    await tx.insert(chunks.map((c, i) => ({ ...c, embedding: vectors[i], embedModel: EMBED_MODEL })));
  });
  await indexState.set(job.docId, { version: job.version, chunks: chunks.length, at: new Date() });
}`,
      lines: [
        { code: "if (indexed?.version === job.version) return;                       // already done: re-runs are no-ops", say: "Idempotency: the same version is never processed twice." },
        { code: "const text = clean(raw);                                             // whitespace, encoding, boilerplate", say: "Cleaning before chunking; navigation menus and page footers would otherwise become chunks." },
        { code: "const chunks = chunkDocument(text, { title: doc.title, docId: doc.id, version: job.version, audience: doc.audience, language: doc.language, updatedAt: doc.updatedAt, url: doc.url });", say: "Metadata attached at chunk creation, including the audience that permission filters will use." },
        { code: "for (const batch of inBatches(chunks, 64)) vectors.push(...(await embed(batch.map((c) => c.text))));", say: "Embeddings in batches: fewer requests, within provider limits." },
        { code: "await tx.deleteByDocument(job.docId);", say: "Old chunks go in the same transaction as the new ones arrive; the index is never half-updated." },
      ],
    },
    useIt: "Build ingestion as an event-driven, idempotent worker with a per-document index record and a freshness monitor. Put effort into extraction and cleaning for your formats; most retrieval quality is decided here. Re-ingest only what changed.",
    takeaways: ["Ingestion: fetch, extract, clean, chunk, enrich, embed, replace, record.", "Event-driven and idempotent: one job per document version, safe to re-run.", "Metadata (audience, version, section, date) is attached at ingestion for filters later.", "Freshness is monitored: indexed version versus current version."],
    terms: [["ingestion", "turning a document into indexed chunks"], ["idempotent job", "a job that produces the same result however many times it runs"], ["boilerplate", "repeated non-content text such as menus, footers and legal notices"], ["freshness", "how far the index lags the current documents"]],
    reflect: { q: "A document is deleted but its chunks keep appearing in answers. Which part of ingestion is missing?", a: "Handling the delete event: the job must remove the document's chunks and record the deletion. Deletion is an ingestion event like any other." },
  },

  "m28-text-extraction": {
    simple: "Text extraction gets clean, ordered text out of real formats: PDFs, Word files, HTML, scans, spreadsheets, keeping headings and tables intact and dropping noise.",
    concept:
      "Documents arrive as PDFs with two-column layouts, HTML full of navigation, Word files with tracked changes, scanned images, spreadsheets, slide decks. **Text extraction** turns each into plain text in reading order with its structure preserved: headings marked, paragraphs separated, tables kept as rows, lists kept as lists, page furniture removed.\n\nEach format needs its own tool. PDF libraries give text with positions, from which reading order and columns are reconstructed; HTML is parsed and the main content isolated; scanned pages go through OCR (optical character recognition); spreadsheets become one row per line with headers; slides become one section per slide. Output is usually markdown-like text, because headings and tables written as markdown survive chunking and are understood by the model.\n\nExtraction is also where garbage is caught: an empty result, a page of repeated characters, mojibake from a wrong encoding. A validation step rejects or flags them instead of indexing noise.",
    why:
      "Everything downstream assumes the text is right. Columns merged into gibberish, tables flattened into number soup, headings lost, footers on every page turned into chunks: these produce confident wrong answers that no search or prompt can fix. Extraction is where a surprising share of RAG quality is won or lost, and where format-specific effort pays off most.",
    how: [
      "Detect the format from the file type and content, not the extension alone.",
      "Use a format-specific extractor; for PDFs reconstruct reading order and columns; for HTML isolate the main content; for scans run OCR.",
      "Preserve structure as markdown: headings with #, tables with pipes, lists with dashes.",
      "Remove page headers, footers, navigation, cookie banners and repeated boilerplate.",
      "Validate: minimum length, language detected, ratio of letters to symbols, no repeated-line patterns; flag failures for review.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Format", "Typical trap", "What good extraction keeps"],
        rows: [
          ["PDF (two columns)", "lines interleaved across columns", "reading order per column, headings, page breaks removed"],
          ["PDF (table)", "cells flattened into one line", "rows and columns as a markdown table"],
          ["HTML", "menus, cookie banners, related links", "the main article only, headings preserved"],
          ["scanned PDF", "no text layer at all", "OCR text with a confidence score; low confidence flagged"],
          ["spreadsheet", "cells with no context", "header row repeated as column names on each row"],
          ["slides", "titles and bullets jumbled", "one section per slide with its title"],
        ],
      },
      caption: "The right-hand column is what the chunker and the model will see.",
    },
    everyday: {
      title: "Reading a newspaper aloud to someone",
      text: "You do not read across the fold from one column into the next, you skip the page number and the advert, and you say 'headline:' before the headline. You are extracting the text in reading order with structure. A naive program reads the page left to right, advert and all.",
    },
    engineering: {
      title: "The product manuals that were tables",
      text: "An electronics company indexed 2,000 PDF manuals. Retrieval seemed fine until users asked about specifications: the answers were nonsense, because every spec table had been flattened into a line of numbers with no labels. The team added a table-aware extractor that outputs markdown tables, a cleaning rule that removes the 'Page 12 of 48' footers which had become hundreds of identical chunks, and a validator that flags pages with fewer than 50 characters for OCR. Specification questions went from mostly wrong to mostly right, with no change to search or prompts.",
    },
    code: {
      title: "Extract by format, keep structure, validate",
      lang: "ts",
      src: `export async function extractText(doc: SourceDoc): Promise<string> {
  let text: string;
  switch (doc.mime) {
    case "application/pdf":
      text = await pdfToMarkdown(doc.bytes, { columns: "auto", tables: "markdown", dropHeadersFooters: true });
      if (text.replace(/\\s+/g, "").length < 200) text = await ocrToMarkdown(doc.bytes);   // likely a scan
      break;
    case "text/html":
      text = htmlMainContentToMarkdown(doc.bytes);        // readability-style main content; nav and footers removed
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await docxToMarkdown(doc.bytes);
      break;
    default:
      text = doc.bytes.toString("utf8");
  }
  text = text.replace(/\\r/g, "").replace(/[ \\t]+\\n/g, "\\n").replace(/\\n{3,}/g, "\\n\\n");
  const letters = (text.match(/\\p{L}/gu) ?? []).length;
  if (letters < 100 || letters / text.length < 0.5) throw new ExtractionError("text looks empty or garbled", doc.id);
  return text;
}`,
      lines: [
        { code: "text = await pdfToMarkdown(doc.bytes, { columns: \"auto\", tables: \"markdown\", dropHeadersFooters: true });", say: "A PDF extractor told to reconstruct columns, keep tables as markdown and drop page furniture." },
        { code: "if (text.replace(/\\s+/g, \"\").length < 200) text = await ocrToMarkdown(doc.bytes);   // likely a scan", say: "Almost no text from a PDF means it is an image; fall back to OCR." },
        { code: "text = htmlMainContentToMarkdown(doc.bytes);        // readability-style main content; nav and footers removed", say: "For web pages, isolate the article and discard navigation and banners." },
        { code: "if (letters < 100 || letters / text.length < 0.5) throw new ExtractionError(\"text looks empty or garbled\", doc.id);", say: "Validation: too few letters, or too many symbols, means garbage that must not be indexed." },
      ],
    },
    useIt: "Invest in extraction per format you actually have: table-aware PDF handling, main-content HTML isolation, OCR for scans, markdown output throughout, and validation that flags garbage. Check extraction output by eye on a sample of each format before trusting retrieval numbers.",
    takeaways: ["Extraction produces ordered text with structure preserved as markdown.", "Each format has its own traps: columns, tables, navigation, scans.", "Remove boilerplate; validate for emptiness and garbling.", "Most 'search is bad' complaints trace back here."],
    terms: [["text extraction", "getting clean, ordered text out of a file format"], ["OCR", "optical character recognition: turning images of text into text"], ["reading order", "the sequence a human would read the text in, across columns and pages"], ["markdown", "plain text with simple markers for headings, lists and tables"]],
    reflect: { q: "Why output markdown rather than plain text?", a: "Headings and tables carry meaning the model and the chunker need: a chunk starting with '## Returns' is retrievable and understandable; a table row with its header is a fact rather than a list of numbers. Plain text throws that structure away." },
  },

  "m28-document-chunking": {
    simple: "Chunking splits a document into pieces of a few hundred tokens along natural boundaries, each carrying its title and section, so search can return the passage that answers a question rather than a whole document.",
    concept:
      "Search and embeddings work on units of text, and a document is the wrong unit: too long to embed meaningfully, too long to put in a prompt, and the answer to a question is usually one paragraph of it. **Document chunking** cuts the document into retrievable pieces.\n\nGood chunks follow the document's structure: a section under a heading, a paragraph, a table with its header, a list with its introduction. They are sized in tokens to a budget (a few hundred), because an embedding represents a chunk as one meaning and a chunk with five topics has a blurred vector. Each chunk is prefixed with the document title and the section path so it makes sense on its own: 'Returns policy > Hygiene items: mattresses can be returned unopened only' is a fact; 'unopened only' is not.\n\nChunks also carry metadata: document id, section, position, audience, date. The chunk is the record the whole system works with from here on.",
    why:
      "Embedding whole documents makes every search return the document most about the topic in general, not the passage that answers the question, and then the prompt has to carry pages of text the model wades through. Chunking too finely (single sentences) loses the context that makes a sentence meaningful. Structure-aware chunks of a few hundred tokens with their heading are the unit at which retrieval is precise and the prompt stays small.",
    how: [
      "Parse the extracted markdown into a tree: headings, paragraphs, lists, tables.",
      "Walk the sections; accumulate paragraphs into a chunk until the token budget is reached; never split a table or a list item.",
      "Prefix each chunk's text with the title and section path.",
      "Record metadata: document id, version, section, chunk index, audience, language, date.",
      "Handle oversized units (a huge table) by splitting with the header repeated on each piece.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "document", detail: "Returns policy (2,400 tokens)" },
        { label: "sections", detail: "Overview · Time limits · Hygiene items · Sale items · How to return" },
        { label: "chunks", detail: "'Returns policy > Hygiene items\\n\\nMattresses and bedding can be returned only if unopened…' (180 tokens)" },
        { label: "metadata", detail: "{ docId: 'policy-returns', section: 'Hygiene items', audience: 'customer', updatedAt: '2026-10-02' }" },
      ],
      caption: "One section, one chunk, with its path on top. The embedding represents one idea.",
    },
    everyday: {
      title: "Index cards from a textbook",
      text: "A student revising writes one card per topic: a heading at the top, the key paragraph below, the chapter noted in the corner. They do not copy whole chapters onto a card, and they do not cut a paragraph in half. When a question comes up, the right card is easy to find and makes sense alone. Chunks are the cards.",
    },
    engineering: {
      title: "The policy that was found but not answered",
      text: "A retailer's assistant indexed whole help articles. 'Can I return a mattress?' retrieved the general returns article (1,800 words), and the model, reading it, answered about ordinary returns; the mattress rule was two paragraphs in another article that ranked fourth. After re-chunking by heading at 400 tokens with the section path prefixed, the hygiene-items chunk ranked first on its own, the prompt carried 800 tokens instead of 6,000, and the answer cited the right rule. Nothing changed but the unit of retrieval.",
    },
    maths: {
      formula: "chunks ≈ document tokens ÷ chunk budget;   prompt tokens ≈ k × chunk budget",
      meaning: "The budget decides how many chunks a document yields and how much a prompt costs when k chunks are retrieved.",
      worked: [
        "A 2,400-token policy with a 400-token budget yields about 6 chunks (fewer if sections are short, since sections are not merged across headings).",
        "Retrieving the top 5 chunks costs about 5 × 400 = 2,000 prompt tokens, against 2,400 for the whole document, or 6,000 for a long article.",
        "With a 150-token budget the same policy yields 16 chunks; the hygiene rule may be split from its heading context, and 5 chunks give only 750 tokens of evidence.",
        "The budget is a trade: smaller chunks are more precise but lose context; larger ones carry context but blur the embedding and inflate the prompt. 300–500 is the usual starting range.",
      ],
    },
    code: {
      title: "Structure-aware chunking with a token budget",
      lang: "ts",
      src: `const BUDGET = 400;

export function chunkDocument(markdown: string, meta: ChunkMeta): Chunk[] {
  const out: Chunk[] = [];
  for (const section of splitByHeadings(markdown)) {                 // [{ path: ["Returns policy", "Hygiene items"], blocks: [...] }]
    let buf: string[] = [];
    const flush = () => {
      if (buf.length === 0) return;
      const header = section.path.join(" > ");
      out.push({ ...meta, section: section.path.at(-1) ?? "", index: out.length, text: header + "\\n\\n" + buf.join("\\n\\n") });
      buf = [];
    };
    for (const block of section.blocks) {                             // paragraphs, lists, tables: never split inside one
      if (countTokens([...buf, block].join("\\n\\n")) > BUDGET && buf.length > 0) flush();
      buf.push(block);
    }
    flush();
  }
  return out;
}`,
      lines: [
        { code: "for (const section of splitByHeadings(markdown)) {                 // [{ path: [\"Returns policy\", \"Hygiene items\"], blocks: [...] }]", say: "Headings are the first boundary; a chunk never crosses one." },
        { code: "out.push({ ...meta, section: section.path.at(-1) ?? \"\", index: out.length, text: header + \"\\n\\n\" + buf.join(\"\\n\\n\") });", say: "The chunk's text starts with its title and section path, so it is meaningful alone." },
        { code: "for (const block of section.blocks) {                             // paragraphs, lists, tables: never split inside one", say: "Blocks are whole units; a table is never cut in half." },
        { code: "if (countTokens([...buf, block].join(\"\\n\\n\")) > BUDGET && buf.length > 0) flush();", say: "When adding a block would exceed the budget, the current chunk is closed first." },
      ],
      note: "The next lesson adds overlap and tunes the budget.",
    },
    useIt: "Chunk by structure within a 300–500 token budget, prefix title and section, never split tables or list items, carry metadata. Re-chunk and re-evaluate retrieval recall when you change the budget; the chunk is the unit everything else depends on.",
    takeaways: ["Chunks are the unit of retrieval: a section or paragraph of a few hundred tokens.", "Follow structure; never cross headings or split tables.", "Prefix every chunk with its title and section path.", "The budget trades precision against context; measure recall when changing it."],
    terms: [["chunk", "a retrievable piece of a document with its metadata"], ["chunk budget", "the maximum tokens per chunk"], ["section path", "the chain of headings above a passage, e.g. 'Returns policy > Hygiene items'"]],
    reflect: { q: "A chunk reads 'Yes, within 30 days.' and nothing else. What went wrong?", a: "It lost its context: the heading and the question it answers. Structure-aware chunking with the section path prefixed, and a minimum chunk size that merges tiny blocks with their neighbours, prevent orphan fragments." },
  },

  "m28-chunk-size-and-overlap": {
    simple: "Chunk size sets how much context each piece carries; overlap repeats a little text between neighbouring chunks so a fact split across a boundary is whole in at least one. Both are tuned by measuring retrieval.",
    concept:
      "Two numbers shape every chunk. **Chunk size** is the token budget: small chunks are precise and cheap but can lose the sentence before that explained the one you retrieved; large chunks carry context but blur the embedding over several ideas and inflate the prompt. **Overlap** is how much text consecutive chunks share: with an overlap of one paragraph, the last paragraph of chunk 3 is also the first of chunk 4, so a rule that straddles the boundary appears complete in one of them.\n\nNeither has a universal right value. Legal clauses want larger chunks (conditions span paragraphs); FAQ entries want small ones (each is self-contained); tables want to stay whole. The usual starting point is 300–500 tokens with 10–20% overlap, then tuning against a labelled question set: does the chunk that answers each question get retrieved?\n\nOverlap costs storage and a little retrieval noise (two chunks sharing text can both rank); size costs prompt tokens per retrieved chunk. The measurement that settles them is recall at k.",
    why:
      "A fixed chunk size cut across a document will sometimes land in the middle of the sentence that matters. Without overlap, the condition is in one chunk and the rule in the next, and neither alone answers the question; the retriever finds half a fact. Overlap is cheap insurance. Size matters because embeddings represent one meaning per chunk: too big and the vector is an average of several topics that matches none well; too small and the chunk cannot be understood alone.",
    how: [
      "Start at 400 tokens and one-paragraph (or ~15%) overlap; keep structure-aware boundaries.",
      "Build a question set with the passage that answers each; measure recall at 5.",
      "Try 250 and 600; keep the size that maximises recall without blowing the prompt budget.",
      "Try no overlap and double overlap; keep overlap only if recall improves on boundary-straddling questions.",
      "Special-case formats: tables whole with repeated headers; FAQs one entry per chunk; contracts larger with clause boundaries.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Setting", "Strength", "Weakness", "Good for"],
        rows: [
          ["small (150–250)", "precise, cheap prompts", "loses context; orphan fragments", "FAQs, short entries"],
          ["medium (300–500)", "one idea per chunk with context", "occasional straddle", "most documents"],
          ["large (600–1,000)", "full context for multi-paragraph rules", "blurred embeddings; costly prompts", "contracts, procedures"],
          ["overlap 0", "no duplicate text", "boundary facts split", "cleanly sectioned docs"],
          ["overlap 10–20%", "boundary facts intact", "some duplicate hits", "running prose"],
        ],
      },
      caption: "Tune with recall, not taste.",
    },
    everyday: {
      title: "Photographing a long notice board",
      text: "To capture a long notice you take several photos. If each photo starts exactly where the last ended, a sentence across the edge is unreadable in both. If each photo overlaps the previous one by a line, every sentence is whole in at least one shot. Too-small photos capture a word each; too-large ones are unreadable. Chunk size and overlap are the framing choices.",
    },
    engineering: {
      title: "Tuning a contract assistant",
      text: "A legal-tech team's assistant was missing conditions: a clause said 'subject to section 4.2' two paragraphs before the obligation, and the 300-token chunks separated them. They measured recall at 5 on 150 labelled questions: 300 tokens no overlap gave 78%; 300 with one-paragraph overlap gave 84%; 600 with overlap gave 91%; 900 gave 90% at nearly double the prompt cost. They settled on 600 with overlap for contracts, while keeping 300 for their FAQ corpus, where 600 had actually lowered recall by blurring entries together.",
    },
    maths: {
      formula: "recall@k = questions whose answering chunk is in the top k ÷ all questions;   storage ≈ tokens × (1 + overlap fraction)",
      meaning: "Recall at k is the number that decides size and overlap; overlap multiplies storage and embedding cost by a little over one.",
      worked: [
        "150 questions. At 300 tokens, no overlap, 117 have their chunk in the top 5: recall@5 = 117 ÷ 150 = 0.78.",
        "At 600 tokens with 15% overlap, 137 do: 0.91. The difference, 20 questions, were mostly conditions split from obligations.",
        "Storage: a 100,000-token corpus at 15% overlap becomes about 115,000 tokens of chunks; embedding cost rises by the same 15%, once.",
        "Prompt cost per question: 5 × 600 = 3,000 tokens versus 5 × 300 = 1,500; the team accepted the doubling for a 13-point recall gain.",
      ],
    },
    code: {
      title: "Adding overlap to the chunker",
      lang: "ts",
      src: `export function chunkWithOverlap(blocks: string[], header: string, budget = 400, overlapBlocks = 1): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < blocks.length) {
    const buf: string[] = [];
    let j = i;
    while (j < blocks.length && countTokens([...buf, blocks[j]].join("\\n\\n")) <= budget) buf.push(blocks[j++]);
    if (buf.length === 0) { buf.push(blocks[j++]); }                   // a single oversized block becomes its own chunk
    chunks.push(header + "\\n\\n" + buf.join("\\n\\n"));
    if (j >= blocks.length) break;
    i = Math.max(i + 1, j - overlapBlocks);                              // step back so the last block(s) repeat in the next chunk
  }
  return chunks;
}`,
      lines: [
        { code: "while (j < blocks.length && countTokens([...buf, blocks[j]].join(\"\\n\\n\")) <= budget) buf.push(blocks[j++]);", say: "Fill the chunk with whole blocks up to the budget." },
        { code: "if (buf.length === 0) { buf.push(blocks[j++]); }                   // a single oversized block becomes its own chunk", say: "A table bigger than the budget is still never split here; it becomes one chunk on its own." },
        { code: "i = Math.max(i + 1, j - overlapBlocks);                              // step back so the last block(s) repeat in the next chunk", say: "The overlap: the next chunk starts one block before this one ended." },
      ],
    },
    useIt: "Start at 400 tokens with one-paragraph overlap, then tune per corpus with recall at 5 on labelled questions. Use larger chunks for contracts and procedures, smaller for FAQs, and keep tables whole. Re-measure whenever the corpus or the embedding model changes.",
    takeaways: ["Size trades context against precision and prompt cost; overlap protects boundary-straddling facts.", "Start at 300–500 tokens and 10–20% overlap; tune with recall at k.", "Different corpora want different settings; FAQs small, contracts larger.", "Overlap costs a little storage and embedding, once; size costs prompt tokens per question."],
    terms: [["chunk size", "the token budget per chunk"], ["overlap", "text shared between consecutive chunks"], ["recall at k", "the share of questions whose answering chunk appears in the top k results"]],
    reflect: { q: "Recall improved when you doubled the chunk size, but answer faithfulness dropped. Why might that be?", a: "Bigger chunks carry more unrelated text into the prompt, and the model can draw on the wrong part of a chunk. Fix by reranking to the top three, trimming chunks to the relevant section at prompt time, or keeping a mid-size and improving overlap instead." },
  },

  "m28-embedding-generation": {
    simple: "Embedding generation turns each chunk and each question into a vector with the same embedding model, in batches, with the model name recorded, so similarity search is meaningful.",
    concept:
      "Retrieval by meaning needs every chunk and every question as a vector in the same space. **Embedding generation** is the step that produces those vectors by calling an embedding model: a separate, cheap, read-only model that outputs a fixed-length list of numbers for a piece of text. Similar meanings produce nearby vectors.\n\nThree rules keep it correct. Same model, same version, both sides: vectors from different models are not comparable at all, so the model name is stored with each vector and the query uses the same. Batches: the API accepts many texts per call, which is faster and cheaper, and ingestion sends chunks in groups of dozens. Input type hints: some models accept a flag saying whether the text is a document or a query and embed them slightly differently; use it if available.\n\nEmbeddings are generated once per chunk at ingestion and once per question at query time; a cache of recent query embeddings avoids paying twice for the same question.",
    why:
      "The embedding is the chunk's address in meaning space; a search is only as good as those addresses. A mix of two models in one index silently returns nonsense. Unbatched embedding of a large corpus is slow and expensive. Changing the embedding model without re-embedding everything is the most common way a working system quietly breaks. Embedding generation is simple, but the discipline around it is what keeps search trustworthy.",
    how: [
      "Choose an embedding model and pin its id in configuration; record its dimension.",
      "At ingestion, embed chunks in batches (32–128 per request), with the document input type.",
      "Store each vector with the chunk and the model id.",
      "At query time, embed the question with the same model and the query input type; cache by question text.",
      "On a model change, re-embed the whole corpus into a new index and switch the query side in the same deploy.",
    ],
    visual: {
      kind: "flow",
      steps: ["chunk text (+ title prefix)", "embedding model v3 → 1,024 numbers", "stored: { chunk, vector, model: 'v3' }", "question → same model v3 → vector", "search compares only vectors tagged v3"],
      caption: "One model on both sides, recorded on every row.",
    },
    everyday: {
      title: "Postcodes from one atlas",
      text: "Give every house a coordinate from the same atlas and 'nearest house' works. Mix coordinates from two atlases with different origins and nearest means nothing. The embedding model is the atlas; writing its name on every coordinate is how you avoid mixing them.",
    },
    engineering: {
      title: "The silent upgrade",
      text: "A documentation team upgraded their embedding model for new documents 'to get better quality' while leaving old chunks as they were. Search quality collapsed for a week before anyone connected the two: queries embedded with the new model were compared against vectors from the old one, and the results were effectively random for older documents. The fix was a full re-embed into a fresh index, a model id column with a filter on it, and a rule that the query model and the index model are the same configuration value.",
    },
    code: {
      title: "Batched embedding with the model recorded",
      lang: "ts",
      src: `const EMBED_MODEL = process.env.EMBED_MODEL!;        // pinned; e.g. an embeddings model from Voyage or OpenAI
const EMBED_DIM = Number(process.env.EMBED_DIM!);     // the model's output size, e.g. 1024

export async function embed(texts: string[], kind: "document" | "query" = "document"): Promise<number[][]> {
  const res = await fetch(process.env.EMBED_URL!, {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.EMBED_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: kind }),
  });
  if (!res.ok) throw new Error("embedding failed: " + res.status);
  const json = await res.json();
  const vectors: number[][] = json.data.map((d: { embedding: number[] }) => d.embedding);
  if (vectors.some((v) => v.length !== EMBED_DIM)) throw new Error("unexpected embedding dimension");
  return vectors;
}

export async function embedQuery(question: string): Promise<number[]> {
  const cached = await queryCache.get(EMBED_MODEL + ":" + question);
  if (cached) return cached;
  const [v] = await embed([question], "query");
  await queryCache.set(EMBED_MODEL + ":" + question, v, { ttlSeconds: 3600 });
  return v;
}`,
      lines: [
        { code: "const EMBED_MODEL = process.env.EMBED_MODEL!;        // pinned; e.g. an embeddings model from Voyage or OpenAI", say: "One configuration value used by ingestion and query alike." },
        { code: "body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: kind }),", say: "Many texts per request, with the document-or-query hint." },
        { code: "if (vectors.some((v) => v.length !== EMBED_DIM)) throw new Error(\"unexpected embedding dimension\");", say: "A dimension mismatch means the wrong model answered; fail loudly." },
        { code: "const cached = await queryCache.get(EMBED_MODEL + \":\" + question);", say: "The cache key includes the model, so a model change cannot serve stale vectors." },
      ],
    },
    useIt: "Pin the embedding model, record it with every vector, batch at ingestion, cache query embeddings keyed by model, and treat a model change as a full re-index. Module 13 explains embeddings themselves; here the job is using them without breaking the index.",
    takeaways: ["Same embedding model and version on both sides; record it on every vector.", "Batch at ingestion; cache query embeddings keyed by model.", "Use document/query input types where offered.", "A model change is a full re-embed and an atomic switch."],
    terms: [["embedding model", "the separate model that turns text into a vector"], ["dimension", "the number of values in each vector, fixed by the model"], ["input type", "a hint to the embedding model whether the text is a document or a query"]],
    reflect: { q: "You embed chunks with the title prefix but questions without any prefix. Is that a problem?", a: "No; that asymmetry is normal and often helped by the document/query input types. The problem would be using different models, or prefixing chunks with text that is not meaning (such as ids) which shifts their vectors." },
  },

  "m28-vector-databases-in-rag": {
    simple: "In RAG the vector database holds chunks with their vectors and metadata, answers 'nearest chunks to this vector, with these filters' quickly, and supports upserts and deletes per document.",
    concept:
      "The store at the centre of RAG is a **vector database**: a database that can keep a vector alongside each row and find the rows whose vectors are closest to a query vector, fast, even with millions of rows. In RAG it also needs ordinary database features: metadata columns to filter on (audience, document, date, language), transactions for delete-then-insert on re-ingestion, and indexes on the filter columns.\n\nThe choice is between an extension to a database you already run (Postgres with pgvector, for instance) and a dedicated vector service. For most RAG systems up to a few million chunks, the extension is enough and keeps everything in one place with one backup and one access-control model. Dedicated services earn their place at larger scale or when the team needs their specific features.\n\nWhat RAG asks of the store, whichever it is: nearest-neighbour search with a metadata filter applied inside the search, not after it; stable ids per chunk; per-document replace; and a way to store which embedding model each vector came from. Module 29 goes inside the indexes that make the search fast.",
    why:
      "Comparing a question vector against every chunk vector works for ten thousand chunks and fails at ten million: too slow for a chat. A vector database's index finds the nearest neighbours without scanning everything. And RAG needs filters that are part of the search: a customer's query must only ever see customer-visible chunks, and applying that after retrieval means the top results may all be filtered away. The store is where speed and permission are enforced together.",
    how: [
      "Define the chunk table: id, document id, version, text, metadata columns, vector, embedding model.",
      "Create a vector index for approximate nearest-neighbour search and ordinary indexes on filter columns.",
      "Implement search as: filter by metadata, order by vector distance, limit k, in one query.",
      "Implement replace-by-document in a transaction for ingestion.",
      "Monitor index size, query latency and recall; rebuild the index after large changes if the engine needs it.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Need in RAG", "Store feature", "Why it matters"],
        rows: [
          ["find the nearest chunks", "vector index (HNSW or IVF)", "milliseconds at millions of rows"],
          ["only chunks the asker may see", "metadata filter inside the search", "a filter after search can empty the results"],
          ["re-ingest a changed document", "delete by document + insert in a transaction", "no stale or duplicate chunks"],
          ["detect model drift", "embedding model column", "mixed vectors are silently wrong"],
          ["trace an answer", "stable chunk ids", "the answer can name exactly what it used"],
        ],
      },
      caption: "Nearest-neighbour search plus ordinary database discipline.",
    },
    everyday: {
      title: "A library catalogue with a 'similar books' button",
      text: "An ordinary catalogue finds books by title and subject. A vector-aware catalogue also finds books that feel like this one, instantly, and still respects the rule that the rare-books room is staff only. The 'similar' search and the access rule run together, so a visitor never sees a restricted title in their results.",
    },
    engineering: {
      title: "Starting with Postgres",
      text: "A SaaS company with 400,000 help-centre chunks across its customers' workspaces chose pgvector in their existing Postgres rather than a new service. Each chunk row carries workspace id, audience and embedding; the search filters on workspace and audience and orders by cosine distance using an HNSW index. Tenant isolation is a WHERE clause, backups and permissions are the ones they already had, and queries take 20–40 ms. They plan to revisit the choice beyond ten million chunks; so far, one database has been simpler and safer than two.",
    },
    code: {
      title: "A chunk table and a filtered nearest-neighbour search",
      lang: "sql",
      src: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id           text PRIMARY KEY,
  doc_id       text NOT NULL,
  version      int  NOT NULL,
  workspace_id text NOT NULL,
  audience     text NOT NULL CHECK (audience IN ('customer', 'staff')),
  section      text,
  text         text NOT NULL,
  embed_model  text NOT NULL,
  embedding    vector(1024) NOT NULL,
  updated_at   timestamptz NOT NULL
);
CREATE INDEX chunks_vec ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX chunks_filter ON chunks (workspace_id, audience);

-- nearest 20 chunks the asker may see
SELECT id, doc_id, section, text, 1 - (embedding <=> $1) AS similarity
FROM chunks
WHERE workspace_id = $2 AND audience = ANY($3) AND embed_model = $4
ORDER BY embedding <=> $1
LIMIT 20;`,
      lines: [
        { code: "audience     text NOT NULL CHECK (audience IN ('customer', 'staff')),", say: "Permission metadata is a column with a constraint, not a note in the text." },
        { code: "CREATE INDEX chunks_vec ON chunks USING hnsw (embedding vector_cosine_ops);", say: "The vector index that makes nearest-neighbour search fast; Module 29 explains HNSW." },
        { code: "WHERE workspace_id = $2 AND audience = ANY($3) AND embed_model = $4", say: "Filters inside the search: tenant, audience and the embedding model, applied before ranking." },
        { code: "ORDER BY embedding <=> $1", say: "Cosine distance to the question vector; smallest first." },
      ],
    },
    useIt: "Start with a vector extension in the database you already run unless scale or features demand a dedicated service. Put permission and tenant columns on every chunk, filter inside the search, replace per document in a transaction, and store the embedding model. Module 29 covers indexes, scaling and choosing a store.",
    takeaways: ["The store holds chunks, vectors and metadata and answers filtered nearest-neighbour queries fast.", "Filters run inside the search, never after it.", "Per-document replace in a transaction; stable chunk ids; embedding model recorded.", "An extension to your existing database is usually enough to start."],
    terms: [["vector database", "a store that finds rows by vector similarity, with metadata"], ["pgvector", "a Postgres extension adding vector columns, operators and indexes"], ["nearest neighbour", "the stored vectors closest to a query vector"], ["metadata filter", "a condition on non-vector columns applied within the search"]],
    reflect: { q: "Why not run the similarity search first and filter the results in application code?", a: "Because the top 20 by similarity might all belong to another tenant or to staff-only documents; after filtering, nothing is left, or worse, something slips through. The filter has to be part of the ranking query." },
  },

  "m28-vector-storage": {
    simple: "Vector storage is how chunk vectors and their text and metadata are laid out, sized and kept consistent: dimension and type, ids and versions, what lives next to the vector, and what it all costs.",
    concept:
      "Beyond choosing a database, **vector storage** is the set of decisions about what each row holds and how big it is. A vector of 1,024 floats at 4 bytes each is 4 KB; a million chunks is 4 GB of vectors before text, metadata and indexes. Those numbers drive memory, cost and index choice.\n\nDecisions that matter: store the text with the vector (simple, one read per result) or only an id and fetch text elsewhere (smaller index, two reads); use full-precision floats or a compact representation (halving or quartering memory at a small quality cost, covered in Module 29 as quantisation); which metadata to store on the row (everything you filter on, and enough to render a citation) versus in the document table; stable ids so re-ingestion and tracing work; and versioning so a chunk can be tied to the document version it came from.\n\nStorage is also where retention and deletion live: when a document is deleted or a customer leaves, their chunks and vectors must go too.",
    why:
      "Vectors are big compared with ordinary rows, and nearest-neighbour indexes want to live in memory. A storage layout chosen casually becomes a memory bill, a slow index build, or a system where a deleted document's text survives inside an index. Sizing in advance and keeping ids, versions and metadata disciplined is what lets the store grow from thousands to millions of chunks without surprises.",
    how: [
      "Compute size: chunks × dimension × bytes per value, plus text and metadata; plan memory for the index.",
      "Choose what lives on the row: vector, text (or a reference), filter metadata, citation fields, model id, version.",
      "Use stable chunk ids (document id + version + index) and store the document version.",
      "Decide precision: full floats to start; compact types when memory becomes the constraint.",
      "Implement deletion paths: per document, per tenant, per customer request, including index entries.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Chunks", "Dimension", "Vectors (float32)", "With text (~1.5 KB) and metadata", "Note"],
        rows: [
          ["100,000", "1,024", "0.4 GB", "~0.6 GB", "fits anywhere"],
          ["1,000,000", "1,024", "4.1 GB", "~6 GB", "index wants memory; consider compact types"],
          ["10,000,000", "1,024", "41 GB", "~60 GB", "sharding or a dedicated service; quantisation"],
          ["1,000,000", "256", "1.0 GB", "~2.5 GB", "a smaller-dimension model cuts storage 4×"],
        ],
      },
      caption: "The vector column dominates. Dimension and precision are the levers.",
    },
    everyday: {
      title: "A photo library",
      text: "Each photo takes space; a thumbnail takes less; the index that lets you search by face must fit in memory to be fast. You decide whether to keep full-size originals next to the thumbnails or in cold storage, and you make sure deleting an album really deletes its photos. Vector storage is the same planning for chunks.",
    },
    engineering: {
      title: "Right-sizing a research-paper index",
      text: "A research tool indexed four million paper chunks with a 1,536-dimension model: 25 GB of vectors, an HNSW index that would not fit in the database server's memory, and 2-second queries. They switched to a 512-dimension model (recall on their test set dropped by one point), stored the chunk text in object storage with only the id on the row, and moved filter metadata into indexed columns. Vectors fell to 8 GB, the index fitted in memory, queries dropped to 40 ms, and deletion of a retracted paper now removes its chunks, vectors and index entries in one job.",
    },
    maths: {
      formula: "vector bytes = chunks × dimension × bytes per value;   total ≈ vector bytes × (1 + index overhead) + text + metadata",
      meaning: "Float32 is 4 bytes per value; float16 is 2; 8-bit is 1. HNSW indexes add roughly 50–100% on top of the raw vectors.",
      worked: [
        "2,000,000 chunks × 1,024 × 4 bytes = 8.2 GB of vectors.",
        "HNSW overhead ~75%: about 14 GB for vectors plus index; this needs to be in memory for fast search.",
        "Switching to float16 halves it: 4.1 GB vectors, ~7 GB with index.",
        "Switching to a 512-dimension model as well: 2.0 GB vectors, ~3.6 GB with index; a fifth of the original.",
      ],
    },
    code: {
      title: "A storage plan expressed as a schema",
      lang: "ts",
      src: `// chunk row: everything the query path needs in one read; text in the row because chunks are small
export type ChunkRow = {
  id: string;                 // docId + ":" + version + ":" + index  → stable across re-runs of the same version
  docId: string;
  version: number;
  tenantId: string;           // filter
  audience: "customer" | "staff";   // filter
  language: string;           // filter
  section: string;            // citation
  url: string;                // citation
  updatedAt: string;          // freshness, recency boosts
  text: string;               // ~400 tokens
  embedModel: string;
  embedding: Float32Array;    // dimension from config; switch to a compact type when memory binds
};

export async function deleteTenant(tenantId: string) {
  await chunkStore.deleteWhere({ tenantId });        // vectors and index entries go with the rows
  await documentStore.deleteWhere({ tenantId });
  await queryCache.clearPrefix(tenantId + ":");
}`,
      lines: [
        { code: "id: string;                 // docId + \":\" + version + \":\" + index  → stable across re-runs of the same version", say: "A stable, meaningful id: tracing and re-ingestion depend on it." },
        { code: "tenantId: string;           // filter", say: "Every filter the search applies is a column on the row." },
        { code: "text: string;               // ~400 tokens", say: "Text stored with the vector: one read per result. At larger scale it can move to object storage with only the id here." },
        { code: "await chunkStore.deleteWhere({ tenantId });        // vectors and index entries go with the rows", say: "Deletion reaches vectors and the index, not just the text." },
      ],
    },
    useIt: "Size the store before building it: chunks times dimension times bytes, plus index overhead. Keep filter metadata and citation fields on the row, use stable ids with versions, choose precision and dimension to fit memory, and build deletion paths per document and per tenant. Module 29 covers quantisation and scaling.",
    takeaways: ["The vector column dominates storage; dimension and precision are the levers.", "Stable ids with versions; filter and citation metadata on the row.", "Plan memory for the index, not just disk for the rows.", "Deletion must remove rows, vectors and index entries, per document and per tenant."],
    terms: [["vector storage", "how vectors, text and metadata are laid out and sized in the store"], ["float32 / float16", "number formats using 4 or 2 bytes per value"], ["index overhead", "the extra memory a nearest-neighbour index adds to the raw vectors"]],
    reflect: { q: "A customer asks to delete their data. Where could their text survive after you delete the document row?", a: "In the chunk rows, in the vector index entries, in query caches and in traces or logs that recorded retrieved chunks. Deletion has to visit each of those." },
  },

  "m28-similarity-search": {
    simple: "Similarity search embeds the question and returns the chunks whose vectors are closest to it, measured by a distance function, with filters applied and a cut-off on how many and how close.",
    concept:
      "**Similarity search** is the retrieval step itself: given the question's vector, find the k stored vectors nearest to it. 'Nearest' is defined by a distance or similarity function, usually cosine similarity (the angle between vectors) or dot product; the store's index returns the top k quickly, and each result comes with its score.\n\nThe parameters are k (how many candidates to fetch, typically 10–50 before reranking), the filters (tenant, audience, language, date), and a score threshold below which results are discarded as unrelated. Fetching more candidates than you will use leaves room for the reranker to reorder; fetching too many wastes time and feeds noise forward.\n\nSimilarity search finds chunks that are about the same thing as the question. It does not know whether a chunk answers the question; that is the reranker's job. And it is weak on exact identifiers and negation, which is why hybrid search exists.",
    why:
      "Keyword search finds the words you typed; it misses the chunk that says 'off-gassing' when you searched for 'smell'. Similarity search finds meaning, which is what questions are made of: people ask in their own words and documents answer in the writer's. Returning scored candidates with filters applied is the single most important step in RAG's quality, and tuning k and the threshold is where cheap wins live.",
    how: [
      "Embed the question with the same model as the chunks.",
      "Query the store: filter by metadata, order by distance, limit k (say 20).",
      "Convert distance to a similarity score if needed; drop results below a threshold.",
      "Pass the candidates with scores to reranking.",
      "Log the query vector id, the filters, the candidate ids and scores for tracing and evaluation.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Question", "Chunk", "Cosine similarity", "Kept (threshold 0.3)?"],
        rows: [
          ["Can I return an opened mattress?", "Returns policy > Hygiene items: mattresses… unopened only", "0.84", "yes"],
          ["Can I return an opened mattress?", "Returns policy > Time limits: 30 days from delivery", "0.62", "yes"],
          ["Can I return an opened mattress?", "Delivery > Regions we serve", "0.21", "no"],
          ["Can I return an opened mattress?", "Care guide > Cleaning a mattress", "0.55", "yes (reranker will demote it)"],
        ],
      },
      caption: "Illustrative scores. Similarity finds 'about mattresses'; the reranker decides 'answers the question'.",
    },
    everyday: {
      title: "A shop assistant who understands what you mean",
      text: "Ask for 'something to stop the door banging' and a good assistant brings a door stop, a draught excluder and a hinge cushion, even though you said none of those words. They bring a few options, not the whole shop, and skip the garden section. Similarity search is that assistant's first pass.",
    },
    engineering: {
      title: "Tuning k and the threshold for a support bot",
      text: "A SaaS support bot fetched the top 5 chunks by similarity and sent them straight to the model. Questions with two relevant articles sometimes lost one; vague questions pulled in unrelated chunks that the model then quoted. The team changed to fetching 20 candidates, reranking to 5, and dropping anything below 0.3 similarity. On their 200-question set, retrieval recall at 5 rose from 81% to 92%, and answers citing irrelevant chunks fell by half. The threshold also gave them a clean 'not covered' path for questions outside the documentation.",
    },
    maths: {
      formula: "cosine(a, b) = (a · b) ÷ (‖a‖ ‖b‖);   for unit vectors cosine = a · b",
      meaning: "The dot product of two vectors divided by the product of their lengths: 1 for the same direction, 0 for unrelated, −1 for opposite. Most embedding models output unit-length vectors, so cosine is just the dot product.",
      worked: [
        "Toy 3-dimensional vectors. Question q = [0.8, 0.5, 0.3]. Chunk A = [0.7, 0.6, 0.2]. Chunk B = [0.1, 0.2, 0.9].",
        "q · A = 0.56 + 0.30 + 0.06 = 0.92. ‖q‖ = √(0.64 + 0.25 + 0.09) = 0.99. ‖A‖ = √(0.49 + 0.36 + 0.04) = 0.94. cosine = 0.92 ÷ (0.99 × 0.94) = 0.99.",
        "q · B = 0.08 + 0.10 + 0.27 = 0.45. ‖B‖ = √(0.01 + 0.04 + 0.81) = 0.93. cosine = 0.45 ÷ (0.99 × 0.93) = 0.49.",
        "A is far more similar to the question than B. With a threshold of 0.3 both are kept as candidates; the reranker then decides.",
      ],
    },
    code: {
      title: "Search with filters, k and a threshold",
      lang: "ts",
      src: `export async function searchChunks(qv: number[], opts: { tenantId: string; audiences: string[]; k?: number; minSimilarity?: number }) {
  const k = opts.k ?? 20;
  const rows = await db.query(
    "SELECT id, doc_id, section, url, text, 1 - (embedding <=> $1) AS similarity " +
    "FROM chunks WHERE tenant_id = $2 AND audience = ANY($3) AND embed_model = $4 " +
    "ORDER BY embedding <=> $1 LIMIT $5",
    [toVector(qv), opts.tenantId, opts.audiences, EMBED_MODEL, k],
  );
  const min = opts.minSimilarity ?? 0.3;
  const kept = rows.filter((r) => r.similarity >= min);
  await trace.span("search", { k, min, returned: rows.length, kept: kept.length, top: rows[0]?.similarity });
  return kept;
}`,
      lines: [
        { code: "const k = opts.k ?? 20;", say: "Fetch more candidates than you will use; the reranker needs choice." },
        { code: "\"SELECT id, doc_id, section, url, text, 1 - (embedding <=> $1) AS similarity \" +", say: "The distance operator gives cosine distance; one minus it is the similarity score." },
        { code: "const kept = rows.filter((r) => r.similarity >= min);", say: "A threshold drops unrelated chunks so they never reach the prompt." },
        { code: "await trace.span(\"search\", { k, min, returned: rows.length, kept: kept.length, top: rows[0]?.similarity });", say: "Logged for tuning: the top score and how many survived the threshold." },
      ],
    },
    useIt: "Fetch 10–50 candidates with filters and a similarity threshold, log the scores, and hand the candidates to a reranker. Tune k and the threshold against recall and against how often unrelated chunks reach the prompt. Similarity search finds topics; keep its limits (identifiers, negation) in mind for hybrid search.",
    takeaways: ["Similarity search returns the k nearest chunk vectors to the question vector, with scores.", "Filters inside the query; a threshold on the score; k larger than the final number.", "It finds 'about the same thing', not 'answers the question'.", "Log scores for tuning and tracing."],
    terms: [["similarity search", "finding stored vectors nearest to a query vector"], ["k", "the number of candidates fetched"], ["similarity threshold", "the minimum score for a result to be kept"], ["dot product", "the sum of element-wise products; the cosine for unit vectors"]],
    reflect: { q: "Every question, however off-topic, returns 20 results. What is missing?", a: "A threshold. Nearest-neighbour search always finds something nearest; without a minimum similarity, unrelated chunks reach the prompt and the model answers from them. The threshold is what makes 'not covered' possible." },
  },

  "m28-cosine-similarity-in-retrieval": {
    simple: "Cosine similarity scores how closely two vectors point the same way, from −1 to 1. In retrieval it ranks chunks against a question, sets thresholds, and is what the vector index is built to compute fast.",
    concept:
      "Of the ways to compare vectors, **cosine similarity** is the standard for text retrieval. It measures the angle between two vectors and ignores their length: two chunks that say the same thing in different lengths still score close to 1. The score ranges from 1 (same direction) through 0 (unrelated) to −1 (opposite), though in practice text embeddings rarely go far below 0.\n\nIn retrieval it does three jobs. Ranking: candidates are ordered by cosine to the question. Thresholding: scores below a cut-off are treated as unrelated, which enables the 'not covered' path. Diagnosis: the distribution of scores tells you about the corpus and the model; a question whose best score is 0.4 when relevant matches usually score 0.7 is probably outside the documents.\n\nScores are not comparable across embedding models, and the meaning of 0.7 differs per model and corpus; thresholds are tuned per setup, from labelled questions, not copied from elsewhere.",
    why:
      "Length-insensitivity matters: a long chunk and a short one about the same rule should be equally findable, and cosine gives that where raw distance would not. Having one score with a known range makes ranking, thresholds and dashboards simple, and vector indexes are built around it. Understanding what the number means, and what it does not, is what lets you tune a RAG system rather than guess.",
    how: [
      "Normalise vectors to unit length at embedding time if the model does not already; then cosine is the dot product.",
      "Rank candidates by cosine to the question vector.",
      "Choose a threshold from labelled data: the score below which relevant chunks almost never fall.",
      "Watch the top score per query: a low best score is the signal for 'not covered'.",
      "Re-tune thresholds whenever the embedding model or the corpus changes.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Pair", "Cosine (illustrative)", "Reading"],
        rows: [
          ["'return an opened mattress' vs 'mattresses returnable only if unopened'", "0.84", "same topic and intent"],
          ["'return an opened mattress' vs 'cleaning a mattress'", "0.55", "same subject, different intent: candidate, not answer"],
          ["'return an opened mattress' vs 'delivery regions'", "0.21", "unrelated: below threshold"],
          ["'WL-2041' vs 'WL-2014'", "0.97", "near-identical strings: identifiers fool cosine"],
        ],
      },
      caption: "Cosine measures how alike texts look in meaning space; it is not a test of whether one answers the other.",
    },
    everyday: {
      title: "Compass bearings",
      text: "Two hikers walking north-north-east are heading nearly the same way, however fast or far each walks. One heading east is somewhat aligned; one heading south is opposite. Cosine similarity compares bearings and ignores speed, which is exactly what you want when a short chunk and a long chunk both point at 'mattress returns'.",
    },
    engineering: {
      title: "Setting a threshold from data",
      text: "A legal assistant's team wanted a reliable 'not covered' response. They took 300 labelled questions, recorded the cosine of the chunk that actually answered each (median 0.72, 5th percentile 0.46) and the best cosine for 60 questions known to be outside the corpus (median 0.38, 95th percentile 0.47). They set the threshold at 0.45: almost no answerable question is lost, and most out-of-scope questions are caught before a model call. When they switched embedding models, the scores shifted and they repeated the exercise; the new threshold was 0.31.",
    },
    maths: {
      formula: "cosine(q, c) = Σ qᵢcᵢ ÷ (√Σ qᵢ² · √Σ cᵢ²)",
      meaning: "Multiply matching positions and add them up, then divide by the two lengths. If both vectors have length 1, the division does nothing and cosine equals the dot product.",
      worked: [
        "Unit vectors q = [0.6, 0.8] and c = [0.8, 0.6]. Dot product = 0.48 + 0.48 = 0.96. Lengths are both 1, so cosine = 0.96: nearly the same direction.",
        "q = [0.6, 0.8] and d = [−0.8, 0.6]. Dot = −0.48 + 0.48 = 0. Cosine 0: unrelated (perpendicular).",
        "Scaling c to [1.6, 1.2] (a 'longer' chunk): dot = 0.96 + 0.96 = 1.92; ‖c‖ = 2; cosine = 1.92 ÷ (1 × 2) = 0.96. Unchanged: length does not matter.",
      ],
    },
    code: {
      title: "Cosine by hand, and a threshold check",
      lang: "py",
      src: `import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

q = [0.6, 0.8]
chunks = {"unopened only": [0.8, 0.6], "cleaning guide": [0.9, 0.1], "delivery regions": [-0.8, 0.6]}

THRESHOLD = 0.45
ranked = sorted(((cosine(q, v), name) for name, v in chunks.items()), reverse=True)
for score, name in ranked:
    print(f"{name:18s} {score:.2f} {'kept' if score >= THRESHOLD else 'dropped'}")`,
      lines: [
        { code: "dot = sum(x * y for x, y in zip(a, b))", say: "Element-wise products added up: the dot product." },
        { code: "return dot / (na * nb)", say: "Divided by both lengths so only direction counts." },
        { code: "ranked = sorted(((cosine(q, v), name) for name, v in chunks.items()), reverse=True)", say: "Ranking is just sorting by the score." },
        { code: "print(f\"{name:18s} {score:.2f} {'kept' if score >= THRESHOLD else 'dropped'}\")", say: "The threshold decides what reaches the next stage." },
      ],
      output: "unopened only      0.96 kept\ncleaning guide     0.70 kept\ndelivery regions   0.00 dropped",
    },
    useIt: "Use cosine for ranking and thresholds; tune the threshold from labelled questions and known out-of-scope questions; re-tune on any model change; read the top score as a signal of coverage. Remember what cosine cannot see: whether a chunk answers the question (reranker) and exact identifiers (keyword search).",
    takeaways: ["Cosine compares direction, not length: 1 same, 0 unrelated, −1 opposite.", "For unit vectors it is the dot product, which indexes compute fast.", "Thresholds come from labelled data per model and corpus; scores do not transfer between models.", "Cosine finds likeness, not answers; pair it with reranking and keyword search."],
    terms: [["cosine similarity", "a score of how closely two vectors point the same way"], ["unit vector", "a vector scaled to length 1"], ["threshold tuning", "choosing a cut-off score from labelled relevant and irrelevant examples"]],
    reflect: { q: "Two chunks score 0.95 against each other but one is 'open from 9 to 5' and the other 'closed from 9 to 5'. What does this tell you?", a: "That embeddings capture topic far better than negation; the two texts look almost identical in meaning space. Retrieval alone cannot be trusted to distinguish them; the reranker and the model reading the full text can." },
  },

  "m28-metadata-filtering": {
    simple: "Metadata filtering restricts a search to chunks that match conditions on their attributes: tenant, audience, language, date, document type. It is how permissions, scope and freshness are enforced inside retrieval.",
    concept:
      "Every chunk carries **metadata**: who may see it, which tenant or workspace it belongs to, what language it is in, when it was updated, what kind of document it came from. **Metadata filtering** applies conditions on those fields as part of the search, so only matching chunks are ranked. The vector finds the most similar chunks among those; the filter decides which chunks exist for this query at all.\n\nFilters serve three purposes. Permission: a customer's query never ranks staff-only chunks; tenant A never sees tenant B. Scope: a question about the API reference should search API docs, not marketing pages; a question in German should prefer German chunks. Freshness: prefer or require the current version; exclude expired policies.\n\nThe filter must run inside the index query, not after it, and the filter fields must be indexed, or filtered searches become slow scans.",
    why:
      "Without filtering, the only thing deciding what a user sees is similarity, and similarity does not know about permissions. A staff pricing document is extremely similar to a customer's pricing question. Post-filtering (retrieve, then remove forbidden results) can empty the result set or, if forgotten in one code path, leak. Putting the conditions in the query is both the security model and a quality lever: narrowing the candidate pool to the right documents makes the nearest neighbours more relevant.",
    how: [
      "Define the metadata fields at ingestion: tenant, audience/ACL, language, type, effective dates, version.",
      "Index the fields used in filters.",
      "Derive filter values from the authenticated session and the question's context, never from the model.",
      "Apply filters in the vector query (WHERE clause or filter parameter) before ranking.",
      "Test with an adversarial case: a low-privilege user asking a question whose best match is restricted; assert nothing restricted is returned.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Filter", "Derived from", "Purpose", "Example"],
        rows: [
          ["tenant_id = ?", "the session", "isolation", "workspace 'acme' only"],
          ["audience IN (?)", "the user's role", "permission", "customer → ['customer']; staff → ['customer', 'staff']"],
          ["language = ?", "detected from the question", "quality", "'de' for a German question"],
          ["doc_type IN (?)", "the feature or a router", "scope", "API questions → ['reference', 'guide']"],
          ["effective_to IS NULL OR > now()", "the clock", "freshness", "exclude expired policies"],
        ],
      },
      caption: "Every filter value comes from the session, the request context or the clock; none from the model.",
    },
    everyday: {
      title: "A card that opens only some doors",
      text: "In an office your badge opens the floors you work on and nothing else, and it does so at the door, not by letting you in everywhere and asking you to leave the rooms you should not be in. Metadata filtering is the badge reader on every search.",
    },
    engineering: {
      title: "Multi-tenant RAG for a SaaS product",
      text: "A SaaS company serves hundreds of customers' knowledge bases from one index. Every chunk has tenant_id and audience; every search includes tenant_id from the session and audience from the user's role as WHERE conditions; both columns are indexed. A test in CI runs 'what is our pricing?' as a customer of tenant A against an index that also holds tenant B's pricing and tenant A's staff-only pricing sheet, and asserts neither appears in the candidates. When a bug once put the filter in the application layer for one endpoint, that test caught it before release.",
    },
    code: {
      title: "Filters from the session, inside the query, with a test",
      lang: "ts",
      src: `function filtersFor(session: Session, question: string) {
  return {
    tenantId: session.tenantId,                                          // isolation
    audiences: session.role === "staff" ? ["customer", "staff"] : ["customer"],   // permission
    language: detectLanguage(question),                                  // quality
  };
}

export async function retrieve(question: string, session: Session) {
  const qv = await embedQuery(question);
  return searchChunks(qv, { ...filtersFor(session, question), k: 20 });  // WHERE tenant_id = … AND audience = ANY(…) AND language = …
}

// test: a customer must never retrieve staff-only chunks, even when they match best
test("staff-only chunks never reach customers", async () => {
  const session = { tenantId: "acme", role: "customer" } as Session;
  const results = await retrieve("what discount can staff give?", session);
  expect(results.every((r) => r.audience === "customer")).toBe(true);
});`,
      lines: [
        { code: "audiences: session.role === \"staff\" ? [\"customer\", \"staff\"] : [\"customer\"],   // permission", say: "The permission filter is computed from the authenticated role, not from anything the user typed." },
        { code: "return searchChunks(qv, { ...filtersFor(session, question), k: 20 });  // WHERE tenant_id = … AND audience = ANY(…) AND language = …", say: "The filters go into the search query itself." },
        { code: "expect(results.every((r) => r.audience === \"customer\")).toBe(true);", say: "A test with a question designed to match restricted content, asserting it never appears." },
      ],
    },
    useIt: "Attach tenant, audience, language, type and date metadata at ingestion; derive filter values from the session and request context; apply them inside the search; index the fields; and keep an adversarial permission test in CI. Filters are both your security boundary and a quality tool.",
    takeaways: ["Metadata filters restrict which chunks are ranked, for permission, scope and freshness.", "Filter inside the query, never after retrieval.", "Filter values come from the session and context, never from the model or the user's text.", "Test permissions adversarially."],
    terms: [["metadata filtering", "restricting a search by conditions on chunk attributes"], ["tenant", "one customer organisation whose data must be isolated"], ["ACL", "access control list: who may see a document"], ["post-filtering", "removing results after retrieval, which can empty or leak"]],
    reflect: { q: "A document is visible to three specific teams. How would you model that as a filter?", a: "Store an array of allowed group ids on the chunk and filter with 'allowed_groups overlaps the user's groups'. Enumerated audiences are a special case of this; arbitrary ACLs need the array form and an index that supports it." },
  },

  "m28-hybrid-search": {
    simple: "Hybrid search runs vector search and keyword search together and merges their rankings, so meaning-based matches and exact-term matches both reach the top.",
    concept:
      "Vector search finds chunks that mean the same as the question; keyword search finds chunks containing the same words. Each misses what the other catches: vectors fumble product codes, names and exact phrases; keywords miss synonyms and paraphrases. **Hybrid search** runs both and combines the results.\n\nThe combination step matters. Scores from the two systems are on different scales, so they are merged by rank rather than by score. Reciprocal rank fusion gives each result a score of 1 ÷ (k + rank) from every list it appears in, with k around 60, and sums them: a chunk near the top of either list does well; one near the top of both does best.\n\nKeyword search here means a proper full-text engine with stemming and relevance ranking (Postgres full-text search, Elasticsearch, or a BM25 implementation), not a LIKE query. The two searches apply the same metadata filters.",
    why:
      "Real questions mix meaning and exactness: 'is the WL-2041 desk returnable?' needs the policy by meaning and the product by code. A pure vector system returns the right policy and the wrong product; a pure keyword system returns the product page and misses 'off-gassing' for 'smell'. Hybrid search is consistently better than either alone on mixed workloads, and the cost is one extra query.",
    how: [
      "Run the vector search with filters, top 20, as before.",
      "Run a full-text search for the question's terms with the same filters, top 20, ranked by relevance.",
      "Fuse the two ranked lists with reciprocal rank fusion into one ranking.",
      "Take the top N fused results as candidates for reranking.",
      "Measure recall with and without the keyword side on your question set; keep the fusion constant near 60.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Chunk", "Vector rank", "Keyword rank", "RRF score (k = 60)", "Fused rank"],
        rows: [
          ["Returns > Hygiene items", "1", "4", "1/61 + 1/64 = 0.0320", "1"],
          ["Product WL-2041 page", "12", "1", "1/72 + 1/61 = 0.0303", "2"],
          ["Returns > Time limits", "2", "–", "1/62 = 0.0161", "3"],
          ["Care guide > Mattress", "3", "–", "1/63 = 0.0159", "4"],
        ],
      },
      caption: "The product page, buried at rank 12 by meaning, rises to second because the code matched exactly.",
    },
    everyday: {
      title: "Two librarians",
      text: "One librarian knows what every book is about and finds you things on your theme. The other has memorised every title and reference number and finds the exact one you named. Ask both and merge their piles: the book that both brought goes on top. Hybrid search employs both librarians.",
    },
    engineering: {
      title: "Support search for an electronics retailer",
      text: "A retailer's support search over manuals and policies ran on vectors alone. Customers typing model numbers ('error E04 on the DW-500') got the right error-code explanation for a different model, because the numbers embedded almost identically. Adding full-text search over the same chunks with the same filters, fused by reciprocal rank, put the right model's manual first. On their test set recall at 5 went from 83% to 94%, with the largest gains on questions containing codes, names and exact error strings.",
    },
    maths: {
      formula: "RRF(chunk) = Σ over lists of 1 ÷ (k + rank in that list),   k ≈ 60",
      meaning: "Each list contributes a small score that falls off with rank; the constant k stops the very top rank from dominating. Chunks absent from a list contribute nothing from it.",
      worked: [
        "Chunk A: vector rank 1, keyword rank 4: 1/61 + 1/64 = 0.0164 + 0.0156 = 0.0320.",
        "Chunk B: vector rank 12, keyword rank 1: 1/72 + 1/61 = 0.0139 + 0.0164 = 0.0303.",
        "Chunk C: vector rank 2 only: 1/62 = 0.0161.",
        "Order: A, B, C. B overtook C despite a worse vector rank because it was first by keyword. With k = 10 instead of 60 the top ranks would dominate more and B would still be second.",
      ],
    },
    code: {
      title: "Two searches, one fused ranking",
      lang: "ts",
      src: `export async function hybridSearch(question: string, filters: Filters, k = 20) {
  const qv = await embedQuery(question);
  const [byMeaning, byWords] = await Promise.all([
    searchChunks(qv, { ...filters, k }),                                              // vector: [{ id, ... }] best first
    db.query(
      "SELECT id, doc_id, section, url, text FROM chunks " +
      "WHERE tenant_id = $1 AND audience = ANY($2) AND search_tsv @@ plainto_tsquery('english', $3) " +
      "ORDER BY ts_rank_cd(search_tsv, plainto_tsquery('english', $3)) DESC LIMIT $4",
      [filters.tenantId, filters.audiences, question, k],
    ),
  ]);

  const K = 60;
  const score = new Map<string, number>();
  const rows = new Map<string, Chunk>();
  for (const list of [byMeaning, byWords]) {
    list.forEach((row, i) => {
      score.set(row.id, (score.get(row.id) ?? 0) + 1 / (K + i + 1));
      rows.set(row.id, row);
    });
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id]) => rows.get(id)!);
}`,
      lines: [
        { code: "const [byMeaning, byWords] = await Promise.all([", say: "Both searches run at the same time; hybrid costs little extra latency." },
        { code: "\"WHERE tenant_id = $1 AND audience = ANY($2) AND search_tsv @@ plainto_tsquery('english', $3) \" +", say: "The keyword side applies the same permission filters over a full-text index." },
        { code: "score.set(row.id, (score.get(row.id) ?? 0) + 1 / (K + i + 1));", say: "Reciprocal rank fusion: each list adds 1 over (60 + rank)." },
        { code: "return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id]) => rows.get(id)!);", say: "One fused ranking goes forward to the reranker." },
      ],
      note: "search_tsv is a stored tsvector column over the chunk text with a GIN index.",
    },
    useIt: "Use hybrid search by default for any corpus with names, codes, error strings or exact phrases, which is most corpora. Keep the same filters on both sides, fuse by rank with k around 60, and measure the gain on your question set. Module 29 looks at sparse versus dense retrieval in more depth.",
    takeaways: ["Vectors find meaning; keywords find exact terms; hybrid finds both.", "Fuse by rank (reciprocal rank fusion), not by raw scores.", "Same filters on both searches; both run in parallel.", "Biggest gains on codes, names and exact strings."],
    terms: [["hybrid search", "vector search and keyword search combined"], ["full-text search", "keyword search with stemming and relevance ranking"], ["reciprocal rank fusion (RRF)", "merging ranked lists by summing 1 ÷ (k + rank)"], ["BM25", "a standard relevance formula for keyword search"]],
    reflect: { q: "Why fuse by rank instead of adding the cosine score to the keyword score?", a: "The scores are on unrelated scales: cosine 0–1, BM25 unbounded. Adding them lets one dominate arbitrarily. Ranks are comparable, and RRF needs no normalisation or tuning beyond k." },
  },

  "m28-reranking": {
    simple: "Reranking takes the top candidates from search and scores each one against the question with a more careful model that reads both together, then keeps the best few for the prompt.",
    concept:
      "Search is fast because it compares the question's vector with chunk vectors computed in advance, independently. That is also its weakness: the chunk's vector was made without knowing the question. **Reranking** adds a second stage that reads the question and each candidate chunk together and outputs a relevance score. A cross-encoder reranker, or a model prompted to grade relevance, can tell that 'cleaning a mattress' is about mattresses but does not answer 'can I return one', which cosine cannot.\n\nIt is slower per pair, so it runs only on the candidates search produced: twenty or thirty chunks, not the whole corpus. The output is a reordered list with scores; the top few go to the prompt, and the scores feed the gate that decides whether anything is good enough.\n\nReranking is the single stage that most improves answer quality for a given retrieval, because it decides which five chunks the model actually reads.",
    why:
      "The five chunks in the prompt are the model's whole world for that answer. If the right chunk is fourth of twenty by similarity, a system that takes the top three sends the wrong world. Reranking lifts the chunk that answers the question above chunks that merely share its topic, cuts the number sent to the model (cheaper, less noise), and gives a calibrated score for the 'not covered' decision. It costs one extra model call per question, typically 50–200 ms.",
    how: [
      "Take the top 20–30 candidates from (hybrid) search.",
      "Send the question and each candidate to a reranker model; receive a relevance score per candidate.",
      "Sort by the reranker score; keep the top 3–5.",
      "Apply a gate: if the best reranker score is below a threshold tuned on labelled data, answer 'not covered'.",
      "Log reranker scores with the candidates for evaluation.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Candidate", "Search rank (cosine)", "Reranker score", "Final rank"],
        rows: [
          ["Care guide > Cleaning a mattress", "1 (0.71)", "0.12", "4"],
          ["Returns > Time limits", "2 (0.66)", "0.58", "2"],
          ["Returns > Hygiene items (mattresses unopened only)", "3 (0.64)", "0.93", "1"],
          ["Delivery > Mattress delivery slots", "4 (0.61)", "0.08", "5"],
          ["Returns > How to start a return", "5 (0.59)", "0.41", "3"],
        ],
      },
      caption: "Illustrative. The chunk that answers the question was third by similarity and first after reading it with the question.",
    },
    everyday: {
      title: "The shortlist interview",
      text: "A recruiter's keyword scan produces twenty CVs that mention the right skills. A hiring manager then reads each against the actual job and ranks them; the best fit was ninth on the scan. Reading each candidate with the job in mind is reranking; nobody would hire from the scan alone.",
    },
    engineering: {
      title: "Reranking in a legal assistant",
      text: "A legal-tech team's assistant retrieved the top 5 clauses by cosine and often cited a clause that mentioned the right term without answering the question. They added a cross-encoder reranker over the top 25 candidates, kept the top 4, and gated at a reranker score of 0.3. Faithfulness complaints halved; the model now reads less text and the right clause is almost always first. Latency rose by 120 ms, which the team hid behind streaming. The reranker score also became their best signal for out-of-scope questions.",
    },
    code: {
      title: "Rerank the candidates, keep the best, gate on the score",
      lang: "ts",
      src: `export async function rerank(question: string, candidates: Chunk[], keep = 5): Promise<{ chunk: Chunk; score: number }[]> {
  if (candidates.length === 0) return [];
  const res = await fetch(process.env.RERANK_URL!, {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RERANK_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.RERANK_MODEL!, query: question, documents: candidates.map((c) => c.text), top_n: keep }),
  });
  const json = await res.json();                                          // [{ index, relevance_score }] best first
  return json.results.map((r: { index: number; relevance_score: number }) => ({ chunk: candidates[r.index], score: r.relevance_score }));
}

const RERANK_GATE = 0.3;
const ranked = await rerank(question, candidates, 5);
if (ranked.length === 0 || ranked[0].score < RERANK_GATE) {
  return { answer: "I couldn't find this in our documents.", sources: [] };
}
const sources = ranked.map((r) => r.chunk);`,
      lines: [
        { code: "body: JSON.stringify({ model: process.env.RERANK_MODEL!, query: question, documents: candidates.map((c) => c.text), top_n: keep }),", say: "The question and every candidate go together to a reranking model; it returns the best few with scores." },
        { code: "return json.results.map((r: { index: number; relevance_score: number }) => ({ chunk: candidates[r.index], score: r.relevance_score }));", say: "Results map back to the original chunks, now ordered by relevance to this question." },
        { code: "if (ranked.length === 0 || ranked[0].score < RERANK_GATE) {", say: "The gate: if even the best candidate scores low, nothing goes to the model and the system says so." },
      ],
      note: "Without a reranking service, a small model prompted to score 'does this passage answer the question, 0–1' works, at higher latency.",
    },
    useIt: "Add a reranker over 20–30 candidates in any RAG system where answers must be precise: support, legal, technical documentation. Keep the top 3–5, gate on the score, and log scores for evaluation. It is the highest-value change after chunking.",
    takeaways: ["Reranking reads the question and each candidate together; search did not.", "Runs only on the top candidates; keeps the top few for the prompt.", "Its score is the best signal for 'not covered'.", "One extra call per question; the largest quality gain for the cost."],
    terms: [["reranker", "a model that scores question–passage relevance to reorder candidates"], ["cross-encoder", "a model that reads two texts jointly to score their relationship"], ["gate", "a threshold on the best score below which the system declines"]],
    reflect: { q: "If the reranker is so much better, why not rerank the whole corpus?", a: "Cost and time: it reads every pair, so scoring a million chunks per question would take minutes. Search narrows a million to twenty in milliseconds; the reranker spends its care on those twenty." },
  },

  "m28-context-construction": {
    simple: "Context construction turns the chosen chunks into the prompt: ordered, numbered, delimited sources with their titles, within a token budget, alongside rules that tell the model how to use them.",
    concept:
      "The reranked chunks are not the prompt yet. **Context construction** assembles them into what the model will read: each chunk as a numbered source with its document title and section, inside tags that mark it as data, in an order that puts the strongest first, trimmed to a token budget, followed by the question. The system message carries the rules: use only the sources, cite by number, say when they do not cover the question.\n\nDetails decide quality. Numbering lets the model cite and lets code check citations. Titles give the model the context a chunk alone lacks. Deduplication removes overlapping chunks from the same section. The budget stops the prompt growing with every retrieved chunk. And ordering matters: models attend more to the beginning and end of a long context, so the best source goes first.\n\nThe constructed context is logged with the answer, which is what makes faithfulness checkable later.",
    why:
      "A pile of raw chunks pasted after the question gives the model no way to cite, no sense of which source is strongest, duplicate text that wastes tokens, and no boundary between data and instructions. The same chunks, numbered, titled, ordered and bounded, produce answers that cite correctly and cost a predictable amount. Construction is cheap engineering that lifts both faithfulness and traceability.",
    how: [
      "Deduplicate: drop chunks that overlap heavily with a higher-ranked one from the same document.",
      "Order by reranker score, best first.",
      "Format each as '[n] Title > Section' then the text, inside a <sources> block.",
      "Enforce a token budget: stop adding sources when the budget is reached.",
      "Put the question after the sources; put the usage rules in the system message; log the final context.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "system", detail: "Answer only from the numbered sources. Cite like [2]. If the sources do not answer the question, say so." },
        { label: "<sources>", detail: "[1] Returns policy > Hygiene items\\nMattresses can be returned only if unopened…\\n\\n[2] Returns policy > Time limits\\nReturns must be started within 30 days…" },
        { label: "</sources>", detail: "(budget: ≤ 2,500 tokens of sources)" },
        { label: "<question>", detail: "Can I return a mattress I've opened?" },
      ],
      caption: "The model reads rules, then evidence in order of strength, then the question.",
    },
    everyday: {
      title: "A briefing pack for a meeting",
      text: "A good assistant does not hand the chair a heap of printouts. They staple the three relevant documents in order of importance, number them, write the title on each, and put the question on top. The chair can say 'as document 2 states…'. Context construction is making the briefing pack.",
    },
    engineering: {
      title: "Citations that could be checked",
      text: "An HR assistant answered policy questions well but its citations were unverifiable: it said 'according to the policy' without saying which. The team rebuilt context construction: numbered sources with title and section, a rule to cite by number, deduplication of overlapping chunks, a 2,000-token source budget, best source first. Answers now carry [1], [2] markers that the interface turns into links, a check verifies every cited number exists, and an evaluation can test whether each claim's cited source supports it. Token cost per question also fell by a third from deduplication and the budget.",
    },
    maths: {
      formula: "source tokens = Σ tokens(chunkᵢ) for i ≤ n, stop when the sum would exceed the budget",
      meaning: "The budget bounds prompt cost regardless of how many chunks were retrieved; the strongest sources are included first so the cut falls on the weakest.",
      worked: [
        "Budget 2,000 tokens. Reranked chunks: 420, 380, 510, 460, 390 tokens.",
        "Running sum: 420, 800, 1,310, 1,770; adding the fifth (390) would reach 2,160 > 2,000, so four sources are included.",
        "Prompt per question ≈ 2,000 (sources) + 300 (system) + 40 (question) ≈ 2,340 input tokens; at £2.40 per million that is about £0.0056 before the answer.",
      ],
    },
    code: {
      title: "Build the sources block within a budget",
      lang: "ts",
      src: `const SOURCE_BUDGET = 2000;

export function buildContext(ranked: { chunk: Chunk; score: number }[]) {
  const chosen: Chunk[] = [];
  let used = 0;
  for (const { chunk } of ranked) {
    if (chosen.some((c) => c.docId === chunk.docId && overlapRatio(c.text, chunk.text) > 0.6)) continue;   // dedupe overlapping neighbours
    const t = countTokens(chunk.text);
    if (used + t > SOURCE_BUDGET) break;
    chosen.push(chunk);
    used += t;
  }
  const block = chosen.map((c, i) => "[" + (i + 1) + "] " + c.title + " > " + c.section + "\\n" + c.text).join("\\n\\n");
  return { chosen, text: "<sources>\\n" + block + "\\n</sources>", tokens: used };
}

const ctx = buildContext(ranked);
const reply = await client.messages.create({
  model: process.env.MODEL_MID!, max_tokens: 500, temperature: 0.2,
  system: GROUNDED_SYSTEM,
  messages: [{ role: "user", content: ctx.text + "\\n\\n<question>" + question + "</question>" }],
});
await trace.span("context", { sources: ctx.chosen.map((c) => c.id), tokens: ctx.tokens });`,
      lines: [
        { code: "if (chosen.some((c) => c.docId === chunk.docId && overlapRatio(c.text, chunk.text) > 0.6)) continue;   // dedupe overlapping neighbours", say: "Overlapping chunks from the same document are not both sent." },
        { code: "if (used + t > SOURCE_BUDGET) break;", say: "The budget stops the prompt growing; because the list is best-first, the weakest sources are cut." },
        { code: "const block = chosen.map((c, i) => \"[\" + (i + 1) + \"] \" + c.title + \" > \" + c.section + \"\\n\" + c.text).join(\"\\n\\n\");", say: "Each source is numbered and titled so the model can cite it and understand it." },
        { code: "await trace.span(\"context\", { sources: ctx.chosen.map((c) => c.id), tokens: ctx.tokens });", say: "Exactly which chunks were sent is recorded with the answer." },
      ],
    },
    useIt: "Construct context deliberately in every RAG system: deduplicate, order best-first, number and title sources, enforce a budget, delimit as data, put rules in the system message, log the result. It makes citations checkable and costs predictable.",
    takeaways: ["Numbered, titled, delimited sources in best-first order, within a token budget.", "Deduplicate overlapping chunks; log exactly what was sent.", "Rules in the system message: only from sources, cite by number, decline when silent.", "Construction decides whether citations can be verified."],
    terms: [["context construction", "assembling retrieved chunks into the prompt"], ["source budget", "the maximum tokens of retrieved text per prompt"], ["deduplication", "removing chunks that largely repeat a higher-ranked one"]],
    reflect: { q: "Should the sources go before or after the question?", a: "Sources first, question last, so the request is freshest in the model's attention and the rules in the system message have already framed the sources as evidence. Some teams repeat a one-line question before the sources as well; measure it." },
  },

  "m28-grounded-response-generation": {
    simple: "Grounded generation is the model answering strictly from the supplied sources, citing them per claim, and saying plainly when they do not cover the question, with code checking the citations afterwards.",
    concept:
      "With the context built, the final call asks for a **grounded response**: an answer whose every claim rests on a numbered source. Three instructions do most of the work: use only the sources; cite each claim with its source number; if the sources do not answer, say so and do not guess. A low temperature keeps the answer close to the text.\n\nThe model will mostly comply, and sometimes not: it may add a plausible detail from memory, cite a source that does not say what it claims, or answer a question the sources only partly cover. So generation is followed by checks in code: every cited number exists; the answer is not empty of citations when sources were provided; and, in evaluation, each claim is graded against its cited source for faithfulness.\n\nThe response that reaches the user shows the citations as links to the documents, so people can verify, which is both a trust feature and a feedback channel.",
    why:
      "Retrieval puts the right text in front of the model; grounding is what stops the model from mixing it with its own recollection. Without the rules, the answer blends the sources with training-time facts, which is exactly the confident error RAG was built to prevent, and without the decline instruction the model answers around gaps instead of naming them. Checked citations turn 'trust me' into 'see for yourself', for users and for evaluation.",
    how: [
      "System message: only from the sources; cite per claim like [n]; decline when not covered; never mention sources not provided.",
      "Low temperature; a max_tokens suited to a concise answer.",
      "After generation: verify cited numbers exist; flag answers with no citations when sources were present.",
      "Render citations as links to the source documents in the interface.",
      "In evaluation, grade each claim against its cited source (faithfulness) and keep failing cases as tests.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Ungrounded", points: ["'Yes, mattresses can be returned within 30 days in original packaging.'", "Mixes a real time limit with an invented packaging rule", "No citation; nothing to check", "Confident where the sources were silent"] },
      right: { title: "Grounded", points: ["'Mattresses can only be returned if unopened [1]. Returns must start within 30 days of delivery [2].'", "Every claim tied to a numbered source", "Citations verified by code and linked in the UI", "'The documents do not say whether…' when the sources are silent"] },
      caption: "Same sources, same model; the rules and the checks make the difference.",
    },
    everyday: {
      title: "An essay with footnotes",
      text: "A student allowed to use three sources writes 'the treaty was signed in 1648 [2]' and the marker can check source 2. A sentence with no footnote is a claim the student is making alone, and the marker treats it with suspicion. Grounded generation holds the model to the footnote standard.",
    },
    engineering: {
      title: "Citation checks in a technical-documentation assistant",
      text: "A developer-documentation assistant produced good answers with occasional invented parameters that the cited page did not mention. The team tightened the system message (per-claim citations, decline on gaps, never cite unprovided sources), added a code check that every [n] maps to a sent source and that answers with sources have at least one citation, and built a faithfulness evaluation with a second model grading each claim against its cited chunk. Invented parameters now show up as unsupported claims in the evaluation, and the interface renders citations as links, which developers use to confirm details.",
    },
    code: {
      title: "Generate, then verify the citations",
      lang: "ts",
      src: `const GROUNDED_SYSTEM = [
  "You answer questions using ONLY the numbered sources in <sources>.",
  "Cite the source for every claim, like [2]. Never cite a number that is not in the sources.",
  "If the sources do not answer the question, say so plainly and do not guess. Partial coverage: answer what is covered and say what is not.",
  "Be concise: at most three short paragraphs.",
].join("\\n");

const reply = await client.messages.create({
  model: process.env.MODEL_MID!, max_tokens: 450, temperature: 0.1,
  system: GROUNDED_SYSTEM,
  messages: [{ role: "user", content: ctx.text + "\\n\\n<question>" + question + "</question>" }],
});
const answer = textOf(reply);

const cited = [...answer.matchAll(/\\[(\\d+)\\]/g)].map((m) => Number(m[1]));
const valid = cited.every((n) => n >= 1 && n <= ctx.chosen.length);
const declined = /do(es)? not (answer|cover|address|say)/i.test(answer);
if (!valid) await flag("invalid citation", { answer, sources: ctx.chosen.map((c) => c.id) });
if (ctx.chosen.length > 0 && cited.length === 0 && !declined) await flag("no citations", { answer });

return { answer, citations: cited.map((n) => ctx.chosen[n - 1]).filter(Boolean), declined };`,
      lines: [
        { code: "\"Cite the source for every claim, like [2]. Never cite a number that is not in the sources.\",", say: "Per-claim citations, and a rule against invented numbers." },
        { code: "\"If the sources do not answer the question, say so plainly and do not guess. Partial coverage: answer what is covered and say what is not.\",", say: "Declining is a normal output, including the partial case." },
        { code: "const valid = cited.every((n) => n >= 1 && n <= ctx.chosen.length);", say: "Code checks that every cited number refers to a source that was actually sent." },
        { code: "if (ctx.chosen.length > 0 && cited.length === 0 && !declined) await flag(\"no citations\", { answer });", say: "An answer with sources available but no citations is suspicious and is flagged." },
      ],
    },
    useIt: "Write the grounding rules into every RAG system message, keep temperature low, verify citations in code, render them as links, and run a faithfulness evaluation. Grounded generation is what makes RAG answers trustworthy rather than merely informed.",
    takeaways: ["Only from the sources; cite per claim; decline when not covered; never cite unprovided sources.", "Low temperature, concise answers.", "Verify citation numbers in code; flag citation-free answers.", "Render citations as links; evaluate faithfulness per claim."],
    terms: [["grounded response", "an answer whose claims rest on supplied sources"], ["faithfulness", "whether every claim is supported by its cited source"], ["citation check", "code verifying that cited numbers map to sent sources"]],
    reflect: { q: "The model cites [1] correctly but the claim is not in source 1. Which check catches it?", a: "Not the citation-number check; that only verifies the number exists. A faithfulness grader (a second model or a person) comparing the claim with the cited text is needed, which is why evaluation has its own lesson." },
  },

  "m28-rag-evaluation": {
    simple: "RAG evaluation measures the two halves separately: did retrieval find the right chunks (recall, precision), and did generation answer faithfully from them (faithfulness, correctness, declining when it should), on a labelled question set run on every change.",
    concept:
      "A RAG system can fail in the search or in the writing, and a single 'is the answer good' score cannot tell you which. **RAG evaluation** keeps them apart. Retrieval metrics: recall at k (is the answering chunk in the top k?), precision at k (how many of the top k are relevant?), mean reciprocal rank (how high is the first relevant one?). Generation metrics: faithfulness (is every claim supported by the cited sources?), answer correctness (does it match a reference answer?), and decline accuracy (does it decline exactly when the sources are silent?).\n\nThe fuel is a labelled set: questions with the chunk(s) that answer them and a reference answer, plus questions deliberately outside the corpus. Retrieval metrics are computed by code; faithfulness and correctness by a grader, usually a second model with a rubric, checked against human grades on a sample.\n\nRun on every change to chunking, embeddings, filters, reranking, prompts or models, with baselines and tolerances; failures become new cases.",
    why:
      "Without separate metrics, teams tune the prompt when the problem is chunking, or change the embedding model when the problem is the system message. Without a labelled set, every change is judged by a few hand-tried questions. Without out-of-scope questions, nobody measures the invented answers. RAG evaluation is what makes the dozen tuning knobs of this module safe to turn.",
    how: [
      "Build the set: 100–300 real questions with answering chunk ids and reference answers; add 20–50 questions with no answer in the corpus.",
      "Retrieval run: for each question, record the candidate ids; compute recall@5, precision@5, MRR.",
      "Generation run: produce answers; grade faithfulness per claim against cited sources and correctness against the reference with a calibrated model grader; check declines.",
      "Compare each metric with its baseline; fail the change on a drop beyond tolerance.",
      "Add production failures to the set; re-calibrate the grader against human grades every few weeks.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Metric", "Half", "Computed by", "What a drop means"],
        rows: [
          ["recall@5", "retrieval", "code", "chunking, embedding, filters or search changed for the worse"],
          ["precision@5", "retrieval", "code", "more noise reaching the prompt"],
          ["MRR", "retrieval", "code", "the right chunk is found but lower"],
          ["faithfulness", "generation", "model grader + human sample", "the model adds or distorts beyond the sources"],
          ["correctness", "generation", "model grader vs reference", "wrong answers even with right sources"],
          ["decline accuracy", "generation", "code + grader", "inventing answers, or declining answerable questions"],
        ],
      },
      caption: "Read the retrieval row first; a generation metric cannot be better than what retrieval delivered.",
    },
    everyday: {
      title: "Marking an open-book exam in two parts",
      text: "The examiner first checks whether the student found the right pages (did they open the right chapter?), then whether the answer actually follows from those pages. A student who found the right page and wrote nonsense has a different problem from one who wrote beautifully from the wrong page. Two marks, two remedies.",
    },
    engineering: {
      title: "The evaluation that found a chunking bug",
      text: "A help-centre team saw answer quality dip after a release and assumed the new prompt was at fault. Their evaluation split told another story: faithfulness was unchanged at 96%, but recall@5 had dropped from 92% to 79%. The release had also changed the chunker's heading detection, and section headings were being dropped from chunk text, so the embeddings had drifted. They reverted the chunker, recall returned, and the prompt change stayed. Without separate metrics they would have reverted the wrong thing.",
    },
    maths: {
      formula: "recall@k = |relevant ∩ top k| ÷ |relevant|;   precision@k = |relevant ∩ top k| ÷ k;   MRR = mean of 1 ÷ rank of first relevant",
      meaning: "Recall asks whether the needed chunks were found; precision asks how much of what was found was needed; MRR rewards finding the right chunk near the top.",
      worked: [
        "Question with one relevant chunk, found at rank 3 of the top 5: recall@5 = 1/1 = 1.0; precision@5 = 1/5 = 0.2; reciprocal rank = 1/3 = 0.33.",
        "Question with two relevant chunks, one found at rank 1, the other missing: recall@5 = 1/2 = 0.5; precision@5 = 1/5 = 0.2; reciprocal rank = 1/1 = 1.0.",
        "Over 200 questions: average recall@5 0.91, precision@5 0.28, MRR 0.74. A reranker typically raises MRR and precision without changing recall@20.",
      ],
    },
    code: {
      title: "Retrieval metrics and a faithfulness grade",
      lang: "ts",
      src: `type Case = { id: string; question: string; relevantChunkIds: string[]; reference: string | null };   // reference null = out of scope

export async function evaluate(cases: Case[]) {
  let recall = 0, precision = 0, mrr = 0, faithful = 0, declinesRight = 0, graded = 0;
  for (const c of cases) {
    const { candidates, answer, citations, declined } = await runPipeline(c.question);      // returns the top-5 ids used
    const top = candidates.slice(0, 5).map((x) => x.id);
    const hits = top.filter((id) => c.relevantChunkIds.includes(id));
    if (c.relevantChunkIds.length) recall += hits.length / c.relevantChunkIds.length;
    precision += hits.length / 5;
    const firstRank = top.findIndex((id) => c.relevantChunkIds.includes(id));
    mrr += firstRank >= 0 ? 1 / (firstRank + 1) : 0;

    if (c.reference === null) { if (declined) declinesRight++; continue; }
    if (declined) continue;                                                                // an answerable question declined: counts as 0 faithful
    graded++;
    const verdict = await gradeFaithfulness(answer, citations.map((s) => s.text));         // model grader: every claim supported?
    if (verdict.allSupported) faithful++;
  }
  const n = cases.length, inScope = cases.filter((c) => c.reference !== null).length, outScope = n - inScope;
  return { recall: recall / inScope, precision: precision / n, mrr: mrr / inScope, faithfulness: faithful / inScope, declineAccuracy: declinesRight / outScope };
}`,
      lines: [
        { code: "const hits = top.filter((id) => c.relevantChunkIds.includes(id));", say: "Retrieval is scored by ids, by code, with no model involved." },
        { code: "mrr += firstRank >= 0 ? 1 / (firstRank + 1) : 0;", say: "Reciprocal rank rewards the right chunk being near the top." },
        { code: "if (c.reference === null) { if (declined) declinesRight++; continue; }", say: "Out-of-scope questions are scored on whether the system declined." },
        { code: "const verdict = await gradeFaithfulness(answer, citations.map((s) => s.text));         // model grader: every claim supported?", say: "Generation is graded claim by claim against the cited sources by a calibrated model grader." },
      ],
    },
    useIt: "Build the labelled set before tuning anything, compute retrieval metrics in code and generation metrics with a calibrated grader, keep baselines, run on every change, and add production failures. Module 37 covers metrics and graders in general; here the point is the split.",
    takeaways: ["Evaluate retrieval (recall, precision, MRR) and generation (faithfulness, correctness, declines) separately.", "Labelled questions with answering chunks and references, plus out-of-scope questions.", "Code scores retrieval; a calibrated grader scores generation.", "Baselines, tolerances, and failures becoming cases."],
    terms: [["recall@k", "the share of relevant chunks found in the top k"], ["precision@k", "the share of the top k that are relevant"], ["mean reciprocal rank (MRR)", "the average of 1 over the rank of the first relevant result"], ["faithfulness grader", "a model or person checking each claim against its cited source"]],
    reflect: { q: "Faithfulness is 98% but correctness is 80%. What does that combination suggest?", a: "The model is faithfully answering from the wrong or incomplete sources: a retrieval problem (recall or ranking), or a corpus gap. Check recall and the sources used for the incorrect answers before touching the prompt." },
  },

  "m28-common-rag-failures": {
    simple: "RAG fails in recognisable ways: the right chunk is missing, found but ignored, stale, forbidden but leaked, or carrying hidden instructions. Each has a diagnostic signal and a specific fix.",
    concept:
      "After building and measuring, the failures that remain fall into a short list. **Retrieval misses**: the answering chunk is not in the candidates (bad extraction, chunking, embedding mismatch, over-tight filters, no keyword search). **Found but ignored**: the chunk was sent and the model answered from another chunk or from memory (weak grounding rules, too many sources, the right one buried). **Over-answering**: no chunk covers the question and the model invents (no gate, no decline instruction). **Stale**: an old version of a document is still indexed (ingestion not triggered on edit, no delete-then-insert). **Leaks**: a chunk the user should not see is retrieved (filters applied after search, or missing on a path). **Injection**: a document containing instructions steers the answer (no data boundary, no output checks).\n\nEach failure shows up in a different metric or log, which is why the evaluation split and per-stage tracing matter: they say which failure you have before you change anything.",
    why:
      "A RAG system has a dozen knobs, and turning the wrong one wastes weeks: rewriting prompts for a retrieval miss, swapping embedding models for a stale index, adding examples for a leak. Knowing the failure catalogue lets you read the evidence (which metric fell, what the trace shows) and go straight to the stage responsible. It also tells you what to test for before users do.",
    how: [
      "Reproduce with the trace: which chunks were retrieved, their scores, what was sent, what was answered.",
      "Classify: miss, ignored, over-answer, stale, leak, injection.",
      "Fix at the responsible stage (see the table) and add the case to the evaluation set.",
      "Re-run the evaluation; confirm the metric that fell has recovered and nothing else dropped.",
      "Add a monitor for the signal that would have caught it earlier.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Failure", "Signal", "Responsible stage", "Fix"],
        rows: [
          ["right chunk never retrieved", "recall@k low; trace shows it absent", "extraction, chunking, embeddings, filters, hybrid", "inspect extraction; re-chunk; same model both sides; loosen filters; add keyword search"],
          ["right chunk sent but ignored", "recall fine, faithfulness or correctness low", "context, generation", "fewer sources, best first; stronger grounding rules; reranker; stronger model"],
          ["answer invented for an uncovered question", "decline accuracy low", "gate, generation", "reranker-score gate; explicit decline instruction; out-of-scope cases in evals"],
          ["outdated content", "answers cite an old version", "ingestion", "re-index on edit; delete-then-insert; freshness monitor"],
          ["restricted chunk shown", "permission test fails; trace shows forbidden ids", "filters", "filters inside the query on every path; adversarial test in CI"],
          ["document steers the answer", "odd instructions followed; evaluation hostile case fails", "context, output checks", "delimit as data; strip instructions; citation and evidence checks"],
        ],
      },
      caption: "Read the signal, go to the stage. The fix is rarely 'a better prompt' for a retrieval failure.",
    },
    everyday: {
      title: "A restaurant kitchen's complaint log",
      text: "'Cold food' points at the pass, 'wrong dish' at the order taker, 'ingredient missing' at the stores, 'we served the allergen' at the ticket check. A good head chef does not retrain the whole team for every complaint; they read the complaint and fix the station. RAG failures have stations too.",
    },
    engineering: {
      title: "A week of triage",
      text: "A documentation team logged every bad answer for a week with its trace and classified it. 11 were retrieval misses, all from one product's manuals whose tables had been flattened at extraction. 6 were stale: a wiki edit path did not emit change events. 4 were over-answers on questions outside the docs, with no gate in place. 2 were 'ignored' cases where seven sources had been sent and the right one was fifth. 1 was a leak from an internal page missing its audience tag. Each class got its own fix and its own evaluation cases; the next week's log had three entries.",
    },
    code: {
      title: "A triage helper over traces",
      lang: "ts",
      src: `export async function triage(traceId: string, relevantChunkIds: string[]) {
  const t = await traces.get(traceId);
  const retrieved = t.spans.search.candidateIds as string[];
  const sent = t.spans.context.sources as string[];
  const answer = t.spans.generate.answer as string;

  if (!relevantChunkIds.some((id) => retrieved.includes(id))) return { failure: "retrieval_miss", stage: "ingestion/search" };
  if (!relevantChunkIds.some((id) => sent.includes(id))) return { failure: "dropped_before_prompt", stage: "rerank/context" };
  if (t.spans.rerank.topScore < 0.3 && !/not (cover|address|answer)/i.test(answer)) return { failure: "over_answer", stage: "gate/generation" };
  if (sent.some((id) => t.chunks[id].version < t.documents[t.chunks[id].docId].currentVersion)) return { failure: "stale", stage: "ingestion" };
  if (sent.some((id) => !t.user.allowedAudiences.includes(t.chunks[id].audience))) return { failure: "leak", stage: "filters" };
  return { failure: "ignored_or_unfaithful", stage: "generation" };
}`,
      lines: [
        { code: "if (!relevantChunkIds.some((id) => retrieved.includes(id))) return { failure: \"retrieval_miss\", stage: \"ingestion/search\" };", say: "The answering chunk never made it into the candidates: look upstream of the prompt." },
        { code: "if (!relevantChunkIds.some((id) => sent.includes(id))) return { failure: \"dropped_before_prompt\", stage: \"rerank/context\" };", say: "Retrieved but cut by the reranker or the budget: a ranking or construction problem." },
        { code: "if (sent.some((id) => t.chunks[id].version < t.documents[t.chunks[id].docId].currentVersion)) return { failure: \"stale\", stage: \"ingestion\" };", say: "The sent chunk is from an older document version than the current one." },
        { code: "if (sent.some((id) => !t.user.allowedAudiences.includes(t.chunks[id].audience))) return { failure: \"leak\", stage: \"filters\" };", say: "A chunk the user may not see reached the prompt: a filter failure, treated as a security incident." },
      ],
      note: "Everything the helper reads was recorded by per-stage tracing; without it, triage is guesswork.",
    },
    useIt: "Keep the failure catalogue beside your evaluation dashboard. For every bad answer, read the trace, classify, fix the responsible stage, add the case, re-run. Build monitors for recall, decline accuracy, freshness lag and permission tests so failures are seen before users report them.",
    takeaways: ["Six failures: miss, ignored, over-answer, stale, leak, injection.", "Each has a signal (a metric or a trace pattern) and a responsible stage.", "Fix the stage, not the prompt by default; add the case to the evaluation.", "Per-stage tracing is what makes triage possible."],
    terms: [["retrieval miss", "the answering chunk was not among the candidates"], ["stale index", "chunks from an outdated document version still being served"], ["leak", "a chunk retrieved for a user who may not see it"], ["triage", "classifying a failure by its signal to find the responsible stage"]],
    reflect: { q: "Answers got worse after a model upgrade but every retrieval metric is unchanged. Which failure classes are possible?", a: "Only generation-side ones: ignored sources, over-answering, or unfaithful claims. Compare faithfulness and decline accuracy before and after, and check whether the new model needs stronger grounding rules or fewer sources." },
  },
};

export const M28_QUIZ: Quiz[] = [
  {
    q: "What does retrieval add that a prompt alone cannot?",
    options: ["A bigger context window", "The relevant passages from your own, current, permission-filtered documents", "Lower temperature", "Faster generation"],
    answer: 1,
    why: ["Window size is a model property.", "Correct. RAG supplies your text, fresh and filtered, so the model reads instead of recalling.", "Unrelated.", "Retrieval adds a step; it does not speed generation."],
    reason: true,
  },
  {
    q: "Whole articles are indexed and the model answers from the general returns article while the mattress rule sits in another. What is the fix?",
    options: ["A bigger model", "Chunk by heading at a few hundred tokens with the section path prefixed, and rerank", "Raise k to 50", "Lower the threshold"],
    answer: 1,
    why: ["The model answers from what it is given.", "Correct. The rule becomes its own retrievable chunk and the reranker lifts it.", "More whole articles does not surface the paragraph.", "A lower threshold adds noise."],
  },
  {
    q: "Why must the embedding model be the same for chunks and questions?",
    options: ["For speed", "Vectors from different models live in unrelated spaces; similarity between them is meaningless", "The API requires it", "It does not matter"],
    answer: 1,
    why: ["Speed is unaffected.", "Correct. Record the model per vector and re-embed on change.", "No API enforces it; your code must.", "Mixing models silently breaks search."],
  },
  {
    q: "Where should the 'customers never see staff documents' rule be enforced?",
    options: ["In the system prompt", "As a metadata filter inside the search query", "By removing results after retrieval", "In the reranker"],
    answer: 1,
    why: ["The model may not comply, and the text is already in context.", "Correct. The chunk never enters the candidates.", "Post-filtering can empty results or be forgotten on one path.", "Too late; the chunk was retrieved."],
    reason: true,
  },
  {
    q: "Hybrid search combines vector and keyword results by",
    options: ["adding the cosine and BM25 scores", "reciprocal rank fusion over the two rankings", "taking only chunks in both lists", "alternating results"],
    answer: 1,
    why: ["Scores are on unrelated scales.", "Correct. 1 ÷ (k + rank) from each list, summed.", "That discards good single-list results.", "No."],
  },
  {
    q: "What does a reranker do that similarity search cannot?",
    options: ["Searches the whole corpus faster", "Reads the question and each candidate together to judge whether the chunk answers it", "Embeds the question", "Filters by tenant"],
    answer: 1,
    why: ["It is slower per pair; it runs on candidates only.", "Correct. Cosine knows topic; the reranker knows relevance to the question.", "That is the embedding model's job.", "That is the metadata filter."],
  },
  {
    q: "The best reranker score for a question is 0.15 and no decline rule exists. What happens, and what should?",
    options: ["The model declines automatically", "The model invents an answer from weak sources; a gate should return 'not covered' before calling the model", "The search fails", "Nothing"],
    answer: 1,
    why: ["Without a rule or gate it answers.", "Correct. A gate on the score plus an explicit decline instruction.", "Search always returns something.", "A confident invented answer is the worst RAG failure."],
  },
  {
    q: "Faithfulness is 97% but recall@5 fell from 92% to 80% after a release. Where is the problem?",
    options: ["The prompt", "Ingestion or search (chunking, embeddings, filters)", "The reranker gate", "The user interface"],
    answer: 1,
    why: ["Generation is still faithful to what it receives.", "Correct. The right chunks are not being found; look upstream.", "The gate affects declines, not recall.", "No."],
  },
  {
    q: "A deleted document's text keeps appearing in answers. Which stage is at fault?",
    options: ["Generation", "Ingestion: the delete event did not remove its chunks", "Reranking", "Context construction"],
    answer: 1,
    why: ["The model answers from what it is given.", "Correct. Deletion is an ingestion event that must remove chunks, vectors and index entries.", "No.", "No."],
  },
];

export const M28_EXERCISES: Exercise[] = [
  {
    title: "Design the ingestion for a policy library",
    kind: "think",
    task: "A company has 1,200 HR policies as Word and PDF files, some with tables, edited weekly, some staff-only. Design the ingestion pipeline: triggers, extraction choices, chunking settings, metadata fields, embedding, storage, deletion and freshness monitoring.",
    hints: ["What events trigger a job?", "What must a chunk carry for filters and citations?", "How do you know the index is current?"],
    solution: "Triggers: document create/edit/delete events from the document system, queued per document version; idempotent jobs keyed by (doc, version). Extraction: DOCX to markdown; PDF with table-aware extraction and header/footer removal; OCR fallback; validation for empty or garbled text. Chunking: by heading, 400-token budget, one-paragraph overlap, tables whole with headers, title and section path prefixed. Metadata: doc id, version, title, section, audience (customer/staff/manager), effective dates, updated_at, url, language. Embedding: pinned model, batched, model id stored. Storage: Postgres with pgvector, HNSW index, filter indexes on audience and dates; delete-then-insert per document in a transaction. Deletion: delete events remove chunks and index entries. Freshness: a monitor comparing indexed version with current version per document, alerting over 10 minutes of lag.",
  },
  {
    title: "Compute retrieval metrics",
    kind: "calculate",
    task: "Three questions. Q1 has relevant chunks {A, B}; top 5 = [C, A, D, E, F]. Q2 has {G}; top 5 = [G, H, I, J, K]. Q3 has {L}; top 5 = [M, N, O, P, Q]. Compute recall@5, precision@5 and reciprocal rank for each, and the averages.",
    hints: ["recall = found relevant ÷ all relevant", "precision = found relevant ÷ 5", "reciprocal rank = 1 ÷ rank of the first relevant, 0 if none"],
    solution: "Q1: recall 1/2 = 0.5; precision 1/5 = 0.2; first relevant A at rank 2 → 0.5. Q2: recall 1/1 = 1.0; precision 0.2; rank 1 → 1.0. Q3: recall 0; precision 0; no relevant → 0. Averages: recall@5 = (0.5 + 1.0 + 0) ÷ 3 = 0.5; precision@5 = 0.133; MRR = (0.5 + 1.0 + 0) ÷ 3 = 0.5. Q3 is a retrieval miss to triage; Q1 found one of two.",
  },
  {
    title: "Fuse two rankings",
    kind: "calculate",
    task: "Vector ranking: [A, B, C, D]. Keyword ranking: [D, A, E]. Using reciprocal rank fusion with k = 60, compute each chunk's score and the fused order.",
    hints: ["Score = sum over lists of 1 ÷ (60 + rank).", "Chunks absent from a list get nothing from it."],
    solution: "A: 1/61 + 1/62 = 0.01639 + 0.01613 = 0.03252. B: 1/62 = 0.01613. C: 1/63 = 0.01587. D: 1/64 + 1/61 = 0.01563 + 0.01639 = 0.03202. E: 1/63 = 0.01587. Fused order: A, D, B, then C and E tied (0.01587). D jumps from fourth to second because it topped the keyword list.",
  },
  {
    title: "Write the grounded-generation prompt and its checks",
    kind: "code",
    task: "Write the system message for a grounded answer over numbered sources (only from sources, per-claim citations, decline on gaps, partial coverage, no unprovided citations, concise), and the code checks you run on the answer before showing it.",
    hints: ["What is a normal output when the sources are silent?", "Which citation problems can code detect, and which cannot?"],
    solution: "System: 'You answer questions using ONLY the numbered sources in <sources>. Cite the source for every claim like [2]; never cite a number not in the sources. If the sources do not answer the question, say so plainly and do not guess; if they answer part of it, answer that part and state what is not covered. At most three short paragraphs.' Checks: extract [n] markers; every n must be between 1 and the number of sent sources, else flag 'invalid citation'; if sources were sent, the answer has no citations and no decline phrase, flag 'no citations'; render valid citations as links. Code cannot check that a cited source supports the claim; that is the faithfulness grader's job in evaluation.",
  },
  {
    title: "Triage five bad answers",
    kind: "think",
    task: "Classify each and name the stage to fix: (a) the answer cites last quarter's pricing though the page was updated; (b) the answer confidently describes a feature the docs never mention; (c) the right paragraph was in the candidates at rank 9 but not in the prompt; (d) a customer's answer quotes an internal escalation procedure; (e) recall is fine but the model answered from a less relevant source that was listed first.",
    hints: ["Use the failure table: signal → stage."],
    solution: "(a) stale: ingestion did not re-index on edit; add change-event triggering and a freshness monitor. (b) over-answer: no gate or decline rule; add a reranker-score gate and the decline instruction, plus out-of-scope evaluation cases. (c) dropped before prompt: reranking or budget; add or tune the reranker and check the source budget. (d) leak: a filter missing or applied after search; enforce the audience filter in the query on every path and add the adversarial test. (e) ignored/ordering: context construction; order best-first by reranker score and reduce the number of sources.",
  },
];
