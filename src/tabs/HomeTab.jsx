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
  const fmtN = amount => formatCurrency(amount, gs.currency);
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
  const featured = latest || unreleased[0] || null;
  const latestSample = latest?.weeklyHistory?.at(-1) || null;
  const report = gs.lastWeekReport || null;
  const entries = (gs.news || []).slice(0, 3);
  const actions = getActionPoints(gs);
  const weeksUntilRelease = Math.max(0, Number(gs.lastReleaseWeek ?? -99) + 2 - Number(gs.totalWeeks || 0));
  const routeKey = { create: 'music', business: 'career', social: 'news', profile: 'profile' };

  const goTo = destination => {
    const [tab, route] = MOVE_ROUTES[destination] || ['business', 'overview'];
    const key = routeKey[tab];
    patch({ tab, appRoutes: { ...(gs.appRoutes || {}), ...(key ? { [key]: route } : {}) } });
  };

  const moves = [];
  if (gs.inPrison) {
    moves.push({ id: 'rest', destination: 'training', label: 'Rest and recover', note: `${gs.prisonWeeksLeft || 0} weeks remaining · only rest is available`, cost: '+40 energy · 1 AP' });
  } else {
    if (unreleased.length) {
      moves.push({ id: 'release', destination: 'release', label: 'Shape the next release', note: weeksUntilRelease ? `Release cooldown · ${weeksUntilRelease} week${weeksUntilRelease === 1 ? '' : 's'} remaining` : 'Choose a campaign and review its modeled cost', cost: '1 AP' });
    } else if (!released.length) {
      moves.push({ id: 'record', destination: 'record', label: 'Record your first track', note: 'Choose a producer and optional feature in the Studio', cost: '1 AP · 25 energy' });
    } else {
      moves.push({ id: 'performance', destination: 'performance', label: 'Read the latest release', note: latest ? `${latest.title} · ${latestSample ? `Week ${latestSample.week} streams` : 'first result arrives at week close'}` : 'Open the live release ledger', cost: 'No AP' });
    }
    if (gs.activeJob) {
      moves.push({ id: 'job', destination: 'jobs', label: 'Check your current work', note: `${gs.activeJob.label} · ${gs.activeJob.weeksLeft} week${gs.activeJob.weeksLeft === 1 ? '' : 's'} left`, cost: `${fmtN(gs.activeJob.weeklyPay || 0)}/week` });
    } else {
      moves.push({ id: 'job', destination: 'jobs', label: 'Compare paid work', note: 'See weekly pay, duration, requirements and risk before accepting', cost: '1 AP to take a job' });
    }
    moves.push(Number(gs.energy || 0) < 85
      ? { id: 'train', destination: 'training', label: 'Train or take a rest day', note: 'Training improves a skill; resting restores energy', cost: '1 AP · 15 energy to train' }
      : { id: 'money', destination: 'money', label: 'Read the cash ledger', note: report ? `Last settled · Week ${report.week}` : 'Your first statement arrives when a week closes', cost: 'No AP' });
  }

  return (
    <div className="tab-content home-content home-page">
      <div className="home-scroll">
        <header className="home-edition">
          <div className="home-edition-meta"><span>THE ARTIST’S DESK</span><span>{getTimeLabel(gs.totalWeeks || 0, gs.startYear)}</span></div>
          <h1>The week you make the move.</h1>
          <p>Week {Number(gs.totalWeeks || 0) + 1} <span>·</span> {city.label} <span>·</span> {genre}</p>
        </header>

        <section className="home-artist-hero" aria-label="Artist identity">
          <div className="home-artist-portrait"><PlayerAvatar gs={gs} size={76} ring="var(--scene-accent)" /></div>
          <div className="home-artist-copy">
            <span className="home-artist-kicker">CURRENT CHAPTER</span>
            <h2>{gs.stageName || 'Your artist name'}</h2>
            <p>{era.label.replace(' Era', '')} <span>·</span> {genre}</p>
            <span className="home-artist-place">{city.label.toUpperCase()} / INDEPENDENT CAREER</span>
          </div>
          <div className="home-artist-issue">{String(Number(gs.totalWeeks || 0) + 1).padStart(2, '0')}<small>WEEK</small></div>
        </section>

        <section className="home-scoreline" aria-label="Recorded career indicators">
          <div><span>FANBASE</span><strong>{fmt(gs.fans || 0)}</strong></div>
          <div><span>LIFETIME STREAMS</span><strong>{fmt(gs.totalLifetimeStreams || 0)}</strong></div>
          <div><span>REPUTATION</span><strong>{Math.round(gs.reputation ?? 50)}<small>/100</small></strong></div>
        </section>

        <section className="home-milestone" aria-label="Career milestone progress">
          <div className="home-section-heading"><span>THE NEXT MILESTONE</span><span>{nextEra ? `${progress}%` : 'REACHED'}</span></div>
          <div className="home-milestone-title">
            <strong>{nextEra ? nextEra.label.replace(' Era', '') : 'All fan-based eras reached'}</strong>
            <span>{nextEra ? `${fmt(Math.max(0, nextEra.minFans - Number(gs.fans || 0)))} fans to go` : 'The highest fan tier is yours.'}</span>
          </div>
          <div className="home-era-track" role="progressbar" aria-label={`Progress to ${nextEra?.label || 'the highest era'}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            {ERAS.map((step, index) => <span key={step.label} className={index <= ERAS.indexOf(era) ? 'is-past' : ''} />)}
            {nextEra && <i style={{ left: `${progress}%` }} />}
          </div>
        </section>

        <section className="home-signal" aria-labelledby="home-signal-title">
          <div className="home-section-heading"><span>THE RECORD</span><span>{latest ? 'IN ROTATION' : featured ? 'IN THE VAULT' : 'STUDIO NEXT'}</span></div>
          {featured ? (
            <div className="home-feature-record">
              <button type="button" className="home-record-art" onClick={() => goTo(latest ? 'performance' : featured.released ? 'catalog' : 'release')} aria-label={`Open ${featured.title}`}>
                {featured.coverArt ? <img src={featured.coverArt} alt={`${featured.title} cover art`} /> : <span className="home-record-glyph" aria-hidden="true"><i /></span>}
                <span className="home-record-index">SIDE A</span>
              </button>
              <div className="home-record-copy">
                <span className="home-record-status">{latest ? 'LATEST RELEASE' : 'NEXT RELEASE'}</span>
                <strong id="home-signal-title">{featured.title}</strong>
                <span>{GENRES.find(item => item.id === featured.genre)?.label || featured.genre || genre} <i>·</i> Quality {featured.quality}</span>
                {latest
                  ? <span className="home-record-stat">{fmt(latest.lifetimeStreams || latest.streams || 0)} lifetime streams{latestSample ? ` · ${fmt(latestSample.streams)} this week` : ''}</span>
                  : <span className="home-record-stat">Recorded · {featured.released ? 'released' : 'not yet released'}</span>}
                <button type="button" className="home-record-action" onClick={() => goTo(latest ? 'performance' : 'release')}>
                  {latest ? 'OPEN PERFORMANCE' : 'PLAN RELEASE'} <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="home-first-session">
              <div className="home-soundmark" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
              <div><strong>Nothing in the vault. Yet.</strong><p>Your first recording is one decision away.</p></div>
              <button type="button" onClick={() => goTo('record')}>OPEN STUDIO <span aria-hidden="true">→</span></button>
            </div>
          )}
        </section>

        <section className="home-weekly-record" aria-labelledby="home-weekly-title">
          <div className="home-section-heading"><span id="home-weekly-title">THIS WEEK, ON RECORD</span><span>{report ? `SETTLED · WK ${report.week}` : 'CAREER JOURNAL'}</span></div>
          {report && <div className="home-settled-row"><span>Last statement</span><span>{fmt(report.fansDelta || 0)} fans <i>·</i> {fmt(report.streamCount || 0)} streams</span><strong>{fmtN(report.revenue || 0)} in</strong></div>}
          {(gs.tourActive && gs.tourData) && <div className="home-obligation"><span className="home-obligation-type">TOUR</span><span>{gs.tourData.label} · {gs.tourWeeksLeft} week{gs.tourWeeksLeft === 1 ? '' : 's'} left</span></div>}
          {gs.activeJob && <div className="home-obligation"><span className="home-obligation-type">WORK</span><span>{gs.activeJob.label} · {fmtN(gs.activeJob.weeklyPay || 0)}/week</span></div>}
          {gs.labelId && gs.labelId !== 'independent' && <div className="home-obligation"><span className="home-obligation-type">CONTRACT</span><span>{gs.contractWeeksLeft || 0} weeks remaining · {gs.contractObligations?.postsDue || 0} posts due</span></div>}
          {entries.length ? <ol className="home-journal-list">{entries.map((item, index) => <li key={`${item.week ?? 0}-${index}-${item.msg}`}>
            <span className="home-journal-mark" style={{ background: TYPE_COLORS[item.type] || TYPE_COLORS[''] }} />
            <span className="home-journal-copy"><strong>{TYPE_LABELS[item.type] || 'JOURNAL'} <i>·</i> WEEK {item.week ?? '—'}</strong><span>{item.msg}</span></span>
          </li>)}</ol> : <p className="home-empty-copy">Your career log will record real simulation events as they happen.</p>}
          <button type="button" className="home-text-link" onClick={() => patch({ tab: 'social', appRoutes: { ...(gs.appRoutes || {}), news: 'wire' } })}>OPEN THE WIRE <span aria-hidden="true">→</span></button>
        </section>

        <section className="home-next-moves" aria-labelledby="home-moves-title">
          <div className="home-section-heading"><span id="home-moves-title">YOUR NEXT MOVE</span><span>{actions} ACTION{actions === 1 ? '' : 'S'} LEFT</span></div>
          <div className="home-move-list">{moves.slice(0, 3).map((move, index) => <button type="button" className="home-move" key={move.id} onClick={() => goTo(move.destination)}>
            <span className="home-move-number">0{index + 1}</span>
            <span className="home-move-copy"><strong>{move.label}</strong><small>{move.note}</small></span>
            <span className="home-move-cost">{move.cost}</span><span className="home-arrow" aria-hidden="true">↗</span>
          </button>)}</div>
        </section>
      </div>

      <div className="home-close-week">
        <button type="button" className="home-end-week" aria-label={isEndingWeek ? 'SETTLING WEEK' : 'END WEEK'} onClick={endWeek} disabled={isEndingWeek}>
          <span>{isEndingWeek ? 'SETTLING THE WEEK…' : 'CLOSE THE WEEK'}</span>{!isEndingWeek && <span aria-hidden="true">→</span>}
        </button>
        <p>Releases, work, touring and finances settle when the week closes.</p>
      </div>
    </div>
  );
}
