// The AI Engineer Path: 10 stages → 50 modules → one lesson per concept.
// Every lesson follows the same learner-friendly shape (concept, why, how, visual, examples, maths, code, use, takeaways).
// Parts that do not fit a concept are simply left out; the shape never forces an example type.

export type Lang = "ts" | "js" | "py" | "sql" | "bash" | "json" | "text";

export type Table = { head: string[]; rows: string[][]; caption?: string };

/** A line of code and what it does, read one line at a time. `code` must be an exact substring of the source. */
export type CodeLine = { code: string; say: string };

export type CodeDemo = {
  title?: string;
  lang: Lang;
  src: string;
  lines?: CodeLine[];
  /** What running it prints, when that helps. */
  output?: string;
  note?: string;
};

/** A picture in words: the renderer draws it. */
export type Figure =
  | { kind: "flow"; steps: string[]; caption?: string }
  | { kind: "table"; table: Table; caption?: string }
  | { kind: "compare"; left: { title: string; points: string[] }; right: { title: string; points: string[] }; caption?: string }
  | { kind: "steps"; items: { label: string; detail: string }[]; caption?: string }
  | { kind: "tree"; root: string; children: { label: string; children?: string[] }[]; caption?: string };

/** An example: everyday, engineering or creative. */
export type Example = { title: string; text: string; code?: CodeDemo; table?: Table };

/** The maths, with numbers worked step by step. */
export type Maths = {
  /** Plain-text formula, e.g. "y = w·x + b". */
  formula: string;
  /** What each symbol means, in words. */
  meaning: string;
  /** Numbered steps with real numbers. */
  worked: string[];
  note?: string;
};

/** The written body of a lesson. Prose fields accept paragraphs separated by blank lines, **bold**, `code`, lists and pipe tables. */
export type LessonBody = {
  /** One line, plain words: what you will be able to say after this lesson. */
  simple: string;
  /** 1. The concept from first principles, simple words first. */
  concept: string;
  /** 2. The problem it solves; why it exists. */
  why: string;
  /** 3. How it works inside, as steps. */
  how: string[];
  /** 4. A visual. */
  visual?: Figure;
  /** 5. An everyday example. */
  everyday?: Example;
  /** 6. How engineers and companies use it. */
  engineering?: Example;
  /** 7. An imaginative scenario, when it clarifies. */
  creative?: Example;
  /** 8. Formulas and a numerical walk-through, where relevant. */
  maths?: Maths;
  /** 9. Code, when appropriate. */
  code?: CodeDemo;
  /** 10. Where the concept is useful in practice. */
  useIt: string;
  /** 11. Key takeaways. */
  takeaways: string[];
  /** New technical words this lesson introduces, in plain words. */
  terms?: [string, string][];
  /** One question to sit with (no answer shown until tapped). */
  reflect?: { q: string; a: string };
};

export type Lesson = {
  slug: string;
  title: string;
  /** The module this lesson belongs to. */
  moduleId: string;
  stageNum: number;
  moduleNum: number;
  num: number;
  minutes: number;
  body?: LessonBody;
};

export type Quiz = {
  q: string;
  options: string[];
  answer: number;
  /** One line per option: why it is right or wrong. */
  why: string[];
  /** Ask the learner to write their reasoning before locking in. */
  reason?: boolean;
};

export type Exercise = {
  title: string;
  kind: "think" | "calculate" | "code" | "build";
  task: string;
  hints?: string[];
  solution: string;
};

export type Module = {
  id: string;
  num: number;
  stageNum: number;
  title: string;
  /** What this module is for, in one or two plain sentences. */
  goal: string;
  /** Example domains the plan suggests for this module. */
  examples?: string;
  lessons: Lesson[];
  quiz: Quiz[];
  exercises: Exercise[];
};

export type Project = {
  title: string;
  goal: string;
  steps: string[];
  deliverable: string;
  checks: string[];
};

export type Stage = {
  id: string;
  num: number;
  title: string;
  objective: string;
  modules: Module[];
  project: Project;
};

/** A glossary term: explained under the first paragraph that uses it before its lesson. */
export type Term = { id: string; label: string; match: RegExp; taughtIn: string; plain: string };
