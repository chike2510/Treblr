import { LABELS, LABEL_EVENTS, RANDOM_EVENTS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { clamp, roll, getTier, getTimeLabel } from './utils';
import { calculateCatalogWeek, artistShare } from './incomeCalc';
import { tickNPCReleases, buildCharts } from './npcEngine';
import { evaluateAwards, getAwardCategories } from './awards';
import { getCityEvents, simulateTourStop } from './cityScene';
import { getWeeklySocialEnergy } from './careerPerks';
import { progressJobWeek } from './jobProgress';
import { saveGame } from './gameState';
import { WEEKLY_ACTION_POINTS } from './actionPoints';

export const addNews = (items, msg, type = '', week = 0) => [
  { msg, type, week },
  ...(Array.isArray(items) ? items : []),
].slice(0, 100);

const formatMoney = (value) => Math.round(value || 0).toLocaleString('en-NG');
const statCaps = { sw:100, vc:100, pd:100, lp:100, hustle:25, charisma:25, network:20, reputation:100, clout:100, energy:100, fans:999_000_000, money:999_000_000_000 };

const applyEffects = (state, effects = {}) => {
  for (const [key, delta] of Object.entries(effects)) {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) continue;
    if (Object.prototype.hasOwnProperty.call(state.socialPlatforms || {}, key)) {
      state.socialPlatforms = { ...state.socialPlatforms, [key]: clamp((state.socialPlatforms[key] || 0) + delta, 0, 999_000_000) };
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(state, key)) continue;
    const min = key === 'money' || key === 'fans' ? 0 : key === 'reputation' || key === 'clout' ? 0 : 0;
    const max = statCaps[key] || (key === 'pressure' ? 10 : key === 'money' ? 999_000_000_000 : key === 'fans' ? 999_000_000 : 100);
    state[key] = clamp((Number(state[key]) || 0) + delta, min, max);
  }
  return state;
};

const getPlayerArtistChart = (streamChart) => {
  const artists = new Map();
  for (const song of streamChart || []) {
    const current = artists.get(song.artist) || { artist:song.artist, isPlayer:!!song.isPlayer, score:0, weeklyStreams:0, position:101 };
    current.score += Number(song.score || 0);
    current.weeklyStreams += Number(song.weeklyStreams || 0);
    current.position = Math.min(current.position, song.position || 101);
    artists.set(song.artist, current);
  }
  return [...artists.values()].sort((a, b) => b.score - a.score).slice(0, 100).map((artist, index) => ({ ...artist, position:index + 1 }));
};

const tickLabelContract = (state, label) => {
  if (label.id === 'independent') {
    state.socialPostsThisWeek = 0;
    state.contractObligations = { postsDue:0, singlesDue:0, albumsDue:0 };
    return;
  }
  const demands = label.obligations || { postsPerWeek: 0, singlesPer12Weeks: 0, albumsPer48Weeks: 0 };
  const posts = Number(state.socialPostsThisWeek || 0);
  if (posts < demands.postsPerWeek) {
    state.pressure = clamp((state.pressure || 0) + 0.45, 0, 10);
    state.labelRel = clamp((state.labelRel || 0) - 1, 0, 100);
    if (demands.postsPerWeek) state.news = addNews(state.news, `Missed this week's ${label.name} promo target (${posts}/${demands.postsPerWeek} posts).`, 'neg', state.totalWeeks);
  } else {
    state.pressure = clamp((state.pressure || 0) - 0.3, 0, 10);
    state.labelRel = clamp((state.labelRel || 0) + 0.25, 0, 100);
  }
  state.socialPostsThisWeek = 0;

  const elapsed = Math.max(1, state.totalWeeks - Number(state.contractStartedWeek || 0));
  if (elapsed % 12 === 0 && demands.singlesPer12Weeks > 0) {
    const releasedRecently = (state.catalog || []).filter((track) => track.released && (track.releaseType || 'single') === 'single' && (state.totalWeeks - Number(track.releaseWeek || 0)) <= 12).length;
    if (releasedRecently < demands.singlesPer12Weeks) {
      state.pressure = clamp(state.pressure + 1.2, 0, 10);
      state.labelRel = clamp(state.labelRel - 3, 0, 100);
      state.news = addNews(state.news, `${label.name} wanted a single this quarter; your contract pressure increased.`, 'neg', state.totalWeeks);
    } else {
      state.pressure = clamp(state.pressure - 0.8, 0, 10);
    }
  }
  if (elapsed % 48 === 0 && demands.albumsPer48Weeks > 0) {
    const projects = (state.projects || []).filter((project) => project.type === 'album' && state.totalWeeks - Number(project.releaseWeek || 0) <= 48).length;
    if (projects < demands.albumsPer48Weeks) {
      state.pressure = clamp(state.pressure + 1.5, 0, 10);
      state.labelRel = clamp(state.labelRel - 5, 0, 100);
      state.news = addNews(state.news, `${label.name} missed its annual project target; renegotiation or release may be safer.`, 'neg', state.totalWeeks);
    }
  }
  const singlesReleased = (state.catalog || []).filter((track) => track.released && (track.releaseType || 'single') === 'single' && (state.totalWeeks - Number(track.releaseWeek || 0)) <= 12).length;
  const albumsReleased = (state.projects || []).filter((project) => project.type === 'album' && state.totalWeeks - Number(project.releaseWeek || 0) <= 48).length;
  state.contractObligations = {
    postsDue:Math.max(0, Number(demands.postsPerWeek || 0) - Number(state.socialPostsThisWeek || 0)),
    singlesDue:Math.max(0, Number(demands.singlesPer12Weeks || 0) - singlesReleased),
    albumsDue:Math.max(0, Number(demands.albumsPer48Weeks || 0) - albumsReleased),
  };
};

export const endWeek = (prev, showToast, setModal) => {
  const oldLabel = LABELS.find((item) => item.id === prev.labelId) || LABELS[0];
  let next = {
    ...prev,
    totalWeeks: Number(prev.totalWeeks || 0) + 1,
    sp: WEEKLY_ACTION_POINTS,
    maxSp: WEEKLY_ACTION_POINTS,
    se: getWeeklySocialEnergy(prev),
    _pendingToast: null,
    _pendingModal: null,
  };

  // Restore energy and progress existing personal obligations.
  let energyRecovery = 20;
  if (next.tourActive) energyRecovery -= 10;
  if (!next.activeJob) energyRecovery += 5;
  next.energy = clamp((next.energy || 0) + energyRecovery, 0, 100);
  if (next.inPrison && next.prisonWeeksLeft > 0) {
    next.prisonWeeksLeft -= 1;
    if (next.prisonWeeksLeft === 0) {
      next.inPrison = false;
      next.news = addNews(next.news, 'Released from prison. Back to the grind.', 'pos', next.totalWeeks);
    }
  }

  let jobIncome = 0;
  if (next.activeJob && !next.inPrison) {
    const job = next.activeJob;
    if (job.illegal && Math.random() < (job.prisonRisk || 0.1)) {
      next.inPrison = true;
      next.prisonWeeksLeft = job.prisonWeeks || 4;
      next.activeJob = null;
      next.money = clamp((next.money || 0) - Math.round((next.money || 0) * 0.15), 0, 999_000_000_000);
      next.news = addNews(next.news, `ARRESTED doing "${job.label}". ${job.prisonWeeks || 4} weeks inside. Legal fees hit.`, 'neg', next.totalWeeks);
      next._pendingToast = `ARRESTED — ${job.prisonWeeks || 4} WEEKS INSIDE`;
    } else {
      const result = progressJobWeek(next, job, job.weeksLeft);
      next = result.state;
      jobIncome = result.wage;
      if (result.completed) {
        next.activeJob = null;
        next.news = addNews(next.news, `Finished "${job.label}" — job complete. Skills and industry contacts earned.`, 'pos', next.totalWeeks);
      } else {
        next.activeJob = { ...job, weeksLeft: Math.max(0, job.weeksLeft - 1) };
      }
    }
  }

  const label = LABELS.find((item) => item.id === next.labelId) || LABELS[0];
  tickLabelContract(next, label);
  if (label.id !== 'independent' && next.contractWeeksLeft > 0) {
    next.contractWeeksLeft -= 1;
    if (next.contractWeeksLeft === 0) {
      next.labelId = 'independent';
      next.contractSplit = null;
      next.creativeControl = 100;
      next.contractStartedWeek = null;
      next.contractObligations = { postsDue:0, singlesDue:0, albumsDue:0 };
      next.pressure = 0;
      next.labelRel = 80;
      next.news = addNews(next.news, `${label.name} contract term ended. You regain full independence and creative control.`, 'milestone', next.totalWeeks);
      next._pendingToast = 'CONTRACT COMPLETE · INDEPENDENT AGAIN';
    }
  }

  // Actual per-song streams/sales/visual views; project totals roll up from the same tracks.
  const trackWeek = calculateCatalogWeek(next);
  next.catalog = trackWeek.catalog;
  next.projects = trackWeek.projects;
  next.weeklyStreamCount = trackWeek.weeklyStreams;
  next.totalLifetimeStreams = Number(prev.totalLifetimeStreams || 0) + trackWeek.weeklyStreams;
  next.weeklySales = trackWeek.weeklySales;
  next.weeklyVideoViews = trackWeek.weeklyVideoViews;
  const rawStreamIncome = Math.round(trackWeek.weeklyStreams / 3);
  const currentLabel = LABELS.find((item) => item.id === next.labelId) || LABELS[0];
  const artistStreamIncome = artistShare(rawStreamIncome, currentLabel, next);
  next.weeklyStreamIncome = artistStreamIncome;
  const labelCut = rawStreamIncome - artistStreamIncome;
  if (currentLabel.id !== 'independent' && next.recouped < currentLabel.advance) {
    next.recouped = Math.min(next.recouped + labelCut, currentLabel.advance);
  }

  let merchIncome = 0;
  next.activeMerchDrops = (next.activeMerchDrops || []).map((drop) => {
    if (drop.weeksLeft <= 0) return drop;
    merchIncome += Math.round((drop.revenue || 0) / 4);
    return { ...drop, weeksLeft: drop.weeksLeft - 1 };
  }).filter((drop) => drop.weeksLeft > 0);

  const managerCost = next.hasManager ? 200_000 : 0;
  const lawyerCost = next.hasLawyer ? 100_000 : 0;
  let campaignSpend = 0;
  let campaignFanGain = 0;
  if (next.ownLabel && next.labelId === 'independent') {
    campaignSpend = Math.min(Math.max(0, Number(next.ownLabel.budget || 0)), Math.max(0, Number(next.money || 0)));
    if (campaignSpend > 0) {
      campaignFanGain = Math.max(1, Math.round(campaignSpend / 25_000 * (0.85 + Number(next.ownLabel.reputation || 20) / 200)));
      next.ownLabel = { ...next.ownLabel, reputation: clamp((next.ownLabel.reputation || 20) + campaignFanGain / 2500, 0, 100), lastSpend:campaignSpend };
      next.ownLabelCampaigns = [{ week:next.totalWeeks, spend:campaignSpend, reach:campaignSpend * 14, fanGain:campaignFanGain }, ...(next.ownLabelCampaigns || [])].slice(0, 52);
      next.news = addNews(next.news, `${next.ownLabel.name} campaign spent ₦${formatMoney(campaignSpend)} and added ${campaignFanGain.toLocaleString()} fans.`, 'pos', next.totalWeeks);
    }
  }

  let tourIncome = 0;
  let tourGross = 0;
  let tourStop = null;
  if (next.tourActive && next.tourData && next.tourWeeksLeft > 0) {
    const route = [...(next.tourData.route || [])];
    const stopIndex = route.length - next.tourWeeksLeft;
    const bookedStop = route[stopIndex];
    if (bookedStop) {
      tourStop = simulateTourStop(next, bookedStop);
      route[stopIndex] = tourStop;
      tourGross = tourStop.revenue;
      const tourShare = currentLabel.id === 'apex' ? 0.6 : 1;
      tourIncome = Math.round(tourGross * tourShare);
      next.fans = clamp(next.fans + tourStop.fans, 0, 999_000_000);
      next.clout = clamp(next.clout + Math.max(1, Math.round(tourStop.attendance / 750)), 0, 100);
      next.lp = clamp((next.lp || 0) + 1, 0, 100);
      next.news = addNews(next.news, `${next.tourData.label}: ${tourStop.city} drew ${tourStop.attendance.toLocaleString()} fans${currentLabel.id === 'apex' ? '; Apex kept 40% of gross.' : '.'}`, 'pos', next.totalWeeks);
    }
    next.tourData = { ...next.tourData, route, grossEarned:(next.tourData.grossEarned || 0) + tourGross, earnings:(next.tourData.earnings || 0) + tourIncome };
    next.tourWeeksLeft -= 1;
    if (next.tourWeeksLeft <= 0) {
      next.tourActive = false;
      next.tourCooldownEnd = next.totalWeeks + 4;
      next.tourHistory = [{ ...next.tourData, completedWeek:next.totalWeeks, stops:route }, ...(next.tourHistory || [])].slice(0, 20);
      next.news = addNews(next.news, `${next.tourData.label} wrapped · ${route.reduce((sum, stop) => sum + (stop.attendance || 0), 0).toLocaleString()} total attendance.`, 'milestone', next.totalWeeks);
      next.tourData = null;
    }
  }

  // Fixed weekly label/team bills; own-label spend is a transparent campaign cost.
  const totalSocial = Object.values(next.socialPlatforms || {}).reduce((sum, value) => sum + (value || 0), 0);
  const growthCeiling = Math.max(0.05, 1 - Math.log10(Math.max(1, next.fans)) / 9);
  const organicGrowth = Math.round(((next.clout * 0.9) + (totalSocial * 0.0008)) * growthCeiling);
  next.fans = clamp(next.fans + organicGrowth + campaignFanGain, 0, 999_000_000);
  const totalIncome = artistStreamIncome + merchIncome + tourIncome + jobIncome;
  next.money = clamp((next.money || 0) + totalIncome - managerCost - lawyerCost - campaignSpend, 0, 999_000_000_000);

  if (next.socialPlatforms) {
    const followers = Math.max(0, Math.round(trackWeek.weeklyStreams / 350));
    next.socialPlatforms = { ...next.socialPlatforms, soundify: clamp((next.socialPlatforms.soundify || 0) + followers, 0, 999_000_000) };
  }

  // Periodic tax liability remains visible in the weekly ledger.
  next.taxAccum = (next.taxAccum || 0) + Math.round(Math.max(0, artistStreamIncome + merchIncome + tourIncome + jobIncome) * 0.2);
  let taxPaid = 0;
  if (next.totalWeeks > 0 && next.totalWeeks % 12 === 0 && next.taxAccum > 0) {
    taxPaid = Math.min(next.taxAccum, next.money);
    next.money -= taxPaid;
    next.news = addNews(next.news, `Quarterly tax paid: ₦${formatMoney(taxPaid)}.`, 'neg', next.totalWeeks);
    next.taxAccum = 0;
  }

  // Evolving rival catalog, audiences, and career momentum.
  const rivalWeek = tickNPCReleases(next.npcCatalog || [], next.npcLastRelease || {}, next.totalWeeks, next.npcCareers || {});
  next.npcCatalog = rivalWeek.updatedCatalog;
  next.npcLastRelease = rivalWeek.updatedLastRelease;
  next.npcCareers = rivalWeek.updatedCareers;
  for (const song of rivalWeek.newNpcSongs) {
    const artist = NPC_ARTISTS.find((item) => item.id === song.npcId);
    if (artist) next.news = addNews(next.news, `${artist.name} released "${song.title}" — a new rival catalog entry.`, 'npc', next.totalWeeks);
  }

  // Monthly scoreboards now use actual track streams, sales, and video views.
  if (next.totalWeeks === 1 || Math.floor(next.totalWeeks / 4) !== Math.floor((prev.totalWeeks || 0) / 4)) {
    next.charts = buildCharts(next.catalog, next.npcCatalog, next);
    next.catalog = next.catalog.map((track) => {
      if (!track.released) return track;
      const entry = (next.charts.streams || []).find((chart) => chart.id === track.id);
      return { ...track, chartPos:entry?.position ?? null, currentPos:entry?.position ?? null };
    });
    next.latestChartSnapshot = {
      week:next.totalWeeks,
      hot100:(next.charts.streams || []).slice(0, 10),
      global200:(next.charts.sales || []).slice(0, 10),
      video50:(next.charts.videos || []).slice(0, 10),
      artist100:getPlayerArtistChart(next.charts.streams || []),
    };
  }

  // Events are filtered by city/genre and every numeric effect is applied consistently.
  if (Math.random() < 0.15) {
    const eligible = RANDOM_EVENTS.filter((event) => {
      if (event.id === 'award_nom') return false;
      if (event.minWeeks && next.totalWeeks < event.minWeeks) return false;
      if (event.minFans && next.fans < event.minFans) return false;
      if (event.maxFans && next.fans > event.maxFans) return false;
      if (event.city && event.city !== next.city) return false;
      if (event.city && !getCityEvents(next.city).includes(event.id)) return false;
      if (event.genre && event.genre !== next.genre) return false;
      return true;
    });
    if (eligible.length) {
      const event = roll(eligible);
      applyEffects(next, event.effect);
      next._pendingModal = { type:'world_event', event };
      next.news = addNews(next.news, `${event.label} — ${event.desc}`, event.neg ? 'neg' : 'pos', next.totalWeeks);
    }
  }

  // Annual award night: nominations and wins are derived from catalog, reach, projects, videos, and tours.
  if (next.totalWeeks % 48 === 0) {
    const categories = getAwardCategories(next);
    next.awardNoms = categories.filter((category) => category.eligible && category.score >= category.minimum * 0.86).length;
    const wins = evaluateAwards(next);
    if (wins.length) {
      next.awards = [...(next.awards || []), ...wins];
      next.clout = clamp(next.clout + wins.length * 3, 0, 100);
      next.reputation = clamp(next.reputation + wins.length * 2, 0, 100);
      next.money = clamp(next.money + wins.length * 1_500_000, 0, 999_000_000_000);
      const titles = wins.map((award) => award.title + (award.work ? ` for “${award.work}”` : '')).join(', ');
      const event = { id:'award_win', label:'Award Night', desc:`You won ${titles}. The judges rewarded the catalog, audience, and live work you built.`, effect:{ clout:wins.length * 3, reputation:wins.length * 2, money:wins.length * 1_500_000 }, neg:false };
      if (!next._pendingModal) next._pendingModal = { type:'world_event', event };
      next.news = addNews(next.news, event.desc, 'milestone', next.totalWeeks);
    } else {
      next.news = addNews(next.news, 'Award season closed. No win this year—keep building the catalog, audience, visuals, and live show.', '', next.totalWeeks);
    }
  }

  // Label-facing events and renegotiation/drop decision.
  const activeLabel = LABELS.find((item) => item.id === next.labelId) || LABELS[0];
  if (activeLabel.id !== 'independent' && Math.random() < 0.08) {
    const event = roll(LABEL_EVENTS.filter((item) => item.id !== 'dropped_risk' && item.id !== '360_cut'));
    if (event.choice) {
      if (!next._pendingModal) next._pendingModal = { type:'label_event', event };
    } else if (event.effect) {
      applyEffects(next, event.effect);
      next.news = addNews(next.news, `${event.label} — ${event.desc}`, event.id === 'promo_push' || event.id === 'bonus_payment' ? 'pos' : 'neg', next.totalWeeks);
    }
  }
  if (activeLabel.id !== 'independent' && next.pressure >= activeLabel.pressureThreshold * 2.2 && Math.random() < 0.16) {
    const event = LABEL_EVENTS.find((item) => item.id === 'dropped_risk');
    if (event && !next._pendingModal) next._pendingModal = { type:'label_event', event };
  }

  const oldTier = getTier(prev.fans || 0);
  const newTier = getTier(next.fans || 0);
  if (newTier.tier !== oldTier.tier) {
    next.clout = clamp(next.clout + 5, 0, 100);
    next.news = addNews(next.news, `New tier unlocked: ${newTier.tier}! Industry venues, partners, and collaborators take notice.`, 'milestone', next.totalWeeks);
    if (!next._pendingToast) next._pendingToast = `TIER UP: ${newTier.tier.toUpperCase()}`;
  }

  const timeStr = getTimeLabel(next.totalWeeks, next.startYear);
  const tourText = tourStop ? ` · ${tourStop.city} ${tourStop.attendance} attended` : '';
  next.feed = [{ msg:`${timeStr} — ${trackWeek.weeklyStreams.toLocaleString()} streams · ₦${formatMoney(totalIncome)} income${tourText}`, type:'', week:next.totalWeeks }, ...(next.feed || []).slice(0, 49)];
  const reportEvents = [
    tourStop ? `${tourStop.city} show drew ${tourStop.attendance.toLocaleString()} fans for ₦${formatMoney(tourIncome)}.` : null,
    campaignSpend ? `${next.ownLabel?.name || 'Your label'} spent ₦${formatMoney(campaignSpend)} and reached ${formatMoney(campaignFanGain)} new fans.` : null,
    jobIncome ? `${prev.activeJob?.label || 'Your job'} paid ₦${formatMoney(jobIncome)}.` : null,
    taxPaid ? `Quarterly tax paid: ₦${formatMoney(taxPaid)}.` : null,
  ].filter(Boolean);
  next.weekReport = {
    week:next.totalWeeks,
    timeLabel:timeStr,
    revenue:totalIncome,
    streamIncome:artistStreamIncome,
    grossStreams:trackWeek.weeklyStreams,
    streamCount:trackWeek.weeklyStreams,
    trackStreams:trackWeek.catalog.filter((track) => track.released && track.weeklyStreams).map((track) => ({ id:track.id, title:track.title, streams:track.weeklyStreams, total:track.lifetimeStreams, chartPos:track.chartPos })),
    topTrack:trackWeek.catalog.filter((track) => track.released).sort((a,b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0))[0] || null,
    merchIncome,
    tourIncome,
    tourGross,
    tourStop,
    jobIncome,
    campaignSpend,
    campaignFanGain,
    teamCosts:managerCost + lawyerCost,
    tax:taxPaid,
    totalIncome,
    fansGained:next.fans - Number(prev.fans || 0),
    fansDelta:next.fans - Number(prev.fans || 0),
    fans:next.fans,
    totalFans:next.fans,
    money:next.money,
    totalMoney:next.money,
    weeklySales:trackWeek.weeklySales,
    weeklyVideoViews:trackWeek.weeklyVideoViews,
    events:reportEvents,
  };

  const saved = saveGame(next);
  if (!saved) next._pendingToast = 'Auto-save failed. Free device storage and use Save Now.';
  return next;
};

export const handleModalChoice = (prev, option, showToast) => {
  const effect = option?.effect || {};
  const next = { ...prev };
  const numericEffects = Object.fromEntries(Object.entries(effect).filter(([key, value]) => !['dropped', 'renegotiate'].includes(key) && typeof value === 'number' && Number.isFinite(value)));
  applyEffects(next, numericEffects);
  if (effect.dropped) {
    next.labelId = 'independent';
    next.contractWeeksLeft = 0;
    next.contractStartedWeek = null;
    next.contractObligations = { postsDue:0, singlesDue:0, albumsDue:0 };
    next.contractSplit = null;
    next.creativeControl = 100;
    next.pressure = 0;
    next.labelRel = 30;
    next.news = addNews(next.news, 'You separated from the label and regained your masters and full creative control.', 'neg', next.totalWeeks);
    return next;
  }
  if (effect.renegotiate) {
    if ((prev.clout || 0) < 40) {
      showToast?.('Need 40 clout to renegotiate.');
      return next;
    }
    const label = LABELS.find((item) => item.id === prev.labelId);
    if (!label || label.id === 'independent') return next;
    next.contractWeeksLeft = Math.max(26, Number(prev.contractWeeksLeft || 0) + 26);
    next.contractSplit = clamp(Number(prev.contractSplit ?? label.artistSplit) + 4, 10, 95);
    next.creativeControl = clamp(Number(prev.creativeControl ?? label.creativeControl) + 10, 10, 100);
    next.pressure = 0;
    next.labelRel = clamp((prev.labelRel || 0) + 12, 0, 100);
    next.news = addNews(next.news, `Renegotiated with ${label.name}: +4% artist split, +10 creative control, and six months added to term.`, 'pos', next.totalWeeks);
    return next;
  }
  return next;
};
