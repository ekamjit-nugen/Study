# AI Engineer Path

The complete AI and AI-engineering learning path as an app: **10 stages, 50 modules, 608 lessons, one concept per lesson**, from what AI is to production systems, agents, MCP, multilingual models and a Punjabi assistant.

Every lesson has the same learner-friendly shape: the concept from first principles, why it exists, how it works step by step, a visual, an everyday example, a real engineering example, a creative example when it helps, the maths with numbers worked through, code read line by line, where it is used, key takeaways, new words, and one question to think about. Every technical word is explained before it is used. Quizzes and exercises sit at the end of each module; a project ends each stage.

## What is in it

- **Lessons** (`#/lesson/<slug>`): the eleven parts above, with a part navigator, line-by-line or direct code reading, and words taught later explained under the paragraph that uses them.
- **Modules** (`#/module/m07`): the lesson list, a module quiz with saved results (pass mark 70%), and exercises with hints and solutions.
- **Stages** (`#/stage/s03`) and **stage projects** (`#/project/s03`): objectives, module progress, and a project with steps, deliverable and done-checks.
- **Progress**, tracked separately: stages, modules, lessons, exercises, projects, revision flags and quiz results. Reading never marks a lesson complete; you do, when you could explain it to someone.
- **Glossary** (`#/glossary`), **Revision and results** (`#/revision`), **Notes** (press and hold any line).

## Layout

- `src/path/map.ts`: the full map (stages, modules, every concept, projects).
- `src/path/content/mNN.ts`: one file per module with lesson bodies, quiz and exercises; `scripts/slugs.ts` prints a module's exact lesson slugs.
- `src/path/glossary.ts`: every technical word with the lesson that teaches it.
- `src/path/path.test.ts`: checks the map, every lesson's shape, code line readings, quiz shape and glossary links.

## Run

```bash
nvm use 20
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173 (or the port Vite prints)
npm test             # map, lesson shape, quiz and glossary checks
npm run build        # type-check + production build (static, any host)
```

## Use it offline on your phone

The app is a Progressive Web App: everything is cached on the device by a service worker, and all progress lives in the browser's local storage. Nothing talks to a server after the first load.

1. Put the built site on any HTTPS static host. Easiest: push this folder to GitHub and enable **Settings → Pages → Source: GitHub Actions**; the included workflow (`.github/workflows/deploy.yml`) tests, builds and publishes on every push to `main`.
2. Open the site on the phone once while online.
3. **Android (Chrome):** menu ⋮ → *Add to Home screen* / *Install app*. **iPhone (Safari):** Share → *Add to Home Screen*.
4. Launch it from the home screen. It works with no connection; new versions download silently next time you are online.
