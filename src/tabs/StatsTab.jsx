import { GENRES, CITIES, CAREER_TYPES, MILESTONES } from '../data';
import { fmt, fmtN, getTalent, getTimeInfo } from '../utils';

export default function StatsTab({ gs }) {
  const talent   = getTalent(gs);
  const time     = getTimeInfo(gs.totalWeeks, gs.startYear, gs.startAge);
  const genreObj = GENRES.find(g => g.id === gs.genre);
  const cityObj  = CITIES.find(c => c.id === gs.city);
  const career   = CAREER_TYPES.find(c => c.id === gs.careerType);
  const genreBonus = (gs.genreBonus || {})[gs.genre] || 0;

  const SKILL_BARS = [
    { key:'sw',  label:'Songwriting',    val: gs.sw,  max:25, color:'var(--purple-lt)' },
    { key:'vc',  label:'Vocals',         val: gs.vc,  max:25, color:'var(--blue)' },
    { key:'pd',  label:'Production',     val: gs.pd,  max:25, color:'var(--gold-lt)' },
    { key:'lp',  label:'Live Perf',      val: gs.lp,  max:25, color:'var(--green-lt)' },
  ];
  const SOFT_BARS = [
    { key:'hustle',   label:'Hustle',   val: gs.hustle   || 5, max:25, color:'var(--orange)' },
    { key:'charisma', label:'Charisma', val: gs.charisma || 5, max:25, color:'var(--red-lt)' },
    { key:'network',  label:'Network',  val: gs.network  || 5, max:25, color:'var(--muted2)' },
  ];

  return (
    <div className="screen">

      {/* TALENT TOTAL */}
      <div className="talent-total">
        <div>
          <div className="tt-label">TOTAL TALENT</div>
          <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>SW + VC + PD + LP</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="tt-val">{talent}</div>
          <div className="tt-max" style={{ fontSize:10, color:'var(--muted)', fontWeight:700 }}>/100 MAX</div>
        </div>
      </div>

      {/* CORE SKILLS */}
      <div className="sec-title">Core Skills</div>
      {SKILL_BARS.map(s => (
        <div key={s.key} className="skill-row">
          <div className="skill-name">{s.label}</div>
          <div className="skill-bar">
            <div className="skill-fill" style={{ width:`${(s.val / s.max) * 100}%`, background: s.color }} />
          </div>
          <div className="skill-val" style={{ color: s.color }}>{s.val}<span style={{ fontSize:9, color:'var(--muted)' }}>/25</span></div>
        </div>
      ))}

      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'10px 12px', marginTop:8, marginBottom:16 }}>
        <div style={{ fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted2)', fontWeight:700, marginBottom:4 }}>
          {genreObj?.label} Mastery Bonus
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--gold-lt)' }}>+{genreBonus}</div>
        <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Improves song quality when recording {genreObj?.label}</div>
      </div>

      {/* SOFT SKILLS */}
      <div className="sec-title">Soft Skills</div>
      {SOFT_BARS.map(s => (
        <div key={s.key} className="skill-row">
          <div className="skill-name">{s.label}</div>
          <div className="skill-bar">
            <div className="skill-fill" style={{ width:`${(s.val / s.max) * 100}%`, background: s.color }} />
          </div>
          <div className="skill-val" style={{ color: s.color }}>{s.val}</div>
        </div>
      ))}

      {/* FINANCES */}
      <div className="sec-title">Finances</div>
      <div className="info-card">
        <div className="info-row">
          <span className="info-row-label">Total Cash</span>
          <span className="info-row-val" style={{ color:'var(--green-lt)' }}>{fmtN(gs.money)}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Weekly Streams</span>
          <span className="info-row-val">{fmtN(gs.weeklyStreamIncome || 0)}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Tax Reserve</span>
          <span className="info-row-val" style={{ color:'var(--red-lt)' }}>{fmtN(gs.taxAccum || 0)}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Manager</span>
          <span className="info-row-val" style={{ color: gs.hasManager ? 'var(--green-lt)' : 'var(--muted)' }}>
            {gs.hasManager ? 'Hired (₦200k/wk)' : 'None'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Lawyer</span>
          <span className="info-row-val" style={{ color: gs.hasLawyer ? 'var(--green-lt)' : 'var(--muted)' }}>
            {gs.hasLawyer ? 'Retained (₦100k/wk)' : 'None'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Merch Store</span>
          <span className="info-row-val" style={{ color: gs.hasMerch ? 'var(--green-lt)' : 'var(--muted)' }}>
            {gs.hasMerch ? `Tier ${gs.merchTier}` : 'None'}
          </span>
        </div>
        {(gs.brandDeals || []).length > 0 && (
          <div className="info-row">
            <span className="info-row-label">Brand Deals</span>
            <span className="info-row-val" style={{ color:'var(--gold-lt)' }}>{gs.brandDeals.length} active</span>
          </div>
        )}
      </div>

      {/* CAREER */}
      <div className="sec-title">Career Stats</div>
      <div className="info-card">
        <div className="info-row">
          <span className="info-row-label">Fans</span>
          <span className="info-row-val" style={{ color:'var(--gold-lt)' }}>{fmt(gs.fans)}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Social Followers</span>
          <span className="info-row-val" style={{ color:'var(--blue)' }}>{fmt(gs.socialFollowers)}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Clout</span>
          <span className="info-row-val" style={{ color:'var(--purple-lt)' }}>{gs.clout}/100</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Reputation</span>
          <span className="info-row-val" style={{ color: gs.reputation > 70 ? 'var(--green-lt)' : gs.reputation > 40 ? 'var(--gold-lt)' : 'var(--red-lt)' }}>
            {gs.reputation}/100
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Tracks Recorded</span>
          <span className="info-row-val">{(gs.catalog || []).length}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Tracks Released</span>
          <span className="info-row-val">{(gs.catalog || []).filter(t=>t.released).length}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Projects</span>
          <span className="info-row-val">{(gs.projects || []).length}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Award Noms</span>
          <span className="info-row-val" style={{ color:'var(--gold-lt)' }}>{gs.awardNoms || 0}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Allies</span>
          <span className="info-row-val" style={{ color:'var(--green-lt)' }}>
            {Object.values(gs.npcRelations||{}).filter(r=>r==='ally').length}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Rivals</span>
          <span className="info-row-val" style={{ color:'var(--red-lt)' }}>
            {Object.values(gs.npcRelations||{}).filter(r=>r==='rival').length}
          </span>
        </div>
      </div>

      {/* WIKIPEDIA */}
      <div className="sec-title">Wikipedia</div>
      <div className="wiki-card">
        <div className="wiki-name">{gs.stageName}</div>
        <div className="wiki-aka">Born {gs.realName} · Age {time.currentAge}</div>
        <div className="wiki-divider" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 0', fontSize:12 }}>
          {[
            { l:'Origin',    v: cityObj?.label || '—' },
            { l:'Genre',     v: genreObj?.label || '—' },
            { l:'Started',   v: `${gs.startYear}` },
            { l:'Career',    v: career?.label || '—' },
          ].map(r => (
            <div key={r.l}>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', fontWeight:700, marginBottom:2 }}>{r.l}</div>
              <div style={{ fontWeight:700, color:'var(--text2)' }}>{r.v}</div>
            </div>
          ))}
        </div>
        <div className="wiki-divider" />
        <div style={{ fontSize:12, color:'var(--muted2)', lineHeight:1.7, fontWeight:500 }}>
          {gs.stageName} is a {genreObj?.label} artist from {cityObj?.label}.
          {gs.fans >= 500 ? ` Known for ${MILESTONES.filter(m => gs.fans >= m.fans).slice(-1)[0]?.tier} level impact.` : ' Currently building a name.'}
          {gs.projects.length > 0 ? ` Discography includes ${gs.projects.length} project${gs.projects.length > 1 ? 's' : ''}.` : ''}
          {gs.awardNoms > 0 ? ` Has received ${gs.awardNoms} award nomination${gs.awardNoms > 1 ? 's' : ''}.` : ''}
        </div>
      </div>
    </div>
  );
}
