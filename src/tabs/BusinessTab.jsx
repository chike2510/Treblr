import { useState } from 'react';
import { MERCH_TYPES } from '../data/constants';
import { clamp, fmt, fmtN, uid, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

const MERCH_COOLDOWN = 4;
const BRAND_COOLDOWN = 8;

export default function BusinessTab({ gs, patch, patchFn, showToast }) {
  const [view, setView] = useState('merch');

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        {['merch','brands'].map(v => (
          <div key={v} className={`sub-tab${view===v?' on':''}`} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </div>
        ))}
      </div>

      {view === 'merch'  && <MerchView  gs={gs} patchFn={patchFn} showToast={showToast} />}
      {view === 'brands' && <BrandsView gs={gs} patchFn={patchFn} showToast={showToast} />}
    </div>
  );
}

function MerchView({ gs, patchFn, showToast }) {
  const [selectedType, setSelectedType] = useState('tshirt');
  const [quantity, setQuantity]         = useState(500);
  const [price, setPrice]               = useState(25000);

  const type = MERCH_TYPES.find(t => t.id === selectedType) || MERCH_TYPES[0];
  const productionCost = type.costPer * quantity;
  const estimatedRevenue = Math.round(price * quantity * 0.65); // ~65% sell-through
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
        {
          id: uid(),
          type: type.label,
          qty: quantity,
          price,
          cost: productionCost,
          revenue: estimatedRevenue,
          weeksLeft: 4,
          weekStarted: prev.totalWeeks,
        }
      ],
      news: addNews(prev.news, `Merch drop! ${quantity} ${type.label}s at ₦${(price/1000).toFixed(0)}k. Revenue streams over 4 weeks.`, 'pos', prev.totalWeeks),
    }));
    showToast(`${type.label} merch launched!`);
  };

  // Merch icons as simple ASCII-style text in colored boxes
  const MerchIcon = ({ typeId }) => {
    const icons = { tshirt:'T', hoodie:'H', cap:'C', vinyl:'V', poster:'P', boxset:'B' };
    return <div style={{ fontSize:16, fontWeight:900, fontFamily:'var(--font-display)' }}>{icons[typeId] || 'M'}</div>;
  };

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Merch Drop</div>
        <div className="sec-sub">{(gs.activeMerchDrops || []).length} active</div>
      </div>

      {/* Active drops */}
      {(gs.activeMerchDrops || []).length > 0 && (
        <div className="card" style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>Active Drops</div>
          {(gs.activeMerchDrops || []).map(drop => (
            <div key={drop.id} className="track-row">
              <div className="track-info">
                <div className="track-title">{drop.type}</div>
                <div className="track-meta">{drop.qty} units · {drop.weeksLeft}w remaining</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-green)' }}>+{fmtN(Math.round(drop.revenue / 4))}/wk</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requirements */}
      {gs.fans < 5000 && (
        <div style={{ fontSize:11, color:'var(--accent-red)', background:'rgba(214,53,72,0.08)', borderRadius:'var(--r)', padding:'10px 12px', marginBottom:12 }}>
          Need 5,000 fans to launch merch. ({fmt(gs.fans)} current)
        </div>
      )}

      {weeksUntilMerch > 0 && (
        <div style={{ fontSize:11, color:'var(--accent-orange)', background:'rgba(224,112,32,0.08)', borderRadius:'var(--r)', padding:'10px 12px', marginBottom:12 }}>
          Merch cooldown: {weeksUntilMerch} week{weeksUntilMerch !== 1 ? 's' : ''} remaining
        </div>
      )}

      {/* Item selector */}
      <div style={{ fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>Item Type</div>
      <div className="merch-types" style={{ marginBottom:16 }}>
        {MERCH_TYPES.map(t => (
          <div key={t.id} className={`merch-type-btn${selectedType===t.id?' on':''}`} onClick={() => { setSelectedType(t.id); setPrice(t.suggestedPrice); }}>
            <div className="merch-type-icon"><MerchIcon typeId={t.id} /></div>
            <div className="merch-type-name">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Quantity slider */}
      <div className="slider-row">
        <div className="slider-label">
          <span className="slider-label-text">Quantity</span>
          <span className="slider-label-val">{quantity.toLocaleString()}</span>
        </div>
        <input type="range" min={100} max={10000} step={100} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
      </div>

      {/* Price slider */}
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

      {/* Summary */}
      <div className="merch-summary">
        <div className="merch-sum-item">
          <div className="merch-sum-label">Prod. Cost</div>
          <div className="merch-sum-val" style={{ color: gs.money >= productionCost ? 'var(--text-primary)' : 'var(--accent-red)' }}>{fmtN(productionCost)}</div>
        </div>
        <div className="merch-sum-item">
          <div className="merch-sum-label">Est. Revenue</div>
          <div className="merch-sum-val" style={{ color:'var(--accent-green)' }}>{fmtN(estimatedRevenue)}</div>
        </div>
        <div className="merch-sum-item">
          <div className="merch-sum-label">Est. Profit</div>
          <div className="merch-sum-val" style={{ color: profit > 0 ? 'var(--accent-gold-lt)' : 'var(--accent-red)' }}>{fmtN(profit)}</div>
        </div>
      </div>

      <button className="btn btn-primary btn-full" style={{ marginTop:16 }} disabled={!canDrop} onClick={doDrop}>
        LAUNCH MERCH DROP
      </button>
    </>
  );
}

function BrandsView({ gs, patchFn, showToast }) {
  const BRAND_DEALS = [
    { id:'fashion',  label:'Fashion Brand',    minFans:10000,  income:2000000,   desc:'Apparel collab or campaign.' },
    { id:'food',     label:'Beverage Brand',   minFans:25000,  income:5000000,   desc:'Sponsor a drink or food brand.' },
    { id:'tech',     label:'Tech Partnership', minFans:50000,  income:10000000,  desc:'Phone, headphone or app deal.' },
    { id:'luxury',   label:'Luxury Collab',    minFans:200000, income:30000000,  desc:'Premium fashion or watch brand.' },
    { id:'streaming',label:'Streaming Deal',   minFans:100000, income:15000000,  desc:'Exclusive partnership with a platform.' },
  ];

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
      <div className="sec-head">
        <div className="sec-title">Brand Deals</div>
        <div className="sec-sub">{(gs.brandDeals || []).length} signed</div>
      </div>

      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:16 }}>
        Each brand category has an 8-week cooldown. More fans = higher offers.
      </div>

      {BRAND_DEALS.map(deal => {
        const lastWeek = (gs.lastBrandWeek || {})[deal.id] || -99;
        const cooldown = Math.max(0, BRAND_COOLDOWN - (gs.totalWeeks - lastWeek));
        const locked = gs.fans < deal.minFans || cooldown > 0;
        const estimatedIncome = Math.round(deal.income * (1 + (gs.clout / 200)));

        return (
          <div
            key={deal.id}
            className={`tour-card${locked ? ' locked' : ''}`}
            onClick={() => !locked && doBrand(deal)}
          >
            <div className="tour-icon" style={{ background:'var(--accent-purple)' }}>
              <svg viewBox="0 0 24 24" style={{ width:24, height:24, stroke:'#fff', fill:'none', strokeWidth:2, strokeLinecap:'round' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className="tour-info">
              <div className="tour-name">{deal.label}</div>
              <div className="tour-stats">{deal.desc} · {fmt(deal.minFans)} fans req.</div>
              {cooldown > 0 && <div style={{ fontSize:10, color:'var(--accent-red)', marginTop:2 }}>Cooldown: {cooldown}w</div>}
            </div>
            <div>
              <div className="tour-revenue">~{fmtN(estimatedIncome)}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
