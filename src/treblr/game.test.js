import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer, persistCareer, readSavedCareer, SAVE_KEY } from './game.js';

const nightRoom = { room: 'Lantern Room', title: 'Never at Rest', genre: 'Alternative R&B', producer: 'Ari Madu', cost: 62000, energy: 12, quality: 78, cover: '/cover.jpg', color: 'moss' };

describe('Treblr career simulation', () => {
  it('turns a paid session choice into a local release-ready demo and charges its trade-off', () => {
    const initial = createInitialState();
    const next = gameReducer(initial, { type: 'SESSION', session: nightRoom });
    expect(next.player.cash).toBe(initial.player.cash - 62000);
    expect(next.player.energy).toBe(initial.player.energy - 12);
    expect(next.releases[0]).toMatchObject({ title: 'Never at Rest', status: 'In progress', quality: 78 });
    expect(next.activity[0].tag).toBe('SESSION');
    expect(gameReducer(initial, { type: 'SESSION', session: { ...nightRoom, cost: 9_000_000 } })).toBe(initial);
  });

  it('schedules an unreleased master after explaining the spend and waits until its release week to stream', () => {
    const initial = createInitialState();
    const plan = { name: 'Independent PR week', cost: 76000, duration: 2, boost: 0.31, energy: 5 };
    const scheduled = gameReducer(initial, { type: 'CAMPAIGN', releaseId: 'soft-static', plan });
    const demo = scheduled.releases.find(item => item.id === 'soft-static');
    expect(demo).toMatchObject({ status: 'Scheduled', releaseWeek: 39, campaign: { remaining: 2 } });
    expect(scheduled.player.cash).toBe(initial.player.cash - 76000);
    const next = gameReducer(scheduled, { type: 'WEEK' });
    expect(next.week).toBe(39);
    expect(next.releases.find(item => item.id === 'soft-static').streams).toBe(0);
    const afterReleaseWeek = gameReducer(next, { type: 'WEEK' });
    expect(afterReleaseWeek.releases.find(item => item.id === 'soft-static').status).toBe('Released');
    expect(afterReleaseWeek.releases.find(item => item.id === 'soft-static').streams).toBeGreaterThan(0);
  });

  it('turns an accepted booking into a future show, then settles income and progression at week close', () => {
    const initial = createInitialState();
    const accepted = gameReducer(initial, { type: 'OPPORTUNITY', id: 'canopy-accra', accept: true });
    expect(accepted.player.cash).toBe(initial.player.cash - 68000);
    expect(accepted.bookings[0]).toMatchObject({ week: initial.week + 1, status: 'Confirmed', payout: 180000 });
    const oneWeek = gameReducer(accepted, { type: 'WEEK' });
    const settled = gameReducer(oneWeek, { type: 'WEEK' });
    expect(settled.lastReport.week).toBe(initial.week + 1);
    expect(settled.lastReport.income).toBeGreaterThan(180000);
    expect(settled.player.fans).toBeGreaterThan(initial.player.fans);
    expect(settled.player.listeners).toBeGreaterThan(initial.player.listeners);
    expect(settled.week).toBe(initial.week + 2);
    expect(settled.worldSeed).toBe(settled.week);
    expect(settled.activity.some(item => item.tag === 'WORLD')).toBe(true);
  });

  it('makes the label license consequential and allows a no-cost pass', () => {
    const initial = createInitialState();
    const signed = gameReducer(initial, { type: 'OPPORTUNITY', id: 'northline', accept: true });
    expect(signed.labelDeal).toMatchObject({ partner: 'Northline', share: '20% of master net' });
    expect(signed.player.cash).toBe(initial.player.cash + 420000);
    expect(signed.player.reputation).toBe(initial.player.reputation + 5);
    const passed = gameReducer(initial, { type: 'OPPORTUNITY', id: 'northline', accept: false });
    expect(passed.player.cash).toBe(initial.player.cash);
    expect(passed.opportunities.find(item => item.id === 'northline').status).toBe('Passed');
  });

  it('persists and reloads this branch’s versioned local career without external services', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const state = { ...createInitialState(), week: 44 };
    expect(persistCareer(state, storage)).toBe(true);
    expect(values.has(SAVE_KEY)).toBe(true);
    expect(readSavedCareer(storage).week).toBe(44);
    expect(readSavedCareer({ getItem: () => '{bad json' }).week).toBe(38);
  });
});


it('treats an album package as a real spend, a longer horizon and a wider modeled audience', () => {
  const initial = createInitialState();
  const plan = { name: 'Street team / city-first', cost: 143000, baseCost: 28000, format: 'Album', formatCost: 115000, duration: 1, boost: 0.12, energy: 3 };
  const scheduled = gameReducer(initial, { type: 'CAMPAIGN', releaseId: 'soft-static', plan });
  const album = scheduled.releases.find(item => item.id === 'soft-static');
  expect(album).toMatchObject({ type: 'Album', status: 'Scheduled', releaseWeek: 42, formatMultiplier: 3.5 });
  expect(album.tracklist).toHaveLength(9);
  expect(scheduled.player.cash).toBe(initial.player.cash - 143000);
  let state = scheduled;
  for (let i = 0; i < 4; i++) state = gameReducer(state, { type: 'WEEK' });
  expect(state.releases.find(item => item.id === 'soft-static').status).toBe('Scheduled');
  state = gameReducer(state, { type: 'WEEK' });
  const released = state.releases.find(item => item.id === 'soft-static');
  expect(released.status).toBe('Released');
  expect(released.streams).toBeGreaterThan(3000);
});

it('schedules a three-city tour and festival as future bookings with payouts after each event', () => {
  const initial = createInitialState();
  const tour = gameReducer(initial, { type: 'OPPORTUNITY', id: 'blue-line-tour', accept: true });
  expect(tour.player.cash).toBe(initial.player.cash - 210000);
  expect(tour.bookings.map(item => item.week)).toEqual([39, 40, 41]);
  let tourAfter = tour;
  for (let i = 0; i < 4; i++) tourAfter = gameReducer(tourAfter, { type: 'WEEK' });
  expect(tourAfter.bookings.every(item => item.status === 'Played')).toBe(true);
  expect(tourAfter.bookings.reduce((sum, item) => sum + item.payout, 0)).toBe(660000);

  const festival = gameReducer(initial, { type: 'OPPORTUNITY', id: 'riverlight-festival', accept: true });
  expect(festival.bookings[0]).toMatchObject({ week: 40, payout: 290000, kind: 'festival' });
  let festivalAfter = festival;
  for (let i = 0; i < 3; i++) festivalAfter = gameReducer(festivalAfter, { type: 'WEEK' });
  expect(festivalAfter.bookings[0].status).toBe('Played');
  expect(festivalAfter.lastReport.income).toBeGreaterThanOrEqual(290000);
});

it('rotates new publicity pressure into the inbox and settles its listener/fan trade-off', () => {
  const initial = createInitialState();
  const nextWeek = gameReducer(initial, { type: 'WEEK' });
  const offer = nextWeek.opportunities.find(item => item.id === 'nightline-39');
  expect(offer).toMatchObject({ type: 'social', status: 'Open', cost: 24000 });
  const accepted = gameReducer(nextWeek, { type: 'OPPORTUNITY', id: offer.id, accept: true });
  expect(accepted.player.cash).toBe(nextWeek.player.cash - 24000);
  expect(accepted.player.listeners).toBe(nextWeek.player.listeners + 1200);
  expect(accepted.player.fans).toBe(nextWeek.player.fans + 240);
  expect(accepted.activity[0].tag).toBe('DECISION');
});
