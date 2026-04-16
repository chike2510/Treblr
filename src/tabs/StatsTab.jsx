import { GENRES, CITIES, MILESTONES } from '../data/constants';
import { fmt, fmtN, getTier, getTalent, getTimeLabel } from '../engine/utils';

const SKILL_COLORS = {
  sw: 'var(--accent-purple)',
  vc: 'var(--accent-cyan)',
  pd: 'var(--accent-green)',
  lp: 'var(--accent-orange)',
};

export default function StatsTab({ gs, patch, patchFn, showToast }) {
  const tier    = getTier(gs.fans);
  const talent  = getTalent(gs);
  const genre   = GENRES.find(g => g.id === gs.genre);
  const city    = CITIES.find(c => c.id === gs.city);
  const totalSocial = Object.values(gs.socialPlatforms || {}).reduce((a, b) => a + (b || 0), 0);

  const releasedTracks = (gs.catalog || []).filter(t => t.released);
  const peakChart = releasedTracks.reduce((best, t) => (t.chartPos && (best === null || t.chartPos < best) ? t.chartPos : best), null);
  const totalStreams = (gs.charts?.streams || []).filter(e => e.isPlayer).reduce((a, e) => a + (e.metricVal || 0), 0);

  const skills = [
    { id:'sw', label:'Songwriting',     val: gs.sw || 0 },
    { id:'vc', label:'Vocals',          val: gs.vc || 0 },
    { id:'pd', label:'Production',      val: gs.pd || 0 },
    { id:'lp', label:'Live Performance',val: gs.lp || 0 },
  ];

  const otherStats = [
    { label:'Hustle',   val: gs.hustle   || 0 },
    { label:'Charisma', val: gs.charisma || 0 },
    { label:'Network',  val: gs.network  || 0 },
    { label:'Reputation', val: gs.reputation || 50 },
  ];

  return (
    <div className="tab-content">
      {/* Artist card */}
      <div className="card" style={{ marginBottom:16, background:'linear-gradient(135deg, var(--bg-overlay), rgba(108,63,204,0.1))' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
          <div className="avatar" style={{ width:56, height:56, fontSize:24, background:'var(--accent-purple)', borderRadius:16 }}>
            {(gs.stageName || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, letterSpacing:1 }}>{gs.stageName}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{gs.realName} · Age {(gs.startAge || 22) + Math.floor((gs.totalWeeks || 0) / 48)}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <span className="tag tag-purple">{tier.tier}</span>
          {genre && <span className="tag tag-orange">{genre.label}</span>}
          {city && <span className="tag tag-cyan">{city.label}</span>}
        </div>
      </div>

      {/* Career stats */}
      <div className="sec-head"><div className="sec-title">Career Stats</div></div>
      <div className="stat-grid-2" style={{ marginBottom:16 }}>
        <div className="stat-block">
          <div className="stat-block-label">Total Fans</div>
          <div className="stat-block-val" style={{ color:'var(--accent-gold-lt)' }}>{fmt(gs.fans)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Clout</div>
          <div className="stat-block-val" style={{ color:'var(--accent-purple)' }}>{gs.clout}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Net Worth</div>
          <div className="stat-block-val" style={{ color:'var(--accent-green)' }}>{fmtN(gs.money)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Social Reach</div>
          <div className="stat-block-val">{fmt(totalSocial)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Tracks Released</div>
          <div className="stat-block-val">{releasedTracks.length}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Peak Chart Pos</div>
          <div className="stat-block-val" style={{ color:'var(--accent-gold-lt)' }}>{peakChart ? `#${peakChart}` : '—'}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Weekly Income</div>
          <div className="stat-block-val" style={{ color:'var(--accent-green)' }}>{fmtN(gs.weeklyStreamIncome || 0)}</div>
        </div>
        <div className="stat-block">
          <div className="stat-block-label">Weeks Active</div>
          <div className="stat-block-val" style={{ fontFamily:'var(--font-mono)' }}>{gs.totalWeeks}</div>
        </div>
      </div>

      {/* Skills */}
      <div className="sec-head"><div className="sec-title">Core Skills</div><div className="sec-sub">Talent: {talent}/100</div></div>
      <div className="card" style={{ marginBottom:16 }}>
        {skills.map(s => (
          <div key={s.id} className="skill-row">
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>{s.label}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: SKILL_COLORS[s.id] }}>{s.val}/25</span>
              </div>
              <div className="prog-bar">
                <div className="prog-fill" style={{ width:`${(s.val / 25) * 100}%`, background: SKILL_COLORS[s.id] }} />
              </div>
            </div>
          </div>
        ))}
        {/* Genre mastery */}
        <div className="skill-row">
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Genre Mastery ({genre?.label})</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent-gold-lt)' }}>
                {(gs.genreBonus || {})[gs.genre] || 0}/50
              </span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width:`${((gs.genreBonus || {})[gs.genre] || 0) / 50 * 100}%`, background:'var(--accent-gold)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Soft skills */}
      <div className="sec-head"><div className="sec-title">Attributes</div></div>
      <div className="stat-grid-2" style={{ marginBottom:16 }}>
        {otherStats.map(s => (
          <div key={s.label} className="stat-block">
            <div className="stat-block-label">{s.label}</div>
            <div className="stat-block-val">{s.val}{s.label === 'Reputation' ? '/100' : ''}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="sec-head"><div className="sec-title">Platform Breakdown</div></div>
      <div className="card" style={{ marginBottom:16 }}>
        {Object.entries(gs.socialPlatforms || {}).map(([platform, count]) => (
          <div key={platform} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
            <span style={{ color:'var(--text-secondary)', textTransform:'capitalize' }}>{platform}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(count)}</span>
          </div>
        ))}
      </div>

      {/* Awards */}
      {(gs.awards || []).length > 0 && (
        <>
          <div className="sec-head"><div className="sec-title">Awards</div></div>
          <div className="card">
            {(gs.awards || []).map((a, i) => (
              <div key={i} style={{ padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                <span style={{ color:'var(--accent-gold-lt)' }}>{a}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Team */}
      <div className="sec-head" style={{ marginTop:8 }}><div className="sec-title">Team</div></div>
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
          <span>Manager</span>
          <span style={{ color: gs.hasManager ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasManager ? 'Hired · -₦200k/wk' : 'None'}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:12 }}>
          <span>Entertainment Lawyer</span>
          <span style={{ color: gs.hasLawyer ? 'var(--accent-green)' : 'var(--text-muted)' }}>{gs.hasLawyer ? 'On retainer · -₦100k/wk' : 'None'}</span>
        </div>
        {!gs.hasManager && (
          <button
            className="btn btn-outline btn-sm btn-full"
            style={{ marginTop:8 }}
            disabled={gs.money < 1000000}
            onClick={() => {
              patchFn(prev => ({
                hasManager: true,
                money: prev.money - 1000000,
                news: addNews(prev.news, 'Hired a manager. -₦200k/week.', 'pos', prev.totalWeeks),
              }));
            }}
          >
            Hire Manager · ₦1M deposit
          </button>
        )}
        {!gs.hasLawyer && (
          <button
            className="btn btn-outline btn-sm btn-full"
            style={{ marginTop:8 }}
            disabled={gs.money < 500000}
            onClick={() => {
              patchFn(prev => ({
                hasLawyer: true,
                money: prev.money - 500000,
                news: addNews(prev.news, 'Hired an entertainment lawyer. -₦100k/week retainer.', 'pos', prev.totalWeeks),
              }));
            }}
          >
            Hire Lawyer · ₦500k deposit
          </button>
        )}
      </div>
    </div>
  );
}

function addNews(feed, msg, type, week) {
  return [{ msg, type, week }, ...((feed || []).slice(0, 79))];
}
