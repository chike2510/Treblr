import { useState, useCallback, useEffect } from 'react';
import { GENRES, CITIES, CAREER_TYPES, PRODUCERS, NPC_ARTISTS, MILESTONES } from './data';
import { makeDefault, saveGame, loadGame, hasSave, deleteSave, getTimeLabel, getTier, getTalent, calcSongQuality, fmt, fmtN, clamp } from './utils';
import Game from './Game';

// ─── START SCREEN ─────────────────────────────────────────────────────────────
function StartScreen({ onNew, onContinue, saveInfo }) {
  return (
    <div className="start-screen">
      <div className="start-logo">TREBLR</div>
      <div className="start-tagline">Build Your Legacy</div>

      {saveInfo && (
        <div className="save-card" style={{ marginBottom: 12 }}>
          <div className="save-label">✦ Saved Career</div>
          <div className="save-info-name">{saveInfo.stageName}</div>
          <div className="save-info-meta">
            {GENRES.find(g => g.id === saveInfo.genre)?.label} · {CITIES.find(c => c.id === saveInfo.city)?.label} ·{' '}
            {getTier(saveInfo.fans || 0).tier}
          </div>
          <div className="save-info-meta" style={{ marginTop: 4, color: 'var(--gold-lt)' }}>
            {fmtN(saveInfo.money || 0)} · {fmt(saveInfo.fans || 0)} fans · {getTimeLabel(saveInfo.totalWeeks || 0, saveInfo.startYear, saveInfo.startAge)}
          </div>
          {saveInfo.lastSaved && (
            <div className="save-info-time">
              Last saved {new Date(saveInfo.lastSaved).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {saveInfo && (
        <button className="btn-primary" style={{ marginBottom: 10, maxWidth: 400 }} onClick={onContinue}>
          CONTINUE CAREER
        </button>
      )}
      <button
        className={saveInfo ? 'btn-outline' : 'btn-primary'}
        style={{ maxWidth: 400 }}
        onClick={onNew}
      >
        {saveInfo ? 'NEW CAREER' : 'START CAREER'}
      </button>
      {saveInfo && (
        <button
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, marginTop: 16, cursor: 'pointer', letterSpacing: 1 }}
          onClick={() => { if (window.confirm('Delete save and start fresh?')) { deleteSave(); onNew(); } }}
        >
          DELETE SAVE
        </button>
      )}
    </div>
  );
}

// ─── ONBOARDING SCREEN ────────────────────────────────────────────────────────
function OnboardScreen({ onStart }) {
  const [stageName, setStageName]     = useState('');
  const [realName, setRealName]       = useState('');
  const [startAge, setStartAge]       = useState(22);
  const [genre, setGenre]             = useState(null);
  const [city, setCity]               = useState(null);
  const [careerType, setCareerType]   = useState(null);

  const career = CAREER_TYPES.find(c => c.id === careerType);
  const canStart = stageName.trim() && realName.trim() && genre && city && careerType;

  const handleStart = () => {
    if (!canStart) return;
    onStart({ stageName: stageName.trim(), realName: realName.trim(), startAge, genre, city, careerType });
  };

  return (
    <div className="ob">
      <div className="ob-logo">TREBLR</div>
      <div className="ob-subtitle">Build Your Legacy</div>

      {/* 01 — NAMES */}
      <div className="ob-section">
        <div className="ob-sec-head">
          <span className="ob-num">01</span>
          <span className="ob-sec-label">Your Identity</span>
          {stageName.trim() && realName.trim() && <span className="ob-check">✓</span>}
        </div>
        <div className="ob-input-row" style={{ marginBottom: 10 }}>
          <div>
            <label className="form-label">Stage Name</label>
            <input className="ob-input-sm" placeholder="CANDELAR" value={stageName} onChange={e => setStageName(e.target.value)} maxLength={18} />
          </div>
          <div>
            <label className="form-label">Real Name</label>
            <input className="ob-input-sm" placeholder="Given name" value={realName} onChange={e => setRealName(e.target.value)} maxLength={24} />
          </div>
        </div>
        <div>
          <label className="form-label">Starting Age</label>
          <select className="ob-age-select" value={startAge} onChange={e => setStartAge(Number(e.target.value))}>
            {Array.from({ length: 20 }, (_, i) => 16 + i).map(a => (
              <option key={a} value={a}>{a} years old</option>
            ))}
          </select>
        </div>
      </div>

      {/* 02 — GENRE */}
      <div className="ob-section">
        <div className="ob-sec-head">
          <span className="ob-num">02</span>
          <span className="ob-sec-label">Your Genre</span>
          {genre && <span className="ob-check">✓</span>}
        </div>
        <div className="grid2">
          {GENRES.map(g => (
            <div
              key={g.id}
              className={`sel${genre === g.id ? ' on' : ''}`}
              onClick={() => setGenre(g.id)}
              style={genre === g.id ? { borderColor: g.color, background: g.color + '14' } : {}}
            >
              <div className="sel-emoji">{g.emoji}</div>
              <div className="sel-label">{g.label}</div>
              <div className="sel-sub">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 03 — CITY */}
      <div className="ob-section">
        <div className="ob-sec-head">
          <span className="ob-num">03</span>
          <span className="ob-sec-label">Your City</span>
          {city && <span className="ob-check">✓</span>}
        </div>
        <div className="grid2">
          {CITIES.map(c => (
            <div key={c.id} className={`sel${city === c.id ? ' on' : ''}`} onClick={() => setCity(c.id)}>
              <div className="sel-emoji">{c.flag}</div>
              <div className="sel-label">{c.label}</div>
              <div className="sel-sub">{c.scene}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 04 — CAREER PATH */}
      <div className="ob-section">
        <div className="ob-sec-head">
          <span className="ob-num">04</span>
          <span className="ob-sec-label">Career Path</span>
          {careerType && <span className="ob-check">✓</span>}
        </div>
        {CAREER_TYPES.map(c => (
          <div
            key={c.id}
            className={`career-card${careerType === c.id ? ' on' : ''}`}
            onClick={() => setCareerType(c.id)}
          >
            <div className="career-top">
              <span className="career-emoji">{c.emoji}</span>
              <span className="career-name">{c.label}</span>
            </div>
            <div className="career-desc">{c.desc}</div>
            <span className="career-perk">✦ {c.perk}</span>
            {careerType === c.id && (
              <div className="stats-preview">
                {[
                  { l: 'SONGWRITING', v: c.stats.sw },
                  { l: 'VOCALS', v: c.stats.vc },
                  { l: 'PRODUCTION', v: c.stats.pd },
                  { l: 'LIVE PERF', v: c.stats.lp },
                  { l: 'HUSTLE', v: c.stats.hustle },
                  { l: 'CHARISMA', v: c.stats.charisma },
                ].map(s => (
                  <div key={s.l} className="sp">
                    <div className="sp-l">{s.l.slice(0, 3)}</div>
                    <div className="sp-v">{s.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {career && (
        <div style={{ width: '100%', maxWidth: 440, marginBottom: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted2)', fontWeight: 700, marginBottom: 6 }}>Starting Situation</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: 'var(--green-lt)' }}>{fmtN(career.money)}</span>
            <span style={{ color: 'var(--gold-lt)' }}>{fmt(career.fans)} fans</span>
            <span style={{ color: 'var(--blue)' }}>{fmt(career.socialFollowers)} followers</span>
          </div>
        </div>
      )}

      <button className="btn-primary" disabled={!canStart} onClick={handleStart} style={{ marginBottom: 12 }}>
        BEGIN CAREER →
      </button>
      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', maxWidth: 300 }}>
        Your progress saves automatically after every week.
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [gs, setGs] = useState(() => {
    const save = loadGame();
    if (save) return save;
    return makeDefault();
  });

  const patch = useCallback((upd) => setGs(prev => ({ ...prev, ...upd })), []);
  const patchFn = useCallback((fn) => setGs(prev => ({ ...prev, ...fn(prev) })), []);

  // Handle start screen actions
  const handleNew = () => patch({ screen: 'onboard' });
  const handleContinue = () => {
    const save = loadGame();
    if (save) setGs(save);
  };

  // Begin the actual game from onboarding
  const handleBegin = ({ stageName, realName, startAge, genre, city, careerType }) => {
    const career = CAREER_TYPES.find(c => c.id === careerType);
    const genreData = GENRES.find(g => g.id === genre);

    const newState = {
      ...makeDefault(),
      screen: 'game',
      stageName,
      realName,
      startAge,
      genre,
      city,
      careerType,
      startYear: 2024,

      money:           career.money,
      fans:            career.fans,
      socialFollowers: career.socialFollowers,

      sw:      career.stats.sw,
      vc:      career.stats.vc,
      pd:      career.stats.pd,
      lp:      career.stats.lp,
      hustle:  career.stats.hustle,
      charisma:career.stats.charisma,
      network: career.stats.network,

      genreBonus: { [genre]: genreData ? (genreData.pdBonus + genreData.lpBonus) : 0 },

      feed: [`🎵 ${stageName}'s career begins. The journey to legendary starts now.`].map(msg => ({ msg, type: '', week: 0 })),
    };
    setGs(newState);
    saveGame(newState);
  };

  const saveData = hasSave() ? loadGame() : null;

  if (gs.screen === 'start') {
    return <StartScreen onNew={handleNew} onContinue={handleContinue} saveInfo={saveData} />;
  }
  if (gs.screen === 'onboard') {
    return <OnboardScreen onStart={handleBegin} />;
  }
  return <Game gs={gs} setGs={setGs} />;
}
