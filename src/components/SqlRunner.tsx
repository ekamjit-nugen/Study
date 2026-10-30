import { useEffect, useMemo, useRef, useState } from "react";
import type { Database } from "sql.js";
import { freshDb, notifyChange, onChange, onReset, projectDb, resetProject, resetShared, saveProject, sharedDb } from "../lib/sqlBrowser";
import { lastResult, peekTable, queryPlan, referencedTables, runSql, sameRows, tableNames, type ResultSet, type RunOutcome } from "../lib/sqlCore";
import { useLocal } from "../lib/useLocal";
import { inline } from "../lib/md";

type Props = {
  sql: string;
  title?: string;
  note?: string;
  explain?: boolean;
  /** Solution SQL: enables "Check my answer" on a fresh database. */
  solution?: string;
  /** Run as soon as the engine is ready. */
  auto?: boolean;
  /** localStorage key for the learner's draft. */
  draftKey?: string;
  /** Which database to run against: the lesson data (default) or the learner's own project build. */
  target?: "shared" | "project";
  /** Called with the editor text whenever it changes (and once on mount). */
  onChange?: (text: string) => void;
};

function Cell({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="null">NULL</span>;
  if (typeof v === "number" && !Number.isInteger(v)) return <>{Number(v.toFixed(2))}</>;
  return <>{String(v)}</>;
}

export function ResultTable({ rs, max = 50, footer = true }: { rs: ResultSet; max?: number; footer?: boolean }) {
  const rows = rs.rows.slice(0, max);
  return (
    <>
      <table className="tbl results">
        <thead>
          <tr>
            {rs.columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>
                  <Cell v={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer && (
        <div className="small muted">
          {rs.rows.length} row{rs.rows.length === 1 ? "" : "s"}
          {rs.rows.length > max ? ` (showing first ${max})` : ""}
        </div>
      )}
    </>
  );
}

type Peek = { name: string; rs: ResultSet; total: number };

/** The tables a script touches, with their live rows, so the data sits next to the query. */
function TablePeek({ sql, target }: { sql: string; target: "shared" | "project" }) {
  const [version, setVersion] = useState(0);
  useEffect(() => onChange(() => setVersion((v) => v + 1)), []);
  const [peeks, setPeeks] = useState<Peek[]>([]);
  const [active, setActive] = useState(0);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useLocal<boolean>("fsm-peek-open", true);
  useEffect(() => {
    let alive = true;
    void (target === "project" ? projectDb() : sharedDb()).then((db) => {
      if (!alive) return;
      const refs = referencedTables(sql, tableNames(db));
      setPeeks(refs.map((name) => { const p = peekTable(db, name, all ? 200 : 6); return { name, rs: { columns: p.columns, rows: p.rows }, total: p.total }; }));
    });
    return () => { alive = false; };
  }, [sql, version, all, target]);
  if (!peeks.length) return null;
  const cur = peeks[Math.min(active, peeks.length - 1)];
  return (
    <div className="peek">
      <div className="peek-head">
        <button className="readmore" onClick={() => setOpen(!open)}>
          {open ? "▾" : "▸"} Data used by this example
        </button>
        <div className="chips" style={{ margin: 0 }}>
          {peeks.map((p, i) => (
            <button key={p.name} className={`chip small ${i === Math.min(active, peeks.length - 1) ? "active" : ""}`} onClick={() => { setActive(i); setOpen(true); }}>
              {p.name} <span className="muted">· {p.total}</span>
            </button>
          ))}
        </div>
      </div>
      {open && (
        <div className="peek-body">
          {cur.rs.rows.length === 0 ? (
            <div className="small muted">{cur.name} is empty · columns: {cur.rs.columns.join(", ")}</div>
          ) : (
            <>
              <ResultTable rs={cur.rs} max={all ? 200 : 6} footer={false} />
              <span className="small muted">
                {all ? `all ${cur.total} rows` : `first ${Math.min(6, cur.total)} of ${cur.total} rows`}
                {cur.total > 6 && (
                  <>
                    {" · "}
                    <button className="readmore" onClick={() => setAll(!all)}>
                      {all ? "show first 6 only" : "show all"}
                    </button>
                  </>
                )}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SqlRunner({ sql, title, note, explain, solution, auto, draftKey, target = "shared", onChange }: Props) {
  const initial = useMemo(() => {
    if (draftKey) {
      try {
        const d = localStorage.getItem(draftKey);
        if (d) return d;
      } catch {
        /* ignore */
      }
    }
    return sql;
  }, [draftKey, sql]);
  const [text, setText] = useState(initial);
  const [out, setOut] = useState<RunOutcome | null>(null);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [check, setCheck] = useState<null | { ok: boolean; expected?: ResultSet; msg: string }>(null);
  const [busy, setBusy] = useState(false);
  const dbRef = useRef<Database | null>(null);

  useEffect(() => {
    if (draftKey && text !== sql) {
      try {
        localStorage.setItem(draftKey, text);
      } catch {
        /* ignore */
      }
    }
  }, [draftKey, text, sql]);

  useEffect(() => onReset(() => setOut(null)), []);
  useEffect(() => {
    onChange?.(text);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDb = async () => dbRef.current ?? (dbRef.current = await (target === "project" ? projectDb() : sharedDb()));

  async function run() {
    setBusy(true);
    setPlan(null);
    setCheck(null);
    const db = await getDb();
    setOut(runSql(db, text));
    if (target === "project") saveProject();
    notifyChange();
    setBusy(false);
  }

  useEffect(() => {
    if (auto) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function showPlan() {
    const db = await getDb();
    setPlan(queryPlan(db, text));
    if (target === "project") saveProject();
    notifyChange();
  }

  async function checkAnswer() {
    if (!solution) return;
    setBusy(true);
    const a = await freshDb();
    const mine = runSql(a, text);
    a.close();
    const b = await freshDb();
    const theirs = runSql(b, solution);
    b.close();
    setOut(mine);
    setPlan(null);
    if (!mine.ok) setCheck({ ok: false, msg: "Your SQL has an error. Fix it and check again." });
    else if (sameRows(lastResult(mine), lastResult(theirs))) setCheck({ ok: true, msg: "Correct! Your rows match the expected result." });
    else setCheck({ ok: false, expected: lastResult(theirs), msg: "Not yet. Compare your rows with the expected rows below." });
    setBusy(false);
  }

  async function reset() {
    if (target === "project") {
      if (!confirm("Reset your whole project database? Everything you built will be gone.")) return;
      await resetProject();
      dbRef.current = await projectDb();
    } else {
      await resetShared();
      dbRef.current = await sharedDb();
    }
    setOut(null);
    setPlan(null);
    setCheck(null);
  }

  return (
    <div className="sqlrunner">
      <div className="head">
        <span>{title ? inline(title) : solution ? "Your answer" : "Try it"}</span>
        <span className="muted" style={{ fontWeight: 400 }}>
          {target === "project" ? "your project DB" : "SQLite"} · ⌘/Ctrl+Enter runs
        </span>
      </div>
      <TablePeek sql={(solution ? solution + "\n" : "") + text} target={target} />
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void run();
          }
        }}
        rows={Math.min(18, Math.max(3, text.split("\n").length + 1))}
      />
      <div className="actions">
        <button className="btn primary small" onClick={() => void run()} disabled={busy}>
          ▶ Run
        </button>
        {solution && (
          <button className="btn ok small" onClick={() => void checkAnswer()} disabled={busy}>
            ✓ Check my answer
          </button>
        )}
        {explain && (
          <button className="btn small" onClick={() => void showPlan()} disabled={busy}>
            Show plan
          </button>
        )}
        {text !== sql && (
          <button className="btn small" onClick={() => setText(sql)}>
            Restore
          </button>
        )}
        <button className="btn small" onClick={() => void reset()} title={target === "project" ? "Start the project from an empty database" : "Throw away every change and reseed the sample data"}>
          {target === "project" ? "↺ Reset project" : "↺ Reset data"}
        </button>
        {out && out.ok && <span className="meta">{out.ms.toFixed(1)} ms</span>}
      </div>
      {(out || plan || check) && (
        <div className="out">
          {check && <div className={check.ok ? "result-ok" : "result-bad"}>{check.msg}</div>}
          {out && !out.ok && <div className="err">{out.error}</div>}
          {out && out.ok && out.results.length === 0 && (
            <div className="small muted">
              OK — {out.changes} row{out.changes === 1 ? "" : "s"} changed, no rows returned.
            </div>
          )}
          {out && out.ok && out.results.map((rs, i) => <ResultTable key={i} rs={rs} />)}
          {check && !check.ok && check.expected && (
            <div style={{ marginTop: "0.6rem" }}>
              <div className="small" style={{ fontWeight: 700 }}>
                Expected rows
              </div>
              <ResultTable rs={check.expected} />
            </div>
          )}
          {plan && (
            <div className="plan">
              {"QUERY PLAN\n" + plan.map((l) => "  " + l).join("\n")}
            </div>
          )}
        </div>
      )}
      {note && (
        <div className="small muted" style={{ padding: "0 0.8rem 0.6rem" }}>
          {inline(note)}
        </div>
      )}
    </div>
  );
}
