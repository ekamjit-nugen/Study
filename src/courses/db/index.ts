import type { Course } from "../types";
import { M01 } from "./m01";
import { M02 } from "./m02";
import { M03 } from "./m03";
import { M04 } from "./m04";
import { M05 } from "./m05";
import { M06 } from "./m06";
import { M07 } from "./m07";
import { INTERVIEW_EXTRA } from "./interviewExtra";
import { QUIZ } from "./quiz";

export const DB_COURSE: Course = {
  id: "db",
  title: "Databases",
  short: "DB",
  emoji: "🗄️",
  tagline: "From 'what is a table' to isolation levels, query plans, sharding and the classic hard SQL problems, with every example runnable in your browser.",
  status: "ready",
  modules: [M01, M02, M03, M04, M05, M06, M07].map((m) => ({
    ...m,
    topics: m.topics.map((t) => ({ ...t, quiz: QUIZ[t.slug] ?? [], interview: [...t.interview, ...(INTERVIEW_EXTRA[t.slug] ?? [])] })),
  })),
};
