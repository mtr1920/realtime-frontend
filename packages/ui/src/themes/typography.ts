/**
 * Typography tokens and configurations.
 */

// Font family definitions as arrays
const fontFamilyArrays = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'Noto Sans',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji',
  ],
  serif: [
    'ui-serif',
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif',
  ],
  mono: [
    'JetBrains Mono',
    'ui-monospace',
    'SFMono-Regular',
    'SF Mono',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
  display: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ],
} as const;

/**
 * Font family tokens as CSS-ready strings.
 * Use these directly in style attributes or CSS-in-JS.
 */
export const fontFamily = {
  sans: fontFamilyArrays.sans.join(', '),
  serif: fontFamilyArrays.serif.join(', '),
  mono: fontFamilyArrays.mono.join(', '),
  display: fontFamilyArrays.display.join(', '),
} as const;

/**
 * Font family arrays for Tailwind config or other tools that need arrays.
 */
export const fontFamilyArrays_ = fontFamilyArrays;

// Font size tokens with line height (rem based)
export const fontSize = {
  '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
  xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
  base: ['1rem', { lineHeight: '1.5rem' }], // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  '5xl': ['3rem', { lineHeight: '1.1' }], // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
  '8xl': ['6rem', { lineHeight: '1' }], // 96px
  '9xl': ['8rem', { lineHeight: '1' }], // 128px
} as const;

// Font weight tokens
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Letter spacing tokens
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Line height tokens
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  // Numeric values for precise control
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
} as const;

/**
 * Text style presets - complete typography combinations.
 * These provide consistent heading and body styles.
 */
export const textStyles = {
  // Display headings (hero sections, landing pages)
  display1: {
    fontSize: fontSize['7xl'][0],
    lineHeight: fontSize['7xl'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
    fontFamily: fontFamily.display,
  },
  display2: {
    fontSize: fontSize['6xl'][0],
    lineHeight: fontSize['6xl'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
    fontFamily: fontFamily.display,
  },

  // Standard headings (h1-h6)
  h1: {
    fontSize: fontSize['4xl'][0],
    lineHeight: fontSize['4xl'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.sans,
  },
  h2: {
    fontSize: fontSize['3xl'][0],
    lineHeight: fontSize['3xl'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.sans,
  },
  h3: {
    fontSize: fontSize['2xl'][0],
    lineHeight: fontSize['2xl'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  h4: {
    fontSize: fontSize['xl'][0],
    lineHeight: fontSize['xl'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  h5: {
    fontSize: fontSize['lg'][0],
    lineHeight: fontSize['lg'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  h6: {
    fontSize: fontSize['base'][0],
    lineHeight: fontSize['base'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },

  // Body text
  bodyLg: {
    fontSize: fontSize['lg'][0],
    lineHeight: fontSize['lg'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  body: {
    fontSize: fontSize['base'][0],
    lineHeight: fontSize['base'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  bodySm: {
    fontSize: fontSize['sm'][0],
    lineHeight: fontSize['sm'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  bodyXs: {
    fontSize: fontSize['xs'][0],
    lineHeight: fontSize['xs'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },

  // UI text
  label: {
    fontSize: fontSize['sm'][0],
    lineHeight: fontSize['sm'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  labelSm: {
    fontSize: fontSize['xs'][0],
    lineHeight: fontSize['xs'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.sans,
  },
  caption: {
    fontSize: fontSize['xs'][0],
    lineHeight: fontSize['xs'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  overline: {
    fontSize: fontSize['xs'][0],
    lineHeight: fontSize['xs'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
    fontFamily: fontFamily.sans,
  },

  // Code/monospace
  code: {
    fontSize: fontSize['sm'][0],
    lineHeight: fontSize['sm'][1].lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.mono,
  },
  codeBlock: {
    fontSize: fontSize['sm'][0],
    lineHeight: lineHeight.relaxed,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.mono,
  },

  // Button text
  buttonSm: {
    fontSize: fontSize['xs'][0],
    lineHeight: '1',
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.sans,
  },
  button: {
    fontSize: fontSize['sm'][0],
    lineHeight: '1',
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
  buttonLg: {
    fontSize: fontSize['base'][0],
    lineHeight: '1',
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.sans,
  },
} as const;

// Type exports
export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type LetterSpacingToken = keyof typeof letterSpacing;
export type LineHeightToken = keyof typeof lineHeight;
export type TextStyleToken = keyof typeof textStyles;

/**
 * Gets a text style as a CSS object.
 * Useful for inline styles or CSS-in-JS.
 *
 * @example
 * ```tsx
 * <h1 style={getTextStyle('h1')}>Heading</h1>
 * ```
 */
export function getTextStyle(style: TextStyleToken): Record<string, string> {
  const { textTransform, ...rest } = textStyles[style] as Record<string, string>;
  const result: Record<string, string> = { ...rest };
  if (textTransform) {
    result.textTransform = textTransform;
  }
  return result;
}

/**
 * Creates a font-family CSS value from a token.
 * @param token - Font family token
 * @returns CSS font-family string
 */
export function getFontFamily(token: FontFamilyToken): string {
  return fontFamily[token];
}

/**
 * Gets font size and line height as a tuple.
 * @param token - Font size token
 * @returns [fontSize, lineHeight] tuple
 */
export function getFontSize(token: FontSizeToken): [string, string] {
  const [size, { lineHeight: lh }] = fontSize[token];
  return [size, lh];
}

/**
 * Calculates fluid typography size using clamp().
 * Creates responsive font sizes that scale smoothly between breakpoints.
 *
 * @param minSize - Minimum font size in rem
 * @param maxSize - Maximum font size in rem
 * @param minViewport - Minimum viewport width in px (default: 320)
 * @param maxViewport - Maximum viewport width in px (default: 1280)
 * @returns CSS clamp() value
 *
 * @example
 * ```ts
 * fluidFontSize(1, 2); // "clamp(1rem, 0.5rem + 2.5vw, 2rem)"
 * ```
 */
export function fluidFontSize(
  minSize: number,
  maxSize: number,
  minViewport = 320,
  maxViewport = 1280
): string {
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const intersection = minSize - slope * minViewport;
  const slopeVw = (slope * 100).toFixed(4);
  const intersectionRem = intersection.toFixed(4);

  return `clamp(${minSize}rem, ${intersectionRem}rem + ${slopeVw}vw, ${maxSize}rem)`;
}
