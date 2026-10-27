import { useRef, useState } from 'react';
import { unreadCount, calendarEvents, fmtNum, formatWeekDate, unreadNotifs } from '../engine/index.js';
import { useGame, Icon, Mono, CountUp } from '../ui/kit.jsx';
import { APPS, APP_ALIASES } from '../phone/apps.jsx';

// Distinct, Treblr-branded app glyphs (no real logos).
function Glyph({ a }) {
  const w = '#fff';
  switch (a.glyph) {
    case 'wave': return <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 11c6-2 12-2 18 1M7 16c5-1.5 10-1.5 15 1M8 21c4-1 8-1 12 1" stroke="#000" strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>;
    case 'note': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M11 20V7l11-2v13" stroke={w} strokeWidth="2.6" fill="none" strokeLinejoin="round" /><circle cx="8.5" cy="20.5" r="3" fill={w} /><circle cx="19.5" cy="18" r="3" fill={w} /></svg>;
    case 'x': return <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 5l16 16M21 5 5 21" stroke={w} strokeWidth="3" strokeLinecap="round" /><circle cx="13" cy="13" r="3" fill="#1d9bf0" /></svg>;
    case 'cam': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="4" width="20" height="20" rx="6" stroke={w} strokeWidth="2.4" fill="none" /><circle cx="14" cy="14" r="4.5" stroke={w} strokeWidth="2.4" fill="none" /><circle cx="19.5" cy="8.5" r="1.4" fill={w} /></svg>;
    case 'tok': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M15 5v13a4 4 0 1 1-4-4" stroke="#25F4EE" strokeWidth="2.6" fill="none" transform="translate(-1 -1)" /><path d="M15 5v13a4 4 0 1 1-4-4" stroke="#FE2C55" strokeWidth="2.6" fill="none" transform="translate(1 1)" /><path d="M15 5v13a4 4 0 1 1-4-4M15 5c1 3 3 4.5 6 5" stroke={w} strokeWidth="2.6" fill="none" /></svg>;
    case 'tube': return <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="3" y="7" width="24" height="16" rx="5" fill={w} /><path d="M13 11v8l6.5-4z" fill="#FF0033" /></svg>;
    case 'wiki': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="10" stroke="#202122" strokeWidth="2" fill="none" /><path d="M8 10l3 9 3-7 3 7 3-9" stroke="#202122" strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>;
    case 'fortune': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><text x="14" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="17" fill="#e8c766">F</text><path d="M6 23h16" stroke="#e8c766" strokeWidth="1.6" /></svg>;
    case 'fork': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 5v8a5 5 0 0 0 10 0V5M14 5v8M14 18v6" stroke="#ef4135" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>;
    case 'cloud': return <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M9 21h13a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0 0 8z" fill={w} />{[4, 6, 8].map((x) => <rect key={x} x={x - 3} y={14} width="1.4" height="7" fill={w} />)}</svg>;
    case 'hifi': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M8 9l3 3-3 3-3-3zM14 9l3 3-3 3-3-3zM20 9l3 3-3 3-3-3zM14 15l3 3-3 3-3-3z" fill={w} /></svg>;
    case 'tunes': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M17 6v11a3 3 0 1 1-2-2.8V8l-6 1.5V19a3 3 0 1 1-2-2.8V8z" fill={w} /><path d="M20 6l2 2 3-4" stroke={w} strokeWidth="1.8" fill="none" /></svg>;
    case 'bubble': return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M14 4a10 10 0 0 0-8.7 15L4 24l5.2-1.3A10 10 0 1 0 14 4z" stroke={w} strokeWidth="2.4" fill="none" strokeLinejoin="round" /><path d="M10 12.5c.5 2.5 2.5 4.5 5 5" stroke={w} strokeWidth="2.2" strokeLinecap="round" fill="none" /></svg>;
    default: return <Icon name={a.icon} size={28} color={a.fg || '#fff'} />;
  }
}

export default function Phone({ initialApp, contact, view }) {
  const { state, openOverlay } = useGame();
  const [app, setApp] = useState(APP_ALIASES[initialApp] || initialApp || null);
  const [q, setQ] = useState('');
  const touch = useRef(null);
  const p = state.player;
  const unread = unreadCount(state);
  const notifs = unreadNotifs(state);
  const nextEv = calendarEvents(state, state.week, state.week + 12)[0];
  const chats = (state.contacts || []).reduce((a, c) => a + (c.unread || 0), 0);
  const badges = {
    inbox: unread,
    treblify: state.songs.some((s) => s.status === 'released' && s.pitchedWeek !== state.week && state.week - s.releasedWeek < 8) ? 1 : 0,
    news: state.news.filter((n) => n.week === state.week - 1 && n.aboutPlayer).length,
    treblrchat: chats,
    treblrx: state.drama?.status === 'open' ? 1 : 0,
  };
  const list = APPS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const Current = app && APPS.find((a) => a.id === app);

  return (
    <>
      <div className="phone-home" style={{ '--accent': '#6C7BFF' }}>
        <div className="statusbar">
          <span className="num">{String(9 + (state.week % 12)).padStart(2, '0')}:{String((state.week * 17) % 60).padStart(2, '0')}</span>
          <span className="grow" />
          <button className="sb-bell" onClick={() => openOverlay?.('notifs')} aria-label={`Notifications${notifs ? `, ${notifs} unread` : ''}`}><Icon name="bell" size={15} />{notifs > 0 && <b>{notifs > 99 ? '99+' : notifs}</b>}</button>
          <span className="sb-sig" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="sb-bat" aria-hidden="true"><i style={{ width: `${Math.max(10, (p.socialEnergy / p.maxSocial) * 100)}%` }} /></span>
        </div>
        <Mono style={{ color: '#fff' }} className="mt8">{formatWeekDate(state.week, { weekday: 'long', month: 'long', day: 'numeric' })}</Mono>
        <div className="grid2 mt12">
          <button className="widget press" style={{ textAlign: 'left', background: 'linear-gradient(160deg, rgba(30,215,96,.35), rgba(255,255,255,.05))' }} onClick={() => setApp('treblify')}>
            <div className="row gap6"><Icon name="play" size={14} fill="#1ED760" color="#1ED760" /><Mono className="sm" style={{ color: '#fff' }}>Treblify</Mono></div>
            <div>
              <div className="num" style={{ fontSize: 28 }}><CountUp value={p.monthlyListeners} /></div>
              <div className="tiny" style={{ color: 'rgba(255,255,255,.75)' }}>monthly listeners</div>
            </div>
          </button>
          <button className="widget press" style={{ textAlign: 'left' }} onClick={() => setApp('calendar')}>
            <div className="row gap6"><Icon name="cal" size={14} color="#FF6B4A" /><Mono className="sm" style={{ color: '#fff' }}>Up next</Mono></div>
            {nextEv ? (
              <div><div className="head" style={{ fontSize: 15, lineHeight: 1.15 }}>{nextEv.title}</div><div className="tiny" style={{ color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{nextEv.week === state.week ? 'This week' : `Week ${nextEv.week} · ${formatWeekDate(nextEv.week, { month: 'short', day: 'numeric' })}`}</div></div>
            ) : <div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>Nothing scheduled</div>}
          </button>
        </div>
        <div className="phone-search mt16"><Icon name="search" size={18} color="#bbb" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps" aria-label="Search apps" /></div>
        <div className="apps">
          {list.map((a) => (
            <button key={a.id} className="app-icon" onClick={() => setApp(a.id)}>
              <div className="ic" style={{ background: a.bg }}>
                <Glyph a={a} />
                {badges[a.id] > 0 && <i className="badge">{badges[a.id] > 9 ? '9+' : badges[a.id]}</i>}
              </div>
              {a.name}
            </button>
          ))}
        </div>
        <div className="card tight mt24" style={{ background: 'rgba(255,255,255,.05)' }}>
          <div className="row between"><Mono className="sm">Social energy</Mono><span className="num small">{p.socialEnergy}/{p.maxSocial}</span></div>
          <div className="tiny muted mt8">Posting, pitching, going LIVE and dates use social energy, separate from studio energy. Refills weekly.</div>
          <div className="row gap16 mt12 tiny wrap">
            <span>TreblrX <b>{fmtNum(p.followers.chirp)}</b></span><span>Treblrgram <b>{fmtNum(p.followers.snapshot)}</b></span><span>TreblrTok <b>{fmtNum(p.followers.clipz)}</b></span><span>TreblrTube <b>{fmtNum(p.followers.viewtube)}</b></span>
          </div>
        </div>
      </div>
      {Current && (
        <div
          className={`app-screen app-${Current.id}`}
          style={{ background: Current.screenBg || 'var(--bg)', '--accent': Current.accent || '#6C7BFF' }}
          onTouchStart={(e) => { const x = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left; touch.current = x < 32 ? e.touches[0].clientX : null; }}
          onTouchEnd={(e) => { if (touch.current != null && e.changedTouches[0].clientX - touch.current > 80) setApp(null); touch.current = null; }}
        >
          <div className={`app-head ${Current.light ? 'light' : ''}`}>
            <button className="icon-btn" onClick={() => setApp(null)} aria-label="Back" style={{ background: 'transparent', border: 0 }}><Icon name="back" /></button>
            <div className="ic" style={{ width: 28, height: 28, borderRadius: 8, background: Current.bg, display: 'grid', placeItems: 'center', overflow: 'hidden' }}><span style={{ transform: 'scale(.6)', display: 'grid' }}><Glyph a={Current} /></span></div>
            <h2 style={{ fontFamily: Current.font }}>{Current.name}</h2>
          </div>
          <div className={`app-body ${Current.full ? 'full' : ''} ${Current.nav ? 'has-nav' : ''}`}><Current.Component contact={contact} view={view} /></div>
        </div>
      )}
    </>
  );
}
