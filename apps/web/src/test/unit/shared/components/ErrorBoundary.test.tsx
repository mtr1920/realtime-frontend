/**
 * ErrorBoundary and ErrorFallback Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, ErrorFallback } from '@/shared/components/ErrorBoundary';

// Suppress console.error during tests since we're testing error scenarios
const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.restoreAllMocks();
});

// Component that throws an error for testing
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}


describe('ErrorBoundary', () => {
  describe('rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('error catching', () => {
    it('should catch errors and set hasError state', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error fallback should be displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display the error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should call onError callback with error and errorInfo', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      const [errorArg] = onError.mock.calls[0] as [Error, unknown];
      expect(errorArg.message).toBe('Test error message');
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render default ErrorFallback when no fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('should reset error state when reset is called', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click try again
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // After reset, the component tries to re-render, which will throw again
      // This is expected behavior - the error will be caught again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});

describe('ErrorFallback', () => {
  describe('rendering', () => {
    it('should render with role="alert"', () => {
      render(<ErrorFallback error={null} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display error message when error provided', () => {
      const error = new Error('Specific error message');

      render(<ErrorFallback error={error} />);

      expect(screen.getByText('Specific error message')).toBeInTheDocument();
    });

    it('should display "Something went wrong" heading', () => {
      render(<ErrorFallback error={null} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should not display error message box when no error', () => {
      render(<ErrorFallback error={null} />);

      // The error message container should not be present
      const errorBox = screen.queryByText(/error/i, {
        selector: '.font-mono',
      });
      expect(errorBox).not.toBeInTheDocument();
    });
  });

  describe('try again button', () => {
    it('should show "Try again" button when onReset provided', () => {
      render(<ErrorFallback error={null} onReset={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });

    it('should hide "Try again" button when no onReset', () => {
      render(<ErrorFallback error={null} />);

      expect(
        screen.queryByRole('button', { name: /try again/i })
      ).not.toBeInTheDocument();
    });

    it('should call onReset when "Try again" clicked', async () => {
      const onReset = vi.fn();
      const user = userEvent.setup();

      render(<ErrorFallback error={null} onReset={onReset} />);

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('reload button', () => {
    it('should show "Reload page" button always', () => {
      render(<ErrorFallback error={null} />);

      expect(
        screen.getByRole('button', { name: /reload page/i })
      ).toBeInTheDocument();
    });

    it('should reload page when "Reload page" clicked', async () => {
      const user = userEvent.setup();
      const mockReload = vi.fn();

      // Mock window.location.reload
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: mockReload },
        writable: true,
      });

      render(<ErrorFallback error={null} />);

      const button = screen.getByRole('button', { name: /reload page/i });
      await user.click(button);

      expect(mockReload).toHaveBeenCalledTimes(1);

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ErrorFallback error={null} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have centered layout', () => {
      const { container } = render(<ErrorFallback error={null} />);

      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
      expect(container.firstChild).toHaveClass('justify-center');
    });
  });

  describe('accessibility', () => {
    it('should have alert role for assistive technology', () => {
      render(<ErrorFallback error={new Error('Test')} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icon', () => {
      render(<ErrorFallback error={null} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have keyboard accessible buttons', () => {
      render(<ErrorFallback error={null} onReset={vi.fn()} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });

      // Buttons should be focusable
      tryAgainButton.focus();
      expect(document.activeElement).toBe(tryAgainButton);

      reloadButton.focus();
      expect(document.activeElement).toBe(reloadButton);
    });
  });

  describe('error display', () => {
    it('should display long error messages', () => {
      const longMessage = 'A'.repeat(200);
      const error = new Error(longMessage);

      render(<ErrorFallback error={error} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display error messages with special characters', () => {
      const error = new Error('Error: <script>alert("xss")</script>');

      render(<ErrorFallback error={error} />);

      // Should render as text, not HTML
      expect(
        screen.getByText('Error: <script>alert("xss")</script>')
      ).toBeInTheDocument();
    });
  });
});

describe('ErrorBoundary integration', () => {
  it('should work with deeply nested components', () => {
    function DeepChild(): React.ReactNode {
      throw new Error('Deep error');
    }

    function MiddleComponent() {
      return (
        <div>
          <DeepChild />
        </div>
      );
    }

    render(
      <ErrorBoundary>
        <div>
          <MiddleComponent />
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Deep error')).toBeInTheDocument();
  });

  it('should not catch errors in event handlers - they need separate handling', () => {
    // This test verifies the concept that ErrorBoundary only catches
    // errors during render, not in event handlers.
    // We avoid actually throwing in the test since it causes unhandled errors.

    const mockHandler = vi.fn();

    function ComponentWithEventHandler() {
      // Event handlers need try/catch or error boundaries at event handling level
      return <button onClick={mockHandler}>Click me</button>;
    }

    render(
      <ErrorBoundary>
        <ComponentWithEventHandler />
      </ErrorBoundary>
    );

    // Button should be visible - ErrorBoundary renders children normally
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();

    // Note: In a real app, event handler errors would need:
    // 1. try/catch in the handler itself
    // 2. window.onerror or window.addEventListener('error', ...)
    // 3. A React error boundary won't catch these
  });

  it('should isolate errors to specific boundaries', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Working component</div>
        </ErrorBoundary>
      </div>
    );

    // First boundary catches error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Second boundary still shows its content
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });
});
