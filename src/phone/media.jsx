// Treblify (streaming), Treblr Music (editorial charts) and Treblrchat (messaging).
import { useMemo, useState } from 'react';
import {
  pitchPlaylist, SOCIAL, CERTS, fmtNum, genreName, COVER_GRADIENTS, chartItem, replyMessage, messageArtist, askOut, dateNight,
  hangOut, breakUp, setArtistPhoto, tierLabel, relOf, MARKETS, readContact, formatWeekDate,
} from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Empty, facePhoto, ArtistAvatar, UploadButton, Bar } from '../ui/kit.jsx';
import { relLabel } from '../ui/ArtistSheet.jsx';
import { topRivals } from './npcFeed.js';

const grad = (g) => `linear-gradient(135deg, ${COVER_GRADIENTS[g % 8][0]}, ${COVER_GRADIENTS[g % 8][1]})`;
const EDITORIAL = ['Today’s Top Hits', 'Global Viral 50', 'New Music Friday', 'Fresh Finds', 'Late Night Drive', 'Chill Vibes', 'Workout Beast', 'Top of the World'];

/* =============================== Treblify =============================== */
export function Treblify() {
  const { state, act, openArtist, openOverlay } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('home');
  const released = state.songs.filter((s) => s.status === 'released').sort((a, b) => b.weeklyStreams - a.weeklyStreams);
  const placements = released.flatMap((s) => (s.playlistNames || []).map((n) => ({ n, s })));
  const rank = [...state.rivals.map((r) => r.monthlyListeners), p.monthlyListeners].sort((a, b) => b - a).indexOf(p.monthlyListeners) + 1;
  const outs = state.releases.filter((r) => r.status === 'out');
  const fansAlsoLike = state.rivals.filter((r) => r.genres.includes(p.genre)).sort((a, b) => Math.abs(Math.log10(a.monthlyListeners) - Math.log10(p.monthlyListeners + 1e5)) - Math.abs(Math.log10(b.monthlyListeners) - Math.log10(p.monthlyListeners + 1e5))).slice(0, 8);
  const hour = (state.week * 7) % 24;
  return (
    <div className="sp">
      <div className="sp-chips">{[['home', 'Home'], ['artist', 'Artist'], ['wrapped', 'Wrapped']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'home' && (
        <div>
          <h2 className="sp-h">{hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}</h2>
          <div className="sp-quick">
            <button onClick={() => setTab('artist')}><img src={facePhoto(p)} alt="" /><b>{p.stageName}</b></button>
            {EDITORIAL.slice(0, 5).map((n, i) => <div key={n}><i style={{ background: grad(i) }} /><b>{n}</b></div>)}
          </div>
          <h3 className="sp-sh">Made for you</h3>
          <div className="sp-shelf">
            {EDITORIAL.map((n, i) => {
              const mine = placements.find((x) => x.n === n);
              return <div key={n} className="sp-pl"><div className="sp-pl-art" style={{ background: grad(i + 2) }}><span>{n}</span></div><div className="tiny muted ellipsis">{mine ? `feat. ${mine.s.title}` : `${topRivals(state, 20)[(i * 3) % 20].name} and more`}</div></div>;
            })}
          </div>
          <h3 className="sp-sh">Popular artists</h3>
          <div className="sp-shelf">
            {topRivals(state, 10).map((r) => <button key={r.id} className="sp-artist" onClick={() => openArtist(r.id)}><ArtistAvatar rival={r} size={96} /><div className="tiny ellipsis">{r.name}</div></button>)}
          </div>
        </div>
      )}
      {tab === 'artist' && (
        <div style={{ margin: '0 -16px' }}>
          <div style={{ position: 'relative', height: 240 }}>
            <img src={facePhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, #121212)' }} />
            <div style={{ position: 'absolute', left: 16, bottom: 14, right: 16 }}>
              <div className="row gap6 tiny"><Icon name="check" size={14} color="#1DB954" />Verified Artist</div>
              <h1 style={{ fontSize: 40, lineHeight: 1 }}>{p.stageName}</h1>
              <div className="small mt8" style={{ color: '#ccc' }}>{fmtNum(p.monthlyListeners)} monthly listeners · #{rank} in the world</div>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div className="row"><button className="sp-follow">Following</button><span className="muted small">{fmtNum(p.fans)} followers</span><span className="grow" /><span className="sp-playbig"><Icon name="play" size={20} fill="#000" color="#000" /></span></div>
            <h3 className="sp-sh">Popular</h3>
            {released.length ? released.slice(0, 10).map((s, i) => (
              <div key={s.id} className="list-item">
                <span className="muted" style={{ width: 16 }}>{i + 1}</span>
                <Cover cover={s.cover} size={44} />
                <div className="grow"><div className="ellipsis" style={{ fontWeight: 600 }}>{s.title}{s.featName ? <span className="muted"> (feat. {s.featName})</span> : ''}</div><div className="tiny muted">{fmtNum(s.lifetimeStreams)} plays{s.cert ? ` · ${CERTS.find((c) => c.id === s.cert).name}` : ''}</div></div>
                <button className="btn sm" disabled={s.pitchedWeek === state.week || p.socialEnergy < SOCIAL.pitch} onClick={() => act(pitchPlaylist, { songId: s.id })}>{s.pitchedWeek === state.week ? 'Pitched' : 'Pitch'}</button>
              </div>
            )) : <Empty icon="play">Release a song to light up your artist page.</Empty>}
            <div className="tiny muted mt8">Pitching costs $50 + {SOCIAL.pitch} social energy. Acceptance depends on quality, popularity and label backing.</div>
            <h3 className="sp-sh">Discography</h3>
            <div className="sp-shelf">{outs.length ? outs.map((r) => <div key={r.id} className="sp-pl"><Cover cover={r.cover} title={r.title} size={120} /><div className="tiny ellipsis mt8"><b>{r.title}</b></div><div className="tiny muted">{r.type === 'single' ? 'Single' : r.type.toUpperCase()} · {formatWeekDate(r.releaseWeek, { year: 'numeric' })}</div></div>) : <div className="muted small">No releases yet.</div>}</div>
            <h3 className="sp-sh">Playlist placements</h3>
            {placements.length ? <div className="grid2 mt12">{placements.map(({ n, s }, i) => <div key={i} className="card tight" style={{ background: `linear-gradient(135deg, ${COVER_GRADIENTS[i % 8][0]}55, #181818)` }}><div className="head" style={{ fontSize: 15 }}>{n}</div><div className="tiny muted mt8">feat. {s.title}</div></div>)}</div> : <div className="muted small mt8">No placements yet.</div>}
            <h3 className="sp-sh">Fans also like</h3>
            <div className="sp-shelf">{fansAlsoLike.map((r) => <button key={r.id} className="sp-artist" onClick={() => openArtist(r.id)}><ArtistAvatar rival={r} size={88} /><div className="tiny ellipsis">{r.name}</div></button>)}</div>
          </div>
        </div>
      )}
      {tab === 'wrapped' && (
        <div className="mt12">
          {state.wrapped?.length ? state.wrapped.slice().reverse().map((w) => (
            <button key={w.year} className="sp-wrapped press" onClick={() => openOverlay({ wrapped: w.year })}><Mono style={{ color: '#0B0B0F' }}>Your Year {w.year} Wrapped</Mono><b>{fmtNum(w.streams)} streams</b><span>{w.type.name}</span></button>
          )) : <Empty icon="gift">Your first Wrapped lands at the end of week 52.</Empty>}
        </div>
      )}
    </div>
  );
}

/* =============================== Treblr Music =============================== */
export function TreblrMusic() {
  const { state, openArtist } = useGame();
  const [tab, setTab] = useState('listen');
  const hot = (state.charts.hot100 || []).slice(0, 10);
  const newRel = state.rivalSongs.filter((x) => x.releasedWeek >= state.week - 2).sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, 10);
  const spot = state.spotlight && state.rivals.find((r) => r.id === state.spotlight.rivalId);
  return (
    <div className="am">
      <div className="am-tabs">{[['listen', 'Listen Now'], ['browse', 'Browse'], ['radio', 'Radio']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'listen' && (
        <>
          {spot && <div className="am-hero" onClick={() => openArtist(spot.id)} role="button" tabIndex={0}><Mono className="sm">Up Next · Editor’s pick</Mono><div className="row mt8"><ArtistAvatar rival={spot} size={72} radius={16} /><div className="grow"><b style={{ fontSize: 20 }}>{spot.name}</b><div className="small">{state.spotlight.text}</div></div></div></div>}
          <h3 className="am-h">Top 10: Hot 100</h3>
          {hot.map((e) => { const it = chartItem(state, 'hot100', e); const r = it.rivalId && state.rivals.find((x) => x.id === it.rivalId); return (
            <div key={e.id} className={`list-item ${e.pl ? 'am-me' : ''}`}><span className="am-rank">{e.r}</span><Cover cover={it.cover} size={46} radius={8} /><div className="grow"><div className="ellipsis" style={{ fontWeight: 600 }}>{it.title}</div><div className="tiny muted ellipsis">{it.artist}</div></div>{r && <ArtistAvatar rival={r} size={30} onClick={() => openArtist(r.id)} />}</div>
          ); })}
          <h3 className="am-h">New Releases</h3>
          <div className="sp-shelf">{newRel.map((s) => { const r = state.rivals.find((x) => x.id === s.rivalId); return <div key={s.id} className="sp-pl"><Cover cover={s.cover} title={s.title} size={120} radius={12} /><div className="tiny ellipsis mt8"><b>{s.title}</b></div><div className="tiny muted ellipsis">{r?.name}</div></div>; })}</div>
        </>
      )}
      {tab === 'browse' && (
        <>
          <h3 className="am-h">City & country charts</h3>
          {MARKETS.slice(0, 8).map((m) => { const top = (state.charts[m.code] || []).slice(0, 3); return (
            <div key={m.code} className="card tight mt8"><div className="row between"><b>{m.flag} Top 40: {m.name}</b></div>{top.map((e) => { const it = chartItem(state, m.code, e); return <div key={e.id} className="row between small mt8"><span className="ellipsis"><b>{e.r}</b> {it.title}</span><span className="muted ellipsis" style={{ maxWidth: '45%' }}>{it.artist}</span></div>; })}</div>
          ); })}
        </>
      )}
      {tab === 'radio' && (
        <>
          <h3 className="am-h">Treblr Radio · most played</h3>
          {(state.charts.radio || []).slice(0, 15).map((e) => { const it = chartItem(state, 'radio', e); return <div key={e.id} className={`list-item ${e.pl ? 'am-me' : ''}`}><span className="am-rank">{e.r}</span><div className="grow"><div className="ellipsis" style={{ fontWeight: 600 }}>{it.title}</div><div className="tiny muted">{it.artist}</div></div><span className="tiny muted">{fmtNum(e.s)} spins</span></div>; })}
        </>
      )}
    </div>
  );
}

/* =============================== Treblrchat =============================== */
const ROLE = { manager: 'Manager', producer: 'Producer', friend: 'Friend', artist: 'Artist', person: 'New friend', partner: 'Partner 💞' };
export function Treblrchat({ contact: initial }) {
  const { state, act, openArtist, go } = useGame();
  const [open, setOpen] = useState(initial || null);
  const [q, setQ] = useState('');
  const [newChat, setNewChat] = useState(false);
  const contacts = (state.contacts || []).slice().sort((a, b) => (b.unread || 0) - (a.unread || 0) || (b.thread.at(-1)?.week || 0) - (a.thread.at(-1)?.week || 0));
  const c = open && state.contacts.find((x) => x.id === open);
  const searchable = useMemo(() => state.rivals.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12), [state.rivals, q]);
  if (c) {
    const rival = c.rivalId && state.rivals.find((r) => r.id === c.rivalId);
    const pending = [...c.thread].reverse().find((m) => m.from === 'them' && m.choices && !m.answered);
    const p = state.player;
    const isPartner = p.relationship?.partnerId === c.id;
    return (
      <div className="wa">
        <div className="wa-head">
          <button className="icon-btn ghost" onClick={() => setOpen(null)} aria-label="Back to chats"><Icon name="back" /></button>
          {rival ? <ArtistAvatar rival={rival} size={38} onClick={() => openArtist(rival.id)} /> : <div className="wa-av">{c.name[0]}</div>}
          <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{c.name}</b><span className="tiny muted">{ROLE[c.role] || c.role}{c.job ? ` · ${c.job}` : ''} · {relLabel(c.rel, c.beef)} ({c.rel})</span></div>
        </div>
        <div className="wa-thread">
          {c.thread.map((m, i) => <div key={i} className={`wa-msg ${m.from === 'me' ? 'me' : ''} ${m.system ? 'sys' : ''}`}>{m.text}<span>W{m.week}</span></div>)}
        </div>
        {pending && <div className="wa-choices">{pending.choices.map((ch, i) => <button key={i} className="wa-choice" onClick={() => act(replyMessage, { contactId: c.id, choice: i })}>{ch.label}</button>)}</div>}
        <div className="wa-actions">
          {rival && <><button className="btn sm" onClick={() => act(messageArtist, { rivalId: rival.id })}>Say hi · 5 social</button><button className="btn sm" disabled={!!c.beef} onClick={() => go({ tab: 'studio', section: 'collab', rival: rival.id })}>Request feature</button><UploadButton className="btn sm" max={256} onImage={(d) => act(setArtistPhoto, { rivalId: rival.id, photo: d })}>Set photo</UploadButton></>}
          {!rival && c.role !== 'partner' && <button className="btn sm" onClick={() => act(hangOut, { contactId: c.id })}>Hang out · 8 social</button>}
          {c.role === 'person' && p.relationship?.status !== 'dating' && <button className="btn sm" onClick={() => act(askOut, { contactId: c.id })}>Ask out · {SOCIAL.date} social</button>}
          {isPartner && <><button className="btn sm" onClick={() => act(dateNight)}>Date night · {SOCIAL.date} social</button><button className="btn sm danger" onClick={() => act(breakUp)}>Break up</button></>}
        </div>
        {rival && <div className="tiny faint" style={{ padding: '0 12px 8px' }}>{tierLabel(rival.tier)} · {fmtNum(rival.monthlyListeners)} listeners. Relationship 40+ discounts features, 70+ halves the fee.</div>}
      </div>
    );
  }
  return (
    <div className="wa">
      <div className="wa-top"><span className="wa-logo">Treblrchat</span><button className="icon-btn ghost" aria-label="New chat" onClick={() => setNewChat(!newChat)}><Icon name={newChat ? 'close' : 'pen'} /></button></div>
      {newChat && (
        <div className="wa-new">
          <div className="phone-search"><Icon name="search" size={18} color="#bbb" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Message an artist…" aria-label="Search artists" /></div>
          {searchable.map((r) => <button key={r.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => { const res = act(messageArtist, { rivalId: r.id }); if (res.ok) { setOpen(`c_${r.id}`); setNewChat(false); } }}><ArtistAvatar rival={r} size={40} /><div className="grow"><b>{r.name}</b><div className="tiny muted">{genreName(r.genre)} · {tierLabel(r.tier)} · rel {relOf(state, r.id)}</div></div></button>)}
        </div>
      )}
      {contacts.map((x) => {
        const rival = x.rivalId && state.rivals.find((r) => r.id === x.rivalId);
        const last = x.thread.at(-1);
        return (
          <button key={x.id} className="wa-row press" onClick={() => { setOpen(x.id); if (x.unread) act(readContact, { contactId: x.id }, { silent: true }); }}>
            {rival ? <ArtistAvatar rival={rival} size={48} /> : <div className="wa-av big">{x.name[0]}</div>}
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row between"><b className="ellipsis">{x.name}</b><span className="tiny muted">{last ? `W${last.week}` : ''}</span></div>
              <div className="row between"><span className="small muted ellipsis">{last ? (last.from === 'me' ? '✓✓ ' : '') + last.text : ROLE[x.role]}</span>{x.unread > 0 && <i className="wa-badge">{x.unread}</i>}</div>
              <div className="wa-rel"><Bar pct={(x.rel + 100) / 200} color={x.beef ? '#FF4D5E' : '#25D366'} /></div>
            </div>
          </button>
        );
      })}
      <div className="tiny faint" style={{ padding: 12 }}>Contacts: manager, producer, friends, artists you’ve met, and people from events. Only fictional people can be dated.{state.player.relationship?.status === 'dating' ? ` You’re dating ${state.contacts.find((x) => x.id === state.player.relationship.partnerId)?.name}.` : ''}</div>
    </div>
  );
}
