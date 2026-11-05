// The pieces a lesson is made of: prose with words explained under the paragraph, figures, examples, maths and code read line by line.
import { useSyncExternalStore } from "react";
import { GLOSSARY } from "../path/glossary";
import { LESSON_ORDER } from "../path";
import type { CodeDemo, Example, Figure, Lesson, Maths, Term } from "../path/types";
import { inline, Prose } from "../lib/md";
import { Code, DataTable } from "./Bits";

/* ---------- words explained first ---------- */

/** Glossary terms used in `text` that are taught after `lesson` and not yet explained on this page. */
export function termsIn(text: string, lesson: Lesson, seen: Set<string>): Term[] {
  const here = LESSON_ORDER[lesson.slug];
  const own = (lesson.body?.terms ?? []).map(([w]) => w.toLowerCase());
  const out: Term[] = [];
  for (const t of GLOSSARY) {
    if (seen.has(t.id)) continue;
    const taught = LESSON_ORDER[t.taughtIn];
    if (taught === undefined || taught <= here) continue;
    // A word this lesson introduces itself is explained in its "new words", not as "taught later".
    if (own.some((w) => t.match.test(w) || t.label.toLowerCase().startsWith(w))) continue;
    if (t.match.test(text)) {
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

export function TermDefs({ terms }: { terms: Term[] }) {
  if (!terms.length) return null;
  return (
    <div className="term-defs">
      {terms.map((t) => (
        <div key={t.id} className="term-def">
          <b>{t.label}</b> <span className="muted">·</span> {t.plain} <a className="small" href={`#/lesson/${t.taughtIn}`}>taught later ↗</a>
        </div>
      ))}
    </div>
  );
}

/** Prose split into paragraphs; under each, any word taught later is explained before you read on. */
export function ProseT({ text, lesson, seen }: { text: string; lesson: Lesson; seen: Set<string> }) {
  const paras = text.split(/\n\s*\n/);
  return (
    <>
      {paras.map((p, i) => (
        <div key={i}>
          <Prose text={p} />
          <TermDefs terms={termsIn(p, lesson, seen)} />
        </div>
      ))}
    </>
  );
}

/* ---------- line by line or direct ---------- */

const KEY = "aip-explain";
type Mode = "line" | "direct";
const listeners = new Set<() => void>();
function readMode(): Mode {
  try {
    return (localStorage.getItem(KEY) as Mode) || "line";
  } catch {
    return "line";
  }
}
function writeMode(m: Mode) {
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
export function useExplainMode(): [Mode, (m: Mode) => void] {
  const mode = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readMode,
    () => "line" as Mode,
  );
  return [mode, writeMode];
}

export function ExplainToggle() {
  const [mode, setMode] = useExplainMode();
  return (
    <div className="viewtoggle" role="group" aria-label="How to read code">
      <button className={mode === "line" ? "on" : ""} onClick={() => setMode("line")}>line by line</button>
      <button className={mode === "direct" ? "on" : ""} onClick={() => setMode("direct")}>direct</button>
    </div>
  );
}

export function CodeView({ demo }: { demo: CodeDemo }) {
  const [mode] = useExplainMode();
  return (
    <div className="codeview">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        {demo.title ? <b>{demo.title}</b> : <span />}
        {demo.lines?.length ? <ExplainToggle /> : null}
      </div>
      <Code ex={{ lang: demo.lang, src: demo.src }} />
      {demo.output && (
        <pre className="code output">
          <div className="title">Output</div>
          {demo.output}
        </pre>
      )}
      {mode === "line" && demo.lines?.length ? (
        <ol className="linebyline">
          {demo.lines.map((l, i) => (
            <li key={i}>
              <code>{l.code.trim()}</code>
              <span>{inline(l.say)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {demo.note && <p className="small muted">{inline(demo.note)}</p>}
    </div>
  );
}

/* ---------- figures ---------- */

export function FigureView({ fig }: { fig: Figure }) {
  let body: React.ReactNode;
  if (fig.kind === "flow")
    body = (
      <div className="vflow">
        {fig.steps.map((s, i) => (
          <div className="vflow-item" key={i}>
            <div className="vbox tone-accent">{inline(s)}</div>
            {i < fig.steps.length - 1 && <div className="varrow">→</div>}
          </div>
        ))}
      </div>
    );
  else if (fig.kind === "table") body = <DataTable table={fig.table} />;
  else if (fig.kind === "compare")
    body = (
      <div className="vcompare">
        {[fig.left, fig.right].map((side, i) => (
          <div className={`vbox ${i === 0 ? "tone-warn" : "tone-ok"}`} key={i}>
            <div className="vlabel">{side.title}</div>
            <ul className="vlines">
              {side.points.map((p, j) => (
                <li key={j}>{inline(p)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  else if (fig.kind === "steps")
    body = (
      <div className="vladder">
        {fig.items.map((it, i) => (
          <div className="vladder-row" key={i}>
            <span className="vnum">{i + 1}</span>
            <div className="vbox">
              <div className="vlabel">{inline(it.label)}</div>
              <div className="vsub">{inline(it.detail)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  else
    body = (
      <div className="vtree">
        <div className="vbox tone-accent vtree-root">{inline(fig.root)}</div>
        <div className="vtree-children">
          {fig.children.map((c, i) => (
            <div className="vbox" key={i}>
              <div className="vlabel">{inline(c.label)}</div>
              {c.children && (
                <ul className="vlines">
                  {c.children.map((g, j) => (
                    <li key={j}>{inline(g)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="vis">
      {body}
      {fig.caption && <p className="small muted" style={{ marginTop: 8 }}>{inline(fig.caption)}</p>}
    </div>
  );
}

/* ---------- examples and maths ---------- */

export function ExampleView({ ex, tone, lesson, seen }: { ex: Example; tone: "everyday" | "engineering" | "creative"; lesson: Lesson; seen: Set<string> }) {
  const icon = tone === "everyday" ? "🏠" : tone === "engineering" ? "🏭" : "💡";
  return (
    <div className={`example ${tone}`}>
      <div className="example-title">
        <span>{icon}</span> {ex.title}
      </div>
      <ProseT text={ex.text} lesson={lesson} seen={seen} />
      {ex.table && <DataTable table={ex.table} />}
      {ex.code && <CodeView demo={ex.code} />}
    </div>
  );
}

export function MathsView({ m }: { m: Maths }) {
  return (
    <div className="maths">
      <div className="formula">{m.formula}</div>
      <p>{inline(m.meaning)}</p>
      <ol className="worked">
        {m.worked.map((s, i) => (
          <li key={i}>{inline(s)}</li>
        ))}
      </ol>
      {m.note && <p className="small muted">{inline(m.note)}</p>}
    </div>
  );
}
