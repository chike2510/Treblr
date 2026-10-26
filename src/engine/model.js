// Pure numeric models shared by the tick, charts and UI projections.
import { MARKETS, PRODUCERS, COWRITERS } from './data.js';
import { clamp } from './util.js';

export const PAY_PER_STREAM = 0.0035;

// Weekly decay curve: slight climb in week 2, then exponential decay; higher quality decays slower.
export function decay(quality, age) {
  const d = clamp(0.26 - quality / 520, 0.06, 0.26);
  if (age <= 0) return 0.85;
  if (age === 1) return 1;
  return Math.max(0.025, Math.exp(-d * (age - 1)));
}

function songMult(song) {
  const lists = 1 + 0.15 * (song.playlists || 0);
  const video = 1 + Math.min(0.5, (song.videoViews || 0) / 2e7);
  return lists * (song.viral || 1) * (song.rolloutMult || 1) * video;
}

// Weekly streams for every released player song. Two sources:
//  - discovery: algorithmic/new listeners, driven by quality, popularity and boosts (independent per song)
//  - audience: the existing fanbase + listeners, SHARED across the catalogue (so a big catalogue
//    doesn't multiply your audience — this keeps the fan/stream feedback loop stable).
export function playerStreams(player, songs, week) {
  const released = songs.filter((s) => s.status === 'released');
  const hype = 1 + player.hype / 100;
  const pull = released.map((s) => decay(s.quality, week - s.releasedWeek) * Math.pow(s.quality / 55, 2) * songMult(s));
  const totalPull = pull.reduce((a, b) => a + b, 0);
  const audience = (player.fans * 4 + player.monthlyListeners * 0.3) * hype;
  const out = {};
  released.forEach((s, i) => {
    const age = week - s.releasedWeek;
    const discovery = Math.pow(s.quality / 40, 4) * 900 * (1 + player.popularity / 35) * decay(s.quality, age) * songMult(s) * hype;
    const aud = audience * (pull[i] / Math.max(1, totalPull)) * Math.min(1, totalPull);
    out[s.id] = { discovery, audience: aud, total: discovery + aud };
  });
  return out;
}

// Rough single-song projection used by UI hints.
export function playerSongPotential(player, song) {
  return playerStreams(player, [{ ...song, status: 'released', releasedWeek: 0 }], 1)[song.id]?.total || 0;
}

export function rivalSongPotential(rival, song, age) {
  return rival.monthlyListeners * 0.5 * Math.pow(song.quality / 70, 2) * decay(song.quality, age);
}

// Share of a song's streams in each chart market (sums to < 1; remainder is rest-of-world).
export function marketShares(genre, homeCountry) {
  const raw = MARKETS.map((m) => {
    const aff = m.aff[genre] ?? 1;
    const home = m.code === homeCountry ? 3 : 1;
    return m.share * aff * home;
  });
  const rest = 0.1;
  const total = raw.reduce((a, b) => a + b, 0) + rest;
  const out = {};
  MARKETS.forEach((m, i) => { out[m.code] = raw[i] / total; });
  return out;
}

export function radioSpins(popularity, quality, age, { label = false, payola = 0 } = {}) {
  if (age > 22 || quality < 35) return 0;
  const base = Math.pow(popularity, 1.6) * (quality / 50) * Math.exp(-age / 9);
  return Math.round(base * (label ? 1.8 : 1) * (1 + payola));
}

export function lengthFit(seconds) {
  if (seconds >= 150 && seconds <= 210) return { bonus: 5, hint: 'Sweet spot for streaming and radio.' };
  if (seconds < 120) return { bonus: -6, hint: 'Very short — replayable, but feels unfinished.' };
  if (seconds < 150) return { bonus: 2, hint: 'Short and snappy. TikTok-friendly.' };
  if (seconds <= 270) return { bonus: 0, hint: 'A little long for playlists.' };
  return { bonus: -8, hint: 'Epic length. Radio will skip it.' };
}

// Deterministic part of write quality; actual write adds ±8 randomness.
export function projectWriteQuality(player, { genre, length, cowriter }) {
  const cw = COWRITERS.find((c) => c.id === cowriter) || COWRITERS[0];
  const genreFit = genre === player.genre ? 6 : 0;
  const base = 18 + player.skills.songwriting * 0.55 + cw.bonus + lengthFit(length).bonus + genreFit;
  const expected = clamp(Math.round(base), 5, 99);
  return { expected, min: clamp(expected - 8, 1, 99), max: clamp(expected + 8, 1, 100) };
}

export function projectRecordQuality(player, song, producerId) {
  const p = PRODUCERS.find((x) => x.id === producerId) || PRODUCERS[0];
  const prod = producerId === 'self' ? Math.max(p.quality, player.skills.production * 0.9) : p.quality;
  return clamp(Math.round(song.writeQuality * 0.6 + prod * 0.25 + player.skills.vocals * 0.15 + 4), 1, 100);
}
