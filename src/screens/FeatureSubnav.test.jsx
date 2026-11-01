import { describe, it, expect } from 'vitest';
import { FEATURE_SUBPAGES, FEATURE_ROUTE_ROOT, featurePageTitle } from './FeatureSubnav.jsx';

describe('career feature routes', () => {
  it('maps every subpage to a live parent and readable title', () => {
    for (const [root, pages] of Object.entries(FEATURE_SUBPAGES)) {
      for (const [route, title] of Object.entries(pages)) {
        expect(FEATURE_ROUTE_ROOT[route]).toBe(root);
        expect(featurePageTitle(route)).toBe(title);
      }
    }
  });
  it('keeps the requested distinct systems and their multiple page routes', () => {
    for (const root of ['tours','labels','lifestyle','acting','merch','festivals','awards']) expect(Object.keys(FEATURE_SUBPAGES[root]).length).toBeGreaterThan(1);
    expect(FEATURE_SUBPAGES.labels).toMatchObject({ labels: 'Career paths', 'label-independent': 'Independent', 'label-distribution': 'Distribution', 'label-deals': 'Label meetings', 'label-imprint': 'Your imprint' });
  });
});
