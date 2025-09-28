import { z } from 'zod';

/**
 * Zod schema for validating Stripe product metadata
 * Ensures the metadata structure is correct before parsing
 */
export const StripeProductMetadataSchema = z
  .object({
    /**
     * Features stored as JSON array string
     */
    features: z.string().optional(),

    /**
     * Features stored as comma-separated values
     */
    feature_list: z.string().optional(),

    /**
     * Whether this product should be marked as popular
     */
    popular: z.enum(['true', 'false']).optional(),

    /**
     * Alternative popular field name
     */
    is_popular: z.enum(['true', 'false']).optional(),

    /**
     * Product category (for future use)
     */
    category: z.string().optional(),

    /**
     * Trial period in days
     */
    trial_days: z.string().optional(),
  })
  .catchall(z.string()); // Allow additional string metadata keys

/**
 * Type derived from the Zod schema
 */
export type StripeProductMetadata = z.infer<typeof StripeProductMetadataSchema>;

/**
 * Schema for validating individual feature metadata keys (feature_1, feature_2, etc.)
 */
export const FeatureKeySchema = z
  .string()
  .regex(/^feature_\d+$/, 'Invalid feature key format');

/**
 * Schema for validating JSON features array
 */
export const FeaturesArraySchema = z.array(
  z.string().min(1, 'Feature cannot be empty')
);
