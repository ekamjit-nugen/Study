import { useState } from "react";
import type { Course, Module, Topic, Section, RealWorld } from "../courses/types";
import { inline, Prose } from "../lib/md";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { useLocal } from "../lib/useLocal";
import { Callout, Code, DataTable, More, TapCards, Tldr, Words } from "./Bits";
import { Diagram } from "./Diagrams";
import SqlRunner from "./SqlRunner";
import { interviewAnswer, interviewQuestion, interviewTag } from "./InterviewCard";
import { Ladder, Visual, splitBullet } from "./Visuals";

type Mode = "visual" | "full";

function Bullets({ bullets, mode }: { bullets: string[]; mode: Mode }) {
  if (mode === "full")
    return (
      <ul>
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>
    );
  return <TapCards items={bullets.map((b) => { const { title, detail } = splitBullet(b); return { q: title, a: detail }; })} />;
}

function Hidden({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="readmore" onClick={() => setOpen((o) => !o)}>
        {open ? "▾ " : "▸ "}
        {label}
      </button>
      {open && <div className="sect-words">{children}</div>}
    </div>
  );
}

function SectionView({ s, n, mode }: { s: Section; n: number; mode: Mode }) {
  const hasPicture = !!(s.diagram || s.visual);
  return (
    <section className="section">
      <h2>
        <span className="n">{n}.</span> {inline(s.title)}
      </h2>
      {(s.analogy || s.why) && (
        <div className="analogy">
          {s.analogy && (
            <div className="analogy-line">
              <span className="analogy-tag">Think of it like</span> {inline(s.analogy)}
            </div>
          )}
          {s.why && (
            <div className="analogy-line why">
              <span className="analogy-tag">Why you care</span> {inline(s.why)}
            </div>
          )}
        </div>
      )}
      {s.diagram && <Diagram id={s.diagram} />}
      {s.visual && <Visual spec={s.visual} />}
      {s.body && (mode === "full" || !hasPicture ? <Prose text={s.body} /> : <Hidden label="Read the words"><Prose text={s.body} /></Hidden>)}
      {s.bullets && <Bullets bullets={s.bullets} mode={mode} />}
      {s.table && <DataTable table={s.table} />}
      {s.code?.map((c, i) => (
        <Code key={i} ex={c} />
      ))}
      {s.sql?.map((q, i) => (
        <SqlRunner key={i} sql={q.sql} title={q.title} note={q.note} explain={q.explain} />
      ))}
      {s.tip && <Callout kind="tip" label="Tip:" text={s.tip} />}
      {s.warn && <Callout kind="warn" label="Watch out:" text={s.warn} />}
      {s.more && (
        <More>
          <Prose text={s.more} />
        </More>
      )}
    </section>
  );
}

function RealWorldView({ rw, mode }: { rw: RealWorld; mode: Mode }) {
  return (
    <div className="card rw">
      <h3>{inline(rw.title)}</h3>
      <p className="problem">{inline(rw.problem)}</p>
      {mode === "full" ? (
        <>
          <p className="small">
            <b>Why it feels hard:</b> {inline(rw.whyHard)}
          </p>
          <ol>
            {rw.steps.map((st, j) => (
              <li key={j}>{inline(st)}</li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <Ladder steps={rw.steps.map((st, j) => { const { title, detail } = splitBullet(st); return { label: title, sub: detail || undefined, tone: j === rw.steps.length - 1 ? "ok" : "accent" }; })} />
          <Hidden label="Why it feels hard">
            <p className="small">{inline(rw.whyHard)}</p>
          </Hidden>
        </>
      )}
      {rw.sql && <SqlRunner sql={rw.sql} title="Solution — run it" explain />}
      {rw.code && <Code ex={rw.code} />}
      <Callout kind="tip" label="Takeaway:" text={rw.takeaway} />
    </div>
  );
}

export default function TopicView({ course, module, topic, prev, next }: { course: Course; module: Module; topic: Topic; prev?: Topic; next?: Topic }) {
  const { isDone, toggle } = useProgress();
  const [mode, setMode] = useLocal<Mode>("fsm-view", "visual");
  const id = `${course.id}/${topic.slug}`;
  const done = isDone(id);
  return (
    <div className="content">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="small muted">
          <a href={href.course(course.id)}>{course.title}</a> · {module.title} · {topic.minutes} min
        </div>
        <div className="viewtoggle" title="Visual shows pictures first and hides the long words; Full shows everything">
          <button className={mode === "visual" ? "on" : ""} onClick={() => setMode("visual")}>🖼 Visual</button>
          <button className={mode === "full" ? "on" : ""} onClick={() => setMode("full")}>📖 Full</button>
        </div>
      </div>
      <h1>{topic.title}</h1>
      <div className="story">{inline(topic.story)}</div>
      <Tldr points={topic.tldr} />
      {topic.words && <Words words={topic.words} />}

      {topic.sections.map((s, i) => (
        <SectionView key={i} s={s} n={i + 1} mode={mode} />
      ))}

      {topic.realWorld && topic.realWorld.length > 0 && (
        <section className="section">
          <h2>Hard in real life, easy here</h2>
          {topic.realWorld.map((rw, i) => (
            <RealWorldView key={i} rw={rw} mode={mode} />
          ))}
        </section>
      )}

      <section className="section">
        <h2>Practice</h2>
        <p className="small muted">Answers are always visible. Tap a question to see the answer and why.</p>
        {topic.practice.map((p, i) => (
          <div className="card practice" key={i}>
            <TapCards items={[{ q: p.q, a: `**Answer:** ${p.answer}\n\n**Why:** ${p.explain}` }]} />
            {p.sql && <SqlRunner sql={p.starter ?? "-- write your query here\n"} solution={p.sql} draftKey={`fsm-draft-${id}-${i}`} />}
            {p.sql && (
              <More title="Show the solution query">
                <Code ex={{ lang: "sql", src: p.sql }} />
              </More>
            )}
          </div>
        ))}
      </section>

      <section className="section interview">
        <h2>Interview questions</h2>
        <TapCards
          items={topic.interview.map((q) => ({ q: interviewQuestion(q), a: interviewAnswer(q), tag: interviewTag(q) }))}
        />
      </section>

      <section className="section">
        <h2>Remember</h2>
        <ul className="remember">
          {topic.remember.map((r, i) => (
            <li key={i}>{inline(r)}</li>
          ))}
        </ul>
      </section>

      <div className="row" style={{ marginTop: "1.5rem" }}>
        <button className={`btn ${done ? "ok" : "primary"}`} onClick={() => toggle(id)}>
          {done ? "✓ Done — click to undo" : "Mark as done"}
        </button>
      </div>
      <div className="nav-foot">
        <span>{prev && <a href={href.topic(course.id, prev.slug)}>← {prev.title}</a>}</span>
        <span>{next && <a href={href.topic(course.id, next.slug)}>{next.title} →</a>}</span>
      </div>
    </div>
  );
}
