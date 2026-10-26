// Weekly-tick subsystems for v3: burnout, tours, messages, spotlight, drama, crises, dating, awards, Wrapped.
import { clamp, uid, fmtMoney, fmtNum } from './util.js';
import { gainHype, marketShares } from './model.js';
import { VENUES, cityById, MARKETS, genreName } from './data.js';
import { earn, pushNews } from './actions.js';
import { contactForRival, openCrisis, meetPerson, endRelationship, resolveSkippedAward, ignoreCrisis } from './features.js';
import { logTimeline, pushNotif } from './journal.js';
import { gigDemand, ARTIST_CUT } from './actions.js';
import { collabQuote } from './npc.js';

// Burnout: ending weeks drained raises burnout; burnout lowers next week's energy cap.
export function applyBurnout(p) {
  const b = p.burnout || 0;
  let nb;
  if (p.energy <= 15) nb = b + 16 + (p.energy <= 0 ? 4 : 0);
  else if (p.energy >= 40) nb = b - 10;
  else nb = b - 4;
  p.burnout = clamp(nb, 0, 100);
  p.maxEnergy = Math.round(100 - p.burnout * 0.45);
  return p.burnout;
}

export function resolveTourWeek(s, rng, ev) {
  const t = s.tour;
  if (!t) return null;
  const v = VENUES.find((x) => x.id === t.venueId);
  const p = s.player;
  const nights = [];
  for (const stop of t.stops) {
    if (stop.done || stop.week > s.week) continue;
    const demand = gigDemand(s, stop.cityId) * rng.float(0.85, 1.25) * (1 + nights.length * 0.02);
    const sold = Math.min(v.capacity, Math.round(demand));
    const gross = Math.round(sold * v.ticket * ARTIST_CUT * (p.staff.booking ? 1.2 : 1));
    const fans = Math.round(sold * rng.float(0.08, 0.18) * (1 + p.skills.performance / 120));
    stop.done = true; stop.sold = sold; stop.gross = gross; stop.fans = fans; stop.soldOut = sold >= v.capacity;
    t.gross += gross; t.fans += fans; if (stop.soldOut) { t.sellouts += 1; p.sellouts += 1; }
    p.fans += fans;
    p.fanHeat[stop.cityId] = (p.fanHeat[stop.cityId] || 0) + fans;
    earn(s, 'gigs', gross, `Tour: ${v.name}, ${cityById(stop.cityId).name}`);
    nights.push({ city: cityById(stop.cityId).name, flag: cityById(stop.cityId).flag, sold, cap: v.capacity, gross, fans, soldOut: stop.soldOut });
  }
  if (nights.length) {
    gainHype(p, 2 * nights.length);
    p.skills.performance = clamp(p.skills.performance + 0.5 * nights.length * (1 - p.skills.performance / 100), 0, 100);
    ev(55, 'tour', { city: nights[nights.length - 1].city });
  }
  const left = t.stops.filter((x) => !x.done).length;
  const result = { venue: v.name, nights, left, gross: t.gross };
  if (!left) {
    pushNews(s, `${p.stageName} wraps a ${t.stops.length}-city tour${t.sellouts ? ` with ${t.sellouts} sell-outs` : ''}`, true, 'Live');
    logTimeline(s, 'tour', `Tour wrapped: ${t.stops.length} shows`, `${fmtMoney(t.gross)} gross · ${t.sellouts} sell-outs`);
    pushNotif(s, 'tour', `Tour wrapped: ${fmtMoney(t.gross)} gross`, { tab: 'world', section: 'tours' });
    s.tour = null;
    result.wrapped = true;
  }
  return result;
}

// ---------- messages ----------
const MSG = {
  manager: [
    { text: 'Real talk: what\u2019s the release plan?', choices: [{ label: 'Pace it — every 4–5 weeks', fx: { rel: 6, followUp: 'Smart. Let each one breathe.' } }, { label: 'Flood the market', fx: { rel: -4, hype: 2, followUp: 'Your funeral. Fans burn out too.' } }] },
    { text: 'A brand rep wants coffee. Free networking, costs you an afternoon.', choices: [{ label: 'I\u2019ll go', fx: { rel: 5, energy: 10, hype: 2 } }, { label: 'Pass, I\u2019m writing', fx: { rel: -1, skill: 'songwriting', amount: 0.5 } }] },
    { text: 'You look exhausted in your stories. Take a breather?', choices: [{ label: 'You\u2019re right', fx: { rel: 4, burnout: -8 } }, { label: 'No days off', fx: { rel: -2, hype: 1 } }] },
  ],
  producer: [
    { text: 'Just cooked a beat that sounds like you. Want it?', choices: [{ label: 'Send it! 🔥', fx: { rel: 7, skill: 'songwriting', amount: 0.6 } }, { label: 'Busy this week', fx: { rel: -3 } }] },
    { text: 'Studio session Thursday? I\u2019ll teach you my drum tricks.', choices: [{ label: 'I\u2019m there', fx: { rel: 6, energy: 10, skill: 'production', amount: 1 } }, { label: 'Can\u2019t make it', fx: { rel: -2 } }] },
    { text: 'Be honest, did you like the mix on the last one?', choices: [{ label: 'Loved it', fx: { rel: 5 } }, { label: 'Vocals were buried', fx: { rel: -2, skill: 'production', amount: 0.4, followUp: 'Fair. I\u2019ll fix it next time.' } }] },
  ],
  friend: [
    { text: 'Night out this weekend? You need it.', choices: [{ label: 'Let\u2019s go 🎉', fx: { rel: 6, energy: 10, burnout: -6 } }, { label: 'Staying in to write', fx: { rel: -3, skill: 'songwriting', amount: 0.4 } }] },
    { text: 'Played your song for my coworkers, they want merch lol', choices: [{ label: 'Haha tell them soon', fx: { rel: 4, fans: 5 } }, { label: 'Stop embarrassing me 😭', fx: { rel: 2 } }] },
    { text: 'Met someone cool at my cousin\u2019s gallery opening. Want me to introduce you?', choices: [{ label: 'Sure, why not', fx: { rel: 3, meet: true } }, { label: 'Not now', fx: { rel: 0 } }] },
  ],
  artist: [
    { text: 'Been seeing your name around. Keep going 🙏', choices: [{ label: 'Means a lot! Collab someday?', fx: { rel: 6 } }, { label: 'Appreciate you', fx: { rel: 3 } }, { label: 'Who\u2019s this?', fx: { rel: -10, hype: 2 } }] },
    { text: 'You going to the awards this year?', choices: [{ label: 'Hopefully! See you there', fx: { rel: 4 } }, { label: 'Awards are overrated', fx: { rel: -2, hype: 1 } }] },
  ],
  person: [
    { text: 'Coffee this week? ☕', choices: [{ label: 'Yes!', fx: { rel: 8 } }, { label: 'Can\u2019t, studio week', fx: { rel: -4 } }] },
    { text: 'Your new song is all I\u2019ve listened to today 🙈', choices: [{ label: 'Stop, you\u2019re sweet', fx: { rel: 6 } }, { label: 'Ha, thanks', fx: { rel: 2 } }] },
  ],
  partner: [
    { text: 'Miss you. Dinner when you\u2019re back?', choices: [{ label: 'Can\u2019t wait ❤️', fx: { rel: 6, burnout: -4 } }, { label: 'This week is crazy', fx: { rel: -6 } }] },
    { text: 'Saw the comments about us online. You ok?', choices: [{ label: 'Ignore them, I\u2019ve got you', fx: { rel: 8 } }, { label: 'Maybe we keep it low-key', fx: { rel: -2 } }] },
  ],
};
export const MESSAGE_TEMPLATES = MSG;

export function weeklyMessages(s, rng) {
  for (const c of s.contacts) {
    const pool = MSG[c.role];
    if (!pool) continue;
    const pending = c.thread.some((m) => m.from === 'them' && m.choices && !m.answered);
    if (pending) continue;
    const chance = c.role === 'artist' ? (c.rel >= 10 ? 0.08 : 0) : c.role === 'partner' ? 0.5 : 0.22;
    if (!rng.chance(chance)) continue;
    const t = rng.pick(pool);
    c.thread.push({ from: 'them', text: t.text, week: s.week, choices: t.choices.map((x) => ({ ...x, fx: { ...x.fx } })), answered: false });
    if (c.thread.length > 40) c.thread.splice(0, c.thread.length - 40);
    c.unread = (c.unread || 0) + 1;
    pushNotif(s, 'message', `${c.name}: ${t.text}`, { tab: 'phone', app: 'treblrchat', contact: c.id });
  }
  // partner neglect & breakups
  const p = s.player;
  if (p.relationship.status === 'dating') {
    const c = s.contacts.find((x) => x.id === p.relationship.partnerId);
    if (c) {
      if (c.lastDate == null || s.week - c.lastDate > 2) c.rel = clamp(c.rel - 4, -100, 100);
      if (c.rel < 20 && rng.chance(0.4)) endRelationship(s, c, 'them');
    }
  }
  // meeting new (fictional) people
  if (p.fans >= 100 && rng.chance(0.07)) meetPerson(s, rng, rng.pick(['an industry party', 'a listening session', 'the gym', 'a festival', 'a friend\u2019s birthday']));
}

// ---------- spotlight ----------
export function pickSpotlight(s, rng, prevCharts) {
  const hot = s.charts.hot100 || [];
  const cand = [];
  for (const e of hot.slice(0, 20)) {
    if (e.pl) continue;
    const song = s.rivalSongs.find((x) => x.id === e.id);
    if (!song) continue;
    if (e.r === 1 && e.p !== 1) cand.push({ song, text: `takes #1 on the Hot 100 with “${song.title}”`, w: 5 });
    else if (e.p == null && e.r <= 10) cand.push({ song, text: `debuts “${song.title}” at #${e.r} on the Hot 100`, w: 4 });
    else if (e.p == null) cand.push({ song, text: `enters the Hot 100 at #${e.r} with “${song.title}”`, w: 1 });
  }
  void prevCharts;
  if (!cand.length) return null;
  const c = rng.weighted(cand, (x) => x.w);
  const r = s.rivals.find((x) => x.id === c.song.rivalId);
  return { id: uid(s, 'sp'), week: s.week, rivalId: r.id, songId: c.song.id, text: `${r.name} ${c.text}`, resolved: null };
}

// ---------- beef & drama ----------
const SUBTWEETS = [
  'some new artists think one viral clip makes them a star 🙄',
  'imagine copying someone\u2019s whole sound and calling it original',
  'charts don\u2019t lie. some people\u2019s PR teams do 🤷',
  'everybody\u2019s a “global artist” until the tour tickets don\u2019t sell',
  'not naming names but the industry plant smell is strong this week',
  'stay humble. some of y\u2019all forgot already',
];
export function maybeDrama(s, rng) {
  if (s.drama && s.drama.status === 'open' && s.week - s.drama.week < 2) return null;
  if (s.drama && s.drama.status === 'open') s.drama.status = 'ignored';
  const p = s.player;
  const beefers = s.contacts.filter((c) => c.beef && c.rivalId);
  const chance = (p.popularity >= 30 ? 0.04 : p.popularity >= 15 ? 0.015 : 0) + beefers.length * 0.12;
  if (!rng.chance(chance)) return null;
  let rival;
  if (beefers.length && rng.chance(0.7)) rival = s.rivals.find((r) => r.id === rng.pick(beefers).rivalId);
  else {
    const near = s.rivals.slice().sort((a, b) => Math.abs(Math.log10(a.monthlyListeners) - Math.log10(p.monthlyListeners * 8 + 1e5)) - Math.abs(Math.log10(b.monthlyListeners) - Math.log10(p.monthlyListeners * 8 + 1e5))).slice(0, 10);
    rival = rng.pick(near);
  }
  if (!rival) return null;
  const text = rng.pick(SUBTWEETS);
  s.drama = { id: uid(s, 'dr'), rivalId: rival.id, text, week: s.week, status: 'open', likes: Math.round(Math.sqrt(rival.monthlyListeners) * rng.float(4, 12)) };
  contactForRival(s, rival.id);
  pushNotif(s, 'beef', `${rival.name} subtweeted you on TreblrX 👀`, { tab: 'phone', app: 'treblrx' });
  pushNews(s, `Fans think ${rival.name}\u2019s latest post is aimed at ${p.stageName}`, true, 'Beef');
  return s.drama;
}

// ---------- crises ----------
export function crisisTick(s, rng) {
  if (s.crisis && s.week >= s.crisis.deadline) {
    const r = ignoreCrisis(s, rng);
    pushNotif(s, 'crisis', `Crisis left unanswered: ${r.msg}`, { tab: 'home' });
  }
  const p = s.player;
  if (s.crisis) return;
  if (p.popularity >= 20 && rng.chance(0.015)) {
    const kinds = [
      ['leak', 'Unreleased demos leak online', 'A hard drive went missing and your rough demos are everywhere.'],
      ['rant', 'Old posts resurface', 'Someone dug up your posts from years ago. People have questions.'],
    ];
    if (p.relationship.status === 'dating') kinds.push(['dating', 'Tabloids question your relationship', 'Blurry photos and a “source close to the couple” are doing numbers.']);
    const [k, t, x] = rng.pick(kinds);
    openCrisis(s, k, t, x);
  }
}

// ---------- awards ----------
export function awardNomination(s, rng, show, rivalById) {
  const p = s.player;
  const contender = (p.bestRank && p.bestRank <= 40) || p.popularity >= 55;
  if (!contender) {
    const top = Object.values(rivalById).sort((a, b) => b.monthlyListeners - a.monthlyListeners);
    pushNews(s, `${rng.pick(top.slice(0, 6)).name} sweeps the ${show.name}`, false, 'Awards');
    return null;
  }
  const winChance = clamp(0.2 + (p.popularity - 50) / 100 + (p.bestRank && p.bestRank <= 10 ? 0.25 : 0), 0.1, 0.85);
  const category = rng.pick(['Breakthrough Artist', `Best ${genreName(p.genre)} Act`, 'Song of the Year', 'Fan Favourite', 'Best Collaboration', 'Video of the Year']);
  const nominees = s.rivals.filter((r) => r.genres.includes(p.genre) || r.tier === 'superstar').sort(() => rng.next() - 0.5).slice(0, 4);
  s.awardEvent = { id: uid(s, 'aw'), show: show.name, week: s.week, category, winChance, nominees: nominees.map((r) => r.id), winnerName: nominees[0]?.name || 'A rival', status: 'pending' };
  pushNews(s, `${p.stageName} nominated for ${category} at the ${show.name}`, true, 'Awards');
  pushNotif(s, 'award', `You\u2019re nominated for ${category} at the ${show.name}!`, { tab: 'home', awards: true });
  return s.awardEvent;
}
export function awardTick(s, rng) {
  if (s.awardEvent && s.awardEvent.status === 'pending' && s.awardEvent.week < s.week) resolveSkippedAward(s, rng);
  if (s.awardEvent && s.awardEvent.status === 'won' && s.awardEvent.week < s.week) s.awardEvent.status = 'done';
}

// ---------- year stats & Wrapped ----------
export function trackYear(s, totalStreams, songStreams) {
  const y = s.yearStats;
  y.streams += totalStreams;
  for (const [id, n] of Object.entries(songStreams)) y.songs[id] = (y.songs[id] || 0) + n;
  const sh = marketShares(s.player.genre, s.player.country);
  for (const m of MARKETS) y.countries[m.code] = (y.countries[m.code] || 0) + totalStreams * sh[m.code];
}

export function artistType(s, y) {
  const p = s.player;
  const top = Object.entries(y.songs).sort((a, b) => b[1] - a[1]);
  const share = top.length && y.streams ? top[0][1] / y.streams : 0;
  if (!y.streams) return { name: 'The Late Bloomer', desc: 'The year was for building. Next year is for showing.' };
  if (p.sellouts >= 10) return { name: 'The Road Warrior', desc: 'You lived on stages this year.' };
  if (share > 0.6) return { name: 'The One-Hit Wonder (for now)', desc: 'One song carried your year. Time to prove it wasn\u2019t luck.' };
  if (top.length >= 8) return { name: 'The Workhorse', desc: 'A deep catalogue, all of it moving.' };
  if (p.hype >= 50) return { name: 'The Main Character', desc: 'Everyone was talking about you.' };
  return { name: 'The Rising Force', desc: 'Steady, strategic, and climbing.' };
}

export function makeWrapped(s, W) {
  const y = s.yearStats;
  const p = s.player;
  const year = Math.round(W / 52);
  const topSongs = Object.entries(y.songs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ id, title: s.songs.find((x) => x.id === id)?.title || '—', streams: Math.round(n) }));
  const topCountries = Object.entries(y.countries).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([code, n]) => ({ code, name: MARKETS.find((m) => m.code === code)?.name, flag: MARKETS.find((m) => m.code === code)?.flag, streams: Math.round(n) }));
  const w = { year, week: W, streams: Math.round(y.streams), listeners: p.monthlyListeners, listenersStart: y.startListeners, fans: p.fans, fansStart: y.startFans, bestPeak: y.bestPeak, topSongs, topCountries, type: artistType(s, y), awards: (p.awards || []).filter((a) => a.kind === 'award' && a.week > W - 52).length };
  s.wrapped.push(w);
  s.yearStats = { streams: 0, songs: {}, countries: {}, bestPeak: null, startListeners: p.monthlyListeners, startFans: p.fans };
  logTimeline(s, 'wrapped', `Year ${year} Wrapped`, `${fmtNum(w.streams)} streams`);
  pushNotif(s, 'wrapped', `Your Year ${year} Wrapped is ready 🎁`, { tab: 'home', wrapped: year });
  return w;
}

export { collabQuote };
