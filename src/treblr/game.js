export const SAVE_KEY = 'treblr-career-v1';

export const RELEASE_FORMATS = {
  Single: { cost: 0, delay: 1, multiplier: 1, tracks: 'one focus track' },
  EP: { cost: 45000, delay: 2, multiplier: 2.2, tracks: 'four-track package' },
  Album: { cost: 115000, delay: 4, multiplier: 3.5, tracks: 'nine-track album' },
};

export const INITIAL_STATE = {
  version: 1,
  week: 38,
  year: 2026,
  player: {
    name: 'Mira Ayo',
    moniker: 'MIRA AYO',
    genre: 'Alternative R&B',
    city: 'Lagos',
    country: 'Nigeria',
    stage: 'Independent / emerging',
    bio: 'Soft edges, hard truths. Lagos-born songs for the long ride home.',
    cash: 1480000,
    fans: 12840,
    listeners: 38500,
    reputation: 34,
    energy: 71,
    rank: 94,
  },
  releases: [
    { id: 'after-hours', title: 'After Hours', type: 'Single', status: 'Released', genre: 'Alt R&B', date: '28 Sep 2026', streams: 32400, revenue: 82500, trend: 18, cover: '/assets/treblr/covers/after-hours.jpg', quality: 78, collaborators: ['Ari Madu'], playlist: 'Nocturne Weekly', campaign: null, releaseWeek: 37, color: 'moss' },
    { id: 'salt-wires', title: 'Salt in the Wires', type: 'EP', status: 'In progress', genre: 'Alt R&B / Soul', date: 'Target · Week 42', streams: 0, revenue: 0, trend: 0, cover: '/assets/treblr/covers/red-earth.jpg', quality: 72, collaborators: ['Ari Madu', 'Kweku North'], playlist: '—', campaign: null, tracklist: ['Mile Marker', 'Salt in the Wires', 'Halfway Home'], readiness: 67, color: 'clay' },
    { id: 'soft-static', title: 'Soft Static', type: 'Single', status: 'Unreleased', genre: 'Left-field soul', date: 'Demo · Week 35', streams: 0, revenue: 0, trend: 0, cover: '/assets/treblr/covers/soft-static.jpg', quality: 61, collaborators: ['Juno Ash'], playlist: '—', campaign: null, color: 'violet' },
    { id: 'blue-hour', title: 'Blue Hour (Live at Skylark)', type: 'Live EP', status: 'Released', genre: 'Soul / Live', date: '12 Aug 2026', streams: 118600, revenue: 213400, trend: 4, cover: '/assets/treblr/covers/blue-hour.jpg', quality: 84, collaborators: ['Skylark House Band'], playlist: 'After Dark: Live', campaign: null, releaseWeek: 31, color: 'blue' },
    { id: 'no-fixed-address', title: 'No Fixed Address', type: 'Album', status: 'Unreleased', genre: 'Alt R&B', date: 'Archive · Week 30', streams: 0, revenue: 0, trend: 0, cover: '/assets/treblr/covers/no-fixed-address.jpg', quality: 48, collaborators: [], playlist: '—', campaign: null, color: 'ink' },
  ],
  opportunities: [
    { id: 'canopy-accra', type: 'show', title: 'A late set at The Canopy', place: 'Accra, Ghana', venue: 'The Canopy Room', date: 'Next week · Fri', offer: '₦180k guarantee', cost: 68000, payout: 180000, audience: '120–180 heads', risk: 'Travel eats the margin; the room books tastemakers.', detail: 'A 35-minute support slot for Ghanaian alt-soul duo Kofi & The Weather. Their crowd overlaps with your new listeners.', expiresWeek: 39, status: 'Open' },
    { id: 'northline', type: 'label', title: 'Northline want a first conversation', place: 'London, UK', venue: 'Northline / distro', date: 'Reply by Week 40', offer: '₦420k advance', cost: 0, advance: 420000, audience: 'EU distribution + press intro', risk: '20% of master net for 3 years; no creative veto.', detail: 'A small independent imprint offers a one-project license, not a 360 deal. The advance is recoupable from master income.', expiresWeek: 40, status: 'Open' },
    { id: 'atlanta-collab', type: 'collab', title: 'A verse from June Saint', place: 'Atlanta, USA', venue: 'Remote collaboration', date: 'Window closes Week 41', offer: 'Reach + cross-scene credit', cost: 54000, audience: 'Atlanta / diaspora listeners', risk: 'Split master 50/50; recording window is tight.', detail: 'June has a warm Atlanta following and a half-finished record that fits your sound. You cover the mix and split the master.', expiresWeek: 41, status: 'Open' },
    { id: 'toronto-radio', type: 'radio', title: 'Diaspora Radio — guest selector', place: 'Toronto, Canada', venue: 'Night Shift FM', date: 'Week 41 · live stream', offer: 'Press + 900–1.4k new listeners', cost: 32000, audience: 'Toronto / Accra diaspora', risk: 'Small fee, uncertain conversion.', detail: 'A 20-minute conversation and a guest mix. No exclusivity; you choose from released records.', expiresWeek: 41, status: 'Open' },
    { id: 'blue-line-tour', type: 'tour', title: 'The Blue Line — three-room run', place: 'Accra · London · Toronto', venue: 'Nightline Rooms', date: 'Reply by Week 40', offer: '₦660k across three dates', cost: 210000, audience: 'Three new city scenes', risk: 'Three travel legs, four weeks of recovery, no guaranteed sellout.', detail: 'A promoter will hold three small rooms if you cover travel now. Each guarantee settles after its show; the route starts next week.', expiresWeek: 40, stops: [{ venue: 'The Canopy Room', place: 'Accra, Ghana', weekOffset: 1, payout: 180000 }, { venue: 'Paper Lantern', place: 'London, UK', weekOffset: 2, payout: 210000 }, { venue: 'The Low Door', place: 'Toronto, Canada', weekOffset: 3, payout: 270000 }], status: 'Open' },
    { id: 'riverlight-festival', type: 'festival', title: 'Riverlight — sunset stage', place: 'Accra, Ghana', venue: 'Riverlight Weekender', date: 'Festival week · 40', offer: '₦290k guarantee + new ears', cost: 145000, payout: 290000, weekOffset: 2, audience: '1.2k festival crowd', risk: 'Advance covers travel; a short set means no headline control.', detail: 'A 25-minute sunset slot on a cross-border bill. The guarantee settles after the festival; energy is spent before the long return trip.', expiresWeek: 40, status: 'Open' },
  ],
  bookings: [],
  labelDeal: null,
  relationships: [
    { name: 'Ari Madu', role: 'Producer · trusted collaborator', city: 'Lagos', warmth: 78 },
    { name: 'Kweku North', role: 'Artist · open studio invite', city: 'Accra', warmth: 55 },
    { name: 'June Saint', role: 'Artist · mutuals in Atlanta', city: 'Atlanta', warmth: 42 },
  ],
  team: [
    { initials: 'AM', name: 'Ari Madu', role: 'Producer / co-writer', city: 'Lagos' },
    { initials: 'TO', name: 'Tola Okafor', role: 'Day-to-day manager', city: 'Lagos' },
    { initials: '—', name: 'Open seat', role: 'Publicist · not hired', city: 'Remote' },
  ],
  activity: [
    { week: 38, tag: 'RADIO', text: '“After Hours” added to Nocturne Weekly. Your late-night saves are up.' },
    { week: 38, tag: 'BOOKING', text: 'The Canopy Room in Accra sent a support-slot offer.' },
    { week: 37, tag: 'RELEASE', text: '“After Hours” landed. 6,240 streams in its first full week.' },
    { week: 37, tag: 'PEOPLE', text: 'Ari Madu wants to finish the Salt in the Wires sessions.' },
  ],
  worldSeed: 38,
  achievements: ['First 10k fans', 'One release independently delivered'],
  notifications: { bookings: true, press: true, release: true },
  weeklyHistory: [{ week: 37, streams: 6240, income: 18400, fans: 412 }],
  lastReport: null,
};

export function createInitialState() {
  return structuredClone(INITIAL_STATE);
}

export function readSavedCareer(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw);
    if (saved?.version !== INITIAL_STATE.version || !saved?.player || !Array.isArray(saved.releases)) return createInitialState();
    return { ...createInitialState(), ...saved, player: { ...INITIAL_STATE.player, ...saved.player } };
  } catch {
    return createInitialState();
  }
}

export function persistCareer(state, storage = globalThis.localStorage) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

const appendActivity = (state, item) => [{ week: state.week, ...item }, ...state.activity].slice(0, 14);
const cap = (number, min, max) => Math.max(min, Math.min(max, number));

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SESSION': {
      const { session } = action;
      if (!session || state.player.cash < session.cost) return state;
      const title = session.title;
      const id = `session-${state.week}-${state.releases.length}`;
      const release = { id, title, type: 'Single', status: 'In progress', genre: session.genre, date: `Session · Week ${state.week}`, streams: 0, revenue: 0, trend: 0, cover: session.cover, quality: session.quality, collaborators: [session.producer], playlist: '—', campaign: null, color: session.color };
      return {
        ...state,
        player: { ...state.player, cash: state.player.cash - session.cost, energy: cap(state.player.energy - session.energy, 0, 100), reputation: cap(state.player.reputation + (session.reputation || 0), 0, 100) },
        releases: [release, ...state.releases],
        activity: appendActivity(state, { tag: 'SESSION', text: `${session.room} wrapped. “${title}” is ready for release planning.` }),
      };
    }
    case 'CAMPAIGN': {
      const release = state.releases.find(item => item.id === action.releaseId);
      const plan = action.plan;
      if (!release || !plan || state.player.cash < plan.cost) return state;
      const format = plan.format || release.type || 'Single';
      const formatChoice = RELEASE_FORMATS[format] || RELEASE_FORMATS.Single;
      const formatCost = Number(plan.formatCost) || 0;
      const releaseWeek = release.status === 'Released' ? release.releaseWeek : state.week + formatChoice.delay;
      const projectTracks = format === 'Album'
        ? [release.title, 'Last Bus Home', 'Rain on the East Line', 'Mile Marker', 'A Map Folded Twice', 'Salt in the Wires', 'Leave a Light On', 'Halfway Home', 'Morning Platform']
        : format === 'EP'
          ? [release.title, 'Mile Marker', 'Salt in the Wires', 'Halfway Home']
          : release.tracklist;
      return {
        ...state,
        player: { ...state.player, cash: state.player.cash - plan.cost, energy: cap(state.player.energy - (plan.energy || 0), 0, 100) },
        releases: state.releases.map(item => item.id === release.id ? { ...item, type: release.status === 'Released' ? release.type : format, formatMultiplier: formatChoice.multiplier, date: release.status === 'Released' ? item.date : `${format} · Week ${releaseWeek}`, status: item.status === 'Released' ? 'Released' : 'Scheduled', releaseWeek, tracklist: projectTracks, readiness: format === 'Single' ? 100 : Math.max(item.readiness || 67, format === 'Album' ? 82 : 74), campaign: { ...plan, format, formatCost, remaining: plan.duration, boost: plan.boost } } : item),
        activity: appendActivity(state, { tag: 'CAMPAIGN', text: `${plan.name} booked for “${release.title}”. ${release.status === 'Released' ? 'The audience push starts now.' : `${format} locked for Week ${releaseWeek}; the format fee is ${formatCost ? `₦${formatCost.toLocaleString()}` : '₦0'}.`}` }),
      };
    }
    case 'OPPORTUNITY': {
      const opportunity = state.opportunities.find(item => item.id === action.id);
      if (!opportunity || opportunity.status !== 'Open') return state;
      if (action.accept && state.player.cash < opportunity.cost) return state;
      let player = { ...state.player };
      let bookings = state.bookings;
      let labelDeal = state.labelDeal;
      let relationships = state.relationships;
      let text;
      if (action.accept) {
        player.cash -= opportunity.cost;
        if (opportunity.type === 'show') {
          player.energy = cap(player.energy - 12, 0, 100);
          bookings = [...bookings, { id: opportunity.id, title: opportunity.title, venue: opportunity.venue, place: opportunity.place, week: state.week + 1, payout: opportunity.payout, cost: opportunity.cost, status: 'Confirmed' }];
          text = `You accepted the ${opportunity.venue} slot. Travel is paid; the guarantee lands after the show.`;
        } else if (opportunity.type === 'tour') {
          player.energy = cap(player.energy - 26, 0, 100);
          bookings = [...bookings, ...opportunity.stops.map((stop, index) => ({ id: `${opportunity.id}-${index + 1}`, title: opportunity.title, venue: stop.venue, place: stop.place, week: state.week + stop.weekOffset, payout: stop.payout, cost: 0, kind: 'tour', status: 'Confirmed' }))];
          text = `You bought the three-city route. Accra, London and Toronto now have dates; each room pays after the set.`;
        } else if (opportunity.type === 'festival') {
          player.energy = cap(player.energy - 16, 0, 100);
          bookings = [...bookings, { id: opportunity.id, title: opportunity.title, venue: opportunity.venue, place: opportunity.place, week: state.week + opportunity.weekOffset, payout: opportunity.payout, cost: opportunity.cost, kind: 'festival', status: 'Confirmed' }];
          text = `You accepted Riverlight's sunset stage. The travel spend is committed; the festival guarantee settles after the set.`;
        } else if (opportunity.type === 'label') {
          player.cash += opportunity.advance;
          player.reputation = cap(player.reputation + 5, 0, 100);
          labelDeal = { partner: 'Northline', share: '20% of master net', term: '3 years · one project', advance: opportunity.advance };
          text = `Northline's one-project license is signed. The advance is in; masters stay yours.`;
        } else if (opportunity.type === 'collab') {
          player.reputation = cap(player.reputation + 2, 0, 100);
          relationships = relationships.map(person => person.name === 'June Saint' ? { ...person, warmth: cap(person.warmth + 16, 0, 100), role: 'Artist · active collaboration' } : person);
          text = 'You committed the mix budget and a 50/50 master split with June Saint.';
        } else if (opportunity.type === 'social') {
          player.listeners += opportunity.listenerGain || 1200;
          player.fans += opportunity.fanGain || 240;
          player.reputation = cap(player.reputation + 1, 0, 100);
          text = `You funded ${opportunity.venue}. The clip found ${opportunity.listenerGain || 1200} new listeners without buying an endorsement.`;
        } else {
          player.reputation = cap(player.reputation + 1, 0, 100);
          text = 'You booked the Night Shift FM guest-selector slot. The conversation is next week.';
        }
      } else {
        text = `You passed on “${opportunity.title}”. No money moved; another route may still open later.`;
      }
      return {
        ...state,
        player,
        bookings,
        labelDeal,
        relationships,
        opportunities: state.opportunities.map(item => item.id === opportunity.id ? { ...item, status: action.accept ? 'Accepted' : 'Passed' } : item),
        activity: appendActivity(state, { tag: action.accept ? 'DECISION' : 'PASSED', text }),
      };
    }
    case 'WEEK': {
      const closingWeek = state.week;
      let streams = 0;
      let income = 0;
      let fans = 0;
      const releases = state.releases.map(release => {
        const unlocked = release.status === 'Scheduled' && release.releaseWeek <= closingWeek;
        const active = release.status === 'Released' || unlocked;
        if (!active) return unlocked ? { ...release, status: 'Released' } : release;
        const campaignBoost = release.campaign?.remaining > 0 ? release.campaign.boost : 0;
        const base = release.streams === 0 ? 1100 : Math.max(220, Math.round(release.streams * (0.085 + ((closingWeek + release.id.length) % 5) * 0.011)));
        const formatLift = release.formatMultiplier || RELEASE_FORMATS[release.type]?.multiplier || 1;
        const growth = Math.round(base * (1 + campaignBoost) * formatLift);
        const earned = Math.round(growth * (state.labelDeal ? 0.54 : 0.67));
        const newFans = Math.max(8, Math.round(growth * (0.028 + (release.trend > 10 ? 0.008 : 0))));
        streams += growth;
        income += earned;
        fans += newFans;
        return { ...release, status: 'Released', streams: release.streams + growth, revenue: release.revenue + earned, trend: cap(Math.round((release.trend || 5) * 0.62 + (campaignBoost ? 14 : 3)), -20, 45), campaign: release.campaign ? { ...release.campaign, remaining: Math.max(0, release.campaign.remaining - 1) } : null };
      });
      const playedBookings = state.bookings.filter(booking => booking.week === closingWeek);
      const showIncome = playedBookings.reduce((sum, booking) => sum + booking.payout, 0);
      income += showIncome;
      const newFans = fans + Math.round((state.player.reputation / 100) * 22) + playedBookings.length * 180;
      const nextWeek = closingWeek + 1;
      const rankDelta = ((closingWeek * 7) % 5) - 2;
      const nextRank = cap(state.player.rank - rankDelta, 1, 500);
      const report = {
        week: closingWeek,
        streams,
        income,
        fans: newFans,
        energyRecovered: Math.min(22, 100 - state.player.energy),
        oldRank: state.player.rank,
        newRank: nextRank,
        headline: showIncome ? 'The room gave it back.' : streams > 9000 ? 'A quiet record is finding its people.' : 'Small week. The city still remembers.',
      };
      const rivalActivity = closingWeek % 3 === 0 ? 'Juno Ash dropped “Almost Famous” overnight; the World chart reshuffled.' : closingWeek % 3 === 1 ? 'Kweku North announced a three-city run through Accra, London and Toronto.' : 'A late-night playlist editor added three Lagos independents to rotation.';
      const freshInbound = closingWeek % 2 === 0 ? [{ id: `nightline-${nextWeek}`, type: 'social', title: 'Nightline wants a campaign cut', place: 'Lagos, Nigeria', venue: 'Nightline Media Desk', date: `Reply by Week ${nextWeek + 1}`, offer: '+1.2k listeners · +240 fans', cost: 24000, listenerGain: 1200, fanGain: 240, audience: 'Lagos night-listeners', risk: 'Small spend, one-week window; no paid endorsement.', detail: 'A local editor wants a short release-story clip. Fund the cut and let the music carry it; audience lift is modeled, not guaranteed in a real market.', expiresWeek: nextWeek + 1, status: 'Open' }] : [];
      const updated = {
        ...state,
        week: nextWeek,
        worldSeed: nextWeek,
        player: { ...state.player, cash: state.player.cash + income, fans: state.player.fans + newFans, listeners: Math.max(0, state.player.listeners + Math.round(streams * 0.58)), energy: cap(state.player.energy + 22 - (showIncome ? 7 : 0), 0, 100), reputation: cap(state.player.reputation + (streams > 10000 ? 1 : 0) + (showIncome ? 2 : 0), 0, 100), rank: nextRank },
        releases,
        bookings: state.bookings.map(booking => booking.week === closingWeek ? { ...booking, status: 'Played' } : booking),
        opportunities: [...state.opportunities.map(opportunity => opportunity.status === 'Open' && opportunity.expiresWeek && closingWeek >= opportunity.expiresWeek ? { ...opportunity, status: 'Expired' } : opportunity), ...freshInbound],
        activity: [...(freshInbound.length ? [{ week: nextWeek, tag: 'INBOUND', text: `${freshInbound[0].title} arrived in the inbox.` }] : []), { week: nextWeek, tag: 'WORLD', text: rivalActivity }, { week: nextWeek, tag: 'WEEK CLOSE', text: `Week ${closingWeek} settled: ${streams.toLocaleString()} streams, ₦${income.toLocaleString()} earned.` }, ...state.activity].slice(0, 14),
        weeklyHistory: [...state.weeklyHistory, { week: closingWeek, streams, income, fans: newFans }].slice(-12),
        lastReport: report,
      };
      return updated;
    }
    case 'NOTIFICATION':
      return { ...state, notifications: { ...state.notifications, [action.key]: !state.notifications[action.key] } };
    default:
      return state;
  }
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  if (Math.abs(n) >= 1000000) return `₦${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}m`;
  if (Math.abs(n) >= 1000) return `₦${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₦${n.toLocaleString()}`;
}

export function formatCount(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toLocaleString();
}
