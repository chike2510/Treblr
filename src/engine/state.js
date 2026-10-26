import { createRng, hashString } from './rng.js';
import { cityById, pathById, TITLE_WORDS, COVER_GRADIENTS, MARKETS, CONTACT_SEED } from './data.js';
import { RIVALS, npcTitle, TIERS } from './npc.js';
import { computeCharts } from './charts.js';
import { generateWeeklyGoalsFor } from './weekly.js';
import { createRng as _rng } from './rng.js';
import { rivalSongPotential } from './model.js';

export const SAVE_VERSION = 3;

export function randomTitle(rng) {
  const r = rng || { pick: (a) => a[Math.floor(Math.random() * a.length)], chance: (p) => Math.random() < p };
  const a = r.pick(TITLE_WORDS.a);
  const b = r.pick(TITLE_WORDS.b);
  return r.chance(0.25) ? b : `${a} ${b}`;
}

export function rivalBaseListeners(basePop) {
  return Math.round(Math.pow(10, 3.8 + basePop * 0.045));
}

function makeRivalSong(state, rng, rival, releasedWeek) {
  const q = Math.round(Math.min(98, Math.max(35, rng.float(45, 70) + rival.basePop * 0.25)));
  state.nextId += 1;
  return {
    id: `rs${state.nextId}`,
    rivalId: rival.id,
    title: npcTitle(rng, rival),
    genre: rival.genre,
    quality: q,
    releasedWeek,
    weeklyStreams: 0,
    lifetimeStreams: 0,
    radio: 0,
    cover: { gradient: rng.int(0, COVER_GRADIENTS.length - 1) },
  };
}
export { makeRivalSong };

export function createNewGame(setup, seed) {
  const s0 = seed ?? hashString(`${setup.stageName}|${Date.now()}`);
  const rng = createRng(s0);
  const path = pathById(setup.path);
  const city = cityById(setup.city);
  const state = {
    version: SAVE_VERSION,
    seed: s0,
    rng: 0,
    nextId: 100,
    week: 1,
    player: {
      firstName: setup.firstName || 'Alex',
      lastName: setup.lastName || 'Rivera',
      stageName: setup.stageName || 'Alex Rivera',
      age: setup.age || 21,
      city: city.id,
      country: city.country,
      genre: setup.genre || 'pop',
      subgenres: setup.subgenres || [],
      path: path.id,
      photo: setup.photo || null,
      skills: { ...path.skills },
      cash: path.cash,
      fans: path.fans,
      hype: path.hype,
      popularity: 0,
      monthlyListeners: Math.round(path.fans * 0.6),
      energy: 100,
      maxEnergy: 100,
      socialEnergy: 50,
      maxSocial: 50,
      followers: { chirp: Math.round(path.fans * 0.5), snapshot: Math.round(path.fans * 0.6), clipz: Math.round(path.fans * (path.id === 'viral' ? 2.5 : 0.4)), viewtube: Math.round(path.fans * 0.2) },
      suspicion: path.suspicion || 0,
      label: path.label ? { ...path.label, signedWeek: 1 } : null,
      staff: { manager: false, publicist: false, booking: false },
      fanHeat: { [city.id]: path.fans },
      rested: false,
      lifetimeStreams: 0,
      bestRank: null,
      sellouts: 0,
      chartEntries: 0,
      awards: [],
    },
    songs: [],
    releases: [],
    rivals: [],
    rivalSongs: [],
    rivalAlbums: [],
    charts: {},
    inbox: [],
    news: [],
    transactions: [],
    history: [],
    social: { chirp: [], snapshot: [], clipz: [], videos: [] },
    goals: {},
    ledger: { income: {}, expense: {} },
    weekFlags: {},
    lastReport: null,
  };
  addV3Fields(state);
  state.player.popularity = popularityFromListeners(state.player.monthlyListeners);

  seedRivalWorld(state, rng);
  state.inbox.push({
    id: 'welcome', type: 'dm', from: 'Treblr', subject: `Welcome to Treblr, ${state.player.stageName}`,
    body: `Your career starts now in ${city.name}. Write a song in the Studio, keep an eye on your energy, and hit Next Week when you're done. The world is listening.`,
    week: 1, read: false,
  });
  state.charts = computeCharts(state, {}, true);
  state.weekly = generateWeeklyGoalsFor(state, rng);
  state.rng = rng.state();
  void MARKETS;
  return state;
}

// Rivals (real-world roster + a few fictional rising acts) with back-catalogues so charts are full.
export function seedRivalWorld(state, rng) {
  state.rivals = RIVALS.map((r) => ({
    ...r,
    monthlyListeners: Math.round(r.baseML * rng.float(0.97, 1.03)),
    lastMove: 'Quiet week in the studio',
    lastReleaseWeek: -rng.int(1, Math.round(1 / (TIERS[r.tier]?.cadence || 0.01) / 6)),
  }));
  state.rivalSongs = [];
  state.rivalAlbums = [];
  for (const rival of state.rivals) {
    const n = rival.tier === 'superstar' ? rng.int(3, 5) : rival.tier === 'star' ? rng.int(2, 4) : rng.int(1, 3);
    for (let i = 0; i < n; i++) {
      const song = makeRivalSong(state, rng, rival, -rng.int(0, 24));
      const age = Math.max(0, 1 - song.releasedWeek);
      song.weeklyStreams = Math.round(rivalSongPotential(rival, song, age) * rng.float(0.9, 1.1));
      song.lifetimeStreams = song.weeklyStreams * (age + 1) * 1.6;
      state.rivalSongs.push(song);
    }
    if (rival.tier !== 'rising' || rng.chance(0.4)) {
      state.nextId += 1;
      state.rivalAlbums.push({ id: `ra${state.nextId}`, rivalId: rival.id, title: npcTitle(rng, rival), releasedWeek: -rng.int(0, 30), cover: { gradient: rng.int(0, 7) } });
    }
  }
}

// Fields added in save v3 (new games and migrated saves).
export function addV3Fields(s) {
  const p = s.player;
  p.burnout = p.burnout ?? 0;
  p.chartStreak = p.chartStreak ?? 0;
  p.bestStreak = p.bestStreak ?? 0;
  p.gigLog = p.gigLog || {};
  p.lastReleaseWeek = p.lastReleaseWeek ?? null;
  p.relationship = p.relationship || { status: 'single', partnerId: null, since: null };
  p.maxEnergy = p.maxEnergy || 100;
  s.timeline = s.timeline || [];
  s.weekStats = s.weekStats || {};
  s.weekly = s.weekly || null;
  s.spotlight = s.spotlight ?? null;
  s.eras = s.eras || [];
  s.eraId = s.eraId ?? null;
  s.contacts = s.contacts || CONTACT_SEED.map((c) => ({ ...c, thread: [{ from: 'them', text: c.role === 'manager' ? 'Saw your stuff online. Let\u2019s talk when you\u2019re ready to get serious.' : c.role === 'producer' ? 'Got some beats you might like. Studio\u2019s open.' : 'Proud of you for actually doing this!! 🎉', week: s.week }], unread: 1 }));
  s.drama = s.drama ?? null;
  s.crisis = s.crisis ?? null;
  s.notifications = s.notifications || [];
  s.awardEvent = s.awardEvent ?? null;
  s.wrapped = s.wrapped || [];
  s.yearStats = s.yearStats || { streams: 0, songs: {}, countries: {}, bestPeak: null, startListeners: p.monthlyListeners, startFans: p.fans };
  s.tour = s.tour ?? null;
  s.artistPhotos = s.artistPhotos || {};
  s.headlineLog = s.headlineLog || [];
  s.social = s.social || {};
  for (const k of ['chirp', 'snapshot', 'clipz', 'videos', 'streams']) s.social[k] = s.social[k] || [];
  return s;
}

export function popularityFromListeners(ml) {
  return Math.max(0, Math.min(100, Math.round((Math.log10(ml + 1) - 2) * 17)));
}

// ---------- Save / load ----------
const KEY = (slot) => `treblr:save:${slot}`;
const META = 'treblr:meta';

const MIGRATIONS = {
  // v1 saves predate the social energy budget and goal tracking.
  1: (s) => {
    s.player.socialEnergy = s.player.socialEnergy ?? 50;
    s.player.maxSocial = s.player.maxSocial ?? 50;
    s.goals = s.goals || {};
    s.social = s.social || { chirp: [], snapshot: [], clipz: [], videos: [] };
    s.version = 2;
    return s;
  },
  // v2 -> v3: real-world NPC roster, new systems (timeline, goals, eras, contacts, tours...).
  // The old fictional rival roster is replaced; player songs, peaks and releases are kept.
  2: (s) => {
    const rng = _rng((s.seed ^ 0x5eed) >>> 0);
    addV3Fields(s);
    seedRivalWorld(s, rng);
    for (const song of s.songs) if (song.status === 'released') song.releasedWeek = song.releasedWeek ?? s.week;
    const lastOut = s.releases.filter((r) => r.status === 'out').sort((a, b) => b.releaseWeek - a.releaseWeek)[0];
    s.player.lastReleaseWeek = lastOut ? lastOut.releaseWeek : null;
    s.charts = computeCharts(s, {});
    s.weekly = generateWeeklyGoalsFor(s, rng);
    s.version = 3;
    return s;
  },
};

export function migrate(save) {
  if (!save || typeof save !== 'object' || !save.player) return null;
  if (typeof save.version !== 'number') return null; // legacy (pre-rebuild) saves are not compatible
  let s = save;
  while (s.version < SAVE_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) return null;
    s = step(s);
  }
  if (s.version > SAVE_VERSION) return null;
  return s;
}

export function serialize(state) {
  return JSON.stringify({ ...state, savedAt: Date.now() });
}

export function saveGame(state, slot, storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    storage.setItem(KEY(slot), serialize(state));
    storage.setItem(META, JSON.stringify({ slot }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slot, storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY(slot));
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function deleteSave(slot, storage = globalThis.localStorage) {
  storage?.removeItem(KEY(slot));
}

export function listSaves(storage = globalThis.localStorage) {
  return [1, 2, 3].map((slot) => {
    const s = loadGame(slot, storage);
    return s ? { slot, stageName: s.player.stageName, week: s.week, fans: s.player.fans, savedAt: s.savedAt, photo: s.player.photo || null, genre: s.player.genre, city: s.player.city } : { slot, empty: true };
  });
}

export function lastSlot(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(META) || '{}').slot || null;
  } catch {
    return null;
  }
}
