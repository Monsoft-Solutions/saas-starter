/**
 * Responsive design utilities for consistent breakpoints
 */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Responsive utility classes following Notion's patterns
 */
export const responsive = {
  /**
   * Container max-widths for different breakpoints
   */
  containers: {
    sm: 'max-w-screen-sm', // 640px
    md: 'max-w-screen-md', // 768px
    lg: 'max-w-screen-lg', // 1024px
    xl: 'max-w-screen-xl', // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
  },

  /**
   * Common responsive patterns
   */
  patterns: {
    // Stack on mobile, side-by-side on larger screens
    flexStack: 'flex flex-col md:flex-row',

    // Grid layouts
    grid1: 'grid grid-cols-1',
    grid2: 'grid grid-cols-1 md:grid-cols-2',
    grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',

    // Responsive spacing
    spacing: {
      sm: 'p-4 md:p-6',
      md: 'p-6 md:p-8',
      lg: 'p-8 md:p-12',
    },

    // Responsive text sizes
    text: {
      heading: 'text-2xl md:text-3xl lg:text-4xl',
      subheading: 'text-lg md:text-xl',
      body: 'text-sm md:text-base',
    },

    // Hide/show at different breakpoints
    hide: {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
    },
    show: {
      sm: 'block sm:hidden',
      md: 'block md:hidden',
      lg: 'block lg:hidden',
    },
  },

  /**
   * Notion-specific responsive layouts
   */
  notionLayouts: {
    // Main content area with sidebar
    mainWithSidebar: 'flex flex-col lg:flex-row gap-6',

    // Page header responsive
    pageHeader:
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',

    // Card grid responsive
    cardGrid: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',

    // Dashboard layout
    dashboard: 'grid grid-cols-1 lg:grid-cols-4 gap-6',

    // Form layout
    form: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  },
} as const;

/**
 * Utility functions for responsive design
 */
export const responsiveUtils = {
  /**
   * Get responsive classes for a specific pattern
   */
  getPattern: (pattern: keyof typeof responsive.patterns) =>
    responsive.patterns[pattern],

  /**
   * Get container class for max-width
   */
  getContainer: (size: keyof typeof responsive.containers) =>
    responsive.containers[size],

  /**
   * Get responsive spacing
   */
  getSpacing: (size: keyof typeof responsive.patterns.spacing) =>
    responsive.patterns.spacing[size],

  /**
   * Create custom responsive classes
   */
  createResponsive: (
    baseClass: string,
    breakpoint: keyof typeof breakpoints,
    responsiveClass: string
  ) => `${baseClass} ${breakpoint}:${responsiveClass}`,
} as const;

/**
 * Container max-width classes for consistent content containers
 */
export const containerWidths = {
  sm: 'max-w-sm', // 24rem (384px)
  md: 'max-w-md', // 28rem (448px)
  lg: 'max-w-lg', // 32rem (512px)
  xl: 'max-w-xl', // 36rem (576px)
  '2xl': 'max-w-2xl', // 42rem (672px)
  '3xl': 'max-w-3xl', // 48rem (768px)
  '4xl': 'max-w-4xl', // 56rem (896px)
  '5xl': 'max-w-5xl', // 64rem (1024px)
  '6xl': 'max-w-6xl', // 72rem (1152px)
  '7xl': 'max-w-7xl', // 80rem (1280px)
  full: 'max-w-full',
  screen: 'max-w-screen-2xl',
} as const;

/**
 * Container padding classes
 */
export const containerPadding = {
  none: '',
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
  '2xl': 'p-12',
} as const;

/**
 * Grid system utilities
 */
export const gridSystem = {
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  },

  // Responsive grid patterns
  responsiveLayouts: {
    autoFit: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    autoFill: 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
    dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    cards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    twoColumn: 'grid-cols-1 lg:grid-cols-2',
    threeColumn: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    sidebarMain: 'grid-cols-1 lg:grid-cols-4',
  },

  gaps: {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
    16: 'gap-16',
  },
} as const;

export type Breakpoints = typeof breakpoints;
export type ResponsivePatterns = typeof responsive;
export type ResponsiveUtils = typeof responsiveUtils;
export type ContainerWidth = keyof typeof containerWidths;
export type ContainerPadding = keyof typeof containerPadding;
export type GridCols = keyof typeof gridSystem.cols;
export type GridGap = keyof typeof gridSystem.gaps;
