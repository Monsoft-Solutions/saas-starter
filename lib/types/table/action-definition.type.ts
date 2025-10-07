import type { LucideIcon } from 'lucide-react';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';

/**
 * Row action definition for dropdown menus.
 *
 * @template TData - The shape of row data
 */
export type ActionDefinition<TData> = {
  /** Unique action identifier */
  id: string;

  /** Action label */
  label: string | ((row: TData) => string);

  /** Icon component */
  icon?: LucideIcon;

  /** Action handler (supports async operations) */
  onClick: (row: TData) => void | Promise<void>;

  /** Show separator after this action */
  separator?: boolean;

  /** Conditional visibility */
  show?: (row: TData) => boolean;

  /** Destructive styling (for delete actions, supports dynamic variants) */
  variant?:
    | 'default'
    | 'destructive'
    | 'success'
    | ((row: TData) => 'default' | 'destructive' | 'success');

  /** Disable condition */
  disabled?: (row: TData) => boolean;

  /** Required permission(s) to perform this action */
  requiredPermission?: AdminPermission;

  /** Tooltip to show when action is disabled due to insufficient permissions */
  permissionTooltip?: string;
};
