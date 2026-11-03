// Every SQL construct and database word the course uses, each with a plain explanation and the topic
// that teaches it properly. When a page uses a term BEFORE its teaching topic, the page shows the
// explanation first (components/TermHelp.tsx), so no word appears without being explained.

export type Term = {
  id: string;
  /** How the term is shown in the help box. */
  label: string;
  /** Matches the term in SQL or prose. Case-insensitive. */
  match: RegExp;
  /** What it is and why it is used, in plain words. Markdown inline (`code`, **bold**) allowed. */
  plain: string;
  /** The topic slug where it is taught in depth. */
  taughtIn: string;
};

const T = (id: string, label: string, match: RegExp, taughtIn: string, plain: string): Term => ({ id, label, match, taughtIn, plain });

export const TERMS: Term[] = [
  // ---- reading rows ----
  T("select", "SELECT … FROM", /\bSELECT\b[\s\S]{0,200}?\bFROM\b/i, "select-filter-sort", "`SELECT columns FROM table` asks for rows. SELECT lists what you want to see; FROM says which table. `SELECT *` means every column."),
  T("where", "WHERE", /\bWHERE\b/i, "select-filter-sort", "`WHERE condition` keeps only the rows for which the condition is true. Everything else is dropped before anything else happens."),
  T("order-by", "ORDER BY", /\bORDER\s+BY\b/i, "select-filter-sort", "`ORDER BY column` sorts the result; add `DESC` for largest first. Without it the order is whatever the database found convenient."),
  T("limit", "LIMIT / OFFSET", /\bLIMIT\b|\bOFFSET\b/i, "select-filter-sort", "`LIMIT n` returns at most n rows; `OFFSET m` skips the first m. Together they page through a result."),
  T("distinct", "DISTINCT", /\bDISTINCT\b/i, "select-filter-sort", "`SELECT DISTINCT col` removes duplicate values so each appears once."),
  T("like", "LIKE", /\bLIKE\b/i, "select-filter-sort", "`LIKE 'pattern'` matches text: `%` stands for any characters, `_` for one. `'Desk%'` means 'starts with Desk'."),
  T("in", "IN (…)", /\bIN\s*\((?!\s*SELECT)/i, "select-filter-sort", "`x IN (a, b, c)` is true when x equals any of the listed values; shorter than three ORs."),
  T("between", "BETWEEN", /\bBETWEEN\b/i, "select-filter-sort", "`x BETWEEN a AND b` means a ≤ x ≤ b, both ends included."),
  T("alias", "alias (AS name)", /\balias(es)?\b/i, "select-filter-sort", "`expression AS name` gives a column (or table) a short name to show in the result or use later in the query."),
  T("null", "NULL / IS NULL", /\bNULL\b/i, "tables-keys-relationships", "NULL means 'no value / unknown'. It is not 0 and not an empty string. Test it with `IS NULL` or `IS NOT NULL`; `= NULL` never matches."),
  T("round", "ROUND", /\bROUND\s*\(/i, "data-types-and-constraints", "`ROUND(x, 2)` rounds a number to 2 decimal places, for tidy money columns."),
  T("cast", "CAST", /\bCAST\s*\(/i, "data-types-and-constraints", "`CAST(x AS INTEGER)` converts a value to another type."),
  T("typeof", "typeof()", /\btypeof\s*\(/i, "data-types-and-constraints", "`typeof(x)` tells you the type SQLite actually stored for a value: integer, real, text, blob or null."),

  // ---- aggregates ----
  T("count", "COUNT / SUM / AVG / MIN / MAX", /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i, "aggregates-group-by", "Aggregate functions fold many rows into one number: `COUNT(*)` counts rows, `SUM(col)` adds, `AVG` averages, `MIN`/`MAX` pick the smallest/largest. `COUNT(col)` skips NULLs."),
  T("group-by", "GROUP BY", /\bGROUP\s+BY\b/i, "aggregates-group-by", "`GROUP BY col` puts rows with the same value of col into one bucket, so aggregates like COUNT and SUM give one row per bucket (per customer, per month…)."),
  T("having", "HAVING", /\bHAVING\b/i, "aggregates-group-by", "`HAVING condition` filters the buckets after GROUP BY (e.g. only customers with more than 3 orders). WHERE filters rows before grouping; HAVING filters groups after."),
  T("group-concat", "GROUP_CONCAT", /\bGROUP_CONCAT\s*\(/i, "aggregates-group-by", "`GROUP_CONCAT(col, ', ')` joins the values of a group into one comma-separated string (`STRING_AGG` in Postgres)."),

  // ---- joins ----
  T("join", "JOIN … ON", /\bJOIN\b/i, "joins", "`JOIN other ON condition` combines rows from two tables where the condition matches, usually a key: `orders.customer_id = customers.id`. A plain JOIN keeps only matching rows."),
  T("left-join", "LEFT JOIN", /\bLEFT\s+(OUTER\s+)?JOIN\b/i, "joins", "`LEFT JOIN` keeps every row of the left table even when nothing matches on the right; the right side's columns are NULL for those rows. Use it for 'customers and their orders, including customers with none'."),
  T("self-join", "self-join", /\bself-?join/i, "joins", "A self-join joins a table to itself under two aliases, e.g. employees `e` to employees `m` on `e.manager_id = m.id`, to pair each row with a related row of the same table."),
  T("anti-join", "anti-join", /\banti-?join/i, "joins", "An anti-join returns rows of A that have no match in B: `LEFT JOIN … WHERE b.id IS NULL` or `NOT EXISTS`."),
  T("fan-out", "fan-out", /\bfan-?out/i, "joins", "Fan-out is when a join multiplies rows: one order with 2 items and 2 payments becomes 4 rows, so totals double. Aggregate each side first."),

  // ---- subqueries and CTEs ----
  T("subquery", "subquery (SELECT inside a query)", /\(\s*SELECT\b|\bsub-?quer/i, "subqueries-ctes", "A subquery is a SELECT written inside another statement, in brackets. It can produce one value (`WHERE price > (SELECT AVG(price) FROM products)`), a list for IN, or a whole table to join to."),
  T("exists", "EXISTS / NOT EXISTS", /\bEXISTS\b/i, "subqueries-ctes", "`EXISTS (SELECT 1 FROM … WHERE …)` is true if the inner query finds at least one row; `NOT EXISTS` is true if it finds none. It is the safe way to ask 'has any / has no related row', because NULLs cannot confuse it."),
  T("cte", "WITH … AS (CTE)", /\bWITH\s+(RECURSIVE\s+)?[a-z_]+\s*(\([^)]*\))?\s+AS\s*\(|\bCTE\b|common table expression/i, "subqueries-ctes", "`WITH name AS (SELECT …)` gives a query a name so the statement below can use it like a table: `SELECT … FROM name`. It is just a way to write a big query as readable steps. The database runs it as one statement. (The jargon name is CTE, common table expression.)"),
  T("recursive-cte", "WITH RECURSIVE", /\bRECURSIVE\b|recursive\s+(CTE|query)|\brecursion\b/i, "subqueries-ctes", "`WITH RECURSIVE` is a named query that refers to itself: a starting row (the anchor), then a step that produces the next rows from the previous ones, repeated until nothing new appears. It is how SQL generates a list of dates, or walks a tree of any depth (an org chart). Taught properly in topic 2.4; you can read the examples before that as 'make rows 1, 2, 3 … until the stop condition'."),
  T("generate-series", "generate_series", /generate_series/i, "subqueries-ctes", "`generate_series(start, stop)` is Postgres' built-in way to produce a run of numbers or dates as rows, e.g. every day of a month, without writing them by hand."),
  T("values", "VALUES (…) as rows", /\bAS\s*\(\s*VALUES\b|\(\s*VALUES\s*\(/i, "select-filter-sort", "`VALUES ('a'), ('b'), ('c')` writes rows out by hand. Inside `WITH months(m) AS (VALUES …)` it becomes a tiny table you can join to."),

  // ---- window functions ----
  T("window", "window function (… OVER (…))", /\bOVER\s*\(/i, "window-functions", "A window function adds a column computed from neighbouring rows while keeping every row: `SUM(x) OVER (ORDER BY day)` is a running total; `ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)` numbers rows within each department. GROUP BY folds rows; OVER keeps them."),
  T("row-number", "ROW_NUMBER / RANK / DENSE_RANK", /\b(ROW_NUMBER|DENSE_RANK|RANK)\s*\(\)/i, "window-functions", "Ranking functions number rows in an order. `ROW_NUMBER` gives 1, 2, 3 with no ties; `RANK` gives tied rows the same number and skips (1, 1, 3); `DENSE_RANK` gives ties the same number without skipping (1, 1, 2)."),
  T("partition-by", "PARTITION BY", /\bPARTITION\s+BY\b/i, "window-functions", "`PARTITION BY col` inside OVER restarts the window calculation for each value of col: a separate ranking per department, a separate running total per user."),
  T("lag", "LAG / LEAD", /\b(LAG|LEAD)\s*\(/i, "window-functions", "`LAG(col)` reads the value from the previous row in the window's order, `LEAD` the next. 'Compare this month with last month' is `col - LAG(col)`."),

  // ---- writing ----
  T("insert", "INSERT", /\bINSERT\s+(OR\s+\w+\s+)?INTO\b/i, "writing-data", "`INSERT INTO table (cols) VALUES (…)` adds a row. `INSERT INTO t SELECT …` adds the rows another query produces. `INSERT OR IGNORE` / `OR REPLACE` say what to do when a row with that key already exists."),
  T("update", "UPDATE", /\bUPDATE\s+[a-z_]+\s+SET\b/i, "writing-data", "`UPDATE table SET col = value WHERE …` changes existing rows. Without WHERE it changes every row."),
  T("delete", "DELETE", /\bDELETE\s+FROM\b/i, "writing-data", "`DELETE FROM table WHERE …` removes rows. Without WHERE it empties the table."),
  T("upsert", "ON CONFLICT (upsert)", /\bON\s+CONFLICT\b|\bupsert\b|ON\s+DUPLICATE\s+KEY/i, "writing-data", "An upsert is 'insert, or if a row with that key already exists, update it instead': `INSERT … ON CONFLICT (key) DO UPDATE SET …` (or `DO NOTHING`). `excluded.col` means the value you tried to insert."),
  T("returning", "RETURNING", /\bRETURNING\b/i, "writing-data", "`RETURNING cols` makes an INSERT, UPDATE or DELETE hand back the rows it touched, so you get the new id without a second query."),
  T("changes", "changes()", /\bchanges\s*\(\)/i, "writing-data", "`changes()` returns how many rows the last INSERT, UPDATE or DELETE affected (the driver gives you the same number as rowCount)."),
  T("transaction", "transaction (BEGIN / COMMIT / ROLLBACK)", /\bBEGIN\b|\bCOMMIT\b|\bROLLBACK\b|\btransaction/i, "writing-data", "A transaction groups several statements so they succeed or fail together: `BEGIN`, the statements, then `COMMIT` to keep them all or `ROLLBACK` to undo them all. Moving money needs both the debit and the credit, or neither."),
  T("idempotent", "idempotent / idempotency key", /\bidempoten/i, "writing-data", "An operation is idempotent when doing it twice has the same effect as doing it once. A unique key on a request id makes a retried request harmless: the second attempt is refused or ignored instead of charging twice."),

  // ---- toolkit ----
  T("case", "CASE WHEN", /\bCASE\s+WHEN\b|\bCASE\s+[a-z_.]+\s+WHEN\b/i, "sql-toolkit", "`CASE WHEN condition THEN a ELSE b END` is if/else inside a query: it produces one value per row, e.g. a label ('cheap'/'premium') or a 1/0 you can SUM to count per status."),
  T("coalesce", "COALESCE", /\bCOALESCE\s*\(/i, "sql-toolkit", "`COALESCE(a, b)` returns a unless a is NULL, then b. It is how a missing value becomes 0 or 'unknown' in a report."),
  T("nullif", "NULLIF", /\bNULLIF\s*\(/i, "sql-toolkit", "`NULLIF(a, b)` returns NULL when a equals b, otherwise a. `x / NULLIF(count, 0)` avoids dividing by zero."),
  T("iif", "IIF", /\bIIF\s*\(/i, "sql-toolkit", "`IIF(condition, a, b)` is a short if/else: a when the condition holds, else b (SQLite and SQL Server; CASE WHEN elsewhere)."),
  T("union", "UNION / UNION ALL / EXCEPT / INTERSECT", /\bUNION\b|\bEXCEPT\b|\bINTERSECT\b/i, "sql-toolkit", "Set operators stack two results with the same columns: `UNION ALL` keeps every row, `UNION` removes duplicates, `INTERSECT` keeps rows in both, `EXCEPT` keeps rows in the first but not the second."),
  T("strftime", "strftime / date() / datetime()", /\bstrftime\s*\(|\bdate\s*\(|\bdatetime\s*\(|\bjulianday\s*\(/i, "sql-toolkit", "SQLite's date functions: `date(x)` gives the day part, `datetime('now')` the current moment, `strftime('%Y-%m', x)` formats a date (here: year-month, for grouping by month), `date(x, '+1 day')` shifts it. Postgres uses `DATE_TRUNC` and intervals."),
  T("string-fns", "SUBSTR / INSTR / LOWER / UPPER / TRIM / LENGTH", /\b(SUBSTR|INSTR|LOWER|UPPER|TRIM|LENGTH|REPLACE)\s*\(/i, "sql-toolkit", "Text functions: `LOWER`/`UPPER` change case, `SUBSTR(s, start, len)` cuts a piece, `INSTR(s, 'x')` finds where x starts, `TRIM` strips spaces, `LENGTH` counts characters, `REPLACE` swaps text."),
  T("concat", "|| (concatenate)", /\|\|/, "sql-toolkit", "`a || b` glues two strings together ('Hello ' || name). Anything glued to NULL becomes NULL."),
  T("printf", "printf / format", /\bprintf\s*\(|\bformat\s*\(/i, "sql-toolkit", "`printf('%05.2f', x)` formats a value as text the way C's printf does: padding, decimals, repeated characters."),

  // ---- schema ----
  T("create-table", "CREATE TABLE", /\bCREATE\s+(TEMP\s+)?TABLE\b/i, "tables-keys-relationships", "`CREATE TABLE name (col TYPE rules, …)` defines a table: its columns, their types and the rules each must obey. `IF NOT EXISTS` makes it safe to run twice."),
  T("primary-key", "PRIMARY KEY", /\bPRIMARY\s+KEY\b/i, "tables-keys-relationships", "The primary key is the column (or columns) that identifies one row uniquely, usually `id`. No two rows share it, and it is never NULL. Other tables point at rows through it."),
  T("foreign-key", "REFERENCES / FOREIGN KEY", /\bREFERENCES\b|\bFOREIGN\s+KEY\b|\bforeign key/i, "tables-keys-relationships", "`customer_id INTEGER REFERENCES customers(id)` declares a foreign key: the value must be the id of a real customer. The database refuses orders for customers that do not exist, and controls what happens when the customer is deleted (`ON DELETE CASCADE` deletes the children too)."),
  T("not-null", "NOT NULL / DEFAULT", /\bNOT\s+NULL\b|\bDEFAULT\s+\S/i, "data-types-and-constraints", "`NOT NULL` means the column must always have a value. `DEFAULT x` fills in x when an INSERT leaves the column out."),
  T("unique", "UNIQUE", /\bUNIQUE\b/i, "data-types-and-constraints", "`UNIQUE` makes the database refuse a second row with the same value (one account per email). A `UNIQUE INDEX` does the same and can cover several columns together."),
  T("check", "CHECK", /\bCHECK\s*\(/i, "data-types-and-constraints", "`CHECK (price >= 0)` is a rule every row must satisfy; the database refuses writes that break it, from any program."),
  T("alter-table", "ALTER TABLE", /\bALTER\s+TABLE\b/i, "ids-and-migrations", "`ALTER TABLE t ADD COLUMN …` changes a table's shape after it exists. Schema changes on a live system are called migrations."),
  T("drop", "DROP", /\bDROP\s+(TABLE|VIEW|INDEX)\b/i, "ids-and-migrations", "`DROP TABLE t` deletes the whole table, rows and definition. `IF EXISTS` avoids an error when it is already gone."),
  T("schema", "schema", /\bschema\b/i, "tables-keys-relationships", "The schema is the shape of the data: which tables exist, their columns, types, keys and rules. A schema change is a migration."),
  T("normalise", "normalisation / normal form", /\bnormali[sz]|\bnormal form|\b[123]NF\b/i, "normalization", "Normalisation means storing each fact once, in one place, so it cannot disagree with a copy of itself: a customer's city lives on the customer row, not on every order. 3NF is the usual target."),
  T("denormalise", "denormalise", /\bdenormali[sz]/i, "real-world-schema-patterns", "Denormalising is deliberately copying a fact (a counter, a snapshot price) to make reads faster or to freeze history, accepting that you must keep the copy right."),
  T("migration", "migration", /\bmigration/i, "ids-and-migrations", "A migration is a scripted change to the schema (add a column, create an index) that is versioned and run on every environment in order."),
  T("uuid", "UUID", /\bUUIDs?\b/i, "ids-and-migrations", "A UUID is a 128-bit random-looking id (like 6f1e…-…) that can be generated anywhere without a central counter; bigger and slower to index than an integer."),

  // ---- indexes and plans ----
  T("index", "index (CREATE INDEX)", /\bCREATE\s+(UNIQUE\s+)?INDEX\b|\bindex(es)?\b(?! (card|at the back|of a book|of the book))/i, "indexes", "An index is a sorted copy of one or more columns with pointers to the rows, like the index at the back of a book. `CREATE INDEX idx ON orders(customer_id)` lets `WHERE customer_id = 3` jump straight to the rows instead of reading the whole table. Indexes speed reads and cost a little on every write."),
  T("b-tree", "B-tree", /\bB-?tree/i, "indexes", "A B-tree is the data structure most indexes use: a shallow, balanced tree of sorted keys, so finding one value among millions takes a handful of page reads."),
  T("explain", "EXPLAIN QUERY PLAN / query plan", /\bEXPLAIN\b|query plan|\bthe plan\b|\bplanner\b/i, "reading-query-plans", "`EXPLAIN QUERY PLAN` (the Show plan button) asks the database how it intends to run a query: SCAN means reading the whole table, SEARCH … USING INDEX means jumping via an index. The planner is the part of the database that chooses."),
  T("scan", "SCAN vs SEARCH", /\bSCAN\b|\bSEARCH\b|full (table )?scan|sequential scan|table scan/, "reading-query-plans", "In a plan, SCAN means every row of the table is read; SEARCH (or Index Scan) means the database used an index to go straight to the matching rows."),
  T("composite-index", "composite index", /\bcomposite (index|key)|\bleftmost/i, "indexes", "A composite index is one index on several columns, e.g. (tenant_id, created_at). It helps queries that filter on the first column, or the first two, in that order (the leftmost-prefix rule)."),
  T("covering", "covering index", /\bcovering\b/i, "indexes", "A covering index contains every column a query needs, so the database answers from the index alone without touching the table."),
  T("sargable", "sargable", /\bsargable/i, "query-antipatterns", "A condition is sargable when an index can be used for it: `WHERE created_at >= '2025-01-01'` yes; `WHERE YEAR(created_at) = 2025` no, because the function hides the column."),
  T("n-plus-one", "N+1", /\bN\s*\+\s*1\b/i, "query-antipatterns", "N+1 is the pattern of one query for a list of N rows, then one more query per row for something related: 101 queries where 1 or 2 would do."),
  T("keyset", "keyset pagination", /\bkeyset/i, "query-antipatterns", "Keyset pagination fetches the next page with `WHERE (sort_col, id) > (last seen)` instead of OFFSET, so deep pages stay fast."),
  T("pool", "connection pool", /\bconnection pool|\bpool(ing|er)?\b/i, "pooling-caching-app-layer", "A connection pool keeps a few open database connections and lends them to requests, because opening a connection is slow and the database can only serve so many at once."),
  T("cache", "cache", /\bcach(e|ing|ed)\b/i, "pooling-caching-app-layer", "A cache keeps a copy of a result (in memory, or in Redis) so the next request does not hit the database; the catch is deciding when the copy is stale."),
  T("orm", "ORM", /\bORMs?\b/i, "orms-and-n-plus-one", "An ORM (object-relational mapper, e.g. Prisma, TypeORM) is a library that turns rows into objects and writes SQL for you from method calls."),

  // ---- transactions and concurrency ----
  T("acid", "ACID", /\bACID\b/i, "acid-in-practice", "ACID is the four promises of a transaction: Atomic (all or nothing), Consistent (rules hold), Isolated (concurrent transactions do not see each other's half-done work), Durable (once committed, it survives a crash)."),
  T("isolation", "isolation level", /\bisolation (level|levels)?\b|READ\s+COMMITTED|REPEATABLE\s+READ|SERIALIZABLE/i, "isolation-levels", "The isolation level is how much a running transaction is allowed to see of other transactions' changes. Stricter levels (REPEATABLE READ, SERIALIZABLE) prevent more anomalies and allow less concurrency."),
  T("race", "race condition", /\brace condition|\braces?\b(?! (to|for|car))/i, "acid-in-practice", "A race condition is when two requests interleave so the result depends on timing: both read balance 800, both subtract 500, and the account goes negative."),
  T("lost-update", "lost update", /\blost update/i, "isolation-levels", "A lost update is when two transactions read the same row, each writes back a changed copy, and the second write silently erases the first."),
  T("lock", "lock / FOR UPDATE", /\bFOR\s+UPDATE\b|\b(row|table|exclusive|shared|a|the|take|takes|hold|holds|holding|held|waiting on a|waits for a|without a) locks?\b|\block(ed|ing) (rows?|the|it|by)\b/i, "locks-mvcc-deadlocks", "A lock is the database's way of making one transaction wait for another on the same row. `SELECT … FOR UPDATE` locks the rows you read so nobody else changes them until you commit."),
  T("deadlock", "deadlock", /\bdeadlock/i, "locks-mvcc-deadlocks", "A deadlock is two transactions each waiting for a lock the other holds, forever; the database picks one and cancels it. Taking locks in the same order avoids it."),
  T("mvcc", "MVCC", /\bMVCC\b|row version/i, "locks-mvcc-deadlocks", "MVCC (multi-version concurrency control) means the database keeps old versions of rows so readers see a consistent snapshot while writers change things, instead of blocking each other."),
  T("optimistic", "optimistic locking (version column)", /\boptimistic/i, "locks-mvcc-deadlocks", "Optimistic locking means no lock while you think: the row carries a version number, and your UPDATE says `WHERE version = the one I read`; zero rows updated means someone got there first, so you retry."),
  T("skip-locked", "SKIP LOCKED", /SKIP\s+LOCKED/i, "locks-mvcc-deadlocks", "`FOR UPDATE SKIP LOCKED` lets several workers each grab different unlocked rows from a queue table without waiting for each other."),

  // ---- storage and scale ----
  T("page", "page (storage)", /\b(data|heap|disk|index|leaf|\d+ ?KB) pages?\b|\bpages? (read|touched|reads)\b|page reads|page count|whole pages/i, "storage-internals", "Databases read and write disk in fixed-size pages (4–16 KB); a row lives inside a page. The number of pages a query touches is what makes it fast or slow."),
  T("wal", "WAL (write-ahead log)", /\bWAL\b|write-ahead/i, "storage-internals", "The write-ahead log is an append-only file where every change is recorded before the data files are updated, so a crash can be recovered and replicas can follow."),
  T("vacuum", "VACUUM", /\bVACUUM\b/i, "database-operations", "`VACUUM` reclaims the space left by deleted and updated rows. Postgres runs it automatically (autovacuum); SQLite rewrites the file when you ask."),
  T("analyze", "ANALYZE (statistics)", /\bANALYZE\b|\bstatistics\b/i, "database-operations", "`ANALYZE` collects statistics about the data (row counts, how many distinct values) so the planner can choose good plans. Stale statistics mean bad plans."),
  T("pragma", "PRAGMA", /\bPRAGMA\b|\bpragma_/i, "what-is-a-database", "`PRAGMA something` asks SQLite about itself or changes a setting: `PRAGMA table_info(orders)` lists a table's columns; `PRAGMA foreign_keys = ON` switches foreign-key checks on."),
  T("sqlite-master", "sqlite_master", /sqlite_master/i, "what-is-a-database", "`sqlite_master` is SQLite's catalogue table: one row per table, index and view, with the SQL that created it. Other databases call this information_schema."),
  T("replica", "replica / replication", /\breplica|\breplication/i, "replication-failover-backups", "A replica is a second server that receives every change from the primary and serves reads; replication is the copying. Replicas lag a little behind."),
  T("failover", "failover", /\bfailover/i, "replication-failover-backups", "Failover is promoting a replica to be the new primary when the primary dies."),
  T("shard", "shard / sharding", /\bshard/i, "partitioning-and-sharding", "Sharding splits one big table across several databases by a key (customer id, tenant), so each server holds a slice. Every query must know which shard to ask."),
  T("partition", "partition", /\bpartition(s|ed|ing)?\b(?!\s+by)/i, "partitioning-and-sharding", "Partitioning splits a big table into pieces inside one database (by month, by tenant) so scans and deletes touch one piece. (In window functions, PARTITION BY means something else: restart per group.)"),
  T("cap", "CAP theorem", /\bCAP\b/i, "distributed-consistency", "CAP: when the network between servers fails, a system must choose between staying consistent (refusing some requests) and staying available (answering with possibly stale data)."),
  T("outbox", "outbox pattern", /\boutbox/i, "distributed-consistency", "The outbox pattern writes 'send this message' as a row in the same transaction as the business change; a worker sends it afterwards, so the message is never lost or sent for a change that rolled back."),
  T("saga", "saga", /\bsagas?\b/i, "distributed-consistency", "A saga is a multi-step process across services where each step has an undo (compensation) that runs if a later step fails, instead of one big transaction."),
  T("cdc", "CDC (change data capture)", /\bCDC\b|change data capture/i, "oltp-vs-olap", "Change data capture reads the database's log of changes and streams every insert, update and delete to another system (search, warehouse) in near real time."),
  T("olap", "OLTP / OLAP", /\bOL[AT]P\b|\bcolumnar\b|\bwarehouse\b/i, "oltp-vs-olap", "OLTP is the app's workload: many small reads and writes. OLAP is analytics: big scans and totals, best served by a separate columnar warehouse."),
  T("materialized", "materialized view", /\bmateriali[sz]ed view/i, "views-triggers-procedures", "A materialized view is a saved query whose result is stored like a table and refreshed when you ask, so expensive reports read precomputed rows."),
  T("view", "CREATE VIEW", /\bCREATE\s+VIEW\b|\b(a|the|plain|simple|updatable|indexed|big) views?\b|\bviews? (over|that|stores|named)\b/i, "views-triggers-procedures", "A view is a saved SELECT with a name; `SELECT * FROM view_name` runs the saved query. It stores no rows itself. One place to keep a rule every reader uses."),
  T("trigger", "trigger", /\bCREATE\s+TRIGGER\b|\b(a|the|an|database|audit|BEFORE|AFTER|INSTEAD OF) triggers?\b|\btrigger-fed/i, "views-triggers-procedures", "A trigger is code the database runs by itself before or after an INSERT, UPDATE or DELETE on a table, for every writer. Used for audit rows and updated_at."),
  T("generated", "GENERATED ALWAYS AS", /GENERATED\s+ALWAYS/i, "views-triggers-procedures", "A generated column is defined by a formula over the row's other columns; the database computes it on every write, so it can never be wrong."),
  T("stored-proc", "stored procedure / function", /stored procedure|\bprocedures?\b|CREATE\s+FUNCTION/i, "views-triggers-procedures", "A stored procedure or function is code saved inside the database and run with CALL or inside a query; useful for batch work close to the data."),
  T("json", "json_extract / json_each / JSONB", /\bjson_[a-z]+\s*\(|\bJSONB?\b/i, "json-and-search", "A JSON column stores a document; `json_extract(col, '$.path')` reads one value out of it, `json_each` turns its keys or array items into rows. Postgres' JSONB is a binary, indexable JSON type."),
  T("full-text", "full-text search / inverted index", /full-?text|inverted index|\btsvector\b|\bFTS5?\b/i, "json-and-search", "Full-text search finds rows containing words anywhere in a text, using an inverted index (word → rows) instead of scanning with LIKE."),
  T("injection", "SQL injection", /\binjection/i, "sql-injection-and-permissions", "SQL injection is when user input glued into a SQL string becomes part of the command (`'; DELETE …`). Parameters prevent it."),
  T("parameter", "parameters ($1, ?)", /\bparameteri[sz]ed|\bplaceholders?\b|\$1\b/i, "sql-injection-and-permissions", "A parameterised query sends the SQL with placeholders (`$1`, `?`) and the values separately, so input is data and can never be run as SQL."),
  T("tenant", "tenant / multi-tenancy", /\btenant/i, "multi-tenancy-and-rls", "A tenant is one customer organisation sharing your app with others; multi-tenancy is keeping every tenant's rows apart, usually with a tenant_id column on every table."),
  T("rls", "row-level security", /row-level security|\bRLS\b/i, "multi-tenancy-and-rls", "Row-level security is a database rule that automatically filters every query to the rows the current user or tenant may see."),
  T("redis", "Redis", /\bRedis\b/i, "sql-vs-nosql", "Redis is an in-memory key-value store used for caches, counters and sessions: very fast, no joins, data fits in RAM."),
  T("nosql", "NoSQL / document store", /\bNoSQL\b|document (store|database)|\bMongoDB\b/i, "sql-vs-nosql", "NoSQL databases store data as documents (MongoDB), key-value pairs (Redis) or wide columns instead of related tables; they trade joins and constraints for flexibility or speed on specific patterns."),
  T("ddl", "DDL", /\bDDL\b/i, "ids-and-migrations", "DDL (data definition language) is the family of statements that change the schema: CREATE, ALTER, DROP."),
  T("pii", "PII", /\bPII\b/i, "sql-injection-and-permissions", "PII is personally identifiable information: names, emails, addresses; the columns you must protect and be able to delete."),
  T("tls", "TLS", /\bTLS\b|\bSSL\b/i, "sql-injection-and-permissions", "TLS encrypts the connection between the app and the database so nobody on the network can read the traffic."),
  T("bcrypt", "bcrypt / argon2 (password hashing)", /\bbcrypt\b|\bargon2\b|password hash|hashed password/i, "sql-injection-and-permissions", "Hashing turns a password into a fixed scramble that cannot be reversed; bcrypt and argon2 are deliberately slow hashes so guessing is expensive. You store the hash, never the password."),
];

/** Position of every topic in the course, so 'taught later' can be decided. */
export function topicOrder(slugs: string[]): Map<string, number> {
  return new Map(slugs.map((s, i) => [s, i]));
}

/**
 * Terms that appear in `texts` and are taught in a topic AFTER the current one (or in a topic the course
 * does not have). Each term once, in glossary order.
 */
export function termsBeforeTaught(texts: (string | undefined)[], currentSlug: string, order: Map<string, number>): Term[] {
  const here = order.get(currentSlug) ?? Number.POSITIVE_INFINITY;
  const joined = texts.filter(Boolean).join("\n");
  if (!joined) return [];
  return TERMS.filter((t) => {
    const taught = order.get(t.taughtIn);
    const later = taught === undefined || taught > here;
    return later && t.match.test(joined);
  });
}
