import type { ReactNode } from "react";
import { noteId, useNoteContext, useNotes } from "../lib/notes";

/**
 * Wraps a line the learner can mark as a note. Click the 📝 to save it; the note remembers the
 * course, chapter, topic and page it came from. Needs a NoteCtx provider above it.
 */
export function Notable({ text, where, children, block }: { text: string; where: string; children: ReactNode; block?: boolean }) {
  const ctx = useNoteContext();
  const { has, toggle } = useNotes();
  if (!ctx) return <>{children}</>;
  const id = noteId(ctx, text);
  const on = has(id);
  const Tag = block ? "div" : "span";
  return (
    <Tag className={`notable ${on ? "noted" : ""}`}>
      {children}
      <button
        className="note-btn"
        title={on ? "Remove from my notes" : "Save as a note"}
        aria-label={on ? "Remove note" : "Save note"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(ctx, text, where);
        }}
      >
        {on ? "📝 noted" : "📝"}
      </button>
    </Tag>
  );
}
