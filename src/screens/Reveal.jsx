import { useGame, Mono, CountFrom } from '../ui/kit.jsx';
import { MagazineCover } from './Report.jsx';
import { fmtNum, fmtMoney } from '../engine/index.js';

export default function Reveal({ report, onClose }) {
  const { state, openOverlay } = useGame();
  const moves = report.chartMoves || [];
  const inc = Object.values(report.income || {}).reduce((a, b) => a + b, 0);
  return (
    <div className="reveal" role="dialog" aria-label="Weekly reveal">
      <Mono style={{ color: '#C6FF3D', textAlign: 'center' }}>Week {report.week} wrapped</Mono>
      <div className="mt12">
        <MagazineCover player={state.player} week={report.week} headline={report.headline} kicker="THIS WEEK" lines={[]} />
      </div>
      <div className="grid3 mt16 cards">
        <div className="stat" style={{ animationDelay: '.2s' }}><Mono className="sm">Streams</Mono><div className="v"><CountFrom to={report.streams} /></div></div>
        <div className="stat" style={{ animationDelay: '.35s' }}><Mono className="sm">Earned</Mono><div className="v up"><CountFrom to={inc} money /></div></div>
        <div className="stat" style={{ animationDelay: '.5s' }}><Mono className="sm">Fans</Mono><div className="v" style={{ color: report.fansDelta >= 0 ? '#3DDC84' : '#FF4D5E' }}>{report.fansDelta >= 0 ? '+' : '-'}<CountFrom to={Math.abs(report.fansDelta)} /></div></div>
      </div>
      <div className="row between mt12 small muted" style={{ padding: '0 4px' }}>
        <span>Net {report.net >= 0 ? '+' : ''}{fmtMoney(report.net)}</span><span>Listeners {fmtNum(report.ml)}</span>
      </div>
      {moves.length > 0 && (
        <div className="col mt16 cards">
          {moves.slice(0, 4).map((m, i) => (
            <div key={i} className="card tight row" style={{ animationDelay: `${0.6 + i * 0.12}s`, borderColor: 'rgba(255,176,32,.35)' }}>
              <div className="num" style={{ fontSize: 28, color: '#FFB020', width: 56 }}>#{m.r}</div>
              <div className="grow"><b className="ellipsis">{m.title}</b><div className="tiny muted">{m.chart}</div></div>
              <b style={{ color: m.p == null ? '#FFB020' : m.p > m.r ? '#3DDC84' : m.p < m.r ? '#FF4D5E' : '#9A9AA5' }}>{m.p == null ? 'NEW' : m.p > m.r ? `▲${m.p - m.r}` : m.p < m.r ? `▼${m.r - m.p}` : '-'}</b>
            </div>
          ))}
        </div>
      )}
      {report.goals?.length > 0 && <div className="card tight mt12" style={{ borderColor: 'rgba(198,255,61,.4)' }}><Mono style={{ color: '#C6FF3D' }}>Milestone unlocked</Mono><div className="mt8">{report.goals.join(' · ')}</div></div>}
      {report.tour?.nights?.length > 0 && <div className="card tight mt12" style={{ borderColor: 'rgba(45,212,191,.4)' }}><Mono style={{ color: '#2DD4BF' }}>Tour · {report.tour.venue}s</Mono>{report.tour.nights.map((n, i) => <div key={i} className="row between small mt8"><span>{n.flag} {n.city}{n.soldOut ? ' · SOLD OUT' : ''}</span><span>{fmtNum(n.sold)}/{fmtNum(n.cap)} · {fmtMoney(n.gross)}</span></div>)}{report.tour.wrapped && <div className="tiny muted mt8">Tour wrapped.</div>}</div>}
      {report.wrapped && <button className="card tight mt12 press" style={{ width: '100%', textAlign: 'left', borderColor: 'rgba(61,220,132,.5)' }} onClick={() => { onClose(); openOverlay?.({ wrapped: report.wrapped }); }}><Mono style={{ color: '#3DDC84' }}>Year {report.wrapped} Wrapped is ready</Mono><div className="small mt8">Open your shareable card →</div></button>}
      {report.burnout >= 40 && <div className="card tight mt12" style={{ borderColor: 'rgba(255,176,32,.45)' }}><Mono style={{ color: '#FFB020' }}>Burnout {Math.round(report.burnout)}</Mono><div className="small mt8">Your energy cap is lower next week. Rest, or end weeks with energy to spare.</div></div>}
      {report.streak >= 2 && <div className="tiny muted mt8" style={{ textAlign: 'center' }}>🔥 {report.streak}-week chart streak</div>}
      {report.events?.length > 1 && <div className="card tight mt12"><Mono>Also this week</Mono>{report.events.slice(1, 4).map((e, i) => <div key={i} className="small mt8">• {e}</div>)}</div>}
      <button className="btn primary block mt24" onClick={onClose}>Continue</button>
    </div>
  );
}
