import { createRng, hashString } from './rng.js';
import { RIVALS, cityById, pathById, TITLE_WORDS, COVER_GRADIENTS, MARKETS } from './data.js';
import { computeCharts } from './charts.js';
import { rivalSongPotential } from './model.js';

export const SAVE_VERSION = 2;

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
    title: randomTitle(rng),
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
    rivals: RIVALS.map((r) => ({ ...r, monthlyListeners: rivalBaseListeners(r.basePop), lastMove: 'Quiet week in the studio', lastReleaseWeek: -rng.int(1, 12) })),
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
  state.player.popularity = popularityFromListeners(state.player.monthlyListeners);

  // Seed rival back-catalogues so charts are full on week 1.
  for (const rival of state.rivals) {
    const n = rng.int(3, 5);
    for (let i = 0; i < n; i++) {
      const song = makeRivalSong(state, rng, rival, -rng.int(0, 24));
      const age = Math.max(0, 1 - song.releasedWeek);
      song.weeklyStreams = Math.round(rivalSongPotential(rival, song, age) * rng.float(0.9, 1.1));
      song.lifetimeStreams = song.weeklyStreams * (age + 1) * 1.6;
      state.rivalSongs.push(song);
    }
    state.nextId += 1;
    state.rivalAlbums.push({ id: `ra${state.nextId}`, rivalId: rival.id, title: randomTitle(rng), releasedWeek: -rng.int(0, 30), cover: { gradient: rng.int(0, 7) } });
  }
  state.inbox.push({
    id: 'welcome', type: 'dm', from: 'Treblr', subject: `Welcome to Treblr, ${state.player.stageName}`,
    body: `Your career starts now in ${city.name}. Write a song in the Studio, keep an eye on your energy, and hit Next Week when you're done. The world is listening.`,
    week: 1, read: false,
  });
  state.charts = computeCharts(state, {}, true);
  state.rng = rng.state();
  void MARKETS;
  return state;
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
