import { describe, it, expect } from 'vitest';
import { createNewGame, migrate } from './state.js';
import { addV5Fields } from './v5.js';
import { signContract } from './business.js';
import { dropMerch, MERCH_TIERS } from './actions.js';
import { advanceWeek } from './tick.js';
import { LABEL_STARTUP, createOwnLabel, scoutTalent, signProspect } from './v5.js';
import { updateOwnLabelBrand, updateActingBio, actingTitle, actingTick, audition, ACTING_ROLES } from './business.js';
import { saveGame, loadGame } from './state.js';
import { createRng } from './rng.js';

describe('career feature page systems', () => {
  it('fills safe defaults for old or partial feature saves without losing existing data', () => {
    const old = { player: { cash: 100, fans: 500 }, tour: { name: 'Homecoming', stops: [] }, merch: { tier: 'small', stock: 12 }, acting: { credits: [{ title: 'First role' }] }, awardHistory: [{ result: 'won' }] };
    const upgraded = addV5Fields(old);
    expect(upgraded.tour.name).toBe('Homecoming');
    expect(upgraded.merch).toMatchObject({ stock: 12, sold: 0, revenue: 0, active: true });
    expect(upgraded.lifestyle).toEqual({ owned: [], rental: null });
    expect(upgraded.acting.credits).toHaveLength(1);
    expect(upgraded.acting.auditions).toEqual([]);
    expect(upgraded.acting.boxOffice).toEqual([]);
    expect(upgraded.acting.bio).toContain('screen career');
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
  it('founds an artist-owned label, scouts prospects and signs an artist while the player remains independent', () => {
    let game = createNewGame({ stageName: 'Indie Star', genre: 'pop', city: 'nyc' }, 123);
    game.player.cash = LABEL_STARTUP + 50000; game.player.popularity = 50; game.player.label = null;
    game = createOwnLabel(game, { name: 'Night Harbour Records' }).state;
    expect(game.ownLabel).toMatchObject({ name: 'Night Harbour Records', artists: [], rep: 30 });
    expect(game.player.label).toBeNull(); expect(game.player.cash).toBe(50000);
    game = scoutTalent(game).state;
    const prospect = game.ownLabel.prospects[0];
    game = signProspect(game, { id: prospect.id }).state;
    expect(game.ownLabel.artists[0]).toMatchObject({ name: prospect.name, signedWeek: game.week });
    expect(game.player.label).toBeNull();
  });

  it('saves actor bio and imprint branding through the save/load round trip', () => {
    let game = createNewGame({ stageName: 'Save Star', genre: 'pop', city: 'nyc' }, 91);
    game.player.cash = LABEL_STARTUP; game.player.popularity = 50;
    game = createOwnLabel(game, { name: 'Old Name' }).state;
    game = updateOwnLabelBrand(game, { name: 'Afterglow Audio', tagline: 'Sound without borders', symbol: 'wave', hue: 217, shape: 2 }).state;
    game = updateActingBio(game, { bio: 'A fictional performer with a growing screen career.' }).state;
    game.acting.boxOffice = [{ id: 'saved-film', title: 'Afterglow', week: game.week, openingGross: 750000, gross: 750000, weekly: 0, cumulative: 750000, lastAccruedWeek: game.week, score: 74, verdict: 'solid', role: 'Lead', medium: 'film' }];
    game.acting.boxOfficeIds = ['saved-film'];
    const storage = { values: new Map(), setItem(k,v) { this.values.set(k,v); }, getItem(k) { return this.values.get(k) ?? null; } };
    expect(saveGame(game, 1, storage)).toBe(true);
    const loaded = loadGame(1, storage);
    expect(loaded.ownLabel.logo).toMatchObject({ name: 'Afterglow Audio', tagline: 'Sound without borders', symbol: 'wave', hue: 217, shape: 2 });
    expect(loaded.acting.bio).toBe('A fictional performer with a growing screen career.');
    expect(loaded.acting.boxOffice).toMatchObject([{ id: 'saved-film', cumulative: 750000 }]);
    expect(loaded.acting.boxOfficeIds).toContain('saved-film');
  });

  it('adds one simulated box-office installment per title per week and exposes title detail', () => {
    const game = createNewGame({ stageName: 'Screen Star', genre: 'pop', city: 'nyc' }, 92);
    const title = { id: 'film-1', title: 'Midnight Signal', week: game.week - 1, openingGross: 1_000_000, gross: 1_000_000, cumulative: 1_000_000, weekly: 0, lastAccruedWeek: game.week - 1, score: 78, verdict: 'solid', role: 'Lead', medium: 'film' };
    game.acting = { credits: [{ ...title, reach: 1200, fans: 20 }], current: null, boxOffice: [title], boxOfficeIds: ['film-1'] };
    const twice = JSON.parse(JSON.stringify(game));
    actingTick(twice, createRng(1));
    const weekly = Math.round(1_000_000 * 0.28);
    expect(twice.acting.boxOffice[0]).toMatchObject({ weekly, cumulative: 1_000_000 + weekly, lastAccruedWeek: twice.week });
    actingTick(twice, createRng(2));
    expect(twice.acting.boxOffice[0].cumulative).toBe(1_000_000 + weekly);
    expect(actingTitle(twice, 'film-1')).toMatchObject({ title: 'Midnight Signal', score: 78, openingGross: 1_000_000, cumulative: 1_000_000 + weekly });
    expect(actingTitle(twice, 'missing')).toBeNull();
  });

  it('renders the profile, credits and imprint logo controls in the feature pages', async () => {
    const { renderToString } = await import('react-dom/server');
    const React = await import('react');
    const { GameCtx } = await import('../ui/kit.jsx');
    const World = (await import('../screens/World.jsx')).default;
    let game = createNewGame({ stageName: 'Screen Star', genre: 'pop', city: 'nyc' }, 93);
    game.player.cash = LABEL_STARTUP; game.player.popularity = 50;
    game = createOwnLabel(game, { name: 'Bright Noise' }).state;
    game.acting = { credits: [{ id: 'film-2', title: 'City Lights', week: 3, score: 80, verdict: 'a hit', role: 'Lead', medium: 'film', gross: 100000 }], current: null, auditions: [], boxOffice: [{ id: 'film-2', title: 'City Lights', week: 3, openingGross: 100000, cumulative: 120000, weekly: 20000, score: 80, verdict: 'a hit', role: 'Lead', medium: 'film' }], boxOfficeIds: ['film-2'], bio: 'A screen performer.' };
    const ctx = { state: game, act: () => ({ ok: true }), go: () => {}, nav: { tab: 'world' }, nextWeek: () => {}, toast: () => {}, slot: 1, onSwitch: () => {}, onNew: () => {}, onTitle: () => {}, openProfile: () => {}, setState: () => {}, openArtist: () => {}, openOverlay: () => {} };
    const render = page => renderToString(React.createElement(GameCtx.Provider, { value: ctx }, React.createElement(World, { initial: page })));
    const actor = render('acting');
    expect(actor).toContain('SCREEN PROFILE');
    expect(actor).toContain('not a real IMDb profile');
    expect(actor).toContain('City Lights');
    expect(render('acting-credits')).toContain('cumulative');
    expect(render('label-imprint')).toContain('Logo shape');
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
