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
  };

  // ── Energy recovery ──────────────────────────────────────────────────────
  next.energy = clamp(next.energy + 20, 0, 100);

  // ── Prison tick ──────────────────────────────────────────────────────────
  if (next.inPrison && next.prisonWeeksLeft > 0) {
    next.prisonWeeksLeft -= 1;
    if (next.prisonWeeksLeft === 0) {
      next.inPrison = false;
      next.news = addNews(next.news, 'You\'ve been released from prison. Back to the grind.', 'pos', next.totalWeeks);
    }
  }

  // ── Active job tick ───────────────────────────────────────────────────────
  let jobIncome = 0;
  if (next.activeJob && !next.inPrison) {
    const { weeklyPay, weeksLeft, illegal, prisonRisk, prisonWeeks, label: jobLabel } = next.activeJob;
    jobIncome = weeklyPay;
    next.energy = clamp(next.energy - (next.activeJob.energyPerWeek || 10), 0, 100);

    // Illegal job: prison check
    if (illegal && Math.random() < (prisonRisk || 0.1)) {
      next.inPrison = true;
      next.prisonWeeksLeft = prisonWeeks || 4;
      next.activeJob = null;
      next.money = clamp(next.money - Math.round(next.money * 0.15), 0, 999_000_000_000); // legal fees
      next.news = addNews(next.news, `ARRESTED doing "${jobLabel}". ${prisonWeeks || 4} weeks inside. Legal fees hit.`, 'neg', next.totalWeeks);
      setTimeout(() => showToast('ARRESTED — ' + (prisonWeeks || 4) + ' WEEKS INSIDE'), 100);
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

  // Recoupment
  if (label.id !== 'independent' && next.recouped < label.advance) {
    next.recouped = Math.min(next.recouped + labelCut, label.advance);
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
    next.money + share + merchIncome + tourWeekEarning + jobIncome - managerCost - lawyerCost - ownLabelBudget,
    0, 999_000_000_000
  );

  // ── Stream count tracking ─────────────────────────────────────────────────
  // Approximate: raw streaming income / 3 naira per stream
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

  // ── Organic fan growth ───────────────────────────────────────────────────
  const totalSocial = Object.values(next.socialPlatforms || {}).reduce((a, b) => a + (b || 0), 0);
  const organicGrowth = Math.round(next.clout * 0.9 + totalSocial * 0.0008);
  next.fans = clamp(next.fans + organicGrowth, 0, 999_000_000);

  // Soundstream auto-grows with streams
  if (next.socialPlatforms) {
    const streamGrowth = Math.round(share / 5000);
    next.socialPlatforms = {
      ...next.socialPlatforms,
      soundstream: clamp((next.socialPlatforms.soundstream || 0) + streamGrowth, 0, 999_000_000),
    };
  }

  // ── Label pressure ───────────────────────────────────────────────────────
  if (label.id !== 'independent') {
    next.pressure = clamp(next.pressure + 0.4, 0, 10);
    next.labelRel = clamp(next.labelRel - 0.3, 0, 100);
  }

  // ── NPC releases (every week) ────────────────────────────────────────────
  const { newNpcSongs, updatedLastRelease, updatedCatalog } = tickNPCReleases(
    next.npcCatalog || [],
    next.npcLastRelease || {},
    next.totalWeeks
  );
  next.npcCatalog    = updatedCatalog;
  next.npcLastRelease = updatedLastRelease;

  // News for notable NPC releases
  for (const song of newNpcSongs) {
    const npc = NPC_ARTISTS.find(n => n.id === song.npcId);
    if (npc && npc.clout >= 85) {
      next.news = addNews(next.news, `${npc.name} just dropped "${song.title}" — watch the charts.`, 'npc', next.totalWeeks);
    }
  }

  // ── Chart update (every 4 weeks = monthly, also on week 1) ─────────────────
  if (next.totalWeeks === 1 || Math.floor(next.totalWeeks / 4) !== Math.floor(prev.totalWeeks / 4)) {
    next.charts = buildCharts(next.catalog, next.npcCatalog, next);
    // Update player track chart positions
    next.catalog = next.catalog.map(track => {
      if (!track.released) return track;
      const entry = (next.charts.streams || []).find(c => c.id === track.id);
      return { ...track, chartPos: entry ? entry.position : null };
    });
  }

  // ── Random event (45% chance) ────────────────────────────────────────────
  if (Math.random() < 0.45) {
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
      next.news = addNews(next.news, `${ev.label} — ${ev.desc}`, ev.neg ? 'neg' : 'pos', next.totalWeeks);
      setTimeout(() => setModal({ type: 'world_event', event: ev }), 100);
    }
  }

  // ── Label event (25% chance if signed) ──────────────────────────────────
  if (label.id !== 'independent' && Math.random() < 0.25) {
    const ev = roll(LABEL_EVENTS.filter(e => e.id !== 'dropped_risk'));
    if (ev.choice) {
      setTimeout(() => setModal({ type: 'label_event', event: ev }), 200);
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
    setTimeout(() => setModal({ type: 'label_event', event: ev }), 300);
  }

  // ── Tier-up check ────────────────────────────────────────────────────────
  const oldTier = getTier(prev.fans);
  const newTier = getTier(next.fans);
  if (newTier.tier !== oldTier.tier) {
    next.clout = clamp(next.clout + 5, 0, 100);
    next.news  = addNews(next.news, `New tier unlocked: ${newTier.tier}! The industry is taking notice.`, 'milestone', next.totalWeeks);
    setTimeout(() => showToast(`TIER UP: ${newTier.tier.toUpperCase()}`), 400);
  }

  // ── Weekly feed entry ────────────────────────────────────────────────────
  const timeStr = getTimeLabel(next.totalWeeks, next.startYear);
  next.feed = [
    { msg: `${timeStr} — Streams: ₦${fmtShort(share)}`, type: '', week: next.totalWeeks },
    ...((next.feed || []).slice(0, 49)),
  ];

  // ── Build weekly report ──────────────────────────────────────────────────
  const fansDelta = next.fans - prev.fans;
  const topTrack = (next.catalog || [])
    .filter(t => t.released)
    .sort((a, b) => (b.chartPos ? 1/b.chartPos : 0) - (a.chartPos ? 1/a.chartPos : 0))[0];
  const weekEvents = (next.news || [])
    .filter(n => n.week === next.totalWeeks)
    .map(n => n.msg)
    .slice(0, 5);

  next.weekReport = {
    week: next.totalWeeks,
    timeLabel: timeStr,
    revenue: share + merchIncome + tourWeekEarning + jobIncome,
    streamIncome: share,
    streamCount: weekStreams,
    merchIncome,
    tourIncome: tourWeekEarning,
    jobIncome,
    fansDelta,
    totalFans: next.fans,
    totalMoney: next.money,
    topTrack: topTrack ? { title: topTrack.title, chartPos: topTrack.chartPos } : null,
    events: weekEvents,
  };

  // ── Auto-save ────────────────────────────────────────────────────────────
  setTimeout(() => saveGame(next), 50);

  return next;
};

export const handleModalChoice = (prev, opt, showToast) => {
  const fx = opt.effect || {};
  let next = { ...prev };

  if (fx.dropped) {
    next.labelId  = 'independent';
    next.labelRel = 0; next.pressure = 0; next.recouped = 0;
    next.news = addNews(next.news, 'Dropped by label. Back to independent — full ownership restored.', 'neg', prev.totalWeeks);
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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
