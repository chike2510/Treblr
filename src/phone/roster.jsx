// Roster editor: build/edit custom artist packs (name, genre, country, popularity, photo), remove
// default artists, import packs with merge or replace, export. Packs apply to NEW careers.
import { useRef, useState } from 'react';
import { GENRES, ARTIST_ROSTER, applyRosterPack, mergeRosterPacks, validateRosterPack, tierForML, fmtNum, genreName } from '../engine/index.js';
import { useGame, Icon, Mono, UploadButton, ArtistArt } from '../ui/kit.jsx';

const KEY = 'treblr:roster';
export function loadRosterPack(storage = globalThis.localStorage) {
  try { const p = JSON.parse(storage?.getItem(KEY) || 'null'); return p && !validateRosterPack(p) ? p : null; } catch { return null; }
}
export function saveRosterPack(pack, storage = globalThis.localStorage) {
  try { if (pack) storage?.setItem(KEY, JSON.stringify(pack)); else storage?.removeItem(KEY); return true; } catch { return false; }
}
const EMPTY = { format: 'treblr-roster-pack', version: 1, mode: 'merge', artists: [], removed: [] };
// popularity slider (0-100) <-> monthly listeners
const mlFromPop = (pop) => Math.round(Math.pow(10, 3 + pop / 20));
const popFromMl = (ml) => Math.round((Math.log10(Math.max(1000, ml)) - 3) * 20);

export function RosterEditor() {
  const { toast } = useGame();
  const [pack, setPack] = useState(() => loadRosterPack() || EMPTY);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const [importMode, setImportMode] = useState('merge');
  const save = (next) => { setPack(next); saveRosterPack(next); };
  const removed = new Set((pack.removed || []).map((x) => x.toLowerCase()));
  const roster = applyRosterPack(ARTIST_ROSTER.map((a) => ({ ...a, baseML: a.ml })), { ...pack, format: 'treblr-roster-pack' });
  const startNew = () => setEdit({ name: '', genre: 'pop', country: 'US', ml: 1e6, photo: null, isNew: true });
  const commit = () => {
    const name = edit.name.trim();
    if (!name) { toast('Give the artist a name.', false); return; }
    const others = (pack.artists || []).filter((a) => a.name.toLowerCase() !== (edit.orig || name).toLowerCase());
    save({ ...pack, artists: [...others, { name, genre: edit.genre, country: edit.country.toUpperCase().slice(0, 2), ml: edit.ml, ...(edit.photo ? { photo: edit.photo } : {}) }] });
    setEdit(null);
  };
  const exportPack = () => {
    const blob = new Blob([JSON.stringify(pack)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'treblr-roster-pack.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const defaults = ARTIST_ROSTER.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  if (edit) {
    return (
      <div className="col gap12">
        <div className="row">
          {edit.photo ? <img src={edit.photo} alt="" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover' }} /> : <ArtistArt name={edit.name || '?'} genres={[edit.genre]} size={72} radius={18} />}
          <div className="col gap6 grow"><UploadButton className="btn sm" max={256} onImage={(d) => setEdit({ ...edit, photo: d })}><Icon name="camera" size={16} />Photo</UploadButton>{edit.photo && <button className="btn sm" onClick={() => setEdit({ ...edit, photo: null })}>Use generated art</button>}</div>
        </div>
        <label className="col gap6"><Mono>Name</Mono><input value={edit.name} maxLength={40} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
        <label className="col gap6"><Mono>Genre</Mono><select value={edit.genre} onChange={(e) => setEdit({ ...edit, genre: e.target.value })}>{GENRES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <label className="col gap6"><Mono>Country code</Mono><input value={edit.country} maxLength={2} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></label>
        <label className="col gap6"><span className="row between"><Mono>Popularity</Mono><span className="small">{popFromMl(edit.ml)} · {fmtNum(edit.ml)} listeners · {tierForML(edit.ml)}</span></span><input type="range" className="slider" min={20} max={100} value={popFromMl(edit.ml)} onChange={(e) => setEdit({ ...edit, ml: mlFromPop(+e.target.value) })} /></label>
        <div className="row"><button className="btn grow" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary grow" onClick={commit}>Save artist</button></div>
      </div>
    );
  }
  return (
    <div className="col gap12">
      <div className="small muted">Your pack: {pack.artists?.length || 0} custom artist{pack.artists?.length === 1 ? '' : 's'}, {pack.removed?.length || 0} removed. New careers start with {roster.length} artists. Existing saves are not changed.</div>
      <div className="row gap6">
        <button className="btn sm grow" onClick={startNew}><Icon name="plus" size={16} />Add artist</button>
        <button className="btn sm grow" onClick={exportPack}>Export</button>
        <button className="btn sm grow" onClick={() => ref.current?.click()}>Import</button>
        <input ref={ref} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
          try {
            const inc = JSON.parse(await f.text());
            const err = validateRosterPack(inc);
            if (err) { toast(err, false); return; }
            save(mergeRosterPacks(pack, inc, importMode));
            toast(`Imported (${importMode}).`);
          } catch { toast('That file isn’t valid JSON.', false); }
        }} />
      </div>
      <div className="row between tiny"><span>When importing</span><div className="seg" style={{ width: 200 }}>{['merge', 'replace'].map((m) => <button key={m} className={importMode === m ? 'on' : ''} onClick={() => setImportMode(m)}>{m === 'merge' ? 'Merge' : 'Replace'}</button>)}</div></div>
      <div className="row between tiny"><span>Pack mode for new games</span><div className="seg" style={{ width: 230 }}>{[['merge', 'Add to roster'], ['replace', 'Only my pack']].map(([m, l]) => <button key={m} className={pack.mode === m ? 'on' : ''} onClick={() => save({ ...pack, mode: m })}>{l}</button>)}</div></div>
      {pack.mode === 'replace' && (pack.artists?.length || 0) < 10 && <div className="tiny" style={{ color: 'var(--amber)' }}>Replace mode needs at least 10 custom artists; until then the default roster is used.</div>}
      <Mono>Custom artists</Mono>
      {(pack.artists || []).map((a) => (
        <div key={a.name} className="list-item">
          {a.photo ? <img src={a.photo} alt="" style={{ width: 40, height: 40, borderRadius: 99, objectFit: 'cover' }} /> : <ArtistArt name={a.name} genres={[a.genre]} size={40} />}
          <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: 'block' }}>{a.name}</b><div className="tiny muted">{genreName(a.genre)} · {a.country} · {fmtNum(a.ml)}</div></div>
          <button className="btn sm" onClick={() => setEdit({ ...a, orig: a.name, photo: a.photo || null })}>Edit</button>
          <button className="icon-btn" aria-label={`Delete ${a.name}`} onClick={() => save({ ...pack, artists: pack.artists.filter((x) => x !== a) })}><Icon name="close" size={16} /></button>
        </div>
      ))}
      {!(pack.artists || []).length && <div className="tiny muted">No custom artists yet.</div>}
      <Mono>Default roster</Mono>
      <div className="phone-search"><Icon name="search" size={18} color="#bbb" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an artist to remove" aria-label="Search roster" /></div>
      {defaults.map((a) => {
        const off = removed.has(a.name.toLowerCase());
        return (
          <div key={a.id} className="list-item" style={{ opacity: off ? 0.5 : 1 }}>
            <ArtistArt name={a.name} genres={a.genres} size={36} />
            <div className="grow" style={{ minWidth: 0 }}><b className="ellipsis small" style={{ display: 'block' }}>{a.name}</b><div className="tiny muted">{genreName(a.genres[0])} · {fmtNum(a.ml)}</div></div>
            <button className="btn sm" onClick={() => save({ ...pack, removed: off ? pack.removed.filter((x) => x.toLowerCase() !== a.name.toLowerCase()) : [...(pack.removed || []), a.name] })}>{off ? 'Restore' : 'Remove'}</button>
          </div>
        );
      })}
      {(pack.artists?.length || pack.removed?.length) ? <button className="btn danger sm" onClick={() => save(EMPTY)}>Reset pack</button> : null}
    </div>
  );
}
