// New Treblr-branded apps (original names & UI): Treblrpedia (encyclopedia), Treblr Fortune (rich
// lists), Treblrfork (reviews), TreblrCloud (demos & underground buzz), Treblr HiFi (lossless
// streaming) and TreblrTunes (download store & sales chart). Plus the placeholder Store.
import { useMemo, useState } from 'react';
import {
  fmtNum, fmtMoney, genreName, cityById, tierLabel, formatWeekDate, certName, SONG_CERTS, ALBUM_CERTS, netWorth, assetsValue,
  createRng, hashString, cloudUpload, STORE_ITEMS, fameInfo, labelById, rivalLabelId, ACTING_ROLES, popularityFromListeners,
} from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Empty, facePhoto, ArtistAvatar, ArtistArt, AppNav, Sheet } from '../ui/kit.jsx';
import { CertBadge } from './media.jsx';

const yearOf = (w) => 2027 + Math.floor((w - 1) / 52);
const hrand = (key, lo, hi) => { const r = createRng(hashString(key)); return r.float(lo, hi); };

/* =============================== Treblrpedia =============================== */
export function Treblrpedia() {
  const { state } = useGame();
  const [page, setPage] = useState('me');
  const [q, setQ] = useState('');
  const results = q.trim() ? state.rivals.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10) : [];
  const rival = page !== 'me' && state.rivals.find((r) => r.id === page);
  return (
    <div className="wp">
      <div className="wp-top"><span className="wp-logo">Treblr<span>pedia</span></span><span className="tiny muted">The free music encyclopedia</span></div>
      <div className="phone-search wp-search"><Icon name="search" size={18} color="#555" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Treblrpedia" aria-label="Search Treblrpedia" /></div>
      {q.trim() && (
        <div className="wp-results">
          {state.player.stageName.toLowerCase().includes(q.toLowerCase()) && <button onClick={() => { setPage('me'); setQ(''); }}>{state.player.stageName}</button>}
          {results.map((r) => <button key={r.id} onClick={() => { setPage(r.id); setQ(''); }}>{r.name}</button>)}
          {!results.length && <div className="small muted">No pages match.</div>}
        </div>
      )}
      {page === 'me' ? <PlayerArticle onOpen={setPage} /> : rival ? <RivalArticle r={rival} onBack={() => setPage('me')} /> : null}
    </div>
  );
}
function Infobox({ title, image, rows }) {
  return (
    <table className="wp-infobox"><tbody>
      <tr><th colSpan={2} className="wp-ib-title">{title}</th></tr>
      {image && <tr><td colSpan={2} className="wp-ib-img">{image}</td></tr>}
      {rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
    </tbody></table>
  );
}
function PlayerArticle({ onOpen }) {
  const { state } = useGame();
  const p = state.player;
  const city = cityById(p.city);
  const out = state.releases.filter((r) => r.status === 'out');
  const firstYear = out.length ? yearOf(Math.min(...out.map((r) => r.releaseWeek))) : null;
  const collabs = [...new Set(state.songs.filter((x) => x.feat).map((x) => x.feat))].map((id) => state.rivals.find((r) => r.id === id)).filter(Boolean);
  const awards = (p.awards || []).filter((a) => a.kind === 'award');
  const certs = [...state.songs.filter((x) => x.cert).map((x) => ({ t: x.title, c: certName(x.cert) })), ...state.releases.filter((x) => x.cert).map((x) => ({ t: x.title, c: certName(x.cert, ALBUM_CERTS) }))];
  const fame = fameInfo(state);
  const hist = (state.timeline || []).slice().reverse();
  const sections = [
    ['Early career', hist.filter((t) => ['release', 'deal', 'viral'].includes(t.kind)).slice(0, 4)],
    ['Commercial success', hist.filter((t) => ['chart', 'cert', 'fame'].includes(t.kind)).slice(0, 6)],
    ['Touring and live', hist.filter((t) => ['tour', 'festival'].includes(t.kind)).slice(0, 4)],
    ['Acting', hist.filter((t) => t.kind === 'acting').slice(0, 4)],
    ['Personal life', hist.filter((t) => ['dating', 'scandal', 'beef', 'life'].includes(t.kind)).slice(0, 4)],
  ].filter(([, list]) => list.length);
  return (
    <article className="wp-article">
      <h1 className="wp-h1">{p.stageName}</h1>
      <div className="wp-from">From Treblrpedia, the free music encyclopedia</div>
      <Infobox title={p.stageName} image={<img src={facePhoto(p)} alt="" />} rows={[
        ['Birth name', `${p.firstName} ${p.lastName}`], ['Age', p.age], ['Origin', `${city.name}`], ['Genres', [genreName(p.genre), ...(p.subgenres || [])].join(', ')],
        ['Years active', firstYear ? `${firstYear}–present` : 'Upcoming'], ['Labels', p.label ? p.label.name : 'Independent'], ['Status', fame.tier.name],
        ['Associated acts', collabs.length ? collabs.map((r) => r.name).join(', ') : null],
      ]} />
      <p><b>{p.stageName}</b> (born {p.firstName} {p.lastName}) is a {genreName(p.genre).toLowerCase()} artist from {city.name}{firstYear ? `, active since ${firstYear}` : ''}. {out.length ? `They have released ${out.length} record${out.length > 1 ? 's' : ''}` : 'They have not yet released music'}{p.bestRank ? `, with a best Hot 100 peak of number ${p.bestRank}` : ''}{p.lifetimeStreams ? ` and ${fmtNum(p.lifetimeStreams)} career streams` : ''}.</p>
      {sections.map(([h, list]) => (
        <section key={h}><h2 className="wp-h2">{h}</h2><p>{list.map((t) => `In ${formatWeekDate(t.week, { month: 'long', year: 'numeric' })}, ${t.title.charAt(0).toLowerCase()}${t.title.slice(1)}${t.detail ? ` (${t.detail})` : ''}.`).join(' ')}</p></section>
      ))}
      <h2 className="wp-h2">Discography</h2>
      {out.length ? (
        <table className="wp-table"><thead><tr><th>Title</th><th>Type</th><th>Year</th><th>Peak</th></tr></thead><tbody>
          {out.map((r) => { const songs = r.songIds.map((id) => state.songs.find((x) => x.id === id)).filter(Boolean); const pk = r.type === 'single' ? songs[0]?.peaks?.hot100 : r.peaks?.album; return <tr key={r.id}><td><i>{r.title}</i></td><td>{r.type === 'single' ? 'Single' : r.type.toUpperCase()}</td><td>{yearOf(r.releaseWeek)}</td><td>{pk ? `#${pk}` : '-'}</td></tr>; })}
        </tbody></table>
      ) : <p className="muted">No releases yet.</p>}
      {certs.length > 0 && (<><h2 className="wp-h2">Certifications</h2><ul>{certs.map((c, i) => <li key={i}><i>{c.t}</i>, {c.c}</li>)}</ul></>)}
      {state.acting?.credits?.length > 0 && (<><h2 className="wp-h2">Filmography</h2><ul>{state.acting.credits.map((c) => <li key={c.id}><i>{c.title}</i> ({yearOf(c.releaseWeek)}), {c.role}</li>)}</ul></>)}
      {awards.length > 0 && (<><h2 className="wp-h2">Awards</h2><ul>{awards.map((a, i) => <li key={i}>{a.name} ({yearOf(a.week)})</li>)}</ul></>)}
      {collabs.length > 0 && (<><h2 className="wp-h2">See also</h2><ul>{collabs.map((r) => <li key={r.id}><button className="wp-link" onClick={() => onOpen(r.id)}>{r.name}</button></li>)}</ul></>)}
      <div className="wp-foot">This page was last edited in week {state.week}. Text is generated from your in-game career.</div>
    </article>
  );
}
function RivalArticle({ r, onBack }) {
  const { state } = useGame();
  const songs = state.rivalSongs.filter((x) => x.rivalId === r.id).sort((a, b) => b.releasedWeek - a.releasedWeek);
  const albums = state.rivalAlbums.filter((x) => x.rivalId === r.id).sort((a, b) => b.releasedWeek - a.releasedWeek);
  const label = labelById(rivalLabelId(r));
  const peak = (id) => { const e = (state.charts.hot100 || []).find((x) => x.id === id); return e ? e.pk : null; };
  return (
    <article className="wp-article">
      <button className="wp-link small" onClick={onBack}>← Back to your page</button>
      <h1 className="wp-h1">{r.name}</h1>
      <div className="wp-from">From Treblrpedia, the free music encyclopedia</div>
      <Infobox title={r.name} image={<ArtistAvatar rival={r} size={160} radius={8} />} rows={[
        ['Origin', r.country], ['Genres', (r.genres || [r.genre]).map(genreName).join(', ')], ['Status', tierLabel(r.tier)], ['Label (in game)', label?.name],
        ['Monthly listeners', fmtNum(r.monthlyListeners)],
      ]} />
      <p><b>{r.name}</b> is a {(r.genres || [r.genre]).map(genreName).join(' and ').toLowerCase()} act{r.real ? '' : ' (fictional)'} with around {fmtNum(r.monthlyListeners)} monthly listeners. {r.lastMove}.</p>
      <h2 className="wp-h2">Recent releases (in this world)</h2>
      <p className="tiny muted">Song and album titles in Treblr are generated and fictional.</p>
      <table className="wp-table"><thead><tr><th>Title</th><th>Type</th><th>Year</th><th>Peak</th></tr></thead><tbody>
        {albums.slice(0, 3).map((a) => <tr key={a.id}><td><i>{a.title}</i></td><td>Album</td><td>{a.releasedWeek > 0 ? yearOf(a.releasedWeek) : 2026}</td><td>{a.firstWeek ? `${fmtNum(a.firstWeek)} 1st wk` : '-'}</td></tr>)}
        {songs.slice(0, 6).map((x) => <tr key={x.id}><td><i>{x.title}</i></td><td>Single</td><td>{x.releasedWeek > 0 ? yearOf(x.releasedWeek) : 2026}</td><td>{peak(x.id) ? `#${peak(x.id)}` : '-'}</td></tr>)}
      </tbody></table>
    </article>
  );
}

/* =============================== Treblr Fortune =============================== */
export function npcNetWorth(r) {
  const yrs = { superstar: 12, star: 8, established: 5, rising: 2 }[r.tier] || 3;
  return Math.round(r.baseML * 0.9 * yrs * hrand(`nw${r.name}`, 0.6, 1.5) / 1e6) * 1e6;
}
export function npcEarnings(r) {
  return Math.round(r.monthlyListeners * 0.55 * hrand(`er${r.name}`, 0.6, 1.4) / 1e5) * 1e5;
}
export function TreblrFortune() {
  const { state } = useGame();
  const [list, setList] = useState('earners');
  const p = state.player;
  const yearIncome = (state.history || []).slice(-52).reduce((a, h) => a + Object.entries(h.income || {}).filter(([k]) => !['advance', 'loan'].includes(k)).reduce((x, [, v]) => x + v, 0), 0);
  const rows = useMemo(() => {
    const npc = state.rivals.map((r) => ({ id: r.id, name: r.name, v: list === 'earners' ? npcEarnings(r) : npcNetWorth(r), rival: r }));
    return [...npc, { id: 'me', name: p.stageName, v: list === 'earners' ? yearIncome : netWorth(state), me: true }].sort((a, b) => b.v - a.v);
  }, [state, list, p.stageName, yearIncome]);
  const myRank = rows.findIndex((x) => x.me) + 1;
  return (
    <div className="fo">
      <div className="fo-top"><span className="fo-logo">FORTUNE</span><span className="fo-sub">by Treblr</span></div>
      <div className="fo-tabs"><button className={list === 'earners' ? 'on' : ''} onClick={() => setList('earners')}>Top-Earning Musicians {yearOf(state.week)}</button><button className={list === 'worth' ? 'on' : ''} onClick={() => setList('worth')}>Net Worth</button></div>
      <div className="fo-me">
        <img src={facePhoto(p)} alt="" />
        <div className="grow" style={{ minWidth: 0 }}><Mono className="sm" style={{ color: '#b8860b' }}>Your ranking</Mono><b className="ellipsis" style={{ display: 'block' }}>#{myRank} · {p.stageName}</b><div className="tiny" style={{ color: '#555' }}>{list === 'earners' ? `${fmtMoney(yearIncome)} over the last 12 months` : `${fmtMoney(netWorth(state))} net worth (cash ${fmtMoney(p.cash)} + assets ${fmtMoney(assetsValue(state))} − debt)`}</div></div>
      </div>
      <ol className="fo-list">
        {rows.slice(0, 40).map((x, i) => (
          <li key={x.id} className={x.me ? 'me' : ''}>
            <span className="fo-rank">{i + 1}</span>
            {x.me ? <img className="avatar" src={facePhoto(p)} alt="" style={{ width: 36, height: 36 }} /> : <ArtistAvatar rival={x.rival} size={36} />}
            <span className="grow ellipsis">{x.name}</span>
            <b>{fmtMoney(x.v)}</b>
          </li>
        ))}
        {myRank > 40 && <li className="me"><span className="fo-rank">{myRank}</span><img className="avatar" src={facePhoto(p)} alt="" style={{ width: 36, height: 36 }} /><span className="grow ellipsis">{p.stageName}</span><b>{fmtMoney(rows[myRank - 1].v)}</b></li>}
      </ol>
      <div className="tiny" style={{ color: '#666', padding: '8px 0' }}>NPC figures are in-game estimates scaled from listener counts, not real reported earnings.</div>
    </div>
  );
}

/* =============================== Treblrfork =============================== */
export function npcReview(a) {
  const r = createRng(hashString(`rev${a.id}${a.title}`));
  const score = Math.round(Math.min(9.6, Math.max(3.2, r.float(4.8, 8.9) + (r.chance(0.08) ? 0.8 : 0))) * 10) / 10;
  return { score, bnm: score >= 8.3 };
}
const BLURB = [
  (t, n) => `On “${t}”, ${n} sounds like they finally trust the quiet parts.`,
  (t, n) => `“${t}” is ${n} at full volume, not every swing lands, but the big ones do.`,
  (t, n) => `${n}’s “${t}” is a tidy record that rarely risks anything.`,
  (t, n) => `A restless, generous record: “${t}” keeps rewarding repeat listens from ${n}.`,
  (t, n) => `${n} spreads “${t}” thin; the singles carry a lot of weight.`,
];
export function Treblrfork() {
  const { state } = useGame();
  const p = state.player;
  const [open, setOpen] = useState(null);
  const mine = state.releases.filter((r) => r.status === 'out' && r.review).map((r) => ({ id: r.id, title: r.title, artist: p.stageName, cover: r.cover, type: r.type, week: r.releaseWeek, ...r.review, me: true }));
  const npc = state.rivalAlbums.filter((a) => a.releasedWeek > 0).map((a) => { const r = state.rivals.find((x) => x.id === a.rivalId); return { id: a.id, title: a.title, artist: r?.name || '-', cover: a.cover, type: 'album', week: a.releasedWeek, ...npcReview(a) }; });
  const all = [...mine, ...npc].sort((a, b) => b.week - a.week).slice(0, 30);
  const bnm = all.filter((x) => x.bnm).slice(0, 6);
  const item = open && all.find((x) => x.id === open);
  return (
    <div className="pf">
      <div className="pf-top"><span className="pf-logo">TREBLRFORK</span></div>
      {bnm.length > 0 && (<><div className="pf-sec">Best New Music</div><div className="sp-shelf">{bnm.map((x) => <button key={x.id} className="sp-pl" onClick={() => setOpen(x.id)}><Cover cover={x.cover} title={x.title} size={120} radius={0} /><div className="tiny ellipsis mt8"><b>{x.artist}</b></div><div className="tiny ellipsis" style={{ fontStyle: 'italic' }}>{x.title}</div></button>)}</div></>)}
      <div className="pf-sec">Latest Reviews</div>
      {all.map((x) => (
        <button key={x.id} className={`pf-row ${x.me ? 'me' : ''}`} onClick={() => setOpen(x.id)}>
          <Cover cover={x.cover} title={x.title} size={64} radius={0} />
          <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{x.artist}</b><i className="ellipsis" style={{ display: 'block' }}>{x.title}</i><span className="tiny" style={{ color: '#777' }}>{x.type === 'ep' ? 'EP' : 'Album'} · Week {x.week}</span></div>
          <span className={`pf-score ${x.bnm ? 'bnm' : ''}`}>{x.score.toFixed(1)}</span>
        </button>
      ))}
      {!all.length && <Empty icon="news">Reviews arrive as albums and EPs drop.</Empty>}
      <Sheet open={!!item} onClose={() => setOpen(null)} title={item?.title} sub={item?.artist}>
        {item && (<div className="col gap12"><div className="row"><Cover cover={item.cover} title={item.title} size={110} radius={0} /><div><span className={`pf-score big ${item.bnm ? 'bnm' : ''}`}>{item.score.toFixed(1)}</span>{item.bnm && <div className="pf-bnm">Best New Music</div>}</div></div><p style={{ margin: 0 }}>{BLURB[hashString(item.id) % BLURB.length](item.title, item.artist)}</p></div>)}
      </Sheet>
    </div>
  );
}

/* =============================== TreblrCloud =============================== */
const UNDERGROUND = ['lofi.kaito', 'sadgirlstation', 'basement_vox', 'noirwave', 'pixelchoir', 'gutterbloom', 'moth.fm', 'dustyrhodes', 'kilnhouse', 'velvetfog'];
export function TreblrCloud() {
  const { state, act } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('home');
  const cloud = state.cloud || { followers: 0, uploads: [] };
  const eligible = state.songs.filter((x) => ['written', 'recorded'].includes(x.status));
  const [sel, setSel] = useState(eligible[0]?.id);
  const feed = useMemo(() => { const r = createRng(hashString(`cl${state.week}`)); return UNDERGROUND.map((u, i) => ({ id: u, user: u, title: `${r.pick(['untitled', 'demo', 'bounce', 'voice memo', 'idea'])} ${r.int(1, 40)}`, plays: r.int(800, 90000), genre: r.pick(['indie', 'electronic', 'hiphop', 'rnb', 'alternative']), i })); }, [state.week]);
  return (
    <div className="appwrap sc">
      <div className="sc-top"><span className="sc-logo"><Icon name="radio" size={18} /> TreblrCloud</span><span className="tiny muted">{fmtNum(cloud.followers)} followers</span></div>
      {tab === 'home' && (
        <>
          <Mono className="mt12">Your uploads</Mono>
          {cloud.uploads.length ? cloud.uploads.map((u) => <div key={u.id} className="sc-track"><div className="sc-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${20 + ((hashString(u.id + i) % 70))}%` }} />)}</div><div className="row between small mt8 gap6"><b className="ellipsis">{u.title}{u.kind === 'leak' ? ' (leak)' : ' (demo)'}</b><span className="muted" style={{ flexShrink: 0 }}>▶ {fmtNum(u.plays)} · ⟲ {fmtNum(u.reposts)}</span></div></div>) : <Empty icon="upload">Upload a demo to build underground buzz before release.</Empty>}
          <Mono className="mt16">From the underground</Mono>
          {feed.map((x) => <div key={x.id} className="sc-row"><ArtistArt name={x.user} genres={[x.genre]} size={44} radius={4} /><div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{x.title}</b><span className="tiny muted">{x.user} · ▶ {fmtNum(x.plays)}</span></div></div>)}
        </>
      )}
      {tab === 'upload' && (
        <div className="col gap12 mt12">
          <div className="small muted">Uploading an unreleased song builds buzz that boosts its first weeks. “Leaking” a finished recording gets far more plays and hype, but some of the surprise is gone on release day.</div>
          {eligible.length ? (
            <>
              <select value={sel || ''} onChange={(e) => setSel(e.target.value)} aria-label="Song">{eligible.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.status} · Q{x.quality}</option>)}</select>
              <button className="btn block sc-btn" disabled={p.socialEnergy < 6} onClick={() => act(cloudUpload, { songId: sel || eligible[0].id, kind: 'demo' })}>Upload demo · 6 social</button>
              <button className="btn block" disabled={p.socialEnergy < 6 || state.songs.find((x) => x.id === (sel || eligible[0].id))?.status !== 'recorded'} onClick={() => act(cloudUpload, { songId: sel || eligible[0].id, kind: 'leak' })}>“Leak” the recording · 6 social</button>
            </>
          ) : <Empty icon="pen">Write or record something first.</Empty>}
        </div>
      )}
      {tab === 'library' && (
        <div className="mt12"><Mono>Likes</Mono>{feed.slice(0, 4).map((x) => <div key={x.id} className="sc-row"><ArtistArt name={x.user} genres={[x.genre]} size={44} radius={4} /><div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{x.title}</b><span className="tiny muted">{x.user}</span></div></div>)}</div>
      )}
      <AppNav className="sc-nav" value={tab} onChange={setTab} items={[
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'upload', label: 'Upload', icon: 'upload' },
        { id: 'library', label: 'Library', icon: 'library' },
      ]} />
    </div>
  );
}

/* =============================== Treblr HiFi =============================== */
export function TreblrHiFi() {
  const { state, openArtist } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('home');
  const top = state.rivalSongs.slice().sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, 12);
  const mine = state.songs.filter((x) => x.status === 'released').sort((a, b) => b.weeklyStreams - a.weeklyStreams);
  const hifiPlays = Math.round(mine.reduce((a, x) => a + (x.weeklyStreams || 0), 0) * 0.025);
  const rising = state.rivals.filter((r) => r.tier === 'rising' || r.tier === 'established').sort((a, b) => b.monthlyListeners - a.monthlyListeners).slice(0, 8);
  return (
    <div className="appwrap hf">
      {tab === 'home' && (
        <>
          <div className="hf-hero"><Mono className="sm">Master quality</Mono><h2>Hear every detail.</h2><div className="tiny muted">Lossless and hi-res audio. Artist-first payouts.</div></div>
          <h3 className="hf-h">Top tracks this week</h3>
          {top.map((s, i) => { const r = state.rivals.find((x) => x.id === s.rivalId); return <div key={s.id} className="list-item"><span className="hf-rank">{String(i + 1).padStart(2, '0')}</span><Cover cover={s.cover} size={44} radius={2} /><div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600 }}>{s.title}</div><div className="tiny muted ellipsis">{r?.name}</div></div><span className="hf-tag">MAX</span></div>; })}
          <h3 className="hf-h">Rising</h3>
          <div className="sp-shelf">{rising.map((r) => <button key={r.id} className="sp-artist" onClick={() => openArtist(r.id)}><ArtistAvatar rival={r} size={88} radius={4} /><div className="tiny ellipsis">{r.name}</div></button>)}</div>
        </>
      )}
      {tab === 'me' && (
        <>
          <div className="row mt12"><img src={facePhoto(p)} alt="" style={{ width: 72, height: 72, objectFit: 'cover' }} /><div className="grow" style={{ minWidth: 0 }}><b style={{ fontSize: 20 }} className="ellipsis">{p.stageName}</b><div className="tiny muted">~{fmtNum(hifiPlays)} plays this week · ~$0.0128 per play</div></div></div>
          <div className="card tight mt12"><div className="row between small"><span>Estimated HiFi payout this week</span><b className="up">{fmtMoney(hifiPlays * 0.0128 * (p.label ? p.label.royalty : 1))}</b></div><div className="tiny muted mt8">HiFi listeners are a small share of your streams (included in your weekly streaming royalties).</div></div>
          <h3 className="hf-h">Your tracks</h3>
          {mine.length ? mine.slice(0, 10).map((s, i) => <div key={s.id} className="list-item"><span className="hf-rank">{String(i + 1).padStart(2, '0')}</span><Cover cover={s.cover} size={44} radius={2} /><div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600 }}>{s.title}</div><div className="tiny muted">{fmtNum(Math.round(s.weeklyStreams * 0.025))} HiFi plays</div></div></div>) : <Empty icon="play">Release music to appear here.</Empty>}
        </>
      )}
      <AppNav className="hf-nav" value={tab} onChange={setTab} items={[{ id: 'home', label: 'Home', icon: 'home' }, { id: 'me', label: 'My Collection', icon: 'library' }]} />
    </div>
  );
}

/* =============================== TreblrTunes =============================== */
export function TreblrTunes() {
  const { state } = useGame();
  const p = state.player;
  const [tab, setTab] = useState('songs');
  const songs = useMemo(() => {
    const npc = state.rivalSongs.map((s) => ({ id: s.id, title: s.title, artist: state.rivals.find((r) => r.id === s.rivalId)?.name, cover: s.cover, sales: Math.round((s.weeklyStreams || 0) / (state.week - s.releasedWeek <= 1 ? 600 : 1100) * hrand(s.id + state.week, 0.8, 1.2)) }));
    const mine = state.songs.filter((s) => s.status === 'released').map((s) => ({ id: s.id, title: s.title, artist: p.stageName, cover: s.cover, sales: s.weeklySales || 0, me: true }));
    return [...npc, ...mine].sort((a, b) => b.sales - a.sales).slice(0, 50);
  }, [state, p.stageName]);
  const albums = useMemo(() => {
    const npc = state.rivalAlbums.map((a) => ({ id: a.id, title: a.title, artist: state.rivals.find((r) => r.id === a.rivalId)?.name, cover: a.cover, sales: Math.round((a.weeklyUnits || 0) * 0.35) }));
    const mine = state.releases.filter((r) => r.status === 'out' && r.type !== 'single').map((r) => ({ id: r.id, title: r.title, artist: p.stageName, cover: r.cover, sales: Math.round((r.weeklyUnits || 0) * 0.35), me: true }));
    return [...npc, ...mine].filter((x) => x.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 25);
  }, [state, p.stageName]);
  const list = tab === 'songs' ? songs : albums;
  const totalMine = state.songs.reduce((a, s) => a + (s.lifetimeSales || 0), 0);
  return (
    <div className="appwrap it">
      <div className="it-top"><span className="it-logo"><Icon name="star" size={18} /> TreblrTunes Store</span></div>
      <div className="card tight mt12"><div className="row between small"><span>Your download sales</span><b>{fmtNum(totalMine)} lifetime</b></div><div className="tiny muted mt8">$0.69 per download (70% to the rightsholder). Sales also count toward album units.</div></div>
      <div className="it-head mt12"><b>{tab === 'songs' ? 'Top Songs' : 'Top Albums'}</b><span className="tiny muted">this week</span></div>
      {list.map((x, i) => (
        <div key={x.id} className={`it-row ${x.me ? 'me' : ''}`}>
          <span className="it-rank">{i + 1}</span><Cover cover={x.cover} size={48} radius={4} />
          <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{x.title}</b><span className="tiny muted ellipsis" style={{ display: 'block' }}>{x.artist}</span></div>
          <span className="it-price">{tab === 'songs' ? '$0.69' : '$9.99'}</span>
        </div>
      ))}
      <AppNav className="it-nav" value={tab} onChange={setTab} items={[{ id: 'songs', label: 'Songs', icon: 'disc' }, { id: 'albums', label: 'Albums', icon: 'library' }]} />
    </div>
  );
}

/* =============================== Store (placeholder) =============================== */
export function StoreScreen() {
  return (
    <div className="store">
      <div className="store-banner"><Mono className="sm">Coming soon</Mono><h2>Treblr Store</h2><div className="small">Nothing here can be bought yet. No payments are taken and no card details are ever asked for.</div></div>
      <Mono className="mt16">In-game cash</Mono>
      {STORE_ITEMS.cash.map((x) => <div key={x.id} className="store-item"><Icon name="cash" color="#3DDC84" /><div className="grow"><b>{x.name}</b><div className="tiny muted">{x.amount}</div></div><button className="btn sm" disabled>Soon</button></div>)}
      <Mono className="mt16">Promo streams</Mono>
      {STORE_ITEMS.promo.map((x) => <div key={x.id} className="store-item"><Icon name="flame" color="#FFB020" /><div className="grow"><b>{x.name}</b><div className="tiny muted">{x.amount}</div></div><button className="btn sm" disabled>Soon</button></div>)}
      <Mono className="mt16">Subscription</Mono>
      <div className="store-sub"><b>{STORE_ITEMS.sub.name}</b><ul>{STORE_ITEMS.sub.perks.map((x) => <li key={x}>{x}</li>)}</ul><button className="btn block" disabled>Coming soon</button></div>
    </div>
  );
}

export { ACTING_ROLES, popularityFromListeners, SONG_CERTS, CertBadge };
