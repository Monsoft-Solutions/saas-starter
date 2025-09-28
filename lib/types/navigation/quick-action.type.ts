import { LucideIcon } from 'lucide-react';

/**
 * Metadata for command palette shortcuts that resolve to navigation entries.
 */
export type QuickAction = {
  key: string;
  label: string;
  target: string;
  description?: string;
  category?: string;
  icon?: LucideIcon;
  roles?: string[];
  scopes?: string[];
};
