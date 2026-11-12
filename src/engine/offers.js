import { staffSalaries } from './goals.js';
import { hypeDecay } from './model.js';

// Constants mirrored from the engine (tick.js / actions.js / systems.js / business.js).
export const MANAGER_COMMISSION = 0.1; // of all income except advances, loans, rewards
export const MANAGER_STREAM_BONUS = 1.1; // streaming royalties x1.1 (before label split)
export const MANAGER_OFFER_BOOST = 1.2; // brand/feature chance AND brand fee x1.2
export const BOOKING_COMMISSION = 0.1; // of gig income (all of it, incl. festival fees)
export const BOOKING_PAY_BONUS = 1.2; // ticketed shows + venue offers
export const BOOKING_OFFER_CHANCE = [0.3, 0.55]; // weekly gig offer chance without / with

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const sgn = (n) => `${n >= 0 ? '+' : '-'}${usd(Math.abs(n))}`;

export function recentAvg(state, key, weeks = 8) {
  const h = (state.history || []).slice(-weeks);
  if (!h.length) return null;
  return h.reduce((a, r) => a + ((r.income && r.income[key]) || 0), 0) / h.length;
}

export function staffOffers(state) {
  const sal = staffSalaries(state);
  const st = state.player.staff || {};
  const hype = Math.round(state.player.hype || 0);
  const out = {};

  // Manager: per $1,000 maths. Streams: 1.1x royalties, then 10% commission on the lot.
  const streamNet = 1000 * MANAGER_STREAM_BONUS * (1 - MANAGER_COMMISSION) - 1000;
  const otherNet = -1000 * MANAGER_COMMISSION;
  const brandMult = MANAGER_OFFER_BOOST * MANAGER_OFFER_BOOST * (1 - MANAGER_COMMISSION);
  const brandNet = 1000 * brandMult - 1000;
  out.manager = {
    salary: sal.manager,
    lines: [
      `Salary ${usd(sal.manager)}/wk, paid every week.`,
      `Cut: ${MANAGER_COMMISSION * 100}% of ALL income (streams, gigs, brand deals, merch, sales), not just what he brings in.`,
      `Streams: +10% royalties, then the 10% cut. Net ${sgn(streamNet)} per $1,000 of streams. His cut eats the bonus.`,
      `Gigs and other income: no bonus, net ${sgn(otherNet)} per $1,000.`,
      `Brand deals: offers come 20% more often and pay 20% more, minus the 10% cut. Net ${sgn(brandNet)} per $1,000 of brand income you would get without him.`,
    ],
    breakEven: `Weekly net = ${usd(brandNet)} per $1,000 of brand income, ${sgn(streamNet)} per $1,000 of streams, ${sgn(otherNet)} per $1,000 of other income, minus ${usd(sal.manager)} salary. Brand income alone would need about ${usd(sal.manager / (brandNet / 1000))}/wk (without him) to cover the salary, and streams and gigs pull that figure higher.`,
    verdict: 'Mostly a brand-deal hire. On streams alone it never pays for itself.',
  };

  // Booking agent.
  const showNet = 1000 * BOOKING_PAY_BONUS * (1 - BOOKING_COMMISSION) - 1000;
  const offerMult = (BOOKING_OFFER_CHANCE[1] / BOOKING_OFFER_CHANCE[0]) * BOOKING_PAY_BONUS * (1 - BOOKING_COMMISSION);
  const offerNet = 1000 * offerMult - 1000;
  const gigsAvg = recentAvg(state, 'gigs');
  const gigBase = gigsAvg == null ? null : st.booking ? gigsAvg / BOOKING_PAY_BONUS : gigsAvg;
  out.booking = {
    salary: sal.booking,
    lines: [
      `Salary ${usd(sal.booking)}/wk, paid every week.`,
      `Cut: ${BOOKING_COMMISSION * 100}% of gig income only (shows, tours, venue offers and festival fees).`,
      `Ticketed shows and venue offers pay +20%. Net ${sgn(showNet)} per $1,000 of gig pay.`,
      `Festival fees get no bonus, so net ${sgn(-100)} per $1,000.`,
      `Weekly venue offer chance rises from ${Math.round(BOOKING_OFFER_CHANCE[0] * 100)}% to ${Math.round(BOOKING_OFFER_CHANCE[1] * 100)}%, and festival slot chance +15 points. Expected venue-offer income net ${sgn(offerNet)} per $1,000.`,
    ],
    breakEven: `On shows you already have, you need about ${usd(sal.booking / (showNet / 1000))}/wk of gig pay for the +8% to cover the salary. Extra offers lower that.`,
    recent: gigBase == null ? 'No weekly history yet, so no personal estimate.' : `Your last ${Math.min(8, state.history.length)} weeks averaged ${usd(gigBase)}/wk of gig income (before agent effects). With him that is about ${sgn(gigBase * showNet / 1000 - sal.booking)}/wk after salary, ignoring extra offers.`,
    verdict: 'Pays off once you gig heavily. Light gig weeks lose money.',
  };

  // Publicist: exact engine effects.
  const dec = (h, p) => h - hypeDecay(h, p);
  out.publicist = {
    salary: sal.publicist,
    lines: [
      `Salary ${usd(sal.publicist)}/wk. No percentage cut.`,
      `Hype decay is 25% slower. At your hype of ${hype} you lose ${dec(hype, false).toFixed(1)} per week without him, ${dec(hype, true).toFixed(1)} with him: ${(dec(hype, false) - dec(hype, true)).toFixed(1)} hype kept per week.`,
      `At hype 50 that is 2.8 saved per week, at hype 100 it is 8.8.`,
      `Press, radio and podcast cost 30% less energy: press 15 to 11, radio 20 to 14, podcast 10 to 7.`,
      `Crisis PR is free and works 90% of the time. Without him a freelance publicist costs $2,500 and works 65%.`,
    ],
    breakEven: 'Hype has no fixed dollar value in the game (it boosts streams and offers), so there is no exact cash break-even. One avoided freelance crisis fix is worth 2.5 weeks of salary.',
    verdict: 'Cash cost only. Worth it if you keep hype high or run press often.',
  };
  return out;
}
