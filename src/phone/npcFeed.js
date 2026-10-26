// Deterministic NPC social content per week (no real song titles: uses generated NPC titles).
import { createRng, hashString, CITIES } from '../engine/index.js';

const LINES = [
  (t) => `“${t}” out now. go stream it 🖤`, () => 'studio. that\u2019s the tweet.', (t, c) => `thank you ${c} 🙏 what a night`, () => 'new era loading…',
  () => 'can\u2019t sleep, writing instead', (t) => `the response to “${t}” has been unreal`, () => 'tour announcement soon 👀', () => 'who\u2019s ready',
  () => 'grateful for every single one of you', (t, c) => `${c} you were LOUD tonight`, () => 'mood: rehearsals all day', () => 'sending love to the fans who\u2019ve been here since day one',
];
export function topRivals(state, n = 30) {
  return state.rivals.slice().sort((a, b) => b.monthlyListeners - a.monthlyListeners).slice(0, n);
}
export function npcPosts(state, n = 8, salt = 'x') {
  const rng = createRng(hashString(`feed${salt}${state.week}`));
  const pool = topRivals(state, 60);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = rng.weighted(pool, (x) => Math.sqrt(x.monthlyListeners));
    const songs = state.rivalSongs.filter((x) => x.rivalId === r.id).sort((a, b) => b.releasedWeek - a.releasedWeek);
    const title = songs[0]?.title || 'new music';
    const city = rng.pick(CITIES).name;
    const reach = Math.sqrt(r.monthlyListeners);
    out.push({ id: `np${salt}${i}`, rival: r, text: rng.pick(LINES)(title, city), likes: Math.round(reach * rng.float(8, 40)), reposts: Math.round(reach * rng.float(1, 5)), comments: Math.round(reach * rng.float(0.5, 3)), gradient: rng.int(0, 7), week: state.week - rng.int(0, 1), songTitle: title, songId: songs[0]?.id });
  }
  return out;
}
export function trendingSounds(state, n = 8) {
  return state.rivalSongs.slice().sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, n).map((s) => ({ ...s, rival: state.rivals.find((r) => r.id === s.rivalId), uses: Math.round(s.weeklyStreams / 40) }));
}
export function hashtags(state) {
  const rng = createRng(hashString(`tags${state.week}`));
  const base = ['#NewMusicFriday', '#TreblrTop100', '#StudioSession', '#TourLife', '#Unreleased', '#Grammys2027', '#ChartWatch', '#OnRepeat'];
  const t = trendingSounds(state, 3).map((x) => `${x.rival?.name || ''}`).filter(Boolean);
  return rng.shuffle([...base.slice(0, 5), ...t]).slice(0, 7).map((tag) => ({ tag, posts: rng.int(8, 900) * 1000 }));
}
export const handleOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');
