import { useState } from 'react';
import {
  CITIES, VENUES, JOBS, LABELS, MERCH_TIERS, ENERGY, cityById, gigDemand, gigFatigue, playGig, planTour, cancelTour, tourQuote, doJob, signLabel, leaveLabel,
  dropMerch, doMedia, fmtMoney, fmtNum, TRAINING, trainSkill, trainingCost, trainingFocus, ARTIST_CUT, venueUnlocked, venueLockReason,
  labelById, labelTerms, requestLabelMeeting, buyoutCost, DISTRIBUTORS, distributorById, setDistributor, CREATIVE_CONTROL, genreName,
  LIFESTYLE, lifestyleById, buyLifestyle, sellLifestyle, moveOutRental, lifestyleUpkeep, assetsValue, ACTING_ROLES, audition, auditionOdds,
  festivalCalendar, pitchFestival, festivalLineup, festSlotFor, TOUR_STAFF, setlistScore, tourStaffCost, PAYOLA, payolaPackage, formatWeekDate,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, Bar, Empty, AREA, ArtistAvatar, facePhoto } from '../ui/kit.jsx';

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
  { title: 'Career', items: [{ id: 'jobs', name: 'Jobs', icon: 'briefcase', live: true }, { id: 'training', name: 'Training', icon: 'sparkle' }, { id: 'labels', name: 'Labels & Distribution', icon: 'disc' }, { id: 'merch', name: 'Merch', icon: 'shirt' }, { id: 'brands', name: 'Brand Deals', icon: 'star' }, { id: 'acting', name: 'Acting', icon: 'video' }] },
  { title: 'Live', items: [{ id: 'gigs', name: 'Gigs', icon: 'ticket', live: true }, { id: 'tours', name: 'Tours', icon: 'globe' }, { id: 'festivals', name: 'Festivals', icon: 'users' }] },
  { title: 'Life', items: [{ id: 'lifestyle', name: 'Lifestyle', icon: 'home' }] },
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
        {open === 'acting' && <Acting />}
        {open === 'festivals' && <Festivals />}
        {open === 'lifestyle' && <Lifestyle />}
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
    case 'labels': return p.label ? p.label.name : `Indie · ${distributorById(s.distributor).name}`;
    case 'acting': return s.acting?.current ? `Filming “${s.acting.current.title}”` : `${s.acting?.credits?.length || 0} credits`;
    case 'festivals': { const f = festivalCalendar(s, 16).find((x) => x.pitchOpen && !x.state.pitched); return f ? `${f.name} taking pitches` : 'Lineups & pitches'; }
    case 'lifestyle': return `${s.lifestyle?.owned?.length || 0} owned · ${fmtMoney(lifestyleUpkeep(JSON.parse(JSON.stringify(s))))}/wk`;
    case 'merch': return s.merch?.active ? `${s.merch.stock} units left` : 'Drop a collection';
    case 'brands': return brands ? `${brands} pending` : 'Sponsorships';
    case 'press': return '+hype, risk of bad reviews';
    case 'radio': return 'More spins on your single';
    case 'interview': return 'Podcasts & talk shows';
    case 'payola': return 'Buy streams & spins. Very risky.';
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
        const locked = !venueUnlocked(p, v);
        const fat = gigFatigue(state, city, v.id);
        const est = Math.min(v.capacity, Math.round(demand * (0.5 + 0.5 * fat)));
        return (
          <div key={v.id} className="card tight" style={{ opacity: locked ? 0.5 : 1 }}>
            <div className="row between"><b>{v.name}</b><span className="small">{fmtNum(v.capacity)} cap · ${v.ticket}</span></div>
            <div className="mt8"><Bar pct={est / v.capacity} color={est >= v.capacity ? '#3DDC84' : '#2DD4BF'} /></div>
            <div className="row between mt8 tiny muted gap6"><span>{locked ? venueLockReason(p, v) : `Est. ${fmtNum(est)} sold · ~${fmtMoney(est * v.ticket * ARTIST_CUT)} your cut`}</span><span style={{ flexShrink: 0 }}>{v.energy} energy</span></div>
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
  const venues = VENUES.filter((v) => venueUnlocked(p, v, 1.2));
  const released = state.songs.filter((x) => x.status === 'released').sort((a, b) => (b.lifetimeStreams || 0) - (a.lifetimeStreams || 0));
  const [setlist, setSetlist] = useState(() => released.slice(0, 10).map((x) => x.id));
  const [staff, setStaff] = useState([]);
  const [tname, setTname] = useState('');
  const [venue, setVenue] = useState(venues[venues.length - 1]?.id);
  const [sel, setSel] = useState([]);
  const [perWeek, setPerWeek] = useState(2);
  const t = state.tour;
  if (t) {
    const v = VENUES.find((x) => x.id === t.venueId);
    return (
      <div className="col">
        <div className="card tight"><Mono>{t.name || 'On tour'} · {v.name}s</Mono><div className="small muted mt8">{t.reserve} energy reserved each week · {fmtMoney(t.gross)} your cut so far · {t.sellouts} sell-outs · show {t.showQuality ?? '—'}/100</div>{t.staff?.length ? <div className="tiny muted mt8">Crew: {t.staff.map((id) => TOUR_STAFF.find((x) => x.id === id)?.name).join(', ')} · {fmtMoney(tourStaffCost(t.staff, t.venueId))}/week</div> : null}</div>
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
  if (!venues.some((x) => x.id === venue) && venues.length) setTimeout(() => setVenue(venues[venues.length - 1].id));
  const v = VENUES.find((x) => x.id === venue);
  const q = tourQuote(state, { venueId: venue, cityIds: sel, perWeek, staff });
  const sl = setlistScore(state, setlist, venue, staff);
  const moveSong = (i, d) => { const n = [...setlist]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setSetlist(n); };
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
        <div className="row between"><Mono>Setlist</Mono><span className="small">Show quality <b style={{ color: sl.score >= 70 ? '#3DDC84' : sl.score >= 50 ? '#C6FF3D' : '#FFB020' }}>{sl.score}</b>/100</span></div>
        {sl.notes.map((n, i) => <div key={i} className="tiny muted mt8">• {n}</div>)}
        {setlist.map((id, i) => { const so = state.songs.find((x) => x.id === id); if (!so) return null; return (
          <div key={id} className="list-item">
            <span className="num" style={{ width: 22 }}>{i + 1}</span>
            <div className="grow" style={{ minWidth: 0 }}><b className="small ellipsis" style={{ display: 'block' }}>{so.title}</b><div className="tiny muted">Q{so.quality} · {fmtNum(so.lifetimeStreams || 0)} streams{i === 0 ? ' · opener' : i === setlist.length - 1 ? ' · closer' : ''}</div></div>
            <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveSong(i, -1)}><Icon name="up" size={16} /></button>
            <button className="icon-btn" aria-label="Move down" disabled={i === setlist.length - 1} onClick={() => moveSong(i, 1)}><Icon name="down" size={16} /></button>
            <button className="icon-btn" aria-label="Remove" onClick={() => setSetlist(setlist.filter((x) => x !== id))}><Icon name="close" size={14} /></button>
          </div>
        ); })}
        <div className="row wrap gap6 mt8">{released.filter((x) => !setlist.includes(x.id)).slice(0, 12).map((x) => <button key={x.id} className="chip sm" onClick={() => setSetlist([...setlist, x.id])}>+ {x.title}</button>)}</div>
        {!released.length && <div className="tiny muted">Release songs to build a setlist.</div>}
      </div>
      <div className="card tight">
        <Mono>Tour crew</Mono>
        {TOUR_STAFF.map((x) => { const on = staff.includes(x.id); return (
          <button key={x.id} className={`option press mt8 ${on ? 'on' : ''}`} style={{ width: '100%', '--accent': AREA.world }} onClick={() => setStaff(on ? staff.filter((y) => y !== x.id) : [...staff, x.id])}>
            <div className="row between gap6"><b className="small">{x.name}</b><span className="tiny" style={{ flexShrink: 0 }}>{fmtMoney(tourStaffCost([x.id], venue))}/wk</span></div>
            <div className="tiny muted mt8">{x.desc}</div>
          </button>
        ); })}
      </div>
      <label className="col gap6"><Mono>Tour name (optional)</Mono><input value={tname} maxLength={40} onChange={(e) => setTname(e.target.value)} placeholder="e.g. The Afterglow Tour" /></label>
      <div className="card tight">
        <div className="row between small"><span>{sel.length} stops · {q?.weeks || 0} weeks</span><b>{fmtMoney(q?.cost || 0)} production</b></div>
        <div className="row between small mt8"><span className="muted">Crew wages / week</span><span>{fmtMoney(q?.crewWeekly || 0)}</span></div>
        <div className="row between small mt8"><span className="muted">Energy reserved / week</span><span>{q?.reserve}</span></div>
        <div className="row between small mt8"><span className="muted">Projected cut</span><span className="up">~{fmtMoney(est)}</span></div>
      </div>
      <button className="btn accent block" disabled={sel.length < 3 || p.cash < (q?.cost || 0) || p.energy < (q?.reserve || 0)} onClick={() => { if (act(planTour, { venueId: venue, cityIds: sel, perWeek, setlist, staff, name: tname }).ok) setSel([]); }}>Book tour</button>
    </div>
  );
}

function Training() {
  const { state, act } = useGame();
  const p = state.player;
  return (
    <div className="col">
      <div className="small muted">Train as often as your energy and cash allow. Repeating the same skill in one week gives less each time, so mix it up. Gains also shrink as a skill climbs. Songwriting drives song quality; vocals and production shape the final recording.</div>
      {TRAINING.map((t) => {
        const cost = trainingCost(p, t.id);
        const focus = trainingFocus(state.weekStats?.['train_' + t.id] || 0);
        return (
          <div key={t.id} className="card tight">
            <div className="row between"><b>{t.name}</b><span className="small">{fmtMoney(cost)} · {t.energy} energy{focus < 1 ? ` · ${Math.round(focus * 100)}% focus` : ''}</span></div>
            <div className="row gap6 mt8"><span className="tiny muted" style={{ width: 90, textTransform: 'capitalize' }}>{t.id} {Math.round(p.skills[t.id])}</span><div className="grow"><Bar pct={p.skills[t.id] / 100} color="#2DD4BF" /></div></div>
            <button className="btn sm accent mt12" disabled={p.energy < t.energy || p.cash < cost} onClick={() => act(trainSkill, { skill: t.id })}>{p.energy < t.energy ? 'Not enough energy' : 'Train'}</button>
          </div>
        );
      })}
    </div>
  );
}

function Labels() {
  const { state, act, go } = useGame();
  const p = state.player;
  const [tab, setTab] = useState(p.label ? 'contract' : 'distribution');
  const c = p.label;
  const lbl = c && labelById(c.id);
  const pending = state.inbox.filter((m) => m.subtype === 'label' && !m.status);
  return (
    <div className="col">
      <div className="seg">{[['contract', 'Contract'], ['distribution', 'Distribution'], ['labels', 'Labels']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'contract' && (c ? (
        <div className="card tight">
          <Mono>Signed to</Mono><div className="head mt8" style={{ fontSize: 20 }}>{c.name}</div>
          <div className="small muted">{lbl ? `${lbl.tier}${lbl.parent ? ` · part of ${labelById(lbl.parent)?.name}` : ''}` : ''} · since week {c.signedWeek}</div>
          <div className="grid2 mt12">
            <div className="stat"><Mono className="sm">Royalty</Mono><div className="v">{Math.round(c.royalty * 100)}%</div></div>
            <div className="stat"><Mono className="sm">Albums</Mono><div className="v">{c.delivered || 0}/{c.albums || 1}</div></div>
          </div>
          {c.advance > 0 && <div className="mt12"><div className="row between tiny"><span>Advance recouped</span><span>{fmtMoney(c.recouped || 0)} / {fmtMoney(c.advance)}</span></div><div className="mt8"><Bar pct={(c.recouped || 0) / c.advance} color="#2DD4BF" /></div><div className="tiny muted mt8">Until it’s recouped, your share of royalties pays the label back.</div></div>}
          <div className="tiny muted mt12">{c.endWeek ? `Term ends week ${c.endWeek}. Next album due by week ${c.nextDue}.` : 'Legacy open-ended deal.'} {CREATIVE_CONTROL.find((x) => x.id === c.control)?.name}.{c.breach ? ' ⚠ Overdue album: marketing support cut.' : ''}</div>
          <button className="btn danger sm mt12" disabled={p.cash < buyoutCost(state)} onClick={() => act(leaveLabel)}>Buy out contract · {fmtMoney(buyoutCost(state))}</button>
        </div>
      ) : <Empty icon="disc">You’re independent. Distribution gets your music out; labels bring advances, radio and playlist reach.</Empty>)}
      {tab === 'distribution' && (
        <>
          {c ? <div className="small muted">{c.name} distributes your music while you’re signed.</div> : <div className="small muted">Independent artists release through a distributor. You keep ownership; they take a fee or a cut. Current: <b>{distributorById(state.distributor).name}</b>.</div>}
          {DISTRIBUTORS.map((d) => (
            <div key={d.id} className="card tight" style={{ opacity: c ? 0.5 : 1, borderColor: state.distributor === d.id && !c ? 'rgba(45,212,191,.5)' : undefined }}>
              <div className="row between gap6"><b>{d.name}</b><span className="small" style={{ flexShrink: 0 }}>{d.fee ? `${fmtMoney(d.fee)}/yr` : 'Free'}{d.cut ? ` · ${Math.round(d.cut * 100)}% cut` : ''}</span></div>
              <div className="tiny muted mt8">{d.desc}{d.minML ? ` Needs ${fmtNum(d.minML)} listeners.` : ''}</div>
              {!c && <button className="btn sm accent mt12" disabled={state.distributor === d.id} onClick={() => act(setDistributor, { id: d.id })}>{state.distributor === d.id ? 'Current' : 'Switch'}</button>}
            </div>
          ))}
        </>
      )}
      {tab === 'labels' && (
        <>
          {pending.length > 0 && <button className="card tight press" style={{ textAlign: 'left', borderColor: 'rgba(45,212,191,.5)' }} onClick={() => go({ tab: 'phone', app: 'inbox' })}><b>{pending.length} deal{pending.length > 1 ? 's' : ''} waiting in your Inbox</b><div className="tiny muted mt8">Open to negotiate advance, royalty, albums, term and creative control.</div></button>}
          <div className="small muted">Your popularity: <b>{p.popularity}</b>. Ask for a meeting (10 energy); if they like you, an offer lands in your Inbox to negotiate. Bigger labels = bigger advances, stricter contracts.</div>
          {LABELS.slice().sort((a, b) => a.minPop - b.minPop).map((l) => {
            const t = labelTerms(state, l);
            const close = p.popularity >= l.minPop - 6;
            return (
              <div key={l.id} className="card tight" style={{ opacity: close ? 1 : 0.55 }}>
                <div className="row between gap6"><b className="ellipsis">{l.name}</b><span className="chip sm" style={{ flexShrink: 0 }}>{l.tier}</span></div>
                <div className="tiny muted mt8">{cityById(l.city).flag} {cityById(l.city).name}{l.parent ? ` · imprint of ${labelById(l.parent)?.name}` : ''} · {l.genres.length ? l.genres.map(genreName).join(', ') : 'All genres'}</div>
                <div className="tiny muted">Typical advance {fmtMoney(t?.advance || l.advance)} · you keep ~{Math.round(l.royalty * 100)}% · {l.strict >= 0.5 ? 'strict' : 'flexible'} · needs popularity {l.minPop}</div>
                {!c && <button className="btn sm accent mt12" disabled={!close || p.energy < 10} onClick={() => act(requestLabelMeeting, { labelId: l.id })}>Request meeting</button>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function Acting() {
  const { state, act } = useGame();
  const p = state.player;
  const a = state.acting || { credits: [], current: null };
  return (
    <div className="col">
      <div className="small muted">Film and TV roles: audition (10 energy), then filming reserves 20 energy a week. Premieres bring fans, hype and pay. Train “Acting class” to land bigger parts. Acting skill: <b>{Math.round(p.skills.acting || 0)}</b>.</div>
      {a.current && <div className="card tight" style={{ borderColor: 'rgba(45,212,191,.5)' }}><Mono>Current project</Mono><div className="head mt8">“{a.current.title}”</div><div className="tiny muted">{ACTING_ROLES.find((r) => r.id === a.current.roleId)?.name} · filmed {a.current.shot}/{a.current.shootWeeks} weeks · premieres week {a.current.releaseWeek}</div></div>}
      {ACTING_ROLES.map((r) => {
        const odds = auditionOdds(state, r);
        const locked = p.popularity < r.minPop;
        return (
          <div key={r.id} className="card tight" style={{ opacity: locked ? 0.55 : 1 }}>
            <div className="row between gap6"><b>{r.name}</b><span className="small up" style={{ flexShrink: 0 }}>{fmtMoney(r.pay)}</span></div>
            <div className="tiny muted mt8">{r.shoot} week{r.shoot > 1 ? 's' : ''} filming · {locked ? `needs popularity ${r.minPop}` : `${Math.round(odds * 100)}% audition odds`}</div>
            <button className="btn sm accent mt12" disabled={locked || !!a.current || p.energy < 10 || a.lastAudition === state.week} onClick={() => act(audition, { roleId: r.id })}>Audition</button>
          </div>
        );
      })}
      {a.credits?.length > 0 && <div className="card tight"><Mono>Credits</Mono>{a.credits.map((x) => <div key={x.id} className="list-item"><div className="grow" style={{ minWidth: 0 }}><b className="small ellipsis" style={{ display: 'block' }}>“{x.title}”</b><div className="tiny muted">{x.role} · {x.verdict} ({x.score}/100) · +{fmtNum(x.fans)} fans</div></div></div>)}</div>}
    </div>
  );
}

function Festivals() {
  const { state, act, openArtist } = useGame();
  const p = state.player;
  const list = festivalCalendar(state, 30);
  const [poster, setPoster] = useState(null);
  const f = poster && list.find((x) => x.key === poster);
  return (
    <div className="col">
      <div className="small muted">Pitch yourself 7–16 weeks before a festival. Lineups drop 6 weeks out — that’s when you find out. Your likely slot today: <b>{festSlotFor(state) || 'not yet (popularity 28+)'}</b>.</div>
      {list.map((x) => {
        const st = x.state || {};
        const announced = state.week >= x.lineupWeek;
        return (
          <div key={x.key} className="card tight">
            <div className="row between gap6"><b className="ellipsis">{x.name}</b><span className="chip sm" style={{ flexShrink: 0 }}>{x.size === 'mega' ? 'Mega' : 'Major'}</span></div>
            <div className="tiny muted mt8">{cityById(x.city).flag} {cityById(x.city).name} · week {x.festWeek} ({formatWeekDate(x.festWeek, { month: 'short', day: 'numeric' })}) · {x.genres.length ? x.genres.map(genreName).join(', ') : 'all genres'}</div>
            <div className="tiny mt8">{st.played ? `Played: ${fmtNum(st.played.crowd)} crowd · ${fmtMoney(st.played.fee)}` : announced ? (st.accepted ? `✅ You’re on the lineup (${st.slot})` : st.pitched ? '❌ Not this year' : 'Lineup announced') : st.pitched ? `Pitched · lineup drops week ${x.lineupWeek}` : x.pitchOpen ? 'Taking pitches now' : `Pitches open week ${x.festWeek - 16}`}</div>
            <div className="row gap6 mt12">
              {!st.pitched && x.pitchOpen && <button className="btn sm accent" disabled={p.socialEnergy < 5} onClick={() => act(pitchFestival, { key: x.key })}>Pitch · 5 social</button>}
              {announced && <button className="btn sm" onClick={() => setPoster(x.key)}>Lineup poster</button>}
            </div>
          </div>
        );
      })}
      {f && <FestivalPoster f={f} onClose={() => setPoster(null)} onArtist={openArtist} />}
    </div>
  );
}
function FestivalPoster({ f, onClose, onArtist }) {
  const { state } = useGame();
  const lu = festivalLineup(state, f, f.key);
  const name = (id) => state.rivals.find((r) => r.id === id)?.name;
  const me = state.player.stageName;
  const tier = (ids, slot) => [...(lu.me === slot ? [me] : []), ...ids.map(name)].filter(Boolean);
  return (
    <div className="fest-poster" role="dialog" aria-label={`${f.name} lineup`} onClick={onClose}>
      <div className="fest-inner" onClick={(e) => e.stopPropagation()} style={{ '--fh': `${(f.name.length * 37) % 360}` }}>
        <button className="icon-btn fest-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        <div className="fest-name">{f.name}</div>
        <div className="fest-when">{cityById(f.city).name} · {formatWeekDate(f.festWeek, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div className="fest-head">{tier(lu.headliner, 'headliner').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-sub">{tier(lu.sub, 'sub').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-under">{tier(lu.undercard, 'undercard').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-art row gap6">{lu.headliner.slice(0, 3).map((id) => { const r = state.rivals.find((x) => x.id === id); return r ? <ArtistAvatar key={id} rival={r} size={44} onClick={() => onArtist(id)} /> : null; })}</div>
      </div>
    </div>
  );
}

function Lifestyle() {
  const { state, act } = useGame();
  const p = state.player;
  const ls = state.lifestyle || { owned: [], rental: null };
  const kinds = [['rental', 'Rent a place'], ['home', 'Buy a home'], ['car', 'Cars'], ['jewelry', 'Jewellery'], ['art', 'Art'], ['studio', 'Home studio'], ['jet', 'Private jet']];
  return (
    <div className="col">
      <div className="card tight"><div className="row between small"><span>Assets</span><b>{fmtMoney(assetsValue(state))}</b></div><div className="row between small mt8"><span className="muted">Weekly upkeep & rent extras</span><span>{fmtMoney(lifestyleUpkeep(JSON.parse(JSON.stringify(state))))}</span></div><div className="tiny muted mt8">Big purchases lift your image (and hype); flexing too early can annoy fans. Homes and art can gain value; cars lose it. Sell anytime.</div></div>
      {ls.owned.length > 0 && <div className="card tight"><Mono>Owned</Mono>{ls.owned.map((o) => { const it = lifestyleById(o.id); return <div key={o.uid} className="list-item"><div className="grow" style={{ minWidth: 0 }}><b className="small ellipsis" style={{ display: 'block' }}>{it?.name}</b><div className="tiny muted">Worth {fmtMoney(o.value)} · bought for {fmtMoney(o.price)}</div></div><button className="btn sm" onClick={() => act(sellLifestyle, { uid: o.uid })}>Sell</button></div>; })}</div>}
      {ls.rental && <div className="card tight row between"><span className="small">Living in: <b>{lifestyleById(ls.rental)?.name}</b></span><button className="btn sm" onClick={() => act(moveOutRental)}>Move out</button></div>}
      {kinds.map(([k, label]) => (
        <div key={k}>
          <Mono className="sm">{label}</Mono>
          {LIFESTYLE.filter((x) => x.kind === k).map((it) => (
            <div key={it.id} className="card tight mt8">
              <div className="row between gap6"><b className="small">{it.name}</b><span className="small" style={{ flexShrink: 0 }}>{it.price ? fmtMoney(it.price) : `${fmtMoney(it.weekly)}/wk`}</span></div>
              <div className="tiny muted mt8">{it.desc}{it.price && it.weekly ? ` · upkeep ${fmtMoney(it.weekly)}/wk` : ''}</div>
              <button className="btn sm accent mt8" disabled={it.price ? p.cash < it.price : ls.rental === it.id || p.cash < it.weekly * 4} onClick={() => act(buyLifestyle, { id: it.id })}>{it.kind === 'rental' ? (ls.rental === it.id ? 'Living here' : 'Move in') : 'Buy'}</button>
            </div>
          ))}
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
  const songs = state.songs.filter((x) => x.status === 'released').sort((a, b) => b.releasedWeek - a.releasedWeek);
  const [song, setSong] = useState(songs[0]?.id);
  const banned = p.chartBanUntil && state.week <= p.chartBanUntil;
  return (
    <div className="col">
      <p className="muted" style={{ margin: 0 }}>Pay “consultants” for spins and streams. It works — millions of streams — but every deal raises suspicion. Above 30, any week can bring an exposé: an 8-week chart ban, 10% of your fans gone, hype wiped, and labels may drop you.</p>
      <div className="card tight">
        <div className="row between"><Mono>Suspicion</Mono><b style={{ color: p.suspicion > 30 ? '#FF4D5E' : '#FFB020' }}>{Math.round(p.suspicion)}/100</b></div>
        <div className="mt8"><Bar pct={p.suspicion / 100} color={p.suspicion > 30 ? '#FF4D5E' : '#FFB020'} /></div>
        <div className="tiny muted mt8">Cools by 2 a week when you stay clean.{banned ? ` Chart-banned until week ${p.chartBanUntil}.` : ''}</div>
      </div>
      {songs.length ? <select value={song || ''} onChange={(e) => setSong(e.target.value)} aria-label="Song to push">{songs.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select> : <div className="small muted">Release a song first.</div>}
      {PAYOLA.map((k) => (
        <div key={k.id} className="card tight" style={{ borderColor: 'rgba(255,77,94,.25)' }}>
          <div className="row between gap6"><b>{k.name}</b><span className="small" style={{ flexShrink: 0 }}>{fmtMoney(k.cost)}</span></div>
          <div className="tiny muted mt8">{k.desc} Suspicion +{k.suspicion}.</div>
          <button className="btn danger sm mt12" disabled={!songs.length || p.cash < k.cost || banned} onClick={() => act(payolaPackage, { pkg: k.id, songId: song })}>Pay</button>
        </div>
      ))}
    </div>
  );
}
