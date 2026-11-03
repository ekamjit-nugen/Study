import { useState } from "react";
import type { Quiz } from "../courses/types";
import { inline, Prose } from "../lib/md";

/** One tap, instant feedback. With `reason`, the learner writes why first; with `whyOptions`, the feedback matches the option they picked. */
export function QuizCard({ quiz, chosen, onChoose }: { quiz: Quiz; chosen: number | null; onChoose: (i: number) => void }) {
  const answered = chosen !== null;
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const needReason = !!quiz.reason && !answered;
  const pick = (i: number) => {
    if (answered) return;
    if (needReason) setPending(i);
    else onChoose(i);
  };
  const raw = answered ? (quiz.whyOptions?.[chosen!] ?? quiz.why) : "";
  // the card prints its own "Correct." / "Not quite." label, so drop a duplicate from the text
  const feedback = raw.replace(/^(Correct|Not quite|Right|Wrong)[.!:]\s*/i, "");
  return (
    <div className="quiz">
      {quiz.setup && (
        <div className="quiz-setup">
          <Prose text={quiz.setup} />
        </div>
      )}
      <div className="quiz-options">
        {quiz.options.map((o, i) => {
          const cls = !answered ? (pending === i ? "pending" : "") : i === quiz.answer ? "right" : i === chosen ? "wrong" : "dim";
          return (
            <button key={i} className={`quiz-opt ${cls}`} onClick={() => pick(i)} disabled={answered}>
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>{inline(o)}</span>
              {answered && i === quiz.answer && <span className="quiz-mark">✓</span>}
              {answered && i === chosen && i !== quiz.answer && <span className="quiz-mark">✗</span>}
            </button>
          );
        })}
      </div>
      {needReason && pending !== null && (
        <div className="quiz-reason">
          <label className="small" htmlFor="quiz-reason">
            You picked <b>{String.fromCharCode(65 + pending)}</b>. Explain your reasoning in one or two sentences, then lock it in:
          </label>
          <textarea id="quiz-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Because…" />
          <button className="btn primary small" onClick={() => onChoose(pending)} disabled={reason.trim().length < 8}>
            Lock in my answer
          </button>
        </div>
      )}
      {answered && (
        <div className={`callout ${chosen === quiz.answer ? "tip" : "warn"}`}>
          <b>{chosen === quiz.answer ? "Correct." : "Not quite."}</b> <Prose text={feedback} />
          {chosen !== quiz.answer && quiz.whyOptions && (
            <div className="small" style={{ marginTop: 6 }}>
              <b>The right answer is {String.fromCharCode(65 + quiz.answer)}:</b> {inline(quiz.whyOptions[quiz.answer])}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
