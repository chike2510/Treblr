import { useGame } from '../ui/kit.jsx';

export const FEATURE_SUBPAGES = {
  tours: { tours: 'Overview', 'tour-routes': 'Route book', 'tour-crew': 'Road crew', 'tour-shows': 'Show ledger' },
  labels: { labels: 'Career paths', 'label-independent': 'Independent', 'label-distribution': 'Distribution', 'label-deals': 'Label meetings', 'label-imprint': 'Your imprint' },
  lifestyle: { lifestyle: 'Portfolio', 'lifestyle-property': 'Property', 'lifestyle-vehicles': 'Vehicles' },
  acting: { acting: 'Profile', 'acting-auditions': 'Auditions', 'acting-credits': 'Credits' },
  festivals: { festivals: 'Browse', 'festival-pitches': 'Pitch desk', 'festival-lineups': 'Lineups' },
  awards: { awards: 'Season', 'award-submissions': 'Submissions', 'award-results': 'Results' },
  merch: { merch: 'Overview', 'merch-products': 'Products', 'merch-sales': 'Sales' },
};
export const FEATURE_PAGE_IDS = Object.keys(FEATURE_SUBPAGES);
export const FEATURE_ROUTE_ROOT = Object.fromEntries(Object.entries(FEATURE_SUBPAGES).flatMap(([root, pages]) => Object.keys(pages).map((id) => [id, root])));
export const featurePageTitle = (id) => FEATURE_SUBPAGES[FEATURE_ROUTE_ROOT[id]]?.[id] || '';

export default function FeatureSubnav({ system, page }) {
  const { go } = useGame();
  const pages = FEATURE_SUBPAGES[FEATURE_ROUTE_ROOT[page]] || {};
  return <><div className="pills mt8" aria-label={`${system} pages`}>{Object.entries(pages).map(([route, label]) => <button key={route} className={`pill ${page === route ? 'on' : ''}`} onClick={() => go({ tab: 'world', section: route })}>{label}</button>)}</div></>;
}
