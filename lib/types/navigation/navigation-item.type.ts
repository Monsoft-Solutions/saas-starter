import { LucideIcon } from 'lucide-react';

/**
 * Describes a navigable entry that can appear in headers, sidebars, or palettes.
 */
export type NavigationItem = {
  key: string;
  slug: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  roles?: string[];
  scopes?: string[];
  external?: boolean;
  hidden?: boolean;
  featureFlag?: string;
  children?: NavigationItem[];
};
