import { useState } from 'react';
import { useMagneticHover, useCountUp } from '../hooks/useMagneticHover';
import { fmt } from '../engine/utils';

// Ambient aurora backdrop, tinted per screen.
export const Aurora = ({ c1 = '#7C6CFF', c2 = '#3FD3C6', c3 = '#FF6FA5' }) => (
  <div className="li-aurora" style={{ '--li-blob-1':c1, '--li-blob-2':c2, '--li-blob-3':c3 }} />
);

// Desktop pointer gently pulls the element toward the cursor, springs back on leave.
export const Magnetic = ({ strength=12, className, style, onClick, disabled, children }) => {
  const m = useMagneticHover(strength);
  return (
    <div
      ref={m.ref}
      {...(disabled ? {} : m.handlers)}
      onClick={disabled ? undefined : onClick}
      className={className}
      style={{ ...style, cursor: disabled ? 'default' : (onClick ? 'pointer' : style?.cursor) }}
    >
      {children}
    </div>
  );
};

// Headline number that eases toward its new value instead of snapping.
export const StatNumber = ({ value, format, className, style }) => {
  const fmtFn = format || fmt;
  const ref = useCountUp(value, { format: fmtFn });
  return <span ref={ref} className={className} style={style}>{fmtFn(value)}</span>;
};

// Player avatar with a colored glow ring — used across Home/Create/Business/Profile headers.
export const PlayerAvatar = ({ gs, size = 40, ring = '#7C6CFF' }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'var(--surface-2)', border:`2px solid ${ring}`, boxShadow:`0 0 0 3px ${ring}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
    {gs.avatarUrl
      ? <img src={gs.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      : <span style={{ fontFamily:'var(--li-font-display)', fontWeight:700, fontSize:size*0.38, color:'var(--text-secondary)' }}>{(gs.stageName||'?')[0]}</span>
    }
  </div>
);

// Small pill showing a resource level (energy, SE, etc.) with a fill bar.
export const ResourcePill = ({ label, value, max, color = '#7C6CFF', suffix = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value/max)*100)) : 0;
  return (
    <div className="li-glass" style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>
          <span>{label}</span>
          <span style={{ color, fontWeight:700 }}>{value}{suffix}</span>
        </div>
        <div style={{ height:4, background:'var(--li-glass-border)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:color, borderRadius:2, transition:'width 400ms var(--li-ease-smooth)' }} />
        </div>
      </div>
    </div>
  );
};

// Section eyebrow label — small caps, used to head groups of content.
export const SectionLabel = ({ children, action, onAction }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
    <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', fontWeight:600 }}>{children}</div>
    {action && <div style={{ fontSize:11, color:'var(--li-accent-lt)', cursor:'pointer' }} onClick={onAction}>{action}</div>}
  </div>
);

// Sub-nav pill row — used at the top of every merged tab (Create/Business/Profile).
export const SubNav = ({ items, active, onChange }) => (
  <div className="soc-scroll-x li-glass" style={{ gap:4, padding:4, marginBottom:18, borderRadius:14 }}>
    {items.map(it => (
      <div key={it.id} onClick={() => onChange(it.id)} className="soc-pill"
        style={{ flexShrink:0, padding:'8px 16px', background:active===it.id?'var(--li-accent)':'transparent', color:active===it.id?'#fff':'var(--text-muted)', fontSize:12.5 }}>
        {it.label}
      </div>
    ))}
  </div>
);
