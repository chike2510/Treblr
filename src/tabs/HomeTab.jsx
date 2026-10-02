import { ERAS, CITIES, GENRES, JOBS, LABELS } from '../data/constants';
import { fmt, fmtN as formatCurrency, getEra, getTimeLabel } from '../engine/utils';
import { getActionPoints } from '../engine/actionPoints';
import { buildTourRoute } from '../engine/cityScene';
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

const PLATFORM_LABELS = [
  ['soundify', 'SFD'],
  ['instapic', 'IN'],
  ['chirp', 'CH'],
  ['vidtube', 'VT'],
  ['rhythmtok', 'RT'],
  ['wavelog', 'WL'],
];

const MOVE_ROUTES = {
  record: ['create', 'record'],
  release: ['create', 'release'],
  catalog: ['create', 'catalog'],
  performance: ['create', 'performance'],
  training: ['create', 'train'],
  jobs: ['create', 'jobs'],
  contracts: ['business', 'industry'],
  tour: ['business', 'tour'],
  money: ['business', 'money'],
  career: ['business', 'overview'],
};

const ROUTE_KEYS = { create: 'music', business: 'career', social: 'news', profile: 'profile' };

const isJobEligible = (job, gs) => {
  if (!job.req) return true;
  if (job.req.startsWith('fans')) return Number(gs.fans || 0) >= Number(job.req.slice(4));
  const requirement = job.req.match(/^([a-z]+)(\d+)$/);
  return requirement ? Number(gs[requirement[1]] || 0) >= Number(requirement[2]) : true;
};

const changeRoute = (patch, gs, tab, route) => {
  const key = ROUTE_KEYS[tab];
  patch({
    tab,
    appRoutes: { ...(gs.appRoutes || {}), ...(key && route ? { [key]: route } : {}) },
  });
};

function DashboardCard({ eyebrow, title, status, className = '', children, action, onAction, actionLabel }) {
  return (
    <article className={`mod-card ${className}`}>
      <div className="mod-card-top"><span>{eyebrow}</span>{status && <span className="mod-card-status">{status}</span>}</div>
      <h2>{title}</h2>
      {children}
      <button type="button" className="mod-card-action" onClick={onAction}>
        {actionLabel || action} <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}

export default function HomeTab({ gs, patch, endWeek, isEndingWeek }) {
  const fmtN = amount => formatCurrency(amount, gs.currency);
  const era = getEra(gs.fans);
  const nextEra = ERAS.find(item => item.minFans > Number(gs.fans || 0));
  const progress = nextEra
    ? Math.max(0, Math.min(100, Math.round((Number(gs.fans || 0) - era.minFans) / Math.max(1, nextEra.minFans - era.minFans) * 100)))
    : 100;
  const city = CITIES.find(item => item.id === gs.city) || CITIES[0];
  const genre = GENRES.find(item => item.id === gs.genre)?.label || gs.genre || 'Music';
  const catalog = Array.isArray(gs.catalog) ? gs.catalog : [];
  const released = catalog.filter(track => track.released);
  const unreleased = catalog.filter(track => !track.released);
  const latest = released.reduce((best, track) => !best || Number(track.releaseWeek || 0) > Number(best.releaseWeek || 0) ? track : best, null);
  const draft = unreleased[0] || null;
  const report = gs.lastWeekReport || gs.weekReport || null;
  const entries = (gs.news || []).slice(0, 3);
  const actions = getActionPoints(gs);
  const weeksUntilRelease = Math.max(0, Number(gs.lastReleaseWeek ?? -99) + 2 - Number(gs.totalWeeks || 0));
  const totalSocial = Object.values(gs.socialPlatforms || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const latestSocialPost = (gs.feed || []).find(item => item?.type === 'social' && item.msg);
  const label = LABELS.find(item => item.id === gs.labelId) || LABELS[0];
  const isSigned = label.id !== 'independent';
  const matchedJobs = JOBS.filter(job => isJobEligible(job, gs));
  const activeTour = Boolean(gs.tourActive && gs.tourData);
  const nextTourStop = activeTour ? (gs.tourData.route || []).find(stop => !Number(stop.attendance || 0)) : null;
  const activeProjectCount = (gs.projects || []).length;
  const routeKey = ROUTE_KEYS;

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
      moves.push({ id: 'performance', destination: 'performance', label: 'Read the latest release', note: latest ? `${latest.title} · ${latest.weeklyHistory?.at(-1) ? `Week ${fmt(latest.weeklyHistory.at(-1).week)} · ${fmt(latest.weeklyHistory.at(-1).streams)} streams` : 'first result arrives at week close'}` : 'Open the live release ledger', cost: 'No AP' });
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

  const openNews = section => changeRoute(patch, gs, 'social', section);

  return (
    <div className="tab-content home-content mod-home-root">
      <div className="mod-home-scroll">
        <header className="mod-home-heading">
          <div className="mod-home-edition"><span>TREBLR <i>/</i> ARTIST DESK</span><span>{getTimeLabel(gs.totalWeeks || 0, gs.startYear)}</span></div>
          <div className="mod-home-title-row">
            <div className="mod-home-avatar"><PlayerAvatar gs={gs} size={40} ring="var(--accent-gold)" /></div>
            <div className="mod-home-title-copy">
              <h1>Home</h1>
              <p>{gs.stageName || 'Your artist'} <i>·</i> {city.label} <i>·</i> {genre}</p>
            </div>
            <span className="mod-home-week">WEEK {String(Number(gs.totalWeeks || 0) + 1).padStart(2, '0')}</span>
          </div>
        </header>

        <section className="mod-dashboard-section" aria-labelledby="career-growth-title">
          <div className="mod-section-heading"><span>MY CAREER DASHBOARD</span><span>CAREER PULSE</span></div>
          <article className="mod-card mod-career-card">
            <div className="mod-career-topline">
              <div><span className="mod-card-kicker">FAN GROWTH</span><h2 id="career-growth-title">{fmt(gs.fans || 0)} <small>fans</small></h2></div>
              <div className={`mod-growth-value${Number(report?.fansDelta || 0) < 0 ? ' is-down' : ''}`}>
                <span>{report ? `${Number(report.fansDelta || 0) > 0 ? '+' : ''}${fmt(report.fansDelta || 0)}` : '—'}</span>
                <small>{report ? 'LAST WEEK' : 'WEEKLY CHANGE'}</small>
              </div>
            </div>
            <div className="mod-era-label"><strong>{nextEra ? nextEra.label.replace(' Era', '') : 'Top fan tier reached'}</strong><span>{nextEra ? `${fmt(Math.max(0, nextEra.minFans - Number(gs.fans || 0)))} to go` : 'Maximum career milestone'}</span></div>
            <div className="mod-progress-track" role="progressbar" aria-label={`Progress to ${nextEra?.label || 'the highest era'}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            <div className="mod-career-foot"><span>{era.label.replace(' Era', '')}</span><span>{nextEra ? `${progress}% OF NEXT TIER` : 'LEGACY'}</span></div>
            <div className="mod-mini-stats"><div><span>LIFETIME STREAMS</span><strong>{fmt(gs.totalLifetimeStreams || 0)}</strong></div><div><span>REPUTATION</span><strong>{Math.round(gs.reputation ?? 50)}<small>/100</small></strong></div><div><span>RELEASES</span><strong>{released.length}</strong></div></div>
          </article>
        </section>

        <section className="mod-dashboard-section" aria-label="Career operations">
          <div className="mod-section-heading"><span>CAREER OPERATIONS</span><span>LIVE STATUS</span></div>
          <div className="mod-card-grid">
            <DashboardCard eyebrow="CURRENT DEAL" title={label.name} status={isSigned ? `${gs.contractWeeksLeft || 0} WEEKS LEFT` : 'INDEPENDENT'} className="mod-deal-card" actionLabel="OPEN CONTRACTS" onAction={() => goTo('contracts')}>
              <p className="mod-card-copy">{isSigned ? `${label.artistSplit}% artist share · ${Math.round(gs.creativeControl ?? label.creativeControl)}% creative control` : 'Self-released · full ownership retained'}</p>
              {isSigned ? <div className="mod-detail-pair"><span>Due this week</span><strong>{gs.contractObligations?.postsDue || 0} posts <i>·</i> {gs.contractObligations?.singlesDue || 0} singles</strong></div> : <div className="mod-detail-pair"><span>Deal status</span><strong>No label obligations</strong></div>}
              <div className="mod-card-note">{isSigned ? `${label.tierLabel} · ${label.desc}` : 'Review label offers and terms in the Industry hub.'}</div>
            </DashboardCard>

            <DashboardCard eyebrow="TOUR TRACKER" title={activeTour ? gs.tourData.label : 'No tour booked'} status={activeTour ? 'ON THE ROAD' : 'READY WHEN YOU ARE'} className="mod-tour-card" actionLabel="VIEW TOUR DESK" onAction={() => goTo('tour')}>
              {activeTour ? <>
                <div className="mod-tour-next"><span>NEXT STOP</span><strong>{nextTourStop?.city || 'Final stop complete'}</strong></div>
                <p className="mod-card-copy">{gs.tourWeeksLeft} week{gs.tourWeeksLeft === 1 ? '' : 's'} remaining <i>·</i> projected {fmtN(gs.tourData.revenue || 0)}</p>
              </> : <>
                <div className="mod-tour-next"><span>HOME MARKET</span><strong>{city.label}</strong></div>
                <p className="mod-card-copy">Compare eligible routes, booking costs and modeled attendance.</p>
              </>}
            </DashboardCard>

            <DashboardCard eyebrow="STUDIO WORKSHOP" title={draft ? 'A track is in the vault' : latest ? 'Latest release' : 'Start a session'} status={draft ? `${unreleased.length} UNRELEASED` : `${catalog.length} TRACK${catalog.length === 1 ? '' : 'S'}`} className="mod-studio-card" actionLabel={draft ? 'PLAN A RELEASE' : 'OPEN THE STUDIO'} onAction={() => goTo(draft ? 'release' : 'record')}>
              <div className="mod-studio-record"><span className="mod-record-mark" aria-hidden="true">♫</span><div><strong>{draft?.title || latest?.title || 'Your first record'}</strong><span>{draft ? `Recorded · quality ${draft.quality}/100` : latest ? `${latest.releaseType || 'Single'} · quality ${latest.quality}/100` : 'Choose a producer and build your sound.'}</span></div></div>
              <div className="mod-detail-pair"><span>Released projects</span><strong>{activeProjectCount}</strong></div>
            </DashboardCard>

            <DashboardCard eyebrow="CONTRACTS & JOBS" title={gs.activeJob ? 'Work in progress' : 'Open job board'} status={gs.activeJob ? 'ACTIVE' : `${matchedJobs.length} MATCHING`} className="mod-jobs-card" actionLabel="VIEW AVAILABLE JOBS" onAction={() => goTo('jobs')}>
              {gs.activeJob ? <>
                <p className="mod-job-title">{gs.activeJob.label}</p>
                <div className="mod-detail-pair"><span>{gs.activeJob.weeksLeft} week{gs.activeJob.weeksLeft === 1 ? '' : 's'} remaining</span><strong>{fmtN(gs.activeJob.weeklyPay || 0)} / wk</strong></div>
              </> : <>
                <p className="mod-card-copy">Listings that meet your current fan and skill requirements.</p>
                <div className="mod-detail-pair"><span>Board listings</span><strong>{JOBS.length}</strong></div>
              </>}
            </DashboardCard>
          </div>
        </section>

        <section className="mod-dashboard-section" aria-label="Audience and cash overview">
          <div className="mod-section-heading"><span>OFF-STAGE SNAPSHOT</span><span>THIS WEEK</span></div>
          <div className="mod-card-grid">
            <DashboardCard eyebrow="SOCIAL ENGAGEMENT" title={`${fmt(totalSocial)} total audience`} status="6 PLATFORMS" className="mod-social-card" actionLabel="MANAGE YOUR FEED" onAction={() => openNews('community')}>
              <div className="mod-platform-grid">{PLATFORM_LABELS.map(([key, label]) => <div key={key}><span>{label}</span><strong>{fmt((gs.socialPlatforms || {})[key] || 0)}</strong></div>)}</div>
              <p className="mod-card-note mod-post-note">{latestSocialPost ? `Latest post · ${latestSocialPost.msg}` : 'No posts recorded yet. Per-post likes and comments are not modeled.'}</p>
            </DashboardCard>

            <DashboardCard eyebrow="FINANCIALS" title={fmtN(gs.money || 0)} status="CASH BALANCE" className="mod-finance-card" actionLabel="OPEN FINANCES" onAction={() => goTo('money')}>
              <p className="mod-finance-caption">Available cash</p>
              <div className="mod-detail-pair"><span>Last week income</span><strong>{report ? fmtN(report.revenue || 0) : '—'}</strong></div>
              <div className="mod-detail-pair"><span>Tax set aside</span><strong>{fmtN(gs.taxAccum || 0)}</strong></div>
            </DashboardCard>
          </div>
        </section>

        <section className="mod-dashboard-section mod-activity-section" aria-labelledby="home-activity-title">
          <div className="mod-section-heading"><span id="home-activity-title">RECENT ACTIVITY &amp; LOGS</span><span>{(gs.news || []).length} ENTRIES</span></div>
          <article className="mod-card mod-activity-card">
            {entries.length ? <ol className="mod-activity-list">{entries.map((item, index) => <li key={`${item.week ?? 0}-${index}-${item.msg}`}>
              <span className="mod-activity-dot" style={{ background: TYPE_COLORS[item.type] || TYPE_COLORS[''] }} />
              <span className="mod-activity-copy"><strong>{TYPE_LABELS[item.type] || 'JOURNAL'} <i>·</i> {item.week == null ? 'CAREER LOG' : `WEEK ${item.week}`}</strong><span>{item.msg}</span></span>
            </li>)}</ol> : <p className="mod-empty-state">Career milestones, releases and press updates will appear here as they happen.</p>}
            <button type="button" className="mod-card-action" onClick={() => openNews('inbox')}>OPEN CAREER LOG <span aria-hidden="true">↗</span></button>
          </article>
        </section>

        <section className="mod-dashboard-section mod-next-section" aria-labelledby="home-next-move-title">
          <div className="mod-section-heading"><span id="home-next-move-title">YOUR NEXT MOVE</span><span>{actions} ACTION{actions === 1 ? '' : 'S'} LEFT</span></div>
          <div className="mod-move-list">{moves.slice(0, 3).map((move, index) => <button type="button" className="mod-move" key={move.id} onClick={() => goTo(move.destination)}>
            <span className="mod-move-number">0{index + 1}</span>
            <span className="mod-move-copy"><strong>{move.label}</strong><small>{move.note}</small></span>
            <span className="mod-move-cost">{move.cost}</span><span className="mod-move-arrow" aria-hidden="true">↗</span>
          </button>)}</div>
        </section>
      </div>

      <footer className="mod-close-week">
        <button type="button" className="mod-end-week" aria-label={isEndingWeek ? 'SETTLING WEEK' : 'END WEEK'} onClick={endWeek} disabled={isEndingWeek}>
          <span>{isEndingWeek ? 'SETTLING THE WEEK…' : 'CLOSE THE WEEK'}</span>{!isEndingWeek && <span aria-hidden="true">→</span>}
        </button>
        <p>Releases, work, touring and finances settle when the week closes.</p>
      </footer>
    </div>
  );
}
