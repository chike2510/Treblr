import { WEEKLY_ACTION_POINTS } from './actionPoints';
import { CURRENCIES, LABELS } from '../data/constants';

export const SAVE_VERSION = 4;
export const MAX_CAREER_SLOTS = 8;
const LEGACY_SAVE_KEY = 'treblr_v3_save';
const SAVE_INDEX_KEY = 'treblr_v4_index';
const CURRENT_SLOT_KEY = 'treblr_v4_current';
const slotKey = (id) => `treblr_v4_slot_${id}`;

export const makeDefault = () => ({
  saveVersion: SAVE_VERSION,
  screen: 'start',
  tab: 'home',
  stageName: '',
  realName: '',
  startAge: 22,
  currency: 'NGN',
  genre: null,
  city: null,
  careerType: null,
  startYear: 2024,
  totalWeeks: 0,
  money: 0,
  taxAccum: 0,
  weeklyStreamIncome: 0,
  fans: 0,
  clout: 0,
  reputation: 50,
  socialPlatforms: { soundify: 0, instapic: 0, chirp: 0, vidtube: 0, rhythmtok: 0, wavelog: 0 },
  sw: 5, vc: 5, pd: 5, lp: 5,
  hustle: 5, charisma: 5, network: 5,
  genreBonus: {},
  energy: 100,
  sp: WEEKLY_ACTION_POINTS,
  maxSp: WEEKLY_ACTION_POINTS,
  se: 7,
  maxSe: 7,
  catalog: [],
  projects: [],
  lastReleaseWeek: -99,
  lastEpWeek: -99,
  lastAlbumWeek: -99,
  lastMerchWeek: -99,
  lastBrandWeek: {},
  tourCooldownEnd: 0,
  labelId: 'independent',
  labelRel: 80,
  recouped: 0,
  pressure: 0,
  contractWeeksLeft: 0,
  contractStartedWeek: null,
  contractObligations: { singlesDue: 0, postsDue: 0, albumsDue: 0, quarterStartWeek: 0 },
  creativeControl: 100,
  hasManager: false,
  hasLawyer: false,
  activeMerchDrops: [],
  brandDeals: [],
  tourActive: false,
  tourData: null,
  tourWeeksLeft: 0,
  tourEarnings: 0,
  tourHistory: [],
  activeJob: null,
  inPrison: false,
  prisonWeeksLeft: 0,
  totalLifetimeStreams: 0,
  weeklyStreamCount: 0,
  avatarUrl: null,
  ownLabel: null,
  ownLabelCampaigns: [],
  npcRelations: {},
  collaborationCount: 0,
  npcCatalog: [],
  npcLastRelease: {},
  npcCareers: {},
  charts: { streams: [], sales: [], videos: [] },
  latestChartSnapshot: null,
  weekReport: null,
  news: [],
  awards: [],
  awardNoms: 0,
  feed: [],
  _pendingToast: null,
  _pendingModal: null,
  lastSaved: null,
  _slotId: null,
});

const safeStorage = () => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

const readIndex = () => {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(SAVE_INDEX_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((slot) => slot && typeof slot.id === 'string') : [];
  } catch { return []; }
};

const writeIndex = (slots) => {
  const storage = safeStorage();
  if (!storage) return false;
  storage.setItem(SAVE_INDEX_KEY, JSON.stringify(slots));
  return true;
};

export const migrateSave = (input) => {
  const saved = typeof input === 'string' ? JSON.parse(input) : input;
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid Treblr save file.');
  const defaults = makeDefault();
  const merged = { ...defaults, ...saved };
  merged.currency = CURRENCIES.some(({ code }) => code === saved.currency) ? saved.currency : 'NGN';
  if (merged.tab === 'contracts') merged.tab = 'business';
  if (merged.tab === 'create' && ['record','train'].includes(saved.appRoutes?.music)) {
    merged.tab = 'studio';
    merged.appRoutes = { ...(saved.appRoutes || {}), studio:saved.appRoutes.music };
  }
  if (merged.tab === 'create' && saved.appRoutes?.music === 'jobs') {
    merged.tab = 'business';
    merged.appRoutes = { ...(saved.appRoutes || {}), career:'jobs' };
  }
  if (merged.tab === 'more') {
    const moreRoute = saved.appRoutes?.more || 'social';
    merged.tab = moreRoute.startsWith('discover') ? 'discover' : moreRoute === 'settings' ? 'settings' : 'social-home';
    merged.appRoutes = { ...(saved.appRoutes || {}), more:moreRoute };
  }
  if (merged.tab === 'profile' && saved.appRoutes?.profile === 'settings') {
    merged.tab = 'settings';
    merged.appRoutes = { ...(saved.appRoutes || {}), more:'settings' };
  }
  const social = { ...defaults.socialPlatforms, ...(saved.socialPlatforms || {}) };
  if (social.soundstream !== undefined && saved.socialPlatforms?.soundify === undefined) social.soundify = social.soundstream;
  if (social.soundcloud !== undefined && saved.socialPlatforms?.wavelog === undefined) social.wavelog = social.soundcloud;
  delete social.soundstream;
  delete social.soundcloud;
  merged.socialPlatforms = social;
  merged.sp = Math.min(WEEKLY_ACTION_POINTS, Math.max(0, Number.isFinite(saved.sp) ? saved.sp : WEEKLY_ACTION_POINTS));
  merged.maxSp = WEEKLY_ACTION_POINTS;
  merged.maxSe = Math.max(1, Number(saved.maxSe || defaults.maxSe), saved.careerType === 'social_media' ? 10 : 0);
  merged.se = Math.max(0, Math.min(merged.maxSe, Number(saved.se ?? merged.maxSe)));
  merged.catalog = (Array.isArray(saved.catalog) ? saved.catalog : []).map((track) => ({
    weeklyStreams: 0,
    lifetimeStreams: Number(track.streams || 0),
    videoViews: 0,
    ...track,
  }));
  merged.projects = Array.isArray(saved.projects) ? saved.projects.map((project) => ({ deluxeCount: 0, streams: 0, ...project })) : [];
  const savedLabel = LABELS.find((label) => label.id === saved.labelId) || LABELS[0];
  merged.contractWeeksLeft = Math.max(0, Number(saved.contractWeeksLeft ?? (savedLabel.id !== 'independent' ? savedLabel.contractWeeks : 0)));
  merged.contractStartedWeek = saved.contractStartedWeek ?? (savedLabel.id !== 'independent' ? Number(saved.totalWeeks || 0) : null);
  merged.contractObligations = { ...defaults.contractObligations, ...(saved.contractObligations || {}) };
  merged.creativeControl = Number(saved.creativeControl ?? 100);
  merged.npcRelations = saved.npcRelations && typeof saved.npcRelations === 'object' ? saved.npcRelations : {};
  merged.npcCareers = saved.npcCareers && typeof saved.npcCareers === 'object' ? saved.npcCareers : {};
  merged.tourHistory = Array.isArray(saved.tourHistory) ? saved.tourHistory : [];
  merged.ownLabelCampaigns = Array.isArray(saved.ownLabelCampaigns) ? saved.ownLabelCampaigns : [];
  merged.saveVersion = SAVE_VERSION;
  return merged;
};

const saveMetadata = (state, id) => ({
  id,
  name: (state.stageName || '').trim() || 'Untitled career',
  genre: state.genre || null,
  city: state.city || null,
  currency: state.currency || 'NGN',
  totalWeeks: Number(state.totalWeeks || 0),
  fans: Number(state.fans || 0),
  money: Number(state.money || 0),
  clout: Number(state.clout || 0),
  lastSaved: state.lastSaved || null,
});

const readSlot = (id) => {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(slotKey(id));
    return raw ? migrateSave(raw) : null;
  } catch { return null; }
};

export const getSaveSlots = () => {
  const storage = safeStorage();
  if (!storage) return [];
  const ids = readIndex();
  const slots = ids.map((entry) => {
    const state = readSlot(entry.id);
    return state ? saveMetadata(state, entry.id) : null;
  }).filter(Boolean);
  if (slots.length) return slots;
  try {
    const legacy = storage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return [];
    const state = migrateSave(legacy);
    return [saveMetadata(state, 'legacy')];
  } catch { return []; }
};

export const loadGame = (slotId) => {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const currentId = slotId || storage.getItem(CURRENT_SLOT_KEY) || readIndex()[0]?.id;
    if (currentId) {
      const state = readSlot(currentId);
      if (state) {
        storage.setItem(CURRENT_SLOT_KEY, currentId);
        return { ...state, _slotId: currentId };
      }
      if (currentId === 'legacy') {
        const rawLegacy = storage.getItem(LEGACY_SAVE_KEY);
        if (rawLegacy) return { ...migrateSave(rawLegacy), _slotId: 'legacy' };
      }
    }
    const rawLegacy = storage.getItem(LEGACY_SAVE_KEY);
    if (rawLegacy) return { ...migrateSave(rawLegacy), _slotId: 'legacy' };
    return null;
  } catch { return null; }
};

export const saveGame = (state, requestedSlotId) => {
  const storage = safeStorage();
  if (!storage) return false;
  const id = requestedSlotId || state?._slotId || readIndex()[0]?.id || 'career-1';
  try {
    const normalized = migrateSave(state);
    const saved = { ...normalized, _slotId: id, lastSaved: new Date().toISOString() };
    storage.setItem(slotKey(id), JSON.stringify(saved));
    const index = readIndex().filter((slot) => slot.id !== id);
    index.unshift(saveMetadata(saved, id));
    writeIndex(index.slice(0, MAX_CAREER_SLOTS));
    storage.setItem(CURRENT_SLOT_KEY, id);
    if (id === 'legacy') storage.removeItem(LEGACY_SAVE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

const newSlotId = () => `career-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createCareerSlot = (state) => {
  let slots = getSaveSlots();
  if (slots.length >= MAX_CAREER_SLOTS) return null;
  const legacy = slots.find((slot) => slot.id === 'legacy');
  if (legacy) {
    const oldCareer = loadGame('legacy');
    const oldId = newSlotId();
    if (!oldCareer || !saveGame(oldCareer, oldId)) return null;
    try { safeStorage()?.removeItem(LEGACY_SAVE_KEY); } catch { return null; }
    slots = getSaveSlots();
  }
  const id = newSlotId();
  const next = { ...migrateSave(state), _slotId: id, screen: 'game' };
  return saveGame(next, id) ? next : null;
};

export const deleteSave = (slotId) => {
  const storage = safeStorage();
  if (!storage) return false;
  try {
    const id = slotId || storage.getItem(CURRENT_SLOT_KEY);
    if (!id) { storage.removeItem(LEGACY_SAVE_KEY); return true; }
    storage.removeItem(slotKey(id));
    if (id === 'legacy') storage.removeItem(LEGACY_SAVE_KEY);
    const index = readIndex().filter((slot) => slot.id !== id);
    writeIndex(index);
    if (storage.getItem(CURRENT_SLOT_KEY) === id) {
      if (index.length) storage.setItem(CURRENT_SLOT_KEY, index[0].id);
      else storage.removeItem(CURRENT_SLOT_KEY);
    }
    return true;
  } catch { return false; }
};

export const hasSave = () => getSaveSlots().length > 0;

export const exportSaveText = (state) => JSON.stringify({ format: 'TreblrSave', version: SAVE_VERSION, exportedAt: new Date().toISOString(), game: migrateSave(state) }, null, 2);

export const importSaveText = (text) => {
  const parsed = JSON.parse(text);
  const candidate = parsed?.format === 'TreblrSave' ? parsed.game : parsed?.game || parsed;
  const state = migrateSave(candidate);
  const imported = createCareerSlot({ ...state, screen: 'game' });
  if (!imported) throw new Error(getSaveSlots().length >= MAX_CAREER_SLOTS ? `Career slot limit reached (${MAX_CAREER_SLOTS}).` : 'Could not save imported career. Check available storage.');
  return imported;
};
