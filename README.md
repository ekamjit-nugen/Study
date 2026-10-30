# Full-Stack Mastery

A visual, topic-wise course app that makes the hardest full-stack interview questions easy.
**Databases** is complete; React, Next.js, Node and NestJS follow the same format.

Every topic has: a story, an "In 30 seconds" summary, new words, diagrams (many interactive),
runnable SQL (a real SQLite database in the browser via sql.js), a hard real-world problem
solved step by step, practice with auto-checked answers, interview questions with spoken answers,
and a "Remember" list.

## What is in it

- **Lessons** (`#/db/<slug>`): a step-by-step player, one idea per screen. Each idea opens with an everyday analogy and a "why you care" line, then a picture, then something to run. Quick checks, real problems, practice with hints and auto-checked answers, interview questions (240, 88 tricky).
- **Build the shop** (`#/project`): 20 missions on the learner's own database, checked automatically.
- Tools: hard problems, interview bank, SQL playground, cheat sheet.

## Run

```bash
nvm use 20
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173 (or the port Vite prints)
npm test             # runs every SQL example against sql.js in Node
npm run build        # type-check + production build (static, any host)
```

## Use it offline on your phone

The app is a Progressive Web App: everything, including the SQLite engine (WebAssembly), is cached on the device by a service worker, and all progress (lessons, quizzes, the project database) lives in the browser's local storage. Nothing talks to a server after the first load.

1. Put the built site on any HTTPS static host. Easiest: push this folder to GitHub and enable **Settings → Pages → Source: GitHub Actions**; the included workflow (`.github/workflows/deploy.yml`) builds, tests and publishes on every push to `main`. Netlify or Vercel also work with the default settings (`npm run build`, publish `dist`).
2. Open the site on the phone once while online.
3. **Android (Chrome):** menu ⋮ → *Add to Home screen* / *Install app*. **iPhone (Safari):** Share → *Add to Home Screen*.
4. Launch it from the home screen. It opens full screen and works with no connection. New versions download silently next time you are online.

To try it on your phone from your laptop without deploying, run `npm run build && npm run preview -- --host` and open the printed network URL on the phone (on the same Wi-Fi). The pages load, but offline installation needs HTTPS, so use a real host for that.

### A store app instead?

If you want it in the Play Store or App Store, wrap the same build with [Capacitor](https://capacitorjs.com): `npm i @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add android` / `ios`, point `webDir` to `dist`, and `npx cap open android`. The app and its SQL engine run identically inside the native shell.

## Layout

- `src/courses/types.ts` — the course/topic schema (plain data).
- `src/courses/db/` — the Databases course: `seed.ts` (playground data), `m01`–`m07` (modules), `sql.test.ts`.
- `src/courses/registry.ts` — all courses; add a new course folder and register it here.
- `src/components/Diagrams.tsx` + `Interactive.tsx` — SVG diagrams and simulators keyed by `DiagramId`.
- `src/components/SqlRunner.tsx` — the in-browser SQL box (Run, Show plan, Check my answer, Reset data).
- `src/lib/sqlCore.ts` / `sqlBrowser.ts` — sql.js helpers (pure) and the browser lifecycle.

## Adding a topic

Add a `Topic` object to a module file. Keep sentences short, define jargon in `words`, give every
section an example, include at least one real-world problem and practice items with a `sql`
solution so "Check my answer" works. `npm test` verifies every SQL snippet runs on the seed data.
