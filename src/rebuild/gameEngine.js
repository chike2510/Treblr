import {
  DISCOVER_ITEMS,
  CAREER_RANKS,
  FESTIVALS,
  GENRES,
  JOBS,
  LABEL_OFFERS,
  MARKETS,
  MAX_ACTION_POINTS,
  MAX_SOCIAL_ENERGY,
  PROJECT_TITLES,
  RELEASE_ARTWORK,
  RELEASE_CAMPAIGNS,
  SOCIAL_STORIES,
  STUDIO_FOCUSES,
} from './gameData';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
const round = (value) => Math.round(Number(value) || 0);
const byId = (items, id) => items.find((item) => item.id === id);
const notify = (state, message) => ({ ...state, notice: message, lastResult: null });
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
    careerXp: 0,
    careerRank: CAREER_RANKS[0].id,
    careerMilestones: [],
    awards: [],
    lastResult: null,
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

export function getCareerRank(xp = 0) {
  const value = Math.max(0, Number(xp) || 0);
  return CAREER_RANKS.reduce((rank, candidate) => candidate.minXp <= value ? candidate : rank, CAREER_RANKS[0]);
}

export function getCareerJourney(state) {
  const releases = state.stats?.releases || 0;
  const home = labelFor(state.homeMarketId);
  const homeProgress = state.marketProgress?.[home.id] || { familiarity: 0, gigs: 0 };
  const readyProject = state.projects?.some((project) => project.status === 'ready');
  const withAction = Boolean(state.actionPoints);
  if (releases === 0) {
    return {
      id: 'first-signal', title: readyProject ? 'Put your first signal in motion.' : 'Give the first single a reason to travel.',
      description: readyProject ? 'Your team has brought a release-ready project back. Pick its campaign, then watch the first listeners find it.' : 'Book a project-development session. Your team brings back a release candidate; you decide when and how it reaches people.',
      progress: readyProject ? 0.68 : 0.12, progressLabel: readyProject ? 'PROJECT READY · CAMPAIGN CHOICE NEXT' : 'NO RELEASE IN THE WORLD YET',
      actionTab: readyProject ? 'music' : 'studio', actionLabel: readyProject ? 'Choose the campaign' : withAction ? 'Book a project session' : 'See the release plan',
      nextUnlock: 'A first release can open a local radio conversation.',
    };
  }
  if (homeProgress.familiarity < 36 || homeProgress.gigs < 2) {
    const progress = Math.min(1, Math.max(homeProgress.familiarity / 36, homeProgress.gigs / 2));
    return {
      id: 'home-crowd', title: `Make ${home.name} feel like home.`,
      description: 'Turn release attention into a real local draw. A return to the home room builds familiarity and makes the next call easier to win.',
      progress, progressLabel: `${homeProgress.gigs}/2 HOME SHOWS · ${homeProgress.familiarity}% LOCAL FAMILIARITY`,
      actionTab: 'contracts', actionLabel: `Play a room in ${home.name}`, nextUnlock: 'A reliable home crowd makes the next city less of a gamble.',
    };
  }
  if ((state.stats?.tourStops || 0) < 1) {
    return {
      id: 'cross-current', title: 'Carry the signal to another city.',
      description: 'Your home crowd knows the name. Spend the fare and energy to see if the story travels; every stop adds a local foothold to the route.',
      progress: 0, progressLabel: '0/1 AWAY-MARKET SHOWS', actionTab: 'contracts', actionLabel: 'Route the next show',
      nextUnlock: 'A second city puts you on the regional press radar.',
    };
  }
  if ((state.fans || 0) < 650 || (state.reputation || 0) < 22) {
    const progress = Math.min(state.fans / 650, state.reputation / 22, 1);
    return {
      id: 'breakthrough', title: 'Turn attention into leverage.',
      description: 'Keep growing the crowd and reputation together. The right interview, campaign, or show can bring a serious offer within reach.',
      progress, progressLabel: `${numberText(state.fans)}/650 FANS · ${state.reputation}/22 BUZZ`,
      actionTab: state.reputation < 22 ? 'discover' : 'social', actionLabel: state.reputation < 22 ? 'Take a press call' : 'Build the next wave',
      nextUnlock: 'Breakthrough status brings larger rooms and better terms.',
    };
  }
  if ((state.visitedMarkets || []).length < 5) {
    return {
      id: 'global-relay', title: 'Make the whole circuit yours.',
      description: 'The name has weight now. Take the signal to the hubs you have not visited; familiarity makes each return more valuable.',
      progress: (state.visitedMarkets || []).length / 5, progressLabel: `${(state.visitedMarkets || []).length}/5 MARKETS TOUCHED`,
      actionTab: 'contracts', actionLabel: 'Choose the next city', nextUnlock: 'The five-city relay earns a permanent career award.',
    };
  }
  const remaining = Math.max(0, 3 - releases);
  return {
    id: 'headliner', title: remaining ? 'Build the catalogue that headlines.' : 'The route is yours. Keep raising the ceiling.',
    description: remaining ? 'The full circuit is listening. Add to the catalogue, protect your energy, and turn the route into a headline run.' : 'Every market knows your name. Your next decision is about the terms, the people, and the kind of career you want to keep.',
    progress: Math.min(1, releases / 3), progressLabel: `${Math.min(releases, 3)}/3 RELEASES · ${state.stats?.festivals || 0} FESTIVAL STAGES`,
    actionTab: remaining ? 'studio' : 'discover', actionLabel: remaining ? 'Build the next chapter' : 'Review the career file',
    nextUnlock: 'Headliner rank is earned through the work, not a single lucky week.',
  };
}

const numberText = (value) => Math.round(Number(value) || 0).toLocaleString();

function awardsFor(state) {
  const home = state.marketProgress?.[state.homeMarketId] || { familiarity: 0, gigs: 0 };
  return [
    { id: 'first-release', name: 'First Signal', detail: 'The first release reached the world.', earned: (state.stats?.releases || 0) >= 1 },
    { id: 'home-crowd', name: 'The Home Crowd', detail: 'Two shows made the home market a familiar room.', earned: home.gigs >= 2 && home.familiarity >= 36 },
    { id: 'regional-route', name: 'Two-City Relay', detail: 'The story found a second market.', earned: (state.visitedMarkets || []).length >= 2 && (state.stats?.tourStops || 0) >= 1 },
    { id: 'breakthrough', name: 'Breakthrough', detail: 'The audience and reputation both crossed the line.', earned: (state.fans || 0) >= 650 && (state.reputation || 0) >= 22 },
    { id: 'festival-debut', name: 'Festival Debut', detail: 'A festival trusted you with its stage.', earned: (state.stats?.festivals || 0) > 0 },
    { id: 'global-circuit', name: 'Five Hubs, One Signal', detail: 'Every Global Relay market has heard the name.', earned: (state.visitedMarkets || []).length >= 5 },
  ];
}

function addLog(state, next, message, xpEarned = 0, command = 'career-move') {
  const gainedXp = Math.max(0, round(xpEarned));
  const oldXp = Math.max(0, Number(state.careerXp) || 0);
  const newXp = oldXp + gainedXp;
  const oldRank = getCareerRank(oldXp);
  const newRank = getCareerRank(newXp);
  const rankUps = CAREER_RANKS.filter((rank) => rank.minXp > oldXp && rank.minXp <= newXp);
  const existingAwards = state.awards || [];
  const awardsWon = awardsFor(next).filter((award) => award.earned && !existingAwards.some((item) => item.id === award.id)).map(({ id, name, detail }) => ({ id, name, detail, week: state.week }));
  const achievements = [...new Set([...(state.achievements || []), ...rankUps.map((rank) => `rank-${rank.id}`), ...awardsWon.map((award) => award.id)])];
  const entry = { id: state.nextId, week: state.week, text: message, command, xp: gainedXp };
  const rankEntries = rankUps.map((rank, index) => ({ id: state.nextId + index + 1, week: state.week, text: `CAREER RANK · ${rank.title}. ${rank.unlock}`, command: 'milestone', xp: 0 }));
  const awardEntries = awardsWon.map((award, index) => ({ id: state.nextId + rankEntries.length + index + 1, week: state.week, text: `AWARD WON · ${award.name}. ${award.detail}`, command: 'award', xp: 0 }));
  const signed = (after, before) => round((Number(after) || 0) - (Number(before) || 0));
  const gains = {
    credits: signed(next.credits, state.credits), fans: signed(next.fans, state.fans), reputation: signed(next.reputation, state.reputation),
    energy: signed(next.energy, state.energy), health: signed(next.health, state.health),
    listeners: signed(next.stats?.careerStreams, state.stats?.careerStreams),
  };
  const unlocks = rankUps.map((rank) => rank.unlock);
  const noticeParts = [message, gainedXp ? `+${gainedXp} career XP` : '', rankUps.length ? rankUps.map((rank) => `${rank.title} rank unlocked: ${rank.unlock}`).join(' · ') : '', awardsWon.length ? `${awardsWon.map((award) => award.name).join(', ')} award${awardsWon.length > 1 ? 's' : ''} earned` : ''].filter(Boolean);
  return {
    ...next,
    careerXp: newXp,
    careerRank: newRank.id,
    careerMilestones: [...new Set([...(state.careerMilestones || []), ...rankUps.map((rank) => rank.id)])],
    awards: [...existingAwards, ...awardsWon],
    achievements,
    nextId: state.nextId + 1 + rankEntries.length + awardEntries.length,
    log: [...(state.log || []), entry, ...rankEntries, ...awardEntries].slice(-40),
    lastResult: { id: entry.id, week: state.week, command, text: message, xp: gainedXp, gains, rankUps, awardsWon, oldRank: oldRank.id, newRank: newRank.id },
    notice: noticeParts.join(' · '),
  };
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
    artwork: RELEASE_ARTWORK[state.projects.length % RELEASE_ARTWORK.length],
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
  return addLog(state, partial, project ? `Project development wrapped. “${project.title}” is ready for a release decision.` : `${focus.name} complete. ${focus.skill} is now ${skills[focus.skill]}.`, focus.id === 'writing' ? 22 : 16, 'studio-session');
}

function doRest(state) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const next = { ...state, actionPoints: state.actionPoints - 1, energy: clamp(state.energy + 34), health: clamp(state.health + 12), relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 2) } };
  return addLog(state, next, 'You took a recovery day. Energy, health, and trust with your team improved.', 8, 'rest');
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
  return addLog(state, next, `“${project.title}” is out. The ${campaign.name.toLowerCase()} reaches ${streams.toLocaleString()} modeled listeners.`, 58, 'release');
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
  return addLog(state, next, `${grade} night at ${market.venue}, ${market.name}: +${fans} local fans and ${payout.toLocaleString()} CR gross.`, 38 + (score >= 82 ? 10 : 0), 'gig');
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
  return addLog(state, next, `Festival invitation accepted: ${festival.name} brings +${festival.fans} new fans and ${festival.fee.toLocaleString()} CR.`, 70, 'festival');
}

function doJob(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const job = byId(JOBS, action.jobId);
  if (!job) return notify(state, 'Choose a call from the contracts desk.');
  const fatigue = spendEnergy(state, job.energy);
  const next = { ...state, credits: state.credits + job.pay, fans: state.fans + job.fans, reputation: clamp(state.reputation + 1), actionPoints: state.actionPoints - 1, energy: fatigue.energy, health: fatigue.health, relationships: { ...state.relationships, collaborator: clamp(state.relationships.collaborator + 2) } };
  return addLog(state, next, `${job.title} complete: +${job.pay.toLocaleString()} CR and ${job.fans} fans.`, 14, 'job');
}

function doSignLabel(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  if (state.label?.releasesLeft > 0) return notify(state, `${state.label.name} still has ${state.label.releasesLeft} releases on its term.`);
  const offer = byId(LABEL_OFFERS, action.labelId);
  if (!offer) return notify(state, 'Choose a fictional label contract to review.');
  if ((state.careerXp || 0) < (offer.minimumXp || 0)) return notify(state, `${offer.name} opens at ${getCareerRank(offer.minimumXp).title} rank.`);
  if (state.reputation < offer.minimumRep) return notify(state, `${offer.name} is looking for ${offer.minimumRep} reputation.`);
  const next = { ...state, credits: state.credits + offer.advance, actionPoints: state.actionPoints - 1, reputation: clamp(state.reputation + 2), label: { id: offer.id, name: offer.name, releasesLeft: offer.releases, share: offer.share, signedWeek: state.week }, relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 4) } };
  return addLog(state, next, `Signed ${offer.name}: ${offer.advance.toLocaleString()} CR advance for ${offer.share}% of ${offer.releases} releases.`, 32, 'sign-label');
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
  return addLog(state, next, `${story.name}: ${reach.toLocaleString()} modeled reach and +${fans} fans. No post leaves the game.`, 8, 'social-post');
}

function doInterview(state, action) {
  const blocked = actionBlock(state);
  if (blocked) return notify(state, blocked);
  const item = byId(DISCOVER_ITEMS, action.itemId);
  if (!item) return notify(state, 'Choose an available press opportunity.');
  if ((state.careerXp || 0) < (item.minimumXp || 0)) return notify(state, `${item.name} opens at ${getCareerRank(item.minimumXp).title} rank.`);
  const next = { ...state, actionPoints: state.actionPoints - 1, fans: state.fans + item.fans, reputation: clamp(state.reputation + item.reputation), stats: { ...state.stats, interviews: state.stats.interviews + 1 }, relationships: { ...state.relationships, manager: clamp(state.relationships.manager + 3) } };
  return addLog(state, next, `${item.name} published: +${item.fans} fans and +${item.reputation} reputation.`, 25, 'interview');
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
  const settlementXp = 10 + Math.min(10, round(weeklyStreams / 500));
  const xpBefore = Math.max(0, Number(state.careerXp) || 0);
  const rankUps = CAREER_RANKS.filter((rank) => rank.minXp > xpBefore && rank.minXp <= xpBefore + settlementXp);
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
  const report = { week: closingWeek, streams: weeklyStreams, income, royaltyCut, newFans, healthGain, managerTrust, actions: state.log.filter((item) => item.week === closingWeek && !['milestone', 'award'].includes(item.command)).slice(-6).map((item) => item.text), xpEarned: settlementXp, xpBefore, xpAfter: xpBefore + settlementXp, rankUps, awards: [] };
  const withReport = { ...next, weeklyReport: report };
  const settled = addLog(state, withReport, `Week ${closingWeek} settled: ${weeklyStreams.toLocaleString()} modeled streams, ${income.toLocaleString()} CR income, and a fresh schedule.`, settlementXp, 'close-week');
  return { ...settled, weeklyReport: { ...settled.weeklyReport, rankUps: settled.lastResult?.rankUps || rankUps, awards: settled.lastResult?.awardsWon || [] } };
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
