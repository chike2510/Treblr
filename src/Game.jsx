import { useState, useCallback, useEffect, useRef } from 'react';
import { fmtN as formatCurrency, getEra, getTimeLabel } from './engine/utils';
import { endWeek as doEndWeek, handleModalChoice } from './engine/weekEngine';
import { getActionPoints, WEEKLY_ACTION_POINTS } from './engine/actionPoints';
import { PlayerAvatar } from './components/Living';

import HomeTab     from './tabs/HomeTab';
import CreateTab   from './tabs/CreateTab';
import NewsTab     from './tabs/NewsTab';
import BusinessTab from './tabs/BusinessTab';
import ProfileTab  from './tabs/ProfileTab';
import WeeklyReport from './components/WeeklyReport';

const Icons = {
  home: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  music: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  news: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><rect x="3" y="4" width="15" height="16" rx="1"/><path d="M7 8h7M7 12h7M7 16h4"/><path d="M18 8h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2"/></svg>,
  career: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M2 12h20"/></svg>,
  profile: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  city: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01"/></svg>,
  tour: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="12" r="2"/><circle cx="10" cy="17" r="2"/></svg>,
  collab: () => <svg viewBox="0 0 24 24" className="tab-icon-svg"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></svg>,
};

const TABS = [
  { id:'home', label:'Home', Icon:Icons.home },
  { id:'create', label:'Music', Icon:Icons.music },
  { id:'business', label:'Career', Icon:Icons.career },
  { id:'social', label:'News', Icon:Icons.news },
  { id:'profile', label:'Profile', Icon:Icons.profile },
];

const DESKTOP_LINKS = [
  { label:'Career', tab:'business', route:'overview', Icon:Icons.career },
  { label:'Music', tab:'create', route:'record', Icon:Icons.music },
  { label:'Releases', tab:'create', route:'release', Icon:Icons.news },
  { label:'Shows', tab:'business', route:'tour', Icon:Icons.tour },
  { label:'Collabs', tab:'business', route:'network', Icon:Icons.collab },
  { label:'Industry', tab:'business', route:'industry', Icon:Icons.career },
  { label:'Finances', tab:'business', route:'money', Icon:Icons.career },
  { label:'News', tab:'social', route:'wire', Icon:Icons.news },
  { label:'Inbox', tab:'social', route:'inbox', Icon:Icons.news },
];

const ModalIcon = ({ ev }) => {
  if (ev?.id === 'award_nom' || ev?.id === 'award_win')
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#FFD700',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
  if (ev?.neg)
    return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'none',stroke:'#f97316',strokeWidth:1.5,margin:'0 auto 10px',display:'block' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg viewBox="0 0 24 24" style={{ width:40,height:40,fill:'#a855f7',margin:'0 auto 10px',display:'block' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
};

function DesktopSidebar({ gs, navigate }) {
  return (
    <aside className="desktop-sidebar" aria-label="Main navigation">
      <div className="sidebar-brand"><span className="sidebar-mark">T</span><span>TREBLR</span></div>
      <div className="sidebar-season">ARTIST CAREER SIMULATION</div>
      <nav className="sidebar-links">
        <button type="button" className={`desktop-nav-item${gs.tab === 'home' ? ' is-active' : ''}`} onClick={() => navigate('home')}>
          <span className="desktop-nav-icon"><Icons.home/></span><span>Home</span>
        </button>
        {DESKTOP_LINKS.map((link) => {
          const Icon = link.Icon;
          const active = gs.tab === link.tab && gs.appRoutes?.[{ create:'music', business:'career', social:'news' }[link.tab]] === link.route;
          return <div key={link.label}>
            {link.group && <div className="sidebar-group-label">{link.group}</div>}
            <button type="button" className={`desktop-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => navigate(link.tab, link.route)}>
              <span className="desktop-nav-icon"><Icon/></span><span>{link.label}</span>
            </button>
          </div>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className={`desktop-nav-item${gs.tab === 'profile' && gs.appRoutes?.profile !== 'settings' ? ' is-active' : ''}`} onClick={() => navigate('profile','stats')}><span className="desktop-nav-icon"><Icons.profile/></span><span>Profile</span></button>
        <button type="button" className={`desktop-nav-item${gs.tab === 'profile' && gs.appRoutes?.profile === 'settings' ? ' is-active' : ''}`} onClick={() => navigate('profile','settings')}><span className="desktop-nav-icon"><Icons.career/></span><span>Settings</span></button>
      </div>
    </aside>
  );
}

export default function Game({ gs, setGs }) {
  const fmtN = (amount) => formatCurrency(amount, gs.currency);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isEndingWeek, setIsEndingWeek] = useState(false);
  const toastTimer = useRef(null);

  const patch = useCallback(upd => setGs(prev => ({ ...prev, ...upd })), [setGs]);
  const patchFn = useCallback(fn => setGs(prev => ({ ...prev, ...fn(prev) })), [setGs]);
  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const navigate = useCallback((tab, route) => {
    const routeKey = { create:'music', business:'career', social:'news', profile:'profile' }[tab];
    if (routeKey && route) {
      setGs(prev => ({ ...prev, tab, appRoutes:{ ...(prev.appRoutes || {}), [routeKey]:route } }));
    } else {
      setGs(prev => ({ ...prev, tab }));
    }
  }, [setGs]);

  useEffect(() => {
    if (gs._pendingToast) {
      showToast(gs._pendingToast);
      setGs(prev => ({ ...prev, _pendingToast:null }));
    }
  }, [gs._pendingToast, setGs, showToast]);

  useEffect(() => {
    if (gs._pendingModal) {
      setModal(gs._pendingModal);
      setGs(prev => ({ ...prev, _pendingModal:null }));
    }
  }, [gs._pendingModal, setGs]);

  const handleEndWeek = useCallback(() => {
    if (isEndingWeek) return;
    setIsEndingWeek(true);
    setGs(prev => doEndWeek(prev, showToast, setModal));
    setTimeout(() => { setShowReport(true); setIsEndingWeek(false); }, 80);
  }, [setGs, showToast, isEndingWeek]);

  const handleReportClose = useCallback(() => {
    setShowReport(false);
    setGs(prev => ({ ...prev, lastWeekReport:prev.weekReport || prev.lastWeekReport || null, weekReport:null }));
  }, [setGs]);

  const handleChoice = useCallback((opt) => {
    patchFn(prev => handleModalChoice(prev, opt, showToast));
    setModal(null);
  }, [patchFn, showToast]);

  const era = getEra(gs.fans);
  const timeStr = getTimeLabel(gs.totalWeeks, gs.startYear);
  const actionPoints = getActionPoints(gs);
  const tabProps = { gs, setGs, patch, patchFn, showToast, endWeek:handleEndWeek, isEndingWeek };

  return (
    <div className="app-shell" data-scene={gs.tab}>
      <DesktopSidebar gs={gs} navigate={navigate}/>
      <div className="app-workspace">
        <header className="li-topbar">
          <div className="li-topbar-row">
            <div className="li-topbar-identity">
              <PlayerAvatar gs={gs} size={36} ring="var(--scene-accent)"/>
              <div className="li-topbar-copy">
                <div className="li-topbar-name">{gs.stageName}</div>
                <div className="li-topbar-era">{era.label.replace(' Era','')} · {(gs.genre || 'Music').replace('afrobeats','Afrobeats').replace('hiphop','Hip-Hop').replace('rnb','R&B')}</div>
              </div>
            </div>
            <div className="li-topbar-balance">
              <div className="li-topbar-money">{fmtN(gs.money)}</div>
              <div className="li-topbar-time">Cash balance · {timeStr}</div>
            </div>
          </div>
          <div className="li-topbar-status">
            <div className="li-energy-block" role="group" aria-label={`Energy ${gs.energy || 0} of 100`}>
              <div className="li-status-caption"><span>Energy</span><strong>{gs.energy || 0}<small>/100</small></strong></div>
              <div className="li-energy-track"><span style={{ width:`${Math.max(0,Math.min(100,Number(gs.energy || 0)))}%` }}/></div>
            </div>
            <div className="li-action-block" aria-label={`${actionPoints} of ${WEEKLY_ACTION_POINTS} weekly action points remaining`}>
              <div className="li-status-caption"><span>Actions</span><strong>{actionPoints}<small>/{WEEKLY_ACTION_POINTS}</small></strong></div>
              <div className="li-action-dots" aria-hidden="true">{Array.from({ length:WEEKLY_ACTION_POINTS }).map((_, index) => <span key={index} className={index < actionPoints ? 'is-ready' : ''}/>)}</div>
            </div>
          </div>
        </header>

        <main className="app-main" aria-label="Career simulation">
          {gs.tab === 'home' && <HomeTab {...tabProps}/>}
          {gs.tab === 'create' && <CreateTab {...tabProps}/>}
          {gs.tab === 'social' && <NewsTab {...tabProps}/>}
          {gs.tab === 'business' && <BusinessTab {...tabProps}/>}
          {gs.tab === 'profile' && <ProfileTab {...tabProps}/>}
        </main>

        <nav className="tab-bar" aria-label="Primary navigation" style={{ backdropFilter:'blur(16px) saturate(135%)', WebkitBackdropFilter:'blur(16px) saturate(135%)' }}>
          {TABS.map(tab => {
            const Icon = tab.Icon;
            return <button type="button" key={tab.id} className={`tab-btn${gs.tab === tab.id ? ' on' : ''}`} aria-current={gs.tab === tab.id ? 'page' : undefined} onClick={() => navigate(tab.id)}>
              <span className="tab-btn-icon"><Icon/></span>
              <span className="tab-btn-label">{tab.label}</span>
            </button>;
          })}
        </nav>
      </div>

      {showReport && gs.weekReport && <WeeklyReport report={gs.weekReport} currency={gs.currency} stageName={gs.stageName} genre={gs.genre} onContinue={handleReportClose}/>}

      {modal && (
        <div className="overlay" onClick={() => !modal.event?.choice && setModal(null)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-handle"/>
            <ModalIcon ev={modal.event}/>
            <div className="modal-title">{modal.event.label}</div>
            <div className="modal-desc">{modal.event.desc}</div>
            {modal.event.effect && !modal.event.choice && (
              <div className="effect-chips">
                {Object.entries(modal.event.effect).map(([key, value]) => <div key={key} className={`effect-chip ${value > 0 ? 'pos' : 'neg'}`}>
                  {value > 0 ? '+' : ''}{key === 'money' ? fmtN(value) : value} {key !== 'money' ? key : ''}
                </div>)}
              </div>
            )}
            {modal.event.choice ? (
              <>
                <div className="event-effect-note">Immediate modeled effects are listed below. Longer-term outcomes depend on how the simulation develops.</div>
                <div className="modal-choices">
                  {modal.event.options.map((option, index) => <button type="button" key={index} className="choice-btn" onClick={() => handleChoice(option)}>
                    {option.text}
                    <div className="choice-btn-sub">
                      {Object.entries(option.effect || {}).filter(([key]) => !['dropped','renegotiate'].includes(key)).map(([key,value]) => `${value > 0 ? '+' : ''}${key === 'money' ? fmtN(value) : value} ${key !== 'money' ? key : ''}`).join(' · ')}
                    </div>
                  </button>)}
                </div>
              </>
            ) : <button className="btn btn-primary btn-full" onClick={() => setModal(null)}>GOT IT</button>}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
