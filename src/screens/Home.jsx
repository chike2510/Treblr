import { useState } from 'react';
import {
  upNext, goalProgress, rewardText, calendarEvents, nearbyRivals, playerPositions, formatWeekDate, fmtNum,
  genreName, ROLLOUTS, rest, popularityFromListeners, weeklyGoalsView, weeklyRewardText, claimWeeklyGoal, spotlightReact,
  startEra, eraOf, ERA_COLORS, ERA_VIBES, VENUES, cityById, tierLabel,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, CountUp, Delta, Bar, Cover, SectionHead, AREA, ArtistAvatar } from '../ui/kit.jsx';
import { MagazineCover, ReportBody } from './Report.jsx';

const TONE = { studio: AREA.studio, phone: AREA.phone, world: AREA.world, danger: '#FF4D5E', warn: '#FFB020' };
const TONE_ICON = { studio: 'mic', phone: 'phone', world: 'globe', danger: 'cash', warn: 'moon' };

export default function Home() {
  const { state, go, act, openArtist, openOverlay } = useGame();
  const [issue, setIssue] = useState(false);
  const [allGoals, setAllGoals] = useState(false);
  const p = state.player;
  const rep = state.lastReport;
  const nudges = upNext(state);
  const goals = goalProgress(state);
  const openGoals = goals.filter((g) => !g.claimed);
  const shownGoals = allGoals ? goals : openGoals.slice(0, 3);
  const cal = calendarEvents(state, state.week, state.week + 5);
  const rivals = nearbyRivals(state, 3);
  const positions = playerPositions(state);
  const era = state.releases.find((r) => r.status === 'out') || state.releases.find((r) => r.status === 'scheduled');
  const curEra = eraOf(state);
  const [eraOpen, setEraOpen] = useState(false);
  const latestWrapped = state.wrapped?.[state.wrapped.length - 1];
  const news = state.news.slice(0, 5);

  const headline = rep?.headline || `${p.stageName}: The Making of a Star`;
  const lines = [
    { k: 'LISTENERS', v: fmtNum(p.monthlyListeners) },
    positions[0] ? { k: 'CHARTING', v: `#${positions[0].r} ${positions[0].chartName}` } : { k: 'GENRE', v: genreName(p.genre) },
    { k: 'HYPE', v: `${Math.round(p.hype)}/100` },
  ];

  return (
    <div className="screen">
      <div style={curEra ? { '--lime': curEra.color } : undefined} className={curEra ? 'era-hero' : ''}>
        <MagazineCover player={p} week={state.week} headline={headline} lines={lines} onRead={() => setIssue(true)} kicker={curEra ? `THE ${curEra.name.toUpperCase()} ERA` : rep ? `WEEK ${rep.week} REPORT` : 'DEBUT ISSUE'} />
      </div>

      <Alerts onCrisis={() => openOverlay('crisis')} onAwards={() => openOverlay('awards')} onWrapped={(y) => openOverlay({ wrapped: y })} latestWrapped={latestWrapped} />

      <div className="stat-strip">
        <Stat label="Listeners" value={p.monthlyListeners} delta={rep?.mlDelta} />
        <Stat label="Fans" value={p.fans} delta={rep?.fansDelta} />
        <Stat label="Popularity" value={p.popularity} delta={rep?.popDelta} raw />
        <Stat label="Cash" value={p.cash} delta={rep?.net} money />
      </div>
      <div className="row mt8 gap6">
        <EnergyBar label="Energy" v={p.energy} max={p.maxEnergy} color="#C6FF3D" />
        <EnergyBar label="Social" v={p.socialEnergy} max={p.maxSocial} color="#6C7BFF" />
      </div>
      <div className="row mt8 gap6">
        <div className="card tight grow streak" style={{ padding: '8px 12px' }}>
          <div className="row between"><Mono className="sm">Chart streak</Mono><Icon name="flame" size={16} color={p.chartStreak ? '#FFB020' : '#5d5d68'} /></div>
          <div className="row between mt8"><span className="num" style={{ fontSize: 20 }}>{p.chartStreak || 0}<small className="tiny muted"> wk</small></span><span className="tiny muted">Best {p.bestStreak || 0}</span></div>
        </div>
        <div className="card tight grow" style={{ padding: '8px 12px' }}>
          <div className="row between"><Mono className="sm">Burnout</Mono><span className="num small" style={{ color: p.burnout >= 40 ? '#FFB020' : undefined }}>{Math.round(p.burnout || 0)}</span></div>
          <div className="mt8"><Bar pct={(p.burnout || 0) / 100} color={p.burnout >= 60 ? '#FF4D5E' : '#FFB020'} /></div>
          <div className="tiny muted mt8">{p.burnout >= 40 ? `Energy cap ${p.maxEnergy}. Rest!` : 'Ending weeks drained raises it.'}</div>
        </div>
      </div>

      <WeeklyGoals />
      {state.tour && <TourCard />}
      {state.spotlight && !state.spotlight.resolved && <Spotlight sp={state.spotlight} onOpen={openArtist} onPick={(choice) => act(spotlightReact, { choice })} />}

      <div className="section">
        <SectionHead title="Up next" />
        <div className="col">
          {nudges.map((n) => (
            <button key={n.id} className="card tight press nudge" style={{ textAlign: 'left' }} onClick={() => go(n.to)}>
              <div className="dot" style={{ background: `${TONE[n.tone]}22`, color: TONE[n.tone] }}><Icon name={TONE_ICON[n.tone]} size={20} /></div>
              <div className="grow"><div style={{ fontWeight: 600 }}>{n.title}</div><div className="muted small ellipsis">{n.body}</div></div>
              <span className="chip sm" style={{ color: TONE[n.tone] }}>{n.cta}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <SectionHead title="Era" action={curEra ? 'New era' : 'Start one'} onAction={() => setEraOpen(true)} />
        {curEra ? (
          <button className="card press era-card" style={{ '--ec': curEra.color, width: '100%', textAlign: 'left' }} onClick={() => setEraOpen(true)}>
            <Mono className="sm" style={{ color: curEra.color }}>{ERA_VIBES.find((v) => v.id === curEra.vibe)?.name} era · since week {curEra.startWeek}</Mono>
            <div className="head" style={{ fontSize: 26, marginTop: 4 }}>{curEra.name}</div>
            <div className="tiny muted mt8">{state.releases.filter((r) => r.eraId === curEra.id).length} releases · covers, hero and accents wear this colour</div>
          </button>
        ) : (
          <button className="card press row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setEraOpen(true)}>
            <Icon name="palette" size={28} color="#C6FF3D" />
            <div className="grow"><div className="head">Start an era</div><div className="muted small">Name it, pick a colour and a vibe. Your Home and covers restyle around it.</div></div>
          </button>
        )}
      </div>

      <div className="section">
        <SectionHead title="Latest release" action={era ? 'Catalog' : 'Studio'} onAction={() => go({ tab: 'studio', section: era ? 'catalog' : 'write' })} />
        {era ? <EraCard era={era} /> : (
          <div className="card row">
            <Cover cover={{ gradient: 4 }} size={64} title="?" />
            <div className="grow"><div className="head">No era yet</div><div className="muted small">Your first release starts your first era.</div></div>
            <button className="btn sm accent" style={{ '--accent': AREA.studio }} onClick={() => go({ tab: 'studio', section: 'write' })}>Write</button>
          </div>
        )}
      </div>

      <div className="section">
        <SectionHead title="Goals" action={allGoals ? 'Less' : 'All'} onAction={() => setAllGoals(!allGoals)} />
        <div className="card">
          {shownGoals.map((g, i) => (
            <div key={g.id} className={i ? 'mt16' : ''}>
              <div className="row between small">
                <span className="row gap6" style={{ fontWeight: 600 }}>{g.claimed && <Icon name="check" size={16} color="#3DDC84" />}{g.name}</span>
                <span className="mono sm" style={{ color: g.claimed ? 'var(--green)' : undefined }}>{g.claimed ? 'Done' : rewardText(g.reward)}</span>
              </div>
              <div className="mt8"><Bar pct={g.pct} color={g.claimed ? '#3DDC84' : undefined} /></div>
            </div>
          ))}
          {!shownGoals.length && <div className="muted small">Every milestone unlocked. Legend status.</div>}
        </div>
      </div>

      <Timeline />

      <div className="section">
        <SectionHead title="Coming up" action="Calendar" onAction={() => go({ tab: 'phone', app: 'calendar' })} />
        <div className="cal-strip">
          {Array.from({ length: 6 }, (_, i) => state.week + i).map((w) => {
            const evs = cal.filter((e) => e.week === w);
            return (
              <div key={w} className={`cal-day ${w === state.week ? 'now' : ''}`}>
                <Mono className="sm" style={{ color: w === state.week ? 'var(--lime)' : undefined }}>{w === state.week ? 'This week' : `Week ${w}`}</Mono>
                <div className="tiny muted">{formatWeekDate(w, { month: 'short', day: 'numeric' })}</div>
                {evs.slice(0, 3).map((e, j) => <div key={j} className="cal-ev" style={{ borderLeft: `3px solid ${e.type === 'release' ? AREA.studio : e.type === 'award' ? AREA.charts : e.type === 'expiry' ? AREA.phone : AREA.world}` }}>{e.title}</div>)}
                {!evs.length && <div className="tiny faint">Open</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <SectionHead title="Rival watch" action="Charts" onAction={() => go({ tab: 'charts' })} />
        <div className="card">
          {rivals.map((r) => (
            <button key={r.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => openArtist(r.id)}>
              <ArtistAvatar rival={r} size={40} />
              <div className="grow">
                <div className="row gap6"><b className="ellipsis">{r.name}</b><span className="tiny muted">{genreName(r.genre)} · {r.country}</span></div>
                <div className="muted small ellipsis">{r.lastMove}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div className="num">{fmtNum(r.monthlyListeners)}</div><div className="mono sm">{tierLabel(r.tier)}</div></div>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <SectionHead title="Headlines" action="News" onAction={() => go({ tab: 'phone', app: 'news' })} />
        <div className="card">
          {news.length ? news.map((n, i) => (
            <div key={i} className="list-item" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 4, background: n.aboutPlayer ? 'var(--lime)' : 'var(--raised)' }} />
              <div className="grow"><Mono className="sm">{n.tag} · Week {n.week}</Mono><div style={{ fontWeight: 500, marginTop: 2 }}>{n.headline}</div></div>
            </div>
          )) : <div className="muted small">The press hasn't noticed you yet. Give them a reason.</div>}
        </div>
      </div>

      <div className="section">
        <SectionHead title="Quick actions" />
        <div className="quick">
          <button onClick={() => go({ tab: 'studio', section: 'write' })}><Icon name="pen" color={AREA.studio} />Write</button>
          <button onClick={() => go({ tab: 'studio', section: 'release' })}><Icon name="disc" color={AREA.studio} />Release</button>
          <button onClick={() => go({ tab: 'phone', app: 'chirp' })}><Icon name="send" color={AREA.phone} />Post</button>
          <button onClick={() => go({ tab: 'world', section: 'gigs' })}><Icon name="ticket" color={AREA.world} />Gig</button>
          <button onClick={() => act(rest)} disabled={p.rested} style={p.rested ? { opacity: 0.4 } : {}}><Icon name="moon" color="#C6FF3D" />Rest</button>
        </div>
      </div>

      {eraOpen && <EraSheet onClose={() => setEraOpen(false)} />}
      <Sheet open={issue} onClose={() => setIssue(false)} title={rep ? `Issue №${rep.week}` : 'Treblr Weekly'} sub={rep?.headline}>
        <ReportBody report={rep} state={state} />
      </Sheet>
    </div>
  );
}

function Stat({ label, value, delta, money, raw }) {
  return (
    <div className="stat">
      <Mono className="sm ellipsis">{label}</Mono>
      <div className="v">{raw ? <CountUp value={value} format={(v) => Math.round(v)} /> : <CountUp value={value} money={money} />}</div>
      <div className="d">{raw ? (delta ? <span className={delta > 0 ? 'up' : 'down'}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)}</span> : <span className="faint">—</span>) : <Delta v={delta} money={money} />}</div>
    </div>
  );
}

function EnergyBar({ label, v, max, color }) {
  return (
    <div className="card tight grow" style={{ padding: '8px 12px' }}>
      <div className="row between"><Mono className="sm">{label}</Mono><span className="num small">{v}/{max}</span></div>
      <div className="mt8"><Bar pct={v / max} color={color} /></div>
    </div>
  );
}

function EraCard({ era }) {
  const { state, go } = useGame();
  const songs = era.songIds.map((id) => state.songs.find((s) => s.id === id)).filter(Boolean);
  const weekly = songs.reduce((a, s) => a + (s.weeklyStreams || 0), 0);
  const life = songs.reduce((a, s) => a + (s.lifetimeStreams || 0), 0);
  const ids = new Set([era.id, ...era.songIds]);
  const chips = playerPositions(state).filter((x) => ids.has(x.id));
  const ro = ROLLOUTS.find((r) => r.id === era.rollout);
  const weeksOut = era.status === 'out' ? state.week - era.releaseWeek : 0;
  const progress = era.status === 'scheduled' ? Math.min(0.3, (state.week - era.announcedWeek + 1) / Math.max(1, era.releaseWeek - era.announcedWeek + 1) * 0.3) : Math.min(1, 0.3 + weeksOut / 12 * 0.7);
  return (
    <button className="card press" style={{ textAlign: 'left', width: '100%' }} onClick={() => go({ tab: 'studio', section: 'catalog' })}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Cover cover={era.cover} title={era.title} size={84} />
        <div className="grow">
          <Mono className="sm">{era.type.toUpperCase()} · {era.status === 'out' ? `Week ${weeksOut + 1} out` : `Drops week ${era.releaseWeek}`}</Mono>
          <div className="head ellipsis" style={{ fontSize: 20, marginTop: 2 }}>{era.title}</div>
          <div className="row gap16 mt8">
            <div><div className="num">{fmtNum(weekly)}</div><div className="mono sm">This week</div></div>
            <div><div className="num">{fmtNum(life)}</div><div className="mono sm">Lifetime</div></div>
          </div>
        </div>
      </div>
      {chips.length > 0 && <div className="row wrap gap6 mt12">{chips.slice(0, 6).map((c) => <span key={c.chartId + c.id} className="chip sm" style={{ color: 'var(--amber)' }}>#{c.r} {c.chartName}</span>)}</div>}
      <div className="row between mt12"><Mono className="sm">Rollout · {ro?.name}</Mono><Mono className="sm">{Math.round(progress * 100)}%</Mono></div>
      <div className="mt8"><Bar pct={progress} color={AREA.studio} /></div>
    </button>
  );
}


function Alerts({ onCrisis, onAwards, onWrapped, latestWrapped }) {
  const { state } = useGame();
  const a = state.awardEvent;
  const items = [];
  if (state.crisis) items.push({ k: 'crisis', icon: 'skull', color: '#FF4D5E', title: state.crisis.title, body: 'PR crisis — respond before it spreads.', cta: 'Respond', on: onCrisis });
  if (a && a.status === 'pending') items.push({ k: 'aw', icon: 'trophy', color: '#FFB020', title: `Nominated: ${a.category}`, body: `${a.show} is tonight. Walk the carpet.`, cta: 'Attend', on: onAwards });
  if (a && a.status === 'won') items.push({ k: 'aw2', icon: 'trophy', color: '#FFB020', title: 'You won! Speech time', body: a.show, cta: 'Speech', on: onAwards });
  if (latestWrapped && state.week - latestWrapped.week <= 3) items.push({ k: 'wr', icon: 'gift', color: '#3DDC84', title: `Year ${latestWrapped.year} Wrapped is ready`, body: `${fmtNum(latestWrapped.streams)} streams · ${latestWrapped.type.name}`, cta: 'Open', on: () => onWrapped(latestWrapped.year) });
  if (!items.length) return null;
  return (
    <div className="col mt12">
      {items.map((x) => (
        <button key={x.k} className="card tight press nudge alert" style={{ textAlign: 'left', borderColor: `${x.color}66` }} onClick={x.on}>
          <div className="dot" style={{ background: `${x.color}22`, color: x.color }}><Icon name={x.icon} size={20} /></div>
          <div className="grow"><div style={{ fontWeight: 600 }}>{x.title}</div><div className="muted small ellipsis">{x.body}</div></div>
          <span className="chip sm" style={{ color: x.color }}>{x.cta}</span>
        </button>
      ))}
    </div>
  );
}

function WeeklyGoals() {
  const { state, act } = useGame();
  const goals = weeklyGoalsView(state);
  if (!goals.length) return null;
  return (
    <div className="section">
      <SectionHead title={`This week’s goals`} />
      <div className="card">
        {goals.map((g, i) => (
          <div key={g.id} className={i ? 'mt16' : ''}>
            <div className="row between small">
              <span className="row gap6" style={{ fontWeight: 600 }}>{g.claimed && <Icon name="check" size={16} color="#3DDC84" />}{g.label}</span>
              {g.done && !g.claimed ? <button className="btn sm primary" onClick={() => act(claimWeeklyGoal, { id: g.id })}>Claim {weeklyRewardText(g.reward)}</button>
                : <span className="mono sm" style={{ color: g.claimed ? 'var(--green)' : undefined }}>{g.claimed ? 'Claimed' : weeklyRewardText(g.reward)}</span>}
            </div>
            <div className="row gap6 mt8"><div className="grow"><Bar pct={g.pct} color={g.claimed ? '#3DDC84' : undefined} /></div><span className="tiny muted num">{Math.min(g.value, g.target).toLocaleString('en-US')}/{g.target.toLocaleString('en-US')}</span></div>
          </div>
        ))}
        <div className="tiny faint mt12">New goals every week. Unclaimed rewards expire with the week.</div>
      </div>
    </div>
  );
}

function Spotlight({ sp, onOpen, onPick }) {
  const { state } = useGame();
  const r = state.rivals.find((x) => x.id === sp.rivalId);
  if (!r) return null;
  return (
    <div className="section">
      <SectionHead title="Spotlight" />
      <div className="card spotlight">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <ArtistAvatar rival={r} size={56} onClick={() => onOpen(r.id)} />
          <div className="grow"><Mono className="sm" style={{ color: 'var(--amber)' }}>Big week · {tierLabel(r.tier)}</Mono><div style={{ fontWeight: 600, marginTop: 2 }}>{sp.text}</div></div>
        </div>
        <div className="row mt12">
          <button className="btn grow" onClick={() => onPick('react')}><Icon name="heart" size={16} />Show love</button>
          <button className="btn danger grow" onClick={() => onPick('diss')}><Icon name="flame" size={16} />Diss</button>
        </div>
        <div className="tiny muted mt8">Love builds the relationship (collabs get cheaper). A diss starts beef: hype now, risk later.</div>
      </div>
    </div>
  );
}

function TourCard() {
  const { state, go } = useGame();
  const t = state.tour;
  const v = VENUES.find((x) => x.id === t.venueId);
  const done = t.stops.filter((x) => x.done).length;
  const next = t.stops.filter((x) => !x.done && x.week === state.week);
  return (
    <div className="section">
      <SectionHead title="On tour" action="Manage" onAction={() => go({ tab: 'world', section: 'tours' })} />
      <div className="card">
        <div className="row between"><b>{v.name} tour</b><span className="mono sm">{done}/{t.stops.length} shows</span></div>
        <div className="mt8"><Bar pct={done / t.stops.length} color={AREA.world} /></div>
        <div className="tiny muted mt8">This week: {next.length ? next.map((x) => `${cityById(x.cityId).flag} ${cityById(x.cityId).name}`).join(' · ') : 'travel day'} · {t.reserve} energy reserved weekly</div>
      </div>
    </div>
  );
}

const TL_ICON = { release: 'disc', chart: 'chart', award: 'trophy', viral: 'flame', deal: 'briefcase', collab: 'users', scandal: 'skull', beef: 'flame', era: 'palette', tour: 'globe', cert: 'star', dating: 'heart', video: 'video', wrapped: 'gift' };
const TL_FILTERS = [['all', 'All'], ['release', 'Releases'], ['chart', 'Charts'], ['award', 'Awards'], ['viral', 'Viral'], ['deal', 'Deals'], ['drama', 'Drama']];
function Timeline() {
  const { state } = useGame();
  const [f, setF] = useState('all');
  const items = (state.timeline || []).filter((t) => f === 'all' || t.kind === f || (f === 'drama' && ['scandal', 'beef', 'dating'].includes(t.kind)) || (f === 'deal' && ['deal', 'collab'].includes(t.kind)) || (f === 'chart' && ['chart', 'cert'].includes(t.kind)));
  const eraColor = (id) => state.eras?.find((e) => e.id === id)?.color;
  return (
    <div className="section">
      <SectionHead title="Career timeline" />
      <div className="pills">{TL_FILTERS.map(([k, l]) => <button key={k} className={`pill ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l}</button>)}</div>
      <div className="card timeline mt8">
        {items.length ? items.slice(0, 80).map((t, i) => (
          <div key={i} className="tl-item">
            <div className="tl-dot" style={{ borderColor: eraColor(t.eraId) || 'var(--border-strong)' }}><Icon name={TL_ICON[t.kind] || 'sparkle'} size={14} /></div>
            <div className="grow"><Mono className="sm">Week {t.week}</Mono><div style={{ fontWeight: 600 }}>{t.title}</div>{t.detail && <div className="tiny muted">{t.detail}</div>}</div>
          </div>
        )) : <div className="muted small">Your story starts with your first release.</div>}
      </div>
    </div>
  );
}

function EraSheet({ onClose }) {
  const { state, act } = useGame();
  const [name, setName] = useState('');
  const [color, setColor] = useState(ERA_COLORS[1]);
  const [vibe, setVibe] = useState('bright');
  const past = state.eras || [];
  return (
    <Sheet open onClose={onClose} title="Start a new era" sub="Eras restyle your Home, accents and cover art. Hold each one at least 4 weeks.">
      <label className="col gap6"><Mono>Era name</Mono><input value={name} maxLength={28} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight Bloom" /></label>
      <Mono className="mt16">Colour</Mono>
      <div className="row wrap gap6 mt8">{ERA_COLORS.map((c) => <button key={c} className="swatch press" aria-label={`Colour ${c}`} onClick={() => setColor(c)} style={{ background: c, outline: color === c ? '3px solid #fff' : 'none' }} />)}</div>
      <Mono className="mt16">Vibe</Mono>
      <div className="col mt8">{ERA_VIBES.map((v) => <button key={v.id} className={`option press ${vibe === v.id ? 'on' : ''}`} style={{ '--accent': color }} onClick={() => setVibe(v.id)}><div className="row between"><b>{v.name}</b><span className="tiny muted">{v.desc}</span></div></button>)}</div>
      <div className="card tight mt16 era-preview" style={{ '--ec': color }}><Mono className="sm" style={{ color }}>Preview</Mono><div className="head" style={{ fontSize: 22 }}>{name || 'Your era'}</div></div>
      <button className="btn primary block mt16" style={{ background: color, color: '#0B0B0F' }} disabled={!name.trim()} onClick={() => { if (act(startEra, { name, color, vibe }).ok) onClose(); }}>Begin the era</button>
      {past.length > 0 && <div className="mt16"><Mono>Past eras</Mono>{past.slice().reverse().map((e) => <div key={e.id} className="list-item"><i style={{ width: 14, height: 14, borderRadius: 4, background: e.color }} /><div className="grow"><b className="small">{e.name}</b><div className="tiny muted">Week {e.startWeek}{e.endWeek ? `–${e.endWeek}` : ' – now'}</div></div></div>)}</div>}
    </Sheet>
  );
}
