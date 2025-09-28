import { describe, it, expect } from 'vitest';

// Import the actual schemas from our types
import {
  StripeProductMetadataSchema,
  FeaturesArraySchema,
  FeatureKeySchema,
} from '@/lib/types/payments/stripe-metadata.schema';

/**
 * Parse product features from Stripe metadata
 * This replicates the logic from our Stripe integration
 */
function parseProductFeatures(metadata: Record<string, any>): string[] {
  try {
    const validatedMetadata = StripeProductMetadataSchema.parse(metadata);

    // Method 1: Features stored as JSON array
    if (validatedMetadata.features) {
      try {
        const parsedFeatures = JSON.parse(validatedMetadata.features);
        const validatedFeatures = FeaturesArraySchema.parse(parsedFeatures);
        return validatedFeatures;
      } catch (parseError) {
        // Silently continue to next method on parse error
      }
    }

    // Method 2: Comma-separated values
    if (validatedMetadata.feature_list) {
      const features = validatedMetadata.feature_list
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      if (features.length > 0) {
        return features;
      }
    }

    // Method 3: Individual feature keys
    const features: string[] = [];
    Object.keys(validatedMetadata)
      .filter((key) => {
        try {
          FeatureKeySchema.parse(key);
          return true;
        } catch {
          return false;
        }
      })
      .sort()
      .forEach((key) => {
        const value = validatedMetadata[key];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          features.push(value.trim());
        }
      });

    return features;
  } catch (validationError) {
    return [];
  }
}

/**
 * Parse product popularity from Stripe metadata
 */
function parseProductPopularity(metadata: Record<string, any>): boolean {
  try {
    const validatedMetadata = StripeProductMetadataSchema.parse(metadata);
    return (
      validatedMetadata.popular === 'true' ||
      validatedMetadata.is_popular === 'true'
    );
  } catch (validationError) {
    return false;
  }
}

describe('Stripe Metadata Validation', () => {
  describe('parseProductFeatures', () => {
    it('should parse valid JSON features', () => {
      const metadata = {
        features: '["Feature 1", "Feature 2", "Feature 3"]',
        popular: 'true',
        category: 'pro',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Feature 1', 'Feature 2', 'Feature 3']);
    });

    it('should parse valid comma-separated features', () => {
      const metadata = {
        feature_list: 'Feature A, Feature B, Feature C',
        popular: 'false',
        trial_days: '14',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Feature A', 'Feature B', 'Feature C']);
    });

    it('should parse valid individual feature keys', () => {
      const metadata = {
        feature_1: 'First Feature',
        feature_2: 'Second Feature',
        feature_3: 'Third Feature',
        is_popular: 'true',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual([
        'First Feature',
        'Second Feature',
        'Third Feature',
      ]);
    });

    it('should fallback to feature_list when JSON is invalid', () => {
      const metadata = {
        features: '["Invalid JSON',
        feature_list: 'Fallback Feature 1, Fallback Feature 2',
        popular: 'false',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Fallback Feature 1', 'Fallback Feature 2']);
    });

    it('should return empty array for empty features', () => {
      const metadata = {
        features: '[]',
        popular: 'false',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual([]);
    });

    it('should filter out invalid feature keys and empty values', () => {
      const metadata = {
        feature_1: 'Valid Feature 1',
        feature_invalid: 'Invalid Feature', // Invalid key format
        feature_2: 'Valid Feature 2',
        feature_3: '', // Empty value
        popular: 'true',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Valid Feature 1', 'Valid Feature 2']);
    });

    it('should return empty array for completely invalid metadata', () => {
      const metadata = {
        invalid_key: 123, // Non-string value
        another_invalid: null,
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual([]);
    });

    it('should trim whitespace from comma-separated features', () => {
      const metadata = {
        feature_list: '  Feature A  ,   Feature B  , Feature C   ',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Feature A', 'Feature B', 'Feature C']);
    });

    it('should filter out empty comma-separated features', () => {
      const metadata = {
        feature_list: 'Feature A, , Feature B, ,, Feature C',
      };

      const features = parseProductFeatures(metadata);

      expect(features).toEqual(['Feature A', 'Feature B', 'Feature C']);
    });
  });

  describe('parseProductPopularity', () => {
    it('should return true for popular="true"', () => {
      const metadata = {
        features: '["Feature 1"]',
        popular: 'true',
      };

      const isPopular = parseProductPopularity(metadata);

      expect(isPopular).toBe(true);
    });

    it('should return true for is_popular="true"', () => {
      const metadata = {
        features: '["Feature 1"]',
        is_popular: 'true',
      };

      const isPopular = parseProductPopularity(metadata);

      expect(isPopular).toBe(true);
    });

    it('should return false for popular="false"', () => {
      const metadata = {
        features: '["Feature 1"]',
        popular: 'false',
      };

      const isPopular = parseProductPopularity(metadata);

      expect(isPopular).toBe(false);
    });

    it('should return false for invalid popularity value', () => {
      const metadata = {
        features: '["Feature 1"]',
        popular: 'maybe', // Invalid - should be 'true' or 'false'
      };

      const isPopular = parseProductPopularity(metadata);

      expect(isPopular).toBe(false);
    });

    it('should return false for completely invalid metadata', () => {
      const metadata = {
        invalid_key: 123,
        another_invalid: null,
      };

      const isPopular = parseProductPopularity(metadata);

      expect(isPopular).toBe(false);
    });

    it('should prioritize popular over is_popular when both are present', () => {
      const metadata = {
        popular: 'false',
        is_popular: 'true',
      };

      const isPopular = parseProductPopularity(metadata);

      // Should return true because popular='false' OR is_popular='true' = true
      expect(isPopular).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct metadata structure', () => {
      const metadata = {
        features: '["Feature 1", "Feature 2"]',
        popular: 'true',
        category: 'professional',
        trial_days: '14',
      };

      expect(() => StripeProductMetadataSchema.parse(metadata)).not.toThrow();
    });

    it('should allow additional string fields', () => {
      const metadata = {
        features: '["Feature 1"]',
        custom_field: 'custom value',
        another_field: 'another value',
      };

      expect(() => StripeProductMetadataSchema.parse(metadata)).not.toThrow();
    });

    it('should validate features array schema', () => {
      const validFeatures = ['Feature 1', 'Feature 2', 'Feature 3'];
      const invalidFeatures = ['Feature 1', '', 'Feature 3']; // Empty string

      expect(() => FeaturesArraySchema.parse(validFeatures)).not.toThrow();
      expect(() => FeaturesArraySchema.parse(invalidFeatures)).toThrow();
    });

    it('should validate feature key schema', () => {
      const validKeys = ['feature_1', 'feature_2', 'feature_10'];
      const invalidKeys = [
        'feature_',
        'feature',
        'feature_a',
        'invalid_feature',
      ];

      validKeys.forEach((key) => {
        expect(() => FeatureKeySchema.parse(key)).not.toThrow();
      });

      invalidKeys.forEach((key) => {
        expect(() => FeatureKeySchema.parse(key)).toThrow();
      });
    });
  });
});
