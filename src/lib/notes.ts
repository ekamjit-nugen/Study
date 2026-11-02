// Notes the learner marks while studying: any marked line remembers where it came from.
import { createContext, useContext, useSyncExternalStore } from "react";

export type NoteContext = {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  topicSlug?: string;
  topicTitle?: string;
  /** Where to go back to. */
  href: string;
};

export type Note = NoteContext & {
  id: string;
  text: string;
  /** Which part of the page it came from, e.g. "In 30 seconds", "Chapter summary". */
  where: string;
  createdAt: string;
};

export const NoteCtx = createContext<NoteContext | null>(null);
export const useNoteContext = () => useContext(NoteCtx);

/** Stable id for a line: same text in the same place → same note. */
export function noteId(ctx: NoteContext, text: string): string {
  let h = 0;
  const s = ctx.href + "\u0001" + text;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (ctx.topicSlug ?? ctx.moduleId) + "-" + (h >>> 0).toString(36);
}

/* One shared store, so the top bar, the notes page and every 📝 button see the same list. */
const KEY = "fsm-notes-v1";
let state: Note[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
})();
const listeners = new Set<() => void>();
function set(next: Note[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useNotes() {
  const notes = useSyncExternalStore(subscribe, () => state, () => state);
  const has = (id: string) => notes.some((n) => n.id === id);
  const toggle = (ctx: NoteContext, text: string, where: string) => {
    const id = noteId(ctx, text);
    set(state.some((n) => n.id === id) ? state.filter((n) => n.id !== id) : [...state, { ...ctx, id, text, where, createdAt: new Date().toISOString() }]);
  };
  const remove = (id: string) => set(state.filter((n) => n.id !== id));
  const clear = () => set([]);
  return { notes, has, toggle, remove, clear };
}
