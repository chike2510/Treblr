// Static data for the 2026-10-27 systems: certifications, labels, distributors, lifestyle, acting,
// festivals, tour crew, genre promo, rollout steps, payola packages and the (placeholder) store.
// Every company, festival and brand name here is fictional. Treblr is global: lists span the world.

// ---------- Certifications ----------
// Songs certify on lifetime streams; albums/EPs on units (2,500 streams = 1 unit, plus sales).
export const STREAMS_PER_UNIT = 2500;
const PLAT = (base, name) => Array.from({ length: 8 }, (_, i) => ({ id: `platinum${i + 2}`, name: `${i + 2}× Platinum`, min: base * (i + 2), short: `${i + 2}×P` })).concat([]).map((x) => ({ ...x, kind: name }));
export const SONG_CERTS = [
  { id: 'gold', name: 'Gold', min: 75_000_000, short: 'G' },
  { id: 'platinum', name: 'Platinum', min: 150_000_000, short: 'P' },
  ...PLAT(150_000_000, 'song'),
  { id: 'diamond', name: 'Diamond', min: 3_000_000_000, short: 'D' },
];
export const ALBUM_CERTS = [
  { id: 'gold', name: 'Gold', min: 500_000, short: 'G' },
  { id: 'platinum', name: 'Platinum', min: 1_000_000, short: 'P' },
  ...PLAT(1_000_000, 'album'),
  { id: 'diamond', name: 'Diamond', min: 10_000_000, short: 'D' },
];
// Highest certification reached for a value on a ladder (or null).
export function certFor(value, ladder = SONG_CERTS) {
  let best = null;
  for (const c of ladder) if (value >= c.min) best = c;
  return best;
}
export function certRank(id, ladder = SONG_CERTS) {
  return id ? ladder.findIndex((c) => c.id === id) : -1;
}
export function certName(id, ladder = SONG_CERTS) {
  return ladder.find((c) => c.id === id)?.name || '';
}
export function nextCert(value, ladder = SONG_CERTS) {
  return ladder.find((c) => value < c.min) || null;
}

// ---------- Fame tiers (rolling popularity + accomplishments + time) ----------
export const FAME_TIERS = [
  { id: 'unknown', name: 'Unknown', pop: 0, points: 0, weeks: 0 },
  { id: 'local', name: 'Local act', pop: 18, points: 0, weeks: 0 },
  { id: 'buzzing', name: 'Buzzing', pop: 35, points: 5, weeks: 0 },
  { id: 'established', name: 'Established', pop: 50, points: 60, weeks: 40 },
  { id: 'star', name: 'Star', pop: 62, points: 260, weeks: 90 },
  { id: 'superstar', name: 'Superstar', pop: 72, points: 800, weeks: 150 },
  { id: 'icon', name: 'Icon', pop: 80, points: 2400, weeks: 260 },
];

// ---------- Labels: majors, their subsidiaries and indies across regions ----------
// advance = base advance for a 1-album deal; royalty = artist share of streaming income.
// strict: 0..1 (delivery schedule enforcement & penalties). reach: radio/playlist multiplier.
export const LABELS = [
  // Indies
  { id: 'basement', name: 'Basement Tapes', tier: 'Indie', city: 'tor', genres: [], minPop: 15, advance: 12500, royalty: 0.6, strict: 0.1, reach: 1.15 },
  { id: 'northbound', name: 'Northbound Records', tier: 'Indie', city: 'man', genres: ['indie', 'rock', 'alternative', 'electronic'], minPop: 22, advance: 37500, royalty: 0.5, strict: 0.2, reach: 1.25 },
  { id: 'halcyon', name: 'Halcyon House', tier: 'Indie', city: 'lon', genres: ['pop', 'indie', 'rnb', 'alternative'], minPop: 24, advance: 45000, royalty: 0.5, strict: 0.2, reach: 1.25 },
  { id: 'concrete', name: 'Concrete Bloom', tier: 'Indie', city: 'ber', genres: ['electronic', 'alternative', 'metal'], minPop: 20, advance: 30000, royalty: 0.55, strict: 0.15, reach: 1.2 },
  { id: 'kitsune', name: 'Kitsune Lane', tier: 'Indie', city: 'tyo', genres: ['pop', 'rock', 'jazz', 'electronic'], minPop: 22, advance: 40000, royalty: 0.5, strict: 0.25, reach: 1.2 },
  { id: 'seoulstatic', name: 'Seoul Static', tier: 'Indie', city: 'sel', genres: ['kpop', 'rnb', 'hiphop'], minPop: 22, advance: 40000, royalty: 0.45, strict: 0.45, reach: 1.25 },
  { id: 'marigold', name: 'Marigold Sound', tier: 'Indie', city: 'bom', genres: ['pop', 'electronic', 'hiphop'], minPop: 20, advance: 25000, royalty: 0.55, strict: 0.2, reach: 1.2 },
  { id: 'lumen', name: 'Lumen Norte', tier: 'Indie', city: 'mex', genres: ['latin', 'reggaeton', 'rock'], minPop: 22, advance: 35000, royalty: 0.5, strict: 0.2, reach: 1.25 },
  { id: 'valeverde', name: 'Vale Verde', tier: 'Indie', city: 'sao', genres: ['latin', 'electronic', 'pop'], minPop: 20, advance: 30000, royalty: 0.55, strict: 0.15, reach: 1.2 },
  { id: 'goldcoast', name: 'Gold Coast Music', tier: 'Indie', city: 'acc', genres: ['afrobeats', 'hiphop', 'rnb'], minPop: 20, advance: 30000, royalty: 0.55, strict: 0.2, reach: 1.2 },
  { id: 'harbour', name: 'Harbour Lights', tier: 'Indie', city: 'syd', genres: ['indie', 'pop', 'rock', 'electronic'], minPop: 22, advance: 35000, royalty: 0.5, strict: 0.15, reach: 1.2 },
  { id: 'oxbow', name: 'Oxbow Records', tier: 'Indie', city: 'nash', genres: ['country', 'rock', 'indie'], minPop: 24, advance: 45000, royalty: 0.5, strict: 0.3, reach: 1.25 },
  { id: 'velvetroom', name: 'Velvet Room', tier: 'Indie', city: 'par', genres: ['rnb', 'pop', 'hiphop', 'electronic'], minPop: 24, advance: 40000, royalty: 0.5, strict: 0.2, reach: 1.2 },
  { id: 'fjord', name: 'Fjord Audio', tier: 'Indie', city: 'sto', genres: ['pop', 'electronic', 'indie'], minPop: 24, advance: 45000, royalty: 0.5, strict: 0.25, reach: 1.25 },
  // Mid-size
  { id: 'polaris', name: 'Polaris Music Group', tier: 'Mid', city: 'la', genres: [], minPop: 38, advance: 150000, royalty: 0.35, strict: 0.4, reach: 1.45 },
  { id: 'redline', name: 'Redline Collective', tier: 'Mid', city: 'atl', genres: ['hiphop', 'rnb', 'afrobeats'], minPop: 38, advance: 175000, royalty: 0.33, strict: 0.45, reach: 1.45 },
  { id: 'tidewater', name: 'Tidewater Records', tier: 'Mid', city: 'ams', genres: ['electronic', 'pop'], minPop: 36, advance: 140000, royalty: 0.35, strict: 0.35, reach: 1.4 },
  // Majors
  { id: 'meridian', name: 'Meridian Global', tier: 'Major', city: 'nyc', genres: [], minPop: 52, advance: 625000, royalty: 0.25, strict: 0.6, reach: 1.8 },
  { id: 'apex', name: 'Apex Entertainment', tier: 'Major', city: 'la', genres: [], minPop: 60, advance: 1250000, royalty: 0.22, strict: 0.7, reach: 1.9 },
  { id: 'sovereign', name: 'Sovereign Music Group', tier: 'Major', city: 'lon', genres: [], minPop: 56, advance: 900000, royalty: 0.23, strict: 0.65, reach: 1.85 },
  // Major subsidiaries (imprints)
  { id: 'meridian-urban', name: 'Meridian Urban', parent: 'meridian', tier: 'Imprint', city: 'atl', genres: ['hiphop', 'rnb'], minPop: 45, advance: 400000, royalty: 0.27, strict: 0.55, reach: 1.7 },
  { id: 'meridian-nash', name: 'Meridian Nashville', parent: 'meridian', tier: 'Imprint', city: 'nash', genres: ['country'], minPop: 44, advance: 350000, royalty: 0.27, strict: 0.5, reach: 1.7 },
  { id: 'apex-latino', name: 'Apex Latino', parent: 'apex', tier: 'Imprint', city: 'mia', genres: ['latin', 'reggaeton'], minPop: 45, advance: 450000, royalty: 0.26, strict: 0.55, reach: 1.75 },
  { id: 'apex-seoul', name: 'Apex Seoul', parent: 'apex', tier: 'Imprint', city: 'sel', genres: ['kpop'], minPop: 45, advance: 450000, royalty: 0.24, strict: 0.75, reach: 1.75 },
  { id: 'sovereign-dance', name: 'Sovereign Dance', parent: 'sovereign', tier: 'Imprint', city: 'ams', genres: ['electronic', 'pop'], minPop: 42, advance: 300000, royalty: 0.28, strict: 0.5, reach: 1.65 },
  { id: 'sovereign-west', name: 'Sovereign West Africa', parent: 'sovereign', tier: 'Imprint', city: 'los', genres: ['afrobeats', 'hiphop'], minPop: 42, advance: 300000, royalty: 0.28, strict: 0.5, reach: 1.65 },
  { id: 'sovereign-rock', name: 'Sovereign Rock', parent: 'sovereign', tier: 'Imprint', city: 'lon', genres: ['rock', 'metal', 'alternative', 'indie'], minPop: 42, advance: 280000, royalty: 0.28, strict: 0.5, reach: 1.65 },
  { id: 'apex-asia', name: 'Apex Asia Pacific', parent: 'apex', tier: 'Imprint', city: 'tyo', genres: ['pop', 'rock', 'jazz', 'electronic'], minPop: 44, advance: 350000, royalty: 0.26, strict: 0.6, reach: 1.7 },
];
export const labelById = (id) => LABELS.find((l) => l.id === id) || null;
export const CREATIVE_CONTROL = [
  { id: 'artist', name: 'Full creative control', reach: 0.85, quality: 0, value: 0.8 },
  { id: 'shared', name: 'Shared control', reach: 1, quality: 0, value: 1 },
  { id: 'label', name: 'Label control', reach: 1.2, quality: -2, value: 1.15 },
];

// ---------- Distribution (for independent artists; fictional companies) ----------
export const DISTRIBUTORS = [
  { id: 'tunewire', name: 'Tunewire', fee: 45, cut: 0, pitch: 0, hype: 0, desc: 'Flat yearly fee, you keep 100%. No frills.' },
  { id: 'opendrop', name: 'Opendrop', fee: 0, cut: 0.09, pitch: 0, hype: 0, desc: 'Free to upload; takes 9% of royalties.' },
  { id: 'soundpost', name: 'Soundpost', fee: 0, cut: 0.15, pitch: 0.08, hype: 0, desc: 'Takes 15%, pitches your songs to curators for you.' },
  { id: 'wavecore', name: 'Wavecore Pro', fee: 300, cut: 0, pitch: 0.03, hype: 0.1, desc: 'Pre-save pages and analytics: rollouts land a bit harder.' },
  { id: 'indiegrid', name: 'Indiegrid Partners', fee: 0, cut: 0.2, pitch: 0.06, hype: 0.05, minML: 50000, advance: true, desc: 'Label services without a label: 20% cut, small advances, sync pitching.' },
];
export const distributorById = (id) => DISTRIBUTORS.find((d) => d.id === id) || DISTRIBUTORS[0];

// ---------- Lifestyle ----------
// kind: home (bought homes replace rent), rental (extra weekly rent), car, jewelry, art, studio, jet.
// appreciation = yearly value change; prestige = one-off image/hype boost.
export const LIFESTYLE = [
  { id: 'loft', name: 'City loft (rent)', kind: 'rental', price: 0, weekly: 600, prestige: 2, desc: 'Exposed brick, decent light.' },
  { id: 'penthouse', name: 'Penthouse (rent)', kind: 'rental', price: 0, weekly: 4000, prestige: 6, desc: 'Skyline views for the content.' },
  { id: 'house', name: 'Family house', kind: 'home', price: 450000, weekly: 600, appreciation: 0.03, prestige: 3, desc: 'Yours. No more rent.' },
  { id: 'villa', name: 'Hillside villa', kind: 'home', price: 2500000, weekly: 2500, appreciation: 0.03, prestige: 8, desc: 'Pool, studio room, gate.' },
  { id: 'mansion', name: 'Mansion', kind: 'home', price: 12000000, weekly: 9000, appreciation: 0.025, prestige: 14, desc: 'Twelve bedrooms. Staff required.' },
  { id: 'hatch', name: 'Used hatchback', kind: 'car', price: 18000, weekly: 40, appreciation: -0.12, prestige: 0, desc: 'Gets you to the studio.' },
  { id: 'ev', name: 'Electric saloon', kind: 'car', price: 65000, weekly: 60, appreciation: -0.12, prestige: 2, desc: 'Quiet, fast, sensible.' },
  { id: 'sports', name: 'Sports coupé', kind: 'car', price: 220000, weekly: 250, appreciation: -0.1, prestige: 5, desc: 'Turns heads on the strip.' },
  { id: 'hyper', name: 'Hypercar', kind: 'car', price: 2400000, weekly: 1500, appreciation: -0.05, prestige: 10, desc: 'Limited run of 300.' },
  { id: 'chain', name: 'Custom chain', kind: 'jewelry', price: 15000, weekly: 0, appreciation: -0.05, prestige: 2, desc: 'Your logo, in gold.' },
  { id: 'watch', name: 'Luxury watch', kind: 'jewelry', price: 85000, weekly: 0, appreciation: 0.02, prestige: 3, desc: 'Swiss movement, waiting list.' },
  { id: 'iced', name: 'Diamond set', kind: 'jewelry', price: 400000, weekly: 0, appreciation: -0.02, prestige: 6, desc: 'For award-show carpets.' },
  { id: 'art', name: 'Contemporary painting', kind: 'art', price: 250000, weekly: 50, appreciation: 0.05, prestige: 4, desc: 'Investment with a story.' },
  { id: 'homestudio', name: 'Home studio build', kind: 'studio', price: 120000, weekly: 150, appreciation: -0.08, prestige: 2, desc: 'Self-production sounds better (+6).' },
  { id: 'jet', name: 'Private jet', kind: 'jet', price: 18000000, weekly: 25000, appreciation: -0.08, prestige: 16, desc: 'Tour travel costs halved.' },
];
export const lifestyleById = (id) => LIFESTYLE.find((x) => x.id === id) || null;

// ---------- Acting ----------
export const ACTING_ROLES = [
  { id: 'cameo', name: 'Cameo in a music documentary', minPop: 18, needAct: 0, pay: 5000, shoot: 1, budget: 1, fame: 0.5 },
  { id: 'tvguest', name: 'TV guest role', minPop: 28, needAct: 8, pay: 25000, shoot: 2, budget: 2, fame: 1 },
  { id: 'indie', name: 'Indie film lead', minPop: 32, needAct: 18, pay: 40000, shoot: 4, budget: 2, fame: 1.2 },
  { id: 'series', name: 'Streaming series (supporting)', minPop: 48, needAct: 28, pay: 250000, shoot: 6, budget: 4, fame: 2 },
  { id: 'studio', name: 'Studio film (supporting)', minPop: 58, needAct: 38, pay: 1200000, shoot: 6, budget: 6, fame: 2.6 },
  { id: 'lead', name: 'Blockbuster lead', minPop: 72, needAct: 52, pay: 8000000, shoot: 10, budget: 10, fame: 4 },
];
export const FILM_WORDS = {
  a: ['The Last', 'Midnight', 'Silver', 'Northern', 'Paper', 'Velvet', 'Quiet', 'Electric', 'Burning', 'Lonely', 'Hidden', 'Golden'],
  b: ['Harbour', 'Summer', 'Frequency', 'Kingdom', 'Signal', 'Road', 'Season', 'Encore', 'Lights', 'Promise', 'Echo', 'Tide'],
};

// ---------- Festivals (fictional) ----------
// week = week of year; size drives fees and lineup length. genres = what the bookers favour.
export const FESTIVALS = [
  { id: 'harbourdays', name: 'Harbour Days', city: 'syd', week: 3, size: 'major', genres: ['indie', 'pop', 'electronic', 'rock'] },
  { id: 'riopulse', name: 'Rio Pulse', city: 'rio', week: 7, size: 'major', genres: ['latin', 'reggaeton', 'electronic', 'pop'] },
  { id: 'neontide', name: 'Neon Tide', city: 'mia', week: 12, size: 'major', genres: ['electronic', 'hiphop', 'latin'] },
  { id: 'miragevalley', name: 'Mirage Valley', city: 'la', week: 16, size: 'mega', genres: [] },
  { id: 'glasshouse', name: 'Glasshouse Fields', city: 'lon', week: 26, size: 'mega', genres: ['rock', 'indie', 'pop', 'alternative', 'hiphop'] },
  { id: 'northernlights', name: 'Northern Lights Fest', city: 'sto', week: 27, size: 'major', genres: ['pop', 'electronic', 'indie'] },
  { id: 'highland', name: 'Highland Groove', city: 'ber', week: 30, size: 'major', genres: ['electronic', 'metal', 'rock', 'alternative'] },
  { id: 'lakeshore', name: 'Lakeshore Thunder', city: 'chi', week: 31, size: 'mega', genres: [] },
  { id: 'spectrum', name: 'Seoul Spectrum', city: 'sel', week: 33, size: 'major', genres: ['kpop', 'pop', 'rnb', 'hiphop'] },
  { id: 'lantern', name: 'Lantern Sound', city: 'tyo', week: 35, size: 'major', genres: ['rock', 'pop', 'jazz', 'electronic'] },
  { id: 'sierra', name: 'Sierra Nights', city: 'mex', week: 45, size: 'major', genres: ['latin', 'reggaeton', 'rock', 'pop'] },
  { id: 'soundcity', name: 'Sound City Lagos', city: 'los', week: 51, size: 'major', genres: ['afrobeats', 'hiphop', 'rnb'] },
];
export const FEST_SIZE = {
  major: { slots: { headliner: 3, sub: 7, undercard: 12 }, fee: { headliner: 900000, sub: 180000, undercard: 25000 }, crowd: 60000 },
  mega: { slots: { headliner: 3, sub: 9, undercard: 16 }, fee: { headliner: 3000000, sub: 400000, undercard: 50000 }, crowd: 120000 },
};

// ---------- Tour crew ----------
export const TOUR_STAFF = [
  { id: 'tourmgr', name: 'Tour manager', cost: 1500, desc: 'Routing and logistics: 5 less energy reserved a week, production −10%.' },
  { id: 'sound', name: 'Sound engineer', cost: 1200, desc: 'Show quality +8.' },
  { id: 'lighting', name: 'Lighting & visuals', cost: 2000, desc: 'Show quality +5, extra hype each night.' },
  { id: 'dancers', name: 'Dancers', cost: 2500, desc: 'Show quality +10 for dance-led genres (+3 otherwise).' },
  { id: 'security', name: 'Security team', cost: 1800, desc: 'Stops crowd incidents and stage invasions.' },
  { id: 'merchcrew', name: 'Merch crew', cost: 800, desc: 'Sells merch every night (~$6 per ticket sold).' },
];
export const DANCE_GENRES = ['pop', 'kpop', 'latin', 'reggaeton', 'afrobeats', 'hiphop', 'electronic'];

// ---------- Genre-fitting promo ideas ----------
export const PROMO_IDEAS = [
  { id: 'acoustic', name: 'Acoustic session', social: 10, genres: ['indie', 'country', 'rnb', 'pop', 'jazz', 'rock', 'alternative', 'afrobeats'], desc: 'Stripped-back take filmed in one shot.' },
  { id: 'playthrough', name: 'Instrument playthrough', social: 10, genres: ['rock', 'metal', 'alternative', 'indie', 'jazz'], desc: 'Guitar/drum cam for the musicians in your audience.' },
  { id: 'freestyle', name: 'Freestyle', social: 10, genres: ['hiphop', 'afrobeats', 'reggaeton', 'rnb'], desc: 'Off-the-dome verse over the beat.' },
  { id: 'challenge', name: 'Dance challenge', social: 15, genres: ['pop', 'kpop', 'latin', 'reggaeton', 'afrobeats', 'hiphop', 'electronic'], desc: 'A simple routine fans can copy.' },
  { id: 'dancepractice', name: 'Dance practice video', social: 12, genres: ['pop', 'kpop'], desc: 'Full choreography in the practice room.' },
  { id: 'djclip', name: 'DJ set clip', social: 10, genres: ['electronic', 'reggaeton', 'afrobeats'], desc: 'The drop, a packed room, phones in the air.' },
  { id: 'liveband', name: 'Live-band rehearsal', social: 12, genres: ['rock', 'metal', 'country', 'jazz', 'rnb', 'indie', 'alternative'], desc: 'The band, the room, no autotune.' },
  { id: 'breakdown', name: 'Studio breakdown', social: 8, genres: null, desc: 'How the song was built, layer by layer.' },
  { id: 'storytime', name: 'Lyric storytime', social: 8, genres: null, desc: 'The real story behind the lyrics.' },
];
export function promoIdeasFor(genre) {
  return PROMO_IDEAS.filter((x) => !x.genres || x.genres.includes(genre));
}

// ---------- EP / album rollout steps ----------
export const ROLLOUT_STEPS = [
  { id: 'cover', name: 'Cover reveal', energy: 0, social: 6, cost: 0, hype: 3, pre: 0.05, desc: 'Post the artwork and let fans theorise.' },
  { id: 'tracklist', name: 'Tracklist reveal', energy: 0, social: 6, cost: 0, hype: 3, pre: 0.05, desc: 'Titles, features, the order.' },
  { id: 'trailer', name: 'Trailer', energy: 15, social: 0, cost: 2000, hype: 6, pre: 0.1, desc: 'A 60-second film teasing the world of the project.' },
  { id: 'trackbytrack', name: 'Track-by-track', energy: 0, social: 15, cost: 0, hype: 4, pre: 0.07, desc: 'Walk fans through every song.' },
];

// ---------- Payola packages (risky) ----------
export const PAYOLA = [
  { id: 'radio', name: 'Radio “consulting”', cost: 5000, streams: 0, radio: 2.2, suspicion: 8, desc: 'Programmers spin your single more for a few weeks.' },
  { id: 'playlists', name: 'Playlist farm', cost: 25000, streams: 2_500_000, radio: 0, suspicion: 18, desc: '~2.5M streams over three weeks from curator networks.' },
  { id: 'chart', name: 'Chart package', cost: 150000, streams: 18_000_000, radio: 1, suspicion: 35, desc: '~18M streams and spins over three weeks. Very risky.' },
];

// ---------- Paid ads (legit, lower return than payola, no risk) ----------
export const AD_TIERS = [
  { id: 'small', name: 'Starter ads', cost: 500, streams: 14000, views: 15000 },
  { id: 'mid', name: 'Campaign ads', cost: 5000, streams: 150000, views: 160000 },
  { id: 'big', name: 'Takeover ads', cost: 50000, streams: 1500000, views: 1700000 },
];

// ---------- Store (placeholder only: NO payments are processed) ----------
export const STORE_ITEMS = {
  cash: [
    { id: 'cash1', name: 'Pocket money', amount: '$50,000 in-game cash', price: '—' },
    { id: 'cash2', name: 'Advance', amount: '$250,000 in-game cash', price: '—' },
    { id: 'cash3', name: 'Label money', amount: '$1,000,000 in-game cash', price: '—' },
  ],
  promo: [
    { id: 'promo1', name: 'Promo boost', amount: '+250K promo streams on one song', price: '—' },
    { id: 'promo2', name: 'Release push', amount: '+1M promo streams over 2 weeks', price: '—' },
  ],
  sub: { name: 'Treblr+', perks: ['Extra save slots', 'Exclusive cover-art styles', 'Weekly bonus energy (+10)', 'Early access to new apps', 'Support Treblr development'] },
};

// Distinct generative cover styles (rendered by the UI's CoverArt). 0 = classic gradient.
export const COVER_STYLES = ['gradient', 'waves', 'grid', 'sunburst', 'rings', 'stripes', 'blobs', 'mosaic', 'horizon', 'orbit', 'shards', 'halftone', 'flow'];
