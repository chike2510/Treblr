import { LABELS } from '../data/constants';

export const calcWeeklyStreamIncome = (gs) => {
  if (!gs.catalog) return 0;
  const label = LABELS.find(l => l.id === gs.labelId) || LABELS[0];
  let total = 0;
  const released = gs.catalog.filter(t => t.released && t.releaseWeek != null);
  for (const track of released) {
    const weeksOut = gs.totalWeeks - track.releaseWeek;
    if (weeksOut > 156) continue;
    const decay = Math.max(0.015, 1 - weeksOut / 156);
    const base = (track.quality / 100) * Math.sqrt(gs.fans || 1) * 10;
    const labelMult = label.id !== 'independent' ? label.marketingMult : 1.0;
    const ownLabelMult = (gs.ownLabel && gs.labelId === 'independent') ? (1 + (gs.ownLabel.budget || 0) / 10000000) : 1.0;
    total += Math.round(base * decay * labelMult * ownLabelMult);
  }
  return total;
};

export const artistShare = (rawIncome, label) => {
  if (!label || label.id === 'independent') return rawIncome;
  return Math.round(rawIncome * label.artistSplit / 100);
};
