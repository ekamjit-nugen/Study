import { STAGES, findStage } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { moduleProgress, stageProgress } from "../lib/progressCalc";
import { inline } from "../lib/md";

export default function StagePage({ id }: { id: string }) {
  const stage = findStage(id);
  const t = useTrack();
  if (!stage)
    return (
      <div className="content">
        <h1>Stage not found</h1>
        <a href={href.home()}>Back to the path</a>
      </div>
    );
  const p = stageProgress(stage, t.track);
  const i = STAGES.findIndex((s) => s.id === id);
  const prev = STAGES[i - 1];
  const next = STAGES[i + 1];
  return (
    <div className="content player">
      <div className="small muted crumbs">
        <a href={href.home()}>The path</a> · stage {stage.num} of {STAGES.length}
      </div>
      <div className="lesson-head">
        <div className="step-kind">Stage {stage.num} {p.complete && <span className="pill ok">complete</span>}</div>
        <h1 className="step-title">{stage.title}</h1>
        <p className="step-lead">{inline(stage.objective)}</p>
        <div className="progress-row">
          <div className="progressbar big">
            <div style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
          </div>
          <span className="small muted">
            {p.done}/{p.total} lessons · {p.modulesComplete}/{p.modulesTotal} modules · project {p.projectDone ? "done" : "not yet"}
          </span>
        </div>
      </div>

      <h2>Modules</h2>
      <div className="module-cards">
        {stage.modules.map((m) => {
          const mp = moduleProgress(m, t.track);
          return (
            <a key={m.id} href={href.module(m.id)} className={`card module-card ${mp.complete ? "done" : ""}`}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>
                  Module {m.num}: {m.title}
                </b>
                <span className="small muted">
                  {mp.done}/{mp.total} {mp.passed && "· quiz ✓"}
                </span>
              </div>
              <p className="small muted">{m.goal}</p>
              <div className="progressbar">
                <div style={{ width: `${mp.total ? (mp.done / mp.total) * 100 : 0}%` }} />
              </div>
              {mp.written === 0 && <span className="small muted">lessons coming</span>}
            </a>
          );
        })}
      </div>

      <h2>Stage project</h2>
      <a href={href.project(stage.id)} className={`card module-card ${p.projectDone ? "done" : ""}`}>
        <b>🏗️ {stage.project.title}</b>
        <p className="small muted">{stage.project.goal}</p>
        <span className="small">{p.projectDone ? "✓ done" : "Open the project →"}</span>
      </a>

      <div className="step-nav">
        {prev ? <a className="btn" href={href.stage(prev.id)}>← Stage {prev.num}</a> : <a className="btn" href={href.home()}>← The path</a>}
        {next ? <a className="btn primary" href={href.stage(next.id)}>Stage {next.num}: {next.title} →</a> : <span />}
      </div>
    </div>
  );
}
