import { useState } from "react";
import { COUNTS, STAGES, findLesson, findModule, lessonLabel } from "../path";
import { href, type Route } from "../lib/route";
import { useStreak, useTextSize } from "../lib/learner";
import { useTrack } from "../lib/track";
import { moduleProgress, overall, stageProgress } from "../lib/progressCalc";

export default function Sidebar({ route, open, onClose, theme, setTheme }: { route: Route; open: boolean; onClose: () => void; theme: string; setTheme: (t: string) => void }) {
  const t = useTrack();
  const streak = useStreak();
  const [size, setSize] = useTextSize();
  const o = overall(t.track);
  const currentModule = route.page === "module" ? findModule(route.id) : route.page === "lesson" ? (findLesson(route.slug) ? findModule(findLesson(route.slug)!.moduleId) : undefined) : undefined;
  const currentStageNum = route.page === "stage" ? Number(route.id.slice(1)) : route.page === "project" ? Number(route.stageId.slice(1)) : currentModule?.stageNum;
  const [openStage, setOpenStage] = useState<number | null>(null);
  const expanded = openStage ?? currentStageNum ?? 1;
  const links: { label: string; h: string; page: Route["page"] }[] = [
    { label: "🏠 The path", h: href.home(), page: "home" },
    { label: "🔁 Revision and results", h: href.revision(), page: "revision" },
    { label: "📖 Glossary", h: href.glossary(), page: "glossary" },
    { label: "📝 Notes", h: href.notes(), page: "notes" },
  ];
  return (
    <>
      {open && <div className="backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a href={href.home()} className="brand" onClick={onClose} style={{ color: "inherit" }}>
          <span>🤖</span>
          <span>
            AI Engineer Path
            <small>one concept at a time</small>
          </span>
        </a>
        <div className="row" style={{ padding: "0 0.5rem 0.4rem" }}>
          <button className="btn small" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="btn small" onClick={() => setSize(size - 1)} title="Smaller text">A−</button>
          <button className="btn small" onClick={() => setSize(size + 1)} title="Bigger text">A+</button>
          <span className="pill warn" title="Days in a row you studied">🔥 {streak}</span>
          <span className="pill ok" title="Installed as an app, everything is cached on your device">📱 offline</span>
        </div>
        <div className="side-section">
          {links.map((l) => (
            <a key={l.h} href={l.h} className={`side-link ${route.page === l.page ? "active" : ""}`} onClick={onClose}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="side-section">
          <div className="side-title">
            Lessons · {o.lessonsDone}/{o.lessonsWritten} done · {COUNTS.written}/{COUNTS.lessons} written
          </div>
          <div className="progressbar">
            <div style={{ width: `${o.lessonsWritten ? (o.lessonsDone / o.lessonsWritten) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="side-section">
          <div className="side-title">Stages</div>
          {STAGES.map((s) => {
            const sp = stageProgress(s, t.track);
            const isOpen = expanded === s.num;
            return (
              <div key={s.id}>
                <button className={`side-stage ${currentStageNum === s.num ? "active" : ""}`} onClick={() => setOpenStage(isOpen ? -1 : s.num)}>
                  <span className="num">{s.num}</span>
                  <span className="ttl">{s.title}</span>
                  <span className="small muted">
                    {sp.done}/{sp.total}
                  </span>
                  <span className="chev">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen &&
                  s.modules.map((m) => {
                    const mp = moduleProgress(m, t.track);
                    const active = currentModule?.id === m.id;
                    return (
                      <div key={m.id}>
                        <a href={href.module(m.id)} className={`side-topic ${active ? "active" : ""} ${mp.written === 0 ? "planned" : ""}`} onClick={onClose}>
                          <span className="num">{m.num}</span>
                          <span>{m.title}</span>
                          <span className="small muted">{mp.written ? `${mp.done}/${mp.total}` : "soon"}</span>
                          {mp.complete && <span className="done">✓</span>}
                        </a>
                        {active &&
                          m.lessons.map((l) => (
                            <a key={l.slug} href={href.lesson(l.slug)} className={`side-lesson ${route.page === "lesson" && route.slug === l.slug ? "active" : ""} ${l.body ? "" : "planned"}`} onClick={onClose}>
                              <span className="num">{lessonLabel(l)}</span>
                              <span>{l.title}</span>
                              {t.lessonDone(l.slug) && <span className="done">✓</span>}
                            </a>
                          ))}
                      </div>
                    );
                  })}
                {isOpen && (
                  <a href={href.project(s.id)} className={`side-topic summary ${route.page === "project" && route.stageId === s.id ? "active" : ""}`} onClick={onClose}>
                    <span className="num">🏗️</span>
                    <span>Stage project</span>
                    {sp.projectDone && <span className="done">✓</span>}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
