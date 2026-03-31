import React, { useState, useEffect } from 'react';
import useStore from '../../store/gameStore';

const f = n => { if(!n&&n!==0)return'—'; if(n>=1e6)return(n/1e6).toFixed(1)+'M'; if(n>=1000)return(n/1000).toFixed(1)+'K'; return Math.round(n).toLocaleString(); };

// ══════════════════════════════════════════════════════════════════════════════
// ACTIONS PANEL
// ══════════════════════════════════════════════════════════════════════════════

const ACTIONS = [
  { id:'writeSong',    icon:'✍️',  label:'Write a Song',         desc:'Craft a new track. Songwriting skill determines quality.',    tip:'Boosts Songwriting',    cat:'create',  grad:'from-violet-600 to-indigo-600' },
  { id:'recordSong',   icon:'🎙️', label:'Record a Song',         desc:'Take a draft to the studio. Production shapes the result.',   tip:'Needs a draft song',    cat:'create',  grad:'from-blue-600 to-cyan-600' },
  { id:'releaseSingle',icon:'🚀',  label:'Release a Single',      desc:'Drop a recorded track on all platforms. Buzz spikes.',        tip:'Needs recorded song',   cat:'create',  grad:'from-green-600 to-emerald-600' },
  { id:'promote',      icon:'📢',  label:'Promo Campaign',        desc:'Push ad spend to boost your latest release streams.',       tip:'Costs money',           cat:'market',  grad:'from-orange-600 to-red-600' },
  { id:'socialMedia',  icon:'📱',  label:'Post on Social',        desc:'Build your online presence. Charisma drives engagement.',     tip:'Gains followers + buzz',cat:'market',  grad:'from-pink-600 to-rose-600' },
  { id:'collaborate',  icon:'🤝',  label:'Collaborate',           desc:'Co-write with an NPC artist. Merges fanbases.',               tip:'Needs a draft song',    cat:'market',  grad:'from-yellow-600 to-amber-600' },
  { id:'concert',      icon:'🎤',  label:'Play a Concert',        desc:'Live performance for fans. Revenue + fanbase growth.',        tip:'Charisma affects crowd',cat:'perform', grad:'from-violet-700 to-purple-600' },
  { id:'tour',         icon:'🎪',  label:'Go on Tour',            desc:'Multi-city run. Biggest fanbase + revenue boost.',            tip:'Needs 1,000+ fans',     cat:'perform', grad:'from-teal-600 to-cyan-600' },
  { id:'practice',     icon:'🎸',  label:'Practice Skills',       desc:'Dedicate the week to craft. Random attribute boost.',         tip:'Boosts a random skill', cat:'grow',    grad:'from-slate-600 to-gray-600' },
];

const CATS = [{ id:'all',label:'All' },{ id:'create',label:'🎵 Create' },{ id:'market',label:'📢 Market' },{ id:'perform',label:'🎤 Perform' },{ id:'grow',label:'🌱 Grow' }];

export function ActionsPanel() {
  const { user, doAction } = useStore();
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [cat, setCat] = useState('all');
  if (!user) return null;

  const { actionsThisWeek, maxActionsPerWeek } = user.gameState;
  const left = maxActionsPerWeek - actionsThisWeek;
  const out  = left <= 0;

  const handle = async (id) => {
    if (out || loading) return;
    setLoading(id); setResult(null);
    const r = await doAction(id).catch(() => null);
    setResult(r); setLoading(null);
  };

  const filtered = cat === 'all' ? ACTIONS : ACTIONS.filter(a => a.cat === cat);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-t-text">Weekly Actions</h2>
          <p className="text-t-muted text-sm mt-0.5">Choose up to {maxActionsPerWeek} actions per week.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({length:maxActionsPerWeek}).map((_,i)=>(
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i<actionsThisWeek?'bg-t-muted border-t-muted':'bg-t-accent border-t-accent shadow-[0_0_8px_#8b5cf660]'}`} />
          ))}
          <span className="ml-2 text-sm font-mono text-t-text">{left} left</span>
        </div>
      </div>

      {result && (
        <div className={`card p-4 border-l-4 slide-up ${result.success?'border-t-green':'border-t-red'}`}>
          <p className={`text-sm font-medium ${result.success?'text-emerald-400':'text-red-400'}`}>{result.message}</p>
          {result.success && (
            <div className="flex flex-wrap gap-3 mt-2">
              {result.buzzGain    && <Tag c="text-yellow-400">+{result.buzzGain} Buzz</Tag>}
              {result.fanGain     && <Tag c="text-green-400">+{f(result.fanGain)} Fans</Tag>}
              {result.followerGain&& <Tag c="text-pink-400">+{f(result.followerGain)} Followers</Tag>}
              {result.skillGain   && Object.entries(result.skillGain).map(([k,v])=><Tag key={k} c="text-violet-400">+{v} {k}</Tag>)}
              {result.netRevenue  && <Tag c="text-blue-400">${f(result.netRevenue)} net</Tag>}
              {result.cost        && <Tag c="text-red-400">-${f(result.cost)}</Tag>}
            </div>
          )}
        </div>
      )}

      {out && (
        <div className="card p-4 border border-yellow-500/25 bg-yellow-950/20 text-center">
          <p className="text-yellow-400 font-medium">⏰ All actions used this week.</p>
          <p className="text-t-muted text-sm mt-1">Tap <strong className="text-t-text">Next Week</strong> in the top bar to continue.</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {CATS.map(c => (
          <button key={c.id} onClick={()=>setCat(c.id)}
            className={`px-3 py-1.5 rounded-xl text-sm transition-all ${cat===c.id?'bg-t-accent text-white':'bg-t-card border border-t-border text-t-muted hover:text-t-text'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => {
          const warns = [];
          if (a.id==='recordSong' && !user.gameState.pendingSongsCount) warns.push('No drafts');
          if (a.id==='releaseSingle' && !user.gameState.recordedSongsCount) warns.push('No recorded songs');
          if (a.id==='tour' && user.career.fanbase < 1000) warns.push(`Need ${f(1000-user.career.fanbase)} more fans`);
          const blocked = warns.length > 0;

          return (
            <button key={a.id} onClick={()=>!blocked&&handle(a.id)} disabled={out||loading===a.id||blocked}
              className={`card p-5 text-left transition-all duration-200 group ${out||blocked?'opacity-50 cursor-not-allowed':'hover:border-t-accent/40 hover:scale-[1.01] cursor-pointer'}`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {loading===a.id?<span className="animate-spin text-base">⏳</span>:a.icon}
              </div>
              <h3 className="font-display font-bold text-t-text mb-1">{a.label}</h3>
              <p className="text-sm text-t-muted mb-3 leading-relaxed">{a.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-violet-400">{a.tip}</span>
                {warns.map((w,i)=><span key={i} className="text-xs text-red-400">{w}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ c, children }) { return <span className={`text-xs font-mono font-medium ${c}`}>{children}</span>; }

// ══════════════════════════════════════════════════════════════════════════════
// STUDIO PANEL
// ══════════════════════════════════════════════════════════════════════════════

export function StudioPanel() {
  const { songs, draftSongs, recordedSongs } = useStore();
  const sections = [
    { title:'✍️ Drafts',    items:draftSongs,   empty:'No drafts — write a song in the Actions panel.' },
    { title:'🎙️ Recorded',  items:recordedSongs, empty:'No recorded songs. Record a draft first.' },
    { title:'🚀 Released',  items:songs,         empty:'No releases yet. Release a recorded song!' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-black text-t-text">Studio</h2>
        <p className="text-t-muted text-sm mt-1">Your music pipeline: Draft → Recorded → Released.</p>
      </div>
      {sections.map(({ title, items, empty }) => (
        <div key={title}>
          <h3 className="font-display font-semibold text-t-dim mb-3 flex items-center gap-2">
            {title} <span className="badge bg-t-border text-t-muted text-xs">{items.length}</span>
          </h3>
          {items.length === 0
            ? <div className="card p-6 text-center text-t-muted text-sm">{empty}</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(s=><SongCard key={s._id} song={s}/>)}</div>
          }
        </div>
      ))}
    </div>
  );
}

function QBar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1"><span className="text-xs text-t-muted">{label}</span><span className="text-xs font-mono text-t-text">{val}</span></div>
      <div className="h-1.5 bg-t-border rounded-full overflow-hidden"><div className="h-full rounded-full bar" style={{width:`${val}%`,backgroundColor:color}}/></div>
    </div>
  );
}

function SongCard({ song }) {
  const sc = song.quality?.overallScore||0;
  const col = sc>=75?'#34d399':sc>=55?'#fbbf24':'#f87171';
  const badges = { draft:'bg-gray-700/50 text-gray-300', recorded:'bg-blue-900/40 text-blue-300', released:'bg-green-900/40 text-green-300' };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div><p className="font-semibold text-t-text text-sm">{song.title}</p><p className="text-xs text-t-muted mt-0.5">{song.genre}</p></div>
        <div className="flex gap-1.5 items-center">
          <span className={`badge text-xs ${badges[song.status]||badges.draft}`}>{song.status}</span>
          <span className="text-xs font-mono font-bold" style={{color:col}}>{sc}</span>
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <QBar label="Catchiness"  val={song.quality?.catchiness||0}  color="#fbbf24"/>
        <QBar label="Lyrics"      val={song.quality?.lyrics||0}       color="#60a5fa"/>
        <QBar label="Production"  val={song.quality?.production||0}   color="#a78bfa"/>
        <QBar label="Replay"      val={song.quality?.replayValue||0}  color="#34d399"/>
      </div>
      {song.status==='released' && (
        <div className="border-t border-t-border pt-3 grid grid-cols-2 gap-2">
          <div><p className="text-xs text-t-muted">Weekly</p><p className="text-sm font-mono font-bold text-t-text">{f(song.streaming?.weeklyStreams)}</p></div>
          <div><p className="text-xs text-t-muted">Total</p><p className="text-sm font-mono font-bold text-t-text">{f(song.streaming?.totalStreams)}</p></div>
        </div>
      )}
      {song.features?.length>0 && <p className="text-xs text-violet-400 mt-2">ft. {song.features.map(x=>x.artistName).join(', ')}</p>}
      {song.certification && <span className="badge bg-yellow-900/30 text-yellow-400 border border-yellow-500/25 mt-2 inline-block">💿 {song.certification}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHARTS PANEL
// ══════════════════════════════════════════════════════════════════════════════

export function ChartsPanel() {
  const { chart, loadChart, user } = useStore();
  useEffect(() => { loadChart(); }, []);
  const entries  = chart?.entries||[];
  const myTracks = entries.filter(e=>e.artistId?.toString()===user?._id?.toString());

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-black text-t-text">Global Charts</h2>
        <p className="text-t-muted text-sm mt-1">Top 100 by weekly streams — Week {user?.gameState?.currentWeek}, Year {user?.gameState?.currentYear}</p>
      </div>

      {myTracks.length>0 && (
        <div className="card p-4 border border-violet-500/25 bg-violet-950/10">
          <p className="label mb-3">Your Charting Songs</p>
          <div className="space-y-2">
            {myTracks.map(e=>(
              <div key={e.songId} className="flex items-center gap-3">
                <span className="text-lg font-display font-black text-violet-300 w-8">#{e.position}</span>
                <div className="flex-1"><p className="text-sm font-medium text-t-text">{e.songTitle}</p><p className="text-xs text-t-muted">{f(e.weeklyStreams)} streams/wk</p></div>
                <PosChg change={e.positionChange} isNew={e.isNew}/>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-t-border bg-t-surface">
          <div className="col-span-1 label">#</div>
          <div className="col-span-1 label">Δ</div>
          <div className="col-span-5 label">Song</div>
          <div className="col-span-3 label">Artist</div>
          <div className="col-span-2 label text-right">Streams</div>
        </div>
        {entries.length===0
          ? <div className="p-10 text-center text-t-muted">Chart is being compiled. Advance a week to see results.</div>
          : <div className="divide-y divide-t-border/40">
              {entries.map((e,i)=>{
                const isMe = e.artistId?.toString()===user?._id?.toString();
                return (
                  <div key={e.songId} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-t-border/20 transition-colors ${isMe?'bg-violet-950/10 border-l-2 border-l-t-accent':''}`}>
                    <div className="col-span-1 text-sm font-mono font-bold">{i<3?['🥇','🥈','🥉'][i]:<span className={i<10?'text-t-text':'text-t-muted'}>{e.position}</span>}</div>
                    <div className="col-span-1"><PosChg change={e.positionChange} isNew={e.isNew}/></div>
                    <div className="col-span-5 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe?'text-violet-300':'text-t-text'}`}>{e.songTitle}</p>
                      {e.isHot && <span className="text-xs text-orange-400">🔥</span>}
                      {e.isNew && <span className="text-xs text-yellow-400 ml-1">NEW</span>}
                    </div>
                    <div className="col-span-3 min-w-0"><p className="text-sm text-t-dim truncate">{e.artistName}</p></div>
                    <div className="col-span-2 text-right"><p className="text-sm font-mono text-t-text">{f(e.weeklyStreams)}</p></div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

function PosChg({ change, isNew }) {
  if (isNew) return <span className="text-xs font-mono text-yellow-400 font-bold">NEW</span>;
  if (change>0) return <span className="text-xs font-mono text-green-400">▲{change}</span>;
  if (change<0) return <span className="text-xs font-mono text-red-400">▼{Math.abs(change)}</span>;
  return <span className="text-xs text-t-muted">—</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL PANEL
// ══════════════════════════════════════════════════════════════════════════════

export function SocialPanel() {
  const { user } = useStore();
  if (!user) return null;
  const { social } = user;
  const total = (social.instagram||0)+(social.tiktok||0)+(social.twitter||0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-black text-t-text">Social Media</h2>
        <p className="text-t-muted text-sm mt-1">Your digital footprint across platforms.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id:'instagram', label:'Instagram', icon:'📸', val:social.instagram, color:'#e1306c', desc:'Visual storytelling & reels' },
          { id:'tiktok',    label:'TikTok',    icon:'🎵', val:social.tiktok,    color:'#69c9d0', desc:'Short-form viral videos' },
          { id:'twitter',   label:'Twitter/X', icon:'🐦', val:social.twitter,   color:'#1d9bf0', desc:'Real-time fan interaction' }
        ].map(p=>(
          <div key={p.id} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{p.icon}</span>
              <div><p className="font-display font-bold text-t-text">{p.label}</p><p className="text-xs text-t-muted">{p.desc}</p></div>
            </div>
            <p className="text-3xl font-mono font-black" style={{color:p.color}}>{f(p.val)}</p>
            <p className="text-xs text-t-muted mt-1">followers</p>
          </div>
        ))}
      </div>
      <div className="card p-5">
        <p className="label mb-2">Total Reach</p>
        <p className="text-4xl font-mono font-black text-t-accent">{f(total)}</p>
        <p className="text-t-muted text-sm mt-2">combined followers</p>
        <p className="text-t-muted text-sm mt-4">Use <span className="text-t-text font-medium">Post on Social</span> in Actions to grow your following each week.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS PANEL
// ══════════════════════════════════════════════════════════════════════════════

export function EventsPanel() {
  const { events, chooseEvent } = useStore();
  const sev = {
    very_positive:'border-green-500/35 bg-green-950/15',
    positive:'border-blue-500/25 bg-blue-950/10',
    neutral:'border-t-border',
    negative:'border-red-500/25 bg-red-950/10',
    very_negative:'border-red-600/45 bg-red-950/20'
  };
  const sevIcon = { very_positive:'🟢', positive:'🔵', neutral:'⚪', negative:'🔴', very_negative:'🔴' };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-black text-t-text">Events Feed</h2>
        <p className="text-t-muted text-sm mt-1">Random events shape your career. Some require a decision.</p>
      </div>
      {events.length===0
        ? <div className="card p-12 text-center"><p className="text-4xl mb-3">📰</p><p className="text-t-muted">No events yet. Advance weeks to generate them.</p></div>
        : <div className="space-y-4">
            {events.map(ev=>(
              <div key={ev._id} className={`card p-5 border ${sev[ev.severity]||sev.neutral}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5 shrink-0">{sevIcon[ev.severity]||'⚪'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold text-t-text">{ev.title}</h3>
                      <span className="text-xs text-t-muted font-mono">Wk {ev.week} Y{ev.year}</span>
                    </div>
                    <p className="text-sm text-t-dim mb-3">{ev.description}</p>
                    {/* Effects */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ev.effects?.fanbase!==0&&ev.effects?.fanbase&&<EvTag v={ev.effects.fanbase} label="Fans"/>}
                      {ev.effects?.buzz!==0&&ev.effects?.buzz&&<EvTag v={ev.effects.buzz} label="Buzz"/>}
                      {ev.effects?.reputation!==0&&ev.effects?.reputation&&<EvTag v={ev.effects.reputation} label="Rep"/>}
                      {ev.effects?.money!==0&&ev.effects?.money&&<EvTag v={ev.effects.money} label="$" money/>}
                    </div>
                    {/* Choices */}
                    {ev.requiresChoice && !ev.choiceMade && (
                      <div className="space-y-2 mt-3">
                        <p className="label">Choose your response:</p>
                        {ev.choices.map(c=>(
                          <button key={c.id} onClick={()=>chooseEvent(ev._id, c.id)}
                            className="w-full text-left p-3 rounded-xl bg-t-surface border border-t-border hover:border-t-accent/40 transition-colors">
                            <p className="text-sm font-medium text-t-text">{c.text}</p>
                            <p className="text-xs text-t-muted mt-0.5">{c.consequence}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {ev.choiceMade && <span className="badge bg-t-border text-t-muted text-xs mt-2 inline-block">Responded ✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

function EvTag({ v, label, money }) {
  const pos = v>0;
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${pos?'bg-green-900/30 text-green-400':'bg-red-900/30 text-red-400'}`}>{pos?'+':''}{money?'$':''}{Math.abs(v)>=1000?f(v):v} {label}</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD PANEL
// ══════════════════════════════════════════════════════════════════════════════

export function LeaderboardPanel() {
  const { leaderboard, user, loadLeaderboard } = useStore();
  useEffect(() => { loadLeaderboard(); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-black text-t-text">Artist Leaderboard</h2>
        <p className="text-t-muted text-sm mt-1">Top artists ranked by fanbase size.</p>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-t-border bg-t-surface">
          <div className="col-span-1 label">#</div>
          <div className="col-span-5 label">Artist</div>
          <div className="col-span-2 label">Genre</div>
          <div className="col-span-2 label">Fans</div>
          <div className="col-span-2 label">Streams/wk</div>
        </div>
        {leaderboard.length===0
          ? <div className="p-8 text-center text-t-muted">Loading...</div>
          : <div className="divide-y divide-t-border/40">
              {leaderboard.map((a,i)=>{
                const isMe = a.id?.toString()===user?._id?.toString();
                return (
                  <div key={a.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-t-border/20 transition-colors ${isMe?'bg-violet-950/10 border-l-2 border-l-t-accent':''}`}>
                    <div className="col-span-1 text-sm font-mono font-bold">{i<3?['🥇','🥈','🥉'][i]:<span className="text-t-muted">{i+1}</span>}</div>
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0" style={{backgroundColor:a.avatarColor||'#8b5cf6'}}>{a.name?.[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe?'text-violet-300':'text-t-text'}`}>{a.name}</p>
                        {isMe&&<span className="text-xs text-t-accent">You</span>}
                        {a.isPlayer&&!isMe&&<span className="text-xs text-t-muted">Player</span>}
                      </div>
                    </div>
                    <div className="col-span-2"><span className="badge bg-t-border text-t-muted text-xs">{a.genre}</span></div>
                    <div className="col-span-2"><span className="text-sm font-mono text-t-text">{f(a.fanbase)}</span></div>
                    <div className="col-span-2"><span className="text-sm font-mono text-t-dim">{f(a.weeklyStreams)}</span></div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}
