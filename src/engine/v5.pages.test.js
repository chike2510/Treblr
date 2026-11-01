import { describe, it, expect } from 'vitest';
import { createNewGame, migrate } from './state.js';
import { addV5Fields } from './v5.js';
import { signContract } from './business.js';
import { dropMerch, MERCH_TIERS } from './actions.js';
import { advanceWeek } from './tick.js';

describe('career feature page systems', () => {
  it('fills safe defaults for old or partial feature saves without losing existing data', () => {
    const old = { player: { cash: 100, fans: 500 }, tour: { name: 'Homecoming', stops: [] }, merch: { tier: 'small', stock: 12 }, acting: { credits: [{ title: 'First role' }] }, awardHistory: [{ result: 'won' }] };
    const upgraded = addV5Fields(old);
    expect(upgraded.tour.name).toBe('Homecoming');
    expect(upgraded.merch).toMatchObject({ stock: 12, sold: 0, revenue: 0, active: true });
    expect(upgraded.lifestyle).toEqual({ owned: [], rental: null });
    expect(upgraded.acting.credits).toHaveLength(1);
    expect(upgraded.acting.auditions).toEqual([]);
    expect(upgraded.awardHistory).toHaveLength(1);
    expect(upgraded.labelOffers).toEqual([]);
    expect(upgraded.distributor).toBe('independent');
    expect(upgraded.festivals).toEqual({});
  });
  it('migrates a prior-version career and preserves feature progress', () => {
    const save = createNewGame({ stageName: 'Legacy Star', genre: 'pop', city: 'nyc' }, 808);
    save.version = 4; save.tour = { name: 'Old Route', stops: [] }; save.festivals = { 'old-booking': { accepted: true } };
    delete save.labelOffers; delete save.lifestyle;
    const upgraded = migrate(save);
    expect(upgraded.version).toBe(5); expect(upgraded.tour.name).toBe('Old Route');
    expect(upgraded.festivals['old-booking'].accepted).toBe(true); expect(upgraded.labelOffers).toEqual([]); expect(upgraded.lifestyle.owned).toEqual([]);
  });
  it('launches merch once and rejects overlapping drops', () => {
    const game = createNewGame({ stageName: 'Legacy Star', genre: 'pop', city: 'nyc' }, 42); game.player.cash = 5000;
    const first = dropMerch(game, { tier: 'small' });
    expect(first.ok).toBe(true); expect(first.state.merch).toMatchObject({ active: true, tier: 'small', stock: MERCH_TIERS[0].units, sold: 0, revenue: 0 });
    const overlapping = dropMerch(first.state, { tier: 'mid' }); expect(overlapping.ok).toBe(false); expect(overlapping.state.merch.tier).toBe('small');
  });
  it('processes merch sales and records revenue in the existing weekly advance', () => {
    const game = createNewGame({ stageName: 'Weekly Star', genre: 'pop', city: 'nyc' }, 17); game.player.fans = 200000; game.player.hype = 100;
    game.merch = { active: true, tier: 'small', stock: 100, price: 20, sold: 0 };
    const next = advanceWeek(game);
    expect(next.week).toBe(game.week + 1); expect(next.merch.sold).toBeGreaterThan(0);
    expect(next.merch.revenue).toBe(next.merch.sold * next.merch.price); expect(next.transactions.some((x) => x.label.includes('Merch sales'))).toBe(true);
  });
  it('records a label deal lifecycle and settles the active record once in the weekly tick', async () => {
    const game = createNewGame({ stageName: 'Deal Star', genre: 'pop', city: 'nyc' }, 18);
    const deal = { labelId: 'test-label', label: 'Test Records', advance: 10000, albums: 1, yearsPerAlbum: 1, royalty: 0.2 };
    signContract(game, deal);
    expect(game.labelHistory[0]).toMatchObject({ name: 'Test Records', result: 'active', delivered: 0, advance: 10000 });
    game.player.label.delivered = 1;
    const before = game.week;
    const next = advanceWeek(game);
    expect(next.week).toBe(before + 1);
    expect(next.labelHistory[0]).toMatchObject({ result: 'fulfilled', delivered: 1, endedWeek: before });
    const repeated = advanceWeek(next);
    expect(repeated.labelHistory).toHaveLength(1);
    expect(repeated.player.label).toBeNull();
    expect(next.player.label).toBeNull();
  });
});
