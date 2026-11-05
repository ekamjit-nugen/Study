// Builds the path from the raw map plus the lesson bodies that have been written.
import type { Exercise, Lesson, LessonBody, Module, Quiz, Stage } from "./types";
import { RAW } from "./map";
import { BODIES, MODULE_QUIZZES, MODULE_EXERCISES } from "./content";

export function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const moduleId = (num: number) => `m${String(num).padStart(2, "0")}`;
export const stageId = (num: number) => `s${String(num).padStart(2, "0")}`;
export const lessonSlug = (moduleNum: number, title: string) => `${moduleId(moduleNum)}-${kebab(title)}`;

function build(): Stage[] {
  return RAW.map((s) => {
    const modules: Module[] = s.modules.map((m) => {
      const id = moduleId(m.num);
      const lessons: Lesson[] = m.concepts.map((title, i) => {
        const slug = lessonSlug(m.num, title);
        const body = BODIES[slug];
        return { slug, title, moduleId: id, stageNum: s.num, moduleNum: m.num, num: i + 1, minutes: body ? estimateMinutes(body) : 8, body };
      });
      return { id, num: m.num, stageNum: s.num, title: m.title, goal: m.goal, examples: m.examples, lessons, quiz: MODULE_QUIZZES[id] ?? [], exercises: MODULE_EXERCISES[id] ?? [] };
    });
    return { id: stageId(s.num), num: s.num, title: s.title, objective: s.objective, modules, project: s.project };
  });
}

function estimateMinutes(b: LessonBody): number {
  const words = JSON.stringify(b).split(/\s+/).length;
  return Math.max(6, Math.min(20, Math.round(words / 140)));
}

export const STAGES: Stage[] = build();
export const MODULES: Module[] = STAGES.flatMap((s) => s.modules);
export const LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);
export const LESSON_ORDER: Record<string, number> = Object.fromEntries(LESSONS.map((l, i) => [l.slug, i]));

const bySlug = new Map(LESSONS.map((l) => [l.slug, l]));
const moduleMap = new Map(MODULES.map((m) => [m.id, m]));
const stageMap = new Map(STAGES.map((s) => [s.id, s]));

export const findLesson = (slug: string) => bySlug.get(slug);
export const findModule = (id: string) => moduleMap.get(id);
export const findStage = (id: string) => stageMap.get(id);
export const stageOf = (m: Module) => stageMap.get(stageId(m.stageNum))!;
export const moduleOf = (l: Lesson) => moduleMap.get(l.moduleId)!;
export const prevLesson = (slug: string) => LESSONS[LESSON_ORDER[slug] - 1];
export const nextLesson = (slug: string) => LESSONS[LESSON_ORDER[slug] + 1];
export const lessonLabel = (l: Lesson) => `${l.moduleNum}.${l.num}`;

export const COUNTS = {
  stages: STAGES.length,
  modules: MODULES.length,
  lessons: LESSONS.length,
  written: LESSONS.filter((l) => l.body).length,
  quizzes: MODULES.filter((m) => m.quiz.length > 0).length,
  exercises: MODULES.reduce((n, m) => n + m.exercises.length, 0),
};

export type { Exercise, Quiz };
