import { CITIES, CAREER_TYPES, GENRES } from '../data/constants';

const FALLBACK_COVER = '/assets/covers/cov_01_01.png';

const LAYOUT_BY_SERVICE = {
  instagram:'profile-grid',
  youtube:'channel-videos',
  spotify:'artist-discography',
  tiktok:'creator-video-feed',
  twitter:'chronological-feed',
  forbes:'editorial-feature',
  wikipedia:'encyclopedia-article',
  reddit:'community-page',
  soundcloud:'audio-catalogue',
  'apple-music':'music-artist-page',
  itunes:'store-catalogue',
  tidal:'discography-grid',
};

const audienceLabel = {
  instagram:'in-game audience',
  youtube:'in-game channel audience',
  spotify:'in-game audience',
  tiktok:'in-game audience',
  twitter:'in-game audience',
  soundcloud:'in-game audience',
};

function findLabel(items, id, fallback = '') {
  return items.find((item) => item.id === id)?.label || fallback || id || 'Not recorded';
}

function TrackArtwork({ track, className = '' }) {
  return <span className={`sx-artwork ${className}`}>
    <img src={track?.coverArt || FALLBACK_COVER} alt={`Artwork for ${track?.title || 'release'}`} loading="lazy" />
  </span>;
}

function BackToDirectory({ onBack }) {
  return <button type="button" className="sx-back" onClick={onBack}>
    <span aria-hidden="true">←</span> ALL SOCIAL DESTINATIONS
  </button>;
}

function PageFrame({ channel, onBack, children }) {
  const layout = LAYOUT_BY_SERVICE[channel.id] || 'service-page';
  return <section
    className={`social-experience social-experience--${channel.id}`}
    data-platform={channel.id}
    data-layout={layout}
    aria-label={`${channel.label} in-game experience`}
    style={{ '--social-accent':channel.color }}
  >
    <BackToDirectory onBack={onBack} />
    {children}
    <p className="sx-footer-note">Treblr career data only · no external account is connected.</p>
  </section>;
}

function AudienceCard({ channel, count, label }) {
  return <div className="sx-audience" data-testid="social-simulated-audience">
    <span>{label}</span>
    <strong>{count}</strong>
    <small>Saved in this career · not a real {channel.label} account metric.</small>
  </div>;
}

function EmptyState({ title, children }) {
  return <div className="sx-empty-state">
    <span className="sx-empty-mark" aria-hidden="true">—</span>
    <strong>{title}</strong>
    <p>{children}</p>
  </div>;
}

function ReleaseRows({ tracks, fmt, variant = 'standard', emptyTitle = 'No released music yet' }) {
  if (!tracks.length) return <EmptyState title={emptyTitle}>No released tracks are saved in this career yet.</EmptyState>;
  return <div className={`sx-release-list sx-release-list--${variant}`}>
    {tracks.map((track, index) => {
      const streams = Number(track.lifetimeStreams ?? track.streams ?? 0);
      return <article className="sx-release-row" key={track.id || `${track.title}-${index}`}>
        <TrackArtwork track={track} />
        <span className="sx-release-copy">
          <strong>{track.title}</strong>
          <small>{track.releaseType || 'Single'} · released week {track.releaseWeek ?? '—'}</small>
        </span>
        <span className="sx-release-value">
          <strong>{fmt(streams)}</strong>
          <small>Treblr streams</small>
        </span>
      </article>;
    })}
  </div>;
}

function InstagramPage({ channel, gs, releases, count, fmt, onBack }) {
  const genre = findLabel(GENRES, gs.genre, 'Genre not recorded');
  const city = findLabel(CITIES, gs.city, 'City not recorded');
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-instagram-top"><span>Instagram</span><span aria-hidden="true">⌕　＋</span></div>
    <div className="sx-profile-heading">
      <span className="sx-profile-avatar">
        {gs.avatarUrl ? <img src={gs.avatarUrl} alt={`${gs.stageName} profile`} /> : (gs.stageName || 'A').slice(0, 1)}
      </span>
      <div><small>ARTIST PROFILE PREVIEW</small><h1>{gs.stageName || 'Artist'}</h1></div>
    </div>
    <div className="sx-profile-stats">
      <div><strong>{releases.length}</strong><span>catalog releases</span></div>
      <div className="sx-profile-audience" data-testid="social-simulated-audience"><strong>{fmt(count)}</strong><span>simulated audience</span><small>Saved in this career · not a real Instagram account metric.</small></div>
    </div>
    <div className="sx-profile-bio"><strong>{gs.stageName || 'Artist'}</strong><span>{genre} · {city}</span><small>Career artwork preview · posts and Stories are not tracked.</small></div>
    <div className="sx-local-tabs" aria-label="Instagram profile sections"><span aria-current="page">RELEASE ART</span><span>STORIES · NOT TRACKED</span></div>
    {releases.length ? <div className="sx-photo-grid" aria-label="Saved release artwork">
      {releases.map((track, index) => <article className="sx-photo-tile" key={track.id || `${track.title}-${index}`}>
        <TrackArtwork track={track} />
        <span>{track.title}</span>
      </article>)}
    </div> : <EmptyState title="No release artwork to show">The profile layout is ready; this career has no released tracks yet. Treblr does not create sample posts.</EmptyState>}
    <div className="sx-untracked-row"><strong>Direct messages</strong><span>Not modeled · no inbox is connected</span></div>
  </PageFrame>;
}

function YouTubePage({ channel, gs, releases, count, fmt, onBack }) {
  const videoTracks = releases.filter((track) => Number(track.videoViews || 0) > 0)
    .sort((a, b) => Number(b.videoViews || 0) - Number(a.videoViews || 0));
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-youtube-top"><span className="sx-service-wordmark">YouTube</span><span aria-hidden="true">⌕　⋮</span></div>
    <div className="sx-channel-banner">
      {releases[0] && <TrackArtwork track={releases[0]} />}
      <span>CHANNEL</span>
    </div>
    <div className="sx-channel-identity">
      <span className="sx-profile-avatar">{gs.avatarUrl ? <img src={gs.avatarUrl} alt={`${gs.stageName} channel`} /> : (gs.stageName || 'A').slice(0, 1)}</span>
      <div><h1>{gs.stageName || 'Artist'}</h1><span>Music channel · Treblr career</span></div>
    </div>
    <AudienceCard channel={channel} count={fmt(count)} label="simulated channel audience" />
    <div className="sx-local-tabs" aria-label="YouTube channel sections"><span aria-current="page">VIDEOS</span><span>SHORTS · NOT TRACKED</span><span>PLAYLISTS · NOT TRACKED</span></div>
    <div className="sx-section-heading"><h2>Video view ledger</h2><span>MODELED IN TREBLR</span></div>
    {videoTracks.length ? <div className="sx-video-list">
      {videoTracks.map((track, index) => <article className="sx-video-row" key={track.id || `${track.title}-${index}`}>
        <TrackArtwork track={track} />
        <span className="sx-video-copy"><strong>{track.title}</strong><small>{fmt(Number(track.videoViews || 0))} modeled video views · release week {track.releaseWeek ?? '—'}</small></span>
      </article>)}
    </div> : <EmptyState title="No video views are tracked yet">Treblr stores release-level video-view totals only when the simulation records them. It does not store video files or YouTube uploads.</EmptyState>}
    <p className="sx-data-note">Release artwork and view totals are from this career save; they are not YouTube analytics.</p>
  </PageFrame>;
}

function SpotifyPage({ channel, gs, releases, count, fmt, onBack }) {
  const ranked = [...releases].sort((a, b) => Number(b.lifetimeStreams ?? b.streams ?? 0) - Number(a.lifetimeStreams ?? a.streams ?? 0));
  const latest = [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0))[0];
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-spotify-top"><span>Spotify</span><span aria-hidden="true">⌕　⋯</span></div>
    <div className="sx-artist-hero">
      {latest && <TrackArtwork track={latest} />}
      <div><small>ARTIST</small><h1>{gs.stageName || 'Artist'}</h1><p>{gs.genre ? findLabel(GENRES, gs.genre) : 'Music career'}</p></div>
    </div>
    <AudienceCard channel={channel} count={fmt(count)} label="simulated in-game audience" />
    <div className="sx-section-heading"><h2>Popular releases</h2><span>{ranked.length} saved tracks</span></div>
    <ReleaseRows tracks={ranked} fmt={fmt} variant="spotify" emptyTitle="Your catalogue is waiting" />
    <p className="sx-data-note">Track streams are the Treblr career ledger, not Spotify monthly listeners or Spotify track analytics.</p>
  </PageFrame>;
}

function TikTokPage({ channel, gs, posts, tracksById, count, fmt, onBack }) {
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-tiktok-top"><span>TikTok</span><span aria-hidden="true">⌕　＋</span></div>
    <div className="sx-creator-profile">
      <span className="sx-profile-avatar">{gs.avatarUrl ? <img src={gs.avatarUrl} alt={`${gs.stageName} profile`} /> : (gs.stageName || 'A').slice(0, 1)}</span>
      <h1>{gs.stageName || 'Artist'}</h1>
      <span>@{(gs.stageName || 'artist').toLowerCase().replace(/\s+/g, '')}</span>
      <div className="sx-creator-metrics"><div><strong>{posts.length}</strong><small>saved promo posts</small></div><div data-testid="social-simulated-audience"><strong>{fmt(count)}</strong><small>simulated audience · saved in this career</small></div></div>
    </div>
    <div className="sx-local-tabs sx-local-tabs--center" aria-label="TikTok creator sections"><span aria-current="page">PROMO POSTS</span><span>LIKES · NOT TRACKED</span></div>
    {posts.length ? <div className="sx-tiktok-feed">
      {posts.map((post, index) => {
        const track = tracksById[post.trackId] || null;
        return <article className="sx-tiktok-card" key={post.id || `${post.week}-${index}`}>
          <TrackArtwork track={track} />
          <div className="sx-tiktok-overlay"><strong>{post.text}</strong><small>{post.week != null ? `Week ${post.week}` : 'Saved in career'} · {fmt(Number(post.reach || 0))} modeled reach</small></div>
        </article>;
      })}
    </div> : <EmptyState title="No saved promo posts yet">This creator page uses only posts saved by the Treblr simulation. Video files, views, comments, likes, and direct messages are not tracked.</EmptyState>}
  </PageFrame>;
}

function TwitterPage({ channel, gs, posts, count, fmt, onBack }) {
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-twitter-top"><span>Twitter</span><span aria-hidden="true">⌕　⋯</span></div>
    <div className="sx-twitter-profile">
      <span className="sx-profile-avatar">{gs.avatarUrl ? <img src={gs.avatarUrl} alt={`${gs.stageName} profile`} /> : (gs.stageName || 'A').slice(0, 1)}</span>
      <div><h1>{gs.stageName || 'Artist'}</h1><span>@{(gs.stageName || 'artist').toLowerCase().replace(/\s+/g, '')}</span></div>
      <AudienceCard channel={channel} count={fmt(count)} label="simulated audience" />
    </div>
    <div className="sx-local-tabs" aria-label="Twitter profile sections"><span aria-current="page">POSTS</span><span>REPLIES · NOT TRACKED</span><span>MEDIA</span></div>
    <div className="sx-section-heading"><h2>Your saved timeline</h2><span>CHRONOLOGICAL</span></div>
    {posts.length ? <div className="sx-post-list">
      {posts.map((post, index) => <article className="sx-post" key={post.id || `${post.week}-${index}`}>
        <span className="sx-post-avatar">{(gs.stageName || 'A').slice(0, 1)}</span>
        <div><div className="sx-post-byline"><strong>{gs.stageName || 'Artist'}</strong><span>@{(gs.stageName || 'artist').toLowerCase().replace(/\s+/g, '')}</span><span>{post.week != null ? `Week ${post.week}` : 'Saved post'}</span></div>
          <p>{post.text}</p>
          {post.reach != null && <small className="sx-post-reach">{fmt(Number(post.reach || 0))} modeled reach · Treblr only</small>}
        </div>
      </article>)}
    </div> : <EmptyState title="No saved posts in this timeline">Posts appear here only if they are recorded in this career. Replies, likes, direct messages, and external account activity are not tracked.</EmptyState>}
  </PageFrame>;
}

function EditorialPage({ channel, gs, onBack }) {
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-forbes-masthead"><span>Forbes</span><small>EDITORIAL · MUSIC</small></div>
    <div className="sx-editorial-layout">
      <p className="sx-editorial-kicker">ARTIST PROFILE</p>
      <h1>{gs.stageName || 'Artist'}</h1>
      <div className="sx-editorial-rule" />
      <p className="sx-editorial-status">No editorial feature is saved for this career.</p>
      <p className="sx-editorial-copy">Treblr does not model Forbes articles, rankings, interviews, or publication outcomes. This page is a service-style destination only.</p>
      <div className="sx-editorial-stamp">NOT MODELED <span>·</span> NO ARTICLE DATA</div>
    </div>
  </PageFrame>;
}

function WikipediaPage({ channel, gs, releases, fmt, onBack }) {
  const facts = [
    ['Stage name', gs.stageName || 'Not recorded'],
    ['Genre', findLabel(GENRES, gs.genre, 'Not recorded')],
    ['Home city', findLabel(CITIES, gs.city, 'Not recorded')],
    ['Career path', findLabel(CAREER_TYPES, gs.careerType, 'Not recorded')],
    ['Completed weeks', String(Number(gs.totalWeeks || 0))],
  ];
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-wiki-brand"><span>Wikipedia</span><small>The Free Encyclopedia · in-game article view</small></div>
    <article className="sx-wiki-article">
      <h1>{gs.stageName || 'Artist'}</h1>
      <p className="sx-wiki-lead">Career facts from this Treblr save. No biography has been written in-game.</p>
      <nav className="sx-wiki-toc" aria-label="Article contents"><strong>Contents</strong><a href="#wiki-overview">Overview</a><a href="#wiki-discography">Discography</a></nav>
      <aside className="sx-wiki-infobox" aria-label="Career facts"><strong>Career facts</strong>{facts.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</aside>
      <section id="wiki-overview"><h2>Overview</h2><p>No encyclopedia biography, awards list, or external citations are modeled. The facts above are read from this saved career.</p></section>
      <section id="wiki-discography"><h2>Discography</h2>
        {releases.length ? <ul>{releases.map((track, index) => <li key={track.id || `${track.title}-${index}`}>{track.title} <span>({fmt(Number(track.lifetimeStreams ?? track.streams ?? 0))} Treblr streams)</span></li>)}</ul> : <p>No released works are recorded yet.</p>}
      </section>
    </article>
  </PageFrame>;
}

function RedditPage({ channel, gs, onBack }) {
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-reddit-top"><span>Reddit</span><span aria-hidden="true">⌕　☰</span></div>
    <div className="sx-community-heading"><span className="sx-community-mark">r/</span><div><small>COMMUNITY PREVIEW</small><h1>{gs.stageName || 'Artist'}</h1></div></div>
    <div className="sx-community-tabs"><span aria-current="page">Posts</span><span>About</span></div>
    <div className="sx-community-sort"><span>Feed</span><strong>New</strong><span>Top</span></div>
    <EmptyState title="Community activity is not modeled">This career has no saved subreddit, posts, votes, comments, membership count, or moderator activity. No sample discussion has been added.</EmptyState>
    <div className="sx-untracked-row"><strong>Messages</strong><span>Not tracked · no community inbox</span></div>
  </PageFrame>;
}

function SoundCloudPage({ channel, gs, releases, count, fmt, onBack }) {
  const ranked = [...releases].sort((a, b) => Number(b.lifetimeStreams ?? b.streams ?? 0) - Number(a.lifetimeStreams ?? a.streams ?? 0));
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-soundcloud-top"><span>SoundCloud</span><span aria-hidden="true">⌕　⋯</span></div>
    <div className="sx-sc-artist"><span className="sx-profile-avatar">{gs.avatarUrl ? <img src={gs.avatarUrl} alt={`${gs.stageName} profile`} /> : (gs.stageName || 'A').slice(0, 1)}</span><div><small>ARTIST PROFILE</small><h1>{gs.stageName || 'Artist'}</h1><span>{findLabel(GENRES, gs.genre, 'Music')} · {findLabel(CITIES, gs.city, 'City')}</span></div></div>
    <AudienceCard channel={channel} count={fmt(count)} label="simulated in-game audience" />
    <div className="sx-section-heading"><h2>Tracks</h2><span>{ranked.length} saved releases</span></div>
    <ReleaseRows tracks={ranked} fmt={fmt} variant="soundcloud" emptyTitle="No tracks in this career yet" />
    <p className="sx-data-note">Stream totals come from Treblr’s saved release ledger. This preview has no audio player or SoundCloud upload.</p>
  </PageFrame>;
}

function CataloguePage({ channel, gs, releases, fmt, onBack }) {
  const isItunes = channel.id === 'itunes';
  const title = isItunes ? 'iTunes' : 'Apple Music';
  const sorted = [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0));
  return <PageFrame channel={channel} onBack={onBack}>
    <div className={`sx-catalogue-top ${isItunes ? 'is-itunes' : 'is-apple-music'}`}><span>{title}</span><span>{isItunes ? 'STORE' : 'ARTIST'}</span></div>
    <div className="sx-catalogue-hero">
      {sorted[0] && <TrackArtwork track={sorted[0]} />}
      <small>{isItunes ? 'MUSIC CATALOGUE' : 'ARTIST PAGE'}</small>
      <h1>{gs.stageName || 'Artist'}</h1>
      <p>{isItunes ? 'Saved releases from this career' : `${findLabel(GENRES, gs.genre, 'Music')} · Artist`}</p>
    </div>
    <div className="sx-local-tabs" aria-label={`${title} sections`}><span aria-current="page">{isItunes ? 'ALBUMS & SINGLES' : 'DISCOGRAPHY'}</span><span>CHARTS · NOT TRACKED</span></div>
    <div className="sx-section-heading"><h2>{isItunes ? 'Catalogue' : 'Releases'}</h2><span>{sorted.length} saved in Treblr</span></div>
    {sorted.length ? <div className={`sx-catalogue-grid ${isItunes ? 'is-itunes' : 'is-apple-music'}`}>
      {sorted.map((track, index) => <article className="sx-catalogue-card" key={track.id || `${track.title}-${index}`}>
        <TrackArtwork track={track} />
        <strong>{track.title}</strong>
        <small>{track.releaseType || 'Single'} · week {track.releaseWeek ?? '—'}</small>
      </article>)}
    </div> : <EmptyState title="No catalogue releases saved">This page can display only releases recorded in the current career. No store listing or service availability is inferred.</EmptyState>}
    <p className="sx-data-note">Apple Music and iTunes availability, plays, purchases, charts, and artist-account data are not modeled.</p>
  </PageFrame>;
}

function TidalPage({ channel, gs, releases, onBack }) {
  const sorted = [...releases].sort((a, b) => Number(b.releaseWeek || 0) - Number(a.releaseWeek || 0));
  return <PageFrame channel={channel} onBack={onBack}>
    <div className="sx-tidal-top"><span>Tidal</span><small>ARTIST</small></div>
    <div className="sx-tidal-hero"><h1>{gs.stageName || 'Artist'}</h1><span>{findLabel(GENRES, gs.genre, 'Music')} · artist catalogue</span></div>
    <div className="sx-local-tabs sx-local-tabs--center" aria-label="Tidal artist sections"><span aria-current="page">DISCOGRAPHY</span><span>VIDEOS · NOT TRACKED</span></div>
    <div className="sx-section-heading"><h2>Releases</h2><span>{sorted.length} in this save</span></div>
    {sorted.length ? <div className="sx-tidal-grid">{sorted.map((track, index) => <article key={track.id || `${track.title}-${index}`}>
      <TrackArtwork track={track} /><strong>{track.title}</strong><small>{track.releaseType || 'Single'} · week {track.releaseWeek ?? '—'}</small>
    </article>)}</div> : <EmptyState title="No releases in the discography yet">Only music saved in this career can appear here. Tidal plays, availability, audio quality, and account analytics are not tracked.</EmptyState>}
    <p className="sx-data-note">This Tidal-style catalogue is a Treblr career preview, not a Tidal artist account.</p>
  </PageFrame>;
}

function ForbesPage({ channel, gs, onBack }) {
  return <EditorialPage channel={channel} gs={gs} onBack={onBack} />;
}

export default function SocialExperience({ channel, gs, fmt, onBack }) {
  const releases = (Array.isArray(gs.catalog) ? gs.catalog : []).filter((track) => track && track.released);
  const count = Number(gs.socialPlatforms?.[channel.engine] || 0);
  const posts = channel.engine && Array.isArray(gs.socialPostHistory)
    ? gs.socialPostHistory.filter((post) => post?.platformId === channel.engine && typeof post.text === 'string' && post.text.trim())
      .slice().sort((a, b) => Number(b.week || 0) - Number(a.week || 0))
    : [];
  const tracksById = Object.fromEntries((Array.isArray(gs.catalog) ? gs.catalog : []).map((track) => [track.id, track]));
  const common = { channel, gs, releases, count, fmt, onBack };

  switch (channel.id) {
    case 'instagram': return <InstagramPage {...common} />;
    case 'youtube': return <YouTubePage {...common} />;
    case 'spotify': return <SpotifyPage {...common} />;
    case 'tiktok': return <TikTokPage {...common} posts={posts} tracksById={tracksById} />;
    case 'twitter': return <TwitterPage {...common} posts={posts} />;
    case 'forbes': return <ForbesPage channel={channel} gs={gs} onBack={onBack} />;
    case 'wikipedia': return <WikipediaPage {...common} />;
    case 'reddit': return <RedditPage channel={channel} gs={gs} onBack={onBack} />;
    case 'soundcloud': return <SoundCloudPage {...common} />;
    case 'apple-music':
    case 'itunes': return <CataloguePage {...common} />;
    case 'tidal': return <TidalPage channel={channel} gs={gs} releases={releases} onBack={onBack} />;
    default: return <PageFrame channel={channel} onBack={onBack}><h1>{channel.label}</h1><EmptyState title="This destination is not modeled">No service-specific data is available in this career.</EmptyState></PageFrame>;
  }
}
