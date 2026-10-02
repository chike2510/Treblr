import { useMemo, useState } from 'react';
import { CITIES, CAREER_TYPES, GENRES } from '../data/constants';
import { buildCareerPlaylists, getCareerChartRows, getModeledArtistRank } from '../engine/socialModels';

const LAYOUT_BY_SERVICE = {
  instagram:'profile-grid',
  youtube:'channel-sections',
  spotify:'artist-discography',
  tiktok:'creator-vertical-feed',
  twitter:'chronological-profile-timeline',
  forbes:'editorial-artist-dossier',
  wikipedia:'encyclopedia-article',
  reddit:'community-feed',
  soundcloud:'waveform-track-list',
  'apple-music':'artist-release-shelf',
  itunes:'store-search-catalogue',
  tidal:'minimal-discography-grid',
};

const safeImage = (value) => typeof value === 'string' && (value.startsWith('/') || value.startsWith('data:image/')) ? value : '';
const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '');
const fmtWeek = (value) => value == null ? 'Week not recorded' : `Week ${value}`;
const releaseStreams = (track) => Number(track?.lifetimeStreams ?? track?.streams ?? 0);

function findLabel(items, id, fallback = '') {
  return items.find((item) => item.id === id)?.label || fallback || id || 'Not recorded';
}

function Avatar({ gs, className = '' }) {
  const src = safeImage(gs.avatarUrl);
  return <span className={`sx-avatar ${className}`}>{src ? <img src={src} alt={`${gs.stageName || 'Artist'} profile`} /> : <b aria-hidden="true">{(gs.stageName || 'A').slice(0, 1).toUpperCase()}</b>}</span>;
}

function Artwork({ track, className = '', alt }) {
  const src = safeImage(track?.coverArt);
  return <span className={`sx-art ${className}`}>{src ? <img src={src} alt={alt || `Artwork for ${track?.title || 'release'}`} loading="lazy" /> : <span aria-hidden="true">♪</span>}</span>;
}

function ExitToDirectory({ onBack }) {
  return <button type="button" className="sx-exit" onClick={onBack} aria-label="Back to Social directory"><span aria-hidden="true">‹</span><span>Social</span></button>;
}

function ServiceFrame({ channel, onBack, children }) {
  return <section className={`social-experience social-experience--${channel.id}`} data-platform={channel.id} data-layout={LAYOUT_BY_SERVICE[channel.id]} aria-label={`${channel.label} in-game experience`}>
    <ExitToDirectory onBack={onBack} />
    {children}
  </section>;
}

function AudienceMetric({ channel, count, label = 'in-game audience', detail }) {
  return <div className="sx-audience-metric" data-testid="social-simulated-audience">
    <strong>{count}</strong><span>{label}</span>
    <small>{detail || `Saved in this career — not a ${channel.label} account metric.`}</small>
  </div>;
}

function Tabs({ label, values, value, onChange, className = '' }) {
  return <div className={`sx-tabs ${className}`} role="tablist" aria-label={label}>
    {values.map((item) => <button key={item.id} type="button" role="tab" aria-selected={value === item.id} onClick={() => onChange(item.id)}>{item.label}</button>)}
  </div>;
}

function Empty({ title, children, className = '' }) {
  return <div className={`sx-empty ${className}`}><strong>{title}</strong><p>{children}</p></div>;
}

function ReleaseDetail({ track, fmt }) {
  if (!track) return null;
  return <aside className="sx-release-detail" aria-label={`Saved details for ${track.title}`}>
    <Artwork track={track} />
    <div><small>FROM THIS TREBLR SAVE</small><strong>{track.title}</strong><span>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</span><span>{fmt(releaseStreams(track))} Treblr streams <i>·</i> quality {Number(track.quality || 0) || 'not recorded'}</span></div>
  </aside>;
}

function PlaylistCover({ tracks, className = '' }) {
  return <span className={`sx-playlist-cover ${className}`} aria-hidden="true">
    {tracks.slice(0, 4).map((track) => <Artwork key={track.id} track={track} alt="" />)}
  </span>;
}

function CareerChartRows({ rows, variant, chartWeek, selected, onSelect }) {
  return <div className={`${variant}-chart-list`}>
    {rows.map((track) => <button type="button" key={track.id} data-track-id={track.id} data-chart-position={track.chartPosition ?? ''} aria-label={`${track.title}, ${track.chartPosition ? `number ${track.chartPosition}` : 'no chart position'}`} className={`${variant}-chart-row${selected?.id === track.id ? ' is-selected' : ''}`} onClick={() => onSelect(selected?.id === track.id ? null : track)}>
      <strong className={`${variant}-chart-position`}>{track.chartPosition ? `#${track.chartPosition}` : '—'}</strong>
      <Artwork track={track} />
      <span className={`${variant}-chart-info`}><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small></span>
      <span className={`${variant}-chart-status`}>{track.chartPosition ? 'CHARTED' : chartWeek != null ? 'NO POSITION' : 'PENDING'}</span>
    </button>)}
  </div>;
}

function InstagramPage({ channel, gs, releases, count, fmt, onBack }) {
  const [tab, setTab] = useState('posts');
  const [selected, setSelected] = useState(null);
  const genre = findLabel(GENRES, gs.genre, 'Genre not recorded');
  const city = findLabel(CITIES, gs.city, 'City not recorded');
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="ig-topbar"><strong>Instagram</strong><div aria-hidden="true"><span>⌕</span><span>＋</span><span>♡</span></div></div>
    <div className="ig-profile">
      <Avatar gs={gs} className="ig-avatar" />
      <div className="ig-profile-heading"><small>ARTIST PROFILE PREVIEW</small><h1>{gs.stageName || 'Artist'}</h1></div>
      <div className="ig-stats"><div><strong>{releases.length}</strong><span>release artworks</span></div><div><strong>{fmt(count)}</strong><span>simulated audience</span></div><small>Saved in this career · not Instagram follower data.</small></div>
      <p className="ig-bio"><b>{gs.stageName || 'Artist'}</b><span>{genre} <i>·</i> {city}</span><small>Career details only. Instagram posts and Stories are not synced.</small></p>
      <div className="ig-actions"><button type="button" disabled title="Following state is not modeled">Follow unavailable</button><button type="button" disabled title="Instagram messages are not modeled">Message unavailable</button></div>
      <div className="ig-highlights" aria-label="Saved release artwork highlights"><div className="ig-highlight-cover">{releases[0] ? <Artwork track={releases[0]} /> : <span aria-hidden="true">＋</span>}</div><small>Releases</small></div>
    </div>
    <Tabs label="Instagram profile sections" values={[{ id:'posts', label:'▦ Posts' }, { id:'reels', label:'▷ Reels' }, { id:'tagged', label:'♧ Tagged' }]} value={tab} onChange={setTab} className="ig-tabs" />
    {tab === 'posts' && <div className="ig-panel" role="tabpanel" aria-label="Release artwork grid"><div className="ig-grid-label">CAREER RELEASE ART <span>not Instagram uploads</span></div>
      {releases.length ? <div className="ig-grid">{releases.map((track) => <button type="button" key={track.id} onClick={() => setSelected(selected?.id === track.id ? null : track)} aria-label={`View ${track.title} release details`}><Artwork track={track} /><span>{track.title}</span></button>)}</div> : <Empty title="Nothing in the profile grid yet">Released cover art from this career will appear here. No sample posts are created.</Empty>}
      <ReleaseDetail track={selected} fmt={fmt} />
    </div>}
    {tab === 'reels' && <Empty title="Reels are not available in this save">Treblr does not store Instagram video files, Reel uploads, views, likes, or comments.</Empty>}
    {tab === 'tagged' && <Empty title="Tagged media is not tracked">No Instagram account or tagged-post data is connected to this career.</Empty>}
  </ServiceFrame>;
}

function YouTubePage({ channel, gs, releases, count, fmt, onBack }) {
  const [tab, setTab] = useState('home');
  const [selected, setSelected] = useState(null);
  const videoTracks = releases.filter((track) => Number(track.videoViews || 0) > 0).sort((a, b) => Number(b.videoViews || 0) - Number(a.videoViews || 0));
  const latest = [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0))[0];
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="yt-topbar"><span className="yt-play-mark" aria-hidden="true">▶</span><strong>YouTube</strong><div aria-hidden="true"><span>⌕</span><span>⋮</span></div></div>
    <div className="yt-banner">{latest && <Artwork track={latest} className="yt-banner-art" />}<span>CHANNEL ART <i>·</i> CAREER PREVIEW</span></div>
    <div className="yt-channel-head"><Avatar gs={gs} className="yt-avatar" /><div><h1>{gs.stageName || 'Artist'}</h1><p>Music channel <i>·</i> Treblr career</p><small>{fmt(count)} saved in this career · simulated audience (not subscribers)</small></div></div>
    <div className="yt-channel-actions"><button type="button" disabled title="No YouTube account or subscription action is connected">Subscribe unavailable</button><span>No external action</span></div>
    <Tabs label="YouTube channel sections" values={[{ id:'home', label:'Home' }, { id:'videos', label:'Videos' }, { id:'shorts', label:'Shorts' }, { id:'playlists', label:'Playlists' }]} value={tab} onChange={setTab} className="yt-tabs" />
    {tab === 'home' && <div className="yt-panel" role="tabpanel" aria-label="Channel home"><section className="yt-home-feature"><small>CAREER RELEASES <i>·</i> NOT CHANNEL UPLOADS</small>{latest ? <button type="button" onClick={() => setSelected(latest)}><Artwork track={latest} /><span><b>{latest.title}</b><small>{fmtWeek(latest.releaseWeek)} <i>·</i> release saved in Treblr</small></span><b aria-hidden="true">›</b></button> : <Empty title="No release to feature">This channel preview does not create videos or uploads.</Empty>}</section><section className="yt-section"><h2>Video view totals</h2>{videoTracks.length ? videoTracks.map((track) => <div className="yt-video-row" key={track.id}><button type="button" onClick={() => setSelected(track)}><Artwork track={track} /><span className="yt-play-overlay" aria-hidden="true">▶</span></button><div><strong>{track.title}</strong><small>{fmt(Number(track.videoViews || 0))} modeled views <i>·</i> Treblr</small></div></div>) : <p className="yt-muted">No release-level video views are recorded in this career.</p>}</section></div>}
    {tab === 'videos' && <div className="yt-panel" role="tabpanel" aria-label="Videos">{videoTracks.length ? videoTracks.map((track) => <div className="yt-video-row" key={track.id}><button type="button" onClick={() => setSelected(track)}><Artwork track={track} /><span className="yt-play-overlay" aria-hidden="true">▶</span></button><div><strong>{track.title}</strong><small>{fmt(Number(track.videoViews || 0))} modeled views <i>·</i> Treblr</small></div></div>) : <Empty title="No video-view totals recorded">Video files, YouTube uploads, durations, and channel analytics are not stored by Treblr.</Empty>}</div>}
    {tab === 'shorts' && <Empty title="Shorts are not modeled">This career does not store short-form video files, uploads, or views.</Empty>}
    {tab === 'playlists' && <Empty title="No playlist data is available">YouTube playlists and channel sections are not part of this simulation.</Empty>}
    <ReleaseDetail track={selected} fmt={fmt} />
  </ServiceFrame>;
}

function SpotifyPage({ channel, gs, releases, count, fmt, onBack }) {
  const [tab, setTab] = useState('music');
  const [selected, setSelected] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState('recently-released');
  const ranked = useMemo(() => [...releases].sort((a, b) => releaseStreams(b) - releaseStreams(a)), [releases]);
  const latest = useMemo(() => [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0))[0], [releases]);
  const chartRows = useMemo(() => getCareerChartRows(releases, gs), [releases, gs.charts]);
  const chartWeek = gs.latestChartSnapshot?.week ?? null;
  const playlists = useMemo(() => buildCareerPlaylists(releases), [releases]);
  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId) || playlists[0];
  const artistRank = useMemo(() => getModeledArtistRank(gs), [gs.fans, gs.npcCareers]);
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="spfy-topbar"><strong><i aria-hidden="true">◉</i> Spotify</strong><div aria-hidden="true"><span>⌕</span><span>⋯</span></div></div>
    <div className="spfy-artist-hero" style={latest && safeImage(latest.coverArt) ? { '--artist-cover':`url("${safeImage(latest.coverArt)}")` } : undefined}>
      <small>ARTIST</small><h1>{gs.stageName || 'Artist'}</h1><p>{findLabel(GENRES, gs.genre, 'Music career')} <i>·</i> {releases.length} saved {releases.length === 1 ? 'release' : 'releases'}</p>
    </div>
    <div className="spfy-identity"><Avatar gs={gs} /><div><h2>{gs.stageName || 'Artist'}</h2><small>{findLabel(GENRES, gs.genre, 'Artist')}</small></div><button type="button" disabled title="Spotify follow state is not modeled">Follow unavailable</button></div>
    <AudienceMetric channel={channel} count={fmt(count)} label="Monthly listeners" detail="Career audience · updated weekly" />
    <div className="spfy-world-rank" aria-label={`World artist rank ${artistRank.rank} by career fanbase`}><span>WORLD ARTIST RANK</span><strong>#{artistRank.rank}</strong><small>By career fanbase · {artistRank.population} modeled artists</small></div>
    <Tabs label="Spotify artist profile" values={[{ id:'music', label:'Music' }, { id:'charts', label:'Charts' }, { id:'playlists', label:'Playlists' }, { id:'about', label:'About' }, { id:'clips', label:'Clips' }, { id:'events', label:'Events' }, { id:'merch', label:'Merch' }]} value={tab} onChange={setTab} className="spfy-tabs" />
    {tab === 'music' && <div className="spfy-panel" role="tabpanel" aria-label="Artist music"><section className="spfy-feature"><div className="spfy-feature-head"><span>Latest release</span><span>{latest ? fmtWeek(latest.releaseWeek) : 'No release yet'}</span></div>{latest ? <button type="button" className="spfy-feature-release" onClick={() => setSelected(latest)}><Artwork track={latest} /><span><small>{latest.releaseType || 'Single'}</small><strong>{latest.title}</strong><small>Treblr release catalogue</small></span><b aria-hidden="true">›</b></button> : <Empty title="A first release will appear here">No music release is saved in this career yet.</Empty>}</section>
      <section className="spfy-popular"><div className="spfy-section-heading"><h2>Popular</h2><span>Ranked by streams in this career</span></div>{ranked.length ? ranked.map((track, index) => <button type="button" key={track.id} className={`spfy-track${selected?.id === track.id ? ' is-selected' : ''}`} onClick={() => setSelected(selected?.id === track.id ? null : track)}><span className="spfy-rank">{index + 1}</span><Artwork track={track} /><span className="spfy-track-info"><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small></span><span className="spfy-stream-count">{fmt(releaseStreams(track))}</span></button>) : <Empty title="Your popular tracks are waiting">Track order and totals appear only after a career release is recorded.</Empty>}</section>
      <ReleaseDetail track={selected} fmt={fmt} />
    </div>}
    {tab === 'charts' && <div className="spfy-panel spfy-chart-panel" role="tabpanel" aria-label="Spotify career charts" data-testid="spotify-charts"><div className="spfy-chart-heading"><div><small>CAREER CHART</small><h2>Global track chart</h2></div><span>{chartWeek != null ? `WEEK ${chartWeek}` : 'WEEK NOT RECORDED'}</span></div>{chartRows.length ? <CareerChartRows rows={chartRows} variant="spfy" chartWeek={chartWeek} selected={selected} onSelect={setSelected} /> : <Empty title="No releases to chart yet">Released tracks appear here after they enter the career chart.</Empty>}<ReleaseDetail track={selected} fmt={fmt} /></div>}
    {tab === 'playlists' && <div className="spfy-panel spfy-playlists-panel" role="tabpanel" aria-label="Spotify career playlists" data-testid="spotify-playlists"><div className="spfy-playlists-heading"><small>MADE FOR {gs.stageName || 'ARTIST'}</small><h2>Playlists</h2><span>Career mixes · {releases.length} tracks</span></div>{releases.length ? <><div className="spfy-playlist-cards">{playlists.map((playlist) => <button type="button" key={playlist.id} aria-pressed={activePlaylist?.id === playlist.id} className={`spfy-playlist-card${activePlaylist?.id === playlist.id ? ' is-selected' : ''}`} onClick={() => setActivePlaylistId(playlist.id)}><PlaylistCover tracks={playlist.tracks} className="spfy-playlist-cover" /><span><small>CAREER MIX</small><strong>{playlist.title}</strong><i>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</i></span><b aria-hidden="true">›</b></button>)}</div>{activePlaylist && <section className="spfy-playlist-detail"><header><div><small>CAREER PLAYLIST</small><h3>{activePlaylist.title}</h3></div><span>{activePlaylist.tracks.length} songs</span></header>{activePlaylist.tracks.map((track) => <button type="button" key={track.id} className="spfy-playlist-track" onClick={() => setSelected(selected?.id === track.id ? null : track)}><Artwork track={track} /><span><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small></span></button>)}</section>}<ReleaseDetail track={selected} fmt={fmt} /></> : <Empty title="No tracks for a playlist yet">Release music in this career to build Recently released and Popular in this career.</Empty>}</div>}
    {tab === 'about' && <div className="spfy-panel" role="tabpanel" aria-label="Artist details"><div className="spfy-about-card"><small>ABOUT</small><h2>{gs.stageName || 'Artist'}</h2><p>{findLabel(GENRES, gs.genre, 'Genre not recorded')} <i>·</i> {findLabel(CITIES, gs.city, 'Home city not recorded')}</p><span>No artist biography or Spotify profile content is saved.</span></div></div>}
    {tab === 'clips' && <Empty title="Clips are not stored">No video files or Spotify Clips are part of this Treblr save.</Empty>}
    {tab === 'events' && <Empty title="No artist events are modeled">Concert dates, event listings, ticket links, and attendance are not tracked in this career.</Empty>}
    {tab === 'merch' && <Empty title="Merch is not modeled">This save contains no merchandise listings or external shop links.</Empty>}
  </ServiceFrame>;
}

function TikTokPage({ channel, gs, posts, tracksById, count, fmt, onBack }) {
  const [tab, setTab] = useState('posts');
  const creator = gs.stageName || 'Artist';
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="tt-topbar"><button type="button" aria-label="Following tab" aria-pressed="false">Following</button><strong>For You</strong><span aria-hidden="true">⌕</span></div>
    <div className="tt-profile"><Avatar gs={gs} className="tt-avatar" /><h1>{creator}</h1><small>Creator profile preview <i>·</i> Treblr</small><div className="tt-metrics"><div><strong>{posts.length}</strong><span>saved promo posts</span></div><div><strong>{fmt(count)}</strong><span>saved in career · simulated audience</span></div></div><p>Reach is an in-game estimate. No TikTok account is connected.</p></div>
    <Tabs label="TikTok creator sections" values={[{ id:'posts', label:'▦ Posts' }, { id:'videos', label:'▷ Videos' }, { id:'likes', label:'♡ Likes' }]} value={tab} onChange={setTab} className="tt-tabs" />
    {tab === 'posts' && <div className="tt-panel" role="tabpanel" aria-label="Saved promo posts">{posts.length ? <div className="tt-grid">{posts.map((post, index) => {
      const track = tracksById[post.trackId] || null;
      return <article className="tt-post" key={post.id || `${post.week}-${index}`}>
        <div className="tt-visual">{track && <Artwork track={track} />}<span className="tt-media-label">ARTWORK <i>·</i> NOT VIDEO</span><span className="tt-caption">{post.text}</span></div>
        <div className="tt-post-meta"><span>{post.week != null ? `Week ${post.week}` : 'Saved promo'}</span>{post.reach != null && <strong>{fmt(Number(post.reach || 0))} modeled reach</strong>}</div>
      </article>;
    })}</div> : <Empty title="No saved creator posts">Treblr does not create sample posts or video files. Likes, comments, and direct messages are not tracked.</Empty>}</div>}
    {tab === 'videos' && <Empty title="Video media is not stored">Saved promo text may appear above, but TikTok video files and view totals are not in this career data.</Empty>}
    {tab === 'likes' && <Empty title="Liked videos are not tracked">No external account activity or like history is connected to this save.</Empty>}
    <div className="tt-bottom-note">No like, comment, share, or inbox counts are shown because the game does not track them.</div>
  </ServiceFrame>;
}

function TwitterPage({ channel, gs, posts, releases, count, fmt, onBack }) {
  const [tab, setTab] = useState('posts');
  const handle = slug(gs.stageName) || 'artist';
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="x-topbar"><span className="x-logo" aria-hidden="true">𝕏</span><strong>Profile</strong><button type="button" aria-label="More profile actions" disabled>•••</button></div>
    <div className="x-banner" aria-hidden="true"><span>CAREER PROFILE</span></div>
    <div className="x-profile"><Avatar gs={gs} className="x-avatar" /><button type="button" disabled title="Follow actions are not modeled">Follow unavailable</button><h1>{gs.stageName || 'Artist'}</h1><p>@{handle} <i>·</i> Treblr preview</p><p className="x-bio">{findLabel(GENRES, gs.genre, 'Artist')} <i>·</i> {findLabel(CITIES, gs.city, 'Home city not recorded')}</p><div className="x-profile-stats"><span><b>{releases.length}</b> releases in career</span><span><b>{fmt(count)}</b> simulated audience in this career <small>(not X followers)</small></span></div></div>
    <Tabs label="Twitter/X profile timeline" values={[{ id:'posts', label:'Posts' }, { id:'replies', label:'Replies' }, { id:'media', label:'Media' }, { id:'likes', label:'Likes' }]} value={tab} onChange={setTab} className="x-tabs" />
    {tab === 'posts' && <div className="x-timeline" role="tabpanel" aria-label="Chronological saved posts"><div className="x-feed-label">Posts <span>saved in this career · newest first</span></div>{posts.length ? posts.map((post, index) => <article className="x-post" key={post.id || `${post.week}-${index}`}><Avatar gs={gs} className="x-post-avatar" /><div><header><strong>{gs.stageName || 'Artist'}</strong><span>@{handle}</span><i>·</i><span>{fmtWeek(post.week)}</span></header><p>{post.text}</p>{post.trackTitle && <small>Promoting “{post.trackTitle}” <i>·</i> Treblr career</small>}{post.reach != null && <small>{fmt(Number(post.reach || 0))} modeled reach</small>}</div></article>) : <Empty title="No posts in this timeline">Only posts explicitly saved through the Treblr career loop appear here. Replies, likes, reposts, and DMs are not modeled.</Empty>}</div>}
    {tab === 'replies' && <Empty title="Replies are not tracked">This career stores no reply threads or conversation history.</Empty>}
    {tab === 'media' && <Empty title="No media attachments are saved">The timeline has no uploaded images or video. Release artwork is available in the music catalogue, not as a Twitter/X attachment.</Empty>}
    {tab === 'likes' && <Empty title="Likes are not tracked">No account-level like history is stored in the career save.</Empty>}
  </ServiceFrame>;
}

function ForbesPage({ channel, gs, releases, fmt, onBack }) {
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="fb-masthead"><strong>Forbes</strong><span>CAREERS <i>/</i> MUSIC</span><button type="button" aria-label="Open publication menu" disabled>☰</button></div>
    <nav className="fb-nav" aria-label="Forbes sections"><span>BUSINESS</span><span>INNOVATION</span><span>LEADERSHIP</span><b>MUSIC</b></nav>
    <main className="fb-story"><div className="fb-kicker">ARTIST DOSSIER <i>·</i> TREBLR CAREER DATA</div><h1>{gs.stageName || 'Artist'}</h1><p className="fb-deck">A career profile generated from the information saved in this game.</p><div className="fb-rule" /><div className="fb-byline"><span>CAREER RECORD</span><span>WEEK {Number(gs.totalWeeks || 0)}</span></div><section className="fb-facts"><h2>Career at a glance</h2><dl><div><dt>Genre</dt><dd>{findLabel(GENRES, gs.genre, 'Not recorded')}</dd></div><div><dt>Home city</dt><dd>{findLabel(CITIES, gs.city, 'Not recorded')}</dd></div><div><dt>Career path</dt><dd>{findLabel(CAREER_TYPES, gs.careerType, 'Not recorded')}</dd></div><div><dt>Releases in save</dt><dd>{releases.length}</dd></div><div><dt>Career fans</dt><dd>{fmt(Number(gs.fans || 0))}</dd></div></dl></section><section className="fb-coverage"><span>EDITORIAL COVERAGE</span><strong>No Forbes article or ranking is modeled.</strong><p>No interview, list placement, or external publication result has been created.</p></section></main>
  </ServiceFrame>;
}

function WikipediaPage({ channel, gs, releases, fmt, onBack }) {
  const facts = [['Stage name', gs.stageName || 'Not recorded'], ['Genre', findLabel(GENRES, gs.genre, 'Not recorded')], ['Home city', findLabel(CITIES, gs.city, 'Not recorded')], ['Career path', findLabel(CAREER_TYPES, gs.careerType, 'Not recorded')], ['Completed weeks', String(Number(gs.totalWeeks || 0))]];
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="wiki-topbar"><span className="wiki-globe" aria-hidden="true">W</span><div><strong>Wikipedia</strong><small>The Free Encyclopedia</small></div><button type="button" aria-label="Search encyclopedia" disabled>⌕</button></div>
    <article className="wiki-article"><div className="wiki-preview-note">CAREER ARTICLE PREVIEW <i>·</i> TREBLR FACTS ONLY</div><h1>{gs.stageName || 'Artist'}</h1><p className="wiki-lead">This view summarizes information from the current game save; it is not a published encyclopedia article.</p><div className="wiki-toc"><strong>Contents</strong><a href="#wiki-career">Career</a><a href="#wiki-releases">Discography</a></div><aside className="wiki-infobox"><strong>{gs.stageName || 'Artist'}</strong><span>Career information</span><dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></aside><section id="wiki-career"><h2>Career</h2><p>No biographical narrative, awards history, or external citations are modeled. The structured facts in this preview come directly from the saved career.</p></section><section id="wiki-releases"><h2>Discography</h2>{releases.length ? <ul>{releases.map((track) => <li key={track.id}><strong>{track.title}</strong> — {track.releaseType || 'Single'} ({fmtWeek(track.releaseWeek)}); {fmt(releaseStreams(track))} Treblr streams</li>)}</ul> : <p>No released works are recorded in this career.</p>}</section><p className="wiki-cite-note">No external sources or citations are attached to this in-game view.</p></article>
  </ServiceFrame>;
}

function RedditPage({ channel, gs, onBack }) {
  const [tab, setTab] = useState('posts');
  const [sort, setSort] = useState('New');
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="rd-topbar"><strong><i aria-hidden="true">●</i> reddit</strong><span aria-hidden="true">⌕</span><span aria-hidden="true">☰</span></div>
    <div className="rd-community-banner"><span>COMMUNITY PREVIEW</span></div>
    <div className="rd-community-head"><span className="rd-mark" aria-hidden="true">r/</span><div><small>UNLINKED COMMUNITY VIEW</small><h1>{gs.stageName || 'Artist'} community</h1><p>No actual subreddit is connected to this save.</p></div></div>
    <div className="rd-community-actions"><button type="button" disabled title="Community membership is not modeled">Join unavailable</button><span>Members not tracked</span></div>
    <Tabs label="Reddit community sections" values={[{ id:'posts', label:'Posts' }, { id:'about', label:'About' }]} value={tab} onChange={setTab} className="rd-tabs" />
    {tab === 'posts' && <div className="rd-feed" role="tabpanel" aria-label="Community feed"><div className="rd-sort"><span>Feed</span><div>{['Best', 'New', 'Top'].map((item) => <button type="button" key={item} aria-pressed={sort === item} onClick={() => setSort(item)}>{item}</button>)}</div></div><Empty title="No community posts are modeled">Treblr does not store subreddit posts, votes, comments, members, or moderator activity.</Empty><div className="rd-inbox-note"><strong>Messages</strong><span>Community inbox is not modeled</span></div></div>}
    {tab === 'about' && <div className="rd-about" role="tabpanel" aria-label="Community about"><h2>About this preview</h2><p>This surface borrows the structure of a community page, but no real or simulated subreddit membership exists in the save.</p><dl><div><dt>Community</dt><dd>Not created</dd></div><div><dt>Posts / comments</dt><dd>Not tracked</dd></div><div><dt>Members</dt><dd>Not tracked</dd></div></dl></div>}
  </ServiceFrame>;
}

function WaveformMotif() {
  const bars = [5, 10, 15, 8, 19, 12, 6, 17, 9, 20, 13, 7, 16, 11, 5, 18, 9, 14, 6, 12, 19, 8, 15, 5];
  return <span className="sc-waveform" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ '--bar-height':`${height}px` }} />)}</span>;
}

function SoundCloudPage({ channel, gs, releases, count, fmt, onBack }) {
  const [selected, setSelected] = useState(null);
  const ranked = useMemo(() => [...releases].sort((a, b) => releaseStreams(b) - releaseStreams(a)), [releases]);
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="sc-topbar"><span className="sc-cloud-mark" aria-hidden="true">◖</span><strong>SoundCloud</strong><span aria-hidden="true">⌕</span></div>
    <div className="sc-profile"><Avatar gs={gs} className="sc-avatar" /><div><small>ARTIST PROFILE PREVIEW</small><h1>{gs.stageName || 'Artist'}</h1><span>{findLabel(GENRES, gs.genre, 'Music')} <i>·</i> {findLabel(CITIES, gs.city, 'City not recorded')}</span></div></div>
    <AudienceMetric channel={channel} count={fmt(count)} label="simulated career audience — not SoundCloud followers" />
    <div className="sc-track-heading"><div><small>CAREER CATALOGUE</small><h2>Tracks</h2></div><span>{ranked.length} saved releases</span></div>
    {ranked.length ? <div className="sc-track-list">{ranked.map((track, index) => <button type="button" key={track.id} className={`sc-track${selected?.id === track.id ? ' is-selected' : ''}`} onClick={() => setSelected(selected?.id === track.id ? null : track)}><span className="sc-track-cover"><Artwork track={track} /><b aria-hidden="true">{index + 1}</b></span><span className="sc-track-main"><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small><WaveformMotif /><small className="sc-wave-note">decorative waveform <i>·</i> not audio data</small></span><span className="sc-track-count">{fmt(releaseStreams(track))}<small>Treblr streams</small></span></button>)}</div> : <Empty title="No tracks in this career yet">Release music through the Studio loop to add saved catalogue entries here.</Empty>}
    <ReleaseDetail track={selected} fmt={fmt} />
    <p className="sc-disclaimer">Artwork and stream totals come from this career. No audio player, SoundCloud upload, or account analytics are connected.</p>
  </ServiceFrame>;
}

function AppleMusicPage({ channel, gs, releases, fmt, onBack }) {
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState('recently-released');
  const ordered = useMemo(() => [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0)), [releases]);
  const shown = ordered.filter((track) => filter === 'all' || String(track.releaseType || 'single').toLowerCase() === filter);
  const latest = ordered[0];
  const chartRows = useMemo(() => getCareerChartRows(releases, gs), [releases, gs.charts]);
  const chartWeek = gs.latestChartSnapshot?.week ?? null;
  const playlists = useMemo(() => buildCareerPlaylists(releases), [releases]);
  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId) || playlists[0];
  const changeTab = (id) => {
    setTab(id);
    setFilter(id === 'albums' ? 'album' : id === 'singles' ? 'single' : 'all');
  };
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="am-topbar"><strong>Music</strong><button type="button" aria-label="Search catalogue" disabled>⌕</button></div>
    <div className="am-quick-nav"><span>Listen Now</span><span>Browse</span><span>Radio</span><b>Artist</b></div>
    <div className="am-artist-hero">{latest && <Artwork track={latest} className="am-hero-art" />}<Avatar gs={gs} className="am-avatar" /><div><small>ARTIST</small><h1>{gs.stageName || 'Artist'}</h1><p>{findLabel(GENRES, gs.genre, 'Music')}</p></div></div>
    <div className="am-hero-actions"><button type="button" disabled title="Apple Music playback is not part of this simulation">Play unavailable</button><span>{releases.length} saved releases</span></div>
    <Tabs label="Apple Music artist sections" values={[{ id:'overview', label:'Overview' }, { id:'albums', label:'Albums' }, { id:'singles', label:'Singles' }, { id:'charts', label:'Charts' }, { id:'playlists', label:'Playlists' }, { id:'details', label:'Details' }]} value={tab} onChange={changeTab} className="am-tabs" />
    {['overview','albums','singles'].includes(tab) && <div className="am-panel" role="tabpanel" aria-label={`${tab} releases`}><div className="am-section-head"><h2>{tab === 'overview' ? 'Latest releases' : tab === 'albums' ? 'Albums' : 'Singles'}</h2><span>{shown.length} in this career</span></div>{shown.length ? <div className="am-release-shelf">{shown.map((track) => <button type="button" key={track.id} onClick={() => setSelected(selected?.id === track.id ? null : track)}><Artwork track={track} /><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small><span>{fmt(releaseStreams(track))} Treblr streams</span></button>)}</div> : <Empty title={tab === 'albums' ? 'No albums saved in this career' : tab === 'singles' ? 'No singles saved in this career' : 'No releases are saved yet'}>{tab === 'albums' ? 'Released albums appear here.' : tab === 'singles' ? 'Released singles appear here.' : 'Your latest releases will appear here.'}</Empty>}<ReleaseDetail track={selected} fmt={fmt} /></div>}
    {tab === 'charts' && <div className="am-panel am-chart-panel" role="tabpanel" aria-label="Apple Music career charts" data-testid="apple-music-charts"><div className="am-chart-heading"><div><small>CAREER CHART</small><h2>Track rankings</h2></div><span>{chartWeek != null ? `WEEK ${chartWeek}` : 'WEEK NOT RECORDED'}</span></div>{chartRows.length ? <CareerChartRows rows={chartRows} variant="am" chartWeek={chartWeek} selected={selected} onSelect={setSelected} /> : <Empty title="No releases to chart yet">Released tracks appear here after they enter the career chart.</Empty>}<ReleaseDetail track={selected} fmt={fmt} /></div>}
    {tab === 'playlists' && <div className="am-panel am-playlists-panel" role="tabpanel" aria-label="Apple Music career playlists" data-testid="apple-music-playlists"><div className="am-playlists-heading"><small>MADE FOR {gs.stageName || 'ARTIST'}</small><h2>Playlists</h2><p>Career mixes built from released music</p></div>{releases.length ? <><div className="am-playlist-list">{playlists.map((playlist, index) => <button type="button" key={playlist.id} aria-pressed={activePlaylist?.id === playlist.id} className={`am-playlist-card${activePlaylist?.id === playlist.id ? ' is-selected' : ''}`} onClick={() => setActivePlaylistId(playlist.id)}><PlaylistCover tracks={playlist.tracks} className="am-playlist-cover" /><span className="am-playlist-copy"><small>PLAYLIST {String(index + 1).padStart(2, '0')}</small><strong>{playlist.title}</strong><i>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</i></span><b aria-hidden="true">›</b></button>)}</div>{activePlaylist && <section className="am-playlist-detail"><div className="am-playlist-detail-head"><div><small>CAREER PLAYLIST</small><h3>{activePlaylist.title}</h3></div><span>{activePlaylist.tracks.length} songs</span></div>{activePlaylist.tracks.map((track, index) => <button type="button" key={track.id} className="am-playlist-track" onClick={() => setSelected(selected?.id === track.id ? null : track)}><span className="am-playlist-index">{String(index + 1).padStart(2, '0')}</span><Artwork track={track} /><span><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small></span></button>)}</section>}<ReleaseDetail track={selected} fmt={fmt} /></> : <Empty title="No tracks for a playlist yet">Release music in this career to build Recently released and Popular in this career.</Empty>}</div>}
    {tab === 'details' && <div className="am-details" role="tabpanel" aria-label="Artist details"><h2>{gs.stageName || 'Artist'}</h2><p>{findLabel(GENRES, gs.genre, 'Genre not recorded')} <i>·</i> {findLabel(CITIES, gs.city, 'City not recorded')}</p><span>{releases.length} releases in this career</span></div>}
  </ServiceFrame>;
}

function ITunesPage({ channel, gs, releases, fmt, onBack }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const ordered = useMemo(() => [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0)), [releases]);
  const shown = ordered.filter((track) => (filter === 'all' || String(track.releaseType || 'single').toLowerCase() === filter) && String(track.title || '').toLowerCase().includes(query.toLowerCase()));
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="it-topbar"><div><span className="it-note-icon" aria-hidden="true">♫</span><strong>iTunes Store</strong></div><button type="button" aria-label="Store menu" disabled>☰</button></div>
    <div className="it-nav"><span>Music</span><span>Movies</span><span>TV Shows</span></div>
    <div className="it-title"><small>CAREER MUSIC CATALOGUE</small><h1>{gs.stageName || 'Artist'}</h1><p>Browse releases saved in this career</p></div>
    <label className="it-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this career’s releases" aria-label="Search saved releases" /></label>
    <div className="it-categories" aria-label="Release type filter">{[{ id:'all', label:'All music' }, { id:'album', label:'Albums' }, { id:'single', label:'Singles' }].map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    <div className="it-list-heading"><h2>Catalogue</h2><span>{shown.length} items</span></div>
    {shown.length ? <div className="it-results">{shown.map((track) => <article className="it-result" key={track.id}><button type="button" className="it-result-main" onClick={() => setSelected(selected?.id === track.id ? null : track)}><Artwork track={track} /><span><strong>{track.title}</strong><small>{track.releaseType || 'Single'} <i>·</i> {fmtWeek(track.releaseWeek)}</small></span><b aria-hidden="true">›</b></button><small className="it-result-meta">{fmt(releaseStreams(track))} Treblr streams <i>·</i> no store ranking</small></article>)}</div> : <Empty title={ordered.length ? 'No matching releases' : 'No catalogue items saved'}>{ordered.length ? 'Try another search or release type.' : 'No store entries are fabricated; release music in the game to build this catalogue.'}</Empty>}
    <ReleaseDetail track={selected} fmt={fmt} />
    <p className="it-disclaimer">iTunes availability, purchase prices, ratings, charts, and Apple account data are not modeled. No purchase action is available.</p>
  </ServiceFrame>;
}

function TidalPage({ channel, gs, releases, fmt, onBack }) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const ordered = useMemo(() => [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0)), [releases]);
  const shown = ordered.filter((track) => filter === 'all' || String(track.releaseType || 'single').toLowerCase() === filter);
  return <ServiceFrame channel={channel} onBack={onBack}>
    <div className="td-topbar"><strong>TIDAL</strong><span>ARTIST</span><button type="button" aria-label="Catalogue options" disabled>⋯</button></div>
    <div className="td-identity"><Avatar gs={gs} className="td-avatar" /><div><small>ARTIST CATALOGUE</small><h1>{gs.stageName || 'Artist'}</h1><p>{findLabel(GENRES, gs.genre, 'Music')}</p></div></div>
    <div className="td-subnav"><span>OVERVIEW</span><span>RELEASES</span><span>ABOUT</span></div>
    <div className="td-heading"><div><small>DISCOGRAPHY</small><h2>Releases</h2></div><div className="td-filter" role="group" aria-label="Filter release type">{[{ id:'all', label:'All' }, { id:'album', label:'Albums' }, { id:'single', label:'Singles' }].map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div></div>
    {shown.length ? <div className="td-grid">{shown.map((track, index) => <button type="button" key={track.id} className={selected?.id === track.id ? 'is-selected' : ''} onClick={() => setSelected(selected?.id === track.id ? null : track)}><Artwork track={track} /><span className="td-grid-info"><small>{String(index + 1).padStart(2, '0')} <i>·</i> {track.releaseType || 'Single'}</small><strong>{track.title}</strong><span>{fmtWeek(track.releaseWeek)}</span></span></button>)}</div> : <Empty title="Discography is empty">Only releases saved in the current career appear here. Tidal catalogue availability and playback are not connected.</Empty>}
    <ReleaseDetail track={selected} fmt={fmt} />
    <p className="td-disclaimer">No Tidal account, play queue, audio-quality claim, or service analytics are represented.</p>
  </ServiceFrame>;
}

export default function SocialExperience({ channel, gs, fmt, onBack }) {
  const releases = (Array.isArray(gs.catalog) ? gs.catalog : []).filter((track) => track && track.released);
  const count = Number(channel.engine ? gs.socialPlatforms?.[channel.engine] || 0 : 0);
  const posts = channel.engine && Array.isArray(gs.socialPostHistory)
    ? gs.socialPostHistory.filter((post) => post?.platformId === channel.engine && typeof post.text === 'string' && post.text.trim()).slice().sort((a, b) => Number(b.week || 0) - Number(a.week || 0))
    : [];
  const tracksById = Object.fromEntries((Array.isArray(gs.catalog) ? gs.catalog : []).map((track) => [track.id, track]));
  const common = { channel, gs, releases, count, fmt, onBack };
  switch (channel.id) {
    case 'instagram': return <InstagramPage {...common} />;
    case 'youtube': return <YouTubePage {...common} />;
    case 'spotify': return <SpotifyPage {...common} />;
    case 'tiktok': return <TikTokPage {...common} posts={posts} tracksById={tracksById} />;
    case 'twitter': return <TwitterPage {...common} posts={posts} />;
    case 'forbes': return <ForbesPage {...common} />;
    case 'wikipedia': return <WikipediaPage {...common} />;
    case 'reddit': return <RedditPage {...common} />;
    case 'soundcloud': return <SoundCloudPage {...common} />;
    case 'apple-music': return <AppleMusicPage {...common} />;
    case 'itunes': return <ITunesPage {...common} />;
    case 'tidal': return <TidalPage {...common} />;
    default: return <ServiceFrame {...common}><Empty title="This destination is not modeled">No service-specific data is available in this career.</Empty></ServiceFrame>;
  }
}
