import { useEffect, useRef, useState } from 'react';
import { CITIES, GENRES, CAREER_PATHS, createNewGame, cityById, genreName, fmtMoney, fmtNum } from '../engine/index.js';
import { loadRosterPack } from '../phone/roster.jsx';
import { Icon, UploadButton, DEFAULT_FACE } from '../ui/kit.jsx';

// "Cover Story" onboarding: the player builds their debut magazine cover live.
// Top: the cover preview. Bottom: the editor's desk asks one thing at a time.

export const GENRE_COLORWAYS = {
  pop: ['#FF5FA2', '#7B2CFF'],
  hiphop: ['#FFB020', '#1A1A1A'],
  rnb: ['#B04AFF', '#2B0F3D'],
  rock: ['#FF4D5E', '#141414'],
  country: ['#E8A44A', '#5A2E12'],
  kpop: ['#7DF9FF', '#FF4FD8'],
  latin: ['#FF6B4A', '#FFD23F'],
  electronic: ['#2DD4BF', '#1E1B6B'],
  afrobeats: ['#3DDC84', '#F5A623'],
  indie: ['#C6FF3D', '#2E4A3A'],
  metal: ['#9CA3AF', '#050505'],
  jazz: ['#D4A373', '#1C2541'],
  reggaeton: ['#FFE14D', '#E4006D'],
  alternative: ['#6C7BFF', '#FF6B4A'],
};
const NEUTRAL = ['#3A3A46', '#0B0B0F'];

export const STRAPLINES = {
  bedroom: 'The bedroom artist nobody saw coming',
  viral: 'One clip. Millions of views. Now what?',
  signed: 'The rookie a label just bet on',
  songwriter: "You've sung their hits. Meet the pen behind them",
  plant: 'Overnight sensation — or something more expensive?',
};

const DESK = [
  { id: 'stage', prompt: 'What do we print on the cover?', note: 'This is the name the whole world will chart.' },
  { id: 'real', prompt: 'And who were you before the spotlight?', note: 'Small print only. Fans see it in the byline.' },
  { id: 'city', prompt: "Where's the story datelined?", note: 'Your home city sets rent, your first fans and your home chart.' },
  { id: 'sound', prompt: "What's your sound?", note: 'Every market hears genres differently. Pick a lane, add up to 2 flavours.' },
  { id: 'origin', prompt: 'Pick your origin story.', note: 'It sets your starting cash, fans and skills.' },
  { id: 'shoot', prompt: 'Cover shoot. Bring your own photo?', note: 'Upload a portrait or keep the house shot. You can change it later.' },
];

const EMPTY = { firstName: '', lastName: '', stageName: '', city: '', age: 21, genre: '', subgenres: [], path: '', photo: null };

// Cover completeness, 0–100. Each piece the cover needs counts equally.
export function coverCompleteness(f, shootSeen = false) {
  const parts = [!!f.stageName.trim(), !!f.firstName.trim(), !!f.city, !!f.genre, !!f.path, shootSeen || !!f.photo];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

export function stepValid(id, f) {
  if (id === 'stage') return !!f.stageName.trim();
  if (id === 'real') return !!f.firstName.trim() && f.age >= 16 && f.age <= 60;
  if (id === 'city') return !!f.city;
  if (id === 'sound') return !!f.genre;
  if (id === 'origin') return !!f.path;
  return true;
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function DebutCover({ f, printing = false }) {
  const city = f.city ? cityById(f.city) : null;
  const [a, b] = GENRE_COLORWAYS[f.genre] || NEUTRAL;
  const name = f.stageName.trim();
  const real = `${f.firstName} ${f.lastName}`.trim();
  return (
    <div className={`cs-cover ${printing ? 'printing' : ''}`} style={{ '--ca': a, '--cb': b }} aria-label="Debut issue cover preview" role="img">
      <img src={f.photo || DEFAULT_FACE} alt="" />
      <div className="cs-tint" />
      <div className="cs-shade" />
      <div className="cs-mast">
        <div className="cs-logo">TREBLR<span>WEEKLY</span></div>
        <div className="cs-issue">DEBUT ISSUE<br />NO. 001</div>
      </div>
      {f.genre && (
        <div className="cs-tag">{[genreName(f.genre), ...f.subgenres].join(' · ')}</div>
      )}
      <div className="cs-story">
        {city && <div className="cs-dateline">{`Dateline: ${city.name} ${city.flag}`}</div>}
        <h2 className={name ? '' : 'ghost'} style={{ fontSize: headlineSize(name || 'Your name here') }}>{name || 'Your name here'}</h2>
        {real && <div className="cs-born">{`born ${real}, ${f.age}`}</div>}
        {f.path && <div className="cs-strap">{STRAPLINES[f.path]}</div>}
      </div>
      <div className="cs-barcode" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ width: (i * 7) % 3 + 1 }} />)}</div>
      {printing && <div className="cs-flash" />}
      {printing && <div className="cs-sticker">ON SALE<br />NOW</div>}
    </div>
  );
}

function headlineSize(t) {
  const n = t.length;
  if (n <= 6) return 'clamp(34px, 13vw, 56px)';
  if (n <= 10) return 'clamp(28px, 10vw, 44px)';
  if (n <= 16) return 'clamp(24px, 7.5vw, 34px)';
  return 'clamp(20px, 6vw, 28px)';
}

function Ring({ pct }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg className="cs-ring" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
      <circle cx="30" cy="30" r={r} stroke="#C6FF3D" strokeWidth="3" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 30 30)" />
    </svg>
  );
}

export default function Onboarding({ onDone, onCancel, initialStep = 0 }) {
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState(EMPTY);
  const [q, setQ] = useState('');
  const [shootSeen, setShootSeen] = useState(initialStep >= 5);
  const [printing, setPrinting] = useState(false);
  const touch = useRef(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const cur = DESK[step];
  const valid = stepValid(cur.id, f);
  const last = step === DESK.length - 1;
  const pct = coverCompleteness(f, shootSeen);

  useEffect(() => { if (cur.id === 'shoot') setShootSeen(true); }, [cur.id]);

  const go = (d) => {
    if (printing) return;
    if (d < 0) {
      if (step === 0) { onCancel?.(); return; }
      setDir(-1); setStep(step - 1); return;
    }
    if (!valid) return;
    if (!last) { setDir(1); setStep(step + 1); return; }
    sendToPrint();
  };

  const sendToPrint = () => {
    setPrinting(true);
    const game = createNewGame({ ...f, roster: loadRosterPack() || undefined, stageName: f.stageName.trim(), firstName: f.firstName.trim(), lastName: f.lastName.trim() });
    setTimeout(() => onDone(game), reducedMotion() ? 250 : 1900);
  };

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (e.target.closest?.('.cs-carousel, input')) return; // carousel and sliders own horizontal drags
    go(dx < 0 ? 1 : -1);
  };

  const genre = GENRES.find((g) => g.id === f.genre);
  const cities = CITIES.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="cs">
      <div className="cs-stage">
        <button className="cs-close" onClick={onCancel} aria-label="Close and return to title"><Icon name="close" size={18} /></button>
        <DebutCover f={f} printing={printing} />
      </div>

      <section className="cs-desk" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
        <div className={`cs-q ${dir > 0 ? 'fwd' : 'bwd'}`} key={step}>
          <div className="cs-editor"><span className="cs-ed">ED</span><span>The editor</span></div>
          <h1 className="cs-prompt">{cur.prompt}</h1>
          <p className="cs-note">{cur.note}</p>

          <div className="cs-field">
            {cur.id === 'stage' && (
              <>
                <input className="cs-big" aria-label="Stage name" value={f.stageName} maxLength={28} autoFocus onChange={(e) => set('stageName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go(1)} placeholder="NOVA, Lil Echo, The Midnight Club…" />
              </>
            )}

            {cur.id === 'real' && (
              <>
                <div className="grid2">
                  <input aria-label="First name" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
                  <input aria-label="Last name" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
                </div>
                <div className="cs-age">
                  <span className="cs-label">Age</span>
                  <button className="cs-step" aria-label="Younger" onClick={() => set('age', Math.max(16, f.age - 1))}>−</button>
                  <input type="range" className="slider grow" aria-label="Age" min={16} max={45} value={f.age} onChange={(e) => set('age', +e.target.value)} />
                  <button className="cs-step" aria-label="Older" onClick={() => set('age', Math.min(45, f.age + 1))}>+</button>
                  <b className="num">{f.age}</b>
                </div>
              </>
            )}

            {cur.id === 'city' && (
              <>
                <div className="cs-search"><Icon name="search" size={18} color="#9A9AA5" /><input aria-label="Search cities" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${CITIES.length} cities worldwide`} /></div>
                <div className="cs-chips">
                  {cities.map((c) => (
                    <button key={c.id} className={`cs-chip ${f.city === c.id ? 'on' : ''}`} aria-pressed={f.city === c.id} onClick={() => set('city', c.id)}>
                      <span aria-hidden="true">{c.flag}</span>{c.name}<small>{fmtMoney(c.rent)}/mo</small>
                    </button>
                  ))}
                  {!cities.length && <div className="muted small">No city by that name yet.</div>}
                </div>
              </>
            )}

            {cur.id === 'sound' && (
              <>
                <div className="cs-chips">
                  {GENRES.map((g) => {
                    const [a, b] = GENRE_COLORWAYS[g.id];
                    return (
                      <button key={g.id} className={`cs-chip genre ${f.genre === g.id ? 'on' : ''}`} aria-pressed={f.genre === g.id} style={{ '--ca': a, '--cb': b }} onClick={() => setF((x) => ({ ...x, genre: g.id, subgenres: [] }))}>
                        <i className="cs-swatch" />{g.name}
                      </button>
                    );
                  })}
                </div>
                {genre && (
                  <div className="cs-subs">
                    <span className="cs-label">Flavours · {f.subgenres.length}/2</span>
                    <div className="cs-chips">
                      {genre.subs.map((s) => {
                        const on = f.subgenres.includes(s);
                        return (
                          <button key={s} className={`cs-chip sub ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set('subgenres', on ? f.subgenres.filter((x) => x !== s) : f.subgenres.length < 2 ? [...f.subgenres, s] : f.subgenres)}>{s}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {cur.id === 'origin' && (
              <div className="cs-carousel" role="listbox" aria-label="Origin stories">
                {CAREER_PATHS.map((c) => (
                  <button key={c.id} role="option" aria-selected={f.path === c.id} className={`cs-path ${f.path === c.id ? 'on' : ''}`} onClick={() => set('path', c.id)}>
                    <div className="cs-path-name">{c.name}</div>
                    <div className="cs-path-strap">“{STRAPLINES[c.id]}”</div>
                    <div className="cs-path-desc">{c.desc}</div>
                    <div className="cs-path-stats">
                      <span>{fmtMoney(c.cash)}</span><span>{fmtNum(c.fans)} fans</span>
                      {c.label && <span>Signed</span>}
                      {c.suspicion && <span className="warn">Suspicion {c.suspicion}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {cur.id === 'shoot' && (
              <div className="cs-shoot">
                <UploadButton className="cs-shoot-btn" onImage={(d) => set('photo', d)}><Icon name="camera" size={22} /><span>Upload photo</span></UploadButton>
                <button className={`cs-shoot-btn ${!f.photo ? 'on' : ''}`} onClick={() => set('photo', null)}><img src={DEFAULT_FACE} alt="" /><span>Keep house shot</span></button>
              </div>
            )}
          </div>
        </div>

        <div className="cs-nav">
          <button className="cs-back" onClick={() => go(-1)} aria-label={step === 0 ? 'Back to title' : 'Previous question'}><Icon name="back" size={20} /></button>
          <div className="cs-meter"><b>{`${pct}%`}</b><span>cover complete</span></div>
          {last ? (
            <button className="cs-print" onClick={() => go(1)} disabled={printing}>
              <Icon name="send" size={18} />{printing ? 'Printing…' : 'Send to print'}
            </button>
          ) : (
            <button className="cs-next" onClick={() => go(1)} disabled={!valid} aria-label={`Next question (${pct}% complete)`}>
              <Ring pct={pct} />
              <span className="cs-next-dot"><Icon name="chev" size={22} stroke={2.6} /></span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
