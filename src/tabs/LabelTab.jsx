import { useState } from 'react';
import { LABELS, LABEL_AESTHETICS } from '../data/constants';
import { clamp, fmt, fmtN, uid } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

const OWN_LABEL_COST = 20000000;
const OWN_LABEL_MIN_FANS = 50000;

export default function LabelTab({ gs, patch, patchFn, showToast }) {
  const [view, setView]           = useState('labels');
  const [ownLabelName, setName]   = useState('');
  const [ownAesthetic, setAesthet] = useState('indie');
  const [labelBudget, setBudget]  = useState(0);

  const currentLabel = LABELS.find(l => l.id === gs.labelId) || LABELS[0];
  const hasOwnLabel  = !!gs.ownLabel;
  const canCreateOwn = gs.fans >= OWN_LABEL_MIN_FANS && gs.money >= OWN_LABEL_COST && !hasOwnLabel && gs.labelId === 'independent' && (gs.projects || []).length >= 1;

  const signLabel = (label) => {
    if (label.id === gs.labelId) return;
    if (label.id === 'independent') {
      patchFn(prev => ({
        labelId: 'independent',
        labelRel: 80,
        pressure: 0,
        recouped: 0,
        news: addNews(prev.news, 'Went independent. Full ownership restored.', 'pos', prev.totalWeeks),
      }));
      showToast('NOW INDEPENDENT');
      return;
    }
    if (gs.clout < label.minClout) { showToast(`Need ${label.minClout} clout`); return; }
    if (gs.fans < label.minFans)   { showToast(`Need ${fmt(label.minFans)} fans`); return; }

    patchFn(prev => ({
      labelId:  label.id,
      money:    clamp(prev.money + label.advance, 0, 999_000_000_000),
      labelRel: 80,
      pressure: 0,
      recouped: 0,
      news: addNews(prev.news, `Signed to ${label.name}! Advance: ${fmtN(label.advance)}`, 'pos', prev.totalWeeks),
    }));
    showToast(`Signed to ${label.name}!`);
  };

  const createOwnLabel = () => {
    if (!ownLabelName.trim()) { showToast('Name your label'); return; }
    if (!canCreateOwn) return;

    patchFn(prev => ({
      money: clamp(prev.money - OWN_LABEL_COST, 0, 999_000_000_000),
      ownLabel: {
        name: ownLabelName.trim(),
        aesthetic: ownAesthetic,
        budget: 0,
        reputation: 20,
        tier: 1,
        createdWeek: prev.totalWeeks,
      },
      news: addNews(prev.news, `${ownLabelName.trim()} is born! Your own record label is officially registered.`, 'milestone', prev.totalWeeks),
    }));
    showToast(`${ownLabelName} launched!`);
  };

  const updateBudget = (val) => {
    if (!gs.ownLabel) return;
    patchFn(prev => ({
      ownLabel: { ...prev.ownLabel, budget: val },
    }));
    setBudget(val);
  };

  // Own label tier
  const ownLabelTier = gs.ownLabel ? (
    gs.fans >= 1000000 ? { label:'Major Independent', mult:'3×' } :
    gs.fans >= 200000  ? { label:'Known Label', mult:'2×' } :
    gs.fans >= 50000   ? { label:'Rising Label', mult:'1.5×' } :
    { label:'Boutique Label', mult:'1×' }
  ) : null;

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        {['labels', 'own'].map(v => (
          <div key={v} className={`sub-tab${view===v?' on':''}`} onClick={() => setView(v)}>
            {v === 'labels' ? 'Sign Deals' : 'My Label'}
          </div>
        ))}
      </div>

      {/* ── LABEL DEALS ──────────────────────────────────────────────── */}
      {view === 'labels' && (
        <>
          <div className="sec-head">
            <div className="sec-title">Record Labels</div>
            <div className="sec-sub">Your split · Creative control</div>
          </div>

          {LABELS.map(label => {
            const isActive = gs.labelId === label.id;
            const locked = !isActive && (gs.clout < label.minClout || gs.fans < label.minFans);

            return (
              <div
                key={label.id}
                className={`label-card${isActive ? ' active' : locked ? ' locked' : ''}`}
                onClick={() => !locked && signLabel(label)}
                style={{ borderColor: isActive ? label.color : locked ? 'var(--border)' : 'var(--border)' }}
              >
                <div className="label-card-header">
                  <div className="label-card-name" style={{ color: isActive ? label.color : 'var(--text-primary)' }}>{label.name}</div>
                  <div className="label-card-tier" style={{ color: label.color, borderColor: label.color }}>
                    {isActive ? 'SIGNED' : label.tierLabel}
                  </div>
                </div>

                <div className="label-splits">
                  <div className="label-split-item">
                    <div className="label-split-n" style={{ color: 'var(--accent-green)' }}>{label.artistSplit}%</div>
                    <div className="label-split-l">Your Cut</div>
                  </div>
                  <div className="label-split-item">
                    <div className="label-split-n" style={{ color: 'var(--accent-cyan)' }}>{label.creativeControl}%</div>
                    <div className="label-split-l">Creative</div>
                  </div>
                  <div className="label-split-item">
                    <div className="label-split-n" style={{ color: 'var(--accent-gold-lt)' }}>{label.marketingMult}×</div>
                    <div className="label-split-l">Mktg Mult</div>
                  </div>
                  {label.advance > 0 && (
                    <div className="label-split-item">
                      <div className="label-split-n" style={{ color: 'var(--accent-gold-lt)', fontSize:13 }}>{fmtN(label.advance)}</div>
                      <div className="label-split-l">Advance</div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{label.desc}</div>

                {label.minFans > 0 && (
                  <div style={{ fontSize:10, color: locked ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    Req: {fmt(label.minFans)} fans · {label.minClout} clout
                  </div>
                )}

                {isActive && gs.labelId !== 'independent' && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                      <span style={{ color:'var(--text-muted)' }}>Recouped</span>
                      <span style={{ fontFamily:'var(--font-mono)' }}>{fmtN(gs.recouped)} / {fmtN(label.advance)}</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width:`${Math.min(100, (gs.recouped / label.advance) * 100)}%`, background: label.color }} />
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>
                      Label relationship: {Math.round(gs.labelRel)}%
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── OWN LABEL ──────────────────────────────────────────────── */}
      {view === 'own' && (
        <>
          {hasOwnLabel ? (
            <>
              <div className="own-label-card">
                <div className="own-label-name">{gs.ownLabel.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
                  {LABEL_AESTHETICS.find(a => a.id === gs.ownLabel.aesthetic)?.label} aesthetic
                </div>

                {ownLabelTier && (
                  <span className="tag tag-gold" style={{ marginBottom:12, display:'inline-block' }}>{ownLabelTier.label} · {ownLabelTier.mult} marketing</span>
                )}

                <div className="stat-grid-2" style={{ marginBottom:12 }}>
                  <div className="stat-block">
                    <div className="stat-block-label">Label Reputation</div>
                    <div className="stat-block-val" style={{ color:'var(--accent-purple)' }}>{gs.ownLabel.reputation}/100</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-block-label">Weekly Budget</div>
                    <div className="stat-block-val" style={{ color:'var(--accent-gold-lt)' }}>{fmtN(gs.ownLabel.budget || 0)}</div>
                  </div>
                </div>

                <label className="form-label">Weekly Marketing Budget</label>
                <div className="slider-row">
                  <div className="slider-label">
                    <span className="slider-label-text">Spend per week</span>
                    <span className="slider-label-val">{fmtN(gs.ownLabel.budget || 0)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5000000}
                    step={100000}
                    value={gs.ownLabel.budget || 0}
                    onChange={e => updateBudget(Number(e.target.value))}
                  />
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                  Higher budget = more fan growth. Deducted weekly from cash.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sec-head">
                <div className="sec-title">Start Your Label</div>
              </div>

              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
                Build your own record label. Keep 100% of streams, set your marketing budget, and eventually sign other artists.
              </div>

              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>Requirements</div>
                {[
                  { label:'50,000+ fans',        met: gs.fans >= OWN_LABEL_MIN_FANS,   val: `${fmt(gs.fans)} fans` },
                  { label:'₦20M startup capital', met: gs.money >= OWN_LABEL_COST,      val: fmtN(gs.money) },
                  { label:'Currently independent',met: gs.labelId === 'independent',    val: '' },
                  { label:'At least 1 EP/Album',  met: (gs.projects || []).length >= 1, val: `${(gs.projects||[]).length} projects` },
                ].map(req => (
                  <div key={req.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                    <span style={{ color: req.met ? 'var(--text-primary)' : 'var(--text-muted)' }}>{req.label}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: req.met ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {req.met ? '✓' : req.val || '✗'}
                    </span>
                  </div>
                ))}
              </div>

              {canCreateOwn && (
                <div className="card" style={{ marginBottom:16 }}>
                  <label className="form-label">Label Name</label>
                  <input
                    className="ob-input"
                    placeholder="e.g. Dark Horse Records..."
                    value={ownLabelName}
                    onChange={e => setName(e.target.value)}
                    maxLength={30}
                    style={{ marginBottom:16 }}
                  />

                  <label className="form-label" style={{ marginBottom:8 }}>Label Aesthetic</label>
                  <div className="grid2" style={{ marginBottom:16 }}>
                    {LABEL_AESTHETICS.map(a => (
                      <div key={a.id} className={`sel${ownAesthetic===a.id?' on':''}`} onClick={() => setAesthet(a.id)}
                        style={ownAesthetic===a.id ? { borderColor:a.color, background:a.color+'14' } : {}}>
                        <div className="sel-label" style={{ color: ownAesthetic===a.id ? a.color : 'var(--text-primary)' }}>{a.label}</div>
                        <div className="sel-sub">{a.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:16 }}>
                    <span style={{ color:'var(--text-muted)' }}>Registration cost</span>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent-red)' }}>{fmtN(OWN_LABEL_COST)}</span>
                  </div>

                  <button className="btn btn-primary btn-full" disabled={!ownLabelName.trim()} onClick={createOwnLabel}>
                    REGISTER LABEL
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
