import { useState } from 'react';
import { GENRES, JOBS, PRODUCERS } from '../data/constants';
import { NPC_ARTISTS, NPC_TIERS } from '../data/artists';
import { calcSongQuality } from '../engine/qualityCalc';
import { clamp, fmt, fmtN, uid } from '../engine/utils';
import { addNews } from '../engine/weekEngine';
import { Aurora, Magnetic, SectionLabel, SubNav, ResourcePill } from '../components/Living';

const RELEASE_COOLDOWN = { single: 2, ep: 6, album: 12 };

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

const LockIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width:12, height:12, fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ChevronDown = ({ open }) => (
  <svg viewBox="0 0 24 24" style={{ width:14, height:14, fill:'none', stroke:'var(--text-muted)', strokeWidth:2, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 300ms var(--li-ease-spring)' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const TRAINING_COST = 15; // energy per session
const TRAINING_GAIN = 3;  // skill points per session
const MAX_SKILL     = 100;

const SUB_NAV = [
  { id:'train',   label:'Train' },
  { id:'jobs',    label:'Jobs' },
  { id:'record',  label:'Record' },
  { id:'catalog', label:'Catalog' },
];

export default function CreateTab({ gs, patch, patchFn, showToast }) {
  const [section, setSection] = useState('train');
  const genreData = GENRES.find(g => g.id === gs.genre);

  // ── Skill training ──────────────────────────────────────────────────────
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

  // ── Jobs ─────────────────────────────────────────────────────────────────
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

  // ── Studio: record ──────────────────────────────────────────────────────
  const [title, setTitle]           = useState('');
  const [producerId, setProducerId] = useState('bedroom');
  const [featNpcs, setFeatNpcs]     = useState([]);
  const [openTier, setOpenTier]     = useState(null);

  const released   = (gs.catalog || []).filter(t => t.released);
  const unreleased = (gs.catalog || []).filter(t => !t.released);
  const producer   = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const previewQ   = calcSongQuality(gs, producerId, featNpcs);
  const weeksUntilRelease = Math.max(0, (gs.lastReleaseWeek || -99) + RELEASE_COOLDOWN.single - gs.totalWeeks);

  const featCost = featNpcs.reduce((total, npcId) => {
    const npc = NPC_ARTISTS.find(n => n.id === npcId);
    const discount = gs.careerType === 'fallen_star' ? 0.8 : 1.0;
    return total + Math.round((npc?.collabCost || 0) * discount);
  }, 0);
  const totalCost = producer.cost + featCost;

  const doRecord = () => {
    if (!title.trim()) { showToast('Name your track'); return; }
    if (gs.money < totalCost) { showToast('Need ' + fmtN(totalCost) + ' total'); return; }
    if (gs.energy < 25) { showToast('Too exhausted to record'); return; }
    if (producer.minFans > gs.fans) { showToast('Need ' + fmt(producer.minFans) + ' fans for this producer'); return; }
    const snap = totalCost;
    patchFn(prev => {
      const quality = calcSongQuality(prev, producerId, featNpcs);
      const track = { id:uid(), title:title.trim(), genre:prev.genre, quality, producerId, featNpcs:[...featNpcs], released:false, releaseWeek:null, chartPos:null, recordWeek:prev.totalWeeks };
      return {
        catalog: [...(prev.catalog || []), track],
        money: clamp(prev.money - snap, 0, 999_000_000_000),
        energy: clamp(prev.energy - 25, 0, 100),
        news: addNews(prev.news, 'Recorded "' + title.trim() + '" · Quality ' + quality + '/100', 'pos', prev.totalWeeks),
      };
    });
    showToast('Recorded "' + title + '" · Q' + previewQ);
    setTitle(''); setFeatNpcs([]); setOpenTier(null); setSection('catalog');
  };

  const doRelease = (trackId) => {
    if (weeksUntilRelease > 0) { showToast('Cooldown: ' + weeksUntilRelease + 'w'); return; }
    patchFn(prev => {
      const track = prev.catalog.find(t => t.id === trackId);
      return {
        catalog: prev.catalog.map(t => t.id === trackId ? { ...t, released:true, releaseWeek:prev.totalWeeks } : t),
        lastReleaseWeek: prev.totalWeeks,
        fans: clamp(prev.fans + Math.round(Math.sqrt(prev.fans||1)*0.5+50), 0, 999_000_000),
        clout: clamp(prev.clout + 1, 0, 100),
        news: addNews(prev.news, 'Dropped "' + (track?.title||'') + '" — the charts await.', 'pos', prev.totalWeeks),
      };
    });
    showToast('Single dropped!');
  };

  const toggleFeat = id => setFeatNpcs(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const qColor = q => q>=80?'var(--accent-green)':q>=60?'var(--accent-gold-lt)':q>=40?'var(--accent-orange)':'var(--accent-red)';
  const npcByTier = tid => NPC_ARTISTS.filter(n => n.tier === tid);
  const canFeature = tid => gs.fans >= NPC_TIERS[tid].minFansToFeature;

  const handleCoverUpload = (e, onLoaded) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Images only'); return; }
    const reader = new FileReader();
    reader.onload = ev => onLoaded(ev.target.result);
    reader.readAsDataURL(file);
  };

  const assignTrackCover = (trackId, dataUrl) => {
    patchFn(prev => ({
      catalog: prev.catalog.map(t => t.id === trackId ? { ...t, coverArt: dataUrl } : t),
    }));
  };

  // ── Studio: project creation ────────────────────────────────────────────
  const [projType, setProjType]     = useState('ep');
  const [projTitle, setProjTitle]   = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [projCover, setProjCover]   = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const minTracks = projType === 'ep' ? 4 : 8;
  const maxTracks = projType === 'ep' ? 6 : 12;
  const cooldownKey = projType === 'ep' ? 'lastEpWeek' : 'lastAlbumWeek';
  const cooldownLen = RELEASE_COOLDOWN[projType];
  const projCooldown = Math.max(0, ((gs[cooldownKey] || -99) + cooldownLen) - gs.totalWeeks);

  const toggleTrack = (id) => {
    setSelectedTracks(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= maxTracks ? prev : [...prev, id]
    );
  };

  const doCreateProject = () => {
    if (!projTitle.trim()) { showToast('Give your project a title'); return; }
    if (selectedTracks.length < minTracks) { showToast(`Select at least ${minTracks} tracks`); return; }
    if (projCooldown > 0) { showToast(`Cooldown: ${projCooldown}w left`); return; }

    patchFn(prev => {
      const tracks = selectedTracks.map(id => prev.catalog.find(t => t.id === id)).filter(Boolean);
      const avgQ = Math.round(tracks.reduce((a, t) => a + t.quality, 0) / tracks.length);
      const fansGain = Math.round(Math.sqrt(prev.fans || 1) * 2 + avgQ * 10);
      const proj = {
        id: uid(),
        title: projTitle.trim(),
        type: projType,
        trackIds: [...selectedTracks],
        avgQuality: avgQ,
        releaseWeek: prev.totalWeeks,
        coverArt: projCover,
        streams: 0,
      };
      return {
        projects: [...(prev.projects || []), proj],
        catalog: prev.catalog.map(t => selectedTracks.includes(t.id)
          ? { ...t, released: true, releaseWeek: prev.totalWeeks, inProject: proj.id }
          : t),
        [cooldownKey]: prev.totalWeeks,
        lastReleaseWeek: prev.totalWeeks,
        fans: clamp(prev.fans + fansGain, 0, 999_000_000),
        clout: clamp(prev.clout + 3, 0, 100),
        news: addNews(prev.news, `Released ${projType.toUpperCase()} "${projTitle.trim()}" · ${tracks.length} tracks · Avg Q${avgQ}`, 'pos', prev.totalWeeks),
      };
    });
    showToast(`${projType.toUpperCase()} "${projTitle}" released!`);
    setProjTitle(''); setSelectedTracks([]); setProjCover(null); setShowProjectForm(false);
  };

  return (
    <div className="tab-content li-scene">
      <Aurora c1="#1DB954" c2="#7C6CFF" c3="#ffffff" />
      <div className="li-scene-content">
      <SubNav items={SUB_NAV} active={section} onChange={setSection} />

      {gs.inPrison && (
        <div className="li-glass" style={{ borderColor:'rgba(220,38,38,0.3)', background:'rgba(220,38,38,0.08)', padding:'12px 14px', marginBottom:16, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--accent-red)', letterSpacing:2 }}>BEHIND BARS</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
            {gs.prisonWeeksLeft} week{gs.prisonWeeksLeft !== 1 ? 's' : ''} remaining — can only rest
          </div>
        </div>
      )}

      {/* ════════════════════════════ TRAIN ════════════════════════════ */}
      {section === 'train' && (
        <>
          <div className="li-glass li-stagger" style={{ '--i':0, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--li-accent-lt)', fontFamily:'var(--font-mono)' }}>Overall Mastery</div>
              <div style={{ fontFamily:'var(--li-font-display)', fontSize:22, fontWeight:700 }}>{overallMastery}%</div>
            </div>
            <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:overallMastery+'%', background:'linear-gradient(90deg,var(--li-accent),#3FD3C6)', borderRadius:3, transition:'width 500ms var(--li-ease-smooth)' }}/>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>Training costs {TRAINING_COST} energy · +{TRAINING_GAIN} per session · Max {MAX_SKILL}</div>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <ResourcePill label="Energy" value={gs.energy} max={100} color={gs.energy>=TRAINING_COST?'var(--accent-green)':'var(--accent-red)'} suffix="%" />
          </div>

          <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
            {SKILLS.map((skill, i) => {
              const val = gs[skill.id] || 0;
              const pct = Math.round((val / MAX_SKILL) * 100);
              const Icon = SKILL_ICONS[skill.id];
              const maxed = val >= MAX_SKILL;
              return (
                <div key={skill.id} className="li-stagger" style={{ '--i':i+1, padding:'12px 0', borderBottom:i<SKILLS.length-1?'1px solid var(--li-glass-border)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:skill.color+'20', display:'flex', alignItems:'center', justifyContent:'center', color:skill.color, flexShrink:0 }}>
                      <Icon />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{skill.label}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:skill.color }}>{val}/{MAX_SKILL}</span>
                      </div>
                      <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:pct+'%', background:skill.color, borderRadius:3, transition:'width 400ms var(--li-ease-smooth)' }}/>
                      </div>
                    </div>
                    <Magnetic strength={6} onClick={() => !maxed && canTrain && !gs.inPrison && trainSkill(skill.id)} disabled={!canTrain || maxed || gs.inPrison}
                      className="soc-pill" style={{ flexShrink:0, background:maxed?'var(--li-glass-bg)':skill.color+'22', color:maxed?'var(--text-muted)':skill.color, border:'1px solid '+(maxed?'var(--li-glass-border)':skill.color+'50'), fontSize:11, padding:'6px 12px' }}>
                      {maxed ? 'MAX' : '+'+TRAINING_GAIN}
                    </Magnetic>
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', paddingLeft:44 }}>{skill.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="li-glass" style={{ padding:14, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>Genre Mastery</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{genreData?.label} specialization</div>
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent-gold-lt)', fontWeight:700 }}>{genreBonus}/50</span>
            </div>
            <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, marginBottom:12, overflow:'hidden' }}>
              <div style={{ height:'100%', width:((genreBonus/50)*100)+'%', background:'var(--accent-gold)', borderRadius:3 }}/>
            </div>
            <Magnetic strength={5} onClick={() => canTrain && genreBonus<50 && !gs.inPrison && trainGenre()} disabled={!canTrain || genreBonus >= 50 || gs.inPrison}
              className="soc-glass-btn" style={{ width:'100%', padding:'10px 0', textAlign:'center', fontSize:13, fontWeight:700 }}>
              Practice Genre · {TRAINING_COST} NRG
            </Magnetic>
          </div>

          <Magnetic strength={5} onClick={() => gs.energy<100 && rest()} disabled={gs.energy >= 100}
            className="soc-pill" style={{ width:'100%', padding:'12px 0', textAlign:'center', background:gs.energy<100?'var(--li-accent-soft)':'var(--li-glass-bg)', color:gs.energy<100?'var(--li-accent-lt)':'var(--text-muted)', fontSize:13 }}>
            Rest This Week · +40 Energy
          </Magnetic>
        </>
      )}

      {/* ════════════════════════════ JOBS ════════════════════════════ */}
      {section === 'jobs' && (
        <>
          {gs.activeJob && (
            <div className="li-glass" style={{ background:'rgba(13,159,104,0.08)', borderColor:'rgba(13,159,104,0.3)', padding:14, marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'var(--accent-green)', fontFamily:'var(--font-mono)', marginBottom:6 }}>Active Job</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{gs.activeJob.label}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>
                <span>{fmtN(gs.activeJob.weeklyPay)}/week</span>
                <span>{gs.activeJob.weeksLeft}/{gs.activeJob.totalDuration} weeks left</span>
              </div>
              <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, marginBottom:10, overflow:'hidden' }}>
                <div style={{ height:'100%', width:(((gs.activeJob.totalDuration-gs.activeJob.weeksLeft)/gs.activeJob.totalDuration)*100)+'%', background:'var(--accent-green)', borderRadius:3 }}/>
              </div>
              {gs.activeJob.illegal && (
                <div style={{ fontSize:11, color:'var(--accent-red)', marginBottom:8 }}>
                  ⚠ Illegal — {Math.round((gs.activeJob.prisonRisk||0)*100)}% arrest risk per week
                </div>
              )}
              <button className="soc-pill" style={{ width:'100%', padding:'9px 0', background:'rgba(220,38,38,0.1)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.2)', fontSize:12 }} onClick={quitJob}>
                Quit Job (lose remaining income)
              </button>
            </div>
          )}

          {gs.inPrison && (
            <div className="li-glass" style={{ background:'rgba(220,38,38,0.08)', borderColor:'rgba(220,38,38,0.25)', padding:12, marginBottom:16, fontSize:12, color:'var(--text-muted)' }}>
              Can't work while in prison. {gs.prisonWeeksLeft}w remaining.
            </div>
          )}

          {!gs.activeJob && !gs.inPrison && (
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>
              One job at a time. Jobs pay weekly for their duration and cost energy each week.
            </div>
          )}

          <SectionLabel>Legal Hustle</SectionLabel>
          <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
            {JOBS.filter(j => !j.illegal).map((job, i) => {
              const unlocked = checkJobReq(job);
              const isActive = gs.activeJob?.jobId === job.id;
              return (
                <div key={job.id} className="li-stagger" style={{ '--i':i, paddingTop:12, paddingBottom:12, borderBottom:'1px solid var(--li-glass-border)', opacity: (!unlocked || (gs.activeJob && !isActive)) ? 0.45 : 1 }}>
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
                  <Magnetic strength={5} disabled={!!gs.activeJob || gs.inPrison || !unlocked} onClick={() => takeJob(job)}
                    className="soc-glass-btn" style={{ display:'inline-block', padding:'6px 14px', fontSize:11, fontWeight:700 }}>
                    {isActive ? 'ACTIVE' : 'TAKE JOB'}
                  </Magnetic>
                </div>
              );
            })}
          </div>

          <SectionLabel>Illegal Hustle · High pay, prison risk every week</SectionLabel>
          <div className="li-glass" style={{ padding:'4px 16px', borderColor:'rgba(220,38,38,0.2)' }}>
            {JOBS.filter(j => j.illegal).map((job, i) => {
              const unlocked = checkJobReq(job);
              const isActive = gs.activeJob?.jobId === job.id;
              return (
                <div key={job.id} className="li-stagger" style={{ '--i':i, paddingTop:12, paddingBottom:12, borderBottom:'1px solid rgba(220,38,38,0.15)', opacity: (!unlocked || (gs.activeJob && !isActive)) ? 0.45 : 1 }}>
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
                  <Magnetic strength={5} disabled={!!gs.activeJob || gs.inPrison || !unlocked} onClick={() => takeJob(job)}
                    className="soc-pill" style={{ display:'inline-block', padding:'6px 14px', background:'rgba(220,38,38,0.1)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.3)', fontSize:11 }}>
                    {isActive ? 'ACTIVE' : 'TAKE JOB'}
                  </Magnetic>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════════════════════════ RECORD ════════════════════════════ */}
      {section === 'record' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <SectionLabel>New Track</SectionLabel>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:qColor(previewQ), marginTop:-10 }}>Q{previewQ}</div>
          </div>
          <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
            <label className="form-label">Track Title</label>
            <input className="ob-input" placeholder="e.g. No Mercy, Levels, Timeless..." value={title} onChange={e=>setTitle(e.target.value)} maxLength={40} style={{marginBottom:16}}/>

            <label className="form-label">Producer</label>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
              {PRODUCERS.filter(p=>p.minFans<=gs.fans).map(p => (
                <div key={p.id} onClick={()=>setProducerId(p.id)} className="li-row"
                  style={{textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center', padding:'10px 12px', borderRadius:12, border:'1px solid '+(producerId===p.id?'var(--li-accent)':'var(--li-glass-border)'), background:producerId===p.id?'var(--li-accent-soft)':'transparent', cursor:'pointer'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.desc} · +{p.qBonus} quality</div>
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--accent-gold-lt)',flexShrink:0,marginLeft:8}}>
                    {p.cost>0?fmtN(p.cost):'FREE'}
                  </div>
                </div>
              ))}
            </div>

            <label className="form-label">
              Features
              {featNpcs.length>0 && <span style={{marginLeft:8,color:'var(--accent-gold-lt)',fontFamily:'var(--font-mono)',fontSize:11}}>{featNpcs.length} · {fmtN(featCost)}</span>}
            </label>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16}}>
              {['S','A','B','C','D'].map(tid => {
                const t = NPC_TIERS[tid];
                const ok = canFeature(tid);
                const isOpen = openTier === tid;
                const sel = featNpcs.filter(id => NPC_ARTISTS.find(n=>n.id===id&&n.tier===tid));
                return (
                  <div key={tid}>
                    <div
                      onClick={() => ok && setOpenTier(isOpen ? null : tid)}
                      className="li-row"
                      style={{
                        display:'flex',alignItems:'center',gap:8,padding:'9px 10px',borderRadius:12,
                        background: isOpen?'var(--li-glass-bg-hi)':'transparent',
                        border:'1px solid '+(isOpen?t.color+'60':'var(--li-glass-border)'),
                        cursor:ok?'pointer':'default', opacity:ok?1:0.45,
                      }}
                    >
                      <div style={{width:8,height:8,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:700,color:t.color}}>{t.label}</span>
                        <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:6}}>{t.desc}</span>
                      </div>
                      {!ok && <div style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:'var(--text-muted)'}}><LockIcon/><span>{fmt(t.minFansToFeature)} fans</span></div>}
                      {ok && <>
                        {sel.length>0 && <span style={{fontSize:11,color:t.color,fontFamily:'var(--font-mono)'}}>{sel.length}</span>}
                        <span style={{fontSize:10,color:'var(--text-muted)'}}>{t.feeRange}</span>
                        <ChevronDown open={isOpen}/>
                      </>}
                    </div>
                    {isOpen && ok && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:5,padding:'8px 4px 4px'}}>
                        {npcByTier(tid).map(npc => {
                          const on = featNpcs.includes(npc.id);
                          const aCl = npc.attitude==='hostile'?'var(--accent-red)':npc.attitude==='selective'?'var(--accent-orange)':'var(--accent-green)';
                          return (
                            <button key={npc.id} onClick={()=>toggleFeat(npc.id)} style={{
                              display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'6px 8px',borderRadius:8,
                              border:'1px solid '+(on?t.color:'var(--li-glass-border)'),
                              background:on?t.color+'18':'transparent',cursor:'pointer',
                            }}>
                              <div style={{display:'flex',alignItems:'center',gap:5}}>
                                <div style={{width:18,height:18,borderRadius:4,background:npc.color+'30',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                  <span style={{fontSize:7,fontWeight:900,color:npc.color}}>{npc.initials}</span>
                                </div>
                                <span style={{fontSize:12,fontWeight:700,color:on?'var(--text-primary)':'var(--text-secondary)'}}>{npc.name}</span>
                              </div>
                              <div style={{display:'flex',gap:5,marginTop:2}}>
                                <span style={{fontSize:9,fontFamily:'var(--font-mono)',color:on?t.color:'var(--text-muted)'}}>{fmtN(npc.collabCost)}</span>
                                <span style={{fontSize:8,color:aCl,textTransform:'uppercase',letterSpacing:'0.4px'}}>{npc.attitude}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{background:'var(--li-glass-bg-hi)',borderRadius:14,padding:'10px 12px',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--text-muted)'}}>Producer</span>
                <span>{producer.cost>0?fmtN(producer.cost):'FREE'}</span>
              </div>
              {featCost>0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:4}}>
                  <span style={{color:'var(--text-muted)'}}>Feature fees ({featNpcs.length})</span>
                  <span style={{color:'var(--accent-gold-lt)'}}>{fmtN(featCost)}</span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:4}}>
                <span style={{color:'var(--text-muted)'}}>Energy</span>
                <span style={{color:gs.energy>=25?'var(--text-primary)':'var(--accent-red)'}}>-25</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,marginTop:8,borderTop:'1px solid var(--li-glass-border)',paddingTop:8}}>
                <span>Total</span>
                <span style={{color:gs.money>=totalCost?'var(--accent-gold-lt)':'var(--accent-red)'}}>{fmtN(totalCost)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:4}}>
                <span style={{color:'var(--text-muted)'}}>Est. Quality</span>
                <span style={{color:qColor(previewQ),fontWeight:700}}>Q{previewQ}/99</span>
              </div>
            </div>
            <Magnetic strength={6} disabled={!title.trim()||gs.money<totalCost||gs.energy<25} onClick={doRecord}
              className="soc-pill" style={{ width:'100%', textAlign:'center', padding:'13px 0', background:(!title.trim()||gs.money<totalCost||gs.energy<25)?'var(--li-glass-bg)':'var(--li-accent)', color:(!title.trim()||gs.money<totalCost||gs.energy<25)?'var(--text-muted)':'#fff', fontSize:14 }}>
              RECORD TRACK
            </Magnetic>
          </div>
        </>
      )}

      {/* ════════════════════════════ CATALOG ════════════════════════════ */}
      {section === 'catalog' && (
        <>
          <SectionLabel>{released.length} released · {unreleased.length} in vault</SectionLabel>
          {(gs.catalog||[]).length === 0 ? (
            <div className="li-glass" style={{ padding:'30px 16px', textAlign:'center', marginBottom:16 }}>
              <svg viewBox="0 0 24 24" style={{width:36,height:36,stroke:'var(--text-muted)',fill:'none',strokeWidth:1.5,margin:'0 auto 10px',display:'block'}}>
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <div style={{ color:'var(--text-muted)', fontSize:13 }}>No tracks yet. Head to Record.</div>
            </div>
          ) : (
            <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
              {(gs.catalog||[]).map((track, i) => (
                <div key={track.id} className="li-stagger" style={{ '--i':i, display:'flex', gap:10, alignItems:'flex-start', paddingTop:10, paddingBottom:10, borderBottom:i<gs.catalog.length-1?'1px solid var(--li-glass-border)':'none' }}>
                  <label style={{flexShrink:0,cursor:'pointer'}}>
                    <div style={{width:40,height:40,borderRadius:8,background:'var(--surface-2)',border:'1px solid var(--li-glass-border)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {track.coverArt
                        ? <img src={track.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>+IMG</span>
                      }
                    </div>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e => handleCoverUpload(e, url => assignTrackCover(track.id, url))}/>
                  </label>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{track.title}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:1}}>
                      {genreData?.label}
                      {track.featNpcs?.length > 0 && ' ft. '+track.featNpcs.map(id=>NPC_ARTISTS.find(n=>n.id===id)?.name||id).join(', ')}
                      {track.released && track.chartPos ? ' · #'+track.chartPos : track.released ? ' · Live' : ' · Unreleased'}
                    </div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:qColor(track.quality),marginTop:2}}>Q{track.quality}</div>
                  </div>
                  {!track.released && (
                    <Magnetic strength={4} disabled={weeksUntilRelease>0} onClick={() => doRelease(track.id)}
                      className="soc-pill" style={{ padding:'7px 12px', background:weeksUntilRelease>0?'var(--li-glass-bg)':'var(--li-accent)', color:weeksUntilRelease>0?'var(--text-muted)':'#fff', fontSize:11, flexShrink:0 }}>
                      {weeksUntilRelease>0 ? weeksUntilRelease+'w' : 'DROP'}
                    </Magnetic>
                  )}
                  {track.released && (
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--accent-green)'}}>LIVE</div>
                      {track.chartPos && <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--accent-gold-lt)'}}>#{track.chartPos}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {weeksUntilRelease > 0 && (
            <div style={{fontSize:11,color:'var(--accent-red)',textAlign:'center',marginBottom:16}}>
              Release cooldown: {weeksUntilRelease} week{weeksUntilRelease!==1?'s':''} left
            </div>
          )}

          {/* EP / Album creator toggle */}
          <SectionLabel action={showProjectForm ? 'Cancel' : '+ New EP/Album'} onAction={()=>setShowProjectForm(v=>!v)}>EP / Album</SectionLabel>

          {showProjectForm && (
            <div className="li-glass" style={{padding:16, marginBottom:16}}>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {['ep','album'].map(type => (
                  <div key={type} onClick={()=>{setProjType(type);setSelectedTracks([]);}} className="li-row"
                    style={{flex:1,textAlign:'center', padding:'10px', borderRadius:12, cursor:'pointer', border:'1px solid '+(projType===type?'var(--li-accent)':'var(--li-glass-border)'), background:projType===type?'var(--li-accent-soft)':'transparent'}}>
                    <div style={{fontWeight:700,fontSize:13}}>{type.toUpperCase()}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{type==='ep'?'4–6 tracks · 6w cooldown':'8–12 tracks · 12w cooldown'}</div>
                  </div>
                ))}
              </div>

              {projCooldown > 0 && (
                <div style={{fontSize:11,color:'var(--accent-orange)',background:'rgba(224,112,32,0.08)',borderRadius:12,padding:'8px 12px',marginBottom:12}}>
                  {projType.toUpperCase()} cooldown: {projCooldown} week{projCooldown!==1?'s':''} remaining
                </div>
              )}

              <label className="form-label">Project Title</label>
              <input className="ob-input" placeholder="e.g. Before The Dawn, Chapter One..." value={projTitle} onChange={e=>setProjTitle(e.target.value)} maxLength={40} style={{marginBottom:14}}/>

              <label className="form-label">Cover Art</label>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{width:60,height:60,borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--li-glass-border)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {projCover
                    ? <img src={projCover} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:'none',stroke:'var(--text-muted)',strokeWidth:1.5}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  }
                </div>
                <label style={{flex:1}}>
                  <div className="soc-glass-btn" style={{cursor:'pointer',display:'block',textAlign:'center', padding:'9px 0', fontSize:12, fontWeight:700}}>
                    {projCover ? 'Change Cover' : 'Upload Cover'}
                  </div>
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={e => handleCoverUpload(e, url => setProjCover(url))}/>
                </label>
              </div>

              <label className="form-label">
                Select Tracks
                <span style={{marginLeft:8,color:(selectedTracks.length>=minTracks?'var(--accent-green)':'var(--accent-red)'),fontFamily:'var(--font-mono)',fontSize:11}}>
                  {selectedTracks.length}/{maxTracks} (min {minTracks})
                </span>
              </label>

              {(gs.catalog||[]).length === 0 ? (
                <div style={{fontSize:11,color:'var(--text-muted)',padding:'8px 0'}}>Record tracks first before creating a project.</div>
              ) : (gs.catalog||[]).filter(t=>!t.inProject).length === 0 ? (
                <div style={{fontSize:11,color:'var(--text-muted)',padding:'8px 0'}}>All tracks are already part of a project.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:4}}>
                  {(gs.catalog||[]).filter(t=>!t.inProject).map(track => {
                    const on = selectedTracks.includes(track.id);
                    const disabled = !on && selectedTracks.length >= maxTracks;
                    return (
                      <div
                        key={track.id}
                        onClick={() => !disabled && toggleTrack(track.id)}
                        className="li-row"
                        style={{
                          display:'flex',alignItems:'center',gap:10,padding:'9px 10px',
                          borderRadius:12,cursor: disabled ? 'default' : 'pointer',
                          border:'1px solid '+(on?'var(--li-accent)':'var(--li-glass-border)'),
                          background: on?'var(--li-accent-soft)':'transparent',
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        <div style={{width:18,height:18,borderRadius:4,border:'2px solid '+(on?'var(--li-accent)':'var(--li-glass-border)'),background:on?'var(--li-accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {on && <svg viewBox="0 0 24 24" style={{width:12,height:12,fill:'none',stroke:'#fff',strokeWidth:3}}><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{width:36,height:36,borderRadius:6,background:'var(--surface-2)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {track.coverArt
                            ? <img src={track.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            : <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>Q{track.quality}</span>
                          }
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{track.title}</div>
                          <div style={{fontSize:10,color:'var(--text-muted)'}}>
                            {track.released?'Released':'Unreleased'} · Q{track.quality}
                            {track.featNpcs?.length>0 && ' · ft. '+track.featNpcs.map(id=>NPC_ARTISTS.find(n=>n.id===id)?.name).join(', ')}
                          </div>
                        </div>
                        <div style={{flexShrink:0,width:8,height:8,borderRadius:'50%',background:qColor(track.quality)}}/>
                      </div>
                    );
                  })}
                </div>
              )}

              <Magnetic strength={6} disabled={selectedTracks.length < minTracks || !projTitle.trim() || projCooldown > 0} onClick={doCreateProject}
                className="soc-pill" style={{ width:'100%', textAlign:'center', padding:'13px 0', marginTop:16, background:(selectedTracks.length < minTracks || !projTitle.trim() || projCooldown > 0)?'var(--li-glass-bg)':'var(--li-accent)', color:(selectedTracks.length < minTracks || !projTitle.trim() || projCooldown > 0)?'var(--text-muted)':'#fff', fontSize:14 }}>
                RELEASE {projType.toUpperCase()} · {selectedTracks.length} TRACKS
              </Magnetic>
            </div>
          )}

          {(gs.projects||[]).length > 0 && (
            <>
              <SectionLabel>Discography</SectionLabel>
              {(gs.projects||[]).map((proj, i) => {
                const projTracks = (gs.catalog||[]).filter(t=>proj.trackIds?.includes(t.id));
                return (
                  <div key={proj.id} className="li-glass li-stagger" style={{ '--i':i, padding:14, marginBottom:8 }}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:56,height:56,borderRadius:10,background:'var(--surface-2)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {proj.coverArt
                          ? <img src={proj.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <span style={{fontFamily:'var(--li-font-display)',fontSize:18,color:'var(--text-muted)'}}>{proj.title[0]}</span>
                        }
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:'var(--li-font-display)',fontSize:16,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{proj.title}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                          {proj.type.toUpperCase()} · {projTracks.length} tracks · Avg Q{proj.avgQuality} · Wk {proj.releaseWeek}
                        </div>
                      </div>
                      <span className="tag tag-green" style={{flexShrink:0}}>OUT</span>
                    </div>
                    {projTracks.length > 0 && (
                      <div style={{marginTop:10,display:'flex',gap:4,flexWrap:'wrap'}}>
                        {projTracks.map(t=>(
                          <span key={t.id} style={{fontSize:10,color:'var(--text-muted)',background:'var(--li-glass-bg-hi)',borderRadius:6,padding:'3px 8px'}}>{t.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}
