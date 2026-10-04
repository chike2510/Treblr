import { SAVE_KEY, SAVE_VERSION } from './gameData';

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

export function loadCareer(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isRebuildCareer(parsed) ? parsed : null;
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
  if (!isRebuildCareer(candidate)) throw new Error('This backup is not a compatible career save.');
  return candidate;
}
