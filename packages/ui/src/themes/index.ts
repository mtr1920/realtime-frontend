/**
 * Design system themes and tokens.
 * Pure design tokens with no business logic.
 *
 * @example
 * ```ts
 * // Import everything
 * import { colorTokens, spacing, textStyles } from '@realtime/ui/themes';
 *
 * // Import specific categories
 * import { durationTokens, easingTokens } from '@realtime/ui/themes/tokens';
 * import { generateThemeCss } from '@realtime/ui/themes/colors';
 * ```
 */

// =============================================================================
// TOKEN EXPORTS
// =============================================================================

export {
  // Color tokens (CSS variable references)
  colorTokens,
  // Radius tokens
  radiusTokens,
  // Shadow tokens
  shadowTokens,
  // Elevation tokens (semantic shadow levels)
  elevationTokens,
  // Status glow tokens
  statusGlowTokens,
  // Z-index tokens
  zIndexTokens,
  // Transition duration tokens
  durationTokens,
  // Easing function tokens
  easingTokens,
  // Transition preset tokens
  transitionTokens,
  // Blur tokens for glassmorphism
  blurTokens,
  // Opacity tokens
  opacityTokens,
  // Types
  type ColorToken,
  type RadiusToken,
  type ShadowToken,
  type ElevationToken,
  type StatusGlowToken,
  type ZIndexToken,
  type DurationToken,
  type EasingToken,
  type TransitionToken,
  type BlurToken,
  type OpacityToken,
} from './tokens';

// =============================================================================
// COLOR PALETTE EXPORTS
// =============================================================================

export {
  // Raw color palettes
  slate,
  blue,
  green,
  red,
  amber,
  sky,
  purple,
  // Semantic color themes
  semanticColors,
  // Utility functions
  generateThemeCss,
  generateThemeCssBlock,
  getThemeColor,
  toHslFunction,
  toHsla,
  // Types
  type SemanticColorTheme,
  type SemanticColorKey,
  type SlateShade,
  type BlueShade,
  type GreenShade,
  type RedShade,
  type AmberShade,
  type SkyShade,
  type PurpleShade,
} from './colors';

// =============================================================================
// SPACING EXPORTS
// =============================================================================

export {
  // Spacing scale
  spacing,
  // Component sizes
  sizes,
  // Content widths
  contentWidths,
  // Breakpoints
  breakpoints,
  // Aspect ratios
  aspectRatios,
  // Component spacing presets
  componentSpacing,
  // Animation stagger delays
  staggerDelays,
  // Utility functions
  spacingToPx,
  spacingScale,
  fluidSpacing,
  getBreakpointQuery,
  // Types
  type SpacingToken,
  type SizeToken,
  type ContentWidthToken,
  type BreakpointToken,
  type AspectRatioToken,
  type StaggerDelayToken,
} from './spacing';

// =============================================================================
// TYPOGRAPHY EXPORTS
// =============================================================================

export {
  // Font families (as CSS-ready strings)
  fontFamily,
  // Font family arrays (for Tailwind config)
  fontFamilyArrays_,
  // Font sizes
  fontSize,
  // Font weights
  fontWeight,
  // Letter spacing
  letterSpacing,
  // Line heights
  lineHeight,
  // Text style presets
  textStyles,
  // Utility functions
  getTextStyle,
  getFontFamily,
  getFontSize,
  fluidFontSize,
  // Types
  type FontFamilyToken,
  type FontSizeToken,
  type FontWeightToken,
  type LetterSpacingToken,
  type LineHeightToken,
  type TextStyleToken,
} from './typography';

// =============================================================================
// VARIANT EXPORTS
// =============================================================================

export {
  // Focus & accessibility
  focusRingVariants,
  focusRingInsetVariants,
  disabledVariants,
  ariaDisabledVariants,

  // Interactive states
  interactiveVariants,
  pressableVariants,
  hoverLiftVariants,

  // Size variants
  sizeVariants,
  inputSizeVariants,

  // Intent/color variants
  intentVariants,
  intentSoftVariants,
  intentOutlineVariants,

  // Animation variants
  animationVariants,
  animationPresets,

  // Overlay variants
  overlayVariants,
  overlayLightVariants,

  // Surface variants
  surfaceVariants,
  glassVariants,

  // Status variants
  statusVariants,
  statusDotVariants,

  // Layout variants
  flexVariants,
  containerVariants,

  // Text variants
  textColorVariants,
  truncateVariants,

  // Types
  type SizeVariant,
  type InputSizeVariant,
  type IntentVariant,
  type IntentSoftVariant,
  type IntentOutlineVariant,
  type AnimationVariant,
  type TextColorVariant,
  type SurfaceVariantProps,
  type GlassVariantProps,
  type StatusVariantProps,
  type StatusDotVariantProps,
  type FlexVariantProps,
  type ContainerVariantProps,
  type TruncateVariantProps,
} from './variants';
