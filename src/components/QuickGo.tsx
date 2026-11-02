import { useEffect, useMemo, useRef, useState } from "react";
import { COURSES } from "../courses/registry";
import { MISSIONS } from "../courses/db/project";
import { href } from "../lib/route";
import { stepOutline } from "./LessonPlayer";
import { chapterHref } from "./ChapterSummary";

type Item = { label: string; sub: string; h: string; kind: "topic" | "idea" | "chapter" | "mission" | "tool" | "course" };

function buildItems(): Item[] {
  const items: Item[] = [];
  for (const c of COURSES) {
    if (c.status !== "ready") continue;
    items.push({ label: `${c.title} · quick learn (all topics, short)`, sub: "page", h: href.quick(c.id), kind: "course" });
    c.modules.forEach((m, mi) => {
      items.push({ label: `Chapter ${mi + 1}: ${m.title} · summary & practice`, sub: c.title, h: chapterHref(c.id, m.id), kind: "chapter" });
      m.topics.forEach((t, ti) => {
        items.push({ label: `${mi + 1}.${ti + 1} ${t.title}`, sub: `${c.title} · ${m.title}`, h: href.topic(c.id, t.slug), kind: "topic" });
        for (const s of stepOutline(t, c.id)) {
          if (s.kind === "idea" || s.kind === "problem") items.push({ label: s.title, sub: `${mi + 1}.${ti + 1} ${t.title} · ${s.label}`, h: href.step(c.id, t.slug, s.index), kind: "idea" });
        }
      });
    });
  }
  MISSIONS.forEach((m, i) => items.push({ label: `Mission ${i + 1}: ${m.title}`, sub: "Build the shop", h: href.mission(m.id), kind: "mission" }));
  items.push(
    { label: "Build the shop (project)", sub: "tool", h: "#/project", kind: "tool" },
    { label: "Hard problems, made easy", sub: "tool", h: "#/hard", kind: "tool" },
    { label: "Interview bank", sub: "tool", h: "#/interview", kind: "tool" },
    { label: "SQL playground", sub: "tool", h: "#/playground", kind: "tool" },
    { label: "SQL cheat sheet", sub: "tool", h: "#/cheatsheet", kind: "tool" },
    { label: "My notes", sub: "tool", h: "#/notes", kind: "tool" },
  );
  return items;
}

/** A jump palette: type to filter every chapter, topic, idea, mission and tool; Enter opens the first match. */
export default function QuickGo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useMemo(buildItems, []);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  if (!open) return null;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (words.length ? items.filter((it) => words.every((w) => (it.label + " " + it.sub).toLowerCase().includes(w))) : items.filter((it) => it.kind !== "idea")).slice(0, 40);
  const go = (it: Item) => {
    onClose();
    location.hash = it.h;
  };
  return (
    <div className="quickgo-backdrop" onMouseDown={onClose}>
      <div className="quickgo" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="search"
          placeholder="Jump to… a topic, an idea, a chapter, a mission, a tool"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === "Enter" && shown[sel]) go(shown[sel]);
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="quickgo-list">
          {shown.length === 0 && <div className="small muted">Nothing matches.</div>}
          {shown.map((it, i) => (
            <button key={it.h + it.label} className={`quickgo-item ${i === sel ? "on" : ""}`} onMouseEnter={() => setSel(i)} onClick={() => go(it)}>
              <span className={`pill ${it.kind === "topic" ? "" : it.kind === "idea" ? "ok" : it.kind === "chapter" ? "warn" : it.kind === "mission" ? "bad" : "muted"}`}>{it.kind}</span>
              <span className="quickgo-label">{it.label}</span>
              <span className="small muted">{it.sub}</span>
            </button>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: "0.4rem" }}>
          <span className="kbd">↑</span> <span className="kbd">↓</span> move · <span className="kbd">Enter</span> open · <span className="kbd">Esc</span> close · open anytime with <span className="kbd">Ctrl</span>/<span className="kbd">⌘</span>+<span className="kbd">K</span>
        </div>
      </div>
    </div>
  );
}
