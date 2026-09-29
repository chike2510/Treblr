import { clamp } from './utils';
import { getJobPay } from './careerPerks';

const STAT_CAPS = { sw: 100, vc: 100, pd: 100, lp: 100, hustle: 25, charisma: 25, network: 20 };

export const progressJobWeek = (state, job, durationRemaining) => {
  if (!job) return { state, wage: 0, completed: false };
  const next = { ...state };
  const weeklyGains = job.weeklySkillGain || (job.skillGain ? Object.fromEntries(Object.entries(job.skillGain).map(([key, value]) => [key, Math.max(1, Math.round(value / 2))])) : {});
  for (const [key, amount] of Object.entries(weeklyGains)) next[key] = clamp((next[key] || 0) + amount, 0, STAT_CAPS[key] || 100);
  if (job.networkPerWeek) next.network = clamp((next.network || 0) + job.networkPerWeek, 0, STAT_CAPS.network);
  next.energy = clamp((next.energy || 0) - (job.energyPerWeek || 10), 0, 100);
  const wage = getJobPay(state, job.weeklyPay || 0);
  return { state: next, wage, completed: durationRemaining <= 1 };
};
