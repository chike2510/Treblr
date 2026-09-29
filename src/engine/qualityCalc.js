import { PRODUCERS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';
import { getCityCollaboratorAffinity } from './cityScene';
import { getCreativeControlMultiplier } from './careerPerks';

// Skill-weighted base contribution leaves headroom for production, genre, and feature bonuses.
export const calcSongQuality = (gs, producerId, featuredNpcIds = []) => {
  const sw = gs.sw || 0;
  const vc = gs.vc || 0;
  const pd = gs.pd || 0;
  const lp = gs.lp || 0;
  const base = sw * 0.35 + vc * 0.30 + pd * 0.25 + lp * 0.10;
  const baseQ = (base / 100) * 55;
  const producer = PRODUCERS.find((item) => item.id === producerId) || PRODUCERS[0];
  const genreSpecBonus = Math.min(10, ((gs.genreBonus || {})[gs.genre] || 0) * 0.2);
  const featureBonus = featuredNpcIds.reduce((sum, npcId) => {
    const artist = NPC_ARTISTS.find((item) => item.id === npcId);
    if (!artist) return sum;
    const relation = Number(gs.npcRelations?.[npcId]?.value ?? gs.npcRelations?.[npcId] ?? 0);
    const trust = Math.max(0, Math.min(12, relation * 0.12));
    const scene = (getCityCollaboratorAffinity(gs.city, npcId) - 0.88) * 5;
    return sum + (artist.talent / 25) * 6 + trust + scene;
  }, 0);
  const energyMult = gs.energy < 20 ? 0.7 : gs.energy < 40 ? 0.85 : 1;
  const controlMult = getCreativeControlMultiplier(gs);
  return Math.min(99, Math.round((baseQ + producer.qBonus + genreSpecBonus + featureBonus) * energyMult * controlMult));
};
