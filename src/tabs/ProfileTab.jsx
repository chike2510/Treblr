import { useEffect, useRef, useState } from 'react';
import { GENRES, CITIES, CAREER_TYPES, MILESTONES, CURRENCIES } from '../data/constants';
import { fmt, fmtN as formatCurrency, getTier, getTalent, getTimeLabel } from '../engine/utils';
import { addNews } from '../engine/weekEngine';
import { deleteSave, exportSaveText, getSaveSlots, importSaveText, saveGame } from '../engine/gameState';
import { getAwardCategories } from '../engine/awards';
import { optimizeArtwork } from '../engine/coverArt';
import { canSpendActionPoint, spendActionPoints } from '../engine/actionPoints';
import { Magnetic, StatNumber, SectionLabel, SubNav, ResourcePill, PlayerAvatar } from '../components/Living';

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

export default function ProfileTab({ gs, setGs, patch, patchFn, showToast }) {
  const [section, setSection] = useState(gs.appRoutes?.profile || 'stats');
  useEffect(() => {
    const route = gs.appRoutes?.profile;
    if (route && route !== section) setSection(route);
  }, [gs.appRoutes?.profile, section]);
  const changeSection = (id) => {
    setSection(id);
    patch({ appRoutes:{ ...(gs.appRoutes || {}), profile:id } });
  };

  return (
    <div className={`tab-content li-scene profile-screen profile-screen-${section}`}>
      <div className="li-scene-content">
      <div className="editorial-page-head" style={{ padding:'0 0 12px' }}><div className="page-kicker">ARTIST DOSSIER</div><h1>{SUB_NAV.find(item => item.id === section)?.label || 'Stats'}</h1></div>
      <SubNav items={SUB_NAV} active={section} onChange={changeSection} />
      {section === 'stats'    && <StatsView    gs={gs} patchFn={patchFn} />}
      {section === 'charts'   && <ChartsView   gs={gs} />}
      {section === 'career'   && <CareerView   gs={gs} />}
      {section === 'settings' && <SettingsView gs={gs} setGs={setGs} patch={patch} showToast={showToast} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function StatsView({ gs, patchFn }) {
  const fmtN = (amount) => formatCurrency(amount, gs.currency);
  const tier    = getTier(gs.fans);
  const talent  = getTalent(gs);
  const genre   = GENRES.find(g => g.id === gs.genre);
  const city    = CITIES.find(c => c.id === gs.city);
  const totalSocial = Object.values(gs.socialPlatforms || {}).reduce((a, b) => a + (b || 0), 0);
  const awardCategories = getAwardCategories(gs);
  const canHireTeam = canSpendActionPoint(gs) && !gs.inPrison;

  const releasedTracks = (gs.catalog || []).filter(t => t.released);
  const peakChart = releasedTracks.reduce((best, t) => (t.chartPos && (best === null || t.chartPos < best) ? t.chartPos : best), null);
  const showsPlayed = [
    ...(gs.tourHistory || []).flatMap(tour => tour.route || tour.stops || []),
    ...(gs.tourActive && gs.tourData?.route ? gs.tourData.route : []),
  ].filter(stop => Number(stop.attendance || 0) > 0).length;
  const latestReport = gs.lastWeekReport || gs.weekReport;

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
      <section className="profile-artist-sheet" aria-label="Artist profile">
        <div className="profile-sheet-label"><span>ARTIST FILE</span><span>NO. {String(Number(gs.totalWeeks || 0) + 1).padStart(2, '0')}</span></div>
        <div className="profile-sheet-main">
          <PlayerAvatar gs={gs} size={74} ring="var(--scene-accent)" />
          <div className="profile-sheet-identity">
            <span>{tier.tier} <i>·</i> {genre?.label || 'Independent'}</span>
            <h2>{gs.stageName}</h2>
            <p>{gs.realName} <i>·</i> Age {(gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 48)}</p>
          </div>
        </div>
        <div className="profile-sheet-colophon"><span>{city?.label || '—'} <i>/</i> HOME SCENE</span><span>{getTimeLabel(gs.totalWeeks || 0, gs.startYear)}</span></div>
      </section>

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
      <SectionLabel>Recorded career</SectionLabel>
      <div className="li-glass profile-ledger" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', marginBottom:16, overflow:'hidden' }}>
          {[
          { label:'Available Cash',     val: fmtN(gs.money), c:'var(--accent-green)' },
          { label:'Lifetime Streams',   val: fmt(gs.totalLifetimeStreams || 0), c:'var(--text-primary)' },
          { label:'Tracks Released',    val: releasedTracks.length, c:'var(--text-primary)' },
          { label:'Shows Played',       val: showsPlayed, c:'var(--accent-orange)' },
          { label:'Peak Chart Pos',     val: peakChart ? `#${peakChart}` : '—', c:'var(--accent-gold-lt)' },
          { label:'Last Week Income',   val: latestReport ? fmtN(latestReport.revenue || 0) : '—', c:'var(--accent-green)' },
        ].map((s,i) => (
          <div key={s.label} style={{ padding:'12px 14px', borderBottom: i<6?'1px solid var(--li-glass-border)':'none', borderRight: i%2===0?'1px solid var(--li-glass-border)':'none' }}>
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
      <div className="li-glass profile-ledger" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', marginBottom:16, overflow:'hidden' }}>
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

      <SectionLabel>Awards · {gs.awardNoms || 0} latest-season nominations</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
        {(gs.awards || []).length > 0 && (gs.awards || []).map((award, i) => {
          const title = typeof award === 'string' ? award : award.title;
          const work = typeof award === 'object' ? award.work : null;
          return <div key={award.id || `${title}-${i}`} style={{ padding:'8px 0', borderBottom:'1px solid var(--li-glass-border)', fontSize:12 }}>
            <span style={{ color:'var(--accent-gold-lt)', fontWeight:700 }}>★ {title}</span>
            {work && <span style={{ color:'var(--text-muted)' }}> · {work}</span>}
            {award.week != null && <span style={{ color:'var(--text-muted)', fontSize:10 }}> · Week {award.week}</span>}
          </div>;
        })}
        {awardCategories.map((category) => {
          const progress = Math.min(100, Math.round((category.score / Math.max(1, category.minimum)) * 100));
          return <div key={category.id} style={{ padding:'9px 0', borderBottom:'1px solid var(--li-glass-border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:4, fontSize:11 }}>
              <span>{category.title}{category.work ? ` · ${category.work}` : ''}</span>
              <span style={{ color:category.eligible ? 'var(--accent-green)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{Math.round(category.score)}/{category.minimum}{category.eligible ? ' · eligible' : ''}</span>
            </div>
            <div style={{ height:3, background:'var(--li-glass-border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:`${progress}%`, height:'100%', background:category.eligible ? 'var(--accent-green)' : 'var(--accent-gold)', borderRadius:2 }} />
            </div>
          </div>;
        })}
      </div>

      {/* Team */}
      <SectionLabel>Team</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 16px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--li-glass-border)', fontSize:12 }}>
          <span>Manager</span>
          <span style={{ color: gs.hasManager ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasManager ? `Hired · -${fmtN(200_000)}/wk` : 'None'}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:12, borderBottom: (!gs.hasManager || !gs.hasLawyer) ? '1px solid var(--li-glass-border)' : 'none' }}>
          <span>Entertainment Lawyer</span>
          <span style={{ color: gs.hasLawyer ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasLawyer ? `On retainer · -${fmtN(100_000)}/wk` : 'None'}</span>
        </div>
        {!gs.hasManager && (
          <Magnetic strength={4} disabled={gs.money < 1000000 || !canHireTeam} onClick={() => {
            patchFn(prev => {
              if (prev.hasManager || prev.money < 1000000) return prev;
              const acted = spendActionPoints(prev);
              return acted ? { ...acted, hasManager:true, money:prev.money - 1000000, news:addNews(prev.news, `Hired a manager. -${fmtN(200_000)}/week.`, 'pos', prev.totalWeeks) } : prev;
            });
          }} className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'10px 0', marginTop:10, fontSize:12, fontWeight:700 }}>
            Hire Manager · 1 AP · {fmtN(1_000_000)} deposit
          </Magnetic>
        )}
        {!gs.hasLawyer && (
          <Magnetic strength={4} disabled={gs.money < 500000 || !canHireTeam} onClick={() => {
            patchFn(prev => {
              if (prev.hasLawyer || prev.money < 500000) return prev;
              const acted = spendActionPoints(prev);
              return acted ? { ...acted, hasLawyer:true, money:prev.money - 500000, news:addNews(prev.news, `Hired an entertainment lawyer. -${fmtN(100_000)}/week retainer.`, 'pos', prev.totalWeeks) } : prev;
            });
          }} className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'10px 0', marginTop:10, fontSize:12, fontWeight:700 }}>
            Hire Lawyer · 1 AP · {fmtN(500_000)} deposit
          </Magnetic>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function ChartsView({ gs }) {
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
      <SectionLabel>Treblr charts · simulated rankings</SectionLabel>
      <div className="chart-controls">
        <label>CHART TYPE
          <select className="chart-select" value={chartType} onChange={event => setChartType(event.target.value)}>
            {CHART_TABS.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label>GENRE
          <select className="chart-select" value={genreFilter} onChange={event => setGenreFilter(event.target.value)}>
            {GENRE_TABS.map(genre => <option key={genre} value={genre}>{genre}</option>)}
          </select>
        </label>
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
  const careerTimeline = (gs.news || [])
    .filter(item => item.type === 'milestone' || /(released|dropped|started|hired|award|tour|signed|label|deal|chart|viral|launch|wrapped)/i.test(item.msg || ''))
    .slice(0, 8)
    .reverse();

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
      <div className="finance-note" style={{ margin:'-5px 0 15px' }}>Progression is currently fan-milestone based. Shows, releases and other achievements are tracked separately and are not tier prerequisites.</div>

      <SectionLabel>Career timeline</SectionLabel>
      <div className="li-glass" style={{ padding:'4px 14px', marginBottom:16 }}>
        {careerTimeline.length ? careerTimeline.map((item,index) => <div key={`${item.week ?? 0}-${index}-${item.msg}`} className="career-timeline-item">
          <span className="career-timeline-date">{getTimeLabel(item.week || 0, gs.startYear)}</span>
          <span className="career-timeline-text">{item.msg}</span>
        </div>) : <div className="finance-note" style={{ margin:'10px 0' }}>Your career moments will be recorded here as the simulation moves forward.</div>}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function SettingsView({ gs, setGs, patch, showToast }) {
  const avatarInput = useRef(null);
  const genre   = GENRES.find(g => g.id === gs.genre);
  const city    = CITIES.find(c => c.id === gs.city);
  const career  = CAREER_TYPES.find(c => c.id === gs.careerType);
  const timeStr = getTimeLabel(gs.totalWeeks, gs.startYear);
  const ageNow  = (gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 48);
  const currency = CURRENCIES.find(item => item.code === gs.currency) || CURRENCIES[0];

  const handleReset = () => {
    if (window.confirm('Delete this career and start fresh? This cannot be undone.')) {
      if (!deleteSave(gs._slotId)) { showToast('Could not delete this career from local storage.'); return; }
      window.location.reload();
    }
  };

  const handleExport = () => {
    try {
      const file = new Blob([exportSaveText(gs)], { type:'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `treblr-${(gs.stageName || 'career').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-save.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Career backup exported');
    } catch (error) {
      showToast(error.message || 'Could not export this career');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = importSaveText(await file.text());
      setGs(imported);
      showToast('Career imported into a new slot');
    } catch (error) {
      showToast(error.message || 'Could not import this save file');
    } finally {
      event.target.value = '';
    }
  };

  const returnToCareers = () => {
    if (!saveGame(gs, gs._slotId)) { showToast('Could not save this career. Free device storage, then try again.'); return; }
    setGs(previous => ({ ...previous, screen:'start' }));
  };

  return (
    <>
      <SectionLabel>Career Profile</SectionLabel>
      <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ flexShrink:0 }}>
            <button type="button" onClick={() => avatarInput.current?.click()} aria-label="Change avatar photo" className="soc-icon-btn" style={{ border:0, background:'none', padding:0, cursor:'pointer', borderRadius:'50%' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid '+(genre?.color||'var(--li-glass-border)'), overflow:'hidden', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gs.avatarUrl
                ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontFamily:'var(--li-font-display)', fontSize:20, color: genre?.color || 'var(--text-muted)' }}>{(gs.stageName||'?')[0]}</span>
              }
            </div>
            </button>
            <input ref={avatarInput} type="file" accept="image/*" aria-label="Choose avatar image" style={{ display:'none' }} onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              optimizeArtwork(file).then(avatarUrl => patch({ avatarUrl })).catch(error => showToast(error.message || 'Could not process avatar image'));
              e.target.value = '';
            }}/>
          </div>
          <div>
            <div style={{ fontFamily:'var(--li-font-display)', fontSize:18, fontWeight:700 }}>{gs.stageName}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.realName} · Age {ageNow}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Tap avatar to change photo</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['Genre', genre?.label || '—'], ['City', city?.label || '—'],
            ['Career', career?.label || '—'], ['Currency', `${currency.label} (${currency.code})`],
            ['Weeks', gs.totalWeeks || 0],
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
          Last saved: {gs.lastSaved ? new Date(gs.lastSaved).toLocaleString() : 'Never'} · {getSaveSlots().length}/8 local career slots
        </div>
        <div className="finance-note">This is a local-save simulation. Account, audio, notification, privacy, difficulty and simulation-speed controls are not implemented; the current engine uses a fixed standard pace.</div>
        <Magnetic strength={5} onClick={() => { showToast(saveGame(gs, gs._slotId) ? 'Game saved' : 'Could not save. Free device storage and try again.'); }}
          className="soc-glass-btn" style={{ display:'block', textAlign:'center', width:'100%', padding:'11px 0', marginBottom:10, fontSize:13, fontWeight:700 }}>
          SAVE NOW
        </Magnetic>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <button type="button" onClick={handleExport} className="soc-glass-btn" style={{ padding:'10px 6px', fontSize:11, fontWeight:700 }}>EXPORT BACKUP</button>
          <button type="button" onClick={returnToCareers} className="soc-glass-btn" style={{ padding:'10px 6px', fontSize:11, fontWeight:700 }}>SWITCH CAREER</button>
        </div>
        <label className="form-label" htmlFor="treblr-save-import">Import a JSON backup into a new slot</label>
        <input id="treblr-save-import" type="file" accept="application/json,.json" onChange={handleImport} aria-label="Choose a Treblr save backup to import" style={{ display:'block', width:'100%', marginBottom:12, color:'var(--text-muted)', fontSize:11 }} />
        <Magnetic strength={5} onClick={handleReset}
          className="soc-pill" style={{ display:'block', textAlign:'center', width:'100%', padding:'11px 0', background:'rgba(220,38,38,0.12)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.3)', fontSize:13 }}>
          DELETE CAREER
        </Magnetic>
      </div>
    </>
  );
}
