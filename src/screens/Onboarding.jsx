import { useState } from 'react';
import { CITIES, GENRES, CAREER_PATHS, createNewGame, cityById, pathById, genreName, fmtMoney, fmtNum } from '../engine/index.js';
import { Icon, Mono, UploadButton, DEFAULT_FACE } from '../ui/kit.jsx';

const STEPS = ['Identity', 'Home', 'Sound', 'Path', 'Face', 'Press kit'];

export default function Onboarding({ onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ firstName: '', lastName: '', stageName: '', city: '', age: 21, genre: '', subgenres: [], path: '', photo: null });
  const [q, setQ] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const valid = [
    f.firstName.trim() && f.stageName.trim(),
    f.city && f.age >= 16 && f.age <= 60,
    f.genre,
    f.path,
    true,
    true,
  ][step];

  const next = () => {
    if (step < 5) setStep(step + 1);
    else onDone(createNewGame({ ...f, stageName: f.stageName.trim(), firstName: f.firstName.trim(), lastName: f.lastName.trim() }));
  };

  const genre = GENRES.find((g) => g.id === f.genre);
  const city = f.city ? cityById(f.city) : null;
  const path = f.path ? pathById(f.path) : null;
  const cities = CITIES.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="ob">
      <div className="ob-top">
        <div className="row between">
          <Mono>Step {step + 1} / 6 · {STEPS[step]}</Mono>
          <button className="mono" onClick={onCancel}>Cancel</button>
        </div>
        <div className="ob-prog">{STEPS.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}</div>
      </div>

      <div className="ob-body" key={step}>
        {step === 0 && (
          <>
            <h1>Who's stepping up to the mic?</h1>
            <p className="muted">Your legal name stays private. Your stage name goes on every chart in the world.</p>
            <div className="grid2 mt16">
              <label className="col gap6"><Mono>First name</Mono><input value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Alex" /></label>
              <label className="col gap6"><Mono>Last name</Mono><input value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Rivera" /></label>
            </div>
            <label className="col gap6 mt16"><Mono>Stage name</Mono><input value={f.stageName} onChange={(e) => set('stageName', e.target.value)} placeholder="e.g. NOVA, Lil Echo, The Midnight Club" style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }} /></label>
            {f.firstName && !f.stageName && <button className="chip mt12" onClick={() => set('stageName', `${f.firstName} ${f.lastName}`.trim())}>Use “{`${f.firstName} ${f.lastName}`.trim()}”</button>}
          </>
        )}

        {step === 1 && (
          <>
            <h1>Where does the story start?</h1>
            <p className="muted">Your home city sets rent, your first fan base and which national chart you're likeliest to crack first.</p>
            <div className="phone-search mt16" style={{ background: 'var(--raised)' }}><Icon name="search" size={18} color="#9A9AA5" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 30 cities worldwide" /></div>
            <div className="list mt12">
              {cities.map((c) => (
                <button key={c.id} className="list-item press" style={{ textAlign: 'left', width: '100%' }} onClick={() => set('city', c.id)}>
                  <span style={{ fontSize: 24 }}>{c.flag}</span>
                  <div className="grow"><div style={{ fontWeight: 600 }}>{c.name}</div><div className="muted tiny">Rent {fmtMoney(c.rent)}/mo</div></div>
                  {f.city === c.id && <Icon name="check" color="#C6FF3D" />}
                </button>
              ))}
            </div>
            <div className="card mt16">
              <div className="row between"><Mono>Age</Mono><span className="num" style={{ fontSize: 22 }}>{f.age}</span></div>
              <input type="range" className="slider mt12" min={16} max={45} value={f.age} onChange={(e) => set('age', +e.target.value)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>What do you sound like?</h1>
            <p className="muted">Each genre plays differently in each market — Country rules the US, K-Pop owns Korea, Latin runs Mexico.</p>
            <div className="genre-grid mt16">
              {GENRES.map((g) => (
                <button key={g.id} className={`genre-tile press ${f.genre === g.id ? 'on' : ''}`} onClick={() => setF((x) => ({ ...x, genre: g.id, subgenres: [] }))}>{g.name}</button>
              ))}
            </div>
            {genre && (
              <>
                <Mono className="mt24">Subgenres · up to 2</Mono>
                <div className="row wrap gap6 mt8">
                  {genre.subs.map((s) => {
                    const on = f.subgenres.includes(s);
                    return (
                      <button key={s} className="pill" style={on ? { background: 'var(--lime)', color: '#0B0B0F' } : {}} onClick={() => set('subgenres', on ? f.subgenres.filter((x) => x !== s) : f.subgenres.length < 2 ? [...f.subgenres, s] : f.subgenres)}>{s}</button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h1>How did you get here?</h1>
            <p className="muted">Your origin story sets starting cash, fame and skills.</p>
            <div className="col mt16">
              {CAREER_PATHS.map((c) => (
                <button key={c.id} className={`option press ${f.path === c.id ? 'on' : ''}`} style={{ '--accent': '#C6FF3D' }} onClick={() => set('path', c.id)}>
                  <div className="row between"><div className="head" style={{ fontSize: 17 }}>{c.name}</div>{f.path === c.id && <Icon name="check" color="#C6FF3D" />}</div>
                  <div className="small" style={{ color: 'var(--lime)', marginTop: 2 }}>{c.tag}</div>
                  <div className="muted small mt8">{c.desc}</div>
                  <div className="row gap6 mt8 wrap">
                    <span className="chip sm">{fmtMoney(c.cash)}</span>
                    <span className="chip sm">{fmtNum(c.fans)} fans</span>
                    <span className="chip sm">Pen {c.skills.songwriting}</span>
                    {c.label && <span className="chip sm">Signed</span>}
                    {c.suspicion && <span className="chip sm" style={{ color: 'var(--red)' }}>Suspicion {c.suspicion}</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Every cover needs a face.</h1>
            <p className="muted">Upload your own photo or use the default portrait. It goes on your magazine covers and press kit.</p>
            <div className="magazine mt16" style={{ aspectRatio: '4 / 5' }}>
              <img src={f.photo || DEFAULT_FACE} alt="" />
              <div className="shade" />
              <div className="mast"><h1>TREBLR<small>WEEKLY</small></h1></div>
              <div className="story"><span className="kicker">ONE TO WATCH</span><h2>{f.stageName || 'You'}</h2></div>
            </div>
            <div className="row mt16">
              <UploadButton className="btn primary grow" onImage={(d) => set('photo', d)}><Icon name="upload" size={18} />Upload photo</UploadButton>
              {f.photo && <button className="btn" onClick={() => set('photo', null)}>Use default</button>}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Mono>Press kit · For immediate release</Mono>
            <div className="presskit mt12">
              <div className="pk-photo"><img src={f.photo || DEFAULT_FACE} alt="" /></div>
              <div className="pk-body">
                <div className="mono">{city?.flag} {city?.name} · {genreName(f.genre)}{f.subgenres.length ? ` / ${f.subgenres.join(', ')}` : ''}</div>
                <h1 style={{ fontSize: 36, margin: '6px 0 4px', color: '#111' }}>{f.stageName}</h1>
                <div style={{ fontSize: 14, color: '#333' }}>{f.firstName} {f.lastName}, {f.age}. {path?.desc}</div>
                <div className="divider" style={{ background: '#ddd' }} />
                <div className="grid3">
                  <div><div className="mono sm">Cash</div><div className="num" style={{ fontSize: 18 }}>{fmtMoney(path?.cash || 0)}</div></div>
                  <div><div className="mono sm">Fans</div><div className="num" style={{ fontSize: 18 }}>{fmtNum(path?.fans || 0)}</div></div>
                  <div><div className="mono sm">Path</div><div className="num" style={{ fontSize: 14 }}>{path?.name}</div></div>
                </div>
                <div className="divider" style={{ background: '#ddd' }} />
                <div className="mono sm">Skills</div>
                {path && Object.entries(path.skills).map(([k, v]) => (
                  <div key={k} className="row mt8" style={{ fontSize: 13 }}>
                    <span style={{ width: 96, textTransform: 'capitalize' }}>{k}</span>
                    <div className="bar grow" style={{ background: '#ddd' }}><i style={{ width: `${v}%`, background: '#111' }} /></div>
                    <b style={{ width: 24, textAlign: 'right' }}>{v}</b>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="ob-foot">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)} aria-label="Back"><Icon name="back" /></button>}
        <button className="btn primary grow" disabled={!valid} onClick={next}>{step === 5 ? 'Start Career' : 'Continue'}</button>
      </div>
    </div>
  );
}
