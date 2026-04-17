import { useState, useCallback } from 'react';
import { GENRES, CITIES, CAREER_TYPES } from './data/constants';
import { NPC_ARTISTS } from './data/artists';
import { makeDefault, saveGame, loadGame, hasSave, deleteSave } from './engine/gameState';
import { fmt, fmtN, getTier, getEra } from './engine/utils';
import { generateNPCCatalog, buildCharts } from './engine/npcEngine';
import Game from './Game';

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
);

// ── START SCREEN ──────────────────────────────────────────────────────────────
function StartScreen({ onNew, onContinue, saveData }) {
  const tier = saveData ? getTier(saveData.fans || 0) : null;
  return (
    <div className="start-screen">
      <div className="start-logo">TREBLR</div>
      <div className="start-tagline">Build Your Legacy</div>

      {saveData && (
        <div className="save-card">
          <div className="save-label">Saved Career</div>
          <div className="save-name">{saveData.stageName}</div>
          <div className="save-info" style={{ marginBottom: 4 }}>
            {GENRES.find(g => g.id === saveData.genre)?.label} · {CITIES.find(c => c.id === saveData.city)?.label}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700, marginTop: 8 }}>
            <span style={{ color: 'var(--accent-gold-lt)' }}>{fmtN(saveData.money || 0)}</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{fmt(saveData.fans || 0)} fans</span>
            {tier && <span style={{ color: tier.color }}>{tier.tier}</span>}
          </div>
        </div>
      )}

      {saveData && (
        <button className="btn btn-primary btn-full" style={{ maxWidth: 320, marginBottom: 10 }} onClick={onContinue}>
          CONTINUE CAREER
        </button>
      )}
      <button
        className={`btn btn-full ${saveData ? 'btn-outline' : 'btn-primary'}`}
        style={{ maxWidth: 320 }}
        onClick={onNew}
      >
        {saveData ? 'NEW CAREER' : 'START CAREER'}
      </button>

      {saveData && (
        <button
          style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:11, marginTop:16, cursor:'pointer', letterSpacing:1 }}
          onClick={() => { if (window.confirm('Delete save and start fresh?')) { deleteSave(); onNew(); }}}
        >
          DELETE SAVE
        </button>
      )}

      <div style={{ position:'absolute', bottom:24, fontSize:10, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
        v3.1
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function OnboardScreen({ onStart }) {
  const [step, setStep]               = useState(0);
  const [stageName, setStageName]     = useState('');
  const [realName, setRealName]       = useState('');
  const [startAge, setStartAge]       = useState(22);
  const [genre, setGenre]             = useState(null);
  const [city, setCity]               = useState(null);
  const [careerType, setCareerType]   = useState(null);

  const career = CAREER_TYPES.find(c => c.id === careerType);
  const canStart = stageName.trim() && realName.trim() && genre && city && careerType;

  const steps = [
    { label: 'Identity', done: !!(stageName.trim() && realName.trim()) },
    { label: 'Genre',    done: !!genre },
    { label: 'City',     done: !!city },
    { label: 'Career',   done: !!careerType },
  ];

  const handleStart = () => {
    if (!canStart) return;
    onStart({ stageName: stageName.trim(), realName: realName.trim(), startAge, genre, city, careerType });
  };

  return (
    <div className="ob-screen">
      <div className="ob-logo">TREBLR</div>
      <div className="ob-subtitle">Build Your Legacy</div>

      {/* Step indicators */}
      <div style={{ display:'flex', gap:8, marginBottom:24, width:'100%', maxWidth:440 }}>
        {steps.map((s, i) => (
          <div
            key={s.label}
            onClick={() => setStep(i)}
            style={{
              flex:1, textAlign:'center', cursor:'pointer',
              borderBottom: `2px solid ${i === step ? 'var(--accent-gold)' : s.done ? 'var(--accent-green)' : 'var(--border)'}`,
              paddingBottom:6,
            }}
          >
            <div style={{ fontSize:9, letterSpacing:1, textTransform:'uppercase', color: i === step ? 'var(--accent-gold-lt)' : s.done ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {s.done && i !== step ? '✓ ' : ''}{s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Identity */}
      {step === 0 && (
        <div className="ob-section">
          <div className="ob-sec-head">
            <span className="ob-num">01</span>
            <span className="ob-sec-label">Your Identity</span>
          </div>
          <div className="ob-input-row">
            <div>
              <label className="form-label">Stage Name</label>
              <input className="ob-input" placeholder="e.g. CANDELAR" value={stageName} onChange={e => setStageName(e.target.value)} maxLength={18} />
            </div>
            <div>
              <label className="form-label">Real Name</label>
              <input className="ob-input" placeholder="Given name" value={realName} onChange={e => setRealName(e.target.value)} maxLength={24} />
            </div>
          </div>
          <div>
            <label className="form-label">Starting Age</label>
            <select
              className="ob-input"
              value={startAge}
              onChange={e => setStartAge(Number(e.target.value))}
              style={{ appearance:'none' }}
            >
              {Array.from({ length: 20 }, (_, i) => 16 + i).map(a => (
                <option key={a} value={a}>{a} years old</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop:16 }} disabled={!stageName.trim() || !realName.trim()} onClick={() => setStep(1)}>
            NEXT →
          </button>
        </div>
      )}

      {/* Step 1: Genre */}
      {step === 1 && (
        <div className="ob-section">
          <div className="ob-sec-head">
            <span className="ob-num">02</span>
            <span className="ob-sec-label">Your Genre</span>
          </div>
          <div className="grid2">
            {GENRES.map(g => (
              <div
                key={g.id}
                className={`sel${genre === g.id ? ' on' : ''}`}
                onClick={() => setGenre(g.id)}
                style={genre === g.id ? { borderColor: g.color, background: g.color + '14' } : {}}
              >
                <div className="sel-icon">
                  <div style={{ width:28, height:28, borderRadius:8, background:g.color + '30', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:g.color }}>{g.initials}</span>
                  </div>
                </div>
                <div className="sel-label">{g.label}</div>
                <div className="sel-sub">{g.desc}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop:16 }} disabled={!genre} onClick={() => setStep(2)}>NEXT →</button>
        </div>
      )}

      {/* Step 2: City */}
      {step === 2 && (
        <div className="ob-section">
          <div className="ob-sec-head">
            <span className="ob-num">03</span>
            <span className="ob-sec-label">Your City</span>
          </div>
          <div className="grid2">
            {CITIES.map(c => (
              <div key={c.id} className={`sel${city === c.id ? ' on' : ''}`} onClick={() => setCity(c.id)}>
                <div className="sel-icon">
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>{c.flag}</span>
                </div>
                <div className="sel-label">{c.label}</div>
                <div className="sel-sub">{c.scene}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop:16 }} disabled={!city} onClick={() => setStep(3)}>NEXT →</button>
        </div>
      )}

      {/* Step 3: Career */}
      {step === 3 && (
        <div className="ob-section">
          <div className="ob-sec-head">
            <span className="ob-num">04</span>
            <span className="ob-sec-label">Career Path</span>
          </div>
          {CAREER_TYPES.map(c => (
            <div
              key={c.id}
              className={`career-card${careerType === c.id ? ' on' : ''}`}
              onClick={() => setCareerType(c.id)}
            >
              <div className="career-top">
                <div style={{ width:32, height:32, borderRadius:8, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MicIcon />
                </div>
                <span className="career-name">{c.label}</span>
              </div>
              <div className="career-desc">{c.desc}</div>
              <span className="career-perk">✦ {c.perk}</span>
              {careerType === c.id && (
                <div className="stats-preview" style={{ marginTop:10 }}>
                  {[['SW', c.stats.sw], ['VC', c.stats.vc], ['PD', c.stats.pd], ['LP', c.stats.lp], ['HST', c.stats.hustle], ['CHR', c.stats.charisma]].map(([l, v]) => (
                    <div key={l} className="sp-chip">
                      <div className="sp-chip-l">{l}</div>
                      <div className="sp-chip-v">{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {career && (
            <div style={{ background:'var(--surface-1)', borderRadius:'var(--r)', padding:'12px 14px', marginTop:12 }}>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Starting Stats</div>
              <div style={{ display:'flex', gap:16, fontSize:13, fontWeight:700 }}>
                <span style={{ color:'var(--accent-gold-lt)' }}>{fmtN(career.money)}</span>
                <span style={{ color:'var(--accent-cyan)' }}>{fmt(career.fans)} fans</span>
                <span style={{ color:'var(--text-muted)', fontSize:11 }}>SE: {career.se}/wk</span>
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-full" style={{ marginTop:16 }} disabled={!canStart} onClick={handleStart}>
            BEGIN CAREER →
          </button>
        </div>
      )}

      <div style={{ height:32 }} />
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [gs, setGs] = useState(() => {
    const save = loadGame();
    if (save) return save;
    return makeDefault();
  });

  const patch   = useCallback(upd => setGs(prev => ({ ...prev, ...upd })), []);
  const patchFn = useCallback(fn  => setGs(prev => ({ ...prev, ...fn(prev) })), []);

  const handleNew      = () => patch({ screen: 'onboard' });
  const handleContinue = () => { const s = loadGame(); if (s) setGs(s); };

  const handleBegin = ({ stageName, realName, startAge, genre, city, careerType }) => {
    const career    = CAREER_TYPES.find(c => c.id === careerType);
    const genreData = GENRES.find(g => g.id === genre);

    const platforms = {
      soundstream: Math.round(career.socialFollowers * 0.3),
      instapic:    Math.round(career.socialFollowers * 0.25),
      chirp:       Math.round(career.socialFollowers * 0.15),
      vidtube:     Math.round(career.socialFollowers * 0.15),
      rhythmtok:   Math.round(career.socialFollowers * 0.1),
      soundcloud:  Math.round(career.socialFollowers * 0.05),
    };

    const npcCatalog    = generateNPCCatalog();
    const npcLastRelease = {};
    for (const npc of NPC_ARTISTS) {
      npcLastRelease[npc.id] = -(npc.releaseFrequency + Math.floor(Math.random() * 4));
    }

    const newState = {
      ...makeDefault(),
      screen: 'game',
      stageName, realName, startAge, genre, city, careerType, startYear: 2024,
      money:    career.money,
      fans:     career.fans,
      socialPlatforms: platforms,
      sw: career.stats.sw, vc: career.stats.vc, pd: career.stats.pd, lp: career.stats.lp,
      hustle: career.stats.hustle, charisma: career.stats.charisma, network: career.stats.network,
      genreBonus: { [genre]: (genreData?.pdBonus || 0) + (genreData?.lpBonus || 0) },
      maxSe: career.se, se: career.se,
      npcCatalog,
      npcLastRelease,
      news: [{ msg: `${stageName}'s career begins. The journey to legendary starts now.`, type: 'milestone', week: 0 }],
    };
    // Seed initial charts so StatsTab isn't empty from day one
    newState.charts = buildCharts(newState.catalog, newState.npcCatalog, newState);
    setGs(newState);
    saveGame(newState);
  };

  const saveData = hasSave() ? loadGame() : null;

  if (gs.screen === 'start')   return <StartScreen onNew={handleNew} onContinue={handleContinue} saveData={saveData} />;
  if (gs.screen === 'onboard') return <OnboardScreen onStart={handleBegin} />;
  return <Game gs={gs} setGs={setGs} />;
}
