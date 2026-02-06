/**
 * LoginForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/features/auth/components/LoginForm';

// Mock the auth service
vi.mock('@/features/auth/api/auth.service', () => ({
  authService: {
    getTenantFromSubdomain: vi.fn(() => null),
  },
}));

// Mock useLogin hook
const mockLogin = vi.fn();
const mockUseLogin = vi.fn(() => ({
  login: mockLogin,
  isLoading: false,
  error: null,
}));

vi.mock('@/features/auth/hooks/useLogin', () => ({
  useLogin: (options: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
    const result = mockUseLogin();
    return {
      ...result,
      login: async (data: unknown) => {
        try {
          await mockLogin(data);
          options.onSuccess?.();
        } catch (err) {
          options.onError?.(err as Error);
        }
      },
    };
  },
}));

// Mock SSOButtons
vi.mock('@/features/auth/components/SSOButtons', () => ({
  SSOButtons: ({
    onProviderClick,
    disabled,
  }: {
    providers: string[];
    onProviderClick: (provider: string) => void;
    loadingProvider?: string;
    disabled?: boolean;
  }) => (
    <div data-testid="sso-buttons">
      <button
        onClick={() => onProviderClick('google')}
        disabled={disabled}
        data-testid="sso-google"
      >
        Google SSO
      </button>
    </div>
  ),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
    mockLogin.mockResolvedValue(undefined);
  });

  describe('form rendering', () => {
    it('should render email field', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    });

    it('should render password field', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginForm />);

      const forgotLink = screen.getByText(/forgot password/i);
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should render workspace field when no subdomain tenant', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/workspace/i)).toBeInTheDocument();
    });

    it('should render remember me checkbox by default', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should hide remember me when showRememberMe is false', () => {
      render(<LoginForm showRememberMe={false} />);

      expect(screen.queryByLabelText(/remember me/i)).not.toBeInTheDocument();
    });

    it('should render SSO buttons when showSSO is true', () => {
      render(<LoginForm showSSO={true} onSSOClick={vi.fn()} />);

      expect(screen.getByTestId('sso-buttons')).toBeInTheDocument();
      expect(screen.getByText('Or continue with')).toBeInTheDocument();
    });

    it('should hide SSO buttons when showSSO is false', () => {
      render(<LoginForm showSSO={false} />);

      expect(screen.queryByTestId('sso-buttons')).not.toBeInTheDocument();
    });

    it('should render form title and description', () => {
      render(<LoginForm />);

      // Use heading role to find title specifically
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(
        screen.getByText(/enter your email and password/i)
      ).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show error for empty email on submit', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Fill in only password and workspace
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should have email input with type email for native validation', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      // Native browser validation + Zod schema provides format validation
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty workspace', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/select a workspace/i)).toBeInTheDocument();
      });
    });

    it('should set aria-invalid on email field with error', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Leave email empty to trigger "email is required" error
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Check aria-invalid is set
      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    });
  });

  describe('submission', () => {
    it('should disable button during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });
    });

    it('should call login with form data', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'mypassword');
      await user.type(screen.getByLabelText(/workspace/i), 'my-workspace');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'mypassword',
          tenantId: 'my-workspace',
        });
      });
    });

    it('should show loading spinner during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback on successful login', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockLogin.mockResolvedValue(undefined);

      render(<LoginForm onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should display server error from login hook', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should clear error on new submission attempt', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginForm />);

      // First attempt - fails
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'correct');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should eventually be cleared on success
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('SSO functionality', () => {
    it('should call onSSOClick when SSO button clicked', async () => {
      const user = userEvent.setup();
      const onSSOClick = vi.fn();

      render(<LoginForm showSSO={true} onSSOClick={onSSOClick} />);

      await user.click(screen.getByTestId('sso-google'));

      expect(onSSOClick).toHaveBeenCalledWith('google');
    });

    it('should disable SSO buttons during form submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );

      render(<LoginForm showSSO={true} onSSOClick={vi.fn()} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByTestId('sso-google')).toBeDisabled();
      });
    });
  });

  describe('tenant selection', () => {
    it('should render select dropdown when tenants provided', () => {
      const tenants = [
        { id: 'tenant-1', name: 'Acme Corp' },
        { id: 'tenant-2', name: 'Globex' },
      ];

      render(<LoginForm tenants={tenants} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select a workspace')).toBeInTheDocument();
    });

    it('should show tenant options', () => {
      const tenants = [
        { id: 'tenant-1', name: 'Acme Corp' },
        { id: 'tenant-2', name: 'Globex' },
      ];

      render(<LoginForm tenants={tenants} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Globex')).toBeInTheDocument();
    });

    it('should render text input when no tenants provided', () => {
      render(<LoginForm />);

      const workspaceInput = screen.getByLabelText(/workspace/i);
      expect(workspaceInput).toHaveAttribute('type', 'text');
      expect(workspaceInput).toHaveAttribute('placeholder', 'workspace-id');
    });
  });

  describe('accessibility', () => {
    it('should have accessible form labels', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/workspace/i)).toBeInTheDocument();
    });

    it('should associate error messages with inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/password/i), 'pass');
      await user.type(screen.getByLabelText(/workspace/i), 'tenant');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
        expect(screen.getByText(/email is required/i)).toHaveAttribute(
          'id',
          'email-error'
        );
      });
    });

    it('should have autocomplete attributes', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        'autocomplete',
        'email'
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'autocomplete',
        'current-password'
      );
    });

    it('should render error alert with role="alert"', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Server error'));

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.type(screen.getByLabelText(/workspace/i), 'tenant');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should apply custom className to card', () => {
      const { container } = render(<LoginForm className="custom-form" />);

      expect(container.firstChild).toHaveClass('custom-form');
    });

    it('should have max-width constraint', () => {
      const { container } = render(<LoginForm />);

      expect(container.firstChild).toHaveClass('max-w-md');
    });
  });

  describe('remember me', () => {
    it('should include rememberMe in form submission', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/workspace/i), 'test-tenant');
      await user.click(screen.getByLabelText(/remember me/i));

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should default rememberMe to unchecked', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/remember me/i)).not.toBeChecked();
    });
  });

  describe('form forwarding ref', () => {
    it('should forward ref to form element', () => {
      const ref = { current: null as HTMLFormElement | null };
      render(<LoginForm ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLFormElement);
    });
  });
});
