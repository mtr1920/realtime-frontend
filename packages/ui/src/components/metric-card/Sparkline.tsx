/**
 * Sparkline Component
 *
 * Simple SVG sparkline chart for inline data visualization.
 */

import { forwardRef, useMemo } from 'react';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface SparklineProps {
  /** Data points to display */
  data: number[];
  /** Width of the sparkline */
  width?: number;
  /** Height of the sparkline */
  height?: number;
  /** Stroke color (CSS variable or color) */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Fill color for area under the line */
  fill?: string;
  /** Whether to show area fill */
  showArea?: boolean;
  /** Whether to show dots at data points */
  showDots?: boolean;
  /** Dot radius */
  dotRadius?: number;
  /** Whether to animate on load */
  animated?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(
  (
    {
      data,
      width = 100,
      height = 30,
      stroke = 'currentColor',
      strokeWidth = 2,
      fill,
      showArea = false,
      showDots = false,
      dotRadius = 2,
      animated = false,
      className,
    },
    ref
  ) => {
    // Generate path data
    const { linePath, areaPath, points } = useMemo(() => {
      if (data.length === 0) {
        return { linePath: '', areaPath: '', points: [] };
      }

      const padding = strokeWidth + (showDots ? dotRadius : 0);
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;

      const points = data.map((value, index) => ({
        x: padding + (index / (data.length - 1 || 1)) * chartWidth,
        y: padding + chartHeight - ((value - min) / range) * chartHeight,
      }));

      // Generate line path
      const linePath = points
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

      // Generate area path
      const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${height - padding} L ${padding} ${height - padding} Z`;

      return { linePath, areaPath, points };
    }, [data, width, height, strokeWidth, showDots, dotRadius]);

    if (data.length === 0) {
      return null;
    }

    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn('overflow-visible', className)}
        aria-hidden="true"
      >
        {/* Area fill */}
        {showArea && fill && (
          <path
            d={areaPath}
            fill={fill}
            opacity={0.2}
            className={animated ? 'motion-safe:animate-in motion-safe:fade-in' : undefined}
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'motion-safe:animate-in motion-safe:fade-in' : undefined}
        />

        {/* Dots */}
        {showDots &&
          points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={dotRadius}
              fill={stroke}
              className={animated ? 'motion-safe:animate-in motion-safe:zoom-in' : undefined}
            />
          ))}
      </svg>
    );
  }
);
Sparkline.displayName = 'Sparkline';
