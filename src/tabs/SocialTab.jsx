import { useState } from 'react';
import { SOCIAL_PLATFORMS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { clamp, fmt, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

// ── Platform brand configs ──────────────────────────────────────────────────
const PC = {
  soundstream: { color:'#1DB954', bg:'rgba(29,185,84,0.1)',  border:'rgba(29,185,84,0.3)',  metric:'Monthly Listeners' },
  instapic:    { color:'#E1306C', bg:'rgba(225,48,108,0.1)', border:'rgba(225,48,108,0.3)', metric:'Followers' },
  chirp:       { color:'#1DA1F2', bg:'rgba(29,161,242,0.1)', border:'rgba(29,161,242,0.3)', metric:'Followers' },
  vidtube:     { color:'#FF0000', bg:'rgba(255,0,0,0.1)',    border:'rgba(255,0,0,0.3)',    metric:'Subscribers' },
  rhythmtok:   { color:'#69C9D0', bg:'rgba(105,201,208,0.1)',border:'rgba(105,201,208,0.3)',metric:'Followers' },
  soundcloud:  { color:'#FF5500', bg:'rgba(255,85,0,0.1)',   border:'rgba(255,85,0,0.3)',   metric:'Followers' },
};

// ── Platform icons ───────────────────────────────────────────────────────────
const PIcons = {
  soundstream: ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:c}}><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 1 0 10 10" strokeWidth="2" stroke={c} fill="none" strokeLinecap="round"/></svg>,
  instapic:    ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round'}}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={c} stroke="none"/></svg>,
  chirp:       ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:c}}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
  vidtube:     ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:c}}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47a2.78 2.78 0 0 0-1.95 1.95C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.88 23 12 23 12s0-3.88-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff"/></svg>,
  rhythmtok:   ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'none',stroke:c,strokeWidth:2.5,strokeLinecap:'round'}}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>,
  soundcloud:  ({ c }) => <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:c}}><path d="M1 17.5a3.5 3.5 0 0 0 3.5 3.5h13a4 4 0 0 0 .5-7.97A6 6 0 0 0 7 9.5a5.5 5.5 0 0 0-1.5.2A3.5 3.5 0 0 0 1 13v4.5z"/></svg>,
};

// ── NPC chirp feed generator ─────────────────────────────────────────────────
const CHIRP_TEMPLATES = [
  (npc, song) => `${npc.name} @${npc.id}·now\n"${song}" out NOW. Play it loud. 🔥`,
  (npc)       => `${npc.name} @${npc.id}·1h\nIn the studio. No sleep. The next one's different.`,
  (npc, song) => `Hot100Charts @charts·2h\n#1 this week: "${song}" by ${npc.name}. ${npc.fans.toLocaleString()} fans.`,
  (npc)       => `${npc.name} @${npc.id}·3h\nSome of y'all don't know the real me. That's okay.`,
  (npc)       => `IndustryInsider @insider·4h\n${npc.name} just signed a MASSIVE deal. Keeping quiet for now.`,
];

const genChirpFeed = (npcCatalog, npcArtists) => {
  const feed = [];
  for (let i = 0; i < 8; i++) {
    const npc = npcArtists[Math.floor(Math.random() * Math.min(15, npcArtists.length))];
    if (!npc) continue;
    const song = npcCatalog.find(s => s.npcId === npc.id)?.title || 'Untitled';
    const tmpl = CHIRP_TEMPLATES[Math.floor(Math.random() * CHIRP_TEMPLATES.length)];
    feed.push({ npc, text: tmpl(npc, song) });
  }
  return feed;
};

export default function SocialTab({ gs, patch, patchFn, showToast }) {
  const [activePlatform, setActivePlatform] = useState(null);
  const platforms = gs.socialPlatforms || {};
  const totalFollowers = Object.values(platforms).reduce((a, b) => a + (b || 0), 0);

  const post = (platformId, contentType) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;
    const seCost = platform.seCost || 1;
    if ((gs.se || 0) < seCost) { showToast('Need ' + seCost + ' Social Energy'); return; }

    patchFn(prev => {
      const cur = (prev.socialPlatforms || {})[platformId] || 0;
      const cb = 1 + ((prev.charisma || 5) / 50);
      const sm = prev.careerType === 'social_media' ? 3 : 1;
      let gain = 0, cloutG = 0;
      let extra = {};

      if (platformId === 'instapic') {
        gain = rand(300, 1200) * cb * sm;
        cloutG = 1;
      } else if (platformId === 'chirp') {
        if (contentType === 'Start Beef') {
          gain = rand(200, 800) * cb;
          cloutG = 4;
          extra.reputation = clamp((prev.reputation || 50) - rand(4, 10), 0, 100);
        } else {
          gain = rand(150, 600) * cb * sm;
          cloutG = 1;
        }
      } else if (platformId === 'vidtube') {
        gain = rand(800, 3000) * cb;
        cloutG = 2;
      } else if (platformId === 'rhythmtok') {
        const viral = Math.random() < 0.10;
        gain = viral ? rand(8000, 80000) : rand(300, 2000);
        cloutG = viral ? 6 : 1;
        if (viral) setTimeout(() => showToast('VIRAL ON RHYTHMTOK!'), 100);
      } else if (platformId === 'soundcloud') {
        gain = rand(150, 600);
        cloutG = 1;
      }

      return {
        se: clamp((prev.se || 0) - seCost, 0, prev.maxSe || 7),
        clout: clamp((prev.clout || 0) + cloutG, 0, 100),
        socialPlatforms: { ...(prev.socialPlatforms || {}), [platformId]: Math.round(cur + gain) },
        news: addNews(prev.news, 'Posted on ' + platform.name + ' · +' + Math.round(gain).toLocaleString(), 'pos', prev.totalWeeks),
        ...extra,
      };
    });
  };

  // ── Hub view ──────────────────────────────────────────────────────────────
  if (!activePlatform) {
    return (
      <div className="tab-content">
        <div className="sec-head">
          <div className="sec-title">Social Hub</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent-purple)', fontWeight:700 }}>{fmt(totalFollowers)}</div>
        </div>
        <div style={{ height:3, background:'var(--surface-2)', borderRadius:2, marginBottom:16, overflow:'hidden' }}>
          <div style={{ height:'100%', width: Math.min(100, totalFollowers/10000)+'%', background:'linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))', borderRadius:2 }}/>
        </div>

        {/* SE counter */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'var(--surface-1)', borderRadius:'var(--r)', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>Social Energy this week</span>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: gs.maxSe || 7 }).map((_, i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < (gs.se || 0) ? 'var(--accent-cyan)' : 'var(--surface-2)', transition:'background 150ms' }}/>
            ))}
          </div>
        </div>

        {/* Platform rows */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {SOCIAL_PLATFORMS.map((p, idx) => {
            const c = PC[p.id] || {};
            const count = platforms[p.id] || 0;
            const PIcon = PIcons[p.id] || (() => null);
            return (
              <div
                key={p.id}
                onClick={() => !p.auto && setActivePlatform(p.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                  borderBottom: idx < SOCIAL_PLATFORMS.length-1 ? '1px solid var(--border)' : 'none',
                  cursor: p.auto ? 'default' : 'pointer',
                  transition:'background 150ms',
                }}
              >
                <div style={{ width:40, height:40, borderRadius:10, background: c.bg, border:'1px solid '+c.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <PIcon c={c.color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.metric}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color: c.color }}>{fmt(count)}</div>
                  {p.auto && <div style={{ fontSize:9, color:'var(--accent-green)', textTransform:'uppercase', letterSpacing:1 }}>AUTO</div>}
                </div>
                {!p.auto && (
                  <svg viewBox="0 0 24 24" style={{width:14,height:14,fill:'none',stroke:'var(--text-muted)',strokeWidth:2,flexShrink:0}}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Per-platform views ────────────────────────────────────────────────────
  const BackBtn = () => (
    <button onClick={() => setActivePlatform(null)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'0 0 12px', fontSize:13 }}>
      <svg viewBox="0 0 24 24" style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:2}}><polyline points="15 18 9 12 15 6"/></svg>
      Back
    </button>
  );

  const c = PC[activePlatform] || {};
  const followers = platforms[activePlatform] || 0;
  const platform = SOCIAL_PLATFORMS.find(p => p.id === activePlatform);
  const seLeft = gs.se || 0;

  // ── INSTAPIC ──────────────────────────────────────────────────────────────
  if (activePlatform === 'instapic') {
    const npcPosts = (gs.npcCatalog || []).slice(-6).map(song => {
      const npc = NPC_ARTISTS.find(n => n.id === song.npcId);
      return npc ? { npc, song } : null;
    }).filter(Boolean);

    return (
      <div className="tab-content">
        <BackBtn />
        {/* Profile header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid '+c.color, overflow:'hidden', background:'var(--surface-2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {gs.avatarUrl
              ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--text-muted)' }}>{(gs.stageName||'?')[0]}</span>
            }
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:14 }}>{gs.stageName?.toLowerCase()}</div>
            <div style={{ display:'flex', gap:16, marginTop:6, fontSize:12 }}>
              <span><strong style={{color:'var(--text-primary)'}}>{(gs.catalog||[]).filter(t=>t.released).length}</strong> <span style={{color:'var(--text-muted)'}}>posts</span></span>
              <span><strong style={{color:'var(--text-primary)'}}>{fmt(followers)}</strong> <span style={{color:'var(--text-muted)'}}>followers</span></span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:16 }}>
          {['Photo Drop','Story Push','Reel Clip'].map(ct => (
            <button key={ct} onClick={() => post('instapic', ct)} disabled={seLeft < 1} style={{ padding:'8px 4px', borderRadius:8, background: seLeft >= 1 ? c.bg : 'var(--surface-1)', border:'1px solid '+(seLeft >= 1 ? c.border : 'var(--border)'), color: seLeft >= 1 ? c.color : 'var(--text-muted)', fontSize:10, fontWeight:700, cursor: seLeft >= 1 ? 'pointer' : 'default' }}>
              {ct}<br/><span style={{fontWeight:400,fontSize:9}}>1 SE</span>
            </button>
          ))}
        </div>

        {/* Post grid */}
        {(gs.catalog||[]).filter(t=>t.released).length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2, marginBottom:16 }}>
            {(gs.catalog||[]).filter(t=>t.released).map(track => (
              <div key={track.id} style={{ aspectRatio:'1', background: track.coverArt ? 'transparent' : 'var(--surface-2)', borderRadius:4, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {track.coverArt
                  ? <img src={track.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <span style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>Q{track.quality}</span>
                }
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
            No releases yet. Drop a track to populate your grid.
          </div>
        )}

        {/* NPC feed */}
        {npcPosts.length > 0 && (
          <>
            <div className="sec-head" style={{marginTop:8}}><div className="sec-title">Feed</div></div>
            {npcPosts.map(({ npc, song }, i) => (
              <div key={i} className="card" style={{ marginBottom:8, padding:'10px 12px' }}>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:npc.color+'30', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontWeight:900, fontSize:10, color:npc.color, flexShrink:0 }}>{npc.initials}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:12 }}>{npc.name}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>Suggested for you</div>
                  </div>
                </div>
                <div style={{ height:80, background:'var(--surface-2)', borderRadius:8, marginBottom:8 }}/>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}><strong style={{color:'var(--text-primary)'}}>{npc.name.toLowerCase().replace(/ /g,'')}</strong> {song.title} out now 🎵</div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ── CHIRP ─────────────────────────────────────────────────────────────────
  if (activePlatform === 'chirp') {
    const feed = genChirpFeed(gs.npcCatalog || [], NPC_ARTISTS);
    return (
      <div className="tab-content">
        <BackBtn />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:c.color }}>Chirp</div>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(followers)} followers</span>
        </div>

        {/* Post actions */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[['Drop Heat',1],['Start Beef',1],['React to News',1]].map(([ct, se]) => (
            <button key={ct} onClick={() => post('chirp', ct)} disabled={seLeft < se} style={{ flex:1, padding:'8px 4px', borderRadius:8, background: seLeft >= se ? c.bg : 'var(--surface-1)', border:'1px solid '+(seLeft >= se ? c.border : 'var(--border)'), color: seLeft >= se ? c.color : 'var(--text-muted)', fontSize:10, fontWeight:700, cursor: seLeft >= se ? 'pointer' : 'default' }}>
              {ct}<br/><span style={{fontWeight:400,fontSize:9}}>{se} SE</span>
            </button>
          ))}
        </div>

        {/* Tweet-style feed */}
        {feed.map(({ npc, text }, i) => (
          <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:npc.color+'30', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontWeight:900, fontSize:10, color:npc.color, flexShrink:0 }}>{npc.initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              {text.split('\n').map((line, li) => (
                <div key={li} style={{ fontSize: li === 0 ? 12 : 13, color: li === 0 ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom:2 }}>{line}</div>
              ))}
              <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:'var(--text-muted)' }}>
                <span>♡ {rand(10,5000).toLocaleString()}</span>
                <span>↺ {rand(5,1000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── VIDTUBE ───────────────────────────────────────────────────────────────
  if (activePlatform === 'vidtube') {
    const releasedTracks = (gs.catalog||[]).filter(t=>t.released);
    return (
      <div className="tab-content">
        <BackBtn />
        <div style={{ background:'var(--surface-1)', borderRadius:'var(--r)', padding:'16px', marginBottom:16, textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid '+c.color, overflow:'hidden', background:'var(--surface-2)', margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {gs.avatarUrl ? <img src={gs.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--text-muted)'}}>{(gs.stageName||'?')[0]}</span>}
          </div>
          <div style={{ fontWeight:900, fontSize:15 }}>{gs.stageName?.toUpperCase()}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>@{gs.stageName?.toLowerCase().replace(/ /g,'')} · {fmt(followers)} subscribers · {releasedTracks.length} videos</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Official Channel. Subscribe for new music.</div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['Post Music Video','BTS Vlog','Live Session'].map(ct => (
            <button key={ct} onClick={() => post('vidtube', ct)} disabled={seLeft < 2} style={{ flex:1, padding:'8px 4px', borderRadius:8, background: seLeft >= 2 ? c.bg : 'var(--surface-1)', border:'1px solid '+(seLeft >= 2 ? c.border : 'var(--border)'), color: seLeft >= 2 ? c.color : 'var(--text-muted)', fontSize:9, fontWeight:700, cursor: seLeft >= 2 ? 'pointer' : 'default' }}>
              {ct}<br/><span style={{fontWeight:400}}>2 SE</span>
            </button>
          ))}
        </div>

        {releasedTracks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:13, marginBottom:8 }}>No videos yet</div>
            <div style={{ fontSize:11 }}>Release music and post music videos to populate your channel</div>
          </div>
        ) : (
          releasedTracks.map(track => (
            <div key={track.id} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <div style={{ width:80, height:50, background:'var(--surface-2)', borderRadius:6, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {track.coverArt ? <img src={track.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:10,color:'var(--text-muted)'}}>▶</span>}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:12 }}>{track.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Q{track.quality} · Week {track.releaseWeek}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── RHYTHMTOK ─────────────────────────────────────────────────────────────
  if (activePlatform === 'rhythmtok') {
    return (
      <div className="tab-content">
        <BackBtn />
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid '+c.color, overflow:'hidden', background:'var(--surface-2)', margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {gs.avatarUrl ? <img src={gs.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--text-muted)'}}>{(gs.stageName||'?')[0]}</span>}
          </div>
          <div style={{ fontWeight:900, fontSize:15 }}>{gs.stageName?.toUpperCase()}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:10, fontSize:12 }}>
            <div style={{textAlign:'center'}}><div style={{fontWeight:700}}>{fmt(followers)}</div><div style={{color:'var(--text-muted)',fontSize:10}}>Followers</div></div>
            <div style={{textAlign:'center'}}><div style={{fontWeight:700}}>0</div><div style={{color:'var(--text-muted)',fontSize:10}}>Likes</div></div>
          </div>
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[['Jump on Trend',1],['Original Sound',1],['Artist Challenge',1]].map(([ct, se]) => (
            <button key={ct} onClick={() => post('rhythmtok', ct)} disabled={seLeft < se} style={{ flex:1, padding:'8px 4px', borderRadius:8, background: seLeft >= se ? c.bg : 'var(--surface-1)', border:'1px solid '+(seLeft >= se ? c.border : 'var(--border)'), color: seLeft >= se ? c.color : 'var(--text-muted)', fontSize:9, fontWeight:700, cursor: seLeft >= se ? 'pointer' : 'default' }}>
              {ct}<br/><span style={{fontWeight:400}}>{se} SE · viral chance</span>
            </button>
          ))}
        </div>

        {followers === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Your FYP is empty</div>
            <div style={{ fontSize:11 }}>Post your first clip to start getting views, followers and going viral. Each post has a 10% chance of going viral.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
            {Array.from({ length: Math.min(9, Math.ceil(followers/100)) }).map((_, i) => (
              <div key={i} style={{ aspectRatio:'9/16', background:'var(--surface-2)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:20 }}>▶</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SOUNDCLOUD ────────────────────────────────────────────────────────────
  const releasedTracks = (gs.catalog||[]).filter(t=>t.released);
  return (
    <div className="tab-content">
      <BackBtn />
      <div style={{ background: c.bg, border:'1px solid '+c.border, borderRadius:'var(--r)', padding:'16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:c.color+'30', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:20, color:c.color, flexShrink:0 }}>{(gs.stageName||'?')[0]}</div>
          <div>
            <div style={{ fontWeight:900, fontSize:15 }}>{gs.stageName?.toUpperCase()}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{gs.genre} · {gs.city}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center', fontSize:12 }}>
          <div><div style={{fontWeight:700,color:c.color}}>{fmt(followers)}</div><div style={{color:'var(--text-muted)',fontSize:10}}>FOLLOWERS</div></div>
          <div><div style={{fontWeight:700,color:c.color}}>{fmt(gs.totalLifetimeStreams||0)}</div><div style={{color:'var(--text-muted)',fontSize:10}}>PLAYS</div></div>
          <div><div style={{fontWeight:700,color:c.color}}>{releasedTracks.length}</div><div style={{color:'var(--text-muted)',fontSize:10}}>TRACKS</div></div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['Drop Freestyle','Exclusive Preview'].map(ct => (
          <button key={ct} onClick={() => post('soundcloud', ct)} disabled={seLeft < 1} style={{ flex:1, padding:'8px 6px', borderRadius:8, background: seLeft >= 1 ? c.bg : 'var(--surface-1)', border:'1px solid '+(seLeft >= 1 ? c.border : 'var(--border)'), color: seLeft >= 1 ? c.color : 'var(--text-muted)', fontSize:11, fontWeight:700, cursor: seLeft >= 1 ? 'pointer' : 'default' }}>
            {ct} · 1 SE
          </button>
        ))}
      </div>

      {releasedTracks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:24, marginBottom:8, color:c.color }}>☁</div>
          <div style={{ fontSize:13 }}>No tracks yet — release music to see it here.</div>
        </div>
      ) : (
        <div className="card">
          {releasedTracks.map(track => (
            <div key={track.id} className="track-row">
              <div style={{ width:36, height:36, borderRadius:4, background:c.color+'25', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>🎵</div>
              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-meta">Q{track.quality} · Week {track.releaseWeek}</div>
              </div>
              <div style={{ textAlign:'right', fontSize:11, color: c.color, fontFamily:'var(--font-mono)' }}>
                {fmt(Math.round((track.quality/100)*followers*0.1))}<br/>
                <span style={{ color:'var(--text-muted)', fontSize:9 }}>plays</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
