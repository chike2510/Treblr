import { CAREER_RANKS, MARKETS, SAVE_KEY, SAVE_VERSION } from './gameData';

export function isRebuildCareer(value) {
  return Boolean(
    value
    && value.schemaVersion === SAVE_VERSION
    && typeof value.stageName === 'string'
    && typeof value.homeMarketId === 'string'
    && typeof value.currentMarketId === 'string'
    && typeof value.genreId === 'string'
    && Number.isFinite(value.week)
    && Number.isFinite(value.credits)
    && Number.isFinite(value.fans)
    && Number.isFinite(value.energy)
    && Number.isFinite(value.health)
    && Number.isFinite(value.actionPoints)
    && Array.isArray(value.projects)
    && value.skills && typeof value.skills === 'object'
    && value.stats && typeof value.stats === 'object'
  );
}

export function upgradeCareer(value) {
  if (!isRebuildCareer(value)) return null;
  const stats = value.stats || {};
  const historicalXp = Math.max(0,
    (stats.sessions || 0) * 22 + (stats.releases || 0) * 58 + (stats.gigs || 0) * 38
    + (stats.festivals || 0) * 70 + (stats.interviews || 0) * 25
    + (stats.socialPosts || 0) * 8 + (value.completedWeeks || 0) * 10,
  );
  const xp = Number.isFinite(value.careerXp) ? value.careerXp : historicalXp;
  const rank = CAREER_RANKS.reduce((current, candidate) => candidate.minXp <= xp ? candidate : current, CAREER_RANKS[0]);
  const careerMilestones = Array.isArray(value.careerMilestones) ? value.careerMilestones : CAREER_RANKS.filter((item) => item.minXp > 0 && item.minXp <= xp).map((item) => item.id);
  const home = value.marketProgress?.[value.homeMarketId] || { familiarity: 0, gigs: 0 };
  const visitedCount = (value.visitedMarkets || []).length;
  const awardRules = [
    ['first-release', 'First Signal', 'The first release reached the world.', (stats.releases || 0) >= 1],
    ['home-crowd', 'The Home Crowd', 'Two shows made the home market a familiar room.', home.gigs >= 2 && home.familiarity >= 36],
    ['regional-route', 'Two-City Relay', 'The story found a second market.', visitedCount >= 2 && (stats.tourStops || 0) >= 1],
    ['breakthrough', 'Breakthrough', 'The audience and reputation both crossed the line.', value.fans >= 650 && value.reputation >= 22],
    ['festival-debut', 'Festival Debut', 'A festival trusted you with its stage.', (stats.festivals || 0) > 0],
    ['global-circuit', 'Five Hubs, One Signal', 'Every Global Relay market has heard the name.', visitedCount >= MARKETS.length],
  ];
  const awards = Array.isArray(value.awards) ? value.awards : awardRules.filter(([, , , earned]) => earned).map(([id, name, detail]) => ({ id, name, detail, week: Math.max(1, value.completedWeeks || 1) }));
  return { ...value, careerXp: xp, careerRank: value.careerRank || rank.id, careerMilestones, awards, lastResult: value.lastResult || null };
}

export function loadCareer(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return upgradeCareer(parsed);
  } catch {
    return null;
  }
}

export function saveCareer(career, storage = globalThis.localStorage) {
  if (!storage || !isRebuildCareer(career)) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(career));
    return true;
  } catch {
    return false;
  }
}

export function exportCareer(career) {
  return JSON.stringify({ format: 'treblr-global-career', version: SAVE_VERSION, exportedAt: new Date().toISOString(), career }, null, 2);
}

export function parseCareerBackup(contents) {
  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const candidate = parsed?.career || parsed;
  const upgraded = upgradeCareer(candidate);
  if (!upgraded) throw new Error('This backup is not a compatible career save.');
  return upgraded;
}
