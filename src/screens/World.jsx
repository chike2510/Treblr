import { useState } from 'react';
import { AwardSubmissions } from './Overlays.jsx';
import {
  CITIES, VENUES, JOBS, LABELS, MERCH_TIERS, ENERGY, cityById, gigDemand, gigFatigue, playGig, planTour, cancelTour, tourQuote, doJob, signLabel, leaveLabel,
  dropMerch, doMedia, fmtMoney, fmtNum, TRAINING, trainSkill, trainingCost, trainingFocus, ARTIST_CUT, venueUnlocked, venueLockReason,
  labelById, labelTerms, requestLabelMeeting, buyoutCost, DISTRIBUTORS, distributorById, setDistributor, CREATIVE_CONTROL, genreName,
  LIFESTYLE, lifestyleById, buyLifestyle, sellLifestyle, moveOutRental, lifestyleUpkeep, assetsValue, ACTING_ROLES, audition, auditionOdds,
  festivalCalendar, pitchFestival, festivalLineup, festSlotFor, TOUR_STAFF, setlistScore, tourStaffCost, PAYOLA, payolaPackage, formatWeekDate, AWARD_SHOWS, ACTING_AWARD_SHOWS, FILM_PROJECTS, awardCalendar,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, Bar, Empty, AREA, ArtistAvatar, facePhoto } from '../ui/kit.jsx';
import FeatureArt from '../ui/FeatureArt.jsx';
import { LABEL_STARTUP, createOwnLabel, updateOwnLabelBrand, scoutTalent, signProspect, releaseLabelSingle, LABEL_STAFF, LABEL_BUDGETS, setLabelStaff, dropLabelArtist } from '../engine/index.js';
import FeatureSubnav, { FEATURE_ROUTE_ROOT, FEATURE_SUBPAGES, featurePageTitle } from './FeatureSubnav.jsx';

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
  { title: 'Career', items: [{ id: 'jobs', name: 'Jobs', icon: 'briefcase', live: true }, { id: 'training', name: 'Training', icon: 'sparkle' }, { id: 'labels', name: 'Labels & Distribution', icon: 'disc' }, { id: 'merch', name: 'Merch', icon: 'shirt' }, { id: 'brands', name: 'Brand Deals', icon: 'star' }, { id: 'acting', name: 'Acting', icon: 'video' }, { id: 'awards', name: 'Awards', icon: 'trophy' }] },
  { title: 'Live', items: [{ id: 'gigs', name: 'Gigs', icon: 'ticket', live: true }, { id: 'tours', name: 'Tours', icon: 'globe' }, { id: 'festivals', name: 'Festivals', icon: 'users' }] },
  { title: 'Life', items: [{ id: 'lifestyle', name: 'Lifestyle', icon: 'home' }] },
  { title: 'Media', items: [{ id: 'press', name: 'Press', icon: 'news' }, { id: 'radio', name: 'Radio', icon: 'radio' }, { id: 'interview', name: 'Interviews', icon: 'mic' }] },
  { title: 'Shady', items: [{ id: 'payola', name: 'Payola', icon: 'skull' }] },
];

const FEATURE_PAGE_IDS = ['tours', 'labels', 'lifestyle', 'acting', 'merch', 'festivals', 'awards'];
const FEATURE_PAGE_COMPONENTS = { tours: Tours, labels: Labels, lifestyle: Lifestyle, acting: Acting, merch: Merch, festivals: Festivals, awards: Awards, training: Training };

export default function World({ initial }) {
  const { state, go } = useGame();
  const [open, setOpen] = useState(initial || null);
  const p = state.player;
  const featureRoot = FEATURE_ROUTE_ROOT[initial];
  const fullPages = FEATURE_PAGE_IDS;
  if (featureRoot || initial === 'training') {
    const item = SECTIONS.flatMap((section) => section.items).find((x) => x.id === (featureRoot || initial));
    const Page = FEATURE_PAGE_COMPONENTS[featureRoot || initial];
    const title = featurePageTitle(initial) || item?.name;
    return <div className="screen world-feature"><div className="row between"><div><Mono style={{ color: 'var(--teal)' }}>World / {item?.name} / {title}</Mono><h1 style={{ fontSize: 30 }}>{title}</h1><div className="small muted">Week {state.week} · {p.stageName} · {fmtMoney(p.cash)} · {p.energy} energy</div></div><button className="icon-btn" onClick={() => go({ tab: 'world' })} aria-label="Back to World"><Icon name="close" size={20} /></button></div>{featureRoot && <FeatureSubnav system={featureRoot} page={initial} />}<div className="section mt12"><Page page={initial} /></div></div>;
  }
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
              <button key={it.id} className="card tight press" style={{ textAlign: 'left', minHeight: 92, borderColor: s.title === 'Shady' ? 'rgba(255,77,94,.25)' : undefined }} onClick={() => FEATURE_ROUTE_ROOT[it.id] ? go({ tab: 'world', section: it.id }) : setOpen(it.id)}>
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
    case 'labels': return p.label ? p.label.name : `Indie · ${distributorById(s.distributor).name}`;
    case 'acting': return s.acting?.current ? `Filming “${s.acting.current.title}”` : `${s.acting?.credits?.length || 0} credits`;
    case 'awards': return `${s.awardHistory?.filter((x) => x.result === 'won').length || 0} wins · next show calendar`;
    case 'festivals': { const f = festivalCalendar(s, 16).find((x) => x.pitchOpen && !x.state.pitched); return f ? `${f.name} taking pitches` : 'Lineups & pitches'; }
    case 'lifestyle': return `${s.lifestyle?.owned?.length || 0} owned · ${fmtMoney(lifestyleUpkeep(JSON.parse(JSON.stringify(s))))}/wk`;
    case 'merch': return s.merch?.active ? `${s.merch.sold || 0} sold · ${s.merch.stock} units left` : s.merch ? `${s.merch.sold || 0} sold · ${fmtMoney(s.merch.revenue || 0)} revenue` : 'Plan a collection';
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
        <select value={city} onChange={(e) => setCity(e.target.value)}>{cities.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}, {fmtNum(p.fanHeat[c.id] || 0)} fans{c.id === p.city ? ' (home)' : ''}</option>)}</select>
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

function Tours({ page = 'tours' }) {
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
  const pageCopy = { 'tour-routes': ['ROUTE BOOK', 'City routing and demand', 'Choose cities and book the itinerary in the overview. Each stop resolves on the existing weekly schedule.'], 'tour-crew': ['ROAD CREW', 'Support the show on the road', 'Crew improves show quality and affects weekly operating costs. Choose crew in the tour planner before booking.'], 'tour-shows': ['SHOW LEDGER', 'Tour settlement history', 'Completed stops, ticket sales and gross are recorded in your tour ledger as the single weekly tick advances.'] }[page];
  if (pageCopy) return <div className="col"><div className="card tight" style={{ background: 'linear-gradient(135deg, rgba(45,212,191,.18), rgba(14,17,22,.96) 60%), radial-gradient(circle at 85% 20%, rgba(235,112,74,.28), transparent 35%)' }}><Mono>{pageCopy[0]}</Mono><div className="head mt8">{pageCopy[1]}</div><div className="tiny muted mt8">{pageCopy[2]}</div></div>{t ? <div className="card tight"><div className="row between"><Mono>{t.name || 'ACTIVE TOUR'}</Mono><span className="chip sm">{t.stops.filter((x) => x.done).length}/{t.stops.length} played</span></div>{t.stops.map((x,i) => <div className="list-item" key={`${x.cityId}-${i}`}><span className="num">{i+1}</span><div className="grow small">{cityById(x.cityId).flag} {cityById(x.cityId).name}<div className="tiny muted">Week {x.week} · {x.done ? `${fmtNum(x.sold)} tickets · ${fmtMoney(x.gross)}` : 'upcoming'}</div></div></div>)}</div> : <div className="card tight"><div className="tiny muted">No active run. Book a route in the tour overview to start a persistent multi-week campaign.</div></div>}</div>;
  if (t) {
    const v = VENUES.find((x) => x.id === t.venueId);
    return (
      <div className="col">
        <div className="card tight"><Mono>{t.name || 'On tour'} · {v.name}s</Mono><div className="small muted mt8">{t.reserve} energy reserved each week · {fmtMoney(t.gross)} your cut so far · {t.sellouts} sell-outs · show {t.showQuality ?? '-'}/100</div>{t.staff?.length ? <div className="tiny muted mt8">Crew: {t.staff.map((id) => TOUR_STAFF.find((x) => x.id === id)?.name).join(', ')} · {fmtMoney(tourStaffCost(t.staff, t.venueId))}/week</div> : null}</div>
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
      <div className="row between"><Mono>Shows per week</Mono><div className="seg fit">{[1, 2, 3].map((n) => <button key={n} className={perWeek === n ? 'on' : ''} onClick={() => setPerWeek(n)}>{n}</button>)}</div></div>
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

function Labels({ page = 'labels' }) {
  const { state, act, go } = useGame();
  const p = state.player;
  const tab = ({ labels: 'independent', 'label-independent': 'independent', 'label-distribution': 'distribution', 'label-deals': 'labels', 'label-imprint': 'imprint' })[page] || (p.label ? 'contract' : 'independent');
  const [ownName, setOwnName] = useState(state.ownLabel?.logo?.name || state.ownLabel?.name || `${p.stageName} Records`);
  const [releaseBudget, setReleaseBudget] = useState('lean');
  const [brandTagline, setBrandTagline] = useState(state.ownLabel?.logo?.tagline || '');
  const [brandSymbol, setBrandSymbol] = useState(state.ownLabel?.logo?.symbol || 'star');
  const [brandHue, setBrandHue] = useState(state.ownLabel?.logo?.hue ?? 160);
  const [brandShape, setBrandShape] = useState(state.ownLabel?.logo?.shape ?? 0);
  const c = p.label;
  const lbl = c && labelById(c.id);
  const pending = state.inbox.filter((m) => m.subtype === 'label' && !m.status);
  return (
    <div className="col">
      <div className="card tight" style={{ background: 'linear-gradient(135deg, rgba(45,212,191,.18), rgba(14,17,22,.96) 56%), radial-gradient(circle at 86% 15%, rgba(199,144,87,.42), transparent 35%)', minHeight: 96 }}><Mono>CAREER PATHS · MASTERS FIRST</Mono><div className="head mt8">Choose your leverage, keep your options open</div><div className="tiny muted mt8">Independent is the starting point. Distribution, label deals and your own imprint are separate paths, not a forced choice.</div></div>
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
      {tab === 'independent' && (
        <div className="col">
          <div className="grid2">
            {[['OWN YOUR MASTERS','Independent','No contract. Full master ownership.'],['DISTRIBUTION','Reach without signing','Optional service, fees and cuts vary.'],['LABEL DEAL','Advance and infrastructure','Meetings and negotiated terms in the inbox.'],['FOUNDER','Build an imprint','Scout, sign and develop your own roster.']].map(([eyebrow,title,desc],i) => <div className="card tight" key={title} style={{ minHeight: 108, background: `linear-gradient(145deg, hsla(${[174,210,34,285][i]},72%,48%,.24), rgba(14,17,22,.96) 64%), radial-gradient(circle at 90% 0%, hsla(${[174,210,34,285][i]},88%,70%,.4), transparent 42%)` }}><Mono>{eyebrow}</Mono><div className="head mt8">{title}</div><div className="tiny muted mt8">{desc}</div></div>)}
          </div>
          <div className="card tight" style={{ borderColor: 'rgba(45,212,191,.45)', background: 'linear-gradient(145deg, rgba(45,212,191,.12), rgba(20,20,27,.96) 58%)' }}>
            <Mono style={{ color: 'var(--teal)' }}>OWN YOUR MASTERS</Mono>
            <div className="head mt8" style={{ fontSize: 21 }}>Independent by default</div>
            <div className="tiny muted mt8">No major-label contract is active. Keep ownership and choose whether to use a distributor, ask labels for meetings, or build a label of your own and sign artists.</div>
            <div className="row gap6 wrap mt12"><span className="chip sm">Masters: yours</span><span className="chip sm">Deal: none</span><span className="chip sm">Distribution: {distributorById(state.distributor).name}</span></div>
          </div>
          <div className="small muted">Distribution is optional. Set it in the Distribution tab when you want its reach or terms. Taking a label deal is a separate choice in Labels.</div>
        </div>
      )}
      {tab === 'imprint' && (
        <div className="col">
          {state.ownLabel ? (
            <>
              <div className="label-identity card tight"><FeatureArt kind="label" name={state.ownLabel.name} id={state.ownLabel.logo?.hue || 'identity'} className="feature-art-wide" /><div className="label-identity-copy"><Mono>FOUNDER · WEEK {state.ownLabel.founded}</Mono><div className="head mt8" style={{ fontSize: 23 }}>{state.ownLabel.name}</div>
                <div className="tiny muted mt8">{state.ownLabel.artists.length}/6 signed artists · latest weekly net {fmtMoney(state.ownLabel.lastIncome || 0)}</div>
                <div className="grid2 mt12"><div className="stat"><Mono className="sm">Lifetime</Mono><div className="v">{fmtMoney(state.ownLabel.lifetime || 0)}</div></div><div className="stat"><Mono className="sm">Latest release income</Mono><div className="v">{fmtMoney(state.ownLabel.lastGross || 0)}</div></div></div></div></div>
              <div className="card tight"><Mono>IMPRINT IDENTITY</Mono><div className="row gap6 mt8 wrap"><input aria-label="Imprint name" value={ownName || state.ownLabel.logo?.name || state.ownLabel.name} maxLength={32} onChange={(e)=>setOwnName(e.target.value)} /><input aria-label="Imprint tagline" value={brandTagline} maxLength={48} placeholder="Tagline" onChange={(e)=>setBrandTagline(e.target.value)} /><select aria-label="Logo symbol" value={brandSymbol} onChange={(e)=>setBrandSymbol(e.target.value)}>{['star','wave','bolt','crown','disc'].map(x=><option key={x}>{x}</option>)}</select><label className="tiny muted">Shape <select aria-label="Logo shape" value={brandShape} onChange={e=>setBrandShape(Number(e.target.value))}>{['Roundel','Shield','Seal'].map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label><label className="tiny muted">Color <input aria-label="Logo color" type="range" min="0" max="359" value={brandHue} onChange={(e)=>setBrandHue(Number(e.target.value))} /></label></div><div className="mt12" style={{ display:'flex',alignItems:'center',gap:12,padding:14,border:`1px solid hsl(${brandHue} 70% 46%)`,borderRadius:brandShape===0?'50%':brandShape===1?'8px':'24px 24px 8px 8px',background:`linear-gradient(145deg,hsl(${brandHue} 60% 19%),#11141a)`,minHeight:76 }}><div aria-label={`${brandSymbol} logo mark`} style={{color:`hsl(${brandHue} 80% 65%)`,fontSize:30,fontWeight:800}}>{({star:'✦',wave:'〰',bolt:'ϟ',crown:'♛',disc:'◉'})[brandSymbol]}</div><div><b style={{color:`hsl(${brandHue} 75% 70%)`}}>{ownName || state.ownLabel.logo?.name || state.ownLabel.name}</b><div className="tiny muted">{brandTagline || 'Imprint tagline'}</div></div></div><button className="btn sm accent mt8" onClick={()=>act(updateOwnLabelBrand,{name:ownName||state.ownLabel.name,tagline:brandTagline,symbol:brandSymbol,hue:brandHue,shape:brandShape})}>Save identity</button></div>
              <div className="row between"><Mono>Roster</Mono><button className="btn sm accent" disabled={state.ownLabel.lastScout === state.week || p.energy < 10 || p.cash < 5000} onClick={() => act(scoutTalent)}>Scout artists · $5K · 10 energy</button></div>
              {state.ownLabel.artists.length ? state.ownLabel.artists.map((artist) => <div className="card tight" key={artist.id}>
                <div className="row between gap6"><b>{artist.name}</b><span className="chip sm">{genreName(artist.genre)}</span></div><div className="tiny muted mt8">{cityById(artist.city).name} · talent {artist.talent} · {fmtNum(artist.ml)} monthly listeners · {artist.releases} releases · mood {artist.mood}</div>
                <div className="row gap6 wrap mt12"><select aria-label={`Campaign budget for ${artist.name}`} value={releaseBudget} onChange={(e) => setReleaseBudget(e.target.value)}>{LABEL_BUDGETS.map((b) => <option key={b.id} value={b.id}>{b.name} · {fmtMoney(b.cost)}</option>)}</select><button className="btn sm accent" disabled={p.cash < LABEL_BUDGETS.find((b) => b.id === releaseBudget)?.cost || (artist.lastRelease != null && state.week - artist.lastRelease < 6)} onClick={() => act(releaseLabelSingle, { artistId: artist.id, budget: releaseBudget })}>Release single</button><button className="btn sm" onClick={() => act(dropLabelArtist, { id: artist.id })}>Drop</button></div>
                {(artist.songs || []).slice(0, 2).map((song) => <div className="tiny muted mt8" key={`${song.title}-${song.week}`}>“{song.title}” · week {song.week} · quality {song.q} · {fmtNum(song.first)} first-week streams</div>)}
              </div>) : <Empty icon="users">No artists signed yet. Scout prospects to start building the roster.</Empty>}
              {state.ownLabel.prospects?.length > 0 && <><Mono>SCOUT REPORTS</Mono>{state.ownLabel.prospects.map((prospect) => <div className="card tight" key={prospect.id}>
                <div className="row between gap6"><b>{prospect.name}</b><span className="chip sm">{genreName(prospect.genre)}</span></div><div className="tiny muted mt8">{cityById(prospect.city).name} · talent {prospect.talent} · {fmtNum(prospect.ml)} listeners · advance {fmtMoney(prospect.advance)}</div><div className="mt8"><Bar pct={prospect.talent / 100} color="#2DD4BF" /></div><button className="btn sm accent mt12" disabled={p.cash < prospect.advance || state.ownLabel.artists.length >= 6} onClick={() => act(signProspect, { id: prospect.id })}>Sign artist · {fmtMoney(prospect.advance)}</button>
              </div>)}</>}
              <Mono>BUILD THE TEAM</Mono>{LABEL_STAFF.map((role) => <div className="card tight row between gap6" key={role.id}><div><b className="small">{role.name}</b><div className="tiny muted">{role.desc} · {fmtMoney(role.salary)}/week</div></div><button className={`btn sm ${state.ownLabel.staff?.[role.id] ? '' : 'accent'}`} onClick={() => act(setLabelStaff, { role: role.id, hire: !state.ownLabel.staff?.[role.id] })}>{state.ownLabel.staff?.[role.id] ? 'Dismiss' : 'Hire'}</button></div>)}
              {(state.ownLabel.releases || []).length > 0 && <div className="card tight"><Mono>RELEASE HISTORY</Mono>{state.ownLabel.releases.slice(0, 8).map((r, i) => <div className="list-item" key={`${r.artist}-${r.week}-${i}`}><div className="grow"><b className="small">“{r.title}” · {r.artist}</b><div className="tiny muted">Week {r.week} · quality {r.q} · {fmtNum(r.first)} first-week streams</div></div></div>)}</div>}
            </>
          ) : (
            <div className="card tight" style={{ background: 'linear-gradient(145deg, rgba(45,212,191,.14), rgba(20,20,27,.96) 65%)' }}>
              <Mono>START AN IMPRINT</Mono><div className="head mt8" style={{ fontSize: 21 }}>Build beyond your own career</div><div className="tiny muted mt8">Your own label operates alongside your independent artist career. Scout unsigned talent, pay advances, release music and manage staff. Operating costs and artist income settle in the normal weekly tick.</div>
              <div className="grid2 mt12"><div className="stat"><Mono className="sm">Founding cost</Mono><div className="v">{fmtMoney(LABEL_STARTUP)}</div></div><div className="stat"><Mono className="sm">Popularity required</Mono><div className="v">40+</div></div></div>
              <label className="tiny muted mt12" htmlFor="own-label-name">Label name</label><input id="own-label-name" value={ownName} maxLength={32} onChange={(e) => setOwnName(e.target.value)} placeholder="Name your label" />
              {p.popularity < 40 && <div className="tiny muted mt8">Reach popularity 40 to qualify. Current: {p.popularity}.</div>}
              {p.cash < LABEL_STARTUP && <div className="tiny muted mt8">You need {fmtMoney(LABEL_STARTUP - p.cash)} more to cover startup.</div>}
              <button className="btn accent block mt12" disabled={p.popularity < 40 || p.cash < LABEL_STARTUP || !ownName.trim()} onClick={() => act(createOwnLabel, { name: ownName })}>Found label · {fmtMoney(LABEL_STARTUP)}</button>
            </div>
          )}
        </div>
      )}
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

function Acting({ page = 'acting' }) {
  const { state, act } = useGame();
  const p = state.player;
  const a = state.acting || { credits: [], current: null, auditions: [], boxOffice: [] };
  const [bioDraft, setBioDraft] = useState(a.bio || `${p.stageName} is building a screen career in the Treblr world.`);
  const [selectedTitleId, setSelectedTitleId] = useState(null);
  const credits = a.credits || [];
  const ledger = a.boxOffice || [];
  const selected = selectedTitleId ? credits.find(x => x.id === selectedTitleId) : null;
  const selectedLedger = selectedTitleId ? ledger.find(x => x.id === selectedTitleId) : null;
  const title = selected || selectedLedger;
  const profile = <div className="feature-profile card tight"><FeatureArt kind="film" name={p.stageName} id="profile" className="feature-art-wide" /><div className="film-profile-copy"><Mono>SCREEN PROFILE · FICTIONAL IN-GAME</Mono><div className="head mt8">{p.stageName}</div><div className="tiny muted mt8">{credits.length} credits · acting {Math.round(p.skills.acting || 0)} · popularity {p.popularity}</div><label className="tiny muted mt8" htmlFor="actor-bio">Biography · max 320 characters</label><textarea id="actor-bio" aria-label="Actor biography" rows="3" maxLength={320} value={bioDraft} onChange={e => setBioDraft(e.target.value)} /><button className="btn sm accent mt8" onClick={() => act(updateActingBio, { bio: bioDraft })}>Save biography</button><div className="tiny muted mt8">This is Treblr game data, not a real IMDb profile or external credits.</div></div></div>;
  const auditions = <div className="col"><div className="card tight"><Mono>CASTING CALLS</Mono><div className="tiny muted mt8">Audition outcomes are fictional game results. A booked role films through the regular weekly simulation.</div></div>{(a.auditions || []).slice(0, 8).map((x, i) => <div className="list-item" key={`${x.week}-${x.roleId}-${i}`}><span className="num">W{x.week}</span><div className="grow"><b className="small">{x.role}</b><div className="tiny muted">{x.odds}% in-game odds · {x.booked ? 'booked' : 'not selected'}</div></div></div>)}{ACTING_ROLES.map(r => { const odds = auditionOdds(state, r), locked = p.popularity < r.minPop; return <div className="card tight audition-card" key={r.id}><FeatureArt kind="film" name={r.name} id={r.id} className="feature-art-wide"/><div className="audition-copy"><div className="row between"><b>{r.name}</b><span className="up">{fmtMoney(r.pay)}</span></div><div className="tiny muted mt8">{r.shoot} filming weeks · {locked ? `requires popularity ${r.minPop}` : `${Math.round(odds * 100)}% casting odds`}</div><button className="btn sm accent mt12" disabled={locked || !!a.current || p.energy < 10 || a.lastAudition === state.week} onClick={() => act(audition, { roleId: r.id })}>Audition · 10 energy</button></div></div>; })}</div>;
  const creditsView = <div className="col"><div className="card tight"><Mono>IN-GAME BOX OFFICE · SIMULATED</Mono>{ledger.length ? ledger.map(x => <button type="button" onClick={() => setSelectedTitleId(x.id)} key={x.id} className="list-item" style={{ width: '100%', textAlign: 'left' }}><b>{x.title}</b><span className="tiny muted">{fmtMoney(x.cumulative || x.gross)} cumulative · {fmtMoney(x.weekly || 0)} this week · {x.verdict}</span></button>) : <div className="tiny muted mt8">Ledger appears after your first premiere.</div>}</div><div className="card tight"><Mono>SCREEN CREDITS</Mono>{credits.length ? credits.map(x => <button type="button" key={x.id} className="list-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSelectedTitleId(x.id)}><b>“{x.title}”</b><span className="tiny muted">{x.role} · {x.verdict} · {x.score}/100</span></button>) : <div className="tiny muted mt8">Completed titles and their detail pages appear here.</div>}</div>{title && <div className="card tight" role="region" aria-label={`${title.title} title detail`}><Mono>TITLE DETAIL · FICTIONAL GAME RESULT</Mono><div className="head mt8">“{title.title}”</div><div className="tiny muted mt8">{title.medium || 'film'} · {title.role || 'screen role'} · week {title.week || title.releaseWeek} · score {title.score}/100 · {title.verdict}</div><div className="grid2 mt12"><div className="stat"><Mono className="sm">Opening</Mono><div className="v">{fmtMoney(selectedLedger?.openingGross || selectedLedger?.gross || title.gross || 0)}</div></div><div className="stat"><Mono className="sm">Cumulative</Mono><div className="v">{fmtMoney(selectedLedger?.cumulative || selectedLedger?.gross || title.gross || 0)}</div></div></div><div className="tiny muted mt8">Weekly run: {fmtMoney(selectedLedger?.weekly || 0)}. Simulated only, not real-world box-office or IMDb data.</div></div>}</div>;
  if (page === 'acting-auditions') return auditions;
  if (page === 'acting-credits') return creditsView;
  return <div className="col">{profile}{a.current && <div className="card tight"><Mono>CURRENT PROJECT</Mono><div className="head mt8">“{a.current.title}”</div><div className="tiny muted">{ACTING_ROLES.find(r => r.id === a.current.roleId)?.name} · filmed {a.current.shot}/{a.current.shootWeeks} weeks · premiere week {a.current.releaseWeek}</div></div>}{creditsView}</div>;
}

function Festivals({ page = 'festivals' }) {
  const { state, act, openArtist } = useGame();
  const p = state.player;
  const list = festivalCalendar(state, 30);
  const [poster, setPoster] = useState(null);
  const f = poster && list.find((x) => x.key === poster);
  const selectedList = page === 'festival-pitches' ? list.filter(x => x.pitchOpen || x.state?.pitched) : page === 'festival-lineups' ? list.filter(x => state.week >= x.lineupWeek) : list;
  return (
    <div className="col">
      <div className="small muted">Pitch yourself 7–16 weeks before a festival. Lineups drop 6 weeks out, that’s when you find out. Your likely slot today: <b>{festSlotFor(state) || 'not yet (popularity 28+)'}</b>.</div>
      {selectedList.map((x) => {
        const st = x.state || {};
        const announced = state.week >= x.lineupWeek;
        return (
          <div key={x.key} className="card tight festival-card">
            <FeatureArt kind="festival" name={x.name} id={x.id} className="feature-art-wide" />
            {announced && <div className="festival-lineup-strip" aria-label={`${x.name} lineup artists`}>{(() => { const lineup = festivalLineup(state, x, x.key); return [...lineup.headliner,...lineup.sub,...lineup.undercard].slice(0,6).map((id) => { const rival=state.rivals.find(r=>r.id===id); return rival ? <ArtistAvatar key={id} rival={rival} size={38} onClick={() => openArtist(id)} /> : null; }); })()}</div>}
            <div className="festival-card-copy">
            <div className="row between gap6"><b className="ellipsis">{x.name}</b><span className="chip sm" style={{ flexShrink: 0 }}>{x.size === 'mega' ? 'Mega' : 'Major'}</span></div>
            <div className="tiny muted mt8">{cityById(x.city).flag} {cityById(x.city).name} · week {x.festWeek} ({formatWeekDate(x.festWeek, { month: 'short', day: 'numeric' })}) · {x.genres.length ? x.genres.map(genreName).join(', ') : 'all genres'}</div>
            <div className="tiny mt8">{st.played ? `Played: ${fmtNum(st.played.crowd)} crowd · ${fmtMoney(st.played.fee)}` : announced ? (st.accepted ? `✅ You’re on the lineup (${st.slot})` : st.pitched ? '❌ Not this year' : 'Lineup announced') : st.pitched ? `Pitched · lineup drops week ${x.lineupWeek}` : x.pitchOpen ? 'Taking pitches now' : `Pitches open week ${x.festWeek - 16}`}</div>
            <div className="row gap6 mt12">
              {!st.pitched && x.pitchOpen && <button className="btn sm accent" disabled={p.socialEnergy < 5} onClick={() => act(pitchFestival, { key: x.key })}>Pitch · 5 social</button>}
              {announced && <button className="btn sm" onClick={() => setPoster(x.key)}>Lineup poster</button>}
            </div>
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
        <div className="festival-hero-art"><FeatureArt kind="festival" name={f.name} id={f.id} className="feature-art-poster" /></div>
        <div className="fest-name">{f.name}</div>
        <div className="fest-when">{cityById(f.city).name} · {formatWeekDate(f.festWeek, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div className="fest-head">{tier(lu.headliner, 'headliner').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-sub">{tier(lu.sub, 'sub').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-under">{tier(lu.undercard, 'undercard').map((n) => <span key={n} className={n === me ? 'me' : ''}>{n}</span>)}</div>
        <div className="fest-art row gap6">{[...lu.headliner,...lu.sub,...lu.undercard].slice(0, 8).map((id) => { const r = state.rivals.find((x) => x.id === id); return r ? <ArtistAvatar key={id} rival={r} size={44} onClick={() => onArtist(id)} /> : null; })}</div>
      </div>
    </div>
  );
}

function Lifestyle({ page = 'lifestyle' }) {
  const { state, act } = useGame();
  const p = state.player;
  const ls = state.lifestyle || { owned: [], rental: null };
  const kinds = [['rental', 'Rent a place'], ['home', 'Buy a home'], ['car', 'Cars'], ['jewelry', 'Jewellery'], ['art', 'Art'], ['studio', 'Home studio'], ['jet', 'Private jet']];
  const filtered = page === 'lifestyle-property' ? ['rental','home','art','studio'] : page === 'lifestyle-vehicles' ? ['car','jet'] : null;
  return (
    <div className="col">
      <div className="card tight"><div className="row between small"><span>Assets</span><b>{fmtMoney(assetsValue(state))}</b></div><div className="row between small mt8"><span className="muted">Weekly upkeep & rent extras</span><span>{fmtMoney(lifestyleUpkeep(JSON.parse(JSON.stringify(state))))}</span></div><div className="tiny muted mt8">Big purchases lift your image (and hype); flexing too early can annoy fans. Homes and art can gain value; cars lose it. Sell anytime.</div></div>
      {ls.owned.length > 0 && <div className="card tight"><Mono>Owned</Mono>{ls.owned.map((o) => { const it = lifestyleById(o.id); return <div key={o.uid} className="list-item"><div className="grow" style={{ minWidth: 0 }}><b className="small ellipsis" style={{ display: 'block' }}>{it?.name}</b><div className="tiny muted">Worth {fmtMoney(o.value)} · bought for {fmtMoney(o.price)}</div></div><button className="btn sm" onClick={() => act(sellLifestyle, { uid: o.uid })}>Sell</button></div>; })}</div>}
      {ls.rental && <div className="card tight row between"><span className="small">Living in: <b>{lifestyleById(ls.rental)?.name}</b></span><button className="btn sm" onClick={() => act(moveOutRental)}>Move out</button></div>}
      {kinds.filter(([k]) => !filtered || filtered.includes(k)).map(([k, label]) => (
        <div key={k}>
          <Mono className="sm">{label}</Mono>
          {LIFESTYLE.filter((x) => x.kind === k).map((it) => (
            <div key={it.id} className={`card tight mt8 lifestyle-card ${it.kind}`}>
              <FeatureArt kind={it.kind === 'car' ? 'car' : 'home'} name={it.name} id={it.id} className="feature-art-wide" />
              <div className="lifestyle-card-copy">
                <div className="row between gap6"><b className="small">{it.name}</b><span className="small" style={{ flexShrink: 0 }}>{it.price ? fmtMoney(it.price) : `${fmtMoney(it.weekly)}/wk`}</span></div>
                <div className="tiny muted mt8">{it.desc}{it.price && it.weekly ? ` · upkeep ${fmtMoney(it.weekly)}/wk` : ''}</div>
                <button className="btn sm accent mt8" disabled={it.price ? p.cash < it.price : ls.rental === it.id || p.cash < it.weekly * 4} onClick={() => act(buyLifestyle, { id: it.id })}>{it.kind === 'rental' ? (ls.rental === it.id ? 'Living here' : 'Move in') : 'Buy'}</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Merch({ page = 'merch' }) {
  const { state, act } = useGame();
  const m = state.merch;
  const tier = m && MERCH_TIERS.find((x) => x.id === m.tier);
  const soldPct = tier ? Math.min(1, (m.sold || 0) / tier.units) : 0;
  if (page === 'merch-products') return <div className="col"><div className="card tight" style={{ background: 'linear-gradient(145deg, rgba(199,144,87,.32), rgba(18,18,24,.95) 68%), radial-gradient(circle at 90% 10%, rgba(45,212,191,.34), transparent 38%)' }}><Mono>MERCH STUDIO</Mono><div className="head mt8">Design the next drop</div><div className="tiny muted mt8">Choose a production tier. Funding launches it immediately, then inventory and sales settle in the weekly tick.</div></div>{MERCH_TIERS.map(t => <div className="card tight" key={t.id}><div className="row between"><b>{t.name}</b><b>{fmtMoney(t.cost)}</b></div><div className="tiny muted mt8">{fmtNum(t.units)} units · {fmtMoney(t.price)} each · break-even {Math.ceil(t.cost/t.price)} units</div><button className="btn sm accent mt12" disabled={m?.active || state.player.cash < t.cost} onClick={() => act(dropMerch,{tier:t.id})}>{m?.active?'Current drop must close first':'Fund this collection'}</button></div>)}</div>;
  if (page === 'merch-sales') return <div className="col"><div className="card tight"><Mono>SELL-THROUGH REPORT</Mono><div className="grid2 mt12"><div className="stat"><Mono className="sm">Units sold</Mono><div className="v">{fmtNum(m?.sold||0)}</div></div><div className="stat"><Mono className="sm">Revenue</Mono><div className="v">{fmtMoney(m?.revenue||0)}</div></div></div>{m&&<><div className="mt12"><Bar pct={soldPct} color="#2DD4BF"/></div><div className="tiny muted mt8">{fmtNum(m.stock||0)} units left · {m.active?'active drop':'drop closed'}</div></>}</div><div className="card tight"><Mono>WEEKLY SETTLEMENT</Mono><div className="tiny muted mt8">Sales are automatically computed in the existing weekly tick. No separate timer or duplicate settlement was added.</div></div></div>;
  return (
    <div className="col">
      <div className="card tight">
        <div className="row between"><Mono>MERCH OPERATIONS</Mono><span className={`chip sm ${m?.active ? 'up' : ''}`}>{m?.active ? 'SELLING' : m ? 'CLOSED' : 'NO DROP'}</span></div>
        <div className="grid2 mt12"><div className="stat"><Mono className="sm">Lifetime units</Mono><div className="v">{fmtNum(m?.sold || 0)}</div></div><div className="stat"><Mono className="sm">Drop revenue</Mono><div className="v">{fmtMoney(m?.revenue || 0)}</div></div></div>
        {m && <><div className="row between small mt12"><b>{tier?.name || 'Legacy drop'}</b><span>{m.sold || 0} sold · {m.stock || 0} remain</span></div><div className="mt8"><Bar pct={soldPct} color="#2DD4BF" /></div><div className="tiny muted mt8">Unit price {fmtMoney(m.price || 0)} · launched week {m.launchedWeek || 'unknown'}{m.soldOutWeek ? ` · sold out week ${m.soldOutWeek}` : ''}</div><div className="tiny muted mt8">Sales resolve in the weekly tick from fanbase and hype. The active drop locks production until it sells out.</div></>}
      </div>
      <div className="section-head"><h3>{m?.active ? 'Next drop queue' : 'Production desk'}</h3></div>
      {MERCH_TIERS.map((t) => (
        <div key={t.id} className="card tight">
          <div className="row between"><b>{t.name}</b><span className="small">{fmtMoney(t.cost)} production</span></div>
          <div className="tiny muted mt8">{fmtNum(t.units)} units at {fmtMoney(t.price)} each · break-even at {Math.ceil(t.cost / t.price)} units sold</div>
          <div className="tiny muted mt8">Expected weekly sales: about {fmtNum(Math.min(t.units, Math.round(state.player.fans * 0.004 + state.player.hype * 2)))} units at your current fans and hype.</div>
          <button className="btn sm accent mt12" disabled={m?.active || state.player.cash < t.cost} onClick={() => act(dropMerch, { tier: t.id })}>{m?.active ? 'Current drop must close first' : state.player.cash < t.cost ? 'Insufficient cash' : 'Fund and launch drop'}</button>
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

function Awards({ page = 'awards' }) {
  const { state, go } = useGame();
  const shows = [...AWARD_SHOWS, ...ACTING_AWARD_SHOWS];
  const calendar = awardCalendar(state, shows, 104);
  const history = [...(state.awardHistory || []), ...(state.acting?.awardHistory || [])].sort((a, b) => (b.week || 0) - (a.week || 0));
  const current = state.awardEvent;
  const sub = state.awardSubmission;
  if (page === 'award-submissions') return <div className="col"><div className="award-hero card tight"><FeatureArt kind="award" name="Awards" id="submissions" className="award-art" /><div className="award-copy"><Mono>AWARD ENTRY ROOM</Mono><div className="head mt8">Submissions</div><div className="tiny muted mt8">Choose eligible releases through the existing submission flow. Entries and ceremony results remain in your save.</div></div></div>{sub?<div className="card tight"><b>{sub.show}</b><div className="tiny muted mt8">Ceremony week {sub.showWeek} · {sub.picks?.length||sub.suggested?.length||0} entries · {sub.status}</div><button className="btn sm accent mt12" onClick={()=>go({submissions:true})}>{sub.status==='confirmed'?'Review entries':'Choose entries'}</button></div>:<div className="card tight tiny muted">No submission window is open right now. Check the season calendar for upcoming eligibility.</div>}{calendar.map(x=><div className="list-item" key={`${x.name}-${x.showWeek}`}><div className="grow"><b className="small">{x.name}</b><div className="tiny muted">Week {x.showWeek} · {x.open?'submissions open':x.showWeek<state.week?'passed':`opens ${x.opens}`}</div></div></div>)}</div>;
  if (page === 'award-results') return <div className="col"><div className="award-hero card tight"><FeatureArt kind="award" name="Season results" id="archive" className="award-art" /><div className="award-copy"><Mono>THE ARCHIVE</Mono><div className="head mt8">Season results</div><div className="tiny muted mt8">Wins and nominations persist across seasons.</div></div></div>{history.length?history.map((a,i)=><div className="card tight award-history" key={a.id||`${a.show}-${a.week}-${i}`}><FeatureArt kind="award" name={a.show} id={a.id||i} className="award-art" /><div><div className="row between"><b>{a.show} · {a.year}</b><span className={`chip sm ${a.result==='won'?'up':''}`}>{a.result}</span></div><div className="tiny muted mt8">{(a.entries||[]).join(', ')||'No submitted entries'} · week {a.week}</div></div></div>):<div className="card tight tiny muted">No results recorded yet. Results appear after the scheduled ceremony.</div>}</div>;
  return <div className="col">
    {current && <button className="card tight press award-live" style={{ textAlign: 'left', borderColor: 'rgba(255,176,32,.55)' }} onClick={() => go({ awards: true })}><FeatureArt kind="award" name={current.show} id={current.id} className="award-live-art" /><div><Mono>Live ceremony</Mono><div className="head mt8">{current.show}</div><div className="tiny muted mt8">{current.status === 'pending' ? 'Your result is ready to reveal.' : current.status === 'won' ? 'You have an award to claim.' : 'Ceremony complete.'}</div><span className="btn sm primary mt12">Open ceremony</span></div></button>}
    {sub && <button className="card tight press" style={{ textAlign: 'left' }} onClick={() => go({ submissions: true })}><Mono>Submissions {sub.status === 'confirmed' ? 'submitted' : 'need your review'}</Mono><div className="head mt8">{sub.show}</div><div className="tiny muted mt8">Ceremony week {sub.showWeek} · {sub.picks?.length || sub.suggested?.length || 0} selected</div><span className="btn sm accent mt12">{sub.status === 'confirmed' ? 'Review entries' : 'Choose entries'}</span></button>}
    <div className="card tight"><Mono>Season calendar</Mono>{calendar.map((x) => <div key={`${x.name}-${x.showWeek}`} className="list-item"><div className="grow"><b className="small">{x.name}</b><div className="tiny muted">Week {x.showWeek} · {x.open ? 'submissions open' : x.sub?.status === 'confirmed' ? 'entries submitted' : x.showWeek < state.week ? 'ceremony passed' : `submission window weeks ${x.opens} to ${x.closes}`}</div></div>{x.sub?.status === 'confirmed' && <span className="chip sm">Entered</span>}</div>)}</div>
    <div className="card tight"><Mono>Career record</Mono>{history.length ? history.map((a, i) => <div className="list-item" key={a.id || `${a.show}-${a.week}-${i}`}><div className="grow"><b className="small">{a.show} · {a.year}</b><div className="tiny muted">{a.entries?.length ? a.entries.join(', ') : 'No entries'}</div></div><span className={`chip sm ${a.result === 'won' ? 'up' : ''}`}>{a.result}</span></div>) : <div className="small muted mt8">No award results yet. Submissions and ceremony outcomes appear here as your career moves through the calendar.</div>}</div>
  </div>;
}

function Payola() {
  const { state, act } = useGame();
  const p = state.player;
  const songs = state.songs.filter((x) => x.status === 'released').sort((a, b) => b.releasedWeek - a.releasedWeek);
  const [song, setSong] = useState(songs[0]?.id);
  const banned = p.chartBanUntil && state.week <= p.chartBanUntil;
  return (
    <div className="col">
      <p className="muted" style={{ margin: 0 }}>Pay “consultants” for spins and streams. It works, millions of streams, but every deal raises suspicion. Above 30, any week can bring an exposé: an 8-week chart ban, 10% of your fans gone, hype wiped, and labels may drop you.</p>
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
