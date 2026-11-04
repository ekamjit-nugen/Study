import { describe, expect, it } from "vitest";
import { DB_COURSE } from "./index";
import { QUIZ } from "./quiz";

describe("guided style on every topic", () => {
  it("every topic is guided, opens with a think-first scenario and ends with a connect-back page", () => {
    for (const m of DB_COURSE.modules)
      for (const t of m.topics) {
        expect(t.guided, t.slug + " guided").toBe(true);
        if (t.tale) {
          // story format: scenes instead of sections
          expect(t.tale.length, t.slug + " pages").toBeGreaterThanOrEqual(6);
          expect(t.cast, t.slug + " cast").toBeTruthy();
          for (const pg of t.tale) {
            expect(pg.text.length, `${t.slug}: ${pg.title} text`).toBeGreaterThan(80);
            for (const q of pg.queries ?? []) {
              expect(q.lines?.length, `${t.slug}: ${pg.title} query lines`).toBeGreaterThan(0);
              for (const l of q.lines ?? []) expect(q.sql.includes(l.sql.trim()), `${t.slug}: line '${l.sql}' not in its query`).toBe(true);
            }
          }
          expect(t.tale[t.tale.length - 1].title.startsWith("Connect it back"), t.slug + " connect-back").toBe(true);
          // the eight-step pattern: problem first, a developer-vs-engineer page, a review at the end
          expect(t.tale[0].stage, t.slug + " opens with the problem").toBe("problem");
          expect(t.tale.some((pg) => pg.stage === "why"), t.slug + " why page").toBe(true);
          expect(t.tale.some((pg) => pg.stage === "compare" && pg.versus), t.slug + " compare page").toBe(true);
          const last = t.tale[t.tale.length - 1];
          expect(last.stage === "recap" && last.recap, t.slug + " recap page").toBeTruthy();
          for (const pg of t.tale) expect(pg.stage, `${t.slug}: ${pg.title} has a stage`).toBeTruthy();
          expect(t.difficulty, t.slug + " difficulty").toBeTruthy();
          expect(t.objectives?.length, t.slug + " objectives").toBeGreaterThanOrEqual(3);
          for (const pr of t.practice) if (pr.sql) expect(pr.lines?.length, `${t.slug}: practice '${pr.q}' lines`).toBeGreaterThan(0);
          continue;
        }
        expect(t.sections[0].ask, t.slug + " first section asks").toBeTruthy();
        expect(t.sections.filter((s) => s.ask).length, t.slug + " think-first pages").toBeGreaterThanOrEqual(2);
        expect(t.sections[t.sections.length - 1].title.startsWith("Connect it back"), t.slug + " connect-back").toBe(true);
        for (const s of t.sections) expect(s.analogy && s.why, `${t.slug}: ${s.title} analogy/why`).toBeTruthy();
      }
  });
  it("every checkpoint has feedback for every option and at least one asks for reasoning", () => {
    for (const [slug, qs] of Object.entries(QUIZ)) {
      expect(qs.some((q) => q.reason), slug + " reasoning").toBe(true);
      for (const q of qs) {
        expect(q.whyOptions?.length, `${slug}: ${q.q}`).toBe(q.options.length);
        for (const w of q.whyOptions ?? []) expect(w.length).toBeGreaterThan(10);
      }
    }
  });
});
