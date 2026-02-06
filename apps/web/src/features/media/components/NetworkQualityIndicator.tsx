/**
 * NetworkQualityIndicator Component
 *
 * Visual indicator for network connection quality:
 * - Signal bars (1-4 based on quality)
 * - Tooltip with details
 * - Color coding
 */

import { forwardRef } from 'react';
import { WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { NetworkQualityLevel, PeerConnectionStats } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface NetworkQualityIndicatorProps {
  /** Quality level */
  quality: NetworkQualityLevel;
  /** Optional detailed stats for tooltip */
  stats?: PeerConnectionStats;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Show tooltip */
  showTooltip?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function getQualityConfig(quality: NetworkQualityLevel) {
  switch (quality) {
    case 'excellent':
      return {
        Icon: SignalHigh,
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        label: 'Excellent',
        bars: 4,
      };
    case 'good':
      return {
        Icon: SignalMedium,
        color: 'text-green-400',
        bgColor: 'bg-green-400',
        label: 'Good',
        bars: 3,
      };
    case 'fair':
      return {
        Icon: SignalLow,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        label: 'Fair',
        bars: 2,
      };
    case 'poor':
      return {
        Icon: Signal,
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        label: 'Poor',
        bars: 1,
      };
    case 'unknown':
    default:
      return {
        Icon: WifiOff,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground',
        label: 'Unknown',
        bars: 0,
      };
  }
}

function formatBandwidth(bps: number): string {
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  }
  if (bps >= 1000) {
    return `${(bps / 1000).toFixed(0)} Kbps`;
  }
  return `${bps.toFixed(0)} bps`;
}

// =============================================================================
// Signal Bars Component
// =============================================================================

function SignalBars({
  bars,
  color,
  size,
}: {
  bars: number;
  color: string;
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = {
    sm: { height: [4, 6, 8, 10], width: 2, gap: 0.5 },
    md: { height: [6, 9, 12, 15], width: 3, gap: 1 },
    lg: { height: [8, 12, 16, 20], width: 4, gap: 1.5 },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex items-end gap-${config.gap}`}>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={`item-${index}`}
          className={cn(
            'rounded-sm transition-colors',
            `w-[${config.width}px]`,
            index < bars ? color : 'bg-muted-foreground/30'
          )}
          style={{
            height: config.height[index],
            width: config.width,
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export const NetworkQualityIndicator = forwardRef<
  HTMLDivElement,
  NetworkQualityIndicatorProps
>(
  (
    {
      quality,
      stats,
      size = 'md',
      className,
      showTooltip = true,
    },
    ref
  ) => {
    const config = getQualityConfig(quality);

    const indicator = (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1',
          config.color,
          className
        )}
        title={!showTooltip ? config.label : undefined}
      >
        <SignalBars bars={config.bars} color={config.bgColor} size={size} />
      </div>
    );

    if (!showTooltip) {
      return indicator;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <config.Icon className="h-4 w-4" />
                Connection: {config.label}
              </div>

              {stats && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between gap-4">
                    <span>Latency:</span>
                    <span>{stats.roundTripTime.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Packet Loss:</span>
                    <span>{stats.packetLoss.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Jitter:</span>
                    <span>{stats.jitter.toFixed(1)} ms</span>
                  </div>
                  {stats.bandwidth.incoming > 0 && (
                    <div className="flex justify-between gap-4">
                      <span>Download:</span>
                      <span>{formatBandwidth(stats.bandwidth.incoming)}</span>
                    </div>
                  )}
                  {stats.bandwidth.outgoing > 0 && (
                    <div className="flex justify-between gap-4">
                      <span>Upload:</span>
                      <span>{formatBandwidth(stats.bandwidth.outgoing)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

NetworkQualityIndicator.displayName = 'NetworkQualityIndicator';

// =============================================================================
// Simple Icon Indicator
// =============================================================================

interface SimpleQualityIconProps {
  quality: NetworkQualityLevel;
  className?: string;
}

export function SimpleQualityIcon({ quality, className }: SimpleQualityIconProps) {
  const config = getQualityConfig(quality);

  return (
    <config.Icon
      className={cn('h-4 w-4', config.color, className)}
      aria-label={`Connection quality: ${config.label}`}
    />
  );
}
