import { fmtMoney, fmtNum, formatWeekDate } from '../engine/index.js';
import { Mono, Delta, facePhoto } from '../ui/kit.jsx';

const LABELS = {
  streams: 'Streaming', gigs: 'Gigs & tours', jobs: 'Jobs', brand: 'Brand deals', features: 'Features', merch: 'Merch', video: 'TreblrTube', live: 'Live tips', training: 'Training',
  advance: 'Label advance', rewards: 'Milestones', other: 'Other', rent: 'Rent', living: 'Living costs', staff: 'Team salaries', studio: 'Studio time',
  cowriters: 'Co-writers', marketing: 'Marketing', touring: 'Touring costs', videoProd: 'Music videos', sales: 'Sales', loan: 'Loans', lifestyle: 'Lifestyle', acting: 'Acting', distribution: 'Distribution',
};

export function MagazineCover({ player, week, headline, lines = [], onRead, kicker = 'COVER STORY' }) {
  return (
    <div className="magazine">
      <img src={facePhoto(player)} alt="" />
      <div className="shade" />
      <div className="mast">
        <h1>TREBLR<small>WEEKLY</small></h1>
        <div className="issue">ISSUE №{week}<br />{formatWeekDate(week, { month: 'short', day: 'numeric' }).toUpperCase()}<br />$4.99</div>
      </div>
      <div className="mag-bottom">
        {lines.length > 0 && (
          <div className="side">
            {lines.slice(0, 3).map((l) => <div key={l.k}><i>{l.k}</i>{l.v}</div>)}
          </div>
        )}
        <div className="story">
          <span className="kicker">{kicker}</span>
          <h2>{headline}</h2>
          {onRead && <button className="btn primary sm" onClick={onRead}>Read the issue ›</button>}
        </div>
      </div>
    </div>
  );
}

export function ReportBody({ report, state }) {
  if (!report) return <div className="muted">No issue yet, play your first week.</div>;
  const inc = Object.entries(report.income || {}).filter(([, v]) => v);
  const exp = Object.entries(report.expense || {}).filter(([, v]) => v);
  const totalIn = inc.reduce((a, [, v]) => a + v, 0);
  const totalOut = exp.reduce((a, [, v]) => a + v, 0);
  return (
    <div className="col gap16">
      <div className="grid2">
        <div className="stat"><Mono className="sm">Streams</Mono><div className="v">{fmtNum(report.streams)}</div></div>
        <div className="stat"><Mono className="sm">Net cash</Mono><div className="v" style={{ color: report.net >= 0 ? 'var(--green)' : 'var(--red)' }}>{report.net >= 0 ? '+' : ''}{fmtMoney(report.net)}</div></div>
        <div className="stat"><Mono className="sm">Fans</Mono><div className="v">{fmtNum(report.fans)}</div><div className="d"><Delta v={report.fansDelta} /></div></div>
        <div className="stat"><Mono className="sm">Monthly listeners</Mono><div className="v">{fmtNum(report.ml)}</div><div className="d"><Delta v={report.mlDelta} /></div></div>
      </div>
      {report.topSong && <div className="card tight"><Mono className="sm">Top song</Mono><div className="row between mt8"><b>{report.topSong.title}</b><span className="num">{fmtNum(report.topSong.streams)}</span></div></div>}

      <div className="card">
        <Mono>Earnings</Mono>
        {inc.length === 0 && <div className="muted small mt8">No income this week.</div>}
        {inc.map(([k, v]) => <div key={k} className="row between mt8 small"><span>{LABELS[k] || k}</span><span className="up">+{fmtMoney(v)}</span></div>)}
        <div className="divider" />
        <Mono>Expenses</Mono>
        {exp.map(([k, v]) => <div key={k} className="row between mt8 small"><span>{LABELS[k] || k}</span><span className="down">-{fmtMoney(v)}</span></div>)}
        <div className="divider" />
        <div className="row between"><b>Total</b><b className={totalIn - totalOut >= 0 ? 'up' : 'down'}>{fmtMoney(totalIn - totalOut)}</b></div>
      </div>

      <div className="card">
        <Mono>Chart moves</Mono>
        {report.chartMoves?.length ? report.chartMoves.slice(0, 10).map((m, i) => (
          <div key={i} className="row between mt8 small">
            <span className="ellipsis"><b>#{m.r}</b> {m.title} · <span className="muted">{m.chart}</span></span>
            <span className={m.p == null ? '' : m.p > m.r ? 'up' : m.p < m.r ? 'down' : 'faint'} style={{ color: m.p == null ? 'var(--amber)' : undefined, fontWeight: 700 }}>{m.p == null ? 'NEW' : m.p > m.r ? `▲${m.p - m.r}` : m.p < m.r ? `▼${m.r - m.p}` : '-'}</span>
          </div>
        )) : <div className="muted small mt8">Not charting yet{state?.songs?.some((s) => s.status === 'released') ? ', keep pushing.' : '. Release something!'}</div>}
      </div>

      {report.tour?.nights?.length > 0 && (
        <div className="card">
          <Mono>Tour nights</Mono>
          {report.tour.nights.map((n, i) => <div key={i} className="row between small mt8"><span>{n.flag} {n.city}{n.soldOut ? ' · sold out' : ''}</span><span>{fmtNum(n.sold)}/{fmtNum(n.cap)} · {fmtMoney(n.gross)} · +{fmtNum(n.fans)} fans</span></div>)}
        </div>
      )}
      {report.events?.length > 0 && (
        <div className="card">
          <Mono>What happened</Mono>
          {report.events.map((e, i) => <div key={i} className="small mt8">• {e}</div>)}
        </div>
      )}
      <div className="card">
        <Mono>Newsroom</Mono>
        {report.news?.map((n, i) => (
          <div key={i} className="mt8 small" style={{ color: n.aboutPlayer ? 'var(--lime)' : undefined }}><span className="mono sm">{n.tag}</span><div>{n.headline}</div></div>
        ))}
      </div>
    </div>
  );
}
