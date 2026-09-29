import { fmtN as formatCurrency, fmt } from '../engine/utils';

export default function WeeklyReport({ report, currency = 'NGN', onContinue }) {
  const fmtN = (amount) => formatCurrency(amount, currency);
  if (!report) return null;

  const week = report.week || 0;
  const timeLabel = report.timeLabel || '';
  const streamIncome = Number(report.streamIncome || 0);
  const merchIncome = Number(report.merchIncome || 0);
  const tourIncome = Number(report.tourIncome || 0);
  const jobIncome = Number(report.jobIncome || 0);
  const campaignSpend = Number(report.campaignSpend || 0);
  const revenue = Number(report.revenue ?? report.totalIncome ?? streamIncome + merchIncome + tourIncome + jobIncome);
  const streamCount = Number(report.streamCount ?? report.grossStreams ?? 0);
  const fansDelta = Number(report.fansDelta ?? report.fansGained ?? 0);
  const totalFans = Number(report.totalFans ?? report.fans ?? 0);
  const totalMoney = Number(report.totalMoney ?? report.money ?? 0);
  const tracks = [...(Array.isArray(report.trackStreams) ? report.trackStreams : [])]
    .sort((a, b) => (b.streams || 0) - (a.streams || 0));
  const topTrack = report.topTrack || tracks[0] || null;
  const events = Array.isArray(report.events) ? report.events : [];
  const revenueColor = revenue > 0 ? 'var(--accent-green)' : 'var(--text-muted)';

  return (
    <div className="wr-overlay" onClick={e => e.target === e.currentTarget && onContinue()}>
      <section className="wr-sheet" role="dialog" aria-modal="true" aria-labelledby="wr-title">
        <div style={{ width:36, height:4, borderRadius:2, background:'var(--surface-2)', margin:'12px auto 0' }}/>

        <header className="wr-header">
          <div className="wr-week-label">WEEKLY REPORT</div>
          <h2 id="wr-title" className="wr-week-num">Week {week}</h2>
          <div className="wr-time">{timeLabel.split('·')[0]?.trim()}</div>
        </header>

        <div className="wr-revenue-card">
          <div className="wr-revenue-label">TOTAL REVENUE</div>
          <div className="wr-revenue-val" style={{ color:revenueColor }}>{fmtN(revenue)}</div>
          <div className="wr-revenue-breakdown">
            {streamIncome > 0 && <span>Streams {fmtN(streamIncome)}</span>}
            {merchIncome > 0 && <span>Merch {fmtN(merchIncome)}</span>}
            {tourIncome > 0 && <span>Tour {fmtN(tourIncome)}</span>}
            {jobIncome > 0 && <span>Job {fmtN(jobIncome)}</span>}
            {campaignSpend > 0 && <span style={{ color:'var(--accent-red)' }}>Campaign −{fmtN(campaignSpend)}</span>}
            {report.tax > 0 && <span style={{ color:'var(--accent-red)' }}>Tax −{fmtN(report.tax)}</span>}
          </div>
        </div>

        <div className="wr-stats-grid">
          <div className="wr-stat">
            <div className="wr-stat-label">STREAMS</div>
            <div className="wr-stat-val" style={{ color:streamCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{fmt(streamCount)}</div>
            <div className="wr-stat-sub">this week</div>
          </div>
          <div className="wr-stat">
            <div className="wr-stat-label">NEW FANS</div>
            <div className="wr-stat-val" style={{ color:fansDelta > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>{fansDelta > 0 ? '+' : ''}{fmt(fansDelta)}</div>
            <div className="wr-stat-sub">total {fmt(totalFans)}</div>
          </div>
          <div className="wr-stat">
            <div className="wr-stat-label">CASH</div>
            <div className="wr-stat-val">{fmtN(totalMoney)}</div>
            <div className="wr-stat-sub">after bills and campaigns</div>
          </div>
          <div className="wr-stat">
            <div className="wr-stat-label">STREAM $</div>
            <div className="wr-stat-val" style={{ color:'var(--accent-gold-lt)' }}>{fmtN(streamIncome)}</div>
            <div className="wr-stat-sub">your share</div>
          </div>
        </div>

        <div className="wr-section">
          <div className="wr-section-label">TOP PERFORMER</div>
          {topTrack ? (
            <div className="wr-top-track">
              <div className="wr-top-track-title">{topTrack.title}</div>
              <div className="wr-top-track-pos">
                {fmt(topTrack.streams || topTrack.weeklyStreams || 0)} streams this week
                {topTrack.chartPos ? ` · #${topTrack.chartPos} on charts` : ''}
              </div>
            </div>
          ) : (
            <div className="wr-empty-track">
              <span>No active tracks</span>
              <span className="wr-hint">Release music to start earning</span>
            </div>
          )}
        </div>

        {tracks.length > 1 && (
          <div className="wr-section">
            <div className="wr-section-label">CATALOG THIS WEEK</div>
            <div className="wr-events">
              {tracks.slice(0,5).map(track => (
                <div key={track.id || track.title} className="wr-event-row" style={{ justifyContent:'space-between' }}>
                  <span>{track.title}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent-cyan)' }}>{fmt(track.streams)} · {fmt(track.total)} lifetime</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.tourStop && (
          <div className="wr-section">
            <div className="wr-section-label">TOUR STOP</div>
            <div className="wr-events">
              <div className="wr-event-row"><span>{report.tourStop.city}</span><span>{fmt(report.tourStop.attendance)} attended · {fmtN(report.tourIncome || 0)}</span></div>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="wr-section">
            <div className="wr-section-label">THIS WEEK'S EVENTS</div>
            <div className="wr-events">
              {events.map((event, i) => <div key={i} className="wr-event-row"><div className="wr-event-dot"/><span>{event}</span></div>)}
            </div>
          </div>
        )}

        <button className="btn btn-purple btn-full wr-continue" onClick={onContinue}>
          CONTINUE →
        </button>
      </section>
    </div>
  );
}
