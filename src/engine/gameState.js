const SAVE_KEY = 'treblr_v3_save';

export const makeDefault = () => ({
  screen: 'start',
  tab: 'home',

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

  // Finances
  money: 0,
  taxAccum: 0,
  weeklyStreamIncome: 0,

  // Fame
  fans: 0,
  clout: 0,
  reputation: 50,

  // Social followers per platform
  socialPlatforms: {
    soundstream: 0,
    instapic:    0,
    chirp:       0,
    vidtube:     0,
    rhythmtok:   0,
    soundcloud:  0,
  },

  // Sub-skills (each 0-25)
  sw: 5,   // songwriting
  vc: 5,   // vocals
  pd: 5,   // production
  lp: 5,   // live performance
  hustle: 5,
  charisma: 5,
  network: 5,
  genreBonus: {},

  // Resources v3
  energy: 100,
  sp: 5,          // skill points (weekly)
  se: 7,          // social energy (weekly)
  maxSe: 7,

  // Music catalog
  catalog: [],   // track objects
  projects: [],  // EP / album objects

  // Cooldowns (stored as week numbers)
  lastReleaseWeek: -99,
  lastMerchWeek:   -99,
  lastBrandWeek:   {},
  tourCooldownEnd: 0,

  // Label
  labelId: 'independent',
  labelRel: 80,
  recouped: 0,
  pressure: 0,

  // Team
  hasManager: false,
  hasLawyer: false,

  // Business
  activeMerchDrops: [],   // { type, qty, price, cost, revenue, weeksLeft, weekStarted }
  brandDeals: [],
  tourActive: false,
  tourData: null,
  tourWeeksLeft: 0,
  tourEarnings: 0,

  // Personal label
  ownLabel: null,  // { name, aesthetic, budget, reputation }

  // NPC
  npcRelations: {},
  npcCatalog: [],     // generated NPC songs
  npcLastRelease: {}, // npcId -> lastReleaseWeek

  // Charts
  charts: {
    streams: [],
    sales: [],
    videos: [],
  },

  // Weekly report (shown after each end-week)
  weekReport: null,

  // News feed
  news: [],

  // Awards
  awards: [],
  awardNoms: 0,

  // Career log
  feed: [],

  // Meta
  lastSaved: null,
});

export const saveGame = (gs) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...gs, lastSaved: new Date().toISOString() }));
    return true;
  } catch { return false; }
};

export const loadGame = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const deleteSave = () => {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
};

export const hasSave = () => {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
};
