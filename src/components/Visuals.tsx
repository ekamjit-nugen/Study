import type { VisualSpec, Tone } from "../courses/types";
import { inline } from "../lib/md";

const toneCls = (t?: Tone) => `vbox tone-${t ?? "plain"}`;

/** Horizontal flow of boxes with arrows; wraps on narrow screens. */
export function Flow({ steps, caption }: { steps: { label: string; sub?: string; tone?: Tone }[]; caption?: string }) {
  return (
    <div className="vis">
      <div className="vflow">
        {steps.map((s, i) => (
          <div className="vflow-item" key={i}>
            <div className={toneCls(s.tone)}>
              <div className="vlabel">{inline(s.label)}</div>
              {s.sub && <div className="vsub">{inline(s.sub)}</div>}
            </div>
            {i < steps.length - 1 && <div className="varrow">→</div>}
          </div>
        ))}
      </div>
      {caption && <div className="caption">{inline(caption)}</div>}
    </div>
  );
}

/** Vertical numbered steps joined by a line. */
export function Ladder({ steps, caption }: { steps: { label: string; sub?: string; tone?: Tone }[]; caption?: string }) {
  return (
    <div className="vis">
      <div className="vladder">
        {steps.map((s, i) => (
          <div className="vladder-row" key={i}>
            <div className="vnum">{i + 1}</div>
            <div className={toneCls(s.tone)}>
              <div className="vlabel">{inline(s.label)}</div>
              {s.sub && <div className="vsub">{inline(s.sub)}</div>}
            </div>
          </div>
        ))}
      </div>
      {caption && <div className="caption">{inline(caption)}</div>}
    </div>
  );
}

/** Two panels side by side, e.g. wrong vs right. Lines starting with ✓ or ✗ get coloured. */
export function Compare({ left, right, caption }: { left: { title: string; lines: string[]; tone?: Tone }; right: { title: string; lines: string[]; tone?: Tone }; caption?: string }) {
  const Panel = ({ p, fallback }: { p: { title: string; lines: string[]; tone?: Tone }; fallback: Tone }) => (
    <div className={toneCls(p.tone ?? fallback)}>
      <div className="vlabel">{inline(p.title)}</div>
      <ul className="vlines">
        {p.lines.map((l, i) => (
          <li key={i} className={l.startsWith("✗") ? "bad" : l.startsWith("✓") ? "ok" : ""}>
            {inline(l)}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="vis">
      <div className="vcompare">
        <Panel p={left} fallback="bad" />
        <Panel p={right} fallback="ok" />
      </div>
      {caption && <div className="caption">{inline(caption)}</div>}
    </div>
  );
}

/** A grid of small titled cards. */
export function Cards({ items, caption }: { items: { title: string; lines: string[]; tone?: Tone }[]; caption?: string }) {
  return (
    <div className="vis">
      <div className="vcards">
        {items.map((it, i) => (
          <div className={toneCls(it.tone)} key={i}>
            <div className="vlabel">{inline(it.title)}</div>
            <ul className="vlines">
              {it.lines.map((l, j) => (
                <li key={j}>{inline(l)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {caption && <div className="caption">{inline(caption)}</div>}
    </div>
  );
}

export function Visual({ spec }: { spec: VisualSpec }) {
  if (spec.kind === "flow") return <Flow steps={spec.steps} caption={spec.caption} />;
  if (spec.kind === "ladder") return <Ladder steps={spec.steps} caption={spec.caption} />;
  if (spec.kind === "compare") return <Compare left={spec.left} right={spec.right} caption={spec.caption} />;
  return <Cards items={spec.items} caption={spec.caption} />;
}

/** Turn a bullet like "**Concurrency:** two requests…" into {title, detail}. */
export function splitBullet(b: string): { title: string; detail: string } {
  const m = /^\*\*([^*]+)\*\*:?\s*(.*)$/s.exec(b);
  if (m) return { title: m[1].replace(/:$/, ""), detail: m[2] };
  const m2 = /^(`[^`]+`)\s*[:—-]?\s*(.*)$/s.exec(b);
  if (m2) return { title: m2[1], detail: m2[2] };
  const cut = b.indexOf(". ");
  if (cut > 0 && cut < 110) return { title: b.slice(0, cut + 1), detail: b.slice(cut + 2) };
  return { title: b, detail: "" };
}
