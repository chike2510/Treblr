import { useState } from 'react';
import { MERCH_TYPES, LABELS, LABEL_AESTHETICS, TOUR_TIERS } from '../data/constants';
import { clamp, fmt, fmtN, uid, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';
import { Aurora, Magnetic, SectionLabel, SubNav } from '../components/Living';

const MERCH_COOLDOWN = 4;
const BRAND_COOLDOWN = 8;
const OWN_LABEL_COST = 20000000;
const OWN_LABEL_MIN_FANS = 50000;

const BRAND_DEALS = [
  { id:'fashion',  label:'Fashion Brand',    minFans:10000,  income:2000000,   desc:'Apparel collab or campaign.' },
  { id:'food',     label:'Beverage Brand',   minFans:25000,  income:5000000,   desc:'Sponsor a drink or food brand.' },
  { id:'tech',     label:'Tech Partnership', minFans:50000,  income:10000000,  desc:'Phone, headphone or app deal.' },
  { id:'luxury',   label:'Luxury Collab',    minFans:200000, income:30000000,  desc:'Premium fashion or watch brand.' },
  { id:'streaming',label:'Streaming Deal',   minFans:100000, income:15000000,  desc:'Exclusive partnership with a platform.' },
];

const SUB_NAV = [
  { id:'merch',  label:'Merch' },
  { id:'brands', label:'Brands' },
  { id:'label',  label:'Label' },
  { id:'tour',   label:'Tour' },
];

const MerchIcon = ({ typeId }) => {
  const icons = { tshirt:'T', hoodie:'H', cap:'C', vinyl:'V', poster:'P', boxset:'B' };
  return <div style={{ fontSize:16, fontWeight:900, fontFamily:'var(--li-font-display)' }}>{icons[typeId] || 'M'}</div>;
};

export default function BusinessTab({ gs, patch, patchFn, showToast }) {
  const [section, setSection] = useState('merch');

  return (
    <div className="tab-content li-scene">
      <Aurora c1="#FF5500" c2="#7C6CFF" c3="#ffffff" />
      <div className="li-scene-content">
      <SubNav items={SUB_NAV} active={section} onChange={setSection} />
      {section === 'merch'  && <MerchView  gs={gs} patchFn={patchFn} showToast={showToast} />}
      {section === 'brands' && <BrandsView gs={gs} patchFn={patchFn} showToast={showToast} />}
      {section === 'label'  && <LabelView  gs={gs} patchFn={patchFn} showToast={showToast} />}
      {section === 'tour'   && <TourView   gs={gs} patchFn={patchFn} showToast={showToast} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function MerchView({ gs, patchFn, showToast }) {
  const [selectedType, setSelectedType] = useState('tshirt');
  const [quantity, setQuantity]         = useState(500);
  const [price, setPrice]               = useState(25000);

  const type = MERCH_TYPES.find(t => t.id === selectedType) || MERCH_TYPES[0];
  const productionCost = type.costPer * quantity;
  const estimatedRevenue = Math.round(price * quantity * 0.65);
  const profit = estimatedRevenue - productionCost;

  const weeksUntilMerch = Math.max(0, (gs.lastMerchWeek || -99) + MERCH_COOLDOWN - gs.totalWeeks);
  const canDrop = gs.fans >= 5000 && gs.money >= productionCost && weeksUntilMerch === 0;

  const doDrop = () => {
    if (gs.fans < 5000) { showToast('Need 5,000 fans for merch'); return; }
    if (gs.money < productionCost) { showToast('Not enough money'); return; }
    if (weeksUntilMerch > 0) { showToast(`Merch cooldown: ${weeksUntilMerch}w`); return; }
    patchFn(prev => ({
      money: clamp(prev.money - productionCost, 0, 999_000_000_000),
      lastMerchWeek: prev.totalWeeks,
      activeMerchDrops: [
        ...(prev.activeMerchDrops || []),
        { id: uid(), type: type.label, qty: quantity, price, cost: productionCost, revenue: estimatedRevenue, weeksLeft: 4, weekStarted: prev.totalWeeks }
      ],
      news: addNews(prev.news, `Merch drop! ${quantity} ${type.label}s at ₦${(price/1000).toFixed(0)}k. Revenue streams over 4 weeks.`, 'pos', prev.totalWeeks),
    }));
    showToast(`${type.label} merch launched!`);
  };

  return (
    <>
      <SectionLabel>{(gs.activeMerchDrops || []).length} active drops</SectionLabel>

      {(gs.activeMerchDrops || []).length > 0 && (
        <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
          {(gs.activeMerchDrops || []).map((drop, i) => (
            <div key={drop.id} className="li-stagger" style={{ '--i':i, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--li-glass-border)' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{drop.type}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{drop.qty} units · {drop.weeksLeft}w remaining</div>
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-green)' }}>+{fmtN(Math.round(drop.revenue / 4))}/wk</div>
            </div>
          ))}
        </div>
      )}

      {gs.fans < 5000 && (
        <div className="li-glass" style={{ borderColor:'rgba(214,53,72,0.3)', background:'rgba(214,53,72,0.08)', padding:'10px 12px', marginBottom:12, fontSize:11, color:'var(--accent-red)' }}>
          Need 5,000 fans to launch merch. ({fmt(gs.fans)} current)
        </div>
      )}
      {weeksUntilMerch > 0 && (
        <div className="li-glass" style={{ borderColor:'rgba(224,112,32,0.3)', background:'rgba(224,112,32,0.08)', padding:'10px 12px', marginBottom:12, fontSize:11, color:'var(--accent-orange)' }}>
          Merch cooldown: {weeksUntilMerch} week{weeksUntilMerch !== 1 ? 's' : ''} remaining
        </div>
      )}

      <div className="li-glass" style={{ padding:16, marginBottom:16 }}>
        <label className="form-label">Item Type</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
          {MERCH_TYPES.map(t => (
            <div key={t.id} onClick={() => { setSelectedType(t.id); setPrice(t.suggestedPrice); }} className="li-row"
              style={{ textAlign:'center', padding:'10px 6px', borderRadius:12, cursor:'pointer', border:'1px solid '+(selectedType===t.id?'var(--li-accent)':'var(--li-glass-border)'), background:selectedType===t.id?'var(--li-accent-soft)':'transparent' }}>
              <MerchIcon typeId={t.id} />
              <div style={{ fontSize:10, marginTop:4, color:'var(--text-secondary)' }}>{t.label}</div>
            </div>
          ))}
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span className="slider-label-text">Quantity</span>
            <span className="slider-label-val">{quantity.toLocaleString()}</span>
          </div>
          <input type="range" min={100} max={10000} step={100} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span className="slider-label-text">Retail Price</span>
            <div>
              <span className="slider-label-val">{fmtN(price)}</span>
              <span style={{ fontSize:10, color:'var(--text-muted)', marginLeft:6 }}>Suggested: {fmtN(type.suggestedPrice)}</span>
            </div>
          </div>
          <input type="range" min={type.costPer * 1.5} max={type.suggestedPrice * 3} step={500} value={price} onChange={e => setPrice(Number(e.target.value))} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16, marginBottom:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Prod. Cost</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: gs.money >= productionCost ? 'var(--text-primary)' : 'var(--accent-red)' }}>{fmtN(productionCost)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Est. Revenue</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent-green)' }}>{fmtN(estimatedRevenue)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Est. Profit</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: profit > 0 ? 'var(--accent-gold-lt)' : 'var(--accent-red)' }}>{fmtN(profit)}</div>
          </div>
        </div>

        <Magnetic strength={6} disabled={!canDrop} onClick={doDrop}
          className="soc-pill" style={{ width:'100%', textAlign:'center', padding:'13px 0', background:canDrop?'var(--li-accent)':'var(--li-glass-bg)', color:canDrop?'#fff':'var(--text-muted)', fontSize:14 }}>
          LAUNCH MERCH DROP
        </Magnetic>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function BrandsView({ gs, patchFn, showToast }) {
  const doBrand = (deal) => {
    if (gs.fans < deal.minFans) { showToast(`Need ${fmt(deal.minFans)} fans`); return; }
    const lastWeek = (gs.lastBrandWeek || {})[deal.id] || -99;
    if (gs.totalWeeks - lastWeek < BRAND_COOLDOWN) { showToast(`Brand cooldown: ${BRAND_COOLDOWN - (gs.totalWeeks - lastWeek)}w`); return; }
    const income = Math.round(deal.income * (1 + (gs.clout / 200)));
    patchFn(prev => ({
      money: clamp(prev.money + income, 0, 999_000_000_000),
      clout: clamp(prev.clout + 2, 0, 100),
      lastBrandWeek: { ...(prev.lastBrandWeek || {}), [deal.id]: prev.totalWeeks },
      brandDeals: [...(prev.brandDeals || []), { type: deal.id, week: prev.totalWeeks, income }],
      news: addNews(prev.news, `Signed a ${deal.label} deal for ${fmtN(income)}!`, 'pos', prev.totalWeeks),
    }));
    showToast(`Brand deal: +${fmtN(income)}`);
  };

  return (
    <>
      <SectionLabel>{(gs.brandDeals || []).length} signed · 8-week cooldown per category</SectionLabel>
      {BRAND_DEALS.map((deal, i) => {
        const lastWeek = (gs.lastBrandWeek || {})[deal.id] || -99;
        const cooldown = Math.max(0, BRAND_COOLDOWN - (gs.totalWeeks - lastWeek));
        const locked = gs.fans < deal.minFans || cooldown > 0;
        const estimatedIncome = Math.round(deal.income * (1 + (gs.clout / 200)));
        return (
          <Magnetic key={deal.id} strength={4} disabled={locked} onClick={() => doBrand(deal)}
            className="li-glass li-row li-stagger" style={{ '--i':i, display:'flex', gap:14, alignItems:'center', padding:14, marginBottom:10, opacity:locked?0.55:1 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'var(--li-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" style={{ width:22, height:22, stroke:'#fff', fill:'none', strokeWidth:2, strokeLinecap:'round' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{deal.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{deal.desc} · {fmt(deal.minFans)} fans req.</div>
              {cooldown > 0 && <div style={{ fontSize:10, color:'var(--accent-red)', marginTop:2 }}>Cooldown: {cooldown}w</div>}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent-gold-lt)', flexShrink:0 }}>~{fmtN(estimatedIncome)}</div>
          </Magnetic>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function LabelView({ gs, patchFn, showToast }) {
  const [view, setView]             = useState('deals'); // 'deals' | 'own'
  const [ownLabelName, setName]     = useState('');
  const [ownAesthetic, setAesthet]  = useState('indie');

  const hasOwnLabel  = !!gs.ownLabel;
  const canCreateOwn = gs.fans >= OWN_LABEL_MIN_FANS && gs.money >= OWN_LABEL_COST && !hasOwnLabel && gs.labelId === 'independent' && (gs.projects || []).length >= 1;

  const signLabel = (label) => {
    if (label.id === gs.labelId) return;
    if (label.id === 'independent') {
      patchFn(prev => ({
        labelId: 'independent', labelRel: 80, pressure: 0, recouped: 0,
        news: addNews(prev.news, 'Went independent. Full ownership restored.', 'pos', prev.totalWeeks),
      }));
      showToast('NOW INDEPENDENT');
      return;
    }
    if (gs.clout < label.minClout) { showToast(`Need ${label.minClout} clout`); return; }
    if (gs.fans < label.minFans)   { showToast(`Need ${fmt(label.minFans)} fans`); return; }
    patchFn(prev => ({
      labelId: label.id, money: clamp(prev.money + label.advance, 0, 999_000_000_000),
      labelRel: 80, pressure: 0, recouped: 0,
      news: addNews(prev.news, `Signed to ${label.name}! Advance: ${fmtN(label.advance)}`, 'pos', prev.totalWeeks),
    }));
    showToast(`Signed to ${label.name}!`);
  };

  const createOwnLabel = () => {
    if (!ownLabelName.trim()) { showToast('Name your label'); return; }
    if (!canCreateOwn) return;
    patchFn(prev => ({
      money: clamp(prev.money - OWN_LABEL_COST, 0, 999_000_000_000),
      ownLabel: { name: ownLabelName.trim(), aesthetic: ownAesthetic, budget: 0, reputation: 20, tier: 1, createdWeek: prev.totalWeeks },
      news: addNews(prev.news, `${ownLabelName.trim()} is born! Your own record label is officially registered.`, 'milestone', prev.totalWeeks),
    }));
    showToast(`${ownLabelName} launched!`);
  };

  const updateBudget = (val) => {
    if (!gs.ownLabel) return;
    patchFn(prev => ({ ownLabel: { ...prev.ownLabel, budget: val } }));
  };

  const ownLabelTier = gs.ownLabel ? (
    gs.fans >= 1000000 ? { label:'Major Independent', mult:'3×' } :
    gs.fans >= 200000  ? { label:'Known Label', mult:'2×' } :
    gs.fans >= 50000   ? { label:'Rising Label', mult:'1.5×' } :
    { label:'Boutique Label', mult:'1×' }
  ) : null;

  return (
    <>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{id:'deals',l:'Sign Deals'},{id:'own',l:'My Label'}].map(v => (
          <div key={v.id} onClick={()=>setView(v.id)} className="soc-pill"
            style={{ flex:1, textAlign:'center', padding:'9px 0', background:view===v.id?'var(--li-accent)':'var(--li-glass-bg)', border:'1px solid '+(view===v.id?'var(--li-accent)':'var(--li-glass-border)'), color:view===v.id?'#fff':'var(--text-muted)', fontSize:12.5 }}>
            {v.l}
          </div>
        ))}
      </div>

      {view === 'deals' && (
        <>
          <SectionLabel>Your split · Creative control</SectionLabel>
          {LABELS.map((label, i) => {
            const isActive = gs.labelId === label.id;
            const locked = !isActive && (gs.clout < label.minClout || gs.fans < label.minFans);
            return (
              <Magnetic key={label.id} strength={3} disabled={locked} onClick={() => signLabel(label)}
                className="li-glass li-stagger" style={{ '--i':i, padding:14, marginBottom:10, borderColor: isActive ? label.color+'80' : 'var(--li-glass-border)', opacity:locked?0.55:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:15, fontFamily:'var(--li-font-display)', color: isActive ? label.color : 'var(--text-primary)' }}>{label.name}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: label.color, border:'1px solid '+label.color, borderRadius:20, padding:'2px 10px' }}>
                    {isActive ? 'SIGNED' : label.tierLabel}
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                  <div><div style={{ fontSize:15, fontWeight:700, color:'var(--accent-green)' }}>{label.artistSplit}%</div><div style={{ fontSize:9, color:'var(--text-muted)' }}>Your Cut</div></div>
                  <div><div style={{ fontSize:15, fontWeight:700, color:'var(--accent-cyan)' }}>{label.creativeControl}%</div><div style={{ fontSize:9, color:'var(--text-muted)' }}>Creative</div></div>
                  <div><div style={{ fontSize:15, fontWeight:700, color:'var(--accent-gold-lt)' }}>{label.marketingMult}×</div><div style={{ fontSize:9, color:'var(--text-muted)' }}>Mktg Mult</div></div>
                  {label.advance > 0 && <div><div style={{ fontSize:13, fontWeight:700, color:'var(--accent-gold-lt)' }}>{fmtN(label.advance)}</div><div style={{ fontSize:9, color:'var(--text-muted)' }}>Advance</div></div>}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{label.desc}</div>
                {label.minFans > 0 && (
                  <div style={{ fontSize:10, color: locked ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    Req: {fmt(label.minFans)} fans · {label.minClout} clout
                  </div>
                )}
                {isActive && gs.labelId !== 'independent' && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                      <span style={{ color:'var(--text-muted)' }}>Recouped</span>
                      <span style={{ fontFamily:'var(--font-mono)' }}>{fmtN(gs.recouped)} / {fmtN(label.advance)}</span>
                    </div>
                    <div style={{ height:4, background:'var(--li-glass-border)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, (gs.recouped / label.advance) * 100)}%`, background: label.color }} />
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Label relationship: {Math.round(gs.labelRel)}%</div>
                  </div>
                )}
              </Magnetic>
            );
          })}
        </>
      )}

      {view === 'own' && (
        hasOwnLabel ? (
          <div className="li-glass" style={{ padding:16 }}>
            <div style={{ fontFamily:'var(--li-font-display)', fontSize:20, fontWeight:700 }}>{gs.ownLabel.name}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
              {LABEL_AESTHETICS.find(a => a.id === gs.ownLabel.aesthetic)?.label} aesthetic
            </div>
            {ownLabelTier && (
              <span className="tag tag-gold" style={{ marginBottom:12, display:'inline-block' }}>{ownLabelTier.label} · {ownLabelTier.mult} marketing</span>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16, marginTop:8 }}>
              <div className="li-glass" style={{ padding:10, textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Label Reputation</div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--li-accent-lt)' }}>{gs.ownLabel.reputation}/100</div>
              </div>
              <div className="li-glass" style={{ padding:10, textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Weekly Budget</div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--accent-gold-lt)' }}>{fmtN(gs.ownLabel.budget || 0)}</div>
              </div>
            </div>
            <label className="form-label">Weekly Marketing Budget</label>
            <div className="slider-row">
              <div className="slider-label">
                <span className="slider-label-text">Spend per week</span>
                <span className="slider-label-val">{fmtN(gs.ownLabel.budget || 0)}</span>
              </div>
              <input type="range" min={0} max={5000000} step={100000} value={gs.ownLabel.budget || 0} onChange={e => updateBudget(Number(e.target.value))} />
            </div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>Higher budget = more fan growth. Deducted weekly from cash.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
              Build your own record label. Keep 100% of streams, set your marketing budget, and eventually sign other artists.
            </div>
            <div className="li-glass" style={{ padding:'4px 16px', marginBottom:16 }}>
              {[
                { label:'50,000+ fans',        met: gs.fans >= OWN_LABEL_MIN_FANS,   val: `${fmt(gs.fans)} fans` },
                { label:'₦20M startup capital', met: gs.money >= OWN_LABEL_COST,      val: fmtN(gs.money) },
                { label:'Currently independent',met: gs.labelId === 'independent',    val: '' },
                { label:'At least 1 EP/Album',  met: (gs.projects || []).length >= 1, val: `${(gs.projects||[]).length} projects` },
              ].map(req => (
                <div key={req.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--li-glass-border)', fontSize:12 }}>
                  <span style={{ color: req.met ? 'var(--text-primary)' : 'var(--text-muted)' }}>{req.label}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: req.met ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {req.met ? '✓' : req.val || '✗'}
                  </span>
                </div>
              ))}
            </div>
            {canCreateOwn && (
              <div className="li-glass" style={{ padding:16 }}>
                <label className="form-label">Label Name</label>
                <input className="ob-input" placeholder="e.g. Dark Horse Records..." value={ownLabelName} onChange={e => setName(e.target.value)} maxLength={30} style={{ marginBottom:16 }} />
                <label className="form-label" style={{ marginBottom:8 }}>Label Aesthetic</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {LABEL_AESTHETICS.map(a => (
                    <div key={a.id} onClick={() => setAesthet(a.id)} className="li-row"
                      style={{ padding:'10px', borderRadius:12, cursor:'pointer', border:'1px solid '+(ownAesthetic===a.id?a.color:'var(--li-glass-border)'), background:ownAesthetic===a.id?a.color+'14':'transparent' }}>
                      <div style={{ fontWeight:700, fontSize:13, color: ownAesthetic===a.id ? a.color : 'var(--text-primary)' }}>{a.label}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:16 }}>
                  <span style={{ color:'var(--text-muted)' }}>Registration cost</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent-red)' }}>{fmtN(OWN_LABEL_COST)}</span>
                </div>
                <Magnetic strength={6} disabled={!ownLabelName.trim()} onClick={createOwnLabel}
                  className="soc-pill" style={{ width:'100%', textAlign:'center', padding:'13px 0', background:ownLabelName.trim()?'var(--li-accent)':'var(--li-glass-bg)', color:ownLabelName.trim()?'#fff':'var(--text-muted)', fontSize:14 }}>
                  REGISTER LABEL
                </Magnetic>
              </div>
            )}
          </>
        )
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
function TourView({ gs, patchFn, showToast }) {
  const bookTour = (tier) => {
    if (gs.fans < tier.minFans) { showToast(`Need ${fmt(tier.minFans)} fans`); return; }
    if (gs.money < tier.cost) { showToast('Not enough money'); return; }
    if (gs.tourActive) { showToast('Already on tour!'); return; }
    if (gs.totalWeeks < (gs.tourCooldownEnd || 0)) { showToast(`Tour cooldown: ${(gs.tourCooldownEnd || 0) - gs.totalWeeks}w left`); return; }
    if ((gs.catalog || []).filter(t => t.released).length < 1) { showToast('Release at least 1 song first'); return; }
    const revenue = rand(tier.minRev, tier.maxRev);
    patchFn(prev => ({
      money: clamp(prev.money - tier.cost, 0, 999_000_000_000),
      tourActive: true, tourWeeksLeft: tier.weeks, tourData: { ...tier, revenue },
      energy: clamp(prev.energy - 20, 0, 100),
      news: addNews(prev.news, `${tier.label} booked! Heading out for ${tier.weeks} weeks.`, 'pos', prev.totalWeeks),
    }));
    showToast(`${tier.label} booked!`);
  };

  const onCooldown = gs.totalWeeks < (gs.tourCooldownEnd || 0);
  const cooldownLeft = Math.max(0, (gs.tourCooldownEnd || 0) - gs.totalWeeks);

  return (
    <>
      <SectionLabel>Live shows build fanbase fast</SectionLabel>

      {gs.tourActive && gs.tourData && (
        <div className="li-glass" style={{ background:'rgba(224,112,32,0.08)', borderColor:'rgba(224,112,32,0.3)', padding:16, marginBottom:16 }}>
          <div style={{ fontSize:9, letterSpacing:2, color:'var(--accent-orange)', marginBottom:4 }}>CURRENTLY ON TOUR</div>
          <div style={{ fontFamily:'var(--li-font-display)', fontSize:19, fontWeight:700 }}>{gs.tourData.label}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {((gs.tourData.weeks || 6) - gs.tourWeeksLeft)} / {gs.tourData.weeks} weeks complete
          </div>
          <div style={{ height:5, background:'var(--li-glass-border)', borderRadius:3, marginTop:8, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${((gs.tourData.weeks - gs.tourWeeksLeft) / gs.tourData.weeks) * 100}%`, background:'var(--accent-orange)', borderRadius:3 }} />
          </div>
          <div style={{ fontSize:12, color:'var(--accent-green)', fontWeight:700, marginTop:8 }}>Projected: {fmtN(gs.tourData.revenue)}</div>
        </div>
      )}

      {onCooldown && !gs.tourActive && (
        <div className="li-glass" style={{ borderColor:'rgba(214,53,72,0.3)', background:'rgba(214,53,72,0.08)', padding:'10px 12px', marginBottom:12, fontSize:11, color:'var(--accent-red)' }}>
          Tour cooldown: {cooldownLeft} week{cooldownLeft !== 1 ? 's' : ''} remaining
        </div>
      )}

      {TOUR_TIERS.map((tier, i) => {
        const locked = gs.fans < tier.minFans || gs.tourActive || onCooldown || gs.money < tier.cost;
        return (
          <Magnetic key={tier.id} strength={3} disabled={locked} onClick={() => bookTour(tier)}
            className="li-glass li-row li-stagger" style={{ '--i':i, display:'flex', gap:14, alignItems:'center', padding:14, marginBottom:10, opacity:locked?0.55:1 }}>
            <div style={{ width:44, height:44, borderRadius:12, background: tier.id === 'world' ? 'var(--accent-gold)' : 'var(--accent-orange)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" style={{ width:22, height:22, stroke:'#fff', fill:'none', strokeWidth:2, strokeLinecap:'round' }}>
                {tier.id === 'world' ? <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{tier.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tier.weeks}w · Cost {fmtN(tier.cost)} · {fmt(tier.minFans)} fans req.</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{tier.desc}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent-gold-lt)' }}>{fmtN(tier.minRev)}+</div>
              <div style={{ fontSize:9, color:'var(--text-muted)' }}>potential</div>
            </div>
          </Magnetic>
        );
      })}
    </>
  );
}
