import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "course"; course: string }
  | { page: "topic"; course: string; slug: string; step?: number }
  | { page: "hard" }
  | { page: "interview" }
  | { page: "playground" }
  | { page: "cheatsheet" }
  | { page: "project" }
  | { page: "mission"; id: string }
  | { page: "notes" }
  | { page: "quick"; course: string }
  | { page: "chapter"; course: string; moduleId: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { page: "home" };
  if (parts[0] === "hard") return { page: "hard" };
  if (parts[0] === "interview") return { page: "interview" };
  if (parts[0] === "playground") return { page: "playground" };
  if (parts[0] === "cheatsheet") return { page: "cheatsheet" };
  if (parts[0] === "project") return parts[1] ? { page: "mission", id: parts[1] } : { page: "project" };
  if (parts[0] === "notes") return { page: "notes" };
  if (parts.length === 3 && parts[1] === "chapter") return { page: "chapter", course: parts[0], moduleId: parts[2] };
  if (parts[1] === "quick") return { page: "quick", course: parts[0] };
  if (parts.length === 3 && /^\d+$/.test(parts[2])) return { page: "topic", course: parts[0], slug: parts[1], step: Number(parts[2]) };
  if (parts.length === 1) return { page: "course", course: parts[0] };
  return { page: "topic", course: parts[0], slug: parts[1] };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const href = {
  home: () => "#/",
  course: (c: string) => `#/${c}`,
  topic: (c: string, slug: string) => `#/${c}/${slug}`,
  step: (c: string, slug: string, step: number) => `#/${c}/${slug}/${step}`,
  quick: (c: string) => `#/${c}/quick`,
  project: () => "#/project",
  chapter: (c: string, m: string) => `#/${c}/chapter/${m}`,
  mission: (id: string) => `#/project/${id}`,
};
