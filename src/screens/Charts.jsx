import { useState } from 'react';
import { CHARTS, chartItem, movement, playerPositions, featuredPositions, fmtNum } from '../engine/index.js';
import { useGame, Icon, Mono, Cover, ArtistAvatar } from '../ui/kit.jsx';

export default function Charts() {
  const { state, openArtist, go, openSong } = useGame();
  const [id, setId] = useState('hot100');
  const [limit, setLimit] = useState(30);
  const chart = CHARTS.find((c) => c.id === id);
  const entries = state.charts[id] || [];
  const mine = [...playerPositions(state), ...featuredPositions(state)].sort((a, b) => a.r - b.r);
  return (
    <div className="screen">
      <div className="row between">
        <div><Mono style={{ color: 'var(--amber)' }}>Charts · Week {state.week - 1 || 1}</Mono><h1 style={{ fontSize: 30 }}>{chart.name}</h1></div>
        <Icon name="chart" size={30} color="#FFB020" />
      </div>

      <div className="mt16">
        {entries.length > 0 && (() => {
          const leader = chartItem(state, id, entries[0]);
          const own = mine.filter(x => x.chartId === id).sort((a,b) => a.r-b.r);
          return <div className="card tight" style={{ background: 'linear-gradient(135deg, rgba(255,176,32,.15), rgba(14,17,22,.97) 68%)', borderColor: 'rgba(255,176,32,.22)' }}>
            <Mono>THIS WEEK'S NO. 1</Mono><div className="row gap12 mt8"><Cover cover={leader.cover} size={72} radius={10}/><div className="grow" style={{minWidth:0}}><div className="head ellipsis">#1 · {leader.title}</div><div className="small muted ellipsis">{leader.artist}</div><div className="tiny muted mt4">{chart.name} · Week {state.week - 1 || 1}</div></div></div>
            {own.length > 0 && <div className="row between tiny mt12"><span>Your highest entry</span><b>#{own[0].r} · {own[0].title}</b></div>}
          </div>;
        })()}
        {mine.length ? (<>
          <Mono className="sm" style={{ display: 'block', marginBottom: 8 }}>Your songs on the charts</Mono>
          <div className="pills">
            {mine.map((m) => (
              <button key={m.chartId + m.id} className={`rank-chip ${m.featured ? 'fp' : ''}`} onClick={() => setId(m.chartId)} aria-label={`Number ${m.r} on ${m.chartName}: ${m.title}`}>
                <Cover cover={chartItem(state, m.chartId, m).cover} size={32} radius={16} />
                <b>#{m.r}</b><span>{m.chartName} · {m.title}{m.featured ? ' (feat.)' : ''}</span>
              </button>
            ))}
          </div>
        </>) : <div className="card tight small muted">You're not on any chart yet. Country charts are the easiest way in, your home market gives you a 3× boost.</div>}
        {state.player.chartBanUntil && state.week <= state.player.chartBanUntil && <div className="card tight small mt8" style={{ borderColor: 'rgba(255,77,94,.4)', color: 'var(--red)' }}>Payola ban: your songs are off every chart until week {state.player.chartBanUntil}.</div>}
      </div>

      <Mono className="sm" style={{ display: 'block', margin: '20px 0 8px' }}>Browse charts</Mono>
      <div className="pills">
        {CHARTS.map((c) => <button key={c.id} className={`pill ${id === c.id ? 'on' : ''}`} onClick={() => { setId(c.id); setLimit(30); }}>{c.short ? c.name : c.name}</button>)}
      </div>

      <div className="card tight mt16"><div className="row between"><Mono>CHART INTELLIGENCE</Mono><span className="chip sm">{entries.length} entries</span></div><div className="tiny muted mt8">Positions respond to weekly consumption, radio activity and market performance. Track movement across markets to see where the next campaign should go.</div></div>
      <div className="row between mt16" style={{ padding: '0 10px' }}><Mono className="sm">Rank · Move</Mono><Mono className="sm">{chart.kind === 'albums' ? 'Units' : id === 'radio' ? 'Spins' : 'Score'} · Wks</Mono></div>
      <div className="col gap4 mt8">
        {entries.slice(0, limit).map((e) => {
          const it = chartItem(state, id, e);
          const mv = movement(e);
          const rival = it.rivalId ? state.rivals.find((r) => r.id === it.rivalId) : chart.kind === 'albums' && !e.pl ? state.rivals.find((r) => r.name === it.artist) : it.featId ? state.rivals.find((r) => r.id === it.featId) : null;
          return (
            <div key={e.id} className={`chart-row ${e.pl || e.fp ? 'me' : ''}`} onClick={e.pl && chart.kind === 'albums' ? () => openProject?.(e.id) : (e.pl || e.fp) && openSong ? () => openSong(e.id) : rival ? () => openArtist(rival.id) : undefined} role={rival || e.pl || e.fp ? 'button' : undefined} style={rival || e.pl || e.fp ? { cursor: 'pointer' } : undefined}>
              <div className="rk" style={{ color: e.r <= 3 ? '#FFB020' : undefined }}>{e.r}</div>
              <div className={`mv ${mv.kind}`}>{mv.label}</div>
              <Cover cover={it.cover} size={44} />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 600, color: e.pl || e.fp ? '#C6FF3D' : undefined }}>{it.title}</div>
                <div className="tiny muted ellipsis">{it.artist}{e.pk < e.r ? ` · peak #${e.pk}` : ''}</div>
              </div>
              {rival && <ArtistAvatar rival={rival} size={28} />}
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
