import React from 'react';
import useStore from '../../store/gameStore';

const f = n => { if (!n && n!==0) return '—'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toLocaleString(); };

export default function TopBar() {
  const { user, nextWeek, isAdvancing } = useStore();
  if (!user) return null;
  const { currentWeek, currentYear, actionsThisWeek, maxActionsPerWeek } = user.gameState;
  const left = maxActionsPerWeek - actionsThisWeek;

  return (
    <header className="bg-t-surface border-b border-t-border px-5 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-5">
        {/* Week */}
        <div className="font-mono text-sm">
          <span className="text-t-text font-semibold">Wk {currentWeek}</span>
          <span className="text-t-muted mx-1">·</span>
          <span className="text-t-muted">Yr {currentYear}</span>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxActionsPerWeek }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < actionsThisWeek ? 'bg-t-border' : 'bg-t-accent shadow-[0_0_6px_#8b5cf680]'}`} />
          ))}
          <span className="text-xs text-t-muted ml-1 font-mono">{left} left</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-5">
        <Stat icon="👥" val={f(user.career?.fanbase)} />
        <Stat icon="⚡" val={`${~~(user.career?.buzz||0)}%`} />
        <Stat icon="💰" val={`$${f(user.career?.money)}`} />
        <Stat icon="🎧" val={`${f(user.career?.weeklyStreams)}/wk`} />
      </div>

      <button onClick={nextWeek} disabled={isAdvancing} className="btn-pri flex items-center gap-2 text-sm">
        {isAdvancing ? <><span className="animate-spin inline-block">⏳</span> Advancing...</> : <>⏭️ Next Week</>}
      </button>
    </header>
  );
}

function Stat({ icon, val }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span>{icon}</span>
      <span className="font-mono text-t-dim">{val}</span>
    </div>
  );
}
