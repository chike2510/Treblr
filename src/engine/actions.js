// Player actions. Every action is pure: (state, payload) => { state, ok, msg }.
import { createRng } from './rng.js';
import { clone, clamp, uid, fmtMoney, fmtNum } from './util.js';
import {
  COWRITERS, PRODUCERS, ROLLOUTS, JOBS, VENUES, STAFF, LABELS, cityById, CITIES, genreName, venueUnlocked, venueLockReason,
} from './data.js';
import { projectWriteQuality, projectRecordQuality, lengthFit, gainHype, skillGain } from './model.js';
import { checkGoals } from './goals.js';
import { stat } from './weekly.js';
import { fanComments } from './comments.js';
import { pushNotif, logTimeline, eraOf } from './journal.js';
import { VIDEO_DIRECTORS, VIDEO_CONCEPTS } from './data.js';
import { createFeatureCredit } from './v5.js';
import { pitchBonus, signContract, labelTerms, buyoutCost, payolaPackage, labelReach } from './business.js';

export const ENERGY = { write: 30, record: 20, release: 10, video: 25, press: 15, radio: 20, interview: 10, tour: 40, train: 20 };
// Artist's share of ticket gross after venue, promoter and crew.
export const ARTIST_CUT = 0.3;
export const SOCIAL = { chirp: 8, snapshot: 10, clipz: 15, pitch: 5, live: 20, date: 10 };

export function run(state, fn) {
  const s = clone(state);
  const rng = createRng(s.rng || s.seed);
  const res = fn(s, rng) || {};
  s.rng = rng.state();
  if (res.ok !== false) checkGoals(s);
  return { state: res.ok === false ? state : s, ok: res.ok !== false, msg: res.msg || '', data: res.data };
}

export function earn(s, cat, amount, label) {
  amount = Math.round(amount);
  s.player.cash += amount;
  s.ledger.income[cat] = (s.ledger.income[cat] || 0) + amount;
  if (cat !== 'advance' && amount > 0) stat(s, 'earned', amount);
  s.transactions.unshift({ week: s.week, label, amount });
  s.transactions.length = Math.min(s.transactions.length, 200);
}
export function spend(s, cat, amount, label) {
  amount = Math.round(amount);
  s.player.cash -= amount;
  s.ledger.expense[cat] = (s.ledger.expense[cat] || 0) + amount;
  s.transactions.unshift({ week: s.week, label, amount: -amount });
  s.transactions.length = Math.min(s.transactions.length, 200);
}
const fail = (msg) => ({ ok: false, msg });
function needEnergy(s, n) { return s.player.energy >= n; }
function needSocial(s, n) { return s.player.socialEnergy >= n; }
function needCash(s, n) { return s.player.cash >= n; }
export const bump = (p, skill, by) => { p.skills[skill] = clamp(+(p.skills[skill] + skillGain(p.skills[skill], by)).toFixed(2), 0, 100); };
export function pushNews(s, headline, aboutPlayer = false, tag = 'Industry') {
  s.news.unshift({ week: s.week, headline, aboutPlayer, tag });
  s.news.length = Math.min(s.news.length, 120);
}

// ---------- Studio ----------
export function writeSong(state, { title, genre, theme, length = 180, cowriter = 'none', diss = null }) {
  return run(state, (s, rng) => {
    const p = s.player;
    const cw = COWRITERS.find((c) => c.id === cowriter) || COWRITERS[0];
    if (!title?.trim()) return fail('Give your song a title.');
    if (s.songs.some((x) => x.title.trim().toLowerCase() === title.trim().toLowerCase())) return fail(`You already have a song called “${title.trim()}”. Every title is yours once.`);
    if (!needEnergy(s, ENERGY.write)) return fail('Not enough energy to write. Rest or wait for next week.');
    if (!needCash(s, cw.fee)) return fail(`You need ${fmtMoney(cw.fee)} for that co-writer.`);
    const era = eraOf(s);
    const proj = projectWriteQuality(p, { genre, length, cowriter, eraQuality: era?.vibe === 'dark' ? 2 : 0 });
    const tired = (p.burnout || 0) >= 60 ? -4 : 0;
    const q = clamp(Math.round(proj.expected + rng.float(-8, 8) + tired), 1, 100);
    p.energy -= ENERGY.write;
    if (cw.fee) spend(s, 'cowriters', cw.fee, `Co-writer: ${title}`);
    bump(p, 'songwriting', 0.9);
    stat(s, 'write');
    const song = {
      id: uid(s, 's'), title: title.trim(), genre, theme, length, cowriter: cw.id, cowriterShare: cw.share,
      writeQuality: q, quality: q, status: 'written', writtenWeek: s.week,
      weeklyStreams: 0, lifetimeStreams: 0, history: [], playlists: 0, viral: 1, videoViews: 0, radio: 0, peaks: {}, cert: null,
      cover: { gradient: rng.int(0, 7), ...(era ? { tint: era.color } : {}) },
    };
    if (diss) { song.diss = diss; song.theme = 'Diss'; }
    s.songs.unshift(song);
    return { msg: `“${song.title}” written, quality ${q}.`, data: song };
  });
}

export function recordSong(state, { songId, producerId }) {
  return run(state, (s) => {
    const song = s.songs.find((x) => x.id === songId);
    const prod = PRODUCERS.find((x) => x.id === producerId);
    if (!song || song.status !== 'written') return fail('Pick a written song to record.');
    if (!prod) return fail('Pick a producer.');
    if (!needEnergy(s, ENERGY.record)) return fail('Not enough energy to record.');
    const price = producerPrice(s, prod);
    if (!needCash(s, price)) return fail(`${prod.name} costs ${fmtMoney(price)}.`);
    s.player.energy -= ENERGY.record;
    if (price) spend(s, 'studio', price, `Studio: ${song.title}`);
    stat(s, 'record');
    const home = prod.id === 'self' && (s.lifestyle?.owned || []).some((o) => o.id === 'homestudio') ? 6 : 0;
    const ctrl = s.player.label?.control === 'label' ? -2 : 0;
    song.quality = clamp(projectRecordQuality(s.player, song, prod.id) + home + ctrl, 1, 100);
    song.producer = prod.id;
    song.status = 'recorded';
    bump(s.player, 'vocals', 0.5);
    if (prod.id === 'self') bump(s.player, 'production', 0.8);
    return { msg: `“${song.title}” recorded, final quality ${song.quality}.` };
  });
}

export function releaseMusic(state, { type = 'single', title, songIds, rollout = 'standard', cover, weeksFromNow = 0 }) {
  return run(state, (s) => {
    const ro = ROLLOUTS.find((r) => r.id === rollout) || ROLLOUTS[1];
    const songs = songIds.map((id) => s.songs.find((x) => x.id === id)).filter(Boolean);
    if (!songs.length) return fail('Choose at least one recorded song.');
    const preSingles = type === 'single' ? [] : songs.filter((x) => x.status === 'released' && !s.releases.some((r) => r.type !== 'single' && r.songIds.includes(x.id)));
    if (songs.some((x) => x.status !== 'recorded' && !preSingles.includes(x))) return fail('Only recorded songs (or released singles on a project) can be released.');
    if (preSingles.length === songs.length) return fail('A project needs at least one new song.');
    if (type === 'single' && songs.length !== 1) return fail('A single is one song.');
    if (type === 'ep' && (songs.length < 3 || songs.length > 6)) return fail('An EP needs 3–6 songs.');
    if (type === 'album' && songs.length < 7) return fail('An album needs at least 7 songs.');
    const relTitle = (title || songs[0].title).trim();
    if (type !== 'single' && s.releases.some((r) => r.type !== 'single' && r.title.trim().toLowerCase() === relTitle.toLowerCase())) return fail(`You already have a project called “${relTitle}”.`);
    if (!needEnergy(s, ENERGY.release)) return fail('Not enough energy.');
    if (!needCash(s, ro.cost)) return fail(`${ro.name} costs ${fmtMoney(ro.cost)}.`);
    s.player.energy -= ENERGY.release;
    if (ro.cost) spend(s, 'marketing', ro.cost, `Rollout: ${title || songs[0].title}`);
    const era = eraOf(s);
    const relCover = { ...(cover || songs[0].cover) };
    if (era) relCover.tint = era.color;
    const rel = {
      id: uid(s, 'rel'), type, title: (title || songs[0].title).trim(), songIds: songs.map((x) => x.id),
      cover: relCover, rollout: ro.id, releaseWeek: s.week + clamp(weeksFromNow, 0, 6), status: 'scheduled', announcedWeek: s.week,
      eraId: era?.id || null, leadSingles: preSingles.map((x) => x.id), sequencing: type === 'single' ? null : sequencingScore(songs),
      preUnits: Math.round(preSingles.reduce((a, x) => a + (x.lifetimeStreams || 0), 0) / 2500), preHype: 0, steps: {},
    };
    for (const song of songs) { if (preSingles.includes(song)) continue; song.status = 'scheduled'; song.releaseId = rel.id; song.cover = rel.cover; }
    s.releases.unshift(rel);
    gainHype(s.player, ro.hype * 0.3);
    return { msg: weeksFromNow ? `“${rel.title}” scheduled for week ${rel.releaseWeek}.` : `“${rel.title}” drops this week. Hit Next Week to see how it lands.`, data: rel };
  });
}

export function producerPrice(s, prod) {
  const c = (s.contacts || []).find((x) => x.role === 'producer');
  const disc = c && prod.id === 'rising' && c.rel >= 60 ? 0.7 : c && c.rel >= 80 && prod.id === 'hitmaker' ? 0.85 : 1;
  return Math.round(prod.price * disc);
}

// Album/EP sequencing: strong opener and front-loaded best tracks score higher (0..1).
export function sequencingScore(songs) {
  if (songs.length < 2) return 0.5;
  const qs = songs.map((x) => x.quality);
  const sorted = [...qs].sort((a, b) => b - a);
  const top3 = new Set(sorted.slice(0, 3));
  const opener = qs[0] >= sorted[Math.min(2, sorted.length - 1)] ? 0.4 : 0.1;
  const front = qs.slice(0, 4).filter((q) => top3.has(q)).length / Math.min(3, qs.length) * 0.4;
  const closer = qs[qs.length - 1] >= sorted[Math.floor(sorted.length / 2)] ? 0.2 : 0.05;
  return Math.min(1, opener + front + closer);
}

// ---------- Phone / social ----------
const CHIRP_REPLIES = ['this is the one 🔥', 'drop the snippet already', 'who is this?? adding to my playlist', 'ok but the bridge…', 'underrated fr', 'not my thing tbh', 'the world is not ready', 'tour when??', 'my whole group chat is obsessed', 'mid. sorry.'];

export function postChirp(state, { text }) {
  return run(state, (s, rng) => {
    if (!text?.trim()) return fail('Write something first.');
    if (!needSocial(s, SOCIAL.chirp)) return fail('Out of social energy this week.');
    const p = s.player;
    p.socialEnergy -= SOCIAL.chirp;
    const reach = Math.sqrt(p.followers.chirp) * 40 * rng.float(0.3, 1.2) + 20;
    const likes = Math.round(reach * rng.float(0.05, 0.25) * (1 + p.skills.charisma / 100));
    const gain = Math.round(likes * rng.float(0.1, 0.4));
    p.followers.chirp += gain;
    gainHype(p, rng.float(1, 4) * (1 + p.skills.charisma / 150));
    const replies = fanComments(s, rng, { kind: 'post', n: rng.int(2, 4) });
    stat(s, 'post');
    s.social.chirp.unshift({ id: uid(s, 'c'), week: s.week, text: text.trim(), likes, reposts: Math.round(likes * 0.2), replies, mine: true });
    s.social.chirp.length = Math.min(s.social.chirp.length, 60);
    bump(p, 'charisma', 0.4);
    return { msg: `Posted. ${fmtNum(likes)} likes, +${fmtNum(gain)} followers.` };
  });
}

export function postSnapshot(state, { caption, image }) {
  return run(state, (s, rng) => {
    if (!needSocial(s, SOCIAL.snapshot)) return fail('Out of social energy this week.');
    const p = s.player;
    p.socialEnergy -= SOCIAL.snapshot;
    const likes = Math.round((Math.sqrt(p.followers.snapshot) * 12 * rng.float(0.5, 1.5) + 15) * (1 + p.skills.charisma / 120));
    const gain = Math.round(likes * rng.float(0.05, 0.25));
    p.followers.snapshot += gain;
    p.fans += Math.round(gain * 0.2);
    gainHype(p, rng.float(1, 3));
    stat(s, 'post');
    s.social.snapshot.unshift({ id: uid(s, 'ig'), week: s.week, caption: caption || '', image: image || null, gradient: rng.int(0, 7), likes, comments: Math.round(likes * 0.04), replies: fanComments(s, rng, { kind: 'post', n: 3 }) });
    s.social.snapshot.length = Math.min(s.social.snapshot.length, 30);
    return { msg: `${fmtNum(likes)} likes. +${fmtNum(gain)} followers.` };
  });
}

export function promoteClip(state, { songId }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    if (!song || !['released', 'scheduled', 'recorded'].includes(song.status)) return fail('Pick a recorded or released song.');
    if (!needSocial(s, SOCIAL.clipz)) return fail('Out of social energy this week.');
    const p = s.player;
    p.socialEnergy -= SOCIAL.clipz;
    const chance = clamp(0.04 + song.quality / 450 + p.hype / 450 + p.skills.charisma / 600 + (p.followers.clipz > 50000 ? 0.05 : 0), 0.03, 0.55);
    const viral = rng.chance(chance);
    const views = Math.round((Math.sqrt(p.followers.clipz) * 300 + 500) * (viral ? rng.float(25, 80) : rng.float(0.5, 3)));
    const gain = Math.round(views * (viral ? 0.02 : 0.01));
    p.followers.clipz += gain;
    song.viral = Math.max(song.viral || 1, viral ? rng.float(2.2, 4) : 1.15);
    if (viral) {
      gainHype(p, 20);
      p.fans += Math.round(gain * 0.3);
      pushNews(s, `“${song.title}” by ${p.stageName} is blowing up on TreblrTok`, true, 'Viral');
      s.weekFlags.viral = song.title;
    }
    stat(s, 'post');
    if (viral) logTimeline(s, 'viral', `“${song.title}” went viral on TreblrTok`, `${fmtNum(views)} views`);
    s.social.clipz.unshift({ id: uid(s, 'cz'), week: s.week, songId, title: song.title, views, viral, likes: Math.round(views * rng.float(0.06, 0.14)), shares: Math.round(views * rng.float(0.004, 0.02)), replies: fanComments(s, rng, { kind: 'song', song, n: 3 }) });
    s.social.clipz.length = Math.min(s.social.clipz.length, 30);
    return { msg: viral ? `It's going viral! ${fmtNum(views)} views.` : `${fmtNum(views)} views. Not quite viral.`, data: { viral } };
  });
}

export function pitchPlaylist(state, { songId }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    if (!song || !['released', 'scheduled', 'recorded'].includes(song.status)) return fail('Pick a recorded or released song.');
    if (song.pitchedWeek === s.week) return fail('Already pitched this week.');
    if (song.status !== 'released' && song.prePitch) return fail('Already pitched to editors for release day.');
    if (!needSocial(s, SOCIAL.pitch)) return fail('Out of social energy.');
    if (!needCash(s, 50)) return fail('Pitching costs $50.');
    s.player.socialEnergy -= SOCIAL.pitch;
    spend(s, 'marketing', 50, `Playlist pitch: ${song.title}`);
    song.pitchedWeek = s.week;
    stat(s, 'pitch');
    if (song.status !== 'released') {
      song.prePitch = true;
      return { msg: `Pitched “${song.title}” to editors ahead of release. You’ll hear back on release week.`, data: { pre: true } };
    }
    const chance = clamp(0.1 + song.quality / 200 + s.player.popularity / 300 + pitchBonus(s) - (song.playlists || 0) * 0.04, 0.05, 0.85);
    if (rng.chance(chance)) {
      const name = placeOnPlaylist(song, rng);
      return { msg: `Added to “${name}”!`, data: { placed: true, name } };
    }
    return { msg: 'Curators passed this time.', data: { placed: false } };
  });
}
export const PLAYLIST_NAMES = ['New Music Friday', 'Fresh Finds', 'Hot Hits', 'Chill Vibes', 'Global Viral 50', 'Late Night Drive', 'Workout Beast', 'Top of the World'];
export function placeOnPlaylist(song, rng) {
  song.playlists = (song.playlists || 0) + 1;
  const name = rng.pick([...PLAYLIST_NAMES, `${genreName(song.genre)} Rising`]);
  song.playlistNames = [...(song.playlistNames || []), name];
  return name;
}

export const VIDEO_TIERS = [
  ...VIDEO_DIRECTORS,
];
export function makeVideo(state, { songId, tier, director, concept = 'performance' }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    const t = VIDEO_TIERS.find((x) => x.id === (director || tier));
    const c = VIDEO_CONCEPTS.find((x) => x.id === concept) || VIDEO_CONCEPTS[0];
    if (!song || !['released', 'scheduled'].includes(song.status)) return fail('Pick a released or scheduled song.');
    if (s.social.videos.some((v) => v.songId === songId)) return fail('This song already has a video.');
    if (!t) return fail('Pick a director.');
    const energy = ENERGY.video + (c.energy || 0);
    const cost = Math.round(t.cost * (c.costMult || 1));
    if (!needEnergy(s, energy)) return fail('Not enough energy for a shoot.');
    if (!needCash(s, cost)) return fail(`${t.name} costs ${fmtMoney(cost)}.`);
    s.player.energy -= energy;
    if (cost) spend(s, 'videoProd', cost, `Music video: ${song.title}`);
    const fit = c.genres ? (c.genres.includes(song.genre) ? 1.2 : 0.85) : 1;
    const vq = clamp(Math.round(t.quality * 0.6 + song.quality * 0.3 + s.player.skills.charisma * 0.1 + rng.float(-6, 6) + (fit > 1 ? 4 : fit < 1 ? -4 : 0)), 1, 100);
    const weekly = Math.round((s.player.followers.viewtube + 500) * t.mult * c.views * fit * rng.float(0.8, 1.3) * (song.quality / 50) * (vq / 60));
    s.social.videos.unshift({ id: uid(s, 'v'), songId, title: song.title, tier: t.id, concept: c.id, quality: vq, week: s.week, views: 0, weekly, likes: 0, gradient: song.cover?.gradient ?? 0, comments: fanComments(s, rng, { kind: 'song', song, n: 4 }) });
    gainHype(s.player, 3 * Math.sqrt(t.mult) * c.hype);
    s.player.fans += Math.round(weekly * 0.002 * c.fans);
    if (c.id === 'dance') song.viral = Math.max(song.viral || 1, 1 + 0.2 * c.viral * fit);
    if (t.mult >= 3.5) logTimeline(s, 'video', `Music video: “${song.title}”`, `${t.name} · ${c.name}`);
    return { msg: `“${song.title}” video is live on TreblrTube, video score ${vq}.`, data: { quality: vq } };
  });
}

// ---------- Work & live ----------
export function doJob(state, { jobId }) {
  return run(state, (s, rng) => {
    const j = JOBS.find((x) => x.id === jobId);
    if (!j) return fail('Unknown job.');
    for (const [k, v] of Object.entries(j.minSkill || {})) if (s.player.skills[k] < v) return fail(`Needs ${k} ${v}+.`);
    if (!needEnergy(s, j.energy)) return fail('Too tired to work.');
    s.player.energy -= j.energy;
    const pay = Math.round(j.pay * rng.float(0.9, 1.15));
    earn(s, 'jobs', pay, j.name);
    bump(s.player, j.skill, 0.4);
    return { msg: `Earned ${fmtMoney(pay)} from ${j.name.toLowerCase()}.` };
  });
}

export function gigDemand(state, cityId) {
  const p = state.player;
  const heat = p.fanHeat[cityId] || 0;
  return Math.round(heat * 0.3 + p.fans * 0.006 + p.hype * 2 + p.skills.performance * 1.5);
}

// Regulars: repeat plays of the same room in the same city lose pull (recovers ~15%/week).
export function gigFatigue(state, cityId, venueId) {
  const g = state.player.gigLog?.[`${cityId}|${venueId}`];
  if (!g) return 1;
  const recent = g.count * Math.pow(0.85, state.week - g.week);
  return Math.max(0.25, Math.pow(0.78, recent));
}

export function playGig(state, { venueId, cityId }) {
  return run(state, (s, rng) => {
    const v = VENUES.find((x) => x.id === venueId);
    const city = cityById(cityId);
    if (!v) return fail('Pick a venue.');
    if (s.tour) return fail('You\u2019re on tour, finish or cancel it first.');
    if (!venueUnlocked(s.player, v)) return fail(`Promoters won’t book you in a ${v.name.toLowerCase()} yet (${venueLockReason(s.player, v).toLowerCase()}).`);
    if (!needEnergy(s, v.energy)) return fail('Not enough energy for this show.');
    const travel = cityId === s.player.city ? 0 : Math.round(150 + v.capacity * 0.6);
    if (!needCash(s, travel)) return fail(`Travel and crew cost ${fmtMoney(travel)}.`);
    s.player.energy -= v.energy;
    if (travel) spend(s, 'touring', travel, `Travel: ${city.name}`);
    const fat = gigFatigue(s, cityId, v.id);
    const demand = gigDemand(s, cityId) * rng.float(0.8, 1.2) * (0.5 + 0.5 * fat);
    const sold = Math.min(v.capacity, Math.round(demand));
    const key = `${cityId}|${v.id}`;
    const prev = s.player.gigLog[key];
    s.player.gigLog[key] = { count: (prev ? prev.count * Math.pow(0.85, s.week - prev.week) : 0) + 1, week: s.week };
    stat(s, 'gig');
    const soldOut = sold >= v.capacity;
    const pay = sold * v.ticket * ARTIST_CUT * (s.player.staff.booking ? 1.2 : 1);
    earn(s, 'gigs', pay, `${v.name}, ${city.name}`);
    const roomFit = clamp(v.capacity / Math.max(80, s.player.fans * 0.05), 0.15, 1);
    const newFans = Math.round(sold * rng.float(0.06, 0.16) * (1 + s.player.skills.performance / 100) * fat * roomFit);
    s.player.fans += newFans;
    s.player.fanHeat[cityId] = (s.player.fanHeat[cityId] || 0) + newFans;
    gainHype(s.player, (soldOut ? 4 : 1) * fat * roomFit);
    bump(s.player, 'performance', 0.9);
    if (soldOut) {
      s.player.sellouts += 1;
      if (v.capacity >= 2000) pushNews(s, `${s.player.stageName} sells out ${city.name}'s ${v.name.toLowerCase()}`, true, 'Live');
      if (fat > 0.7 && roomFit > 0.5) s.weekFlags.sellout = { venue: v.name, city: city.name };
    }
    const note = fat < 0.7 ? ' · The regulars have seen you, try a bigger room or a new city.' : roomFit < 0.4 ? ' · You\u2019ve outgrown this room.' : '';
    return { msg: `${soldOut ? 'SOLD OUT! ' : ''}${fmtNum(sold)}/${fmtNum(v.capacity)} tickets · ${fmtMoney(pay)} · +${fmtNum(newFans)} fans${note}`, data: { sold, soldOut, pay, fatigue: fat } };
  });
}

export function rest(state) {
  return run(state, (s) => {
    if (s.player.rested) return fail('You already rested this week.');
    s.player.rested = true;
    s.player.energy = clamp(s.player.energy + 15, 0, s.player.maxEnergy);
    s.player.socialEnergy = clamp(s.player.socialEnergy + 10, 0, s.player.maxSocial);
    s.player.burnout = clamp((s.player.burnout || 0) - 12, 0, 100);
    stat(s, 'rest');
    return { msg: 'Rest day: +15 energy, +10 social, burnout eased.' };
  });
}

// ---------- Inbox ----------
export function markRead(state, { id }) {
  return run(state, (s) => {
    const m = s.inbox.find((x) => x.id === id);
    if (m) m.read = true;
  });
}

export function respondOffer(state, { id, accept }) {
  return run(state, (s, rng) => {
    const m = s.inbox.find((x) => x.id === id);
    if (!m || m.type !== 'offer' || m.status) return fail('This offer is no longer available.');
    m.read = true;
    if (!accept) {
      m.status = 'declined';
      if (m.subtype === 'feature') gainHype(s.player, -(1));
      return { msg: 'Offer declined.' };
    }
    const o = m.payload;
    const p = s.player;
    if (o.energy && p.energy < o.energy) return fail(`Needs ${o.energy} energy.`);
    if (o.energy) p.energy -= o.energy;
    m.status = 'accepted';
    if (m.subtype === 'brand') {
      earn(s, 'brand', o.cash, `Brand deal: ${o.brand}`);
      s.brandHistory = { ...(s.brandHistory || {}), [o.brand]: s.week };
      if (o.cash >= 5000) logTimeline(s, 'deal', `Brand deal with ${o.brand}`, fmtMoney(o.cash));
      gainHype(p, 3);
      if (o.cash > 5000) p.fans = Math.round(p.fans * 0.995); // some fans call it selling out
      return { msg: `Deal signed with ${o.brand}: ${fmtMoney(o.cash)}.` };
    }
    if (m.subtype === 'feature') {
      earn(s, 'features', o.cash, `Feature for ${o.artist}`);
      if (o.rivalId) { const c = (s.contacts || []).find((x) => x.rivalId === o.rivalId); if (c) c.rel = clamp(c.rel + 10, -100, 100); }
      logTimeline(s, 'collab', `Featured on a ${o.artist} single`, fmtMoney(o.cash));
      const credit = o.rivalId ? createFeatureCredit(s, rng, o.rivalId, s.week) : null;
      if (credit) { pushNews(s, `${o.artist} drops “${credit.title}” featuring ${p.stageName}`, true, 'Collab'); }
      p.fans += o.fans;
      gainHype(p, 8);
      pushNews(s, `${o.artist} taps ${p.stageName} for a new collab`, true, 'Collab');
      return { msg: `Feature recorded with ${o.artist}: ${fmtMoney(o.cash)}, +${fmtNum(o.fans)} fans.` };
    }
    if (m.subtype === 'gig') {
      earn(s, 'gigs', o.cash, `Booked: ${o.venue}`);
      p.fans += o.fans;
      p.fanHeat[o.city] = (p.fanHeat[o.city] || 0) + o.fans;
      bump(p, 'performance', 1);
      return { msg: `Played ${o.venue}: ${fmtMoney(o.cash)}, +${fmtNum(o.fans)} fans.` };
    }
    if (m.subtype === 'label') {
      if (p.label) { m.status = null; return fail(`You’re already signed to ${p.label.name}.`); }
      signContract(s, { albums: 1, yearsPerAlbum: 3, control: 'shared', strict: 0.3, ...o });
      return { msg: `Signed to ${o.label}. ${fmtMoney(o.advance)} advance.` };
    }
    return { msg: 'Accepted.' };
  });
}

// ---------- Team, business, media ----------
export function setStaff(state, { role, hire }) {
  return run(state, (s) => {
    const st = STAFF.find((x) => x.id === role);
    if (!st) return fail('Unknown role.');
    if (hire && s.player.cash < st.salary * 2) return fail(`Keep at least ${fmtMoney(st.salary * 2)} to cover their first weeks.`);
    s.player.staff[role] = !!hire;
    return { msg: hire ? `${st.name} hired, ${fmtMoney(st.salary)}/week.` : `${st.name} let go.` };
  });
}

// Direct signing at a label's standard terms (offers in the Inbox can be negotiated instead).
export function signLabel(state, { labelId }) {
  return run(state, (s, rng) => {
    const l = LABELS.find((x) => x.id === labelId);
    if (!l) return fail('Unknown label.');
    if (s.player.label) return fail(`You're signed to ${s.player.label.name}.`);
    if (s.player.popularity < l.minPop) return fail(`${l.name} wants popularity ${l.minPop}+.`);
    const t = labelTerms(s, l, rng);
    signContract(s, t);
    return { msg: `Signed to ${l.name}. ${fmtMoney(t.advance)} advance, ${Math.round(t.royalty * 100)}% royalty.` };
  });
}

export function leaveLabel(state) {
  return run(state, (s) => {
    if (!s.player.label) return fail('Not signed.');
    const fee = buyoutCost(s);
    if (s.player.cash < fee) return fail(`Buying out ${s.player.label.name} costs ${fmtMoney(fee)}.`);
    spend(s, 'other', fee, `Contract buyout: ${s.player.label.name}`);
    logTimeline(s, 'deal', `Bought out of ${s.player.label.name}`, fmtMoney(fee));
    s.player.label = null;
    return { msg: `You're independent again (buyout ${fmtMoney(fee)}).` };
  });
}

export const MERCH_TIERS = [
  { id: 'small', name: 'Tees & stickers', cost: 500, units: 100, price: 20 },
  { id: 'mid', name: 'Hoodie drop', cost: 4000, units: 600, price: 45 },
  { id: 'big', name: 'Full capsule', cost: 25000, units: 3000, price: 60 },
];
export function dropMerch(state, { tier }) {
  return run(state, (s) => {
    const t = MERCH_TIERS.find((x) => x.id === tier);
    if (!t) return fail('Pick a drop.');
    if (s.merch?.active) return fail('A merch drop is already selling.');
    if (!needCash(s, t.cost)) return fail(`Production costs ${fmtMoney(t.cost)}.`);
    spend(s, 'merch', t.cost, `Merch production: ${t.name}`);
    s.merch = { active: true, tier: t.id, stock: t.units, price: t.price, sold: 0 };
    return { msg: `${t.name} is live. Sales land each week.` };
  });
}

export function doMedia(state, { kind }) {
  return run(state, (s, rng) => {
    const p = s.player;
    const cost = { press: ENERGY.press, radio: ENERGY.radio, interview: ENERGY.interview }[kind];
    if (!cost) return fail('Unknown media.');
    const e = p.staff.publicist ? Math.round(cost * 0.7) : cost;
    if (!needEnergy(s, e)) return fail('Not enough energy.');
    if (kind === 'interview' && p.popularity < 20) return fail('Podcasts want popularity 20+.');
    p.energy -= e;
    if (kind === 'press') {
      const good = rng.chance(0.65 + p.skills.charisma / 400);
      gainHype(p, (good ? 10 : -4));
      pushNews(s, good ? `Critics are calling ${p.stageName} one to watch` : `Mixed reviews for ${p.stageName}'s press run`, true, 'Press');
      return { msg: good ? 'Glowing write-up. Hype up.' : 'Lukewarm reviews. Hype dipped.' };
    }
    if (kind === 'radio') {
      const song = s.songs.find((x) => x.status === 'released');
      if (!song) return fail('Release a song before a radio tour.');
      song.radioBoost = (song.radioBoost || 0) + 0.6 * labelReach(s);
      gainHype(p, 4);
      return { msg: `Radio tour done, “${song.title}” gets more spins.` };
    }
    const fans = Math.round((Math.min(20000, p.fans * 0.02) + 50) * (1 + p.skills.charisma / 100));
    p.fans += fans;
    gainHype(p, 6);
    bump(p, 'charisma', 1);
    return { msg: `Great interview. +${fmtNum(fans)} fans.` };
  });
}

// Legacy entry point: amounts map onto the payola packages.
export function payola(state, { amount }) {
  return payolaPackage(state, { pkg: amount >= 150000 ? 'chart' : amount >= 25000 ? 'playlists' : 'radio' });
}

export function updatePlayer(state, patch) {
  return run(state, (s) => {
    Object.assign(s.player, patch);
  });
}

export { lengthFit, CITIES };
