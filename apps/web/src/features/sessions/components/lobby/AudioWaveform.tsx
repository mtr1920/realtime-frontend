/**
 * AudioWaveform Component
 *
 * Animated vertical bars showing audio input level.
 * Creates a visual waveform effect for microphone input.
 */

import { memo } from 'react';
import { cn } from '@/shared/lib/utils';

interface AudioWaveformProps {
  /** Audio level (0-1) */
  level: number;
  /** Number of bars to display */
  bars?: number;
  /** Height of the container in pixels */
  height?: number;
  /** Additional class name */
  className?: string;
}

export const AudioWaveform = memo(function AudioWaveform({
  level,
  bars = 5,
  height = 32,
  className,
}: AudioWaveformProps) {
  // Generate bar heights based on level
  // Center bars are taller, edges are shorter
  const getBarHeight = (index: number): number => {
    const center = (bars - 1) / 2;
    const distance = Math.abs(index - center);
    const maxDistance = center;

    // Base height varies by position (center is taller)
    const positionMultiplier = 1 - (distance / maxDistance) * 0.5;

    // Level affects overall height
    const levelMultiplier = 0.2 + level * 0.8;

    // Add some variance between bars
    const variance = 0.8 + Math.sin(index * 1.5 + Date.now() / 200) * 0.2;

    return Math.max(0.2, Math.min(1, positionMultiplier * levelMultiplier * variance));
  };

  return (
    <div
      className={cn(
        'flex items-end justify-center gap-1',
        className
      )}
      style={{ height }}
      role="img"
      aria-label={`Audio level: ${Math.round(level * 100)}%`}
    >
      {Array.from({ length: bars }, (_, i) => {
        const barHeight = getBarHeight(i);
        const animationDelay = `${i * 0.1}s`;

        return (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full bg-green-400 transition-[height] duration-75',
              level > 0.1 && 'motion-safe:animate-waveform-bar'
            )}
            style={{
              height: `${barHeight * 100}%`,
              animationDelay,
              minHeight: 4,
            }}
          />
        );
      })}
    </div>
  );
});

AudioWaveform.displayName = 'AudioWaveform';
