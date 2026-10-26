import { describe, it, expect } from 'vitest';
import * as E from './index.js';
import { runSim } from '../../scripts/balance-sim.mjs';
import realListeners from '../../scripts/real_listeners-2026-10-26.json' with { type: 'json' };

const setup = { firstName: 'Sam', lastName: 'Lee', stageName: 'SAMLEE', city: 'tor', age: 22, genre: 'pop', subgenres: [], path: 'bedroom' };
const fresh = (over = {}, seed = 777) => E.createNewGame({ ...setup, ...over }, seed);
const ok = (r) => { expect(r.ok, r.msg).toBe(true); return r.state; };
function recorded(s, q = 70) {
  s = ok(E.writeSong(s, { title: 'Tune', genre: 'pop', theme: 'Love', length: 180 }));
  const id = s.songs[0].id;
  s.player.cash += 100000; s.player.energy = 100;
  s = ok(E.recordSong(s, { songId: id, producerId: 'local' }));
  s.songs[0].quality = q;
  return { s, id };
}

describe('real-world NPC roster', () => {
  it('has ~100 real artists plus a few fictional rising acts, seeded from the kworb snapshot', () => {
    const real = E.ARTIST_ROSTER.filter((a) => a.real);
    const fict = E.ARTIST_ROSTER.filter((a) => !a.real);
    expect(real.length).toBeGreaterThanOrEqual(80);
    expect(real.length).toBeLessThanOrEqual(100);
    expect(fict.length).toBeGreaterThanOrEqual(5);
    expect(E.REAL_ARTISTS_SOURCE.date).toBe('2026-10-26');
    const byName = Object.fromEntries(realListeners.map((x) => [x.name, x.monthlyListeners]));
    for (const a of real) {
      if (!a.estimated) expect(a.ml).toBe(byName[a.name]);
      else expect(byName[a.name]).toBeUndefined();
    }
    expect(E.ARTIST_ROSTER.find((a) => a.name === 'Bruno Mars').ml).toBe(byName['Bruno Mars']);
    expect(E.ARTIST_ROSTER.find((a) => a.name === 'Bruno Mars').tier).toBe('superstar');
    expect(new Set(real.map((a) => a.country)).size).toBeGreaterThanOrEqual(20);
    for (const t of ['superstar', 'star', 'established', 'rising']) expect(real.some((a) => a.tier === t)).toBe(true);
  });
  it('starts NPC listeners at their real numbers and superstars dominate early charts', () => {
    const s = fresh();
    const tay = s.rivals.find((r) => r.name === 'Taylor Swift');
    expect(Math.abs(tay.monthlyListeners / tay.baseML - 1)).toBeLessThan(0.05);
    const n = E.advanceWeek(s);
    const top20 = n.charts.hot100.slice(0, 20).map((e) => n.rivals.find((r) => r.id === n.rivalSongs.find((x) => x.id === e.id)?.rivalId));
    expect(top20.filter((r) => r && ['superstar', 'star'].includes(r.tier)).length).toBeGreaterThanOrEqual(15);
  });
  it('market strength reflects where acts are actually big', () => {
    const s = E.advanceWeek(fresh());
    const artistOn = (chart) => s.charts[chart].slice(0, 10).map((e) => E.chartItem(s, chart, e).artist);
    const inTop = artistOn('IN');
    expect(inTop.some((a) => ['Arijit Singh', 'Shreya Ghoshal', 'Pritam', 'A.R. Rahman', 'Badshah', 'Diljit Dosanjh'].includes(a))).toBe(true);
    const sh = E.artistShares(s.rivals.find((r) => r.name === 'Arijit Singh'));
    expect(sh.IN).toBeGreaterThan(sh.US);
    const bts = E.artistShares(s.rivals.find((r) => r.name === 'BTS'));
    expect(bts.KR + bts.JP).toBeGreaterThan(0.3);
    expect(E.artistShares(s.rivals.find((r) => r.name === 'Burna Boy')).NG).toBeGreaterThan(0.1);
  });
  it('NPC titles are generated, never real song titles; NPCs release on cadences and drift', () => {
    let s = fresh();
    const ids0 = new Set(s.rivalSongs.map((x) => x.id));
    for (let i = 0; i < 20; i++) s = E.advanceWeek(s);
    const newSongs = s.rivalSongs.filter((x) => !ids0.has(x.id));
    expect(newSongs.length).toBeGreaterThan(20);
    const bySuper = newSongs.filter((x) => s.rivals.find((r) => r.id === x.rivalId).tier === 'superstar').length;
    const superCount = s.rivals.filter((r) => r.tier === 'superstar').length;
    expect(bySuper / superCount).toBeLessThan(3);
    for (const r of s.rivals) expect(Number.isFinite(r.monthlyListeners)).toBe(true);
  });
  it('collab fees and odds scale with the popularity gap and relationship', () => {
    const s = fresh(); s.player.popularity = 55;
    const star = s.rivals.find((r) => r.name === 'Taylor Swift');
    const small = s.rivals.find((r) => !r.real);
    const qa = E.collabQuote(s.player, star, 0);
    const qb = E.collabQuote(s.player, small, 0);
    expect(qa.fee).toBeGreaterThan(qb.fee * 20);
    expect(qa.odds).toBeLessThan(0.1);
    expect(qb.odds).toBeGreaterThan(0.5);
    expect(E.collabQuote(s.player, small, 80).odds).toBeGreaterThan(qb.odds);
    expect(E.collabQuote(s.player, small, 80).fee).toBeLessThan(qb.fee);
  });
});

describe('balance mechanics', () => {
  it('energy: write+record+release+gig+job no longer fits in a week', () => {
    let s = fresh();
    s.player.cash = 50000;
    s = ok(E.writeSong(s, { title: 'A', genre: 'pop', length: 180 }));
    s = ok(E.recordSong(s, { songId: s.songs[0].id, producerId: 'local' }));
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [s.songs[0].id], rollout: 'standard' }));
    s = ok(E.playGig(s, { venueId: 'bar', cityId: 'tor' }));
    expect(E.doJob(s, { jobId: 'barista' }).ok).toBe(false);
  });
  it('burnout: draining to 0 repeatedly lowers next week energy cap; rest restores', () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) { s.player.energy = 0; s = E.advanceWeek(s); }
    expect(s.player.burnout).toBeGreaterThan(40);
    expect(s.player.maxEnergy).toBeLessThan(85);
    const b = s.player.burnout;
    s = ok(E.rest(s));
    expect(s.player.burnout).toBeLessThan(b);
    for (let i = 0; i < 6; i++) { s.player.energy = 80; s = E.advanceWeek(s); }
    expect(s.player.maxEnergy).toBeGreaterThanOrEqual(95);
  });
  it('hype decays faster at high values and gains are soft-capped', () => {
    expect(85 - E.hypeDecay(85)).toBeGreaterThan(20 - E.hypeDecay(20));
    const lo = { hype: 10 }; const hi = { hype: 85 };
    E.gainHype(lo, 10); E.gainHype(hi, 10);
    expect(lo.hype - 10).toBeGreaterThan(hi.hype - 85);
    expect(hi.hype).toBeLessThan(90);
    let s = fresh(); s.player.hype = 85;
    s = E.advanceWeek(s);
    expect(s.player.hype).toBeLessThan(70);
  });
  it('release fatigue cuts discovery for drops within 3 weeks', () => {
    expect(E.releaseFatigue(1)).toBeLessThan(E.releaseFatigue(3));
    expect(E.releaseFatigue(5)).toBe(1);
    let { s, id } = recorded(fresh());
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [id], rollout: 'standard' }));
    s = E.advanceWeek(s);
    let r2 = recorded(s); s = r2.s;
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [r2.id], rollout: 'standard' }));
    s = E.advanceWeek(s);
    expect(s.songs.find((x) => x.id === r2.id).fatigue).toBeLessThan(0.5);
    expect(s.songs.find((x) => x.id === id).fatigue).toBe(1);
  });
  it('skills grow with diminishing returns via training', () => {
    let s = fresh(); s.player.cash = 1e6;
    const g = [];
    for (const lvl of [30, 80]) { s.player.skills.songwriting = lvl; s.player.energy = 100; s.weekStats = {}; const n = ok(E.trainSkill(s, { skill: 'songwriting' })); g.push(n.player.skills.songwriting - lvl); }
    expect(g[0]).toBeGreaterThan(g[1] * 2.5);
    s.weekStats = { train: 2 }; s.player.energy = 100;
    expect(E.trainSkill(s, { skill: 'vocals' }).ok).toBe(false);
  });
  it('gig ladder: repeating a small room gets diminishing returns', () => {
    let s = fresh(); s.player.fans = 20000; s.player.fanHeat.tor = 15000;
    const fat = [];
    for (let i = 0; i < 4; i++) { s.player.energy = 100; const r = E.playGig(s, { venueId: 'bar', cityId: 'tor' }); s = r.state; fat.push(r.data.fatigue); }
    expect(fat[3]).toBeLessThan(fat[0]);
    expect(E.playGig({ ...s, player: { ...s.player, energy: 100 } }, { venueId: 'bar', cityId: 'tor' }).msg).toMatch(/regulars|outgrown/);
  });
  it('headlines vary and do not repeat a template within 4 weeks', () => {
    const s = fresh(); const rng = E.createRng(5);
    const hs = [];
    for (let w = 0; w < 4; w++) { s.week = 10 + w; hs.push(E.pickHeadline(s, rng, 'debut', { name: 'X', title: 'T', rank: 90, chart: 'Hot 100' })); }
    expect(new Set(hs).size).toBe(4);
    for (const k of ['debut', 'release', 'streams', 'quiet', 'sellout', 'viral']) expect(E.HEADLINE_POOLS[k].length).toBeGreaterThanOrEqual(5);
  });
  it('offers are deduped: max one active offer per brand/sender', () => {
    let s = fresh(); s.player.fans = 80000; s.player.popularity = 60;
    for (let i = 0; i < 30; i++) { s = E.advanceWeek(s); s.player.fans = 80000; }
    const active = s.inbox.filter((m) => m.type === 'offer' && !m.status);
    expect(new Set(active.map((m) => m.from)).size).toBe(active.length);
  });
  it('quality grows: a dedicated player reaches 75-85 by week 60 (sim)', () => {
    const r = runSim('paced', 11, 60);
    expect(r.q60).toBeGreaterThanOrEqual(72);
    expect(r.q60).toBeLessThanOrEqual(90);
  }, 30000);
});

describe('balance targets (headless sim, deterministic seeds)', () => {
  const paced = runSim('paced', 22, 104);
  const spam = runSim('spam', 22, 104);
  it('paced bedroom artist: first Hot 100 entry in weeks 25-55, no #1 before week 75', () => {
    expect(paced.firstHot100).toBeGreaterThanOrEqual(25);
    expect(paced.firstHot100).toBeLessThanOrEqual(55);
    if (paced.firstNo1 != null) expect(paced.firstNo1).toBeGreaterThanOrEqual(75);
  });
  it('weekly-single spam does worse than a paced cadence', () => {
    expect(spam.ml104).toBeLessThan(paced.ml104 / 5);
    expect(spam.firstHot100 == null || spam.firstHot100 > paced.firstHot100).toBe(true);
  });
  it('hype never pins at max', () => {
    expect(paced.hypeAvg).toBeLessThan(60);
    expect(spam.hypeAvg).toBeLessThan(60);
  });
});

describe('v3 systems', () => {
  it('weekly goals: 3 per week, progress, claim', () => {
    let s = fresh();
    expect(s.weekly.goals).toHaveLength(3);
    s.weekly.goals[0] = { id: 'g1', kind: 'write', label: 'Write 1 song', target: 1, reward: { cash: 100 }, claimed: false };
    expect(E.claimWeeklyGoal(s, { id: 'g1' }).ok).toBe(false);
    s = ok(E.writeSong(s, { title: 'X', genre: 'pop', length: 180 }));
    expect(E.weeklyGoalsView(s)[0].done).toBe(true);
    const c = s.player.cash;
    s = ok(E.claimWeeklyGoal(s, { id: 'g1' }));
    expect(s.player.cash).toBe(c + 100);
    expect(E.claimWeeklyGoal(s, { id: 'g1' }).ok).toBe(false);
    s = E.advanceWeek(s);
    expect(s.weekly.week).toBe(2);
    expect(s.weekStats).toEqual({});
  });
  it('timeline logs releases, eras and deals; chart streak counts', () => {
    let s = fresh();
    s = ok(E.startEra(s, { name: 'Neon Bloom', color: '#F472B6', vibe: 'bright' }));
    let r = recorded(s); s = r.s;
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [r.id], rollout: 'standard' }));
    expect(s.releases[0].cover.tint).toBe('#F472B6');
    expect(s.releases[0].eraId).toBe(s.eraId);
    s = E.advanceWeek(s);
    expect(s.timeline.some((t) => t.kind === 'era')).toBe(true);
    expect(s.timeline.some((t) => t.kind === 'release')).toBe(true);
    expect(E.startEra(s, { name: 'Too Soon', color: '#C6FF3D', vibe: 'dark' }).ok).toBe(false);
    s.player.fans = 3e6; s.player.monthlyListeners = 25e6; s.songs.find((x) => x.id === r.id).quality = 95;
    s = E.advanceWeek(s); s = E.advanceWeek(s);
    expect(s.player.chartStreak).toBeGreaterThanOrEqual(2);
    expect(s.player.bestStreak).toBeGreaterThanOrEqual(s.player.chartStreak);
  });
  it('spotlight: react raises relationship, diss starts beef', () => {
    let s = E.advanceWeek(fresh());
    for (let i = 0; i < 10 && !s.spotlight; i++) s = E.advanceWeek(s);
    expect(s.spotlight).toBeTruthy();
    const rid = s.spotlight.rivalId;
    const a = ok(E.spotlightReact(s, { choice: 'react' }));
    expect(E.relOf(a, rid)).toBeGreaterThan(0);
    const b = ok(E.spotlightReact(s, { choice: 'diss' }));
    expect(E.relOf(b, rid)).toBeLessThan(0);
    expect(b.contacts.find((c) => c.rivalId === rid).beef).toBe(true);
  });
  it('messages: choices change relationships; producer discount unlocks at high relationship', () => {
    let s = fresh();
    const prod = s.contacts.find((c) => c.role === 'producer');
    prod.thread.push({ from: 'them', text: 'beat?', week: 1, choices: [{ label: 'Send it', fx: { rel: 7 } }, { label: 'No', fx: { rel: -3 } }], answered: false });
    s = ok(E.replyMessage(s, { contactId: prod.id, choice: 0 }));
    expect(s.contacts.find((c) => c.id === prod.id).rel).toBe(32);
    expect(E.replyMessage(s, { contactId: prod.id, choice: 0 }).ok).toBe(false);
    const rising = E.PRODUCERS.find((p) => p.id === 'rising');
    expect(E.producerPrice(s, rising)).toBe(rising.price);
    s.contacts.find((c) => c.id === prod.id).rel = 65;
    expect(E.producerPrice(s, rising)).toBeLessThan(rising.price);
    let t = fresh();
    for (let i = 0; i < 15; i++) t = E.advanceWeek(t);
    expect(t.contacts.some((c) => c.thread.some((m) => m.choices))).toBe(true);
  });
  it('fan comments react to quality, release spam and scandals', () => {
    const s = fresh(); const rng = E.createRng(3);
    const great = E.fanComments(s, rng, { kind: 'song', song: { quality: 90 }, n: 30 }).map((c) => c.text);
    expect(great.some((t) => E.COMMENT_POOLS.great.includes(t))).toBe(true);
    expect(great.some((t) => E.COMMENT_POOLS.bad.includes(t))).toBe(false);
    const spam = E.fanComments(s, rng, { kind: 'song', song: { quality: 50, fatigue: 0.45 }, n: 30 }).map((c) => c.text);
    expect(spam.some((t) => E.COMMENT_POOLS.spam.includes(t))).toBe(true);
    s.crisis = { id: 'x' };
    expect(E.fanComments(s, rng, { n: 30 }).some((c) => E.COMMENT_POOLS.scandal.includes(c.text))).toBe(true);
  });
  it('beef & drama: subtweets appear and Reply / Ignore / Diss track work', () => {
    let s = fresh(); s.player.popularity = 40;
    s.drama = { id: 'd', rivalId: s.rivals[5].id, text: 'stay humble', week: 1, status: 'open' };
    E.contactForRival(s, s.rivals[5].id);
    const ig = ok(E.respondDrama(s, { choice: 'ignore' }));
    expect(ig.drama.status).toBe('ignored');
    const rp = ok(E.respondDrama(s, { choice: 'reply' }));
    expect(rp.social.chirp[0].mine).toBe(true);
    const d = ok(E.respondDrama(s, { choice: 'diss', title: 'Receipts' }));
    expect(d.songs[0].diss).toBe(s.rivals[5].id);
    expect(d.drama.status).toBe('diss');
    let t = fresh(); t.player.popularity = 40; t.player.fans = 50000;
    E.contactForRival(t, t.rivals[3].id).beef = true;
    let seen = false;
    for (let i = 0; i < 25 && !seen; i++) { t = E.advanceWeek(t); t.player.popularity = 40; seen = !!t.drama; }
    expect(seen).toBe(true);
  });
  it('live streams earn tips and fans, once a week', () => {
    let s = fresh(); s.player.followers.clipz = 50000;
    const r = E.goLive(s, { platform: 'treblrtok' });
    expect(r.ok).toBe(true);
    expect(r.data.chat.length).toBeGreaterThan(3);
    expect(r.state.player.socialEnergy).toBe(s.player.socialEnergy - E.SOCIAL.live);
    expect(E.goLive(r.state, { platform: 'treblrtube' }).ok).toBe(false);
  });
  it('dating is fictional-only; relationships show, breakups happen', () => {
    let s = fresh();
    const rng = E.createRng(9);
    const c = E.meetPerson(s, rng, 'a party');
    expect(E.FICTIONAL_PEOPLE.some(([n]) => n === c.name)).toBe(true);
    const artist = E.contactForRival(s, s.rivals[0].id);
    artist.rel = 100;
    expect(E.askOut(s, { contactId: artist.id }).ok).toBe(false);
    s.contacts.find((x) => x.id === c.id).rel = 95; s.player.skills.charisma = 90;
    let dated = null;
    for (let seed = 1; seed < 20 && !dated; seed++) { const t = JSON.parse(JSON.stringify(s)); t.rng = seed; const r = E.askOut(t, { contactId: c.id }); if (r.state.player.relationship.status === 'dating') dated = r.state; }
    expect(dated.player.relationship.partnerId).toBe(c.id);
    const b = ok(E.breakUp(dated));
    expect(b.player.relationship.status).toBe('single');
  });
  it('notifications collect alerts with deep links; mark read', () => {
    let s = fresh(); s.player.fans = 50000;
    for (let i = 0; i < 8; i++) s = E.advanceWeek(s);
    expect(s.notifications.length).toBeGreaterThan(0);
    expect(s.notifications[0].to).toBeTruthy();
    expect(E.unreadNotifs(s)).toBeGreaterThan(0);
    s = ok(E.markNotif(s, { id: s.notifications[0].id }));
    expect(s.notifications[0].read).toBe(true);
    s = ok(E.markAllNotifs(s));
    expect(E.unreadNotifs(s)).toBe(0);
  });
  it('collabs: feature credited on charts and boosts the song', () => {
    let { s, id } = recorded(fresh(), 80);
    const small = s.rivals.find((r) => !r.real);
    const c = E.contactForRival(s, small.id); c.rel = 90;
    let r; let st = s;
    for (let seed = 1; seed < 30; seed++) { const t = JSON.parse(JSON.stringify(st)); t.rng = seed; r = E.requestFeature(t, { rivalId: small.id, songId: id }); if (r.data?.accepted) break; }
    expect(r.data.accepted).toBe(true);
    s = r.state;
    const big = s.rivals.find((x) => x.name === 'Taylor Swift');
    expect(E.featureQuote(s, big.id).odds).toBeLessThan(0.1);
    const song = s.songs.find((x) => x.id === id);
    expect(song.feat).toBe(small.id);
    expect(song.featBoost).toBeGreaterThan(0);
    s.player.fans = 3e6; s.player.monthlyListeners = 25e6;
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [id], rollout: 'standard' }));
    s = E.advanceWeek(s);
    const e = E.playerPositions(s).find((x) => x.id === id);
    expect(e).toBeTruthy();
    expect(E.chartItem(s, e.chartId, s.charts[e.chartId].find((x) => x.id === id)).artist).toContain(small.name);

  });
  it('music videos: director tier & concept change quality and reach', () => {
    let { s, id } = recorded(fresh(), 70);
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [id], rollout: 'standard' }));
    s.player.cash = 1e6;
    const a = ok(E.makeVideo(s, { songId: id, director: 'phone', concept: 'visualizer' }));
    const b = ok(E.makeVideo(s, { songId: id, director: 'auteur', concept: 'dance' }));
    expect(b.social.videos[0].quality).toBeGreaterThan(a.social.videos[0].quality);
    expect(b.social.videos[0].weekly).toBeGreaterThan(a.social.videos[0].weekly);
    expect(b.social.videos[0].concept).toBe('dance');
  });
  it('albums: tracklist order is kept, lead singles boost album week', () => {
    let s = fresh(); s.player.cash = 1e6;
    const ids = [];
    for (let i = 0; i < 8; i++) { s.player.energy = 100; const r = recorded(s, 60 + i); s = r.s; ids.push(r.id); }
    s.player.energy = 100;
    s = ok(E.releaseMusic(s, { type: 'single', songIds: [ids[7]], rollout: 'standard' }));
    s = E.advanceWeek(s); s.player.energy = 100;
    const order = [ids[7], ids[6], ids[5], ids[0], ids[1], ids[2], ids[3], ids[4]];
    s = ok(E.releaseMusic(s, { type: 'album', title: 'LP', songIds: order, rollout: 'standard' }));
    const rel = s.releases[0];
    expect(rel.songIds).toEqual(order);
    expect(rel.leadSingles).toEqual([ids[7]]);
    expect(rel.sequencing).toBeGreaterThan(E.sequencingScore([...order].reverse().map((id) => s.songs.find((x) => x.id === id))));
    s = E.advanceWeek(s);
    expect(s.releases.find((r) => r.id === rel.id).albumBoost).toBeGreaterThan(1.1);
    expect(E.releaseMusic(s, { type: 'album', songIds: [ids[7]], rollout: 'standard' }).ok).toBe(false);
  });
  it('award shows: nomination -> attend -> reveal -> speech', () => {
    let s = fresh(); s.player.popularity = 70; s.player.bestRank = 5;
    s.week = 8;
    s = E.advanceWeek(s);
    expect(s.awardEvent.status).toBe('pending');
    const r = E.attendAwardShow(s, { outfit: 'bold', perform: true });
    expect(r.ok).toBe(true);
    if (r.data.won) {
      expect(r.state.awardEvent.status).toBe('won');
      const sp = ok(E.giveSpeech(r.state, { style: 'fans' }));
      expect(sp.awardEvent.status).toBe('done');
      expect(sp.player.awards.some((a) => a.kind === 'award')).toBe(true);
    } else expect(r.state.awardEvent.status).toBe('done');
    const skipped = E.advanceWeek(s);
    expect(skipped.awardEvent.status).toBe('done');
    expect(skipped.awardEvent.skipped).toBe(true);
  });
  it('PR crises: publicist handles better; unanswered crises resolve as ignored', () => {
    let s = fresh(); s.player.cash = 10000;
    E.openCrisis(s, 'leak', 'Demos leak', 'x');
    expect(s.crisis).toBeTruthy();
    const a = ok(E.handleCrisis(s, { choice: 'apologise' }));
    expect(a.crisis).toBeNull();
    const b = ok(E.handleCrisis(s, { choice: 'publicist' }));
    expect(b.player.cash).toBe(7500);
    s.player.staff.publicist = true;
    expect(ok(E.handleCrisis(s, { choice: 'publicist' })).player.cash).toBe(10000);
    let t = fresh(); E.openCrisis(t, 'rant', 'Old posts', 'x');
    t = E.advanceWeek(E.advanceWeek(t));
    expect(t.crisis?.title === 'Old posts').toBe(false);
  });
  it('Wrapped at week 52 with top songs, countries, artist type', () => {
    const r = runSim('paced', 11, 52);
    const w = r.state.wrapped[0];
    expect(w.year).toBe(1);
    expect(w.topSongs.length).toBeGreaterThan(0);
    expect(w.topCountries.length).toBe(3);
    expect(w.type.name).toBeTruthy();
    expect(r.state.lastReport.wrapped).toBe(1);
  }, 30000);
  it('multi-week tours resolve stops weekly, reserve energy, and can be cancelled', () => {
    let s = fresh(); s.player.fans = 20000; s.player.cash = 100000;
    s = ok(E.planTour(s, { venueId: 'club', cityIds: ['tor', 'nyc', 'chi', 'lon', 'par', 'ber'], perWeek: 2 }));
    expect(s.tour.stops).toHaveLength(6);
    expect(E.playGig(s, { venueId: 'bar', cityId: 'tor' }).ok).toBe(false);
    s = E.advanceWeek(s);
    expect(s.lastReport.tour.nights).toHaveLength(2);
    expect(s.player.energy).toBe(s.player.maxEnergy - s.tour.reserve);
    const c = ok(E.cancelTour(s));
    expect(c.tour).toBeNull();
    expect(c.player.cash).toBeLessThan(s.player.cash);
    s = E.advanceWeek(E.advanceWeek(s));
    expect(s.tour).toBeNull();
    expect(s.timeline.some((t) => /Tour wrapped/.test(t.title))).toBe(true);
  });
  it('artist photos: set, reset, export and import packs', () => {
    let s = fresh();
    const id = s.rivals[0].id;
    const img = 'data:image/jpeg;base64,AAAA';
    s = ok(E.setArtistPhoto(s, { rivalId: id, photo: img }));
    expect(s.artistPhotos[id]).toBe(img);
    const pack = E.exportPhotoPack(s);
    expect(pack.photos[s.rivals[0].name]).toBe(img);
    const t = ok(E.importPhotoPack(fresh(), { pack }));
    expect(t.artistPhotos[id]).toBe(img);
    expect(E.importPhotoPack(fresh(), { pack: { nope: 1 } }).ok).toBe(false);
    expect(E.setArtistPhoto(s, { rivalId: id, photo: 'javascript:1' }).ok).toBe(false);
    s = ok(E.setArtistPhoto(s, { rivalId: id, photo: null }));
    expect(s.artistPhotos[id]).toBeUndefined();
  });
  it('TreblrTok: trending sound and duet', () => {
    let { s, id } = recorded(fresh(), 70);
    const snd = s.rivalSongs[0];
    const a = ok(E.tokCreate(s, { songId: id, mode: 'sound', soundId: snd.id }));
    expect(a.social.clipz[0].mode).toBe('sound');
    const b = ok(E.tokCreate(s, { songId: id, mode: 'duet', rivalId: s.rivals[2].id }));
    expect(b.social.clipz[0].label).toMatch(/Duet/);
  });
});

describe('saves & stability', () => {
  it('migrates a v2 save (old fictional roster) to v3', () => {
    const s = fresh();
    const v2 = JSON.parse(JSON.stringify(s));
    v2.version = 2;
    for (const k of ['timeline', 'weekly', 'weekStats', 'spotlight', 'eras', 'eraId', 'contacts', 'drama', 'crisis', 'notifications', 'awardEvent', 'wrapped', 'yearStats', 'tour', 'artistPhotos', 'headlineLog']) delete v2[k];
    for (const k of ['burnout', 'chartStreak', 'bestStreak', 'gigLog', 'lastReleaseWeek', 'relationship']) delete v2.player[k];
    v2.rivals = [{ id: 'r0', name: 'Nova Lane', country: 'US', genre: 'pop', basePop: 92, monthlyListeners: 5e7, lastReleaseWeek: -3 }];
    v2.rivalSongs = [{ id: 'rs1', rivalId: 'r0', title: 'Old', genre: 'pop', quality: 70, releasedWeek: -2, weeklyStreams: 1, lifetimeStreams: 1, radio: 0, cover: { gradient: 0 } }];
    v2.songs = [{ id: 's1', title: 'Mine', genre: 'pop', status: 'released', releasedWeek: 1, quality: 60, weeklyStreams: 10, lifetimeStreams: 10, history: [], cover: { gradient: 1 }, peaks: { hot100: 50 } }];
    const m = E.migrate(v2);
    expect(m.version).toBe(E.SAVE_VERSION);
    expect(E.SAVE_VERSION).toBe(3);
    expect(m.rivals.length).toBe(E.ARTIST_ROSTER.length);
    expect(m.rivalSongs.every((x) => m.rivals.some((r) => r.id === x.rivalId))).toBe(true);
    expect(m.songs[0].peaks.hot100).toBe(50);
    expect(m.weekly.goals).toHaveLength(3);
    expect(m.contacts.length).toBe(3);
    const n = E.advanceWeek(m);
    expect(n.week).toBe(m.week + 1);
  });
  it('156-week sim has no NaN anywhere in player stats', () => {
    const r = runSim('paced', 33, 156);
    expect(r.nan).toBe(false);
    const p = r.state.player;
    for (const v of [p.cash, p.fans, p.monthlyListeners, p.popularity, p.hype, p.burnout, p.maxEnergy]) expect(Number.isFinite(v)).toBe(true);
    expect(r.state.wrapped.length).toBe(3);
    expect(JSON.stringify(r.state).length).toBeLessThan(3_000_000);
  }, 60000);
});
