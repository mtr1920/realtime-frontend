/**
 * AIProviderNotification Component
 *
 * Notification for AI provider switch events:
 * - Shows when provider changes (fallback, manual, health)
 * - Auto-dismisses after delay
 * - Shows switch reason
 */

import { forwardRef, useEffect, useState } from 'react';
import { Info, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { AIProviderName } from '../types/session.types';

// =============================================================================
// Types
// =============================================================================

export type ProviderSwitchReason = 'fallback' | 'manual' | 'health';

interface AIProviderNotificationProps {
  /** Previous provider */
  from: AIProviderName;
  /** New provider */
  to: AIProviderName;
  /** Reason for switch */
  reason: ProviderSwitchReason;
  /** Whether notification is visible */
  isVisible: boolean;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (0 to disable). Default extended for screen reader accessibility */
  autoDismissDelay?: number;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getProviderDisplayName(provider: AIProviderName): string {
  switch (provider) {
    case 'gemini-live':
      return 'Gemini Live';
    case 'openai-realtime':
      return 'OpenAI Realtime';
    default:
      return provider;
  }
}

function getReasonConfig(reason: ProviderSwitchReason) {
  switch (reason) {
    case 'fallback':
      return {
        icon: AlertTriangle,
        title: 'Provider Switched',
        description: 'Switched to backup provider due to connection issues.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
      };
    case 'health':
      return {
        icon: RefreshCw,
        title: 'Provider Changed',
        description: 'Switched to a healthier provider for better performance.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      };
    case 'manual':
      return {
        icon: Info,
        title: 'Provider Updated',
        description: 'AI provider has been changed by configuration.',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        borderColor: 'border-border',
      };
    default:
      return {
        icon: Info,
        title: 'Provider Changed',
        description: 'AI provider has been updated.',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        borderColor: 'border-border',
      };
  }
}

// =============================================================================
// Component
// =============================================================================

export const AIProviderNotification = forwardRef<
  HTMLDivElement,
  AIProviderNotificationProps
>(
  (
    {
      from,
      to,
      reason,
      isVisible,
      onDismiss,
      autoDismissDelay = 8000, // Extended from 5000 for screen reader accessibility
      className,
    },
    ref
  ) => {
    const [isExiting, setIsExiting] = useState(false);

    const config = getReasonConfig(reason);
    const Icon = config.icon;

    // Auto-dismiss
    useEffect(() => {
      if (!isVisible || autoDismissDelay === 0) return;

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }, [isVisible, autoDismissDelay, onDismiss]);

    // Reset exit state when becoming visible
    useEffect(() => {
      if (isVisible) {
        setIsExiting(false);
      }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'fixed bottom-4 right-4 z-50 max-w-sm',
          'transform transition-all duration-300 ease-out',
          isExiting
            ? 'opacity-0 translate-y-2'
            : 'opacity-100 translate-y-0',
          className
        )}
      >
        <div
          className={cn(
            'rounded-lg border p-4 shadow-lg',
            config.bgColor,
            config.borderColor
          )}
        >
          <div className="flex gap-3">
            {/* Icon */}
            <div className={cn('flex-shrink-0', config.color)}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{config.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.description}
              </p>

              {/* Provider Change */}
              <div className="mt-2 text-xs flex items-center gap-2">
                <span className="text-muted-foreground">
                  {getProviderDisplayName(from)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={cn('font-medium', config.color)}>
                  {getProviderDisplayName(to)}
                </span>
              </div>
            </div>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => {
                setIsExiting(true);
                setTimeout(onDismiss, 300);
              }}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

AIProviderNotification.displayName = 'AIProviderNotification';

// =============================================================================
// Hook for managing provider switch notifications
// =============================================================================

interface ProviderSwitchState {
  from: AIProviderName | null;
  to: AIProviderName | null;
  reason: ProviderSwitchReason | null;
  isVisible: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProviderSwitchNotification() {
  const [state, setState] = useState<ProviderSwitchState>({
    from: null,
    to: null,
    reason: null,
    isVisible: false,
  });

  const showNotification = (
    from: AIProviderName,
    to: AIProviderName,
    reason: ProviderSwitchReason
  ) => {
    setState({
      from,
      to,
      reason,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return {
    ...state,
    showNotification,
    hideNotification,
  };
}
