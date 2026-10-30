import { useEffect, useRef, useState } from "react";
import { MISSIONS, type Mission } from "../courses/db/project";
import { DB_COURSE } from "../courses/db";
import { inline } from "../lib/md";
import { runChecks, type CheckResult } from "../lib/projectChecks";
import { href } from "../lib/route";
import { notifyChange, projectDb, resetProject, saveProject } from "../lib/sqlBrowser";
import { runSql } from "../lib/sqlCore";
import { useLocal } from "../lib/useLocal";
import { Callout, Code, More, TapCards } from "./Bits";
import SqlRunner from "./SqlRunner";
import { Ladder } from "./Visuals";

function useMissionProgress() {
  const [done, setDone] = useLocal<string[]>("fsm-project-done", []);
  return {
    done,
    isDone: (id: string) => done.includes(id),
    mark: (id: string) => setDone((d) => (d.includes(id) ? d : [...d, id])),
    clear: () => setDone([]),
  };
}

function topicTitle(slug: string): string {
  for (const m of DB_COURSE.modules) for (const t of m.topics) if (t.slug === slug) return t.title;
  return slug;
}

export function ProjectHome() {
  const { done, isDone, clear } = useMissionProgress();
  const next = MISSIONS.find((m) => !isDone(m.id));
  const pct = Math.round((done.length / MISSIONS.length) * 100);
  async function reset() {
    if (!confirm("Start the project again from an empty database? Your missions progress will be cleared too.")) return;
    await resetProject();
    clear();
  }
  return (
    <div className="content">
      <div className="hero" style={{ background: "linear-gradient(135deg, var(--warn-soft), var(--card))" }}>
        <h1>🏗️ Build the shop</h1>
        <p>You own an online shop. Mission by mission you build its database with your own hands: tables with rules, real data, the reports the owner asks for, then safety and speed. Each mission is checked automatically on YOUR database.</p>
        <p className="small">Nothing here uses the lesson data; you start from an empty database and it is saved in your browser.</p>
      </div>
      <div className="card continue">
        <div>
          <div className="side-title" style={{ padding: 0 }}>
            {done.length} of {MISSIONS.length} missions done · {pct}%
          </div>
          <div className="progressbar big" style={{ width: 260, marginTop: 6 }}>
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        {next ? (
          <a className="btn primary" href={href.mission(next.id)}>
            {done.length ? "Continue →" : "Start mission 1 →"}
          </a>
        ) : (
          <span className="pill ok">🎉 Project complete</span>
        )}
      </div>
      <div className="card">
        <ol className="mission-list">
          {MISSIONS.map((m, i) => (
            <li key={m.id} className={isDone(m.id) ? "done" : next?.id === m.id ? "next" : ""}>
              <span className="path-dot">{isDone(m.id) ? "✓" : next?.id === m.id ? "▶" : "○"}</span>
              <a href={href.mission(m.id)}>
                {i + 1}. {m.title}
              </a>
              <span className="small muted"> · {m.goal.length > 90 ? m.goal.slice(0, 88) + "…" : m.goal}</span>
            </li>
          ))}
        </ol>
        <button className="btn small" onClick={() => void reset()}>
          ↺ Start the project over
        </button>
      </div>
    </div>
  );
}

export function MissionPage({ id }: { id: string }) {
  const idx = MISSIONS.findIndex((m) => m.id === id);
  const mission: Mission | undefined = MISSIONS[idx];
  const { isDone, mark } = useMissionProgress();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const text = useRef("");
  useEffect(() => {
    setResults(null);
    setLoaded(null);
  }, [id]);
  if (!mission)
    return (
      <div className="content">
        <h1>Mission not found</h1>
        <a href={href.project()}>Back to the project</a>
      </div>
    );
  const next = MISSIONS[idx + 1];
  const done = isDone(mission.id);

  async function loadData() {
    if (!mission?.data) return;
    const db = await projectDb();
    const r = runSql(db, mission.data);
    saveProject();
    notifyChange();
    setLoaded(r.ok ? "Data loaded. Check the Data panel in the editor below." : "Could not load: " + r.error + " (create the table first)");
  }

  async function check() {
    if (!mission) return;
    setBusy(true);
    const r = await runChecks(mission, text.current);
    setResults(r);
    if (r.every((c) => c.ok)) mark(mission.id);
    setBusy(false);
  }

  const allOk = results?.every((c) => c.ok) ?? false;
  return (
    <div className="content player">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="small muted">
          <a href={href.project()}>Build the shop</a> · mission {idx + 1} of {MISSIONS.length}
        </div>
        <a className="small" href={href.topic("db", mission.learn)}>
          📘 stuck? study: {topicTitle(mission.learn)}
        </a>
      </div>
      <div className="progress-row">
        <div className="progressbar big">
          <div style={{ width: `${Math.round(((idx + (done ? 1 : 0)) / MISSIONS.length) * 100)}%` }} />
        </div>
        <span className="small muted">{done ? "done ✓" : "in progress"}</span>
      </div>
      <div className="card step">
        <div className="step-kind">Mission {idx + 1}</div>
        <h2 className="step-title">{mission.title}</h2>
        <p className="step-lead">{inline(mission.goal)}</p>
        <div className="analogy">
          <div className="analogy-line">
            <span className="analogy-tag">Think of it like</span> {inline(mission.analogy)}
          </div>
          <div className="analogy-line why">
            <span className="analogy-tag">Why you care</span> {inline(mission.why)}
          </div>
        </div>
        <h3>What to do</h3>
        <Ladder steps={mission.steps.map((st, i) => ({ label: st, tone: i === mission.steps.length - 1 ? "ok" : "accent" }))} />
        {mission.data && (
          <div className="card soft">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b>Data for this mission</b>
              <button className="btn small primary" onClick={() => void loadData()}>
                ⬇ Load this data
              </button>
            </div>
            <Code ex={{ lang: "sql", src: mission.data }} />
            {loaded && <div className="small">{loaded}</div>}
          </div>
        )}
        <h3>Your SQL</h3>
        <SqlRunner sql={"-- write your SQL here, then press Run\n"} title="Runs on YOUR project database" target="project" draftKey={`fsm-project-draft-${mission.id}`} explain onChange={(t) => (text.current = t)} />
        <div className="row" style={{ margin: "0.6rem 0" }}>
          <button className="btn ok" onClick={() => void check()} disabled={busy}>
            ✓ Check mission
          </button>
          {done && <span className="pill ok">completed</span>}
        </div>
        {results && (
          <div className={`card ${allOk ? "" : "soft"}`} style={{ borderLeft: `4px solid ${allOk ? "var(--ok)" : "var(--bad)"}` }}>
            {allOk && <h3>🎉 Mission complete</h3>}
            <ul className="checks">
              {results.map((c, i) => (
                <li key={i} className={c.ok ? "ok" : "bad"}>
                  <b>{c.ok ? "✓" : "✗"} {c.label}</b>
                  {!c.ok && <div className="small">{c.msg}</div>}
                </li>
              ))}
            </ul>
            {allOk && next && (
              <a className="btn primary" href={href.mission(next.id)}>
                Next mission: {next.title} →
              </a>
            )}
            {allOk && !next && <Callout kind="tip" label="You built it." text="Every table, rule, report and safety net in this shop is yours. Open the SQL playground and keep going." />}
          </div>
        )}
        <TapCards items={[{ q: "💡 Give me a hint", a: mission.hint }]} />
        <More title="Show the solution">
          <Code ex={{ lang: "sql", src: mission.solution }} />
          <p className="small muted">Paste it into the editor and press Run, then Check mission. Better: read it, close it, and write your own.</p>
        </More>
      </div>
      <div className="step-nav">
        {idx > 0 ? (
          <a className="btn" href={href.mission(MISSIONS[idx - 1].id)}>
            ← Previous
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="btn" href={href.mission(next.id)}>
            Skip to next →
          </a>
        ) : (
          <a className="btn" href={href.project()}>
            Back to project
          </a>
        )}
      </div>
    </div>
  );
}
