import { PRODUCERS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';

export const calcSongQuality = (gs, producerId, featuredNpcIds = []) => {
  const base = gs.sw * 0.35 + gs.vc * 0.30 + gs.pd * 0.25 + gs.lp * 0.10;
  const baseQ = base * 4; // 0-100

  const producer = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const prodBonus = producer.qBonus;

  const genreSpecBonus = Math.min(15, ((gs.genreBonus || {})[gs.genre] || 0) * 0.4);

  const featBonus = featuredNpcIds.reduce((acc, npcId) => {
    const npc = NPC_ARTISTS.find(n => n.id === npcId);
    return acc + (npc ? (npc.talent / 25) * 8 : 0);
  }, 0);

  // Energy debuff: recording when low energy reduces quality
  const energyMult = gs.energy < 20 ? 0.7 : gs.energy < 40 ? 0.85 : 1.0;

  return Math.min(99, Math.round((baseQ + prodBonus + genreSpecBonus + featBonus) * energyMult));
};
