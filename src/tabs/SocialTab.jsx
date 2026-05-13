import { useState, useMemo } from 'react';
import { NPC_ARTISTS } from '../data/artists';
import { clamp, fmt, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

// ── NPC avatar map (row_col from the cropped grid) ───────────────────────────
// Maps npc.id -> avatar filename in /assets/avatars/
const NPC_AVATARS = {
  taylor:     'av_01_01.png',  // pink hair girl
  drake:      'av_01_02.png',  // brown jacket guy
  kendrick:   'av_01_03.png',  // banjo/green jacket
  billie:     'av_01_04.png',  // goth girl
  weeknd:     'av_01_05.png',  // punk girl
  burna:      'av_01_06.png',  // chain guy
  tyla:       'av_01_07.png',  // braids tracksuit
  sza:        'av_01_08.png',  // afro gold shirt
  stevelacy:  'av_02_01.png',  // glasses indie guy
  frankocean: 'av_02_02.png',  // plaid flannel
  tems:       'av_02_03.png',  // dreads girl
  olivia:     'av_02_04.png',  // redhead leather
  wizkid:     'av_02_05.png',  // blue denim
  karolg:     'av_02_06.png',  // braids girl 2
  ayra:       'av_02_07.png',  // dark braids
  sabrina:    'av_02_08.png',  // asian purple hair
};

// ── NPC cover art pool ────────────────────────────────────────────────────────
const COVER_POOL = Array.from({ length: 27 }, (_, i) => {
  const row = Math.floor(i / 9) + 1;
  const col = (i % 9) + 1;
  return `cov_0${row}_0${col <= 9 ? col : col}.png`;
});

// ── Verified Chirp accounts ───────────────────────────────────────────────────
const VERIFIED_ACCOUNTS = {
  hillboard: {
    name: 'Hillboard Charts',
    handle: '@hillboardcharts',
    avatar: '/assets/accounts/hillboard.png',
    color: '#22c55e',
    verified: true,
  },
  popcraze: {
    name: 'Pop Craze',
    handle: '@popcraze',
    avatar: '/assets/accounts/popcraze.png',
    color: '#f97316',
    verified: true,
  },
  popchase: {
    name: 'PopChase',
    handle: '@popchase',
    avatar: '/assets/accounts/popchase.png',
    color: '#a855f7',
    verified: true,
  },
  chartinfo: {
    name: 'Chart Info',
    handle: '@chartinfo',
    avatar: '/assets/accounts/chartinfo.png',
    color: '#f43f5e',
    verified: true,
  },
  burrco: {
    name: 'Burrco',
    handle: '@burrco',
    avatar: '/assets/accounts/burrco.png',
    color: '#3b82f6',
    verified: true,
  },
  cmz: {
    name: 'CMZ',
    handle: '@cmz',
    avatar: '/assets/accounts/cmz.png',
    color: '#ef4444',
    verified: true,
  },
};

// ── Chart card colors (matching real Billboard) ───────────────────────────────
const CHART_COLORS = {
  hot100:    { bg: '#16a34a', label: 'HOT 100',       title: 'HOT', num: '100' },
  global200: { bg: '#9333ea', label: 'GLOBAL 200',    title: 'GLOBAL', num: '200' },
  artist100: { bg: '#dc2626', label: 'ARTIST 100',    title: 'ARTIST', num: '100' },
  bb200:     { bg: '#0891b2', label: 'BILLBOARD 200', title: 'BILLBOARD', num: '200' },
};

// ── Platform brand configs ────────────────────────────────────────────────────
const PC = {
  soundify:  { color: '#1DB954', bg: 'rgba(29,185,84,0.1)',   border: 'rgba(29,185,84,0.3)',   metric: 'Monthly Listeners', label: 'Soundify' },
  instapic:  { color: '#E1306C', bg: 'rgba(225,48,108,0.1)', border: 'rgba(225,48,108,0.3)', metric: 'Followers',         label: 'Instapic' },
  chirp:     { color: '#1DA1F2', bg: 'rgba(29,161,242,0.1)', border: 'rgba(29,161,242,0.3)', metric: 'Followers',         label: 'Chirp' },
  vidtube:   { color: '#FF0000', bg: 'rgba(255,0,0,0.1)',     border: 'rgba(255,0,0,0.3)',     metric: 'Subscribers',       label: 'VidTube' },
  rhythmtok: { color: '#69C9D0', bg: 'rgba(105,201,208,0.1)',border: 'rgba(105,201,208,0.3)', metric: 'Followers',         label: 'RhythmTok' },
  wavelog:   { color: '#FF5500', bg: 'rgba(255,85,0,0.1)',    border: 'rgba(255,85,0,0.3)',    metric: 'Followers',         label: 'Wavelog' },
};

// ── SVG platform icons ────────────────────────────────────────────────────────
const PIcons = {
  soundify: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: c }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 1 0 10 10" strokeWidth="2" stroke={c} fill="none" strokeLinecap="round" />
    </svg>
  ),
  instapic: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: 'none', stroke: c, strokeWidth: 2, strokeLinecap: 'round' }}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={c} stroke="none" />
    </svg>
  ),
  chirp: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: c }}>
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  ),
  vidtube: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: c }}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47a2.78 2.78 0 0 0-1.95 1.95C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.88 23 12 23 12s0-3.88-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff" />
    </svg>
  ),
  rhythmtok: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: 'none', stroke: c, strokeWidth: 2.5, strokeLinecap: 'round' }}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
  wavelog: ({ c, size = 20 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: c }}>
      <path d="M1 17.5a3.5 3.5 0 0 0 3.5 3.5h13a4 4 0 0 0 .5-7.97A6 6 0 0 0 7 9.5a5.5 5.5 0 0 0-1.5.2A3.5 3.5 0 0 0 1 13v4.5z" />
    </svg>
  ),
};

// ── Chirp feed templates ──────────────────────────────────────────────────────
const genChirpFeed = (gs, npcCatalog, npcArtists, playerName) => {
  const feed = [];
  const snap = gs.latestChartSnapshot;
  const week = gs.totalWeeks;
  const timeAgo = (n) => n === 0 ? 'now' : `${n}h`;

  // Hillboard chart posts (if chart snapshot exists)
  if (snap && snap.hot100 && snap.hot100.length > 0) {
    const hot100top = snap.hot100.slice(0, 10);
    feed.push({
      account: VERIFIED_ACCOUNTS.hillboard,
      text: `This week's top 10 on the #Hot100 (Week ${week}).`,
      chartCard: { type: 'hot100', entries: hot100top },
      time: timeAgo(1),
      likes: rand(30000, 90000),
      reposts: rand(5000, 20000),
      views: rand(500000, 2000000),
    });

    if (snap.global200 && snap.global200.length > 0) {
      feed.push({
        account: VERIFIED_ACCOUNTS.hillboard,
        text: `This week's Global 200 — #BeautyAndABeat holds at the top.`,
        chartCard: { type: 'global200', entries: snap.global200.slice(0, 10) },
        time: timeAgo(2),
        likes: rand(20000, 60000),
        reposts: rand(3000, 12000),
        views: rand(200000, 800000),
      });
    }

    if (snap.artist100 && snap.artist100.length > 0) {
      feed.push({
        account: VERIFIED_ACCOUNTS.hillboard,
        text: `#Artist100 top 5 this week (Week ${week}).`,
        chartCard: { type: 'artist100', entries: snap.artist100.slice(0, 5) },
        time: timeAgo(3),
        likes: rand(15000, 50000),
        reposts: rand(2000, 8000),
        views: rand(150000, 500000),
      });
    }
  }

  // PopChase — chart reaction posts
  const chartReactions = [
    `The ${playerName} fandom really said we're streaming until this goes #1 and honestly? I believe them.`,
    `Hot100 this week: Ella Langley holding strong, Olivia Rodrigo climbing fast.`,
    `The way ${playerName} is moving up the charts with zero label push is INSANE.`,
    `Chart Data just dropped and people are arguing about it. Same as always.`,
  ];
  feed.push({
    account: VERIFIED_ACCOUNTS.popchase,
    text: chartReactions[week % chartReactions.length],
    time: timeAgo(rand(1, 6)),
    likes: rand(5000, 80000),
    reposts: rand(1000, 30000),
    views: rand(80000, 600000),
  });

  // Chart Info — data post
  feed.push({
    account: VERIFIED_ACCOUNTS.chartinfo,
    text: `Hillboard Hot100 this week: ${snap?.hot100?.[0]?.artist || 'Ella Langley'} leads. New entry: ${npcArtists[rand(0, 5)]?.name || 'Tems'} debuts at #${rand(15, 40)}.`,
    time: timeAgo(rand(1, 8)),
    likes: rand(2000, 15000),
    reposts: rand(500, 5000),
    views: rand(40000, 200000),
  });

  // NPC artist posts
  const topNpcs = npcArtists.filter(n => n.tier === 'S' || n.tier === 'A').slice(0, 12);
  for (let i = 0; i < 4; i++) {
    const npc = topNpcs[(week + i * 3) % topNpcs.length];
    if (!npc) continue;
    const recentSong = npcCatalog.find(s => s.npcId === npc.id);
    const npcPosts = [
      recentSong ? `"${recentSong.title}" is everywhere right now. Thank you for the love.` : `Been cooking something new. Trust the process.`,
      `The way the streets have been showing up — can't say enough. Grateful.`,
      `No features for a while. Next project is just me.`,
      `New music tonight at midnight. Been sitting on this one for months.`,
    ];
    feed.push({
      npc,
      text: npcPosts[i % npcPosts.length],
      time: timeAgo(rand(1, 12)),
      likes: rand(10000, 400000),
      reposts: rand(2000, 80000),
      views: rand(100000, 2000000),
    });
  }

  // Burrco — hip hop news
  const burrcoItems = [
    `EXCLUSIVE: ${topNpcs[0]?.name || 'Drake'} turned down a major sync deal to keep creative control. Respect.`,
    `The sampling situation with ${topNpcs[1]?.name || 'Kendrick'}'s last album is about to get messy.`,
    `${playerName} is doing things that most producers won't attempt. The layering on this new one is something else.`,
  ];
  feed.push({
    account: VERIFIED_ACCOUNTS.burrco,
    text: burrcoItems[week % burrcoItems.length],
    time: timeAgo(rand(2, 10)),
    likes: rand(15000, 120000),
    reposts: rand(3000, 40000),
    views: rand(200000, 1000000),
  });

  // CMZ — gossip
  const cmzItems = [
    `${topNpcs[2]?.name || 'Wizkid'} seen leaving a recording session in Lagos at 4am. Album incoming?`,
    `Sources say there's a collab between two S-tier artists that the labels don't want released.`,
    `${playerName} spotted at industry event. Looking like the next big thing.`,
  ];
  feed.push({
    account: VERIFIED_ACCOUNTS.cmz,
    text: cmzItems[week % cmzItems.length],
    time: timeAgo(rand(3, 15)),
    likes: rand(5000, 50000),
    reposts: rand(1000, 15000),
    views: rand(50000, 300000),
  });

  // Pop Craze
  const popcrazeItems = [
    `The way ${playerName}'s fanbase has been trending all week without a single post from them… the fandom said "we'll do it ourselves" lmao`,
    `Hillboard Hot100 updated: Ella Langley is locked in. It's her era.`,
    `The discourse about whether ${topNpcs[3]?.name || 'SZA'} deserved that spot is sending me`,
  ];
  feed.push({
    account: VERIFIED_ACCOUNTS.popcraze,
    text: popcrazeItems[week % popcrazeItems.length],
    time: timeAgo(rand(2, 8)),
    likes: rand(8000, 100000),
    reposts: rand(2000, 30000),
    views: rand(100000, 500000),
  });

  return feed;
};

// ── Helper components ─────────────────────────────────────────────────────────
const NpcAvatar = ({ npc, size = 36 }) => {
  const avatarFile = NPC_AVATARS[npc.id];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: npc.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarFile
        ? <img src={`/assets/avatars/${avatarFile}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        : <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: size * 0.28, color: npc.color }}>{npc.initials}</span>
      }
    </div>
  );
};

const AccountAvatar = ({ account, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
    background: account.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1.5px solid ${account.color}40`,
  }}>
    <img src={account.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={e => {
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = `<span style="font-size:${Math.floor(size*0.35)}px;font-weight:900;color:${account.color}">${account.name[0]}</span>`;
      }}
    />
  </div>
);

const PlayerAvatar = ({ gs, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
    background: 'var(--surface-2)', border: '2px solid var(--accent-purple)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {gs.avatarUrl
      ? <img src={gs.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.4, color: 'var(--text-muted)' }}>
          {(gs.stageName || '?')[0]}
        </span>
    }
  </div>
);

// ── Hillboard chart card ──────────────────────────────────────────────────────
const ChartCard = ({ chartCard }) => {
  const cfg = CHART_COLORS[chartCard.type] || CHART_COLORS.hot100;
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden', marginTop: 10, border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Header */}
      <div style={{ background: cfg.bg, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>hillboard</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, letterSpacing: -1, color: '#000' }}>
            {cfg.title}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
            {cfg.num}
          </div>
        </div>
      </div>
      {/* Entries */}
      <div style={{ background: '#0a0a0a' }}>
        {chartCard.entries.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
            borderBottom: i < chartCard.entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ width: 20, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: i < 3 ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
              {entry.position || i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.title || entry.artist || '—'}
              </div>
              {entry.artist && entry.title && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{entry.artist}</div>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>—</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat row helper ───────────────────────────────────────────────────────────
const fmtStat = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
};

const ChirpStats = ({ likes, reposts, views }) => (
  <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {fmtStat(likes)}
    </span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }}>
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
      {fmtStat(reposts)}
    </span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {fmtStat(views)}
    </span>
  </div>
);

// ── POST ACTION ───────────────────────────────────────────────────────────────
const usePost = (gs, patchFn, showToast) => (platformId, contentType, seCost = 1, extraFn = null) => {
  if ((gs.se || 0) < seCost) { showToast(`Need ${seCost} Social Energy`); return; }

  patchFn(prev => {
    const cur = (prev.socialPlatforms || {})[platformId] || 0;
    const cb  = 1 + ((prev.charisma || 5) / 50);
    const sm  = prev.careerType === 'social_media' ? 3 : 1;
    let gain = 0, cloutG = 0, extra = {};

    if (platformId === 'soundify') {
      gain = rand(200, 800) * cb * sm; cloutG = 1;
    } else if (platformId === 'instapic') {
      gain = rand(300, 1200) * cb * sm; cloutG = 1;
    } else if (platformId === 'chirp') {
      if (contentType === 'Start Beef') {
        gain = rand(200, 800) * cb; cloutG = 4;
        extra.reputation = clamp((prev.reputation || 50) - rand(4, 10), 0, 100);
      } else { gain = rand(150, 600) * cb * sm; cloutG = 1; }
    } else if (platformId === 'vidtube') {
      gain = rand(800, 3000) * cb; cloutG = 2;
    } else if (platformId === 'rhythmtok') {
      const viral = Math.random() < 0.10;
      gain = viral ? rand(8000, 80000) : rand(300, 2000);
      cloutG = viral ? 6 : 1;
      if (viral) extra._pendingToast = 'VIRAL ON RHYTHMTOK!';
    } else if (platformId === 'wavelog') {
      gain = rand(150, 600); cloutG = 1;
    }

    if (extraFn) Object.assign(extra, extraFn(prev, gain));

    return {
      se: clamp((prev.se || 0) - seCost, 0, prev.maxSe || 7),
      clout: clamp((prev.clout || 0) + cloutG, 0, 100),
      socialPlatforms: { ...(prev.socialPlatforms || {}), [platformId]: Math.round(cur + gain) },
      news: addNews(prev.news, `Posted on ${PC[platformId]?.label || platformId} · +${Math.round(gain).toLocaleString()} reach`, 'pos', prev.totalWeeks),
      ...extra,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SocialTab({ gs, patch, patchFn, showToast }) {
  const [activePlatform, setActivePlatform] = useState(null);
  const [chirpTab, setChirpTab]             = useState('foryou');
  const [notifTab, setNotifTab]             = useState('all');

  const platforms = gs.socialPlatforms || {};
  const totalFollowers = Object.values(platforms).reduce((a, b) => a + (b || 0), 0);
  const seLeft = gs.se || 0;

  const doPost = usePost(gs, patchFn, showToast);

  const chirpFeed = useMemo(() =>
    genChirpFeed(gs, gs.npcCatalog || [], NPC_ARTISTS, gs.stageName || 'You'),
    [gs.totalWeeks, gs.latestChartSnapshot]
  );

  const PLATFORM_ORDER = ['soundify', 'instapic', 'chirp', 'vidtube', 'rhythmtok', 'wavelog'];

  // ── HUB VIEW ─────────────────────────────────────────────────────────────
  if (!activePlatform) {
    return (
      <div className="tab-content">
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-display)' }}>Social Hub</div>
              <div style={{ fontSize: 11, color: 'var(--accent-purple)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Global Influence</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent-purple)' }}>{fmt(totalFollowers)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TOTAL REACH</div>
            </div>
          </div>
          {/* Reach bar */}
          <div style={{ height: 3, background: 'var(--surface-2)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: Math.min(100, totalFollowers / 10000) + '%', background: 'linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))', borderRadius: 2, transition: 'width 400ms ease' }} />
          </div>
        </div>

        {/* SE row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-1)', borderRadius: 'var(--r)', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Social Energy this week</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: gs.maxSe || 7 }).map((_, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < seLeft ? 'var(--accent-cyan)' : 'var(--surface-2)', transition: 'background 150ms' }} />
            ))}
          </div>
        </div>

        {/* Platform list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {PLATFORM_ORDER.map((pid, idx) => {
            const c = PC[pid] || {};
            const count = platforms[pid] || 0;
            const PIcon = PIcons[pid] || (() => null);
            const isAuto = pid === 'soundify';
            return (
              <div
                key={pid}
                onClick={() => !isAuto && setActivePlatform(pid)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderBottom: idx < PLATFORM_ORDER.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: isAuto ? 'default' : 'pointer',
                  transition: 'background 150ms',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, border: '1px solid ' + c.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PIcon c={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{c.metric}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: c.color }}>{fmt(count)}</div>
                  {isAuto && <div style={{ fontSize: 9, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: 1 }}>AUTO</div>}
                </div>
                {!isAuto && (
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'var(--text-muted)', strokeWidth: 2, flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── BACK BUTTON ───────────────────────────────────────────────────────────
  const BackBtn = () => (
    <button
      onClick={() => setActivePlatform(null)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0 14px', fontSize: 13 }}
    >
      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><polyline points="15 18 9 12 15 6" /></svg>
      Back
    </button>
  );

  const c = PC[activePlatform] || {};
  const followers = platforms[activePlatform] || 0;
  const releasedTracks = (gs.catalog || []).filter(t => t.released);

  // ── INSTAPIC ──────────────────────────────────────────────────────────────
  if (activePlatform === 'instapic') {
    const npcPosts = (gs.npcCatalog || []).slice(-8).map(song => {
      const npc = NPC_ARTISTS.find(n => n.id === song.npcId);
      return npc ? { npc, song } : null;
    }).filter(Boolean);

    const coverIdx = (gs.totalWeeks || 0) % COVER_POOL.length;

    return (
      <div className="tab-content">
        <BackBtn />
        {/* Instapic header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#fff' }}>Instapic</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: 'none', stroke: '#fff', strokeWidth: 1.5 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: 'none', stroke: '#fff', strokeWidth: 1.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
        </div>

        {/* Stories row */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 16, scrollbarWidth: 'none' }}>
          {/* Player story */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', padding: 2, background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #000', overflow: 'hidden', background: 'var(--surface-2)' }}>
                {gs.avatarUrl
                  ? <img src={gs.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: 'var(--font-display)' }}>{(gs.stageName || '?')[0]}</div>
                }
              </div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Your Story</div>
          </div>
          {NPC_ARTISTS.slice(0, 6).map(npc => (
            <div key={npc.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', padding: 2, background: `linear-gradient(45deg,${npc.color},#a855f7)` }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #000', overflow: 'hidden', background: npc.color + '20' }}>
                  <NpcAvatar npc={npc} size={52} />
                </div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{npc.name.split(' ')[0]}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {['Photo Drop', 'Story Push', 'Reel Clip'].map(ct => (
            <button key={ct} onClick={() => doPost('instapic', ct)}
              disabled={seLeft < 1}
              style={{ padding: '10px 4px', borderRadius: 10, background: seLeft >= 1 ? c.bg : 'var(--surface-1)', border: '1px solid ' + (seLeft >= 1 ? c.border : 'var(--border)'), color: seLeft >= 1 ? c.color : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: seLeft >= 1 ? 'pointer' : 'default' }}>
              {ct}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>1 SE</span>
            </button>
          ))}
        </div>

        {/* Player profile strip */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <PlayerAvatar gs={gs} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 13 }}>{gs.stageName?.toLowerCase()}</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 4, fontSize: 12 }}>
              <span><strong>{releasedTracks.length}</strong> <span style={{ color: 'var(--text-muted)' }}>posts</span></span>
              <span><strong style={{ color: c.color }}>{fmt(followers)}</strong> <span style={{ color: 'var(--text-muted)' }}>followers</span></span>
            </div>
          </div>
        </div>

        {/* Post grid */}
        {releasedTracks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 16 }}>
            {releasedTracks.map((track, idx) => (
              <div key={track.id} style={{ aspectRatio: '1', borderRadius: 2, overflow: 'hidden', background: 'var(--surface-2)' }}>
                {track.coverArt
                  ? <img src={track.coverArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <img src={`/assets/covers/${COVER_POOL[(idx + coverIdx) % COVER_POOL.length]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                }
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1, margin: '0 auto 10px', display: 'block' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            Share your first post
          </div>
        )}

        {/* NPC feed */}
        {npcPosts.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Feed</div>
            {npcPosts.slice(0, 3).map(({ npc, song }, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                  <NpcAvatar npc={npc} size={32} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{npc.name.toLowerCase().replace(/ /g, '_')}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Suggested for you</div>
                  </div>
                </div>
                <div style={{ height: 220, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <img src={`/assets/covers/${COVER_POOL[(i + gs.totalWeeks) % COVER_POOL.length]}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ padding: '8px 0', fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{npc.name.toLowerCase().replace(/ /g, '_')}</span>
                  {' '}<span style={{ color: 'var(--text-muted)' }}>"{song.title}" out now</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ── CHIRP ─────────────────────────────────────────────────────────────────
  if (activePlatform === 'chirp') {
    return (
      <div className="tab-content">
        <BackBtn />

        {/* Chirp header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PIcons.chirp c={c.color} size={22} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: c.color }}>Chirp</span>
          </div>
          <PlayerAvatar gs={gs} size={32} />
        </div>

        {/* Post actions */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['Drop Heat', 1], ['Start Beef', 1], ['React to News', 1]].map(([ct, se]) => (
            <button key={ct} onClick={() => doPost('chirp', ct, se)}
              disabled={seLeft < se}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 10, background: seLeft >= se ? c.bg : 'var(--surface-1)', border: '1px solid ' + (seLeft >= se ? c.border : 'var(--border)'), color: seLeft >= se ? c.color : 'var(--text-muted)', fontSize: 10, fontWeight: 700, cursor: seLeft >= se ? 'pointer' : 'default' }}>
              {ct}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>{se} SE</span>
            </button>
          ))}
        </div>

        {/* For You / Following tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
          {['foryou', 'following'].map(t => (
            <div key={t} onClick={() => setChirpTab(t)}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: t === chirpTab ? 700 : 400, color: t === chirpTab ? '#fff' : 'var(--text-muted)', borderBottom: t === chirpTab ? `2px solid ${c.color}` : '2px solid transparent', cursor: 'pointer', transition: 'all 150ms' }}>
              {t === 'foryou' ? 'For You' : 'Following'}
            </div>
          ))}
        </div>

        {/* Feed */}
        {chirpFeed.map((item, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
            {/* Avatar */}
            {item.account
              ? <AccountAvatar account={item.account} size={40} />
              : <NpcAvatar npc={item.npc} size={40} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name row */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {item.account ? item.account.name : item.npc.name}
                </span>
                {(item.account?.verified || item.npc?.tier === 'S' || item.npc?.tier === 'A') && (
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: item.account ? item.account.color : c.color }}>
                    <path d="M9 11l3 3L22 4" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" /><circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.account ? item.account.handle : `@${item.npc.id}`} · {item.time}
                </span>
              </div>
              {/* Tweet text */}
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: 2 }}>
                {item.text}
              </div>
              {/* Chart card if present */}
              {item.chartCard && <ChartCard chartCard={item.chartCard} />}
              {/* Stats */}
              <ChirpStats likes={item.likes} reposts={item.reposts} views={item.views} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── VIDTUBE ───────────────────────────────────────────────────────────────
  if (activePlatform === 'vidtube') {
    return (
      <div className="tab-content">
        <BackBtn />
        {/* Channel banner */}
        <div style={{ height: 100, background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', borderRadius: 10, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, letterSpacing: 2 }}>
          CHANNEL BANNER
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0 16px' }}>
          <PlayerAvatar gs={gs} size={60} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{gs.stageName?.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              @{gs.stageName?.toLowerCase().replace(/ /g, '')} · {fmt(followers)} subscribers · {releasedTracks.length} videos
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Official Channel. Subscribe for new music.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={{ padding: '8px 18px', borderRadius: 20, background: '#fff', color: '#000', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Subscribe</button>
          <button style={{ padding: '8px 16px', borderRadius: 20, background: 'var(--surface-2)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2, verticalAlign: 'middle' }}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
          </button>
        </div>

        {/* Post actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Post Music Video', 'BTS Vlog', 'Live Session'].map(ct => (
            <button key={ct} onClick={() => doPost('vidtube', ct, 2)}
              disabled={seLeft < 2}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 10, background: seLeft >= 2 ? c.bg : 'var(--surface-1)', border: '1px solid ' + (seLeft >= 2 ? c.border : 'var(--border)'), color: seLeft >= 2 ? c.color : 'var(--text-muted)', fontSize: 9, fontWeight: 700, cursor: seLeft >= 2 ? 'pointer' : 'default' }}>
              {ct}<br /><span style={{ fontWeight: 400 }}>2 SE</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 14, gap: 24 }}>
          {['Latest', 'Popular', 'Oldest'].map((t, i) => (
            <div key={t} style={{ padding: '8px 0', fontSize: 13, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? '#fff' : 'var(--text-muted)', borderBottom: i === 1 ? `2px solid ${c.color}` : '2px solid transparent', cursor: 'pointer' }}>
              {t}
            </div>
          ))}
        </div>

        {releasedTracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: 'none', stroke: 'var(--text-muted)', strokeWidth: 1, margin: '0 auto 12px', display: 'block' }}>
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /><line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No content uploaded.</div>
            <div style={{ fontSize: 12 }}>Tap Create to upload your first video.</div>
          </div>
        ) : (
          releasedTracks.map((track, idx) => (
            <div key={track.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 120, height: 70, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {track.coverArt
                  ? <img src={track.coverArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <img src={`/assets/covers/${COVER_POOL[(idx + gs.totalWeeks) % COVER_POOL.length]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                }
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.8)', borderRadius: 3, padding: '1px 4px', fontSize: 10, color: '#fff' }}>
                  {Math.floor(rand(180, 240) / 60)}:{String(rand(0, 59)).padStart(2, '0')}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{track.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(Math.round((track.quality / 100) * followers * 0.4))} views</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Week {track.releaseWeek} · Q{track.quality}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── RHYTHMTOK ─────────────────────────────────────────────────────────────
  if (activePlatform === 'rhythmtok') {
    const hasPosts = followers > 0;
    return (
      <div className="tab-content">
        <BackBtn />
        {/* Profile header */}
        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
          <PlayerAvatar gs={gs} size={72} />
          <div style={{ fontWeight: 900, fontSize: 16, marginTop: 10 }}>@{gs.stageName?.toLowerCase().replace(/ /g, '')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{gs.genre ? gs.genre + ' artist' : 'Artist'} — New music out now</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 14, fontSize: 13 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>14</div><div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Following</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: c.color }}>{fmt(followers)}</div><div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Followers</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{fmt(Math.round(followers * 3.2))}</div><div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Likes</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            <button style={{ padding: '8px 28px', borderRadius: 6, background: c.color, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Edit Profile</button>
            <button style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--surface-2)', color: '#fff', fontWeight: 700, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            </button>
          </div>
        </div>

        {/* Post actions */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['Jump on Trend', 1], ['Original Sound', 1], ['Artist Challenge', 1]].map(([ct, se]) => (
            <button key={ct} onClick={() => doPost('rhythmtok', ct, se)}
              disabled={seLeft < se}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 10, background: seLeft >= se ? c.bg : 'var(--surface-1)', border: '1px solid ' + (seLeft >= se ? c.border : 'var(--border)'), color: seLeft >= se ? c.color : 'var(--text-muted)', fontSize: 9, fontWeight: 700, cursor: seLeft >= se ? 'pointer' : 'default' }}>
              {ct}<br /><span style={{ fontWeight: 400, fontSize: 8 }}>{se} SE · viral chance</span>
            </button>
          ))}
        </div>

        {/* Video grid or empty */}
        {!hasPosts ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ width: 64, height: 64, background: 'var(--surface-2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: 'none', stroke: 'var(--text-muted)', strokeWidth: 1.5 }}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No videos yet</div>
            <div style={{ fontSize: 12 }}>Your RhythmToks will appear here once you start posting.</div>
            <button onClick={() => doPost('rhythmtok', 'Original Sound', 1)} disabled={seLeft < 1}
              style={{ marginTop: 16, padding: '10px 28px', borderRadius: 6, background: c.color, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: seLeft >= 1 ? 'pointer' : 'default' }}>
              Create video
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            {Array.from({ length: Math.min(9, Math.ceil(followers / 100)) }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '9/16', background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`/assets/covers/${COVER_POOL[(i + gs.totalWeeks) % COVER_POOL.length]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10, color: '#fff', fontWeight: 700 }}>{fmt(rand(Math.round(followers * 0.1), Math.round(followers * 2)))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── WAVELOG ───────────────────────────────────────────────────────────────
  if (activePlatform === 'wavelog') {
    return (
      <div className="tab-content">
        <BackBtn />
        <div style={{ background: c.bg, border: '1px solid ' + c.border, borderRadius: 'var(--r)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <PlayerAvatar gs={gs} size={52} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{gs.stageName?.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{gs.genre} · {gs.city}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div><div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{fmt(followers)}</div><div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>FOLLOWERS</div></div>
            <div><div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{fmt(gs.totalLifetimeStreams || 0)}</div><div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>PLAYS</div></div>
            <div><div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{releasedTracks.length}</div><div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>TRACKS</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Drop Freestyle', 'Exclusive Preview'].map(ct => (
            <button key={ct} onClick={() => doPost('wavelog', ct, 1)}
              disabled={seLeft < 1}
              style={{ flex: 1, padding: '10px 6px', borderRadius: 10, background: seLeft >= 1 ? c.bg : 'var(--surface-1)', border: '1px solid ' + (seLeft >= 1 ? c.border : 'var(--border)'), color: seLeft >= 1 ? c.color : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: seLeft >= 1 ? 'pointer' : 'default' }}>
              {ct} · 1 SE
            </button>
          ))}
        </div>

        {releasedTracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <PIcons.wavelog c={c.color} size={40} />
            <div style={{ fontSize: 13, marginTop: 12 }}>No tracks yet — release music to see it here.</div>
          </div>
        ) : (
          <div className="card">
            {releasedTracks.map((track, idx) => (
              <div key={track.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                  {track.coverArt
                    ? <img src={track.coverArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <img src={`/assets/covers/${COVER_POOL[(idx + gs.totalWeeks) % COVER_POOL.length]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Q{track.quality} · Wk {track.releaseWeek}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: c.color, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {fmt(Math.round((track.quality / 100) * followers * 0.1))}<br />
                  <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>plays</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
