import { useRef, useState } from 'react';
import {
  respondOffer, markRead, setStaff, saveGame, listSaves, deleteSave, calendarEvents, weekDate, STAFF,
  fmtNum, fmtMoney, weeklyExpenses, LABELS, exportPhotoPack, importPhotoPack, negotiateDeal, dealText, CREATIVE_CONTROL,
  creditScore, creditBand, loanOffer, takeLoan, repayLoan, weeklyPayment, totalDebt, avgIncome, netWorth,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, Seg, Empty, Bar } from '../ui/kit.jsx';
import { TreblrX, Treblrgram, TreblrTok, TreblrTube } from './social.jsx';
import { Treblify, TreblrMusic, Treblrchat } from './media.jsx';
import { Treblrpedia, TreblrFortune, Treblrfork, TreblrCloud, TreblrHiFi, TreblrTunes, StoreScreen } from './extra.jsx';
import { RosterEditor } from './roster.jsx';
import { InstallCard } from '../pwa.jsx';

/* ---------------- Inbox ---------------- */
function Inbox() {
  const { state, act } = useGame();
  const [tab, setTab] = useState('offer');
  const [open, setOpen] = useState(null);
  const items = state.inbox.filter((m) => (tab === 'offer' ? m.type === 'offer' : tab === 'dm' ? m.type === 'dm' : m.type === 'fanmail'));
  const m = open && state.inbox.find((x) => x.id === open);
  const count = (t) => state.inbox.filter((x) => x.type === t && !x.read && !x.status).length;
  const openMsg = (x) => { setOpen(x.id); if (!x.read) act(markRead, { id: x.id }, { silent: true }); };
  const sub = { brand: 'Brand deal', feature: 'Feature', label: 'Record deal', gig: 'Gig' };
  return (
    <div>
      <Seg options={[{ value: 'offer', label: `Offers${count('offer') ? ` · ${count('offer')}` : ''}` }, { value: 'dm', label: `DMs${count('dm') ? ` · ${count('dm')}` : ''}` }, { value: 'fanmail', label: `Fans${count('fanmail') ? ` · ${count('fanmail')}` : ''}` }]} value={tab} onChange={setTab} />
      <div className="mt12">
        {items.map((x) => (
          <button key={x.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => openMsg(x)}>
            <div style={{ width: 8, height: 8, borderRadius: 9, background: x.read ? 'transparent' : '#6C7BFF', flexShrink: 0 }} />
            <div className="grow">
              <div className="row between"><b className="ellipsis">{x.from}</b><span className="tiny muted">W{x.week}</span></div>
              <div className="small ellipsis">{x.subject}</div>
              {x.type === 'offer' && <div className="row gap6 mt8"><span className="chip sm">{sub[x.subtype]}</span>{x.status ? <span className="chip sm" style={{ color: x.status === 'accepted' ? '#3DDC84' : '#9A9AA5' }}>{x.status}</span> : <span className="chip sm" style={{ color: x.expires - state.week <= 0 ? '#FF4D5E' : '#FFB020' }}>{x.expires - state.week <= 0 ? 'Expires this week' : `${x.expires - state.week}w left`}</span>}</div>}
            </div>
          </button>
        ))}
        {!items.length && <Empty icon="mail">Nothing here yet.</Empty>}
      </div>
      <Sheet open={!!m} onClose={() => setOpen(null)} title={m?.subject} sub={m && `From ${m.from} · week ${m.week}`}>
        {m && (
          <>
            <p style={{ marginTop: 0 }}>{m.body}</p>
            {m.type === 'offer' && !m.status && (
              <div className="row mt16">
                <button className="btn grow" onClick={() => { act(respondOffer, { id: m.id, accept: false }); setOpen(null); }}>Decline</button>
                <button className="btn primary grow" onClick={() => { if (act(respondOffer, { id: m.id, accept: true }).ok) setOpen(null); }}>Accept</button>
              </div>
            )}
            {m.type === 'offer' && m.status && <div className="chip">{m.status === 'accepted' ? 'Accepted' : m.status === 'declined' ? 'Declined' : 'Expired'}</div>}
            {m.subtype === 'label' && !m.status && <Negotiate m={m} />}
          </>
        )}
      </Sheet>
    </div>
  );
}

function Negotiate({ m }) {
  const { act } = useGame();
  const t = m.payload;
  const [adv, setAdv] = useState(t.advance);
  const [roy, setRoy] = useState(Math.round(t.royalty * 100));
  const [albums, setAlbums] = useState(t.albums || 1);
  const [years, setYears] = useState(t.yearsPerAlbum || 3);
  const [control, setControl] = useState(t.control || 'shared');
  return (
    <div className="card tight mt12">
      <div className="row between"><Mono className="sm">Negotiate</Mono><span className="tiny muted">{t.patience > 0 ? `${t.patience} round${t.patience > 1 ? 's' : ''} of patience left` : 'Final offer'}</span></div>
      <div className="small mt8">Recoupment: the label keeps your share of royalties until the advance is earned back. {t.strict >= 0.5 ? 'This is a strict contract: miss the album schedule and they cut marketing and fine you.' : 'Schedule is flexible.'}</div>
      <label className="col gap6 mt12"><span className="row between tiny"><span>Advance</span><b>{fmtMoney(adv)}</b></span><input type="range" className="slider" min={Math.round(t.advance * 0.6)} max={Math.round(t.advance * 2)} step={500} value={adv} onChange={(e) => setAdv(+e.target.value)} /></label>
      <label className="col gap6 mt8"><span className="row between tiny"><span>Your royalty</span><b>{roy}%</b></span><input type="range" className="slider" min={10} max={85} value={roy} onChange={(e) => setRoy(+e.target.value)} /></label>
      <div className="row between mt8 tiny"><span>Albums</span><div className="seg fit">{[1, 2, 3].map((n) => <button key={n} className={albums === n ? 'on' : ''} onClick={() => setAlbums(n)}>{n}</button>)}</div></div>
      <div className="row between mt8 tiny"><span>Years per album</span><div className="seg fit">{[2, 3].map((n) => <button key={n} className={years === n ? 'on' : ''} onClick={() => setYears(n)}>{n}</button>)}</div></div>
      <div className="col gap6 mt8">{CREATIVE_CONTROL.map((c) => <button key={c.id} className={`option press ${control === c.id ? 'on' : ''}`} onClick={() => setControl(c.id)}><div className="row between gap6"><b className="small">{c.name}</b><span className="tiny muted" style={{ flexShrink: 0 }}>reach ×{c.reach}</span></div></button>)}</div>
      <button className="btn block mt12" disabled={t.patience <= 0} onClick={() => act(negotiateDeal, { id: m.id, ask: { advance: adv, royalty: roy / 100, albums, yearsPerAlbum: years, control } })}>Send counter-offer</button>
      <div className="tiny muted mt8">Current terms: {dealText(t)}</div>
    </div>
  );
}

/* ---------------- Bank ---------------- */
function Bank() {
  const { state } = useGame();
  const p = state.player;
  const rep = state.lastReport;
  const inc = Object.values(state.ledger.income).reduce((a, b) => a + b, 0);
  const exp = Object.values(state.ledger.expense).reduce((a, b) => a + b, 0);
  const hist = state.history.slice(-12);
  const max = Math.max(1, ...hist.map((h) => Math.abs(h.net)));
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#3DDC8433,#15151B)' }}>
        <Mono>Available balance</Mono>
        <div className="num" style={{ fontSize: 40, color: p.cash < 0 ? '#FF4D5E' : undefined }}>{fmtMoney(p.cash)}</div>
        <div className="small muted">Fixed costs ≈ {fmtMoney(weeklyExpenses(state))}/week · {p.label ? `${p.label.name} keeps ${100 - Math.round(p.label.royalty * 100)}% of streams` : 'Independent — you keep 100% of streams'}</div>
      </div>
      <div className="grid2 mt12">
        <div className="stat"><Mono className="sm">In this week</Mono><div className="v up">+{fmtMoney(inc)}</div></div>
        <div className="stat"><Mono className="sm">Out this week</Mono><div className="v down">-{fmtMoney(exp)}</div></div>
      </div>
      <Credit />
      {hist.length > 0 && (
        <div className="card mt12"><Mono>Weekly net · last {hist.length}</Mono>
          <div className="row mt12" style={{ alignItems: 'center', height: 90, gap: 4 }}>
            {hist.map((h) => <div key={h.week} title={`W${h.week}: ${fmtMoney(h.net)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div style={{ height: `${h.net > 0 ? (h.net / max) * 50 : 0}%`, background: '#3DDC84', borderRadius: 3, marginTop: 'auto' }} />
              <div style={{ height: `${h.net < 0 ? (-h.net / max) * 50 : 0}%`, background: '#FF4D5E', borderRadius: 3, marginBottom: 'auto' }} />
            </div>)}
          </div>
        </div>
      )}
      {rep && (
        <div className="card mt12"><Mono>Last week (W{rep.week})</Mono>
          {Object.entries(rep.income).map(([k, v]) => <div key={k} className="row between small mt8"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="up">+{fmtMoney(v)}</span></div>)}
          {Object.entries(rep.expense).map(([k, v]) => <div key={k} className="row between small mt8"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="down">-{fmtMoney(v)}</span></div>)}
        </div>
      )}
      <h3 className="mt24" style={{ fontSize: 18 }}>Transactions</h3>
      {state.transactions.slice(0, 40).map((t, i) => (
        <div key={i} className="list-item"><div className="grow"><div className="small ellipsis">{t.label}</div><div className="tiny muted">Week {t.week}</div></div><b className={t.amount >= 0 ? 'up' : 'down'}>{t.amount >= 0 ? '+' : ''}{fmtMoney(t.amount)}</b></div>
      ))}
      {!state.transactions.length && <Empty icon="bank">No transactions yet.</Empty>}
    </div>
  );
}

function Credit() {
  const { state, act } = useGame();
  const score = creditScore(state);
  const offer = loanOffer(state);
  const [amount, setAmount] = useState(Math.min(offer.max || 0, 5000));
  const [weeks, setWeeks] = useState(52);
  const loans = state.bank?.loans || [];
  const pct = (score - 300) / 550;
  const amt = Math.min(amount, offer.max || 0);
  return (
    <div className="card mt12">
      <div className="row between"><Mono>Credit score</Mono><span className="tiny muted">Net worth {fmtMoney(netWorth(state))}</span></div>
      <div className="row between mt8" style={{ alignItems: 'flex-end' }}><span className="num" style={{ fontSize: 34, color: pct > 0.7 ? '#3DDC84' : pct > 0.45 ? '#FFB020' : '#FF4D5E' }}>{score}</span><b className="small">{creditBand(score)}</b></div>
      <div className="mt8"><Bar pct={pct} color={pct > 0.7 ? '#3DDC84' : pct > 0.45 ? '#FFB020' : '#FF4D5E'} /></div>
      <div className="tiny muted mt8">Built from payment history, average income ({fmtMoney(avgIncome(state))}/wk), debt ({fmtMoney(totalDebt(state))}) and credit age. Three missed payments is a default: assets seized, no credit for 26 weeks.</div>
      {loans.map((l) => (
        <div key={l.id} className="list-item"><div className="grow"><b className="small">{fmtMoney(l.amount)} at {l.apr}%</b><div className="tiny muted">{fmtMoney(Math.round(l.balance))} left · {fmtMoney(l.payment)}/week{l.missed ? ` · ${l.missed} missed` : ''}</div></div><button className="btn sm" disabled={state.player.cash < l.balance} onClick={() => act(repayLoan, { id: l.id })}>Pay off</button></div>
      ))}
      {offer.max > 0 ? (
        <div className="mt12">
          <div className="row between tiny"><span>Borrow</span><b>{fmtMoney(amt)} · {offer.apr}% APR</b></div>
          <input type="range" className="slider mt8" style={{ width: '100%' }} min={500} max={Math.max(500, offer.max)} step={500} value={amt} onChange={(e) => setAmount(+e.target.value)} />
          <div className="row between mt8 tiny"><span>Term</span><div className="seg fit">{[26, 52, 104].map((n) => <button key={n} className={weeks === n ? 'on' : ''} onClick={() => setWeeks(n)}>{n}w</button>)}</div></div>
          <div className="tiny muted mt8">Weekly repayment {fmtMoney(Math.round(weeklyPayment(amt, offer.apr, weeks)))} · taken automatically each week.</div>
          <button className="btn block mt12" disabled={amt < 500} onClick={() => act(takeLoan, { amount: amt, weeks })}>Take loan</button>
        </div>
      ) : <div className="small muted mt12">{offer.reason}</div>}
    </div>
  );
}

/* ---------------- Calendar ---------------- */
function Calendar() {
  const { state } = useGame();
  const now = weekDate(state.week);
  const [offset, setOffset] = useState(0);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const evs = calendarEvents(state, Math.max(1, state.week - 8), state.week + 30);
  const firstDow = (month.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  // events land on the Friday of their week (release day)
  const dayEvents = (d) => evs.filter((e) => { const f = weekDate(e.week); f.setUTCDate(f.getUTCDate() + 4); return f.getUTCFullYear() === month.getUTCFullYear() && f.getUTCMonth() === month.getUTCMonth() && f.getUTCDate() === d; });
  const color = { release: '#FF6B4A', award: '#FFB020', expiry: '#6C7BFF', merch: '#2DD4BF' };
  const today = (d) => { const t = weekDate(state.week); return offset === 0 && d >= t.getUTCDate() && d < t.getUTCDate() + 7 && t.getUTCMonth() === month.getUTCMonth(); };
  return (
    <div>
      <div className="row between">
        <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous month"><Icon name="back" /></button>
        <h3>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next month"><Icon name="chev" /></button>
      </div>
      <div className="mt12" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="mono sm">{d}</div>)}
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const de = dayEvents(d);
          return (
            <div key={d} style={{ aspectRatio: '1', borderRadius: 10, background: today(d) ? 'rgba(108,123,255,.18)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 13 }}>
              {d}
              <div className="row" style={{ gap: 2 }}>{de.slice(0, 3).map((e, i) => <i key={i} style={{ width: 5, height: 5, borderRadius: 9, background: color[e.type] }} />)}</div>
            </div>
          );
        })}
      </div>
      <h3 className="mt24" style={{ fontSize: 18 }}>Upcoming</h3>
      {evs.filter((e) => e.week >= state.week).map((e, i) => (
        <div key={i} className="list-item"><i style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: color[e.type] }} /><div className="grow"><b className="small">{e.title}</b><div className="tiny muted">Week {e.week} · {weekDate(e.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div></div></div>
      ))}
    </div>
  );
}

/* ---------------- News ---------------- */
function News() {
  const { state } = useGame();
  const [f, setF] = useState('all');
  const list = state.news.filter((n) => f === 'all' || n.aboutPlayer);
  return (
    <div>
      <Seg options={[{ value: 'all', label: 'All news' }, { value: 'me', label: 'About you' }]} value={f} onChange={setF} />
      {list.map((n, i) => (
        <div key={i} className="list-item" style={{ alignItems: 'flex-start' }}>
          <div className="grow"><Mono className="sm" style={{ color: n.aboutPlayer ? '#C6FF3D' : undefined }}>{n.tag} · Week {n.week}</Mono><div className="head" style={{ fontSize: 16, marginTop: 4, fontWeight: 600 }}>{n.headline}</div></div>
        </div>
      ))}
      {!list.length && <Empty icon="news">No headlines yet.</Empty>}
    </div>
  );
}

/* ---------------- Manager ---------------- */
function Manager() {
  const { state, act } = useGame();
  const p = state.player;
  const hired = STAFF.filter((s) => p.staff[s.id]);
  const tips = [];
  if (p.cash < weeklyExpenses(state) * 3) tips.push('Cash is thin. Book jobs or gigs before spending on rollouts.');
  if (state.songs.filter((s) => s.status === 'recorded').length >= 3) tips.push('You have enough recorded songs for an EP — EPs can chart on the Album Chart.');
  if (!p.label && p.popularity >= 25) tips.push(`Labels are watching. ${LABELS.find((l) => p.popularity >= l.minPop && l.minPop >= 25)?.name || 'An indie label'} could sign you now.`);
  if (p.suspicion > 40) tips.push('Suspicion is high. Lay off the "consulting fees" or risk a payola scandal.');
  if (p.hype < 15) tips.push('Hype is cold. Post on TreblrX or do press before your next release.');
  hired.forEach((s) => tips.push(s.tips[state.week % s.tips.length]));
  if (!tips.length) tips.push('Stay consistent: one release every 3–6 weeks keeps your listeners growing.');
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#6C7BFF33,#15151B)' }}>
        <Mono>Advice</Mono>
        {tips.slice(0, 4).map((t, i) => <div key={i} className="small mt8">💬 {t}</div>)}
      </div>
      <h3 className="mt24" style={{ fontSize: 18 }}>Your team</h3>
      <div className="col mt12">
        {STAFF.map((s) => (
          <div key={s.id} className="card tight">
            <div className="row between gap6"><b>{s.name}</b><span className="small" style={{ flexShrink: 0 }}>{fmtMoney(s.salary)}/wk{s.commission ? ` + ${Math.round(s.commission * 100)}%` : ''}</span></div>
            <div className="tiny muted mt8">{s.buff}</div>
            <button className={`btn sm mt12 ${p.staff[s.id] ? 'danger' : 'accent'}`} onClick={() => act(setStaff, { role: s.id, hire: !p.staff[s.id] })}>{p.staff[s.id] ? 'Let go' : 'Hire'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function Settings() {
  const { state, slot, toast, onSwitch, onNew, onTitle } = useGame();
  const [confirm, setConfirm] = useState(false);
  const saves = listSaves();
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `treblr-${state.player.stageName.replace(/\W+/g, '-')}-week${state.week}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const [store, setStore] = useState(false);
  const [roster, setRoster] = useState(false);
  return (
    <div className="col gap16">
      <button className="btn primary block" onClick={() => toast(saveGame(state, slot) ? `Saved to slot ${slot}.` : 'Could not save (storage full?)')}>Save now</button>
      <InstallCard />
      <button className="btn block" onClick={() => setStore(true)}><Icon name="gift" size={18} />Store <span className="chip sm" style={{ marginLeft: 6 }}>Coming soon</span></button>
      <button className="btn block" onClick={() => setRoster(true)}><Icon name="users" size={18} />Roster editor (artist packs)</button>
      <Sheet open={store} onClose={() => setStore(false)} title="Store" sub="Placeholder — nothing is for sale yet."><StoreScreen /></Sheet>
      <Sheet open={roster} onClose={() => setRoster(false)} title="Roster editor" sub="Custom artist packs apply to NEW careers."><RosterEditor /></Sheet>
      <div className="card">
        <Mono>Save slots</Mono>
        {saves.map((s) => (
          <div key={s.slot} className="list-item">
            <div className="grow"><b>Slot {s.slot}{s.slot === slot ? ' · current' : ''}</b><div className="tiny muted">{s.empty ? 'Empty' : `${s.stageName} · week ${s.week} · ${fmtNum(s.fans)} fans`}</div></div>
            {s.slot !== slot && <button className="btn sm" onClick={() => (s.empty ? onNew(s.slot) : onSwitch(s.slot))}>{s.empty ? 'New' : 'Load'}</button>}
          </div>
        ))}
      </div>
      <button className="btn block" onClick={exportJson}><Icon name="upload" size={18} />Export save as JSON</button>
      <PhotoPack />
      <button className="btn block" onClick={onTitle}>Title screen</button>
      {!confirm ? <button className="btn danger block" onClick={() => setConfirm(true)}>Reset this career</button> : (
        <div className="card" style={{ borderColor: 'rgba(255,77,94,.4)' }}>
          <b>Delete slot {slot} permanently?</b>
          <div className="row mt12"><button className="btn grow" onClick={() => setConfirm(false)}>Cancel</button><button className="btn danger grow" onClick={() => { deleteSave(slot); onNew(slot); }}>Delete</button></div>
        </div>
      )}
      <div className="tiny muted" style={{ textAlign: 'center' }}>Treblr · save format v{state.version} · seed {state.seed}</div>
    </div>
  );
}

function PhotoPack() {
  const { state, act, toast } = useGame();
  const ref = useRef(null);
  const n = Object.keys(state.artistPhotos || {}).length;
  const exportPack = () => {
    const blob = new Blob([JSON.stringify(exportPhotoPack(state))], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'treblr-photo-pack.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="card">
      <Mono>Artist photo pack</Mono>
      <div className="small muted mt8">{n} artist photo{n === 1 ? '' : 's'} set in this save. Share packs as JSON; artists are matched by name.</div>
      <div className="row mt12">
        <button className="btn sm grow" disabled={!n} onClick={exportPack}>Export pack</button>
        <button className="btn sm grow" onClick={() => ref.current?.click()}>Import pack</button>
        <input ref={ref} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try { act(importPhotoPack, { pack: JSON.parse(await f.text()) }); } catch { toast('That file isn’t valid JSON.', false); }
        }} />
      </div>
    </div>
  );
}

export const APPS = [
  { nav: true, id: 'treblify', name: 'Treblify', icon: 'play', bg: 'radial-gradient(circle at 30% 30%, #1ED760, #0d7a35)', fg: '#000', Component: Treblify, screenBg: '#121212', accent: '#1DB954', glyph: 'wave' },
  { nav: true, id: 'treblrmusic', name: 'Treblr Music', icon: 'star', bg: 'linear-gradient(160deg, #FF5A72, #FA233B)', Component: TreblrMusic, screenBg: '#000', accent: '#FA233B', glyph: 'note' },
  { nav: true, id: 'treblrx', name: 'TreblrX', icon: 'chat', bg: '#000', Component: TreblrX, screenBg: '#000', accent: '#1d9bf0', glyph: 'x' },
  { nav: true, id: 'treblrgram', name: 'Treblrgram', icon: 'camera', bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)', Component: Treblrgram, screenBg: '#000', accent: '#ee2a7b', glyph: 'cam' },
  { id: 'treblrtok', name: 'TreblrTok', icon: 'video', bg: '#000', Component: TreblrTok, screenBg: '#000', accent: '#FE2C55', glyph: 'tok', full: true },
  { nav: true, id: 'treblrtube', name: 'TreblrTube', icon: 'play', bg: '#FF0033', Component: TreblrTube, screenBg: '#0f0f0f', accent: '#FF0033', glyph: 'tube' },
  { nav: true, id: 'treblrchat', name: 'Treblrchat', icon: 'chat', bg: 'linear-gradient(160deg,#5BEA84,#1DAA55)', Component: Treblrchat, screenBg: '#0B141A', accent: '#25D366', glyph: 'bubble' },
  { id: 'treblrpedia', name: 'Treblrpedia', icon: 'news', bg: '#f8f9fa', fg: '#202122', Component: Treblrpedia, screenBg: '#fff', accent: '#3366cc', glyph: 'wiki', light: true },
  { id: 'fortune', name: 'Treblr Fortune', icon: 'cash', bg: 'linear-gradient(160deg,#1a1a1a,#3a2f0b)', Component: TreblrFortune, screenBg: '#fbf8f1', accent: '#b8860b', glyph: 'fortune', light: true },
  { id: 'treblrfork', name: 'Treblrfork', icon: 'star', bg: '#111', Component: Treblrfork, screenBg: '#fff', accent: '#ef4135', glyph: 'fork', light: true },
  { nav: true, id: 'treblrcloud', name: 'TreblrCloud', icon: 'radio', bg: 'linear-gradient(160deg,#ff8a00,#ff3d00)', Component: TreblrCloud, screenBg: '#121212', accent: '#ff5500', glyph: 'cloud' },
  { nav: true, id: 'hifi', name: 'Treblr HiFi', icon: 'disc', bg: '#000', Component: TreblrHiFi, screenBg: '#000', accent: '#33ffee', glyph: 'hifi' },
  { nav: true, id: 'tunes', name: 'TreblrTunes', icon: 'star', bg: 'linear-gradient(160deg,#fc5c7d,#6a82fb)', Component: TreblrTunes, screenBg: '#0e0e10', accent: '#fc5c7d', glyph: 'tunes' },
  { id: 'inbox', name: 'Inbox', icon: 'mail', bg: '#6C7BFF', Component: Inbox },
  { id: 'bank', name: 'Bank', icon: 'bank', bg: '#3DDC84', fg: '#0B0B0F', Component: Bank, accent: '#3DDC84' },
  { id: 'calendar', name: 'Calendar', icon: 'cal', bg: '#fff', fg: '#FF4D5E', Component: Calendar },
  { id: 'news', name: 'News', icon: 'news', bg: '#FFB020', fg: '#0B0B0F', Component: News, accent: '#FFB020' },
  { id: 'manager', name: 'Manager', icon: 'briefcase', bg: '#1E1E26', Component: Manager },
  { id: 'settings', name: 'Settings', icon: 'gear', bg: '#5d5d68', Component: Settings },
];

export { Bar };
// legacy ids from v2 saves / deep links
export const APP_ALIASES = { streamify: 'treblify', chirp: 'treblrx', snapshot: 'treblrgram', clipz: 'treblrtok', viewtube: 'treblrtube', messages: 'treblrchat' };
