/**
 * MetricCard Component
 *
 * Card for displaying metrics/KPIs with optional sparkline.
 */

import { forwardRef, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { cn } from '../../utils';
import { Sparkline, type SparklineProps } from './Sparkline';

// ============================================================================
// Types
// ============================================================================

export interface MetricCardProps {
  /** Metric title/label */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional description */
  description?: string;
  /** Trend value (e.g., "+12%", "-5%") */
  trend?: string;
  /** Trend direction */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Whether trend is positive */
  trendPositive?: boolean;
  /** Sparkline data */
  sparkline?: number[];
  /** Sparkline props override */
  sparklineProps?: Partial<SparklineProps>;
  /** Optional icon */
  icon?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      description,
      trend,
      trendDirection,
      trendPositive,
      sparkline,
      sparklineProps,
      icon,
      isLoading,
      className,
    },
    ref
  ) => {
    // Determine trend color
    const getTrendStyles = () => {
      if (trendPositive === true || trendDirection === 'up') {
        return 'text-green-600 dark:text-green-400';
      }
      if (trendPositive === false || trendDirection === 'down') {
        return 'text-red-600 dark:text-red-400';
      }
      return 'text-muted-foreground';
    };

    const getTrendIcon = () => {
      if (trendDirection === 'up') {
        return <TrendingUp className="h-3 w-3" />;
      }
      if (trendDirection === 'down') {
        return <TrendingDown className="h-3 w-3" />;
      }
      return <Minus className="h-3 w-3" />;
    };

    const getSparklineColor = () => {
      if (trendPositive === true || trendDirection === 'up') {
        return 'rgb(22 163 74)'; // green-600
      }
      if (trendPositive === false || trendDirection === 'down') {
        return 'rgb(220 38 38)'; // red-600
      }
      return 'rgb(100 116 139)'; // slate-500
    };

    return (
      <Card ref={ref} className={cn('relative', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              {/* Value and trend row */}
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    {value}
                  </span>
                  {trend && (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium',
                        getTrendStyles()
                      )}
                    >
                      {trendDirection && getTrendIcon()}
                      {trend}
                    </span>
                  )}
                </div>

                {/* Sparkline */}
                {sparkline && sparkline.length > 0 && (
                  <Sparkline
                    data={sparkline}
                    width={60}
                    height={24}
                    stroke={getSparklineColor()}
                    strokeWidth={1.5}
                    showArea
                    fill={getSparklineColor()}
                    {...sparklineProps}
                  />
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = 'MetricCard';
