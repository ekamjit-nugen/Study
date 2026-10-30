import type { Module } from "../types";

export const M01: Module = {
  id: "foundations",
  title: "Foundations",
  simple: "What a database really is, how a query travels, and the three ideas (tables, keys, types) everything else is built on.",
  topics: [
    {
      slug: "what-is-a-database",
      title: "What a database is, and why not just files",
      minutes: 12,
      story: "A pile of paper on a desk is data. A library is a database: every book has a place, a catalogue finds it in seconds, two people can borrow different books at once, and nobody can tear out half a page and walk off.",
      tldr: [
        "A database is a program that stores data **and makes promises**: many users at once, all-or-nothing changes, fast lookups, and rules about what is allowed.",
        "SQL is **declarative**: you say what rows you want; the database decides how to find them.",
        "Your query travels: app → driver → server (parse, plan, execute) → pages in RAM → disk.",
        "Relational databases (Postgres, MySQL) are the default. Pick something else only for a measured reason.",
      ],
      words: [
        ["DBMS", "the software (Postgres, MySQL, SQLite) that manages databases"],
        ["query", "a request for data or a change, written in SQL"],
        ["transaction", "a group of changes that succeed or fail together"],
        ["schema", "the shape of your data: tables, columns, types, rules"],
        ["declarative", "you describe the result, not the steps"],
      ],
      sections: [
        {
          title: "The four promises a file cannot keep",
          analogy: "A shared notebook on a desk: two people write at once and overwrite each other, a spilled coffee ruins half a page, and finding one name means flipping every page. A library fixes all four: a desk clerk, a catalogue, and rules about what goes on the shelf.",
          why: "Without these promises your app loses sales, double-charges, or slows to a crawl the day it gets busy.",
          body: "A JSON file or a spreadsheet works for one person and a thousand rows. It breaks the moment you have two writers, a crash, a million rows, or bad input.",
          diagram: "whyDb",
          bullets: [
            "**Concurrency:** two requests update the same record at the same time. With a file, the last save wins and the other change is silently lost.",
            "**Atomicity:** a crash halfway through writing a file leaves half-written garbage. A transaction is all or nothing.",
            "**Speed at scale:** a file search reads everything. An index finds one row in a few page reads, whether you have 1,000 rows or 1,000,000,000.",
            "**Rules:** a database refuses a price of `'abc'`, an order for a customer that does not exist, or two users with the same email.",
          ],
        },
        {
          title: "What happens when you run a query",
          analogy: "Ordering food: you tell the waiter (driver) what you want, the kitchen (server) decides how to cook it (planner), and the pantry (disk) is only opened when the fridge (RAM cache) does not have it.",
          why: "When something is slow, you need to know which of these steps is slow before you can fix it.",
          body: "Your Node code never touches a file. It opens a network connection and sends SQL text. The server does the real work.",
          diagram: "clientServer",
          bullets: [
            "**Driver / pool:** keeps a few connections open and lends them out, because opening one costs tens of milliseconds.",
            "**Parser:** checks syntax and turns text into a tree.",
            "**Planner:** compares ways to answer (scan the table? use an index? which join order?) and picks the cheapest estimate.",
            "**Executor:** runs the plan, reading pages from the buffer pool (RAM) or from disk.",
            "**Storage:** data lives in fixed-size pages; changes are logged first (WAL) so a crash loses nothing that was committed.",
          ],
          tip: "Every performance topic later is about one of these boxes: fewer round trips (pool), a better plan (indexes, statistics), fewer pages touched (covering indexes, partitioning).",
        },
        {
          title: "SQL is declarative: say what, not how",
          analogy: "Telling a taxi driver 'the airport' instead of turn-by-turn directions. The driver picks the route, and a better route tomorrow needs no new instructions from you.",
          why: "This is why adding an index speeds up code you never touched, and why you should describe results, not steps.",
          visual: {"kind": "flow", "steps": [{"label": "You: WHAT", "sub": "SELECT name … WHERE country='India'", "tone": "accent"}, {"label": "Parser", "sub": "checks syntax"}, {"label": "Planner: HOW", "sub": "index seek or full scan? (its choice)", "tone": "warn"}, {"label": "Executor", "sub": "runs the plan"}, {"label": "rows", "sub": "sorted names", "tone": "ok"}], "caption": "Add an index tomorrow and the same query gets faster with no code change: only the HOW changed."},
          body: "In JavaScript you loop. In SQL you describe the result. The same question in both:",
          code: [
            {
              lang: "js",
              title: "JavaScript: you write the HOW",
              src: `const result = [];
for (const c of customers) {
  if (c.country === "India") result.push(c.name);
}
result.sort();`,
            },
          ],
          sql: [
            {
              title: "SQL: you write the WHAT (press Run)",
              sql: `SELECT name
FROM customers
WHERE country = 'India'
ORDER BY name;`,
              note: "The database chooses whether to scan every row or jump through an index. You only described the answer.",
            },
          ],
        },
        {
          title: "Meet the playground data",
          analogy: "A toy shop with a dozen customers and a handful of products: small enough to check every answer by hand.",
          why: "Every example in this course runs on this data, so you can always see where a number came from.",
          body: "Every example in this course runs against a small online shop. It is a real SQLite database living in your browser, so you can change anything and press Reset data to start over.",
          diagram: "erd",
          sql: [
            {
              title: "Look around",
              sql: `SELECT name AS table_name FROM sqlite_master WHERE type = 'table' ORDER BY name;`,
            },
            {
              title: "A few orders with their customer",
              sql: `SELECT o.id, c.name, o.ordered_at, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.ordered_at
LIMIT 5;`,
            },
          ],
        },
        {
          title: "The family of databases, in one table",
          analogy: "A toolbox: a spanner fits most bolts (relational), a power drill is perfect for one job (document store), a magnet grabs screws instantly (Redis).",
          why: "Picking the wrong tool early costs months; picking the spanner first is almost never wrong.",
          table: {
            head: ["Kind", "Examples", "Shape", "Reach for it when"],
            rows: [
              ["Relational (SQL)", "Postgres, MySQL, SQLite, SQL Server", "tables, rows, joins", "almost always; it is the default"],
              ["Document", "MongoDB, Firestore", "JSON documents", "shape varies a lot and you read whole documents"],
              ["Key-value", "Redis, DynamoDB", "key → value", "caching, sessions, counters, queues"],
              ["Wide-column", "Cassandra, ScyllaDB", "rows with many sparse columns", "huge write volume, known query patterns"],
              ["Search", "Elasticsearch, OpenSearch", "inverted index", "full-text search, log analytics"],
              ["Graph", "Neo4j", "nodes and edges", "deep relationship queries (friends of friends)"],
              ["Time-series", "TimescaleDB, InfluxDB", "timestamped rows", "metrics, IoT"],
            ],
          },
          tip: "Interview answer in one line: 'Start with Postgres. Add a specialised store when a measured need appears, and keep Postgres as the source of truth.'",
        },
      ],
      realWorld: [
        {
          title: "The CSV inventory that lost sales on Black Friday",
          problem: "A small shop stores stock counts in a CSV that the web app reads, decrements and rewrites. On a busy day, two customers bought the last keyboard and stock went to −1.",
          whyHard: "It looks like a logic bug, but the code is correct for one user. The failure only appears when two requests interleave: both read 1, both write 0, one of them should have been refused.",
          steps: [
            "Name the real problem: a **read-then-write race**. Two readers saw the same value.",
            "A file cannot help; it has no notion of 'this change depends on what I read'. A database can.",
            "Move the counter into a table and make the decrement **one atomic statement** with a condition: `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1`.",
            "Check the number of rows updated. 1 = sold. 0 = refuse the sale. No lock in your code, no race.",
          ],
          sql: `-- Two customers try to buy product 3 (15 in stock). Run this twice: the second run shows 14 → 13.
UPDATE products SET stock = stock - 1 WHERE id = 3 AND stock >= 1;
SELECT id, name, stock FROM products WHERE id = 3;`,
          takeaway: "Let the database do the compare-and-set. A conditional UPDATE is atomic; your read-then-write in JavaScript is not.",
        },
      ],
      practice: [
        {
          q: "List the name and city of every customer from the UK, sorted by name.",
          answer: "Two rows: Emma Clarke (Manchester) and Liam Walker (London).",
          explain: "WHERE keeps only UK rows; ORDER BY name sorts them.",
          sql: `SELECT name, city FROM customers WHERE country = 'UK' ORDER BY name;`,
          starter: `SELECT name, city\nFROM customers\nWHERE ...`,
        },
        {
          q: "How many products cost more than 100?",
          answer: "3 (Noise-Cancelling Headphones, Standing Desk, Ergonomic Chair).",
          explain: "COUNT(*) counts the rows that survive the WHERE filter.",
          sql: `SELECT COUNT(*) FROM products WHERE price > 100;`,
        },
        {
          q: "Why is a conditional UPDATE safer than reading the stock in Node and then writing it back?",
          answer: "Because the database runs the whole UPDATE as one atomic step under a row lock. Two concurrent updates are serialised, and the WHERE condition is re-checked against the latest value.",
          explain: "In Node, the time between your SELECT and your UPDATE is a window where another request can change the row.",
        },
      ],
      interview: [
        { level: "junior", q: "What is a database and how is it different from a file?", a: "A database is software that stores data and guarantees things a file cannot: many users can read and write at once without losing changes, a group of changes is applied completely or not at all, lookups stay fast through indexes, and rules like 'email must be unique' are enforced. A file gives you none of that." },
        { level: "junior", q: "What does it mean that SQL is declarative?", a: "I describe the rows I want, not the steps to get them. The database's planner chooses the algorithm, for example whether to use an index or scan the table. That lets the same query get faster when I add an index, without changing code." },
        { level: "mid", q: "Walk me through what happens when my Node app runs a SELECT.", a: "The driver takes a connection from the pool and sends the SQL text over TCP. The server parses it, the planner estimates the cost of candidate plans using table statistics and picks the cheapest, and the executor runs it, reading pages from the buffer pool or disk. Rows stream back and the connection returns to the pool." },
        { level: "mid", q: "When would you not use a relational database?", a: "When I have a measured need it does not meet: a cache with microsecond reads (Redis), full-text search (Elasticsearch), or write volume far beyond a single primary (Cassandra). Even then I keep Postgres as the source of truth and treat the other store as derived data." },
      ],
      remember: [
        "A database = storage + promises (concurrency, atomicity, indexes, rules).",
        "SQL says WHAT; the planner decides HOW.",
        "Query path: app → pool → parse → plan → execute → buffer pool → disk.",
        "Default to Postgres; add other stores for measured needs.",
      ],
    },

    {
      slug: "tables-keys-relationships",
      title: "Tables, keys and relationships",
      minutes: 18,
      story: "A passport number identifies one person. Your visa points at that passport number. If the passport does not exist, the visa is meaningless. That is a primary key, a foreign key, and referential integrity.",
      tldr: [
        "A **row** is one thing; a **column** is one fact about it; a **primary key (PK)** names the row.",
        "A **foreign key (FK)** is a column that must match a PK in another table. The database refuses orphans.",
        "Three shapes: **1:1**, **1:N** (the N side holds the FK) and **M:N** (needs a join table).",
        "**NULL** means unknown. It is not 0 or empty, and `NULL = NULL` is not true.",
      ],
      words: [
        ["primary key", "the column(s) that uniquely identify a row, never NULL"],
        ["foreign key", "a column that must match a primary key in another table"],
        ["referential integrity", "the rule that every foreign key points at a real row"],
        ["join table", "a table whose job is to connect two others (many-to-many)"],
        ["surrogate key", "an id the database invents (serial, UUID) with no business meaning"],
      ],
      sections: [
        {
          title: "Anatomy of a table",
          analogy: "A class register: one line per student (row), one column per fact (name, roll number), and the roll number never repeats (primary key).",
          why: "Every later idea, joins, indexes, constraints, is built on rows, columns and keys.",
          diagram: "tableAnatomy",
          body: "Think of a table as a typed spreadsheet with a rule book. The primary key is the one column (or set of columns) the database promises is unique and present.",
        },
        {
          title: "Three relationship shapes",
          analogy: "A person has one passport (1:1), a mother has many children (1:N), and students take many courses while courses have many students (M:N, needs a timetable in between).",
          why: "Pick the wrong shape and you end up with comma-separated lists in a cell that nobody can query.",
          diagram: "relationships",
          bullets: [
            "**1:N** is the workhorse. A customer has many orders, so `orders.customer_id` holds the FK. The customer row stores nothing about orders.",
            "**M:N** needs a third table because a column cannot hold 'many'. `product_tags(product_id, tag)` with a composite PK on both columns.",
            "**1:1** is usually one table. Split it when some columns are optional, huge, or need different permissions (user vs user_private).",
          ],
          sql: [
            {
              title: "Many-to-many in action: products and their tags",
              sql: `SELECT p.name, GROUP_CONCAT(t.tag, ', ') AS tags
FROM products p
JOIN product_tags t ON t.product_id = p.id
GROUP BY p.id
ORDER BY p.name;`,
              note: "GROUP_CONCAT is SQLite. Postgres uses STRING_AGG(tag, ', '), MySQL uses GROUP_CONCAT too.",
            },
          ],
        },
        {
          title: "Foreign keys: the database refuses nonsense",
          analogy: "A visa that references a passport number: if the passport does not exist, the visa is rejected at the counter.",
          why: "Without this rule you get orders for customers who do not exist and reports that do not add up.",
          visual: {"kind": "flow", "steps": [{"label": "INSERT order", "sub": "customer_id = 404", "tone": "accent"}, {"label": "FK check", "sub": "is there a customers.id = 404?", "tone": "warn"}, {"label": "✗ rejected", "sub": "FOREIGN KEY constraint failed", "tone": "bad"}], "caption": "Delete a customer who has orders: RESTRICT refuses, CASCADE deletes the orders, SET NULL orphans them on purpose."},
          body: "Try to create an order for a customer that does not exist. The database says no. That one rule prevents a whole class of bugs.",
          sql: [
            {
              title: "This fails on purpose",
              sql: `INSERT INTO orders (id, customer_id, ordered_at, status)
VALUES (999, 404, '2025-07-01 10:00:00', 'paid');`,
              note: "FOREIGN KEY constraint failed. Customer 404 does not exist, so the order is rejected.",
            },
            {
              title: "ON DELETE CASCADE: deleting an order removes its items",
              sql: `DELETE FROM orders WHERE id = 7;
SELECT COUNT(*) AS items_left FROM order_items WHERE order_id = 7;`,
              note: "order_items was declared with ON DELETE CASCADE. Other options: RESTRICT (refuse), SET NULL. Press Reset data to bring order 7 back.",
            },
          ],
          warn: "Cascade is convenient and dangerous. Deleting a customer with CASCADE on orders could wipe financial history. Prefer RESTRICT for anything money-related and soft-delete instead.",
        },
        {
          title: "NULL: the three-valued logic trap",
          analogy: "A form field left blank. It is not zero and not an empty answer; it is 'we do not know'. You cannot say 'unknown equals unknown'.",
          why: "Almost every 'my WHERE returns nothing' bug is a NULL compared with =.",
          diagram: "nullLogic",
          body: "NULL is 'unknown'. Any comparison with unknown is unknown, and WHERE only keeps rows where the condition is true.",
          sql: [
            {
              title: "Why `= NULL` never matches",
              sql: `SELECT
  (NULL = NULL)       AS eq,        -- NULL, not 1
  (NULL IS NULL)      AS is_null,   -- 1
  (1 + NULL)          AS plus,      -- NULL
  COALESCE(NULL, 'x') AS fallback;  -- 'x'`,
            },
            {
              title: "COUNT(*) vs COUNT(column)",
              sql: `SELECT COUNT(*) AS all_rows, COUNT(manager_id) AS with_manager
FROM employees;`,
              note: "COUNT(col) skips NULLs. The CEO has no manager, so with_manager is 9.",
            },
          ],
          tip: "Use `IS NULL` / `IS NOT NULL`, wrap with `COALESCE`, and remember `NOT IN (subquery)` returns nothing if the subquery contains a NULL. Use `NOT EXISTS` instead.",
        },
        {
          title: "Choosing a primary key",
          analogy: "Numbering tickets at a counter: sequential numbers are easy to file in order; random numbers mean filing each ticket somewhere new in the drawer.",
          why: "Random ids quietly slow every insert and bloat every index as the table grows.",
          diagram: "pkChoice",
          table: {
            head: ["Option", "Pros", "Cons", "Use when"],
            rows: [
              ["Auto-increment integer (serial / bigserial)", "small, fast, index-friendly, sortable", "guessable; hard to merge across shards", "default for internal tables"],
              ["UUID v4", "generate anywhere, unguessable", "16 bytes, random order hurts B-tree inserts and cache", "ids exposed publicly, offline creation"],
              ["UUID v7 / ULID", "time-ordered + unique anywhere", "newer, needs library support", "best of both for distributed systems"],
              ["Natural key (email, ISBN)", "no extra column", "changes over time, can be NULL, multi-column", "rarely; add a surrogate and a UNIQUE constraint instead"],
            ],
          },
          more: "Why random UUIDs hurt: a B-tree index keeps keys sorted. Sequential ids always append to the rightmost leaf page, which stays hot in cache. Random ids land on random pages, so inserts touch and split pages all over the index. InnoDB (MySQL) stores the whole table in PK order, so the pain is even bigger there. UUID v7 puts a timestamp in the high bits, restoring locality.",
        },
      ],
      realWorld: [
        {
          title: "Design the tables for a course platform",
          problem: "Students enrol in courses. A course has many lessons. A student can finish a lesson. Teachers own courses. The PM asks: 'which students finished more than half of a course?'",
          whyHard: "Four nouns, three relationship shapes, and the question needs a count against a count. Beginners put a `lessons_done` JSON column on students and then cannot query it.",
          steps: [
            "List nouns → tables: `students`, `teachers`, `courses`, `lessons`.",
            "List verbs → relationships: teacher **owns** course (1:N, `courses.teacher_id`), course **has** lessons (1:N, `lessons.course_id`), student **enrols in** course (M:N → `enrolments(student_id, course_id)`), student **finishes** lesson (M:N → `lesson_completions(student_id, lesson_id, done_at)`).",
            "Every M:N table gets a composite primary key so the same pair cannot be inserted twice.",
            "The question is then two counts per (student, course): completed lessons vs total lessons, compared with `HAVING`.",
          ],
          code: {
            lang: "sql",
            title: "Schema (Postgres flavour)",
            src: `CREATE TABLE courses  (id bigserial PRIMARY KEY, title text NOT NULL, teacher_id bigint NOT NULL REFERENCES teachers(id));
CREATE TABLE lessons  (id bigserial PRIMARY KEY, course_id bigint NOT NULL REFERENCES courses(id), title text NOT NULL);
CREATE TABLE enrolments (student_id bigint REFERENCES students(id), course_id bigint REFERENCES courses(id),
                         enrolled_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (student_id, course_id));
CREATE TABLE lesson_completions (student_id bigint REFERENCES students(id), lesson_id bigint REFERENCES lessons(id),
                         done_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (student_id, lesson_id));

-- students who finished more than half of a course
SELECT e.student_id, e.course_id
FROM enrolments e
JOIN lessons l ON l.course_id = e.course_id
LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.student_id = e.student_id
GROUP BY e.student_id, e.course_id
HAVING COUNT(lc.lesson_id) * 2 > COUNT(l.id);`,
          },
          takeaway: "Nouns become tables, verbs become relationships, and every many-to-many becomes a join table with a composite primary key.",
        },
      ],
      practice: [
        {
          q: "Find every product that has no tag at all.",
          answer: "One row: Gift Card (id 11) has no tags.",
          explain: "LEFT JOIN keeps products with no match; the WHERE t.product_id IS NULL filter keeps only those. This pattern is called an anti-join.",
          sql: `SELECT p.id, p.name
FROM products p
LEFT JOIN product_tags t ON t.product_id = p.id
WHERE t.product_id IS NULL;`,
          starter: `SELECT p.id, p.name\nFROM products p\nLEFT JOIN product_tags t ON ...\nWHERE ...`,
        },
        {
          q: "List each employee with their manager's name (the CEO should still appear).",
          answer: "10 rows; Meera Iyer has manager NULL.",
          explain: "A self-join: the same table twice with different aliases. LEFT keeps the CEO, who has no manager row to match.",
          sql: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;`,
          starter: `SELECT e.name AS employee, m.name AS manager\nFROM employees e\n... JOIN employees m ON ...\nORDER BY e.id;`,
        },
        {
          q: "Which is the better primary key for a public `invoices` table: an auto-increment integer or a UUID? Why?",
          answer: "For a public id, a UUID (ideally v7/ULID) so customers cannot enumerate invoices by guessing the next number. Internally, an integer PK with a separate unique public_id column is also common.",
          explain: "Auto-increment ids leak counts and allow enumeration; random ids fix that at the cost of index locality, which time-ordered UUIDs recover.",
        },
      ],
      interview: [
        { level: "junior", q: "What is the difference between a primary key, a unique key and a foreign key?", a: "A primary key uniquely identifies a row, cannot be NULL, and there is one per table. A unique constraint also forbids duplicates but allows NULLs and you can have several. A foreign key is a column that must match a primary or unique key in another table, so the database refuses orphan rows." },
        { level: "junior", q: "How do you model a many-to-many relationship?", a: "With a join table that holds one foreign key to each side and a composite primary key on both, for example product_tags(product_id, tag_id). Any attribute of the relationship itself, like when it was created, lives in that table." },
        { level: "mid", q: "Why does WHERE email = NULL return nothing?", a: "NULL means unknown, and comparing anything with unknown gives unknown, not true. WHERE keeps only true rows. You have to write IS NULL. The same logic makes NOT IN return no rows if the list contains a NULL, which is why I prefer NOT EXISTS." },
        { level: "senior", q: "Integer ids or UUIDs for primary keys?", a: "Integers are smaller and insert sequentially, which keeps B-tree pages hot and InnoDB clustered tables compact. Random UUID v4 scatters inserts and bloats indexes. If I need ids generated by clients or across shards, or unguessable public ids, I use UUID v7 or ULID, which are time-ordered, so I get locality back." },
      ],
      remember: [
        "PK names the row; FK points at a PK; the DB refuses orphans.",
        "1:N → FK on the N side. M:N → join table with composite PK.",
        "NULL is unknown: use IS NULL, COALESCE, NOT EXISTS.",
        "Sequential ids are index-friendly; random UUIDs are not; UUID v7 fixes it.",
      ],
    },

    {
      slug: "data-types-and-constraints",
      title: "Data types and constraints",
      minutes: 14,
      story: "A form with a free-text 'age' box gets 'twenty', '25 years' and '-3'. A form with a number box from 0 to 120 gets numbers. Types and constraints are that number box, enforced by the database for every app that will ever touch the data.",
      tldr: [
        "Types are rules: the wrong type lets garbage in and makes indexes useless.",
        "**Money is DECIMAL/NUMERIC, never FLOAT.** Floats cannot represent 0.1 exactly.",
        "Store time as **timestamptz in UTC**; convert for display only.",
        "Constraints (NOT NULL, UNIQUE, CHECK, FK) are the last line of defence; the app is the first.",
      ],
      words: [
        ["NUMERIC / DECIMAL", "an exact number with a fixed number of decimal places"],
        ["timestamptz", "a point in time stored in UTC, shown in any time zone"],
        ["CHECK constraint", "a rule a row must pass, like price >= 0"],
        ["enum", "a column allowed to hold only a fixed list of values"],
        ["JSONB", "Postgres's binary JSON column type, indexable"],
      ],
      sections: [
        {
          title: "Numbers: the float trap",
          analogy: "Writing one third as 0.33: close, but add it three times and you get 0.99, not 1. Floats do the same with 0.1.",
          why: "Money stored as float drifts by paise until finance notices.",
          diagram: "floatTrap",
          sql: [
            {
              title: "Floats lie about money",
              sql: `SELECT 0.1 + 0.2 AS float_sum,
       0.1 + 0.2 = 0.3 AS equal_q,
       ROUND(0.1 + 0.2, 2) AS rounded;`,
              note: "0.30000000000000004. Add a million of these and the ledger is off by rupees. SQLite has no DECIMAL type, so it shows the problem; Postgres NUMERIC(12,2) and MySQL DECIMAL(12,2) do not.",
            },
          ],
          table: {
            head: ["Need", "Postgres", "MySQL", "Why"],
            rows: [
              ["counts, ids", "integer / bigint", "INT / BIGINT", "bigint for anything that can pass 2 billion"],
              ["money", "numeric(12,2)", "DECIMAL(12,2)", "exact; or store integer paise/cents"],
              ["measurements", "double precision", "DOUBLE", "approximate is fine for sensor data"],
              ["yes/no", "boolean", "TINYINT(1)", "MySQL has no real boolean"],
            ],
          },
        },
        {
          title: "Text, dates and time zones",
          analogy: "Saying 'meet at 9' to a friend in another country without saying whose 9. Store the moment in one agreed clock (UTC) and translate when you show it.",
          why: "Wrong zone handling moves appointments by hours and corrupts reports across countries.",
          visual: {"kind": "flow", "steps": [{"label": "user in Kolkata", "sub": "types 09:00 IST", "tone": "accent"}, {"label": "timestamptz", "sub": "stored as 03:30 UTC", "tone": "ok"}, {"label": "user in London", "sub": "sees 04:30 BST", "tone": "accent"}], "caption": "Plain timestamp (no zone) stores '09:00' with no idea where that was: the classic 'meeting moved by 5.5 hours' bug."},
          bullets: [
            "**text vs varchar(n):** in Postgres they are the same speed. Use `text` plus a CHECK for length if you need a limit. In MySQL, VARCHAR(255) is a real limit.",
            "**timestamptz** (Postgres) stores UTC and converts on the way in and out. Plain `timestamp` has no zone and causes the classic 'meeting moved by 5.5 hours' bug.",
            "**date** for birthdays and due dates with no time of day; never store those as timestamps.",
            "Store what the user typed only if you need it (a `local_time` + `tz_name` pair for 'every Monday at 9am in Kolkata').",
          ],
          sql: [
            {
              title: "Date maths (SQLite flavour)",
              sql: `SELECT ordered_at,
       date(ordered_at)                    AS day,
       strftime('%Y-%m', ordered_at)       AS month,
       date(ordered_at, '+30 days')        AS due,
       julianday('2025-06-01') - julianday(date(ordered_at)) AS days_ago_on_jun1
FROM orders
WHERE id IN (1, 24);`,
              note: "Postgres: date_trunc('month', ordered_at), ordered_at + interval '30 days', now() - ordered_at.",
            },
          ],
        },
        {
          title: "Constraints: rules the database enforces for everyone",
          analogy: "A bouncer at the door checks every guest, not just the ones who came through the main entrance. App validation is a friendly host; the constraint is the bouncer.",
          why: "Cron jobs, scripts and admin tools bypass your API; only constraints stop bad data from all of them.",
          diagram: "defenceLayers",
          body: "Your API validates input. Then a cron job, a migration script and an admin console also write to the table. Constraints are the only check that covers all of them.",
          sql: [
            {
              title: "CHECK refuses a negative price",
              sql: `UPDATE products SET price = -5 WHERE id = 1;`,
              note: "CHECK constraint failed. Try `SET stock = 0` and it works.",
            },
            {
              title: "UNIQUE refuses a duplicate email",
              sql: `INSERT INTO customers (name, email, country, signed_up)
VALUES ('Dup', 'aarav@example.com', 'India', '2025-01-01');`,
              note: "UNIQUE constraint failed. Case matters in most databases; store emails lower-cased or use a case-insensitive unique index.",
            },
          ],
          tip: "Order of defence: typed column → NOT NULL → CHECK / UNIQUE / FK → app validation for friendlier messages. Never rely on the app alone.",
        },
        {
          title: "Enums vs lookup tables vs JSON",
          analogy: "A fixed menu board (enum), a menu you reprint weekly (lookup table), and a 'special requests' box (JSON).",
          why: "Choosing badly means a migration for every new value, or a JSON blob nobody can filter.",
          visual: {"kind": "cards", "items": [{"title": "CHECK / ENUM", "lines": ["fixed small set: order status", "fast, self-documenting", "new value = migration"], "tone": "ok"}, {"title": "Lookup table + FK", "lines": ["sets that change: countries, categories", "carries labels and ordering", "one more join"], "tone": "accent"}, {"title": "JSONB column", "lines": ["per-row extras, vendor payloads", "indexable with GIN", "no FK checks; not a schema"], "tone": "warn"}]},
          table: {
            head: ["Choice", "Good", "Bad", "Use for"],
            rows: [
              ["CHECK (status IN (...)) or ENUM type", "simple, fast, self-documenting", "adding a value needs a migration", "stable, small sets: order status"],
              ["Lookup table + FK", "add values with INSERT, can carry labels and ordering", "one more join", "sets that change or need metadata: countries, categories"],
              ["JSONB column", "flexible shape, indexable with GIN", "no FK checks, easy to abuse", "per-row settings, vendor payloads, rarely-queried attributes"],
            ],
          },
          warn: "A JSON column is not a schema. If you query a JSON field in WHERE every day, promote it to a real column.",
        },
      ],
      realWorld: [
        {
          title: "The report that is off by one paisa",
          problem: "Finance says the monthly revenue report disagrees with the payment gateway by a few paise every month, and the gap grows.",
          whyHard: "Every single row looks right when you open it. The error is invisible per row and only shows up in sums, so developers hunt in the wrong place.",
          steps: [
            "Check the column type. `amount REAL` / `FLOAT` cannot store 19.99 exactly; it stores the nearest binary fraction.",
            "Summing thousands of nearly-right numbers accumulates the error.",
            "Fix the type: `NUMERIC(12,2)` (or store integer paise). Migrate with `ALTER TABLE payments ALTER COLUMN amount TYPE numeric(12,2)`.",
            "Round only at display time, with the currency's rules.",
          ],
          sql: `-- The same 0.1 added 10 times, as float vs as integer paise
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10)
SELECT SUM(0.1)            AS float_total,   -- not exactly 1.0
       SUM(10) / 100.0     AS paise_total    -- exactly 1.0
FROM n;`,
          takeaway: "Money is exact arithmetic. Use NUMERIC or integer minor units, and treat FLOAT in a money column as a bug.",
        },
      ],
      practice: [
        {
          q: "Count orders per month (format YYYY-MM) in date order.",
          answer: "6 rows: 2025-01 → 5, 2025-02 → 5, 2025-03 → 5, 2025-04 → 4, 2025-05 → 4, 2025-06 → 1.",
          explain: "strftime('%Y-%m', ...) turns each timestamp into a month bucket; GROUP BY folds the rows per bucket.",
          sql: `SELECT strftime('%Y-%m', ordered_at) AS month, COUNT(*) AS orders
FROM orders
GROUP BY month
ORDER BY month;`,
          starter: `SELECT strftime('%Y-%m', ordered_at) AS month, COUNT(*) AS orders\nFROM orders\nGROUP BY ...\nORDER BY ...;`,
        },
        {
          q: "Which constraint would you add so no two bookings can have ends_at before starts_at, and which so a customer's email is unique ignoring case?",
          answer: "CHECK (ends_at > starts_at) on bookings; a unique index on LOWER(email) for customers (Postgres: CREATE UNIQUE INDEX ON customers (lower(email))).",
          explain: "CHECK validates each row; a functional unique index enforces uniqueness on a derived value.",
        },
        {
          q: "A column stores order status as free text. What is wrong and how do you fix it?",
          answer: "Typos ('Paid', 'paid ', 'payed') become different statuses and reports break. Fix with CHECK (status IN (...)) or an ENUM, or a lookup table if statuses need labels or ordering.",
          explain: "A fixed vocabulary belongs in a constraint, not in a convention.",
        },
      ],
      interview: [
        { level: "junior", q: "Why should money never be stored as FLOAT?", a: "Floats are binary fractions, so 0.1 or 19.99 are stored as the nearest representable value. Each row is off by a tiny amount and sums drift. I use NUMERIC or DECIMAL with fixed scale, or an integer number of cents." },
        { level: "mid", q: "How do you store dates and times correctly across time zones?", a: "I store instants as timestamptz, which is UTC under the hood, and convert in the UI. For pure dates like birthdays I use date. For recurring local events I store the local time and the IANA zone name, because 'every Monday 9am Kolkata' is not a fixed instant." },
        { level: "mid", q: "Should validation live in the app or the database?", a: "Both, with different jobs. The app gives fast, friendly errors. The database constraint is the guarantee, because scripts, admin tools and future services bypass the app. NOT NULL, UNIQUE, CHECK and foreign keys are cheap insurance." },
        { level: "senior", q: "When is a JSONB column the right choice?", a: "For data whose shape varies per row and that I rarely filter on, like vendor webhook payloads or per-user settings. I index it with GIN if I query inside it. The moment a JSON field appears in WHERE clauses every day, I promote it to a real column with a type and a constraint." },
      ],
      remember: [
        "Money → NUMERIC / integer cents. Never FLOAT.",
        "Instants → timestamptz (UTC). Dates → date.",
        "Constraints protect against every writer, not just your API.",
        "Fixed vocab → CHECK/ENUM; changing vocab → lookup table; messy extras → JSONB.",
      ],
    },
  ],
};
