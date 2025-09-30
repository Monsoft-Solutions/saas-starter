import { describe, expect, it } from 'vitest';

import {
  FEATURES,
  getFeatureBySlug,
  sortedFeatures,
} from '@/lib/marketing/features.data';

import type { FeatureDefinition } from '@/lib/marketing/features.schema';

describe('marketing feature registry', () => {
  it('exposes the canonical list of marketing features', () => {
    expect(FEATURES).toHaveLength(5);
  });

  it('resolves features by slug', () => {
    const authFeature = getFeatureBySlug('authentication');

    expect(authFeature.label).toBe('Authentication & Access');
  });

  it('throws when a feature slug is missing', () => {
    expect(() =>
      getFeatureBySlug('missing' as FeatureDefinition['slug'])
    ).toThrow(/Unknown marketing feature slug: missing/);
  });

  it('sorts features without mutating the registry', () => {
    const sorted = sortedFeatures();

    expect(sorted).toHaveLength(FEATURES.length);
    expect(sorted[0]!.label <= sorted[sorted.length - 1]!.label).toBe(true);
    expect(sorted).not.toBe(FEATURES);
  });
});
