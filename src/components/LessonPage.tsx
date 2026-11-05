import { useEffect } from "react";
import { findLesson, lessonLabel, moduleOf, nextLesson, prevLesson, stageOf } from "../path";
import { href } from "../lib/route";
import { useTrack } from "../lib/track";
import { NoteCtx, useRegisterNoteContext, type NoteContext } from "../lib/notes";
import { inline } from "../lib/md";
import { Notable } from "./Notable";
import { TapCards } from "./Bits";
import { CodeView, ExampleView, FigureView, MathsView, ProseT, TermDefs, termsIn } from "./LessonParts";

const PARTS: { id: string; label: string }[] = [
  { id: "concept", label: "Concept" },
  { id: "why", label: "Why it exists" },
  { id: "how", label: "How it works" },
  { id: "visual", label: "Visual" },
  { id: "everyday", label: "Everyday example" },
  { id: "engineering", label: "Engineering example" },
  { id: "creative", label: "Creative example" },
  { id: "maths", label: "The maths" },
  { id: "code", label: "Code" },
  { id: "use", label: "Where it is used" },
  { id: "takeaways", label: "Key takeaways" },
];

function Part({ id, n, label, children }: { id: string; n: number; label: string; children: React.ReactNode }) {
  return (
    <section className="part" id={id}>
      <h2>
        <span className="n">{n}</span> {label}
      </h2>
      {children}
    </section>
  );
}

export default function LessonPage({ slug }: { slug: string }) {
  const lesson = findLesson(slug);
  const t = useTrack();
  useEffect(() => {
    if (lesson?.body) t.setLastLesson(slug);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const module = lesson ? moduleOf(lesson) : undefined;
  const stage = module ? stageOf(module) : undefined;
  const ctx: NoteContext | null = lesson && module && stage ? { courseId: "ai", courseTitle: `Stage ${stage.num}`, moduleId: module.id, moduleTitle: `${module.num}. ${module.title}`, topicSlug: lesson.slug, topicTitle: lesson.title, href: href.lesson(lesson.slug) } : null;
  useRegisterNoteContext(ctx);
  if (!lesson || !module || !stage)
    return (
      <div className="content">
        <h1>Lesson not found</h1>
        <a href={href.home()}>Back to the path</a>
      </div>
    );

  const prev = prevLesson(slug);
  const next = nextLesson(slug);
  const crumbs = (
    <div className="small muted crumbs">
      <a href={href.stage(stage.id)}>Stage {stage.num}: {stage.title}</a> · <a href={href.module(module.id)}>Module {module.num}: {module.title}</a> · lesson {lessonLabel(lesson)} of {module.lessons.length}
    </div>
  );
  const nav = (
    <div className="step-nav">
      {prev ? <a className="btn" href={href.lesson(prev.slug)}>← {lessonLabel(prev)} {prev.title}</a> : <a className="btn" href={href.module(module.id)}>← Module {module.num}</a>}
      {next ? (
        <a className={`btn ${next.body ? "primary" : ""}`} href={href.lesson(next.slug)}>
          {lessonLabel(next)} {next.title} {next.body ? "→" : "(coming)"}
        </a>
      ) : (
        <a className="btn primary" href={href.module(module.id)}>Module {module.num} quiz →</a>
      )}
    </div>
  );

  if (!lesson.body)
    return (
      <div className="content player">
        {crumbs}
        <div className="card step">
          <div className="step-kind">Lesson {lessonLabel(lesson)} · coming</div>
          <h1 className="step-title">{lesson.title}</h1>
          <p className="muted">This lesson is on the map but not written yet. It will follow the same shape as the others: concept, why it exists, how it works, examples, maths and code where they help, and key takeaways.</p>
        </div>
        {nav}
      </div>
    );

  const b = lesson.body;
  const seen = new Set<string>();
  const done = t.lessonDone(slug);
  const flagged = t.flagged(slug);
  const present = new Set<string>(["concept", "why", "how", "use", "takeaways"]);
  if (b.visual) present.add("visual");
  if (b.everyday) present.add("everyday");
  if (b.engineering) present.add("engineering");
  if (b.creative) present.add("creative");
  if (b.maths) present.add("maths");
  if (b.code) present.add("code");
  let n = 0;
  const num = () => ++n;

  return (
    <NoteCtx.Provider value={ctx}>
      <div className="content player lesson">
        {crumbs}
        <div className="lesson-head">
          <div className="step-kind">
            Lesson {lessonLabel(lesson)} · {lesson.minutes} min {done && <span className="pill ok">completed</span>} {flagged && <span className="pill warn">marked for revision</span>}
          </div>
          <h1 className="step-title">{lesson.title}</h1>
          <Notable text={b.simple} where="In one line" block>
            <p className="step-lead">{inline(b.simple)}</p>
          </Notable>
          <TermDefs terms={termsIn(b.simple, lesson, seen)} />
          <nav className="part-nav" aria-label="Parts of this lesson">
            {PARTS.filter((p) => present.has(p.id)).map((p) => (
              <a key={p.id} href={`#/lesson/${slug}`} onClick={(e) => { e.preventDefault(); document.getElementById(p.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                {p.label}
              </a>
            ))}
          </nav>
        </div>

        <Part id="concept" n={num()} label="Concept">
          <ProseT text={b.concept} lesson={lesson} seen={seen} />
          {b.terms?.length ? (
            <div className="card soft new-words">
              <div className="small muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>New words in this lesson</div>
              {b.terms.map(([w, d]) => (
                <div className="word" key={w}>
                  <b>{w}</b> <span className="muted">—</span> {inline(d)}
                </div>
              ))}
            </div>
          ) : null}
        </Part>
        <Part id="why" n={num()} label="Why it exists">
          <ProseT text={b.why} lesson={lesson} seen={seen} />
        </Part>
        <Part id="how" n={num()} label="How it works">
          <ol className="how">
            {b.how.map((s, i) => (
              <li key={i}>
                <Notable text={s} where="How it works" block>
                  {inline(s)}
                </Notable>
                <TermDefs terms={termsIn(s, lesson, seen)} />
              </li>
            ))}
          </ol>
        </Part>
        {b.visual && (
          <Part id="visual" n={num()} label="Visual">
            <FigureView fig={b.visual} />
          </Part>
        )}
        {b.everyday && (
          <Part id="everyday" n={num()} label="Everyday example">
            <ExampleView ex={b.everyday} tone="everyday" lesson={lesson} seen={seen} />
          </Part>
        )}
        {b.engineering && (
          <Part id="engineering" n={num()} label="Real-world engineering example">
            <ExampleView ex={b.engineering} tone="engineering" lesson={lesson} seen={seen} />
          </Part>
        )}
        {b.creative && (
          <Part id="creative" n={num()} label="Creative example">
            <ExampleView ex={b.creative} tone="creative" lesson={lesson} seen={seen} />
          </Part>
        )}
        {b.maths && (
          <Part id="maths" n={num()} label="The maths, with numbers">
            <MathsView m={b.maths} />
          </Part>
        )}
        {b.code && (
          <Part id="code" n={num()} label="Code">
            <CodeView demo={b.code} />
          </Part>
        )}
        <Part id="use" n={num()} label="Where it is used">
          <ProseT text={b.useIt} lesson={lesson} seen={seen} />
        </Part>
        <Part id="takeaways" n={num()} label="Key takeaways">
          <ul className="remember">
            {b.takeaways.map((x, i) => (
              <li key={i}>
                <Notable text={x} where="Key takeaway" block>
                  {inline(x)}
                </Notable>
              </li>
            ))}
          </ul>
          {b.reflect && (
            <div style={{ marginTop: 12 }}>
              <div className="small muted">Think about it, then tap to compare:</div>
              <TapCards items={[{ q: b.reflect.q, a: b.reflect.a }]} />
            </div>
          )}
        </Part>

        <div className="card mark-row">
          <div>
            <b>Finished?</b> <span className="muted">Reading a lesson never marks it complete. Mark it only when you could explain it to someone else.</span>
          </div>
          <div className="row">
            <button className={`btn ${done ? "ok" : "primary"}`} onClick={() => t.setLessonDone(slug, !done)}>
              {done ? "✓ Completed · tap to undo" : "Mark complete"}
            </button>
            <button className={`btn ${flagged ? "warn" : ""}`} onClick={() => t.setFlagged(slug, !flagged)}>
              {flagged ? "🔁 Marked for revision · clear" : "🔁 Revisit later"}
            </button>
          </div>
        </div>
        {nav}
        <p className="small muted">Press and hold any line to save it as a note.</p>
      </div>
    </NoteCtx.Provider>
  );
}
