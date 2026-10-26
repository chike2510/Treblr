import { useGame, Mono, CountFrom } from '../ui/kit.jsx';
import { MagazineCover } from './Report.jsx';
import { fmtNum, fmtMoney } from '../engine/index.js';

export default function Reveal({ report, onClose }) {
  const { state } = useGame();
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
              <b style={{ color: m.p == null ? '#FFB020' : m.p > m.r ? '#3DDC84' : m.p < m.r ? '#FF4D5E' : '#9A9AA5' }}>{m.p == null ? 'NEW' : m.p > m.r ? `▲${m.p - m.r}` : m.p < m.r ? `▼${m.r - m.p}` : '—'}</b>
            </div>
          ))}
        </div>
      )}
      {report.goals?.length > 0 && <div className="card tight mt12" style={{ borderColor: 'rgba(198,255,61,.4)' }}><Mono style={{ color: '#C6FF3D' }}>Milestone unlocked</Mono><div className="mt8">{report.goals.join(' · ')}</div></div>}
      {report.events?.length > 1 && <div className="card tight mt12"><Mono>Also this week</Mono>{report.events.slice(1, 4).map((e, i) => <div key={i} className="small mt8">• {e}</div>)}</div>}
      <button className="btn primary block mt24" onClick={onClose}>Continue</button>
    </div>
  );
}
