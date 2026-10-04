# Treblr — Artist Career Simulator

Treblr is a fictional, single-player music-industry career game. Build an artist’s path one week at a time through releases, budget and format choices, collaborations, label terms, publicity, shows, tours, festivals, audience growth and a changing music world.

This rebuild is intentionally a **career simulation, not a DAW**. A session is an abstract opportunity that resolves into a demo; there are no sequencers, beat-making, composition, BPM/key editing or recording-take controls.

## Play

```bash
npm ci
npm run dev
```

Open the Vite URL. No account, API key, database or external music service is required. The career is saved locally in the current browser under the versioned `treblr-career-v1` key.

### Five destinations

- **Home:** artist situation, current release, listener/revenue signal, show desk, next decisions and activity log.
- **Music:** filter, sort and search releases; switch artwork grid/list; open modeled analytics; book abstract sessions; choose Single, EP or Album format; plan a paid campaign with different costs and release horizons.
- **Career:** accept or pass on label, collaboration, radio, one-night show, three-city tour, festival and rotating in-game publicity offers. Costs, dates, rewards and risks are shown before commitment.
- **World:** deterministic weekly chart/rival movement, fictional news and listener response, plus Lagos, Accra, Atlanta, London and Toronto scene signals.
- **You:** artist press profile, generated fictional portrait, team, evolving relationships, achievements and locally saved notification preferences.

Closing a week settles modeled streams, master income and performances; updates fans, listeners, reputation, energy and rank; advances releases and future booking dates; changes the World; and can place a new offer in the inbox. All artists, venues, labels, news, audience figures and payouts are fictional simulation data, not real-market promises.

## Verify

```bash
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:smoke
```

The Playwright suite launches a production preview on `127.0.0.1:4174`. To save its real browser screenshots under `test-results/`:

```bash
CAPTURE_ARTIFACTS=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:smoke
```

## Art and fonts

The original release covers and fictional Mira Ayo portrait were generated for this prototype. The editorial live-performance photo, locally hosted Barlow Condensed/DM Sans fonts, licenses and attribution are documented in [`public/assets/treblr/ASSET-CREDITS.md`](public/assets/treblr/ASSET-CREDITS.md).

## Project layout

```text
src/treblr/App.jsx          React screens and interactions
src/treblr/game.js          deterministic local simulation and save model
src/treblr/game.css         Treblr visual system and responsive layout
src/treblr/game.test.js     simulation tests
tests/e2e/                  Playwright browser flows
public/assets/treblr/       artwork, licensed photo, local fonts and credits
```
