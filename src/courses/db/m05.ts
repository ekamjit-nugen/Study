import type { Module } from "../types";

export const M05: Module = {
  id: "concurrency",
  title: "Transactions and concurrency",
  simple: "ACID in practice, the isolation levels as a simulator you can step through, and the locking patterns that stop oversells, double bookings and lost updates.",
  topics: [
    {
      slug: "acid-in-practice",
      title: "ACID in practice",
      minutes: 14,
      story: "Moving money between two jars. You must not end with the coins in the air (atomic), the total must stay the same (consistent), nobody should see one jar empty and the other not yet full (isolated), and once you say 'done' an earthquake cannot undo it (durable).",
      tldr: [
        "**Atomic:** all statements between BEGIN and COMMIT apply, or none do.",
        "**Consistent:** constraints and your invariants hold at COMMIT; the DB guarantees constraints, you guarantee the rest.",
        "**Isolated:** others do not see your half-done work (how much they see is the isolation level).",
        "**Durable:** COMMIT returns only after the WAL is on disk.",
      ],
      words: [
        ["WAL", "write-ahead log: changes are written here sequentially before data pages"],
        ["fsync", "the OS call that forces data onto the physical disk"],
        ["invariant", "a rule that must always be true, like 'total money is constant'"],
        ["rollback", "undo everything since BEGIN (or since a savepoint)"],
      ],
      sections: [
        {
          title: "The four promises on one transfer",
          analogy: "Moving money between jars with a witness, a rulebook, a curtain and a notebook: all or nothing, rules kept, nobody peeks halfway, written down for good.",
          why: "ACID is the vocabulary every database interview starts with.",
          diagram: "acid",
        },
        {
          title: "Atomicity you can see",
          analogy: "Dropping the coins halfway between jars and finding them back in the first jar.",
          why: "Without atomicity a crash loses money.",
          visual: {"kind": "flow", "steps": [{"label": "BEGIN", "tone": "accent"}, {"label": "UPDATE A −100", "sub": "not visible to others"}, {"label": "crash / ROLLBACK", "tone": "bad"}, {"label": "A unchanged", "sub": "as if nothing happened", "tone": "ok"}], "caption": "The database wrote undo information before touching the row, so it can always go back."},
          sql: [
            {
              title: "Crash simulation: a failing statement in the middle",
              sql: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- pretend the app crashed here: we ROLLBACK instead of COMMIT
ROLLBACK;
SELECT id, owner, balance FROM accounts WHERE id IN (1, 2);`,
              note: "Account 1 still has 500. Without the transaction, the 100 would be gone and account 2 never credited.",
            },
            {
              title: "Savepoints: partial undo",
              sql: `BEGIN;
UPDATE accounts SET balance = balance + 10 WHERE id = 3;
SAVEPOINT before_risky;
UPDATE accounts SET balance = balance + 999 WHERE id = 3;
ROLLBACK TO before_risky;     -- undo only the +999
COMMIT;
SELECT id, owner, balance FROM accounts WHERE id = 3;`,
              note: "Balance is 910: the +10 survived, the +999 did not. ORMs implement 'nested transactions' with savepoints.",
            },
          ],
        },
        {
          title: "Consistency is partly your job",
          analogy: "The rulebook: the database checks the rules you wrote down; it cannot check rules you only kept in your head.",
          why: "Business invariants must be checked inside the transaction or they will be broken.",
          diagram: "defenceLayers",
          bullets: [
            "The database enforces what you declared: NOT NULL, UNIQUE, CHECK, FK, exclusion constraints.",
            "Business invariants like 'order total = sum of lines' or 'at least one admin per org' are yours: enforce them inside the same transaction, often with a lock or a serializable transaction.",
            "A CHECK constraint that fails inside a transaction aborts the statement; in Postgres the whole transaction must then be rolled back.",
          ],
          sql: [
            {
              title: "A constraint as the last line of defence",
              sql: `BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 2;   -- CHECK (balance >= 0) fails
ROLLBACK;
SELECT id, balance FROM accounts WHERE id = 2;`,
              note: "CHECK constraint failed: the statement is rejected and the ROLLBACK leaves balance 120 untouched.",
            },
          ],
        },
        {
          title: "Durability and what COMMIT really waits for",
          analogy: "Writing the transfer in the notebook before touching the jars, so a power cut cannot lose it.",
          why: "COMMIT means 'safe on disk', and that costs a disk write.",
          diagram: "wal",
          bullets: [
            "COMMIT appends a record to the WAL and calls fsync. Only then does the client get 'OK'.",
            "Data pages are updated in RAM and flushed later by checkpoints. Crash recovery replays the WAL.",
            "`synchronous_commit = off` (Postgres) returns before fsync: faster, may lose the last few ms of commits on a crash. Fine for logs, wrong for payments.",
            "With replication, `synchronous_standby_names` makes COMMIT wait until a replica also has the WAL record.",
          ],
        },
        {
          title: "Transactions from Node, correctly",
          analogy: "Borrowing one specific pen for the whole form, then returning it, even if you make a mistake halfway.",
          why: "A forgotten release or a ROLLBACK that never runs freezes the app.",
          visual: {"kind": "flow", "steps": [{"label": "pool.connect()", "sub": "one client for the whole tx", "tone": "accent"}, {"label": "BEGIN"}, {"label": "your statements", "sub": "ms, no HTTP calls", "tone": "warn"}, {"label": "COMMIT", "sub": "or ROLLBACK in catch", "tone": "ok"}, {"label": "client.release()", "sub": "in finally, always", "tone": "ok"}]},
          code: [
            {
              lang: "ts",
              title: "A reusable helper",
              src: `export async function withTx<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

await withTx(pool, async (c) => {
  const debit = await c.query(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1", [amount, from]);
  if (debit.rowCount === 0) throw new Error("insufficient funds");   // → ROLLBACK
  await c.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, to]);
});`,
            },
          ],
          warn: "Keep transactions short. No HTTP calls, no sleeping, no waiting for user input inside one. Locks are held until COMMIT.",
        },
      ],
      realWorld: [
        {
          title: "The order that was charged but never created",
          problem: "Checkout creates an order, charges the card, then saves the payment. Sometimes the card is charged and no order exists. Sometimes the order exists with no payment. Support refunds by hand.",
          whyHard: "Three steps across two systems (database and payment provider). A single database transaction cannot include the card charge, and a crash between steps leaves the two systems disagreeing.",
          steps: [
            "Decide the order of operations around the external call: **record intent first** (order in status 'pending', with an idempotency key), **then** charge, **then** record the result.",
            "Pass the order id as the payment provider's idempotency key, so a retry of the charge cannot double-charge.",
            "After the charge, a short transaction updates the order to 'paid' and inserts the payment. If the app crashes before this step, a reconciliation job queries the provider by idempotency key and finishes the update.",
            "Each database step is atomic on its own; the sequence is made safe by idempotency and reconciliation, not by one big transaction.",
          ],
          code: {
            lang: "ts",
            src: `const orderId = await withTx(pool, (c) => createOrder(c, cart, { status: "pending" }));
const charge = await payments.charge({ amount, card, idempotencyKey: \`order-\${orderId}\` });
await withTx(pool, async (c) => {
  await c.query("UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending'", [orderId]);
  await c.query("INSERT INTO payments (order_id, provider_ref, amount) VALUES ($1, $2, $3) ON CONFLICT (provider_ref) DO NOTHING",
                [orderId, charge.id, amount]);
});
// reconciliation job: for orders stuck in 'pending' older than 10 min, ask the provider by idempotency key`,
          },
          takeaway: "A transaction cannot span the network. Record intent, make the external call idempotent, record the result, and reconcile the gaps.",
        },
      ],
      practice: [
        {
          q: "Transfer 50 from account 3 to account 1 in one transaction and show both balances afterwards.",
          answer: "Account 1 = 550, account 3 = 850.",
          explain: "Both updates sit between BEGIN and COMMIT, so no reader can ever see only one of them.",
          sql: `BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 3 AND balance >= 50;
UPDATE accounts SET balance = balance + 50 WHERE id = 1;
COMMIT;
SELECT id, balance FROM accounts WHERE id IN (1, 3) ORDER BY id;`,
          starter: `BEGIN;\nUPDATE accounts SET ... WHERE id = 3 AND ...;\nUPDATE accounts SET ... WHERE id = 1;\nCOMMIT;\nSELECT id, balance FROM accounts WHERE id IN (1, 3) ORDER BY id;`,
        },
        {
          q: "Which ACID letter does a UNIQUE constraint help with, and which one does fsync help with?",
          answer: "UNIQUE → Consistency (rules hold). fsync → Durability (committed data survives a crash).",
          explain: "Constraints protect invariants; the WAL + fsync protect committed data.",
        },
        {
          q: "Why should you not call a payment API inside a database transaction?",
          answer: "The transaction holds row locks and a pooled connection for the whole call (seconds), blocking other writers and starving the pool; and if the API succeeds but the COMMIT fails, you charged without recording it.",
          explain: "Transactions must be short and must not depend on external systems to complete.",
        },
      ],
      interview: [
        { level: "junior", q: "Explain ACID.", a: "Atomicity: all of a transaction's changes apply or none do. Consistency: constraints and invariants hold after commit. Isolation: concurrent transactions do not see each other's in-progress work, to a degree set by the isolation level. Durability: once commit returns, the change survives crashes because it is in the write-ahead log on disk." },
        { level: "mid", q: "How does the database make a commit durable?", a: "It appends the change to the write-ahead log and fsyncs that file before acknowledging the commit. Data pages are updated in memory and written later during checkpoints. After a crash, the database replays the log from the last checkpoint, so nothing committed is lost." },
        { level: "mid", q: "What is a savepoint?", a: "A marker inside a transaction. ROLLBACK TO a savepoint undoes only the work after it while keeping the rest of the transaction open. ORMs use it to implement nested transactions, and I use it to retry one step without losing the whole transaction." },
        { level: "senior", q: "How do you keep the database and a payment provider consistent without distributed transactions?", a: "Record intent first with an idempotency key, call the provider with that key so retries cannot double-charge, then record the result in a short transaction. A reconciliation job fixes orders stuck in pending by asking the provider. That gives eventual consistency with no lock held across the network." },
      ],
      remember: [
        "BEGIN … COMMIT: all or nothing; ROLLBACK on any error.",
        "DB guarantees constraints; you guarantee business invariants inside the transaction.",
        "COMMIT = WAL fsync. Durable, but costs a disk write.",
        "Transactions never span the network. Intent → call → result → reconcile.",
      ],
    },

    {
      slug: "isolation-levels",
      title: "Isolation levels: step through the anomalies",
      minutes: 22,
      story: "Two people editing the same spreadsheet. Do you see their keystrokes live (uncommitted)? Only when they press Save (committed)? A photo of the sheet from when you opened it (repeatable)? Or do you take turns (serializable)?",
      tldr: [
        "Isolation levels trade **correctness for concurrency**. Higher level = fewer anomalies, more waiting or retries.",
        "Anomalies: **dirty read**, **non-repeatable read**, **phantom**, **lost update**, **write skew**.",
        "Postgres default is READ COMMITTED; MySQL InnoDB default is REPEATABLE READ.",
        "SERIALIZABLE prevents everything but can fail with a serialization error: **your code must retry**.",
      ],
      words: [
        ["snapshot", "a frozen view of the database as of a moment, which a transaction reads from"],
        ["dirty read", "reading data another transaction has not committed yet"],
        ["phantom", "a row that appears in a repeated query because someone inserted it"],
        ["write skew", "two transactions each read, then write different rows, breaking a shared rule"],
        ["serialization failure", "the error a serializable transaction gets when it cannot be made consistent; retry it"],
      ],
      sections: [
        {
          title: "Simulate it: pick an anomaly, pick a level, step through",
          analogy: "Two people editing the same spreadsheet: do you see each keystroke, each save, a frozen photo, or take turns?",
          why: "Isolation levels decide which weird results your app can see under load.",
          diagram: "isolation",
        },
        {
          title: "What each level means",
          analogy: "Four settings on the same dial, from 'see everything live' to 'take turns'.",
          why: "Knowing the default of your database tells you which bugs you already have.",
          diagram: "levelsLadder",
          table: {
            head: ["Level", "You see", "Typical implementation", "Use when"],
            rows: [
              ["READ UNCOMMITTED", "other transactions' uncommitted writes", "no read locks (MySQL); Postgres silently upgrades to RC", "almost never"],
              ["READ COMMITTED", "a fresh snapshot per statement: only committed data, but it can change between your statements", "MVCC snapshot per statement", "default for most OLTP apps; combine with row locks / atomic updates"],
              ["REPEATABLE READ", "one snapshot for the whole transaction: re-reads give the same rows", "MVCC snapshot per transaction; PG also detects concurrent updates", "reports that must be internally consistent; multi-step reads"],
              ["SERIALIZABLE", "as if transactions ran one after another", "SSI in Postgres (detects dangerous patterns, aborts), locks in MySQL", "invariants spanning rows (write skew), when you can retry"],
            ],
          },
        },
        {
          title: "The lost update, and three ways to kill it",
          analogy: "Two cashiers reading the same till total, each adding their sale, the second overwriting the first.",
          why: "Lost updates silently lose money and stock.",
          visual: {"kind": "cards", "items": [{"title": "1 Atomic UPDATE", "lines": ["SET balance = balance − 100 WHERE balance ≥ 100", "the DB does the maths under the row lock"], "tone": "ok"}, {"title": "2 Version column", "lines": ["UPDATE … WHERE version = 1", "0 rows → reload and retry"], "tone": "ok"}, {"title": "3 SELECT … FOR UPDATE", "lines": ["lock, read, decide, write, COMMIT", "others wait, then see the new value"], "tone": "accent"}, {"title": "4 SERIALIZABLE", "lines": ["DB aborts one transaction", "your code retries"], "tone": "warn"}]},
          sql: [
            {
              title: "1. Atomic update: let the DB do the maths",
              sql: `-- never: read balance in app, compute, write literal value
UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;
SELECT changes() AS rows_updated, (SELECT balance FROM accounts WHERE id = 1) AS balance;`,
            },
            {
              title: "2. Optimistic lock: a version column",
              sql: `-- read: SELECT balance, version FROM accounts WHERE id = 1;  → 500, 1
-- write only if nobody else wrote since:
UPDATE accounts SET balance = 400, version = version + 1 WHERE id = 1 AND version = 1;
SELECT changes() AS rows_updated;   -- 1 = ok, 0 = someone else changed it → reload and retry`,
            },
          ],
        },
        {
          title: "Write skew: the one that REPEATABLE READ cannot catch",
          analogy: "Two doctors each checking 'someone else is on call' and both going home.",
          why: "Rules that span rows need serializable or a shared lock.",
          diagram: "writeSkew",
          body: "Rule: at least one doctor on call. Both doctors read 'two on call', each sets themselves off call, both commit. No row was written twice, so row-level checks see nothing wrong. Only SERIALIZABLE (or an explicit lock on a shared row, or a constraint) prevents it.",
          code: [
            {
              lang: "sql",
              title: "Three fixes for write skew",
              src: `-- a) SERIALIZABLE + retry
BEGIN ISOLATION LEVEL SERIALIZABLE; ... COMMIT;   -- may fail with 40001 → retry

-- b) lock the rule's scope: materialise the invariant as a row and lock it
SELECT * FROM shifts WHERE id = :shift FOR UPDATE;   -- both doctors serialise on this row
UPDATE doctors SET on_call = false WHERE id = :me;
-- c) make the invariant a constraint when possible (unique index, check, exclusion)`,
            },
          ],
        },
        {
          title: "Retrying serialization failures",
          analogy: "Redialling when the line is busy, waiting a moment longer each time.",
          why: "Serializable without retries just turns conflicts into crashes.",
          visual: {"kind": "flow", "steps": [{"label": "run transaction", "tone": "accent"}, {"label": "error 40001 / 40P01?", "sub": "serialization failure or deadlock", "tone": "warn"}, {"label": "backoff 20–70 ms", "sub": "random jitter"}, {"label": "retry (max 3)", "sub": "body must be idempotent", "tone": "ok"}, {"label": "give up → 503", "sub": "after the last attempt", "tone": "bad"}]},
          code: [
            {
              lang: "ts",
              src: `async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (e: any) {
      const retryable = e.code === "40001" || e.code === "40P01";  // serialization failure, deadlock
      if (!retryable || i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 20 * i + Math.random() * 50));
    }
  }
}`,
            },
          ],
          tip: "Make the transaction body idempotent and free of side effects (no emails inside), so retrying it is safe.",
        },
      ],
      realWorld: [
        {
          title: "Flash sale: 100 units, 100,000 clicks, no overselling",
          problem: "A product with 100 units sells 143 during a flash sale. The code checked `stock > 0` before decrementing.",
          whyHard: "Under READ COMMITTED, every one of 1,000 concurrent requests reads stock = 100, decides it is fine, and decrements. The check and the write are separate statements, so the check is worthless.",
          steps: [
            "Collapse check and write into **one atomic statement**: `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1 RETURNING stock`.",
            "The row lock inside UPDATE serialises the 1,000 requests on that row; each re-evaluates `stock >= 1` against the latest value.",
            "Zero rows returned = sold out; respond 409. No transaction juggling needed for a single row.",
            "For a multi-row cart, lock the product rows in a fixed order with `FOR UPDATE` inside one transaction, check all, decrement all.",
          ],
          sql: `-- Run this many times: it stops updating exactly when stock hits 0, never below.
UPDATE products SET stock = stock - 1 WHERE id = 4 AND stock >= 1 RETURNING id, stock;`,
          takeaway: "Check-then-act in two statements is a race. One conditional UPDATE is the whole fix.",
        },
      ],
      practice: [
        {
          q: "Using the version column, update account 2's owner to 'Priya N.' only if version is still 1, then show the row.",
          answer: "1 row updated; version becomes 2.",
          explain: "An optimistic lock: the WHERE on version makes the write fail if anyone changed the row first.",
          sql: `UPDATE accounts SET owner = 'Priya N.', version = version + 1 WHERE id = 2 AND version = 1;
SELECT id, owner, version FROM accounts WHERE id = 2;`,
          starter: `UPDATE accounts SET owner = 'Priya N.', version = version + 1 WHERE id = 2 AND ...;\nSELECT id, owner, version FROM accounts WHERE id = 2;`,
        },
        {
          q: "A nightly report reads 5 tables and the numbers must add up. Which isolation level and why?",
          answer: "REPEATABLE READ: one snapshot for the whole transaction, so all 5 reads see the same moment. SERIALIZABLE is unnecessary for a read-only report (though in Postgres a read-only serializable deferrable transaction is also fine).",
          explain: "Internal consistency across several reads is exactly what a per-transaction snapshot gives.",
        },
        {
          q: "Which anomaly does REPEATABLE READ (Postgres) NOT prevent, and what does?",
          answer: "Write skew. SERIALIZABLE prevents it, or an explicit lock on a shared row, or a constraint.",
          explain: "Write skew involves writes to different rows, so per-row conflict detection never fires.",
        },
      ],
      interview: [
        { level: "junior", q: "What are the SQL isolation levels?", a: "Read uncommitted, read committed, repeatable read and serializable. Each level removes more anomalies: dirty reads, then non-repeatable reads, then phantoms, until serializable behaves as if transactions ran one at a time. Postgres defaults to read committed and MySQL to repeatable read." },
        { level: "mid", q: "What is a lost update and how do you prevent it?", a: "Two transactions read the same value, each computes a new one, and the second write overwrites the first. I prevent it with an atomic update like SET balance = balance - 100 WHERE balance >= 100, an optimistic version column checked in the WHERE, a pessimistic SELECT FOR UPDATE, or serializable isolation with retries." },
        { level: "mid", q: "What is the difference between a non-repeatable read and a phantom read?", a: "Non-repeatable: I read a row twice and its values changed because someone committed an update in between. Phantom: I run the same WHERE twice and new rows appear because someone inserted them. Repeatable read fixes the first; the standard only promises serializable fixes the second, though Postgres snapshots prevent phantoms too." },
        { level: "senior", q: "Explain write skew and why repeatable read does not stop it.", a: "Two transactions read overlapping data, then each writes a different row based on what it read, and together they break a rule, like both on-call doctors signing off. No row is written twice, so row-level conflict detection never fires. Postgres serializable detects the read-write dependency and aborts one; otherwise I lock a shared row or encode the rule as a constraint." },
        { level: "senior", q: "How does Postgres implement SERIALIZABLE?", a: "With serializable snapshot isolation: it runs on snapshots like repeatable read, tracks read and write dependencies between concurrent transactions using predicate locks, and aborts one transaction when it finds a dangerous cycle. It never blocks readers, but applications must retry on error 40001." },
      ],
      remember: [
        "RC = fresh snapshot per statement; RR = one snapshot per transaction; S = as if alone.",
        "Lost update → atomic UPDATE, version column, FOR UPDATE, or serializable.",
        "Write skew → only SERIALIZABLE, a shared lock row, or a constraint.",
        "Serializable means retry logic in the app.",
      ],
    },

    {
      slug: "locks-mvcc-deadlocks",
      title: "Locks, MVCC and deadlocks",
      minutes: 20,
      story: "A library book. MVCC is a photocopier: readers each get a copy of the page as it was, while the editor marks up the original. Locks are the 'do not touch' sign the editor puts on the chapter.",
      tldr: [
        "**MVCC:** writers create new row versions; readers see a snapshot. Readers never block writers, writers never block readers.",
        "Writers block writers on the **same row** until COMMIT.",
        "**Deadlock:** T1 waits for T2 and T2 for T1. The DB kills one. Avoid by locking rows in a consistent order; always retry.",
        "`SELECT ... FOR UPDATE` = pessimistic lock. `... SKIP LOCKED` = the perfect job queue.",
      ],
      words: [
        ["MVCC", "multi-version concurrency control: keep old row versions for readers"],
        ["row lock", "a lock on one row, taken by UPDATE/DELETE/SELECT FOR UPDATE"],
        ["deadlock", "two transactions each waiting for a lock the other holds"],
        ["pessimistic locking", "lock first, then read and write"],
        ["optimistic locking", "read freely, detect conflicts at write time with a version"],
        ["advisory lock", "an application-defined lock on a number, not on a row"],
      ],
      sections: [
        {
          title: "MVCC: readers and writers do not fight",
          analogy: "A photocopier: readers get a copy of the page as it was while the editor marks up the original.",
          why: "This is why reads do not block writes in Postgres.",
          diagram: "mvcc",
          bullets: [
            "An UPDATE writes a new version of the row and marks the old one as ended by this transaction.",
            "Each transaction's snapshot decides which version is visible. Old versions stay until no snapshot needs them.",
            "Postgres cleans dead versions with VACUUM; InnoDB keeps them in the undo log. Long transactions keep dead versions alive → bloat.",
          ],
        },
        {
          title: "Locks that actually matter in app code",
          analogy: "'Do not touch' signs of different strengths: shared signs let others read, exclusive signs let nobody near.",
          why: "Knowing which statement takes which lock explains most waiting.",
          table: {
            head: ["Statement", "Lock", "Blocks"],
            rows: [
              ["SELECT", "none (MVCC)", "nothing"],
              ["SELECT ... FOR SHARE", "shared row lock", "writers of those rows"],
              ["SELECT ... FOR UPDATE", "exclusive row lock", "other FOR UPDATE / UPDATE / DELETE on those rows"],
              ["UPDATE / DELETE", "exclusive row lock", "same"],
              ["INSERT with UNIQUE", "index entry lock", "a concurrent insert of the same key waits, then fails"],
              ["ALTER TABLE, DROP", "ACCESS EXCLUSIVE table lock", "everything, including SELECT"],
              ["CREATE INDEX (plain)", "SHARE table lock", "writes"],
            ],
          },
        },
        {
          title: "Pessimistic vs optimistic",
          analogy: "Booking a seat by holding it while you decide, versus deciding freely and checking the seat is still free when you pay.",
          why: "Pick wrong and you either block everyone or lose edits.",
          diagram: "optimisticVsPessimistic",
          code: [
            {
              lang: "sql",
              title: "Pessimistic: lock, read, decide, write",
              src: `BEGIN;
SELECT stock FROM products WHERE id = 4 FOR UPDATE;    -- others wait here
-- app logic: if stock >= qty
UPDATE products SET stock = stock - 2 WHERE id = 4;
COMMIT;                                                 -- lock released`,
            },
            {
              lang: "sql",
              title: "Optimistic: read, work, write with version check",
              src: `SELECT stock, version FROM products WHERE id = 4;          -- 8, v1 (no lock)
-- ...user thinks for 30 seconds...
UPDATE products SET stock = 6, version = 2 WHERE id = 4 AND version = 1;
-- 0 rows → somebody changed it → show "please refresh" and retry`,
            },
          ],
          table: {
            head: ["", "Pessimistic (FOR UPDATE)", "Optimistic (version)"],
            rows: [
              ["Conflicts are", "frequent (hot rows: stock, balances)", "rare (editing a profile)"],
              ["Hold time", "short, inside one transaction", "any length, no lock held"],
              ["Cost", "waiting, possible deadlocks", "retries, wasted work on conflict"],
              ["Works across web requests?", "no", "yes"],
            ],
          },
        },
        {
          title: "Deadlocks",
          analogy: "Two people each holding one chopstick and waiting for the other's.",
          why: "Deadlocks are normal at scale; unhandled ones are bugs.",
          diagram: "locks",
          bullets: [
            "T1 updates row A then B; T2 updates B then A. Each holds one and waits for the other: deadlock. The DB detects the cycle after ~1 s and aborts one (Postgres 40P01, MySQL 1213).",
            "Prevent: always lock rows in the same order (sort ids), keep transactions short, avoid updating the same rows from many code paths.",
            "Handle: catch the error and retry the whole transaction. Deadlocks are normal at scale; unhandled deadlocks are bugs.",
          ],
          code: [
            {
              lang: "sql",
              title: "Lock in a consistent order",
              src: `-- transfer between any two accounts: lock the lower id first, always
SELECT * FROM accounts WHERE id IN (:from, :to) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - :amt WHERE id = :from;
UPDATE accounts SET balance = balance + :amt WHERE id = :to;`,
            },
          ],
        },
        {
          title: "SKIP LOCKED: a job queue in plain SQL",
          analogy: "Workers taking tickets from a dispenser: if the next ticket is in someone's hand, take the one after.",
          why: "The right way to build a queue on Postgres without double processing.",
          diagram: "jobQueue",
          code: [
            {
              lang: "sql",
              src: `-- each worker grabs one job nobody else holds; no double processing, no waiting
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'queued' AND run_at <= now()
  ORDER BY run_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j SET status = 'running', started_at = now(), worker = :worker
FROM next WHERE j.id = next.id
RETURNING j.*;`,
            },
          ],
          tip: "Advisory locks (`pg_advisory_xact_lock(key)`) lock an arbitrary number: perfect for 'only one process runs this cron' or 'serialise per-tenant imports' without a row to lock.",
        },
      ],
      realWorld: [
        {
          title: "Two workers processed the same job",
          problem: "A background queue table is polled by 5 workers. Occasionally two workers run the same job: duplicate emails, double refunds.",
          whyHard: "Each worker does `SELECT ... WHERE status='queued' LIMIT 1` then `UPDATE ... SET status='running'`. Both SELECTs can return the same row before either UPDATE runs. Adding `WHERE status = 'queued'` to the UPDATE helps only if you check the row count, and workers still collide and retry constantly.",
          steps: [
            "Make the claim atomic: select and update in one statement (CTE + UPDATE ... RETURNING).",
            "Use `FOR UPDATE SKIP LOCKED` so a worker skips rows another worker is claiming instead of waiting or colliding.",
            "Index `(status, run_at)` so each claim is an index seek.",
            "Add a lease: `locked_until`, so a crashed worker's job becomes claimable again after a timeout. Make job handlers idempotent anyway.",
          ],
          sql: `-- SQLite has no SKIP LOCKED; the atomic-claim half still applies. Simulate a jobs table:
CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, status TEXT NOT NULL, worker TEXT);
INSERT INTO jobs (status) VALUES ('queued'), ('queued'), ('queued');
-- atomic claim: only one worker can flip a given row from queued → running
UPDATE jobs SET status = 'running', worker = 'w1'
WHERE id = (SELECT id FROM jobs WHERE status = 'queued' ORDER BY id LIMIT 1) AND status = 'queued'
RETURNING id, status, worker;`,
          takeaway: "A claim must be one atomic statement. SKIP LOCKED turns 'wait for the lock' into 'take the next free row', which is exactly what a queue wants.",
        },
      ],
      practice: [
        {
          q: "Write the transfer that locks accounts 3 and 1 in id order, moves 100 from 3 to 1, and shows both balances.",
          answer: "Account 1 = 600, account 3 = 800.",
          explain: "Locking in a fixed order (lower id first) prevents the A→B / B→A deadlock pattern; SQLite ignores FOR UPDATE syntax, so the ORDER BY SELECT here is illustrative and the updates are what matter.",
          sql: `BEGIN;
SELECT id FROM accounts WHERE id IN (1, 3) ORDER BY id;
UPDATE accounts SET balance = balance - 100 WHERE id = 3 AND balance >= 100;
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
COMMIT;
SELECT id, balance FROM accounts WHERE id IN (1, 3) ORDER BY id;`,
          starter: `BEGIN;\nSELECT id FROM accounts WHERE id IN (1, 3) ORDER BY id;\nUPDATE accounts SET ... WHERE id = 3 AND ...;\nUPDATE accounts SET ... WHERE id = 1;\nCOMMIT;\nSELECT id, balance FROM accounts WHERE id IN (1, 3) ORDER BY id;`,
        },
        {
          q: "A user edits a document for 20 minutes then saves. Pessimistic or optimistic locking?",
          answer: "Optimistic: compare the version (or updated_at) on save and reject with 'someone else edited this' if it changed. A 20-minute row lock would block everyone and die with the connection.",
          explain: "Locks cannot span web requests; versions can.",
        },
        {
          q: "What does the database do when it detects a deadlock, and what must your code do?",
          answer: "It aborts one of the transactions with a deadlock error (Postgres 40P01). Your code must catch it and retry the whole transaction, ideally with a small random backoff.",
          explain: "Deadlock detection breaks the cycle; only the application can redo the work.",
        },
      ],
      interview: [
        { level: "mid", q: "What is MVCC?", a: "Multi-version concurrency control: instead of locking rows for readers, the database keeps multiple versions of a row. Writers create a new version and readers see the version visible in their snapshot. So reads never block writes and writes never block reads; only writers on the same row wait for each other." },
        { level: "mid", q: "Pessimistic vs optimistic locking: when do you use each?", a: "Pessimistic, with SELECT FOR UPDATE inside a short transaction, when conflicts are likely, such as stock or balances. Optimistic, with a version column checked in the UPDATE's WHERE, when conflicts are rare or the edit spans user think-time across requests, since a lock cannot live across HTTP requests." },
        { level: "senior", q: "How do you avoid and handle deadlocks?", a: "Avoid them by acquiring locks in a consistent order, usually sorted by primary key, keeping transactions short, and touching rows from as few code paths as possible. Handle them by catching the deadlock error and retrying the whole transaction with backoff, because the database aborts one victim and the other proceeds." },
        { level: "senior", q: "How would you build a job queue on Postgres?", a: "A jobs table indexed on (status, run_at). Workers claim with a single UPDATE ... FROM (SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING, so each worker takes a different row without waiting. A locked_until lease recovers from crashed workers, and handlers are idempotent because delivery is at-least-once." },
        { level: "senior", q: "Why do long-running transactions hurt Postgres?", a: "Their snapshot keeps old row versions visible, so VACUUM cannot remove dead tuples and tables and indexes bloat. They also hold any locks they took, blocking DDL and writers, and they pin a connection. I set idle_in_transaction_session_timeout and keep transactions to milliseconds." },
      ],
      remember: [
        "MVCC: readers see snapshots, writers make versions, only writers on the same row wait.",
        "Hot rows → FOR UPDATE in a short transaction. Long edits → version column.",
        "Deadlocks: lock in id order, keep it short, always retry.",
        "Queue claim = one atomic statement with SKIP LOCKED.",
      ],
    },
  ],
};
