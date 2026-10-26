import { useState } from 'react';
import { cityById, genreName, pathById, updatePlayer, fmtNum, fmtMoney, CERTS, listSaves } from '../engine/index.js';
import { useGame, Icon, Mono, Cover, Bar, UploadButton, facePhoto, Empty } from '../ui/kit.jsx';

export default function Profile({ onClose }) {
  const { state, act, slot, onSwitch, onNew } = useGame();
  const p = state.player;
  const city = cityById(p.city);
  const [tab, setTab] = useState('overview');
  const out = state.releases.filter((r) => r.status === 'out');
  const saves = listSaves();
  return (
    <div className="app-screen" style={{ top: 0, bottom: 0, zIndex: 70 }}>
      <div style={{ position: 'relative', height: 300, flexShrink: 0 }}>
        <img src={facePhoto(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.4), transparent 30%, #0B0B0F)' }} />
        <button className="icon-btn" style={{ position: 'absolute', top: 12, left: 12, background: '#0008' }} onClick={onClose} aria-label="Close profile"><Icon name="back" /></button>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <UploadButton className="btn sm" onImage={(d) => act(updatePlayer, { photo: d }, { silent: true })}><Icon name="camera" size={16} />Photo</UploadButton>
        </div>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <Mono style={{ color: '#C6FF3D' }}>{city.flag} {city.name} · {genreName(p.genre)}{p.subgenres?.length ? ` / ${p.subgenres.join(', ')}` : ''}</Mono>
          <h1 style={{ fontSize: 38, lineHeight: 1 }}>{p.stageName}</h1>
          <div className="small muted">{p.firstName} {p.lastName}, {p.age} · {pathById(p.path).name}{p.label ? ` · ${p.label.name}` : ' · Independent'}</div>
        </div>
      </div>
      <div className="app-body">
        <div className="seg">
          {['overview', 'discography', 'awards', 'saves'].map((t) => <button key={t} className={tab === t ? 'on' : ''} style={{ textTransform: 'capitalize', fontSize: 13 }} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {tab === 'overview' && (
          <div className="col gap16 mt16">
            <div className="grid3">
              <div className="stat"><Mono className="sm">Fans</Mono><div className="v">{fmtNum(p.fans)}</div></div>
              <div className="stat"><Mono className="sm">Listeners</Mono><div className="v">{fmtNum(p.monthlyListeners)}</div></div>
              <div className="stat"><Mono className="sm">Streams</Mono><div className="v">{fmtNum(p.lifetimeStreams || 0)}</div></div>
              <div className="stat"><Mono className="sm">Popularity</Mono><div className="v">{p.popularity}</div></div>
              <div className="stat"><Mono className="sm">Hype</Mono><div className="v">{Math.round(p.hype)}</div></div>
              <div className="stat"><Mono className="sm">Best rank</Mono><div className="v">{p.bestRank ? `#${p.bestRank}` : '—'}</div></div>
            </div>
            <div className="card">
              <Mono>Skills</Mono>
              {Object.entries(p.skills).map(([k, v]) => (
                <div key={k} className="mt12">
                  <div className="row between small"><span style={{ textTransform: 'capitalize' }}>{k}</span><b>{Math.round(v)}</b></div>
                  <div className="mt8"><Bar pct={v / 100} color="#C6FF3D" /></div>
                </div>
              ))}
            </div>
            <div className="card tight row between"><span className="small">Cash</span><b className="up">{fmtMoney(p.cash)}</b></div>
          </div>
        )}
        {tab === 'discography' && (
          <div className="mt16">
            {out.length ? out.map((r) => {
              const songs = r.songIds.map((id) => state.songs.find((s) => s.id === id)).filter(Boolean);
              const life = songs.reduce((a, s) => a + s.lifetimeStreams, 0);
              const certs = songs.filter((s) => s.cert);
              return (
                <div key={r.id} className="list-item">
                  <Cover cover={r.cover} title={r.title} size={56} />
                  <div className="grow"><b className="ellipsis">{r.title}</b><div className="tiny muted">{r.type.toUpperCase()} · week {r.releaseWeek} · {songs.length} track{songs.length > 1 ? 's' : ''}{certs.length ? ` · ${certs.map((s) => CERTS.find((c) => c.id === s.cert).name).join(', ')}` : ''}</div></div>
                  <span className="num small">{fmtNum(life)}</span>
                </div>
              );
            }) : <Empty icon="disc">No releases yet.</Empty>}
          </div>
        )}
        {tab === 'awards' && (
          <div className="mt16">
            {p.awards?.length ? p.awards.slice().reverse().map((a, i) => (
              <div key={i} className="list-item"><Icon name={a.kind === 'award' ? 'trophy' : 'star'} color={a.kind === 'award' ? '#FFB020' : '#C6FF3D'} /><div className="grow"><b className="small">{a.name}</b><div className="tiny muted">Week {a.week}</div></div></div>
            )) : <Empty icon="trophy">Trophies and milestones land here.</Empty>}
          </div>
        )}
        {tab === 'saves' && (
          <div className="mt16 card">
            {saves.map((s) => (
              <div key={s.slot} className="list-item">
                <div className="grow"><b>Slot {s.slot}{s.slot === slot ? ' · playing' : ''}</b><div className="tiny muted">{s.empty ? 'Empty' : `${s.stageName} · week ${s.week}`}</div></div>
                {s.slot !== slot && <button className="btn sm" onClick={() => { onClose(); s.empty ? onNew(s.slot) : onSwitch(s.slot); }}>{s.empty ? 'New career' : 'Load'}</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
