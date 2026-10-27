import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { COVER_GRADIENTS, fmtNum, fmtMoney, createRng, hashString } from '../engine/index.js';

export const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

export const AREA = { home: '#C6FF3D', studio: '#FF6B4A', phone: '#6C7BFF', charts: '#FFB020', world: '#2DD4BF' };
export const DEFAULT_FACE = '/artist.jpg';
export const SAMPLE_COVERS = ['/cover1.jpg', '/cover2.jpg', '/cover3.jpg'];

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zm7 9a7 7 0 0 1-14 0m7 7v2',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 17h2',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 0c2.5-2.5 3.5-5.5 3.5-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3M3.5 9h17m-17 6h17',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  cash: 'M3 6h18v12H3zm9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
  chev: 'm9 6 6 6-6 6',
  back: 'm15 6-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3.5 5.5h.01m7 0h.01M12 12h.01m-3.5 3.5h.01m7 0h.01',
  pen: 'M4 20h4L19 9l-4-4L4 16zm9-13 4 4',
  disc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  send: 'M4 12 20 4l-6 16-3-7z',
  ticket: 'M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3zm11-4v16',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.5-4.5',
  play: 'M7 4v16l13-8z',
  heart: 'M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4',
  chat: 'M4 5h16v11H8l-4 4z',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail: 'M3 5h18v14H3zm0 0 9 8 9-8',
  bank: 'M3 10 12 4l9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18',
  cal: 'M4 5h16v16H4zm0 5h16M9 3v4m6-4v4',
  news: 'M4 4h13v16H6a2 2 0 0 1-2-2zm13 4h3v10a2 2 0 0 1-2 2M8 8h5m-5 4h5m-5 4h3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-3 2-1-2-4-2 1-2-2V4h-4v2L8 7 6 6l-2 4 2 1v2l-2 1 2 4 2-1 2 2v2h4v-2l2-1 2 1 2-4-2-1z',
  video: 'M3 6h13v12H3zm13 4 5-3v10l-5-3z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zm0 1H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v4m-4 3h8',
  briefcase: 'M3 8h18v12H3zm6 0V5h6v3',
  shirt: 'M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z',
  radio: 'M3 9h18v11H3zm4-6 10 6m-1 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 13h5m-5 3h5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 20h16',
  flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8 0 4 3 7 7 7z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  skull: 'M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14zM9 12h.01M15 12h.01M10 20v-2m4 2v-2',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m2 16a6 6 0 0 0-3-5',
  check: 'm5 12 5 5 9-10',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 4h4',
  share: 'M4 12v7h16v-7M12 3v12m-4-8 4-4 4 4',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  reel: 'M4 4h16v16H4zm0 5h16M9 4l3 5m3-5 3 5m-8 3v5l5-2.5z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm3.5-12.5-2 5-5 2 2-5z',
  library: 'M4 4v16m5-16v16m5-14 4 14',
  live: 'M5 8a9 9 0 0 0 0 8m14-8a9 9 0 0 1 0 8M8.5 10a4 4 0 0 0 0 4m7-4a4 4 0 0 1 0 4M12 12h.01',
  gift: 'M4 10h16v10H4zm-1-4h18v4H3zm9 0v14M12 6S10 2 8 3s0 3 4 3m0 0s2-4 4-3 0 3-4 3',
  palette: 'M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8zM7.5 11h.01M10 7h.01M15 7h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
};

export function Icon({ name, size = 22, color = 'currentColor', fill = 'none', stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.sparkle} />
    </svg>
  );
}

export function Mono({ children, className = '', style }) {
  return <div className={`mono ${className}`} style={style}>{children}</div>;
}

export function CountUp({ value, money = false, duration = 900, format }) {
  const [v, setV] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) { setV(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  if (format) return <>{format(v)}</>;
  return <>{money ? fmtMoney(v) : fmtNum(v)}</>;
}

export function CountFrom({ to, money, duration = 1200 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / duration); setV(to * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{money ? fmtMoney(v) : fmtNum(v)}</>;
}

// Generative cover art: style 0 = classic gradient; 1..12 are abstract SVG presets seeded by cover.seed.
export function CoverArt({ cover, size }) {
  const st = cover?.style || 0;
  const g = COVER_GRADIENTS[(cover?.gradient ?? 0) % COVER_GRADIENTS.length];
  const r = createRng((cover?.seed || 1) * 7919 + st * 131 + (cover?.gradient || 0));
  const [a, b] = g;
  const c = cover?.tint || ['#FFFFFF', '#0B0B0F', '#C6FF3D', '#FFB020', '#2DD4BF'][r.int(0, 4)];
  const id = `cv${st}_${cover?.seed || 1}_${cover?.gradient || 0}`;
  const shapes = [];
  const n = (lo, hi) => r.int(lo, hi);
  switch (st) {
    case 1: for (let i = 0; i < 7; i++) { const y = 18 + i * 12; shapes.push(<path key={i} d={`M-5 ${y} Q 25 ${y - n(6, 18)} 50 ${y} T 105 ${y}`} stroke={i % 2 ? c : b} strokeWidth={n(2, 5)} fill="none" opacity=".85" />); } break;
    case 2: for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if (r.chance(0.55)) shapes.push(<rect key={`${x}${y}`} x={x * 17 + 2} y={y * 17 + 2} width="14" height="14" rx={r.chance(0.3) ? 7 : 2} fill={r.chance(0.5) ? c : b} opacity={r.float(0.35, 0.95)} />); break;
    case 3: for (let i = 0; i < 18; i++) { const t = (i / 18) * Math.PI * 2; shapes.push(<path key={i} d={`M50 ${60} L ${50 + Math.cos(t) * 90} ${60 + Math.sin(t) * 90} L ${50 + Math.cos(t + 0.12) * 90} ${60 + Math.sin(t + 0.12) * 90} Z`} fill={i % 2 ? c : b} opacity=".55" />); } shapes.push(<circle key="s" cx="50" cy="60" r={n(12, 22)} fill={c} />); break;
    case 4: { const cx = n(30, 70); const cy = n(30, 70); for (let i = 8; i > 0; i--) shapes.push(<circle key={i} cx={cx} cy={cy} r={i * 7} fill="none" stroke={i % 2 ? c : b} strokeWidth={n(2, 4)} opacity=".8" />); break; }
    case 5: { const ang = n(0, 3) * 45; for (let i = 0; i < 9; i++) shapes.push(<rect key={i} x={-30 + i * 18} y="-30" width={n(4, 10)} height="160" fill={i % 2 ? c : b} opacity=".75" transform={`rotate(${ang} 50 50)`} />); break; }
    case 6: for (let i = 0; i < 5; i++) shapes.push(<ellipse key={i} cx={n(10, 90)} cy={n(10, 90)} rx={n(15, 40)} ry={n(10, 35)} fill={i % 2 ? c : b} opacity={r.float(0.35, 0.75)} />); break;
    case 7: for (let i = 0; i < 16; i++) { const x = n(0, 3) * 25; const y = n(0, 3) * 25; shapes.push(<polygon key={i} points={r.chance(0.5) ? `${x},${y} ${x + 25},${y} ${x},${y + 25}` : `${x + 25},${y} ${x + 25},${y + 25} ${x},${y + 25}`} fill={r.chance(0.5) ? c : b} opacity=".8" />); } break;
    case 8: { const h = n(50, 70); shapes.push(<circle key="sun" cx={n(30, 70)} cy={h - 8} r={n(12, 20)} fill={c} />); for (let i = 0; i < 6; i++) shapes.push(<rect key={i} x="0" y={h + i * 6} width="100" height={3 + i * 0.6} fill={b} opacity={0.9 - i * 0.1} />); shapes.push(<rect key="g" x="0" y={h} width="100" height={100 - h} fill={b} opacity=".35" />); break; }
    case 9: { shapes.push(<circle key="p" cx="50" cy="50" r={n(10, 16)} fill={c} />); for (let i = 1; i < 4; i++) { shapes.push(<ellipse key={`o${i}`} cx="50" cy="50" rx={18 + i * 11} ry={8 + i * 6} fill="none" stroke={c} strokeOpacity=".5" transform={`rotate(${n(-30, 30)} 50 50)`} />); shapes.push(<circle key={`m${i}`} cx={50 + (18 + i * 11) * Math.cos(i)} cy={50 + (8 + i * 6) * Math.sin(i)} r="3" fill={b} />); } break; }
    case 10: for (let i = 0; i < 7; i++) shapes.push(<polygon key={i} points={`${n(0, 100)},${n(0, 100)} ${n(0, 100)},${n(0, 100)} ${n(0, 100)},${n(0, 100)}`} fill={i % 2 ? c : b} opacity={r.float(0.3, 0.7)} />); break;
    case 11: for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) { const d = Math.hypot(x - 4.5, y - 4.5); shapes.push(<circle key={`${x}${y}`} cx={x * 10 + 5} cy={y * 10 + 5} r={Math.max(0.6, 4.6 - d * 0.6)} fill={c} opacity=".85" />); } break;
    case 12: for (let i = 0; i < 10; i++) { const y0 = n(0, 100); shapes.push(<path key={i} d={`M-5 ${y0} C 30 ${y0 + n(-40, 40)}, 70 ${y0 + n(-40, 40)}, 105 ${y0 + n(-20, 20)}`} stroke={i % 2 ? c : b} strokeWidth={r.float(1, 3)} fill="none" opacity=".7" />); } break;
    default: break;
  }
  return (
    <svg className="cover-art" viewBox="0 0 100 100" width={size} height={size} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b === a ? '#000' : st ? '#0B0B0F' : b} /></linearGradient></defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      {shapes}
    </svg>
  );
}

export function Cover({ cover, title, size = 52, radius }) {
  const g = COVER_GRADIENTS[(cover?.gradient ?? 0) % COVER_GRADIENTS.length];
  const style = { width: size, height: size, borderRadius: radius ?? Math.max(6, size * 0.16), background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` };
  return (
    <div className="cover" style={style}>
      {cover?.image ? <img src={cover.image} alt="" /> : cover?.style ? <CoverArt cover={cover} size={size} /> : null}
      {!cover?.image && size >= 44 && title && !cover?.style ? <div className="ct" style={{ fontSize: Math.max(8, size * 0.15) }}>{title}</div> : null}
      {cover?.tint && <i className="cover-tint" style={{ background: `linear-gradient(160deg, ${cover.tint}55, transparent 60%)`, boxShadow: `inset 0 0 0 2px ${cover.tint}88` }} />}
    </div>
  );
}

// Bottom tab bar for phone apps, modelled on each real app's layout (Treblr-branded, no real logos).
export function AppNav({ items, value, onChange, className = '' }) {
  return (
    <nav className={`appnav ${className}`} aria-label="App navigation">
      {items.map((it) => (
        <button key={it.id} className={value === it.id ? 'on' : ''} onClick={() => onChange(it.id)} aria-label={it.label} aria-current={value === it.id ? 'page' : undefined}>
          {it.render ? it.render(value === it.id) : <Icon name={it.icon} size={22} fill={value === it.id && it.fill ? 'currentColor' : 'none'} />}
          {it.text !== false && <span>{it.label}</span>}
          {it.badge > 0 && <i className="badge">{it.badge > 9 ? '9+' : it.badge}</i>}
        </button>
      ))}
    </nav>
  );
}

export function Sheet({ open, onClose, title, sub, children }) {
  if (!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="grab" />
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            {title && <h2>{title}</h2>}
            {sub && <div className="muted small">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </div>
        <div className="mt16">{children}</div>
      </div>
    </div>
  );
}

export function Bar({ pct, color }) {
  return <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, background: color }} /></div>;
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function SectionHead({ title, action, onAction }) {
  return (
    <div className="section-head">
      <h3>{title}</h3>
      {action && <button className="mono" style={{ color: 'var(--accent)' }} onClick={onAction}>{action} ›</button>}
    </div>
  );
}

export function Delta({ v, money }) {
  if (!v) return <span className="faint">—</span>;
  return <span className={v > 0 ? 'up' : 'down'}>{v > 0 ? '▲' : '▼'} {money ? fmtMoney(Math.abs(v)) : fmtNum(Math.abs(v))}</span>;
}

// Read an image file, downscale it to keep saves small, return a JPEG data URL.
export function readImage(file, max = 480) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export function UploadButton({ onImage, children, className = 'btn', max }) {
  const ref = useRef(null);
  return (
    <>
      <button className={className} onClick={() => ref.current?.click()}>{children}</button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) onImage(await readImage(f, max));
        e.target.value = '';
      }} />
    </>
  );
}

export function Empty({ icon = 'sparkle', children }) {
  return <div className="empty"><div style={{ display: 'grid', placeItems: 'center', marginBottom: 8, opacity: 0.6 }}><Icon name={icon} size={28} /></div>{children}</div>;
}

export function facePhoto(player) {
  return player?.photo || DEFAULT_FACE;
}

// ---------- NPC artist artwork ----------
export const GENRE_COLORS = {
  pop: ['#F472B6', '#A78BFA', '#FDE68A'], hiphop: ['#FFB020', '#E11D48', '#111827'], rnb: ['#7C3AED', '#F472B6', '#1E1B4B'],
  rock: ['#E11D48', '#111827', '#F5F5F7'], country: ['#D97706', '#FDE68A', '#78350F'], kpop: ['#38BDF8', '#F472B6', '#C6FF3D'],
  latin: ['#FF6B4A', '#FFB020', '#E11D48'], electronic: ['#2DD4BF', '#6C7BFF', '#0B0B0F'], afrobeats: ['#3DDC84', '#FFB020', '#FF6B4A'],
  indie: ['#A3E635', '#38BDF8', '#F5F5F7'], metal: ['#9CA3AF', '#111827', '#E11D48'], jazz: ['#B45309', '#1E3A8A', '#FDE68A'],
  reggaeton: ['#C6FF3D', '#FF6B4A', '#7C3AED'], alternative: ['#6C7BFF', '#2DD4BF', '#F472B6'],
};

// Unique generative abstract artwork per artist: layered gradient blobs, rings and a waveform. No text.
export function ArtistArt({ name, genres = ['pop'], size = 44, radius }) {
  const h = hashString(name || '?');
  const r = createRng(h);
  const cols = (GENRE_COLORS[genres[0]] || GENRE_COLORS.pop).concat(GENRE_COLORS[genres[1]] || []);
  const id = `aa${h.toString(36)}`;
  const angle = r.int(0, 359);
  const blobs = Array.from({ length: 3 + r.int(0, 2) }, () => ({ cx: r.int(5, 95), cy: r.int(5, 95), rr: r.int(22, 48), c: r.pick(cols) }));
  const motif = r.int(0, 2);
  const amp = r.int(8, 20); const freq = r.int(3, 7); const yMid = r.int(45, 70);
  const wave = Array.from({ length: 21 }, (_, i) => `${i * 5},${(yMid + Math.sin((i / 20) * Math.PI * freq + h) * amp * (0.4 + r.next() * 0.6)).toFixed(1)}`).join(' ');
  return (
    <svg className="artist-art" width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: radius ?? size / 2, flexShrink: 0, display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} gradientTransform={`rotate(${angle} .5 .5)`}><stop offset="0" stopColor={cols[0]} /><stop offset="1" stopColor={cols[2] || '#0B0B0F'} /></linearGradient>
        {blobs.map((b, i) => <radialGradient key={i} id={`${id}b${i}`}><stop offset="0" stopColor={b.c} stopOpacity=".9" /><stop offset="1" stopColor={b.c} stopOpacity="0" /></radialGradient>)}
      </defs>
      <rect width="100" height="100" fill={`url(#${id}g)`} />
      {blobs.map((b, i) => <circle key={i} cx={b.cx} cy={b.cy} r={b.rr} fill={`url(#${id}b${i})`} />)}
      {motif === 0 && <polyline points={wave} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" />}
      {motif === 1 && [18, 28, 38].map((rr) => <circle key={rr} cx={blobs[0].cx} cy={blobs[0].cy} r={rr} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" />)}
      {motif === 2 && Array.from({ length: 9 }, (_, i) => <rect key={i} x={10 + i * 9} y={yMid - (4 + ((h >> i) & 15) * 1.6)} width="4" height={8 + ((h >> i) & 15) * 3.2} rx="2" fill="#fff" fillOpacity=".7" />)}
    </svg>
  );
}

// Player-set photo (artistPhotos) wins over generative art.
export function ArtistAvatar({ rival, size = 44, radius, onClick }) {
  const g = useContext(GameCtx);
  const photo = rival && g?.state?.artistPhotos?.[rival.id];
  const r = radius ?? size / 2;
  const inner = photo
    ? <img src={photo} alt="" style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
    : <ArtistArt name={rival?.name || '?'} genres={rival?.genres || [rival?.genre || 'pop']} size={size} radius={r} />;
  if (!onClick) return inner;
  return <button className="press" onClick={onClick} aria-label={`Open ${rival?.name}`} style={{ borderRadius: r, flexShrink: 0 }}>{inner}</button>;
}

export function tint(cover, era) {
  return era ? { ...cover, tint: era.color } : cover;
}
