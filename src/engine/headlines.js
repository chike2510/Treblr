// Varied headline templates per event type. A template is not reused within 4 weeks.
const T = {
  no1: ['{name} Hits #1 on the {chart}', '{name} Takes the Crown: “{title}” Is #1', 'Number One! “{title}” Tops the {chart}', 'The Summit: {name} Reaches #1', '“{title}” Climbs All the Way to #1', '{name} Owns the {chart} This Week', 'All Hail “{title}”: #1 on the {chart}', 'History Made: {name} Scores a #1'],
  debutTop10: ['“{title}” Crashes the {chart} at #{rank}', 'Top 10 Debut: {name} Arrives at #{rank}', '{name} Lands Straight Into the Top 10', '“{title}” Opens at #{rank}. Nobody Saw It Coming', 'Instant Smash: “{title}” Debuts at #{rank}'],
  debut: ['“{title}” Debuts at #{rank} on the {chart}', '{name} Cracks the {chart} at #{rank}', 'New Entry: “{title}” Sneaks In at #{rank}', 'On the Board: {name} Enters the {chart}', '“{title}” Gets Its Foot in the Door at #{rank}', '{name} Is Officially Charting', 'The {chart} Has a New Name: {name}', 'Chart Watch: “{title}” Bows at #{rank}', '{name} Joins the {chart} Conversation', 'Slow Burn Pays Off: “{title}” Enters at #{rank}'],
  top10: ['“{title}” Breaks Into the {chart} Top 10', '{name} Storms the Top 10', 'Top 10 Alert: “{title}” Climbs to #{rank}', '“{title}” Keeps Rising: Now #{rank}', '{name} Enters Rarefied Air at #{rank}'],
  climb: ['“{title}” Climbs to #{rank} on the {chart}', 'Momentum: {name} Rises to #{rank}', '“{title}” Refuses to Slow Down', '{name} Moves Up the {chart}'],
  release: ['{name} Drops “{title}”', 'Out Now: “{title}” by {name}', '“{title}” Is Here and Fans Are Talking', '{name} Opens a New Chapter With “{title}”', 'First Listen: {name}\u2019s “{title}”', 'The Wait Is Over: “{title}” Arrives', '{name} Surprises Fans With “{title}”', 'New Music Friday Belongs to {name}'],
  album: ['{name} Unveils the {kind} “{title}”', 'Track by Track: Inside {name}\u2019s “{title}”', '“{title}”: {name}\u2019s Most Ambitious Project Yet', 'The {kind} Is Out: {name} Delivers “{title}”'],
  viral: ['“{title}” Goes Viral on TreblrTok', 'Everyone Is Dancing to “{title}”', '{name} Breaks the Algorithm', 'TreblrTok Can\u2019t Stop Playing “{title}”', 'From Snippet to Phenomenon: “{title}”', 'The Sound of the Week Is “{title}”'],
  sellout: ['{name} Sells Out the {venue}', 'Standing Room Only for {name} in {city}', '{city} Turns Out for {name}', 'Sold Out: {name} Packs the {venue}', 'Tickets Gone in Minutes: {name} in {city}'],
  cert: ['“{title}” Goes {cert}', 'Certified {cert}: {name}\u2019s “{title}”', '{name} Earns a {cert} Plaque', '“{title}” Joins the {cert} Club'],
  award: ['{name} Wins {award} at the {show}', 'Trophy Night: {name} Takes {award}', '{name} Walks Away With {award}', 'The {show} Crowns {name}'],
  snub: ['Snubbed at the {show}', '{name} Goes Home Empty-Handed at the {show}', 'Nominated, Not Rewarded: {name} at the {show}', 'Next Year? {name} Misses Out at the {show}'],
  scandal: ['Scandal Rocks {name}', '{name} Under Fire', 'PR Nightmare for {name}', 'The Internet Turns on {name}', '{name} Faces Backlash'],
  beef: ['{rival} vs {name}: The Feud Heats Up', '{name} Fires Back at {rival}', 'Diss Track Alert: {name} Takes Aim at {rival}', 'Is This the Beef of the Year? {name} and {rival}'],
  collab: ['{name} and {rival} Join Forces', 'Dream Collab: {name} x {rival}', '{rival} Hops on a {name} Track', 'Crossover Event: {name} Teams Up With {rival}'],
  tour: ['{name} Takes the Show on the Road', 'Tour Diary: {name} in {city}', 'On Tour: {name} Rolls Into {city}', '{name}\u2019s Tour Hits {city}'],
  dating: ['{name} Spotted Out With {partner}', 'New Couple Alert? {name} and {partner}', '{name} Goes Public With {partner}', 'Love Is in the Air for {name}'],
  breakup: ['{name} and {partner} Call It Quits', 'Heartbreak for {name}', 'It\u2019s Over: {name} and {partner} Split'],
  live: ['{name}\u2019s Livestream Becomes a Moment', 'Clipped and Shared: {name} Goes LIVE', 'Chat Went Wild During {name}\u2019s Stream'],
  goal: ['{name} Unlocks “{title}”', 'Milestone: {name} Hits “{title}”', 'Another One: {name} Achieves “{title}”'],
  streams: ['{name} Racks Up {n} Streams', 'Inside {name}\u2019s Steady Climb', '{name}: The Grind Continues', 'The Numbers Don\u2019t Lie: {n} Streams for {name}', 'Quietly Building: {name} at {n} Streams', '{name} Keeps the Catalogue Moving', 'Streams Report: {name} Pulls {n}'],
  quiet: ['{name} Is Cooking Something Up', 'Who Is {name}?', '{name} Hits the Studio', 'The Quiet Before the Noise', 'Notes From the Underground: {name}', 'Coming Soon: {name}', '{name} Keeps Their Head Down', 'Demo Season for {name}'],
  event: ['{text}'],
};

export const HEADLINE_POOLS = T;

function fill(t, v) { return t.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? String(v[k]) : '')); }

export function pickHeadline(s, rng, kind, vars) {
  const pool = T[kind] || T.event;
  s.headlineLog = (s.headlineLog || []).filter((h) => s.week - h.w < 4);
  const used = new Set(s.headlineLog.filter((h) => h.kind === kind).map((h) => h.i));
  const free = pool.map((_, i) => i).filter((i) => !used.has(i));
  const i = free.length ? rng.pick(free) : rng.int(0, pool.length - 1);
  s.headlineLog.push({ kind, i, w: s.week });
  return fill(pool[i], vars);
}

export function renderHeadline(rng, kind, vars) {
  const pool = T[kind] || T.event;
  return fill(rng.pick(pool), vars);
}
