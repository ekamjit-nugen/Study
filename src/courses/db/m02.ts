import type { Module } from "../types";

export const M02: Module = {
  id: "sql",
  title: "SQL that answers real questions",
  simple: "Reading, filtering, grouping, joining, windowing and writing data, with the traps that catch people in interviews.",
  topics: [
    {
      slug: "select-filter-sort",
      title: "SELECT, WHERE, ORDER BY, LIMIT: the shape of every read",
      minutes: 14,
      story: "Ordering at a restaurant: pick the menu (FROM), say what you don't want (WHERE), ask for the plates in a certain order (ORDER BY), and stop after three (LIMIT). The kitchen decides how to cook it.",
      tldr: [
        "SQL is written SELECT-first but **runs FROM-first**: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.",
        "That order explains most errors: a SELECT alias cannot be used in WHERE, but can in ORDER BY.",
        "`LIKE 'A%'` can use an index; `LIKE '%A'` cannot.",
        "Never build SQL with string concatenation. Use parameters (`$1`, `?`).",
      ],
      words: [
        ["alias", "a temporary name for a column or table, made with AS"],
        ["predicate", "a condition in WHERE that is true, false or unknown per row"],
        ["parameterised query", "SQL with placeholders; values are sent separately, never pasted in"],
        ["SQL injection", "an attack where user input is treated as SQL code"],
      ],
      sections: [
        {
          title: "Logical order of evaluation",
          analogy: "Cooking: gather ingredients (FROM), throw out the bad ones (WHERE), group by dish (GROUP BY), skip dishes with too few portions (HAVING), plate up (SELECT), arrange on the table (ORDER BY), serve the first ten (LIMIT).",
          why: "Knowing the order explains why an alias works in ORDER BY but not WHERE, and why HAVING exists at all.",
          diagram: "queryOrder",
          table: {
            head: ["Step", "Clause", "What it does", "Can see SELECT aliases?"],
            rows: [
              ["1", "FROM + JOIN", "build the working set of rows", "no"],
              ["2", "WHERE", "drop rows", "no"],
              ["3", "GROUP BY", "fold rows into buckets", "no"],
              ["4", "HAVING", "drop buckets", "no"],
              ["5", "SELECT", "compute output columns, aliases", "—"],
              ["6", "DISTINCT", "remove duplicate output rows", "yes"],
              ["7", "ORDER BY", "sort output", "yes"],
              ["8", "LIMIT / OFFSET", "cut the list", "yes"],
            ],
          },
          sql: [
            {
              title: "Alias in ORDER BY works, alias in WHERE does not",
              sql: `SELECT name, price * 1.18 AS price_with_tax
FROM products
WHERE price * 1.18 > 50        -- must repeat the expression here
ORDER BY price_with_tax DESC;   -- alias is fine here`,
              note: "Change the WHERE to `price_with_tax > 50` to see the error (SQLite is lenient and may allow it; Postgres and MySQL will not).",
            },
          ],
        },
        {
          title: "Filtering",
          analogy: "A sieve with different holes: 'in this list', 'between these two', 'starts with'. Two sieves in a row with AND, side by side with OR.",
          why: "Most query bugs are a filter that is slightly wrong, like BETWEEN including the end date.",
          visual: {"kind": "cards", "items": [{"title": "IN (…)", "lines": ["shorthand for OR chain", "with a subquery = semi-join"]}, {"title": "BETWEEN a AND b", "lines": ["includes both ends", "timestamps: use >= start AND < end"]}, {"title": "LIKE 'A%'", "lines": ["% any run, _ one char", "prefix can use an index; '%A' cannot"]}, {"title": "AND before OR", "lines": ["a OR b AND c = a OR (b AND c)", "always add parentheses"], "tone": "warn"}]},
          sql: [
            {
              title: "The common operators",
              sql: `SELECT name, country, city, signed_up
FROM customers
WHERE country IN ('India', 'UK')
  AND signed_up BETWEEN '2024-01-01' AND '2024-03-31'
  AND (city LIKE 'M%' OR city IS NULL)
ORDER BY signed_up;`,
            },
          ],
          bullets: [
            "`IN (...)` is shorthand for a chain of ORs. With a subquery it is a semi-join.",
            "`BETWEEN a AND b` includes both ends. For timestamps prefer `>= start AND < next_day` to avoid the 23:59:59.999 problem.",
            "`LIKE` uses `%` (any run) and `_` (one char). Postgres `ILIKE` ignores case.",
            "AND binds tighter than OR. Always parenthesise mixed conditions.",
          ],
        },
        {
          title: "Sorting and cutting",
          analogy: "Lining students up by height, then by name for ties, and taking the first five. Skipping the first 100,000 means walking past 100,000 students.",
          why: "Unsorted results look stable in testing and change order in production.",
          visual: {"kind": "flow", "steps": [{"label": "ORDER BY dept, salary DESC", "sub": "first key, then tie-break", "tone": "accent"}, {"label": "LIMIT 5", "sub": "stop after 5 rows", "tone": "ok"}, {"label": "OFFSET 100000", "sub": "reads and throws away 100k rows", "tone": "bad"}], "caption": "No ORDER BY = undefined order, even if it looks stable today."},
          sql: [
            {
              title: "Multiple keys, directions and NULL placement",
              sql: `SELECT name, dept, salary, manager_id
FROM employees
ORDER BY dept ASC, salary DESC
LIMIT 5;`,
              note: "Postgres lets you say NULLS FIRST / NULLS LAST. Without an ORDER BY, row order is undefined, even if it looks stable today.",
            },
          ],
          warn: "`LIMIT 20 OFFSET 100000` reads and discards 100,000 rows. Pagination of big lists uses keyset pagination (WHERE id > last_seen). Covered in Module 4.",
        },
        {
          title: "DISTINCT and the questions it hides",
          analogy: "Photocopying a guest list that has duplicate names and then crossing out the repeats, instead of asking why the names were doubled.",
          why: "DISTINCT after a join usually hides a wrong join and wrong totals.",
          visual: {"kind": "compare", "left": {"title": "✗ DISTINCT as a band-aid", "lines": ["JOIN produced 3 copies of each customer", "DISTINCT hides it", "the SUMs are still 3× too big"]}, "right": {"title": "✓ Fix the cause", "lines": ["pre-aggregate the child table", "or use EXISTS instead of JOIN", "DISTINCT only for 'unique values of a column'"]}},
          sql: [
            {
              title: "Unique countries",
              sql: `SELECT DISTINCT country FROM customers ORDER BY country;`,
            },
          ],
          warn: "If you add DISTINCT to fix duplicated rows after a JOIN, the join is wrong (it fans out). Fix the join or aggregate instead.",
        },
        {
          title: "Parameters, not string building",
          analogy: "A form with separate boxes for name and message. If you paste the message into the name box, the computer may read it as a command.",
          why: "String-built SQL is the number one way apps get hacked.",
          diagram: "injection",
          code: [
            {
              lang: "ts",
              title: "Node (pg): the only safe way",
              src: `// BAD: user input becomes SQL. name = "x' OR 1=1 --" returns everyone.
await db.query("SELECT * FROM customers WHERE name = '" + name + "'");

// GOOD: the value travels separately; it can never become code.
await db.query("SELECT * FROM customers WHERE name = $1", [name]);

// LIKE with a parameter: build the pattern in JS, pass it as a value
await db.query("SELECT * FROM customers WHERE name ILIKE $1", [prefix + "%"]);`,
            },
          ],
          tip: "ORMs and query builders parameterise for you, until you call `raw()` with a template string. Treat every `raw` as a code review red flag.",
        },
      ],
      realWorld: [
        {
          title: "The search box that found everyone",
          problem: "A support engineer searched for the customer O'Brien and the page crashed. A pentester typed `' OR 1=1 --` and downloaded the whole customer table.",
          whyHard: "The code 'works' for normal names. The bug only appears with a quote character, which is both a valid name character and SQL syntax.",
          steps: [
            "The root cause is one thing: user text was pasted into SQL text, so the database could not tell data from code.",
            "Switch to a parameterised query. The driver sends the SQL and the values in separate messages; the value is never parsed as SQL.",
            "For a prefix search, build `'%' + term + '%'` in JavaScript and pass it as the parameter. Escape `%` and `_` in the user's input if they should be literal.",
            "Add a database role for the API that can only SELECT/INSERT/UPDATE the tables it needs, so even a future injection cannot DROP TABLE.",
          ],
          code: {
            lang: "ts",
            title: "Fixed",
            src: `const term = req.query.q;                    // "O'Brien" or "' OR 1=1 --"
const pattern = "%" + term.replace(/[%_]/g, (m) => "\\\\" + m) + "%";
const { rows } = await db.query(
  "SELECT id, name FROM customers WHERE name ILIKE $1 ESCAPE '\\\\' LIMIT 50",
  [pattern],
);`,
          },
          takeaway: "Data and code must travel on different channels. Parameters are that channel; string concatenation is the bug.",
        },
      ],
      practice: [
        {
          q: "Show the 3 most expensive products with their category, most expensive first.",
          answer: "Standing Desk (449), Ergonomic Chair (329), Noise-Cancelling Headphones (199).",
          explain: "ORDER BY price DESC then LIMIT 3 cuts the sorted list.",
          sql: `SELECT name, category, price FROM products ORDER BY price DESC LIMIT 3;`,
        },
        {
          q: "List customers whose email ends with 'example.com' and who signed up in 2024, newest first, showing name and signed_up.",
          answer: "All 13 customers, with Ishaan Roy first (2024-09-10).",
          explain: "LIKE '%example.com' matches the suffix; the date range keeps 2024; ORDER BY signed_up DESC puts the newest on top.",
          sql: `SELECT name, signed_up
FROM customers
WHERE email LIKE '%example.com'
  AND signed_up >= '2024-01-01' AND signed_up < '2025-01-01'
ORDER BY signed_up DESC;`,
          starter: `SELECT name, signed_up\nFROM customers\nWHERE ...\nORDER BY ...;`,
        },
        {
          q: "Why does `WHERE price > 100 OR category = 'Books' AND stock < 160` behave unexpectedly?",
          answer: "AND binds before OR, so it means price > 100 OR (category = 'Books' AND stock < 160). Add parentheses to say what you mean.",
          explain: "Operator precedence in SQL matches most languages: NOT, then AND, then OR.",
        },
      ],
      interview: [
        { level: "junior", q: "In what order does a SQL query execute?", a: "FROM and JOINs first to build the rows, then WHERE drops rows, GROUP BY folds them, HAVING drops groups, SELECT computes the columns, then DISTINCT, ORDER BY and finally LIMIT. That is why a SELECT alias works in ORDER BY but not in WHERE." },
        { level: "junior", q: "What is the difference between WHERE and HAVING?", a: "WHERE filters individual rows before grouping. HAVING filters groups after aggregation, so it can use COUNT or SUM. If a condition does not need an aggregate, put it in WHERE, because it removes rows earlier and is cheaper." },
        { level: "mid", q: "How do you prevent SQL injection?", a: "Parameterised queries everywhere, so values are sent separately from the SQL text and are never parsed as code. On top of that: least-privilege database roles, no dynamic table or column names from user input, and code review for any raw query building." },
        { level: "mid", q: "Can an index be used for LIKE '%smith'?", a: "No. A B-tree index is sorted by the start of the string, and a leading wildcard means the start is unknown. A prefix pattern like 'smi%' can use it. For substring search I use a trigram index in Postgres or a full-text index." },
      ],
      remember: [
        "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.",
        "Parameters ($1, ?) always; string concatenation never.",
        "BETWEEN is inclusive; for timestamps use >= start AND < end.",
        "DISTINCT after a JOIN usually hides a fan-out bug.",
      ],
    },

    {
      slug: "aggregates-group-by",
      title: "Aggregates, GROUP BY and HAVING",
      minutes: 16,
      story: "Sorting coins into jars by value, then counting each jar. After sorting, you can say 'the ₹10 jar has 14 coins' but you can no longer ask 'which coin was minted in 2019': the individual coins are gone.",
      tldr: [
        "GROUP BY folds many rows into **one row per group**. After folding, only group keys and aggregates exist.",
        "`COUNT(*)` counts rows; `COUNT(col)` skips NULLs; `COUNT(DISTINCT col)` counts unique values.",
        "**WHERE** filters rows before grouping; **HAVING** filters groups after.",
        "Conditional aggregation (`SUM(CASE WHEN ...)`) turns rows into columns: a pivot without special syntax.",
      ],
      words: [
        ["aggregate", "a function that turns many values into one: COUNT, SUM, AVG, MIN, MAX"],
        ["group key", "the column(s) in GROUP BY that define each bucket"],
        ["pivot", "turning values of one column into separate output columns"],
      ],
      sections: [
        {
          title: "Rows become buckets",
          analogy: "Sorting coins into jars by value, then counting each jar. After sorting you know jar totals but cannot ask about one coin.",
          why: "GROUP BY is how every report, dashboard and total is made.",
          diagram: "groupBy",
          sql: [
            {
              title: "Revenue per category",
              sql: `SELECT p.category,
       COUNT(*)                 AS line_items,
       SUM(oi.qty)              AS units,
       SUM(oi.qty * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY revenue DESC;`,
            },
          ],
          warn: "Every column in SELECT must be either in GROUP BY or inside an aggregate. MySQL's old default silently picked a random value for other columns; Postgres refuses, which is the correct behaviour.",
        },
        {
          title: "The COUNT family",
          analogy: "Counting people in a room (every row), counting people wearing hats (only non-blank values), counting different hat colours (distinct).",
          why: "COUNT(*) vs COUNT(column) gives different answers on the same table; interviews love it.",
          diagram: "countFamily",
          sql: [
            {
              title: "Three different counts",
              sql: `SELECT COUNT(*)                AS orders,
       COUNT(DISTINCT customer_id) AS customers_who_ordered,
       COUNT(DISTINCT customer_id) * 1.0 / COUNT(*) AS avg_share
FROM orders;`,
            },
          ],
          bullets: [
            "`AVG` ignores NULLs. `AVG(COALESCE(x, 0))` if NULL should count as 0.",
            "Integer division: `7 / 2 = 3` in most databases. Multiply by `1.0` or cast first.",
            "`SUM` of no rows is NULL, not 0. Wrap with `COALESCE(SUM(x), 0)`.",
          ],
        },
        {
          title: "HAVING: filter the buckets",
          analogy: "First remove rotten apples (WHERE), then sort into baskets, then keep only baskets with more than ten apples (HAVING).",
          why: "Putting a condition in the wrong one either errors or silently changes the answer.",
          visual: {"kind": "flow", "steps": [{"label": "rows", "sub": "all orders", "tone": "accent"}, {"label": "WHERE", "sub": "drop cancelled rows", "tone": "warn"}, {"label": "GROUP BY customer", "sub": "one bucket per customer"}, {"label": "HAVING COUNT ≥ 3", "sub": "drop small buckets", "tone": "warn"}, {"label": "result", "sub": "2 customers", "tone": "ok"}]},
          sql: [
            {
              title: "Customers with 3 or more orders",
              sql: `SELECT c.name, COUNT(o.id) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled'            -- row filter, before grouping
GROUP BY c.id, c.name
HAVING COUNT(o.id) >= 3                   -- group filter, after grouping
ORDER BY orders DESC;`,
            },
          ],
        },
        {
          title: "Conditional aggregation: the poor man's pivot",
          analogy: "A tally sheet with one column per status: for each order, put a tick in the right column, then add up each column.",
          why: "This is how you turn rows into a dashboard grid without any special syntax.",
          visual: {"kind": "flow", "steps": [{"label": "rows", "sub": "(month, status) one per order", "tone": "accent"}, {"label": "GROUP BY month", "sub": "one bucket per month"}, {"label": "SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)", "sub": "one column per status", "tone": "ok"}, {"label": "grid", "sub": "month × status counts", "tone": "ok"}]},
          sql: [
            {
              title: "Orders by status, one column per status",
              sql: `SELECT strftime('%Y-%m', ordered_at) AS month,
       SUM(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,
       SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY month
ORDER BY month;`,
              note: "Postgres also has FILTER: COUNT(*) FILTER (WHERE status = 'paid').",
            },
          ],
        },
        {
          title: "Grouping by an expression and by several columns",
          analogy: "Sorting mail by country, then by month inside each country: two labels per pile.",
          why: "Reports almost always group by more than one thing.",
          sql: [
            {
              title: "Country and month",
              sql: `SELECT c.country, strftime('%Y-%m', o.ordered_at) AS month, COUNT(*) AS orders
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.country, month
ORDER BY c.country, month;`,
            },
          ],
          more: "GROUP BY ROLLUP / CUBE (Postgres, MySQL) add subtotal rows. GROUPING SETS lets you ask for several groupings in one scan. These are handy for reports and show up in senior interviews as 'how would you get the per-country total and the grand total in one query'.",
        },
      ],
      realWorld: [
        {
          title: "Monthly revenue with the empty months included",
          problem: "The dashboard shows a revenue line per month. Months with no orders vanish from the chart instead of showing zero, so the line jumps.",
          whyHard: "GROUP BY can only produce groups for rows that exist. You cannot group rows that are not there, so people try to fix it in JavaScript and get it wrong for year boundaries.",
          steps: [
            "Generate the list of months you want **first**, as its own row set (a calendar). In Postgres: `generate_series`. In SQLite/MySQL: a recursive CTE.",
            "LEFT JOIN revenue onto the calendar, not the other way round. The calendar is the driving table, so every month survives.",
            "Aggregate per month and `COALESCE` the NULL sum to 0.",
          ],
          sql: `WITH RECURSIVE months(m) AS (
  SELECT '2024-11'
  UNION ALL
  SELECT strftime('%Y-%m', date(m || '-01', '+1 month')) FROM months WHERE m < '2025-06'
),
rev AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS m, SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY m
)
SELECT months.m AS month, COALESCE(rev.revenue, 0) AS revenue
FROM months
LEFT JOIN rev ON rev.m = months.m
ORDER BY months.m;`,
          takeaway: "When the output must include things that have no rows, build those things first and LEFT JOIN the data onto them.",
        },
      ],
      practice: [
        {
          q: "For each department, show the number of employees and the average salary (rounded to a whole number).",
          answer: "Engineering 5 / 138600, Leadership 1 / 250000, Sales 3 / 112333, Support 1 / 70000.",
          explain: "GROUP BY dept makes one bucket per department; COUNT and AVG summarise each bucket.",
          sql: `SELECT dept, COUNT(*) AS headcount, ROUND(AVG(salary)) AS avg_salary
FROM employees
GROUP BY dept
ORDER BY dept;`,
        },
        {
          q: "Which products were ordered in more than 3 distinct orders? Show product name and the count.",
          answer: "Mechanical Keyboard (5), Noise-Cancelling Headphones (5), USB-C Hub (5), Clean Code (4), Designing Data-Intensive Apps (4), Water Bottle (4).",
          explain: "Join items to products, group per product, and HAVING keeps only groups with more than 3 distinct orders.",
          sql: `SELECT p.name, COUNT(DISTINCT oi.order_id) AS orders
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name
HAVING COUNT(DISTINCT oi.order_id) > 3
ORDER BY orders DESC, p.name;`,
          starter: `SELECT p.name, COUNT(DISTINCT oi.order_id) AS orders\nFROM order_items oi\nJOIN products p ON ...\nGROUP BY ...\nHAVING ...\nORDER BY orders DESC, p.name;`,
        },
        {
          q: "Why does `SELECT name, COUNT(*) FROM employees GROUP BY dept` fail in Postgres?",
          answer: "Because name is neither in GROUP BY nor aggregated; a department bucket has several names and the database refuses to guess one.",
          explain: "After grouping, only group keys and aggregates exist per output row.",
        },
      ],
      interview: [
        { level: "junior", q: "What is the difference between COUNT(*) and COUNT(column)?", a: "COUNT(*) counts rows. COUNT(column) counts rows where that column is not NULL. COUNT(DISTINCT column) counts unique non-NULL values. On a LEFT JOIN, COUNT(right.id) gives zero for unmatched rows while COUNT(*) gives one, which is a common bug." },
        { level: "mid", q: "How would you show sales per month including months with no sales?", a: "Generate the months first, with generate_series in Postgres or a recursive CTE elsewhere, then LEFT JOIN the aggregated sales onto that calendar and COALESCE the missing sums to zero. GROUP BY alone cannot invent groups for rows that do not exist." },
        { level: "mid", q: "How do you pivot rows into columns in SQL?", a: "With conditional aggregation: one SUM(CASE WHEN category = 'X' THEN amount ELSE 0 END) per output column, grouped by the row key. Postgres also offers FILTER and the crosstab extension, but CASE works everywhere." },
        { level: "senior", q: "A GROUP BY over 200 million rows is slow. What do you look at?", a: "First the plan: is it a hash aggregate spilling to disk because work_mem is small, or a sort-based aggregate? Then I reduce the input with a selective WHERE and a matching index, consider a covering index so it is an index-only scan, and for repeated reports I precompute into a materialised view or a summary table refreshed incrementally." },
      ],
      remember: [
        "GROUP BY: one output row per bucket; SELECT only keys and aggregates.",
        "WHERE before grouping, HAVING after.",
        "COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col).",
        "Need empty groups? Build the calendar first, LEFT JOIN the data.",
      ],
    },

    {
      slug: "joins",
      title: "Joins: every kind, and the fan-out trap",
      minutes: 20,
      story: "Two guest lists for a party: people who RSVP'd and people who showed up. INNER = came and RSVP'd. LEFT = everyone who RSVP'd, with a blank for no-shows. FULL = everyone from either list. The join condition is how you match names.",
      tldr: [
        "**INNER** keeps matches. **LEFT** keeps every left row, NULL-padding the right. **FULL** keeps both sides.",
        "Anti-join = `LEFT JOIN ... WHERE right.key IS NULL`: rows with no match.",
        "A filter on the right table in **WHERE** turns a LEFT JOIN back into an INNER JOIN. Put it in **ON**.",
        "**Fan-out:** joining two 1:N tables multiplies rows and double-counts sums. Aggregate each side first.",
      ],
      words: [
        ["join condition", "the ON clause that says which rows pair up"],
        ["anti-join", "rows on one side that have no partner on the other"],
        ["self-join", "joining a table to itself, with two aliases"],
        ["fan-out", "one row matching many rows, so the row count multiplies"],
      ],
      sections: [
        {
          title: "Pick a join, watch the rows",
          analogy: "Two guest lists: who RSVP'd and who showed up. INNER = on both lists. LEFT = everyone who RSVP'd, with blanks for no-shows.",
          why: "Joins are where most wrong numbers in reports come from.",
          diagram: "joins",
        },
        {
          title: "INNER and LEFT on real data",
          analogy: "Counting orders per customer: LEFT keeps the customers with zero so they show up with 0; INNER quietly drops them.",
          why: "A customer with no orders disappearing from a report is a classic bug.",
          sql: [
            {
              title: "Customers and their order counts, zero included",
              sql: `SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY orders DESC, c.name;`,
              note: "Change LEFT JOIN to JOIN: Ishaan Roy (zero orders) disappears.",
            },
          ],
        },
        {
          title: "ON vs WHERE: the LEFT JOIN that stopped being LEFT",
          analogy: "Inviting everyone (LEFT), then at the door turning away anyone whose plus-one is not wearing red (WHERE): people with no plus-one get turned away too.",
          why: "A filter in the wrong place makes a LEFT JOIN behave like an INNER JOIN and drops rows silently.",
          diagram: "onVsWhere",
          body: "You want every customer, with the count of their **paid** orders. Putting the status filter in WHERE removes customers who have no paid orders at all, because their padded NULL status fails the test.",
          sql: [
            {
              title: "Wrong: filter in WHERE",
              sql: `SELECT c.name, COUNT(o.id) AS paid_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid'            -- NULL = 'paid' is unknown → row dropped
GROUP BY c.id, c.name
ORDER BY c.name;`,
            },
            {
              title: "Right: filter in ON",
              sql: `SELECT c.name, COUNT(o.id) AS paid_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
GROUP BY c.id, c.name
ORDER BY c.name;`,
              note: "Now customers with zero paid orders show 0 instead of vanishing.",
            },
          ],
        },
        {
          title: "Anti-join and semi-join",
          analogy: "Who on list A is not on list B? Check each name on A against B and keep the ones with no match.",
          why: "'Customers who never ordered' and 'users without a profile' are everyday questions.",
          diagram: "antiJoin",
          sql: [
            {
              title: "Customers who never ordered (anti-join)",
              sql: `SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
            },
            {
              title: "Same question with NOT EXISTS (NULL-safe, often faster)",
              sql: `SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`,
              note: "EXISTS stops at the first match. Avoid NOT IN here: one NULL in the subquery makes NOT IN return nothing.",
            },
          ],
        },
        {
          title: "Self-join: employees and managers",
          analogy: "A family tree printed twice: one copy to look up the child, the other to look up the parent.",
          why: "Any rule between two rows of the same table, manager and report, this booking and that booking, is a self-join.",
          diagram: "selfJoin",
          sql: [
            {
              title: "Who earns more than their manager?",
              sql: `SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
              note: "No rows in this dataset. Give Tom Hughes a raise to 150000 and run again.",
            },
          ],
        },
        {
          title: "The fan-out trap",
          analogy: "One order, two items, two payments: pair every item with every payment and you get four lines, so every total is doubled.",
          why: "This bug produces revenue numbers that are confidently wrong.",
          diagram: "fanOut",
          body: "An order has many items and many payments. Join both and each item row pairs with each payment row. SUM(items) is now multiplied by the number of payments.",
          sql: [
            {
              title: "Wrong: both 1:N joins at once",
              sql: `-- Order 1 has 2 items and 1 payment: fine. Add a 2nd payment and totals double.
INSERT INTO payments (order_id, amount, method, paid_at) VALUES (1, 0.0, 'card', '2025-01-03 10:14:00');
SELECT o.id,
       SUM(oi.qty * oi.unit_price) AS items_total,   -- doubled!
       SUM(p.amount)               AS paid_total     -- doubled!
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN payments p     ON p.order_id = o.id
WHERE o.id = 1
GROUP BY o.id;`,
            },
            {
              title: "Right: aggregate each side first, then join",
              sql: `WITH items AS (
  SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id
),
pays AS (
  SELECT order_id, SUM(amount) AS paid_total FROM payments GROUP BY order_id
)
SELECT o.id, i.items_total, COALESCE(p.paid_total, 0) AS paid_total
FROM orders o
JOIN items i ON i.order_id = o.id
LEFT JOIN pays p ON p.order_id = o.id
WHERE o.id = 1;`,
              note: "Press Reset data afterwards to remove the extra payment.",
            },
          ],
          tip: "Rule: never join two 1:N children of the same parent in one FROM and then SUM. Pre-aggregate each child to one row per parent.",
        },
        {
          title: "How the database executes a join",
          analogy: "Matching two piles of cards: look up each card in an index (nested loop), build a quick lookup table from the smaller pile (hash), or sort both piles and zip them (merge).",
          why: "Knowing the three ways lets you read plans and see why a join is slow.",
          diagram: "joinAlgorithms",
          table: {
            head: ["Algorithm", "How", "Best when"],
            rows: [
              ["Nested loop", "for each outer row, look up matches in the inner table", "inner side is small or has an index on the join key"],
              ["Hash join", "build a hash table of the smaller side, probe with the other", "big tables, equality joins, no useful index"],
              ["Merge join", "both sides sorted on the key, zip through them", "both already sorted (indexes), very large inputs"],
            ],
          },
          more: "The planner picks based on estimated row counts. A missing index on a foreign key turns a nested loop into a full scan per outer row, which is the classic 'this join takes minutes' bug. Always index foreign keys.",
        },
      ],
      realWorld: [
        {
          title: "The revenue report that doubled overnight",
          problem: "Finance adds a 'paid amount' column to the revenue report. The next morning every order's revenue is exactly double. Nobody changed the items.",
          whyHard: "Each row in the report still looks plausible, and the SQL is one clean query with two joins. The multiplication is invisible until you count rows per order.",
          steps: [
            "Count rows per order in the joined set: `SELECT o.id, COUNT(*)` reveals 2× or 3× the item count.",
            "Name the cause: two independent 1:N relationships (items, payments) joined side by side.",
            "Collapse each child to one row per order in its own CTE (`SUM ... GROUP BY order_id`).",
            "Join the two pre-aggregated sets to orders. Each order now appears once.",
          ],
          sql: `WITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id),
     pays  AS (SELECT order_id, SUM(amount) AS paid_total FROM payments GROUP BY order_id)
SELECT o.id, o.status, i.items_total, COALESCE(p.paid_total, 0) AS paid_total,
       i.items_total - COALESCE(p.paid_total, 0) AS outstanding
FROM orders o
JOIN items i     ON i.order_id = o.id
LEFT JOIN pays p ON p.order_id = o.id
ORDER BY outstanding DESC, o.id;`,
          takeaway: "Before summing after a join, ask 'how many rows per parent does this join produce?'. If more than one source can multiply, pre-aggregate.",
        },
      ],
      practice: [
        {
          q: "List every product with the total units sold, including products that were never sold (0).",
          answer: "11 rows; Gift Card shows 0, everything else has sales.",
          explain: "LEFT JOIN from products keeps unsold ones; COALESCE turns the NULL sum into 0.",
          sql: `SELECT p.name, COALESCE(SUM(oi.qty), 0) AS units
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.id, p.name
ORDER BY units DESC, p.name;`,
          starter: `SELECT p.name, COALESCE(SUM(oi.qty), 0) AS units\nFROM products p\n... JOIN order_items oi ON ...\nGROUP BY p.id, p.name\nORDER BY units DESC, p.name;`,
        },
        {
          q: "Find orders that have no payment row (any status).",
          answer: "Orders 4, 7, 13, 17, 23 (cancelled or pending).",
          explain: "An anti-join: LEFT JOIN payments and keep rows where the payment side is NULL.",
          sql: `SELECT o.id, o.status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE p.id IS NULL
ORDER BY o.id;`,
        },
        {
          q: "Show each customer's name with the number of distinct product categories they bought from (customers with none should show 0).",
          answer: "13 rows, e.g. Aarav Mehta 4, Olivia Brown 2, Ishaan Roy 0.",
          explain: "Chain LEFT JOINs customers → orders → items → products and COUNT(DISTINCT category); COUNT returns 0 when everything is NULL.",
          sql: `SELECT c.name, COUNT(DISTINCT p.category) AS categories
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p     ON p.id = oi.product_id
GROUP BY c.id, c.name
ORDER BY categories DESC, c.name;`,
        },
      ],
      interview: [
        { level: "junior", q: "Explain INNER, LEFT, RIGHT and FULL joins.", a: "INNER returns only rows that match on both sides. LEFT returns every row of the left table and pads the right with NULLs when there is no match. RIGHT is the mirror. FULL returns everything from both sides. I rewrite RIGHT as LEFT with the tables swapped for readability." },
        { level: "mid", q: "Why did my LEFT JOIN behave like an INNER JOIN?", a: "Because I filtered the right-hand table in WHERE. Unmatched rows have NULL in those columns, NULL fails any comparison, so WHERE drops them. The fix is to move that condition into the ON clause, or test for IS NULL explicitly." },
        { level: "mid", q: "How do you find rows in table A with no match in table B?", a: "An anti-join: LEFT JOIN B and keep rows where B's key IS NULL, or NOT EXISTS with a correlated subquery. I avoid NOT IN because a single NULL in the subquery makes it return no rows at all." },
        { level: "senior", q: "Totals doubled after adding a join. What happened and how do you fix it?", a: "Fan-out: I joined a second one-to-many child, so each item row was repeated once per payment row and SUM counted it twice. The fix is to pre-aggregate each child to one row per parent in a CTE or subquery, then join those. I also check COUNT(*) per parent before trusting any SUM after a join." },
        { level: "senior", q: "Nested loop, hash join, merge join: when does the planner pick each?", a: "Nested loop when one side is small or the inner side has an index on the join key. Hash join for large equality joins where it can build a hash of the smaller side in memory. Merge join when both inputs are already sorted, often via indexes. Wrong row estimates lead to the wrong choice, so I keep statistics fresh." },
      ],
      remember: [
        "LEFT keeps the left side; filter the right side in ON, not WHERE.",
        "Anti-join: LEFT JOIN + IS NULL, or NOT EXISTS. Not NOT IN.",
        "Two 1:N joins → multiplied rows → wrong SUMs. Pre-aggregate.",
        "Index every foreign key, or nested loops become full scans.",
      ],
    },

    {
      slug: "subqueries-ctes",
      title: "Subqueries, CTEs and recursion",
      minutes: 16,
      story: "A chef prepping ingredients in small bowls before cooking. Each bowl (CTE) has a name, and the final dish uses them in order. Recursion is a bowl that refills itself until a rule says stop.",
      tldr: [
        "A subquery is a query inside a query: as a value (scalar), as a list (IN), as a test (EXISTS) or as a table (FROM).",
        "A CTE (`WITH name AS (...)`) is a named subquery. Use it for readability and reuse.",
        "**Correlated** subqueries reference the outer row and run once per row; the planner often rewrites them into joins.",
        "`WITH RECURSIVE` walks trees and graphs (org charts, categories, bill of materials) in one query.",
      ],
      words: [
        ["scalar subquery", "a subquery that returns exactly one value"],
        ["correlated subquery", "a subquery that uses columns from the outer query"],
        ["CTE", "Common Table Expression: a named temporary result in WITH"],
        ["recursive CTE", "a CTE that references itself to walk a hierarchy"],
      ],
      sections: [
        {
          title: "Four places a subquery can live",
          analogy: "A question inside a question: 'show products above the average price' means first ask 'what is the average?'.",
          why: "Subqueries let one query answer two-step questions.",
          visual: {"kind": "cards", "items": [{"title": "as a value (scalar)", "lines": ["(SELECT AVG(price) FROM products)", "must return exactly one value"], "tone": "accent"}, {"title": "as a list", "lines": ["WHERE category IN (SELECT …)", "semi-join; beware NOT IN + NULL"], "tone": "accent"}, {"title": "as a test", "lines": ["WHERE EXISTS (SELECT 1 …)", "stops at the first match"], "tone": "ok"}, {"title": "as a table", "lines": ["FROM (SELECT …) t", "a derived table; a CTE is the named version"], "tone": "ok"}]},
          sql: [
            {
              title: "As a value, a list, a test and a table",
              sql: `SELECT p.name, p.price,
       (SELECT AVG(price) FROM products) AS avg_price          -- scalar
FROM products p
WHERE p.category IN (SELECT category FROM products WHERE price > 300)   -- list
  AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)  -- test
ORDER BY p.price DESC;`,
            },
            {
              title: "In FROM (a derived table)",
              sql: `SELECT category, MAX(revenue) AS best_product_revenue
FROM (
  SELECT p.category, p.name, SUM(oi.qty * oi.unit_price) AS revenue
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  GROUP BY p.id
) t
GROUP BY category;`,
            },
          ],
        },
        {
          title: "CTEs: name your steps",
          analogy: "Prepping ingredients in labelled bowls before cooking: each bowl has a name and the recipe reads top to bottom.",
          why: "Named steps make a 40-line query readable and reviewable.",
          visual: {"kind": "flow", "steps": [{"label": "product_revenue", "sub": "SUM per product", "tone": "accent"}, {"label": "category_best", "sub": "MAX per category", "tone": "accent"}, {"label": "final SELECT", "sub": "join the two by category", "tone": "ok"}], "caption": "Each bowl has a name; the dish reads top to bottom."},
          sql: [
            {
              title: "Same query as a readable pipeline",
              sql: `WITH product_revenue AS (
  SELECT p.category, p.name, SUM(oi.qty * oi.unit_price) AS revenue
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  GROUP BY p.id
),
category_best AS (
  SELECT category, MAX(revenue) AS best FROM product_revenue GROUP BY category
)
SELECT pr.category, pr.name, pr.revenue
FROM product_revenue pr
JOIN category_best cb ON cb.category = pr.category AND cb.best = pr.revenue
ORDER BY pr.revenue DESC;`,
              note: "Postgres 12+ inlines CTEs like subqueries unless you write WITH ... AS MATERIALIZED. Older Postgres always materialised them (an optimisation fence).",
            },
          ],
        },
        {
          title: "Correlated subqueries: once per row",
          analogy: "Asking the librarian a question for every single book instead of asking once with a list.",
          why: "This is a hidden N+1 inside a single SQL statement.",
          visual: {"kind": "compare", "left": {"title": "✗ Correlated subquery in SELECT", "lines": ["runs once per outer row", "1,000,000 rows = 1,000,000 lookups", "planner can sometimes rewrite it, often not"]}, "right": {"title": "✓ One pass", "lines": ["window function: RANK() OVER (PARTITION BY dept …)", "or JOIN to a pre-aggregated CTE", "cost: one scan + one sort"]}},
          sql: [
            {
              title: "Each employee's rank inside their department (slow style)",
              sql: `SELECT e.name, e.dept, e.salary,
       (SELECT COUNT(*) FROM employees x WHERE x.dept = e.dept AND x.salary > e.salary) + 1 AS rank_in_dept
FROM employees e
ORDER BY e.dept, rank_in_dept;`,
              note: "Runs the inner query once per outer row. Window functions (next topic) do this in one pass.",
            },
          ],
          warn: "A correlated subquery in SELECT over a million rows is a million lookups. Prefer a JOIN to a pre-aggregated CTE or a window function.",
        },
        {
          title: "Recursive CTEs: walking a tree",
          analogy: "Following a family tree: start with one person, find their children, then their children's children, until nobody is left.",
          why: "Org charts, categories and bill-of-materials all have unknown depth; recursion handles any depth.",
          diagram: "recursion",
          body: "The anchor picks the starting rows. The recursive part joins the previous level to find the next. UNION ALL glues levels together until a level is empty.",
          sql: [
            {
              title: "Everyone under Dev Patel, with their depth",
              sql: `WITH RECURSIVE reports(id, name, manager_id, depth, path) AS (
  SELECT id, name, manager_id, 0, name
  FROM employees WHERE name = 'Dev Patel'
  UNION ALL
  SELECT e.id, e.name, e.manager_id, r.depth + 1, r.path || ' > ' || e.name
  FROM employees e
  JOIN reports r ON e.manager_id = r.id
)
SELECT depth, name, path FROM reports ORDER BY path;`,
            },
            {
              title: "Generate numbers 1..10 (a counter)",
              sql: `WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10)
SELECT i, i * i AS square FROM n;`,
              note: "Postgres: generate_series(1, 10) does this without recursion.",
            },
          ],
          tip: "Always have a stop condition (depth limit or 'WHERE i < N') and, for graphs with cycles, carry the path and refuse to revisit a node.",
        },
      ],
      realWorld: [
        {
          title: "Category tree: show every product under 'Electronics' including sub-sub-categories",
          problem: "Categories nest to any depth (Electronics → Audio → Headphones). The product page must list everything under a category, and the admin wants the breadcrumb path for each category.",
          whyHard: "The depth is unknown, so a fixed number of self-joins cannot work. Developers end up loading the whole tree into Node and recursing there, which is slow and loses transactional consistency.",
          steps: [
            "Store the tree as an adjacency list: `categories(id, name, parent_id)`.",
            "Anchor the recursive CTE at the root you care about (`WHERE id = :root`).",
            "Recurse: join children whose `parent_id` is in the previous level, carrying `depth` and a `path` string.",
            "Join products to the collected category ids. The breadcrumb is the accumulated path.",
          ],
          sql: `-- Build a small tree on the fly and walk it
WITH RECURSIVE cat(id, name, parent_id) AS (
  SELECT 1, 'Electronics', NULL UNION ALL SELECT 2, 'Audio', 1 UNION ALL
  SELECT 3, 'Headphones', 2 UNION ALL SELECT 4, 'Input devices', 1 UNION ALL SELECT 5, 'Books', NULL
),
tree(id, name, depth, path) AS (
  SELECT id, name, 0, name FROM cat WHERE id = 1
  UNION ALL
  SELECT c.id, c.name, t.depth + 1, t.path || ' > ' || c.name
  FROM cat c JOIN tree t ON c.parent_id = t.id
)
SELECT depth, id, path FROM tree ORDER BY path;`,
          takeaway: "Unknown depth means recursion. A recursive CTE does it inside the database in one round trip, with the tree consistent at one snapshot.",
        },
      ],
      practice: [
        {
          q: "List products priced above the average product price, with their price.",
          answer: "Noise-Cancelling Headphones, Standing Desk, Ergonomic Chair (average is 119.64).",
          explain: "A scalar subquery computes the average once; the outer WHERE compares each row to it.",
          sql: `SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price DESC;`,
        },
        {
          q: "Using a recursive CTE, list every employee with their depth below the CEO (CEO = 0).",
          answer: "Meera 0; Dev, Sara 1; Arjun, Nina, Omar, Kavya, Ben 2; Tom, Lina 3.",
          explain: "Anchor at manager_id IS NULL, then repeatedly join employees whose manager is in the previous level.",
          sql: `WITH RECURSIVE org(id, name, depth) AS (
  SELECT id, name, 0 FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.id
)
SELECT name, depth FROM org ORDER BY depth, name;`,
          starter: `WITH RECURSIVE org(id, name, depth) AS (\n  SELECT id, name, 0 FROM employees WHERE ...\n  UNION ALL\n  SELECT e.id, e.name, o.depth + 1 FROM employees e JOIN org o ON ...\n)\nSELECT name, depth FROM org ORDER BY depth, name;`,
        },
        {
          q: "When is a CTE slower than a subquery?",
          answer: "In Postgres before 12 (or with AS MATERIALIZED), a CTE is computed fully once, so a filter in the outer query cannot be pushed into it; the CTE may produce millions of rows you then throw away.",
          explain: "Materialisation is an optimisation fence; inlining lets the planner push predicates down.",
        },
      ],
      interview: [
        { level: "junior", q: "What is a CTE and why use it?", a: "A CTE is a named subquery declared with WITH. I use it to split a complex query into readable steps, to reuse an intermediate result twice, and for recursion. Functionally it is like a subquery in FROM; modern Postgres inlines it unless I ask for MATERIALIZED." },
        { level: "mid", q: "What is a correlated subquery and what is its cost?", a: "A subquery that references the outer row, so conceptually it runs once per outer row. The planner can often turn it into a semi-join or hash join, but when it cannot, cost is rows times subquery cost. I replace per-row lookups with a join to a pre-aggregated set or a window function." },
        { level: "mid", q: "How do you query a tree of unknown depth in SQL?", a: "With a recursive CTE: an anchor query for the root, UNION ALL with a recursive part that joins children to the previous level, and a depth or path column to stop cycles. Alternatives are a closure table or a materialised path if the tree is read far more than written." },
        { level: "senior", q: "EXISTS vs IN vs JOIN for 'customers who have an order': which do you choose?", a: "EXISTS, because it expresses a semi-join: it stops at the first match, never duplicates customers, and is NULL-safe. IN with a subquery is usually planned the same way but NOT IN breaks with NULLs. A JOIN would duplicate customers with many orders unless I add DISTINCT, which is a smell." },
      ],
      remember: [
        "Subquery as value, list, test (EXISTS) or table (FROM).",
        "CTE = named step; recursion = anchor UNION ALL step with a stop rule.",
        "Correlated subquery in SELECT = once per row; prefer windows or joins.",
        "EXISTS for semi-joins, NOT EXISTS for anti-joins.",
      ],
    },

    {
      slug: "window-functions",
      title: "Window functions: ranks, running totals, previous row",
      minutes: 18,
      story: "Students lined up by score. Each student can look left and right (the window) and say 'I am 3rd', 'the person before me scored 80', 'the total so far is 400'. Nobody leaves the line: every row stays.",
      tldr: [
        "GROUP BY collapses rows. A window function **keeps every row** and adds a column computed from neighbours.",
        "`OVER (PARTITION BY g ORDER BY x)`: restart per group g, order inside the group by x.",
        "`ROW_NUMBER` (1,2,3), `RANK` (1,1,3), `DENSE_RANK` (1,1,2).",
        "Top-N per group = `ROW_NUMBER ... = 1` in an outer query. Running total = `SUM(x) OVER (ORDER BY d)`.",
      ],
      words: [
        ["window", "the set of rows a function may look at for the current row"],
        ["partition", "a group inside which the window restarts"],
        ["frame", "the slice of the partition relative to the current row (e.g. all preceding rows)"],
        ["LAG / LEAD", "the value from the previous / next row in the window"],
      ],
      sections: [
        {
          title: "Keep the rows, add a column",
          analogy: "Students in a line, each able to look left and right and say 'I am third' or 'the total so far is 400', without anyone leaving the line.",
          why: "Windows answer ranking and running-total questions that GROUP BY cannot.",
          diagram: "windowFrame",
          sql: [
            {
              title: "Salary with department average and rank, every row kept",
              sql: `SELECT name, dept, salary,
       ROUND(AVG(salary) OVER (PARTITION BY dept))              AS dept_avg,
       RANK()      OVER (PARTITION BY dept ORDER BY salary DESC) AS rank_in_dept,
       salary - ROUND(AVG(salary) OVER (PARTITION BY dept))     AS vs_avg
FROM employees
ORDER BY dept, rank_in_dept;`,
            },
          ],
        },
        {
          title: "ROW_NUMBER vs RANK vs DENSE_RANK",
          analogy: "A race with a tie for first: ROW_NUMBER picks one of them arbitrarily, RANK gives both gold and skips silver, DENSE_RANK gives both gold and then silver.",
          why: "'Second highest' questions hinge on which one you choose.",
          diagram: "rankTypes",
          sql: [
            {
              title: "Ties change everything",
              sql: `WITH scores(name, score) AS (VALUES ('A', 90), ('B', 90), ('C', 80), ('D', 70))
SELECT name, score,
       ROW_NUMBER() OVER (ORDER BY score DESC) AS row_num,   -- 1 2 3 4
       RANK()       OVER (ORDER BY score DESC) AS rnk,       -- 1 1 3 4
       DENSE_RANK() OVER (ORDER BY score DESC) AS dense      -- 1 1 2 3
FROM scores;`,
            },
          ],
          tip: "'Second highest salary' interview question: DENSE_RANK() = 2 handles ties correctly; LIMIT 1 OFFSET 1 does not.",
        },
        {
          title: "Top-N per group",
          analogy: "Best two students in each class: number students within each class, keep numbers 1 and 2.",
          why: "'Top 3 per category' is one of the most common report requests.",
          diagram: "topN",
          sql: [
            {
              title: "Top 2 products by revenue in each category",
              sql: `WITH ranked AS (
  SELECT p.category, p.name, SUM(oi.qty * oi.unit_price) AS revenue,
         ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY SUM(oi.qty * oi.unit_price) DESC) AS rn
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  GROUP BY p.id
)
SELECT category, name, revenue FROM ranked WHERE rn <= 2 ORDER BY category, rn;`,
              note: "Window functions run after GROUP BY, so they can rank aggregates. The filter on rn must be in an outer query (WHERE runs before windows).",
            },
          ],
        },
        {
          title: "Running totals and frames",
          analogy: "A bank passbook: each line shows the balance so far, computed from all lines above it.",
          why: "Cumulative charts and balances need a frame, not a GROUP BY.",
          sql: [
            {
              title: "Cumulative revenue by day",
              sql: `WITH daily AS (
  SELECT date(o.ordered_at) AS day, SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY day
)
SELECT day, revenue,
       SUM(revenue) OVER (ORDER BY day)                                   AS running_total,
       ROUND(AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3
FROM daily
ORDER BY day;`,
            },
          ],
          more: "Default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which treats ties (same ORDER BY value) as one group. Use ROWS when you want strictly one row at a time. Without ORDER BY, the frame is the whole partition, which is how AVG(...) OVER (PARTITION BY dept) gives one value per department.",
        },
        {
          title: "LAG and LEAD: compare with the previous row",
          analogy: "Looking at last month's bill next to this month's to see the change.",
          why: "Growth percentages and 'changed since last time' all use LAG.",
          visual: {"kind": "flow", "steps": [{"label": "Jan 100", "sub": "LAG = NULL", "tone": "accent"}, {"label": "Feb 50", "sub": "LAG = 100 → −50%", "tone": "bad"}, {"label": "Mar 80", "sub": "LAG = 50 → +60%", "tone": "ok"}, {"label": "Apr 20", "sub": "LAG = 80 → −75%", "tone": "bad"}], "caption": "LAG looks one row back in the window's order; LEAD looks forward. No self-join needed."},
          sql: [
            {
              title: "Month-over-month growth",
              sql: `WITH monthly AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS month, SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY month
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month)                          AS prev_month,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / LAG(revenue) OVER (ORDER BY month), 1)             AS growth_pct
FROM monthly;`,
            },
          ],
        },
      ],
      realWorld: [
        {
          title: "Gaps and islands: users who logged in 3+ days in a row",
          problem: "Growth wants a 'streak' badge: every user who logged in on at least 3 consecutive days, with the start and end of each streak.",
          whyHard: "Consecutive-ness is a relationship between rows, and plain SQL sees one row at a time. People write cursors or Node loops over millions of rows.",
          steps: [
            "Number each user's login days in order: `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)`.",
            "The trick: `day - row_number` is **constant inside a run of consecutive days** and changes when there is a gap. (Jun 1 − 1, Jun 2 − 2, Jun 3 − 3 all give May 31.)",
            "GROUP BY user and that constant: each group is one island. MIN(day), MAX(day), COUNT(*) give the streak.",
            "HAVING COUNT(*) >= 3 keeps the streaks you want.",
          ],
          sql: `WITH numbered AS (
  SELECT user_id, day,
         date(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp
  FROM logins
)
SELECT user_id, MIN(day) AS streak_start, MAX(day) AS streak_end, COUNT(*) AS days
FROM numbered
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, streak_start;`,
          takeaway: "'Consecutive' problems become GROUP BY problems once you subtract a row number from the sequence value. Memorise the trick; it is asked constantly.",
        },
        {
          title: "Dedupe: keep only the latest row per customer",
          problem: "A sync job inserted the same customers many times with different updated_at values. Keep the newest row per email and delete the rest.",
          whyHard: "DISTINCT cannot choose which duplicate to keep, and MAX(updated_at) GROUP BY email loses the other columns.",
          steps: [
            "Rank rows within each email by updated_at descending: `ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC)`.",
            "Rows with rn = 1 are keepers. Everything else is a duplicate.",
            "DELETE where the id is in the rn > 1 set (or SELECT rn = 1 for a clean read).",
          ],
          sql: `WITH dup(id, email, updated_at) AS (
  VALUES (1,'a@x.com','2025-01-01'), (2,'a@x.com','2025-03-01'), (3,'b@x.com','2025-02-01'), (4,'a@x.com','2025-02-01')
),
ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) AS rn FROM dup
)
SELECT id, email, updated_at, CASE WHEN rn = 1 THEN 'keep' ELSE 'delete' END AS action
FROM ranked ORDER BY email, rn;`,
          takeaway: "ROW_NUMBER with PARTITION BY the duplicate key and ORDER BY 'which one wins' is the universal dedupe tool.",
        },
      ],
      practice: [
        {
          q: "For every order, show its id, date, total and the running total of order totals in date order (exclude cancelled).",
          answer: "22 rows; the last running total is 4449.",
          explain: "Aggregate items per order first, then SUM(total) OVER (ORDER BY ordered_at, id) accumulates.",
          sql: `WITH totals AS (
  SELECT o.id, o.ordered_at, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id
)
SELECT id, ordered_at, total, SUM(total) OVER (ORDER BY ordered_at, id) AS running
FROM totals ORDER BY ordered_at, id;`,
          starter: `WITH totals AS (\n  SELECT o.id, o.ordered_at, SUM(oi.qty * oi.unit_price) AS total\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id\n  WHERE o.status <> 'cancelled'\n  GROUP BY o.id\n)\nSELECT id, ordered_at, total, ... AS running\nFROM totals ORDER BY ordered_at, id;`,
        },
        {
          q: "Find the second-highest salary in each department (departments with one employee return nothing).",
          answer: "Engineering 140000 (Arjun Rao), Sales 95000 (Omar Ali).",
          explain: "DENSE_RANK per department, then filter = 2 in an outer query.",
          sql: `WITH r AS (
  SELECT dept, name, salary, DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
  FROM employees
)
SELECT dept, name, salary FROM r WHERE rk = 2 ORDER BY dept;`,
        },
        {
          q: "What is the difference between RANK and DENSE_RANK?",
          answer: "Both give ties the same number. RANK then skips numbers (1,1,3); DENSE_RANK does not (1,1,2).",
          explain: "ROW_NUMBER never ties at all; it picks an arbitrary order among equals unless the ORDER BY is unique.",
        },
      ],
      interview: [
        { level: "mid", q: "What is a window function and how is it different from GROUP BY?", a: "A window function computes a value over a set of related rows, the window, but returns one result per input row instead of collapsing rows. GROUP BY gives one row per group. With OVER (PARTITION BY dept) I can show each employee next to their department's average in one pass." },
        { level: "mid", q: "How do you get the top 3 rows per group?", a: "ROW_NUMBER() OVER (PARTITION BY group ORDER BY metric DESC) in a CTE, then WHERE rn <= 3 in the outer query. The filter has to be outside because WHERE runs before window functions. If ties should all be included, I use RANK or DENSE_RANK instead." },
        { level: "senior", q: "Explain the gaps-and-islands technique.", a: "To find runs of consecutive values I number rows with ROW_NUMBER ordered by the value and subtract that number from the value. Inside a consecutive run the difference is constant, and it changes at every gap. Grouping by that difference gives one group per island, so MIN, MAX and COUNT describe each streak." },
        { level: "senior", q: "What does the frame clause do and when does the default bite you?", a: "The frame limits which rows in the partition the function sees relative to the current row. The default with ORDER BY is RANGE UNBOUNDED PRECEDING to CURRENT ROW, which includes all peers with the same ORDER BY value, so a running total over a non-unique date jumps by the whole day at once. I use ROWS, or make the ORDER BY unique." },
      ],
      remember: [
        "OVER (PARTITION BY group ORDER BY key): restart per group, order inside.",
        "ROW_NUMBER 1 2 3 · RANK 1 1 3 · DENSE_RANK 1 1 2.",
        "Top-N per group: ROW_NUMBER in a CTE, filter outside.",
        "Consecutive runs: value − ROW_NUMBER is constant per island.",
      ],
    },

    {
      slug: "writing-data",
      title: "INSERT, UPDATE, DELETE, UPSERT and transactions",
      minutes: 16,
      story: "Editing a shared Google Doc versus mailing a signed contract. Writes to a database are the contract: once committed, everyone sees the same final text, and a half-signed version never leaks.",
      tldr: [
        "Multi-row INSERT and `INSERT ... SELECT` are many times faster than one INSERT per row.",
        "`RETURNING` gives back the rows you wrote without a second query.",
        "**UPSERT** = `INSERT ... ON CONFLICT (key) DO UPDATE`: insert or update in one atomic statement.",
        "Wrap related writes in `BEGIN ... COMMIT`. Anything between is invisible to others until COMMIT.",
      ],
      words: [
        ["upsert", "insert the row, or update it if it already exists"],
        ["idempotent", "doing it twice has the same effect as doing it once"],
        ["savepoint", "a bookmark inside a transaction you can roll back to"],
        ["autocommit", "each statement is its own transaction unless you say BEGIN"],
      ],
      sections: [
        {
          title: "INSERT: many rows at once",
          analogy: "Carrying all the groceries in one trip instead of one bag per trip.",
          why: "Row-by-row inserts turn a ten-second job into an hour.",
          visual: {"kind": "compare", "left": {"title": "✗ 10,000 single INSERTs", "lines": ["10,000 round trips", "10,000 commits (autocommit)", "minutes"]}, "right": {"title": "✓ One statement", "lines": ["INSERT … VALUES (…), (…), (…) in chunks of 1,000", "or COPY / INSERT … SELECT", "seconds"]}},
          sql: [
            {
              title: "Multi-row insert with RETURNING",
              sql: `INSERT INTO products (name, category, price, stock) VALUES
  ('Monitor Arm', 'Furniture', 79.00, 25),
  ('Webcam', 'Electronics', 59.00, 40)
RETURNING id, name;`,
              note: "RETURNING exists in Postgres and SQLite 3.35+. MySQL uses LAST_INSERT_ID() or a follow-up SELECT.",
            },
            {
              title: "INSERT ... SELECT: copy from a query",
              sql: `CREATE TABLE IF NOT EXISTS vip_customers (customer_id INTEGER PRIMARY KEY, total REAL);
INSERT INTO vip_customers (customer_id, total)
SELECT o.customer_id, SUM(oi.qty * oi.unit_price)
FROM orders o JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.customer_id HAVING SUM(oi.qty * oi.unit_price) > 500;
SELECT * FROM vip_customers;`,
            },
          ],
          tip: "From Node, send one INSERT with many VALUES tuples (or COPY in Postgres) instead of a loop of single inserts. 10,000 single inserts = 10,000 round trips.",
        },
        {
          title: "UPDATE and DELETE with conditions from other tables",
          analogy: "Marking parcels as shipped only for orders that appear in the courier's list: look at one list, change another.",
          why: "Cross-table updates done wrong touch every row.",
          visual: {"kind": "ladder", "steps": [{"label": "SELECT with the exact WHERE first", "sub": "see which rows you are about to touch", "tone": "accent"}, {"label": "UPDATE / DELETE with the same WHERE", "sub": "subquery or JOIN for cross-table conditions", "tone": "warn"}, {"label": "RETURNING id, …", "sub": "confirm what changed, no second query", "tone": "ok"}]},
          sql: [
            {
              title: "Mark orders as shipped when fully paid",
              sql: `UPDATE orders
SET status = 'shipped'
WHERE status = 'paid'
  AND id IN (SELECT order_id FROM payments)
RETURNING id, status;`,
            },
            {
              title: "Delete pending orders older than April",
              sql: `DELETE FROM orders WHERE status = 'pending' AND ordered_at < '2025-04-01' RETURNING id;`,
              note: "Always run the matching SELECT first. UPDATE/DELETE without WHERE touches every row.",
            },
          ],
          warn: "Postgres: `UPDATE t SET ... FROM other WHERE ...` and MySQL: `UPDATE t JOIN other ...` let you update from a join. The subquery form above works everywhere.",
        },
        {
          title: "UPSERT: insert or update, atomically",
          analogy: "A hotel check-in: if your name is on the list, update your room; if not, add you. One clerk does both without anyone cutting in.",
          why: "Upserts make retries safe, which is the key to webhooks and counters.",
          diagram: "upsert",
          sql: [
            {
              title: "ON CONFLICT DO UPDATE",
              sql: `INSERT INTO product_tags (product_id, tag) VALUES (1, 'office')
ON CONFLICT (product_id, tag) DO NOTHING;

INSERT INTO accounts (id, owner, balance) VALUES (1, 'Aarav', 0)
ON CONFLICT (id) DO UPDATE SET balance = accounts.balance + 50
RETURNING id, owner, balance;`,
              note: "Postgres: same syntax, with EXCLUDED.column for the proposed row. MySQL: INSERT ... ON DUPLICATE KEY UPDATE.",
            },
          ],
          tip: "An upsert needs a UNIQUE constraint or PK to detect the conflict. It is the clean way to make a write idempotent (webhook delivered twice, retry after timeout).",
        },
        {
          title: "Transactions: all or nothing",
          analogy: "Moving money between two jars: either both jars change or neither does, even if you drop the coins halfway.",
          why: "Without transactions a crash leaves money that vanished.",
          diagram: "acid",
          sql: [
            {
              title: "ROLLBACK undoes everything since BEGIN",
              sql: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
ROLLBACK;
SELECT id, owner, balance FROM accounts;`,
              note: "Balances are unchanged. Replace ROLLBACK with COMMIT and both updates stick.",
            },
            {
              title: "A constraint failure inside a transaction",
              sql: `BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 2;   -- would go negative → CHECK fails
UPDATE accounts SET balance = balance + 1000 WHERE id = 1;
COMMIT;`,
              note: "The first statement errors. In Postgres the whole transaction is now aborted and COMMIT becomes ROLLBACK. In SQLite/MySQL the other statements still run, so your code must ROLLBACK on error.",
            },
          ],
          more: "SAVEPOINT name; ... ROLLBACK TO name; lets you undo part of a transaction, which ORMs use for nested transactions. Autocommit means every statement outside BEGIN is its own transaction. Long transactions hold locks and block VACUUM: keep them to milliseconds, never across a network call to a third party.",
        },
      ],
      realWorld: [
        {
          title: "The payment webhook that arrived twice",
          problem: "Stripe retries webhooks. Your handler inserted the payment twice and credited the order twice. Finance noticed after a refund.",
          whyHard: "The second delivery is identical to the first. Checking 'does it exist?' then inserting still races when two deliveries arrive within milliseconds.",
          steps: [
            "Store the provider's event id with a UNIQUE constraint: `payments.provider_event_id UNIQUE`.",
            "Insert with `ON CONFLICT (provider_event_id) DO NOTHING RETURNING id`.",
            "If RETURNING gives a row, this is the first delivery: credit the order in the same transaction. If it gives nothing, it is a duplicate: acknowledge and stop.",
            "The uniqueness check and the insert are one atomic step, so even concurrent deliveries cannot both succeed.",
          ],
          sql: `CREATE TABLE IF NOT EXISTS webhook_payments (
  id INTEGER PRIMARY KEY, provider_event_id TEXT NOT NULL UNIQUE, order_id INTEGER NOT NULL, amount REAL NOT NULL
);
-- first delivery: inserts and returns a row
INSERT INTO webhook_payments (provider_event_id, order_id, amount) VALUES ('evt_123', 7, 89.00)
ON CONFLICT (provider_event_id) DO NOTHING RETURNING id;
-- second delivery: no row returned → duplicate, do nothing
INSERT INTO webhook_payments (provider_event_id, order_id, amount) VALUES ('evt_123', 7, 89.00)
ON CONFLICT (provider_event_id) DO NOTHING RETURNING id;
SELECT * FROM webhook_payments;`,
          takeaway: "Idempotency = a unique key for 'this exact event' + an atomic insert-or-ignore. Never check-then-insert in two steps.",
        },
      ],
      practice: [
        {
          q: "Insert a new customer 'Test User' (test@example.com, country 'India', signed up today-ish '2025-07-01') and return the new id.",
          answer: "Returns id 14 on fresh data.",
          explain: "Omit id to let the database assign it; RETURNING id hands it back without a second query.",
          sql: `INSERT INTO customers (name, email, country, signed_up) VALUES ('Test User', 'test@example.com', 'India', '2025-07-01') RETURNING id;`,
        },
        {
          q: "Increase the price of every 'Books' product by 10% and return name and new price.",
          answer: "Clean Code 35.2, Designing Data-Intensive Apps 52.8.",
          explain: "UPDATE with an expression; RETURNING shows the result rows.",
          sql: `UPDATE products SET price = ROUND(price * 1.1, 2) WHERE category = 'Books' RETURNING name, price;`,
          starter: `UPDATE products SET ... WHERE ... RETURNING name, price;`,
        },
        {
          q: "Why is 'SELECT to check, then INSERT' not safe for uniqueness, and what is?",
          answer: "Two requests can both pass the SELECT before either INSERTs. A UNIQUE constraint plus INSERT ... ON CONFLICT makes the check and the write one atomic step.",
          explain: "Only the database can make check-and-write atomic; application code always has a gap between the two.",
        },
      ],
      interview: [
        { level: "junior", q: "What is a transaction?", a: "A group of statements that the database applies completely or not at all. I start it with BEGIN and end with COMMIT or ROLLBACK. Until COMMIT, other sessions do not see my changes, and if anything fails or the server crashes, nothing from the group remains." },
        { level: "mid", q: "How do you implement an upsert?", a: "INSERT ... ON CONFLICT (unique columns) DO UPDATE SET ... in Postgres and SQLite, or INSERT ... ON DUPLICATE KEY UPDATE in MySQL. It needs a unique constraint to detect the conflict and it is atomic, which makes it the right tool for idempotent writes like webhooks and counters." },
        { level: "mid", q: "How do you make an API endpoint idempotent at the database level?", a: "The client sends an idempotency key. I store it in a table with a UNIQUE constraint together with the result, and insert it in the same transaction as the business write, using ON CONFLICT DO NOTHING. A duplicate request finds the existing row and returns the stored result instead of acting again." },
        { level: "senior", q: "What goes wrong with long-running transactions?", a: "They hold row locks so other writers wait, they pin old row versions so VACUUM cannot clean up and tables bloat, and they keep a pooled connection busy. The classic mistake is awaiting an HTTP call to a payment provider inside a transaction. I keep transactions to the database work only and do external calls before or after." },
      ],
      remember: [
        "Batch inserts; RETURNING to avoid a second query.",
        "UPSERT = INSERT ... ON CONFLICT; needs a UNIQUE key; makes writes idempotent.",
        "BEGIN/COMMIT around related writes; ROLLBACK on any error.",
        "Never await an external call inside a transaction.",
      ],
    },
  ],
};
