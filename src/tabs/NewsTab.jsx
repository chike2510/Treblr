import { useEffect, useMemo, useState } from 'react';
import { fmt } from '../engine/utils';
import { SectionLabel, SubNav } from '../components/Living';
import SocialTab from './SocialTab';

const SECTIONS = [
  { id: 'wire', label: 'The Wire' },
  { id: 'community', label: 'Community' },
  { id: 'inbox', label: 'Career Log' },
  { id: 'events', label: 'Events' },
];

const TYPE_META = {
  pos: { label: 'Career update', color: 'var(--accent-green)' },
  neg: { label: 'Risk & finance', color: 'var(--accent-red)' },
  milestone: { label: 'Milestone', color: 'var(--accent-gold-lt)' },
  npc: { label: 'Industry', color: 'var(--text-secondary)' },
  '': { label: 'Journal', color: 'var(--text-muted)' },
};

const weekLabel = (entry) => entry.week == null ? 'Career log' : `Week ${entry.week}`;

function NewsRows({ items, compact = false }) {
  if (!items.length) {
    return <div className="news-empty">The simulation has not recorded an update here yet. Close a week or make a career move to begin the chronology.</div>;
  }

  return (
    <ol className="news-list">
      {items.map((entry, index) => {
        const meta = TYPE_META[entry.type] || TYPE_META[''];
        return (
          <li className="news-item" data-type={entry.type || 'journal'} key={`${entry.week ?? 0}-${index}-${entry.msg}`}>
            <span className="news-item-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="news-marker" style={{ background: meta.color }} aria-hidden="true" />
            <div className="news-item-copy">
              <div className="news-item-meta"><span style={{ color: meta.color }}>{meta.label}</span><span>{weekLabel(entry)}</span></div>
              <p>{entry.msg}</p>
              {compact && <span className="news-item-sequence">ENTRY {String(index + 1).padStart(2, '0')}</span>}
            </div>
          </li>
        );
      })}
    </ol>
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
  const visibleWire = useMemo(() => entries.filter(item => {
    if (filter === 'progress') return item.type === 'pos' || item.type === 'milestone';
    if (filter === 'risk') return item.type === 'neg';
    return true;
  }).slice(0, 30), [entries, filter]);
  const resolvedEvents = entries.filter(item => item.type === 'neg' || item.type === 'milestone').slice(0, 30);
  const changeSection = (id) => {
    setSection(id);
    patch({ appRoutes: { ...(gs.appRoutes || {}), news: id } });
  };
  const heading = section === 'community' ? 'Community' : section === 'inbox' ? 'Career log' : section === 'events' ? 'Events' : 'The Wire';
  const latest = visibleWire[0];
  const latestMeta = latest ? (TYPE_META[latest.type] || TYPE_META['']) : null;

  return (
    <div className={`news-shell${section === 'community' ? ' is-community' : ''}`}>
      <header className="editorial-page-head news-page-head">
        <div className="wire-publication-line"><span>TREBLR <i>/</i> CULTURE DESK</span><span>CAREER EDITION · {entries.length} FILED</span></div>
        <div className="page-kicker">THE CAREER JOURNAL</div>
        <h1>{heading}</h1>
        <p>{section === 'community' ? 'Audience totals and platform actions from this simulation.' : 'A record of the decisions, risks and events your career actually produced.'}</p>
      </header>
      <SubNav items={SECTIONS} active={section} onChange={changeSection} />

      {section === 'wire' && (
        <div className="news-scroll">
          <div className="wire-edition-line"><span>SIMULATION EDITION</span><span>{entries.length} RECORDED UPDATE{entries.length === 1 ? '' : 'S'}</span></div>
          <div className="news-filter" role="group" aria-label="Filter career updates">
            {[['all', 'All'], ['progress', 'Progress'], ['risk', 'Risks']].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          {latest ? (
            <article className="wire-lead" data-type={latest.type || 'journal'}>
              <div className="wire-lead-overline"><span>THE LATEST DISPATCH</span><span>NO. {String(entries.length).padStart(2, '0')}</span></div>
              <div className="wire-lead-meta"><span style={{ color: latestMeta.color }}>{latestMeta.label}</span><span>{weekLabel(latest)}</span></div>
              <p>{latest.msg}</p>
              <span className="wire-lead-caption">A RECORDED SIMULATION EVENT <i>·</i> NOT A PREDICTION</span>
            </article>
          ) : <div className="wire-empty-lead"><strong>No dispatches yet.</strong><span>Career updates appear here when the simulation records them.</span></div>}
          <SectionLabel>Earlier in the record</SectionLabel>
          <NewsRows items={visibleWire.slice(latest ? 1 : 0)} />
        </div>
      )}

      {section === 'inbox' && (
        <div className="news-scroll">
          <div className="wire-section-intro"><span>ACTIVITY LEDGER</span><p>Career Log is the chronological record of simulation events. Treblr does not model direct-message threads.</p></div>
          <NewsRows items={entries.slice(0, 40)} compact />
        </div>
      )}

      {section === 'events' && (
        <div className="news-scroll">
          <div className="wire-section-intro"><span>DECISIONS & CONSEQUENCES</span><p>Choice events appear when they happen. Resolved milestones and risk events are listed here with their recorded week.</p></div>
          <NewsRows items={resolvedEvents} />
        </div>
      )}

      {section === 'community' && (
        <>
          <div className="community-summary">
            <div><span>REPUTATION</span><strong>{Math.round(gs.reputation ?? 50)}<small>/100</small></strong></div>
            <div><span>ALL-PLATFORM FOLLOWERS</span><strong>{fmt(Object.values(gs.socialPlatforms || {}).reduce((sum, value) => sum + Number(value || 0), 0))}</strong></div>
            <p>These are simulated follower totals. Per-post likes, comments, shares and engagement counts are not tracked.</p>
          </div>
          <div className="news-community-slot"><SocialTab {...props} /></div>
        </>
      )}
    </div>
  );
}
