export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

export function uid(state, prefix = 'id') {
  state.nextId = (state.nextId || 1) + 1;
  return `${prefix}${state.nextId}`;
}

export function fmtNum(n) {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1e9) return `${s}${(a / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`;
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e4) return `${s}${(a / 1e3).toFixed(0)}K`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)}K`;
  return `${s}${Math.round(a)}`;
}
export function fmtMoney(n) {
  const a = Math.abs(n);
  const s = n < 0 ? '-$' : '$';
  if (a >= 1e4) return s + fmtNum(a);
  return s + Math.round(a).toLocaleString('en-US');
}
export function fmtDelta(n, money = false) {
  if (!n) return '—';
  const v = money ? fmtMoney(Math.abs(n)) : fmtNum(Math.abs(n));
  return `${n > 0 ? '▲' : '▼'} ${v}`;
}
export const fmtLength = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
