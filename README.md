# Treblr — Global Music Career

Treblr is a touch-first, local-first music-career game set across five connected markets. It is not a music-production app: the team prepares projects off-screen, while the player makes the consequential career decisions—when to release, which campaign to fund, where to play, who to answer, and which contract terms to accept.

## The seven desks

- **Home:** follow the current career chapter, work toward a specific milestone, review the week’s activity, and see how the name is carrying across the route.
- **Music:** make the release-timing and campaign decision for a team-delivered project. Saved local cover art follows the release through its catalogue history; listener counts and milestones are simulated career events.
- **Studio:** book abstract project development (the team prepares a release candidate off-screen), rehearse for live work, take career coaching, or spend an action on recovery. There are no track-authoring, beat-making, sequencer, or recording-take controls.
- **Contracts:** book local gigs and away-market tour stops, track familiarity and fan growth, accept eligible festival invitations, take paid calls, and weigh fictional label advances against future royalty shares.
- **Social:** choose from in-game publicity moments. Each choice models reach, fans, reputation, and a relationship effect; nothing is posted to an external service.
- **Discover:** answer press opportunities, see calls unlock as career rank rises, follow global-market progress, and review earned awards and a career activity file.
- **Settings:** rename the artist, export or import a versioned career backup, or reset the current local career.

The five available markets are **Lagos, Atlanta, London, Accra, and Toronto**. They form one global circuit. Local gigs and away-market tour stops build familiarity; travel has a visible game-credit cost, while energy and health influence show outcomes and weekly recovery.

## Weekly play

Each week gives the player three career actions and three separate publicity choices. A project-development booking returns a release-ready candidate with modeled quality from career skills and collaborator trust; the player chooses whether to release it and whether to pay for a wider campaign. Gigs, tour stops, festivals, label terms, paid calls, press interviews, social moments, rehearsal, coaching, and recovery compete for time, cash, energy, buzz, and relationship gains.

Career choices earn **career XP**. Rank thresholds unlock actual opportunities such as a local radio conversation and larger press or label calls; weekly settlements carry XP, audience, cash, health, and team trust into the next week. Awards are earned from real in-game milestones such as a first release, a stronger home crowd, a festival debut, or completing the five-city circuit. Closing the week settles modeled listeners and royalty-adjusted income, restores action budgets, recovers energy and health, and exposes rank-ups in a week report. The local save preserves these systems; earlier v2 saves are upgraded from their recorded history rather than reset.

## Fictional simulation and local saves

Social reach, venues, label contracts, listener counts, and credits are in-game models only. The app does not connect to external platforms, accounts, labels, or analytics and does not publish content. Game credits are not real money.

Career data is stored locally under a new, versioned save key. The prior rebuild save is left untouched and is not loaded into this career model. Settings can export a JSON backup, import a compatible backup, or reset only the current local career.

## Run locally

Requirements: Node.js **20.19+** (or 22.12+) and npm.

```bash
npm ci
npm run dev
```

Vite prints the development URL. To build and preview the static production app:

```bash
npm run build
npm run preview
```

## Validate changes

```bash
npm test             # career engine and local-save tests
npm run build         # production bundle
npm run test:smoke    # production-preview Playwright browser suite
```

The Playwright suite checks a real release → show → rank unlock → press call → settlement → next-week progression flow, all seven tabs, all five markets, save export, locally bundled artwork, and responsive play at **320×800**, **390×844**, **430×900**, and **1440×960**. Screenshots include the clean 390×844 viewport at `screenshots/treblr-home-viewport.png`, full-page `screenshots/treblr-home-mobile.png`, the 320px render at `screenshots/treblr-home-narrow.png`, the artwork-backed catalogue at `screenshots/treblr-release-mobile.png`, the progression state at `screenshots/treblr-progression-mobile.png`, and the Studio, Contracts and desktop screens.

## Source layout

```text
treblr/
├── src/
│   ├── App.jsx
│   ├── rebuild/
│   │   ├── GlobalCareerGame.jsx  # Seven-tab touch-first career game
│   │   ├── gameData.js           # Markets, weekly choices, contracts, and content
│   │   ├── gameEngine.js         # Local career progression and weekly settlement
│   │   ├── gameEngine.test.js    # Career and save tests
│   │   ├── saveStore.js          # Versioned local save and JSON transfer
│   │   └── styles.css            # Responsive mobile-first game UI
│   └── main.jsx
├── tests/e2e/                    # Responsive Playwright gameplay tests
├── screenshots/                  # Verified app screenshots
├── index.html
├── vite.config.js
├── playwright.config.js
└── package.json
```
