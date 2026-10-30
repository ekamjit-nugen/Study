import { useLocal } from "./useLocal";

type Progress = { done: string[] };

/** Topic ids look like "db/joins". */
export function useProgress() {
  const [p, setP] = useLocal<Progress>("fsm-progress-v1", { done: [] });
  const isDone = (id: string) => p.done.includes(id);
  const toggle = (id: string) =>
    setP((prev) => ({ done: prev.done.includes(id) ? prev.done.filter((d) => d !== id) : [...prev.done, id] }));
  return { done: p.done, isDone, toggle };
}
