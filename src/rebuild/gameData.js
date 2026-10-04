export const SAVE_VERSION = 2;
export const SAVE_KEY = 'treblr.career.life.v2';
export const MAX_ACTION_POINTS = 3;
export const MAX_SOCIAL_ENERGY = 3;

export const CAREER_RANKS = [
  { id: 'new-voice', title: 'New voice', minXp: 0, unlock: 'The first signal is waiting.' },
  { id: 'first-signal', title: 'First signal', minXp: 90, unlock: 'Local radio wants your story.' },
  { id: 'city-draw', title: 'City draw', minXp: 230, unlock: 'A bigger-room conversation is open.' },
  { id: 'breakout', title: 'Breakout act', minXp: 430, unlock: 'Global press has your number.' },
  { id: 'global-name', title: 'Global name', minXp: 760, unlock: 'The whole circuit knows the name.' },
  { id: 'headliner', title: 'Headliner', minXp: 1150, unlock: 'Your own night is on the table.' },
];

export const MARKETS = [
  { id: 'lagos', name: 'Lagos', code: 'LOS', country: 'NG', region: 'West Africa', venue: 'The Current Room', fare: 680, tone: 'amber' },
  { id: 'atlanta', name: 'Atlanta', code: 'ATL', country: 'US', region: 'North America', venue: 'Signal Hall', fare: 820, tone: 'coral' },
  { id: 'london', name: 'London', code: 'LON', country: 'GB', region: 'Europe', venue: 'Platform 9', fare: 940, tone: 'mint' },
  { id: 'accra', name: 'Accra', code: 'ACC', country: 'GH', region: 'West Africa', venue: 'Open Frame', fare: 620, tone: 'mint' },
  { id: 'toronto', name: 'Toronto', code: 'YYZ', country: 'CA', region: 'North America', venue: 'Northline Pavilion', fare: 890, tone: 'coral' },
];

export const GENRES = [
  { id: 'afrobeats', name: 'Afrobeats', mark: 'AF', color: '#ffbf55' },
  { id: 'hiphop', name: 'Hip-Hop', mark: 'HH', color: '#ff755f' },
  { id: 'pop', name: 'Pop', mark: 'PP', color: '#ff755f' },
  { id: 'rnb', name: 'R&B', mark: 'RB', color: '#6fe0bc' },
  { id: 'alternative', name: 'Alternative', mark: 'AL', color: '#6fe0bc' },
];

export const PROJECT_TITLES = ['First Light', 'New City', 'Good Company', 'Open Doors', 'Long Way Home', 'All At Once', 'No Small Thing', 'After Hours'];
export const RELEASE_ARTWORK = [
  '/assets/covers/cov_02_07.png', '/assets/covers/cov_02_06.png', '/assets/covers/cov_03_02.png',
  '/assets/covers/cov_03_06.png', '/assets/covers/cov_03_08.png', '/assets/covers/cov_02_04.png',
  '/assets/covers/cov_03_04.png', '/assets/covers/cov_03_09.png',
];

export const RELEASE_CAMPAIGNS = [
  { id: 'diy', name: 'Independent drop', detail: 'Keep the whole return. A steady first move.', fee: 350, reach: 1, fans: 1 },
  { id: 'press', name: 'Press & radio week', detail: 'More attention, a little more spend.', fee: 950, reach: 1.35, fans: 1.25 },
  { id: 'visual', name: 'Visual premiere', detail: 'A bigger launch with the broadest reach.', fee: 1650, reach: 1.65, fans: 1.5 },
];

export const STUDIO_FOCUSES = [
  { id: 'writing', name: 'Project-development session', detail: 'Your team prepares a release candidate off-screen; you decide when it goes out and how to support it.', skill: 'writing', gain: 3, energy: 14, cost: 700 },
  { id: 'rehearsal', name: 'Live rehearsal', detail: 'Build confidence and protect your next show.', skill: 'performance', gain: 4, energy: 10, cost: 300 },
  { id: 'coaching', name: 'Career coaching', detail: 'Sharpen one skill that can open the next door.', skill: 'marketing', gain: 5, energy: 7, cost: 500 },
];

export const JOBS = [
  { id: 'session-call', title: 'Session call', detail: 'A one-day paid call with a local music team.', pay: 2400, fans: 8, energy: 12 },
  { id: 'support-slot', title: 'Support slot', detail: 'Open a bill and meet another artist’s crowd.', pay: 1650, fans: 36, energy: 20 },
];

export const LABEL_OFFERS = [
  { id: 'northline', name: 'Northline Distribution', detail: 'Two-release distribution term · smaller share.', advance: 4200, share: 8, releases: 2, minimumRep: 10 },
  { id: 'orbit-house', name: 'Orbit House', detail: 'Three-release services term · campaign support.', advance: 7600, share: 14, releases: 3, minimumRep: 24, minimumXp: 230 },
];

export const FESTIVALS = [
  { id: 'open-frame', name: 'Open Frame Weekender', marketId: 'accra', minimumFans: 0, minimumRep: 10, fee: 1250, fans: 92, energy: 24 },
  { id: 'night-index', name: 'Night Index', marketId: 'london', minimumFans: 650, minimumRep: 22, fee: 2850, fans: 230, energy: 30 },
  { id: 'northline-live', name: 'Northline Live', marketId: 'toronto', minimumFans: 1800, minimumRep: 40, fee: 6100, fans: 470, energy: 38 },
];

export const SOCIAL_STORIES = [
  { id: 'studio-note', name: 'A note from the room', detail: 'Let people in on the work behind the next release.', reach: 1, fans: 18, reputation: 1, relationship: 'collaborator' },
  { id: 'live-recap', name: 'A night on the road', detail: 'Carry the energy of a recent show into the next city.', reach: 1.2, fans: 28, reputation: 1, relationship: 'manager' },
  { id: 'community-thanks', name: 'A thank-you to listeners', detail: 'Build a closer connection with the people showing up.', reach: 0.86, fans: 20, reputation: 2, relationship: 'collaborator' },
];

export const DISCOVER_ITEMS = [
  { id: 'local-radio', name: 'Local radio conversation', detail: 'A short interview about the scene you came up in.', fans: 42, reputation: 3, minimumXp: 90 },
  { id: 'profile-piece', name: 'Artist profile', detail: 'Talk about what you want the next chapter to look like.', fans: 28, reputation: 5 },
  { id: 'city-spotlight', name: 'City spotlight feature', detail: 'A bigger outlet wants to hear how one local crowd became a route.', fans: 96, reputation: 6, minimumXp: 230 },
  { id: 'global-profile', name: 'Global profile', detail: 'Take the long view with an international music desk.', fans: 180, reputation: 8, minimumXp: 430 },
];

export const GAME_TABS = [
  { id: 'home', name: 'Home' },
  { id: 'music', name: 'Music' },
  { id: 'studio', name: 'Studio' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'social', name: 'Social' },
  { id: 'discover', name: 'Discover' },
  { id: 'settings', name: 'Settings' },
];
