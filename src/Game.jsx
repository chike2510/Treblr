import { useState, useCallback, useEffect, useRef } from 'react';
import { fmtN, getEra, getTimeLabel } from './engine/utils';
import { endWeek as doEndWeek, handleModalChoice } from './engine/weekEngine';

import HomeTab     from './tabs/HomeTab';
import CreateTab   from './tabs/CreateTab';
import SocialTab   from './tabs/SocialTab';
import BusinessTab from './tabs/BusinessTab';
import ProfileTab  from './tabs/ProfileTab';
import WeeklyReport from './components/WeeklyReport';

// ── Tab icons ─────────────────────────────────────────────────────────────────
const Icons = {
  home:     () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  create:   () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  social:   () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  business: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  profile:  () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// Modal SVG icons — no emojis
const ModalIcon = ({ ev }) => {
  if (ev?.id === 'award_nom' || ev?.id === 'award_win')
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#FFD700',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
  if (ev?.neg)
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#f97316',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'#a855f7',margin:'0 auto 10px',display:'block' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
};

// ── 5 major tabs. Everything else lives inside these via sub-nav. ─────────────
const TABS = [
  { id:'home',     label:'Home',     Icon:Icons.home },
  { id:'create',   label:'Create',   Icon:Icons.create },
  { id:'social',   label:'Social',   Icon:Icons.social },
  { id:'business', label:'Business', Icon:Icons.business },
  { id:'profile',  label:'Profile',  Icon:Icons.profile },
];

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

  const era     = getEra(gs.fans);
  const timeStr = getTimeLabel(gs.totalWeeks, gs.startYear);

  const tabProps = { gs, patch, patchFn, showToast, endWeek: handleEndWeek, isEndingWeek };

  return (
    <div className="app-shell">

      {/* ── PERSISTENT TOP BAR — same on every tab, lightweight wayfinding only.
             No fans/clout/talent/social here — that lives in Profile now. ── */}
      <div className="li-topbar">
        <div>
          <div className="li-topbar-name">{gs.stageName}</div>
          <div className="li-topbar-era">{era.label.replace(' Era','')}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="li-topbar-money">{fmtN(gs.money)}</div>
          <div className="li-topbar-time">{timeStr}</div>
        </div>
      </div>

      {/* ── ACTIVE TAB ──────────────────────────────────────────────── */}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {gs.tab==='home'     && <HomeTab     {...tabProps}/>}
        {gs.tab==='create'   && <CreateTab   {...tabProps}/>}
        {gs.tab==='social'   && <SocialTab   {...tabProps}/>}
        {gs.tab==='business' && <BusinessTab {...tabProps}/>}
        {gs.tab==='profile'  && <ProfileTab  {...tabProps}/>}
      </div>

      {/* ── TAB BAR — 5 tabs, no more horizontal squeeze ──────────────── */}
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
