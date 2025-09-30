import featureInventoryJson from './features-inventory.json';
import {
  featureRegistrySchema,
  type FeatureDefinition,
} from './features.schema';

/**
 * Parsed, validated collection of marketing feature narratives.
 */
export const FEATURES: ReadonlyArray<FeatureDefinition> =
  featureRegistrySchema.parse(featureInventoryJson);

/**
 * Internal lookup map to speed up slug-based feature retrievals.
 */
const featuresBySlug = new Map(
  FEATURES.map((definition) => [definition.slug, definition] as const)
);

/**
 * Quickly resolves a feature definition by its slug, throwing if it cannot be found.
 */
export const getFeatureBySlug = (
  slug: FeatureDefinition['slug']
): FeatureDefinition => {
  const feature = featuresBySlug.get(slug);

  if (!feature) {
    throw new Error(`Unknown marketing feature slug: ${slug}`);
  }

  return feature;
};

/**
 * Provides a label-sorted snapshot of the feature registry for stable rendering.
 */
export const sortedFeatures = (): ReadonlyArray<FeatureDefinition> => {
  return [...FEATURES].sort((first, second) =>
    first.label.localeCompare(second.label)
  );
};
