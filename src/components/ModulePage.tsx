import { useEffect, useRef, useState } from "react";
import { MODULES, findModule, lessonLabel, stageOf } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { moduleProgress, PASS_MARK } from "../lib/progressCalc";
import { inline, Prose } from "../lib/md";
import { QuizCard } from "./QuizCard";
import { TapCards } from "./Bits";

export default function ModulePage({ id }: { id: string }) {
  const module = findModule(id);
  const t = useTrack();
  const [chosen, setChosen] = useState<(number | null)[]>([]);
  const recorded = useRef(false);
  useEffect(() => {
    setChosen(module ? module.quiz.map(() => null) : []);
    recorded.current = false;
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!module)
    return (
      <div className="content">
        <h1>Module not found</h1>
        <a href={href.home()}>Back to the path</a>
      </div>
    );
  const stage = stageOf(module);
  const p = moduleProgress(module, t.track);
  const idx = MODULES.findIndex((m) => m.id === id);
  const prevM = MODULES[idx - 1];
  const nextM = MODULES[idx + 1];
  const answered = chosen.filter((c) => c !== null).length;
  const allAnswered = module.quiz.length > 0 && answered === module.quiz.length;
  const score = chosen.filter((c, i) => c === module.quiz[i]?.answer).length;
  useEffect(() => {
    if (allAnswered && !recorded.current) {
      recorded.current = true;
      t.recordAssessment(id, score, module.quiz.length);
    }
  }, [allAnswered]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="content player">
      <div className="small muted crumbs">
        <a href={href.stage(stage.id)}>Stage {stage.num}: {stage.title}</a> · module {module.num} of 50
      </div>
      <div className="lesson-head">
        <div className="step-kind">Module {module.num} {p.complete && <span className="pill ok">all lessons complete</span>} {p.passed && <span className="pill ok">quiz passed</span>}</div>
        <h1 className="step-title">{module.title}</h1>
        <p className="step-lead">{inline(module.goal)}</p>
        {module.examples && <p className="small muted">Examples in this module: {module.examples}</p>}
        <div className="progress-row">
          <div className="progressbar big">
            <div style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
          </div>
          <span className="small muted">
            {p.done}/{p.total} lessons complete · {p.written} written
          </span>
        </div>
      </div>

      <h2>Lessons: one concept each</h2>
      <ol className="lesson-list">
        {module.lessons.map((l) => {
          const done = t.lessonDone(l.slug);
          return (
            <li key={l.slug} className={`${done ? "done" : ""} ${l.body ? "" : "planned"}`}>
              <a href={href.lesson(l.slug)}>
                <span className="num">{lessonLabel(l)}</span>
                <span className="ttl">{l.title}</span>
                <span className="small muted">{l.body ? `${l.minutes} min` : "coming"}</span>
                {done && <span className="done-mark">✓</span>}
                {t.flagged(l.slug) && <span className="pill warn">revisit</span>}
              </a>
            </li>
          );
        })}
      </ol>

      {module.quiz.length > 0 && (
        <>
          <h2 id="quiz">Module quiz</h2>
          <p className="small muted">
            {module.quiz.length} questions covering the whole module. Pass mark {Math.round(PASS_MARK * 100)}%. {p.best !== null && <>Best so far: <b>{Math.round(p.best * 100)}%</b> over {p.attempts} attempt{p.attempts === 1 ? "" : "s"}.</>}
          </p>
          {module.quiz.map((q, i) => (
            <div key={i} className="card quiz-wrap">
              <div className="quiz-q">
                <span className="vnum">{i + 1}</span> {inline(q.q)}
              </div>
              <QuizCard quiz={q} chosen={chosen[i] ?? null} onChoose={(c) => setChosen((prev) => prev.map((x, j) => (j === i ? c : x)))} />
            </div>
          ))}
          {allAnswered && (
            <div className={`callout ${score / module.quiz.length >= PASS_MARK ? "tip" : "warn"}`}>
              <b>
                {score}/{module.quiz.length} · {Math.round((score / module.quiz.length) * 100)}%.
              </b>{" "}
              {score / module.quiz.length >= PASS_MARK ? "Passed. The result is saved under Revision and results." : "Below the pass mark. Revisit the lessons behind the questions you missed, then retake."}
              <div style={{ marginTop: 8 }}>
                <button className="btn small" onClick={() => { setChosen(module.quiz.map(() => null)); recorded.current = false; }}>
                  Retake
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {module.exercises.length > 0 && (
        <>
          <h2 id="exercises">Exercises</h2>
          <p className="small muted">Do them on paper or in a file first; then tap to compare with a solution and tick it off.</p>
          {module.exercises.map((ex, i) => {
            const done = t.exerciseDone(id, i);
            return (
              <div key={i} className={`card exercise ${done ? "done" : ""}`}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>
                    <span className="pill muted">{ex.kind}</span> {ex.title}
                  </b>
                  <label className="small">
                    <input type="checkbox" checked={done} onChange={(e) => t.setExerciseDone(id, i, e.target.checked)} /> done
                  </label>
                </div>
                <Prose text={ex.task} />
                {ex.hints?.length ? <TapCards items={[{ q: "Hints", a: ex.hints.map((h) => "- " + h).join("\n") }]} /> : null}
                <TapCards items={[{ q: "Compare with a solution", a: ex.solution }]} />
              </div>
            );
          })}
        </>
      )}

      {module.lessons.every((l) => !l.body) && <p className="muted">This module's lessons are on the map and will be written in order.</p>}

      <div className="step-nav">
        {prevM ? <a className="btn" href={href.module(prevM.id)}>← Module {prevM.num}</a> : <a className="btn" href={href.home()}>← The path</a>}
        {nextM ? <a className="btn primary" href={href.module(nextM.id)}>Module {nextM.num}: {nextM.title} →</a> : <a className="btn primary" href={href.project(stage.id)}>Stage project →</a>}
      </div>
      {module.num === stage.modules[stage.modules.length - 1].num && (
        <p className="small">
          Last module of the stage. Next: <a href={href.project(stage.id)}>the Stage {stage.num} project</a>.
        </p>
      )}
    </div>
  );
}
