import { NPC_ARTISTS, NPC_SONG_TITLES } from '../data/artists';
import { uid, rand, roll } from './utils';

export const generateNPCCatalog = () => {
  // Seed each NPC with 1-3 existing songs at game start
  const catalog = [];
  for (const npc of NPC_ARTISTS) {
    const numSongs = rand(1, 3);
    for (let i = 0; i < numSongs; i++) {
      catalog.push(generateNPCSong(npc, -(rand(4, 20))));
    }
  }
  return catalog;
};

export const generateNPCSong = (npc, releaseWeek) => ({
  id: uid(),
  npcId: npc.id,
  title: roll(NPC_SONG_TITLES),
  artist: npc.name,
  genre: npc.genre,
  quality: rand(Math.round(npc.talent * 3), Math.round(npc.talent * 4.2)),
  releaseWeek,
  peakStreams: rand(Math.round(npc.fans * 0.25), Math.round(npc.fans * 0.8)),
  peakSales: rand(Math.round(npc.fans * 0.05), Math.round(npc.fans * 0.2)),
  weeksOnChart: 0,
  chartHistory: [],
  peakPos: null,
  currentPos: null,
});

// Run every endWeek — may generate new NPC tracks
export const tickNPCReleases = (npcCatalog, npcLastRelease, totalWeeks) => {
  const newSongs = [];
  const updatedLastRelease = { ...npcLastRelease };

  for (const npc of NPC_ARTISTS) {
    const lastRel = npcLastRelease[npc.id] ?? -(npc.releaseFrequency + rand(0, 4));
    const weeksSinceLast = totalWeeks - lastRel;

    if (weeksSinceLast >= npc.releaseFrequency) {
      // 35% chance when eligible
      if (Math.random() < 0.35) {
        newSongs.push(generateNPCSong(npc, totalWeeks));
        updatedLastRelease[npc.id] = totalWeeks;
      }
    }
  }

  return {
    newNpcSongs: newSongs,
    updatedLastRelease,
    updatedCatalog: [...npcCatalog, ...newSongs],
  };
};

// Calculate chart score for a song (NPC or player)
export const calcChartScore = (song, totalWeeks, artistFans = 0, artistClout = 0) => {
  const weeksOut = totalWeeks - (song.releaseWeek || 0);
  const weeksOnChart = song.weeksOnChart || weeksOut;
  const recency = Math.max(0, 1 - weeksOnChart / 20);

  let cloutFactor = 0;
  if (!song.isPlayer) {
    const npc = NPC_ARTISTS.find(n => n.id === song.npcId);
    cloutFactor = npc ? npc.clout / 100 : 0.5;
  } else {
    cloutFactor = Math.min(1, artistClout / 100);
  }

  const qualityFactor = (song.quality || 50) / 100;
  const fanFactor = song.isPlayer
    ? Math.min(1, Math.log10(Math.max(1, artistFans)) / 7)
    : Math.min(1, Math.log10(Math.max(1, song.peakStreams || 1)) / 7);

  return qualityFactor * 0.4 + recency * 0.35 + (cloutFactor * 0.15) + (fanFactor * 0.10);
};

export const buildCharts = (playerCatalog, npcCatalog, gs) => {
  const playerSongs = (playerCatalog || [])
    .filter(t => t.released)
    .map(t => ({
      ...t,
      isPlayer: true,
      artist: gs.stageName || 'You',
      peakStreams: Math.round((t.quality / 100) * Math.sqrt(gs.fans || 1) * 150000),
      peakSales: Math.round((t.quality / 100) * Math.sqrt(gs.fans || 1) * 30000),
    }));

  const allSongs = [...playerSongs, ...npcCatalog];

  // Stream chart
  const streamChart = buildSingleChart(allSongs, gs, 'streams');
  // Sales chart (different weighting — quality-heavy)
  const salesChart  = buildSingleChart(allSongs, gs, 'sales');
  // Videos chart (VidTube)
  const videoChart  = buildSingleChart(allSongs, gs, 'videos');

  return { streams: streamChart, sales: salesChart, videos: videoChart };
};

const buildSingleChart = (allSongs, gs, type) => {
  const scored = allSongs.map(song => {
    let score = calcChartScore(song, gs.totalWeeks, gs.fans, gs.clout);
    // Slight variance per chart type
    if (type === 'sales')  score *= (0.85 + Math.random() * 0.3);
    if (type === 'videos') score *= (0.80 + Math.random() * 0.4);
    return { ...song, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((song, i) => ({
      ...song,
      position: i + 1,
      lastPos: song.currentPos || i + 2,
      peakPos: song.peakPos ? Math.min(song.peakPos, i + 1) : i + 1,
      weeksOnChart: (song.weeksOnChart || 0) + 1,
      metricVal: type === 'streams' ? Math.round((song.peakStreams || 500000) * song.score * 1.2)
                 : type === 'sales' ? Math.round((song.peakSales || 50000) * song.score * 1.2)
                 : Math.round((song.peakStreams || 500000) * song.score * 0.8),
    }));
};
