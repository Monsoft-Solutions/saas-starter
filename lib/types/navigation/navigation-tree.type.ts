import { NavigationItem } from './navigation-item.type';

/**
 * Collection of navigation items rooted at a shared base path.
 */
export type NavigationTree = {
  key: string;
  basePath: string;
  items: NavigationItem[];
};
