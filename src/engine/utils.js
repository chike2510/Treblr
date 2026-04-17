import { MILESTONES, MONTH_SHORT, ERAS } from '../data/constants';

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const roll  = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const uid   = () => Math.random().toString(36).slice(2, 9);
export const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
};

export const fmtN = (n) => {
  if (n == null || isNaN(n)) return '₦0';
  return (n < 0 ? `-₦${fmt(Math.abs(n))}` : `₦${fmt(n)}`);
};

export const getTimeInfo = (totalWeeks, startYear = 2024) => {
  const weekInMonth  = (totalWeeks % 4) + 1;
  const monthIndex   = Math.floor(totalWeeks / 4) % 12;
  const yearsPassed  = Math.floor(totalWeeks / 48);
  const calYear      = startYear + yearsPassed;
  return { weekInMonth, monthIndex, calYear };
};

export const getTimeLabel = (totalWeeks, startYear = 2024) => {
  const { weekInMonth, monthIndex, calYear } = getTimeInfo(totalWeeks, startYear);
  return `${MONTH_SHORT[monthIndex]} ${calYear} · Wk${weekInMonth}`;
};

export const getTier = (fans) => {
  let t = MILESTONES[0];
  for (const m of MILESTONES) if (fans >= m.fans) t = m;
  return t;
};

export const getEra = (fans) => {
  let e = ERAS[0];
  for (const era of ERAS) if (fans >= era.minFans) e = era;
  return e;
};

export const getTalent = (gs) => (gs.sw || 0) + (gs.vc || 0) + (gs.pd || 0) + (gs.lp || 0);

export const totalFollowers = (gs) => {
  if (!gs.socialPlatforms) return gs.socialFollowers || 0;
  return Object.values(gs.socialPlatforms).reduce((a, b) => a + (b || 0), 0);
};
