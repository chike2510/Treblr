import { useState } from 'react';
import { ERAS } from '../data/constants';
import { fmt, fmtN, getEra } from '../engine/utils';
import { NPC_ARTISTS } from '../data/artists';
import { Aurora, Magnetic, StatNumber, SectionLabel } from '../components/Living';

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
  const chartTop5 = (gs.charts?.streams||[]).slice(0,5);

  const newsColor = {
    pos:'var(--accent-green)', neg:'var(--accent-red)',
    milestone:'var(--accent-gold)', npc:'var(--li-accent-lt)', '':'var(--text-muted)',
  };

  return (
    <div className="tab-content li-scene" style={{ padding:0 }}>
      <Aurora c1={era.color} c2="#7C6CFF" c3="#ffffff" />
      <div className="li-scene-content">

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <div style={{ position:'relative', minHeight:200, overflow:'hidden' }}>
        {latestTrack?.coverArt && (
          <img src={latestTrack.coverArt} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.15, filter:'blur(20px)', transform:'scale(1.1)' }} />
        )}
        {!latestTrack?.coverArt && (
          <img src={`/assets/covers/${COVER_POOL[(gs.totalWeeks||0)%COVER_POOL.length]}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.08, filter:'blur(24px)', transform:'scale(1.1)' }} onError={e=>e.target.style.display='none'} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(5,5,9,0.2) 0%,rgba(5,5,9,0.9) 100%)' }}/>

        <div style={{ position:'relative', padding:'20px 16px 16px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:`2px solid ${era.color}55`, boxShadow:`0 0 0 4px ${era.color}22`, flexShrink:0, background:'var(--surface-2)' }}>
              {gs.avatarUrl
                ? <img src={gs.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--li-font-display)',fontSize:28,color:'var(--text-muted)'}}>{(gs.stageName||'?')[0]}</div>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--li-font-display)', fontSize:26, fontWeight:700, letterSpacing:-0.5, lineHeight:1.05, marginBottom:5 }}>{gs.stageName?.toUpperCase()}</div>
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
              <StatNumber value={gs.money} format={fmtN} className="li-count" style={{ fontSize:18, fontWeight:700, color:'var(--accent-green)', display:'block' }} />
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
              <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${era.color},${nextEra?.color||era.color})`, borderRadius:4, transition:'width 600ms var(--li-ease-smooth)' }}/>
            </div>
          </div>

          {/* END WEEK button */}
          <Magnetic strength={6} onClick={isEndingWeek ? undefined : endWeek} disabled={isEndingWeek}
            className="soc-fab"
            style={{ width:'100%', padding:'14px 0', borderRadius:16, background:isEndingWeek?'var(--surface-2)':`linear-gradient(90deg,${era.color},${era.color}cc)`, color:isEndingWeek?'var(--text-muted)':'#000', fontFamily:'var(--li-font-display)', fontSize:17, fontWeight:700, letterSpacing:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow: isEndingWeek?'none':`0 8px 24px ${era.color}44` }}>
            {isEndingWeek ? 'PROCESSING...' : 'END WEEK'}
            {!isEndingWeek && <svg viewBox="0 0 24 24" style={{width:18,height:18,fill:'none',stroke:'#000',strokeWidth:2.5}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </Magnetic>
        </div>
      </div>

      {/* ── SNAPSHOT — packaged glass strip, not a stat grid ─────────────── */}
      <div style={{ padding:'0 16px' }}>
        <div className="li-glass li-stagger" style={{ '--i':0, display:'flex', padding:'14px 0', marginBottom:20 }}>
          {[
            { l:'Clout', v:gs.clout, c:'var(--li-accent-lt)' },
            { l:'Income', v:fmtN(gs.weeklyStreamIncome||0), c:'var(--accent-green)' },
            { l:'Chart', v:topChartEntry?`#${topChartEntry.position}`:'—', c:'var(--accent-gold-lt)' },
            { l:'Rep', v:`${gs.reputation||50}`, c:gs.reputation>=60?'var(--accent-green)':gs.reputation>=40?'var(--accent-gold)':'var(--accent-red)' },
          ].map(({l,v,c},i)=>(
            <div key={l} style={{ flex:1, textAlign:'center', borderLeft:i>0?'1px solid var(--li-glass-border)':'none' }}>
              <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:5 }}>{l}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* ── ACTIVE STATUS BANNERS ─────────────────────────────────── */}
        {gs.inPrison && (
          <div className="li-glass li-stagger" style={{ '--i':1, padding:'12px 14px', borderColor:'rgba(214,53,72,0.3)', background:'rgba(214,53,72,0.08)', marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'none',stroke:'var(--accent-red)',strokeWidth:2,flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--accent-red)'}}>In Prison · {gs.prisonWeeksLeft} weeks left</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Can't record, tour, or post while inside.</div>
            </div>
          </div>
        )}

        {gs.tourActive && gs.tourData && (
          <div className="li-glass li-stagger" style={{ '--i':1, padding:'12px 14px', borderColor:'rgba(224,112,32,0.3)', background:'rgba(224,112,32,0.08)', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{fontSize:9,color:'var(--accent-orange)',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>On Tour</div>
                <div style={{fontFamily:'var(--li-font-display)',fontSize:17,fontWeight:700}}>{gs.tourData.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700,color:'var(--accent-orange)'}}>{fmtN(Math.round((gs.tourData.revenue||0)/(gs.tourData.weeks||6)))}</div>
                <div style={{fontSize:9,color:'var(--text-muted)'}}>per week</div>
              </div>
            </div>
            <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.round((((gs.tourData.weeks||6)-gs.tourWeeksLeft)/(gs.tourData.weeks||6))*100)}%`,background:'var(--accent-orange)',borderRadius:3,transition:'width 400ms var(--li-ease-smooth)'}}/>
            </div>
            <div style={{fontSize:10,color:'rgba(224,112,32,0.6)',marginTop:5}}>Week {(gs.tourData.weeks||6)-gs.tourWeeksLeft} of {gs.tourData.weeks||6} · Energy drains faster on the road</div>
          </div>
        )}

        {/* ── LATEST RELEASE ────────────────────────────────────────── */}
        {latestTrack && (
          <>
            <SectionLabel action={topChartEntry ? `#${topChartEntry.position} on chart` : null}>Latest Drop</SectionLabel>
            <div className="li-glass li-stagger" style={{ '--i':2, display:'flex', gap:14, padding:14, marginBottom:20 }}>
              <div style={{ width:60, height:60, borderRadius:12, overflow:'hidden', background:'var(--surface-2)', flexShrink:0 }}>
                {latestTrack.coverArt
                  ? <img src={latestTrack.coverArt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <img src={`/assets/covers/${COVER_POOL[(gs.totalWeeks||0)%COVER_POOL.length]}`} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{latestTrack.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{gs.genre} · Q{latestTrack.quality}</div>
                <div style={{ display:'flex', gap:12, marginTop:8 }}>
                  <div style={{ fontSize:11 }}><span style={{ color:'var(--accent-green)', fontWeight:700 }}>{fmt(latestTrack.streams||0)}</span> <span style={{ color:'var(--text-muted)' }}>streams</span></div>
                  <div style={{ fontSize:11 }}><span style={{ color:'var(--li-accent-lt)', fontWeight:700 }}>Wk {latestTrack.releaseWeek}</span></div>
                </div>
              </div>
            </div>
          </>
        )}

        {!latestTrack && (
          <div className="li-glass li-stagger" style={{ '--i':2, padding:'20px', textAlign:'center', marginBottom:20 }}>
            <svg viewBox="0 0 24 24" style={{width:32,height:32,fill:'none',stroke:'var(--text-muted)',strokeWidth:1.5,margin:'0 auto 10px',display:'block'}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>No tracks released yet</div>
            <div style={{ fontSize:11, color:'var(--text-disabled)', marginTop:4 }}>Head to Create → Record to make your first song</div>
          </div>
        )}

        {/* ── CHART PREVIEW ────────────────────────────────────────── */}
        {chartTop5.length > 0 && (
          <>
            <SectionLabel action="See All →" onAction={()=>patch({tab:'profile'})}>Chart Top 5</SectionLabel>
            <div className="li-glass li-stagger" style={{ '--i':3, overflow:'hidden', marginBottom:20 }}>
              {chartTop5.map((entry, i) => (
                <div key={entry.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:i<4?'1px solid var(--li-glass-border)':'none', background:entry.isPlayer?'var(--li-accent-soft)':'transparent' }}>
                  <div style={{ width:20, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:i<3?'var(--accent-gold-lt)':'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', background:'var(--surface-2)', flexShrink:0 }}>
                    <img src={`/assets/covers/${COVER_POOL[(i+(gs.totalWeeks||0))%COVER_POOL.length]}`} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:entry.isPlayer?700:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:entry.isPlayer?'var(--li-accent-lt)':'var(--text-primary)' }}>{entry.title}</div>
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
            <SectionLabel>Awards</SectionLabel>
            <div className="soc-scroll-x" style={{ gap:10, paddingBottom:8, marginBottom:20 }}>
              {gs.awards.map((award,i) => (
                <div key={i} className="li-glass" style={{ flexShrink:0, background:'rgba(255,215,0,0.06)', borderColor:'rgba(255,215,0,0.2)', padding:'12px 16px', minWidth:130, textAlign:'center' }}>
                  <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:'#FFD700',margin:'0 auto 6px',display:'block'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div style={{fontSize:11,fontWeight:700,color:'#FFD700'}}>{award.title}</div>
                  <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>Week {award.week}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── WHO'S BUZZING (NPC feed) ──────────────────────────────── */}
        <SectionLabel action="Chirp →" onAction={()=>patch({tab:'social'})}>Who's Buzzing</SectionLabel>
        <div className="soc-scroll-x" style={{ gap:8, paddingBottom:8, marginBottom:20 }}>
          {topNpcs.map(npc => {
            const song = (gs.npcCatalog||[]).find(s=>s.npcId===npc.id);
            return (
              <div key={npc.id} className="li-glass" style={{ flexShrink:0, width:110, overflow:'hidden' }}>
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
        <SectionLabel>Industry News</SectionLabel>
        <div className="li-glass" style={{ overflow:'hidden', marginBottom:24 }}>
          {newsItems.length===0 ? (
            <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
              News will appear as your career develops.
            </div>
          ) : (
            newsItems.map((item,i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderBottom:i<newsItems.length-1?'1px solid var(--li-glass-border)':'none', alignItems:'flex-start' }}>
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
    </div>
  );
}
