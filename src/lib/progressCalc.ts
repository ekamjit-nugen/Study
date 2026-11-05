// Progress numbers derived from the map and the learner's track. Stage, module, lesson, exercise, project, revision and assessment are counted separately.
import { LESSONS, STAGES } from "../path";
import type { Lesson, Module, Stage } from "../path/types";
import type { Track } from "./track";

export const PASS_MARK = 0.7;

export function moduleProgress(m: Module, t: Track) {
  const written = m.lessons.filter((l) => l.body).length;
  const done = m.lessons.filter((l) => l.body && t.lessons[l.slug]).length;
  const exercisesDone = m.exercises.filter((_, i) => t.exercises[`${m.id}:${i}`]).length;
  const attempts = t.assessments[m.id] ?? [];
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score / a.total)) : null;
  const passed = best !== null && best >= PASS_MARK;
  const complete = written > 0 && written === m.lessons.length && done === written;
  return { total: m.lessons.length, written, done, exercisesDone, exercisesTotal: m.exercises.length, best, passed, complete, attempts: attempts.length };
}

export function stageProgress(s: Stage, t: Track) {
  const mods = s.modules.map((m) => moduleProgress(m, t));
  const total = mods.reduce((n, m) => n + m.total, 0);
  const written = mods.reduce((n, m) => n + m.written, 0);
  const done = mods.reduce((n, m) => n + m.done, 0);
  const modulesComplete = mods.filter((m) => m.complete).length;
  const projectDone = Boolean(t.projects[s.id]);
  const complete = modulesComplete === s.modules.length && projectDone;
  return { total, written, done, modulesComplete, modulesTotal: s.modules.length, projectDone, complete };
}

export function overall(t: Track) {
  const stages = STAGES.map((s) => stageProgress(s, t));
  const modules = STAGES.flatMap((s) => s.modules).map((m) => moduleProgress(m, t));
  return {
    stagesComplete: stages.filter((s) => s.complete).length,
    stagesTotal: STAGES.length,
    modulesComplete: modules.filter((m) => m.complete).length,
    modulesTotal: modules.length,
    lessonsDone: stages.reduce((n, s) => n + s.done, 0),
    lessonsWritten: stages.reduce((n, s) => n + s.written, 0),
    lessonsTotal: stages.reduce((n, s) => n + s.total, 0),
    exercisesDone: modules.reduce((n, m) => n + m.exercisesDone, 0),
    exercisesTotal: modules.reduce((n, m) => n + m.exercisesTotal, 0),
    projectsDone: stages.filter((s) => s.projectDone).length,
    projectsTotal: STAGES.length,
    revision: Object.keys(t.revision).length,
    assessmentsPassed: modules.filter((m) => m.passed).length,
    assessmentsTaken: modules.filter((m) => m.attempts > 0).length,
    assessmentsTotal: modules.filter((m) => m.exercisesTotal > 0 || m.written > 0).length,
  };
}

/** The lesson to continue with: the last opened if unfinished, else the first written lesson not yet marked complete. */
export function nextUp(t: Track): Lesson | undefined {
  if (t.lastLesson) {
    const l = LESSONS.find((x) => x.slug === t.lastLesson);
    if (l?.body && !t.lessons[l.slug]) return l;
  }
  return LESSONS.find((l) => l.body && !t.lessons[l.slug]) ?? LESSONS.find((l) => l.body);
}
