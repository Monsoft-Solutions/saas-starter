/**
 * Consistent spacing system inspired by Notion's clean layouts
 */

export const spacing = {
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  18: '4.5rem', // 72px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

/**
 * Notion-specific spacing patterns optimized for user experience
 * Based on visual hierarchy and cognitive processing
 */
export const notionSpacing = {
  // Page layout spacing - breathing room for content
  pageGutter: spacing[6], // 24px - comfortable page margins
  pagePadding: spacing[8], // 32px - generous content padding
  pageMaxWidth: '1200px', // Maximum content width for readability

  // Content hierarchy spacing
  sectionGap: spacing[12], // 48px - clear section separation
  componentGap: spacing[6], // 24px - related component grouping
  elementGap: spacing[4], // 16px - element spacing within components
  microGap: spacing[2], // 8px - tight related elements

  // Card and container spacing - balanced internal spacing
  cardPadding: spacing[6], // 24px - comfortable card internal spacing
  cardPaddingLarge: spacing[8], // 32px - spacious cards for important content
  cardPaddingSmall: spacing[4], // 16px - compact cards for lists
  containerPadding: spacing[5], // 20px - general container padding

  // Navigation spacing - optimized for scanning and clicking
  navItemPadding: spacing[3], // 12px - comfortable nav item padding
  navItemHeight: spacing[10], // 40px - comfortable click target height
  navGap: spacing[1], // 4px - tight nav item grouping
  navSectionGap: spacing[4], // 16px - nav section separation

  // Form spacing - guides user through flow
  formGap: spacing[6], // 24px - clear form section separation
  fieldGap: spacing[4], // 16px - field spacing within forms
  fieldInternalGap: spacing[2], // 8px - label to input spacing
  inputPadding: spacing[3], // 12px - comfortable input internal padding
  buttonPadding: {
    small: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    default: `${spacing[2.5]} ${spacing[4]}`, // 10px 16px
    large: `${spacing[3]} ${spacing[6]}`, // 12px 24px
  },

  // List and data spacing
  listGap: spacing[2], // 8px - list item spacing
  listItemPadding: spacing[3], // 12px - list item internal padding
  tableRowHeight: spacing[12], // 48px - comfortable table row height
  tableCellPadding: spacing[4], // 16px - table cell padding

  // Sidebar and panel spacing
  sidebarWidth: '280px', // Optimal sidebar width
  sidebarPadding: spacing[4], // 16px - sidebar internal padding
  sidebarItemGap: spacing[1], // 4px - sidebar item spacing

  // Modal and dialog spacing
  dialogPadding: spacing[6], // 24px - dialog internal padding
  dialogGap: spacing[4], // 16px - dialog content spacing
  overlayPadding: spacing[4], // 16px - overlay edge spacing

  // Header and footer spacing
  headerHeight: spacing[16], // 64px - standard header height
  headerPadding: spacing[4], // 16px - header internal padding
  footerPadding: spacing[8], // 32px - footer padding

  // Focus and interaction spacing
  focusOffset: spacing[0.5], // 2px - focus ring offset
  hoverPadding: spacing[2], // 8px - hover state padding increase

  // Responsive breakpoints for spacing adjustments
  breakpoints: {
    mobile: {
      pagePadding: spacing[4], // 16px - reduced on mobile
      cardPadding: spacing[4], // 16px - tighter on mobile
      sectionGap: spacing[8], // 32px - reduced section gaps
    },
    tablet: {
      pagePadding: spacing[6], // 24px - medium padding
      cardPadding: spacing[5], // 20px - medium card padding
      sectionGap: spacing[10], // 40px - medium section gaps
    },
  },
} as const;

export type Spacing = typeof spacing;
export type SpacingValue = keyof typeof spacing;
export type NotionSpacing = typeof notionSpacing;
