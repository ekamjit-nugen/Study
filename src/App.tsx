import { useEffect, useState, type JSX } from "react";
import Sidebar from "./components/Sidebar";
import TopicView from "./components/TopicView";
import LessonPlayer from "./components/LessonPlayer";
import { useLocal } from "./lib/useLocal";
import { CheatSheet, CourseHome, HardProblems, Home, InterviewBank } from "./components/Pages";
import Playground from "./components/Playground";
import { MissionPage, ProjectHome } from "./components/Project";
import { NotesBar, NotesPage } from "./components/NotesBar";
import ChapterSummary from "./components/ChapterSummary";
import HoverNote from "./components/HoverNote";
import QuickGo from "./components/QuickGo";
import QuickLearn from "./components/QuickLearn";
import { findCourse } from "./courses/registry";
import { useRoute } from "./lib/route";

export default function App() {
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute("data-theme") ?? "light");
  const [view, setView] = useLocal<"steps" | "page">("fsm-topic-view", "steps");
  const [quickGo, setQuickGo] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickGo((q) => !q);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("fsm-theme", t);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    document.title = "Full-Stack Mastery";
  }, []);

  let body: JSX.Element;
  if (route.page === "home") body = <Home />;
  else if (route.page === "hard") body = <HardProblems />;
  else if (route.page === "interview") body = <InterviewBank />;
  else if (route.page === "playground") body = <Playground />;
  else if (route.page === "cheatsheet") body = <CheatSheet />;
  else if (route.page === "project") body = <ProjectHome />;
  else if (route.page === "mission") body = <MissionPage key={route.id} id={route.id} />;
  else if (route.page === "notes") body = <NotesPage />;
  else if (route.page === "chapter") {
    const course = findCourse(route.course);
    body = course ? <ChapterSummary key={route.moduleId} course={course} moduleId={route.moduleId} /> : <div className="content"><h1>Not found</h1></div>;
  } else if (route.page === "quick") {
    const course = findCourse(route.course);
    body = course ? <QuickLearn course={course} /> : <div className="content"><h1>Not found</h1></div>;
  }
  else {
    const course = findCourse(route.course);
    if (!course) body = <div className="content"><h1>Not found</h1><a href="#/">Home</a></div>;
    else if (route.page === "course") body = <CourseHome course={course} />;
    else {
      const flat = course.modules.flatMap((m) => m.topics.map((t) => ({ m, t })));
      const idx = flat.findIndex((x) => x.t.slug === route.slug);
      if (idx < 0) body = <div className="content"><h1>Topic not found</h1><a href={`#/${course.id}`}>Back to {course.title}</a></div>;
      else if (view === "page")
        body = (
          <div>
            <div className="content" style={{ marginBottom: "-0.5rem" }}>
              <button className="btn small" onClick={() => setView("steps")}>▶ step by step</button>
            </div>
            <TopicView key={route.slug} course={course} module={flat[idx].m} topic={flat[idx].t} prev={flat[idx - 1]?.t} next={flat[idx + 1]?.t} />
          </div>
        );
      else body = <LessonPlayer key={route.slug} course={course} module={flat[idx].m} topic={flat[idx].t} prev={flat[idx - 1]?.t} next={flat[idx + 1]?.t} onPageView={() => setView("page")} initialStep={route.step} />;
    }
  }

  return (
    <div className="app">
      <Sidebar route={route} open={open} onClose={() => setOpen(false)} theme={theme} setTheme={setTheme} />
      <main className="main">
        <NotesBar onMenu={() => setOpen(true)} onQuickGo={() => setQuickGo(true)} />
        {body}
        <HoverNote />
        <QuickGo open={quickGo} onClose={() => setQuickGo(false)} />
      </main>
    </div>
  );
}
