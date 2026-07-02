import { useState } from 'react';
import { GENRES, CITIES, CAREER_TYPES, MILESTONES } from '../data/constants';
import { fmt, fmtN, getTier, getTalent, getTimeLabel } from '../engine/utils';
import { addNews } from '../engine/weekEngine';
import { deleteSave, saveGame } from '../engine/gameState';
import { Aurora, Magnetic, StatNumber, SectionLabel, SubNav, ResourcePill, PlayerAvatar } from '../components/Living';

const SKILL_COLORS = {
  sw: 'var(--accent-purple)', vc: 'var(--accent-cyan)',
  pd: 'var(--accent-green)', lp: 'var(--accent-orange)',
};

const CHART_TABS = ['Streams','Sales','Videos'];
const GENRE_TABS = ['All','Afrobeats','Hip-Hop','Pop','R&B','Alternative'];

const SUB_NAV = [
  { id:'stats',    label:'Stats' },
  { id:'charts',   label:'Charts' },
  { id:'career',   label:'Career' },
  { id:'settings', label:'Settings' },
];

export default function ProfileTab({ gs, patch, patchFn, showToast }) {
  const [section, setSection] = useState('stats');

  return (
    <div className="tab-content li-scene">
      <Aurora c1="#7C6CFF" c2="#3FD3C6" c3="#FF6FA5" />
      <div className="li-scene-content">
      <SubNav items={SUB_NAV} active={section} onChange={setSection} />
      {section === 'stats'    && <StatsView    gs={gs} patchFn={patchFn} />}
      {section === 'charts'   && <ChartsView   gs={gs} />}
      {section === 'career'   && <CareerView   gs={gs} />}
      {section === 'settings' && <SettingsView gs={gs} patch={patch} showToast={showToast} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function StatsView({ gs, patchFn }) {
  const tier    = getTier(gs.fans);
  const talent  = getTalent(gs);
  const genre   = GENRES.find(g => g.id === gs.genre);
  const city    = CITIES.find(c => c.id === gs.city);
  const totalSocial = Object.values(gs.socialPlatforms || {}).reduce((a, b) => a + (b || 0), 0);

  const releasedTracks = (gs.catalog || []).filter(t => t.released);
  const peakChart = releasedTracks.reduce((best, t) => (t.chartPos && (best === null || t.chartPos < best) ? t.chartPos : best), null);

  const skills = [
    { id:'sw', label:'Songwriting',      val: gs.sw || 0 },
    { id:'vc', label:'Vocals',           val: gs.vc || 0 },
    { id:'pd', label:'Production',       val: gs.pd || 0 },
    { id:'lp', label:'Live Performance', val: gs.lp || 0 },
  ];
  const otherStats = [
    { label:'Hustle',     val: gs.hustle   || 0 },
    { label:'Charisma',   val: gs.charisma || 0 },
    { label:'Network',    val: gs.network  || 0 },
    { label:'Reputation', val: gs.reputation || 50 },
  ];

  return (
    <>
      {/* Artist card */}
      <div className="li-glass li-stagger" style={{ '--i':0, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <PlayerAvatar gs={gs} size={56} ring="var(--li-accent)" />
          <div>
            <div style={{ fontFamily:'var(--li-font-display)', fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>{gs.stageName}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.realName} · Age {(gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 48)}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <span className="tag tag-purple">{tier.tier}</span>
          {genre && <span className="tag tag-orange">{genre.label}</span>}
          {city && <span className="tag tag-cyan">{city.label}</span>}
        </div>
      </div>

      {/* The core identity block — fans/clout/talent/social lives HERE now, not on every page */}
      <div className="li-glass li-stagger" style={{ '--i':1, padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {[
            { l:'Fans',   v:fmt(gs.fans),   c:'var(--accent-gold-lt)' },
            { l:'Clout',  v:gs.clout,       c:'var(--li-accent-lt)' },
            { l:'Talent', v:talent,         c:'var(--accent-cyan)' },
            { l:'Social', v:fmt(totalSocial), c:'var(--text-secondary)' },
          ].map(({l,v,c}, i) => (
            <div key={l} style={{ textAlign:'center', padding:'14px 4px', borderLeft:i>0?'1px solid var(--li-glass-border)':'none' }}>
              <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:5 }}>{l}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--li-glass-border)', display:'flex', gap:8 }}>
          <ResourcePill label="Energy" value={gs.energy||0} max={100} color={gs.energy>50?'var(--accent-green)':'var(--accent-red)'} suffix="%" />
          <ResourcePill label="Social Energy" value={gs.se||0} max={gs.maxSe||7} color="var(--li-accent-lt)" />
        </div>
      </div>

      {/* Career stats */}
      <SectionLabel>Career Stats</SectionLabel>
      <div className="li-glass" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', marginBottom:16, overflow:'hidden' }}>
        {[
          { label:'Net Worth',       val: fmtN(gs.money), c:'var(--accent-green)' },
          { label:'Social Reach',    val: fmt(totalSocial), c:'var(--text-primary)' },
          { label:'Tracks Released', val: releasedTracks.length, c:'var(--text-primary)' },
          { label:'Peak Chart Pos',  val: peakChart ? `#${peakChart}` : '—', c:'var(--accent-gold-lt)' },
          { label:'Weekly Income',   val: fmtN(gs.weeklyStreamIncome || 0), c:'var(--accent-green)' },
          { label:'Weeks Active',    val: gs.totalWeeks, c:'var(--text-primary)' },
        ].map((s,i) => (
          <div key={s.label} style={{ padding:'12px 14px', borderBottom: i<4?'1px solid var(--li-glass-border)':'none', borderRight: i%2===0?'1px solid var(--li-glass-border)':'none' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:s.c }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <SectionLabel>Core Skills · Talent {talent}/100</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
        {skills.map((s,i) => (
          <div key={s.id} style={{ padding:'10px 0', borderBottom:i<skills.length-1?'1px solid var(--li-glass-border)':'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>{s.label}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: SKILL_COLORS[s.id] }}>{s.val}/100</span>
            </div>
            <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${s.val}%`, background: SKILL_COLORS[s.id], borderRadius:3, transition:'width 400ms var(--li-ease-smooth)' }} />
            </div>
          </div>
        ))}
        <div style={{ padding:'10px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Genre Mastery ({genre?.label})</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent-gold-lt)' }}>{(gs.genreBonus || {})[gs.genre] || 0}/50</span>
          </div>
          <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${((gs.genreBonus || {})[gs.genre] || 0) / 50 * 100}%`, background:'var(--accent-gold)', borderRadius:3 }} />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <SectionLabel>Attributes</SectionLabel>
      <div className="li-glass" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', marginBottom:16, overflow:'hidden' }}>
        {otherStats.map((s,i) => (
          <div key={s.label} style={{ padding:'12px 14px', borderBottom: i<2?'1px solid var(--li-glass-border)':'none', borderRight: i%2===0?'1px solid var(--li-glass-border)':'none' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700 }}>{s.val}{s.label === 'Reputation' ? '/100' : ''}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <SectionLabel>Platform Breakdown</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
        {Object.entries(gs.socialPlatforms || {}).map(([platform, count], i, arr) => (
          <div key={platform} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<arr.length-1?'1px solid var(--li-glass-border)':'none', fontSize:12 }}>
            <span style={{ color:'var(--text-secondary)', textTransform:'capitalize' }}>{platform}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(count)}</span>
          </div>
        ))}
      </div>

      {/* Awards */}
      {(gs.awards || []).length > 0 && (
        <>
          <SectionLabel>Awards</SectionLabel>
          <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
            {(gs.awards || []).map((a, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:i<gs.awards.length-1?'1px solid var(--li-glass-border)':'none', fontSize:12 }}>
                <span style={{ color:'var(--accent-gold-lt)' }}>{a}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Team */}
      <SectionLabel>Team</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 16px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--li-glass-border)', fontSize:12 }}>
          <span>Manager</span>
          <span style={{ color: gs.hasManager ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasManager ? 'Hired · -₦200k/wk' : 'None'}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:12, borderBottom: (!gs.hasManager || !gs.hasLawyer) ? '1px solid var(--li-glass-border)' : 'none' }}>
          <span>Entertainment Lawyer</span>
          <span style={{ color: gs.hasLawyer ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasLawyer ? 'On retainer · -₦100k/wk' : 'None'}</span>
        </div>
        {!gs.hasManager && (
          <Magnetic strength={4} disabled={gs.money < 1000000} onClick={() => {
            patchFn(prev => ({
              hasManager: true, money: prev.money - 1000000,
              news: addNews(prev.news, 'Hired a manager. -₦200k/week.', 'pos', prev.totalWeeks),
            }));
          }} className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'10px 0', marginTop:10, fontSize:12, fontWeight:700 }}>
            Hire Manager · ₦1M deposit
          </Magnetic>
        )}
        {!gs.hasLawyer && (
          <Magnetic strength={4} disabled={gs.money < 500000} onClick={() => {
            patchFn(prev => ({
              hasLawyer: true, money: prev.money - 500000,
              news: addNews(prev.news, 'Hired an entertainment lawyer. -₦100k/week retainer.', 'pos', prev.totalWeeks),
            }));
          }} className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'10px 0', marginTop:10, fontSize:12, fontWeight:700 }}>
            Hire Lawyer · ₦500k deposit
          </Magnetic>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function ChartsView({ gs }) {
  const [chartType, setChartType] = useState('Streams');
  const [genreFilter, setGenreFilter] = useState('All');

  const chartKey = chartType.toLowerCase();
  const chartData = (gs.charts || {})[chartKey] || [];
  const genreMap = { 'Afrobeats':'afrobeats', 'Hip-Hop':'hiphop', 'Pop':'pop', 'R&B':'rnb', 'Alternative':'alt' };
  const filtered = genreFilter === 'All' ? chartData : chartData.filter(e => e.genre === genreMap[genreFilter]);
  const metricLabel = chartType === 'Streams' ? 'STREAMS' : chartType === 'Sales' ? 'SALES' : 'VIEWS';

  const moveIcon = (curr, last) => {
    if (!last || curr === last) return <span style={{ color:'var(--text-muted)' }}>●</span>;
    if (curr < last) return <span style={{ color:'var(--accent-green)' }}>▲{last - curr}</span>;
    return <span style={{ color:'var(--accent-red)' }}>▼{curr - last}</span>;
  };

  return (
    <>
      <SectionLabel>Official Charts · Updated monthly</SectionLabel>

      <div className="soc-scroll-x" style={{ gap:6, marginBottom:10 }}>
        {CHART_TABS.map(t => (
          <div key={t} onClick={() => setChartType(t)} className="soc-pill"
            style={{ flexShrink:0, padding:'7px 16px', background:chartType===t?'var(--li-accent)':'var(--li-glass-bg)', border:'1px solid '+(chartType===t?'var(--li-accent)':'var(--li-glass-border)'), color:chartType===t?'#fff':'var(--text-muted)', fontSize:12 }}>
            {t}
          </div>
        ))}
      </div>

      <div className="soc-scroll-x" style={{ gap:4, marginBottom:16 }}>
        {GENRE_TABS.map(g => (
          <div key={g} onClick={() => setGenreFilter(g)} className="soc-pill"
            style={{ flexShrink:0, padding:'5px 12px', background:genreFilter===g?'rgba(200,146,42,0.15)':'var(--li-glass-bg)', border:'1px solid '+(genreFilter===g?'var(--accent-gold)':'var(--li-glass-border)'), color:genreFilter===g?'var(--accent-gold-lt)':'var(--text-muted)', fontSize:10 }}>
            {g}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="li-glass" style={{ padding:'30px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
          No chart data yet. Release music and end weeks to update charts.
        </div>
      ) : (
        <div className="li-glass" style={{ overflow:'hidden' }}>
          {filtered.slice(0, 30).map((entry, i) => (
            <div key={entry.id || i} className="li-stagger" style={{ '--i':Math.min(i,10), display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:i<filtered.length-1?'1px solid var(--li-glass-border)':'none', background:entry.isPlayer?'var(--li-accent-soft)':'transparent' }}>
              <div style={{ width:20, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:entry.position<=3?'var(--accent-gold-lt)':'var(--text-muted)' }}>{entry.position}</div>
              <div style={{ width:24, fontSize:10, textAlign:'center' }}>{moveIcon(entry.position, entry.lastPos)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:entry.isPlayer?'var(--li-accent-lt)':'var(--text-primary)' }}>{entry.title || entry.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{entry.artist}</div>
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)', flexShrink:0, minWidth:50, textAlign:'right' }}>{fmt(entry.metricVal || 0)}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0, width:28, textAlign:'center' }}>#{entry.peakPos || entry.position}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0, width:20, textAlign:'center' }}>{entry.weeksOnChart || 1}w</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function CareerView({ gs }) {
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

  return (
    <>
      <SectionLabel>Career Path</SectionLabel>
      <div className="li-glass" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--li-glass-border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color: currentMilestone.color }}>{currentMilestone.tier}</div>
              {nextMilestone && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Next: {nextMilestone.tier}</div>}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, color:'var(--accent-gold-lt)' }}>{progressToNext}%</div>
          </div>
          <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width: progressToNext + '%', background: currentMilestone.color, borderRadius:3, transition:'width 500ms var(--li-ease-smooth)' }} />
          </div>
          {nextMilestone && (
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:8 }}>
              {fmt(Math.max(0, nextMilestone.fans - gs.fans))} more fans to reach {nextMilestone.tier}
            </div>
          )}
        </div>

        <div style={{ padding:'8px 0' }}>
          {MILESTONES.map((m, i) => {
            const isCurrent = m.fans === currentMilestone.fans;
            const isPast = gs.fans >= m.fans;
            const isNext = nextMilestone && m.fans === nextMilestone.fans;
            return (
              <div key={m.tier} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background: isCurrent ? m.color + '0F' : 'transparent', borderLeft: isCurrent ? '3px solid ' + m.color : '3px solid transparent' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, flexShrink:0 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background: isPast ? m.color : 'var(--surface-2)', border: '2px solid ' + (isCurrent ? m.color : isPast ? m.color + '80' : 'var(--li-glass-border)') }} />
                  {i < MILESTONES.length - 1 && <div style={{ width:2, height:20, background: isPast ? 'var(--li-glass-border)' : 'var(--surface-2)', marginTop:2 }} />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color: isPast ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.tier}</span>
                    {isCurrent && <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, color: m.color, background: m.color + '20', padding:'2px 6px', borderRadius:4, letterSpacing:1 }}>CURRENT</span>}
                    {isNext && !isCurrent && <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--accent-gold)', background:'rgba(200,146,42,0.15)', padding:'2px 6px', borderRadius:4, letterSpacing:1 }}>NEXT UP</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{fmt(m.fans)} fans required</div>
                </div>
                {isPast && !isCurrent && (
                  <svg viewBox="0 0 24 24" style={{ width:16,height:16,fill:'none',stroke:m.color,strokeWidth:2.5 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function SettingsView({ gs, patch, showToast }) {
  const genre   = GENRES.find(g => g.id === gs.genre);
  const city    = CITIES.find(c => c.id === gs.city);
  const career  = CAREER_TYPES.find(c => c.id === gs.careerType);
  const timeStr = getTimeLabel(gs.totalWeeks, gs.startYear);
  const ageNow  = (gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 48);

  const handleReset = () => {
    if (window.confirm('Delete this career and start fresh? This cannot be undone.')) {
      deleteSave();
      window.location.reload();
    }
  };

  return (
    <>
      <SectionLabel>Career Profile</SectionLabel>
      <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <label style={{ flexShrink:0, cursor:'pointer', position:'relative' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid '+(genre?.color||'var(--li-glass-border)'), overflow:'hidden', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gs.avatarUrl
                ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontFamily:'var(--li-font-display)', fontSize:20, color: genre?.color || 'var(--text-muted)' }}>{(gs.stageName||'?')[0]}</span>
              }
            </div>
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => patch({ avatarUrl: ev.target.result });
              reader.readAsDataURL(file);
            }}/>
          </label>
          <div>
            <div style={{ fontFamily:'var(--li-font-display)', fontSize:18, fontWeight:700 }}>{gs.stageName}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.realName} · Age {ageNow}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Tap avatar to change photo</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['Genre', genre?.label || '—'], ['City', city?.label || '—'],
            ['Career', career?.label || '—'], ['Weeks', gs.totalWeeks || 0],
            ['Time', timeStr?.split('·')[0]?.trim() || '—'], ['Fans', fmt(gs.fans || 0)],
          ].map(([label, val]) => (
            <div key={label} className="li-glass" style={{ padding:'8px 10px' }}>
              <div style={{ fontSize:9, letterSpacing:1.5, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionLabel>Skill Stats</SectionLabel>
      <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
        {[
          ['Songwriting', gs.sw, 100, 'var(--accent-purple)'],
          ['Vocals',      gs.vc, 100, 'var(--accent-cyan)'],
          ['Production',  gs.pd, 100, 'var(--accent-green)'],
          ['Live Perf.',  gs.lp, 100, 'var(--accent-orange)'],
          ['Hustle',      gs.hustle, 25, 'var(--accent-gold-lt)'],
          ['Charisma',    gs.charisma, 25, '#C084FC'],
          ['Network',     gs.network, 20, '#60A5FA'],
        ].map(([name, val, max, color]) => (
          <div key={name} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
              <span style={{ color:'var(--text-muted)' }}>{name}</span>
              <span style={{ fontFamily:'var(--font-mono)', color }}>{val||0}/{max}</span>
            </div>
            <div style={{ height:4, background:'var(--li-glass-border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width: Math.round(((val||0)/max)*100) + '%', background: color, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Game</SectionLabel>
      <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
          Last saved: {gs.lastSaved ? new Date(gs.lastSaved).toLocaleString() : 'Never'}
        </div>
        <Magnetic strength={5} onClick={() => { saveGame(gs); showToast('Game saved'); }}
          className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'11px 0', marginBottom:10, fontSize:13, fontWeight:700 }}>
          SAVE NOW
        </Magnetic>
        <Magnetic strength={5} onClick={handleReset}
          className="soc-pill" style={{ display:'block', textAlign:'center', width:'100%', padding:'11px 0', background:'rgba(220,38,38,0.12)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.3)', fontSize:13 }}>
          DELETE CAREER
        </Magnetic>
      </div>
    </>
  );
}
