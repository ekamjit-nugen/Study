import { COURSES } from "../courses/registry";
import { useProgress } from "../lib/progress";
import { href, type Route } from "../lib/route";
import { useStreak, useTextSize } from "../lib/learner";

export default function Sidebar({ route, open, onClose, theme, setTheme }: { route: Route; open: boolean; onClose: () => void; theme: string; setTheme: (t: string) => void }) {
  const { isDone } = useProgress();
  const streak = useStreak();
  const [size, setSize] = useTextSize();
  const activeCourse = route.page === "course" || route.page === "topic" ? route.course : "db";
  const course = COURSES.find((c) => c.id === activeCourse);
  const total = course ? course.modules.reduce((n, m) => n + m.topics.length, 0) : 0;
  const doneCount = course ? course.modules.reduce((n, m) => n + m.topics.filter((t) => isDone(`${course.id}/${t.slug}`)).length, 0) : 0;
  const tools: { label: string; h: string; page: Route["page"] }[] = [
    { label: "🏗️ Build the shop (project)", h: "#/project", page: "project" },
    { label: "🧩 Hard problems, made easy", h: "#/hard", page: "hard" },
    { label: "🎤 Interview bank", h: "#/interview", page: "interview" },
    { label: "🧪 SQL playground", h: "#/playground", page: "playground" },
    { label: "📋 SQL cheat sheet", h: "#/cheatsheet", page: "cheatsheet" },
  ];
  return (
    <>
      {open && <div className="backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a href={href.home()} className="brand" onClick={onClose} style={{ color: "inherit" }}>
          <span>🚀</span>
          <span>
            Full-Stack Mastery
            <small>hard questions, made easy</small>
          </span>
        </a>
        <div className="row" style={{ padding: "0 0.5rem 0.4rem" }}>
          <button className="btn small" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="btn small" onClick={() => setSize(size - 1)} title="Smaller text">A−</button>
          <button className="btn small" onClick={() => setSize(size + 1)} title="Bigger text">A+</button>
          <span className="pill warn" title="Days in a row you studied">🔥 {streak}-day streak</span>
          <span className="pill ok" title="Installed as an app, everything including the SQL engine is cached on your device">📱 works offline</span>
        </div>
        <div className="side-section">
          <div className="side-title">Courses</div>
          {COURSES.map((c) => (
            <a key={c.id} href={href.course(c.id)} className={`side-link ${c.status === "coming" ? "soon" : ""} ${activeCourse === c.id && route.page !== "home" ? "active" : ""}`} onClick={onClose}>
              <span>{c.emoji}</span> {c.title}
              {c.status === "coming" ? <span className="tag">next</span> : <span className="tag">ready</span>}
            </a>
          ))}
        </div>
        <div className="side-section">
          <div className="side-title">Tools</div>
          {tools.map((t) => (
            <a key={t.h} href={t.h} className={`side-link ${route.page === t.page || (t.page === "project" && route.page === "mission") ? "active" : ""}`} onClick={onClose}>
              {t.label}
            </a>
          ))}
        </div>
        {course && course.status === "ready" && (
          <div className="side-section">
            <div className="side-title">
              {course.title} · {doneCount}/{total} done
            </div>
            <div className="progressbar">
              <div style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
            </div>
            {course.modules.map((m, mi) => (
              <div key={m.id}>
                <div className="side-module">
                  {mi + 1}. {m.title}
                </div>
                {m.topics.map((t, ti) => {
                  const active = route.page === "topic" && route.course === course.id && route.slug === t.slug;
                  return (
                    <a key={t.slug} href={href.topic(course.id, t.slug)} className={`side-topic ${active ? "active" : ""}`} onClick={onClose}>
                      <span className="num">
                        {mi + 1}.{ti + 1}
                      </span>
                      <span>{t.title}</span>
                      {isDone(`${course.id}/${t.slug}`) && <span className="done">✓</span>}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
