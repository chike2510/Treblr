import { describe, expect, it } from 'vitest';
import { closeWeek, createCareer, gameReducer, getCareerJourney, getCareerRank } from './gameEngine';
import { SAVE_KEY } from './gameData';
import { exportCareer, isRebuildCareer, loadCareer, parseCareerBackup, saveCareer, upgradeCareer } from './saveStore';

const command = (state, name, payload = {}) => gameReducer(state, { type: 'command', command: name, ...payload });
const startCareer = () => createCareer({ stageName: 'Nova', marketId: 'lagos', genreId: 'rnb' });

function createAndRelease(state, campaignId = 'diy') {
  const session = command(state, 'studio-session', { focusId: 'writing' });
  const project = session.projects.at(-1);
  return command(session, 'release', { projectId: project.id, campaignId });
}

describe('career-first weekly simulation', () => {
  it('starts a new career with an action budget, health, relationships, and five connected markets', () => {
    const career = startCareer();
    expect(career.homeMarketId).toBe('lagos');
    expect(career.currentMarketId).toBe('lagos');
    expect(career.actionPoints).toBe(3);
    expect(career.energy).toBeGreaterThan(0);
    expect(career.health).toBeGreaterThan(0);
    expect(career.relationships.manager).toBeGreaterThan(0);
    expect(Object.keys(career.marketProgress)).toEqual(['lagos', 'atlanta', 'london', 'accra', 'toronto']);
    expect(career.projects).toEqual([]);
    expect(career.songs).toBeUndefined();
  });

  it('uses a writing session to create a non-authored release event and improve a skill', () => {
    const before = startCareer();
    const after = command(before, 'studio-session', { focusId: 'writing' });
    expect(after.projects).toHaveLength(1);
    expect(after.projects[0]).toMatchObject({ title: 'First Light', type: 'Single', status: 'ready', createdWeek: 1 });
    expect(after.projects[0].quality).toBeGreaterThan(0);
    expect(after.projects[0].arrangement).toBeUndefined();
    expect(after.skills.writing).toBe(before.skills.writing + 3);
    expect(after.relationships.collaborator).toBeGreaterThan(before.relationships.collaborator);
    expect(after.actionPoints).toBe(2);
    expect(after.energy).toBeLessThan(before.energy);
  });

  it('turns a ready project into a career release event with modeled listeners, fans, and campaign cost', () => {
    const session = command(startCareer(), 'studio-session', { focusId: 'writing' });
    const before = session.credits;
    const released = command(session, 'release', { projectId: session.projects[0].id, campaignId: 'press' });
    expect(released.projects[0].status).toBe('released');
    expect(released.projects[0].weeklyStreams).toBeGreaterThan(0);
    expect(released.stats.releases).toBe(1);
    expect(released.stats.careerStreams).toBe(released.projects[0].weeklyStreams);
    expect(released.fans).toBeGreaterThan(session.fans);
    expect(released.credits).toBe(before - 950);
    expect(released.achievements).toContain('first-release');
  });

  it('keeps campaign choices consequential without needing a composed track', () => {
    const initial = startCareer();
    const diy = createAndRelease(initial, 'diy');
    const visual = createAndRelease(initial, 'visual');
    expect(visual.projects[0].weeklyStreams).toBeGreaterThan(diy.projects[0].weeklyStreams);
    expect(visual.credits).toBeLessThan(diy.credits);
    expect(visual.projects[0].arrangement).toBeUndefined();
  });

  it('limits studio, release, and gig decisions to three meaningful weekly actions', () => {
    let state = startCareer();
    state = command(state, 'studio-session', { focusId: 'writing' });
    state = command(state, 'release', { projectId: state.projects[0].id, campaignId: 'diy' });
    state = command(state, 'gig', { marketId: 'lagos' });
    const denied = command(state, 'studio-session', { focusId: 'coaching' });
    expect(state.actionPoints).toBe(0);
    expect(denied.skills.marketing).toBe(state.skills.marketing);
    expect(denied.notice).toMatch(/actions are spent/i);
  });

  it('books gigs across markets, moving the artist and growing local familiarity', () => {
    const before = startCareer();
    const gig = command(before, 'gig', { marketId: 'atlanta' });
    expect(gig.currentMarketId).toBe('atlanta');
    expect(gig.visitedMarkets).toContain('atlanta');
    expect(gig.marketProgress.atlanta.gigs).toBe(1);
    expect(gig.marketProgress.atlanta.familiarity).toBeGreaterThan(0);
    expect(gig.stats.gigs).toBe(1);
    expect(gig.stats.tourStops).toBe(1);
    expect(gig.gigHistory[0].type).toBe('tour');
    expect(gig.gigHistory[0].grade).toBeTruthy();
    expect(gig.fans).toBeGreaterThan(before.fans);
    expect(gig.credits).toBeGreaterThan(before.credits);
    expect(gig.energy).toBeLessThan(before.energy);
    expect(gig.relationships.manager).toBeGreaterThan(before.relationships.manager);
  });

  it('charges for travel to a new market but not for another show in the current room', () => {
    const lowFunds = { ...startCareer(), credits: 10 };
    const denied = command(lowFunds, 'gig', { marketId: 'atlanta' });
    expect(denied.credits).toBe(10);
    expect(denied.notice).toMatch(/820 CR to travel to Atlanta/i);
    const local = command(lowFunds, 'gig', { marketId: 'lagos' });
    expect(local.stats.gigs).toBe(1);
    expect(local.credits).toBeGreaterThan(10);
  });

  it('applies label advances, release terms, and royalty shares at settlement', () => {
    let career = startCareer();
    career = command(career, 'sign-label', { labelId: 'northline' });
    expect(career.label).toMatchObject({ name: 'Northline Distribution', releasesLeft: 2, share: 8 });
    career = command(career, 'studio-session', { focusId: 'writing' });
    career = command(career, 'release', { projectId: career.projects[0].id, campaignId: 'diy' });
    expect(career.label.releasesLeft).toBe(1);
    const settled = closeWeek(career);
    expect(settled.weeklyReport.royaltyCut).toBeGreaterThan(0);
    expect(settled.weeklyReport.income).toBeGreaterThanOrEqual(0);
  });

  it('gates and records festival invitations using reputation and fan progression', () => {
    const start = startCareer();
    const denied = command(start, 'festival', { festivalId: 'night-index' });
    expect(denied.stats.festivals).toBe(0);
    expect(denied.notice).toMatch(/build to/i);
    const ready = { ...start, fans: 700, reputation: 25 };
    const played = command(ready, 'festival', { festivalId: 'night-index' });
    expect(played.stats.festivals).toBe(1);
    expect(played.festivalsPlayed).toContain('night-index');
    expect(played.currentMarketId).toBe('london');
    expect(played.reputation).toBeGreaterThan(ready.reputation);
  });

  it('models publicity as a separate weekly energy and relationship choice', () => {
    const before = startCareer();
    const posted = command(before, 'social-post', { storyId: 'studio-note' });
    expect(posted.socialEnergy).toBe(2);
    expect(posted.actionPoints).toBe(before.actionPoints);
    expect(posted.socialStats.posts).toBe(1);
    expect(posted.socialStats.lastReach).toBeGreaterThan(0);
    expect(posted.fans).toBeGreaterThan(before.fans);
    expect(posted.relationships.collaborator).toBeGreaterThan(before.relationships.collaborator);
  });

  it('gives a paid call, recovery choice, and press interview distinct trade-offs', () => {
    const before = startCareer();
    const job = command(before, 'job', { jobId: 'session-call' });
    expect(job.credits).toBeGreaterThan(before.credits);
    expect(job.actionPoints).toBe(2);
    const rested = command({ ...before, energy: 30, health: 50 }, 'rest');
    expect(rested.energy).toBeGreaterThan(30);
    expect(rested.health).toBeGreaterThan(50);
    const interview = command(before, 'interview', { itemId: 'profile-piece' });
    expect(interview.reputation).toBeGreaterThan(before.reputation);
    expect(interview.stats.interviews).toBe(1);
  });

  it('settles weekly listeners and cash, then restores career and publicity actions', () => {
    let career = createAndRelease(startCareer(), 'press');
    career = { ...career, actionPoints: 0, socialEnergy: 0, energy: 20, health: 66 };
    const next = closeWeek(career);
    expect(next.week).toBe(2);
    expect(next.actionPoints).toBe(3);
    expect(next.socialEnergy).toBe(3);
    expect(next.stats.lastWeekStreams).toBeGreaterThan(0);
    expect(next.weeklyReport.week).toBe(1);
    expect(next.weeklyReport.newFans).toBeGreaterThan(0);
    expect(next.credits).toBeGreaterThan(career.credits);
    expect(next.energy).toBeGreaterThan(career.energy);
    expect(next.health).toBeGreaterThan(career.health);
  });

  it('turns the first release into a rank-up, an earned award, and a genuinely new radio call', () => {
    let career = startCareer();
    career = command(career, 'studio-session', { focusId: 'writing' });
    career = command(career, 'release', { projectId: career.projects[0].id, campaignId: 'press' });
    expect(career.careerXp).toBe(80);
    expect(career.awards.map((award) => award.id)).toContain('first-release');
    expect(getCareerJourney(career).id).toBe('home-crowd');
    expect(getCareerRank(career.careerXp).id).toBe('new-voice');

    const locked = command(career, 'interview', { itemId: 'local-radio' });
    expect(locked.stats.interviews).toBe(0);
    expect(locked.notice).toMatch(/opens at First signal rank/i);
    career = command(career, 'gig', { marketId: 'lagos' });
    expect(career.careerRank).toBe('first-signal');
    expect(career.lastResult.rankUps.map((rank) => rank.title)).toContain('First signal');
    expect(career.notice).toMatch(/Local radio wants your story/i);

    const radio = command({ ...career, actionPoints: 1 }, 'interview', { itemId: 'local-radio' });
    expect(radio.stats.interviews).toBe(1);
    expect(radio.careerXp).toBeGreaterThan(career.careerXp);
    const settled = closeWeek(radio);
    expect(settled.week).toBe(2);
    expect(settled.weeklyReport.xpEarned).toBeGreaterThan(0);
    expect(settled.careerXp).toBeGreaterThan(radio.careerXp);
  });
});

describe('local career save file', () => {
  function memoryStorage() {
    const entries = new Map();
    return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: (key) => entries.delete(key) };
  }

  it('validates and round-trips the current career schema under an isolated save key', () => {
    const career = startCareer();
    const storage = memoryStorage();
    expect(isRebuildCareer(career)).toBe(true);
    expect(saveCareer(career, storage)).toBe(true);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
    expect(loadCareer(storage)).toEqual(career);
    expect(parseCareerBackup(exportCareer(career))).toEqual(career);
  });

  it('leaves the previous generation save and malformed backups untouched', () => {
    const storage = memoryStorage();
    storage.setItem('treblr.career.rebuild.v1', JSON.stringify({ schemaVersion: 1, songs: [{ arrangement: { pattern: [] } }] }));
    expect(loadCareer(storage)).toBeNull();
    expect(storage.getItem('treblr.career.rebuild.v1')).toContain('arrangement');
    expect(() => parseCareerBackup('{broken')).toThrow(/valid JSON/);
    expect(() => parseCareerBackup(JSON.stringify({ schemaVersion: 1, songs: [] }))).toThrow(/compatible/);
  });

  it('upgrades a prior v2 career from its history without resetting progress', () => {
    const { careerXp, careerRank, careerMilestones, awards, lastResult, ...oldSave } = startCareer();
    const legacy = {
      ...oldSave,
      completedWeeks: 3,
      stats: { ...oldSave.stats, sessions: 2, releases: 1, gigs: 2, tourStops: 1, interviews: 1, socialPosts: 2 },
      visitedMarkets: ['lagos', 'accra'],
    };
    const upgraded = upgradeCareer(legacy);
    expect(upgraded.careerXp).toBeGreaterThan(legacy.week * 10);
    expect(upgraded.careerRank).toBe('city-draw');
    expect(upgraded.careerMilestones).toContain('first-signal');
    expect(upgraded.awards.map((award) => award.id)).toContain('first-release');
    expect(upgraded.week).toBe(legacy.week);
    expect(upgraded.credits).toBe(legacy.credits);
  });
});
