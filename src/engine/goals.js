import { GOALS, cityById } from './data.js';
import { LIFESTYLE } from './data2.js';
import { gainHype } from './model.js';
import { clamp, fmtMoney, fmtNum } from './util.js';

function metric(s, m) {
  const p = s.player;
  switch (m) {
    case 'fans': return p.fans;
    case 'releases': return s.releases.filter((r) => r.status === 'out').length;
    case 'chartEntries': return p.chartEntries || 0;
    case 'monthlyListeners': return p.monthlyListeners;
    case 'lifetimeStreams': return p.lifetimeStreams || 0;
    case 'sellouts': return p.sellouts || 0;
    case 'golds': return s.songs.filter((x) => x.cert).length + s.releases.filter((x) => x.cert).length;
    case 'bestRank': return p.bestRank;
    default: return 0;
  }
}

export function goalProgress(s) {
  return GOALS.map((g) => {
    const v = metric(s, g.metric);
    let pct; let done;
    if (g.invert) {
      done = v != null && v <= g.target;
      pct = v == null ? 0 : done ? 1 : clamp((100 - v) / (100 - g.target), 0, 0.99);
    } else {
      done = v >= g.target;
      pct = clamp(v / g.target, 0, 1);
    }
    return { ...g, value: v, pct, done: done || !!s.goals[g.id], claimed: !!s.goals[g.id] };
  });
}

export function rewardText(r) {
  return [r.cash && `+${fmtMoney(r.cash)}`, r.fans && `+${fmtNum(r.fans)} fans`, r.hype && `+${r.hype} hype`].filter(Boolean).join(' · ');
}

// Auto-claims completed goals (mutates s). Returns newly completed goals.
export function checkGoals(s) {
  const done = [];
  for (const g of goalProgress(s)) {
    if (g.done && !s.goals[g.id]) {
      s.goals[g.id] = s.week;
      const r = g.reward;
      if (r.cash) {
        s.player.cash += r.cash;
        s.ledger.income.rewards = (s.ledger.income.rewards || 0) + r.cash;
        s.transactions.unshift({ week: s.week, label: `Milestone: ${g.name}`, amount: r.cash });
      }
      if (r.fans) s.player.fans += r.fans;
      if (r.hype) gainHype(s.player, r.hype);
      s.player.awards = [...(s.player.awards || []), { week: s.week, name: g.name, kind: 'milestone' }];
      done.push(g);
    }
  }
  return done;
}

// Up Next: smart nudges computed from state, each deep-links to a screen.
export function upNext(s) {
  const p = s.player;
  const out = [];
  const written = s.songs.filter((x) => x.status === 'written');
  const recorded = s.songs.filter((x) => x.status === 'recorded');
  const unread = s.inbox.filter((m) => !m.read).length;
  const weeklyCost = weeklyExpenses(s);
  if (p.cash < weeklyCost * 2) out.push({ id: 'cash', title: 'Cash is running low', body: `Expenses are ~${fmtMoney(weeklyCost)}/week. Pick up a job.`, cta: 'Find work', to: { tab: 'world', section: 'jobs' }, tone: 'danger' });
  if (p.energy < 20) out.push({ id: 'rest', title: 'You\u2019re running on fumes', body: p.rested ? 'Energy refills next week.' : 'Rest now for +25 energy.', cta: p.rested ? 'Next week' : 'Rest', to: p.rested ? { action: 'next' } : { action: 'rest' }, tone: 'warn' });
  if (recorded.length) out.push({ id: 'release', title: `${recorded.length} song${recorded.length > 1 ? 's' : ''} ready to release`, body: `“${recorded[0].title}” is mixed and mastered.`, cta: 'Release', to: { tab: 'studio', section: 'release' }, tone: 'studio' });
  if (written.length) out.push({ id: 'record', title: 'Demo waiting for a studio', body: `“${written[0].title}” needs recording.`, cta: 'Record', to: { tab: 'studio', section: 'record' }, tone: 'studio' });
  if (!s.songs.length) out.push({ id: 'write', title: 'Write your first song', body: 'Every career starts with one.', cta: 'Write', to: { tab: 'studio', section: 'write' }, tone: 'studio' });
  if (unread) out.push({ id: 'inbox', title: `${unread} unread in your inbox`, body: 'Offers expire — don\u2019t sleep on them.', cta: 'Open', to: { tab: 'phone', app: 'inbox' }, tone: 'phone' });
  const released = s.songs.find((x) => x.status === 'released' && x.pitchedWeek !== s.week && s.week - x.releasedWeek < 8);
  if (released && p.socialEnergy >= 5) out.push({ id: 'pitch', title: 'Pitch to playlists', body: `“${released.title}” could land on a playlist.`, cta: 'Pitch', to: { tab: 'phone', app: 'treblify' }, tone: 'phone' });
  if (p.socialEnergy >= 15 && s.songs.some((x) => x.status === 'released')) out.push({ id: 'clip', title: 'Try for a viral moment', body: 'Promote a snippet on TreblrTok.', cta: 'TreblrTok', to: { tab: 'phone', app: 'treblrtok' }, tone: 'phone' });
  if (p.energy >= 25 && p.fans >= 50) out.push({ id: 'gig', title: 'Play a show', body: 'Gigs pay and grow your local fan heat.', cta: 'Gigs', to: { tab: 'world', section: 'gigs' }, tone: 'world' });
  if (!s.songs.length || s.songs.every((x) => x.status === 'released')) out.push({ id: 'write2', title: 'Keep the catalogue growing', body: 'New music keeps listeners coming back.', cta: 'Write', to: { tab: 'studio', section: 'write' }, tone: 'studio' });
  const seen = new Set();
  return out.filter((x) => (seen.has(x.id) ? false : seen.add(x.id))).slice(0, 3);
}

export function staffCost(s) {
  const sal = { manager: 1500, publicist: 1000, booking: 700 };
  const mgrRel = (s.contacts || []).find((c) => c.role === 'manager')?.rel ?? 0;
  if (mgrRel >= 70) sal.manager = 1200; // a manager who likes you takes a smaller salary
  return Object.entries(s.player.staff).reduce((a, [k, v]) => a + (v ? sal[k] : 0), 0);
}
export function housingCost(s) {
  const owns = (s.lifestyle?.owned || []).some((o) => ['house', 'villa', 'mansion'].includes(o.id));
  return owns ? 0 : cityById(s.player.city).rent / 4;
}
export function weeklyExpenses(s) {
  const loans = (s.bank?.loans || []).reduce((a, l) => a + l.payment, 0);
  return Math.round(housingCost(s) + LIVING_COST + staffCost(s) + loans + lifestyleWeekly(s));
}
function lifestyleWeekly(s) {
  const W = Object.fromEntries(LIFESTYLE.map((x) => [x.id, x.weekly]));
  return (s.lifestyle?.owned || []).reduce((a, o) => a + (W[o.id] || 0), 0) + (s.lifestyle?.rental ? W[s.lifestyle.rental] || 0 : 0);
}
export const LIVING_COST = 120;
