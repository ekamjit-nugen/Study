// Small learner-progress helpers: last topic, daily streak, text size.
import { useEffect } from "react";
import { useLocal } from "./useLocal";

export type LastTopic = { course: string; slug: string; title: string };

export function useLastTopic() {
  return useLocal<LastTopic | null>("fsm-last-topic", null);
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Records today as a study day and returns the current consecutive-day streak. */
export function useStreak(): number {
  const [days, setDays] = useLocal<string[]>("fsm-days", []);
  const t = today();
  useEffect(() => {
    if (!days.includes(t)) setDays([...days, t].slice(-400));
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = new Set(days.includes(t) ? days : [...days, t]);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!set.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function useTextSize(): [number, (n: number) => void] {
  const [size, setSize] = useLocal<number>("fsm-font", 16);
  useEffect(() => {
    document.documentElement.style.fontSize = size + "px";
  }, [size]);
  return [size, (n: number) => setSize(Math.max(14, Math.min(22, n)))];
}
