import { Fragment, type ReactNode } from "react";
import { Code } from "../components/Bits";

/** Render inline marks: `code` and **bold**. */
export function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const t = m[0];
    if (t.startsWith("`")) parts.push(<code key={k++}>{t.slice(1, -1)}</code>);
    else parts.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return parts;
}

type Block = { kind: "p"; text: string } | { kind: "code"; lang: string; src: string } | { kind: "table"; head: string[]; rows: string[][] } | { kind: "ul" | "ol"; items: string[] } | { kind: "quote"; text: string };

/** Split text into blocks: paragraphs, fenced code, pipe tables, bullet/numbered lists and > quotes. */
function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const flushPara = (buf: string[]) => {
    const t = buf.join(" ").trim();
    if (t) blocks.push({ kind: "p", text: t });
  };
  let para: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      flushPara(para);
      para = [];
      const src: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) src.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", lang: fence[1] || "text", src: src.join("\n") });
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara(para);
      para = [];
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length) blocks.push({ kind: "table", head: rows[0], rows: rows.slice(1) });
      continue;
    }
    const li = /^\s*(?:[-*]|\d+\.)\s+/.test(line);
    if (li) {
      flushPara(para);
      para = [];
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
      blocks.push({ kind: ordered ? "ol" : "ul", items });
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushPara(para);
      para = [];
      const q: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ kind: "quote", text: q.join(" ") });
      continue;
    }
    if (!line.trim()) {
      flushPara(para);
      para = [];
      i++;
      continue;
    }
    para.push(line);
    i++;
  }
  flushPara(para);
  return blocks;
}

/** Paragraphs, tables, code fences, lists and quotes, with inline marks. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "p")
          return (
            <p key={i} className={className}>
              {inline(b.text)}
            </p>
          );
        if (b.kind === "code") return <Code key={i} ex={{ lang: (["ts", "js", "sql", "bash", "json"].includes(b.lang) ? b.lang : "text") as "ts" | "js" | "sql" | "bash" | "json" | "text", src: b.src }} />;
        if (b.kind === "table")
          return (
            <table className="tbl" key={i}>
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j}>{inline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci}>{inline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        if (b.kind === "quote")
          return (
            <blockquote key={i} className="quote">
              {inline(b.text)}
            </blockquote>
          );
        const Tag = b.kind;
        return (
          <Tag key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}
