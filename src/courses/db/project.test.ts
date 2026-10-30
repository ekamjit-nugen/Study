// Plays the whole project with the reference solutions and expects every check to pass.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { MISSIONS } from "./project";
import { runChecks } from "../../lib/projectChecks";
import { runSql } from "../../lib/sqlCore";
import { DB_COURSE } from "./index";

const require = createRequire(import.meta.url);
let SQL: SqlJsStatic;
beforeAll(async () => {
  const distDir = join(dirname(require.resolve("sql.js")), "..", "dist");
  SQL = await initSqlJs({ locateFile: (f: string) => join(distDir, f) });
});

describe("project missions", () => {
  it("reference solutions pass every check, in order", async () => {
    const db = new SQL.Database();
    db.exec("PRAGMA foreign_keys = ON;");
    const copy = async () => {
      const c = new SQL.Database(db.export());
      c.exec("PRAGMA foreign_keys = ON;");
      return c;
    };
    const slugs = new Set(DB_COURSE.modules.flatMap((m) => m.topics.map((t) => t.slug)));
    for (const m of MISSIONS) {
      expect(slugs.has(m.learn), `${m.id} learn link`).toBe(true);
      const r = runSql(db, m.solution);
      expect(r.ok, `${m.id} solution: ${r.ok ? "" : r.error}`).toBe(true);
      if (m.data && m.data !== m.solution) {
        const d = runSql(db, m.data);
        expect(d.ok, `${m.id} data: ${d.ok ? "" : d.error}`).toBe(true);
      }
      const results = await runChecks(m, m.solution, copy);
      for (const c of results) expect(c.ok, `${m.id} / ${c.label}: ${c.msg}`).toBe(true);
    }
    db.close();
  });
  it("an empty answer fails the first mission", async () => {
    const db = new SQL.Database();
    const copy = async () => new SQL.Database(db.export());
    const results = await runChecks(MISSIONS[0], "", copy);
    expect(results.some((c) => !c.ok)).toBe(true);
  });
});
