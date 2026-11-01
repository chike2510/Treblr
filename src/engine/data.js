// Static world data. Treblr is a GLOBAL music career sim: every list here spans the world.

export const GENRES = [
  { id: 'pop', name: 'Pop', subs: ['Dance-Pop', 'Synth-Pop', 'Bedroom Pop', 'Electropop', 'Teen Pop'] },
  { id: 'hiphop', name: 'Hip-Hop', subs: ['Trap', 'Boom Bap', 'Drill', 'Conscious', 'Melodic Rap'] },
  { id: 'rnb', name: 'R&B', subs: ['Neo-Soul', 'Alt R&B', 'Contemporary', 'Funk', 'Quiet Storm'] },
  { id: 'rock', name: 'Rock', subs: ['Pop Rock', 'Garage', 'Punk', 'Hard Rock', 'Grunge'] },
  { id: 'country', name: 'Country', subs: ['Country Pop', 'Americana', 'Bluegrass', 'Outlaw', 'Folk'] },
  { id: 'kpop', name: 'K-Pop', subs: ['Idol Pop', 'K-R&B', 'K-Hip-Hop', 'Ballad', 'Girl Crush'] },
  { id: 'latin', name: 'Latin', subs: ['Latin Pop', 'Bachata', 'Regional Mexican', 'Salsa', 'Corridos'] },
  { id: 'electronic', name: 'Electronic', subs: ['House', 'Techno', 'Drum & Bass', 'Dubstep', 'Ambient'] },
  { id: 'afrobeats', name: 'Afrobeats', subs: ['Afropop', 'Amapiano', 'Afro-Fusion', 'Highlife', 'Alté'] },
  { id: 'indie', name: 'Indie', subs: ['Indie Pop', 'Indie Folk', 'Lo-Fi', 'Dream Pop', 'Shoegaze'] },
  { id: 'metal', name: 'Metal', subs: ['Metalcore', 'Thrash', 'Doom', 'Nu-Metal', 'Prog Metal'] },
  { id: 'jazz', name: 'Jazz', subs: ['Smooth Jazz', 'Bebop', 'Jazz Fusion', 'Vocal Jazz', 'Nu-Jazz'] },
  { id: 'reggaeton', name: 'Reggaeton', subs: ['Perreo', 'Latin Trap', 'Dembow', 'Moombahton', 'Romántico'] },
  { id: 'alternative', name: 'Alternative', subs: ['Alt-Pop', 'Post-Punk', 'Emo', 'Art Rock', 'Hyperpop'] },
];
export const genreName = (id) => GENRES.find((g) => g.id === id)?.name || id;

// Chart markets with share of global streaming volume and genre affinities.
export const MARKETS = [
  { code: 'US', name: 'United States', flag: '🇺🇸', share: 0.27, aff: { country: 2.2, hiphop: 1.4, rnb: 1.3, latin: 1.1, kpop: 0.7 } },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', share: 0.07, aff: { indie: 1.6, electronic: 1.4, hiphop: 1.2, rock: 1.3, afrobeats: 1.3, country: 0.6 } },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', share: 0.04, aff: { country: 1.6, hiphop: 1.3, rnb: 1.2, indie: 1.2 } },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', share: 0.06, aff: { electronic: 1.9, metal: 1.8, rock: 1.4, country: 0.5 } },
  { code: 'FR', name: 'France', flag: '🇫🇷', share: 0.05, aff: { hiphop: 1.7, electronic: 1.5, afrobeats: 1.4, country: 0.4 } },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', share: 0.07, aff: { rock: 1.6, jazz: 1.9, kpop: 1.5, pop: 1.3, hiphop: 0.6, latin: 0.5 } },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', share: 0.04, aff: { kpop: 4.0, rnb: 1.3, hiphop: 1.1, country: 0.3 } },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', share: 0.07, aff: { latin: 1.8, reggaeton: 1.8, electronic: 1.2, country: 0.6 } },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', share: 0.05, aff: { latin: 3.0, reggaeton: 2.5, rock: 1.1, country: 0.5 } },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', share: 0.03, aff: { afrobeats: 4.0, hiphop: 1.2, rnb: 1.2, country: 0.3, metal: 0.3 } },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', share: 0.03, aff: { indie: 1.5, electronic: 1.3, rock: 1.3, country: 1.2 } },
  { code: 'IN', name: 'India', flag: '🇮🇳', share: 0.08, aff: { pop: 1.4, electronic: 1.4, hiphop: 1.2, country: 0.3, metal: 0.5 } },
];
export const marketByCode = (c) => MARKETS.find((m) => m.code === c);

// Cities (lat/lng used for the world map). country = market code when a chart exists, else ISO-ish code.
export const CITIES = [
  { id: 'nyc', name: 'New York', country: 'US', flag: '🇺🇸', lat: 40.7, lng: -74.0, rent: 1400 },
  { id: 'la', name: 'Los Angeles', country: 'US', flag: '🇺🇸', lat: 34.05, lng: -118.2, rent: 1300 },
  { id: 'atl', name: 'Atlanta', country: 'US', flag: '🇺🇸', lat: 33.75, lng: -84.4, rent: 900 },
  { id: 'nash', name: 'Nashville', country: 'US', flag: '🇺🇸', lat: 36.16, lng: -86.8, rent: 850 },
  { id: 'mia', name: 'Miami', country: 'US', flag: '🇺🇸', lat: 25.8, lng: -80.2, rent: 1100 },
  { id: 'chi', name: 'Chicago', country: 'US', flag: '🇺🇸', lat: 41.9, lng: -87.6, rent: 950 },
  { id: 'tor', name: 'Toronto', country: 'CA', flag: '🇨🇦', lat: 43.65, lng: -79.4, rent: 1000 },
  { id: 'mex', name: 'Mexico City', country: 'MX', flag: '🇲🇽', lat: 19.4, lng: -99.1, rent: 500 },
  { id: 'sju', name: 'San Juan', country: 'PR', flag: '🇵🇷', lat: 18.47, lng: -66.1, rent: 650 },
  { id: 'bog', name: 'Bogotá', country: 'CO', flag: '🇨🇴', lat: 4.7, lng: -74.1, rent: 420 },
  { id: 'sao', name: 'São Paulo', country: 'BR', flag: '🇧🇷', lat: -23.5, lng: -46.6, rent: 520 },
  { id: 'rio', name: 'Rio de Janeiro', country: 'BR', flag: '🇧🇷', lat: -22.9, lng: -43.2, rent: 500 },
  { id: 'bue', name: 'Buenos Aires', country: 'AR', flag: '🇦🇷', lat: -34.6, lng: -58.4, rent: 400 },
  { id: 'lon', name: 'London', country: 'UK', flag: '🇬🇧', lat: 51.5, lng: -0.12, rent: 1500 },
  { id: 'man', name: 'Manchester', country: 'UK', flag: '🇬🇧', lat: 53.48, lng: -2.24, rent: 900 },
  { id: 'par', name: 'Paris', country: 'FR', flag: '🇫🇷', lat: 48.86, lng: 2.35, rent: 1200 },
  { id: 'ber', name: 'Berlin', country: 'DE', flag: '🇩🇪', lat: 52.52, lng: 13.4, rent: 950 },
  { id: 'sto', name: 'Stockholm', country: 'SE', flag: '🇸🇪', lat: 59.33, lng: 18.07, rent: 1000 },
  { id: 'ams', name: 'Amsterdam', country: 'NL', flag: '🇳🇱', lat: 52.37, lng: 4.9, rent: 1150 },
  { id: 'mad', name: 'Madrid', country: 'ES', flag: '🇪🇸', lat: 40.4, lng: -3.7, rent: 800 },
  { id: 'los', name: 'Lagos', country: 'NG', flag: '🇳🇬', lat: 6.5, lng: 3.4, rent: 450 },
  { id: 'acc', name: 'Accra', country: 'GH', flag: '🇬🇭', lat: 5.6, lng: -0.19, rent: 380 },
  { id: 'jnb', name: 'Johannesburg', country: 'ZA', flag: '🇿🇦', lat: -26.2, lng: 28.05, rent: 480 },
  { id: 'cai', name: 'Cairo', country: 'EG', flag: '🇪🇬', lat: 30.04, lng: 31.24, rent: 350 },
  { id: 'dxb', name: 'Dubai', country: 'AE', flag: '🇦🇪', lat: 25.2, lng: 55.27, rent: 1300 },
  { id: 'bom', name: 'Mumbai', country: 'IN', flag: '🇮🇳', lat: 19.08, lng: 72.88, rent: 600 },
  { id: 'sel', name: 'Seoul', country: 'KR', flag: '🇰🇷', lat: 37.57, lng: 126.98, rent: 900 },
  { id: 'tyo', name: 'Tokyo', country: 'JP', flag: '🇯🇵', lat: 35.68, lng: 139.69, rent: 1100 },
  { id: 'mnl', name: 'Manila', country: 'PH', flag: '🇵🇭', lat: 14.6, lng: 120.98, rent: 400 },
  { id: 'syd', name: 'Sydney', country: 'AU', flag: '🇦🇺', lat: -33.87, lng: 151.2, rent: 1250 },
];
export const cityById = (id) => CITIES.find((c) => c.id === id) || CITIES[0];

export const CAREER_PATHS = [
  { id: 'bedroom', name: 'Bedroom Artist', tag: 'Start small, own everything', desc: 'A laptop, a cheap mic and total creative control.', cash: 1500, fans: 50, hype: 5, skills: { songwriting: 30, vocals: 25, production: 35, performance: 15, charisma: 20 } },
  { id: 'viral', name: 'Viral Overnight', tag: 'One clip blew up', desc: 'Big buzz, thin catalogue. Strike while the internet cares.', cash: 2500, fans: 8000, hype: 60, skills: { songwriting: 20, vocals: 25, production: 15, performance: 20, charisma: 40 } },
  { id: 'signed', name: 'Signed Rookie', tag: 'A small label believes in you', desc: 'Advance in the bank and a label taking its cut.', cash: 12000, fans: 1500, hype: 25, label: { id: 'northbound', name: 'Northbound Records', royalty: 0.35 }, skills: { songwriting: 30, vocals: 35, production: 25, performance: 30, charisma: 30 } },
  { id: 'songwriter', name: 'Songwriter Turned Star', tag: 'You wrote their hits', desc: 'Elite pen game, no audience of your own. Yet.', cash: 6000, fans: 300, hype: 10, skills: { songwriting: 60, vocals: 25, production: 30, performance: 15, charisma: 20 } },
  { id: 'plant', name: 'Industry Plant', tag: 'Money opens doors', desc: 'Deep-pocketed backers, sceptical fans and a suspicion meter already ticking.', cash: 40000, fans: 4000, hype: 35, suspicion: 30, skills: { songwriting: 15, vocals: 25, production: 15, performance: 20, charisma: 35 } },
];
export const pathById = (id) => CAREER_PATHS.find((p) => p.id === id) || CAREER_PATHS[0];

export const THEMES = ['Love', 'Heartbreak', 'Party', 'Hustle', 'Hometown', 'Fame', 'Freedom', 'Revenge', 'Late Nights', 'Summer', 'Faith', 'Money', 'Self-Love', 'Nostalgia'];

export const TITLE_WORDS = {
  a: ['Midnight', 'Golden', 'Neon', 'Electric', 'Velvet', 'Paper', 'Silver', 'Broken', 'Wild', 'Lonely', 'Sweet', 'Crystal', 'Faded', 'Burning', 'Hollow', 'Cherry', 'Ocean', 'Sugar', 'Cold', 'Lucky'],
  b: ['Hearts', 'City', 'Dreams', 'Lights', 'Summer', 'Fever', 'Signals', 'Echoes', 'Roses', 'Skies', 'Motion', 'Diamonds', 'Static', 'Gravity', 'Highway', 'Satellite', 'Rain', 'Mirrors', 'Daydream', 'Avenue'],
};

export const PRODUCERS = [
  { id: 'self', name: 'Self-produced', tier: 'DIY', price: 0, quality: 25, desc: 'Your laptop, your rules.' },
  { id: 'local', name: 'Local studio', tier: 'Tier 1', price: 400, quality: 45, desc: 'Clean, honest, a bit generic.' },
  { id: 'rising', name: 'Rising producer', tier: 'Tier 2', price: 2000, quality: 62, desc: 'Hungry, current, on blogs.' },
  { id: 'hitmaker', name: 'Hitmaker', tier: 'Tier 3', price: 9000, quality: 80, desc: 'Has charting credits worldwide.' },
  { id: 'legend', name: 'Legendary producer', tier: 'Tier 4', price: 35000, quality: 94, desc: 'Grammy-shelf sound. Books months out.' },
];

export const COWRITERS = [
  { id: 'none', name: 'Solo', fee: 0, share: 0, bonus: 0 },
  { id: 'peer', name: 'Peer co-writer', fee: 150, share: 0.1, bonus: 6 },
  { id: 'pro', name: 'Pro topliner', fee: 1200, share: 0.2, bonus: 12 },
  { id: 'camp', name: 'Writing camp', fee: 6000, share: 0.35, bonus: 20 },
];

export const ROLLOUTS = [
  { id: 'drop', name: 'Surprise drop', cost: 0, hype: 4, mult: 0.9, desc: 'No warning. Fans find it themselves.' },
  { id: 'standard', name: 'Standard rollout', cost: 300, hype: 10, mult: 1.0, desc: 'Teasers, a pre-save link, one week of posts.' },
  { id: 'campaign', name: 'Full campaign', cost: 2500, hype: 22, mult: 1.25, desc: 'Ads, playlist pitching, press outreach.' },
  { id: 'blitz', name: 'Global blitz', cost: 15000, hype: 40, mult: 1.6, desc: 'Billboards in five cities and a press tour.' },
];

export const COVER_GRADIENTS = [
  ['#FF6B4A', '#6C1BFF'], ['#C6FF3D', '#0E7C66'], ['#2DD4BF', '#1E3A8A'], ['#FFB020', '#E11D48'],
  ['#6C7BFF', '#0B0B0F'], ['#F472B6', '#FDE68A'], ['#111827', '#9CA3AF'], ['#3DDC84', '#0B3D2E'],
];

export const STAFF = [
  { id: 'manager', name: 'Manager', salary: 1500, commission: 0.1, buff: 'Takes 10% of income on top of salary. +10% on streams, bigger and better offers', tips: ['Release singles 3–6 weeks apart to keep streams stacked.', 'Never let cash dip below two weeks of expenses.', 'A label deal is a loan, read the royalty, not the advance.'] },
  { id: 'publicist', name: 'Publicist', salary: 1000, buff: 'Hype decays slower, press bookings cost less energy', tips: ['Post the week of a release, that is when hype converts.', 'Bad press fades faster when you stay visible.'] },
  { id: 'booking', name: 'Booking agent', salary: 700, commission: 0.1, buff: 'Takes 10% of gig income. +20% gig pay, more and better gig offers', tips: ['Play where your fan heat is highest, the map shows it.', 'Selling out a small room beats half-filling an arena.'] },
];

export const JOBS = [
  { id: 'barista', name: 'Barista shift', pay: 320, energy: 25, skill: 'charisma', desc: 'Steam milk, people-watch, hum hooks.' },
  { id: 'session', name: 'Session musician', pay: 650, energy: 30, skill: 'performance', minSkill: { performance: 25 }, desc: 'Play on someone else\u2019s record.' },
  { id: 'teacher', name: 'Music lessons', pay: 480, energy: 20, skill: 'vocals', desc: 'Teach scales to twelve-year-olds.' },
  { id: 'dj', name: 'Wedding DJ', pay: 900, energy: 35, skill: 'production', minSkill: { production: 25 }, desc: 'Cha-Cha Slide, nine times.' },
  { id: 'ghost', name: 'Ghostwriting gig', pay: 1500, energy: 35, skill: 'songwriting', minSkill: { songwriting: 45 }, desc: 'Write a hit you can never claim.' },
];

export const VENUES = [
  { id: 'bar', name: 'Open-mic bar', capacity: 80, ticket: 8, minFans: 0, energy: 25 },
  { id: 'club', name: 'Club', capacity: 400, ticket: 15, minFans: 800, energy: 30 },
  { id: 'theatre', name: 'Theatre', capacity: 2000, ticket: 30, minFans: 8000, energy: 35 },
  { id: 'hall', name: 'Concert hall', capacity: 6000, ticket: 45, minFans: 40000, energy: 40 },
  { id: 'arena', name: 'Arena', capacity: 18000, ticket: 70, minFans: 250000, minFame: 'established', energy: 50 },
  { id: 'stadium', name: 'Stadium', capacity: 55000, ticket: 95, minFans: 1500000, minFame: 'star', energy: 65 },
];

const FAME_ORDER = ['unknown', 'local', 'buzzing', 'established', 'star', 'superstar', 'icon'];
// Arenas need an established name; stadiums need a star.
export function venueUnlocked(p, v, mult = 1) {
  if (p.fans < v.minFans * mult) return false;
  if (v.minFame && FAME_ORDER.indexOf(p.fame?.tier || 'unknown') < FAME_ORDER.indexOf(v.minFame)) return false;
  return true;
}
export function venueLockReason(p, v, mult = 1) {
  if (p.fans < v.minFans * mult) return `Needs ${Math.round(v.minFans * mult).toLocaleString('en-US')} fans`;
  if (v.minFame && !venueUnlocked(p, v, mult)) return `Needs ${v.minFame} status`;
  return null;
}
export { LABELS } from './data2.js';

export const BRANDS = ['Volt Energy', 'Nimbus Audio', 'Kinetic Sneakers', 'Lumen Mobile', 'Glaze Cosmetics', 'Orbit Rideshare', 'Tidewater Apparel', 'Halo Headphones', 'Sora Watches', 'Pulse Soda', 'Fable Fashion', 'Ridge Outdoor'];

export const CHARTS = [
  { id: 'hot100', name: 'Hot 100', size: 100, kind: 'songs' },
  { id: 'global', name: 'Global Stream', size: 50, kind: 'songs' },
  { id: 'album', name: 'Album Chart', size: 50, kind: 'albums' },
  { id: 'radio', name: 'Radio', size: 40, kind: 'songs' },
  ...MARKETS.map((m) => ({ id: m.code, name: `${m.flag} ${m.name}`, short: m.code, size: 40, kind: 'songs', market: m.code })),
];

// Song certification ladder (Gold 75M ... Diamond 3B). Each entry: { id, name, min }.
export { SONG_CERTS as CERTS } from './data2.js';

// The Golden Treble Awards is the headline show (the industry's biggest night). Submissions open
// six weeks before each ceremony and close the week before.
export const AWARD_SHOWS = [
  { week: 8, id: 'golden', name: 'Golden Treble Awards', headline: true, prestige: 3, city: 'la', desc: 'The industry’s biggest night. Voted by the Recording Guild.' },
  { week: 20, id: 'stream', name: 'Global Stream Awards', prestige: 2, city: 'lon', desc: 'Fan-voted, built on streaming numbers.' },
  { week: 32, id: 'video', name: 'TreblrTube Video Awards', prestige: 1.5, city: 'nyc', desc: 'Music videos, performances and moments.' },
  { week: 44, id: 'world', name: 'World Music Honours', prestige: 2, city: 'par', desc: 'Artists breaking across borders.' },
  { week: 52, id: 'yearend', name: 'Treblr Year-End Honours', prestige: 1, city: 'tyo', desc: 'The year’s chart champions.' },
];

export const GOALS = [
  { id: 'fans1k', name: 'First 1K fans', metric: 'fans', target: 1000, reward: { cash: 500 } },
  { id: 'firstRelease', name: 'Release your first song', metric: 'releases', target: 1, reward: { hype: 10 } },
  { id: 'chart', name: 'First chart entry', metric: 'chartEntries', target: 1, reward: { cash: 2000, hype: 15 } },
  { id: 'ml100k', name: '100K monthly listeners', metric: 'monthlyListeners', target: 100_000, reward: { cash: 5000 } },
  { id: 'streams1m', name: '1M lifetime streams', metric: 'lifetimeStreams', target: 1_000_000, reward: { cash: 4000 } },
  { id: 'soldout', name: 'Sell out a venue', metric: 'sellouts', target: 1, reward: { fans: 500 } },
  { id: 'gold', name: 'Gold certification', metric: 'golds', target: 1, reward: { cash: 15000 } },
  { id: 'top10', name: 'Top 10 hit', metric: 'bestRank', target: 10, invert: true, reward: { cash: 25000, hype: 25 } },
  { id: 'number1', name: 'A #1 record', metric: 'bestRank', target: 1, invert: true, reward: { cash: 100000, hype: 40 } },
  { id: 'fans1m', name: '1M fans', metric: 'fans', target: 1_000_000, reward: { cash: 250000 } },
];

export const START_DATE = Date.UTC(2027, 0, 4); // Monday, week 1
export function weekDate(week) {
  return new Date(START_DATE + (week - 1) * 7 * 86400000);
}
export function formatWeekDate(week, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return weekDate(week).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

// ---------- v3 content ----------
export const VIDEO_DIRECTORS = [
  { id: 'phone', name: 'Phone shoot (you)', tier: 'DIY', cost: 0, mult: 0.5, quality: 30 },
  { id: 'indie', name: 'Indie director', tier: 'Tier 1', cost: 3000, mult: 1.4, quality: 52 },
  { id: 'pro', name: 'Commercial director', tier: 'Tier 2', cost: 20000, mult: 3.5, quality: 70 },
  { id: 'auteur', name: 'Award-winning auteur', tier: 'Tier 3', cost: 90000, mult: 7, quality: 86 },
  { id: 'blockbuster', name: 'Blockbuster studio', tier: 'Tier 4', cost: 250000, mult: 12, quality: 94 },
];
export const VIDEO_CONCEPTS = [
  { id: 'performance', name: 'Performance', desc: 'You, a band, a big room. Converts viewers into fans.', views: 1.0, fans: 1.4, hype: 1.0, viral: 1.0, energy: 0 },
  { id: 'story', name: 'Story', desc: 'A short film. Press loves it; slower burn.', views: 0.9, fans: 1.1, hype: 1.6, viral: 0.9, energy: 5, genres: ['country', 'rnb', 'indie', 'rock', 'pop'] },
  { id: 'dance', name: 'Dance', desc: 'Choreo built for TreblrTok. Viral upside.', views: 1.25, fans: 1.0, hype: 1.1, viral: 1.6, energy: 10, genres: ['kpop', 'pop', 'latin', 'reggaeton', 'afrobeats', 'hiphop', 'electronic'] },
  { id: 'visualizer', name: 'Visualizer', desc: 'Looping art piece. Cheap and quick.', views: 0.6, fans: 0.7, hype: 0.6, viral: 0.8, energy: -10, costMult: 0.35 },
];
export const ERA_COLORS = ['#C6FF3D', '#FF6B4A', '#6C7BFF', '#FFB020', '#2DD4BF', '#F472B6', '#E11D48', '#A78BFA', '#FFFFFF', '#38BDF8'];
export const ERA_VIBES = [
  { id: 'bright', name: 'Bright', desc: 'Sunny, poppy, everywhere.', bonus: { hype: 6 } },
  { id: 'dark', name: 'Dark', desc: 'Moody visuals, mystery.', bonus: { quality: 2 } },
  { id: 'raw', name: 'Raw', desc: 'Unpolished, honest, live.', bonus: { performance: 2 } },
  { id: 'retro', name: 'Retro', desc: 'Vintage textures and nostalgia.', bonus: { fans: 0.03 } },
  { id: 'dreamy', name: 'Dreamy', desc: 'Soft focus, pastel, floaty.', bonus: { charisma: 2 } },
  { id: 'chaos', name: 'Chaos', desc: 'Loud, unpredictable, viral.', bonus: { viral: 0.05 } },
];
export const OUTFITS = [
  { id: 'classic', name: 'Classic tailoring', press: 1, risk: 0 },
  { id: 'bold', name: 'Bold designer look', press: 3, risk: 0.15 },
  { id: 'avantgarde', name: 'Avant-garde statement', press: 5, risk: 0.35 },
  { id: 'casual', name: 'Streetwear, unbothered', press: 0, risk: 0.05 },
];
export const SPEECHES = [
  { id: 'humble', name: 'Humble thank-you', hype: 4, fans: 0.01 },
  { id: 'fans', name: 'Shout out the fans', hype: 6, fans: 0.02 },
  { id: 'statement', name: 'Make a statement', hype: 10, fans: 0.015, risk: 0.25 },
  { id: 'short', name: 'Keep it short', hype: 2, fans: 0.005 },
];
export const TRAINING = [
  { id: 'songwriting', name: 'Songwriting workshop', energy: 12, base: 60 },
  { id: 'vocals', name: 'Vocal coaching', energy: 12, base: 60 },
  { id: 'production', name: 'Production course', energy: 12, base: 60 },
  { id: 'performance', name: 'Stage rehearsal', energy: 12, base: 40 },
  { id: 'charisma', name: 'Media training', energy: 9, base: 50 },
  { id: 'acting', name: 'Acting class', energy: 12, base: 80 },
];
// Fictional people only (dating & friendships). Real artists are never datable.
export const FICTIONAL_PEOPLE = [
  ['Jamie Cho', 'photographer', 'sel'], ['Lucía Vega', 'dancer', 'mad'], ['Theo Laurent', 'stylist', 'par'], ['Ama Owusu', 'DJ', 'acc'],
  ['Kai Nakamura', 'barista-turned-poet', 'tyo'], ['Rafa Costa', 'surf instructor', 'rio'], ['Mira Kapoor', 'film editor', 'bom'], ['Noah Fischer', 'session drummer', 'ber'],
  ['Zoe Adeyemi', 'fashion designer', 'lon'], ['Diego Ramos', 'chef', 'mex'], ['Sasha Petrov', 'ballet dancer', 'nyc'], ['Leila Haddad', 'architect', 'dxb'],
  ['Elliot Park', 'game designer', 'tor'], ['Ines Moreau', 'gallery curator', 'par'], ['Tomás Silva', 'skater', 'sao'], ['Hana Ito', 'illustrator', 'tyo'],
  ['Marcus Reid', 'radio host', 'atl'], ['Freya Lund', 'actor', 'sto'], ['Ola Bankole', 'tech founder', 'los'], ['Priya Nair', 'doctor', 'bom'],
];
export const CONTACT_SEED = [
  { id: 'mgr', name: 'Jules Marlowe', role: 'manager', rel: 40, blurb: 'Your manager-in-waiting. Brutally honest.' },
  { id: 'prod', name: 'Mika Laine', role: 'producer', rel: 25, blurb: 'Rising producer. Owns the "Rising producer" tier rate card.' },
  { id: 'bff', name: 'Sam Okoye', role: 'friend', rel: 60, blurb: 'Your oldest friend. Hype person, part-time voice of reason.' },
];
