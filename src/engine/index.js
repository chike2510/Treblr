export * from './rng.js';
export * from './data.js';
export * from './util.js';
export * from './model.js';
export * from './state.js';
export * from './charts.js';
export * from './actions.js';
export * from './goals.js';
export { advanceWeek } from './tick.js';
import { AWARD_SHOWS } from './data.js';

// Upcoming calendar items: releases, award shows, offer expiries.
export function calendarEvents(s, fromWeek = s.week, toWeek = s.week + 8) {
  const out = [];
  for (const r of s.releases) {
    if (r.releaseWeek >= fromWeek && r.releaseWeek <= toWeek) out.push({ week: r.releaseWeek, type: 'release', title: `“${r.title}” ${r.status === 'out' ? 'released' : 'release'}` });
  }
  for (let w = fromWeek; w <= toWeek; w++) {
    const yw = ((w - 1) % 52) + 1;
    const a = AWARD_SHOWS.find((x) => x.week === yw);
    if (a) out.push({ week: w, type: 'award', title: a.name });
  }
  for (const m of s.inbox) {
    if (m.type === 'offer' && !m.status && m.expires >= fromWeek && m.expires <= toWeek) out.push({ week: m.expires, type: 'expiry', title: `Offer expires: ${m.from}` });
  }
  if (s.merch?.active) out.push({ week: s.week, type: 'merch', title: 'Merch on sale' });
  return out.sort((a, b) => a.week - b.week);
}

export function unreadCount(s) {
  return s.inbox.filter((m) => !m.read && !(m.type === 'offer' && m.status)).length;
}

export function nearbyRivals(s, n = 3) {
  const ml = Math.max(1000, s.player.monthlyListeners);
  return s.rivals
    .slice()
    .sort((a, b) => Math.abs(Math.log10(a.monthlyListeners) - Math.log10(ml)) - Math.abs(Math.log10(b.monthlyListeners) - Math.log10(ml)))
    .slice(0, n);
}
