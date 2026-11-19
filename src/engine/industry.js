// Industry ecosystem: relationships, publishing partnerships, market cycles and competitive intelligence.
import { clamp, uid, fmtMoney } from './util.js';
import { run, earn, spend, pushNews } from './actions.js';
import { gainHype } from './model.js';
import { logTimeline } from './journal.js';

const fail = (msg) => ({ ok: false, msg });
const GENRES = ['pop','rnb','hiphop','afrobeats','latin','reggaeton','kpop','electronic','indie','rock','alternative','metal','country','jazz'];

export function addV6Fields(s) {
  s.industry = s.industry || {};
  const x = s.industry;
  x.market = x.market || { cycle: 0, updatedWeek: 0, genres: Object.fromEntries(GENRES.map((g) => [g, 1])), economy: 1, narrative: 'A competitive global market' };
  x.relationships = x.relationships || {};
  x.publishing = x.publishing || null;
  x.partnerships = x.partnerships || [];
  x.history = x.history || [];
  x.reputation = x.reputation || { professionalism: 50, reliability: 50, controversy: 0 };
  x.rivalry = x.rivalry || {};
  x.lastTick = x.lastTick ?? 0;
  return s;
}
export function relationshipWith(s, rivalId) {
  addV6Fields(s);
  const rival = s.rivals.find((r) => r.id === rivalId);
  if (!rival) return null;
  return { ...(s.industry.relationships[rivalId] || { score: 0, status: 'neutral', history: [], lastInteraction: null }), rivalId, name: rival.name, tier: rival.tier };
}
function setRelationship(s, rivalId, delta, event) {
  const old = relationshipWith(s, rivalId);
  if (!old) return null;
  const score = clamp(Math.round(old.score + delta), -100, 100);
  const status = score >= 60 ? 'ally' : score >= 20 ? 'friendly' : score <= -60 ? 'feud' : score <= -20 ? 'hostile' : 'neutral';
  s.industry.relationships[rivalId] = { score, status, lastInteraction: s.week, history: [...(old.history || []), { week: s.week, delta, event }].slice(-20) };
  return { score, status };
}
export function industryAction(state, { rivalId, action = 'network' }) {
  return run(state, (s, rng) => {
    addV6Fields(s);
    const rival = s.rivals.find((r) => r.id === rivalId);
    if (!rival) return fail('Artist not found.');
    const costs = { network: { energy: 8, cash: 500 }, collaborate: { energy: 14, cash: 2500 }, compete: { energy: 10, cash: 0 }, reconcile: { energy: 6, cash: 300 } };
    const cost = costs[action];
    if (!cost) return fail('Choose a valid industry action.');
    if (s.player.energy < cost.energy) return fail(`Needs ${cost.energy} energy.`);
    if (s.player.cash < cost.cash) return fail(`Needs ${fmtMoney(cost.cash)}.`);
    const rel = relationshipWith(s, rivalId);
    if (action === 'collaborate' && rel.score < -55) return fail(`${rival.name} is not open to working with you. Repair the relationship first.`);
    s.player.energy -= cost.energy;
    if (cost.cash) spend(s, 'industry', cost.cash, `${action} with ${rival.name}`);
    let delta = 0; let headline = '';
    if (action === 'network') { delta = Math.round(8 + s.player.skills.charisma * 0.08 + rng.float(-3, 5)); headline = `You built a connection with ${rival.name}.`; s.player.skills.charisma = clamp(s.player.skills.charisma + 0.15, 0, 100); }
    if (action === 'collaborate') { delta = Math.round(12 + s.player.skills.vocals * 0.04 + rng.float(-4, 8)); headline = `A studio session brought you and ${rival.name} closer.`; gainHype(s.player, 2); }
    if (action === 'compete') { delta = -Math.round(10 + rng.float(0, 8)); headline = `Your teams are now openly competing for attention with ${rival.name}.`; s.industry.rivalry[rivalId] = { active: true, since: s.week, heat: clamp((s.industry.rivalry[rivalId]?.heat || 0) + 15, 0, 100) }; gainHype(s.player, 2); }
    if (action === 'reconcile') { delta = Math.round(14 + s.player.skills.charisma * 0.06 + rng.float(-2, 5)); headline = `You reached out to clear the air with ${rival.name}.`; const feud = s.industry.rivalry[rivalId]; if (feud) { feud.heat = Math.max(0, feud.heat - 25); if (!feud.heat) feud.active = false; } }
    const updated = setRelationship(s, rivalId, delta, action);
    s.industry.history.unshift({ week: s.week, type: action, rivalId, delta, score: updated.score });
    s.industry.history = s.industry.history.slice(0, 60);
    pushNews(s, headline, true, 'Industry');
    logTimeline(s, 'industry', headline, `Relationship: ${updated.status} (${updated.score})`);
    return { msg: `${headline} Relationship is now ${updated.status} (${updated.score}).` };
  });
}
export function signPublishingDeal(state, { advance = 0, share = 0.2, term = 52 } = {}) {
  return run(state, (s) => {
    addV6Fields(s);
    if (s.industry.publishing?.active) return fail('You already have an active publishing agreement.');
    advance = Math.round(Number(advance)); share = Number(share); term = Math.round(Number(term));
    if (!Number.isFinite(advance) || advance < 0 || advance > 2_000_000) return fail('Advance must be between $0 and $2,000,000.');
    if (!Number.isFinite(share) || share < 0.05 || share > 0.5) return fail('Publishing share must be between 5% and 50%.');
    if (![52, 104, 156].includes(term)) return fail('Choose a 1, 2 or 3 year term.');
    if (advance) earn(s, 'advance', advance, 'Publishing advance (recoupable)');
    s.industry.publishing = { active: true, signedWeek: s.week, endWeek: s.week + term, advance, recouped: 0, share, term, deliveredSongs: 0 };
    s.industry.reputation.professionalism = clamp(s.industry.reputation.professionalism + 2, 0, 100);
    logTimeline(s, 'contract', 'Signed a publishing agreement', `${Math.round(share * 100)}% publishing share · ${term} weeks`);
    pushNews(s, `${s.player.stageName} signs a ${term / 52}-year publishing agreement`, true, 'Business');
    return { msg: `Publishing deal signed. The ${Math.round(share * 100)}% share applies until the term ends; the advance recoups first.` };
  });
}
export function endPublishingDeal(state) {
  return run(state, (s) => {
    addV6Fields(s);
    const c = s.industry.publishing;
    if (!c?.active) return fail('No active publishing agreement.');
    if (s.week < c.endWeek) return fail(`The agreement runs until week ${c.endWeek}.`);
    c.active = false;
    logTimeline(s, 'contract', 'Publishing agreement ended', `Advance recouped: ${fmtMoney(c.recouped)}`);
    return { msg: 'Publishing agreement ended. You now retain your publishing share.' };
  });
}
export function signIndustryPartnership(state, { type = 'brand', partner = 'Independent Partner', weeklyFee = 0, term = 26, bonus = 0.05 } = {}) {
  return run(state, (s) => {
    addV6Fields(s);
    if (!['brand', 'promoter', 'publicist', 'distribution'].includes(type)) return fail('Unknown partnership type.');
    if (s.industry.partnerships.some((x) => x.active && x.type === type)) return fail(`You already have an active ${type} partnership.`);
    weeklyFee = Math.round(Number(weeklyFee)); term = Math.round(Number(term)); bonus = Number(bonus);
    if (!Number.isFinite(weeklyFee) || weeklyFee < 0 || weeklyFee > 100000) return fail('Weekly fee is out of range.');
    if (![13, 26, 52].includes(term)) return fail('Choose a 13, 26 or 52 week term.');
    if (!Number.isFinite(bonus) || bonus < 0 || bonus > 0.2) return fail('Bonus must be between 0% and 20%.');
    if (s.player.cash < weeklyFee) return fail('You cannot cover the first week of this agreement.');
    const d = { id: uid(s, 'ip'), type, partner: String(partner).slice(0, 60), weeklyFee, bonus, signedWeek: s.week, endWeek: s.week + term, active: true, weeksPaid: 0 };
    s.industry.partnerships.push(d);
    if (weeklyFee) spend(s, 'industry', weeklyFee, `${type} partnership: ${d.partner}`);
    d.weeksPaid = 1;
    logTimeline(s, 'contract', `Partnered with ${d.partner}`, `${type} · ${term} weeks · ${Math.round(bonus * 100)}% bonus`);
    return { msg: `${d.partner} partnership started for ${term} weeks.` };
  });
}
export function endIndustryPartnership(state, { id }) {
  return run(state, (s) => {
    addV6Fields(s);
    const d = s.industry.partnerships.find((x) => x.id === id && x.active);
    if (!d) return fail('Partnership not found.');
    d.active = false; d.endedWeek = s.week;
    logTimeline(s, 'contract', `Ended ${d.partner} partnership early`, d.type);
    return { msg: 'Partnership ended. Future fees and bonuses stop immediately.' };
  });
}
export function partnershipBonus(s, type) {
  addV6Fields(s);
  return clamp(s.industry.partnerships
    .filter((x) => x.active && x.type === type)
    .reduce((n, x) => n + x.bonus, 0), 0, 0.3);
}
export function marketMultiplier(s, genre = s.player.genre) {
  addV6Fields(s);
  const base = s.industry.market.genres[genre] || 1;
  const distribution = partnershipBonus(s, 'distribution');
  return clamp(base * s.industry.market.economy * (1 + distribution), 0.65, 1.65);
}
export function industryOverview(s) {
  addV6Fields(s);
  return {
    market: s.industry.market,
    topGenres: Object.entries(s.industry.market.genres).sort((a, b) => b[1] - a[1]).slice(0, 4),
    publishing: s.industry.publishing,
    partnerships: s.industry.partnerships.filter((x) => x.active),
    relationships: s.rivals.map((r) => relationshipWith(s, r.id)).sort((a, b) => b.score - a.score),
    reputation: s.industry.reputation,
    activeRivalries: Object.values(s.industry.rivalry).filter((x) => x.active).length,
    contracts: s.industry.partnerships.filter((x) => x.active).length + (s.industry.publishing?.active ? 1 : 0),
  };
}
export function industryTick(s, rng, events = []) {
  addV6Fields(s);
  const x = s.industry; const W = s.week;
  if (x.lastTick === W) return;
  x.lastTick = W;
  if (W === 1 || W - x.market.updatedWeek >= 13) {
    const next = {};
    for (const g of GENRES) next[g] = Math.round(clamp((x.market.genres[g] || 1) * rng.float(0.88, 1.13), 0.72, 1.32) * 100) / 100;
    const sorted = Object.entries(next).sort((a, b) => b[1] - a[1]);
    x.market.genres = next; x.market.cycle += 1; x.market.updatedWeek = W;
    x.market.economy = Math.round(clamp(x.market.economy * rng.float(0.96, 1.04), 0.88, 1.12) * 100) / 100;
    x.market.narrative = `${sorted[0][0]} leads the market; ${sorted.at(-1)[0]} cools`;
    if (W > 1) { const line = `Industry report: ${sorted[0][0]} is surging (×${next[sorted[0][0]].toFixed(2)}); ${sorted.at(-1)[0]} is cooling.`; pushNews(s, line, false, 'Industry'); events.push({ weight: 18, kind: 'event', vars: { text: line } }); }
  }
  const pub = x.publishing;
  if (pub?.active) {
    const streams = s.songs.filter((song) => song.status === 'released').reduce((n, song) => n + (song.weeklyStreams || 0), 0);
    const gross = Math.round(streams * 0.0035 * pub.share);
    const recoup = Math.min(Math.max(0, pub.advance - pub.recouped), gross);
    pub.recouped += recoup;
    if (gross > recoup) earn(s, 'publishing', gross - recoup, 'Publishing royalties');
    if (W >= pub.endWeek) { pub.active = false; logTimeline(s, 'contract', 'Publishing agreement expired', `Advance recouped: ${fmtMoney(pub.recouped)}`); }
  }
  for (const d of x.partnerships) {
    if (!d.active) continue;
    if (W >= d.endWeek) { d.active = false; d.endedWeek = W; logTimeline(s, 'contract', `${d.partner} partnership expired`, d.type); continue; }
    if (W > d.signedWeek && d.weeksPaid < W - d.signedWeek + 1) {
      if (s.player.cash >= d.weeklyFee) { if (d.weeklyFee) spend(s, 'industry', d.weeklyFee, `${d.type} retainer: ${d.partner}`); d.weeksPaid += 1; }
      else { d.active = false; d.endedWeek = W; x.reputation.reliability = clamp(x.reputation.reliability - 3, 0, 100); pushNews(s, `${s.player.stageName} parts ways with ${d.partner} after a missed retainer`, true, 'Business'); }
    }
  }
  for (const [id, rel] of Object.entries(x.relationships)) {
    if (rel.lastInteraction != null && W - rel.lastInteraction > 26 && rel.score !== 0) { rel.score = clamp(rel.score + (rel.score > 0 ? -1 : 1), -100, 100); rel.status = rel.score >= 60 ? 'ally' : rel.score >= 20 ? 'friendly' : rel.score <= -60 ? 'feud' : rel.score <= -20 ? 'hostile' : 'neutral'; }
    const feud = x.rivalry[id]; if (feud?.active) { feud.heat = Math.max(0, (feud.heat || 0) - 2); if (!feud.heat) feud.active = false; }
  }
  x.reputation.professionalism = clamp(x.reputation.professionalism + (s.player.energy > 60 ? 0.05 : 0), 0, 100);
  x.reputation.reliability = clamp(x.reputation.reliability + (s.player.cash > 0 ? 0.03 : -0.1), 0, 100);
  x.reputation.controversy = clamp(x.reputation.controversy - 0.15, 0, 100);
  x.history.unshift({ week: W, marketCycle: x.market.cycle, multiplier: marketMultiplier(s), economy: x.market.economy, relationships: Object.keys(x.relationships).length });
  x.history = x.history.slice(0, 52);
}
export function validateIndustryState(s) {
  const x = s.industry;
  if (!x || !x.market || !x.relationships || !x.partnerships) return { ok: false, errors: ['Industry state is missing.'] };
  const errors = [];
  for (const [g, v] of Object.entries(x.market.genres || {})) if (!Number.isFinite(v) || v < 0.65 || v > 1.5) errors.push(`Invalid market multiplier: ${g}`);
  for (const d of x.partnerships) if (!Number.isFinite(d.weeklyFee) || d.weeklyFee < 0 || d.endWeek < d.signedWeek) errors.push(`Invalid partnership: ${d.id}`);
  if (x.publishing && (!Number.isFinite(x.publishing.share) || x.publishing.share < 0 || x.publishing.share > 0.5)) errors.push('Invalid publishing agreement.');
  return { ok: errors.length === 0, errors };
}
