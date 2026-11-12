import { createRng, hashString } from './rng.js';

// Weekly hiring market. Every in-game week each role gets a fresh, deterministic pool of candidates
// (seeded by save seed + role + week), so the list is stable all week and changes when the week advances.
// Efficiency 1.00 is the standard hire the game always had (same bonuses, same 10% cut, same salary).
export const HIRE_BASE = { manager: 1500, publicist: 1000, booking: 700 };
export const POOL_SIZE = 6;

const FIRST = ['Tunde', 'Mara', 'Kofi', 'Priya', 'Dex', 'Lena', 'Biodun', 'Rafa', 'Soraya', 'Jules', 'Chidi', 'Nadia', 'Omar', 'Tessa', 'Ife', 'Marcus', 'Yuki', 'Camila', 'Dami', 'Hollis', 'Zainab', 'Theo', 'Ngozi', 'Vik'];
const LAST = ['Adeyemi', 'Calloway', 'Reyes', 'Okafor', 'Lindqvist', 'Banerjee', 'Park', 'Mbeki', 'Fontaine', 'Rao', 'Bello', 'Quinn', 'Moreau', 'Eze', 'Castillo', 'Whitfield', 'Nakamura', 'Duarte', 'Abara', 'Sterling'];
const AGENCY = {
  manager: ['Northside Mgmt', 'Velvet Rope', 'Halo Artists', 'Backline Co.', 'Gold Standard', 'Freelance'],
  publicist: ['Spin Doctors PR', 'Loud and Clear', 'Glasshouse Press', 'Pink Slip PR', 'Redline Comms', 'Freelance'],
  booking: ['Tourbus Talent', 'Marquee Booking', 'Night Owl Agency', 'Stagedoor', 'Circuit Live', 'Freelance'],
};

export function tierOf(eff) {
  return eff >= 1.3 ? 'Elite' : eff >= 1.05 ? 'Pro' : eff >= 0.85 ? 'Solid' : 'Rookie';
}

// What this candidate does, scaled from the same constants the engine uses.
export function effects(role, eff, cut) {
  const pct = (n) => `${Math.round(n)}%`;
  if (role === 'manager') return [`Streams x${(1 + 0.1 * eff).toFixed(2)}`, `Brand deals +${pct(20 * eff)} chance and fees`, `Takes ${pct(cut * 100)} of income`];
  if (role === 'booking') return [`Show pay +${pct(20 * eff)}`, `Gig offer chance ${pct((0.3 + 0.25 * eff) * 100)}/wk`, `Festival slots +${pct(15 * eff)} pts`, `Takes ${pct(cut * 100)} of gig income`];
  return [`Hype decays ${pct(25 * eff)} slower`, `Press energy -${pct(30 * eff)}`, `Crisis PR ${pct(Math.min(0.95, 0.65 + 0.25 * eff) * 100)} success, free`];
}

export function hirePool(state, role, week = state.week) {
  if (!HIRE_BASE[role]) return [];
  const rng = createRng(hashString(`${state.seed ?? 0}|hire|${role}|${week}`));
  const out = [];
  const used = new Set();
  for (let i = 0; i < POOL_SIZE; i++) {
    let name;
    do { name = `${FIRST[Math.floor(rng.float(0, FIRST.length))]} ${LAST[Math.floor(rng.float(0, LAST.length))]}`; } while (used.has(name));
    used.add(name);
    const eff = Math.round(rng.float(0.55, 1.5) * 100) / 100;
    // price tracks efficiency with noise, so some candidates are better value than others
    const price = Math.max(100, Math.round((HIRE_BASE[role] * (0.45 + 0.55 * eff) * rng.float(0.85, 1.15)) / 50) * 50);
    const cut = role === 'publicist' ? 0 : Math.round((0.13 - 0.04 * ((eff - 0.55) / 0.95)) * 100) / 100;
    out.push({
      id: `${role}-w${week}-${i}`, role, week, name, agency: AGENCY[role][i % AGENCY[role].length],
      tier: tierOf(eff), efficiency: eff, price, cut,
      value: Math.round((eff / (price / 1000)) * 100) / 100, // efficiency per $1,000 of weekly salary
      effects: effects(role, eff, cut),
    });
  }
  return out.sort((a, b) => b.efficiency - a.efficiency);
}

// Terms of the person currently on the team. Hired the old way (no pick, e.g. old saves) = standard terms.
export function staffTerms(state, role) {
  const pick = state.player.staffPick?.[role];
  const std = { efficiency: 1, cut: role === 'publicist' ? 0 : 0.1, salary: null };
  if (!state.player.staff?.[role] || !pick) return std;
  return { efficiency: pick.efficiency, cut: pick.cut, salary: pick.price };
}
export const hasStaff = (state, role) => !!state.player.staff?.[role];
// Efficiency multiplier applied to a role's bonuses: 0 when not hired, 1 for the standard hire.
export const staffEff = (state, role) => (hasStaff(state, role) ? staffTerms(state, role).efficiency : 0);
export const staffCut = (state, role) => staffTerms(state, role).cut;
