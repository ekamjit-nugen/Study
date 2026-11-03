import { useSyncExternalStore, type ReactNode } from "react";
import type { Interview, Practice, StoryLine, StoryPage, StoryQuery } from "../courses/types";
import { termsFor } from "./TermHelp";
import { inline, Prose } from "../lib/md";
import { DataTable } from "./Bits";
import { Diagram } from "./Diagrams";
import SqlRunner from "./SqlRunner";

/* ---------------- "line by line" vs "direct": one choice, remembered everywhere ---------------- */

type Mode = "lines" | "direct";
const KEY = "fsm-explain-mode";
let mode: Mode = (() => {
  try {
    return (localStorage.getItem(KEY) as Mode) || "lines";
  } catch {
    return "lines";
  }
})();
const subs = new Set<() => void>();
function setMode(m: Mode) {
  mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}
export function useExplainMode(): [Mode, (m: Mode) => void] {
  const m = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => mode);
  return [m, setMode];
}

export function ExplainToggle() {
  const [m, set] = useExplainMode();
  return (
    <div className="segmented" role="group" aria-label="How to read the answer">
      <button className={m === "lines" ? "on" : ""} onClick={() => set("lines")} title="Read the query one line at a time">
        line by line
      </button>
      <button className={m === "direct" ? "on" : ""} onClick={() => set("direct")} title="Just the answer">
        direct
      </button>
    </div>
  );
}

/** Each line of SQL with its plain-words reading beside it. */
export function LineByLine({ lines }: { lines: StoryLine[] }) {
  return (
    <div className="lbl">
      {lines.map((l, i) => (
        <div key={i} className="lbl-row">
          <code className="lbl-sql">{l.sql}</code>
          <div className="lbl-say">{inline(l.say)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- paragraphs with the jargon defined right underneath ---------------- */

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function StoryParagraphs({ text, slug, jargon }: { text: string; slug: string; jargon?: [string, string][] }) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const shown = new Set<string>();
  return (
    <div className="story-text">
      {paras.map((para, i) => {
        const defs: { label: string; plain: string }[] = [];
        for (const [word, meaning] of jargon ?? []) {
          const key = "j:" + word;
          if (!shown.has(key) && new RegExp("\\b" + escapeRe(word), "i").test(para)) {
            shown.add(key);
            defs.push({ label: word, plain: meaning });
          }
        }
        // Glossary terms whose lesson comes later than this topic, unless the page defines the word itself.
        for (const t of termsFor([para], slug)) {
          if (shown.has(t.id)) continue;
          if ((jargon ?? []).some(([word]) => t.match.test(word))) continue;
          shown.add(t.id);
          defs.push({ label: t.label, plain: t.plain });
        }
        return (
          <div key={i} className="story-para">
            <Prose text={para} />
            {defs.length > 0 && (
              <div className="jargon">
                {defs.map((d, j) => (
                  <div key={j + ":" + d.label} className="jargon-row">
                    <b>{d.label}</b> <span className="muted">·</span> {inline(d.plain)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- a query inside the story ---------------- */

export function StoryQueryBox({ q }: { q: StoryQuery }) {
  const [m] = useExplainMode();
  return (
    <div className="storyq">
      <div className="storyq-head">
        <span>{q.title ?? "The query"}</span>
        {q.lines && <ExplainToggle />}
      </div>
      {q.lines && m === "lines" && <LineByLine lines={q.lines} />}
      <SqlRunner sql={q.sql} note={q.note} explain={q.explain} title="Run it" />
      {q.expect && <div className="storyq-expect">👀 Look for: {inline(q.expect)}</div>}
    </div>
  );
}

export function StoryPageView({ page, slug, cast }: { page: StoryPage; slug: string; cast?: string }) {
  return (
    <div className="storypage">
      {page.when && <div className="story-when">{page.when}</div>}
      {cast && <div className="story-cast">{inline(cast)}</div>}
      <StoryParagraphs text={page.text} slug={slug} jargon={page.jargon} />
      {page.diagram && <Diagram id={page.diagram} />}
      {page.table && <DataTable table={page.table} />}
      {page.queries?.map((q, i) => (
        <StoryQueryBox key={i} q={q} />
      ))}
      {page.ask && <div className="story-ask">🤔 Before you turn the page: {inline(page.ask)}</div>}
    </div>
  );
}

/* ---------------- answers that can be read line by line ---------------- */

export function PracticeAnswer({ p }: { p: Practice }): ReactNode {
  const [m] = useExplainMode();
  return (
    <div>
      {p.lines && <ExplainToggle />}
      {p.lines && m === "lines" && <LineByLine lines={p.lines} />}
      <Prose text={`**Answer:** ${p.answer}\n\n**Why:** ${p.explain}`} />
    </div>
  );
}

export function InterviewLines({ q }: { q: Interview }) {
  const [m] = useExplainMode();
  if (!q.lines) return null;
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <ExplainToggle />
      {m === "lines" && <LineByLine lines={q.lines} />}
    </div>
  );
}
