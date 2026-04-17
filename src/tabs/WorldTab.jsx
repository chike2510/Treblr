import { useState } from 'react';
import { TOUR_TIERS, GENRES } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { fmt, fmtN, clamp, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

const CHART_TABS = ['Streams','Sales','Videos'];
const GENRE_TABS = ['All', ...['Afrobeats','Hip-Hop','Pop','R&B','Alternative']];

export default function WorldTab({ gs, patch, patchFn, showToast }) {
  const [view, setView]         = useState('charts');
  const [chartType, setChartType] = useState('Streams');
  const [genreFilter, setGenreFilter] = useState('All');

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        {['charts','touring'].map(v => (
          <div key={v} className={`sub-tab${view===v?' on':''}`} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </div>
        ))}
      </div>

      {view === 'charts' && <ChartsView gs={gs} chartType={chartType} setChartType={setChartType} genreFilter={genreFilter} setGenreFilter={setGenreFilter} />}
      {view === 'touring' && <TouringView gs={gs} patchFn={patchFn} showToast={showToast} />}
    </div>
  );
}

function ChartsView({ gs, chartType, setChartType, genreFilter, setGenreFilter }) {
  const chartKey = chartType.toLowerCase();
  const chartData = (gs.charts || {})[chartKey] || [];

  const genreMap = { 'Afrobeats':'afrobeats', 'Hip-Hop':'hiphop', 'Pop':'pop', 'R&B':'rnb', 'Alternative':'alt' };
  const filtered = genreFilter === 'All' ? chartData : chartData.filter(e => e.genre === genreMap[genreFilter]);
  const genreData = GENRES.find(g => g.id === gs.genre);

  const metricLabel = chartType === 'Streams' ? 'STREAMS' : chartType === 'Sales' ? 'SALES' : 'VIEWS';

  const moveIcon = (curr, last) => {
    if (!last || curr === last) return <span className="chart-move same">●</span>;
    if (curr < last) return <span className="chart-move up">▲{last - curr}</span>;
    return <span className="chart-move down">▼{curr - last}</span>;
  };

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Official Charts</div>
        <div className="sec-sub">Updated monthly</div>
      </div>

      {/* Chart type tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:10, overflowX:'auto' }}>
        {CHART_TABS.map(t => (
          <button
            key={t}
            className={`btn btn-sm ${chartType===t ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setChartType(t)}
            style={{ whiteSpace:'nowrap' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Genre filter */}
      <div style={{ display:'flex', gap:4, marginBottom:14, overflowX:'auto' }}>
        {GENRE_TABS.map(g => (
          <button
            key={g}
            className={`tag ${genreFilter===g ? 'tag-gold' : ''}`}
            style={{ border:`1px solid ${genreFilter===g ? 'var(--accent-gold)' : 'var(--border)'}`, background: genreFilter===g ? 'rgba(200,146,42,0.12)' : 'var(--surface-1)', cursor:'pointer', whiteSpace:'nowrap', fontSize:10, padding:'4px 10px', borderRadius:20 }}
            onClick={() => setGenreFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-text">No chart data yet. Release music and end weeks to update charts.</div>
          </div>
        </div>
      ) : (
        <div className="card">
          {/* Header */}
          <div className="chart-head">
            <div className="chart-head-cell">#</div>
            <div className="chart-head-cell">±</div>
            <div className="chart-head-cell">TRACK</div>
            <div className="chart-head-cell" style={{ textAlign:'right' }}>{metricLabel}</div>
            <div className="chart-head-cell" style={{ textAlign:'center' }}>PEAK</div>
            <div className="chart-head-cell" style={{ textAlign:'center' }}>WKS</div>
          </div>

          {filtered.slice(0, 30).map((entry, i) => (
            <div key={entry.id || i} className={`chart-row${entry.isPlayer ? ' is-player' : ''}`}>
              <div className={`chart-pos${entry.position <= 3 ? ' top3' : ''}`}>{entry.position}</div>
              <div>{moveIcon(entry.position, entry.lastPos)}</div>
              <div>
                <div className="chart-title">{entry.title || entry.name}</div>
                <div className="chart-artist">{entry.artist}</div>
              </div>
              <div className="chart-streams">{fmt(entry.metricVal || 0)}</div>
              <div className="chart-peak">#{entry.peakPos || entry.position}</div>
              <div className="chart-wks">{entry.weeksOnChart || 1}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function TouringView({ gs, patchFn, showToast }) {
  const bookTour = (tier) => {
    if (gs.fans < tier.minFans) { showToast(`Need ${fmt(tier.minFans)} fans`); return; }
    if (gs.money < tier.cost) { showToast('Not enough money'); return; }
    if (gs.tourActive) { showToast('Already on tour!'); return; }
    if (gs.totalWeeks < (gs.tourCooldownEnd || 0)) { showToast(`Tour cooldown: ${(gs.tourCooldownEnd || 0) - gs.totalWeeks}w left`); return; }
    if ((gs.catalog || []).filter(t => t.released).length < 1) { showToast('Release at least 1 song first'); return; }

    const revenue = rand(tier.minRev, tier.maxRev);
    patchFn(prev => ({
      money: clamp(prev.money - tier.cost, 0, 999_000_000_000),
      tourActive: true,
      tourWeeksLeft: tier.weeks,
      tourData: { ...tier, revenue },
      energy: clamp(prev.energy - 20, 0, 100),
      news: addNews(prev.news, `${tier.label} booked! Heading out for ${tier.weeks} weeks.`, 'pos', prev.totalWeeks),
    }));
    showToast(`${tier.label} booked!`);
  };

  const onCooldown = gs.totalWeeks < (gs.tourCooldownEnd || 0);
  const cooldownLeft = Math.max(0, (gs.tourCooldownEnd || 0) - gs.totalWeeks);

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Touring</div>
        <div className="sec-sub">Live shows build fanbase fast</div>
      </div>

      {gs.tourActive && gs.tourData && (
        <div className="card" style={{ background:'rgba(224,112,32,0.08)', borderColor:'rgba(224,112,32,0.3)', marginBottom:16 }}>
          <div style={{ fontSize:9, letterSpacing:2, color:'var(--accent-orange)', marginBottom:4 }}>CURRENTLY ON TOUR</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20 }}>{gs.tourData.label}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {((gs.tourData.weeks || 6) - gs.tourWeeksLeft)} / {gs.tourData.weeks} weeks complete
          </div>
          <div className="prog-bar" style={{ marginTop:8 }}>
            <div className="prog-fill" style={{ width:`${((gs.tourData.weeks - gs.tourWeeksLeft) / gs.tourData.weeks) * 100}%`, background:'var(--accent-orange)' }} />
          </div>
          <div style={{ fontSize:12, color:'var(--accent-green)', fontWeight:700, marginTop:8 }}>
            Projected: {fmtN(gs.tourData.revenue)}
          </div>
        </div>
      )}

      {onCooldown && !gs.tourActive && (
        <div style={{ fontSize:11, color:'var(--accent-red)', background:'rgba(214,53,72,0.08)', borderRadius:'var(--r)', padding:'10px 12px', marginBottom:12 }}>
          Tour cooldown: {cooldownLeft} week{cooldownLeft !== 1 ? 's' : ''} remaining
        </div>
      )}

      {TOUR_TIERS.map(tier => {
        const locked = gs.fans < tier.minFans || gs.tourActive || onCooldown || gs.money < tier.cost;
        return (
          <div
            key={tier.id}
            className={`tour-card${locked ? ' locked' : ''}`}
            style={{ background: locked ? 'var(--surface-1)' : 'var(--bg-raised)' }}
            onClick={() => !locked && bookTour(tier)}
          >
            <div className="tour-icon" style={{ background: tier.id === 'world' ? 'var(--accent-gold)' : 'var(--accent-orange)' }}>
              <svg viewBox="0 0 24 24" style={{ width:24, height:24, stroke:'#fff', fill:'none', strokeWidth:2, strokeLinecap:'round' }}>
                {tier.id === 'world' ? <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
              </svg>
            </div>
            <div className="tour-info">
              <div className="tour-name">{tier.label}</div>
              <div className="tour-stats">
                {tier.weeks}w · Cost {fmtN(tier.cost)} · {fmt(tier.minFans)} fans req.
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{tier.desc}</div>
            </div>
            <div>
              <div className="tour-revenue">{fmtN(tier.minRev)}+</div>
              <div style={{ fontSize:9, color:'var(--text-muted)', textAlign:'right' }}>potential</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
