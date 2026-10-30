import type { Quiz } from "../courses/types";
import { inline } from "../lib/md";

/** One tap, instant feedback. `chosen` is remembered by the parent so progress survives reloads. */
export function QuizCard({ quiz, chosen, onChoose }: { quiz: Quiz; chosen: number | null; onChoose: (i: number) => void }) {
  const answered = chosen !== null;
  return (
    <div className="quiz">
      <div className="quiz-options">
        {quiz.options.map((o, i) => {
          const cls = !answered ? "" : i === quiz.answer ? "right" : i === chosen ? "wrong" : "dim";
          return (
            <button key={i} className={`quiz-opt ${cls}`} onClick={() => !answered && onChoose(i)} disabled={answered}>
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>{inline(o)}</span>
              {answered && i === quiz.answer && <span className="quiz-mark">✓</span>}
              {answered && i === chosen && i !== quiz.answer && <span className="quiz-mark">✗</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`callout ${chosen === quiz.answer ? "tip" : "warn"}`}>
          <b>{chosen === quiz.answer ? "Correct!" : "Not quite."}</b> {inline(quiz.why)}
        </div>
      )}
    </div>
  );
}
