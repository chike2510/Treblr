import { useEffect, useRef, useState } from 'react';
import {
  DISCOVER_ITEMS,
  FESTIVALS,
  GAME_TABS,
  GENRES,
  JOBS,
  LABEL_OFFERS,
  MARKETS,
  RELEASE_CAMPAIGNS,
  SOCIAL_STORIES,
  STUDIO_FOCUSES,
} from './gameData';
import { createCareer, gameReducer } from './gameEngine';
import { exportCareer, loadCareer, parseCareerBackup, saveCareer } from './saveStore';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const cash = (value) => `${compact.format(Math.max(0, Number(value) || 0))} CR`;
const marketFor = (id) => MARKETS.find((item) => item.id === id) || MARKETS[0];
const genreFor = (id) => GENRES.find((item) => item.id === id) || GENRES[0];

function Icon({ children }) { return <span className="nav-icon" aria-hidden="true">{children}</span>; }
function Button({ children, tone = 'primary', className = '', ...props }) { return <button className={`button button-${tone} ${className}`} {...props}>{children}</button>; }
function Wordmark({ small = false }) { return <span className={`wordmark${small ? ' wordmark-small' : ''}`}><i aria-hidden="true"><b/><b/><b/></i>TREBLR</span>; }
function Kicker({ children }) { return <span className="kicker">{children}</span>; }
function PageIntro({ kicker, title, children }) { return <div className="page-intro"><Kicker>{kicker}</Kicker><h1>{title}</h1><p>{children}</p></div>; }
function CardTitle({ kicker, title, note }) { return <div className="card-title"><div><Kicker>{kicker}</Kicker><h2>{title}</h2>{note && <p>{note}</p>}</div></div>; }

const MAP_POINTS = {
  toronto: { x: 105, y: 93, labelY: 57 },
  atlanta: { x: 142, y: 194, labelY: 234 },
  london: { x: 304, y: 103, labelY: 65 },
  accra: { x: 403, y: 218, labelY: 255 },
  lagos: { x: 474, y: 178, labelY: 144 },
};
const MAP_ROUTES = [
  { from: 'toronto', to: 'atlanta', d: 'M105 93 C82 129 99 163 142 194' },
  { from: 'toronto', to: 'london', d: 'M105 93 C167 26 241 34 304 103' },
  { from: 'atlanta', to: 'london', d: 'M142 194 C187 226 258 169 304 103' },
  { from: 'london', to: 'accra', d: 'M304 103 C346 128 353 183 403 218' },
  { from: 'accra', to: 'lagos', d: 'M403 218 C424 176 453 159 474 178' },
  { from: 'london', to: 'lagos', d: 'M304 103 C371 74 438 105 474 178' },
];

function NetworkMap({ career, focusedMarketId, onFocusMarket, signalMarketId = null, signalVersion = 0, compactMap = false }) {
  const currentMarketId = career.currentMarketId;
  return <div className={`network-map${compactMap ? ' network-map-compact' : ''}`}>
    <svg key={signalVersion} viewBox="0 0 580 290" aria-label="Five connected music markets. Choose a city to focus its local opportunities." role="group">
      <g className="map-guides" aria-hidden="true"><path d="M20 48H560M20 145H560M20 244H560"/><path d="M70 24V270M205 24V270M340 24V270M475 24V270"/><text x="23" y="40">NORTH AMERICA</text><text x="246" y="40">EUROPE</text><text x="389" y="40">WEST AFRICA</text></g>
      {MAP_ROUTES.map((route) => {
        const connected = route.from === currentMarketId || route.to === currentMarketId || route.from === focusedMarketId || route.to === focusedMarketId;
        const signaled = Boolean(signalMarketId && (route.from === signalMarketId || route.to === signalMarketId));
        return <path key={`${route.from}-${route.to}`} className={`map-route${connected ? ' route-connected' : ''}${signaled ? ' route-signal' : ''}`} d={route.d}/>;
      })}
      {MARKETS.map((market) => {
        const point = MAP_POINTS[market.id];
        const current = market.id === currentMarketId;
        const focused = market.id === focusedMarketId;
        const progress = career.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 };
        return <g key={market.id} className={`map-hub tone-${market.tone}${current ? ' hub-current' : ''}${focused ? ' hub-focused' : ''}${market.id === signalMarketId ? ' hub-signal' : ''}`} role="button" tabIndex={0} aria-pressed={focused} aria-label={`Focus ${market.name}, ${market.code}, ${progress.familiarity}% familiarity${current ? ', current city' : ''}`} data-testid={`circuit-market-${market.id}`} onClick={() => onFocusMarket(market.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onFocusMarket(market.id); } }}>
          <rect className="hub-hit-area" x={point.x - 45} y={point.y - 45} width="90" height="90" rx="18"/>
          <circle className="hub-ring" cx={point.x} cy={point.y} r="23"/><circle className="hub-dot" cx={point.x} cy={point.y} r="6"/>
          {market.id === signalMarketId && <circle key={signalVersion} className="hub-pulse" cx={point.x} cy={point.y} r="18"/>}
          <text className="hub-code" x={point.x} y={point.y + 3}>{market.code}</text>
          <text className="hub-city" x={point.x} y={point.labelY}>{market.name.toUpperCase()}</text>
          {current && <text className="hub-state" x={point.x} y={point.labelY + (point.labelY < point.y ? -13 : 14)}>ON AIR · CURRENT</text>}
        </g>;
      })}
      <text className="map-caption" x="24" y="282">SELECT A HUB TO SEE LOCAL SIGNAL</text>
      <text className="map-caption map-caption-right" x="555" y="282" textAnchor="end">{career.visitedMarkets.length} / 5 MARKETS TOUCHED</text>
    </svg>
  </div>;
}

function Welcome({ savedCareer, onContinue, onCreate }) {
  return <main className="welcome-screen"><header className="welcome-head"><Wordmark/><span className="pill">A MUSIC CAREER YOU CAN PLAY</span></header>
    <div className="welcome-body"><div className="welcome-copy"><Kicker>YOUR LIFE IN MUSIC</Kicker><h1>One career.<br/><em>Many ways up.</em></h1><p>Choose what gets your time this week. Build a catalogue, take the right rooms, find your people, and see where the work takes you.</p><div className="market-pills" aria-label="Five music markets">{MARKETS.map((market) => <span key={market.id}><i className={`market-dot dot-${market.tone}`}/>{market.name}</span>)}</div><div className="welcome-actions">{savedCareer && <Button onClick={onContinue}>Continue as {savedCareer.stageName} <span aria-hidden="true">→</span></Button>}<Button tone={savedCareer ? 'outline-light' : 'primary'} onClick={onCreate}>{savedCareer ? 'Start a new career' : 'Start your career'} <span aria-hidden="true">→</span></Button></div><small>Saved on this device · Fictional in-game world</small></div>
      <div className="welcome-circuit" aria-label="A connected career circuit linking Lagos, Accra, London, Atlanta, and Toronto"><div className="welcome-map-header"><Kicker>ONE CAREER · FIVE REAL MARKETS</Kicker><span>GLOBAL RELAY / 05</span></div><svg viewBox="0 0 580 290" aria-hidden="true"><path d="M105 93 C82 129 99 163 142 194M105 93 C167 26 241 34 304 103M142 194 C187 226 258 169 304 103M304 103 C346 128 353 183 403 218M403 218 C424 176 453 159 474 178M304 103 C371 74 438 105 474 178"/><g><circle cx="105" cy="93" r="11"/><text x="105" y="59">TOR · YYZ</text><circle cx="142" cy="194" r="11"/><text x="142" y="233">ATL · ATL</text><circle cx="304" cy="103" r="11"/><text x="304" y="68">LON · LON</text><circle cx="403" cy="218" r="11"/><text x="403" y="258">ACC · ACC</text><circle cx="474" cy="178" r="11"/><text x="474" y="145">LAG · LOS</text></g></svg><div className="welcome-map-foot"><span>GIGS CHANGE YOUR POSITION</span><span>RELEASES CARRY YOUR NAME</span></div></div></div>
    <footer className="welcome-foot">A WEEK AT A TIME <i/> YOUR CHOICES, YOUR CAREER</footer>
  </main>;
}

function Onboarding({ onBack, onStart }) {
  const [stageName, setStageName] = useState('');
  const [marketId, setMarketId] = useState('lagos');
  const [genreId, setGenreId] = useState('afrobeats');
  return <main className="setup-screen"><header className="setup-head"><button className="text-button" onClick={onBack}>← Back</button><Wordmark small/><Kicker>START HERE</Kicker></header><form className="setup-card" onSubmit={(event) => { event.preventDefault(); if (stageName.trim()) onStart({ stageName: stageName.trim(), marketId, genreId }); }}>
    <Kicker>YOUR FIRST DECISIONS</Kicker><h1>Who’s taking<br/>the first call?</h1><label className="field-label" htmlFor="artist-name">ARTIST NAME</label><input id="artist-name" data-testid="artist-name" className="text-input" value={stageName} onChange={(event) => setStageName(event.target.value)} maxLength={24} placeholder="Your name on the bill" required/>
    <fieldset><legend>Choose a home market</legend><div className="market-choice">{MARKETS.map((market) => <button type="button" data-testid={`market-${market.id}`} aria-pressed={marketId === market.id} className={marketId === market.id ? 'selected' : ''} onClick={() => setMarketId(market.id)} key={market.id}><i className={`market-dot dot-${market.tone}`}/><b>{market.name}</b><small>{market.region}</small></button>)}</div></fieldset>
    <fieldset><legend>Where does your sound sit?</legend><div className="genre-choice">{GENRES.map((genre) => <button type="button" data-testid={`genre-${genre.id}`} aria-pressed={genreId === genre.id} className={genreId === genre.id ? 'selected' : ''} onClick={() => setGenreId(genre.id)} key={genre.id}><i style={{ '--genre': genre.color }}>{genre.mark}</i><b>{genre.name}</b></button>)}</div></fieldset>
    <Button type="submit" disabled={!stageName.trim()} data-testid="begin-career">Take your first week <span aria-hidden="true">→</span></Button><small>Your new career is saved locally in this browser.</small>
  </form></main>;
}

function Navigation({ activeTab, setActiveTab, desktop = false }) {
  const glyphs = { home: '⌂', music: '♫', studio: '✳', contracts: '↗', social: '◎', discover: '⌕', settings: '⚙' };
  return <nav className={desktop ? 'desktop-nav' : 'mobile-nav'} aria-label="Main navigation">{GAME_TABS.map((tab) => <button key={tab.id} data-testid={`tab-${tab.id}`} className={activeTab === tab.id ? 'is-active' : ''} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)}><Icon>{glyphs[tab.id]}</Icon><span>{tab.name}</span></button>)}</nav>;
}

function TopBar({ career, onCloseWeek }) {
  return <header className="topbar"><div className="topbar-row"><div className="artist-identity"><span className="artist-avatar">{career.stageName.slice(0, 1).toUpperCase()}</span><div><b>{career.stageName}</b><small>{marketFor(career.currentMarketId).name} · WEEK {String(career.week).padStart(2, '0')}</small></div></div><div className="topbar-economy"><span><small>CASH</small><b data-testid="balance">{cash(career.credits)}</b></span><span><small>FANS</small><b data-testid="fans">{compact.format(career.fans)}</b></span></div><Button tone="dark" className="close-week" data-testid="close-week" onClick={onCloseWeek}>Close week <span aria-hidden="true">→</span></Button></div><div className="status-row"><div className="status-meter"><span><b>Energy</b><small>{career.energy}/100</small></span><i><b style={{ width: `${career.energy}%` }}/></i></div><div className="status-meter health-meter"><span><b>Health</b><small>{career.health}/100</small></span><i><b style={{ width: `${career.health}%` }}/></i></div><div className="action-meter" aria-label={`${career.actionPoints} of 3 weekly actions remaining`}><span><b>This week</b><small>{career.actionPoints}/3 actions</small></span><i>{[0, 1, 2].map((index) => <b key={index} className={index < career.actionPoints ? 'ready' : ''}/>)}</i></div></div></header>;
}

function HomeView({ career, setTab, focusedMarketId, onFocusMarket, signalMarketId, signalVersion }) {
  const latest = [...career.projects].reverse().find((item) => item.status === 'released');
  const market = marketFor(focusedMarketId);
  const progress = career.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 };
  const greeting = career.actionPoints === 3 ? 'You have a full week ahead.' : career.actionPoints === 0 ? 'That’s the week’s work done.' : `${career.actionPoints} career ${career.actionPoints === 1 ? 'move' : 'moves'} left this week.`;
  return <div className="page-content home-view"><PageIntro kicker={`WEEK ${String(career.week).padStart(2, '0')} · ${market.code} / ${market.country}`} title="Your week, in motion">{greeting} Pick the work that matters most right now.</PageIntro>
    <section className="relay-stage" aria-labelledby="relay-heading"><div className="relay-stage-head"><div><Kicker>GLOBAL RELAY / FIVE LIVE MARKETS</Kicker><h2 id="relay-heading">Every city is a door.</h2><p>Follow the signal. Pick a hub to see its local audience and the next room waiting there.</p></div><span className="relay-count"><b>{career.visitedMarkets.length}<i>/05</i></b><small>MARKETS<br/>REACHED</small></span></div>
      <NetworkMap career={career} focusedMarketId={focusedMarketId} onFocusMarket={onFocusMarket} signalMarketId={signalMarketId} signalVersion={signalVersion}/>
      <div className="market-focus" data-testid="market-focus"><div className="market-focus-identity"><span className={`market-code tone-${market.tone}`}>{market.code}</span><div><Kicker>{market.id === career.currentMarketId ? 'CURRENT CITY · LIVE' : 'OPPORTUNITY FOCUS'}</Kicker><h3>{market.name}<small>{market.country} / {market.region}</small></h3></div></div><div className="market-focus-stats"><span><small>LOCAL SIGNAL</small><b>{progress.familiarity}%</b></span><span><small>LOCAL FANS</small><b>{compact.format(progress.fans)}</b></span><span><small>ROOMS PLAYED</small><b>{progress.gigs}</b></span></div><Button tone="outline" onClick={() => setTab('contracts')}>See {market.name} opportunities <span aria-hidden="true">→</span></Button></div>
    </section>
    <LiveEditorial market={market} onExplore={() => setTab('contracts')}/>
    <section className="relay-actions"><div className="relay-actions-head"><Kicker>YOUR WEEK / THREE ACTIONS</Kicker><h2>Where will you send it?</h2><p>Sessions make releases. Shows move the route. People carry the story.</p></div><button className="relay-action action-music" onClick={() => setTab('studio')}><span>01 / BUILD</span><b>Studio time</b><small>Writing, rehearsal, coaching or a day to reset.</small><i>Open Studio →</i></button><button className="relay-action action-contract" onClick={() => setTab('contracts')}><span>02 / ROUTE</span><b>A room in {market.name}</b><small>Book a show, tour stop, festival or label term.</small><i>Open Contracts →</i></button><button className="relay-action action-social" onClick={() => setTab('social')}><span>03 / REACH</span><b>Share the moment</b><small>Build familiarity with the people listening.</small><i>Open Social →</i></button></section>
    <section className="home-latest"><div><Kicker>LAST SIGNAL</Kicker><b>{career.log.at(-1)?.text || 'Your first move starts in this city.'}</b></div><div className="home-catalogue">{latest ? <><span className="release-mark">{genreFor(career.genreId).mark}</span><span><Kicker>CATALOGUE / LAST RELEASE</Kicker><b>{latest.title}</b><small>Week {latest.releaseWeek} · {compact.format(latest.totalStreams)} modeled listeners · {marketFor(latest.marketId).code}</small></span><button className="text-button" onClick={() => setTab('music')}>Open Music →</button></> : <><span className="release-mark">{genreFor(career.genreId).mark}</span><span><Kicker>CATALOGUE / FIRST SIGNAL</Kicker><b>A story still in the making.</b><small>Your studio team shapes the work. You choose when it reaches the world.</small></span><button className="text-button" onClick={() => setTab('music')}>Open Music →</button></>}</div></section>
  </div>;
}

function LiveEditorial({ market, onExplore }) {
  return <section className="live-editorial" aria-labelledby="live-editorial-title">
    <div className="live-editorial-head"><Kicker>FIELD NOTES / THE LIVE CIRCUIT</Kicker><span>ROOM TO ROUTE · 01 / 02</span></div>
    <div className="live-editorial-grid">
      <figure className="live-editorial-photo live-editorial-primary">
        <img src="/assets/live/live-room-stage.webp" alt="A guitarist playing under blue and red lights on a small live stage" width="1120" height="746"/>
        <figcaption><span>LIVE ROOM · ON STAGE</span><span>GLOBAL RELAY / 01</span></figcaption>
      </figure>
      <div className="live-editorial-copy">
        <Kicker>FROM {market.code} TO THE NEXT CITY</Kicker>
        <h2 id="live-editorial-title">Every city has a first room.</h2>
        <p>Playing the room grows your local signal. Take the next show somewhere new and let the audience travel with you.</p>
        <Button tone="outline" onClick={onExplore}>Find a room in {market.name} <span aria-hidden="true">→</span></Button>
      </div>
      <figure className="live-editorial-photo live-editorial-secondary">
        <img src="/assets/live/live-room-crowd.webp" alt="A live band performs with a violin and guitars in front of a crowd" width="960" height="640"/>
        <figcaption><span>LIVE BAND · A LOCAL ROOM</span></figcaption>
      </figure>
    </div>
  </section>;
}

function MusicView({ career, run, setTab, focusedMarketId, onFocusMarket, signalMarketId, signalVersion }) {
  const [campaignId, setCampaignId] = useState('diy');
  const ready = career.projects.filter((item) => item.status === 'ready');
  const releases = [...career.projects].filter((item) => item.status === 'released').reverse();
  return <div className="page-content"><PageIntro kicker="MUSIC · RELEASES & MOMENTUM" title="A catalogue takes shape.">Singles arrive from studio sessions and collaborations. Choose when they go out and how much of the week to put behind them.</PageIntro>
    <div className="music-summary"><span><small>RELEASES</small><b>{career.stats.releases}</b></span><span><small>CAREER LISTENERS</small><b>{compact.format(career.stats.careerStreams)}</b></span><span><small>THIS WEEK</small><b>{compact.format(career.stats.lastWeekStreams)}</b></span></div>
    {ready.length > 0 ? <section className="panel"><CardTitle kicker="READY WHEN YOU ARE" title="Choose a release moment." note="Your studio team has a single ready. Pick a campaign, then make it part of your story."/><label className="field-label" htmlFor="campaign-select">CAMPAIGN CHOICE</label><select id="campaign-select" className="select-input" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>{RELEASE_CAMPAIGNS.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.fee.toLocaleString()} CR</option>)}</select><div className="ready-projects">{ready.map((project) => { const campaign = RELEASE_CAMPAIGNS.find((item) => item.id === campaignId); return <article className="release-event" key={project.id}><span className="release-mark">{genreFor(career.genreId).mark}</span><div className="release-event-copy"><Kicker>STUDIO SESSION · WEEK {project.createdWeek}</Kicker><h3>{project.title}</h3><p>{project.type} · Quality {project.quality} · {marketFor(project.marketId).name} team</p></div><Button disabled={career.actionPoints < 1 || career.credits < campaign.fee} data-testid={`release-${project.id}`} onClick={() => run('release', { projectId: project.id, campaignId })}>Launch release <span aria-hidden="true">→</span></Button></article>; })}</div></section> : <section className="panel empty-panel"><span className="empty-orbit">♫</span><div><Kicker>NO RELEASE READY</Kicker><h2>Every career has a first single.</h2><p>Book a writing session in Studio; your team will bring a release candidate back here.</p><Button onClick={() => setTab('studio')}>Go to Studio →</Button></div></section>}
    <section className="panel"><CardTitle kicker="YOUR RELEASE HISTORY" title={releases.length ? 'The work out in the world.' : 'The catalogue starts with a choice.'} note="Listener counts, campaign reach, and chart movement are modeled in this career."/>{releases.length ? <div className="catalogue-list">{releases.map((item, index) => <article className="catalogue-row" key={item.id}><span className="catalogue-rank">{String(releases.length - index).padStart(2, '0')}</span><span className="release-mark">{genreFor(career.genreId).mark}</span><div><b>{item.title}</b><small>{item.type} · Week {item.releaseWeek} · {item.campaignId} campaign</small></div><strong>{compact.format(item.totalStreams)}<small>listeners</small></strong></article>)}</div> : <p className="empty-copy">Nothing released yet. Your studio team will bring a project here when it is ready for a release decision.</p>}</section>
    <section className="audience-circuit"><CardTitle kicker="AUDIENCE ON THE ROUTE" title="Local support has a home." note="Each return, gig, or festival adds real in-game familiarity and local fans. Choose a city to focus that market."/><NetworkMap career={career} focusedMarketId={focusedMarketId} onFocusMarket={onFocusMarket} signalMarketId={signalMarketId} signalVersion={signalVersion} compactMap/><div className="audience-market-list">{MARKETS.map((market) => { const progress = career.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 }; const focused = market.id === focusedMarketId; return <button className={focused ? 'audience-market is-focused' : 'audience-market'} key={market.id} data-testid={`audience-market-${market.id}`} aria-pressed={focused} onClick={() => onFocusMarket(market.id)}><span className={`market-code tone-${market.tone}`}>{market.code}</span><span><b>{market.name}</b><small>{market.region}</small></span><span className="audience-market-number"><b>{compact.format(progress.fans)}</b><small>LOCAL FANS</small></span><span className="audience-meter"><i><b style={{ width: `${progress.familiarity}%` }}/></i><small>{progress.familiarity}% familiar</small></span></button>; })}</div><Button tone="outline" onClick={() => setTab('contracts')}>Find a {marketFor(focusedMarketId).name} room <span aria-hidden="true">→</span></Button></section>
  </div>;
}

function StudioView({ career, run }) {
  const activeMarket = marketFor(career.currentMarketId);
  return <div className="page-content"><PageIntro kicker={`STUDIO · ${activeMarket.code} / ${activeMarket.country} · PEOPLE & PREPARATION`} title="Make room to grow.">Studio time is about people, preparation, and your next career step. Each booking uses one weekly action; your team shapes the release.</PageIntro>
    <section className="studio-feature"><div className="studio-home-label"><span className={`market-code tone-${activeMarket.tone}`}>{activeMarket.code}</span><span><Kicker>HOME ROOM · {activeMarket.name.toUpperCase()}</Kicker><h2>What would move you forward?</h2><p>A writing room can develop the next single. Rehearsal and coaching prepare you to carry the work into a new market.</p></span></div><div className="studio-calendar"><span>THIS WEEK</span><b>{career.actionPoints}<small> actions<br/>left</small></b><i>{['M', 'T', 'W', 'T', 'F'].map((day, index) => <em key={`${day}-${index}`} className={index < 3 - career.actionPoints ? 'past' : ''}>{day}</em>)}</i></div></section>
    <section className="studio-options"><CardTitle kicker="BOOK A SESSION" title="Pick the work." note="Session fees and energy cost are clear before you book."/><div className="session-grid">{STUDIO_FOCUSES.map((focus, index) => <article className={`session-card session-${focus.id}`} key={focus.id}><span className="session-index">0{index + 1}</span><span className="session-glyph">{focus.id === 'writing' ? '✎' : focus.id === 'rehearsal' ? '◉' : '✦'}</span><Kicker>{focus.id === 'writing' ? 'PROJECT DEVELOPMENT' : focus.id === 'rehearsal' ? 'LIVE PREPARATION' : 'ARTIST DEVELOPMENT'}</Kicker><h3>{focus.name}</h3><p>{focus.detail}</p><div className="session-benefit"><span>{focus.skill} <b>+{focus.gain}</b></span><span>Energy <b>−{focus.energy}</b></span></div><Button disabled={career.actionPoints < 1 || career.credits < focus.cost} data-testid={`studio-session-${focus.id}`} onClick={() => run('studio-session', { focusId: focus.id })}>Book · {focus.cost.toLocaleString()} CR</Button></article>)}</div></section>
    <section className="panel recovery-panel"><div><Kicker>LOOK AFTER THE LONG GAME</Kicker><h2>Take a recovery day.</h2><p>Rest improves health and energy, and shows your team you’re thinking beyond this week.</p></div><Button tone="outline" disabled={career.actionPoints < 1 || (career.energy > 78 && career.health > 86)} onClick={() => run('rest')}>Make space to recover</Button></section>
    <section className="panel"><CardTitle kicker="PROJECT BOARD" title="Sessions in progress." note="Writing sessions create release-ready projects; each release is a career milestone."/>{career.projects.length ? <div className="project-board">{[...career.projects].reverse().map((project) => <div className="project-row" key={project.id}><span className={`project-status ${project.status}`}>{project.status === 'ready' ? 'READY' : 'RELEASED'}</span><b>{project.title}</b><small>{project.type} · {project.status === 'ready' ? `Quality ${project.quality}` : `Week ${project.releaseWeek}`}</small></div>)}</div> : <p className="empty-copy">No active projects. A songwriting session will bring a new project to the board.</p>}</section>
  </div>;
}

function ContractsView({ career, run, focusedMarketId, onFocusMarket, signalMarketId, signalVersion }) {
  const focusedMarket = marketFor(focusedMarketId);
  const focusedProgress = career.marketProgress[focusedMarket.id] || { familiarity: 0, fans: 0, gigs: 0 };
  return <div className="page-content"><PageIntro kicker={`CONTRACTS · ${focusedMarket.code} / ${focusedMarket.country} · GIGS, TOURS & TERMS`} title="Pick the room—and the terms.">Travel costs, local familiarity, and your energy all shape how a show lands. Every market remains part of one connected circuit.</PageIntro>
    <section className="tour-route"><div><Kicker>TOUR RUN</Kicker><h2>{career.stats.tourStops ? `${career.stats.tourStops} tour ${career.stats.tourStops === 1 ? 'stop' : 'stops'} played` : 'Take your first show on the road.'}</h2><p>Away-market gigs become stops on your tour log. Each one builds local familiarity for the next visit.</p></div><div className="tour-route-markets">{career.visitedMarkets.map((id, index) => <span key={`${id}-${index}`} className={id === career.homeMarketId ? 'home-stop' : ''}>{index + 1}<small>{marketFor(id).name}</small></span>)}</div></section>
    <section className="circuit-dispatch"><div className="dispatch-heading"><CardTitle kicker="GLOBAL CIRCUIT / LIVE" title="Five markets. One connected route." note="Focus a hub to inspect its crowd; playing a room moves your active city and sends a signal down the line."/></div><NetworkMap career={career} focusedMarketId={focusedMarketId} onFocusMarket={onFocusMarket} signalMarketId={signalMarketId} signalVersion={signalVersion}/><div className="dispatch-readout"><span className={`market-code tone-${focusedMarket.tone}`}>{focusedMarket.code}</span><div><Kicker>{focusedMarket.id === career.currentMarketId ? 'CURRENT CITY · OPPORTUNITY LIVE' : 'CITY FOCUS · NOT YET ON THE GROUND'}</Kicker><b>{focusedMarket.name}<small>{focusedMarket.venue} · {focusedMarket.region}</small></b></div><span><small>LOCAL SIGNAL</small><b>{focusedProgress.familiarity}%</b></span><span><small>LOCAL FANS</small><b>{compact.format(focusedProgress.fans)}</b></span><Button data-testid={`focus-gig-${focusedMarket.id}`} disabled={career.actionPoints < 1 || career.credits < (career.currentMarketId === focusedMarket.id ? 0 : focusedMarket.fare)} onClick={() => run('gig', { marketId: focusedMarket.id })}>{focusedMarket.id === career.homeMarketId ? 'Play local room' : `Route to ${focusedMarket.name}`} <span aria-hidden="true">→</span></Button></div>
      <div className="market-grid">{MARKETS.map((market) => { const progress = career.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 }; const here = career.currentMarketId === market.id; const focused = focusedMarketId === market.id; return <article className={`market-card${here ? ' market-here' : ''}${focused ? ' market-selected' : ''}`} key={market.id}><div className="market-card-head"><span className={`market-number tone-${market.tone}`}>{market.code}</span><small>{here ? 'CURRENT CITY' : market.region}</small></div><h3>{market.name} <small>{market.country}</small></h3><p>{market.venue}</p><div className="market-progress"><span><small>LOCAL SIGNAL</small><b>{progress.familiarity}%</b></span><i><b style={{ width: `${progress.familiarity}%` }}/></i><small>{progress.gigs ? `${progress.gigs} ${progress.gigs === 1 ? 'show' : 'shows'} · ${compact.format(progress.fans)} local fans` : 'A new crowd to meet'}</small></div><div className="market-card-foot"><span>{here ? 'ON AIR' : `TRAVEL · ${cash(market.fare)}`}</span><Button tone="outline" data-testid={`focus-market-${market.id}`} aria-pressed={focused} onClick={() => onFocusMarket(market.id)}>View market</Button><Button disabled={career.actionPoints < 1 || career.credits < (here ? 0 : market.fare)} data-testid={`gig-${market.id}`} onClick={() => run('gig', { marketId: market.id })}>{market.id === career.homeMarketId ? 'Play local room' : 'Book tour stop'}</Button></div></article>; })}</div></section>
    <section className="panel"><CardTitle kicker="FESTIVAL INVITATIONS" title="A bigger stage, when you’re ready." note="Build your fanbase and reputation to unlock the rooms that fit your career."/><div className="opportunity-list">{FESTIVALS.map((festival) => { const ready = career.fans >= festival.minimumFans && career.reputation >= festival.minimumRep; const played = career.festivalsPlayed.includes(festival.id); return <article className="opportunity-row" key={festival.id}><span className="opportunity-icon">✳</span><div><b>{festival.name}</b><small>{marketFor(festival.marketId).name} · {festival.minimumFans.toLocaleString()} fans · {festival.minimumRep} reputation</small></div><span className="opportunity-reward">+{festival.fee.toLocaleString()} CR<br/>+{festival.fans} fans</span><Button tone="outline" disabled={!ready || played || career.actionPoints < 1 || career.credits < (career.currentMarketId === festival.marketId ? 0 : marketFor(festival.marketId).fare)} data-testid={`festival-${festival.id}`} onClick={() => run('festival', { festivalId: festival.id })}>{played ? 'Played' : ready ? 'Accept invitation' : 'Build your draw'}</Button></article>; })}</div></section>
    <section className="contract-split"><section className="panel"><CardTitle kicker="PAID CALLS" title="Keep work moving." note="One action, clear pay, and a useful career connection."/><div className="opportunity-list">{JOBS.map((job) => <article className="opportunity-row job-opportunity" key={job.id}><span className="opportunity-icon">{job.id === 'session-call' ? '✦' : '↗'}</span><div><b>{job.title}</b><small>{job.detail}</small></div><span className="opportunity-reward">+{job.pay.toLocaleString()} CR<br/>+{job.fans} fans</span><Button tone="outline" disabled={career.actionPoints < 1} onClick={() => run('job', { jobId: job.id })}>Take call</Button></article>)}</div></section>
      <section className="panel"><CardTitle kicker="LABEL CONVERSATIONS" title="Money now, terms later." note="Fictional contract choices affect the share of future release income."/>{career.label?.releasesLeft > 0 && <div className="signed-label"><b>{career.label.name}</b><small>{career.label.releasesLeft} release{career.label.releasesLeft === 1 ? '' : 's'} left · {career.label.share}% share</small></div>}<div className="label-list">{LABEL_OFFERS.map((offer) => { const signed = career.label?.id === offer.id && career.label.releasesLeft > 0; const eligible = career.reputation >= offer.minimumRep; return <article className="label-offer" key={offer.id}><div><b>{offer.name}</b><small>{offer.detail}</small><span>Advance {cash(offer.advance)} · {offer.share}% share</span></div><Button tone="outline" disabled={!eligible || career.actionPoints < 1 || (career.label?.releasesLeft || 0) > 0} data-testid={`label-${offer.id}`} onClick={() => run('sign-label', { labelId: offer.id })}>{signed ? 'Current deal' : eligible ? 'Accept terms' : `${offer.minimumRep} reputation`}</Button></article>; })}</div></section></section>
  </div>;
}

function SocialView({ career, run }) {
  return <div className="page-content"><PageIntro kicker="SOCIAL · PUBLICITY & PEOPLE" title="Tell the story around the work.">Choose what you share. Different moments reach different listeners and strengthen different relationships; all results stay inside this game.</PageIntro>
    <section className="social-banner"><div><Kicker>PUBLICITY ENERGY</Kicker><b>{career.socialEnergy}<small> / {3} choices</small></b><p>Rested again when you close the week.</p></div><div className="social-counts"><span>MODELED REACH<b>{compact.format(career.socialStats.audience)}</b></span><span>NEW FANS<b>{compact.format(career.fans)}</b></span></div></section>
    <section className="social-story-grid">{SOCIAL_STORIES.map((story, index) => <article className={`social-story story-${story.id}`} key={story.id}><span className="story-number">0{index + 1}</span><span className="story-shape">{index === 0 ? '✎' : index === 1 ? '↗' : '♡'}</span><Kicker>{index === 0 ? 'FROM THE STUDIO' : index === 1 ? 'OUT IN THE WORLD' : 'WITH YOUR PEOPLE'}</Kicker><h2>{story.name}</h2><p>{story.detail}</p><div className="story-outcome"><span>Fans <b>+{story.fans}</b></span><span>Reputation <b>+{story.reputation}</b></span></div><Button tone="outline" disabled={career.socialEnergy < 1} data-testid={`social-post-${story.id}`} onClick={() => run('social-post', { storyId: story.id })}>Share this moment <span aria-hidden="true">→</span></Button></article>)}</section>
    <section className="panel public-note"><span className="note-mark">i</span><div><b>In-game social simulation</b><p>Audience reach, publicity, and fan growth are modeled. No account is connected and nothing is posted outside your career.</p></div></section>
    <section className="panel"><CardTitle kicker="YOUR PEOPLE" title="Good careers are built together." note="Your choices can strengthen the relationships that support the next opportunity."/><div className="relationship-list">{[['Manager', career.relationships.manager, 'A stronger working relationship can bring better contract conversations.'], ['Collaborator', career.relationships.collaborator, 'Trust grows through sessions, shared work, and giving credit.']].map(([name, value, detail]) => <div className="relationship-row" key={name}><div><b>{name}</b><small>{detail}</small></div><span>{value}/100</span><i><b style={{ width: `${value}%` }}/></i></div>)}</div></section>
  </div>;
}

function DiscoverView({ career, run }) {
  return <div className="page-content"><PageIntro kicker="DISCOVER · PRESS, MILESTONES & MOMENTUM" title="The next door can come from anywhere.">Local recognition, a press conversation, or one return visit can change what becomes possible.</PageIntro>
    <section className="panel"><CardTitle kicker="PRESS OPPORTUNITIES" title="Take the conversation." note="One weekly action. Choose the angle that feels right for this moment."/><div className="discover-grid">{DISCOVER_ITEMS.map((item, index) => <article className="discover-card" key={item.id}><span className="discover-index">0{index + 1}</span><h3>{item.name}</h3><p>{item.detail}</p><div className="discover-result">+{item.fans} fans · +{item.reputation} reputation</div><Button tone="outline" disabled={career.actionPoints < 1} onClick={() => run('interview', { itemId: item.id })}>Take the interview</Button></article>)}</div></section>
    <section className="panel"><CardTitle kicker="GLOBAL PROGRESSION" title="Where your name carries." note="Each appearance builds familiarity; a growing local base changes future gig outcomes."/><div className="discover-markets">{MARKETS.map((market) => { const progress = career.marketProgress[market.id] || { familiarity: 0, fans: 0, gigs: 0 }; return <div className="discover-market" key={market.id}><div><span className={`market-dot dot-${market.tone}`}/><b>{market.name}</b><small>{progress.gigs ? `${progress.gigs} ${progress.gigs === 1 ? 'appearance' : 'appearances'}` : 'Not visited yet'}</small></div><b>{progress.familiarity}%</b><i><b style={{ width: `${progress.familiarity}%` }}/></i></div>; })}</div></section>
    <section className="panel milestones-panel"><CardTitle kicker="CAREER FILE" title="The work adds up."/><div className="record-grid">{[['Weeks', career.completedWeeks], ['Releases', career.stats.releases], ['Gigs', career.stats.gigs], ['Tour stops', career.stats.tourStops], ['Festivals', career.stats.festivals], ['Interviews', career.stats.interviews], ['Milestones', career.achievements.length]].map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="achievement-tags">{career.achievements.includes('first-release') && <span>First release</span>}{career.achievements.includes('global-circuit') && <span>Global circuit</span>}{!career.achievements.length && <small>Your first career milestone is waiting.</small>}</div><div className="career-log">{career.log.slice(-5).reverse().map((item) => <div key={item.id}><small>WEEK {item.week}</small><span>{item.text}</span></div>)}</div></section>
    <p className="disclaimer">Everything here is a fictional career simulation. It does not connect to outside accounts, venues, labels, charts, or money.</p>
  </div>;
}

function SettingsView({ career, onRename, onReset, onImport }) {
  const fileRef = useRef(null);
  const [name, setName] = useState(career.stageName);
  const [message, setMessage] = useState('');
  const download = () => { const blob = new Blob([exportCareer(career)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${career.stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artist'}-treblr-career.json`; link.click(); URL.revokeObjectURL(url); setMessage('Career backup downloaded.'); };
  const importFile = async (event) => { const [file] = event.target.files || []; if (!file) return; try { onImport(parseCareerBackup(await file.text())); setMessage('Career backup loaded.'); } catch (error) { setMessage(error.message); } finally { event.target.value = ''; } };
  return <div className="page-content"><PageIntro kicker="SETTINGS · YOUR CAREER FILE" title="Keep the career yours.">Your progress is saved on this device. Rename your artist, transfer a backup, or start fresh.</PageIntro>
    <section className="panel settings-panel"><CardTitle kicker="ARTIST PROFILE" title="Your name on the bill."/><div className="settings-row"><label className="field-label" htmlFor="stage-name">STAGE NAME</label><input id="stage-name" className="text-input" value={name} maxLength={24} onChange={(event) => setName(event.target.value)}/><Button tone="outline" disabled={!name.trim() || name.trim() === career.stageName} onClick={() => { onRename(name.trim()); setMessage('Artist name updated.'); }}>Save name</Button></div></section>
    <section className="panel settings-panel"><CardTitle kicker="LOCAL BACKUP" title="Move your career between browsers." note="Export your progress as a JSON file or import a compatible career backup."/><div className="settings-actions"><Button onClick={download}>Export career backup ↓</Button><Button tone="outline" onClick={() => fileRef.current?.click()}>Import a backup ↑</Button><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importFile}/></div>{message && <p className="form-message" role="status">{message}</p>}</section>
    <section className="panel settings-panel"><CardTitle kicker="START AGAIN" title="A different story?" note="Reset only affects the current local career save."/><Button tone="danger" onClick={onReset}>Reset this career</Button></section>
    <p className="disclaimer">All audience, contract, and earnings figures are game values. No accounts or real-money services are connected.</p>
  </div>;
}

function WeekReport({ report, onContinue }) {
  if (!report) return null;
  return <div className="modal-backdrop" role="presentation"><section className="week-report" role="dialog" aria-modal="true" aria-labelledby="report-title"><span className="report-spark">✦</span><Kicker>WEEK {String(report.week).padStart(2, '0')} · SETTLED</Kicker><h2 id="report-title">Your work is moving.</h2><p>Here’s what this week changed—and what you’re carrying forward.</p><div className="report-stats"><span><small>MODELED LISTENERS</small><b>{number.format(report.streams)}</b></span><span><small>NET MUSIC INCOME</small><b>{cash(report.income)}</b></span><span><small>NEW FANS</small><b>+{number.format(report.newFans)}</b></span><span><small>HEALTH RESET</small><b>+{report.healthGain}</b></span></div>{report.actions.length > 0 && <div className="report-actions"><small>THIS WEEK’S MOMENTS</small>{report.actions.slice(0, 4).map((item, index) => <span key={`${index}-${item}`}>• {item}</span>)}</div>}<Button onClick={onContinue}>Start week {String(report.week + 1).padStart(2, '0')} →</Button></section></div>;
}

export default function GlobalCareerGame() {
  const [career, setCareer] = useState(() => loadCareer());
  const [screen, setScreen] = useState('welcome');
  const [activeTab, setActiveTab] = useState('home');
  const [report, setReport] = useState(null);
  const [saveState, setSaveState] = useState('Saved on this device');
  const [focusedMarketId, setFocusedMarketId] = useState(null);
  const [signal, setSignal] = useState({ marketId: null, version: 0 });

  useEffect(() => {
    if (career) {
      setSaveState(saveCareer(career) ? 'Saved on this device' : 'Save unavailable');
    }
  }, [career]);

  useEffect(() => {
    if (!career?.notice) return undefined;
    const timer = window.setTimeout(() => setCareer((state) => state?.notice ? gameReducer(state, { type: 'clear-notice' }) : state), 4200);
    return () => window.clearTimeout(timer);
  }, [career?.notice]);

  const startCareer = (details) => { const fresh = createCareer(details); setCareer(fresh); setFocusedMarketId(fresh.currentMarketId); setSignal({ marketId: null, version: 0 }); setActiveTab('home'); setScreen('game'); setReport(null); };
  const run = (command, payload = {}) => { const next = gameReducer(career, { type: 'command', command, ...payload }); setCareer(next); if ((command === 'gig' && next.stats.gigs > career.stats.gigs) || (command === 'festival' && next.stats.festivals > career.stats.festivals)) { setFocusedMarketId(next.currentMarketId); setSignal((previous) => ({ marketId: next.currentMarketId, version: previous.version + 1 })); } };
  const closeWeek = () => setCareer((state) => { const next = gameReducer(state, { type: 'close-week' }); setReport(next.weeklyReport); return next; });
  const rename = (stageName) => setCareer((state) => ({ ...state, stageName: stageName.slice(0, 24) }));
  const reset = () => { if (window.confirm('Reset this local career and start again?')) { globalThis.localStorage?.removeItem('treblr.career.life.v2'); setCareer(null); setScreen('welcome'); setActiveTab('home'); setReport(null); } };
  const importCareer = (imported) => { setCareer(imported); setFocusedMarketId(imported.currentMarketId); setScreen('game'); setActiveTab('home'); };

  if (screen === 'welcome') return <Welcome savedCareer={career} onContinue={() => { setScreen('game'); setActiveTab('home'); }} onCreate={() => setScreen('setup')}/>;
  if (screen === 'setup') return <Onboarding onBack={() => setScreen('welcome')} onStart={startCareer}/>;

  return <div className="game-app" data-testid="career-shell"><Navigation activeTab={activeTab} setActiveTab={setActiveTab} desktop/><div className="game-main"><TopBar career={career} onCloseWeek={closeWeek}/><main className="game-page" aria-label="Artist career game">
    {activeTab === 'home' && <HomeView career={career} setTab={setActiveTab} focusedMarketId={focusedMarketId || career.currentMarketId} onFocusMarket={setFocusedMarketId} signalMarketId={signal.marketId} signalVersion={signal.version}/>}
    {activeTab === 'music' && <MusicView career={career} run={run} setTab={setActiveTab} focusedMarketId={focusedMarketId || career.currentMarketId} onFocusMarket={setFocusedMarketId} signalMarketId={signal.marketId} signalVersion={signal.version}/>}
    {activeTab === 'studio' && <StudioView career={career} run={run}/>}
    {activeTab === 'contracts' && <ContractsView career={career} run={run} focusedMarketId={focusedMarketId || career.currentMarketId} onFocusMarket={setFocusedMarketId} signalMarketId={signal.marketId} signalVersion={signal.version}/>}
    {activeTab === 'social' && <SocialView career={career} run={run}/>}
    {activeTab === 'discover' && <DiscoverView career={career} run={run}/>}
    {activeTab === 'settings' && <SettingsView career={career} onRename={rename} onReset={reset} onImport={importCareer}/>}
    <footer className="game-footer"><span><Wordmark small/> {saveState}</span><span>Career simulation · Local progress</span></footer>
  </main><Navigation activeTab={activeTab} setActiveTab={setActiveTab}/></div>
    {career.notice && <div className="toast-message" role="status"><i>✦</i>{career.notice}</div>}
    <WeekReport report={report} onContinue={() => setReport(null)}/>
  </div>;
}
