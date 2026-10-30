// "Build the shop": a guided project. Each mission is a small job on the learner's OWN database,
// with automatic checks. Missions build on each other, so they run in order.

export type Check =
  | { kind: "probe"; label: string; sql: string; expect: (string | number | null)[][] } // run on a copy; last result must equal expect
  | { kind: "effect"; label: string; times?: number; sql: string; expect: (string | number | null)[][] } // run the learner's SQL `times` times on a copy, then probe
  | { kind: "result"; label: string; solution: string } // learner's final SELECT must return the same rows as the solution
  | { kind: "fails"; label: string; sql: string } // this statement must be refused
  | { kind: "plan"; label: string; sql: string; includes: string; excludes?: string };

export type Mission = {
  id: string;
  title: string;
  /** The job, as a product owner would say it. */
  goal: string;
  analogy: string;
  why: string;
  /** What to do, in plain steps. */
  steps: string[];
  /** Data to load with one click (shown as code). Applied AFTER the learner's own SQL. */
  data?: string;
  hint: string;
  solution: string;
  checks: Check[];
  /** Topic slug to study if stuck. */
  learn: string;
};

const CUSTOMERS = `INSERT INTO customers (id, name, email, country) VALUES
  (1, 'Aarav Mehta', 'aarav@shop.test', 'India'),
  (2, 'Priya Nair',  'priya@shop.test', 'India'),
  (3, 'Liam Walker', 'liam@shop.test',  'UK'),
  (4, 'Sofia Rossi', 'sofia@shop.test', 'Italy');`;

const PRODUCTS = `INSERT INTO products (id, name, category, price, stock) VALUES
  (1, 'Keyboard',   'Electronics', 89, 10),
  (2, 'USB-C Hub',  'Electronics', 35, 2),
  (3, 'Desk Lamp',  'Furniture',   45, 5),
  (4, 'Clean Code', 'Books',       32, 20),
  (5, 'Yoga Mat',   'Fitness',     25, 8);`;

const ORDERS = `INSERT INTO orders (id, customer_id, ordered_at, status) VALUES
  (1, 1, '2025-01-05', 'paid'),
  (2, 2, '2025-01-20', 'shipped'),
  (3, 1, '2025-02-10', 'paid'),
  (4, 3, '2025-02-14', 'cancelled'),
  (5, 2, '2025-04-02', 'paid'),
  (6, 1, '2025-04-15', 'pending');`;

const ITEMS = `INSERT INTO order_items (id, order_id, product_id, qty, unit_price) VALUES
  (1, 1, 1, 1, 89), (2, 1, 2, 2, 35),
  (3, 2, 4, 1, 32),
  (4, 3, 3, 1, 45), (5, 3, 5, 2, 25),
  (6, 4, 1, 1, 89),
  (7, 5, 4, 3, 32),
  (8, 6, 2, 1, 35);`;

export const MISSIONS: Mission[] = [
  {
    id: "customers-table",
    title: "Create the customers table",
    goal: "The shop needs a place to keep customers: a number, a name, an email that cannot repeat, and a country.",
    analogy: "A class register: one line per student, a roll number that never repeats, and no blank names.",
    why: "Every later mission points at this table; a duplicate email now becomes two accounts for one person later.",
    steps: ["Write `CREATE TABLE customers` with columns id, name, email, country.", "Make id the INTEGER PRIMARY KEY.", "Make name, email and country NOT NULL.", "Add a UNIQUE INDEX on email (an index you can change later)."],
    hint: "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, ...); then CREATE UNIQUE INDEX customers_email ON customers(email);",
    solution: `CREATE TABLE customers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  email   TEXT NOT NULL,
  country TEXT NOT NULL
);
CREATE UNIQUE INDEX customers_email ON customers(email);`,
    checks: [
      { kind: "probe", label: "table customers has columns id, name, email, country", sql: "SELECT name FROM pragma_table_info('customers') ORDER BY cid", expect: [["id"], ["name"], ["email"], ["country"]] },
      { kind: "fails", label: "a duplicate email is refused", sql: "INSERT INTO customers (name, email, country) VALUES ('a', 'dup@x.test', 'IN'), ('b', 'dup@x.test', 'IN')" },
      { kind: "fails", label: "a missing name is refused", sql: "INSERT INTO customers (name, email, country) VALUES (NULL, 'n@x.test', 'IN')" },
    ],
    learn: "tables-keys-relationships",
  },
  {
    id: "load-customers",
    title: "Add the first four customers",
    goal: "Four people signed up. Put them in.",
    analogy: "Filling the first four lines of the register.",
    why: "Real data makes every later query checkable by hand.",
    steps: ["Press 'Load this data' (or paste the INSERT into the editor and Run).", "Check the Data panel shows 4 rows."],
    data: CUSTOMERS,
    hint: "The data is given; just load it. Then SELECT * FROM customers; to look.",
    solution: CUSTOMERS,
    checks: [
      { kind: "probe", label: "4 customers exist", sql: "SELECT COUNT(*) FROM customers", expect: [[4]] },
      { kind: "probe", label: "customer 3 is Liam Walker", sql: "SELECT name FROM customers WHERE id = 3", expect: [["Liam Walker"]] },
    ],
    learn: "writing-data",
  },
  {
    id: "products-table",
    title: "Products with rules",
    goal: "Products have a name, a category, a price that can never be negative, and a stock count that defaults to 0 and can never go below 0.",
    analogy: "A price tag printer that refuses to print a negative price.",
    why: "A CHECK constraint stops every script and admin tool from ever storing nonsense, not just your API.",
    steps: ["CREATE TABLE products with id, name, category, price, stock.", "Add CHECK (price >= 0) and CHECK (stock >= 0).", "Give stock DEFAULT 0 and NOT NULL.", "Then load the data."],
    data: PRODUCTS,
    hint: "stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)",
    solution: `CREATE TABLE products (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  category TEXT NOT NULL,
  price    REAL NOT NULL CHECK (price >= 0),
  stock    INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);`,
    checks: [
      { kind: "fails", label: "a negative price is refused", sql: "INSERT INTO products (name, category, price) VALUES ('Bad', 'X', -1)" },
      { kind: "probe", label: "stock defaults to 0", sql: "INSERT INTO products (name, category, price) VALUES ('Tmp', 'X', 1); SELECT stock FROM products WHERE name = 'Tmp'", expect: [[0]] },
      { kind: "probe", label: "5 products loaded", sql: "SELECT COUNT(*) FROM products", expect: [[5]] },
    ],
    learn: "data-types-and-constraints",
  },
  {
    id: "orders-table",
    title: "Orders that must belong to a real customer",
    goal: "An order has a customer, a date and a status that is one of pending, paid, shipped, cancelled. An order for a customer who does not exist must be refused.",
    analogy: "A visa that must reference a real passport number.",
    why: "Foreign keys are what keep reports adding up; without them you get orders from nobody.",
    steps: ["CREATE TABLE orders with id, customer_id, ordered_at, status.", "customer_id REFERENCES customers(id) and is NOT NULL.", "CHECK (status IN ('pending','paid','shipped','cancelled')).", "Load the data."],
    data: ORDERS,
    hint: "customer_id INTEGER NOT NULL REFERENCES customers(id)",
    solution: `CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_at  TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled'))
);`,
    checks: [
      { kind: "fails", label: "an order for customer 99 is refused", sql: "INSERT INTO orders (customer_id, ordered_at, status) VALUES (99, '2025-01-01', 'paid')" },
      { kind: "fails", label: "status 'done' is refused", sql: "INSERT INTO orders (customer_id, ordered_at, status) VALUES (1, '2025-01-01', 'done')" },
      { kind: "probe", label: "6 orders loaded", sql: "SELECT COUNT(*) FROM orders", expect: [[6]] },
    ],
    learn: "tables-keys-relationships",
  },
  {
    id: "order-items-table",
    title: "Order lines that disappear with their order",
    goal: "Each order has lines: product, quantity (at least 1) and the unit price at the time. Deleting an order must delete its lines automatically.",
    analogy: "Tearing up a receipt also tears up the lines printed on it.",
    why: "The copied unit_price is a deliberate snapshot: the invoice must not change when the catalogue price does.",
    steps: ["CREATE TABLE order_items with id, order_id, product_id, qty, unit_price.", "order_id REFERENCES orders(id) ON DELETE CASCADE.", "product_id REFERENCES products(id).", "CHECK (qty > 0). Load the data."],
    data: ITEMS,
    hint: "order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE",
    solution: `CREATE TABLE order_items (
  id         INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty        INTEGER NOT NULL CHECK (qty > 0),
  unit_price REAL NOT NULL
);`,
    checks: [
      { kind: "probe", label: "8 lines loaded", sql: "SELECT COUNT(*) FROM order_items", expect: [[8]] },
      { kind: "probe", label: "deleting order 6 removes its lines", sql: "DELETE FROM orders WHERE id = 6; SELECT COUNT(*) FROM order_items WHERE order_id = 6", expect: [[0]] },
      { kind: "fails", label: "qty 0 is refused", sql: "INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (1, 1, 0, 1)" },
    ],
    learn: "tables-keys-relationships",
  },
  {
    id: "query-india",
    title: "Customers from India, A to Z",
    goal: "Marketing wants the name and email of every customer in India, sorted by name.",
    analogy: "Pulling the Indian customers' cards from the register and lining them up alphabetically.",
    why: "SELECT, WHERE and ORDER BY are 80% of the queries you will ever write.",
    steps: ["SELECT name, email FROM customers.", "WHERE country = 'India'.", "ORDER BY name."],
    hint: "Two rows: Aarav and Priya.",
    solution: "SELECT name, email FROM customers WHERE country = 'India' ORDER BY name;",
    checks: [{ kind: "result", label: "returns the Indian customers in order", solution: "SELECT name, email FROM customers WHERE country = 'India' ORDER BY name;" }],
    learn: "select-filter-sort",
  },
  {
    id: "orders-with-names",
    title: "Orders with the customer's name",
    goal: "Support wants a list: order id, date, status and the customer's name, newest first.",
    analogy: "Stapling each order to the customer card it points at.",
    why: "Joins turn ids into information; this is the shape of most screens in an app.",
    steps: ["FROM orders o JOIN customers c ON c.id = o.customer_id.", "SELECT o.id, o.ordered_at, o.status, c.name.", "ORDER BY o.ordered_at DESC."],
    hint: "The ON clause links orders.customer_id to customers.id.",
    solution: "SELECT o.id, o.ordered_at, o.status, c.name FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.ordered_at DESC;",
    checks: [{ kind: "result", label: "6 orders with names, newest first", solution: "SELECT o.id, o.ordered_at, o.status, c.name FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.ordered_at DESC;" }],
    learn: "joins",
  },
  {
    id: "revenue-per-customer",
    title: "Revenue per customer, zeros included",
    goal: "Finance wants every customer with their total revenue (qty × unit_price), ignoring cancelled orders. Customers with nothing must show 0, highest first.",
    analogy: "Adding up each customer's receipts, and writing 0 for people who never bought.",
    why: "This combines LEFT JOIN, the ON-vs-WHERE trap and COALESCE: the three things that make revenue reports wrong.",
    steps: ["Start FROM customers c (so nobody is dropped).", "LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled' (filter in ON!).", "LEFT JOIN order_items oi ON oi.order_id = o.id.", "SELECT c.name, COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue, GROUP BY c.id, ORDER BY revenue DESC, c.name."],
    hint: "Aarav 289, Priya 128, Liam 0, Sofia 0. If Liam or Sofia vanish, your status filter is in WHERE.",
    solution: `SELECT c.name, COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name
ORDER BY revenue DESC, c.name;`,
    checks: [{ kind: "result", label: "4 customers, Aarav 289 … Sofia 0", solution: "SELECT c.name, COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled' LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY c.id, c.name ORDER BY revenue DESC, c.name;" }],
    learn: "joins",
  },
  {
    id: "never-ordered",
    title: "Who never ordered?",
    goal: "Marketing wants customers with no orders at all, to send a welcome offer.",
    analogy: "Checking each name on the register against the order pile and keeping the ones with no match.",
    why: "The anti-join is asked in almost every SQL interview, and NOT IN gets it wrong when NULLs appear.",
    steps: ["SELECT name FROM customers c.", "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).", "ORDER BY name."],
    hint: "Exactly one person: Sofia.",
    solution: "SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) ORDER BY name;",
    checks: [{ kind: "result", label: "returns Sofia only", solution: "SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) ORDER BY name;" }],
    learn: "joins",
  },
  {
    id: "monthly-revenue",
    title: "Monthly revenue with the empty month",
    goal: "A chart of revenue per month from 2025-01 to 2025-04. March had no orders and must show 0, not vanish.",
    analogy: "Drawing the calendar first, then writing the sales into each box; empty boxes stay as 0.",
    why: "GROUP BY cannot invent a month with no rows; the calendar must drive the query.",
    steps: ["WITH RECURSIVE months(m) AS (SELECT '2025-01' UNION ALL SELECT strftime('%Y-%m', date(m || '-01', '+1 month')) FROM months WHERE m < '2025-04').", "A second CTE rev: revenue per strftime('%Y-%m', ordered_at), excluding cancelled.", "SELECT months.m, COALESCE(rev.revenue, 0) FROM months LEFT JOIN rev ON rev.m = months.m ORDER BY months.m."],
    hint: "2025-01 → 191, 2025-02 → 95, 2025-03 → 0, 2025-04 → 131.",
    solution: `WITH RECURSIVE months(m) AS (
  SELECT '2025-01' UNION ALL SELECT strftime('%Y-%m', date(m || '-01', '+1 month')) FROM months WHERE m < '2025-04'
),
rev AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS m, SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled' GROUP BY m
)
SELECT months.m AS month, COALESCE(rev.revenue, 0) AS revenue
FROM months LEFT JOIN rev ON rev.m = months.m ORDER BY months.m;`,
    checks: [{ kind: "result", label: "4 months including 2025-03 = 0", solution: "WITH RECURSIVE months(m) AS (SELECT '2025-01' UNION ALL SELECT strftime('%Y-%m', date(m || '-01', '+1 month')) FROM months WHERE m < '2025-04'), rev AS (SELECT strftime('%Y-%m', o.ordered_at) AS m, SUM(oi.qty * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY m) SELECT months.m, COALESCE(rev.revenue, 0) FROM months LEFT JOIN rev ON rev.m = months.m ORDER BY months.m;" }],
    learn: "aggregates-group-by",
  },
  {
    id: "top-product-per-category",
    title: "Best-selling product in each category",
    goal: "For each category, the product with the most units sold (cancelled orders excluded).",
    analogy: "Best student per class: number the students inside each class, keep number 1.",
    why: "Top-N per group is the most common 'hard' report, and the window function makes it one query.",
    steps: ["CTE units: product, category, SUM(qty) per product, joining order_items → orders (status <> 'cancelled') → products.", "Add ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC, name) AS rn.", "Outer query: WHERE rn = 1 ORDER BY category."],
    hint: "Books: Clean Code 4 · Electronics: USB-C Hub 3 · Fitness: Yoga Mat 2 · Furniture: Desk Lamp 1.",
    solution: `WITH units AS (
  SELECT p.category, p.name, SUM(oi.qty) AS units
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.id
),
ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC, name) AS rn FROM units)
SELECT category, name, units FROM ranked WHERE rn = 1 ORDER BY category;`,
    checks: [{ kind: "result", label: "one winner per category", solution: "WITH units AS (SELECT p.category, p.name, SUM(oi.qty) AS units FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' JOIN products p ON p.id = oi.product_id GROUP BY p.id), ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC, name) AS rn FROM units) SELECT category, name, units FROM ranked WHERE rn = 1 ORDER BY category;" }],
    learn: "window-functions",
  },
  {
    id: "running-total",
    title: "Running total of revenue",
    goal: "A passbook view: each non-cancelled order with its total and the cumulative revenue so far, in date order.",
    analogy: "A bank passbook: every line shows the balance so far.",
    why: "Running totals are a window function, not a self-join; this is the shape of every cumulative chart.",
    steps: ["CTE totals: order id, ordered_at, SUM(qty * unit_price) per order, excluding cancelled.", "SELECT id, ordered_at, total, SUM(total) OVER (ORDER BY ordered_at, id) AS running.", "ORDER BY ordered_at, id."],
    hint: "Last running total is 420.",
    solution: `WITH totals AS (
  SELECT o.id, o.ordered_at, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled' GROUP BY o.id
)
SELECT id, ordered_at, total, SUM(total) OVER (ORDER BY ordered_at, id) AS running FROM totals ORDER BY ordered_at, id;`,
    checks: [{ kind: "result", label: "5 orders with a running total ending at 420", solution: "WITH totals AS (SELECT o.id, o.ordered_at, SUM(oi.qty * oi.unit_price) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY o.id) SELECT id, ordered_at, total, SUM(total) OVER (ORDER BY ordered_at, id) AS running FROM totals ORDER BY ordered_at, id;" }],
    learn: "window-functions",
  },
  {
    id: "safe-stock",
    title: "Sell a hub without ever overselling",
    goal: "Write the statement that sells ONE USB-C Hub (product 2, stock 2). It must refuse, not go negative, when stock runs out. The checker runs your statement three times.",
    analogy: "A ticket machine that only prints when a ticket is left; press it as many times as you like.",
    why: "Check-then-write in two steps is a race; one conditional UPDATE is atomic and is the whole fix for flash sales.",
    steps: ["UPDATE products SET stock = stock - 1.", "WHERE id = 2 AND stock >= 1.", "No SELECT first, no transaction needed for one row."],
    hint: "The condition in WHERE is re-checked under the row lock each time.",
    solution: "UPDATE products SET stock = stock - 1 WHERE id = 2 AND stock >= 1;",
    checks: [{ kind: "effect", label: "after 3 runs stock is exactly 0, never negative", times: 3, sql: "SELECT stock FROM products WHERE id = 2", expect: [[0]] }],
    learn: "isolation-levels",
  },
  {
    id: "transfer",
    title: "Wallets and a safe transfer",
    goal: "Add an accounts table (id, owner, balance that cannot go negative) with Aarav 500 and Priya 120, then move 100 from Aarav to Priya inside ONE transaction.",
    analogy: "Moving coins between two jars behind a curtain: both change or neither.",
    why: "Two UPDATEs without a transaction can leave money vanished after a crash; the CHECK stops overdrafts for everyone.",
    steps: ["CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, balance REAL NOT NULL CHECK (balance >= 0)).", "INSERT the two accounts.", "BEGIN; UPDATE … -100 WHERE id = 1 AND balance >= 100; UPDATE … +100 WHERE id = 2; COMMIT;"],
    hint: "Balances afterwards: 400 and 220.",
    solution: `CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY, owner TEXT NOT NULL, balance REAL NOT NULL CHECK (balance >= 0)
);
INSERT OR IGNORE INTO accounts (id, owner, balance) VALUES (1, 'Aarav', 500), (2, 'Priya', 120);
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`,
    checks: [
      { kind: "probe", label: "balances are 400 and 220", sql: "SELECT id, balance FROM accounts ORDER BY id", expect: [[1, 400], [2, 220]] },
      { kind: "fails", label: "an overdraft is refused by the CHECK", sql: "UPDATE accounts SET balance = balance - 1000 WHERE id = 2" },
    ],
    learn: "acid-in-practice",
  },
  {
    id: "idempotent-webhook",
    title: "A payment webhook that can arrive twice",
    goal: "Create payments_in (event_id text primary key, order_id, amount) and write the INSERT for event 'evt_1' (order 1, 159) so that running it three times stores it once.",
    analogy: "A lift button: pressing it five times calls one lift.",
    why: "Payment providers retry webhooks; without idempotency you credit an order twice.",
    steps: ["CREATE TABLE IF NOT EXISTS payments_in (event_id TEXT PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), amount REAL NOT NULL).", "INSERT INTO payments_in (event_id, order_id, amount) VALUES ('evt_1', 1, 159).", "ON CONFLICT (event_id) DO NOTHING."],
    hint: "The primary key is what detects the duplicate; ON CONFLICT decides what to do about it.",
    solution: `CREATE TABLE IF NOT EXISTS payments_in (
  event_id TEXT PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), amount REAL NOT NULL
);
INSERT INTO payments_in (event_id, order_id, amount) VALUES ('evt_1', 1, 159)
ON CONFLICT (event_id) DO NOTHING;`,
    checks: [{ kind: "effect", label: "after 3 runs there is exactly one evt_1 row", times: 3, sql: "SELECT COUNT(*) FROM payments_in WHERE event_id = 'evt_1'", expect: [[1]] }],
    learn: "writing-data",
  },
  {
    id: "index-orders",
    title: "Make 'my orders, newest first' fast",
    goal: "The account page runs: SELECT id FROM orders WHERE customer_id = ? ORDER BY ordered_at DESC. Add the one index that serves the filter AND the sort.",
    analogy: "A phone book sorted by surname, then first name: equality first, then the order you read in.",
    why: "An index must match the query shape; the wrong column order leaves a sort step behind.",
    steps: ["CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at).", "Press 'Show plan' on the query to confirm USING INDEX with no TEMP B-TREE."],
    hint: "Equality column first (customer_id), then the sort column (ordered_at).",
    solution: "CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders (customer_id, ordered_at);",
    checks: [{ kind: "plan", label: "the query uses an index and needs no sort", sql: "SELECT id FROM orders WHERE customer_id = 1 ORDER BY ordered_at DESC", includes: "INDEX idx_orders_customer_date", excludes: "TEMP B-TREE" }],
    learn: "indexes",
  },
  {
    id: "keyset-page",
    title: "Page two, without OFFSET",
    goal: "Orders are listed two per page, ordered by (ordered_at, id). Page one ended at ('2025-01-20', 2). Return page two with keyset pagination.",
    analogy: "Opening the book at the bookmark instead of counting pages from the start.",
    why: "OFFSET reads and throws away every skipped row; a cursor seeks straight to the spot.",
    steps: ["SELECT id, ordered_at FROM orders.", "WHERE (ordered_at, id) > ('2025-01-20', 2).", "ORDER BY ordered_at, id LIMIT 2."],
    hint: "Orders 3 and 4.",
    solution: "SELECT id, ordered_at FROM orders WHERE (ordered_at, id) > ('2025-01-20', 2) ORDER BY ordered_at, id LIMIT 2;",
    checks: [{ kind: "result", label: "returns orders 3 and 4", solution: "SELECT id, ordered_at FROM orders WHERE (ordered_at, id) > ('2025-01-20', 2) ORDER BY ordered_at, id LIMIT 2;" }],
    learn: "query-antipatterns",
  },
  {
    id: "soft-delete",
    title: "Soft delete that lets people come back",
    goal: "Customers must be deletable without losing their orders, and a deleted customer's email must be reusable by a new sign-up, while live emails stay unique.",
    analogy: "The recycle bin: the file is out of the way, can be restored, and its name is free again.",
    why: "A plain UNIQUE blocks re-registration after a soft delete; a partial unique index is the fix.",
    steps: ["DROP INDEX customers_email (the old unique index).", "ALTER TABLE customers ADD COLUMN deleted_at TEXT.", "CREATE UNIQUE INDEX customers_email_live ON customers(email) WHERE deleted_at IS NULL."],
    hint: "A unique INDEX can be dropped; a table-level UNIQUE constraint in SQLite cannot, which is why mission 1 used an index.",
    solution: `DROP INDEX IF EXISTS customers_email;
ALTER TABLE customers ADD COLUMN deleted_at TEXT;
CREATE UNIQUE INDEX customers_email_live ON customers(email) WHERE deleted_at IS NULL;`,
    checks: [
      { kind: "probe", label: "deleted_at column exists", sql: "SELECT name FROM pragma_table_info('customers') WHERE name = 'deleted_at'", expect: [["deleted_at"]] },
      { kind: "fails", label: "a duplicate LIVE email is still refused", sql: "INSERT INTO customers (name, email, country) VALUES ('Dup', 'aarav@shop.test', 'India')" },
      { kind: "probe", label: "after soft-deleting Aarav, his email can be reused", sql: "UPDATE customers SET deleted_at = '2025-05-01' WHERE id = 1; INSERT INTO customers (name, email, country) VALUES ('Aarav again', 'aarav@shop.test', 'India'); SELECT COUNT(*) FROM customers WHERE email = 'aarav@shop.test'", expect: [[2]] },
    ],
    learn: "real-world-schema-patterns",
  },
  {
    id: "audit-trigger",
    title: "Who changed the order status?",
    goal: "Every status change on orders must be recorded automatically in order_events (order_id, from_status, to_status, at).",
    analogy: "A parcel tracking page that writes a new line every time the parcel moves.",
    why: "Overwriting status in place loses history; a trigger records it without touching application code.",
    steps: ["CREATE TABLE order_events (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), from_status TEXT, to_status TEXT, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP).", "CREATE TRIGGER orders_status_audit AFTER UPDATE OF status ON orders WHEN OLD.status <> NEW.status BEGIN INSERT INTO order_events (order_id, from_status, to_status) VALUES (NEW.id, OLD.status, NEW.status); END;"],
    hint: "Inside a trigger, OLD and NEW are the row before and after the change.",
    solution: `CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
  from_status TEXT, to_status TEXT, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS orders_status_audit AFTER UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO order_events (order_id, from_status, to_status) VALUES (NEW.id, OLD.status, NEW.status);
END;`,
    checks: [{ kind: "probe", label: "shipping order 1 writes paid → shipped", sql: "UPDATE orders SET status = 'shipped' WHERE id = 1; SELECT from_status, to_status FROM order_events WHERE order_id = 1", expect: [["paid", "shipped"]] }],
    learn: "real-world-schema-patterns",
  },
  {
    id: "dashboard",
    title: "The owner's dashboard",
    goal: "One query for the shop owner: per category, revenue, units sold and number of distinct customers, cancelled orders excluded, highest revenue first.",
    analogy: "The end-of-day summary on the till, one line per shelf.",
    why: "This is the query shape behind every dashboard tile: join, filter early, group, aggregate three ways.",
    steps: ["FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' JOIN products p ON p.id = oi.product_id.", "SELECT p.category, SUM(oi.qty * oi.unit_price) AS revenue, SUM(oi.qty) AS units, COUNT(DISTINCT o.customer_id) AS customers.", "GROUP BY p.category ORDER BY revenue DESC."],
    hint: "Electronics 194 / 4 units / 2 customers is the top line.",
    solution: `SELECT p.category,
       SUM(oi.qty * oi.unit_price)  AS revenue,
       SUM(oi.qty)                  AS units,
       COUNT(DISTINCT o.customer_id) AS customers
FROM order_items oi
JOIN orders o   ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY revenue DESC;`,
    checks: [{ kind: "result", label: "4 categories, Electronics first", solution: "SELECT p.category, SUM(oi.qty * oi.unit_price) AS revenue, SUM(oi.qty) AS units, COUNT(DISTINCT o.customer_id) AS customers FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' JOIN products p ON p.id = oi.product_id GROUP BY p.category ORDER BY revenue DESC;" }],
    learn: "aggregates-group-by",
  },
];
