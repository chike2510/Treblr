import { LABELS } from '../data';
import { clamp, fmt, fmtN, pct } from '../utils';

export default function LabelTab({ gs, patch, patchFn, addFeed, showToast }) {
  const label = LABELS.find(l => l.id === gs.labelId) || LABELS[0];

  const signLabel = (lbl) => {
    if (gs.clout < lbl.minClout || gs.fans < lbl.minFans) return;
    const advanceBonus = gs.hasManager ? 1.15 : 1.0;
    const advance      = Math.round(lbl.advance * advanceBonus);
    patchFn(prev => ({
      labelId:  lbl.id,
      labelRel: 75,
      recouped: 0,
      pressure: 0,
      money:    clamp(prev.money + advance, 0, 999_000_000),
    }));
    addFeed(`📝 Signed to ${lbl.name}! Advance: ${fmtN(advance)}. Contract: ${lbl.contractWeeks} weeks.`, 'pos');
    showToast(`SIGNED: ${lbl.name.toUpperCase()}`);
  };

  const leaveLabel = () => {
    if (label.id === 'independent') return;
    const buyout = Math.round(label.advance * 0.5);
    if (gs.money < buyout) { showToast('NOT ENOUGH CASH FOR BUYOUT'); return; }
    patchFn(prev => ({
      labelId:  'independent',
      labelRel: 80,
      pressure: 0,
      recouped: 0,
      money:    clamp(prev.money - buyout, 0, 999_000_000),
    }));
    addFeed(`🚪 Left ${label.name}. Buyout: ${fmtN(buyout)}.`, 'neg');
    showToast('NOW INDEPENDENT');
  };

  return (
    <div className="screen">

      {/* CURRENT DEAL */}
      {label.id !== 'independent' && (
        <>
          <div className="sec-title">Current Contract</div>
          <div className="info-card" style={{ marginBottom:12 }}>
            <div className="info-row">
              <span className="info-row-label">Label</span>
              <span className="info-row-val" style={{ color: label.color }}>{label.name}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Your Split</span>
              <span className="info-row-val" style={{ color:'var(--green-lt)' }}>{label.artistSplit}%</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marketing Mult</span>
              <span className="info-row-val">{label.marketingMult}×</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Creative Control</span>
              <span className="info-row-val" style={{ color: label.creativeControl > 60 ? 'var(--green-lt)' : 'var(--red-lt)' }}>
                {label.creativeControl}%
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Label Relationship</span>
              <span className="info-row-val" style={{ color: gs.labelRel > 60 ? 'var(--green-lt)' : gs.labelRel > 30 ? 'var(--gold-lt)' : 'var(--red-lt)' }}>
                {Math.round(gs.labelRel)}/100
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Pressure</span>
              <span className="info-row-val" style={{ color: gs.pressure > 6 ? 'var(--red-lt)' : gs.pressure > 3 ? 'var(--gold-lt)' : 'var(--green-lt)' }}>
                {gs.pressure.toFixed(1)}/10
              </span>
            </div>
          </div>

          <div className="recoup-section" style={{ marginBottom:12 }}>
            <div className="recoup-labels">
              <span>Advance Recouped</span>
              <span>{fmtN(gs.recouped)} / {fmtN(label.advance)}</span>
            </div>
            <div className="recoup-bar-outer">
              <div className="recoup-bar-inner" style={{ width:`${pct(gs.recouped, label.advance || 1)}%` }} />
            </div>
          </div>

          <div className="demands-list" style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', fontWeight:700, marginBottom:8 }}>Label Demands</div>
            {label.demands.map((d, i) => <div key={i} className="demand-item">{d}</div>)}
          </div>

          <button
            className="btn-sm danger"
            style={{ width:'100%', padding:12, marginBottom:16, fontSize:12 }}
            onClick={leaveLabel}
          >
            LEAVE LABEL — Buyout: {fmtN(Math.round(label.advance * 0.5))}
          </button>
        </>
      )}

      {/* INDEPENDENT STATUS */}
      {label.id === 'independent' && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px', marginBottom:16 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:1, marginBottom:6 }}>Independent</div>
          <div style={{ fontSize:12, color:'var(--muted2)', lineHeight:1.65, fontWeight:500 }}>
            You keep 100% of everything. No advance, no machine behind you, no one else's agenda.
          </div>
        </div>
      )}

      {/* AVAILABLE LABELS */}
      <div className="sec-title">Available Labels</div>
      {LABELS.filter(l => l.id !== 'independent').map(lbl => {
        const locked    = gs.clout < lbl.minClout || gs.fans < lbl.minFans;
        const isCurrent = gs.labelId === lbl.id;
        return (
          <div
            key={lbl.id}
            className={`label-card${isCurrent ? ' current' : ''}`}
            style={isCurrent ? { borderColor: lbl.color + '55' } : {}}
          >
            {isCurrent && <div className="signed-badge">SIGNED</div>}
            <div className="lc-top">
              <div className="lc-name" style={{ color: lbl.color }}>{lbl.name}</div>
              <div className="lc-tier" style={{ color: lbl.color, borderColor: lbl.color + '44' }}>{lbl.tierLabel}</div>
            </div>
            <div className="lc-desc">{lbl.desc}</div>
            <div className="lc-stats">
              <div className="lcs">
                <div className="lcs-l">Advance</div>
                <div className="lcs-v" style={{ color:'var(--green-lt)' }}>{fmtN(lbl.advance)}</div>
              </div>
              <div className="lcs">
                <div className="lcs-l">Your Split</div>
                <div className="lcs-v">{lbl.artistSplit}%</div>
              </div>
              <div className="lcs">
                <div className="lcs-l">Marketing</div>
                <div className="lcs-v" style={{ color:'var(--blue)' }}>{lbl.marketingMult}×</div>
              </div>
              <div className="lcs">
                <div className="lcs-l">Creative Control</div>
                <div className="lcs-v">{lbl.creativeControl}%</div>
                <div className="cc-bar"><div className="cc-fill" style={{ width:`${lbl.creativeControl}%` }} /></div>
              </div>
            </div>
            <div className="demands-list">
              {lbl.demands.map((d, i) => <div key={i} className="demand-item">{d}</div>)}
            </div>
            {locked && (
              <div style={{ fontSize:11, color:'var(--red-lt)', marginBottom:10, fontWeight:600 }}>
                🔒 Requires {lbl.minFans > 0 ? `${fmt(lbl.minFans)} fans` : ''}
                {lbl.minFans > 0 && lbl.minClout > 0 ? ' & ' : ''}
                {lbl.minClout > 0 ? `Clout ${lbl.minClout}` : ''}
              </div>
            )}
            <button
              className={`btn-sm${isCurrent ? '' : locked ? ' disabled' : ' success'}`}
              style={{ width:'100%', padding:11, fontSize:12, letterSpacing:2 }}
              onClick={() => !locked && !isCurrent && signLabel(lbl)}
            >
              {isCurrent ? 'CURRENTLY SIGNED' : locked ? 'LOCKED' : 'SIGN DEAL'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
