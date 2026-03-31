import React from 'react';
import useStore from '../../store/gameStore';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  const styles = { success:'border-emerald-500/40 bg-emerald-950/60 text-emerald-300', error:'border-red-500/40 bg-red-950/60 text-red-300', info:'border-violet-500/40 bg-violet-950/60 text-violet-300', warning:'border-yellow-500/40 bg-yellow-950/60 text-yellow-300' };
  const icons  = { success:'✅', error:'❌', info:'💡', warning:'⚠️' };
  const t = toast.type || 'info';
  return (
    <div className="fixed bottom-6 right-5 z-50 slide-up">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl max-w-xs backdrop-blur-sm ${styles[t]}`}>
        <span className="text-lg shrink-0">{icons[t]}</span>
        <p className="text-sm leading-snug">{toast.message}</p>
      </div>
    </div>
  );
}
