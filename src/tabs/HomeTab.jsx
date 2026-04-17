import { ERAS, MILESTONES } from '../data/constants';
import { fmt, fmtN, getTier, getEra } from '../engine/utils';

const ERA_ORDER = [...ERAS];

export default function HomeTab({ gs, patch, patchFn, showToast, endWeek }) {
  const tier    = getTier(gs.fans);
  const era     = getEra(gs.fans);
  const eraIdx  = ERA_ORDER.findIndex(e => e.label === era.label);
  const nextEra = ERA_ORDER[eraIdx + 1];

  // Progress to next era
  const progress = nextEra
    ? Math.round(((gs.fans - era.minFans) / (nextEra.minFans - era.minFans)) * 100)
    : 100;

  // Weekly income
  const income = gs.weeklyStreamIncome || 0;

  // Top chart position (streams)
  const playerChartEntries = ((gs.charts?.streams) || []).filter(e => e.isPlayer);
  const bestPos = playerChartEntries.length > 0 ? Math.min(...playerChartEntries.map(e => e.position)) : null;

  const newsItems = (gs.news || []).slice(0, 12);
  const newsColor = { pos:'var(--accent-green)', neg:'var(--accent-red)', milestone:'var(--accent-gold)', npc:'var(--accent-cyan)', '':'var(--text-muted)' };

  return (
    <div className="tab-content">
      {/* End Week button */}
      <button className="end-week-btn" onClick={endWeek}>
        END WEEK →
      </button>

      {/* Career Level Card */}
      <div className="career-level-card">
        <div className="career-level-row">
          <div className="career-level-num">{eraIdx + 1}</div>
          <div>
            <div className="career-level-name">{era.label.replace(' Era', '').toUpperCase()}</div>
            <div className="career-level-sub">ERA · {tier.tier}</div>
          </div>
        </div>
        <div className="career-level-progress">
          <span>{fmt(gs.fans)} fans</span>
          {nextEra && <span>→ {fmt(nextEra.minFans)}</span>}
        </div>
        <div className="prog-bar">
          <div className="prog-fill" style={{ width:`${progress}%`, background: era.color }} />
        </div>
        {nextEra && (
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>
            Next: <span style={{ color: nextEra.color }}>{nextEra.label}</span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="stat-grid-2" style={{ marginBottom:16 }}>
        <div className="stat-block">
          <div className="stat-block-label">Weekly Streams</div>
          <div className="stat-block-val" style={{ color:'var(--accent-green)' }}>{fmtN(income)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Chart Peak</div>
          <div className="stat-block-val" style={{ color: bestPos ? 'var(--accent-gold-lt)' : 'var(--text-muted)' }}>
            {bestPos ? `#${bestPos}` : '—'}
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Clout</div>
          <div className="stat-block-val" style={{ color:'var(--accent-purple)' }}>{gs.clout}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Reputation</div>
          <div className="stat-block-val" style={{ color: gs.reputation >= 60 ? 'var(--accent-green)' : gs.reputation >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)' }}>
            {gs.reputation}/100
          </div>
        </div>
      </div>

      {/* Active tour banner */}
      {gs.tourActive && gs.tourData && (
        <div className="card" style={{ background:'rgba(224,112,32,0.08)', borderColor:'rgba(224,112,32,0.3)', marginBottom:16 }}>
          <div style={{ fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'var(--accent-orange)', marginBottom:4 }}>On Tour</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18 }}>{gs.tourData.label}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            Week {((gs.tourData.weeks || 6) - gs.tourWeeksLeft)}/{gs.tourData.weeks} · 
            {' '}{fmtN(Math.round((gs.tourData.revenue || 0) / (gs.tourData.weeks || 6)))} /week
          </div>
          <div className="prog-bar" style={{ marginTop:8 }}>
            <div className="prog-fill" style={{ width:`${Math.round(((gs.tourData.weeks - gs.tourWeeksLeft) / gs.tourData.weeks) * 100)}%`, background:'var(--accent-orange)' }} />
          </div>
        </div>
      )}

      {/* Industry news */}
      <div className="sec-head">
        <div className="sec-title">Industry News</div>
        <div className="sec-sub">{gs.totalWeeks} weeks in</div>
      </div>
      <div className="card">
        {newsItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">News will appear here as your career develops.</div>
          </div>
        ) : (
          newsItems.map((item, i) => (
            <div key={i} className="news-item">
              <div className="news-dot" style={{ background: newsColor[item.type] || 'var(--text-muted)' }} />
              <div>
                <div className="news-text" dangerouslySetInnerHTML={{ __html: item.msg.replace(/([A-Z][^.!?]+)/g, '<strong>$1</strong>').replace(/<strong>([^<]{1,3})<\/strong>/g, '$1') }} />
                <div className="news-week">Week {item.week}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
