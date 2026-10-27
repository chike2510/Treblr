import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceWeek, saveGame, loadGame, listSaves, lastSlot, rest, unreadCount, formatWeekDate, fmtMoney, unreadNotifs, eraOf,
} from './engine/index.js';
import { GameCtx, Icon, AREA, facePhoto, CountUp, DEFAULT_FACE } from './ui/kit.jsx';
import Onboarding, { GENRE_COLORWAYS } from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Studio from './screens/Studio.jsx';
import Phone from './screens/Phone.jsx';
import Charts from './screens/Charts.jsx';
import World from './screens/World.jsx';
import Profile from './screens/Profile.jsx';
import Reveal from './screens/Reveal.jsx';
import ArtistSheet from './ui/ArtistSheet.jsx';
import { AwardShow, CrisisSheet, WrappedCard, NotificationsPanel, AwardSubmissions } from './screens/Overlays.jsx';
import { InstallButton, UpdateToast } from './pwa.jsx';
import { StoreScreen } from './phone/extra.jsx';
import { Sheet } from './ui/kit.jsx';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'studio', label: 'Studio', icon: 'mic' },
  { id: 'phone', label: 'Phone', icon: 'phone' },
  { id: 'charts', label: 'Charts', icon: 'chart' },
  { id: 'world', label: 'World', icon: 'globe' },
];

export default function App() {
  const [slot, setSlot] = useState(() => lastSlot() || 1);
  const [state, setState] = useState(() => {
    const s = lastSlot();
    return s ? loadGame(s) : null;
  });
  const [mode, setMode] = useState(() => (state ? 'game' : 'title'));

  useEffect(() => {
    if (state && mode === 'game') saveGame(state, slot);
  }, [state, slot, mode]);

  const startNew = (s) => { setSlot(s); setMode('onboarding'); };
  const loadSlot = (s) => {
    const g = loadGame(s);
    if (g) { setSlot(s); setState(g); setMode('game'); }
  };

  if (mode === 'title') return <div className="app"><Title onNew={startNew} onLoad={loadSlot} /><UpdateToast /></div>;
  if (mode === 'onboarding') {
    return (
      <div className="app">
        <Onboarding onCancel={() => setMode(state ? 'game' : 'title')} onDone={(g) => { setState(g); saveGame(g, slot); setMode('game'); }} />
      </div>
    );
  }
  return <Game state={state} setState={setState} slot={slot} onSwitch={(s) => { if (!loadGame(s)) startNew(s); else loadSlot(s); }} onNew={startNew} onTitle={() => setMode('title')} />;
}

export function Title({ onNew, onLoad }) {
  const saves = listSaves();
  const [store, setStore] = useState(false);
  return (
    <div className="ts">
      <div className="ts-glow" aria-hidden="true" />
      <div className="ts-brand">
        <h1 className="ts-word" aria-label="Treblr">{'TREBLR'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * 0.12}s` }}>{c}</span>)}</h1>
        <div className="ts-eq" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ animationDelay: `${((i * 37) % 11) * -0.11}s`, animationDuration: `${0.9 + ((i * 13) % 7) * 0.12}s` }} />)}</div>
        <p className="ts-tag">A global music career, one issue a week. Write, release, chart in twelve countries and tour the world.</p>
        <div className="ts-actions"><InstallButton className="btn sm primary" /><button className="btn sm" onClick={() => setStore(true)}><Icon name="gift" size={16} />Store · soon</button></div>
      </div>
      <div className="ts-rack">
        <div className="ts-rack-head"><span>On the rack</span><span>{`${saves.filter((s) => !s.empty).length}/3 careers`}</span></div>
        <div className="ts-covers">
          {saves.map((s) => (s.empty ? (
            <button key={s.slot} className="ts-cover blank" onClick={() => onNew(s.slot)} aria-label={`Start a new career in slot ${s.slot}`}>
              <span className="ts-plus"><Icon name="plus" size={26} /></span>
              <span className="ts-new">New career</span>
            </button>
          ) : (
            <button key={s.slot} className="ts-cover" onClick={() => onLoad(s.slot)} aria-label={`Continue ${s.stageName}, issue ${s.week}`} style={{ '--ca': (GENRE_COLORWAYS[s.genre] || [])[0] || '#C6FF3D' }}>
              <img src={s.photo || DEFAULT_FACE} alt="" />
              <span className="ts-cover-shade" />
              <span className="ts-cover-mast">TREBLR</span>
              <span className="ts-cover-issue">{`ISSUE ${s.week}`}</span>
              <span className="ts-cover-name">{s.stageName}</span>
              <span className="ts-continue">Continue <Icon name="chev" size={12} stroke={2.6} /></span>
            </button>
          )))}
        </div>
      </div>
      <Sheet open={store} onClose={() => setStore(false)} title="Store" sub="Placeholder — nothing is for sale yet."><StoreScreen /></Sheet>
    </div>
  );
}

function Game({ state, setState, slot, onSwitch, onNew, onTitle }) {
  const [nav, setNav] = useState({ tab: 'home', n: 0 });
  const [toast, setToast] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [profile, setProfile] = useState(false);
  const [artist, setArtist] = useState(null);
  const [overlay, setOverlay] = useState(null); // 'awards' | 'crisis' | 'notifs' | { wrapped: year }
  const scrollRef = useRef(null);
  const timer = useRef(null);

  const showToast = useCallback((msg, ok = true) => {
    if (!msg) return;
    clearTimeout(timer.current);
    setToast({ msg, ok, k: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const latest = useRef(state);
  latest.current = state;
  const act = useCallback((fn, payload, { silent = false } = {}) => {
    const res = fn(latest.current, payload);
    latest.current = res.state;
    setState(res.state);
    if (!silent || !res.ok) showToast(res.msg, res.ok);
    return res;
  }, [setState, showToast]);

  const nextWeek = useCallback(() => {
    const n = advanceWeek(latest.current);
    latest.current = n;
    setState(n);
    setReveal(true);
  }, [setState]);

  const go = useCallback((to) => {
    if (!to) return;
    if (to.action === 'rest') { act(rest); return; }
    if (to.action === 'next') { nextWeek(); return; }
    if (to.awards) { setOverlay('awards'); return; }
    if (to.submissions) { setOverlay('submissions'); return; }
    if (to.crisis) { setOverlay('crisis'); return; }
    if (to.wrapped) { setOverlay({ wrapped: to.wrapped }); return; }
    if (to.artist) { setArtist(to.artist); return; }
    setNav((n) => ({ tab: to.tab || n.tab, section: to.section, app: to.app, contact: to.contact, rival: to.rival, view: to.view, n: n.n + 1 }));
    scrollRef.current?.scrollTo({ top: 0 });
  }, [act, nextWeek]);

  const ctx = useMemo(() => ({ state, act, go, nav, nextWeek, toast: showToast, slot, onSwitch, onNew, onTitle, openProfile: () => setProfile(true), setState, openArtist: setArtist, openOverlay: setOverlay }), [state, act, go, nav, nextWeek, showToast, slot, onSwitch, onNew, onTitle, setState]);
  const p = state.player;
  const unread = unreadCount(state);
  const notifs = unreadNotifs(state);
  const era = eraOf(state);
  const accent = nav.tab === 'home' && era ? era.color : AREA[nav.tab];

  return (
    <GameCtx.Provider value={ctx}>
      <div className="app" style={{ '--accent': accent, '--era': era?.color || '#C6FF3D' }}>
        <header className="topbar">
          <button onClick={() => setProfile(true)} aria-label="Profile"><img className="avatar" src={facePhoto(p)} alt="" /></button>
          <div className="wk">
            <b>WEEK {state.week}</b>
            <span>{formatWeekDate(state.week, { month: 'short', day: 'numeric' })}</span>
          </div>
          <button className="stat-chip bell" title="Notifications" aria-label={`Notifications${notifs ? `, ${notifs} unread` : ''}`} onClick={() => setOverlay('notifs')}><Icon name="bell" size={15} />{notifs > 0 && <i className="badge">{notifs > 9 ? '9+' : notifs}</i>}</button>
          <span className="stat-chip" title={`Energy (cap ${p.maxEnergy}${p.burnout ? `, burnout ${p.burnout}` : ''})`}><Icon name="bolt" size={14} color={p.burnout >= 40 ? '#FFB020' : '#C6FF3D'} fill={p.burnout >= 40 ? '#FFB020' : '#C6FF3D'} stroke={0} />{p.energy}</span>
          <span className="stat-chip" title="Cash" style={{ color: p.cash < 0 ? 'var(--red)' : 'var(--green)' }}><CountUp value={p.cash} format={(v) => fmtMoney(v)} /></span>
          <button className="next-btn" onClick={nextWeek} aria-label="Next Week">Next<span className="nw"> Week</span> <Icon name="chev" size={16} stroke={2.6} /></button>
        </header>

        <main className="scroll" ref={scrollRef}>
          {nav.tab === 'home' && <Home key={`h${nav.n}`} />}
          {nav.tab === 'studio' && <Studio key={`s${nav.n}`} initial={nav.section} rival={nav.rival} />}
          {nav.tab === 'phone' && <Phone key={`p${nav.n}`} initialApp={nav.app} contact={nav.contact} view={nav.view} />}
          {nav.tab === 'charts' && <Charts key={`c${nav.n}`} />}
          {nav.tab === 'world' && <World key={`w${nav.n}`} initial={nav.section} />}
        </main>

        <nav className="bottomnav">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${nav.tab === t.id ? 'on' : ''}`} style={{ '--tc': AREA[t.id] }} onClick={() => go({ tab: t.id })} aria-label={t.label}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
              {t.id === 'phone' && unread > 0 && <i className="badge">{unread > 9 ? '9+' : unread}</i>}
            </button>
          ))}
        </nav>

        {toast && <div key={toast.k} className={`toast ${toast.ok ? 'ok' : 'err'}`}><Icon name={toast.ok ? 'check' : 'close'} size={18} color={toast.ok ? '#C6FF3D' : '#FF4D5E'} />{toast.msg}</div>}
        {profile && <Profile onClose={() => setProfile(false)} />}
        {reveal && state.lastReport && <Reveal report={state.lastReport} onClose={() => setReveal(false)} />}
        {artist && <ArtistSheet rivalId={artist} onClose={() => setArtist(null)} />}
        {overlay === 'notifs' && <NotificationsPanel onClose={() => setOverlay(null)} />}
        {overlay === 'awards' && state.awardEvent && <AwardShow onClose={() => setOverlay(null)} />}
        {overlay === 'submissions' && state.awardSubmission && <AwardSubmissions onClose={() => setOverlay(null)} />}
        <UpdateToast />
        {overlay === 'crisis' && state.crisis && <CrisisSheet onClose={() => setOverlay(null)} />}
        {overlay?.wrapped && <WrappedCard wrapped={state.wrapped.find((w) => w.year === overlay.wrapped)} onClose={() => setOverlay(null)} />}
      </div>
    </GameCtx.Provider>
  );
}
