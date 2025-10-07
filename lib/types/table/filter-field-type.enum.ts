/**
 * Supported filter field types for generic filter rendering
 */
export const FilterFieldType = {
  SEARCH: 'search',
  SELECT: 'select',
  MULTI_SELECT: 'multi-select',
  DATE_RANGE: 'date-range',
  DATE: 'date',
  NUMBER_RANGE: 'number-range',
  BOOLEAN: 'boolean',
  CUSTOM: 'custom',
} as const;

export type FilterFieldType =
  (typeof FilterFieldType)[keyof typeof FilterFieldType];
