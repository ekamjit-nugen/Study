import { useState, type ReactNode } from "react";
import { inline, Prose } from "../lib/md";
import type { CodeExample, Table } from "../courses/types";

export function Tldr({ points }: { points: string[] }) {
  return (
    <div className="card tldr">
      <h3>In 30 seconds</h3>
      <ul>
        {points.map((p, i) => (
          <li key={i}>{inline(p)}</li>
        ))}
      </ul>
    </div>
  );
}

export function Words({ words }: { words: [string, string][] }) {
  return (
    <div className="card soft">
      <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>New words</h3>
      <div className="words">
        {words.map(([t, m]) => (
          <div className="word" key={t}>
            <b>{t}</b> <span className="muted">—</span> {inline(m)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Callout({ kind, label, text }: { kind: "tip" | "warn"; label: string; text: string }) {
  return (
    <div className={`callout ${kind}`}>
      <b>{label}</b>
      {inline(text)}
    </div>
  );
}

export function More({ title = "More detail", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="more">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}

export function DataTable({ table }: { table: Table }) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          {table.head.map((h) => (
            <th key={h}>{inline(h)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{inline(c)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Tap a card to reveal its answer. */
export function TapCards({ items }: { items: { q: string; a: ReactNode | string; tag?: ReactNode }[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <div className="tapcards">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        if (!it.a)
          return (
            <div key={i} className="tapcard flat">
              <div className="q">
                <span>{inline(it.q)}</span>
                {it.tag}
              </div>
            </div>
          );
        return (
          <div key={i} className={`tapcard ${isOpen ? "open" : ""}`}>
            <button
              className="q"
              onClick={() =>
                setOpen((s) => {
                  const n = new Set(s);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                })
              }
            >
              <span>{inline(it.q)}</span>
              {it.tag}
            </button>
            {isOpen && <div className="a">{typeof it.a === "string" ? <Prose text={it.a} /> : it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

const SQL_KW =
  /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|AS|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE|CREATE TABLE|CREATE INDEX|CREATE UNIQUE INDEX|DROP|ALTER TABLE|ADD|PRIMARY KEY|FOREIGN KEY|REFERENCES|UNIQUE|CHECK|DEFAULT|BEGIN|COMMIT|ROLLBACK|TRANSACTION|WITH|RECURSIVE|UNION ALL|UNION|CASE|WHEN|THEN|ELSE|END|DISTINCT|COUNT|SUM|AVG|MIN|MAX|COALESCE|EXISTS|BETWEEN|LIKE|OVER|PARTITION BY|ROWS|RANGE|UNBOUNDED|PRECEDING|FOLLOWING|CURRENT ROW|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|NTILE|ASC|DESC|INTEGER|TEXT|REAL|DATE|DATETIME|BOOLEAN|CASCADE|RETURNING|ON CONFLICT|DO UPDATE|DO NOTHING|EXCLUDED|EXPLAIN QUERY PLAN|EXPLAIN|ANALYZE|VACUUM|PRAGMA|SAVEPOINT|RELEASE|FOR UPDATE|SKIP LOCKED|NOWAIT|TRUE|FALSE)\b/gi;

export function highlightSql(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = src.split("\n");
  lines.forEach((line, li) => {
    const cmIdx = line.indexOf("--");
    const codePart = cmIdx >= 0 ? line.slice(0, cmIdx) : line;
    const cmPart = cmIdx >= 0 ? line.slice(cmIdx) : "";
    let last = 0;
    const re = /('[^']*'|\b\d+(\.\d+)?\b)/g;
    let m: RegExpExecArray | null;
    const pieces: ReactNode[] = [];
    let k = 0;
    const pushKw = (text: string) => {
      let l2 = 0;
      let mm: RegExpExecArray | null;
      SQL_KW.lastIndex = 0;
      while ((mm = SQL_KW.exec(text))) {
        if (mm.index > l2) pieces.push(text.slice(l2, mm.index));
        pieces.push(
          <span className="kw" key={`k${li}-${k++}`}>
            {mm[0]}
          </span>,
        );
        l2 = mm.index + mm[0].length;
      }
      if (l2 < text.length) pieces.push(text.slice(l2));
    };
    while ((m = re.exec(codePart))) {
      if (m.index > last) pushKw(codePart.slice(last, m.index));
      pieces.push(
        <span className={m[0].startsWith("'") ? "str" : "num"} key={`s${li}-${k++}`}>
          {m[0]}
        </span>,
      );
      last = m.index + m[0].length;
    }
    if (last < codePart.length) pushKw(codePart.slice(last));
    if (cmPart)
      pieces.push(
        <span className="cm" key={`c${li}`}>
          {cmPart}
        </span>,
      );
    out.push(
      <span key={li}>
        {pieces}
        {li < lines.length - 1 ? "\n" : ""}
      </span>,
    );
  });
  return out;
}

function highlightTs(src: string): ReactNode[] {
  const re = /(\/\/.*$|`[^`]*`|'[^']*'|"[^"]*"|\b(?:const|let|var|function|return|await|async|import|from|export|if|else|for|of|in|new|class|extends|try|catch|finally|throw|interface|type|implements|this|null|undefined|true|false|while|switch|case|break|default|typeof|readonly|private|public|constructor|yield)\b|\b\d+(?:\.\d+)?\b)/gm;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const t = m[0];
    const cls = t.startsWith("//") ? "cm" : /^["'`]/.test(t) ? "str" : /^\d/.test(t) ? "num" : "kw";
    out.push(
      <span className={cls} key={k++}>
        {t}
      </span>,
    );
    last = m.index + t.length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function Code({ ex }: { ex: CodeExample }) {
  const body = ex.lang === "sql" ? highlightSql(ex.src) : ex.lang === "ts" || ex.lang === "js" ? highlightTs(ex.src) : ex.src;
  return (
    <div>
      <pre className="code">
        {ex.title && <div className="title">{ex.title}</div>}
        {body}
      </pre>
      {ex.note && <p className="small muted">{inline(ex.note)}</p>}
    </div>
  );
}
