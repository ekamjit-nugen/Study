import { CHAPTERS } from "../courses/db/chapters";
import type { Course } from "../courses/types";
import { inline } from "../lib/md";
import { NoteCtx, useRegisterNoteContext, type NoteContext } from "../lib/notes";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { Callout, TapCards } from "./Bits";
import { Notable } from "./Notable";
import SqlRunner from "./SqlRunner";
import TermHelp from "./TermHelp";

export function chapterHref(courseId: string, moduleId: string) {
  return `#/${courseId}/chapter/${moduleId}`;
}

export default function ChapterSummary({ course, moduleId }: { course: Course; moduleId: string }) {
  const mi = course.modules.findIndex((m) => m.id === moduleId);
  const module = course.modules[mi];
  const chapter = CHAPTERS.find((c) => c.moduleId === moduleId);
  const lastSlug = course.modules[mi]?.topics[course.modules[mi].topics.length - 1]?.slug ?? "";
  const { isDone } = useProgress();
  const ctxForHover: NoteContext | null = module ? { courseId: course.id, courseTitle: course.title, moduleId: module.id, moduleTitle: `${mi + 1}. ${module.title}`, href: chapterHref(course.id, module.id) } : null;
  useRegisterNoteContext(ctxForHover);
  if (!module || !chapter)
    return (
      <div className="content">
        <h1>Chapter not found</h1>
        <a href={href.course(course.id)}>Back to {course.title}</a>
      </div>
    );
  const ctx: NoteContext = { courseId: course.id, courseTitle: course.title, moduleId: module.id, moduleTitle: `${mi + 1}. ${module.title}`, href: chapterHref(course.id, module.id) };
  const topicCtx = (slug: string): NoteContext => {
    const t = module.topics.find((x) => x.slug === slug);
    return { ...ctx, topicSlug: slug, topicTitle: t?.title, href: href.topic(course.id, slug) };
  };
  const doneCount = module.topics.filter((t) => isDone(`${course.id}/${t.slug}`)).length;
  const nextModule = course.modules[mi + 1];
  const prevTopic = module.topics[module.topics.length - 1];
  return (
    <NoteCtx.Provider value={ctx}>
      <div className="content player">
        <div className="small muted">
          <a href={href.course(course.id)}>{course.title}</a> · chapter {mi + 1} of {course.modules.length} · {doneCount}/{module.topics.length} topics done
        </div>
        <div className="card step">
          <div className="step-kind">Chapter {mi + 1} summary</div>
          <h2 className="step-title">{module.title}</h2>
          <p className="step-lead">{inline(module.simple)}</p>
          <p className="small muted">Press and hold any line (or select words) to save it as a note. Each note links back here or to its topic.</p>

          <h3>What you can now do</h3>
          <ol className="overview">
            {chapter.overview.map((o, i) => {
              const t = module.topics.find((x) => x.slug === o.slug);
              return (
                <li key={i}>
                  <NoteCtx.Provider value={topicCtx(o.slug)}>
                    <Notable text={o.line} where="Chapter overview" block>
                      <a href={href.topic(course.id, o.slug)} className="overview-title">
                        {mi + 1}.{i + 1} {t?.title ?? o.slug}
                        {isDone(`${course.id}/${o.slug}`) && <span className="pill ok" style={{ marginLeft: 6 }}>done</span>}
                      </a>
                      <div>{inline(o.line)}</div>
                    </Notable>
                  </NoteCtx.Provider>
                </li>
              );
            })}
          </ol>

          <h3>Rules to keep</h3>
          <div className="tldr-cards">
            {chapter.rules.map((r, i) => (
              <Notable key={i} text={r} where="Chapter rules" block>
                <div className="vbox tone-ok">{inline(r)}</div>
              </Notable>
            ))}
          </div>

          <h3>Practical questions</h3>
          <p className="small muted">Real situations. Think first, then tap to compare with the answer. Run the SQL where there is one.</p>
          {chapter.practical.map((p, i) => (
            <div key={i} className="card soft practical">
              <TermHelp slug={lastSlug} texts={[p.q, p.a, p.sql]} compact />
              <Notable text={p.q} where="Practical question" block>
                <div className="practical-q">
                  <span className="vnum" style={{ display: "inline-flex", marginRight: 8 }}>{i + 1}</span>
                  {inline(p.q)}
                </div>
              </Notable>
              <TapCards items={[{ q: "Show the answer", a: p.a }]} />
              <Notable text={p.a} where="Practical answer" block>
                <span className="small muted">save the answer as a note</span>
              </Notable>
              {p.sql && <SqlRunner sql={p.sql} title={p.fails ? "Run it: the database should refuse this" : "Try it on the lesson data"} explain />}
            </div>
          ))}

          <Callout kind="tip" label="Next:" text={nextModule ? `Chapter ${mi + 2}: ${nextModule.title}.` : "That was the last chapter. Try the Build the shop project and the interview bank."} />
        </div>
        <div className="step-nav">
          <a className="btn" href={href.topic(course.id, prevTopic.slug)}>
            ← {prevTopic.title}
          </a>
          {nextModule ? (
            <a className="btn primary" href={href.topic(course.id, nextModule.topics[0].slug)}>
              Start chapter {mi + 2} →
            </a>
          ) : (
            <a className="btn primary" href="#/project">
              Build the shop →
            </a>
          )}
        </div>
      </div>
    </NoteCtx.Provider>
  );
}
