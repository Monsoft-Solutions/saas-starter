/**
 * Notion-inspired color palette
 * These colors are designed to work with both light and dark themes
 */

/**
 * Notion-inspired color palette using proper Tailwind CSS v4 format
 * Colors are defined as hex values for use in @theme directive
 */
const light = {
  background: '#ffffff',
  foreground: '#37352f',
  card: '#ffffff',
  'card-foreground': '#37352f',
  popover: '#ffffff',
  'popover-foreground': '#37352f',
  primary: '#4f7399',
  'primary-foreground': '#ffffff',
  secondary: '#fbfaf9',
  'secondary-foreground': '#37352f',
  muted: '#fbfaf9',
  'muted-foreground': '#6b6761',
  accent: '#f8f7f5',
  'accent-foreground': '#37352f',
  destructive: '#c2504c',
  'destructive-foreground': '#ffffff',
  success: '#668771',
  'success-foreground': '#ffffff',
  warning: '#b78e59',
  'warning-foreground': '#ffffff',
  border: '#edebe9',
  input: '#edebe9',
  ring: '#4f7399',
  'chart-1': '#4f7399',
  'chart-2': '#668771',
  'chart-3': '#b78e59',
  'chart-4': '#c2504c',
  'chart-5': '#87abcf',
  'sidebar-background': '#fbfaf9',
  'sidebar-foreground': '#37352f',
  'sidebar-primary': '#4f7399',
  'sidebar-primary-foreground': '#ffffff',
  'sidebar-accent': '#f8f7f5',
  'sidebar-accent-foreground': '#37352f',
  'sidebar-border': '#edebe9',
  'sidebar-ring': '#4f7399',
} as const;

const dark = {
  background: '#1e1b18',
  foreground: '#fdfcfb',
  card: '#292521',
  'card-foreground': '#fdfcfb',
  popover: '#292521',
  'popover-foreground': '#fdfcfb',
  primary: '#87abcf',
  'primary-foreground': '#1e1b18',
  secondary: '#292521',
  'secondary-foreground': '#fdfcfb',
  muted: '#292521',
  'muted-foreground': '#a8a29e',
  accent: '#332e2a',
  'accent-foreground': '#fdfcfb',
  destructive: '#dc7874',
  'destructive-foreground': '#1e1b18',
  success: '#86a791',
  'success-foreground': '#1e1b18',
  warning: '#cfae79',
  'warning-foreground': '#1e1b18',
  border: '#332e2a',
  input: '#332e2a',
  ring: '#87abcf',
  'chart-1': '#87abcf',
  'chart-2': '#86a791',
  'chart-3': '#cfae79',
  'chart-4': '#dc7874',
  'chart-5': '#4f7399',
  'sidebar-background': '#292521',
  'sidebar-foreground': '#fdfcfb',
  'sidebar-primary': '#87abcf',
  'sidebar-primary-foreground': '#1e1b18',
  'sidebar-accent': '#332e2a',
  'sidebar-accent-foreground': '#fdfcfb',
  'sidebar-border': '#332e2a',
  'sidebar-ring': '#87abcf',
} as const;

export const colors = {
  light,
  dark,
} as const;

/**
 * Color utilities for Tailwind CSS v4 theme generation
 */
export const colorTokens = {
  // Generate CSS custom properties for Tailwind
  toCssVars: (theme: 'light' | 'dark') => {
    const themeColors = colors[theme];
    return Object.entries(themeColors).reduce(
      (acc, [key, value]) => {
        acc[`--color-${key}`] = value;
        return acc;
      },
      {} as Record<string, string>
    );
  },
};

export type ColorTokens = typeof colors;
export type ThemeColors = keyof typeof colors;
export type ColorNames = keyof typeof colors.light;
