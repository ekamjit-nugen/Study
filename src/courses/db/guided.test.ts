import { describe, expect, it } from "vitest";
import { DB_COURSE } from "./index";
import { QUIZ } from "./quiz";

describe("guided style on every topic", () => {
  it("every topic is guided, opens with a think-first scenario and ends with a connect-back page", () => {
    for (const m of DB_COURSE.modules)
      for (const t of m.topics) {
        expect(t.guided, t.slug + " guided").toBe(true);
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
