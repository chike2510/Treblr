import { useState } from 'react';
import {
  upNext, goalProgress, rewardText, calendarEvents, nearbyRivals, playerPositions, formatWeekDate, fmtNum,
  genreName, ROLLOUTS, rest, popularityFromListeners,
} from '../engine/index.js';
import { useGame, Icon, Mono, Sheet, CountUp, Delta, Bar, Cover, SectionHead, AREA } from '../ui/kit.jsx';
import { MagazineCover, ReportBody } from './Report.jsx';

const TONE = { studio: AREA.studio, phone: AREA.phone, world: AREA.world, danger: '#FF4D5E', warn: '#FFB020' };
const TONE_ICON = { studio: 'mic', phone: 'phone', world: 'globe', danger: 'cash', warn: 'moon' };

export default function Home() {
  const { state, go, act } = useGame();
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
  const news = state.news.slice(0, 5);

  const headline = rep?.headline || `${p.stageName}: The Making of a Star`;
  const lines = [
    { k: 'LISTENERS', v: fmtNum(p.monthlyListeners) },
    positions[0] ? { k: 'CHARTING', v: `#${positions[0].r} ${positions[0].chartName}` } : { k: 'GENRE', v: genreName(p.genre) },
    { k: 'HYPE', v: `${Math.round(p.hype)}/100` },
  ];

  return (
    <div className="screen">
      <MagazineCover player={p} week={state.week} headline={headline} lines={lines} onRead={() => setIssue(true)} kicker={rep ? `WEEK ${rep.week} REPORT` : 'DEBUT ISSUE'} />

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
        <SectionHead title="Current era" action={era ? 'Catalog' : 'Studio'} onAction={() => go({ tab: 'studio', section: era ? 'catalog' : 'write' })} />
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
            <div key={r.id} className="list-item">
              <div className="avatar" style={{ display: 'grid', placeItems: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, background: `hsl(${(r.name.length * 47) % 360} 50% 30%)` }}>{r.name[0]}</div>
              <div className="grow">
                <div className="row gap6"><b className="ellipsis">{r.name}</b><span className="tiny muted">{genreName(r.genre)} · {r.country}</span></div>
                <div className="muted small ellipsis">{r.lastMove}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div className="num">{fmtNum(r.monthlyListeners)}</div><div className="mono sm">Pop {popularityFromListeners(r.monthlyListeners)}</div></div>
            </div>
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

