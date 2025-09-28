/**
 * Border radius system for consistent rounded corners
 */

export const radius = {
  none: '0px',
  xs: '0.125rem', // 2px - for very subtle rounding
  sm: '0.25rem', // 4px - for small elements
  base: '0.375rem', // 6px - default comfortable radius
  md: '0.5rem', // 8px - for cards and containers
  lg: '0.75rem', // 12px - for prominent elements
  xl: '1rem', // 16px - for large containers
  '2xl': '1.25rem', // 20px - for very large elements
  '3xl': '1.5rem', // 24px - for hero sections
  full: '9999px', // circular
} as const;

/**
 * Notion-specific radius patterns for a modern, clean feel
 */
export const notionRadius = {
  // Default radius for most UI elements - slightly more rounded for modern feel
  default: radius.base, // 6px - comfortable, not too sharp

  // Card and container radius - modern but not overly rounded
  card: radius.md, // 8px - perfect for cards and panels

  // Large card radius for prominent sections
  cardLarge: radius.lg, // 12px - for hero cards, feature cards

  // Button radius - modern and friendly
  button: radius.base, // 6px - comfortable click targets

  // Button variants
  buttonSmall: radius.sm, // 4px - for small buttons
  buttonLarge: radius.md, // 8px - for primary/large buttons

  // Input radius - consistent with buttons
  input: radius.base, // 6px - matches button radius for form consistency

  // Dialog and modal radius
  dialog: radius.lg, // 12px - prominent but not excessive

  // Popover radius - subtle
  popover: radius.md, // 8px - clean popover appearance

  // Avatar radius options
  avatar: radius.full, // circular - standard avatar
  avatarSquare: radius.base, // 6px - for square avatars

  // Navigation elements
  sidebar: radius.sm, // 4px - subtle sidebar item rounding
  tab: radius.sm, // 4px - clean tab appearance

  // Badge and chip radius
  badge: radius.full, // pill-shaped badges
  chip: radius.lg, // 12px - comfortable chip shape

  // Image radius
  image: radius.md, // 8px - nice image containers
  imageSmall: radius.base, // 6px - for thumbnails
} as const;

export type Radius = typeof radius;
export type RadiusValue = keyof typeof radius;
export type NotionRadius = typeof notionRadius;
