import { create } from 'zustand';
import api from '../lib/api';

const useStore = create((set, get) => ({
  token:        localStorage.getItem('treblr_token') || null,
  user:         null,
  isLoading:    true,
  songs:        [],
  draftSongs:   [],
  recordedSongs:[],
  events:       [],
  chart:        null,
  leaderboard:  [],
  toast:        null,
  panel:        'dashboard',
  isAdvancing:  false,
  lastResult:   null,

  // ── AUTH ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('treblr_token', data.token);
    set({ token: data.token, user: data.user, isLoading: false });
    return data;
  },

  register: async (form) => {
    const { data } = await api.post('/auth/register', form);
    localStorage.setItem('treblr_token', data.token);
    set({ token: data.token, user: data.user, isLoading: false });
    return data;
  },

  logout: () => {
    localStorage.removeItem('treblr_token');
    set({ token: null, user: null, songs: [], events: [], isLoading: false });
  },

  // ── GAME STATE — never touches isLoading ──────────────────────────────────
  loadState: async () => {
    try {
      const { data } = await api.get('/game/state');
      set({
        user:          data.user,
        songs:         data.songs         || [],
        draftSongs:    data.draftSongs    || [],
        recordedSongs: data.recordedSongs || [],
        events:        data.events        || [],
        isLoading:     false
      });
    } catch (err) {
      console.error('loadState error:', err);
      set({ isLoading: false });
    }
  },

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  doAction: async (action, params = {}) => {
    try {
      const { data } = await api.post('/game/action', { action, params });
      if (data.success) {
        set(s => ({
          user: s.user ? {
            ...s.user,
            career:     data.career     || s.user.career,
            attributes: data.attributes || s.user.attributes,
            social:     data.social     || s.user.social,
            gameState: {
              ...s.user.gameState,
              actionsThisWeek: s.user.gameState.maxActionsPerWeek - (data.actionsRemaining ?? 0)
            }
          } : null,
          lastResult: data
        }));
        if (['writeSong','recordSong','releaseSingle'].includes(action)) {
          await get().loadState();
        }
        get().toast2(data.message, 'success');
      } else {
        get().toast2(data.message, 'error');
      }
      return data;
    } catch (err) {
      get().toast2(err.response?.data?.error || 'Action failed', 'error');
      throw err;
    }
  },

  // ── ADVANCE WEEK ──────────────────────────────────────────────────────────
  nextWeek: async () => {
    set({ isAdvancing: true });
    try {
      const { data } = await api.post('/game/advance-week');
      await get().loadState();
      await get().loadChart();
      if (data.event) {
        set(s => ({ events: [data.event, ...s.events] }));
        get().toast2(`📰 ${data.event.title}`, data.event.severity?.includes('positive') ? 'success' : 'info');
      }
      get().toast2(`📅 Week ${data.newWeek}, Year ${data.newYear}`, 'info');
      set({ isAdvancing: false });
      return data;
    } catch (err) {
      set({ isAdvancing: false });
      throw err;
    }
  },

  // ── EVENT CHOICE ──────────────────────────────────────────────────────────
  chooseEvent: async (eventId, choiceId) => {
    const { data } = await api.post('/game/event-choice', { eventId, choiceId });
    if (data.success) {
      get().toast2(data.message, 'success');
      await get().loadState();
      set(s => ({
        events: s.events.map(e => e._id === eventId ? { ...e, choiceMade: choiceId } : e)
      }));
    }
    return data;
  },

  // ── CHART / LEADERBOARD ───────────────────────────────────────────────────
  loadChart: async () => {
    try {
      const { data } = await api.get('/charts/global');
      set({ chart: data.chart });
    } catch {}
  },

  loadLeaderboard: async () => {
    try {
      const { data } = await api.get('/artists/leaderboard');
      set({ leaderboard: data.leaderboard || [] });
    } catch {}
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  setPanel: (p) => set({ panel: p }),

  toast2: (message, type = 'info') => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), 4000);
  }
}));

export default useStore;
