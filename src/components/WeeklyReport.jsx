import { fmtN, fmt } from '../engine/utils';

const GENRES_MAP = {
  afrobeats:'Afrobeats', hiphop:'Hip-Hop', pop:'Pop', rnb:'R&B', alt:'Alternative'
};

export default function WeeklyReport({ report, stageName, genre, onContinue }) {
  if (!report) return null;

  const { week, timeLabel, revenue, streamIncome, merchIncome, tourIncome, fansDelta, totalFans, totalMoney, topTrack, events } = report;
  const revenueColor = revenue > 0 ? 'var(--accent-green)' : 'var(--text-muted)';

  return (
    <div className="wr-overlay" onClick={e => e.target === e.currentTarget && onContinue()}>
      <div className="wr-sheet">
        <div className="wr-header">
          <div className="wr-week-label">WEEKLY REPORT</div>
          <div className="wr-week-num">Week {week}</div>
          <div className="wr-time">{timeLabel?.split('·')[0]?.trim()}</div>
        </div>

        {/* Revenue hero */}
        <div className="wr-revenue-card">
          <div className="wr-revenue-label">TOTAL REVENUE</div>
          <div className="wr-revenue-val" style={{ color: revenueColor }}>{fmtN(revenue)}</div>
          {(streamIncome > 0 || merchIncome > 0 || tourIncome > 0) && (
            <div className="wr-revenue-breakdown">
              {streamIncome > 0 && <span>Streams {fmtN(streamIncome)}</span>}
              {merchIncome > 0 && <span>Merch {fmtN(merchIncome)}</span>}
              {tourIncome > 0 && <span>Tour {fmtN(tourIncome)}</span>}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="wr-stats-grid">
          <div className="wr-stat">
            <div className="wr-stat-label">NEW FANS</div>
            <div className="wr-stat-val" style={{ color: fansDelta > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {fansDelta > 0 ? '+' : ''}{fmt(fansDelta)}
            </div>
            <div className="wr-stat-sub">total {fmt(totalFans)}</div>
          </div>
          <div className="wr-stat">
            <div className="wr-stat-label">NET WORTH</div>
            <div className="wr-stat-val">{fmtN(totalMoney)}</div>
          </div>
        </div>

        {/* Top performer */}
        <div className="wr-section">
          <div className="wr-section-label">TOP PERFORMER</div>
          {topTrack ? (
            <div className="wr-top-track">
              <div className="wr-top-track-title">{topTrack.title}</div>
              {topTrack.chartPos && (
                <div className="wr-top-track-pos">#{topTrack.chartPos} on charts</div>
              )}
            </div>
          ) : (
            <div className="wr-empty-track">
              <span>No active tracks</span>
              <span className="wr-hint">Release music to start earning</span>
            </div>
          )}
        </div>

        {/* Events */}
        {events && events.length > 0 && (
          <div className="wr-section">
            <div className="wr-section-label">THIS WEEK'S EVENTS</div>
            <div className="wr-events">
              {events.map((ev, i) => (
                <div key={i} className="wr-event-row">
                  <div className="wr-event-dot" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-purple btn-full wr-continue" onClick={onContinue}>
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
