import { getAwardCategories } from '../engine/awards';
import { fmt, fmtN as formatCurrency } from '../engine/utils';
import SocialExperience from '../components/SocialExperience';
import { SettingsView } from './ProfileTab';

const TOP_LEVEL = [
  { id:'social', number:'01', title:'Social', detail:'Simulated channels and in-game audience values.', mark:'◎' },
  { id:'discover', number:'02', title:'Discover', detail:'Records, charts, awards and industry activities.', mark:'↗' },
  { id:'settings', number:'03', title:'Settings', detail:'Local saves, career details and display currency.', mark:'⌘' },
];

const SOCIAL_CHANNELS = [
  { id:'instagram', label:'Instagram', short:'IG', engine:'instapic', metric:'Simulated audience', color:'#D78472' },
  { id:'youtube', label:'YouTube', short:'YT', engine:'vidtube', metric:'Simulated audience', color:'#C55E52' },
  { id:'spotify', label:'Spotify', short:'SP', engine:'soundify', metric:'Simulated audience', color:'#8AA273' },
  { id:'tiktok', label:'TikTok', short:'TT', engine:'rhythmtok', metric:'Simulated audience', color:'#7CA6A5' },
  { id:'twitter', label:'Twitter / X', short:'X', engine:'chirp', metric:'Simulated audience', color:'#7A9BB5' },
  { id:'forbes', label:'Forbes', short:'F', metric:null, color:'#9E8D67' },
  { id:'wikipedia', label:'Wikipedia', short:'W', metric:null, color:'#8B8F98' },
  { id:'reddit', label:'Reddit', short:'R', metric:null, color:'#C47F56' },
  { id:'soundcloud', label:'SoundCloud', short:'SC', engine:'wavelog', metric:'Simulated audience', color:'#CE8858' },
  { id:'apple-music', label:'Apple Music', short:'AM', metric:null, color:'#B66F80' },
  { id:'itunes', label:'iTunes', short:'iT', metric:null, color:'#847DAB' },
  { id:'tidal', label:'Tidal', short:'TD', metric:null, color:'#A3A7A6' },
];

const DISCOVER_ITEMS = [
  { id:'records', number:'01', title:'Records & releases', status:'LIVE SYSTEM', copy:'Open the released catalog and track sleeves.', target:['create','catalog'] },
  { id:'charts', number:'02', title:'Charts', status:'LIVE SYSTEM', copy:'See simulated rankings built at week close.', target:['create','charts'] },
  { id:'awards', number:'03', title:'Awards', status:'LIVE SYSTEM', copy:'Review real eligibility scores, nominations and wins.', route:'discover-awards' },
  { id:'labels', number:'04', title:'Label opportunities', status:'LIVE SYSTEM', copy:'Read available terms and contract obligations.', target:['business','industry'] },
  { id:'touring', number:'05', title:'Touring', status:'LIVE SYSTEM', copy:'Compare routes and book modeled tour runs.', target:['business','tour'] },
  { id:'dossier', number:'06', title:'Artist dossier', status:'LIVE SYSTEM', copy:'Open the existing career profile and skill record.', target:['profile','stats'] },
  { id:'journal', number:'07', title:'Career journal', status:'LIVE SYSTEM', copy:'Read the saved news and inbox screens.', target:['social','wire'] },
  { id:'interviews', number:'08', title:'Interviews', status:'NOT MODELED', copy:'No interview requests, scheduling, or outcomes are tracked.', route:'discover-interviews' },
  { id:'certifications', number:'09', title:'Certifications', status:'NOT MODELED', copy:'No certification thresholds, award plaques, or sales-equivalent units are tracked.', route:'discover-certifications' },
  { id:'lifestyle', number:'10', title:'Lifestyle', status:'NOT MODELED', copy:'No personal lifestyle assets, upkeep, or purchases are in the current simulation.', route:'discover-lifestyle' },
  { id:'investments', number:'11', title:'Investments', status:'NOT MODELED', copy:'No investment products, portfolio values, or returns are calculated.', route:'discover-investments' },
];

const UNSUPPORTED = {
  'discover-interviews': ['Interviews', 'The current engine has no interview offers, booking, publication, or reputation effect to show.'],
  'discover-certifications': ['Certifications', 'Award eligibility is modeled separately, but sales certifications and certification thresholds are not.'],
  'discover-lifestyle': ['Lifestyle', 'Personal assets, lifestyle choices, recurring upkeep, and their effects are not modeled in this build.'],
  'discover-investments': ['Investments', 'Portfolio holdings, purchases, financial returns, and investment risk are not modeled in this build.'],
};

function MoreHeader({ title, eyebrow, subtitle, week }) {
  return <header className="more-page-head">
    <div className="more-edition-line"><span>TREBLR <i>/</i> THE CAREER WORLD</span><span>WEEK {String(Number(week || 0) + 1).padStart(2, '0')}</span></div>
    <div className="page-kicker">{eyebrow}</div>
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>;
}

export default function MoreTab({ gs, setGs, patch, showToast }) {
  const route = gs.appRoutes?.more || 'index';
  const fmtN = amount => formatCurrency(amount, gs.currency);
  const changeSection = next => {
    const primaryTab = { social:'social-home', discover:'discover', settings:'settings' }[next] || gs.tab;
    patch({ tab:primaryTab, appRoutes:{ ...(gs.appRoutes || {}), more:next } });
  };
  const navigate = (tab, destination) => {
    const routeKey = { create:'music', studio:'studio', business:'career', social:'news', profile:'profile' }[tab];
    const appRoutes = { ...(gs.appRoutes || {}) };
    if (routeKey && destination) appRoutes[routeKey] = destination;
    patch({ tab, appRoutes });
  };
  const activeChannels = SOCIAL_CHANNELS.filter(channel => channel.engine);
  const channelId = route.startsWith('channel-') ? route.slice('channel-'.length) : null;
  const channel = SOCIAL_CHANNELS.find(item => item.id === channelId);
  const discoveryTitle = UNSUPPORTED[route]?.[0];
  const totalAudience = activeChannels.reduce((sum, item) => sum + Number(gs.socialPlatforms?.[item.engine] || 0), 0);

  const isChannelRoute = Boolean(route.startsWith('channel-') && channel);

  return <div className={`tab-content more-screen more-screen-${route}${isChannelRoute ? ' is-social-experience' : ''}`}>
    {isChannelRoute && <SocialExperience channel={channel} gs={gs} fmt={fmt} onBack={() => changeSection('social')} />}
    {!isChannelRoute && <MoreHeader
      title={route === 'index' ? 'Social / More' : route === 'social' ? 'Social desk' : route === 'discover' ? 'Discover' : route === 'settings' ? 'Settings' : route === 'discover-awards' ? 'Awards' : discoveryTitle || channel?.label || 'Career world'}
      eyebrow={route === 'index' ? 'THE CAREER WORLD · SECTION SELECT' : route.startsWith('channel-') ? 'SOCIAL DIRECTORY · SIMULATION ONLY' : route.startsWith('discover-') ? 'DISCOVER · AVAILABILITY' : route.toUpperCase().replace('-', ' · ')}
      subtitle={route === 'index' ? 'Choose a destination beyond the main career desks.' : route === 'social' ? 'These pages are in-game simulations only. Nothing here connects to a real account or posts to an external service.' : route === 'discover' ? 'See what this career engine actually tracks—and what it does not.' : route === 'settings' ? 'Manage the local career save and display preferences.' : route === 'discover-awards' ? 'Eligibility is calculated from the career’s existing releases, streams, and chart history.' : discoveryTitle ? 'This destination is reachable, but there is no matching activity or economic system in the current engine.' : channel ? 'A named in-game destination, never a live account or posting service.' : 'Choose a destination from Social, Discover, or Settings.'}
      week={gs.totalWeeks}
    />}

    {!isChannelRoute && <nav className="more-section-nav" aria-label="Social, Discover, and Settings">
      {TOP_LEVEL.map(item => <button type="button" key={item.id} aria-current={route === item.id || (item.id === 'social' && route.startsWith('channel-')) || (item.id === 'discover' && route.startsWith('discover')) ? 'page' : undefined} onClick={() => changeSection(item.id)}>{item.title}</button>)}
    </nav>}

    {route === 'index' && <section className="more-hub" aria-label="Social, Discover, and Settings destinations">
      <div className="more-hub-status"><span className="more-hub-orbit" aria-hidden="true">T</span><div><small>CAREER WORLD DIRECTORY</small><strong>{fmt(gs.fans || 0)} fans <i>·</i> {fmtN(gs.money || 0)}</strong><span>{gs.stageName || 'Artist'} <i>·</i> {gs.totalWeeks || 0} completed weeks</span></div></div>
      <div className="more-destination-list">{TOP_LEVEL.map((item, index) => <button type="button" className="more-destination" key={item.id} onClick={() => changeSection(item.id)}>
        <span className="more-destination-index">{item.number}</span><span className="more-destination-mark" aria-hidden="true">{item.mark}</span><span className="more-destination-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="more-destination-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      <p className="more-simulation-note">All channel and industry labels below are fictional interface destinations inside this career simulation. No external accounts are linked.</p>
    </section>}

    {route === 'social' && <section className="social-directory" aria-label="Social channel directory">
      <div className="social-directory-ledger"><span>{activeChannels.length} SIMULATED CHANNELS</span><strong>{fmt(totalAudience)} combined in-game audience</strong></div>
      <div className="social-directory-grid">{SOCIAL_CHANNELS.map(item => {
        const modeled = Boolean(item.engine);
        const count = Number(gs.socialPlatforms?.[item.engine] || 0);
        return <button type="button" key={item.id} className={`social-directory-card${modeled ? '' : ' is-unmodeled'}`} onClick={() => changeSection(`channel-${item.id}`)} style={{ '--channel-accent':item.color }}>
          <span className="social-channel-mark" aria-hidden="true">{item.short}</span><span className="social-channel-copy"><strong>{item.label}</strong><small>{modeled ? `${fmt(count)} simulated audience` : 'No in-game metric'}</small></span><i>{modeled ? 'SIM' : 'INFO'}</i>
        </button>;
      })}</div>
      <p className="more-simulation-note">The six audience counts are Treblr save data, not follower or listener counts on the named services. Each destination is simulation-only; no live connection, share, or external post is performed.</p>
    </section>}

    {route === 'discover' && <section className="discover-directory" aria-label="Discover activities">
      <div className="discover-caveat"><span>ACTIVITY INDEX</span><p>Buttons marked Live open existing systems. Not Modeled pages state what is absent and do not create fictional offers, schedules, cash, or progress.</p></div>
      <div className="discover-list">{DISCOVER_ITEMS.map(item => <button type="button" key={item.id} className={`discover-item${item.status === 'NOT MODELED' ? ' is-unmodeled' : ''}`} onClick={() => item.target ? navigate(item.target[0], item.target[1]) : changeSection(item.route)}>
        <span className="discover-item-index">{item.number}</span><span className="discover-item-copy"><strong>{item.title}</strong><small>{item.copy}</small></span><span className="discover-item-status">{item.status}</span><b aria-hidden="true">↗</b>
      </button>)}</div>
    </section>}

    {route === 'discover-awards' && <section className="discover-awards-view" aria-label="Award eligibility">
      {(gs.awards || []).length > 0 && <div className="discover-wins"><span>RECORDED WINS</span>{gs.awards.map((award, index) => <strong key={award.id || `${typeof award === 'string' ? award : award.title}-${index}`}>{typeof award === 'string' ? award : award.title}{typeof award === 'object' && award.work ? ` · ${award.work}` : ''}</strong>)}</div>}
      {getAwardCategories(gs).map(category => <article className="discover-award-row" key={category.id}><div><strong>{category.title}</strong><span>{category.work || 'Career category'}</span></div><b>{Math.round(category.score)} / {category.minimum}</b><div className="discover-award-track"><span style={{ width:`${Math.min(100, Math.round(category.score / Math.max(1, category.minimum) * 100))}%` }}/></div><small>{category.eligible ? 'ELIGIBLE IN THE CURRENT SCORING RULES' : 'NOT YET ELIGIBLE'}</small></article>)}
      <p className="more-simulation-note">These are the current award eligibility scores only. Treblr does not model a separate certification system or guarantee nominations and wins.</p>
    </section>}

    {UNSUPPORTED[route] && <section className="discover-unavailable">
      <button type="button" className="more-back-link" onClick={() => changeSection('discover')}>← BACK TO DISCOVER</button>
      <div className="discover-unavailable-stamp">NOT MODELED <i>·</i> NO ACTIONS AVAILABLE</div><h2>{UNSUPPORTED[route][0]}</h2><p>{UNSUPPORTED[route][1]}</p>
      <div className="discover-unavailable-foot">No state was changed. No offer, schedule, audience metric, balance, or progress has been invented.</div>
    </section>}

    {route === 'settings' && <section className="more-settings-view"><SettingsView gs={gs} setGs={setGs} patch={patch} showToast={showToast}/></section>}

    {!['index','social','discover','settings','discover-awards'].includes(route) && !channel && !UNSUPPORTED[route] && <div className="discover-unavailable"><button type="button" className="more-back-link" onClick={() => changeSection('index')}>← BACK TO SOCIAL / MORE</button><p>This destination is not present in this version of the game.</p></div>}
  </div>;
}
