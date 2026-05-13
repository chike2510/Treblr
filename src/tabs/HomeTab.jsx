import { ERAS, MILESTONES } from '../data/constants';
import { fmt, fmtN, getTier, getEra } from '../engine/utils';

const ERA_ORDER = [...ERAS];

// Safe news text renderer — no dangerouslySetInnerHTML
const BoldedNews = ({ text }) => {
  const parts = text.split(/("(?:[^"]+)")/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"')
          ? <strong key={i} style={{ color: 'var(--text-primary)' }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

export default function HomeTab({ gs, patch, patchFn, showToast, endWeek }) {
  const tier    = getTier(gs.fans);
  const era     = getEra(gs.fans);
  const eraIdx  = ERA_ORDER.findIndex(e => e.label === era.label);
  const nextEra = ERA_ORDER[eraIdx + 1];

  const progress = nextEra
    ? Math.round(((gs.fans - era.minFans) / (nextEra.minFans - era.minFans)) * 100)
    : 100;

  const income = gs.weeklyStreamIncome || 0;
  const playerChartEntries = ((gs.charts?.streams) || []).filter(e => e.isPlayer);
  const bestPos = playerChartEntries.length > 0 ? Math.min(...playerChartEntries.map(e => e.position)) : null;

  const newsItems = (gs.news || []).slice(0, 12);
  const newsColor = {
    pos:       'var(--accent-green)',
    neg:       'var(--accent-red)',
    milestone: 'var(--accent-gold)',
    npc:       'var(--accent-cyan)',
    '':        'var(--text-muted)',
  };

  return (
    <div className="tab-content">

      {/* End Week button */}
      <button className="end-week-btn" onClick={endWeek}>
        <span>END WEEK</span>
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, marginLeft: 6 }}>
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Career Level Card */}
      <div className="career-level-card">
        <div className="career-level-row">
          <div className="career-level-num">{eraIdx + 1}</div>
          <div>
            <div className="career-level-name">{era.label.replace(' Era', '').toUpperCase()}</div>
            <div className="career-level-sub">ERA · {tier.tier}</div>
          </div>
          {(gs.awards || []).length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 20, padding: '3px 8px' }}>
              <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: '#FFD700' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#FFD700' }}>{gs.awards.length} award{gs.awards.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="career-level-progress">
          <span>{fmt(gs.fans)} fans</span>
          {nextEra && <span>→ {fmt(nextEra.minFans)}</span>}
        </div>
        <div className="prog-bar">
          <div className="prog-fill" style={{ width: `${progress}%`, background: era.color }} />
        </div>
        {nextEra && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            Next: <span style={{ color: nextEra.color }}>{nextEra.label}</span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="stat-grid-2" style={{ marginBottom: 16 }}>
        <div className="stat-block">
          <div className="stat-block-label">Weekly Income</div>
          <div className="stat-block-val" style={{ color: 'var(--accent-green)' }}>{fmtN(income)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Chart Peak</div>
          <div className="stat-block-val" style={{ color: bestPos ? 'var(--accent-gold-lt)' : 'var(--text-muted)' }}>
            {bestPos ? `#${bestPos}` : '—'}
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Clout</div>
          <div className="stat-block-val" style={{ color: 'var(--accent-purple)' }}>{gs.clout}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Reputation</div>
          <div className="stat-block-val" style={{ color: gs.reputation >= 60 ? 'var(--accent-green)' : gs.reputation >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)' }}>
            {gs.reputation}/100
          </div>
        </div>
      </div>

      {/* Project income callout */}
      {(gs.weekReport?.projectIncome || 0) > 0 && (
        <div className="card" style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-purple)', letterSpacing: 1, textTransform: 'uppercase' }}>Project Income</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>{fmtN(gs.weekReport.projectIncome)}</div>
        </div>
      )}

      {/* Active tour banner */}
      {gs.tourActive && gs.tourData && (
        <div className="card" style={{ background: 'rgba(224,112,32,0.08)', borderColor: 'rgba(224,112,32,0.3)', marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-orange)', marginBottom: 4 }}>On Tour</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{gs.tourData.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Week {((gs.tourData.weeks || 6) - gs.tourWeeksLeft)}/{gs.tourData.weeks} · {fmtN(Math.round((gs.tourData.revenue || 0) / (gs.tourData.weeks || 6)))} /week
          </div>
          <div className="prog-bar" style={{ marginTop: 8 }}>
            <div className="prog-fill" style={{ width: `${Math.round(((gs.tourData.weeks - gs.tourWeeksLeft) / gs.tourData.weeks) * 100)}%`, background: 'var(--accent-orange)' }} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(224,112,32,0.7)', marginTop: 6 }}>Energy drains faster while touring.</div>
        </div>
      )}

      {/* Prison banner */}
      {gs.inPrison && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-red)', marginBottom: 4 }}>In Prison</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{gs.prisonWeeksLeft} weeks left</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Can't record, tour, or post while locked up.</div>
        </div>
      )}

      {/* Awards shelf */}
      {(gs.awards || []).length > 0 && (
        <>
          <div className="sec-head">
            <div className="sec-title">Awards</div>
            <div className="sec-sub">{gs.awards.length} won</div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
            {gs.awards.map((award, i) => (
              <div key={i} style={{ flexShrink: 0, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 10, padding: '10px 14px', minWidth: 130, textAlign: 'center' }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: '#FFD700', margin: '0 auto 6px', display: 'block' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD700' }}>{award.title}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Week {award.week}</div>
              </div>
            ))}
          </div>
        </>
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
                <div className="news-text"><BoldedNews text={item.msg} /></div>
                <div className="news-week">Week {item.week}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
