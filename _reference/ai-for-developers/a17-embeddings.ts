import type { StoryPage, Topic } from "../types";

// AI 3.5: embeddings: searching by meaning.

const SETTING = "The same online furniture shop. The help centre has about two hundred articles (delivery, returns, assembly, care, payments) in a Postgres table with a search box on top. The search runs a SQL LIKE over titles and bodies. Customers who find nothing open the Help page chat box instead, which cannot see the articles either.";
const CAST = "**Nisha** (support lead) reads the zero-result searches every Monday. **Dev** (developer) owns the help centre and its database. **Priya** (product manager) wants search that 'understands what people mean'.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Four in ten help-centre searches return nothing, because customers describe their problem in words the article does not use. 'Sofa smells' finds nothing; the article is called 'Off-gassing in new foam furniture'.",
    title: "The search that needed the exact word",
    text: "Nisha's Monday report: last week 38% of help-centre searches returned zero results, and most of those customers opened a chat or emailed. She lists the top misses. 'sofa smells' (the article says 'off-gassing'). 'stop my order' (the article says 'cancel'). 'table wobbles' (the article says 'uneven legs: adjusting the feet'). 'how long until it comes' (the article says 'delivery times').\n\nDev looks at the search: `WHERE title ILIKE '%sofa smells%' OR body ILIKE '%sofa smells%'`. It matches characters. The article about off-gassing contains neither 'smell' nor 'smells' anywhere in it. Adding synonyms by hand helped for a week, then the list of synonyms had three hundred lines and still missed 'it stinks'.\n\n**This is the problem.** People ask with their words; articles answer with the writer's words. Matching characters cannot connect the two. The search needs to match meaning.",
  },
  {
    stage: "why",
    point: "Keyword search compares strings. To compare meanings you need meaning as something a computer can compare: a list of numbers where similar meanings land close together. That is what an embedding is.",
    title: "Why a synonym list never finishes",
    text: "Synonyms fail because meaning is not a lookup table. 'Smells', 'stinks', 'chemical odour', 'weird fumes from the cushions' all mean the off-gassing article, and tomorrow someone will write it a fifth way. No finite list covers how people talk.\n\nWhat would work is a way to turn any piece of text into a position, so that texts with similar meaning sit near each other and a search becomes 'find the articles positioned nearest to this question'. Models trained on vast amounts of text (lesson 1.3) have learned exactly that: inside them, text is represented as numbers, and texts that are used in similar ways end up with similar numbers.\n\nAn **embedding model** exposes that representation directly. Give it text, get back a fixed-length list of numbers. 'Sofa smells' and 'off-gassing in new foam furniture' come back close together, not because anyone listed them as synonyms, but because the model has seen both used in the same kinds of sentences.",
  },
  {
    stage: "concept",
    point: "An embedding is a vector of numbers representing a text's meaning. Similarity is measured with cosine similarity. You embed the articles once, embed each query, and return the nearest articles. Same model on both sides, always.",
    title: "Vectors, similarity, nearest neighbours",
    text: "An **embedding** is a list of numbers, typically 256 to 3,072 of them, produced by an embedding model from a piece of text. The numbers mean nothing individually; what matters is distance. Two texts with similar meaning produce vectors that point in similar directions. **Cosine similarity** measures that: 1 means the same direction, 0 unrelated, negative means opposite. A search embeds the query and asks the database for the stored vectors with the highest similarity: the **nearest neighbours**.\n\nThe embedding model is a different, much cheaper model than the chat model. It writes nothing; it only reads and produces the vector. Every text in the index and every query must go through the same model and version, because vectors from different models are not comparable at all.\n\nTwo things embeddings are bad at. Exact identifiers: 'WL-2041' and 'WL-2014' embed almost identically, and an order number is just digits. And negation: 'sofa without armrests' sits close to 'sofa with armrests'. For codes and exact phrases, keep a keyword search alongside and combine the two.",
    jargon: [["embedding model", "a model that turns text into a vector; cheap, fast, read-only, and separate from the chat model"], ["dimension", "how many numbers are in each vector (1,024 is common); fixed by the model, the same for every text"], ["nearest neighbours", "the stored vectors most similar to the query vector; a vector index finds them without scanning every row"]],
    table: {
      head: ["Query", "Article", "Cosine similarity (illustrative)"],
      rows: [
        ["sofa smells", "Off-gassing in new foam furniture", "0.81"],
        ["sofa smells", "Delivery times by region", "0.12"],
        ["stop my order", "How to cancel an order", "0.86"],
        ["table wobbles", "Uneven legs: adjusting the feet", "0.78"],
        ["WL-2041", "WL-2014 product page", "0.97 (useless: codes need keyword search)"],
      ],
    },
  },
  {
    stage: "visual",
    point: "Indexing: embed every article with the embeddings API, store the vector next to the text in Postgres with pgvector, and build a vector index so nearest-neighbour search is fast.",
    title: "Embedding the help centre",
    text: "Dev adds pgvector to the existing Postgres database rather than a new service: two hundred articles do not need one. A nightly job and an on-save hook embed article text in batches and store the vectors. The model name is stored with each vector, so a model change can be detected and the index rebuilt.",
    codes: [
      {
        title: "The table and index",
        lang: "sql",
        src: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE help_vectors (
  article_id   int  PRIMARY KEY REFERENCES help_articles(id) ON DELETE CASCADE,
  model        text NOT NULL,
  embedding    vector(1024) NOT NULL,
  embedded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX help_vectors_hnsw ON help_vectors USING hnsw (embedding vector_cosine_ops);`,
        lines: [
          { sql: "CREATE EXTENSION IF NOT EXISTS vector;", say: "pgvector adds a vector column type and distance operators to Postgres." },
          { sql: "embedding    vector(1024) NOT NULL,", say: "One vector per article, 1,024 numbers, the dimension the chosen model produces." },
          { sql: "model        text NOT NULL,", say: "Which model made this vector. Query vectors must come from the same one." },
          { sql: "CREATE INDEX help_vectors_hnsw ON help_vectors USING hnsw (embedding vector_cosine_ops);", say: "An approximate nearest-neighbour index on cosine distance. Without it every search scans every row." },
        ],
        note: "Two hundred rows would be fine without the index. It is here so the same schema works at twenty thousand.",
      },
      {
        title: "embed() and the indexing job",
        lang: "ts",
        src: `const EMBED_MODEL = process.env.EMBED_MODEL!;   // pinned, e.g. an embeddings model from Voyage

export async function embed(texts: string[], kind: "document" | "query"): Promise<number[][]> {
  const res = await fetch(process.env.EMBED_URL!, {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.EMBED_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: kind }),
  });
  if (!res.ok) throw new Error("embed failed: " + res.status);
  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

export async function indexArticles(articles: { id: number; title: string; body: string }[]) {
  for (const batch of chunk(articles, 64)) {
    const vectors = await embed(batch.map((a) => a.title + "\\n\\n" + a.body), "document");
    await db.$transaction(batch.map((a, i) => db.$executeRaw\`
      INSERT INTO help_vectors (article_id, model, embedding) VALUES (\${a.id}, \${EMBED_MODEL}, \${toVector(vectors[i])})
      ON CONFLICT (article_id) DO UPDATE SET model = EXCLUDED.model, embedding = EXCLUDED.embedding, embedded_at = now()\`));
  }
}`,
        lines: [
          { sql: "const EMBED_MODEL = process.env.EMBED_MODEL!;   // pinned, e.g. an embeddings model from Voyage", say: "Pinned, like the chat model (lesson 1.5). Changing it means re-embedding everything." },
          { sql: "body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: kind }),", say: "Many texts per request. Some models take a hint whether the text is a document or a query; use it." },
          { sql: "for (const batch of chunk(articles, 64)) {", say: "Batches of 64: fewer requests, lower cost, and it stays under the provider's per-request limit." },
          { sql: "const vectors = await embed(batch.map((a) => a.title + \"\\n\\n\" + a.body), \"document\");", say: "Title plus body is what gets embedded. The title carries a lot of meaning for short articles." },
          { sql: "ON CONFLICT (article_id) DO UPDATE SET model = EXCLUDED.model, embedding = EXCLUDED.embedding, embedded_at = now()`));", say: "Re-running the job after an edit replaces the vector. The on-save hook calls this for one article." },
        ],
        note: "The embedding request is to a separate endpoint and key from the chat model; keep both in environment settings.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Searching: embed the query with the same model, order by cosine distance, take the top few. Combine with keyword search so exact codes and names still match, and merge the two lists by rank.",
    title: "Hybrid search: meaning plus exact words",
    text: "The search endpoint embeds the customer's query and asks Postgres for the nearest articles. In parallel it runs the old keyword search, now using Postgres full-text search instead of LIKE. The two ranked lists are merged with reciprocal rank fusion: an article near the top of either list scores well, one near the top of both scores best. 'Sofa smells' comes from the vector side; 'WL-2041' comes from the keyword side.",
    codes: [
      {
        title: "searchHelp(): vector + keyword, fused",
        lang: "ts",
        src: `export async function searchHelp(query: string, limit = 5) {
  const [qv] = await embed([query], "query");

  const byMeaning: { id: number; rank: number }[] = await db.$queryRaw\`
    SELECT article_id AS id, row_number() OVER (ORDER BY embedding <=> \${toVector(qv)}) AS rank
    FROM help_vectors WHERE model = \${EMBED_MODEL}
    ORDER BY embedding <=> \${toVector(qv)} LIMIT 20\`;

  const byWords: { id: number; rank: number }[] = await db.$queryRaw\`
    SELECT id, row_number() OVER (ORDER BY ts_rank(search_tsv, plainto_tsquery('english', \${query})) DESC) AS rank
    FROM help_articles WHERE search_tsv @@ plainto_tsquery('english', \${query}) LIMIT 20\`;

  const score = new Map<number, number>();
  for (const list of [byMeaning, byWords]) for (const r of list) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (60 + Number(r.rank)));

  const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  return db.help_articles.findMany({ where: { id: { in: ids } } });
}`,
        lines: [
          { sql: "const [qv] = await embed([query], \"query\");", say: "The query goes through the same model as the documents. Different model, meaningless distances." },
          { sql: "ORDER BY embedding <=> ${toVector(qv)} LIMIT 20`;", say: "<=> is pgvector's cosine distance. Smallest distance first; the index makes this fast." },
          { sql: "FROM help_vectors WHERE model = ${EMBED_MODEL}", say: "Only vectors from the current model are compared. Rows from an old model are ignored until re-embedded." },
          { sql: "FROM help_articles WHERE search_tsv @@ plainto_tsquery('english', ${query}) LIMIT 20`;", say: "Full-text search over a stored tsvector column. This is where 'WL-2041' and exact article titles come from." },
          { sql: "for (const list of [byMeaning, byWords]) for (const r of list) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (60 + Number(r.rank)));", say: "Reciprocal rank fusion: each list contributes 1/(60+rank). High in either list scores well; high in both scores best." },
        ],
        note: "Twenty from each side, five out. The constant 60 is the usual default; it stops a single top rank from dominating.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Embeddings are cheap, but they are a dependency: pin the model, store its name, re-embed on change, cache repeated queries, batch indexing, and measure search quality with a small set of real queries and the article each should find.",
    title: "Running it well",
    text: "Dev's checklist after the first week.\n\nThe model is pinned and its name is stored with every vector, so a provider deprecating it is a planned re-index, not a silent quality drop. Indexing runs in batches, nightly and on save. Query embeddings for the fifty most common searches are cached; the same query gives the same vector, so there is no reason to pay twice. Costs are small (a fraction of a cent per thousand articles) but they are tracked like any other.\n\nQuality is measured, not felt. Nisha's zero-result list became a test set: fifty real queries, each with the article that should appear. The job reports recall at five, the share of queries whose right article is in the top five. It was 54% with keyword search, 88% with vectors alone, 93% hybrid. Every change to the model, the chunking or the fusion runs the set again.",
    table: {
      head: ["Practice", "Why"],
      rows: [
        ["pin the embedding model and store its name per vector", "different models produce incomparable vectors; a change must re-embed everything"],
        ["batch indexing; embed on save for edits", "fewer requests, fresh vectors for edited articles"],
        ["cache query embeddings", "the same text always gives the same vector"],
        ["keep keyword search alongside", "codes, names and exact phrases embed badly"],
        ["a query → expected-article test set, recall@5", "the only way to know a change helped"],
      ],
    },
    ask: "A customer searches 'sofa WITHOUT armrests' and gets the article about sofas with armrests at the top. Which weakness is this, and what would you add?",
  },
  {
    stage: "compare",
    point: "Keyword search finds the exact words and nothing else. Embedding search finds the meaning and fumbles codes. Hybrid search with rank fusion gets both, for one extra query.",
    title: "Characters, meaning, or both",
    text: "Three ways to search the same two hundred articles: by characters, by meaning, or by both. The first is what the help centre had; the second alone would have broken product codes; the third is what shipped.",
    versus: {
      beginner: {
        title: "ILIKE and a synonym list",
        lang: "sql",
        code: "SELECT * FROM help_articles\nWHERE title ILIKE '%' || $1 || '%' OR body ILIKE '%' || $1 || '%';\n-- plus synonyms.txt, 300 lines and growing",
        points: ["Exact codes and titles work.", "'sofa smells' finds nothing; the synonym list never finishes.", "No ranking beyond 'matched or not'.", "38% zero results."],
      },
      engineer: {
        title: "Vectors for meaning, full-text for exact words, fused",
        lang: "ts",
        code: "const [qv] = await embed([query], \"query\");\n… ORDER BY embedding <=> qv LIMIT 20       // meaning\n… WHERE search_tsv @@ plainto_tsquery(query) // exact words\nfuse by reciprocal rank → top 5",
        points: ["'sofa smells' → off-gassing article at rank 1.", "'WL-2041' still exact from the keyword side.", "Ranked results; measured recall at five of 93%.", "One pinned model, one Postgres extension, no new service."],
      },
      tradeoffs: ["Every query now costs an embedding call (cheap, and cacheable).", "An index to keep fresh and a model to pin and eventually migrate.", "Negation and very short queries remain weak; a reranker (lesson 3.6) helps at the top of the list."],
      when: "Any search where people's words differ from the documents' words: hybrid. Pure identifier lookup: keyword only.",
    },
  },
  {
    stage: "recap",
    point: "An embedding turns text into a vector; cosine similarity compares vectors; nearest-neighbour search finds meaning. Same model both sides, keyword search alongside, measured with a real query set.",
    title: "Connect it back: 'sofa smells' finds the answer",
    text: "The help centre now embeds every article with a pinned model into pgvector, embeds each query the same way, and fuses the nearest articles with full-text matches. 'Sofa smells' lands on the off-gassing article; 'WL-2041' still lands on its product page. Zero-result searches fell from 38% to 6%, measured by Nisha's own list of misses, which is now the test set every change runs against.",
    recap: {
      remember: ["Embedding = vector of meaning; cosine similarity = how close; nearest neighbours = the search.", "The embedding model is separate, cheap and must be the same for documents and queries.", "Codes, names and negation embed badly: keep keyword search and fuse.", "Pin the model, store its name, re-embed on change, batch and cache.", "Measure recall on real queries before and after every change."],
      mistakes: ["Embedding documents with one model and queries with another.", "Dropping keyword search and wondering why product codes stopped matching.", "Changing the embedding model without re-indexing.", "No test set, so nobody knows whether the change helped."],
      production: ["Help-centre and documentation search, product search, duplicate detection, clustering support tickets, recommendations.", "Lesson 3.6 uses this search to feed the chat model relevant passages.", "The query → expected-result set is the first eval of lesson 3.7."],
      next: ["3.6 RAG: answers grounded in your own documents.", "3.7 Evals: tests for things that are never exactly right.", "3.9 Cost and latency: where embedding costs fit."],
    },
    ask: "Search now finds the right article. Priya's next ask: let the chat box read it and answer the question itself, with the article as its source. Next lesson.",
  },
];

export const A17: Topic = {
  slug: "embeddings",
  title: "Embeddings: searching by meaning",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Explain what an embedding is and why vectors from the same model can be compared by cosine similarity.", "Index documents into pgvector and search by nearest neighbour with the same model on both sides.", "Combine vector search with keyword search using rank fusion, and say why.", "Operate embeddings well: pin and record the model, batch, cache, re-index on change, and measure recall."],
  prerequisites: ["what-a-model-does", "how-models-are-trained"],
  story: "A map of meanings. Imagine every article pinned on a huge board so that similar topics sit near each other. A question is a pin too; the search is 'which article pins are closest?'. The embedding model is what decides where each pin goes.",
  tldr: [
    "An **embedding** is a vector that represents meaning; **cosine similarity** says how close two are.",
    "Embed documents once, embed each query, return the **nearest neighbours**. **Same model, both sides.**",
    "Embeddings fumble **codes, names and negation**: keep **keyword search** and **fuse** the rankings.",
    "**Pin** the model, **store its name**, **re-embed** on change, **batch and cache**, and **measure recall** on real queries.",
  ],
  words: [
    ["embedding", "a fixed-length vector of numbers representing a text's meaning"],
    ["cosine similarity", "a score from −1 to 1 for how closely two vectors point the same way"],
    ["nearest neighbours", "the stored vectors most similar to the query vector"],
    ["pgvector", "a Postgres extension adding a vector type, distance operators and indexes"],
    ["hybrid search", "vector search and keyword search combined by rank fusion"],
    ["recall at k", "the share of test queries whose correct result appears in the top k"],
  ],
  sections: [],
  quiz: [
    { q: "'sofa smells' returns nothing although an article about off-gassing exists. Why?", options: ["The article is too long", "Keyword search matches characters, and the article never uses the word 'smell'", "The database is slow", "The customer misspelled it"], answer: 1, reason: true, whyOptions: ["Length is irrelevant to matching.", "Correct. People's words differ from writers' words; only meaning-based search connects them.", "Speed is not the issue.", "The spelling is fine."], why: "Characters versus meaning." },
    { q: "Documents were embedded with model A; queries are embedded with model B. What happens?", options: ["It works, slightly worse", "Distances are meaningless; results are random", "It is faster", "Nothing changes"], answer: 1, whyOptions: ["Not slightly: the vector spaces are unrelated.", "Correct. Vectors are only comparable within one model and version.", "No.", "The results stop meaning anything."], why: "Same model, both sides, always." },
    { q: "Why keep keyword search next to vector search?", options: ["Vectors are too expensive", "Product codes, names and exact phrases embed badly", "Postgres cannot do both", "Keyword search is always better"], answer: 1, whyOptions: ["They are cheap.", "Correct. 'WL-2041' and 'WL-2014' look identical to an embedding model; fusing both lists fixes it.", "It can; that is the point.", "It misses meaning."], why: "Meaning from vectors, exactness from words." },
  ],
  practice: [
    { q: "The provider announces the embedding model will be retired in 60 days. Plan the migration.", answer: "Pin the new model in config under a new name; add a background job that embeds all articles with the new model into rows tagged with it (the table allows one row per article, so use a second table or add the model to the key); switch the search's model filter in one deploy once coverage is complete; run the recall test set on both before switching; delete old vectors after.", explain: "Store the model name; migrate by re-embedding; switch atomically; measure." },
    { q: "Write the recall@5 check as a test.", answer: "A JSON list of { query, expectedArticleId } (Nisha's fifty misses plus common queries). For each, call searchHelp(query, 5) and record whether expectedArticleId is in the ids. Report the share; fail the build if it drops more than 3 points below the recorded baseline. Run on changes to the model, fusion constants or article chunking.", explain: "A small, real test set guards against regressions." },
    { q: "Searches for 'order 48213' should find the order, not help articles. What do you do?", answer: "Route before searching: a cheap check (regex for an order number, or a classifier) sends identifier-shaped queries to the orders lookup (scoped to the signed-in customer) and natural-language queries to hybrid help search. Embeddings are the wrong tool for identifiers.", explain: "Identifiers go to exact lookup; sentences go to meaning search." },
  ],
  interview: [
    { level: "junior", q: "What is an embedding?", a: "A fixed-length list of numbers produced by an embedding model from a piece of text, arranged so that texts with similar meaning get vectors that point in similar directions. You compare them with cosine similarity and search by finding the nearest vectors to a query's vector." },
    { level: "mid", q: "How do you build semantic search over a set of documents?", a: "Pick and pin an embedding model; embed each document (in batches) and store the vector with the document id and model name, for example in Postgres with pgvector and an HNSW index; at query time embed the query with the same model, order by cosine distance, take the top k; combine with full-text search by rank fusion; measure recall on a set of real queries." },
    { level: "mid", tricky: true, q: "Can I switch to a better embedding model without touching the index?", a: "No. Vectors from different models live in unrelated spaces, so queries embedded with the new model would be compared against meaningless numbers. Re-embed every document with the new model, verify on the test set, then switch the query side in the same deploy." },
    { level: "mid", q: "What does cosine similarity measure and why not Euclidean distance?", a: "The cosine of the angle between two vectors: 1 for the same direction, 0 for unrelated. It ignores vector length, which for most embedding models carries no meaning; many models normalise vectors so cosine and dot product coincide. Euclidean distance works too for normalised vectors but cosine is the convention." },
    { level: "senior", q: "Where do embeddings fail, and what do you do about it?", a: "Exact identifiers and codes (near-identical vectors), negation and small qualifiers ('without'), very short or very long texts, domain jargon the model has not seen, and cross-lingual queries with a monolingual model. Mitigations: hybrid search with keyword matching, routing identifiers to exact lookup, chunking long texts, a reranker over the top results, a domain-tuned model if volume justifies it." },
    { level: "mid", tricky: true, q: "Vector search returned the sofa-with-armrests article for 'sofa without armrests'. Is the index broken?", a: "No; negation is a known weakness of embeddings. The vectors for the two phrases are close. Add keyword signals, a reranker that reads the query and the passage together, or a structured filter (a product attribute for armrests) rather than expecting the embedding to carry the 'without'." },
    { level: "junior", q: "What is pgvector?", a: "A Postgres extension that adds a vector column type, distance operators such as <=> for cosine distance, and index types (HNSW, IVFFlat) for fast approximate nearest-neighbour search, so you can keep embeddings next to your existing data." },
    { level: "senior", q: "How do you measure search quality?", a: "Build a test set of real queries with the result each should return (from zero-result logs and support tickets). Report recall at k and mean reciprocal rank. Run it on every change to the model, chunking, fusion weights or filters, and keep a baseline so regressions fail the build. Complement with click data in production." },
    { level: "mid", q: "What is reciprocal rank fusion?", a: "A way to merge ranked lists from different searches: each item scores the sum over lists of 1/(k + rank), with k around 60. Items near the top of any list score well; items near the top of several score best. It needs no score normalisation between keyword and vector search." },
    { level: "mid", q: "What do you cache in an embedding-based search?", a: "Query embeddings for repeated queries (same text, same model, same vector), and the final results for hot queries with a short TTL. Document embeddings are stored permanently until the document or the model changes." },
  ],
  remember: [
    "Vector of meaning; cosine for closeness; nearest neighbours for search.",
    "Same embedding model for documents and queries.",
    "Hybrid: fuse vector and keyword rankings.",
    "Pin, record, re-embed, batch, cache, measure recall.",
  ],
};
