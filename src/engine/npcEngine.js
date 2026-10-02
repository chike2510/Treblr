import { NPC_ARTISTS, NPC_SONG_TITLES } from '../data/artists';
import { clamp, uid, rand, roll } from './utils';

const ensureCareer = (npc, current = {}) => ({
  ...current,
  fans: Math.max(1, Number(current.fans ?? npc.fans)),
  clout: clamp(Number(current.clout ?? npc.clout), 0, 100),
  releases: Number(current.releases || 0),
  projects: Number(current.projects || 0),
  lastActiveWeek: Number(current.lastActiveWeek || 0),
});

export const estimateNPCMonthlyListeners = (npc, current = {}, npcCatalog = [], totalWeeks = 0) => {
  if (!npc) return 0;
  const career = ensureCareer(npc, current);
  const tracks = (Array.isArray(npcCatalog) ? npcCatalog : []).filter((song) => song?.npcId === npc.id);
  // In-game estimate: 1% of fans + 0.05% per released catalog track (up to 20) + recent four-week streams / 350.
  const releaseCount = Math.min(20, Math.max(tracks.length, career.releases));
  const fanbaseListeners = career.fans * (0.01 + releaseCount * 0.0005);
  const monthlyStreams = tracks.reduce((sum, song) => {
    const history = Array.isArray(song.weeklyHistory) ? song.weeklyHistory : [];
    const recent = history.filter((sample) => {
      const week = Number(sample?.week);
      return Number.isFinite(week) && week <= totalWeeks && week > totalWeeks - 4;
    });
    const sampledWeeklyStreams = recent.length
      ? recent.reduce((sampleSum, sample) => sampleSum + Math.max(0, Number(sample.streams) || 0), 0) / recent.length
      : Math.max(0, Number(song.weeklyStreams) || 0);
    return sum + sampledWeeklyStreams * 4;
  }, 0);

  // Use the player's existing 1-listener-per-350-weekly-stream conversion for rival stream equivalents.
  return Math.max(0, Math.round(fanbaseListeners + monthlyStreams / 350));
};

export const normalizeNPCCareers = (npcCareers = {}, npcCatalog = [], totalWeeks = 0) => {
  const saved = npcCareers && typeof npcCareers === 'object' && !Array.isArray(npcCareers) ? npcCareers : {};
  return Object.fromEntries(NPC_ARTISTS.map((npc) => {
    const current = saved[npc.id] || {};
    const career = ensureCareer(npc, current);
    const savedListeners = Number(current.monthlyListeners);
    const hasSavedListeners = current.monthlyListeners !== null
      && current.monthlyListeners !== ''
      && Number.isFinite(savedListeners)
      && savedListeners >= 0;
    return [npc.id, {
      ...career,
      monthlyListeners: hasSavedListeners
        ? Math.round(savedListeners)
        : estimateNPCMonthlyListeners(npc, career, npcCatalog, totalWeeks),
    }];
  }));
};

export const seedNPCCareers = (npcCatalog = [], totalWeeks = 0) => Object.fromEntries(NPC_ARTISTS.map((npc) => {
  const career = ensureCareer(npc);
  return [npc.id, { ...career, monthlyListeners:estimateNPCMonthlyListeners(npc, career, npcCatalog, totalWeeks) }];
}));

export const generateNPCSong = (npc, releaseWeek, currentCareer) => {
  const career = ensureCareer(npc, currentCareer);
  return {
    id: uid(),
    npcId: npc.id,
    title: roll(NPC_SONG_TITLES),
    artist: npc.name,
    genre: npc.genre,
    quality: rand(Math.max(20, Math.round(npc.talent * 3)), Math.max(25, Math.round(npc.talent * 4.2))),
    releaseWeek,
    peakStreams: rand(Math.round(career.fans * 0.25), Math.round(career.fans * 0.8)),
    peakSales: rand(Math.round(career.fans * 0.01), Math.round(career.fans * 0.035)),
    weeklyStreams: 0,
    lifetimeStreams: 0,
    weeklySales: 0,
    lifetimeSales: 0,
    videoViews: 0,
    weeklyHistory: [],
    weeksOnChart: 0,
    chartHistory: [],
    peakPos: null,
    currentPos: null,
  };
};

export const generateNPCCatalog = () => {
  const catalog = [];
  const careers = seedNPCCareers();
  for (const npc of NPC_ARTISTS) {
    const numSongs = rand(1, 3);
    for (let i = 0; i < numSongs; i += 1) catalog.push(generateNPCSong(npc, -rand(4, 20), careers[npc.id]));
  }
  return catalog;
};

export const tickNPCReleases = (npcCatalog, npcLastRelease, totalWeeks, npcCareers = {}) => {
  const newSongs = [];
  const updatedLastRelease = { ...npcLastRelease };
  const careers = normalizeNPCCareers(npcCareers, npcCatalog, totalWeeks);

  for (const npc of NPC_ARTISTS) {
    const career = ensureCareer(npc, careers[npc.id]);
    const weeksSinceActive = Math.max(0, totalWeeks - (career.lastActiveWeek || 0));
    career.fans = Math.max(1, Math.round(career.fans * (1 + (career.clout / 10000) + (weeksSinceActive > 12 ? 0.0007 : 0.0013))));
    career.clout = clamp(career.clout + (career.releases ? 0.025 : 0.01), 0, 100);
    careers[npc.id] = career;

    const lastRel = npcLastRelease[npc.id] ?? -(npc.releaseFrequency + rand(0, 4));
    if (totalWeeks - lastRel >= npc.releaseFrequency && Math.random() < 0.35) {
      const song = generateNPCSong(npc, totalWeeks, career);
      newSongs.push(song);
      updatedLastRelease[npc.id] = totalWeeks;
      careers[npc.id] = { ...career, fans: Math.round(career.fans * 1.025 + 250), clout: clamp(career.clout + 0.2, 0, 100), releases: career.releases + 1, lastActiveWeek: totalWeeks };
    }
  }

  const catalog = [...(npcCatalog || []), ...newSongs].map((song) => {
    const npc = NPC_ARTISTS.find((artist) => artist.id === song.npcId);
    if (!npc) return song;
    const career = ensureCareer(npc, careers[npc.id]);
    const age = Math.max(0, totalWeeks - (song.releaseWeek || 0));
    const decay = Math.max(0.04, 1 - age / 96);
    const weeklyStreams = Math.max(1, Math.round((song.quality / 100) * Math.sqrt(career.fans) * 30 * decay));
    const weeklySales = Math.max(0, Math.round(weeklyStreams * 0.003));
    return {
      ...song,
      weeklyStreams,
      lifetimeStreams: Number(song.lifetimeStreams || 0) + weeklyStreams,
      peakStreams: Math.max(Number(song.peakStreams || 0), weeklyStreams),
      weeklySales,
      lifetimeSales: Number(song.lifetimeSales || 0) + weeklySales,
      videoViews: Number(song.videoViews || 0) + Math.round(weeklyStreams * 0.1),
      weeklyHistory: [...(Array.isArray(song.weeklyHistory) ? song.weeklyHistory : []).filter((sample) => Number(sample?.week) !== totalWeeks), { week:totalWeeks, streams:weeklyStreams }]
        .sort((a, b) => Number(a.week) - Number(b.week))
        .slice(-4),
    };
  });
  for (const npc of NPC_ARTISTS) {
    const career = ensureCareer(npc, careers[npc.id]);
    careers[npc.id] = {
      ...career,
      monthlyListeners:estimateNPCMonthlyListeners(npc, career, catalog, totalWeeks),
    };
  }
  return { newNpcSongs: newSongs, updatedLastRelease, updatedCatalog: catalog, updatedCareers: careers };
};

const getSongMetric = (song, type, state) => {
  const career = song.isPlayer ? null : state?.npcCareers?.[song.npcId];
  const fans = song.isPlayer ? state?.fans : career?.fans;
  const quality = Number(song.quality || 50);
  const recent = Number(song.weeklyStreams || 0);
  if (type === 'streams') {
    const allTime = Number(song.lifetimeStreams || song.peakStreams || 0);
    return Math.log10(recent + 1) * 8 + Math.log10(allTime + 1) * 3.6 + Math.log10((fans || 0) + 1) * 1.4 + quality * 0.045;
  }
  if (type === 'sales') {
    return Math.log10(Number(song.weeklySales || 0) * 4 + Number(song.lifetimeSales || song.peakSales || 0) * 0.08 + 1) * 10 + quality * 0.085;
  }
  return Math.log10(Number(song.weeklyVideoViews || 0) * 4 + Number(song.videoViews || 0) * 0.06 + Number(song.peakVideoViews || 0) + 1) * 10 + quality * 0.06;
};

export const calcChartScore = (song, totalWeeks, artistFans = 0, artistClout = 0, type = 'streams', state = {}) => {
  const weeksOut = Math.max(0, totalWeeks - (song.releaseWeek || 0));
  const recency = Math.max(0.15, 1 - weeksOut / 60);
  const career = song.isPlayer ? null : state?.npcCareers?.[song.npcId];
  const clout = song.isPlayer ? artistClout : career?.clout ?? NPC_ARTISTS.find((artist) => artist.id === song.npcId)?.clout ?? 0;
  const audience = song.isPlayer ? artistFans : career?.fans ?? song.peakStreams;
  const formatScore = getSongMetric(song, type, state);
  return formatScore * recency + (Number(clout || 0) * 0.035) + Math.log10(Number(audience || 0) + 1) * 0.4;
};

export const buildCharts = (playerCatalog, npcCatalog, state) => {
  const playerSongs = (playerCatalog || []).filter((track) => track.released).map((track) => ({
    ...track,
    isPlayer: true,
    artist: state?.stageName || 'You',
    peakStreams: Number(track.lifetimeStreams || track.streams || 0),
    peakSales: Number(track.lifetimeSales || 0),
    weeklyVideoViews: Number(track.weeklyVideoViews || 0),
  }));
  const allSongs = [...playerSongs, ...(npcCatalog || [])];
  return {
    streams: buildSingleChart(allSongs, state, 'streams'),
    sales: buildSingleChart(allSongs, state, 'sales'),
    videos: buildSingleChart(allSongs, state, 'videos'),
  };
};

const buildSingleChart = (allSongs, state, type) => allSongs
  .map((song) => ({ ...song, score: calcChartScore(song, state?.totalWeeks || 0, state?.fans || 0, state?.clout || 0, type, state) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 50)
  .map((song, index) => ({
    ...song,
    position: index + 1,
    lastPos: song.currentPos || index + 2,
    peakPos: song.peakPos ? Math.min(song.peakPos, index + 1) : index + 1,
    weeksOnChart: (song.weeksOnChart || 0) + 1,
    metricVal: type === 'streams' ? Math.round(song.weeklyStreams || 0)
      : type === 'sales' ? Math.round((song.weeklySales || 0) * 4)
      : Math.round(song.weeklyVideoViews || 0),
  }));
