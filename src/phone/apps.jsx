import { useMemo, useState } from 'react';
import {
  pitchPlaylist, postChirp, postSnapshot, promoteClip, makeVideo, VIDEO_TIERS, respondOffer, markRead, setStaff,
  saveGame, listSaves, deleteSave, calendarEvents, weekDate, STAFF, CERTS, SOCIAL, ENERGY, createRng, hashString,
  fmtNum, fmtMoney, genreName, COVER_GRADIENTS, cityById, weeklyExpenses, LABELS,
} from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Sheet, Seg, UploadButton, Empty, facePhoto, Bar } from '../ui/kit.jsx';

/* ---------------- Streamify ---------------- */
function Streamify() {
  const { state, act } = useGame();
  const p = state.player;
  const released = state.songs.filter((s) => s.status === 'released').sort((a, b) => b.weeklyStreams - a.weeklyStreams);
  const placements = released.flatMap((s) => (s.playlistNames || []).map((n) => ({ n, s })));
  const rank = [...state.rivals.map((r) => r.monthlyListeners), p.monthlyListeners].sort((a, b) => b - a).indexOf(p.monthlyListeners) + 1;
  return (
    <div style={{ margin: '-14px -16px 0' }}>
      <div style={{ position: 'relative', height: 260 }}>
        <img src={facePhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, #121212)' }} />
        <div style={{ position: 'absolute', left: 16, bottom: 14, right: 16 }}>
          <div className="row gap6 tiny"><Icon name="check" size={14} color="#3DDC84" />Verified Artist</div>
          <h1 style={{ fontSize: 40, lineHeight: 1 }}>{p.stageName}</h1>
          <div className="small mt8" style={{ color: '#ccc' }}>{fmtNum(p.monthlyListeners)} monthly listeners · #{rank} on Treblr's artist list</div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div className="row"><button className="btn sm" style={{ background: '#3DDC84', color: '#000', border: 0 }}>Following</button><span className="muted small">{fmtNum(p.fans)} followers</span></div>
        <h3 className="mt24" style={{ fontSize: 20 }}>Popular</h3>
        {released.length ? released.slice(0, 10).map((s, i) => (
          <div key={s.id} className="list-item">
            <span className="muted" style={{ width: 16 }}>{i + 1}</span>
            <Cover cover={s.cover} size={44} />
            <div className="grow"><div className="ellipsis" style={{ fontWeight: 600 }}>{s.title}</div><div className="tiny muted">{fmtNum(s.lifetimeStreams)} plays{s.cert ? ` · ${CERTS.find((c) => c.id === s.cert).name}` : ''}</div></div>
            <button className="btn sm" disabled={s.pitchedWeek === state.week || p.socialEnergy < SOCIAL.pitch} onClick={() => act(pitchPlaylist, { songId: s.id })}>{s.pitchedWeek === state.week ? 'Pitched' : 'Pitch'}</button>
          </div>
        )) : <Empty icon="play">Release a song to light up your artist page.</Empty>}
        <div className="tiny muted mt8">Pitching costs $50 + {SOCIAL.pitch} social energy. Acceptance depends on quality, popularity and label backing.</div>
        <h3 className="mt24" style={{ fontSize: 20 }}>Playlist placements</h3>
        {placements.length ? (
          <div className="grid2 mt12">
            {placements.map(({ n, s }, i) => (
              <div key={i} className="card tight" style={{ background: `linear-gradient(135deg, ${COVER_GRADIENTS[i % 8][0]}55, #181818)` }}>
                <div className="head" style={{ fontSize: 15 }}>{n}</div><div className="tiny muted mt8">feat. {s.title}</div>
              </div>
            ))}
          </div>
        ) : <div className="muted small mt8">No placements yet.</div>}
        <h3 className="mt24" style={{ fontSize: 20 }}>Top artists this month</h3>
        {state.rivals.slice().sort((a, b) => b.monthlyListeners - a.monthlyListeners).slice(0, 5).map((r, i) => (
          <div key={r.id} className="list-item"><span className="muted" style={{ width: 16 }}>{i + 1}</span><div className="grow"><b>{r.name}</b><div className="tiny muted">{genreName(r.genre)} · {r.country}</div></div><span className="small">{fmtNum(r.monthlyListeners)}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Chirp ---------------- */
const HANDLES = ['popcrave', 'chartdata', 'musicnews', 'stanaccount', 'vinylhead', 'beatsbyjo', 'nightdrive', 'kpopdaily', 'latinvibes', 'ukgarage'];
function chirpFeed(state) {
  const rng = createRng(hashString(`chirp${state.week}`));
  const p = state.player;
  const out = state.news.slice(0, 6).map((n, i) => ({ id: `n${i}`, user: rng.pick(HANDLES), name: n.aboutPlayer ? 'Pop Crave' : 'Music News', text: n.headline, likes: rng.int(200, 90000), reposts: rng.int(20, 9000), week: n.week, verified: true }));
  const songs = state.songs.filter((s) => s.status === 'released');
  const fanLines = songs.length
    ? [`“${rng.pick(songs).title}” on repeat all week`, `${p.stageName} deserves so much more recognition`, `ok who else is seated for whatever ${p.stageName} drops next`, `just found ${p.stageName} and I'm mad nobody told me sooner`]
    : [`who is ${p.stageName}?? heard a snippet and need more`, `${p.stageName} better drop something soon`];
  for (let i = 0; i < Math.min(4, 1 + Math.floor(p.fans / 2000)); i++) out.push({ id: `f${i}`, user: `${rng.pick(['luv', 'stan', 'wave', 'echo', 'nite'])}${rng.int(10, 999)}`, name: 'fan', text: rng.pick(fanLines), likes: rng.int(3, 2000), reposts: rng.int(0, 300), week: state.week - 1 });
  return out.sort(() => rng.next() - 0.5);
}
function Chirp() {
  const { state, act } = useGame();
  const [text, setText] = useState('');
  const [tab, setTab] = useState('foryou');
  const p = state.player;
  const feed = useMemo(() => chirpFeed(state), [state]);
  const mine = state.social.chirp;
  return (
    <div>
      <div className="card tight" style={{ background: '#000', borderColor: '#2f3336' }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <img className="avatar" src={facePhoto(p)} alt="" />
          <textarea rows={3} value={text} maxLength={280} onChange={(e) => setText(e.target.value)} placeholder="What's happening?" style={{ background: 'transparent', border: 0, padding: 4, resize: 'none' }} />
        </div>
        <div className="row between mt8"><span className="tiny muted">{SOCIAL.chirp} social energy · {280 - text.length}</span>
          <button className="btn sm" style={{ background: '#1d9bf0', color: '#fff', border: 0 }} disabled={!text.trim() || p.socialEnergy < SOCIAL.chirp} onClick={() => { if (act(postChirp, { text }).ok) { setText(''); setTab('mine'); } }}>Post</button></div>
      </div>
      <div className="mt12"><Seg options={[{ value: 'foryou', label: 'For you' }, { value: 'mine', label: 'Your posts' }]} value={tab} onChange={setTab} /></div>
      {tab === 'foryou' && feed.map((c) => <ChirpPost key={c.id} c={c} />)}
      {tab === 'mine' && (mine.length ? mine.map((c) => (
        <div key={c.id}>
          <ChirpPost c={{ ...c, user: p.stageName.replace(/\s+/g, '').toLowerCase(), name: p.stageName, verified: p.popularity > 40, img: facePhoto(p) }} />
          {c.replies.map((r, i) => <div key={i} className="small" style={{ padding: '6px 0 6px 52px', color: '#aaa' }}><b style={{ color: '#ddd' }}>{r.user}</b> {r.text}</div>)}
        </div>
      )) : <Empty icon="chat">You haven't posted yet.</Empty>)}
    </div>
  );
}
function ChirpPost({ c }) {
  return (
    <div className="list-item" style={{ alignItems: 'flex-start', borderColor: '#2f3336' }}>
      {c.img ? <img className="avatar" src={c.img} alt="" /> : <div className="avatar" style={{ display: 'grid', placeItems: 'center', background: `hsl(${(c.user.length * 53) % 360} 45% 35%)`, fontWeight: 700 }}>{c.user[0].toUpperCase()}</div>}
      <div className="grow">
        <div className="small"><b>{c.name}</b>{c.verified && <span style={{ color: '#1d9bf0' }}> ✓</span>} <span className="muted">@{c.user} · W{c.week}</span></div>
        <div style={{ marginTop: 2 }}>{c.text}</div>
        <div className="row gap16 tiny muted mt8"><span className="row gap4"><Icon name="chat" size={14} />{fmtNum(Math.round(c.likes / 20))}</span><span className="row gap4"><Icon name="repeat" size={14} />{fmtNum(c.reposts)}</span><span className="row gap4"><Icon name="heart" size={14} />{fmtNum(c.likes)}</span></div>
      </div>
    </div>
  );
}

/* ---------------- Snapshot ---------------- */
function Snapshot() {
  const { state, act } = useGame();
  const p = state.player;
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const posts = state.social.snapshot;
  return (
    <div>
      <div className="row" style={{ gap: 18 }}>
        <div style={{ padding: 3, borderRadius: 999, background: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)' }}><img src={facePhoto(p)} alt="" style={{ width: 78, height: 78, borderRadius: 999, objectFit: 'cover', border: '3px solid #000' }} /></div>
        <div className="grid3 grow" style={{ textAlign: 'center' }}>
          <div><div className="num">{posts.length}</div><div className="tiny muted">posts</div></div>
          <div><div className="num">{fmtNum(p.followers.snapshot)}</div><div className="tiny muted">followers</div></div>
          <div><div className="num">{Math.min(999, 40 + state.week)}</div><div className="tiny muted">following</div></div>
        </div>
      </div>
      <div className="mt12"><b>{p.stageName}</b><div className="small muted">{genreName(p.genre)} artist · {cityById(p.city).flag} {cityById(p.city).name}</div></div>
      <button className="btn block mt12" style={{ background: 'linear-gradient(45deg,#ee2a7b,#6228d7)', border: 0 }} onClick={() => setOpen(true)} disabled={p.socialEnergy < SOCIAL.snapshot}><Icon name="plus" size={18} />New post · {SOCIAL.snapshot} social</button>
      <div className="mt16" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, margin: '16px -16px 0' }}>
        {posts.map((x) => (
          <div key={x.id} style={{ aspectRatio: '1', position: 'relative', background: `linear-gradient(135deg, ${COVER_GRADIENTS[x.gradient][0]}, ${COVER_GRADIENTS[x.gradient][1]})` }}>
            {x.image && <img src={x.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px #000' }}>♥ {fmtNum(x.likes)}</div>
          </div>
        ))}
      </div>
      {!posts.length && <Empty icon="camera">Your grid is empty. Post something.</Empty>}
      <Sheet open={open} onClose={() => setOpen(false)} title="New post">
        <div style={{ aspectRatio: '1', borderRadius: 16, overflow: 'hidden', background: '#222' }}><img src={image || facePhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        <div className="row mt12"><UploadButton className="btn grow" onImage={setImage}><Icon name="upload" size={18} />Choose photo</UploadButton>{image && <button className="btn" onClick={() => setImage(null)}>Use portrait</button>}</div>
        <textarea className="mt12" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" />
        <button className="btn primary block mt12" onClick={() => { if (act(postSnapshot, { caption, image: image || facePhoto(p) }).ok) { setOpen(false); setCaption(''); setImage(null); } }}>Share</button>
      </Sheet>
    </div>
  );
}

/* ---------------- Clipz ---------------- */
function Clipz() {
  const { state, act } = useGame();
  const p = state.player;
  const eligible = state.songs.filter((s) => ['released', 'scheduled', 'recorded'].includes(s.status));
  const [sel, setSel] = useState(eligible[0]?.id);
  const trending = useMemo(() => {
    const rv = state.rivalSongs.slice().sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, 6).map((s) => ({ title: s.title, artist: state.rivals.find((r) => r.id === s.rivalId)?.name, uses: Math.round(s.weeklyStreams / 40), cover: s.cover }));
    const mine = state.songs.filter((s) => s.viral > 1.3).map((s) => ({ title: s.title, artist: p.stageName, uses: Math.round(s.weeklyStreams / 15), cover: s.cover, me: true }));
    return [...mine, ...rv].sort((a, b) => b.uses - a.uses).slice(0, 8);
  }, [state, p.stageName]);
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#25F4EE33,#FE2C5533)', borderColor: '#333' }}>
        <Mono style={{ color: '#fff' }}>Promote a snippet</Mono>
        <div className="small muted mt8">15-second hook, a dance challenge and a prayer. Viral chance grows with quality, hype and charisma.</div>
        {eligible.length ? (
          <>
            <select className="mt12" value={sel} onChange={(e) => setSel(e.target.value)}>{eligible.map((s) => <option key={s.id} value={s.id}>{s.title} (Q{s.quality})</option>)}</select>
            <button className="btn block mt12" style={{ background: '#FE2C55', color: '#fff', border: 0 }} disabled={p.socialEnergy < SOCIAL.clipz} onClick={() => act(promoteClip, { songId: sel || eligible[0].id })}>Post snippet · {SOCIAL.clipz} social</button>
          </>
        ) : <div className="small mt12">Record a song first.</div>}
      </div>
      <h3 className="mt24" style={{ fontSize: 18 }}>Trending sounds</h3>
      {trending.map((t, i) => (
        <div key={i} className="list-item">
          <span className="num" style={{ width: 22, color: i < 3 ? '#FE2C55' : '#888' }}>{i + 1}</span>
          <Cover cover={t.cover} size={42} radius={21} />
          <div className="grow"><div className="ellipsis" style={{ fontWeight: 600, color: t.me ? '#C6FF3D' : undefined }}>{t.title}</div><div className="tiny muted">{t.artist}</div></div>
          <span className="tiny muted">{fmtNum(t.uses)} videos</span>
        </div>
      ))}
      <h3 className="mt24" style={{ fontSize: 18 }}>Your clips · {fmtNum(p.followers.clipz)} followers</h3>
      <div className="grid3 mt12">
        {state.social.clipz.map((c) => (
          <div key={c.id} style={{ aspectRatio: '9/14', borderRadius: 10, background: c.viral ? 'linear-gradient(160deg,#FE2C55,#25F4EE)' : '#1c1c1c', padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="tiny" style={{ fontWeight: 700 }}>{c.title}</div>
            <div className="tiny"><Icon name="play" size={10} fill="#fff" /> {fmtNum(c.views)}{c.viral && ' 🔥'}</div>
          </div>
        ))}
      </div>
      {!state.social.clipz.length && <div className="muted small mt8">No clips yet.</div>}
    </div>
  );
}

/* ---------------- ViewTube ---------------- */
function ViewTube() {
  const { state, act } = useGame();
  const p = state.player;
  const eligible = state.songs.filter((s) => ['released', 'scheduled'].includes(s.status) && !state.social.videos.some((v) => v.songId === s.id));
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const [tier, setTier] = useState('indie');
  const vids = state.social.videos;
  return (
    <div>
      <div className="row">
        <img className="avatar" src={facePhoto(p)} alt="" style={{ width: 56, height: 56 }} />
        <div className="grow"><b style={{ fontSize: 18 }}>{p.stageName}</b><div className="small muted">{fmtNum(p.followers.viewtube)} subscribers · {vids.length} videos · {fmtNum(vids.reduce((a, v) => a + v.views, 0))} views</div></div>
      </div>
      <button className="btn block mt16" style={{ background: '#FF0033', color: '#fff', border: 0 }} disabled={!eligible.length} onClick={() => { setSel(eligible[0]?.id); setOpen(true); }}><Icon name="video" size={18} />Make a music video</button>
      {!eligible.length && <div className="tiny muted mt8" style={{ textAlign: 'center' }}>Release or schedule a song without a video first.</div>}
      <div className="col mt16">
        {vids.map((v) => (
          <div key={v.id}>
            <div style={{ aspectRatio: '16/9', borderRadius: 14, background: `linear-gradient(135deg, ${COVER_GRADIENTS[v.gradient][0]}, ${COVER_GRADIENTS[v.gradient][1]})`, display: 'grid', placeItems: 'center', position: 'relative' }}>
              <div style={{ width: 56, height: 40, borderRadius: 12, background: '#FF0033', display: 'grid', placeItems: 'center' }}><Icon name="play" fill="#fff" size={18} /></div>
              <span className="chip sm" style={{ position: 'absolute', right: 8, bottom: 8, background: '#000c' }}>{VIDEO_TIERS.find((t) => t.id === v.tier)?.name}</span>
            </div>
            <div className="mt8"><b>{p.stageName} — {v.title} (Official Video)</b><div className="tiny muted">{fmtNum(v.views)} views · week {v.week} · {fmtNum(v.weekly)}/wk now</div></div>
          </div>
        ))}
      </div>
      {!vids.length && <Empty icon="video">No videos yet.</Empty>}
      <Sheet open={open} onClose={() => setOpen(false)} title="Music video" sub={`${ENERGY.video} energy · views pay ad revenue and lift streams`}>
        <select value={sel || ''} onChange={(e) => setSel(e.target.value)}>{eligible.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <div className="col mt12">
          {VIDEO_TIERS.map((t) => (
            <button key={t.id} className={`option press ${tier === t.id ? 'on' : ''}`} style={{ '--accent': '#FF0033' }} onClick={() => setTier(t.id)}>
              <div className="row between"><b>{t.name}</b><span className="small">{t.cost ? fmtMoney(t.cost) : 'Free'}</span></div>
              <div className="tiny muted mt8">×{t.mult} reach</div>
            </button>
          ))}
        </div>
        <button className="btn block mt16" style={{ background: '#FF0033', color: '#fff', border: 0 }} onClick={() => { if (act(makeVideo, { songId: sel, tier }).ok) setOpen(false); }}>Shoot it</button>
      </Sheet>
    </div>
  );
}

/* ---------------- Inbox ---------------- */
function Inbox() {
  const { state, act } = useGame();
  const [tab, setTab] = useState('offer');
  const [open, setOpen] = useState(null);
  const items = state.inbox.filter((m) => (tab === 'offer' ? m.type === 'offer' : tab === 'dm' ? m.type === 'dm' : m.type === 'fanmail'));
  const m = open && state.inbox.find((x) => x.id === open);
  const count = (t) => state.inbox.filter((x) => x.type === t && !x.read && !x.status).length;
  const openMsg = (x) => { setOpen(x.id); if (!x.read) act(markRead, { id: x.id }, { silent: true }); };
  const sub = { brand: 'Brand deal', feature: 'Feature', label: 'Record deal', gig: 'Gig' };
  return (
    <div>
      <Seg options={[{ value: 'offer', label: `Offers${count('offer') ? ` · ${count('offer')}` : ''}` }, { value: 'dm', label: `DMs${count('dm') ? ` · ${count('dm')}` : ''}` }, { value: 'fanmail', label: `Fans${count('fanmail') ? ` · ${count('fanmail')}` : ''}` }]} value={tab} onChange={setTab} />
      <div className="mt12">
        {items.map((x) => (
          <button key={x.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => openMsg(x)}>
            <div style={{ width: 8, height: 8, borderRadius: 9, background: x.read ? 'transparent' : '#6C7BFF', flexShrink: 0 }} />
            <div className="grow">
              <div className="row between"><b className="ellipsis">{x.from}</b><span className="tiny muted">W{x.week}</span></div>
              <div className="small ellipsis">{x.subject}</div>
              {x.type === 'offer' && <div className="row gap6 mt8"><span className="chip sm">{sub[x.subtype]}</span>{x.status ? <span className="chip sm" style={{ color: x.status === 'accepted' ? '#3DDC84' : '#9A9AA5' }}>{x.status}</span> : <span className="chip sm" style={{ color: x.expires - state.week <= 0 ? '#FF4D5E' : '#FFB020' }}>{x.expires - state.week <= 0 ? 'Expires this week' : `${x.expires - state.week}w left`}</span>}</div>}
            </div>
          </button>
        ))}
        {!items.length && <Empty icon="mail">Nothing here yet.</Empty>}
      </div>
      <Sheet open={!!m} onClose={() => setOpen(null)} title={m?.subject} sub={m && `From ${m.from} · week ${m.week}`}>
        {m && (
          <>
            <p style={{ marginTop: 0 }}>{m.body}</p>
            {m.type === 'offer' && !m.status && (
              <div className="row mt16">
                <button className="btn grow" onClick={() => { act(respondOffer, { id: m.id, accept: false }); setOpen(null); }}>Decline</button>
                <button className="btn primary grow" onClick={() => { if (act(respondOffer, { id: m.id, accept: true }).ok) setOpen(null); }}>Accept</button>
              </div>
            )}
            {m.type === 'offer' && m.status && <div className="chip">{m.status === 'accepted' ? 'Accepted' : m.status === 'declined' ? 'Declined' : 'Expired'}</div>}
            {m.subtype === 'label' && !m.status && <div className="tiny muted mt12">Signing means the label keeps {100 - Math.round(m.payload.royalty * 100)}% of streaming income. You can buy out later.</div>}
          </>
        )}
      </Sheet>
    </div>
  );
}

/* ---------------- Bank ---------------- */
function Bank() {
  const { state } = useGame();
  const p = state.player;
  const rep = state.lastReport;
  const inc = Object.values(state.ledger.income).reduce((a, b) => a + b, 0);
  const exp = Object.values(state.ledger.expense).reduce((a, b) => a + b, 0);
  const hist = state.history.slice(-12);
  const max = Math.max(1, ...hist.map((h) => Math.abs(h.net)));
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#3DDC8433,#15151B)' }}>
        <Mono>Available balance</Mono>
        <div className="num" style={{ fontSize: 40, color: p.cash < 0 ? '#FF4D5E' : undefined }}>{fmtMoney(p.cash)}</div>
        <div className="small muted">Fixed costs ≈ {fmtMoney(weeklyExpenses(state))}/week · {p.label ? `${p.label.name} keeps ${100 - Math.round(p.label.royalty * 100)}% of streams` : 'Independent — you keep 100% of streams'}</div>
      </div>
      <div className="grid2 mt12">
        <div className="stat"><Mono className="sm">In this week</Mono><div className="v up">+{fmtMoney(inc)}</div></div>
        <div className="stat"><Mono className="sm">Out this week</Mono><div className="v down">-{fmtMoney(exp)}</div></div>
      </div>
      {hist.length > 0 && (
        <div className="card mt12"><Mono>Weekly net · last {hist.length}</Mono>
          <div className="row mt12" style={{ alignItems: 'center', height: 90, gap: 4 }}>
            {hist.map((h) => <div key={h.week} title={`W${h.week}: ${fmtMoney(h.net)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div style={{ height: `${h.net > 0 ? (h.net / max) * 50 : 0}%`, background: '#3DDC84', borderRadius: 3, marginTop: 'auto' }} />
              <div style={{ height: `${h.net < 0 ? (-h.net / max) * 50 : 0}%`, background: '#FF4D5E', borderRadius: 3, marginBottom: 'auto' }} />
            </div>)}
          </div>
        </div>
      )}
      {rep && (
        <div className="card mt12"><Mono>Last week (W{rep.week})</Mono>
          {Object.entries(rep.income).map(([k, v]) => <div key={k} className="row between small mt8"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="up">+{fmtMoney(v)}</span></div>)}
          {Object.entries(rep.expense).map(([k, v]) => <div key={k} className="row between small mt8"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="down">-{fmtMoney(v)}</span></div>)}
        </div>
      )}
      <h3 className="mt24" style={{ fontSize: 18 }}>Transactions</h3>
      {state.transactions.slice(0, 40).map((t, i) => (
        <div key={i} className="list-item"><div className="grow"><div className="small ellipsis">{t.label}</div><div className="tiny muted">Week {t.week}</div></div><b className={t.amount >= 0 ? 'up' : 'down'}>{t.amount >= 0 ? '+' : ''}{fmtMoney(t.amount)}</b></div>
      ))}
      {!state.transactions.length && <Empty icon="bank">No transactions yet.</Empty>}
    </div>
  );
}

/* ---------------- Calendar ---------------- */
function Calendar() {
  const { state } = useGame();
  const now = weekDate(state.week);
  const [offset, setOffset] = useState(0);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const evs = calendarEvents(state, Math.max(1, state.week - 8), state.week + 30);
  const firstDow = (month.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  // events land on the Friday of their week (release day)
  const dayEvents = (d) => evs.filter((e) => { const f = weekDate(e.week); f.setUTCDate(f.getUTCDate() + 4); return f.getUTCFullYear() === month.getUTCFullYear() && f.getUTCMonth() === month.getUTCMonth() && f.getUTCDate() === d; });
  const color = { release: '#FF6B4A', award: '#FFB020', expiry: '#6C7BFF', merch: '#2DD4BF' };
  const today = (d) => { const t = weekDate(state.week); return offset === 0 && d >= t.getUTCDate() && d < t.getUTCDate() + 7 && t.getUTCMonth() === month.getUTCMonth(); };
  return (
    <div>
      <div className="row between">
        <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous month"><Icon name="back" /></button>
        <h3>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next month"><Icon name="chev" /></button>
      </div>
      <div className="mt12" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="mono sm">{d}</div>)}
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const de = dayEvents(d);
          return (
            <div key={d} style={{ aspectRatio: '1', borderRadius: 10, background: today(d) ? 'rgba(108,123,255,.18)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 13 }}>
              {d}
              <div className="row" style={{ gap: 2 }}>{de.slice(0, 3).map((e, i) => <i key={i} style={{ width: 5, height: 5, borderRadius: 9, background: color[e.type] }} />)}</div>
            </div>
          );
        })}
      </div>
      <h3 className="mt24" style={{ fontSize: 18 }}>Upcoming</h3>
      {evs.filter((e) => e.week >= state.week).map((e, i) => (
        <div key={i} className="list-item"><i style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: color[e.type] }} /><div className="grow"><b className="small">{e.title}</b><div className="tiny muted">Week {e.week} · {weekDate(e.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div></div></div>
      ))}
    </div>
  );
}

/* ---------------- News ---------------- */
function News() {
  const { state } = useGame();
  const [f, setF] = useState('all');
  const list = state.news.filter((n) => f === 'all' || n.aboutPlayer);
  return (
    <div>
      <Seg options={[{ value: 'all', label: 'All news' }, { value: 'me', label: 'About you' }]} value={f} onChange={setF} />
      {list.map((n, i) => (
        <div key={i} className="list-item" style={{ alignItems: 'flex-start' }}>
          <div className="grow"><Mono className="sm" style={{ color: n.aboutPlayer ? '#C6FF3D' : undefined }}>{n.tag} · Week {n.week}</Mono><div className="head" style={{ fontSize: 16, marginTop: 4, fontWeight: 600 }}>{n.headline}</div></div>
        </div>
      ))}
      {!list.length && <Empty icon="news">No headlines yet.</Empty>}
    </div>
  );
}

/* ---------------- Manager ---------------- */
function Manager() {
  const { state, act } = useGame();
  const p = state.player;
  const hired = STAFF.filter((s) => p.staff[s.id]);
  const tips = [];
  if (p.cash < weeklyExpenses(state) * 3) tips.push('Cash is thin. Book jobs or gigs before spending on rollouts.');
  if (state.songs.filter((s) => s.status === 'recorded').length >= 3) tips.push('You have enough recorded songs for an EP — EPs can chart on the Album Chart.');
  if (!p.label && p.popularity >= 25) tips.push(`Labels are watching. ${LABELS.find((l) => p.popularity >= l.minPop && l.minPop >= 25)?.name || 'An indie label'} could sign you now.`);
  if (p.suspicion > 40) tips.push('Suspicion is high. Lay off the "consulting fees" or risk a payola scandal.');
  if (p.hype < 15) tips.push('Hype is cold. Post on Chirp or do press before your next release.');
  hired.forEach((s) => tips.push(s.tips[state.week % s.tips.length]));
  if (!tips.length) tips.push('Stay consistent: one release every 3–6 weeks keeps your listeners growing.');
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#6C7BFF33,#15151B)' }}>
        <Mono>Advice</Mono>
        {tips.slice(0, 4).map((t, i) => <div key={i} className="small mt8">💬 {t}</div>)}
      </div>
      <h3 className="mt24" style={{ fontSize: 18 }}>Your team</h3>
      <div className="col mt12">
        {STAFF.map((s) => (
          <div key={s.id} className="card tight">
            <div className="row between"><b>{s.name}</b><span className="small">{fmtMoney(s.salary)}/wk</span></div>
            <div className="tiny muted mt8">{s.buff}</div>
            <button className={`btn sm mt12 ${p.staff[s.id] ? 'danger' : 'accent'}`} onClick={() => act(setStaff, { role: s.id, hire: !p.staff[s.id] })}>{p.staff[s.id] ? 'Let go' : 'Hire'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function Settings() {
  const { state, slot, toast, onSwitch, onNew, onTitle } = useGame();
  const [confirm, setConfirm] = useState(false);
  const saves = listSaves();
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `treblr-${state.player.stageName.replace(/\W+/g, '-')}-week${state.week}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="col gap16">
      <button className="btn primary block" onClick={() => toast(saveGame(state, slot) ? `Saved to slot ${slot}.` : 'Could not save (storage full?)')}>Save now</button>
      <div className="card">
        <Mono>Save slots</Mono>
        {saves.map((s) => (
          <div key={s.slot} className="list-item">
            <div className="grow"><b>Slot {s.slot}{s.slot === slot ? ' · current' : ''}</b><div className="tiny muted">{s.empty ? 'Empty' : `${s.stageName} · week ${s.week} · ${fmtNum(s.fans)} fans`}</div></div>
            {s.slot !== slot && <button className="btn sm" onClick={() => (s.empty ? onNew(s.slot) : onSwitch(s.slot))}>{s.empty ? 'New' : 'Load'}</button>}
          </div>
        ))}
      </div>
      <button className="btn block" onClick={exportJson}><Icon name="upload" size={18} />Export save as JSON</button>
      <button className="btn block" onClick={onTitle}>Title screen</button>
      {!confirm ? <button className="btn danger block" onClick={() => setConfirm(true)}>Reset this career</button> : (
        <div className="card" style={{ borderColor: 'rgba(255,77,94,.4)' }}>
          <b>Delete slot {slot} permanently?</b>
          <div className="row mt12"><button className="btn grow" onClick={() => setConfirm(false)}>Cancel</button><button className="btn danger grow" onClick={() => { deleteSave(slot); onNew(slot); }}>Delete</button></div>
        </div>
      )}
      <div className="tiny muted" style={{ textAlign: 'center' }}>Treblr · save format v{state.version} · seed {state.seed}</div>
    </div>
  );
}

export const APPS = [
  { id: 'streamify', name: 'Streamify', icon: 'play', bg: '#1DB954', fg: '#000', Component: Streamify, screenBg: '#121212', accent: '#1DB954' },
  { id: 'chirp', name: 'Chirp', icon: 'chat', bg: '#000', Component: Chirp, screenBg: '#000', accent: '#1d9bf0' },
  { id: 'snapshot', name: 'Snapshot', icon: 'camera', bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)', Component: Snapshot, screenBg: '#000', accent: '#ee2a7b' },
  { id: 'clipz', name: 'Clipz', icon: 'video', bg: 'linear-gradient(135deg,#25F4EE,#000 45%,#FE2C55)', Component: Clipz, screenBg: '#000', accent: '#FE2C55' },
  { id: 'viewtube', name: 'ViewTube', icon: 'play', bg: '#FF0033', Component: ViewTube, screenBg: '#0f0f0f', accent: '#FF0033' },
  { id: 'inbox', name: 'Inbox', icon: 'mail', bg: '#6C7BFF', Component: Inbox },
  { id: 'bank', name: 'Bank', icon: 'bank', bg: '#3DDC84', fg: '#0B0B0F', Component: Bank, accent: '#3DDC84' },
  { id: 'calendar', name: 'Calendar', icon: 'cal', bg: '#fff', fg: '#FF4D5E', Component: Calendar },
  { id: 'news', name: 'News', icon: 'news', bg: '#FFB020', fg: '#0B0B0F', Component: News, accent: '#FFB020' },
  { id: 'manager', name: 'Manager', icon: 'briefcase', bg: '#1E1E26', Component: Manager },
  { id: 'settings', name: 'Settings', icon: 'gear', bg: '#5d5d68', Component: Settings },
];

export { Bar };
