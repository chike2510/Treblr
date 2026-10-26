// Player actions. Every action is pure: (state, payload) => { state, ok, msg }.
import { createRng } from './rng.js';
import { clone, clamp, uid, fmtMoney, fmtNum } from './util.js';
import {
  COWRITERS, PRODUCERS, ROLLOUTS, JOBS, VENUES, STAFF, LABELS, cityById, CITIES, genreName,
} from './data.js';
import { projectWriteQuality, projectRecordQuality, lengthFit } from './model.js';
import { checkGoals } from './goals.js';

export const ENERGY = { write: 25, record: 15, release: 5, video: 20, press: 15, radio: 20, interview: 10, tour: 70 };
export const SOCIAL = { chirp: 8, snapshot: 10, clipz: 15, pitch: 5 };

function run(state, fn) {
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
const bump = (p, skill, by) => { p.skills[skill] = clamp(+(p.skills[skill] + by).toFixed(1), 0, 100); };
export function pushNews(s, headline, aboutPlayer = false, tag = 'Industry') {
  s.news.unshift({ week: s.week, headline, aboutPlayer, tag });
  s.news.length = Math.min(s.news.length, 120);
}

// ---------- Studio ----------
export function writeSong(state, { title, genre, theme, length = 180, cowriter = 'none' }) {
  return run(state, (s, rng) => {
    const p = s.player;
    const cw = COWRITERS.find((c) => c.id === cowriter) || COWRITERS[0];
    if (!title?.trim()) return fail('Give your song a title.');
    if (!needEnergy(s, ENERGY.write)) return fail('Not enough energy to write. Rest or wait for next week.');
    if (!needCash(s, cw.fee)) return fail(`You need ${fmtMoney(cw.fee)} for that co-writer.`);
    const proj = projectWriteQuality(p, { genre, length, cowriter });
    const q = clamp(Math.round(proj.expected + rng.float(-8, 8)), 1, 100);
    p.energy -= ENERGY.write;
    if (cw.fee) spend(s, 'cowriters', cw.fee, `Co-writer: ${title}`);
    bump(p, 'songwriting', 1.2);
    const song = {
      id: uid(s, 's'), title: title.trim(), genre, theme, length, cowriter: cw.id, cowriterShare: cw.share,
      writeQuality: q, quality: q, status: 'written', writtenWeek: s.week,
      weeklyStreams: 0, lifetimeStreams: 0, history: [], playlists: 0, viral: 1, videoViews: 0, radio: 0, peaks: {}, cert: null,
      cover: { gradient: rng.int(0, 7) },
    };
    s.songs.unshift(song);
    return { msg: `“${song.title}” written — quality ${q}.`, data: song };
  });
}

export function recordSong(state, { songId, producerId }) {
  return run(state, (s) => {
    const song = s.songs.find((x) => x.id === songId);
    const prod = PRODUCERS.find((x) => x.id === producerId);
    if (!song || song.status !== 'written') return fail('Pick a written song to record.');
    if (!prod) return fail('Pick a producer.');
    if (!needEnergy(s, ENERGY.record)) return fail('Not enough energy to record.');
    if (!needCash(s, prod.price)) return fail(`${prod.name} costs ${fmtMoney(prod.price)}.`);
    s.player.energy -= ENERGY.record;
    if (prod.price) spend(s, 'studio', prod.price, `Studio: ${song.title}`);
    song.quality = projectRecordQuality(s.player, song, prod.id);
    song.producer = prod.id;
    song.status = 'recorded';
    bump(s.player, 'vocals', 0.8);
    if (prod.id === 'self') bump(s.player, 'production', 1);
    return { msg: `“${song.title}” recorded — final quality ${song.quality}.` };
  });
}

export function releaseMusic(state, { type = 'single', title, songIds, rollout = 'standard', cover, weeksFromNow = 0 }) {
  return run(state, (s) => {
    const ro = ROLLOUTS.find((r) => r.id === rollout) || ROLLOUTS[1];
    const songs = songIds.map((id) => s.songs.find((x) => x.id === id)).filter(Boolean);
    if (!songs.length) return fail('Choose at least one recorded song.');
    if (songs.some((x) => x.status !== 'recorded')) return fail('Only recorded, unreleased songs can be released.');
    if (type === 'single' && songs.length !== 1) return fail('A single is one song.');
    if (type === 'ep' && (songs.length < 3 || songs.length > 6)) return fail('An EP needs 3–6 songs.');
    if (type === 'album' && songs.length < 7) return fail('An album needs at least 7 songs.');
    if (!needEnergy(s, ENERGY.release)) return fail('Not enough energy.');
    if (!needCash(s, ro.cost)) return fail(`${ro.name} costs ${fmtMoney(ro.cost)}.`);
    s.player.energy -= ENERGY.release;
    if (ro.cost) spend(s, 'marketing', ro.cost, `Rollout: ${title || songs[0].title}`);
    const rel = {
      id: uid(s, 'rel'), type, title: (title || songs[0].title).trim(), songIds: songs.map((x) => x.id),
      cover: cover || songs[0].cover, rollout: ro.id, releaseWeek: s.week + clamp(weeksFromNow, 0, 6), status: 'scheduled', announcedWeek: s.week,
    };
    for (const song of songs) { song.status = 'scheduled'; song.releaseId = rel.id; song.cover = rel.cover; }
    s.releases.unshift(rel);
    s.player.hype = clamp(s.player.hype + ro.hype * 0.3, 0, 100);
    return { msg: weeksFromNow ? `“${rel.title}” scheduled for week ${rel.releaseWeek}.` : `“${rel.title}” drops this week. Hit Next Week to see how it lands.`, data: rel };
  });
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
    p.hype = clamp(p.hype + rng.float(1, 4) * (1 + p.skills.charisma / 150), 0, 100);
    const replies = rng.shuffle(CHIRP_REPLIES).slice(0, rng.int(2, 3)).map((t) => ({ user: `@${rng.pick(['luv', 'stan', 'beats', 'wave', 'nite', 'echo'])}${rng.int(10, 999)}`, text: t }));
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
    p.hype = clamp(p.hype + rng.float(1, 3), 0, 100);
    s.social.snapshot.unshift({ id: uid(s, 'ig'), week: s.week, caption: caption || '', image: image || null, gradient: rng.int(0, 7), likes, comments: Math.round(likes * 0.04) });
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
      p.hype = clamp(p.hype + 20, 0, 100);
      p.fans += Math.round(gain * 0.3);
      pushNews(s, `“${song.title}” by ${p.stageName} is blowing up on Clipz`, true, 'Viral');
      s.weekFlags.viral = song.title;
    }
    s.social.clipz.unshift({ id: uid(s, 'cz'), week: s.week, songId, title: song.title, views, viral });
    s.social.clipz.length = Math.min(s.social.clipz.length, 30);
    return { msg: viral ? `It's going viral! ${fmtNum(views)} views.` : `${fmtNum(views)} views. Not quite viral.`, data: { viral } };
  });
}

export function pitchPlaylist(state, { songId }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    if (!song || song.status !== 'released') return fail('Only released songs can be pitched.');
    if (song.pitchedWeek === s.week) return fail('Already pitched this week.');
    if (!needSocial(s, SOCIAL.pitch)) return fail('Out of social energy.');
    if (!needCash(s, 50)) return fail('Pitching costs $50.');
    s.player.socialEnergy -= SOCIAL.pitch;
    spend(s, 'marketing', 50, `Playlist pitch: ${song.title}`);
    song.pitchedWeek = s.week;
    const chance = clamp(0.1 + song.quality / 200 + s.player.popularity / 300 + (s.player.label ? 0.1 : 0), 0.05, 0.85);
    if (rng.chance(chance)) {
      song.playlists = (song.playlists || 0) + 1;
      const name = rng.pick(['New Music Friday', 'Fresh Finds', 'Hot Hits', 'Chill Vibes', 'Global Viral 50', `${genreName(song.genre)} Rising`, 'Late Night Drive', 'Workout Beast', 'Top of the World']);
      song.playlistNames = [...(song.playlistNames || []), name];
      return { msg: `Added to “${name}”!`, data: { placed: true, name } };
    }
    return { msg: 'Curators passed this time.', data: { placed: false } };
  });
}

export const VIDEO_TIERS = [
  { id: 'phone', name: 'Phone shoot', cost: 0, mult: 0.5 },
  { id: 'indie', name: 'Indie director', cost: 3000, mult: 1.5 },
  { id: 'pro', name: 'Pro production', cost: 20000, mult: 4 },
  { id: 'blockbuster', name: 'Blockbuster', cost: 120000, mult: 10 },
];
export function makeVideo(state, { songId, tier }) {
  return run(state, (s, rng) => {
    const song = s.songs.find((x) => x.id === songId);
    const t = VIDEO_TIERS.find((x) => x.id === tier);
    if (!song || !['released', 'scheduled'].includes(song.status)) return fail('Pick a released or scheduled song.');
    if (s.social.videos.some((v) => v.songId === songId)) return fail('This song already has a video.');
    if (!t) return fail('Pick a budget.');
    if (!needEnergy(s, ENERGY.video)) return fail('Not enough energy for a shoot.');
    if (!needCash(s, t.cost)) return fail(`${t.name} costs ${fmtMoney(t.cost)}.`);
    s.player.energy -= ENERGY.video;
    if (t.cost) spend(s, 'videoProd', t.cost, `Music video: ${song.title}`);
    s.social.videos.unshift({ id: uid(s, 'v'), songId, title: song.title, tier: t.id, week: s.week, views: 0, weekly: Math.round((s.player.followers.viewtube + 500) * t.mult * rng.float(0.8, 1.4) * (song.quality / 50)), gradient: song.cover?.gradient ?? 0 });
    s.player.hype = clamp(s.player.hype + 3 * t.mult, 0, 100);
    return { msg: `Video for “${song.title}” is live on ViewTube.` };
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
    bump(s.player, j.skill, 0.8);
    return { msg: `Earned ${fmtMoney(pay)} from ${j.name.toLowerCase()}.` };
  });
}

export function gigDemand(state, cityId) {
  const p = state.player;
  const heat = p.fanHeat[cityId] || 0;
  return Math.round(heat * 0.35 + p.fans * 0.02 + p.hype * 3 + p.skills.performance * 2);
}

export function playGig(state, { venueId, cityId }) {
  return run(state, (s, rng) => {
    const v = VENUES.find((x) => x.id === venueId);
    const city = cityById(cityId);
    if (!v) return fail('Pick a venue.');
    if (s.player.fans < v.minFans) return fail(`Promoters want ${fmtNum(v.minFans)}+ fans for a ${v.name.toLowerCase()}.`);
    if (!needEnergy(s, v.energy)) return fail('Not enough energy for this show.');
    const travel = cityId === s.player.city ? 0 : Math.round(150 + v.capacity * 0.6);
    if (!needCash(s, travel)) return fail(`Travel and crew cost ${fmtMoney(travel)}.`);
    s.player.energy -= v.energy;
    if (travel) spend(s, 'touring', travel, `Travel: ${city.name}`);
    const demand = gigDemand(s, cityId) * rng.float(0.8, 1.2);
    const sold = Math.min(v.capacity, Math.round(demand));
    const soldOut = sold >= v.capacity;
    const pay = sold * v.ticket * (s.player.staff.booking ? 1.2 : 1);
    earn(s, 'gigs', pay, `${v.name} — ${city.name}`);
    const newFans = Math.round(sold * rng.float(0.08, 0.2) * (1 + s.player.skills.performance / 100));
    s.player.fans += newFans;
    s.player.fanHeat[cityId] = (s.player.fanHeat[cityId] || 0) + newFans;
    s.player.hype = clamp(s.player.hype + (soldOut ? 5 : 1), 0, 100);
    bump(s.player, 'performance', 1.2);
    if (soldOut) {
      s.player.sellouts += 1;
      if (v.capacity >= 2000) pushNews(s, `${s.player.stageName} sells out ${city.name}'s ${v.name.toLowerCase()}`, true, 'Live');
      s.weekFlags.sellout = `${v.name} in ${city.name}`;
    }
    return { msg: `${soldOut ? 'SOLD OUT! ' : ''}${fmtNum(sold)}/${fmtNum(v.capacity)} tickets · ${fmtMoney(pay)} · +${fmtNum(newFans)} fans`, data: { sold, soldOut, pay } };
  });
}

export function bookTour(state, { venueId, cityIds }) {
  return run(state, (s, rng) => {
    const v = VENUES.find((x) => x.id === venueId);
    if (!v || !cityIds?.length) return fail('Pick a venue size and cities.');
    if (cityIds.length < 3) return fail('A tour needs at least 3 cities.');
    if (s.player.fans < v.minFans * 1.5) return fail(`Touring ${v.name.toLowerCase()}s needs ${fmtNum(v.minFans * 1.5)}+ fans.`);
    if (!needEnergy(s, ENERGY.tour)) return fail('A tour needs 70 energy.');
    const cost = Math.round(cityIds.length * (400 + v.capacity * 1.2));
    if (!needCash(s, cost)) return fail(`Tour production costs ${fmtMoney(cost)}.`);
    s.player.energy -= ENERGY.tour;
    spend(s, 'touring', cost, `Tour production (${cityIds.length} cities)`);
    let total = 0; let sellouts = 0; let fans = 0;
    for (const cid of cityIds) {
      const sold = Math.min(v.capacity, Math.round(gigDemand(s, cid) * rng.float(0.8, 1.25)));
      if (sold >= v.capacity) sellouts++;
      total += sold * v.ticket * (s.player.staff.booking ? 1.2 : 1);
      const nf = Math.round(sold * rng.float(0.1, 0.22));
      fans += nf;
      s.player.fanHeat[cid] = (s.player.fanHeat[cid] || 0) + nf;
    }
    earn(s, 'gigs', total, `Tour: ${cityIds.length} ${v.name.toLowerCase()}s`);
    s.player.fans += fans;
    s.player.sellouts += sellouts;
    s.player.hype = clamp(s.player.hype + 8, 0, 100);
    bump(s.player, 'performance', 3);
    pushNews(s, `${s.player.stageName} wraps a ${cityIds.length}-city tour${sellouts ? ` with ${sellouts} sell-outs` : ''}`, true, 'Live');
    return { msg: `Tour grossed ${fmtMoney(total)} · ${sellouts} sell-outs · +${fmtNum(fans)} fans` };
  });
}

export function rest(state) {
  return run(state, (s) => {
    if (s.player.rested) return fail('You already rested this week.');
    s.player.rested = true;
    s.player.energy = clamp(s.player.energy + 25, 0, s.player.maxEnergy);
    s.player.socialEnergy = clamp(s.player.socialEnergy + 10, 0, s.player.maxSocial);
    return { msg: 'Recharged: +25 energy, +10 social.' };
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
  return run(state, (s) => {
    const m = s.inbox.find((x) => x.id === id);
    if (!m || m.type !== 'offer' || m.status) return fail('This offer is no longer available.');
    m.read = true;
    if (!accept) {
      m.status = 'declined';
      if (m.subtype === 'feature') s.player.hype = clamp(s.player.hype - 1, 0, 100);
      return { msg: 'Offer declined.' };
    }
    const o = m.payload;
    const p = s.player;
    if (o.energy && p.energy < o.energy) return fail(`Needs ${o.energy} energy.`);
    if (o.energy) p.energy -= o.energy;
    m.status = 'accepted';
    if (m.subtype === 'brand') {
      earn(s, 'brand', o.cash, `Brand deal: ${o.brand}`);
      p.hype = clamp(p.hype + 3, 0, 100);
      if (o.cash > 5000) p.fans = Math.round(p.fans * 0.995); // some fans call it selling out
      return { msg: `Deal signed with ${o.brand}: ${fmtMoney(o.cash)}.` };
    }
    if (m.subtype === 'feature') {
      earn(s, 'features', o.cash, `Feature for ${o.artist}`);
      p.fans += o.fans;
      p.hype = clamp(p.hype + 8, 0, 100);
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
      p.label = { id: o.labelId, name: o.label, royalty: o.royalty, signedWeek: s.week };
      earn(s, 'advance', o.advance, `Advance: ${o.label}`);
      pushNews(s, `${p.stageName} signs with ${o.label}`, true, 'Business');
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
    return { msg: hire ? `${st.name} hired — ${fmtMoney(st.salary)}/week.` : `${st.name} let go.` };
  });
}

export function signLabel(state, { labelId }) {
  return run(state, (s) => {
    const l = LABELS.find((x) => x.id === labelId);
    if (!l) return fail('Unknown label.');
    if (s.player.label) return fail(`You're signed to ${s.player.label.name}.`);
    if (s.player.popularity < l.minPop) return fail(`${l.name} wants popularity ${l.minPop}+.`);
    s.player.label = { id: l.id, name: l.name, royalty: l.royalty, signedWeek: s.week };
    earn(s, 'advance', l.advance, `Advance: ${l.name}`);
    pushNews(s, `${s.player.stageName} signs with ${l.name}`, true, 'Business');
    return { msg: `Signed to ${l.name}. ${fmtMoney(l.advance)} advance, ${Math.round(l.royalty * 100)}% royalty.` };
  });
}

export function leaveLabel(state) {
  return run(state, (s) => {
    if (!s.player.label) return fail('Not signed.');
    const fee = Math.round(Math.max(2000, s.player.cash * 0.1));
    spend(s, 'other', fee, `Contract buyout: ${s.player.label.name}`);
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
      p.hype = clamp(p.hype + (good ? 10 : -4), 0, 100);
      pushNews(s, good ? `Critics are calling ${p.stageName} one to watch` : `Mixed reviews for ${p.stageName}'s press run`, true, 'Press');
      return { msg: good ? 'Glowing write-up. Hype up.' : 'Lukewarm reviews. Hype dipped.' };
    }
    if (kind === 'radio') {
      const song = s.songs.find((x) => x.status === 'released');
      if (!song) return fail('Release a song before a radio tour.');
      song.radioBoost = (song.radioBoost || 0) + 0.6;
      p.hype = clamp(p.hype + 4, 0, 100);
      return { msg: `Radio tour done — “${song.title}” gets more spins.` };
    }
    const fans = Math.round((Math.min(20000, p.fans * 0.02) + 50) * (1 + p.skills.charisma / 100));
    p.fans += fans;
    p.hype = clamp(p.hype + 6, 0, 100);
    bump(p, 'charisma', 1);
    return { msg: `Great interview. +${fmtNum(fans)} fans.` };
  });
}

export function payola(state, { amount }) {
  return run(state, (s) => {
    if (!needCash(s, amount)) return fail('Not enough cash.');
    const song = s.songs.find((x) => x.status === 'released');
    if (!song) return fail('You need a released song to push.');
    spend(s, 'other', amount, 'Consulting fee');
    song.payola = (song.payola || 0) + amount / 2500;
    s.player.suspicion = clamp(s.player.suspicion + amount / 400 + 4, 0, 100);
    return { msg: `Spins incoming for “${song.title}”. Suspicion now ${Math.round(s.player.suspicion)}.` };
  });
}

export function updatePlayer(state, patch) {
  return run(state, (s) => {
    Object.assign(s.player, patch);
  });
}

export { lengthFit, CITIES };
