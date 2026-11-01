# Treblr career system mockups

Static HTML mockups updated to use a linked subpage experience. See `index.html` for the clickable overview and all page links. Independence remains the Labels default, and distribution deals or founding an imprint are optional later actions.


Static HTML mockups updated with navigable subpages for all seven career systems. `index.html` is the index, and the existing feature overview files now include local subpage links. Labels stays independent by default; distribution and player-owned label operations are optional ongoing actions.

## Repository inspection and visual source of truth

- Read the local Treblr React app's `src/App.jsx`, `src/screens/World.jsx`, `src/screens/Home.jsx`, `src/screens/Studio.jsx`, `src/screens/Charts.jsx`, `src/screens/Phone.jsx`, `src/ui/kit.jsx`, and `src/styles.css`. The local repo was inspected directly; no code in it was edited.
- `src/App.jsx` defines the primary navigation order and actual labels: Home, Studio, Phone, Charts, World. In-game top bar uses artist avatar, `WEEK` + week number/date, notification, energy, cash, and `Next Week`; the World tab is highlighted while a World feature page is open.
- `src/screens/World.jsx` defines a `screen world-feature` view with breadcrumb `World / {item.name}`, matching page title, context line `Week {n} · {stageName} · {cash} · {energy} energy`, a horizontal `Career systems` pill selector, and a `Back to World` close button. Its actual selector labels/order are Tours, Labels & Distribution, Lifestyle, Acting, Merch, Festivals, Awards, Training. The seven previews retain the actual eight-item selector, including Training, with the relevant feature active; standalone links for the requested seven pages are in the separate index.
- `src/styles.css` and `src/ui/kit.jsx` define actual tokens: app max-width 440px; background `#0b0b0f`, surface `#15151b`, raised `#1e1e26`, text `#f5f5f7`, muted `#9a9aa5`; accents Home lime `#c6ff3d`, Studio coral `#ff6b4a`, Phone indigo `#6c7bff`, Charts amber `#ffb020`, World teal `#2dd4bf`. Display/head/numeral font is Space Grotesk, body is Inter, and mono labels use JetBrains Mono, with system fallbacks.
- Real visual patterns followed: 440px app viewport without decorative handset bezel; 64px topbar, 76px bottom nav, scrollable middle screen; 40px round avatar; compact stat chips; active bottom tab expands with label; 38px horizontal pills; 20px cards with 16px padding; 44px rounded action buttons; 26px section rhythm; short mono uppercase labels; teal World feature accent, lime primary/selection, amber caution, red negative state. Content remains phone-dense and vertically scrollable. Static chrome uses the actual topbar labels and primary tab order. Icons are approximated as text glyphs, not copied SVGs; examples are illustrative rather than tied to a live save.
- Every page continues to use its original detailed feature content and illustrative design data. Content functionality and engine mappings below are preserved. Values stay explicitly illustrative, controls inert. No app-code changes and no git commit/push. ## Scope and verification
The deliverable is a static HTML design study. All values and outcomes are illustrative, all controls inert, and no app code was edited. The mockup HTML parser/link check found no missing local links or unbalanced tags across the 31 pages. App tests/build were not run because dependencies are absent in the checkout.

## Screen-to-existing-view correspondence

- `touring.html`: actual `src/screens/World.jsx` feature route `tours`, label “Tours”, and World feature header, system pills, topbar, tabs; structure remains route/status, stop list, setlist, crew, booking decision, and tour log.
- `labels.html`: `World.jsx` full-page route `labels`, component “Labels & Distribution”, with matching breadcrumb/title/context and selector label. The static page shows three separate choices (stay independent, sign a distribution deal, or create and run a player-owned label with artist signings) plus label identity, finances, scouting, contract terms, roster, releases and performance. Player-owned label features are a design concept, not a claim that the current engine supports them.
- `lifestyle.html`: `World.jsx` full-page route `lifestyle`, component “Lifestyle”, with matching breadcrumb/title/context and selector label; cash/assets/upkeep/rental/catalog sections retained.
- `acting.html`: `World.jsx` full-page route `acting`, component “Acting”, with matching breadcrumb/title/context and selector label; acting-skill, role, audition, shoot, credits retained.
- `merch.html`: `World.jsx` full-page route `merch`, component “Merch”, with matching breadcrumb/title/context and selector label; active drop, break-even, production choices and history retained.
- `festivals.html`: `World.jsx` full-page route `festivals`, component “Festivals”, with matching breadcrumb/title/context and selector label; pitch windows, lineup, tier and history retained.
- `awards.html`: `World.jsx` full-page route `awards`, component “Awards”, with matching breadcrumb/title/context and selector label; submission, nomination, ceremony choices and history retained.
- `index.html`: matches the same 440px dark app canvas, Treblr typography, cards, tokens and density as the actual World feature shell; links all seven standalone previews and notes.

## Page-to-engine map

### Touring (`touring.html`)
- Existing hooks/data: `planTour`, `cancelTour`, `tourQuote`, `setlistScore`, `tourStaffCost`, `gigDemand`, `gigFatigue`, `VENUES`, `CITIES`, `TOUR_STAFF`, `state.tour`, released songs and `fanHeat`.
- UI connections: selected route order to cityIds, per-week pace, venueId, setlist IDs, crew IDs and tour name. Quote block reflects production cost, weekly crew wages, energy reserve and projected artist cut. Active tour panel renders stop week, sold/capacity, gross, sell-outs and show quality. Keep weekly result and cancellation feedback in tour history/timeline.
- Preserve mechanic constraints: booking requires at least 3 stops; route supports up to 12; energy reserve and production/cash checks apply; tours resolve week by week; setlist score uses average quality, performance skill, hit inclusion, opener/closer and venue-appropriate length; crew has specific quality/logistics/crowd/merch effects.

### Labels (`labels.html`)
- Existing engine path (NPC deal + distribution only): `LABELS`, `labelTerms`, `requestLabelMeeting`, `buyoutCost`, `signLabel`, `leaveLabel`, `DISTRIBUTORS`, `setDistributor`, `CREATIVE_CONTROL`, `state.player.label`, `state.inbox`, `state.distributor`. These are the current artist-career mechanics, not player-owned label operations.
- Career routes are ongoing actions, not a one-time or mutually exclusive selection. The artist career starts independent; distribution deals can apply to selected releases or catalog, and a player-owned imprint can be founded separately to scout, sign and manage other artists. Keep the player's artist career independent alongside label ownership, and allow distribution partnerships for eligible releases. Deal terms and release rights constrain which catalog/releases can be partnered.
- Player-owned label concept flow: found and name imprint, set brand identity/base city/genre focus, allocate starting capital and reserve; scout artists by genre, city, momentum, catalog and audience fit; negotiate artist-specific advance, royalty, term/deliverables and master ownership; track recoupment, roster obligations, release schedule, campaign spend, streams/revenue, playlist adds, audience growth and label cash/runway.
- Implementation is not present in the current engine. Owner finances, artist prospect market, contracts, roster, release accounting and weekly results shown here are an illustrative management-sim concept, not existing state, working controls, or actual game data. Any future implementation should resolve income, advances, royalties and release performance inside the existing single weekly tick, initialize safe defaults for old saves, and keep NPC signing/distribution logic intact.

### Lifestyle (`lifestyle.html`)
- Existing hooks/data: `LIFESTYLE`, `buyLifestyle`, `sellLifestyle`, `moveOutRental`, `lifestyleUpkeep`, `assetsValue`, `state.lifestyle.owned`, `state.lifestyle.rental`, `player.cash`.
- UI connections: separate liquid cash, total owned asset value, recurring weekly upkeep/rent and item-level purchase/current value. Show rental move-in/out; asset sell action; category catalog; prestige and item description; dated transaction and weekly upkeep history where the state/log supports it.
- Preserve item mechanics: rentals add weekly rent; homes replace rent; assets have different upkeep, appreciation/depreciation and prestige; home studio provides a production-skill boost; private jet halves tour travel costs. The UI should not present prestige as guaranteed audience approval.

### Acting (`acting.html`)
- Existing hooks/data: `ACTING_ROLES`, `audition`, `auditionOdds`, `state.acting.current`, `state.acting.credits`, `player.skills.acting`, popularity, energy.
- UI connections: role-by-role popularity and acting-skill gates; odds from `auditionOdds`; audition cost and one-per-week gate; current project's filmed/shootWeeks/releaseWeek progress; credit list with role, verdict, score and fans.
- Preserve timing: audition costs 10 energy; current filming reserves 20 energy each week; role pay/fame and premiere effects resolve with the project. Do not promise a role or add an interactive shoot mini-game absent from engine.

### Merch (`merch.html`)
- Existing hooks/data: `MERCH_TIERS`, `dropMerch`, `state.merch`, fans, hype, `TOUR_STAFF` merch crew.
- UI connections: active/inactive/closed drop status; tier, stock, units sold, revenue, unit price, launched/sold-out week; estimated weekly demand and unit economics; next production decision disabled while active; historical drops from actual history if retained.
- Confirmed formula in UI code: expected weekly sales estimate is `min(units, round(fans * 0.004 + hype * 2))`; tier has production cost, units and price; displayed break-even is `ceil(cost / price)`. Sales resolve in the weekly tick and active drop locks production until it sells out. Concert merch crew sales are described in `TOUR_STAFF` as approximately $6 per ticket sold.

### Festivals (`festivals.html`)
- Existing hooks/data: `FESTIVALS`, `FEST_SIZE`, `festivalCalendar`, `pitchFestival`, `festivalLineup`, `festSlotFor`, `formatWeekDate`, state festival records, `fanHeat`.
- UI connections: city/date/week/size/genre fit; pitch-open/used/lineup-announced/accepted/played states; likely slot; five social energy pitch cost; lineup poster by headliner/sub/undercard with generated rivals; played crowd and fee history.
- Preserve pipeline: pitch window 7–16 weeks ahead, lineup announced 6 weeks before event; festival base crowd and slot counts/fees differ by major vs mega. Do not show acceptance probability unless an exposed calculation exists.

### Awards (`awards.html`)
- Existing hooks/data: `AWARD_SHOWS`, `awardCalendar`, `confirmAwardEntries`, `awardOptions`, `state.awardSubmission`, `state.awardEvent`, `state.awardHistory`, `attendAwardShow`, `skipAwardShow`, `giveSpeech`, `OUTFITS`, `SPEECHES`.
- UI connections: show calendar and entry window; eligible song/project options and team-suggested categories; explicit confirmation; nomination event and rival nominees; ceremony outfit/performance/skip choices; speech on win; career history with entries and outcome.
- Preserve phases: submissions open two weeks before a show; nominations derive from selected/eligible entries; ceremony is later; no entry and snub are distinct results; performance costs 25 energy; speeches/outfits affect hype/press/risk according to current engine. Never treat entry as nomination or nomination as win.

## Design assumptions

1. The global weekly top bar and five primary tabs stay part of the existing app shell; each career system stays a dedicated full-height World screen, not a modal or quick-action sheet.
2. Teal remains the World/live-system accent; lime marks primary action/current selection; amber flags a financial or schedule risk; red only marks negative result/cancel paths. These are extensions of the observed design tokens, not a new game identity.
3. Pages use a single illustrative artist/save state so panels read as real game screens. All example money, popularity, odds, counts, event names/history and outcomes are placeholders unless the notes identify a value directly from engine constants/formula. No mockup implies a live save was read.
4. Static controls are non-functional; they demonstrate layout and decision flow, not a prototype backed by game state.
5. Any data not retained in engine state (for example transaction history or detailed tour per-stop expenses) should be derived from existing logs when possible or omitted, not fabricated by the eventual implementation.
