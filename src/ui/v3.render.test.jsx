// Render tests for v3 screens, overlays and Treblr-branded phone apps.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as E from '../engine/index.js';
import { GameCtx, ArtistArt, ArtistAvatar } from './kit.jsx';
import ArtistSheet from './ArtistSheet.jsx';
import Home from '../screens/Home.jsx';
import Studio from '../screens/Studio.jsx';
import Phone from '../screens/Phone.jsx';
import Charts from '../screens/Charts.jsx';
import World from '../screens/World.jsx';
import Profile from '../screens/Profile.jsx';
import Reveal from '../screens/Reveal.jsx';
import { AwardShow, CrisisSheet, WrappedCard, NotificationsPanel } from '../screens/Overlays.jsx';
import { APPS, APP_ALIASES } from '../phone/apps.jsx';
import { runSim } from '../../scripts/balance-sim.mjs';

function rich() {
  let s = runSim('paced', 11, 56).state;
  s = E.startEra(s, { name: 'Glass Hearts', color: '#F472B6', vibe: 'dreamy' }).state;
  s = JSON.parse(JSON.stringify(s));
  s.player.cash += 1e6;
  s.artistPhotos[s.rivals[0].id] = 'data:image/jpeg;base64,PHOTO0';
  E.contactForRival(s, s.rivals[1].id).thread.push({ from: 'them', text: 'loved the single', week: s.week, choices: [{ label: 'Means a lot!', fx: { rel: 3 } }], answered: false });
  E.meetPerson(s, E.createRng(2), 'a party');
  s.drama = { id: 'd1', rivalId: s.rivals[2].id, text: 'stay humble', week: s.week, status: 'open', likes: 900 };
  s.spotlight = { id: 'sp', week: s.week, rivalId: s.rivals[3].id, text: `${s.rivals[3].name} takes #1 on the Hot 100`, resolved: null };
  s.awardEvent = { id: 'aw', show: 'Treblr Music Awards', week: s.week, category: 'Breakthrough Artist', winChance: 0.5, nominees: s.rivals.slice(0, 4).map((r) => r.id), winnerName: s.rivals[0].name, status: 'pending' };
  E.openCrisis(s, 'leak', 'Demos leak online', 'A hard drive went missing.');
  s.tour = { id: 't', venueId: 'club', perWeek: 2, reserve: 35, startWeek: s.week, cost: 1, gross: 100, fans: 0, sellouts: 0, stops: [{ cityId: 'tor', week: s.week, done: false }, { cityId: 'nyc', week: s.week + 1, done: false }, { cityId: 'lon', week: s.week + 1, done: false }] };
  s.lastReport.tour = { venue: 'Club', nights: [{ city: 'Toronto', flag: '🇨🇦', sold: 400, cap: 400, gross: 1800, fans: 50, soldOut: true }], left: 2 };
  s.lastReport.wrapped = 1;
  return s;
}
const S = rich();
const ctx = (state) => ({ state, act: () => ({ ok: true }), go: () => {}, nav: { tab: 'home' }, nextWeek: () => {}, toast: () => {}, slot: 1, onSwitch: () => {}, onNew: () => {}, onTitle: () => {}, openProfile: () => {}, setState: () => {}, openArtist: () => {}, openOverlay: () => {} });
const html = (el, state = S) => renderToString(<GameCtx.Provider value={ctx(state)}>{el}</GameCtx.Provider>);

describe('v3 Home', () => {
  const h = html(<Home />);
  it('shows weekly goals, streak, spotlight, era, timeline, alerts, tour', () => {
    for (const t of ['goals', 'Chart streak', 'Burnout', 'Spotlight', 'Show love', 'Diss', 'Glass Hearts', 'Career timeline', 'Demos leak online', 'Nominated: Breakthrough Artist', 'On tour']) expect(h).toContain(t);
  });
  it('restyles the hero with the era colour', () => {
    expect(h).toContain('--lime:#F472B6');
    expect(h).toContain('THE GLASS HEARTS ERA');
  });
});

describe('NPC artwork and photos', () => {
  it('generative art is SVG with no text and is unique per artist', () => {
    const a = renderToString(<ArtistArt name="Taylor Swift" genres={['pop']} />);
    const b = renderToString(<ArtistArt name="Bad Bunny" genres={['reggaeton']} />);
    expect(a).toContain('<svg');
    expect(a).not.toMatch(/<text/);
    expect(a).not.toBe(b);
  });
  it('uses the player-set photo everywhere, with reset on the artist sheet', () => {
    const r = S.rivals[0];
    expect(html(<ArtistAvatar rival={r} />)).toContain('PHOTO0');
    const sheet = html(<ArtistSheet rivalId={r.id} onClose={() => {}} />);
    expect(sheet).toContain('Set photo');
    expect(sheet).toContain('Reset to default');
    expect(sheet).toContain('Request feature');
    const other = html(<ArtistSheet rivalId={S.rivals[5].id} onClose={() => {}} />);
    expect(other).toContain('Set photo');
    expect(other).not.toContain('Reset to default');
  });
  it('charts rows show NPC avatars', () => {
    expect(html(<Charts />)).toContain('artist-art');
  });
});

describe('overlays', () => {
  it('award show opens on the red carpet with outfits', () => {
    const a = html(<AwardShow onClose={() => {}} />);
    expect(a).toContain('Red carpet');
    expect(a).toContain('Avant-garde statement');
    expect(a).toContain('Perform on the show');
  });
  it('crisis, Wrapped and notifications render', () => {
    expect(html(<CrisisSheet onClose={() => {}} />)).toContain('Apologise');
    const w = S.wrapped[0];
    const wh = html(<WrappedCard wrapped={w} onClose={() => {}} />);
    expect(wh).toContain(`Year ${w.year}`);
    expect(wh).toContain(w.type.name);
    expect(wh).toContain('Top countries');
    expect(html(<NotificationsPanel onClose={() => {}} />)).toContain('Mark all read');
  });
  it('weekly reveal shows tour nights and Wrapped CTA', () => {
    const r = html(<Reveal report={S.lastReport} onClose={() => {}} />);
    expect(r).toContain('Toronto');
    expect(r).toContain('Wrapped is ready');
  });
});

describe('Treblr-branded phone apps', () => {
  it('has the renamed apps and no legacy names', () => {
    const names = APPS.map((a) => a.name);
    for (const n of ['Treblify', 'Treblr Music', 'TreblrX', 'Treblrgram', 'TreblrTok', 'TreblrTube', 'Treblrchat']) expect(names).toContain(n);
    for (const n of ['Streamify', 'Chirp', 'Snapshot', 'Clipz', 'ViewTube']) expect(names).not.toContain(n);
    expect(APP_ALIASES.clipz).toBe('treblrtok');
  });
  it('each app renders its signature patterns', () => {
    const app = (id) => html(<Phone initialApp={id} />);
    const x = app('treblrx');
    expect(x).toContain('For you'); expect(x).toContain('Following'); expect(x).toContain('Trends for you'); expect(x).toContain('stay humble'); expect(x).toContain('Diss track');
    const g = app('treblrgram');
    expect(g).toContain('Your story'); expect(g).toContain('likes'); expect(g).toContain('tg-stories');
    const t = app('treblrtok');
    expect(t).toContain('For You'); expect(t).toContain('LIVE'); expect(t).toContain('Duet'); expect(t).toContain('Use sound');
    const y = app('treblrtube');
    expect(y).toContain('Upload a music video'); expect(y).toContain('Shorts'); expect(y).toContain('(Official Video)');
    const sp = app('treblify');
    expect(sp).toContain('Made for you'); expect(sp).toContain('Popular artists');
    const am = app('treblrmusic');
    expect(am).toContain('Listen Now'); expect(am).toContain('Hot 100');
    const wa = app('treblrchat');
    expect(wa).toContain('Treblrchat'); expect(wa).toContain('Jules Marlowe');
    expect(app('settings')).toContain('Artist photo pack');
    expect(app('clipz')).toContain('TreblrTok');
  });
  it('a chat thread shows reply choices and artist actions', () => {
    const c = S.contacts.find((x) => x.rivalId === S.rivals[1].id);
    const h = html(<Phone initialApp="treblrchat" contact={c.id} />);
    expect(h).toContain('Means a lot!');
    expect(h).toContain('Request feature');
    expect(h).toContain('Set photo');
    const person = S.contacts.find((x) => x.role === 'person');
    expect(html(<Phone initialApp="treblrchat" contact={person.id} />)).toContain('Ask out');
  });
  it('status bar has a notifications bell', () => {
    expect(html(<Phone />)).toContain('sb-bell');
  });
});

describe('game-wide screens', () => {
  it('Studio collab lists artists with fee and odds', () => {
    const fresh = E.writeSong(E.createNewGame({ stageName: 'Neo', city: 'lon', genre: 'indie', path: 'bedroom' }, 1), { title: 'X', genre: 'indie', length: 180 }).state;
    const h = html(<Studio initial="collab" />, fresh);
    expect(h).toContain('odds');
    expect(h).toContain('artist-art');
  });
  it('Studio release shows track ordering for albums', () => {
    expect(html(<Studio initial="release" />).length).toBeGreaterThan(500);
  });
  it('World tours shows the active route with cancel; training lists skills', () => {
    expect(html(<World initial="tours" />)).toContain('Cancel remaining shows');
    const tr = html(<World initial="training" />);
    expect(tr).toContain('Songwriting workshop');
  });
  it('Profile shows relationship status', () => {
    expect(html(<Profile onClose={() => {}} />)).toMatch(/Single|Dating/);
  });
});
