import { useMemo, useState } from 'react';
import {
  GENRES, THEMES, COWRITERS, PRODUCERS, ROLLOUTS, COVER_GRADIENTS, ENERGY, CHARTS,
  writeSong, recordSong, releaseMusic, projectWriteQuality, projectRecordQuality, lengthFit, randomTitle,
  fmtMoney, fmtNum, fmtLength, genreName, producerPrice, sequencingScore, requestFeature, featureQuote, tierLabel, eraOf,
  releaseFatigue, COVER_STYLES, SONG_CERTS, ALBUM_CERTS, certName, nextCert, receptionLabel, deleteSong, pitchPlaylist, promoIdea, promoIdeasFor,
  buyAds, AD_TIERS, ROLLOUT_STEPS, rolloutStep, SOCIAL, cloudUpload,
} from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Seg, Bar, Sheet, UploadButton, Empty, SAMPLE_COVERS, ArtistAvatar } from '../ui/kit.jsx';
import { CertBadge } from '../phone/media.jsx';

const TABS = [{ value: 'write', label: 'Write' }, { value: 'record', label: 'Record' }, { value: 'collab', label: 'Collab' }, { value: 'release', label: 'Release' }, { value: 'catalog', label: 'Catalog' }];

export default function Studio({ initial, rival }) {
  const [tab, setTab] = useState(initial || 'write');
  return (
    <div className="screen">
      <div className="row between">
        <div><Mono style={{ color: 'var(--coral)' }}>Studio</Mono><h1 style={{ fontSize: 30 }}>{TABS.find((t) => t.value === tab).label}</h1></div>
        <Icon name="mic" size={30} color="#FF6B4A" />
      </div>
      <div className="mt16"><Seg options={TABS} value={tab} onChange={setTab} /></div>
      <div key={tab} style={{ animation: 'fade .25s' }}>
        {tab === 'write' && <Write onDone={() => setTab('record')} />}
        {tab === 'record' && <Record onDone={() => setTab('release')} />}
        {tab === 'collab' && <Collab initialRival={rival} />}
        {tab === 'release' && <Release onDone={() => setTab('catalog')} />}
        {tab === 'catalog' && <Catalog />}
      </div>
    </div>
  );
}

function qColor(q) { return q >= 75 ? '#3DDC84' : q >= 55 ? '#C6FF3D' : q >= 40 ? '#FFB020' : '#FF4D5E'; }

function Write({ onDone }) {
  const { state, act } = useGame();
  const p = state.player;
  const [title, setTitle] = useState(() => randomTitle());
  const [genre, setGenre] = useState(p.genre);
  const [theme, setTheme] = useState(THEMES[0]);
  const [length, setLength] = useState(195);
  const [cowriter, setCowriter] = useState('none');
  const era = eraOf(state);
  const proj = projectWriteQuality(p, { genre, length, cowriter, eraQuality: era?.vibe === 'dark' ? 2 : 0 });
  const fit = lengthFit(length);
  const cw = COWRITERS.find((c) => c.id === cowriter);
  const submit = () => {
    const r = act(writeSong, { title, genre, theme, length, cowriter });
    if (r.ok) { setTitle(randomTitle()); onDone?.(); }
  };
  return (
    <div className="col gap16 mt16">
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,107,74,.18), var(--surface))' }}>
        <div className="row between">
          <div><Mono>Projected quality</Mono><div className="qmeter" style={{ color: qColor(proj.expected) }}>{proj.min}–{proj.max}</div></div>
          <div style={{ textAlign: 'right' }}><Mono>Cost</Mono><div className="num" style={{ fontSize: 18 }}>{ENERGY.write} <Icon name="bolt" size={14} color="#C6FF3D" fill="#C6FF3D" stroke={0} /></div><div className="small muted">{cw.fee ? fmtMoney(cw.fee) : 'Free'}</div></div>
        </div>
        <div className="mt12"><Bar pct={proj.expected / 100} color={qColor(proj.expected)} /></div>
        <div className="tiny muted mt8">Songwriting {Math.round(p.skills.songwriting)} · {genre === p.genre ? 'In your lane +6' : 'Outside your main genre'}</div>
      </div>

      <label className="col gap6"><Mono>Title</Mono>
        <div className="row"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
          <button className="icon-btn" onClick={() => setTitle(randomTitle())} aria-label="Random title"><Icon name="dice" /></button></div>
      </label>
      <div className="col gap6"><Mono>Genre</Mono>
        <div className="pills">{GENRES.map((g) => <button key={g.id} className={`pill ${genre === g.id ? 'on' : ''}`} onClick={() => setGenre(g.id)}>{g.name}</button>)}</div>
      </div>
      <div className="col gap6"><Mono>Theme</Mono>
        <div className="pills">{THEMES.map((t) => <button key={t} className={`pill ${theme === t ? 'on' : ''}`} onClick={() => setTheme(t)}>{t}</button>)}</div>
      </div>
      <div className="card">
        <div className="row between"><Mono>Length</Mono><span className="num" style={{ fontSize: 20 }}>{fmtLength(length)}</span></div>
        <input type="range" className="slider mt12" style={{ width: '100%' }} min={90} max={360} step={5} value={length} onChange={(e) => setLength(+e.target.value)} />
        <div className="small mt8" style={{ color: fit.bonus > 0 ? 'var(--green)' : fit.bonus < 0 ? 'var(--amber)' : 'var(--muted)' }}>{fit.hint}</div>
      </div>
      <div className="col gap6"><Mono>Co-writers</Mono>
        {COWRITERS.map((c) => (
          <button key={c.id} className={`option press ${cowriter === c.id ? 'on' : ''}`} onClick={() => setCowriter(c.id)}>
            <div className="row between"><b>{c.name}</b><span className="small">{c.fee ? fmtMoney(c.fee) : 'Free'}</span></div>
            <div className="tiny muted mt8">{c.id === 'none' ? 'Keep 100% of the publishing.' : `+${c.bonus} quality · they take ${Math.round(c.share * 100)}% of royalties`}</div>
          </button>
        ))}
      </div>
      <button className="btn accent block" onClick={submit} disabled={p.energy < ENERGY.write || p.cash < cw.fee}>Write song</button>
      {p.energy < ENERGY.write && <div className="tiny muted" style={{ textAlign: 'center' }}>Not enough energy, rest or start next week.</div>}
    </div>
  );
}

function Record({ onDone }) {
  const { state, act } = useGame();
  const written = state.songs.filter((s) => s.status === 'written');
  const [songId, setSongId] = useState(written[0]?.id);
  const [prod, setProd] = useState('local');
  const song = written.find((s) => s.id === songId) || written[0];
  if (!written.length) return <div className="card mt16"><Empty icon="pen">No demos waiting. Write a song first.</Empty></div>;
  const pr = PRODUCERS.find((x) => x.id === prod);
  const price = producerPrice(state, pr);
  const q = song ? projectRecordQuality(state.player, song, prod) : 0;
  return (
    <div className="col gap16 mt16">
      <div className="col gap6"><Mono>Demo</Mono>
        {written.map((s) => (
          <button key={s.id} className={`option press row ${song?.id === s.id ? 'on' : ''}`} onClick={() => setSongId(s.id)}>
            <Cover cover={s.cover} size={40} />
            <div className="grow"><b className="ellipsis">{s.title}</b><div className="tiny muted">{s.diss ? '🔥 Diss track · ' : ''}{genreName(s.genre)} · {s.theme} · {fmtLength(s.length)}{s.featName ? ` · feat. ${s.featName}` : ''}</div></div>
            <span className="num" style={{ color: qColor(s.writeQuality) }}>{s.writeQuality}</span>
          </button>
        ))}
      </div>
      <div className="col gap6"><Mono>Producer</Mono>
        {PRODUCERS.map((x) => (
          <button key={x.id} className={`option press ${prod === x.id ? 'on' : ''}`} onClick={() => setProd(x.id)}>
            <div className="row between"><b>{x.name}</b><span className="small">{x.price ? <>{producerPrice(state, x) < x.price && <s className="muted">{fmtMoney(x.price)}</s>} {fmtMoney(producerPrice(state, x))}</> : 'Free'}</span></div>
            <div className="row between tiny muted mt8"><span>{x.tier} · {x.desc}</span><span>Sound {x.quality}</span></div>
          </button>
        ))}
      </div>
      <div className="card row between">
        <div><Mono>Final quality</Mono><div className="qmeter" style={{ color: qColor(q) }}>{q}</div></div>
        <div style={{ textAlign: 'right' }} className="small muted">{ENERGY.record} energy<br />{price ? fmtMoney(price) : 'Free'}</div>
      </div>
      {song?.feat && <div className="tiny muted">feat. {song.featName} (+3 quality)</div>}
      <button className="btn accent block" disabled={state.player.cash < price || state.player.energy < ENERGY.record} onClick={() => { const r = act(recordSong, { songId: song.id, producerId: prod }); if (r.ok && written.length === 1) onDone?.(); }}>Record “{song?.title}”</button>
    </div>
  );
}

function Release({ onDone }) {
  const { state, act } = useGame();
  const recorded = state.songs.filter((s) => s.status === 'recorded');
  const singles = state.songs.filter((s) => s.status === 'released' && !state.releases.some((r) => r.type !== 'single' && r.songIds.includes(s.id)));
  const [type, setType] = useState('single');
  const [sel, setSel] = useState(recorded[0] ? [recorded[0].id] : []);
  const [title, setTitle] = useState('');
  const [rollout, setRollout] = useState('standard');
  const [cover, setCover] = useState({ gradient: recorded[0]?.cover?.gradient ?? 0 });
  const [weeks, setWeeks] = useState(0);
  const [coverOpen, setCoverOpen] = useState(false);
  const scheduled = state.releases.filter((r) => r.status === 'scheduled');
  if (!recorded.length) {
    return (
      <div className="col gap16 mt16">
        <div className="card"><Empty icon="disc">Nothing recorded and unreleased. Record a demo first.</Empty></div>
        {scheduled.length > 0 && <ScheduledList list={scheduled} />}
      </div>
    );
  }
  const toggle = (id) => {
    if (type === 'single') setSel([id]);
    else setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  };
  const move = (i, d) => { const n = [...sel]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setSel(n); };
  const selSongs = sel.map((id) => state.songs.find((s) => s.id === id)).filter(Boolean);
  const leadCount = selSongs.filter((s) => s.status === 'released').length;
  const seq = type !== 'single' && selSongs.length > 1 ? sequencingScore(selSongs) : null;
  const since = state.player.lastReleaseWeek == null ? null : state.week + weeks - state.player.lastReleaseWeek;
  const fat = releaseFatigue(since);
  const need = type === 'single' ? 'Pick 1 song' : type === 'ep' ? 'Pick 3–6 songs' : 'Pick 7+ songs';
  const ro = ROLLOUTS.find((r) => r.id === rollout);
  const relTitle = title || state.songs.find((s) => s.id === sel[0])?.title || 'Untitled';
  const submit = () => {
    const r = act(releaseMusic, { type, title: relTitle, songIds: sel, rollout, cover, weeksFromNow: weeks });
    if (r.ok) onDone?.();
  };
  return (
    <div className="col gap16 mt16">
      <Seg options={[{ value: 'single', label: 'Single' }, { value: 'ep', label: 'EP' }, { value: 'album', label: 'Album' }]} value={type} onChange={(t) => { setType(t); setSel(t === 'single' ? sel.slice(0, 1) : sel); }} />
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <button onClick={() => setCoverOpen(true)} className="press" aria-label="Edit cover"><Cover cover={cover} title={relTitle} size={110} /></button>
        <div className="grow col gap6">
          <Mono>{type === 'single' ? 'Single' : 'Project'} title</Mono>
          <input value={title} placeholder={relTitle} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
          <button className="btn sm" onClick={() => setCoverOpen(true)}><Icon name="sparkle" size={16} />Cover art</button>
        </div>
      </div>
      <div className="col gap6"><div className="row between"><Mono>Tracklist</Mono><Mono className="sm">{need}</Mono></div>
        {[...recorded, ...(type === 'single' ? [] : singles)].map((s) => (
          <button key={s.id} className={`option press row ${sel.includes(s.id) ? 'on' : ''}`} onClick={() => toggle(s.id)}>
            <Cover cover={s.cover} size={40} />
            <div className="grow"><b className="ellipsis">{s.title}</b><div className="tiny muted">{s.status === 'released' ? 'Released single · counts as a lead single' : `${genreName(s.genre)} · ${fmtLength(s.length)}`}{s.featName ? ` · feat. ${s.featName}` : ''}{s.diss ? ' · 🔥 diss' : ''}</div></div>
            <span className="num" style={{ color: qColor(s.quality) }}>{s.quality}</span>
            {sel.includes(s.id) && <Icon name="check" color="#FF6B4A" />}
          </button>
        ))}
      </div>
      {type !== 'single' && selSongs.length > 1 && (
        <div className="card">
          <div className="row between"><Mono>Track order</Mono><Mono className="sm">Sequencing {Math.round((seq || 0) * 100)}%</Mono></div>
          {selSongs.map((s, i) => (
            <div key={s.id} className="list-item">
              <span className="num" style={{ width: 22 }}>{i + 1}</span>
              <div className="grow"><b className="ellipsis small">{s.title}</b><div className="tiny muted">Q{s.quality}{s.status === 'released' ? ' · lead single' : ''}</div></div>
              <button className="icon-btn" aria-label={`Move ${s.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={18} /></button>
              <button className="icon-btn" aria-label={`Move ${s.title} down`} disabled={i === selSongs.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={18} /></button>
            </div>
          ))}
          <div className="tiny muted mt8">Open strong, front-load your best tracks, close well. {leadCount ? `${leadCount} lead single${leadCount > 1 ? 's' : ''} will boost release week (+${Math.min(3, leadCount) * 12}%).` : 'Releasing 1–3 singles first boosts the project’s release week.'}</div>
        </div>
      )}
      {fat < 1 && <div className="card tight small" style={{ borderColor: 'rgba(255,176,32,.4)', color: 'var(--amber)' }}>Release fatigue: only {since} week{since === 1 ? '' : 's'} since your last drop. Discovery and hype gains ×{fat}. Waiting 4+ weeks avoids it.</div>}
      <div className="col gap6"><Mono>Rollout</Mono>
        {ROLLOUTS.map((r) => (
          <button key={r.id} className={`option press ${rollout === r.id ? 'on' : ''}`} onClick={() => setRollout(r.id)}>
            <div className="row between"><b>{r.name}</b><span className="small">{r.cost ? fmtMoney(r.cost) : 'Free'}</span></div>
            <div className="tiny muted mt8">{r.desc} · +{r.hype} hype · ×{r.mult} streams</div>
          </button>
        ))}
      </div>
      <div className="card">
        <div className="row between"><Mono>Release date</Mono><b>{weeks === 0 ? 'This week' : `Week ${state.week + weeks}`}</b></div>
        <input type="range" className="slider mt12" style={{ width: '100%' }} min={0} max={6} value={weeks} onChange={(e) => setWeeks(+e.target.value)} />
        <div className="tiny muted mt8">Announcing early builds hype; dropping now starts streams next week.</div>
      </div>
      <button className="btn accent block" onClick={submit} disabled={state.player.cash < ro.cost}>Release {type === 'single' ? 'single' : type.toUpperCase()}</button>
      {scheduled.length > 0 && <ScheduledList list={scheduled} />}

      <Sheet open={coverOpen} onClose={() => setCoverOpen(false)} title="Cover art" sub="Pick a generated style and colour, a sample shot, or upload your own.">
        <div style={{ display: 'grid', placeItems: 'center' }}><Cover cover={cover} title={relTitle} size={200} /></div>
        <Mono className="mt16">Art styles</Mono>
        <div className="cover-grid mt8">
          {COVER_STYLES.slice(1).map((name, i) => {
            const c = { gradient: cover.gradient ?? 0, style: i + 1, seed: cover.style === i + 1 ? cover.seed : (i + 1) * 97 + state.week };
            return <button key={name} className="press" onClick={() => setCover(c)} style={{ outline: !cover.image && cover.style === i + 1 ? '2px solid #fff' : 'none', borderRadius: 12 }} aria-label={`${name} cover style`}><Cover cover={c} size={60} radius={12} /></button>;
          })}
        </div>
        {cover.style ? <button className="btn sm mt8" onClick={() => setCover({ ...cover, image: undefined, seed: Math.floor(Math.random() * 1e6) })}><Icon name="dice" size={16} />Shuffle this style</button> : null}
        <Mono className="mt16">Colours</Mono>
        <div className="row wrap gap6 mt8">
          {COVER_GRADIENTS.map((g, i) => (
            <button key={i} className="press" onClick={() => setCover({ gradient: i, style: cover.style || 0, seed: cover.seed })} style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, outline: !cover.image && cover.gradient === i ? '2px solid #fff' : 'none' }} aria-label={`Colour ${i + 1}`} />
          ))}
        </div>
        <Mono className="mt16">Photos</Mono>
        <div className="row gap6 mt8">
          {SAMPLE_COVERS.map((src) => (
            <button key={src} className="press" onClick={() => setCover({ gradient: cover.gradient, image: src })} style={{ outline: cover.image === src ? '2px solid #fff' : 'none', borderRadius: 12 }}><img src={src} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} /></button>
          ))}
          <UploadButton className="icon-btn" max={500} onImage={(d) => setCover({ gradient: cover.gradient, image: d })}><Icon name="upload" /></UploadButton>
        </div>
        <button className="btn primary block mt24" onClick={() => setCoverOpen(false)}>Use this cover</button>
      </Sheet>
    </div>
  );
}

function ScheduledList({ list }) {
  const { state, act } = useGame();
  const p = state.player;
  return (
    <div className="card">
      <Mono>Scheduled</Mono>
      {list.map((r) => (
        <div key={r.id} className="sched">
          <div className="list-item"><Cover cover={r.cover} size={40} /><div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{r.title}</b><div className="tiny muted">{r.type.toUpperCase()} · drops week {r.releaseWeek}{r.preHype ? ` · first-week boost +${Math.round(r.preHype * 100)}%` : ''}</div></div></div>
          {r.type !== 'single' && (
            <div className="rollout-steps">
              {ROLLOUT_STEPS.map((st) => {
                const done = r.steps?.[st.id];
                const cost = [st.energy && `${st.energy} energy`, st.social && `${st.social} social`, st.cost && fmtMoney(st.cost)].filter(Boolean).join(' · ');
                return (
                  <button key={st.id} className={`rstep ${done ? 'done' : ''}`} disabled={!!done || (st.energy && p.energy < st.energy) || (st.social && p.socialEnergy < st.social) || (st.cost && p.cash < st.cost)} onClick={() => act(rolloutStep, { releaseId: r.id, step: st.id })}>
                    <span className="row gap6">{done ? <Icon name="check" size={14} color="#3DDC84" /> : <Icon name="sparkle" size={14} />}<b>{st.name}</b></span>
                    <span className="tiny muted">{done ? `Done week ${done}` : `${cost} · +${Math.round(st.pre * 100)}% first week`}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {list.some((r) => r.type !== 'single') && <div className="tiny muted mt8">Rollout steps build pre-release hype and boost the first week. Announce projects a few weeks out to have time for them.</div>}
    </div>
  );
}

function Catalog() {
  const { state } = useGame();
  const [open, setOpen] = useState(null);
  const songs = useMemo(() => [...state.songs].sort((a, b) => (b.lifetimeStreams || 0) - (a.lifetimeStreams || 0)), [state.songs]);
  if (!songs.length) return <div className="card mt16"><Empty icon="disc">Your catalogue is empty.</Empty></div>;
  const total = songs.reduce((a, s) => a + (s.lifetimeStreams || 0), 0);
  const s = open && state.songs.find((x) => x.id === open);
  return (
    <div className="col gap16 mt16">
      <div className="grid3">
        <div className="stat"><Mono className="sm">Songs</Mono><div className="v">{songs.length}</div></div>
        <div className="stat"><Mono className="sm">Released</Mono><div className="v">{songs.filter((x) => x.status === 'released').length}</div></div>
        <div className="stat"><Mono className="sm">Streams</Mono><div className="v">{fmtNum(total)}</div></div>
      </div>
      <div className="card">
        {songs.map((x) => (
          <button key={x.id} className="list-item press" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(x.id)}>
            <Cover cover={x.cover} title={x.title} size={48} />
            <div className="grow">
              <div className="row gap6" style={{ minWidth: 0 }}><b className="ellipsis">{x.title}</b>{x.cert && <CertBadge id={x.cert} small />}</div>
              <div className="tiny muted ellipsis">{x.status === 'released' ? `${fmtNum(x.weeklyStreams)} this week` : x.status === 'scheduled' ? 'Scheduled' : x.status === 'recorded' ? 'Recorded · unreleased' : 'Demo'} · Q{x.quality}{x.reception ? ` · ${receptionLabel(x.reception)}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}><div className="num">{fmtNum(x.lifetimeStreams || 0)}</div><Mono className="sm">Lifetime</Mono></div>
          </button>
        ))}
      </div>
      <Sheet open={!!s} onClose={() => setOpen(null)} title={s?.title} sub={s && `${genreName(s.genre)} · ${s.theme} · ${fmtLength(s.length)}`}>
        {s && <SongDetail s={s} onDeleted={() => setOpen(null)} />}
      </Sheet>
      <AlbumsCard />
    </div>
  );
}

function SongDetail({ s, onDeleted }) {
  const { state, act } = useGame();
  const p = state.player;
  const [confirmDel, setConfirmDel] = useState(false);
  const next = nextCert(s.lifetimeStreams || 0, SONG_CERTS);
  const hist = s.history || [];
  const max = Math.max(1, ...hist);
  const ideas = promoIdeasFor(s.genre);
  const live = ['released', 'scheduled', 'recorded'].includes(s.status);
  const unreleased = ['written', 'recorded'].includes(s.status) && !state.releases.some((r) => r.status === 'scheduled' && r.songIds.includes(s.id));
  return (
    <div className="col gap16">
      <div className="grid3">
        <div className="stat"><Mono className="sm">Quality</Mono><div className="v" style={{ color: qColor(s.quality) }}>{s.quality}</div></div>
        <div className="stat"><Mono className="sm">Weekly</Mono><div className="v">{fmtNum(s.weeklyStreams || 0)}</div></div>
        <div className="stat"><Mono className="sm">Playlists</Mono><div className="v">{s.playlists || 0}</div></div>
      </div>
      {(s.cert || s.reception) && <div className="row wrap gap6">{s.cert && <CertBadge id={s.cert} />}{s.reception && <span className="chip sm">{receptionLabel(s.reception)}</span>}{s.firstWeekStreams ? <span className="chip sm">First week {fmtNum(s.firstWeekStreams)}</span> : null}{s.lifetimeSales ? <span className="chip sm">{fmtNum(s.lifetimeSales)} downloads</span> : null}</div>}
      {hist.length > 1 && (
        <div className="card"><Mono>Weekly streams</Mono>
          <div className="row mt12" style={{ alignItems: 'flex-end', height: 80, gap: 3 }}>
            {hist.map((h, i) => <div key={i} style={{ flex: 1, height: `${(h / max) * 100}%`, minHeight: 2, background: '#FF6B4A', borderRadius: 3 }} />)}
          </div>
        </div>
      )}
      {next && s.status === 'released' && <div className="card"><div className="row between small gap6"><span>Next: <b>{next.name}</b></span><span className="muted">{fmtNum(s.lifetimeStreams || 0)} / {fmtNum(next.min)}</span></div><div className="mt8"><Bar pct={(s.lifetimeStreams || 0) / next.min} color="#FFB020" /></div></div>}
      {Object.keys(s.peaks || {}).length > 0 && <div className="row wrap gap6">{Object.entries(s.peaks).map(([k, v]) => <span key={k} className="chip sm">Peak #{v} · {CHARTS.find((c) => c.id === k)?.short || CHARTS.find((c) => c.id === k)?.name || k}</span>)}</div>}
      {s.playlistNames?.length > 0 && <div className="tiny muted">On: {s.playlistNames.join(', ')}</div>}
      {live && (
        <div className="card">
          <Mono>Pitch</Mono>
          <div className="tiny muted mt8">{s.status === 'released' ? 'Send it to playlist curators ($50 + 5 social).' : s.prePitch ? 'Pitched to editors, you’ll hear on release week.' : 'Pitch to editors before release: placements land on release day.'}</div>
          <button className="btn sm mt8" disabled={s.pitchedWeek === state.week || (s.status !== 'released' && s.prePitch) || p.socialEnergy < SOCIAL.pitch || p.cash < 50} onClick={() => act(pitchPlaylist, { songId: s.id })}>{s.status === 'released' ? 'Pitch to playlists' : 'Pitch to editors'}</button>
        </div>
      )}
      {live && (
        <div className="card">
          <Mono>Promote</Mono>
          <div className="tiny muted mt8">Moves {genreName(s.genre)} fans respond to. Before release they build buzz for the first weeks.</div>
          <div className="row wrap gap6 mt8">{ideas.map((it) => <button key={it.id} className="btn sm" disabled={p.socialEnergy < it.social} onClick={() => act(promoIdea, { songId: s.id, idea: it.id })}>{it.name} · {it.social}</button>)}</div>
          <Mono className="mt12 sm">Paid ads</Mono>
          <div className="row wrap gap6 mt8">{AD_TIERS.map((t) => <button key={t.id} className="btn sm" disabled={p.cash < t.cost} onClick={() => act(buyAds, { songId: s.id, tier: t.id })}>{fmtMoney(t.cost)} · ~{fmtNum(t.streams)}</button>)}</div>
        </div>
      )}
      {unreleased && (
        <div className="card">
          <Mono>Unreleased</Mono>
          <div className="row wrap gap6 mt8">
            <button className="btn sm" disabled={p.socialEnergy < 6} onClick={() => act(cloudUpload, { songId: s.id, kind: 'demo' })}>Upload demo to TreblrCloud</button>
            {!confirmDel ? <button className="btn sm danger" onClick={() => setConfirmDel(true)}>Delete song</button> : <button className="btn sm danger" onClick={() => { if (act(deleteSong, { songId: s.id }).ok) onDeleted?.(); }}>Tap again to delete “{s.title}”</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function AlbumsCard() {
  const { state } = useGame();
  const list = state.releases.filter((r) => r.status === 'out' && r.type !== 'single');
  if (!list.length) return null;
  return (
    <div className="card">
      <Mono>Projects · units & plaques</Mono>
      {list.map((r) => {
        const next = nextCert(r.totalUnits || 0, ALBUM_CERTS);
        return (
          <div key={r.id} className="list-item">
            <Cover cover={r.cover} title={r.title} size={48} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row gap6" style={{ minWidth: 0 }}><b className="ellipsis">{r.title}</b>{r.cert && <CertBadge id={r.cert} album small />}</div>
              <div className="tiny muted ellipsis">{r.type.toUpperCase()} · first week {fmtNum(r.firstWeek || 0)} · {fmtNum(r.totalUnits || 0)} units{r.review ? ` · Treblrfork ${r.review.score.toFixed(1)}` : ''}</div>
              {next && <div className="mt8"><Bar pct={(r.totalUnits || 0) / next.min} color="#FFB020" /></div>}
            </div>
          </div>
        );
      })}
      <div className="tiny muted mt8">2,500 streams = 1 unit, plus sales. Lead singles’ earlier streams count toward the total, never the first week.</div>
    </div>
  );
}

function Collab({ initialRival }) {
  const { state, act, openArtist } = useGame();
  const songs = state.songs.filter((s) => ['written', 'recorded'].includes(s.status) && !s.feat);
  const [songId, setSongId] = useState(songs[0]?.id);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(initialRival || null);
  const [deal, setDeal] = useState('fee');
  const p = state.player;
  const list = useMemo(() => {
    const base = state.rivals.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
    return base.map((r) => ({ r, quote: featureQuote(state, r.id), c: state.contacts?.find((x) => x.rivalId === r.id) }))
      .sort((a, b) => (a.r.id === pick ? -1 : b.r.id === pick ? 1 : 0) || (b.quote.odds - a.quote.odds) || (b.r.genres.includes(p.genre) - a.r.genres.includes(p.genre)))
      .slice(0, 30);
  }, [state, q, pick, p.genre]);
  if (!songs.length) return <div className="card mt16"><Empty icon="users">Write or record a song first, then bring in a feature.</Empty></div>;
  return (
    <div className="col gap16 mt16">
      <div className="card tight small muted">A feature costs a fee and 10 energy. Their audience boosts the song’s discovery, and you’re both credited on the charts. Big stars charge hundreds of thousands and rarely say yes to smaller acts; genre fit, your relationship and shared labels help.</div>
      <label className="col gap6"><Mono>Song</Mono>
        <select value={songId} onChange={(e) => setSongId(e.target.value)}>{songs.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.status} · Q{s.quality}</option>)}</select>
      </label>
      <div className="col gap6"><Mono>Deal</Mono><Seg options={[{ value: 'fee', label: 'Flat fee' }, { value: 'split', label: 'Royalty split' }]} value={deal} onChange={setDeal} /><div className="tiny muted">{deal === 'split' ? 'Small upfront fee; they keep a share of the song’s streaming money forever. Big names prefer this.' : 'Pay once and keep every stream.'} Stars in an album era are usually busy.</div></div>
      <div className="phone-search"><Icon name="search" size={18} color="#bbb" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists" aria-label="Search artists" /></div>
      <div className="col">
        {list.map(({ r, quote, c }) => {
          const split = deal === 'split';
          const fee = split ? quote.splitFee : quote.fee;
          const odds = split ? quote.splitOdds : quote.odds;
          const need = c?.beef ? 'Beef: they won’t answer' : !songId ? 'Pick a song' : p.energy < 10 ? 'Need 10 energy' : p.cash < fee ? `Need ${fmtMoney(fee)}` : c?.lastAsk != null && state.week - c.lastAsk < 4 ? `Ask again wk ${c.lastAsk + 4}` : null;
          return (
          <div key={r.id} className={`option row ${pick === r.id ? 'on' : ''}`} style={{ alignItems: 'center' }}>
            <ArtistAvatar rival={r} size={46} onClick={() => openArtist(r.id)} />
            <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setPick(r.id)}>
              <b className="ellipsis" style={{ display: 'block' }}>{r.name}</b>
              <div className="tiny muted">{genreName(r.genre)} · {tierLabel(r.tier)} · {fmtNum(r.monthlyListeners)} listeners{c ? ` · rel ${c.rel}` : ''}</div>
              <div className="tiny" style={{ color: quote.fit >= 1 ? 'var(--green)' : quote.fit > 0 ? 'var(--amber)' : 'var(--muted)' }}>{quote.fit >= 1 ? 'Same genre: great fit' : quote.fit > 0 ? 'Close genre: decent fit' : 'Different lane: harder sell'}{quote.labelmate ? ' · Labelmate (discount)' : ''}</div>
              <div className="tiny" style={{ color: odds >= 0.5 ? 'var(--green)' : odds >= 0.2 ? 'var(--amber)' : 'var(--red)' }}>{fmtMoney(fee)}{split ? ` + ${Math.round(quote.splitShare * 100)}% of streams` : ''} · {Math.round(odds * 100)}% odds</div>
              {quote.note && <div className="tiny muted">{quote.note}</div>}
            </button>
            <div className="col" style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <button className="btn sm accent" style={{ '--accent': '#FF6B4A' }} aria-disabled={!!need} onClick={() => act(requestFeature, { rivalId: r.id, songId, mode: deal })}>Ask</button>
              {need && <span className="need">{need}</span>}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
