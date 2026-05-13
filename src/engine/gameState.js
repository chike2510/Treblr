const SAVE_KEY = 'treblr_v3_save';

export const makeDefault = () => ({
  screen: 'start',
  tab: 'home',

  stageName: '',
  realName: '',
  startAge: 22,
  genre: null,
  city: null,
  careerType: null,
  startYear: 2024,

  totalWeeks: 0,

  money: 0,
  taxAccum: 0,
  weeklyStreamIncome: 0,

  fans: 0,
  clout: 0,
  reputation: 50,

  // Social followers per platform (updated names)
  socialPlatforms: {
    soundify:  0,   // Spotify clone (was soundstream)
    instapic:  0,
    chirp:     0,
    vidtube:   0,
    rhythmtok: 0,
    wavelog:   0,   // SoundCloud clone (was soundcloud)
  },

  sw: 5, vc: 5, pd: 5, lp: 5,
  hustle: 5, charisma: 5, network: 5,
  genreBonus: {},

  energy: 100,
  sp: 5,
  se: 7,
  maxSe: 7,

  catalog: [],
  projects: [],

  lastReleaseWeek: -99,
  lastMerchWeek:   -99,
  lastBrandWeek:   {},
  tourCooldownEnd: 0,

  labelId: 'independent',
  labelRel: 80,
  recouped: 0,
  pressure: 0,

  hasManager: false,
  hasLawyer: false,

  activeMerchDrops: [],
  brandDeals: [],
  tourActive: false,
  tourData: null,
  tourWeeksLeft: 0,
  tourEarnings: 0,

  activeJob: null,

  inPrison: false,
  prisonWeeksLeft: 0,

  totalLifetimeStreams: 0,
  weeklyStreamCount: 0,

  avatarUrl: null,

  // Own label
  ownLabel: null,  // { name, aesthetic, budget, reputation }

  npcRelations: {},
  npcCatalog: [],
  npcLastRelease: {},

  charts: { streams: [], sales: [], videos: [] },
  latestChartSnapshot: null,

  weekReport: null,
  news: [],
  awards: [],
  awardNoms: 0,
  feed: [],

  // Pending effects from endWeek (consumed by Game.jsx via useEffect)
  _pendingToast: null,
  _pendingModal: null,

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
    if (!raw) return null;
    const gs = JSON.parse(raw);
    // Migrate old soundstream/soundcloud keys
    if (gs.socialPlatforms) {
      if (gs.socialPlatforms.soundstream !== undefined && gs.socialPlatforms.soundify === undefined) {
        gs.socialPlatforms.soundify = gs.socialPlatforms.soundstream;
        delete gs.socialPlatforms.soundstream;
      }
      if (gs.socialPlatforms.soundcloud !== undefined && gs.socialPlatforms.wavelog === undefined) {
        gs.socialPlatforms.wavelog = gs.socialPlatforms.soundcloud;
        delete gs.socialPlatforms.soundcloud;
      }
    }
    return gs;
  } catch { return null; }
};

export const deleteSave = () => {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
};

export const hasSave = () => {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
};
