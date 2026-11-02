import type { Course } from "../courses/types";
import { inline } from "../lib/md";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { stepOutline } from "./LessonPlayer";
import { chapterHref } from "./ChapterSummary";

/**
 * Quick learn: every topic in short form. The story, the 30-second points, and a chip per idea
 * that opens that exact page of the full lesson for anyone who wants depth.
 */
export default function QuickLearn({ course }: { course: Course }) {
  const { isDone } = useProgress();
  return (
    <div className="content">
      <h1>⚡ Quick learn: {course.title}</h1>
      <p className="muted">All {course.modules.reduce((n, m) => n + m.topics.length, 0)} topics, the short way: the story and the four points to know. Tap an idea to open that exact page of the full lesson.</p>
      {course.modules.map((m, mi) => (
        <section key={m.id} className="quick-chapter">
          <h2>
            {mi + 1}. {m.title} <a className="small" href={chapterHref(course.id, m.id)} style={{ fontWeight: 500 }}>summary & practice →</a>
          </h2>
          {m.topics.map((t, ti) => {
            const outline = stepOutline(t, course.id);
            const ideas = outline.filter((s) => s.kind === "idea");
            const extras = [
              { label: "quick check", s: outline.find((s) => s.kind === "quiz") },
              { label: "real problem", s: outline.find((s) => s.kind === "problem") },
              { label: "practice", s: outline.find((s) => s.kind === "practice") },
              { label: "interview", s: outline.find((s) => s.kind === "interview") },
            ].filter((x) => x.s);
            return (
              <div key={t.slug} className="card quick-topic">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0 }}>
                    {mi + 1}.{ti + 1} {t.title} {isDone(`${course.id}/${t.slug}`) && <span className="pill ok">done</span>}
                  </h3>
                  <a className="btn small primary" href={href.topic(course.id, t.slug)}>
                    Learn in depth →
                  </a>
                </div>
                <p className="quick-story">{inline(t.story)}</p>
                <ul className="quick-points">
                  {t.tldr.map((p, i) => (
                    <li key={i}>{inline(p)}</li>
                  ))}
                </ul>
                <div className="chips">
                  {ideas.map((s) => (
                    <a key={s.index} className="chip" href={href.step(course.id, t.slug, s.index)} title={`Open "${s.title}" in the full lesson`}>
                      {s.title}
                    </a>
                  ))}
                  {extras.map((x) => (
                    <a key={x.label} className="chip muted" href={href.step(course.id, t.slug, x.s!.index)}>
                      {x.label}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
