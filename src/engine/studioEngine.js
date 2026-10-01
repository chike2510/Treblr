import { MASTER_OPTIONS, MIX_OPTIONS, PRODUCERS, ROLLOUT_PLANS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { spendActionPoints, canSpendActionPoint } from './actionPoints';
import { calcSongQuality } from './qualityCalc';
import { getCollaborationPrice, getProducerPrice, hasPremiumProducerAccess } from './careerPerks';
import { clamp, uid } from './utils';

const RECORD_ENERGY_COST = 25;
const moneyAfter = (money, cost) => clamp(Number(money || 0) - Number(cost || 0), 0, 999_000_000_000);
const addStudioNews = (news, msg, type, week) => [{ msg, type, week }, ...(Array.isArray(news) ? news : [])].slice(0, 100);

export const getStudioQuote = (gs, selection = {}) => {
  const producer = PRODUCERS.find((item) => item.id === selection.producerId) || PRODUCERS[0];
  const mix = MIX_OPTIONS.find((item) => item.id === selection.mixId) || MIX_OPTIONS[0];
  const master = MASTER_OPTIONS.find((item) => item.id === selection.masterId) || MASTER_OPTIONS[0];
  const featuredArtistIds = [...new Set((selection.featuredArtistIds || selection.featNpcs || []).filter((id) => NPC_ARTISTS.some((artist) => artist.id === id)))];
  const features = featuredArtistIds.map((id) => {
    const artist = NPC_ARTISTS.find((item) => item.id === id);
    return { id:artist.id, name:artist.name, cost:getCollaborationPrice(gs, artist.collabCost || 0, artist.id) };
  });
  const producerCost = getProducerPrice(gs, producer.cost);
  const credits = [
    { role:'Producer', id:producer.id, name:producer.name, cost:producerCost },
    ...features.map((artist) => ({ role:'Featured artist', id:artist.id, name:artist.name, cost:artist.cost })),
    { role:'Mix engineer', id:mix.id, name:mix.label, cost:mix.cost },
    { role:'Mastering', id:master.id, name:master.label, cost:master.cost },
  ];
  const cashCost = credits.reduce((sum, credit) => sum + credit.cost, 0);
  const quality = calcSongQuality(gs, producer.id, featuredArtistIds, { mixId:mix.id, masterId:master.id });
  return {
    producer, producerCost, features, featuredArtistIds, mix, master, credits, cashCost, quality,
    energyCost:RECORD_ENERGY_COST,
    actionPointCost:1,
    mixId:mix.id,
    masterId:master.id,
  };
};

export const recordTrack = (gs, selection = {}) => {
  const title = String(selection.title || '').trim();
  if (!title) return { ok:false, error:'Name your track before recording.' };
  const quote = getStudioQuote(gs, selection);
  if (gs.inPrison) return { ok:false, error:'You can only rest while in prison.' };
  if (quote.producer.minFans > Number(gs.fans || 0) && !hasPremiumProducerAccess(gs)) {
    return { ok:false, error:`Need ${quote.producer.minFans.toLocaleString()} fans for this producer.` };
  }
  if (Number(gs.money || 0) < quote.cashCost) return { ok:false, error:`Need more cash for the selected studio choices (${quote.cashCost.toLocaleString()} total).` };
  if (Number(gs.energy || 0) < quote.energyCost) return { ok:false, error:`Need ${quote.energyCost} energy to record.` };
  if (!canSpendActionPoint(gs)) return { ok:false, error:'No action points left this week.' };
  const acted = spendActionPoints(gs);
  if (!acted) return { ok:false, error:'No action points left this week.' };

  const id = selection.id || uid();
  const coverArt = selection.coverArt || `/assets/covers/cov_${String(Math.floor((gs.catalog || []).length / 9) + 1).padStart(2, '0')}_${String((gs.catalog || []).length % 9 + 1).padStart(2, '0')}.png`;
  const track = {
    id,
    title,
    genre:gs.genre,
    quality:quote.quality,
    producerId:quote.producer.id,
    featNpcs:[...quote.featuredArtistIds],
    mixId:quote.mixId,
    masterId:quote.masterId,
    production:{ credits:quote.credits.map((credit) => ({ ...credit })), cashSpent:quote.cashCost },
    coverArt,
    released:false,
    releaseWeek:null,
    chartPos:null,
    recordWeek:Number(gs.totalWeeks || 0),
    lifetimeStreams:0,
    videoViews:0,
  };
  const npcRelations = { ...(gs.npcRelations || {}) };
  quote.featuredArtistIds.forEach((npcId) => {
    const relation = Number(npcRelations[npcId]?.value ?? npcRelations[npcId] ?? 0);
    npcRelations[npcId] = {
      ...(typeof npcRelations[npcId] === 'object' ? npcRelations[npcId] : {}),
      value:clamp(relation + 8, 0, 100),
      collaborations:Number(npcRelations[npcId]?.collaborations || 0) + 1,
    };
  });
  const state = {
    ...acted,
    catalog:[...(gs.catalog || []), track],
    pendingFeatureRequest:null,
    npcRelations,
    collaborationCount:Number(gs.collaborationCount || 0) + quote.featuredArtistIds.length,
    money:moneyAfter(gs.money, quote.cashCost),
    energy:clamp(Number(gs.energy || 0) - quote.energyCost, 0, 100),
    news:addStudioNews(gs.news, `Recorded "${title}" · Quality ${quote.quality}/100`, 'pos', Number(gs.totalWeeks || 0)),
  };
  return { ok:true, state, track, quote };
};

export const releaseSingle = (gs, trackId, selectedPlan) => {
  const track = (gs.catalog || []).find((item) => item.id === trackId);
  if (!track || track.released) return { ok:false, error:'Select an unreleased track.' };
  const plan = ROLLOUT_PLANS.find((item) => item.id === selectedPlan?.id) || ROLLOUT_PLANS[0];
  const cooldown = Math.max(0, (Number(gs.lastReleaseWeek ?? -99) + 2) - Number(gs.totalWeeks || 0));
  if (cooldown > 0) return { ok:false, error:`Release cooldown: ${cooldown} week${cooldown === 1 ? '' : 's'} remaining.` };
  if (gs.inPrison) return { ok:false, error:'You can only rest while in prison.' };
  if (!canSpendActionPoint(gs)) return { ok:false, error:'No action points left this week.' };
  if (Number(gs.fans || 0) < plan.minFans) return { ok:false, error:`This rollout needs ${plan.minFans.toLocaleString()} fans.` };
  if (Number(gs.money || 0) < plan.cost) return { ok:false, error:`Need ${plan.cost.toLocaleString()} cash for this rollout.` };
  const acted = spendActionPoints(gs);
  if (!acted) return { ok:false, error:'No action points left this week.' };
  const state = {
    ...acted,
    catalog:(gs.catalog || []).map((item) => item.id === trackId
      ? { ...item, released:true, releaseType:'single', releaseWeek:Number(gs.totalWeeks || 0), rollout:{ ...plan, startWeek:Number(gs.totalWeeks || 0) } }
      : item),
    focusedTrackId:trackId,
    appRoutes:{ ...(gs.appRoutes || {}), music:'performance' },
    money:moneyAfter(gs.money, plan.cost),
    lastReleaseWeek:Number(gs.totalWeeks || 0),
    fans:clamp(Number(gs.fans || 0) + plan.fanLift + Math.round(Math.sqrt(Number(gs.fans || 0) || 1) * 0.5 + 50), 0, 999_000_000),
    clout:clamp(Number(gs.clout || 0) + 1, 0, 100),
    news:addStudioNews(gs.news, `Dropped "${track.title}" — the charts await.`, 'pos', Number(gs.totalWeeks || 0)),
  };
  return { ok:true, state, track:state.catalog.find((item) => item.id === trackId), plan };
};
