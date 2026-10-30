import type { Course } from "./types";
import { DB_COURSE } from "./db";

export const COURSES: Course[] = [
  DB_COURSE,
  {
    id: "react",
    title: "React",
    short: "React",
    emoji: "⚛️",
    tagline: "Rendering, hooks, state, performance and patterns, taught the same visual way.",
    status: "coming",
    modules: [],
    planned: ["How React renders (virtual DOM, reconciliation, fibers)", "Components, props, composition", "State and the rules of hooks", "Effects: when they run and why they bite", "Context, reducers and state libraries", "Performance: memo, keys, lazy, Suspense", "Forms, refs and the DOM", "Testing React", "Hard real-world UI problems", "Interview bank"],
  },
  {
    id: "next",
    title: "Next.js",
    short: "Next.js",
    emoji: "▲",
    tagline: "App Router, server components, caching, rendering modes and deployment.",
    status: "coming",
    modules: [],
    planned: ["Rendering modes: SSR, SSG, ISR, streaming", "App Router, layouts and server components", "Data fetching and the caching layers", "Server actions and mutations", "Auth, middleware and edge", "Performance and Core Web Vitals", "Hard real-world problems", "Interview bank"],
  },
  {
    id: "node",
    title: "Node.js",
    short: "Node",
    emoji: "🟢",
    tagline: "Event loop, streams, workers, performance and production patterns.",
    status: "coming",
    modules: [],
    planned: ["Event loop, phases and microtasks", "Modules, ESM vs CJS", "Streams and backpressure", "Async patterns and error handling", "Workers, clustering, scaling", "HTTP, Express/Fastify internals", "Security and production hardening", "Hard real-world problems", "Interview bank"],
  },
  {
    id: "nest",
    title: "NestJS",
    short: "NestJS",
    emoji: "🐈",
    tagline: "Modules, providers, DI, pipes, guards, interceptors, microservices.",
    status: "coming",
    modules: [],
    planned: ["Architecture: modules, providers, controllers", "Dependency injection in depth", "Request lifecycle: middleware, guards, pipes, interceptors, filters", "Validation, DTOs, config", "TypeORM / Prisma integration", "Auth, roles, sessions, JWT", "Microservices, queues, events", "Testing Nest apps", "Hard real-world problems", "Interview bank"],
  },
];

export function findCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
