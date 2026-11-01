import { genreName, fmtNum, popularityFromListeners, tierLabel, relOf, featureQuote, setArtistPhoto, messageArtist, chartItem, CHARTS, fmtMoney } from '../engine/index.js';
import { useGame, Sheet, ArtistAvatar, Mono, Bar, UploadButton, Icon } from './kit.jsx';

export function relLabel(rel, beef) {
  if (beef) return 'Beef';
  if (rel >= 70) return 'Close friend';
  if (rel >= 40) return 'Friendly';
  if (rel >= 10) return 'Acquaintance';
  if (rel <= -20) return 'Cold';
  return 'Stranger';
}

export default function ArtistSheet({ rivalId, onClose }) {
  const { state, act, go } = useGame();
  const r = state.rivals.find((x) => x.id === rivalId);
  if (!r) return null;
  const c = state.contacts?.find((x) => x.rivalId === r.id);
  const rel = relOf(state, r.id);
  const q = featureQuote(state, r.id);
  const positions = [];
  for (const ch of CHARTS) for (const e of state.charts[ch.id] || []) {
    if (e.pl) continue;
    const it = chartItem(state, ch.id, e);
    if (it.rivalId === r.id && positions.length < 6) positions.push({ chart: ch.short || ch.name, r: e.r, title: it.title });
  }
  const photo = state.artistPhotos?.[r.id];
  return (
    <Sheet open onClose={onClose} title={r.name} sub={`${genreName(r.genre)}${r.genres?.[1] ? ` / ${genreName(r.genres[1])}` : ''} · ${r.country} · ${tierLabel(r.tier)}${r.real ? '' : ' · fictional'}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <ArtistAvatar rival={r} size={104} radius={24} />
        <div className="grow col gap6">
          <div><div className="num" style={{ fontSize: 24 }}>{fmtNum(r.monthlyListeners)}</div><Mono className="sm">Monthly listeners{r.estimated && r.real ? ' (est.)' : ''}</Mono></div>
          <div className="small muted">Popularity {popularityFromListeners(r.monthlyListeners)} · {r.lastMove}</div>
          <div className="row gap6 wrap">
            <UploadButton className="btn sm" max={256} onImage={(d) => act(setArtistPhoto, { rivalId: r.id, photo: d })}><Icon name="camera" size={16} />Set photo</UploadButton>
            {photo && <button className="btn sm" onClick={() => act(setArtistPhoto, { rivalId: r.id, photo: null })}>Reset to default</button>}
          </div>
        </div>
      </div>
      <div className="card tight mt16">
        <div className="row between small"><span>Relationship · <b>{relLabel(rel, c?.beef)}</b></span><span className="num">{rel}</span></div>
        <div className="mt8"><Bar pct={(rel + 100) / 200} color={c?.beef ? '#FF4D5E' : '#6C7BFF'} /></div>
        {q && <div className="tiny muted mt8">Feature fee {fmtMoney(q.fee)} · {Math.round(q.odds * 100)}% chance they say yes</div>}
      </div>
      {positions.length > 0 && (
        <div className="row wrap gap6 mt12">{positions.map((p, i) => <span key={i} className="chip sm" style={{ color: 'var(--amber)' }}>#{p.r} {p.chart} · {p.title}</span>)}</div>
      )}
      <div className="row mt16">
        <button className="btn grow" onClick={() => { act(messageArtist, { rivalId: r.id }); onClose(); go({ tab: 'phone', app: 'treblrchat', contact: `c_${r.id}` }); }}><Icon name="chat" size={16} />Message</button>
        <button className="btn accent grow" style={{ '--accent': '#FF6B4A' }} disabled={!!c?.beef} onClick={() => { onClose(); go({ tab: 'studio', section: 'collab', rival: r.id }); }}><Icon name="users" size={16} />Request feature</button>
      </div>
      <div className="tiny faint mt12">Artwork is generative. Set your own photo for any artist; it stays in this save and can be shared as a photo pack from Settings.</div>
    </Sheet>
  );
}
