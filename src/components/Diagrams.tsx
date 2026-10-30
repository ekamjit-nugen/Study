import type { JSX } from "react";
import type { DiagramId } from "../courses/types";
import { Arrow, Box, MiniTable, Svg, T } from "./svg";
import { BTreeDemo, IsolationSim, JoinsDemo, ScanVsIndexDemo } from "./Interactive";
import { MAP2 } from "./Diagrams2";

function WhyDb() {
  return (
    <Svg w={760} h={250} caption="A database is a file manager with promises: many writers, all-or-nothing writes, fast lookups and rules.">
      <Box x={20} y={20} w={340} h={210} cls="d-bad" />
      <T x={40} y={48} bold>A spreadsheet or a JSON file</T>
      {["Two people save at once → one person's change is lost", "Crash halfway through a save → half the data is gone", "1,000,000 rows → every search reads everything", "Nothing stops 'abc' in the price column"].map((s, i) => (
        <T key={i} x={40} y={80 + i * 34} cls="d-small">✗ {s}</T>
      ))}
      <Box x={400} y={20} w={340} h={210} cls="d-ok" />
      <T x={420} y={48} bold>A database</T>
      {["Concurrency control: many writers, nothing lost", "Transactions: all of a change or none of it", "Indexes: find one row in 3 or 4 page reads", "Constraints: the price must be a number ≥ 0"].map((s, i) => (
        <T key={i} x={420} y={80 + i * 34} cls="d-small">✓ {s}</T>
      ))}
    </Svg>
  );
}

function ClientServer() {
  return (
    <Svg w={760} h={200} caption="Your query travels through a driver and a connection, then the server parses, plans and executes it against pages cached in RAM.">
      <Box x={10} y={60} w={120} h={70} label="Your app" sub="Node / Nest" cls="d-accent" />
      <Arrow x1={130} y1={95} x2={170} y2={95} label="TCP" />
      <Box x={170} y={60} w={120} h={70} label="Driver + pool" sub="pg, mysql2, prisma" />
      <Arrow x1={290} y1={95} x2={330} y2={95} label="SQL text" />
      <Box x={330} y={20} w={200} h={150} cls="d-box" />
      <T x={430} y={42} anchor="middle" bold>DB server</T>
      <Box x={345} y={55} w={170} h={30} label="Parser → Planner" />
      <Box x={345} y={95} w={170} h={30} label="Executor" />
      <Box x={345} y={135} w={170} h={30} label="Buffer pool (RAM)" cls="d-ok" />
      <Arrow x1={530} y1={95} x2={570} y2={95} label="pages" />
      <Box x={570} y={60} w={170} h={70} label="Disk" sub="data files + WAL" cls="d-warn" />
    </Svg>
  );
}

function TableAnatomy() {
  return (
    <Svg w={760} h={240} caption="A row is one thing. A column is one fact about it. The primary key names the row; a foreign key points at a row in another table.">
      <MiniTable x={20} y={20} title="customers" head={["id (PK)", "name", "city"]} rows={[[1, "Aarav", "Mumbai"], [2, "Priya", "Kochi"], [3, "Liam", null]]} colW={[70, 80, 80]} hl={(r, c) => (c === 0 ? "d-accent" : r === 2 && c === 2 ? "d-warn" : undefined)} />
      <MiniTable x={330} y={20} title="orders" head={["id (PK)", "customer_id (FK)", "status"]} rows={[[1, 1, "paid"], [2, 2, "shipped"], [3, 1, "paid"]]} colW={[70, 130, 80]} hl={(_r, c) => (c === 0 ? "d-accent" : c === 1 ? "d-ok" : undefined)} />
      <Arrow x1={400} y1={78} x2={255} y2={78} cls="d-line" marker="arrm" dash />
      <T x={20} y={150} cls="d-small">PK = unique, never NULL, never changes. It is what other tables point at.</T>
      <T x={20} y={170} cls="d-small">FK = "this value must exist as a PK over there". The DB refuses an order for customer 99 if no such customer exists.</T>
      <T x={20} y={190} cls="d-small">NULL = "unknown / not given". It is not 0 and not an empty string. NULL = NULL is not true, it is unknown.</T>
      <T x={20} y={210} cls="d-small">Column types are rules: INTEGER, TEXT, DATE, DECIMAL. Use DECIMAL (NUMERIC) for money, never FLOAT.</T>
    </Svg>
  );
}

function Relationships() {
  return (
    <Svg w={760} h={230} caption="Three shapes cover almost every schema. Many-to-many always needs a third table.">
      <T x={20} y={25} bold>1 : 1</T>
      <Box x={20} y={40} w={100} h={40} label="user" />
      <Box x={160} y={40} w={100} h={40} label="profile" />
      <line x1={120} y1={60} x2={160} y2={60} className="d-line" />
      <T x={20} y={110} cls="d-small">One user has one profile.</T>
      <T x={20} y={126} cls="d-small">Often just one table; split for</T>
      <T x={20} y={142} cls="d-small">optional or private columns.</T>

      <T x={290} y={25} bold>1 : N</T>
      <Box x={290} y={40} w={100} h={40} label="customer" />
      <Box x={430} y={30} w={100} h={28} label="order" />
      <Box x={430} y={64} w={100} h={28} label="order" />
      <line x1={390} y1={60} x2={430} y2={44} className="d-line" />
      <line x1={390} y1={60} x2={430} y2={78} className="d-line" />
      <T x={290} y={110} cls="d-small">The N side holds the FK:</T>
      <T x={290} y={126} cls="d-small">orders.customer_id.</T>
      <T x={290} y={142} cls="d-small">The "one" side stores nothing.</T>

      <T x={560} y={25} bold>M : N</T>
      <Box x={560} y={40} w={80} h={40} label="product" />
      <Box x={650} y={40} w={100} h={40} label="product_tags" cls="d-accent" />
      <Box x={560} y={100} w={80} h={40} label="tag" />
      <line x1={640} y1={60} x2={650} y2={60} className="d-line" />
      <line x1={640} y1={120} x2={700} y2={80} className="d-line" />
      <T x={560} y={170} cls="d-small">Join table with two FKs,</T>
      <T x={560} y={186} cls="d-small">PK (product_id, tag_id).</T>
      <T x={560} y={202} cls="d-small">Extra columns live here too.</T>
    </Svg>
  );
}

function Erd() {
  return (
    <Svg w={760} h={330} caption="The playground schema. Arrows point from the foreign key to the primary key it references.">
      <Box x={20} y={20} w={150} h={90} lines={["customers", "id PK", "name, email", "city, country"]} mono />
      <Box x={230} y={20} w={150} h={90} lines={["orders", "id PK", "customer_id FK", "ordered_at, status"]} mono />
      <Box x={440} y={20} w={160} h={90} lines={["order_items", "id PK", "order_id FK", "product_id FK, qty"]} mono />
      <Box x={440} y={150} w={160} h={74} lines={["products", "id PK", "name, category", "price, stock"]} mono />
      <Box x={230} y={150} w={150} h={74} lines={["payments", "id PK", "order_id FK", "amount, paid_at"]} mono />
      <Box x={620} y={150} w={130} h={74} lines={["product_tags", "product_id FK", "tag", "PK (both)"]} mono />
      <Box x={20} y={150} w={150} h={90} lines={["employees", "id PK", "manager_id FK → self", "dept, salary"]} mono />
      <Box x={20} y={260} w={720} h={50} lines={["also: logins(user_id, day) · bookings(room_id, starts_at, ends_at) · accounts(owner, balance, version)"]} mono />
      <Arrow x1={230} y1={55} x2={170} y2={55} cls="d-line" marker="arrm" />
      <Arrow x1={440} y1={55} x2={380} y2={55} cls="d-line" marker="arrm" />
      <Arrow x1={520} y1={110} x2={520} y2={150} cls="d-line" marker="arrm" />
      <Arrow x1={305} y1={150} x2={305} y2={110} cls="d-line" marker="arrm" />
      <Arrow x1={620} y1={187} x2={600} y2={187} cls="d-line" marker="arrm" />
      <path d="M 95 240 C 60 260, 10 230, 20 195" className="d-line" markerEnd="url(#arrm)" />
    </Svg>
  );
}

function GroupBy() {
  return (
    <Svg w={760} h={230} caption="GROUP BY folds many rows into one row per bucket. After folding, only the bucket key and aggregates exist, which is why SELECT name fails.">
      <MiniTable x={20} y={10} title="order_items" head={["product", "qty"]} rows={[["Lamp", 2], ["Mat", 2], ["Lamp", 1], ["Mat", 1], ["Lamp", 3]]} colW={[70, 50]} hl={(r) => (["Lamp", "Mat", "Lamp", "Mat", "Lamp"][r] === "Lamp" ? "d-accent" : "d-ok")} />
      <Arrow x1={160} y1={90} x2={230} y2={90} label="GROUP BY product" />
      <Box x={240} y={30} w={170} h={50} cls="d-accent" lines={["Lamp bucket", "qty: 2, 1, 3"]} mono />
      <Box x={240} y={110} w={170} h={50} cls="d-ok" lines={["Mat bucket", "qty: 2, 1"]} mono />
      <Arrow x1={420} y1={90} x2={490} y2={90} label="SUM(qty)" />
      <MiniTable x={500} y={10} title="result" head={["product", "total"]} rows={[["Lamp", 6], ["Mat", 3]]} colW={[80, 60]} />
      <T x={500} y={120} cls="d-small">WHERE filters rows before folding.</T>
      <T x={500} y={138} cls="d-small">HAVING filters buckets after folding.</T>
      <T x={500} y={156} cls="d-small">COUNT(*) counts rows, COUNT(col)</T>
      <T x={500} y={174} cls="d-small">skips NULLs in that column.</T>
    </Svg>
  );
}

function WindowFrame() {
  const rows = [["Jan", 100, 100], ["Feb", 50, 150], ["Mar", 80, 230], ["Apr", 20, 250]];
  return (
    <Svg w={760} h={210} caption="A window function looks at other rows but keeps every row. The frame is the slice of neighbours each row can see.">
      <MiniTable x={20} y={10} title="sales ORDER BY month" head={["month", "amount"]} rows={rows.map((r) => [r[0], r[1]])} colW={[70, 70]} hl={(r) => (r <= 2 ? "d-accent" : undefined)} />
      <path d="M 170 48 L 185 48 L 185 108 L 170 108" className="d-arrow" />
      <T x={195} y={82} cls="d-small">frame for Mar: UNBOUNDED PRECEDING → CURRENT ROW</T>
      <Arrow x1={200} y1={120} x2={420} y2={120} label="SUM(amount) OVER (ORDER BY month)" />
      <MiniTable x={430} y={10} title="result (same 4 rows)" head={["month", "amount", "running"]} rows={rows} colW={[70, 70, 80]} hl={(r, c) => (c === 2 && r === 2 ? "d-accent" : undefined)} />
      <T x={20} y={150} cls="d-small">GROUP BY → fewer rows. OVER () → same rows, with a new column computed from a window.</T>
      <T x={20} y={168} cls="d-small">PARTITION BY restarts the window per group (per customer, per department). ORDER BY inside OVER sets the frame order.</T>
      <T x={20} y={186} cls="d-small">ROW_NUMBER, RANK, LAG, LEAD, SUM/AVG OVER: all read neighbours without a self-join.</T>
    </Svg>
  );
}

function Normalization() {
  return (
    <Svg w={760} h={300} caption="Normalisation = one fact in one place. Change a customer's city once, not in every order row.">
      <MiniTable x={10} y={10} title="orders_flat (messy)" head={["order", "customer", "city", "product", "price"]} rows={[[1, "Aarav", "Mumbai", "Lamp", 45], [2, "Aarav", "Mumbai", "Mat", 25], [3, "Priya", "Kochi", "Lamp", 45]]} colW={[55, 75, 75, 65, 55]} hl={(r, c) => ((c === 1 || c === 2) && r < 2 ? "d-bad" : c === 4 && r !== 1 ? "d-warn" : undefined)} />
      <T x={10} y={120} cls="d-small">Red: Aarav's city repeated → update it in one row and forget the other = inconsistent.</T>
      <T x={10} y={136} cls="d-small">Orange: Lamp price repeated → which price is true after a change?</T>
      <Arrow x1={200} y1={160} x2={200} y2={185} label="split by 'what depends on what'" />
      <MiniTable x={10} y={195} title="customers" head={["id", "name", "city"]} rows={[[1, "Aarav", "Mumbai"], [2, "Priya", "Kochi"]]} colW={[40, 70, 70]} />
      <MiniTable x={230} y={195} title="products" head={["id", "name", "price"]} rows={[[1, "Lamp", 45], [2, "Mat", 25]]} colW={[40, 70, 60]} />
      <MiniTable x={430} y={195} title="orders" head={["id", "customer_id", "product_id"]} rows={[[1, 1, 1], [2, 1, 2], [3, 2, 1]]} colW={[40, 95, 90]} />
    </Svg>
  );
}

function CompositeIndex() {
  return (
    <Svg w={760} h={210} caption="An index on (last_name, first_name) is a phone book: sorted by last name, then first. It cannot find 'all people called Priya' quickly, because first names are scattered.">
      <Box x={20} y={20} w={330} h={160} cls="d-box" />
      <T x={40} y={45} bold>INDEX (last_name, first_name)</T>
      {[["Khan", "Zara"], ["Mehta", "Aarav"], ["Mehta", "Priya"], ["Nair", "Priya"], ["Verma", "Rahul"]].map((r, i) => (
        <T key={i} x={40} y={70 + i * 22} cls="d-mono">{r[0].padEnd(8)} {r[1]}</T>
      ))}
      <Box x={380} y={20} w={360} h={160} cls="d-box" />
      <T x={400} y={45} bold>Can the index help?</T>
      {[["WHERE last_name = 'Mehta'", "✓ leftmost prefix"], ["WHERE last_name='Mehta' AND first_name='Priya'", "✓ both columns"], ["WHERE first_name = 'Priya'", "✗ skips the first column"], ["ORDER BY last_name, first_name", "✓ already sorted"], ["WHERE LOWER(last_name) = 'mehta'", "✗ function hides the column"]].map((r, i) => (
        <g key={i}>
          <T x={400} y={70 + i * 22} cls="d-mono">{r[0]}</T>
          <T x={732} y={70 + i * 22} cls="d-small" anchor="end">{r[1]}</T>
        </g>
      ))}
    </Svg>
  );
}

function QueryPipeline() {
  return (
    <Svg w={760} h={210} caption="You say WHAT you want. The planner decides HOW, by estimating the cost of each candidate plan from table statistics.">
      <Box x={10} y={70} w={110} h={60} label="SQL text" sub="SELECT ..." cls="d-accent" />
      <Arrow x1={120} y1={100} x2={160} y2={100} />
      <Box x={160} y={70} w={110} h={60} label="Parser" sub="syntax tree" />
      <Arrow x1={270} y1={100} x2={310} y2={100} />
      <Box x={310} y={20} w={170} h={160} cls="d-box" />
      <T x={395} y={42} anchor="middle" bold>Planner / optimiser</T>
      <Box x={320} y={55} w={150} h={30} label="seq scan: cost 1200" cls="d-bad" />
      <Box x={320} y={95} w={150} h={30} label="index seek: cost 8" cls="d-ok" />
      <Box x={320} y={135} w={150} h={30} label="hash join vs nested loop" />
      <Arrow x1={480} y1={100} x2={520} y2={100} label="cheapest" />
      <Box x={520} y={70} w={110} h={60} label="Executor" sub="runs the plan" />
      <Arrow x1={630} y1={100} x2={670} y2={100} />
      <Box x={670} y={70} w={80} h={60} label="rows" cls="d-accent" />
      <T x={10} y={195} cls="d-small">Statistics (row counts, value distribution) come from ANALYZE. Stale stats → bad plans. EXPLAIN shows the chosen plan.</T>
    </Svg>
  );
}

function Acid() {
  return (
    <Svg w={760} h={250} caption="Transfer ₹100 from A to B. Two statements must behave as one.">
      <Box x={20} y={20} w={200} h={120} cls="d-accent" lines={["BEGIN;", "UPDATE accounts SET balance", "  = balance - 100 WHERE id=1;", "UPDATE accounts SET balance", "  = balance + 100 WHERE id=2;", "COMMIT;"]} mono />
      {[
        ["A — Atomic", "Both updates happen, or neither. A crash after the first update rolls it back."],
        ["C — Consistent", "Rules hold before and after: balance ≥ 0, total money unchanged."],
        ["I — Isolated", "Another transaction never sees A debited but B not yet credited."],
        ["D — Durable", "After COMMIT returns, a power cut cannot lose it (WAL is fsynced first)."],
      ].map((r, i) => (
        <g key={i}>
          <Box x={250} y={20 + i * 52} w={130} h={42} label={r[0]} cls="d-ok" />
          <T x={395} y={46 + i * 52} cls="d-small">{r[1]}</T>
        </g>
      ))}
      <T x={20} y={170} cls="d-small">Without a transaction: step 1 commits, the server crashes, ₹100 vanished.</T>
      <T x={20} y={190} cls="d-small">With a transaction: the DB writes "undo" information first, so it can roll back.</T>
      <T x={20} y={210} cls="d-small">Consistency is YOUR rules (constraints + app logic); the DB guarantees A, I and D.</T>
    </Svg>
  );
}

function Locks() {
  return (
    <Svg w={760} h={230} caption="A deadlock is a cycle: each transaction waits for a lock the other holds. The DB detects it and kills one; the app must retry.">
      <Box x={40} y={40} w={140} h={60} label="T1" sub="holds lock on A" cls="d-accent" />
      <Box x={580} y={40} w={140} h={60} label="T2" sub="holds lock on B" cls="d-accent" />
      <Box x={310} y={40} w={60} h={60} label="A" cls="d-warn" />
      <Box x={390} y={40} w={60} h={60} label="B" cls="d-warn" />
      <Arrow x1={180} y1={60} x2={310} y2={60} label="locked" cls="d-line" marker="arrm" />
      <Arrow x1={580} y1={60} x2={450} y2={60} label="locked" cls="d-line" marker="arrm" />
      <Arrow x1={180} y1={85} x2={390} y2={85} label="T1 wants B → waits" cls="d-arrow" marker="arrb" dash />
      <Arrow x1={580} y1={85} x2={370} y2={85} label="T2 wants A → waits" cls="d-arrow" marker="arrb" dash />
      <T x={40} y={140} bold>Lock types</T>
      <T x={40} y={160} cls="d-small">Shared (read): many readers at once. Exclusive (write): one writer, blocks other writers (and readers without MVCC).</T>
      <T x={40} y={180} cls="d-small">Row lock: UPDATE / SELECT … FOR UPDATE. Table lock: ALTER TABLE, some DDL. Gap lock (MySQL): protects a range from inserts.</T>
      <T x={40} y={200} cls="d-small">Avoid deadlocks: lock rows in the same order everywhere (e.g. lower id first), keep transactions short, retry on error 40P01 / 1213.</T>
    </Svg>
  );
}

function Mvcc() {
  return (
    <Svg w={760} h={220} caption="MVCC: writers make a new version; readers keep seeing the old one. Readers never block writers and writers never block readers.">
      <T x={20} y={25} bold>accounts row id=1, versions over time</T>
      <Box x={20} y={40} w={200} h={50} cls="d-ok" lines={["v1: balance=500", "created by tx 10, ended by tx 12"]} mono />
      <Box x={260} y={40} w={200} h={50} cls="d-accent" lines={["v2: balance=400", "created by tx 12, still live"]} mono />
      <Arrow x1={220} y1={65} x2={260} y2={65} label="UPDATE by tx 12" />
      <Box x={20} y={120} w={300} h={40} label="tx 11 started before tx 12 committed" sub="its snapshot shows v1 = 500" cls="d-ok" />
      <Box x={340} y={120} w={300} h={40} label="tx 13 started after tx 12 committed" sub="its snapshot shows v2 = 400" cls="d-accent" />
      <T x={20} y={190} cls="d-small">Old versions are garbage: Postgres VACUUM reclaims them; MySQL InnoDB keeps them in the undo log. Long transactions keep old versions alive → bloat.</T>
    </Svg>
  );
}

function Pages() {
  return (
    <Svg w={760} h={230} caption="Disk is read in fixed-size pages (8 KB in Postgres, 16 KB in InnoDB). The buffer pool caches hot pages in RAM. Cost = pages touched, not rows.">
      <Box x={20} y={30} w={300} h={160} cls="d-warn" />
      <T x={170} y={52} anchor="middle" bold>Table file on disk</T>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} x={35 + i * 70} y={65} w={60} h={110} lines={["page " + i, "row", "row", "row", "…"]} mono cls={i === 1 ? "d-accent" : "d-box"} />
      ))}
      <Arrow x1={320} y1={110} x2={400} y2={110} label="read page 1" />
      <Box x={400} y={30} w={200} h={160} cls="d-ok" />
      <T x={500} y={52} anchor="middle" bold>Buffer pool (RAM)</T>
      <Box x={415} y={65} w={60} h={110} lines={["page 1", "cached"]} mono cls="d-accent" />
      <Box x={485} y={65} w={60} h={110} lines={["page 7", "cached"]} mono />
      <Arrow x1={600} y1={110} x2={660} y2={110} />
      <Box x={660} y={85} w={90} h={50} label="Executor" />
      <T x={20} y={215} cls="d-small">A row lookup by index = read 3 or 4 index pages + 1 table page. A full scan = read every page of the table.</T>
    </Svg>
  );
}

function Wal() {
  return (
    <Svg w={760} h={220} caption="Write-Ahead Log: the change is appended to a sequential log and fsynced BEFORE the data page is touched. That one append is what makes COMMIT durable.">
      <Box x={20} y={40} w={120} h={60} label="COMMIT" cls="d-accent" />
      <Arrow x1={140} y1={70} x2={200} y2={70} label="1. append" />
      <Box x={200} y={40} w={180} h={60} label="WAL file" sub="sequential, fsync" cls="d-ok" />
      <Arrow x1={380} y1={70} x2={440} y2={70} label="2. ack to client" />
      <Box x={440} y={40} w={120} h={60} label="client sees OK" />
      <Arrow x1={290} y1={100} x2={290} y2={140} label="3. later: checkpoint" dash />
      <Box x={200} y={140} w={180} h={50} label="data pages" sub="random writes, in RAM then disk" cls="d-warn" />
      <T x={20} y={210} cls="d-small">Crash recovery replays the WAL from the last checkpoint. Replication ships the same WAL to replicas.</T>
    </Svg>
  );
}

function Replication() {
  return (
    <Svg w={760} h={240} caption="One primary takes writes and streams its WAL to replicas. Replicas serve reads. Replication lag means a replica can be slightly behind.">
      <Box x={20} y={80} w={100} h={60} label="App" cls="d-accent" />
      <Box x={280} y={30} w={160} h={60} label="Primary" sub="all writes" cls="d-ok" />
      <Box x={280} y={120} w={160} h={44} label="Replica 1" sub="reads" />
      <Box x={280} y={175} w={160} h={44} label="Replica 2" sub="reads" />
      <Arrow x1={120} y1={95} x2={280} y2={60} label="INSERT / UPDATE" />
      <Arrow x1={120} y1={115} x2={280} y2={142} label="SELECT" />
      <Arrow x1={120} y1={125} x2={280} y2={197} />
      <Arrow x1={360} y1={90} x2={360} y2={120} label="WAL stream" cls="d-line" marker="arrm" />
      <Arrow x1={400} y1={90} x2={400} y2={175} cls="d-line" marker="arrm" />
      <Box x={500} y={30} w={240} h={190} cls="d-box" />
      <T x={515} y={52} bold>Things that go wrong</T>
      <T x={515} y={78} cls="d-small">Lag: write, then read from replica → not</T>
      <T x={515} y={94} cls="d-small">there yet. Fix: read-your-writes from primary.</T>
      <T x={515} y={120} cls="d-small">Failover: primary dies → promote a replica.</T>
      <T x={515} y={136} cls="d-small">Async = may lose last commits. Sync = safe,</T>
      <T x={515} y={152} cls="d-small">slower commits.</T>
      <T x={515} y={178} cls="d-small">Split brain: two primaries. Fix: fencing,</T>
      <T x={515} y={194} cls="d-small">one leader elected by consensus.</T>
    </Svg>
  );
}

function Sharding() {
  return (
    <Svg w={760} h={240} caption="Sharding splits rows across machines by a shard key. Pick a key that spreads load and that most queries already have.">
      <Box x={20} y={80} w={110} h={60} label="App / router" cls="d-accent" />
      <Box x={170} y={80} w={170} h={60} label="hash(user_id) % 4" sub="shard key" />
      <Arrow x1={130} y1={110} x2={170} y2={110} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Box x={400} y={20 + i * 55} w={120} h={44} label={"shard " + i} sub={i === 2 ? "HOT: one huge tenant" : "users " + i + ", " + (i + 4) + ", …"} cls={i === 2 ? "d-bad" : "d-ok"} />
          <Arrow x1={340} y1={110} x2={400} y2={42 + i * 55} cls="d-line" marker="arrm" />
        </g>
      ))}
      <T x={540} y={40} bold>Costs</T>
      <T x={540} y={62} cls="d-small">Cross-shard JOIN: gone.</T>
      <T x={540} y={78} cls="d-small">Cross-shard transaction: hard.</T>
      <T x={540} y={94} cls="d-small">Resharding: painful (use</T>
      <T x={540} y={110} cls="d-small">consistent hashing / virtual shards).</T>
      <T x={540} y={136} cls="d-small">Range sharding (by date) is easy to</T>
      <T x={540} y={152} cls="d-small">reason about but the newest range</T>
      <T x={540} y={168} cls="d-small">gets all the writes.</T>
      <T x={540} y={194} cls="d-small">Shard only after: indexes, caching,</T>
      <T x={540} y={210} cls="d-small">read replicas, partitioning, bigger box.</T>
    </Svg>
  );
}

function Partitioning() {
  return (
    <Svg w={760} h={210} caption="Partitioning keeps one logical table but stores it in several physical pieces on the same server. Queries with the partition key skip whole pieces (pruning).">
      <Box x={20} y={70} w={160} h={60} label="orders" sub="one logical table" cls="d-accent" />
      {["2023", "2024", "2025"].map((y, i) => (
        <g key={y}>
          <Box x={260} y={20 + i * 60} w={150} h={46} label={"orders_" + y} sub="RANGE (ordered_at)" cls={i === 2 ? "d-ok" : "d-box"} />
          <Arrow x1={180} y1={100} x2={260} y2={43 + i * 60} cls="d-line" marker="arrm" />
        </g>
      ))}
      <Box x={460} y={60} w={280} h={90} cls="d-box" lines={["WHERE ordered_at >= '2025-01-01'", "→ reads only orders_2025", "DROP PARTITION orders_2023 = instant", "archive of old data"]} mono />
    </Svg>
  );
}

function Cap() {
  return (
    <Svg w={760} h={250} caption="When the network splits (P), each node must choose: refuse to answer (keep C) or answer with possibly stale data (keep A). Without a partition you can have both.">
      <polygon points="140,40 40,200 240,200" className="d-box" />
      <T x={140} y={32} anchor="middle" bold>Consistency</T>
      <T x={30} y={222} anchor="middle" bold>Availability</T>
      <T x={250} y={222} anchor="middle" bold>Partition tolerance</T>
      <T x={140} y={135} anchor="middle" cls="d-small">pick 2 when</T>
      <T x={140} y={150} anchor="middle" cls="d-small">the network splits</T>
      <Box x={320} y={40} w={200} h={70} lines={["CP: refuse writes on the", "minority side. Banks, inventory.", "e.g. Postgres + sync replica"]} cls="d-accent" />
      <Box x={320} y={130} w={200} h={70} lines={["AP: always answer, reconcile", "later. Likes, carts, feeds.", "e.g. Cassandra, DynamoDB (eventual)"]} cls="d-ok" />
      <Box x={540} y={40} w={200} h={160} lines={["Real life: PACELC", "Partition → A or C,", "Else → Latency or Consistency.", "", "Sync replication = consistent", "but slower commits.", "Async = fast but may lag."]} cls="d-box" />
    </Svg>
  );
}

function CacheAside() {
  return (
    <Svg w={760} h={230} caption="Cache-aside: the app checks the cache first. On a miss it reads the DB and fills the cache. Writes update the DB and delete the cached key.">
      <Box x={20} y={80} w={100} h={60} label="App" cls="d-accent" />
      <Box x={260} y={30} w={140} h={60} label="Redis" sub="key → JSON, TTL" cls="d-ok" />
      <Box x={260} y={140} w={140} h={60} label="Postgres" cls="d-warn" />
      <Arrow x1={120} y1={95} x2={260} y2={60} label="1. GET user:42" />
      <Arrow x1={260} y1={75} x2={120} y2={110} label="2. miss" cls="d-line" marker="arrm" dash />
      <Arrow x1={120} y1={125} x2={260} y2={165} label="3. SELECT" />
      <Arrow x1={330} y1={90} x2={330} y2={140} label="4. SET user:42 (TTL 60s)" cls="d-line" marker="arrm" />
      <Box x={450} y={30} w={290} h={170} lines={["Stale data: on write, DELETE the key", "(don't try to update it in two places).", "Stampede: 1 key expires, 1000 requests", "hit the DB → lock or early refresh.", "Hot keys: one celebrity row melts one", "Redis node → local in-process cache.", "Cache only reads you can tolerate stale."]} cls="d-box" />
    </Svg>
  );
}

function Pool() {
  return (
    <Svg w={760} h={200} caption="Opening a DB connection costs ~10–50 ms and server memory. A pool keeps a few open and lends them out. Too many connections make the DB slower, not faster.">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} x={20} y={15 + i * 28} w={110} h={22} label={"request " + (i + 1)} cls={i < 4 ? "d-accent" : "d-warn"} />
      ))}
      <T x={20} y={190} cls="d-small">5, 6 wait in the pool queue</T>
      <Arrow x1={130} y1={90} x2={200} y2={90} />
      <Box x={200} y={30} w={180} h={120} cls="d-box" />
      <T x={290} y={52} anchor="middle" bold>Pool (max 4)</T>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} x={215} y={62 + i * 20} w={150} h={16} label={"conn " + (i + 1) + " — busy"} cls="d-ok" />
      ))}
      <Arrow x1={380} y1={90} x2={450} y2={90} label="4 sockets" />
      <Box x={450} y={60} w={120} h={60} label="Postgres" sub="1 process / conn" cls="d-warn" />
      <Box x={590} y={30} w={160} h={120} lines={["Rule of thumb:", "pool ≈ cores × 2 + disks", "(often 10–20 per app).", "Many app instances?", "Use PgBouncer / RDS Proxy."]} cls="d-box" />
    </Svg>
  );
}

function NPlus1() {
  return (
    <Svg w={760} h={230} caption="N+1: one query for the list, then one query per item. 100 orders = 101 round trips. One JOIN (or one IN query) = 1 round trip.">
      <Box x={20} y={20} w={340} h={180} cls="d-bad" />
      <T x={40} y={45} bold>N + 1 (slow)</T>
      <T x={40} y={70} cls="d-mono">SELECT * FROM orders;            -- 1</T>
      <T x={40} y={92} cls="d-mono">SELECT * FROM customers WHERE id=1; -- 2</T>
      <T x={40} y={114} cls="d-mono">SELECT * FROM customers WHERE id=2; -- 3</T>
      <T x={40} y={136} cls="d-mono">…                                  -- 101</T>
      <T x={40} y={170} cls="d-small">100 round trips × 1 ms network = 100 ms wasted.</T>
      <Box x={400} y={20} w={340} h={180} cls="d-ok" />
      <T x={420} y={45} bold>Fixed (one trip)</T>
      <T x={420} y={70} cls="d-mono">SELECT o.*, c.name</T>
      <T x={420} y={92} cls="d-mono">FROM orders o</T>
      <T x={420} y={114} cls="d-mono">JOIN customers c ON c.id = o.customer_id;</T>
      <T x={420} y={150} cls="d-small">Or: collect the ids, then WHERE id IN (…).</T>
      <T x={420} y={170} cls="d-small">ORMs: use include / eager loading / DataLoader.</T>
    </Svg>
  );
}

function Keyset() {
  return (
    <Svg w={760} h={210} caption="OFFSET must read and throw away every skipped row. Keyset pagination seeks straight to the last seen key, so page 5000 costs the same as page 1.">
      <Box x={20} y={20} w={340} h={170} cls="d-bad" />
      <T x={40} y={45} bold>OFFSET pagination</T>
      <T x={40} y={70} cls="d-mono">ORDER BY id LIMIT 20 OFFSET 100000</T>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect key={i} x={40 + i * 30} y={90} width={26} height={20} className={i < 8 ? "d-warn" : "d-ok"} rx={3} />
      ))}
      <T x={40} y={135} cls="d-small">reads 100,020 rows, returns 20</T>
      <T x={40} y={155} cls="d-small">rows shift if something is inserted → duplicates / gaps</T>
      <Box x={400} y={20} w={340} h={170} cls="d-ok" />
      <T x={420} y={45} bold>Keyset (cursor) pagination</T>
      <T x={420} y={70} cls="d-mono">WHERE id &gt; 100000 ORDER BY id LIMIT 20</T>
      {[0, 1].map((i) => (
        <rect key={i} x={420 + i * 30} y={90} width={26} height={20} className="d-ok" rx={3} />
      ))}
      <T x={420} y={135} cls="d-small">index seek to id 100000, reads 20 rows</T>
      <T x={420} y={155} cls="d-small">stable under inserts; needs a unique sort key</T>
    </Svg>
  );
}

function SqlVsNoSql() {
  return (
    <Svg w={760} h={240} caption="Same order, three shapes. Rows + joins keep one fact in one place. Documents keep what is read together, together. Key-value is the fastest and dumbest.">
      <MiniTable x={20} y={10} title="Relational (rows)" head={["order", "cust_id", "item"]} rows={[[1, 7, "Lamp"], [1, 7, "Mat"]]} colW={[55, 65, 60]} />
      <T x={20} y={110} cls="d-small">Postgres, MySQL. Joins, constraints,</T>
      <T x={20} y={126} cls="d-small">transactions across tables. Default choice.</T>
      <Box x={260} y={10} w={230} h={115} cls="d-accent" lines={["Document (MongoDB)", "{ _id: 1, customer: {id:7,", "  name:'Rahul'}, items: [", "  {name:'Lamp'}, {name:'Mat'} ] }"]} mono />
      <T x={260} y={145} cls="d-small">One read gets the whole order. Flexible</T>
      <T x={260} y={161} cls="d-small">shape. Duplicated customer name → stale.</T>
      <Box x={520} y={10} w={220} h={115} cls="d-ok" lines={["Key-value (Redis)", "order:1 → '{...json...}'", "session:ab12 → user 7", "ttl 3600"]} mono />
      <T x={520} y={145} cls="d-small">Microsecond reads by exact key only.</T>
      <T x={520} y={161} cls="d-small">Cache, sessions, counters, queues.</T>
      <T x={20} y={200} cls="d-small">Also: wide-column (Cassandra: huge write volume, known queries), search (Elasticsearch), graph (Neo4j), time-series (Timescale), vector (pgvector).</T>
      <T x={20} y={220} cls="d-small">Interview line: "Start with Postgres. Add a specialised store when a measured need appears, and keep Postgres as the source of truth."</T>
    </Svg>
  );
}

function Outbox() {
  return (
    <Svg w={760} h={230} caption="Transactional outbox: write the business row AND an event row in the same transaction. A relay publishes events later. No lost or phantom events.">
      <Box x={20} y={30} w={180} h={110} cls="d-accent" lines={["BEGIN;", "INSERT INTO orders …;", "INSERT INTO outbox", "  (event, payload);", "COMMIT;"]} mono />
      <Arrow x1={200} y1={85} x2={260} y2={85} label="same tx" />
      <Box x={260} y={55} w={120} h={60} label="outbox table" sub="unsent events" cls="d-warn" />
      <Arrow x1={380} y1={85} x2={440} y2={85} label="relay polls" />
      <Box x={440} y={55} w={120} h={60} label="Kafka / SQS" cls="d-ok" />
      <Arrow x1={560} y1={85} x2={620} y2={85} />
      <Box x={620} y={55} w={120} h={60} label="consumers" sub="idempotent!" />
      <T x={20} y={170} cls="d-small">Why not publish inside the transaction? Publish succeeds then COMMIT fails → phantom event. COMMIT succeeds then publish fails → lost event.</T>
      <T x={20} y={190} cls="d-small">Delivery is at-least-once, so consumers must dedupe by event id. Change Data Capture (Debezium) can replace the polling relay.</T>
    </Svg>
  );
}

function Saga() {
  return (
    <Svg w={760} h={250} caption="Two-phase commit locks everything until all vote yes. A saga runs local transactions and undoes with compensations when a later step fails.">
      <T x={20} y={25} bold>2PC (two-phase commit)</T>
      <Box x={20} y={35} w={110} h={40} label="coordinator" cls="d-accent" />
      <Box x={200} y={35} w={90} h={40} label="orders DB" />
      <Box x={300} y={35} w={90} h={40} label="payments DB" />
      <Arrow x1={130} y1={48} x2={200} y2={48} label="prepare?" />
      <Arrow x1={130} y1={62} x2={300} y2={62} />
      <T x={20} y={100} cls="d-small">Locks held while waiting for every vote. Coordinator crash = everyone stuck. Rare in web apps.</T>
      <T x={20} y={140} bold>Saga (compensating steps)</T>
      {["reserve stock", "charge card", "create shipment"].map((s, i) => (
        <g key={s}>
          <Box x={20 + i * 200} y={150} w={160} h={40} label={s} cls={i === 2 ? "d-bad" : "d-ok"} />
          {i < 2 && <Arrow x1={180 + i * 200} y1={170} x2={220 + i * 200} y2={170} />}
        </g>
      ))}
      <T x={620} y={175} cls="d-small">✗ fails</T>
      <Arrow x1={400} y1={200} x2={300} y2={200} label="refund card" cls="d-arrow" marker="arrb" dash />
      <Arrow x1={200} y1={200} x2={100} y2={200} label="release stock" cls="d-arrow" marker="arrb" dash />
      <T x={20} y={235} cls="d-small">Each step is a local transaction. Steps must be idempotent and the saga state is stored in a table or an orchestrator.</T>
    </Svg>
  );
}

const MAP: Record<DiagramId, () => JSX.Element> = {
  whyDb: WhyDb,
  clientServer: ClientServer,
  tableAnatomy: TableAnatomy,
  relationships: Relationships,
  erd: Erd,
  joins: JoinsDemo,
  groupBy: GroupBy,
  windowFrame: WindowFrame,
  normalization: Normalization,
  btree: BTreeDemo,
  scanVsIndex: ScanVsIndexDemo,
  compositeIndex: CompositeIndex,
  queryPipeline: QueryPipeline,
  acid: Acid,
  isolation: IsolationSim,
  locks: Locks,
  mvcc: Mvcc,
  pages: Pages,
  wal: Wal,
  replication: Replication,
  sharding: Sharding,
  partitioning: Partitioning,
  cap: Cap,
  cacheAside: CacheAside,
  pool: Pool,
  nplus1: NPlus1,
  keyset: Keyset,
  sqlVsNosql: SqlVsNoSql,
  outbox: Outbox,
  saga: Saga,
  ...(MAP2 as Record<string, () => JSX.Element>),
} as Record<DiagramId, () => JSX.Element>;

export function Diagram({ id }: { id: DiagramId }) {
  const C = MAP[id];
  return <C />;
}
