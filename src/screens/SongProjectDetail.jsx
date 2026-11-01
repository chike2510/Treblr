import { CHARTS, certName, fmtNum, formatWeekDate, genreName, SONG_CERTS, ALBUM_CERTS } from '../engine/index.js';
import { useGame, Icon, Mono, Cover } from '../ui/kit.jsx';
import './song-project-detail.css';

const length = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const rankFor = (state, id, chartId) => (state.charts?.[chartId] || []).find((x) => x.id === id);
const ChartLine = ({ name, place, weeks }) => <span className="spd-chip">{place ? `#${place} ${name}` : name}{weeks ? ` · ${weeks}w` : ''}</span>;

export default function SongProjectDetail({ kind = 'song', id, onBack }) {
  const { state, openSong } = useGame();
  const project = kind === 'project';
  const item = project ? state.releases.find((x) => x.id === id) : state.songs.find((x) => x.id === id) || state.rivalSongs.find((x) => x.id === id && x.featPlayer);
  if (!item) return <section className="screen spd"><button className="btn" onClick={onBack}><Icon name="back" size={16} /> Back</button><div className="empty mt16">This {project ? 'project' : 'song'} is no longer in the catalogue.</div></section>;
  const isRival = !project && !state.songs.some((x) => x.id === id);
  const tracks = project ? item.songIds.map((songId) => state.songs.find((x) => x.id === songId)).filter(Boolean) : [];
  const lead = project ? tracks[0] : item;
  const artist = isRival ? state.rivals.find((x) => x.id === item.rivalId)?.name || 'Unknown artist' : state.player.stageName;
  const peaks = project ? {} : item.peaks || {};
  const chartEntries = Object.entries(project ? { album: rankFor(state, id, 'album') } : Object.fromEntries(Object.keys(peaks).map((chartId) => [chartId, rankFor(state, id, chartId)]))).filter(([, row]) => row);
  const peakEntries = project ? (item.peaks?.album ? [['album', { pk: item.peaks.album, w: item.weeksOnChart || 0 }]] : chartEntries) : Object.entries(peaks).map(([chartId, place]) => [chartId, { pk: place, w: (state.charts?.[chartId] || []).find((x) => x.id === id)?.w || 0 }]);
  const maxHistory = Math.max(1, ...(item.history || []));
  const streamTotal = project ? tracks.reduce((a, x) => a + (x.lifetimeStreams || 0), 0) : item.lifetimeStreams || 0;
  const weekly = project ? tracks.reduce((a, x) => a + (x.weeklyStreams || 0), 0) : item.weeklyStreams || 0;
  const creditNames = project ? [...new Set(tracks.flatMap((x) => [x.producer && x.producer !== 'self' ? x.producer : null, x.cowriter && x.cowriter !== 'none' ? x.cowriter : null, x.featName ? `feat. ${x.featName}` : null]).filter(Boolean))] : [item.cowriter && item.cowriter !== 'none' ? `Co-writer: ${item.cowriter}` : 'Written by the artist', item.producer && item.producer !== 'self' ? `Produced by ${item.producer}` : item.status === 'released' ? 'Self-produced' : null, item.featName ? `Featuring ${item.featName}` : null].filter(Boolean);
  const chartTitle = (chartId) => CHARTS.find((x) => x.id === chartId)?.short || CHARTS.find((x) => x.id === chartId)?.name || chartId;
  const runWeeks = peakEntries.reduce((n, [, value]) => Math.max(n, value.w || 0), 0);
  const runtime = project ? tracks.reduce((n, x) => n + (x.length || 0), 0) : item.length || 0;
  const cert = item.cert;
  const certNameValue = cert && certName(cert, project || item.type !== 'single' ? ALBUM_CERTS : SONG_CERTS);
  const release = project ? formatWeekDate(item.releaseWeek, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  return (
    <section className="screen spd">
      <button className="spd-back" onClick={onBack}><span aria-hidden="true">‹</span> Back</button>
      <header className="spd-hero">
        <div className="spd-art"><Cover cover={item.cover} title={item.title} size={208} /></div>
        <div className="spd-intro">
          <Mono className="sm">{project ? `${item.type.toUpperCase()} PROJECT` : 'SONG DETAIL'}</Mono>
          <h1>{item.title}</h1>
          <div className="spd-artist">{artist}{!project && item.featName ? ` feat. ${item.featName}` : ''}</div>
          <p>{project ? `${item.status === 'out' ? `Released ${release}` : `Scheduled week ${item.releaseWeek}`} · ${tracks.length} tracks · ${length(runtime)}` : `${genreName(item.genre)} · ${length(item.length)} · ${item.status === 'released' ? 'Released' : item.status}`}</p>
          <div className="spd-chips">
            {cert && <span className="spd-chip spd-cert">{certNameValue} certified</span>}
            {peakEntries.map(([chartId, value]) => <ChartLine key={chartId} name={chartTitle(chartId)} place={value.pk || value.r} weeks={value.w} />)}
            {!peakEntries.length && <span className="spd-chip">Not charted yet</span>}
          </div>
          <div className="spd-actions"><span className="spd-primary"><Icon name="play" size={16} fill="currentColor" /> {project ? 'Project details' : 'Track details'}</span></div>
        </div>
      </header>
      <div className="spd-columns">
        <div className="spd-main">
          <section className="spd-panel"><div className="spd-panel-head"><div><Mono className="sm">{project ? 'PROJECT PERFORMANCE' : 'PERFORMANCE SNAPSHOT'}</Mono><h2>{project ? 'Streaming & sales' : 'The numbers'}</h2></div><span className="spd-live">● LIVE</span></div>
            <div className="spd-stats"><div><span>{project ? 'Track streams' : 'Lifetime streams'}</span><strong>{fmtNum(streamTotal)}</strong></div><div><span>This week</span><strong>{fmtNum(weekly)}</strong></div><div><span>{project ? 'First week units' : 'Chart peak'}</span><strong>{project ? fmtNum(item.firstWeek || 0) : peakEntries.length ? `#${Math.min(...peakEntries.map(([, v]) => v.pk || v.r))}` : '—'}</strong></div><div><span>{project ? 'Total units' : 'Chart run'}</span><strong>{project ? fmtNum(item.totalUnits || 0) : runWeeks ? `${runWeeks} weeks` : '—'}</strong></div></div>
          </section>
          {!project && item.history?.length > 1 && <section className="spd-panel"><div className="spd-panel-head"><div><Mono className="sm">WEEKLY PERFORMANCE</Mono><h2>Chart trajectory</h2></div><span className="spd-muted">{item.history.length} weeks</span></div><div className="spd-bars" role="img" aria-label="Weekly streams trend">{item.history.slice(-20).map((value, index) => <span key={index} title={`${fmtNum(value)} streams`} style={{ height: `${Math.max(5, value / maxHistory * 100)}%` }} />)}</div></section>}
          {project && <section className="spd-panel"><div className="spd-panel-head"><div><Mono className="sm">THE TRACKLIST</Mono><h2>{tracks.length} tracks · {length(runtime)}</h2></div></div><div className="spd-tracks">{tracks.map((song, index) => <button className="spd-track" key={song.id} onClick={() => openSong?.(song.id)}><span className="spd-track-index">{String(index + 1).padStart(2, '0')}</span><Cover cover={song.cover} title={song.title} size={40} /><span className="spd-track-name"><b>{song.title}</b><small>{song.featName ? `feat. ${song.featName}` : artist}</small></span><span className="spd-track-duration">{length(song.length)}</span><span className="spd-track-streams">{fmtNum(song.lifetimeStreams || 0)}</span></button>)}</div></section>}
          {project && item.review && <section className="spd-panel spd-review"><Mono className="sm">TREBLRFORK REVIEW</Mono><strong>{Number(item.review.score || 0).toFixed(1)}<small> / 10</small></strong><p>{item.review.summary || item.review.verdict || 'A strong release from the artist.'}</p></section>}
        </div>
        <aside className="spd-side">
          <section className="spd-panel"><Mono className="sm">CHART POSITIONS</Mono><h2>Peak & run</h2>{peakEntries.length ? peakEntries.map(([chartId, value]) => <div className="spd-position" key={chartId}><span>{chartTitle(chartId)}</span><b>#{value.pk || value.r}</b><small>{value.w || 0} weeks</small></div>) : <p className="spd-muted">No chart positions recorded yet.</p>}</section>
          <section className="spd-panel"><Mono className="sm">CREDITS</Mono><h2>Made by</h2><div className="spd-credit"><span>ARTIST</span><b>{artist}</b></div>{creditNames.map((credit) => <div className="spd-credit" key={credit}><span>{credit.startsWith('feat.') ? 'FEATURED ARTIST' : 'CREDIT'}</span><b>{credit}</b></div>)}{!creditNames.length && <p className="spd-muted">No additional credits recorded.</p>}</section>
          {!project && <section className="spd-panel"><Mono className="sm">RELEASE INFO</Mono><h2>Track details</h2><div className="spd-credit"><span>GENRE</span><b>{genreName(item.genre)}</b></div><div className="spd-credit"><span>QUALITY</span><b>{item.quality}</b></div><div className="spd-credit"><span>CERTIFICATION</span><b>{certNameValue || 'None yet'}</b></div></section>}
          {project && <section className="spd-panel"><Mono className="sm">PROJECT DETAILS</Mono><h2>Release info</h2><div className="spd-credit"><span>RELEASED</span><b>{release}</b></div><div className="spd-credit"><span>TYPE</span><b>{item.type.toUpperCase()}</b></div><div className="spd-credit"><span>CERTIFICATION</span><b>{certNameValue || 'None yet'}</b></div></section>}
        </aside>
      </div>
    </section>
  );
}
