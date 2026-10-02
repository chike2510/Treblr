import { JOBS } from '../data/constants';
import { addNews } from '../engine/weekEngine';
import { canSpendActionPoint, spendActionPoints } from '../engine/actionPoints';
import { fmt, fmtN as formatCurrency } from '../engine/utils';
import { SectionLabel } from './Living';

export function JobsView({ gs, patchFn, showToast }) {
  const fmtN = amount => formatCurrency(amount, gs.currency);
  const eligibleFor = job => {
    if (!job.req) return true;
    if (job.req.startsWith('fans')) return Number(gs.fans || 0) >= Number(job.req.slice(4));
    const match = job.req.match(/^([a-z]+)(\d+)$/);
    return match ? Number(gs[match[1]] || 0) >= Number(match[2]) : true;
  };
  const startJob = job => {
    if (!canSpendActionPoint(gs)) { showToast('No action points left this week'); return; }
    if (gs.activeJob) { showToast('Finish your current job first'); return; }
    if (gs.inPrison) { showToast('You cannot work while in prison'); return; }
    if (!eligibleFor(job)) { showToast('Requirements not met'); return; }
    patchFn(prev => {
      if (prev.activeJob || prev.inPrison) return prev;
      const acted = spendActionPoints(prev);
      if (!acted) return prev;
      const activeJob = { jobId:job.id, label:job.label, weeklyPay:job.weeklyPay, weeksLeft:job.duration, totalDuration:job.duration, energyPerWeek:job.energyPerWeek, illegal:job.illegal || false, prisonRisk:job.prisonRisk || 0, prisonWeeks:job.prisonWeeks || 0 };
      const next = { ...acted, activeJob, news:addNews(prev.news, `Started "${job.label}" · ${fmtN(job.weeklyPay)}/wk for ${job.duration} weeks`, 'pos', prev.totalWeeks) };
      for (const [key, value] of Object.entries(job.skillGain || {})) next[key] = Math.min(100, Number(prev[key] || 0) + value);
      return next;
    });
    showToast(`Started: ${job.label}`);
  };
  const quitJob = () => {
    if (!gs.activeJob) return;
    if (!canSpendActionPoint(gs)) { showToast('No action points left this week'); return; }
    patchFn(prev => {
      if (!prev.activeJob) return prev;
      const acted = spendActionPoints(prev);
      return acted ? { ...acted, activeJob:null, news:addNews(prev.news, `Quit "${prev.activeJob.label}" early.`, 'neg', prev.totalWeeks) } : prev;
    });
    showToast('Job quit');
  };
  const canAct = canSpendActionPoint(gs) && !gs.inPrison;
  const renderJob = (job, index) => {
    const unlocked = eligibleFor(job);
    const isActive = gs.activeJob?.jobId === job.id;
    const disabled = !canAct || !!gs.activeJob || !unlocked;
    return <article key={job.id} className={`contract-job${job.illegal ? ' is-risky' : ''}`}>
      <div className="contract-job-head"><div><span>{job.illegal ? 'HIGH RISK' : `LISTING ${String(index + 1).padStart(2, '0')}`}</span><strong>{job.label}</strong></div><b>{fmtN(job.weeklyPay)}<small>/ WEEK</small></b></div>
      <p>{job.desc}</p>
      <div className="contract-job-meta"><span>{job.duration} weeks</span><span>−{job.energyPerWeek} energy / week</span>{job.illegal && <span>{Math.round((job.prisonRisk || 0) * 100)}% arrest risk / week</span>}</div>
      {job.req && !unlocked && <small className="contract-job-lock">Requires {job.req.startsWith('fans') ? `${fmt(Number(job.req.slice(4)))} fans` : job.req.replace(/([a-z]+)(\d+)/i, (_, key, value) => `${key.toUpperCase()} ${value}`)}.</small>}
      {job.skillGain && <small className="contract-job-bonus">Start bonus · {Object.entries(job.skillGain).map(([key, value]) => `+${value} ${key.toUpperCase()}`).join(' · ')}</small>}
      {job.illegal && <small className="contract-job-lock">If arrested · {job.prisonWeeks} weeks in prison and 15% of cash lost.</small>}
      <button type="button" disabled={disabled} onClick={() => startJob(job)}>{isActive ? 'ACTIVE CONTRACT' : disabled ? gs.activeJob ? 'FINISH ACTIVE JOB FIRST' : !unlocked ? 'REQUIREMENTS NOT MET' : 'UNAVAILABLE THIS WEEK' : 'ACCEPT · 1 ACTION POINT'}</button>
    </article>;
  };
  const active = gs.activeJob;
  const progress = active ? Math.max(0, Math.min(100, Math.round(((Number(active.totalDuration || 0) - Number(active.weeksLeft || 0)) / Math.max(1, Number(active.totalDuration || 0))) * 100))) : 0;
  return <section className="contracts-jobs-view" aria-label="Available jobs">
    <div className="contracts-desk-intro"><span>PAID WORK · SIMULATED CONTRACTS</span><p>Accept one job at a time. Weekly pay and energy costs settle through the existing week-close simulation.</p></div>
    {active && <article className="contract-active-job"><div className="contract-job-head"><div><span>ACTIVE JOB</span><strong>{active.label}</strong></div><b>{fmtN(active.weeklyPay || 0)}<small>/ WEEK</small></b></div><div className="contract-job-progress"><span style={{ width:`${progress}%` }}/></div><div className="contract-job-meta"><span>{active.weeksLeft} weeks remaining</span><span>−{active.energyPerWeek || 0} energy / week</span></div>{active.illegal && <p className="contract-job-lock">High risk: {Math.round((active.prisonRisk || 0) * 100)}% arrest risk per week.</p>}<button type="button" disabled={!canSpendActionPoint(gs)} onClick={quitJob}>QUIT · 1 ACTION POINT (LOSE REMAINING PAY)</button></article>}
    {gs.inPrison && <div className="contract-prison-note">You cannot accept work while in prison. {gs.prisonWeeksLeft || 0} weeks remaining.</div>}
    {!active && !gs.inPrison && <div className="contract-job-capacity">One active job at a time <i>·</i> {canSpendActionPoint(gs) ? '1 action point available' : 'No action points remaining this week'}</div>}
    <SectionLabel>Legal listings</SectionLabel><div className="contract-job-list">{JOBS.filter(job => !job.illegal).map((job, index) => renderJob(job, index))}</div>
    <SectionLabel>High-risk listings · arrest risk in the simulation</SectionLabel><div className="contract-job-list">{JOBS.filter(job => job.illegal).map((job, index) => renderJob(job, index))}</div>
  </section>;
}

export function FestivalView({ onOpenTour }) {
  return <section className="festival-desk" aria-label="Festival availability">
    <div className="festival-stage-mark" aria-hidden="true">LIVE <span>—</span> CIRCUIT</div>
    <div className="festival-status-stamp">SCHEDULE <i>·</i> NOT MODELED</div>
    <h2>No festival calendar in this build.</h2>
    <p>Treblr currently has no recurring festival dates, application windows, lineup offers, eligibility rules, or festival payouts to display. This desk is intentionally empty rather than filling in invented events.</p>
    <button type="button" onClick={onOpenTour}>OPEN THE MODELED TOUR DESK <span>↗</span></button>
  </section>;
}
