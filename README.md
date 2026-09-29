# Treblr — Music Career Simulation

Build an artist career one week at a time. Record and release music, grow a catalog, build relationships, tour regional venues, navigate label deals, and compete for charts and awards.

## Requirements

- Node.js **20.19+** or **22.12+** (Node 24 is supported)
- npm

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local development URL. The game stores careers in this browser's local storage; it does not require a database account or environment variables.

## Verify changes

```bash
npm test             # simulation, migration, and save-slot unit tests
npx playwright install chromium  # one-time browser setup for Playwright
npm run test:smoke    # production-preview browser boot/onboarding/social smoke test
npm run build         # production bundle
npm run preview       # serve the built bundle locally
```

The Playwright smoke test builds the production bundle, serves it with `vite preview`, enters a new career, opens the core screens, posts through Chirp compose, and fails on browser JavaScript, console, or HTTP errors. If Chromium is already installed system-wide, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path instead (for example, `/usr/bin/chromium`).

## How to play

1. Choose an artist identity, genre, home city, and career path.
2. Each week grants **3 action points** for recording, training, releases, projects, videos, jobs, team, business, and touring. Social posts use their separate Social Energy budget.
3. Record with a producer, optionally feature collaborators, and release a single or sequence tracks into an EP/album.
4. Pick a release rollout, lead track, and project order. Catalog tracks accumulate weekly/lifetime streams, sales, and video views.
5. Promote specific releases on social platforms, take city-specific opportunities, or book a tour route shaped by local demand and venue capacity.
6. Advance the week to resolve earnings, taxes, jobs, label obligations, rivals, charts, events, awards, and any tour stop.

Career paths have gameplay effects. Lagos and Accra have dedicated Afrobeats scenes, and every home city affects genre demand, collaborator affinity, local events, and tour routing.

## Careers and saves

Treblr is a **single-player, local-first browser game**. Save data stays in the current browser profile. Career saves are versioned and migrated as the game changes. Up to eight career slots are supported; the Profile settings can save, export a JSON backup, import a backup into a new slot, and switch careers. Keep an exported backup if you want to move a career to another browser or device.

## Deploy to Vercel

This is a static Vite single-page application. The repository's `vercel.json` supplies an SPA fallback rewrite; there are no Vercel serverless functions, API routes, database connections, authentication service, or environment variables in the shipped game.

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: **24.x** is the verified Treblr project setting; Node.js 20.19+ or 22.12+ is also compatible with the installed Vite version.

A deployment is not considered verified merely because the local build succeeds. Check the Vercel Production deployment status and then open the public game and complete the start flow.

## Project layout

```text
treblr/
├── src/
│   ├── App.jsx                  # Save-slot picker and career onboarding
│   ├── Game.jsx                 # Game shell, navigation, weekly report, events
│   ├── components/              # Shared controls, reports, error boundary
│   ├── data/                    # Genres, cities, careers, labels, events, artists
│   ├── engine/                  # Weekly simulation, economy, charts, saves, tests
│   └── tabs/                    # Home, Create, Social, Business, Profile
├── tests/e2e/                   # Production-preview Playwright smoke test
├── index.html
├── vite.config.js
├── playwright.config.js
├── package.json
└── vercel.json
```
