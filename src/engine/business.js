// Business & life systems (2026-10-27): bank loans + credit score, label deals with negotiation and
// contracts, distribution, lifestyle purchases, acting, festivals, tour setlists & crew, payola v2,
// paid ads, catalogue actions, EP/album rollout steps, genre promo, TreblrTube ads, TreblrCloud,
// free-text Treblrchat, and custom roster packs.
import { run, spend, earn, pushNews, bump } from './actions.js';
import { clamp, uid, fmtMoney, fmtNum } from './util.js';
import { gainHype } from './model.js';
import { cityById, genreName, VENUES } from './data.js';
import {
  LABELS, labelById, CREATIVE_CONTROL, DISTRIBUTORS, distributorById, LIFESTYLE, lifestyleById, ACTING_ROLES, FILM_WORDS,
  FESTIVALS, FEST_SIZE, TOUR_STAFF, DANCE_GENRES, PROMO_IDEAS, ROLLOUT_STEPS, PAYOLA, AD_TIERS,
} from './data2.js';
import { logTimeline, pushNotif } from './journal.js';
import { stat } from './weekly.js';
import { addStarPoints, statPost } from './career.js';
import { contactForRival, openCrisis } from './features.js';

const fail = (msg) => ({ ok: false, msg });
const yearOf = (w) => Math.floor((w - 1) / 52);
const weekOfYear = (w) => ((w - 1) % 52) + 1;

// =====================================================================================
// Bank: credit score & loans
// =====================================================================================
export function bankOf(s) {
  s.bank = s.bank || { loans: [], onTime: 0, late: 0, defaults: 0, incomeLog: [], firstLoanWeek: null, banUntil: null };
  return s.bank;
}
export function avgIncome(s) {
  const log = bankOf(s).incomeLog;
  return log.length ? log.reduce((a, b) => a + b, 0) / log.length : 0;
}
export function totalDebt(s) {
  return bankOf(s).loans.reduce((a, l) => a + l.balance, 0);
}
// 300..850. Payment history 35%, income 30%, debt load 20%, credit age 15%.
export function creditScore(s) {
  const b = bankOf(s);
  const paid = b.onTime + b.late + b.defaults;
  const history = paid ? clamp((b.onTime + 2) / (paid + 2 + b.late * 2 + b.defaults * 15), 0, 1) : 0.55;
  const inc = avgIncome(s);
  const income = clamp(Math.log10(1 + Math.max(0, inc)) / 5, 0, 1);
  const debt = totalDebt(s);
  const debtScore = clamp(1 - debt / Math.max(1, inc * 26 + Math.max(0, s.player.cash)), 0, 1);
  const age = clamp((s.week - (b.firstLoanWeek ?? s.week)) / 104 + Math.min(0.4, s.week / 260), 0, 1);
  return Math.round(300 + 550 * (0.35 * history + 0.3 * income + 0.2 * debtScore + 0.15 * age));
}
export function creditBand(score) {
  return score >= 760 ? 'Excellent' : score >= 690 ? 'Good' : score >= 620 ? 'Fair' : score >= 540 ? 'Poor' : 'Very poor';
}
export function loanOffer(s) {
  const score = creditScore(s);
  const b = bankOf(s);
  const inc = Math.max(0, avgIncome(s));
  if (b.banUntil && s.week < b.banUntil) return { score, max: 0, apr: null, reason: `Banks won’t lend after a default (until week ${b.banUntil}).` };
  if (score < 520) return { score, max: 0, apr: null, reason: 'Credit score too low. Build income and pay on time.' };
  if (b.loans.length >= 2) return { score, max: 0, apr: null, reason: 'Two loans open already.' };
  const k = (score - 500) / 350;
  const max = Math.round((1500 + inc * 30 * k * 1.2 + Math.max(0, s.player.cash) * 0.2 * k) / 500) * 500;
  const apr = Math.round((0.34 - 0.28 * clamp(k, 0, 1)) * 1000) / 10;
  return { score, max: Math.max(0, max - totalDebt(s)), apr };
}
export function weeklyPayment(amount, apr, weeks) {
  const r = apr / 100 / 52;
  return r ? (amount * r) / (1 - Math.pow(1 + r, -weeks)) : amount / weeks;
}
export function takeLoan(state, { amount, weeks = 52 }) {
  return run(state, (s) => {
    const o = loanOffer(s);
    if (!o.max) return fail(o.reason || 'No loan available.');
    amount = Math.round(amount);
    if (!(amount >= 500)) return fail('Minimum loan is $500.');
    if (amount > o.max) return fail(`The bank will lend up to ${fmtMoney(o.max)}.`);
    if (![26, 52, 104].includes(weeks)) return fail('Pick a term.');
    const b = bankOf(s);
    const pay = Math.round(weeklyPayment(amount, o.apr, weeks));
    b.loans.push({ id: uid(s, 'ln'), amount, balance: amount, apr: o.apr, weeks, payment: pay, startWeek: s.week, missed: 0 });
    if (b.firstLoanWeek == null) b.firstLoanWeek = s.week;
    earn(s, 'loan', amount, `Bank loan (${o.apr}% APR, ${weeks} weeks)`);
    return { msg: `Loan approved: ${fmtMoney(amount)} at ${o.apr}% APR. ${fmtMoney(pay)}/week for ${weeks} weeks.` };
  });
}
export function repayLoan(state, { id }) {
  return run(state, (s) => {
    const b = bankOf(s);
    const l = b.loans.find((x) => x.id === id);
    if (!l) return fail('Loan not found.');
    const due = Math.round(l.balance);
    if (s.player.cash < due) return fail(`Paying it off needs ${fmtMoney(due)}.`);
    spend(s, 'loan', due, 'Loan paid off early');
    b.loans = b.loans.filter((x) => x !== l);
    b.onTime += 2;
    return { msg: 'Loan paid off. Your credit history thanks you.' };
  });
}
// Weekly: income log, repayments, missed payments and defaults.
export function bankTick(s, weekIncome) {
  const b = bankOf(s);
  b.incomeLog = [...b.incomeLog, Math.round(weekIncome)].slice(-8);
  for (const l of b.loans.slice()) {
    const r = l.apr / 100 / 52;
    const interest = l.balance * r;
    const pay = Math.min(l.payment, Math.round(l.balance + interest));
    if (s.player.cash >= pay) {
      spend(s, 'loan', pay, 'Loan repayment');
      l.balance = Math.max(0, l.balance + interest - pay);
      l.missed = 0;
      b.onTime += 1;
      if (l.balance < 1) { b.loans = b.loans.filter((x) => x !== l); pushNotif(s, 'bank', 'Loan fully repaid ✔', { tab: 'phone', app: 'bank' }); }
    } else {
      l.missed += 1;
      b.late += 1;
      l.balance += interest + l.payment * 0.05;
      pushNotif(s, 'bank', `Missed a loan payment (${l.missed}/3). Late fee added.`, { tab: 'phone', app: 'bank' }, 'bank');
      if (l.missed >= 3) defaultLoan(s, l);
    }
  }
}
function defaultLoan(s, l) {
  const b = bankOf(s);
  b.defaults += 1;
  b.loans = b.loans.filter((x) => x !== l);
  b.banUntil = s.week + 26;
  let owed = l.balance;
  // the bank seizes assets
  const owned = (s.lifestyle?.owned || []).slice().sort((a, x) => x.value - a.value);
  for (const it of owned) {
    if (owed <= 0) break;
    owed -= it.value * 0.7;
    s.lifestyle.owned = s.lifestyle.owned.filter((x) => x !== it);
  }
  if (owed > 0 && s.player.cash > 0) { const take = Math.min(s.player.cash, owed); spend(s, 'loan', take, 'Bank seizure'); }
  gainHype(s.player, -10);
  if (s.player.popularity >= 30) pushNews(s, `${s.player.stageName} defaults on a bank loan; assets seized`, true, 'Business');
  logTimeline(s, 'bank', 'Defaulted on a loan', 'Assets seized, credit frozen for 26 weeks');
  pushNotif(s, 'bank', 'Loan default: the bank seized assets. No new credit for 26 weeks.', { tab: 'phone', app: 'bank' });
}

// =====================================================================================
// Labels: contracts, negotiation, labelmates
// =====================================================================================
const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Deterministic (fictional) label for each NPC: an imprint that fits their genre, or a major.
export function rivalLabelId(r) {
  if (!r) return null;
  if (r.labelId) return r.labelId;
  const h = hashStr(r.name);
  const big = LABELS.filter((l) => l.tier === 'Major' || l.tier === 'Imprint' || l.tier === 'Mid');
  const fit = big.filter((l) => !l.genres.length || l.genres.some((g) => r.genres?.includes(g)));
  const pool = r.tier === 'rising' ? LABELS.filter((l) => l.tier === 'Indie' && (!l.genres.length || l.genres.some((g) => r.genres?.includes(g)))) : fit;
  const list = pool.length ? pool : big;
  return list[h % list.length].id;
}
export function labelFamily(id) {
  const l = labelById(id);
  return l ? (l.parent || l.id) : null;
}
export function sameLabel(s, r) {
  const mine = s.player.label?.id;
  if (!mine) return false;
  return labelFamily(mine) === labelFamily(rivalLabelId(r));
}
export function labelReach(s) {
  const c = s.player.label;
  if (!c) return 1;
  const l = labelById(c.id);
  const ctrl = CREATIVE_CONTROL.find((x) => x.id === c.control) || CREATIVE_CONTROL[1];
  return (l?.reach || 1.3) * ctrl.reach * (c.breach ? 0.6 : 1);
}
// Interest: what a label would offer you right now (or null).
export function labelTerms(s, l, rng) {
  const p = s.player;
  const gap = p.popularity - l.minPop;
  if (gap < -6) return null;
  const fit = !l.genres.length || l.genres.includes(p.genre) ? 1 : 0.75;
  const star = 1 + Math.min(2, Math.max(0, gap) / 15);
  const r = rng ? rng.float(0.9, 1.15) : 1;
  const albums = p.popularity >= 55 ? 3 : p.popularity >= 35 ? 2 : 1;
  const advance = Math.round((l.advance * star * fit * r * Math.pow(albums, 0.8)) / 500) * 500;
  return {
    labelId: l.id, label: l.name, advance, royalty: l.royalty, albums, yearsPerAlbum: l.strict > 0.5 ? 2 : 3, control: l.strict > 0.6 ? 'label' : 'shared',
    max: { advance: Math.round(advance * (1.25 + 0.25 * fit)), royalty: Math.min(0.85, l.royalty + 0.1 + Math.max(0, gap) / 200) },
    patience: l.strict > 0.5 ? 2 : 3, strict: l.strict,
  };
}
export function requestLabelMeeting(state, { labelId }) {
  return run(state, (s, rng) => {
    const l = labelById(labelId);
    if (!l) return fail('Unknown label.');
    if (s.player.label) return fail(`You’re under contract with ${s.player.label.name}.`);
    if (s.inbox.some((m) => m.type === 'offer' && m.subtype === 'label' && !m.status && m.payload.labelId === l.id)) return fail('Their offer is already in your Inbox.');
    const last = (s.labelAsks || {})[l.id];
    if (last != null && s.week - last < 8) return fail(`${l.name} said to check back in ${8 - (s.week - last)} weeks.`);
    s.labelAsks = { ...(s.labelAsks || {}), [l.id]: s.week };
    if (s.player.energy < 10) return fail('A label meeting needs 10 energy.');
    s.player.energy -= 10;
    const t = labelTerms(s, l, rng);
    if (!t || s.player.popularity < l.minPop - 2 || !rng.chance(clamp(0.45 + (s.player.popularity - l.minPop) / 40, 0.1, 0.95))) {
      return { msg: `${l.name} passed for now. Grow your numbers and try again in 8 weeks.`, data: { offered: false } };
    }
    s.inbox.unshift({ id: uid(s, 'm'), type: 'offer', subtype: 'label', from: l.name, subject: `${l.name} (${l.tier}) wants to sign you`, body: dealText(t), payload: t, week: s.week, expires: s.week + 3, read: false });
    pushNotif(s, 'offer', `${l.name} sent a record deal`, { tab: 'phone', app: 'inbox' }, 'offer');
    return { msg: `${l.name} liked the meeting, an offer is in your Inbox.`, data: { offered: true } };
  });
}
export function dealText(t) {
  const ctrl = CREATIVE_CONTROL.find((x) => x.id === t.control)?.name || t.control;
  return `${t.albums}-album deal, ${t.yearsPerAlbum} years per album. Advance ${fmtMoney(t.advance)} (recouped from your royalties). You keep ${Math.round(t.royalty * 100)}% of streaming income. ${ctrl}. ${t.strict >= 0.5 ? 'Strict delivery schedule with penalties.' : 'Flexible schedule.'}`;
}
// Negotiate a pending label offer. ask = { advance, royalty, albums, yearsPerAlbum, control }.
export function negotiateDeal(state, { id, ask }) {
  return run(state, (s, rng) => {
    const m = s.inbox.find((x) => x.id === id);
    if (!m || m.subtype !== 'label' || m.status) return fail('That offer is gone.');
    const t = m.payload;
    if (t.patience <= 0) return fail(`${t.label} is done negotiating. Accept or walk.`);
    const want = { ...t, ...ask };
    want.albums = clamp(Math.round(want.albums), 1, 3);
    want.yearsPerAlbum = clamp(Math.round(want.yearsPerAlbum), 2, 3);
    // How much more expensive is this for the label (1 = same as their offer)?
    const ctrlV = (id2) => CREATIVE_CONTROL.find((x) => x.id === id2)?.value || 1;
    const advR = want.advance / Math.max(1, t.advance);
    const royR = (want.royalty - t.royalty) / 0.1;
    const termR = (t.albums - want.albums) * 0.15 + (t.yearsPerAlbum - want.yearsPerAlbum) * 0.1;
    const ctrlR = (ctrlV(t.control) - ctrlV(want.control)) * 1.5;
    const over = (advR - 1) + royR * 0.6 + termR + ctrlR;
    const cap = (t.max.advance / t.advance - 1) + (t.max.royalty - t.royalty) / 0.1 * 0.6 * 0.5;
    t.patience -= 1;
    m.read = true;
    if (want.advance <= t.max.advance && want.royalty <= t.max.royalty && over <= cap + rng.float(-0.05, 0.1)) {
      Object.assign(t, { advance: Math.round(want.advance), royalty: want.royalty, albums: want.albums, yearsPerAlbum: want.yearsPerAlbum, control: want.control });
      m.body = dealText(t);
      return { msg: `${t.label} agreed to your terms.`, data: { result: 'agreed' } };
    }
    if (over > cap * 2.2 + 0.4 || t.patience <= 0 && over > cap) {
      if (rng.chance(0.55)) { m.status = 'declined'; return { msg: `${t.label} walked away from the table.`, data: { result: 'walked' } }; }
    }
    // counter: meet halfway on money, keep their structure
    t.advance = Math.round(Math.min(t.max.advance, (t.advance + want.advance) / 2) / 500) * 500;
    t.royalty = Math.round(Math.min(t.max.royalty, (t.royalty + want.royalty) / 2) * 100) / 100;
    if (want.control !== t.control && rng.chance(0.4)) t.control = want.control;
    m.body = dealText(t);
    return { msg: `${t.label} countered: ${fmtMoney(t.advance)} advance, ${Math.round(t.royalty * 100)}% royalty.`, data: { result: 'counter' } };
  });
}
// Called from respondOffer when a label deal is accepted.
export function signContract(s, t) {
  const p = s.player;
  const term = t.albums * t.yearsPerAlbum * 52;
  p.label = { id: t.labelId, name: t.label, royalty: t.royalty, signedWeek: s.week, advance: t.advance, recouped: 0, albums: t.albums, delivered: 0, yearsPerAlbum: t.yearsPerAlbum, endWeek: s.week + term, control: t.control || 'shared', strict: t.strict ?? 0.3, breach: false, nextDue: s.week + t.yearsPerAlbum * 52 };
  earn(s, 'advance', t.advance, `Advance: ${t.label}`);
  logTimeline(s, 'deal', `Signed to ${t.label}`, `${t.albums}-album deal · ${fmtMoney(t.advance)} advance`);
  pushNews(s, `${p.stageName} signs a ${t.albums}-album deal with ${t.label}`, true, 'Business');
  addStarPoints(s, 4);
}
// Royalties pass through recoupment: the label keeps your share until the advance is earned back.
export function labelRoyalty(s, gross) {
  const c = s.player.label;
  if (!c) {
    const d = distributorById(s.distributor);
    return gross * (1 - d.cut);
  }
  const share = gross * c.royalty;
  if (c.advance && c.recouped < c.advance) {
    const toRecoup = Math.min(share, c.advance - c.recouped);
    c.recouped += toRecoup;
    if (c.recouped >= c.advance) pushNotif(s, 'label', `Your ${c.name} advance is recouped, royalties now pay out`, { tab: 'world', section: 'labels' });
    return share - toRecoup;
  }
  return share;
}
// Weekly contract checks: delivery schedule, expiry.
export function contractTick(s) {
  const c = s.player.label;
  if (!c || c.endWeek == null) return;
  if (s.week >= c.endWeek || c.delivered >= c.albums) {
    pushNews(s, `${s.player.stageName}’s deal with ${c.name} comes to an end`, true, 'Business');
    logTimeline(s, 'deal', `Contract with ${c.name} ended`, `${c.delivered}/${c.albums} albums delivered`);
    pushNotif(s, 'label', `Your ${c.name} contract has ended. You’re a free agent.`, { tab: 'world', section: 'labels' });
    s.player.label = null;
    return;
  }
  if (s.week > c.nextDue && !c.breach) {
    c.breach = true;
    const fee = Math.round(c.advance * 0.1 * c.strict);
    if (fee > 0) spend(s, 'other', fee, `${c.name}: late-delivery penalty`);
    gainHype(s.player, -4);
    pushNotif(s, 'label', `${c.name}: album overdue. Marketing support cut until you deliver.`, { tab: 'world', section: 'labels' });
  }
}
export function deliverAlbum(s) {
  const c = s.player.label;
  if (!c || c.endWeek == null) return;
  c.delivered += 1;
  c.breach = false;
  c.nextDue = s.week + c.yearsPerAlbum * 52;
}
export function buyoutCost(s) {
  const c = s.player.label;
  if (!c) return 0;
  const unrecouped = Math.max(0, (c.advance || 0) - (c.recouped || 0));
  return Math.round(Math.max(5000, unrecouped * 1.2 + (c.albums - c.delivered) * 25000 * (1 + (c.strict || 0))));
}

// =====================================================================================
// Distribution (independent artists)
// =====================================================================================
export function setDistributor(state, { id }) {
  return run(state, (s) => {
    const d = DISTRIBUTORS.find((x) => x.id === id);
    if (!d) return fail('Unknown distributor.');
    if (s.player.label) return fail('Your label handles distribution.');
    if (s.distributor === id) return fail(`Already with ${d.name}.`);
    if (d.minML && s.player.monthlyListeners < d.minML) return fail(`${d.name} works with artists above ${fmtNum(d.minML)} monthly listeners.`);
    if (d.fee && s.player.cash < d.fee) return fail(`${d.name} costs ${fmtMoney(d.fee)} a year.`);
    if (d.fee) spend(s, 'distribution', d.fee, `${d.name} yearly plan`);
    s.distributor = d.id;
    s.distributorPaidYear = yearOf(s.week);
    return { msg: `Your catalogue now goes out through ${d.name}.` };
  });
}
export function distributionTick(s) {
  if (s.player.label) return;
  const d = distributorById(s.distributor);
  const y = yearOf(s.week);
  if (d.fee && s.distributorPaidYear !== y) {
    s.distributorPaidYear = y;
    spend(s, 'distribution', d.fee, `${d.name} yearly plan`);
  }
}
export function pitchBonus(s) {
  return s.player.label ? 0.1 * labelReach(s) : distributorById(s.distributor).pitch;
}

// =====================================================================================
// Lifestyle
// =====================================================================================
export function lifestyleOf(s) {
  s.lifestyle = s.lifestyle || { owned: [], rental: null };
  return s.lifestyle;
}
export function ownsKind(s, kind) {
  return lifestyleOf(s).owned.some((x) => lifestyleById(x.id)?.kind === kind);
}
export function buyLifestyle(state, { id }) {
  return run(state, (s) => {
    const it = lifestyleById(id);
    if (!it) return fail('Unknown item.');
    const ls = lifestyleOf(s);
    const p = s.player;
    if (it.kind === 'rental') {
      if (ownsKind(s, 'home')) return fail('You own a home already.');
      if (ls.rental === it.id) return fail('You already live here.');
      if (p.cash < it.weekly * 4) return fail(`Landlords want ${fmtMoney(it.weekly * 4)} up front.`);
      spend(s, 'lifestyle', it.weekly * 4, `Deposit: ${it.name}`);
      ls.rental = it.id;
      gainHype(p, it.prestige * 0.5);
      return { msg: `Moved into the ${it.name.replace(' (rent)', '').toLowerCase()}.` };
    }
    if (p.cash < it.price) return fail(`${it.name} costs ${fmtMoney(it.price)}.`);
    spend(s, 'lifestyle', it.price, `Bought: ${it.name}`);
    ls.owned.push({ uid: uid(s, 'ls'), id: it.id, boughtWeek: s.week, price: it.price, value: it.price });
    if (it.kind === 'home') ls.rental = null;
    const same = ls.owned.filter((x) => lifestyleById(x.id)?.kind === it.kind).length;
    gainHype(p, it.prestige / same);
    if (it.price >= 1_000_000 && p.popularity >= 30) pushNews(s, `${p.stageName} splashes out on a ${it.name.toLowerCase()}`, true, 'Life');
    if (it.price >= 2_000_000 && p.popularity < 50) p.fans = Math.round(p.fans * 0.995); // some fans think it's too much, too soon
    logTimeline(s, 'life', `Bought a ${it.name.toLowerCase()}`, fmtMoney(it.price));
    return { msg: `${it.name} is yours. Upkeep ${fmtMoney(it.weekly)}/week.` };
  });
}
export function sellLifestyle(state, { uid: key }) {
  return run(state, (s) => {
    const ls = lifestyleOf(s);
    const o = ls.owned.find((x) => x.uid === key);
    if (!o) return fail('Not found.');
    const it = lifestyleById(o.id);
    const fee = it.kind === 'home' ? 0.06 : 0.1;
    const cash = Math.round(o.value * (1 - fee));
    ls.owned = ls.owned.filter((x) => x !== o);
    earn(s, 'sales', cash, `Sold: ${it.name}`);
    return { msg: `Sold the ${it.name.toLowerCase()} for ${fmtMoney(cash)}.` };
  });
}
export function moveOutRental(state) {
  return run(state, (s) => { const ls = lifestyleOf(s); if (!ls.rental) return fail('You’re in your starter place.'); ls.rental = null; return { msg: 'Moved back to a modest place.' }; });
}
export function lifestyleUpkeep(s) {
  const ls = lifestyleOf(s);
  let upkeep = 0;
  for (const o of ls.owned) {
    const it = lifestyleById(o.id);
    if (!it) continue;
    upkeep += it.weekly;
    o.value = Math.max(0, Math.round(o.value * (1 + (it.appreciation || 0) / 52)));
  }
  if (ls.rental) upkeep += lifestyleById(ls.rental)?.weekly || 0;
  return upkeep;
}
export function assetsValue(s) {
  return lifestyleOf(s).owned.reduce((a, o) => a + o.value, 0);
}
export function netWorth(s) {
  const inv = s.investments;
  const iv = inv ? Object.entries(inv.stocks || {}).reduce((a, [t, n]) => a + n * (inv.prices?.[t] || 0), 0) + (inv.properties || []).reduce((a, o) => a + o.value, 0) + (inv.businesses || []).reduce((a, o) => a + o.value, 0) : 0;
  return Math.round(s.player.cash + assetsValue(s) + iv - totalDebt(s));
}

// =====================================================================================
// Acting
// =====================================================================================
export function actingOf(s) {
  s.acting = s.acting || { credits: [], current: null, lastAudition: null };
  return s.acting;
}
export function auditionOdds(s, role) {
  const p = s.player;
  const act = p.skills.acting || 0;
  return clamp(0.3 + (act - role.needAct) / 55 + (p.popularity - role.minPop) / 70 + p.skills.charisma / 500, 0.03, 0.9);
}
export function audition(state, { roleId }) {
  return run(state, (s, rng) => {
    const role = ACTING_ROLES.find((r) => r.id === roleId);
    const a = actingOf(s);
    const p = s.player;
    if (!role) return fail('Pick a role.');
    if (a.current) return fail('You’re already attached to a project.');
    if (p.popularity < role.minPop) return fail(`Casting wants popularity ${role.minPop}+.`);
    if (a.lastAudition === s.week) return fail('One audition a week.');
    if (p.energy < 10) return fail('Auditions need 10 energy.');
    p.energy -= 10;
    a.lastAudition = s.week;
    bump(p, 'acting', 0.6);
    if (!rng.chance(auditionOdds(s, role))) return { msg: 'Casting went another way. Acting class helps.', data: { booked: false } };
    const title = `${rng.pick(FILM_WORDS.a)} ${rng.pick(FILM_WORDS.b)}`;
    a.current = { id: uid(s, 'film'), roleId: role.id, title, startWeek: s.week + 1, shootWeeks: role.shoot, releaseWeek: s.week + 1 + role.shoot + rng.int(6, 14), shot: 0, reserve: 20 };
    earn(s, 'acting', Math.round(role.pay * 0.5), `Acting fee (first half): ${title}`);
    pushNews(s, `${p.stageName} cast in “${title}”`, true, 'Film');
    logTimeline(s, 'acting', `Cast in “${title}”`, role.name);
    return { msg: `Booked! ${role.name}: “${title}”. Filming starts next week.`, data: { booked: true } };
  });
}
// Weekly: shooting reserves energy; release resolves box office / viewers.
export function actingTick(s, rng, ev) {
  const a = actingOf(s);
  const c = a.current;
  if (!c) return null;
  const role = ACTING_ROLES.find((r) => r.id === c.roleId);
  const p = s.player;
  if (s.week >= c.startWeek && c.shot < c.shootWeeks) {
    c.shot += 1;
    p.energyPenalty = (p.energyPenalty || 0) + c.reserve;
    bump(p, 'acting', 1.2);
    return null;
  }
  if (s.week >= c.releaseWeek) {
    const score = clamp(Math.round((p.skills.acting || 0) * 0.55 + p.skills.charisma * 0.2 + rng.float(-12, 18) + role.budget * 2), 5, 98);
    const reach = Math.round((role.budget * 4e6 + p.monthlyListeners * 0.6) * (score / 60) * rng.float(0.7, 1.3));
    const fans = Math.round(Math.min(reach * 0.004, 2e6) * role.fame);
    p.fans += fans;
    gainHype(p, 4 + role.fame * (score / 25));
    earn(s, 'acting', Math.round(role.pay * 0.5 * (score >= 70 ? 1.3 : 1)), `Acting fee + backend: ${c.title}`);
    addStarPoints(s, role.fame * (score >= 70 ? 4 : 1.5));
    const verdict = score >= 80 ? 'a hit' : score >= 60 ? 'solid' : score >= 40 ? 'mixed' : 'a flop';
    a.credits.unshift({ ...c, score, reach, fans, verdict, role: role.name });
    a.current = null;
    pushNews(s, `“${c.title}” starring ${p.stageName} is ${verdict} (${score}/100)`, true, 'Film');
    logTimeline(s, 'acting', `“${c.title}” released`, `${role.name} · ${verdict}`);
    ev?.(40, 'event', { text: `“${c.title}” premieres, critics call it ${verdict}` });
    return { title: c.title, score, fans, verdict };
  }
  return null;
}

// =====================================================================================
// Festivals: pitch, lineup posters, performance
// =====================================================================================
export function festKey(f, year) { return `${f.id}-${year}`; }
// Upcoming festivals in the next `ahead` weeks with their state.
export function festivalCalendar(s, ahead = 30) {
  const out = [];
  for (let w = s.week; w <= s.week + ahead; w++) {
    for (const f of FESTIVALS) if (weekOfYear(w) === f.week) {
      const key = festKey(f, yearOf(w));
      const st = (s.festivals || {})[key] || {};
      out.push({ ...f, festWeek: w, key, state: st, pitchOpen: w - s.week >= 7 && w - s.week <= 16, lineupWeek: w - 6 });
    }
  }
  return out.sort((a, b) => a.festWeek - b.festWeek);
}
export function festSlotFor(s, f) {
  const p = s.player;
  const fame = p.fame?.tier;
  const pop = p.popularity;
  if (pop >= 74 && ['superstar', 'icon', 'star'].includes(fame)) return 'headliner';
  if (pop >= 52) return 'sub';
  if (pop >= 28) return 'undercard';
  return null;
}
export function pitchFestival(state, { key }) {
  return run(state, (s, rng) => {
    const f = festivalCalendar(s, 20).find((x) => x.key === key);
    if (!f) return fail('That festival isn’t taking pitches.');
    if (!f.pitchOpen) return fail('Pitches open 16 weeks out and close 7 weeks before the festival.');
    s.festivals = s.festivals || {};
    if (s.festivals[key]?.pitched) return fail('You already pitched.');
    if (s.player.socialEnergy < 5) return fail('Pitching needs 5 social energy.');
    s.player.socialEnergy -= 5;
    const slot = festSlotFor(s, f);
    const fit = !f.genres.length || f.genres.includes(s.player.genre) ? 1 : 0.6;
    const chance = slot ? clamp((0.35 + s.player.popularity / 200) * fit + (s.player.staff.booking ? 0.15 : 0) + (s.player.label ? 0.05 : 0), 0.05, 0.92) : 0.04;
    const accepted = rng.chance(chance);
    s.festivals[key] = { pitched: s.week, accepted, slot: accepted ? (slot || 'undercard') : null, festWeek: f.festWeek };
    return { msg: `Pitch sent to ${f.name}. You’ll find out when the lineup drops (week ${f.lineupWeek}).` };
  });
}
// Deterministic lineup from the real NPC roster (+ the player if accepted).
export function festivalLineup(s, f, key) {
  const size = FEST_SIZE[f.size];
  const rng = { h: hashStr(key), next() { this.h = Math.imul(this.h ^ (this.h >>> 15), 2246822507) >>> 0; this.h = (this.h + 0x9e3779b9) >>> 0; return this.h / 4294967296; } };
  const fit = (r) => (!f.genres.length || r.genres.some((g) => f.genres.includes(g)) ? 1.6 : 0.6) * (r.country === cityById(f.city).country ? 1.4 : 1);
  const scored = s.rivals.map((r) => ({ r, sc: Math.log10(r.monthlyListeners) * fit(r) + rng.next() * 1.2 })).sort((a, b) => b.sc - a.sc);
  const names = scored.map((x) => x.r.id);
  const st = (s.festivals || {})[key];
  const me = st?.accepted ? st.slot : null;
  const take = (n, from) => names.slice(from, from + n);
  const head = take(size.slots.headliner - (me === 'headliner' ? 1 : 0), 0);
  const sub = take(size.slots.sub - (me === 'sub' ? 1 : 0), head.length);
  const under = take(size.slots.undercard - (me === 'undercard' ? 1 : 0), head.length + sub.length);
  return { headliner: head, sub, undercard: under, me };
}
// Weekly: lineup announcements and performances.
export function festivalTick(s, rng, ev) {
  const results = [];
  s.festivals = s.festivals || {};
  for (const f of festivalCalendar(s, 6)) {
    const st = s.festivals[f.key] || {};
    if (f.festWeek - s.week === 6 && !st.announced) {
      s.festivals[f.key] = { ...st, announced: true };
      const lu = festivalLineup(s, f, f.key);
      const heads = lu.headliner.map((id) => s.rivals.find((r) => r.id === id)?.name).filter(Boolean);
      pushNews(s, `${f.name} ${2027 + yearOf(f.festWeek)} lineup: ${heads.join(', ')} headline`, false, 'Festivals');
      if (st.pitched) pushNotif(s, 'festival', st.accepted ? `You’re on the ${f.name} lineup (${st.slot})! 🎪` : `${f.name} lineup is out. You didn’t make it this year.`, { tab: 'world', section: 'festivals' });
      if (st.accepted) { logTimeline(s, 'festival', `Booked for ${f.name}`, st.slot); statPost(s, `${s.player.stageName} is on the ${f.name} lineup.`, true); }
    }
  }
  for (const f of FESTIVALS) {
    if (weekOfYear(s.week) !== f.week) continue;
    const key = festKey(f, yearOf(s.week));
    const st = s.festivals[key];
    if (!st?.accepted || st.played) continue;
    const size = FEST_SIZE[f.size];
    const p = s.player;
    const fee = Math.round(size.fee[st.slot] * clamp(p.popularity / 70, 0.3, 1.4));
    const q = clamp(p.skills.performance * 0.7 + rng.float(-10, 20), 5, 100);
    const crowd = Math.round(size.crowd * (st.slot === 'headliner' ? 1 : st.slot === 'sub' ? 0.6 : 0.25) * rng.float(0.8, 1.1));
    const fans = Math.round(crowd * 0.06 * (q / 60));
    p.fans += fans;
    p.fanHeat[f.city] = (p.fanHeat[f.city] || 0) + fans;
    earn(s, 'gigs', fee, `${f.name} (${st.slot})`);
    gainHype(p, st.slot === 'headliner' ? 12 : st.slot === 'sub' ? 7 : 4);
    p.energyPenalty = (p.energyPenalty || 0) + 15;
    addStarPoints(s, st.slot === 'headliner' ? 15 : st.slot === 'sub' ? 4 : 1);
    st.played = { fee, crowd, fans, q: Math.round(q) };
    pushNews(s, `${p.stageName} ${q >= 70 ? 'steals the show' : 'plays'} at ${f.name}`, true, 'Festivals');
    logTimeline(s, 'festival', `Played ${f.name}`, `${st.slot} · ${fmtNum(crowd)} crowd`);
    ev?.(56, 'event', { text: `${p.stageName} plays ${f.name} to ${fmtNum(crowd)} people` });
    results.push({ name: f.name, ...st.played, slot: st.slot });
  }
  return results;
}

// =====================================================================================
// Tours: setlists & crew (used by planTour / resolveTourWeek)
// =====================================================================================
export function setlistScore(s, songIds, venueId, staff = []) {
  const p = s.player;
  const v = VENUES.find((x) => x.id === venueId) || VENUES[0];
  const songs = (songIds || []).map((id) => s.songs.find((x) => x.id === id && x.status === 'released')).filter(Boolean);
  if (!songs.length) return { score: 35, notes: ['No setlist: you’re winging it.'], songs: 0 };
  const notes = [];
  const avgQ = songs.reduce((a, x) => a + x.quality, 0) / songs.length;
  const maxStreams = Math.max(1, ...s.songs.map((x) => x.lifetimeStreams || 0));
  const hits = s.songs.filter((x) => x.status === 'released').sort((a, b) => (b.lifetimeStreams || 0) - (a.lifetimeStreams || 0)).slice(0, 3);
  const missing = hits.filter((h) => !songs.includes(h)).length;
  const ideal = v.capacity >= 18000 ? [16, 24] : v.capacity >= 2000 ? [12, 18] : [6, 12];
  let score = avgQ * 0.55 + p.skills.performance * 0.25;
  const pop = (x) => (x.lifetimeStreams || 0) / maxStreams;
  score += pop(songs[0]) * 8 + songs[0].quality / 25; // opener
  score += pop(songs[songs.length - 1]) * 10 + songs[songs.length - 1].quality / 20; // closer
  if (missing) { score -= missing * 4; notes.push(`Fans will miss ${missing === 1 ? 'one of your biggest songs' : `${missing} of your biggest songs`}.`); }
  if (songs.length < ideal[0]) { score -= (ideal[0] - songs.length) * 1.5; notes.push(`Short set for this room (${ideal[0]}–${ideal[1]} songs is ideal).`); }
  if (songs.length > ideal[1]) { score -= (songs.length - ideal[1]) * 1; notes.push('Long set, energy dips in the middle.'); }
  const dance = DANCE_GENRES.includes(p.genre);
  if (staff.includes('sound')) score += 8;
  if (staff.includes('lighting')) score += 5;
  if (staff.includes('dancers')) score += dance ? 10 : 3;
  if (pop(songs[songs.length - 1]) >= 0.6) notes.push('Big closer, they’ll leave singing.');
  return { score: clamp(Math.round(score), 5, 100), notes, songs: songs.length };
}
export function tourStaffCost(staff = [], venueId) {
  const v = VENUES.find((x) => x.id === venueId) || VENUES[0];
  const k = 1 + v.capacity / 25000;
  return Math.round(staff.reduce((a, id) => a + (TOUR_STAFF.find((x) => x.id === id)?.cost || 0), 0) * k);
}

// =====================================================================================
// Payola v2 & paid ads
// =====================================================================================
export function payolaPackage(state, { pkg, songId }) {
  return run(state, (s) => {
    const k = PAYOLA.find((x) => x.id === pkg);
    if (!k) return fail('Pick a package.');
    const song = songId ? s.songs.find((x) => x.id === songId) : s.songs.filter((x) => x.status === 'released').sort((a, b) => b.releasedWeek - a.releasedWeek)[0];
    if (!song || song.status !== 'released') return fail('You need a released song to push.');
    if (s.player.cash < k.cost) return fail(`${k.name} costs ${fmtMoney(k.cost)}.`);
    if (s.player.chartBanUntil && s.week < s.player.chartBanUntil) return fail('Nobody will touch you while you’re banned from the charts.');
    spend(s, 'other', k.cost, 'Consulting fee');
    song.payola = (song.payola || 0) + k.radio;
    if (k.streams) song.boughtStreams = [...(song.boughtStreams || []), ...[0.5, 0.3, 0.2].map((f) => Math.round(k.streams * f))];
    s.player.suspicion = clamp(s.player.suspicion + k.suspicion, 0, 100);
    stat(s, 'payola');
    return { msg: `${k.name} arranged for “${song.title}”. Suspicion now ${Math.round(s.player.suspicion)}.` };
  });
}
// Weekly exposure check. Returns true if the player got caught.
export function payolaExposure(s, rng, events) {
  const p = s.player;
  if (p.suspicion <= 30 || !rng.chance((p.suspicion - 28) / 90)) return false;
  const loss = Math.round(p.fans * 0.1);
  p.fans -= loss;
  gainHype(p, -30);
  p.suspicion = 10;
  p.chartBanUntil = s.week + 8;
  for (const x of s.songs) { x.payola = 0; x.boughtStreams = []; }
  s.crisis = null;
  openCrisis(s, 'payola', `Payola probe: stations and playlists drop ${p.stageName}`, 'A pay-for-play report named you. Your songs are off the charts for 8 weeks and fans want answers.');
  let dropped = false;
  if (p.label && rng.chance(0.5)) {
    const name = p.label.name;
    p.label = null;
    dropped = true;
    pushNews(s, `${name} drops ${p.stageName} after the payola scandal`, true, 'Scandal');
    logTimeline(s, 'scandal', `Dropped by ${name}`, 'Payola scandal');
  }
  pushNews(s, `Payola probe: ${p.stageName}’s songs pulled from the charts for 8 weeks`, true, 'Scandal');
  logTimeline(s, 'scandal', 'Payola scandal', `Chart ban until week ${p.chartBanUntil}${dropped ? ' · dropped by label' : ''}`);
  events?.push({ weight: 90, kind: 'scandal', vars: { name: p.stageName } });
  return true;
}
export function buyAds(state, { songId, tier }) {
  return run(state, (s, rng) => {
    const t = AD_TIERS.find((x) => x.id === tier);
    const song = s.songs.find((x) => x.id === songId);
    if (!t) return fail('Pick a budget.');
    if (!song || !['released', 'scheduled', 'recorded'].includes(song.status)) return fail('Pick a recorded or released song.');
    if (s.player.cash < t.cost) return fail(`${t.name} cost ${fmtMoney(t.cost)}.`);
    spend(s, 'marketing', t.cost, `Ads: ${song.title}`);
    const n = Math.round(t.streams * rng.float(0.8, 1.2) * (0.6 + song.quality / 125));
    song.adStreams = [...(song.adStreams || []), Math.round(n * 0.6), Math.round(n * 0.4)];
    gainHype(s.player, t.cost >= 5000 ? 3 : 1);
    return { msg: `Ads running for “${song.title}”, about ${fmtNum(n)} extra streams over two weeks${song.status !== 'released' ? ' once it’s out' : ''}.` };
  });
}
export function promoteVideo(state, { videoId, tier }) {
  return run(state, (s, rng) => {
    const t = AD_TIERS.find((x) => x.id === tier);
    const v = s.social.videos.find((x) => x.id === videoId);
    if (!t || !v) return fail('Pick a video and a budget.');
    if (s.player.cash < t.cost) return fail(`That budget is ${fmtMoney(t.cost)}.`);
    if (v.adWeek === s.week) return fail('Already promoted this week.');
    spend(s, 'marketing', t.cost, `TreblrTube ads: ${v.title}`);
    const views = Math.round(t.views * rng.float(0.85, 1.2) * (0.6 + (v.quality || 50) / 125));
    v.weekly += views;
    v.adWeek = s.week;
    v.promoted = (v.promoted || 0) + t.cost;
    s.player.followers.viewtube += Math.round(views * 0.002);
    return { msg: `Promoted: ~${fmtNum(views)} extra views this week.` };
  });
}

// =====================================================================================
// Catalogue: delete, pre-release pitch, genre promo, rollout steps, TreblrCloud
// =====================================================================================
export function deleteSong(state, { songId }) {
  return run(state, (s) => {
    const song = s.songs.find((x) => x.id === songId);
    if (!song) return fail('Song not found.');
    if (!['written', 'recorded'].includes(song.status)) return fail('Only unreleased songs can be deleted.');
    if (s.releases.some((r) => r.status === 'scheduled' && r.songIds.includes(songId))) return fail('It’s on a scheduled release.');
    s.songs = s.songs.filter((x) => x !== song);
    return { msg: `“${song.title}” deleted.` };
  });
}
export function promoIdea(state, { songId, idea }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    const it = PROMO_IDEAS.find((x) => x.id === idea);
    if (!song || !['released', 'scheduled', 'recorded'].includes(song.status)) return fail('Pick a recorded or released song.');
    if (!it) return fail('Pick an idea.');
    if (it.genres && !it.genres.includes(song.genre)) return fail(`A ${it.name.toLowerCase()} doesn’t fit ${genreName(song.genre)}.`);
    const p = s.player;
    if (p.socialEnergy < it.social) return fail(`Needs ${it.social} social energy.`);
    if ((song.promos || []).includes(`${it.id}@${s.week}`)) return fail('Already posted that this week.');
    p.socialEnergy -= it.social;
    const fit = it.genres ? 1.15 : 0.85;
    const reps = (song.promos || []).filter((x) => x.startsWith(`${it.id}@`)).length;
    const fresh = Math.pow(0.7, reps);
    const followers = p.followers.clipz + p.followers.snapshot * 0.5;
    const views = Math.round((Math.sqrt(followers + 100) * 220 + 300) * fit * fresh * rng.float(0.6, 1.6) * (0.6 + song.quality / 120));
    const viral = rng.chance(clamp((0.03 + song.quality / 600 + p.hype / 700) * fit * fresh, 0.01, 0.35));
    const total = viral ? Math.round(views * rng.float(8, 25)) : views;
    p.followers.clipz += Math.round(total * (viral ? 0.012 : 0.006));
    gainHype(p, (viral ? 10 : 2) * fit);
    if (song.status === 'released') song.viral = Math.max(song.viral || 1, viral ? rng.float(1.6, 2.6) : 1 + 0.08 * fit * fresh);
    else song.preBuzz = clamp((song.preBuzz || 0) + (viral ? 0.25 : 0.05) * fit * fresh, 0, 0.6);
    song.promos = [...(song.promos || []), `${it.id}@${s.week}`].slice(-20);
    stat(s, 'post');
    s.social.clipz.unshift({ id: uid(s, 'cz'), week: s.week, songId, title: song.title, label: it.name, mode: 'promo', views: total, viral, likes: Math.round(total * 0.08), shares: Math.round(total * 0.01), replies: [] });
    s.social.clipz.length = Math.min(s.social.clipz.length, 30);
    if (viral) { s.weekFlags.viral = song.title; logTimeline(s, 'viral', `${it.name} for “${song.title}” went viral`, `${fmtNum(total)} views`); }
    return { msg: `${it.name}: ${fmtNum(total)} views${viral ? ', it’s spreading!' : ''}${song.status !== 'released' ? ' · pre-release buzz up' : ''}.`, data: { viral } };
  });
}
export function rolloutStep(state, { releaseId, step }) {
  return run(state, (s) => {
    const rel = s.releases.find((r) => r.id === releaseId);
    const st = ROLLOUT_STEPS.find((x) => x.id === step);
    if (!rel || rel.status !== 'scheduled') return fail('Rollout steps are for announced, unreleased projects.');
    if (rel.type === 'single') return fail('Rollout steps are for EPs and albums.');
    if (!st) return fail('Unknown step.');
    rel.steps = rel.steps || {};
    if (rel.steps[step]) return fail(`${st.name} already done.`);
    const p = s.player;
    if (st.energy && p.energy < st.energy) return fail(`Needs ${st.energy} energy.`);
    if (st.social && p.socialEnergy < st.social) return fail(`Needs ${st.social} social energy.`);
    if (st.cost && p.cash < st.cost) return fail(`Costs ${fmtMoney(st.cost)}.`);
    if (st.energy) p.energy -= st.energy;
    if (st.social) p.socialEnergy -= st.social;
    if (st.cost) spend(s, 'marketing', st.cost, `${st.name}: ${rel.title}`);
    rel.steps[step] = s.week;
    rel.preHype = Math.round(((rel.preHype || 0) + st.pre) * 100) / 100;
    gainHype(p, st.hype);
    stat(s, 'post');
    if (p.popularity >= 35) pushNews(s, `${p.stageName} shares the ${st.name.toLowerCase()} for “${rel.title}”`, true, 'Release');
    return { msg: `${st.name} posted. First-week boost now +${Math.round(rel.preHype * 100)}%.` };
  });
}
export function cloudOf(s) {
  s.cloud = s.cloud || { followers: Math.round((s.player.fans || 0) * 0.1), uploads: [] };
  return s.cloud;
}
export function cloudUpload(state, { songId, kind = 'demo' }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    const c = cloudOf(s);
    const p = s.player;
    if (!song) return fail('Pick a song.');
    if (kind === 'demo' && !['written', 'recorded'].includes(song.status)) return fail('Demos are unreleased songs.');
    if (kind === 'leak' && song.status !== 'recorded') return fail('Only a finished, unreleased recording can “leak”.');
    if (c.uploads.some((u) => u.songId === songId && u.kind === kind)) return fail('Already up on TreblrCloud.');
    if (p.socialEnergy < 6) return fail('Needs 6 social energy.');
    p.socialEnergy -= 6;
    const base = Math.sqrt(c.followers + 50) * 60 + 150;
    const plays = Math.round(base * (kind === 'leak' ? 3 : 1) * (song.quality / 55) * rng.float(0.5, 1.6) * (1 + p.hype / 150));
    const reposts = Math.round(plays * rng.float(0.005, 0.02));
    c.followers += Math.round(plays * 0.01);
    c.uploads.unshift({ id: uid(s, 'cl'), songId, title: song.title, kind, week: s.week, plays, reposts, weekly: Math.round(plays * 0.4) });
    if (c.uploads.length > 40) c.uploads.length = 40;
    song.preBuzz = clamp((song.preBuzz || 0) + Math.min(0.2, plays / 400000) + (kind === 'leak' ? 0.05 : 0), 0, 0.6);
    if (kind === 'leak') { song.leaked = true; gainHype(p, 6); }
    else gainHype(p, 1);
    p.fans += Math.round(plays * 0.002);
    return { msg: `${kind === 'leak' ? '“Leaked”' : 'Uploaded'} “${song.title}”: ${fmtNum(plays)} plays, ${fmtNum(reposts)} reposts.` };
  });
}
export function cloudTick(s) {
  const c = s.cloud;
  if (!c) return;
  for (const u of c.uploads) { u.plays += u.weekly; u.weekly = Math.round(u.weekly * 0.7); }
}

// =====================================================================================
// Treblrchat free text: keyword-matched NPC replies
// =====================================================================================
const KW = [
  { k: /\b(collab|feature|feat|verse|song together)\b/, topic: 'collab' },
  { k: /\b(love|miss|babe|baby|cute|❤|💕|😘)\b/u, topic: 'love' },
  { k: /\b(congrat|proud|well done|amazing|fire|🔥)\b/u, topic: 'praise' },
  { k: /\b(release|drop|single|album|ep|plan)\b/, topic: 'release' },
  { k: /\b(beat|studio|mix|master|produce)\b/, topic: 'studio' },
  { k: /\b(tour|show|gig|concert|festival)\b/, topic: 'tour' },
  { k: /\b(money|cash|broke|rent|loan)\b/, topic: 'money' },
  { k: /\b(sorry|apolog)\b/, topic: 'sorry' },
  { k: /\b(hate|trash|wack|mid|flop|loser)\b/, topic: 'rude' },
  { k: /\b(hi|hey|hello|yo|sup|what's up|wyd)\b/, topic: 'hi' },
  { k: /\b(drink|party|hang|dinner|coffee|out tonight)\b/, topic: 'hang' },
  { k: /\b(tired|exhausted|burnt|burned out|stress)\b/, topic: 'tired' },
];
function chatTopic(text) {
  const t = ` ${text.toLowerCase()} `;
  return KW.find((x) => x.k.test(t))?.topic || 'other';
}
function chatReply(s, c, topic, rng) {
  const p = s.player;
  const r = c.rivalId && s.rivals.find((x) => x.id === c.rivalId);
  const name = p.stageName.split(' ')[0];
  const nextRel = s.releases.find((x) => x.status === 'scheduled');
  const lastOut = p.lastReleaseWeek == null ? null : s.week - p.lastReleaseWeek;
  const lines = {
    manager: {
      release: [nextRel ? `“${nextRel.title}” is set for week ${nextRel.releaseWeek}. Line up promo before then.` : lastOut == null ? 'Nothing out yet. Get one great single finished before anything else.' : lastOut < 4 ? `You dropped ${lastOut} week${lastOut === 1 ? '' : 's'} ago. Let it breathe a bit.` : `It’s been ${lastOut} weeks. Fans are ready for the next one.`],
      money: [`You’ve got ${fmtMoney(p.cash)}. Keep two weeks of costs in the bank, always.`, 'Gigs and brand deals pay faster than streams this early.'],
      tour: [p.fans < 1000 ? 'Play local rooms first. Tours come later.' : 'Route the tour through your hottest cities. Check the map.'],
      tired: ['Take the rest day. Burnt-out artists write worse songs.'],
      other: ['Noted. Let’s focus on the next release.', 'Got it. I’ll keep an eye out.'],
    },
    producer: {
      studio: ['Studio’s open Thursday. Bring hooks.', 'Send me the stems, I’ll take a pass at the mix.'],
      collab: ['I’ve got a beat with your name on it.'],
      other: ['Say less 🎛️', 'Let’s cook soon.'],
    },
    artist: {
      collab: [r && sameLabel(s, r) ? 'We’re labelmates, let’s make it easy. Send it over.' : 'Send the record to my team, if it’s right I’m in.', 'Maybe! What’s the song about?'],
      praise: ['appreciate you fr 🙏', 'thank you!! that means a lot coming from you'],
      rude: ['ok… 😐', 'not sure what that was about'],
      hi: ['yo! what’s good', 'heyyy 👋'],
      other: ['haha true', 'for sure', '🙏'],
    },
    friend: {
      tired: ['Come over, I’ll make food. No music talk.', 'Please sleep, superstar.'],
      hang: ['YES. Saturday?', 'say less, I’m in 🎉'],
      praise: ['lol stop, you’re the famous one'],
      other: ['lmaooo', 'proud of you btw', 'ok but when are we hanging out'],
    },
    person: {
      love: ['haha you’re sweet 🙈', 'stop it 😊'],
      hang: ['I’d love that ☕', 'coffee this week?'],
      other: ['haha', 'what are you up to this week?', 'that’s so cool'],
    },
    partner: {
      love: ['love you more ❤️', 'miss you too. come home soon'],
      tired: ['Take tonight off. I’ll order food.'],
      hang: ['date night?? 😍'],
      other: ['❤️', 'call me later?', 'proud of you'],
    },
  };
  const set = lines[c.role] || lines.person;
  const pool = set[topic] || (topic === 'hi' && ['hey!', `hey ${name}!`]) || (topic === 'sorry' && ['it’s all good', 'thanks for saying that']) || (topic === 'rude' && ['wow. ok.']) || set.other || ['👍'];
  return rng.pick(pool);
}
export function sendChat(state, { contactId, text }) {
  return run(state, (s, rng) => {
    const c = (s.contacts || []).find((x) => x.id === contactId);
    const msg = (text || '').trim().slice(0, 300);
    if (!c) return fail('Contact not found.');
    if (!msg) return fail('Type a message.');
    c.chatLog = c.chatWeek === s.week ? (c.chatLog || 0) : 0;
    c.chatWeek = s.week;
    if (c.chatLog >= 4) {
      c.thread.push({ from: 'me', text: msg, week: s.week });
      return { msg: `${c.name.split(' ')[0]} hasn’t replied yet.` };
    }
    if (c.role === 'artist' && s.player.socialEnergy < 2) return fail('Out of social energy.');
    if (c.role === 'artist') s.player.socialEnergy -= 2;
    c.chatLog += 1;
    c.thread.push({ from: 'me', text: msg, week: s.week });
    const topic = chatTopic(msg);
    const seen = c.role === 'artist' && c.rel < 5 && rng.chance(0.5);
    if (seen) c.thread.push({ from: 'them', text: '(Seen)', week: s.week, system: true });
    else c.thread.push({ from: 'them', text: chatReply(s, c, topic, rng), week: s.week });
    const d = { praise: 3, love: c.role === 'partner' || c.role === 'person' ? 3 : 0, hang: 2, rude: -8, sorry: 2, hi: 1 }[topic] || 0;
    if (!seen) c.rel = clamp(Math.round(c.rel + d * (c.chatLog > 2 ? 0.5 : 1)), -100, 100);
    if (topic === 'tired' && (c.role === 'friend' || c.role === 'partner')) s.player.burnout = clamp((s.player.burnout || 0) - 2, 0, 100);
    if (c.thread.length > 60) c.thread.splice(0, c.thread.length - 60);
    stat(s, 'message');
    return { msg: '' };
  });
}

// =====================================================================================
// Roster packs (custom NPC artists for new saves)
// =====================================================================================
const STYLES_FOR = { pop: ['romance', 'party'], hiphop: ['street', 'moody'], rnb: ['romance', 'moody'], rock: ['rock', 'anthem'], country: ['country', 'ballad'], kpop: ['kpop', 'party'], latin: ['latin', 'romance'], electronic: ['edm', 'party'], afrobeats: ['afro', 'party'], indie: ['dreamy', 'moody'], metal: ['metal', 'anthem'], jazz: ['jazzy', 'ballad'], reggaeton: ['latin', 'party'], alternative: ['moody', 'rock'] };
export function tierForML(ml) { return ml >= 4e7 ? 'superstar' : ml >= 1.2e7 ? 'star' : ml >= 2e6 ? 'established' : 'rising'; }
export function customArtist(a) {
  const ml = clamp(Math.round(+a.ml || 1e6), 1000, 2e8);
  const genre = a.genre || 'pop';
  return {
    id: a.id || `cx${hashStr(a.name).toString(36)}`, name: String(a.name).slice(0, 40), country: (a.country || 'US').toUpperCase().slice(0, 2), genres: [genre], styles: STYLES_FOR[genre] || ['moody'],
    markets: {}, tier: tierForML(ml), real: false, custom: true, estimated: false, baseML: ml, basePop: Math.round(clamp((Math.log10(ml) - 3.8) / 0.045, 0, 100)),
  };
}
// pack: { format: 'treblr-roster-pack', version: 1, mode?: 'merge'|'replace', artists: [...], removed: [names] }
export function applyRosterPack(base, pack) {
  if (!pack || pack.format !== 'treblr-roster-pack') return base;
  const removed = new Set((pack.removed || []).map((n) => String(n).toLowerCase()));
  const custom = (pack.artists || []).filter((a) => a && a.name).map(customArtist);
  const names = new Set(custom.map((a) => a.name.toLowerCase()));
  const kept = pack.mode === 'replace' ? [] : base.filter((r) => !removed.has(r.name.toLowerCase()) && !names.has(r.name.toLowerCase()));
  const out = [...kept, ...custom];
  return out.length >= 10 ? out : base;
}
export function validateRosterPack(pack) {
  if (!pack || pack.format !== 'treblr-roster-pack' || !Array.isArray(pack.artists || [])) return 'That file isn’t a Treblr roster pack.';
  if ((pack.artists || []).length > 400) return 'Packs are limited to 400 artists.';
  return null;
}
export function mergeRosterPacks(current, incoming, mode = 'merge') {
  if (mode === 'replace') return { format: 'treblr-roster-pack', version: 1, mode: incoming.mode || 'merge', artists: incoming.artists || [], removed: incoming.removed || [] };
  const byName = new Map((current?.artists || []).map((a) => [a.name.toLowerCase(), a]));
  for (const a of incoming.artists || []) byName.set(String(a.name).toLowerCase(), { ...byName.get(String(a.name).toLowerCase()), ...a });
  const removed = Array.from(new Set([...(current?.removed || []), ...(incoming.removed || [])]));
  return { format: 'treblr-roster-pack', version: 1, mode: current?.mode || 'merge', artists: [...byName.values()], removed };
}

export { contactForRival, LABELS };

// =====================================================================================
// Award submissions: confirm (or edit) the entries your label/team suggested.
// =====================================================================================
export function confirmAwardEntries(state, { picks }) {
  return run(state, (s) => {
    const sub = s.awardSubmission;
    if (!sub || sub.status !== 'open') return fail('No award submissions are open.');
    const valid = (picks || sub.suggested).filter((id) => sub.options.some((o) => o.id === id));
    if (!valid.length) return fail('Pick at least one entry.');
    if (valid.length > 4) return fail('Four entries at most.');
    sub.picks = valid;
    sub.status = 'confirmed';
    return { msg: `Entries submitted for the ${sub.show}: ${valid.length}.` };
  });
}
