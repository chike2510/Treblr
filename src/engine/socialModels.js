import { NPC_ARTISTS } from '../data/artists';

const finiteCount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const releasedTracks = (tracks) => (Array.isArray(tracks) ? tracks : []).filter((track) => track?.released);

export function getCareerChartRows(tracks, gameState = {}) {
  const released = releasedTracks(tracks);
  const releaseIds = new Set(released.map((track) => track.id));
  const currentEntries = new Map(
    (Array.isArray(gameState.charts?.streams) ? gameState.charts.streams : [])
      .filter((entry) => releaseIds.has(entry?.id))
      .map((entry) => [entry.id, entry]),
  );

  return released
    .map((track) => {
      const chartEntry = currentEntries.get(track.id) || null;
      const position = Number(chartEntry?.position ?? track.chartPos);
      return {
        ...track,
        chartEntry,
        chartPosition: Number.isFinite(position) && position > 0 ? position : null,
      };
    })
    .sort((a, b) => (a.chartPosition ?? Number.MAX_SAFE_INTEGER) - (b.chartPosition ?? Number.MAX_SAFE_INTEGER)
      || finiteCount(b.releaseWeek) - finiteCount(a.releaseWeek));
}

export function buildCareerPlaylists(tracks) {
  const released = releasedTracks(tracks);
  const byReleaseDate = (a, b) => finiteCount(b.releaseWeek) - finiteCount(a.releaseWeek)
    || String(a.title || '').localeCompare(String(b.title || ''));
  const byCareerStreams = (a, b) => finiteCount(b.lifetimeStreams ?? b.streams) - finiteCount(a.lifetimeStreams ?? a.streams)
    || byReleaseDate(a, b);

  return [
    {
      id: 'recently-released',
      title: 'Recently released',
      description: 'Newest releases in this career',
      tracks: [...released].sort(byReleaseDate),
    },
    {
      id: 'popular-in-career',
      title: 'Popular in this career',
      description: 'Ordered by career track streams',
      tracks: [...released].sort(byCareerStreams),
    },
  ];
}

export function getModeledArtistRank(gameState = {}, peerArtists = NPC_ARTISTS) {
  const playerFans = finiteCount(gameState.fans);
  const peers = (Array.isArray(peerArtists) ? peerArtists : [])
    .map((artist) => finiteCount(gameState.npcCareers?.[artist.id]?.fans ?? artist.fans))
    .filter(Number.isFinite);
  const rank = 1 + peers.filter((fans) => fans > playerFans).length;

  return {
    rank,
    population: peers.length + 1,
    playerFans,
    basis: 'career fanbase',
  };
}
