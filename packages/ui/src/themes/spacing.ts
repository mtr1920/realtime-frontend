/**
 * Spacing scale definitions.
 * Based on a 4px base unit (0.25rem).
 */

/**
 * Core spacing scale - matches Tailwind's default spacing.
 * Use for margins, paddings, and gaps.
 */
export const spacing = {
  0: '0',
  px: '1px',
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
 * Component height tokens for consistent sizing.
 */
export const sizes = {
  // Icon sizes
  iconXs: '1rem', // 16px
  iconSm: '1.25rem', // 20px
  icon: '1.5rem', // 24px
  iconLg: '2rem', // 32px
  iconXl: '2.5rem', // 40px

  // Component sizes
  xs: '1.5rem', // 24px - small badges, chips
  sm: '2rem', // 32px - small buttons, inputs
  md: '2.5rem', // 40px - default input/button height
  lg: '3rem', // 48px - large buttons
  xl: '4rem', // 64px - large icons, avatars
  '2xl': '5rem', // 80px
  '3xl': '6rem', // 96px

  // Touch target sizes (WCAG 2.1 AAA)
  touchTarget: '2.75rem', // 44px minimum
  touchTargetLg: '3rem', // 48px comfortable
} as const;

/**
 * Content width constraints for readable text and layouts.
 */
export const contentWidths = {
  xs: '20rem', // 320px - mobile
  sm: '24rem', // 384px - narrow content
  md: '28rem', // 448px - cards
  lg: '32rem', // 512px - medium content
  xl: '36rem', // 576px - large cards
  '2xl': '42rem', // 672px - content area
  '3xl': '48rem', // 768px - tablet
  '4xl': '56rem', // 896px - wide content
  '5xl': '64rem', // 1024px - laptop
  '6xl': '72rem', // 1152px - desktop
  '7xl': '80rem', // 1280px - large desktop
  full: '100%',
  prose: '65ch', // Optimal line length for reading
  proseNarrow: '55ch',
  proseWide: '75ch',
} as const;

/**
 * Breakpoint values for responsive design.
 * Matches Tailwind defaults.
 */
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Aspect ratio tokens for media and containers.
 */
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  videoVertical: '9 / 16',
  photo: '4 / 3',
  photoVertical: '3 / 4',
  cinema: '21 / 9',
  ultrawide: '32 / 9',
  golden: '1.618 / 1',
} as const;

/**
 * Component spacing presets.
 * Semantic spacing tokens for common UI patterns.
 */
export const componentSpacing = {
  /** Icon + text gaps */
  iconGap: {
    /** 6px - STANDARDIZED for tight layouts */
    tight: '0.375rem',
    /** 8px - normal spacing */
    normal: '0.5rem',
  },
  /** Grid gaps */
  gridGap: {
    /** 12px - dense grids */
    compact: '0.75rem',
    /** 16px - STANDARD for cards */
    default: '1rem',
    /** 24px - sections */
    loose: '1.5rem',
  },
  /** Section spacing */
  sectionGap: {
    /** space-y-4 */
    tight: '1rem',
    /** space-y-6 - STANDARD for pages */
    default: '1.5rem',
    /** space-y-8 */
    loose: '2rem',
  },
  /** Card internal padding - STANDARD: p-6 (24px) */
  cardPadding: '1.5rem',
} as const;

/**
 * Animation delay scale for staggered animations.
 * Use for sequential reveal effects on lists and grids.
 */
export const staggerDelays = {
  1: '0ms',
  2: '50ms',
  3: '100ms',
  4: '150ms',
  5: '200ms',
  6: '250ms',
} as const;

// Type exports
export type SpacingToken = keyof typeof spacing;
export type SizeToken = keyof typeof sizes;
export type ContentWidthToken = keyof typeof contentWidths;
export type BreakpointToken = keyof typeof breakpoints;
export type AspectRatioToken = keyof typeof aspectRatios;
export type StaggerDelayToken = keyof typeof staggerDelays;

/**
 * Converts a spacing token to pixels.
 * @param token - Spacing token key
 * @returns Pixel value as number
 */
export function spacingToPx(token: SpacingToken): number {
  const value = spacing[token];
  if (value === '0') return 0;
  if (value === '1px') return 1;
  // Parse rem value
  const rem = parseFloat(value);
  return rem * 16; // Assuming 16px base font size
}

/**
 * Creates a spacing scale multiplier.
 * @param multiplier - Number to multiply base spacing by
 * @returns Rem value string
 */
export function spacingScale(multiplier: number): string {
  return `${multiplier * 0.25}rem`;
}

/**
 * Creates a clamp value for fluid spacing.
 * @param minToken - Minimum spacing token
 * @param maxToken - Maximum spacing token
 * @returns CSS clamp() value
 */
export function fluidSpacing(minToken: SpacingToken, maxToken: SpacingToken): string {
  const min = spacing[minToken];
  const max = spacing[maxToken];
  // Use viewport width to scale between min and max
  return `clamp(${min}, 2vw + 0.5rem, ${max})`;
}

/**
 * Gets a breakpoint media query.
 * @param breakpoint - Breakpoint token
 * @param direction - 'up' for min-width, 'down' for max-width
 * @returns Media query string
 */
export function getBreakpointQuery(
  breakpoint: BreakpointToken,
  direction: 'up' | 'down' = 'up'
): string {
  const value = breakpoints[breakpoint];
  if (direction === 'up') {
    return `(min-width: ${value})`;
  }
  // Subtract 1px for max-width to avoid overlap
  const px = parseInt(value) - 1;
  return `(max-width: ${px}px)`;
}
