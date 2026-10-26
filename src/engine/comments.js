// Fan comments that react to song quality, release timing, scandals and beef.
const POOLS = {
  great: ['this is the one 🔥', 'song of the year and it\u2019s not close', 'the bridge?? I\u2019m on the floor', 'on repeat since midnight', 'this deserves a Grammy-level campaign', 'my whole group chat is obsessed', 'no skips. none.', 'chills every single time', 'the production is insane', 'this is going to be huge'],
  good: ['solid tune, adding it to my playlist', 'growing on me every listen', 'the hook is stuck in my head', 'underrated fr', 'this slaps in the car', 'ok I see the vision', 'better than the last one', 'the vocals 😮‍💨'],
  meh: ['it\u2019s fine I guess', 'not my thing tbh', 'mid. sorry.', 'sounds like everything else rn', 'the verses drag a bit', 'need more from you honestly', 'cute but forgettable'],
  bad: ['who approved this', 'skip', 'this ain\u2019t it chief', 'go back to the studio', 'unfollowing', 'what happened here 😭'],
  spam: ['another one already?? slow down', 'let the last song breathe 😭', 'quantity over quality era', 'I haven\u2019t even finished the last one', 'drop fatigue is real'],
  scandal: ['not you posting like nothing happened', 'we\u2019re still waiting on that apology', 'muted until further notice', 'the comments are a warzone lol', 'I still support you tbh'],
  beef: ['he\u2019s talking about you know who 👀', 'the shade 💀', 'popcorn ready 🍿', 'the diss was cold', 'team you, always', 'this beef is getting out of hand'],
  post: ['ok but when is the album', 'tour when??', 'you look amazing', 'drop the snippet already', 'who else got the notification', 'first!!', 'love this energy', 'the world is not ready', 'come to Manila 🇵🇭', 'come to São Paulo 🇧🇷', 'London needs a show 🇬🇧', 'Seoul loves you 🇰🇷', 'Lagos is waiting 🇳🇬', 'Mexico City pls 🇲🇽', 'Berlin? 🇩🇪'],
};
const HANDLES = ['luv', 'stan', 'beats', 'wave', 'nite', 'echo', 'vinyl', 'synth', 'moon', 'loop', 'neon', 'hook'];

export function fanComments(s, rng, { kind = 'post', song = null, n = 3 } = {}) {
  const p = s.player;
  const pools = [];
  const q = song?.quality;
  if (q != null) pools.push(q >= 75 ? POOLS.great : q >= 58 ? POOLS.good : q >= 42 ? POOLS.meh : POOLS.bad);
  if (song && song.fatigue != null && song.fatigue < 0.8) pools.push(POOLS.spam);
  if (s.crisis || (p.lastScandalWeek != null && s.week - p.lastScandalWeek < 4)) pools.push(POOLS.scandal);
  if (song?.diss || (s.drama && s.drama.status !== 'ignored')) pools.push(POOLS.beef);
  pools.push(POOLS.post);
  if (!song) pools.push(POOLS.post);
  const out = [];
  for (let i = 0; i < n; i++) {
    const pool = rng.pick(pools);
    out.push({ user: `@${rng.pick(HANDLES)}${rng.int(10, 999)}`, text: rng.pick(pool), likes: rng.int(0, Math.max(5, Math.round(Math.sqrt(p.fans) * 2))) });
  }
  return out;
}

export function songTone(song) {
  const q = song.quality;
  return q >= 75 ? 'great' : q >= 58 ? 'good' : q >= 42 ? 'meh' : 'bad';
}
export { POOLS as COMMENT_POOLS };
