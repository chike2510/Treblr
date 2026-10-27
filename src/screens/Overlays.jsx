import { useState } from 'react';
import {
  OUTFITS, SPEECHES, attendAwardShow, giveSpeech, skipAwardShow, handleCrisis, markNotif, markAllNotifs, fmtNum, unreadNotifs, confirmAwardEntries,
} from '../engine/index.js';
import { useGame, Icon, Mono, ArtistAvatar, facePhoto, Sheet } from '../ui/kit.jsx';

/* ---------- Award show: red carpet → performance → winner reveal → speech ---------- */
export function AwardShow({ onClose }) {
  const { state, act } = useGame();
  const a = state.awardEvent;
  const [step, setStep] = useState(a?.status === 'pending' ? 'carpet' : a?.status === 'won' ? 'speech' : 'done');
  const [outfit, setOutfit] = useState('classic');
  const [perform, setPerform] = useState(false);
  const [result, setResult] = useState(null);
  if (!a) return null;
  const nominees = a.nominees.map((id) => state.rivals.find((r) => r.id === id)).filter(Boolean);
  const reveal = () => {
    const r = act(attendAwardShow, { outfit, perform });
    if (r.ok) { setResult(r.data); setStep('reveal'); }
  };
  return (
    <div className="award" role="dialog" aria-label={a.show}>
      <div className="award-glow" aria-hidden="true" />
      <button className="icon-btn award-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      <Mono style={{ color: '#FFB020', textAlign: 'center' }}>{a.show} · Live</Mono>
      <h1 className="award-title">{a.category}</h1>
      {step === 'carpet' && (
        <div className="col gap12 mt16">
          <div className="award-carpet"><img src={facePhoto(state.player)} alt="" /><span>Red carpet</span></div>
          <Mono>Pick your look</Mono>
          {OUTFITS.map((o) => (
            <button key={o.id} className={`option press ${outfit === o.id ? 'on' : ''}`} style={{ '--accent': '#FFB020' }} onClick={() => setOutfit(o.id)}>
              <div className="row between"><b>{o.name}</b><span className="tiny muted">Press +{o.press}{o.risk ? ` · risk ${Math.round(o.risk * 100)}%` : ''}</span></div>
            </button>
          ))}
          <button className={`option press ${perform ? 'on' : ''}`} style={{ '--accent': '#FFB020' }} onClick={() => setPerform(!perform)}>
            <div className="row between"><b>Perform on the show</b><span className="tiny muted">25 energy · hype & fans</span></div>
          </button>
          <button className="btn primary block" onClick={() => setStep('nominees')}>Walk the carpet</button>
          <button className="btn block" onClick={() => { act(skipAwardShow); onClose(); }}>Skip the show</button>
        </div>
      )}
      {step === 'nominees' && (
        <div className="col gap12 mt16">
          <Mono style={{ textAlign: 'center' }}>And the nominees are…</Mono>
          <div className="award-noms">
            <div className="award-nom me"><img src={facePhoto(state.player)} alt="" /><b>{state.player.stageName}</b></div>
            {nominees.map((r) => <div key={r.id} className="award-nom"><ArtistAvatar rival={r} size={64} /><b>{r.name}</b></div>)}
          </div>
          <button className="btn primary block" onClick={reveal}>Open the envelope</button>
        </div>
      )}
      {step === 'reveal' && result && (
        <div className="col gap12 mt16" style={{ textAlign: 'center' }}>
          <div className={`award-env ${result.won ? 'win' : ''}`}><Icon name="trophy" size={56} color={result.won ? '#FFB020' : '#9A9AA5'} /></div>
          <h2 style={{ fontSize: 30 }}>{result.won ? state.player.stageName : state.awardEvent.winnerName}</h2>
          <div className="muted">{result.won ? 'You won!' : 'Not this time. The room still saw you.'}</div>
          <div className="small">{result.slay ? 'Your look was a hit on the carpet.' : 'The fashion police have notes on your look.'}</div>
          {result.won ? <button className="btn primary block" onClick={() => setStep('speech')}>Take the stage</button> : <button className="btn primary block" onClick={onClose}>Head to the afterparty</button>}
        </div>
      )}
      {step === 'speech' && (
        <div className="col gap12 mt16">
          <Mono>Your acceptance speech</Mono>
          {SPEECHES.map((sp) => (
            <button key={sp.id} className="option press" style={{ '--accent': '#FFB020' }} onClick={() => { act(giveSpeech, { style: sp.id }); setStep('done'); }}>
              <div className="row between"><b>{sp.name}</b><span className="tiny muted">+{sp.hype} hype{sp.risk ? ' · risky' : ''}</span></div>
            </button>
          ))}
        </div>
      )}
      {step === 'done' && (
        <div className="col gap12 mt16" style={{ textAlign: 'center' }}>
          <div className="muted">{a.won ? 'Trophy on the shelf.' : 'That’s a wrap on this year’s show.'}</div>
          <button className="btn primary block" onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  );
}

/* ---------- PR crisis ---------- */
export function CrisisSheet({ onClose }) {
  const { state, act } = useGame();
  const c = state.crisis;
  if (!c) return null;
  const pub = state.player.staff.publicist;
  const pick = (choice) => { act(handleCrisis, { choice }); onClose(); };
  return (
    <Sheet open onClose={onClose} title={c.title} sub={`PR crisis · respond by the end of week ${c.deadline}`}>
      <p style={{ marginTop: 0 }}>{c.text}</p>
      <div className="col">
        <button className="option press" onClick={() => pick('apologise')}><b>Apologise</b><div className="tiny muted mt8">Small hype hit, most people move on.</div></button>
        <button className="option press" onClick={() => pick('ignore')}><b>Ignore it</b><div className="tiny muted mt8">50/50: it blows over, or it gets much worse.</div></button>
        <button className="option press" onClick={() => pick('publicist')}><b>Let {pub ? 'your publicist' : 'a freelance publicist ($2,500)'} handle it</b><div className="tiny muted mt8">{pub ? 'Best odds (90%).' : 'Decent odds (65%). Hiring a publicist makes this better.'}</div></button>
      </div>
    </Sheet>
  );
}

/* ---------- Wrapped ---------- */
export function WrappedCard({ wrapped, onClose }) {
  const { state } = useGame();
  if (!wrapped) return null;
  const share = async () => {
    const text = `My Treblr Year ${wrapped.year} Wrapped: ${fmtNum(wrapped.streams)} streams, ${fmtNum(wrapped.listeners)} monthly listeners, top song “${wrapped.topSongs[0]?.title || '—'}”. I'm ${wrapped.type.name}.`;
    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard?.writeText(text); } catch { /* user cancelled */ }
  };
  return (
    <div className="wrapped" role="dialog" aria-label={`Year ${wrapped.year} Wrapped`}>
      <button className="icon-btn award-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      <div className="wrapped-card">
        <Mono style={{ color: '#0B0B0F' }}>Treblify Wrapped · Year {wrapped.year}</Mono>
        <h1 className="wrapped-big">{state.player.stageName}</h1>
        <div className="wrapped-type"><span>Artist type</span><b>{wrapped.type.name}</b><i>{wrapped.type.desc}</i></div>
        <div className="wrapped-grid">
          <div><span>Streams</span><b>{fmtNum(wrapped.streams)}</b></div>
          <div><span>Listeners</span><b>{fmtNum(wrapped.listeners)}</b></div>
          <div><span>Best peak</span><b>{wrapped.bestPeak ? `#${wrapped.bestPeak}` : '—'}</b></div>
          <div><span>Fans</span><b>{fmtNum(wrapped.fans)}</b></div>
        </div>
        <div className="wrapped-list"><span>Top songs</span>{wrapped.topSongs.length ? wrapped.topSongs.map((t, i) => <div key={t.id}><i>{i + 1}</i><b className="ellipsis">{t.title}</b><em>{fmtNum(t.streams)}</em></div>) : <div><b>No releases yet</b></div>}</div>
        <div className="wrapped-list"><span>Top countries</span>{wrapped.topCountries.map((c) => <div key={c.code}><i>{c.flag}</i><b>{c.name}</b><em>{fmtNum(c.streams)}</em></div>)}</div>
      </div>
      <div className="row mt16"><button className="btn grow" onClick={share}><Icon name="share" size={16} />Share</button><button className="btn primary grow" onClick={onClose}>Done</button></div>
    </div>
  );
}

/* ---------- Notifications centre ---------- */
const KIND_ICON = { chart: 'chart', offer: 'mail', message: 'chat', beef: 'flame', crisis: 'skull', award: 'trophy', wrapped: 'gift', tour: 'globe', life: 'heart' };
export function NotificationsPanel({ onClose }) {
  const { state, act, go } = useGame();
  const list = state.notifications || [];
  const unread = unreadNotifs(state);
  return (
    <div className="notif-back" onClick={onClose}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Notifications">
        <div className="row between"><h3>Notifications{unread ? ` · ${unread}` : ''}</h3><button className="mono sm" style={{ color: 'var(--lime)' }} onClick={() => act(markAllNotifs, null, { silent: true })}>Mark all read</button></div>
        <div className="notif-list">
          {list.slice(0, 40).map((n) => (
            <button key={n.id} className={`notif ${n.read ? '' : 'unread'}`} onClick={() => { act(markNotif, { id: n.id }, { silent: true }); onClose(); go(n.to); }}>
              <span className="notif-ic"><Icon name={KIND_ICON[n.kind] || 'bell'} size={16} /></span>
              <span className="grow" style={{ minWidth: 0 }}><span className="small notif-text">{n.count > 1 ? n.latest : n.text}</span><span className="tiny muted" style={{ display: 'block' }}>Week {n.week}{n.count > 1 ? ` · ${n.count} similar` : ''}</span></span>
              {n.count > 1 && <span className="notif-count">{n.count}</span>}
              {!n.read && <i className="notif-dot" />}
            </button>
          ))}
          {!list.length && <div className="muted small" style={{ padding: 16 }}>No notifications yet.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Award submissions: label (or team) suggests entries, you confirm ---------- */
export function AwardSubmissions({ onClose }) {
  const { state, act } = useGame();
  const sub = state.awardSubmission;
  const [picks, setPicks] = useState(() => sub?.picks || sub?.suggested || []);
  if (!sub) return null;
  const toggle = (id) => setPicks(picks.includes(id) ? picks.filter((x) => x !== id) : picks.length < 4 ? [...picks, id] : picks);
  return (
    <Sheet open onClose={onClose} title={`${sub.show} submissions`} sub={`${sub.by} ${sub.signed ? 'suggests' : 'recommends'} these entries. Ceremony: week ${sub.showWeek}.`}>
      <div className="small muted">Pick up to 4. {sub.signed ? 'If you don’t confirm, your label submits its picks.' : 'Unsigned artists must submit themselves or miss out.'} EPs aren’t eligible for album categories.</div>
      <div className="col gap6 mt12">
        {sub.options.map((o) => (
          <button key={o.id} className={`option press ${picks.includes(o.id) ? 'on' : ''}`} style={{ '--accent': '#FFB020' }} onClick={() => toggle(o.id)}>
            <div className="row between gap6"><b className="small ellipsis">{o.category}</b>{sub.suggested.includes(o.id) && <span className="chip sm" style={{ color: '#FFB020', flexShrink: 0 }}>Suggested</span>}</div>
            <div className="row between gap6 mt8"><span className="tiny muted ellipsis">{o.title}</span><span className="tiny" style={{ flexShrink: 0 }}>Strength {Math.round(o.strength * 100)}</span></div>
          </button>
        ))}
      </div>
      <button className="btn primary block mt16" disabled={!picks.length || sub.status === 'confirmed'} onClick={() => { if (act(confirmAwardEntries, { picks }).ok) onClose(); }}>{sub.status === 'confirmed' ? 'Entries submitted' : `Submit ${picks.length} entr${picks.length === 1 ? 'y' : 'ies'}`}</button>
    </Sheet>
  );
}
