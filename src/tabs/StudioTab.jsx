import { useState } from 'react';
import { PRODUCERS, GENRES } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { calcSongQuality } from '../engine/qualityCalc';
import { clamp, fmt, fmtN, uid } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

const RELEASE_COOLDOWN = { single: 2, ep: 6, album: 12 };

export default function StudioTab({ gs, patch, patchFn, showToast }) {
  const [view, setView]               = useState('catalog');   // catalog | record | project
  const [title, setTitle]             = useState('');
  const [producerId, setProducerId]   = useState('bedroom');
  const [featNpcs, setFeatNpcs]       = useState([]);
  const [projType, setProjType]       = useState('ep');
  const [projTitle, setProjTitle]     = useState('');

  const released   = (gs.catalog || []).filter(t => t.released);
  const unreleased = (gs.catalog || []).filter(t => !t.released);
  const genreData  = GENRES.find(g => g.id === gs.genre);

  const producer = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const previewQ = calcSongQuality(gs, producerId, featNpcs);

  const weeksUntilRelease = Math.max(0, (gs.lastReleaseWeek || -99) + RELEASE_COOLDOWN.single - gs.totalWeeks);

  // ── Record ─────────────────────────────────────────────────────────────────
  const doRecord = () => {
    if (!title.trim()) { showToast('Name your track'); return; }
    if (gs.money < producer.cost) { showToast('Not enough money'); return; }
    if (gs.energy < 25) { showToast('Too exhausted to record'); return; }
    if (producer.minFans > gs.fans) { showToast(`Need ${fmt(producer.minFans)} fans for this producer`); return; }

    patchFn(prev => {
      const quality = calcSongQuality(prev, producerId, featNpcs);
      const track = {
        id: uid(),
        title: title.trim(),
        genre: prev.genre,
        quality,
        producerId,
        featNpcs: [...featNpcs],
        released: false,
        releaseWeek: null,
        chartPos: null,
        recordWeek: prev.totalWeeks,
      };
      return {
        catalog: [...(prev.catalog || []), track],
        money: clamp(prev.money - producer.cost, 0, 999_000_000_000),
        energy: clamp(prev.energy - 25, 0, 100),
        news: addNews(prev.news, `Recorded "${title.trim()}" · Quality ${quality}/100`, 'pos', prev.totalWeeks),
      };
    });

    setTitle(''); setFeatNpcs([]);
    showToast(`Recorded "${title}" · Q${previewQ}`);
    setView('catalog');
  };

  // ── Release single ─────────────────────────────────────────────────────────
  const doRelease = (trackId) => {
    if (weeksUntilRelease > 0) { showToast(`Release cooldown: ${weeksUntilRelease}w left`); return; }
    patchFn(prev => {
      const fansGain = Math.round(Math.sqrt(prev.fans || 1) * 0.5 + 50);
      const cloutGain = 1;
      return {
        catalog: prev.catalog.map(t => t.id === trackId ? { ...t, released: true, releaseWeek: prev.totalWeeks } : t),
        lastReleaseWeek: prev.totalWeeks,
        fans: clamp(prev.fans + fansGain, 0, 999_000_000),
        clout: clamp(prev.clout + cloutGain, 0, 100),
        news: addNews(prev.news, `Dropped "${prev.catalog.find(t=>t.id===trackId)?.title}" — the charts await.`, 'pos', prev.totalWeeks),
      };
    });
    showToast('Single released!');
  };

  // ── Toggle featured NPC ────────────────────────────────────────────────────
  const toggleFeat = (npcId) => {
    setFeatNpcs(prev => prev.includes(npcId) ? prev.filter(id => id !== npcId) : [...prev, npcId]);
  };

  const qColor = (q) => q >= 80 ? 'var(--accent-green)' : q >= 60 ? 'var(--accent-gold-lt)' : q >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)';

  const affordableProducers = PRODUCERS.filter(p => p.minFans <= gs.fans);

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        {['catalog','record','project'].map(v => (
          <div key={v} className={`sub-tab${view===v?' on':''}`} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </div>
        ))}
      </div>

      {/* ── CATALOG ────────────────────────────────────────────────────── */}
      {view === 'catalog' && (
        <>
          <div className="sec-head">
            <div className="sec-title">Catalog</div>
            <div className="sec-sub">{released.length} released · {unreleased.length} in vault</div>
          </div>

          {(gs.catalog || []).length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" style={{ width:40, height:40, stroke:'var(--text-muted)', fill:'none', strokeWidth:1.5, strokeLinecap:'round' }}>
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div className="empty-state-text">No tracks yet. Hit the studio.</div>
              </div>
            </div>
          ) : (
            <div className="card">
              {(gs.catalog || []).map(track => (
                <div key={track.id} className="track-row">
                  <div className="track-q-badge" style={{ color: qColor(track.quality) }}>
                    Q{track.quality}
                  </div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-meta">
                      {genreData?.label}
                      {track.featNpcs?.length > 0 && ` ft. ${track.featNpcs.map(id => NPC_ARTISTS.find(n=>n.id===id)?.name || id).join(', ')}`}
                      {track.released && track.chartPos ? ` · #${track.chartPos}` : track.released ? ' · On Charts' : ' · Unreleased'}
                    </div>
                  </div>
                  {!track.released && (
                    <button
                      className="btn btn-purple btn-sm"
                      disabled={weeksUntilRelease > 0}
                      onClick={() => doRelease(track.id)}
                    >
                      {weeksUntilRelease > 0 ? `${weeksUntilRelease}w` : 'DROP'}
                    </button>
                  )}
                  {track.released && (
                    <div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--accent-green)', textAlign:'right' }}>LIVE</div>
                      {track.chartPos && <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--accent-gold-lt)', textAlign:'right' }}>#{track.chartPos}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {weeksUntilRelease > 0 && (
            <div style={{ fontSize:11, color:'var(--accent-red)', textAlign:'center', marginTop:8 }}>
              Release cooldown: {weeksUntilRelease} week{weeksUntilRelease !== 1 ? 's' : ''} remaining
            </div>
          )}
        </>
      )}

      {/* ── RECORD ─────────────────────────────────────────────────────── */}
      {view === 'record' && (
        <>
          <div className="sec-head">
            <div className="sec-title">New Track</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color: qColor(previewQ) }}>Q{previewQ}</div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <label className="form-label">Track Title</label>
            <input
              className="ob-input"
              placeholder="e.g. No Mercy, Levels, Timeless..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={40}
              style={{ marginBottom:16 }}
            />

            <label className="form-label">Producer</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {affordableProducers.map(p => (
                <div
                  key={p.id}
                  className={`sel${producerId === p.id ? ' on' : ''}`}
                  style={{ textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                  onClick={() => setProducerId(p.id)}
                >
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.desc} · +{p.qBonus} quality</div>
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-gold-lt)' }}>{p.cost > 0 ? fmtN(p.cost) : 'FREE'}</div>
                </div>
              ))}
            </div>

            <label className="form-label">Features (optional)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {NPC_ARTISTS.filter(n => n.fans > 500000).slice(0, 12).map(npc => {
                const on = featNpcs.includes(npc.id);
                return (
                  <button
                    key={npc.id}
                    className={`tag ${on ? 'tag-gold' : ''}`}
                    style={{ border:`1px solid ${on ? 'var(--accent-gold)' : 'var(--border)'}`, background: on ? 'rgba(200,146,42,0.15)' : 'var(--surface-1)', cursor:'pointer' }}
                    onClick={() => toggleFeat(npc.id)}
                  >
                    {npc.name}
                  </button>
                );
              })}
            </div>

            <div style={{ background:'var(--surface-1)', borderRadius:'var(--r)', padding:'10px 12px', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'var(--text-muted)' }}>Producer cost</span>
                <span style={{ color: gs.money >= producer.cost ? 'var(--text-primary)' : 'var(--accent-red)' }}>{fmtN(producer.cost)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:4 }}>
                <span style={{ color:'var(--text-muted)' }}>Energy cost</span>
                <span style={{ color: gs.energy >= 25 ? 'var(--text-primary)' : 'var(--accent-red)' }}>-25</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, marginTop:8, borderTop:'1px solid var(--border)', paddingTop:8 }}>
                <span>Estimated Quality</span>
                <span style={{ color: qColor(previewQ) }}>Q{previewQ}/99</span>
              </div>
            </div>

            <button
              className="btn btn-purple btn-full"
              disabled={!title.trim() || gs.money < producer.cost || gs.energy < 25}
              onClick={doRecord}
            >
              RECORD TRACK
            </button>
          </div>
        </>
      )}

      {/* ── PROJECT ────────────────────────────────────────────────────── */}
      {view === 'project' && (
        <>
          <div className="sec-head">
            <div className="sec-title">EP / Album</div>
            <div className="sec-sub">{(gs.projects || []).length} released</div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['ep','album'].map(type => (
                <div key={type} className={`sel${projType===type?' on':''}`} style={{ flex:1, textAlign:'center' }} onClick={() => setProjType(type)}>
                  <div className="sel-label">{type.toUpperCase()}</div>
                  <div className="sel-sub">{type === 'ep' ? '4-6 tracks · 6w cooldown' : '8-12 tracks · 12w cooldown'}</div>
                </div>
              ))}
            </div>

            <label className="form-label">Project Title</label>
            <input
              className="ob-input"
              placeholder="e.g. Before The Dawn..."
              value={projTitle}
              onChange={e => setProjTitle(e.target.value)}
              maxLength={40}
              style={{ marginBottom:12 }}
            />

            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>
              Select tracks to include from your catalog:
            </div>

            {(gs.catalog || []).filter(t => !t.inProject).map(track => (
              <div key={track.id} className="track-row">
                <div className="track-q-badge" style={{ color: qColor(track.quality) }}>Q{track.quality}</div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-meta">{track.released ? 'Already released' : 'Unreleased'}</div>
                </div>
              </div>
            ))}

            {(gs.catalog || []).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-text">Record tracks first before creating a project.</div>
              </div>
            )}
          </div>

          {(gs.projects || []).length > 0 && (
            <>
              <div className="sec-head" style={{ marginTop:8 }}><div className="sec-title">Discography</div></div>
              {(gs.projects || []).map(proj => (
                <div key={proj.id} className="card" style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:18 }}>{proj.title}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{proj.type.toUpperCase()} · Week {proj.releaseWeek}</div>
                    </div>
                    <span className="tag tag-green">OUT</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
