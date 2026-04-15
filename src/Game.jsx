import { useState, useCallback } from 'react';
import { GENRES, CITIES, LABELS, LABEL_EVENTS, RANDOM_EVENTS, NPC_ARTISTS, MILESTONES } from './data';
import {
  clamp, fmt, fmtN, roll, uid, rand, getTier, getTalent,
  getTimeLabel, getTimeInfo, calcWeeklyIncome, generateCharts, saveGame
} from './utils';
import PlayTab    from './tabs/PlayTab';
import StudioTab  from './tabs/StudioTab';
import SceneTab   from './tabs/SceneTab';
import LabelTab   from './tabs/LabelTab';
import StatsTab   from './tabs/StatsTab';
import FeedTab    from './tabs/FeedTab';

const TABS = [
  { id:'play',   label:'Play',   icon:'🎮' },
  { id:'studio', label:'Studio', icon:'🎙️' },
  { id:'scene',  label:'Scene',  icon:'🌍' },
  { id:'label',  label:'Label',  icon:'🏷️' },
  { id:'stats',  label:'Stats',  icon:'📊' },
  { id:'feed',   label:'Feed',   icon:'📡' },
];

export default function Game({ gs, setGs }) {
  const [toast, setToast]   = useState(null);
  const [modal, setModal]   = useState(null);

  const patch   = useCallback(upd   => setGs(prev => ({ ...prev, ...upd })),   [setGs]);
  const patchFn = useCallback(fn    => setGs(prev => ({ ...prev, ...fn(prev) })), [setGs]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const addFeed = useCallback((msg, type = '') => {
    setGs(prev => ({
      ...prev,
      feed: [{ msg, type, week: prev.totalWeeks }, ...prev.feed].slice(0, 50),
    }));
  }, [setGs]);

  // ── END WEEK ────────────────────────────────────────────────────────────────
  const endWeek = useCallback(() => {
    setGs(prev => {
      const label   = LABELS.find(l => l.id === prev.labelId) || LABELS[0];
      const cityObj = CITIES.find(c => c.id === prev.city);
      const careerType = prev.careerType;

      let next = { ...prev, totalWeeks: prev.totalWeeks + 1, ap: 7 };

      // Energy recovers
      next.energy = clamp(next.energy + 18, 0, 100);

      // ── Streaming income ──
      const rawIncome   = calcWeeklyIncome(next, label);
      const artistShare = label.id === 'independent' ? rawIncome : Math.round(rawIncome * label.artistSplit / 100);
      const labelShare  = rawIncome - artistShare;
      next.weeklyStreamIncome = artistShare;

      // Recoupment
      if (label.id !== 'independent' && next.recouped < label.advance) {
        next.recouped = Math.min(next.recouped + labelShare, label.advance);
      }

      // Manager cost
      const managerCost = next.hasManager ? 200000 : 0;
      // Lawyer retainer
      const lawyerCost  = next.hasLawyer  ? 100000 : 0;

      // Tour week
      if (next.tourActive && next.tourWeeksLeft > 0) {
        const tourWeekEarning = next.tourEarnings / (next.tourData?.totalWeeks || 6);
        next.money = clamp(next.money + Math.round(tourWeekEarning), 0, 999_000_000);
        next.lp = clamp(next.lp + 1, 0, 25);
        next.tourWeeksLeft -= 1;
        if (next.tourWeeksLeft === 0) {
          next.tourActive = false;
          next.tourData   = null;
          next.feed = [{ msg: `🚌 Tour wrapped! You played every show.`, type: 'pos', week: next.totalWeeks }, ...next.feed].slice(0, 50);
        }
      }

      // Money update
      next.money = clamp(next.money + artistShare - managerCost - lawyerCost, 0, 999_000_000);

      // Tax accumulation (20% quarterly)
      next.taxAccum = (next.taxAccum || 0) + Math.round(artistShare * 0.20);
      const weekInMonth = (next.totalWeeks % 4) + 1;
      const monthIdx    = Math.floor(next.totalWeeks / 4) % 12;
      if (monthIdx % 3 === 0 && weekInMonth === 1 && next.totalWeeks > 0) {
        // Quarterly tax due
        if (next.taxAccum > 0) {
          next.money = clamp(next.money - next.taxAccum, 0, 999_000_000);
          next.feed = [{ msg: `🧾 Quarterly tax paid: ${fmtN(next.taxAccum)}.`, type: 'neg', week: next.totalWeeks }, ...next.feed].slice(0, 50);
          next.taxAccum = 0;
        }
      }

      // Clout-based organic fan growth (slower scaling)
      const organicGrowth = Math.round(next.clout * 0.8 + next.socialFollowers * 0.001);
      next.fans = clamp(next.fans + organicGrowth, 0, 999_000_000);

      // Social follower passive growth
      next.socialFollowers = clamp(next.socialFollowers + Math.round(next.fans * 0.0005), 0, 999_000_000);

      // Label pressure builds
      if (label.id !== 'independent') {
        next.pressure = clamp(next.pressure + 0.4, 0, 10);
        next.labelRel = clamp(next.labelRel - 0.3, 0, 100);
      }

      // Chart update (monthly)
      if (Math.floor(next.totalWeeks / 4) !== Math.floor(prev.totalWeeks / 4)) {
        next.charts = generateCharts(next, NPC_ARTISTS);
        // Update player tracks chart position
        next.catalog = next.catalog.map(track => {
          if (!track.released) return track;
          const chartEntry = next.charts.find(c => c.trackId === track.id);
          return { ...track, chartPos: chartEntry ? chartEntry.position : null };
        });
      }

      // ── Random world event (45% chance) ──
      if (Math.random() < 0.45) {
        const eligible = RANDOM_EVENTS.filter(ev => {
          if (ev.minWeeks && next.totalWeeks < ev.minWeeks) return false;
          if (ev.minFans  && next.fans  < ev.minFans)       return false;
          if (ev.maxFans  && next.fans  > ev.maxFans)       return false;
          if (ev.id === 'award_nom') {
            // Real award criteria: good songs, real fans
            const hasGoodSong = next.catalog.some(t => t.released && t.quality >= 65);
            if (!hasGoodSong || next.fans < 50000 || next.awardNoms >= 3) return false;
          }
          return true;
        });
        if (eligible.length > 0) {
          const ev = roll(eligible);
          // Apply effect
          const fx = ev.effect || {};
          if (fx.fans)       next.fans       = clamp(next.fans       + fx.fans,       0, 999_000_000);
          if (fx.money)      next.money      = clamp(next.money      + fx.money,      0, 999_000_000);
          if (fx.clout)      next.clout      = clamp(next.clout      + fx.clout,      0, 100);
          if (fx.energy)     next.energy     = clamp(next.energy     + fx.energy,     0, 100);
          if (fx.reputation) next.reputation = clamp(next.reputation + fx.reputation, 0, 100);
          if (fx.sw)         next.sw         = clamp(next.sw         + fx.sw,         0, 25);
          if (fx.network)    next.network    = clamp(next.network    + fx.network,    1, 20);
          if (ev.id === 'award_nom') next.awardNoms = (next.awardNoms || 0) + 1;

          setTimeout(() => setModal({ type: 'world_event', event: ev }), 100);
        }
      }

      // ── Label event (25% chance if signed) ──
      if (label.id !== 'independent' && Math.random() < 0.25) {
        const ev = roll(LABEL_EVENTS.filter(e => e.id !== 'dropped_risk'));
        if (ev.choice) {
          setTimeout(() => setModal({ type: 'label_event', event: ev }), 200);
        } else if (ev.effect) {
          const fx = ev.effect;
          if (fx.fans)     next.fans     = clamp(next.fans     + (fx.fans  || 0), 0, 999_000_000);
          if (fx.money)    next.money    = clamp(next.money    + (fx.money || 0), 0, 999_000_000);
          if (fx.clout)    next.clout    = clamp(next.clout    + (fx.clout || 0), 0, 100);
          if (fx.pressure) next.pressure = clamp(next.pressure + (fx.pressure || 0), 0, 10);
          if (fx.labelRel) next.labelRel = clamp(next.labelRel + (fx.labelRel || 0), 0, 100);
          next.feed = [{ msg: `${ev.emoji} ${ev.label} — ${ev.desc}`, type: ev.id === 'promo_push' || ev.id === 'bonus_payment' ? 'pos' : 'neg', week: next.totalWeeks }, ...next.feed].slice(0, 50);
        }
      }

      // ── Drop risk ──
      if (label.id !== 'independent' && next.pressure >= label.pressureThreshold * 3 && Math.random() < 0.3) {
        const ev = LABEL_EVENTS.find(e => e.id === 'dropped_risk');
        setTimeout(() => setModal({ type: 'label_event', event: ev }), 300);
      }

      // ── Tier up check ──
      const oldTier = getTier(prev.fans);
      const newTier = getTier(next.fans);
      if (newTier.tier !== oldTier.tier) {
        setTimeout(() => showToast(`🏆 TIER UP: ${newTier.tier.toUpperCase()}`), 400);
        next.clout = clamp(next.clout + 5, 0, 100);
        next.feed = [{ msg: `🎯 New tier: ${newTier.tier}! Industry is taking notice.`, type: 'pos', week: next.totalWeeks }, ...next.feed].slice(0, 50);
      }

      // Feed: weekly income
      next.feed = [{ msg: `📅 ${getTimeLabel(next.totalWeeks, next.startYear, next.startAge)} — Stream income: ${fmtN(artistShare)}.`, type: '', week: next.totalWeeks }, ...next.feed].slice(0, 50);

      // Auto-save
      setTimeout(() => saveGame(next), 100);

      return next;
    });
  }, [setGs, showToast]);

  // ── MODAL CHOICE HANDLER ──────────────────────────────────────────────────
  const handleChoice = useCallback((opt) => {
    const fx = opt.effect || {};
    patchFn(prev => {
      let next = { ...prev };
      if (fx.dropped) {
        next.labelId  = 'independent';
        next.labelRel = 0; next.pressure = 0; next.recouped = 0;
        next.feed = [{ msg: '🚫 Dropped by label. Back to independent.', type: 'neg', week: prev.totalWeeks }, ...prev.feed].slice(0, 50);
        showToast('DROPPED — NOW INDEPENDENT');
      }
      if (fx.renegotiate) {
        if (prev.clout >= 40) {
          next.pressure = 0;
          next.labelRel = clamp(prev.labelRel + 15, 0, 100);
          next.feed = [{ msg: '📝 Renegotiated deal. Pressure reset.', type: 'pos', week: prev.totalWeeks }, ...prev.feed].slice(0, 50);
        } else {
          next.pressure = clamp(prev.pressure + 2, 0, 10);
          next.feed = [{ msg: '❌ Not enough clout to renegotiate. Need 40+.', type: 'neg', week: prev.totalWeeks }, ...prev.feed].slice(0, 50);
        }
      }
      if (fx.fans)     next.fans     = clamp(prev.fans     + (fx.fans     || 0), 0, 999_000_000);
      if (fx.money)    next.money    = clamp(prev.money    + (fx.money    || 0), 0, 999_000_000);
      if (fx.clout)    next.clout    = clamp(prev.clout    + (fx.clout    || 0), 0, 100);
      if (fx.energy)   next.energy   = clamp(prev.energy   + (fx.energy   || 0), 0, 100);
      if (fx.pressure) next.pressure = clamp(prev.pressure + (fx.pressure || 0), 0, 10);
      if (fx.labelRel) next.labelRel = clamp(prev.labelRel + (fx.labelRel || 0), 0, 100);
      return next;
    });
    setModal(null);
  }, [patchFn, showToast]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  const label    = LABELS.find(l => l.id === gs.labelId) || LABELS[0];
  const tier     = getTier(gs.fans);
  const talent   = getTalent(gs);
  const timeStr  = getTimeLabel(gs.totalWeeks, gs.startYear, gs.startAge);
  const genreObj = GENRES.find(g => g.id === gs.genre);
  const cityObj  = CITIES.find(c => c.id === gs.city);
  const eColor   = gs.energy > 60 ? 'var(--green-lt)' : gs.energy > 30 ? 'var(--gold-lt)' : 'var(--red-lt)';

  const tabProps = { gs, patch, patchFn, addFeed, showToast, endWeek };

  return (
    <>
      {/* TAB BAR */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${gs.tab === t.id ? ' on' : ''}`} onClick={() => patch({ tab: t.id })}>
            <span className="tab-btn-icon">{t.icon}</span>
            <span className="tab-btn-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="hud-name">{gs.stageName}</div>
            <div className="hud-meta">{genreObj?.label} · {cityObj?.label}</div>
          </div>
          <div className="hud-right">
            <div className="tier-chip" style={{ color: tier.color, borderColor: tier.color + '50' }}>{tier.tier}</div>
            <div className="hud-time">{timeStr}</div>
          </div>
        </div>
        <div className="hud-stats">
          <div className="hstat"><div className="hstat-l">Fans</div><div className="hstat-v" style={{ color: 'var(--gold-lt)' }}>{fmt(gs.fans)}</div></div>
          <div className="hstat"><div className="hstat-l">Cash</div><div className="hstat-v" style={{ color: 'var(--green-lt)' }}>₦{fmt(gs.money)}</div></div>
          <div className="hstat"><div className="hstat-l">Clout</div><div className="hstat-v" style={{ color: 'var(--purple-lt)' }}>{gs.clout}</div></div>
          <div className="hstat"><div className="hstat-l">Talent</div><div className="hstat-v" style={{ color: 'var(--blue)' }}>{talent}</div></div>
        </div>
        <div className="energy-row">
          <span>Energy</span>
          <div className="e-bar"><div className="e-bar-fill" style={{ width: `${gs.energy}%`, background: eColor }} /></div>
          <span>{gs.energy}%</span>
        </div>
        <div className="ap-row">
          <div className="ap-label">AP — {gs.ap} left</div>
          <div className="ap-pips">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className={`pip${i >= gs.ap ? ' used' : ''}`} />)}
          </div>
        </div>
        <div className="label-badge">
          <div className="lb-dot" style={{ background: label.color }} />
          <div>
            <div className="lb-name" style={{ color: label.color }}>{label.name}</div>
            <div className="lb-split">{label.artistSplit}% to you · CC {label.creativeControl}%</div>
          </div>
          <div className="lb-pressure">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`lp-dot${i < Math.round(gs.pressure) ? ' hi' : ''}`} />)}
          </div>
        </div>
      </div>

      {/* ACTIVE TAB */}
      {gs.tab === 'play'   && <PlayTab   {...tabProps} />}
      {gs.tab === 'studio' && <StudioTab {...tabProps} />}
      {gs.tab === 'scene'  && <SceneTab  {...tabProps} />}
      {gs.tab === 'label'  && <LabelTab  {...tabProps} />}
      {gs.tab === 'stats'  && <StatsTab  {...tabProps} />}
      {gs.tab === 'feed'   && <FeedTab   {...tabProps} />}

      {/* MODAL */}
      {modal && (
        <div className="overlay" onClick={() => !modal.event?.choice && setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            {modal.type === 'world_event' && (
              <>
                <div className="modal-emoji">{modal.event.emoji}</div>
                <div className="modal-title">{modal.event.label}</div>
                <div className="modal-desc">{modal.event.desc}</div>
                <div className="effect-chips">
                  {Object.entries(modal.event.effect || {}).map(([k, v]) => (
                    <div key={k} className={`chip${v > 0 ? ' pos' : ' neg'}`}>
                      {v > 0 ? '+' : ''}{k === 'money' ? fmtN(v) : v} {k !== 'money' ? k : ''}
                    </div>
                  ))}
                </div>
                <button className="modal-dismiss" onClick={() => setModal(null)}>GOT IT 🤙</button>
              </>
            )}
            {modal.type === 'label_event' && (
              <>
                <div className="modal-emoji">{modal.event.emoji}</div>
                <div className="modal-title">{modal.event.label}</div>
                <div className="modal-desc">{modal.event.desc}</div>
                {modal.event.choice && (
                  <div className="modal-choices">
                    {modal.event.options.map((opt, i) => (
                      <button key={i} className="choice-btn" onClick={() => handleChoice(opt)}>
                        {opt.text}
                        <div className="choice-btn-sub">
                          {Object.entries(opt.effect)
                            .filter(([k]) => !['dropped','renegotiate'].includes(k))
                            .map(([k, v]) => `${v > 0 ? '+' : ''}${k === 'money' ? fmtN(v) : v} ${k !== 'money' ? k : ''}`)
                            .join(' · ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!modal.event.choice && <button className="modal-dismiss" onClick={() => setModal(null)}>OK</button>}
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
