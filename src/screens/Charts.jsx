import { useState } from 'react';
import { CHARTS, chartItem, movement, playerPositions, fmtNum } from '../engine/index.js';
import { useGame, Icon, Mono, Cover } from '../ui/kit.jsx';

export default function Charts() {
  const { state } = useGame();
  const [id, setId] = useState('hot100');
  const [limit, setLimit] = useState(30);
  const chart = CHARTS.find((c) => c.id === id);
  const entries = state.charts[id] || [];
  const mine = playerPositions(state);
  return (
    <div className="screen">
      <div className="row between">
        <div><Mono style={{ color: 'var(--amber)' }}>Charts · Week {state.week - 1 || 1}</Mono><h1 style={{ fontSize: 30 }}>{chart.name}</h1></div>
        <Icon name="chart" size={30} color="#FFB020" />
      </div>

      <div className="mt12">
        {mine.length ? (
          <div className="pills">
            {mine.map((m) => (
              <button key={m.chartId + m.id} className="chip" style={{ color: '#0B0B0F', background: '#C6FF3D', borderColor: 'transparent' }} onClick={() => setId(m.chartId)}>#{m.r} {m.chartName} · {m.title}</button>
            ))}
          </div>
        ) : <div className="card tight small muted">You're not on any chart yet. Country charts are the easiest way in — your home market gives you a 3× boost.</div>}
      </div>

      <div className="pills mt16">
        {CHARTS.map((c) => <button key={c.id} className={`pill ${id === c.id ? 'on' : ''}`} onClick={() => { setId(c.id); setLimit(30); }}>{c.short ? c.name : c.name}</button>)}
      </div>

      <div className="row between mt16" style={{ padding: '0 10px' }}>
        <Mono className="sm">Rank · Move</Mono><Mono className="sm">{chart.kind === 'albums' ? 'Units' : id === 'radio' ? 'Spins' : 'Score'} · Wks</Mono>
      </div>
      <div className="col gap4 mt8">
        {entries.slice(0, limit).map((e) => {
          const it = chartItem(state, id, e);
          const mv = movement(e);
          return (
            <div key={e.id} className={`chart-row ${e.pl ? 'me' : ''}`}>
              <div className="rk" style={{ color: e.r <= 3 ? '#FFB020' : undefined }}>{e.r}</div>
              <div className={`mv ${mv.kind}`}>{mv.label}</div>
              <Cover cover={it.cover} size={44} />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 600, color: e.pl ? '#C6FF3D' : undefined }}>{it.title}</div>
                <div className="tiny muted ellipsis">{it.artist}{e.pk < e.r ? ` · peak #${e.pk}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="small num">{fmtNum(e.s)}</div>
                <div className="tiny muted">{e.w}w</div>
              </div>
            </div>
          );
        })}
      </div>
      {entries.length > limit && <button className="btn block mt16" onClick={() => setLimit(limit + 40)}>Show more ({entries.length - limit})</button>}
      {!entries.length && <div className="empty">This chart is empty this week.</div>}
    </div>
  );
}
