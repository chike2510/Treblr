// Sidebar.jsx
import React from 'react';
import useStore from '../../store/gameStore';

const NAV = [
  { id:'dashboard',   icon:'🏠', label:'Dashboard'   },
  { id:'actions',     icon:'⚡', label:'Actions'      },
  { id:'studio',      icon:'🎙️', label:'Studio'       },
  { id:'charts',      icon:'📊', label:'Charts'       },
  { id:'social',      icon:'📱', label:'Social'       },
  { id:'events',      icon:'📰', label:'Events'       },
  { id:'leaderboard', icon:'🏆', label:'Leaderboard'  },
];

export default function Sidebar() {
  const { panel, setPanel, user, logout, events } = useStore();
  const unread = events?.filter(e => !e.isRead).length || 0;

  return (
    <aside className="w-52 bg-t-surface border-r border-t-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-t-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎵</span>
          <span className="text-xl font-display font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Treblr</span>
        </div>
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                 style={{ backgroundColor: user.avatarColor }}>
              {user.artistName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-t-text truncate">{user.artistName}</p>
              <p className="text-xs text-t-muted">{user.career?.level}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <button key={item.id} onClick={() => setPanel(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
              panel === item.id
                ? 'bg-t-accent/15 text-violet-300 border border-t-accent/25'
                : 'text-t-dim hover:bg-t-border hover:text-t-text'
            }`}>
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'events' && unread > 0 && (
              <span className="ml-auto bg-t-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
                {unread}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-t-border">
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-t-muted hover:text-red-400 hover:bg-red-950/30 transition-all">
          <span>🚪</span><span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
