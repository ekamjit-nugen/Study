import type { Course } from "../types";
import { M01 } from "./m01";
import { M02 } from "./m02";
import { M03 } from "./m03";
import { M04 } from "./m04";
import { M05 } from "./m05";
import { M06 } from "./m06";
import { M07 } from "./m07";
import { M08 } from "./m08";
import { M09 } from "./m09";
import { SQL_TOOLKIT, VIEWS_TRIGGERS } from "./t-sql-toolkit";
import { JSON_AND_SEARCH } from "./t-json-search";
import { OPERATIONS, ORMS } from "./t-orm-ops";
import { OLTP_OLAP } from "./t-olap";
import { DIALECTS } from "./t-dialects";
import type { Topic } from "../types";
import { INTERVIEW_EXTRA } from "./interviewExtra";
import { QUIZ } from "./quiz";

/** Topics added after the first release, appended to their modules (chapters list them in the same order). */
const EXTRA: Record<string, Topic[]> = {
  sql: [SQL_TOOLKIT, VIEWS_TRIGGERS],
  design: [JSON_AND_SEARCH],
  performance: [ORMS, OPERATIONS],
  scale: [OLTP_OLAP],
  interview: [DIALECTS],
};

export const DB_COURSE: Course = {
  id: "db",
  title: "Databases",
  short: "DB",
  emoji: "🗄️",
  tagline: "From 'what is a table' to isolation levels, query plans, sharding, security, multi-tenancy, ORMs, operations and the classic hard SQL problems, with every example runnable in your browser.",
  status: "ready",
  modules: [M01, M02, M03, M04, M05, M06, M09, M07, M08].map((m) => ({
    ...m,
    topics: [...m.topics, ...(EXTRA[m.id] ?? [])].map((t) => ({ ...t, quiz: QUIZ[t.slug] ?? [], interview: [...t.interview, ...(INTERVIEW_EXTRA[t.slug] ?? [])] })),
  })),
};
