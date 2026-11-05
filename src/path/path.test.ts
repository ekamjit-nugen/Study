// The map is complete and consistent; every written lesson has the learner-friendly shape; the glossary points at real lessons.
import { describe, expect, it } from "vitest";
import { COUNTS, LESSONS, MODULES, STAGES } from "./index";
import { GLOSSARY } from "./glossary";

describe("the path map", () => {
  it("has 10 stages, 50 modules and one lesson per concept", () => {
    expect(STAGES.length).toBe(10);
    expect(MODULES.length).toBe(50);
    expect(MODULES.map((m) => m.num)).toEqual(MODULES.map((_, i) => i + 1));
    expect(LESSONS.length).toBeGreaterThanOrEqual(590);
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
    for (const m of MODULES) expect(m.lessons.length, m.title).toBeGreaterThanOrEqual(8);
    for (const s of STAGES) {
      expect(s.project.steps.length).toBeGreaterThanOrEqual(3);
      expect(s.project.checks.length).toBeGreaterThanOrEqual(3);
    }
    expect(COUNTS.written).toBeGreaterThanOrEqual(10);
  });

  it("every written lesson has the full learner-friendly shape", () => {
    for (const l of LESSONS) {
      if (!l.body) continue;
      const b = l.body;
      const where = `${l.slug}: `;
      expect(b.simple.length, where + "simple").toBeGreaterThan(40);
      expect(b.concept.length, where + "concept").toBeGreaterThan(300);
      expect(b.why.length, where + "why").toBeGreaterThan(150);
      expect(b.how.length, where + "how steps").toBeGreaterThanOrEqual(3);
      expect(b.useIt.length, where + "useIt").toBeGreaterThan(80);
      expect(b.takeaways.length, where + "takeaways").toBeGreaterThanOrEqual(3);
      const examples = [b.everyday, b.engineering, b.creative].filter(Boolean).length;
      expect(examples, where + "at least two examples").toBeGreaterThanOrEqual(2);
      for (const ex of [b.everyday, b.engineering, b.creative]) if (ex) expect(ex.text.length, where + ex.title).toBeGreaterThan(120);
      if (b.maths) expect(b.maths.worked.length, where + "worked maths").toBeGreaterThanOrEqual(2);
      const codes = [b.code, b.everyday?.code, b.engineering?.code, b.creative?.code].filter(Boolean);
      for (const c of codes) for (const line of c!.lines ?? []) expect(c!.src.includes(line.code.trim()), where + `line '${line.code}' not in its code`).toBe(true);
      if (b.reflect) expect(b.reflect.a.length, where + "reflect answer").toBeGreaterThan(40);
    }
  });

  it("modules with written lessons have a quiz and exercises that match their shape", () => {
    for (const m of MODULES) {
      const allWritten = m.lessons.every((l) => l.body);
      if (!allWritten) continue;
      expect(m.quiz.length, m.title + " quiz").toBeGreaterThanOrEqual(6);
      expect(m.quiz.some((q) => q.reason), m.title + " a reasoned question").toBe(true);
      for (const q of m.quiz) {
        expect(q.why.length, q.q).toBe(q.options.length);
        expect(q.answer).toBeLessThan(q.options.length);
      }
      expect(m.exercises.length, m.title + " exercises").toBeGreaterThanOrEqual(3);
      for (const e of m.exercises) expect(e.solution.length, e.title).toBeGreaterThan(60);
    }
  });

  it("glossary terms point at lessons on the map and have real explanations", () => {
    const slugs = new Set(LESSONS.map((l) => l.slug));
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
    for (const t of GLOSSARY) {
      expect(slugs.has(t.taughtIn), `${t.id} → ${t.taughtIn}`).toBe(true);
      expect(t.plain.length, t.id).toBeGreaterThan(40);
    }
  });
});

describe("lesson bodies are keyed by real slugs", () => {
  it("every body key matches a concept on the map (a typo would silently hide a lesson)", async () => {
    const { BODIES, MODULE_QUIZZES, MODULE_EXERCISES } = await import("./content");
    const slugs = new Set(LESSONS.map((l) => l.slug));
    const bad = Object.keys(BODIES).filter((k) => !slugs.has(k));
    expect(bad, "unknown lesson slugs: " + bad.join(", ")).toEqual([]);
    const ids = new Set(MODULES.map((m) => m.id));
    for (const k of [...Object.keys(MODULE_QUIZZES), ...Object.keys(MODULE_EXERCISES)]) expect(ids.has(k), "unknown module id " + k).toBe(true);
  });
  it("lists the exact slugs for every module, for the writers", () => {
    for (const m of MODULES) expect(m.lessons.every((l) => l.slug.startsWith(m.id + "-"))).toBe(true);
  });
});
