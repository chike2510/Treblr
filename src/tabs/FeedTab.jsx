import { getTimeLabel } from '../utils';

export default function FeedTab({ gs }) {
  return (
    <div className="screen">
      <div className="sec-title">Activity Log</div>
      {(!gs.feed || gs.feed.length === 0) && (
        <div className="empty-state">No activity yet. Start playing.</div>
      )}
      {(gs.feed || []).map((f, i) => (
        <div key={i} className={`feed-item${f.type === 'pos' ? ' pos' : f.type === 'neg' ? ' neg' : ''}`}>
          {f.msg}
          <div className="feed-meta">
            {getTimeLabel(f.week || 0, gs.startYear, gs.startAge)}
          </div>
        </div>
      ))}
    </div>
  );
}
