import { MODULES, findLesson, lessonLabel, moduleOf } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { PASS_MARK } from "../lib/progressCalc";

export default function RevisionPage() {
  const t = useTrack();
  const flagged = Object.entries(t.track.revision)
    .map(([slug, at]) => ({ lesson: findLesson(slug), at }))
    .filter((x) => x.lesson)
    .sort((a, b) => a.at.localeCompare(b.at));
  const results = MODULES.map((m) => ({ m, attempts: t.track.assessments[m.id] ?? [] })).filter((x) => x.attempts.length > 0);
  return (
    <div className="content">
      <h1>Revision and results</h1>
      <h2>Marked for revision</h2>
      {flagged.length === 0 ? (
        <p className="muted">Nothing yet. On any lesson, tap <b>Revisit later</b> and it appears here until you clear it.</p>
      ) : (
        <ol className="lesson-list">
          {flagged.map(({ lesson, at }) => (
            <li key={lesson!.slug}>
              <a href={href.lesson(lesson!.slug)}>
                <span className="num">{lessonLabel(lesson!)}</span>
                <span className="ttl">{lesson!.title}</span>
                <span className="small muted">
                  Module {moduleOf(lesson!).num} · flagged {at.slice(0, 10)}
                </span>
              </a>
              <button className="btn small" onClick={() => t.setFlagged(lesson!.slug, false)}>
                clear
              </button>
            </li>
          ))}
        </ol>
      )}
      <h2>Quiz results</h2>
      {results.length === 0 ? (
        <p className="muted">No quizzes taken yet. Each module ends with one; results are kept here, best and every attempt.</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Module</th>
              <th>Best</th>
              <th>Attempts</th>
              <th>Last</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ m, attempts }) => {
              const best = attempts.reduce((b, a) => (a.score / a.total > b.score / b.total ? a : b));
              const last = attempts[attempts.length - 1];
              const pct = Math.round((best.score / best.total) * 100);
              return (
                <tr key={m.id}>
                  <td>
                    <a href={href.module(m.id)}>
                      {m.num}. {m.title}
                    </a>
                  </td>
                  <td>
                    <span className={`pill ${pct >= PASS_MARK * 100 ? "ok" : "warn"}`}>
                      {best.score}/{best.total} · {pct}%
                    </span>
                  </td>
                  <td>{attempts.length}</td>
                  <td className="small muted">{last.at.slice(0, 10)}</td>
                  <td>
                    <a className="btn small" href={href.module(m.id) + "#quiz"}>
                      retake
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <h2>Reset</h2>
      <p className="small muted">Clears every mark, flag and result on this device. There is no undo.</p>
      <button
        className="btn small"
        onClick={() => {
          if (confirm("Clear all progress on this device?")) t.reset();
        }}
      >
        Reset all progress
      </button>
    </div>
  );
}
