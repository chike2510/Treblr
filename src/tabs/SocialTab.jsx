import { useState, useMemo } from 'react';
import { NPC_ARTISTS } from '../data/artists';
import { clamp, fmt, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

// ── NPC avatar map ────────────────────────────────────────────────────────────
const NPC_AVATARS = {
  taylor:     'av_01_01.png',
  drake:      'av_01_02.png',
  kendrick:   'av_01_03.png',
  billie:     'av_01_04.png',
  weeknd:     'av_01_05.png',
  burna:      'av_01_06.png',
  tyla:       'av_01_07.png',
  sza:        'av_01_08.png',
  stevelacy:  'av_02_01.png',
  frankocean: 'av_02_02.png',
  tems:       'av_02_03.png',
  olivia:     'av_02_04.png',
  wizkid:     'av_02_05.png',
  karolg:     'av_02_06.png',
  ayra:       'av_02_07.png',
  sabrina:    'av_02_08.png',
};

const COVER_POOL = Array.from({ length: 27 }, (_, i) => {
  const row = Math.floor(i / 9) + 1;
  const col = (i % 9) + 1;
  return `cov_0${row}_0${String(col).padStart(2,'0')}.png`;
});

// ── Verified Chirp accounts ───────────────────────────────────────────────────
const VERIFIED_ACCOUNTS = {
  hillboard: { name:'Hillboard Charts', handle:'@hillboardcharts', avatar:'/assets/accounts/hillboard.png', color:'#22c55e' },
  popcraze:  { name:'Pop Craze',        handle:'@popcraze',        avatar:'/assets/accounts/popcraze.png',  color:'#f97316' },
  popchase:  { name:'PopChase',         handle:'@popchase',        avatar:'/assets/accounts/popchase.png',  color:'#a855f7' },
  chartinfo: { name:'Chart Info',       handle:'@chartinfo',       avatar:'/assets/accounts/chartinfo.png', color:'#f43f5e' },
  burrco:    { name:'Burrco',           handle:'@burrco',          avatar:'/assets/accounts/burrco.png',    color:'#3b82f6' },
  cmz:       { name:'CMZ',              handle:'@cmz',             avatar:'/assets/accounts/cmz.png',       color:'#ef4444' },
};

const CHART_COLORS = {
  hot100:    { bg:'#16a34a', title:'HOT',       num:'100' },
  global200: { bg:'#9333ea', title:'GLOBAL',    num:'200' },
  artist100: { bg:'#dc2626', title:'ARTIST',    num:'100' },
  bb200:     { bg:'#0891b2', title:'BILLBOARD', num:'200' },
};

// ── Platform configs ─────────────────────────────────────────────────────────
const PC = {
  soundify:  { color:'#1DB954', bg:'rgba(29,185,84,0.1)',   border:'rgba(29,185,84,0.3)',   label:'Soundify',  metric:'Monthly Listeners', icon:'/assets/icons/soundify.png'  },
  instapic:  { color:'#E1306C', bg:'rgba(225,48,108,0.1)', border:'rgba(225,48,108,0.3)', label:'Instapic',  metric:'Followers',          icon:'/assets/icons/instapic.png'  },
  chirp:     { color:'#1DA1F2', bg:'rgba(29,161,242,0.1)', border:'rgba(29,161,242,0.3)', label:'Chirp',     metric:'Followers',          icon:'/assets/icons/chirp.png'     },
  vidtube:   { color:'#FF0000', bg:'rgba(255,0,0,0.1)',     border:'rgba(255,0,0,0.3)',     label:'VidTube',   metric:'Subscribers',        icon:'/assets/icons/vidtube.png'   },
  rhythmtok: { color:'#69C9D0', bg:'rgba(105,201,208,0.1)',border:'rgba(105,201,208,0.3)', label:'RhythmTok', metric:'Followers',          icon:'/assets/icons/rhythmtok.png' },
  wavelog:   { color:'#FF5500', bg:'rgba(255,85,0,0.1)',    border:'rgba(255,85,0,0.3)',    label:'Wavelog',   metric:'Followers',          icon:'/assets/icons/wavelog.png'   },
};

const PLATFORM_ORDER = ['soundify','instapic','chirp','vidtube','rhythmtok','wavelog'];

const fmtStat = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return String(Math.round(n));
};

// ── Shared avatar components ──────────────────────────────────────────────────
const PlatformIcon = ({ pid, size = 44 }) => {
  const c = PC[pid] || {};
  const [err, setErr] = useState(false);
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.25, overflow:'hidden', background:c.bg, border:'1px solid '+c.border, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {!err
        ? <img src={c.icon} alt={c.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setErr(true)} />
        : <span style={{ fontSize:size*0.35, fontWeight:900, color:c.color }}>{c.label[0]}</span>
      }
    </div>
  );
};

const NpcAvatar = ({ npc, size = 36 }) => {
  const [err, setErr] = useState(false);
  const file = NPC_AVATARS[npc?.id];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:(npc?.color||'#444')+'30', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {file && !err
        ? <img src={`/assets/avatars/${file}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setErr(true)} />
        : <span style={{ fontWeight:900, fontSize:size*0.35, color:npc?.color||'#aaa' }}>{(npc?.name||'?')[0]}</span>
      }
    </div>
  );
};

const AccountAvatar = ({ account, size = 36 }) => {
  const [err, setErr] = useState(false);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:account.color+'20', border:'1.5px solid '+account.color+'50', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {!err
        ? <img src={account.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setErr(true)} />
        : <span style={{ fontWeight:900, fontSize:size*0.4, color:account.color }}>{account.name[0]}</span>
      }
    </div>
  );
};

const PlayerAvatar = ({ gs, size = 36, ring }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'var(--surface-2)', border:`2px solid ${ring||'var(--accent-purple)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
    {gs.avatarUrl
      ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      : <span style={{ fontFamily:'var(--font-display)', fontSize:size*0.38, color:'var(--text-muted)' }}>{(gs.stageName||'?')[0]}</span>
    }
  </div>
);

// ── Hillboard chart card ──────────────────────────────────────────────────────
const ChartCard = ({ chartCard }) => {
  const cfg = CHART_COLORS[chartCard.type] || CHART_COLORS.hot100;
  return (
    <div style={{ borderRadius:12, overflow:'hidden', marginTop:10, border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ background:cfg.bg, padding:'10px 14px' }}>
        <div style={{ fontSize:9, fontStyle:'italic', color:'rgba(255,255,255,0.7)', marginBottom:2 }}>hillboard</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'#fff', letterSpacing:-1 }}>{cfg.title}</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'rgba(255,255,255,0.6)', letterSpacing:-1 }}>{cfg.num}</span>
        </div>
      </div>
      <div style={{ background:'#080808' }}>
        {(chartCard.entries||[]).map((entry, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px', borderBottom: i < chartCard.entries.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ width:18, textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:i<3?'#fff':'var(--text-muted)', flexShrink:0 }}>{entry.position||i+1}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#fff', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{entry.title||entry.artist||'—'}</div>
              {entry.artist && entry.title && <div style={{ fontSize:9, color:'var(--text-muted)' }}>{entry.artist}</div>}
            </div>
            <div style={{ fontSize:9, color:'var(--text-muted)', flexShrink:0 }}>—</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Chirp stat row ────────────────────────────────────────────────────────────
const ChirpStats = ({ likes, reposts, views }) => (
  <div style={{ display:'flex', gap:18, marginTop:10, fontSize:12, color:'var(--text-muted)' }}>
    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
      <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      {fmtStat(likes)}
    </span>
    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
      <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      {fmtStat(reposts)}
    </span>
    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
      <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      {fmtStat(views)}
    </span>
  </div>
);

// ── Chirp feed generator ──────────────────────────────────────────────────────
const genChirpFeed = (gs, npcCatalog, playerName) => {
  const feed = [];
  const snap = gs.latestChartSnapshot;
  const week = gs.totalWeeks;
  const ago  = (n) => n === 0 ? 'now' : `${n}h`;

  if (snap?.hot100?.length > 0) {
    feed.push({ account:VERIFIED_ACCOUNTS.hillboard, text:`This week's top 10 on the #Hot100 (Week ${week}).`, chartCard:{ type:'hot100', entries:snap.hot100.slice(0,10) }, time:ago(1), likes:rand(30000,90000), reposts:rand(5000,20000), views:rand(500000,2000000) });
    if (snap.global200?.length > 0)
      feed.push({ account:VERIFIED_ACCOUNTS.hillboard, text:`Global 200 updated — Week ${week}.`, chartCard:{ type:'global200', entries:snap.global200.slice(0,10) }, time:ago(2), likes:rand(20000,60000), reposts:rand(3000,12000), views:rand(200000,800000) });
    if (snap.artist100?.length > 0)
      feed.push({ account:VERIFIED_ACCOUNTS.hillboard, text:`#Artist100 — Who's running things this week.`, chartCard:{ type:'artist100', entries:snap.artist100.slice(0,5) }, time:ago(3), likes:rand(15000,50000), reposts:rand(2000,8000), views:rand(150000,500000) });
  }

  const topNpcs = NPC_ARTISTS.filter(n => n.tier==='S'||n.tier==='A').slice(0,12);
  const reactions = [
    `The ${playerName} fandom really said we're streaming until this goes #1 and honestly? I believe them.`,
    `Hot100 this week: Ella Langley holding strong. The numbers don't lie.`,
    `The way ${playerName} is moving up without a single label push is something else.`,
  ];
  feed.push({ account:VERIFIED_ACCOUNTS.popchase, text:reactions[week%reactions.length], time:ago(rand(1,6)), likes:rand(5000,80000), reposts:rand(1000,30000), views:rand(80000,600000) });

  feed.push({ account:VERIFIED_ACCOUNTS.chartinfo, text:`Hillboard Hot100 updated: ${snap?.hot100?.[0]?.artist||'Ella Langley'} leads. New entry: ${topNpcs[rand(0,4)]?.name||'Tems'} debuts at #${rand(15,40)}.`, time:ago(rand(1,8)), likes:rand(2000,15000), reposts:rand(500,5000), views:rand(40000,200000) });

  for (let i = 0; i < 4; i++) {
    const npc = topNpcs[(week + i*3) % topNpcs.length];
    if (!npc) continue;
    const song = npcCatalog.find(s => s.npcId===npc.id);
    const posts = [
      song ? `"${song.title}" is everywhere right now. Thank you for the love.` : `Been cooking something new. Trust the process.`,
      `The way the streets have been showing up — can't say enough.`,
      `No features for a while. Next project is just me.`,
      `New music tonight at midnight. Been sitting on this one for months.`,
    ];
    feed.push({ npc, text:posts[i%posts.length], time:ago(rand(1,12)), likes:rand(10000,400000), reposts:rand(2000,80000), views:rand(100000,2000000) });
  }

  const burrcoItems = [
    `EXCLUSIVE: ${topNpcs[0]?.name||'Drake'} turned down a major sync deal to keep creative control.`,
    `The sampling situation with ${topNpcs[1]?.name||'Kendrick'}'s last project is about to get messy.`,
    `${playerName} is doing things most producers won't attempt. The layering on this new one is something.`,
  ];
  feed.push({ account:VERIFIED_ACCOUNTS.burrco, text:burrcoItems[week%burrcoItems.length], time:ago(rand(2,10)), likes:rand(15000,120000), reposts:rand(3000,40000), views:rand(200000,1000000) });

  const cmzItems = [
    `${topNpcs[2]?.name||'Wizkid'} seen leaving a recording session at 4am. Album incoming?`,
    `Sources say there's a collab the labels don't want released. Interesting timing.`,
    `${playerName} spotted at industry event — looking like the next big thing.`,
  ];
  feed.push({ account:VERIFIED_ACCOUNTS.cmz, text:cmzItems[week%cmzItems.length], time:ago(rand(3,15)), likes:rand(5000,50000), reposts:rand(1000,15000), views:rand(50000,300000) });

  const popCrazeItems = [
    `The way ${playerName}'s fanbase has been trending all week without a single post from them… the fandom said "we'll do it ourselves"`,
    `Hillboard Hot100 updated: Ella Langley is locked in. It's her era.`,
    `The discourse about whether ${topNpcs[3]?.name||'SZA'} deserved that spot is sending me`,
  ];
  feed.push({ account:VERIFIED_ACCOUNTS.popcraze, text:popCrazeItems[week%popCrazeItems.length], time:ago(rand(2,8)), likes:rand(8000,100000), reposts:rand(2000,30000), views:rand(100000,500000) });

  return feed;
};

// ── Post action (platform growth) ────────────────────────────────────────────
const usePost = (gs, patchFn, showToast) => (platformId, seCost=1, extraEffects={}) => {
  if ((gs.se||0) < seCost) { showToast(`Need ${seCost} Social Energy`); return; }
  patchFn(prev => {
    const cur = (prev.socialPlatforms||{})[platformId]||0;
    const cb  = 1 + ((prev.charisma||5)/50);
    const sm  = prev.careerType==='social_media' ? 3 : 1;
    let gain=0, cloutG=0, pendingToast=null;

    switch(platformId) {
      case 'soundify':  gain=rand(200,800)*cb*sm;  cloutG=1; break;
      case 'instapic':  gain=rand(300,1200)*cb*sm; cloutG=1; break;
      case 'chirp':     gain=rand(150,600)*cb*sm;  cloutG=1; break;
      case 'vidtube':   gain=rand(800,3000)*cb;    cloutG=2; break;
      case 'rhythmtok': {
        const viral = Math.random()<0.10;
        gain = viral ? rand(8000,80000) : rand(300,2000);
        cloutG = viral ? 6 : 1;
        if (viral) pendingToast='VIRAL ON RHYTHMTOK!';
        break;
      }
      case 'wavelog':   gain=rand(150,600); cloutG=1; break;
    }

    return {
      se: clamp((prev.se||0)-seCost, 0, prev.maxSe||7),
      clout: clamp((prev.clout||0)+cloutG, 0, 100),
      socialPlatforms: { ...(prev.socialPlatforms||{}), [platformId]: Math.round(cur+gain) },
      news: addNews(prev.news, `Posted on ${PC[platformId]?.label||platformId} · +${Math.round(gain).toLocaleString()} reach`, 'pos', prev.totalWeeks),
      _pendingToast: pendingToast,
      ...extraEffects,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SocialTab({ gs, patch, patchFn, showToast }) {
  const [activePlatform, setActivePlatform] = useState(null);
  const [chirpScreen,    setChirpScreen]    = useState('feed');   // 'feed' | 'profile' | 'compose'
  const [chirpTab,       setChirpTab]       = useState('foryou');
  const [instapicScreen, setInstapicScreen] = useState('feed');   // 'feed' | 'profile'
  const [rythmScreen,    setRythmScreen]    = useState('profile');

  const platforms     = gs.socialPlatforms || {};
  const totalFollowers = Object.values(platforms).reduce((a,b) => a+(b||0), 0);
  const seLeft        = gs.se || 0;
  const releasedTracks = (gs.catalog||[]).filter(t => t.released);

  const doPost = usePost(gs, patchFn, showToast);

  const chirpFeed = useMemo(() =>
    genChirpFeed(gs, gs.npcCatalog||[], gs.stageName||'You'),
    [gs.totalWeeks, gs.latestChartSnapshot]
  );

  // ── Back helper ──────────────────────────────────────────────────────────
  const BackBtn = ({ onBack, label='Back' }) => (
    <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'0 0 14px', fontSize:13 }}>
      <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:'currentColor', strokeWidth:2 }}><polyline points="15 18 9 12 15 6"/></svg>
      {label}
    </button>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // HUB VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!activePlatform) {
    return (
      <div className="tab-content">
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:900, fontFamily:'var(--font-display)' }}>Social Hub</div>
              <div style={{ fontSize:11, color:'var(--accent-purple)', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>Global Influence</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:'var(--accent-purple)' }}>{fmt(totalFollowers)}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>TOTAL REACH</div>
            </div>
          </div>
          <div style={{ height:3, background:'var(--surface-2)', borderRadius:2, marginTop:12, overflow:'hidden' }}>
            <div style={{ height:'100%', width:Math.min(100, totalFollowers/10000)+'%', background:'linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))', borderRadius:2, transition:'width 400ms ease' }} />
          </div>
        </div>

        {/* SE dots */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--surface-1)', borderRadius:'var(--r)', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>Social Energy</span>
          <div style={{ display:'flex', gap:5 }}>
            {Array.from({ length:gs.maxSe||7 }).map((_,i) => (
              <div key={i} style={{ width:9, height:9, borderRadius:'50%', background:i<seLeft?'var(--accent-cyan)':'var(--surface-2)', transition:'background 150ms' }} />
            ))}
          </div>
        </div>

        {/* Platform list */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {PLATFORM_ORDER.map((pid, idx) => {
            const c   = PC[pid]||{};
            const count = platforms[pid]||0;
            const isAuto = pid==='soundify';
            return (
              <div key={pid}
                onClick={() => { setActivePlatform(pid); setChirpScreen('feed'); setInstapicScreen('feed'); setRythmScreen('profile'); }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom:idx<PLATFORM_ORDER.length-1?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 150ms' }}
              >
                <PlatformIcon pid={pid} size={44} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{c.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{c.metric}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:c.color }}>{fmt(count)}</div>
                  {isAuto && <div style={{ fontSize:9, color:'var(--accent-green)', textTransform:'uppercase', letterSpacing:1 }}>AUTO</div>}
                </div>
                <svg viewBox="0 0 24 24" style={{ width:14, height:14, fill:'none', stroke:'var(--text-muted)', strokeWidth:2, flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const c          = PC[activePlatform]||{};
  const followers  = platforms[activePlatform]||0;

  // ════════════════════════════════════════════════════════════════════════════
  // SOUNDIFY
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='soundify') {
    const topNpcs = NPC_ARTISTS.filter(n=>n.tier==='S').slice(0,4);
    const playlists = [
      { name:'Soundify Hits', desc:'The biggest hits in the world.', color:'#1DB954' },
      { name:'Rap Caviar',    desc:'New hip-hop joints.',            color:'#f97316' },
      { name:'Pop Rising',    desc:'The future of pop.',             color:'#a855f7' },
    ];
    return (
      <div className="tab-content">
        <BackBtn onBack={() => setActivePlatform(null)} />

        {/* Search bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface-2)', borderRadius:22, padding:'10px 16px', marginBottom:20 }}>
          <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:'var(--text-muted)', strokeWidth:2 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>Artists, songs, podcasts…</span>
        </div>

        {/* Filter chips */}
        <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', scrollbarWidth:'none' }}>
          {['All','Music','Podcasts','Audiobooks','Live Events'].map((t,i) => (
            <div key={t} style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, background:i===0?c.color:'var(--surface-2)', color:i===0?'#000':'var(--text-muted)', fontSize:12, fontWeight:i===0?700:400, cursor:'pointer' }}>{t}</div>
          ))}
        </div>

        {/* Featured banner */}
        <div style={{ height:160, borderRadius:12, overflow:'hidden', background:'linear-gradient(135deg,#1a1a2e,#16213e)', marginBottom:20, position:'relative', display:'flex', alignItems:'flex-end', padding:14 }}>
          <div style={{ background:c.color, fontSize:10, fontWeight:700, color:'#000', padding:'2px 8px', borderRadius:4, marginBottom:6, position:'absolute', top:14, left:14 }}>FEATURED</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900 }}>{gs.stageName||'You'}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Listen to the essential tracks</div>
          </div>
        </div>

        {/* Popular Artists */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Popular Artists</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}>SEE ALL</div>
        </div>
        <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:12, marginBottom:20, scrollbarWidth:'none' }}>
          {/* Player */}
          <div style={{ flexShrink:0, textAlign:'center', width:72 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', background:'var(--surface-2)', margin:'0 auto 6px' }}>
              {gs.avatarUrl ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontFamily:'var(--font-display)' }}>{(gs.stageName||'?')[0]}</div>}
            </div>
            <div style={{ fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gs.stageName}</div>
            <div style={{ fontSize:9, color:'var(--text-muted)' }}>Artist</div>
          </div>
          {topNpcs.map(npc => (
            <div key={npc.id} style={{ flexShrink:0, textAlign:'center', width:72 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', margin:'0 auto 6px' }}>
                <NpcAvatar npc={npc} size={72} />
              </div>
              <div style={{ fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{npc.name}</div>
              <div style={{ fontSize:9, color:'var(--text-muted)' }}>Artist</div>
            </div>
          ))}
        </div>

        {/* Made For You */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Made For {gs.stageName}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}>SEE ALL</div>
        </div>
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
          {playlists.map(pl => (
            <div key={pl.name} style={{ flexShrink:0, width:120 }}>
              <div style={{ width:120, height:120, borderRadius:10, background:`linear-gradient(135deg,${pl.color}22,${pl.color}55)`, border:`1px solid ${pl.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:pl.color, textAlign:'center', padding:8 }}>{pl.name}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, lineHeight:1.3 }}>{pl.name}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{pl.desc}</div>
            </div>
          ))}
        </div>

        {/* Artist profile strip */}
        <div style={{ marginTop:20, padding:'16px', background:'var(--surface-1)', borderRadius:'var(--r)' }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>Your Profile</div>
          <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:14 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', background:'var(--surface-2)' }}>
              {gs.avatarUrl ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontFamily:'var(--font-display)' }}>{(gs.stageName||'?')[0]}</div>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900 }}>{gs.stageName?.toUpperCase()}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>{fmt(followers)} monthly listeners</div>
              <div style={{ display:'flex', gap:10, marginTop:8 }}>
                <button style={{ padding:'7px 18px', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)', background:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Follow</button>
                <button style={{ padding:'7px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.2)', background:'none', color:'#fff', fontSize:12, cursor:'pointer' }}>···</button>
                <div style={{ marginLeft:'auto', width:38, height:38, borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'#000' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:20, borderBottom:'1px solid var(--border)', marginBottom:14 }}>
            {['MUSIC','CLIPS','PLAYLIST','MERCH'].map((t,i) => (
              <div key={t} style={{ padding:'8px 0', fontSize:12, fontWeight:i===0?700:400, color:i===0?'#fff':'var(--text-muted)', borderBottom:i===0?`2px solid ${c.color}`:'2px solid transparent', cursor:'pointer' }}>{t}</div>
            ))}
          </div>

          {releasedTracks.length===0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>No songs released yet.</div>
          ) : (
            <div>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Popular</div>
              {releasedTracks.slice(0,5).map((track, idx) => (
                <div key={track.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:16, textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>{idx+1}</div>
                  <div style={{ width:40, height:40, borderRadius:4, overflow:'hidden', background:'var(--surface-2)', flexShrink:0 }}>
                    {track.coverArt ? <img src={track.coverArt} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <img src={`/assets/covers/${COVER_POOL[(idx+gs.totalWeeks)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(Math.round((track.quality/100)*followers*0.4))} plays</div>
                  </div>
                  <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:'var(--text-muted)', strokeWidth:1.5, flexShrink:0 }}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INSTAPIC — FEED or PROFILE
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='instapic') {
    const npcPosts = NPC_ARTISTS.filter(n=>n.tier==='S'||n.tier==='A').slice(0,4);
    const coverIdx = (gs.totalWeeks||0) % COVER_POOL.length;

    // ── Profile screen ──────────────────────────────────────────────────────
    if (instapicScreen==='profile') {
      return (
        <div className="tab-content">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <button onClick={() => setInstapicScreen('feed')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0 }}>
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:2 }}><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ fontWeight:700, fontSize:15 }}>{gs.stageName?.toLowerCase()}</div>
          </div>

          {/* Profile header */}
          <div style={{ display:'flex', gap:24, alignItems:'center', marginBottom:16 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366)', padding:2, flexShrink:0 }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid #000', overflow:'hidden', background:'var(--surface-2)' }}>
                {gs.avatarUrl ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontFamily:'var(--font-display)' }}>{(gs.stageName||'?')[0]}</div>}
              </div>
            </div>
            <div style={{ flex:1, display:'flex', justifyContent:'space-around', textAlign:'center' }}>
              <div><div style={{ fontWeight:700, fontSize:17 }}>{releasedTracks.length}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Posts</div></div>
              <div><div style={{ fontWeight:700, fontSize:17, color:c.color }}>{fmt(followers)}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Followers</div></div>
              <div><div style={{ fontWeight:700, fontSize:17 }}>12</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Following</div></div>
            </div>
          </div>

          <div style={{ marginBottom:6 }}>
            <div style={{ fontWeight:700, fontSize:13 }}>{gs.stageName?.toUpperCase()}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.genre} Artist</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>New Music Out Now</div>
            <div style={{ fontSize:12, color:c.color, marginTop:2 }}>linktr.ee/{gs.stageName?.toLowerCase()}</div>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <button onClick={() => doPost('instapic', 1)} disabled={seLeft<1} style={{ flex:1, padding:'8px 0', borderRadius:8, background:seLeft>=1?'var(--surface-2)':'var(--surface-1)', border:'1px solid var(--border)', color:seLeft>=1?'#fff':'var(--text-muted)', fontSize:12, fontWeight:700, cursor:seLeft>=1?'pointer':'default' }}>Edit Profile</button>
            <button onClick={() => doPost('instapic', 1)} disabled={seLeft<1} style={{ flex:1, padding:'8px 0', borderRadius:8, background:seLeft>=1?'var(--surface-2)':'var(--surface-1)', border:'1px solid var(--border)', color:seLeft>=1?'#fff':'var(--text-muted)', fontSize:12, fontWeight:700, cursor:seLeft>=1?'pointer':'default' }}>Share Profile</button>
            <button onClick={() => doPost('instapic', 1)} disabled={seLeft<1} style={{ padding:'8px 14px', borderRadius:8, background:seLeft>=1?'var(--surface-2)':'var(--surface-1)', border:'1px solid var(--border)', color:seLeft>=1?'#fff':'var(--text-muted)', cursor:seLeft>=1?'pointer':'default' }}>
              <svg viewBox="0 0 24 24" style={{ width:14, height:14, fill:'none', stroke:'currentColor', strokeWidth:2 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </button>
          </div>

          {/* Post grid */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:2, gap:24, justifyContent:'center' }}>
            {[
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:1.5 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            ].map((icon, i) => (
              <div key={i} style={{ padding:'10px 12px', borderBottom:i===0?`2px solid #fff`:'2px solid transparent', cursor:'pointer', color:i===0?'#fff':'var(--text-muted)' }}>{icon}</div>
            ))}
          </div>

          {releasedTracks.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
              <div style={{ width:64, height:64, background:'var(--surface-2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <svg viewBox="0 0 24 24" style={{ width:28, height:28, fill:'none', stroke:'var(--text-muted)', strokeWidth:1 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Share Your First Post</div>
              <div style={{ fontSize:12 }}>Start building your visual story</div>
              <button onClick={() => doPost('instapic', 1)} disabled={seLeft<1} style={{ marginTop:14, padding:'10px 28px', borderRadius:20, background:c.color, color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:seLeft>=1?'pointer':'default' }}>+ Create Post</button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2, marginTop:2 }}>
                {releasedTracks.map((track, idx) => (
                  <div key={track.id} style={{ aspectRatio:'1', overflow:'hidden', background:'var(--surface-2)' }}>
                    {track.coverArt
                      ? <img src={track.coverArt} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <img src={`/assets/covers/${COVER_POOL[(idx+coverIdx)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                    }
                  </div>
                ))}
              </div>
              <button onClick={() => doPost('instapic', 1)} disabled={seLeft<1} style={{ width:'100%', marginTop:12, padding:'10px 0', borderRadius:10, background:seLeft>=1?c.bg:'var(--surface-1)', border:'1px solid '+(seLeft>=1?c.border:'var(--border)'), color:seLeft>=1?c.color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor:seLeft>=1?'pointer':'default' }}>
                + New Post · 1 SE
              </button>
            </>
          )}
        </div>
      );
    }

    // ── Feed screen ─────────────────────────────────────────────────────────
    return (
      <div className="tab-content">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:22, fontStyle:'italic' }}>Instapic</div>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
        </div>

        {/* Stories */}
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:12, marginBottom:14, scrollbarWidth:'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, cursor:'pointer' }} onClick={() => setInstapicScreen('profile')}>
            <div style={{ width:56, height:56, borderRadius:'50%', padding:2, background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid #000', overflow:'hidden', background:'var(--surface-2)' }}>
                {gs.avatarUrl ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontFamily:'var(--font-display)' }}>{(gs.stageName||'?')[0]}</div>}
              </div>
            </div>
            <div style={{ fontSize:9, color:'var(--text-muted)' }}>Your Story</div>
          </div>
          {NPC_ARTISTS.slice(0,6).map(npc => (
            <div key={npc.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', padding:2, background:`linear-gradient(45deg,${npc.color},#a855f7)` }}>
                <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid #000', overflow:'hidden' }}>
                  <NpcAvatar npc={npc} size={52} />
                </div>
              </div>
              <div style={{ fontSize:9, color:'var(--text-muted)', maxWidth:52, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{npc.name.split(' ')[0]}</div>
            </div>
          ))}
        </div>

        {/* Go to profile button */}
        <button onClick={() => setInstapicScreen('profile')} style={{ width:'100%', padding:'9px 0', marginBottom:14, borderRadius:10, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          View Your Profile
        </button>

        {/* NPC posts */}
        {npcPosts.map((npc, i) => (
          <div key={npc.id} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', gap:10, marginBottom:8, alignItems:'center' }}>
              <NpcAvatar npc={npc} size={32} />
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{npc.name.toLowerCase().replace(/ /g,'_')}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>Suggested for you</div>
              </div>
              <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:'var(--text-muted)', strokeWidth:2, marginLeft:'auto' }}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <div style={{ height:260, background:'var(--surface-2)', overflow:'hidden', margin:'0 -16px' }}>
              <img src={`/assets/covers/${COVER_POOL[(i+gs.totalWeeks)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
            </div>
            <div style={{ padding:'10px 0 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', gap:14 }}>
                  <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:1.5 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{fmt(rand(5000,500000))} likes</div>
              <div style={{ fontSize:13 }}><span style={{ fontWeight:700 }}>{npc.name.toLowerCase().replace(/ /g,'_')}</span> {(gs.npcCatalog||[]).find(s=>s.npcId===npc.id) ? `"${(gs.npcCatalog||[]).find(s=>s.npcId===npc.id).title}" out now` : 'Living my best life'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHIRP
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='chirp') {

    // ── Compose screen ──────────────────────────────────────────────────────
    if (chirpScreen==='compose') {
      const [text, setText] = useState('');
      const [promoTrack, setPromoTrack] = useState(null);
      const charLeft = 280 - text.length;

      const handlePost = () => {
        if ((gs.se||0) < 1) { showToast('Need 1 Social Energy'); return; }
        doPost('chirp', 1);
        setChirpScreen('feed');
      };

      return (
        <div className="tab-content">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <button onClick={() => setChirpScreen('feed')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, padding:0 }}>Cancel</button>
            <button onClick={handlePost} disabled={seLeft<1||text.length===0}
              style={{ padding:'7px 20px', borderRadius:20, background:seLeft>=1&&text.length>0?c.color:'var(--surface-2)', color:seLeft>=1&&text.length>0?'#fff':'var(--text-muted)', fontWeight:700, fontSize:13, border:'none', cursor:seLeft>=1&&text.length>0?'pointer':'default' }}>
              Post
            </button>
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <PlayerAvatar gs={gs} size={40} />
            <div style={{ flex:1 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0,280))}
                placeholder="What's happening?"
                style={{ width:'100%', background:'none', border:'none', outline:'none', color:'#fff', fontSize:16, lineHeight:1.5, resize:'none', minHeight:100, fontFamily:'inherit' }}
              />
              {/* Promo track */}
              {promoTrack && (
                <div style={{ display:'flex', gap:10, alignItems:'center', padding:10, background:'var(--surface-2)', borderRadius:10, marginTop:8 }}>
                  <div style={{ width:40, height:40, borderRadius:6, overflow:'hidden', background:'var(--surface-1)' }}>
                    <img src={`/assets/covers/${COVER_POOL[gs.totalWeeks%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>{promoTrack.title}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>Pinned to this post</div>
                  </div>
                  <button onClick={() => setPromoTrack(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 4px' }}>×</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ height:1, background:'var(--border)', margin:'14px 0' }} />

          {/* Toolbar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:18, color:c.color }}>
              {/* Image */}
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:c.color, strokeWidth:1.5, cursor:'pointer' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              {/* Gif */}
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:c.color, strokeWidth:1.5, cursor:'pointer' }}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 12h4v4H8v-4z"/><path d="M16 8v8"/><path d="M8 8h4"/></svg>
              {/* Music promo */}
              <div style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}
                onClick={() => {
                  const track = releasedTracks[0];
                  if (track) setPromoTrack(track);
                  else showToast('Release a track first');
                }}>
                <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:c.color, strokeWidth:1.5 }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                <span style={{ fontSize:11, color:c.color, fontWeight:700 }}>Promote</span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:12, color:charLeft<20?'var(--accent-red)':'var(--text-muted)' }}>{charLeft}</div>
              <div style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${charLeft<20?'var(--accent-red)':c.color}` }}>
                <svg viewBox="0 0 24 24" style={{ width:20, height:20 }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--surface-2)" strokeWidth="3"/>
                  <circle cx="12" cy="12" r="10" fill="none" stroke={c.color} strokeWidth="3"
                    strokeDasharray={`${((280-charLeft)/280)*63} 63`} strokeLinecap="round" transform="rotate(-90 12 12)"/>
                </svg>
              </div>
            </div>
          </div>

          {/* SE cost note */}
          <div style={{ marginTop:16, padding:'10px 14px', background:'var(--surface-1)', borderRadius:10, fontSize:12, color:'var(--text-muted)' }}>
            Posting costs 1 SE. You have <span style={{ color:c.color, fontWeight:700 }}>{seLeft} SE</span> remaining this week.
          </div>
        </div>
      );
    }

    // ── Profile screen ──────────────────────────────────────────────────────
    if (chirpScreen==='profile') {
      return (
        <div className="tab-content">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:0 }}>
            <button onClick={() => setChirpScreen('feed')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0 }}>
              <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:2 }}><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{gs.stageName?.toUpperCase()}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{fmt(releasedTracks.length)} posts</div>
            </div>
          </div>

          {/* Banner */}
          <div style={{ height:100, background:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', margin:'12px -16px 0', position:'relative' }}>
            <button style={{ position:'absolute', bottom:8, right:12, padding:'5px 12px', borderRadius:16, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:11, cursor:'pointer' }}>Edit Banner</button>
          </div>

          <div style={{ position:'relative', marginBottom:8 }}>
            <div style={{ position:'absolute', top:-28, left:0 }}>
              <PlayerAvatar gs={gs} size={56} ring={c.color} />
            </div>
            <div style={{ paddingTop:32, display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button style={{ padding:'6px 14px', borderRadius:20, background:'none', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Edit profile</button>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontWeight:900, fontSize:15 }}>{gs.stageName?.toUpperCase()}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>@{gs.stageName?.toLowerCase()}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{gs.genre} Artist</div>
            <div style={{ display:'flex', gap:16, marginTop:8, fontSize:13 }}>
              <span><strong>12</strong> <span style={{ color:'var(--text-muted)' }}>Following</span></span>
              <span><strong style={{ color:c.color }}>{fmt(followers)}</strong> <span style={{ color:'var(--text-muted)' }}>Followers</span></span>
            </div>
          </div>

          {followers===0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
              <div>@{gs.stageName?.toUpperCase()} hasn't posted anything yet.</div>
              <button onClick={() => setChirpScreen('compose')} disabled={seLeft<1}
                style={{ marginTop:14, padding:'10px 24px', borderRadius:20, background:seLeft>=1?c.color:'var(--surface-2)', color:seLeft>=1?'#fff':'var(--text-muted)', fontWeight:700, fontSize:13, border:'none', cursor:seLeft>=1?'pointer':'default' }}>
                Write your first post
              </button>
            </div>
          ) : (
            <>
              {releasedTracks.slice(0,3).map((track, i) => (
                <div key={track.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <div style={{ display:'flex', gap:10, marginBottom:6, alignItems:'center' }}>
                    <PlayerAvatar gs={gs} size={32} />
                    <div>
                      <span style={{ fontWeight:700 }}>{gs.stageName?.toUpperCase()}</span>
                      <span style={{ color:'var(--text-muted)', marginLeft:6 }}>@{gs.stageName?.toLowerCase()}</span>
                    </div>
                  </div>
                  <div>My new track "{track.title}" is out now. Stream it everywhere.</div>
                </div>
              ))}
            </>
          )}
        </div>
      );
    }

    // ── Feed screen ─────────────────────────────────────────────────────────
    return (
      <div className="tab-content">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <button onClick={() => setActivePlatform(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'var(--text-muted)', strokeWidth:2 }}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <PlatformIcon pid="chirp" size={22} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:18, color:c.color }}>Chirp</span>
          </div>
          <button onClick={() => setChirpScreen('profile')}>
            <PlayerAvatar gs={gs} size={30} ring={c.color} />
          </button>
        </div>

        {/* For You / Following */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:4 }}>
          {['foryou','following'].map(t => (
            <div key={t} onClick={() => setChirpTab(t)}
              style={{ flex:1, textAlign:'center', padding:'10px 0', fontSize:13, fontWeight:t===chirpTab?700:400, color:t===chirpTab?'#fff':'var(--text-muted)', borderBottom:t===chirpTab?`2px solid ${c.color}`:'2px solid transparent', cursor:'pointer', transition:'all 150ms' }}>
              {t==='foryou'?'For You':'Following'}
            </div>
          ))}
        </div>

        {/* Feed */}
        {chirpFeed.map((item, i) => (
          <div key={i} style={{ padding:'14px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:12 }}>
            {item.account ? <AccountAvatar account={item.account} size={40} /> : <NpcAvatar npc={item.npc} size={40} />}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>{item.account?item.account.name:item.npc.name}</span>
                {(item.account||item.npc?.tier==='S'||item.npc?.tier==='A') && (
                  <svg viewBox="0 0 24 24" style={{ width:14, height:14 }}>
                    <circle cx="12" cy="12" r="10" fill={item.account?item.account.color:c.color}/>
                    <polyline points="8 12 11 15 16 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                )}
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{item.account?item.account.handle:`@${item.npc?.id}`} · {item.time}</span>
              </div>
              <div style={{ fontSize:14, lineHeight:1.5, color:'var(--text-primary)', marginBottom:2 }}>{item.text}</div>
              {item.chartCard && <ChartCard chartCard={item.chartCard} />}
              <ChirpStats likes={item.likes} reposts={item.reposts} views={item.views} />
            </div>
          </div>
        ))}

        {/* Compose FAB */}
        <button onClick={() => setChirpScreen('compose')}
          style={{ position:'fixed', bottom:80, right:16, width:52, height:52, borderRadius:'50%', background:c.color, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, boxShadow:'0 4px 16px rgba(29,161,242,0.4)' }}>
          <svg viewBox="0 0 24 24" style={{ width:22, height:22, fill:'none', stroke:'#fff', strokeWidth:2 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIDTUBE
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='vidtube') {
    return (
      <div className="tab-content">
        <BackBtn onBack={() => setActivePlatform(null)} />
        <div style={{ height:90, background:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', borderRadius:10, marginBottom:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.15)', fontSize:12, letterSpacing:2 }}>CHANNEL BANNER</div>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'12px 0 14px' }}>
          <PlayerAvatar gs={gs} size={60} ring={c.color} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:16 }}>{gs.stageName?.toUpperCase()}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>@{gs.stageName?.toLowerCase().replace(/ /g,'')} · {fmt(followers)} subscribers · {releasedTracks.length} videos</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Official Channel. Subscribe for new music.</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button style={{ padding:'8px 20px', borderRadius:20, background:'#fff', color:'#000', fontSize:12, fontWeight:700, border:'none', cursor:'pointer' }}>Subscribe</button>
          <button onClick={() => doPost('vidtube', 2)} disabled={seLeft<2}
            style={{ padding:'8px 16px', borderRadius:20, background:seLeft>=2?c.bg:'var(--surface-2)', border:'1px solid '+(seLeft>=2?c.border:'var(--border)'), color:seLeft>=2?c.color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor:seLeft>=2?'pointer':'default' }}>
            + Upload · 2 SE
          </button>
          <button style={{ padding:'8px 14px', borderRadius:20, background:'var(--surface-2)', color:'#fff', fontSize:12, border:'1px solid var(--border)', cursor:'pointer' }}>Analytics</button>
        </div>
        <div style={{ display:'flex', gap:24, borderBottom:'1px solid var(--border)', marginBottom:14 }}>
          {['Latest','Popular','Oldest'].map((t,i) => (
            <div key={t} style={{ padding:'8px 0', fontSize:12, fontWeight:i===1?700:400, color:i===1?'#fff':'var(--text-muted)', borderBottom:i===1?`2px solid ${c.color}`:'2px solid transparent', cursor:'pointer' }}>{t}</div>
          ))}
        </div>
        {releasedTracks.length===0 ? (
          <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" style={{ width:48, height:48, fill:'none', stroke:'var(--text-muted)', strokeWidth:1, margin:'0 auto 12px', display:'block' }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>No content uploaded.</div>
            <div style={{ fontSize:12 }}>Upload a video to grow your channel.</div>
          </div>
        ) : (
          releasedTracks.map((track, idx) => (
            <div key={track.id} style={{ display:'flex', gap:12, marginBottom:16 }}>
              <div style={{ width:120, height:68, background:'var(--surface-2)', borderRadius:8, overflow:'hidden', flexShrink:0, position:'relative' }}>
                {track.coverArt ? <img src={track.coverArt} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <img src={`/assets/covers/${COVER_POOL[(idx+gs.totalWeeks)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />}
                <div style={{ position:'absolute', bottom:3, right:4, background:'rgba(0,0,0,0.85)', borderRadius:3, padding:'1px 4px', fontSize:10, color:'#fff' }}>3:42</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, lineHeight:1.3, marginBottom:4 }}>{track.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(Math.round((track.quality/100)*followers*0.4))} views · Week {track.releaseWeek}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RHYTHMTOK
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='rhythmtok') {
    return (
      <div className="tab-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <button onClick={() => setActivePlatform(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0 }}>
            <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'currentColor', strokeWidth:2 }}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ fontWeight:700, fontSize:14 }}>@{gs.stageName?.toLowerCase()}</div>
          <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill:'none', stroke:'var(--text-muted)', strokeWidth:2 }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </div>

        {/* Profile — avatar + stats side by side, properly aligned */}
        <div style={{ display:'flex', gap:20, alignItems:'center', marginBottom:14 }}>
          <PlayerAvatar gs={gs} size={76} ring={c.color} />
          <div style={{ display:'flex', gap:24, flex:1 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:17 }}>{releasedTracks.length}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Videos</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:17, color:c.color }}>{fmt(followers)}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Followers</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:17 }}>{fmt(Math.round(followers*3.2))}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Likes</div>
            </div>
          </div>
        </div>

        {/* Name + bio */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontWeight:900, fontSize:15 }}>{gs.stageName?.toUpperCase()}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{gs.genre} artist — New music out now</div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button onClick={() => doPost('rhythmtok', 1)} disabled={seLeft<1}
            style={{ flex:1, padding:'9px 0', borderRadius:8, background:seLeft>=1?c.color:'var(--surface-2)', color:seLeft>=1?'#fff':'var(--text-muted)', fontWeight:700, fontSize:13, border:'none', cursor:seLeft>=1?'pointer':'default' }}>
            + Create Video
          </button>
          <button style={{ padding:'9px 14px', borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border)', color:'#fff', cursor:'pointer' }}>
            <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:'currentColor', strokeWidth:2 }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:2 }}>
          {['Videos','Liked','Saved'].map((t,i) => (
            <div key={t} style={{ flex:1, textAlign:'center', padding:'8px 0', fontSize:12, fontWeight:i===0?700:400, color:i===0?'#fff':'var(--text-muted)', borderBottom:i===0?`2px solid ${c.color}`:'2px solid transparent', cursor:'pointer' }}>{t}</div>
          ))}
        </div>

        {followers===0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
            <div style={{ width:64, height:64, background:'var(--surface-2)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg viewBox="0 0 24 24" style={{ width:28, height:28, fill:'none', stroke:'var(--text-muted)', strokeWidth:1.5 }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </div>
            <div style={{ fontWeight:700, marginBottom:6 }}>No videos yet</div>
            <div style={{ fontSize:12 }}>Your RhythmToks appear here once you post.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2, marginTop:2 }}>
            {Array.from({ length:Math.min(9, Math.ceil(followers/100)) }).map((_,i) => (
              <div key={i} style={{ aspectRatio:'9/16', background:'var(--surface-2)', overflow:'hidden', position:'relative' }}>
                <img src={`/assets/covers/${COVER_POOL[(i+gs.totalWeeks)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                <div style={{ position:'absolute', bottom:4, left:4, display:'flex', alignItems:'center', gap:3 }}>
                  <svg viewBox="0 0 24 24" style={{ width:10, height:10, fill:'#fff' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>{fmtStat(rand(Math.round(followers*0.1), Math.round(followers*2)))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WAVELOG
  // ════════════════════════════════════════════════════════════════════════════
  if (activePlatform==='wavelog') {
    return (
      <div className="tab-content">
        <BackBtn onBack={() => setActivePlatform(null)} />

        {/* Profile header */}
        <div style={{ background:c.bg, border:'1px solid '+c.border, borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:14 }}>
            <PlayerAvatar gs={gs} size={56} ring={c.color} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:900, fontSize:16 }}>{gs.stageName?.toUpperCase()}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{gs.genre} · {gs.city}</div>
            </div>
            <button onClick={() => doPost('wavelog', 1)} disabled={seLeft<1}
              style={{ padding:'8px 14px', borderRadius:20, background:seLeft>=1?c.color:'var(--surface-2)', color:seLeft>=1?'#fff':'var(--text-muted)', fontSize:12, fontWeight:700, border:'none', cursor:seLeft>=1?'pointer':'default' }}>
              Share · 1 SE
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center' }}>
            <div><div style={{ fontWeight:700, color:c.color, fontSize:15 }}>{fmt(followers)}</div><div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:1 }}>FOLLOWERS</div></div>
            <div><div style={{ fontWeight:700, color:c.color, fontSize:15 }}>{fmt(gs.totalLifetimeStreams||0)}</div><div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:1 }}>PLAYS</div></div>
            <div><div style={{ fontWeight:700, color:c.color, fontSize:15 }}>{releasedTracks.length}</div><div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:1 }}>TRACKS</div></div>
          </div>
        </div>

        {/* Exclusive preview button */}
        <button onClick={() => doPost('wavelog', 1)} disabled={seLeft<1}
          style={{ width:'100%', padding:'12px 0', marginBottom:16, borderRadius:10, background:seLeft>=1?c.bg:'var(--surface-1)', border:'1px solid '+(seLeft>=1?c.border:'var(--border)'), color:seLeft>=1?c.color:'var(--text-muted)', fontSize:13, fontWeight:700, cursor:seLeft>=1?'pointer':'default' }}>
          {seLeft>=1 ? '🔒 Drop Exclusive Preview · 1 SE' : 'Need SE to drop exclusives'}
        </button>

        {releasedTracks.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:13 }}>No tracks yet — release music to see it here.</div>
          </div>
        ) : (
          <div className="card">
            {releasedTracks.map((track, idx) => (
              <div key={track.id} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                <div style={{ width:42, height:42, borderRadius:6, overflow:'hidden', flexShrink:0, background:'var(--surface-2)' }}>
                  {track.coverArt ? <img src={track.coverArt} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <img src={`/assets/covers/${COVER_POOL[(idx+gs.totalWeeks)%COVER_POOL.length]}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Q{track.quality} · Wk {track.releaseWeek}</div>
                </div>
                <div style={{ textAlign:'right', fontSize:12, color:c.color, fontFamily:'var(--font-mono)', flexShrink:0 }}>
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

  return null;
}
