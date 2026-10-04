import { useEffect, useMemo, useState } from 'react';
import { formatCount, formatMoney, gameReducer, persistCareer, readSavedCareer, RELEASE_FORMATS } from './game.js';
import './game.css';

const navItems = [
  { id: 'Home', label: 'Home', icon: 'home' },
  { id: 'Music', label: 'Music', icon: 'music' },
  { id: 'Career', label: 'Career', icon: 'career' },
  { id: 'World', label: 'World', icon: 'world' },
  { id: 'You', label: 'You', icon: 'you' },
];

function Icon({ name, size = 18 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/></>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    career: <><path d="M3 8h18v12H3zM8 8V5h8v3M3 13h18M10 12v2h4v-2"/></>,
    world: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z"/></>,
    you: <><circle cx="12" cy="8" r="3.4"/><path d="M5 21c.5-4.2 2.8-6.4 7-6.4s6.5 2.2 7 6.4"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    back: <><path d="M19 12H5M11 5l-7 7 7 7"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    play: <><path d="m8 5 11 7-11 7z"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    caret: <><path d="m7 10 5 5 5-5"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.spark}</svg>;
}

function Cover({ release, className = '' }) {
  return <div className={`cover-art cover-${release.color || 'moss'} ${className}`}>
    <img src={release.cover} alt={`${release.title} cover artwork`} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} />
    <span className="cover-stamp">{release.type}</span>
  </div>;
}

function TopBar({ game, onCloseWeek, onNavigate }) {
  return <header className="topbar">
    <div className="mobile-brand"><span className="wordmark">T/R</span><span className="mobile-week">W{game.week} · {game.player.city.toUpperCase()}</span></div>
    <div className="topbar-left"><span className="topbar-label">INDEPENDENT ARTIST FILE</span><span className="topbar-sep">/</span><span className="topbar-name">{game.player.moniker}</span></div>
    <div className="topbar-right">
      <span className="top-week"><span className="live-dot" /> WEEK {game.week} <span className="topbar-sep">·</span> {game.player.city.toUpperCase()}</span>
      <span className="cash-pill"><span>AVAILABLE</span><b>{formatMoney(game.player.cash)}</b></span>
      <button className="button button-mint close-week-button" aria-label="Close week" onClick={onCloseWeek}><span>Close week</span><Icon name="arrow" size={15}/></button>
      <button className="avatar-mini" onClick={() => onNavigate('You')} aria-label="Open artist profile">MA</button>
    </div>
  </header>;
}

function SideNav({ active, onNavigate, game }) {
  return <aside className="side-nav">
    <div className="brand-lockup"><div className="brand-mark">T<span>/</span>R</div><div><strong>TREBLR</strong><small>ARTIST CAREER SIM</small></div></div>
    <div className="nav-caption">YOUR WORLD</div>
    <nav aria-label="Primary navigation" className="nav-stack">
      {navItems.map(item => <button key={item.id} className={`nav-link ${active === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{item.label}</span>{item.id === 'Career' && game.opportunities.some(o => o.status === 'Open') && <i className="nav-badge">{game.opportunities.filter(o => o.status === 'Open').length}</i>}</button>)}
    </nav>
    <div className="sidebar-spacer" />
    <button className="side-week" onClick={() => onNavigate('Home')}><span className="eyebrow">THE NEXT MILESTONE</span><b>Week {game.week + 1}</b><span>Close this week to see what moved.</span><span className="side-week-link">Open the week <Icon name="arrow" size={13}/></span></button>
    <div className="sidebar-artist"><div className="monogram">MA</div><div><b>{game.player.moniker}</b><span>{game.player.genre}</span></div><span className="online-dot" /></div>
    <div className="sidebar-foot">A LIVING INDUSTRY <span>·</span> v1.0</div>
  </aside>;
}

function BottomNav({ active, onNavigate }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    {navItems.map(item => <button key={item.id} onClick={() => onNavigate(item.id)} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined}><Icon name={item.icon} size={19}/><span>{item.label}</span></button>)}
  </nav>;
}

function PageHeading({ eyebrow, title, sub, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

function StatStrip({ game }) {
  const data = [
    { label: 'Monthly listeners', value: formatCount(game.player.listeners), change: '+8.4%', icon: 'trend' },
    { label: 'People in your corner', value: formatCount(game.player.fans), change: 'FANS', icon: 'you' },
    { label: 'Industry signal', value: `${game.player.reputation}`, change: '/ 100', icon: 'spark' },
    { label: 'Cash on hand', value: formatMoney(game.player.cash), change: 'NGN', icon: 'career' },
  ];
  return <section className="stat-strip" aria-label="Career statistics">{data.map(item => <div className="stat-cell" key={item.label}><div className="stat-top"><span>{item.label}</span><Icon name={item.icon} size={14}/></div><strong>{item.value}</strong><small>{item.change}</small></div>)}</section>;
}

function MiniChart({ values, label = 'Weekly streams', compact = false }) {
  const points = values?.length ? values : [20, 34, 27, 45, 41, 62, 58, 78];
  const max = Math.max(...points, 1);
  const coords = points.map((value, index) => `${(index / Math.max(points.length - 1, 1)) * 100},${90 - (value / max) * 70}`).join(' ');
  return <div className={`mini-chart ${compact ? 'compact-chart' : ''}`} role="img" aria-label={`${label}: ${points.map(v => Math.round(v)).join(', ')}`}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="mint-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8FE2B8" stopOpacity=".2"/><stop offset="1" stopColor="#8FE2B8" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d={`M 0 100 L ${coords} L 100 100 Z`}/><polyline points={coords}/></svg>
    {!compact && <div className="chart-labels"><span>W{gameWeek(points, 0)}</span><span>W{gameWeek(points, 1)}</span><span>NOW</span></div>}
  </div>;
}
function gameWeek(points, end) { return 38 - (points.length - 1) + (end ? points.length - 1 : 0); }

function HomePage({ game, onOpenRelease, onOpenSession, onCampaign, onNavigate }) {
  const featured = game.releases.find(release => release.status === 'Released') || game.releases[0];
  const events = game.bookings.filter(booking => booking.status === 'Confirmed');
  return <div className="page home-page">
    <PageHeading eyebrow={`WEEK ${game.week} · ${game.player.city.toUpperCase()} / NIGERIA`} title="Your next move." sub="The work is finding its people. The industry wants to know what you do next." action={<span className="date-stamp">04 OCT 2026 <i>·</i> CAREER LOG 038</span>} />
    <section className="home-masthead">
      <div className="masthead-photo" role="img" aria-label="Live music performance photograph by León Ramisan, Pexels"><img src="/assets/treblr/artist-live.jpg" alt="A vocalist performing beneath warm stage lights"/><div className="photo-credit">LIVE CULTURE / LEÓN RAMISAN · PEXELS</div></div>
      <div className="masthead-copy"><div className="pill-line"><span className="pill-dot"/> INDEPENDENT · LAGOS</div><p className="masthead-kicker">THE STORY SO FAR</p><h2>Keep the<br/><em>signal</em> alive.</h2><p className="masthead-description">“After Hours” made its first playlist. One good week can open a door — or eat the money you meant to save.</p><div className="masthead-foot"><span>SCENE NOTE 038</span><button className="text-link" onClick={() => onOpenRelease(featured.id)}>Read the room <Icon name="arrow" size={14}/></button></div></div>
    </section>
    <StatStrip game={game}/>
    <div className="home-grid">
      <section className="feature-release editorial-section">
        <div className="section-header"><div><span className="eyebrow">IN ROTATION · WEEKLY SPIN</span><h2>Current release</h2></div><button className="text-link" onClick={() => onNavigate('Music')}>Open the catalogue <Icon name="arrow" size={14}/></button></div>
        <button className="release-feature" onClick={() => onOpenRelease(featured.id)}>
          <Cover release={featured} className="feature-cover"/>
          <span className="release-feature-copy"><span className="eyebrow">{featured.type.toUpperCase()} · {featured.genre.toUpperCase()}</span><strong>{featured.title}</strong><small>{featured.date} <i>·</i> with {featured.collaborators?.join(', ') || 'Mira Ayo'}</small><span className="feature-metric"><b>{formatCount(featured.streams)}</b><em>streams</em><span className="trend-positive"><Icon name="trend" size={13}/> {featured.trend}%</span></span><span className="feature-bar"><i style={{ width: `${Math.max(8, Math.min(featured.streams / 1800, 94))}%` }}/></span></span>
          <span className="open-mark"><Icon name="arrow" size={16}/></span>
        </button>
        <div className="chart-block"><div className="chart-title"><span>ATTENTION, WEEK TO WEEK</span><b>Last 8 weeks</b></div><MiniChart values={game.weeklyHistory.map(item => item.streams).concat([Math.max(900, featured.streams / 5)])} label="Streams by week"/><div className="chart-legend"><span><i/> Streams across released work</span><span>Source: your catalog</span></div></div>
      </section>
      <aside className="home-aside">
        <div className="aside-panel next-show-panel"><div className="aside-head"><span className="eyebrow">ON THE TABLE</span><Icon name="calendar" size={15}/></div>
          {events.length ? <><b>{events[0].venue}</b><p>{events[0].place} · Week {events[0].week}</p><div className="show-data"><span>GUARANTEE <b>{formatMoney(events[0].payout)}</b></span><span>STATUS <b>CONFIRMED</b></span></div><button className="button button-outline button-full" onClick={() => onNavigate('Career')}>View the date</button></> : <><b>The room is waiting.</b><p>No show is locked yet. One offer is worth the travel risk.</p><button className="text-link" onClick={() => onNavigate('Career')}>Browse the offers <Icon name="arrow" size={14}/></button></>}
        </div>
        <div className="aside-panel week-brief"><span className="eyebrow">INDUSTRY WEATHER</span><div className="weather-number">{game.player.energy}<small> / 100</small></div><b>Artist energy</b><div className="energy-track"><i style={{ width: `${game.player.energy}%` }}/></div><p>Sessions and travel spend energy. Closing a week restores it — but the world keeps moving.</p></div>
      </aside>
    </div>
    <section className="decision-row">
      <div className="decision-intro"><span className="eyebrow">PICK UP THE THREAD</span><h2>One good decision<br/>changes the week.</h2><p>Every commitment has a price, a possible audience and a trade-off.</p></div>
      <button className="decision-action" onClick={onOpenSession}><span className="decision-index">01</span><span><b>Book a room</b><small>Leave with a finished demo.</small></span><Icon name="arrow" size={16}/></button>
      <button className="decision-action" onClick={() => onCampaign(featured.id)}><span className="decision-index">02</span><span><b>Back a release</b><small>Spend now to build reach.</small></span><Icon name="arrow" size={16}/></button>
      <button className="decision-action" onClick={() => onNavigate('Career')}><span className="decision-index">03</span><span><b>Answer the call</b><small>Four industry doors are open.</small></span><Icon name="arrow" size={16}/></button>
    </section>
    <ActivityFeed game={game} onNavigate={onNavigate}/>
  </div>;
}

function ActivityFeed({ game, onNavigate }) {
  return <section className="activity-section"><div className="section-header"><div><span className="eyebrow">WHO'S TALKING</span><h2>Career log</h2></div><button className="text-link" onClick={() => onNavigate('World')}>See the world <Icon name="arrow" size={14}/></button></div><div className="activity-list">{game.activity.slice(0, 4).map((item, index) => <div className="activity-row" key={`${item.tag}-${item.week}-${index}`}><div className={`activity-pin ${item.tag === 'RELEASE' ? 'violet-pin' : ''}`}/><span className="activity-tag">{item.tag}</span><p>{item.text}</p><span className="activity-week">W{item.week}</span></div>)}</div></section>;
}

function MusicPage({ game, releaseId, onOpenRelease, onCloseRelease, onOpenSession, onCampaign }) {
  const [filter, setFilter] = useState('All');
  const [kind, setKind] = useState('Everything');
  const [sort, setSort] = useState('Newest first');
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const release = game.releases.find(item => item.id === releaseId);
  if (release) return <ReleaseDetail game={game} release={release} onBack={onCloseRelease} onCampaign={onCampaign}/>;
  const filters = ['All', 'Released', 'In progress', 'Unreleased'];
  let releases = game.releases.filter(item => (filter === 'All' || item.status === filter) && (kind === 'Everything' || item.type === kind) && item.title.toLowerCase().includes(query.toLowerCase()));
  releases = [...releases].sort((a, b) => sort === 'Most played' ? b.streams - a.streams : b.id.localeCompare(a.id));
  const releaseCount = game.releases.filter(item => item.status === 'Released').length;
  return <div className="page music-page">
    <PageHeading eyebrow="YOUR MASTERS · YOUR MOMENT" title="The catalogue." sub={`${releaseCount} releases in the world. ${game.releases.length - releaseCount} projects still in the room.`} action={<button className="button button-mint" onClick={onOpenSession}><Icon name="plus" size={15}/> Book a session</button>} />
    <section className="catalogue-lead"><div className="catalogue-quote"><span className="eyebrow">THE WORK, NOT THE WORKFLOW</span><h2>Every record is a<br/><em>decision</em> made audible.</h2><p>Choose the room, the collaborators and the release strategy. Sessions resolve into finished demos; there are no composition controls here.</p></div><div className="catalogue-stats"><div><span>IN CIRCULATION</span><b>{formatCount(game.releases.filter(r => r.status === 'Released').reduce((n, r) => n + r.streams, 0))}</b><small>total streams</small></div><div><span>FROM THE MASTERS</span><b>{formatMoney(game.releases.reduce((n, r) => n + r.revenue, 0))}</b><small>lifetime earned</small></div></div></section>
    <div className="collection-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter releases">{filters.map(item => <button role="tab" aria-selected={filter === item} key={item} onClick={() => setFilter(item)}>{item}<span>{item === 'All' ? game.releases.length : game.releases.filter(r => r.status === item).length}</span></button>)}</div><div className="collection-controls"><label className="search-box"><span className="sr-only">Search records</span><Icon name="filter" size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a record"/></label><select aria-label="Release type" value={kind} onChange={event => setKind(event.target.value)}><option>Everything</option>{[...new Set(game.releases.map(r => r.type))].map(value => <option key={value}>{value}</option>)}</select><select aria-label="Sort releases" value={sort} onChange={event => setSort(event.target.value)}><option>Newest first</option><option>Most played</option></select><div className="view-switch" aria-label="Catalogue display"><button onClick={() => setView('grid')} aria-label="Artwork grid" aria-pressed={view === 'grid'}><Icon name="grid" size={16}/></button><button onClick={() => setView('list')} aria-label="Compact list" aria-pressed={view === 'list'}><Icon name="list" size={16}/></button></div></div></div>
    {releases.length ? <div className={`release-grid ${view === 'list' ? 'list-view' : ''}`}>{releases.map((item, index) => <ReleaseTile key={item.id} release={item} index={index} onOpen={() => onOpenRelease(item.id)} onCampaign={() => onCampaign(item.id)}/>)}</div> : <div className="empty-state"><span className="eyebrow">NOTHING IN THIS CRATE</span><h2>No records match.</h2><p>Change a filter, or book a session and start a new release story.</p><button className="button button-mint" onClick={onOpenSession}>Book a session <Icon name="arrow" size={14}/></button></div>}
    <section className="catalogue-footnote"><span className="eyebrow">RELEASES AREN'T JUST DROPS</span><p>Campaign money trades for attention; an independent release keeps your masters. Label distribution may widen the reach while taking a disclosed share.</p></section>
  </div>;
}

function ReleaseTile({ release, index, onOpen, onCampaign }) {
  return <article className={`release-tile tile-${index % 4} ${release.status === 'In progress' ? 'tile-project' : ''}`}>
    <button className="tile-open" onClick={onOpen} aria-label={`Open ${release.title} details`}><Cover release={release} className="tile-cover"/><span className="tile-body"><span className="tile-meta"><span>{release.type.toUpperCase()}</span><i className={`status-dot ${release.status === 'Released' ? 'dot-mint' : release.status === 'Scheduled' ? 'dot-amber' : ''}`}>{release.status}</i></span><strong>{release.title}</strong><small>{release.genre} <i>·</i> {release.date}</small><span className="tile-metrics"><b>{formatCount(release.streams)} <small>streams</small></b><span>{release.status === 'Released' ? `${release.trend > 0 ? '+' : ''}${release.trend}%` : `QUALITY ${release.quality}`}</span></span></span><span className="tile-arrow"><Icon name="arrow" size={15}/></span></button>
    {release.status === 'Released' ? <button className="tile-secondary" onClick={onCampaign}>Plan a campaign <Icon name="arrow" size={13}/></button> : <button className="tile-secondary" onClick={onCampaign}>{release.status === 'Scheduled' ? 'Campaign details' : 'Plan this release'} <Icon name="arrow" size={13}/></button>}
  </article>;
}

function ReleaseDetail({ game, release, onBack, onCampaign }) {
  const [range, setRange] = useState('28 days');
  const values = range === '7 days' ? [12, 18, 21, 36, 28, 55, 50] : range === '90 days' ? [14, 20, 17, 28, 42, 49, 64, 82, 77, 96, 90] : [15, 24, 21, 35, 32, 45, 62, 54, 76, 69, 87, 100];
  const isProject = release.type === 'EP' || release.type === 'Album' || release.type === 'Live EP';
  return <div className="page detail-page">
    <button className="back-link" onClick={onBack}><Icon name="back" size={15}/> CATALOGUE / {release.type.toUpperCase()}</button>
    <div className="detail-hero"><Cover release={release} className="detail-cover"/><div className="detail-ident"><span className="eyebrow">{release.status.toUpperCase()} · {release.genre.toUpperCase()}</span><h1>{release.title}</h1><p>Mira Ayo{release.collaborators?.length ? ` · with ${release.collaborators.join(', ')}` : ''}</p><div className="detail-meta"><span>{release.date}</span><i>·</i><span>{release.quality} / 100 quality</span><i>·</i><span>{release.type}</span></div><div className="detail-actions">{release.status === 'Released' ? <button className="button button-mint" onClick={() => onCampaign(release.id)}>Back a campaign <Icon name="arrow" size={14}/></button> : <button className="button button-mint" onClick={() => onCampaign(release.id)}>{release.status === 'Scheduled' ? 'Campaign plan' : 'Set a release date'} <Icon name="arrow" size={14}/></button>}<button className="button button-outline" onClick={onBack}>Catalogue</button></div></div></div>
    {isProject && <div className="project-progress"><div className="project-progress-head"><div><span className="eyebrow">ALBUM PACKAGE</span><b>{release.readiness || 67}% ready</b></div><span>Release plan · Week 42</span></div><div className="progress-track"><i style={{ width: `${release.readiness || 67}%` }}/></div><p>One more session will finish the final arrangement. Artwork is locked; release date remains flexible.</p><div className="tracklist">{(release.tracklist || ['Mile Marker', release.title, 'Halfway Home']).map((track, index) => <div key={track}><span>0{index + 1}</span><b>{track}</b><small>{index === 1 ? 'title track · Ari Madu' : 'demo approved'}</small><span>{index === 0 ? '3:18' : index === 1 ? '3:46' : '4:02'}</span></div>)}</div></div>}
    <section className="analytics-block"><div className="analytics-head"><div><span className="eyebrow">THE NUMBERS BEHIND THE FEELING</span><h2>Performance</h2></div><div className="range-switch" role="tablist" aria-label="Analytics time range">{['7 days', '28 days', '90 days'].map(item => <button key={item} role="tab" aria-selected={range === item} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="detail-metric-row"><div><span>TOTAL STREAMS</span><b>{formatCount(release.streams)}</b><small className="trend-positive">↗ {release.trend}% this week</small></div><div><span>MASTER INCOME</span><b>{formatMoney(release.revenue)}</b><small>your side of the ledger</small></div><div><span>PLAYLISTS</span><b>{release.status === 'Released' ? (release.playlist === '—' ? '2' : '3') : '—'}</b><small>{release.status === 'Released' ? `${release.playlist} + 2 more` : 'not in rotation'}</small></div></div><div className="detail-chart"><MiniChart values={values} label={`${range} stream trend`}/><div className="chart-footer"><span>DAILY LISTENING TREND</span><span>Data through Week {game.week}</span></div></div></section>
    <div className="detail-lower"><section><span className="eyebrow">LISTENER NOTE</span><blockquote>“It sounds like the city after the last bus — close, but not quite home.”</blockquote><small>— Night Shift FM, Lagos <i>·</i> 02 OCT 2026</small></section><section className="detail-credit"><span className="eyebrow">CREDITS & RIGHTS</span><p>{release.collaborators?.join(' · ') || 'Mira Ayo'}<br/>Independent master <i>·</i> self-released</p><span className="rights-chip">MASTERS HELD BY ARTIST</span></section></div>
  </div>;
}

function CareerPage({ game, onOpportunity }) {
  const open = game.opportunities.filter(item => item.status === 'Open');
  const past = game.opportunities.filter(item => item.status !== 'Open');
  return <div className="page career-page"><PageHeading eyebrow="THE PEOPLE WITH A SAY" title="The next room." sub="Every offer has a number, a risk and a person on the other end." action={<span className="count-stamp">{open.length} OPEN BRIEFS</span>}/>
    <div className="career-intro"><div className="career-location"><span className="eyebrow">CURRENT SCENE</span><b>{game.player.city}, Nigeria</b><span>Independent circuit <i>·</i> alt R&B / soul</span></div><div className="career-track"><span className="eyebrow">REPUTATION SIGNAL</span><div className="rep-track"><i style={{ width: `${game.player.reputation}%` }}/></div><b>{game.player.reputation} / 100 <small>· emerging voice</small></b></div><div className="career-track"><span className="eyebrow">ARTIST ENERGY</span><div className="rep-track energy"><i style={{ width: `${game.player.energy}%` }}/></div><b>{game.player.energy} / 100 <small>· closes each week</small></b></div></div>
    {game.labelDeal && <div className="deal-ribbon"><span className="ribbon-monogram">N</span><div><span className="eyebrow">ONE-PROJECT LICENSE · ACTIVE</span><b>Northline / distribution partner</b><p>{game.labelDeal.share} <i>·</i> {game.labelDeal.term} <i>·</i> artist retains creative control</p></div><span className="deal-advance">{formatMoney(game.labelDeal.advance)}<small>advance paid</small></span></div>}
    <div className="opportunity-heading"><div><span className="eyebrow">OPEN FILES · THE WORLD IS MOVING</span><h2>Offers worth answering.</h2></div><span>Amounts in NGN <i>·</i> Week {game.week}</span></div>
    <div className="opportunity-list">{open.length ? open.map((item, index) => <Opportunity key={item.id} item={item} index={index} onDecision={onOpportunity}/>) : <div className="empty-state compact"><span className="eyebrow">NO NEW INBOUND</span><h2>Take a week to make your own news.</h2><p>Play a show, release a record or close the week. The world will keep generating new pressure.</p></div>}</div>
    <div className="global-scenes"><span className="eyebrow">CITIES IN YOUR ORBIT</span><div className="scene-row">{['Lagos', 'Accra', 'Atlanta', 'London', 'Toronto'].map((city, index) => <div key={city} className={city === game.player.city ? 'scene-current' : ''}><span>0{index + 1}</span><b>{city}</b><small>{['HOME SCENE', 'WEST AFRICA', 'SOUTHERN RAP', 'INDIE RADIO', 'DIASPORA FM'][index]}</small></div>)}</div></div>
    {past.length > 0 && <section className="past-decisions"><span className="eyebrow">THE DECISIONS ALREADY MADE</span>{past.map(item => <div key={item.id}><span className={`decision-status ${item.status === 'Accepted' ? 'accepted' : ''}`}>{item.status}</span><b>{item.title}</b><small>{item.place}</small></div>)}</section>}
  </div>;
}

function Opportunity({ item, index, onDecision }) {
  const category = { show: 'LIVE / BOOKING', tour: 'LIVE / TOUR ROUTE', festival: 'LIVE / FESTIVAL', label: 'INDUSTRY / LABEL', collab: 'PEOPLE / COLLAB', radio: 'PRESS / RADIO', social: 'PUBLICITY / SOCIAL' }[item.type] || 'INDUSTRY / OPPORTUNITY';
  const action = { show: 'Book the slot', tour: 'Book the route', festival: 'Take the stage', label: 'Take the meeting', collab: 'Say yes', radio: 'Say yes', social: 'Fund the clip' }[item.type] || 'Say yes';
  return <article className={`opportunity opportunity-${item.type}`}><div className="opp-number">0{index + 1}</div><div className="opp-main"><div className="opp-meta"><span>{category}</span><i>·</i><span>{item.place}</span></div><h3>{item.title}</h3><p>{item.detail}</p><div className="opp-specs"><div><span>THE UPSIDE</span><b>{item.offer}</b></div><div><span>THE ASK</span><b>{item.cost ? formatMoney(item.cost) : item.type === 'label' ? 'one-project license' : 'your time'}</b></div><div className="opp-risk"><span>THE TRADE-OFF</span><b>{item.risk}</b></div></div></div><div className="opp-actions"><div className="opp-deadline"><Icon name="calendar" size={14}/>{item.date}</div><button className="button button-mint" onClick={() => onDecision(item.id, true)}>{action} <Icon name="arrow" size={14}/></button><button className="text-link muted-link" onClick={() => onDecision(item.id, false)}>Pass for now</button></div></article>;
}

function WorldPage({ game }) {
  const scenes = [
    { city: 'Lagos', country: 'NG', mood: 'Alt R&B finding late-night radio', pulse: 78, releases: 3 },
    { city: 'Accra', country: 'GH', mood: 'Guitar bands crossing into soul', pulse: 82, releases: 5 },
    { city: 'Atlanta', country: 'US', mood: 'New voices on the south side', pulse: 71, releases: 4 },
    { city: 'London', country: 'UK', mood: 'Small rooms, serious press', pulse: 67, releases: 2 },
    { city: 'Toronto', country: 'CA', mood: 'Diaspora FM is adding records', pulse: 74, releases: 3 },
  ];
  const liveScenes = scenes.map((scene, index) => ({ ...scene, pulse: Math.max(55, Math.min(92, scene.pulse + ((((game.worldSeed + index * 11) % 7) - 3) * 2)))}));
  const chart = useMemo(() => {
    const artists = [
      { name: 'Kweku North', city: 'Accra', listeners: 152000, cover: '/assets/treblr/covers/red-earth.jpg' },
      { name: 'Mira Ayo', city: 'Lagos', listeners: game.player.listeners, cover: '/assets/treblr/covers/after-hours.jpg', self: true },
      { name: 'June Saint', city: 'Atlanta', listeners: 68400, cover: '/assets/treblr/covers/blue-hour.jpg' },
      { name: 'Juno Ash', city: 'London', listeners: 59700, cover: '/assets/treblr/covers/soft-static.jpg' },
      { name: 'Tari Bloom', city: 'Toronto', listeners: 48200, cover: '/assets/treblr/covers/no-fixed-address.jpg' },
    ];
    return artists.map((artist, index) => {
      const factor = artist.self ? 1 : 1 + (((game.worldSeed + index * 13) % 7) - 2) * 0.012;
      return { ...artist, listeners: Math.max(100, Math.round(artist.listeners * factor)) };
    }).sort((a, b) => b.listeners - a.listeners);
  }, [game.player.listeners, game.worldSeed]);
  const headlines = [
    { tag: 'THE CIRCUIT', title: `Kweku North names five rooms for the ${game.week + 1} run`, copy: 'Accra, London, Toronto and two nights at home. Tickets went in under an hour.', time: '3 HOURS AGO' },
    { tag: 'NEW MUSIC', title: 'Juno Ash lets “Almost Famous” out after midnight', copy: 'A self-released demo is now the most saved song on the West End late list.', time: 'YESTERDAY' },
    { tag: 'SCENE REPORT', title: `${game.player.city} late radio starts to travel`, copy: 'Independent selectors trade notes on the records keeping the last bus company.', time: '2 DAYS AGO' },
  ];
  return <div className="page world-page"><PageHeading eyebrow={`THE INDUSTRY · WEEK ${game.week}`} title="Outside the room." sub="Other artists don't wait for your move. This is what the world is saying." action={<span className="world-live"><i/> THE WIRE IS LIVE</span>}/>
    <section className="world-lead"><div><span className="eyebrow">THIS WEEK'S SCENE REPORT</span><h2>Five cities.<br/><em>One long conversation.</em></h2><p>From a Lagos night slot to a Toronto radio intro, the independent circuit is more connected than it looks.</p><span className="world-credit">THE TREBLR WIRE <i>·</i> FILE 038</span></div><div className="world-image"><img src="/assets/treblr/covers/no-fixed-address.jpg" alt="Graphic artwork for the week’s independent scene report"/><span>WORLD / AFTER DARK</span></div></section>
    <section className="chart-section"><div className="section-header"><div><span className="eyebrow">THE LONG WAY UP · REGIONAL ALT / SOUL</span><h2>Independent 50.</h2></div><span className="chart-period">WEEK {game.week} <i>·</i> MONTHLY LISTENERS</span></div><div className="world-chart">{chart.map((artist, index) => <div key={artist.name} className={`world-chart-row ${artist.self ? 'self-row' : ''}`}><span className="chart-rank">{String(index + 1).padStart(2, '0')}</span><Cover release={{ title: artist.name, type: 'ARTIST', cover: artist.cover, color: ['clay', 'moss', 'blue', 'violet', 'ink'][index] }} className="artist-thumb"/><div className="chart-artist"><b>{artist.name}{artist.self && <i>YOU</i>}</b><span>{artist.city} <i>·</i> alt / soul</span></div><div className="chart-bar"><i style={{ width: `${Math.min(100, artist.listeners / (chart[0]?.listeners || 1) * 100)}%` }}/></div><strong>{formatCount(artist.listeners)}</strong><span className="chart-delta">{index === 0 ? '↗ 2' : index === 1 ? `↗ ${((game.week % 4) + 1)}` : '—'}</span></div>)}</div><p className="chart-footnote">A fictional, local-only chart model. Listener movement changes deterministically each time a week closes.</p></section>
    <div className="world-lower"><section className="wire-section"><div className="section-header"><div><span className="eyebrow">NEWS, NOT NOTIFICATIONS</span><h2>The Wire.</h2></div><span className="wire-edition">ISSUE {game.week}</span></div><div className="headline-list">{headlines.map((story, index) => <article key={story.tag}><div className="story-tag">{story.tag}<span>{story.time}</span></div><h3>{story.title}</h3><p>{story.copy}</p><span className="story-num">0{index + 1}</span></article>)}</div></section><aside className="scene-section"><span className="eyebrow">CITY FREQUENCIES</span><h2>Where it's moving.</h2>{liveScenes.map((scene, index) => <div className="city-frequency" key={scene.city}><span className="scene-code">{scene.country}</span><div><b>{scene.city}</b><small>{scene.mood}</small><div className="frequency-track"><i style={{ width: `${scene.pulse}%` }}/></div></div><span className="frequency-val">{scene.pulse}</span></div>)}</aside></div>
    <section className="world-discussion"><span className="eyebrow">FROM THE LISTENERS</span><p>“That bass line feels like coming back to the mainland at 2am.”</p><div><span className="listener-avatar">AO</span><span><b>adeola.on.loop</b><small>Saved After Hours · Lagos</small></span><span className="mention-count">+ 83 saves this week</span></div></section>
  </div>;
}

function YouPage({ game, onNotification }) {
  const milestones = [
    { title: 'First 10k fans', state: game.player.fans >= 10000 ? 'UNLOCKED' : 'IN PROGRESS', detail: `${formatCount(game.player.fans)} / 10k` },
    { title: 'A song in rotation', state: game.releases.some(r => r.status === 'Released') ? 'UNLOCKED' : 'IN PROGRESS', detail: 'first editorial playlist' },
    { title: 'A room of your own', state: game.bookings.some(b => b.status === 'Played') ? 'UNLOCKED' : 'NEXT UP', detail: 'play a confirmed show' },
  ];
  return <div className="page you-page"><PageHeading eyebrow="ARTIST FILE · PRIVATE PRESS KIT" title="The name on the sleeve." sub="A career is the people who come back, and the rooms that remember." action={<span className="private-stamp">LOCAL SAVE <Icon name="check" size={14}/></span>}/>
    <section className="profile-spread"><div className="profile-identity"><div className="profile-portrait"><img src="/assets/treblr/mira-ayo-portrait.jpg" alt="Portrait of the fictional artist Mira Ayo" loading="lazy"/><span>PRESS PORTRAIT · 2026</span></div><div className="profile-overline">INDEPENDENT ARTIST <i>·</i> SINCE 2024</div><h2>{game.player.moniker}</h2><p>{game.player.bio}</p><div className="profile-facts"><span>{game.player.city.toUpperCase()}, {game.player.country.toUpperCase()}</span><i>·</i><span>{game.player.genre.toUpperCase()}</span><i>·</i><span>{game.player.stage.toUpperCase()}</span></div><div className="profile-reputation"><span>INDUSTRY REPUTATION</span><b>{game.player.reputation}<small> / 100</small></b><div className="rep-track"><i style={{ width: `${game.player.reputation}%` }}/></div></div></div><div className="profile-numbers"><div><span>PEOPLE IN YOUR CORNER</span><b>{formatCount(game.player.fans)}</b><small>total fans</small></div><div><span>MONTHLY REACH</span><b>{formatCount(game.player.listeners)}</b><small>monthly listeners</small></div><div><span>WORLD POSITION</span><b>#{game.player.rank}</b><small>independent 50</small></div><div><span>MASTERS HELD</span><b>{game.releases.filter(r => r.status === 'Released').length}</b><small>self-released projects</small></div></div></section>
    <div className="profile-lower"><section className="team-section"><div className="section-header"><div><span className="eyebrow">THE PEOPLE BEHIND THE NAME</span><h2>In your corner.</h2></div><span className="team-count">{game.team.filter(item => item.name !== 'Open seat').length} ACTIVE</span></div><div className="team-list">{game.team.map((member, index) => <div className="team-member" key={member.name}><span className={`team-monogram team-${index}`}>{member.initials}</span><div><b>{member.name}</b><small>{member.role}</small></div><span className="team-city">{member.city}</span>{member.name !== 'Open seat' && <span className="relationship-strength"><i style={{ width: `${game.relationships.find(r => r.name === member.name)?.warmth || 60}%` }}/></span>}</div>)}</div><div className="relationship-note"><span className="eyebrow">RELATIONSHIP TO WATCH</span><p>{game.relationships.find(r => r.name === 'June Saint')?.role || 'June Saint · mutuals in Atlanta'}</p><small>June Saint · Atlanta <i>·</i> {game.relationships.find(r => r.name === 'June Saint')?.warmth || 42} / 100 trust</small></div></section>
      <section className="milestones-section"><div className="section-header"><div><span className="eyebrow">CAREER, NOT CHECKLIST</span><h2>Milestones.</h2></div><span className="trophy-mark">✳</span></div>{milestones.map((item, index) => <div className="milestone-row" key={item.title}><span className="milestone-num">0{index + 1}</span><div><b>{item.title}</b><small>{item.detail}</small></div><span className={item.state === 'UNLOCKED' ? 'milestone-done' : 'milestone-next'}>{item.state}</span></div>)}<div className="earned-list"><span className="eyebrow">EARNED, NOT GIVEN</span>{game.achievements.map(item => <span className="achievement-chip" key={item}><Icon name="check" size={13}/>{item}</span>)}</div></section></div>
    <section className="preferences-section"><div><span className="eyebrow">YOUR INBOX, YOUR RULES</span><h2>Signal settings.</h2><p>Saved on this device with your career. No account connection.</p></div><div className="toggle-list">{[['bookings', 'Booking offers'], ['press', 'Press & radio'], ['release', 'Release updates']].map(([key, label]) => <label className="toggle-row" key={key}><span>{label}</span><input type="checkbox" checked={game.notifications[key]} onChange={() => onNotification(key)}/><i aria-hidden="true"/></label>)}</div></section>
  </div>;
}

function PersistentRail({ game, onCloseWeek, onNavigate }) {
  const next = game.opportunities.find(item => item.status === 'Open');
  const current = game.releases.find(item => item.status === 'Released');
  return <aside className="right-rail"><section className="rail-week"><span className="eyebrow">WEEKLY MARGIN</span><div className="rail-week-number">{String(game.week).padStart(2, '0')}<i> / 52</i></div><div className="rail-meter"><i style={{ width: `${(game.week % 52) / 52 * 100}%` }}/></div><p>One week closes. Streams settle, shows pay, energy comes back.</p><button className="button button-mint button-full" onClick={onCloseWeek}>Close Week <Icon name="arrow" size={14}/></button></section><section className="rail-event"><span className="eyebrow">THE NEXT CONVERSATION</span><span className="event-time">{next?.date || 'No deadline in view'}</span><b>{next?.title || 'The circuit is quiet.'}</b><small>{next?.place || 'Make your own news this week.'}</small><button className="text-link" onClick={() => onNavigate('Career')}>Open career desk <Icon name="arrow" size={13}/></button></section><section className="rail-release"><span className="eyebrow">IN ROTATION</span>{current && <><Cover release={current} className="rail-cover"/><b>{current.title}</b><span>{formatCount(current.streams)} plays <i>·</i> {current.trend > 0 ? `+${current.trend}%` : 'steady'}</span><button className="text-link" onClick={() => onNavigate('Music')}>Go to the record <Icon name="arrow" size={13}/></button></>}</section><div className="rail-foot">THE INDUSTRY NEVER CLOSES.<br/>YOUR WEEK CAN.</div></aside>;
}

const SESSION_CHOICES = [
  { id: 'lagos-room', room: 'Book a night at the Lantern Room', title: 'Never at Rest', genre: 'Alternative R&B', producer: 'Ari Madu', cost: 62000, energy: 12, quality: 78, cover: '/assets/treblr/covers/after-hours.jpg', color: 'moss', tag: 'SAFE BET', detail: 'A trusted room, a familiar producer. Balanced finish; protects the relationship and the budget.' },
  { id: 'accra-residency', room: 'Take the Accra co-write residency', title: 'Red Earth', genre: 'Alt-soul / Highlife', producer: 'Kweku North', cost: 108000, energy: 18, quality: 86, reputation: 2, cover: '/assets/treblr/covers/red-earth.jpg', color: 'clay', tag: 'CROSS-SCENE', detail: 'Travel and two writing days cost more. A cross-border collaboration may introduce a new audience.' },
  { id: 'live-room', room: 'Take the live-room residency', title: 'A Room Still Humming', genre: 'Live soul', producer: 'Skylark House Band', cost: 32000, energy: 8, quality: 70, cover: '/assets/treblr/covers/blue-hour.jpg', color: 'blue', tag: 'LOW-COST', detail: 'Keep the arrangement lean and capture a live take. A smaller budget, with less reach outside Lagos.' },
];
const CAMPAIGN_PLANS = [
  { id: 'street', name: 'Street team / city-first', cost: 28000, duration: 1, boost: 0.12, energy: 3, reach: 'Local saves and word of mouth', risk: 'Small footprint; most attention stays in Lagos.' },
  { id: 'press', name: 'Independent PR week', cost: 76000, duration: 2, boost: 0.31, energy: 5, reach: 'Press pitching + editorial consideration', risk: 'High cash outlay; no playlist placement is promised.' },
  { id: 'diaspora', name: 'Diaspora radio run', cost: 51000, duration: 1, boost: 0.24, energy: 7, reach: 'Accra, London and Toronto selectors', risk: 'More travel and interviews; the conversion is uncertain.' },
];

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="modal-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</section></div>;
}

function SessionModal({ game, onChoose, onClose }) {
  return <Modal title="Pick a room." eyebrow="MUSIC · CAREER SESSION" onClose={onClose} wide><p className="modal-intro">Choose the opportunity and the trade-off. The session resolves into a finished demo; you won't be asked to compose a track.</p><div className="choice-list">{SESSION_CHOICES.map((item, index) => <article className="choice-row" key={item.id}><span className="choice-no">0{index + 1}</span><div className="choice-copy"><div className="choice-tags"><span>{item.tag}</span><i>·</i><span>{item.genre}</span></div><h3>{item.room}</h3><p>{item.detail}</p><div className="choice-trade"><span>DEMO <b>“{item.title}”</b></span><span>FEE <b>{formatMoney(item.cost)}</b></span><span>ENERGY <b>−{item.energy}</b></span><span>QUALITY <b>{item.quality}/100</b></span></div></div><button className="button button-outline choice-button" disabled={game.player.cash < item.cost} onClick={() => onChoose(item)}>Book <Icon name="arrow" size={14}/></button></article>)}</div><div className="modal-footnote">Cash and artist energy are real constraints. The demo is saved immediately to your local career.</div></Modal>;
}

function CampaignModal({ game, releaseId, onChoose, onClose }) {
  const release = game.releases.find(item => item.id === releaseId);
  const [format, setFormat] = useState(RELEASE_FORMATS[release?.type] ? release.type : 'Single');
  if (!release) return null;
  const formatChoice = RELEASE_FORMATS[format] || RELEASE_FORMATS.Single;
  const formatCost = release.status === 'Released' || format === release.type ? 0 : formatChoice.cost;
  return <Modal title={release.status === 'Released' ? 'Give it a second week.' : 'Choose how it enters.'} eyebrow={`RELEASE STRATEGY · ${release.title.toUpperCase()}`} onClose={onClose} wide>
    <div className="campaign-release"><Cover release={release} className="campaign-cover"/><div><span className="eyebrow">CURRENT POSITION</span><b>{release.status}</b><p>{release.status === 'Released' ? `${formatCount(release.streams)} streams so far. Spend now to widen the story.` : `Quality ${release.quality}/100. ${format} · ${formatChoice.tracks} · Week ${game.week + formatChoice.delay}.`}</p></div></div>
    {release.status !== 'Released' && <section className="format-picker"><div><span className="eyebrow">PROJECT SHAPE · RELEASE FORMAT</span><h3>How much room does this record need?</h3></div><div className="format-choice-grid" role="group" aria-label="Release format">{Object.entries(RELEASE_FORMATS).map(([name, info]) => <button type="button" className={`format-choice ${format === name ? 'selected' : ''}`} aria-pressed={format === name} key={name} onClick={() => setFormat(name)}><strong>{name}</strong><small>{info.tracks}</small><span>{info.delay} {info.delay === 1 ? 'week' : 'weeks'} to release</span><em>{format === name ? 'SELECTED' : 'CHOOSE'}</em></button>)}</div><div className="format-summary" aria-live="polite"><span>{format} plan</span><p>{formatCost ? `${format} package fee ${formatMoney(formatCost)};` : 'No format-change fee;'} the audience window is modeled at {formatChoice.multiplier}× a single.</p></div></section>}
    <div className="choice-list campaign-list">{CAMPAIGN_PLANS.map((plan, index) => { const due = plan.cost + formatCost; return <article className="choice-row" key={plan.id}><span className="choice-no">0{index + 1}</span><div className="choice-copy"><div className="choice-tags"><span>{plan.reach}</span></div><h3>{plan.name}</h3><p>{plan.risk}</p><div className="choice-trade"><span>CAMPAIGN <b>{formatMoney(plan.cost)}</b></span><span>RUN <b>{plan.duration} {plan.duration === 1 ? 'week' : 'weeks'}</b></span><span>TOTAL DUE <b>{formatMoney(due)}</b></span></div></div><button className="button button-outline choice-button" disabled={game.player.cash < due} onClick={() => onChoose(release.id, { ...plan, format, formatCost, cost: due })}>Commit <Icon name="arrow" size={14}/></button></article>; })}</div>
    <p className="modal-footnote">*A modeled estimate, never a guarantee. Singles arrive sooner; EPs and albums cost more to package, take longer, and open a wider listener window.</p>
  </Modal>;
}

function WeekReport({ report, onContinue }) {
  if (!report) return null;
  return <Modal title="The week, accounted for." eyebrow={`WEEK ${report.week} · CLOSE REPORT`} onClose={onContinue} wide><div className="report-headline"><span className="report-spark"><Icon name="spark" size={25}/></span><div><h3>{report.headline}</h3><p>The industry moved while you were working. Here's what stayed with you.</p></div></div><div className="report-stats"><div><span>STREAMS SETTLED</span><b>+{formatCount(report.streams)}</b><small>across released masters</small></div><div><span>NET EARNED</span><b>{formatMoney(report.income)}</b><small>shows + listening</small></div><div><span>NEW FANS</span><b>+{formatCount(report.fans)}</b><small>people in your corner</small></div><div><span>WORLD RANK</span><b>#{report.newRank} <small>{report.newRank <= report.oldRank ? '↑' : '↓'}</small></b><small>independent 50</small></div></div><div className="report-bottom"><span><Icon name="spark" size={16}/> +{report.energyRecovered} energy recovered</span><b>WEEK {report.week + 1} IS OPEN</b></div><button className="button button-mint button-full report-continue" onClick={onContinue}>Keep moving <Icon name="arrow" size={15}/></button></Modal>;
}

export default function TreblrApp() {
  const [game, setGame] = useState(readSavedCareer);
  const [active, setActive] = useState('Home');
  const [releaseId, setReleaseId] = useState(null);
  const [modal, setModal] = useState(null);
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState('');
  useEffect(() => { persistCareer(game); }, [game]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3400); return () => clearTimeout(timer); }, [toast]);
  const navigate = item => { setActive(item); setReleaseId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const act = action => {
    const previous = game;
    const next = gameReducer(previous, action);
    if (next === previous) {
      setToast(action.type === 'CAMPAIGN' || action.type === 'SESSION' ? 'Not enough cash for that commitment.' : 'That choice is no longer available.');
      return false;
    }
    setGame(next);
    return true;
  };
  const closeWeek = () => { if (act({ type: 'WEEK' })) setReport(gameReducer(game, { type: 'WEEK' }).lastReport); };
  const chooseSession = session => { if (act({ type: 'SESSION', session })) { setModal(null); setToast(`Session complete. “${session.title}” is in the catalogue.`); setActive('Music'); } };
  const chooseCampaign = (id, plan) => { if (act({ type: 'CAMPAIGN', releaseId: id, plan })) { setModal(null); setReleaseId(null); setToast(`${plan.format} format · ${plan.name} committed. Your budget has changed.`); } };
  const decideOpportunity = (id, accept) => { const opportunity = game.opportunities.find(item => item.id === id); if (act({ type: 'OPPORTUNITY', id, accept })) setToast(accept ? `${opportunity?.title} accepted. Check the career log.` : 'You passed. No cash moved.'); };
  const page = active === 'Home' ? <HomePage game={game} onOpenRelease={id => { setActive('Music'); setReleaseId(id); }} onOpenSession={() => setModal({ type: 'session' })} onCampaign={id => setModal({ type: 'campaign', releaseId: id })} onNavigate={navigate}/> : active === 'Music' ? <MusicPage game={game} releaseId={releaseId} onOpenRelease={setReleaseId} onCloseRelease={() => setReleaseId(null)} onOpenSession={() => setModal({ type: 'session' })} onCampaign={id => setModal({ type: 'campaign', releaseId: id })}/> : active === 'Career' ? <CareerPage game={game} onOpportunity={decideOpportunity}/> : active === 'World' ? <WorldPage game={game}/> : <YouPage game={game} onNotification={key => act({ type: 'NOTIFICATION', key })}/>;
  return <div className="app-frame"><SideNav active={active} onNavigate={navigate} game={game}/><div className="app-workspace"><TopBar game={game} onCloseWeek={closeWeek} onNavigate={navigate}/><div className="workspace-grid"><main className="main-column" key={`${active}-${releaseId || ''}`}>{page}<footer className="page-footer"><span>THE TREBLR FILE · YOUR CAREER IS YOURS</span><span>LOCAL SAVE <i>·</i> WEEK {game.week}</span></footer></main><PersistentRail game={game} onCloseWeek={closeWeek} onNavigate={navigate}/></div></div><BottomNav active={active} onNavigate={navigate}/>
    {modal?.type === 'session' && <SessionModal game={game} onChoose={chooseSession} onClose={() => setModal(null)}/>} {modal?.type === 'campaign' && <CampaignModal game={game} releaseId={modal.releaseId} onChoose={chooseCampaign} onClose={() => setModal(null)}/>} {report && <WeekReport report={report} onContinue={() => setReport(null)}/>}
    {toast && <div role="status" className="toast"><span className="live-dot"/>{toast}<button onClick={() => setToast('')} aria-label="Dismiss message"><Icon name="close" size={14}/></button></div>}
  </div>;
}
