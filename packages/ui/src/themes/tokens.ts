/**
 * CSS Variable token names for the design system.
 * These map to the CSS variables defined in the consuming application's CSS.
 */

// Base color tokens - maps to CSS variables
export const colorTokens = {
  // Background colors
  background: 'var(--background)',
  foreground: 'var(--foreground)',

  // Card colors
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',

  // Popover colors
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',

  // Primary colors
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',

  // Secondary colors
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',

  // Muted colors
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',

  // Accent colors
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',

  // Destructive colors
  destructive: 'var(--destructive)',
  destructiveForeground: 'var(--destructive-foreground)',

  // Success colors
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',

  // Warning colors
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',

  // Info colors
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',

  // Border & input colors
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const;

// Radius tokens - consistent naming with clear progression
export const radiusTokens = {
  none: '0px',
  xs: 'calc(var(--radius) - 4px)',
  sm: 'calc(var(--radius) - 2px)',
  md: 'var(--radius)',
  lg: 'calc(var(--radius) + 2px)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  '3xl': 'calc(var(--radius) + 12px)',
  full: '9999px',
} as const;

// Shadow tokens
export const shadowTokens = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  lg: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  xl: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '2xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '3xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Colored shadows for emphasis
  glow: '0 0 15px -3px var(--primary)',
  glowSm: '0 0 10px -3px var(--primary)',
  glowLg: '0 0 25px -5px var(--primary)',
} as const;

/**
 * Semantic elevation levels.
 * Maps shadow tokens to use-case-specific names for consistent elevation hierarchy.
 */
export const elevationTokens = {
  /** Subtle - inputs, resting cards */
  subtle: shadowTokens.xs,
  /** Raised - hovered cards, buttons */
  raised: shadowTokens.sm,
  /** Floating - dropdowns, popovers */
  floating: shadowTokens.md,
  /** Overlay - dialogs, modals */
  overlay: shadowTokens.lg,
  /** Toast - notifications */
  toast: shadowTokens.xl,
} as const;

/**
 * Status glow shadows for status-based visual feedback.
 * Use with box-shadow for colored glow effects on status indicators.
 */
export const statusGlowTokens = {
  success: '0 0 12px -3px rgb(34 197 94 / 0.4)',
  warning: '0 0 12px -3px rgb(245 158 11 / 0.4)',
  info: '0 0 12px -3px rgb(59 130 246 / 0.4)',
  error: '0 0 12px -3px rgb(239 68 68 / 0.4)',
  primary: '0 0 12px -3px hsl(var(--primary) / 0.4)',
} as const;

// Z-index tokens - follows a clear hierarchy
export const zIndexTokens = {
  auto: 'auto',
  behind: '-1',
  base: '0',
  raised: '10',
  dropdown: '50',
  sticky: '100',
  banner: '150',
  overlay: '200',
  modal: '300',
  popover: '400',
  tooltip: '500',
  toast: '600',
  maximum: '9999',
} as const;

// Transition duration tokens
export const durationTokens = {
  instant: '0ms',
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
  // Named durations for specific use cases
  hover: '150ms',
  focus: '200ms',
  enter: '200ms',
  exit: '150ms',
  expand: '300ms',
  collapse: '200ms',
  page: '400ms',
} as const;

// Easing tokens - based on Material Design and Apple HIG
export const easingTokens = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Custom cubic-bezier for specific effects
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material standard
  emphasized: 'cubic-bezier(0.4, 0, 0, 1)', // Material emphasized
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Enter animations
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)', // Exit animations
  // Spring-like easings
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  // Apple-style easings
  appleEase: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  appleSpring: 'cubic-bezier(0.5, 1.25, 0.75, 1.25)',
} as const;

// Transition presets combining duration and easing
export const transitionTokens = {
  none: 'none',
  all: `all ${durationTokens.normal} ${easingTokens.standard}`,
  allFast: `all ${durationTokens.fast} ${easingTokens.standard}`,
  allSlow: `all ${durationTokens.slow} ${easingTokens.standard}`,
  colors: `color ${durationTokens.fast} ${easingTokens.standard}, background-color ${durationTokens.fast} ${easingTokens.standard}, border-color ${durationTokens.fast} ${easingTokens.standard}`,
  opacity: `opacity ${durationTokens.normal} ${easingTokens.standard}`,
  shadow: `box-shadow ${durationTokens.normal} ${easingTokens.standard}`,
  transform: `transform ${durationTokens.normal} ${easingTokens.standard}`,
  // Common component transitions
  button: `background-color ${durationTokens.fast} ${easingTokens.standard}, border-color ${durationTokens.fast} ${easingTokens.standard}, color ${durationTokens.fast} ${easingTokens.standard}, box-shadow ${durationTokens.fast} ${easingTokens.standard}`,
  input: `border-color ${durationTokens.fast} ${easingTokens.standard}, box-shadow ${durationTokens.fast} ${easingTokens.standard}`,
  modal: `opacity ${durationTokens.normal} ${easingTokens.decelerate}, transform ${durationTokens.normal} ${easingTokens.decelerate}`,
  modalExit: `opacity ${durationTokens.fast} ${easingTokens.accelerate}, transform ${durationTokens.fast} ${easingTokens.accelerate}`,
  dropdown: `opacity ${durationTokens.fast} ${easingTokens.decelerate}, transform ${durationTokens.fast} ${easingTokens.decelerate}`,
  tooltip: `opacity ${durationTokens.faster} ${easingTokens.standard}`,
  drawer: `transform ${durationTokens.slow} ${easingTokens.emphasized}`,
} as const;

// Blur tokens for glassmorphism effects
export const blurTokens = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '40px',
} as const;

// Opacity tokens
export const opacityTokens = {
  0: '0',
  5: '0.05',
  10: '0.1',
  15: '0.15',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  85: '0.85',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const;

// Type exports
export type ColorToken = keyof typeof colorTokens;
export type RadiusToken = keyof typeof radiusTokens;
export type ShadowToken = keyof typeof shadowTokens;
export type ZIndexToken = keyof typeof zIndexTokens;
export type DurationToken = keyof typeof durationTokens;
export type EasingToken = keyof typeof easingTokens;
export type TransitionToken = keyof typeof transitionTokens;
export type BlurToken = keyof typeof blurTokens;
export type OpacityToken = keyof typeof opacityTokens;
export type ElevationToken = keyof typeof elevationTokens;
export type StatusGlowToken = keyof typeof statusGlowTokens;
