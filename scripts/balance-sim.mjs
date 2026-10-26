// Headless balance simulation: 3 strategies x 3 seeds over 104 weeks.
// Usage: node scripts/balance-sim.mjs [weeks]
import * as E from '../src/engine/index.js';

const SETUP = { firstName: 'Sim', lastName: 'Player', stageName: 'SIM', city: 'tor', age: 21, genre: 'pop', subgenres: [], path: 'bedroom' };

function tryAct(s, fn, payload) { const r = fn(s, payload); return r.ok ? r.state : s; }
const bestProducer = (s, reserve) => [...E.PRODUCERS].reverse().find((p) => E.producerPrice(s, p) + reserve <= s.player.cash) || E.PRODUCERS[0];
const bestCowriter = (s, reserve) => [...E.COWRITERS].reverse().find((c) => c.fee + reserve <= s.player.cash * 0.25) || E.COWRITERS[0];

function bestGig(s) {
  const p = s.player;
  const cities = Object.entries(p.fanHeat).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
  let best = null;
  for (const v of E.VENUES) {
    if (p.fans < v.minFans || p.energy < v.energy) continue;
    for (const c of cities) {
      const travel = c === p.city ? 0 : 150 + v.capacity * 0.6;
      if (travel > p.cash * 0.3) continue;
      const est = Math.min(v.capacity, E.gigDemand(s, c) * E.gigFatigue(s, c, v.id)) * v.ticket - travel;
      if (!best || est > best.est) best = { venueId: v.id, cityId: c, est };
    }
  }
  return best;
}

function weekly(s, strat, rng) {
  const p = () => s.player;
  const weekly = E.weeklyCost ? 0 : 0; void weekly;
  const reserve = E.weeklyExpenses(s) * 3;
  const recorded = () => s.songs.filter((x) => x.status === 'recorded').sort((a, b) => b.quality - a.quality);
  const written = () => s.songs.filter((x) => x.status === 'written').sort((a, b) => b.writeQuality - a.writeQuality);
  const since = p().lastReleaseWeek == null ? 99 : s.week - p().lastReleaseWeek;
  const release = (rollout) => { const r = recorded()[0]; if (r) s = tryAct(s, E.releaseMusic, { type: 'single', songIds: [r.id], rollout }); };
  if (strat === 'spam') {
    s = tryAct(s, E.writeSong, { title: `Song ${s.week}`, genre: 'pop', theme: 'Love', length: 180, cowriter: 'none' });
    const w = written()[0]; if (w) s = tryAct(s, E.recordSong, { songId: w.id, producerId: s.player.cash > 1200 ? 'local' : 'self' });
    release(s.player.cash > 600 ? 'standard' : 'drop');
    const g = bestGig(s); if (g) s = tryAct(s, E.playGig, g);
    s = tryAct(s, E.doJob, { jobId: 'barista' });
    if (s.player.energy < 25) s = tryAct(s, E.rest);
    s = tryAct(s, E.postChirp, { text: 'new music out now' });
  } else if (strat === 'paced') {
    const cadence = 4;
    const tired = p().burnout > 20;
    if (tired) s = tryAct(s, E.rest);
    if (since >= cadence && recorded().length) {
      release(p().cash > 2500 + reserve ? 'campaign' : 'standard');
      const sid = s.songs.find((x) => x.status === 'scheduled')?.id;
      if (sid) { s = tryAct(s, E.promoteClip, { songId: sid }); }
    }
    const pipe = recorded().length + written().length;
    if (pipe < 2) s = tryAct(s, E.writeSong, { title: `Song ${s.week}`, genre: 'pop', theme: 'Love', length: 185, cowriter: bestCowriter(s, reserve).id });
    const w = written()[0];
    if (w && recorded().length < 2) s = tryAct(s, E.recordSong, { songId: w.id, producerId: bestProducer(s, reserve).id });
    if (s.player.cash > reserve && !tired) s = tryAct(s, E.trainSkill, { skill: s.player.skills.songwriting <= s.player.skills.vocals + 10 ? 'songwriting' : 'vocals' });
    const g = bestGig(s); if (g && g.est > 0 && (!tired || s.player.energy > 45)) s = tryAct(s, E.playGig, g);
    if (s.player.cash < reserve && s.player.energy > 40) s = tryAct(s, E.doJob, { jobId: s.player.skills.songwriting >= 45 ? 'ghost' : 'teacher' });
    const rel = s.songs.find((x) => x.status === 'released' && s.week - x.releasedWeek < 6);
    if (rel && s.player.cash > 200) s = tryAct(s, E.pitchPlaylist, { songId: rel.id });
    s = tryAct(s, E.postChirp, { text: 'studio day' });
    s = tryAct(s, E.goLive, { platform: 'treblrtok' });
    for (const g2 of E.weeklyGoalsView(s)) if (g2.done && !g2.claimed) s = tryAct(s, E.claimWeeklyGoal, { id: g2.id });
    if (!s.player.staff.manager && s.player.cash > 15000) s = tryAct(s, E.setStaff, { role: 'manager', hire: true });
    for (const m of s.inbox) if (m.type === 'offer' && !m.status && ['brand', 'gig'].includes(m.subtype)) s = tryAct(s, E.respondOffer, { id: m.id, accept: true });
  } else {
    // casual
    if (s.week % 2 === 0) s = tryAct(s, E.writeSong, { title: `Song ${s.week}`, genre: 'pop', theme: 'Love', length: 200, cowriter: 'none' });
    const w = written()[0]; if (w && s.week % 2 === 1) s = tryAct(s, E.recordSong, { songId: w.id, producerId: s.player.cash > 2000 ? 'local' : 'self' });
    if (since >= 7) release('standard');
    s = tryAct(s, E.doJob, { jobId: 'barista' });
    if (s.week % 3 === 0) { const g = bestGig(s); if (g) s = tryAct(s, E.playGig, g); }
  }
  if (s.awardEvent?.status === 'pending') s = tryAct(s, E.attendAwardShow, { outfit: 'classic', perform: false });
  if (s.awardEvent?.status === 'won') s = tryAct(s, E.giveSpeech, { style: 'fans' });
  if (s.crisis) s = tryAct(s, E.handleCrisis, { choice: 'apologise' });
  void rng;
  return s;
}

export function runSim(strat, seed, weeks = 104) {
  let s = E.createNewGame(SETUP, seed);
  const out = { strat, seed, firstHot100: null, firstTop10: null, firstNo1: null, best: null, ml52: 0, ml104: 0, q60: null, qMax: 0, hypeAvg: 0, burnoutMax: 0, energyEnd: [], cash: 0, fans: 0, nan: false, releases: 0, actionsPerWeek: 0 };
  let hypeSum = 0;
  for (let w = 1; w <= weeks; w++) {
    const e0 = s.player.energy;
    s = weekly(s, strat, null);
    out.energyEnd.push(e0 - s.player.energy);
    s = E.advanceWeek(s);
    const hot = s.charts.hot100.filter((e) => e.pl);
    if (hot.length) {
      const r = Math.min(...hot.map((e) => e.r));
      if (out.firstHot100 == null) out.firstHot100 = w;
      if (r <= 10 && out.firstTop10 == null) out.firstTop10 = w;
      if (r === 1 && out.firstNo1 == null) out.firstNo1 = w;
      out.best = out.best == null ? r : Math.min(out.best, r);
    }
    hypeSum += s.player.hype;
    out.burnoutMax = Math.max(out.burnoutMax, s.player.burnout);
    if (w === 52) out.ml52 = s.player.monthlyListeners;
    if (w === 60) { const rec = s.songs.filter((x) => x.status !== 'written').slice(0, 5); out.q60 = rec.length ? Math.round(rec.reduce((a, x) => a + x.quality, 0) / rec.length) : null; }
    const p = s.player;
    for (const v of [p.cash, p.fans, p.monthlyListeners, p.hype, p.popularity, p.energy, p.burnout, ...Object.values(p.skills)]) if (!Number.isFinite(v)) out.nan = true;
  }
  out.ml104 = s.player.monthlyListeners;
  out.qMax = Math.max(0, ...s.songs.map((x) => x.quality));
  out.hypeAvg = Math.round(hypeSum / weeks);
  out.cash = s.player.cash;
  out.fans = s.player.fans;
  out.releases = s.releases.filter((r) => r.status === 'out').length;
  out.avgEnergyUsed = Math.round(out.energyEnd.reduce((a, b) => a + b, 0) / weeks);
  delete out.energyEnd;
  out.state = s;
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const weeks = +(process.argv[2] || 104);
  const rows = [];
  for (const strat of ['paced', 'spam', 'casual']) for (const seed of [11, 22, 33]) {
    const r = runSim(strat, seed, weeks); delete r.state; rows.push(r);
  }
  console.table(rows.map((r) => ({ strat: r.strat, seed: r.seed, hot100: r.firstHot100, top10: r.firstTop10, no1: r.firstNo1, best: r.best, ml52: E.fmtNum(r.ml52), ml104: E.fmtNum(r.ml104), q60: r.q60, qMax: r.qMax, hype: r.hypeAvg, burnMax: r.burnoutMax, energy: r.avgEnergyUsed, rel: r.releases, fans: E.fmtNum(r.fans), cash: E.fmtMoney(r.cash), nan: r.nan })));
}
