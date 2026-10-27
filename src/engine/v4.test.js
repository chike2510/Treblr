import { describe, it, expect } from 'vitest';
import * as E from './index.js';

const setup = { firstName: 'Ada', lastName: 'Moss', stageName: 'ADAMOSS', city: 'lon', age: 22, genre: 'pop', subgenres: [], path: 'bedroom' };
const fresh = (over = {}, seed = 4242) => E.createNewGame({ ...setup, ...over }, seed);
const ok = (r) => { expect(r.ok, r.msg).toBe(true); return r.state; };
let n = 0;
function released(s, q = 75) {
  s.player.cash += 1e6; s.player.energy = 100;
  s = ok(E.writeSong(s, { title: `Song ${++n}`, genre: 'pop', theme: 'Love', length: 180 }));
  const id = s.songs[0].id;
  s = ok(E.recordSong(s, { songId: id, producerId: 'local' }));
  s.songs[0].quality = q;
  s = ok(E.releaseMusic(s, { type: 'single', songIds: [id], rollout: 'standard' }));
  s = E.advanceWeek(s);
  return { s, id };
}

describe('fame & popularity', () => {
  it('popularity is a log scale on listeners', () => {
    expect(E.popularityFromListeners(1000)).toBe(0);
    expect(E.popularityFromListeners(1e5)).toBe(40);
    expect(E.popularityFromListeners(1e6)).toBe(60);
    expect(E.popularityFromListeners(1e8)).toBe(100);
  });
  it('one viral month only moves the 26-week rolling average a little', () => {
    const hist = Array(22).fill(1e5).concat([5e6, 5e6, 5e6, 5e6]);
    const avg = E.rollingListeners(hist);
    expect(avg).toBeLessThan(2.5e6);
    expect(E.popularityFromListeners(avg)).toBeLessThan(E.popularityFromListeners(5e6));
  });
  it('superstar needs popularity, star points AND time', () => {
    expect(E.fameTierFor(95, 5000, 40).id).not.toBe('superstar');
    expect(E.fameTierFor(95, 100, 200).id).not.toBe('superstar');
    expect(E.fameTierFor(80, 900, 160).id).toBe('superstar');
  });
});

describe('release variance & fall-off', () => {
  it('reception varies between releases and can flop', () => {
    let s = fresh();
    const rng = E.createRng(9);
    const vals = Array.from({ length: 200 }, () => E.releaseReception(s, rng, [{ quality: 70 }]));
    expect(Math.min(...vals)).toBeLessThan(0.65);
    expect(Math.max(...vals)).toBeGreaterThan(1.45);
    const r = released(s);
    expect(r.s.songs[0].reception).toBeGreaterThan(0);
  });
  it('fans churn faster the longer you stay quiet', () => {
    let s = released(fresh()).s;
    s.player.fans = 1e6;
    let a = s; for (let i = 0; i < 4; i++) a = E.advanceWeek(a);
    let b = JSON.parse(JSON.stringify(s)); b.player.lastReleaseWeek = s.week - 60;
    for (let i = 0; i < 4; i++) b = E.advanceWeek(b);
    expect(b.player.fans).toBeLessThan(a.player.fans);
  });
  it('old catalogue fades below the old floor after a year', () => {
    expect(E.decay(70, 120)).toBeLessThan(0.025);
    expect(E.decay(70, 10)).toBeGreaterThan(E.decay(70, 120));
  });
});

describe('certifications, units & first weeks', () => {
  it('song ladder: Gold 75M ... Diamond 3B with multi-platinum', () => {
    expect(E.certFor(74e6, E.SONG_CERTS)).toBeNull();
    expect(E.certFor(75e6, E.SONG_CERTS).id).toBe('gold');
    expect(E.certFor(450e6, E.SONG_CERTS).name).toBe('3× Platinum');
    expect(E.certFor(1.4e9, E.SONG_CERTS).name).toBe('9× Platinum');
    expect(E.certFor(3e9, E.SONG_CERTS).id).toBe('diamond');
  });
  it('album ladder: Gold 500K units ... Diamond 10M; 2,500 streams = 1 unit', () => {
    expect(E.STREAMS_PER_UNIT).toBe(2500);
    expect(E.certFor(5e5, E.ALBUM_CERTS).id).toBe('gold');
    expect(E.certFor(2e6, E.ALBUM_CERTS).name).toBe('2× Platinum');
    expect(E.certFor(1e7, E.ALBUM_CERTS).id).toBe('diamond');
  });
  it('a player song certifies and posts to the stats feed', () => {
    let { s, id } = released(fresh());
    s.songs.find((x) => x.id === id).lifetimeStreams = 160e6;
    s = E.advanceWeek(s);
    expect(s.songs.find((x) => x.id === id).cert).toBe('platinum');
    expect(s.statFeed.some((x) => x.pl && /Platinum/.test(x.text))).toBe(true);
  });
  it('lead-single streams count toward album total but not its first week', () => {
    let { s, id } = released(fresh());
    s.songs.find((x) => x.id === id).lifetimeStreams = 25e6; // 10,000 units of pre-release streams
    const ids = [id];
    for (let i = 0; i < 3; i++) {
      s.player.cash += 1e5; s.player.energy = 100;
      s = ok(E.writeSong(s, { title: `EP cut ${i}`, genre: 'pop', theme: 'Love', length: 180 }));
      const nid = s.songs[0].id;
      s = ok(E.recordSong(s, { songId: nid, producerId: 'local' }));
      ids.push(nid);
    }
    s = ok(E.releaseMusic(s, { type: 'ep', title: 'The EP', songIds: ids, rollout: 'standard' }));
    const rel = s.releases[0];
    expect(rel.preUnits).toBe(10000);
    s = E.advanceWeek(s);
    const out = s.releases.find((r) => r.id === rel.id);
    expect(out.firstWeek).toBeGreaterThan(0);
    expect(out.totalUnits).toBe(out.firstWeek + 10000);
    expect(s.statFeed.some((x) => x.pl && /first week/.test(x.text))).toBe(true);
  });
  it('titles are unique per artist', () => {
    let s = fresh();
    s = ok(E.writeSong(s, { title: 'Same', genre: 'pop', theme: 'Love', length: 180 }));
    s.player.energy = 100;
    expect(E.writeSong(s, { title: 'same', genre: 'pop', theme: 'Love', length: 180 }).ok).toBe(false);
    for (const r of s.rivals.slice(0, 20)) expect(new Set(r.usedTitles).size).toBe(r.usedTitles.length);
  });
  it('EPs are never offered for Album of the Year', () => {
    const s = fresh();
    s.releases.push({ id: 'x1', type: 'ep', title: 'Tiny', status: 'out', releaseWeek: s.week, songIds: [] });
    s.releases.push({ id: 'x2', type: 'album', title: 'Big', status: 'out', releaseWeek: s.week, songIds: [] });
    const opts = E.awardOptions(s).filter((o) => o.category === 'Album of the Year').map((o) => o.title);
    expect(opts).toEqual(['Big']);
  });
});

describe('NPC release cadence', () => {
  it('superstars release ~2-4 singles a year and albums every 1.5-3 years', () => {
    let s = fresh();
    const stars = s.rivals.filter((r) => r.tier === 'superstar').map((r) => r.id);
    const singles = {}; const albums = {};
    const seen = new Set(s.rivalSongs.map((x) => x.id));
    for (let w = 0; w < 104; w++) {
      s = E.advanceWeek(s);
      for (const x of s.rivalSongs) if (!seen.has(x.id)) { seen.add(x.id); if (stars.includes(x.rivalId) && !x.albumCut) singles[x.rivalId] = (singles[x.rivalId] || 0) + 1; }
      for (const a of s.rivalAlbums) if (a.releasedWeek === s.week - 1 && stars.includes(a.rivalId)) albums[a.rivalId] = (albums[a.rivalId] || 0) + 1;
    }
    const avgSingles = stars.reduce((a, id) => a + (singles[id] || 0), 0) / stars.length / 2;
    const avgAlbums = stars.reduce((a, id) => a + (albums[id] || 0), 0) / stars.length / 2;
    expect(avgSingles).toBeGreaterThanOrEqual(1.5);
    expect(avgSingles).toBeLessThanOrEqual(4.5);
    expect(avgAlbums).toBeLessThanOrEqual(0.9);
    expect(avgAlbums).toBeGreaterThan(0.2);
  }, 60000);
  it('NPC albums carry their era singles, generated covers and units', () => {
    let s = fresh();
    for (let w = 0; w < 40; w++) s = E.advanceWeek(s);
    const a = s.rivalAlbums.find((x) => x.releasedWeek > 1);
    expect(a).toBeTruthy();
    expect(a.cover.style).toBeGreaterThan(0);
    expect(a.firstWeek).toBeGreaterThan(0);
    expect(a.songIds.length).toBeGreaterThan(0);
  }, 30000);
});

describe('money: loans, labels, lifestyle', () => {
  it('credit score drives loans; missed payments hurt; 3 misses default', () => {
    let s = fresh();
    s.bank.incomeLog = Array(8).fill(3000);
    s.bank.onTime = 6;
    const o = E.loanOffer(s);
    expect(o.score).toBeGreaterThanOrEqual(520);
    expect(o.max).toBeGreaterThan(0);
    s = ok(E.takeLoan(s, { amount: Math.min(o.max, 5000), weeks: 26 }));
    expect(s.bank.loans).toHaveLength(1);
    const scoreBefore = E.creditScore(s);
    for (let i = 0; i < 3; i++) { s.player.cash = -100000; s = E.advanceWeek(s); }
    expect(s.bank.defaults).toBe(1);
    expect(s.bank.loans).toHaveLength(0);
    expect(E.creditScore(s)).toBeLessThan(scoreBefore);
    expect(E.loanOffer(s).max).toBe(0);
  });
  it('label deals: advances ~2.5x, 1-3 albums, recoupment before royalties pay out', () => {
    expect(E.LABELS.length).toBeGreaterThanOrEqual(25);
    expect(E.LABELS.find((l) => l.id === 'apex').advance).toBe(1250000);
    let s = fresh();
    s.player.popularity = 60;
    const t = E.labelTerms(s, E.labelById('meridian'), E.createRng(1));
    expect(t.albums).toBeGreaterThanOrEqual(2);
    s.inbox.unshift({ id: 'mx', type: 'offer', subtype: 'label', from: t.label, subject: 'deal', body: '', payload: t, week: s.week, expires: s.week + 3, read: false });
    const neg = E.negotiateDeal(s, { id: 'mx', ask: { advance: t.advance * 1.1 } });
    expect(neg.ok).toBe(true);
    s = ok(E.respondOffer(neg.state, { id: 'mx', accept: true }));
    expect(s.player.label.advance).toBeGreaterThan(0);
    expect(s.player.label.albums).toBe(t.albums);
    const net = E.labelRoyalty(s, 10000);
    expect(net).toBe(0); // still recouping
    expect(s.player.label.recouped).toBeGreaterThan(0);
  });
  it('labelmates get cheaper features', () => {
    const s = fresh();
    s.player.popularity = 55;
    const r = s.rivals.find((x) => x.tier === 'established');
    const base = E.featureQuote(s, r.id);
    s.player.label = { id: E.rivalLabelId(r), name: 'x', royalty: 0.3, advance: 0, recouped: 0 };
    const mate = E.featureQuote(s, r.id);
    expect(mate.labelmate).toBe(true);
    expect(mate.fee).toBeLessThan(base.fee);
    expect(mate.odds).toBeGreaterThan(base.odds);
  });
  it('lifestyle: buying a home stops rent, upkeep is charged, items can be sold', () => {
    let s = fresh();
    s.player.cash = 1e6;
    s = ok(E.buyLifestyle(s, { id: 'house' }));
    expect(E.housingCost(s)).toBe(0);
    const before = s.player.cash;
    s = E.advanceWeek(s);
    expect(s.history.at(-1).expense.lifestyle).toBeGreaterThan(0);
    expect(s.history.at(-1).expense.rent || 0).toBe(0);
    const uid = s.lifestyle.owned[0].uid;
    s = ok(E.sellLifestyle(s, { uid }));
    expect(s.player.cash).toBeGreaterThan(before);
  });
});

describe('payola, acting, festivals, tours', () => {
  it('payola chart package buys millions of streams and raises suspicion', () => {
    let { s, id } = released(fresh());
    s.player.cash = 1e6;
    const before = s.songs.find((x) => x.id === id).weeklyStreams;
    s = ok(E.payolaPackage(s, { pkg: 'chart', songId: id }));
    expect(s.player.suspicion).toBeGreaterThanOrEqual(35);
    s.player.suspicion = 0; // isolate the stream effect from the exposure roll
    s = E.advanceWeek(s);
    expect(s.songs.find((x) => x.id === id).weeklyStreams).toBeGreaterThan(before + 5e6);
  });
  it('payola exposure: chart ban, fan loss, possible label drop', () => {
    const s = fresh();
    s.player.suspicion = 100; s.player.fans = 100000;
    let caught = false;
    for (let seed = 1; seed < 20 && !caught; seed++) { s.player.suspicion = 100; caught = E.payolaExposure(s, E.createRng(seed), []); }
    expect(caught).toBe(true);
    expect(s.player.chartBanUntil).toBeGreaterThan(s.week);
    expect(s.player.fans).toBeLessThan(100000);
    expect(E.computeCharts(s, {}).hot100.some((e) => e.pl)).toBe(false);
  });
  it('acting: audition -> shoot -> premiere', () => {
    let s = fresh();
    s.player.popularity = 40; s.player.skills.acting = 60; s.player.skills.charisma = 80;
    let r;
    for (let i = 0; i < 12; i++) { r = E.audition(s, { roleId: 'indie' }); s = r.state; if (s.acting.current) break; s = E.advanceWeek(s); s.player.popularity = 40; }
    expect(s.acting.current).toBeTruthy();
    for (let i = 0; i < 30 && s.acting.current; i++) { s = E.advanceWeek(s); s.player.popularity = 40; }
    expect(s.acting.credits).toHaveLength(1);
    expect(s.acting.credits[0].score).toBeGreaterThan(0);
  });
  it('festivals: pitch in the window, see the lineup, play', () => {
    let s = fresh();
    s.player.popularity = 60;
    const f = E.festivalCalendar(s, 30).find((x) => x.pitchOpen);
    expect(f).toBeTruthy();
    s = ok(E.pitchFestival(s, { key: f.key }));
    s.festivals[f.key].accepted = true; s.festivals[f.key].slot = 'sub';
    const lu = E.festivalLineup(s, f, f.key);
    expect(lu.headliner.length).toBe(3);
    expect(lu.me).toBe('sub');
    while (s.week <= f.festWeek) { s = E.advanceWeek(s); s.player.popularity = 60; }
    expect(s.festivals[f.key].played.fee).toBeGreaterThan(0);
  });
  it('setlists: big songs, opener/closer and crew raise show quality', () => {
    let s = fresh();
    const ids = [];
    for (let i = 0; i < 8; i++) { const r = released(s, 60 + i * 4); s = r.s; ids.push(r.id); }
    s.songs.find((x) => x.id === ids[7]).lifetimeStreams = 5e7;
    const weak = E.setlistScore(s, ids.slice(0, 3), 'club', []);
    const strong = E.setlistScore(s, [ids[7], ...ids.slice(1, 7), ids[6]], 'club', ['sound', 'lighting']);
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('quality of life', () => {
  it('training costs ~40% less energy', () => {
    expect(E.TRAINING.find((t) => t.id === 'songwriting').energy).toBe(12);
  });
  it('gig offers never offer open-mic rooms to a charting artist and do not repeat', () => {
    let s = fresh();
    s.player.fans = 60000; s.player.bestRank = 50;
    for (let i = 0; i < 30; i++) s = E.advanceWeek(s);
    const gigs = s.inbox.filter((m) => m.subtype === 'gig');
    expect(gigs.some((m) => /Open-mic/.test(m.subject))).toBe(false);
    const keys = gigs.map((m) => `${m.subject}|${m.week}`);
    for (const g of gigs) {
      const same = gigs.filter((x) => x.subject === g.subject && x !== g);
      for (const x of same) expect(Math.abs(x.week - g.week)).toBeGreaterThanOrEqual(10);
    }
    void keys;
  }, 30000);
  it('similar notifications are grouped', () => {
    const s = fresh();
    E.pushNotif(s, 'offer', 'A', null, 'offer');
    E.pushNotif(s, 'offer', 'B', null, 'offer');
    E.pushNotif(s, 'offer', 'C', null, 'offer');
    const g = s.notifications.filter((x) => x.group === 'offer');
    expect(g).toHaveLength(1);
    expect(g[0].count).toBe(3);
  });
  it('free-text chat gets a keyword reply', () => {
    let s = fresh();
    const c = s.contacts.find((x) => x.role === 'manager');
    s = ok(E.sendChat(s, { contactId: c.id, text: 'what should my release plan be?' }));
    const t = s.contacts.find((x) => x.id === c.id).thread;
    expect(t.at(-2).from).toBe('me');
    expect(t.at(-1).from).toBe('them');
  });
  it('catalogue: delete unreleased songs, pre-release pitch, genre-fit promo', () => {
    let s = fresh();
    s = ok(E.writeSong(s, { title: 'Bin me', genre: 'pop', theme: 'Love', length: 180 }));
    const id = s.songs[0].id;
    s = ok(E.deleteSong(s, { songId: id }));
    expect(s.songs.some((x) => x.id === id)).toBe(false);
    s.player.energy = 100; s.player.cash = 1e5;
    s = ok(E.writeSong(s, { title: 'Keep me', genre: 'metal', theme: 'Love', length: 180 }));
    const k = s.songs[0].id;
    s = ok(E.recordSong(s, { songId: k, producerId: 'local' }));
    s = ok(E.pitchPlaylist(s, { songId: k }));
    expect(s.songs[0].prePitch).toBe(true);
    expect(E.promoIdea(s, { songId: k, idea: 'dancepractice' }).ok).toBe(false);
    s = ok(E.promoIdea(s, { songId: k, idea: 'playthrough' }));
    expect(s.songs[0].preBuzz).toBeGreaterThan(0);
    expect(E.promoIdeasFor('metal').some((x) => x.id === 'challenge')).toBe(false);
    expect(E.promoIdeasFor('kpop').some((x) => x.id === 'dancepractice')).toBe(true);
  });
  it('roster packs: merge adds/removes artists for new saves, replace swaps the roster', () => {
    const pack = { format: 'treblr-roster-pack', version: 1, artists: [{ name: 'Nova Quill', genre: 'indie', country: 'GB', ml: 3e6 }], removed: [E.ARTIST_ROSTER[0].name] };
    const s = fresh({ roster: pack });
    expect(s.rivals.some((r) => r.name === 'Nova Quill')).toBe(true);
    expect(s.rivals.some((r) => r.name === E.ARTIST_ROSTER[0].name)).toBe(false);
    const merged = E.mergeRosterPacks(pack, { format: 'treblr-roster-pack', artists: [{ name: 'Other', genre: 'pop', ml: 1e6 }] }, 'merge');
    expect(merged.artists).toHaveLength(2);
    expect(E.validateRosterPack({ format: 'nope' })).toBeTruthy();
  });
  it('rollout steps add pre-release hype to a scheduled EP', () => {
    let s = fresh();
    const ids = [];
    for (let i = 0; i < 3; i++) {
      s.player.energy = 100; s.player.cash = 1e5;
      s = ok(E.writeSong(s, { title: `R${i}`, genre: 'pop', theme: 'Love', length: 180 }));
      const id = s.songs[0].id; s = ok(E.recordSong(s, { songId: id, producerId: 'local' })); ids.push(id);
    }
    s.player.energy = 100;
    s = ok(E.releaseMusic(s, { type: 'ep', title: 'Era', songIds: ids, rollout: 'standard', weeksFromNow: 3 }));
    const rid = s.releases[0].id;
    s = ok(E.rolloutStep(s, { releaseId: rid, step: 'cover' }));
    s = ok(E.rolloutStep(s, { releaseId: rid, step: 'tracklist' }));
    expect(E.rolloutStep(s, { releaseId: rid, step: 'cover' }).ok).toBe(false);
    expect(s.releases[0].preHype).toBeCloseTo(0.1);
  });
});

describe('save migration v3 -> v4', () => {
  it('loads an old v3 save and keeps player work', () => {
    const s = fresh();
    const v3 = JSON.parse(JSON.stringify(s));
    v3.version = 3;
    for (const k of ['bank', 'lifestyle', 'acting', 'festivals', 'distributor', 'distributorPaidYear', 'statFeed', 'firstWeeks', 'offerLog', 'cloud', 'tours', 'awardSubmission']) delete v3[k];
    for (const k of ['fame', 'mlHistory', 'stats', 'chartBanUntil']) delete v3.player[k];
    delete v3.player.skills.acting;
    v3.player.label = { id: 'northbound', name: 'Northbound Records', royalty: 0.5, signedWeek: 1 };
    v3.songs = [{ id: 's1', title: 'Old Hit', genre: 'pop', status: 'released', releasedWeek: 1, quality: 70, weeklyStreams: 10, lifetimeStreams: 20e6, history: [], cover: { gradient: 1 }, peaks: { hot100: 40 }, cert: 'platinum' }];
    for (const a of v3.rivalAlbums) { a.cover = { gradient: 2 }; delete a.firstWeek; delete a.totalUnits; delete a.type; }
    for (const r of v3.rivals) { delete r.nextSingle; delete r.nextAlbum; delete r.eraSingles; }
    const m = E.migrate(v3);
    expect(m.version).toBe(4);
    expect(m.songs[0].title).toBe('Old Hit');
    expect(m.songs[0].cert).toBeNull(); // 20M streams is below the new 75M Gold line
    expect(m.player.skills.acting).toBe(0);
    expect(m.player.label.recouped).toBe(0);
    expect(m.rivals.every((r) => r.nextSingle != null)).toBe(true);
    expect(m.rivalAlbums.every((a) => a.cover.style > 0)).toBe(true);
    const n = E.advanceWeek(m);
    expect(n.week).toBe(m.week + 1);
    expect(Number.isFinite(n.player.popularity)).toBe(true);
  });
});
