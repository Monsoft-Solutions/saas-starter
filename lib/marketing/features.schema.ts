import { z } from 'zod';

/**
 * Canonical set of marketing feature slugs used across routes and navigation.
 */
export const FEATURE_SLUGS = [
  'authentication',
  'stripe-billing',
  'design-system',
  'transactional-email',
  'testing',
] as const;

/**
 * Schema describing a documentation link that supports a feature story.
 */
export const featureDocLinkSchema = z
  .object({
    title: z.string().min(1, 'Doc link title cannot be empty.'),
    href: z.string().min(1, 'Doc link href cannot be empty.'),
  })
  .strict();

/**
 * Schema describing the marketing copy for a single feature pillar.
 */
export const featureDefinitionSchema = z.object({
  slug: z.enum(FEATURE_SLUGS),
  label: z.string().min(1, 'Feature label is required.'),
  headline: z.string().min(1, 'Feature headline is required.'),
  summary: z.string().min(1, 'Feature summary is required.'),
  highlightBullets: z
    .array(z.string().min(1, 'Feature highlight cannot be empty.'))
    .min(2, 'Provide at least two highlights per feature.')
    .readonly(),
  primaryDocs: z
    .array(featureDocLinkSchema)
    .min(1, 'Provide at least one supporting doc link.')
    .readonly(),
});

/**
 * Schema guarding the entire marketing feature registry.
 */
export const featureRegistrySchema = z.array(featureDefinitionSchema);

/**
 * Strongly typed marketing feature definition derived from the canonical schema.
 */
export type FeatureDefinition = z.infer<typeof featureDefinitionSchema>;
