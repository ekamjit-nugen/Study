import type { Module } from "../types";

export const M06: Module = {
  id: "scale",
  title: "Scale and architecture",
  simple: "What is on disk, how copies stay in sync, when to split data across machines, and how to stay correct when more than one system is involved.",
  topics: [
    {
      slug: "storage-internals",
      title: "Storage internals: pages, WAL, heaps and clustered indexes",
      minutes: 16,
      story: "A warehouse stores goods in fixed-size boxes on shelves. You never fetch one item; you fetch a box. A clever warehouse keeps the popular boxes near the door (buffer pool) and writes every delivery in a logbook before shelving it (WAL).",
      tldr: [
        "Everything is read and written in fixed-size **pages** (8 KB Postgres, 16 KB InnoDB). Cost = pages touched.",
        "Hot pages live in the **buffer pool** (RAM). A cold cache means disk reads.",
        "**WAL first, data later.** COMMIT = sequential log write; checkpoints flush pages in the background.",
        "Postgres tables are **heaps** (rows anywhere, indexes point at them). InnoDB tables **are** the primary-key B-tree (clustered), so PK choice shapes the whole table.",
      ],
      words: [
        ["page / block", "the fixed-size unit of disk IO and caching"],
        ["buffer pool", "the cache of pages in RAM"],
        ["heap table", "rows stored in no particular order (Postgres)"],
        ["clustered index", "the table stored in primary-key order (InnoDB, SQL Server)"],
        ["dead tuple", "an old row version nobody can see any more, waiting for VACUUM"],
      ],
      sections: [
        {
          title: "Pages and the buffer pool",
          analogy: "A warehouse that moves whole boxes, never single items, and keeps popular boxes by the door.",
          why: "Query cost is boxes moved, and the door shelf (RAM) is the whole game.",
          diagram: "pages",
          bullets: [
            "A row lookup through an index: ~3 index pages + 1 table page. Those 4 pages are likely cached after the first time.",
            "A sequential scan of a 10 GB table reads 1.3 million pages. No amount of CPU fixes that; only reading fewer pages does.",
            "`EXPLAIN (ANALYZE, BUFFERS)` shows 'shared hit' (cache) vs 'read' (disk). Shrinking reads is the whole game.",
          ],
        },
        {
          title: "Write path: WAL then checkpoint",
          analogy: "Writing every delivery in a logbook at the gate before shelving it; shelving happens in batches later.",
          why: "This is why commits are fast and crashes lose nothing committed.",
          diagram: "wal",
          bullets: [
            "WAL writes are sequential appends, which disks love. Data page writes are random, so they are batched into checkpoints.",
            "Crash recovery replays WAL after the last checkpoint. Replication ships the same WAL.",
            "Bigger `wal_buffers`, `checkpoint_timeout` and `max_wal_size` smooth write spikes; `shared_buffers` sizes the cache (≈25% of RAM is the usual Postgres start).",
          ],
        },
        {
          title: "Heap vs clustered: why PK choice matters",
          analogy: "Loose papers in a drawer with an index card per paper (heap), versus a binder where the pages are the index (clustered).",
          why: "The same UUID choice is fine in Postgres and painful in MySQL.",
          diagram: "heapVsClustered",
          table: {
            head: ["", "Postgres (heap)", "MySQL InnoDB (clustered)"],
            rows: [
              ["Row location", "anywhere in the heap; every index stores a physical pointer (ctid)", "inside the PK B-tree, in PK order"],
              ["Secondary index leaf holds", "ctid → one hop to the heap", "the PK value → second B-tree lookup"],
              ["Random UUID PK", "hurts only the PK index", "scatters the whole table; page splits everywhere"],
              ["Range scan by PK", "may jump around the heap", "sequential: rows are physically adjacent"],
              ["UPDATE", "writes a new row version (HOT if no indexed column changed)", "updates in place; undo log keeps the old version"],
            ],
          },
        },
        {
          title: "Bloat and VACUUM (Postgres)",
          analogy: "Crossing out old lines in a notebook without ever tearing out pages: the notebook grows while the real content does not.",
          why: "Bloat makes a 5 GB table cost 50 GB of reads.",
          diagram: "bloat",
          bullets: [
            "Every UPDATE/DELETE leaves a dead tuple. VACUUM marks the space reusable; autovacuum does this in the background.",
            "If autovacuum cannot keep up (heavy updates, long transactions), tables and indexes bloat: more pages for the same data, slower everything.",
            "Signs: table size growing while row count is flat; `n_dead_tup` high in `pg_stat_user_tables`.",
            "Fixes: tune autovacuum per table (`autovacuum_vacuum_scale_factor`), kill long transactions, `pg_repack` for an online rebuild, avoid updating indexed columns needlessly.",
          ],
        },
        {
          title: "SQLite peek: what is in a page",
          analogy: "Looking inside one box to see how many items fit.",
          why: "Seeing page counts makes 'pages touched' concrete.",
          sql: [
            {
              title: "How many pages does our tiny database use?",
              sql: `SELECT (SELECT page_size FROM pragma_page_size) AS page_size,
       (SELECT page_count FROM pragma_page_count) AS pages,
       (SELECT page_size FROM pragma_page_size) * (SELECT page_count FROM pragma_page_count) / 1024.0 AS kb;`,
              note: "Even this toy database is dozens of 4 KB pages. A B-tree index is just more pages.",
            },
          ],
        },
      ],
      realWorld: [
        {
          title: "The table that is 50 GB but holds 5 GB of data",
          problem: "A sessions table gets updated on every request (last_seen_at). It has grown to 50 GB and queries that touch it are slow, though it only has 20 million live rows.",
          whyHard: "Row count looks fine, indexes exist, plans look reasonable. The problem is physical: 90% of the pages are dead row versions that VACUUM could not reclaim, so every scan reads 10× the pages it should.",
          steps: [
            "Confirm bloat: `pg_stat_user_tables.n_dead_tup`, table size vs expected (rows × avg width), or the pgstattuple extension.",
            "Find why VACUUM fell behind: a long-running transaction (`pg_stat_activity` with `xact_start` hours ago) pins old versions; or autovacuum is throttled for a table updated this often.",
            "Stop the bleeding: terminate the stuck transaction, set `idle_in_transaction_session_timeout`, make autovacuum more aggressive on this table.",
            "Reclaim space online with `pg_repack` (VACUUM FULL locks the table).",
            "Reduce churn: update last_seen_at at most once per minute, or move the hot column to a separate narrow table, or into Redis.",
          ],
          code: {
            lang: "sql",
            src: `SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables WHERE relname = 'sessions';

ALTER TABLE sessions SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_cost_delay = 2);
SELECT pid, now() - xact_start AS age, query FROM pg_stat_activity WHERE xact_start < now() - interval '1 hour';`,
          },
          takeaway: "Update-heavy tables need VACUUM to keep up. Watch dead tuples, kill long transactions, and avoid hot columns on wide rows.",
        },
      ],
      practice: [
        {
          q: "Why is a random UUID primary key worse on MySQL InnoDB than on Postgres?",
          answer: "InnoDB stores the whole table inside the PK B-tree, so random keys cause page splits across the entire table and secondary indexes carry the 16-byte PK. In Postgres only the PK index itself suffers.",
          explain: "Clustered storage ties physical layout to the primary key order.",
        },
        {
          q: "A query shows `Buffers: shared hit=120 read=48000`. What does it tell you?",
          answer: "Most of the pages came from disk, not cache: the data is cold or the query touches far too many pages. Fix by reading fewer pages (better index, partition pruning) or by having more RAM for the buffer pool.",
          explain: "Disk reads are orders of magnitude slower than buffer hits.",
        },
        {
          q: "Count the rows in orders and the pages of the whole database, using the pragma functions.",
          answer: "24 rows; pages will be a few dozen.",
          explain: "pragma_page_count exposes the physical size; row counts and page counts are different units of cost.",
          sql: `SELECT (SELECT COUNT(*) FROM orders) AS order_rows, (SELECT page_count FROM pragma_page_count) AS pages;`,
        },
      ],
      interview: [
        { level: "mid", q: "What is the write-ahead log and why does it exist?", a: "A sequential log where every change is written and fsynced before the data pages are touched. It makes commits durable with one sequential write instead of many random ones, lets the database recover after a crash by replaying the log, and is the stream that replication ships to replicas." },
        { level: "mid", q: "What is the difference between a heap table and a clustered index?", a: "In a heap, like Postgres, rows sit wherever there is space and every index points to their physical location. In a clustered table, like InnoDB, the table is stored inside the primary-key B-tree in key order, and secondary indexes store the primary key instead of a pointer. That makes PK range scans fast and random PKs expensive." },
        { level: "senior", q: "What is table bloat in Postgres and how do you deal with it?", a: "MVCC leaves dead row versions after updates and deletes; if VACUUM cannot reclaim them, usually because of long transactions or an under-tuned autovacuum, the table grows and every scan reads more pages. I monitor dead tuples, kill idle-in-transaction sessions, tune autovacuum per hot table, and rebuild online with pg_repack if needed." },
        { level: "senior", q: "How does the buffer pool affect query performance?", a: "It is the page cache. A query whose pages are cached runs at memory speed; the same query on cold pages waits for disk. I size shared_buffers sensibly, keep hot data small through narrow tables and selective indexes, and read the buffers line in EXPLAIN ANALYZE to see hits versus reads." },
      ],
      remember: [
        "IO is in pages; cost is pages touched; cache hits are everything.",
        "WAL first (sequential), pages later (checkpoint).",
        "Heap (Postgres) vs clustered (InnoDB): PK order shapes InnoDB tables.",
        "Dead tuples need VACUUM; long transactions block it.",
      ],
    },

    {
      slug: "replication-failover-backups",
      title: "Replication, failover and backups",
      minutes: 16,
      story: "A newsroom with one editor (primary) and many printing presses (replicas). Every article goes to the editor; presses copy it seconds later. If the editor collapses, one press is promoted. The archive (backups) is in a different building.",
      tldr: [
        "One **primary** takes writes and streams WAL to **replicas** that serve reads.",
        "**Async** replication is fast but can lose the last commits on failover; **sync** waits for a replica and never loses them.",
        "**Replication lag** causes 'I just saved it and it is gone': read your own writes from the primary.",
        "Backups are only real if you have **restored** one. Know your RPO (data loss allowed) and RTO (downtime allowed).",
      ],
      words: [
        ["primary / replica", "the writable copy and the read-only copies fed from it"],
        ["replication lag", "how far behind a replica is, in seconds or bytes of WAL"],
        ["failover", "promoting a replica to primary when the primary dies"],
        ["PITR", "point-in-time recovery: restore a base backup and replay WAL to a chosen second"],
        ["RPO / RTO", "how much data you may lose / how long you may be down"],
      ],
      sections: [
        {
          title: "How replication works and what goes wrong",
          analogy: "One editor and many printing presses copying each article seconds later.",
          why: "Replicas scale reads but introduce lag and failover questions.",
          diagram: "replication",
        },
        {
          title: "Sync vs async",
          analogy: "Sending a letter with or without waiting for the delivery receipt.",
          why: "Async can lose the last commits on a crash; sync is slower but safe.",
          diagram: "syncAsync",
          table: {
            head: ["", "Asynchronous", "Synchronous"],
            rows: [
              ["COMMIT returns when", "primary's WAL is on its disk", "at least one replica has the WAL too"],
              ["Data loss on primary crash", "last few ms to seconds of commits", "none"],
              ["Write latency", "low", "+ network round trip to the replica"],
              ["If the replica dies", "nothing happens", "writes stall unless you have another sync replica or a timeout"],
              ["Use for", "most apps, read scaling", "money, anything where 'lost after OK' is unacceptable"],
            ],
          },
        },
        {
          title: "Read-your-writes with replicas",
          analogy: "Posting a notice on the main board and then checking a photocopy that was printed a second earlier.",
          why: "Users report 'my save did not work' when reads come from a lagging replica.",
          visual: {"kind": "flow", "steps": [{"label": "user saves profile", "sub": "→ primary", "tone": "accent"}, {"label": "next 5 s: that user's reads", "sub": "→ primary", "tone": "warn"}, {"label": "after that", "sub": "→ replica", "tone": "ok"}], "caption": "Alternative: remember the write's WAL position and only use a replica that has replayed past it."},
          code: [
            {
              lang: "ts",
              title: "Route reads after a write to the primary",
              src: `// After any write in this request/session, read from the primary for N seconds
async function query(sql: string, params: unknown[], ctx: Ctx) {
  const recentlyWrote = ctx.lastWriteAt && Date.now() - ctx.lastWriteAt < 5000;
  const db = isWrite(sql) || recentlyWrote ? primary : replica;
  if (isWrite(sql)) ctx.lastWriteAt = Date.now();
  return db.query(sql, params);
}
// Alternatives: compare WAL positions (pg_last_wal_replay_lsn) before reading from a replica,
// or route by user id to the same replica to at least be consistently behind.`,
            },
          ],
        },
        {
          title: "Failover",
          analogy: "The editor collapses; one press is promoted, and the old editor must be stopped from publishing when they wake up.",
          why: "Failover without fencing creates two sources of truth.",
          visual: {"kind": "flow", "steps": [{"label": "primary dies", "tone": "bad"}, {"label": "consensus (etcd) elects a replica", "sub": "Patroni / RDS / operator"}, {"label": "fence the old primary", "sub": "no split brain", "tone": "warn"}, {"label": "DNS / proxy repoints", "tone": "accent"}, {"label": "app reconnects + retries", "sub": "idempotent writes", "tone": "ok"}]},
          bullets: [
            "Manual failover: a human promotes a replica and repoints the app. Minutes of downtime.",
            "Automatic: Patroni, Postgres operators, RDS Multi-AZ, Aurora. A consensus store (etcd) elects one leader so two primaries cannot exist (**split brain**).",
            "Fencing: the old primary must be stopped or made read-only before the new one takes writes.",
            "The app needs: a DNS/proxy that follows the primary, connection retries, and idempotent writes because an in-flight COMMIT during failover is 'unknown'.",
          ],
        },
        {
          title: "Backups that actually restore",
          analogy: "A fire drill: the evacuation plan is only real once you have walked it.",
          why: "An untested backup is a hope, not a plan.",
          diagram: "pitr",
          table: {
            head: ["Method", "What you get", "RPO", "Notes"],
            rows: [
              ["pg_dump / mysqldump", "logical SQL", "since the dump", "portable; slow to restore at scale"],
              ["Base backup + WAL archiving (PITR)", "restore to any second", "seconds", "the standard; pgBackRest, WAL-G"],
              ["Snapshots (cloud disk)", "whole volume", "snapshot interval", "fast; test consistency"],
              ["Replica", "NOT a backup", "—", "a DELETE replicates in milliseconds"],
            ],
          },
          warn: "A replica is not a backup. `DELETE FROM users` replicates in milliseconds. Only PITR lets you go back to 'one minute before the mistake'.",
        },
      ],
      realWorld: [
        {
          title: "'I changed my avatar and it changed back'",
          problem: "Users update their profile, the page reloads, and the old data shows for a second or two. Support tickets say 'the save button is broken'.",
          whyHard: "The write succeeded on the primary; the reload read from a replica that was 800 ms behind. The bug is invisible in development with one database.",
          steps: [
            "Confirm with `pg_stat_replication` (Postgres) or `SHOW REPLICA STATUS` (MySQL): lag spikes under write load.",
            "Classify reads: 'my own data right after I changed it' must not come from a replica.",
            "Implement read-your-writes: after a write, route that user's reads to the primary for a few seconds (cookie or session timestamp), or wait until the replica's replay LSN passes the write's LSN.",
            "Keep everything else (listings, search, reports) on replicas; that was the point of having them.",
          ],
          takeaway: "Replicas are eventually consistent. Decide per query whether 'a few seconds old' is acceptable; for a user's own fresh writes it is not.",
        },
      ],
      practice: [
        {
          q: "Your RPO is 0 for payments. Which replication mode, and what is the trade-off?",
          answer: "Synchronous replication to at least one replica. Trade-off: higher commit latency and writes stall if the sync replica is unreachable (mitigate with two candidates and a timeout policy).",
          explain: "RPO 0 means no committed transaction may be lost, which only sync replication provides.",
        },
        {
          q: "Someone ran `DELETE FROM orders` without a WHERE at 14:03. You have replicas and nightly dumps. What saves you?",
          answer: "Only point-in-time recovery (base backup + WAL) to 14:02. Replicas already replicated the delete; the nightly dump loses a day.",
          explain: "Replication copies mistakes; PITR rewinds them.",
        },
        {
          q: "Name two ways to give a user read-your-writes consistency with read replicas.",
          answer: "Route the user's reads to the primary for a few seconds after their write; or record the write's WAL position and only use a replica that has replayed past it.",
          explain: "Both ensure the reader never observes a state older than their own write.",
        },
      ],
      interview: [
        { level: "junior", q: "What is a read replica for?", a: "A copy of the database kept up to date by streaming the primary's write-ahead log. It serves read queries, so reports and listings do not load the primary, and it can be promoted if the primary fails. It does not help with write throughput." },
        { level: "mid", q: "What is replication lag and how do you deal with it?", a: "The delay before a replica has applied the primary's latest changes, usually milliseconds to seconds. For reads that must see a user's own fresh write, I read from the primary for a short window after the write or wait for the replica to pass that write's log position. Everything else tolerates lag." },
        { level: "mid", q: "Is a replica a backup?", a: "No. A mistaken DELETE or a bad migration replicates immediately. A backup is a base backup plus archived WAL so I can restore to a point in time before the mistake, and I test restores regularly because an untested backup is a hope, not a plan." },
        { level: "senior", q: "What happens during a failover and what must the application handle?", a: "A replica is promoted, the old primary is fenced so there is no split brain, and DNS or a proxy repoints to the new primary. In-flight transactions are lost and a commit sent during the switch is in an unknown state, so the app must reconnect with retries and make writes idempotent. With async replication, the last committed transactions may be gone, which is why I use sync replication for critical data." },
      ],
      remember: [
        "Primary writes, replicas read, WAL is the stream.",
        "Async = fast, may lose last commits. Sync = safe, slower.",
        "Own fresh writes → read from primary. Everything else → replica.",
        "Replica ≠ backup. PITR + tested restores = backup.",
      ],
    },

    {
      slug: "partitioning-and-sharding",
      title: "Partitioning and sharding",
      minutes: 16,
      story: "A filing cabinet with one giant drawer vs one drawer per year (partitioning). When the cabinet itself is full, you buy more cabinets and decide which cabinet holds whose files (sharding).",
      tldr: [
        "**Partitioning:** one logical table split into physical pieces on the same server, usually by time. Queries with the partition key skip the rest (pruning); old data is dropped instantly.",
        "**Sharding:** rows split across **different servers** by a shard key. You lose cross-shard joins and transactions.",
        "Shard only after: indexes, caching, read replicas, partitioning, and a bigger machine.",
        "The shard key must appear in almost every query and spread load evenly: `tenant_id` or `user_id`, not `country`.",
      ],
      words: [
        ["partition pruning", "the planner skipping partitions that cannot match the WHERE"],
        ["shard key", "the column that decides which server holds a row"],
        ["hot shard", "a shard receiving far more traffic than the others"],
        ["resharding", "moving data when the number of shards changes"],
        ["consistent hashing", "a way to assign keys to shards so adding one moves few keys"],
      ],
      sections: [
        {
          title: "Partitioning: same server, many pieces",
          analogy: "One drawer per year instead of one giant drawer: find this year's files fast, throw away 2019 in one motion.",
          why: "Partitioning fixes size and retention without changing the application.",
          diagram: "partitioning",
          code: [
            {
              lang: "sql",
              title: "Postgres declarative partitioning by month",
              src: `CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL,
  user_id bigint NOT NULL,
  payload jsonb,
  PRIMARY KEY (id, created_at)          -- the partition key must be part of unique keys
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2025_07 PARTITION OF events FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE events_2025_08 PARTITION OF events FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
-- retention: instant, no VACUUM debt
DROP TABLE events_2024_07;`,
            },
          ],
          bullets: [
            "**Range** (time) is the common case; **list** (region) and **hash** (spread writes) also exist.",
            "Benefits: pruning, cheap retention, smaller indexes per partition, VACUUM per piece.",
            "Costs: unique constraints must include the partition key; too many partitions slow planning; queries without the key touch every partition.",
          ],
        },
        {
          title: "Sharding: different servers",
          analogy: "When one filing cabinet is full, buy more cabinets and decide by surname which cabinet holds which files.",
          why: "Sharding scales writes but you lose joins across cabinets.",
          diagram: "sharding",
          table: {
            head: ["Strategy", "How", "Good", "Bad"],
            rows: [
              ["Hash", "shard = hash(key) % N", "even spread", "range queries hit every shard; resharding moves everything (use virtual shards / consistent hashing)"],
              ["Range", "shard by key ranges (A–M, N–Z; or by date)", "range scans stay local", "hot ranges (today's data), manual rebalancing"],
              ["Directory", "a lookup table maps tenant → shard", "move one tenant at a time, big tenants get their own shard", "the directory is a dependency and a single point to protect"],
            ],
          },
        },
        {
          title: "What you lose when you shard",
          analogy: "Files in different cabinets cannot be stapled together.",
          why: "People shard too early and rediscover these losses the hard way.",
          bullets: [
            "Cross-shard JOINs: gone. Denormalise or join in the app.",
            "Cross-shard transactions: gone. Design so a business transaction lives in one shard (co-locate a tenant's data).",
            "Global unique constraints: gone. Use globally unique ids (UUID v7) and uniqueness within the shard.",
            "Global aggregates: scatter-gather across shards, then merge. Keep summary tables.",
            "Operations: N databases to back up, monitor, upgrade, fail over.",
          ],
        },
        {
          title: "Before you shard",
          analogy: "Tidy the drawer, add dividers, buy a bigger cabinet, then and only then buy a second one.",
          why: "Most systems never need to shard if the earlier steps are done.",
          diagram: "scaleLadder",
          bullets: [
            "1. Indexes and query shapes (Module 4). 2. Caching the hot reads. 3. Read replicas. 4. Partitioning and retention. 5. A bigger machine (vertical scaling goes far: 96 cores, TBs of RAM).",
            "6. Separate by service: move a noisy table (analytics events) to its own database.",
            "7. Then shard the write-heavy table by tenant or user, with a directory so you can move tenants.",
            "Managed options: Citus (Postgres sharding), Vitess (MySQL), CockroachDB/Spanner/Yugabyte (distributed SQL that shards for you).",
          ],
        },
      ],
      realWorld: [
        {
          title: "Orders table at 2 billion rows: what do you do first?",
          problem: "Orders table: 2B rows, 3 TB, growing 5M rows per day. Reports are slow, autovacuum never finishes, and the team wants to shard.",
          whyHard: "Sharding is the dramatic answer and it is the last one you want. Most of the pain here is physical (one giant table, one giant index) and query-shaped, not server capacity.",
          steps: [
            "Measure where time goes. Reports scanning years of data? Point lookups by customer? Most likely both share one bloated heap.",
            "Partition by month on `ordered_at`. Reports with a date range prune to a few partitions; retention becomes `DROP TABLE`; autovacuum works per partition.",
            "Add the right composite indexes per query shape (`customer_id, ordered_at DESC`) — now smaller per partition.",
            "Move reporting to a replica or a columnar store (ClickHouse / BigQuery) fed by CDC, so OLTP and OLAP stop fighting.",
            "Only if write throughput on the primary is the bottleneck: shard by `customer_id` with a directory. Co-locate order_items with orders by the same key.",
          ],
          takeaway: "Partitioning fixes size; replicas fix read load; sharding fixes write load. Diagnose which one you have before reaching for the last.",
        },
      ],
      practice: [
        {
          q: "A SaaS wants to shard. Why is `tenant_id` a better shard key than `country`?",
          answer: "Almost every query already filters by tenant, so each request hits one shard, and tenants are many and small so load spreads. Country gives a few giant hot shards (USA, India) and most queries do not filter by it.",
          explain: "A good shard key is in every query and distributes load evenly.",
        },
        {
          q: "Show order counts per month; which monthly partitions would a query for March 2025 touch if orders were partitioned by month?",
          answer: "6 months listed; a March 2025 query touches only the orders_2025_03 partition.",
          explain: "Partition pruning uses the WHERE on the partition key to skip other partitions.",
          sql: `SELECT strftime('%Y-%m', ordered_at) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month;`,
        },
        {
          q: "What breaks in your schema when you partition a Postgres table, regarding unique constraints?",
          answer: "Every unique constraint and primary key must include the partition key, because uniqueness is enforced per partition. A global unique on `order_number` alone is no longer possible without an external check.",
          explain: "Each partition has its own indexes; Postgres cannot check uniqueness across them.",
        },
      ],
      interview: [
        { level: "mid", q: "What is the difference between partitioning and sharding?", a: "Partitioning splits one table into physical pieces on the same server, usually by time, so queries prune to relevant pieces and old data is dropped instantly. Sharding splits data across separate servers by a shard key to scale writes and storage, at the cost of cross-shard joins and transactions." },
        { level: "mid", q: "How do you choose a shard key?", a: "It must be present in nearly every query so each request hits one shard, spread load evenly to avoid hot shards, and keep data that must be transacted together on the same shard. For SaaS that is usually tenant_id; for consumer apps user_id. I avoid low-cardinality keys like country." },
        { level: "senior", q: "When would you shard, and what would you try first?", a: "Only when a single primary cannot handle the write volume or data size after I have fixed query shapes and indexes, added caching, moved reads to replicas, partitioned big tables, separated noisy tables into their own databases, and scaled the machine up. Sharding removes joins and transactions across shards and multiplies operational work." },
        { level: "senior", q: "How do you reshard without downtime?", a: "Use virtual shards or consistent hashing from the start so adding a node moves a small slice of keys. Migrate a slice by dual-writing to old and new shards, backfilling, verifying checksums, switching reads, then dropping the old copy. A directory mapping tenants to shards makes moving one tenant at a time routine." },
      ],
      remember: [
        "Partition for size and retention; it is one server.",
        "Shard for write throughput; it costs joins and transactions.",
        "Shard key: in every query, evenly spread, co-locates a transaction.",
        "Order: indexes → cache → replicas → partitions → bigger box → separate DBs → shard.",
      ],
    },

    {
      slug: "distributed-consistency",
      title: "Consistency across services: CAP, outbox, sagas, idempotency",
      minutes: 20,
      story: "Two friends planning dinner by text with a bad signal. If messages drop, you either refuse to decide until both agree (consistent, unavailable) or each decides and you fix it later (available, inconsistent). There is no third option while the signal is bad.",
      tldr: [
        "**CAP:** during a network partition you choose consistency (refuse) or availability (serve stale). Without a partition you can have both.",
        "A database transaction cannot include a message queue or another service. Use the **transactional outbox**.",
        "Cross-service workflows use **sagas**: local transactions with compensating actions, not two-phase commit.",
        "Everything is at-least-once. **Idempotency keys** make duplicates harmless.",
      ],
      words: [
        ["network partition", "nodes that cannot talk to each other but are both alive"],
        ["eventual consistency", "copies converge after a while; reads may be stale meanwhile"],
        ["outbox", "a table of events written in the same transaction as the data, published later"],
        ["saga", "a sequence of local transactions with undo steps (compensations)"],
        ["idempotency key", "a unique id per operation so a retry does nothing new"],
        ["CDC", "change data capture: streaming the database's own log of changes"],
      ],
      sections: [
        {
          title: "CAP and PACELC without the mysticism",
          analogy: "Two friends planning dinner by text with bad signal: wait until both agree, or each decide and fix it later.",
          why: "Every distributed design is one of these two choices during a partition.",
          diagram: "cap",
          bullets: [
            "Partitions happen (cables, cloud AZs, GC pauses). The question is what each side does meanwhile.",
            "CP examples: a single Postgres primary with sync replicas, ZooKeeper/etcd, Spanner. AP examples: Cassandra, DynamoDB default reads, DNS.",
            "'Eventually consistent' is a promise about convergence, not a licence for wrong answers: design reads to tolerate staleness or route them to the leader.",
          ],
        },
        {
          title: "The dual-write problem and the outbox",
          analogy: "Writing the sale in the ledger and shouting it to the warehouse: if you shout first and the pen fails, the warehouse ships a phantom order.",
          why: "Lost and phantom events come from writing to two places separately.",
          diagram: "outbox",
          code: [
            {
              lang: "ts",
              title: "Write data and event atomically; publish later",
              src: `await withTx(pool, async (c) => {
  const { rows: [order] } = await c.query("INSERT INTO orders (...) VALUES (...) RETURNING *");
  await c.query(
    "INSERT INTO outbox (id, topic, payload) VALUES ($1, 'order.created', $2)",
    [crypto.randomUUID(), JSON.stringify(order)],
  );
});
// relay (separate process): SELECT ... FROM outbox WHERE published_at IS NULL ORDER BY created_at
// FOR UPDATE SKIP LOCKED LIMIT 100 → publish to Kafka/SQS → UPDATE outbox SET published_at = now()
// Or Debezium/CDC reads the WAL and publishes outbox rows with no polling.`,
            },
          ],
          warn: "Publishing to Kafka inside the transaction and committing after is the dual-write bug: publish ok + commit fails = phantom event; commit ok + publish fails = lost event.",
        },
        {
          title: "Sagas vs two-phase commit",
          analogy: "A group trip booked step by step with cancellation policies, versus everyone holding their card until all five hotels confirm.",
          why: "Cross-service workflows need compensation, not global locks.",
          diagram: "saga",
          table: {
            head: ["", "2PC (XA)", "Saga"],
            rows: [
              ["Atomicity", "true, across resources", "eventual: each step commits; failures run compensations"],
              ["Locks", "held across all participants until the coordinator decides", "only within each local step"],
              ["Failure of coordinator", "participants block", "saga state in a table; a worker resumes"],
              ["Fits", "two databases you control, rare", "microservices, external APIs"],
              ["Needs", "XA-capable drivers", "idempotent steps, designed compensations (refund, release stock)"],
            ],
          },
          bullets: [
            "**Choreography:** each service reacts to events (simple, hard to see the whole flow). **Orchestration:** one coordinator (Temporal, a state table) drives steps and compensations.",
            "Compensation is a new action, not an undo: you cannot un-send an email; you send a correction.",
          ],
        },
        {
          title: "Idempotency everywhere",
          analogy: "A lift button: pressing it five times calls one lift.",
          why: "Retries happen; without idempotency they double-charge.",
          diagram: "idempotency",
          code: [
            {
              lang: "sql",
              title: "Consumer-side dedupe",
              src: `CREATE TABLE processed_events (event_id uuid PRIMARY KEY, processed_at timestamptz DEFAULT now());

-- in the consumer, inside ONE transaction with the business write:
INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- if 0 rows inserted → already processed → skip the business write
UPDATE inventory SET reserved = reserved + $2 WHERE sku = $3;`,
            },
          ],
          bullets: [
            "HTTP: clients send `Idempotency-Key`; the server stores key → response and replays it on retry.",
            "Queues: at-least-once delivery means every consumer dedupes by event id, in the same transaction as its effect.",
            "Payments: the provider's idempotency key is your order id. Retry freely.",
          ],
        },
      ],
      realWorld: [
        {
          title: "Order placed, card charged, confirmation email never sent",
          problem: "Checkout writes the order and then publishes 'order.created' to the queue for the email service. Some customers never get the email; a few get it twice. Both services 'work'.",
          whyHard: "Each failure happens in the gap between two systems: the publish failed after commit (lost), or the publish succeeded but the commit failed (phantom), or the consumer crashed after sending but before acking (duplicate). Logs on each side look fine.",
          steps: [
            "Replace the publish-after-commit with an **outbox row** written in the same transaction as the order.",
            "A relay (or Debezium CDC) publishes outbox rows and marks them published. Lost events are impossible: the row exists iff the order exists.",
            "The email consumer records `processed_events(event_id)` in the same transaction as 'email sent' bookkeeping; a redelivered event is skipped. Duplicates are impossible.",
            "Monitor the outbox backlog (unpublished rows older than 1 minute) as the health signal of the whole pipeline.",
          ],
          sql: `-- Outbox on the playground: write order + event atomically
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY, topic TEXT NOT NULL, payload TEXT NOT NULL, published_at DATETIME);
BEGIN;
INSERT INTO orders (customer_id, ordered_at, status) VALUES (3, '2025-07-01 09:00:00', 'paid');
INSERT INTO outbox (topic, payload) VALUES ('order.created', json_object('order_id', last_insert_rowid(), 'customer_id', 3));
COMMIT;
SELECT * FROM outbox WHERE published_at IS NULL;`,
          takeaway: "Never dual-write. Write the event where you write the data, publish from there, and dedupe on the consuming side.",
        },
      ],
      practice: [
        {
          q: "Your service writes to Postgres and then calls another service's REST API. The API call sometimes times out although it succeeded. What do you add?",
          answer: "An idempotency key on the call (e.g. the local row id) so a retry is safe, retries with backoff, and a reconciliation path for 'unknown' outcomes.",
          explain: "Timeouts are ambiguous; only idempotency makes retrying correct.",
        },
        {
          q: "Simulate consumer-side dedupe: create processed_events, insert event 'evt-1' twice with ON CONFLICT DO NOTHING, and count rows.",
          answer: "1 row.",
          explain: "The primary key plus ON CONFLICT DO NOTHING makes the second insert a no-op; the business write should be skipped when 0 rows were inserted.",
          sql: `CREATE TABLE IF NOT EXISTS processed_events (event_id TEXT PRIMARY KEY);
INSERT INTO processed_events (event_id) VALUES ('evt-1') ON CONFLICT DO NOTHING;
INSERT INTO processed_events (event_id) VALUES ('evt-1') ON CONFLICT DO NOTHING;
SELECT COUNT(*) AS rows_stored FROM processed_events;`,
          starter: `CREATE TABLE IF NOT EXISTS processed_events (event_id TEXT PRIMARY KEY);\nINSERT INTO processed_events (event_id) VALUES ('evt-1') ...;\nINSERT INTO processed_events (event_id) VALUES ('evt-1') ...;\nSELECT COUNT(*) AS rows_stored FROM processed_events;`,
        },
        {
          q: "In a saga for 'book flight → book hotel → charge card', the card charge fails. What happens?",
          answer: "Compensations run in reverse: cancel the hotel booking, cancel the flight booking. Each compensation is itself an idempotent local transaction, and the saga's state is persisted so a crashed orchestrator can resume.",
          explain: "Sagas replace a global rollback with explicit undo actions.",
        },
      ],
      interview: [
        { level: "mid", q: "Explain the CAP theorem in practical terms.", a: "When the network partitions, a distributed system must choose: refuse requests it cannot confirm, staying consistent but unavailable, or answer from possibly stale local data, staying available but inconsistent. Without a partition you get both. Databases like Postgres with sync replicas lean CP; Cassandra and DynamoDB lean AP by default." },
        { level: "mid", q: "What is the dual-write problem and how does the outbox pattern solve it?", a: "Writing to a database and separately to a queue cannot be atomic, so a crash between them loses or fabricates an event. The outbox writes the event into a table in the same transaction as the data, and a relay or CDC publishes it afterwards. Consumers dedupe because delivery becomes at-least-once." },
        { level: "senior", q: "Two-phase commit or sagas for a cross-service order flow?", a: "Sagas. 2PC holds locks on every participant until the coordinator decides and blocks everyone if it dies, which is unacceptable across services and external APIs. A saga runs local transactions with compensating actions, persists its state, and needs idempotent steps. I use orchestration with a state table or a workflow engine so the flow is visible." },
        { level: "senior", q: "How do you achieve exactly-once processing?", a: "You do not; delivery is at-least-once everywhere. I achieve exactly-once effects: every message has a unique id, the consumer records the id in a dedupe table inside the same transaction as its business write, and external calls carry idempotency keys. A duplicate then produces no new effect." },
      ],
      remember: [
        "Partition → choose C or A. No partition → both.",
        "Data + event in one transaction (outbox); publish later; dedupe on consume.",
        "Sagas with compensations, not 2PC, across services.",
        "At-least-once + idempotency key = exactly-once effect.",
      ],
    },

    {
      slug: "sql-vs-nosql",
      title: "SQL vs NoSQL: MongoDB, Redis and when each wins",
      minutes: 18,
      story: "A toolbox. A relational database is the adjustable spanner that fits most bolts. MongoDB is a power drill: wonderful for one job, awkward as a hammer. Redis is the magnet that grabs screws instantly but cannot hold your whole toolbox.",
      tldr: [
        "Relational: joins, constraints, transactions across tables. **Default choice.**",
        "Document (MongoDB): store what you read together, together. Great for variable shapes; duplication is your problem.",
        "Key-value (Redis): microsecond reads by key, data structures, TTLs. Cache, sessions, counters, queues, locks.",
        "Postgres JSONB covers most 'we need flexible fields' cases without a second database.",
      ],
      words: [
        ["document", "a JSON-like record with nested fields and arrays"],
        ["embedding", "storing related data inside the document instead of in another collection"],
        ["aggregation pipeline", "MongoDB's way to group, join ($lookup) and transform"],
        ["TTL", "time to live: the key expires automatically"],
        ["columnar store", "stores each column separately; fast for analytics over many rows"],
      ],
      sections: [
        {
          title: "Three shapes of the same order",
          analogy: "The same order as a filing cabinet (rows), a folder with everything inside (document), or a sticky note (key-value).",
          why: "Choosing the shape decides which questions are cheap to ask.",
          diagram: "sqlVsNosql",
        },
        {
          title: "MongoDB: embed or reference?",
          analogy: "A folder with the receipt inside (embed) versus a note saying 'see customer file 7' (reference).",
          why: "Embedding unbounded lists hits the document size limit; referencing everything turns Mongo into a slow relational database.",
          diagram: "embedVsReference",
          code: [
            {
              lang: "json",
              title: "Embedded: one read gets the order",
              src: `{
  "_id": 1,
  "customer": { "id": 7, "name": "Rahul Verma" },
  "items": [ { "sku": "KB-1", "name": "Mechanical Keyboard", "qty": 1, "unitPrice": 89 } ],
  "status": "paid",
  "createdAt": "2025-02-10T16:30:00Z"
}`,
            },
          ],
          table: {
            head: ["Embed when", "Reference when"],
            rows: [
              ["the child is read with the parent every time (order items)", "the child is shared by many parents (product catalogue)"],
              ["the child list is bounded (a few dozen)", "the list is unbounded (comments on a viral post) — 16 MB document limit"],
              ["the child does not change independently", "the child changes often and must stay in sync everywhere"],
            ],
          },
          bullets: [
            "Model around **access patterns**, not entities. Ask 'what does the screen need in one read?'",
            "Indexes work like SQL's: `db.orders.createIndex({ 'customer.id': 1, createdAt: -1 })`. Missing indexes hurt the same way.",
            "Multi-document transactions exist (4.0+) but are slower and cross-shard ones are costly. If you need them constantly, you wanted a relational database.",
            "Schema validation (`$jsonSchema`) exists; use it. 'Schemaless' means 'the schema is in your code', not that there is none.",
          ],
        },
        {
          title: "Redis: data structures with a network",
          analogy: "A very fast whiteboard with lists, counters and timers, wiped if the power goes.",
          why: "Counters, sessions and locks belong here, not in Postgres.",
          table: {
            head: ["Structure", "Commands", "Use"],
            rows: [
              ["String", "GET/SET/INCR/EX", "cache, counters, rate limits, feature flags"],
              ["Hash", "HSET/HGETALL", "an object's fields (session, user profile cache)"],
              ["List", "LPUSH/BRPOP", "simple queues"],
              ["Set / Sorted set", "SADD/SISMEMBER, ZADD/ZRANGE", "unique visitors, leaderboards, delayed jobs by score"],
              ["Stream", "XADD/XREADGROUP", "durable log with consumer groups (Kafka-lite)"],
              ["SET NX PX", "lock", "distributed lock (use Redlock or a single node carefully)"],
            ],
          },
          bullets: [
            "Single-threaded command execution: atomic operations like INCR and Lua scripts without locks.",
            "Persistence is optional (RDB snapshots, AOF). Treat Redis as a cache unless you configured it as a store and know the durability trade-off.",
            "Memory is the limit. Set `maxmemory` and an eviction policy; put TTLs on cache keys.",
          ],
        },
        {
          title: "The rest of the toolbox",
          analogy: "Specialist tools: a search engine for finding words, a warehouse for crunching years of data.",
          why: "Each extra store is another thing to keep in sync and back up.",
          table: {
            head: ["Need", "Tool", "Why not Postgres alone"],
            rows: [
              ["Full-text search with ranking, fuzziness, facets", "Elasticsearch / OpenSearch / Meilisearch", "pg full-text is fine until relevance tuning and facets matter"],
              ["Analytics over billions of rows", "ClickHouse, BigQuery, Snowflake", "columnar storage and vectorised scans; feed via CDC"],
              ["Huge write throughput, simple reads", "Cassandra / ScyllaDB / DynamoDB", "leaderless or partition-native scaling"],
              ["Deep graph traversal", "Neo4j", "recursive CTEs get slow at many hops"],
              ["Metrics / IoT", "TimescaleDB (still Postgres!), InfluxDB", "compression and time-bucket functions"],
              ["Vectors for AI search", "pgvector first; Pinecone/Qdrant at scale", "pgvector is good to millions of vectors"],
            ],
          },
          tip: "Postgres with JSONB, full-text search, pgvector and partitioning stretches surprisingly far. One database with one backup story beats four stores with four failure modes.",
        },
        {
          title: "JSONB in Postgres: the middle path",
          analogy: "A 'notes' pocket on each file that you can still search.",
          why: "Often removes the need for a second database.",
          visual: {"kind": "flow", "steps": [{"label": "ALTER TABLE … ADD attrs jsonb", "sub": "flexible extras", "tone": "accent"}, {"label": "GIN index on attrs", "sub": "containment @> uses it", "tone": "ok"}, {"label": "WHERE attrs @> '{\"wireless\": true}'", "sub": "indexed JSON query", "tone": "ok"}, {"label": "field used daily in WHERE?", "sub": "promote it to a real column", "tone": "warn"}]},
          code: [
            {
              lang: "sql",
              src: `ALTER TABLE products ADD COLUMN attrs jsonb NOT NULL DEFAULT '{}';
UPDATE products SET attrs = '{"colour":"black","wireless":true}' WHERE id = 1;
CREATE INDEX products_attrs ON products USING gin (attrs);
SELECT name FROM products WHERE attrs @> '{"wireless": true}';     -- uses the GIN index
SELECT name, attrs->>'colour' AS colour FROM products WHERE attrs ? 'colour';`,
            },
          ],
        },
      ],
      realWorld: [
        {
          title: "Pick the store: chat app, shopping cart, analytics dashboard",
          problem: "A startup is building a chat app with user profiles, a shopping cart that must survive a refresh, and an analytics dashboard over 500M events. The CTO asks for one answer: 'SQL or NoSQL?'",
          whyHard: "The question assumes one store. Each workload has a different shape, and the right answer is per workload with one source of truth.",
          steps: [
            "**Users, rooms, memberships, billing:** relational (Postgres). Relationships, uniqueness, transactions.",
            "**Messages:** append-heavy, read by room and time, never joined across rooms. Postgres partitioned by month works to billions; beyond that Cassandra/Scylla keyed by (room_id, time). Start with Postgres.",
            "**Cart:** small, per user, must be fast, can expire. Redis hash `cart:{userId}` with a TTL, written through to Postgres on checkout.",
            "**Presence / typing indicators:** Redis with short TTLs; losing them is fine.",
            "**Analytics:** stream events via the outbox/CDC into ClickHouse or BigQuery; never run dashboards on the OLTP primary.",
          ],
          takeaway: "Answer per workload: relational for the truth, Redis for ephemeral speed, a columnar store for analytics, and specialised stores only when a measured need appears.",
        },
      ],
      practice: [
        {
          q: "Blog posts with unbounded comments: embed comments in the post document or reference them?",
          answer: "Reference (separate collection keyed by post_id, indexed on (post_id, createdAt)). Embedding breaks on the 16 MB limit and makes every post read heavier as comments grow.",
          explain: "Unbounded, independently growing children are referenced; bounded, always-read-together children are embedded.",
        },
        {
          q: "Implement a per-user rate limit of 100 requests per minute. Which store and which commands?",
          answer: "Redis: `INCR rate:{user}:{minute}` then `EXPIRE` it to 60 s on first hit (or a Lua script / sliding window with a sorted set). Reject when the count exceeds 100.",
          explain: "Atomic increments with TTL are exactly what Redis is built for; a relational row would need a lock per request.",
        },
        {
          q: "Which SQL feature lets you store per-product flexible attributes without a document database, and how do you index them?",
          answer: "A JSONB column with a GIN index; query with the containment operator @>.",
          explain: "JSONB gives schemaless fields inside a relational row, with indexing.",
        },
      ],
      interview: [
        { level: "junior", q: "What is the difference between SQL and NoSQL databases?", a: "SQL databases store rows in tables with a fixed schema, support joins, constraints and multi-table transactions, and are queried with SQL. NoSQL is a family: document stores like MongoDB keep nested JSON, key-value stores like Redis map keys to values with very fast access, and wide-column and graph stores fit other shapes. They trade some guarantees for flexibility or scale." },
        { level: "mid", q: "When would you choose MongoDB over Postgres?", a: "When the data is naturally a document read and written as a whole, like a product listing with variable attributes, the shape varies per record, and I rarely need joins or cross-document transactions. If I find myself doing $lookup everywhere or needing transactions across collections, Postgres with JSONB would have been the better choice." },
        { level: "mid", q: "What do you use Redis for?", a: "Caching query results and rendered fragments with TTLs, sessions, rate-limit counters with INCR, leaderboards with sorted sets, simple queues and pub/sub, and short-lived locks. I treat it as ephemeral unless I have deliberately configured persistence and accepted its durability limits." },
        { level: "senior", q: "Design the data layer for an app with chat, carts and analytics.", a: "Postgres as the source of truth for users, rooms and orders; messages in Postgres partitioned by time until volume forces a wide-column store; carts and presence in Redis with TTLs, written through to Postgres at checkout; events streamed via an outbox and CDC into a columnar warehouse for dashboards. One truth store, derived stores for speed and analytics." },
      ],
      remember: [
        "Relational for truth and relationships; it is the default.",
        "Document: model around reads; embed bounded, reference unbounded.",
        "Redis: ephemeral speed, atomic counters, TTLs, locks.",
        "JSONB + GIN before adding a second database.",
      ],
    },
  ],
};
