// The glossary must point at real topics, and every term must actually appear in the topic that teaches it.
import { describe, expect, it } from "vitest";
import { DB_COURSE } from "./index";
import { TERMS, termsBeforeTaught, topicOrder } from "./glossary";

const flat = DB_COURSE.modules.flatMap((m) => m.topics);
const bySlug = new Map(flat.map((t) => [t.slug, t]));
const order = topicOrder(flat.map((t) => t.slug));

function topicText(slug: string): string {
  const t = bySlug.get(slug)!;
  return [t.title, t.story, ...t.tldr, ...(t.words ?? []).flat(), ...t.sections.flatMap((s) => [s.title, s.ask, s.analogy, s.why, s.body, s.tip, s.warn, s.more, ...(s.bullets ?? []), ...(s.sql ?? []).map((q) => q.sql), ...(s.code ?? []).map((c) => c.src)]), ...(t.realWorld ?? []).flatMap((r) => [r.problem, r.whyHard, ...r.steps, r.sql]), ...t.practice.flatMap((p) => [p.q, p.explain, p.sql]), ...t.interview.flatMap((q) => [q.q, q.a, q.sql])].filter(Boolean).join("\n");
}

describe("glossary", () => {
  it("has unique ids and real teaching topics", () => {
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length);
    for (const t of TERMS) expect(bySlug.has(t.taughtIn), `${t.id} → ${t.taughtIn}`).toBe(true);
  });
  it("every term appears in the topic that teaches it", () => {
    const missing = TERMS.filter((t) => !t.match.test(topicText(t.taughtIn))).map((t) => `${t.id} → ${t.taughtIn}`);
    expect(missing).toEqual([]);
  });
  it("explains WITH and recursion on the aggregates topic, which uses them before 2.4", () => {
    const t = bySlug.get("aggregates-group-by")!;
    const ids = termsBeforeTaught(t.interview.map((q) => q.a), t.slug, order).map((x) => x.id);
    expect(ids).toContain("recursive-cte");
  });
  it("shows nothing for a term on or after its own topic", () => {
    const ids = termsBeforeTaught(["WITH x AS (SELECT 1) SELECT * FROM x"], "window-functions", order).map((x) => x.id);
    expect(ids).not.toContain("cte");
  });
  it("every explanation is a real sentence", () => {
    for (const t of TERMS) expect(t.plain.length, t.id).toBeGreaterThan(40);
  });
});
