// Save v5 systems (fix list 2): featured credits, song detail helpers and push actions, remixes,
// investments (stocks, property, businesses), your own record label, the awards calendar,
// deeper acting (offers, script reads, press tours) and festival prep (setlists, production).
import { createRng, hashString } from './rng.js';
import { clamp, uid, fmtMoney, fmtNum } from './util.js';
import { run, earn, spend, pushNews } from './actions.js';
import { PAY_PER_STREAM, gainHype, marketShares, decay } from './model.js';
import { pushNotif, logTimeline } from './journal.js';
import { addStarPoints, gauss, npcCover } from './career.js';
import { genreName, PRODUCERS, COWRITERS, CHARTS, MARKETS, CITIES } from './data.js';
import { labelById, distributorById } from './data2.js';

const fail = (msg) => ({ ok: false, msg });
const wkYear = (w) => ((w - 1) % 52) + 1;

// =====================================================================================
// Featured credits: when the player guests on an NPC single, the song exists in the world.
// =====================================================================================
export const FEAT_SHARE = 0.12; // featured artist's share of the song's streaming revenue

export function createFeatureCredit(s, rng, rivalId, week = s.week) {
  const r = s.rivals.find((x) => x.id === rivalId);
  if (!r) return null;
  s.nextId += 1;
  const q = Math.round(clamp(rng.float(50, 72) + r.basePop * 0.2 + (s.player.skills?.vocals || 0) * 0.08, 35, 96));
  const words = ['Gravity', 'Lights Out', 'Overseas', 'No Sleep', 'Paradise', 'Golden Hour', 'Run It Up', 'Slow Motion', 'Fever', 'Halo', 'Mirage', 'Wildfire', 'Daylight', 'Satellite', 'Pressure'];
  const used = new Set(s.rivalSongs.map((x) => x.title));
  let title = rng.pick(words);
  for (let i = 0; i < 6 && used.has(title); i++) title = rng.pick(words);
  const song = {
    id: `rs${s.nextId}`, rivalId: r.id, title, genre: r.genre, quality: q, releasedWeek: week,
    weeklyStreams: 0, lifetimeStreams: 0, radio: 0, cover: npcCover(rng),
    featPlayer: true, featPlayerName: s.player.stageName, playerRevenue: 0, pushes: {},
  };
  s.rivalSongs.push(song);
  r.eraSingles = [...(r.eraSingles || []), song.id].slice(-6);
  return song;
}
export function featuredSongs(s) {
  return (s.rivalSongs || []).filter((x) => x.featPlayer);
}
export function findAnySong(s, id) {
  const own = s.songs.find((x) => x.id === id);
  if (own) return { song: own, featured: false, artist: s.player.stageName, rival: null };
  const rs = (s.rivalSongs || []).find((x) => x.id === id && x.featPlayer);
  if (rs) return { song: rs, featured: true, rival: s.rivals.find((r) => r.id === rs.rivalId) || null, artist: s.rivals.find((r) => r.id === rs.rivalId)?.name || 'Unknown' };
  return null;
}
// Chart positions held by songs the player is featured on.
export function featuredPositions(s) {
  const out = [];
  for (const ch of CHARTS) {
    for (const e of s.charts?.[ch.id] || []) {
      if (!e.fp) continue;
      const so = s.rivalSongs.find((x) => x.id === e.id);
      out.push({ chartId: ch.id, chartName: ch.short || ch.name, ...e, title: so?.title || '', featured: true });
    }
  }
  return out;
}

// =====================================================================================
// Feature fees & odds (rescaled): fee from the artist's audience, odds from relative stature.
// =====================================================================================
const FEE_ANCHORS = [[1e4, 300], [1e5, 800], [1e6, 4000], [2e6, 12000], [5e6, 60000], [12e6, 250000], [40e6, 600000], [90e6, 1200000], [150e6, 2200000]];
export function featureBaseFee(ml) {
  const x = Math.log10(Math.max(1e4, ml));
  for (let i = 1; i < FEE_ANCHORS.length; i++) {
    const [m0, f0] = FEE_ANCHORS[i - 1];
    const [m1, f1] = FEE_ANCHORS[i];
    if (ml <= m1 || i === FEE_ANCHORS.length - 1) {
      const t = (x - Math.log10(m0)) / (Math.log10(m1) - Math.log10(m0));
      return Math.pow(10, Math.log10(f0) + t * (Math.log10(f1) - Math.log10(f0)));
    }
  }
  return 300;
}
const GENRE_NEAR = {
  pop: ['rnb', 'electronic', 'kpop', 'latin', 'indie', 'country'], rnb: ['pop', 'hiphop', 'afrobeats'], hiphop: ['rnb', 'afrobeats', 'reggaeton', 'electronic'],
  afrobeats: ['rnb', 'hiphop', 'reggaeton', 'pop'], latin: ['reggaeton', 'pop'], reggaeton: ['latin', 'hiphop', 'afrobeats'], kpop: ['pop', 'electronic', 'rnb'],
  electronic: ['pop', 'hiphop', 'indie'], indie: ['rock', 'alternative', 'pop'], rock: ['indie', 'alternative', 'metal'], alternative: ['rock', 'indie'],
  metal: ['rock'], country: ['pop', 'rock'], jazz: ['rnb', 'indie'],
};
export function genreFit(playerGenre, rival) {
  if ((rival.genres || [rival.genre]).includes(playerGenre)) return 1;
  if ((rival.genres || [rival.genre]).some((g) => (GENRE_NEAR[playerGenre] || []).includes(g))) return 0.5;
  return 0;
}
export function rivalBusy(s, r) {
  if (r.nextAlbum != null && r.nextAlbum - s.week >= 0 && r.nextAlbum - s.week <= 5) return true;
  return (s.rivalAlbums || []).some((a) => a.rivalId === r.id && s.week - a.releasedWeek >= 0 && s.week - a.releasedWeek < 6);
}
export function scaledCollabQuote(player, rival, rel = 0, labelmate = false, ctx = {}) {
  const ml = Math.max(1, rival.monthlyListeners);
  const rpop = clamp(Math.round((Math.log10(ml) - 3) * 20), 0, 100);
  const ppop = player.popularity || 0;
  const gap = rpop - ppop;
  const fit = ctx.fit ?? 1;
  const busy = !!ctx.busy;
  let fee = featureBaseFee(ml);
  if (gap < 0) fee *= Math.max(0.35, 1 + gap * 0.04); // they're the smaller act: they want the look
  fee *= rel >= 70 ? 0.6 : rel >= 40 ? 0.8 : rel <= -20 ? 1.3 : 1;
  if (labelmate) fee *= 0.7;
  fee *= fit >= 1 ? 0.9 : fit > 0 ? 1 : 1.2;
  if (!rival.real) fee *= 0.8;
  if (busy) fee *= 1.5;
  fee = Math.round(Math.max(300, fee) / 100) * 100;
  let odds = gap <= 0 ? 0.85 : 0.85 - 0.8 * (1 - Math.exp(-gap / 22));
  odds += (fit >= 1 ? 0.06 : fit > 0 ? 0 : -0.12) + rel * 0.003 + (labelmate ? 0.12 : 0) + (rival.real ? 0 : 0.08);
  let note = null;
  if (rival.tier === 'superstar' && ppop < 75) { odds = Math.min(odds, ppop >= 65 ? 0.25 : ppop >= 55 ? 0.09 : 0.04); note = 'Superstars rarely jump on songs by smaller acts'; }
  else if (rival.tier === 'star' && ppop < 55) { odds = Math.min(odds, ppop >= 45 ? 0.2 : 0.08); note = 'Stars are picky about who they feature with'; }
  if (busy) { odds *= 0.35; note = 'Busy: deep in their album era'; }
  odds = clamp(odds, 0.01, 0.92);
  const splitShare = rival.tier === 'superstar' ? 0.5 : rival.tier === 'star' ? 0.4 : rival.tier === 'established' ? 0.3 : 0.2;
  const splitFee = Math.round((fee * 0.15) / 100) * 100;
  const splitOdds = clamp(odds * (['superstar', 'star'].includes(rival.tier) ? 1.25 : 1.1), 0.01, 0.92);
  return { fee, odds, gap, rpop, labelmate, busy, fit, note, splitFee, splitShare, splitOdds };
}

// =====================================================================================
// Song detail helpers
// =====================================================================================
export const PLATFORMS = [
  { id: 'treblify', name: 'Treblify', color: '#1ED760', base: 0.58 },
  { id: 'treblrmusic', name: 'Treblr Music', color: '#FA2D48', base: 0.18 },
  { id: 'treblrtube', name: 'TreblrTube', color: '#FF3B30', base: 0.12 },
  { id: 'treblrcloud', name: 'TreblrCloud', color: '#FF7A00', base: 0.07 },
  { id: 'treblrhifi', name: 'Treblr HiFi', color: '#38BDF8', base: 0.05 },
];
export function platformSplit(song) {
  const r = createRng(hashString(`plat|${song.id}`));
  const vid = song.videoViews ? 1.25 : 1;
  const raw = PLATFORMS.map((p) => p.base * r.float(0.8, 1.2) * (p.id === 'treblrtube' ? vid : 1));
  const tot = raw.reduce((a, b) => a + b, 0);
  const life = song.lifetimeStreams || 0;
  const wk = song.weeklyStreams || 0;
  return PLATFORMS.map((p, i) => ({ ...p, share: raw[i] / tot, streams: Math.round(life * raw[i] / tot), weekly: Math.round(wk * raw[i] / tot) }));
}
export function songRevenue(s, song) {
  if (song.featPlayer) return Math.round(song.playerRevenue || 0);
  if (song.revenue != null) return Math.round(song.revenue);
  const shares = (song.cowriterShare || 0) + (song.featShare || 0);
  return Math.round((song.lifetimeStreams || 0) * PAY_PER_STREAM * (1 - shares) + (song.lifetimeSales || 0) * 0.69 * 0.7);
}
export function songMomentum(song) {
  const h = song.history || [];
  const last = h.slice(-4).reduce((a, b) => a + b, 0);
  const prev = h.slice(-8, -4).reduce((a, b) => a + b, 0);
  if (!prev) return { pct: null, label: h.length ? 'New' : 'Unreleased' };
  const pct = (last - prev) / prev;
  return { pct, label: pct > 0.25 ? 'Surging' : pct > 0.03 ? 'Climbing' : pct > -0.15 ? 'Holding' : pct > -0.45 ? 'Cooling' : 'Fading' };
}
export function songAudience(s, song) {
  const sh = marketShares(song.genre, s.player.country);
  return MARKETS.map((m) => ({ code: m.code, name: m.name || m.code, share: sh[m.code] || 0 })).sort((a, b) => b.share - a.share).slice(0, 5);
}
export function songCredits(s, song) {
  const p = s.player;
  if (song.featPlayer) {
    const r = s.rivals.find((x) => x.id === song.rivalId);
    return { artist: r?.name || 'Unknown', featured: [p.stageName], writers: [r?.name, p.stageName].filter(Boolean), producer: 'Label in-house team', label: r?.label || 'Major label', explicit: song.quality % 3 === 0 };
  }
  const cw = COWRITERS.find((c) => c.id === song.cowriter);
  const prod = PRODUCERS.find((x) => x.id === song.producerId);
  return {
    artist: p.stageName,
    featured: song.featName ? [song.featName] : [],
    writers: [p.firstName ? `${p.firstName} ${p.lastName}`.trim() : p.stageName, cw && cw.id !== 'none' ? cw.name : null].filter(Boolean),
    producer: prod ? (prod.id === 'self' ? `${p.stageName} (self-produced)` : prod.name) : song.status === 'written' ? 'Not recorded yet' : 'Unknown',
    label: s.ownLabel && song.ownLabel ? s.ownLabel.name : p.label ? p.label.name : `Independent (${distributorById(s.distributor).name})`,
    explicit: song.explicit ?? (!!song.diss || ['Revenge', 'Money', 'Party'].includes(song.theme)),
  };
}
export function parentRelease(s, song) {
  const all = s.releases.filter((r) => r.songIds.includes(song.id));
  return all.find((r) => r.type !== 'single') || all[0] || null;
}
export function chartWeeksOf(song, chartId = 'hot100') {
  return (song.chartHist || []).filter((h) => h[chartId] != null).length;
}

// Called after charts each week: record each player and featured song's chart positions.
export function trackSongCharts(s) {
  const pos = {};
  for (const ch of CHARTS) {
    if (ch.kind === 'albums') continue;
    for (const e of s.charts?.[ch.id] || []) if (e.pl || e.fp) (pos[e.id] = pos[e.id] || {})[ch.id] = e.r;
  }
  const rec = (song) => {
    const ranks = pos[song.id];
    if (!ranks) return;
    song.chartHist = [...(song.chartHist || []), { w: s.week, ...ranks }].slice(-104);
    if (!song.featPlayer) return;
    song.peaks = song.peaks || {};
    for (const [k, v] of Object.entries(ranks)) song.peaks[k] = Math.min(song.peaks[k] ?? 999, v);
  };
  for (const so of s.songs) rec(so);
  for (const so of s.rivalSongs) if (so.featPlayer) rec(so);
}

// ---------- song actions ----------
export const PUSH_ACTIONS = [
  { id: 'interview', name: 'Talk-show interview', energy: 10, social: 0, cash: 0, desc: 'Tell the story behind the song. Small hype and discovery bump.' },
  { id: 'challenge', name: 'TreblrTok dance challenge', energy: 0, social: 15, cash: 2000, desc: 'Seed creators with the hook. Can go viral.' },
  { id: 'livesession', name: 'Live session', energy: 15, social: 0, cash: 1500, desc: 'Stripped-back performance on TreblrTube.' },
  { id: 'billboard', name: 'Street billboards', energy: 0, social: 0, cash: 25000, desc: 'Billboards in your top cities. Steady listener lift.' },
  { id: 'radio', name: 'Submit to radio', energy: 15, social: 0, cash: 0, desc: 'Service the track to radio programmers. Spins build over weeks.' },
];
export function pushCost(s, song, a) {
  const n = song.pushes?.[a.id] || 0;
  return { n, falloff: 1 / (1 + n * 0.6), cash: Math.round(a.cash * (1 + n * 0.5)) };
}
export function songPush(state, { songId, kind }) {
  return run(state, (s, rng) => {
    const found = findAnySong(s, songId);
    if (!found) return fail('Song not found.');
    const { song, featured } = found;
    const a = PUSH_ACTIONS.find((x) => x.id === kind);
    if (!a) return fail('Unknown action.');
    if (featured && !['interview', 'challenge'].includes(kind)) return fail('The lead artist’s team handles that for this song.');
    if (!featured && song.status !== 'released') return fail('Release the song first.');
    const p = s.player;
    const { n, falloff, cash } = pushCost(s, song, a);
    song.pushes = song.pushes || {};
    if (song.pushWeek?.[kind] === s.week) return fail('Already done this week.');
    if (kind === 'radio' && song.pushWeek?.radio != null && s.week - song.pushWeek.radio < 3) return fail('Radio wants a few weeks between submissions.');
    if (p.energy < a.energy) return fail(`Needs ${a.energy} energy.`);
    if (p.socialEnergy < a.social) return fail(`Needs ${a.social} social energy.`);
    if (p.cash < cash) return fail(`Costs ${fmtMoney(cash)}.`);
    p.energy -= a.energy;
    p.socialEnergy -= a.social;
    if (cash) spend(s, 'promo', cash, `${a.name}: ${song.title}`);
    song.pushes[kind] = n + 1;
    song.pushWeek = { ...(song.pushWeek || {}), [kind]: s.week };
    let msg = '';
    if (kind === 'interview') { gainHype(p, 4 * falloff); song.viral = Math.max(song.viral || 1, 1 + 0.12 * falloff); msg = `Interview aired. “${song.title}” gets a bump.`; }
    if (kind === 'challenge') {
      const hit = rng.chance(clamp(0.12 + song.quality / 400 + p.popularity / 600, 0.05, 0.5) * falloff);
      song.viral = Math.max(song.viral || 1, hit ? 1.9 : 1 + 0.2 * falloff);
      gainHype(p, hit ? 8 : 2);
      if (hit) pushNews(s, `The “${song.title}” challenge takes over TreblrTok`, true, 'Viral');
      msg = hit ? 'The challenge caught on. It’s everywhere.' : 'A few creators joined in.';
    }
    if (kind === 'livesession') { song.viral = Math.max(song.viral || 1, 1 + 0.18 * falloff); p.skills.performance = clamp(p.skills.performance + 0.4, 0, 100); msg = 'Live session posted.'; }
    if (kind === 'billboard') { song.viral = Math.max(song.viral || 1, 1 + 0.25 * falloff); msg = 'Billboards are up.'; }
    if (kind === 'radio') { song.radioBoost = (song.radioBoost || 0) + 30 * falloff; song.radioSubmitted = (song.radioSubmitted || 0) + 1; msg = 'Serviced to radio. Spins build over the next weeks.'; }
    return { msg };
  });
}
export const REMIX_KINDS = [
  { id: 'acoustic', name: 'Acoustic version', q: 0.92, energy: 20, cash: 1500 },
  { id: 'remix', name: 'Club remix', q: 0.95, energy: 20, cash: 6000 },
  { id: 'sped', name: 'Sped-up version', q: 0.85, energy: 10, cash: 500 },
  { id: 'live', name: 'Live version', q: 0.9, energy: 20, cash: 3000 },
];
export function remixSong(state, { songId, kind }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    const k = REMIX_KINDS.find((x) => x.id === kind);
    if (!song || !k) return fail('Pick a song and a version.');
    if (!['recorded', 'released', 'scheduled'].includes(song.status)) return fail('Record the original first.');
    if (song.remixOf) return fail('Make versions of the original song.');
    if (s.songs.some((x) => x.remixOf === song.id && x.remixKind === kind)) return fail(`There’s already a ${k.name.toLowerCase()}.`);
    const p = s.player;
    if (p.energy < k.energy) return fail(`Needs ${k.energy} energy.`);
    if (p.cash < k.cash) return fail(`Costs ${fmtMoney(k.cash)}.`);
    p.energy -= k.energy;
    spend(s, 'studio', k.cash, `${k.name}: ${song.title}`);
    const label = { acoustic: 'Acoustic', remix: 'Remix', sped: 'Sped Up', live: 'Live' }[kind];
    const q = clamp(Math.round(song.quality * k.q + rng.float(-3, 4) + (kind === 'acoustic' ? p.skills.vocals / 40 : 0)), 1, 100);
    s.songs.push({
      ...song, id: uid(s, 'song'), title: `${song.title} (${label})`, status: 'recorded', quality: q, remixOf: song.id, remixKind: kind,
      weeklyStreams: 0, lifetimeStreams: 0, history: [], peaks: {}, chartHist: [], cert: null, releasedWeek: undefined, firstWeekStreams: undefined,
      playlists: 0, playlistNames: [], lifetimeSales: 0, revenue: 0, pushes: {}, reception: undefined, videoViews: 0, feat: song.feat, featName: song.featName,
    });
    return { msg: `${k.name} of “${song.title}” recorded (Q${q}). Release it from the Studio.` };
  });
}
export function renameSong(state, { songId, title }) {
  return run(state, (s) => {
    const song = s.songs.find((x) => x.id === songId);
    const t = String(title || '').trim().slice(0, 60);
    if (!song) return fail('Song not found.');
    if (!t) return fail('Give it a title.');
    if (song.status === 'released' && song.renamed) return fail('Released songs can be retitled once.');
    if (song.status === 'released') song.renamed = true;
    song.title = t;
    return { msg: `Retitled “${t}”.` };
  });
}

// =====================================================================================
// Investments: stocks (fictional tickers), rental property, businesses
// =====================================================================================
export const STOCKS = [
  { t: 'TRBL', name: 'Treblr Inc.', price: 64, mu: 0.0018, vol: 0.045, sector: 'Streaming' },
  { t: 'SONX', name: 'Sonix Audio', price: 38, mu: 0.0012, vol: 0.03, sector: 'Hardware' },
  { t: 'HALO', name: 'Halo Headphones', price: 22, mu: 0.0014, vol: 0.05, sector: 'Consumer' },
  { t: 'VOLT', name: 'Volt Beverages', price: 51, mu: 0.001, vol: 0.022, sector: 'Drinks' },
  { t: 'KNTC', name: 'Kinetic Sportswear', price: 88, mu: 0.0013, vol: 0.03, sector: 'Fashion' },
  { t: 'ORBT', name: 'Orbit Mobility', price: 17, mu: 0.0016, vol: 0.07, sector: 'Transport' },
  { t: 'LUMN', name: 'Lumen Mobile', price: 140, mu: 0.0011, vol: 0.025, sector: 'Telecom' },
  { t: 'STGE', name: 'Stagecraft Live', price: 33, mu: 0.0015, vol: 0.04, sector: 'Live events' },
];
export const PROPERTIES = [
  { id: 'studioapt', name: 'Studio apartment', city: 'mad', price: 180000, rent: 0.055, upkeep: 0.012, appreciation: 0.03 },
  { id: 'duplex', name: 'Duplex', city: 'tor', price: 650000, rent: 0.05, upkeep: 0.012, appreciation: 0.03 },
  { id: 'townhouses', name: 'Row of townhouses', city: 'lon', price: 2400000, rent: 0.045, upkeep: 0.011, appreciation: 0.032 },
  { id: 'aptblock', name: 'Apartment block', city: 'sao', price: 5500000, rent: 0.06, upkeep: 0.015, appreciation: 0.028 },
  { id: 'retail', name: 'Retail strip', city: 'dxb', price: 12000000, rent: 0.055, upkeep: 0.013, appreciation: 0.025 },
  { id: 'tower', name: 'Office tower floors', city: 'tyo', price: 40000000, rent: 0.05, upkeep: 0.012, appreciation: 0.022 },
];
export const BUSINESSES = [
  { id: 'restaurant', name: 'Restaurant', price: 400000, yield: 0.09, risk: 0.35, fame: 0, network: 1, desc: 'A late-night spot. Thin margins, loyal crowd.' },
  { id: 'fashion', name: 'Fashion line', price: 1500000, yield: 0.12, risk: 0.5, fame: 2, network: 2, desc: 'Drops tied to your eras. Big upside if you’re hot.' },
  { id: 'recstudio', name: 'Recording studio', price: 900000, yield: 0.07, risk: 0.2, fame: 0, network: 3, desc: 'Rent rooms to other artists. Your sessions cost less.' },
  { id: 'nightclub', name: 'Nightclub', price: 2500000, yield: 0.14, risk: 0.55, fame: 1, network: 3, desc: 'Hosts after-parties. Scandal risk.' },
  { id: 'beverage', name: 'Drinks brand', price: 6000000, yield: 0.1, risk: 0.45, fame: 2, network: 2, desc: 'Your name on a can. Scales with popularity.' },
  { id: 'tech', name: 'Music-tech startup stake', price: 3000000, yield: 0.04, risk: 0.7, fame: 0, network: 2, desc: 'Mostly zero, sometimes a rocket.' },
  { id: 'team', name: 'Football club minority stake', price: 25000000, yield: 0.05, risk: 0.25, fame: 3, network: 4, desc: 'Prestige more than profit.' },
];
export const PASSIVE_CAP = 120000; // weekly soft cap on investment income
export function investOf(s) {
  if (!s.investments) {
    s.investments = { stocks: {}, cost: {}, prices: Object.fromEntries(STOCKS.map((x) => [x.t, x.price])), hist: Object.fromEntries(STOCKS.map((x) => [x.t, [x.price]])), properties: [], businesses: [], log: [] };
  }
  return s.investments;
}
export function investmentsValue(s) {
  const inv = s.investments;
  if (!inv) return 0;
  return Math.round(Object.entries(inv.stocks || {}).reduce((a, [t, n]) => a + n * (inv.prices?.[t] || 0), 0)
    + (inv.properties || []).reduce((a, o) => a + o.value, 0) + (inv.businesses || []).reduce((a, o) => a + o.value, 0));
}
export function softCap(raw, cap) {
  return raw <= 0 ? raw : cap * (1 - Math.exp(-raw / cap));
}
export function tradeStock(state, { ticker, amount, sell = false, all = false }) {
  return run(state, (s) => {
    const inv = investOf(s);
    const st = STOCKS.find((x) => x.t === ticker);
    if (!st) return fail('Unknown ticker.');
    const price = inv.prices[ticker];
    const held = inv.stocks[ticker] || 0;
    if (sell) {
      const n = all ? held : Math.min(held, Math.floor(amount / price));
      if (n <= 0) return fail('You don’t hold enough shares.');
      const cash = Math.round(n * price * 0.995);
      inv.cost[ticker] = (inv.cost[ticker] || 0) * (1 - n / held);
      inv.stocks[ticker] = held - n;
      if (!inv.stocks[ticker]) delete inv.stocks[ticker];
      earn(s, 'invest', cash, `Sold ${n} ${ticker}`);
      return { msg: `Sold ${fmtNum(n)} ${ticker} for ${fmtMoney(cash)}.` };
    }
    const n = Math.floor(amount / price);
    if (n <= 0) return fail('Not enough for one share.');
    const cost = Math.round(n * price * 1.005);
    if (s.player.cash < cost) return fail(`Needs ${fmtMoney(cost)}.`);
    spend(s, 'invest', cost, `Bought ${n} ${ticker}`);
    inv.stocks[ticker] = held + n;
    inv.cost[ticker] = (inv.cost[ticker] || 0) + cost;
    return { msg: `Bought ${fmtNum(n)} ${ticker} at ${fmtMoney(price)}.` };
  });
}
export function buyProperty(state, { id }) {
  return run(state, (s) => {
    const it = PROPERTIES.find((x) => x.id === id);
    if (!it) return fail('Unknown property.');
    if (s.player.cash < it.price) return fail(`Costs ${fmtMoney(it.price)}.`);
    const inv = investOf(s);
    spend(s, 'invest', it.price, `Property: ${it.name}`);
    inv.properties.push({ uid: uid(s, 'pr'), id: it.id, price: it.price, value: it.price, week: s.week, earned: 0, vacant: false });
    logTimeline(s, 'deal', `Bought a ${it.name.toLowerCase()}`, fmtMoney(it.price));
    return { msg: `${it.name} bought. Tenants pay about ${fmtMoney(it.price * it.rent / 52)}/week.` };
  });
}
export function sellProperty(state, { uid: key }) {
  return run(state, (s) => {
    const inv = investOf(s);
    const o = inv.properties.find((x) => x.uid === key);
    if (!o) return fail('Not found.');
    const cash = Math.round(o.value * 0.94);
    inv.properties = inv.properties.filter((x) => x !== o);
    earn(s, 'invest', cash, 'Property sale');
    return { msg: `Sold for ${fmtMoney(cash)} after fees.` };
  });
}
export function buyBusiness(state, { id }) {
  return run(state, (s) => {
    const it = BUSINESSES.find((x) => x.id === id);
    if (!it) return fail('Unknown business.');
    const inv = investOf(s);
    if (inv.businesses.some((x) => x.id === id)) return fail('You already own one.');
    if (s.player.popularity < 30 && it.fame) return fail('Nobody knows your name yet. Build your profile first (popularity 30).');
    if (s.player.cash < it.price) return fail(`Costs ${fmtMoney(it.price)}.`);
    spend(s, 'invest', it.price, `Business: ${it.name}`);
    inv.businesses.push({ uid: uid(s, 'bz'), id: it.id, price: it.price, value: it.price, week: s.week, earned: 0, lastWeek: 0 });
    if (it.fame) gainHype(s.player, it.fame * 2);
    pushNews(s, `${s.player.stageName} launches a ${it.name.toLowerCase()}`, true, 'Business');
    logTimeline(s, 'deal', `Launched a ${it.name.toLowerCase()}`, fmtMoney(it.price));
    return { msg: `${it.name} is open for business.` };
  });
}
export function sellBusiness(state, { uid: key }) {
  return run(state, (s) => {
    const inv = investOf(s);
    const o = inv.businesses.find((x) => x.uid === key);
    if (!o) return fail('Not found.');
    const cash = Math.round(o.value * 0.9);
    inv.businesses = inv.businesses.filter((x) => x !== o);
    earn(s, 'invest', cash, 'Business sale');
    return { msg: `Sold for ${fmtMoney(cash)}.` };
  });
}
export function investTick(s, rng) {
  const inv = s.investments;
  if (!inv) return 0;
  const p = s.player;
  // market-wide factor shared by all tickers
  const mkt = gauss(rng) * 0.012;
  for (const st of STOCKS) {
    const prev = inv.prices[st.t] ?? st.price;
    const next = Math.max(1, prev * Math.exp(st.mu + mkt + gauss(rng) * st.vol));
    inv.prices[st.t] = Math.round(next * 100) / 100;
    inv.hist[st.t] = [...(inv.hist[st.t] || []), inv.prices[st.t]].slice(-26);
  }
  let raw = 0;
  for (const o of inv.properties) {
    const it = PROPERTIES.find((x) => x.id === o.id);
    if (!it) continue;
    o.value = Math.round(o.value * (1 + (it.appreciation + gauss(rng) * 0.02) / 52));
    o.vacant = rng.chance(o.vacant ? 0.5 : 0.04);
    const net = o.vacant ? -o.value * it.upkeep / 52 : o.value * (it.rent - it.upkeep) / 52;
    o.earned += net; raw += net;
  }
  for (const o of inv.businesses) {
    const it = BUSINESSES.find((x) => x.id === o.id);
    if (!it) continue;
    const heat = it.fame ? 0.6 + p.popularity / 100 + p.hype / 250 : 1;
    const wk = o.price * (it.yield / 52) * heat * (1 + gauss(rng) * it.risk);
    o.lastWeek = Math.round(wk);
    o.earned += wk; raw += wk;
    o.value = Math.max(Math.round(o.price * 0.1), Math.round(o.value * (1 + (wk / o.price) * 0.4 + gauss(rng) * it.risk * 0.01)));
    if (it.network && rng.chance(0.02 * it.network)) { p.skills.charisma = clamp(p.skills.charisma + 0.3, 0, 100); }
    if (it.id === 'tech' && rng.chance(0.004)) { o.value *= 6; pushNews(s, `A startup backed by ${p.stageName} gets acquired`, true, 'Business'); }
    if (it.risk >= 0.5 && rng.chance(0.006)) { pushNotif(s, 'life', `Bad press: your ${it.name.toLowerCase()} is in the news for the wrong reasons`, { tab: 'world', section: 'investments' }); gainHype(p, -4); }
  }
  const capped = Math.round(softCap(raw, PASSIVE_CAP));
  if (capped >= 1) earn(s, 'invest', capped, 'Investment income (rent & business profit)');
  else if (capped <= -1) spend(s, 'invest', -capped, 'Investment losses (vacancies & business costs)');
  inv.lastIncome = capped;
  return capped;
}

// =====================================================================================
// Your own record label
// =====================================================================================
export const LABEL_STARTUP = 250000;
export const LABEL_MIN_POP = 40;
export const LABEL_STAFF = [
  { id: 'ar', name: 'A&R scout', salary: 3000, desc: 'Finds more talented prospects.' },
  { id: 'marketing', name: 'Marketing team', salary: 6000, desc: 'Releases reach further (+25%).' },
  { id: 'radio', name: 'Radio promoter', salary: 4000, desc: 'Steadier streams between releases.' },
  { id: 'legal', name: 'Business affairs', salary: 2500, desc: 'Better splits: label keeps 5% more.' },
];
export const LABEL_BUDGETS = [
  { id: 'lean', name: 'Lean', cost: 15000, mult: 1 },
  { id: 'push', name: 'Push', cost: 75000, mult: 1.8 },
  { id: 'major', name: 'Major campaign', cost: 300000, mult: 3 },
];
const FIRST = ['Nova', 'Kai', 'Luna', 'Zeke', 'Mira', 'Juno', 'Rio', 'Sasha', 'Theo', 'Ines', 'Kofi', 'Yuki', 'Lena', 'Omar', 'Ari', 'Vee', 'Dante', 'Esme', 'Jae', 'Tomi', 'Noor', 'Mateus', 'Freya', 'Ravi', 'Selin', 'Bo'];
const LAST = ['Vale', 'Monroe', 'Okafor', 'Sato', 'Reyes', 'Lund', 'Blake', 'Moreau', 'Han', 'Silva', 'Haddad', 'Novak', 'Ferreira', 'Kaur', 'Ndlovu', 'Larsen', 'Duarte', 'Ito', 'Mensah', 'Quinn'];
const SOLO = ['lilac.wav', 'Midnight Sol', 'GLASSHOUSE', 'Saint Velvet', 'paper moons', 'Kid Halcyon', 'Oyster Club', 'NEON MARIA', 'Cloudberry', 'Static Bloom', 'Low Tide', 'Ember Twins'];
const PROSPECT_GENRES = ['pop', 'hiphop', 'rnb', 'afrobeats', 'latin', 'reggaeton', 'kpop', 'electronic', 'indie', 'rock', 'country', 'alternative'];
export function labelArtistCap(talent) { return Math.pow(10, 4 + talent / 25); }
export function createOwnLabel(state, { name, logo }) {
  return run(state, (s) => {
    const p = s.player;
    const nm = String(name || '').trim().slice(0, 32);
    if (s.ownLabel) return fail('You already run a label.');
    if (!nm) return fail('Name your label.');
    if (p.popularity < LABEL_MIN_POP) return fail(`Distributors want popularity ${LABEL_MIN_POP}+ before backing a new label.`);
    if (p.cash < LABEL_STARTUP) return fail(`Startup costs ${fmtMoney(LABEL_STARTUP)}.`);
    spend(s, 'label', LABEL_STARTUP, `Founded ${nm}`);
    s.ownLabel = { name: nm, logo: logo || { shape: 0, hue: 160, seed: s.week }, founded: s.week, rep: 30, staff: {}, artists: [], prospects: [], lastScout: null, lifetime: 0, lastIncome: 0, releases: [] };
    pushNews(s, `${p.stageName} launches record label ${nm}`, true, 'Business');
    logTimeline(s, 'deal', `Founded ${nm}`, fmtMoney(LABEL_STARTUP));
    addStarPoints(s, 3);
    return { msg: `${nm} is open. Scout your first signing.` };
  });
}
export function scoutTalent(state) {
  return run(state, (s, rng) => {
    const L = s.ownLabel;
    if (!L) return fail('Start a label first.');
    if (L.lastScout === s.week) return fail('One scouting trip a week.');
    if (s.player.energy < 10) return fail('Scouting needs 10 energy.');
    if (s.player.cash < 5000) return fail('Scouting costs $5K.');
    s.player.energy -= 10;
    spend(s, 'label', 5000, 'A&R scouting trip');
    L.lastScout = s.week;
    const boost = (L.staff.ar ? 10 : 0) + L.rep / 10;
    L.prospects = Array.from({ length: 3 }, () => {
      const talent = Math.round(clamp(rng.float(25, 70) + boost + gauss(rng) * 8, 15, 95));
      const city = rng.pick(CITIES);
      const name = rng.chance(0.3) ? rng.pick(SOLO) : `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
      const ml = Math.round(rng.float(2000, 40000) * (1 + talent / 50));
      return { id: uid(s, 'pp'), name, genre: rng.pick(PROSPECT_GENRES), city: city.id, country: city.country, talent, ml, advance: Math.round((2000 + talent * talent * 12) / 100) * 100, cut: 0.6 };
    });
    return { msg: 'Your scout sent over three prospects.' };
  });
}
export function signProspect(state, { id }) {
  return run(state, (s) => {
    const L = s.ownLabel;
    const pr = L?.prospects.find((x) => x.id === id);
    if (!pr) return fail('That prospect is gone.');
    if (L.artists.length >= 6) return fail('Six artists is the most your team can handle.');
    if (L.artists.some((a) => a.name === pr.name)) return fail('Already signed.');
    if (s.player.cash < pr.advance) return fail(`Advance is ${fmtMoney(pr.advance)}.`);
    spend(s, 'label', pr.advance, `Signing advance: ${pr.name}`);
    L.prospects = L.prospects.filter((x) => x !== pr);
    L.artists.push({ ...pr, signedWeek: s.week, releases: 0, lastRelease: null, weekly: Math.round(pr.ml * 0.3), lifetime: 0, mood: 70, songs: [] });
    pushNews(s, `${L.name} signs ${pr.name}`, true, 'Business');
    return { msg: `${pr.name} signed to ${L.name}.` };
  });
}
export function dropLabelArtist(state, { id }) {
  return run(state, (s) => {
    const L = s.ownLabel;
    const a = L?.artists.find((x) => x.id === id);
    if (!a) return fail('Not on your roster.');
    L.artists = L.artists.filter((x) => x !== a);
    L.rep = clamp(L.rep - 2, 0, 100);
    return { msg: `${a.name} released from ${L.name}.` };
  });
}
export function setLabelStaff(state, { role, hire }) {
  return run(state, (s) => {
    const L = s.ownLabel;
    const st = LABEL_STAFF.find((x) => x.id === role);
    if (!L || !st) return fail('Unknown role.');
    L.staff[role] = !!hire;
    return { msg: hire ? `${st.name} hired (${fmtMoney(st.salary)}/week).` : `${st.name} let go.` };
  });
}
export function releaseLabelSingle(state, { artistId, budget = 'lean' }) {
  return run(state, (s, rng) => {
    const L = s.ownLabel;
    const a = L?.artists.find((x) => x.id === artistId);
    const b = LABEL_BUDGETS.find((x) => x.id === budget);
    if (!a || !b) return fail('Pick an artist and a budget.');
    if (a.lastRelease != null && s.week - a.lastRelease < 6) return fail(`${a.name} needs ${6 - (s.week - a.lastRelease)} more weeks in the studio.`);
    if (s.player.cash < b.cost) return fail(`Campaign costs ${fmtMoney(b.cost)}.`);
    spend(s, 'label', b.cost, `${b.name} campaign: ${a.name}`);
    const q = Math.round(clamp(a.talent * 0.7 + rng.float(5, 30) + (L.staff.ar ? 4 : 0), 20, 98));
    const mk = (L.staff.marketing ? 1.25 : 1) * (1 + L.rep / 200) * b.mult;
    const first = Math.round(a.ml * 0.9 * Math.pow(q / 60, 2) * mk * rng.float(0.7, 1.3) + 2000 * b.mult);
    const cap = labelArtistCap(a.talent);
    a.ml = Math.round(Math.min(cap, a.ml * (1 + (q / 100) * 0.6 * mk) + first * 0.25));
    a.lastRelease = s.week;
    a.releases += 1;
    a.mood = clamp(a.mood + 10, 0, 100);
    const title = `${rng.pick(['Blue', 'Velvet', 'Neon', 'Paper', 'Sugar', 'Glass', 'Gold', 'Silent', 'Wild', 'Late'])} ${rng.pick(['Hours', 'Static', 'Hearts', 'City', 'Lines', 'Summer', 'Ghost', 'Motion', 'Room', 'Signal'])}`;
    a.songs = [{ title, week: s.week, q, first }, ...(a.songs || [])].slice(0, 8);
    a.weekly = Math.max(a.weekly, first);
    L.releases = [{ artist: a.name, title, week: s.week, q, first }, ...(L.releases || [])].slice(0, 20);
    if (first > 3e6) { L.rep = clamp(L.rep + 6, 0, 100); pushNews(s, `${L.name} act ${a.name} has a breakout hit with “${title}”`, true, 'Business'); }
    else if (q < 40) L.rep = clamp(L.rep - 2, 0, 100);
    return { msg: `“${title}” by ${a.name} is out: ${fmtNum(first)} first-week streams.` };
  });
}
export const LABEL_CAP = 100000; // weekly soft cap on label profit
export function ownLabelTick(s, rng) {
  const L = s.ownLabel;
  if (!L) return 0;
  const W = s.week;
  const legal = L.staff.legal ? 0.05 : 0;
  let gross = 0;
  for (const a of L.artists) {
    const since = a.lastRelease == null ? 30 : W - a.lastRelease;
    const activity = 0.25 + 0.75 * Math.exp(-since / (L.staff.radio ? 16 : 11));
    a.weekly = Math.round(a.ml * 0.75 * activity * rng.float(0.9, 1.1));
    a.lifetime += a.weekly;
    a.ml = Math.round(Math.max(1000, a.ml * (since > 12 ? 0.985 : 0.997)));
    gross += a.weekly * PAY_PER_STREAM * (a.cut + legal);
    if (since > 26) a.mood = clamp(a.mood - 2, 0, 100);
    if (a.mood <= 10 && rng.chance(0.2)) { a.leaving = true; }
  }
  const leavers = L.artists.filter((a) => a.leaving);
  for (const a of leavers) { pushNotif(s, 'label', `${a.name} left ${L.name} after months without a release`, { tab: 'world', section: 'mylabel' }); L.rep = clamp(L.rep - 5, 0, 100); }
  L.artists = L.artists.filter((a) => !a.leaving);
  const staff = LABEL_STAFF.reduce((t, st) => t + (L.staff[st.id] ? st.salary : 0), 0) + 1500; // office & distribution
  const net = Math.round(softCap(gross, LABEL_CAP) - staff);
  if (net >= 1) earn(s, 'label', net, `${L.name} profit`);
  else if (net <= -1) spend(s, 'label', -net, `${L.name} running costs`);
  L.lifetime += net;
  L.lastIncome = net;
  L.lastGross = Math.round(gross);
  L.rep = clamp(L.rep + (L.rep < 30 ? 0.2 : -0.1), 0, 100);
  return net;
}

// =====================================================================================
// Awards calendar
// =====================================================================================
export const SUBMIT_LEAD = 6; // submissions open this many weeks before a ceremony
export function awardCalendar(s, shows, ahead = 52) {
  const out = [];
  for (let w = s.week; w <= s.week + ahead; w++) {
    const show = shows.find((a) => a.week === wkYear(w));
    if (!show) continue;
    const opens = w - SUBMIT_LEAD;
    const closes = w - 1;
    const sub = s.awardSubmission && s.awardSubmission.show === show.name && s.awardSubmission.showWeek === w ? s.awardSubmission : null;
    out.push({ ...show, showWeek: w, opens, closes, open: s.week >= opens && s.week <= closes, sub });
  }
  return out;
}
export function syncAwardHistory(s) {
  const a = s.awardEvent;
  if (!a) return;
  s.awardHistory = s.awardHistory || [];
  const h = s.awardHistory.find((x) => x.id === a.id);
  if (!h) return;
  if (a.status === 'won' || a.won) h.result = 'won';
  else if (a.status === 'done') h.result = 'lost';
}
export function recordAwardResult(s, entry) {
  s.awardHistory = [{ ...entry, week: s.week }, ...(s.awardHistory || [])].slice(0, 60);
}

// =====================================================================================
// Acting: offers by role type, script read & chemistry audition, press tour
// =====================================================================================
export const FILM_GENRES = ['Drama', 'Comedy', 'Action', 'Romance', 'Thriller', 'Sci-fi', 'Horror', 'Musical'];
export const APPROACHES = [
  { id: 'safe', name: 'Play it safe', desc: 'Hit the marks. Reliable.' },
  { id: 'bold', name: 'Big swing', desc: 'Go for a bold choice. Huge or awful.' },
  { id: 'improv', name: 'Improvise', desc: 'Make it yours. Charisma decides.' },
];
const DIRECTORS = ['Ana Kovač', 'Idris Mbeki', 'Hana Mori', 'Lucas Ortega', 'Freya Lindqvist', 'Ravi Menon', 'Chloé Martin', 'Tunde Bakare', 'Mei Lin', 'Jonah Weiss', 'Sofia Esposito', 'Kenji Arai'];
const COSTARS = ['Ellis Hart', 'Marisol Vega', 'Dev Kapoor', 'Ingrid Sol', 'Kwame Asante', 'Yuna Park', 'Leon Duval', 'Ada Novak', 'Rafael Cruz', 'Saoirse Byrne', 'Tariq Haddad', 'Lila Chen'];
export function actingOffers(s, roles, words) {
  const bucket = Math.floor(s.week / 2);
  const r = createRng(hashString(`act|${s.seed}|${bucket}`));
  const p = s.player;
  const pool = roles.filter((x) => x.minPop <= p.popularity + 12);
  if (!pool.length) return [];
  return Array.from({ length: Math.min(3, pool.length + 1) }, (_, i) => {
    const role = pool[r.int(Math.max(0, pool.length - 4), pool.length - 1)];
    const title = `${r.pick(words.a)} ${r.pick(words.b)}`;
    return {
      id: `${bucket}-${i}`, roleId: role.id, role: role.name, medium: role.medium || 'film', genre: r.pick(FILM_GENRES), title,
      director: r.pick(DIRECTORS), costar: r.pick(COSTARS), pay: Math.round(role.pay * r.float(0.8, 1.3) / 100) * 100,
      expires: bucket * 2 + 2, scenes: [r.pick(['Opening monologue', 'Argument in the rain', 'The confession', 'Chase on the rooftop', 'First meeting', 'Breakdown scene']), r.pick(['Comic beat at dinner', 'Quiet goodbye', 'The big reveal', 'Stage performance', 'Fight choreography', 'Final showdown'])],
    };
  }).filter((o, i, arr) => arr.findIndex((x) => x.title === o.title) === i);
}
const GENRE_APPROACH = { Drama: 'bold', Comedy: 'improv', Action: 'safe', Romance: 'improv', Thriller: 'safe', 'Sci-fi': 'safe', Horror: 'bold', Musical: 'bold' };
export function auditionScore(p, choice, genre, rng) {
  const act = p.skills.acting || 0;
  const base = act * 0.6 + p.skills.charisma * 0.25 + 18;
  const fit = GENRE_APPROACH[genre] === choice ? 6 : 0;
  if (choice === 'bold') return clamp(base + 6 + fit + rng.float(-20, 20), 0, 100);
  if (choice === 'improv') return clamp(base + p.skills.charisma / 8 - 5 + fit + rng.float(-16, 16), 0, 100);
  return clamp(base + fit + rng.float(-7, 7), 0, 100);
}

// =====================================================================================
// Festivals: set length, setlist and production
// =====================================================================================
export const SET_LENGTH = { headliner: 90, sub: 60, undercard: 30 };
export const FEST_PRODUCTION = [
  { id: 'basic', name: 'Band and backline', cost: 0, q: 0, viral: 0 },
  { id: 'pro', name: 'Screens and lights', cost: 60000, q: 6, viral: 0.04 },
  { id: 'spectacle', name: 'Full spectacle (pyro, dancers)', cost: 300000, q: 12, viral: 0.1 },
];
export function festSetSize(slot) { return Math.max(4, Math.round((SET_LENGTH[slot] || 30) / 3.8)); }
export function festSetScore(s, songIds, slot) {
  const songs = (songIds || []).map((id) => s.songs.find((x) => x.id === id && x.status === 'released')).filter(Boolean);
  const want = festSetSize(slot);
  if (!songs.length) return { score: 30, notes: ['No setlist yet: the band will improvise.'], want, n: 0 };
  const notes = [];
  const avgQ = songs.reduce((a, x) => a + x.quality, 0) / songs.length;
  const top = s.songs.filter((x) => x.status === 'released').sort((a, b) => (b.lifetimeStreams || 0) - (a.lifetimeStreams || 0)).slice(0, 3);
  const missing = top.filter((t) => !songs.includes(t)).length;
  let score = avgQ * 0.6 + s.player.skills.performance * 0.3 + 6;
  if (missing) { score -= missing * 4; notes.push(`Leaving out ${missing} of your biggest songs.`); }
  if (songs.length < want) { score -= (want - songs.length) * 2; notes.push(`Short set: about ${want} songs fill a ${SET_LENGTH[slot]}-minute slot.`); }
  if (songs.length > want + 2) { score -= 3; notes.push('Too many songs: you’ll run over and get cut off.'); }
  if (top[0] && songs[songs.length - 1] === top[0]) { score += 5; notes.push('Closing on your biggest song. Smart.'); }
  return { score: clamp(Math.round(score), 5, 100), notes, want, n: songs.length };
}
export const VIRAL_MOMENTS = [
  'a surprise guest walks on for the last chorus',
  'the crowd sings the whole bridge back, a cappella',
  'a rainstorm hits and nobody leaves',
  'a fan proposes in the front row during the slow song',
  'the power cuts out and the set carries on unplugged',
  'a stage dive clip racks up millions of views overnight',
];

// =====================================================================================
// Save v5 fields & migration helpers
// =====================================================================================
export function addV5Fields(s) {
  s.investments = s.investments ?? null;
  s.ownLabel = s.ownLabel ?? null;
  s.awardHistory = s.awardHistory || [];
  s.acting = s.acting || { credits: [], current: null, lastAudition: null };
  s.acting.auditions = s.acting.auditions || [];
  s.festivals = s.festivals || {};
  return s;
}
// Rebuild missing featured credits for saves made before featured songs existed.
export function rebuildFeatureCredits(s, rng) {
  const have = new Set(featuredSongs(s).map((x) => `${x.rivalId}|${x.releasedWeek}`));
  for (const t of s.timeline || []) {
    if (t.kind !== 'collab' || !/^Featured on a (.+) single$/.test(t.title)) continue;
    const name = t.title.match(/^Featured on a (.+) single$/)[1];
    const r = s.rivals.find((x) => x.name === name);
    if (!r || have.has(`${r.id}|${t.week}`)) continue;
    const so = createFeatureCredit(s, rng, r.id, t.week);
    if (!so) continue;
    const age = Math.max(0, s.week - t.week);
    const peak = r.monthlyListeners * 0.4 * Math.pow(so.quality / 70, 2) * 0.35;
    let life = 0;
    for (let a = 0; a < age; a++) life += peak * decay(so.quality, a);
    so.lifetimeStreams = Math.round(life);
    so.weeklyStreams = Math.round(peak * decay(so.quality, age));
    so.playerRevenue = Math.round(life * PAY_PER_STREAM * FEAT_SHARE);
    so.rebuilt = true;
    have.add(`${r.id}|${t.week}`);
  }
}
void labelById; void genreName;
