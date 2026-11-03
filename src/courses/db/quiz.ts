// Quick checks per topic: one tap, instant feedback. Keep the correct option position varied.
import type { Quiz } from "../types";

export const QUIZ: Record<string, Quiz[]> = {
  "what-is-a-database": [
    { q: "Two requests update the same row at the same moment. What does a database promise that a JSON file cannot?", options: ["Both changes are kept, in order", "The last writer always wins", "The file is locked for an hour", "Nothing; it is the same"], answer: 0, why: "Concurrency control serialises the writes, so neither change is silently lost." },
    { q: "SQL is called declarative because…", options: ["it declares variables first", "you describe the result and the planner picks the steps", "it runs line by line like a script", "it needs a compiler"], answer: 1, why: "You say WHAT; the planner decides HOW, which is why adding an index speeds up unchanged queries." },
    { q: "Which store should be the default source of truth for a new app?", options: ["Redis", "Elasticsearch", "A relational database like Postgres", "A CSV in S3"], answer: 2, why: "Relational databases give joins, constraints and transactions; other stores are added for measured needs." },
  ],
  "tables-keys-relationships": [
    { q: "Where does the foreign key live in a one-to-many relationship (customer → orders)?", options: ["On the customer row", "On each order row", "In a separate link table", "On both"], answer: 1, why: "The 'many' side (orders) stores customer_id; the 'one' side stores nothing." },
    { q: "What does NULL = NULL evaluate to?", options: ["TRUE", "FALSE", "UNKNOWN", "an error"], answer: 2, why: "NULL means unknown, and comparing unknowns is unknown. Use IS NULL." },
    { q: "Best way to model 'products have many tags, tags belong to many products'?", options: ["A tags column with comma-separated text", "A join table with (product_id, tag_id) as primary key", "A tags column on products and a products column on tags", "A JSON array on each tag"], answer: 1, why: "Many-to-many needs a third table with one row per pair; the composite key blocks duplicates." },
  ],
  "data-types-and-constraints": [
    { q: "Which type should a money column use?", options: ["FLOAT", "DOUBLE", "NUMERIC / DECIMAL", "TEXT"], answer: 2, why: "Floats cannot represent 0.1 exactly; NUMERIC stores exact decimals." },
    { q: "A cron job writes bad data that the API would have rejected. What would have stopped it?", options: ["A faster API", "A CHECK or NOT NULL constraint in the database", "Better logging", "A unit test on the API"], answer: 1, why: "Only database constraints apply to every writer, not just one code path." },
    { q: "Which column type for 'the moment a payment happened' in Postgres?", options: ["timestamp (no zone)", "date", "timestamptz", "text"], answer: 2, why: "timestamptz stores an instant in UTC and converts for display; plain timestamp has no idea where 09:00 was." },
  ],
  "select-filter-sort": [
    { q: "In which clause can you use an alias defined in SELECT?", options: ["WHERE", "GROUP BY (everywhere)", "ORDER BY", "FROM"], answer: 2, why: "SELECT runs after WHERE and GROUP BY but before ORDER BY, so only ORDER BY sees the alias." },
    { q: "Which LIKE pattern can use a normal B-tree index?", options: ["'%son'", "'%son%'", "'Mehta%'", "none of them"], answer: 2, why: "A known prefix keeps the sorted order useful; a leading % does not." },
    { q: "The safe way to put user input into a query is…", options: ["escape quotes by hand", "parameters like $1 or ?", "wrap it in LOWER()", "Base64 encode it"], answer: 1, why: "Parameters travel separately from SQL text and are never parsed as code." },
  ],
  "aggregates-group-by": [
    { q: "COUNT(manager_id) on employees returns 9 while COUNT(*) returns 10. Why?", options: ["One row is a duplicate", "COUNT(column) skips NULLs; the CEO has no manager", "COUNT(*) counts columns", "A rounding error"], answer: 1, why: "Column aggregates ignore NULL values." },
    { q: "You want customers with more than 3 orders. Where does the condition go?", options: ["WHERE COUNT(*) > 3", "HAVING COUNT(*) > 3", "ORDER BY COUNT(*) > 3", "SELECT COUNT(*) > 3"], answer: 1, why: "HAVING filters groups after aggregation; WHERE runs before groups exist." },
    { q: "Months with no sales vanish from a GROUP BY report. The fix is…", options: ["COALESCE on the month", "build a calendar of months and LEFT JOIN the sales onto it", "use RIGHT JOIN", "use DISTINCT"], answer: 1, why: "GROUP BY cannot invent groups for rows that do not exist; the calendar must drive the query." },
  ],
  joins: [
    { q: "You want every customer and the count of their PAID orders. Where does status = 'paid' go?", options: ["In WHERE", "In the ON clause", "In HAVING", "In SELECT"], answer: 1, why: "A filter in WHERE drops customers whose padded NULL status fails the test; ON keeps them with 0." },
    { q: "SUMs doubled after adding a second one-to-many join. What happened?", options: ["The index broke", "Fan-out: each item row paired with each payment row", "NULLs were counted", "The database cached old data"], answer: 1, why: "Two 1:N children multiply rows; pre-aggregate each child first." },
    { q: "Which is the NULL-safe way to find customers with no orders?", options: ["WHERE id NOT IN (SELECT customer_id FROM orders)", "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)", "WHERE orders IS NULL", "INNER JOIN with COUNT = 0"], answer: 1, why: "NOT IN returns nothing if the list contains a NULL; NOT EXISTS checks row by row." },
  ],
  "subqueries-ctes": [
    { q: "A subquery that references the outer row is called…", options: ["scalar", "correlated", "recursive", "lateral"], answer: 1, why: "It runs conceptually once per outer row, which can be slow on big tables." },
    { q: "What ends a recursive CTE?", options: ["A LIMIT on the anchor", "The recursive step returning no rows", "COMMIT", "It ends after 100 levels automatically"], answer: 1, why: "Each level feeds the next; when the step produces nothing, the loop stops. Always include a stop condition." },
    { q: "Since Postgres 12, a CTE referenced once is…", options: ["always materialised", "inlined like a subquery", "cached on disk", "run on a replica"], answer: 1, why: "Inlining lets the planner push filters inside; AS MATERIALIZED forces the old behaviour." },
  ],
  "window-functions": [
    { q: "Scores 90, 90, 80. What does DENSE_RANK give the 80?", options: ["1", "2", "3", "NULL"], answer: 1, why: "DENSE_RANK shares rank 1 for the tie and does not skip, so the 80 is rank 2 (RANK would say 3)." },
    { q: "Where must the filter WHERE rn = 1 go for a top-1-per-group query?", options: ["Next to the window function", "In HAVING", "In an outer query or CTE", "In the window's ORDER BY"], answer: 2, why: "WHERE runs before window functions are computed." },
    { q: "Which trick finds runs of consecutive days?", options: ["COUNT(*) >= 3", "day minus ROW_NUMBER is constant inside a run", "LAG(day) = day", "MAX(day) - MIN(day)"], answer: 1, why: "Gaps and islands: subtract the row number from the sequence value and group by the difference." },
  ],
  "writing-data": [
    { q: "The cleanest way to 'insert or update' in one atomic statement?", options: ["SELECT then INSERT or UPDATE", "INSERT ... ON CONFLICT DO UPDATE", "DELETE then INSERT", "UPDATE then INSERT if 0 rows"], answer: 1, why: "An upsert needs a unique key and is atomic, which makes retries safe." },
    { q: "What does ROLLBACK do?", options: ["Undoes the last statement only", "Undoes everything since BEGIN", "Deletes the table", "Reverts the last COMMIT"], answer: 1, why: "Everything inside the transaction is discarded; committed work cannot be rolled back." },
    { q: "Inserting 100,000 rows fastest?", options: ["One INSERT per row in a loop", "Multi-row INSERT batches or COPY", "An UPDATE with a CASE", "A trigger"], answer: 1, why: "Each single statement pays a round trip and a commit; batches pay once per thousand rows." },
  ],
  normalization: [
    { q: "The customer's city appears on every order row. If the customer moves, what goes wrong?", options: ["Nothing", "Update anomaly: some rows change, others keep the old city", "The orders are deleted", "The index is rebuilt"], answer: 1, why: "One fact in many places drifts; keep the city once in customers." },
    { q: "Which is a deliberate, correct denormalisation?", options: ["Storing product price on order_items", "Storing customer city on orders", "Storing tags as a comma list", "Storing the department name on employees"], answer: 0, why: "The agreed price is a historical fact that must not change when the catalogue does." },
    { q: "'Every non-key column depends on the key, the whole key, and nothing but the key' describes…", options: ["1NF", "2NF", "3NF", "a unique index"], answer: 2, why: "That sentence is the classic summary of third normal form." },
  ],
  "real-world-schema-patterns": [
    { q: "Soft delete added deleted_at. A deleted user cannot re-register with their email. Fix?", options: ["Drop the unique constraint", "Partial unique index WHERE deleted_at IS NULL", "Store emails in lower case", "Delete the row for real"], answer: 1, why: "Uniqueness should apply to live rows only." },
    { q: "Postgres tool that makes overlapping bookings impossible at the database level?", options: ["A trigger", "An exclusion constraint with a range type", "A CHECK on ends_at > starts_at", "A unique index on room_id"], answer: 1, why: "EXCLUDE USING gist (room_id WITH =, daterange(...) WITH &&) refuses the second overlapping insert." },
    { q: "In shared-table multi-tenancy, every hot index should…", options: ["end with tenant_id", "start with tenant_id", "exclude tenant_id", "be unique"], answer: 1, why: "Leading with tenant_id makes each tenant's queries a tight index range." },
  ],
  "ids-and-migrations": [
    { q: "Renaming a column with zero downtime starts with…", options: ["RENAME COLUMN", "adding the new column and dual-writing", "dropping the old column", "a maintenance window"], answer: 1, why: "Expand first so old and new code both work; contract last." },
    { q: "Which index creation does not block writes in Postgres?", options: ["CREATE INDEX", "CREATE INDEX CONCURRENTLY", "CREATE UNIQUE INDEX", "REINDEX"], answer: 1, why: "CONCURRENTLY builds without a write lock at the cost of time and a second scan." },
    { q: "Best primary key for ids generated by clients across regions?", options: ["serial integer", "random UUID v4", "UUID v7 / ULID (time-ordered)", "email address"], answer: 2, why: "Time-ordered UUIDs are globally unique and keep B-tree locality." },
  ],
  indexes: [
    { q: "Query: WHERE status = 'paid' AND ordered_at > ? ORDER BY ordered_at. Best index?", options: ["(ordered_at, status)", "(status, ordered_at)", "(status) and (ordered_at) separately", "(ordered_at)"], answer: 1, why: "Equality column first, then the range/sort column; the index then delivers sorted rows." },
    { q: "Index on (last_name, first_name). Which query cannot use it?", options: ["WHERE last_name = 'Mehta'", "WHERE last_name = 'Mehta' AND first_name = 'Priya'", "WHERE first_name = 'Priya'", "ORDER BY last_name, first_name"], answer: 2, why: "The leftmost prefix is missing; first names are scattered through the index." },
    { q: "Why does an index on LOWER(email) matter when queries use LOWER(email) = ?", options: ["It does not; the plain index works", "A normal index stores email, not LOWER(email), so it is unusable", "Indexes are case-insensitive anyway", "LOWER is faster than UPPER"], answer: 1, why: "A function on the column hides it from a plain index; an expression index matches the query." },
  ],
  "reading-query-plans": [
    { q: "What does EXPLAIN ANALYZE add over EXPLAIN?", options: ["Prettier output", "Real execution with actual times and row counts", "Index suggestions", "A query rewrite"], answer: 1, why: "It runs the query, which is why you wrap writes in BEGIN ... ROLLBACK." },
    { q: "A node shows actual time 0.3 ms with loops=50000. Real cost?", options: ["0.3 ms", "about 15 seconds", "50 ms", "cannot tell"], answer: 1, why: "Per-loop time multiplied by loops: the inner side of a nested loop ran 50,000 times." },
    { q: "'Rows Removed by Filter: 180000' on a Seq Scan suggests…", options: ["add an index on the filtered column", "add more RAM", "use DISTINCT", "the query is fine"], answer: 0, why: "The scan read 180k rows it did not need; a matching index reads only the matches." },
  ],
  "query-antipatterns": [
    { q: "100 orders, then one customer query per order. Name and fix?", options: ["Deadlock; add retries", "N+1; join or batch with IN / DataLoader", "Fan-out; add DISTINCT", "Bloat; run VACUUM"], answer: 1, why: "Queries per request must not grow with list size." },
    { q: "LIMIT 20 OFFSET 100000 is slow because…", options: ["LIMIT is slow", "the database reads and discards 100,000 rows first", "OFFSET disables indexes", "it sorts twice"], answer: 1, why: "Keyset pagination seeks straight to the cursor instead." },
    { q: "WHERE YEAR(created_at) = 2025 is slow. Sargable rewrite?", options: ["WHERE created_at LIKE '2025%'", "WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'", "WHERE EXTRACT(year FROM created_at) = 2025", "add an index on YEAR"], answer: 1, why: "A bare column compared with constants lets the index do a range seek." },
  ],
  "pooling-caching-app-layer": [
    { q: "The database is idle but requests wait for connections. Likely cause?", options: ["Too few CPU cores", "Connections held across slow external calls", "Missing indexes", "Replication lag"], answer: 1, why: "A transaction open across an HTTP call starves the pool; keep transactions to database work only." },
    { q: "On a write, what should you do with the cached copy?", options: ["Update it with the new value", "Delete the key", "Leave it until TTL", "Double its TTL"], answer: 1, why: "Invalidate-on-write avoids races where two writers leave stale data in the cache." },
    { q: "A sensible per-instance pool size for Postgres is usually…", options: ["1", "10–20", "200", "max_connections"], answer: 1, why: "Beyond roughly cores × 2, extra connections just compete; use PgBouncer for many instances." },
  ],
  "acid-in-practice": [
    { q: "A crash after the first UPDATE of a transfer. With a transaction, what is on disk after recovery?", options: ["Half the transfer", "Nothing from the transaction", "Both updates", "Random bytes"], answer: 1, why: "Atomicity: uncommitted work is rolled back using the WAL." },
    { q: "Which ACID property is mostly YOUR job through constraints and logic?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], answer: 1, why: "The database enforces declared constraints; business invariants must be checked inside the transaction." },
    { q: "COMMIT returns only after…", options: ["data pages are written", "the WAL record is fsynced", "the cache is cleared", "replicas apply it (always)"], answer: 1, why: "Durability comes from the write-ahead log; data pages follow at checkpoint time." },
  ],
  "isolation-levels": [
    { q: "Two transactions read balance 500, both write new values, 100 vanishes. This is…", options: ["a dirty read", "a phantom read", "a lost update", "write skew"], answer: 2, why: "Fix with an atomic UPDATE, a version column, FOR UPDATE or serializable." },
    { q: "Which level is Postgres's default?", options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], answer: 1, why: "MySQL InnoDB defaults to REPEATABLE READ instead." },
    { q: "Both on-call doctors sign off after each checks 'two on call'. Only this prevents it:", options: ["READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE (or an explicit shared lock)", "a longer transaction"], answer: 2, why: "Write skew touches different rows, so row-level checks never fire." },
  ],
  "locks-mvcc-deadlocks": [
    { q: "Under MVCC, who waits for whom?", options: ["Readers wait for writers", "Writers wait for readers", "Only writers on the same row wait for each other", "Everyone waits"], answer: 2, why: "Readers see snapshots; row versions let reads and writes proceed together." },
    { q: "A 20-minute document edit across web requests needs…", options: ["SELECT FOR UPDATE", "an optimistic version column checked on save", "a table lock", "SERIALIZABLE"], answer: 1, why: "Locks cannot live across HTTP requests; versions can." },
    { q: "The DB reports a deadlock. Your code should…", options: ["ignore it", "retry the whole transaction with backoff", "increase the timeout", "switch to NoSQL"], answer: 1, why: "The database kills one victim; only the app can redo the work, and ordering locks by id prevents most deadlocks." },
  ],
  "storage-internals": [
    { q: "The cost of a query is best measured in…", options: ["rows returned", "pages touched", "characters of SQL", "number of joins"], answer: 1, why: "Disk and cache work in fixed-size pages; fewer pages = faster." },
    { q: "After deleting 100 GB of rows, the Postgres table is still 100 GB. Why?", options: ["The delete failed", "Dead tuples wait for VACUUM; space is reused, not returned", "Indexes hold the data", "WAL stores it"], answer: 1, why: "VACUUM marks space reusable; VACUUM FULL or pg_repack returns it to the OS." },
    { q: "Random UUID primary keys hurt most on…", options: ["Postgres heaps", "InnoDB clustered tables", "SQLite", "all equally"], answer: 1, why: "InnoDB stores the table in PK order, so random keys split pages everywhere." },
  ],
  "replication-failover-backups": [
    { q: "User saves, refreshes, sees old data. Cause?", options: ["Browser cache", "Replica lag on the read", "A deadlock", "WAL corruption"], answer: 1, why: "Read-your-writes: route that user's reads to the primary briefly after a write." },
    { q: "Which lets you undo an accidental DELETE from 14:03?", options: ["A replica", "Point-in-time recovery to 14:02", "RAID", "A bigger disk"], answer: 1, why: "Replicas replicate the mistake; PITR replays WAL up to a chosen moment." },
    { q: "Synchronous replication means COMMIT waits for…", options: ["the client", "a replica to have the WAL record", "a checkpoint", "autovacuum"], answer: 1, why: "That gives RPO zero at the cost of commit latency." },
  ],
  "partitioning-and-sharding": [
    { q: "Partitioning orders by month mainly helps…", options: ["every query", "queries filtering by date, retention and maintenance", "write throughput across servers", "joins"], answer: 1, why: "Pruning skips partitions; DROP PARTITION is instant; VACUUM works per piece." },
    { q: "A good shard key is…", options: ["country", "tenant_id or user_id that appears in nearly every query", "created_at", "a random number"], answer: 1, why: "It must spread load and keep a request on one shard." },
    { q: "Before sharding you should first try…", options: ["nothing, shard early", "indexes, caching, replicas, partitioning, a bigger box", "a different language", "removing foreign keys"], answer: 1, why: "Sharding removes cross-shard joins and transactions; it is the last step." },
  ],
  "distributed-consistency": [
    { q: "Write to Postgres, then publish to Kafka. The publish fails after COMMIT. This is…", options: ["fine", "the dual-write problem: a lost event", "a deadlock", "a phantom read"], answer: 1, why: "The outbox pattern writes the event in the same transaction and publishes later." },
    { q: "A consumer may receive the same message twice. The fix is…", options: ["exactly-once delivery", "idempotent processing keyed by event id", "a bigger queue", "ordering"], answer: 1, why: "Delivery is at-least-once; a dedupe table in the same transaction makes duplicates harmless." },
    { q: "During a network partition, a CP system…", options: ["serves stale data", "refuses requests it cannot confirm", "loses data", "switches to AP"], answer: 1, why: "It keeps consistency by giving up availability on the cut-off side." },
  ],
  "sql-vs-nosql": [
    { q: "Comments on a viral post: embed in the post document or reference?", options: ["Embed", "Reference a separate collection", "Store in Redis", "Both"], answer: 1, why: "Unbounded, independently growing children are referenced (16 MB document limit)." },
    { q: "Best store for a per-user rate limit counter?", options: ["Postgres row", "Redis INCR with a TTL", "MongoDB document", "Elasticsearch"], answer: 1, why: "Atomic in-memory increments with expiry are exactly Redis's strength." },
    { q: "'We need flexible attributes per product.' Cheapest first move?", options: ["Add MongoDB", "A JSONB column with a GIN index in Postgres", "Add 50 nullable columns", "Switch to Cassandra"], answer: 1, why: "JSONB gives schemaless fields inside a relational row without a second database." },
  ],
  "classic-hard-sql-problems": [
    { q: "'Second highest salary' that handles ties correctly uses…", options: ["LIMIT 1 OFFSET 1", "DENSE_RANK() = 2", "MAX(salary) - 1", "ORDER BY salary LIMIT 2"], answer: 1, why: "DENSE_RANK gives one rank per distinct value and returns everyone at that level." },
    { q: "Interval overlap test for bookings A and B?", options: ["A.start = B.start", "A.start < B.end AND B.start < A.end", "A.end < B.start", "A.start BETWEEN B.start AND B.end"], answer: 1, why: "Two conditions cover every overlapping case with half-open intervals." },
    { q: "'Bought in January but not February' is best expressed with…", options: ["two INNER JOINs", "a semi-join for January and NOT EXISTS for February", "GROUP BY month", "a CROSS JOIN"], answer: 1, why: "Set difference = exists one, not the other." },
  ],
  "system-design-with-databases": [
    { q: "First thing to establish in a data-layer design answer?", options: ["Table names", "The real access patterns and their rates", "The cloud provider", "Shard count"], answer: 1, why: "Schema, indexes and scaling all follow from the queries the product actually runs." },
    { q: "A like count read a million times a minute should come from…", options: ["COUNT(*) on likes", "a Redis counter flushed to a stats row", "a replica COUNT(*)", "the likes table with an index"], answer: 1, why: "Counting on every read is the anti-pattern; a counter serves reads and the table stays the truth." },
    { q: "Live driver locations in a ride app belong in…", options: ["Postgres rides table", "Redis GEO with short TTLs", "a data warehouse", "Elasticsearch"], answer: 1, why: "High-churn, lossy, geo-queried data fits an in-memory structure." },
  ],
  "wallet-transfers-step-by-step": [
    {
      setup: "Rahul has ₹1,000. Two requests arrive at the same moment and each runs:\n\n`UPDATE accounts SET balance = balance - 800 WHERE id = 1 AND balance >= 800;`\n\nAssume Postgres at its usual READ COMMITTED level, and both statements execute without error.",
      q: "What happens?",
      options: ["Both requests succeed and Rahul's balance becomes −₹600.", "One request succeeds, the other updates zero rows, and the balance becomes ₹200.", "Both requests wait forever because they update the same row.", "The database creates two copies of Rahul's account."],
      answer: 1,
      reason: true,
      why: "The two updates to the same row are serialised. The second waits for the first, then re-checks balance >= 800 against the new value ₹200, finds it false, and updates zero rows.",
      whyOptions: [
        "That is what the read-then-write code did. A conditional UPDATE re-evaluates `balance >= 800` after the first update commits, so the second sees ₹200 and changes nothing.",
        "Exactly. The row lock serialises the two updates; the second re-checks the condition against ₹200 and updates zero rows. The app sees rowCount 0 and rejects the second transfer.",
        "The second request waits only until the first commits (milliseconds), then proceeds. A deadlock needs two rows locked in opposite orders; here there is one row.",
        "Databases never duplicate rows to resolve a conflict; they serialise writers on the row.",
      ],
    },
    {
      setup: "Request A: `BEGIN; SELECT balance FROM wallet WHERE id = 1;` (no lock) … app checks ₹1,000 is enough … `SELECT … FOR UPDATE;` … `UPDATE … - 800; COMMIT;`\n\nRequest B does the same at the same time.",
      q: "Does this FOR UPDATE version prevent the double deduction?",
      options: ["Yes: FOR UPDATE always prevents races on that row.", "No: the balance was read and checked before the lock, so both requests decided on the stale ₹1,000.", "No: FOR UPDATE only works inside SERIALIZABLE.", "Yes, as long as both requests use the same connection pool."],
      answer: 1,
      reason: true,
      why: "The lock protects only what happens after it is taken. Both requests read ₹1,000 before locking, so both decide to deduct. Read the balance after FOR UPDATE.",
      whyOptions: [
        "FOR UPDATE protects what happens after the lock. Here the decision was made before it, on a stale read.",
        "Right. Lock first, then read inside the lock, then decide. Otherwise the original race is back.",
        "FOR UPDATE works at every isolation level; the problem is the order of read and lock, not the level.",
        "Connection pools have nothing to do with row locks; each request has its own transaction.",
      ],
    },
    {
      setup: "The app commits the deduction in one transaction, then calls the payment provider, then credits Aman in a second transaction. The server crashes right after the provider call.",
      q: "What is true afterwards?",
      options: ["The deduction is rolled back automatically because the credit never ran.", "The deduction is permanent; Aman has nothing; the app needs a recovery or reconciliation step.", "Both updates are lost; nothing changed.", "The database retries the credit on its own when it restarts."],
      answer: 1,
      reason: true,
      why: "A committed transaction is permanent. Only uncommitted work is rolled back on a crash. That is why the deduction and the credit must share one transaction, and why anything across the network needs idempotency keys and reconciliation.",
      whyOptions: [
        "Rollback only applies to uncommitted work. The deduction committed, so it stays.",
        "Correct. Committed means durable. The fix is one transaction for both updates, with the external call outside it and a reconciliation job for the gaps.",
        "The deduction committed, so it is on disk and survives the crash.",
        "Databases never re-run application logic; recovery is the application's job.",
      ],
    },
  ],
  "the-report-that-doubled": [
    {
      setup: "Order 7 has 3 item rows and 2 payment rows.",
      q: "How many rows does `FROM orders o JOIN order_items i ON … JOIN payments p ON …` produce for order 7?",
      options: ["3", "5", "6", "1"],
      answer: 2,
      reason: true,
      why: "Each item pairs with each payment: 3 × 2 = 6 rows. SUM over them counts every item twice and every payment three times.",
      whyOptions: ["That is the item count. The join pairs each item with each payment, so it is 3 × 2.", "Rows are multiplied, not added: 3 × 2.", "Right: every item row pairs with every payment row, 3 × 2 = 6.", "A join never collapses rows; it pairs them."],
    },
    {
      q: "Which fix is correct for 'items total and payments total per order'?",
      options: ["Add DISTINCT to the SELECT.", "Use SUM(DISTINCT amount) on both columns.", "Aggregate items per order and payments per order in two CTEs, then join those to orders.", "Join payments with a LEFT JOIN instead of an INNER JOIN."],
      answer: 2,
      reason: true,
      why: "Collapse each child to one row per order first; then there is nothing left to multiply. DISTINCT variants hide or break; the join type does not change the pairing.",
      whyOptions: ["DISTINCT runs on output rows after the SUMs are already wrong.", "SUM(DISTINCT) merges real items that share a price; it works by accident on this order only.", "Correct: one row per order on each side means the join cannot fan out.", "LEFT vs INNER changes which orders appear, not how many pairs each order produces."],
    },
    {
      q: "Which quick check tells you a report query is fanning out before you trust its SUMs?",
      options: ["EXPLAIN ANALYZE", "COUNT(*) per parent in the joined set, compared with the number of children", "Adding an index on the join column", "Running it twice and comparing results"],
      answer: 1,
      reason: false,
      why: "If a parent shows more joined rows than it has children on one side, a one-to-many join is multiplying. Plans and indexes say nothing about correctness.",
      whyOptions: ["EXPLAIN shows cost, not correctness; a fan-out can be fast and wrong.", "Yes: row count per parent exposes the multiplication directly.", "Indexes change speed, not the number of rows a join produces.", "A wrong query is consistently wrong; repeating it proves nothing."],
    },
  ],
  "indexes-from-zero": [
    {
      setup: "customers has 1,000,000 rows in 12,500 pages. There is an index on email.",
      q: "Roughly how many pages does `WHERE email = ?` read now?",
      options: ["12,500", "About 4: a few index pages plus one table page", "1,000,000", "Half the table on average"],
      answer: 1,
      reason: true,
      why: "The B-tree index finds the entry in 3 or 4 page reads at any table size, then one table page holds the row.",
      whyOptions: ["That is the scan without an index.", "Correct: root, branch, leaf, then the row's page.", "Pages are read, not rows, and the index avoids almost all of them.", "A scan without an index reads all pages to be sure; with the index there is no scan."],
    },
    {
      q: "Query: `WHERE customer_id = 1 ORDER BY ordered_at DESC`. Which index removes the sort step?",
      options: ["(ordered_at, customer_id)", "(customer_id, ordered_at)", "(customer_id) and (ordered_at) as two separate indexes", "(ordered_at)"],
      answer: 1,
      reason: true,
      why: "Equality column first, then the sort column: the index seeks to customer 1 and delivers that customer's rows already in date order.",
      whyOptions: ["Sorted by date first, customer 1's rows are scattered; everything must be read and filtered.", "Right: seek to customer 1, read in order, no sort.", "The planner can use one of them, not both for one scan; a sort or a filter remains.", "It delivers date order for all customers, then filters; most rows are wasted."],
    },
    {
      q: "You add an index on orders(status) but `WHERE status = 'paid'` is still a scan. Most likely reason?",
      options: ["Indexes do not work on text columns.", "'paid' matches most rows, so a scan is cheaper than reading most of the table through the index.", "The index needs a REINDEX first.", "You must also index the primary key."],
      answer: 1,
      reason: true,
      why: "Selectivity. Reading 95% of the table through an index means random page reads; the planner correctly prefers the sequential scan. A partial index for the rare value is the right shape.",
      whyOptions: ["Text columns index fine; it is the value distribution that matters.", "Correct: low selectivity makes the scan the better plan.", "A fresh index is immediately usable; REINDEX is for bloat.", "The primary key always has an index; it is unrelated to this filter."],
    },
  ],
};
