import { useEffect, useMemo, useState } from 'react';
import { fmt } from '../engine/utils';
import { SectionLabel, SubNav } from '../components/Living';
import SocialTab from './SocialTab';

const SECTIONS = [
  { id:'wire', label:'The Wire' },
  { id:'community', label:'Community' },
  { id:'inbox', label:'Inbox' },
  { id:'events', label:'Events' },
];

const TYPE_META = {
  pos: { label:'Career update', color:'var(--accent-green)' },
  neg: { label:'Risk & finance', color:'var(--accent-red)' },
  milestone: { label:'Milestone', color:'var(--accent-gold-lt)' },
  npc: { label:'Industry', color:'var(--accent-cyan)' },
  '': { label:'Journal', color:'var(--text-muted)' },
};

const weekLabel = (entry) => entry.week == null ? 'Career log' : `Week ${entry.week}`;

function NewsRows({ items, compact = false }) {
  if (!items.length) {
    return <div className="news-empty">Updates will appear here as the career simulation advances.</div>;
  }

  return (
    <div className="news-list">
      {items.map((entry, index) => {
        const meta = TYPE_META[entry.type] || TYPE_META[''];
        return (
          <article className="news-item" key={`${entry.week ?? 0}-${index}-${entry.msg}`}>
            <span className="news-marker" style={{ background:meta.color }} aria-hidden="true" />
            <div className="news-item-copy">
              {!compact && <div className="news-item-meta"><span style={{ color:meta.color }}>{meta.label}</span><span>{weekLabel(entry)}</span></div>}
              <p>{entry.msg}</p>
              {compact && <div className="news-item-meta"><span>{meta.label}</span><span>{weekLabel(entry)}</span></div>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function NewsTab(props) {
  const { gs, patch } = props;
  const [section, setSection] = useState(gs.appRoutes?.news || 'wire');
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    const route = gs.appRoutes?.news;
    if (route && route !== section) setSection(route);
  }, [gs.appRoutes?.news, section]);
  const entries = Array.isArray(gs.news) ? gs.news : [];
  const lastTwelve = entries.slice(0, 12);
  const favorable = lastTwelve.filter(item => item.type === 'pos' || item.type === 'milestone').length;
  const difficult = lastTwelve.filter(item => item.type === 'neg').length;
  const tone = favorable + difficult === 0 ? 'No recent signal' : favorable > difficult ? 'More favorable' : difficult > favorable ? 'More difficult' : 'Mixed';
  const visibleWire = useMemo(() => entries.filter(item => {
    if (filter === 'progress') return item.type === 'pos' || item.type === 'milestone';
    if (filter === 'risk') return item.type === 'neg';
    return true;
  }).slice(0, 30), [entries, filter]);
  const resolvedEvents = entries.filter(item => item.type === 'neg' || item.type === 'milestone').slice(0, 12);
  const changeSection = (id) => {
    setSection(id);
    patch({ appRoutes:{ ...(gs.appRoutes || {}), news:id } });
  };

  return (
    <div className={`news-shell${section === 'community' ? ' is-community' : ''}`}>
      <header className="editorial-page-head">
        <div className="page-kicker">NEWSROOM</div>
        <h1>{section === 'community' ? 'Audience & socials' : 'Around your career'}</h1>
      </header>
      <SubNav items={SECTIONS} active={section} onChange={changeSection} />

      {section === 'wire' && (
        <div className="news-scroll">
          <div className="news-lede">
            <div>
              <div className="news-lede-label">THE CAREER WIRE</div>
              <div className="news-lede-title">Only what happened in your sim.</div>
            </div>
            <span className="news-lede-count">{entries.length} updates</span>
          </div>
          <div className="news-summary-strip">
            <div><span>Recent tone</span><strong>{tone}</strong><small>{favorable} favorable · {difficult} difficult in the last 12</small></div>
            <div><span>Public reputation</span><strong>{Math.round(gs.reputation ?? 50)}<small>/100</small></strong><small>current simulation value</small></div>
          </div>
          <div className="news-filter" role="group" aria-label="Filter career updates">
            {[['all','All'],['progress','Progress'],['risk','Risks']].map(([id,label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          <SectionLabel>Latest updates</SectionLabel>
          <NewsRows items={visibleWire} />
        </div>
      )}

      {section === 'inbox' && (
        <div className="news-scroll">
          <div className="news-lede">
            <div><div className="news-lede-label">CAREER INBOX</div><div className="news-lede-title">Your activity, in order.</div></div>
            <span className="news-lede-count">{entries.length}</span>
          </div>
          <p className="news-explainer">These are actual in-game updates and outcomes from your career log; direct message threads are not a separate simulation system.</p>
          <NewsRows items={entries.slice(0, 30)} compact />
        </div>
      )}

      {section === 'events' && (
        <div className="news-scroll">
          <div className="news-lede">
            <div><div className="news-lede-label">DECISIONS & CONSEQUENCES</div><div className="news-lede-title">A record of what changed.</div></div>
          </div>
          <p className="news-explainer">When a decision event arrives, its choice sheet opens over the game. Resolved milestones and risk events are recorded here.</p>
          <NewsRows items={resolvedEvents} />
        </div>
      )}

      {section === 'community' && (
        <>
          <div className="community-summary">
            <div><span>REPUTATION</span><strong>{Math.round(gs.reputation ?? 50)}<small>/100</small></strong></div>
            <div><span>ALL-PLATFORM FOLLOWERS</span><strong>{fmt(Object.values(gs.socialPlatforms || {}).reduce((sum, value) => sum + Number(value || 0), 0))}</strong></div>
            <p>Follower totals and reputation are tracked. Per-post engagement counts are not.</p>
          </div>
          <div className="news-community-slot"><SocialTab {...props} /></div>
        </>
      )}
    </div>
  );
}
