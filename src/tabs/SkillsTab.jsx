import { useState } from 'react';
import { clamp, fmt, fmtN } from '../engine/utils';
import { GENRES, JOBS } from '../data/constants';
import { addNews } from '../engine/weekEngine';

const SKILLS = [
  { id:'sw', label:'Songwriting',      desc:'Lyrical depth, hooks, structure', color:'var(--accent-purple)' },
  { id:'vc', label:'Vocals',           desc:'Range, control, delivery',         color:'var(--accent-cyan)'   },
  { id:'pd', label:'Production',       desc:'Beats, mixing, sound design',      color:'var(--accent-green)'  },
  { id:'lp', label:'Live Performance', desc:'Stage presence, crowd control',    color:'var(--accent-orange)' },
];

const SKILL_ICONS = {
  sw: () => <svg viewBox="0 0 24 24" style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  vc: () => <svg viewBox="0 0 24 24" style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round'}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  pd: () => <svg viewBox="0 0 24 24" style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round'}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  lp: () => <svg viewBox="0 0 24 24" style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round'}}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
};

const TRAINING_COST = 15; // energy per session
const TRAINING_GAIN = 3;  // skill points per session
const MAX_SKILL     = 100;

export default function SkillsTab({ gs, patch, patchFn, showToast }) {
  const [view, setView] = useState('skills'); // 'skills' | 'jobs'
  const genreData = GENRES.find(g => g.id === gs.genre);

  // ── Train skill ────────────────────────────────────────────────────────────
  const trainSkill = (skillId) => {
    if (gs.energy < TRAINING_COST) { showToast('Need ' + TRAINING_COST + ' energy to train'); return; }
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    patchFn(prev => {
      const current = prev[skillId] || 0;
      if (current >= MAX_SKILL) { showToast(skill.label + ' is maxed!'); return prev; }
      const newVal = Math.min(MAX_SKILL, current + TRAINING_GAIN);
      return {
        [skillId]: newVal,
        energy: clamp((prev.energy || 0) - TRAINING_COST, 0, 100),
        news: addNews(prev.news, 'Trained ' + skill.label + ' · ' + newVal + '/' + MAX_SKILL, 'pos', prev.totalWeeks),
      };
    });
  };

  const trainGenre = () => {
    if (gs.energy < TRAINING_COST) { showToast('Need ' + TRAINING_COST + ' energy'); return; }
    patchFn(prev => {
      const current = (prev.genreBonus || {})[prev.genre] || 0;
      if (current >= 50) { showToast('Genre mastery maxed!'); return prev; }
      return {
        genreBonus: { ...(prev.genreBonus || {}), [prev.genre]: Math.min(50, current + 2) },
        energy: clamp((prev.energy || 0) - TRAINING_COST, 0, 100),
        news: addNews(prev.news, 'Genre mastery +2 in ' + genreData?.label, 'pos', prev.totalWeeks),
      };
    });
  };

  const rest = () => {
    patchFn(prev => ({
      energy: clamp((prev.energy || 0) + 40, 0, 100),
      news: addNews(prev.news, 'Took a rest day. Energy restored.', '', prev.totalWeeks),
    }));
    showToast('Rested — +40 energy');
  };

  const genreBonus = (gs.genreBonus || {})[gs.genre] || 0;
  const canTrain = gs.energy >= TRAINING_COST;
  const overallMastery = Math.round(SKILLS.reduce((acc, s) => acc + (gs[s.id] || 0), 0) / (SKILLS.length * MAX_SKILL) * 100);

  // ── Job logic ──────────────────────────────────────────────────────────────
  const checkJobReq = (job) => {
    if (!job.req) return true;
    if (job.req.startsWith('fans')) return gs.fans >= parseInt(job.req.replace('fans', ''));
    const match = job.req.match(/^([a-z]+)(\d+)$/);
    if (match) return (gs[match[1]] || 0) >= parseInt(match[2]);
    return true;
  };

  const takeJob = (job) => {
    if (gs.activeJob) { showToast('Finish your current job first'); return; }
    if (gs.inPrison)  { showToast('You\'re in prison!'); return; }
    if (!checkJobReq(job)) { showToast('Requirements not met'); return; }
    patchFn(prev => {
      let updates = {
        activeJob: {
          jobId: job.id,
          label: job.label,
          weeklyPay: job.weeklyPay,
          weeksLeft: job.duration,
          totalDuration: job.duration,
          energyPerWeek: job.energyPerWeek,
          illegal: job.illegal || false,
          prisonRisk: job.prisonRisk || 0,
          prisonWeeks: job.prisonWeeks || 0,
        },
        news: addNews(prev.news, 'Started "' + job.label + '" · ' + fmtN(job.weeklyPay) + '/wk for ' + job.duration + ' weeks', 'pos', prev.totalWeeks),
      };
      // Apply skill gain bonus on job start
      if (job.skillGain) {
        for (const [k, v] of Object.entries(job.skillGain)) {
          updates[k] = Math.min(MAX_SKILL, (prev[k] || 0) + v);
        }
      }
      return updates;
    });
    showToast('Started: ' + job.label);
  };

  const quitJob = () => {
    if (!gs.activeJob) return;
    patchFn(prev => ({
      activeJob: null,
      news: addNews(prev.news, 'Quit "' + prev.activeJob.label + '" early.', 'neg', prev.totalWeeks),
    }));
    showToast('Job quit');
  };

  return (
    <div className="tab-content">
      {/* Prison banner */}
      {gs.inPrison && (
        <div style={{ background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:16, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:900, color:'var(--accent-red)', letterSpacing:2 }}>BEHIND BARS</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
            {gs.prisonWeeksLeft} week{gs.prisonWeeksLeft !== 1 ? 's' : ''} remaining — can only rest
          </div>
        </div>
      )}

      <div className="sub-tabs">
        {['skills','jobs'].map(v => (
          <div key={v} className={'sub-tab'+(view===v?' on':'')} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase()+v.slice(1)}
          </div>
        ))}
      </div>

      {/* ── SKILLS ───────────────────────────────────────────────────────── */}
      {view === 'skills' && (
        <>
          {/* Overall mastery */}
          <div style={{ background:'linear-gradient(135deg,rgba(108,63,204,0.15),rgba(0,184,212,0.08))', border:'1px solid rgba(108,63,204,0.25)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--accent-purple)', fontFamily:'var(--font-mono)' }}>Overall Mastery</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:24 }}>{overallMastery}%</div>
            </div>
            <div style={{ height:4, background:'var(--surface-2)', borderRadius:2 }}>
              <div style={{ height:'100%', width:overallMastery+'%', background:'linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))', borderRadius:2, transition:'width 400ms ease-out' }}/>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>Training costs {TRAINING_COST} energy · +{TRAINING_GAIN} per session · Max {MAX_SKILL}</div>
          </div>

          {/* Energy info */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Energy available</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color: gs.energy >= TRAINING_COST ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight:700 }}>{gs.energy}%</span>
              <span style={{ fontSize:10, color:'var(--text-muted)' }}>({Math.floor(gs.energy / TRAINING_COST)} sessions left)</span>
            </div>
          </div>

          {/* Core skills */}
          <div className="card" style={{ marginBottom:16 }}>
            {SKILLS.map(skill => {
              const val = gs[skill.id] || 0;
              const pct = Math.round((val / MAX_SKILL) * 100);
              const Icon = SKILL_ICONS[skill.id];
              const maxed = val >= MAX_SKILL;
              return (
                <div key={skill.id} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:skill.color+'20', display:'flex', alignItems:'center', justifyContent:'center', color:skill.color, flexShrink:0 }}>
                      <Icon />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{skill.label}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:skill.color }}>{val}/{MAX_SKILL}</span>
                      </div>
                      <div style={{ height:5, background:'var(--surface-2)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:pct+'%', background:skill.color, borderRadius:3, transition:'width 300ms ease-out' }}/>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{ flexShrink:0, background:maxed?'var(--surface-2)':skill.color+'22', color:maxed?'var(--text-muted)':skill.color, border:'1px solid '+(maxed?'var(--border)':skill.color+'50'), fontSize:11, fontWeight:700, padding:'4px 10px' }}
                      disabled={!canTrain || maxed || gs.inPrison}
                      onClick={() => trainSkill(skill.id)}
                    >
                      {maxed ? 'MAX' : '+'+TRAINING_GAIN}
                    </button>
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', paddingLeft:42 }}>{skill.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Genre mastery */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>Genre Mastery</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{genreData?.label} specialization</div>
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent-gold-lt)', fontWeight:700 }}>{genreBonus}/50</span>
            </div>
            <div style={{ height:4, background:'var(--surface-2)', borderRadius:2, marginBottom:12 }}>
              <div style={{ height:'100%', width:((genreBonus/50)*100)+'%', background:'var(--accent-gold)', borderRadius:2 }}/>
            </div>
            <button
              className="btn btn-outline btn-full btn-sm"
              disabled={!canTrain || genreBonus >= 50 || gs.inPrison}
              onClick={trainGenre}
            >
              Practice Genre · {TRAINING_COST} NRG
            </button>
          </div>

          <button className="btn btn-outline btn-full" onClick={rest} disabled={gs.energy >= 100}>
            Rest This Week · +40 Energy
          </button>
        </>
      )}

      {/* ── JOBS ─────────────────────────────────────────────────────────── */}
      {view === 'jobs' && (
        <>
          {/* Active job status */}
          {gs.activeJob && (
            <div style={{ background:'rgba(13,159,104,0.08)', border:'1px solid rgba(13,159,104,0.3)', borderRadius:'var(--r)', padding:'14px', marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'var(--accent-green)', fontFamily:'var(--font-mono)', marginBottom:6 }}>Active Job</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{gs.activeJob.label}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>
                <span>{fmtN(gs.activeJob.weeklyPay)}/week</span>
                <span>{gs.activeJob.weeksLeft}/{gs.activeJob.totalDuration} weeks left</span>
              </div>
              <div style={{ height:4, background:'var(--surface-2)', borderRadius:2, marginBottom:10 }}>
                <div style={{ height:'100%', width:(((gs.activeJob.totalDuration-gs.activeJob.weeksLeft)/gs.activeJob.totalDuration)*100)+'%', background:'var(--accent-green)', borderRadius:2 }}/>
              </div>
              {gs.activeJob.illegal && (
                <div style={{ fontSize:11, color:'var(--accent-red)', marginBottom:8 }}>
                  ⚠ Illegal — {Math.round((gs.activeJob.prisonRisk||0)*100)}% arrest risk per week
                </div>
              )}
              <button className="btn btn-sm btn-full" style={{ background:'rgba(220,38,38,0.1)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.2)' }} onClick={quitJob}>
                Quit Job (lose remaining income)
              </button>
            </div>
          )}

          {gs.inPrison && (
            <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:'var(--r)', padding:'12px', marginBottom:16, fontSize:12, color:'var(--text-muted)' }}>
              Can't work while in prison. {gs.prisonWeeksLeft}w remaining.
            </div>
          )}

          {!gs.activeJob && !gs.inPrison && (
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>
              One job at a time. Jobs pay weekly for their duration and cost energy each week.
            </div>
          )}

          {/* Legal jobs */}
          <div className="sec-head" style={{ marginBottom:8 }}><div className="sec-title">Legal Hustle</div></div>
          <div className="card" style={{ marginBottom:16 }}>
            {JOBS.filter(j => !j.illegal).map(job => {
              const unlocked = checkJobReq(job);
              const isActive = gs.activeJob?.jobId === job.id;
              return (
                <div key={job.id} style={{ paddingBottom:12, marginBottom:12, borderBottom:'1px solid var(--border)', opacity: (!unlocked || (gs.activeJob && !isActive)) ? 0.45 : 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{job.label}</div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-green)', fontWeight:700 }}>{fmtN(job.weeklyPay)}/wk</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{job.duration}wk · -{job.energyPerWeek}NRG/wk</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{job.desc}</div>
                  {job.req && !unlocked && (
                    <div style={{ fontSize:10, color:'var(--accent-red)', marginBottom:6 }}>
                      Requires: {job.req.startsWith('fans') ? fmt(parseInt(job.req.replace('fans',''))) + ' fans' : job.req.replace(/([a-z]+)(\d+)/, (_, s, n) => s.toUpperCase() + ' ' + n)}
                    </div>
                  )}
                  {job.skillGain && (
                    <div style={{ fontSize:10, color:'var(--accent-cyan)', marginBottom:6 }}>
                      Bonus: +{Object.entries(job.skillGain).map(([k,v]) => v + ' ' + k.toUpperCase()).join(', ')} on start
                    </div>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!!gs.activeJob || gs.inPrison || !unlocked}
                    onClick={() => takeJob(job)}
                  >
                    {isActive ? 'ACTIVE' : 'TAKE JOB'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Illegal jobs */}
          <div className="sec-head" style={{ marginBottom:8 }}>
            <div className="sec-title" style={{ color:'var(--accent-red)' }}>Illegal Hustle</div>
            <div className="sec-sub">High pay. Prison risk every week.</div>
          </div>
          <div className="card" style={{ border:'1px solid rgba(220,38,38,0.2)' }}>
            {JOBS.filter(j => j.illegal).map(job => {
              const unlocked = checkJobReq(job);
              const isActive = gs.activeJob?.jobId === job.id;
              return (
                <div key={job.id} style={{ paddingBottom:12, marginBottom:12, borderBottom:'1px solid rgba(220,38,38,0.15)', opacity: (!unlocked || (gs.activeJob && !isActive)) ? 0.45 : 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{job.label}</div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-gold-lt)', fontWeight:700 }}>{fmtN(job.weeklyPay)}/wk</div>
                      <div style={{ fontSize:10, color:'var(--accent-red)' }}>{Math.round((job.prisonRisk||0)*100)}% arrest risk/wk</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{job.desc}</div>
                  <div style={{ fontSize:10, color:'var(--accent-red)', marginBottom:8 }}>
                    If caught: {job.prisonWeeks}wk prison + 15% money lost
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background:'rgba(220,38,38,0.1)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.3)' }}
                    disabled={!!gs.activeJob || gs.inPrison || !unlocked}
                    onClick={() => takeJob(job)}
                  >
                    {isActive ? 'ACTIVE' : 'TAKE JOB'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
