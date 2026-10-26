import { useRef, useState } from 'react';
import { unreadCount, calendarEvents, fmtNum, formatWeekDate } from '../engine/index.js';
import { useGame, Icon, Mono, CountUp } from '../ui/kit.jsx';
import { APPS } from '../phone/apps.jsx';

export default function Phone({ initialApp }) {
  const { state } = useGame();
  const [app, setApp] = useState(initialApp || null);
  const [q, setQ] = useState('');
  const touch = useRef(null);
  const p = state.player;
  const unread = unreadCount(state);
  const nextEv = calendarEvents(state, state.week, state.week + 12)[0];
  const badges = {
    inbox: unread,
    streamify: state.songs.some((s) => s.status === 'released' && s.pitchedWeek !== state.week && state.week - s.releasedWeek < 8) ? 1 : 0,
    news: state.news.filter((n) => n.week === state.week - 1 && n.aboutPlayer).length,
  };
  const list = APPS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const Current = app && APPS.find((a) => a.id === app);

  return (
    <>
      <div className="phone-home" style={{ '--accent': '#6C7BFF' }}>
        <div className="row between">
          <Mono style={{ color: '#fff' }}>{formatWeekDate(state.week, { weekday: 'long', month: 'long', day: 'numeric' })}</Mono>
        </div>
        <div className="grid2 mt12">
          <button className="widget press" style={{ textAlign: 'left', background: 'linear-gradient(160deg, rgba(61,220,132,.35), rgba(255,255,255,.05))' }} onClick={() => setApp('streamify')}>
            <div className="row gap6"><Icon name="play" size={14} fill="#3DDC84" color="#3DDC84" /><Mono className="sm" style={{ color: '#fff' }}>Streamify</Mono></div>
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
                <Icon name={a.icon} size={28} color={a.fg || '#fff'} />
                {badges[a.id] > 0 && <i className="badge">{badges[a.id] > 9 ? '9+' : badges[a.id]}</i>}
              </div>
              {a.name}
            </button>
          ))}
        </div>
        <div className="card tight mt24" style={{ background: 'rgba(255,255,255,.05)' }}>
          <div className="row between"><Mono className="sm">Social energy</Mono><span className="num small">{p.socialEnergy}/{p.maxSocial}</span></div>
          <div className="tiny muted mt8">Posting, pitching and promoting use social energy — separate from studio energy. Refills weekly.</div>
          <div className="row gap16 mt12 tiny">
            <span>Chirp <b>{fmtNum(p.followers.chirp)}</b></span><span>Snapshot <b>{fmtNum(p.followers.snapshot)}</b></span><span>Clipz <b>{fmtNum(p.followers.clipz)}</b></span>
          </div>
        </div>
      </div>
      {Current && (
        <div
          className="app-screen"
          style={{ background: Current.screenBg || 'var(--bg)', '--accent': Current.accent || '#6C7BFF' }}
          onTouchStart={(e) => { const x = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left; touch.current = x < 32 ? e.touches[0].clientX : null; }}
          onTouchEnd={(e) => { if (touch.current != null && e.changedTouches[0].clientX - touch.current > 80) setApp(null); touch.current = null; }}
        >
          <div className="app-head">
            <button className="icon-btn" onClick={() => setApp(null)} aria-label="Back" style={{ background: 'transparent', border: 0 }}><Icon name="back" /></button>
            <div className="ic" style={{ width: 28, height: 28, borderRadius: 8, background: Current.bg, display: 'grid', placeItems: 'center' }}><Icon name={Current.icon} size={16} color={Current.fg || '#fff'} /></div>
            <h2 style={{ fontFamily: Current.font }}>{Current.name}</h2>
          </div>
          <div className="app-body"><Current.Component /></div>
        </div>
      )}
    </>
  );
}
