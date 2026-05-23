import { useState, useCallback, useEffect, useRef } from 'react';
import { LABELS } from './data/constants';
import { fmt, fmtN, getTier, getEra, getTimeLabel, getTalent } from './engine/utils';
import { endWeek as doEndWeek, handleModalChoice } from './engine/weekEngine';

import HomeTab     from './tabs/HomeTab';
import SkillsTab   from './tabs/SkillsTab';
import StudioTab   from './tabs/StudioTab';
import SocialTab   from './tabs/SocialTab';
import WorldTab    from './tabs/WorldTab';
import BusinessTab from './tabs/BusinessTab';
import LabelTab    from './tabs/LabelTab';
import StatsTab    from './tabs/StatsTab';
import SettingsTab from './tabs/SettingsTab';
import WeeklyReport from './components/WeeklyReport';

// ── Tab icons ─────────────────────────────────────────────────────────────────
const Icons = {
  home:     () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  skills:   () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  studio:   () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  social:   () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  world:    () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  biz:      () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  label:    () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  stats:    () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// Modal SVG icons — no emojis
const ModalIcon = ({ ev }) => {
  if (ev?.id === 'award_nom' || ev?.id === 'award_win')
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#FFD700',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
  if (ev?.neg)
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#f97316',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'#a855f7',margin:'0 auto 10px',display:'block' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
};

const TABS = [
  { id:'home',     label:'Home',   Icon:Icons.home },
  { id:'skills',   label:'Skills', Icon:Icons.skills },
  { id:'studio',   label:'Studio', Icon:Icons.studio },
  { id:'social',   label:'Social', Icon:Icons.social },
  { id:'world',    label:'World',  Icon:Icons.world },
  { id:'business', label:'Biz',    Icon:Icons.biz },
  { id:'label',    label:'Label',  Icon:Icons.label },
  { id:'stats',    label:'Stats',  Icon:Icons.stats },
  { id:'settings', label:'Set.',   Icon:Icons.settings },
];

// HUD shown only on these tabs
const HUD_TABS = new Set(['home', 'stats']);

export default function Game({ gs, setGs }) {
  const [toast,       setToast]       = useState(null);
  const [modal,       setModal]       = useState(null);
  const [showReport,  setShowReport]  = useState(false);
  const [isEndingWeek,setIsEndingWeek]= useState(false);
  const toastTimer = useRef(null);

  const patch   = useCallback(upd => setGs(prev => ({ ...prev, ...upd })), [setGs]);
  const patchFn = useCallback(fn  => setGs(prev => ({ ...prev, ...fn(prev) })), [setGs]);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Consume pending side-effects safely via useEffect
  useEffect(() => {
    if (gs._pendingToast) {
      showToast(gs._pendingToast);
      setGs(prev => ({ ...prev, _pendingToast: null }));
    }
  }, [gs._pendingToast]);

  useEffect(() => {
    if (gs._pendingModal) {
      setModal(gs._pendingModal);
      setGs(prev => ({ ...prev, _pendingModal: null }));
    }
  }, [gs._pendingModal]);

  const handleEndWeek = useCallback(() => {
    if (isEndingWeek) return;
    setIsEndingWeek(true);
    setGs(prev => doEndWeek(prev, showToast, setModal));
    setTimeout(() => { setShowReport(true); setIsEndingWeek(false); }, 80);
  }, [setGs, showToast, isEndingWeek]);

  const handleReportClose = useCallback(() => {
    setShowReport(false);
    setGs(prev => ({ ...prev, weekReport: null }));
  }, [setGs]);

  const handleChoice = useCallback((opt) => {
    patchFn(prev => handleModalChoice(prev, opt, showToast));
    setModal(null);
  }, [patchFn, showToast]);

  const label   = LABELS.find(l => l.id === gs.labelId) || LABELS[0];
  const era     = getEra(gs.fans);
  const timeStr = getTimeLabel(gs.totalWeeks, gs.startYear);
  const showHud = HUD_TABS.has(gs.tab);

  const tabProps = { gs, patch, patchFn, showToast, endWeek: handleEndWeek, isEndingWeek };

  return (
    <div className="app-shell">

      {/* ── FULL HUD (Home + Stats only) ──────────────────────────────── */}
      {showHud && (
        <div className="hud">
          <div className="hud-row1">
            <div>
              <div className="hud-name">{gs.stageName}</div>
              <div className="hud-era">{era.label}</div>
            </div>
            <div className="hud-right">
              <div className="hud-money">{fmtN(gs.money)}</div>
              <div className="hud-time">{timeStr}</div>
            </div>
          </div>
          <div className="hud-stats-row">
            {[
              { l:'Fans',   v:fmt(gs.fans),        c:'var(--accent-gold-lt)' },
              { l:'Clout',  v:gs.clout,             c:'var(--accent-purple)' },
              { l:'Talent', v:getTalent(gs),         c:'var(--accent-cyan)' },
              { l:'Social', v:fmt(Object.values(gs.socialPlatforms||{}).reduce((a,b)=>a+(b||0),0)), c:'var(--text-secondary)' },
            ].map(({ l,v,c }) => (
              <div key={l} className="hstat">
                <div className="hstat-l">{l}</div>
                <div className="hstat-v" style={{ color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="hud-bars">
            <div className="hud-bar-row">
              <div className="hud-bar-label">NRG</div>
              <div className="hud-bar-track">
                <div className="hud-bar-fill" style={{ width:`${gs.energy}%`, background:gs.energy>60?'var(--accent-green)':gs.energy>30?'var(--accent-gold)':'var(--accent-red)' }} />
              </div>
              <div className="hud-bar-val">{gs.energy}%</div>
            </div>
            <div className="hud-pips-row">
              <div className="hud-pips-label">SP</div>
              <div className="pip-group">
                {Array.from({length:5}).map((_,i)=><div key={i} className={`pip${i>=(gs.sp||0)?' used':''}`}/>)}
              </div>
              <div className="pip-group" style={{marginLeft:8}}>
                {Array.from({length:gs.maxSe||7}).map((_,i)=><div key={i} className={`pip pip-se${i>=(gs.se||0)?' used':''}`}/>)}
              </div>
              <div style={{fontSize:9,color:'var(--text-muted)',marginLeft:4}}>SE</div>
            </div>
          </div>
          <div className="label-badge">
            <div className="lb-dot" style={{background:label.color}}/>
            <div>
              <div className="lb-name" style={{color:label.color}}>
                {gs.ownLabel&&gs.labelId==='independent'?gs.ownLabel.name:label.name}
              </div>
              <div className="lb-split">{label.artistSplit}% to you · CC {label.creativeControl}%</div>
            </div>
            {gs.tourActive&&<div style={{marginLeft:'auto',fontSize:9,color:'var(--accent-orange)',fontWeight:700}}>TOUR · {gs.tourWeeksLeft}wk left</div>}
            {!gs.tourActive&&label.id!=='independent'&&(
              <div className="lb-pressure">
                {Array.from({length:5}).map((_,i)=><div key={i} className={`lp-dot${i<Math.round(gs.pressure)?' hi':''}`}/>)}
              </div>
            )}
            {(gs.awards||[]).length>0&&(
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:3,fontSize:9,color:'#FFD700',fontWeight:700}}>
                <svg viewBox="0 0 24 24" style={{width:11,height:11,fill:'#FFD700'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {gs.awards.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SLIM TOP BAR (all other tabs) ─────────────────────────────── */}
      {!showHud && (
        <div className="slim-bar">
          <div className="slim-bar-left">
            <div className="slim-name">{gs.stageName}</div>
            <div className="slim-era">{era.label.replace(' Era','')}</div>
          </div>
          <div className="slim-bar-right">
            <div className="slim-money">{fmtN(gs.money)}</div>
            <div className="slim-time">{timeStr}</div>
          </div>
        </div>
      )}

      {/* ── ACTIVE TAB ──────────────────────────────────────────────── */}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {gs.tab==='home'     && <HomeTab     {...tabProps}/>}
        {gs.tab==='skills'   && <SkillsTab   {...tabProps}/>}
        {gs.tab==='studio'   && <StudioTab   {...tabProps}/>}
        {gs.tab==='social'   && <SocialTab   {...tabProps}/>}
        {gs.tab==='world'    && <WorldTab    {...tabProps}/>}
        {gs.tab==='business' && <BusinessTab {...tabProps}/>}
        {gs.tab==='label'    && <LabelTab    {...tabProps}/>}
        {gs.tab==='stats'    && <StatsTab    {...tabProps}/>}
        {gs.tab==='settings' && <SettingsTab {...tabProps}/>}
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${gs.tab===t.id?' on':''}`} onClick={() => patch({tab:t.id})}>
            <span className="tab-btn-icon"><t.Icon/></span>
            <span className="tab-btn-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── WEEKLY REPORT ───────────────────────────────────────────── */}
      {showReport&&gs.weekReport&&(
        <WeeklyReport report={gs.weekReport} stageName={gs.stageName} genre={gs.genre} onContinue={handleReportClose}/>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────── */}
      {modal&&(
        <div className="overlay" onClick={()=>!modal.event?.choice&&setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <ModalIcon ev={modal.event}/>
            <div className="modal-title">{modal.event.label}</div>
            <div className="modal-desc">{modal.event.desc}</div>
            {modal.event.effect&&!modal.event.choice&&(
              <div className="effect-chips">
                {Object.entries(modal.event.effect).map(([k,v])=>(
                  <div key={k} className={`effect-chip ${v>0?'pos':'neg'}`}>
                    {v>0?'+':''}{k==='money'?fmtN(v):v} {k!=='money'?k:''}
                  </div>
                ))}
              </div>
            )}
            {modal.event.choice?(
              <div className="modal-choices">
                {modal.event.options.map((opt,i)=>(
                  <button key={i} className="choice-btn" onClick={()=>handleChoice(opt)}>
                    {opt.text}
                    <div className="choice-btn-sub">
                      {Object.entries(opt.effect).filter(([k])=>!['dropped','renegotiate'].includes(k)).map(([k,v])=>`${v>0?'+':''}${k==='money'?fmtN(v):v} ${k!=='money'?k:''}`).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            ):(
              <button className="btn btn-primary btn-full" onClick={()=>setModal(null)}>GOT IT</button>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────────────── */}
      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}
