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
  primary: '#2e3440',
  'primary-foreground': '#ffffff',
  secondary: '#fbfaf9',
  'secondary-foreground': '#37352f',
  muted: '#f7f6f3',
  'muted-foreground': '#787066',
  accent: '#f1f0ee',
  'accent-foreground': '#37352f',
  destructive: '#d73502',
  'destructive-foreground': '#ffffff',
  success: '#0f7b6c',
  'success-foreground': '#ffffff',
  warning: '#cb6040',
  'warning-foreground': '#ffffff',
  border: '#e9e5e2',
  input: '#e9e5e2',
  ring: '#2e3440',
  'chart-1': '#2e3440',
  'chart-2': '#0f7b6c',
  'chart-3': '#cb6040',
  'chart-4': '#d73502',
  'chart-5': '#5e6ad2',
  'sidebar-background': '#fbfaf9',
  'sidebar-foreground': '#37352f',
  'sidebar-primary': '#2e3440',
  'sidebar-primary-foreground': '#ffffff',
  'sidebar-accent': '#f1f0ee',
  'sidebar-accent-foreground': '#37352f',
  'sidebar-border': '#e9e5e2',
  'sidebar-ring': '#2e3440',
} as const;

const dark = {
  background: '#191919',
  foreground: '#f7f6f4',
  card: '#2f2f2f',
  'card-foreground': '#f7f6f4',
  popover: '#2f2f2f',
  'popover-foreground': '#f7f6f4',
  primary: '#6366f1',
  'primary-foreground': '#ffffff',
  secondary: '#373737',
  'secondary-foreground': '#f7f6f4',
  muted: '#2a2a2a',
  'muted-foreground': '#9b9b9b',
  accent: '#404040',
  'accent-foreground': '#f7f6f4',
  destructive: '#ef4444',
  'destructive-foreground': '#ffffff',
  success: '#10b981',
  'success-foreground': '#ffffff',
  warning: '#f59e0b',
  'warning-foreground': '#000000',
  border: '#404040',
  input: '#404040',
  ring: '#6366f1',
  'chart-1': '#6366f1',
  'chart-2': '#10b981',
  'chart-3': '#f59e0b',
  'chart-4': '#ef4444',
  'chart-5': '#8b5cf6',
  'sidebar-background': '#2a2a2a',
  'sidebar-foreground': '#f7f6f4',
  'sidebar-primary': '#6366f1',
  'sidebar-primary-foreground': '#ffffff',
  'sidebar-accent': '#404040',
  'sidebar-accent-foreground': '#f7f6f4',
  'sidebar-border': '#404040',
  'sidebar-ring': '#6366f1',
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
