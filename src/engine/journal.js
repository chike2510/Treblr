// Career timeline, notifications and era lookup.
export function logTimeline(s, kind, title, detail = '') {
  s.timeline = s.timeline || [];
  s.timeline.unshift({ week: s.week, kind, title, detail, eraId: s.eraId || null });
  if (s.timeline.length > 300) s.timeline.length = 300;
}

// to: deep link, e.g. { tab: 'phone', app: 'treblrx' }
// group: similar notifications (e.g. 'offer') collapse into one row with a count while unread.
const GROUP_LABEL = { offer: 'new offers', message: 'new messages', bank: 'bank alerts', beef: 'mentions', chart: 'chart updates', label: 'label updates' };
export function pushNotif(s, kind, text, to = null, group = null) {
  s.notifications = s.notifications || [];
  if (group) {
    const g = s.notifications.find((n) => n.group === group && !n.read && s.week - (n.firstWeek ?? n.week) <= 2);
    if (g) {
      g.count = (g.count || 1) + 1;
      g.latest = text;
      g.text = `${g.count} ${GROUP_LABEL[group] || 'updates'} · latest: ${text}`;
      g.week = s.week;
      if (g.to?.contact) g.to = { tab: g.to.tab, app: g.to.app };
      s.notifications = [g, ...s.notifications.filter((n) => n !== g)];
      return g;
    }
  }
  s.nextId = (s.nextId || 1) + 1;
  const n = { id: `n${s.nextId}`, week: s.week, kind, text, to, read: false, ...(group ? { group, count: 1, latest: text, firstWeek: s.week } : {}) };
  s.notifications.unshift(n);
  if (s.notifications.length > 120) s.notifications.length = 120;
  return n;
}

export function eraOf(s) {
  return s.eraId ? (s.eras || []).find((e) => e.id === s.eraId) || null : null;
}

export function unreadNotifs(s) {
  return (s.notifications || []).filter((n) => !n.read).length;
}
