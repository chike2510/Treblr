import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceWeek, saveGame, loadGame, listSaves, lastSlot, rest, unreadCount, formatWeekDate, fmtMoney,
} from './engine/index.js';
import { GameCtx, Icon, AREA, facePhoto, CountUp } from './ui/kit.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Studio from './screens/Studio.jsx';
import Phone from './screens/Phone.jsx';
import Charts from './screens/Charts.jsx';
import World from './screens/World.jsx';
import Profile from './screens/Profile.jsx';
import Reveal from './screens/Reveal.jsx';

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

  if (mode === 'title') return <div className="app"><Title onNew={startNew} onLoad={loadSlot} /></div>;
  if (mode === 'onboarding') {
    return (
      <div className="app">
        <Onboarding onCancel={() => setMode(state ? 'game' : 'title')} onDone={(g) => { setState(g); saveGame(g, slot); setMode('game'); }} />
      </div>
    );
  }
  return <Game state={state} setState={setState} slot={slot} onSwitch={(s) => { if (!loadGame(s)) startNew(s); else loadSlot(s); }} onNew={startNew} onTitle={() => setMode('title')} />;
}

function Title({ onNew, onLoad }) {
  const saves = listSaves();
  const any = saves.some((s) => !s.empty);
  const firstEmpty = saves.find((s) => s.empty)?.slot || 1;
  return (
    <div className="title-screen">
      <div className="mono" style={{ color: 'var(--lime)' }}>The world is listening</div>
      <h1 style={{ fontSize: 64, lineHeight: 0.9, letterSpacing: '-0.05em', marginTop: 8 }}>TREBLR</h1>
      <p className="muted" style={{ marginTop: 10, maxWidth: 320 }}>Write songs, chase charts in twelve countries, tour the world and build a legacy — one week at a time.</p>
      <button className="btn primary block mt16" onClick={() => onNew(firstEmpty)}>Start a new career</button>
      {any && (
        <div className="col mt16 gap6">
          <div className="mono">Continue</div>
          {saves.filter((s) => !s.empty).map((s) => (
            <button key={s.slot} className="card tight press row" style={{ textAlign: 'left' }} onClick={() => onLoad(s.slot)}>
              <div className="grow">
                <div className="head">{s.stageName}</div>
                <div className="muted tiny">Slot {s.slot} · Week {s.week}</div>
              </div>
              <Icon name="chev" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Game({ state, setState, slot, onSwitch, onNew, onTitle }) {
  const [nav, setNav] = useState({ tab: 'home', n: 0 });
  const [toast, setToast] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [profile, setProfile] = useState(false);
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
    setNav((n) => ({ tab: to.tab || n.tab, section: to.section, app: to.app, n: n.n + 1 }));
    scrollRef.current?.scrollTo({ top: 0 });
  }, [act, nextWeek]);

  const ctx = useMemo(() => ({ state, act, go, nav, nextWeek, toast: showToast, slot, onSwitch, onNew, onTitle, openProfile: () => setProfile(true), setState }), [state, act, go, nav, nextWeek, showToast, slot, onSwitch, onNew, onTitle, setState]);
  const p = state.player;
  const unread = unreadCount(state);
  const accent = AREA[nav.tab];

  return (
    <GameCtx.Provider value={ctx}>
      <div className="app" style={{ '--accent': accent }}>
        <header className="topbar">
          <button onClick={() => setProfile(true)} aria-label="Profile"><img className="avatar" src={facePhoto(p)} alt="" /></button>
          <div className="wk">
            <b>WEEK {state.week}</b>
            <span>{formatWeekDate(state.week, { month: 'short', day: 'numeric' })}</span>
          </div>
          <span className="stat-chip" title="Energy"><Icon name="bolt" size={14} color="#C6FF3D" fill="#C6FF3D" stroke={0} />{p.energy}</span>
          <span className="stat-chip" title="Cash" style={{ color: p.cash < 0 ? 'var(--red)' : 'var(--green)' }}><CountUp value={p.cash} format={(v) => fmtMoney(v)} /></span>
          <button className="next-btn" onClick={nextWeek}>Next Week <Icon name="chev" size={16} stroke={2.6} /></button>
        </header>

        <main className="scroll" ref={scrollRef}>
          {nav.tab === 'home' && <Home key={`h${nav.n}`} />}
          {nav.tab === 'studio' && <Studio key={`s${nav.n}`} initial={nav.section} />}
          {nav.tab === 'phone' && <Phone key={`p${nav.n}`} initialApp={nav.app} />}
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
      </div>
    </GameCtx.Provider>
  );
}
