import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Database } from "sql.js";
import { exportShared, fromBase64, notifyChange, onChange, onReset, replaceShared, resetShared, sharedCopy, sharedDb, toBase64 } from "../lib/sqlBrowser";
import { insertTemplate, queryPlan, runScript, schemaInfo, toCsv, toObjects, type ResultSet, type StatementOutcome, type TableInfo } from "../lib/sqlCore";
import { useLocal } from "../lib/useLocal";
import { STARTERS } from "../courses/db/starters";
import { Diagram } from "./Diagrams";

const DEFAULT_SQL = `-- A real SQLite database with the shop data. Anything goes.
-- ⌘/Ctrl+Enter runs everything; select some text to run only that.
SELECT c.name, COUNT(DISTINCT o.id) AS orders, ROUND(SUM(oi.qty * oi.unit_price), 2) AS spent
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY spent DESC;`;

type Hist = { sql: string; at: number; ok: boolean; info: string };
type Saved = { name: string; sql: string };
type Side = "schema" | "starters" | "history" | "saved";

const AUTO_KEY = "fsm-pg-auto";
const SNAP_KEY = "fsm-pg-snap";
let restoredThisSession = false;

function firstLine(sql: string, n = 70): string {
  const line = sql.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("--")) ?? sql.trim();
  return line.length > n ? line.slice(0, n - 1) + "…" : line;
}
function when(ts: number): string {
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- results grid: sortable, limited, exportable ---------------- */

function Cell({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="null">NULL</span>;
  if (typeof v === "number" && !Number.isInteger(v)) return <>{Number(v.toFixed(4))}</>;
  if (v instanceof Uint8Array) return <span className="muted">blob · {v.length} B</span>;
  return <>{String(v)}</>;
}

function Grid({ rs, limit, label }: { rs: ResultSet; limit: number; label: string }) {
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [all, setAll] = useState(false);
  const [flash, setFlash] = useState("");
  const rows = useMemo(() => {
    if (!sort) return rs.rows;
    const { col, dir } = sort;
    return [...rs.rows].sort((a, b) => {
      const x = a[col];
      const y = b[col];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir;
    });
  }, [rs, sort]);
  const shown = all ? rows : rows.slice(0, limit);
  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 1500);
  };
  return (
    <div className="pg-grid">
      <div className="pg-grid-wrap">
        <table className="tbl results">
          <thead>
            <tr>
              <th className="rownum">#</th>
              {rs.columns.map((c, i) => (
                <th key={i} onClick={() => setSort(sort && sort.col === i ? (sort.dir === 1 ? { col: i, dir: -1 } : null) : { col: i, dir: 1 })} title="Click to sort">
                  {c}
                  {sort?.col === i && <span className="sortmark">{sort.dir === 1 ? " ▲" : " ▼"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                <td className="rownum">{i + 1}</td>
                {r.map((c, j) => (
                  <td key={j}>
                    <Cell v={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pg-grid-foot small muted">
        <span>
          {rs.rows.length} row{rs.rows.length === 1 ? "" : "s"}
          {rs.rows.length > shown.length ? ` · showing first ${shown.length}` : ""}
          {sort ? " · sorted by " + rs.columns[sort.col] : ""}
        </span>
        {rs.rows.length > limit && (
          <button className="readmore" onClick={() => setAll(!all)}>
            {all ? `show first ${limit}` : "show all"}
          </button>
        )}
        <span className="spacer" />
        <button className="readmore" onClick={() => void copyText(toCsv(rs)).then((ok) => say(ok ? "CSV copied" : "copy blocked"))}>copy CSV</button>
        <button className="readmore" onClick={() => void copyText(JSON.stringify(toObjects(rs), null, 2)).then((ok) => say(ok ? "JSON copied" : "copy blocked"))}>copy JSON</button>
        <button className="readmore" onClick={() => download(`${label || "result"}.csv`, toCsv(rs), "text/csv")}>download CSV</button>
        {flash && <span className="pg-flash">{flash}</span>}
      </div>
    </div>
  );
}

/* ---------------- one statement's outcome ---------------- */

function StepView({ step, n, total, limit }: { step: StatementOutcome; n: number; total: number; limit: number }) {
  const head = (
    <div className="pg-step-head">
      <span className="pg-step-n">{total > 1 ? `${n}/${total}` : "result"}</span>
      <code className="pg-step-sql">{firstLine(step.sql)}</code>
      {step.ok ? (
        step.result ? (
          <span className="pill ok">{step.result.rows.length} row{step.result.rows.length === 1 ? "" : "s"}</span>
        ) : (
          <span className="pill muted">{step.changes} changed</span>
        )
      ) : (
        <span className="pill bad">error</span>
      )}
      <span className="muted small">{step.ms.toFixed(1)} ms</span>
    </div>
  );
  return (
    <div className={`pg-step ${step.ok ? "" : "bad"}`}>
      {head}
      {!step.ok && <div className="err">{step.error}</div>}
      {step.ok && step.result && <Grid rs={step.result} limit={limit} label={`statement-${n}`} />}
      {step.ok && !step.result && (
        <div className="small muted" style={{ padding: "0.2rem 0 0.4rem" }}>
          OK. {step.changes} row{step.changes === 1 ? "" : "s"} changed, nothing to show.
        </div>
      )}
    </div>
  );
}

/* ---------------- schema browser ---------------- */

function TableRow({ t, open, onToggle, onSelect, onInsert, onJump, all }: { t: TableInfo; open: boolean; onToggle: () => void; onSelect: () => void; onInsert: () => void; onJump: (name: string) => void; all: TableInfo[] }) {
  const [ddl, setDdl] = useState(false);
  const refs = all.filter((o) => o.fks.some((f) => f.table === t.name));
  return (
    <div className={`pg-table ${open ? "open" : ""}`}>
      <div className="pg-table-head">
        <button className="pg-table-name" onClick={onToggle} title="Show columns">
          <span className="caret">{open ? "▾" : "▸"}</span>
          {t.kind === "view" ? <span className="muted">view </span> : null}
          {t.name}
        </button>
        <span className="pill muted">{t.rows < 0 ? "?" : t.rows}</span>
        <button className="readmore" onClick={onSelect} title="SELECT * FROM this table">
          rows
        </button>
      </div>
      {open && (
        <div className="pg-cols">
          {t.columns.map((c) => {
            const fk = t.fks.find((f) => f.from === c.name);
            return (
              <div key={c.name} className="pg-col">
                <span className="pg-col-name">
                  {c.pk ? <span title="primary key">🔑 </span> : null}
                  {c.name}
                </span>
                <span className="pg-col-type muted">{c.type || "any"}</span>
                {c.notnull && !c.pk ? <span className="pg-badge">NN</span> : null}
                {c.dflt !== null ? <span className="pg-badge" title={"default " + c.dflt}>def</span> : null}
                {fk ? (
                  <button className="pg-fk" onClick={() => onJump(fk.table)} title={`references ${fk.table}(${fk.to})`}>
                    → {fk.table}.{fk.to}
                  </button>
                ) : null}
              </div>
            );
          })}
          {t.indexes.filter((i) => !i.auto).length > 0 && (
            <div className="small muted" style={{ marginTop: "0.3rem" }}>
              indexes: {t.indexes.filter((i) => !i.auto).map((i) => `${i.name}(${i.columns.join(", ")})${i.unique ? " unique" : ""}`).join(" · ")}
            </div>
          )}
          {refs.length > 0 && (
            <div className="small muted">
              referenced by:{" "}
              {refs.map((r, i) => (
                <span key={r.name}>
                  {i ? ", " : ""}
                  <button className="readmore" onClick={() => onJump(r.name)}>
                    {r.name}
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: "0.4rem", gap: "0.4rem" }}>
            <button className="btn small" onClick={onSelect}>SELECT *</button>
            {t.kind === "table" && (
              <button className="btn small" onClick={onInsert}>INSERT template</button>
            )}
            <button className="btn small" onClick={() => setDdl(!ddl)}>{ddl ? "hide DDL" : "DDL"}</button>
          </div>
          {ddl && <pre className="code" style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}>{t.sql}</pre>}
        </div>
      )}
    </div>
  );
}

function SchemaPanel({ schema, onSelect, onInsert, onRefresh }: { schema: TableInfo[]; onSelect: (t: TableInfo) => void; onInsert: (t: TableInfo) => void; onRefresh: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const toggle = (n: string) => setOpen((o) => ({ ...o, [n]: !o[n] }));
  const jump = (n: string) => {
    setOpen((o) => ({ ...o, [n]: true }));
    setTimeout(() => document.getElementById("pg-t-" + n)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0);
  };
  const shown = schema.filter((t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()) || t.columns.some((c) => c.name.toLowerCase().includes(filter.toLowerCase())));
  const totalRows = schema.reduce((a, t) => a + Math.max(0, t.rows), 0);
  return (
    <div className="pg-panel">
      <div className="row" style={{ gap: "0.4rem", marginBottom: "0.5rem" }}>
        <input className="pg-filter" placeholder="filter tables or columns" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className="btn small" onClick={onRefresh} title="Re-read the schema">↻</button>
      </div>
      <div className="small muted" style={{ marginBottom: "0.4rem" }}>
        {schema.filter((t) => t.kind === "table").length} tables · {schema.filter((t) => t.kind === "view").length} views · {totalRows} rows
      </div>
      {shown.map((t) => (
        <div key={t.name} id={"pg-t-" + t.name}>
          <TableRow t={t} all={schema} open={!!open[t.name]} onToggle={() => toggle(t.name)} onSelect={() => onSelect(t)} onInsert={() => onInsert(t)} onJump={jump} />
        </div>
      ))}
      {!shown.length && <div className="small muted">nothing matches</div>}
    </div>
  );
}

/* ---------------- side panels: starters, history, saved ---------------- */

function StartersPanel({ onPick }: { onPick: (sql: string, run: boolean) => void }) {
  const [open, setOpen] = useLocal<string>("fsm-pg-starter-group", STARTERS[0].group);
  return (
    <div className="pg-panel">
      {STARTERS.map((g) => (
        <div key={g.group} className="pg-group">
          <button className="pg-group-head" onClick={() => setOpen(open === g.group ? "" : g.group)}>
            <span className="caret">{open === g.group ? "▾" : "▸"}</span> {g.group} <span className="muted small">· {g.items.length}</span>
          </button>
          {open === g.group &&
            g.items.map((it) => (
              <div key={it.title} className="pg-item">
                <button className="pg-item-title" onClick={() => onPick(it.sql, true)} title="Load and run">
                  ▶ {it.title}
                </button>
                <button className="readmore" onClick={() => onPick(it.sql, false)} title="Load into the editor without running">
                  edit
                </button>
                {it.note && <div className="small muted">{it.note}</div>}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ items, onPick, onClear, onRemove }: { items: Hist[]; onPick: (sql: string, run: boolean) => void; onClear: () => void; onRemove: (i: number) => void }) {
  if (!items.length) return <div className="pg-panel small muted">Nothing run yet. Every run lands here, newest first, and survives reloads.</div>;
  return (
    <div className="pg-panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.4rem" }}>
        <span className="small muted">{items.length} runs</span>
        <button className="readmore" onClick={onClear}>clear</button>
      </div>
      {items.map((h, i) => (
        <div key={h.at + ":" + i} className={`pg-item ${h.ok ? "" : "bad"}`}>
          <button className="pg-item-title" onClick={() => onPick(h.sql, true)} title="Run again">
            ▶ <code>{firstLine(h.sql, 48)}</code>
          </button>
          <button className="readmore" onClick={() => onPick(h.sql, false)}>edit</button>
          <button className="readmore" onClick={() => onRemove(i)} title="Remove">×</button>
          <div className="small muted">
            {when(h.at)} · {h.info}
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedPanel({ items, onPick, onRemove, onSave }: { items: Saved[]; onPick: (sql: string, run: boolean) => void; onRemove: (i: number) => void; onSave: () => void }) {
  return (
    <div className="pg-panel">
      <button className="btn small primary" onClick={onSave} style={{ marginBottom: "0.5rem" }}>
        + Save the editor as…
      </button>
      {!items.length && <div className="small muted">Name a query and keep it here. Saved queries survive reloads.</div>}
      {items.map((s, i) => (
        <div key={s.name} className="pg-item">
          <button className="pg-item-title" onClick={() => onPick(s.sql, true)} title="Run">
            ▶ {s.name}
          </button>
          <button className="readmore" onClick={() => onPick(s.sql, false)}>edit</button>
          <button className="readmore" onClick={() => onRemove(i)} title="Delete">×</button>
          <div className="small muted">
            <code>{firstLine(s.sql, 56)}</code>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- the page ---------------- */

export default function Playground() {
  const [ready, setReady] = useState(false);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [text, setText] = useLocal<string>("fsm-pg-sql", DEFAULT_SQL);
  const [out, setOut] = useState<{ steps: StatementOutcome[]; ms: number; partial: boolean } | null>(null);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [side, setSide] = useLocal<Side>("fsm-pg-side", "schema");
  const [history, setHistory] = useLocal<Hist[]>("fsm-pg-history", []);
  const [saved, setSaved] = useLocal<Saved[]>("fsm-pg-saved", []);
  const [autosave, setAutosave] = useLocal<boolean>("fsm-pg-autosave", false);
  const [showErd, setShowErd] = useLocal<boolean>("fsm-pg-erd", false);
  const [limit, setLimit] = useLocal<number>("fsm-pg-limit", 100);
  const [sideOpen, setSideOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [hasSel, setHasSel] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  async function refresh() {
    const db = await sharedDb();
    setSchema(schemaInfo(db));
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      await sharedDb();
      if (autosave && !restoredThisSession) {
        restoredThisSession = true;
        try {
          const b64 = localStorage.getItem(AUTO_KEY);
          if (b64) await replaceShared(fromBase64(b64));
        } catch {
          /* ignore */
        }
      }
      if (!alive) return;
      await refresh();
      setReady(true);
    })();
    const off1 = onChange(() => void refresh());
    const off2 = onReset(() => {
      setOut(null);
      setPlan(null);
    });
    return () => {
      alive = false;
      off1();
      off2();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(db: Database) {
    if (!autosave) return;
    try {
      localStorage.setItem(AUTO_KEY, toBase64(db.export()));
    } catch {
      say("could not auto-save (storage full?)");
    }
  }

  function selection(): string {
    const ta = taRef.current;
    if (!ta || ta.selectionStart === ta.selectionEnd) return "";
    return ta.value.slice(ta.selectionStart, ta.selectionEnd);
  }

  async function run(sqlOverride?: string) {
    const sel = sqlOverride === undefined ? selection() : "";
    const sql = sqlOverride ?? (sel.trim() ? sel : text);
    if (!sql.trim()) return;
    const db = await sharedDb();
    const r = runScript(db, sql);
    setOut({ ...r, partial: !!sel.trim() && sqlOverride === undefined });
    setPlan(null);
    const okAll = r.steps.every((s) => s.ok);
    const last = r.steps[r.steps.length - 1];
    const info = !last ? "empty" : !last.ok ? "error" : last.result ? `${last.result.rows.length} rows` : `${last.changes} changed`;
    setHistory((h) => [{ sql, at: Date.now(), ok: okAll, info }, ...h.filter((x) => x.sql !== sql)].slice(0, 100));
    notifyChange();
    persist(db);
  }

  async function showPlan() {
    // On a copy: earlier statements in the script run there, so the plan is honest and nothing on the real data changes.
    const db = await sharedCopy();
    const sel = selection();
    setPlan(queryPlan(db, sel.trim() ? sel : text));
    db.close();
  }

  function load(sql: string, andRun: boolean) {
    setText(sql);
    setSideOpen(false);
    if (andRun) void run(sql);
    else setTimeout(() => taRef.current?.focus(), 0);
  }

  function insertAtCursor(snippet: string) {
    const ta = taRef.current;
    if (!ta) return setText(text + "\n\n" + snippet);
    const a = ta.selectionStart;
    const b = ta.selectionEnd;
    const before = text.slice(0, a);
    const after = text.slice(b);
    const pad = before && !before.endsWith("\n") ? "\n\n" : "";
    setText(before + pad + snippet + after);
    setTimeout(() => {
      ta.focus();
      const pos = (before + pad + snippet).length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  async function reset() {
    if (!confirm("Throw away every change and reload the sample data?")) return;
    await resetShared();
    try {
      localStorage.removeItem(AUTO_KEY);
    } catch {
      /* ignore */
    }
    say("sample data restored");
  }

  async function saveSnapshot() {
    try {
      localStorage.setItem(SNAP_KEY, toBase64(await exportShared()));
      say("snapshot saved in this browser");
    } catch {
      say("could not save (storage full?)");
    }
  }
  async function loadSnapshot() {
    let b64: string | null = null;
    try {
      b64 = localStorage.getItem(SNAP_KEY);
    } catch {
      /* ignore */
    }
    if (!b64) return say("no snapshot saved yet");
    if (!confirm("Replace the current data with your saved snapshot?")) return;
    await replaceShared(fromBase64(b64));
    say("snapshot loaded");
  }
  async function downloadDb() {
    const bytes = await exportShared();
    download("shop.sqlite", new Uint8Array(bytes).buffer as ArrayBuffer, "application/vnd.sqlite3");
  }
  async function uploadDb(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      await replaceShared(bytes);
      say(`loaded ${file.name}`);
    } catch (e) {
      say("not a SQLite file: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function saveQuery() {
    const name = prompt("Name for this query:", firstLine(text, 40));
    if (!name) return;
    setSaved((s) => [{ name, sql: text }, ...s.filter((x) => x.name !== name)]);
    setSide("saved");
  }

  const tableCount = schema.filter((t) => t.kind === "table").length;
  const sidePanel: ReactNode =
    side === "schema" ? (
      <SchemaPanel schema={schema} onRefresh={() => void refresh()} onSelect={(t) => load(`SELECT * FROM ${t.name} LIMIT ${limit};`, true)} onInsert={(t) => { insertAtCursor(insertTemplate(t)); setSideOpen(false); }} />
    ) : side === "starters" ? (
      <StartersPanel onPick={load} />
    ) : side === "history" ? (
      <HistoryPanel items={history} onPick={load} onClear={() => setHistory([])} onRemove={(i) => setHistory((h) => h.filter((_, j) => j !== i))} />
    ) : (
      <SavedPanel items={saved} onPick={load} onRemove={(i) => setSaved((s) => s.filter((_, j) => j !== i))} onSave={saveQuery} />
    );

  return (
    <div className="pg">
      <div className="pg-top">
        <div>
          <h1 style={{ margin: 0 }}>SQL playground</h1>
          <div className="small muted">
            Real SQLite in your browser · the same shop data the lessons use · {ready ? `${tableCount} tables` : "loading engine…"}
          </div>
        </div>
        <div className="row pg-tools">
          <button className="btn small" onClick={() => setShowErd(!showErd)}>{showErd ? "hide" : "show"} ERD</button>
          <button className="btn small" onClick={() => void saveSnapshot()} title="Keep a copy of the current data in this browser">📷 snapshot</button>
          <button className="btn small" onClick={() => void loadSnapshot()} title="Go back to the saved copy">load snapshot</button>
          <button className="btn small" onClick={() => void downloadDb()} title="Download the whole database as a .sqlite file">⬇ .sqlite</button>
          <button className="btn small" onClick={() => fileRef.current?.click()} title="Open a .sqlite file from your computer">⬆ open</button>
          <input ref={fileRef} type="file" accept=".sqlite,.db,.sqlite3" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDb(f); e.target.value = ""; }} />
          <label className="small muted pg-check" title="Write the data to this browser after every run, so it survives reloads">
            <input type="checkbox" checked={autosave} onChange={(e) => { setAutosave(e.target.checked); if (e.target.checked) void sharedDb().then((db) => { try { localStorage.setItem(AUTO_KEY, toBase64(db.export())); } catch { /* ignore */ } }); }} /> keep my changes
          </label>
          <button className="btn small" onClick={() => void reset()} title="Throw away every change and reseed">↺ reset data</button>
        </div>
      </div>
      {msg && <div className="pg-msg">{msg}</div>}
      {showErd && (
        <div className="card soft" style={{ padding: "0.6rem 0.8rem" }}>
          <Diagram id="erd" />
        </div>
      )}

      <div className="pg-body">
        <aside className={`pg-side ${sideOpen ? "open" : ""}`}>
          <div className="pg-tabs">
            {(["schema", "starters", "history", "saved"] as Side[]).map((s) => (
              <button key={s} className={`chip small ${side === s ? "active" : ""}`} onClick={() => setSide(s)}>
                {s === "schema" ? "Schema" : s === "starters" ? "Starters" : s === "history" ? `History${history.length ? " · " + history.length : ""}` : `Saved${saved.length ? " · " + saved.length : ""}`}
              </button>
            ))}
          </div>
          {sidePanel}
        </aside>

        <main className="pg-main">
          <div className="sqlrunner pg-editor">
            <div className="head">
              <span>Editor</span>
              <span className="muted" style={{ fontWeight: 400 }}>
                ⌘/Ctrl+Enter runs · ⌘/Ctrl+Shift+Enter shows the plan · select text to run part
              </span>
            </div>
            <textarea
              ref={taRef}
              value={text}
              spellCheck={false}
              onChange={(e) => setText(e.target.value)}
              onSelect={() => setHasSel(!!selection().trim())}
              onKeyUp={() => setHasSel(!!selection().trim())}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) void showPlan();
                  else void run();
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  insertAtCursor("  ");
                }
              }}
              rows={Math.min(24, Math.max(6, text.split("\n").length + 1))}
            />
            <div className="actions">
              <button className="btn primary small" onClick={() => void run()} disabled={!ready}>
                ▶ Run{hasSel ? " selection" : ""}
              </button>
              <button className="btn small" onClick={() => void showPlan()} disabled={!ready}>Show plan</button>
              <button className="btn small" onClick={saveQuery}>Save as…</button>
              <button className="btn small" onClick={() => { setText(""); taRef.current?.focus(); }}>Clear</button>
              <button className="btn small pg-sidebtn" onClick={() => setSideOpen(!sideOpen)}>{sideOpen ? "hide panel" : "schema & starters"}</button>
              <label className="small muted" style={{ marginLeft: "auto" }}>
                rows per result{" "}
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                  {[25, 100, 500, 5000].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {plan && (
            <div className="card soft">
              <div className="small" style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Query plan</div>
              <pre className="plan" style={{ fontFamily: "var(--mono)", fontSize: "0.82rem", whiteSpace: "pre", margin: 0 }}>
                {plan.length ? plan.map((l) => "  " + l).join("\n") : "(nothing to plan)"}
              </pre>
              <div className="small muted" style={{ marginTop: "0.4rem" }}>Plan for the last statement, worked out on a copy of your data (nothing changed). SCAN reads the whole table. SEARCH … USING INDEX jumps straight to the rows.</div>
            </div>
          )}

          {out && (
            <div className="pg-out">
              <div className="small muted" style={{ marginBottom: "0.3rem" }}>
                {out.partial ? "Ran the selected text" : "Ran the editor"} · {out.steps.length} statement{out.steps.length === 1 ? "" : "s"} · {out.ms.toFixed(1)} ms
                {out.steps.some((s) => !s.ok) && out.steps.length > 1 ? " · stopped at the first error; earlier statements already took effect" : ""}
              </div>
              {out.steps.map((s, i) => (
                <StepView key={i} step={s} n={i + 1} total={out.steps.length} limit={limit} />
              ))}
            </div>
          )}

          {!out && !plan && (
            <div className="card soft small muted">
              <b>How to use it.</b> Pick a table on the left to see its rows, or a starter query to load and run it. Write anything: CREATE, INSERT, UPDATE, DELETE, transactions, window functions, recursive CTEs. Every statement gets its own result. Reset data brings the shop back. Tick <i>keep my changes</i> if you want your edits to survive a reload.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
