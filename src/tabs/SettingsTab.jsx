import { GENRES, CITIES, CAREER_TYPES, MILESTONES } from '../data/constants';
import { fmt, fmtN, getTimeLabel } from '../engine/utils';
import { deleteSave, saveGame } from '../engine/gameState';

const ChevRight = () => (
  <svg viewBox="0 0 24 24" style={{ width:14,height:14,fill:'none',stroke:'var(--text-muted)',strokeWidth:2 }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function SettingsTab({ gs, patch, patchFn, showToast }) {
  const genre     = GENRES.find(g => g.id === gs.genre);
  const city      = CITIES.find(c => c.id === gs.city);
  const career    = CAREER_TYPES.find(c => c.id === gs.careerType);
  const timeStr   = getTimeLabel(gs.totalWeeks, gs.startYear);
  const ageNow    = (gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 52);

  // Current milestone and next
  let currentMilestone = MILESTONES[0];
  let nextMilestone = MILESTONES[1];
  for (let i = 0; i < MILESTONES.length; i++) {
    if (gs.fans >= MILESTONES[i].fans) {
      currentMilestone = MILESTONES[i];
      nextMilestone = MILESTONES[i + 1] || null;
    }
  }

  const progressToNext = nextMilestone
    ? Math.min(100, Math.round(((gs.fans - currentMilestone.fans) / (nextMilestone.fans - currentMilestone.fans)) * 100))
    : 100;

  const handleReset = () => {
    if (window.confirm('Delete this career and start fresh? This cannot be undone.')) {
      deleteSave();
      window.location.reload();
    }
  };

  return (
    <div className="tab-content">
      {/* ── CAREER PROFILE ───────────────────────────────────────────────── */}
      <div className="sec-head"><div className="sec-title">Career Profile</div></div>
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background: genre?.color + '25' || 'var(--surface-2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            border: '2px solid ' + (genre?.color || 'var(--border)'),
            flexShrink:0,
          }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:900, color: genre?.color }}>{genre?.initials || '??'}</span>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:1 }}>{gs.stageName}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.realName} · Age {ageNow}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['Genre',   genre?.label     || '—'],
            ['City',    city?.label      || '—'],
            ['Career',  career?.label    || '—'],
            ['Weeks',   gs.totalWeeks    || 0],
            ['Time',    timeStr?.split('·')[0]?.trim() || '—'],
            ['Fans',    fmt(gs.fans || 0)],
          ].map(([label, val]) => (
            <div key={label} style={{ background:'var(--surface-1)', borderRadius:8, padding:'8px 10px' }}>
              <div style={{ fontSize:9, letterSpacing:1.5, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAREER PATH ──────────────────────────────────────────────────── */}
      <div className="sec-head"><div className="sec-title">Career Path</div></div>
      <div className="card" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
        {/* Progress header */}
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color: currentMilestone.color }}>{currentMilestone.tier}</div>
              {nextMilestone && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Next: {nextMilestone.tier}</div>}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent-gold-lt)' }}>{progressToNext}%</div>
          </div>
          <div style={{ height:4, background:'var(--surface-2)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width: progressToNext + '%', background: currentMilestone.color, borderRadius:2, transition:'width 400ms ease-out' }} />
          </div>
          {nextMilestone && (
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>
              {fmt(Math.max(0, nextMilestone.fans - gs.fans))} more fans to reach {nextMilestone.tier}
            </div>
          )}
        </div>

        {/* Full milestone list */}
        <div style={{ padding:'8px 0' }}>
          {MILESTONES.map((m, i) => {
            const isCurrent = m.fans === currentMilestone.fans;
            const isPast = gs.fans >= m.fans;
            const isNext = nextMilestone && m.fans === nextMilestone.fans;
            return (
              <div key={m.tier} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 16px',
                background: isCurrent ? m.color + '0F' : 'transparent',
                borderLeft: isCurrent ? '3px solid ' + m.color : '3px solid transparent',
              }}>
                {/* Timeline dot */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, flexShrink:0 }}>
                  <div style={{
                    width:12, height:12, borderRadius:'50%',
                    background: isPast ? m.color : 'var(--surface-2)',
                    border: '2px solid ' + (isCurrent ? m.color : isPast ? m.color + '80' : 'var(--border)'),
                  }} />
                  {i < MILESTONES.length - 1 && (
                    <div style={{ width:2, height:20, background: isPast ? 'var(--border)' : 'var(--surface-2)', marginTop:2 }} />
                  )}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color: isPast ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.tier}</span>
                    {isCurrent && <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, color: m.color, background: m.color + '20', padding:'2px 6px', borderRadius:4, letterSpacing:1 }}>CURRENT</span>}
                    {isNext && !isCurrent && <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--accent-gold)', background:'var(--accent-gold)20', padding:'2px 6px', borderRadius:4, letterSpacing:1 }}>NEXT UP</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                    {fmt(m.fans)} fans required
                  </div>
                </div>

                {isPast && !isCurrent && (
                  <svg viewBox="0 0 24 24" style={{ width:16,height:16,fill:'none',stroke:m.color,strokeWidth:2.5 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GAME OPTIONS ─────────────────────────────────────────────────── */}
      <div className="sec-head"><div className="sec-title">Game</div></div>
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
          Last saved: {gs.lastSaved ? new Date(gs.lastSaved).toLocaleString() : 'Never'}
        </div>

        <button
          className="btn btn-outline btn-full"
          style={{ marginBottom:8 }}
          onClick={() => {
            saveGame(gs);
            showToast('Game saved');
          }}
        >
          SAVE NOW
        </button>

        <button
          className="btn btn-full"
          style={{ background:'rgba(220,38,38,0.12)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.3)' }}
          onClick={handleReset}
        >
          DELETE CAREER
        </button>
      </div>

      {/* ── SKILLS OVERVIEW ──────────────────────────────────────────────── */}
      <div className="sec-head"><div className="sec-title">Skill Stats</div></div>
      <div className="card" style={{ marginBottom:12 }}>
        {[
          ['Songwriting', gs.sw, 25, 'var(--accent-purple)'],
          ['Vocals',      gs.vc, 25, 'var(--accent-cyan)'],
          ['Production',  gs.pd, 25, 'var(--accent-green)'],
          ['Live Perf.',  gs.lp, 25, 'var(--accent-orange)'],
          ['Hustle',      gs.hustle, 25, 'var(--accent-gold-lt)'],
          ['Charisma',    gs.charisma, 25, '#C084FC'],
          ['Network',     gs.network, 20, '#60A5FA'],
        ].map(([name, val, max, color]) => (
          <div key={name} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
              <span style={{ color:'var(--text-muted)' }}>{name}</span>
              <span style={{ fontFamily:'var(--font-mono)', color }}>{val}/{max}</span>
            </div>
            <div style={{ height:4, background:'var(--surface-2)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width: Math.round((val/max)*100) + '%', background: color, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ height:16 }} />
    </div>
  );
}
