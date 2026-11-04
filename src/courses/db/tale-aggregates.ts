import type { StoryPage } from "../types";

// Topic 2.2 as a story: the same morning continues. Nisha's questions stop being "which rows"
// and become "how many", "how much", "per what".

export const AGG_CAST = "Still Monday. **Nisha** (support) and **Dev** (developer) at the shop, with the manager's weekly meeting at noon.";

export const TALE_AGGREGATES: StoryPage[] = [
  {
    when: "Monday, 11:00 · the support desk",
    stage: "problem",
    title: "'How many customers per country?'",
    text: "Nisha's next question sounds like the ones from the last hour, but it is not. 'How many customers do we have per country?'\n\nEvery question so far asked for rows: this customer, those products. This one asks for a number about a pile of rows. Dev explains that the database has to do two things: first sort the thirteen customers into piles, one pile per country, and then count each pile.\n\nIn SQL, 'one pile per country' is GROUP BY country, and 'count each pile' is COUNT(*). The result has one row per pile, not one row per customer.",
    jargon: [["aggregate", "a function that turns many rows into one number: COUNT, SUM, AVG, MIN, MAX"]],
    queries: [
      {
        title: "Customers per country",
        sql: `SELECT country, COUNT(*) AS customers\nFROM customers\nGROUP BY country\nORDER BY customers DESC, country;`,
        lines: [
          { sql: "SELECT country, COUNT(*) AS customers", say: "For each pile: the country it is the pile for, and how many rows are in it. COUNT(*) counts rows." },
          { sql: "FROM customers", say: "The customers table, thirteen rows." },
          { sql: "GROUP BY country", say: "Make one pile per distinct country. From here on, one output row per pile." },
          { sql: "ORDER BY customers DESC, country;", say: "Biggest pile first; ties alphabetical." },
        ],
        expect: "seven rows: India 5, then UK 2 and USA 2, then Italy, Japan, South Korea, Spain with 1 each. Thirteen customers became seven piles.",
      },
    ],
  },
  {
    when: "11:05 · the whiteboard again",
    stage: "why",
    title: "Rows become piles",
    text: "Dev draws it next to yesterday's order of clauses. FROM opens the table. WHERE, if there is one, drops rows. Then GROUP BY sweeps the surviving rows into piles. Then SELECT runs once per pile, which is why SELECT can only talk about two kinds of things: the label of the pile (the grouped column) and a number computed from the whole pile (an aggregate).\n\nThat is the rule that catches everyone once. `SELECT name, country, COUNT(*) … GROUP BY country` is refused by Postgres: a country pile holds five different names, and the database will not guess one. Either group by name too, or ask an aggregate about the names.\n\nAggregates can answer more than 'how many'. MIN(signed_up) is the earliest join date in the pile, MAX the latest.",
    jargon: [["grouped column", "a column named in GROUP BY; it has exactly one value per pile, so SELECT may show it"]],
    diagram: "groupBy",
    queries: [
      {
        title: "First and latest joiner per country",
        sql: `SELECT country, COUNT(*) AS customers, MIN(signed_up) AS first_joined, MAX(signed_up) AS latest_joined\nFROM customers\nGROUP BY country\nORDER BY first_joined;`,
        lines: [
          { sql: "SELECT country, COUNT(*) AS customers, MIN(signed_up) AS first_joined, MAX(signed_up) AS latest_joined", say: "Per pile: its label, its size, the smallest date in it and the largest. All four are allowed: one grouped column, three aggregates." },
          { sql: "GROUP BY country", say: "One pile per country." },
          { sql: "ORDER BY first_joined;", say: "Countries in the order we first got a customer there." },
        ],
        expect: "India first (Aarav, January 2024), then UK, Italy, South Korea, USA, Spain, Japan.",
      },
    ],
  },
  {
    stage: "concept",
    when: "11:10",
    title: "Five aggregates and one rule",
    text: "Now the names. An aggregate is a function that takes a whole pile of rows and gives back one number. There are five you will use every week: COUNT (how many rows), SUM (add a column up), AVG (its average), MIN and MAX (smallest and largest). GROUP BY decides what a pile is; without it, the whole table is one pile and an aggregate returns a single row.\n\nThe one rule: after GROUP BY, SELECT may show only the pile's labels (the grouped columns) and aggregates. Anything else is ambiguous, and Postgres refuses it.\n\nThe pages that follow put each of these to work on a real request from the shop.",
    visual: { kind: "cards", items: [
      { title: "COUNT(*)", lines: ["rows in the pile", "COUNT(col) skips NULLs", "COUNT(DISTINCT col) counts different values"], tone: "accent" },
      { title: "SUM / AVG", lines: ["add up, or average", "skip NULLs", "SUM of no rows is NULL"], tone: "accent" },
      { title: "MIN / MAX", lines: ["smallest / largest", "work on dates and text too"], tone: "accent" },
      { title: "GROUP BY", lines: ["decides what a pile is", "one output row per pile", "SELECT: labels and aggregates only"], tone: "ok" },
    ] },
    ask: "'Average order value per customer' is two aggregates deep: a sum per order, then an average per customer. Which pile comes first?",
  },
  {
    when: "11:15 · the manager walks past",
    stage: "implement",
    title: "'And how much did each category earn?'",
    text: "The manager, on her way to a call: 'For the noon meeting I need revenue per product category.'\n\nTwo new things hide in that sentence. Revenue is not stored anywhere; it is quantity times price for each item sold, added up. And the category is not on the order_items table at all, only the product's id number is. To show the category, each item row has to be matched to its product row by id. That matching is a JOIN; the next topic is all about it. For today, read `JOIN products p ON p.id = oi.product_id` as 'look up each item's product'.\n\nOnce every item row carries its product's category, the piles are by category and the aggregate is SUM(qty * unit_price).",
    jargon: [["unit_price", "the price of one unit at the moment it was sold, stored on the item row so old orders do not change when the catalogue price changes"]],
    queries: [
      {
        title: "Revenue per category",
        sql: `SELECT p.category,\n       COUNT(*) AS line_items,\n       SUM(oi.qty) AS units,\n       SUM(oi.qty * oi.unit_price) AS revenue\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nGROUP BY p.category\nORDER BY revenue DESC;`,
        lines: [
          { sql: "SELECT p.category,", say: "The pile's label: the product category." },
          { sql: "COUNT(*) AS line_items,", say: "How many item rows landed in the pile." },
          { sql: "SUM(oi.qty) AS units,", say: "Add up the quantities: units sold." },
          { sql: "SUM(oi.qty * oi.unit_price) AS revenue", say: "For each item row, quantity times price; then add those up. Revenue." },
          { sql: "FROM order_items oi", say: "Start from the item rows; oi is a short nickname for the table." },
          { sql: "JOIN products p ON p.id = oi.product_id", say: "Look up each item's product, so the row now also has the product's name and category." },
          { sql: "GROUP BY p.category", say: "One pile per category." },
          { sql: "ORDER BY revenue DESC;", say: "Best-earning category first." },
        ],
        expect: "Furniture on top (2604), then Electronics, Books, Fitness. No Misc row at all: the Gift Card was never sold, and a pile cannot be made from no rows (hold that thought for the last slide). 39 item rows became four piles.",
      },
    ],
  },
  {
    when: "11:20",
    stage: "implement",
    title: "Three counts that look the same and are not",
    text: "'How many orders, and how many different customers placed them?' Nisha asks. Two counts, and the second word matters: different.\n\nCOUNT(*) counts rows. COUNT(customer_id) counts rows where that column is not empty. COUNT(DISTINCT customer_id) counts how many different values there are. On the orders table the first two agree, because every order has a customer. The third is smaller, because Aarav alone placed five.\n\nThe difference between the first two shows up on the staff table. Ten employees; COUNT(manager_id) says nine. Nothing is missing: the CEO's manager_id is NULL, and COUNT of a column skips NULLs. Yesterday's rule again: NULL is 'no value', and aggregates step over it.",
    diagram: "countFamily",
    queries: [
      {
        title: "Orders, and different customers who ordered",
        sql: `SELECT COUNT(*) AS orders,\n       COUNT(DISTINCT customer_id) AS customers_who_ordered\nFROM orders;`,
        lines: [
          { sql: "COUNT(*) AS orders,", say: "Every row: 24 orders." },
          { sql: "COUNT(DISTINCT customer_id) AS customers_who_ordered", say: "Different customer ids among them." },
        ],
        expect: "24 orders, placed by 12 different customers. Ishaan has never ordered.",
      },
      {
        title: "The count that skips the CEO",
        sql: `SELECT COUNT(*) AS employees, COUNT(manager_id) AS with_a_manager\nFROM employees;`,
        lines: [
          { sql: "COUNT(*) AS employees,", say: "Ten rows." },
          { sql: "COUNT(manager_id) AS with_a_manager", say: "Rows whose manager_id is not NULL: nine. The CEO is skipped, not lost." },
        ],
        expect: "10 and 9.",
      },
    ],
  },
  {
    when: "11:30",
    stage: "implement",
    title: "'Customers with three or more orders': a filter on piles",
    text: "Nisha wants to send a thank-you note. 'Everyone with three or more orders. Not counting cancelled ones.'\n\nDev writes `WHERE COUNT(*) >= 3` and the database refuses. The reason is the running order: WHERE runs before the piles exist, so there is nothing to count yet. A condition on a pile needs a different word, HAVING, which runs after GROUP BY.\n\nBoth filters are in this query and they do different jobs. WHERE drops the cancelled orders before they are counted. HAVING drops the piles that end up too small. Row filter first, pile filter after.",
    jargon: [["HAVING", "a condition on a pile, checked after GROUP BY has made the piles; WHERE is a condition on a row, checked before"]],
    queries: [
      {
        title: "Three or more non-cancelled orders",
        sql: `SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.status <> 'cancelled'\nGROUP BY c.id, c.name\nHAVING COUNT(o.id) >= 3\nORDER BY orders DESC, c.name;`,
        lines: [
          { sql: "SELECT c.name, COUNT(o.id) AS orders", say: "Per customer pile: the name and how many order rows are in it." },
          { sql: "FROM customers c", say: "Start from customers." },
          { sql: "JOIN orders o ON o.customer_id = c.id", say: "Attach each customer's orders (one row per order)." },
          { sql: "WHERE o.status <> 'cancelled'", say: "Row filter, before grouping: cancelled orders are dropped so they are never counted." },
          { sql: "GROUP BY c.id, c.name", say: "One pile per customer. Grouping by id as well as name keeps two customers with the same name apart." },
          { sql: "HAVING COUNT(o.id) >= 3", say: "Pile filter, after grouping: keep piles with three or more rows." },
          { sql: "ORDER BY orders DESC, c.name;", say: "Most orders first." },
        ],
        expect: "two people: Aarav Mehta with 4 and Priya Nair with 3. Change HAVING to >= 2 and watch the list grow.",
      },
    ],
  },
  {
    when: "11:40 · the slide for the noon meeting",
    stage: "implement",
    title: "One column per status: a grid from rows",
    text: "The manager wants a grid: months down the side, order statuses across the top, counts in the cells. The database only knows how to give one row per pile, so a pile per (month, status) would come out as a tall list, not a grid.\n\nThe trick is a pile per month, and inside each pile a separate count per status. `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` puts a 1 on each paid row and a 0 on the rest, then adds them: the number of paid orders in the pile. One such expression per status gives one column per status.\n\nCASE is if/else inside SQL; it gets its own page in the toolkit topic. The month comes from strftime, which cuts a date down to year-month so that all of March's orders share one label.",
    queries: [
      {
        title: "Orders per month, one column per status",
        sql: `SELECT strftime('%Y-%m', ordered_at) AS month,\n       SUM(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,\n       SUM(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,\n       SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled\nFROM orders\nGROUP BY month\nORDER BY month;`,
        lines: [
          { sql: "SELECT strftime('%Y-%m', ordered_at) AS month,", say: "Turn each order's timestamp into its year-month, e.g. 2025-03. That is the pile's label." },
          { sql: "SUM(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,", say: "1 for a paid row, 0 otherwise, added up: the paid count for the month." },
          { sql: "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled", say: "Same trick for each status; the last one is cancelled." },
          { sql: "GROUP BY month", say: "One pile per month." },
          { sql: "ORDER BY month;", say: "January to June." },
        ],
        note: "Postgres has a neater spelling: COUNT(*) FILTER (WHERE status = 'paid').",
        expect: "six rows, January to June 2025, with the four status counts across. Every row's counts add up to that month's orders.",
      },
    ],
  },
  {
    when: "11:50",
    stage: "implement",
    title: "Two labels per pile: country and month",
    text: "'Can I have that per country as well?' Of course. A pile can have more than one label: GROUP BY country, month makes one pile for every combination that actually occurs, India-January, India-February, UK-January and so on.\n\nThe only thing that changes is that both labels must appear in GROUP BY and may then appear in SELECT. Sorting by the same two columns keeps the output readable.",
    queries: [
      {
        title: "Orders per country per month",
        sql: `SELECT c.country, strftime('%Y-%m', o.ordered_at) AS month, COUNT(*) AS orders\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nGROUP BY c.country, month\nORDER BY c.country, month;`,
        lines: [
          { sql: "SELECT c.country, strftime('%Y-%m', o.ordered_at) AS month, COUNT(*) AS orders", say: "Two labels and one count per pile." },
          { sql: "JOIN customers c ON c.id = o.customer_id", say: "Look up each order's customer, to get the country." },
          { sql: "GROUP BY c.country, month", say: "One pile per (country, month) pair that exists in the data." },
          { sql: "ORDER BY c.country, month;", say: "Grouped by country in the output, months in order inside each." },
        ],
        expect: "India has the most rows, one per month it ordered in; small countries have one or two.",
      },
    ],
  },
  {
    when: "11:55 · three traps before the meeting",
    stage: "implement",
    title: "The empty pile, the skipped NULL and the halved number",
    text: "Dev shows Nisha three results that look wrong and are not.\n\nFirst: revenue for an order that does not exist. SUM over zero rows is not 0, it is NULL, because there was nothing to add. A report that must show 0 wraps it: COALESCE(SUM(x), 0), which means 'this, or 0 if it is NULL'.\n\nSecond: averages skip NULLs the same way counts do. AVG(manager_id) is the average over nine people, not ten. If a missing value should count as zero, say so: AVG(COALESCE(x, 0)).\n\nThird: 7 / 2 is 3 in SQL, not 3.5, because two whole numbers divided give a whole number. Multiply by 1.0 first, or the 'share of customers who ordered' comes out as 0.",
    jargon: [["COALESCE", "COALESCE(a, b) gives a, or b when a is NULL: the standard way to turn a missing value into 0 or 'unknown'"]],
    queries: [
      {
        title: "SUM of nothing is NULL; COALESCE makes it 0",
        sql: `SELECT SUM(qty) AS units, COALESCE(SUM(qty), 0) AS units_or_zero, COUNT(*) AS rows_found\nFROM order_items\nWHERE order_id = 999;`,
        lines: [
          { sql: "SUM(qty) AS units,", say: "No rows match, so there is nothing to add: NULL." },
          { sql: "COALESCE(SUM(qty), 0) AS units_or_zero,", say: "The same sum, with NULL turned into 0 for the report." },
          { sql: "COUNT(*) AS rows_found", say: "COUNT is the one aggregate that returns 0, not NULL, for no rows." },
        ],
        expect: "NULL, 0, 0.",
      },
      {
        title: "Whole numbers divide into whole numbers",
        sql: `SELECT COUNT(DISTINCT customer_id) / COUNT(*) AS share_wrong,\n       COUNT(DISTINCT customer_id) * 1.0 / COUNT(*) AS share_right\nFROM orders;`,
        lines: [
          { sql: "COUNT(DISTINCT customer_id) / COUNT(*) AS share_wrong,", say: "12 divided by 24 as whole numbers: 0." },
          { sql: "COUNT(DISTINCT customer_id) * 1.0 / COUNT(*) AS share_right", say: "Multiply by 1.0 first, so the division keeps decimals: 0.5." },
        ],
        expect: "0 and 0.5.",
      },
    ],
  },
  {
    when: "12:00 · the chart with a missing month",
    stage: "implement",
    title: "The month that fell off the chart",
    text: "The last slide is monthly revenue from November 2024, and the line jumps straight from October to January. November and December had no orders, so they have no rows, so GROUP BY made no pile for them. A pile cannot be made from nothing.\n\nThe fix is to stop asking the orders table for the months. Write the months down yourself as a tiny table, then attach each month's revenue to it with a LEFT JOIN, which keeps every row of the left table even when nothing matches on the right. Months with no revenue get NULL, and COALESCE turns that into 0.\n\nThree steps, each one you already know: a hand-written list of months, the monthly revenue piles, and a join that keeps the list intact.",
    jargon: [["LEFT JOIN", "like JOIN, but every row of the left table survives even when nothing matches on the right; the right side's columns are NULL for those rows. Taught properly in the next topic."]],
    queries: [
      {
        title: "Every month, zeros included",
        sql: `WITH months(m) AS (\n  VALUES ('2024-11'), ('2024-12'), ('2025-01'), ('2025-02'), ('2025-03'), ('2025-04'), ('2025-05'), ('2025-06')\n),\nrev AS (\n  SELECT strftime('%Y-%m', o.ordered_at) AS m, SUM(oi.qty * oi.unit_price) AS revenue\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id\n  WHERE o.status <> 'cancelled'\n  GROUP BY m\n)\nSELECT months.m AS month, COALESCE(rev.revenue, 0) AS revenue\nFROM months\nLEFT JOIN rev ON rev.m = months.m\nORDER BY months.m;`,
        lines: [
          { sql: "WITH months(m) AS (", say: "Name a small table 'months' with one column m, so the query below can use it. WITH just gives a piece of the query a name." },
          { sql: "VALUES ('2024-11'), ('2024-12'), ('2025-01'), ('2025-02'), ('2025-03'), ('2025-04'), ('2025-05'), ('2025-06')", say: "Its rows, written by hand: eight months." },
          { sql: "rev AS (", say: "A second named piece: the revenue piles." },
          { sql: "SELECT strftime('%Y-%m', o.ordered_at) AS m, SUM(oi.qty * oi.unit_price) AS revenue", say: "Month label and revenue per pile." },
          { sql: "WHERE o.status <> 'cancelled'", say: "Cancelled orders do not earn." },
          { sql: "GROUP BY m", say: "One pile per month that has orders." },
          { sql: "SELECT months.m AS month, COALESCE(rev.revenue, 0) AS revenue", say: "For each hand-written month, its revenue, or 0 when there is none." },
          { sql: "FROM months", say: "The calendar drives the query." },
          { sql: "LEFT JOIN rev ON rev.m = months.m", say: "Attach the revenue pile with the same month label; months without one survive with NULL." },
          { sql: "ORDER BY months.m;", say: "In calendar order." },
        ],
        expect: "eight rows. November and December show 0; the six 2025 months show their revenue.",
      },
    ],
  },
  {
    stage: "compare",
    when: "11:58 · two ways to build the slide",
    title: "The dashboard numbers, two ways",
    text: "The old dashboard code and the new one do the same job: orders per status per month. One of them asks the database thirty questions and adds the answers up in JavaScript. The other asks once.",
    versus: {
      beginner: {
        title: "Count in the application",
        lang: "ts",
        code: "const orders = await db.query(\"SELECT * FROM orders\");\nconst grid = {};\nfor (const o of orders.rows) {\n  const month = o.ordered_at.slice(0, 7);\n  grid[month] ??= { paid: 0, shipped: 0, pending: 0, cancelled: 0 };\n  grid[month][o.status] += 1;\n}",
        points: ["Downloads every order row to count them: fine at 24, fatal at 2 million.", "Every status needs code; a new status needs a deploy.", "Empty months silently vanish, same as GROUP BY, but nobody notices because the loop looks complete."],
      },
      engineer: {
        title: "Count in the database",
        code: "SELECT strftime('%Y-%m', ordered_at) AS month,\n       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,\n       SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped\nFROM orders\nWHERE ordered_at >= '2025-01-01'\nGROUP BY month\nORDER BY month;",
        points: ["One pass over the rows inside the database; only six rows travel to the app.", "WHERE narrows the rows before grouping, so an index on ordered_at can help.", "A calendar LEFT JOIN (previous page) makes empty months explicit."],
      },
      tradeoffs: ["The SQL version is harder to unit-test in isolation; test it against a seeded database instead.", "A grid with twenty statuses is ugly as SUM(CASE) columns; return (month, status, count) rows and pivot in the UI.", "Both versions get slow on a billion rows; that is when a nightly rollup table (chapter 6) takes over."],
      when: "Counting in code is acceptable for a handful of rows you already fetched for another reason. Anything called a report, a dashboard or an export is a GROUP BY.",
    },
  },
  {
    stage: "recap",
    title: "Connect it back: the noon slide",
    text: "Every question since eleven o'clock had the same shape. GROUP BY turns rows into piles. SELECT may show a pile's label and numbers computed from the whole pile: COUNT, SUM, AVG, MIN, MAX. WHERE filters rows before the piles are made; HAVING filters the piles after. COUNT(*) counts rows, COUNT(col) skips NULLs, COUNT(DISTINCT col) counts different values. SUM of nothing is NULL, averages skip NULLs, whole numbers divide into whole numbers. And a pile cannot be made from rows that do not exist, so empty months come from a calendar you write down.\n\nThe slide the manager takes into the meeting is one query: per country, how many customers, how many orders and how much revenue, for countries with more than one customer.",
    queries: [
      {
        title: "The noon slide",
        sql: `SELECT c.country,\n       COUNT(DISTINCT c.id) AS customers,\n       COUNT(DISTINCT o.id) AS orders,\n       COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'\nLEFT JOIN order_items oi ON oi.order_id = o.id\nGROUP BY c.country\nHAVING COUNT(DISTINCT c.id) > 1\nORDER BY revenue DESC;`,
        lines: [
          { sql: "COUNT(DISTINCT c.id) AS customers,", say: "Different customers in the country pile." },
          { sql: "COUNT(DISTINCT o.id) AS orders,", say: "Different orders; DISTINCT because each order appears once per item row after the join." },
          { sql: "COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue", say: "Revenue, or 0 for a country whose customers never ordered." },
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'", say: "Attach non-cancelled orders; customers with none survive." },
          { sql: "GROUP BY c.country", say: "One pile per country." },
          { sql: "HAVING COUNT(DISTINCT c.id) > 1", say: "Only countries with more than one customer." },
          { sql: "ORDER BY revenue DESC;", say: "Biggest earner first." },
        ],
        expect: "three rows: India (5 customers, 10 orders), USA and UK, the only countries with more than one customer, biggest revenue first.",
      },
    ],
    recap: {
      remember: ["GROUP BY makes piles; aggregates summarise a pile; SELECT shows labels and aggregates only.", "WHERE filters rows before the piles, HAVING filters piles after.", "COUNT(*) rows, COUNT(col) non-NULLs, COUNT(DISTINCT col) different values.", "SUM of nothing is NULL; COALESCE(…, 0). Whole numbers divide into whole numbers."],
      mistakes: ["A non-grouped column in SELECT (works by accident in SQLite, refused by Postgres).", "Expecting GROUP BY to produce rows for months with no data.", "Putting a pile condition in WHERE, or a row condition in HAVING.", "Dividing two counts and getting 0."],
      production: ["Every dashboard tile, report and 'per customer' number is a GROUP BY.", "Pivot grids: SUM(CASE WHEN …) or FILTER in Postgres.", "Big tables: pre-aggregate into rollup tables on a schedule (chapter 6)."],
      next: ["2.3 Joins: columns that live in another table, and why two joins at once double your totals.", "2.5 Window functions: a number from neighbouring rows while keeping every row.", "2.7 The toolkit: CASE, COALESCE and NULL rules in depth."],
    },
    ask: "Nisha's next question: 'which customers bought both a book and a chair?' Counting piles cannot answer that. What has to happen to the rows first?",
  },
];
