import {
  DISCOVER_ITEMS,
  FESTIVALS,
  GENRES,
  JOBS,
  LABEL_OFFERS,
  MARKETS,
  MAX_ACTION_POINTS,
  MAX_SOCIAL_ENERGY,
  PROJECT_TITLES,
  RELEASE_CAMPAIGNS,
  SOCIAL_STORIES,
  STUDIO_FOCUSES,
} from './gameData';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
const round = (value) => Math.round(Number(value) || 0);
const byId = (items, id) => items.find((item) => item.id === id);
const notify = (state, message) => ({ ...state, notice: message });
const labelFor = (id) => byId(MARKETS, id) || MARKETS[0];

export function createCareer({ stageName = 'New Artist', marketId = 'lagos', genreId = 'afrobeats' } = {}) {
  const market = labelFor(marketId);
  const genre = byId(GENRES, genreId) || GENRES[0];
  const marketProgress = Object.fromEntries(MARKETS.map((item) => [item.id, { familiarity: item.id === market.id ? 12 : 0, fans: item.id === market.id ? 120 : 0, gigs: 0 }]));
  return {
    schemaVersion: 2,
    stageName: String(stageName || 'New Artist').trim().slice(0, 24) || 'New Artist',
    homeMarketId: market.id,
    currentMarketId: market.id,
    genreId: genre.id,
    week: 1,
    completedWeeks: 0,
    credits: 12000,
    fans: 120,
    reputation: 10,
    energy: 82,
    health: 94,
    actionPoints: MAX_ACTION_POINTS,
    socialEnergy: MAX_SOCIAL_ENERGY,
    skills: { writing: 42, vocals: 40, performance: 34, marketing: 30, charisma: 28 },
    projects: [],
    relationships: { manager: 42, collaborator: 28 },
    marketProgress,
    label: null,
    socialStats: { audience: 0, lastReach: 0, posts: 0 },
    visitedMarkets: [market.id],
    festivalsPlayed: [],
    achievements: [],
    stats: { releases: 0, careerStreams: 0, lastWeekStreams: 0, lastWeekIncome: 0, gigs: 0, tourStops: 0, festivals: 0, sessions: 0, interviews: 0, socialPosts: 0 },
    weeklyReport: null,
    log: [{ id: 1, week: 1, text: `${market.name} is home base. Three career actions are yours this week.` }],
    nextId: 2,
    notice: '',
  };
}

function addLog(state, next, message) {
  const entry = { id: state.nextId, week: state.week, text: message };
  return { ...next, nextId: state.nextId + 1, log: [...(state.log || []), entry].slice(-40), notice: message };
}

function actionBlock(state) {
  return state.actionPoints > 0 ? '' : 'This week’s career actions are spent. Close the week to reset your schedule.';
}

function spendEnergy(state, amount) {
  const energy = Math.max(0, state.energy - amount);
  const overworked = energy < 12;
  return { energy, health: Math.max(0, state.health - (overworked ? 4 : 0)) };
}

function doStudioSession(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const focus = byId(STUDIO_FOCUSES, action.focusId);
  if (!focus) return notify(state, 'Choose a session from the studio schedule.');
  if (state.credits < focus.cost) return notify(state, `You need ${focus.cost.toLocaleString()} CR for that studio booking.`);
  const skills = { ...state.skills, [focus.skill]: clamp(state.skills[focus.skill] + focus.gain) };
  const fatigue = spendEnergy(state, focus.energy);
  const project = focus.id === 'writing' ? {
    id: `project-${state.nextId}`,
    title: PROJECT_TITLES[state.projects.length % PROJECT_TITLES.length],
    type: 'Single',
    status: 'ready',
    quality: clamp((skills.writing + skills.vocals + skills.marketing + state.relationships.collaborator * 0.18) / 2.18),
    createdWeek: state.week,
    releaseWeek: null,
    marketId: state.currentMarketId,
    totalStreams: 0,
    weeklyStreams: 0,
  } : null;
  const partial = {
    ...state,
    credits: state.credits - focus.cost,
    actionPoints: state.actionPoints - 1,
    energy: fatigue.energy,
    health: fatigue.health,
    skills,
    projects: project ? [...state.projects, project] : state.projects,
    relationships: { ...state.relationships, collaborator: clamp(state.relationships.collaborator + (focus.id === 'writing' ? 5 : 2)) },
    stats: { ...state.stats, sessions: state.stats.sessions + 1 },
  };
  return addLog(state, partial, project ? `Writing room wrapped. “${project.title}” is ready for a release decision.` : `${focus.name} complete. ${focus.skill} is now ${skills[focus.skill]}.`);
}

function doRest(state) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const next = { ...state, actionPoints: state.actionPoints - 1, energy: clamp(state.energy + 34), health: clamp(state.health + 12), relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 2) } };
  return addLog(state, next, 'You took a recovery day. Energy, health, and trust with your team improved.');
}

function doRelease(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const project = state.projects.find((item) => item.id === action.projectId && item.status === 'ready');
  if (!project) return notify(state, 'Choose a release-ready project from your Music desk.');
  const campaign = byId(RELEASE_CAMPAIGNS, action.campaignId) || RELEASE_CAMPAIGNS[0];
  if (state.credits < campaign.fee) return notify(state, `You need ${campaign.fee.toLocaleString()} CR for this release campaign.`);
  const labelBoost = state.label?.releasesLeft > 0 ? 1.12 : 1;
  const streams = round((180 + project.quality * 16 + state.fans * 0.12 + state.reputation * 9) * campaign.reach * labelBoost);
  const fans = Math.max(8, round((project.quality * 0.34 + state.reputation * 0.3) * campaign.fans));
  const projects = state.projects.map((item) => item.id === project.id ? { ...item, status: 'released', releaseWeek: state.week, weeklyStreams: streams, totalStreams: streams, campaignId: campaign.id, labelShare: state.label?.releasesLeft > 0 ? state.label.share : 0 } : item);
  const label = state.label?.releasesLeft > 0 ? { ...state.label, releasesLeft: Math.max(0, state.label.releasesLeft - 1) } : state.label;
  const next = {
    ...state,
    credits: state.credits - campaign.fee,
    fans: state.fans + fans,
    reputation: clamp(state.reputation + (campaign.id === 'press' ? 3 : 2)),
    actionPoints: state.actionPoints - 1,
    projects,
    label,
    stats: { ...state.stats, releases: state.stats.releases + 1, careerStreams: state.stats.careerStreams + streams },
    achievements: state.stats.releases === 0 ? [...new Set([...state.achievements, 'first-release'])] : state.achievements,
  };
  return addLog(state, next, `“${project.title}” is out. The ${campaign.name.toLowerCase()} reaches ${streams.toLocaleString()} modeled listeners.`);
}

function doGig(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const market = byId(MARKETS, action.marketId);
  if (!market) return notify(state, 'Choose a market on the global circuit.');
  const travel = state.currentMarketId === market.id ? 0 : market.fare;
  if (state.credits < travel) return notify(state, `You need ${travel.toLocaleString()} CR to travel to ${market.name}.`);
  const familiarity = state.marketProgress[market.id]?.familiarity || 0;
  const readiness = state.energy * 0.12 + state.health * 0.08;
  const score = clamp(28 + state.skills.performance * 0.48 + state.skills.charisma * 0.17 + state.reputation * 0.2 + familiarity * 0.16 + readiness);
  const grade = score >= 82 ? 'Standout' : score >= 68 ? 'Strong' : score >= 52 ? 'Growing' : 'Tough night';
  const payout = round(700 + score * 19 + familiarity * 5);
  const fans = round(16 + score * 0.45 + state.skills.marketing * 0.18);
  const fatigue = spendEnergy(state, 22);
  const previous = state.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 };
  const marketProgress = { ...state.marketProgress, [market.id]: { familiarity: clamp(previous.familiarity + 16), fans: previous.fans + fans, gigs: previous.gigs + 1 } };
  const visitedMarkets = state.visitedMarkets.includes(market.id) ? state.visitedMarkets : [...state.visitedMarkets, market.id];
  const gigs = [...(state.gigHistory || []), { id: `gig-${state.nextId}`, week: state.week, marketId: market.id, type: market.id === state.homeMarketId ? 'local' : 'tour', score, grade, payout, fans }].slice(-30);
  const next = {
    ...state,
    credits: state.credits - travel + payout,
    fans: state.fans + fans,
    reputation: clamp(state.reputation + (score >= 68 ? 2 : 1)),
    actionPoints: state.actionPoints - 1,
    energy: fatigue.energy,
    health: fatigue.health,
    currentMarketId: market.id,
    visitedMarkets,
    marketProgress,
    gigHistory: gigs,
    stats: { ...state.stats, gigs: state.stats.gigs + 1, tourStops: state.stats.tourStops + (market.id === state.homeMarketId ? 0 : 1) },
    relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 1) },
    achievements: visitedMarkets.length === MARKETS.length ? [...new Set([...state.achievements, 'global-circuit'])] : state.achievements,
  };
  return addLog(state, next, `${grade} night at ${market.venue}, ${market.name}: +${fans} local fans and ${payout.toLocaleString()} CR gross.`);
}

function doFestival(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const festival = byId(FESTIVALS, action.festivalId);
  if (!festival) return notify(state, 'Choose a festival invitation.');
  if (state.festivalsPlayed.includes(festival.id)) return notify(state, 'That festival is already on your career record.');
  if (state.fans < festival.minimumFans || state.reputation < festival.minimumRep) return notify(state, `Build to ${festival.minimumFans.toLocaleString()} fans and ${festival.minimumRep} reputation for this invitation.`);
  const market = labelFor(festival.marketId);
  const travel = state.currentMarketId === market.id ? 0 : market.fare;
  if (state.credits < travel) return notify(state, `You need ${travel.toLocaleString()} CR for travel to ${market.name}.`);
  const fatigue = spendEnergy(state, festival.energy);
  const progress = state.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 };
  const marketProgress = { ...state.marketProgress, [market.id]: { ...progress, familiarity: clamp(progress.familiarity + 20), fans: progress.fans + festival.fans } };
  const next = {
    ...state,
    credits: state.credits - travel + festival.fee,
    fans: state.fans + festival.fans,
    reputation: clamp(state.reputation + 4),
    actionPoints: state.actionPoints - 1,
    energy: fatigue.energy,
    health: fatigue.health,
    currentMarketId: market.id,
    visitedMarkets: state.visitedMarkets.includes(market.id) ? state.visitedMarkets : [...state.visitedMarkets, market.id],
    marketProgress,
    festivalsPlayed: [...state.festivalsPlayed, festival.id],
    stats: { ...state.stats, festivals: state.stats.festivals + 1 },
    relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 3) },
  };
  return addLog(state, next, `Festival invitation accepted: ${festival.name} brings +${festival.fans} new fans and ${festival.fee.toLocaleString()} CR.`);
}

function doJob(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const job = byId(JOBS, action.jobId);
  if (!job) return notify(state, 'Choose a call from the contracts desk.');
  const fatigue = spendEnergy(state, job.energy);
  const next = { ...state, credits: state.credits + job.pay, fans: state.fans + job.fans, reputation: clamp(state.reputation + 1), actionPoints: state.actionPoints - 1, energy: fatigue.energy, health: fatigue.health, relationships: { ...state.relationships, collaborator: clamp(state.relationships.collaborator + 2) } };
  return addLog(state, next, `${job.title} complete: +${job.pay.toLocaleString()} CR and ${job.fans} fans.`);
}

function doSignLabel(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  if (state.label?.releasesLeft > 0) return notify(state, `${state.label.name} still has ${state.label.releasesLeft} releases on its term.`);
  const offer = byId(LABEL_OFFERS, action.labelId);
  if (!offer) return notify(state, 'Choose a fictional label contract to review.');
  if (state.reputation < offer.minimumRep) return notify(state, `${offer.name} is looking for ${offer.minimumRep} reputation.`);
  const next = { ...state, credits: state.credits + offer.advance, actionPoints: state.actionPoints - 1, reputation: clamp(state.reputation + 2), label: { id: offer.id, name: offer.name, releasesLeft: offer.releases, share: offer.share, signedWeek: state.week }, relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 4) } };
  return addLog(state, next, `Signed ${offer.name}: ${offer.advance.toLocaleString()} CR advance for ${offer.share}% of ${offer.releases} releases.`);
}

function doSocialPost(state, action) {
  if (state.socialEnergy <= 0) return notify(state, 'Your publicity energy is spent until next week.');
  const story = byId(SOCIAL_STORIES, action.storyId);
  if (!story) return notify(state, 'Choose a story to share with the crowd.');
  const recent = action.storyId === 'live-recap' && (state.stats.gigs + state.stats.festivals) > 0 ? 1.18 : 1;
  const reach = round((90 + state.fans * 0.28 + state.reputation * 13) * story.reach * recent);
  const fans = Math.max(4, round(reach * 0.055 + story.fans * 0.28));
  const previous = state.socialStats || { audience: 0, lastReach: 0, posts: 0 };
  const next = {
    ...state,
    fans: state.fans + fans,
    reputation: clamp(state.reputation + story.reputation),
    socialEnergy: state.socialEnergy - 1,
    socialStats: { audience: previous.audience + round(reach * 0.14), lastReach: reach, posts: previous.posts + 1 },
    stats: { ...state.stats, socialPosts: state.stats.socialPosts + 1 },
    relationships: { ...state.relationships, [story.relationship]: clamp(state.relationships[story.relationship] + 2) },
  };
  return addLog(state, next, `${story.name}: ${reach.toLocaleString()} modeled reach and +${fans} fans. No post leaves the game.`);
}

function doInterview(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const item = byId(DISCOVER_ITEMS, action.itemId);
  if (!item) return notify(state, 'Choose an available press opportunity.');
  const next = { ...state, actionPoints: state.actionPoints - 1, fans: state.fans + item.fans, reputation: clamp(state.reputation + item.reputation), stats: { ...state.stats, interviews: state.stats.interviews + 1 }, relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 3) } };
  return addLog(state, next, `${item.name} published: +${item.fans} fans and +${item.reputation} reputation.`);
}

export function closeWeek(state) {
  if (!state) return state;
  const closingWeek = state.week;
  const postCount = state.socialStats?.posts || 0;
  const projects = state.projects.map((project) => {
    if (project.status !== 'released') return project;
    const age = Math.max(0, closingWeek - project.releaseWeek);
    const decay = Math.max(0.48, 1 - age * 0.08);
    const weeklyStreams = Math.max(30, round((70 + project.quality * 5 + state.fans * 0.055 + postCount * 24) * decay));
    return { ...project, weeklyStreams, totalStreams: project.totalStreams + weeklyStreams };
  });
  const weeklyStreams = projects.reduce((sum, project) => sum + (project.status === 'released' ? project.weeklyStreams : 0), 0);
  const gross = round(weeklyStreams * 0.28);
  const royaltyCut = projects.reduce((sum, project) => sum + (project.status === 'released' ? round(project.weeklyStreams * 0.28 * (project.labelShare || 0) / 100) : 0), 0);
  const income = gross - royaltyCut;
  const newFans = weeklyStreams > 0 ? Math.max(3, round(weeklyStreams / 180)) : 0;
  const healthGain = state.energy < 18 ? 3 : 7;
  const managerTrust = state.energy >= 30 ? 1 : -2;
  const next = {
    ...state,
    week: closingWeek + 1,
    completedWeeks: state.completedWeeks + 1,
    credits: Math.max(0, state.credits + income),
    fans: state.fans + newFans,
    reputation: clamp(state.reputation + (weeklyStreams > 0 ? 1 : 0)),
    energy: clamp(state.energy + 42),
    health: clamp(state.health + healthGain),
    actionPoints: MAX_ACTION_POINTS,
    socialEnergy: MAX_SOCIAL_ENERGY,
    projects,
    stats: { ...state.stats, careerStreams: state.stats.careerStreams + weeklyStreams, lastWeekStreams: weeklyStreams, lastWeekIncome: income },
    relationships: { ...state.relationships, manager: clamp(state.relationships.manager + managerTrust) },
    socialStats: { ...state.socialStats, lastReach: 0 },
    notice: '',
  };
  const report = { week: closingWeek, streams: weeklyStreams, income, royaltyCut, newFans, healthGain, managerTrust, actions: state.log.filter((item) => item.week === closingWeek).slice(-6).map((item) => item.text) };
  const withReport = { ...next, weeklyReport: report };
  return addLog({ ...state, nextId: state.nextId + 1 }, withReport, `Week ${closingWeek} settled: ${weeklyStreams.toLocaleString()} modeled streams, ${income.toLocaleString()} CR income, and a fresh schedule.`);
}

export function gameReducer(state, action) {
  if (!state || !action) return state;
  if (action.type === 'clear-notice') return { ...state, notice: '' };
  if (action.type === 'close-week') return closeWeek(state);
  if (action.type !== 'command') return state;
  switch (action.command) {
    case 'studio-session': return doStudioSession(state, action);
    case 'rest': return doRest(state);
    case 'release': return doRelease(state, action);
    case 'gig': return doGig(state, action);
    case 'festival': return doFestival(state, action);
    case 'job': return doJob(state, action);
    case 'sign-label': return doSignLabel(state, action);
    case 'social-post': return doSocialPost(state, action);
    case 'interview': return doInterview(state, action);
    default: return state;
  }
}

export function canUseCommand(state, command) {
  if (command === 'social-post') return state.socialEnergy > 0;
  return state.actionPoints > 0;
}

export function getCareerSummary(state) {
  return {
    releases: state.projects.filter((item) => item.status === 'released').length,
    readyProjects: state.projects.filter((item) => item.status === 'ready').length,
    careerStreams: state.stats.careerStreams,
    marketsPlayed: state.visitedMarkets.length,
    gigs: state.stats.gigs,
  };
}
