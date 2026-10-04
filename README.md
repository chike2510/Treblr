# Treblr — Global Music Career

Treblr is a touch-first, local-first game about building an artist’s career across five connected music markets. The player’s weekly decisions—not a music-making interface—drive the experience: spend limited career actions, decide when to release a project, choose gigs and deals, build an audience, manage energy and health, and keep relationships moving.

## The seven desks

- **Home:** see the current week and choose the next move from action-first career prompts.
- **Music:** decide when a studio project becomes a release and select its independent, press, or visual campaign. Listener counts and release milestones are simulated career events; players do not compose individual tracks.
- **Studio:** book a songwriting session to develop a release-ready project, rehearse for live work, take career coaching, or spend an action on recovery. Sessions improve skills and affect energy; collaborators and relationships matter.
- **Contracts:** book local gigs and away-market tour stops, track familiarity and fan growth, accept eligible festival invitations, take paid calls, and weigh fictional label advances against future royalty shares.
- **Social:** choose from in-game publicity moments. Each choice models reach, fans, reputation, and a relationship effect; nothing is posted to an external service.
- **Discover:** take press opportunities, follow global-market progress, and review career milestones and recent events.
- **Settings:** rename the artist, export or import a versioned career backup, or reset the current local career.

The five available markets are **Lagos, Atlanta, London, Accra, and Toronto**. They form one global circuit. Local gigs and away-market tour stops build familiarity; travel has a visible game-credit cost, while energy and health influence show outcomes and weekly recovery.

## Weekly play

Each week gives the player three career actions and three separate publicity choices. A songwriting session develops a release candidate with modeled quality from career skills and collaborator trust. The player then chooses whether to release it and which campaign to fund. Other actions include local gigs, tour stops, festivals, label contracts, paid calls, press interviews, live rehearsal, coaching, and recovery. The tour log records every show played away from the artist’s home market.

Closing the week settles modeled listeners and music income, adds fans and reputation, restores action budgets and energy, and recovers health. Low energy can carry a health cost; taking recovery time and keeping a constructive relationship with the manager can improve the next week. The local save contains market familiarity, project/release status, skills, resources, label terms, relationships, and the career log.

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

The Playwright suite checks the weekly career loop, all seven tabs, all five markets, release and gig progression, save export, and responsive play at **320×800**, **390×844**, **430×900**, and desktop widths. Screenshots are written to `screenshots/treblr-mobile.png`, `screenshots/treblr-studio-mobile.png`, `screenshots/treblr-contracts-mobile.png`, `screenshots/treblr-desktop.png`, and `screenshots/treblr-studio-desktop.png`.

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
