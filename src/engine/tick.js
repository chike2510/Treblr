// The weekly tick: advances the world one week. Pure: returns a new state with `lastReport`.
import { createRng } from './rng.js';
import { clone, clamp, uid, fmtMoney, fmtNum } from './util.js';
import { CERTS, CHARTS, CITIES, ROLLOUTS, VENUES, LABELS, BRANDS, AWARD_SHOWS, cityById, genreName } from './data.js';
import { playerStreams, rivalSongPotential, radioSpins, marketShares, PAY_PER_STREAM, FAN_FROM_DISC, FAN_FROM_AUD, gainHype, hypeDecay, releaseFatigue } from './model.js';
import { computeCharts } from './charts.js';
import { popularityFromListeners, makeRivalSong } from './state.js';
import { earn, spend, pushNews } from './actions.js';
import { checkGoals, staffCost, LIVING_COST } from './goals.js';
import { TIERS, npcTitle } from './npc.js';
import { pickHeadline, renderHeadline } from './headlines.js';
import { generateWeeklyGoalsFor } from './weekly.js';
import { logTimeline, pushNotif } from './journal.js';
import { openCrisis, contactForRival } from './features.js';
import { applyBurnout, resolveTourWeek, weeklyMessages, pickSpotlight, maybeDrama, crisisTick, awardNomination, awardTick, trackYear, makeWrapped } from './systems.js';

const MAIN_CHARTS = ['hot100', 'global', 'album'];

export function advanceWeek(state) {
  const s = clone(state);
  const rng = createRng(s.rng || s.seed);
  const p = s.player;
  const W = s.week;
  const before = { cash: p.cash, fans: p.fans, ml: p.monthlyListeners, pop: p.popularity, hype: p.hype };
  const prevCharts = s.charts || {};
  const flags = s.weekFlags || {};
  const events = [];
  const name = p.stageName;
  const ev = (weight, kind, vars = {}) => events.push({ weight, kind, vars: { name, ...vars } });
  if (flags.viral) ev(60, 'viral', { title: flags.viral });
  if (flags.sellout) ev(50, 'sellout', { venue: flags.sellout.venue || flags.sellout, city: flags.sellout.city || '' });
  if (flags.live) ev(40, 'live', {});

  // 0. Lingering systems that resolve before the week plays out.
  awardTick(s, rng);
  crisisTick(s, rng);

  // 1. Scheduled releases go live (with release fatigue).
  for (const rel of s.releases.slice().reverse()) {
    if (rel.status !== 'scheduled' || rel.releaseWeek > W) continue;
    rel.status = 'out';
    rel.releaseWeek = W;
    const ro = ROLLOUTS.find((r) => r.id === rel.rollout) || ROLLOUTS[1];
    const since = p.lastReleaseWeek == null ? null : W - p.lastReleaseWeek;
    const fat = releaseFatigue(since);
    rel.fatigue = fat;
    const pre = (rel.leadSingles || []).length;
    const albumBoost = rel.type === 'single' ? 1 : 1 + 0.12 * Math.min(3, pre) + 0.1 * (rel.sequencing || 0);
    rel.albumBoost = albumBoost;
    let diss = null;
    for (const id of rel.songIds) {
      const song = s.songs.find((x) => x.id === id);
      if (!song) continue;
      if ((rel.leadSingles || []).includes(id)) { song.albumBoost = Math.max(song.albumBoost || 1, 1 + 0.05 * pre); continue; }
      song.status = 'released';
      song.releasedWeek = W;
      song.rolloutMult = ro.mult;
      song.fatigue = fat;
      song.albumBoost = albumBoost;
      if (song.diss) diss = song;
    }
    gainHype(p, ro.hype * fat);
    p.lastReleaseWeek = W;
    const kind = rel.type === 'single' ? 'single' : rel.type === 'ep' ? 'EP' : 'album';
    pushNews(s, `${name} releases new ${kind} “${rel.title}”`, true, 'Release');
    logTimeline(s, 'release', `Released the ${kind} “${rel.title}”`, fat < 1 ? `Released ${since} week${since === 1 ? '' : 's'} after the last drop — fans felt the fatigue` : ro.name);
    ev(45, rel.type === 'single' ? 'release' : 'album', { title: rel.title, kind });
    if (diss) {
      const r = s.rivals.find((x) => x.id === diss.diss);
      gainHype(p, 10);
      if (r) {
        ev(70, 'beef', { rival: r.name });
        pushNews(s, `${name}\u2019s diss track “${diss.title}” takes aim at ${r.name}`, true, 'Beef');
        if (rng.chance(0.3)) openCrisis(s, 'beef', `Diss track backlash`, `“${diss.title}” went too personal for a lot of listeners. ${r.name}\u2019s fans are furious.`);
      }
    }
    if (rel.songIds.some((id) => s.songs.find((x) => x.id === id)?.feat)) {
      const f = s.songs.find((x) => rel.songIds.includes(x.id) && x.feat);
      ev(58, 'collab', { rival: f.featName });
    }
  }

  // 2. Player streams & revenue.
  let totalStreams = 0;
  let streamRevenue = 0;
  let topSong = null;
  let fanStreams = 0;
  const songStreams = {};
  const model = playerStreams(p, s.songs, W);
  for (const song of s.songs) {
    if (song.status !== 'released') continue;
    const age = W - song.releasedWeek;
    const m = model[song.id];
    const noise = rng.float(0.9, 1.1);
    const streams = Math.round(m.total * noise);
    fanStreams += (m.discovery * FAN_FROM_DISC * (song.quality / 60) + m.audience * FAN_FROM_AUD) * noise;
    song.weeklyStreams = streams;
    song.lifetimeStreams += streams;
    songStreams[song.id] = streams;
    song.history = [...(song.history || []), streams].slice(-26);
    totalStreams += streams;
    const share = (p.label ? p.label.royalty : 1) * (1 - (song.cowriterShare || 0));
    streamRevenue += streams * PAY_PER_STREAM * share;
    if (!topSong || streams > topSong.weeklyStreams) topSong = song;
    song.viral = song.viral > 1.02 ? 1 + (song.viral - 1) * 0.6 : 1;
    if (song.playlists && age > 10 && rng.chance(0.2)) song.playlists -= 1;
    song.radio = radioSpins(p.popularity, song.quality, age, { label: !!p.label, payola: (song.payola || 0) + (song.radioBoost || 0) });
    song.payola = (song.payola || 0) * 0.6;
    song.radioBoost = (song.radioBoost || 0) * 0.7;
    for (const c of CERTS) {
      if (song.lifetimeStreams >= c.streams) {
        const rankOld = CERTS.findIndex((x) => x.id === song.cert);
        const rankNew = CERTS.findIndex((x) => x.id === c.id);
        if (song.cert == null || rankNew < rankOld) {
          song.cert = c.id;
          pushNews(s, `“${song.title}” by ${name} is certified ${c.name}`, true, 'Certified');
          logTimeline(s, 'cert', `“${song.title}” certified ${c.name}`, fmtNum(song.lifetimeStreams) + ' streams');
          ev(65, 'cert', { title: song.title, cert: c.name });
        }
        break;
      }
    }
  }
  p.lifetimeStreams = (p.lifetimeStreams || 0) + totalStreams;
  trackYear(s, totalStreams, songStreams);
  const mgr = p.staff.manager ? 1.1 : 1;
  if (streamRevenue > 0) earn(s, 'streams', streamRevenue * mgr, 'Streaming royalties');

  // Videos & merch.
  let videoRev = 0;
  for (const v of s.social.videos) {
    v.views += v.weekly;
    v.likes = Math.round(v.views * 0.035);
    videoRev += v.weekly * 0.0018;
    p.followers.viewtube += Math.round(v.weekly * 0.002);
    const song = s.songs.find((x) => x.id === v.songId);
    if (song) song.videoViews = v.views;
    v.weekly = Math.round(v.weekly * 0.82);
  }
  if (videoRev >= 1) earn(s, 'video', videoRev, 'TreblrTube ad revenue');
  if (s.merch?.active) {
    const sold = Math.min(s.merch.stock, Math.round((p.fans * 0.004 + p.hype * 2) * rng.float(0.7, 1.3)));
    s.merch.stock -= sold;
    s.merch.sold += sold;
    if (sold) earn(s, 'merch', sold * s.merch.price, `Merch sales (${sold} units)`);
    if (s.merch.stock <= 0) { s.merch.active = false; pushNews(s, `${name}'s merch drop sells out`, true, 'Business'); }
  }

  // 3. Tour stops this week.
  const tourResult = resolveTourWeek(s, rng, ev);

  // 4. Rivals: real popularity drifts back towards its baseline, bumps on releases.
  const rivalById = {};
  for (const r of s.rivals) {
    rivalById[r.id] = r;
    r.monthlyListeners = Math.round((r.monthlyListeners * 0.92 + r.baseML * 0.08) * rng.float(0.98, 1.025));
    const since = W - r.lastReleaseWeek;
    const cad = TIERS[r.tier]?.cadence || 0.01;
    if (since >= 3 && rng.chance(0.01 + since * cad)) {
      const album = rng.chance(TIERS[r.tier]?.album || 0.15) && since > 10;
      const n = album ? rng.int(2, 3) : 1;
      let first = null;
      for (let i = 0; i < n; i++) {
        const song = makeRivalSong(s, rng, r, W);
        s.rivalSongs.push(song);
        first = first || song;
      }
      r.lastReleaseWeek = W;
      r.monthlyListeners = Math.round(r.monthlyListeners * (album ? 1.12 : 1.06));
      if (album) {
        s.nextId += 1;
        const title = npcTitle(rng, r);
        s.rivalAlbums.push({ id: `ra${s.nextId}`, rivalId: r.id, title, releasedWeek: W, cover: { gradient: rng.int(0, 7) } });
        r.lastMove = `Released the album “${title}”`;
        if (r.tier !== 'rising') pushNews(s, `${r.name} unveils new album “${title}”`, false, 'Albums');
      } else {
        r.lastMove = `Dropped “${first.title}”`;
        if (r.tier === 'superstar' || rng.chance(0.2)) pushNews(s, `${r.name} releases “${first.title}”`, false, genreName(r.genre));
      }
    } else if (rng.chance(0.25)) {
      r.lastMove = rng.pick([`On tour in ${rng.pick(CITIES).name}`, 'Teasing new music', 'Spotted in the studio', `Headlining a festival in ${rng.pick(CITIES).name}`, 'Trending after a talk-show slot', 'Signed a sneaker deal', 'Went quiet on socials', 'Posted studio clips', 'Shot a music video']);
    }
  }
  const rivalPull = {};
  for (const song of s.rivalSongs) {
    const r = rivalById[song.rivalId];
    if (!r) continue;
    rivalPull[r.id] = (rivalPull[r.id] || 0) + rivalSongPotential(r, song, W - song.releasedWeek) / (r.monthlyListeners * 0.5);
  }
  for (const song of s.rivalSongs) {
    const r = rivalById[song.rivalId];
    if (!r) continue;
    const age = W - song.releasedWeek;
    // A catalogue shares its audience: more songs out = less per song (sqrt sharing).
    song.weeklyStreams = Math.round(rivalSongPotential(r, song, age) / Math.sqrt(Math.max(1, rivalPull[r.id])) * rng.float(0.9, 1.1));
    song.lifetimeStreams += song.weeklyStreams;
    song.radio = radioSpins(popularityFromListeners(r.monthlyListeners) * 0.85, song.quality, age, { label: true });
  }
  s.rivalSongs = s.rivalSongs.filter((x) => W - x.releasedWeek < 40);
  s.rivalAlbums = s.rivalAlbums.filter((x) => W - x.releasedWeek < 60);

  // 5. Fans, listeners, popularity, hype.
  const newFans = Math.round(fanStreams * fanSaturation(p.fans));
  const recentRelease = s.releases.some((r) => r.status === 'out' && W - r.releaseWeek < 8);
  const churn = Math.round(p.fans * (recentRelease ? 0.002 : 0.006));
  p.fans = Math.max(0, p.fans + newFans - churn);
  distributeFans(p, newFans);
  p.monthlyListeners = Math.round(p.monthlyListeners * 0.55 + (totalStreams * 0.75 + p.fans * 0.25) * 0.45);
  p.popularity = popularityFromListeners(p.monthlyListeners);
  p.hype = clamp(hypeDecay(p.hype, p.staff.publicist), 0, 100);
  p.followers.chirp += Math.round(newFans * 0.3);
  p.followers.snapshot += Math.round(newFans * 0.35);
  p.followers.clipz += Math.round(newFans * 0.25);

  // 6. Expenses.
  const city = cityById(p.city);
  spend(s, 'rent', city.rent / 4, `Rent — ${city.name}`);
  spend(s, 'living', LIVING_COST, 'Living costs');
  const sc = staffCost(s);
  if (sc) spend(s, 'staff', sc, 'Team salaries');

  // 7. Charts.
  s.charts = computeCharts(s, prevCharts);
  const chartMoves = [];
  let charting = false;
  for (const ch of CHARTS) {
    for (const e of s.charts[ch.id]) {
      if (!e.pl) continue;
      charting = true;
      const song = ch.kind === 'albums' ? s.releases.find((r) => r.id === e.id) : s.songs.find((x) => x.id === e.id);
      if (!song) continue;
      song.peaks = song.peaks || {};
      const firstTime = song.peaks[ch.id] == null;
      const newPeak = !firstTime && e.r < song.peaks[ch.id];
      song.peaks[ch.id] = Math.min(song.peaks[ch.id] ?? 999, e.r);
      chartMoves.push({ chartId: ch.id, chart: ch.short || ch.name, title: song.title, r: e.r, p: e.p, firstTime });
      if (firstTime) p.chartEntries = (p.chartEntries || 0) + 1;
      const vars = { title: song.title, rank: e.r, chart: ch.name };
      if (MAIN_CHARTS.includes(ch.id)) {
        const wasBest = p.bestRank;
        p.bestRank = p.bestRank == null ? e.r : Math.min(p.bestRank, e.r);
        s.yearStats.bestPeak = s.yearStats.bestPeak == null ? e.r : Math.min(s.yearStats.bestPeak, e.r);
        if (e.r === 1 && e.p !== 1) {
          pushNews(s, `${name}'s “${song.title}” is #1 on the ${ch.name}`, true, 'Charts');
          logTimeline(s, 'chart', `#1 on the ${ch.name}`, `“${song.title}”`);
          ev(100, 'no1', vars);
        } else if (firstTime) {
          pushNews(s, `“${song.title}” debuts at #${e.r} on the ${ch.name}`, true, 'Charts');
          if (wasBest == null || e.r < wasBest) logTimeline(s, 'chart', `Debuted at #${e.r} on the ${ch.name}`, `“${song.title}”`);
          ev(e.r <= 10 ? 85 : 66, e.r <= 10 ? 'debutTop10' : 'debut', vars);
        } else if (e.r <= 10 && (e.p == null || e.p > 10)) {
          logTimeline(s, 'chart', `Top 10 on the ${ch.name}`, `“${song.title}” · #${e.r}`);
          ev(80, 'top10', vars);
        } else if (newPeak && e.p != null && e.p - e.r >= 10) {
          ev(44, 'climb', vars);
        }
      } else if (firstTime) {
        events.push({ weight: 30, kind: 'event', vars: { text: `“${song.title}” enters the ${ch.name} chart at #${e.r}` } });
      }
    }
  }
  p.chartStreak = charting ? (p.chartStreak || 0) + 1 : 0;
  p.bestStreak = Math.max(p.bestStreak || 0, p.chartStreak);
  if (chartMoves.some((m) => m.firstTime)) pushNotif(s, 'chart', `New chart entry: ${chartMoves.find((m) => m.firstTime).title} #${chartMoves.find((m) => m.firstTime).r} ${chartMoves.find((m) => m.firstTime).chart}`, { tab: 'charts' });
  const no1 = s.charts.hot100?.[0];
  if (no1 && !no1.pl) {
    const rs = s.rivalSongs.find((x) => x.id === no1.id);
    const r = rs && rivalById[rs.rivalId];
    if (r) pushNews(s, no1.p === 1 ? `${r.name}'s “${rs.title}” holds #1 for week ${no1.w}` : `${r.name} takes #1 on the Hot 100 with “${rs.title}”`, false, 'Charts');
  }

  // 8. Spotlight, drama, messages, random events, awards.
  if (!s.spotlight || s.spotlight.resolved || W - s.spotlight.week >= 2) s.spotlight = pickSpotlight(s, rng, prevCharts) || (s.spotlight && !s.spotlight.resolved && W - s.spotlight.week < 2 ? s.spotlight : null);
  maybeDrama(s, rng);
  weeklyMessages(s, rng);
  randomEvent(s, rng, events);
  const yw = ((W - 1) % 52) + 1;
  const show = AWARD_SHOWS.find((a) => a.week === yw);
  if (show) {
    const a = awardNomination(s, rng, show, rivalById);
    if (a) events.push({ weight: 50, kind: 'event', vars: { text: `${name} Nominated for ${a.category} at the ${a.show}` } });
  }

  // 9. Offers.
  for (const m of s.inbox) if (m.type === 'offer' && !m.status && m.expires <= W) m.status = 'expired';
  generateOffers(s, rng);
  s.inbox = s.inbox.slice(0, 80);

  // 10. Industry filler news.
  if (rng.chance(0.6)) {
    pushNews(s, rng.pick([
      `${rng.pick(CITIES).name} festival announces its ${2027 + Math.floor(W / 52)} lineup`,
      `Streaming numbers hit a record high in ${rng.pick(['Brazil', 'India', 'Mexico', 'Nigeria', 'Germany', 'Japan', 'South Korea', 'the UK', 'Indonesia', 'France'])}`,
      `${genreName(rng.pick(['pop', 'latin', 'kpop', 'afrobeats', 'country', 'electronic', 'hiphop', 'indie']))} is the fastest-growing genre this quarter`,
      `Vinyl sales climb for the ${rng.int(15, 20)}th straight year`,
      `Major labels bet big on ${rng.pick(['short-form video', 'AI mastering', 'superfan subscriptions', 'stadium residencies'])}`,
    ]), false, 'Industry');
  }

  // 11. Goals, Wrapped & report.
  const newGoals = checkGoals(s);
  for (const g of newGoals) ev(35, 'goal', { title: g.name });
  let wrapped = null;
  if (W % 52 === 0) wrapped = makeWrapped(s, W);
  events.sort((a, b) => b.weight - a.weight);
  const totalFmt = fmtNum(totalStreams);
  const headline = events[0]
    ? pickHeadline(s, rng, events[0].kind, events[0].vars)
    : pickHeadline(s, rng, totalStreams > 0 ? 'streams' : 'quiet', { name, n: totalFmt });
  const eventTexts = events.map((e, i) => (i === 0 ? headline : renderHeadline(rng, e.kind, e.vars)));
  const report = {
    week: W,
    headline,
    events: eventTexts,
    streams: totalStreams,
    income: { ...s.ledger.income },
    expense: { ...s.ledger.expense },
    cashBefore: before.cash,
    cashAfter: p.cash,
    net: p.cash - before.cash,
    fans: p.fans,
    fansDelta: p.fans - before.fans,
    ml: p.monthlyListeners,
    mlDelta: p.monthlyListeners - before.ml,
    popDelta: p.popularity - before.pop,
    chartMoves: chartMoves.sort((a, b) => a.r - b.r),
    news: s.news.filter((n) => n.week === W).slice(0, 8),
    topSong: topSong ? { title: topSong.title, streams: topSong.weeklyStreams } : null,
    goals: newGoals.map((g) => g.name),
    tour: tourResult,
    wrapped: wrapped ? wrapped.year : null,
    streak: p.chartStreak,
    burnout: 0,
  };

  // 12. Next week.
  s.week = W + 1;
  applyBurnout(p);
  report.burnout = p.burnout;
  s.history = [...s.history, report].slice(-52);
  s.lastReport = report;
  const reserve = s.tour ? s.tour.reserve : 0;
  p.energy = clamp(p.maxEnergy - (p.energyPenalty || 0) - reserve, 0, p.maxEnergy);
  p.energyPenalty = 0;
  p.socialEnergy = p.maxSocial;
  p.rested = false;
  s.weekFlags = {};
  s.weekStats = {};
  s.ledger = { income: {}, expense: {} };
  s.weekly = generateWeeklyGoalsFor(s, rng);
  s.rng = rng.state();
  return s;
}

export function fanSaturation(fans) {
  return Math.max(0.05, 1 - fans / 400_000_000);
}

function distributeFans(p, n) {
  if (n <= 0) return;
  const home = Math.round(n * 0.45);
  p.fanHeat[p.city] = (p.fanHeat[p.city] || 0) + home;
  const sh = marketShares(p.genre, p.country);
  const weights = CITIES.map((c) => (sh[c.country] ?? 0.008) / CITIES.filter((x) => x.country === c.country).length);
  const total = weights.reduce((a, b) => a + b, 0);
  CITIES.forEach((c, i) => {
    const add = Math.round(((n - home) * weights[i]) / total);
    if (add > 0) p.fanHeat[c.id] = (p.fanHeat[c.id] || 0) + add;
  });
}

function randomEvent(s, rng, events) {
  const p = s.player;
  const add = (text) => { events.push({ weight: 30, kind: 'event', vars: { text } }); pushNews(s, text, true, 'Life'); };
  if (p.suspicion > 45 && rng.chance((p.suspicion - 40) / 140)) {
    const loss = Math.round(p.fans * 0.08);
    p.fans -= loss;
    gainHype(p, -25);
    p.suspicion = 15;
    for (const x of s.songs) x.payola = 0;
    s.crisis = null;
    openCrisis(s, 'payola', `Payola probe: stations drop ${p.stageName}`, 'A pay-for-play report has radio programmers running. Fans want answers.');
    events.push({ weight: 90, kind: 'scandal', vars: { name: p.stageName } });
    return;
  }
  p.suspicion = clamp(p.suspicion - 2, 0, 100);
  if (!rng.chance(0.3)) return;
  const released = s.songs.filter((x) => x.status === 'released');
  const options = [
    () => { if (p.cash < 300) return null; spend(s, 'other', 300, 'Laptop repair'); return 'Laptop crashed mid-session — $300 repair'; },
    () => { const f = Math.round(20 + Math.min(4000, p.fans * 0.02)); p.fans += f; gainHype(p, 4); return `Fan meetup goes viral: +${fmtNum(f)} fans`; },
    () => { if (!released.length) return null; const so = rng.pick(released); so.viral = Math.max(so.viral, 1.8); return `A mega-influencer shares “${so.title}”`; },
    () => { p.energyPenalty = 25; return 'Food poisoning — you start next week drained'; },
    () => { gainHype(p, 5); p.skills.charisma = clamp(p.skills.charisma + 0.5, 0, 100); return 'Invited to an industry party — new connections made'; },
    () => { if (p.popularity < 15) return null; gainHype(p, -8); return `Rumour mill: blogs question ${p.stageName}'s authenticity`; },
    () => { const g = Math.round(30 + Math.min(2500, p.fans * 0.008)); p.fans += g; return `An old demo leaks and fans love it: +${fmtNum(g)} fans`; },
    () => { earn(s, 'other', 250, 'Sync licence (indie film)'); return 'An indie film licenses your music for $250'; },
  ];
  for (let i = 0; i < 4; i++) {
    const text = rng.pick(options)();
    if (text) { add(text); return; }
  }
}

function generateOffers(s, rng) {
  const p = s.player;
  const W = s.week;
  const mgrBoost = p.staff.manager ? 1.2 : 1;
  const active = s.inbox.filter((m) => m.type === 'offer' && !m.status);
  const activeFrom = new Set(active.map((m) => m.from));
  const add = (subtype, from, subject, body, payload, weeks = 2) => {
    if (activeFrom.has(from)) return false;
    activeFrom.add(from);
    s.inbox.unshift({ id: uid(s, 'm'), type: 'offer', subtype, from, subject, body, payload, week: W, expires: W + weeks, read: false });
    pushNotif(s, 'offer', `${from}: ${subject}`, { tab: 'phone', app: 'inbox' });
    return true;
  };
  if (p.fans >= 1500 && rng.chance((0.16 + p.popularity / 260) * mgrBoost)) {
    const recent = s.brandHistory || {};
    const brands = BRANDS.filter((b) => !activeFrom.has(b) && !(recent[b] != null && W - recent[b] < 10));
    if (brands.length) {
      const brand = rng.pick(brands);
      const cash = Math.round((p.fans * 0.1 + p.popularity * 55 + 300) * mgrBoost * rng.float(0.8, 1.3));
      add('brand', brand, `${brand} wants you for a campaign`, `${brand} would like one sponsored post and a short ad spot. Fee: ${fmtMoney(cash)}. Costs 10 energy.`, { brand, cash, energy: 10 });
    }
  }
  if (p.fans >= 2000 && rng.chance((0.08 + p.popularity / 350) * mgrBoost)) {
    const ml = p.monthlyListeners * 4 + 300000;
    const near = s.rivals.slice().sort((a, b) => Math.abs(Math.log10(a.monthlyListeners) - Math.log10(ml)) - Math.abs(Math.log10(b.monthlyListeners) - Math.log10(ml))).slice(0, 8);
    const r = rng.pick(near);
    const cash = Math.round(Math.min(150000, r.monthlyListeners * 0.0004) * rng.float(0.7, 1.2) + 200);
    const fans = Math.round(Math.min(r.monthlyListeners * 0.002, 200000) * rng.float(0.4, 1));
    if (add('feature', r.name, `${r.name} wants a feature`, `${r.name} (${genreName(r.genre)}) wants a verse on their next single. Fee ${fmtMoney(cash)}, exposure to their audience (~+${fmtNum(fans)} fans). Costs 20 energy.`, { artist: r.name, rivalId: r.id, cash, fans, energy: 20 }, 3)) contactForRival(s, r.id);
  }
  if (rng.chance(0.3 + (p.staff.booking ? 0.25 : 0))) {
    const heat = Object.entries(p.fanHeat).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const cityId = heat.length ? rng.pick(heat)[0] : p.city;
    const venue = [...VENUES].reverse().find((v) => p.fans >= v.minFans) || VENUES[0];
    const cash = Math.round(venue.capacity * venue.ticket * 0.5 * (p.staff.booking ? 1.2 : 1) * rng.float(0.8, 1.2));
    const fans = Math.round(venue.capacity * rng.float(0.04, 0.1));
    const c = cityById(cityId);
    add('gig', `${c.name} promoter`, `Gig offer: ${venue.name} in ${c.name}`, `Guaranteed fee ${fmtMoney(cash)} to play a ${venue.name.toLowerCase()} in ${c.flag} ${c.name}. Costs ${venue.energy} energy.`, { venue: `${venue.name}, ${c.name}`, city: cityId, cash, fans, energy: venue.energy });
  }
  if (!p.label && rng.chance(0.12 * mgrBoost)) {
    const eligible = LABELS.filter((l) => p.popularity >= l.minPop - 5);
    if (eligible.length) {
      const l = eligible[eligible.length - 1];
      const advance = Math.round(l.advance * rng.float(0.8, 1.2));
      add('label', l.name, `${l.name} (${l.tier}) wants to sign you`, `Advance ${fmtMoney(advance)}. You keep ${Math.round(l.royalty * 100)}% of streaming income and get more radio and playlist reach.`, { labelId: l.id, label: l.name, advance, royalty: l.royalty }, 3);
    }
  }
  if (p.fans > 100 && rng.chance(0.35)) {
    const songs = s.songs.filter((x) => x.status === 'released');
    const nm = rng.pick(['Maya', 'Leo', 'Aiko', 'Chidi', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Hye-jin', 'Amelia', 'Kwame', 'Lucas']);
    const city = rng.pick(CITIES);
    const text = songs.length
      ? `“${rng.pick(songs).title}” got me through a rough month. Please come to ${city.name} someday!`
      : 'Saw your clip and I already know you\u2019re going to be huge. Drop something soon!';
    s.inbox.unshift({ id: uid(s, 'm'), type: 'fanmail', from: `${nm} · ${city.flag} ${city.name}`, subject: 'Fan mail', body: text, week: W, read: false });
  }
}
