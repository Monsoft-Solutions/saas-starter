# Stripe Metadata Validation with Zod

This document explains how our Stripe metadata validation system works using Zod schemas.

## Overview

We use Zod to validate Stripe product metadata before parsing features and other attributes. This ensures type safety and graceful error handling when working with dynamic data from Stripe.

## Schema Structure

### StripeProductMetadataSchema

```typescript
const StripeProductMetadataSchema = z
  .object({
    features: z.string().optional(), // JSON array as string
    feature_list: z.string().optional(), // Comma-separated values
    popular: z.enum(['true', 'false']).optional(),
    is_popular: z.enum(['true', 'false']).optional(),
    category: z.string().optional(),
    trial_days: z.string().optional(),
  })
  .catchall(z.string()); // Allow additional string metadata
```

### Supporting Schemas

- **FeaturesArraySchema**: Validates JSON-parsed feature arrays
- **FeatureKeySchema**: Validates individual feature key format (`feature_1`, `feature_2`, etc.)

## Parsing Methods

### 1. JSON Features (Recommended)

```json
{
  "features": "[\"Feature 1\", \"Feature 2\", \"Feature 3\"]",
  "popular": "true"
}
```

### 2. Comma-Separated Features

```json
{
  "feature_list": "Feature A, Feature B, Feature C",
  "popular": "false"
}
```

### 3. Individual Feature Keys

```json
{
  "feature_1": "First Feature",
  "feature_2": "Second Feature",
  "feature_3": "Third Feature",
  "popular": "true"
}
```

## Error Handling

The validation system includes multiple layers of error handling:

1. **Schema Validation**: Zod validates the overall metadata structure
2. **JSON Parsing**: Gracefully handles invalid JSON with fallbacks
3. **Feature Filtering**: Removes empty values and invalid keys
4. **Graceful Degradation**: Returns empty arrays/false on errors

## Testing

Run the validation test suite:

```bash
node scripts/test-metadata-validation.js
```

This tests all parsing methods and error scenarios.

## Usage in Code

```typescript
import {
  parseProductFeatures,
  parseProductPopularity,
} from '@/lib/payments/stripe';

// Parse features with validation
const features = parseProductFeatures(product.metadata || {});

// Parse popularity with validation
const isPopular = parseProductPopularity(product.metadata || {});
```

## Best Practices

1. **Use JSON method** for complex feature lists
2. **Validate before storing** metadata in Stripe
3. **Test edge cases** with the validation script
4. **Monitor console** for validation warnings in development
5. **Always provide fallbacks** for missing metadata

## Benefits

- ✅ **Type Safety**: Zod ensures runtime type validation
- ✅ **Error Recovery**: Graceful fallbacks prevent crashes
- ✅ **Multiple Formats**: Supports 3 different metadata formats
- ✅ **Validation**: Comprehensive error checking
- ✅ **Debugging**: Clear error messages for invalid data
