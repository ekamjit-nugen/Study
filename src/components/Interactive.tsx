import { useMemo, useState } from "react";
import { Box, MiniTable, T } from "./svg";

/* ---------------- JOINS ---------------- */
const CUSTOMERS = [
  [1, "Aarav"],
  [2, "Priya"],
  [3, "Liam"],
  [4, "Sofia"],
] as const;
const ORDERS = [
  [1, 1, 159],
  [2, 2, 80],
  [3, 1, 80],
  [4, 9, 50],
] as const;
type JoinKind = "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";

export function JoinsDemo() {
  const [kind, setKind] = useState<JoinKind>("INNER");
  const rows = useMemo(() => {
    const out: { c: (typeof CUSTOMERS)[number] | null; o: (typeof ORDERS)[number] | null }[] = [];
    if (kind === "CROSS") {
      for (const c of CUSTOMERS) for (const o of ORDERS) out.push({ c, o });
      return out;
    }
    const matchedO = new Set<number>();
    for (const c of CUSTOMERS) {
      const os = ORDERS.filter((o) => o[1] === c[0]);
      os.forEach((o) => matchedO.add(o[0]));
      if (os.length) os.forEach((o) => out.push({ c, o }));
      else if (kind === "LEFT" || kind === "FULL") out.push({ c, o: null });
    }
    if (kind === "RIGHT" || kind === "FULL") for (const o of ORDERS) if (!matchedO.has(o[0])) out.push({ c: null, o });
    return out;
  }, [kind]);
  const sqlFor: Record<JoinKind, string> = {
    INNER: "SELECT c.name, o.id, o.total FROM customers c INNER JOIN orders o ON o.customer_id = c.id",
    LEFT: "SELECT c.name, o.id, o.total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id",
    RIGHT: "SELECT c.name, o.id, o.total FROM customers c RIGHT JOIN orders o ON o.customer_id = c.id",
    FULL: "SELECT c.name, o.id, o.total FROM customers c FULL OUTER JOIN orders o ON o.customer_id = c.id",
    CROSS: "SELECT c.name, o.id, o.total FROM customers c CROSS JOIN orders o",
  };
  const explain: Record<JoinKind, string> = {
    INNER: "Only pairs that match. Liam and Sofia have no orders → gone. Order 4 points at customer 9 who doesn't exist → gone.",
    LEFT: "Every customer, matched or not. Unmatched customers get NULL for the order columns. Use it for 'customers with zero orders' (WHERE o.id IS NULL).",
    RIGHT: "Every order, matched or not. Order 4's customer is NULL. Most people rewrite RIGHT as LEFT with the tables swapped.",
    FULL: "Everything from both sides. Unmatched rows on either side are padded with NULLs. Great for reconciliation: 'what is in A but not B, and in B but not A'.",
    CROSS: "Every customer paired with every order: 4 × 4 = 16 rows. No ON clause. Useful for generating combinations (sizes × colours).",
  };
  return (
    <div className="diagram">
      <div className="chips">
        {(["INNER", "LEFT", "RIGHT", "FULL", "CROSS"] as JoinKind[]).map((k) => (
          <button key={k} className={`chip ${k === kind ? "active" : ""}`} onClick={() => setKind(k)}>
            {k} JOIN
          </button>
        ))}
      </div>
      <pre className="code" style={{ fontSize: "0.78rem" }}>{sqlFor[kind]}</pre>
      <svg viewBox="0 0 760 170" style={{ width: "100%", height: "auto" }}>
        <MiniTable x={10} y={5} title="customers" head={["id", "name"]} rows={CUSTOMERS.map((c) => [...c])} colW={[40, 70]} hl={(r) => (rows.some((x) => x.c?.[0] === CUSTOMERS[r][0]) ? "d-ok" : "d-bad")} />
        <MiniTable x={150} y={5} title="orders" head={["id", "customer_id", "total"]} rows={ORDERS.map((o) => [...o])} colW={[40, 95, 55]} hl={(r) => (rows.some((x) => x.o?.[0] === ORDERS[r][0]) ? "d-ok" : "d-bad")} />
        <MiniTable x={370} y={5} title={`result: ${rows.length} rows`} head={["name", "order", "total"]} rows={rows.slice(0, 7).map((r) => [r.c ? r.c[1] : null, r.o ? r.o[0] : null, r.o ? r.o[2] : null])} colW={[80, 60, 60]} hl={(r, c) => {
          const row = rows[r];
          if (c === 0 && !row.c) return "d-warn";
          if (c > 0 && !row.o) return "d-warn";
          return undefined;
        }} />
        {rows.length > 7 && (
          <T x={375} y={25 + 20 * 8 + 8} cls="d-small">
            … {rows.length - 7} more rows
          </T>
        )}
      </svg>
      <div className="caption" style={{ textAlign: "left" }}>
        {explain[kind]} <span className="muted">Green = row appears in the result, red = dropped, orange = padded with NULL.</span>
      </div>
    </div>
  );
}

/* ---------------- B-TREE ---------------- */
const LEAVES: number[][] = [];
for (let i = 0; i < 9; i++) LEAVES.push([5 + i * 15, 10 + i * 15, 15 + i * 15]);
// internal node i covers leaves 3i..3i+2 ; separators = first key of leaves 3i+1, 3i+2
const INTERNAL = [0, 1, 2].map((i) => [LEAVES[3 * i + 1][0], LEAVES[3 * i + 2][0]]);
const ROOT = [LEAVES[3][0], LEAVES[6][0]]; // 50, 95

export function BTreeDemo() {
  const [key, setKey] = useState(70);
  const k = Math.max(1, Math.min(135, Number.isFinite(key) ? key : 1));
  const childIdx = (seps: number[], v: number) => (v < seps[0] ? 0 : v < seps[1] ? 1 : 2);
  const iIdx = childIdx(ROOT, k);
  const lIdx = iIdx * 3 + childIdx(INTERNAL[iIdx], k);
  const found = LEAVES[lIdx].includes(k);
  return (
    <div className="diagram">
      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <label className="small">
          Find key:&nbsp;
          <input type="number" min={1} max={135} value={key} onChange={(e) => setKey(Number(e.target.value))} style={{ width: 70, font: "inherit", padding: "0.2rem 0.4rem", borderRadius: 6, border: "1px solid var(--line)" }} />
        </label>
        <span className="small">
          Path: root → internal {iIdx} → leaf {lIdx} = <b>3 page reads</b> instead of scanning 9 leaf pages. {found ? <span className="result-ok">Found {k}.</span> : <span className="muted">{k} is not in the table (the leaf proves it in the same 3 reads).</span>}
        </span>
      </div>
      <svg viewBox="0 0 760 230" style={{ width: "100%", height: "auto" }}>
        <Box x={330} y={10} w={100} h={30} label={`[${ROOT.join(" | ")}]`} mono cls="d-accent" />
        <T x={440} y={30} cls="d-small">root</T>
        {INTERNAL.map((n, i) => (
          <g key={i}>
            <line x1={380} y1={40} x2={130 + i * 250} y2={75} className="d-line" />
            <Box x={80 + i * 250} y={75} w={100} h={30} label={`[${n.join(" | ")}]`} mono cls={i === iIdx ? "d-accent" : "d-box"} />
          </g>
        ))}
        {LEAVES.map((leaf, i) => {
          const parent = Math.floor(i / 3);
          const x = 10 + i * 83;
          return (
            <g key={i}>
              <line x1={130 + parent * 250} y1={105} x2={x + 37} y2={145} className="d-line" />
              <Box x={x} y={145} w={75} h={30} label={leaf.join(",")} mono cls={i === lIdx ? "d-accent" : "d-box"} />
              {i < 8 && <line x1={x + 75} y1={160} x2={x + 83} y2={160} className="d-arrow" />}
            </g>
          );
        })}
        <T x={10} y={200} cls="d-small">
          Leaves are linked, so a range scan (WHERE id BETWEEN 40 AND 90) walks sideways after one descent. Real trees: fanout of hundreds → 4 levels hold billions of keys.
        </T>
        <T x={10} y={218} cls="d-small">
          Each leaf entry points at the row's location in the table (heap). A covering index stores the needed columns in the leaf, so the table is never touched.
        </T>
      </svg>
    </div>
  );
}

/* ---------------- SCAN VS INDEX ---------------- */
export function ScanVsIndexDemo() {
  const [mode, setMode] = useState<0 | 1 | 2>(0);
  const pages = 12;
  const touched = mode === 0 ? pages : 1;
  const titles = ["WHERE city = 'Mumbai'  (no index)", "WHERE id = 7  (primary key index)", "WHERE city = 'Mumbai'  after CREATE INDEX ON customers(city)"];
  const notes = [
    "Sequential scan: every page of the table is read and every row is checked. Cost grows with the table.",
    "Index seek: 3 index pages find the pointer, then 1 table page is read. Cost stays flat as the table grows.",
    "Same seek now works for city. But the planner may still choose a scan if most rows are in Mumbai: reading 90% of pages through an index is slower than reading them in order.",
  ];
  return (
    <div className="diagram">
      <div className="chips">
        {titles.map((t, i) => (
          <button key={i} className={`chip ${mode === i ? "active" : ""}`} onClick={() => setMode(i as 0 | 1 | 2)}>
            {t}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 760 120" style={{ width: "100%", height: "auto" }}>
        {mode !== 0 && (
          <g>
            {[0, 1, 2].map((i) => (
              <Box key={i} x={20 + i * 70} y={15} w={60} h={26} label={["root", "branch", "leaf"][i]} cls="d-accent" />
            ))}
            <T x={240} y={32} cls="d-small">3 index pages → row pointer → 1 table page</T>
          </g>
        )}
        {Array.from({ length: pages }).map((_, i) => (
          <Box key={i} x={20 + i * 60} y={55} w={52} h={40} label={"p" + i} cls={mode === 0 ? "d-warn" : i === 5 ? "d-ok" : "d-box"} />
        ))}
        <T x={20} y={115} cls="d-small">
          table pages touched: {touched} of {pages}
        </T>
      </svg>
      <div className="caption" style={{ textAlign: "left" }}>
        {notes[mode]}
      </div>
    </div>
  );
}

/* ---------------- ISOLATION ---------------- */
type Level = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
const LEVELS: Level[] = ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"];
type Step = { t1?: string; t2?: string; result: (l: Level) => { text: string; bad?: boolean; ok?: boolean } };
type Scenario = { name: string; story: string; steps: Step[] };

const li = (l: Level) => LEVELS.indexOf(l);
const SCENARIOS: Scenario[] = [
  {
    name: "Dirty read",
    story: "T2 reads a value T1 has written but not committed. T1 then rolls back, so T2 acted on data that never existed.",
    steps: [
      { t1: "BEGIN; UPDATE accounts SET balance = 0 WHERE id = 1;", result: () => ({ text: "T1 changed 500 → 0, not committed" }) },
      { t2: "SELECT balance FROM accounts WHERE id = 1;", result: (l) => (li(l) === 0 ? { text: "T2 sees 0 — a DIRTY READ", bad: true } : { text: "T2 sees 500 (last committed value)", ok: true }) },
      { t1: "ROLLBACK;", result: (l) => (li(l) === 0 ? { text: "The 0 never existed. T2 may have refused a valid payment.", bad: true } : { text: "Nothing to undo for T2.", ok: true }) },
    ],
  },
  {
    name: "Non-repeatable read",
    story: "T1 reads a row twice in one transaction and gets two different answers, because T2 committed a change in between.",
    steps: [
      { t1: "BEGIN; SELECT balance FROM accounts WHERE id = 1;", result: () => ({ text: "T1 sees 500" }) },
      { t2: "UPDATE accounts SET balance = 400 WHERE id = 1; COMMIT;", result: () => ({ text: "T2 committed 400" }) },
      { t1: "SELECT balance FROM accounts WHERE id = 1;", result: (l) => (li(l) <= 1 ? { text: "T1 now sees 400 — the row changed under its feet", bad: true } : { text: "T1 still sees 500: its snapshot is frozen at BEGIN", ok: true }) },
    ],
  },
  {
    name: "Phantom read",
    story: "T1 runs the same WHERE twice and a new row appears, inserted and committed by T2.",
    steps: [
      { t1: "BEGIN; SELECT COUNT(*) FROM accounts WHERE balance > 100;", result: () => ({ text: "T1 counts 3" }) },
      { t2: "INSERT INTO accounts (owner, balance) VALUES ('Zed', 200); COMMIT;", result: () => ({ text: "T2 added a 4th matching row" }) },
      { t1: "SELECT COUNT(*) FROM accounts WHERE balance > 100;", result: (l) => (li(l) <= 1 ? { text: "T1 counts 4 — a PHANTOM row appeared", bad: true } : li(l) === 2 ? { text: "SQL standard allows the phantom here, but Postgres and InnoDB snapshots return 3 for plain SELECTs (InnoDB UPDATEs can still hit phantoms).", ok: true } : { text: "T1 counts 3. Serializable behaves as if T1 ran alone.", ok: true }) },
    ],
  },
  {
    name: "Lost update",
    story: "Two transactions read the same balance, each computes a new value in the app, and the second write silently overwrites the first.",
    steps: [
      { t1: "BEGIN; SELECT balance FROM accounts WHERE id = 1;", result: () => ({ text: "T1 sees 500" }) },
      { t2: "BEGIN; SELECT balance FROM accounts WHERE id = 1;", result: () => ({ text: "T2 sees 500" }) },
      { t1: "UPDATE accounts SET balance = 400 WHERE id = 1; COMMIT;", result: () => ({ text: "T1 withdrew 100 → 400 committed" }) },
      { t2: "UPDATE accounts SET balance = 450 WHERE id = 1; COMMIT;", result: (l) => (li(l) <= 1 ? { text: "Balance is 450. T1's withdrawal of 100 is LOST.", bad: true } : li(l) === 2 ? { text: "Postgres: ERROR could not serialize access due to concurrent update → T2 retries. MySQL InnoDB: the UPDATE proceeds (still lost) unless you use SELECT … FOR UPDATE or balance = balance - 50.", ok: true } : { text: "ERROR: serialization failure. T2 must retry and will see 400.", ok: true }) },
    ],
  },
  {
    name: "Write skew",
    story: "Rule: at least one doctor must be on call. Both doctors check the rule (true), then both go off call. Each transaction was correct alone; together they broke the rule.",
    steps: [
      { t1: "BEGIN; SELECT COUNT(*) FROM doctors WHERE on_call;", result: () => ({ text: "T1 counts 2" }) },
      { t2: "BEGIN; SELECT COUNT(*) FROM doctors WHERE on_call;", result: () => ({ text: "T2 counts 2" }) },
      { t1: "UPDATE doctors SET on_call = false WHERE id = 1; COMMIT;", result: () => ({ text: "T1: 2 − 1 = 1 on call, fine" }) },
      { t2: "UPDATE doctors SET on_call = false WHERE id = 2; COMMIT;", result: (l) => (li(l) <= 2 ? { text: "Nobody is on call. No row was written twice, so RR cannot catch it. Only SERIALIZABLE (or an explicit lock / constraint) prevents WRITE SKEW.", bad: true } : { text: "ERROR: serialization failure. T2 retries, sees 1 on call, and is refused.", ok: true }) },
    ],
  },
];

export function IsolationSim() {
  const [s, setS] = useState(0);
  const [level, setLevel] = useState<Level>("READ COMMITTED");
  const [step, setStep] = useState(1);
  const sc = SCENARIOS[s];
  const shown = sc.steps.slice(0, step);
  return (
    <div className="diagram">
      <div className="chips">
        {SCENARIOS.map((x, i) => (
          <button key={x.name} className={`chip ${i === s ? "active" : ""}`} onClick={() => { setS(i); setStep(1); }}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="chips">
        {LEVELS.map((l) => (
          <button key={l} className={`chip ${l === level ? "active" : ""}`} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>
      <p className="small muted" style={{ margin: "0.3rem 0 0.6rem" }}>{sc.story}</p>
      <div className="timeline">
        <div className="hd">time</div>
        <div className="hd">Transaction 1</div>
        <div className="hd">Transaction 2</div>
        {shown.map((st, i) => {
          const r = st.result(level);
          const cls = r.bad ? "bad" : r.ok ? "ok" : i === shown.length - 1 ? "now" : "";
          return (
            <div key={i} style={{ display: "contents" }}>
              <div className="t">t{i + 1}</div>
              <div className={`ev ${st.t1 ? cls : "empty"}`}>{st.t1 && <code style={{ background: "transparent", padding: 0 }}>{st.t1}</code>}{st.t1 && <div className="small" style={{ marginTop: 4 }}>{r.text}</div>}</div>
              <div className={`ev ${st.t2 ? cls : "empty"}`}>{st.t2 && <code style={{ background: "transparent", padding: 0 }}>{st.t2}</code>}{st.t2 && <div className="small" style={{ marginTop: 4 }}>{r.text}</div>}</div>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: "0.6rem" }}>
        <button className="btn small" onClick={() => setStep(1)} disabled={step === 1}>↺ Restart</button>
        <button className="btn primary small" onClick={() => setStep((x) => Math.min(sc.steps.length, x + 1))} disabled={step >= sc.steps.length}>Next step ▸</button>
        <span className="small muted">step {step} of {sc.steps.length}</span>
      </div>
      <table className="tbl" style={{ marginTop: "0.8rem" }}>
        <thead><tr><th>Level</th><th>Dirty read</th><th>Non-repeatable</th><th>Phantom</th><th>Lost update</th><th>Write skew</th><th>Default in</th></tr></thead>
        <tbody>
          <tr><td>READ UNCOMMITTED</td><td>possible</td><td>possible</td><td>possible</td><td>possible</td><td>possible</td><td>(Postgres treats it as RC)</td></tr>
          <tr><td>READ COMMITTED</td><td>—</td><td>possible</td><td>possible</td><td>possible</td><td>possible</td><td>Postgres, Oracle, SQL Server</td></tr>
          <tr><td>REPEATABLE READ</td><td>—</td><td>—</td><td>standard: possible; PG/InnoDB: —</td><td>PG: error; InnoDB: possible</td><td>possible</td><td>MySQL InnoDB</td></tr>
          <tr><td>SERIALIZABLE</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>(opt-in; retry on failure)</td></tr>
        </tbody>
      </table>
    </div>
  );
}
