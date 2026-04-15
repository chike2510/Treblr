import { useState } from 'react';
import { PRODUCERS, NPC_ARTISTS, GENRES } from '../data';
import { clamp, fmt, fmtN, uid, calcSongQuality, getTalent } from '../utils';

const STUDIO_TABS = ['Record', 'Catalog', 'Projects', 'Videos'];

const QUALITY_COLOR = (q) => q >= 80 ? 'var(--green-lt)' : q >= 60 ? 'var(--gold-lt)' : q >= 40 ? 'var(--orange)' : 'var(--red-lt)';
const QUALITY_LABEL = (q) => q >= 85 ? 'MASTERPIECE' : q >= 70 ? 'GREAT' : q >= 55 ? 'SOLID' : q >= 40 ? 'AVERAGE' : 'WEAK';

export default function StudioTab({ gs, patch, patchFn, addFeed, showToast }) {
  const [stab, setStab] = useState('Record');

  // ── RECORD FORM STATE ──────────────────────────────────────────────────────
  const [trackTitle,  setTrackTitle]  = useState('');
  const [producerId,  setProducerId]  = useState('bedroom');
  const [features,    setFeatures]    = useState([]);   // array of npc ids
  const [songGenre,   setSongGenre]   = useState(gs.genre || 'afrobeats');

  // ── PROJECT FORM ──────────────────────────────────────────────────────────
  const [projType,    setProjType]    = useState('ep');  // ep | album
  const [projTitle,   setProjTitle]   = useState('');
  const [projTracks,  setProjTracks]  = useState([]);    // selected track ids

  // ── VIDEO FORM ────────────────────────────────────────────────────────────
  const [vidTrack,    setVidTrack]    = useState('');
  const [vidBudget,   setVidBudget]   = useState('standard');

  const producer = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const previewQ  = calcSongQuality(gs, producerId, features);
  const talent    = getTalent(gs);

  // ── Unlocked producers ────────────────────────────────────────────────────
  const unlockProd = (p) => {
    if (gs.careerType === 'rich_kid') return true;
    return gs.fans >= p.minFans;
  };

  // ── Record track ──────────────────────────────────────────────────────────
  const recordTrack = () => {
    if (!trackTitle.trim()) { showToast('ENTER A TRACK TITLE'); return; }
    if (gs.ap < 2) { showToast('NOT ENOUGH AP'); return; }
    if (gs.money < producer.cost) { showToast('NOT ENOUGH CASH'); return; }
    if (gs.energy < 15) { showToast('TOO TIRED TO RECORD'); return; }

    // NPC collab costs
    const featCost = features.reduce((sum, npcId) => {
      const npc = NPC_ARTISTS.find(n => n.id === npcId);
      return sum + (npc ? npc.collabCost : 0);
    }, 0);
    const totalCost = producer.cost + featCost;
    if (gs.money < totalCost) { showToast(`NEED ${fmtN(totalCost)} TOTAL`); return; }

    const quality = calcSongQuality(gs, producerId, features);
    const featNames = features.map(id => NPC_ARTISTS.find(n => n.id === id)?.name).filter(Boolean);

    const track = {
      id:          uid(),
      title:       trackTitle.trim(),
      genre:       songGenre,
      producerId,
      features,
      quality,
      releaseWeek: null,
      released:    false,
      chartPos:    null,
      totalStreams: 0,
      mvId:        null,
    };

    patchFn(prev => ({
      catalog:  [...prev.catalog, track],
      ap:       prev.ap - 2,
      money:    clamp(prev.money - totalCost, 0, 999_000_000),
      energy:   clamp(prev.energy - 18, 0, 100),
      // Practicing recording your genre boosts genre skill
      genreBonus: {
        ...(prev.genreBonus || {}),
        [songGenre]: clamp(((prev.genreBonus || {})[songGenre] || 0) + 1, 0, 20),
      },
    }));

    const featStr = featNames.length ? ` ft. ${featNames.join(', ')}` : '';
    addFeed(`🎙️ Recorded "${track.title}"${featStr} — Quality: ${quality}/99 (${QUALITY_LABEL(quality)}).`, quality >= 65 ? 'pos' : '');
    showToast(`TRACK RECORDED — ${QUALITY_LABEL(quality)}`);
    setTrackTitle('');
    setFeatures([]);
  };

  // ── Release single ────────────────────────────────────────────────────────
  const releaseSingle = (track) => {
    if (gs.ap < 2) { showToast('NOT ENOUGH AP'); return; }
    patchFn(prev => ({
      ap:      prev.ap - 2,
      catalog: prev.catalog.map(t => t.id === track.id
        ? { ...t, released: true, releaseWeek: prev.totalWeeks }
        : t
      ),
      fans:   clamp(prev.fans  + Math.round(track.quality * 15), 0, 999_000_000),
      clout:  clamp(prev.clout + Math.max(1, Math.round(track.quality * 0.08)), 0, 100),
    }));
    addFeed(`🚀 "${track.title}" dropped as a single! Quality ${track.quality}/99.`, 'pos');
    showToast(`SINGLE RELEASED`);
  };

  // ── Release project ───────────────────────────────────────────────────────
  const releaseProject = () => {
    if (!projTitle.trim()) { showToast('ENTER PROJECT TITLE'); return; }
    const minTracks = projType === 'ep' ? 3 : 8;
    if (projTracks.length < minTracks) { showToast(`NEED ${minTracks} TRACKS FOR ${projType.toUpperCase()}`); return; }
    if (gs.ap < 3) { showToast('NOT ENOUGH AP'); return; }

    const selectedTracks = gs.catalog.filter(t => projTracks.includes(t.id));
    const avgQ = Math.round(selectedTracks.reduce((s, t) => s + t.quality, 0) / selectedTracks.length);
    const fanGain = projType === 'ep'
      ? Math.round(avgQ * 80  + gs.fans * 0.05)
      : Math.round(avgQ * 250 + gs.fans * 0.15);
    const moneyGain = projType === 'ep'
      ? Math.round(avgQ * 50000  + gs.fans * 0.8)
      : Math.round(avgQ * 200000 + gs.fans * 3);
    const cloutGain = projType === 'ep' ? Math.round(avgQ * 0.1) : Math.round(avgQ * 0.3);

    const project = {
      id: uid(), type: projType, title: projTitle.trim(),
      trackIds: [...projTracks], avgQuality: avgQ, releaseWeek: gs.totalWeeks,
    };

    patchFn(prev => ({
      ap:       prev.ap - 3,
      projects: [...prev.projects, project],
      catalog:  prev.catalog.map(t => projTracks.includes(t.id)
        ? { ...t, released: true, releaseWeek: prev.totalWeeks }
        : t),
      fans:   clamp(prev.fans  + fanGain,  0, 999_000_000),
      money:  clamp(prev.money + moneyGain, 0, 999_000_000),
      clout:  clamp(prev.clout + cloutGain, 0, 100),
    }));

    addFeed(`💿 "${projTitle}" ${projType.toUpperCase()} released! Avg Quality: ${avgQ}/99. +${fmt(fanGain)} fans.`, 'pos');
    showToast(`${projType.toUpperCase()} RELEASED`);
    setProjTitle('');
    setProjTracks([]);
  };

  // ── Music video ───────────────────────────────────────────────────────────
  const VIDEO_BUDGETS = [
    { id:'lowkey',   label:'Lowkey Video',     cost:500000,   boost:5,  desc:'Phone cam vibes. Still counts.' },
    { id:'standard', label:'Standard Video',   cost:3000000,  boost:12, desc:'Director, decent set, proper edit.' },
    { id:'cinematic',label:'Cinematic Video',  cost:12000000, boost:22, desc:'Full production, stunning visuals.' },
    { id:'epic',     label:'Epic Production',  cost:40000000, boost:35, desc:'Movie-grade. This is an event.', minFans: 100000 },
  ];
  const releaseVideo = () => {
    if (!vidTrack) { showToast('SELECT A TRACK'); return; }
    const track = gs.catalog.find(t => t.id === vidTrack);
    if (!track) return;
    if (!track.released) { showToast('RELEASE THE SONG FIRST'); return; }
    if (track.mvId) { showToast('TRACK ALREADY HAS A VIDEO'); return; }
    if (gs.ap < 2) { showToast('NOT ENOUGH AP'); return; }
    const bud = VIDEO_BUDGETS.find(b => b.id === vidBudget);
    if (gs.money < bud.cost) { showToast(`NEED ${fmtN(bud.cost)}`); return; }
    if (bud.minFans && gs.fans < bud.minFans) { showToast(`NEED ${fmt(bud.minFans)} FANS`); return; }

    patchFn(prev => ({
      ap:     prev.ap - 2,
      money:  clamp(prev.money - bud.cost, 0, 999_000_000),
      clout:  clamp(prev.clout + bud.boost, 0, 100),
      fans:   clamp(prev.fans + Math.round(track.quality * bud.boost * 10), 0, 999_000_000),
      catalog: prev.catalog.map(t => t.id === vidTrack ? { ...t, mvId: uid() } : t),
    }));
    addFeed(`🎬 Music video for "${track.title}" dropped. ${bud.label} — +${bud.boost} clout.`, 'pos');
    showToast('MUSIC VIDEO RELEASED');
    setVidTrack('');
  };

  const toggleFeature = (npcId) => {
    if (features.includes(npcId)) setFeatures(features.filter(id => id !== npcId));
    else if (features.length < 2) setFeatures([...features, npcId]);
    else showToast('MAX 2 FEATURES PER TRACK');
  };

  const toggleProjTrack = (id) => {
    if (projTracks.includes(id)) setProjTracks(projTracks.filter(x => x !== id));
    else setProjTracks([...projTracks, id]);
  };

  const unreleased = gs.catalog.filter(t => !t.released);
  const released   = gs.catalog.filter(t =>  t.released);
  const noVideo    = released.filter(t => !t.mvId);

  return (
    <div className="screen">
      <div className="studio-tabs">
        {STUDIO_TABS.map(t => (
          <button key={t} className={`stab${stab === t ? ' on' : ''}`} onClick={() => setStab(t)}>{t}</button>
        ))}
      </div>

      {/* ── RECORD ── */}
      {stab === 'Record' && (
        <>
          <div className="form-field">
            <label className="form-label">Track Title</label>
            <input className="form-input" placeholder="Enter track name..." value={trackTitle} onChange={e => setTrackTitle(e.target.value)} maxLength={40} />
          </div>

          <div className="form-field">
            <label className="form-label">Genre</label>
            <select className="form-select" value={songGenre} onChange={e => setSongGenre(e.target.value)}>
              {GENRES.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Producer</label>
            {PRODUCERS.map(p => {
              const locked = !unlockProd(p);
              return (
                <div
                  key={p.id}
                  onClick={() => !locked && setProducerId(p.id)}
                  style={{
                    background: producerId === p.id ? 'var(--purple-dim)' : 'var(--bg3)',
                    border: `1px solid ${producerId === p.id ? 'var(--purple-lt)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)', padding: '10px 12px',
                    marginBottom: 6, cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.35 : 1, transition: 'all 0.18s',
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:14, letterSpacing:'0.5px' }}>{p.name}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color: p.cost > 0 ? 'var(--red-lt)' : 'var(--green-lt)', fontWeight:700 }}>
                      {p.cost > 0 ? fmtN(p.cost) : 'FREE'}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted2)', marginTop:3 }}>
                    {p.desc} · +{p.qBonus} quality {locked ? `· 🔒 ${fmt(p.minFans)} fans` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-field">
            <label className="form-label">Feature Artists (max 2)</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {NPC_ARTISTS.map(npc => {
                const on = features.includes(npc.id);
                const rel = gs.npcRelations?.[npc.id];
                const canAfford = gs.money >= npc.collabCost;
                return (
                  <div
                    key={npc.id}
                    onClick={() => toggleFeature(npc.id)}
                    style={{
                      background: on ? 'var(--green-dim)' : 'var(--bg3)',
                      border: `1px solid ${on ? 'var(--green-lt)' : rel === 'rival' ? 'rgba(220,53,69,0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)', padding:'9px 10px',
                      cursor: 'pointer', opacity: !canAfford && !on ? 0.4 : 1,
                    }}
                  >
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{fontSize:16}}>{npc.avatar}</span>
                      <div>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.5px' }}>{npc.name}</div>
                        <div style={{ fontSize:10, color:'var(--muted2)', fontWeight:700 }}>{fmtN(npc.collabCost)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Preview */}
          <div className="quality-meter">
            <div className="qm-row">
              <span style={{ color:'var(--muted2)', fontWeight:700 }}>ESTIMATED QUALITY</span>
              <span style={{ color: QUALITY_COLOR(previewQ), fontFamily:'var(--font-mono)', fontWeight:700 }}>
                {previewQ}/99 — {QUALITY_LABEL(previewQ)}
              </span>
            </div>
            <div className="qm-bar">
              <div className="qm-fill" style={{ width:`${previewQ}%`, background: QUALITY_COLOR(previewQ) }} />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={recordTrack}
            disabled={!trackTitle.trim() || gs.ap < 2 || gs.money < producer.cost || gs.energy < 15}
          >
            RECORD TRACK — 2AP · {fmtN(producer.cost + features.reduce((s,id) => s + (NPC_ARTISTS.find(n=>n.id===id)?.collabCost||0),0))}
          </button>
        </>
      )}

      {/* ── CATALOG ── */}
      {stab === 'Catalog' && (
        <>
          {gs.catalog.length === 0 && <div className="empty-state">No tracks recorded yet.<br/>Head to the Record tab.</div>}

          {unreleased.length > 0 && (
            <>
              <div className="sec-title">Unreleased ({unreleased.length})</div>
              {unreleased.map(t => (
                <div key={t.id} className="track-card">
                  <div className="track-quality" style={{ background: QUALITY_COLOR(t.quality) + '22', border:`1px solid ${QUALITY_COLOR(t.quality)}44` }}>
                    <span style={{ color: QUALITY_COLOR(t.quality), fontFamily:'var(--font-display)', fontSize:17 }}>{t.quality}</span>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{t.title}</div>
                    <div className="track-meta">
                      {GENRES.find(g=>g.id===t.genre)?.label} · {QUALITY_LABEL(t.quality)}
                      {t.features.length > 0 && ` · ft. ${t.features.map(id=>NPC_ARTISTS.find(n=>n.id===id)?.name).filter(Boolean).join(', ')}`}
                    </div>
                  </div>
                  <div className="track-actions">
                    <button className="btn-sm success" onClick={() => releaseSingle(t)}>Drop</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {released.length > 0 && (
            <>
              <div className="sec-title">Released ({released.length})</div>
              {released.map(t => (
                <div key={t.id} className="track-card">
                  <div className="track-quality" style={{ background: QUALITY_COLOR(t.quality) + '22', border:`1px solid ${QUALITY_COLOR(t.quality)}44` }}>
                    <span style={{ color: QUALITY_COLOR(t.quality), fontFamily:'var(--font-display)', fontSize:17 }}>{t.quality}</span>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{t.title}</div>
                    <div className="track-meta">
                      {GENRES.find(g=>g.id===t.genre)?.label}
                      {t.mvId && ' · 🎬'}
                      {t.chartPos && ` · #${t.chartPos} on charts`}
                    </div>
                    <div className="track-streams">{fmt(t.totalStreams || 0)} streams</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── PROJECTS ── */}
      {stab === 'Projects' && (
        <>
          {gs.projects.length > 0 && (
            <>
              <div className="sec-title">Released Projects</div>
              {gs.projects.map(p => (
                <div key={p.id} className="card" style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:'1px' }}>{p.title}</div>
                      <div style={{ fontSize:11, color:'var(--muted2)', fontWeight:700, marginTop:3 }}>
                        {p.type.toUpperCase()} · {p.trackIds.length} tracks · Avg Quality {p.avgQuality}/99
                      </div>
                    </div>
                    <span style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold-lt)', borderRadius:6, padding:'3px 9px', fontSize:9, letterSpacing:2, fontWeight:700 }}>
                      RELEASED
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="sec-title">Create New Project</div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {['ep','album'].map(t => (
              <button key={t} className={`stab${projType === t ? ' on' : ''}`} style={{ flex:1 }} onClick={() => setProjType(t)}>
                {t === 'ep' ? '💿 EP (3+ tracks)' : '🎶 Album (8+ tracks)'}
              </button>
            ))}
          </div>

          <div className="form-field">
            <label className="form-label">Project Title</label>
            <input className="form-input" placeholder="Album / EP name..." value={projTitle} onChange={e => setProjTitle(e.target.value)} maxLength={40} />
          </div>

          <div className="form-field">
            <label className="form-label">Select Tracks ({projTracks.length} selected)</label>
            {unreleased.map(t => (
              <div
                key={t.id}
                onClick={() => toggleProjTrack(t.id)}
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background: projTracks.includes(t.id) ? 'var(--purple-dim)' : 'var(--bg3)',
                  border: `1px solid ${projTracks.includes(t.id) ? 'var(--purple-lt)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', padding:'10px 12px', marginBottom:6, cursor:'pointer',
                }}
              >
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:13 }}>{t.title}</div>
                  <div style={{ fontSize:11, color:'var(--muted2)', fontWeight:700 }}>Quality {t.quality}/99</div>
                </div>
                {projTracks.includes(t.id) && <span style={{ color:'var(--purple-lt)', fontSize:18 }}>✓</span>}
              </div>
            ))}
            {unreleased.length === 0 && <div className="empty-state" style={{ padding:'16px 0' }}>Record more unreleased tracks first.</div>}
          </div>

          <button
            className="btn-primary"
            onClick={releaseProject}
            disabled={!projTitle.trim() || projTracks.length < (projType==='ep'?3:8) || gs.ap < 3}
          >
            RELEASE {projType.toUpperCase()} — 3AP
          </button>
        </>
      )}

      {/* ── VIDEOS ── */}
      {stab === 'Videos' && (
        <>
          <div className="form-field">
            <label className="form-label">Select Track</label>
            <select className="form-select" value={vidTrack} onChange={e => setVidTrack(e.target.value)}>
              <option value="">Choose a released track...</option>
              {noVideo.map(t => <option key={t.id} value={t.id}>{t.title} (Quality {t.quality})</option>)}
            </select>
          </div>
          {released.filter(t => t.mvId).length > 0 && (
            <div style={{ fontSize:11, color:'var(--muted2)', marginBottom:10 }}>
              Already have videos: {released.filter(t=>t.mvId).map(t=>t.title).join(', ')}
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Video Budget</label>
            {[
              { id:'lowkey',    label:'Lowkey Video',    cost:500000,   boost:5,  desc:'Authentic street aesthetic.' },
              { id:'standard',  label:'Standard Video',  cost:3000000,  boost:12, desc:'Director, set, proper edit.' },
              { id:'cinematic', label:'Cinematic Video', cost:12000000, boost:22, desc:'Full production. Events.' },
              { id:'epic',      label:'Epic Production', cost:40000000, boost:35, desc:'Movie-grade. Industry event.', minFans:100000 },
            ].map(b => {
              const locked = b.minFans && gs.fans < b.minFans;
              return (
                <div
                  key={b.id}
                  onClick={() => !locked && setVidBudget(b.id)}
                  style={{
                    background: vidBudget === b.id ? 'var(--gold-dim)' : 'var(--bg3)',
                    border:`1px solid ${vidBudget === b.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius:'var(--r-sm)', padding:'10px 12px', marginBottom:6,
                    cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.35 : 1,
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:13 }}>{b.label}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--red-lt)', fontWeight:700 }}>{fmtN(b.cost)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted2)', marginTop:2 }}>
                    {b.desc} · +{b.boost} clout{locked ? ` · 🔒 ${fmt(b.minFans)} fans` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn-primary"
            onClick={releaseVideo}
            disabled={!vidTrack || gs.ap < 2}
          >
            SHOOT VIDEO — 2AP
          </button>
        </>
      )}
    </div>
  );
}
