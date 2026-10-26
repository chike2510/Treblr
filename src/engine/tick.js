// The weekly tick: advances the world one week. Pure: returns a new state with `lastReport`.
import { createRng } from './rng.js';
import { clone, clamp, uid, fmtMoney, fmtNum } from './util.js';
import {
  CERTS, CHARTS, CITIES, ROLLOUTS, VENUES, LABELS, BRANDS, AWARD_SHOWS, cityById, genreName,
} from './data.js';
import { playerStreams, rivalSongPotential, radioSpins, marketShares, PAY_PER_STREAM } from './model.js';
import { computeCharts } from './charts.js';
import { popularityFromListeners, makeRivalSong, randomTitle } from './state.js';
import { earn, spend, pushNews } from './actions.js';
import { checkGoals, staffCost, LIVING_COST } from './goals.js';

const MAIN_CHARTS = ['hot100', 'global', 'album'];

export function advanceWeek(state) {
  const s = clone(state);
  const rng = createRng(s.rng || s.seed);
  const p = s.player;
  const W = s.week;
  const before = { cash: p.cash, fans: p.fans, ml: p.monthlyListeners, pop: p.popularity };
  const prevCharts = s.charts || {};
  const flags = s.weekFlags || {};
  const events = [];
  const ev = (weight, text, kind = 'event') => events.push({ weight, text, kind });
  if (flags.viral) ev(60, `“${flags.viral}” goes viral on Clipz`, 'viral');
  if (flags.sellout) ev(50, `${p.stageName} sells out the ${flags.sellout}`, 'live');

  // 1. Scheduled releases go live.
  for (const rel of s.releases) {
    if (rel.status !== 'scheduled' || rel.releaseWeek > W) continue;
    rel.status = 'out';
    rel.releaseWeek = W;
    const ro = ROLLOUTS.find((r) => r.id === rel.rollout) || ROLLOUTS[1];
    for (const id of rel.songIds) {
      const song = s.songs.find((x) => x.id === id);
      if (!song) continue;
      song.status = 'released';
      song.releasedWeek = W;
      song.rolloutMult = ro.mult;
    }
    p.hype = clamp(p.hype + ro.hype, 0, 100);
    const kind = rel.type === 'single' ? 'single' : rel.type === 'ep' ? 'EP' : 'album';
    pushNews(s, `${p.stageName} releases new ${kind} “${rel.title}”`, true, 'Release');
    ev(45, `${p.stageName} drops “${rel.title}”`, 'release');
  }

  // 2. Player streams & revenue.
  let totalStreams = 0;
  let streamRevenue = 0;
  let topSong = null;
  let fanStreams = 0;
  const model = playerStreams(p, s.songs, W);
  for (const song of s.songs) {
    if (song.status !== 'released') continue;
    const age = W - song.releasedWeek;
    const m = model[song.id];
    const noise = rng.float(0.9, 1.1);
    const streams = Math.round(m.total * noise);
    fanStreams += (m.discovery * 0.012 * (song.quality / 60) + m.audience * 0.0002) * noise;
    song.weeklyStreams = streams;
    song.lifetimeStreams += streams;
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
          pushNews(s, `“${song.title}” by ${p.stageName} is certified ${c.name}`, true, 'Certified');
          ev(65, `“${song.title}” goes ${c.name}`, 'cert');
        }
        break;
      }
    }
  }
  p.lifetimeStreams = (p.lifetimeStreams || 0) + totalStreams;
  const mgr = p.staff.manager ? 1.1 : 1;
  if (streamRevenue > 0) earn(s, 'streams', streamRevenue * mgr, 'Streaming royalties');

  // Videos & merch.
  let videoRev = 0;
  for (const v of s.social.videos) {
    v.views += v.weekly;
    videoRev += v.weekly * 0.0018;
    p.followers.viewtube += Math.round(v.weekly * 0.002);
    const song = s.songs.find((x) => x.id === v.songId);
    if (song) song.videoViews = v.views;
    v.weekly = Math.round(v.weekly * 0.82);
  }
  if (videoRev >= 1) earn(s, 'video', videoRev, 'ViewTube ad revenue');
  if (s.merch?.active) {
    const sold = Math.min(s.merch.stock, Math.round((p.fans * 0.004 + p.hype * 2) * rng.float(0.7, 1.3)));
    s.merch.stock -= sold;
    s.merch.sold += sold;
    if (sold) earn(s, 'merch', sold * s.merch.price, `Merch sales (${sold} units)`);
    if (s.merch.stock <= 0) { s.merch.active = false; pushNews(s, `${p.stageName}'s merch drop sells out`, true, 'Business'); }
  }

  // 3. Rivals.
  const rivalById = {};
  for (const r of s.rivals) {
    rivalById[r.id] = r;
    const base = Math.pow(10, 3.8 + r.basePop * 0.045);
    r.monthlyListeners = Math.round((r.monthlyListeners * 0.9 + base * 0.1) * rng.float(0.97, 1.04));
    const since = W - r.lastReleaseWeek;
    if (rng.chance(0.04 + since * 0.012)) {
      const song = makeRivalSong(s, rng, r, W);
      s.rivalSongs.push(song);
      r.lastReleaseWeek = W;
      r.monthlyListeners = Math.round(r.monthlyListeners * 1.06);
      r.lastMove = `Dropped “${song.title}”`;
      if (r.basePop >= 75 || rng.chance(0.25)) pushNews(s, `${r.name} releases “${song.title}”`, false, genreName(r.genre));
    } else if (rng.chance(0.015)) {
      s.nextId += 1;
      const title = randomTitle(rng);
      s.rivalAlbums.push({ id: `ra${s.nextId}`, rivalId: r.id, title, releasedWeek: W, cover: { gradient: rng.int(0, 7) } });
      r.lastMove = `Released the album “${title}”`;
      pushNews(s, `${r.name} unveils new album “${title}”`, false, 'Albums');
    } else if (rng.chance(0.3)) {
      r.lastMove = rng.pick([`On tour in ${rng.pick(CITIES).name}`, 'Teasing new music', 'Spotted in the studio', `Headlining a festival in ${rng.pick(CITIES).name}`, 'Trending after a talk-show slot', 'Signed a sneaker deal', 'Went quiet on socials']);
    }
  }
  for (const song of s.rivalSongs) {
    const r = rivalById[song.rivalId];
    const age = W - song.releasedWeek;
    song.weeklyStreams = Math.round(rivalSongPotential(r, song, age) * rng.float(0.9, 1.1));
    song.lifetimeStreams += song.weeklyStreams;
    song.radio = radioSpins(popularityFromListeners(r.monthlyListeners) * 0.85, song.quality, age, { label: true });
  }
  s.rivalSongs = s.rivalSongs.filter((x) => W - x.releasedWeek < 40);
  s.rivalAlbums = s.rivalAlbums.filter((x) => W - x.releasedWeek < 60);

  // 4. Fans, listeners, popularity, hype.
  const newFans = Math.round(fanStreams * fanSaturation(p.fans));
  const recentRelease = s.releases.some((r) => r.status === 'out' && W - r.releaseWeek < 8);
  const churn = Math.round(p.fans * (recentRelease ? 0.001 : 0.004));
  p.fans = Math.max(0, p.fans + newFans - churn);
  distributeFans(p, newFans);
  p.monthlyListeners = Math.round(p.monthlyListeners * 0.5 + (totalStreams * 0.9 + p.fans * 0.25) * 0.5);
  p.popularity = popularityFromListeners(p.monthlyListeners);
  p.hype = clamp(p.hype * (p.staff.publicist ? 0.9 : 0.85), 0, 100);
  p.followers.chirp += Math.round(newFans * 0.3);
  p.followers.snapshot += Math.round(newFans * 0.35);
  p.followers.clipz += Math.round(newFans * 0.25);

  // 5. Expenses.
  const city = cityById(p.city);
  spend(s, 'rent', city.rent / 4, `Rent — ${city.name}`);
  spend(s, 'living', LIVING_COST, 'Living costs');
  const sc = staffCost(s);
  if (sc) spend(s, 'staff', sc, 'Team salaries');

  // 6. Charts.
  s.charts = computeCharts(s, prevCharts);
  const chartMoves = [];
  for (const ch of CHARTS) {
    for (const e of s.charts[ch.id]) {
      if (!e.pl) continue;
      const song = ch.kind === 'albums' ? s.releases.find((r) => r.id === e.id) : s.songs.find((x) => x.id === e.id);
      if (!song) continue;
      song.peaks = song.peaks || {};
      const firstTime = song.peaks[ch.id] == null;
      song.peaks[ch.id] = Math.min(song.peaks[ch.id] ?? 999, e.r);
      chartMoves.push({ chartId: ch.id, chart: ch.short || ch.name, title: song.title, r: e.r, p: e.p, firstTime });
      if (firstTime) p.chartEntries = (p.chartEntries || 0) + 1;
      if (MAIN_CHARTS.includes(ch.id)) {
        p.bestRank = p.bestRank == null ? e.r : Math.min(p.bestRank, e.r);
        if (e.r === 1) {
          pushNews(s, `${p.stageName}'s “${song.title}” is #1 on the ${ch.name}`, true, 'Charts');
          ev(100, `${p.stageName} Hits #1 on the ${ch.name}`, 'chart');
        } else if (firstTime) {
          pushNews(s, `“${song.title}” debuts at #${e.r} on the ${ch.name}`, true, 'Charts');
          ev(e.r <= 10 ? 85 : 70, `“${song.title}” Debuts at #${e.r} on the ${ch.name}`, 'chart');
        } else if (e.r <= 10 && (e.p == null || e.p > 10)) {
          ev(80, `“${song.title}” Breaks Into the ${ch.name} Top 10`, 'chart');
        }
      } else if (firstTime) {
        ev(40, `“${song.title}” Enters the ${ch.name} Chart at #${e.r}`, 'chart');
      }
    }
  }
  const no1 = s.charts.hot100?.[0];
  if (no1 && !no1.pl) {
    const rs = s.rivalSongs.find((x) => x.id === no1.id);
    const r = rs && rivalById[rs.rivalId];
    if (r) pushNews(s, no1.p === 1 ? `${r.name}'s “${rs.title}” holds #1 for week ${no1.w}` : `${r.name} takes #1 on the Hot 100 with “${rs.title}”`, false, 'Charts');
  }

  // 7. Random events & award shows.
  randomEvent(s, rng, ev);
  const yw = ((W - 1) % 52) + 1;
  const show = AWARD_SHOWS.find((a) => a.week === yw);
  if (show) awardShow(s, rng, show, ev, rivalById);

  // 8. Offers.
  for (const m of s.inbox) if (m.type === 'offer' && !m.status && m.expires <= W) m.status = 'expired';
  generateOffers(s, rng);
  s.inbox = s.inbox.slice(0, 80);

  // 9. Industry filler news.
  if (rng.chance(0.6)) {
    pushNews(s, rng.pick([
      `${rng.pick(CITIES).name} festival announces its ${rng.int(2027, 2028)} lineup`,
      `Streaming numbers hit a record high in ${rng.pick(['Brazil', 'India', 'Mexico', 'Nigeria', 'Germany', 'Japan', 'South Korea', 'the UK'])}`,
      `${genreName(rng.pick(['pop', 'latin', 'kpop', 'afrobeats', 'country', 'electronic', 'hiphop', 'indie']))} is the fastest-growing genre this quarter`,
      `Vinyl sales climb for the ${rng.int(15, 20)}th straight year`,
      `Major labels bet big on ${rng.pick(['short-form video', 'AI mastering', 'superfan subscriptions', 'stadium residencies'])}`,
    ]), false, 'Industry');
  }

  // 10. Goals & report.
  const newGoals = checkGoals(s);
  for (const g of newGoals) ev(35, `${p.stageName} unlocks “${g.name}”`, 'goal');
  events.sort((a, b) => b.weight - a.weight);
  const headline = events[0]?.text || fallbackHeadline(s, rng, totalStreams);
  const report = {
    week: W,
    headline,
    events: events.map((e) => e.text),
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
  };
  s.history = [...s.history, report].slice(-52);
  s.lastReport = report;

  // 11. Next week.
  s.week = W + 1;
  p.energy = clamp(p.maxEnergy - (p.energyPenalty || 0), 0, p.maxEnergy);
  p.energyPenalty = 0;
  p.socialEnergy = p.maxSocial;
  p.rested = false;
  s.weekFlags = {};
  s.ledger = { income: {}, expense: {} };
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

function fallbackHeadline(s, rng, streams) {
  const p = s.player;
  if (streams > 0) return rng.pick([`${p.stageName} Racks Up ${fmtNum(streams)} Streams`, `Inside ${p.stageName}'s Steady Climb`, `${p.stageName}: The Grind Continues`]);
  return rng.pick([`${p.stageName} Is Cooking Something Up`, `Who Is ${p.stageName}?`, `${p.stageName} Hits the Studio`, `Week ${s.week}: The Quiet Before the Noise`]);
}

function randomEvent(s, rng, ev) {
  const p = s.player;
  if (p.suspicion > 45 && rng.chance((p.suspicion - 40) / 140)) {
    const loss = Math.round(p.fans * 0.08);
    p.fans -= loss;
    p.hype = clamp(p.hype - 25, 0, 100);
    p.suspicion = 15;
    for (const x of s.songs) x.payola = 0;
    pushNews(s, `Payola probe: radio stations drop ${p.stageName} after pay-for-play report`, true, 'Scandal');
    ev(90, `Payola Scandal Rocks ${p.stageName}`, 'scandal');
    return;
  }
  p.suspicion = clamp(p.suspicion - 2, 0, 100);
  if (!rng.chance(0.35)) return;
  const released = s.songs.filter((x) => x.status === 'released');
  const options = [
    () => { if (p.cash < 300) return null; spend(s, 'other', 300, 'Laptop repair'); return 'Laptop crashed mid-session — $300 repair'; },
    () => { const f = Math.round(30 + Math.min(5000, p.fans * 0.03)); p.fans += f; p.hype = clamp(p.hype + 5, 0, 100); return `Fan meetup goes viral: +${fmtNum(f)} fans`; },
    () => { if (!released.length) return null; const so = rng.pick(released); so.viral = Math.max(so.viral, 2); return `A mega-influencer shares “${so.title}”`; },
    () => { p.energyPenalty = 30; return 'Food poisoning — you start next week drained'; },
    () => { p.hype = clamp(p.hype + 6, 0, 100); p.skills.charisma = clamp(p.skills.charisma + 1, 0, 100); return 'Invited to an industry party — new connections made'; },
    () => { if (p.popularity < 15) return null; p.hype = clamp(p.hype - 8, 0, 100); return `Rumour mill: blogs question ${p.stageName}'s authenticity`; },
    () => { const g = Math.round(40 + Math.min(3000, p.fans * 0.01)); p.fans += g; return `An old demo leaks and fans love it: +${fmtNum(g)} fans`; },
    () => { earn(s, 'other', 250, 'Sync licence (indie film)'); return 'An indie film licenses your music for $250'; },
  ];
  for (let i = 0; i < 4; i++) {
    const text = rng.pick(options)();
    if (text) { ev(30, text, 'event'); pushNews(s, text, true, 'Life'); return; }
  }
}

function awardShow(s, rng, show, ev, rivalById) {
  const p = s.player;
  const contender = (p.bestRank && p.bestRank <= 40) || p.popularity >= 55;
  if (contender) {
    const winChance = clamp(0.2 + (p.popularity - 50) / 100 + (p.bestRank && p.bestRank <= 10 ? 0.25 : 0), 0.1, 0.85);
    if (rng.chance(winChance)) {
      const award = rng.pick(['Breakthrough Artist', `Best ${genreName(p.genre)} Act`, 'Song of the Year', 'Fan Favourite']);
      p.awards = [...(p.awards || []), { week: s.week, name: `${show.name}: ${award}`, kind: 'award' }];
      p.hype = clamp(p.hype + 20, 0, 100);
      p.fans += Math.min(50000, Math.round(p.fans * 0.05));
      pushNews(s, `${p.stageName} wins ${award} at the ${show.name}`, true, 'Awards');
      ev(75, `${p.stageName} Wins ${award} at the ${show.name}`, 'award');
      return;
    }
    pushNews(s, `${p.stageName} nominated but goes home empty-handed at the ${show.name}`, true, 'Awards');
    ev(35, `Snubbed at the ${show.name}`, 'award');
    return;
  }
  const top = Object.values(rivalById).sort((a, b) => b.monthlyListeners - a.monthlyListeners);
  pushNews(s, `${rng.pick(top.slice(0, 6)).name} sweeps the ${show.name}`, false, 'Awards');
}

function generateOffers(s, rng) {
  const p = s.player;
  const W = s.week;
  const mgrBoost = p.staff.manager ? 1.2 : 1;
  const add = (subtype, from, subject, body, payload, weeks = 2) => {
    s.inbox.unshift({ id: uid(s, 'm'), type: 'offer', subtype, from, subject, body, payload, week: W, expires: W + weeks, read: false });
  };
  if (p.fans >= 1500 && rng.chance((0.18 + p.popularity / 250) * mgrBoost)) {
    const brand = rng.pick(BRANDS);
    const cash = Math.round((p.fans * 0.12 + p.popularity * 60 + 300) * mgrBoost * rng.float(0.8, 1.3));
    add('brand', brand, `${brand} wants you for a campaign`, `${brand} would like one sponsored post and a short ad spot. Fee: ${fmtMoney(cash)}. Costs 10 energy.`, { brand, cash, energy: 10 });
  }
  if (p.fans >= 500 && rng.chance((0.12 + p.popularity / 300) * mgrBoost)) {
    const near = s.rivals.slice().sort((a, b) => Math.abs(Math.log10(a.monthlyListeners) - Math.log10(p.monthlyListeners + 1000)) - Math.abs(Math.log10(b.monthlyListeners) - Math.log10(p.monthlyListeners + 1000))).slice(0, 8);
    const r = rng.pick(near);
    const cash = Math.round(Math.min(200000, r.monthlyListeners * 0.0008) * rng.float(0.7, 1.2) + 200);
    const fans = Math.round(Math.min(r.monthlyListeners * 0.004, 250000) * rng.float(0.5, 1));
    add('feature', r.name, `${r.name} wants a feature`, `${r.name} (${genreName(r.genre)}) wants a verse on their next single. Fee ${fmtMoney(cash)}, exposure to their audience (~+${fmtNum(fans)} fans). Costs 20 energy.`, { artist: r.name, cash, fans, energy: 20 }, 3);
  }
  if (rng.chance(0.3 + (p.staff.booking ? 0.25 : 0))) {
    const heat = Object.entries(p.fanHeat).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const cityId = heat.length ? rng.pick(heat)[0] : p.city;
    const venue = [...VENUES].reverse().find((v) => p.fans >= v.minFans) || VENUES[0];
    const cash = Math.round(venue.capacity * venue.ticket * 0.5 * (p.staff.booking ? 1.2 : 1) * rng.float(0.8, 1.2));
    const fans = Math.round(venue.capacity * rng.float(0.05, 0.12));
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
    const name = rng.pick(['Maya', 'Leo', 'Aiko', 'Chidi', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Hye-jin', 'Amelia', 'Kwame', 'Lucas']);
    const city = rng.pick(CITIES);
    const text = songs.length
      ? `“${rng.pick(songs).title}” got me through a rough month. Please come to ${city.name} someday!`
      : 'Saw your clip and I already know you\u2019re going to be huge. Drop something soon!';
    s.inbox.unshift({ id: uid(s, 'm'), type: 'fanmail', from: `${name} · ${city.flag} ${city.name}`, subject: 'Fan mail', body: text, week: W, read: false });
  }
}
