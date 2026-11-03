// Shape of a data-driven course. Topics are plain data; components/TopicView.tsx renders them.
// Text fields support two inline marks: `code` and **bold**. A blank line splits paragraphs.

/** Every diagram id maps to an SVG or interactive component in components/Diagrams.tsx. */
export type DiagramId =
  | "whyDb" // spreadsheet/file vs database: what breaks and what a DB promises
  | "clientServer" // app -> driver -> server -> storage engine -> disk
  | "tableAnatomy" // rows, columns, primary key, foreign key, NULL
  | "relationships" // 1:1, 1:N, M:N with a join table
  | "erd" // the shop schema used by the playground
  | "joins" // interactive: pick a join type, see matched rows
  | "groupBy" // rows -> buckets -> one row per bucket
  | "windowFrame" // window function sliding over ordered rows
  | "normalization" // one messy table -> 3 clean tables
  | "btree" // interactive B-tree lookup
  | "scanVsIndex" // full scan vs index seek, pages touched
  | "compositeIndex" // leftmost-prefix rule as a phone book
  | "queryPipeline" // parse -> plan -> execute, with the optimiser choosing
  | "acid" // the four promises on a money transfer
  | "isolation" // interactive: two transactions, pick level, see anomaly
  | "locks" // shared vs exclusive, deadlock cycle
  | "mvcc" // row versions and snapshots
  | "pages" // heap pages, tuples, buffer pool
  | "wal" // write-ahead log before data files
  | "replication" // primary -> replicas, lag, failover
  | "sharding" // hash vs range shards, hot shard
  | "partitioning" // one logical table, many physical partitions
  | "cap" // the triangle and what a partition forces
  | "cacheAside" // read path with cache miss and hit
  | "pool" // connection pool queue
  | "nplus1" // one query per row vs one join
  | "keyset" // offset vs keyset pagination
  | "sqlVsNosql" // rows vs documents vs key-value
  | "outbox" // transactional outbox pattern
  | "saga" // 2PC vs saga with compensation
  // --- second batch: one picture per idea that used to be text ---
  | "queryOrder" // FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT funnel
  | "nullLogic" // three-valued logic and NOT IN
  | "fanOut" // 1 order × 2 items × 2 payments = 4 rows
  | "onVsWhere" // LEFT JOIN filter in ON keeps rows, in WHERE drops them
  | "antiJoin" // A minus B
  | "selfJoin" // one table, two aliases
  | "joinAlgorithms" // nested loop, hash, merge
  | "recursion" // anchor + repeat until empty
  | "rankTypes" // ROW_NUMBER / RANK / DENSE_RANK on ties
  | "topN" // partitions, rn, keep <= N
  | "upsert" // INSERT → conflict? → update / ignore
  | "normalForms" // 1NF → 2NF → 3NF steps
  | "expandContract" // three releases
  | "stateMachine" // order status transitions
  | "treeModels" // adjacency / path / closure
  | "planTree" // annotated EXPLAIN tree
  | "sargable" // function hides the column from the index
  | "injection" // string concat vs parameters
  | "levelsLadder" // isolation levels removing anomalies
  | "writeSkew" // two doctors
  | "optimisticVsPessimistic" // version check vs FOR UPDATE
  | "jobQueue" // SKIP LOCKED workers
  | "heapVsClustered" // Postgres heap vs InnoDB clustered
  | "bloat" // dead tuples filling pages
  | "syncAsync" // commit timeline
  | "pitr" // backup + WAL timeline
  | "scaleLadder" // order of scaling moves
  | "idempotency" // key → stored response
  | "embedVsReference" // document modelling
  | "designSteps" // 7-step system design script
  | "pkChoice" // sequential vs random ids in a B-tree
  | "defenceLayers" // type → NOT NULL → CHECK/UNIQUE/FK → app
  | "countFamily" // COUNT(*) vs COUNT(col) vs COUNT(DISTINCT)
  | "floatTrap"; // 0.1 in binary

/** Data-driven visuals rendered as HTML boxes (wrap well, theme-aware). */
export type Tone = "accent" | "ok" | "warn" | "bad" | "plain";
export type VisualSpec =
  | { kind: "flow"; steps: { label: string; sub?: string; tone?: Tone }[]; caption?: string }
  | { kind: "compare"; left: { title: string; lines: string[]; tone?: Tone }; right: { title: string; lines: string[]; tone?: Tone }; caption?: string }
  | { kind: "ladder"; steps: { label: string; sub?: string; tone?: Tone }[]; caption?: string }
  | { kind: "cards"; items: { title: string; lines: string[]; tone?: Tone }[]; caption?: string };

export type SqlExample = {
  /** Shown above the editor. */
  title?: string;
  sql: string;
  /** One short line shown under the results. */
  note?: string;
  /** Offer a "Show plan" button (EXPLAIN QUERY PLAN). */
  explain?: boolean;
};

export type CodeExample = {
  lang: "ts" | "js" | "sql" | "bash" | "json" | "text";
  src: string;
  title?: string;
  note?: string;
};

export type Table = { head: string[]; rows: string[][] };

export type Section = {
  title: string;
  /** A question to think about BEFORE the explanation. The page shows it first; the rest opens on "Show me". */
  ask?: string;
  /** An everyday comparison, shown FIRST, before any SQL or jargon. 1–2 sentences. */
  analogy?: string;
  /** Plain words: what goes wrong for you if you skip this idea. 1 sentence. */
  why?: string;
  body?: string;
  bullets?: string[];
  table?: Table;
  diagram?: DiagramId;
  /** A second, data-driven picture (flow / compare / ladder / cards). */
  visual?: VisualSpec;
  sql?: SqlExample[];
  code?: CodeExample[];
  tip?: string;
  warn?: string;
  /** Longer detail, collapsed by default. */
  more?: string;
};

/** A hard real-world problem, solved step by step. */
export type RealWorld = {
  title: string;
  /** The problem as a product manager would say it. */
  problem: string;
  whyHard: string;
  /** The trick, in plain steps. */
  steps: string[];
  /** Runnable on the playground data when present. */
  sql?: string;
  code?: CodeExample;
  takeaway: string;
};

/** One line of a query, read aloud in plain words. */
export type StoryLine = { sql: string; say: string };

/** A query inside a story page: the SQL, optionally read line by line, and what to look for in the result. */
export type StoryQuery = {
  title?: string;
  sql: string;
  /** Line-by-line reading; the learner can switch between this and just running it. */
  lines?: StoryLine[];
  note?: string;
  explain?: boolean;
  /** What the reader should look for in the rows that come back. */
  expect?: string;
};

/**
 * A page of a story-style topic: a few short paragraphs that read like a scene, then the query it leads to.
 * Any paragraph that contains jargon gets the definition rendered right under it.
 */
export type StoryPage = {
  title: string;
  /** Scene label shown above the title, e.g. "Monday, 9:10 — support desk". */
  when?: string;
  /** Markdown paragraphs separated by blank lines. */
  text: string;
  /** Definitions for words not in the course glossary: [word, meaning]. */
  jargon?: [string, string][];
  table?: Table;
  visual?: VisualSpec;
  diagram?: DiagramId;
  queries?: StoryQuery[];
  /** A question to sit with before turning the page. */
  ask?: string;
};

export type Practice = {
  q: string;
  answer: string;
  explain: string;
  /** The solution read line by line (the learner can choose this or the direct answer). */
  lines?: StoryLine[];
  /** A nudge shown before the answer. Defaults to the first sentence of `explain`. */
  hint?: string;
  /** Solution query. When present the learner gets "Check my answer": their rows must match these rows. */
  sql?: string;
  /** Code the learner starts from. */
  starter?: string;
};

export type Interview = {
  q: string;
  a: string;
  level: "junior" | "mid" | "senior";
  /** A trap question: the obvious answer is wrong. Shown with a "tricky" badge. */
  tricky?: boolean;
  /** "What does this return?" style: the snippet is shown with the question and runs on the playground data. */
  sql?: string;
  /** The snippet read line by line. */
  lines?: StoryLine[];
};

/** A one-tap multiple-choice check with instant feedback. `answer` is the index of the right option. */
export type Quiz = {
  q: string;
  options: string[];
  answer: number;
  why: string;
  /** Feedback per option (same order as options), shown for the one the learner picked. */
  whyOptions?: string[];
  /** Ask the learner to write their reasoning in one or two sentences before revealing. */
  reason?: boolean;
  /** A scenario shown above the question, e.g. a table of balances. */
  setup?: string;
};

export type Topic = {
  /** Unique within the course, kebab-case. Used in the URL: #/db/<slug>. */
  slug: string;
  title: string;
  minutes: number;
  /** An everyday analogy, 1 to 3 sentences. */
  story: string;
  /** 3 to 5 short points: the whole topic in 30 seconds. */
  tldr: string[];
  /** New terms as [term, plain meaning]. */
  words?: [string, string][];
  sections: Section[];
  realWorld?: RealWorld[];
  /** 2–4 quick checks shown after the ideas, before the real problems. */
  quiz?: Quiz[];
  /** A guided walkthrough: slow build-up, think-first pages, checkpoints that must be answered before moving on. */
  guided?: boolean;
  /** Story format: the topic is told as scenes (pages) instead of sections. Always read as a book, never one long page. */
  tale?: StoryPage[];
  /** Who is in the story, one line, shown on the first page. */
  cast?: string;
  practice: Practice[];
  interview: Interview[];
  remember: string[];
};

export type Module = {
  id: string;
  title: string;
  simple: string;
  topics: Topic[];
};

export type Course = {
  id: string;
  title: string;
  short: string;
  emoji: string;
  tagline: string;
  status: "ready" | "coming";
  modules: Module[];
  /** For courses not built yet: the planned module list. */
  planned?: string[];
};
