/**
 * SessionErrorCard
 *
 * Reusable error/message card component for consistent error state UI.
 * Consolidates the common pattern found across many pages.
 */

import type { ReactNode, ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription, Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface SessionErrorCardAction {
  /** Action button label */
  label: string;
  /** Click handler or Link 'to' prop */
  onClick?: () => void;
  /** Link destination (renders as Link if provided) */
  href?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

export interface SessionErrorCardProps {
  /** Icon to display (defaults to AlertCircle) */
  icon?: ComponentType<{ className?: string }>;
  /** Icon color class (defaults to text-destructive) */
  iconColor?: string;
  /** Card title */
  title: string;
  /** Title color (defaults to text-destructive for errors) */
  titleColor?: string;
  /** Description/message */
  description: ReactNode;
  /** Primary action button */
  action?: SessionErrorCardAction;
  /** Secondary action button */
  secondaryAction?: SessionErrorCardAction;
  /** Whether to use glass-card styling */
  glassCard?: boolean;
  /** Padding size (defaults to 'lg') */
  padding?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * Reusable error/message card for consistent UI across pages.
 *
 * @example
 * ```tsx
 * <SessionErrorCard
 *   title="Session not found"
 *   description="The session does not exist or you don't have access."
 *   action={{ label: 'Go to Sessions', href: '/sessions' }}
 *   glassCard
 * />
 * ```
 *
 * @example
 * ```tsx
 * <SessionErrorCard
 *   icon={Clock}
 *   iconColor="text-muted-foreground"
 *   title="Session Not Available"
 *   titleColor="text-foreground"
 *   description="This session has ended."
 *   action={{ label: 'View Details', href: '/sessions/123' }}
 *   secondaryAction={{ label: 'Go Back', onClick: () => navigate(-1) }}
 * />
 * ```
 */
export function SessionErrorCard({
  icon: Icon = AlertCircle,
  iconColor = 'text-destructive',
  title,
  titleColor = 'text-destructive',
  description,
  action,
  secondaryAction,
  glassCard = false,
  padding = 'lg',
  className,
}: SessionErrorCardProps) {
  const paddingClass = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  }[padding];

  const renderAction = (actionConfig: SessionErrorCardAction) => {
    if (actionConfig.href) {
      return (
        <Button variant={actionConfig.variant ?? 'default'} asChild>
          <a href={actionConfig.href}>{actionConfig.label}</a>
        </Button>
      );
    }
    return (
      <Button variant={actionConfig.variant ?? 'default'} onClick={actionConfig.onClick}>
        {actionConfig.label}
      </Button>
    );
  };

  return (
    <Card className={cn(glassCard && 'glass-card', className)}>
      <CardContent className={cn('flex flex-col items-center justify-center', paddingClass)}>
        <Icon className={cn('h-12 w-12 mb-4', iconColor)} aria-hidden />
        <CardTitle className={cn('text-xl mb-2', titleColor)}>{title}</CardTitle>
        <CardDescription className="text-center max-w-md mb-4">
          {description}
        </CardDescription>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3">
            {secondaryAction && renderAction(secondaryAction)}
            {action && renderAction(action)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
