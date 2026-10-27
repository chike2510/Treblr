// The weekly tick: advances the world one week. Pure: returns a new state with `lastReport`.
import { createRng } from './rng.js';
import { clone, clamp, uid, fmtMoney, fmtNum } from './util.js';
import { CHARTS, CITIES, ROLLOUTS, VENUES, LABELS, BRANDS, AWARD_SHOWS, cityById, genreName, venueUnlocked } from './data.js';
import { playerStreams, rivalSongPotential, radioSpins, marketShares, NPC_STREAM_K, PAY_PER_STREAM, FAN_FROM_DISC, FAN_FROM_AUD, FAN_HALF, gainHype, hypeDecay, releaseFatigue } from './model.js';
import { computeCharts } from './charts.js';
import { popularityFromListeners, makeRivalSong } from './state.js';
import { earn, spend, pushNews } from './actions.js';
import { checkGoals, staffCost, LIVING_COST, housingCost } from './goals.js';
import { TIERS, npcTitle } from './npc.js';
import { pickHeadline, renderHeadline } from './headlines.js';
import { generateWeeklyGoalsFor } from './weekly.js';
import { logTimeline, pushNotif } from './journal.js';
import { openCrisis, contactForRival } from './features.js';
import { applyBurnout, resolveTourWeek, weeklyMessages, pickSpotlight, maybeDrama, crisisTick, awardNomination, openAwardSubmissions, awardTick, trackYear, makeWrapped } from './systems.js';
import { updateFame, releaseReception, receptionLabel, certifySong, albumWeek, npcReleaseTick, chartStarPoints, trackChartRuns, npcChartPosts, statPost, addStarPoints, uniqueRivalTitle } from './career.js';
import { labelRoyalty, labelReach, contractTick, deliverAlbum, distributionTick, lifestyleUpkeep, actingTick, festivalTick, payolaExposure, bankTick, cloudTick, labelTerms, dealText, rivalLabelId } from './business.js';
import { placeOnPlaylist } from './actions.js';
import { FAME_TIERS } from './data2.js';

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
    const fresh = rel.songIds.map((id) => s.songs.find((x) => x.id === id)).filter((x) => x && !(rel.leadSingles || []).includes(x.id));
    const reception = releaseReception(s, rng, fresh.length ? fresh : [{ quality: 50 }]);
    rel.reception = reception;
    const preHype = rel.preHype || 0;
    for (const id of rel.songIds) {
      const song = s.songs.find((x) => x.id === id);
      if (!song) continue;
      if ((rel.leadSingles || []).includes(id)) { song.albumBoost = Math.max(song.albumBoost || 1, 1 + 0.05 * pre); continue; }
      song.status = 'released';
      song.releasedWeek = W;
      song.rolloutMult = ro.mult * (1 + preHype) * (p.label ? Math.sqrt(labelReach(s)) : 1);
      song.fatigue = fat;
      song.albumBoost = albumBoost;
      // tracks on one release share the verdict, with a little spread
      song.reception = Math.round(reception * rng.float(0.88, 1.12) * 100) / 100;
      if (song.leaked) song.reception = Math.round(song.reception * 0.9 * 100) / 100;
      if (song.prePitch) {
        song.prePitch = false;
        if (rng.chance(Math.min(0.9, 0.2 + song.quality / 180 + p.popularity / 250 + (p.label ? 0.12 : 0)))) {
          const nm = placeOnPlaylist(song, rng);
          pushNotif(s, 'chart', `Editors added “${song.title}” to ${nm} on release day`, { tab: 'phone', app: 'treblify' });
        }
      }
      if (song.diss) diss = song;
    }
    gainHype(p, ro.hype * fat * (0.7 + reception * 0.3));
    if (rel.type === 'album') deliverAlbum(s);
    if (rel.type !== 'single') rel.review = reviewRelease(s, rng, rel, fresh);
    if (reception < 0.65) pushNews(s, `${name}\u2019s “${rel.title}” lands with a thud`, true, 'Release');
    else if (reception >= 1.45) pushNews(s, `Listeners can\u2019t stop replaying ${name}\u2019s “${rel.title}”`, true, 'Release');
    p.lastReleaseWeek = W;
    const kind = rel.type === 'single' ? 'single' : rel.type === 'ep' ? 'EP' : 'album';
    pushNews(s, `${name} releases new ${kind} “${rel.title}”`, true, 'Release');
    logTimeline(s, 'release', `Released the ${kind} “${rel.title}”`, `${receptionLabel(reception)}${fat < 1 ? ` · released ${since} week${since === 1 ? '' : 's'} after the last drop` : ''}${rel.review ? ` · Treblrfork ${rel.review.score.toFixed(1)}` : ''}`);
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
  let salesRevenue = 0;
  const songStreams = {};
  const model = playerStreams(p, s.songs, W);
  for (const song of s.songs) {
    if (song.status !== 'released') continue;
    const age = W - song.releasedWeek;
    const m = model[song.id];
    const noise = rng.float(0.9, 1.1);
    const extra = (song.boughtStreams?.length ? song.boughtStreams.shift() : 0) + (song.adStreams?.length ? song.adStreams.shift() : 0);
    const streams = Math.round(m.total * noise + extra);
    if (age === 0) song.firstWeekStreams = streams;
    fanStreams += (m.discovery * FAN_FROM_DISC * (song.quality / 60) + m.audience * FAN_FROM_AUD) * noise;
    song.weeklyStreams = streams;
    song.lifetimeStreams += streams;
    songStreams[song.id] = streams;
    song.history = [...(song.history || []), streams].slice(-26);
    totalStreams += streams;
    streamRevenue += streams * PAY_PER_STREAM * (1 - (song.cowriterShare || 0));
    const sales = Math.round(streams / (age <= 1 ? 600 : 1100) * rng.float(0.8, 1.2));
    song.weeklySales = sales;
    song.lifetimeSales = (song.lifetimeSales || 0) + sales;
    salesRevenue += sales * 0.69 * 0.7;
    if (!topSong || streams > topSong.weeklyStreams) topSong = song;
    song.viral = song.viral > 1.02 ? 1 + (song.viral - 1) * 0.6 : 1;
    if (song.playlists && age > 10 && rng.chance(0.2)) song.playlists -= 1;
    song.radio = radioSpins(p.popularity, song.quality, age, { label: !!p.label, payola: (song.payola || 0) + (song.radioBoost || 0) });
    song.payola = (song.payola || 0) * 0.6;
    song.radioBoost = (song.radioBoost || 0) * 0.7;
    const c = certifySong(s, song, name, true, (t) => pushNews(s, t, true, 'Certified'));
    if (c) {
      logTimeline(s, 'cert', `“${song.title}” certified ${c.name}`, fmtNum(song.lifetimeStreams) + ' streams');
      ev(65, 'cert', { title: song.title, cert: c.name });
    }
  }
  p.lifetimeStreams = (p.lifetimeStreams || 0) + totalStreams;
  trackYear(s, totalStreams, songStreams);
  const mgr = p.staff.manager ? 1.1 : 1;
  if (streamRevenue > 0) {
    const net = labelRoyalty(s, streamRevenue * mgr);
    if (net >= 1) earn(s, 'streams', net, p.label && p.label.recouped < p.label.advance ? 'Streaming royalties (after recoupment)' : 'Streaming royalties');
  }
  if (salesRevenue >= 1) { const net = labelRoyalty(s, salesRevenue); if (net >= 1) earn(s, 'sales', net, 'TreblrTunes download sales'); }

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

  // 4. Rivals: real popularity drifts back towards its baseline; realistic release cadence.
  const rivalById = {};
  for (const r of s.rivals) {
    rivalById[r.id] = r;
    r.monthlyListeners = Math.round((r.monthlyListeners * 0.92 + r.baseML * 0.08) * rng.float(0.98, 1.025));
  }
  const moves = npcReleaseTick(s, rng, W, rivalById, (r, week) => { const so = makeRivalSong(s, rng, r, week); s.rivalSongs.push(so); return so; }, (r) => uniqueRivalTitle(s, rng, r, () => npcTitle(rng, r)));
  for (const m of moves) {
    if (m.kind === 'album') { if (m.r.tier !== 'rising') pushNews(s, `${m.r.name} unveils new album “${m.title}”`, false, 'Albums'); }
    else if (m.r.tier === 'superstar' || rng.chance(0.2)) pushNews(s, `${m.r.name} releases “${m.title}”`, false, genreName(m.r.genre));
  }
  const moved = new Set(moves.map((m) => m.r.id));
  for (const r of s.rivals) {
    if (!moved.has(r.id) && rng.chance(0.2)) r.lastMove = rng.pick([`On tour in ${rng.pick(CITIES).name}`, 'Teasing new music', 'Spotted in the studio', `Headlining a festival in ${rng.pick(CITIES).name}`, 'Trending after a talk-show slot', 'Signed a sneaker deal', 'Went quiet on socials', 'Posted studio clips', 'Shot a music video']);
  }
  const rivalPull = {};
  for (const song of s.rivalSongs) {
    const r = rivalById[song.rivalId];
    if (!r) continue;
    rivalPull[r.id] = (rivalPull[r.id] || 0) + rivalSongPotential(r, song, W - song.releasedWeek) / (r.monthlyListeners * NPC_STREAM_K);
  }
  for (const song of s.rivalSongs) {
    const r = rivalById[song.rivalId];
    if (!r) continue;
    const age = W - song.releasedWeek;
    // A catalogue shares its audience: more songs out = less per song (sqrt sharing).
    song.weeklyStreams = Math.round(rivalSongPotential(r, song, age) / Math.sqrt(Math.max(1, rivalPull[r.id])) * rng.float(0.9, 1.1));
    song.lifetimeStreams += song.weeklyStreams;
    song.radio = radioSpins(popularityFromListeners(r.monthlyListeners) * 0.85, song.quality, age, { label: true });
    if (song.lifetimeStreams >= 75e6 && (r.tier === 'superstar' || r.tier === 'star')) certifySong(s, song, r.name, false);
  }
  const keepIds = new Set(s.rivalAlbums.filter((x) => W - x.releasedWeek < 60).flatMap((a) => a.songIds || []));
  for (const r of s.rivals) for (const id of r.eraSingles || []) keepIds.add(id);
  s.rivalSongs = s.rivalSongs.filter((x) => W - x.releasedWeek < 40 || (keepIds.has(x.id) && W - x.releasedWeek < 70));
  s.rivalAlbums = s.rivalAlbums.filter((x) => W - x.releasedWeek < 60);

  // 5. Fans, listeners, popularity, hype.
  const newFans = Math.round(fanStreams * fanSaturation(p.fans) / (1 + p.fans / FAN_HALF));
  // Fall-off: the longer since your last release, the faster fans drift away.
  const quiet = p.lastReleaseWeek == null ? 0 : W - p.lastReleaseWeek;
  const churnRate = quiet < 8 ? 0.002 : quiet < 16 ? 0.004 : quiet < 26 ? 0.007 : quiet < 52 ? 0.011 : 0.015;
  const churn = Math.round(p.fans * churnRate);
  p.fans = Math.max(0, p.fans + newFans - churn);
  distributeFans(p, newFans);
  p.monthlyListeners = Math.round(p.monthlyListeners * ML_KEEP + (totalStreams * 0.7 + p.fans * 0.22) * (1 - ML_KEEP));
  const tierMove = updateFame(s);
  if (tierMove?.up) {
    const t = FAME_TIERS.find((x) => x.id === tierMove.to);
    logTimeline(s, 'fame', `Fame: ${t.name}`, `Popularity ${p.popularity}`);
    pushNotif(s, 'fame', `You’re now considered a ${t.name.toLowerCase()} 🌟`, { tab: 'home' });
    if (['star', 'superstar', 'icon'].includes(t.id)) { pushNews(s, `${name} is officially a ${t.name.toLowerCase()}`, true, 'Fame'); statPost(s, `${name} has reached ${t.name} status.`, true); }
  }
  p.hype = clamp(hypeDecay(p.hype, p.staff.publicist), 0, 100);
  p.followers.chirp += Math.round(newFans * 0.3);
  p.followers.snapshot += Math.round(newFans * 0.35);
  p.followers.clipz += Math.round(newFans * 0.25);

  // 6. Expenses.
  const city = cityById(p.city);
  const rent = housingCost(s);
  if (rent) spend(s, 'rent', rent, `Rent — ${city.name}`);
  spend(s, 'living', LIVING_COST, 'Living costs');
  const sc = staffCost(s);
  if (sc) spend(s, 'staff', sc, 'Team salaries');
  const grossIn = Object.entries(s.ledger.income).filter(([k]) => !['advance', 'loan', 'rewards'].includes(k)).reduce((a, [, v]) => a + v, 0);
  if (p.staff.manager && grossIn > 0) spend(s, 'staff', grossIn * 0.1, 'Manager commission (10%)');
  if (p.staff.booking && s.ledger.income.gigs > 0) spend(s, 'staff', s.ledger.income.gigs * 0.1, 'Booking agent commission (10%)');
  const upkeep = lifestyleUpkeep(s);
  if (upkeep) spend(s, 'lifestyle', upkeep, 'Lifestyle upkeep');
  distributionTick(s);
  contractTick(s);
  bankTick(s, grossIn);

  // 7. Album units (first weeks, certifications), then charts.
  albumWeek(s, rng, (t) => pushNews(s, t, true, 'Certified'));
  s.charts = computeCharts(s, prevCharts);
  chartStarPoints(s);
  trackChartRuns(s);
  npcChartPosts(s, prevCharts);
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
  if (chartMoves.some((m) => m.firstTime)) pushNotif(s, 'chart', `New chart entry: ${chartMoves.find((m) => m.firstTime).title} #${chartMoves.find((m) => m.firstTime).r} ${chartMoves.find((m) => m.firstTime).chart}`, { tab: 'charts' }, 'chart');
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
  const festResults = festivalTick(s, rng, ev);
  const film = actingTick(s, rng, ev);
  cloudTick(s);
  const yw = ((W - 1) % 52) + 1;
  const show = AWARD_SHOWS.find((a) => a.week === yw);
  if (show) {
    const a = awardNomination(s, rng, show, rivalById);
    if (a) events.push({ weight: 50, kind: 'event', vars: { text: `${name} nominated for ${a.category} at the ${a.show}` } });
  }
  const soon = AWARD_SHOWS.find((a) => a.week === ((W + 1) % 52) + 1);
  if (soon && !s.awardSubmission) openAwardSubmissions(s, soon, W + 2);

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
    festivals: festResults,
    film,
    fame: p.fame?.tier,
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
  // Energy fully refills every week (burnout only trims the cap a little; tours/filming reserve some).
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

// Share of last month's listeners who are still listening this week (lower = new listeners stick less).
export const ML_KEEP = 0.5;

export function fanSaturation(fans) {
  return Math.max(0.05, 1 - fans / 400_000_000);
}

// Treblrfork review for EPs/albums: quality, sequencing and a critic's mood.
function reviewRelease(s, rng, rel, songs) {
  const q = songs.length ? songs.reduce((a, x) => a + x.quality, 0) / songs.length : 50;
  const raw = q / 10 - 1.2 + (rel.sequencing || 0) * 1.2 + rng.float(-1.2, 1.2) + (rel.type === 'album' ? 0.2 : 0);
  const score = Math.round(clamp(raw, 1.5, 9.8) * 10) / 10;
  const bnm = score >= 8.3;
  if (score >= 8) gainHype(s.player, 6);
  else if (score <= 4.5) gainHype(s.player, -4);
  if (bnm) { pushNews(s, `Treblrfork names ${s.player.stageName}\u2019s “${rel.title}” Best New Music (${score.toFixed(1)})`, true, 'Reviews'); addStarPoints(s, 6); }
  return { score, bnm, week: s.week };
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
  if (payolaExposure(s, rng, events)) return;
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
    pushNotif(s, 'offer', `${from}: ${subject}`, { tab: 'phone', app: 'inbox' }, 'offer');
    return true;
  };
  if (p.fans >= 1500 && rng.chance((0.16 + p.popularity / 260) * mgrBoost)) {
    const recent = s.brandHistory || {};
    const brands = BRANDS.filter((b) => !activeFrom.has(b) && !(recent[b] != null && W - recent[b] < 10));
    if (brands.length) {
      const brand = rng.pick(brands);
      const fameMult = { star: 1.3, superstar: 1.7, icon: 2 }[p.fame?.tier] || 1;
      const cash = Math.round((p.fans * 0.03 + p.popularity * 60 + 300) * mgrBoost * fameMult * rng.float(0.8, 1.3));
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
    // Offers scale with the player: only the biggest rooms you qualify for (no open-mic offers for a
    // charting artist), and the same promoter/room combination cools down for 10 weeks.
    const heat = Object.entries(p.fanHeat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const eligible = VENUES.filter((v) => venueUnlocked(p, v) && !(p.bestRank != null && v.capacity < 400) && !(p.fans >= 8000 && v.capacity < 400) && !(p.fans >= 40000 && v.capacity < 2000));
    const top = eligible.slice(-2);
    s.offerLog = s.offerLog || {};
    const options = [];
    for (const [cid] of heat.length ? heat : [[p.city]]) for (const v of top) if (!(s.offerLog[`gig|${cid}|${v.id}`] != null && W - s.offerLog[`gig|${cid}|${v.id}`] < 10)) options.push([cid, v]);
    if (options.length) {
      const [cityId, venue] = rng.pick(options);
      const cash = Math.round(venue.capacity * venue.ticket * 0.5 * (p.staff.booking ? 1.2 : 1) * rng.float(0.8, 1.2));
      const fans = Math.round(venue.capacity * rng.float(0.04, 0.1));
      const c = cityById(cityId);
      if (add('gig', `${c.name} promoter`, `Gig offer: ${venue.name} in ${c.name}`, `Guaranteed fee ${fmtMoney(cash)} to play a ${venue.name.toLowerCase()} in ${c.flag} ${c.name}. Costs ${venue.energy} energy.`, { venue: `${venue.name}, ${c.name}`, city: cityId, cash, fans, energy: venue.energy })) s.offerLog[`gig|${cityId}|${venue.id}`] = W;
    }
  }
  if (!p.label && rng.chance(0.1 * mgrBoost)) {
    const eligible = LABELS.filter((l) => p.popularity >= l.minPop - 4 && !(s.offerLog?.[`label|${l.id}`] != null && W - s.offerLog[`label|${l.id}`] < 12));
    const fit = eligible.filter((l) => !l.genres.length || l.genres.includes(p.genre));
    const pool = (fit.length ? fit : eligible).sort((a, b) => b.minPop - a.minPop).slice(0, 3);
    if (pool.length) {
      const l = rng.pick(pool);
      const t = labelTerms(s, l, rng);
      if (t && add('label', l.name, `${l.name} (${l.tier}) wants to sign you`, dealText(t), t, 3)) s.offerLog[`label|${l.id}`] = W;
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
