import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "course"; course: string }
  | { page: "topic"; course: string; slug: string }
  | { page: "hard" }
  | { page: "interview" }
  | { page: "playground" }
  | { page: "cheatsheet" }
  | { page: "project" }
  | { page: "mission"; id: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { page: "home" };
  if (parts[0] === "hard") return { page: "hard" };
  if (parts[0] === "interview") return { page: "interview" };
  if (parts[0] === "playground") return { page: "playground" };
  if (parts[0] === "cheatsheet") return { page: "cheatsheet" };
  if (parts[0] === "project") return parts[1] ? { page: "mission", id: parts[1] } : { page: "project" };
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
  project: () => "#/project",
  mission: (id: string) => `#/project/${id}`,
};
