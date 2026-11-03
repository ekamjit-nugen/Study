import type { Module } from "../types";

// Guided walkthroughs: slow build-up from one concrete scenario, think-first pages, SQL read aloud
// in plain English, timelines for races, a comparison table, and checkpoints with reasoning.

const WALLET = `-- start the story again: Rahul has ₹1,000, Aman has ₹500
CREATE TABLE IF NOT EXISTS wallet (id INTEGER PRIMARY KEY, name TEXT NOT NULL, balance INTEGER NOT NULL CHECK (balance >= 0));
INSERT OR REPLACE INTO wallet (id, name, balance) VALUES (1, 'Rahul', 1000), (2, 'Aman', 500);`;

const ORDER_DOUBLE = `-- one order, two items, two payments
CREATE TABLE IF NOT EXISTS o_items (order_id INTEGER, item TEXT, amount INTEGER);
CREATE TABLE IF NOT EXISTS o_pays  (order_id INTEGER, method TEXT, amount INTEGER);
DELETE FROM o_items; DELETE FROM o_pays;
INSERT INTO o_items VALUES (1, 'Keyboard', 89), (1, '2 × USB-C Hub', 70);
INSERT INTO o_pays  VALUES (1, 'card', 100), (1, 'wallet', 59);`;

export const M08: Module = {
  id: "guided",
  title: "Guided walkthroughs",
  simple: "One real scenario at a time, built up slowly: think first, read the SQL in plain English, watch what the database does, then answer a checkpoint before the next idea.",
  topics: [
    {
      slug: "wallet-transfers-step-by-step",
      title: "Wallet transfers: transactions, races and row locks",
      minutes: 25,
      guided: true,
      story: "You are sending ₹800 to a friend. You have ₹1,000, your friend has ₹500. Two things must happen, and the world must never see only one of them.",
      tldr: [
        "A **transaction** is a group of operations treated as one unit: all are saved (COMMIT) or none are (ROLLBACK).",
        "A transaction does **not** check that Rahul has enough money. Only a condition or a constraint does.",
        "Two requests reading the same balance before either deducts is a **race condition**.",
        "Fix the race with a **conditional UPDATE** (`WHERE balance >= 800`) or a **row lock** (`SELECT … FOR UPDATE`); the transaction still protects the whole transfer.",
      ],
      words: [
        ["transaction", "a package of operations that succeed together or fail together"],
        ["COMMIT", "save everything the transaction changed"],
        ["ROLLBACK", "undo everything the transaction changed"],
        ["race condition", "the result depends on which of two overlapping requests runs first"],
        ["row lock", "one transaction holds a row so conflicting changes must wait"],
      ],
      sections: [
        {
          title: "What is a transaction?",
          analogy: "Moving coins between two jars behind a curtain: nobody sees one jar emptier until the other is fuller.",
          why: "Without it, a crash in the middle of a transfer makes money vanish.",
          ask: "You send ₹800. The deduction from your wallet succeeds. Then the credit to your friend fails. Where did your ₹800 go?",
          body: `It went nowhere, which is the problem. Your balance is ₹200, your friend still has ₹500, and ₹800 has simply disappeared.

Here is what the transfer should do:

| Person | Before | After |
|---|---|---|
| You | ₹1,000 | ₹200 |
| Friend | ₹500 | ₹1,300 |

Two things must happen: deduct ₹800 from you, add ₹800 to your friend. If only the first happens, the money is lost.

A **transaction** is a group of database operations treated as one logical unit of work. Either all of them are saved, or the database undoes the ones it already made.

Think of it as a package:

📦 Transaction: deduct ₹800 from Rahul · add ₹800 to Aman · save the transfer record.

If everything succeeds, save the package. If anything fails before the save, throw the whole package away.`,
          sql: [
            {
              title: "Meet the two wallets (press Run)",
              sql: `${WALLET}
SELECT * FROM wallet;`,
            },
          ],
        },
        {
          title: "Three commands: BEGIN, COMMIT, ROLLBACK",
          analogy: "Opening a draft (BEGIN), pressing Save (COMMIT), or closing without saving (ROLLBACK).",
          why: "Every transaction you will ever write is these three words around some updates.",
          table: {
            head: ["Command", "What it says to the database", "When"],
            rows: [
              ["`BEGIN;`", "\"I am starting a group of operations. Do not finalise anything yet.\"", "before the first update"],
              ["`COMMIT;`", "\"Everything succeeded. Save all of it.\"", "after the last update succeeded"],
              ["`ROLLBACK;`", "\"Something went wrong. Undo everything since BEGIN.\"", "on any error"],
            ],
          },
          sql: [
            {
              title: "The transfer, step by step: deduct, credit, commit",
              sql: `${WALLET}
BEGIN;
UPDATE wallet SET balance = balance - 800 WHERE id = 1;   -- Rahul: 1000 → 200 (inside the transaction)
UPDATE wallet SET balance = balance + 800 WHERE id = 2;   -- Aman:  500 → 1300 (inside the transaction)
COMMIT;                                                    -- both changes are saved together
SELECT * FROM wallet;`,
            },
            {
              title: "What if something goes wrong? ROLLBACK undoes the deduction",
              sql: `${WALLET}
BEGIN;
UPDATE wallet SET balance = balance - 800 WHERE id = 1;   -- Rahul: 1000 → 200 ...
-- imagine the credit to Aman fails here
ROLLBACK;                                                  -- ... and back to 1000
SELECT * FROM wallet;`,
              note: "Rahul is back at ₹1,000 because the deduction was never committed. Your application must catch the error and run ROLLBACK; if the connection drops before COMMIT, the database rolls back on its own.",
            },
          ],
        },
        {
          title: "A transaction does not check the money",
          analogy: "The curtain hides the jars; it does not count the coins.",
          why: "People say 'wrap it in a transaction' as if it prevented overdrafts. It does not.",
          ask: "Rahul has ₹200. The same transfer runs inside a transaction and tries to deduct ₹800. Does the transaction stop it?",
          body: `No. A transaction makes the two updates happen together. It says nothing about whether ₹800 is a sensible amount.

Without a rule, Rahul's balance would become **−₹600** and the transaction would happily commit it.

What stops it is a **rule**: either a CHECK constraint on the column, or a condition in the UPDATE itself. Our wallet table has \`CHECK (balance >= 0)\`, so watch what happens.`,
          sql: [
            {
              title: "The CHECK refuses the overdraft (this fails on purpose)",
              sql: `${WALLET}
UPDATE wallet SET balance = 200 WHERE id = 1;             -- Rahul now has only ₹200
UPDATE wallet SET balance = balance - 800 WHERE id = 1;   -- refused: balance would be -600`,
              note: "CHECK constraint failed. Good, but a failed statement is a crash in your app's face. The next pages show a cleaner way: ask before you deduct, in one step.",
            },
          ],
        },
        {
          title: "The real problem: two requests arrive together",
          analogy: "Two cashiers reading the same till total, each adding their own sale, the second overwriting the first.",
          why: "This is the bug behind double-spent wallets, oversold stock and double-booked rooms.",
          ask: "Rahul has ₹1,000 and clicks Transfer twice by mistake. Each request reads the balance, checks it is enough, then deducts ₹800. Both read before either deducts. What is Rahul's balance afterwards?",
          body: `Both requests believed Rahul had enough money, because both read ₹1,000 before either deducted anything.

| Time | Request A | Request B |
|---|---|---|
| 1 | Reads balance: ₹1,000 | |
| 2 | | Reads balance: ₹1,000 |
| 3 | Checks: enough? **Yes** | |
| 4 | | Checks: enough? **Yes** |
| 5 | Deducts ₹800 → ₹200 | |
| 6 | | Deducts ₹800 → **−₹600** |

This is a **race condition**: the result depends on the timing and order in which overlapping requests run.

Notice that each request did exactly what the code said. The code is wrong, not the requests. The read and the write are two separate steps, and the world changed between them.

We need to stop two requests from making conflicting decisions based on the same outdated balance. There are two good ways.`,
        },
        {
          title: "Approach one: a conditional UPDATE",
          analogy: "A ticket machine that only prints when a ticket is left; press it as often as you like.",
          why: "This is the simplest correct fix for a single-row decision, and the one interviewers hope you say first.",
          body: `Instead of reading the balance first, put the balance check **inside** the update:

\`\`\`sql
UPDATE wallet
SET balance = balance - 800
WHERE id = 1
  AND balance >= 800;
\`\`\`

Read it in plain English: "Deduct ₹800 from wallet 1, but only if its current balance is at least ₹800."

**Situation A: Rahul has ₹1,000.** The condition is true. The database deducts ₹800. New balance ₹200. One row updated.

**Situation B: Rahul has ₹200.** The condition is false. Nothing is deducted. Zero rows updated.

Your application checks the number of updated rows to know which situation happened.

Why is this better? The check and the deduction are **one atomic statement**. When two requests hit the same row, the database runs them one after the other on that row and re-evaluates \`balance >= 800\` against the updated value. Two deductions of ₹800 from ₹1,000 cannot both succeed.`,
          sql: [
            {
              title: "Run the conditional UPDATE twice: the second one changes zero rows",
              sql: `${WALLET}
UPDATE wallet SET balance = balance - 800 WHERE id = 1 AND balance >= 800;
SELECT changes() AS rows_updated_first_time, balance FROM wallet WHERE id = 1;
UPDATE wallet SET balance = balance - 800 WHERE id = 1 AND balance >= 800;
SELECT changes() AS rows_updated_second_time, balance FROM wallet WHERE id = 1;`,
              note: "First run: 1 row, balance 200. Second run: 0 rows, balance still 200. No negative balance, no error, no lock in your code.",
            },
          ],
        },
        {
          title: "The UPDATE protects the deduction; the transaction protects the transfer",
          analogy: "The turnstile checks one ticket; the curtain still hides both jars until the end.",
          why: "Mixing these two jobs up is the most common wrong answer in interviews.",
          body: `We still need the transaction for the complete transfer. Two different protections, two different jobs:

- The **conditional UPDATE** protects the balance check and the deduction (one row).
- The **transaction** protects the whole transfer: deduction **and** credit together (two rows).

In production, the application must check that the first update changed exactly one row. If it changed zero rows, roll back and reject the transfer. It should also confirm the receiver exists and that the credit succeeded.`,
          sql: [
            {
              title: "The full transfer with the guard inside the transaction",
              sql: `${WALLET}
BEGIN;
UPDATE wallet SET balance = balance - 800 WHERE id = 1 AND balance >= 800;
-- the app checks changes() = 1 here; if 0 → ROLLBACK and reject
UPDATE wallet SET balance = balance + 800 WHERE id = 2;
COMMIT;
SELECT * FROM wallet;`,
            },
          ],
          code: [
            {
              lang: "ts",
              title: "The same flow from Node: check the row count, roll back if it is not 1",
              src: `await client.query("BEGIN");
try {
  const debit = await client.query(
    "UPDATE wallet SET balance = balance - $1 WHERE id = $2 AND balance >= $1", [800, 1]);
  if (debit.rowCount !== 1) throw new Error("insufficient funds");     // → ROLLBACK below
  const credit = await client.query(
    "UPDATE wallet SET balance = balance + $1 WHERE id = $2", [800, 2]);
  if (credit.rowCount !== 1) throw new Error("receiver not found");
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
}`,
            },
          ],
        },
        {
          title: "Approach two: SELECT … FOR UPDATE (a row lock)",
          analogy: "A single key to a locked room: only one request can be inside Rahul's row at a time.",
          why: "When you must read, decide several things, then write, the conditional UPDATE is awkward; a lock is the tool.",
          body: `A **row lock** lets a transaction hold a row so that conflicting operations on it must wait.

In Postgres:

\`\`\`sql
BEGIN;
SELECT balance FROM wallet WHERE id = 1 FOR UPDATE;   -- lock Rahul's row until COMMIT
-- the app checks the balance it just read
UPDATE wallet SET balance = balance - 800 WHERE id = 1;
UPDATE wallet SET balance = balance + 800 WHERE id = 2;
COMMIT;
\`\`\`

Now two requests:

| Request A | Request B |
|---|---|
| 1. Starts a transaction | 1. Starts a transaction |
| 2. Locks Rahul's row | 2. Tries to lock Rahul's row |
| 3. Reads ₹1,000 | 3. **Waits** while A holds the lock |
| 4. Deducts ₹800, credits Aman | |
| 5. Commits | 4. Gets the lock after A commits |
| | 5. Reads the updated balance: ₹200 |
| | 6. Rejects the transfer: ₹200 is not enough |

Only one transfer succeeds.

One detail decides whether this works at all: the balance check must happen **after** the lock is acquired. Read the balance first and lock later, and the original race is back.

SQLite, which runs these pages, has no FOR UPDATE: its whole database is locked by one writer at a time, which is why the conditional UPDATE is what we can run here.`,
        },
        {
          title: "Which approach should you choose?",
          analogy: "A turnstile for one gate, a key for a whole room.",
          why: "Interviewers want the simplest correct tool and the reason, not the fanciest one.",
          table: {
            head: ["Feature", "Conditional UPDATE", "SELECT … FOR UPDATE"],
            rows: [
              ["Prevents an insufficient-balance deduction", "Yes", "Yes, if the check happens after the lock"],
              ["Needs a separate balance read", "No", "Yes"],
              ["Lets the app decide things between reading and writing", "Less convenient", "Yes"],
              ["Simple balance deduction", "Excellent", "Works"],
              ["Several decisions depend on the locked row", "Awkward", "Excellent"],
              ["Protects the whole transfer by itself", "No, needs the transaction", "No, needs the transaction"],
            ],
          },
          body: `Neither approach solves every money problem on its own. Both need the transaction around the whole transfer.

An experienced engineer picks the simplest correct tool for the requirement:

- A simple deduction → **conditional UPDATE**.
- Read, decide several things, update related rows → **row lock inside a transaction**.

For a real payment system you also add duplicate-request protection (an idempotency key), a transfer record, failure recovery and reconciliation.`,
        },
        {
          title: "Connect it back: the server crashes mid-transfer",
          analogy: "The lights go out while the coins are in the air; the curtain opens and both jars are as they were.",
          why: "This is the question that started this walkthrough, and now it has a one-line answer.",
          ask: "The app runs BEGIN, deducts ₹800 from Rahul, and the server crashes before COMMIT. What is Rahul's balance when the database comes back?",
          body: `₹1,000. The transaction never committed. When the database notices the connection is gone, it rolls back the unfinished transaction. Aman never receives anything, and the transfer does not half-succeed.

The dangerous version is different: if the app had **committed the deduction in its own transaction** and then crashed before crediting Aman, the deduction is permanent. Now the app needs a recovery mechanism to finish or reverse the transfer.

That is why the sender's deduction and the receiver's credit must be in the **same** transaction.`,
          sql: [
            {
              title: "Simulate the crash: the deduction is rolled back",
              sql: `${WALLET}
BEGIN;
UPDATE wallet SET balance = balance - 800 WHERE id = 1;
ROLLBACK;   -- this is what the database does for you when the connection dies before COMMIT
SELECT * FROM wallet;`,
            },
          ],
        },
      ],
      realWorld: [
        {
          title: "The double-click: one transfer, two requests",
          problem: "Rahul clicks Transfer twice. The conditional UPDATE stops the overdraft, but if he had ₹2,000, both requests would succeed and he would send ₹1,600 instead of ₹800.",
          whyHard: "The race fix protects the balance, not the intent. Two legitimate-looking requests for the same transfer are still two transfers.",
          steps: [
            "Give every transfer a **request id** generated when the button is first pressed, and send the same id on the retry.",
            "Store it in a transfers table with a UNIQUE constraint.",
            "Insert the transfer row **first**, in the same transaction as the deduction, with ON CONFLICT DO NOTHING; if zero rows were inserted, this is a duplicate: roll back and return the original result.",
            "Only then deduct and credit. Duplicate requests find the row and do nothing.",
          ],
          sql: `${WALLET}
CREATE TABLE IF NOT EXISTS transfers (request_id TEXT PRIMARY KEY, from_id INTEGER, to_id INTEGER, amount INTEGER);
DELETE FROM transfers;
-- first click
INSERT INTO transfers VALUES ('req-42', 1, 2, 800) ON CONFLICT (request_id) DO NOTHING;
SELECT changes() AS inserted_first_click;
-- second click, same request id → 0 rows → the app skips the deduction
INSERT INTO transfers VALUES ('req-42', 1, 2, 800) ON CONFLICT (request_id) DO NOTHING;
SELECT changes() AS inserted_second_click;`,
          takeaway: "Three protections, three jobs: the conditional UPDATE guards the balance, the transaction guards the pair of updates, the idempotency key guards against the same transfer twice.",
        },
      ],
      practice: [
        {
          q: "Using the lesson's accounts table (Aarav 500, Priya 120, Liam 900): move 300 from Liam (id 3) to Priya (id 2) in one transaction, refusing if Liam cannot afford it, then show all balances.",
          answer: "Aarav 500, Priya 420, Liam 600.",
          explain: "The guard balance >= 300 sits inside the first UPDATE; both updates sit inside BEGIN/COMMIT.",
          sql: `BEGIN;
UPDATE accounts SET balance = balance - 300 WHERE id = 3 AND balance >= 300;
UPDATE accounts SET balance = balance + 300 WHERE id = 2;
COMMIT;
SELECT id, owner, balance FROM accounts ORDER BY id;`,
          starter: `BEGIN;\nUPDATE accounts SET ... WHERE id = 3 AND ...;\nUPDATE accounts SET ... WHERE id = 2;\nCOMMIT;\nSELECT id, owner, balance FROM accounts ORDER BY id;`,
        },
        {
          q: "Try to move 1,000 from Priya (120) to Aarav with the guarded UPDATE. How many rows does the deduction change, and what are the balances?",
          answer: "0 rows; balances unchanged (500, 120, 900).",
          explain: "The condition balance >= 1000 is false for Priya, so the database changes nothing and the app should not credit Aarav.",
          sql: `UPDATE accounts SET balance = balance - 1000 WHERE id = 2 AND balance >= 1000;
SELECT changes() AS rows_changed, (SELECT balance FROM accounts WHERE id = 2) AS priya_balance;`,
        },
        {
          q: "A colleague writes: read balance in Node → if enough → UPDATE balance = 200 (the literal new value). Why is this still a race even inside a transaction?",
          answer: "Two requests can both read 1000 inside their own transactions and both write a literal 200. The transaction makes each pair atomic but does not stop the second one from overwriting with a stale value. Use balance = balance - 800 with a WHERE guard, or lock the row before reading.",
          explain: "Atomicity is about all-or-nothing, not about freshness of what you read.",
        },
      ],
      interview: [
        { level: "junior", q: "What is a database transaction, in one sentence?", a: "A group of operations the database applies as one unit: either every change is committed or, if anything fails before the commit, all of them are rolled back." },
        { level: "junior", q: "What do BEGIN, COMMIT and ROLLBACK do?", a: "BEGIN starts the group and tells the database not to finalise anything yet. COMMIT saves everything the group changed. ROLLBACK undoes everything since BEGIN. If the connection dies before COMMIT, the database rolls back by itself." },
        { level: "mid", tricky: true, q: "Does wrapping a transfer in a transaction prevent an overdraft?", a: "No. A transaction guarantees the deduction and the credit happen together, not that the amount is sensible. Preventing the overdraft needs a rule: a CHECK constraint, a conditional UPDATE with WHERE balance >= amount, or a row lock followed by a check." },
        { level: "mid", q: "Explain the race condition in 'read balance, check, deduct'.", a: "Two requests can both read the old balance before either writes, so both pass the check and both deduct. The result depends on timing. The read and the write are separate steps, and the row changed between them." },
        { level: "mid", q: "How does a conditional UPDATE fix it?", a: "By moving the check into the UPDATE: SET balance = balance − 800 WHERE id = 1 AND balance >= 800. The database serialises updates to that row and re-evaluates the condition against the latest value, so two deductions from ₹1,000 cannot both succeed. The app checks the updated-row count." },
        { level: "mid", tricky: true, q: "With SELECT … FOR UPDATE, when must the balance check happen?", a: "After the lock is acquired. If the app reads the balance, then locks, the value it decided on may be stale and the race is back. Lock first, read inside the lock, decide, update, commit." },
        { level: "senior", q: "Conditional UPDATE or FOR UPDATE: how do you choose?", a: "Conditional UPDATE for a single-row decision like a deduction: simplest, no separate read, atomic. FOR UPDATE when the app must read, make several decisions and update related rows based on what it read. Both still need the transaction around the whole transfer." },
        { level: "senior", q: "The server crashes after the deduction commits but before the credit. What now?", a: "That is why both belong in one transaction: then the crash rolls back the deduction. If they were separate transactions, the deduction is permanent and I need a recovery path: a transfer record with a status, a reconciliation job that completes or reverses incomplete transfers, and idempotency keys so retries are safe." },
      ],
      remember: [
        "Transaction = all or nothing. It does not check amounts.",
        "Read-then-write in two steps is a race.",
        "Conditional UPDATE: the check lives inside the write; check the row count.",
        "FOR UPDATE: lock first, then read and decide. Both still need the transaction.",
      ],
    },

    {
      slug: "the-report-that-doubled",
      title: "The report that doubled: joins, step by step",
      minutes: 20,
      guided: true,
      story: "Finance asks for one report: per order, the total of the items and the total of the payments. You join both tables to orders. Every number comes out exactly double.",
      tldr: [
        "A join produces **one row per matching pair**. Two items × two payments = four rows for one order.",
        "SUM over those rows counts each item once **per payment**, so totals multiply.",
        "Fix: aggregate each child table to one row per order **first**, then join the small results.",
        "Before trusting any SUM after a join, check `COUNT(*)` per parent.",
      ],
      words: [
        ["fan-out", "one row matching many rows, so the row count multiplies"],
        ["pre-aggregate", "SUM or COUNT a child table per parent before joining it"],
        ["CTE", "a named step: WITH name AS (…)"],
      ],
      sections: [
        {
          title: "The question finance asked",
          analogy: "One receipt with two lines, paid with two cards. Staple every line to every card and you have four slips of paper.",
          why: "This bug ships confidently wrong revenue numbers, and nobody notices until the amounts do not match the bank.",
          ask: "Order 1 has two items worth ₹89 and ₹70, total ₹159. It was paid with two payments, ₹100 and ₹59, total ₹159. The report shows ₹318 for items and ₹318 for payments. What single thing could double both?",
          body: `Both totals are exactly twice the truth. One thing multiplies both: the **number of rows** the join produced.

Here is the data:

| items (order 1) | amount |
|---|---|
| Keyboard | 89 |
| 2 × USB-C Hub | 70 |

| payments (order 1) | amount |
|---|---|
| card | 100 |
| wallet | 59 |

Two rows on each side. Let's see what joining them produces.`,
          sql: [
            {
              title: "The data (press Run)",
              sql: `${ORDER_DOUBLE}
SELECT * FROM o_items; SELECT * FROM o_pays;`,
            },
          ],
        },
        {
          title: "What a join actually produces",
          analogy: "Pairing every sock from the left drawer with every sock from the right drawer that has the same colour.",
          why: "Once you see the pairs, every join bug becomes obvious.",
          body: `A join does not merge two tables side by side. It produces **one output row for every pair of rows that match the condition**.

Our condition is "same order_id". Both items belong to order 1, both payments belong to order 1. So every item pairs with every payment:

| item | item amount | payment | payment amount |
|---|---|---|---|
| Keyboard | 89 | card | 100 |
| Keyboard | 89 | wallet | 59 |
| 2 × USB-C Hub | 70 | card | 100 |
| 2 × USB-C Hub | 70 | wallet | 59 |

Four rows for one order. Each item appears twice (once per payment). Each payment appears twice (once per item).`,
          sql: [
            {
              title: "See the four rows",
              sql: `${ORDER_DOUBLE}
SELECT i.item, i.amount AS item_amount, p.method, p.amount AS payment_amount
FROM o_items i
JOIN o_pays p ON p.order_id = i.order_id;`,
            },
          ],
        },
        {
          title: "Where the doubling comes from",
          analogy: "Counting the keyboard once for the card and once for the wallet.",
          why: "Now the ₹318 is not mysterious: 89 + 89 + 70 + 70.",
          body: `SUM adds up the column over the rows it is given. Give it the four joined rows and:

- items: 89 + 89 + 70 + 70 = **318**
- payments: 100 + 59 + 100 + 59 = **318**

Each side is multiplied by the number of rows on the other side. With three payments the items would be tripled. The report was not "a bit off"; it was exactly items × payments.`,
          sql: [
            {
              title: "The wrong report, reproduced",
              sql: `${ORDER_DOUBLE}
SELECT i.order_id, SUM(i.amount) AS items_total, SUM(p.amount) AS payments_total, COUNT(*) AS joined_rows
FROM o_items i
JOIN o_pays p ON p.order_id = i.order_id
GROUP BY i.order_id;`,
              note: "joined_rows = 4 is the tell. One order, four rows. Every SUM over this is wrong.",
            },
          ],
        },
        {
          title: "Fix one: aggregate each child first, then join",
          analogy: "Add up the receipt lines on one slip, add up the cards on another slip, then staple the two slips together.",
          why: "This is the pattern for every report that joins two one-to-many tables.",
          body: `Collapse each child table to **one row per order** before the join:

1. items per order: \`SELECT order_id, SUM(amount) … GROUP BY order_id\` → one row: 159
2. payments per order: same → one row: 159
3. Join the two one-row results to the order. One row in, one row out.

Read the SQL below top to bottom: two labelled bowls, then the dish.`,
          sql: [
            {
              title: "The right report",
              sql: `${ORDER_DOUBLE}
WITH items AS (SELECT order_id, SUM(amount) AS items_total FROM o_items GROUP BY order_id),
     pays  AS (SELECT order_id, SUM(amount) AS payments_total FROM o_pays GROUP BY order_id)
SELECT items.order_id, items.items_total, pays.payments_total
FROM items
LEFT JOIN pays ON pays.order_id = items.order_id;`,
              note: "159 and 159. LEFT JOIN keeps orders with items but no payments yet; COALESCE(payments_total, 0) if you want a 0 instead of NULL.",
            },
          ],
        },
        {
          title: "Fix two: a subquery per total",
          analogy: "Asking two separate questions instead of stapling anything.",
          why: "Sometimes clearer for one or two totals; the CTE version scales better.",
          sql: [
            {
              title: "Scalar subqueries: each total computed on its own",
              sql: `${ORDER_DOUBLE}
SELECT 1 AS order_id,
       (SELECT SUM(amount) FROM o_items WHERE order_id = 1) AS items_total,
       (SELECT SUM(amount) FROM o_pays  WHERE order_id = 1) AS payments_total;`,
            },
          ],
        },
        {
          title: "How to spot it before finance does",
          analogy: "Count the slips of paper before adding the numbers on them.",
          why: "A thirty-second check that catches every fan-out.",
          body: `Before you trust a SUM after a join, ask one question: **how many rows per parent does this join produce?**

\`SELECT parent_id, COUNT(*) FROM … GROUP BY parent_id\`

If any parent shows more rows than it has children on one side, something is multiplying. The rule:

> Never join two one-to-many children of the same parent in one FROM and then SUM. Pre-aggregate each child.`,
        },
        {
          title: "Connect it back: why DISTINCT is not the fix",
          analogy: "Crossing out duplicate names on a doubled guest list instead of asking why they were doubled.",
          why: "DISTINCT is the band-aid people reach for; it hides the bug and breaks on real data.",
          ask: "A colleague changes SUM(i.amount) to SUM(DISTINCT i.amount) and the total comes out 159. Problem solved?",
          body: `No. SUM(DISTINCT amount) adds each **distinct value** once. It happens to work here because 89 and 70 are different numbers.

Add a second keyboard line at ₹89 and SUM(DISTINCT) still returns 159 instead of 248. Two real items with the same price are now counted as one.

DISTINCT removes duplicate rows or values; it cannot know which duplicates are real and which came from the join. Fix the join.`,
          sql: [
            {
              title: "DISTINCT breaks the moment two items share a price",
              sql: `${ORDER_DOUBLE}
INSERT INTO o_items VALUES (1, 'Second Keyboard', 89);     -- a real second item at the same price
SELECT SUM(DISTINCT i.amount) AS wrong_distinct_total,
       (SELECT SUM(amount) FROM o_items WHERE order_id = 1) AS true_total
FROM o_items i JOIN o_pays p ON p.order_id = i.order_id;`,
            },
          ],
        },
      ],
      realWorld: [
        {
          title: "Revenue per customer, with payments and refunds",
          problem: "Per customer: items bought, payments received, refunds given. Three one-to-many tables hang off orders. The naive triple join multiplies every total by every other.",
          whyHard: "Each extra child table multiplies the rows again, and the numbers look plausible because they are all scaled by the same factors.",
          steps: [
            "One CTE per child table, each collapsed to one row per order: items_total, paid_total, refunded_total.",
            "Join the three small results to orders, then to customers.",
            "GROUP BY customer and SUM the already-correct per-order totals.",
            "Check: COUNT(*) per customer equals that customer's number of orders.",
          ],
          sql: `WITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items GROUP BY order_id),
     pays  AS (SELECT order_id, SUM(amount) AS paid_total FROM payments GROUP BY order_id)
SELECT c.name, COUNT(o.id) AS orders, SUM(i.items_total) AS items, COALESCE(SUM(p.paid_total), 0) AS paid
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN items i ON i.order_id = o.id
LEFT JOIN pays p ON p.order_id = o.id
GROUP BY c.id, c.name
ORDER BY items DESC;`,
          takeaway: "One child table, one CTE, one row per parent. Then join. The totals cannot multiply because there is nothing left to multiply.",
        },
      ],
      practice: [
        {
          q: "On the lesson data, show for order 1 the number of item rows, the number of payment rows, and the number of rows a plain join of the two produces.",
          answer: "2 items, 1 payment, 2 joined rows (1 × 2).",
          explain: "Joined rows = items × payments for that order; here 2 × 1.",
          sql: `SELECT (SELECT COUNT(*) FROM order_items WHERE order_id = 1) AS item_rows,
       (SELECT COUNT(*) FROM payments WHERE order_id = 1) AS payment_rows,
       (SELECT COUNT(*) FROM order_items oi JOIN payments p ON p.order_id = oi.order_id WHERE oi.order_id = 1) AS joined_rows;`,
        },
        {
          q: "Add a second payment of 0 to order 1, then write the correct items/payments report for order 1 using two CTEs.",
          answer: "items_total 159, payments_total 159 (not 318).",
          explain: "Each CTE collapses its table to one row for order 1 before the join.",
          sql: `INSERT INTO payments (order_id, amount, method, paid_at) VALUES (1, 0, 'card', '2025-01-03 10:15:00');
WITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items WHERE order_id = 1 GROUP BY order_id),
     pays  AS (SELECT order_id, SUM(amount) AS payments_total FROM payments WHERE order_id = 1 GROUP BY order_id)
SELECT items.order_id, items.items_total, pays.payments_total FROM items JOIN pays ON pays.order_id = items.order_id;`,
          starter: `INSERT INTO payments (order_id, amount, method, paid_at) VALUES (1, 0, 'card', '2025-01-03 10:15:00');\nWITH items AS (SELECT order_id, SUM(qty * unit_price) AS items_total FROM order_items WHERE order_id = 1 GROUP BY order_id),\n     pays  AS (...)\nSELECT items.order_id, items.items_total, pays.payments_total FROM items JOIN pays ON ...;`,
        },
        {
          q: "Which single query tells you whether a join is fanning out?",
          answer: "SELECT parent_id, COUNT(*) FROM <the join> GROUP BY parent_id: any parent with more rows than children on one side is multiplying.",
          explain: "Counting rows per parent exposes the multiplication before any SUM hides it.",
        },
      ],
      interview: [
        { level: "junior", q: "What does a JOIN produce?", a: "One output row for every pair of rows that satisfy the join condition. It is not two tables side by side; a row on the left that matches three rows on the right appears three times." },
        { level: "mid", q: "Why did SUM double after adding a second one-to-many join?", a: "Each item row was paired with each payment row, so with two payments every item appeared twice and SUM counted it twice. The totals were multiplied by the row count on the other side, not 'a bit off'." },
        { level: "mid", q: "What is the fix?", a: "Aggregate each child table to one row per parent in its own CTE or subquery, then join those small results to the parent. With one row per parent on each side, there is nothing to multiply." },
        { level: "mid", tricky: true, q: "Would SUM(DISTINCT amount) fix the doubled total?", a: "Only by accident. It adds each distinct value once, so two real items with the same price are counted as one. It hides the fan-out instead of fixing the join." },
        { level: "mid", tricky: true, q: "Would adding DISTINCT to the SELECT fix it?", a: "No. DISTINCT runs after aggregation on the output rows; the SUMs are already wrong. And DISTINCT before aggregation would also drop genuine duplicate rows. The join is the bug." },
        { level: "senior", q: "How do you check a report query for fan-out before shipping it?", a: "I count rows per parent in the joined set and compare with the number of children on each side. If any parent has more rows than expected, a one-to-many join is multiplying. I also check a known order by hand against the raw tables." },
        { level: "senior", q: "Three child tables hang off orders. Design the report query.", a: "Three CTEs, one per child, each GROUP BY order_id with its SUM. Join them to orders with LEFT JOIN so missing children give NULL, COALESCE to 0, then group by customer. Row count per customer equals their order count, which is my test." },
        { level: "senior", tricky: true, q: "A LEFT JOIN to a pre-aggregated CTE returns NULL for some orders. Is that a bug?", a: "No, it is the correct answer for orders with no rows in that child table, for example no payment yet. COALESCE(total, 0) turns it into a zero for display. Turning the LEFT JOIN into an INNER JOIN to hide the NULLs would drop those orders." },
      ],
      remember: [
        "A join = one row per matching pair. Count rows per parent before you SUM.",
        "Two 1:N children in one FROM multiply each other.",
        "Pre-aggregate each child to one row per parent, then join.",
        "DISTINCT hides the bug; it does not fix it.",
      ],
    },

    {
      slug: "indexes-from-zero",
      title: "Why is my query slow? Indexes from zero",
      minutes: 22,
      guided: true,
      story: "A login form looks up a customer by email. It took 2 ms with 1,000 customers. At 1,000,000 customers it takes 2 seconds and the database CPU is pinned. Nothing in the code changed.",
      tldr: [
        "Without an index the database reads **every page** of the table to find one email. Cost grows with the table.",
        "An index is a **sorted copy** of the column with pointers; finding one value takes a few page reads, however big the table.",
        "Composite index order: **equality columns first, then the range or sort column**.",
        "Indexes cost writes and space, and are ignored when a function wraps the column or the filter matches most rows.",
      ],
      words: [
        ["sequential scan", "reading every page of the table from start to end"],
        ["index seek", "jumping through the index's tree to the matching entries"],
        ["page", "the fixed-size block the database reads from disk (8 KB in Postgres)"],
        ["selectivity", "how small a slice of the table a condition keeps"],
      ],
      sections: [
        {
          title: "How the database finds one email without an index",
          analogy: "Finding a name in a 1,000-page book with no index: read every page.",
          why: "The slow query is not slow code; it is a full read of the table on every login.",
          ask: "The customers table has 1,000,000 rows stored in 12,500 pages. You run `WHERE email = 'priya@example.com'`. There is no index on email. How many pages must the database read to be sure it found every match?",
          body: `All 12,500. There is no shortcut: the only way to know that no other row has that email is to look at every row.

That is a **sequential scan**. It reads page 1, checks every row, reads page 2, and so on to the end.

| Rows | Pages | Reads per lookup |
|---|---|---|
| 1,000 | 13 | 13 (feels instant) |
| 1,000,000 | 12,500 | 12,500 (seconds) |

Your query did not change. The number of pages did.`,
          sql: [
            {
              title: "Ask the planner what it will do (press Run, then look for SCAN)",
              sql: `EXPLAIN QUERY PLAN SELECT id, name FROM customers WHERE email = 'priya@example.com';`,
              note: "SCAN customers means: read the whole table. Our playground table is tiny, so it feels fine; the plan is what tells you the truth.",
            },
          ],
        },
        {
          title: "What an index is",
          analogy: "The index at the back of the book: sorted entries, each with a page number.",
          why: "Every speed-up in this course is some version of 'touch fewer pages'; the index is the main way.",
          body: `An index is a **separate, sorted copy** of one or more columns, where each entry points at the row's location in the table.

Because it is sorted, the database does not read it from start to end. It keeps it as a **B-tree**: a root page points at branch pages, which point at leaf pages holding the sorted values. Finding one email means reading the root, one branch, one leaf: **3 or 4 page reads**, whether the table has a thousand rows or a billion.

| | Without index | With index |
|---|---|---|
| Find one email in 1,000,000 rows | 12,500 pages | 3 index pages + 1 table page |`,
          diagram: "btree",
        },
        {
          title: "Create one and watch the plan change",
          analogy: "Writing the index at the back of the book once, then every lookup is a few flips.",
          why: "This is the before/after you should be able to show on any slow query.",
          sql: [
            {
              title: "Create the index, ask the planner again",
              sql: `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
EXPLAIN QUERY PLAN SELECT id, name FROM customers WHERE email = 'priya@example.com';`,
              note: "SEARCH customers USING INDEX idx_customers_email (email=?). SCAN became SEARCH: the database jumps straight to the row. In Postgres the same change shows as Seq Scan → Index Scan.",
            },
          ],
        },
        {
          title: "Why it is not free",
          analogy: "Every new book means updating the index at the back too.",
          why: "Teams add indexes for every column 'just in case' and then wonder why inserts are slow.",
          body: `Every INSERT, UPDATE of an indexed column, or DELETE must also update every index on the table. Ten indexes means ten extra B-tree writes per row. Indexes also take disk space, sometimes as much as the table.

So the rule is not "index everything". It is:

> Index the columns your real queries filter, join and sort by, in the shape those queries use. Drop indexes nothing uses.`,
          table: {
            head: ["Query shape", "Index", "Why"],
            rows: [
              ["`WHERE email = ?`", "(email)", "one column, equality"],
              ["`WHERE customer_id = ? ORDER BY ordered_at DESC`", "(customer_id, ordered_at)", "equality first, then the sort column"],
              ["`WHERE status = 'pending'` (rare value)", "(…) WHERE status = 'pending' (partial)", "tiny index for the rare case"],
              ["`WHERE lower(email) = ?`", "(lower(email)) (expression)", "the index must store what the query compares"],
            ],
          },
        },
        {
          title: "Composite indexes: order matters",
          analogy: "A phone book sorted by surname then first name: perfect for 'Mehta', useless for 'every Priya'.",
          why: "The most common 'I added an index and nothing changed' is the right columns in the wrong order.",
          ask: "Your query is `WHERE customer_id = 1 ORDER BY ordered_at DESC`. You have two choices: an index on (ordered_at, customer_id) or on (customer_id, ordered_at). Which one lets the database read only customer 1's orders, already sorted?",
          body: `(customer_id, ordered_at). The index is sorted by customer first, so all of customer 1's entries sit together, and within them they are sorted by date. The database seeks to customer 1 and reads them in order: no sort step.

(ordered_at, customer_id) is sorted by date first. Customer 1's orders are scattered through the whole index, so the database must read everything and filter.

Rule: **equality columns first, then the range or sort column.**`,
          sql: [
            {
              title: "Right order: no sort step",
              sql: `CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders(customer_id, ordered_at);
EXPLAIN QUERY PLAN SELECT id FROM orders WHERE customer_id = 1 ORDER BY ordered_at DESC;`,
              note: "SEARCH … USING INDEX idx_orders_customer_date (customer_id=?) and no 'USE TEMP B-TREE FOR ORDER BY': the index delivers the rows already sorted.",
            },
          ],
        },
        {
          title: "When the index is ignored",
          analogy: "The phone book cannot help if you search by middle name, or if 90% of the town shares one surname.",
          why: "You will add correct-looking indexes that the planner refuses to use unless you know these cases.",
          table: {
            head: ["Query", "Why the index is useless", "Fix"],
            rows: [
              ["`WHERE lower(email) = ?`", "the index stores email, not lower(email)", "expression index on lower(email)"],
              ["`WHERE email LIKE '%@gmail.com'`", "leading wildcard: the sorted order does not help", "trigram index, or store the domain in its own column"],
              ["`WHERE status = 'paid'` when 95% of rows are paid", "reading most of the table through an index is slower than a scan", "accept the scan, or a partial index for the rare values"],
              ["`WHERE created_at::date = ?`", "a cast or function hides the column", "`created_at >= day AND created_at < next_day`"],
            ],
          },
          sql: [
            {
              title: "A function on the column throws the index away",
              sql: `EXPLAIN QUERY PLAN SELECT id FROM customers WHERE lower(email) = 'priya@example.com';`,
              note: "Back to SCAN, even though idx_customers_email exists. The index knows email; it does not know lower(email).",
            },
          ],
        },
        {
          title: "Connect it back: the login that took 2 seconds",
          analogy: "The book got thicker; you finally wrote the index at the back.",
          why: "This is the whole walkthrough in four lines you can say in an interview.",
          body: `1. The lookup by email was a sequential scan: it read every page, and the table had grown to 12,500 pages.
2. An index on email turns that into 3 or 4 page reads, whatever the size.
3. The login query now takes 2 ms again and stays there as the table grows.
4. The cost: a little more work on every INSERT of a customer, which is nothing compared with a scan per login.

Next time a query gets slower as data grows, ask the planner first: \`EXPLAIN\`. If you see a scan with a selective filter, you have found your index.`,
        },
      ],
      realWorld: [
        {
          title: "The index that did not help",
          problem: "A developer adds an index on orders(status) because the dashboard filters by status. The query is exactly as slow as before.",
          whyHard: "The index exists and matches the column, so it looks correct. The planner measured that 95% of orders are 'paid' and chose the scan on purpose.",
          steps: [
            "Check selectivity: `SELECT status, COUNT(*) FROM orders GROUP BY status`. A value matching most rows is not worth seeking.",
            "Find the real shape of the slow query: it is `WHERE status = 'pending' ORDER BY ordered_at` on the dispatch screen.",
            "A **partial index** on (ordered_at) WHERE status = 'pending' is tiny and serves exactly that query.",
            "Drop the unused full index on status; it only taxes writes.",
          ],
          sql: `SELECT status, COUNT(*) AS rows_with_status FROM orders GROUP BY status ORDER BY rows_with_status DESC;
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(ordered_at) WHERE status = 'pending';
EXPLAIN QUERY PLAN SELECT id FROM orders WHERE status = 'pending' ORDER BY ordered_at;`,
          takeaway: "An index helps when the condition keeps a small slice. For a rare value, a partial index is the right shape; for a common value, the scan was right all along.",
        },
      ],
      practice: [
        {
          q: "Show the plan for finding products by category, then create the index that turns it into a SEARCH and show the plan again.",
          answer: "First plan: SCAN products. Second: SEARCH products USING INDEX … (category=?).",
          explain: "An index on the filtered column lets the planner seek instead of scan.",
          sql: `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
EXPLAIN QUERY PLAN SELECT name FROM products WHERE category = 'Books';`,
          starter: `CREATE INDEX IF NOT EXISTS idx_products_category ON products(...);\nEXPLAIN QUERY PLAN SELECT name FROM products WHERE category = 'Books';`,
        },
        {
          q: "Which index serves `SELECT * FROM order_items WHERE product_id = ? AND qty >= 2 ORDER BY qty`, and why in that order?",
          answer: "(product_id, qty): equality on product_id first, then qty, which is both the range and the sort column.",
          explain: "The index narrows to one product, then delivers rows in qty order, serving the range and the ORDER BY.",
        },
        {
          q: "You have an index on customers(email). Will `WHERE email LIKE 'priya%'` use it? And `WHERE email LIKE '%example.com'`?",
          answer: "The prefix pattern can use it (sorted order helps). The leading-wildcard pattern cannot; it scans.",
          explain: "A B-tree is sorted by the start of the string; an unknown start means every entry could match.",
        },
      ],
      interview: [
        { level: "junior", q: "Why did a query get slower as the table grew although the code did not change?", a: "Without an index the database scans every page of the table for each lookup, so the cost grows with the table. At a thousand rows that is instant; at a million it is seconds. An index on the filtered column makes the lookup a few page reads regardless of size." },
        { level: "junior", q: "What is an index?", a: "A separate sorted copy of one or more columns with pointers back to the rows, kept as a B-tree so the database can find a value in three or four page reads instead of scanning. It speeds up WHERE, JOIN and ORDER BY on those columns at the cost of extra writes and space." },
        { level: "mid", q: "How do you prove an index helped?", a: "EXPLAIN before and after: a Seq Scan (SCAN in SQLite) becomes an Index Scan (SEARCH USING INDEX), and with EXPLAIN ANALYZE the time and the rows read drop. I keep the before and after plans in the pull request." },
        { level: "mid", tricky: true, q: "You added an index on the column in the WHERE clause and nothing changed. Why?", a: "Common reasons: the condition matches most rows so the planner correctly prefers a scan; a function or cast wraps the column so the index does not store what is compared; a leading wildcard in LIKE; the composite index has the columns in the wrong order; or statistics are stale." },
        { level: "mid", q: "How do you order columns in a composite index?", a: "Equality columns first, then the range or ORDER BY column. For WHERE customer_id = ? ORDER BY ordered_at DESC that is (customer_id, ordered_at): the index seeks to the customer and delivers their rows already sorted, so there is no sort step." },
        { level: "mid", tricky: true, q: "Is an index on a boolean or a low-cardinality status column useful?", a: "Rarely as a plain index, because each value matches a large share of rows. It is useful as a partial index for the rare value, like WHERE status = 'pending', or as the leading column of a composite index when queries always combine it with another filter." },
        { level: "senior", q: "What does an index cost and how do you keep that under control?", a: "Every write updates every index on the table, and indexes take space, often as much as the table. I index real query shapes from the slow query log rather than columns in general, prefer one composite index over several single-column ones where it serves the queries, and drop indexes that pg_stat_user_indexes shows unused." },
        { level: "senior", q: "Explain a covering index and when it is worth it.", a: "An index that contains every column the query needs, so the database answers from the index without visiting the table. It is worth it for hot, narrow queries like a login lookup returning id and name. The cost is a wider index and, in Postgres, it depends on a fresh visibility map to skip the heap." },
      ],
      remember: [
        "No index = read every page; cost grows with the table.",
        "Index = sorted copy + pointers; a few page reads at any size.",
        "Composite: equality first, then range/sort.",
        "EXPLAIN first; a scan with a selective filter is your index.",
      ],
    },
  ],
};
