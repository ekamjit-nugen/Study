import { useEffect, useRef, useState } from "react";
import { getCurrentNoteContext, noteId, onNoteContext, useNotes } from "../lib/notes";

/** Elements whose text can be saved as a note by hovering or selecting. */
const CANDIDATES = "h1, h2, h3, h4, p, li, td, th, .vbox, .analogy-line, .step-lead, .callout, .problem, .tapcard .q, .tapcard .a, .practical-q, .overview li, pre.code";
const EXCLUDE = ".notesbar, .notes-panel, .sqlrunner, .note-btn, button, input, textarea, .step-nav, .nav-foot, .sidebar, .hovernote";

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
 * A floating "📝 Note" button that follows the mouse over any text block, or a text selection.
 * Mounted once in App; only active while a page has registered a note context.
 */
export default function HoverNote() {
  const { has, toggle } = useNotes();
  const [target, setTarget] = useState<Target | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [, bump] = useState(0);
  const hideTimer = useRef<number | null>(null);
  const overButton = useRef(false);

  useEffect(() => onNoteContext(() => { setTarget(null); bump((n) => n + 1); }), []);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".main");
    if (!main) return;
    const cancelHide = () => { if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null; } };
    const scheduleHide = () => { cancelHide(); hideTimer.current = window.setTimeout(() => { if (!overButton.current) setTarget(null); }, 250); };

    // The button follows the cursor (a little above and to the right) until the cursor is on the button.
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (overButton.current) return;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setPos({ x: e.clientX, y: e.clientY });
      });
    };
    const onOver = (e: Event) => {
      if (!getCurrentNoteContext()) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return; // a selection popup is showing
      const el = (e.target as Element).closest(CANDIDATES);
      if (!el || el.closest(EXCLUDE) || !main.contains(el)) { scheduleHide(); return; }
      const text = (el as HTMLElement).innerText.replace(/\s*📝\s*(noted)?\s*$/u, "").trim();
      if (text.length < 3) { scheduleHide(); return; }
      cancelHide();
      const me = e as MouseEvent;
      if (typeof me.clientX === "number") setPos({ x: me.clientX, y: me.clientY });
      setTarget({ text: text.slice(0, 700), where: labelFor(el) });
    };
    const onLeave = () => scheduleHide();
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
      cancelHide();
      const me = e as MouseEvent;
      if (typeof me.clientX === "number" && me.clientX > 0) setPos({ x: me.clientX, y: me.clientY });
      else {
        const r = range.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
      }
      setTarget({ text: text.slice(0, 700), where: "selection · " + labelFor(el.closest(CANDIDATES) ?? el), selection: true });
    };
    const onScroll = () => setTarget((t) => (t?.selection ? t : null));
    main.addEventListener("mouseover", onOver);
    main.addEventListener("mousemove", onMove);
    main.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("touchend", onSelect);
    document.addEventListener("selectionchange", () => { const s = window.getSelection(); if (s && s.isCollapsed) setTarget((t) => (t?.selection ? null : t)); });
    window.addEventListener("scroll", onScroll, true);
    return () => {
      main.removeEventListener("mouseover", onOver);
      main.removeEventListener("mousemove", onMove);
      main.removeEventListener("mouseleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
      document.removeEventListener("mouseup", onSelect);
      document.removeEventListener("touchend", onSelect);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const ctx = getCurrentNoteContext();
  if (!target || !ctx) return null;
  const noted = has(noteId(ctx, target.text));
  // Sit just above-right of the cursor, kept inside the viewport.
  const top = Math.max(8, Math.min(window.innerHeight - 40, pos.y - 38));
  const left = Math.max(8, Math.min(window.innerWidth - 170, pos.x + 12));
  return (
    <button
      className={`hovernote ${noted ? "noted" : ""}`}
      style={{ top, left }}
      onMouseEnter={() => { overButton.current = true; }}
      onMouseLeave={() => { overButton.current = false; setTarget(null); }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        toggle(ctx, target.text, target.where);
        bump((n) => n + 1);
        if (target.selection) window.getSelection()?.removeAllRanges();
        window.setTimeout(() => setTarget(null), 600);
      }}
      title={noted ? "Remove this note" : "Save this text as a note"}
    >
      {noted ? "✓ noted · remove" : target.selection ? "📝 Note the selection" : "📝 Note this"}
    </button>
  );
}
