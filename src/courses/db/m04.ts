import type { Module } from "../types";

export const M04: Module = {
  id: "performance",
  title: "Making it fast",
  simple: "Indexes you can picture, query plans you can read, the anti-patterns that cause 90% of slow pages, and the app-side habits that keep a database healthy.",
  topics: [
    {
      slug: "indexes",
      title: "Indexes: the B-tree you can picture",
      minutes: 22,
      story: "A 1,000-page book with no index: to find 'deadlock' you read every page. With an index at the back: open the index, find 'deadlock → p. 412', open page 412. Three steps, regardless of how thick the book is.",
      tldr: [
        "An index is a **sorted copy of one or more columns** with pointers to the rows, stored as a B-tree: 3–4 page reads find any key.",
        "Indexes speed up WHERE, JOIN, ORDER BY and GROUP BY on those columns, and **slow down every write** a little.",
        "Composite index `(a, b)` serves `a`, and `a AND b`, and `ORDER BY a, b`, but not `b` alone (leftmost prefix).",
        "The planner ignores an index when the filter matches too many rows, when a function wraps the column, or when types mismatch.",
      ],
      words: [
        ["B-tree", "a balanced tree of sorted keys where every leaf is the same depth"],
        ["selectivity", "how small a slice of the table a condition keeps (small = good for an index)"],
        ["covering index", "an index that contains every column the query needs, so the table is not read"],
        ["partial index", "an index over only the rows matching a WHERE"],
        ["leftmost prefix", "a composite index helps only when the filter starts with its first column"],
      ],
      sections: [
        {
          title: "Walk the tree",
          analogy: "The index at the back of a book: a few hops from the index page to the exact page, however thick the book is.",
          why: "Indexes are the single biggest lever for speed.",
          diagram: "btree",
        },
        {
          title: "Scan vs seek: pages touched is the cost",
          analogy: "Reading every page of a book versus opening the index and jumping to page 412.",
          why: "Cost is pages read, not rows returned; a query returning one row can read the whole table.",
          diagram: "scanVsIndex",
          sql: [
            {
              title: "Without an index: SCAN. With one: SEARCH",
              sql: `EXPLAIN QUERY PLAN SELECT * FROM customers WHERE city = 'Mumbai';`,
              note: "SCAN customers = read every row. Now run the next box.",
            },
            {
              title: "Add the index and look again",
              sql: `CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
EXPLAIN QUERY PLAN SELECT * FROM customers WHERE city = 'Mumbai';`,
              note: "SEARCH customers USING INDEX idx_customers_city (city=?). Postgres would print Index Scan / Bitmap Heap Scan; MySQL prints type=ref, key=idx_customers_city.",
            },
          ],
        },
        {
          title: "Composite indexes: column order is everything",
          analogy: "A phone book sorted by surname then first name: great for finding Mehta, useless for finding every Priya.",
          why: "The right columns in the wrong order make an index useless.",
          diagram: "compositeIndex",
          bullets: [
            "Put **equality** columns first, then the **range** column, then columns needed for ORDER BY: `(status, ordered_at)` serves `WHERE status = 'paid' AND ordered_at > ...  ORDER BY ordered_at`.",
            "`(ordered_at, status)` would be wrong for that query: after the range on ordered_at, status is scattered.",
            "One index `(a, b, c)` replaces separate indexes on `a` and `(a, b)`. It does not replace an index on `b`.",
          ],
          sql: [
            {
              title: "Right order vs wrong order",
              sql: `CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, ordered_at);
EXPLAIN QUERY PLAN
SELECT id FROM orders WHERE status = 'paid' AND ordered_at >= '2025-03-01' ORDER BY ordered_at;`,
              note: "SEARCH ... USING INDEX idx_orders_status_date (status=? AND ordered_at>?) and no separate sort step: the index already delivers rows in ordered_at order.",
            },
          ],
        },
        {
          title: "When the index is ignored",
          analogy: "A phone book does not help if you search by middle name, or if 90% of the town has the same surname.",
          why: "You will add indexes that the planner refuses to use unless you know these rules.",
          visual: {"kind": "cards", "items": [{"title": "Low selectivity", "lines": ["95% of rows match", "scan is cheaper than 95% random reads"], "tone": "warn"}, {"title": "Function on the column", "lines": ["LOWER(email), YEAR(date)", "expression index or rewrite"], "tone": "bad"}, {"title": "Wrong column order", "lines": ["index (a, b) but WHERE b = ?", "leftmost prefix rule"], "tone": "bad"}, {"title": "Type mismatch", "lines": ["text column = 98765 (int)", "pass the right type"], "tone": "bad"}, {"title": "Leading wildcard", "lines": ["LIKE '%x'", "trigram / full-text index"], "tone": "bad"}, {"title": "Stale statistics", "lines": ["planner thinks the table is tiny", "ANALYZE"], "tone": "warn"}]},
          table: {
            head: ["Query", "Why the index is useless", "Fix"],
            rows: [
              ["`WHERE status = 'paid'` when 95% of rows are paid", "reading most of the table through an index is slower than a scan", "accept the scan, or a partial index for the rare values"],
              ["`WHERE LOWER(email) = 'x'`", "the index stores email, not LOWER(email)", "expression index on `lower(email)` or a citext column"],
              ["`WHERE created_at::date = '2025-01-01'`", "function on the column", "`created_at >= '2025-01-01' AND created_at < '2025-01-02'`"],
              ["`WHERE phone = 98765` (phone is text)", "implicit cast disables the index", "pass the right type: `'98765'`"],
              ["`WHERE name LIKE '%son'`", "leading wildcard: unknown prefix", "trigram index (pg_trgm) or full-text search"],
              ["`WHERE a = 1 OR b = 2`", "two different indexes, OR", "Postgres: BitmapOr handles it; else UNION of two queries"],
            ],
          },
        },
        {
          title: "Special indexes that solve specific pains",
          analogy: "Different tools for different jobs: a small index only for pending orders, an index on lower-cased emails, a map index for places.",
          why: "The default B-tree is not the best fit for every query.",
          bullets: [
            "**Unique index:** a rule AND a lookup. Every PK and UNIQUE constraint is one.",
            "**Partial index:** `CREATE INDEX ON orders (customer_id) WHERE status = 'pending'` is tiny and perfect for 'my pending orders'.",
            "**Covering index:** `CREATE INDEX ON orders (customer_id) INCLUDE (status, ordered_at)` answers the query from the index alone (Index Only Scan).",
            "**Expression index:** `CREATE INDEX ON customers (lower(email))`.",
            "**GIN:** for JSONB containment, arrays and full-text. **GiST:** ranges, geometry, exclusion constraints. **BRIN:** huge append-only tables ordered by time, tiny index.",
            "**Hash index:** equality only, rarely worth it over B-tree.",
          ],
        },
        {
          title: "What indexes cost",
          analogy: "Every extra index is one more card catalogue to update for every new book.",
          why: "Over-indexing makes writes slow and disks full.",
          visual: {"kind": "flow", "steps": [{"label": "INSERT one row", "tone": "accent"}, {"label": "heap page write"}, {"label": "idx_email B-tree write", "tone": "warn"}, {"label": "idx_created_at B-tree write", "tone": "warn"}, {"label": "idx_status B-tree write", "tone": "warn"}, {"label": "COMMIT", "sub": "4 writes for 1 row", "tone": "bad"}], "caption": "Every index is a tax on every write. Unused indexes (pg_stat_user_indexes.idx_scan = 0) are pure cost."},
          bullets: [
            "Every INSERT/UPDATE/DELETE must update every index on the table. 10 indexes ≈ 10 extra B-tree writes.",
            "Disk: an index on a wide column can be as big as the table.",
            "Updating an indexed column is more expensive than a non-indexed one (Postgres HOT updates only apply when no indexed column changes).",
            "Unused indexes are pure cost. Find them with `pg_stat_user_indexes` (idx_scan = 0) and drop them.",
          ],
          tip: "Index what you filter, join and sort by, in the shape your real queries use. Start from the slow query log, not from the schema.",
        },
      ],
      realWorld: [
        {
          title: "The orders page that got slower every month",
          problem: "'Show my paid orders, newest first, 20 at a time' took 40 ms at launch and 4 seconds a year later. There is an index on customer_id and one on ordered_at.",
          whyHard: "There ARE indexes on the columns involved, so developers assume the query is 'indexed'. But no single index matches the query's shape: equality on customer_id and status, then sort by ordered_at.",
          steps: [
            "Write down the query shape: `WHERE customer_id = ? AND status = 'paid' ORDER BY ordered_at DESC LIMIT 20`.",
            "Index rule: equality columns first, then the sort column: `(customer_id, status, ordered_at DESC)`.",
            "With that index the database jumps to this customer's paid orders, already sorted, and stops after 20 rows. Cost is 20 rows, forever.",
            "Check with EXPLAIN: no Sort node, no 'rows removed by filter'.",
          ],
          sql: `CREATE INDEX IF NOT EXISTS idx_orders_customer_status_date ON orders(customer_id, status, ordered_at DESC);
EXPLAIN QUERY PLAN
SELECT id, ordered_at FROM orders
WHERE customer_id = 1 AND status = 'paid'
ORDER BY ordered_at DESC LIMIT 20;`,
          takeaway: "An index must match the query shape, not just mention the columns. Equality → range/sort, and the whole ORDER BY in the index removes the sort.",
        },
      ],
      practice: [
        {
          q: "Which single index best serves `SELECT * FROM order_items WHERE product_id = ? AND qty >= 2 ORDER BY qty`?",
          answer: "(product_id, qty): equality column first, then the range/sort column.",
          explain: "The index narrows to one product and delivers rows in qty order, so the range and the ORDER BY are both served.",
        },
        {
          q: "Create an index that makes `SELECT name FROM products WHERE category = 'Books' ORDER BY price` a single index search, then show the plan.",
          answer: "SEARCH products USING INDEX ... (category=?) with no USE TEMP B-TREE FOR ORDER BY line.",
          explain: "An index on (category, price) serves the equality and the sort; adding name would make it covering.",
          sql: `CREATE INDEX IF NOT EXISTS idx_products_cat_price ON products(category, price);
EXPLAIN QUERY PLAN SELECT name FROM products WHERE category = 'Books' ORDER BY price;`,
          starter: `CREATE INDEX IF NOT EXISTS idx_products_cat_price ON products(...);\nEXPLAIN QUERY PLAN SELECT name FROM products WHERE category = 'Books' ORDER BY price;`,
        },
        {
          q: "You have an index on (last_name, first_name). Does `WHERE first_name = 'Priya'` use it? Why?",
          answer: "No. The index is sorted by last_name first, so first names are scattered across it; the leftmost prefix is missing.",
          explain: "A composite index is a phone book: you cannot find all 'Priya's without reading the whole book.",
        },
      ],
      interview: [
        { level: "junior", q: "What is an index and how does it make queries faster?", a: "A separate sorted structure, usually a B-tree, holding the indexed columns and pointers to rows. Finding a value takes a few page reads instead of scanning the table, so lookups stay fast as the table grows. The cost is extra writes and disk space for every index." },
        { level: "mid", q: "Why might the planner not use my index?", a: "Because the condition is not selective enough, so a scan is cheaper; or the column is wrapped in a function or an implicit cast; or the composite index does not start with the filtered column; or statistics are stale. I check with EXPLAIN and fix the query shape or the index." },
        { level: "mid", q: "How do you choose column order in a composite index?", a: "Equality conditions first, then the range or ORDER BY column, then columns I only need to read, which I put in INCLUDE. The leftmost prefix rule means the index serves queries that filter on a leading subset of its columns, in order." },
        { level: "senior", q: "What is a covering index and when is it worth it?", a: "An index that holds every column a query needs, so Postgres can answer with an Index Only Scan and never touch the table. It is worth it for hot, narrow queries like 'list my recent orders' where the extra index size is small compared with the heap reads it saves. It still needs the visibility map to be fresh, so VACUUM matters." },
        { level: "senior", q: "When would you use a partial index?", a: "When queries always target a small subset, like pending orders or undeleted users. The index only contains those rows, so it is tiny, fast to maintain and fast to search. I also use partial unique indexes for soft-deleted tables so a deleted email can be reused." },
      ],
      remember: [
        "Index = sorted copy + pointers; cost = pages touched.",
        "Composite: equality first, then range/sort; leftmost prefix rule.",
        "Functions, casts and leading wildcards hide the column from the index.",
        "Every index taxes every write. Drop the unused ones.",
      ],
    },

    {
      slug: "reading-query-plans",
      title: "Reading EXPLAIN: what the database actually did",
      minutes: 18,
      story: "Google Maps shows the route it picked and how long each leg took. EXPLAIN is the route; EXPLAIN ANALYZE is the trip with real times. You fix the slow leg, not the whole trip.",
      tldr: [
        "`EXPLAIN` shows the plan and estimates. `EXPLAIN ANALYZE` runs it and shows real times and row counts.",
        "Read the tree inside-out; the innermost, most-executed node is usually the problem.",
        "Compare **estimated rows vs actual rows**. A big gap means stale statistics or a condition the planner cannot estimate.",
        "Look for: Seq Scan on a big table, Sort without an index, Nested Loop with a large inner side, 'Rows Removed by Filter' in the thousands.",
      ],
      words: [
        ["plan node", "one step in the plan: a scan, a join, a sort, an aggregate"],
        ["cost", "the planner's unit-less estimate of work (not milliseconds)"],
        ["statistics", "the planner's knowledge of table size and value distribution, from ANALYZE"],
        ["loops", "how many times a node ran (inner side of a nested loop runs once per outer row)"],
      ],
      sections: [
        {
          title: "What the planner does",
          analogy: "A satnav comparing routes by estimated time and picking the quickest: wrong traffic data, wrong route.",
          why: "Reading plans is how you find out why a query is slow.",
          diagram: "queryPipeline",
        },
        {
          title: "The nodes you will meet",
          analogy: "The road types on the satnav route: motorway, side street, roundabout. Each plan node is a kind of step.",
          why: "You cannot fix a plan if you cannot read its steps.",
          table: {
            head: ["Node (Postgres)", "Meaning", "Good or bad?"],
            rows: [
              ["Seq Scan", "read the whole table", "fine for small tables or when most rows are needed; bad on big tables with a selective WHERE"],
              ["Index Scan", "walk the index, fetch matching rows from the table", "good for selective filters"],
              ["Index Only Scan", "answer from the index alone", "best; needs a covering index and a fresh visibility map"],
              ["Bitmap Heap Scan", "collect matching page ids from one or more indexes, then read pages in order", "good for medium selectivity and OR conditions"],
              ["Nested Loop", "for each outer row, run the inner side", "good when the inner side is an index lookup; terrible when it is a scan"],
              ["Hash Join", "hash the smaller side, probe with the larger", "good for big equality joins"],
              ["Merge Join", "zip two sorted inputs", "good when both are already sorted"],
              ["Sort", "sort rows in memory or on disk", "a sort on disk ('external merge') is slow; an index can remove it"],
              ["HashAggregate / GroupAggregate", "GROUP BY", "hash is usual; spills if work_mem is small"],
            ],
          },
        },
        {
          title: "Reading a real plan",
          analogy: "Checking the actual trip against the estimate: where did it take longest, and where was the estimate wrong?",
          why: "The slow node and the wrong estimate point straight at the fix.",
          diagram: "planTree",
          code: [
            {
              lang: "text",
              title: "EXPLAIN (ANALYZE, BUFFERS) on a slow query",
              src: `Limit  (cost=0.43..120.11 rows=20 width=24) (actual time=0.05..35.2 rows=20 loops=1)
  ->  Nested Loop  (cost=0.43..5982.0 rows=1000 width=24) (actual time=0.05..35.1 rows=20 loops=1)
        ->  Seq Scan on orders o  (cost=0.00..3400.0 rows=1000 width=16) (actual time=0.02..30.0 rows=20 loops=1)
              Filter: (status = 'paid')
              Rows Removed by Filter: 180000          <-- scanned 180k rows to find 20
        ->  Index Scan using customers_pkey on customers c  (cost=0.43..2.5 rows=1 width=16) (actual time=0.2..0.2 rows=1 loops=20)
              Index Cond: (id = o.customer_id)
Planning Time: 0.3 ms
Execution Time: 35.4 ms`,
              note: "Reading inside-out: the Seq Scan on orders threw away 180,000 rows. An index on (status, ordered_at) turns it into an Index Scan that reads 20 rows.",
            },
          ],
          bullets: [
            "`rows=1000` estimated vs `rows=20` actual: the estimate is off by 50×. Run `ANALYZE orders`.",
            "`loops=20` on the inner Index Scan: it ran once per outer row. Multiply its time by loops to see its real share.",
            "`BUFFERS` adds shared hit/read counts: reads from disk vs cache. High 'read' = cold cache or too much data.",
          ],
        },
        {
          title: "Try it: SQLite's version",
          analogy: "The same route map in a different app's wording.",
          why: "Plan vocabulary differs per database; the ideas do not.",
          sql: [
            {
              title: "A join plan",
              sql: `EXPLAIN QUERY PLAN
SELECT c.name, COUNT(*) FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'paid' GROUP BY c.id;`,
              note: "SQLite prints SCAN / SEARCH with the index used and 'USE TEMP B-TREE' for sorts and groupings. The ideas are identical; the vocabulary differs per database.",
            },
            {
              title: "Make the sort disappear",
              sql: `EXPLAIN QUERY PLAN SELECT * FROM products ORDER BY price;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
EXPLAIN QUERY PLAN SELECT * FROM products ORDER BY price;`,
              note: "First plan: SCAN + USE TEMP B-TREE FOR ORDER BY. Second: SCAN products USING INDEX idx_products_price, no temp B-tree.",
            },
          ],
        },
        {
          title: "A checklist for any slow query",
          analogy: "A mechanic's checklist: same steps every time, so nothing is missed.",
          why: "A fixed routine beats guessing when a page times out.",
          visual: {"kind": "ladder", "steps": [{"label": "EXPLAIN (ANALYZE, BUFFERS) with real parameters", "tone": "accent"}, {"label": "find the node with the biggest actual time × loops"}, {"label": "Seq Scan + selective filter → index that filter", "tone": "ok"}, {"label": "Sort node → index matching ORDER BY (+ equality filters first)", "tone": "ok"}, {"label": "estimated ≠ actual rows → ANALYZE, extended statistics", "tone": "warn"}, {"label": "Nested Loop with a scanned inner side → index the join column", "tone": "ok"}, {"label": "still slow → fewer columns, keyset pagination, pre-aggregate, cache", "tone": "warn"}]},
        },
      ],
      realWorld: [
        {
          title: "The query that was fast in staging and slow in production",
          problem: "A report runs in 50 ms on staging and 90 seconds in production. Same code, same indexes, same Postgres version.",
          whyHard: "Everyone compares code and schema. The difference is data distribution and statistics, which are invisible unless you look at the plan on each environment.",
          steps: [
            "EXPLAIN ANALYZE in both. Staging: Hash Join. Production: Nested Loop with the inner side scanning 2 million rows per outer row.",
            "The planner estimated 10 rows for a filter that actually returned 50,000, because the stats were from a tiny table that has since grown.",
            "`ANALYZE` the table (and check autovacuum settings so it keeps happening). The estimate corrects and the planner picks the Hash Join.",
            "For columns whose values are correlated (city and country), add `CREATE STATISTICS` so the planner stops multiplying selectivities as if independent.",
          ],
          code: {
            lang: "sql",
            src: `ANALYZE orders;                              -- refresh row estimates
CREATE STATISTICS orders_city_country (dependencies) ON city, country FROM customers;
ANALYZE customers;
-- then compare again
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;`,
          },
          takeaway: "A plan is only as good as the statistics behind it. 'Fast in staging, slow in prod' is usually estimated-vs-actual rows, not code.",
        },
      ],
      practice: [
        {
          q: "In an EXPLAIN ANALYZE output, a node shows `(actual time=0.2..0.3 rows=1 loops=50000)`. How much time did it really take?",
          answer: "About 0.3 ms × 50,000 ≈ 15 seconds. The per-loop time looks tiny; multiply by loops.",
          explain: "The inner side of a nested loop runs once per outer row; its actual time is per execution.",
        },
        {
          q: "Show the plan for finding orders in February 2025 and explain whether the existing idx_orders_customer index helps.",
          answer: "SCAN orders: the index on customer_id cannot help a filter on ordered_at.",
          explain: "An index helps only when the filtered column is its leading column.",
          sql: `EXPLAIN QUERY PLAN SELECT id FROM orders WHERE ordered_at >= '2025-02-01' AND ordered_at < '2025-03-01';`,
        },
        {
          q: "The plan shows `Sort (external merge Disk: 240MB)`. Name two fixes.",
          answer: "Add an index matching the ORDER BY so no sort is needed, or raise work_mem for that session so the sort happens in memory. Reducing the rows sorted (filter earlier, LIMIT with keyset) also works.",
          explain: "A disk sort means the input did not fit in work_mem; remove the sort or shrink its input.",
        },
      ],
      interview: [
        { level: "junior", q: "What is the difference between EXPLAIN and EXPLAIN ANALYZE?", a: "EXPLAIN shows the plan the optimiser chose with estimated costs and row counts, without running the query. EXPLAIN ANALYZE actually executes it and adds real timings and row counts per node, so I can see where estimates were wrong. I use ANALYZE carefully on writes, inside a transaction I roll back." },
        { level: "mid", q: "How do you read a query plan?", a: "Inside-out and bottom-up: the innermost nodes run first and feed the outer ones. I look for the node with the largest actual time multiplied by loops, compare estimated and actual rows, and check for Seq Scans with many rows removed by filter, disk sorts, and nested loops with a big inner side." },
        { level: "mid", q: "What does 'Rows Removed by Filter: 180000' tell you?", a: "The scan read 180,000 rows that did not match the condition, so the filter is selective but not indexed. An index on that column, or a composite one matching the full query shape, would let the planner read only the matching rows." },
        { level: "senior", q: "A query is fast in staging and slow in production with the same schema. Where do you look?", a: "At the plans side by side. The usual cause is different data distribution and stale statistics, so the planner picks a nested loop in production where a hash join was right. I run ANALYZE, check autovacuum, add extended statistics for correlated columns, and only then consider rewriting the query or adding an index." },
      ],
      remember: [
        "EXPLAIN = plan + estimates; EXPLAIN ANALYZE = plan + reality.",
        "Biggest actual time × loops is the culprit.",
        "Estimated ≠ actual rows → ANALYZE.",
        "Seq Scan + selective filter → index; Sort → index on ORDER BY.",
      ],
    },

    {
      slug: "query-antipatterns",
      title: "Query anti-patterns that cause 90% of slow pages",
      minutes: 18,
      story: "A courier delivering 100 parcels by driving back to the depot after each one. Nothing is 'wrong' with any single trip; the pattern is the problem. N+1, OFFSET and friends are that courier.",
      tldr: [
        "**N+1:** one query for the list plus one per item. Fix with a JOIN, an `IN (...)` batch, or DataLoader.",
        "**OFFSET pagination** reads and throws away every skipped row. Use **keyset** (`WHERE id > last`).",
        "**NOT IN with NULLs** returns nothing. Use NOT EXISTS.",
        "**SELECT \\*** drags unneeded columns through the network and blocks covering indexes.",
      ],
      words: [
        ["N+1", "N extra queries triggered by iterating over N results"],
        ["keyset pagination", "paging by 'rows after the last one I saw' using an indexed key"],
        ["sargable", "a condition written so an index can be used (Search ARGument ABLE)"],
        ["DataLoader", "a batching layer that turns many single-id lookups into one IN query"],
      ],
      sections: [
        {
          title: "N+1",
          analogy: "A courier driving back to the depot after every single parcel.",
          why: "The most common cause of slow pages in ORM-based apps.",
          diagram: "nplus1",
          code: [
            {
              lang: "ts",
              title: "Spot it in Node",
              src: `// N+1: 1 query + one per order
const orders = await db.query("SELECT * FROM orders LIMIT 100");
for (const o of orders.rows) {
  o.customer = (await db.query("SELECT * FROM customers WHERE id = $1", [o.customer_id])).rows[0];
}

// Fix 1: one JOIN
await db.query("SELECT o.*, c.name FROM orders o JOIN customers c ON c.id = o.customer_id LIMIT 100");

// Fix 2: batch the ids (what DataLoader / Prisma include do)
const ids = [...new Set(orders.rows.map((o) => o.customer_id))];
const customers = await db.query("SELECT * FROM customers WHERE id = ANY($1)", [ids]);`,
            },
          ],
          tip: "Count queries per request in development (log them). If the number grows with the size of a list, you have N+1.",
        },
        {
          title: "OFFSET vs keyset pagination",
          analogy: "Finding page 500 of a book by counting pages from the start, versus opening at the bookmark.",
          why: "Deep pages time out and show duplicates without keyset.",
          diagram: "keyset",
          sql: [
            {
              title: "Keyset: page 2 starts after the last id of page 1",
              sql: `-- page 1
SELECT id, ordered_at FROM orders ORDER BY ordered_at DESC, id DESC LIMIT 5;
-- page 2: pass the last (ordered_at, id) from page 1 as the cursor
SELECT id, ordered_at FROM orders
WHERE (ordered_at, id) < ('2025-05-01 15:00:00', 20)
ORDER BY ordered_at DESC, id DESC LIMIT 5;`,
              note: "The tuple comparison (a, b) < (x, y) handles ties correctly. Keyset cannot jump to page 500 directly, which real products rarely need.",
            },
          ],
        },
        {
          title: "NOT IN and NULL",
          analogy: "'Anyone not on this list' when the list has a blank line: you cannot be sure anyone is not on it.",
          why: "NOT IN silently returns nothing when a NULL sneaks in.",
          diagram: "nullLogic",
          sql: [
            {
              title: "The empty result that is 'correct'",
              sql: `-- employees who are not managers of anyone
SELECT name FROM employees WHERE id NOT IN (SELECT manager_id FROM employees);      -- 0 rows! manager_id has a NULL
SELECT name FROM employees WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = employees.id); -- correct`,
              note: "x NOT IN (1, NULL) is 'x <> 1 AND x <> NULL' = unknown, so no row ever passes.",
            },
          ],
        },
        {
          title: "Non-sargable conditions",
          analogy: "Asking the phone book for 'surnames that, when lower-cased, equal mehta': the book is sorted by the original spelling, so you must read it all.",
          why: "A function on a column throws away the index.",
          diagram: "sargable",
          table: {
            head: ["Slow", "Fast", "Why"],
            rows: [
              ["`WHERE YEAR(created_at) = 2025`", "`WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'`", "function on the column hides it from the index"],
              ["`WHERE price * 1.18 > 100`", "`WHERE price > 100 / 1.18`", "move maths to the constant side"],
              ["`WHERE LOWER(email) = $1`", "expression index on lower(email), or citext", "or store lower-cased"],
              ["`WHERE id = '42'` (id is int)", "`WHERE id = 42`", "casts can disable the index (MySQL especially)"],
              ["`WHERE name LIKE '%x%'`", "trigram / full-text index", "leading wildcard"],
              ["`WHERE a = 1 OR b = 2`", "`... WHERE a = 1 UNION ... WHERE b = 2`", "when the planner cannot combine two indexes"],
            ],
          },
        },
        {
          title: "More habits that hurt",
          analogy: "Small bad habits that add up: carrying everything you own to every meeting (SELECT *), shuffling the whole deck to pick one card (ORDER BY random()).",
          why: "Each one is a known slow-down you can avoid.",
          bullets: [
            "**SELECT \\*:** fetches bytea blobs and JSON you do not need, defeats covering indexes, breaks when columns are added.",
            "**DISTINCT to hide duplicates** from a fan-out join: fix the join.",
            "**Correlated subquery in SELECT** per row: use a window function or a pre-aggregated join.",
            "**COUNT(\\*) for 'is there any?':** use `EXISTS` and stop at the first row.",
            "**ORDER BY random() LIMIT 1:** sorts the whole table. Pick a random id range instead.",
            "**Exact COUNT(\\*) on a 100M-row table** for a page footer: use an estimate (`pg_class.reltuples`) or a counter.",
            "**One statement per row in a loop** for bulk writes: batch VALUES or COPY.",
            "**Opening a transaction and then awaiting an HTTP call:** holds locks and a connection for seconds.",
          ],
        },
      ],
      realWorld: [
        {
          title: "Page 5,000 takes 8 seconds",
          problem: "An admin table of 2 million events paginates with `LIMIT 50 OFFSET 250000`. The first pages are instant, deep pages time out, and users see duplicate rows when new events arrive.",
          whyHard: "The query uses an index and returns only 50 rows, so it 'should' be fast. The hidden cost is the 250,000 rows the database must walk past before it can start returning.",
          steps: [
            "Make the sort key unique and indexed: `ORDER BY created_at DESC, id DESC` with an index on `(created_at DESC, id DESC)`.",
            "Return a cursor with each page: the `(created_at, id)` of the last row, encoded as an opaque string.",
            "Next page: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 50`. The index seeks straight to the cursor.",
            "Duplicates disappear too, because the cursor is a position in the data, not a row count.",
          ],
          code: {
            lang: "ts",
            title: "Node handler",
            src: `const cursor = req.query.cursor ? decode(req.query.cursor) : null;   // { at, id }
const { rows } = await db.query(
  \`SELECT id, created_at, type FROM events
   WHERE ($1::timestamptz IS NULL OR (created_at, id) < ($1, $2))
   ORDER BY created_at DESC, id DESC
   LIMIT 51\`,
  [cursor?.at ?? null, cursor?.id ?? null],
);
const page = rows.slice(0, 50);
const next = rows.length > 50 ? encode({ at: page[49].created_at, id: page[49].id }) : null;
res.json({ items: page, nextCursor: next });`,
          },
          takeaway: "OFFSET is a row count; a cursor is a position. Positions are O(log n) with an index; counts are O(n).",
        },
      ],
      practice: [
        {
          q: "Rewrite `SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)` so it is NULL-safe, and run it.",
          answer: "Ishaan Roy (the only customer with no orders).",
          explain: "NOT EXISTS evaluates per customer and ignores NULLs in the subquery.",
          sql: `SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) ORDER BY name;`,
          starter: `SELECT name FROM customers c WHERE NOT EXISTS (...) ORDER BY name;`,
        },
        {
          q: "Get the 3 orders after (ordered_at '2025-02-14 12:00:00', id 9) in ascending date order using keyset pagination.",
          answer: "Orders 10, 11, 12.",
          explain: "A tuple comparison on (ordered_at, id) continues exactly where the last page ended.",
          sql: `SELECT id, ordered_at FROM orders WHERE (ordered_at, id) > ('2025-02-14 12:00:00', 9) ORDER BY ordered_at, id LIMIT 3;`,
        },
        {
          q: "Your GraphQL resolver returns 200 posts and each post's author triggers a query. Name two fixes.",
          answer: "Batch with DataLoader (collect author ids, one WHERE id IN (...) query per tick), or join authors in the posts query. Either turns 201 queries into 1 or 2.",
          explain: "N+1 is solved by batching or joining, never by a faster single query.",
        },
      ],
      interview: [
        { level: "junior", q: "What is the N+1 problem?", a: "Loading a list with one query and then running one more query per item, for example fetching each order's customer in a loop. 100 orders means 101 round trips. The fix is a JOIN, or collecting the ids and loading them in one IN query, which is what DataLoader and ORM eager loading do." },
        { level: "mid", q: "Why is OFFSET pagination slow and what do you use instead?", a: "OFFSET makes the database read and discard every skipped row, so page 5,000 costs 250,000 rows, and inserts shift rows so users see duplicates. Keyset pagination passes the last seen sort key and uses WHERE key > cursor with an index, so every page costs the same and positions are stable." },
        { level: "mid", q: "What does 'sargable' mean?", a: "A condition written so an index can be used: the bare column compared to a constant or parameter. Wrapping the column in a function, casting it, or using a leading wildcard makes the condition non-sargable and forces a scan. I move the maths to the constant side or add an expression index." },
        { level: "senior", q: "How do you find and fix N+1 across a large codebase?", a: "Instrument query counts per request in development and alert when the count scales with a list size. Then fix at the data access layer: DataLoader for GraphQL, eager loading or explicit joins in the ORM, and batch endpoints. I add a test that asserts the query count for key pages so it cannot regress." },
      ],
      remember: [
        "Queries per request must not grow with list size.",
        "Keyset pagination: WHERE (key, id) > cursor, index on (key, id).",
        "NOT IN + NULL = empty. Use NOT EXISTS.",
        "Keep the indexed column bare: no functions, casts or leading %.",
      ],
    },

    {
      slug: "pooling-caching-app-layer",
      title: "Pools, caches and the app layer",
      minutes: 18,
      story: "A restaurant with 10 tables and 100 people outside. You do not build 100 tables; you seat 10, keep a queue, and serve quickly. Connections are the tables, the pool is the host, and a cache is the pre-made dessert.",
      tldr: [
        "Opening a connection is expensive. A **pool** keeps a few open and queues requests. More connections past a point make the database **slower**.",
        "One request must use one connection for a whole transaction. Never hold a connection across an external call.",
        "**Cache-aside** with Redis: read cache → miss → read DB → fill cache. On write: update DB, **delete** the key.",
        "Set timeouts everywhere: statement timeout, lock timeout, pool acquire timeout.",
      ],
      words: [
        ["connection pool", "a set of open connections shared by all requests"],
        ["cache-aside", "the app checks the cache first and fills it on a miss"],
        ["TTL", "time to live: how long a cached value stays valid"],
        ["cache stampede", "many requests rebuilding the same expired key at once"],
        ["read replica", "a copy of the database that serves SELECTs"],
      ],
      sections: [
        {
          title: "Connection pooling",
          analogy: "A restaurant with ten tables: seat ten, keep a queue, and serve fast. Building a hundred tables makes the kitchen slower.",
          why: "Pool mistakes cause the 'database is idle but the app is down' outage.",
          diagram: "pool",
          code: [
            {
              lang: "ts",
              title: "pg Pool: the right shape",
              src: `import { Pool } from "pg";
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                       // per app instance; 5 instances → 50 server connections
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast when the pool is exhausted
  statement_timeout: 10_000,      // no query may run longer than 10 s
});

// A transaction needs ONE client for all its statements
export async function transfer(from: number, to: number, amount: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1", [amount, from]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, to]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();           // ALWAYS, or the pool leaks and the app freezes
  }
}`,
            },
          ],
          bullets: [
            "`pool.query(...)` for single statements. For a transaction, `pool.connect()` and use that one client.",
            "Pool size rule of thumb: `cores × 2 + spindles`, often 10–20. Postgres spends memory per connection; 500 connections thrash.",
            "Many app instances or serverless functions? Put **PgBouncer / RDS Proxy** in front in transaction mode.",
            "Never `await fetch(...)` while holding a client. Finish the transaction, then call the outside world.",
          ],
        },
        {
          title: "Caching with Redis",
          analogy: "Keeping today's specials on a chalkboard instead of asking the kitchen every time.",
          why: "Caching is the cheapest speed-up and the easiest way to serve stale data.",
          diagram: "cacheAside",
          code: [
            {
              lang: "ts",
              title: "Cache-aside with stampede protection",
              src: `async function getProduct(id: number) {
  const key = \`product:\${id}\`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);

  // only one caller rebuilds; others wait briefly and re-read
  const lock = await redis.set(key + ":lock", "1", "NX", "PX", 2000);
  if (!lock) { await sleep(50); return getProduct(id); }

  const row = (await pool.query("SELECT * FROM products WHERE id = $1", [id])).rows[0];
  await redis.set(key, JSON.stringify(row), "EX", 60 + Math.floor(Math.random() * 30)); // jittered TTL
  await redis.del(key + ":lock");
  return row;
}

async function updateProduct(id: number, patch) {
  await pool.query("UPDATE products SET ... WHERE id = $1", [id]);
  await redis.del(\`product:\${id}\`);   // invalidate, don't try to update the cached copy
}`,
            },
          ],
          table: {
            head: ["Cache what", "Not what"],
            rows: [
              ["product catalogue, config, user profile (read-heavy, tolerates seconds of staleness)", "balances, stock counts, anything a decision depends on"],
              ["expensive aggregates (dashboard tiles)", "per-user lists that change on every write"],
              ["session data, rate-limit counters (Redis is the primary store here)", "data you cannot invalidate on write"],
            ],
          },
        },
        {
          title: "Read replicas from the app",
          analogy: "Photocopies of the master document for people who only need to read it; edits go to the original.",
          why: "Reading your own write from a copy shows your change 'disappearing'.",
          visual: {"kind": "flow", "steps": [{"label": "write", "sub": "→ primary", "tone": "accent"}, {"label": "read my own fresh data", "sub": "→ primary (for a few seconds)", "tone": "warn"}, {"label": "lists, search, reports", "sub": "→ replica (lag is fine)", "tone": "ok"}], "caption": "Replicas scale reads only. Write load needs batching, fewer indexes, partitioning or sharding."},
          bullets: [
            "Route SELECTs that tolerate lag (lists, reports) to replicas; writes and read-after-write to the primary.",
            "After a user writes, read from the primary for that request (or for a few seconds) to avoid 'my change vanished'.",
            "Replicas do not reduce write load. For that: batching, fewer indexes, partitioning, sharding.",
          ],
        },
        {
          title: "ORM realities (Prisma, TypeORM, Drizzle)",
          analogy: "A translator who is fluent but sometimes verbose: check what they actually said.",
          why: "ORMs generate N+1 and SELECT * unless you watch the SQL.",
          bullets: [
            "ORMs generate N+1 by default when you access relations lazily. Use `include` / eager loading deliberately.",
            "Look at the SQL they emit (query logging on in dev). Many 'slow ORM' issues are SELECT \\* plus missing indexes.",
            "Prisma's `$transaction([...])` runs an array atomically but not interactively; use the callback form for read-then-write logic.",
            "Migrations from the ORM are fine for small tables; for big tables, write the SQL by hand (expand/contract).",
            "Raw SQL for reports and windows; the ORM for CRUD. Both parameterise.",
          ],
        },
      ],
      realWorld: [
        {
          title: "The API that falls over at 300 concurrent users",
          problem: "Under load, requests hang for 30 seconds then fail with 'timeout acquiring connection'. CPU on the database is at 15%. Adding app servers makes it worse.",
          whyHard: "The database is idle, so people blame the network or the ORM. The real limit is a pool of 10 per instance × 20 instances = 200 server connections, with one request type holding its connection while calling a slow payment API.",
          steps: [
            "Measure: pool waiting count and connection hold time per endpoint. One endpoint holds a client for 2–8 seconds.",
            "Find the hold: a transaction opened before `await paymentApi.charge()`. Move the external call outside the transaction (charge first, then a short transaction to record it; or record 'pending', call, then update).",
            "Right-size: fewer, faster transactions mean the same pool serves 10× the requests. Put PgBouncer in transaction mode so 20 instances share 50 real connections.",
            "Add `connectionTimeoutMillis` so overload fails fast (503) instead of piling up, and `statement_timeout` so a runaway query cannot hog a connection.",
          ],
          code: {
            lang: "ts",
            title: "Before and after",
            src: `// BEFORE: connection held for the whole payment call (seconds)
const client = await pool.connect();
await client.query("BEGIN");
await client.query("INSERT INTO orders ...");
const charge = await paymentApi.charge(card, amount);   // 2–8 s, pool starves
await client.query("INSERT INTO payments ...");
await client.query("COMMIT");

// AFTER: two short transactions around the external call
const orderId = await createPendingOrder(pool);          // ms
const charge = await paymentApi.charge(card, amount, { idempotencyKey: orderId });
await recordPayment(pool, orderId, charge);              // ms, idempotent upsert`,
          },
          takeaway: "Connections are a scarce shared resource. Hold them for milliseconds, never across the network, and fail fast when the pool is empty.",
        },
      ],
      practice: [
        {
          q: "An app has 30 instances, each with a pool of 20. Postgres max_connections is 300. What happens under load and what do you change?",
          answer: "600 possible connections exceed 300; new connections fail with 'too many clients'. Lower per-instance pools (e.g. 5–8) or add PgBouncer in transaction mode so instances share a small real pool.",
          explain: "Total connections = instances × pool size; the database's limit is global.",
        },
        {
          q: "Why delete a cache key on write instead of updating it with the new value?",
          answer: "Two writers can race and leave the cache holding the older value forever. Deleting forces the next reader to load the truth from the database.",
          explain: "Invalidate-on-write is simpler and safe; update-on-write needs ordering guarantees you do not have.",
        },
        {
          q: "Write the conditional transfer statement that refuses to overdraw account 2 (move 500 from account 2 to 1) and show the balances after.",
          answer: "0 rows updated by the debit (balance 120 < 500); balances unchanged.",
          explain: "The WHERE balance >= amount guard makes the debit atomic and safe; the app must check the row count before crediting.",
          sql: `UPDATE accounts SET balance = balance - 500 WHERE id = 2 AND balance >= 500;
SELECT id, owner, balance FROM accounts ORDER BY id;`,
        },
      ],
      interview: [
        { level: "junior", q: "What is a connection pool and why use one?", a: "A set of database connections kept open and shared by requests. Opening a connection costs a TCP and auth handshake plus server memory, so reusing them is much faster. The pool also caps how many connections the app can open, which protects the database." },
        { level: "mid", q: "How big should the pool be?", a: "Smaller than people expect: around CPU cores times two, often 10 to 20 per database, not per app instance. Beyond that, connections compete for the same cores and everything gets slower. With many instances or serverless, I put PgBouncer or RDS Proxy in front so they share a small real pool." },
        { level: "mid", q: "Explain cache-aside and its failure modes.", a: "The app reads the cache, on a miss reads the database and writes the cache with a TTL; on writes it updates the database and deletes the key. Failure modes are stale data if invalidation is missed, stampedes when a hot key expires, and hot keys overloading one Redis node. I use jittered TTLs, a rebuild lock, and never cache data that decisions depend on." },
        { level: "senior", q: "Under load the database is idle but requests time out waiting for connections. Diagnose.", a: "The pool is exhausted by requests that hold connections too long, typically a transaction open across an external HTTP call or a slow query without a statement timeout. I measure hold time per endpoint, move external calls outside transactions, add statement and acquire timeouts so overload fails fast, and add PgBouncer if many instances fight for connections." },
      ],
      remember: [
        "Pool small (10–20); one client per transaction; release in finally.",
        "Never hold a connection across an external call.",
        "Cache-aside: read → miss → DB → set; write → DB → DEL key.",
        "Timeouts: statement, lock, pool acquire. Fail fast beats pile-up.",
      ],
    },
  ],
};
