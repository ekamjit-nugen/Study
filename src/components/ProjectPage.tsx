import { findStage } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { inline } from "../lib/md";

export default function ProjectPage({ stageId }: { stageId: string }) {
  const stage = findStage(stageId);
  const t = useTrack();
  if (!stage)
    return (
      <div className="content">
        <h1>Project not found</h1>
        <a href={href.home()}>Back to the path</a>
      </div>
    );
  const pr = stage.project;
  const done = t.projectDone(stage.id);
  return (
    <div className="content player">
      <div className="small muted crumbs">
        <a href={href.stage(stage.id)}>Stage {stage.num}: {stage.title}</a> · stage project
      </div>
      <div className="lesson-head">
        <div className="step-kind">Stage {stage.num} project {done && <span className="pill ok">done</span>}</div>
        <h1 className="step-title">{pr.title}</h1>
        <p className="step-lead">{inline(pr.goal)}</p>
      </div>
      <h2>Steps</h2>
      <ol className="how">
        {pr.steps.map((s, i) => (
          <li key={i}>{inline(s)}</li>
        ))}
      </ol>
      <h2>Deliverable</h2>
      <p>{inline(pr.deliverable)}</p>
      <h2>You are done when</h2>
      <ul className="remember">
        {pr.checks.map((c, i) => (
          <li key={i}>{inline(c)}</li>
        ))}
      </ul>
      <div className="card mark-row">
        <div>
          <b>Finished the project?</b> <span className="muted">Mark it only when every check above is true.</span>
        </div>
        <button className={`btn ${done ? "ok" : "primary"}`} onClick={() => t.setProjectDone(stage.id, !done)}>
          {done ? "✓ Done · tap to undo" : "Mark project done"}
        </button>
      </div>
      <div className="step-nav">
        <a className="btn" href={href.stage(stage.id)}>← Stage {stage.num}</a>
      </div>
    </div>
  );
}
