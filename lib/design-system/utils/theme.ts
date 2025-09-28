/**
 * Theme-aware utility functions
 */
export const themeUtils = {
  /**
   * Get a CSS variable value for a given color token
   */
  getColorValue: (colorName: string) => `var(--color-${colorName})`,

  /**
   * Get a CSS variable value with opacity
   */
  getColorWithOpacity: (colorName: string, opacity: number) => {
    const safeOpacity = Math.min(Math.max(opacity, 0), 1);
    const percentage = Math.round(safeOpacity * 100);

    return `color-mix(in srgb, var(--color-${colorName}) ${percentage}%, transparent)`;
  },

  /**
   * Create theme-aware background classes
   */
  background: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    muted: 'bg-muted text-muted-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    card: 'bg-card text-card-foreground',
    popover: 'bg-popover text-popover-foreground',
  },

  /**
   * Create theme-aware border classes
   */
  border: {
    default: 'border-border',
    muted: 'border-muted',
    accent: 'border-accent',
    primary: 'border-primary',
    destructive: 'border-destructive',
  },

  /**
   * Create theme-aware text classes
   */
  text: {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive',
  },

  /**
   * Notion-style component patterns
   */
  patterns: {
    page: 'min-h-screen bg-background text-foreground',
    container: 'mx-auto max-w-7xl px-6 py-8',
    card: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    section: 'space-y-6',
    heading: 'text-2xl font-semibold tracking-tight',
    subheading: 'text-lg font-medium',
    body: 'text-base leading-relaxed',
    muted: 'text-sm text-muted-foreground',
  },
} as const;

/**
 * Component variant utilities
 */
export const variants = {
  button: {
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-base',
      xl: 'h-11 px-8 text-base',
    },
    variants: {
      default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      destructive:
        'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      outline:
        'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
      secondary:
        'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
  },
  input: {
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-3 text-sm',
      lg: 'h-10 px-3 text-base',
    },
  },
} as const;

export type ThemeUtils = typeof themeUtils;
export type ComponentVariants = typeof variants;
