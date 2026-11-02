import { useEffect, useRef, useState } from "react";
import { getCurrentNoteContext, noteId, onNoteContext, useNotes } from "../lib/notes";

/** Elements whose text can be saved as a note by long-pressing or selecting. */
const CANDIDATES = "h1, h2, h3, h4, p, li, td, th, .vbox, .analogy-line, .step-lead, .callout, .problem, .tapcard .q, .tapcard .a, .practical-q, .overview li, pre.code";
const EXCLUDE = ".notesbar, .notes-panel, .sqlrunner, .note-btn, button, input, textarea, a, .step-nav, .nav-foot, .sidebar, .hovernote";
const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

type Target = { text: string; where: string; selection?: boolean };

function labelFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const kind = /^h[1-4]$/.test(tag) ? "heading" : tag === "li" ? "list item" : tag === "td" || tag === "th" ? "table cell" : el.classList.contains("vbox") ? "card" : tag === "pre" ? "code" : "text";
  let h: Element | null = el;
  while (h && !(h instanceof HTMLHeadingElement)) h = h.previousElementSibling ?? (h.parentElement && !h.parentElement.matches(".main") ? h.parentElement : null);
  const heading = h instanceof HTMLHeadingElement ? h.innerText.trim().slice(0, 60) : "";
  return heading ? `${kind} · ${heading}` : kind;
}

/**
 * Long-press (mouse or finger, ~half a second, without moving) on any text block to get a
 * "📝 Note this" button that stays where you pressed until you click it or click elsewhere.
 * Selecting text shows the same button at the selection. Mounted once in App.
 */
export default function HoverNote() {
  const { has, toggle } = useNotes();
  const [target, setTarget] = useState<Target | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [holding, setHolding] = useState<{ x: number; y: number } | null>(null);
  const [, bump] = useState(0);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number; el: Element } | null>(null);
  const suppressContextMenu = useRef(false);

  useEffect(() => onNoteContext(() => { setTarget(null); bump((n) => n + 1); }), []);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".main");
    if (!main) return;
    const clearHold = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      start.current = null;
      setHolding(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!getCurrentNoteContext()) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const t = e.target as Element;
      if (t.closest(".hovernote")) return;
      setTarget(null); // a press elsewhere dismisses the current popup
      const el = t.closest(CANDIDATES);
      if (!el || el.closest(EXCLUDE) || !main.contains(el)) return;
      start.current = { x: e.clientX, y: e.clientY, el };
      setHolding({ x: e.clientX, y: e.clientY });
      timer.current = window.setTimeout(() => {
        const s = start.current;
        if (!s) return;
        const text = (s.el as HTMLElement).innerText.replace(/\s*📝\s*(noted)?\s*$/u, "").trim();
        if (text.length >= 3) {
          setPos({ x: s.x, y: s.y });
          setTarget({ text: text.slice(0, 700), where: labelFor(s.el) });
          suppressContextMenu.current = true; // phones open a callout on long press; we show ours instead
          window.getSelection()?.removeAllRanges();
        }
        clearHold();
      }, HOLD_MS);
    };
    const onMove = (e: PointerEvent) => {
      const s = start.current;
      if (s && (Math.abs(e.clientX - s.x) > MOVE_TOLERANCE || Math.abs(e.clientY - s.y) > MOVE_TOLERANCE)) clearHold();
    };
    const onUp = () => clearHold();
    const onContextMenu = (e: Event) => {
      if (suppressContextMenu.current) {
        e.preventDefault();
        suppressContextMenu.current = false;
      }
    };
    const onSelect = (e: Event) => {
      if (!getCurrentNoteContext()) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node instanceof Element ? node : node.parentElement;
      if (!el || !main.contains(el) || el.closest(EXCLUDE)) return;
      const text = sel.toString().trim();
      if (text.length < 3) return;
      const me = e as MouseEvent;
      const r = range.getBoundingClientRect();
      if (typeof me.clientX === "number" && me.clientX > 0) setPos({ x: me.clientX, y: me.clientY });
      else setPos({ x: r.left + r.width / 2, y: r.top });
      setTarget({ text: text.slice(0, 700), where: "selection · " + labelFor(el.closest(CANDIDATES) ?? el), selection: true });
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTarget(null);
    const onScroll = () => setTarget(null);
    main.addEventListener("pointerdown", onDown);
    main.addEventListener("pointermove", onMove);
    main.addEventListener("pointerup", onUp);
    main.addEventListener("pointercancel", onUp);
    main.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("touchend", onSelect);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      main.removeEventListener("pointerdown", onDown);
      main.removeEventListener("pointermove", onMove);
      main.removeEventListener("pointerup", onUp);
      main.removeEventListener("pointercancel", onUp);
      main.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("mouseup", onSelect);
      document.removeEventListener("touchend", onSelect);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      clearHold();
    };
  }, []);

  const ctx = getCurrentNoteContext();
  if (holding && !target) {
    // a small ring that fills while you hold, so you know a note is coming
    return <span className="hold-ring" style={{ left: holding.x - 14, top: holding.y - 14 }} />;
  }
  if (!target || !ctx) return null;
  const noted = has(noteId(ctx, target.text));
  const top = Math.max(8, Math.min(window.innerHeight - 40, pos.y - 44));
  const left = Math.max(8, Math.min(window.innerWidth - 190, pos.x - 60));
  return (
    <button
      className={`hovernote ${noted ? "noted" : ""}`}
      style={{ top, left }}
      onClick={() => {
        toggle(ctx, target.text, target.where);
        bump((n) => n + 1);
        if (target.selection) window.getSelection()?.removeAllRanges();
        window.setTimeout(() => setTarget(null), 700);
      }}
      title={noted ? "Remove this note" : "Save this text as a note"}
    >
      {noted ? "✓ noted · remove" : target.selection ? "📝 Note the selection" : "📝 Note this"}
    </button>
  );
}
