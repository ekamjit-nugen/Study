// Runs a mission's checks against throw-away copies of the learner's project database.
import type { Database } from "sql.js";
import type { Check, Mission } from "../courses/db/project";
import { projectCopy } from "./sqlBrowser";
import { lastResult, queryPlan, runSql, sameRows, type ResultSet } from "./sqlCore";

export type CheckResult = { label: string; ok: boolean; msg: string };

function rowsOf(expect: (string | number | null)[][]): ResultSet {
  return { columns: expect[0]?.map((_, i) => "c" + i) ?? [], rows: expect };
}

function describe(rs: ResultSet | undefined): string {
  if (!rs) return "no rows";
  return rs.rows.slice(0, 4).map((r) => "[" + r.map((c) => (c === null ? "NULL" : String(c))).join(", ") + "]").join(" ") + (rs.rows.length > 4 ? " …" : "");
}

async function one(check: Check, learnerSql: string, copy: () => Promise<Database>): Promise<CheckResult> {
  const db: Database = await copy();
  try {
    if (check.kind === "probe" || check.kind === "effect") {
      if (check.kind === "effect") {
        for (let i = 0; i < (check.times ?? 1); i++) {
          const r = runSql(db, learnerSql);
          if (!r.ok) return { label: check.label, ok: false, msg: "Your SQL errored: " + r.error };
        }
      }
      const out = runSql(db, check.sql);
      if (!out.ok) return { label: check.label, ok: false, msg: "Could not check: " + out.error };
      const got = lastResult(out);
      const want = rowsOf(check.expect);
      const ok = !!got && got.rows.length === want.rows.length && sameRows({ columns: want.columns, rows: got.rows }, want);
      return { label: check.label, ok, msg: ok ? "✓" : `expected ${describe(want)} but got ${describe(got)}` };
    }
    if (check.kind === "result") {
      const mine = runSql(db, learnerSql);
      if (!mine.ok) return { label: check.label, ok: false, msg: "Your SQL errored: " + mine.error };
      const db2 = await copy();
      const theirs = runSql(db2, check.solution);
      db2.close();
      if (!theirs.ok) return { label: check.label, ok: false, msg: "The reference query failed on your database; earlier missions may be incomplete: " + theirs.error };
      const ok = sameRows(lastResult(mine), lastResult(theirs));
      return { label: check.label, ok, msg: ok ? "✓" : `your rows ${describe(lastResult(mine))} differ from the expected ${describe(lastResult(theirs))}` };
    }
    if (check.kind === "fails") {
      const out = runSql(db, check.sql);
      return { label: check.label, ok: !out.ok, msg: out.ok ? "this statement should have been refused, but it succeeded" : "✓ refused: " + out.error };
    }
    if (check.kind === "plan") {
      const plan = queryPlan(db, check.sql).join(" ");
      const ok = plan.includes(check.includes) && !(check.excludes && plan.includes(check.excludes));
      return { label: check.label, ok, msg: ok ? "✓ " + plan : `plan was: ${plan || "(empty)"}; expected it to contain "${check.includes}"${check.excludes ? ` and not "${check.excludes}"` : ""}` };
    }
    return { label: "unknown check", ok: false, msg: "" };
  } finally {
    db.close();
  }
}

export async function runChecks(mission: Mission, learnerSql: string, copy: () => Promise<Database> = projectCopy): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  for (const c of mission.checks) out.push(await one(c, learnerSql, copy));
  return out;
}
