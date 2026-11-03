// Chapter (module) summaries: a readable overview of every topic in the chapter, the rules to keep,
// and practical questions with answers. Shown on #/db/chapter/<moduleId> after the chapter's topics.

export type Practical = { q: string; a: string; sql?: string; /** the SQL is expected to be refused */ fails?: boolean };
export type Chapter = {
  moduleId: string;
  /** One plain line per topic, in order: what you can now do. */
  overview: { slug: string; line: string }[];
  /** The handful of rules worth keeping from this chapter. */
  rules: string[];
  practical: Practical[];
};

export const CHAPTERS: Chapter[] = [
  {
    moduleId: "foundations",
    overview: [
      { slug: "what-is-a-database", line: "A database is storage plus four promises: many writers, all-or-nothing changes, fast lookups, and rules. SQL says WHAT, the planner decides HOW." },
      { slug: "tables-keys-relationships", line: "Rows are things, columns are facts, the primary key names a row, a foreign key points at a row elsewhere. 1:N puts the key on the many side; M:N needs a join table." },
      { slug: "data-types-and-constraints", line: "Types and constraints are the bouncer at the door: money is NUMERIC, instants are timestamptz, and CHECK / UNIQUE / FK stop bad data from every writer." },
    ],
    rules: ["Default to Postgres; add other stores for a measured need.", "NULL is unknown: IS NULL, COALESCE, NOT EXISTS.", "Money never in FLOAT.", "Constraints in the database, friendly messages in the app."],
    practical: [
      { q: "Your shop keeps stock in a JSON file and two customers both bought the last item. What do you tell the team?", a: "The file cannot serialise two writers. Move stock into a table and decrement with one conditional UPDATE (stock = stock − 1 WHERE stock ≥ 1), then check the changed-row count. No lock in the app, no race.", sql: "UPDATE products SET stock = stock - 1 WHERE id = 3 AND stock >= 1;\nSELECT changes() AS sold, stock FROM products WHERE id = 3;" },
      { q: "A report shows 9 employees with a manager but there are 10 employees. Is the report wrong?", a: "No. COUNT(manager_id) skips the CEO's NULL. COUNT(*) counts rows. Decide which question you are answering and pick the matching count.", sql: "SELECT COUNT(*) AS everyone, COUNT(manager_id) AS with_manager FROM employees;" },
      { q: "Design the tables for 'students enrol in courses and complete lessons'.", a: "students, courses, lessons(course_id). Enrolments are M:N → enrolments(student_id, course_id) with a composite PK. Completions are M:N → lesson_completions(student_id, lesson_id, done_at). 'Finished more than half' = COUNT(completions) × 2 > COUNT(lessons) per (student, course)." },
      { q: "Finance says monthly totals are off by a few paise. Where do you look first?", a: "The column type. If amounts are FLOAT/REAL, each row is a binary approximation and sums drift. Migrate to NUMERIC(12,2) or integer paise and round only for display.", sql: "SELECT 0.1 + 0.2 = 0.3 AS looks_equal, ROUND(0.1 + 0.2, 2) AS rounded;" },
      { q: "An admin script inserted an order for a customer that does not exist. How do you make that impossible for every future script?", a: "A foreign key: orders.customer_id REFERENCES customers(id). The database refuses orphans no matter who writes. Decide ON DELETE behaviour deliberately: RESTRICT for financial history, CASCADE only for true child rows.", sql: "-- this is refused on purpose: no customer 404\nINSERT INTO orders (customer_id, ordered_at, status) VALUES (404, '2025-07-01', 'paid');", fails: true },
    ],
  },
  {
    moduleId: "sql",
    overview: [
      { slug: "select-filter-sort", line: "Queries run FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT, which explains where aliases work. Parameters, never string building." },
      { slug: "aggregates-group-by", line: "GROUP BY folds rows into one row per bucket; WHERE filters rows before, HAVING filters buckets after. SUM(CASE WHEN …) pivots rows into columns." },
      { slug: "joins", line: "INNER keeps matches, LEFT keeps every left row. Filter the right side in ON, not WHERE. Two 1:N joins at once multiply rows: pre-aggregate." },
      { slug: "subqueries-ctes", line: "A subquery can be a value, a list, a test (EXISTS) or a table. CTEs name the steps. WITH RECURSIVE walks trees of any depth." },
      { slug: "window-functions", line: "Window functions keep every row and add a column from its neighbours: ranks, top-N per group, running totals, LAG. Consecutive runs = value − ROW_NUMBER." },
      { slug: "writing-data", line: "Batch inserts, RETURNING, UPSERT with ON CONFLICT for idempotency, and BEGIN/COMMIT around related writes. Never await the network inside a transaction." },
      { slug: "sql-toolkit", line: "NULL is unknown: NOT IN with a NULL returns nothing, use NOT EXISTS. CASE labels and pivots; COALESCE and NULLIF tame NULL and division by zero; UNION ALL unless you want dedupe; date ranges are half-open." },
      { slug: "views-triggers-procedures", line: "A view is a saved query (one rule, one place), a materialized view a saved result you refresh, a trigger runs for every writer inside the transaction, a generated column is a formula the row keeps; procedures for set-based batch work near the data." },
    ],
    rules: ["Alias in ORDER BY yes, in WHERE no.", "LEFT JOIN + condition on the right table → put it in ON.", "NOT IN with a NULL returns nothing → NOT EXISTS.", "Top-N per group: ROW_NUMBER in a CTE, filter outside.", "Retries safe? Only with a unique key + ON CONFLICT."],
    practical: [
      { q: "Revenue per category doubled after you added the payments table to the join. Fix it.", a: "Fan-out: each item row paired with each payment row. Aggregate items per order and payments per order in two CTEs, then join the two one-row-per-order sets.", sql: "WITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id),\n     pays  AS (SELECT order_id, SUM(amount) AS paid FROM payments GROUP BY order_id)\nSELECT o.id, i.items_total, COALESCE(p.paid, 0) AS paid\nFROM orders o JOIN items i ON i.order_id = o.id LEFT JOIN pays p ON p.order_id = o.id\nORDER BY o.id LIMIT 5;" },
      { q: "Marketing wants customers who ordered in January 2025 but not in February 2025.", a: "Semi-join for January, anti-join for February: JOIN orders in Jan, WHERE NOT EXISTS an order in Feb for the same customer.", sql: "SELECT DISTINCT c.name FROM customers c\nJOIN orders j ON j.customer_id = c.id AND j.ordered_at >= '2025-01-01' AND j.ordered_at < '2025-02-01'\nWHERE NOT EXISTS (SELECT 1 FROM orders f WHERE f.customer_id = c.id AND f.ordered_at >= '2025-02-01' AND f.ordered_at < '2025-03-01')\nORDER BY c.name;" },
      { q: "Show the second-highest salary in each department, handling ties.", a: "DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) in a CTE, then WHERE rank = 2 outside.", sql: "WITH r AS (SELECT dept, name, salary, DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk FROM employees)\nSELECT dept, name, salary FROM r WHERE rk = 2 ORDER BY dept;" },
      { q: "A chart of monthly revenue skips March because there were no orders. Make March show 0.", a: "Build the months first (recursive CTE or generate_series), LEFT JOIN the aggregated revenue onto it, COALESCE to 0. GROUP BY cannot invent empty groups.", sql: "WITH RECURSIVE m(month) AS (SELECT '2025-01' UNION ALL SELECT strftime('%Y-%m', date(month || '-01', '+1 month')) FROM m WHERE month < '2025-06'),\nrev AS (SELECT strftime('%Y-%m', o.ordered_at) AS month, SUM(oi.qty * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY month)\nSELECT m.month, COALESCE(rev.revenue, 0) AS revenue FROM m LEFT JOIN rev ON rev.month = m.month ORDER BY m.month;" },
      { q: "Stripe delivered the same payment webhook twice and you credited the order twice. Prevent it.", a: "Store the provider event id with a UNIQUE constraint and INSERT … ON CONFLICT DO NOTHING RETURNING id in the same transaction as the credit. A duplicate returns no row, so you skip the credit.", sql: "CREATE TABLE IF NOT EXISTS webhook_events (event_id TEXT PRIMARY KEY, order_id INTEGER NOT NULL);\nINSERT INTO webhook_events VALUES ('evt_9', 7) ON CONFLICT (event_id) DO NOTHING RETURNING event_id;\nINSERT INTO webhook_events VALUES ('evt_9', 7) ON CONFLICT (event_id) DO NOTHING RETURNING event_id;" },
      { q: "Users who logged in three days in a row, with the streak's start and end.", a: "Gaps and islands: ROW_NUMBER per user by day, subtract it from the day, GROUP BY the difference, HAVING COUNT(*) ≥ 3.", sql: "WITH n AS (SELECT user_id, day, date(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp FROM logins)\nSELECT user_id, MIN(day) AS start_day, MAX(day) AS end_day, COUNT(*) AS days FROM n GROUP BY user_id, grp HAVING COUNT(*) >= 3 ORDER BY user_id, start_day;" },
    ],
  },
  {
    moduleId: "design",
    overview: [
      { slug: "normalization", line: "One fact in one place. 3NF: every non-key column depends on the key, the whole key, nothing but the key. Snapshot historical facts (the price you paid) on purpose." },
      { slug: "real-world-schema-patterns", line: "tenant_id first in every index, soft delete with a partial unique index, guarded status transitions, append-only history, and the three tree models." },
      { slug: "ids-and-migrations", line: "bigint inside, UUID v7 outside. Change a live schema with expand → migrate → contract, batched backfills, CONCURRENTLY, and a lock_timeout." },
      { slug: "json-and-search", line: "JSON for the varying, display-only long tail with an expression or GIN index on what you filter; promote a key to a column when it becomes a business fact. LIKE '%x%' scans; full-text is an inverted index, typos are trigrams." },
    ],
    rules: ["If this value changes, how many rows change? More than one → split.", "Current facts normalise; historical facts snapshot.", "Soft delete needs WHERE deleted_at IS NULL in the unique index.", "Never RENAME a column in one step on a live system."],
    practical: [
      { q: "Old invoices changed after marketing raised a price. The schema was 'perfectly normalised'. What happened?", a: "The invoice read the price through the FK, so it showed today's price. The agreed price is a historical fact: copy unit_price (and name) onto order_items at purchase time and never update it.", sql: "UPDATE products SET price = 55 WHERE id = 6;\nSELECT oi.order_id, oi.unit_price AS agreed, p.price AS catalogue_now FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.id = 6;" },
      { q: "Two guests booked room 101 for overlapping nights. Make it impossible.", a: "Postgres: an exclusion constraint on (room_id, daterange(starts, ends)) with &&. Elsewhere: lock the room row (SELECT … FOR UPDATE), check overlaps with start1 < end2 AND start2 < end1, insert, commit.", sql: "SELECT a.guest, b.guest AS clashes_with FROM bookings a JOIN bookings b ON b.room_id = a.room_id AND b.id > a.id\nWHERE a.starts_at < b.ends_at AND b.starts_at < a.ends_at;" },
      { q: "A deleted user cannot sign up again with the same email. Fix it without hard deletes.", a: "Replace the plain UNIQUE with a partial unique index: CREATE UNIQUE INDEX … ON customers (lower(email)) WHERE deleted_at IS NULL." },
      { q: "You must add a NOT NULL column to a 500M-row table with zero downtime. List the steps.", a: "ADD COLUMN nullable; deploy code writing it; backfill in PK-range batches with pauses; CREATE INDEX CONCURRENTLY if needed; ADD CONSTRAINT … CHECK (col IS NOT NULL) NOT VALID, then VALIDATE; SET NOT NULL; remove fallbacks." },
      { q: "Categories nest to any depth and the product page must list everything under a category. Which tree model?", a: "Start with adjacency list (parent_id) and a recursive CTE. If subtree reads dominate, add a materialised path or a closure table; both make 'everything under X' one indexed query." },
    ],
  },
  {
    moduleId: "performance",
    overview: [
      { slug: "indexes", line: "An index is a sorted copy with pointers; cost is pages touched. Composite order: equality columns first, then the range/sort column. Functions and casts hide the column." },
      { slug: "reading-query-plans", line: "EXPLAIN shows the plan, EXPLAIN ANALYZE shows reality. Find the biggest actual time × loops; compare estimated vs actual rows; Seq Scan with a selective filter wants an index." },
      { slug: "query-antipatterns", line: "N+1, OFFSET pagination, NOT IN with NULLs, SELECT *, non-sargable conditions and DISTINCT-as-band-aid cause most slow pages." },
      { slug: "pooling-caching-app-layer", line: "Pools small (10–20), one client per transaction, released in finally. Cache-aside with delete-on-write. Timeouts everywhere so overload fails fast." },
      { slug: "orms-and-n-plus-one", line: "N+1 is a relation touched in a loop: load it eagerly or batch by ids. Aggregates belong in SQL (groupBy or raw with parameters). Log the ORM's SQL: contains is LIKE '%q%', skip is OFFSET." },
      { slug: "database-operations", line: "Slower with the same data means dead rows or stale statistics: VACUUM and ANALYZE. Fix queries by total time from pg_stat_statements. Too many clients needs a pool and a pooler, never a bigger limit. Alert on cache hits, lag, waiting locks, long transactions, disk." },
    ],
    rules: ["Index the query shape, not the column list.", "Multiply node time by loops.", "Queries per request must not grow with list size.", "Never hold a connection across an external call."],
    practical: [
      { q: "'My paid orders, newest first' got slower every month although customer_id and ordered_at are each indexed.", a: "No index matches the shape. Create (customer_id, status, ordered_at DESC): equality columns first, then the sort. The plan loses its Sort node and reads 20 rows.", sql: "CREATE INDEX IF NOT EXISTS idx_orders_customer_status_date ON orders(customer_id, status, ordered_at DESC);\nEXPLAIN QUERY PLAN SELECT id FROM orders WHERE customer_id = 1 AND status = 'paid' ORDER BY ordered_at DESC LIMIT 20;" },
      { q: "The same query takes 50 ms in staging and 90 s in production. Same schema, same indexes.", a: "Compare EXPLAIN ANALYZE on both. Usually estimated rows are far from actual in production, so the planner picks a nested loop. Run ANALYZE, check autovacuum, add extended statistics for correlated columns." },
      { q: "Page 5,000 of an admin list takes 8 seconds and shows duplicates.", a: "OFFSET reads and discards 250,000 rows and rows shift under inserts. Switch to keyset pagination: ORDER BY (created_at, id) with an index on it and WHERE (created_at, id) < cursor LIMIT 50.", sql: "SELECT id, ordered_at FROM orders WHERE (ordered_at, id) < ('2025-03-01 10:00:00', 11) ORDER BY ordered_at DESC, id DESC LIMIT 3;" },
      { q: "Under load the database CPU is at 15% but requests time out waiting for a connection.", a: "Connections are held too long: a transaction open across a payment API call, or a slow query with no statement_timeout. Move external calls outside transactions, add acquire and statement timeouts, and put PgBouncer in front of many instances." },
      { q: "A GraphQL page with 200 posts fires 201 queries. Two fixes?", a: "DataLoader batching (collect author ids per tick → one WHERE id = ANY($1)) or a JOIN in the posts query. Add a test asserting the query count so it cannot regress." },
    ],
  },
  {
    moduleId: "concurrency",
    overview: [
      { slug: "acid-in-practice", line: "Atomic, Consistent, Isolated, Durable: BEGIN/COMMIT makes a group of writes all-or-nothing, constraints keep the rules, the WAL fsync makes COMMIT survive crashes." },
      { slug: "isolation-levels", line: "Read Committed is a fresh snapshot per statement, Repeatable Read one per transaction, Serializable as if alone. Lost updates need an atomic UPDATE, a version column, FOR UPDATE or Serializable; write skew needs Serializable." },
      { slug: "locks-mvcc-deadlocks", line: "MVCC: readers see snapshots, writers make versions, only writers on the same row wait. Lock rows in id order, keep transactions short, retry deadlocks, SKIP LOCKED for queues." },
    ],
    rules: ["Transactions never span the network.", "Check-then-act in two statements is a race.", "Serializable means retry code.", "Long transactions block VACUUM and everyone else."],
    practical: [
      { q: "A flash sale sold 143 of 100 units although the code checked stock > 0 first.", a: "Every request read 100 under Read Committed. Collapse check and write: UPDATE products SET stock = stock − 1 WHERE id = ? AND stock ≥ 1 RETURNING stock; zero rows = sold out.", sql: "UPDATE products SET stock = stock - 1 WHERE id = 4 AND stock >= 1 RETURNING id, stock;" },
      { q: "Two workers processed the same background job.", a: "Make the claim one atomic statement with FOR UPDATE SKIP LOCKED, index (status, run_at), add a lease column for crashed workers, and make handlers idempotent." },
      { q: "Both on-call doctors signed off at the same moment and nobody is on call. Repeatable Read did not stop it. Why, and what does?", a: "Write skew: each transaction wrote a different row, so row-level conflict detection never fired. SERIALIZABLE with retries, a shared lock row for the shift, or a constraint that encodes the rule." },
      { q: "A user edits a document for 20 minutes and overwrites a colleague's changes on save.", a: "Optimistic locking: carry a version (or updated_at) and UPDATE … WHERE version = ?; zero rows means someone saved first, so show a merge prompt. A row lock cannot live across web requests.", sql: "UPDATE accounts SET owner = 'Priya N.', version = version + 1 WHERE id = 2 AND version = 1;\nSELECT changes() AS saved;" },
      { q: "Orders are charged but never created, or created but never paid. Where does the transaction go?", a: "Nowhere across the network. Record intent (order pending) in one short transaction, call the provider with the order id as idempotency key, record the result in another short transaction, and reconcile stuck orders with a job." },
    ],
  },
  {
    moduleId: "scale",
    overview: [
      { slug: "storage-internals", line: "IO is in pages; the buffer pool is the cache; WAL first, data pages later. Postgres heaps vs InnoDB clustered tables; dead tuples need VACUUM." },
      { slug: "replication-failover-backups", line: "Primary writes, replicas read via the WAL stream. Async may lose last commits; sync is safe but slower. Read your own writes from the primary. A replica is not a backup; PITR is." },
      { slug: "partitioning-and-sharding", line: "Partition for size and retention on one server; shard by tenant/user across servers only after indexes, cache, replicas, partitions and a bigger box." },
      { slug: "distributed-consistency", line: "During a partition choose C or A. Write events in the same transaction (outbox), publish later, dedupe on consume. Sagas with compensations, not 2PC. Idempotency keys everywhere." },
      { slug: "sql-vs-nosql", line: "Relational for the truth, Redis for ephemeral speed, columnar for analytics, documents when you read whole documents by key. JSONB before a second database." },
      { slug: "oltp-vs-olap", line: "OLTP is rows, keys and milliseconds; OLAP is columns, scans and seconds. Star schema: narrow facts, small dimensions. Loads must be idempotent; batch watermarks miss deletes, CDC does not. Replica, then rollups, then a warehouse." },
    ],
    rules: ["Pages touched is the cost; cache hits are everything.", "Own fresh writes → primary; everything else → replica.", "Scale order: indexes → cache → replicas → partitions → bigger box → split DBs → shard.", "At-least-once + idempotency = exactly-once effect."],
    practical: [
      { q: "A sessions table is 50 GB with 5 GB of live rows. Diagnose and fix.", a: "Bloat: dead tuples VACUUM could not reclaim, usually because of long transactions or an under-tuned autovacuum on a hot-update table. Kill idle-in-transaction sessions, tune autovacuum per table, pg_repack online, and move the hot last_seen_at column out of the wide row." },
      { q: "'I changed my avatar and it changed back' after a refresh.", a: "Replica lag. Route that user's reads to the primary for a few seconds after a write, or wait until the replica's replay position passes the write's position. Keep lists and reports on replicas." },
      { q: "Someone ran DELETE FROM orders without WHERE at 14:03. You have replicas and nightly dumps.", a: "Only point-in-time recovery helps: restore the base backup and replay WAL to 14:02. Replicas already applied the delete; the dump loses a day. Add continuous WAL archiving and test restores." },
      { q: "Order placed, card charged, confirmation email never sent (and sometimes sent twice).", a: "Dual-write. Write an outbox row in the same transaction as the order; a relay or CDC publishes it; the email consumer dedupes by event id in its own transaction." },
      { q: "Pick stores for a chat app: users and billing, messages, carts, presence, analytics.", a: "Postgres for users/billing; messages in Postgres partitioned by month until volume forces a wide-column store; carts and presence in Redis with TTLs written through at checkout; analytics via outbox/CDC into a columnar warehouse." },
    ],
  },
  {
    moduleId: "interview",
    overview: [
      { slug: "classic-hard-sql-problems", line: "Almost every hard SQL question is top-N per group, gaps and islands, running/period comparison, set difference, self-join on a rule, dedupe, pivot or recursion. Say the tie and NULL rules out loud." },
      { slug: "system-design-with-databases", line: "Access patterns first, then entities, schema, indexes, scale, consistency. Primary for truth, cache for speed, columnar for analytics, events to connect them. Shard last." },
      { slug: "postgres-vs-mysql-vs-sqlite", line: "Postgres is strict and rich, MySQL is clustered and permissive by history, SQLite is a library with one writer. Portable SQL groups by the key, uses ON CONFLICT, decides case handling explicitly, and never relies on the default isolation level." },
    ],
    rules: ["Name the pattern before writing SQL.", "Per group → PARTITION BY; consecutive → value − ROW_NUMBER; previous → LAG.", "Invariants → constraints; money → ledger; retries → idempotency keys.", "Say the trade-off with every choice."],
    practical: [
      { q: "Nth highest salary with ties.", a: "DENSE_RANK() OVER (ORDER BY salary DESC) = n in an outer query; never LIMIT/OFFSET.", sql: "WITH r AS (SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk FROM employees) SELECT name, salary FROM r WHERE rk = 3;" },
      { q: "Median salary without a MEDIAN function.", a: "ROW_NUMBER by salary plus COUNT() OVER (); keep positions (n+1)/2 and (n+2)/2 and average them.", sql: "WITH s AS (SELECT salary, ROW_NUMBER() OVER (ORDER BY salary) rn, COUNT(*) OVER () cnt FROM employees) SELECT AVG(salary) AS median FROM s WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);" },
      { q: "Design the data layer for a ride-hailing app in five sentences.", a: "Live driver locations in Redis GEO with TTLs. Rides in Postgres with guarded status transitions and an append-only ride_events table. Fares and payouts in a double-entry ledger with idempotency keys. Indexes per access pattern: rider/driver history by date, a partial index for dispatchable rides. Partition rides by month, replicas for history, outbox → warehouse for analytics; shard by city only if the primary cannot take the writes." },
      { q: "A like count read a million times a minute.", a: "Not COUNT(*) per read. Redis INCR per like, served from cache, flushed into a post_stats row; the likes table stays append-only for audit and recomputation." },
      { q: "The interviewer says '10 million users, so we shard from day one'. Respond.", a: "10M users is tens of GB; one Postgres handles it. What matters is write rate and hot queries. Size the primary, add replicas and caching, partition event tables, and keep a tenant/user key in the schema so sharding is possible later if measurements demand it." },
    ],
  },
  {
    moduleId: "security",
    overview: [
      { slug: "sql-injection-and-permissions", line: "Input glued into SQL becomes code; parameters keep it data. Identifiers and keywords come from allowlists. The app's role does only the app's job, reports read views, secrets live in the environment, passwords are bcrypt hashes, and an audit trigger records what matters." },
      { slug: "multi-tenancy-and-rls", line: "tenant_id on every table, first in every index and in composite foreign keys so rows cannot point across tenants; row-level security plus SET LOCAL per request so a forgotten WHERE returns nothing; limits, partitions and sharding by tenant for the whale." },
    ],
    rules: ["Values are parameters; identifiers are allowlists; concatenation never.", "The app connects as a role that cannot DROP, cannot read other databases, and cannot see what it does not need.", "Passwords: bcrypt/argon2, compared in code. Never SHA-256, never WHERE password = …", "No table without tenant_id; every index leads with it; every child FK carries it.", "RLS is the safety net, the explicit tenant filter is the plan; test every endpoint as the wrong tenant."],
    practical: [
      { q: "A product search concatenates the query string into SQL. Show the attack on a copy of the table and then the safe form.", a: "Concatenation lets %'; DELETE FROM …; -- end the string, add a statement and comment out the rest. The safe form binds the value: LIKE '%' || :q || '%' with :q as a parameter, so the same text matches nothing and runs nothing.", sql: "CREATE TABLE IF NOT EXISTS demo_products AS SELECT * FROM products;\nSELECT name FROM demo_products WHERE name LIKE '%%'; DELETE FROM demo_products; --%';\nSELECT (SELECT COUNT(*) FROM demo_products) AS copy_after_attack, (SELECT COUNT(*) FROM products WHERE name LIKE '%' || '%''; DELETE FROM products; --' || '%') AS matches_as_value, (SELECT COUNT(*) FROM products) AS products_intact;" },
      { q: "The UI sends ?sort=price&dir=desc. How do you sort safely when ORDER BY cannot take a parameter?", a: "An allowlist: a map from accepted inputs to SQL fragments you wrote (price → price, desc → DESC), default or reject anything else, and bind LIMIT as a validated number. Never interpolate the raw query-string value." },
      { q: "Design the database roles for an API, a reporting dashboard and the migration job.", a: "app: SELECT/INSERT/UPDATE/DELETE on app tables, no DDL, statement_timeout. reporting: SELECT on views that hide PII, ideally on a replica. migrator: owns the schema, runs from one place only. Humans: superuser through a bastion with MFA, never in an environment variable." },
      { q: "A line item for tenant A points at tenant B's invoice and the foreign key is satisfied. Fix the schema.", a: "Composite keys: invoices PRIMARY KEY (tenant_id, id); invoice_lines carries tenant_id and FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id). The cross-tenant row is refused by the database.", sql: "CREATE TABLE IF NOT EXISTS tenants (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS invoices (tenant_id INTEGER NOT NULL REFERENCES tenants(id), id INTEGER NOT NULL, amount REAL NOT NULL, PRIMARY KEY (tenant_id, id));\nCREATE TABLE IF NOT EXISTS invoice_lines (tenant_id INTEGER NOT NULL, id INTEGER NOT NULL, invoice_id INTEGER NOT NULL, amount REAL NOT NULL, PRIMARY KEY (tenant_id, id), FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id));\nINSERT OR IGNORE INTO tenants VALUES (1, 'Acme'), (2, 'Globex');\nINSERT OR IGNORE INTO invoices VALUES (1, 481, 100), (2, 482, 999);\nINSERT INTO invoice_lines VALUES (1, 1, 482, 60);  -- refused: Acme line on Globex invoice", fails: true },
      { q: "With RLS enabled, a developer writes SELECT * FROM invoices WHERE id = 482 for tenant 1. What comes back, and what must the app have done first?", a: "Nothing comes back, because the policy adds tenant_id = current tenant to every statement. The app must have run SET LOCAL app.tenant = '1' inside the request's transaction, from the verified session, and must connect as a role that does not own the table (owners bypass RLS unless FORCE is set).", sql: "CREATE TABLE IF NOT EXISTS tenants (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS invoices (tenant_id INTEGER NOT NULL REFERENCES tenants(id), id INTEGER NOT NULL, amount REAL NOT NULL, PRIMARY KEY (tenant_id, id));\nINSERT OR IGNORE INTO tenants VALUES (1, 'Acme'), (2, 'Globex');\nINSERT OR IGNORE INTO invoices VALUES (1, 481, 100), (2, 482, 999);\nCREATE TABLE IF NOT EXISTS session_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);\nINSERT OR REPLACE INTO session_settings VALUES ('tenant', '1');\nCREATE VIEW IF NOT EXISTS my_invoices AS SELECT i.* FROM invoices i WHERE i.tenant_id = (SELECT CAST(value AS INTEGER) FROM session_settings WHERE key = 'tenant');\nSELECT COUNT(*) AS rows_for_482 FROM my_invoices WHERE id = 482;" },
    ],
  },
  {
    moduleId: "guided",
    overview: [
      { slug: "wallet-transfers-step-by-step", line: "A transaction makes the deduction and the credit all-or-nothing; a conditional UPDATE or a row lock stops two requests spending the same ₹800; an idempotency key stops the same transfer twice." },
      { slug: "the-report-that-doubled", line: "A join produces one row per matching pair, so two one-to-many tables multiply each other. Pre-aggregate each child per parent, then join; DISTINCT only hides it." },
      { slug: "indexes-from-zero", line: "Without an index a lookup reads every page; an index finds a value in a few reads at any size. Equality columns first, then the sort column; functions and common values defeat it." },
    ],
    rules: ["Transaction = all or nothing. It does not check amounts.", "Check-then-write in two steps is a race; put the check inside the write or lock first.", "Count rows per parent before you trust a SUM after a join.", "EXPLAIN first; a scan with a selective filter is your index."],
    practical: [
      { q: "Rahul has ₹1,000 and double-clicks Transfer ₹800. Describe the three protections a correct system has.", a: "A conditional UPDATE (WHERE balance >= 800) so the second deduction updates zero rows; one transaction around deduction and credit so a crash cannot half-apply it; an idempotency key per transfer so the second click finds the first and does nothing.", sql: "UPDATE accounts SET balance = balance - 800 WHERE id = 3 AND balance >= 800;\nSELECT changes() AS first_click;\nUPDATE accounts SET balance = balance - 800 WHERE id = 3 AND balance >= 800;\nSELECT changes() AS second_click, (SELECT balance FROM accounts WHERE id = 3) AS liam_balance;" },
      { q: "Order 11 has 2 items and 1 payment. A report joins both and shows items 1,556 instead of 778. Explain and fix in one query.", a: "The join paired each item with the payment; with a second payment row it would double. Aggregate items and payments per order in CTEs, then join.", sql: "WITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items WHERE order_id = 11 GROUP BY order_id),\n     pays  AS (SELECT order_id, SUM(amount) AS paid FROM payments WHERE order_id = 11 GROUP BY order_id)\nSELECT items.order_id, items.items_total, pays.paid FROM items LEFT JOIN pays ON pays.order_id = items.order_id;" },
      { q: "The login lookup by email takes 2 seconds at a million customers. What do you run first, and what do you expect to see?", a: "EXPLAIN on the lookup. Expect a sequential scan with a selective filter. Create an index on email and EXPLAIN again: scan becomes an index seek, and the query returns to milliseconds.", sql: "EXPLAIN QUERY PLAN SELECT id FROM customers WHERE email = 'priya@example.com';\nCREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);\nEXPLAIN QUERY PLAN SELECT id FROM customers WHERE email = 'priya@example.com';" },
      { q: "With SELECT … FOR UPDATE, a colleague reads the balance, then locks, then updates. Is the transfer safe?", a: "No. The decision was made on a read taken before the lock, so two requests can both decide on ₹1,000. Lock first, then read inside the lock, then decide and update." },
    ],
  },
];
