import type { Module } from "../types";

export const M07: Module = {
  id: "interview",
  title: "Interview mastery",
  simple: "The classic 'hard' SQL problems with the trick for each, and how to talk about databases in a system-design round.",
  topics: [
    {
      slug: "classic-hard-sql-problems",
      title: "The classic hard SQL problems, each with its trick",
      minutes: 30,
      story: "Chess has openings. Once you know the ten common ones, most games start familiar. These are the openings of SQL interviews: each looks unique until you see the pattern underneath.",
      tldr: [
        "Almost every 'hard' SQL question is one of: **top-N per group**, **gaps and islands**, **running/period comparison**, **set difference**, **self-join on a rule**, **dedupe**, **pivot**, **recursion**.",
        "Window functions solve half of them. CTEs make the other half readable.",
        "Always state the tie-breaking rule and the NULL rule out loud; interviewers listen for it.",
      ],
      sections: [
        {
          title: "Pattern map",
          analogy: "Chess openings: ten patterns cover most games.",
          why: "Recognising the pattern is most of solving a 'hard' SQL question.",
          table: {
            head: ["Question sounds like", "Pattern", "Tool"],
            rows: [
              ["nth highest / top 3 per department", "top-N per group", "ROW_NUMBER / DENSE_RANK + outer filter"],
              ["consecutive days / streaks / contiguous ranges", "gaps and islands", "value − ROW_NUMBER"],
              ["running total, month-over-month, previous value", "windows over ordered rows", "SUM OVER, LAG"],
              ["bought X but not Y / this month but not last", "set difference", "NOT EXISTS, EXCEPT"],
              ["earns more than manager / overlapping bookings", "self-join on a rule", "JOIN same table with aliases"],
              ["duplicates: find / delete keeping one", "dedupe", "ROW_NUMBER partition by key"],
              ["rows → columns per status", "pivot", "SUM(CASE WHEN)"],
              ["org chart depth, category tree", "recursion", "WITH RECURSIVE"],
              ["median / percentile", "ordered position", "ROW_NUMBER + COUNT, or percentile_cont"],
              ["cumulative distinct users / retention", "first-seen date", "MIN(date) per user, then count by first date"],
            ],
          },
        },
      ],
      realWorld: [
        {
          title: "1. Nth highest salary (with ties)",
          problem: "Find the employee(s) with the 3rd highest salary in the company. If two people share a salary, treat it as one rank.",
          whyHard: "LIMIT 1 OFFSET 2 breaks on ties and returns one row only.",
          steps: ["DENSE_RANK over salary DESC gives 1,1,2,3 for ties.", "Filter rank = 3 in an outer query."],
          sql: `WITH r AS (SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk FROM employees)
SELECT name, salary FROM r WHERE rk = 3;`,
          takeaway: "Ranking questions: DENSE_RANK for 'nth distinct value', RANK when gaps are wanted, ROW_NUMBER when exactly one row.",
        },
        {
          title: "2. Highest-paid employee per department",
          problem: "For each department, show the top earner. Include everyone tied for first.",
          whyHard: "GROUP BY dept with MAX(salary) loses the name; joining back on salary is fragile.",
          steps: ["RANK over salary DESC partitioned by dept.", "Keep rank = 1."],
          sql: `WITH r AS (SELECT dept, name, salary, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk FROM employees)
SELECT dept, name, salary FROM r WHERE rk = 1 ORDER BY dept;`,
          takeaway: "'Per group' = PARTITION BY. The filter on the rank goes outside the CTE.",
        },
        {
          title: "3. Employees earning more than their manager",
          problem: "List employees whose salary is higher than their manager's.",
          whyHard: "Both rows are in the same table; people forget they can join a table to itself.",
          steps: ["Alias the table twice: e for employee, m for manager.", "Join on e.manager_id = m.id and compare salaries."],
          sql: `-- give Tom a raise first so the query returns something
UPDATE employees SET salary = 150000 WHERE name = 'Tom Hughes';
SELECT e.name, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
          takeaway: "A rule between two rows of the same table is a self-join.",
        },
        {
          title: "4. Customers who ordered in January but not in February 2025",
          problem: "Marketing wants the churn list: customers who bought in January 2025 and did not buy in February 2025.",
          whyHard: "It is a set difference; a single WHERE with two date conditions cannot express 'exists one, not the other'.",
          steps: ["Set A: customers with an order in January.", "Remove those with an order in February using NOT EXISTS (NULL-safe) or EXCEPT."],
          sql: `SELECT DISTINCT c.id, c.name
FROM customers c
JOIN orders j ON j.customer_id = c.id AND j.ordered_at >= '2025-01-01' AND j.ordered_at < '2025-02-01'
WHERE NOT EXISTS (
  SELECT 1 FROM orders f WHERE f.customer_id = c.id AND f.ordered_at >= '2025-02-01' AND f.ordered_at < '2025-03-01'
)
ORDER BY c.id;`,
          takeaway: "'Did X but not Y' = semi-join for X, anti-join for Y. EXCEPT is the set-algebra spelling.",
        },
        {
          title: "5. Streaks: 3+ consecutive login days (gaps and islands)",
          problem: "Find every run of at least 3 consecutive days a user logged in.",
          whyHard: "Consecutiveness is a relation between rows.",
          steps: ["ROW_NUMBER per user ordered by day.", "day − row_number is constant within a run.", "GROUP BY that constant; HAVING COUNT(*) >= 3."],
          sql: `WITH n AS (
  SELECT user_id, day, date(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp
  FROM logins
)
SELECT user_id, MIN(day) AS start_day, MAX(day) AS end_day, COUNT(*) AS days
FROM n GROUP BY user_id, grp HAVING COUNT(*) >= 3 ORDER BY user_id, start_day;`,
          takeaway: "Subtract the row number from the sequence; group by the difference.",
        },
        {
          title: "6. Running total and month-over-month change",
          problem: "Monthly revenue with a cumulative total and the percentage change from the previous month.",
          whyHard: "Needs the previous row and all previous rows at once.",
          steps: ["Aggregate per month in a CTE.", "SUM OVER (ORDER BY month) for the running total; LAG for the previous month."],
          sql: `WITH m AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS month, SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY month
)
SELECT month, revenue,
       SUM(revenue) OVER (ORDER BY month) AS cumulative,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 1) AS mom_pct
FROM m ORDER BY month;`,
          takeaway: "Period comparisons are LAG/LEAD; cumulative values are SUM OVER with ORDER BY.",
        },
        {
          title: "7. Find and remove duplicate rows, keeping the newest",
          problem: "A table has duplicate emails. Keep the most recently updated row per email; delete the rest.",
          whyHard: "DISTINCT cannot choose a winner.",
          steps: ["ROW_NUMBER partitioned by the duplicate key, ordered by 'who wins'.", "Delete rn > 1."],
          sql: `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, email TEXT, updated_at TEXT);
INSERT INTO leads (email, updated_at) VALUES ('a@x.com','2025-01-01'),('a@x.com','2025-03-01'),('b@x.com','2025-02-01'),('a@x.com','2025-02-01');
DELETE FROM leads WHERE id IN (
  SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) AS rn FROM leads) WHERE rn > 1
);
SELECT * FROM leads ORDER BY email;`,
          takeaway: "Dedupe = ROW_NUMBER over the key; then add a UNIQUE index so it cannot happen again.",
        },
        {
          title: "8. Pivot: orders per status per month as columns",
          problem: "A grid with one row per month and one column per status.",
          whyHard: "SQL output columns are fixed; values must be lifted into columns.",
          steps: ["GROUP BY month.", "One SUM(CASE WHEN status = X THEN 1 ELSE 0 END) per column."],
          sql: `SELECT strftime('%Y-%m', ordered_at) AS month,
       SUM(status = 'paid')      AS paid,
       SUM(status = 'shipped')   AS shipped,
       SUM(status = 'pending')   AS pending,
       SUM(status = 'cancelled') AS cancelled
FROM orders GROUP BY month ORDER BY month;`,
          takeaway: "Conditional aggregation pivots anywhere. (SQLite lets SUM(boolean); elsewhere write CASE WHEN.)",
        },
        {
          title: "9. Median salary",
          problem: "Compute the median salary without a MEDIAN function.",
          whyHard: "The median is a position, not an aggregate; even counts need the average of two middle values.",
          steps: ["Number rows by salary and count them.", "Keep rows whose position is in the middle (one or two).", "Average them."],
          sql: `WITH s AS (SELECT salary, ROW_NUMBER() OVER (ORDER BY salary) AS rn, COUNT(*) OVER () AS cnt FROM employees)
SELECT AVG(salary) AS median FROM s WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);`,
          takeaway: "Postgres has percentile_cont(0.5) WITHIN GROUP (ORDER BY salary); the window trick works everywhere.",
        },
        {
          title: "10. Overlapping bookings",
          problem: "Find all pairs of bookings in the same room whose date ranges overlap.",
          whyHard: "People write four conditions; the half-open overlap test is two.",
          steps: ["Self-join on room_id with b.id > a.id so each pair appears once.", "Overlap: a.start < b.end AND b.start < a.end."],
          sql: `INSERT INTO bookings (room_id, guest, starts_at, ends_at) VALUES (101, 'Clash', '2025-07-02', '2025-07-03');
SELECT a.room_id, a.guest, b.guest AS clashes_with, a.starts_at, a.ends_at, b.starts_at AS b_start, b.ends_at AS b_end
FROM bookings a JOIN bookings b ON b.room_id = a.room_id AND b.id > a.id
WHERE a.starts_at < b.ends_at AND b.starts_at < a.ends_at;`,
          takeaway: "Interval overlap is start1 < end2 AND start2 < end1. Memorise it.",
        },
        {
          title: "11. Retention: of users who first logged in on day D, how many came back within 7 days?",
          problem: "Cohort retention: group users by first login day; count how many logged in again within a week.",
          whyHard: "Needs each user's first date, then a per-user existence test relative to that date.",
          steps: ["first = MIN(day) per user.", "returned = EXISTS a login with day between first+1 and first+7.", "GROUP BY first day; count users and returned users."],
          sql: `WITH first AS (SELECT user_id, MIN(day) AS first_day FROM logins GROUP BY user_id)
SELECT f.first_day AS cohort,
       COUNT(*) AS users,
       SUM(EXISTS (SELECT 1 FROM logins l WHERE l.user_id = f.user_id AND l.day > f.first_day AND l.day <= date(f.first_day, '+7 days'))) AS returned_within_7d
FROM first f GROUP BY f.first_day ORDER BY cohort;`,
          takeaway: "Cohorts = anchor each user to a first event, then measure relative to it.",
        },
        {
          title: "12. Org chart: everyone under a manager, with depth",
          problem: "List all direct and indirect reports of Dev Patel with their level below him.",
          whyHard: "Unknown depth.",
          steps: ["Anchor at Dev.", "Recurse on manager_id = previous level's id, depth + 1."],
          sql: `WITH RECURSIVE t(id, name, depth) AS (
  SELECT id, name, 0 FROM employees WHERE name = 'Dev Patel'
  UNION ALL
  SELECT e.id, e.name, t.depth + 1 FROM employees e JOIN t ON e.manager_id = t.id
)
SELECT name, depth FROM t WHERE depth > 0 ORDER BY depth, name;`,
          takeaway: "Trees: WITH RECURSIVE. Carry depth or path for ordering and cycle safety.",
        },
        {
          title: "13. Customers whose total spend is above the average spend",
          problem: "Show customers who spent more than the average customer (excluding cancelled orders).",
          whyHard: "Two levels of aggregation: per customer, then the average of those.",
          steps: ["CTE: spend per customer.", "Compare each to the average of the CTE."],
          sql: `WITH spend AS (
  SELECT o.customer_id, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY o.customer_id
)
SELECT c.name, s.total
FROM spend s JOIN customers c ON c.id = s.customer_id
WHERE s.total > (SELECT AVG(total) FROM spend)
ORDER BY s.total DESC;`,
          takeaway: "Aggregate of an aggregate = CTE then a scalar subquery over it.",
        },
      ],
      practice: [
        {
          q: "Second-highest order total (sum of items) among non-cancelled orders.",
          answer: "449.00 (orders 11 is 778; next distinct total is 449 for order 21).",
          explain: "Totals per order in a CTE, then DENSE_RANK = 2.",
          sql: `WITH t AS (
  SELECT o.id, SUM(oi.qty * oi.unit_price) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled' GROUP BY o.id
), r AS (SELECT id, total, DENSE_RANK() OVER (ORDER BY total DESC) AS rk FROM t)
SELECT id, total FROM r WHERE rk = 2;`,
        },
        {
          q: "Products that were never ordered together with product 1 (Mechanical Keyboard) in the same order.",
          answer: "Standing Desk, Ergonomic Chair, Desk Lamp, Clean Code, Designing Data-Intensive Apps, Yoga Mat, Gift Card.",
          explain: "Set of products co-occurring with product 1, then NOT IN / NOT EXISTS against all products (ids are never NULL here).",
          sql: `SELECT p.id, p.name FROM products p
WHERE p.id <> 1 AND NOT EXISTS (
  SELECT 1 FROM order_items a JOIN order_items b ON b.order_id = a.order_id
  WHERE a.product_id = 1 AND b.product_id = p.id
)
ORDER BY p.id;`,
        },
        {
          q: "Longest login streak per user (days).",
          answer: "User 1 → 4 (Jun 10–13), user 2 → 5 (Jun 3–7), user 3 → 2 (Jun 9–10).",
          explain: "Gaps-and-islands groups, then MAX(COUNT) per user.",
          sql: `WITH n AS (
  SELECT user_id, day, date(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp FROM logins
), runs AS (SELECT user_id, COUNT(*) AS len FROM n GROUP BY user_id, grp)
SELECT user_id, MAX(len) AS longest FROM runs GROUP BY user_id ORDER BY user_id;`,
          starter: `WITH n AS (\n  SELECT user_id, day, date(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp FROM logins\n), runs AS (SELECT user_id, COUNT(*) AS len FROM n GROUP BY user_id, grp)\nSELECT user_id, ... AS longest FROM runs GROUP BY user_id ORDER BY user_id;`,
        },
      ],
      interview: [
        { level: "mid", q: "How would you find the second highest salary?", a: "With DENSE_RANK() OVER (ORDER BY salary DESC) in a CTE and WHERE rank = 2, which handles ties and returns everyone at that level. LIMIT 1 OFFSET 1 is wrong with ties, and MAX(salary) WHERE salary < MAX works but does not generalise to nth." },
        { level: "mid", q: "Write a query for users with 3 consecutive login days.", a: "I number each user's login days with ROW_NUMBER, subtract that number from the date so consecutive days share a constant, group by user and that constant, and keep groups with COUNT at least 3. MIN and MAX of the group give the streak boundaries." },
        { level: "senior", q: "How do you approach an unfamiliar hard SQL question in an interview?", a: "I restate the output shape, one row per what, then name the pattern: per-group ranking, islands, period comparison, set difference, self-join or recursion. I build it in CTE steps, say the tie and NULL rules out loud, and check the row count against a tiny mental example before optimising." },
      ],
      remember: [
        "Per group → PARTITION BY. Consecutive → value − ROW_NUMBER. Previous → LAG.",
        "X but not Y → NOT EXISTS. Same-table rule → self-join. Unknown depth → recursion.",
        "Overlap: start1 < end2 AND start2 < end1.",
        "Say the tie-break and NULL rule out loud.",
      ],
    },

    {
      slug: "system-design-with-databases",
      title: "System design rounds: the database part",
      minutes: 24,
      story: "An architect does not start with 'which bricks'. They ask who lives there, how many, and what they do all day. Then the floor plan, then the materials. Database design in an interview is the same order.",
      tldr: [
        "Order: **requirements → access patterns → entities → schema → indexes → scale → consistency**.",
        "Estimate: rows per day × bytes per row × retention = size; reads vs writes per second = shape.",
        "Say the trade-off with every choice: 'Postgres for the truth, Redis for the counter, because …'.",
        "Have the five patterns ready: ledger, idempotency, outbox, keyset pagination, cache-aside.",
      ],
      sections: [
        {
          title: "The 7-step script",
          analogy: "An architect's order: who lives here and what they do, then the floor plan, then the materials.",
          why: "Interviewers score the order and trade-offs, not the final table list.",
          diagram: "designSteps",
          bullets: [
            "**1. Clarify:** users, scale (DAU, QPS), read/write ratio, consistency needs, retention, regions.",
            "**2. Access patterns:** the 5–8 queries the product actually runs ('get feed for user', 'count likes', 'search by name').",
            "**3. Entities and relationships:** nouns → tables, verbs → FKs/join tables.",
            "**4. Schema:** types, keys, constraints; snapshot vs normalise; soft delete; tenant_id.",
            "**5. Indexes:** one per access pattern, equality → range/sort; partial and covering where it pays.",
            "**6. Scale:** cache, replicas, partitions, then sharding by the obvious key; async via outbox.",
            "**7. Consistency and failure:** transactions, idempotency keys, what happens on retries, backups and RPO/RTO.",
          ],
        },
        {
          title: "Back-of-envelope numbers",
          analogy: "Knowing roughly how much a lorry carries before planning deliveries.",
          why: "Rough numbers decide whether one database is enough.",
          table: {
            head: ["Thing", "Rough number"],
            rows: [
              ["Postgres single node, simple indexed reads", "tens of thousands QPS"],
              ["Postgres single node, writes", "thousands to ~10–20k TPS with fast disks"],
              ["Redis", "~100k+ ops/s per node"],
              ["Row with a few columns", "~100–200 bytes + indexes (often 2×)"],
              ["1M rows/day × 200 B × 2 (indexes)", "≈ 400 MB/day ≈ 150 GB/year"],
              ["Network round trip in a region", "~0.5–1 ms; cross-region 50–150 ms"],
              ["SSD random read", "~0.1 ms; RAM ~100 ns"],
            ],
          },
        },
        {
          title: "Worked example: URL shortener",
          analogy: "A coat check: hand over a coat, get a short ticket, hand back the ticket, get the coat.",
          why: "The simplest design question; the follow-ups are about caching and ids.",
          visual: {"kind": "flow", "steps": [{"label": "GET /abc123", "tone": "accent"}, {"label": "Redis: code → url", "sub": "hit → 301/302", "tone": "ok"}, {"label": "miss → Postgres links", "sub": "code PK, url, expires_at", "tone": "warn"}, {"label": "SET cache + redirect", "tone": "ok"}, {"label": "clicks", "sub": "Redis INCR → flushed to analytics", "tone": "accent"}]},
          bullets: [
            "Access patterns: create short link (write), redirect by code (read, 100:1 ratio), stats per link.",
            "Schema: `links(code PK text, url text, owner_id, created_at, expires_at)`; `clicks` as an append table or a counter in Redis flushed periodically.",
            "Code generation: base62 of a bigint id (predictable) or random 7 chars with a UNIQUE index and retry on conflict.",
            "Reads: cache `code → url` in Redis with TTL; the database is the truth. 301 vs 302 decides whether browsers cache.",
            "Scale: reads are cache hits; writes are small; shard by code hash only at extreme scale. Analytics via outbox → columnar store.",
          ],
        },
        {
          title: "Worked example: inventory and checkout",
          analogy: "A shop till that must never sell the last item twice and must never charge twice.",
          why: "Combines atomic updates, idempotency and events in one flow.",
          visual: {"kind": "flow", "steps": [{"label": "cart", "sub": "Redis hash, TTL", "tone": "accent"}, {"label": "order 'pending'", "sub": "Postgres, items snapshot price", "tone": "accent"}, {"label": "charge card", "sub": "idempotency key = order id", "tone": "warn"}, {"label": "record payment", "sub": "short tx, upsert", "tone": "ok"}, {"label": "outbox events", "sub": "email, search, analytics", "tone": "ok"}], "caption": "Stock: UPDATE … SET stock = stock − q WHERE stock ≥ q, or a reservation row with a TTL."},
          bullets: [
            "Invariant: never sell more than stock. Enforced by `UPDATE ... SET stock = stock - q WHERE stock >= q` or a reservation row with a short TTL.",
            "Carts in Redis; orders in Postgres with `order_items` snapshotting price and name.",
            "Payment: intent row → idempotent provider call → short transaction to record → reconciliation job.",
            "Events (order placed, shipped) via outbox. Email, analytics and search index consume them idempotently.",
          ],
        },
        {
          title: "Worked example: social feed",
          analogy: "Delivering a newsletter to every subscriber's letterbox (fan-out on write) versus everyone visiting the noticeboard (fan-out on read).",
          why: "The classic read-vs-write amplification trade-off.",
          visual: {"kind": "compare", "left": {"title": "Fan-out on write", "lines": ["post → push id into every follower's timeline (Redis list / table)", "read = one list fetch", "cost: celebrity with 10M followers"]}, "right": {"title": "Fan-out on read", "lines": ["read = query posts of people I follow", "no write amplification", "cost: slow for users following thousands"]}, "caption": "Hybrid: fan-out on write for normal accounts, merge celebrities at read time."},
          bullets: [
            "Access pattern: 'latest posts from people I follow', paginated. Fan-out on read (query at read time, fine to ~1k follows) vs fan-out on write (push post ids into each follower's Redis list; celebrities excluded and merged at read time).",
            "Schema: `posts(id, author_id, created_at)` indexed `(author_id, created_at DESC)`; `follows(follower_id, followee_id)` PK both ways.",
            "Pagination: keyset on `(created_at, id)`.",
            "Counters (likes): Redis INCR + periodic flush, or a `post_stats` table updated in batches; never a COUNT(*) per render.",
          ],
        },
        {
          title: "Worked example: ledger / wallet",
          analogy: "A bank passbook: never erase a line, add new ones; the balance is the sum.",
          why: "Money designs are judged on auditability and lost-update safety.",
          visual: {"kind": "flow", "steps": [{"label": "transfer request", "sub": "idempotency_key UNIQUE", "tone": "accent"}, {"label": "lock accounts in id order", "sub": "SELECT … FOR UPDATE", "tone": "warn"}, {"label": "INSERT debit + credit", "sub": "append-only ledger_entries", "tone": "ok"}, {"label": "update cached balances", "sub": "CHECK (balance ≥ 0)", "tone": "ok"}, {"label": "COMMIT", "sub": "sync replication, PITR", "tone": "ok"}]},
          bullets: [
            "Append-only `ledger_entries(id, account_id, amount, txn_id, created_at)`; a transfer inserts a debit and a credit in one transaction; sums are the balance.",
            "Cached `accounts.balance` updated in the same transaction with a CHECK (balance >= 0), rows locked in id order.",
            "Idempotent `transfers(idempotency_key UNIQUE)`; retries return the stored result.",
            "Sync replication, PITR, immutable rows (no UPDATE/DELETE grants on the ledger).",
          ],
        },
        {
          title: "Phrases that score",
          analogy: "The sentences a seasoned engineer says in every design review.",
          why: "Saying the trade-off out loud is what interviewers listen for.",
          bullets: [
            "'I'd keep Postgres as the source of truth and derive everything else from it.'",
            "'That invariant lives in a constraint, not in application code.'",
            "'Transactions never span the network; I record intent, call with an idempotency key, then record the result.'",
            "'Before sharding I'd exhaust indexes, caching, replicas and partitioning.'",
            "'Reads that need my own fresh write go to the primary; everything else can lag.'",
          ],
        },
      ],
      realWorld: [
        {
          title: "Design the database for a ride-hailing app (interview walk-through)",
          problem: "Riders request rides, drivers accept, trips have a route and a fare, payments settle later. 1M rides/day. Design the data layer.",
          whyHard: "Several hot access patterns with different shapes: geo lookup of nearby drivers (fast, lossy), ride state transitions (strict), fares and payouts (exact, auditable), and analytics (huge).",
          steps: [
            "Access patterns: nearby available drivers (geo, 1000s QPS), create/accept/complete ride (state machine), rider/driver history (keyset lists), payouts and invoices (ledger), dashboards (OLAP).",
            "Live driver locations: Redis GEO (GEOADD/GEOSEARCH) with TTL; ephemeral, not in Postgres.",
            "Rides in Postgres: `rides(id, rider_id, driver_id, status, requested_at, ...)` with guarded transitions (`UPDATE ... WHERE status = 'requested'`) so two drivers cannot accept the same ride; `ride_events` append-only for the timeline.",
            "Money: `fares`, `ledger_entries` double-entry; payouts computed from the ledger; idempotency keys on the payment provider.",
            "Indexes: `(rider_id, requested_at DESC)`, `(driver_id, requested_at DESC)`, partial `(status) WHERE status IN ('requested','accepted')` for dispatch.",
            "Scale: partition rides by month; replicas for history reads; outbox → Kafka → ClickHouse for analytics; shard by city only when a single primary cannot take the writes.",
          ],
          takeaway: "Split by access pattern: ephemeral geo in Redis, strict state and money in Postgres with constraints and a ledger, analytics derived via events.",
        },
      ],
      practice: [
        {
          q: "Estimate storage for 1M rides/day, 300 bytes per row plus indexes, kept 3 years.",
          answer: "≈ 1M × 300 B × 2 (indexes) = 600 MB/day → ~220 GB/year → ~650 GB for 3 years. Partition by month and archive old partitions.",
          explain: "rows/day × bytes × index factor × days; say the assumptions out loud.",
        },
        {
          q: "How do you prevent two drivers accepting the same ride?",
          answer: "A guarded update: UPDATE rides SET driver_id = ?, status = 'accepted' WHERE id = ? AND status = 'requested'; only one of the concurrent updates changes a row. Check the row count.",
          explain: "The row lock plus the status condition makes the transition atomic.",
        },
        {
          q: "Where do live driver locations live, and why not in Postgres?",
          answer: "Redis GEO with short TTLs. Locations change every few seconds for every driver; that write rate and the geo radius query fit an in-memory structure, and losing a few seconds of data is harmless.",
          explain: "Ephemeral, high-churn, lossy data belongs in a cache-like store.",
        },
      ],
      interview: [
        { level: "mid", q: "How do you start the database part of a system design question?", a: "With access patterns, not tables: the handful of queries the product runs, their rates and consistency needs. From those I derive entities, the schema with constraints, one index per pattern, and only then scaling choices like caching, replicas, partitioning and, last, sharding." },
        { level: "senior", q: "Design the data layer for a wallet with transfers between users.", a: "An append-only double-entry ledger where a transfer inserts a debit and a credit in one transaction, locking the two accounts in id order, with a cached balance guarded by a CHECK. Transfers carry an idempotency key with a unique index so retries are safe. Sync replication and point-in-time recovery, and the ledger table never gets UPDATE or DELETE grants." },
        { level: "senior", q: "When do you introduce a second database in a design?", a: "When a measured access pattern does not fit the primary: sub-millisecond counters or ephemeral geo data for Redis, analytics scans for a columnar store, ranked text search for Elasticsearch. The relational store stays the source of truth and the others are fed from it through the outbox or change data capture, so they can be rebuilt." },
        { level: "senior", q: "How do you keep a feed fast for users following thousands of accounts?", a: "Fan-out on write for normal accounts, pushing new post ids into each follower's timeline list in Redis or a timeline table, and fan-out on read for celebrity accounts merged at query time. Pagination by keyset on (created_at, id), counters kept in Redis and flushed, and the posts table as the truth that timelines can be rebuilt from." },
      ],
      remember: [
        "Access patterns first; schema, indexes, scale, consistency after.",
        "Invariants → constraints. Money → ledger. Retries → idempotency keys.",
        "Primary for truth, cache for speed, columnar for analytics, events to connect them.",
        "Shard last; say the order out loud.",
      ],
    },
  ],
};
