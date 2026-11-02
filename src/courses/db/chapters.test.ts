import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { CHAPTERS } from "./chapters";
import { DB_COURSE } from "./index";
import { runSql, seedDatabase } from "../../lib/sqlCore";

const require = createRequire(import.meta.url);
let SQL: SqlJsStatic;
beforeAll(async () => {
  const distDir = join(dirname(require.resolve("sql.js")), "..", "dist");
  SQL = await initSqlJs({ locateFile: (f: string) => join(distDir, f) });
});

describe("chapter summaries", () => {
  it("cover every module and every topic, with at least 4 practical questions", () => {
    for (const m of DB_COURSE.modules) {
      const c = CHAPTERS.find((x) => x.moduleId === m.id);
      expect(c, m.id).toBeTruthy();
      expect(c!.overview.map((o) => o.slug)).toEqual(m.topics.map((t) => t.slug));
      expect(c!.practical.length, m.id).toBeGreaterThanOrEqual(4);
      expect(c!.rules.length, m.id).toBeGreaterThanOrEqual(3);
    }
  });
  it("every practical SQL runs on the seed data", () => {
    for (const c of CHAPTERS)
      for (const p of c.practical)
        if (p.sql) {
          const db = seedDatabase(SQL);
          const r = runSql(db, p.sql);
          db.close();
          expect(r.ok, `${c.moduleId}: ${p.q} → ${r.ok ? "" : r.error}`).toBe(!p.fails);
        }
  });
});
