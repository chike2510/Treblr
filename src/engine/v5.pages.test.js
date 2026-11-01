import { describe, it, expect } from 'vitest';
import { addV5Fields } from './v5.js';
import { migrate } from './state.js';
import { createNewGame } from './state.js';

describe('v5 career feature defaults', () => {
  it('fills missing career page data on a legacy save without replacing existing systems', () => {
    const old = { tour: { name: 'Homecoming', stops: [] }, merch: null, acting: { credits: [{ title: 'First role' }] }, awardHistory: [{ result: 'won' }] };
    const upgraded = addV5Fields(old);
    expect(upgraded.tour.name).toBe('Homecoming');
    expect(upgraded.merch).toBeNull();
    expect(upgraded.lifestyle).toEqual({ owned: [], rental: null });
    expect(upgraded.acting.credits).toHaveLength(1);
    expect(upgraded.awardHistory).toHaveLength(1);
    expect(upgraded.labelOffers).toEqual([]);
    expect(upgraded.distributor).toBe('independent');
  });

  it('migrates a prior-version career and preserves existing gameplay data', () => {
    const save = createNewGame({ stageName: 'Legacy Star', genre: 'pop', city: 'nyc' }, 808);
    save.version = 4;
    save.tour = { name: 'Old Route', stops: [] };
    delete save.labelOffers;
    delete save.lifestyle;
    const upgraded = migrate(save);
    expect(upgraded.version).toBe(5);
    expect(upgraded.tour.name).toBe('Old Route');
    expect(upgraded.labelOffers).toEqual([]);
    expect(upgraded.lifestyle.owned).toEqual([]);
  });

  it('backfills missing nested acting and lifestyle collections safely', () => {
    const upgraded = addV5Fields({ acting: {}, lifestyle: {} });
    expect(upgraded.acting.auditions).toEqual([]);
    expect(upgraded.lifestyle.owned).toEqual([]);
  });
});
