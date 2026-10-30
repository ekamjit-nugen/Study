// Runs every SQL example, real-world solution and practice solution in the Databases course
// against a fresh seeded sql.js database. Each must execute without error, and practice
// solutions must return rows (so "Check my answer" has something to compare).
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { DB_COURSE } from "./index";
import { lastResult, runSql, seedDatabase } from "../../lib/sqlCore";

const require = createRequire(import.meta.url);
let SQL: SqlJsStatic;

beforeAll(async () => {
  const distDir = join(dirname(require.resolve("sql.js")), "..", "dist");
  SQL = await initSqlJs({ locateFile: (f: string) => join(distDir, f) });
});

type Case = { name: string; sql: string; mustReturnRows?: boolean; expectError?: boolean; topic?: string };
const cases: Case[] = [];
const slugs = new Set<string>();
for (const m of DB_COURSE.modules) {
  for (const t of m.topics) {
    expect(slugs.has(t.slug), `duplicate slug ${t.slug}`).toBe(false);
    slugs.add(t.slug);
    t.sections.forEach((s, si) =>
      s.sql?.forEach((q, qi) => {
        // Examples whose note says they fail on purpose are allowed to error.
        const intentional = /fail/i.test((q.note ?? "") + (q.title ?? ""));
        cases.push({ name: `${t.slug} §${si + 1}.${qi + 1} ${q.title ?? ""}`, sql: q.sql, expectError: intentional, topic: t.slug });
      }),
    );
    t.realWorld?.forEach((rw, i) => rw.sql && cases.push({ name: `${t.slug} real-world ${i + 1}: ${rw.title}`, sql: rw.sql }));
    t.practice.forEach((p, i) => p.sql && cases.push({ name: `${t.slug} practice ${i + 1}`, sql: p.sql, mustReturnRows: true }));
    t.interview.forEach((q, i) => q.sql && cases.push({ name: `${t.slug} interview ${i + 1}: ${q.q}`, sql: q.sql }));
  }
}

const topicDbs = new Map<string, ReturnType<typeof seedDatabase>>();
function topicDb(slug: string) {
  let db = topicDbs.get(slug);
  if (!db) {
    db = seedDatabase(SQL);
    topicDbs.set(slug, db);
  }
  return db;
}

import { INTERVIEW_EXTRA } from "./interviewExtra";

describe("interview extras", () => {
  it("only reference real topic slugs", () => {
    for (const slug of Object.keys(INTERVIEW_EXTRA)) expect(slugs.has(slug), `unknown slug ${slug}`).toBe(true);
  });
  it("every topic has at least 8 questions and 2 tricky ones", () => {
    for (const m of DB_COURSE.modules)
      for (const t of m.topics) {
        expect(t.interview.length, t.slug).toBeGreaterThanOrEqual(8);
        expect(t.interview.filter((q) => q.tricky).length, t.slug + " tricky").toBeGreaterThanOrEqual(2);
      }
  });
});

import { QUIZ } from "./quiz";

describe("quizzes", () => {
  it("every topic has 3 quick checks with a valid answer index and varied positions", () => {
    const positions = new Set<number>();
    for (const m of DB_COURSE.modules)
      for (const t of m.topics) {
        expect(QUIZ[t.slug]?.length, t.slug).toBeGreaterThanOrEqual(3);
        for (const q of QUIZ[t.slug]) {
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
          positions.add(q.answer);
        }
      }
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });
});

describe("database course SQL", () => {
  it("has cases", () => expect(cases.length).toBeGreaterThan(80));
  for (const c of cases) {
    it(c.name, () => {
      // Section examples share one database per topic (like the browser's shared DB), so a box
      // may build on the previous one. Real-world and practice solutions run on a fresh DB.
      const db = c.topic ? topicDb(c.topic) : seedDatabase(SQL);
      const out = runSql(db, c.sql);
      if (!c.topic) db.close();
      if (c.expectError) {
        // Intentional failures: either an error, or a successful statement that is harmless.
        return;
      }
      expect(out.ok, out.ok ? "" : out.error).toBe(true);
      if (c.mustReturnRows && out.ok) {
        const last = lastResult(out);
        expect(last, "practice solution must end with a SELECT").toBeTruthy();
        expect(last!.rows.length, "practice solution returned no rows").toBeGreaterThan(0);
      }
    });
  }
});
