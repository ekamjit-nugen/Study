import type { StoryPage } from "../types";

// Topic 2.3 as a story: Monday afternoon. Every question now needs two tables at once.

export const JOINS_CAST = "Monday afternoon. **Nisha** (support), **Dev** (developer), and a revenue report from **Finance** that doubled overnight.";

export const TALE_JOINS: StoryPage[] = [
  {
    stage: "problem",
    when: "Monday, 14:00 · the support desk",
    title: "'Whose order is number 7?'",
    text: "A parcel for order 7 has come back to the warehouse. Nisha opens the orders table to call the customer, and finds a row that says customer_id 6 and nothing else: no name, no phone, no city.\n\nThe name is in the customers table, where row 6 is Emma Clarke in Manchester. Two tables, one answer. Nisha wants the database to put the two rows side by side, every time, for every order, without her looking anything up by hand.\n\nThat is what a join is: match a row in one table with the row in another table that it points at, and hand back the two glued together.",
    queries: [
      {
        title: "Order 7 with its customer",
        sql: `SELECT o.id AS order_id, o.ordered_at, o.status, c.name, c.city\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.id = 7;`,
        lines: [
          { sql: "SELECT o.id AS order_id, o.ordered_at, o.status, c.name, c.city", say: "Columns from both tables: o. means 'from orders', c. means 'from customers'." },
          { sql: "FROM orders o", say: "Start from orders; o is a short nickname for the table." },
          { sql: "JOIN customers c ON c.id = o.customer_id", say: "For each order row, find the customer row whose id equals the order's customer_id, and glue it on." },
          { sql: "WHERE o.id = 7;", say: "Then keep only order 7." },
        ],
        expect: "one row: order 7, pending, Emma Clarke, Manchester. Two tables, one line.",
      },
    ],
  },
  {
    stage: "why",
    when: "14:05 · why the name is not on the order",
    title: "Why the data is in two tables",
    text: "Nisha asks the obvious question: 'Why not just store the name on the order?'\n\nBecause Aarav has placed five orders, and if his name sat on each one, a change to his phone number would have to be made in five order rows, and one day someone would miss one. So facts about a customer live once, on the customer row, and an order carries only the customer's id, a pointer. The design chapter calls this normalisation; for now: one fact, one place.\n\nThe price of storing a fact once is that reading it back needs a lookup. The join is that lookup, done by the database, for thousands of rows at a time, by matching the pointer (customer_id) to the key it points at (customers.id).",
    jargon: [["pointer", "a column that holds another row's id, like orders.customer_id; the database calls it a foreign key"]],
    diagram: "relationships",
  },
  {
    stage: "concept",
    when: "14:10",
    title: "JOIN … ON, and what happens to rows with no match",
    text: "Now the words. `JOIN table2 ON condition` combines each row of the first table with every row of the second for which the condition is true. Almost always the condition is 'this id equals that pointer'.\n\nThe question that decides which kind of join you need is: what should happen to a row that has no match? A plain JOIN (also called INNER JOIN) drops it. A LEFT JOIN keeps every row from the left table and fills the right side with NULLs when nothing matches. Ishaan has never ordered; with JOIN he vanishes from any customer-and-orders list, with LEFT JOIN he appears with NULL orders.\n\nRIGHT JOIN is LEFT JOIN with the tables swapped; FULL JOIN keeps unmatched rows from both sides. In practice you write LEFT JOIN and put the table you must keep on the left.",
    table: {
      head: ["Join", "Keeps", "Use it for"],
      rows: [
        ["JOIN (inner)", "only rows that match on both sides", "orders with their customer"],
        ["LEFT JOIN", "every left row; NULLs where the right has no match", "customers and their orders, including customers with none"],
        ["RIGHT JOIN", "every right row", "the same thing written the other way round"],
        ["FULL JOIN", "every row from both", "reconciliations: what is in A, in B, or only in one"],
      ],
    },
  },
  {
    stage: "visual",
    when: "14:15",
    title: "Pick a join, watch the rows",
    text: "Dev opens a picture instead of explaining further. Choose a join type and see which customer rows and order rows survive, and where the NULLs come from.",
    diagram: "joins",
    ask: "Which join do you need for 'every product and how many times it was ordered, including products never ordered'?",
  },
  {
    stage: "implement",
    when: "14:20 · 'every customer and their order count'",
    title: "The customer who vanished from the count",
    text: "Nisha wants every customer with how many orders they have placed, zeros included, for a loyalty email. Dev writes it with JOIN, and the list has twelve names. There are thirteen customers.\n\nIshaan has never ordered, so he had no match and the inner join dropped him. LEFT JOIN keeps him, with no order rows attached; COUNT(o.id) counts the order ids in his pile, and NULLs do not count, so he gets 0. That is exactly the number Nisha wanted.",
    queries: [
      {
        title: "Order counts, zero included",
        sql: `SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name\nORDER BY orders DESC, c.name;`,
        lines: [
          { sql: "FROM customers c", say: "Customers on the left: the table we must keep complete." },
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id", say: "Attach each customer's orders; a customer with none stays, with NULL on the order side." },
          { sql: "GROUP BY c.id, c.name", say: "One pile per customer." },
          { sql: "COUNT(o.id) AS orders", say: "Count order ids in the pile. Ishaan's pile holds one NULL, which COUNT(col) skips: 0." },
        ],
        note: "Change LEFT JOIN to JOIN and run again: Ishaan Roy disappears.",
        expect: "thirteen rows. Aarav Mehta 5 at the top, Ishaan Roy 0 at the bottom.",
      },
    ],
  },
  {
    stage: "implement",
    when: "14:30 · 'only paid orders, please'",
    title: "The LEFT JOIN that stopped being LEFT",
    text: "'Same list, but count only paid orders.' Dev adds `WHERE o.status = 'paid'` and the zeros vanish again. Ishaan is gone, and so is anyone whose orders are all shipped or pending.\n\nHere is why. The LEFT JOIN did keep Ishaan, with status NULL. Then WHERE asked 'is NULL equal to paid?', which is unknown, and WHERE drops anything that is not true. The filter on the right-hand table undid the LEFT.\n\nThe fix is to put the condition on the right-hand table into the ON clause. Then it decides which orders get attached, and never which customers survive.",
    diagram: "onVsWhere",
    queries: [
      {
        title: "Wrong: the filter in WHERE",
        sql: `SELECT c.name, COUNT(o.id) AS paid_orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.status = 'paid'\nGROUP BY c.id, c.name\nORDER BY c.name;`,
        lines: [
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id", say: "Keeps every customer, NULL orders for Ishaan." },
          { sql: "WHERE o.status = 'paid'", say: "NULL = 'paid' is unknown, so Ishaan's row (and every customer with no paid order) is dropped. The LEFT is undone." },
        ],
        expect: "fewer than thirteen rows: customers with zero paid orders are missing.",
      },
      {
        title: "Right: the filter in ON",
        sql: `SELECT c.name, COUNT(o.id) AS paid_orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'\nGROUP BY c.id, c.name\nORDER BY paid_orders DESC, c.name;`,
        lines: [
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'", say: "Attach only paid orders. A customer with none still survives, with NULL, and counts as 0." },
        ],
        expect: "all thirteen customers; several show 0 paid orders.",
      },
    ],
  },
  {
    stage: "implement",
    when: "14:40 · 'who has never ordered?'",
    title: "Rows with no match: the anti-join",
    text: "Marketing wants the opposite list: customers who have never ordered, for a welcome offer. That is 'customers with no matching order', and a LEFT JOIN already produced it: those are the rows where the order side is NULL. Keep only them with `WHERE o.id IS NULL`. People call this an anti-join.\n\nThere is a second spelling that reads closer to the English: `WHERE NOT EXISTS (an order for this customer)`. It is the safer habit, because it cannot be broken by a NULL in the data the way NOT IN can, and the next topic explains it in full.",
    diagram: "antiJoin",
    queries: [
      {
        title: "Never ordered, with LEFT JOIN … IS NULL",
        sql: `SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;`,
        lines: [
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id", say: "Attach orders; customers without any get NULL." },
          { sql: "WHERE o.id IS NULL;", say: "Keep exactly the rows where no order was attached." },
        ],
        expect: "Ishaan Roy.",
      },
      {
        title: "The same question with NOT EXISTS",
        sql: `SELECT c.name\nFROM customers c\nWHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`,
        lines: [
          { sql: "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);", say: "For each customer, look for any order of theirs; keep the customer only if none is found. Taught properly in 2.4." },
        ],
        expect: "Ishaan Roy again.",
      },
    ],
  },
  {
    stage: "implement",
    when: "14:50 · HR drops by",
    title: "A table joined to itself",
    text: "HR wants a list of employees with their manager's name. Both are in the employees table: each row has a manager_id that points at another row of the same table.\n\nA table can be joined to itself. Give it two nicknames, e for the employee and m for the manager, and the join reads like any other: the employee's manager_id must equal the manager's id. The CEO has no manager, so a LEFT JOIN keeps her with a blank manager column.",
    diagram: "selfJoin",
    queries: [
      {
        title: "Everyone with their manager",
        sql: `SELECT e.name AS employee, e.dept, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id\nORDER BY e.dept, e.name;`,
        lines: [
          { sql: "FROM employees e", say: "The table once, as 'the employee'." },
          { sql: "LEFT JOIN employees m ON m.id = e.manager_id", say: "The same table again, as 'the manager': the row whose id is the employee's manager_id. LEFT so the CEO survives." },
          { sql: "SELECT e.name AS employee, e.dept, m.name AS manager", say: "Name from the first copy, manager's name from the second." },
        ],
        expect: "ten rows; the CEO, Meera Iyer, has an empty manager column.",
      },
    ],
  },
  {
    stage: "implement",
    when: "15:00 · 'what did Rahul actually buy?'",
    title: "Three tables in a row",
    text: "Nisha is still on the phone with Emma and wants the items in order 7 with product names. The item rows are in order_items, which points at products. So: orders to order_items (one order, many items), then order_items to products (each item, one product). Joins chain: every JOIN adds one more table to the rows you already have.\n\nRead the FROM clause as a path through the schema: orders → order_items → products.",
    diagram: "erd",
    queries: [
      {
        title: "The items in order 7, with names",
        sql: `SELECT o.id AS order_id, p.name AS product, oi.qty, oi.unit_price\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nJOIN products p ON p.id = oi.product_id\nWHERE o.id = 7;`,
        lines: [
          { sql: "JOIN order_items oi ON oi.order_id = o.id", say: "Attach the order's items: one row per item now." },
          { sql: "JOIN products p ON p.id = oi.product_id", say: "For each item row, attach its product, to get the name." },
          { sql: "WHERE o.id = 7;", say: "Only order 7." },
        ],
        expect: "one row: a Mechanical Keyboard, quantity 1, at 89.",
      },
    ],
  },
  {
    stage: "implement",
    when: "15:15 · Finance calls",
    title: "The report that doubled overnight",
    text: "Finance says yesterday's revenue report shows twice the real number for order 1, and it was right last week. Dev looks: last week someone added the payments table to the query so the report could show 'paid so far'.\n\nOrder 1 has 2 items and now 2 payments (one of them a 0 test). Joining orders to items gives 2 rows; joining those to payments gives 2 × 2 = 4 rows. Every item appears twice, every payment twice, and SUM adds them all. Nothing is wrong with the data; the join multiplied it. This is the fan-out trap, and it happens whenever two one-to-many tables hang off the same parent in one FROM.\n\nThe fix is to aggregate each side to one row per order first, then join the two summaries. Pre-aggregate, then join.",
    diagram: "fanOut",
    queries: [
      {
        title: "Wrong: both one-to-many joins at once",
        sql: `INSERT INTO payments (order_id, amount, method, paid_at) VALUES (1, 0.0, 'card', '2025-01-03 10:14:00');\nSELECT o.id,\n       SUM(oi.qty * oi.unit_price) AS items_total,\n       SUM(p.amount) AS paid_total\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nJOIN payments p ON p.order_id = o.id\nWHERE o.id = 1\nGROUP BY o.id;`,
        lines: [
          { sql: "INSERT INTO payments (order_id, amount, method, paid_at) VALUES (1, 0.0, 'card', '2025-01-03 10:14:00');", say: "The second payment row that broke the report (a zero test payment)." },
          { sql: "JOIN order_items oi ON oi.order_id = o.id", say: "2 item rows for order 1." },
          { sql: "JOIN payments p ON p.order_id = o.id", say: "Each of those 2 rows meets 2 payment rows: 4 rows." },
          { sql: "SUM(oi.qty * oi.unit_price) AS items_total,", say: "Adds every item twice." },
        ],
        expect: "items_total 318, exactly twice the real 159; paid_total 318 as well, also doubled.",
      },
      {
        title: "Right: summarise each side, then join",
        sql: `WITH items AS (\n  SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id\n),\npays AS (\n  SELECT order_id, SUM(amount) AS paid_total FROM payments GROUP BY order_id\n)\nSELECT o.id, i.items_total, COALESCE(p.paid_total, 0) AS paid_total\nFROM orders o\nJOIN items i ON i.order_id = o.id\nLEFT JOIN pays p ON p.order_id = o.id\nWHERE o.id = 1;`,
        lines: [
          { sql: "WITH items AS (", say: "Name a summary: one row per order with its items total. WITH just names a piece of the query." },
          { sql: "SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id", say: "The items pile per order." },
          { sql: "pays AS (", say: "A second summary: payments per order." },
          { sql: "JOIN items i ON i.order_id = o.id", say: "One items row per order: no multiplication possible." },
          { sql: "LEFT JOIN pays p ON p.order_id = o.id", say: "One payments row per order, or NULL for unpaid orders." },
        ],
        note: "Press Reset data afterwards to remove the test payment.",
        expect: "order 1: items_total 159, paid_total the real sum. The report is right again.",
      },
    ],
  },
  {
    stage: "compare",
    when: "15:30 · the fix goes up for review",
    title: "Hiding the double vs removing it",
    text: "Two fixes for the doubled report were proposed. One made the number look right. The other made it right.",
    versus: {
      beginner: {
        title: "Patch it with DISTINCT",
        code: "SELECT o.id, SUM(DISTINCT oi.qty * oi.unit_price) AS items_total\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nJOIN payments p ON p.order_id = o.id\nGROUP BY o.id;",
        points: ["Looks right for order 1 today.", "SUM(DISTINCT) also merges two different items that happen to cost the same: a real bug waiting.", "The payments side is still multiplied; nobody checked it.", "Nobody reading it later knows why DISTINCT is there."],
      },
      engineer: {
        title: "Pre-aggregate each side",
        code: "WITH items AS (SELECT order_id, SUM(qty * unit_price) AS t FROM order_items GROUP BY order_id),\n     pays  AS (SELECT order_id, SUM(amount) AS t FROM payments GROUP BY order_id)\nSELECT o.id, i.t AS items_total, COALESCE(p.t, 0) AS paid_total\nFROM orders o JOIN items i ON i.order_id = o.id LEFT JOIN pays p ON p.order_id = o.id;",
        points: ["Each child table is reduced to one row per order before the join, so nothing can multiply.", "Works for any number of items and payments.", "Reads as what it means: items per order, payments per order, then together.", "LEFT JOIN on payments keeps unpaid orders in the report with 0."],
      },
      tradeoffs: ["Two summaries over the whole tables can be slower than one join for a single order; add `WHERE order_id = ?` inside each summary when you only need one.", "DISTINCT is still right when the question really is 'distinct values', e.g. COUNT(DISTINCT customer_id).", "A report with three child tables needs three summaries; that is the shape, not a problem."],
      when: "DISTINCT on a sum is a smell; reach for it only after you can explain why the rows were duplicated. Any report that joins two one-to-many children gets the summaries-then-join shape from the start.",
    },
  },
  {
    stage: "recap",
    title: "Connect it back: order 7, and the report that is right again",
    text: "Order 7 had a name the moment the orders row was matched to its customer row: that is a join. Every question since then was a choice about unmatched rows: drop them (JOIN), keep them with NULLs (LEFT JOIN), keep only them (IS NULL, the anti-join). Filters on the right-hand table belong in ON, not WHERE, or the LEFT is undone. A table can meet itself under two names. Joins chain through the schema. And two one-to-many children of the same parent in one FROM multiply each other, so you summarise each child first.",
    queries: [
      {
        title: "Everything at once: every customer, their orders and what they spent",
        sql: `WITH totals AS (\n  SELECT oi.order_id, SUM(oi.qty * oi.unit_price) AS total FROM order_items oi GROUP BY oi.order_id\n)\nSELECT c.name, COUNT(o.id) AS orders, COALESCE(SUM(t.total), 0) AS spent\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'\nLEFT JOIN totals t ON t.order_id = o.id\nGROUP BY c.id, c.name\nORDER BY spent DESC, c.name;`,
        lines: [
          { sql: "WITH totals AS (", say: "One row per order with its items total, so orders are never multiplied." },
          { sql: "LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'", say: "Every customer survives; cancelled orders are not attached (condition in ON)." },
          { sql: "LEFT JOIN totals t ON t.order_id = o.id", say: "Attach each order's total." },
          { sql: "COALESCE(SUM(t.total), 0) AS spent", say: "Ishaan's SUM is NULL; show 0." },
        ],
        expect: "thirteen rows. Hana Sato and Ishaan Roy sit at the bottom with 0 orders and 0 spent: Hana's only order was cancelled, Ishaan never ordered.",
      },
    ],
    recap: {
      remember: ["JOIN drops unmatched rows; LEFT JOIN keeps the left side with NULLs.", "A condition on the right-hand table goes in ON, not WHERE.", "No match wanted: LEFT JOIN … WHERE right.id IS NULL, or NOT EXISTS.", "Two one-to-many children in one FROM multiply: summarise each, then join."],
      mistakes: ["Filtering the right table in WHERE after a LEFT JOIN.", "Fixing a doubled total with DISTINCT instead of pre-aggregating.", "Forgetting the second alias in a self-join.", "COUNT(*) instead of COUNT(o.id) after a LEFT JOIN: Ishaan would count 1."],
      production: ["Every page that shows a name next to an id is a join.", "Report bugs that 'doubled overnight' are fan-out; look for a new child table in the FROM.", "ORMs load relations with joins or batched IN lists (chapter 4)."],
      next: ["2.4 Subqueries and CTEs: EXISTS, named steps, recursion.", "4.1 Indexes: why the join column needs an index.", "3.1 Normalisation: why the name lives on the customer row."],
    },
    ask: "Nisha's last question: 'customers who bought in January but not in February'. Which join shape is that: inner, left-with-NULL, or something from the next topic?",
  },
];
