// Smoke test: every screen and phone app renders (server-side) for a fresh and a mid-career save.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  createNewGame, advanceWeek, writeSong, recordSong, releaseMusic, promoteClip, postChirp, makeVideo, playGig,
} from '../engine/index.js';
import { GameCtx } from './kit.jsx';
import Home from '../screens/Home.jsx';
import Studio from '../screens/Studio.jsx';
import Phone from '../screens/Phone.jsx';
import Charts from '../screens/Charts.jsx';
import World from '../screens/World.jsx';
import Profile from '../screens/Profile.jsx';
import Reveal from '../screens/Reveal.jsx';
import Onboarding from '../screens/Onboarding.jsx';
import { APPS } from '../phone/apps.jsx';
import App from '../App.jsx';
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

const states = { fresh: createNewGame({ stageName: 'Neo', city: 'lon', genre: 'indie', path: 'bedroom' }, 1), mid: midCareer() };

function wrap(state, el) {
  const ctx = { state, act: () => ({ ok: true }), go: () => {}, nav: { tab: 'home' }, nextWeek: () => {}, toast: () => {}, slot: 1, onSwitch: () => {}, onNew: () => {}, onTitle: () => {}, openProfile: () => {}, setState: () => {} };
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
    for (const id of ['jobs', 'gigs', 'tours', 'labels', 'merch', 'brands', 'press', 'radio', 'interview', 'payola']) expect(wrap(s, <World initial={id} />).length).toBeGreaterThan(100);
  });
});

it('onboarding renders', () => {
  expect(renderToString(<Onboarding onDone={() => {}} onCancel={() => {}} />)).toContain('stepping up to the mic');
});

it('mid-career save shows player on charts and in news', () => {
  const s = states.mid;
  expect(s.player.fans).toBeGreaterThan(1000);
  expect(s.news.some((n) => n.aboutPlayer)).toBe(true);
});

it('full app shell renders title screen and a loaded game', () => {
  const m = new Map();
  globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  expect(renderToString(<App />)).toContain('TREBLR');
  saveGame(states.mid, 2);
  const html = renderToString(<App />);
  expect(html).toContain('Next Week');
  expect(html).toContain('WEEK');
  delete globalThis.localStorage;
});
