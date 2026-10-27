import { createRng, hashString } from './rng.js';
import { cityById, pathById, TITLE_WORDS, COVER_GRADIENTS, MARKETS, CONTACT_SEED } from './data.js';
import { RIVALS, npcTitle, TIERS } from './npc.js';
import { computeCharts } from './charts.js';
import { generateWeeklyGoalsFor } from './weekly.js';
import { createRng as _rng } from './rng.js';
import { rivalSongPotential } from './model.js';
import { popularityFromListeners, scheduleRival, npcCover, uniqueRivalTitle } from './career.js';
import { applyRosterPack } from './business.js';
import { SONG_CERTS, certFor } from './data2.js';

export const SAVE_VERSION = 4;

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
    title: uniqueRivalTitle(state, rng, rival, () => npcTitle(rng, rival)),
    genre: rival.genre,
    quality: q,
    releasedWeek,
    weeklyStreams: 0,
    lifetimeStreams: 0,
    radio: 0,
    cover: npcCover(rng),
  };
}
void COVER_GRADIENTS;
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
  addV4Fields(state);
  state.player.popularity = popularityFromListeners(state.player.monthlyListeners);
  state.player.mlHistory = [state.player.monthlyListeners];

  const roster = setup.roster ? applyRosterPack(RIVALS, setup.roster) : RIVALS;
  seedRivalWorld(state, rng, roster);
  for (const a of setup.roster?.artists || []) {
    const r = state.rivals.find((x) => x.name.toLowerCase() === String(a.name).toLowerCase());
    if (r && typeof a.photo === 'string' && a.photo.startsWith('data:image/') && a.photo.length < 400000) state.artistPhotos[r.id] = a.photo;
  }
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
export function seedRivalWorld(state, rng, roster = RIVALS) {
  state.rivals = roster.map((r) => ({
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
      if (song.releasedWeek > -14) rival.eraSingles = [...(rival.eraSingles || []), song.id];
    }
    if (rival.tier !== 'rising' || rng.chance(0.4)) {
      state.nextId += 1;
      const rw = -rng.int(0, 30);
      const units = Math.round(rival.monthlyListeners * 0.0011 * (3 + Math.max(0, 1 - rw) * 0.3));
      state.rivalAlbums.push({ id: `ra${state.nextId}`, rivalId: rival.id, type: 'album', tracks: rng.int(10, 16), songIds: [], title: uniqueRivalTitle(state, rng, rival, () => npcTitle(rng, rival)), releasedWeek: rw, cover: npcCover(rng), firstWeek: Math.round(units / 2), totalUnits: units });
    }
    scheduleRival(rival, rng, 1, true);
  }
}

// Fields added in save v4 (2026-10-27 systems).
export function addV4Fields(s) {
  const p = s.player;
  p.skills.acting = p.skills.acting ?? 0;
  p.fame = p.fame || { tier: 'unknown', points: 0 };
  p.mlHistory = p.mlHistory || [p.monthlyListeners];
  p.stats = p.stats || { no1: [], top10: [], weeksOnChart: {}, streamMarks: {}, listenerMarks: [], tickets: 0, ticketMarks: [] };
  p.chartBanUntil = p.chartBanUntil ?? null;
  s.bank = s.bank || { loans: [], onTime: 0, late: 0, defaults: 0, incomeLog: [], firstLoanWeek: null, banUntil: null };
  s.lifestyle = s.lifestyle || { owned: [], rental: null };
  s.acting = s.acting || { credits: [], current: null, lastAudition: null };
  s.festivals = s.festivals || {};
  s.distributor = s.distributor || 'tunewire';
  s.distributorPaidYear = s.distributorPaidYear ?? Math.floor((s.week - 1) / 52);
  s.statFeed = s.statFeed || [];
  s.firstWeeks = s.firstWeeks || [];
  s.offerLog = s.offerLog || {};
  s.cloud = s.cloud || { followers: Math.round((p.fans || 0) * 0.1), uploads: [] };
  s.tours = s.tours || [];
  s.awardSubmission = s.awardSubmission ?? null;
  return s;
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

export { popularityFromListeners };

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
  // v3 -> v4: rolling fame, new certification ladders, contracts, bank, lifestyle, acting, festivals,
  // NPC release schedules and album units. Everything the player made is kept.
  3: (s) => {
    const rng = _rng((s.seed ^ 0x4a4a) >>> 0);
    addV4Fields(s);
    const p = s.player;
    p.mlHistory = [p.monthlyListeners];
    p.popularity = popularityFromListeners(p.monthlyListeners);
    p.maxEnergy = Math.max(p.maxEnergy || 100, 80);
    // old label shape { id, name, royalty, signedWeek } -> open-ended legacy contract
    if (p.label && p.label.endWeek === undefined) p.label = { ...p.label, advance: 0, recouped: 0, albums: 1, delivered: 0, yearsPerAlbum: 3, endWeek: null, control: 'shared', strict: 0.2, breach: false, nextDue: null };
    for (const so of s.songs) { so.cert = certFor(so.lifetimeStreams || 0, SONG_CERTS)?.id || null; so.reception = so.reception ?? 1; }
    for (const r of s.releases) if (r.status === 'out' && r.type !== 'single') r.totalUnits = r.totalUnits ?? Math.round(r.songIds.reduce((a, id) => a + (s.songs.find((x) => x.id === id)?.lifetimeStreams || 0), 0) / 2500);
    for (const x of s.rivalSongs) if (!x.cover?.style) x.cover = npcCover(rng);
    for (const a of s.rivalAlbums) { if (!a.cover?.style) a.cover = npcCover(rng); a.type = a.type || 'album'; a.songIds = a.songIds || []; a.tracks = a.tracks || 12; a.totalUnits = a.totalUnits ?? 0; }
    for (const r of s.rivals) { r.eraSingles = s.rivalSongs.filter((x) => x.rivalId === r.id && s.week - x.releasedWeek < 14).map((x) => x.id); scheduleRival(r, rng, s.week, true); }
    for (const n of s.notifications || []) n.read = n.read || s.week - n.week > 2;
    s.version = 4;
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
