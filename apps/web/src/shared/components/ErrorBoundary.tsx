import { Component, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { reportError } from '@/shared/errors/error-reporter';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Context identifier for error tracking */
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry
    reportError(error, {
      context: this.props.context ?? 'react_error_boundary',
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  className?: string;
}

export function ErrorFallback({
  error,
  onReset,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4',
        className
      )}
      role="alert"
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          className="h-12 w-12 text-destructive"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h1 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
      </div>

      {error && (
        <div className="max-w-md rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        {onReset && (
          <button
            onClick={onReset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Try again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
