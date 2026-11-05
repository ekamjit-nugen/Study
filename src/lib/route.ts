import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "stage"; id: string }
  | { page: "module"; id: string }
  | { page: "lesson"; slug: string }
  | { page: "project"; stageId: string }
  | { page: "glossary" }
  | { page: "revision" }
  | { page: "notes" };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return { page: "home" };
  if (parts[0] === "stage" && parts[1]) return { page: "stage", id: parts[1] };
  if (parts[0] === "module" && parts[1]) return { page: "module", id: parts[1] };
  if (parts[0] === "lesson" && parts[1]) return { page: "lesson", slug: parts[1] };
  if (parts[0] === "project" && parts[1]) return { page: "project", stageId: parts[1] };
  if (parts[0] === "glossary") return { page: "glossary" };
  if (parts[0] === "revision") return { page: "revision" };
  if (parts[0] === "notes") return { page: "notes" };
  return { page: "home" };
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
  stage: (id: string) => `#/stage/${id}`,
  module: (id: string) => `#/module/${id}`,
  lesson: (slug: string) => `#/lesson/${slug}`,
  project: (stageId: string) => `#/project/${stageId}`,
  glossary: () => "#/glossary",
  revision: () => "#/revision",
  notes: () => "#/notes",
};
