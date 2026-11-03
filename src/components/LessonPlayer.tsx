import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Course, Module, Topic, Section, RealWorld, Practice, Interview, Quiz } from "../courses/types";
import { inline, Prose } from "../lib/md";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { useLocal } from "../lib/useLocal";
import { Callout, Code, DataTable, More, TapCards } from "./Bits";
import { Diagram } from "./Diagrams";
import SqlRunner from "./SqlRunner";
import { interviewAnswer, interviewQuestion, interviewTag } from "./InterviewCard";
import TermHelp from "./TermHelp";
import { PracticeAnswer, StoryPageView } from "./Story";
import { Ladder, Visual, splitBullet } from "./Visuals";
import { QuizCard } from "./QuizCard";
import { useLastTopic } from "../lib/learner";
import { NoteCtx, useRegisterNoteContext, type NoteContext } from "../lib/notes";
import { Notable } from "./Notable";
import { chapterHref } from "./ChapterSummary";

type Kind = "start" | "idea" | "try" | "quiz" | "problem" | "practice" | "interview" | "finish";
type Step = { kind: Kind; label: string; title: string; lead?: string; body: ReactNode; /** stable anchor, e.g. "section-2", "quiz-1", "problem-1", "practice-1", "interview-1", "start", "finish" */ ref: string };

const KIND_LABEL: Record<Kind, string> = {
  start: "Start",
  idea: "Idea",
  try: "Try it",
  quiz: "Quick check",
  problem: "Real problem",
  practice: "Practice",
  interview: "Interview",
  finish: "Done",
};

function firstSentence(text: string): { lead: string; rest: string } {
  const t = text.trim();
  const m = /^(.{20,200}?[.!?])(\s|$)/s.exec(t);
  if (!m) return { lead: t.length <= 200 ? t : t.slice(0, 197) + "…", rest: t.length <= 200 ? "" : t };
  return { lead: m[1], rest: t.slice(m[0].length).trim() };
}

function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div>
      <button className="readmore" onClick={() => setOpen((o) => !o)}>
        {open ? "▾ fewer words" : "▸ more words"}
      </button>
      {open && (
        <div className="sect-words">
          <Prose text={text} />
        </div>
      )}
    </div>
  );
}

function AnalogyBox({ s }: { s: Section }) {
  if (!s.analogy && !s.why) return null;
  return (
    <div className="analogy">
      {s.analogy && (
        <Notable text={s.analogy} where={"Think of it like · " + s.title} block>
          <div className="analogy-line">
            <span className="analogy-tag">Think of it like</span> {inline(s.analogy)}
          </div>
        </Notable>
      )}
      {s.why && (
        <Notable text={s.why} where={"Why you care · " + s.title} block>
          <div className="analogy-line why">
            <span className="analogy-tag">Why you care</span> {inline(s.why)}
          </div>
        </Notable>
      )}
    </div>
  );
}

/** "Think first": the question is shown; the explanation opens on demand. */
function ThinkFirst({ ask, children }: { ask: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="think">
        <div className="think-tag">🤔 Think first</div>
        <div className="think-q">{inline(ask)}</div>
        {!open && (
          <button className="btn primary" onClick={() => setOpen(true)}>
            I have an answer · show me
          </button>
        )}
      </div>
      {open && <div className="think-body">{children}</div>}
    </div>
  );
}

function sectionSteps(s: Section, n: number, slug: string): Step[] {
  const out: Step[] = [];
  const help = <TermHelp slug={slug} texts={[s.title, s.ask, s.analogy, s.why, s.body, s.tip, s.warn, s.more, ...(s.bullets ?? []), ...(s.sql ?? []).map((q) => q.sql + "\n" + (q.note ?? "")), ...(s.code ?? []).map((c) => c.src)]} />;
  let helpShown = false;
  const helpOnce = () => { if (helpShown) return null; helpShown = true; return help; };
  const { lead, rest } = s.body ? firstSentence(s.body) : { lead: "", rest: "" };
  const hasIdea = !!(s.diagram || s.visual || s.bullets || s.table || s.ask || (s.body && s.body.length > 160));
  const hasSql = (s.sql?.length ?? 0) > 0;
  const hasCode = (s.code?.length ?? 0) > 0;
  const tipWarn = (
    <>
      {s.tip && <Callout kind="tip" label="Tip:" text={s.tip} />}
      {s.warn && <Callout kind="warn" label="Watch out:" text={s.warn} />}
    </>
  );
  if (hasIdea) {
    out.push({
      ref: `section-${n}`,
      kind: "idea",
      label: `Idea ${n}`,
      title: s.title,
      lead: s.ask ? undefined : lead || undefined,
      body: (() => {
        const inner = (
          <>
            <AnalogyBox s={s} />
            {s.ask && s.body && <Prose text={s.body} />}
            {s.diagram && <Diagram id={s.diagram} />}
            {s.visual && <Visual spec={s.visual} />}
            {s.bullets && <TapCards items={s.bullets.map((b) => { const { title, detail } = splitBullet(b); return { q: title, a: detail }; })} />}
            {s.table && <DataTable table={s.table} />}
            {!s.ask && <ReadMore text={rest} />}
            {s.more && (
              <More>
                <Prose text={s.more} />
              </More>
            )}
            {!hasSql && !hasCode && tipWarn}
          </>
        );
        const first = helpOnce();
        return (
          <>
            {first}
            {s.ask ? <ThinkFirst ask={s.ask}>{inner}</ThinkFirst> : inner}
          </>
        );
      })(),
    });
  }
  s.code?.forEach((c, i) => {
    const last = i === (s.code?.length ?? 0) - 1 && !hasSql;
    out.push({
      ref: hasIdea || i > 0 ? `section-${n}-code-${i + 1}` : `section-${n}`,
      kind: "try",
      label: `Idea ${n} · code`,
      title: c.title ?? s.title,
      lead: !hasIdea && i === 0 ? lead || undefined : undefined,
      body: (
        <>
          {helpOnce()}
          {!hasIdea && i === 0 && <AnalogyBox s={s} />}
          <Code ex={{ ...c, title: undefined }} />
          {!hasIdea && i === 0 && <ReadMore text={rest} />}
          {last && tipWarn}
        </>
      ),
    });
  });
  s.sql?.forEach((q, i) => {
    const last = i === (s.sql?.length ?? 0) - 1;
    out.push({
      ref: hasIdea || hasCode || i > 0 ? `section-${n}-sql-${i + 1}` : `section-${n}`,
      kind: "try",
      label: `Idea ${n} · run it`,
      title: q.title ?? s.title,
      lead: !hasIdea && !hasCode && i === 0 ? lead || undefined : undefined,
      body: (
        <>
          {helpOnce()}
          {!hasIdea && !hasCode && i === 0 && <AnalogyBox s={s} />}
          <SqlRunner sql={q.sql} note={q.note} explain={q.explain} title={q.title ? "Press Run" : undefined} />
          {!hasIdea && !hasCode && i === 0 && <ReadMore text={rest} />}
          {last && tipWarn}
        </>
      ),
    });
  });
  return out;
}

function Hidden({ label, children }: { label: string; children: ReactNode }) {
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

function realWorldSteps(rw: RealWorld, n: number, slug: string): Step[] {
  const out: Step[] = [];
  const hasSolution = !!(rw.sql || rw.code);
  out.push({
    ref: `problem-${n}`,
    kind: "problem",
    label: `Real problem ${n}`,
    title: rw.title,
    lead: rw.problem,
    body: (
      <>
        <TermHelp slug={slug} texts={[rw.title, rw.problem, rw.whyHard, ...rw.steps, rw.takeaway]} />
        <Ladder steps={rw.steps.map((st, j) => { const { title, detail } = splitBullet(st); return { label: title, sub: detail || undefined, tone: j === rw.steps.length - 1 ? "ok" : "accent" }; })} />
        <Hidden label="Why it feels hard">
          <p className="small">{inline(rw.whyHard)}</p>
        </Hidden>
        {!hasSolution && <Callout kind="tip" label="Takeaway:" text={rw.takeaway} />}
      </>
    ),
  });
  if (hasSolution)
    out.push({
      ref: `problem-${n}-solution`,
      kind: "problem",
      label: `Real problem ${n} · solution`,
      title: "Solution: " + rw.title,
      body: (
        <>
          <TermHelp slug={slug} texts={[rw.sql, rw.code?.src, rw.takeaway]} />
          {rw.sql && <SqlRunner sql={rw.sql} title="Press Run" explain />}
          {rw.code && <Code ex={rw.code} />}
          <Callout kind="tip" label="Takeaway:" text={rw.takeaway} />
        </>
      ),
    });
  return out;
}

function practiceStep(p: Practice, i: number, id: string, slug: string): Step {
  return {
    ref: `practice-${i + 1}`,
    kind: "practice",
    label: `Practice ${i + 1}`,
    title: p.q,
    body: (
      <>
        <TermHelp slug={slug} texts={[p.q, p.hint, p.explain, p.sql, p.starter]} compact />
        {p.sql && <SqlRunner sql={p.starter ?? "-- write your query here\n"} solution={p.sql} draftKey={`fsm-draft-${id}-${i}`} />}
        <TapCards
          items={[
            { q: "💡 Give me a hint", a: p.hint ?? firstSentence(p.explain).lead },
            { q: "Show the answer", a: <PracticeAnswer p={p} /> },
          ]}
        />
        {p.sql && (
          <More title="Show the solution query">
            <Code ex={{ lang: "sql", src: p.sql }} />
          </More>
        )}
      </>
    ),
  };
}

function interviewSteps(items: Interview[], slug: string): Step[] {
  const out: Step[] = [];
  for (let i = 0; i < items.length; i += 3) {
    const chunk = items.slice(i, i + 3);
    out.push({
      ref: `interview-${Math.floor(i / 3) + 1}`,
      kind: "interview",
      label: `Interview ${Math.floor(i / 3) + 1}`,
      title: chunk.length === 1 ? "One interview question" : `${chunk.length} interview questions`,
      lead: "Tap each one, say your answer out loud, then compare.",
      body: (
        <>
          <TermHelp slug={slug} texts={chunk.flatMap((q) => [q.q, q.a, q.sql])} compact />
          <TapCards
            items={chunk.map((q) => ({ q: interviewQuestion(q), a: interviewAnswer(q), tag: interviewTag(q) }))}
          />
        </>
      ),
    });
  }
  return out;
}

function quizStep(q: Quiz, i: number, total: number, chosen: number | null, onChoose: (c: number) => void): Step {
  return {
    ref: `quiz-${i + 1}`,
    kind: "quiz",
    label: `Quick check ${i + 1} of ${total}`,
    title: q.q,
    lead: "One tap. You get the answer and the reason straight away.",
    body: <QuizCard quiz={q} chosen={chosen} onChoose={onChoose} />,
  };
}

type QuizState = Record<number, number>;

export function buildSteps(topic: Topic, courseId: string, next: Topic | undefined, onDone: (() => void) | undefined, done: boolean | undefined, quizState: QuizState, setQuiz: (i: number, c: number) => void, chapterLink?: { href: string; title: string }): Step[] {
  const id = `${courseId}/${topic.slug}`;
  const steps: Step[] = [];
  steps.push({
    ref: "start",
    kind: "start",
    label: "Start",
    title: topic.title,
    lead: topic.story,
    body: (
      <>
        <div className="tldr-cards">
          {topic.tldr.map((t, i) => (
            <Notable key={i} text={t} where="In 30 seconds" block>
              <div className="vbox tone-accent">
                <div className="vsub" style={{ marginBottom: 2 }}>
                  in 30 seconds · {i + 1}
                </div>
                {inline(t)}
              </div>
            </Notable>
          ))}
        </div>
        {topic.words && (
          <div style={{ marginTop: "0.8rem" }}>
            <div className="side-title" style={{ padding: 0 }}>
              New words
            </div>
            <TapCards items={topic.words.map(([w, m]) => ({ q: w, a: m }))} />
          </div>
        )}
      </>
    ),
  });
  if (topic.tale) {
    topic.tale.forEach((pg, i) =>
      steps.push({
        ref: `page-${i + 1}`,
        kind: "idea",
        label: `Page ${i + 1}`,
        title: pg.title,
        body: <StoryPageView page={pg} slug={topic.slug} cast={i === 0 ? topic.cast : undefined} />,
      }),
    );
  } else topic.sections.forEach((s, i) => steps.push(...sectionSteps(s, i + 1, topic.slug)));
  const quiz = topic.quiz ?? [];
  quiz.forEach((q, i) => steps.push(quizStep(q, i, quiz.length, quizState[i] ?? null, (c) => setQuiz(i, c))));
  topic.realWorld?.forEach((rw, i) => steps.push(...realWorldSteps(rw, i + 1, topic.slug)));
  topic.practice.forEach((p, i) => steps.push(practiceStep(p, i, id, topic.slug)));
  steps.push(...interviewSteps(topic.interview, topic.slug));
  const answered = quiz.filter((_, i) => quizState[i] !== undefined).length;
  const correct = quiz.filter((q, i) => quizState[i] === q.answer).length;
  steps.push({
    ref: "finish",
    kind: "finish",
    label: "Done",
    title: done ? "🎉 Topic complete" : "You made it to the end",
    lead: quiz.length ? `Quick checks: ${correct} of ${quiz.length} correct${answered < quiz.length ? ` (${quiz.length - answered} not answered yet)` : ""}. Here are the four lines to keep.` : "Four lines to keep. Say them once, then mark the topic done.",
    body: (
      <>
        <div className="tldr-cards">
          {topic.remember.map((r, i) => (
            <Notable key={i} text={r} where="Remember" block>
              <div className="vbox tone-ok">{inline(r)}</div>
            </Notable>
          ))}
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          <button className={`btn ${done ? "ok" : "primary"}`} onClick={onDone}>
            {done ? "✓ Done — click to undo" : "Mark as done"}
          </button>
          {chapterLink ? (
            <a className="btn" href={chapterLink.href}>
              📋 Chapter summary: {chapterLink.title} →
            </a>
          ) : (
            next && (
              <a className="btn" href={href.topic(courseId, next.slug)}>
                Next topic: {next.title} →
              </a>
            )
          )}
        </div>
      </>
    ),
  });
  return steps;
}

export type StepOutline = { index: number; ref: string; kind: Kind; title: string; label: string };
/** The list of pages a topic has, with their index and anchor, for deep links and jump menus. */
export function stepOutline(topic: Topic, courseId: string): StepOutline[] {
  return buildSteps(topic, courseId, undefined, undefined, false, {}, () => {}).map((s, index) => ({ index, ref: s.ref, kind: s.kind, title: s.title, label: s.label }));
}
export function stepIndexForRef(topic: Topic, courseId: string, ref: string): number {
  const i = stepOutline(topic, courseId).findIndex((s) => s.ref === ref);
  return i < 0 ? 0 : i;
}

export default function LessonPlayer({ course, module, topic, prev, next, onPageView, initialStep }: { course: Course; module: Module; topic: Topic; prev?: Topic; next?: Topic; onPageView: () => void; initialStep?: number }) {
  const { isDone, toggle } = useProgress();
  const id = `${course.id}/${topic.slug}`;
  const done = isDone(id);
  const [quizState, setQuizState] = useLocal<QuizState>(`fsm-quiz-${id}`, {});
  const [, setLast] = useLastTopic();
  useEffect(() => setLast({ course: course.id, slug: topic.slug, title: topic.title }), [course.id, topic.slug, topic.title]); // eslint-disable-line react-hooks/exhaustive-deps
  const isLastInModule = module.topics[module.topics.length - 1]?.slug === topic.slug;
  const chapterLink = isLastInModule ? { href: chapterHref(course.id, module.id), title: module.title } : undefined;
  const steps = useMemo(
    () => buildSteps(topic, course.id, next, () => toggle(id), done, quizState, (i, c) => setQuizState({ ...quizState, [i]: c }), chapterLink),
    [topic, course.id, next, done, quizState, isLastInModule], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const mi = course.modules.findIndex((m) => m.id === module.id);
  const noteCtx: NoteContext = { courseId: course.id, courseTitle: course.title, moduleId: module.id, moduleTitle: `${mi + 1}. ${module.title}`, topicSlug: topic.slug, topicTitle: topic.title, href: href.topic(course.id, topic.slug) };
  useRegisterNoteContext(noteCtx);
  const [saved, setSaved] = useLocal<number>(`fsm-step-${id}`, 0);
  const [i, setI] = useState(Math.min(initialStep ?? saved, steps.length - 1));
  // A deep link (#/course/topic/<n>) jumps to that page even if the topic is already open.
  useEffect(() => {
    if (initialStep !== undefined) go(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);
  const [showMap, setShowMap] = useState(false);
  const [book, setBook] = useLocal<boolean>("fsm-book-mode", true);
  const bookRef = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    const c = Math.max(0, Math.min(steps.length - 1, n));
    setI(c);
    setSaved(c);
    setShowMap(false);
    if (book && bookRef.current) bookRef.current.scrollTo({ left: c * bookRef.current.clientWidth, behavior: "smooth" });
    else window.scrollTo({ top: 0 });
  };
  // Book mode: the pages sit side by side; a horizontal swipe or trackpad scroll flips them.
  // Keep the current page in sync when the user scrolls/swipes instead of pressing Next.
  useEffect(() => {
    const el = bookRef.current;
    if (!book || !el) return;
    el.scrollTo({ left: i * el.clientWidth });
    let t = 0;
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const n = Math.round(el.scrollLeft / el.clientWidth);
        if (n !== i && n >= 0 && n < steps.length) {
          setI(n);
          setSaved(n);
        }
      }, 120);
    };
    const onResize = () => el.scrollTo({ left: i * el.clientWidth });
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, i, steps.length]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.key === "ArrowRight" && !gated) go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });
  const step = steps[i];
  const pct = Math.round(((i + 1) / steps.length) * 100);
  const quizIndex = step.kind === "quiz" ? Number(step.ref.split("-")[1]) - 1 : -1;
  const gated = quizIndex >= 0 && quizState[quizIndex] === undefined;
  return (
    <NoteCtx.Provider value={noteCtx}>
    <div className="content player">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="small muted">
          <a href={href.course(course.id)}>{course.title}</a> · {module.title}
        </div>
        <div className="row">
          <button className="btn small" onClick={() => setShowMap((m) => !m)}>
            {showMap ? "✕ close map" : "☰ lesson map"}
          </button>
          <button className={`btn small ${book ? "primary" : ""}`} onClick={() => setBook(!book)} title={book ? "Book mode: swipe or scroll sideways to turn pages" : "Switch to book mode: pages side by side"}>
            {book ? "📖 book" : "📄 single"}
          </button>
          {!topic.tale && (
            <button className="btn small" onClick={onPageView} title="Read everything on one long page">
              📜 whole page
            </button>
          )}
        </div>
      </div>
      <div className="progress-row">
        <div className="progressbar big">
          <div style={{ width: `${pct}%` }} />
        </div>
        <span className="small muted">
          {i + 1} / {steps.length}
        </span>
      </div>
      {showMap && (
        <div className="card soft stepmap">
          {steps.map((s, k) => (
            <button key={k} className={`stepmap-item ${k === i ? "on" : ""} ${k < i ? "past" : ""}`} onClick={() => go(k)}>
              <span className={`pill ${s.kind === "idea" ? "" : s.kind === "try" || s.kind === "practice" ? "ok" : s.kind === "problem" || s.kind === "quiz" ? "warn" : s.kind === "interview" ? "bad" : "muted"}`}>{KIND_LABEL[s.kind]}</span>
              <span>{inline(s.title)}</span>
            </button>
          ))}
        </div>
      )}
      {book ? (
        <div className="book" ref={bookRef}>
          {steps.map((st, k) => (
            <div className={`page ${k === i ? "current" : ""}`} key={k} aria-hidden={k !== i}>
              <div className={`card step step-${st.kind}`}>
                <div className="step-kind">
                  {st.label} <span className="muted" style={{ fontWeight: 400 }}>· page {k + 1} of {steps.length}</span>
                </div>
                <h2 className="step-title">{inline(st.title)}</h2>
                {st.lead && <p className="step-lead">{inline(st.lead)}</p>}
                {Math.abs(k - i) <= 1 ? <div className="step-body">{st.body}</div> : <div className="step-body muted small">…</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`card step step-${step.kind}`} key={i}>
          <div className="step-kind">{step.label}</div>
          <h2 className="step-title">{inline(step.title)}</h2>
          {step.lead && <p className="step-lead">{inline(step.lead)}</p>}
          <div className="step-body">{step.body}</div>
        </div>
      )}
      <div className="step-nav">
        <button className="btn" onClick={() => go(i - 1)} disabled={i === 0}>
          ← Back
        </button>
        <span className="small muted">
          {book ? "swipe or scroll sideways · " : ""}
          <span className="kbd">←</span> <span className="kbd">→</span>
        </span>
        {i < steps.length - 1 ? (
          <button className="btn primary" onClick={() => go(i + 1)} disabled={gated} title={gated ? "Answer the question first" : undefined}>
            {gated ? "Answer to continue" : "Next →"}
          </button>
        ) : chapterLink ? (
          <a className="btn primary" href={chapterLink.href}>
            Chapter summary →
          </a>
        ) : next ? (
          <a className="btn primary" href={href.topic(course.id, next.slug)}>
            Next topic →
          </a>
        ) : (
          <a className="btn primary" href={href.course(course.id)}>
            Back to course
          </a>
        )}
      </div>
      <div className="nav-foot small">
        <span>{prev && <a href={href.topic(course.id, prev.slug)}>← {prev.title}</a>}</span>
        <span>{next && <a href={href.topic(course.id, next.slug)}>{next.title} →</a>}</span>
      </div>
    </div>
    </NoteCtx.Provider>
  );
}
