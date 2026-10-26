// NPC artist helpers: roster -> rivals, signature-style title generators, market strength, collab pricing.
import { ARTIST_ROSTER } from './realArtists.js';
import { MARKETS } from './data.js';
import { clamp } from './util.js';

export const TIERS = {
  superstar: { label: 'Superstar', cadence: 0.006, album: 0.35 },
  star: { label: 'Star', cadence: 0.009, album: 0.25 },
  established: { label: 'Established', cadence: 0.012, album: 0.18 },
  rising: { label: 'Rising', cadence: 0.016, album: 0.1 },
};

// basePop is kept for legacy maths: listeners = 10^(3.8 + basePop * 0.045)
export const popFromML = (ml) => Math.round(clamp((Math.log10(Math.max(1000, ml)) - 3.8) / 0.045, 0, 100));

export function rosterRivals() {
  return ARTIST_ROSTER.map((a) => ({
    id: a.id, name: a.name, country: a.country, genre: a.genres[0], genres: a.genres, styles: a.styles,
    markets: a.markets, tier: a.tier, real: a.real, estimated: a.estimated, baseML: a.ml, basePop: popFromML(a.ml),
  }));
}

// Signature-style word pools. Combined at random: never real song titles.
export const STYLE_WORDS = {
  party: { a: ['Saturday', 'Neon', 'Disco', 'Rooftop', 'After', 'Glitter', 'Velvet', 'Late Check-Out', 'Strobe', 'Champagne'], b: ['Fever', 'Motion', 'Club', 'Weekend', 'Heat', 'Bounce', 'Lights', 'Riot', 'Shake', 'Hours'] },
  romance: { a: ['Sweet', 'Golden', 'Slow', 'Honey', 'Cherry', 'Paper', 'Soft', 'Forever', 'Lover\u2019s', 'Silk'], b: ['Hearts', 'Kisses', 'Promise', 'Daydream', 'Letters', 'Touch', 'Rings', 'Summer', 'Roses', 'Sunday'] },
  moody: { a: ['Midnight', 'Faded', 'Hollow', 'Blue', 'Cold', 'Static', 'Smoke', 'Low', 'Ghost', 'Grey'], b: ['Signals', 'Mirrors', 'Rain', 'Echoes', 'Hours', 'Tides', 'Phantoms', 'Satellites', 'Silence', 'Avenue'] },
  ballad: { a: ['Every', 'Last', 'Quiet', 'Broken', 'Little', 'Distant', 'Gentle', 'Only', 'Paper', 'Winter'], b: ['Goodbye', 'Lullaby', 'Lantern', 'Hymn', 'Letters', 'Harbour', 'Wishes', 'Window', 'Promise', 'Shore'] },
  anthem: { a: ['Higher', 'Unbreakable', 'Burning', 'Electric', 'Wild', 'Rise', 'Loud', 'Thunder', 'Glory', 'Infinite'], b: ['Hearts', 'Nation', 'Skies', 'Kings', 'Fire', 'Ground', 'Horizon', 'Gravity', 'Revolution', 'Lights'] },
  street: { a: ['Big', 'Cold', 'Concrete', 'Real', 'No', 'Paper', 'Ice', 'Late', 'Black', 'Back'], b: ['Talk', 'Block', 'Paper', 'Smoke', 'Mode', 'Way', 'Motion', 'Static', 'Kings', 'Problems'] },
  latin: { a: ['Noche', 'Fuego', 'Bailando', 'Mi', 'Calor', 'Luna', 'Perreo', 'Dime', 'Otra', 'Tu'], b: ['Caliente', 'Contigo', 'Bonita', 'Amor', 'Playa', 'Loca', 'Corazón', 'Verano', 'Sola', 'Mía'] },
  corrido: { a: ['El', 'La', 'Los', 'Ella', 'Puro', 'Corrido', 'Sierra', 'Plebe', 'Rancho', 'Camino'], b: ['Jefe', 'Rayo', 'Sierra', 'Gallo', 'Desierto', 'Botas', 'Norte', 'Plata', 'Estrella', 'Mezcal'] },
  afro: { a: ['Sunset', 'Gbedu', 'Lagos', 'Shayo', 'Ginger', 'Ozumba', 'Wavy', 'Sweet', 'Jollof', 'Island'], b: ['Groove', 'Vibes', 'Love', 'Wahala', 'Dance', 'Gyration', 'Melody', 'Rhythm', 'Sunshine', 'Night'] },
  kpop: { a: ['Hyper', 'Pink', 'Star', 'Neo', 'Crystal', 'Bubble', 'Supernova', 'Sugar', 'Cyber', 'Lightning'], b: ['Rush', 'Love', 'Code', 'Galaxy', 'Dash', 'Candy', 'Signal', 'Venom', 'Spark', 'Tempo'] },
  jpop: { a: ['Sakura', 'Neon', 'Tokyo', 'Night', 'Paper', 'Summer', 'Blue', 'Moon', 'Idol', 'Kaleido'], b: ['Parade', 'Drive', 'Rain', 'Story', 'Kite', 'Hanabi', 'Bloom', 'Train', 'Signal', 'Letter'] },
  country: { a: ['Dirt', 'Whiskey', 'Small Town', 'Tailgate', 'Front Porch', 'Highway', 'Old', 'Backroad', 'Southern', 'Pickup'], b: ['Road', 'Prayer', 'Summer', 'Hearts', 'Boots', 'Nights', 'Truck', 'River', 'Sunday', 'Rain'] },
  rock: { a: ['Rattle', 'Broken', 'Static', 'Electric', 'Dead', 'Rust', 'Loud', 'Feral', 'Crash', 'Gasoline'], b: ['Machine', 'Radio', 'Heart', 'Youth', 'Wire', 'City', 'Engine', 'Teeth', 'Ritual', 'Satellite'] },
  metal: { a: ['Iron', 'Black', 'Blood', 'Storm', 'Ashen', 'Steel', 'Void', 'Hollow', 'Grave', 'Obsidian'], b: ['Throne', 'Requiem', 'Engine', 'Serpent', 'Cathedral', 'Oath', 'Inferno', 'Eclipse', 'Legion', 'Abyss'] },
  edm: { a: ['Sky', 'Pulse', 'Infinity', 'Ocean', 'Prism', 'Afterglow', 'Laser', 'Solar', 'Hyper', 'Deep'], b: ['Drop', 'Waves', 'Runner', 'Lights', 'Rush', 'Wire', 'Horizon', 'Code', 'Bloom', 'Frequency'] },
  dreamy: { a: ['Lilac', 'Cloud', 'Pastel', 'Glass', 'Velvet', 'Moonlit', 'Hazy', 'Soft', 'Starlit', 'Lucid'], b: ['Garden', 'Dream', 'Haze', 'Waves', 'Bloom', 'Orbit', 'Mirage', 'Afternoon', 'Static', 'Lagoon'] },
  jazzy: { a: ['Blue', 'Smoky', 'Velvet', 'After', 'Midnight', 'Brass', 'Moonlight', 'Bourbon', 'Satin', 'Rainy'], b: ['Serenade', 'Waltz', 'Lounge', 'Avenue', 'Standard', 'Reverie', 'Hours', 'Cafe', 'Swing', 'Sonata'] },
};

export function npcTitle(rng, rival) {
  const style = STYLE_WORDS[rng.pick(rival?.styles?.length ? rival.styles : ['moody'])] || STYLE_WORDS.moody;
  const a = rng.pick(style.a); const b = rng.pick(style.b);
  return rng.chance(0.2) ? b : `${a} ${b}`;
}

// Market share profile for an artist: genre affinities + home market + where they are genuinely big.
const shareCache = new Map();
export function artistShares(rival) {
  if (shareCache.has(rival.id)) return shareCache.get(rival.id);
  const raw = MARKETS.map((m) => {
    const aff = rival.genres.reduce((best, g) => Math.max(best, m.aff[g] ?? 1), 0);
    const home = m.code === rival.country ? 3 : 1;
    const boost = rival.markets?.[m.code] ?? 1;
    return m.share * aff * home * boost;
  });
  const total = raw.reduce((a, b) => a + b, 0) + 0.1;
  const out = {};
  MARKETS.forEach((m, i) => { out[m.code] = raw[i] / total; });
  shareCache.set(rival.id, out);
  return out;
}

// Collab pricing & odds: scale with the popularity gap and the relationship.
export function collabQuote(player, rival, rel = 0) {
  const rpop = Math.min(100, Math.round((Math.log10(rival.monthlyListeners + 1) - 2) * 17));
  const gap = rpop - player.popularity;
  const fee = Math.round(Math.max(300, rival.monthlyListeners * 0.0012 * Math.pow(1.045, Math.max(0, gap))) * (rel >= 70 ? 0.5 : rel >= 40 ? 0.8 : 1));
  const odds = clamp(0.8 - Math.max(0, gap) * 0.022 + rel * 0.004 + (rival.real ? 0 : 0.1), 0.02, 0.95);
  return { fee, odds, gap, rpop };
}

export function tierLabel(t) { return TIERS[t]?.label || t; }

export const RIVALS = rosterRivals();
