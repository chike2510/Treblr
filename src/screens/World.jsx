import { useState } from 'react';
import {
  CITIES, VENUES, JOBS, LABELS, MERCH_TIERS, ENERGY, cityById, gigDemand, gigFatigue, playGig, planTour, cancelTour, tourQuote, doJob, signLabel, leaveLabel,
  dropMerch, doMedia, payola, fmtMoney, fmtNum, TRAINING, trainSkill, trainingCost, ARTIST_CUT,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, Bar, Empty, AREA } from '../ui/kit.jsx';

const LAND = [
  [[-168, 65], [-140, 70], [-95, 72], [-75, 62], [-55, 50], [-80, 25], [-97, 18], [-83, 9], [-105, 22], [-118, 33], [-125, 48], [-150, 58]],
  [[-80, 9], [-60, 10], [-35, -7], [-40, -22], [-58, -38], [-70, -55], [-75, -40], [-72, -15], [-81, -5]],
  [[-10, 36], [-9, 44], [-5, 48], [-3, 58], [8, 63], [20, 70], [30, 70], [40, 60], [30, 45], [25, 36], [12, 38], [3, 43]],
  [[-17, 15], [-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -17], [9, 4], [-8, 4]],
  [[30, 45], [40, 60], [30, 70], [70, 75], [110, 78], [140, 72], [170, 66], [160, 58], [140, 50], [130, 35], [122, 25], [108, 10], [100, 2], [97, 17], [80, 8], [72, 20], [60, 25], [50, 30], [36, 36]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [135, -35], [115, -34]],
  [[-50, 60], [-25, 70], [-20, 82], [-60, 82], [-72, 76]],
];
const proj = (lng, lat) => [((lng + 180) / 360) * 360, ((80 - lat) / 138) * 180];

const SECTIONS = [
  { title: 'Career', items: [{ id: 'jobs', name: 'Jobs', icon: 'briefcase', live: true }, { id: 'training', name: 'Training', icon: 'sparkle' }, { id: 'labels', name: 'Record Labels', icon: 'disc' }, { id: 'merch', name: 'Merch', icon: 'shirt' }, { id: 'brands', name: 'Brand Deals', icon: 'star' }] },
  { title: 'Live', items: [{ id: 'gigs', name: 'Gigs', icon: 'ticket', live: true }, { id: 'tours', name: 'Tours', icon: 'globe' }] },
  { title: 'Media', items: [{ id: 'press', name: 'Press', icon: 'news' }, { id: 'radio', name: 'Radio', icon: 'radio' }, { id: 'interview', name: 'Interviews', icon: 'mic' }] },
  { title: 'Shady', items: [{ id: 'payola', name: 'Payola', icon: 'skull' }] },
];

export default function World({ initial }) {
  const { state, go } = useGame();
  const [open, setOpen] = useState(initial || null);
  const p = state.player;
  const heat = p.fanHeat;
  const max = Math.max(1, ...Object.values(heat));
  const top = Object.entries(heat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const pendingBrands = state.inbox.filter((m) => m.subtype === 'brand' && !m.status).length;
  const all = SECTIONS.flatMap((s) => s.items);
  const cur = all.find((x) => x.id === open);
  return (
    <div className="screen">
      <div className="row between">
        <div><Mono style={{ color: 'var(--teal)' }}>World</Mono><h1 style={{ fontSize: 30 }}>Your fan map</h1></div>
        <Icon name="globe" size={30} color="#2DD4BF" />
      </div>
      <div className="map mt16">
        <svg viewBox="0 0 360 180" preserveAspectRatio="none" aria-hidden="true">
          {[30, 60, 90, 120, 150].map((y) => <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="rgba(45,212,191,.07)" />)}
          {[60, 120, 180, 240, 300].map((x) => <line key={x} y1="0" y2="180" x1={x} x2={x} stroke="rgba(45,212,191,.07)" />)}
          {LAND.map((poly, i) => <polygon key={i} points={poly.map(([lng, lat]) => proj(lng, lat).join(',')).join(' ')} fill="rgba(45,212,191,.10)" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />)}
        </svg>
        {CITIES.map((c) => {
          const h = heat[c.id] || 0;
          const [x, y] = proj(c.lng, c.lat);
          const size = h ? 6 + 18 * Math.sqrt(h / max) : 3;
          return <div key={c.id} className={`city ${c.id === p.city ? 'home' : ''}`} title={`${c.name}: ${fmtNum(h)} fans`} style={{ left: `${(x / 360) * 100}%`, top: `${(y / 180) * 100}%`, width: size, height: size, opacity: h ? 1 : 0.35 }} />;
        })}
        <div style={{ position: 'absolute', left: 12, bottom: 10 }} className="mono sm">Dot size = fan heat</div>
      </div>
      <div className="row gap6 mt12 wrap">
        {top.map(([id, v]) => { const c = cityById(id); return <span key={id} className="chip sm">{c.flag} {c.name} · {fmtNum(v)}</span>; })}
      </div>

      {SECTIONS.map((s) => (
        <div key={s.title} className="section">
          <div className="section-head"><h3>{s.title}</h3>{s.title === 'Shady' && <Mono className="sm" style={{ color: 'var(--red)' }}>Suspicion {Math.round(p.suspicion)}</Mono>}</div>
          <div className="grid2">
            {s.items.map((it) => (
              <button key={it.id} className="card tight press" style={{ textAlign: 'left', minHeight: 92, borderColor: s.title === 'Shady' ? 'rgba(255,77,94,.25)' : undefined }} onClick={() => setOpen(it.id)}>
                <Icon name={it.icon} color={s.title === 'Shady' ? '#FF4D5E' : AREA.world} />
                <div className="head mt8" style={{ fontSize: 16 }}>{it.name}</div>
                <div className="tiny muted">{subtitle(it.id, state, pendingBrands)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Sheet open={!!cur} onClose={() => setOpen(null)} title={cur?.name}>
        {open === 'jobs' && <Jobs />}
        {open === 'gigs' && <Gigs />}
        {open === 'tours' && <Tours />}
        {open === 'training' && <Training />}
        {open === 'labels' && <Labels />}
        {open === 'merch' && <Merch />}
        {open === 'brands' && <div><p className="muted" style={{ marginTop: 0 }}>Brands reach out through your Inbox once you pass 1.5K fans. Bigger fan bases and a manager mean bigger cheques.</p><div className="card tight row between"><span>Pending brand offers</span><b>{pendingBrands}</b></div><button className="btn accent block mt16" onClick={() => { setOpen(null); go({ tab: 'phone', app: 'inbox' }); }}>Open Inbox</button></div>}
        {['press', 'radio', 'interview'].includes(open) && <Media kind={open} />}
        {open === 'payola' && <Payola />}
      </Sheet>
    </div>
  );
}

function subtitle(id, s, brands) {
  const p = s.player;
  switch (id) {
    case 'jobs': return 'Quick cash, costs energy';
    case 'gigs': return `${cityById(p.city).name} + ${Object.keys(p.fanHeat).length - 1} cities`;
    case 'tours': return s.tour ? `On tour · ${s.tour.stops.filter((x) => !x.done).length} shows left` : 'Multi-week runs';
    case 'training': return 'Grow your skills';
    case 'labels': return p.label ? p.label.name : 'Independent';
    case 'merch': return s.merch?.active ? `${s.merch.stock} units left` : 'Drop a collection';
    case 'brands': return brands ? `${brands} pending` : 'Sponsorships';
    case 'press': return '+hype, risk of bad reviews';
    case 'radio': return 'More spins on your single';
    case 'interview': return 'Podcasts & talk shows';
    case 'payola': return 'Buy spins. Risky.';
    default: return '';
  }
}

function Jobs() {
  const { state, act } = useGame();
  const p = state.player;
  return (
    <div className="col">
      <div className="small muted">Energy left: <b style={{ color: '#C6FF3D' }}>{p.energy}</b></div>
      {JOBS.map((j) => {
        const locked = Object.entries(j.minSkill || {}).find(([k, v]) => p.skills[k] < v);
        return (
          <div key={j.id} className="card tight">
            <div className="row between"><b>{j.name}</b><span className="up num">~{fmtMoney(j.pay)}</span></div>
            <div className="tiny muted mt8">{j.desc} · {j.energy} energy · trains {j.skill}</div>
            <button className="btn sm accent mt12" disabled={!!locked || p.energy < j.energy} onClick={() => act(doJob, { jobId: j.id })}>{locked ? `Needs ${locked[0]} ${locked[1]}` : 'Work shift'}</button>
          </div>
        );
      })}
    </div>
  );
}

function Gigs() {
  const { state, act } = useGame();
  const p = state.player;
  const [city, setCity] = useState(p.city);
  const cities = [...CITIES].sort((a, b) => (p.fanHeat[b.id] || 0) - (p.fanHeat[a.id] || 0));
  const demand = gigDemand(state, city);
  return (
    <div className="col">
      <label className="col gap6"><Mono>City</Mono>
        <select value={city} onChange={(e) => setCity(e.target.value)}>{cities.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name} — {fmtNum(p.fanHeat[c.id] || 0)} fans{c.id === p.city ? ' (home)' : ''}</option>)}</select>
      </label>
      <div className="small muted">Estimated demand: <b style={{ color: '#2DD4BF' }}>~{fmtNum(demand)} tickets</b>{city !== p.city && ' · travel costs apply'}</div>
      {VENUES.map((v) => {
        const locked = p.fans < v.minFans;
        const fat = gigFatigue(state, city, v.id);
        const est = Math.min(v.capacity, Math.round(demand * (0.5 + 0.5 * fat)));
        return (
          <div key={v.id} className="card tight" style={{ opacity: locked ? 0.5 : 1 }}>
            <div className="row between"><b>{v.name}</b><span className="small">{fmtNum(v.capacity)} cap · ${v.ticket}</span></div>
            <div className="mt8"><Bar pct={est / v.capacity} color={est >= v.capacity ? '#3DDC84' : '#2DD4BF'} /></div>
            <div className="row between mt8 tiny muted"><span>{locked ? `Needs ${fmtNum(v.minFans)} fans` : `Est. ${fmtNum(est)} sold · ~${fmtMoney(est * v.ticket * ARTIST_CUT)} your cut`}</span><span>{v.energy} energy</span></div>
            {!locked && fat < 0.8 && <div className="tiny mt8" style={{ color: 'var(--amber)' }}>The regulars have seen you here. Try a bigger room or a new city.</div>}
            {!locked && <button className="btn sm accent mt12" disabled={p.energy < v.energy || !!state.tour} onClick={() => act(playGig, { venueId: v.id, cityId: city })}>{state.tour ? 'On tour' : 'Play show'}</button>}
          </div>
        );
      })}
    </div>
  );
}

function Tours() {
  const { state, act } = useGame();
  const p = state.player;
  const venues = VENUES.filter((v) => p.fans >= v.minFans * 1.2);
  const [venue, setVenue] = useState(venues[venues.length - 1]?.id);
  const [sel, setSel] = useState([]);
  const [perWeek, setPerWeek] = useState(2);
  const t = state.tour;
  if (t) {
    const v = VENUES.find((x) => x.id === t.venueId);
    return (
      <div className="col">
        <div className="card tight"><Mono>On tour · {v.name}s</Mono><div className="small muted mt8">{t.reserve} energy reserved each week · {fmtMoney(t.gross)} your cut so far · {t.sellouts} sell-outs</div></div>
        {t.stops.map((x, i) => {
          const c = cityById(x.cityId);
          return (
            <div key={i} className="list-item">
              <span className="num" style={{ width: 22 }}>{i + 1}</span>
              <div className="grow"><b className="small">{c.flag} {c.name}</b><div className="tiny muted">Week {x.week}{x.done ? ` · ${fmtNum(x.sold)}/${fmtNum(v.capacity)} sold · ${fmtMoney(x.gross)}` : x.week === state.week ? ' · this week' : ''}</div></div>
              {x.done ? <Icon name="check" size={18} color={x.soldOut ? '#3DDC84' : '#9A9AA5'} /> : <span className="chip sm">Upcoming</span>}
            </div>
          );
        })}
        <button className="btn danger block" onClick={() => act(cancelTour)}>Cancel remaining shows (refunds + hype hit)</button>
      </div>
    );
  }
  if (!venues.length) return <Empty icon="globe">Touring opens once you can fill clubs in several cities (about {fmtNum(VENUES[1].minFans * 1.2)} fans). Play single gigs first.</Empty>;
  const v = VENUES.find((x) => x.id === venue);
  const q = tourQuote(state, { venueId: venue, cityIds: sel, perWeek });
  const cities = [...CITIES].sort((a, b) => (p.fanHeat[b.id] || 0) - (p.fanHeat[a.id] || 0));
  const est = sel.reduce((a, cid) => a + Math.min(v.capacity, gigDemand(state, cid)) * v.ticket * ARTIST_CUT, 0);
  const move = (i, d) => { const n = [...sel]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setSel(n); };
  return (
    <div className="col">
      <div className="small muted">Plan a route. Stops resolve week by week ({perWeek} per week) with nightly results in your weekly report. Energy is reserved while you tour.</div>
      <div className="pills">{venues.map((x) => <button key={x.id} className={`pill ${venue === x.id ? 'on' : ''}`} onClick={() => setVenue(x.id)}>{x.name}s</button>)}</div>
      <div className="row between"><Mono>Shows per week</Mono><div className="seg" style={{ width: 160 }}>{[1, 2, 3].map((n) => <button key={n} className={perWeek === n ? 'on' : ''} onClick={() => setPerWeek(n)}>{n}</button>)}</div></div>
      <div className="row wrap gap6">
        {cities.map((c) => {
          const on = sel.includes(c.id);
          return <button key={c.id} className="chip" style={on ? { background: '#2DD4BF', color: '#0B0B0F', borderColor: 'transparent' } : {}} onClick={() => setSel(on ? sel.filter((x) => x !== c.id) : sel.length < 12 ? [...sel, c.id] : sel)}>{c.flag} {c.name} · {fmtNum(p.fanHeat[c.id] || 0)}</button>;
        })}
      </div>
      {sel.length > 0 && (
        <div className="card tight">
          <Mono>Route</Mono>
          {sel.map((cid, i) => (
            <div key={cid} className="list-item">
              <span className="num" style={{ width: 22 }}>{i + 1}</span>
              <div className="grow small">{cityById(cid).flag} {cityById(cid).name}<div className="tiny muted">Week {state.week + Math.floor(i / perWeek)} · demand ~{fmtNum(gigDemand(state, cid))}</div></div>
              <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={16} /></button>
              <button className="icon-btn" aria-label="Move down" disabled={i === sel.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={16} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="card tight">
        <div className="row between small"><span>{sel.length} stops · {q?.weeks || 0} weeks</span><b>{fmtMoney(q?.cost || 0)} production</b></div>
        <div className="row between small mt8"><span className="muted">Energy reserved / week</span><span>{q?.reserve}</span></div>
        <div className="row between small mt8"><span className="muted">Projected cut</span><span className="up">~{fmtMoney(est)}</span></div>
      </div>
      <button className="btn accent block" disabled={sel.length < 3 || p.cash < (q?.cost || 0) || p.energy < (q?.reserve || 0)} onClick={() => { if (act(planTour, { venueId: venue, cityIds: sel, perWeek }).ok) setSel([]); }}>Book tour</button>
    </div>
  );
}

function Training() {
  const { state, act } = useGame();
  const p = state.player;
  const used = state.weekStats?.train || 0;
  return (
    <div className="col">
      <div className="small muted">Up to 2 sessions a week. Gains shrink as a skill climbs. Songwriting drives song quality; vocals and production shape the final recording.</div>
      {TRAINING.map((t) => {
        const cost = trainingCost(p, t.id);
        return (
          <div key={t.id} className="card tight">
            <div className="row between"><b>{t.name}</b><span className="small">{fmtMoney(cost)} · {t.energy} energy</span></div>
            <div className="row gap6 mt8"><span className="tiny muted" style={{ width: 90, textTransform: 'capitalize' }}>{t.id} {Math.round(p.skills[t.id])}</span><div className="grow"><Bar pct={p.skills[t.id] / 100} color="#2DD4BF" /></div></div>
            <button className="btn sm accent mt12" disabled={used >= 2 || p.energy < t.energy || p.cash < cost} onClick={() => act(trainSkill, { skill: t.id })}>{used >= 2 ? 'Done for the week' : 'Train'}</button>
          </div>
        );
      })}
    </div>
  );
}

function Labels() {
  const { state, act } = useGame();
  const p = state.player;
  return (
    <div className="col">
      {p.label ? (
        <div className="card tight"><Mono>Signed to</Mono><div className="head mt8" style={{ fontSize: 20 }}>{p.label.name}</div><div className="small muted">You keep {Math.round(p.label.royalty * 100)}% of streaming income · since week {p.label.signedWeek}</div><button className="btn danger sm mt12" onClick={() => act(leaveLabel)}>Buy out contract</button></div>
      ) : <div className="small muted">Independent: 100% of streams, less radio and playlist reach. Your popularity: <b>{p.popularity}</b></div>}
      {LABELS.map((l) => (
        <div key={l.id} className="card tight" style={{ opacity: p.popularity < l.minPop ? 0.55 : 1 }}>
          <div className="row between"><b>{l.name}</b><span className="chip sm">{l.tier}</span></div>
          <div className="tiny muted mt8">Advance {fmtMoney(l.advance)} · you keep {Math.round(l.royalty * 100)}% · needs popularity {l.minPop}</div>
          {!p.label && <button className="btn sm accent mt12" disabled={p.popularity < l.minPop} onClick={() => act(signLabel, { labelId: l.id })}>Sign</button>}
        </div>
      ))}
    </div>
  );
}

function Merch() {
  const { state, act } = useGame();
  const m = state.merch;
  return (
    <div className="col">
      {m?.active && <div className="card tight"><Mono>Live drop</Mono><div className="row between mt8"><span>{MERCH_TIERS.find((t) => t.id === m.tier)?.name}</span><b>{m.sold} sold · {m.stock} left</b></div></div>}
      {MERCH_TIERS.map((t) => (
        <div key={t.id} className="card tight">
          <div className="row between"><b>{t.name}</b><span className="small">{fmtMoney(t.cost)}</span></div>
          <div className="tiny muted mt8">{t.units} units at ${t.price} · sells weekly based on fans and hype</div>
          <button className="btn sm accent mt12" disabled={m?.active || state.player.cash < t.cost} onClick={() => act(dropMerch, { tier: t.id })}>Produce</button>
        </div>
      ))}
    </div>
  );
}

function Media({ kind }) {
  const { state, act } = useGame();
  const p = state.player;
  const info = {
    press: { e: ENERGY.press, d: 'Send your music to critics and blogs. Usually lifts hype; sometimes the reviews sting.' },
    radio: { e: ENERGY.radio, d: 'Visit stations to push your latest single. Boosts radio spins for a few weeks (and the Hot 100).' },
    interview: { e: ENERGY.interview, d: 'Podcasts and talk shows. Grows fans with charisma. Needs popularity 20+.' },
  }[kind];
  const e = p.staff.publicist ? Math.round(info.e * 0.7) : info.e;
  return (
    <div className="col">
      <p className="muted" style={{ margin: 0 }}>{info.d}</p>
      <div className="card tight row between"><span>Energy cost{p.staff.publicist ? ' (publicist −30%)' : ''}</span><b>{e}</b></div>
      <button className="btn accent block" disabled={p.energy < e} onClick={() => act(doMedia, { kind })}>{kind === 'press' ? 'Run press campaign' : kind === 'radio' ? 'Do a radio tour' : 'Book interview'}</button>
    </div>
  );
}

function Payola() {
  const { state, act } = useGame();
  const p = state.player;
  return (
    <div className="col">
      <p className="muted" style={{ margin: 0 }}>Pay a “consultant” to get your latest single spun on radio. Every payment raises suspicion. Above 45, a scandal can hit any week — fans, hype and spins vanish.</p>
      <div className="card tight">
        <div className="row between"><Mono>Suspicion</Mono><b style={{ color: p.suspicion > 45 ? '#FF4D5E' : '#FFB020' }}>{Math.round(p.suspicion)}/100</b></div>
        <div className="mt8"><Bar pct={p.suspicion / 100} color={p.suspicion > 45 ? '#FF4D5E' : '#FFB020'} /></div>
        <div className="tiny muted mt8">Cools by 2 a week when you stay clean.</div>
      </div>
      {[2500, 10000, 50000].map((a) => <button key={a} className="btn danger block" disabled={p.cash < a} onClick={() => act(payola, { amount: a })}>Pay {fmtMoney(a)}</button>)}
    </div>
  );
}
