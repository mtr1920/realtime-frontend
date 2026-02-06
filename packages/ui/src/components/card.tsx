/**
 * Card Component
 *
 * Enhanced card with crystalline variant using CVA for type-safe styling.
 * Includes decorative sub-components for the crystalline design system.
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

// =============================================================================
// Types
// =============================================================================

/**
 * Status gradient configuration for crystalline cards.
 * Controls the visual styling of status indicators.
 */
export interface StatusGradient {
  /** Tailwind gradient classes (e.g., "from-emerald-400 to-teal-500") */
  gradient: string;
  /** Shadow class for hover glow effect (e.g., "shadow-emerald-500/20") */
  glow?: string;
  /** Ring class for active states (e.g., "ring-emerald-400/30") */
  ring?: string;
}

// =============================================================================
// Card Variants
// =============================================================================

const cardVariants = cva('rounded-xl border text-card-foreground', {
  variants: {
    variant: {
      default: 'border-border bg-card card-shadow',
      crystalline: [
        'group relative overflow-hidden',
        'border-border/60',
        'bg-gradient-to-br from-card via-card to-card/95',
        'dark:from-card dark:via-card/95 dark:to-card/90',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-border hover:shadow-lg',
      ].join(' '),
    },
    tall: {
      true: 'min-h-[180px] xl:min-h-[200px]',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    tall: false,
  },
});

// =============================================================================
// Animation Utilities
// =============================================================================

/** Standard stagger delays for entrance animations */
const STAGGER_DELAYS = [0, 50, 100, 150, 200, 250] as const;

/**
 * Calculate stagger delay for a given index.
 * Cycles through delays for grids larger than 6 items.
 */
function getStaggerDelay(index: number): number {
  return STAGGER_DELAYS[index % STAGGER_DELAYS.length] ?? 0;
}

// =============================================================================
// Card Component
// =============================================================================

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Status gradient configuration for crystalline variant */
  status?: StatusGradient;
  /** Animation stagger index for entrance animation */
  staggerIndex?: number;
  /** External hover state control (for coordinating effects) */
  isHovered?: boolean;
  /** Show ring indicator (for active states) */
  showRing?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      tall,
      status,
      staggerIndex,
      isHovered,
      showRing,
      style,
      ...props
    },
    ref
  ) => {
    const staggerDelay = useMemo(
      () => (staggerIndex !== undefined ? getStaggerDelay(staggerIndex) : 0),
      [staggerIndex]
    );

    const animationStyle =
      staggerIndex !== undefined
        ? {
            animationDelay: `${staggerDelay}ms`,
            animationFillMode: 'backwards' as const,
            ...style,
          }
        : style;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, tall }),
          // Status-based glow on hover (crystalline only)
          variant === 'crystalline' && isHovered && status?.glow,
          // Ring indicator for active states (crystalline only)
          variant === 'crystalline' && showRing && status?.ring && `ring-1 ${status.ring}`,
          className
        )}
        style={animationStyle}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// =============================================================================
// Card Sub-Components (Existing)
// =============================================================================

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// =============================================================================
// Crystalline Decorative Sub-Components
// =============================================================================

export interface CardStripeProps extends HTMLAttributes<HTMLDivElement> {
  /** Gradient classes (e.g., "from-emerald-400 to-teal-500") */
  gradient?: string;
  /** Whether card is hovered (expands stripe width) */
  isHovered?: boolean;
}

/**
 * CardStripe - Left status indicator stripe for crystalline cards.
 * Expands slightly on hover.
 */
const CardStripe = forwardRef<HTMLDivElement, CardStripeProps>(
  ({ className, gradient, isHovered, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute top-0 left-0 h-full rounded-l-xl',
        'bg-gradient-to-b',
        'transition-all duration-300',
        isHovered ? 'w-1.5' : 'w-1',
        gradient,
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
);
CardStripe.displayName = 'CardStripe';

export interface CardAccentProps extends HTMLAttributes<HTMLDivElement> {
  /** Gradient classes (e.g., "from-emerald-400 to-teal-500") */
  gradient?: string;
  /** Whether card is hovered (increases opacity) */
  isHovered?: boolean;
}

/**
 * CardAccent - Diagonal geometric accent (top-left) for crystalline cards.
 * Increases opacity on hover.
 */
const CardAccent = forwardRef<HTMLDivElement, CardAccentProps>(
  ({ className, gradient, isHovered, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute -top-px -left-px w-24 h-24',
        'bg-gradient-to-br',
        'transition-opacity duration-300',
        isHovered
          ? 'opacity-[0.12] dark:opacity-[0.18]'
          : 'opacity-[0.08] dark:opacity-[0.12]',
        gradient,
        className
      )}
      style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      aria-hidden="true"
      {...props}
    />
  )
);
CardAccent.displayName = 'CardAccent';

/**
 * CardCorner - Bottom-right corner accent for crystalline cards.
 * Subtle decorative element.
 */
const CardCorner = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute bottom-0 right-0 w-12 h-12',
        'bg-gradient-to-tl from-muted/30 to-transparent',
        'pointer-events-none',
        className
      )}
      style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      aria-hidden="true"
      {...props}
    />
  )
);
CardCorner.displayName = 'CardCorner';

// =============================================================================
// Exports
// =============================================================================

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardStripe,
  CardAccent,
  CardCorner,
  cardVariants,
  getStaggerDelay,
  STAGGER_DELAYS,
};
