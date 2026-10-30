import type { ReactNode } from "react";

export function Svg({ w, h, children, caption }: { w: number; h: number; children: ReactNode; caption?: string }) {
  return (
    <div className="diagram">
      <svg viewBox={`0 0 ${w} ${h}`} role="img">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>
          <marker id="arrm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
          </marker>
          <marker id="arrb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bad)" />
          </marker>
        </defs>
        {children}
      </svg>
      {caption && <div className="caption">{caption}</div>}
    </div>
  );
}

export function Box({
  x, y, w, h, label, sub, cls = "d-box", mono = false, lines,
}: { x: number; y: number; w: number; h: number; label?: string; sub?: string; cls?: string; mono?: boolean; lines?: string[] }) {
  const tcls = mono ? "d-mono" : "d-text";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className={cls} />
      {lines ? (
        lines.map((l, i) => (
          <text key={i} x={x + 10} y={y + 18 + i * 16} className={tcls}>
            {l}
          </text>
        ))
      ) : (
        <>
          {label && (
            <text x={x + w / 2} y={y + h / 2 + (sub ? -3 : 5)} textAnchor="middle" className={tcls} fontWeight={600}>
              {label}
            </text>
          )}
          {sub && (
            <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className="d-small">
              {sub}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export function Arrow({ x1, y1, x2, y2, label, cls = "d-arrow", marker = "arr", dash }: { x1: number; y1: number; x2: number; y2: number; label?: string; cls?: string; marker?: string; dash?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd={`url(#${marker})`} strokeDasharray={dash ? "5 4" : undefined} />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" className="d-small">
          {label}
        </text>
      )}
    </g>
  );
}

export function T({ x, y, children, cls = "d-text", anchor = "start", bold }: { x: number; y: number; children: ReactNode; cls?: string; anchor?: "start" | "middle" | "end"; bold?: boolean }) {
  return (
    <text x={x} y={y} className={cls} textAnchor={anchor} fontWeight={bold ? 700 : undefined}>
      {children}
    </text>
  );
}

/** A tiny table drawn in SVG. */
export function MiniTable({ x, y, title, head, rows, colW = 70, hl }: { x: number; y: number; title?: string; head: string[]; rows: (string | number | null)[][]; colW?: number | number[]; hl?: (r: number, c: number) => string | undefined }) {
  const widths = head.map((_, i) => (Array.isArray(colW) ? colW[i] : colW));
  const xs = widths.map((_, i) => x + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const rowH = 20;
  const top = y + (title ? 18 : 0);
  return (
    <g>
      {title && (
        <text x={x} y={y + 10} className="d-text" fontWeight={700}>
          {title}
        </text>
      )}
      {head.map((h, i) => (
        <g key={i}>
          <rect x={xs[i]} y={top} width={widths[i]} height={rowH} className="d-box" style={{ fill: "var(--accent-soft)" }} />
          <text x={xs[i] + 6} y={top + 14} className="d-mono" fontWeight={700}>
            {h}
          </text>
        </g>
      ))}
      {rows.map((r, ri) => (
        <g key={ri}>
          {r.map((c, ci) => {
            const cls = hl?.(ri, ci);
            return (
              <g key={ci}>
                <rect x={xs[ci]} y={top + rowH * (ri + 1)} width={widths[ci]} height={rowH} className={cls ?? "d-box"} />
                <text x={xs[ci] + 6} y={top + rowH * (ri + 1) + 14} className="d-mono" style={c === null ? { fill: "var(--muted)", fontStyle: "italic" } : undefined}>
                  {c === null ? "NULL" : String(c)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}
