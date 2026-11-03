// The playground's helpers and every starter query, run on the real seed in Node.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { STARTERS } from "./starters";
import { insertTemplate, runScript, schemaInfo, seedDatabase, toCsv, toObjects } from "../../lib/sqlCore";

const require = createRequire(import.meta.url);
let SQL: SqlJsStatic;
beforeAll(async () => {
  const distDir = join(dirname(require.resolve("sql.js")), "..", "dist");
  SQL = await initSqlJs({ locateFile: (f: string) => join(distDir, f) });
});

const fresh = () => {
  const db = seedDatabase(SQL);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
};

describe("schemaInfo", () => {
  it("lists every seed table with columns, keys and counts", () => {
    const db = fresh();
    const s = schemaInfo(db);
    const names = s.map((t) => t.name);
    for (const t of ["customers", "products", "orders", "order_items", "payments", "employees", "product_tags", "logins", "bookings", "accounts"]) expect(names).toContain(t);
    const orders = s.find((t) => t.name === "orders")!;
    expect(orders.rows).toBeGreaterThan(0);
    expect(orders.columns.map((c) => c.name)).toEqual(["id", "customer_id", "ordered_at", "status"]);
    expect(orders.columns[0].pk).toBe(1);
    expect(orders.fks).toEqual([{ from: "customer_id", table: "customers", to: "id" }]);
    const items = s.find((t) => t.name === "order_items")!;
    expect(items.fks.map((f) => f.table).sort()).toEqual(["orders", "products"]);
    const tags = s.find((t) => t.name === "product_tags")!;
    expect(tags.columns.filter((c) => c.pk).length).toBe(2);
    db.close();
  });
  it("sees tables, views and indexes the learner creates", () => {
    const db = fresh();
    db.exec("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL); CREATE INDEX idx_notes_body ON notes(body); CREATE VIEW v AS SELECT 1 AS one;");
    const s = schemaInfo(db);
    const notes = s.find((t) => t.name === "notes")!;
    expect(notes.rows).toBe(0);
    expect(notes.indexes.filter((i) => !i.auto).map((i) => i.name)).toEqual(["idx_notes_body"]);
    expect(s.find((t) => t.name === "v")?.kind).toBe("view");
    expect(insertTemplate(notes)).toBe("INSERT INTO notes (body)\nVALUES ('text');");
    db.close();
  });
});

describe("runScript", () => {
  it("gives every statement its own result and keeps the earlier ones on error", () => {
    const db = fresh();
    const r = runScript(db, "SELECT COUNT(*) AS n FROM customers; INSERT INTO accounts (owner, balance) VALUES ('Zed', 10); SELECT * FROM nope; SELECT 1;");
    expect(r.steps.length).toBe(3);
    expect(r.steps[0].ok && r.steps[0].result?.rows[0][0]).toBeGreaterThan(0);
    expect(r.steps[1].ok && r.steps[1].changes).toBe(1);
    expect(r.steps[2].ok).toBe(false);
    expect(db.exec("SELECT COUNT(*) FROM accounts WHERE owner = 'Zed'")[0].values[0][0]).toBe(1);
    db.close();
  });
  it("runs a transaction across statements", () => {
    const db = fresh();
    const r = runScript(db, "BEGIN; UPDATE accounts SET balance = 0; ROLLBACK; SELECT SUM(balance) FROM accounts;");
    expect(r.steps.every((s) => s.ok)).toBe(true);
    const last = r.steps[3];
    expect(last.ok && Number(last.result?.rows[0][0])).toBeGreaterThan(0);
    db.close();
  });
});

describe("exports", () => {
  it("writes CSV with quoting and JSON objects", () => {
    const rs = { columns: ["a", "b"], rows: [[1, 'x,"y"'], [null, "line\nbreak"]] };
    expect(toCsv(rs)).toBe('a,b\n1,"x,""y"""\n,"line\nbreak"');
    expect(toObjects(rs)).toEqual([{ a: 1, b: 'x,"y"' }, { a: null, b: "line\nbreak" }]);
  });
});

describe("starter queries", () => {
  const all = STARTERS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group })));
  it("has a healthy library", () => {
    expect(STARTERS.length).toBeGreaterThanOrEqual(8);
    expect(all.length).toBeGreaterThanOrEqual(30);
    expect(new Set(all.map((i) => i.title)).size).toBe(all.length);
  });
  for (const it_ of all) {
    it(`${it_.group} · ${it_.title}`, () => {
      const db = fresh();
      const r = runScript(db, it_.sql);
      const expectError = /expect an error/i.test(it_.title);
      const bad = r.steps.filter((s) => !s.ok);
      if (expectError) expect(bad.length).toBe(1);
      else expect(bad.map((s) => (s.ok ? "" : s.error))).toEqual([]);
      const last = r.steps[r.steps.length - 1];
      if (!expectError && /^(SELECT|WITH|PRAGMA|EXPLAIN)/i.test(last.sql)) expect(last.ok && (last.result?.rows.length ?? 0)).toBeGreaterThan(0);
      db.close();
    });
  }
});
