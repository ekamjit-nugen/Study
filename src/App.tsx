import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import StagePage from "./components/StagePage";
import ModulePage from "./components/ModulePage";
import LessonPage from "./components/LessonPage";
import ProjectPage from "./components/ProjectPage";
import GlossaryPage from "./components/GlossaryPage";
import RevisionPage from "./components/RevisionPage";
import { NotesBar, NotesPage } from "./components/NotesBar";
import HoverNote from "./components/HoverNote";
import { useRoute } from "./lib/route";

export default function App() {
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute("data-theme") ?? "light");
  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("aip-theme", t);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    setOpen(false);
  }, [route]);

  let body: React.ReactNode;
  if (route.page === "home") body = <Home />;
  else if (route.page === "stage") body = <StagePage id={route.id} />;
  else if (route.page === "module") body = <ModulePage id={route.id} />;
  else if (route.page === "lesson") body = <LessonPage slug={route.slug} />;
  else if (route.page === "project") body = <ProjectPage stageId={route.stageId} />;
  else if (route.page === "glossary") body = <GlossaryPage />;
  else if (route.page === "revision") body = <RevisionPage />;
  else body = <NotesPage />;

  return (
    <div className="app">
      <Sidebar route={route} open={open} onClose={() => setOpen(false)} theme={theme} setTheme={setTheme} />
      <main className="main">
        <NotesBar onMenu={() => setOpen(true)} />
        {body}
        <HoverNote />
      </main>
    </div>
  );
}
