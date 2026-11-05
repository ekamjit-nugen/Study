// Learner progress, tracked separately: lessons (explicitly marked), exercises, projects, revision flags, assessment results.
// Opening or reading a lesson never counts; only "Mark complete" does.
import { useLocal } from "./useLocal";

export type Track = {
  lessons: Record<string, string>; // slug → ISO date marked complete
  exercises: Record<string, string>; // "moduleId:index" → date
  projects: Record<string, string>; // stageId → date
  revision: Record<string, string>; // slug → date flagged for revision
  assessments: Record<string, { score: number; total: number; at: string }[]>; // moduleId → attempts
  lastLesson?: string;
};

const EMPTY: Track = { lessons: {}, exercises: {}, projects: {}, revision: {}, assessments: {} };
const now = () => new Date().toISOString();

export function useTrack() {
  const [t, setT] = useLocal<Track>("aip-track-v1", EMPTY);
  const lessonDone = (slug: string) => Boolean(t.lessons[slug]);
  const setLessonDone = (slug: string, done: boolean) =>
    setT((p) => {
      const lessons = { ...p.lessons };
      if (done) lessons[slug] = now();
      else delete lessons[slug];
      return { ...p, lessons };
    });
  const exerciseDone = (moduleId: string, i: number) => Boolean(t.exercises[`${moduleId}:${i}`]);
  const setExerciseDone = (moduleId: string, i: number, done: boolean) =>
    setT((p) => {
      const exercises = { ...p.exercises };
      const k = `${moduleId}:${i}`;
      if (done) exercises[k] = now();
      else delete exercises[k];
      return { ...p, exercises };
    });
  const projectDone = (stageId: string) => Boolean(t.projects[stageId]);
  const setProjectDone = (stageId: string, done: boolean) =>
    setT((p) => {
      const projects = { ...p.projects };
      if (done) projects[stageId] = now();
      else delete projects[stageId];
      return { ...p, projects };
    });
  const flagged = (slug: string) => Boolean(t.revision[slug]);
  const setFlagged = (slug: string, on: boolean) =>
    setT((p) => {
      const revision = { ...p.revision };
      if (on) revision[slug] = now();
      else delete revision[slug];
      return { ...p, revision };
    });
  const recordAssessment = (moduleId: string, score: number, total: number) =>
    setT((p) => ({ ...p, assessments: { ...p.assessments, [moduleId]: [...(p.assessments[moduleId] ?? []), { score, total, at: now() }] } }));
  const bestAssessment = (moduleId: string) => {
    const a = t.assessments[moduleId] ?? [];
    return a.length ? a.reduce((b, x) => (x.score / x.total > b.score / b.total ? x : b)) : null;
  };
  const setLastLesson = (slug: string) => setT((p) => (p.lastLesson === slug ? p : { ...p, lastLesson: slug }));
  const reset = () => setT(EMPTY);
  return { track: t, lessonDone, setLessonDone, exerciseDone, setExerciseDone, projectDone, setProjectDone, flagged, setFlagged, recordAssessment, bestAssessment, setLastLesson, reset };
}

export type TrackApi = ReturnType<typeof useTrack>;
