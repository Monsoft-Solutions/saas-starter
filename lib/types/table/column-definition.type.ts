import type { ColumnDef } from '@tanstack/react-table';

/**
 * Extended column definition with custom rendering and formatting.
 * Wraps TanStack Table's ColumnDef with additional metadata.
 *
 * @template TData - The shape of row data
 */
export type ColumnDefinition<TData> = ColumnDef<TData> & {
  /** Column unique identifier */
  id?: string;

  /** Column header label */
  header: string;

  /** Data accessor key (typed against TData) */
  accessorKey?: keyof TData;

  /** Custom cell renderer */
  cell?: (props: { row: { original: TData } }) => React.ReactNode;

  /** Enable/disable sorting for this column */
  enableSorting?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Column alignment */
  align?: 'left' | 'center' | 'right';
};
