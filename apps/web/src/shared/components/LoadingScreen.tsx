import { cn } from '@/shared/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message = 'Loading...',
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-4 bg-background',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DotsLoader />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

/**
 * Minimal dots loader with smooth staggered animation
 */
export function DotsLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-1.5', className)}
      aria-hidden="true"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-primary motion-safe:motion-safe:animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary motion-safe:motion-safe:animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary motion-safe:animate-bounce" />
    </div>
  );
}

/**
 * Classic spinning loader
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6 motion-safe:motion-safe:animate-spin text-primary', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
