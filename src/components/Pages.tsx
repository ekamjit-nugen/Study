import { useMemo, useState } from "react";
import { COURSES } from "../courses/registry";
import type { Course, Interview, RealWorld, Topic } from "../courses/types";
import { inline } from "../lib/md";
import { useProgress } from "../lib/progress";
import { useLastTopic } from "../lib/learner";
import { href } from "../lib/route";
import { Callout, Code, TapCards } from "./Bits";
import { Diagram } from "./Diagrams";
import SqlRunner from "./SqlRunner";
import { interviewAnswer, interviewQuestion, interviewTag } from "./InterviewCard";

function nextUp(course: Course, isDone: (id: string) => boolean) {
  for (const m of course.modules) for (const t of m.topics) if (!isDone(`${course.id}/${t.slug}`)) return t;
  return undefined;
}

export function ContinueCard({ course }: { course?: Course }) {
  const { isDone } = useProgress();
  const [last] = useLastTopic();
  const c = course ?? COURSES[0];
  const resume = last && (!course || last.course === course.id) ? last : null;
  const next = nextUp(c, isDone);
  const target = resume ?? (next ? { course: c.id, slug: next.slug, title: next.title } : null);
  if (!target) return null;
  return (
    <div className="card continue">
      <div>
        <div className="side-title" style={{ padding: 0 }}>{resume ? "Continue where you left off" : "Start here"}</div>
        <h3 style={{ margin: "0.2rem 0 0" }}>{target.title}</h3>
        {next && resume && next.slug !== resume.slug && (
          <div className="small muted">
            Next not-done topic: <a href={href.topic(c.id, next.slug)}>{next.title}</a>
          </div>
        )}
      </div>
      <a className="btn primary" href={href.topic(target.course, target.slug)}>
        {resume ? "Continue →" : "Start →"}
      </a>
    </div>
  );
}

export function Home() {
  const { isDone } = useProgress();
  return (
    <div className="content">
      <div className="hero">
        <h1>Full-Stack Mastery</h1>
        <p>One idea per screen. A story, a picture, something to run, a quick check, a real problem, then interview questions. About 15 minutes a topic.</p>
        <p className="small">Start with Databases. React, Next.js, Node and NestJS follow the same format.</p>
      </div>
      <ContinueCard />
      <a href="#/project" className="card course-card" style={{ borderLeft: "4px solid var(--warn)" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="emoji">🏗️</span>
          <span className="pill warn">learn by building</span>
        </div>
        <h3 style={{ marginTop: "0.5rem" }}>Build the shop: a guided project</h3>
        <p className="small muted">20 small missions on your own database: create the tables, load data, write the reports, add safety and speed. Every mission is checked automatically.</p>
      </a>
      <div className="grid2">
        {COURSES.map((c) => {
          const total = c.modules.reduce((n, m) => n + m.topics.length, 0);
          const done = c.modules.reduce((n, m) => n + m.topics.filter((t) => isDone(`${c.id}/${t.slug}`)).length, 0);
          return (
            <a key={c.id} href={href.course(c.id)} className="card course-card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="emoji">{c.emoji}</span>
                <span className={`pill ${c.status === "ready" ? "ok" : "muted"}`}>{c.status === "ready" ? `${done}/${total} topics done` : "coming next"}</span>
              </div>
              <h3 style={{ marginTop: "0.5rem" }}>{c.title}</h3>
              <p className="small muted">{c.tagline}</p>
            </a>
          );
        })}
      </div>
      <div className="card soft" style={{ marginTop: "1rem" }}>
        <h3>How to use this</h3>
        <ul className="small">
          <li>Read the story and the "In 30 seconds" box first. If that is enough, move on.</li>
          <li>Every SQL box runs for real in your browser (SQLite). Change it, break it, press Run.</li>
          <li>"Check my answer" compares your rows with the expected rows, in any order.</li>
          <li>Each topic ends with a hard real-world problem. Those are the ones interviews ask.</li>
        </ul>
      </div>
    </div>
  );
}

export function CourseHome({ course }: { course: Course }) {
  const { isDone } = useProgress();
  if (course.status === "coming")
    return (
      <div className="content">
        <h1>
          {course.emoji} {course.title}
        </h1>
        <p className="muted">{course.tagline}</p>
        <div className="card">
          <h3>Planned modules</h3>
          <ol>{course.planned?.map((p) => <li key={p}>{p}</li>)}</ol>
          <p className="small muted">This course is next in line. The Databases course is complete and ready.</p>
        </div>
      </div>
    );
  const next = nextUp(course, isDone);
  return (
    <div className="content">
      <h1>
        {course.emoji} {course.title}
      </h1>
      <p className="muted">{course.tagline}</p>
      <ContinueCard course={course} />
      {course.modules.map((m, mi) => (
        <div className="card" key={m.id}>
          <h3>
            {mi + 1}. {m.title}
          </h3>
          <p className="small muted">{m.simple}</p>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {m.topics.map((t, ti) => (
              <li key={t.slug}>
                <span className={`path-dot ${isDone(`${course.id}/${t.slug}`) ? "done" : next?.slug === t.slug ? "next" : ""}`}>{isDone(`${course.id}/${t.slug}`) ? "✓" : next?.slug === t.slug ? "▶" : "○"}</span>{" "}
                <a href={href.topic(course.id, t.slug)}>
                  {mi + 1}.{ti + 1} {t.title}
                </a>{" "}
                <span className="small muted">· {t.minutes} min</span> {next?.slug === t.slug && <span className="pill">next up</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function allTopics(): { course: Course; topic: Topic; moduleTitle: string }[] {
  return COURSES.flatMap((c) => c.modules.flatMap((m) => m.topics.map((t) => ({ course: c, topic: t, moduleTitle: m.title }))));
}

export function HardProblems() {
  const items = useMemo(() => allTopics().flatMap((x) => (x.topic.realWorld ?? []).map((rw) => ({ ...x, rw }))), []);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="content">
      <h1>Hard problems, made easy</h1>
      <p className="muted">Every real-world problem from every topic, in one place. These are the questions that look impossible in an interview until you know the trick.</p>
      {items.map(({ course, topic, rw }, i) => (
        <div className="card rw" key={i}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{inline(rw.title)}</h3>
            <a className="small" href={href.topic(course.id, topic.slug)}>
              from: {topic.title}
            </a>
          </div>
          <p className="problem" style={{ marginTop: "0.5rem" }}>{inline(rw.problem)}</p>
          {open === i ? <RealWorldBody rw={rw} /> : (
            <button className="btn small" onClick={() => setOpen(i)}>
              Show the trick
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function RealWorldBody({ rw }: { rw: RealWorld }) {
  return (
    <>
      <p className="small">
        <b>Why it feels hard:</b> {inline(rw.whyHard)}
      </p>
      <ol>{rw.steps.map((s, j) => <li key={j}>{inline(s)}</li>)}</ol>
      {rw.sql && <SqlRunner sql={rw.sql} title="Solution — run it" explain />}
      {rw.code && <Code ex={rw.code} />}
      <Callout kind="tip" label="Takeaway:" text={rw.takeaway} />
    </>
  );
}

export function InterviewBank() {
  const all = useMemo(() => allTopics().flatMap((x) => x.topic.interview.map((q) => ({ ...x, q }))), []);
  const [level, setLevel] = useState<"all" | "tricky" | Interview["level"]>("all");
  const [search, setSearch] = useState("");
  const shown = all.filter((x) => (level === "all" || (level === "tricky" ? x.q.tricky : x.q.level === level)) && (!search || (x.q.q + " " + x.q.a + " " + x.topic.title).toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="content interview-bank">
      <h1>Interview bank</h1>
      <p className="muted">{all.length} questions across every topic ({all.filter((x) => x.q.tricky).length} tricky). Answers are written the way you would say them out loud.</p>
      <input className="search" placeholder="Search questions, e.g. index, deadlock, normalization" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="chips">
        {(["all", "junior", "mid", "senior", "tricky"] as const).map((l) => (
          <button key={l} className={`chip ${level === l ? "active" : ""}`} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>
      <TapCards
        items={shown.map((x) => ({
          q: interviewQuestion(x.q),
          a: interviewAnswer(
            x.q,
            <a className="small" href={href.topic(x.course.id, x.topic.slug)}>
              study: {x.topic.title}
            </a>,
          ),
          tag: interviewTag(x.q),
        }))}
      />
    </div>
  );
}

export function Playground() {
  return (
    <div className="content">
      <h1>SQL playground</h1>
      <p className="muted">A real SQLite database in your browser with the shop data. Anything goes: CREATE, INSERT, EXPLAIN, window functions, recursive CTEs. Reset data brings everything back.</p>
      <Diagram id="erd" />
      <SqlRunner
        sql={`-- Try anything. A few starters:
SELECT c.name, COUNT(DISTINCT o.id) AS orders, ROUND(SUM(oi.qty * oi.unit_price), 2) AS spent
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY spent DESC;`}
        title="Scratchpad"
        explain
        draftKey="fsm-playground"
      />
      <div className="card soft small">
        <b>Useful SQLite bits:</b> <code>SELECT name, sql FROM sqlite_master</code> lists tables and indexes · <code>PRAGMA table_info(orders)</code> shows columns · <code>EXPLAIN QUERY PLAN SELECT …</code> shows the plan (or press Show plan) · dates are text, so use <code>date(ordered_at)</code>, <code>strftime('%Y-%m', ordered_at)</code>.
      </div>
    </div>
  );
}

export function CheatSheet() {
  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: "Reading",
      rows: [
        ["SELECT cols FROM t WHERE … ORDER BY … LIMIT n", "the shape of every read"],
        ["SELECT DISTINCT city FROM customers", "unique values"],
        ["WHERE x IN (…) / BETWEEN a AND b / LIKE 'A%' / IS NULL", "filters; never x = NULL"],
        ["COALESCE(a, b)", "first non-NULL"],
        ["CASE WHEN … THEN … ELSE … END", "if/else inside SQL"],
      ],
    },
    {
      title: "Joining",
      rows: [
        ["INNER JOIN", "only matches"],
        ["LEFT JOIN … WHERE right.id IS NULL", "rows with no match (anti-join)"],
        ["FULL OUTER JOIN", "both sides, NULL-padded"],
        ["JOIN t2 ON cond AND extra", "filter the right side before the join (keeps LEFT rows)"],
        ["EXISTS (SELECT 1 FROM … WHERE …)", "semi-join; stops at first match"],
      ],
    },
    {
      title: "Grouping and windows",
      rows: [
        ["GROUP BY k HAVING COUNT(*) > 1", "duplicates"],
        ["SUM(CASE WHEN … THEN 1 ELSE 0 END)", "conditional count (pivot)"],
        ["ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)", "top-N per group when = 1"],
        ["SUM(x) OVER (ORDER BY d)", "running total"],
        ["LAG(x) OVER (ORDER BY d)", "previous row's value"],
      ],
    },
    {
      title: "Writing",
      rows: [
        ["INSERT … ON CONFLICT (k) DO UPDATE SET …", "upsert"],
        ["UPDATE t SET x = x + 1 WHERE id = ? RETURNING *", "atomic increment"],
        ["UPDATE … WHERE id = ? AND version = ?", "optimistic lock"],
        ["SELECT … FOR UPDATE", "pessimistic row lock"],
        ["BEGIN; … COMMIT; / ROLLBACK;", "all or nothing"],
      ],
    },
    {
      title: "Schema and speed",
      rows: [
        ["CREATE INDEX i ON t(a, b)", "leftmost prefix: a, or a+b, not b alone"],
        ["CREATE UNIQUE INDEX", "a rule and a fast lookup"],
        ["CREATE INDEX i ON t(a) WHERE deleted_at IS NULL", "partial index"],
        ["EXPLAIN (ANALYZE) SELECT …", "the real plan with real times"],
        ["WHERE id > :last ORDER BY id LIMIT 20", "keyset pagination"],
      ],
    },
  ];
  return (
    <div className="content">
      <h1>SQL cheat sheet</h1>
      {groups.map((g) => (
        <div className="card" key={g.title}>
          <h3>{g.title}</h3>
          <table className="tbl">
            <tbody>
              {g.rows.map(([a, b]) => (
                <tr key={a}>
                  <td>
                    <code>{a}</code>
                  </td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
