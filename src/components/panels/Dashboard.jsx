import React from 'react';
import useStore from '../../store/gameStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const f = n => { if (!n&&n!==0) return '—'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toLocaleString(); };

const LEVELS = ['Unsigned','Indie','Rising','Mid-Tier','Mainstream','Superstar','Legend'];
const NEXT_FAN = { Unsigned:1000, Indie:10000, Rising:50000, 'Mid-Tier':200000, Mainstream:1000000, Superstar:10000000, Legend:null };

export default function Dashboard() {
  const { user, songs } = useStore();
  if (!user) return null;
  const { career, attributes, social, gameState } = user;

  const attrData = [
    { s:'Writing', v:attributes.songwriting },
    { s:'Vocals',  v:attributes.vocals },
    { s:'Prod',    v:attributes.production },
    { s:'Charisma',v:attributes.charisma },
    { s:'Ethic',   v:attributes.workEthic }
  ];

  const nextFans = NEXT_FAN[career.level];
  const lvlPct   = nextFans ? Math.min(100, (career.fanbase / nextFans) * 100) : 100;
  const nextLvl  = LEVELS[LEVELS.indexOf(career.level) + 1] || null;

  return (
    <div className="space-y-5">
      {/* Artist header */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl shrink-0"
             style={{ backgroundColor: user.avatarColor }}>
          {user.artistName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-black text-t-text">{user.artistName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="badge bg-violet-900/40 text-violet-300 border border-violet-500/30">{career.level}</span>
            <span className="text-t-muted text-sm">{user.genre}</span>
            <span className="text-t-muted text-sm">·</span>
            <span className="text-t-muted text-sm font-mono">Wk {gameState.currentWeek} Yr {gameState.currentYear}</span>
          </div>
          {/* Level progress */}
          {nextLvl && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-t-muted mb-1">
                <span>{f(career.fanbase)} fans</span>
                <span>{f(nextFans)} for {nextLvl}</span>
              </div>
              <div className="h-1.5 bg-t-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bar bg-gradient-to-r from-violet-500 to-pink-500" style={{ width:`${lvlPct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Career metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetCard icon="👥" label="Fanbase"    val={f(career.fanbase)}                color="#8b5cf6" pct={lvlPct} />
        <MetCard icon="⚡" label="Buzz"       val={`${~~career.buzz}%`}              color="#fbbf24" pct={career.buzz} />
        <MetCard icon="⭐" label="Reputation" val={`${~~career.reputation}`}          color="#60a5fa" pct={career.reputation} />
        <MetCard icon="💰" label="Money"      val={`$${f(career.money)}`}            color="#34d399" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-t-text mb-4">Attributes</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={attrData}>
                <PolarGrid stroke="#1c2535" />
                <PolarAngleAxis dataKey="s" tick={{ fill:'#64748b', fontSize:11, fontFamily:'Outfit' }} />
                <Radar dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {attrData.map(a => (
              <div key={a.s} className="text-center">
                <p className="text-sm font-bold font-mono text-t-text">{a.v}</p>
                <p className="text-xs text-t-muted">{a.s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social + Discography */}
        <div className="space-y-3">
          <div className="card p-4">
            <h3 className="font-display font-bold text-t-text mb-3">Social</h3>
            <div className="space-y-2.5">
              <SocRow icon="📸" name="Instagram" val={f(social.instagram)} color="#e1306c" />
              <SocRow icon="🎵" name="TikTok"    val={f(social.tiktok)}    color="#69c9d0" />
              <SocRow icon="🐦" name="Twitter"   val={f(social.twitter)}   color="#1d9bf0" />
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-display font-bold text-t-text mb-3">Discography</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox val={songs.length}                   label="Released" />
              <StatBox val={gameState.recordedSongsCount||0} label="Recorded" />
              <StatBox val={gameState.pendingSongsCount||0}  label="Drafts"   />
            </div>
          </div>
        </div>
      </div>

      {/* Songs */}
      {songs.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-t-text mb-4">Latest Releases</h3>
          <div className="space-y-2">
            {songs.slice(0,6).map(s => <SongRow key={s._id} song={s} />)}
          </div>
        </div>
      )}

      {/* Achievements */}
      {user.achievements?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-t-text mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {user.achievements.map(a => (
              <span key={a.id} className="badge bg-yellow-900/30 text-yellow-400 border border-yellow-500/25 px-3 py-1 text-xs">
                🏅 {a.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetCard({ icon, label, val, color, pct }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="label">{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-t-text">{val}</p>
      {pct !== undefined && (
        <div className="mt-3 h-1 bg-t-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bar" style={{ width:`${Math.min(100,pct)}%`, backgroundColor:color }} />
        </div>
      )}
    </div>
  );
}

function SocRow({ icon, name, val, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><span>{icon}</span><span className="text-sm text-t-dim">{name}</span></div>
      <span className="font-mono text-sm font-bold" style={{ color }}>{val}</span>
    </div>
  );
}

function StatBox({ val, label }) {
  return (
    <div>
      <p className="text-2xl font-bold font-mono text-t-text">{val}</p>
      <p className="text-xs text-t-muted">{label}</p>
    </div>
  );
}

function SongRow({ song }) {
  const sc = song.quality?.overallScore || 0;
  const col = sc>=75?'#34d399':sc>=50?'#fbbf24':'#f87171';
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-t-border/40 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-t-border flex items-center justify-center text-sm shrink-0">🎵</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-t-text truncate">{song.title}</p>
        <p className="text-xs text-t-muted">{song.genre}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-mono text-t-dim">{f(song.streaming?.weeklyStreams)}/wk</p>
        <p className="text-xs font-mono font-bold" style={{ color:col }}>{sc}/100</p>
      </div>
      {song.certification && <span className="badge bg-yellow-900/30 text-yellow-400 border border-yellow-500/25 text-xs">{song.certification}</span>}
    </div>
  );
}
