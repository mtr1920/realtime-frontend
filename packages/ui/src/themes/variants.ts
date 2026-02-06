/**
 * Shared CVA variant definitions for consistent component styling.
 * These provide reusable patterns that components can compose.
 */
import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// FOCUS & ACCESSIBILITY
// =============================================================================

/**
 * Focus ring styles for keyboard navigation.
 * Uses focus-visible to only show on keyboard focus, not mouse clicks.
 */
export const focusRingVariants = cva(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
);

/**
 * Focus ring without offset - for components with their own offset handling.
 */
export const focusRingInsetVariants = cva(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
);

/**
 * Disabled state styles - consistent disabled appearance.
 */
export const disabledVariants = cva(
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed'
);

/**
 * Aria-disabled for components that need to remain focusable while disabled.
 */
export const ariaDisabledVariants = cva(
  'aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:cursor-not-allowed'
);

// =============================================================================
// INTERACTIVE STATES
// =============================================================================

/**
 * Base interactive styles with transitions and focus ring.
 */
export const interactiveVariants = cva([
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
]);

/**
 * Pressable element styles with scale effect.
 */
export const pressableVariants = cva([
  'transition-all',
  'active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50',
]);

/**
 * Hover lift effect for cards and interactive surfaces.
 */
export const hoverLiftVariants = cva([
  'transition-all duration-200',
  'hover:-translate-y-0.5 hover:shadow-md',
]);

// =============================================================================
// SIZE VARIANTS
// =============================================================================

/**
 * Size variants for buttons and form inputs.
 */
export const sizeVariants = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-3 text-xs',
  default: 'h-9 px-4 py-2 text-sm',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-11 px-6 text-base',
  xl: 'h-12 px-8 text-base',
  icon: 'h-9 w-9',
  iconXs: 'h-6 w-6',
  iconSm: 'h-8 w-8',
  iconLg: 'h-10 w-10',
  iconXl: 'h-12 w-12',
} as const;

/**
 * Input-specific sizes (slightly different padding for form controls).
 */
export const inputSizeVariants = {
  sm: 'h-8 px-3 text-sm',
  default: 'h-9 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
} as const;

// =============================================================================
// INTENT / VARIANT COLORS
// =============================================================================

/**
 * Intent variants for buttons with proper contrast and hover states.
 */
export const intentVariants = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  success: 'bg-success text-success-foreground shadow hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground shadow hover:bg-warning/90',
  info: 'bg-info text-info-foreground shadow hover:bg-info/90',
} as const;

/**
 * Soft/subtle intent variants - lighter backgrounds for less emphasis.
 */
export const intentSoftVariants = {
  default: 'bg-primary/10 text-primary hover:bg-primary/20',
  destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  success: 'bg-success/10 text-success hover:bg-success/20',
  warning: 'bg-warning/10 text-warning hover:bg-warning/20',
  info: 'bg-info/10 text-info hover:bg-info/20',
  muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
} as const;

/**
 * Outline intent variants - bordered style with color accents.
 */
export const intentOutlineVariants = {
  default: 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground',
  destructive: 'border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground',
  success: 'border border-success text-success hover:bg-success hover:text-success-foreground',
  warning: 'border border-warning text-warning hover:bg-warning hover:text-warning-foreground',
  info: 'border border-info text-info hover:bg-info hover:text-info-foreground',
} as const;

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

/**
 * Animation variants with motion-safe prefixes for reduced motion support.
 */
export const animationVariants = {
  // Fade animations
  fadeIn: 'motion-safe:animate-in motion-safe:fade-in-0',
  fadeOut: 'motion-safe:animate-out motion-safe:fade-out-0',

  // Slide animations
  slideInFromTop: 'motion-safe:animate-in motion-safe:slide-in-from-top-2',
  slideInFromBottom: 'motion-safe:animate-in motion-safe:slide-in-from-bottom-2',
  slideInFromLeft: 'motion-safe:animate-in motion-safe:slide-in-from-left-2',
  slideInFromRight: 'motion-safe:animate-in motion-safe:slide-in-from-right-2',
  slideOutToTop: 'motion-safe:animate-out motion-safe:slide-out-to-top-2',
  slideOutToBottom: 'motion-safe:animate-out motion-safe:slide-out-to-bottom-2',
  slideOutToLeft: 'motion-safe:animate-out motion-safe:slide-out-to-left-2',
  slideOutToRight: 'motion-safe:animate-out motion-safe:slide-out-to-right-2',

  // Zoom animations
  zoomIn: 'motion-safe:animate-in motion-safe:zoom-in-95',
  zoomOut: 'motion-safe:animate-out motion-safe:zoom-out-95',

  // Continuous animations
  spin: 'motion-safe:animate-spin',
  pulse: 'motion-safe:animate-pulse',
  bounce: 'motion-safe:animate-bounce',
  ping: 'motion-safe:animate-ping',
} as const;

/**
 * Combined enter/exit animation sets for common patterns.
 */
export const animationPresets = {
  // Modal/dialog animations
  modal: {
    enter: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
    exit: 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:zoom-out-95',
  },
  // Dropdown animations
  dropdown: {
    enter: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2',
    exit: 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:slide-out-to-top-2',
  },
  // Slide-over/drawer animations
  drawer: {
    enter: 'motion-safe:animate-in motion-safe:slide-in-from-right',
    exit: 'motion-safe:animate-out motion-safe:slide-out-to-right',
  },
  // Toast animations
  toast: {
    enter: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4',
    exit: 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:slide-out-to-right-full',
  },
} as const;

// =============================================================================
// OVERLAY & BACKDROP
// =============================================================================

/**
 * Overlay/backdrop variants for modals, drawers, etc.
 */
export const overlayVariants = cva([
  'fixed inset-0 z-50 bg-black/80',
  'data-[state=open]:motion-safe:animate-in data-[state=open]:motion-safe:fade-in-0',
  'data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0',
]);

/**
 * Lighter overlay for less intrusive backdrops.
 */
export const overlayLightVariants = cva([
  'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
  'data-[state=open]:motion-safe:animate-in data-[state=open]:motion-safe:fade-in-0',
  'data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0',
]);

// =============================================================================
// SURFACE VARIANTS
// =============================================================================

/**
 * Card/surface variants with elevation levels.
 */
export const surfaceVariants = cva('rounded-lg border bg-card text-card-foreground', {
  variants: {
    elevation: {
      none: '',
      xs: 'shadow-xs',
      sm: 'shadow-sm',
      default: 'shadow',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    },
    interactive: {
      true: 'transition-shadow hover:shadow-md cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    elevation: 'default',
    interactive: false,
  },
});

/**
 * Glass morphism variants for modern UI effects.
 */
export const glassVariants = cva('', {
  variants: {
    intensity: {
      subtle: 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm',
      default: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
      strong: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
    },
    border: {
      true: 'border border-white/20 dark:border-slate-700/30',
      false: '',
    },
  },
  defaultVariants: {
    intensity: 'default',
    border: true,
  },
});

// =============================================================================
// STATUS VARIANTS
// =============================================================================

/**
 * Badge/status variants with semantic colors.
 */
export const statusVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Dot indicator variants for status displays.
 */
export const statusDotVariants = cva('rounded-full', {
  variants: {
    status: {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-destructive',
      info: 'bg-info',
      neutral: 'bg-muted-foreground',
      active: 'bg-success animate-pulse',
    },
    size: {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      default: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    },
  },
  defaultVariants: {
    status: 'neutral',
    size: 'default',
  },
});

// =============================================================================
// LAYOUT VARIANTS
// =============================================================================

/**
 * Flex container variants for common layouts.
 */
export const flexVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      col: 'flex-col',
      rowReverse: 'flex-row-reverse',
      colReverse: 'flex-col-reverse',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      default: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
  },
  defaultVariants: {
    direction: 'row',
    align: 'stretch',
    justify: 'start',
    gap: 'default',
    wrap: false,
  },
});

/**
 * Container variants for page/section layouts.
 */
export const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
      prose: 'max-w-prose',
    },
    padding: {
      none: '',
      sm: 'px-4',
      default: 'px-4 sm:px-6 lg:px-8',
      lg: 'px-6 sm:px-8 lg:px-12',
    },
  },
  defaultVariants: {
    size: 'xl',
    padding: 'default',
  },
});

// =============================================================================
// TEXT VARIANTS
// =============================================================================

/**
 * Text color variants for semantic meaning.
 */
export const textColorVariants = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
} as const;

/**
 * Text truncation variants.
 */
export const truncateVariants = cva('', {
  variants: {
    lines: {
      1: 'truncate',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
      4: 'line-clamp-4',
      5: 'line-clamp-5',
    },
  },
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SizeVariant = keyof typeof sizeVariants;
export type InputSizeVariant = keyof typeof inputSizeVariants;
export type IntentVariant = keyof typeof intentVariants;
export type IntentSoftVariant = keyof typeof intentSoftVariants;
export type IntentOutlineVariant = keyof typeof intentOutlineVariants;
export type AnimationVariant = keyof typeof animationVariants;
export type TextColorVariant = keyof typeof textColorVariants;

export type SurfaceVariantProps = VariantProps<typeof surfaceVariants>;
export type GlassVariantProps = VariantProps<typeof glassVariants>;
export type StatusVariantProps = VariantProps<typeof statusVariants>;
export type StatusDotVariantProps = VariantProps<typeof statusDotVariants>;
export type FlexVariantProps = VariantProps<typeof flexVariants>;
export type ContainerVariantProps = VariantProps<typeof containerVariants>;
export type TruncateVariantProps = VariantProps<typeof truncateVariants>;
