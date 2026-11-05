import { useEffect, useRef, useState } from "react";
import { inline } from "../lib/md";
import { useNotes, type Note } from "../lib/notes";
import { Code } from "./Bits";

function NoteRow({ n, onRemove }: { n: Note; onRemove: () => void }) {
  return (
    <div className="note-row">
      <div className="note-meta">
        <span className="pill">{n.courseTitle}</span>
        <span className="pill muted">{n.moduleTitle}</span>
        {n.topicTitle && <span className="pill ok">{n.topicTitle}</span>}
        <span className="small muted">· {n.where}</span>
      </div>
      <div className="note-text">{n.text.startsWith("```") ? <Code ex={{ lang: "text", src: n.text.replace(/^```\n?|```$/g, "") }} /> : inline(n.text)}</div>
      <div className="row">
        <a className="btn small primary" href={n.href}>
          ↗ Open lesson
        </a>
        <button className="btn small" onClick={onRemove}>
          remove
        </button>
      </div>
    </div>
  );
}

/** The top bar: always visible, shows the notes count and opens the notes panel. */
export function NotesBar({ onMenu }: { onMenu: () => void }) {
  const { notes, remove } = useNotes();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Close on Escape, and on any click or tap outside the button + panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);
  const recent = [...notes].reverse();
  return (
    <div className="notesbar">
      <button className="btn small menu-btn" onClick={onMenu}>
        ☰ Path
      </button>
      <a href="#/" className="notesbar-brand">
        🤖 AI Engineer Path
      </a>
      <span style={{ flex: 1 }} />
      <div className="notes-anchor" ref={box}>
      <button className={`btn small ${open ? "primary" : ""}`} onClick={() => setOpen(!open)} title="Your notes">
        📝 Notes {notes.length > 0 && <span className="count">{notes.length}</span>}
      </button>
      {open && (
        <div className="notes-panel">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <b>My notes ({notes.length})</b>
            <span className="row">
              <a className="btn small" href="#/notes" onClick={() => setOpen(false)}>
                all notes →
              </a>
              <button className="btn small" onClick={() => setOpen(false)}>
                ✕
              </button>
            </span>
          </div>
          {notes.length === 0 ? (
            <p className="small muted">Nothing saved yet. Press and hold on any text for half a second (or select some words) and press "📝 Note this". The 📝 buttons next to summary lines and cards work too.</p>
          ) : (
            recent.slice(0, 8).map((n) => <NoteRow key={n.id} n={n} onRemove={() => remove(n.id)} />)
          )}
          {notes.length > 8 && (
            <a className="small" href="#/notes" onClick={() => setOpen(false)}>
              {notes.length - 8} more on the notes page →
            </a>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export function NotesPage() {
  const { notes, remove, clear } = useNotes();
  const [q, setQ] = useState("");
  const shown = notes.filter((n) => !q || (n.text + " " + n.topicTitle + " " + n.moduleTitle).toLowerCase().includes(q.toLowerCase()));
  const groups = new Map<string, Note[]>();
  for (const n of shown) {
    const k = `${n.courseTitle} · ${n.moduleTitle}`;
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }
  const download = () => {
    const md = ["# My notes", ""].concat(notes.map((n) => `- **${n.moduleTitle}${n.topicTitle ? " / " + n.topicTitle : ""}** (${n.where}): ${n.text}`)).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = "notes.md";
    a.click();
  };
  return (
    <div className="content">
      <h1>📝 My notes</h1>
      <p className="muted">Every line you marked, grouped by module. Each one takes you back to where it came from.</p>
      <div className="row" style={{ marginBottom: "0.8rem" }}>
        <input className="search" style={{ margin: 0, flex: 1 }} placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn small" onClick={download} disabled={!notes.length}>
          ⬇ download .md
        </button>
        <button className="btn small" onClick={() => confirm("Delete all notes?") && clear()} disabled={!notes.length}>
          clear all
        </button>
      </div>
      {groups.size === 0 && <div className="card soft">No notes yet. Open any lesson, press and hold a line, and press 📝 Note this.</div>}
      {[...groups.entries()].map(([k, list]) => (
        <div className="card" key={k}>
          <h3>{k}</h3>
          {list.map((n) => (
            <NoteRow key={n.id} n={n} onRemove={() => remove(n.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}
