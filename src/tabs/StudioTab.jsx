import { useState } from 'react';
import { PRODUCERS, GENRES } from '../data/constants';
import { NPC_ARTISTS, NPC_TIERS } from '../data/artists';
import { calcSongQuality } from '../engine/qualityCalc';
import { clamp, fmt, fmtN, uid } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

const RELEASE_COOLDOWN = { single: 2, ep: 6, album: 12 };

const LockIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width:12, height:12, fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ChevronDown = ({ open }) => (
  <svg viewBox="0 0 24 24" style={{ width:14, height:14, fill:'none', stroke:'var(--text-muted)', strokeWidth:2, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 200ms' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function StudioTab({ gs, patch, patchFn, showToast }) {
  const [view, setView]             = useState('catalog');
  const [title, setTitle]           = useState('');
  const [producerId, setProducerId] = useState('bedroom');
  const [featNpcs, setFeatNpcs]     = useState([]);
  const [projType, setProjType]     = useState('ep');
  const [projTitle, setProjTitle]   = useState('');
  const [openTier, setOpenTier]     = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [projCover, setProjCover]   = useState(null);  // base64 data URL
  const [trackCoverEditing, setTrackCoverEditing] = useState(null); // trackId being edited

  const released   = (gs.catalog || []).filter(t => t.released);
  const unreleased = (gs.catalog || []).filter(t => !t.released);
  const genreData  = GENRES.find(g => g.id === gs.genre);
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
    setTitle(''); setFeatNpcs([]); setOpenTier(null); setView('catalog');
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

  // ── Cover art handler ──────────────────────────────────────────────────────
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
    setTrackCoverEditing(null);
  };

  // ── Project creation ───────────────────────────────────────────────────────
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
    setProjTitle(''); setSelectedTracks([]); setProjCover(null); setView('catalog');
  };

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        {['catalog','record','project'].map(v => (
          <div key={v} className={'sub-tab'+(view===v?' on':'')} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase()+v.slice(1)}
          </div>
        ))}
      </div>

      {view === 'catalog' && (
        <>
          <div className="sec-head">
            <div className="sec-title">Catalog</div>
            <div className="sec-sub">{released.length} released · {unreleased.length} in vault</div>
          </div>
          {(gs.catalog||[]).length === 0 ? (
            <div className="card"><div className="empty-state"><div className="empty-state-icon">
              <svg viewBox="0 0 24 24" style={{width:40,height:40,stroke:'var(--text-muted)',fill:'none',strokeWidth:1.5}}>
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg></div><div className="empty-state-text">No tracks yet. Hit the studio.</div></div></div>
          ) : (
            <div className="card">
              {(gs.catalog||[]).map(track => (
                <div key={track.id} className="track-row" style={{alignItems:'flex-start',paddingTop:10,paddingBottom:10}}>
                  {/* Cover thumbnail / upload */}
                  <label style={{flexShrink:0,cursor:'pointer'}}>
                    <div style={{width:40,height:40,borderRadius:6,background:'var(--surface-2)',border:'1px solid var(--border)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {track.coverArt
                        ? <img src={track.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)'}}>+IMG</span>
                      }
                    </div>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e => handleCoverUpload(e, url => assignTrackCover(track.id, url))}/>
                  </label>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-meta">
                      {genreData?.label}
                      {track.featNpcs?.length > 0 && ' ft. '+track.featNpcs.map(id=>NPC_ARTISTS.find(n=>n.id===id)?.name||id).join(', ')}
                      {track.released && track.chartPos ? ' · #'+track.chartPos : track.released ? ' · Live' : ' · Unreleased'}
                    </div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:qColor(track.quality),marginTop:2}}>Q{track.quality}</div>
                  </div>
                  {!track.released && (
                    <button className="btn btn-purple btn-sm" disabled={weeksUntilRelease>0} onClick={() => doRelease(track.id)}>
                      {weeksUntilRelease>0 ? weeksUntilRelease+'w' : 'DROP'}
                    </button>
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
            <div style={{fontSize:11,color:'var(--accent-red)',textAlign:'center',marginTop:8}}>
              Release cooldown: {weeksUntilRelease} week{weeksUntilRelease!==1?'s':''} left
            </div>
          )}
        </>
      )}

      {view === 'record' && (
        <>
          <div className="sec-head">
            <div className="sec-title">New Track</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:13,color:qColor(previewQ)}}>Q{previewQ}</div>
          </div>
          <div className="card" style={{marginBottom:12}}>
            <label className="form-label">Track Title</label>
            <input className="ob-input" placeholder="e.g. No Mercy, Levels, Timeless..." value={title} onChange={e=>setTitle(e.target.value)} maxLength={40} style={{marginBottom:16}}/>

            <label className="form-label">Producer</label>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
              {PRODUCERS.filter(p=>p.minFans<=gs.fans).map(p => (
                <div key={p.id} className={'sel'+(producerId===p.id?' on':'')} style={{textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>setProducerId(p.id)}>
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
                      style={{
                        display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:'var(--r)',
                        background: isOpen?'var(--surface-2)':'var(--surface-1)',
                        border:'1px solid '+(isOpen?t.color+'60':'var(--border)'),
                        cursor:ok?'pointer':'default', opacity:ok?1:0.45, transition:'all 150ms',
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
                              border:'1px solid '+(on?t.color:'var(--border)'),
                              background:on?t.color+'18':'var(--surface-1)',cursor:'pointer',
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

            <div style={{background:'var(--surface-1)',borderRadius:'var(--r)',padding:'10px 12px',marginBottom:16}}>
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
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,marginTop:8,borderTop:'1px solid var(--border)',paddingTop:8}}>
                <span>Total</span>
                <span style={{color:gs.money>=totalCost?'var(--accent-gold-lt)':'var(--accent-red)'}}>{fmtN(totalCost)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:4}}>
                <span style={{color:'var(--text-muted)'}}>Est. Quality</span>
                <span style={{color:qColor(previewQ),fontWeight:700}}>Q{previewQ}/99</span>
              </div>
            </div>
            <button className="btn btn-purple btn-full" disabled={!title.trim()||gs.money<totalCost||gs.energy<25} onClick={doRecord}>
              RECORD TRACK
            </button>
          </div>
        </>
      )}

      {view === 'project' && (
        <>
          <div className="sec-head">
            <div className="sec-title">EP / Album</div>
            <div className="sec-sub">{(gs.projects||[]).length} released</div>
          </div>

          <div className="card" style={{marginBottom:12}}>
            {/* Type selector */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {['ep','album'].map(type => (
                <div key={type} className={'sel'+(projType===type?' on':'')} style={{flex:1,textAlign:'center'}} onClick={()=>{setProjType(type);setSelectedTracks([]);}}>
                  <div className="sel-label">{type.toUpperCase()}</div>
                  <div className="sel-sub">{type==='ep'?'4–6 tracks · 6w cooldown':'8–12 tracks · 12w cooldown'}</div>
                </div>
              ))}
            </div>

            {/* Cooldown warning */}
            {projCooldown > 0 && (
              <div style={{fontSize:11,color:'var(--accent-orange)',background:'rgba(224,112,32,0.08)',borderRadius:'var(--r)',padding:'8px 12px',marginBottom:12}}>
                {projType.toUpperCase()} cooldown: {projCooldown} week{projCooldown!==1?'s':''} remaining
              </div>
            )}

            {/* Title */}
            <label className="form-label">Project Title</label>
            <input className="ob-input" placeholder="e.g. Before The Dawn, Chapter One..." value={projTitle} onChange={e=>setProjTitle(e.target.value)} maxLength={40} style={{marginBottom:14}}/>

            {/* Cover art upload */}
            <label className="form-label">Cover Art</label>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:64,height:64,borderRadius:8,background:'var(--surface-2)',border:'1px solid var(--border)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {projCover
                  ? <img src={projCover} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <svg viewBox="0 0 24 24" style={{width:24,height:24,fill:'none',stroke:'var(--text-muted)',strokeWidth:1.5}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                }
              </div>
              <label style={{flex:1}}>
                <div className="btn btn-outline btn-sm" style={{cursor:'pointer',display:'block',textAlign:'center'}}>
                  {projCover ? 'Change Cover' : 'Upload Cover'}
                </div>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e => handleCoverUpload(e, url => setProjCover(url))}/>
              </label>
            </div>

            {/* Track selection */}
            <label className="form-label">
              Select Tracks
              <span style={{marginLeft:8,color:(selectedTracks.length>=minTracks?'var(--accent-green)':'var(--accent-red)'),fontFamily:'var(--font-mono)',fontSize:11}}>
                {selectedTracks.length}/{maxTracks} (min {minTracks})
              </span>
            </label>

            {(gs.catalog||[]).length === 0 ? (
              <div className="empty-state" style={{marginTop:8}}><div className="empty-state-text">Record tracks first before creating a project.</div></div>
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
                      style={{
                        display:'flex',alignItems:'center',gap:10,padding:'9px 10px',
                        borderRadius:'var(--r)',cursor: disabled ? 'default' : 'pointer',
                        border:'1px solid '+(on?'var(--accent-purple)':'var(--border)'),
                        background: on?'rgba(108,63,204,0.08)':'var(--surface-1)',
                        opacity: disabled ? 0.4 : 1,
                        transition:'all 150ms',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{width:18,height:18,borderRadius:4,border:'2px solid '+(on?'var(--accent-purple)':'var(--border)'),background:on?'var(--accent-purple)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 150ms'}}>
                        {on && <svg viewBox="0 0 24 24" style={{width:12,height:12,fill:'none',stroke:'#fff',strokeWidth:3}}><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {/* Cover thumbnail */}
                      <div style={{width:36,height:36,borderRadius:5,background:'var(--surface-2)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
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

            <div style={{marginTop:16}}>
              <button
                className="btn btn-purple btn-full"
                disabled={selectedTracks.length < minTracks || !projTitle.trim() || projCooldown > 0}
                onClick={doCreateProject}
              >
                RELEASE {projType.toUpperCase()} · {selectedTracks.length} TRACKS
              </button>
            </div>
          </div>

          {/* Discography */}
          {(gs.projects||[]).length > 0 && (
            <>
              <div className="sec-head" style={{marginTop:8}}><div className="sec-title">Discography</div></div>
              {(gs.projects||[]).map(proj => {
                const projTracks = (gs.catalog||[]).filter(t=>proj.trackIds?.includes(t.id));
                return (
                  <div key={proj.id} className="card" style={{marginBottom:8}}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      {/* Cover */}
                      <div style={{width:56,height:56,borderRadius:8,background:'var(--surface-2)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {proj.coverArt
                          ? <img src={proj.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <span style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--text-muted)'}}>{proj.title[0]}</span>
                        }
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:'var(--font-display)',fontSize:17,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{proj.title}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                          {proj.type.toUpperCase()} · {projTracks.length} tracks · Avg Q{proj.avgQuality} · Wk {proj.releaseWeek}
                        </div>
                      </div>
                      <span className="tag tag-green" style={{flexShrink:0}}>OUT</span>
                    </div>
                    {projTracks.length > 0 && (
                      <div style={{marginTop:10,display:'flex',gap:4,flexWrap:'wrap'}}>
                        {projTracks.map(t=>(
                          <span key={t.id} style={{fontSize:10,color:'var(--text-muted)',background:'var(--surface-2)',borderRadius:4,padding:'2px 6px'}}>{t.title}</span>
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
  );
}
