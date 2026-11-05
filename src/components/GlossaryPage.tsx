import { useState } from "react";
import { GLOSSARY } from "../path/glossary";
import { findLesson, lessonLabel } from "../path";
import { href } from "../lib/route";

export default function GlossaryPage() {
  const [q, setQ] = useState("");
  const terms = [...GLOSSARY].sort((a, b) => a.label.localeCompare(b.label)).filter((t) => !q || t.label.toLowerCase().includes(q.toLowerCase()) || t.plain.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="content">
      <h1>Glossary</h1>
      <p className="muted">Every technical word in the path, in plain words, with the lesson that teaches it. When a word appears before its lesson, the same explanation is shown right under the paragraph.</p>
      <input className="search" placeholder="Search a word…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="glossary">
        {terms.map((t) => {
          const l = findLesson(t.taughtIn);
          return (
            <div className="card soft term" key={t.id}>
              <b>{t.label}</b>
              <p>{t.plain}</p>
              {l && (
                <a className="small" href={href.lesson(l.slug)}>
                  taught in {lessonLabel(l)} {l.title} {l.body ? "" : "(coming)"}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
