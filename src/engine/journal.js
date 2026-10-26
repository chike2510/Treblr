// Career timeline, notifications and era lookup.
export function logTimeline(s, kind, title, detail = '') {
  s.timeline = s.timeline || [];
  s.timeline.unshift({ week: s.week, kind, title, detail, eraId: s.eraId || null });
  if (s.timeline.length > 300) s.timeline.length = 300;
}

// to: deep link, e.g. { tab: 'phone', app: 'treblrx' }
export function pushNotif(s, kind, text, to = null) {
  s.notifications = s.notifications || [];
  s.nextId = (s.nextId || 1) + 1;
  s.notifications.unshift({ id: `n${s.nextId}`, week: s.week, kind, text, to, read: false });
  if (s.notifications.length > 120) s.notifications.length = 120;
}

export function eraOf(s) {
  return s.eraId ? (s.eras || []).find((e) => e.id === s.eraId) || null : null;
}

export function unreadNotifs(s) {
  return (s.notifications || []).filter((n) => !n.read).length;
}
