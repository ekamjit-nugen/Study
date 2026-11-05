import type { Exercise, LessonBody, Quiz } from "../types";

// Module 29: Vector databases and search. One concept per lesson.

export const M29_BODIES: Record<string, LessonBody> = {
  "m29-vector-databases": {
    simple: "A vector database stores embeddings next to their metadata and finds the vectors closest to a query vector quickly, even when there are millions of them.",
    concept:
      "An embedding is a list of numbers that places a piece of text (or an image) somewhere in a high-dimensional space, so that similar meanings sit close together. A **vector database** is the store built for those lists. It keeps each vector with an id and metadata (title, date, tenant, tags), and its one special operation is nearest-neighbour search: given a query vector, return the k stored vectors most similar to it.\n\nOrdinary databases can hold vectors as arrays but cannot search them efficiently: comparing a query with every row is fine for ten thousand rows and hopeless for ten million. Vector databases add indexes designed for similarity search, plus the storage layout, filtering and scaling that search needs. Some are extensions to databases you already run, such as pgvector for Postgres; some are dedicated services; some are libraries you embed in a process.\n\nThe database does not create meaning. The embedding model decides where vectors land; the database only finds neighbours fast.",
    why:
      "Semantic search, retrieval-augmented generation, recommendations and duplicate detection all come down to the same query: which stored items are closest to this one? At small scale a loop over all vectors works. Products grow: a support knowledge base becomes a hundred thousand chunks, a product catalogue a few million. Without an index, every search is a full scan of millions of 1,000-number vectors, which takes seconds and saturates the CPU. Vector databases exist to make that query take milliseconds, and to do it with filters, updates and replication like any production store.",
    how: [
      "Each document chunk is embedded once and stored as (id, vector, metadata).",
      "An index is built over the vectors so that search does not touch every row.",
      "A query is embedded with the same model and sent with k and any metadata filter.",
      "The index returns candidate ids with distances; the database applies filters and fetches metadata.",
      "The application takes the top k, usually reranks them, and uses the text they point to.",
    ],
    visual: {
      kind: "flow",
      steps: ["chunk text", "embedding model → vector", "store (id, vector, metadata) + index", "query text → vector (same model)", "nearest-neighbour search with filter", "top-k ids + distances → text"],
      caption: "The same model on both sides; the database's job is the fifth box.",
    },
    everyday: {
      title: "A library sorted by subject instead of by title",
      text: "A library shelved alphabetically needs the exact title. A library arranged by subject, with similar books near each other, lets you walk to the right shelf and look around. A vector database is the second library: the embedding decides which shelf a book belongs on, and the index is the map that gets you to the shelf without walking every aisle.",
    },
    engineering: {
      title: "Support search for a software company",
      text: "A help centre with 60,000 article chunks started with a nightly job that loaded every vector into memory and compared the query with all of them. Searches took 1.5 seconds and the process used 3 GB of RAM. Moving the vectors into pgvector with an HNSW index inside the existing Postgres instance cut search to 20 milliseconds, let the team filter by product and language in the same query, and meant chunks could be inserted and deleted the moment an article changed. No new service was added; the database they already backed up now held the vectors too.",
    },
    maths: {
      formula: "full scan cost ≈ N × d multiplications per query",
      meaning: "N stored vectors, each of d dimensions: a scan computes one dot product (d multiplications) per vector.",
      worked: [
        "N = 10,000 chunks, d = 1,024: 10,000 × 1,024 ≈ 10 million multiplications; a few milliseconds. A scan is fine.",
        "N = 5 million, d = 1,024: 5 × 10⁹ multiplications per query; around a second on one core, and that is one query.",
        "An index that visits only 0.2% of vectors turns that into 10 million multiplications again: back to milliseconds.",
      ],
      note: "The crossover where you need an index is usually somewhere between a hundred thousand and a million vectors, depending on latency targets.",
    },
    code: {
      title: "Store and search with pgvector",
      lang: "sql",
      src: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id        bigserial PRIMARY KEY,
  doc_id    text NOT NULL,
  product   text NOT NULL,
  lang      text NOT NULL,
  body      text NOT NULL,
  embedding vector(1024) NOT NULL
);

CREATE INDEX chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops);

-- top 5 nearest chunks for a query vector, within one product and language
SELECT id, doc_id, body, embedding <=> $1 AS distance
FROM chunks
WHERE product = 'billing' AND lang = 'en'
ORDER BY embedding <=> $1
LIMIT 5;`,
      lines: [
        { code: "embedding vector(1024) NOT NULL", say: "A vector column of fixed dimension, matching the embedding model." },
        { code: "CREATE INDEX chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops);", say: "The index that makes nearest-neighbour search fast; cosine distance is the metric." },
        { code: "WHERE product = 'billing' AND lang = 'en'", say: "Metadata filters sit in the same query as the similarity search." },
        { code: "ORDER BY embedding <=> $1", say: "The <=> operator is cosine distance; ordering by it with LIMIT is the nearest-neighbour query." },
      ],
    },
    useIt: "Use a vector database whenever you store more than a few hundred thousand embeddings, need metadata filters with similarity search, or need live inserts and deletes: RAG over documents, semantic product search, similar-ticket lookup, deduplication. Start with an extension to the database you already run.",
    takeaways: ["A vector database stores (id, vector, metadata) and answers 'which k are nearest to this vector?' fast.", "The embedding model decides meaning; the database only finds neighbours.", "Full scans work at small scale; indexes are what make millions of vectors searchable.", "Filters, updates and replication make it a production store, not just an index."],
    terms: [["vector database", "a store built for embeddings and nearest-neighbour search"], ["nearest-neighbour search", "finding the stored vectors closest to a query vector"], ["metadata", "the structured fields stored with each vector, used for filtering"], ["pgvector", "the Postgres extension that adds vector columns, operators and indexes"]],
    reflect: { q: "Two teams embed the same documents with different models and store them in the same table. What happens to search?", a: "Nothing useful: distances only mean something between vectors from the same model. A query embedded with model A will find near-random neighbours among model B's vectors. One model per table or collection, and re-embed everything when the model changes." },
  },

  "m29-vector-indexing": {
    simple: "A vector index is a data structure that lets search visit a small fraction of the stored vectors and still find the nearest ones, trading a little accuracy for a large speed-up.",
    concept:
      "A **vector index** organises vectors so that a query can skip most of them. Unlike a B-tree on a number column, which finds exact matches by comparison, a vector index has to answer 'which are closest?', and closeness in a thousand dimensions does not sort neatly. So vector indexes group, link or compress vectors in ways that let the search move toward the right region and stop early.\n\nAll of them trade exactness for speed: the index returns the true nearest neighbours most of the time, and a close-but-not-closest neighbour occasionally. The measure of that trade is recall: the share of the true top-k the index actually returned. An index tuned for 98% recall at 10 milliseconds is the typical production target.\n\nThe main families are graph indexes (HNSW), partition indexes (IVF) and compressed indexes (product quantisation), each covered in its own lesson. They can be combined: IVF partitions with PQ-compressed vectors inside is a common pairing.",
    why:
      "A full scan is exact and slow in proportion to the collection. Indexes exist because the applications that need vector search also need it in tens of milliseconds, under concurrent load, over collections that keep growing. The accuracy trade is acceptable because downstream steps (reranking, the model reading the retrieved text) tolerate a near-miss at position five far better than they tolerate a two-second wait.",
    how: [
      "At build time, the index reads every vector and arranges it: into clusters, into a graph of neighbours, or into compressed codes.",
      "At query time, the search uses that arrangement to pick a small candidate set near the query.",
      "Exact distances are computed only for the candidates; the best k are returned.",
      "Parameters control how wide the search looks: more candidates means higher recall and more time.",
      "Recall is measured against a brute-force scan on a sample, and the parameters are tuned to hit a target.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Index family", "Idea", "Strength", "Cost"],
        rows: [
          ["none (flat)", "compare with every vector", "exact", "time grows with N"],
          ["graph (HNSW)", "links each vector to near neighbours; walk the graph", "fast, high recall, incremental inserts", "memory for the links"],
          ["partition (IVF)", "cluster vectors; search only the nearest clusters", "simple, low memory, fast builds", "recall drops at cluster edges"],
          ["compression (PQ)", "store short codes instead of full vectors", "fits huge collections in RAM", "approximate distances"],
        ],
      },
      caption: "Every row below the first is approximate on purpose.",
    },
    everyday: {
      title: "Finding a friend in a stadium",
      text: "Checking every seat is exact and takes all afternoon. Knowing their block narrows it to one section; asking the people around for someone matching the description gets you there in minutes. You might occasionally approach a lookalike first, but you will find them. Indexes are the block numbers and the asking around.",
    },
    engineering: {
      title: "Tuning for a product catalogue",
      text: "A marketplace with 4 million product embeddings measured a flat scan at 900 milliseconds per query. They built an HNSW index and measured recall@10 against the flat scan on 2,000 sample queries: with a narrow search setting recall was 91% at 4 milliseconds; widening it gave 98% at 11 milliseconds. They chose the second: a 2% miss at rank ten is invisible to shoppers, an 80-fold speed-up is not. The recall benchmark now runs after every index rebuild.",
    },
    maths: {
      formula: "recall@k = |index top-k ∩ true top-k| ÷ k",
      meaning: "Compare the index's answer with the exact (brute-force) answer for the same query; the share of overlap is the recall. Average it over many queries.",
      worked: [
        "For one query the exact top-5 ids are {12, 48, 7, 91, 33}. The index returns {12, 48, 7, 91, 60}.",
        "Overlap is four of five: recall@5 = 4 ÷ 5 = 0.8 for this query.",
        "Over 2,000 queries the average is 0.97: the index returns 97% of the true neighbours.",
        "Speed-up: flat scan 900 ms, index 11 ms: about 82 times faster for a 3-point recall loss.",
      ],
    },
    code: {
      title: "Measuring index recall against a flat scan",
      lang: "py",
      src: `import numpy as np

def exact_topk(query, vectors, k):
    sims = vectors @ query                 # cosine if all vectors are unit length
    return set(np.argsort(-sims)[:k])

def recall_at_k(index, queries, vectors, k=10):
    total = 0.0
    for q in queries:
        truth = exact_topk(q, vectors, k)
        got = set(index.search(q, k))      # the approximate index under test
        total += len(truth & got) / k
    return total / len(queries)

print("recall@10:", round(recall_at_k(hnsw, sample_queries, all_vectors), 3))`,
      lines: [
        { code: "sims = vectors @ query                 # cosine if all vectors are unit length", say: "The exact answer: one dot product per stored vector." },
        { code: "got = set(index.search(q, k))      # the approximate index under test", say: "What the index returns for the same query." },
        { code: "total += len(truth & got) / k", say: "The overlap share for this query; averaged over the sample." },
      ],
      note: "Run this on a few thousand real queries whenever the index parameters, the data or the embedding model change.",
    },
    useIt: "Add an index as soon as search latency or CPU becomes noticeable, measure its recall against a flat scan on real queries, and tune its search width to a recall target. Re-measure after rebuilds and data growth.",
    takeaways: ["Indexes let search skip most vectors; they are approximate by design.", "Recall@k against a brute-force scan is how the trade-off is measured.", "Graph, partition and compression families, often combined.", "Tune search width to a recall target; re-measure when data or models change."],
    terms: [["vector index", "a structure that lets nearest-neighbour search skip most vectors"], ["recall@k", "the share of the true top-k neighbours an index returns"], ["flat index", "no index: a full scan, exact and slow"]],
    reflect: { q: "Recall is 99% but users complain the top result is often slightly off. What else could be wrong?", a: "The embedding or the query, not the index: 99% recall means the index finds what the model thinks is nearest. If that is wrong, the fix is the embedding model, the chunking or a reranker." },
  },

  "m29-exact-nearest-neighbour-search": {
    simple: "Exact nearest-neighbour search compares the query with every stored vector and returns the true closest ones. It is simple and correct, and its cost grows with the number of vectors.",
    concept:
      "**Exact nearest-neighbour search**, also called brute force or a flat scan, does the obvious thing: compute the distance from the query to every vector, sort, take the top k. There is no index and no approximation; the result is the ground truth every approximate method is measured against.\n\nIts cost is linear in the collection: N vectors of d dimensions means N × d multiplications per query. On modern hardware with vectorised maths that is fast for tens of thousands of vectors and acceptable for a few hundred thousand if queries are rare. GPUs push the limit further. Beyond that, it becomes the bottleneck.\n\nExact search has a permanent role even in systems that use indexes: as the reference for recall benchmarks, for small collections where an index is not worth building, and for the final reranking step over a shortlist, where comparing a few hundred candidates exactly is cheap.",
    why:
      "Every search system should start exact. It has no parameters to tune, cannot miss, and makes the first version of a feature a few lines of code. Many products never outgrow it: a company's internal documents, a product range of twenty thousand items, a per-user set of notes. Knowing where the linear cost bites tells you when to add an index, and the exact scan is what you use to prove the index is good enough.",
    how: [
      "Normalise every stored vector and the query to unit length so cosine similarity is a dot product.",
      "Compute the dot product of the query with every stored vector in one matrix operation.",
      "Partially sort to get the k largest similarities.",
      "Return the ids and scores.",
      "If this takes too long at your size and query rate, add an index and benchmark it against this.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Exact (flat)", points: ["Correct every time", "No build step, no parameters", "Cost ∝ N × d per query", "Right for tens of thousands of vectors, and for reranking shortlists"] },
      right: { title: "Approximate (indexed)", points: ["Usually correct; recall under 100%", "Build time and tuning", "Cost ∝ log N or a small fixed fraction", "Right for millions of vectors under latency targets"] },
      caption: "Start on the left. Move right when the latency numbers say so.",
    },
    everyday: {
      title: "Checking every price in a small shop",
      text: "In a corner shop you can find the cheapest coffee by looking at every tin; it takes a minute. In a warehouse with a hundred thousand products, looking at every item is a day's work, and you want a catalogue. Exact search is looking at every tin; it is the right method until the shop becomes a warehouse.",
    },
    engineering: {
      title: "An internal policy assistant that never needed an index",
      text: "A 400-person company built a policy question-answering assistant over 3,200 chunks. The engineer stored vectors in a Postgres array column and ran a flat scan in SQL: 3,200 dot products per query, under two milliseconds. Two years later the corpus is 9,000 chunks and search is still under five milliseconds. They never added an index because the benchmark says they do not need one, and the simplicity has meant zero search incidents.",
    },
    maths: {
      formula: "similarity(q, v) = q · v = Σ qᵢ vᵢ   (for unit-length q and v)",
      meaning: "With both vectors normalised, the dot product equals the cosine similarity: 1 for identical direction, 0 for unrelated.",
      worked: [
        "Three-dimensional toy vectors: q = (0.6, 0.8, 0), a = (0.6, 0.8, 0), b = (0, 0.6, 0.8), c = (0.8, 0, 0.6).",
        "q · a = 0.36 + 0.64 + 0 = 1.00. q · b = 0 + 0.48 + 0 = 0.48. q · c = 0.48 + 0 + 0 = 0.48.",
        "Top-1 is a (identical); b and c tie at 0.48. Exact search returns a, then b and c in insertion order.",
        "Cost: 3 vectors × 3 dimensions = 9 multiplications. For 200,000 vectors of 1,024 dimensions: about 205 million, a few tens of milliseconds with vectorised maths.",
      ],
    },
    code: {
      title: "Exact search in ten lines",
      lang: "py",
      src: `import numpy as np

vectors = np.load("chunks.npy")                       # shape (N, d), already unit length
ids = np.load("chunk_ids.npy")

def search(query_vec, k=5):
    q = query_vec / np.linalg.norm(query_vec)          # normalise the query
    sims = vectors @ q                                 # one dot product per stored vector
    top = np.argpartition(-sims, k)[:k]                # k best, unordered
    top = top[np.argsort(-sims[top])]                  # order them
    return [(ids[i], float(sims[i])) for i in top]

print(search(embed("how do I reset my password")))`,
      lines: [
        { code: "q = query_vec / np.linalg.norm(query_vec)          # normalise the query", say: "Unit length, so the dot product is cosine similarity." },
        { code: "sims = vectors @ q                                 # one dot product per stored vector", say: "The whole scan in one matrix-vector multiply; this line is the N × d cost." },
        { code: "top = np.argpartition(-sims, k)[:k]                # k best, unordered", say: "A partial sort: finding the top k without sorting all N." },
      ],
    },
    useIt: "Use exact search for collections up to a few hundred thousand vectors, for per-user or per-tenant sets, as the recall benchmark for any index, and for exact reranking of a shortlist. Add an index only when measured latency demands it.",
    takeaways: ["Exact search compares with every vector: correct, simple, linear cost.", "Normalise vectors so cosine similarity is a dot product done as one matrix multiply.", "Fine for tens to hundreds of thousands of vectors; the reference for every index.", "Still used for reranking shortlists exactly."],
    terms: [["exact nearest-neighbour search", "comparing the query with every stored vector; also called brute force or flat"], ["normalisation", "scaling a vector to length 1"], ["partial sort", "finding the top k without fully sorting everything"]],
    reflect: { q: "Your flat scan takes 40 ms at 300,000 vectors and the product tolerates 100 ms. Should you add an index now?", a: "Not yet, unless growth or query concurrency will push it past the budget soon. Record the growth rate and the CPU use under load; add the index when the forecast crosses the limit, and benchmark it against this scan." },
  },

  "m29-approximate-nearest-neighbour-search": {
    simple: "Approximate nearest-neighbour search returns vectors that are almost certainly among the closest, in a small fraction of the time of an exact scan, by searching only the most promising region.",
    concept:
      "**Approximate nearest-neighbour** (ANN) search gives up the guarantee of the exact top k in exchange for speed that does not grow linearly with the collection. An ANN index arranges vectors so the search can head toward the query's neighbourhood and examine only the candidates there. Most of the time those candidates include the true nearest neighbours; sometimes one is missed.\n\nThe trade is tunable. Every ANN method has a search-width parameter: how many clusters to probe, how many graph nodes to visit, how many candidates to keep. Wider means higher recall and more time. Narrower means faster and more misses. Teams pick a point on that curve for their latency budget and recall target.\n\nANN is the default for production vector search at scale. The downstream reader, whether a reranker or the language model, is robust to a near-miss at the margin, and users never see the difference, while they would certainly notice a two-second search.",
    why:
      "Nearest-neighbour search in high dimensions has no exact shortcut: no tree or hash gives both exactness and sub-linear time once d is in the hundreds. So the field accepted approximation, and found that giving up a few percent of recall buys orders of magnitude in speed and memory. That is what makes semantic search over millions of items affordable, and why every vector database is built around ANN indexes.",
    how: [
      "Build: the index preprocesses all vectors into clusters, a graph, or compressed codes.",
      "Query: the search starts from an entry point (a cluster centre, a graph node) chosen to be near the query.",
      "It explores outward within a budget set by the search-width parameter, collecting candidates.",
      "Exact distances are computed for the candidates; the best k are returned.",
      "Recall is measured against a flat scan; the width parameter is raised or lowered to hit the target.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Search width", "Vectors visited (of 4M)", "Latency", "recall@10"],
        rows: [
          ["narrow", "~2,000", "3 ms", "0.90"],
          ["medium", "~8,000", "7 ms", "0.96"],
          ["wide", "~25,000", "15 ms", "0.99"],
          ["flat scan", "4,000,000", "900 ms", "1.00"],
        ],
      },
      caption: "Illustrative numbers for an HNSW index. The product chooses a row.",
    },
    everyday: {
      title: "Looking for a restaurant in a new city",
      text: "You could rank every restaurant in the city (exact). Instead you walk to the old town, look at the ten places on the main square, and pick the best (approximate). You might miss a better place two streets away; you will eat well within ten minutes. Widening the search means walking a few more streets.",
    },
    engineering: {
      title: "Similar-paper search over 30 million abstracts",
      text: "A research tool lets scientists find papers similar to one they are reading, across 30 million embedded abstracts. A flat scan would take seconds per query and more memory than one machine has. An ANN index with compressed vectors fits in 40 GB and answers in 20 milliseconds at 95% recall@20. The team validated that scientists rate the results as highly as results from the exact scan in a blind test of 200 queries, then shipped the approximate version, because the difference was invisible to users and the cost difference was not.",
    },
    maths: {
      formula: "speed-up ≈ N ÷ candidates visited;   acceptable loss = 1 − recall target",
      meaning: "If the index visits a fixed number of candidates regardless of N, the speed-up over a flat scan grows with N while recall stays set by the width parameter.",
      worked: [
        "N = 4,000,000; the index visits 8,000 candidates: speed-up ≈ 500×.",
        "Recall target 0.96 means accepting that, on average, 0.4 of the true top-10 is replaced by a near-miss.",
        "Grow N to 40,000,000 with the same width: visits stay around 8,000 (plus a little), speed-up ≈ 5,000×; recall may drop slightly, so re-measure and widen if needed.",
      ],
    },
    code: {
      title: "Trading recall for time with one parameter",
      lang: "py",
      src: `import hnswlib, numpy as np

index = hnswlib.Index(space="cosine", dim=1024)
index.init_index(max_elements=4_000_000, ef_construction=200, M=16)
index.add_items(vectors, ids)

for ef in (32, 64, 128, 256):          # search width
    index.set_ef(ef)
    r = recall_at_k(index, sample_queries, vectors, k=10)
    print("ef", ef, "recall@10", round(r, 3))

index.set_ef(128)                      # the smallest width that meets the 0.98 target
labels, distances = index.knn_query(query_vec, k=10)`,
      lines: [
        { code: "index.init_index(max_elements=4_000_000, ef_construction=200, M=16)", say: "Build-time parameters: how carefully the index is constructed and how many links each node keeps." },
        { code: "index.set_ef(ef)", say: "The search-width parameter. Raising it visits more candidates: higher recall, more time." },
        { code: "index.set_ef(128)                      # the smallest width that meets the 0.98 target", say: "Pick the narrowest setting that hits the recall target measured on real queries." },
      ],
    },
    useIt: "Use ANN for any collection where a flat scan exceeds the latency budget. Measure recall against exact search, choose the narrowest width that meets your target, and re-measure as the data grows. Pair it with a reranker so near-misses at the margin do not matter.",
    takeaways: ["ANN trades a few percent of recall for orders of magnitude in speed and memory.", "One search-width parameter moves you along the recall–latency curve.", "Measure recall against a flat scan on real queries; re-measure as data grows.", "Downstream rerankers and models tolerate near-misses; users do not tolerate slow search."],
    terms: [["approximate nearest-neighbour (ANN)", "search that returns near-certain, not guaranteed, nearest neighbours"], ["search width", "the parameter controlling how many candidates an ANN search examines"], ["recall target", "the minimum share of true neighbours the index must return"]],
    reflect: { q: "After doubling the data, latency is unchanged but recall quietly fell from 0.98 to 0.93. Why, and what do you do?", a: "The width parameter visits roughly the same number of candidates while the true neighbours are now spread over twice as many vectors. Re-run the benchmark and widen the search, or rebuild the index with stronger build parameters." },
  },

  "m29-hnsw": {
    simple: "HNSW is a graph index: each vector links to its near neighbours across several layers, and a search walks from a coarse top layer down to the fine bottom layer, getting closer at every step.",
    concept:
      "**HNSW** (Hierarchical Navigable Small World) builds a graph where every vector is a node linked to a handful of its nearest neighbours. Searching means greedy walking: start at some node, look at its neighbours, move to whichever is closest to the query, repeat until no neighbour is closer. On a single flat graph that walk can take many hops from a bad start.\n\nThe hierarchy fixes the start. HNSW keeps several layers: the top layer has a few nodes with long-range links, like motorways; each lower layer has more nodes and shorter links; the bottom layer has every vector. A search starts at the top, walks to the closest node there, drops a layer, keeps walking, and repeats until the bottom, where it explores a small neighbourhood and returns the best k.\n\nTwo build parameters matter: M, how many links each node keeps, and ef_construction, how carefully neighbours are chosen at insert time. One search parameter, ef, sets how many candidates the bottom-layer exploration keeps. HNSW gives high recall at low latency and supports inserting vectors one at a time, which is why it is the default in most vector databases.",
    why:
      "Partition-based indexes lose recall at cluster boundaries and need periodic retraining; compression trades accuracy for memory. Graph search has neither problem: a greedy walk reaches the query's neighbourhood from anywhere in a logarithmic number of hops, recall is high, and new vectors are linked in as they arrive. The cost is memory for the links, typically tens of bytes per vector per link, and a slower build. For collections that fit in RAM and need fast, accurate, incremental search, which is most production RAG and product search, that trade is right.",
    how: [
      "Insert: pick a random top layer for the new vector (most vectors live only in the bottom layer); from the top, greedily find its neighbourhood on each layer and link it to its M nearest nodes there.",
      "Search: start at the entry node on the top layer; move to the neighbour closest to the query until stuck; descend.",
      "Repeat the greedy descent through each layer.",
      "On the bottom layer, run a best-first exploration keeping ef candidates; stop when no candidate improves.",
      "Return the best k from the candidate set, with exact distances.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "Layer 2 (sparse)", detail: "a few nodes, long links; walk to the one nearest the query" },
        { label: "Layer 1", detail: "more nodes; continue the walk from the node found above" },
        { label: "Layer 0 (every vector)", detail: "short links; explore the neighbourhood keeping ef candidates" },
        { label: "Result", detail: "the k closest candidates, by exact distance" },
      ],
      caption: "Coarse to fine. Each layer gets the walk close enough for the next layer to finish it.",
    },
    everyday: {
      title: "Motorways, A-roads, streets",
      text: "To reach an address across the country you take the motorway to the right region, A-roads to the town, and streets to the door. You never consider every street in the country. HNSW's top layer is the motorway network, the bottom layer is every street, and the search is the drive.",
    },
    engineering: {
      title: "A product catalogue that changes all day",
      text: "A marketplace adds and removes thousands of listings an hour. An IVF index needed a rebuild to stay accurate as the data drifted, and rebuilds took an hour during which new listings were unsearchable. Switching to HNSW in their vector store let listings become searchable the moment they were inserted, with recall@10 at 0.98 and 9 ms queries over 6 million vectors. Memory rose by about 30% for the links; the team accepted that for the freshness.",
    },
    maths: {
      formula: "hops per search ≈ O(log N);   memory per vector ≈ d × 4 bytes + M × 2 × 8 bytes (approx.)",
      meaning: "The layered walk reaches the neighbourhood in a number of hops that grows with the logarithm of N; memory is the raw vector plus the stored links.",
      worked: [
        "N = 6,000,000, d = 1,024, M = 16: the vector itself is 1,024 × 4 = 4,096 bytes.",
        "Links: roughly 2 × M = 32 neighbours on the bottom layer at 8 bytes each ≈ 256 bytes, plus a little for upper layers.",
        "Total ≈ 4.35 KB per vector; 6 million vectors ≈ 26 GB. The links are about 6% of it; the raw vectors dominate.",
        "To shrink memory, compress the vectors (product quantisation), not the links.",
      ],
    },
    code: {
      title: "Build, insert incrementally, search",
      lang: "py",
      src: `import hnswlib

index = hnswlib.Index(space="cosine", dim=1024)
index.init_index(max_elements=10_000_000, M=16, ef_construction=200)

# initial bulk load
index.add_items(initial_vectors, initial_ids)

# later: new listings arrive one batch at a time, searchable immediately
index.add_items(new_batch_vectors, new_batch_ids)

index.set_ef(128)
labels, distances = index.knn_query(query_vec, k=10)

# deletions are marked, not physically removed; rebuild occasionally if many are deleted
index.mark_deleted(removed_listing_id)`,
      lines: [
        { code: "index.init_index(max_elements=10_000_000, M=16, ef_construction=200)", say: "M links per node; ef_construction controls insert care. Higher values: better recall, slower build, more memory." },
        { code: "index.add_items(new_batch_vectors, new_batch_ids)", say: "Incremental inserts link new vectors into the graph; no rebuild needed." },
        { code: "index.set_ef(128)", say: "Search width on the bottom layer; tune to the recall target." },
        { code: "index.mark_deleted(removed_listing_id)", say: "Deletes are tombstones. Many deletes degrade the graph, so rebuild periodically." },
      ],
    },
    useIt: "Choose HNSW for collections that fit in memory and need fast, accurate search with live inserts: RAG indexes, product and content search, similar-item lookup. Tune M and ef_construction at build, ef at search, and rebuild after heavy deletion. Combine with compression when memory is the limit.",
    takeaways: ["HNSW is a layered neighbour graph; search walks coarse to fine, then explores locally.", "High recall, low latency, incremental inserts; the default in most vector databases.", "Parameters: M and ef_construction at build, ef at search.", "Memory is mostly the vectors themselves; compress vectors, not links, to save it."],
    terms: [["HNSW", "Hierarchical Navigable Small World: a layered graph index for ANN search"], ["greedy walk", "repeatedly moving to the neighbour closest to the query"], ["ef", "the number of candidates kept during the bottom-layer search"], ["M", "the number of links each node keeps to its neighbours"]],
    reflect: { q: "Why not set M and ef to very large values and get near-perfect recall?", a: "Because build time, memory and query time all rise with them, and past a point recall barely moves. The right values are the smallest that meet the measured recall target at the required latency." },
  },

  "m29-ivf": {
    simple: "IVF partitions vectors into clusters around centroids and searches only the few clusters whose centroids are nearest the query, which is simple, memory-light and fast to build.",
    concept:
      "**IVF** (inverted file index) borrows an idea from text search. First, cluster all vectors into, say, 4,096 groups with k-means; each group has a centroid. Each vector is stored in the list belonging to its nearest centroid. At query time, compare the query with the 4,096 centroids (cheap), pick the nprobe nearest clusters, and scan only the vectors in those lists.\n\nThe trade is at the edges: a vector that is near the query but sits just across a cluster boundary is missed unless its cluster is among those probed. Raising nprobe fixes that at the cost of scanning more vectors. IVF builds quickly, uses almost no extra memory beyond the centroids, and pairs naturally with compression inside the lists.\n\nIts weakness is drift: the centroids were trained on the data at build time, and if the data distribution changes, lists become uneven and recall falls until the index is retrained.",
    why:
      "IVF exists because it is cheap: no graph to store, a build that is just k-means, and a search that is two small scans. For very large collections on limited memory, or on disk, it is often the practical choice, especially combined with product quantisation. Where HNSW wins on recall and freshness, IVF wins on memory, build time and simplicity, and understanding both lets you choose the right one for a given store.",
    how: [
      "Train: run k-means over a sample of vectors to get nlist centroids.",
      "Assign: put each vector into the list of its nearest centroid.",
      "Query: compute distances from the query to all centroids; take the nprobe nearest.",
      "Scan every vector in those nprobe lists exactly; return the best k.",
      "Monitor list sizes and recall; retrain centroids when the data distribution drifts.",
    ],
    visual: {
      kind: "flow",
      steps: ["k-means → nlist centroids", "each vector → its nearest centroid's list", "query vs all centroids", "pick nprobe nearest lists", "scan those lists exactly", "top-k"],
      caption: "Two scans: a small one over centroids, a medium one over a few lists.",
    },
    everyday: {
      title: "Postcodes before house numbers",
      text: "A courier does not compare an address with every house in the country. They look at the postcode to pick the district, then search within it. If the house is right on the district boundary, they might check the neighbouring district too. The postcode is the centroid; checking neighbouring districts is nprobe.",
    },
    engineering: {
      title: "Archive search on a memory budget",
      text: "A legal firm wanted similarity search over 80 million clause embeddings on a single server with 64 GB of RAM. HNSW over the raw vectors would need over 300 GB. They used IVF with 65,536 centroids and product-quantised lists: the whole index fits in 20 GB, builds in three hours, and answers in 30 milliseconds at 92% recall@10 with nprobe set to 64. They retrain the centroids quarterly as new clause types arrive, after noticing recall slipping to 88% between retrains.",
    },
    maths: {
      formula: "vectors scanned ≈ nprobe × N ÷ nlist;   centroid comparisons = nlist",
      meaning: "With evenly sized lists, each list holds N ÷ nlist vectors; probing nprobe lists scans that many times nprobe, plus the nlist centroid comparisons.",
      worked: [
        "N = 80,000,000, nlist = 65,536: about 1,221 vectors per list.",
        "nprobe = 64: scans 64 × 1,221 ≈ 78,000 vectors plus 65,536 centroid comparisons ≈ 144,000 distance computations.",
        "Versus a flat scan of 80,000,000: roughly 550 times fewer computations.",
        "Doubling nprobe to 128 doubles the list scan to about 156,000 and typically lifts recall a few points.",
      ],
      note: "A rule of thumb for nlist is around the square root of N up to a few times that; measure rather than trust it.",
    },
    code: {
      title: "IVF with FAISS",
      lang: "py",
      src: `import faiss, numpy as np

d = 1024
nlist = 65536
quantizer = faiss.IndexFlatIP(d)                      # how centroids are compared: inner product on unit vectors
index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)

index.train(training_sample)                          # k-means over a representative sample
index.add(all_vectors)

index.nprobe = 64                                     # lists to probe per query
scores, ids = index.search(query_vecs, k=10)`,
      lines: [
        { code: "index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)", say: "IVF with flat (uncompressed) lists; swap Flat for PQ to compress them." },
        { code: "index.train(training_sample)                          # k-means over a representative sample", say: "The centroids are learned here. If the sample is unrepresentative, lists will be uneven." },
        { code: "index.nprobe = 64                                     # lists to probe per query", say: "The search-width parameter for IVF. Raise it for recall, lower it for speed." },
      ],
    },
    useIt: "Use IVF when memory or build time matters more than the last few points of recall, for very large or disk-resident collections, and as the partitioning layer under product quantisation. Retrain centroids when the data drifts; measure recall per retrain.",
    takeaways: ["IVF clusters vectors around centroids and scans only the nprobe nearest clusters.", "Cheap to build and store; recall loses at cluster edges and under data drift.", "nlist at build, nprobe at search; both tuned by measurement.", "Pairs with compression for huge collections on small memory."],
    terms: [["IVF", "inverted file index: clustering vectors and probing a few clusters per query"], ["centroid", "the centre of a cluster, found by k-means"], ["nprobe", "the number of clusters scanned per query"], ["nlist", "the number of clusters the index is built with"]],
    reflect: { q: "After a year of new data, IVF recall fell from 0.94 to 0.85 with the same nprobe. What happened?", a: "Drift: new vectors do not fit the old centroids well, so lists are uneven and true neighbours scatter across more clusters. Retrain the centroids on current data, or move to a graph index if freshness matters." },
  },

  "m29-product-quantisation": {
    simple: "Product quantisation compresses each vector into a few bytes of codes by splitting it into sub-vectors and replacing each with the nearest entry from a small codebook, so huge collections fit in memory with approximate distances.",
    concept:
      "A 1,024-dimension vector of 32-bit floats is 4 KB. A hundred million of them is 400 GB, more than most machines hold. **Product quantisation** (PQ) shrinks each vector to tens of bytes. It splits the vector into m equal sub-vectors (say 64 pieces of 16 dimensions), and for each piece learns a codebook of 256 representative sub-vectors with k-means. A vector is then stored as m one-byte codes: the index of the nearest codebook entry for each piece. 64 bytes instead of 4,096.\n\nDistances are approximated from the codes: the distance from a query to a stored vector is the sum, over the pieces, of the distance from the query's sub-vector to the codebook entry the code names. Those piecewise distances are precomputed once per query into a lookup table, so comparing the query with millions of codes is additions of table entries, not multiplications.\n\nThe approximation costs recall. Standard practice is to use PQ to find a shortlist cheaply, then rerank the shortlist with exact distances from the full vectors kept on disk or in a slower store.",
    why:
      "Memory is the hard limit for vector search: an index must fit in RAM to be fast. PQ exists so that collections of hundreds of millions of vectors fit on one or a few machines, which turns impossible deployments into affordable ones. The accuracy loss is manageable because PQ is used for the coarse stage, with exact reranking on the few hundred survivors, and because distances only need to be right enough to decide who is in the shortlist.",
    how: [
      "Split the d-dimensional space into m sub-spaces of d ÷ m dimensions each.",
      "Train a codebook of 256 centroids per sub-space with k-means on a sample.",
      "Encode each vector as m bytes: for each sub-vector, the index of its nearest centroid.",
      "At query time, precompute a table of distances from each query sub-vector to all 256 centroids of its sub-space.",
      "Approximate each stored vector's distance by summing m table lookups; shortlist the best; rerank exactly from full vectors.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Representation", "Bytes per vector (d = 1,024)", "100 M vectors", "Distance quality"],
        rows: [
          ["float32", "4,096", "410 GB", "exact"],
          ["float16", "2,048", "205 GB", "near exact"],
          ["int8 scalar quantisation", "1,024", "102 GB", "small loss"],
          ["PQ, m = 64, 256 centroids", "64", "6.4 GB", "approximate; rerank the shortlist"],
          ["PQ, m = 32", "32", "3.2 GB", "coarser"],
        ],
      },
      caption: "Compression ratios of 64× and more are what put huge collections in RAM.",
    },
    everyday: {
      title: "Describing a colour with a paint chart",
      text: "Instead of recording exact red, green and blue values, you say 'Dulux shade 417'. The chart has 256 shades; the number is one byte; the colour is close but not exact. Do that separately for the wall, the trim and the ceiling and you have described the room in three bytes. PQ is a paint chart for each slice of the vector.",
    },
    engineering: {
      title: "Image similarity over 300 million thumbnails",
      text: "A photo platform offers 'find similar images' over 300 million embeddings. Raw vectors would be 600 GB at 512 dimensions in float32. With IVF partitioning and PQ at 32 bytes per vector, the index is 11 GB and runs on a single node with room to spare. A query probes 128 lists, scores about 2 million codes by table lookup in 15 milliseconds, takes the top 500, reranks them with exact vectors fetched from a key-value store, and returns the top 20 at 94% recall against exact search.",
    },
    maths: {
      formula: "bytes per vector = m × log₂(k*) ÷ 8;   approx distance(q, v) ≈ Σⱼ dist(qⱼ, codebookⱼ[code_j(v)])",
      meaning: "m sub-vectors each encoded with one of k* centroids (k* = 256 gives one byte each); the distance is the sum of per-piece distances looked up from a table built once per query.",
      worked: [
        "d = 1,024, m = 64: each sub-vector has 16 dimensions. With 256 centroids per sub-space, a code is 1 byte; 64 bytes per vector. Compression 4,096 ÷ 64 = 64×.",
        "Query table: 64 sub-spaces × 256 centroids = 16,384 distances computed once per query.",
        "Scoring one stored vector: 64 table lookups and additions. Scoring 2 million candidates: 128 million additions, milliseconds.",
        "A flat scan of the same 2 million full vectors: 2 million × 1,024 multiplications, about 16 times more work and 64 times more memory traffic.",
      ],
    },
    code: {
      title: "IVF + PQ with exact reranking",
      lang: "py",
      src: `import faiss, numpy as np

d, nlist, m, nbits = 1024, 32768, 64, 8
quantizer = faiss.IndexFlatIP(d)
index = faiss.IndexIVFPQ(quantizer, d, nlist, m, nbits)     # 64 one-byte codes per vector
index.train(sample)
index.add(all_vectors)
index.nprobe = 128

def search(query, k=20, shortlist=500):
    _, cand_ids = index.search(query[None, :], shortlist)       # cheap, approximate
    cand = cand_ids[0][cand_ids[0] >= 0]
    full = fetch_full_vectors(cand)                             # exact vectors from a slower store
    sims = full @ query
    order = np.argsort(-sims)[:k]
    return cand[order], sims[order]`,
      lines: [
        { code: "index = faiss.IndexIVFPQ(quantizer, d, nlist, m, nbits)     # 64 one-byte codes per vector", say: "IVF for partitioning, PQ for compression: the standard pairing for huge collections." },
        { code: "_, cand_ids = index.search(query[None, :], shortlist)       # cheap, approximate", say: "The compressed index returns a generous shortlist by table-lookup distances." },
        { code: "full = fetch_full_vectors(cand)                             # exact vectors from a slower store", say: "Exact reranking recovers the accuracy the codes gave up, on only a few hundred vectors." },
      ],
    },
    useIt: "Use product quantisation when the raw vectors do not fit in memory: tens of millions of vectors and up. Keep full vectors in a cheaper store for exact reranking of the shortlist. Choose m and the shortlist size by measuring recall after reranking.",
    takeaways: ["PQ encodes each vector as a few bytes of codebook indices; 64× compression is routine.", "Distances come from per-query lookup tables; scoring is additions, not multiplications.", "Accuracy is recovered by exact reranking of a shortlist.", "Pairs with IVF for the largest collections."],
    terms: [["product quantisation (PQ)", "compressing a vector into codebook indices per sub-vector"], ["codebook", "the set of representative sub-vectors learned per sub-space"], ["scalar quantisation", "storing each number in fewer bits, such as int8, with no codebook"], ["shortlist reranking", "re-scoring the top candidates with exact distances"]],
    reflect: { q: "PQ recall is 80% before reranking and 95% after. Where does the extra 15% come from, and what does it cost?", a: "From exact distances on the shortlist: candidates that PQ ranked slightly wrong get reordered correctly. The cost is fetching a few hundred full vectors per query from a slower store, which is small compared with scanning millions." },
  },

  "m29-metadata-filters": {
    simple: "A metadata filter restricts a vector search to rows matching structured conditions such as tenant, language, date or permission, and it must be applied inside the search, not after it.",
    concept:
      "Almost every real query is 'nearest neighbours among the rows that satisfy some condition': this customer's documents, this product category, articles updated this year, chunks the user is allowed to read. A **metadata filter** expresses that condition over the structured fields stored with each vector.\n\nWhere the filter is applied changes everything. Post-filtering runs the vector search first and then drops rows that fail the condition; if the condition is selective, the top k may all be dropped and the result is empty or short. Pre-filtering selects the matching rows first and searches only those; it is exact but can defeat the index when the match set is large. Integrated filtering, which modern stores implement, applies the condition during index traversal, so the search keeps looking until it has k matching neighbours.\n\nFor permissions, filtering is a correctness and security requirement, not a convenience: a chunk the user may not see must never reach the prompt.",
    why:
      "Without filters, multi-tenant systems leak data between tenants, language-mixed corpora return the wrong language, and a search for recent policy returns a chunk from five years ago. And without integrated filtering, a selective condition over a large collection returns almost nothing from a post-filtered top-k, which looks like a broken search. Filters are how a general similarity index becomes a correct, scoped query engine.",
    how: [
      "Store the fields you will filter on with each vector: tenant_id, lang, product, updated_at, acl tags.",
      "Express the filter in the query alongside the vector: equality, ranges, set membership.",
      "Prefer a store that filters during traversal; check its documentation for how selective filters behave.",
      "For permissions, derive the filter from the authenticated session on the server, never from the request body.",
      "Test with a selective filter: a query whose matching rows are 0.1% of the collection must still return k results.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Post-filter", points: ["Search top 10, then drop non-matching rows", "Selective filter → 0–2 results", "Fast but wrong for scoped queries", "Workaround: over-fetch 1,000 and filter; still no guarantee"] },
      right: { title: "Integrated (or pre-) filter", points: ["Condition applied during the search", "Always returns k matching results if they exist", "Correct for tenants, permissions, languages", "Store support required; check selectivity behaviour"] },
      caption: "The left column is the cause of many 'the search returns nothing' bugs.",
    },
    everyday: {
      title: "Finding a nearby restaurant that is open now",
      text: "Listing the ten nearest restaurants and then crossing out the closed ones might leave you with none at 11 pm. Asking for the ten nearest restaurants that are open now gives you ten you can actually visit. The second is an integrated filter; the first is post-filtering.",
    },
    engineering: {
      title: "A multi-tenant knowledge base",
      text: "A SaaS product hosts knowledge bases for 3,000 companies in one vector collection. An early version post-filtered by tenant: searches for small tenants often returned nothing, because the global top-50 belonged to large tenants. Worse, a bug briefly dropped the filter and a tenant saw another tenant's chunk in an answer. The rewrite derives tenant_id from the session, passes it as an integrated filter in every query, and a CI test asserts that a query from tenant A never returns a tenant B id over a thousand random queries.",
    },
    code: {
      title: "Filter inside the query, from the session",
      lang: "sql",
      src: `-- tenant, language and permission come from the server-side session, never from the client
SELECT id, body, embedding <=> $1 AS distance
FROM chunks
WHERE tenant_id = $2
  AND lang = $3
  AND acl && $4::text[]            -- the user's groups overlap the chunk's allowed groups
  AND updated_at > now() - interval '2 years'
ORDER BY embedding <=> $1
LIMIT 10;

-- for selective filters, make sure the planner can use both the btree and the vector index:
CREATE INDEX chunks_tenant_lang ON chunks (tenant_id, lang);`,
      lines: [
        { code: "WHERE tenant_id = $2", say: "The scope. A chunk from another tenant is never a candidate." },
        { code: "AND acl && $4::text[]            -- the user's groups overlap the chunk's allowed groups", say: "Permissions as data on the chunk, matched against the session's groups." },
        { code: "ORDER BY embedding <=> $1", say: "The similarity ordering applies to the filtered set." },
        { code: "CREATE INDEX chunks_tenant_lang ON chunks (tenant_id, lang);", say: "A conventional index so selective filters are cheap to apply." },
      ],
      note: "Different vector stores apply filters differently; benchmark a selective filter to see whether results stay complete.",
    },
    useIt: "Store the filter fields with every vector, apply tenant and permission filters from the session on every query, use integrated filtering, and test that selective filters still return full results. This is the retrieval half of access control for RAG and the reason multi-tenant vector search is safe.",
    takeaways: ["Filters restrict similarity search to rows matching structured conditions.", "Post-filtering returns too few results for selective conditions; use integrated or pre-filtering.", "Tenant and permission filters come from the session and are applied in the query.", "Test selectivity and cross-tenant isolation in CI."],
    terms: [["metadata filter", "a structured condition applied to a vector search"], ["post-filtering", "filtering after the nearest neighbours are found"], ["integrated filtering", "applying the condition during index traversal"], ["multi-tenant", "one system serving many customers whose data must stay separate"]],
    reflect: { q: "A query with a tenant filter returns 10 results in 8 ms for a large tenant and 3 results in 400 ms for a tiny one. What is happening?", a: "The store is likely over-fetching and post-filtering: for the tiny tenant it fetches thousands of candidates and still finds too few. Switch to a store or mode with integrated filtering, or pre-filter by tenant with a conventional index and scan that subset." },
  },

  "m29-dense-vs-sparse-retrieval": {
    simple: "Dense retrieval matches meaning using embedding vectors; sparse retrieval matches words using term weights. Dense finds paraphrases; sparse finds exact terms, codes and names.",
    concept:
      "Two families of retrieval represent text differently. **Dense retrieval** uses embeddings: a few hundred to a few thousand numbers, almost all non-zero, capturing meaning so that 'laptop will not turn on' and 'notebook dead, no power' sit close together. **Sparse retrieval** uses a vocabulary-sized vector where most entries are zero and the non-zero ones are weights for the terms that appear, as in BM25 or TF-IDF; 'SKU 44-A' matches documents containing exactly that token.\n\nEach fails where the other succeeds. Dense retrieval blurs exact identifiers, rare names and numbers, because the embedding model treats near-identical strings as near-identical meanings. Sparse retrieval cannot see that two sentences with no words in common mean the same thing. Learned sparse models (such as SPLADE) sit between: they expand each document into weighted terms, including synonyms, while keeping exact-term matching.\n\nMost production systems run both and combine them, which is the next lesson.",
    why:
      "Users ask in both modes. 'How do I get a refund if the box arrived damaged?' is a meaning query; 'error 0x80070057' and 'invoice INV-2024-0931' are exact-term queries. A system with only dense retrieval mishandles the second kind, returning plausible but wrong documents; one with only sparse retrieval mishandles the first, finding nothing when the words differ. Knowing the two families, and what each represents, is what lets you choose and combine them deliberately.",
    how: [
      "Dense: embed each chunk with a model; search by cosine similarity in a vector index.",
      "Sparse: tokenise each chunk; weight terms by frequency and rarity (BM25); search with an inverted index.",
      "Compare on your own query log: group queries into meaning-style and term-style, measure recall for each family on each group.",
      "Note where each fails: dense on identifiers and rare names, sparse on paraphrase and synonyms.",
      "Decide: one family if your queries are overwhelmingly one kind; otherwise combine them.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Query", "Dense retrieval", "Sparse (BM25)", "Why"],
        rows: [
          ["'my laptop won't switch on'", "finds 'notebook has no power'", "misses it (no shared words)", "meaning vs words"],
          ["'error 0x80070057'", "returns other error articles", "finds the exact article", "identifiers embed alike"],
          ["'Dr Okonkwo's notes on sepsis'", "finds sepsis notes by anyone", "finds Okonkwo's", "rare names are terms"],
          ["'cheap flights to Lisbon in spring'", "finds budget travel content", "needs the exact words", "paraphrase"],
        ],
      },
      caption: "Neither column is right in every row.",
    },
    everyday: {
      title: "A librarian and a card catalogue",
      text: "Ask the librarian for 'something like that book about the boy wizard' and they understand. Ask the card catalogue and it needs the exact title. But ask the librarian for ISBN 978-0-7475-3269-9 and they reach for the catalogue. Dense retrieval is the librarian; sparse retrieval is the catalogue; a good library has both.",
    },
    engineering: {
      title: "Support search that forgot product codes",
      text: "A hardware company replaced its keyword support search with pure dense retrieval. Satisfaction rose for descriptive questions and collapsed for anything with a part number: 'firmware for RX-440' returned articles about RX-420 and RX-460, which embed almost identically. Analysis of the query log showed 31% of queries contained a code. They reinstated BM25 alongside the embeddings and fused the results; code queries recovered, descriptive queries kept their gains.",
    },
    maths: {
      formula: "BM25(q, d) = Σ_{t ∈ q} IDF(t) × tf(t, d) × (k₁ + 1) ÷ (tf(t, d) + k₁ × (1 − b + b × |d| ÷ avgdl))",
      meaning: "For each query term t: how rare it is across documents (IDF) times how often it appears in this document (tf), with saturation (k₁) and length normalisation (b) so long documents do not win by repetition.",
      worked: [
        "Query 'firmware RX-440'. Suppose 'firmware' appears in 2,000 of 10,000 documents (common; low IDF ≈ 1.4) and 'RX-440' in 3 (rare; high IDF ≈ 7.8).",
        "Document A mentions RX-440 twice and firmware once; document B mentions firmware five times and no RX-440.",
        "A's score is dominated by the rare term: roughly 7.8 × saturated(2) + 1.4 × saturated(1) ≈ 7.8 × 1.4 + 1.4 × 1 ≈ 12.3.",
        "B's score: 1.4 × saturated(5) ≈ 1.4 × 1.8 ≈ 2.5. The exact code wins by a wide margin, which is what dense retrieval could not do.",
      ],
      note: "k₁ ≈ 1.2 and b ≈ 0.75 are standard defaults; the saturation function (k₁+1)·tf ÷ (tf + k₁·…) is what keeps repeated terms from growing without bound.",
    },
    code: {
      title: "Both families over the same chunks",
      lang: "py",
      src: `from rank_bm25 import BM25Okapi
import numpy as np

tokens = [tokenise(c.body) for c in chunks]
bm25 = BM25Okapi(tokens)                                   # sparse: term weights

def sparse_search(query, k=20):
    scores = bm25.get_scores(tokenise(query))
    top = np.argsort(-scores)[:k]
    return [(chunks[i].id, float(scores[i])) for i in top]

def dense_search(query, k=20):
    q = embed(query)
    sims = chunk_vectors @ q                                # dense: cosine on unit vectors
    top = np.argsort(-sims)[:k]
    return [(chunks[i].id, float(sims[i])) for i in top]

print(sparse_search("firmware RX-440")[:3])
print(dense_search("laptop won't switch on")[:3])`,
      lines: [
        { code: "bm25 = BM25Okapi(tokens)                                   # sparse: term weights", say: "The sparse index: an inverted index of weighted terms." },
        { code: "sims = chunk_vectors @ q                                # dense: cosine on unit vectors", say: "The dense search: similarity of meaning vectors." },
        { code: "print(sparse_search(\"firmware RX-440\")[:3])", say: "An identifier query goes to the sparse side, where exact tokens win." },
      ],
    },
    useIt: "Run dense retrieval for meaning and sparse retrieval for exact terms; check your query log to see how much of each you have. Almost every product search, support search and RAG system benefits from both, fused as the next lesson shows.",
    takeaways: ["Dense: embeddings, meaning, paraphrase. Sparse: term weights, exact words, identifiers.", "Each fails where the other succeeds; identifiers and rare names break dense, paraphrase breaks sparse.", "BM25 is the standard sparse method; learned sparse models add synonyms.", "Measure both on your query log before choosing."],
    terms: [["dense retrieval", "search by embedding similarity"], ["sparse retrieval", "search by weighted term matching"], ["BM25", "the standard term-weighting formula for sparse retrieval"], ["inverted index", "a map from each term to the documents containing it"]],
    reflect: { q: "Why do 'RX-440' and 'RX-460' get nearly identical embeddings?", a: "Embedding models learn meaning from context, and the two codes appear in the same kinds of sentences; the single different character carries almost no semantic signal. Exact-term matching treats them as different tokens, which is what you need." },
  },

  "m29-hybrid-retrieval": {
    simple: "Hybrid retrieval runs dense and sparse search together and merges their ranked lists, usually with reciprocal rank fusion, so meaning queries and exact-term queries both work.",
    concept:
      "**Hybrid retrieval** combines the two families from the last lesson. Both searches run on the same query; each returns a ranked list; the lists are merged into one. The merge cannot simply add scores, because BM25 scores and cosine similarities live on different scales. The usual method is **reciprocal rank fusion** (RRF): each document gets a score of 1 ÷ (k + rank) from every list it appears in, with k around 60, and the sums are sorted. A document near the top of either list scores well; one near the top of both scores best.\n\nHybrid retrieval is robust in a way neither family is alone: when the query is an identifier, the sparse list carries it; when it is a paraphrase, the dense list does. Weighting the two lists lets you tilt toward one side for a known query mix. A reranker over the fused shortlist then puts the final order right.",
    why:
      "Query logs are always mixed: descriptive questions, product codes, names, half-remembered titles. A single retrieval method is tuned for one kind and degrades on the others, and users do not announce which kind they are asking. Hybrid retrieval makes the system good at both for the price of a second index and a merge step, and RRF makes the merge free of score calibration, which is why it has become the default in search products and RAG pipelines.",
    how: [
      "Run the sparse search and the dense search for the same query, each returning the top N (say 50).",
      "For each list, assign every document a score of 1 ÷ (k + rank), rank starting at 1.",
      "Sum scores across lists per document; optionally multiply one list's scores by a weight.",
      "Sort by fused score and take the top k.",
      "Rerank the fused top k with a cross-encoder if quality at the top matters.",
    ],
    visual: {
      kind: "flow",
      steps: ["query", "sparse top-50 + dense top-50 (in parallel)", "1 ÷ (60 + rank) per list", "sum per document", "sort → fused top-k", "rerank"],
      caption: "Two lists in, one list out, no score calibration needed.",
    },
    everyday: {
      title: "Two friends recommending restaurants",
      text: "One friend knows every chef by name; the other knows which places feel right for the evening you describe. Ask both, and give a restaurant points for how high each friend ranks it. A place both mention near the top is the safe bet; a place only one mentions, but first, is still worth considering. That scoring is reciprocal rank fusion.",
    },
    engineering: {
      title: "Help-centre search measured three ways",
      text: "A SaaS company ran its 2,000-query test set through BM25 alone (recall@5 0.71), dense alone (0.82) and hybrid with RRF (0.91). Looking at the queries only hybrid got right: product codes rescued by sparse, paraphrased questions rescued by dense. They weighted the dense list 1.2× after noticing their queries skewed descriptive, which lifted recall to 0.92. A cross-encoder reranker over the fused top 20 lifted precision at rank 1 from 0.74 to 0.86.",
    },
    maths: {
      formula: "RRF(d) = Σ_lists 1 ÷ (k + rank_list(d)),   k = 60",
      meaning: "Each list contributes a score that decays with rank; k damps the advantage of the top rank so a document at rank 1 in one list does not automatically beat one at rank 2 in both.",
      worked: [
        "Document A: rank 1 in sparse, absent from dense: 1 ÷ 61 = 0.0164.",
        "Document B: rank 2 in sparse, rank 3 in dense: 1 ÷ 62 + 1 ÷ 63 = 0.0161 + 0.0159 = 0.0320.",
        "Document C: rank 1 in dense, absent from sparse: 1 ÷ 61 = 0.0164.",
        "Fused order: B (0.0320), then A and C tied (0.0164). Appearing in both lists beats a single top rank.",
        "With the dense list weighted 1.2: C becomes 0.0197 and B becomes 0.0161 + 0.0191 = 0.0352; B still first, C now ahead of A.",
      ],
    },
    code: {
      title: "Reciprocal rank fusion",
      lang: "ts",
      src: `type Ranked = { id: string; rank: number }[];

export function rrf(lists: { items: Ranked; weight?: number }[], k = 60, top = 10): { id: string; score: number }[] {
  const score = new Map<string, number>();
  for (const { items, weight = 1 } of lists) {
    for (const { id, rank } of items) {
      score.set(id, (score.get(id) ?? 0) + weight / (k + rank));
    }
  }
  return [...score.entries()]
    .map(([id, s]) => ({ id, score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

const [sparse, dense] = await Promise.all([sparseSearch(query, 50), denseSearch(query, 50)]);
const fused = rrf([{ items: sparse }, { items: dense, weight: 1.2 }]);
const final = await rerank(query, fused.map((f) => f.id).slice(0, 20));`,
      lines: [
        { code: "score.set(id, (score.get(id) ?? 0) + weight / (k + rank));", say: "The whole of RRF: add 1 ÷ (k + rank), optionally weighted, for every list the document appears in." },
        { code: "const [sparse, dense] = await Promise.all([sparseSearch(query, 50), denseSearch(query, 50)]);", say: "Both searches run in parallel; the merge waits for both." },
        { code: "const fused = rrf([{ items: sparse }, { items: dense, weight: 1.2 }]);", say: "A mild tilt toward the dense list, chosen by measurement on the query log." },
        { code: "const final = await rerank(query, fused.map((f) => f.id).slice(0, 20));", say: "A reranker puts the top of the fused list in the right order." },
      ],
    },
    useIt: "Use hybrid retrieval as the default for search and RAG over mixed queries: run both searches, fuse with RRF, weight by your query mix, rerank the top. Measure recall per query type to justify the weights.",
    takeaways: ["Hybrid = dense + sparse, run together and merged.", "Reciprocal rank fusion merges ranked lists without calibrating scores.", "Appearing in both lists beats a single top rank; weights tilt toward one side.", "Rerank the fused shortlist for the final order."],
    terms: [["hybrid retrieval", "combining dense and sparse search results"], ["reciprocal rank fusion (RRF)", "merging ranked lists by summing 1 ÷ (k + rank)"], ["cross-encoder reranker", "a model that scores query–document pairs jointly to reorder a shortlist"]],
    reflect: { q: "Why not normalise BM25 and cosine scores to 0–1 and add them?", a: "Because their distributions differ per query: a BM25 score of 12 may be excellent for one query and mediocre for another, and cosine similarities cluster differently again. Rank-based fusion sidesteps calibration entirely, which is why it works out of the box." },
  },

  "m29-vector-database-scaling": {
    simple: "Scaling vector search means fitting the index in memory, sharding it across machines when it does not fit, replicating for throughput, and keeping inserts, deletes and rebuilds from hurting queries.",
    concept:
      "A vector index is fast because it lives in RAM. **Vector database scaling** is the set of techniques for keeping it that way as the collection and the traffic grow. Vertically: compress vectors (quantisation) so more fit per machine; choose index parameters that balance memory and recall. Horizontally: shard the collection across nodes, each holding an index over its slice, with a router that fans the query out and merges the top-k from every shard; replicate each shard so queries can be spread across copies and a node failure loses nothing.\n\nWrites need care. HNSW inserts are incremental but deletes are tombstones that degrade the graph; IVF needs retraining as data drifts. Production stores handle this with segments: new data goes into small fresh segments that are merged into larger ones in the background, and queries search all segments. Rebuilds happen segment by segment without downtime.\n\nMulti-tenancy adds a choice: one big collection with tenant filters, or a collection per tenant. Filters scale better for many small tenants; separate collections isolate large ones.",
    why:
      "Vector search is the first thing to fall over when a product succeeds: the index that fit in one machine's memory no longer does, query latency rises under load, and a nightly re-index takes the search offline. The techniques here exist so that growth is a configuration change, not a rewrite: more shards, more replicas, better compression, and a write path that never blocks reads.",
    how: [
      "Estimate memory: vectors × (bytes per vector after compression + index overhead) + metadata; keep headroom.",
      "If it fits on one node, scale reads with replicas behind a load balancer.",
      "If not, shard by a key (random, or by tenant for isolation); route queries to all shards and merge top-k.",
      "Write path: append to fresh segments; merge and rebuild in the background; tombstone deletes and compact.",
      "Monitor recall, p99 latency, memory per node and segment counts; alert before memory runs out.",
    ],
    visual: {
      kind: "flow",
      steps: ["query", "router", "shard 1 (index + replicas)", "shard 2", "shard 3", "merge top-k across shards", "rerank"],
      caption: "Each shard answers over its slice; the router merges. Replicas serve reads and survive failures.",
    },
    everyday: {
      title: "A library that outgrew one building",
      text: "When one building fills up, the library opens branches, each holding part of the collection, with a central desk that forwards a request to every branch and combines the answers. Popular branches get a second copy of their shelves. New books go on a trolley first and are shelved overnight so readers are never blocked. Shards, replicas and segments.",
    },
    engineering: {
      title: "Growing from 2 million to 200 million vectors",
      text: "A content platform's semantic search began as pgvector on one Postgres replica. At 20 million vectors the HNSW index no longer fit in the instance's memory and p99 latency passed 500 milliseconds. They moved to a dedicated store with 16 shards of about 12 million vectors each, scalar quantisation to halve memory, and two replicas per shard. Writes land in small segments merged hourly. At 200 million vectors the p99 is 45 milliseconds, recall@10 is 0.97, and adding capacity is adding shards.",
    },
    maths: {
      formula: "memory ≈ N × (v + o) + M_meta;   shards = ⌈memory ÷ (node RAM × 0.7)⌉",
      meaning: "N vectors at v bytes each (after compression) plus o bytes of index overhead per vector, plus metadata; divide by usable RAM per node to get the shard count.",
      worked: [
        "N = 200,000,000; int8 vectors of 1,024 dims: v = 1,024 bytes; HNSW overhead o ≈ 300 bytes; metadata ≈ 100 bytes per row.",
        "Memory ≈ 200 M × 1,424 bytes ≈ 285 GB.",
        "Nodes with 64 GB, 70% usable ≈ 45 GB each: 285 ÷ 45 ≈ 6.3, so 7 shards minimum; the team chose 16 for headroom and growth.",
        "Two replicas per shard: 32 nodes serving, each holding about 18 GB.",
      ],
    },
    code: {
      title: "Fan-out and merge across shards",
      lang: "ts",
      src: `async function searchAllShards(queryVec: number[], k: number, filter: Filter): Promise<Hit[]> {
  const perShard = await Promise.all(
    shards.map((s) => s.pickReplica().search(queryVec, { k, filter, timeoutMs: 80 }).catch(() => [] as Hit[])),
  );
  return perShard
    .flat()
    .sort((a, b) => a.distance - b.distance)       // cosine distance: smaller is closer
    .slice(0, k);
}

// write path: new vectors go to a small fresh segment; background job merges segments
await shards[route(doc.tenantId)].appendToFreshSegment(doc.id, doc.vector, doc.metadata);`,
      lines: [
        { code: "shards.map((s) => s.pickReplica().search(queryVec, { k, filter, timeoutMs: 80 }).catch(() => [] as Hit[])),", say: "Every shard searches its slice in parallel on one of its replicas; a slow or failed shard returns nothing rather than blocking the query." },
        { code: ".sort((a, b) => a.distance - b.distance)       // cosine distance: smaller is closer", say: "The merge: distances from different shards are comparable because the same model and metric are used everywhere." },
        { code: "await shards[route(doc.tenantId)].appendToFreshSegment(doc.id, doc.vector, doc.metadata);", say: "Writes never touch the large indexes directly; a background merge folds segments in." },
      ],
    },
    useIt: "Plan memory from the start, compress before sharding, shard when one node cannot hold the index, replicate for throughput and resilience, and use segmented writes so re-indexing never blocks search. Monitor recall and p99 latency as first-class metrics.",
    takeaways: ["The index must fit in RAM; compression first, then shards.", "Replicas scale reads and survive failures; a router fans out and merges top-k.", "Segmented writes with background merges keep reads unaffected by inserts and rebuilds.", "Monitor recall, p99 latency and memory per node."],
    terms: [["shard", "one slice of the collection with its own index"], ["replica", "a copy of a shard serving reads"], ["segment", "a small, separately indexed batch of recent writes, merged in the background"], ["p99 latency", "the time under which 99% of queries complete"]],
    reflect: { q: "Deletes are tombstones and search is slowly getting slower. What is the maintenance task?", a: "Compaction: rebuild segments to drop tombstoned vectors and repair the graph. Schedule it in the background, segment by segment, and watch the tombstone ratio as a metric." },
  },

  "m29-choosing-a-vector-database": {
    simple: "Choose a vector database by your scale, your filtering and multi-tenancy needs, your write pattern, what you already operate, and measured recall and latency on your own data, not by benchmarks on someone else's.",
    concept:
      "The options fall into three groups. Extensions to databases you already run (pgvector for Postgres, vector types in other relational and document stores): one system, one backup, filters and joins for free, excellent up to millions of vectors. Dedicated vector databases, managed or self-hosted: built for scale, with sharding, replication, integrated filtering and tuning exposed. Libraries embedded in your process (FAISS, hnswlib): the fastest and cheapest for a single service that owns its data, with no server to run and no built-in persistence or filtering.\n\n**Choosing a vector database** is weighing your actual requirements against those groups. How many vectors now and in two years. Whether queries need filters and tenant isolation. How often data changes. Who will operate it. What latency and recall you need under your real traffic. Then benchmark the two or three plausible candidates with your own vectors and queries, because index behaviour depends on the data.",
    why:
      "Teams lose months to the wrong choice in both directions: adopting a distributed vector service for two hundred thousand vectors that Postgres would have handled, or stretching a single-node extension to a hundred million vectors it was never meant for. The store is also where filtering, permissions and freshness live, so the choice affects correctness, not just speed. A short requirements list and a benchmark on your own data prevent both mistakes.",
    how: [
      "Write down: vector count now and projected, dimensions, query rate, latency and recall targets, filter and tenant needs, write rate, operational constraints.",
      "Eliminate groups that cannot meet a hard requirement (scale, filtering, operations).",
      "Shortlist two or three candidates; load a representative sample of your vectors and metadata.",
      "Benchmark recall@k against exact search, p50 and p99 latency under concurrent load, and selective-filter behaviour, on your own query log.",
      "Choose the simplest option that meets the targets with headroom; plan the migration trigger for when it will not.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Situation", "Reasonable choice", "Why"],
        rows: [
          ["< 5 M vectors, Postgres already in use, filters needed", "pgvector", "one system, SQL filters and joins, no new operations"],
          ["a single service, read-mostly, data fits in its memory", "FAISS or hnswlib in-process", "fastest, cheapest, no server; add persistence yourself"],
          ["10 M–1 B vectors, multi-tenant, live writes, a team to run it", "a dedicated vector database", "sharding, replication, integrated filters, tuning"],
          ["no operations team, variable load", "a managed vector service", "someone else scales and patches it; pay per use"],
          ["strict data residency or air-gapped", "self-hosted extension or dedicated store", "data never leaves your infrastructure"],
        ],
      },
      caption: "The first row covers more real projects than the rest combined.",
    },
    everyday: {
      title: "Choosing a vehicle",
      text: "A city commuter does not need a lorry, and a haulier cannot use a bicycle. The right choice depends on the load, the distance, the roads and who maintains it. Picking a vector database by reading benchmarks of other people's loads is buying a lorry because it has the highest payload figure.",
    },
    engineering: {
      title: "Three teams, three right answers",
      text: "In one company, the policy assistant (9,000 chunks, strict permissions) uses pgvector in the existing Postgres: filters by department are SQL, backups already exist, and recall is 1.0 with a flat scan. The product-search team (40 million listings, thousands of writes a minute, four regions) runs a dedicated self-hosted store with 12 shards. The recommendation service (a nightly batch over 3 million item vectors, read-only during the day) uses hnswlib in-process and rebuilds the index each night in four minutes. Each team benchmarked two options on its own data before deciding.",
    },
    code: {
      title: "A benchmark harness to run on your own data",
      lang: "py",
      src: `import time, numpy as np

def benchmark(store, queries, exact_truth, k=10, concurrency=16):
    latencies, hits = [], 0
    for q, truth in zip(queries, exact_truth):
        t0 = time.perf_counter()
        ids = store.search(q, k=k, filter={"tenant_id": q.tenant})
        latencies.append((time.perf_counter() - t0) * 1000)
        hits += len(set(ids) & truth) / k
    lat = np.array(latencies)
    return {
        "recall@10": round(hits / len(queries), 3),
        "p50_ms": round(float(np.percentile(lat, 50)), 1),
        "p99_ms": round(float(np.percentile(lat, 99)), 1),
    }

for name, store in candidates.items():
    print(name, benchmark(store, sample_queries, exact_topk_sets))`,
      lines: [
        { code: "ids = store.search(q, k=k, filter={\"tenant_id\": q.tenant})", say: "Benchmark with the filters you will actually use; filter behaviour differs most between stores." },
        { code: "hits += len(set(ids) & truth) / k", say: "Recall against exact search computed on the same sample." },
        { code: "\"p99_ms\": round(float(np.percentile(lat, 99)), 1),", say: "The tail latency is what users notice; report it, not just the average." },
      ],
      note: "Run it under concurrent load too; a store that is fast for one query at a time may not be at a hundred.",
    },
    useIt: "Before adopting any vector store, write the requirements, shortlist by hard constraints, and benchmark on your own vectors and queries with your real filters. Prefer the simplest option that meets the targets, and know the number at which you will migrate.",
    takeaways: ["Three groups: database extensions, dedicated stores, in-process libraries.", "Choose by scale, filtering and tenancy, write pattern, operations and measured recall/latency.", "Benchmark on your own data with your own filters under load.", "Simplest option with headroom; plan the migration trigger."],
    terms: [["dedicated vector database", "a server built for vector search at scale"], ["in-process library", "a vector index used inside your own application process"], ["managed service", "a vector store operated by a provider"], ["data residency", "a requirement that data stay in a given region or on given infrastructure"]],
    reflect: { q: "A benchmark page shows store X at 2× the queries per second of store Y. Is X the better choice for you?", a: "Not necessarily: the benchmark used different vectors, dimensions, filters and hardware. Throughput you do not need is worth nothing, and the filter behaviour on your tenants may differ entirely. Only your own benchmark answers the question." },
  },
};

export const M29_QUIZ: Quiz[] = [
  {
    q: "What does a vector database do that an ordinary database with an array column cannot do efficiently?",
    options: ["Store vectors", "Find the k vectors closest to a query vector over millions of rows", "Create embeddings", "Decide what text means"],
    answer: 1,
    why: ["Any database can store arrays.", "Correct. Nearest-neighbour search with an index is the special operation.", "Embeddings come from a model, not the database.", "Meaning is decided by the embedding model."],
    reason: true,
  },
  {
    q: "An index returns 9 of the exact top-10 neighbours on average. What is its recall@10?",
    options: ["0.1", "0.9", "9", "1.0"],
    answer: 1,
    why: ["That is the miss rate.", "Correct: 9 ÷ 10 = 0.9.", "Recall is a share, not a count.", "Only a flat scan is 1.0."],
  },
  {
    q: "Which index supports inserting vectors one at a time without a rebuild and keeps high recall?",
    options: ["Flat scan", "HNSW", "IVF", "Product quantisation alone"],
    answer: 1,
    why: ["A flat scan has no index to insert into; it is exact but slow.", "Correct. New vectors are linked into the graph as they arrive.", "IVF needs retraining as data drifts.", "PQ is compression, not a search structure."],
  },
  {
    q: "What does raising nprobe in an IVF index do?",
    options: ["Reduces memory", "Scans more clusters: higher recall, slower queries", "Retrains the centroids", "Compresses vectors"],
    answer: 1,
    why: ["Memory is set by the data and the index, not nprobe.", "Correct. nprobe is IVF's search-width parameter.", "Retraining is a separate build step.", "That is PQ."],
  },
  {
    q: "Why is product quantisation usually followed by exact reranking of a shortlist?",
    options: ["PQ cannot return ids", "PQ distances are approximate; reranking the top candidates with full vectors recovers accuracy cheaply", "Reranking is required by the API", "It is not needed"],
    answer: 1,
    why: ["It returns ids.", "Correct. Coarse stage on codes, fine stage on a few hundred full vectors.", "No API requires it.", "Without it recall is noticeably lower."],
    reason: true,
  },
  {
    q: "A search with a selective tenant filter returns only two results though the tenant has thousands of chunks. What is the likely cause?",
    options: ["The tenant has no data", "Post-filtering: the global top-k was found first and most rows failed the filter", "The embedding model is wrong", "k is too high"],
    answer: 1,
    why: ["Thousands of chunks exist.", "Correct. Filters must be applied during the search, not after.", "The model would not reduce the count.", "k being high would return more, not fewer."],
  },
  {
    q: "A query is 'firmware for RX-440'. Which retrieval family finds the right article, and why?",
    options: ["Dense, because it understands meaning", "Sparse, because the exact token RX-440 is rare and decisive", "Neither", "Both equally"],
    answer: 1,
    why: ["Dense retrieval embeds RX-440 and RX-460 almost identically.", "Correct. BM25 weights the rare exact term heavily.", "Sparse handles it well.", "Dense is likely to return neighbouring models."],
  },
  {
    q: "In reciprocal rank fusion with k = 60, document B is rank 2 in both lists and document A is rank 1 in one list only. Which scores higher?",
    options: ["A", "B", "They tie", "Cannot be determined"],
    answer: 1,
    why: ["A gets 1 ÷ 61 ≈ 0.0164.", "Correct. B gets 2 × (1 ÷ 62) ≈ 0.0323, roughly double.", "Not a tie.", "The formula decides it."],
  },
  {
    q: "The index no longer fits in one node's memory. What is the usual order of remedies?",
    options: ["Shard immediately", "Compress vectors first, then shard across nodes, with replicas for reads", "Switch to a flat scan", "Delete metadata"],
    answer: 1,
    why: ["Sharding is the second step; compression often avoids it.", "Correct. Quantisation shrinks the index; shards and replicas scale beyond one node.", "A flat scan at that scale is far too slow.", "Metadata is small and needed for filters."],
  },
];

export const M29_EXERCISES: Exercise[] = [
  {
    title: "Size an index",
    kind: "calculate",
    task: "You will store 30 million chunk embeddings of 768 dimensions. Compute the memory for float32 vectors, for int8 scalar quantisation, and for PQ with m = 48 one-byte codes. Add 250 bytes per vector of HNSW overhead and 80 bytes of metadata in each case. How many 32 GB nodes (70% usable) does each option need?",
    hints: ["bytes per vector = vector bytes + 250 + 80", "float32 = 4 bytes per dimension"],
    solution: "float32: 768 × 4 = 3,072 + 330 = 3,402 bytes → 30 M × 3,402 ≈ 102 GB → 102 ÷ 22.4 ≈ 4.6 → 5 nodes. int8: 768 + 330 = 1,098 bytes → 33 GB → 2 nodes. PQ: 48 + 330 = 378 bytes → 11.3 GB → 1 node (with full vectors kept on disk for reranking).",
  },
  {
    title: "Compute recall and a fusion score",
    kind: "calculate",
    task: "For one query, exact top-5 ids are {3, 17, 22, 40, 51}; the HNSW index returns {3, 17, 22, 60, 51}. Compute recall@5. Then fuse two lists with RRF (k = 60): sparse ranks [A, B, C], dense ranks [C, D, A]. Give the fused order with scores.",
    hints: ["recall = overlap ÷ 5", "score = Σ 1 ÷ (60 + rank)"],
    solution: "Recall@5 = 4 ÷ 5 = 0.8. RRF: A = 1/61 + 1/63 = 0.01639 + 0.01587 = 0.03226; C = 1/63 + 1/61 = 0.03226; B = 1/62 = 0.01613; D = 1/62 = 0.01613. Fused: A and C tie at 0.0323 (both appear in both lists), then B and D tie at 0.0161. Ties are broken by a secondary rule, such as the better single rank or the dense score.",
  },
  {
    title: "Choose a store for three products",
    kind: "think",
    task: "Recommend a vector store and index for each: (a) an internal HR policy assistant, 12,000 chunks, department-level permissions, Postgres already in use; (b) a marketplace with 80 million product vectors, 2,000 updates a minute, three regions; (c) a nightly deduplication job over 5 million support tickets, read-only during the day. Justify each in two sentences.",
    hints: ["Scale, filters, writes, operations.", "The simplest option that meets the targets."],
    solution: "(a) pgvector in the existing Postgres, flat scan or a small HNSW: permissions are a WHERE clause on department, backups and operations already exist, and 12,000 vectors are trivially fast. (b) A dedicated sharded vector store with integrated filtering and replicas per region, HNSW with scalar quantisation: the write rate and scale rule out single-node options, and regional replicas keep latency low. (c) An in-process library (hnswlib or FAISS) with a nightly build: the job owns the data, needs no server, and rebuilding 5 million vectors each night takes minutes.",
  },
  {
    title: "Design the filter and its test",
    kind: "build",
    task: "Write the query and the CI test for a multi-tenant RAG retrieval: the query must apply tenant and permission filters from the session; the test must prove isolation across 1,000 random queries. Describe both.",
    hints: ["Where do tenant_id and user groups come from?", "What does the test assert for every returned id?"],
    solution: "Query: SELECT id, body FROM chunks WHERE tenant_id = $session.tenant AND acl && $session.groups ORDER BY embedding <=> $q LIMIT 10, with a btree index on (tenant_id) and integrated filtering in the store. Test: seed two tenants with distinct chunk ids; for 1,000 random query vectors, run the retrieval as a user of tenant A and assert every returned id belongs to tenant A and every chunk's acl overlaps the user's groups; repeat with a selective user (one small group) and assert at least k results are returned when k matching chunks exist. Fail the build on any violation.",
  },
];
