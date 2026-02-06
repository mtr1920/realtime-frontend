/**
 * StatsCard Component
 * Displays a single statistic with optional trend indicator.
 * Features layered shadows, hover lift, and staggered reveal animation.
 * Compact design to maximize dashboard space utilization.
 */

import { ArrowUpRight } from 'lucide-react';
import { Card, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { StatTrend } from '../types/dashboard.types';

// =============================================================================
// Types
// =============================================================================

export interface StatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional description text */
  description?: string;
  /** Icon component to display */
  icon: React.ElementType;
  /** Optional trend indicator */
  trend?: StatTrend;
  /** Loading state */
  isLoading?: boolean;
  /** Animation delay index for staggered reveal (0-based) */
  staggerIndex?: number;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading,
  staggerIndex,
  className,
}: StatsCardProps) {
  // Calculate animation delay for staggered reveal
  const animationStyle =
    staggerIndex !== undefined
      ? { animationDelay: `${staggerIndex * 75}ms` }
      : undefined;

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'card-interactive group p-4',
        staggerIndex !== undefined && 'animate-slide-up-fade',
        className
      )}
      style={animationStyle}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent transition-colors group-hover:bg-accent/80"
          aria-hidden="true"
        >
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div
        className="text-2xl font-bold tracking-tight"
        aria-label={`${title}: ${value}`}
      >
        {value}
      </div>
      {(description || trend) && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
              aria-label={`${trend.isPositive ? 'Up' : 'Down'} ${trend.value}%`}
            >
              <ArrowUpRight
                className={cn('w-3 h-3', !trend.isPositive && 'rotate-180')}
                aria-hidden="true"
              />
              {trend.value}%
            </span>
          )}
          {description}
        </p>
      )}
    </Card>
  );
}
