import { describe, it, expect } from 'vitest';
import {
  createNewGame, advanceWeek, writeSong, recordSong, releaseMusic, playGig, doJob, respondOffer,
  migrate, saveGame, loadGame, listSaves, SAVE_VERSION, CHARTS, RIVALS, CITIES, GENRES, MARKETS,
  computeCharts, movement, playerPositions, upNext, goalProgress, calendarEvents, createRng, decay,
} from './index.js';

const setup = { firstName: 'Sam', lastName: 'Lee', stageName: 'SAMLEE', city: 'tor', age: 22, genre: 'pop', subgenres: ['Synth-Pop'], path: 'bedroom' };
const fresh = (over = {}) => createNewGame({ ...setup, ...over }, 12345);

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function makeReleasedSong(state, producer = 'hitmaker') {
  let r = writeSong(state, { title: 'Test Song', genre: 'pop', theme: 'Love', length: 180, cowriter: 'none' });
  const id = r.state.songs[0].id;
  r.state.player.cash += 50000;
  r = recordSong(r.state, { songId: id, producerId: producer });
  r = releaseMusic(r.state, { type: 'single', songIds: [id], rollout: 'standard' });
  return { state: r.state, id };
}

describe('world data is global', () => {
  it('spans many countries, genres and markets', () => {
    expect(new Set(CITIES.map((c) => c.country)).size).toBeGreaterThanOrEqual(20);
    expect(new Set(RIVALS.map((r) => r.country)).size).toBeGreaterThanOrEqual(20);
    expect(new Set(RIVALS.map((r) => r.genre)).size).toBeGreaterThanOrEqual(13);
    expect(GENRES.length).toBe(14);
    expect(MARKETS.map((m) => m.code)).toEqual(['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'KR', 'BR', 'MX', 'NG', 'AU', 'IN']);
    expect(CHARTS.length).toBe(16);
  });
});

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(7); const b = createRng(7);
    expect([a.next(), a.next(), a.int(1, 100)]).toEqual([b.next(), b.next(), b.int(1, 100)]);
  });
});

describe('new game', () => {
  it('applies career path and fills charts', () => {
    const s = fresh();
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.player.cash).toBe(1500);
    expect(s.charts.hot100).toHaveLength(100);
    expect(s.charts.global).toHaveLength(50);
    expect(s.charts.album.length).toBeGreaterThan(20);
    for (const m of MARKETS) expect(s.charts[m.code].length).toBe(40);
  });
  it('is deterministic for the same seed', () => {
    expect(advanceWeek(fresh()).charts.hot100).toEqual(advanceWeek(fresh()).charts.hot100);
  });
});

describe('actions', () => {
  it('writing costs energy and creates a song', () => {
    const s = fresh();
    const r = writeSong(s, { title: 'Hello', genre: 'pop', theme: 'Love', length: 180, cowriter: 'none' });
    expect(r.ok).toBe(true);
    expect(r.state.player.energy).toBe(70);
    expect(r.state.songs[0].status).toBe('written');
    expect(s.songs).toHaveLength(0); // original untouched
  });
  it('refuses when out of energy', () => {
    let s = fresh();
    s.player.energy = 10;
    const r = writeSong(s, { title: 'X', genre: 'pop', length: 180 });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });
  it('jobs pay cash', () => {
    const r = doJob(fresh(), { jobId: 'barista' });
    expect(r.ok).toBe(true);
    expect(r.state.player.cash).toBeGreaterThan(1500);
  });
  it('gigs sell tickets in the home city', () => {
    const r = playGig(fresh(), { venueId: 'bar', cityId: 'tor' });
    expect(r.ok).toBe(true);
    expect(r.data.sold).toBeGreaterThan(0);
  });
});

describe('weekly tick', () => {
  it('advances the week, refills energy, charges rent and writes a report', () => {
    let s = fresh();
    s.player.energy = 60;
    const n = advanceWeek(s);
    expect(n.week).toBe(2);
    expect(n.player.energy).toBe(n.player.maxEnergy - (n.lastReport.events.some((e) => /Food poisoning/.test(e)) ? 25 : 0));
    expect(n.player.maxEnergy).toBe(100);
    expect(n.lastReport.week).toBe(1);
    expect(n.lastReport.expense.rent).toBe(250);
    expect(typeof n.lastReport.headline).toBe('string');
    expect(n.history).toHaveLength(1);
  });
  it('released songs stream, earn and gain fans', () => {
    const { state, id } = makeReleasedSong(fresh());
    const n = advanceWeek(state);
    const song = n.songs.find((x) => x.id === id);
    expect(song.status).toBe('released');
    expect(song.weeklyStreams).toBeGreaterThan(0);
    expect(n.lastReport.income.streams).toBeGreaterThan(0);
    expect(n.player.lifetimeStreams).toBe(song.weeklyStreams);
  });
  it('streams decay over time after the peak', () => {
    expect(decay(50, 1)).toBe(1);
    expect(decay(50, 10)).toBeLessThan(decay(50, 3));
    expect(decay(90, 10)).toBeGreaterThan(decay(30, 10));
  });
  it('rivals keep releasing and offers expire', () => {
    let s = fresh();
    s.player.fans = 50000;
    const songsBefore = s.rivalSongs.length;
    for (let i = 0; i < 12; i++) s = advanceWeek(s);
    expect(s.week).toBe(13);
    expect(s.rivalSongs.some((x) => x.releasedWeek > 1)).toBe(true);
    expect(s.rivalSongs.length).toBeGreaterThan(songsBefore * 0.5);
    expect(s.inbox.some((m) => m.type === 'offer')).toBe(true);
    expect(s.inbox.filter((m) => m.type === 'offer' && !m.status).every((m) => m.expires >= s.week)).toBe(true);
    expect(s.news.length).toBeGreaterThan(5);
  });
  it('accepting an offer pays out once', () => {
    let s = fresh();
    s.player.fans = 50000;
    for (let i = 0; i < 6 && !s.inbox.some((m) => m.type === 'offer' && !m.status); i++) s = advanceWeek(s);
    const offer = s.inbox.find((m) => m.type === 'offer' && !m.status);
    expect(offer).toBeTruthy();
    s.player.energy = 100;
    const r = respondOffer(s, { id: offer.id, accept: true });
    expect(r.ok).toBe(true);
    expect(respondOffer(r.state, { id: offer.id, accept: true }).ok).toBe(false);
  });
});

describe('charts', () => {
  it('ranks by score and tracks movement', () => {
    const s = fresh();
    const hot = s.charts.hot100;
    for (let i = 1; i < hot.length; i++) expect(hot[i - 1].s).toBeGreaterThanOrEqual(hot[i].s);
    const next = computeCharts(s, s.charts);
    expect(next.hot100[0].w).toBe(2);
    expect(movement({ r: 3, p: 5 }).kind).toBe('up');
    expect(movement({ r: 5, p: 3 }).kind).toBe('down');
    expect(movement({ r: 5, p: null }).label).toBe('NEW');
  });
  it('a strong player song can enter charts and is flagged as the player', () => {
    let { state } = makeReleasedSong(fresh({ path: 'plant', city: 'los', genre: 'afrobeats' }), 'legend');
    state.player.fans = 3_000_000;
    state.player.monthlyListeners = 25_000_000;
    const n = advanceWeek(state);
    const pos = playerPositions(n);
    expect(pos.length).toBeGreaterThan(0);
    expect(pos.every((x) => n.charts[x.chartId].find((e) => e.id === x.id).pl)).toBe(true);
    expect(n.player.chartEntries).toBeGreaterThan(0);
  });
});

describe('home helpers', () => {
  it('up next suggests writing for a new player', () => {
    const cards = upNext(fresh());
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(cards.some((c) => c.to.tab === 'studio')).toBe(true);
  });
  it('goals report progress and calendar lists award shows', () => {
    const g = goalProgress(fresh());
    expect(g.find((x) => x.id === 'fans1k').pct).toBeCloseTo(0.05);
    let s = fresh();
    expect(calendarEvents(s, 1, 10).some((e) => e.type === 'award')).toBe(true);
  });
});

describe('save / load / migrate', () => {
  it('round-trips through storage across 3 slots', () => {
    const st = memStorage();
    const s = advanceWeek(fresh());
    expect(saveGame(s, 2, st)).toBe(true);
    const loaded = loadGame(2, st);
    expect(loaded.week).toBe(2);
    expect(loaded.player.stageName).toBe('SAMLEE');
    const slots = listSaves(st);
    expect(slots).toHaveLength(3);
    expect(slots[1].stageName).toBe('SAMLEE');
    expect(slots[0].empty).toBe(true);
  });
  it('migrates v1 saves through v2 to the current version', () => {
    const s = fresh();
    const v1 = JSON.parse(JSON.stringify(s));
    v1.version = 1;
    delete v1.player.socialEnergy;
    delete v1.player.maxSocial;
    delete v1.goals;
    const m = migrate(v1);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.player.socialEnergy).toBe(50);
    expect(m.goals).toEqual({});
    expect(advanceWeek(m).week).toBe(2);
  });
  it('rejects legacy and future saves', () => {
    expect(migrate({ player: {} })).toBeNull();
    expect(migrate({ version: 99, player: {} })).toBeNull();
    expect(migrate(null)).toBeNull();
  });
});

describe('long run stability', () => {
  it('runs 60 weeks with an active player without NaN', () => {
    let { state: s } = makeReleasedSong(fresh());
    for (let i = 0; i < 60; i++) {
      s = advanceWeek(s);
      if (i % 5 === 0) s = doJob(s, { jobId: 'barista' }).state;
    }
    const p = s.player;
    for (const v of [p.cash, p.fans, p.monthlyListeners, p.popularity, p.hype]) expect(Number.isFinite(v)).toBe(true);
    expect(JSON.stringify(s).length).toBeLessThan(1_500_000);
  });
});
