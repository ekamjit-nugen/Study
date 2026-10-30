// Browser-side sql.js lifecycle: one shared database for the lessons, fresh copies for answer checks.
import type { Database, SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js/dist/sql-wasm.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { seedDatabase } from "./sqlCore";

/** PRAGMA foreign_keys is per connection, so every new Database needs it again. */
function open(SQL: SqlJsStatic, bytes: Uint8Array): Database {
  const db = new SQL.Database(bytes);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;
let shared: Database | null = null;
let seedBytes: Uint8Array | null = null;
const listeners = new Set<() => void>();

export function loadSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => wasmUrl });
  return sqlPromise;
}

/** The database every lesson example runs against. Created and seeded on first use. */
export async function sharedDb(): Promise<Database> {
  const SQL = await loadSql();
  if (!shared) {
    shared = seedDatabase(SQL);
    seedBytes = shared.export();
    shared = open(SQL, seedBytes);
  }
  return shared;
}

/** A fresh seeded database, used so "Check my answer" never depends on earlier edits. */
export async function freshDb(): Promise<Database> {
  const SQL = await loadSql();
  await sharedDb();
  return open(SQL, seedBytes!);
}

/** Throw away every change and reseed. */
export async function resetShared(): Promise<Database> {
  const SQL = await loadSql();
  await sharedDb();
  shared?.close();
  shared = open(SQL, seedBytes!);
  listeners.forEach((l) => l());
  notifyChange();
  return shared;
}

export function onReset(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

const changeListeners = new Set<() => void>();
/** Any SQL box ran something that may have changed data; every table preview refreshes. */
export function notifyChange(): void {
  changeListeners.forEach((l) => l());
}
export function onChange(l: () => void): () => void {
  changeListeners.add(l);
  return () => changeListeners.delete(l);
}

/* ---------------- the learner's own project database (persisted) ---------------- */
const PKEY = "fsm-project-db";
let project: Database | null = null;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** The database the learner builds in the project. Starts empty; survives reloads via localStorage. */
export async function projectDb(): Promise<Database> {
  const SQL = await loadSql();
  if (!project) {
    let bytes: Uint8Array | null = null;
    try {
      const saved = localStorage.getItem(PKEY);
      if (saved) bytes = fromBase64(saved);
    } catch {
      /* ignore */
    }
    project = bytes ? open(SQL, bytes) : new SQL.Database();
    project.exec("PRAGMA foreign_keys = ON;");
  }
  return project;
}

export function saveProject(): void {
  if (!project) return;
  try {
    localStorage.setItem(PKEY, toBase64(project.export()));
  } catch {
    /* ignore */
  }
}

/** A throw-away copy of the project database, for checks that must not change it. */
export async function projectCopy(): Promise<Database> {
  const SQL = await loadSql();
  const db = await projectDb();
  return open(SQL, db.export());
}

export async function resetProject(): Promise<Database> {
  const SQL = await loadSql();
  project?.close();
  project = new SQL.Database();
  project.exec("PRAGMA foreign_keys = ON;");
  try {
    localStorage.removeItem(PKEY);
  } catch {
    /* ignore */
  }
  notifyChange();
  return project;
}
