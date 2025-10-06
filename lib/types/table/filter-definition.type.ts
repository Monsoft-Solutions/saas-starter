import type { FilterFieldType } from './filter-field-type.enum';

/**
 * Generic filter field definition.
 * Supports multiple input types with type-safe value handling.
 *
 * @template TFilters - The shape of filter state
 */
export type FilterDefinition<TFilters> = {
  /** Filter field key (typed against TFilters) */
  key: keyof TFilters;

  /** Display label */
  label: string;

  /** Input type (search, select, date-range, etc.) */
  type: FilterFieldType;

  /** Placeholder text */
  placeholder?: string;

  /** Options for select-type filters */
  options?: Array<{
    label: string;
    value: string | number | boolean;
  }>;

  /** Debounce delay in ms (for search inputs) */
  debounceMs?: number;

  /** Default value */
  defaultValue?: TFilters[keyof TFilters];

  /** Custom render function */
  customRender?: (props: {
    value: TFilters[keyof TFilters];
    onChange: (value: TFilters[keyof TFilters]) => void;
    disabled?: boolean;
  }) => React.ReactNode;

  /** Badge label formatter (for active filters) */
  formatBadgeLabel?: (value: TFilters[keyof TFilters]) => string;
};
