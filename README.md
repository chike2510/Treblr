# Treblr — The Weekly Issue

A **global** music career simulator. Write, record and release music, chase 16 charts across 12 countries, grow fans city by city, tour the world and build a legacy — one week at a time. The economy is in USD; cities, genres, rival artists and charts span every continent.

This branch (`rebuild/weekly-issue`) is a ground-up rebuild in React 18 + Vite with a pure, unit-tested simulation engine and the "Weekly Issue" design system (dark, premium, mobile-first, max-width 440px).

## Run locally

```bash
npm install
npm run dev        # Vite dev server
npm test           # vitest: engine + render smoke tests
npm run build      # production bundle in dist/
npm run preview    # serve the built bundle
```

Requires Node 20.19+ or 22.12+. Saves live in the browser's `localStorage` (3 slots); no backend or env vars.

## Project layout

```
src/
  engine/          pure JS simulation (no React)
    rng.js         seeded mulberry32 RNG (state stored in the save)
    data.js        world data: 30 cities, 14 genres, 12 chart markets, 32 rival artists, producers, venues, labels, goals…
    model.js       stream decay curve, discovery vs audience streams, market shares, radio spins, quality projections
    state.js       createNewGame, save/load, versioned migrations (SAVE_VERSION = 2)
    actions.js     every player action as (state, payload) => { state, ok, msg }
    tick.js        advanceWeek: releases, streams, revenue, expenses, rivals, charts, events, awards, offers, news, report
    charts.js      Hot 100, Global Stream, Album, Radio + 12 country charts with movement/peak/weeks
    goals.js       milestones (auto-claimed rewards), Up Next nudges, weekly cost helpers
    engine.test.js vitest suite (tick, charts, actions, save round-trip, v1→v2 migration, 60-week stability)
  ui/kit.jsx       design-system components (Icon, Sheet, CountUp, Cover, Seg, Bar, image upload/downscale)
  ui/render.test.jsx  SSR smoke test of every screen, phone app and World sheet
  screens/         Onboarding, Home, Studio, Phone, Charts, World, Profile, Reveal, Report
  phone/apps.jsx   Streamify, Chirp, Snapshot, Clipz, ViewTube, Inbox, Bank, Calendar, News, Manager, Settings
public/            artist.jpg (default portrait), cover1-3.jpg (sample cover art), favicon.svg
```

## The game

- **Onboarding (6 steps):** names + stage name → home city (searchable, 30 cities) + age → genre + up to 2 subgenres → career path (Bedroom Artist, Viral Overnight, Signed Rookie, Songwriter Turned Star, Industry Plant) → face (upload or default) → press-kit confirm.
- **Home:** Treblr Weekly magazine cover with last week's top story and a full "issue" report, stat strip with week-over-week deltas, energy/social meters, 3 smart Up Next nudges, current era card, goals, 6-week calendar strip, rival watch, headlines, quick actions.
- **Studio:** Write (dice titles, genre, theme, length slider, co-writers with fee + royalty share, live projected quality) → Record (5 producer tiers) → Release (single/EP/album, rollout tiers, cover maker with gradients/sample photos/upload, release date up to 6 weeks out) → Catalog (weekly/lifetime streams, stream history, Gold 10M / Platinum 25M / Diamond 100M certs).
- **Phone:** home screen with widgets, searchable app grid and badges; 11 full-screen apps with a back button and left-edge swipe-back. Social actions use a separate social-energy budget.
- **Charts:** your position chips, pills for all 16 charts, movement (▲▼—NEW), peak, weeks on chart; your rows highlighted.
- **World:** fan-heat map, Jobs, Record Labels, Merch, Brand Deals, Gigs, Tours, Press, Radio, Interviews, Payola (suspicion meter → scandals).
- **Weekly reveal:** after Next Week, the cover scales in with the headline, streams/earnings/fans count up, chart-move cards.

## Deploy

Vercel builds with `npm run build` and serves `dist/`; `vercel.json` rewrites all routes to `index.html` (SPA).
