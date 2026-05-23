import { useState } from 'react';
import { ERAS } from '../data/constants';
import { fmt, fmtN, getTier, getEra } from '../engine/utils';
import { NPC_ARTISTS } from '../data/artists';

const ERA_ORDER = [...ERAS];

// Safe news bolding — no dangerouslySetInnerHTML
const BoldedNews = ({ text }) => {
  const parts = text.split(/("(?:[^"]+)")/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"')
          ? <strong key={i} style={{ color:'var(--text-primary)' }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const NPC_AVATARS = {
  taylor:'av_01_01.png', drake:'av_01_02.png', kendrick:'av_01_03.png',
  billie:'av_01_04.png', weeknd:'av_01_05.png', burna:'av_01_06.png',
  tyla:'av_01_07.png',   sza:'av_01_08.png',   wizkid:'av_02_05.png',
};

const NpcAvatar = ({ npc, size=32 }) => {
  const [err, setErr] = useState(false);
  const file = NPC_AVATARS[npc?.id];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:(npc?.color||'#444')+'30' }}>
      {file&&!err
        ? <img src={`/assets/avatars/${file}`} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:size*0.38,color:npc?.color||'#aaa'}}>{(npc?.name||'?')[0]}</div>
      }
    </div>
  );
};

const COVER_POOL = Array.from({length:27},(_,i)=>{
  const row=Math.floor(i/9)+1, col=(i%9)+1;
  return `cov_0${row}_0${String(col).padStart(2,'0')}.png`;
});

export default function HomeTab({ gs, patch, patchFn, showToast, endWeek, isEndingWeek }) {
  const era     = getEra(gs.fans);
  const eraIdx  = ERA_ORDER.findIndex(e => e.label===era.label);
  const nextEra = ERA_ORDER[eraIdx+1];
  const progress = nextEra ? Math.min(100, Math.round(((gs.fans-era.minFans)/(nextEra.minFans-era.minFans))*100)) : 100;

  const topChartEntry = (gs.charts?.streams||[]).find(e=>e.isPlayer);
  const releasedTracks = (gs.catalog||[]).filter(t=>t.released);
  const latestTrack = releasedTracks[releasedTracks.length-1];
  const newsItems = (gs.news||[]).slice(0,8);
  const topNpcs = NPC_ARTISTS.filter(n=>n.tier==='S'||n.tier==='A').slice(0,5);

  // Chart top 5
  const chartTop5 = (gs.charts?.streams||[]).slice(0,5);

  const newsColor = {
    pos:'var(--accent-green)', neg:'var(--accent-red)',
    milestone:'var(--accent-gold)', npc:'var(--accent-cyan)', '':'var(--text-muted)',
  };

  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <div style={{ position:'relative', minHeight:220, background:'linear-gradient(180deg,#0a0a18 0%,#050509 100%)', overflow:'hidden' }}>
        {/* Background cover art if track exists */}
        {latestTrack?.coverArt && (
          <img src={latestTrack.coverArt} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.15, filter:'blur(20px)', transform:'scale(1.1)' }} />
        )}
        {!latestTrack?.coverArt && (
          <img src={`/assets/covers/${COVER_POOL[(gs.totalWeeks||0)%COVER_POOL.length]}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.08, filter:'blur(24px)', transform:'scale(1.1)' }} onError={e=>e.target.style.display='none'} />
        )}

        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(5,5,9,0.3) 0%,rgba(5,5,9,0.95) 100%)' }}/>

        {/* Content */}
        <div style={{ position:'relative', padding:'20px 16px 16px' }}>

          {/* Artist avatar + name */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(255,255,255,0.15)', flexShrink:0, background:'var(--surface-2)' }}>
              {gs.avatarUrl
                ? <img src={gs.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:28,color:'var(--text-muted)'}}>{(gs.stageName||'?')[0]}</div>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, letterSpacing:1, lineHeight:1, marginBottom:4 }}>{gs.stageName?.toUpperCase()}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontSize:11, color:era.color, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{era.label}</div>
                {(gs.awards||[]).length>0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(255,215,0,0.12)', borderRadius:20, padding:'2px 8px' }}>
                    <svg viewBox="0 0 24 24" style={{width:10,height:10,fill:'#FFD700'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span style={{fontSize:9,color:'#FFD700',fontWeight:700}}>{gs.awards.length}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:700, color:'var(--accent-green)' }}>{fmtN(gs.money)}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>net worth</div>
            </div>
          </div>

          {/* Era progress bar */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(gs.fans)} fans</span>
              {nextEra && <span style={{ fontSize:11, color:nextEra.color }}>→ {fmt(nextEra.minFans)} · {nextEra.label}</span>}
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${era.color},${nextEra?.color||era.color})`, borderRadius:4, transition:'width 600ms ease' }}/>
            </div>
          </div>

          {/* END WEEK button */}
          <button
            onClick={endWeek}
            disabled={isEndingWeek}
            style={{ width:'100%', padding:'14px 0', borderRadius:14, background:isEndingWeek?'var(--surface-2)':`linear-gradient(90deg,${era.color},${era.color}cc)`, color:isEndingWeek?'var(--text-muted)':'#000', fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, letterSpacing:2, border:'none', cursor:isEndingWeek?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'opacity 200ms' }}>
            {isEndingWeek ? 'PROCESSING...' : 'END WEEK'}
            {!isEndingWeek && <svg viewBox="0 0 24 24" style={{width:18,height:18,fill:'none',stroke:'#000',strokeWidth:2.5}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ROW ───────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--border)', margin:'0 0 16px' }}>
        {[
          { l:'CLOUT', v:gs.clout,   c:'var(--accent-purple)' },
          { l:'INCOME', v:fmtN(gs.weeklyStreamIncome||0), c:'var(--accent-green)' },
          { l:'CHART', v:topChartEntry?`#${topChartEntry.position}`:'—', c:'var(--accent-gold-lt)' },
          { l:'REP', v:`${gs.reputation||50}`, c:gs.reputation>=60?'var(--accent-green)':gs.reputation>=40?'var(--accent-gold)':'var(--accent-red)' },
        ].map(({l,v,c})=>(
          <div key={l} style={{ background:'var(--bg-raised)', padding:'12px 8px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ── ACTIVE STATUS BANNERS ─────────────────────────────────── */}
        {gs.inPrison && (
          <div style={{ padding:'12px 14px', background:'rgba(214,53,72,0.08)', border:'1px solid rgba(214,53,72,0.25)', borderRadius:12, marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'none',stroke:'var(--accent-red)',strokeWidth:2,flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--accent-red)'}}>In Prison · {gs.prisonWeeksLeft} weeks left</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Can't record, tour, or post while inside.</div>
            </div>
          </div>
        )}

        {gs.tourActive && gs.tourData && (
          <div style={{ padding:'12px 14px', background:'rgba(224,112,32,0.08)', border:'1px solid rgba(224,112,32,0.25)', borderRadius:12, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{fontSize:9,color:'var(--accent-orange)',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>On Tour</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:18}}>{gs.tourData.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700,color:'var(--accent-orange)'}}>{fmtN(Math.round((gs.tourData.revenue||0)/(gs.tourData.weeks||6)))}</div>
                <div style={{fontSize:9,color:'var(--text-muted)'}}>per week</div>
              </div>
            </div>
            <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.round((((gs.tourData.weeks||6)-gs.tourWeeksLeft)/(gs.tourData.weeks||6))*100)}%`,background:'var(--accent-orange)',borderRadius:3,transition:'width 400ms'}}/>
            </div>
            <div style={{fontSize:10,color:'rgba(224,112,32,0.6)',marginTop:5}}>Week {(gs.tourData.weeks||6)-gs.tourWeeksLeft} of {gs.tourData.weeks||6} · Energy drains faster on the road</div>
          </div>
        )}

        {/* ── LATEST RELEASE ────────────────────────────────────────── */}
        {latestTrack && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Latest Drop</div>
              {topChartEntry && <div style={{ fontSize:11, color:'var(--accent-gold-lt)', fontFamily:'var(--font-mono)' }}>#{topChartEntry.position} on chart</div>}
            </div>
            <div style={{ display:'flex', gap:14, padding:'14px', background:'var(--surface-1)', borderRadius:14, border:'1px solid var(--border)', marginBottom:20 }}>
              <div style={{ width:60, height:60, borderRadius:10, overflow:'hidden', background:'var(--surface-2)', flexShrink:0 }}>
                {latestTrack.coverArt
                  ? <img src={latestTrack.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <img src={`/assets/covers/${COVER_POOL[(gs.totalWeeks||0)%COVER_POOL.length]}`} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{latestTrack.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{gs.genre} · Q{latestTrack.quality}</div>
                <div style={{ display:'flex', gap:12, marginTop:8 }}>
                  <div style={{ fontSize:11 }}><span style={{ color:'var(--accent-green)', fontWeight:700 }}>{fmt(latestTrack.streams||0)}</span> <span style={{ color:'var(--text-muted)' }}>streams</span></div>
                  <div style={{ fontSize:11 }}><span style={{ color:'var(--accent-cyan)', fontWeight:700 }}>Wk {latestTrack.releaseWeek}</span></div>
                </div>
              </div>
            </div>
          </>
        )}

        {!latestTrack && (
          <div style={{ padding:'20px', background:'var(--surface-1)', borderRadius:14, border:'1px dashed var(--border)', textAlign:'center', marginBottom:20 }}>
            <svg viewBox="0 0 24 24" style={{width:32,height:32,fill:'none',stroke:'var(--text-muted)',strokeWidth:1.5,margin:'0 auto 10px',display:'block'}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>No tracks released yet</div>
            <div style={{ fontSize:11, color:'var(--text-disabled)', marginTop:4 }}>Head to Studio to record your first song</div>
          </div>
        )}

        {/* ── CHART PREVIEW ────────────────────────────────────────── */}
        {chartTop5.length > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Chart Top 5</div>
              <div style={{ fontSize:11, color:'var(--accent-purple)', cursor:'pointer' }} onClick={()=>patch({tab:'world'})}>See All →</div>
            </div>
            <div style={{ background:'var(--surface-1)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:20 }}>
              {chartTop5.map((entry, i) => (
                <div key={entry.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:i<4?'1px solid var(--border)':'none', background:entry.isPlayer?'rgba(108,63,204,0.08)':'transparent' }}>
                  <div style={{ width:20, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:i<3?'var(--accent-gold-lt)':'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <div style={{ width:36, height:36, borderRadius:6, overflow:'hidden', background:'var(--surface-2)', flexShrink:0 }}>
                    <img src={`/assets/covers/${COVER_POOL[(i+(gs.totalWeeks||0))%COVER_POOL.length]}`} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:entry.isPlayer?900:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:entry.isPlayer?'var(--accent-purple)':'var(--text-primary)' }}>{entry.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{entry.artist||entry.npcId}</div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{fmt(entry.streams||0)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AWARDS SHELF ─────────────────────────────────────────── */}
        {(gs.awards||[]).length > 0 && (
          <>
            <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Awards</div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none' }}>
              {gs.awards.map((award,i) => (
                <div key={i} style={{ flexShrink:0, background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:'12px 16px', minWidth:130, textAlign:'center' }}>
                  <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:'#FFD700',margin:'0 auto 6px',display:'block'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div style={{fontSize:11,fontWeight:700,color:'#FFD700'}}>{award.title}</div>
                  <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>Week {award.week}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── WHO'S BUZZING (NPC feed) ──────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Who's Buzzing</div>
          <div style={{ fontSize:11, color:'var(--accent-purple)', cursor:'pointer' }} onClick={()=>patch({tab:'social'})}>Chirp →</div>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none' }}>
          {topNpcs.map(npc => {
            const song = (gs.npcCatalog||[]).find(s=>s.npcId===npc.id);
            return (
              <div key={npc.id} style={{ flexShrink:0, width:110, background:'var(--surface-1)', borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                <div style={{ height:60, overflow:'hidden', position:'relative' }}>
                  <img src={`/assets/covers/${COVER_POOL[(npc.id?.length||3+gs.totalWeeks)%COVER_POOL.length]}`} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.6}} onError={e=>e.target.style.display='none'}/>
                  <div style={{position:'absolute',inset:0,background:`linear-gradient(180deg,transparent,${npc.color}44)`}}/>
                  <div style={{position:'absolute',bottom:6,left:6}}>
                    <NpcAvatar npc={npc} size={28}/>
                  </div>
                </div>
                <div style={{ padding:'8px 8px 10px' }}>
                  <div style={{ fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{npc.name}</div>
                  {song && <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{song.title}"</div>}
                  <div style={{ fontSize:8, color:npc.color, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{npc.tier} tier</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── INDUSTRY NEWS ─────────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Industry News</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>Wk {gs.totalWeeks}</div>
        </div>
        <div style={{ background:'var(--surface-1)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:24 }}>
          {newsItems.length===0 ? (
            <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
              News will appear as your career develops.
            </div>
          ) : (
            newsItems.map((item,i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderBottom:i<newsItems.length-1?'1px solid var(--border)':'none', alignItems:'flex-start' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:newsColor[item.type]||'var(--text-muted)', flexShrink:0, marginTop:5 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, lineHeight:1.4 }}><BoldedNews text={item.msg}/></div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>Week {item.week}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
