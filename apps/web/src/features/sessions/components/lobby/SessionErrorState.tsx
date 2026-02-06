/**
 * SessionErrorState Component
 * Displays session-specific error states in the lobby.
 */

import { Link, type LinkProps } from '@tanstack/react-router';
import { Clock, XCircle, Users, ShieldX, HelpCircle } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardTitle } from '@/shared/ui';
import type { SessionErrorType } from '../../utils/sessionErrors';

export interface SessionErrorStateProps {
  /** The type of session error */
  type: SessionErrorType;
  /** Error message to display */
  message: string;
  /** Callback when user wants to retry (optional) */
  onRetry?: () => void;
  /** Session ID for navigation (optional) */
  sessionId?: string;
}

const ERROR_CONFIG: Record<
  SessionErrorType,
  {
    icon: typeof Clock;
    iconColor: string;
    title: string;
  }
> = {
  expired: {
    icon: Clock,
    iconColor: 'text-amber-500',
    title: 'Session Expired',
  },
  invalid_status: {
    icon: XCircle,
    iconColor: 'text-destructive',
    title: 'Session Unavailable',
  },
  not_found: {
    icon: HelpCircle,
    iconColor: 'text-muted-foreground',
    title: 'Session Not Found',
  },
  full: {
    icon: Users,
    iconColor: 'text-amber-500',
    title: 'Session Full',
  },
  access_denied: {
    icon: ShieldX,
    iconColor: 'text-destructive',
    title: 'Access Denied',
  },
};

/**
 * Component to display session-specific error states.
 *
 * @example
 * ```tsx
 * <SessionErrorState
 *   type="expired"
 *   message="This session has expired and is no longer available."
 *   onRetry={() => setError(null)}
 * />
 * ```
 */
export function SessionErrorState({
  type,
  message,
  onRetry,
  sessionId,
}: SessionErrorStateProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card className="glass-card">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Icon
          className={`h-12 w-12 ${config.iconColor} mb-4`}
          aria-hidden="true"
        />
        <CardTitle className="text-xl mb-2 text-center">
          {config.title}
        </CardTitle>
        <CardDescription className="text-center max-w-md mb-6">
          {message}
        </CardDescription>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={'/sessions' as LinkProps['to']}>Go to Sessions</Link>
          </Button>
          {sessionId && type !== 'not_found' && (
            <Button variant="outline" asChild>
              <Link to={`/sessions/${sessionId}` as LinkProps['to']}>
                View Details
              </Link>
            </Button>
          )}
          {onRetry && type !== 'expired' && type !== 'not_found' && (
            <Button onClick={onRetry}>Try Again</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
