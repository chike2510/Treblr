import { MILESTONES, MONTH_SHORT, PRODUCERS, NPC_ARTISTS, NPC_SONG_TITLES } from './data';

// ─── MATH ─────────────────────────────────────────────────────────────────────
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const roll  = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const pct   = (v, total) => Math.round((v / (total || 1)) * 100);
export const uid   = () => Math.random().toString(36).slice(2, 9);
export const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── FORMATTING ───────────────────────────────────────────────────────────────
export const fmt = (n) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
};
export const fmtN = (n) => (n < 0 ? `-₦${fmt(Math.abs(n))}` : `₦${fmt(n)}`);
export const fmtOrdinal = (n) => {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ─── TIME ─────────────────────────────────────────────────────────────────────
export const getTimeInfo = (totalWeeks, startYear = 2024, startAge = 22) => {
  const weekInMonth  = (totalWeeks % 4) + 1;           // 1-4
  const monthIndex   = Math.floor(totalWeeks / 4) % 12; // 0-11
  const yearsPassed  = Math.floor(totalWeeks / 48);
  const calYear      = startYear + yearsPassed;
  const currentAge   = startAge  + yearsPassed;
  return { weekInMonth, monthIndex, calYear, yearsPassed, currentAge };
};

export const getTimeLabel = (totalWeeks, startYear, startAge) => {
  const { weekInMonth, monthIndex, calYear } = getTimeInfo(totalWeeks, startYear, startAge);
  return `${MONTH_SHORT[monthIndex]} ${calYear} · Week ${weekInMonth}`;
};

// ─── TIER ─────────────────────────────────────────────────────────────────────
export const getTier = (fans) => {
  let t = MILESTONES[0];
  for (const m of MILESTONES) if (fans >= m.fans) t = m;
  return t;
};

// ─── TALENT ──────────────────────────────────────────────────────────────────
export const getTalent = (gs) => (gs.sw || 0) + (gs.vc || 0) + (gs.pd || 0) + (gs.lp || 0);

// ─── SONG QUALITY ────────────────────────────────────────────────────────────
export const calcSongQuality = (gs, producerId, featuredNpcIds = []) => {
  // Base: weighted sub-skills (each 0-25 → total max 100)
  const base = gs.sw * 0.35 + gs.vc * 0.30 + gs.pd * 0.25 + gs.lp * 0.10;
  const baseQ = base * 4; // scale to 0-100

  // Producer bonus
  const producer = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const prodBonus = producer.qBonus;

  // Genre specialization bonus (practicing your genre improves quality)
  const genreSpecBonus = Math.min(15, ((gs.genreBonus || {})[gs.genre] || 0) * 0.4);

  // Feature bonus (each featured NPC adds quality based on their talent)
  const featBonus = featuredNpcIds.reduce((acc, npcId) => {
    const npc = NPC_ARTISTS.find(n => n.id === npcId);
    return acc + (npc ? (npc.talent / 25) * 8 : 0);
  }, 0);

  return Math.min(99, Math.round(baseQ + prodBonus + genreSpecBonus + featBonus));
};

// ─── WEEKLY STREAMING INCOME ─────────────────────────────────────────────────
export const calcWeeklyIncome = (gs, label) => {
  if (!gs.catalog) return 0;
  let total = 0;
  const released = gs.catalog.filter(t => t.released && t.releaseWeek != null);
  for (const track of released) {
    const weeksOut = gs.totalWeeks - track.releaseWeek;
    if (weeksOut > 156) continue; // 3-year active life
    const decay = Math.max(0.02, 1 - weeksOut / 156);
    const cityBonus = 1.0; // could hook up to city data
    const base = (track.quality / 100) * Math.sqrt(gs.fans || 1) * 8;
    const labelMult = (label && label.id !== 'independent') ? label.marketingMult : 1;
    total += Math.round(base * decay * cityBonus * labelMult);
  }
  // Merch passive income
  if (gs.hasMerch) {
    const tierIncome = [0, 30000, 120000, 400000, 1200000][gs.merchTier || 1];
    total += Math.round(tierIncome * (gs.fans / Math.max(1, 50000)));
  }
  return total;
};

// ─── CHART GENERATION ────────────────────────────────────────────────────────
export const generateCharts = (gs, npcArtists) => {
  // Player songs
  const playerEntries = (gs.catalog || [])
    .filter(t => t.released)
    .map(t => {
      const weeksOut = gs.totalWeeks - (t.releaseWeek || 0);
      const recency  = Math.max(0.05, 1 - weeksOut / 80);
      const score    = t.quality * recency * (1 + (gs.fans / 500000) * 0.5);
      return { title: t.title, artist: gs.stageName || 'You', quality: t.quality, score, isPlayer: true, trackId: t.id };
    });

  // NPC songs (procedurally generated, seeded by week so they change monthly)
  const seed = Math.floor((gs.totalWeeks || 0) / 4); // changes monthly
  const npcEntries = npcArtists.slice(0, 15).map((npc, i) => {
    const titleIndex = (seed + i * 3 + npc.clout) % NPC_SONG_TITLES.length;
    const score = npc.clout * (0.7 + Math.sin(seed * 0.3 + i) * 0.3);
    return { title: NPC_SONG_TITLES[titleIndex], artist: npc.name, quality: Math.round(npc.talent * 4.5), score, isPlayer: false };
  });

  return [...playerEntries, ...npcEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((entry, i) => ({ ...entry, position: i + 1 }));
};

// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
const SAVE_KEY = 'treblr_v2_save';

export const saveGame = (gs) => {
  try {
    const payload = { ...gs, lastSaved: new Date().toISOString() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch { return false; }
};

export const loadGame = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export const deleteSave = () => {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
};

export const hasSave = () => {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
};

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
export const makeDefault = () => ({
  // Navigation
  screen: 'start',
  tab: 'play',

  // Identity
  stageName: '',
  realName: '',
  startAge: 22,
  genre: null,
  city: null,
  careerType: null,
  startYear: 2024,

  // Time
  totalWeeks: 0,

  // Finances (no cap — music mogul life)
  money: 0,
  taxAccum: 0,
  weeklyStreamIncome: 0,

  // Fame
  fans: 0,
  socialFollowers: 0,
  clout: 0,
  reputation: 50,

  // Sub-skills (each 0-25, talent = sum = 0-100)
  sw: 5,  // songwriting
  vc: 5,  // vocals
  pd: 5,  // production
  lp: 5,  // live performance

  // Genre specialization bonuses
  genreBonus: {},

  // Other skills
  hustle: 5,
  charisma: 5,
  network: 5,

  // Energy & AP
  energy: 100,
  ap: 7,

  // Music catalog
  catalog: [],   // track objects
  projects: [],  // EP / album objects

  // Label
  labelId: 'independent',
  labelRel: 80,
  recouped: 0,
  pressure: 0,

  // Team
  hasManager: false,
  hasLawyer: false,

  // Business
  hasMerch: false,
  merchTier: 0,
  brandDeals: [],
  tourActive: false,
  tourWeeksLeft: 0,
  tourEarnings: 0,

  // NPC
  npcRelations: {},
  npcCollabWeek: {},

  // Charts (generated)
  charts: [],
  lastChartWeek: -1,

  // Social
  socialPosts: 0,

  // Awards
  awards: [],
  awardNoms: 0,

  // Feed
  feed: [],

  // Meta
  lastSaved: null,
});
