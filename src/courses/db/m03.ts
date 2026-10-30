import type { Module } from "../types";

export const M03: Module = {
  id: "design",
  title: "Designing schemas that survive",
  simple: "Normalisation without the jargon, the patterns real products use, and how to change a live schema without downtime.",
  topics: [
    {
      slug: "normalization",
      title: "Normalisation: one fact, one place",
      minutes: 16,
      story: "Your address written on 40 different letters. You move house, update 38 of them, and two parcels still go to the old place. Normalisation is writing your address once and having every letter point at it.",
      tldr: [
        "Normalisation = remove duplication so a fact lives in **one row of one table**.",
        "**1NF:** no lists in a cell. **2NF:** every column depends on the whole key. **3NF:** no column depends on another non-key column.",
        "The practical test: 'if this value changes, how many rows must I update?' If more than one, split.",
        "**Denormalise on purpose** for read speed (counters, snapshots, reporting), never by accident.",
      ],
      words: [
        ["functional dependency", "column B is determined by column A (A → B), e.g. product_id → price"],
        ["normal form", "a level of 'how little duplication' a table has"],
        ["anomaly", "a bug that duplication causes: update, insert or delete going wrong"],
        ["denormalisation", "copying data on purpose to make reads faster"],
      ],
      sections: [
        {
          title: "From one messy table to three clean ones",
          analogy: "Your address written on 40 letters: move house and you must fix all 40. Write it once in an address book and point the letters at it.",
          why: "Duplication is how databases drift into contradicting themselves.",
          diagram: "normalization",
          bullets: [
            "**Update anomaly:** Aarav moves city; you update one order row and miss the other.",
            "**Insert anomaly:** you cannot add a new product until someone orders it.",
            "**Delete anomaly:** deleting Priya's only order deletes the only record that Priya exists.",
          ],
        },
        {
          title: "The three normal forms, in plain words",
          analogy: "Tidying a kitchen: no two things in one jar (1NF), each shelf holds only what belongs to it (2NF), nothing stored in a place that depends on something else (3NF).",
          why: "Normal forms are the checklist interviewers use to ask 'what is wrong with this table'.",
          diagram: "normalForms",
          table: {
            head: ["Form", "Rule", "Violation looks like", "Fix"],
            rows: [
              ["1NF", "every cell holds one value; rows are unique", "`tags = 'office,gaming'` in one column", "a product_tags table with one row per tag"],
              ["2NF", "every non-key column depends on the **whole** primary key", "order_items(order_id, product_id, product_name): name depends only on product_id", "move product_name to products"],
              ["3NF", "no non-key column depends on another non-key column", "orders(customer_id, customer_city): city depends on customer, not on the order", "move city to customers"],
              ["BCNF", "every determinant is a candidate key (stricter 3NF)", "rare in practice; overlapping composite keys", "split again"],
            ],
          },
          tip: "Interview one-liner for 3NF: 'every non-key column depends on the key, the whole key, and nothing but the key.'",
        },
        {
          title: "See the anomaly, then fix it with SQL",
          analogy: "Taking one messy spreadsheet and splitting it into customers, products and orders sheets that reference each other.",
          why: "Doing the split once by hand makes the theory obvious.",
          sql: [
            {
              title: "A flat table and its duplication",
              sql: `CREATE TABLE IF NOT EXISTS orders_flat (order_id INTEGER, customer TEXT, city TEXT, product TEXT, price REAL);
INSERT INTO orders_flat VALUES (1,'Aarav','Mumbai','Lamp',45),(2,'Aarav','Mumbai','Mat',25),(3,'Priya','Kochi','Lamp',45);
-- how many rows hold the fact "Aarav lives in Mumbai"?
SELECT customer, COUNT(*) AS rows_holding_city FROM orders_flat GROUP BY customer;`,
            },
            {
              title: "Split it: one INSERT ... SELECT DISTINCT per entity",
              sql: `CREATE TABLE IF NOT EXISTS n_customers (id INTEGER PRIMARY KEY, name TEXT UNIQUE, city TEXT);
CREATE TABLE IF NOT EXISTS n_products  (id INTEGER PRIMARY KEY, name TEXT UNIQUE, price REAL);
CREATE TABLE IF NOT EXISTS n_orders    (id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER);
INSERT OR IGNORE INTO n_customers (name, city) SELECT DISTINCT customer, city FROM orders_flat;
INSERT OR IGNORE INTO n_products  (name, price) SELECT DISTINCT product, price FROM orders_flat;
INSERT OR IGNORE INTO n_orders (id, customer_id, product_id)
SELECT f.order_id, c.id, p.id FROM orders_flat f
JOIN n_customers c ON c.name = f.customer JOIN n_products p ON p.name = f.product;
-- the same report, now from clean tables
SELECT o.id, c.name, c.city, p.name AS product, p.price
FROM n_orders o JOIN n_customers c ON c.id = o.customer_id JOIN n_products p ON p.id = o.product_id;`,
              note: "Run the first box before this one. Reset data removes these scratch tables.",
            },
          ],
        },
        {
          title: "When to denormalise (on purpose)",
          analogy: "A receipt keeps the price you paid even if the shelf price changes tomorrow. That copy is deliberate.",
          why: "Normalising history breaks invoices; copying current facts breaks consistency. Know which is which.",
          visual: {"kind": "compare", "left": {"title": "Current fact → normalise", "lines": ["product's price today", "customer's city", "lives in ONE row; read through the FK"]}, "right": {"title": "Historical fact → snapshot", "lines": ["price the customer agreed to pay", "address the parcel went to", "copied at the moment it happened; never updated"]}, "caption": "Both are correct. The question is which kind of fact you are storing."},
          table: {
            head: ["Pattern", "What you copy", "Why", "How you keep it right"],
            rows: [
              ["Order snapshot", "unit_price, product name into order_items", "history must not change when the catalogue changes", "copy at order time; never update"],
              ["Counter cache", "posts.comment_count", "COUNT(*) on every page view is expensive", "update in the same transaction as the insert, or recompute nightly"],
              ["Reporting table / materialised view", "pre-joined, pre-aggregated rows", "dashboards hit it instead of 6 joins", "refresh on a schedule or incrementally"],
              ["Search column", "lower(name) || ' ' || email as search_text", "one indexed column to search", "generated column / trigger"],
            ],
          },
          warn: "Our order_items.unit_price is denormalised on purpose. The product's price can change tomorrow; the invoice must not.",
        },
      ],
      realWorld: [
        {
          title: "Invoices changed after a price update",
          problem: "Marketing raised the lamp price from 45 to 55. Every old invoice PDF regenerated from the database now shows 55, and customers complain they were overcharged.",
          whyHard: "The schema was 'perfectly normalised': order_items referenced products and read the price through the join. Normalisation textbooks say that is correct, and it is, for current facts. Invoices are historical facts.",
          steps: [
            "Ask what kind of fact it is: **current** (product's price today) or **historical** (what the customer agreed to pay).",
            "Historical facts are copied at the moment they happen: add `unit_price` (and often `product_name`) to `order_items`.",
            "Write them in the same INSERT that creates the item; never update them.",
            "Keep the FK to products for navigation, but never read price through it for invoices.",
          ],
          sql: `-- Our schema already does this. Compare the agreed price with the catalogue price:
UPDATE products SET price = 55 WHERE id = 6;          -- lamp price goes up today
SELECT oi.order_id, p.name, oi.unit_price AS agreed, p.price AS catalogue_now
FROM order_items oi JOIN products p ON p.id = oi.product_id
WHERE p.id = 6;`,
          takeaway: "Normalise current facts; snapshot historical ones. Both are 'correct'; the question is which kind of fact you store.",
        },
      ],
      practice: [
        {
          q: "A table employees(id, name, dept_id, dept_name, dept_floor). Which normal form does it break and how do you fix it?",
          answer: "3NF: dept_name and dept_floor depend on dept_id, not on the employee. Move them to a departments table and keep dept_id as a FK.",
          explain: "A non-key column (dept_name) depends on another non-key column (dept_id): a transitive dependency.",
        },
        {
          q: "Show which product names appear in order_items with more than one distinct unit_price (prices that changed over time).",
          answer: "USB-C Hub: 2 distinct prices (32.00 on order 16, 35.00 elsewhere). The catalogue price changed between orders and the snapshots kept both.",
          explain: "GROUP BY product and COUNT(DISTINCT unit_price) > 1 finds snapshots that differ.",
          sql: `SELECT p.name, COUNT(DISTINCT oi.unit_price) AS prices
FROM order_items oi JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name
HAVING COUNT(DISTINCT oi.unit_price) > 1;`,
        },
        {
          q: "Give one case where you would deliberately keep a duplicate value, and how you keep it consistent.",
          answer: "A comment_count on posts: update it in the same transaction as inserting the comment (or via a trigger), and have a nightly job recompute it to catch drift.",
          explain: "Denormalisation trades write complexity for read speed; the key is a single place that maintains the copy.",
        },
      ],
      interview: [
        { level: "junior", q: "What is normalisation and why do we do it?", a: "Organising tables so each fact is stored once. It prevents update, insert and delete anomalies: changing a customer's city means changing one row, not every order. The usual target is third normal form, where every non-key column depends on the key, the whole key, and nothing but the key." },
        { level: "mid", q: "Explain 1NF, 2NF and 3NF with an example.", a: "1NF: no lists in a cell, so tags go in their own table. 2NF: with a composite key like (order_id, product_id), a column like product_name that depends on only product_id must move out. 3NF: a column that depends on another non-key column, like customer_city in orders, moves to the customers table." },
        { level: "mid", q: "When would you denormalise?", a: "When reads dominate and a measured query is too slow: counters like comment_count, snapshots like the unit price on an order line, and reporting tables. I keep one code path that maintains the copy, usually the same transaction or a trigger, plus a periodic recompute to catch drift." },
        { level: "senior", q: "Is a fully normalised schema always the right design?", a: "No. Normalisation is about current facts, so it is wrong for history: an invoice must keep the price agreed at the time even if the catalogue changes. It is also a trade-off against read performance. I normalise by default, then snapshot historical facts and denormalise hot read paths deliberately, with the copy maintained in one place." },
      ],
      remember: [
        "One fact, one place. Test: 'how many rows change if this fact changes?'",
        "3NF: key, whole key, nothing but the key.",
        "Current facts → normalise. Historical facts → snapshot.",
        "Denormalise on purpose with one maintainer and a recompute.",
      ],
    },

    {
      slug: "real-world-schema-patterns",
      title: "Schema patterns real products use",
      minutes: 22,
      story: "Every city has the same parts: roads, addresses, a postal system. You do not invent them per city. Schemas have the same recurring parts: soft deletes, audit trails, tenants, status machines, trees.",
      tldr: [
        "Multi-tenant: `tenant_id` on every table, in every index, in every query (or Row Level Security).",
        "Soft delete: `deleted_at` + a partial unique index so deleted rows do not block re-use.",
        "History: an append-only events/audit table beats updating in place when you must explain the past.",
        "Trees: adjacency list (simple) → closure table or materialised path when you read trees constantly.",
      ],
      words: [
        ["tenant", "one customer organisation whose data must never mix with another's"],
        ["soft delete", "marking a row as deleted instead of removing it"],
        ["audit log", "an append-only record of who changed what and when"],
        ["state machine", "a fixed set of statuses and the allowed moves between them"],
        ["closure table", "a table storing every ancestor-descendant pair of a tree"],
      ],
      sections: [
        {
          title: "Multi-tenant SaaS",
          analogy: "An apartment building: shared walls and plumbing, but every flat has a number on every key, letter and bill.",
          why: "Forget the tenant id once and one customer sees another customer's data.",
          visual: {"kind": "cards", "items": [{"title": "Shared tables + tenant_id", "lines": ["one schema for everyone", "tenant_id first in every index and unique", "Row Level Security as a safety net"], "tone": "ok"}, {"title": "Schema per tenant", "lines": ["strong isolation", "migrations × 1,000 tenants", "connection pools per schema"], "tone": "warn"}, {"title": "Database per tenant", "lines": ["regulated or huge customers only", "full isolation, full ops cost"], "tone": "bad"}]},
          bullets: [
            "**Shared tables + tenant_id** (most common): one schema, every table has `tenant_id`, every index starts with it, every query filters by it.",
            "**Schema per tenant:** strong isolation, painful migrations × 1,000 tenants.",
            "**Database per tenant:** for regulated or huge customers only.",
            "Postgres **Row Level Security** enforces the filter in the database: `CREATE POLICY ... USING (tenant_id = current_setting('app.tenant')::int)`. A forgotten WHERE can no longer leak data.",
          ],
          code: [
            {
              lang: "sql",
              title: "Shape of a tenant-scoped table",
              src: `CREATE TABLE projects (
  id          bigserial PRIMARY KEY,
  tenant_id   bigint NOT NULL REFERENCES tenants(id),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)                       -- unique per tenant, not globally
);
CREATE INDEX ON projects (tenant_id, created_at DESC);  -- every hot index leads with tenant_id`,
            },
          ],
        },
        {
          title: "Soft delete done right",
          analogy: "Moving a file to the recycle bin instead of shredding it: it is out of the way but can be restored, and its name is free to reuse.",
          why: "Hard deletes lose history; naive soft deletes block re-registration and leak into reports.",
          visual: {"kind": "ladder", "steps": [{"label": "ADD COLUMN deleted_at timestamptz", "sub": "NULL = live"}, {"label": "partial UNIQUE index … WHERE deleted_at IS NULL", "sub": "a deleted user can sign up again", "tone": "ok"}, {"label": "partial index for live rows", "sub": "small and fast for 99% of queries", "tone": "ok"}, {"label": "default filter in a view or ORM scope", "sub": "so nobody forgets WHERE deleted_at IS NULL", "tone": "warn"}]},
          code: [
            {
              lang: "sql",
              src: `ALTER TABLE customers ADD COLUMN deleted_at timestamptz;
-- email must be unique among LIVE rows only, so a deleted user can sign up again
CREATE UNIQUE INDEX customers_email_live ON customers (lower(email)) WHERE deleted_at IS NULL;
-- most queries only want live rows; a partial index keeps them small
CREATE INDEX customers_live ON customers (tenant_id) WHERE deleted_at IS NULL;`,
            },
          ],
          warn: "Every query must now add `WHERE deleted_at IS NULL`. Hide it behind a view or the ORM's default scope, and remember foreign keys still point at 'deleted' rows.",
        },
        {
          title: "Status fields and state machines",
          analogy: "A parcel tracking page: pending → paid → shipped. It cannot jump from pending to shipped, and only one person can move it at a time.",
          why: "Unguarded status updates let two workers ship the same order.",
          diagram: "stateMachine",
          bullets: [
            "Constrain the vocabulary: `CHECK (status IN ('pending','paid','shipped','cancelled'))` or an enum.",
            "Enforce transitions in one place: `UPDATE orders SET status = 'shipped' WHERE id = ? AND status = 'paid'` and check the row count. A 0 means someone else moved it first.",
            "Record each transition in `order_events(order_id, from_status, to_status, at, by)`; the current status is a cache of the last event.",
          ],
          sql: [
            {
              title: "A guarded transition",
              sql: `UPDATE orders SET status = 'shipped' WHERE id = 3 AND status = 'paid';
SELECT changes() AS rows_moved;   -- 1 = we moved it, 0 = it was not in 'paid'`,
            },
          ],
        },
        {
          title: "History and audit",
          analogy: "A bank statement never edits old lines; it appends new ones. The balance is the sum.",
          why: "'Who changed this and when?' is unanswerable if you overwrite in place.",
          table: {
            head: ["Need", "Pattern", "Notes"],
            rows: [
              ["Who changed what", "audit_log(table, row_id, actor, before jsonb, after jsonb, at)", "written by a trigger or the service layer"],
              ["Value over time", "price_history(product_id, price, valid_from, valid_to)", "query with `valid_from <= t AND (valid_to IS NULL OR t < valid_to)`"],
              ["Money", "ledger_entries append-only, double entry", "balance = SUM(entries); never UPDATE a balance in place"],
              ["Undo / replay", "event sourcing: events are the truth, state is a projection", "powerful, heavy; only for domains that need it"],
            ],
          },
        },
        {
          title: "Trees and hierarchies",
          analogy: "A folder tree: store each folder's parent (simple), the full path (fast to find everything under a folder), or every ancestor pair (fastest, most bookkeeping).",
          why: "Categories, org charts and comment threads are trees; the wrong model makes 'show everything under X' slow.",
          diagram: "treeModels",
          table: {
            head: ["Model", "Storage", "Read subtree", "Move node", "Use when"],
            rows: [
              ["Adjacency list", "parent_id", "recursive CTE", "one UPDATE", "default; trees are small or reads are rare"],
              ["Materialised path", "path '1/4/9/'", "`WHERE path LIKE '1/4/%'`", "rewrite paths of descendants", "read-heavy, breadcrumbs"],
              ["Closure table", "(ancestor, descendant, depth) for every pair", "one join", "delete/insert many pairs", "deep trees read constantly"],
              ["Nested sets", "left/right numbers", "range query", "renumber lots", "legacy; avoid"],
            ],
          },
        },
        {
          title: "Other recurring parts",
          analogy: "The standard parts every city has: addresses, postcodes, timestamps. You do not reinvent them per building.",
          why: "Reusing known patterns saves weeks and avoids known traps.",
          bullets: [
            "**Polymorphic links** (comment on a post OR a photo): prefer separate FK columns with a CHECK that exactly one is set, over a `(target_type, target_id)` pair that FKs cannot check.",
            "**Tags:** `tags(id, name UNIQUE)` + `item_tags(item_id, tag_id)`; a text[] column is fine for display-only tags.",
            "**Addresses:** their own table; a user has many, an order snapshots one.",
            "**Settings:** JSONB with a documented shape, or a key/value table when you must query by key.",
            "**Timestamps:** `created_at`, `updated_at` on everything; it costs nothing and saves you later.",
          ],
        },
      ],
      realWorld: [
        {
          title: "No double bookings, ever",
          problem: "A hotel app lets two guests book room 101 for overlapping nights because both requests checked availability at the same time and both saw it free.",
          whyHard: "The check (`SELECT` for overlaps) and the write (`INSERT`) are separate steps. Two requests interleave between them. Application locks and 'check again after insert' are fragile.",
          steps: [
            "Define overlap precisely: two ranges overlap when `a.start < b.end AND b.start < a.end` (half-open: checkout day is free for the next guest).",
            "Postgres has the perfect tool: an **exclusion constraint** with a range type: `EXCLUDE USING gist (room_id WITH =, daterange(starts_at, ends_at) WITH &&)`. The database refuses the second overlapping insert, no application lock needed.",
            "Without exclusion constraints (MySQL/SQLite): lock the room row (`SELECT ... FOR UPDATE` on rooms), check overlaps, insert, commit. The row lock serialises bookings per room.",
            "Either way, the overlap query is the same, so write it once and test it.",
          ],
          sql: `-- Find overlapping bookings per room (half-open intervals: end day is free)
SELECT a.room_id, a.guest AS first_guest, b.guest AS second_guest, a.starts_at, a.ends_at, b.starts_at AS b_start, b.ends_at AS b_end
FROM bookings a
JOIN bookings b ON b.room_id = a.room_id AND b.id > a.id
WHERE a.starts_at < b.ends_at AND b.starts_at < a.ends_at;
-- Emma (102, Jul 5–8) vs Sofia (102, Jul 2–5): no overlap, because 5 is a checkout day.`,
          code: {
            lang: "sql",
            title: "Postgres: let the database refuse overlaps",
            src: `CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (room_id WITH =, daterange(starts_at, ends_at, '[)') WITH &&);
-- second overlapping INSERT now fails with "conflicting key value violates exclusion constraint"`,
          },
          takeaway: "Push invariants into constraints when the database offers one. When it does not, serialise the critical section with a row lock, not with application code.",
        },
      ],
      practice: [
        {
          q: "List rooms with more than one booking and the number of bookings.",
          answer: "Room 101 → 3, room 102 → 2.",
          explain: "GROUP BY room_id and HAVING COUNT(*) > 1.",
          sql: `SELECT room_id, COUNT(*) AS bookings FROM bookings GROUP BY room_id HAVING COUNT(*) > 1 ORDER BY room_id;`,
        },
        {
          q: "Design the tables for 'a comment can be on a post or on a photo'. Which option keeps foreign keys enforceable?",
          answer: "comments(id, post_id NULL REFERENCES posts, photo_id NULL REFERENCES photos, CHECK ((post_id IS NULL) <> (photo_id IS NULL))). The (target_type, target_id) pair cannot be enforced by FKs.",
          explain: "Separate nullable FKs with a CHECK that exactly one is set keep referential integrity.",
        },
        {
          q: "A SaaS has 2,000 tenants. Which multi-tenancy model do you pick by default and what is the one rule every index must follow?",
          answer: "Shared tables with tenant_id; every hot index starts with tenant_id and every unique constraint includes it. Consider Row Level Security so a missing WHERE cannot leak data.",
          explain: "Leading with tenant_id makes every per-tenant query an index range scan instead of touching other tenants' rows.",
        },
      ],
      interview: [
        { level: "mid", q: "How do you design a multi-tenant database?", a: "By default, shared tables with a tenant_id column on every table, included in every index and unique constraint, and filtered in every query. In Postgres I add Row Level Security so the database enforces the filter. Schema-per-tenant or database-per-tenant only for customers with strict isolation needs." },
        { level: "mid", q: "What are the pitfalls of soft delete?", a: "Every query must filter deleted rows, unique constraints block re-using an email unless the index is partial on deleted_at IS NULL, foreign keys still point at deleted rows, and tables grow forever. I hide the filter in a view or ORM scope and archive old deleted rows." },
        { level: "senior", q: "How would you prevent double bookings?", a: "In Postgres, an exclusion constraint on (room_id, daterange) with the && overlap operator, so the second overlapping insert fails atomically. Elsewhere, I lock the room row with SELECT FOR UPDATE, check for overlaps using start < other_end AND other_start < end, insert, and commit. The constraint is better because it cannot be bypassed." },
        { level: "senior", q: "How do you store money movements?", a: "As an append-only ledger with double-entry rows: every transfer writes a debit and a credit that sum to zero, never an UPDATE of a balance column. The balance is a SUM, cached if needed. This gives an audit trail, makes reconciliation possible, and avoids lost updates on a mutable balance." },
      ],
      remember: [
        "tenant_id everywhere, first in every index; RLS as a safety net.",
        "Soft delete needs partial unique indexes and a default filter.",
        "Guarded transitions: UPDATE ... WHERE status = 'from' and check the row count.",
        "Overlaps: start < other.end AND other.start < end; exclusion constraint in Postgres.",
      ],
    },

    {
      slug: "ids-and-migrations",
      title: "IDs, migrations and zero-downtime schema changes",
      minutes: 16,
      story: "Changing the tyres on a moving car. You cannot stop the car (the app), so you add the new wheel beside the old one, shift the weight over, then remove the old one. That is expand, migrate, contract.",
      tldr: [
        "Migrations are code: versioned files, run in order, applied in CI and production the same way.",
        "**Expand → migrate → contract:** add the new thing, move the data, keep both working, then remove the old thing in a later release.",
        "On big tables, `ADD COLUMN NOT NULL` without a default, backfills in one UPDATE, and plain `CREATE INDEX` all lock or stall. Use batches and `CONCURRENTLY`.",
        "Never rename a column in one step: add, dual-write, backfill, switch reads, drop.",
      ],
      words: [
        ["migration", "a versioned script that changes the schema (and sometimes data)"],
        ["backfill", "filling a new column for existing rows"],
        ["dual write", "writing to both the old and the new column during a transition"],
        ["lock", "the database stopping other sessions from touching a table while it changes"],
      ],
      sections: [
        {
          title: "Migrations as code",
          analogy: "Renovation plans filed with the council: every change written down, numbered, applied in order on every site.",
          why: "Schema changes done by hand drift between environments and cannot be reviewed.",
          visual: {"kind": "flow", "steps": [{"label": "migration file", "sub": "versioned, never edited after shipping", "tone": "accent"}, {"label": "CI: fresh DB", "sub": "does it apply from zero?"}, {"label": "CI: prod-sized copy", "sub": "how long does it lock?", "tone": "warn"}, {"label": "deploy", "sub": "runs before the code that needs it", "tone": "ok"}]},
          code: [
            {
              lang: "ts",
              title: "A migration file (Knex / Prisma / TypeORM all look like this)",
              src: `// 20250701_add_phone_to_customers.ts
export async function up(db) {
  await db.schema.alterTable("customers", (t) => {
    t.string("phone");                      // nullable first (expand)
  });
}
export async function down(db) {
  await db.schema.alterTable("customers", (t) => t.dropColumn("phone"));
}`,
            },
          ],
          bullets: [
            "One migration per change, never edited after it ships. Fix forward with a new one.",
            "Run them in CI against a fresh database and against a copy of production data for timing.",
            "Separate **schema** migrations (fast, DDL) from **data** migrations (slow, batched).",
          ],
        },
        {
          title: "What locks and what does not (Postgres)",
          analogy: "Changing a sign on a shop door takes a second; rebuilding the shelves closes the shop for hours. Know which change is which.",
          why: "A 'tiny' migration can freeze production for minutes.",
          visual: {"kind": "compare", "left": {"title": "✓ Metadata only (safe)", "lines": ["ADD COLUMN nullable / with constant DEFAULT", "DROP COLUMN (after code stops reading it)", "ADD CONSTRAINT … NOT VALID"]}, "right": {"title": "✗ Rewrites or locks (dangerous on big tables)", "lines": ["ADD COLUMN NOT NULL without default (old PG)", "ALTER COLUMN TYPE", "plain CREATE INDEX (blocks writes)", "ADD FOREIGN KEY without NOT VALID"]}, "caption": "Even a fast DDL waits for an exclusive lock, and every query queues behind it. Set lock_timeout."},
          table: {
            head: ["Change", "Safe?", "Why / how"],
            rows: [
              ["ADD COLUMN nullable, or NOT NULL with a constant DEFAULT (PG 11+)", "yes", "metadata only"],
              ["ADD COLUMN NOT NULL without default on a big table", "no", "must rewrite/check every row; add nullable, backfill, then add the constraint"],
              ["CREATE INDEX", "no", "locks writes for the duration; use CREATE INDEX CONCURRENTLY"],
              ["ADD FOREIGN KEY", "slow", "scans the table; add with NOT VALID, then VALIDATE CONSTRAINT separately"],
              ["ALTER COLUMN TYPE", "no", "rewrites the table; add new column, migrate, swap"],
              ["DROP COLUMN", "yes (fast)", "but deploy code that stops reading it FIRST"],
              ["RENAME", "fast but breaks old code", "do it as add + dual write + drop instead"],
            ],
          },
          warn: "Even a fast DDL waits for an ACCESS EXCLUSIVE lock, and while it waits, every new query on that table queues behind it. Set `lock_timeout = '5s'` and retry rather than freezing production.",
        },
        {
          title: "Expand, migrate, contract",
          analogy: "Changing tyres on a moving car: fit the new wheel beside the old one, shift the weight, then remove the old one.",
          why: "Renaming in one step breaks the code that is still running.",
          diagram: "expandContract",
          code: [
            {
              lang: "sql",
              title: "Rename users.fullname → users.display_name with zero downtime",
              src: `-- Release 1 (expand): add the new column; app writes BOTH columns, reads the old one
ALTER TABLE users ADD COLUMN display_name text;

-- Backfill in batches (never one giant UPDATE: it locks rows and bloats the table)
UPDATE users SET display_name = fullname
WHERE id IN (SELECT id FROM users WHERE display_name IS NULL AND fullname IS NOT NULL LIMIT 5000);
-- ...repeat until 0 rows

-- Release 2 (migrate): app reads the new column; still writes both
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;   -- fast once backfilled (PG 12+ uses a CHECK trick)

-- Release 3 (contract): app stops writing the old column; drop it
ALTER TABLE users DROP COLUMN fullname;`,
            },
          ],
          tip: "Each release must work with both the previous and the next schema, because deploys roll out gradually and roll back sometimes.",
        },
        {
          title: "Choosing identifiers",
          analogy: "Ticket numbers: sequential for the internal queue, a random code printed on the ticket you hand out.",
          why: "Exposed sequential ids let strangers enumerate your data; random ids hurt the index.",
          diagram: "pkChoice",
          table: {
            head: ["Question", "Answer"],
            rows: [
              ["Internal PK?", "bigint identity / bigserial. Small, fast, sequential."],
              ["Exposed in URLs or APIs?", "Add a separate public id: UUID v7 / ULID, or a short random slug. Never expose sequential ids for sensitive objects."],
              ["Generated by clients or across regions?", "UUID v7 or ULID (time-ordered, globally unique)."],
              ["Need both?", "bigint PK + `public_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid()`"],
              ["Composite PK for join tables?", "Yes: (left_id, right_id). Add a surrogate only if other tables must reference the pair."],
            ],
          },
        },
      ],
      realWorld: [
        {
          title: "Add a NOT NULL column to a 500-million-row table without downtime",
          problem: "Product wants `orders.channel` ('web', 'app', 'pos'), required on every order. The orders table has 500M rows and the site cannot go down.",
          whyHard: "The naive `ALTER TABLE orders ADD COLUMN channel text NOT NULL DEFAULT 'web'` is actually fine in Postgres 11+ (constant default is metadata-only). But `NOT NULL` **without** a default, or a backfill that sets real values per row, or a plain CREATE INDEX, will lock or stall for hours. People do not know which is which.",
          steps: [
            "Expand: `ADD COLUMN channel text` (nullable, no lock). Deploy code that writes `channel` on every new order.",
            "Backfill old rows in batches of a few thousand by primary key range, with a small sleep between batches, so replicas keep up and locks stay short.",
            "Add the index with `CREATE INDEX CONCURRENTLY orders_channel ON orders (channel)` (no write lock; takes longer).",
            "Add the constraint without a full scan: `ADD CONSTRAINT channel_not_null CHECK (channel IS NOT NULL) NOT VALID`, then `VALIDATE CONSTRAINT` (scans without blocking writes), then `ALTER COLUMN channel SET NOT NULL` (PG 12+ sees the valid CHECK and skips the scan).",
            "Contract: remove any fallback code paths.",
          ],
          code: {
            lang: "sql",
            title: "Batched backfill",
            src: `DO $$
DECLARE last_id bigint := 0; batch int := 5000; n int;
BEGIN
  LOOP
    UPDATE orders SET channel = COALESCE(legacy_source, 'web')
    WHERE id > last_id AND id <= last_id + batch AND channel IS NULL;
    GET DIAGNOSTICS n = ROW_COUNT;
    last_id := last_id + batch;
    EXIT WHEN last_id > (SELECT max(id) FROM orders);
    PERFORM pg_sleep(0.05);
  END LOOP;
END $$;`,
          },
          takeaway: "Know which DDL is metadata-only and which rewrites. For everything else: nullable first, batch the backfill, CONCURRENTLY for indexes, NOT VALID + VALIDATE for constraints.",
        },
      ],
      practice: [
        {
          q: "Put these steps in the right order for renaming a column with zero downtime: drop old column, add new column, switch reads to new, dual-write both, backfill.",
          answer: "add new column → dual-write both → backfill → switch reads to new → (stop writing old) → drop old column.",
          explain: "Expand (add, dual write, backfill), migrate (switch reads), contract (drop).",
        },
        {
          q: "Why is `CREATE INDEX` on a busy table dangerous and what is the alternative in Postgres?",
          answer: "It takes a lock that blocks writes for the whole build. `CREATE INDEX CONCURRENTLY` builds without blocking writes (slower, and must be run outside a transaction).",
          explain: "Concurrent builds scan the table twice and wait for in-flight transactions, trading time for availability.",
        },
        {
          q: "Add a nullable column `notes` to products in the playground, backfill it with the category name, then show the first 3 products.",
          answer: "3 rows with notes equal to the category.",
          explain: "ADD COLUMN (nullable) then an UPDATE for the backfill; in production the UPDATE would be batched.",
          sql: `ALTER TABLE products ADD COLUMN notes TEXT;
UPDATE products SET notes = category;
SELECT id, name, notes FROM products ORDER BY id LIMIT 3;`,
          starter: `ALTER TABLE products ADD COLUMN ...;\nUPDATE products SET ...;\nSELECT id, name, notes FROM products ORDER BY id LIMIT 3;`,
        },
      ],
      interview: [
        { level: "junior", q: "What is a database migration?", a: "A versioned script that changes the schema, like adding a column or an index, stored in the repo and applied in order in every environment. It makes schema changes reviewable, repeatable and tied to the code release that needs them." },
        { level: "mid", q: "How do you rename a column without downtime?", a: "Not with RENAME, because old code breaks instantly. I add the new column, deploy code that writes both and reads the old one, backfill in batches, switch reads to the new column, stop writing the old one, and drop it in a later release. Each step works with the release before and after it." },
        { level: "senior", q: "Which schema changes are dangerous on a large Postgres table?", a: "Anything that rewrites or scans the whole table under an exclusive lock: adding a NOT NULL column without a default on old versions, changing a column type, adding a foreign key without NOT VALID, and a plain CREATE INDEX which blocks writes. I use CONCURRENTLY, NOT VALID then VALIDATE, batched backfills, and a lock_timeout so a waiting DDL cannot queue up all traffic." },
        { level: "senior", q: "bigint ids or UUIDs for a new service?", a: "Internal bigint identity for compactness and insert locality, plus a UUID v7 public id when ids are exposed or generated outside the database. Random UUID v4 primary keys fragment B-trees and bloat every index that includes them, which hurts most on InnoDB where the table is the primary key index." },
      ],
      remember: [
        "Expand → migrate → contract. Every release compatible with its neighbours.",
        "Nullable first; batch the backfill; then add NOT NULL.",
        "CREATE INDEX CONCURRENTLY; constraints NOT VALID then VALIDATE.",
        "lock_timeout on every DDL so you fail fast instead of freezing traffic.",
      ],
    },
  ],
};
