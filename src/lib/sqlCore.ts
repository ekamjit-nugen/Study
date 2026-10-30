// Pure helpers around a sql.js Database. No browser APIs, so the tests can use it too.
import type { Database, SqlJsStatic } from "sql.js";
import { SEED_SQL } from "../courses/db/seed";

export type ResultSet = { columns: string[]; rows: (number | string | null | Uint8Array)[][] };
export type RunOutcome =
  | { ok: true; results: ResultSet[]; changes: number; ms: number }
  | { ok: false; error: string; ms: number };

export function seedDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  db.exec(SEED_SQL);
  return db;
}

/** Run one or more statements. Returns every result set (SELECTs) plus the number of changed rows. */
export function runSql(db: Database, sql: string): RunOutcome {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const out = db.exec(sql);
    const results: ResultSet[] = out.map((r) => ({ columns: r.columns, rows: r.values as ResultSet["rows"] }));
    const changes = db.getRowsModified();
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    return { ok: true, results, changes, ms: t1 - t0 };
  } catch (e) {
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    return { ok: false, error: e instanceof Error ? e.message : String(e), ms: t1 - t0 };
  }
}

/** Split a script into statements using SQLite's own parser (handles strings and comments). */
export function splitStatements(db: Database, sql: string): string[] {
  const out: string[] = [];
  for (const st of db.iterateStatements(sql)) {
    const text = st.getSQL().trim();
    st.free();
    if (text) out.push(text);
  }
  return out;
}

/**
 * EXPLAIN QUERY PLAN for the LAST statement of a script, after running the statements before it
 * (so "CREATE INDEX ...; SELECT ..." explains the SELECT with the index in place).
 * Lines are indented like SQLite's shell does.
 */
export function queryPlan(db: Database, sql: string): string[] {
  try {
    const stmts = splitStatements(db, sql);
    if (!stmts.length) return [];
    const last = stmts[stmts.length - 1].replace(/^EXPLAIN\s+QUERY\s+PLAN\s+/i, "").replace(/;\s*$/, "");
    if (stmts.length > 1) db.exec(stmts.slice(0, -1).join(";\n") + ";");
    const out = db.exec("EXPLAIN QUERY PLAN " + last);
    if (!out.length) return [];
    const idx = out[0].columns.indexOf("detail");
    const idIdx = out[0].columns.indexOf("id");
    const parentIdx = out[0].columns.indexOf("parent");
    const depth = new Map<number, number>();
    return out[0].values.map((v) => {
      const id = Number(v[idIdx]);
      const parent = Number(v[parentIdx]);
      const d = parent === 0 ? 0 : (depth.get(parent) ?? 0) + 1;
      depth.set(id, d);
      return "  ".repeat(d) + String(v[idx]);
    });
  } catch (e) {
    return ["(no plan) " + (e instanceof Error ? e.message : String(e))];
  }
}

function normCell(c: unknown): string {
  if (c === null || c === undefined) return "∅";
  if (typeof c === "number") return Number.isInteger(c) ? String(c) : c.toFixed(4);
  return String(c);
}

/** Same rows, ignoring row order and column names. Only the LAST result set counts. */
export function sameRows(a: ResultSet | undefined, b: ResultSet | undefined): boolean {
  if (!a || !b) return false;
  if (a.columns.length !== b.columns.length) return false;
  const key = (rs: ResultSet) => rs.rows.map((r) => r.map(normCell).join("\u0001")).sort().join("\n");
  return key(a) === key(b);
}

export function lastResult(o: RunOutcome): ResultSet | undefined {
  return o.ok ? o.results[o.results.length - 1] : undefined;
}

/** User tables currently in the database. */
export function tableNames(db: Database): string[] {
  const out = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  return out.length ? out[0].values.map((v) => String(v[0])) : [];
}

/** Table names a script refers to (FROM / JOIN / INTO / UPDATE / CREATE TABLE), in order of first use. */
export function referencedTables(sql: string, known: string[]): string[] {
  const knownLower = new Map(known.map((k) => [k.toLowerCase(), k]));
  const stripped = sql.replace(/--[^\n]*/g, " ").replace(/'[^']*'/g, "''");
  const re = /\b(?:from|join|into|update|table(?:\s+if\s+not\s+exists)?)\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi;
  const seen: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    const name = knownLower.get(m[1].toLowerCase());
    if (name && !seen.includes(name)) seen.push(name);
  }
  return seen;
}

/** First rows of a table plus its total row count. */
export function peekTable(db: Database, table: string, limit: number): ResultSet & { total: number } {
  const q = `"${table.replace(/"/g, '""')}"`;
  const rows = db.exec(`SELECT * FROM ${q} LIMIT ${limit}`);
  const count = db.exec(`SELECT COUNT(*) FROM ${q}`);
  const total = count.length ? Number(count[0].values[0][0]) : 0;
  if (!rows.length) {
    const cols = db.exec(`PRAGMA table_info(${q})`);
    return { columns: cols.length ? cols[0].values.map((v) => String(v[1])) : [], rows: [], total };
  }
  return { columns: rows[0].columns, rows: rows[0].values as ResultSet["rows"], total };
}
