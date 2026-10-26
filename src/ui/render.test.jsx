// Smoke test: every screen and phone app renders (server-side) for a fresh and a mid-career save.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  createNewGame, advanceWeek, writeSong, recordSong, releaseMusic, promoteClip, postChirp, makeVideo, playGig,
  goLive, startEra, openCrisis, setArtistPhoto, contactForRival, meetPerson, createRng,
} from '../engine/index.js';
import { GameCtx } from './kit.jsx';
import Home from '../screens/Home.jsx';
import Studio from '../screens/Studio.jsx';
import Phone from '../screens/Phone.jsx';
import Charts from '../screens/Charts.jsx';
import World from '../screens/World.jsx';
import Profile from '../screens/Profile.jsx';
import Reveal from '../screens/Reveal.jsx';
import Onboarding, { coverCompleteness, stepValid, DebutCover, STRAPLINES } from '../screens/Onboarding.jsx';
import { APPS } from '../phone/apps.jsx';
import App, { Title } from '../App.jsx';
import { saveGame } from '../engine/index.js';

function midCareer() {
  let s = createNewGame({ stageName: 'Mira', city: 'sel', genre: 'kpop', path: 'viral' }, 42);
  for (let w = 0; w < 20; w++) {
    let r = writeSong(s, { title: `Song ${w}`, genre: 'kpop', theme: 'Love', length: 180, cowriter: 'none' });
    s = r.state;
    const id = s.songs[0].id;
    s.player.cash += 5000;
    s = recordSong(s, { songId: id, producerId: 'rising' }).state;
    s = releaseMusic(s, { type: 'single', songIds: [id], rollout: 'standard' }).state;
    s = promoteClip(s, { songId: id }).state;
    s = postChirp(s, { text: 'new music out now' }).state;
    if (w % 5 === 0) s = makeVideo(s, { songId: id, tier: 'phone' }).state;
    s = playGig(s, { venueId: 'bar', cityId: 'sel' }).state;
    s = advanceWeek(s);
  }
  return s;
}

function richState() {
  let s = midCareer();
  s.player.cash += 1e6;
  s = startEra(s, { name: 'Glass Hearts', color: '#F472B6', vibe: 'dreamy' }).state;
  s = goLive(s, { platform: 'treblrtok' }).state;
  s = setArtistPhoto(s, { rivalId: s.rivals[0].id, photo: 'data:image/jpeg;base64,AAAA' }).state;
  s = JSON.parse(JSON.stringify(s));
  contactForRival(s, s.rivals[1].id).thread.push({ from: 'them', text: 'yo', week: s.week, choices: [{ label: 'hey!', fx: { rel: 3 } }], answered: false });
  meetPerson(s, createRng(1), 'a party');
  s.drama = { id: 'd1', rivalId: s.rivals[2].id, text: 'stay humble', week: s.week, status: 'open', likes: 900 };
  s.spotlight = { id: 'sp', week: s.week, rivalId: s.rivals[3].id, text: `${s.rivals[3].name} takes #1`, resolved: null };
  s.awardEvent = { id: 'aw', show: 'Treblr Music Awards', week: s.week, category: 'Breakthrough Artist', winChance: 0.5, nominees: s.rivals.slice(0, 4).map((r) => r.id), winnerName: s.rivals[0].name, status: 'pending' };
  openCrisis(s, 'leak', 'Demos leak', 'oops');
  s.wrapped.push({ year: 1, week: 52, streams: 1000, listeners: 500, fans: 10, bestPeak: 40, topSongs: [{ id: 'x', title: 'Song', streams: 900 }], topCountries: [{ code: 'KR', name: 'South Korea', flag: '🇰🇷', streams: 400 }], type: { name: 'The Workhorse', desc: 'd' }, awards: 0 });
  s.tour = { id: 't', venueId: 'club', perWeek: 2, reserve: 35, startWeek: s.week, cost: 1, gross: 0, fans: 0, sellouts: 0, stops: [{ cityId: 'sel', week: s.week, done: false }, { cityId: 'tyo', week: s.week + 1, done: false }, { cityId: 'lon', week: s.week + 1, done: false }] };
  return s;
}

const states = { fresh: createNewGame({ stageName: 'Neo', city: 'lon', genre: 'indie', path: 'bedroom' }, 1), mid: midCareer(), rich: richState() };

function wrap(state, el) {
  const ctx = { state, act: () => ({ ok: true }), go: () => {}, nav: { tab: 'home' }, nextWeek: () => {}, toast: () => {}, slot: 1, onSwitch: () => {}, onNew: () => {}, onTitle: () => {}, openProfile: () => {}, setState: () => {}, openArtist: () => {}, openOverlay: () => {} };
  return renderToString(<GameCtx.Provider value={ctx}>{el}</GameCtx.Provider>);
}

describe.each(Object.keys(states))('renders (%s save)', (k) => {
  const s = states[k];
  it('main screens', () => {
    for (const el of [<Home />, <Studio />, <Studio initial="record" />, <Studio initial="release" />, <Studio initial="catalog" />, <Phone />, <Charts />, <World />, <Profile onClose={() => {}} />]) {
      expect(wrap(s, el).length).toBeGreaterThan(100);
    }
    if (s.lastReport) expect(wrap(s, <Reveal report={s.lastReport} onClose={() => {}} />)).toContain('TREBLR');
  });
  it('every phone app', () => {
    for (const a of APPS) expect(wrap(s, <Phone initialApp={a.id} />)).toContain(a.name);
  });
  it('world sheets', () => {
    for (const id of ['jobs', 'gigs', 'tours', 'training', 'labels', 'merch', 'brands', 'press', 'radio', 'interview', 'payola']) expect(wrap(s, <World initial={id} />).length).toBeGreaterThan(100);
  });
});

describe('Cover Story onboarding', () => {
  const prompts = ['What do we print on the cover?', 'who were you before the spotlight?', 'datelined?', 'your sound?', 'Pick your origin story.', 'Cover shoot.'];
  it('renders each editor prompt with the live cover and no step wizard chrome', () => {
    prompts.forEach((p, i) => {
      const html = renderToString(<Onboarding onDone={() => {}} onCancel={() => {}} initialStep={i} />);
      expect(html).toContain(p.replace("'", '&#x27;'));
      expect(html).toContain('TREBLR');
      expect(html).toContain('DEBUT ISSUE');
      expect(html).toContain('cover complete');
      expect(html).not.toMatch(/STEP \d/i);
    });
    expect(renderToString(<Onboarding onDone={() => {}} onCancel={() => {}} initialStep={5} />)).toContain('Send to print');
  });
  it('live cover reflects every choice', () => {
    const f = { firstName: 'Ji-woo', lastName: 'Park', stageName: 'NOVA', city: 'sel', age: 23, genre: 'kpop', subgenres: ['Ballad'], path: 'bedroom', photo: null };
    const html = renderToString(<DebutCover f={f} />);
    expect(html).toContain('NOVA');
    expect(html).toContain('born Ji-woo Park, 23');
    expect(html).toContain('Dateline: Seoul');
    expect(html).toContain('K-Pop · Ballad');
    expect(html).toContain(STRAPLINES.bedroom);
    expect(renderToString(<DebutCover f={f} printing />)).toContain('ON SALE');
  });
  it('completeness and validation', () => {
    const blank = { firstName: '', lastName: '', stageName: '', city: '', age: 21, genre: '', subgenres: [], path: '', photo: null };
    expect(coverCompleteness(blank)).toBe(0);
    expect(coverCompleteness({ ...blank, stageName: 'X', firstName: 'A', city: 'lon', genre: 'pop', path: 'viral' }, true)).toBe(100);
    expect(stepValid('stage', blank)).toBe(false);
    expect(stepValid('stage', { ...blank, stageName: 'X' })).toBe(true);
    expect(stepValid('shoot', blank)).toBe(true);
  });
});

it('title screen shows save slots as magazine covers', () => {
  const m = new Map();
  globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  let html = renderToString(<Title onNew={() => {}} onLoad={() => {}} />);
  expect(html.match(/New career/g).length).toBe(3);
  saveGame(states.mid, 1);
  html = renderToString(<Title onNew={() => {}} onLoad={() => {}} />);
  expect(html).toContain('Mira');
  expect(html).toContain(`ISSUE ${states.mid.week}`);
  expect(html).toContain('Continue');
  expect(html.match(/New career/g).length).toBe(2);
  delete globalThis.localStorage;
});

it('mid-career save shows player on charts and in news', () => {
  const s = states.mid;
  expect(s.player.fans).toBeGreaterThan(1000);
  expect(s.news.some((n) => n.aboutPlayer)).toBe(true);
});

it('full app shell renders title screen and a loaded game', () => {
  const m = new Map();
  globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  expect(renderToString(<App />)).toContain('New career');
  saveGame(states.mid, 2);
  const html = renderToString(<App />);
  expect(html).toContain('Next Week');
  expect(html).toContain('Notifications');
  expect(html).toContain('WEEK');
  delete globalThis.localStorage;
});
