import { PRODUCERS } from '../data/constants';
import { NPC_ARTISTS } from '../data/artists';

// Skills are now 0–100 each. Max base contribution = 55 (leaves room for producer/features).
export const calcSongQuality = (gs, producerId, featuredNpcIds = []) => {
  const sw = gs.sw || 0;
  const vc = gs.vc || 0;
  const pd = gs.pd || 0;
  const lp = gs.lp || 0;

  // Weighted skill contribution, capped at 55
  const base = sw * 0.35 + vc * 0.30 + pd * 0.25 + lp * 0.10;  // max 100
  const baseQ = (base / 100) * 55;  // scaled to 0–55

  const producer = PRODUCERS.find(p => p.id === producerId) || PRODUCERS[0];
  const prodBonus = producer.qBonus; // 0–35

  // Genre mastery bonus capped at 10
  const genreSpecBonus = Math.min(10, ((gs.genreBonus || {})[gs.genre] || 0) * 0.2);

  // Feature bonus: each featured NPC contributes based on talent/25 * 6
  const featBonus = featuredNpcIds.reduce((acc, npcId) => {
    const npc = NPC_ARTISTS.find(n => n.id === npcId);
    return acc + (npc ? (npc.talent / 25) * 6 : 0);
  }, 0);

  // Energy debuff
  const energyMult = gs.energy < 20 ? 0.70 : gs.energy < 40 ? 0.85 : 1.0;

  return Math.min(99, Math.round((baseQ + prodBonus + genreSpecBonus + featBonus) * energyMult));
};
