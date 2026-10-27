// Career systems (2026-10-27): rolling fame, star points & tiers, release reception (variance),
// certifications for songs and albums (player + NPC), album units & first-week tracking,
// realistic NPC release cadence, and the Treblr Data milestones feed on TreblrX.
import { clamp, uid, fmtNum } from './util.js';
import { decay } from './model.js';
import { SONG_CERTS, ALBUM_CERTS, STREAMS_PER_UNIT, FAME_TIERS, certFor, certRank } from './data2.js';
import { COVER_STYLES } from './data2.js';
import { genreName } from './data.js';

// Popularity is now a log scale on a rolling 26-week weighted average of monthly listeners:
// 1K -> 0, 10K -> 20, 100K -> 40, 1M -> 60, 10M -> 80, 100M -> 100.
export function popularityFromListeners(ml) {
  return Math.max(0, Math.min(100, Math.round((Math.log10(Math.max(1, ml)) - 3) * 20)));
}
export const FAME_WINDOW = 26;
// Linearly weighted: this week counts 26x, 26 weeks ago counts 1x. One viral month moves it a little.
export function rollingListeners(hist) {
  if (!hist?.length) return 0;
  let num = 0; let den = 0;
  hist.forEach((v, i) => { const w = i + 1; num += v * w; den += w; });
  return num / den;
}

export function gauss(rng) {
  const u = Math.max(1e-9, rng.next()); const v = rng.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- star points & fame tiers ----------
export function addStarPoints(s, n) {
  const p = s.player;
  p.fame = p.fame || { tier: 'unknown', points: 0, since: s.week };
  p.fame.points = Math.round((p.fame.points + n) * 10) / 10;
}
export function careerWeeks(s) {
  const first = s.releases.filter((r) => r.status === 'out').reduce((m, r) => Math.min(m, r.releaseWeek), Infinity);
  return Number.isFinite(first) ? s.week - first : 0;
}
export function fameTierFor(pop, points, weeks) {
  let t = FAME_TIERS[0];
  for (const x of FAME_TIERS) if (pop >= x.pop && points >= x.points && weeks >= x.weeks) t = x;
  return t;
}
export function fameInfo(s) {
  const p = s.player;
  const f = p.fame || { tier: 'unknown', points: 0 };
  const tier = FAME_TIERS.find((x) => x.id === f.tier) || FAME_TIERS[0];
  const next = FAME_TIERS[FAME_TIERS.indexOf(tier) + 1] || null;
  return { tier, next, points: f.points, weeks: careerWeeks(s), pop: p.popularity };
}
// Weekly: roll listeners into the fame window and recompute popularity + tier.
export function updateFame(s) {
  const p = s.player;
  p.mlHistory = [...(p.mlHistory || []), p.monthlyListeners].slice(-FAME_WINDOW);
  p.popularity = popularityFromListeners(rollingListeners(p.mlHistory));
  p.fame = p.fame || { tier: 'unknown', points: 0 };
  const prev = p.fame.tier;
  const t = fameTierFor(p.popularity, p.fame.points, careerWeeks(s));
  // tiers can slip if popularity collapses, but only one step at a time
  const iPrev = FAME_TIERS.findIndex((x) => x.id === prev);
  const iNew = FAME_TIERS.indexOf(t);
  p.fame.tier = iNew < iPrev ? FAME_TIERS[Math.max(iNew, iPrev - 1)].id : t.id;
  return p.fame.tier !== prev ? { from: prev, to: p.fame.tier, up: iNew > iPrev } : null;
}

// ---------- release reception: every release is a gamble ----------
// Lognormal noise, sophomore pressure after a hit, crowding from superstar drops the same week.
export function releaseReception(s, rng, songs) {
  const p = s.player;
  const q = songs.reduce((a, x) => a + x.quality, 0) / Math.max(1, songs.length);
  let r = Math.exp(gauss(rng) * 0.42 - 0.04);
  const prevBest = s.songs.filter((x) => x.status === 'released' && x.peaks?.hot100 != null && x.peaks.hot100 <= 20);
  if (prevBest.length) {
    const bar = Math.max(...prevBest.map((x) => x.quality));
    if (q < bar - 4) r *= 0.8; // fans expected more after the last hit
  }
  const crowd = s.rivalSongs.filter((x) => Math.abs(x.releasedWeek - s.week) <= 0 && s.rivals.find((rv) => rv.id === x.rivalId)?.tier === 'superstar').length
    + s.rivalAlbums.filter((x) => Math.abs(x.releasedWeek - s.week) <= 1 && s.rivals.find((rv) => rv.id === x.rivalId)?.tier === 'superstar').length;
  r *= Math.max(0.7, 1 - 0.08 * crowd);
  r *= 0.9 + Math.min(0.2, p.hype / 400);
  return clamp(Math.round(r * 100) / 100, 0.3, 2.3);
}
export function receptionLabel(r) {
  if (r == null) return null;
  if (r >= 1.45) return 'Smash reception';
  if (r >= 1.12) return 'Warm reception';
  if (r >= 0.88) return 'Steady reception';
  if (r >= 0.65) return 'Lukewarm reception';
  return 'Flop';
}

// ---------- milestones feed (TreblrX @treblrdata) ----------
export const STATS_ACCOUNT = { name: 'Treblr Data', handle: 'treblrdata' };
export function statPost(s, text, pl = false, rivalId = null) {
  s.statFeed = s.statFeed || [];
  s.statFeed.unshift({ id: uid(s, 'sd'), week: s.week, text, pl, rivalId });
  if (s.statFeed.length > 80) s.statFeed.length = 80;
}

// ---------- certifications ----------
function announceCert(s, kind, title, artist, cert, pl, rivalId) {
  const what = kind === 'album' ? 'album' : 'single';
  statPost(s, `${artist}’s ${what} “${title}” is now certified ${cert.name} 💿`, pl, rivalId);
}
export function certifySong(s, song, artist, pl = true, news) {
  const c = certFor(song.lifetimeStreams || 0, SONG_CERTS);
  if (!c || certRank(song.cert, SONG_CERTS) >= certRank(c.id, SONG_CERTS)) return null;
  song.cert = c.id;
  if (pl) {
    addStarPoints(s, c.id === 'gold' ? 5 : c.id === 'diamond' ? 60 : 10);
    news?.(`“${song.title}” by ${artist} is certified ${c.name}`);
    announceCert(s, 'song', song.title, artist, c, true);
  } else if ((c.id === 'diamond' || c.id === 'platinum5') && (s.statFeed || []).filter((x) => x.week === s.week && !x.pl).length < 2) {
    announceCert(s, 'song', song.title, artist, c, false, song.rivalId);
  }
  return c;
}
export function certifyAlbum(s, album, artist, pl = true, news) {
  const c = certFor(album.totalUnits || 0, ALBUM_CERTS);
  if (!c || certRank(album.cert, ALBUM_CERTS) >= certRank(c.id, ALBUM_CERTS)) return null;
  album.cert = c.id;
  if (pl) {
    addStarPoints(s, c.id === 'gold' ? 8 : c.id === 'diamond' ? 80 : 15);
    news?.(`${artist}’s ${album.type === 'ep' ? 'EP' : 'album'} “${album.title}” is certified ${c.name}`);
  }
  if (pl || ((c.id === 'platinum' || c.id === 'diamond' || c.id === 'platinum3') && (s.statFeed || []).filter((x) => x.week === s.week && !x.pl).length < 2)) announceCert(s, 'album', album.title, artist, c, pl, album.rivalId || null);
  return c;
}

// ---------- album units ----------
// Player projects: streams of the tracklist / 2,500 + pure sales. Lead singles' earlier streams count
// towards the total (preUnits) but never the first week.
export function playerAlbumUnits(s, rel, rng) {
  const p = s.player;
  const age = s.week - rel.releaseWeek;
  const streams = rel.songIds.reduce((a, id) => a + (s.songs.find((x) => x.id === id)?.weeklyStreams || 0), 0);
  const firstMult = age === 0 ? 4 * (1 + (rel.preHype || 0)) : decay(62, age);
  const typeMult = rel.type === 'album' ? 1 : 0.45;
  const sales = p.fans * 0.0012 * firstMult * typeMult * (1 + p.hype / 200) * (rel.reception || 1) * rng.float(0.9, 1.1);
  return { units: Math.round(streams / STREAMS_PER_UNIT + sales), streams, sales: Math.round(sales) };
}
export function npcAlbumUnits(s, a, r, rng) {
  const age = s.week - a.releasedWeek;
  const singles = (a.songIds || []).map((id) => s.rivalSongs.find((x) => x.id === id)).filter(Boolean);
  const streams = singles.reduce((x, y) => x + (y.weeklyStreams || 0), 0) * (a.tracks || 10) / Math.max(3, singles.length) * 0.55;
  const firstMult = age === 0 ? 3 * (a.hypeMult || 1) : decay(70, age);
  const sales = r.monthlyListeners * 0.0011 * firstMult * rng.float(0.85, 1.15);
  return Math.round(streams / STREAMS_PER_UNIT + sales);
}

// Runs once per week after streams. Updates units, first weeks, totals and certifications.
export function albumWeek(s, rng, news) {
  const p = s.player;
  const year = Math.floor((s.week - 1) / 52);
  s.firstWeeks = s.firstWeeks || [];
  for (const rel of s.releases) {
    if (rel.status !== 'out' || rel.type === 'single') continue;
    const u = playerAlbumUnits(s, rel, rng);
    rel.weeklyUnits = u.units;
    if (rel.firstWeek == null && rel.releaseWeek === s.week) {
      rel.firstWeek = u.units;
      rel.totalUnits = (rel.preUnits || 0) + u.units;
      const best = s.firstWeeks.filter((x) => x.year === year).reduce((m, x) => Math.max(m, x.units), 0);
      s.firstWeeks.push({ year, week: s.week, units: u.units, title: rel.title, pl: true });
      statPost(s, `“${rel.title}” by ${p.stageName} opens with ${fmtNum(u.units)} units in its first week${u.units > best && best > 0 ? ', the biggest debut of the year so far' : ''}. 📊`, true);
      if (u.units > best && best > 0) addStarPoints(s, 10);
    } else {
      rel.totalUnits = (rel.totalUnits || rel.preUnits || 0) + u.units;
    }
    certifyAlbum(s, rel, p.stageName, true, news);
  }
  const rivalById = Object.fromEntries(s.rivals.map((r) => [r.id, r]));
  for (const a of s.rivalAlbums) {
    const r = rivalById[a.rivalId];
    if (!r) continue;
    const units = npcAlbumUnits(s, a, r, rng);
    a.weeklyUnits = units;
    if (a.firstWeek == null && a.releasedWeek === s.week) {
      a.firstWeek = units;
      a.totalUnits = (a.preUnits || 0) + units;
      const best = s.firstWeeks.filter((x) => x.year === year).reduce((m, x) => Math.max(m, x.units), 0);
      s.firstWeeks.push({ year, week: s.week, units, title: a.title, rivalId: r.id });
      if (r.tier === 'superstar' || r.tier === 'star' || units > best) statPost(s, `${r.name}’s “${a.title}” debuts with ${fmtNum(units)} first-week units${units > best && best > 0 ? ', biggest week of the year' : ''}.`, false, r.id);
    } else if (a.releasedWeek < s.week) {
      a.totalUnits = (a.totalUnits || 0) + units;
    }
    certifyAlbum(s, a, r.name, false);
  }
  if (s.firstWeeks.length > 120) s.firstWeeks = s.firstWeeks.slice(-120);
}

// ---------- NPC release cadence ----------
export const CADENCE = {
  superstar: { single: [14, 26], album: [78, 156] },
  star: { single: [10, 20], album: [60, 120] },
  established: { single: [8, 16], album: [52, 100] },
  rising: { single: [6, 12], album: [40, 80] },
};
export function scheduleRival(r, rng, W, first = false) {
  const c = CADENCE[r.tier] || CADENCE.rising;
  r.nextSingle = W + (first ? rng.int(1, c.single[1]) : rng.int(c.single[0], c.single[1]));
  if (first || r.nextAlbum == null) r.nextAlbum = W + (first ? rng.int(6, Math.round(c.album[1] * 0.8)) : rng.int(c.album[0], c.album[1]));
  r.eraSingles = r.eraSingles || [];
}
export function npcCover(rng) {
  return { gradient: rng.int(0, 7), style: rng.int(1, COVER_STYLES.length - 1), seed: rng.int(1, 1e6) };
}
// Avoid repeating a title for the same artist (titles are generated, never real).
export function uniqueRivalTitle(s, rng, r, gen) {
  r.usedTitles = r.usedTitles || [];
  let t = gen();
  for (let i = 0; i < 8 && r.usedTitles.includes(t); i++) t = gen();
  if (r.usedTitles.includes(t)) t = `${t} (${['Reprise', 'Interlude', 'Part II', 'Redux', 'Night Version'][rng.int(0, 4)]})`;
  r.usedTitles.push(t);
  if (r.usedTitles.length > 120) r.usedTitles.shift();
  return t;
}

// Returns the list of news-worthy NPC moves this week. makeSong(rival, week) creates and returns a song.
export function npcReleaseTick(s, rng, W, rivalById, makeSong, titleFor) {
  const moves = [];
  for (const r of s.rivals) {
    if (r.nextSingle == null) scheduleRival(r, rng, W, true);
    const albumDue = W >= r.nextAlbum && (r.eraSingles || []).length >= 1;
    if (albumDue) {
      const singles = (r.eraSingles || []).map((id) => s.rivalSongs.find((x) => x.id === id)).filter(Boolean);
      const cuts = [];
      for (let i = 0; i < rng.int(2, 3); i++) { const so = makeSong(r, W); so.albumCut = true; cuts.push(so); }
      s.nextId += 1;
      const pre = singles.reduce((a, x) => a + (x.lifetimeStreams || 0), 0);
      const hypeMult = clamp(0.75 + pre / Math.max(1, r.monthlyListeners * 2.5), 0.75, 1.6);
      const album = { id: `ra${s.nextId}`, rivalId: r.id, type: 'album', title: titleFor(r), releasedWeek: W, tracks: rng.int(10, 16), songIds: [...singles.map((x) => x.id), ...cuts.map((x) => x.id)], singleIds: singles.map((x) => x.id), preUnits: Math.round(pre / STREAMS_PER_UNIT), hypeMult, cover: npcCover(rng) };
      for (const so of cuts) so.cover = album.cover;
      s.rivalAlbums.push(album);
      r.eraSingles = [];
      r.lastReleaseWeek = W;
      r.monthlyListeners = Math.round(r.monthlyListeners * 1.1);
      r.lastMove = `Released the album “${album.title}”`;
      const c = CADENCE[r.tier] || CADENCE.rising;
      r.nextAlbum = W + rng.int(c.album[0], c.album[1]);
      r.nextSingle = Math.max(r.nextSingle, W + rng.int(c.single[0], c.single[1]));
      moves.push({ kind: 'album', r, title: album.title });
    } else if (W >= r.nextSingle) {
      const so = makeSong(r, W);
      so.cover = npcCover(rng);
      r.eraSingles = [...(r.eraSingles || []), so.id].slice(-6);
      r.lastReleaseWeek = W;
      r.monthlyListeners = Math.round(r.monthlyListeners * 1.04);
      r.lastMove = `Dropped “${so.title}”`;
      const c = CADENCE[r.tier] || CADENCE.rising;
      r.nextSingle = W + rng.int(c.single[0], c.single[1]);
      // a single right before the album date nudges the album back a little
      if (r.nextAlbum - W < 3) r.nextAlbum = W + rng.int(3, 8);
      moves.push({ kind: 'single', r, title: so.title });
    }
  }
  return moves;
}

// ---------- chart milestones for the player (called after charts) ----------
export function chartStarPoints(s) {
  const pts = { hot100: [0.5, 2, 5], album: [0.3, 2, 5], global: [0.2, 1, 2] };
  let n = 0;
  for (const [id, [t40, t10, no1]] of Object.entries(pts)) {
    for (const e of s.charts[id] || []) {
      if (!e.pl) continue;
      if (e.r === 1) n += no1; else if (e.r <= 10) n += t10; else if (e.r <= 40) n += t40;
    }
  }
  if (n) addStarPoints(s, n);
  return n;
}

export function trackChartRuns(s) {
  const p = s.player;
  p.stats = p.stats || { no1: [], top10: [], weeksOnChart: {}, streamMarks: {}, listenerMarks: [], tickets: 0, ticketMarks: [] };
  const st = p.stats;
  for (const e of s.charts.hot100 || []) {
    if (!e.pl) continue;
    const song = s.songs.find((x) => x.id === e.id);
    if (!song) continue;
    st.weeksOnChart[e.id] = e.w;
    if ([10, 20, 30, 52].includes(e.w)) statPost(s, `“${song.title}” by ${p.stageName} has now spent ${e.w} weeks on the Hot 100.`, true);
    if (e.r === 1 && !st.no1.includes(e.id)) { st.no1.push(e.id); statPost(s, `${p.stageName} earns #1 song number ${st.no1.length} on the Hot 100 with “${song.title}”. 🏆`, true); }
    if (e.r <= 10 && !st.top10.includes(e.id)) { st.top10.push(e.id); if (st.top10.length > 1) statPost(s, `${p.stageName} now has ${st.top10.length} Hot 100 top 10s.`, true); }
  }
  for (const song of s.songs) {
    if (song.status !== 'released') continue;
    for (const mark of [1e8, 1e9]) {
      if ((song.lifetimeStreams || 0) >= mark && !st.streamMarks[`${song.id}|${mark}`]) {
        st.streamMarks[`${song.id}|${mark}`] = s.week;
        const weeks = s.week - song.releasedWeek;
        const key = mark === 1e8 ? 'fastest100M' : 'fastest1B';
        const prev = st[key];
        const fastest = prev == null || weeks < prev;
        if (fastest) st[key] = weeks;
        statPost(s, `“${song.title}” by ${p.stageName} passes ${mark === 1e8 ? '100M' : '1B'} streams in ${weeks} weeks${fastest && prev != null ? ', their fastest ever' : ''}.`, true);
      }
    }
  }
  for (const mark of [1e5, 1e6, 1e7, 5e7]) {
    if (p.monthlyListeners >= mark && !st.listenerMarks.includes(mark)) {
      st.listenerMarks.push(mark);
      statPost(s, `${p.stageName} hits ${fmtNum(mark)} monthly listeners for the first time.`, true);
    }
  }
}
export function trackTickets(s, n) {
  const p = s.player;
  p.stats = p.stats || { no1: [], top10: [], weeksOnChart: {}, streamMarks: {}, listenerMarks: [], tickets: 0, ticketMarks: [] };
  p.stats.tickets = (p.stats.tickets || 0) + n;
  for (const mark of [1e4, 1e5, 1e6]) {
    if (p.stats.tickets >= mark && !(p.stats.ticketMarks || []).includes(mark)) {
      p.stats.ticketMarks = [...(p.stats.ticketMarks || []), mark];
      statPost(s, `${p.stageName} has now sold ${fmtNum(mark)} concert tickets. 🎟️`, true);
    }
  }
}
export function npcChartPosts(s, prev) {
  const hot = s.charts.hot100 || [];
  const no1 = hot[0];
  if (no1 && !no1.pl && no1.p == null) {
    const so = s.rivalSongs.find((x) => x.id === no1.id);
    const r = so && s.rivals.find((x) => x.id === so.rivalId);
    if (r) statPost(s, `${r.name}’s “${so.title}” debuts at #1 on the Hot 100.`, false, r.id);
  }
  void prev;
}

export { genreName };
