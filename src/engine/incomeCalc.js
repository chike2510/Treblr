import { LABELS } from '../data/constants';
import { getCityDemand } from './cityScene';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const findProject = (state, track) => (state?.projects || []).find((project) => (project.trackIds || []).includes(track.id));

export const getTrackWeeklyStreams = (state, track) => {
  if (!track?.released || track.releaseWeek == null) return 0;
  const age = Math.max(0, (state?.totalWeeks || 0) - track.releaseWeek);
  if (age > 156) return 0;
  const decay = Math.max(0.02, 1 - age / 156);
  const cityDemand = clamp(getCityDemand(state?.city, track.genre || state?.genre), 0.75, 1.48);
  const label = LABELS.find((item) => item.id === state?.labelId) || LABELS[0];
  const labelReach = label.id === 'independent' ? 1 : 1 + Math.min(0.45, (label.marketingMult - 1) * 0.12);
  const rollout = track.rollout;
  const rolloutAge = (Number(state?.totalWeeks || 0)) - Number(rollout?.startWeek ?? track.releaseWeek);
  let rolloutLift = 1;
  if (rollout && rolloutAge >= 0 && rolloutAge < Number(rollout.weeks || 0)) {
    const strength = Math.max(0, 1 - rolloutAge / Math.max(1, rollout.weeks));
    rolloutLift = 1 + ((Number(rollout.streamLift) || 1) - 1) * strength;
  }
  const platformLift = Object.values(track.promoByPlatform || {})
    .filter((promo) => (promo.expiresAt ?? 0) >= (state?.totalWeeks || 0))
    .reduce((total, promo) => total * (Number(promo.multiplier) || 1), 1);
  const project = findProject(state, track);
  const cohesionLift = project ? 0.92 + Math.min(0.18, Number(project.cohesion || 50) / 600) : 1;
  const leadLift = project?.leadTrackId === track.id ? 1.12 : 1;
  const quality = Math.max(0, Number(track.quality || 0)) / 100;
  const audience = Math.sqrt(Math.max(1, Number(state?.fans || 0)));
  return Math.max(0, Math.round(quality * audience * 30 * decay * cityDemand * labelReach * rolloutLift * clamp(platformLift, 1, 2.2) * cohesionLift * leadLift));
};

export const calculateCatalogWeek = (state) => {
  const catalog = (state?.catalog || []).map((track) => {
    const weeklyStreams = getTrackWeeklyStreams(state, track);
    const age = Math.max(0, (state?.totalWeeks || 0) - (track.releaseWeek || 0));
    const launchSales = track.released && age <= 1
      ? Math.round(Math.max(1, Number(state?.fans || 0)) * (track.rollout?.id === 'global' ? 0.012 : track.rollout?.id === 'targeted' ? 0.006 : 0.002))
      : 0;
    const weeklySales = track.released ? Math.max(0, Math.round(weeklyStreams * 0.004 + launchSales)) : 0;
    const videoActive = Number(track.videoThroughWeek || 0) >= (state?.totalWeeks || 0);
    const weeklyVideoViews = videoActive ? Math.max(0, Math.round(weeklyStreams * (track.videoViral ? 0.75 : 0.28))) : 0;
    return {
      ...track,
      weeklyStreams,
      lifetimeStreams: Number(track.lifetimeStreams ?? track.streams ?? 0) + weeklyStreams,
      streams: Number(track.lifetimeStreams ?? track.streams ?? 0) + weeklyStreams,
      weeklySales,
      lifetimeSales: Number(track.lifetimeSales || 0) + weeklySales,
      weeklyVideoViews,
      videoViews: Number(track.videoViews || 0) + weeklyVideoViews,
    };
  });
  const projects = (state?.projects || []).map((project) => {
    const projectTracks = catalog.filter((track) => (project.trackIds || []).includes(track.id));
    const weeklyStreams = projectTracks.reduce((sum, track) => sum + (track.weeklyStreams || 0), 0);
    return { ...project, weeklyStreams, streams: Number(project.streams || 0) + weeklyStreams };
  });
  const weeklyStreams = catalog.reduce((sum, track) => sum + (track.weeklyStreams || 0), 0);
  const weeklySales = catalog.reduce((sum, track) => sum + (track.weeklySales || 0), 0);
  const weeklyVideoViews = catalog.reduce((sum, track) => sum + (track.weeklyVideoViews || 0), 0);
  return { catalog, projects, weeklyStreams, weeklySales, weeklyVideoViews };
};

export const calcWeeklyStreamIncome = (state) => Math.round(calculateCatalogWeek(state).weeklyStreams / 3);

export const artistShare = (rawIncome, label, state) => {
  if (!label || label.id === 'independent') return rawIncome;
  const artistSplit = Number(state?.contractSplit ?? label.artistSplit);
  return Math.round(rawIncome * artistSplit / 100);
};
