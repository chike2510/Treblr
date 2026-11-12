import { describe, it, expect } from 'vitest';
import * as E from './index.js';
import { createNewGame } from './state.js';
import { advanceWeek } from './tick.js';
import { STAFF } from './data.js';

const mk = (seed = 12345) => {
  const s = createNewGame({ stageName: 'Test', genre: 'afrobeats', city: 'lagos' }, seed);
  s.player.cash = 100000;
  return s;
};
const ROLES = ['manager', 'publicist', 'booking'];

describe('weekly hire market', () => {
  it('every category (Managers, Publicist, Agent) has a full list of options with price and efficiency', () => {
    const s = mk();
    expect(STAFF.map((x) => x.id)).toEqual(ROLES);
    for (const r of ROLES) {
      const pool = E.hirePool(s, r);
      expect(pool.length).toBe(E.POOL_SIZE);
      for (const c of pool) {
        expect(c.role).toBe(r);
        expect(c.price).toBeGreaterThanOrEqual(100);
        expect(c.efficiency).toBeGreaterThanOrEqual(0.55);
        expect(c.efficiency).toBeLessThanOrEqual(1.5);
        expect(c.effects.length).toBeGreaterThan(1);
        expect(c.tier).toBeTruthy();
      }
      expect(new Set(pool.map((c) => c.name)).size).toBe(pool.length);
    }
  });
  it('roles offer different effects', () => {
    const s = mk();
    const first = (r) => E.hirePool(s, r)[0].effects.join(' ');
    expect(first('manager')).toContain('Brand deals');
    expect(first('publicist')).toContain('Hype decays');
    expect(first('booking')).toContain('Show pay');
  });
  it('is stable within a week and changes when the week advances', () => {
    const s = mk();
    for (const r of ROLES) {
      expect(E.hirePool(s, r)).toEqual(E.hirePool(s, r));
      const next = E.hirePool({ ...s, week: s.week + 1 }, r);
      expect(next.map((c) => c.id)).not.toEqual(E.hirePool(s, r).map((c) => c.id));
      expect(next.map((c) => `${c.name}|${c.price}`)).not.toEqual(E.hirePool(s, r).map((c) => `${c.name}|${c.price}`));
    }
    const w = mk();
    const before = E.hirePool(w, 'manager');
    const after = advanceWeek(w);
    const st = after.state || after;
    expect(st.week).toBe(w.week + 1);
    expect(E.hirePool(st, 'manager').map((c) => c.id)).not.toEqual(before.map((c) => c.id));
  });
  it('differs between saves (seed)', () => {
    expect(E.hirePool(mk(1), 'manager').map((c) => c.name)).not.toEqual(E.hirePool(mk(2), 'manager').map((c) => c.name));
  });
  it('better efficiency costs more on average', () => {
    const s = mk();
    let hi = 0, lo = 0, nh = 0, nl = 0;
    for (let w = 1; w <= 40; w++) for (const c of E.hirePool(s, 'manager', w)) { if (c.efficiency >= 1) { hi += c.price; nh++; } else { lo += c.price; nl++; } }
    expect(hi / nh).toBeGreaterThan(lo / nl);
  });
});

describe('hire behaviour', () => {
  it('hiring a candidate sets staff, pick, salary and efficiency', () => {
    const s = mk();
    const c = E.hirePool(s, 'booking')[2];
    const r = E.setStaff(s, { role: 'booking', hire: true, candidateId: c.id });
    expect(r.ok ?? true).toBeTruthy();
    const st = r.state || s;
    expect(st.player.staff.booking).toBe(true);
    expect(st.player.staffPick.booking.id).toBe(c.id);
    expect(E.staffSalaries(st).booking).toBe(c.price);
    expect(E.staffEff(st, 'booking')).toBe(c.efficiency);
    expect(E.staffCost(st)).toBe(c.price);
  });
  it('rejects a stale candidate id from another week', () => {
    const s = mk();
    const old = E.hirePool(s, 'manager')[0];
    const st = { ...s, week: s.week + 1 };
    const r = E.setStaff(st, { role: 'manager', hire: true, candidateId: old.id });
    expect((r.state || st).player.staff.manager).toBe(false);
  });
  it('needs cash for two weeks of salary', () => {
    const s = mk();
    s.player.cash = 10;
    const c = E.hirePool(s, 'publicist')[0];
    const r = E.setStaff(s, { role: 'publicist', hire: true, candidateId: c.id });
    expect((r.state || s).player.staff.publicist).toBe(false);
  });
  it('can switch to another candidate and let go', () => {
    let s = mk();
    const pool = E.hirePool(s, 'manager');
    s = E.setStaff(s, { role: 'manager', hire: true, candidateId: pool[0].id }).state || s;
    s = E.setStaff(s, { role: 'manager', hire: true, candidateId: pool[1].id }).state || s;
    expect(s.player.staffPick.manager.id).toBe(pool[1].id);
    s = E.setStaff(s, { role: 'manager', hire: false }).state || s;
    expect(s.player.staff.manager).toBe(false);
    expect(s.player.staffPick.manager).toBeUndefined();
  });
  it('standard hire (no candidate) keeps old mechanics', () => {
    let s = mk();
    s = E.setStaff(s, { role: 'manager', hire: true }).state || s;
    expect(E.staffEff(s, 'manager')).toBe(1);
    expect(E.staffCut(s, 'manager')).toBe(0.1);
    expect(E.staffSalaries(s).manager).toBe(1500);
    expect(E.staffEff(s, 'publicist')).toBe(0);
  });
  it('efficiency scales the engine: hype decay', () => {
    expect(E.hypeDecay(50, 1)).toBeCloseTo(E.hypeDecay(50, true), 5);
    expect(E.hypeDecay(50, 1.4)).toBeGreaterThan(E.hypeDecay(50, 0.6));
    expect(E.hypeDecay(50, false)).toBeLessThan(E.hypeDecay(50, 0.6));
  });
});
