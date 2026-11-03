// Ready-to-run queries for the playground, grouped the way the course is. Every one runs on the seed data (tested).

export type Starter = { title: string; sql: string; note?: string };
export type StarterGroup = { group: string; items: Starter[] };

export const STARTERS: StarterGroup[] = [
  {
    group: "Look around",
    items: [
      { title: "Every table and its row count", sql: `SELECT name,\n       (SELECT COUNT(*) FROM sqlite_master) AS objects\nFROM sqlite_master WHERE type = 'table' ORDER BY name;`, note: "sqlite_master is the catalogue: every table, index and view lives there." },
      { title: "Columns of orders", sql: `PRAGMA table_info(orders);` },
      { title: "Foreign keys of order_items", sql: `PRAGMA foreign_key_list(order_items);` },
      { title: "First 10 orders, newest first", sql: `SELECT * FROM orders ORDER BY ordered_at DESC LIMIT 10;` },
    ],
  },
  {
    group: "Filtering and sorting",
    items: [
      { title: "Customers from the UK, by sign-up", sql: `SELECT name, city, signed_up\nFROM customers\nWHERE country = 'UK'\nORDER BY signed_up;` },
      { title: "Products under 50 in two categories", sql: `SELECT name, category, price\nFROM products\nWHERE price < 50 AND category IN ('Books', 'Stationery')\nORDER BY price;` },
      { title: "Who has no manager? (NULL)", sql: `SELECT id, name, dept, manager_id FROM employees WHERE manager_id IS NULL;`, note: "WHERE manager_id = NULL would return nothing. NULL needs IS NULL." },
      { title: "Orders this month vs last month", sql: `SELECT strftime('%Y-%m', ordered_at) AS month, COUNT(*) AS orders\nFROM orders\nGROUP BY month\nORDER BY month DESC;` },
    ],
  },
  {
    group: "Joins",
    items: [
      { title: "Orders with the customer name", sql: `SELECT o.id, c.name, o.ordered_at, o.status\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.id;` },
      { title: "Customers who never ordered (anti-join)", sql: `SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;` },
      { title: "Products never sold", sql: `SELECT p.name, p.category\nFROM products p\nWHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);` },
      { title: "Employees with their manager (self-join)", sql: `SELECT e.name AS employee, e.dept, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id\nORDER BY e.dept, e.name;` },
      { title: "Products and all their tags", sql: `SELECT p.name, GROUP_CONCAT(t.tag, ', ') AS tags\nFROM products p\nLEFT JOIN product_tags t ON t.product_id = p.id\nGROUP BY p.id\nORDER BY p.name;` },
    ],
  },
  {
    group: "Aggregates",
    items: [
      { title: "Revenue per customer", sql: `SELECT c.name,\n       COUNT(DISTINCT o.id)                   AS orders,\n       ROUND(SUM(oi.qty * oi.unit_price), 2)  AS revenue\nFROM customers c\nJOIN orders o       ON o.customer_id = c.id AND o.status <> 'cancelled'\nJOIN order_items oi ON oi.order_id = o.id\nGROUP BY c.id\nORDER BY revenue DESC;` },
      { title: "Categories with more than 2 products (HAVING)", sql: `SELECT category, COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 2\nORDER BY products DESC;` },
      { title: "Best-selling product by quantity", sql: `SELECT p.name, SUM(oi.qty) AS sold\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nGROUP BY p.id\nORDER BY sold DESC\nLIMIT 5;` },
      { title: "Payments vs order totals (do they match?)", sql: `SELECT o.id,\n       ROUND(SUM(oi.qty * oi.unit_price), 2)            AS order_total,\n       (SELECT ROUND(SUM(amount), 2) FROM payments p WHERE p.order_id = o.id) AS paid\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nGROUP BY o.id\nORDER BY o.id;` },
    ],
  },
  {
    group: "Window functions and CTEs",
    items: [
      { title: "Rank customers by revenue", sql: `WITH rev AS (\n  SELECT c.name, ROUND(SUM(oi.qty * oi.unit_price), 2) AS revenue\n  FROM customers c\n  JOIN orders o       ON o.customer_id = c.id\n  JOIN order_items oi ON oi.order_id = o.id\n  GROUP BY c.id\n)\nSELECT name, revenue, RANK() OVER (ORDER BY revenue DESC) AS rnk\nFROM rev;` },
      { title: "Running total of payments", sql: `SELECT paid_at, amount,\n       ROUND(SUM(amount) OVER (ORDER BY paid_at, id), 2) AS running_total\nFROM payments\nORDER BY paid_at, id;` },
      { title: "Top earner per department", sql: `SELECT dept, name, salary\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn\n  FROM employees\n)\nWHERE rn = 1;` },
      { title: "Org chart (recursive CTE)", sql: `WITH RECURSIVE chain(id, name, manager_id, depth) AS (\n  SELECT id, name, manager_id, 0 FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, e.manager_id, chain.depth + 1\n  FROM employees e JOIN chain ON e.manager_id = chain.id\n)\nSELECT printf('%.*c%s', depth * 2, ' ', name) AS tree, depth FROM chain ORDER BY depth, name;` },
      { title: "Gaps: days a user did not log in", sql: `WITH RECURSIVE days(d) AS (\n  SELECT MIN(day) FROM logins\n  UNION ALL\n  SELECT date(d, '+1 day') FROM days WHERE d < (SELECT MAX(day) FROM logins)\n)\nSELECT d AS missing_day\nFROM days\nWHERE d NOT IN (SELECT day FROM logins WHERE user_id = 1)\nLIMIT 20;` },
    ],
  },
  {
    group: "Writing data",
    items: [
      { title: "Insert a customer, then read it back", sql: `INSERT INTO customers (name, email, city, country, signed_up)\nVALUES ('Omar Haddad', 'omar@example.com', 'Dubai', 'UAE', date('now'));\n\nSELECT * FROM customers ORDER BY id DESC LIMIT 3;` },
      { title: "Raise prices in one category", sql: `UPDATE products SET price = ROUND(price * 1.10, 2) WHERE category = 'Books';\n\nSELECT name, price FROM products WHERE category = 'Books';` },
      { title: "Cancel an order and see the effect", sql: `UPDATE orders SET status = 'cancelled' WHERE id = 3;\n\nSELECT id, status FROM orders WHERE id = 3;` },
      { title: "Delete cascades to order_items", sql: `SELECT COUNT(*) AS items_before FROM order_items WHERE order_id = 4;\nDELETE FROM orders WHERE id = 4;\nSELECT COUNT(*) AS items_after FROM order_items WHERE order_id = 4;`, note: "order_items.order_id has ON DELETE CASCADE, so the items go with the order. Order 4 has no payment row; try id = 2 and the payments table refuses the delete." },
      { title: "A rule that refuses bad data (expect an error)", sql: `INSERT INTO products (name, category, price, stock) VALUES ('Broken', 'Books', -5, 1);`, note: "CHECK (price >= 0) refuses the row. The error is the feature." },
    ],
  },
  {
    group: "Transactions",
    items: [
      { title: "Transfer money, all or nothing", sql: `BEGIN;\nUPDATE accounts SET balance = balance - 100, version = version + 1 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100, version = version + 1 WHERE id = 2;\nCOMMIT;\n\nSELECT * FROM accounts;` },
      { title: "Roll back a mistake", sql: `BEGIN;\nUPDATE accounts SET balance = 0;\nSELECT 'inside the transaction' AS stage, * FROM accounts;\nROLLBACK;\nSELECT 'after rollback' AS stage, * FROM accounts;` },
      { title: "Conditional update (the race-safe way)", sql: `UPDATE accounts SET balance = balance - 5000\nWHERE id = 1 AND balance >= 5000;\n\nSELECT changes() AS rows_updated, * FROM accounts WHERE id = 1;`, note: "If nobody had 5000, 0 rows change and the balance never goes negative." },
    ],
  },
  {
    group: "Indexes and plans",
    items: [
      { title: "Plan without an index (full scan)", sql: `EXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 3;` },
      { title: "Add an index, plan again", sql: `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);\nEXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 3;`, note: "Press Show plan on any query to see this without typing EXPLAIN." },
      { title: "All indexes in the database", sql: `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' ORDER BY tbl_name;` },
      { title: "Build a view and query it", sql: `CREATE VIEW IF NOT EXISTS order_totals AS\nSELECT o.id AS order_id, o.customer_id, ROUND(SUM(oi.qty * oi.unit_price), 2) AS total\nFROM orders o JOIN order_items oi ON oi.order_id = o.id\nGROUP BY o.id;\n\nSELECT * FROM order_totals ORDER BY total DESC LIMIT 5;` },
    ],
  },
  {
    group: "Build your own",
    items: [
      { title: "Create a table and fill it", sql: `CREATE TABLE IF NOT EXISTS reviews (\n  id          INTEGER PRIMARY KEY,\n  product_id  INTEGER NOT NULL REFERENCES products(id),\n  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),\n  body        TEXT\n);\nINSERT INTO reviews (product_id, stars, body) VALUES (1, 5, 'Great'), (1, 3, 'OK'), (2, 4, NULL);\n\nSELECT p.name, ROUND(AVG(r.stars), 1) AS avg_stars, COUNT(*) AS reviews\nFROM reviews r JOIN products p ON p.id = r.product_id\nGROUP BY p.id;`, note: "Your new table shows up in the schema panel on the left." },
      { title: "Drop what you built", sql: `DROP TABLE IF EXISTS reviews;\nDROP VIEW IF EXISTS order_totals;\nSELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;` },
    ],
  },
];
