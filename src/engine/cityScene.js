import { CITIES } from '../data/constants';

const CITY_SCENES = {
  lagos: { demand: 1.1, venueCapacity: 5200, ticketPrice: 16000, genres: { afrobeats: 1.38, rnb: 1.08, hiphop: 1.02 }, collaborators: ['burna', 'wizkid', 'davido', 'rema', 'tems', 'asake', 'ayra', 'olamide'], events: ['lagos_street_wave', 'lagos_afrobeats_week'] },
  accra: { demand: 1.02, venueCapacity: 3600, ticketPrice: 13500, genres: { afrobeats: 1.22, rnb: 1.1, alt: 1.08 }, collaborators: ['blackSherif', 'blacksherif', 'sarkodie', 'stonebwoy', 'rema', 'tems'], events: ['accra_scene_exchange', 'accra_highlife_night'] },
  atlanta: { demand: 1.08, venueCapacity: 6800, ticketPrice: 18000, genres: { hiphop: 1.35, rnb: 1.12, pop: 1.03 }, collaborators: ['drake', 'future', 'lilbaby', '21savage', 'metro', 'glorilla', 'jid'], events: ['atlanta_cypher', 'atlanta_radio_break'] },
  london: { demand: 1.06, venueCapacity: 5700, ticketPrice: 19500, genres: { alt: 1.13, pop: 1.1, afrobeats: 1.09, hiphop: 1.06 }, collaborators: ['stormzy', 'centralcee', 'dave', 'littlesimz', 'stevelacy', 'tems'], events: ['london_showcase', 'london_crossover'] },
  toronto: { demand: 1.0, venueCapacity: 4400, ticketPrice: 17500, genres: { rnb: 1.16, hiphop: 1.12, pop: 1.05 }, collaborators: ['drake', 'theweeknd', 'sza', 'weeknd'], events: ['toronto_festival', 'toronto_writer_room'] },
};

export const getCityScene = (cityId) => CITY_SCENES[cityId] || CITY_SCENES.lagos;
export const getCityDemand = (cityId, genreId) => {
  const scene = getCityScene(cityId);
  return scene.demand * (scene.genres?.[genreId] || 0.96);
};
export const getCityCollaboratorAffinity = (cityId, npcId) => getCityScene(cityId).collaborators.includes(npcId) ? 1 : 0.88;
export const getCityEvents = (cityId) => getCityScene(cityId).events || [];

export const buildTourRoute = (state, weeks) => {
  const home = CITIES.find((city) => city.id === state?.city) || CITIES[0];
  const away = CITIES.filter((city) => city.id !== home.id).sort((a, b) =>
    getCityDemand(b.id, state?.genre) - getCityDemand(a.id, state?.genre)
  );
  const route = [home, ...away];
  return Array.from({ length: weeks }, (_, index) => {
    const city = route[index % route.length];
    const scene = getCityScene(city.id);
    const demand = getCityDemand(city.id, state?.genre);
    const venueCapacity = Math.round(scene.venueCapacity * (0.7 + Math.min(0.5, (state?.lp || 0) / 200)));
    const expectedAttendance = Math.max(1, Math.min(venueCapacity, Math.round(Math.max(100, state?.fans || 0) ** 0.58 * 1.6 * demand)));
    const ticketPrice = Math.round(scene.ticketPrice * (0.8 + Math.min(0.7, (state?.lp || 0) / 100)));
    return {
      cityId: city.id,
      city: city.label,
      demand: Number(demand.toFixed(2)),
      venueCapacity,
      expectedAttendance,
      ticketPrice,
      attendance: 0,
      revenue: 0,
      week: index + 1,
    };
  });
};

export const simulateTourStop = (state, stop) => {
  const demand = getCityDemand(stop.cityId, state?.genre);
  const reputation = Math.max(0.55, 0.75 + (Number(state?.reputation ?? 50) - 50) / 200);
  const performance = Math.max(0.7, 0.85 + (Number(state?.lp || 0) / 250));
  const attendance = Math.max(1, Math.min(stop.venueCapacity, Math.round(stop.expectedAttendance * demand * reputation * performance * (0.88 + Math.random() * 0.24))));
  return { ...stop, attendance, revenue: Math.round(attendance * stop.ticketPrice), fans: Math.max(1, Math.round(attendance * 0.04)) };
};
