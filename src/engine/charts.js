import { CHARTS, MARKETS } from './data.js';
import { marketShares, decay } from './model.js';

const shareCache = new Map();
function shares(genre, country) {
  const k = `${genre}|${country}`;
  if (!shareCache.has(k)) shareCache.set(k, marketShares(genre, country));
  return shareCache.get(k);
}

function songCandidates(state) {
  const out = [];
  for (const s of state.songs) {
    if (s.status !== 'released' || !s.weeklyStreams) continue;
    out.push({ id: s.id, pl: true, streams: s.weeklyStreams, radio: s.radio || 0, sh: shares(s.genre, state.player.country) });
  }
  const rivalById = Object.fromEntries(state.rivals.map((r) => [r.id, r]));
  for (const s of state.rivalSongs) {
    if (!s.weeklyStreams) continue;
    out.push({ id: s.id, pl: false, streams: s.weeklyStreams, radio: s.radio || 0, sh: shares(s.genre, rivalById[s.rivalId]?.country) });
  }
  return out;
}

function albumCandidates(state) {
  const out = [];
  for (const rel of state.releases) {
    if (rel.status !== 'out' || rel.type === 'single') continue;
    const streams = rel.songIds.reduce((a, id) => a + (state.songs.find((s) => s.id === id)?.weeklyStreams || 0), 0);
    const age = state.week - rel.releaseWeek;
    out.push({ id: rel.id, pl: true, score: streams + state.player.fans * 0.4 * decay(60, age) });
  }
  const rivalById = Object.fromEntries(state.rivals.map((r) => [r.id, r]));
  for (const a of state.rivalAlbums) {
    const r = rivalById[a.rivalId];
    if (!r) continue;
    out.push({ id: a.id, pl: false, score: r.monthlyListeners * 0.12 * decay(70, state.week - a.releasedWeek) });
  }
  return out;
}

function rank(cands, scoreFn, size, prev) {
  const prevMap = Object.fromEntries((prev || []).map((e) => [e.id, e]));
  return cands
    .map((c) => ({ c, score: scoreFn(c) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, size)
    .map(({ c, score }, i) => {
      const p = prevMap[c.id];
      const r = i + 1;
      return { id: c.id, pl: c.pl, r, p: p ? p.r : null, pk: p ? Math.min(p.pk, r) : r, w: p ? p.w + 1 : 1, s: Math.round(score) };
    });
}

export function computeCharts(state, prev = {}) {
  const songs = songCandidates(state);
  const albums = albumCandidates(state);
  const charts = {};
  for (const ch of CHARTS) {
    if (ch.id === 'hot100') charts[ch.id] = rank(songs, (c) => c.streams + c.radio * 900, ch.size, prev[ch.id]);
    else if (ch.id === 'global') charts[ch.id] = rank(songs, (c) => c.streams, ch.size, prev[ch.id]);
    else if (ch.id === 'radio') charts[ch.id] = rank(songs, (c) => c.radio, ch.size, prev[ch.id]);
    else if (ch.id === 'album') charts[ch.id] = rank(albums, (c) => c.score, ch.size, prev[ch.id]);
    else if (ch.market) charts[ch.id] = rank(songs, (c) => c.streams * (c.sh[ch.market] || 0), ch.size, prev[ch.id]);
  }
  return charts;
}

export function movement(entry) {
  if (entry.p == null) return { kind: 'new', label: 'NEW' };
  if (entry.p > entry.r) return { kind: 'up', label: `▲${entry.p - entry.r}` };
  if (entry.p < entry.r) return { kind: 'down', label: `▼${entry.r - entry.p}` };
  return { kind: 'same', label: '—' };
}

export function chartItem(state, chartId, entry) {
  const ch = CHARTS.find((c) => c.id === chartId);
  if (ch?.kind === 'albums') {
    if (entry.pl) {
      const rel = state.releases.find((r) => r.id === entry.id);
      return { title: rel?.title || '—', artist: state.player.stageName, cover: rel?.cover, pl: true };
    }
    const a = state.rivalAlbums.find((x) => x.id === entry.id);
    const r = state.rivals.find((x) => x.id === a?.rivalId);
    return { title: a?.title || '—', artist: r?.name || '—', cover: a?.cover, pl: false };
  }
  if (entry.pl) {
    const s = state.songs.find((x) => x.id === entry.id);
    return { title: s?.title || '—', artist: state.player.stageName, cover: s?.cover, pl: true };
  }
  const s = state.rivalSongs.find((x) => x.id === entry.id);
  const r = state.rivals.find((x) => x.id === s?.rivalId);
  return { title: s?.title || '—', artist: r?.name || '—', cover: s?.cover, pl: false, country: r?.country };
}

// All chart positions currently held by the player.
export function playerPositions(state) {
  const out = [];
  for (const ch of CHARTS) {
    for (const e of state.charts[ch.id] || []) {
      if (e.pl) out.push({ chartId: ch.id, chartName: ch.short || ch.name, ...e, title: chartItem(state, ch.id, e).title });
    }
  }
  return out;
}

export { MARKETS };
