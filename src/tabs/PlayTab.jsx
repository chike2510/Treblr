import { ACTIONS, JOBS, GENRES } from '../data';
import { clamp, fmt, fmtN, getTalent } from '../utils';

export default function PlayTab({ gs, patch, patchFn, addFeed, showToast, endWeek }) {
  const talent  = getTalent(gs);
  const genre   = GENRES.find(g => g.id === gs.genre);
  const isRichKid = gs.careerType === 'rich_kid';
  const isBroke   = gs.careerType === 'broke_underground';

  // ── Can do check ──────────────────────────────────────────────────────────
  const canDo = (a) => {
    if (gs.ap < a.cost) return false;
    if (gs.energy < 5)  return false;
    if (a.req === 'clout5'   && gs.clout   < 5)   return false;
    if (a.req === 'money1m'  && gs.money   < 1000000) return false;
    if (a.req === 'money500k'&& gs.money   < 500000)  return false;
    if (a.req === 'fans5000' && gs.fans    < 5000)    return false;
    if (a.req === 'fans10000'&& gs.fans    < 10000)   return false;
    if (a.req === 'fans25000'&& gs.fans    < 25000)   return false;
    if (a.req === 'sw7'      && gs.sw      < 7)   return false;
    if (a.req === 'sw10'     && gs.sw      < 10)  return false;
    if (a.req === 'vc5'      && gs.vc      < 5)   return false;
    if (a.special === 'manager' && gs.hasManager) return false;
    if (a.special === 'lawyer'  && gs.hasLawyer)  return false;
    if (a.special === 'merch'   && gs.hasMerch)   return false;
    if (a.special === 'tour'    && gs.tourActive)  return false;
    if (a.special === 'brand'   && gs.brandDeals?.length >= 3) return false;
    return true;
  };

  const canDoJob = (j) => {
    if (gs.ap < j.cost) return false;
    if (j.req === 'vc5'      && gs.vc   < 5)     return false;
    if (j.req === 'sw7'      && gs.sw   < 7)     return false;
    if (j.req === 'sw10'     && gs.sw   < 10)    return false;
    if (j.req === 'fans1000' && gs.fans < 1000)  return false;
    if (j.req === 'fans5000' && gs.fans < 5000)  return false;
    return true;
  };

  // ── Do action ────────────────────────────────────────────────────────────
  const doAction = (a) => {
    if (!canDo(a)) return;
    const husleMult = isBroke && a.id === 'dj_set' ? 1.4 : 1;

    patchFn(prev => {
      let next = { ...prev, ap: prev.ap - a.cost };
      const fx = { ...a.effect };

      // Apply sub-skill gains
      if (fx.sw)  next.sw  = clamp(prev.sw  + fx.sw,  0, 25);
      if (fx.vc)  next.vc  = clamp(prev.vc  + fx.vc,  0, 25);
      if (fx.pd)  next.pd  = clamp(prev.pd  + fx.pd,  0, 25);
      if (fx.lp)  next.lp  = clamp(prev.lp  + fx.lp,  0, 25);

      if (fx.genreBonus) {
        const gb = { ...(prev.genreBonus || {}) };
        gb[prev.genre] = clamp((gb[prev.genre] || 0) + fx.genreBonus, 0, 20);
        next.genreBonus = gb;
      }

      if (fx.hustle)   next.hustle   = clamp(prev.hustle   + (fx.hustle   || 0), 1, 25);
      if (fx.charisma) next.charisma = clamp(prev.charisma + (fx.charisma || 0), 1, 25);
      if (fx.network)  next.network  = clamp(prev.network  + (fx.network  || 0), 1, 25);
      if (fx.energy)   next.energy   = clamp(prev.energy   + (fx.energy   || 0), 0, 100);
      if (fx.money)    next.money    = clamp(prev.money    + (fx.money    || 0), 0, 999_000_000);

      if (fx.socialFollowers) {
        const mult = prev.careerType === 'social_media' ? 3 : 1;
        next.socialFollowers = clamp(prev.socialFollowers + fx.socialFollowers * mult, 0, 999_000_000);
      }
      if (fx.fans)  next.fans  = clamp(prev.fans  + (fx.fans  || 0), 0, 999_000_000);
      if (fx.clout) next.clout = clamp(prev.clout + (fx.clout || 0), 0, 100);

      // Specials
      if (a.special === 'manager') next.hasManager = true;
      if (a.special === 'lawyer')  next.hasLawyer  = true;
      if (a.special === 'merch') {
        next.hasMerch  = true;
        next.merchTier = 1;
        next.money     = clamp(prev.money - 2000000, 0, 999_000_000);
      }
      if (a.special === 'brand') {
        // Brand deal initiation — actual deal resolves on endWeek
        const deal = { id: Date.now(), name: 'Brand Partner', weeklyEarning: Math.round(prev.fans * 0.5), weeksLeft: 12 };
        next.brandDeals = [...(prev.brandDeals || []), deal];
        next.money = clamp(prev.money + deal.weeklyEarning * 4, 0, 999_000_000); // signing bonus
      }
      if (a.special === 'tour') {
        const totalWeeks = 6;
        const perShow    = Math.max(50000, Math.round(prev.fans * 0.8 * (isRichKid ? 0.5 : 1)));
        const total      = perShow * totalWeeks;
        next.tourActive     = true;
        next.tourWeeksLeft  = totalWeeks;
        next.tourEarnings   = total;
        next.tourData       = { totalWeeks };
        next.money          = clamp(prev.money - 3000000, 0, 999_000_000);
      }

      return next;
    });

    const desc = fx_desc(a);
    addFeed(`${a.emoji} ${a.label}${desc ? ` — ${desc}` : ''}.`);
  };

  const fx_desc = (a) => {
    const parts = [];
    const e = a.effect || {};
    if (e.sw)  parts.push(`+${e.sw} songwriting`);
    if (e.vc)  parts.push(`+${e.vc} vocals`);
    if (e.pd)  parts.push(`+${e.pd} production`);
    if (e.lp)  parts.push(`+${e.lp} live perf`);
    if (e.genreBonus) parts.push(`+genre mastery`);
    if (e.energy && e.energy > 0) parts.push(`+${e.energy} energy`);
    return parts.slice(0, 2).join(', ');
  };

  // ── Do job ───────────────────────────────────────────────────────────────
  const doJob = (j) => {
    if (!canDoJob(j)) return;
    patchFn(prev => {
      let next = { ...prev, ap: prev.ap - j.cost };
      const mult = prev.careerType === 'broke_underground' ? 1.4 : 1;
      next.money = clamp(prev.money + Math.round(j.income * mult), 0, 999_000_000);
      if (j.skillGain) {
        const k = Object.keys(j.skillGain)[0];
        if (k === 'sw') next.sw = clamp(prev.sw + j.skillGain.sw, 0, 25);
        if (k === 'vc') next.vc = clamp(prev.vc + j.skillGain.vc, 0, 25);
        if (k === 'pd') next.pd = clamp(prev.pd + j.skillGain.pd, 0, 25);
        if (k === 'lp') next.lp = clamp(prev.lp + j.skillGain.lp, 0, 25);
      }
      return next;
    });
    const mult = gs.careerType === 'broke_underground' ? 1.4 : 1;
    addFeed(`${j.emoji} ${j.label} — earned ${fmtN(Math.round(j.income * mult))}.`);
  };

  const cats = [...new Set(ACTIONS.map(a => a.cat))];

  return (
    <div>
      <div className="screen">
        {cats.map(cat => (
          <div key={cat}>
            <div className="cat-label">{cat}</div>
            <div className="actions-grid">
              {ACTIONS.filter(a => a.cat === cat).map(a => {
                const dis  = !canDo(a);
                const posE = Object.entries(a.effect || {}).filter(([k,v]) => v > 0 && k !== 'money').map(([k,v]) => `+${v} ${k}`).join(' · ');
                const negE = Object.entries(a.effect || {}).filter(([k,v]) => v < 0 && k !== 'money').map(([k,v]) => `${v} ${k}`).join(' · ');
                const monE = a.effect?.money ? (a.effect.money > 0 ? `+${fmtN(a.effect.money)}` : fmtN(a.effect.money)) : '';
                const done = (a.special === 'manager' && gs.hasManager) || (a.special === 'lawyer' && gs.hasLawyer) || (a.special === 'merch' && gs.hasMerch) || (a.special === 'tour' && gs.tourActive);
                return (
                  <div key={a.id} className={`ac${dis || done ? ' ac-dis' : ''}`} onClick={() => doAction(a)}>
                    <div className="ac-cost">{a.cost}AP</div>
                    <div className="ac-emoji">{a.emoji}</div>
                    <div className="ac-name">{a.label}</div>
                    <div className="ac-desc">{done ? '(Active)' : a.desc}</div>
                    {posE && <div className="ac-fx pos">{posE}{a.effect?.money > 0 ? ' ' + monE : ''}</div>}
                    {(negE || a.effect?.money < 0) && <div className="ac-fx neg">{negE}{a.effect?.money < 0 ? ' ' + monE : ''}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* SIDE JOBS */}
        <div className="cat-label">Side Jobs (earn cash)</div>
        <div className="actions-grid">
          {JOBS.map(j => {
            const dis = !canDoJob(j);
            const mult = gs.careerType === 'broke_underground' ? 1.4 : 1;
            return (
              <div key={j.id} className={`ac${dis ? ' ac-dis' : ''}`} onClick={() => doJob(j)}>
                <div className="ac-cost">{j.cost}AP</div>
                <div className="ac-emoji">{j.emoji}</div>
                <div className="ac-name">{j.label}</div>
                <div className="ac-desc">{j.desc}</div>
                <div className="ac-fx pos">+{fmtN(Math.round(j.income * mult))}{j.skillGain ? ` · skill+1` : ''}</div>
              </div>
            );
          })}
        </div>

        {gs.tourActive && (
          <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(0,194,224,0.25)', borderRadius: 'var(--r)', padding: '12px 14px', marginTop: 12, fontSize: 13, fontWeight: 600 }}>
            🚌 On Tour — {gs.tourWeeksLeft} week{gs.tourWeeksLeft !== 1 ? 's' : ''} remaining · {fmtN(gs.tourEarnings)} total
          </div>
        )}
      </div>

      <div className="end-week-wrap">
        <button className="btn-gold" onClick={endWeek} disabled={gs.ap < 0}>
          END WEEK →
        </button>
      </div>
    </div>
  );
}
