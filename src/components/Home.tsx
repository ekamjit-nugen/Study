import { COUNTS, STAGES, lessonLabel, moduleOf } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { nextUp, overall, stageProgress } from "../lib/progressCalc";
import { inline } from "../lib/md";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">{label}</div>
      {sub && <div className="small muted">{sub}</div>}
    </div>
  );
}

export default function Home() {
  const t = useTrack();
  const o = overall(t.track);
  const next = nextUp(t.track);
  return (
    <div className="content">
      <div className="hero">
        <h1>AI Engineer Path</h1>
        <p>
          From what AI is to production systems and a Punjabi assistant: <b>{COUNTS.stages} stages</b>, <b>{COUNTS.modules} modules</b>, <b>{COUNTS.lessons} lessons</b>, one concept each. Every lesson starts from first principles, explains every word before using it, shows the maths with real numbers and the code when it helps, and ends with what to remember.
        </p>
        {next && (
          <div className="card continue">
            <div>
              <div className="small muted">{t.track.lastLesson === next.slug ? "Continue where you left off" : "Next up"}</div>
              <b>
                {lessonLabel(next)} {next.title}
              </b>
              <div className="small muted">
                Module {moduleOf(next).num}: {moduleOf(next).title}
              </div>
            </div>
            <a className="btn primary" href={href.lesson(next.slug)}>
              Open lesson →
            </a>
          </div>
        )}
      </div>

      <h2>Your progress</h2>
      <p className="small muted">Tracked separately, and nothing is counted until you mark it yourself.</p>
      <div className="tiles">
        <Tile label="Stages complete" value={`${o.stagesComplete}/${o.stagesTotal}`} sub="all modules done + project" />
        <Tile label="Modules complete" value={`${o.modulesComplete}/${o.modulesTotal}`} sub="every lesson marked" />
        <Tile label="Lessons complete" value={`${o.lessonsDone}/${o.lessonsWritten}`} sub={`${o.lessonsWritten} of ${o.lessonsTotal} written so far`} />
        <Tile label="Exercises done" value={`${o.exercisesDone}/${o.exercisesTotal}`} />
        <Tile label="Projects done" value={`${o.projectsDone}/${o.projectsTotal}`} />
        <Tile label="Marked for revision" value={String(o.revision)} sub="lessons to revisit" />
        <Tile label="Quizzes passed" value={`${o.assessmentsPassed}/${o.assessmentsTotal}`} sub={`${o.assessmentsTaken} taken`} />
      </div>

      <h2>The path</h2>
      <div className="stage-cards">
        {STAGES.map((s) => {
          const p = stageProgress(s, t.track);
          return (
            <a key={s.id} href={href.stage(s.id)} className={`card stage-card ${p.complete ? "done" : ""}`}>
              <div className="stage-num">Stage {s.num}</div>
              <h3>{s.title}</h3>
              <p className="small muted">{s.objective}</p>
              <div className="progressbar">
                <div style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
              </div>
              <div className="small muted">
                {s.modules.length} modules · {p.total} lessons · {p.written} written · {p.done} complete {p.projectDone && "· project ✓"}
              </div>
            </a>
          );
        })}
      </div>

      <h2>How to learn here</h2>
      <div className="grid2">
        <div className="card soft">
          <h3>Every lesson, the same shape</h3>
          <ol className="small">
            <li>Concept, from first principles</li>
            <li>Why it exists: the problem it solves</li>
            <li>How it works, step by step</li>
            <li>A visual</li>
            <li>An everyday example</li>
            <li>A real engineering example</li>
            <li>A creative example, when it helps</li>
            <li>The maths, with numbers worked through</li>
            <li>Code, when it helps</li>
            <li>Where it is used</li>
            <li>Key takeaways</li>
          </ol>
        </div>
        <div className="card soft">
          <h3>The rules</h3>
          <ul className="small">
            <li>{inline("One concept per lesson, in order. Nothing advanced before its prerequisites.")}</li>
            <li>{inline("Every technical word is explained **before** it is used: under the paragraph, or in its own lesson.")}</li>
            <li>{inline("Quizzes and exercises sit at the **end of each module**, a project at the end of each stage.")}</li>
            <li>{inline("Reading never marks a lesson complete. **You** mark it, when you could explain it to someone.")}</li>
            <li>{inline("Examples come from healthcare, finance, retail, logistics, robotics, security and more; Punjabi examples live in Stage 9.")}</li>
            <li>{inline("Come back any time: mark a lesson **revisit later** and it waits for you under Revision.")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
