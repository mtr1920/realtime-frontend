/**
 * QualityIndicator Component
 *
 * 4-bar signal strength indicator for video tile network quality.
 * Provides visual feedback on connection quality with animated bars.
 */

import { forwardRef, memo } from 'react';
import { cn } from '@/shared/lib/utils';
import type { NetworkQualityLevel } from '../../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface QualityIndicatorProps {
  /** Network quality level */
  quality: NetworkQualityLevel;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getQualityConfig(quality: NetworkQualityLevel) {
  switch (quality) {
    case 'excellent':
      return { bars: 4, color: 'bg-green-500', label: 'Excellent connection' };
    case 'good':
      return { bars: 3, color: 'bg-green-400', label: 'Good connection' };
    case 'fair':
      return { bars: 2, color: 'bg-yellow-500', label: 'Fair connection' };
    case 'poor':
      return { bars: 1, color: 'bg-red-500', label: 'Poor connection' };
    case 'unknown':
    default:
      return { bars: 0, color: 'bg-muted-foreground/40', label: 'Unknown connection' };
  }
}

// =============================================================================
// Component
// =============================================================================

export const QualityIndicator = memo(
  forwardRef<HTMLDivElement, QualityIndicatorProps>(
    ({ quality, size = 'sm', className }, ref) => {
      const { bars, color, label } = getQualityConfig(quality);

      // Size configurations
      const sizeConfig = {
        sm: { gap: 'gap-[2px]', widths: 'w-[3px]', heights: [6, 9, 12, 15] },
        md: { gap: 'gap-[3px]', widths: 'w-[4px]', heights: [8, 12, 16, 20] },
      };

      const config = sizeConfig[size];

      if (quality === 'unknown') {
        return null;
      }

      return (
        <div
          ref={ref}
          className={cn('flex items-end', config.gap, className)}
          role="img"
          aria-label={label}
          title={label}
        >
          {[0, 1, 2, 3].map((index) => {
            const isActive = index < bars;
            const height = config.heights[index];

            return (
              <div
                key={index}
                className={cn(
                  'quality-bar rounded-[1px]',
                  config.widths,
                  isActive ? color : 'bg-white/30'
                )}
                style={{ height }}
              />
            );
          })}
        </div>
      );
    }
  )
);

QualityIndicator.displayName = 'QualityIndicator';
