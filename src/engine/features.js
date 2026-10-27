// v3 player actions: training, weekly goals, eras, messages, spotlight, beef, live, dating,
// notifications, collabs, award shows, PR crises, tours, artist photos, TreblrTok creation.
import { run, spend, earn, pushNews, bump, writeSong, ENERGY, SOCIAL, promoteClip } from './actions.js';
import { clamp, uid, fmtMoney, fmtNum } from './util.js';
import { gainHype } from './model.js';
import { TRAINING, ERA_COLORS, ERA_VIBES, OUTFITS, SPEECHES, VENUES, cityById, FICTIONAL_PEOPLE, venueUnlocked, venueLockReason } from './data.js';
import { collabQuote, tierLabel } from './npc.js';
import { scaledCollabQuote, genreFit, rivalBusy } from './v5.js';
import { weeklyProgress, stat } from './weekly.js';
import { logTimeline, pushNotif } from './journal.js';
import { sameLabel, setlistScore, tourStaffCost, ownsKind } from './business.js';
import { addStarPoints, statPost } from './career.js';

const fail = (msg) => ({ ok: false, msg });

// ---------- contacts ----------
export function contactForRival(s, rivalId, create = true) {
  let c = s.contacts.find((x) => x.rivalId === rivalId);
  if (!c && create) {
    const r = s.rivals.find((x) => x.id === rivalId);
    if (!r) return null;
    c = { id: `c_${rivalId}`, name: r.name, role: 'artist', rivalId, rel: 0, thread: [], unread: 0, real: r.real };
    s.contacts.push(c);
  }
  return c;
}
export const relOf = (s, rivalId) => s.contacts?.find((x) => x.rivalId === rivalId)?.rel ?? 0;
const relBump = (c, d) => { c.rel = clamp(Math.round(c.rel + d), -100, 100); };

// ---------- training ----------
export function trainSkill(state, { skill }) {
  return run(state, (s) => {
    const t = TRAINING.find((x) => x.id === skill);
    if (!t) return fail('Pick a skill to train.');
    const p = s.player;
    const lvl = p.skills[skill];
    const cost = Math.round(t.base + lvl * 4);
    if (p.energy < t.energy) return fail('Not enough energy to train.');
    if (p.cash < cost) return fail(`${t.name} costs ${fmtMoney(cost)}.`);
    // No hard weekly cap: energy and cash limit you. Repeating the same skill in one week
    // gives less each time (focus fades); switching skills keeps full value.
    const reps = s.weekStats?.['train_' + skill] || 0;
    const focus = trainingFocus(reps);
    p.energy -= t.energy;
    spend(s, 'training', cost, t.name);
    const before = p.skills[skill];
    bump(p, skill, 3.4 * focus);
    stat(s, 'train');
    stat(s, 'train_' + skill);
    const note = focus < 1 ? ` (${Math.round(focus * 100)}% focus: try a different skill)` : '';
    return { msg: `${t.name}: ${skill} ${Math.round(before)} → ${Math.round(p.skills[skill] * 10) / 10}${note}.` };
  });
}
export const TRAINING_FOCUS = [1, 0.7, 0.5, 0.35, 0.25];
export const trainingFocus = (reps) => TRAINING_FOCUS[Math.min(reps, TRAINING_FOCUS.length - 1)];
export function trainingCost(p, skill) {
  const t = TRAINING.find((x) => x.id === skill);
  return t ? Math.round(t.base + p.skills[skill] * 4) : 0;
}

// ---------- weekly goals ----------
export function claimWeeklyGoal(state, { id }) {
  return run(state, (s) => {
    const g = s.weekly?.goals.find((x) => x.id === id);
    if (!g) return fail('Goal not found.');
    if (g.claimed) return fail('Already claimed.');
    if (weeklyProgress(s, g) < g.target) return fail('Not done yet.');
    g.claimed = true;
    const r = g.reward;
    if (r.cash) earn(s, 'rewards', r.cash, `Weekly goal: ${g.label}`);
    if (r.hype) gainHype(s.player, r.hype);
    if (r.skill) bump(s.player, r.skill, r.amount);
    return { msg: `Goal claimed: ${g.label}.` };
  });
}

// ---------- eras ----------
export function startEra(state, { name, color, vibe }) {
  return run(state, (s) => {
    if (!name?.trim()) return fail('Name your era.');
    const v = ERA_VIBES.find((x) => x.id === vibe) || ERA_VIBES[0];
    const col = ERA_COLORS.includes(color) ? color : ERA_COLORS[0];
    const cur = s.eras.find((e) => e.id === s.eraId);
    if (cur && s.week - cur.startWeek < 4) return fail('Give this era at least 4 weeks before moving on.');
    if (cur) cur.endWeek = s.week;
    const era = { id: uid(s, 'era'), name: name.trim(), color: col, vibe: v.id, startWeek: s.week, endWeek: null };
    s.eras.push(era);
    s.eraId = era.id;
    const p = s.player;
    if (v.bonus.hype) gainHype(p, v.bonus.hype);
    if (v.bonus.performance) bump(p, 'performance', v.bonus.performance);
    if (v.bonus.charisma) bump(p, 'charisma', v.bonus.charisma);
    logTimeline(s, 'era', `The ${era.name} era begins`, `${v.name} vibe`);
    pushNews(s, `${p.stageName} announces the “${era.name}” era`, true, 'Era');
    return { msg: `Welcome to the ${era.name} era.`, data: era };
  });
}

// ---------- messages ----------
export function replyMessage(state, { contactId, choice }) {
  return run(state, (s, rng) => {
    const c = s.contacts.find((x) => x.id === contactId);
    if (!c) return fail('Contact not found.');
    const m = [...c.thread].reverse().find((x) => x.from === 'them' && x.choices && !x.answered);
    if (!m) return fail('Nothing to reply to.');
    const ch = m.choices[choice];
    if (!ch) return fail('Pick a reply.');
    const fx = ch.fx || {};
    const p = s.player;
    if (fx.energy && p.energy < fx.energy) return fail(`That needs ${fx.energy} energy.`);
    if (fx.cost && p.cash < fx.cost) return fail(`That costs ${fmtMoney(fx.cost)}.`);
    m.answered = true;
    c.thread.push({ from: 'me', text: ch.reply || ch.label, week: s.week });
    if (fx.rel) relBump(c, fx.rel);
    if (fx.hype) gainHype(p, fx.hype);
    if (fx.energy) p.energy -= fx.energy;
    if (fx.cost) spend(s, 'other', fx.cost, `${c.name}`);
    if (fx.burnout) p.burnout = clamp((p.burnout || 0) + fx.burnout, 0, 100);
    if (fx.skill) bump(p, fx.skill, fx.amount || 0.6);
    if (fx.fans) p.fans += fx.fans;
    if (fx.followUp) c.thread.push({ from: 'them', text: fx.followUp, week: s.week });
    if (fx.meet) meetPerson(s, rng, 'a gallery opening');
    c.unread = 0;
    stat(s, 'message');
    return { msg: `Replied to ${c.name}.` };
  });
}

export function messageArtist(state, { rivalId }) {
  return run(state, (s, rng) => {
    const c = contactForRival(s, rivalId);
    if (!c) return fail('Unknown artist.');
    if (c.lastHi === s.week) return fail('You already reached out this week.');
    if (s.player.socialEnergy < 5) return fail('Out of social energy.');
    s.player.socialEnergy -= 5;
    c.lastHi = s.week;
    const r = s.rivals.find((x) => x.id === rivalId);
    const q = collabQuote(s.player, r, c.rel);
    c.thread.push({ from: 'me', text: rng.pick(['Big fan of your work 🙏', 'Would love to get in a room sometime', 'Your last drop was crazy', 'Congrats on the run you\u2019re having']), week: s.week });
    const warm = rng.chance(clamp(0.25 + c.rel / 150 - q.gap / 200 + s.player.skills.charisma / 300, 0.05, 0.95));
    if (warm) {
      relBump(c, rng.int(3, 7));
      c.thread.push({ from: 'them', text: rng.pick(['appreciate you 🙌', 'yo thank you! keep going', 'saw your stuff, it\u2019s fire', 'let\u2019s link when I\u2019m in town', 'respect 🙏']), week: s.week });
    } else {
      c.thread.push({ from: 'them', text: '(Seen)', week: s.week, system: true });
    }
    stat(s, 'message');
    return { msg: warm ? `${r.name} replied.` : `${r.name} left you on read.`, data: { warm } };
  });
}

export function readContact(state, { contactId }) {
  return run(state, (s) => { const c = s.contacts.find((x) => x.id === contactId); if (c) c.unread = 0; });
}

// ---------- spotlight ----------
export function spotlightReact(state, { choice }) {
  return run(state, (s, rng) => {
    const sp = s.spotlight;
    if (!sp || sp.resolved) return fail('Nothing in the spotlight.');
    const r = s.rivals.find((x) => x.id === sp.rivalId);
    const c = contactForRival(s, sp.rivalId);
    sp.resolved = choice;
    const p = s.player;
    if (choice === 'react') {
      relBump(c, 8);
      gainHype(p, 2);
      p.fans += Math.round(5 + Math.sqrt(r.monthlyListeners) * 0.02);
      c.thread.push({ from: 'them', text: rng.pick(['appreciate the love 🙏', 'thank you!! means a lot', 'ayy good looks']), week: s.week });
      return { msg: `You showed love to ${r.name}. Relationship up.` };
    }
    relBump(c, -25);
    gainHype(p, 8);
    c.beef = true;
    pushNews(s, `${p.stageName} takes a shot at ${r.name} online`, true, 'Beef');
    logTimeline(s, 'beef', `Started beef with ${r.name}`, 'Diss on TreblrX');
    if (rng.chance(0.25 + Math.max(0, (r.basePop - 80)) / 100)) {
      openCrisis(s, 'beef', `${r.name}\u2019s fans swarm your mentions`, `Your diss aimed at ${r.name} backfired. Their fanbase is flooding your comments.`);
      return { msg: `Shots fired at ${r.name}… and their fans fired back.` };
    }
    return { msg: `Shots fired at ${r.name}. Hype up — watch your back.` };
  });
}

// ---------- beef & drama ----------
export function respondDrama(state, { choice, title }) {
  const d0 = state.drama;
  if (!d0 || d0.status !== 'open') return { state, ok: false, msg: 'No drama to respond to.' };
  if (choice === 'diss') {
    const r = state.rivals.find((x) => x.id === d0.rivalId);
    const w = writeSong(state, { title: title || `Dear ${r.name.split(' ')[0]}`, genre: state.player.genre, theme: 'Diss', length: 170, cowriter: 'none', diss: d0.rivalId });
    if (!w.ok) return w;
    return run(w.state, (s) => {
      s.drama.status = 'diss';
      const c = contactForRival(s, d0.rivalId);
      relBump(c, -20); c.beef = true;
      gainHype(s.player, 4);
      logTimeline(s, 'beef', `Wrote a diss track aimed at ${r.name}`, `“${w.data.title}”`);
      return { msg: `Diss track “${w.data.title}” written (Q${w.data.quality}). Record and release it for maximum heat — it\u2019s risky.` };
    });
  }
  return run(state, (s, rng) => {
    const d = s.drama;
    const r = s.rivals.find((x) => x.id === d.rivalId);
    const c = contactForRival(s, d.rivalId);
    const p = s.player;
    if (choice === 'reply') {
      if (p.socialEnergy < SOCIAL.chirp) return fail('Out of social energy.');
      p.socialEnergy -= SOCIAL.chirp;
      d.status = 'replied';
      relBump(c, -8);
      gainHype(p, 6);
      s.social.chirp.unshift({ id: uid(s, 'c'), week: s.week, text: rng.pick(['some of y\u2019all should focus on your own music 🤷', 'I\u2019ll let the numbers talk', 'love that I live in your head rent free', 'keep my name out your mouth, respectfully']), likes: Math.round(Math.sqrt(p.followers.chirp) * 30), reposts: Math.round(Math.sqrt(p.followers.chirp) * 6), replies: [], mine: true, quote: d.text });
      if (rng.chance(0.2)) openCrisis(s, 'beef', 'Your clapback went too far', `The internet thinks your reply to ${r.name} crossed a line.`);
      return { msg: `You clapped back at ${r.name}.` };
    }
    d.status = 'ignored';
    relBump(c, 4);
    gainHype(p, -1);
    return { msg: 'You took the high road.' };
  });
}

// ---------- live streams ----------
const CHAT = ['play the new one!!', 'hiii from Brazil 🇧🇷', 'drop the album', 'W stream', 'can you sing the bridge?', 'first time catching you live!', 'how do you write your hooks?', 'love from Manila', 'Seoul is here 🇰🇷', 'Germany checking in', 'tour in Lagos pls', 'NYC loves you', 'what\u2019s your setup?', 'goosebumps', 'who\u2019s here from TreblrTok?', 'clip that 😭', 'the vocals live >>>', 'shoutout pls!!'];
export function goLive(state, { platform = 'treblrtok' }) {
  return run(state, (s, rng) => {
    const p = s.player;
    if (p.socialEnergy < SOCIAL.live) return fail(`Going LIVE needs ${SOCIAL.live} social energy.`);
    if ((s.weekStats?.live || 0) >= 1) return fail('One stream a week keeps it special.');
    p.socialEnergy -= SOCIAL.live;
    const followers = platform === 'treblrtube' ? p.followers.viewtube : p.followers.clipz;
    const viewers = Math.round((Math.sqrt(followers + 50) * 6 + 10) * (1 + p.hype / 100) * (1 + p.skills.charisma / 200) * rng.float(0.7, 1.3));
    const tips = Math.round(viewers * rng.float(0.03, 0.09) * (1 + p.skills.charisma / 150));
    const fans = Math.round(viewers * rng.float(0.01, 0.03));
    const moment = rng.chance(clamp(0.06 + p.skills.charisma / 600 + p.hype / 800, 0.05, 0.3));
    earn(s, 'live', tips, `Live tips (${platform === 'treblrtube' ? 'TreblrTube' : 'TreblrTok'})`);
    p.fans += fans;
    if (platform === 'treblrtube') p.followers.viewtube += Math.round(fans * 1.5); else p.followers.clipz += Math.round(fans * 1.5);
    gainHype(p, moment ? 10 : 2);
    bump(p, 'charisma', 0.6);
    const chat = rng.shuffle(CHAT).slice(0, 6).map((t) => ({ user: `@${rng.pick(['luv', 'stan', 'wave', 'nite', 'loop'])}${rng.int(10, 999)}`, text: t }));
    if (moment) {
      const song = s.songs.find((x) => x.status === 'released');
      if (song) song.viral = Math.max(song.viral || 1, 1.6);
      s.weekFlags.live = true;
      logTimeline(s, 'viral', `A LIVE moment went viral`, `${fmtNum(viewers)} watching`);
    }
    s.social.streams.unshift({ id: uid(s, 'ls'), platform, week: s.week, viewers, tips, fans, chat, moment });
    s.social.streams.length = Math.min(s.social.streams.length, 20);
    stat(s, 'live');
    return { msg: `${fmtNum(viewers)} watched live · ${fmtMoney(tips)} in tips · +${fmtNum(fans)} fans${moment ? ' · a clip is blowing up!' : ''}`, data: { viewers, tips, moment, chat } };
  });
}

// ---------- dating & friendships (fictional people only) ----------
export function askOut(state, { contactId }) {
  return run(state, (s, rng) => {
    const c = s.contacts.find((x) => x.id === contactId);
    if (!c) return fail('Contact not found.');
    if (c.rivalId || c.real || c.role === 'artist') return fail('Keep it professional — artists are collaborators, not dates.');
    if (c.role !== 'person') return fail('You can only ask out someone you\u2019ve met.');
    const p = s.player;
    if (p.relationship.status === 'dating') return fail('You\u2019re already seeing someone.');
    if (c.rel < 30) return fail(`Get to know ${c.name.split(' ')[0]} a little better first.`);
    if (p.socialEnergy < SOCIAL.date) return fail('Out of social energy.');
    p.socialEnergy -= SOCIAL.date;
    if (!rng.chance(clamp(c.rel / 100 + p.skills.charisma / 300, 0.1, 0.92))) {
      relBump(c, -8);
      c.thread.push({ from: 'them', text: 'I like you, but I think we\u2019re better as friends 💛', week: s.week });
      return { msg: `${c.name.split(' ')[0]} said not right now.` };
    }
    c.role = 'partner';
    relBump(c, 10);
    p.relationship = { status: 'dating', partnerId: c.id, since: s.week };
    c.thread.push({ from: 'them', text: 'yes!! it\u2019s a date 😊', week: s.week });
    if (p.popularity >= 25) pushNews(s, `${p.stageName} spotted on a date with ${c.name}`, true, 'Life');
    logTimeline(s, 'dating', `Started dating ${c.name}`, c.job || '');
    gainHype(p, 3);
    return { msg: `You\u2019re dating ${c.name}!` };
  });
}
export function dateNight(state) {
  return run(state, (s) => {
    const p = s.player;
    const c = s.contacts.find((x) => x.id === p.relationship.partnerId);
    if (!c) return fail('You\u2019re single.');
    if (c.lastDate === s.week) return fail('Already had date night this week.');
    if (p.socialEnergy < SOCIAL.date) return fail('Out of social energy.');
    p.socialEnergy -= SOCIAL.date;
    c.lastDate = s.week;
    relBump(c, 8);
    p.burnout = clamp((p.burnout || 0) - 6, 0, 100);
    return { msg: `Date night with ${c.name.split(' ')[0]}. Recharged.` };
  });
}
export function hangOut(state, { contactId }) {
  return run(state, (s) => {
    const c = s.contacts.find((x) => x.id === contactId);
    if (!c || c.rivalId) return fail('Pick a friend.');
    if (c.lastHang === s.week) return fail('Already hung out this week.');
    if (s.player.socialEnergy < 8) return fail('Out of social energy.');
    s.player.socialEnergy -= 8;
    c.lastHang = s.week;
    relBump(c, 6);
    s.player.burnout = clamp((s.player.burnout || 0) - 4, 0, 100);
    return { msg: `Hung out with ${c.name.split(' ')[0]}.` };
  });
}
export function breakUp(state) {
  return run(state, (s) => {
    const p = s.player;
    const c = s.contacts.find((x) => x.id === p.relationship.partnerId);
    if (!c) return fail('You\u2019re single.');
    endRelationship(s, c, 'you');
    return { msg: `You and ${c.name.split(' ')[0]} broke up.` };
  });
}
export function endRelationship(s, c, by) {
  const p = s.player;
  c.role = 'person';
  c.rel = Math.min(c.rel, 10);
  c.thread.push({ from: 'them', text: by === 'you' ? 'ok. take care of yourself.' : 'I can\u2019t do the distance anymore. I\u2019m sorry.', week: s.week });
  p.relationship = { status: 'single', partnerId: null, since: null };
  if (p.popularity >= 25) pushNews(s, `${p.stageName} and ${c.name} have split`, true, 'Life');
  logTimeline(s, 'dating', `Split with ${c.name}`, by === 'you' ? 'Your call' : 'Their call');
  pushNotif(s, 'life', `You and ${c.name} broke up.`, { tab: 'phone', app: 'treblrchat' });
}
export function meetPerson(s, rng, where = 'an industry party') {
  const used = new Set(s.contacts.map((c) => c.name));
  const pool = FICTIONAL_PEOPLE.filter(([n]) => !used.has(n));
  if (!pool.length) return null;
  const [name, job, city] = rng.pick(pool);
  const c = { id: uid(s, 'pc'), name, role: 'person', job, city, rel: 20, real: false, thread: [{ from: 'them', text: `hey! it was nice meeting you at ${where} 😊`, week: s.week }], unread: 1 };
  s.contacts.push(c);
  pushNotif(s, 'message', `${name} (${job}, ${cityById(city).name}) sent you a message`, { tab: 'phone', app: 'treblrchat', contact: c.id });
  return c;
}

// ---------- notifications ----------
export function markNotif(state, { id }) {
  return run(state, (s) => { const n = s.notifications.find((x) => x.id === id); if (n) n.read = true; });
}
export function markAllNotifs(state) {
  return run(state, (s) => { for (const n of s.notifications) n.read = true; });
}

// ---------- collabs ----------
export function featureQuote(state, rivalId) {
  const r = state.rivals.find((x) => x.id === rivalId);
  return r ? { ...scaledCollabQuote(state.player, r, relOf(state, rivalId), sameLabel(state, r), { fit: genreFit(state.player.genre, r), busy: rivalBusy(state, r) }), tier: tierLabel(r.tier) } : null;
}
export function requestFeature(state, { rivalId, songId, mode = 'fee' }) {
  return run(state, (s, rng) => {
    const r = s.rivals.find((x) => x.id === rivalId);
    const song = s.songs.find((x) => x.id === songId);
    if (!r) return fail('Pick an artist.');
    if (!song || !['written', 'recorded'].includes(song.status)) return fail('Pick an unreleased song.');
    if (song.feat) return fail('This song already has a feature.');
    const c = contactForRival(s, rivalId);
    if (c.beef) return fail(`${r.name} isn\u2019t taking your calls right now.`);
    if (c.lastAsk != null && s.week - c.lastAsk < 4) return fail(`${r.name}\u2019s team said ask again in a few weeks.`);
    const q0 = scaledCollabQuote(s.player, r, c.rel, sameLabel(s, r), { fit: genreFit(s.player.genre, r), busy: rivalBusy(s, r) });
    const split = mode === 'split';
    const q = { ...q0, fee: split ? q0.splitFee : q0.fee, odds: split ? q0.splitOdds : q0.odds };
    if (s.player.cash < q.fee) return fail(`${r.name}\u2019s ${split ? 'upfront' : 'feature'} fee is ${fmtMoney(q.fee)}.`);
    if (s.player.energy < 10) return fail('Needs 10 energy.');
    s.player.energy -= 10;
    c.lastAsk = s.week;
    if (!rng.chance(q.odds)) {
      relBump(c, -2);
      c.thread.push({ from: 'them', text: q.busy ? 'locked in on the album right now, hit me after the rollout' : rng.pick(['schedule is crazy rn, maybe next time', 'not the right fit for me, but good luck!', 'my team says we\u2019re booked up 🙏']), week: s.week });
      return { msg: `${r.name} passed (${Math.round(q.odds * 100)}% odds).`, data: { accepted: false } };
    }
    spend(s, 'features', q.fee, `Feature fee: ${r.name}`);
    song.feat = r.id;
    song.featName = r.name;
    song.featBoost = Math.round(r.monthlyListeners * 0.03);
    if (split) song.featShare = q0.splitShare;
    if (song.status === 'recorded') song.quality = clamp(song.quality + 3, 1, 100);
    relBump(c, 6);
    c.thread.push({ from: 'them', text: rng.pick(['sent my verse over, this one\u2019s special 🔥', 'loved the record, verse is done', 'let\u2019s make some noise 🙌']), week: s.week });
    pushNews(s, `${r.name} hops on ${s.player.stageName}\u2019s “${song.title}”`, true, 'Collab');
    logTimeline(s, 'collab', `${r.name} featured on “${song.title}”`, split ? `${fmtMoney(q.fee)} + ${Math.round(q0.splitShare * 100)}% of streaming` : fmtMoney(q.fee));
    return { msg: `${r.name} is on “${song.title}”!`, data: { accepted: true } };
  });
}

// ---------- award shows ----------
export function attendAwardShow(state, { outfit = 'classic', perform = false }) {
  return run(state, (s, rng) => {
    const a = s.awardEvent;
    if (!a || a.status !== 'pending') return fail('No award show to attend.');
    const p = s.player;
    const o = OUTFITS.find((x) => x.id === outfit) || OUTFITS[0];
    if (perform && p.energy < 25) return fail('Performing needs 25 energy.');
    if (perform) { p.energy -= 25; bump(p, 'performance', 0.8); }
    const winChance = clamp(a.winChance + (perform ? 0.06 : 0) + o.press * 0.01, 0.05, 0.92);
    const won = rng.chance(winChance);
    const slay = !rng.chance(o.risk);
    a.outfit = o.id; a.perform = perform; a.won = won; a.slay = slay;
    a.status = won ? 'won' : 'done';
    gainHype(p, (slay ? o.press : -o.press) + (perform ? 6 : 0));
    pushNews(s, slay ? `${p.stageName}\u2019s ${o.name.toLowerCase()} steals the ${a.show} red carpet` : `Fashion police: ${p.stageName}\u2019s ${a.show} look divides the internet`, true, 'Awards');
    if (perform) { p.fans += Math.round(Math.min(40000, p.fans * 0.03)); pushNews(s, `${p.stageName}\u2019s ${a.show} performance has everyone talking`, true, 'Awards'); }
    if (won) {
      p.awards = [...(p.awards || []), { week: s.week, name: `${a.show}: ${a.category}`, kind: 'award' }];
      p.fans += Math.min(50000, Math.round(p.fans * 0.05));
      gainHype(p, 14);
      pushNews(s, `${p.stageName} wins ${a.category} at the ${a.show}`, true, 'Awards');
      logTimeline(s, 'award', `Won ${a.category}`, a.show);
      addStarPoints(s, 30);
      statPost(s, `${p.stageName} wins ${a.category} at the ${a.show}. 🏆`, true);
    } else {
      pushNews(s, `${a.winnerName} beats ${p.stageName} to ${a.category} at the ${a.show}`, true, 'Awards');
      logTimeline(s, 'award', `Nominated: ${a.category}`, `${a.show} · lost to ${a.winnerName}`);
    }
    return { msg: won ? `You won ${a.category}!` : `${a.winnerName} took it this time.`, data: { won, slay } };
  });
}
export function giveSpeech(state, { style }) {
  return run(state, (s, rng) => {
    const a = s.awardEvent;
    if (!a || a.status !== 'won') return fail('No speech to give.');
    const sp = SPEECHES.find((x) => x.id === style) || SPEECHES[0];
    const p = s.player;
    a.status = 'done'; a.speech = sp.id;
    if (sp.risk && rng.chance(sp.risk)) {
      gainHype(p, 4);
      openCrisis(s, 'rant', 'Your acceptance speech went viral — for the wrong reasons', 'Half the internet loved your statement. The other half wants an apology.');
      return { msg: 'Bold speech. The internet is split.' };
    }
    gainHype(p, sp.hype);
    p.fans += Math.round(p.fans * sp.fans);
    return { msg: 'Standing ovation.' };
  });
}
export function skipAwardShow(state) {
  return run(state, (s, rng) => {
    const a = s.awardEvent;
    if (!a || a.status !== 'pending') return fail('No award show pending.');
    resolveSkippedAward(s, rng);
    return { msg: 'You stayed home.' };
  });
}
export function resolveSkippedAward(s, rng) {
  const a = s.awardEvent;
  const p = s.player;
  a.won = rng.chance(a.winChance * 0.8);
  a.status = 'done'; a.skipped = true;
  if (a.won) {
    p.awards = [...(p.awards || []), { week: s.week, name: `${a.show}: ${a.category}`, kind: 'award' }];
    gainHype(p, 8);
    pushNews(s, `${p.stageName} wins ${a.category} at the ${a.show} (accepted in absentia)`, true, 'Awards');
    addStarPoints(s, 25);
    logTimeline(s, 'award', `Won ${a.category}`, `${a.show} · in absentia`);
  } else {
    pushNews(s, `${p.stageName} skips the ${a.show}; ${a.winnerName} wins ${a.category}`, true, 'Awards');
  }
}

// ---------- PR crises ----------
export function openCrisis(s, kind, title, text) {
  if (s.crisis) return s.crisis;
  s.crisis = { id: uid(s, 'cr'), kind, title, text, week: s.week, deadline: s.week + 1 };
  s.player.lastScandalWeek = s.week;
  gainHype(s.player, -4);
  pushNews(s, title, true, 'Scandal');
  logTimeline(s, 'scandal', title, text);
  pushNotif(s, 'crisis', `PR crisis: ${title}`, { tab: 'home', crisis: true });
  return s.crisis;
}
export function handleCrisis(state, { choice }) {
  return run(state, (s, rng) => {
    if (!s.crisis) return fail('No crisis right now.');
    const p = s.player;
    const c = s.crisis;
    if (choice === 'publicist') {
      const hired = p.staff.publicist;
      if (!hired && p.cash < 2500) return fail('A freelance publicist costs $2,500.');
      if (!hired) spend(s, 'staff', 2500, 'Crisis PR (freelance)');
      if (rng.chance(hired ? 0.9 : 0.65)) { gainHype(p, 2); s.crisis = null; return { msg: 'Your publicist spun it. Crisis contained.' }; }
      gainHype(p, -6); s.crisis = null; return { msg: 'Even the publicist couldn\u2019t fully save this one.' };
    }
    if (choice === 'apologise') {
      gainHype(p, -4);
      p.fans = Math.round(p.fans * 0.99);
      if (c.kind === 'payola') p.suspicion = clamp(p.suspicion - 10, 0, 100);
      if (c.kind === 'beef') for (const ct of s.contacts) if (ct.beef) { ct.beef = false; relBump(ct, 10); }
      s.crisis = null;
      return { msg: 'You apologised. Most people moved on.' };
    }
    return ignoreCrisis(s, rng);
  });
}
export function ignoreCrisis(s, rng) {
  const p = s.player;
  s.crisis = null;
  if (rng.chance(0.5)) return { msg: 'You ignored it, and it blew over.' };
  gainHype(p, -12);
  p.fans = Math.round(p.fans * 0.97);
  pushNews(s, `Silence from ${p.stageName} fuels the backlash`, true, 'Scandal');
  return { msg: 'Ignoring it made it worse.' };
}

// ---------- multi-week tours ----------
export function tourQuote(state, { venueId, cityIds, perWeek = 2, staff = [] }) {
  const v = VENUES.find((x) => x.id === venueId);
  if (!v) return null;
  const n = cityIds?.length || 0;
  const mgr = staff.includes('tourmgr');
  const jet = ownsKind(state, 'jet');
  const weeks = Math.ceil(n / Math.max(1, perWeek));
  const cost = Math.round(n * (300 + v.capacity * 0.8) * (mgr ? 0.9 : 1) * (jet ? 0.75 : 1));
  return { cost, weeks, reserve: 15 + 10 * Math.min(3, perWeek) - (mgr ? 5 : 0), crewWeekly: tourStaffCost(staff, venueId) };
}
export function planTour(state, { venueId, cityIds, perWeek = 2, setlist = [], staff = [], name = '' }) {
  return run(state, (s) => {
    const v = VENUES.find((x) => x.id === venueId);
    if (!v || !cityIds?.length) return fail('Pick a venue size and cities.');
    if (s.tour) return fail('You\u2019re already on tour.');
    if (cityIds.length < 3) return fail('A tour needs at least 3 cities.');
    if (cityIds.length > 12) return fail('12 stops max.');
    if (!venueUnlocked(s.player, v, 1.2)) return fail(`Touring ${v.name.toLowerCase()}s: ${venueLockReason(s.player, v, 1.2).toLowerCase()}.`);
    const q = tourQuote(s, { venueId, cityIds, perWeek, staff });
    if (s.player.cash < q.cost + q.crewWeekly) return fail(`Tour production and the first week of crew cost ${fmtMoney(q.cost + q.crewWeekly)}.`);
    if (s.player.energy < q.reserve) return fail(`Touring reserves ${q.reserve} energy a week.`);
    spend(s, 'touring', q.cost, `Tour production (${cityIds.length} cities)`);
    s.player.energy -= q.reserve;
    const pw = clamp(perWeek, 1, 3);
    const sl = setlistScore(s, setlist, venueId, staff);
    s.tour = { id: uid(s, 'tour'), name: (name || '').trim().slice(0, 40), venueId, perWeek: pw, reserve: q.reserve, startWeek: s.week, cost: q.cost, gross: 0, fans: 0, sellouts: 0, setlist: setlist.slice(0, 30), staff: staff.slice(), showQuality: sl.score, stops: cityIds.map((cid, i) => ({ cityId: cid, week: s.week + Math.floor(i / pw), done: false })) };
    logTimeline(s, 'tour', `Announced ${s.tour.name ? `the ${s.tour.name}` : `a ${cityIds.length}-city ${v.name.toLowerCase()} tour`}`, `${q.weeks} weeks · show ${sl.score}/100`);
    pushNews(s, `${s.player.stageName} announces a ${cityIds.length}-city tour`, true, 'Live');
    return { msg: `Tour booked: ${cityIds.length} stops over ${q.weeks} week${q.weeks > 1 ? 's' : ''}. Show quality ${sl.score}/100.` };
  });
}
export const bookTour = planTour;
export function cancelTour(state) {
  return run(state, (s) => {
    const t = s.tour;
    if (!t) return fail('No tour to cancel.');
    const left = t.stops.filter((x) => !x.done).length;
    const v = VENUES.find((x) => x.id === t.venueId);
    const penalty = Math.round(left * v.capacity * v.ticket * 0.15);
    spend(s, 'touring', penalty, 'Tour cancellation refunds');
    gainHype(s.player, -8);
    s.player.fans = Math.round(s.player.fans * 0.99);
    for (const x of t.stops) if (!x.done) x.cancelled = true;
    s.tour = null;
    pushNews(s, `${s.player.stageName} cancels the rest of the tour`, true, 'Live');
    logTimeline(s, 'tour', 'Cancelled the tour', `${left} shows refunded`);
    return { msg: `Tour cancelled. ${fmtMoney(penalty)} in refunds.` };
  });
}

// ---------- artist photos ----------
export function setArtistPhoto(state, { rivalId, photo }) {
  return run(state, (s) => {
    if (!s.rivals.some((r) => r.id === rivalId)) return fail('Unknown artist.');
    if (photo) {
      if (typeof photo !== 'string' || !photo.startsWith('data:image/')) return fail('Not an image.');
      s.artistPhotos[rivalId] = photo;
    } else delete s.artistPhotos[rivalId];
    return { msg: photo ? 'Photo set.' : 'Reset to default artwork.' };
  });
}
export function exportPhotoPack(state) {
  const photos = {};
  for (const [id, url] of Object.entries(state.artistPhotos || {})) {
    const r = state.rivals.find((x) => x.id === id);
    if (r) photos[r.name] = url;
  }
  return { format: 'treblr-photo-pack', version: 1, photos };
}
export function importPhotoPack(state, { pack }) {
  return run(state, (s) => {
    if (!pack || pack.format !== 'treblr-photo-pack' || typeof pack.photos !== 'object') return fail('That file isn\u2019t a Treblr photo pack.');
    let n = 0;
    for (const [name, url] of Object.entries(pack.photos)) {
      const r = s.rivals.find((x) => x.name === name || x.id === name);
      if (r && typeof url === 'string' && url.startsWith('data:image/') && url.length < 400000) { s.artistPhotos[r.id] = url; n++; }
    }
    return n ? { msg: `Imported ${n} artist photo${n > 1 ? 's' : ''}.`, data: { n } } : fail('No matching artists in that pack.');
  });
}

// ---------- TreblrTok creation: snippet / trending sound / duet ----------
export function tokCreate(state, { songId, mode = 'snippet', rivalId = null, soundId = null }) {
  if (mode === 'snippet') return promoteClip(state, { songId });
  return run(state, (s, rng) => {
    const p = s.player;
    const song = s.songs.find((x) => x.id === songId);
    if (!song || !['released', 'scheduled', 'recorded'].includes(song.status)) return fail('Pick a recorded or released song.');
    if (p.socialEnergy < SOCIAL.clipz) return fail('Out of social energy this week.');
    p.socialEnergy -= SOCIAL.clipz;
    let reach; let label;
    if (mode === 'duet') {
      const r = s.rivals.find((x) => x.id === rivalId);
      if (!r) return fail('Pick an artist to duet.');
      reach = Math.sqrt(r.monthlyListeners) * rng.float(1.5, 4);
      label = `Duet with ${r.name}`;
      const c = contactForRival(s, r.id); relBump(c, 2);
    } else {
      const snd = s.rivalSongs.find((x) => x.id === soundId);
      if (!snd) return fail('Pick a trending sound.');
      reach = Math.sqrt(snd.weeklyStreams) * rng.float(2, 5);
      label = `Trend: “${snd.title}”`;
    }
    const views = Math.round((Math.sqrt(p.followers.clipz) * 200 + 400 + reach * 20) * rng.float(0.6, 1.6));
    const viral = rng.chance(clamp(0.03 + song.quality / 600 + p.hype / 600, 0.02, 0.35));
    const v = viral ? views * rng.float(10, 30) : views;
    const gain = Math.round(v * (viral ? 0.015 : 0.008));
    p.followers.clipz += gain;
    song.viral = Math.max(song.viral || 1, viral ? rng.float(1.8, 3) : 1.12);
    if (viral) { gainHype(p, 14); s.weekFlags.viral = song.title; logTimeline(s, 'viral', `${label} went viral`, `${fmtNum(Math.round(v))} views`); }
    stat(s, 'post');
    s.social.clipz.unshift({ id: uid(s, 'cz'), week: s.week, songId, title: song.title, label, mode, views: Math.round(v), viral, likes: Math.round(v * 0.09), shares: Math.round(v * 0.01), replies: [] });
    s.social.clipz.length = Math.min(s.social.clipz.length, 30);
    return { msg: `${label}: ${fmtNum(Math.round(v))} views${viral ? ' — viral!' : ''}`, data: { viral } };
  });
}
