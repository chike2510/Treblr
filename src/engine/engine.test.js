import { afterEach, describe, expect, it, vi } from 'vitest';
import { RANDOM_EVENTS } from '../data/constants';
import { makeDefault, migrateSave, getSaveSlots, createCareerSlot, loadGame, exportSaveText, importSaveText } from './gameState';
import { WEEKLY_ACTION_POINTS, spendActionPoints } from './actionPoints';
import { endWeek, handleModalChoice } from './weekEngine';
import { calculateCatalogWeek, getTrackWeeklyStreams } from './incomeCalc';
import { buildCharts, seedNPCCareers, tickNPCReleases } from './npcEngine';
import { getAwardCategories, evaluateAwards } from './awards';
import { getCityDemand, getCityEvents, buildTourRoute } from './cityScene';
import { getCollaborationPrice, getJobPay, getProducerPrice, getSocialReachMultiplier, getWeeklySocialEnergy } from './careerPerks';
import { progressJobWeek } from './jobProgress';
import { getNextObjective } from './objectives';
import { MAX_IMAGE_BYTES, isStorageQuotaError, optimizeArtwork } from './coverArt';

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(String(key), String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const installStorage = () => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  return storage;
};

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.localStorage;
});

describe('weekly action economy', () => {
  it('starts and refreshes at exactly three weekly actions', () => {
    const start = makeDefault();
    expect(start.sp).toBe(3);
    expect(start.maxSp).toBe(WEEKLY_ACTION_POINTS);
    expect(spendActionPoints(spendActionPoints(start)).sp).toBe(1);
    expect(spendActionPoints({ ...start, sp:0 })).toBeNull();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const next = endWeek({ ...start, screen:'game', stageName:'Test', city:'lagos', genre:'afrobeats', sp:0 }, () => {}, () => {});
    expect(next.sp).toBe(3);
    expect(next.maxSp).toBe(3);
  });
});

describe('versioned, multi-career saves', () => {
  it('migrates older saves, normalizes the action budget, and preserves legacy social aliases and career perks', () => {
    const migrated = migrateSave({ saveVersion:2, stageName:'Old Era', careerType:'social_media', sp:5, se:6, maxSe:7, socialPlatforms:{ soundstream:12, soundcloud:28 }, catalog:[{ id:'old-song', released:true, streams:400 }] });
    expect(migrated.saveVersion).toBe(4);
    expect(migrated.sp).toBe(3);
    expect(migrated.maxSp).toBe(3);
    expect(migrated.maxSe).toBe(10);
    expect(migrated.se).toBe(6);
    expect(migrated.socialPlatforms.soundify).toBe(12);
    expect(migrated.socialPlatforms.wavelog).toBe(28);
    expect(migrated.catalog[0].lifetimeStreams).toBe(400);
    expect(getWeeklySocialEnergy(migrated)).toBe(10);
  });

  it('keeps the old legacy career when creating a new slot, and exports/imports into a separate slot', () => {
    const storage = installStorage();
    storage.setItem('treblr_v3_save', JSON.stringify({ screen:'game', stageName:'Legacy Star', totalWeeks:4, fans:900, money:250000, careerType:'broke_underground' }));
    const fresh = createCareerSlot({ ...makeDefault(), screen:'game', stageName:'New Star', genre:'pop', city:'london' });
    expect(fresh).toBeTruthy();
    expect(getSaveSlots().map(slot => slot.name)).toEqual(expect.arrayContaining(['Legacy Star', 'New Star']));
    expect(getSaveSlots()).toHaveLength(2);

    const imported = importSaveText(exportSaveText({ ...fresh, money:1234567, fans:2345 }));
    expect(imported._slotId).not.toBe(fresh._slotId);
    expect(loadGame(imported._slotId).money).toBe(1234567);
    expect(getSaveSlots()).toHaveLength(3);
  });

  it('rejects malformed imported JSON without creating a slot', () => {
    installStorage();
    expect(() => importSaveText('{not valid')).toThrow();
    expect(getSaveSlots()).toHaveLength(0);
  });
});

describe('career paths and jobs', () => {
  it('applies each declared career advantage through its gameplay calculation', () => {
    expect(getJobPay({ careerType:'broke_underground' }, 1000)).toBe(1400);
    expect(getSocialReachMultiplier({ careerType:'social_media' })).toBe(3);
    expect(getWeeklySocialEnergy({ careerType:'social_media', maxSe:7 })).toBe(10);
    expect(getProducerPrice({ careerType:'producer_artist' }, 1_000_000)).toBe(700_000);
    expect(getCollaborationPrice({ careerType:'fallen_star' }, 1_000_000, 'nobody')).toBe(800_000);
  });

  it('grows job skills and contacts while charging the advertised weekly energy and career-adjusted wage', () => {
    const result = progressJobWeek({ energy:60, sw:10, network:2, careerType:'broke_underground' }, { weeklyPay:1000, energyPerWeek:8, weeklySkillGain:{ sw:2 }, networkPerWeek:1 }, 2);
    expect(result.wage).toBe(1400);
    expect(result.state.sw).toBe(12);
    expect(result.state.network).toBe(3);
    expect(result.state.energy).toBe(52);
    expect(result.completed).toBe(false);
  });
});

describe('regional scenes and tours', () => {
  it('makes city demand genre-specific and gives city tours a real venue-capacity itinerary', () => {
    expect(getCityDemand('lagos', 'afrobeats')).toBeGreaterThan(getCityDemand('toronto', 'afrobeats'));
    const route = buildTourRoute({ city:'accra', genre:'afrobeats', fans:25_000, lp:40 }, 3);
    expect(route).toHaveLength(3);
    expect(route[0].cityId).toBe('accra');
    expect(route.every(stop => stop.expectedAttendance > 0 && stop.expectedAttendance <= stop.venueCapacity && stop.ticketPrice > 0)).toBe(true);
  });

  it("only exposes city events from the player's current regional event pool", () => {
    const regional = RANDOM_EVENTS.filter(event => event.city);
    expect(regional.length).toBeGreaterThan(0);
    for (const event of regional) expect(getCityEvents(event.city)).toContain(event.id);
  });
});

describe('music economy, charts, and awards', () => {
  it('records weekly and lifetime streams per released track and applies city/rollout effects', () => {
    const state = { totalWeeks:3, fans:10_000, city:'lagos', genre:'afrobeats', labelId:'independent', catalog:[
      { id:'song-1', title:'Home Run', released:true, releaseType:'single', releaseWeek:2, quality:80, lifetimeStreams:250, rollout:{ id:'targeted', streamLift:1.32, fanLift:360, weeks:4, startWeek:2 }, promoByPlatform:{} },
      { id:'vault', title:'Unreleased', released:false, quality:90, lifetimeStreams:0 },
    ] };
    const result = calculateCatalogWeek(state);
    expect(result.catalog[0].weeklyStreams).toBeGreaterThan(0);
    expect(result.catalog[0].lifetimeStreams).toBe(250 + result.catalog[0].weeklyStreams);
    expect(result.catalog[0].weeklySales).toBeGreaterThan(0);
    expect(result.catalog[1].weeklyStreams).toBe(0);
    expect(getTrackWeeklyStreams({ ...state, city:'lagos' }, state.catalog[0])).toBeGreaterThan(getTrackWeeklyStreams({ ...state, city:'toronto' }, state.catalog[0]));
  });

  it('ranks streams, sales, and video views using distinct format-specific metrics', () => {
    const tracks = [
      { id:'stream-hit', title:'Stream Hit', released:true, releaseWeek:0, quality:60, lifetimeStreams:5_000_000, weeklyStreams:500_000, lifetimeSales:20, weeklySales:5, videoViews:10, weeklyVideoViews:2 },
      { id:'unit-seller', title:'Unit Seller', released:true, releaseWeek:0, quality:95, lifetimeStreams:25_000, weeklyStreams:2_000, lifetimeSales:1_000_000, weeklySales:80_000, videoViews:30, weeklyVideoViews:3 },
      { id:'visual-star', title:'Visual Star', released:true, releaseWeek:0, quality:75, lifetimeStreams:40_000, weeklyStreams:4_000, lifetimeSales:250, weeklySales:12, videoViews:8_000_000, weeklyVideoViews:1_000_000 },
    ];
    const charts = buildCharts(tracks, [], { stageName:'Test', totalWeeks:0, fans:20_000, clout:25, npcCareers:{} });
    expect(charts.streams[0].id).toBe('stream-hit');
    expect(charts.sales[0].id).toBe('unit-seller');
    expect(charts.videos[0].id).toBe('visual-star');
  });

  it('evolves rival artist careers and releases based on their stored careers', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const initial = seedNPCCareers();
    const result = tickNPCReleases([], {}, 1, initial);
    expect(Object.keys(result.updatedCareers).length).toBeGreaterThan(0);
    const firstId = Object.keys(initial)[0];
    expect(result.updatedCareers[firstId].fans).toBeGreaterThan(initial[firstId].fans);
    expect(result.updatedCatalog).toBeDefined();
  });

  it('earns awards through multiple qualifying work and performance categories', () => {
    const state = {
      totalWeeks:48, fans:10_000_000, clout:100, lp:100, genre:'afrobeats', city:'lagos', awards:[], npcCareers:{}, npcCatalog:[],
      catalog:[{ id:'anthem', title:'Anthem', genre:'afrobeats', released:true, releaseWeek:10, quality:99, lifetimeStreams:100_000_000, videoViews:1_000_000 }],
      projects:[{ id:'album', title:'First Light', type:'album', avgQuality:96, cohesion:95, streams:100_000_000, releaseWeek:10 }],
      tourHistory:[{ stops:[{ attendance:100_000 }] }],
    };
    expect(getAwardCategories(state).filter(category => category.eligible).length).toBeGreaterThanOrEqual(5);
    expect(evaluateAwards(state).length).toBeGreaterThanOrEqual(5);
  });
});

describe('event choices, objectives, and artwork safety', () => {
  it('applies all numeric event-choice effects, including reputation, before contract decisions', () => {
    const state = { ...makeDefault(), labelId:'empire', labelRel:30, clout:50, contractSplit:58, contractWeeksLeft:10, creativeControl:82 };
    const renegotiated = handleModalChoice(state, { effect:{ renegotiate:true, reputation:2 } });
    expect(renegotiated.reputation).toBe(52);
    expect(renegotiated.contractSplit).toBe(62);
    expect(renegotiated.creativeControl).toBe(92);
    expect(renegotiated.contractWeeksLeft).toBe(36);

    const dropped = handleModalChoice(state, { effect:{ dropped:true, reputation:-5 } });
    expect(dropped.labelId).toBe('independent');
    expect(dropped.reputation).toBe(45);
    expect(dropped.contractObligations.postsDue).toBe(0);
  });

  it("changes next objectives according to the career's live progress", () => {
    expect(getNextObjective(makeDefault()).title).toBe('Make your first record');
    const releaseGoal = getNextObjective({ ...makeDefault(), catalog:[{ id:'one', released:false }] });
    expect(releaseGoal.action).toBe('RELEASE');
    const catalogGoal = getNextObjective({ ...makeDefault(), catalog:[{ id:'one', released:true, releaseType:'single' }] });
    expect(catalogGoal.title).toContain('three-song');
  });

  it('validates artwork size/type before decoding and recognizes browser quota errors', async () => {
    await expect(optimizeArtwork({ type:'text/plain', size:10 })).rejects.toMatchObject({ code:'unsupported-image' });
    await expect(optimizeArtwork({ type:'image/png', size:MAX_IMAGE_BYTES + 1 })).rejects.toMatchObject({ code:'image-too-large' });
    expect(isStorageQuotaError({ name:'QuotaExceededError' })).toBe(true);
    expect(isStorageQuotaError({ code:22 })).toBe(true);
  });
});
