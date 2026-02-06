/**
 * AIStatusIndicator Component
 *
 * Visual indicator for AI session state:
 * - Idle, Listening, Processing, Speaking animations
 * - Color-coded states
 * - Accessible labels
 */

import { forwardRef, memo } from 'react';
import { cn } from '@/shared/lib/utils';
import type { AISessionState } from '../types/session.types';

// =============================================================================
// Types
// =============================================================================

interface AIStatusIndicatorProps {
  /** Current AI session state */
  state: AISessionState;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// State Configuration
// =============================================================================

interface StateConfig {
  label: string;
  color: string;
  bgColor: string;
  animation: string;
  pulseColor: string;
}

function getStateConfig(state: AISessionState): StateConfig {
  switch (state) {
    case 'idle':
      return {
        label: 'Ready',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground',
        animation: '',
        pulseColor: 'bg-muted-foreground/50',
      };
    case 'starting':
      return {
        label: 'Connecting...',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        animation: 'motion-safe:animate-pulse',
        pulseColor: 'bg-yellow-500/30',
      };
    case 'ready':
      return {
        label: 'Ready',
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        animation: '',
        pulseColor: 'bg-green-500/30',
      };
    case 'listening':
      return {
        label: 'Listening...',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
        animation: 'motion-safe:animate-pulse',
        pulseColor: 'bg-blue-500/30',
      };
    case 'processing':
      return {
        label: 'Processing...',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500',
        animation: 'motion-safe:animate-pulse',
        pulseColor: 'bg-purple-500/30',
      };
    case 'speaking':
      return {
        label: 'Speaking...',
        color: 'text-primary',
        bgColor: 'bg-primary',
        animation: '',
        pulseColor: 'bg-primary/30',
      };
    case 'error':
      return {
        label: 'Error',
        color: 'text-destructive',
        bgColor: 'bg-destructive',
        animation: '',
        pulseColor: 'bg-destructive/30',
      };
    case 'ending':
      return {
        label: 'Ending...',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground',
        animation: 'motion-safe:animate-pulse',
        pulseColor: 'bg-muted-foreground/30',
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground',
        animation: '',
        pulseColor: 'bg-muted-foreground/30',
      };
  }
}

// =============================================================================
// Size Configuration
// =============================================================================

function getSizeConfig(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm':
      return {
        dotSize: 'h-2 w-2',
        pulseSize: 'h-4 w-4',
        fontSize: 'text-xs',
        gap: 'gap-1.5',
      };
    case 'md':
      return {
        dotSize: 'h-3 w-3',
        pulseSize: 'h-6 w-6',
        fontSize: 'text-sm',
        gap: 'gap-2',
      };
    case 'lg':
      return {
        dotSize: 'h-4 w-4',
        pulseSize: 'h-8 w-8',
        fontSize: 'text-base',
        gap: 'gap-2.5',
      };
  }
}

// =============================================================================
// Speaking Animation Bars
// =============================================================================

const SpeakingBars = memo(function SpeakingBars({
  size,
}: {
  size: 'sm' | 'md' | 'lg';
}) {
  const barCount = 4;
  const heights = ['h-2', 'h-3', 'h-4', 'h-3'];
  const delays = ['delay-0', 'delay-75', 'delay-150', 'delay-75'];

  const sizeMap = {
    sm: { barWidth: 'w-0.5', gap: 'gap-0.5', container: 'h-4' },
    md: { barWidth: 'w-1', gap: 'gap-0.5', container: 'h-5' },
    lg: { barWidth: 'w-1.5', gap: 'gap-1', container: 'h-6' },
  };

  const config = sizeMap[size];

  return (
    <div
      className={cn(
        'flex items-end',
        config.gap,
        config.container
      )}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className={cn(
            'bg-primary rounded-full animate-speaking-bar',
            config.barWidth,
            heights[i],
            delays[i]
          )}
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
});

// =============================================================================
// Component
// =============================================================================

export const AIStatusIndicator = forwardRef<HTMLDivElement, AIStatusIndicatorProps>(
  ({ state, size = 'md', showLabel = true, className }, ref) => {
    const stateConfig = getStateConfig(state);
    const sizeConfig = getSizeConfig(size);

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          sizeConfig.gap,
          className
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`AI status: ${stateConfig.label}`}
      >
        {/* Status indicator */}
        <div className="relative flex items-center justify-center">
          {/* Pulse ring for active states */}
          {(state === 'listening' || state === 'starting' || state === 'processing') && (
            <div
              className={cn(
                'absolute rounded-full motion-safe:motion-safe:animate-ping opacity-75',
                sizeConfig.pulseSize,
                stateConfig.pulseColor
              )}
            />
          )}

          {/* Speaking animation or dot */}
          {state === 'speaking' ? (
            <SpeakingBars size={size} />
          ) : (
            <div
              className={cn(
                'rounded-full',
                sizeConfig.dotSize,
                stateConfig.bgColor,
                stateConfig.animation
              )}
            />
          )}
        </div>

        {/* Label */}
        {showLabel && (
          <span
            className={cn(
              'font-medium',
              sizeConfig.fontSize,
              stateConfig.color
            )}
          >
            {stateConfig.label}
          </span>
        )}
      </div>
    );
  }
);

AIStatusIndicator.displayName = 'AIStatusIndicator';

// =============================================================================
// Inline Status (for tight spaces)
// =============================================================================

interface InlineStatusProps {
  state: AISessionState;
  className?: string;
}

export function InlineAIStatus({ state, className }: InlineStatusProps) {
  const config = getStateConfig(state);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        config.color,
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          config.bgColor,
          config.animation
        )}
      />
      {config.label}
    </span>
  );
}
