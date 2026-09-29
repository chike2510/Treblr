const logAudience = (value) => Math.log10(Math.max(1, value || 0));
const total = (values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0);

export const getAwardCategories = (state) => {
  const tracks = (state?.catalog || []).filter((track) => track.released);
  const projects = state?.projects || [];
  const recentTracks = tracks.filter((track) => (state?.totalWeeks || 0) - (track.releaseWeek || 0) <= 48);
  const bestSong = tracks.reduce((best, track) => !best || (track.lifetimeStreams || 0) > (best.lifetimeStreams || 0) ? track : best, null);
  const bestProject = projects.reduce((best, project) => !best || (project.streams || 0) > (best.streams || 0) ? project : best, null);
  const videoViews = total(tracks.map((track) => track.videoViews || 0));
  const tourAttendance = total((state?.tourHistory || []).flatMap((tour) => (tour.stops || []).map((stop) => stop.attendance || 0)));
  const rivals = Object.values(state?.npcCareers || {});
  const rivalAudience = Math.max(1, ...rivals.map((artist) => artist.fans || 0));
  const rivalQuality = Math.max(1, ...rivals.map((artist) => artist.clout || 0));
  const rivalProjects = Math.max(1, ...rivals.map((artist) => artist.projects || 0));
  const strongestRival = (state?.npcCatalog || []).reduce((best, song) => !best || (song.peakStreams || 0) > (best.peakStreams || 0) ? song : best, null);
  const rivalSongScore = (strongestRival?.quality || rivalQuality) + logAudience(strongestRival?.peakStreams || rivalAudience) * 3;

  const rows = [
    {
      id: 'breakthrough', title: 'Breakthrough Artist',
      score: logAudience(state?.fans) * 14 + recentTracks.length * 4 + (state?.clout || 0) * 0.2,
      minimum: 58, rival: logAudience(rivalAudience) * 14 + 12,
      eligible: (state?.fans || 0) >= 5_000 && recentTracks.length > 0,
    },
    {
      id: 'song-of-year', title: 'Song of the Year',
      score: (bestSong?.quality || 0) + logAudience(bestSong?.lifetimeStreams) * 3,
      minimum: 64, rival: rivalSongScore,
      eligible: !!bestSong && (bestSong.lifetimeStreams || 0) >= 5_000,
      work: bestSong?.title || null,
    },
    {
      id: 'project-of-year', title: 'Project of the Year',
      score: (bestProject?.avgQuality || 0) + logAudience(bestProject?.streams) * 2 + (bestProject?.cohesion || 0) * 0.12,
      minimum: 66, rival: logAudience(rivalAudience) * 7 + rivalProjects * 4 + 42,
      eligible: !!bestProject && (bestProject.streams || 0) >= 15_000,
      work: bestProject?.title || null,
    },
    {
      id: 'video-of-year', title: 'Video of the Year',
      score: logAudience(videoViews) * 8 + (tracks.some((track) => (track.videoViews || 0) > 0) ? 50 : 0),
      minimum: 68, rival: logAudience(rivalAudience) * 6 + rivalQuality * 0.25 + 8,
      eligible: videoViews >= 20_000,
      work: bestSong?.title || null,
    },
    {
      id: 'live-act', title: 'Live Act of the Year',
      score: logAudience(tourAttendance) * 9 + (state?.lp || 0) * 0.25,
      minimum: 55, rival: logAudience(rivalAudience) * 8 + 8,
      eligible: tourAttendance >= 500,
    },
    {
      id: 'afrobeats-scene', title: 'Afrobeats Scene Award',
      score: logAudience(state?.fans) * 12 + (state?.genre === 'afrobeats' ? 25 : 0) + (['lagos', 'accra'].includes(state?.city) ? 18 : 0) + recentTracks.filter((track) => track.genre === 'afrobeats').length * 4,
      minimum: 58, rival: logAudience(rivalAudience) * 11 + 12,
      eligible: (state?.genre === 'afrobeats' || ['lagos', 'accra'].includes(state?.city)) && recentTracks.some((track) => track.genre === 'afrobeats'),
    },
  ];
  return rows.map((row) => ({ ...row, rival: Math.max(35, row.rival) }));
};

export const evaluateAwards = (state) => {
  const categories = getAwardCategories(state);
  const prior = new Set((state?.awards || []).map((award) => typeof award === 'string' ? award : award.id));
  return categories
    .filter((category) => category.eligible && category.score >= category.minimum && category.score >= category.rival * 0.72 && !prior.has(category.id))
    .map((category) => ({ id: category.id, title: category.title, work: category.work, week: state?.totalWeeks || 0, score: Math.round(category.score) }));
};
