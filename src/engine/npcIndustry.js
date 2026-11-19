// Independent rival-artist businesses: strategy, label deals, campaigns, collabs and cashflow.
import { clamp } from './util.js';

const STRATEGIES = ['growth', 'prestige', 'touring', 'independent', 'commercial'];
const LABELS = ['Northstar Records', 'Crownline Music', 'Meridian Sound', 'Atlas Entertainment', 'Afterglow Records'];

function ensureWorld(s) {
  if (!s.npcIndustry) s.npcIndustry = { week: 0, labels: [], deals: [], campaigns: [], collaborations: [], history: [] };
  const world = s.npcIndustry;
  world.labels ||= []; world.deals ||= []; world.campaigns ||= []; world.collaborations ||= []; world.history ||= [];
  for (const r of s.rivals || []) {
    r.business ||= {
      strategy: STRATEGIES[(Math.abs(String(r.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % STRATEGIES.length)],
      cash: Math.max(25000, Math.round((r.monthlyListeners || r.baseML || 1000) * 0.018)),
      reputation: clamp(Math.round((r.basePop || 20) * 0.65), 5, 95),
      label: null, dealUntil: 0, campaignUntil: 0, campaign: null,
      team: { manager: 0.35, publicist: 0.25, booking: 0.25 },
      releasesPromoted: 0, lastNegotiation: -99, lastCollab: -99,
      weeklyStreamsBonus: 1, lastDecision: 'Building the next move',
    };
  }
  return world;
}

function addHistory(world, week, text) {
  world.history.unshift({ week, text });
  world.history = world.history.slice(0, 80);
}

function negotiate(s, r, world, rng, week) {
  const b = r.business;
  if (week - b.lastNegotiation < 26 || week < b.dealUntil - 8) return;
  if (!b.label && rng.chance(r.tier === 'superstar' ? 0.18 : r.tier === 'star' ? 0.13 : 0.07)) {
    const label = rng.pick(LABELS);
    const advance = Math.round(Math.max(15000, r.monthlyListeners * rng.float(0.025, 0.07)));
    const share = rng.float(0.12, 0.28);
    b.label = label; b.cash += advance; b.dealUntil = week + rng.int(104, 208);
    b.labelShare = share; b.lastNegotiation = week;
    world.deals.unshift({ rivalId: r.id, artist: r.name, label, advance, share, signedWeek: week, endsWeek: b.dealUntil, status: 'active' });
    addHistory(world, week, `${r.name} signs a ${label} recording deal`);
  } else if (b.label && week >= b.dealUntil && rng.chance(0.35)) {
    const old = b.label; b.label = null; b.labelShare = 0; b.lastNegotiation = week;
    addHistory(world, week, `${r.name} leaves ${old} and returns to independent operations`);
  } else if (b.label && week >= b.dealUntil - 2 && rng.chance(0.45)) {
    b.dealUntil += 104; b.lastNegotiation = week;
    addHistory(world, week, `${r.name} renews with ${b.label}`);
  }
}

function chooseCampaign(s, r, world, rng, week) {
  const b = r.business;
  if (week < b.campaignUntil || b.cash < 5000 || !rng.chance(0.24 + b.team.publicist * 0.22)) return;
  const options = ['radio', 'playlist', 'press', 'social', 'tour-promo'];
  const strategy = b.strategy;
  const campaign = strategy === 'touring' ? 'tour-promo'
    : strategy === 'prestige' ? rng.pick(['press', 'radio'])
    : strategy === 'growth' ? rng.pick(['playlist', 'social'])
    : strategy === 'commercial' ? rng.pick(['radio', 'social'])
    : rng.pick(options);
  const costRate = { radio: 0.0018, playlist: 0.0014, press: 0.0009, social: 0.0011, 'tour-promo': 0.0016 }[campaign];
  const cost = Math.min(Math.round(b.cash * 0.22), Math.max(1800, Math.round(r.monthlyListeners * costRate)));
  if (cost > b.cash * 0.65) return;
  b.cash -= cost; b.campaign = campaign; b.campaignUntil = week + 3;
  b.weeklyStreamsBonus = campaign === 'playlist' ? 1.16 : campaign === 'radio' ? 1.12 : campaign === 'social' ? 1.1 : 1.06;
  b.lastDecision = `Invested in ${campaign} promotion`;
  world.campaigns.unshift({ rivalId: r.id, artist: r.name, type: campaign, cost, startWeek: week, endWeek: week + 3, status: 'active' });
  world.campaigns = world.campaigns.slice(0, 120);
  addHistory(world, week, `${r.name} launches a ${campaign} campaign`);
}

function manageFinances(r, world, week) {
  const b = r.business;
  const streamsIncome = Math.max(0, r.monthlyListeners || 0) * 0.00012;
  const touringIncome = b.strategy === 'touring' ? r.monthlyListeners * 0.000045 : 0;
  const teamCost = r.monthlyListeners * (0.000025 + b.team.manager * 0.000012 + b.team.publicist * 0.000009 + b.team.booking * 0.000008);
  const labelCost = b.label ? streamsIncome * (b.labelShare || 0) : 0;
  const net = streamsIncome + touringIncome - teamCost - labelCost;
  b.cash = Math.round(clamp(b.cash + net, -250000, 250000000));
  if (b.cash < 0) {
    b.strategy = 'independent'; b.team.publicist = Math.max(0.1, b.team.publicist - 0.03);
    b.lastDecision = 'Cutting costs after a difficult quarter';
  }
  if (b.cash > r.monthlyListeners * 0.12 && b.team.manager < 0.9) b.team.manager = Math.min(0.9, b.team.manager + 0.01);
  if (week % 13 === 0) addHistory(world, week, `${r.name} reports ${b.cash < 0 ? 'financial pressure' : 'a stable operating position'}`);
}

function formCollaborations(s, world, rng, week) {
  if (week % 4 !== 0 || s.rivals.length < 2 || !rng.chance(0.22)) return;
  const candidates = s.rivals.filter((r) => week - (r.business?.lastCollab ?? -99) >= 18);
  if (candidates.length < 2) return;
  const a = rng.pick(candidates);
  const peers = candidates.filter((r) => r.id !== a.id && (r.genres || [r.genre]).some((g) => (a.genres || [a.genre]).includes(g)));
  if (!peers.length) return;
  const b = rng.pick(peers);
  a.business.lastCollab = b.business.lastCollab = week;
  const boost = rng.float(1.08, 1.24);
  const collab = { id: `npc-collab-${week}-${a.id}-${b.id}`, artists: [a.id, b.id], names: [a.name, b.name], week, boost, status: 'released' };
  world.collaborations.unshift(collab); world.collaborations = world.collaborations.slice(0, 60);
  for (const song of (s.rivalSongs || []).filter((x) => x.rivalId === a.id || x.rivalId === b.id).slice(-2)) song.collabBoost = Math.max(song.collabBoost || 1, boost);
  addHistory(world, week, `${a.name} and ${b.name} announce a joint studio collaboration`);
}

function reactToPlayer(s, world, rng, week) {
  const p = s.player;
  const chartLead = (s.charts?.hot100 || [])[0];
  const playerLeading = chartLead?.pl || (p.bestRank != null && p.bestRank <= 3);
  if (!playerLeading || !rng.chance(0.35)) return;
  const rivals = (s.rivals || []).filter((r) => r.business && r.business.cash > 3000)
    .sort((a,b) => Math.abs((a.basePop || 0) - (p.popularity || 0)) - Math.abs((b.basePop || 0) - (p.popularity || 0))).slice(0, 8);
  if (!rivals.length) return;
  const r = rng.pick(rivals);
  r.business.strategy = rng.pick(['growth', 'commercial', 'prestige']);
  r.business.lastDecision = `Responding to ${p.stageName}'s chart momentum`;
  r.business.campaignUntil = Math.min(r.business.campaignUntil, week);
  addHistory(world, week, `${r.name} steps up promotion after ${p.stageName}'s chart surge`);
}

export function npcIndustryTick(s, rng, week = s.week) {
  const world = ensureWorld(s);
  world.week = week;
  for (const song of s.rivalSongs || []) if (song.collabBoost > 1) song.collabBoost = Math.max(1, 1 + (song.collabBoost - 1) * 0.78);
  for (const r of s.rivals || []) {
    const b = r.business;
    if (week >= b.campaignUntil) { b.campaign = null; b.weeklyStreamsBonus = 1; }
    negotiate(s, r, world, rng, week);
    chooseCampaign(s, r, world, rng, week);
    manageFinances(r, world, week);
    const strategyMoves = {
      growth: 'Chasing audience growth', prestige: 'Protecting critical reputation',
      touring: 'Prioritising live revenue', independent: 'Keeping overhead lean',
      commercial: 'Maximising mainstream reach',
    };
    if (!b.lastDecision || week % 8 === 0) b.lastDecision = strategyMoves[b.strategy] || strategyMoves.independent;
  }
  formCollaborations(s, world, rng, week);
  reactToPlayer(s, world, rng, week);
  world.deals = world.deals.slice(-100);
  world.history = world.history.slice(0, 80);
  return world;
}

export function rivalBusinessSummary(s) {
  return (s.rivals || []).map((r) => {
    const b = r.business || { strategy: 'independent', label: null, cash: 0, campaign: null, lastDecision: 'Awaiting first weekly simulation', reputation: 0 };
    return { id: r.id, name: r.name, strategy: b.strategy, label: b.label, cash: b.cash, campaign: b.campaign, decision: b.lastDecision, reputation: b.reputation };
  });
}
