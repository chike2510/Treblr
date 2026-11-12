import { describe, it, expect } from 'vitest';
import * as E from './index.js';
import { hypeDecay } from './model.js';

describe('staff offers', () => {
  const mk = () => {
    const st = { player: { staff: {}, hype: 50 }, contacts: [], history: [{ income: { gigs: 2000 } }, { income: { gigs: 1000 } }] };
    return st;
  };
  it('manager math matches engine constants', () => {
    const o = E.staffOffers(mk()).manager;
    expect(o.salary).toBe(1500);
    const t = o.lines.join(' ');
    expect(t).toContain('-$10 per $1,000 of streams');
    expect(t).toContain('-$100 per $1,000');
    expect(t).toContain('+$296 per $1,000');
    expect(E.MANAGER_COMMISSION).toBe(0.1);
  });
  it('manager salary drops with high relationship', () => {
    const st = mk(); st.contacts = [{ role: 'manager', rel: 80 }];
    expect(E.staffOffers(st).manager.salary).toBe(1200);
    expect(E.staffCost({ ...st, player: { staff: { manager: true } } })).toBe(1200);
  });
  it('booking agent math', () => {
    const o = E.staffOffers(mk()).booking;
    const t = o.lines.join(' ');
    expect(t).toContain('+$80 per $1,000 of gig pay');
    expect(t).toContain('30% to 55%');
    expect(o.breakEven).toContain('$8,750/wk');
    expect(o.recent).toContain('$1,500/wk');
  });
  it('publicist hype numbers equal engine hypeDecay', () => {
    const st = mk();
    const o = E.staffOffers(st).publicist;
    const saved = hypeDecay(50, true) - hypeDecay(50, false);
    expect(saved).toBeCloseTo(2.8, 1);
    expect(o.lines.join(' ')).toContain(`${saved.toFixed(1)} hype kept per week`);
    expect(o.lines.join(' ')).toContain('press 15 to 11');
    expect(o.lines.join(' ')).toContain('$2,500');
  });
  it('energy costs shown match engine', () => {
    expect(Math.round(E.ENERGY.press * 0.7)).toBe(11);
    expect(Math.round(E.ENERGY.radio * 0.7)).toBe(14);
    expect(Math.round(E.ENERGY.interview * 0.7)).toBe(7);
  });
});
