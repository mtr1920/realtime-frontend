/**
 * JoinPanel
 *
 * Enhanced display name input and join button for session lobby.
 * Features floating labels, gradient button with glow, and smooth loading state.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowRight, User, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface JoinPanelProps {
  /** Session title */
  sessionTitle?: string;

  /** Initial display name */
  initialDisplayName?: string;

  /** Role assigned to the user */
  roleName?: string;

  /** Role display name */
  roleDisplayName?: string;

  /** Whether joining is in progress */
  isJoining?: boolean;

  /** Whether the join button is disabled */
  disabled?: boolean;

  /** Reason for being disabled */
  disabledReason?: string;

  /** Whether this is an observer join */
  isObserver?: boolean;

  /** Called when join is triggered */
  onJoin?: (displayName: string) => void;

  /** Additional CSS class */
  className?: string;
}

export function JoinPanel({
  sessionTitle,
  initialDisplayName = '',
  roleName,
  roleDisplayName,
  isJoining = false,
  disabled = false,
  disabledReason,
  isObserver = false,
  onJoin,
  className,
}: JoinPanelProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleJoin = useCallback(() => {
    // Validate display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      inputRef.current?.focus();
      return;
    }
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      inputRef.current?.focus();
      return;
    }
    if (trimmedName.length > 50) {
      setError('Name must be 50 characters or less');
      inputRef.current?.focus();
      return;
    }

    setError(null);
    onJoin?.(trimmedName);
  }, [displayName, onJoin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !isJoining) {
      handleJoin();
    }
  };

  const hasValue = displayName.length > 0;
  const canJoin = displayName.trim().length >= 2 && !disabled && !isJoining;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Join Session</CardTitle>
        {sessionTitle && (
          <CardDescription className="truncate">{sessionTitle}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Role Badge */}
        {(roleName || roleDisplayName) && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">Joining as:</span>
            <Badge
              variant={isObserver ? 'secondary' : 'default'}
              className="capitalize"
            >
              {roleDisplayName || roleName}
            </Badge>
          </div>
        )}

        {/* Observer Notice */}
        {isObserver && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950 motion-safe:animate-fade-in">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You are joining as an observer. You will be able to watch and listen
              but cannot participate with audio or video.
            </p>
          </div>
        )}

        {/* Floating Label Input */}
        <div className="space-y-2">
          <div className="relative">
            {/* Floating Label */}
            <label
              htmlFor="displayName"
              className={cn(
                'absolute left-3 transition-all duration-200 pointer-events-none z-10',
                hasValue || isFocused
                  ? 'top-1 text-xs text-primary'
                  : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
              )}
            >
              Your Name
            </label>

            {/* Icon */}
            <User
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
                isFocused ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-hidden
            />

            {/* Input */}
            <input
              ref={inputRef}
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isJoining}
              className={cn(
                'w-full rounded-xl border bg-transparent transition-all duration-200',
                'px-3 pt-5 pb-2 pr-10 text-base outline-none',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                error
                  ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                  : 'border-input',
                isJoining && 'opacity-60'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? 'displayName-error' : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p
              id="displayName-error"
              className="text-sm text-destructive px-1 motion-safe:animate-fade-in"
            >
              {error}
            </p>
          )}
        </div>

        {/* Disabled Reason */}
        {disabled && disabledReason && (
          <p className="text-sm text-muted-foreground px-1">{disabledReason}</p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleJoin}
          disabled={!canJoin}
          className={cn(
            'w-full h-12 text-base font-medium rounded-xl press-effect',
            'transition-all duration-300',
            canJoin && !isJoining && [
              'bg-gradient-to-r from-primary to-primary/80',
              'hover:shadow-lg hover:shadow-primary/25',
              'hover:-translate-y-0.5',
            ]
          )}
          size="lg"
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 motion-safe:animate-spin" aria-hidden />
              Joining...
            </>
          ) : (
            <>
              {isObserver ? 'Join as Observer' : 'Join Session'}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
