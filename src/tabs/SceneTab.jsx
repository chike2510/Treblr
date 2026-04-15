import { useState } from 'react';
import { NPC_ARTISTS, GENRES } from '../data';
import { clamp, fmt, fmtN, generateCharts } from '../utils';

const SCENE_TABS = ['Charts', 'Artists', 'Social'];

export default function SceneTab({ gs, patch, patchFn, addFeed, showToast }) {
  const [stab, setStab] = useState('Charts');

  // Generate/use cached charts
  const charts = gs.charts?.length > 0 ? gs.charts : generateCharts(gs, NPC_ARTISTS);

  // ── COLLAB ────────────────────────────────────────────────────────────────
  const doCollab = (npc) => {
    if (gs.ap < 2) { showToast('NOT ENOUGH AP'); return; }
    if (gs.clout < 8) { showToast('NEED CLOUT 8+ TO APPROACH'); return; }
    if (gs.money < npc.collabCost) { showToast(`NEED ${fmtN(npc.collabCost)}`); return; }
    const rel = gs.npcRelations?.[npc.id];
    if (rel === 'rival') { showToast(`${npc.name.toUpperCase()} WON'T WORK WITH RIVALS`); return; }

    // Chance of acceptance based on clout diff and attitude
    const cloutRatio = gs.clout / (npc.clout || 1);
    const attMult = { friendly: 1.2, neutral: 1.0, selective: 0.7, hostile: 0.3 }[npc.attitude] || 1;
    const careerMult = gs.careerType === 'fallen_star' ? 1.2 : 1;
    const chance = Math.min(0.9, cloutRatio * attMult * careerMult * 0.8 + 0.1);

    if (Math.random() > chance) {
      addFeed(`❌ ${npc.name} passed on the collab request.`, 'neg');
      showToast(`${npc.name.toUpperCase()} PASSED`);
      patchFn(prev => ({ ap: prev.ap - 1 })); // costs 1 AP even if rejected
      return;
    }

    const fanGain = Math.round(npc.fans * 0.004);
    patchFn(prev => ({
      ap:     prev.ap - 2,
      money:  clamp(prev.money - npc.collabCost, 0, 999_000_000),
      fans:   clamp(prev.fans + fanGain, 0, 999_000_000),
      clout:  clamp(prev.clout + 4, 0, 100),
      npcRelations: { ...(prev.npcRelations || {}), [npc.id]: 'ally' },
      npcCollabWeek: { ...(prev.npcCollabWeek || {}), [npc.id]: prev.totalWeeks },
    }));
    addFeed(`🤝 Collab with ${npc.name} agreed! Cost ${fmtN(npc.collabCost)}. +${fmt(fanGain)} fans.`, 'pos');
    showToast(`COLLAB: ${npc.name.toUpperCase()}`);
  };

  // ── BEEF ─────────────────────────────────────────────────────────────────
  const doBeef = (npc) => {
    const cloutGain = Math.floor(Math.random() * 6) + 1;
    const fansLeak  = Math.floor(Math.random() * 300) + 100;
    patchFn(prev => ({
      clout:        clamp(prev.clout + cloutGain, 0, 100),
      fans:         clamp(prev.fans + fansLeak, 0, 999_000_000),
      reputation:   clamp((prev.reputation || 50) - 4, 0, 100),
      npcRelations: { ...(prev.npcRelations || {}), [npc.id]: 'rival' },
    }));
    addFeed(`😤 Publicly beefed with ${npc.name}. +${cloutGain} clout. Twitter is on fire.`, 'neg');
  };

  // ── SOCIAL MEDIA POST ─────────────────────────────────────────────────────
  const POST_TYPES = [
    { id:'regular',  label:'Regular Post',     emoji:'📸', cost:1, followerGain:800,   cloutGain:1,  desc:'Daily content. Keeps you relevant.' },
    { id:'behind',   label:'Behind The Scenes',emoji:'🎬', cost:1, followerGain:1500,  cloutGain:2,  desc:'Studio access content.', minFans:500 },
    { id:'freestyle',label:'Viral Freestyle',  emoji:'🎤', cost:2, followerGain:5000,  cloutGain:4,  desc:'Go off on camera. High risk, high reward.' },
    { id:'trend',    label:'Trend Hop',        emoji:'💃', cost:1, followerGain:3000,  cloutGain:2,  desc:'Ride the algorithm wave.' },
    { id:'live',     label:'Live Session',     emoji:'📡', cost:2, followerGain:4000,  cloutGain:3,  desc:'Real-time connection with fans.', minFans:2000 },
    { id:'announce', label:'Announcement',     emoji:'📢', cost:1, followerGain:2000,  cloutGain:2,  desc:'Drop news. Build anticipation.', minFans:1000 },
  ];

  const doPost = (pt) => {
    if (gs.ap < pt.cost) { showToast('NOT ENOUGH AP'); return; }
    const mult = gs.careerType === 'social_media' ? 3 : 1;
    const fGain = Math.round(pt.followerGain * mult * (1 + gs.charisma / 25));
    const cGain = pt.cloutGain;
    patchFn(prev => ({
      ap:              prev.ap - pt.cost,
      socialFollowers: clamp(prev.socialFollowers + fGain, 0, 999_000_000),
      fans:            clamp(prev.fans + Math.round(fGain * 0.05), 0, 999_000_000),
      clout:           clamp(prev.clout + cGain, 0, 100),
      socialPosts:     (prev.socialPosts || 0) + 1,
    }));
    addFeed(`📱 ${pt.label} — +${fmt(fGain)} followers.`);
    showToast(`POSTED`);
  };

  const genreObj = GENRES.find(g => g.id === gs.genre);

  return (
    <div className="screen">
      <div className="studio-tabs">
        {SCENE_TABS.map(t => (
          <button key={t} className={`stab${stab === t ? ' on' : ''}`} onClick={() => setStab(t)}>{t}</button>
        ))}
      </div>

      {/* ── CHARTS ── */}
      {stab === 'Charts' && (
        <>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:14 }}>
            <div style={{ fontSize:9, letterSpacing:3, textTransform:'uppercase', color:'var(--muted2)', fontWeight:700, marginBottom:4 }}>YOUR RANK</div>
            {gs.catalog.some(t => t.released) ? (
              (() => {
                const bestPos = charts.filter(c => c.isPlayer).sort((a,b) => a.position - b.position)[0];
                return bestPos
                  ? <div style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--gold-lt)' }}>#{bestPos.position} <span style={{ fontSize:14, color:'var(--muted2)' }}>{bestPos.title}</span></div>
                  : <div style={{ fontSize:13, color:'var(--muted2)' }}>No released tracks charting yet.</div>;
              })()
            ) : (
              <div style={{ fontSize:13, color:'var(--muted2)' }}>Release music to appear on charts.</div>
            )}
          </div>

          <div className="sec-title">Top 40</div>
          {charts.slice(0, 40).map((entry, i) => (
            <div key={i} className="chart-row">
              <div className={`chart-pos${i === 0 ? ' top1' : i < 3 ? ' top3' : ''}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="chart-title">{entry.title}</div>
                <div className="chart-artist">{entry.artist}</div>
              </div>
              {entry.isPlayer && <div className="chart-player-badge">YOU</div>}
            </div>
          ))}
        </>
      )}

      {/* ── ARTISTS ── */}
      {stab === 'Artists' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--muted2)', fontWeight:600 }}>Clout: {gs.clout}/100</span>
            <span style={{ fontSize:12, color:'var(--muted2)', fontWeight:600 }}>·</span>
            <span style={{ fontSize:12, color:'var(--muted2)', fontWeight:600 }}>Allies: {Object.values(gs.npcRelations||{}).filter(r=>r==='ally').length}</span>
            <span style={{ fontSize:12, color:'var(--muted2)', fontWeight:600 }}>·</span>
            <span style={{ fontSize:12, color:'var(--red-lt)', fontWeight:600 }}>Rivals: {Object.values(gs.npcRelations||{}).filter(r=>r==='rival').length}</span>
          </div>

          {NPC_ARTISTS.map(npc => {
            const rel     = gs.npcRelations?.[npc.id];
            const gObj    = GENRES.find(g => g.id === npc.genre);
            const canAffd = gs.money >= npc.collabCost;
            const sameG   = npc.genre === gs.genre;
            const attEmoji = { friendly:'😊', neutral:'😐', selective:'🤨', hostile:'😠' }[npc.attitude] || '😐';

            return (
              <div key={npc.id} className="npc-card" style={sameG ? { borderColor: gObj?.color + '44' } : {}}>
                <div className="npc-avatar" style={sameG ? { borderColor: gObj?.color + '66' } : {}}>{npc.avatar}</div>
                <div className="npc-info">
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span className="npc-name">{npc.name}</span>
                    {rel === 'ally'  && <span className="relation-tag ally">ALLY</span>}
                    {rel === 'rival' && <span className="relation-tag rival">RIVAL</span>}
                  </div>
                  <div className="npc-meta">{gObj?.label} · {npc.city} · {fmt(npc.fans)} fans</div>
                  <div className="npc-badges">
                    <span className="npc-badge">Clout {npc.clout}</span>
                    <span className="npc-badge">Talent {npc.talent}</span>
                    <span className="npc-badge">{attEmoji} {npc.attitude}</span>
                  </div>
                  <div className="npc-cost">Collab fee: {fmtN(npc.collabCost)}</div>
                  <div className="npc-actions">
                    <button
                      className={`btn-sm success${!canAffd || rel === 'rival' ? ' disabled' : ''}`}
                      onClick={() => doCollab(npc)}
                    >
                      🤝 Collab (2AP)
                    </button>
                    <button className="btn-sm danger" onClick={() => doBeef(npc)}>
                      😤 Beef
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── SOCIAL MEDIA ── */}
      {stab === 'Social' && (
        <>
          <div className="info-card" style={{ marginBottom:16 }}>
            <div className="info-row">
              <span className="info-row-label">Followers</span>
              <span className="info-row-val" style={{ color:'var(--blue)' }}>{fmt(gs.socialFollowers)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Total Posts</span>
              <span className="info-row-val">{gs.socialPosts || 0}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Engagement Power</span>
              <span className="info-row-val" style={{ color:'var(--gold-lt)' }}>
                {gs.careerType === 'social_media' ? '3×' : '1×'}
              </span>
            </div>
          </div>

          <div className="sec-title">Post Content</div>
          <div className="actions-grid">
            {POST_TYPES.map(pt => {
              const dis = gs.ap < pt.cost || (pt.minFans && gs.fans < pt.minFans);
              const mult = gs.careerType === 'social_media' ? 3 : 1;
              return (
                <div key={pt.id} className={`ac${dis ? ' ac-dis' : ''}`} onClick={() => !dis && doPost(pt)}>
                  <div className="ac-cost">{pt.cost}AP</div>
                  <div className="ac-emoji">{pt.emoji}</div>
                  <div className="ac-name">{pt.label}</div>
                  <div className="ac-desc">{pt.desc}</div>
                  <div className="ac-fx pos">+{fmt(Math.round(pt.followerGain * mult))} followers</div>
                  {pt.minFans && gs.fans < pt.minFans && (
                    <div className="ac-fx neg">🔒 {fmt(pt.minFans)} fans</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
