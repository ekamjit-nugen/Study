import type { Topic } from "../types";

// Two more SQL-module topics in the guided style: the everyday toolkit, and the objects that live
// inside the database (views, triggers, generated columns, procedures).

export const SQL_TOOLKIT: Topic = {
  slug: "sql-toolkit",
  guided: true,
  title: "The everyday toolkit: CASE, NULL logic, set operations, strings and dates",
  minutes: 22,
  story: "A kitchen drawer of small tools: nothing glamorous, but every report you will ever write reaches into it. Most 'the numbers look wrong' bugs come from one of these tools being used the way JavaScript would behave instead of the way SQL does.",
  tldr: [
    "NULL is **unknown**: `x = NULL`, `x <> NULL` and `NOT IN (list with a NULL)` never return TRUE. Use IS NULL, COALESCE and NOT EXISTS.",
    "`CASE WHEN … END` is an if/else that produces a value per row: labels, pivots, custom sort orders.",
    "`COALESCE` picks the first non-NULL; `NULLIF(x, 0)` turns a zero into NULL so division cannot crash.",
    "UNION removes duplicates (and costs a sort); UNION ALL just stacks. INTERSECT and EXCEPT are set algebra.",
    "Dates: half-open ranges (`>= start AND < next`), never BETWEEN on timestamps, and '+1 month' is not the same in every database.",
  ],
  words: [
    ["three-valued logic", "SQL conditions are TRUE, FALSE or UNKNOWN; WHERE keeps only TRUE"],
    ["COALESCE", "the first argument that is not NULL"],
    ["NULLIF", "NULL when the two arguments are equal, otherwise the first"],
    ["pivot", "turning rows into columns, usually with SUM(CASE WHEN …)"],
    ["half-open range", "start included, end excluded: >= start AND < end"],
  ],
  sections: [
    {
      title: "The 'manages nobody' list that came back empty",
      analogy: "Asking 'is this person on the list?' when one name on the list is smudged: you cannot say yes, and you cannot say no either.",
      why: "Three-valued logic silently empties reports; once you have seen it, you spot it in every NOT IN and every <>.",
      ask: "You want every employee who manages nobody: `SELECT name FROM employees WHERE id NOT IN (SELECT manager_id FROM employees)`. The CEO's manager_id is NULL. How many rows come back?",
      body: "Zero. Not 'everyone except managers': zero rows.\n\nNOT IN expands to `id <> 3 AND id <> 7 AND … AND id <> NULL`. Comparing anything with NULL gives UNKNOWN, and UNKNOWN joined with AND can never become TRUE. WHERE keeps only TRUE, so every row is dropped.\n\n| Expression | Result |\n|---|---|\n| 5 = NULL | UNKNOWN |\n| NULL = NULL | UNKNOWN |\n| TRUE AND UNKNOWN | UNKNOWN |\n| TRUE OR UNKNOWN | TRUE |\n| NOT UNKNOWN | UNKNOWN |\n\nThe fix is a question NULL cannot poison: NOT EXISTS, or filter the NULL out of the list.",
      diagram: "nullLogic",
      sql: [
        { title: "The empty list", sql: `SELECT name FROM employees WHERE id NOT IN (SELECT manager_id FROM employees);`, note: "Zero rows. One NULL in the list makes NOT IN unknowable for every row." },
        { title: "NOT EXISTS asks a question NULL cannot poison", sql: `SELECT e.name, e.dept\nFROM employees e\nWHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.id)\nORDER BY e.name;` },
      ],
    },
    {
      title: "CASE: if/else inside a query",
      analogy: "A sorting hat: each row walks past and gets a label.",
      why: "Without CASE you fetch everything and label it in JavaScript, which breaks the moment you want to GROUP BY the label.",
      body: "`CASE WHEN … THEN … ELSE … END` is an expression: it produces one value per row, so it can sit in SELECT, in ORDER BY, inside SUM, anywhere a value goes.\n\nThree jobs it does every day:\n\n- **label**: cheap / mid / premium from a price\n- **pivot**: `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` turns rows into columns\n- **custom sort**: `ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END`\n\nThe first WHEN that is true wins. With no ELSE, the result is NULL.",
      sql: [
        { title: "Label, then count per label", sql: `SELECT CASE WHEN price < 30 THEN 'cheap' WHEN price < 100 THEN 'mid' ELSE 'premium' END AS band,\n       COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price\nFROM products\nGROUP BY band\nORDER BY MIN(price);` },
        { title: "Pivot: one column per status", sql: `SELECT c.name,\n       SUM(CASE WHEN o.status = 'paid'      THEN 1 ELSE 0 END) AS paid,\n       SUM(CASE WHEN o.status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,\n       SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled\nFROM customers c JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY paid DESC, c.name\nLIMIT 6;` },
      ],
      tip: "GROUP BY the alias works in SQLite, MySQL and Postgres. If a database refuses, repeat the CASE expression in GROUP BY.",
    },
    {
      title: "COALESCE, NULLIF and the division that crashed",
      analogy: "COALESCE is 'the first answer anyone gives'; NULLIF is 'treat this placeholder as no answer'.",
      why: "Every report has a zero or a NULL that needs a fallback, and one division by zero stops the whole page.",
      ask: "Cancellation rate per customer = cancelled ÷ orders. Ishaan has no orders. In Postgres the query crashes with 'division by zero' (SQLite quietly returns NULL). Without a WHERE that hides Ishaan, how do you keep his row and avoid the crash?",
      body: "Turn the zero into NULL. `NULLIF(count, 0)` returns NULL when the count is 0, and anything divided by NULL is NULL, not an error. Then COALESCE the NULL into whatever the report should display.\n\n- `COALESCE(a, b, c)`: the first non-NULL argument\n- `NULLIF(a, b)`: NULL when a equals b, else a\n- `IFNULL` / `ISNULL` / `NVL`: dialect spellings of two-argument COALESCE. Write COALESCE and it runs everywhere\n\nCOALESCE also fixes the classic `'Hello ' || NULL` = NULL: concatenating with NULL gives NULL, so wrap optional parts.",
      sql: [
        { title: "Rate per customer, Ishaan included", sql: `SELECT c.name,\n       COUNT(o.id) AS orders,\n       SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       COALESCE(ROUND(100.0 * SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) / NULLIF(COUNT(o.id), 0), 1), 0) AS cancel_pct\nFROM customers c LEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY cancel_pct DESC, c.name;`, note: "Ishaan keeps his row with 0 orders and 0%. NULLIF stops the division; COALESCE picks the display value." },
        { title: "NULL swallows concatenation", sql: `SELECT 'Hello ' || NULL AS swallowed, 'Hello ' || COALESCE(NULL, 'stranger') AS fixed;` },
      ],
    },
    {
      title: "Set operations: UNION, UNION ALL, INTERSECT, EXCEPT",
      analogy: "Two guest lists for one party: stack them (UNION ALL), merge without duplicates (UNION), who is on both (INTERSECT), who is only on the first (EXCEPT).",
      why: "UNION quietly deduplicates and sorts, which changes counts and costs time; knowing which operator you meant avoids both.",
      ask: "You stack two email lists of 13 and 10 rows with UNION and get 20 rows, not 23. Nothing is wrong with the data. Where did three rows go?",
      body: "UNION removes duplicates across both lists; three emails were on both. UNION ALL keeps every row and is faster, because it skips the sort-and-dedupe step.\n\n| Operator | Keeps | Use when |\n|---|---|---|\n| UNION ALL | every row from both | stacking disjoint sets, logs, reports |\n| UNION | distinct rows | you really want one copy of each |\n| INTERSECT | rows present in both | 'did X and Y' |\n| EXCEPT (MINUS in Oracle) | rows in the first, not in the second | 'did X but not Y' |\n\nRules: same number of columns, compatible types, column names come from the first query, and ORDER BY goes once at the very end.",
      sql: [
        { title: "UNION vs UNION ALL", sql: `SELECT COUNT(*) AS union_all      FROM (SELECT country FROM customers UNION ALL SELECT country FROM customers);\nSELECT COUNT(*) AS union_distinct FROM (SELECT country FROM customers UNION     SELECT country FROM customers);` },
        { title: "EXCEPT: paid at least once, never cancelled", sql: `SELECT name FROM customers WHERE id IN (\n  SELECT customer_id FROM orders WHERE status = 'paid'\n  EXCEPT\n  SELECT customer_id FROM orders WHERE status = 'cancelled'\n)\nORDER BY name;` },
      ],
    },
    {
      title: "Strings: LIKE, case, concatenation and slicing",
      analogy: "Scissors and glue for text.",
      why: "Half of data cleaning is string work, and the functions differ just enough per database to bite.",
      body: "- `||` concatenates in SQLite and Postgres; MySQL uses `CONCAT()` (its `||` means OR unless you change a mode)\n- `LOWER`, `UPPER`, `TRIM`, `LENGTH`\n- `SUBSTR(s, start, len)` is 1-based; `INSTR(s, 'x')` finds a position. Postgres adds `SPLIT_PART`, `POSITION`, `LEFT`, `RIGHT`\n- `LIKE 'A%'` can use an index; `'%A%'` cannot. Postgres `ILIKE` ignores case\n- `REPLACE(s, from, to)`\n\nCase sensitivity differs: Postgres LIKE is case-sensitive, MySQL usually is not (collation), SQLite LIKE ignores case for ASCII letters.",
      sql: [
        { title: "Email domains", sql: `SELECT SUBSTR(email, INSTR(email, '@') + 1) AS domain, COUNT(*) AS customers\nFROM customers\nGROUP BY domain\nORDER BY customers DESC;` },
        { title: "First name and initials", sql: `SELECT name,\n       SUBSTR(name, 1, INSTR(name, ' ') - 1) AS first_name,\n       UPPER(SUBSTR(name, 1, 1) || SUBSTR(name, INSTR(name, ' ') + 1, 1)) AS initials\nFROM customers\nORDER BY name\nLIMIT 5;` },
      ],
    },
    {
      title: "Dates: half-open ranges and the +1 month trap",
      analogy: "A calendar where 'one month after January 31' has no obvious answer.",
      why: "Date bugs ship silently: a report that double counts midnight or skips the last day of the month looks fine in testing.",
      ask: "What is `date('2025-01-31', '+1 month')`? Run it, then guess what Postgres returns for the same question.",
      body: "SQLite says **2025-03-03**: it adds 1 to the month, gets February 31, and normalises forward. Postgres clamps to 2025-02-28; MySQL also clamps. Same question, two answers, so a monthly job must never be 'last run + 1 month'. Anchor on the first of the month.\n\nRanges: always **half-open**: `>= '2025-01-01' AND < '2025-02-01'`. `BETWEEN '2025-04-01' AND '2025-04-22'` on a timestamp column silently drops every order placed on April 22 after midnight, because '2025-04-22 13:00' sorts after '2025-04-22'.\n\nGrouping: `strftime('%Y-%m', col)` in SQLite, `DATE_TRUNC('month', col)` in Postgres, `DATE_FORMAT(col, '%Y-%m')` in MySQL. Store instants as timestamptz (UTC) and convert at the edge.",
      sql: [
        { title: "The month trap", sql: `SELECT date('2025-01-31', '+1 month') AS sqlite_says,\n       date('2025-01-31', 'start of month', '+1 month') AS first_of_next;` },
        { title: "Half-open vs BETWEEN: April 1 to April 22 inclusive", sql: `SELECT COUNT(*) AS half_open     FROM orders WHERE ordered_at >= '2025-04-01' AND ordered_at < '2025-04-23';\nSELECT COUNT(*) AS between_dates FROM orders WHERE ordered_at BETWEEN '2025-04-01' AND '2025-04-22';\nSELECT id, ordered_at FROM orders WHERE date(ordered_at) = '2025-04-22';`, note: "BETWEEN lost order 19, placed on April 22 at 13:00, because '2025-04-22' means midnight at the start of that day." },
      ],
      code: [
        { lang: "sql", title: "Postgres", src: `SELECT DATE_TRUNC('month', ordered_at) AS month, COUNT(*)\nFROM orders\nWHERE ordered_at >= '2025-01-01' AND ordered_at < '2025-02-01'\nGROUP BY 1;\n-- DATE '2025-01-31' + INTERVAL '1 month'  ->  2025-02-28` },
      ],
    },
    {
      title: "Connect it back: the list that came back empty",
      analogy: "The same report, now honest.",
      why: "Every tool in this drawer exists because NULL, duplicates and calendars do not behave like JavaScript values.",
      body: "The 'manages nobody' list was empty because one NULL made NOT IN unknowable; NOT EXISTS fixed it. The cancellation rate crashed on Ishaan's zero orders; NULLIF and COALESCE kept his row. The stacked email list lost three rows to UNION's dedupe; UNION ALL was what we meant. And the monthly job that added a month to January 31 landed in March; anchoring on the first of the month fixed it.\n\n| Symptom | Tool |\n|---|---|\n| a filter returns nothing | NULL in a NOT IN / <> comparison → NOT EXISTS, IS NULL |\n| need a label or a column per status | CASE |\n| NULL where a number should be, or ÷ 0 | COALESCE, NULLIF |\n| counts lower than the sum of two lists | UNION dedupes → UNION ALL |\n| a day missing at a month edge | half-open ranges, start-of-month anchors |",
    },
  ],
  realWorld: [
    {
      title: "One row per customer, one column per status",
      problem: "Support wants a grid: each customer with how many pending, paid, shipped and cancelled orders they have, zeros included, Ishaan included.",
      whyHard: "GROUP BY gives one row per (customer, status); the grid wants one row per customer with the statuses as columns, and customers without orders must still appear.",
      steps: ["LEFT JOIN customers to orders so customers with no orders keep a row.", "SUM(CASE WHEN status = … THEN 1 ELSE 0 END) once per column: the pivot.", "COALESCE is not even needed: SUM over zero rows of CASE … ELSE 0 gives 0 for the LEFT JOIN's NULL status? No: SUM of nothing is NULL, so wrap it."],
      sql: `SELECT c.name,\n       COALESCE(SUM(CASE WHEN o.status = 'pending'   THEN 1 END), 0) AS pending,\n       COALESCE(SUM(CASE WHEN o.status = 'paid'      THEN 1 END), 0) AS paid,\n       COALESCE(SUM(CASE WHEN o.status = 'shipped'   THEN 1 END), 0) AS shipped,\n       COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN 1 END), 0) AS cancelled\nFROM customers c LEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY c.name;`,
      takeaway: "Pivot = SUM(CASE). Keep the zero-rows customers with LEFT JOIN and COALESCE the empty sums.",
    },
  ],
  practice: [
    {
      q: "Put every product in a band: cheap (< 30), mid (< 100), premium. How many products in each band?",
      answer: "cheap 2, mid 6, premium 3.",
      explain: "CASE builds the label; GROUP BY the alias counts per label.",
      sql: `SELECT CASE WHEN price < 30 THEN 'cheap' WHEN price < 100 THEN 'mid' ELSE 'premium' END AS band, COUNT(*) AS products\nFROM products\nGROUP BY band\nORDER BY MIN(price);`,
    },
    {
      q: "Employees who manage nobody, written so a NULL manager_id cannot break it.",
      answer: "Six: Ben Carter, Kavya Singh, Lina Park, Nina Das, Omar Ali, Tom Hughes. The other four each manage someone.",
      explain: "NOT EXISTS with a correlated subquery; NOT IN would return nothing because of the CEO's NULL.",
      sql: `SELECT e.name\nFROM employees e\nWHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.id)\nORDER BY e.name;`,
    },
    {
      q: "Customers who have at least one paid order and no cancelled order, using a set operation.",
      answer: "Liam Walker, Noah Kim, Olivia Brown, Priya Nair, Rahul Verma, Sofia Rossi.",
      explain: "Paid customer ids EXCEPT cancelled customer ids, then look up the names.",
      sql: `SELECT name FROM customers WHERE id IN (\n  SELECT customer_id FROM orders WHERE status = 'paid'\n  EXCEPT\n  SELECT customer_id FROM orders WHERE status = 'cancelled'\n)\nORDER BY name;`,
    },
  ],
  interview: [
    { level: "junior", q: "What does NULL mean, and why is NULL = NULL not true?", a: "NULL means the value is unknown or missing, not zero and not empty string. Comparing two unknowns cannot produce TRUE, so NULL = NULL is UNKNOWN, and WHERE drops the row. You test with IS NULL, replace with COALESCE, and write anti-joins with NOT EXISTS rather than NOT IN." },
    { level: "mid", tricky: true, sql: `SELECT COUNT(*) AS never_ordered\nFROM products\nWHERE id NOT IN (SELECT product_id FROM order_items UNION ALL SELECT NULL);`, q: "The Gift Card has never been ordered. What does this return?", a: "0. The subquery list contains a NULL, so NOT IN becomes UNKNOWN for every product, including the Gift Card, and no row survives WHERE. Remove the NULL from the list or use NOT EXISTS, and the answer becomes 1." },
    { level: "mid", q: "UNION vs UNION ALL: which is faster and why?", a: "UNION ALL. UNION must find and remove duplicates across both inputs, which means a sort or a hash over every row. UNION ALL just concatenates. I default to UNION ALL and only use UNION when I actually want distinct rows, which is rarer than people think." },
    { level: "mid", tricky: true, q: "Does `WHERE ordered_at BETWEEN '2025-01-01' AND '2025-01-31'` cover all of January?", a: "Not for a timestamp column. BETWEEN is inclusive of both ends, and '2025-01-31' means midnight at the start of the 31st, so every order later that day is excluded. Use a half-open range: ordered_at >= '2025-01-01' AND ordered_at < '2025-02-01'. It also works for the last month of a year without special cases." },
    { level: "junior", q: "How do you turn rows into columns (a pivot) in plain SQL?", a: "With conditional aggregation: SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid, one expression per column, grouped by the row key. Postgres also has crosstab and FILTER (COUNT(*) FILTER (WHERE status = 'paid')), but SUM(CASE) runs everywhere." },
    { level: "mid", q: "COALESCE vs IFNULL vs ISNULL?", a: "They all substitute a value for NULL. COALESCE is standard SQL, takes any number of arguments and returns the first non-NULL; IFNULL is MySQL/SQLite with two arguments; ISNULL is SQL Server. I write COALESCE so the query is portable, and NULLIF for the opposite direction, turning a sentinel like 0 or '' into NULL." },
    { level: "senior", q: "Where do NULLs sort, and how do you control it?", a: "It differs: Postgres puts NULLs last in ascending order and first in descending; SQLite and MySQL put them first in ascending. Postgres and SQLite accept NULLS FIRST / NULLS LAST on ORDER BY; in MySQL you add a sort key like ORDER BY col IS NULL, col. I state the rule explicitly in any query where the order is visible to users." },
    { level: "mid", tricky: true, sql: `SELECT 'Hello ' || NULL AS greeting, COALESCE('Hello ' || NULL, 'Hello stranger') AS fixed;`, q: "What does this return?", a: "NULL and 'Hello stranger'. Concatenating anything with NULL yields NULL, so a missing middle name blanks the whole greeting. Wrap the optional part: 'Hello ' || COALESCE(name, 'stranger'). MySQL's CONCAT behaves the same; CONCAT_WS skips NULLs." },
    { level: "mid", q: "What is wrong with `WHERE status <> 'cancelled'` when status can be NULL?", a: "Rows with a NULL status disappear: NULL <> 'cancelled' is UNKNOWN, not TRUE. If NULL should count as 'not cancelled', write status IS DISTINCT FROM 'cancelled' in Postgres, or COALESCE(status, '') <> 'cancelled', or add OR status IS NULL. Better still, make the column NOT NULL with a default." },
    { level: "senior", q: "Design a month-end job that never double counts or skips a day across timezones.", a: "Store instants in UTC with timestamptz. Define the business month in one named timezone and compute its boundaries there: start = first of month at 00:00 in that zone, end = first of next month, converted to UTC. Query with a half-open range on the UTC column. Never derive the next run as last + 1 month; compute it from the calendar. Make the job idempotent by keying the result on the month so a rerun replaces, not adds." },
  ],
  remember: [
    "NOT IN with a NULL → nothing. NOT EXISTS instead.",
    "CASE makes labels and pivots; COALESCE and NULLIF make NULL and zero behave.",
    "UNION ALL unless you really want dedupe.",
    "Ranges are half-open. '+1 month' from the 31st is not what you think.",
  ],
};

export const VIEWS_TRIGGERS: Topic = {
  slug: "views-triggers-procedures",
  guided: true,
  title: "Views, triggers, stored procedures and generated columns",
  minutes: 24,
  story: "A restaurant kitchen: the recipe card (a view) is written once and every cook follows it; the bell that rings when an order lands (a trigger) fires whether or not anyone remembered to press it; the till that prints the line total itself (a generated column) cannot add up wrong; the prep station (a stored procedure) does heavy work next to the ingredients instead of carrying crates to the dining room.",
  tldr: [
    "A **view** is a saved query: change the rule once, every reader follows. It stores no rows.",
    "A **materialized view** stores the result; you refresh it. Instant reads, stale between refreshes.",
    "A **trigger** runs on every INSERT / UPDATE / DELETE from every writer: right for audit rows and invariants, wrong for business logic nobody can see.",
    "A **generated column** is a formula the table keeps correct itself.",
    "**Stored procedures** put logic next to the data: good for set-based batch work, poor for product rules that change weekly.",
  ],
  words: [
    ["view", "a named, saved SELECT that behaves like a table when read"],
    ["materialized view", "a view whose result is stored and refreshed on demand"],
    ["trigger", "code the database runs automatically before or after a write"],
    ["generated column", "a column defined by an expression over the row's other columns"],
    ["stored procedure / function", "code stored in the database, run with CALL or inside a query"],
  ],
  sections: [
    {
      title: "The order-total formula in fourteen places",
      analogy: "Fourteen cooks, each with their own copy of the recipe; the chef changes the salt and twelve copies stay wrong.",
      why: "A rule copied into many queries drifts; a view is the one copy.",
      ask: "Finance changes the rule: order totals must exclude cancelled orders. The formula `SUM(qty * unit_price)` joined to orders lives in fourteen queries across the API, two reports and a cron job. What single database object lets you change it once and have every reader follow?",
      body: "A **view**. `CREATE VIEW order_totals AS SELECT …` saves the query under a name. Readers write `SELECT * FROM order_totals`, and the database expands the saved query at run time, so the new rule applies everywhere the moment the view changes.\n\nA view stores no rows. It is not a cache; it is a macro with a schema. That is its strength (always current) and its cost (it does the work on every read).",
      sql: [
        { title: "Create the one copy", sql: `CREATE VIEW IF NOT EXISTS order_totals AS\nSELECT o.id AS order_id, o.customer_id, o.status, ROUND(SUM(oi.qty * oi.unit_price), 2) AS total\nFROM orders o JOIN order_items oi ON oi.order_id = o.id\nWHERE o.status <> 'cancelled'\nGROUP BY o.id;\n\nSELECT * FROM order_totals ORDER BY total DESC LIMIT 5;` },
        { title: "Readers never see the formula", sql: `SELECT c.name, ROUND(SUM(t.total), 2) AS revenue\nFROM customers c JOIN order_totals t ON t.customer_id = c.id\nGROUP BY c.id\nORDER BY revenue DESC\nLIMIT 5;` },
      ],
    },
    {
      title: "What a view is good for, and what it hides",
      analogy: "A window onto the kitchen: you see the dishes, not the knives.",
      why: "Views are the cheapest security and API layer a database has, and the easiest way to make a slow query look innocent.",
      body: "Good uses:\n\n- **one rule, one place**: the totals above\n- **hide columns**: `CREATE VIEW customers_public AS SELECT id, name, city FROM customers`, then grant access to the view, not the table\n- **a stable API** over a schema you are refactoring: rename the table, keep the view\n\nThe trap: a view over a view over a join looks like a table and costs like the whole query. `SELECT * FROM big_view WHERE id = 1` usually lets the planner push the filter inside, but aggregates, DISTINCT and window functions in the view can block that. EXPLAIN queries against views exactly as you would the raw SQL.\n\nWriting through a view works only for simple views (one table, no aggregates). For anything else, databases offer INSTEAD OF triggers.",
      sql: [{ title: "The planner sees through the view", sql: `SELECT * FROM order_totals WHERE customer_id = 3;`, explain: true, note: "Show plan: the filter reaches the orders table inside the view." }],
    },
    {
      title: "Materialized views: a saved result you refresh",
      analogy: "A photo of the kitchen: instant to look at, true as of when it was taken.",
      why: "Dashboards that aggregate millions of rows cannot recompute on every page load; a stored result is the fix and staleness is the price.",
      ask: "The revenue-per-customer view takes 4 seconds over 50 million order rows, and the dashboard calls it on every page load. No index can make it fast enough. What do you store, and what new question does your product manager have to answer?",
      body: "Store the result. A **materialized view** (Postgres) is the query's output kept as a real table, refreshed on demand or on a schedule. Reads are instant; the data is as old as the last refresh. The product question becomes 'how stale may it be?' Five minutes is fine for a revenue dashboard, not for a stock count at checkout.\n\nSQLite and MySQL have no built-in materialized views; you build the same thing with a table and a refresh statement, which is also the clearest way to understand what Postgres does under `REFRESH MATERIALIZED VIEW CONCURRENTLY`.",
      sql: [
        { title: "A materialized view by hand", sql: `CREATE TABLE IF NOT EXISTS customer_revenue_mv (customer_id INTEGER PRIMARY KEY, revenue REAL NOT NULL, refreshed_at TEXT NOT NULL);\nDELETE FROM customer_revenue_mv;\nINSERT INTO customer_revenue_mv\nSELECT customer_id, SUM(total), datetime('now') FROM order_totals GROUP BY customer_id;\n\nSELECT * FROM customer_revenue_mv ORDER BY revenue DESC LIMIT 5;` },
      ],
      code: [{ lang: "sql", title: "Postgres", src: `CREATE MATERIALIZED VIEW customer_revenue AS\nSELECT customer_id, SUM(total) AS revenue FROM order_totals GROUP BY customer_id;\nCREATE UNIQUE INDEX ON customer_revenue (customer_id);\n\n-- later, on a schedule, without blocking readers (needs the unique index):\nREFRESH MATERIALIZED VIEW CONCURRENTLY customer_revenue;` }],
    },
    {
      title: "Triggers: code that runs on every write",
      analogy: "The bell on the kitchen door: it rings for whoever walks through, cook or courier.",
      why: "Only a trigger runs for every writer, API, cron or admin console, which makes it the right tool for audit trails and the wrong one for logic nobody can see.",
      ask: "Compliance wants a record of every status change on orders: old value, new value, when. Three services and a support console all write to orders. Where do you put the code so that none of them can forget?",
      body: "In the database, as an **AFTER UPDATE trigger**. It fires inside the same transaction as the write, so the audit row and the change commit or roll back together, and it fires for every writer.\n\nRules of thumb:\n\n- triggers are for **invariants and records** (audit rows, updated_at, denormalised counters), not for sending emails or calling APIs\n- keep them tiny: they run per row, inside the write's transaction, on every write\n- document them where developers look, because nothing in the app code shows they exist\n- a trigger that writes to the table it watches can recurse; most databases stop it, some do not",
      sql: [
        { title: "An audit trail nobody can skip", sql: `CREATE TABLE IF NOT EXISTS order_status_log (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, old_status TEXT, new_status TEXT, changed_at TEXT NOT NULL);\nCREATE TRIGGER IF NOT EXISTS trg_order_status AFTER UPDATE OF status ON orders\nWHEN OLD.status IS NOT NEW.status\nBEGIN\n  INSERT INTO order_status_log (order_id, old_status, new_status, changed_at)\n  VALUES (NEW.id, OLD.status, NEW.status, datetime('now'));\nEND;\n\nUPDATE orders SET status = 'shipped' WHERE id = (SELECT MIN(id) FROM orders WHERE status = 'paid');\nUPDATE orders SET status = 'shipped' WHERE id = (SELECT MIN(id) FROM orders WHERE status = 'shipped');  -- no change, no log row\nSELECT * FROM order_status_log;`, note: "The WHEN clause skips updates that did not change the status." },
        { title: "A trigger that refuses a bad transition", sql: `CREATE TRIGGER IF NOT EXISTS trg_no_unship BEFORE UPDATE OF status ON orders\nWHEN OLD.status = 'shipped' AND NEW.status = 'pending'\nBEGIN\n  SELECT RAISE(ABORT, 'a shipped order cannot go back to pending');\nEND;\n\nUPDATE orders SET status = 'pending' WHERE status = 'shipped';`, note: "This one fails on purpose: RAISE(ABORT) rolls the statement back and the error is the feature." },
      ],
      code: [{ lang: "sql", title: "Postgres: the same trigger", src: `CREATE FUNCTION log_order_status() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN\n  IF OLD.status IS DISTINCT FROM NEW.status THEN\n    INSERT INTO order_status_log (order_id, old_status, new_status, changed_at)\n    VALUES (NEW.id, OLD.status, NEW.status, now());\n  END IF;\n  RETURN NEW;\nEND $$;\n\nCREATE TRIGGER trg_order_status AFTER UPDATE OF status ON orders\nFOR EACH ROW EXECUTE FUNCTION log_order_status();` }],
    },
    {
      title: "Generated columns: a formula the table keeps",
      analogy: "A till that prints the line total itself; nobody types it in.",
      why: "A stored total that someone forgets to update is a bug that looks like data; a generated column cannot drift.",
      ask: "order_items gets a `line_total` column so that reports stop multiplying. A support script updates qty and forgets line_total. What now shows the wrong number, and which feature makes forgetting impossible?",
      body: "Every report reading line_total is now wrong for that row, and nothing flags it. A **generated column** is defined as an expression: `line_total REAL GENERATED ALWAYS AS (qty * unit_price) STORED`. The database computes it on every write, and you cannot insert into it, so you cannot get it wrong.\n\nSTORED keeps the value on disk (space, fast reads, indexable). VIRTUAL computes on read (SQLite's default). Postgres supports STORED; MySQL supports both.\n\nA generated column cannot look at other tables or call non-deterministic functions. For cross-table facts you are back to triggers or the application.",
      sql: [
        { title: "A column that computes itself", sql: `CREATE TABLE IF NOT EXISTS invoice_lines (\n  id INTEGER PRIMARY KEY,\n  qty INTEGER NOT NULL CHECK (qty > 0),\n  unit_price REAL NOT NULL,\n  line_total REAL GENERATED ALWAYS AS (qty * unit_price) STORED\n);\nINSERT INTO invoice_lines (qty, unit_price) VALUES (3, 19.99), (1, 250);\nUPDATE invoice_lines SET qty = 4 WHERE id = 1;\nSELECT * FROM invoice_lines;`, note: "qty changed, line_total followed. Try inserting a line_total yourself: the database refuses." },
      ],
    },
    {
      title: "Stored procedures and functions: logic next to the data",
      analogy: "The prep station inside the kitchen: chopping ten crates of onions is faster there than carrying each crate to the dining room and back.",
      why: "Interviewers ask where logic should live; the honest answer is 'set-based data work in the database, product rules in the app', and you need to say why.",
      body: "A **function** returns a value and can be used inside queries (`SELECT slugify(name)`). A **procedure** runs statements and can manage transactions (`CALL archive_old_orders(…)`). Postgres writes both in SQL or PL/pgSQL; MySQL has its own dialect; SQLite has neither, only functions the host application registers.\n\n| Put it in the database when | Keep it in the app when |\n|---|---|\n| it touches millions of rows in one set-based statement | it changes weekly with the product |\n| every writer must get the same answer (like a trigger) | it needs HTTP calls, queues, feature flags |\n| the data must not leave the server (compliance) | you want unit tests, code review and deploys as usual |\n\nTeams that put everything in procedures end up with logic nobody can test or deploy safely; teams that put nothing there round-trip gigabytes to compute a sum. The middle: views and generated columns for shape, a few procedures for batch work, the app for rules.",
      code: [{ lang: "sql", title: "Postgres: a function used in a query, and a procedure for batch work", src: `CREATE FUNCTION order_total(p_order_id BIGINT) RETURNS NUMERIC LANGUAGE sql STABLE AS $$\n  SELECT COALESCE(SUM(qty * unit_price), 0) FROM order_items WHERE order_id = p_order_id\n$$;\nSELECT id, order_total(id) FROM orders LIMIT 5;\n\nCREATE PROCEDURE archive_old_orders(before DATE) LANGUAGE plpgsql AS $$\nBEGIN\n  INSERT INTO orders_archive SELECT * FROM orders WHERE ordered_at < before;\n  DELETE FROM orders WHERE ordered_at < before;\n  COMMIT;\nEND $$;\nCALL archive_old_orders('2024-01-01');` }],
    },
    {
      title: "Connect it back: fourteen copies became one",
      analogy: "One recipe card, one bell, a till that adds up.",
      why: "Each object answers one question: where does the rule live, who must obey it, who keeps the number right.",
      body: "The totals rule moved into a view, so finance's change happened once. The status audit became a trigger, so no service can forget it. The line total became a generated column, so no script can get it wrong. And the heavy archive job became a procedure that runs where the rows are.\n\n| Need | Object |\n|---|---|\n| one definition of a derived result | view |\n| that result, precomputed | materialized view |\n| something that must happen on every write | trigger |\n| a per-row formula that must never drift | generated column |\n| set-based batch logic near the data | procedure / function |",
    },
  ],
  realWorld: [
    {
      title: "updated_at that is always right",
      problem: "Every table has updated_at, and half the rows are wrong because some code path forgets to set it.",
      whyHard: "The column is maintained by convention, and conventions have gaps: the admin console, a migration script, a bulk UPDATE.",
      steps: ["A BEFORE UPDATE trigger (Postgres) or AFTER UPDATE trigger (SQLite) sets updated_at from the clock.", "Every writer, including raw SQL, now maintains it.", "Keep the trigger tiny and documented next to the schema."],
      sql: `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')));\nCREATE TRIGGER IF NOT EXISTS trg_notes_updated AFTER UPDATE ON notes\nBEGIN\n  UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id AND updated_at IS OLD.updated_at;\nEND;\nINSERT INTO notes (body, updated_at) VALUES ('first', '2020-01-01 00:00:00');\nUPDATE notes SET body = 'edited' WHERE id = 1;\nSELECT * FROM notes;`,
      takeaway: "Facts every writer must maintain belong in a trigger or a generated column, not in a convention.",
    },
  ],
  practice: [
    {
      q: "Create a view paid_orders (orders with status 'paid') and show the three customers with the most paid orders.",
      answer: "Aarav Mehta 3, Liam Walker 2, Olivia Brown 2.",
      explain: "CREATE VIEW, then a normal GROUP BY query against it.",
      sql: `CREATE VIEW IF NOT EXISTS paid_orders AS SELECT * FROM orders WHERE status = 'paid';\nSELECT c.name, COUNT(*) AS paid_orders\nFROM paid_orders p JOIN customers c ON c.id = p.customer_id\nGROUP BY c.id\nORDER BY paid_orders DESC, c.name\nLIMIT 3;`,
    },
    {
      q: "Add a trigger that records deleted products in deleted_products(id, name, deleted_at). Delete the Gift Card, then show the log.",
      answer: "One row: Gift Card with a deleted_at timestamp.",
      explain: "An AFTER DELETE trigger reads OLD.* and inserts the record; the Gift Card has no order rows, so the delete is allowed.",
      sql: `CREATE TABLE IF NOT EXISTS deleted_products (id INTEGER, name TEXT, deleted_at TEXT);\nCREATE TRIGGER IF NOT EXISTS trg_product_delete AFTER DELETE ON products\nBEGIN\n  INSERT INTO deleted_products VALUES (OLD.id, OLD.name, datetime('now'));\nEND;\nDELETE FROM products WHERE name = 'Gift Card';\nSELECT id, name FROM deleted_products;`,
    },
    {
      q: "Create quotes(qty, unit_price) with a generated total, insert two rows, and show them with the total.",
      answer: "Two rows whose total column equals qty × unit_price without you writing it.",
      explain: "GENERATED ALWAYS AS (qty * unit_price) STORED; insert only qty and unit_price.",
      sql: `CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY, qty INTEGER NOT NULL, unit_price REAL NOT NULL, total REAL GENERATED ALWAYS AS (qty * unit_price) STORED);\nINSERT INTO quotes (qty, unit_price) VALUES (2, 49.5), (10, 3.2);\nSELECT * FROM quotes;`,
    },
  ],
  interview: [
    { level: "junior", q: "What is the difference between a view and a table?", a: "A table stores rows; a view stores a query. Reading a view runs that query, so it is always current and costs what the query costs. Views exist to define a derived result once, to hide columns, and to give a stable name to something whose underlying tables may change." },
    { level: "mid", tricky: true, q: "A query against a view is slow. Is the view's result cached?", a: "No. A plain view is expanded into the reader's query every time; nothing is stored. If it is slow, EXPLAIN the query as if you had written the SQL inline: usually a missing index or an aggregate that stops the planner pushing the filter down. If the result may be stale for a while, a materialized view stores it and you refresh on a schedule." },
    { level: "mid", q: "Materialized view vs a cache in Redis?", a: "Both store a precomputed result. The materialized view lives in the database, is queryable with SQL, joins with other tables and is refreshed with one statement, transactionally. Redis is faster for a single key lookup, lives next to the app, and expires keys. For a reporting rollup I use the materialized view; for a per-user hot value on every request I use Redis." },
    { level: "mid", tricky: true, q: "Stored procedures are precompiled, so should all business logic move into them for speed?", a: "No. The speed win is real only for set-based work on many rows, where avoiding round trips matters. Business rules change often and need tests, code review, versioning and deploys; procedures make all of that harder and tie you to one database dialect. I keep rules in the application, views and generated columns for shape, and a few procedures for batch jobs." },
    { level: "senior", q: "What goes wrong with triggers at scale?", a: "They run per row inside the write's transaction, so a bulk update of a million rows runs the trigger a million times and holds locks the whole time. They are invisible in application code, so people are surprised by side effects. They can cascade and recurse. And a trigger that calls out, to an email service or an API, blocks the transaction on the network. I limit triggers to audit rows, updated_at and simple invariants." },
    { level: "mid", q: "Can you put an index on a view?", a: "Not on a plain view; it has no rows. Indexes on the underlying tables are what the view's query uses. A materialized view can be indexed like a table, and a unique index is required for REFRESH … CONCURRENTLY in Postgres. SQL Server's indexed views are a different feature that keeps the result maintained automatically." },
    { level: "junior", q: "Generated column or trigger for a value like line_total?", a: "Generated column when the value depends only on the row's own columns: the database computes it, nobody can write it, and it can be indexed. A trigger when the value needs other tables or a clock, like updated_at or a denormalised count on the parent." },
    { level: "mid", q: "What is an INSTEAD OF trigger, and when do you need it?", a: "A trigger on a view that replaces an INSERT, UPDATE or DELETE against the view with your own statements against the base tables. You need it when the view joins or aggregates, so the database cannot map the write back to one table by itself. It lets an old API keep writing to a 'table' that is now a view over a refactored schema." },
    { level: "senior", q: "How do you refresh a materialized view without downtime, and what are the alternatives?", a: "In Postgres, REFRESH MATERIALIZED VIEW CONCURRENTLY, which needs a unique index and swaps rows without taking an exclusive lock; readers keep seeing the old version. The alternatives are incremental maintenance: a summary table updated by triggers or by the application on each write, or a rollup table recomputed only for the changed day. Pick by how fresh the data must be and how expensive the full recompute is." },
    { level: "mid", tricky: true, q: "Why should a trigger never call an external API?", a: "Because it runs inside the write's transaction. The row lock is held while the HTTP call waits, so a slow API slows every writer; if the API succeeds and the transaction then rolls back, the email was sent for a change that never happened. Write an outbox row in the trigger or the application, and let a worker make the call after commit." },
  ],
  remember: [
    "View = saved query, not saved rows. Materialized view = saved rows, refreshed.",
    "Trigger = runs for every writer, inside the transaction. Audit and invariants, never network calls.",
    "Generated column = formula the row keeps. Cannot drift.",
    "Procedures for set-based batch work near the data; rules stay in the app.",
  ],
};
