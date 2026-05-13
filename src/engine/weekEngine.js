import { LABELS, LABEL_EVENTS, RANDOM_EVENTS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { clamp, roll, rand, getTier, getTimeLabel } from './utils';
import { calcWeeklyStreamIncome, artistShare } from './incomeCalc';
import { tickNPCReleases, buildCharts } from './npcEngine';
import { saveGame } from './gameState';

export const endWeek = (prev, showToast, setModal) => {
  const label = LABELS.find(l => l.id === prev.labelId) || LABELS[0];

  let next = {
    ...prev,
    totalWeeks: prev.totalWeeks + 1,
    sp: 5,
    se: prev.maxSe || 7,
    _pendingToast: null,
    _pendingModal: null,
  };

  // ── Energy recovery (lifestyle-aware) ────────────────────────────────────
  let energyRec = 15;
  if (next.tourActive) energyRec -= 10;
  if (!next.activeJob) energyRec += 5;
  next.energy = clamp(next.energy + energyRec, 0, 100);

  // ── Prison tick ──────────────────────────────────────────────────────────
  if (next.inPrison && next.prisonWeeksLeft > 0) {
    next.prisonWeeksLeft -= 1;
    if (next.prisonWeeksLeft === 0) {
      next.inPrison = false;
      next.news = addNews(next.news, "Released from prison. Back to the grind.", 'pos', next.totalWeeks);
    }
  }

  // ── Active job tick ───────────────────────────────────────────────────────
  let jobIncome = 0;
  if (next.activeJob && !next.inPrison) {
    const { weeklyPay, weeksLeft, illegal, prisonRisk, prisonWeeks, label: jobLabel } = next.activeJob;
    jobIncome = weeklyPay;
    next.energy = clamp(next.energy - (next.activeJob.energyPerWeek || 10), 0, 100);
    if (illegal && Math.random() < (prisonRisk || 0.1)) {
      next.inPrison = true;
      next.prisonWeeksLeft = prisonWeeks || 4;
      next.activeJob = null;
      next.money = clamp(next.money - Math.round(next.money * 0.15), 0, 999_000_000_000);
      next.news = addNews(next.news, `ARRESTED doing "${jobLabel}". ${prisonWeeks || 4} weeks inside. Legal fees hit.`, 'neg', next.totalWeeks);
      next._pendingToast = 'ARRESTED — ' + (prisonWeeks || 4) + ' WEEKS INSIDE';
    } else {
      const newWeeksLeft = weeksLeft - 1;
      if (newWeeksLeft <= 0) {
        next.activeJob = null;
        next.news = addNews(next.news, `Finished "${jobLabel}" — job complete.`, 'pos', next.totalWeeks);
      } else {
        next.activeJob = { ...next.activeJob, weeksLeft: newWeeksLeft };
      }
    }
  }

  // ── Streaming income ─────────────────────────────────────────────────────
  const rawIncome = calcWeeklyStreamIncome(next);
  const share = artistShare(rawIncome, label);
  const labelCut = rawIncome - share;
  next.weeklyStreamIncome = share;

  if (label.id !== 'independent' && next.recouped < label.advance) {
    next.recouped = Math.min(next.recouped + labelCut, label.advance);
  }

  // ── Project income (EPs/Albums feed into earnings) ───────────────────────
  let projectIncome = 0;
  if (next.projects && next.projects.length > 0) {
    next.projects = next.projects.map(proj => {
      const weeksOut = next.totalWeeks - proj.releaseWeek;
      if (weeksOut > 104) return proj;
      const decay = Math.max(0.02, 1 - weeksOut / 104);
      const weekEarnings = Math.round(
        (proj.avgQuality / 100) * Math.sqrt(next.fans || 1) * 5 * decay * proj.trackIds.length
      );
      projectIncome += weekEarnings;
      return { ...proj, streams: (proj.streams || 0) + Math.round(weekEarnings / 3) };
    });
    next.weeklyStreamIncome += projectIncome;
  }

  // ── Merch income ─────────────────────────────────────────────────────────
  let merchIncome = 0;
  next.activeMerchDrops = (next.activeMerchDrops || []).map(drop => {
    if (drop.weeksLeft <= 0) return drop;
    const weekRev = Math.round(drop.revenue / 4);
    merchIncome += weekRev;
    return { ...drop, weeksLeft: drop.weeksLeft - 1 };
  }).filter(d => d.weeksLeft > 0);

  // ── Team costs ───────────────────────────────────────────────────────────
  const managerCost = next.hasManager ? 200000 : 0;
  const lawyerCost  = next.hasLawyer  ? 100000 : 0;
  const ownLabelBudget = (next.ownLabel && next.labelId === 'independent') ? (next.ownLabel.budget || 0) : 0;

  // ── Tour tick ────────────────────────────────────────────────────────────
  let tourWeekEarning = 0;
  if (next.tourActive && next.tourWeeksLeft > 0) {
    const totalTourWeeks = next.tourData?.weeks || 6;
    tourWeekEarning = Math.round((next.tourData?.revenue || 0) / totalTourWeeks);
    next.lp = clamp(next.lp + 1, 0, 25);
    next.tourWeeksLeft -= 1;
    if (next.tourWeeksLeft === 0) {
      next.tourActive = false;
      next.tourCooldownEnd = next.totalWeeks + 4;
      next.news = addNews(next.news, `Your ${next.tourData?.label || 'Tour'} wrapped! Every show was fire.`, 'pos', next.totalWeeks);
      next.tourData = null;
    }
  }

  // ── Money update ─────────────────────────────────────────────────────────
  next.money = clamp(
    next.money + share + projectIncome + merchIncome + tourWeekEarning + jobIncome - managerCost - lawyerCost - ownLabelBudget,
    0, 999_000_000_000
  );

  // ── Stream count tracking ─────────────────────────────────────────────────
  const weekStreams = Math.round(rawIncome / 3);
  next.weeklyStreamCount = weekStreams;
  next.totalLifetimeStreams = (prev.totalLifetimeStreams || 0) + weekStreams;

  // ── Quarterly tax ────────────────────────────────────────────────────────
  next.taxAccum = (next.taxAccum || 0) + Math.round(share * 0.20);
  const { weekInMonth, monthIndex } = getWeekMonth(next.totalWeeks);
  if (monthIndex % 3 === 0 && weekInMonth === 1 && next.totalWeeks > 0) {
    if (next.taxAccum > 0) {
      next.money = clamp(next.money - next.taxAccum, 0, 999_000_000_000);
      next.news = addNews(next.news, `Quarterly tax paid: ₦${fmtShort(next.taxAccum)}.`, 'neg', next.totalWeeks);
      next.taxAccum = 0;
    }
  }

  // ── Organic fan growth (ceiling friction at scale) ───────────────────────
  const totalSocial = Object.values(next.socialPlatforms || {}).reduce((a, b) => a + (b || 0), 0);
  const growthCeiling = Math.max(0.05, 1 - Math.log10(Math.max(1, next.fans)) / 9);
  const organicGrowth = Math.round((next.clout * 0.9 + totalSocial * 0.0008) * growthCeiling);
  next.fans = clamp(next.fans + organicGrowth, 0, 999_000_000);

  // Soundify auto-grows with streams
  if (next.socialPlatforms) {
    const streamGrowth = Math.round(share / 5000);
    next.socialPlatforms = {
      ...next.socialPlatforms,
      soundify: clamp((next.socialPlatforms.soundify || 0) + streamGrowth, 0, 999_000_000),
    };
  }

  // ── Label pressure ───────────────────────────────────────────────────────
  if (label.id !== 'independent') {
    next.pressure = clamp(next.pressure + 0.4, 0, 10);
    next.labelRel = clamp(next.labelRel - 0.3, 0, 100);
  }

  // ── NPC releases ────────────────────────────────────────────────────────
  const { newNpcSongs, updatedLastRelease, updatedCatalog } = tickNPCReleases(
    next.npcCatalog || [],
    next.npcLastRelease || {},
    next.totalWeeks
  );
  next.npcCatalog     = updatedCatalog;
  next.npcLastRelease = updatedLastRelease;

  for (const song of newNpcSongs) {
    const npc = NPC_ARTISTS.find(n => n.id === song.npcId);
    if (npc && npc.clout >= 85) {
      next.news = addNews(next.news, `${npc.name} just dropped "${song.title}" — watch the charts.`, 'npc', next.totalWeeks);
    }
  }

  // ── Chart update (monthly) ───────────────────────────────────────────────
  if (next.totalWeeks === 1 || Math.floor(next.totalWeeks / 4) !== Math.floor(prev.totalWeeks / 4)) {
    next.charts = buildCharts(next.catalog, next.npcCatalog, next);
    next.catalog = next.catalog.map(track => {
      if (!track.released) return track;
      const entry = (next.charts.streams || []).find(c => c.id === track.id);
      return { ...track, chartPos: entry ? entry.position : null };
    });
    next.latestChartSnapshot = {
      week: next.totalWeeks,
      hot100:    (next.charts.streams || []).slice(0, 10),
      global200: (next.charts.sales   || []).slice(0, 10),
      artist100: buildArtist100(next.charts.streams || []),
    };
  }

  // ── Random event (15% chance) ────────────────────────────────────────────
  if (Math.random() < 0.15) {
    const eligible = RANDOM_EVENTS.filter(ev => {
      if (ev.minWeeks && next.totalWeeks < ev.minWeeks) return false;
      if (ev.minFans  && next.fans  < ev.minFans)  return false;
      if (ev.maxFans  && next.fans  > ev.maxFans)  return false;
      if (ev.id === 'award_nom') {
        const hasGoodSong = next.catalog.some(t => t.released && t.quality >= 65);
        if (!hasGoodSong || next.fans < 50000 || next.awardNoms >= 3) return false;
      }
      return true;
    });
    if (eligible.length > 0) {
      const ev = roll(eligible);
      const fx = ev.effect || {};
      if (fx.fans)       next.fans       = clamp(next.fans       + fx.fans,       0, 999_000_000);
      if (fx.money)      next.money      = clamp(next.money      + fx.money,      0, 999_000_000_000);
      if (fx.clout)      next.clout      = clamp(next.clout      + fx.clout,      0, 100);
      if (fx.energy)     next.energy     = clamp(next.energy     + fx.energy,     0, 100);
      if (fx.reputation) next.reputation = clamp(next.reputation + fx.reputation, 0, 100);
      if (fx.sw)         next.sw         = clamp(next.sw         + fx.sw,         0, 25);
      if (fx.network)    next.network    = clamp(next.network    + fx.network,    1, 20);
      if (ev.id === 'award_nom') next.awardNoms = (next.awardNoms || 0) + 1;
      next._pendingModal = { type: 'world_event', event: ev };
      next.news = addNews(next.news, `${ev.label} — ${ev.desc}`, ev.neg ? 'neg' : 'pos', next.totalWeeks);
    }
  }

  // ── Awards ceremony ──────────────────────────────────────────────────────
  if (next.awardNoms >= 2 && next.totalWeeks % 52 === 0) {
    const award = {
      id: 'award_win', label: 'Award Show',
      desc: 'You won Best New Artist at the Music Awards! The industry is watching.',
      neg: false, effect: { clout: 10, fans: 5000, reputation: 10, money: 2000000 },
    };
    next.awards    = [...(next.awards || []), { week: next.totalWeeks, title: 'Best New Artist' }];
    next.awardNoms = 0;
    if (!next._pendingModal) next._pendingModal = { type: 'world_event', event: award };
    next.fans       = clamp(next.fans + 5000, 0, 999_000_000);
    next.clout      = clamp(next.clout + 10, 0, 100);
    next.reputation = clamp(next.reputation + 10, 0, 100);
    next.money      = clamp(next.money + 2000000, 0, 999_000_000_000);
    next.news = addNews(next.news, award.desc, 'milestone', next.totalWeeks);
  }

  // ── Label event ──────────────────────────────────────────────────────────
  if (label.id !== 'independent' && Math.random() < 0.25) {
    const ev = roll(LABEL_EVENTS.filter(e => e.id !== 'dropped_risk'));
    if (ev.choice) {
      if (!next._pendingModal) next._pendingModal = { type: 'label_event', event: ev };
    } else if (ev.effect) {
      const fx = ev.effect;
      if (fx.fans)     next.fans     = clamp(next.fans     + (fx.fans  || 0), 0, 999_000_000);
      if (fx.money)    next.money    = clamp(next.money    + (fx.money || 0), 0, 999_000_000_000);
      if (fx.clout)    next.clout    = clamp(next.clout    + (fx.clout || 0), 0, 100);
      if (fx.pressure) next.pressure = clamp(next.pressure + (fx.pressure || 0), 0, 10);
      if (fx.labelRel) next.labelRel = clamp(next.labelRel + (fx.labelRel || 0), 0, 100);
      const isPos = ev.id === 'promo_push' || ev.id === 'bonus_payment';
      next.news = addNews(next.news, `${ev.label} — ${ev.desc}`, isPos ? 'pos' : 'neg', next.totalWeeks);
    }
  }

  // ── Drop risk ────────────────────────────────────────────────────────────
  if (label.id !== 'independent' && next.pressure >= label.pressureThreshold * 3 && Math.random() < 0.3) {
    const ev = LABEL_EVENTS.find(e => e.id === 'dropped_risk');
    if (ev && !next._pendingModal) next._pendingModal = { type: 'label_event', event: ev };
  }

  // ── Tier-up check ────────────────────────────────────────────────────────
  const oldTier = getTier(prev.fans);
  const newTier = getTier(next.fans);
  if (newTier.tier !== oldTier.tier) {
    next.clout = clamp(next.clout + 5, 0, 100);
    next.news  = addNews(next.news, `New tier unlocked: ${newTier.tier}! The industry is taking notice.`, 'milestone', next.totalWeeks);
    if (!next._pendingToast) next._pendingToast = `TIER UP: ${newTier.tier.toUpperCase()}`;
  }

  // ── Weekly feed entry ────────────────────────────────────────────────────
  const timeStr = getTimeLabel(next.totalWeeks, next.startYear);
  next.feed = [
    { msg: `${timeStr} — Streams: ₦${fmtShort(share)}`, type: '', week: next.totalWeeks },
    ...((next.feed || []).slice(0, 49)),
  ];

  // ── Weekly report ────────────────────────────────────────────────────────
  const fansDelta = next.fans - prev.fans;
  const topTrack = (next.catalog || [])
    .filter(t => t.released)
    .sort((a, b) => (b.chartPos ? 1/b.chartPos : 0) - (a.chartPos ? 1/a.chartPos : 0))[0];

  next.weekReport = {
    week: next.totalWeeks,
    timeLabel: timeStr,
    revenue: share + projectIncome + merchIncome + tourWeekEarning + jobIncome,
    streamIncome: share,
    streamCount: weekStreams,
    merchIncome,
    tourIncome: tourWeekEarning,
    jobIncome,
    projectIncome,
    fansDelta,
    totalFans: next.fans,
    totalMoney: next.money,
    topTrack: topTrack ? { title: topTrack.title, chartPos: topTrack.chartPos } : null,
    events: (next.news || []).filter(n => n.week === next.totalWeeks).map(n => n.msg).slice(0, 5),
    awards: next.awards || [],
  };

  try { saveGame(next); } catch (_) {}
  return next;
};

// ── Build Artist 100 ──────────────────────────────────────────────────────────
const buildArtist100 = (streamChart) => {
  const artistMap = {};
  for (const entry of streamChart) {
    const key = entry.artist || 'unknown';
    if (!artistMap[key]) artistMap[key] = { artist: entry.artist, streams: 0 };
    artistMap[key].streams += entry.streams || entry.peakStreams || 0;
  }
  return Object.values(artistMap)
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 10)
    .map((a, i) => ({ ...a, position: i + 1 }));
};

export const handleModalChoice = (prev, opt, showToast) => {
  const fx = opt.effect || {};
  let next = { ...prev };
  if (fx.dropped) {
    next.labelId  = 'independent';
    next.labelRel = 0; next.pressure = 0; next.recouped = 0;
    next.news = addNews(next.news, 'Dropped by label. Back to independent.', 'neg', prev.totalWeeks);
    showToast('DROPPED — NOW INDEPENDENT');
  }
  if (fx.renegotiate) {
    if (prev.clout >= 40) {
      next.pressure = 0;
      next.labelRel = clamp(prev.labelRel + 15, 0, 100);
      next.news = addNews(next.news, 'Renegotiated deal. Pressure reset.', 'pos', prev.totalWeeks);
    } else {
      next.pressure = clamp(prev.pressure + 2, 0, 10);
      next.news = addNews(next.news, 'Not enough clout to renegotiate. Need 40+.', 'neg', prev.totalWeeks);
    }
  }
  if (fx.fans)     next.fans     = clamp(prev.fans     + (fx.fans     || 0), 0, 999_000_000);
  if (fx.money)    next.money    = clamp(prev.money    + (fx.money    || 0), 0, 999_000_000_000);
  if (fx.clout)    next.clout    = clamp(prev.clout    + (fx.clout    || 0), 0, 100);
  if (fx.energy)   next.energy   = clamp(prev.energy   + (fx.energy   || 0), 0, 100);
  if (fx.pressure) next.pressure = clamp(prev.pressure + (fx.pressure || 0), 0, 10);
  if (fx.labelRel) next.labelRel = clamp(prev.labelRel + (fx.labelRel || 0), 0, 100);
  return next;
};

export const addNews = (feed, msg, type, week) =>
  [{ msg, type, week }, ...((feed || []).slice(0, 79))];

const getWeekMonth = (totalWeeks) => ({
  weekInMonth: (totalWeeks % 4) + 1,
  monthIndex: Math.floor(totalWeeks / 4) % 12,
});

const fmtShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(Math.round(n));
};
