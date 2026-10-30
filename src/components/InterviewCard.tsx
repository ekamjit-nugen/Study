import type { ReactNode } from "react";
import type { Interview } from "../courses/types";
import { Prose } from "../lib/md";
import { Code } from "./Bits";
import SqlRunner from "./SqlRunner";

export function interviewTag(q: Interview): ReactNode {
  return (
    <>
      {q.tricky && <span className="pill warn lvl">tricky</span>}
      <span className={`pill lvl ${q.level === "senior" ? "bad" : q.level === "mid" ? "warn" : "ok"}`}>{q.level}</span>
    </>
  );
}

export function interviewAnswer(q: Interview, extra?: ReactNode): ReactNode {
  return (
    <>
      {q.sql && <Code ex={{ lang: "sql", src: q.sql }} />}
      <Prose text={q.a} />
      {q.sql && <SqlRunner sql={q.sql} title="Check it on the data" />}
      {extra}
    </>
  );
}

/** Question text shown on the card: adds a hint when a snippet is attached. */
export function interviewQuestion(q: Interview): string {
  return q.sql ? q.q + "  (snippet inside)" : q.q;
}
