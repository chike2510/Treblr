import { CAREER_TYPES } from '../data/constants';

export const getCareer = (state) => CAREER_TYPES.find((career) => career.id === state?.careerType) || null;
export const hasPremiumProducerAccess = (state) => state?.careerType === 'rich_kid';
export const getProducerPrice = (state, basePrice) => Math.round(basePrice * (state?.careerType === 'producer_artist' ? 0.7 : 1));
export const getCollaborationPrice = (state, basePrice, npcId) => {
  const relationship = Number(state?.npcRelations?.[npcId]?.value ?? state?.npcRelations?.[npcId] ?? 0);
  const careerDiscount = state?.careerType === 'fallen_star' ? 0.8 : 1;
  const trustDiscount = Math.min(0.25, Math.max(0, relationship) * 0.0025);
  return Math.round(basePrice * careerDiscount * (1 - trustDiscount));
};
export const getJobPay = (state, weeklyPay) => Math.round(weeklyPay * (state?.careerType === 'broke_underground' ? 1.4 : 1));
export const getSocialReachMultiplier = (state) => state?.careerType === 'social_media' ? 3 : 1;
export const getWeeklySocialEnergy = (state) => Math.max(1, Number(state?.maxSe || 7), state?.careerType === 'social_media' ? 10 : 0);
export const getCreativeControlMultiplier = (state) => {
  const label = state?.labelId && state.labelId !== 'independent'
    ? (state.creativeControl ?? 100)
    : 100;
  return 0.78 + Math.max(0, Math.min(100, label)) * 0.0022;
};
