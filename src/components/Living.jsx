import { useMagneticHover, useCountUp } from '../hooks/useMagneticHover';
import { fmt } from '../engine/utils';

// Ambient aurora backdrop, tinted per screen.
export const Aurora = ({ c1 = '#7C6CFF', c2 = '#3FD3C6', c3 = '#FF6FA5' }) => (
  <div className="li-aurora" style={{ '--li-blob-1':c1, '--li-blob-2':c2, '--li-blob-3':c3 }} aria-hidden="true" />
);

// Native buttons retain pointer effects while gaining keyboard and screen-reader support.
export const Magnetic = ({ strength=12, className, style, onClick, disabled, children, type='button', ariaLabel, ariaPressed }) => {
  const magnetic = useMagneticHover(strength);
  return (
    <button
      ref={magnetic.ref}
      type={type}
      {...(disabled ? {} : magnetic.handlers)}
      onClick={disabled ? undefined : onClick}
      disabled={!!disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={className}
      style={{ appearance:'none', font:'inherit', color:'inherit', textAlign:'inherit', ...style, cursor:disabled ? 'default' : (onClick ? 'pointer' : style?.cursor) }}
    >
      {children}
    </button>
  );
};

export const StatNumber = ({ value, format, className, style }) => {
  const fmtFn = format || fmt;
  const ref = useCountUp(value, { format: fmtFn });
  return <span ref={ref} className={className} style={style}>{fmtFn(value)}</span>;
};

export const PlayerAvatar = ({ gs, size = 40, ring = '#7C6CFF' }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'var(--surface-2)', border:`2px solid ${ring}`, boxShadow:`0 0 0 3px ${ring}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
    {gs.avatarUrl
      ? <img src={gs.avatarUrl} alt={`${gs.stageName || 'Artist'} avatar`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      : <span aria-hidden="true" style={{ fontFamily:'var(--li-font-display)', fontWeight:700, fontSize:size*0.38, color:'var(--text-secondary)' }}>{(gs.stageName||'?')[0]}</span>
    }
  </div>
);

export const ResourcePill = ({ label, value, max, color = '#7C6CFF', suffix = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value/max)*100)) : 0;
  return (
    <div className="li-glass" role="group" aria-label={`${label}: ${value} of ${max}`} style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>
          <span>{label}</span>
          <span style={{ color, fontWeight:700 }}>{value}{suffix}</span>
        </div>
        <div role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax={max} aria-valuenow={value} style={{ height:4, background:'var(--li-glass-border)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:color, borderRadius:2, transition:'width 400ms var(--li-ease-smooth)' }} />
        </div>
      </div>
    </div>
  );
};

export const SectionLabel = ({ children, action, onAction }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
    <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', fontWeight:600 }}>{children}</div>
    {action && (onAction
      ? <button type="button" onClick={onAction} style={{ appearance:'none', border:0, background:'none', padding:'4px 0', font:'inherit', fontSize:11, color:'var(--li-accent-lt)', cursor:'pointer' }}>{action}</button>
      : <span style={{ fontSize:11, color:'var(--li-accent-lt)' }}>{action}</span>)}
  </div>
);

export const SubNav = ({ items, active, onChange }) => (
  <div className="soc-scroll-x li-glass" role="tablist" aria-label="Section navigation" style={{ gap:4, padding:4, marginBottom:18, borderRadius:14 }}>
    {items.map((item) => (
      <button key={item.id} type="button" role="tab" aria-selected={active===item.id} onClick={() => onChange(item.id)} className="soc-pill"
        style={{ flexShrink:0, padding:'8px 16px', background:active===item.id?'var(--li-accent)':'transparent', color:active===item.id?'#fff':'var(--text-muted)', fontSize:12.5 }}>
        {item.label}
      </button>
    ))}
  </div>
);
