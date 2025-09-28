/**
 * Notion-inspired Design System
 *
 * A comprehensive design system built with shadcn/ui components
 * and Notion-inspired aesthetics for the Next.js SaaS starter.
 */

// Design tokens
export * from './tokens/colors';
export * from './tokens/typography';
export * from './tokens/spacing';
export * from './tokens/radius';

// Utilities
export * from './utils/theme';
export * from './utils/responsive';

// Re-export commonly used utilities
export { themeUtils, variants } from './utils/theme';
export { cn } from '../utils';
export {
  responsive,
  responsiveUtils,
  containerWidths,
  containerPadding,
  gridSystem,
} from './utils/responsive';
export { colors } from './tokens/colors';
export { typography } from './tokens/typography';
export { spacing, notionSpacing } from './tokens/spacing';
export { radius, notionRadius } from './tokens/radius';
