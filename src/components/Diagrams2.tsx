import type { JSX } from "react";
import { Arrow, Box, MiniTable, Svg, T } from "./svg";

export function QueryOrder() {
  const steps = [["FROM + JOIN", "build rows"], ["WHERE", "drop rows"], ["GROUP BY", "fold"], ["HAVING", "drop groups"], ["SELECT", "columns, aliases"], ["ORDER BY", "sort"], ["LIMIT", "cut"]];
  return (
    <Svg w={760} h={150} caption="Written SELECT-first, run FROM-first. An alias made in SELECT exists only from step 5 on, so ORDER BY can use it and WHERE cannot.">
      {steps.map((s, i) => (
        <g key={i}>
          <Box x={10 + i * 107} y={30} w={96} h={54} label={s[0]} sub={s[1]} cls={i === 4 ? "d-accent" : "d-box"} />
          {i < steps.length - 1 && <Arrow x1={106 + i * 107} y1={57} x2={117 + i * 107} y2={57} />}
        </g>
      ))}
      <T x={10} y={118} cls="d-small">rows in: 1,000,000</T>
      <T x={224} y={118} cls="d-small">after WHERE: 50,000</T>
      <T x={438} y={118} cls="d-small">after GROUP BY: 120</T>
      <T x={652} y={118} cls="d-small">out: 20</T>
      <line x1={10} y1={125} x2={750} y2={125} className="d-line" />
    </Svg>
  );
}

export function NullLogic() {
  const rows: [string, string, string][] = [["1 = 1", "TRUE", "d-ok"], ["1 = 2", "FALSE", "d-bad"], ["1 = NULL", "UNKNOWN", "d-warn"], ["NULL = NULL", "UNKNOWN", "d-warn"], ["NULL IS NULL", "TRUE", "d-ok"], ["COALESCE(NULL, 0) = 0", "TRUE", "d-ok"]];
  return (
    <Svg w={760} h={230} caption="WHERE keeps only TRUE. UNKNOWN is thrown away, which is why x = NULL matches nothing and NOT IN with a NULL returns nothing.">
      {rows.map((r, i) => (
        <g key={i}>
          <Box x={20} y={15 + i * 34} w={220} h={28} label={r[0]} mono />
          <Box x={250} y={15 + i * 34} w={110} h={28} label={r[1]} cls={r[2]} />
        </g>
      ))}
      <Box x={400} y={15} w={340} h={200} cls="d-box" />
      <T x={415} y={40} bold>x NOT IN (1, NULL)</T>
      <T x={415} y={64} cls="d-mono">= x &lt;&gt; 1 AND x &lt;&gt; NULL</T>
      <T x={415} y={88} cls="d-mono">= TRUE AND UNKNOWN</T>
      <T x={415} y={112} cls="d-mono">= UNKNOWN → row dropped</T>
      <T x={415} y={150} cls="d-small">Every row is dropped: NOT IN returns nothing.</T>
      <T x={415} y={170} cls="d-small">Use NOT EXISTS, which tests row by row</T>
      <T x={415} y={190} cls="d-small">and never compares with NULL.</T>
    </Svg>
  );
}

export function FanOut() {
  return (
    <Svg w={760} h={240} caption="One order with 2 items and 2 payments. Joining both at once pairs every item with every payment: 2 × 2 = 4 rows, and SUM(item) counts each item twice.">
      <Box x={20} y={90} w={110} h={50} label="order 1" cls="d-accent" />
      <Box x={200} y={30} w={120} h={40} label="item A  89" />
      <Box x={200} y={160} w={120} h={40} label="item B  70" />
      <Box x={440} y={30} w={120} h={40} label="payment 1  100" cls="d-warn" />
      <Box x={440} y={160} w={120} h={40} label="payment 2  59" cls="d-warn" />
      <line x1={130} y1={110} x2={200} y2={50} className="d-line" />
      <line x1={130} y1={120} x2={200} y2={180} className="d-line" />
      {[[320, 50, 440, 50], [320, 50, 440, 180], [320, 180, 440, 50], [320, 180, 440, 180]].map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} className="d-arrow" strokeDasharray="4 3" />
      ))}
      <MiniTable x={600} y={10} title="joined rows" head={["item", "pay"]} rows={[["A 89", "100"], ["A 89", "59"], ["B 70", "100"], ["B 70", "59"]]} colW={[60, 50]} hl={() => "d-bad"} />
      <T x={600} y={150} cls="d-small">SUM(item) = 318</T>
      <T x={600} y={168} cls="d-small">truth = 159</T>
      <T x={600} y={186} cls="d-small">SUM(pay) = 318</T>
      <T x={600} y={204} cls="d-small">truth = 159</T>
      <T x={20} y={225} cls="d-small">Fix: SUM items per order in one CTE, SUM payments per order in another, then join the two one-row-per-order sets.</T>
    </Svg>
  );
}

export function OnVsWhere() {
  const rows: [string, string | null][] = [["Aarav", "paid"], ["Priya", "pending"], ["Ishaan", null]];
  return (
    <Svg w={760} h={210} caption="Goal: every customer with their paid orders. The filter in ON pads non-matches with NULL and keeps the customer. The same filter in WHERE sees NULL ≠ 'paid' and drops them.">
      <MiniTable x={10} y={5} title="LEFT JOIN result" head={["customer", "status"]} rows={rows} colW={[80, 70]} />
      <Box x={200} y={20} w={250} h={150} cls="d-ok" />
      <T x={215} y={42} bold>ON … AND o.status = 'paid'</T>
      <MiniTable x={215} y={50} head={["customer", "status"]} rows={[["Aarav", "paid"], ["Priya", null], ["Ishaan", null]]} colW={[80, 70]} />
      <T x={215} y={160} cls="d-small">3 customers, counts 1 / 0 / 0</T>
      <Box x={480} y={20} w={260} h={150} cls="d-bad" />
      <T x={495} y={42} bold>WHERE o.status = 'paid'</T>
      <MiniTable x={495} y={50} head={["customer", "status"]} rows={[["Aarav", "paid"]]} colW={[80, 70]} />
      <T x={495} y={160} cls="d-small">Priya and Ishaan vanished</T>
    </Svg>
  );
}

export function AntiJoin() {
  return (
    <Svg w={760} h={200} caption="Semi-join: A rows that have a match in B (EXISTS). Anti-join: A rows with no match (NOT EXISTS, or LEFT JOIN + IS NULL).">
      <circle cx={160} cy={100} r={75} className="d-accent" fillOpacity={0.5} />
      <circle cx={250} cy={100} r={75} className="d-warn" fillOpacity={0.5} />
      <T x={110} y={100} bold>A only</T>
      <T x={190} y={100} bold>A ∩ B</T>
      <T x={275} y={100} bold>B only</T>
      <T x={95} y={40} cls="d-small">customers</T>
      <T x={270} y={40} cls="d-small">orders.customer_id</T>
      <Box x={400} y={25} w={340} h={70} cls="d-ok" lines={["semi-join = A ∩ B", "WHERE EXISTS (SELECT 1 FROM orders o", "               WHERE o.customer_id = c.id)"]} mono />
      <Box x={400} y={110} w={340} h={70} cls="d-bad" lines={["anti-join = A only", "WHERE NOT EXISTS (… same …)", "or LEFT JOIN orders o … WHERE o.id IS NULL"]} mono />
    </Svg>
  );
}

export function SelfJoin() {
  return (
    <Svg w={760} h={200} caption="One table, two names. Alias e is 'the employee', alias m is 'that employee's manager'. The join condition links e.manager_id to m.id.">
      <MiniTable x={10} y={5} title="employees AS e" head={["id", "name", "manager_id", "salary"]} rows={[[4, "Arjun", 2, 140], [6, "Tom", 4, 150]]} colW={[35, 60, 90, 60]} />
      <MiniTable x={400} y={5} title="employees AS m (same table!)" head={["id", "name", "salary"]} rows={[[2, "Dev", 180], [4, "Arjun", 140]]} colW={[35, 60, 60]} />
      <Arrow x1={200} y1={66} x2={400} y2={66} label="e.manager_id = m.id" cls="d-line" marker="arrm" />
      <Arrow x1={200} y1={86} x2={400} y2={86} cls="d-line" marker="arrm" />
      <T x={10} y={140} cls="d-mono">SELECT e.name, m.name AS manager FROM employees e JOIN employees m ON m.id = e.manager_id</T>
      <T x={10} y={165} cls="d-small">Tom (150) &gt; Arjun (140) → Tom earns more than his manager. Use LEFT JOIN to keep the CEO, who has no manager row.</T>
    </Svg>
  );
}

export function JoinAlgorithms() {
  return (
    <Svg w={760} h={230} caption="The planner picks by estimated sizes. A missing index on the join column turns a nested loop into a full scan per outer row.">
      <Box x={10} y={15} w={235} h={200} cls="d-box" />
      <T x={22} y={38} bold>Nested loop</T>
      <T x={22} y={60} cls="d-small">for each outer row:</T>
      <T x={22} y={78} cls="d-small">  look up matches (index!)</T>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={30} y={95 + i * 30} w={60} h={24} label={"row " + (i + 1)} cls="d-accent" />
          <Arrow x1={90} y1={107 + i * 30} x2={150} y2={107 + i * 30} />
          <Box x={150} y={95 + i * 30} w={70} h={24} label="seek" cls="d-ok" />
        </g>
      ))}
      <T x={22} y={205} cls="d-small">best: small outer, indexed inner</T>
      <Box x={262} y={15} w={235} h={200} cls="d-box" />
      <T x={274} y={38} bold>Hash join</T>
      <T x={274} y={60} cls="d-small">1. hash the smaller table</T>
      <Box x={282} y={70} w={90} h={60} lines={["h(7) → row", "h(2) → row", "h(9) → row"]} mono cls="d-accent" />
      <T x={274} y={150} cls="d-small">2. stream the big table,</T>
      <T x={274} y={168} cls="d-small">   probe the hash per row</T>
      <T x={274} y={205} cls="d-small">best: big equality joins</T>
      <Box x={514} y={15} w={235} h={200} cls="d-box" />
      <T x={526} y={38} bold>Merge join</T>
      <T x={526} y={60} cls="d-small">both sides sorted on the key</T>
      {[1, 2, 4, 7].map((k, i) => (
        <Box key={i} x={534} y={70 + i * 26} w={40} h={22} label={String(k)} mono cls="d-accent" />
      ))}
      {[1, 4, 7, 9].map((k, i) => (
        <Box key={i} x={640} y={70 + i * 26} w={40} h={22} label={String(k)} mono cls="d-warn" />
      ))}
      <T x={590} y={120} cls="d-small">zip ↔</T>
      <T x={526} y={205} cls="d-small">best: pre-sorted inputs</T>
    </Svg>
  );
}

export function Recursion() {
  return (
    <Svg w={760} h={210} caption="WITH RECURSIVE = an anchor row set, then a step that joins the previous level to find the next, repeated until a level comes back empty.">
      <Box x={20} y={30} w={150} h={50} label="anchor" sub="WHERE name = 'Dev'" cls="d-accent" />
      <Arrow x1={170} y1={55} x2={230} y2={55} label="level 0" />
      <Box x={230} y={30} w={150} h={50} label="step" sub="JOIN prev ON manager_id = prev.id" />
      <Arrow x1={380} y1={55} x2={440} y2={55} label="level 1: Arjun, Nina" />
      <Box x={440} y={30} w={150} h={50} label="step again" sub="same join on level 1" />
      <Arrow x1={590} y1={55} x2={650} y2={55} label="level 2: Tom, Lina" />
      <Box x={650} y={30} w={90} h={50} label="empty" sub="stop" cls="d-ok" />
      <path d="M 305 80 C 305 130, 515 130, 515 80" className="d-line" markerEnd="url(#arrm)" />
      <T x={360} y={135} cls="d-small">UNION ALL glues every level</T>
      <T x={20} y={175} cls="d-small">Carry depth (level + 1) and a path string so you can order the output and refuse cycles. Postgres: WITH RECURSIVE … CYCLE col SET … .</T>
      <T x={20} y={195} cls="d-small">Same shape for a category tree, a bill of materials, a counter (SELECT 1 UNION ALL SELECT i + 1 WHERE i &lt; 10) or a date series.</T>
    </Svg>
  );
}

export function RankTypes() {
  const rows: (string | number)[][] = [["A", 90, 1, 1, 1], ["B", 90, 2, 1, 1], ["C", 80, 3, 3, 2], ["D", 70, 4, 4, 3]];
  return (
    <Svg w={760} h={190} caption="Same tie between A and B. ROW_NUMBER breaks it arbitrarily, RANK shares then skips (no 2), DENSE_RANK shares without skipping.">
      <MiniTable x={20} y={5} head={["name", "score", "ROW_NUMBER", "RANK", "DENSE_RANK"]} rows={rows} colW={[60, 60, 110, 70, 110]} hl={(r, c) => (r < 2 && c >= 2 ? (c === 2 ? "d-warn" : "d-ok") : r === 2 && c === 3 ? "d-bad" : undefined)} />
      <T x={460} y={40} cls="d-small">"2nd highest score" → DENSE_RANK = 2 → C</T>
      <T x={460} y={62} cls="d-small">"exactly one row per group" → ROW_NUMBER = 1</T>
      <T x={460} y={84} cls="d-small">"competition placing" → RANK (1, 1, 3)</T>
      <T x={20} y={150} cls="d-small">All three need ORDER BY inside OVER (…). Make the ORDER BY unique (add id) when ROW_NUMBER must be repeatable.</T>
    </Svg>
  );
}

export function TopN() {
  return (
    <Svg w={760} h={230} caption="PARTITION BY category restarts numbering per group; ORDER BY revenue DESC numbers best-first; the outer WHERE rn <= 2 keeps the top two of each.">
      {[
        ["Books", [["DDIA", 240, 1], ["Clean Code", 192, 2]]],
        ["Electronics", [["Headphones", 995, 1], ["Keyboard", 534, 2], ["USB-C Hub", 350, 3]]],
        ["Furniture", [["Desk", 1347, 1], ["Chair", 987, 2], ["Lamp", 270, 3]]],
      ].map((g, gi) => (
        <g key={gi}>
          <T x={20 + gi * 250} y={22} bold>{g[0] as string}</T>
          {(g[1] as (string | number)[][]).map((r, ri) => (
            <g key={ri}>
              <Box x={20 + gi * 250} y={30 + ri * 34} w={150} h={28} label={`${r[0]}  ${r[1]}`} mono cls={(r[2] as number) <= 2 ? "d-ok" : "d-bad"} />
              <Box x={175 + gi * 250} y={30 + ri * 34} w={40} h={28} label={"rn " + r[2]} mono cls={(r[2] as number) <= 2 ? "d-accent" : "d-box"} />
            </g>
          ))}
        </g>
      ))}
      <T x={20} y={165} cls="d-mono">ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn   … WHERE rn &lt;= 2</T>
      <T x={20} y={195} cls="d-small">WHERE runs before window functions, so the rn filter must sit in an outer query or CTE. Green = kept, red = cut.</T>
    </Svg>
  );
}

export function Upsert() {
  return (
    <Svg w={760} h={190} caption="One atomic statement: the database checks the unique key and either inserts or runs the ON CONFLICT action. Two concurrent upserts cannot both insert.">
      <Box x={20} y={60} w={150} h={60} label="INSERT row" sub="with key k" cls="d-accent" />
      <Arrow x1={170} y1={90} x2={250} y2={90} />
      <Box x={250} y={55} w={170} h={70} label="key k exists?" sub="UNIQUE / PK index" cls="d-warn" />
      <Arrow x1={420} y1={75} x2={520} y2={40} label="no" />
      <Arrow x1={420} y1={105} x2={520} y2={140} label="yes" />
      <Box x={520} y={20} w={220} h={44} label="row inserted" cls="d-ok" />
      <Box x={520} y={120} w={220} h={50} label="DO UPDATE SET … / DO NOTHING" sub="EXCLUDED.col = the row you tried" cls="d-ok" />
    </Svg>
  );
}

export function NormalForms() {
  return (
    <Svg w={760} h={250} caption="Each form removes one kind of duplication. The test is always: 'if this fact changes, how many rows must change?'">
      <Box x={10} y={20} w={235} h={190} cls="d-bad" />
      <T x={22} y={42} bold>Breaks 1NF</T>
      <MiniTable x={22} y={50} head={["product", "tags"]} rows={[["Lamp", "office,home"], ["Mat", "health"]]} colW={[60, 110]} />
      <T x={22} y={135} cls="d-small">a list inside one cell</T>
      <T x={22} y={155} cls="d-small">→ one row per tag:</T>
      <T x={22} y={173} cls="d-mono">product_tags(product, tag)</T>
      <Box x={262} y={20} w={235} h={190} cls="d-warn" />
      <T x={274} y={42} bold>Breaks 2NF</T>
      <MiniTable x={274} y={50} head={["order", "product", "prod_name"]} rows={[[1, 7, "Book"], [2, 7, "Book"]]} colW={[50, 60, 80]} />
      <T x={274} y={135} cls="d-small">key = (order, product) but</T>
      <T x={274} y={155} cls="d-small">prod_name depends on product only</T>
      <T x={274} y={173} cls="d-small">→ move it to products</T>
      <Box x={514} y={20} w={235} h={190} cls="d-accent" />
      <T x={526} y={42} bold>Breaks 3NF</T>
      <MiniTable x={526} y={50} head={["order", "cust", "cust_city"]} rows={[[1, 7, "Delhi"], [2, 7, "Delhi"]]} colW={[50, 50, 80]} />
      <T x={526} y={135} cls="d-small">cust_city depends on cust,</T>
      <T x={526} y={155} cls="d-small">not on the order (transitive)</T>
      <T x={526} y={173} cls="d-small">→ move it to customers</T>
      <T x={10} y={235} cls="d-small">3NF in one line: every non-key column depends on the key, the whole key, and nothing but the key.</T>
    </Svg>
  );
}

export function ExpandContract() {
  return (
    <Svg w={760} h={220} caption="Rename fullname → display_name with zero downtime: three releases, each compatible with the one before and after.">
      {[
        ["Release 1: expand", "ADD COLUMN display_name", "app writes BOTH, reads old", "backfill in batches", "d-accent"],
        ["Release 2: migrate", "app reads NEW, writes both", "SET NOT NULL once backfilled", "", "d-warn"],
        ["Release 3: contract", "app stops writing old", "DROP COLUMN fullname", "", "d-ok"],
      ].map((r, i) => (
        <g key={i}>
          <Box x={20 + i * 250} y={20} w={230} h={110} cls={r[4]} lines={[r[0], r[1], r[2], r[3]].filter(Boolean)} />
          {i < 2 && <Arrow x1={250 + i * 250} y1={75} x2={270 + i * 250} y2={75} />}
        </g>
      ))}
      <line x1={20} y1={160} x2={740} y2={160} className="d-line" />
      {["old code only", "old + new code mixed (rolling deploy)", "new code only"].map((t, i) => (
        <T key={i} x={30 + i * 250} y={185} cls="d-small">{t}</T>
      ))}
      <T x={20} y={210} cls="d-small">RENAME in one step breaks the old code the moment it runs. Rollback must also work at every step.</T>
    </Svg>
  );
}

export function StateMachine() {
  return (
    <Svg w={760} h={200} caption="A status column is a state machine. Allowed moves are arrows; everything else is refused by a guarded UPDATE … WHERE status = 'from'.">
      <Box x={20} y={70} w={120} h={50} label="pending" cls="d-warn" />
      <Box x={220} y={70} w={120} h={50} label="paid" cls="d-accent" />
      <Box x={420} y={70} w={120} h={50} label="shipped" cls="d-ok" />
      <Box x={220} y={150} w={120} h={40} label="cancelled" cls="d-bad" />
      <Arrow x1={140} y1={95} x2={220} y2={95} label="payment ok" />
      <Arrow x1={340} y1={95} x2={420} y2={95} label="dispatched" />
      <Arrow x1={80} y1={120} x2={220} y2={165} label="timeout / user" cls="d-line" marker="arrm" />
      <Arrow x1={280} y1={120} x2={280} y2={150} label="refund" cls="d-line" marker="arrm" />
      <Box x={580} y={30} w={170} h={140} cls="d-box" lines={["UPDATE orders", "SET status = 'shipped'", "WHERE id = ?", "  AND status = 'paid';", "", "rows = 0 → someone", "moved it first"]} mono />
    </Svg>
  );
}

export function TreeModels() {
  return (
    <Svg w={760} h={230} caption="Three ways to store the same tree. Adjacency list is simplest; path and closure trade write cost for cheap subtree reads.">
      {[[380, 30, "1 Electronics"], [300, 90, "2 Audio"], [460, 90, "4 Input"], [300, 150, "3 Headphones"]].map((n, i) => (
        <Box key={i} x={(n[0] as number) - 55} y={n[1] as number} w={110} h={30} label={n[2] as string} cls="d-accent" />
      ))}
      <line x1={380} y1={60} x2={300} y2={90} className="d-line" />
      <line x1={380} y1={60} x2={460} y2={90} className="d-line" />
      <line x1={300} y1={120} x2={300} y2={150} className="d-line" />
      <MiniTable x={10} y={5} title="adjacency list" head={["id", "parent"]} rows={[[1, null], [2, 1], [3, 2], [4, 1]]} colW={[35, 60]} />
      <T x={10} y={130} cls="d-small">subtree: recursive CTE</T>
      <T x={10} y={148} cls="d-small">move: 1 UPDATE</T>
      <MiniTable x={540} y={5} title="materialised path" head={["id", "path"]} rows={[[1, "1/"], [2, "1/2/"], [3, "1/2/3/"], [4, "1/4/"]]} colW={[35, 80]} />
      <T x={540} y={130} cls="d-small">subtree: path LIKE '1/2/%'</T>
      <T x={540} y={148} cls="d-small">move: rewrite descendants</T>
      <MiniTable x={540} y={160} title="closure table (anc, desc, depth)" head={["anc", "desc", "d"]} rows={[[1, 3, 2], [2, 3, 1]]} colW={[40, 45, 30]} />
      <T x={10} y={190} cls="d-small">closure: every ancestor–descendant pair stored;</T>
      <T x={10} y={208} cls="d-small">subtree = one join; insert = depth rows</T>
    </Svg>
  );
}

export function PlanTree() {
  return (
    <Svg w={760} h={250} caption="Read inside-out: the deepest node runs first. Look at actual time × loops, and estimated rows vs actual rows.">
      <Box x={20} y={20} w={200} h={40} label="Limit (20 rows)" cls="d-box" />
      <Box x={60} y={75} w={220} h={40} label="Nested Loop" sub="rows est 1000 / actual 20" cls="d-warn" />
      <Box x={100} y={130} w={280} h={50} label="Seq Scan on orders" sub="Filter: status='paid' · Rows Removed: 180,000" cls="d-bad" />
      <Box x={100} y={190} w={280} h={50} label="Index Scan customers_pkey" sub="loops=20 × 0.2 ms = 4 ms" cls="d-ok" />
      <line x1={120} y1={60} x2={120} y2={75} className="d-line" />
      <line x1={160} y1={115} x2={160} y2={130} className="d-line" />
      <line x1={160} y1={180} x2={160} y2={190} className="d-line" />
      <Box x={420} y={20} w={320} h={220} cls="d-box" lines={["What to look for", "", "✗ Seq Scan + big 'Rows Removed by Filter'", "   → index on that filter", "✗ Sort (external merge Disk)", "   → index matching ORDER BY", "✗ est rows ≫ or ≪ actual rows", "   → ANALYZE; extended statistics", "✗ Nested Loop with a scanned inner side", "   → index the join column", "✓ Index Only Scan, loops small, no sort"]} />
    </Svg>
  );
}

export function Sargable() {
  return (
    <Svg w={760} h={200} caption="An index is sorted by the raw column value. Wrap the column in a function or a cast and the sorted order no longer helps, so the planner scans.">
      <Box x={20} y={20} w={340} h={160} cls="d-bad" />
      <T x={35} y={45} bold>Not sargable → scan</T>
      <T x={35} y={72} cls="d-mono">WHERE YEAR(created_at) = 2025</T>
      <T x={35} y={94} cls="d-mono">WHERE LOWER(email) = 'x@y.com'</T>
      <T x={35} y={116} cls="d-mono">WHERE price * 1.18 &gt; 100</T>
      <T x={35} y={138} cls="d-mono">WHERE phone = 98765   (text col)</T>
      <T x={35} y={160} cls="d-mono">WHERE name LIKE '%son'</T>
      <Box x={400} y={20} w={340} h={160} cls="d-ok" />
      <T x={415} y={45} bold>Sargable → index seek</T>
      <T x={415} y={72} cls="d-mono">created_at &gt;= '2025-01-01' AND &lt; '2026-01-01'</T>
      <T x={415} y={94} cls="d-mono">index ON lower(email) (expression index)</T>
      <T x={415} y={116} cls="d-mono">WHERE price &gt; 100 / 1.18</T>
      <T x={415} y={138} cls="d-mono">WHERE phone = '98765'</T>
      <T x={415} y={160} cls="d-mono">trigram / full-text index</T>
    </Svg>
  );
}

export function Injection() {
  return (
    <Svg w={760} h={210} caption="Concatenation sends one string: the database cannot tell data from code. Parameters travel on a separate channel and are never parsed as SQL.">
      <Box x={20} y={20} w={340} h={80} cls="d-bad" lines={["\"… WHERE name = '\" + input + \"'\"", "input = x' OR 1=1 --", "→ WHERE name = 'x' OR 1=1 --'  (everyone)"]} mono />
      <Box x={400} y={20} w={340} h={80} cls="d-ok" lines={["query(\"… WHERE name = $1\", [input])", "SQL text:   WHERE name = $1", "value:      x' OR 1=1 --   (just a name)"]} mono />
      <Box x={20} y={120} w={150} h={50} label="app" cls="d-accent" />
      <Arrow x1={170} y1={135} x2={330} y2={135} label="SQL text (code)" />
      <Arrow x1={170} y1={160} x2={330} y2={160} label="values (data)" cls="d-line" marker="arrm" />
      <Box x={330} y={120} w={150} h={50} label="database" sub="parses only the text" />
      <T x={500} y={140} cls="d-small">Also: least-privilege DB role,</T>
      <T x={500} y={158} cls="d-small">never user input as table/column names,</T>
      <T x={500} y={176} cls="d-small">review every raw() call.</T>
    </Svg>
  );
}

export function LevelsLadder() {
  const levels = [["READ UNCOMMITTED", "dirty, non-repeatable, phantom, lost, skew", "d-bad"], ["READ COMMITTED", "non-repeatable, phantom, lost, skew", "d-warn"], ["REPEATABLE READ", "phantom*, lost*, skew", "d-accent"], ["SERIALIZABLE", "none (but retry on 40001)", "d-ok"]];
  return (
    <Svg w={760} h={210} caption="Each step up removes anomalies and adds waiting or retries. * Postgres RR also blocks phantoms and turns lost updates into errors.">
      {levels.map((l, i) => (
        <g key={i}>
          <Box x={20 + i * 40} y={150 - i * 40} w={300} h={34} label={l[0]} cls={l[2]} />
          <T x={340 + i * 40} y={172 - i * 40} cls="d-small">still possible: {l[1]}</T>
        </g>
      ))}
      <T x={20} y={205} cls="d-small">Defaults: Postgres / Oracle / SQL Server = READ COMMITTED · MySQL InnoDB = REPEATABLE READ.</T>
    </Svg>
  );
}

export function WriteSkew() {
  return (
    <Svg w={760} h={220} caption="Rule: at least one doctor on call. Both read 'two on call', both go off call, both commit. No row was written twice, so only SERIALIZABLE (or a shared lock row) catches it.">
      <T x={20} y={25} bold>Dr A (tx 1)</T>
      <T x={400} y={25} bold>Dr B (tx 2)</T>
      <Box x={20} y={35} w={340} h={34} label="SELECT COUNT(*) WHERE on_call → 2" cls="d-box" />
      <Box x={400} y={70} w={340} h={34} label="SELECT COUNT(*) WHERE on_call → 2" cls="d-box" />
      <Box x={20} y={105} w={340} h={34} label="UPDATE doctors SET on_call = false WHERE id = A; COMMIT" cls="d-warn" />
      <Box x={400} y={140} w={340} h={34} label="UPDATE doctors SET on_call = false WHERE id = B; COMMIT" cls="d-bad" />
      <Box x={20} y={185} w={720} h={28} label="result: nobody on call. Each transaction alone was correct." cls="d-bad" />
    </Svg>
  );
}

export function OptimisticVsPessimistic() {
  return (
    <Svg w={760} h={230} caption="Pessimistic: lock first, inside one short transaction. Optimistic: no lock; detect a conflict at write time with a version column and retry.">
      <Box x={20} y={20} w={340} h={190} cls="d-box" />
      <T x={35} y={45} bold>Pessimistic (hot rows: stock, balance)</T>
      <Box x={35} y={60} w={310} h={28} label="BEGIN; SELECT … FOR UPDATE  🔒" mono cls="d-warn" />
      <Box x={35} y={95} w={310} h={28} label="others WAIT here" mono cls="d-bad" />
      <Box x={35} y={130} w={310} h={28} label="UPDATE …; COMMIT  🔓" mono cls="d-ok" />
      <T x={35} y={185} cls="d-small">lock held for milliseconds, never across a web request</T>
      <Box x={400} y={20} w={340} h={190} cls="d-box" />
      <T x={415} y={45} bold>Optimistic (rare conflicts, long edits)</T>
      <Box x={415} y={60} w={310} h={28} label="SELECT …, version → v1   (no lock)" mono cls="d-accent" />
      <Box x={415} y={95} w={310} h={28} label="…user thinks for 30 s…" mono />
      <Box x={415} y={130} w={310} h={28} label="UPDATE … WHERE id=? AND version=1" mono cls="d-ok" />
      <T x={415} y={185} cls="d-small">0 rows → someone else saved first → reload, retry</T>
    </Svg>
  );
}

export function JobQueue() {
  return (
    <Svg w={760} h={210} caption="FOR UPDATE SKIP LOCKED: each worker locks a different row instead of waiting or colliding. The claim is one UPDATE … RETURNING, so no two workers get the same job.">
      {[["job 1", "running · w1", "d-accent"], ["job 2", "running · w2", "d-accent"], ["job 3", "queued", "d-ok"], ["job 4", "queued", "d-ok"]].map((j, i) => (
        <Box key={i} x={300} y={15 + i * 45} w={160} h={36} label={j[0]} sub={j[1]} cls={j[2]} />
      ))}
      <Box x={40} y={30} w={120} h={40} label="worker 1" />
      <Box x={40} y={110} w={120} h={40} label="worker 2" />
      <Box x={40} y={150} w={120} h={40} label="worker 3" cls="d-warn" />
      <Arrow x1={160} y1={50} x2={300} y2={33} label="locked" />
      <Arrow x1={160} y1={130} x2={300} y2={78} label="locked" />
      <Arrow x1={160} y1={170} x2={300} y2={123} label="skips 1 & 2 → takes 3" cls="d-arrow" />
      <Box x={500} y={15} w={240} h={180} cls="d-box" lines={["UPDATE jobs SET status='running'", "WHERE id = (", "  SELECT id FROM jobs", "  WHERE status='queued'", "  ORDER BY run_at LIMIT 1", "  FOR UPDATE SKIP LOCKED)", "RETURNING *;", "+ locked_until lease", "+ idempotent handlers"]} mono />
    </Svg>
  );
}

export function HeapVsClustered() {
  return (
    <Svg w={760} h={230} caption="Postgres: indexes point into an unordered heap. InnoDB: the table IS the primary-key B-tree, and secondary indexes hold the PK value, so PK order and size shape everything.">
      <Box x={20} y={20} w={340} h={190} cls="d-box" />
      <T x={35} y={45} bold>Postgres heap</T>
      <Box x={35} y={60} w={120} h={30} label="index on email" cls="d-accent" />
      <Box x={35} y={100} w={120} h={30} label="index on id (PK)" cls="d-accent" />
      {[0, 1, 2].map((i) => (
        <Box key={i} x={220} y={60 + i * 40} w={120} h={30} label={"heap page " + i} cls="d-warn" />
      ))}
      <Arrow x1={155} y1={75} x2={220} y2={135} cls="d-line" marker="arrm" />
      <Arrow x1={155} y1={115} x2={220} y2={75} cls="d-line" marker="arrm" />
      <T x={35} y={190} cls="d-small">leaf → ctid (page, slot); rows anywhere</T>
      <Box x={400} y={20} w={340} h={190} cls="d-box" />
      <T x={415} y={45} bold>InnoDB clustered</T>
      <Box x={415} y={60} w={130} h={30} label="index on email" cls="d-accent" />
      <Box x={580} y={60} w={150} h={120} cls="d-warn" lines={["PK B-tree = table", "id 1 → row", "id 2 → row", "id 3 → row", "sorted by id"]} mono />
      <Arrow x1={545} y1={75} x2={580} y2={100} label="holds id" cls="d-line" marker="arrm" />
      <T x={415} y={190} cls="d-small">secondary lookup = 2 B-tree descents; random PK = splits everywhere</T>
    </Svg>
  );
}

export function Bloat() {
  return (
    <Svg w={760} h={200} caption="Every UPDATE leaves the old version as a dead tuple. VACUUM frees that space; if it cannot keep up (long transactions, heavy churn), pages fill with dead rows and every scan reads more pages.">
      <T x={20} y={25} bold>healthy page</T>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={20 + i * 40} y={35} width={34} height={30} rx={4} className="d-ok" />
      ))}
      <T x={20} y={90} cls="d-small">6 live rows, 1 page read</T>
      <T x={400} y={25} bold>bloated: same 6 live rows over 3 pages</T>
      {[0, 1, 2].map((p) => (
        <g key={p}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={400 + p * 120 + (i % 3) * 36} y={35 + Math.floor(i / 3) * 34} width={30} height={28} rx={4} className={i === 0 || (i === 4 && p === 1) ? "d-ok" : "d-bad"} />
          ))}
        </g>
      ))}
      <T x={400} y={120} cls="d-small">red = dead tuples; 3 page reads for the same data</T>
      <T x={20} y={160} cls="d-small">Watch: pg_stat_user_tables.n_dead_tup · Fix: kill long transactions, tune autovacuum per hot table, pg_repack for an online rebuild.</T>
      <T x={20} y={180} cls="d-small">Avoid: updating a hot column (last_seen_at) on a wide row; move it to a narrow table or Redis.</T>
    </Svg>
  );
}

export function SyncAsync() {
  return (
    <Svg w={760} h={210} caption="Async: the client gets OK as soon as the primary's WAL is on disk; a crash right then loses that commit on the promoted replica. Sync: OK only after a replica has it too.">
      <T x={20} y={25} bold>asynchronous</T>
      <Box x={20} y={35} w={110} h={34} label="COMMIT" cls="d-accent" />
      <Arrow x1={130} y1={52} x2={190} y2={52} />
      <Box x={190} y={35} w={130} h={34} label="primary WAL fsync" cls="d-ok" />
      <Arrow x1={320} y1={52} x2={380} y2={52} />
      <Box x={380} y={35} w={90} h={34} label="OK ✓" cls="d-ok" />
      <Arrow x1={255} y1={69} x2={255} y2={95} label="later…" dash cls="d-line" marker="arrm" />
      <Box x={190} y={95} w={130} h={30} label="replica applies" cls="d-warn" />
      <T x={480} y={56} cls="d-small">fast · RPO &gt; 0</T>
      <T x={20} y={150} bold>synchronous</T>
      <Box x={20} y={160} w={110} h={34} label="COMMIT" cls="d-accent" />
      <Arrow x1={130} y1={177} x2={190} y2={177} />
      <Box x={190} y={160} w={130} h={34} label="primary WAL fsync" cls="d-ok" />
      <Arrow x1={320} y1={177} x2={380} y2={177} />
      <Box x={380} y={160} w={130} h={34} label="replica has WAL" cls="d-ok" />
      <Arrow x1={510} y1={177} x2={570} y2={177} />
      <Box x={570} y={160} w={90} h={34} label="OK ✓" cls="d-ok" />
      <T x={670} y={181} cls="d-small">RPO = 0</T>
    </Svg>
  );
}

export function Pitr() {
  return (
    <Svg w={760} h={190} caption="Point-in-time recovery: restore the last base backup, then replay archived WAL up to the second before the mistake. A replica cannot do this: it already applied the DELETE.">
      <line x1={30} y1={80} x2={730} y2={80} className="d-line" />
      <Box x={40} y={40} w={120} h={34} label="base backup" sub="Sun 02:00" cls="d-ok" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={190 + i * 60} y={66} width={50} height={28} rx={4} className="d-accent" />
      ))}
      <T x={190} y={115} cls="d-small">archived WAL segments (every change, in order)</T>
      <Box x={560} y={20} w={150} h={34} label="DELETE FROM orders" sub="Wed 14:03" cls="d-bad" />
      <line x1={635} y1={54} x2={635} y2={66} className="d-line" />
      <Arrow x1={610} y1={140} x2={610} y2={100} label="stop replay at 14:02" />
      <T x={40} y={160} cls="d-small">RPO = how much WAL you can lose (seconds with archiving). RTO = restore + replay time. Test the restore, or it is not a backup.</T>
    </Svg>
  );
}

export function ScaleLadder() {
  const steps = ["1 fix query shapes + indexes", "2 cache hot reads (Redis)", "3 read replicas", "4 partition big tables", "5 bigger machine", "6 split noisy tables into own DB", "7 shard by tenant / user"];
  return (
    <Svg w={760} h={230} caption="Climb in this order. Every step up costs more operations; sharding costs joins and transactions too.">
      {steps.map((s, i) => (
        <Box key={i} x={20 + i * 60} y={190 - i * 28} w={330} h={26} label={s} cls={i < 4 ? "d-ok" : i < 6 ? "d-warn" : "d-bad"} />
      ))}
      <T x={420} y={40} cls="d-small">most apps never pass step 4</T>
    </Svg>
  );
}

export function Idempotency() {
  return (
    <Svg w={760} h={200} caption="A retry carries the same key. The server finds the stored result and returns it without acting again. The key row is written in the same transaction as the effect.">
      <Box x={20} y={30} w={130} h={44} label="client" sub="Idempotency-Key: k1" cls="d-accent" />
      <Arrow x1={150} y1={45} x2={260} y2={45} label="POST /pay (k1)" />
      <Arrow x1={150} y1={65} x2={260} y2={65} label="retry (k1)" dash />
      <Box x={260} y={30} w={200} h={44} label="SELECT … WHERE key = k1" cls="d-warn" />
      <Arrow x1={460} y1={40} x2={560} y2={25} label="not found" />
      <Arrow x1={460} y1={65} x2={560} y2={110} label="found" />
      <Box x={560} y={5} w={190} h={60} cls="d-ok" lines={["BEGIN; do the work;", "INSERT key k1 + response;", "COMMIT; return response"]} mono />
      <Box x={560} y={95} w={190} h={40} label="return stored response" cls="d-ok" />
      <T x={20} y={160} cls="d-small">Same idea for queues: processed_events(event_id PK) inserted with ON CONFLICT DO NOTHING in the consumer's transaction.</T>
      <T x={20} y={180} cls="d-small">Same idea for payments: your order id is the provider's idempotency key.</T>
    </Svg>
  );
}

export function EmbedVsReference() {
  return (
    <Svg w={760} h={210} caption="Embed what is read together and bounded. Reference what is shared, unbounded, or changes on its own.">
      <Box x={20} y={20} w={340} h={170} cls="d-ok" lines={["EMBED  (order → items)", "{ _id: 1,", "  items: [ {sku:'KB-1', qty:1},", "           {sku:'HUB', qty:2} ],", "  status: 'paid' }", "", "✓ one read gets the order", "✓ bounded list, changes with parent"]} mono />
      <Box x={400} y={20} w={340} h={170} cls="d-accent" lines={["REFERENCE  (post → comments)", "posts:    { _id: 9, title: '…' }", "comments: { postId: 9, text: '…' }", "          { postId: 9, text: '…' } ×100k", "", "✓ unbounded growth (16 MB doc limit)", "✓ shared / independently edited", "index: { postId: 1, createdAt: -1 }"]} mono />
    </Svg>
  );
}

export function DesignSteps() {
  const steps = [["1 Clarify", "users, QPS, read/write, consistency"], ["2 Access patterns", "the 5–8 real queries"], ["3 Entities", "nouns → tables, verbs → FKs"], ["4 Schema", "types, keys, constraints, snapshots"], ["5 Indexes", "one per pattern, equality→range"], ["6 Scale", "cache, replicas, partitions, shard"], ["7 Failure", "transactions, idempotency, backups"]];
  return (
    <Svg w={760} h={150} caption="Say the steps out loud in this order. Interviewers score the order and the trade-offs, not the final table list.">
      {steps.map((s, i) => (
        <g key={i}>
          <Box x={10 + i * 107} y={25} w={98} h={70} label={s[0]} sub={s[1]} cls={i === 1 ? "d-accent" : "d-box"} />
          {i < steps.length - 1 && <Arrow x1={108 + i * 107} y1={60} x2={117 + i * 107} y2={60} />}
        </g>
      ))}
      <T x={10} y={125} cls="d-small">Step 2 drives everything: a schema without known access patterns is a guess.</T>
    </Svg>
  );
}

export function PkChoice() {
  return (
    <Svg w={760} h={200} caption="Sequential ids always append to the rightmost leaf, which stays in cache. Random UUIDs land on random leaves: cache misses and page splits across the whole index.">
      <T x={20} y={25} bold>bigint / UUID v7 (ordered)</T>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={20 + i * 52} y={35} width={46} height={30} rx={4} className={i === 5 ? "d-ok" : "d-box"} />
      ))}
      <Arrow x1={330} y1={50} x2={290} y2={50} label="new rows →" />
      <T x={20} y={90} cls="d-small">1 hot page, no splits</T>
      <T x={400} y={25} bold>UUID v4 (random)</T>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={400 + i * 52} y={35} width={46} height={30} rx={4} className={[1, 3, 4].includes(i) ? "d-bad" : "d-box"} />
      ))}
      <T x={400} y={90} cls="d-small">every page is hot; splits and bloat</T>
      <T x={20} y={140} cls="d-small">Rule: internal PK = bigint identity. Public or client-generated ids = UUID v7 / ULID (time-ordered). Avoid UUID v4 as a PK, especially on InnoDB.</T>
    </Svg>
  );
}

export function DefenceLayers() {
  const rings = [["app validation", "friendly messages", 350, "d-box"], ["CHECK / UNIQUE / FK", "business rules", 270, "d-accent"], ["NOT NULL", "required facts", 190, "d-warn"], ["column type", "numeric, date, text", 110, "d-ok"]];
  return (
    <Svg w={760} h={240} caption="Inner rings catch what outer rings miss. Only the database rings apply to every writer: API, cron jobs, migrations, admin consoles.">
      {rings.map((r, i) => (
        <g key={i}>
          <ellipse cx={200} cy={120} rx={r[2] as number} ry={(r[2] as number) * 0.3} className={r[3] as string} />
          <T x={200 + (r[2] as number) - 10} y={125} cls="d-small" anchor="end">{r[0]}</T>
        </g>
      ))}
      <T x={200} y={125} anchor="middle" bold>row</T>
      <Box x={570} y={30} w={170} h={180} cls="d-box" lines={["Who writes to the table?", "", "• your API", "• a cron job", "• a migration script", "• the admin console", "• a future service", "", "Only constraints cover all."]} />
    </Svg>
  );
}

export function CountFamily() {
  return (
    <Svg w={760} h={190} caption="COUNT(*) counts rows. COUNT(col) skips NULLs in that column. COUNT(DISTINCT col) counts unique non-NULL values.">
      <MiniTable x={20} y={5} title="employees" head={["name", "manager_id"]} rows={[["Meera", null], ["Dev", 1], ["Sara", 1], ["Arjun", 2]]} colW={[70, 90]} hl={(r, c) => (c === 1 && r === 0 ? "d-warn" : undefined)} />
      <Box x={260} y={25} w={150} h={40} label="COUNT(*) = 4" cls="d-accent" />
      <Box x={260} y={75} w={150} h={40} label="COUNT(manager_id) = 3" cls="d-ok" />
      <Box x={260} y={125} w={150} h={40} label="COUNT(DISTINCT manager_id) = 2" cls="d-warn" />
      <T x={430} y={50} cls="d-small">all rows</T>
      <T x={430} y={100} cls="d-small">NULL skipped (the CEO)</T>
      <T x={430} y={150} cls="d-small">unique values: 1 and 2</T>
      <T x={430} y={180} cls="d-small">On a LEFT JOIN: COUNT(right.id) gives 0 for no match; COUNT(*) gives 1.</T>
    </Svg>
  );
}

export function FloatTrap() {
  return (
    <Svg w={760} h={180} caption="0.1 has no exact binary form, like 1/3 has no exact decimal form. Each float row is off by a hair; sums of thousands drift by rupees.">
      <T x={20} y={30} bold>FLOAT stores the nearest binary fraction</T>
      <Box x={20} y={40} w={340} h={28} label="0.1 → 0.1000000000000000055511151231257827…" mono cls="d-bad" />
      <Box x={20} y={75} w={340} h={28} label="0.1 + 0.2 → 0.30000000000000004" mono cls="d-bad" />
      <Box x={20} y={110} w={340} h={28} label="SUM of 1,000,000 × 19.99 → off by paise" mono cls="d-bad" />
      <T x={400} y={30} bold>NUMERIC(12,2) stores digits</T>
      <Box x={400} y={40} w={340} h={28} label="0.1 → 0.10  exactly" mono cls="d-ok" />
      <Box x={400} y={75} w={340} h={28} label="0.1 + 0.2 → 0.30" mono cls="d-ok" />
      <Box x={400} y={110} w={340} h={28} label="or: integer paise  1999 × 1,000,000" mono cls="d-ok" />
      <T x={20} y={165} cls="d-small">Float is fine for measurements (temperature, distance). Money, quantities and anything summed or compared for equality: NUMERIC or integer minor units.</T>
    </Svg>
  );
}

export const MAP2: Record<string, () => JSX.Element> = {
  queryOrder: QueryOrder,
  nullLogic: NullLogic,
  fanOut: FanOut,
  onVsWhere: OnVsWhere,
  antiJoin: AntiJoin,
  selfJoin: SelfJoin,
  joinAlgorithms: JoinAlgorithms,
  recursion: Recursion,
  rankTypes: RankTypes,
  topN: TopN,
  upsert: Upsert,
  normalForms: NormalForms,
  expandContract: ExpandContract,
  stateMachine: StateMachine,
  treeModels: TreeModels,
  planTree: PlanTree,
  sargable: Sargable,
  injection: Injection,
  levelsLadder: LevelsLadder,
  writeSkew: WriteSkew,
  optimisticVsPessimistic: OptimisticVsPessimistic,
  jobQueue: JobQueue,
  heapVsClustered: HeapVsClustered,
  bloat: Bloat,
  syncAsync: SyncAsync,
  pitr: Pitr,
  scaleLadder: ScaleLadder,
  idempotency: Idempotency,
  embedVsReference: EmbedVsReference,
  designSteps: DesignSteps,
  pkChoice: PkChoice,
  defenceLayers: DefenceLayers,
  countFamily: CountFamily,
  floatTrap: FloatTrap,
};
