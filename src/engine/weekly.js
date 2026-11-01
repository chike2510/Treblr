// Weekly goals: 3 small generated goals each week, tracked via s.weekStats counters.
import { clamp } from './util.js';

export const WEEKLY_KINDS = [
  { kind: 'write', label: (n) => `Write ${n} song${n > 1 ? 's' : ''}`, n: [1, 2], reward: { skill: 'songwriting', amount: 1.5 } },
  { kind: 'record', label: () => 'Record a song', n: [1, 1], reward: { cash: 150 } },
  { kind: 'post', label: (n) => `Post ${n} times on social`, n: [2, 3], reward: { hype: 4 } },
  { kind: 'gig', label: () => 'Play a show', n: [1, 1], reward: { cash: 200 } },
  { kind: 'train', label: () => 'Take a training session', n: [1, 1], reward: { hype: 3 } },
  { kind: 'pitch', label: () => 'Pitch a song to playlists', n: [1, 1], reward: { cash: 120 } },
  { kind: 'live', label: () => 'Go LIVE once', n: [1, 1], reward: { hype: 5 } },
  { kind: 'message', label: (n) => `Reply to ${n} message${n > 1 ? 's' : ''}`, n: [1, 2], reward: { skill: 'charisma', amount: 1 } },
  { kind: 'earn', label: (n) => `Earn $${n.toLocaleString('en-US')} this week`, n: [300, 800], money: true, reward: { hype: 3 } },
  { kind: 'fans', label: (n) => `Gain ${n.toLocaleString('en-US')} fans`, n: [20, 60], fansGoal: true, reward: { cash: 250 } },
  { kind: 'rest', label: () => 'Take a rest day', n: [1, 1], reward: { skill: 'performance', amount: 1 } },
];

export function generateWeeklyGoalsFor(s, rng) {
  const p = s.player;
  const pool = WEEKLY_KINDS.filter((k) => {
    if (k.kind === 'pitch') return s.songs.some((x) => x.status === 'released');
    return true;
  });
  const picks = rng.shuffle(pool).slice(0, 3);
  const scale = Math.max(1, Math.log10(Math.max(10, p.fans)) - 1);
  const goals = picks.map((k, i) => {
    let n = rng.int(k.n[0], k.n[1]);
    if (k.money) n = Math.round((n * scale) / 50) * 50;
    if (k.fansGoal) n = Math.max(10, Math.round(n * scale * scale));
    const reward = { ...k.reward };
    if (reward.cash) reward.cash = Math.round(reward.cash * scale);
    return { id: `wg${s.week}_${i}`, kind: k.kind, label: k.label(n), target: n, reward, claimed: false };
  });
  return { week: s.week, goals, start: { fans: p.fans, cash: p.cash, earned: 0 } };
}

export function weeklyProgress(s, g) {
  const st = s.weekStats || {};
  if (g.kind === 'fans') return Math.max(0, s.player.fans - (s.weekly?.start?.fans ?? s.player.fans));
  if (g.kind === 'earn') return st.earned || 0;
  return st[g.kind] || 0;
}

export function weeklyGoalsView(s) {
  if (!s.weekly) return [];
  return s.weekly.goals.map((g) => {
    const v = weeklyProgress(s, g);
    return { ...g, value: v, pct: clamp(v / g.target, 0, 1), done: v >= g.target };
  });
}

export function stat(s, key, by = 1) {
  s.weekStats = s.weekStats || {};
  s.weekStats[key] = (s.weekStats[key] || 0) + by;
}

export function weeklyRewardText(r) {
  if (r.cash) return `+$${r.cash.toLocaleString('en-US')}`;
  if (r.hype) return `+${r.hype} hype`;
  if (r.skill) return `+${r.amount} ${r.skill}`;
  return '';
}
