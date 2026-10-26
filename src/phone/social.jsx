// Treblr-branded social apps modelled on familiar real-world patterns (no real logos).
import { useMemo, useState } from 'react';
import {
  postChirp, postSnapshot, respondDrama, goLive, tokCreate, makeVideo, VIDEO_DIRECTORS, VIDEO_CONCEPTS, SOCIAL, ENERGY,
  fmtNum, fmtMoney, genreName, cityById, COVER_GRADIENTS, fanComments, createRng, hashString,
} from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Sheet, Seg, UploadButton, Empty, facePhoto, ArtistAvatar } from '../ui/kit.jsx';
import { npcPosts, trendingSounds, hashtags, handleOf, topRivals } from './npcFeed.js';

const grad = (g) => `linear-gradient(135deg, ${COVER_GRADIENTS[g % 8][0]}, ${COVER_GRADIENTS[g % 8][1]})`;
function useLikes() {
  const [liked, setLiked] = useState({});
  return [liked, (id) => setLiked((l) => ({ ...l, [id]: !l[id] }))];
}
const myHandle = (p) => handleOf(p.stageName) || 'me';

/* =============================== TreblrX =============================== */
export function TreblrX() {
  const { state, act, openArtist } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('foryou');
  const [text, setText] = useState('');
  const [quote, setQuote] = useState(null);
  const [liked, toggle] = useLikes();
  const [reposted, toggleRp] = useLikes();
  const [dissOpen, setDissOpen] = useState(false);
  const [dissTitle, setDissTitle] = useState('');
  const npc = useMemo(() => npcPosts(state, 8, 'x'), [state.week, state.rivals]); // eslint-disable-line react-hooks/exhaustive-deps
  const drama = state.drama;
  const dramaRival = drama && state.rivals.find((r) => r.id === drama.rivalId);
  const fans = useMemo(() => {
    const rng = createRng(hashString(`xf${state.week}`));
    return fanComments(state, rng, { n: Math.min(5, 1 + Math.floor(p.fans / 3000)) }).map((c, i) => ({ id: `xf${i}`, fan: c }));
  }, [state.week]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = state.social.chirp.map((c) => ({ ...c, kind: 'me' }));
  const following = new Set((state.contacts || []).filter((c) => c.rivalId && c.rel > 0).map((c) => c.rivalId));
  const feed = tab === 'following' ? [...mine, ...npc.filter((x) => following.has(x.rival.id)).map((x) => ({ ...x, kind: 'npc' }))] : [...npc.slice(0, 4).map((x) => ({ ...x, kind: 'npc' })), ...mine.slice(0, 3), ...fans.map((x) => ({ ...x, kind: 'fan' })), ...npc.slice(4).map((x) => ({ ...x, kind: 'npc' }))];
  const post = () => { const t = quote ? `${text}` : text; if (act(postChirp, { text: t }).ok) { setText(''); setQuote(null); } };
  return (
    <div className="tx">
      <div className="tx-tabs"><button className={tab === 'foryou' ? 'on' : ''} onClick={() => setTab('foryou')}>For you</button><button className={tab === 'following' ? 'on' : ''} onClick={() => setTab('following')}>Following</button></div>
      <div className="tx-compose">
        <img className="avatar" src={facePhoto(p)} alt="" />
        <div className="grow">
          <textarea rows={2} value={text} maxLength={280} onChange={(e) => setText(e.target.value)} placeholder={quote ? 'Add a comment…' : 'What’s happening?'} aria-label="Compose post" />
          {quote && <div className="tx-quote"><b>{quote.name}</b> <span className="muted">@{quote.handle}</span><div>{quote.text}</div><button className="tiny muted" onClick={() => setQuote(null)}>Remove quote</button></div>}
          <div className="row between mt8"><span className="tiny muted">{SOCIAL.chirp} social · {280 - text.length}</span><button className="tx-post" disabled={!text.trim() || p.socialEnergy < SOCIAL.chirp} onClick={post}>Post</button></div>
        </div>
      </div>
      {drama && drama.status === 'open' && dramaRival && (
        <div className="tx-drama">
          <Mono className="sm" style={{ color: '#FF4D5E' }}>👀 Fans think this is about you</Mono>
          <XPost avatar={<ArtistAvatar rival={dramaRival} size={40} onClick={() => openArtist(dramaRival.id)} />} name={dramaRival.name} handle={handleOf(dramaRival.name)} verified text={drama.text} likes={drama.likes || 0} reposts={Math.round((drama.likes || 0) / 6)} replies={Math.round((drama.likes || 0) / 12)} week={drama.week} />
          <div className="row gap6"><button className="btn sm grow" onClick={() => act(respondDrama, { choice: 'reply' })}>Reply</button><button className="btn sm grow" onClick={() => act(respondDrama, { choice: 'ignore' })}>Ignore</button><button className="btn sm danger grow" onClick={() => setDissOpen(true)}>Diss track</button></div>
        </div>
      )}
      <div className="tx-trends">
        <Mono className="sm">Trends for you</Mono>
        {hashtags(state).slice(0, 4).map((h) => <div key={h.tag} className="tx-trend"><span className="tiny muted">Trending in Music</span><b>{h.tag}</b><span className="tiny muted">{fmtNum(h.posts)} posts</span></div>)}
      </div>
      {feed.map((it) => {
        if (it.kind === 'npc') return <XPost key={it.id} id={it.id} avatar={<ArtistAvatar rival={it.rival} size={40} onClick={() => openArtist(it.rival.id)} />} name={it.rival.name} handle={handleOf(it.rival.name)} verified={it.rival.real || it.rival.monthlyListeners > 1e6} text={it.text} likes={it.likes + (liked[it.id] ? 1 : 0)} reposts={it.reposts + (reposted[it.id] ? 1 : 0)} replies={it.comments} week={it.week} liked={liked[it.id]} reposted={reposted[it.id]} onLike={() => toggle(it.id)} onRepost={() => toggleRp(it.id)} onQuote={() => setQuote({ name: it.rival.name, handle: handleOf(it.rival.name), text: it.text })} onReply={() => setText(`@${handleOf(it.rival.name)} `)} />;
        if (it.kind === 'fan') return <XPost key={it.id} id={it.id} avatar={<div className="avatar fan-av">{it.fan.user[1].toUpperCase()}</div>} name="fan account" handle={it.fan.user.slice(1)} text={`${it.fan.text} @${myHandle(p)}`} likes={it.fan.likes + (liked[it.id] ? 1 : 0)} reposts={Math.round(it.fan.likes / 8)} replies={Math.round(it.fan.likes / 20)} week={state.week - 1} liked={liked[it.id]} onLike={() => toggle(it.id)} onReply={() => setText(`@${it.fan.user.slice(1)} `)} />;
        return (
          <div key={it.id}>
            <XPost id={it.id} avatar={<img className="avatar" src={facePhoto(p)} alt="" />} name={p.stageName} handle={myHandle(p)} verified={p.popularity > 40} text={it.text} quote={it.quote} likes={it.likes + (liked[it.id] ? 1 : 0)} reposts={it.reposts} replies={it.replies?.length || 0} week={it.week} liked={liked[it.id]} onLike={() => toggle(it.id)} />
            {(it.replies || []).map((r, i) => <div key={i} className="tx-reply"><b>{r.user}</b> {r.text}</div>)}
          </div>
        );
      })}
      <Sheet open={dissOpen} onClose={() => setDissOpen(false)} title="Write a diss track" sub={`${ENERGY.write} energy · big hype multiplier, real backlash risk`}>
        <input value={dissTitle} onChange={(e) => setDissTitle(e.target.value)} placeholder={dramaRival ? `Dear ${dramaRival.name.split(' ')[0]}` : 'Title'} maxLength={40} />
        <button className="btn danger block mt12" onClick={() => { if (act(respondDrama, { choice: 'diss', title: dissTitle }).ok) setDissOpen(false); }}>Write it</button>
      </Sheet>
    </div>
  );
}
function XPost({ avatar, name, handle, verified, text, quote, likes, reposts, replies, week, liked, reposted, onLike, onRepost, onQuote, onReply }) {
  return (
    <div className="tx-post-row">
      {avatar}
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="small ellipsis"><b>{name}</b>{verified && <span className="tx-verified" aria-label="Verified">✓</span>} <span className="muted">@{handle} · W{week}</span></div>
        <div className="tx-text">{text}</div>
        {quote && <div className="tx-quote"><div>{quote}</div></div>}
        <div className="tx-actions">
          <button onClick={onReply} aria-label="Reply"><Icon name="chat" size={16} />{fmtNum(replies)}</button>
          <button onClick={onRepost} className={reposted ? 'rp' : ''} aria-label="Repost"><Icon name="repeat" size={16} />{fmtNum(reposts)}</button>
          <button onClick={onLike} className={liked ? 'lk' : ''} aria-label="Like"><Icon name="heart" size={16} fill={liked ? '#F91880' : 'none'} />{fmtNum(likes)}</button>
          {onQuote && <button onClick={onQuote} aria-label="Quote"><Icon name="pen" size={15} />Quote</button>}
        </div>
      </div>
    </div>
  );
}

/* =============================== Treblrgram =============================== */
export function Treblrgram() {
  const { state, act, go, openArtist } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('feed');
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [story, setStory] = useState(null);
  const [liked, toggle] = useLikes();
  const [comments, setComments] = useState(null);
  const npc = useMemo(() => npcPosts(state, 6, 'g'), [state.week, state.rivals]); // eslint-disable-line react-hooks/exhaustive-deps
  const stories = topRivals(state, 12);
  const posts = state.social.snapshot;
  const feed = [...posts.slice(0, 2).map((x) => ({ ...x, me: true })), ...npc.map((x) => ({ ...x, npc: true })), ...posts.slice(2).map((x) => ({ ...x, me: true }))];
  return (
    <div className="tg">
      <div className="tg-top">
        <span className="tg-logo">Treblrgram</span>
        <div className="row gap6"><button className="icon-btn ghost" aria-label="New post" onClick={() => setOpen(true)}><Icon name="plus" /></button><button className="icon-btn ghost" aria-label="Messages" onClick={() => go({ tab: 'phone', app: 'treblrchat' })}><Icon name="send" /></button></div>
      </div>
      {tab === 'feed' && (
        <>
          <div className="tg-stories">
            <button className="tg-story" onClick={() => setOpen(true)}><span className="tg-ring me"><img src={facePhoto(p)} alt="" /><i>+</i></span><span>Your story</span></button>
            {stories.map((r) => <button key={r.id} className="tg-story" onClick={() => setStory(r)}><span className="tg-ring"><ArtistAvatar rival={r} size={58} /></span><span className="ellipsis">{handleOf(r.name)}</span></button>)}
          </div>
          {feed.map((x) => {
            const id = x.id;
            const author = x.npc ? x.rival : null;
            const likes = (x.likes || 0) + (liked[id] ? 1 : 0);
            return (
              <article key={id} className="tg-post">
                <header>{author ? <ArtistAvatar rival={author} size={32} onClick={() => openArtist(author.id)} /> : <img className="tg-av" src={facePhoto(p)} alt="" />}<b>{author ? handleOf(author.name) : myHandle(p)}</b>{author?.real && <span className="tg-verified">✓</span>}<span className="grow" /><Icon name="dots" size={18} /></header>
                <div className="tg-media" style={{ background: grad(x.gradient || 0) }} onDoubleClick={() => toggle(id)}>{x.image ? <img src={x.image} alt="" /> : author ? <div className="tg-art"><ArtistAvatar rival={author} size={140} radius={28} /></div> : null}</div>
                <div className="tg-actions"><button aria-label="Like" onClick={() => toggle(id)}><Icon name="heart" size={24} fill={liked[id] ? '#FF3040' : 'none'} color={liked[id] ? '#FF3040' : '#fff'} /></button><button aria-label="Comments" onClick={() => setComments(x)}><Icon name="chat" size={24} /></button><button aria-label="Share" onClick={() => go({ tab: 'phone', app: 'treblrchat' })}><Icon name="send" size={22} /></button><span className="grow" /><Icon name="bookmark" size={22} /></div>
                <div className="small"><b>{fmtNum(likes)} likes</b></div>
                <div className="small"><b>{author ? handleOf(author.name) : myHandle(p)}</b> {x.caption ?? x.text}</div>
                <button className="tiny muted" onClick={() => setComments(x)}>View all {fmtNum(x.comments ?? x.replies?.length ?? 0)} comments</button>
              </article>
            );
          })}
        </>
      )}
      {tab === 'reels' && (
        <div className="tg-reels">
          {[...state.social.clipz.slice(0, 6).map((c) => ({ id: c.id, title: c.title, views: c.views, me: true, g: 2 })), ...npc.slice(0, 6).map((n) => ({ id: n.id, title: n.songTitle, views: n.likes * 12, rival: n.rival, g: n.gradient }))].map((r) => (
            <div key={r.id} className="tg-reel" style={{ background: grad(r.g) }}>{r.rival && <ArtistAvatar rival={r.rival} size={44} />}<div className="tiny"><b>{r.me ? myHandle(p) : handleOf(r.rival.name)}</b><div>♫ {r.title}</div><div><Icon name="play" size={10} fill="#fff" /> {fmtNum(r.views)}</div></div></div>
          ))}
        </div>
      )}
      {tab === 'profile' && (
        <div>
          <div className="row" style={{ gap: 18, marginTop: 12 }}>
            <span className="tg-ring big"><img src={facePhoto(p)} alt="" /></span>
            <div className="grid3 grow" style={{ textAlign: 'center' }}>
              <div><div className="num">{posts.length}</div><div className="tiny muted">posts</div></div>
              <div><div className="num">{fmtNum(p.followers.snapshot)}</div><div className="tiny muted">followers</div></div>
              <div><div className="num">{Math.min(999, 40 + state.week + (state.contacts?.length || 0))}</div><div className="tiny muted">following</div></div>
            </div>
          </div>
          <div className="mt12"><b>{p.stageName}</b><div className="small muted">{genreName(p.genre)} artist · {cityById(p.city).flag} {cityById(p.city).name}</div>{p.relationship?.status === 'dating' && <div className="small">💞 in a relationship</div>}</div>
          <div className="row mt12"><button className="btn sm grow" onClick={() => setOpen(true)}>New post</button><button className="btn sm grow" onClick={() => go({ tab: 'phone', app: 'treblrchat' })}>Messages</button></div>
          <div className="tg-grid">{posts.map((x) => <div key={x.id} style={{ background: grad(x.gradient) }}>{x.image && <img src={x.image} alt="" />}<span>♥ {fmtNum(x.likes)}</span></div>)}</div>
          {!posts.length && <Empty icon="camera">Share your first photo.</Empty>}
        </div>
      )}
      <nav className="tg-nav"><button className={tab === 'feed' ? 'on' : ''} onClick={() => setTab('feed')} aria-label="Home"><Icon name="home" /></button><button className={tab === 'reels' ? 'on' : ''} onClick={() => setTab('reels')} aria-label="Reels"><Icon name="reel" /></button><button onClick={() => setOpen(true)} aria-label="Create"><Icon name="plus" /></button><button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')} aria-label="Profile"><img className="tg-av sm" src={facePhoto(p)} alt="" /></button></nav>
      <Sheet open={open} onClose={() => setOpen(false)} title="New post" sub={`${SOCIAL.snapshot} social energy`}>
        <div style={{ aspectRatio: '1', borderRadius: 16, overflow: 'hidden', background: '#222' }}><img src={image || facePhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        <div className="row mt12"><UploadButton className="btn grow" onImage={setImage}><Icon name="upload" size={18} />Choose photo</UploadButton>{image && <button className="btn" onClick={() => setImage(null)}>Use portrait</button>}</div>
        <textarea className="mt12" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" />
        <button className="btn primary block mt12" disabled={p.socialEnergy < SOCIAL.snapshot} onClick={() => { if (act(postSnapshot, { caption, image: image || facePhoto(p) }).ok) { setOpen(false); setCaption(''); setImage(null); } }}>Share</button>
      </Sheet>
      <Sheet open={!!comments} onClose={() => setComments(null)} title="Comments">
        {comments && (comments.replies?.length ? comments.replies : fanComments(state, createRng(hashString(comments.id)), { n: 5 })).map((c, i) => <div key={i} className="list-item small"><b>{c.user}</b><span className="grow">{c.text}</span><span className="tiny muted">♥ {fmtNum(c.likes || 0)}</span></div>)}
      </Sheet>
      {story && (
        <div className="tg-storyview" onClick={() => setStory(null)} role="dialog" aria-label={`${story.name} story`}>
          <div className="tg-bar"><i /></div>
          <div className="row gap6"><ArtistAvatar rival={story} size={32} /><b>{handleOf(story.name)}</b><span className="tiny muted">{story.lastMove}</span></div>
          <div className="tg-story-art"><ArtistAvatar rival={story} size={220} radius={40} /></div>
          <div className="small" style={{ textAlign: 'center' }}>{story.lastMove}</div>
        </div>
      )}
    </div>
  );
}

/* =============================== TreblrTok =============================== */
export function TreblrTok() {
  const { state, act, openArtist } = useGame();
  const p = state.player;
  const [view, setView] = useState('foryou');
  const [liked, toggle] = useLikes();
  const [sound, setSound] = useState(null);
  const [duet, setDuet] = useState(null);
  const eligible = state.songs.filter((s) => ['released', 'scheduled', 'recorded'].includes(s.status));
  const [sel, setSel] = useState(eligible[0]?.id);
  const [live, setLive] = useState(null);
  const sounds = trendingSounds(state, 10);
  const fyp = useMemo(() => {
    const npc = sounds.slice(0, 8).map((sn, i) => ({ id: `t${sn.id}`, rival: sn.rival, title: sn.title, soundId: sn.id, views: sn.uses * 30, likes: sn.uses * 3, shares: Math.round(sn.uses / 4), comments: Math.round(sn.uses / 9), g: i }));
    const mine = state.social.clipz.slice(0, 4).map((c) => ({ id: c.id, me: true, title: c.title, views: c.views, likes: c.likes || Math.round(c.views * 0.08), shares: c.shares || Math.round(c.views * 0.01), comments: Math.round(c.views * 0.004), g: c.viral ? 5 : 4, label: c.label }));
    const out = []; npc.forEach((n, i) => { out.push(n); if (mine[i]) out.push(mine[i]); });
    return out;
  }, [state.week, state.social.clipz]); // eslint-disable-line react-hooks/exhaustive-deps
  const create = (mode, extra) => { const r = act(tokCreate, { songId: sel || eligible[0]?.id, mode, ...extra }); if (r.ok) { setSound(null); setDuet(null); } };
  return (
    <div className="tt">
      <div className="tt-top"><button className={view === 'following' ? 'on' : ''} onClick={() => setView('following')}>Following</button><button className={view === 'foryou' ? 'on' : ''} onClick={() => setView('foryou')}>For You</button><button className="tt-live-btn" onClick={() => setView('live')}>LIVE</button></div>
      {(view === 'foryou' || view === 'following') && (
        <div className="tt-feed">
          {(view === 'following' ? fyp.filter((x) => x.me || (state.contacts || []).some((c) => c.rivalId === x.rival?.id)) : fyp).map((v) => (
            <section key={v.id} className="tt-card" style={{ background: grad(v.g) }}>
              {v.rival && <div className="tt-art"><ArtistAvatar rival={v.rival} size={180} radius={36} /></div>}
              <div className="tt-rail">
                {v.rival ? <ArtistAvatar rival={v.rival} size={44} onClick={() => openArtist(v.rival.id)} /> : <img className="tt-av" src={facePhoto(p)} alt="" />}
                <button onClick={() => toggle(v.id)} aria-label="Like"><Icon name="heart" size={30} fill={liked[v.id] ? '#FE2C55' : '#fff'} color={liked[v.id] ? '#FE2C55' : '#fff'} /><span>{fmtNum(v.likes + (liked[v.id] ? 1 : 0))}</span></button>
                <button aria-label="Comments"><Icon name="chat" size={28} fill="#fff" /><span>{fmtNum(v.comments)}</span></button>
                <button aria-label="Share"><Icon name="share" size={28} /><span>{fmtNum(v.shares)}</span></button>
                {v.soundId && <button aria-label="Sound" onClick={() => setSound(sounds.find((x) => x.id === v.soundId))}><span className="tt-disc"><Icon name="disc" size={22} /></span></button>}
              </div>
              <div className="tt-cap">
                <b>@{v.me ? myHandle(p) : handleOf(v.rival.name)}</b>
                <div className="small">{v.label || (v.me ? 'new snippet 🎧' : 'this one’s different 🎧')} <Icon name="play" size={10} fill="#fff" /> {fmtNum(v.views)}</div>
                <div className="tiny">♫ {v.title} · {v.me ? p.stageName : v.rival.name}</div>
                {v.rival && <div className="row gap6 mt8"><button className="tt-chip" onClick={() => setDuet(v.rival)}>Duet</button><button className="tt-chip" onClick={() => setDuet(v.rival)}>Stitch</button><button className="tt-chip" onClick={() => setSound(sounds.find((x) => x.id === v.soundId))}>Use sound</button></div>}
              </div>
            </section>
          ))}
          {!fyp.length && <Empty icon="video">Nothing trending yet.</Empty>}
        </div>
      )}
      {view === 'discover' && (
        <div className="tt-pad">
          <Mono>Trending sounds</Mono>
          {sounds.map((sn, i) => (
            <button key={sn.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSound(sn)}>
              <span className="num" style={{ width: 22, color: i < 3 ? '#FE2C55' : '#888' }}>{i + 1}</span>
              <Cover cover={sn.cover} size={44} radius={10} />
              <div className="grow"><div className="ellipsis" style={{ fontWeight: 600 }}>{sn.title}</div><div className="tiny muted">{sn.rival?.name} · {fmtNum(sn.uses)} videos</div></div>
              <Icon name="chev" size={16} />
            </button>
          ))}
        </div>
      )}
      {view === 'create' && (
        <div className="tt-pad">
          <Mono>Post a snippet</Mono>
          {eligible.length ? (
            <>
              <select className="mt12" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Song">{eligible.map((s) => <option key={s.id} value={s.id}>{s.title} (Q{s.quality})</option>)}</select>
              <button className="btn block mt12 tt-red" disabled={p.socialEnergy < SOCIAL.clipz} onClick={() => create('snippet')}>Post snippet · {SOCIAL.clipz} social</button>
              <div className="tiny muted mt8">Or open a trending sound or an artist’s clip to make a trend video, duet or stitch.</div>
            </>
          ) : <div className="small mt12">Record a song first.</div>}
        </div>
      )}
      {view === 'live' && (
        <div className="tt-pad">
          <div className="tt-livebox">
            <span className="tt-live-badge">LIVE</span>
            {live ? (
              <>
                <div className="num" style={{ fontSize: 28 }}>{fmtNum(live.viewers)} watching</div>
                <div className="small">{fmtMoney(live.tips)} in gifts{live.moment ? ' · a clip is going viral!' : ''}</div>
                <div className="tt-chat">{live.chat.map((c, i) => <div key={i}><b>{c.user}</b> {c.text}</div>)}</div>
              </>
            ) : <div className="small muted">Go live to your {fmtNum(p.followers.clipz)} followers. Viewers tip gifts, chat, and sometimes a moment gets clipped.</div>}
          </div>
          <button className="btn block mt12 tt-red" disabled={p.socialEnergy < SOCIAL.live || (state.weekStats?.live || 0) >= 1} onClick={() => { const r = act(goLive, { platform: 'treblrtok' }); if (r.ok) setLive(r.data); }}>{(state.weekStats?.live || 0) >= 1 ? 'You’ve streamed this week' : `Go LIVE · ${SOCIAL.live} social`}</button>
        </div>
      )}
      {view === 'profile' && (
        <div className="tt-pad" style={{ textAlign: 'center' }}>
          <img src={facePhoto(p)} alt="" style={{ width: 88, height: 88, borderRadius: 99, objectFit: 'cover' }} />
          <div className="mt8"><b>@{myHandle(p)}</b></div>
          <div className="row mt12" style={{ justifyContent: 'center', gap: 24 }}>
            <div><div className="num">{Math.min(999, 20 + state.week)}</div><div className="tiny muted">Following</div></div>
            <div><div className="num">{fmtNum(p.followers.clipz)}</div><div className="tiny muted">Followers</div></div>
            <div><div className="num">{fmtNum(state.social.clipz.reduce((a, c) => a + (c.likes || 0), 0))}</div><div className="tiny muted">Likes</div></div>
          </div>
          <div className="grid3 mt16">{state.social.clipz.map((c) => <div key={c.id} className="tt-thumb" style={{ background: c.viral ? 'linear-gradient(160deg,#FE2C55,#25F4EE)' : '#1c1c1c' }}><div className="tiny" style={{ fontWeight: 700 }}>{c.title}</div><div className="tiny"><Icon name="play" size={10} fill="#fff" /> {fmtNum(c.views)}{c.viral && ' 🔥'}</div></div>)}</div>
          {!state.social.clipz.length && <div className="muted small mt12">No videos yet.</div>}
        </div>
      )}
      <nav className="tt-nav">
        <button className={view === 'foryou' || view === 'following' ? 'on' : ''} onClick={() => setView('foryou')}><Icon name="home" size={20} /><span>Home</span></button>
        <button className={view === 'discover' ? 'on' : ''} onClick={() => setView('discover')}><Icon name="compass" size={20} /><span>Sounds</span></button>
        <button className="tt-plus" onClick={() => setView('create')} aria-label="Create"><Icon name="plus" size={20} /></button>
        <button className={view === 'live' ? 'on' : ''} onClick={() => setView('live')}><Icon name="live" size={20} /><span>LIVE</span></button>
        <button className={view === 'profile' ? 'on' : ''} onClick={() => setView('profile')}><Icon name="user" size={20} /><span>Profile</span></button>
      </nav>
      <Sheet open={!!sound} onClose={() => setSound(null)} title={sound ? `♫ ${sound.title}` : ''} sub={sound ? `${sound.rival?.name} · ${fmtNum(sound.uses)} videos` : ''}>
        {sound && (
          <>
            <div className="row"><Cover cover={sound.cover} size={84} radius={14} /><div className="grow small muted">Make a trend video to this sound with one of your songs dropped in. Rides the sound’s momentum.</div></div>
            {eligible.length ? <><select className="mt12" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Your song">{eligible.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select><button className="btn block mt12 tt-red" disabled={p.socialEnergy < SOCIAL.clipz} onClick={() => create('sound', { soundId: sound.id })}>Use this sound · {SOCIAL.clipz} social</button></> : <div className="small mt12">Record a song first.</div>}
          </>
        )}
      </Sheet>
      <Sheet open={!!duet} onClose={() => setDuet(null)} title={duet ? `Duet / stitch ${duet.name}` : ''} sub="Borrow their audience for a moment.">
        {duet && (eligible.length ? <><select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Your song">{eligible.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select><button className="btn block mt12 tt-red" disabled={p.socialEnergy < SOCIAL.clipz} onClick={() => create('duet', { rivalId: duet.id })}>Post duet · {SOCIAL.clipz} social</button></> : <div className="small">Record a song first.</div>)}
      </Sheet>
    </div>
  );
}

/* =============================== TreblrTube =============================== */
export function TreblrTube() {
  const { state, act, openArtist } = useGame();
  const p = state.player;
  const [chip, setChip] = useState('all');
  const [watch, setWatch] = useState(null);
  const [upload, setUpload] = useState(false);
  const eligible = state.songs.filter((s) => ['released', 'scheduled'].includes(s.status) && !state.social.videos.some((v) => v.songId === s.id));
  const [sel, setSel] = useState(null);
  const [director, setDirector] = useState('indie');
  const [concept, setConcept] = useState('performance');
  const [live, setLive] = useState(null);
  const mine = state.social.videos.map((v) => ({ ...v, me: true }));
  const npc = useMemo(() => trendingSounds(state, 8).map((sn, i) => ({ id: `yt${sn.id}`, title: sn.title, rival: sn.rival, views: sn.lifetimeStreams * 0.3, week: sn.releasedWeek, gradient: sn.cover?.gradient ?? i })), [state.week]); // eslint-disable-line react-hooks/exhaustive-deps
  const vids = chip === 'mine' ? mine : [...mine.slice(0, 2), ...npc, ...mine.slice(2)];
  const dir = VIDEO_DIRECTORS.find((d) => d.id === director);
  const con = VIDEO_CONCEPTS.find((c) => c.id === concept);
  return (
    <div className="yt">
      <div className="yt-top"><span className="yt-logo"><i><Icon name="play" size={12} fill="#fff" /></i>TreblrTube</span><button className="icon-btn ghost" aria-label="Upload" onClick={() => { setSel(eligible[0]?.id); setUpload(true); }}><Icon name="upload" /></button></div>
      <div className="yt-chips">{[['all', 'All'], ['mine', 'Your channel'], ['shorts', 'Shorts'], ['live', 'Live']].map(([k, l]) => <button key={k} className={chip === k ? 'on' : ''} onClick={() => setChip(k)}>{l}</button>)}</div>
      {(chip === 'all' || chip === 'mine') && (
        <>
          {chip === 'mine' && <div className="row mt12"><img className="avatar" src={facePhoto(p)} alt="" style={{ width: 56, height: 56 }} /><div className="grow"><b style={{ fontSize: 18 }}>{p.stageName}</b><div className="small muted">@{myHandle(p)} · {fmtNum(p.followers.viewtube)} subscribers · {mine.length} videos</div></div></div>}
          <button className="btn block mt12 yt-red" disabled={!eligible.length} onClick={() => { setSel(eligible[0]?.id); setUpload(true); }}><Icon name="video" size={18} />Upload a music video</button>
          {!eligible.length && <div className="tiny muted mt8" style={{ textAlign: 'center' }}>Release or schedule a song without a video first.</div>}
          <div className="yt-grid">
            {vids.map((v) => (
              <button key={v.id} className="yt-vid press" onClick={() => setWatch(v)}>
                <div className="yt-thumb" style={{ background: grad(v.gradient || 0) }}>{v.rival && <ArtistAvatar rival={v.rival} size={70} radius={18} />}<span className="yt-dur">3:{String(10 + ((v.title?.length || 3) * 7) % 49).padStart(2, '0')}</span></div>
                <div className="row gap6 mt8" style={{ alignItems: 'flex-start' }}>
                  {v.rival ? <ArtistAvatar rival={v.rival} size={32} /> : <img className="avatar" style={{ width: 32, height: 32 }} src={facePhoto(p)} alt="" />}
                  <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}><div className="small" style={{ fontWeight: 600 }}>{v.me ? p.stageName : v.rival.name} - {v.title} (Official Video)</div><div className="tiny muted">{fmtNum(v.views)} views · week {Math.max(1, v.week)}</div></div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {chip === 'shorts' && <div className="tg-reels mt12">{[...state.social.clipz.slice(0, 6), ...npc.slice(0, 6)].map((c) => <div key={c.id} className="tg-reel" style={{ background: c.rival ? grad(c.gradient) : '#1c1c1c' }}>{c.rival && <ArtistAvatar rival={c.rival} size={44} />}<div className="tiny"><b>{c.title}</b><div>{fmtNum(c.views)} views</div></div></div>)}</div>}
      {chip === 'live' && (
        <div className="mt12">
          <div className="tt-livebox"><span className="tt-live-badge yt">LIVE</span>{live ? <><div className="num" style={{ fontSize: 26 }}>{fmtNum(live.viewers)} watching</div><div className="small">{fmtMoney(live.tips)} in Super Chats</div><div className="tt-chat">{live.chat.map((c, i) => <div key={i}><b>{c.user}</b> {c.text}</div>)}</div></> : <div className="small muted">Premiere a live session to your subscribers.</div>}</div>
          <button className="btn block mt12 yt-red" disabled={p.socialEnergy < SOCIAL.live || (state.weekStats?.live || 0) >= 1} onClick={() => { const r = act(goLive, { platform: 'treblrtube' }); if (r.ok) setLive(r.data); }}>Go live · {SOCIAL.live} social</button>
        </div>
      )}
      <Sheet open={!!watch} onClose={() => setWatch(null)} title={watch ? `${watch.me ? p.stageName : watch.rival?.name} - ${watch.title} (Official Video)` : ''}>
        {watch && (
          <>
            <div className="yt-player" style={{ background: grad(watch.gradient || 0) }}><div className="yt-playbtn"><Icon name="play" size={22} fill="#fff" /></div></div>
            <div className="row between mt12 small"><span>{fmtNum(watch.views)} views</span><span><Icon name="heart" size={14} /> {fmtNum(watch.likes || watch.views * 0.035)}</span></div>
            <div className="row mt12">{watch.rival ? <ArtistAvatar rival={watch.rival} size={40} onClick={() => { setWatch(null); openArtist(watch.rival.id); }} /> : <img className="avatar" src={facePhoto(p)} alt="" />}<div className="grow"><b>{watch.me ? p.stageName : watch.rival.name}</b><div className="tiny muted">{watch.me ? `${fmtNum(p.followers.viewtube)} subscribers` : `${fmtNum(watch.rival.monthlyListeners * 0.3)} subscribers`}</div></div><button className="btn sm" style={{ background: '#fff', color: '#000' }}>Subscribe</button></div>
            {watch.me && <div className="tiny muted mt8">{VIDEO_DIRECTORS.find((d) => d.id === watch.tier)?.name} · {VIDEO_CONCEPTS.find((c) => c.id === watch.concept)?.name || 'Performance'} · video score {watch.quality ?? '—'}</div>}
            <Mono className="mt16">Comments</Mono>
            {(watch.comments?.length ? watch.comments : fanComments(state, createRng(hashString(watch.id)), { n: 4 })).map((c, i) => <div key={i} className="list-item small"><b>{c.user}</b><span className="grow">{c.text}</span></div>)}
          </>
        )}
      </Sheet>
      <Sheet open={upload} onClose={() => setUpload(false)} title="Upload a music video" sub={`${ENERGY.video + (con?.energy || 0)} energy · views pay ad revenue and lift streams`}>
        <select value={sel || ''} onChange={(e) => setSel(e.target.value)} aria-label="Song">{eligible.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <Mono className="mt16">Director</Mono>
        <div className="col mt8">{VIDEO_DIRECTORS.map((d) => <button key={d.id} className={`option press ${director === d.id ? 'on' : ''}`} style={{ '--accent': '#FF0033' }} onClick={() => setDirector(d.id)}><div className="row between"><b>{d.name}</b><span className="small">{d.cost ? fmtMoney(Math.round(d.cost * (con?.costMult || 1))) : 'Free'}</span></div><div className="tiny muted mt8">{d.tier} · craft {d.quality} · ×{d.mult} reach</div></button>)}</div>
        <Mono className="mt16">Concept</Mono>
        <div className="col mt8">{VIDEO_CONCEPTS.map((c) => <button key={c.id} className={`option press ${concept === c.id ? 'on' : ''}`} style={{ '--accent': '#FF0033' }} onClick={() => setConcept(c.id)}><div className="row between"><b>{c.name}</b>{c.genres && <span className="tiny muted">best for {c.genres.slice(0, 3).map(genreName).join(', ')}</span>}</div><div className="tiny muted mt8">{c.desc}</div></button>)}</div>
        <button className="btn block mt16 yt-red" disabled={!sel || p.cash < Math.round((dir?.cost || 0) * (con?.costMult || 1))} onClick={() => { if (act(makeVideo, { songId: sel, director, concept }).ok) setUpload(false); }}>Shoot & upload</button>
      </Sheet>
    </div>
  );
}
