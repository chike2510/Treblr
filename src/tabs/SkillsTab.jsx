import { clamp } from '../engine/utils';
import { GENRES, JOBS } from '../data/constants';
import { addNews } from '../engine/weekEngine';

const SKILLS = [
  { id:'sw', label:'Songwriting',     desc:'Lyrical depth, hooks, structure',  color:'var(--accent-purple)', spCost:1 },
  { id:'vc', label:'Vocals',          desc:'Range, control, delivery',          color:'var(--accent-cyan)',   spCost:1 },
  { id:'pd', label:'Production',      desc:'Beats, mixing, sound design',       color:'var(--accent-green)',  spCost:1 },
  { id:'lp', label:'Live Performance',desc:'Stage presence, crowd control',     color:'var(--accent-orange)', spCost:1 },
];

const ICONS = {
  sw: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  vc: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  pd: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  lp: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
};

export default function SkillsTab({ gs, patch, patchFn, showToast }) {
  const genreData = GENRES.find(g => g.id === gs.genre);

  const trainSkill = (skillId) => {
    if ((gs.sp || 0) < 1) { showToast('No SP left this week'); return; }
    if (gs.energy < 10) { showToast('Too exhausted to practice'); return; }
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    patchFn(prev => {
      const gain = 2;
      const newVal = clamp((prev[skillId] || 0) + gain, 0, 25);
      return {
        [skillId]: newVal,
        sp: clamp((prev.sp || 0) - 1, 0, 5),
        energy: clamp((prev.energy || 0) - 10, 0, 100),
        news: addNews(prev.news, `Trained ${skill.label} +${gain} (now ${newVal}/25)`, 'pos', prev.totalWeeks),
      };
    });
  };

  const trainGenre = () => {
    if ((gs.sp || 0) < 1) { showToast('No SP left this week'); return; }
    if (gs.energy < 10) { showToast('Too exhausted'); return; }
    patchFn(prev => {
      const current = (prev.genreBonus || {})[prev.genre] || 0;
      const gain = 2;
      return {
        genreBonus: { ...(prev.genreBonus || {}), [prev.genre]: Math.min(50, current + gain) },
        sp: clamp((prev.sp || 0) - 1, 0, 5),
        energy: clamp((prev.energy || 0) - 10, 0, 100),
        news: addNews(prev.news, `Genre mastery +${gain} in ${genreData?.label}`, 'pos', prev.totalWeeks),
      };
    });
  };

  const rest = () => {
    patchFn(prev => ({
      energy: clamp((prev.energy || 0) + 35, 0, 100),
      news: addNews(prev.news, 'Took a rest. Energy restored.', '', prev.totalWeeks),
    }));
    showToast('Rested — +35 energy');
  };

  const genreBonus = (gs.genreBonus || {})[gs.genre] || 0;

  return (
    <div className="tab-content">
      <div className="sec-head">
        <div className="sec-title">Skill Lab</div>
        <div style={{ display:'flex', gap:8 }}>
          <span className="tag tag-purple">{gs.sp || 0} SP left</span>
          <span className="tag tag-green">{gs.energy}% NRG</span>
        </div>
      </div>

      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
        Spend Skill Points (SP) on deliberate practice. Max 5/week. Energy required.
      </div>

      {/* Core skills */}
      <div className="card" style={{ marginBottom:16 }}>
        {SKILLS.map(skill => {
          const val = gs[skill.id] || 0;
          const pct = Math.round((val / 25) * 100);
          const Icon = ICONS[skill.id];
          const canTrain = (gs.sp || 0) >= 1 && (gs.energy || 0) >= 10;
          return (
            <div key={skill.id} className="skill-row">
              <div className="skill-icon" style={{ background: skill.color + '22' }}>
                <Icon />
              </div>
              <div className="skill-info">
                <div className="skill-name">{skill.label}</div>
                <div className="skill-bar-row">
                  <div className="prog-bar" style={{ flex:1 }}>
                    <div className="prog-fill" style={{ width:`${pct}%`, background: skill.color }} />
                  </div>
                </div>
                <div className="skill-desc">{skill.desc}</div>
              </div>
              <div className="skill-val" style={{ color: skill.color }}>{val}/25</div>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!canTrain}
                onClick={() => trainSkill(skill.id)}
                style={{ marginLeft:8 }}
              >
                +2
              </button>
            </div>
          );
        })}
      </div>

      {/* Genre mastery */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:13 }}>Genre Mastery</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{genreData?.label} specialization · boosts song quality</div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--accent-gold-lt)' }}>{genreBonus}/50</div>
        </div>
        <div className="prog-bar" style={{ marginBottom:12 }}>
          <div className="prog-fill" style={{ width:`${(genreBonus / 50) * 100}%`, background:'var(--accent-gold)' }} />
        </div>
        <button
          className="btn btn-outline btn-full btn-sm"
          disabled={(gs.sp || 0) < 1 || (gs.energy || 0) < 10}
          onClick={trainGenre}
        >
          Practice Genre · 1 SP
        </button>
      </div>

      {/* Jobs section */}
      <div className="sec-head" style={{ marginTop:8 }}>
        <div className="sec-title">Side Hustles</div>
        <div className="sec-sub">No SP cost — just energy + time</div>
      </div>
      <SideJobs gs={gs} patchFn={patchFn} showToast={showToast} />

      {/* Rest */}
      <button className="btn btn-outline btn-full" style={{ marginTop:16 }} onClick={rest}>
        Rest This Week · +35 Energy
      </button>
    </div>
  );
}

function SideJobs({ gs, patchFn, showToast }) {

  const doJob = (job) => {
    if (gs.energy < job.energy) { showToast('Not enough energy'); return; }
    const income = job.income;
    patchFn(prev => {
      let next = {
        money: prev.money + income,
        energy: clamp((prev.energy || 0) - job.energy, 0, 100),
        news: addNews(prev.news, `${job.label} — earned ₦${(income/1000).toFixed(0)}k`, 'pos', prev.totalWeeks),
      };
      if (job.skillGain) {
        for (const [k, v] of Object.entries(job.skillGain)) {
          next[k] = clamp((prev[k] || 0) + v, 0, 25);
        }
      }
      return next;
    });
  };

  return (
    <div className="card">
      {JOBS.map(job => {
        const canDo = gs.energy >= job.energy;
        return (
          <div key={job.id} className="track-row">
            <div className="track-info">
              <div className="track-title">{job.label}</div>
              <div className="track-meta">{job.desc} · -{job.energy} NRG</div>
            </div>
            <div style={{ textAlign:'right', marginRight:8 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-green)' }}>+{(job.income/1000).toFixed(0)}k</div>
            </div>
            <button className="btn btn-ghost btn-sm" disabled={!canDo} onClick={() => doJob(job)}>DO</button>
          </div>
        );
      })}
    </div>
  );
}
