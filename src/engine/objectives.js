import { CITIES } from '../data/constants';

export const getNextObjective = (state) => {
  const catalog = state?.catalog || [];
  const released = catalog.filter((track) => track.released);
  const projects = state?.projects || [];
  const fans = state?.fans || 0;
  const cityName = CITIES.find((city) => city.id === state?.city)?.label || 'your city';
  const nextMilestone = [500, 5_000, 25_000, 100_000, 500_000, 2_000_000, 10_000_000].find((mark) => fans < mark);

  if (!catalog.length) return { title: 'Make your first record', detail: 'Record a track in Create, then build a release plan.', progress: 0, action: 'CREATE' };
  if (!released.length) return { title: 'Put your first song out', detail: 'Choose a rollout and release a track from your vault.', progress: 0.35, action: 'RELEASE' };
  if (state?.labelId !== 'independent' && (state?.contractWeeksLeft ?? 0) > 0) {
    const label = state.contractObligations || {};
    return { title: 'Keep your label deal on track', detail: `${state.contractWeeksLeft} weeks remain · ${label.singlesDue || 0} single(s) due this quarter and ${label.postsDue || 0} promo post(s) due this week.`, progress: Math.min(1, (state?.labelRel || 0) / 100), action: 'CONTRACT' };
  }
  if (released.length < 3) return { title: 'Build a three-song catalog', detail: `${released.length}/3 songs released · consistent drops keep listeners coming back.`, progress: released.length / 3, action: 'RECORD' };
  if (!(state?.collaborationCount || 0)) return { title: 'Build a local connection', detail: `Artists in ${cityName} respond to a strong first session.`, progress: 0.15, action: 'COLLAB' };
  if (!projects.length) return { title: 'Shape a cohesive project', detail: 'Sequence 4–6 tracks into an EP and give the lead single a rollout.', progress: Math.min(0.8, released.length / 8), action: 'PROJECT' };
  if (!(state?.tourHistory || []).length && fans >= 1_000) return { title: 'Take your sound on the road', detail: 'Book a home-city show; attendance and demand drive each week of the tour.', progress: Math.min(1, fans / 50_000), action: 'TOUR' };
  if (state?.ownLabel && !(state?.ownLabelCampaigns || []).length) return { title: 'Fund your first label campaign', detail: 'Choose a weekly budget and watch its spend, reach, and fan lift in your label ledger.', progress: 0.1, action: 'CAMPAIGN' };
  if (nextMilestone) return { title: `Reach ${nextMilestone.toLocaleString()} fans`, detail: 'A new audience tier unlocks stronger venues, deals, and collaborators.', progress: Math.max(0, Math.min(1, fans / nextMilestone)), action: 'GROW' };
  return { title: 'Build your legacy', detail: 'Keep releasing, touring, and earning the next industry award.', progress: 1, action: 'LEGACY' };
};
