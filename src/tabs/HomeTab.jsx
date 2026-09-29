import { ERAS, CITIES, GENRES } from '../data/constants';
import { fmt, fmtN as formatCurrency, getEra, getTimeLabel } from '../engine/utils';
import { getActionPoints } from '../engine/actionPoints';
import { PlayerAvatar } from '../components/Living';

const TYPE_LABELS = {
  pos: 'CAREER UPDATE',
  neg: 'RISK / FINANCE',
  milestone: 'MILESTONE',
  npc: 'INDUSTRY',
  '': 'JOURNAL',
};

const TYPE_COLORS = {
  pos: 'var(--accent-green)',
  neg: 'var(--accent-red)',
  milestone: 'var(--accent-gold-lt)',
  npc: 'var(--text-secondary)',
  '': 'var(--text-muted)',
};

const MOVE_ROUTES = {
  record: ['create', 'record'],
  release: ['create', 'release'],
  catalog: ['create', 'catalog'],
  performance: ['create', 'performance'],
  training: ['create', 'train'],
  jobs: ['create', 'jobs'],
  tour: ['business', 'tour'],
  money: ['business', 'money'],
  career: ['business', 'overview'],
};

export default function HomeTab({ gs, patch, endWeek, isEndingWeek }) {
  const fmtN = (amount) => formatCurrency(amount, gs.currency);
  const era = getEra(gs.fans);
  const nextEra = ERAS.find(item => item.minFans > Number(gs.fans || 0));
  const progress = nextEra
    ? Math.max(0, Math.min(100, Math.round((Number(gs.fans || 0) - era.minFans) / Math.max(1, nextEra.minFans - era.minFans) * 100)))
    : 100;
  const city = CITIES.find(item => item.id === gs.city) || CITIES[0];
  const genre = GENRES.find(item => item.id === gs.genre)?.label || gs.genre || 'Music';
  const released = (gs.catalog || []).filter(track => track.released);
  const unreleased = (gs.catalog || []).filter(track => !track.released);
  const latest = released.reduce((best, track) => !best || Number(track.releaseWeek || 0) > Number(best.releaseWeek || 0) ? track : best, null);
  const latestSample = latest?.weeklyHistory?.at(-1) || null;
  const report = gs.lastWeekReport || null;
  const entries = (gs.news || []).slice(0, 3);
  const actions = getActionPoints(gs);
  const weeksUntilRelease = Math.max(0, Number(gs.lastReleaseWeek ?? -99) + 2 - Number(gs.totalWeeks || 0));
  const routeKey = { create: 'music', business: 'career', social: 'news', profile: 'profile' };

  const goTo = (destination) => {
    const [tab, route] = MOVE_ROUTES[destination] || ['business', 'overview'];
    const key = routeKey[tab];
    patch({ tab, appRoutes: { ...(gs.appRoutes || {}), ...(key ? { [key]: route } : {}) } });
  };

  const moves = [];
  if (gs.inPrison) {
    moves.push({ id: 'rest', destination: 'training', label: 'Rest and recover', note: `${gs.prisonWeeksLeft || 0} week${gs.prisonWeeksLeft === 1 ? '' : 's'} remaining · only rest is available`, cost: '+40 energy · 1 AP' });
  } else {
    if (unreleased.length) {
      moves.push({ id: 'release', destination: 'release', label: `Plan a release${unreleased.length > 1 ? ` · ${unreleased.length} in the vault` : ''}`, note: weeksUntilRelease ? `Release cooldown · ${weeksUntilRelease} week${weeksUntilRelease === 1 ? '' : 's'} remaining` : 'Choose the campaign tier and review its actual effects', cost: '1 AP' });
    } else if (!released.length) {
      moves.push({ id: 'record', destination: 'record', label: 'Record the first track', note: 'Choose a producer and optional feature in the Studio', cost: '1 AP · 25 energy · fee varies' });
    } else {
      moves.push({ id: 'performance', destination: 'performance', label: 'Review release performance', note: latest ? `Latest: ${latest.title} · ${latestSample ? `Week ${latestSample.week} streams` : 'first result arrives at week close'}` : 'Open the live release ledger', cost: 'No AP' });
    }
    if (gs.activeJob) {
      moves.push({ id: 'job', destination: 'jobs', label: 'Check active work', note: `${gs.activeJob.label} · ${gs.activeJob.weeksLeft} week${gs.activeJob.weeksLeft === 1 ? '' : 's'} left`, cost: `${fmtN(gs.activeJob.weeklyPay || 0)}/week` });
    } else {
      moves.push({ id: 'job', destination: 'jobs', label: 'Compare available work', note: 'Weekly pay, duration, requirements and risk are shown before you accept', cost: '1 AP to take a job' });
    }
    if (Number(gs.energy || 0) < 85) {
      moves.push({ id: 'train', destination: 'training', label: 'Train or take a rest day', note: 'Skill training is +3; genre mastery is +2', cost: '1 AP · 15 energy to train' });
    } else {
      moves.push({ id: 'money', destination: 'money', label: 'Review the weekly cash ledger', note: report ? `Last settled · Week ${report.week}` : 'Your first statement arrives when a week closes', cost: 'No AP' });
    }
  }

  return (
    <div className="tab-content home-content">
      <div className="home-scroll">
      <header className="home-edition">
        <div className="home-edition-meta">
          <span>CAREER BRIEFING</span>
          <span>{getTimeLabel(gs.totalWeeks || 0, gs.startYear)}</span>
        </div>
        <h1>The week in your career</h1>
        <p>Week {Number(gs.totalWeeks || 0) + 1} · {city.label} · {genre}</p>
      </header>

      <section className="home-dossier" aria-label="Career identity and progression">
        <PlayerAvatar gs={gs} size={58} ring="var(--accent-gold)" />
        <div className="home-dossier-copy">
          <span className="home-dossier-kicker">CURRENT CHAPTER</span>
          <strong>{era.label}</strong>
          <span>{genre} · {city.label}</span>
        </div>
        <div className="home-dossier-fans">
          <strong>{fmt(gs.fans || 0)}</strong>
          <span>fans</span>
        </div>
      </section>

      <section className="home-milestone" aria-label="Career milestone progress">
        <div className="home-section-heading">
          <span>THE NEXT MILESTONE</span>
          <span>{nextEra ? `${progress}%` : 'REACHED'}</span>
        </div>
        <div className="home-milestone-title">
          <strong>{nextEra ? nextEra.label : 'Highest fan tier'}</strong>
          <span>{nextEra ? `${fmt(Math.max(0, nextEra.minFans - Number(gs.fans || 0)))} fans to go` : 'Your fan-based progression is complete.'}</span>
        </div>
        {nextEra && <div className="home-progress-track" role="progressbar" aria-label={`Progress to ${nextEra.label}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
      </section>

      <section className="home-signal" aria-labelledby="home-signal-title">
        <div className="home-section-heading"><span>CAREER SIGNAL</span><span>{latest ? `RELEASE · WEEK ${latest.releaseWeek ?? '—'}` : 'THE NEXT RECORD'}</span></div>
        {latest ? (
          <button type="button" className="home-release-lead" onClick={() => goTo('performance')}>
            <span className="home-release-art">{latest.coverArt ? <img src={latest.coverArt} alt={`${latest.title} cover`} /> : <span>{latest.title?.slice(0, 1) || 'T'}</span>}</span>
            <span className="home-release-copy">
              <strong id="home-signal-title">{latest.title}</strong>
              <span>{GENRES.find(item => item.id === latest.genre)?.label || latest.genre || genre} · Quality {latest.quality}</span>
              <span className="home-release-stat">{fmt(latest.lifetimeStreams || latest.streams || 0)} lifetime streams · {latestSample ? `Week ${latestSample.week}: ${fmt(latestSample.streams)} streams` : 'First weekly result arrives when the week closes'}</span>
            </span>
            <span className="home-arrow" aria-hidden="true">↗</span>
          </button>
        ) : (
          <div className="home-release-empty">
            <div>
              <strong id="home-signal-title">Nothing released yet.</strong>
              <span>{unreleased.length ? `${unreleased.length} recorded track${unreleased.length === 1 ? '' : 's'} waiting in the vault.` : 'Start with a recording session to put a track in the vault.'}</span>
            </div>
            <button type="button" onClick={() => goTo(unreleased.length ? 'release' : 'record')}>{unreleased.length ? 'PLAN RELEASE' : 'OPEN STUDIO'} <span aria-hidden="true">→</span></button>
          </div>
        )}
      </section>

      <section className="home-weekly-record" aria-labelledby="home-weekly-title">
        <div className="home-section-heading"><span id="home-weekly-title">THIS WEEK</span><span>{report ? `LAST SETTLED · WEEK ${report.week}` : 'JOURNAL'}</span></div>
        {report && (
          <div className="home-settled-row">
            <span>Last settled week</span>
            <span>{fmt(report.fansDelta || 0)} fans · {fmt(report.streamCount || 0)} streams</span>
            <strong>{fmtN(report.revenue || 0)} income</strong>
          </div>
        )}
        {(gs.tourActive && gs.tourData) && <div className="home-obligation"><span className="home-obligation-type">TOUR</span><span>{gs.tourData.label} · {gs.tourWeeksLeft} week{gs.tourWeeksLeft === 1 ? '' : 's'} left</span></div>}
        {gs.activeJob && <div className="home-obligation"><span className="home-obligation-type">WORK</span><span>{gs.activeJob.label} · {fmtN(gs.activeJob.weeklyPay || 0)}/week</span></div>}
        {gs.labelId && gs.labelId !== 'independent' && <div className="home-obligation"><span className="home-obligation-type">CONTRACT</span><span>{gs.contractWeeksLeft || 0} weeks remaining · {gs.contractObligations?.postsDue || 0} posts due this week</span></div>}
        {entries.length ? (
          <ol className="home-journal-list">
            {entries.map((item, index) => <li key={`${item.week ?? 0}-${index}-${item.msg}`}>
              <span className="home-journal-mark" style={{ background: TYPE_COLORS[item.type] || TYPE_COLORS[''] }} />
              <span className="home-journal-copy"><strong>{TYPE_LABELS[item.type] || 'JOURNAL'} · WEEK {item.week ?? '—'}</strong><span>{item.msg}</span></span>
            </li>)}
          </ol>
        ) : <p className="home-empty-copy">Your career log will record in-game events as they happen.</p>}
        <button type="button" className="home-text-link" onClick={() => patch({ tab: 'social', appRoutes: { ...(gs.appRoutes || {}), news: 'wire' } })}>READ THE WIRE <span aria-hidden="true">→</span></button>
      </section>

      <section className="home-next-moves" aria-labelledby="home-moves-title">
        <div className="home-section-heading"><span id="home-moves-title">NEXT MOVE</span><span>{actions} ACTION{actions === 1 ? '' : 'S'} LEFT</span></div>
        <div className="home-move-list">
          {moves.slice(0, 3).map((move, index) => <button type="button" className="home-move" key={move.id} onClick={() => goTo(move.destination)}>
            <span className="home-move-number">0{index + 1}</span>
            <span className="home-move-copy"><strong>{move.label}</strong><small>{move.note}</small></span>
            <span className="home-move-cost">{move.cost}</span>
            <span className="home-arrow" aria-hidden="true">→</span>
          </button>)}
        </div>
      </section>
      </div>

      <div className="home-close-week">
        <button type="button" className="home-end-week" onClick={endWeek} disabled={isEndingWeek}>
          <span>{isEndingWeek ? 'SETTLING THE WEEK…' : 'END WEEK'}</span>
          {!isEndingWeek && <span aria-hidden="true">→</span>}
        </button>
        <p>Weekly releases, work, touring and finances settle when the week closes.</p>
      </div>
    </div>
  );
}
