import { useMemo } from "react";
import { DB_COURSE } from "../courses/db/index";
import { termsBeforeTaught, topicOrder, type Term } from "../courses/db/glossary";
import { inline } from "../lib/md";
import { href } from "../lib/route";

let orderCache: Map<string, number> | null = null;
function order(): Map<string, number> {
  if (!orderCache) orderCache = topicOrder(DB_COURSE.modules.flatMap((m) => m.topics.map((t) => t.slug)));
  return orderCache;
}
const titleBySlug = new Map(DB_COURSE.modules.flatMap((m, mi) => m.topics.map((t, ti) => [t.slug, `${mi + 1}.${ti + 1} ${t.title}`] as const)));

/** Terms that `texts` use before the course teaches them. */
export function termsFor(texts: (string | undefined)[], slug: string): Term[] {
  return termsBeforeTaught(texts, slug, order());
}

/**
 * "Words used here, explained first": every SQL construct or database term on this page that the course
 * only teaches in a later topic, with a plain explanation, shown BEFORE the content that uses it.
 */
export default function TermHelp({ texts, slug, compact }: { texts: (string | undefined)[]; slug: string; compact?: boolean }) {
  const terms = useMemo(() => termsFor(texts, slug), [texts, slug]);
  if (!terms.length) return null;
  return (
    <div className={`termhelp ${compact ? "compact" : ""}`}>
      <div className="termhelp-title">
        📖 {terms.length === 1 ? "A word used here, explained first" : `${terms.length} words used here, explained first`}
      </div>
      <ul>
        {terms.map((t) => {
          const where = titleBySlug.get(t.taughtIn);
          return (
            <li key={t.id}>
              <b>{t.label}</b> <span className="termhelp-dash">·</span> {inline(t.plain)}
              {where && (
                <>
                  {" "}
                  <a className="termhelp-link" href={href.topic("db", t.taughtIn)}>
                    full lesson: {where}
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
