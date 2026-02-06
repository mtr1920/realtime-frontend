/**
 * LoginForm Component
 * Form for user authentication with email, password, and tenant selection.
 */

import { forwardRef, type HTMLAttributes, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { useLogin } from '../hooks/useLogin';
import { authService } from '@/features/auth/api/auth.service';
import { SSOButtons, type SSOProvider } from './SSOButtons';
import { cn } from '@/shared/lib/utils';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui';

interface LoginFormProps extends HTMLAttributes<HTMLFormElement> {
  /**
   * URL to redirect to after successful login.
   */
  redirectTo?: string;
  /**
   * Callback when login is successful.
   */
  onSuccess?: () => void;
  /**
   * Available tenants for selection. If not provided, shows text input.
   */
  tenants?: Array<{ id: string; name: string }>;
  /**
   * Show the "Remember me" checkbox.
   */
  showRememberMe?: boolean;
  /**
   * Show SSO buttons.
   */
  showSSO?: boolean;
  /**
   * SSO button click handler.
   */
  onSSOClick?: (provider: SSOProvider) => void;
  /**
   * Provider currently loading (for SSO button state).
   */
  loadingProvider?: SSOProvider | null;
}

const LoginForm = forwardRef<HTMLFormElement, LoginFormProps>(
  (
    {
      className,
      redirectTo,
      onSuccess,
      tenants,
      showRememberMe = true,
      showSSO = false,
      onSSOClick,
      loadingProvider,
      ...props
    },
    ref
  ) => {
    const [serverError, setServerError] = useState<string | null>(null);

    // Get default tenant from subdomain
    const defaultTenant = authService.getTenantFromSubdomain();

    const {
      register,
      handleSubmit,
      setValue,
      formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: '',
        password: '',
        tenantId: defaultTenant || '',
        rememberMe: false,
      },
    });

    // Set tenant from subdomain on mount
    useEffect(() => {
      if (defaultTenant) {
        setValue('tenantId', defaultTenant);
      }
    }, [defaultTenant, setValue]);

    const { login, isLoading, error: loginError } = useLogin({
      redirectTo,
      onSuccess: () => {
        setServerError(null);
        onSuccess?.();
      },
      onError: (err) => {
        setServerError(err.message);
      },
    });

    const onSubmit = async (data: LoginFormData) => {
      setServerError(null);
      await login({
        email: data.email,
        password: data.password,
        tenantId: data.tenantId,
      });
    };

    const displayError = serverError || loginError?.message;

    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form ref={ref} onSubmit={handleSubmit(onSubmit)} {...props}>
          <CardContent className="space-y-4">
            {/* Server Error Alert */}
            {displayError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {displayError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Tenant Selection */}
            {!defaultTenant && (
              <div className="space-y-2">
                <Label htmlFor="tenantId">Workspace</Label>
                {tenants && tenants.length > 0 ? (
                  <select
                    id="tenantId"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={!!errors.tenantId}
                    aria-describedby={
                      errors.tenantId ? 'tenant-error' : undefined
                    }
                    {...register('tenantId')}
                  >
                    <option value="">Select a workspace</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="tenantId"
                    type="text"
                    placeholder="workspace-id"
                    aria-invalid={!!errors.tenantId}
                    aria-describedby={
                      errors.tenantId ? 'tenant-error' : undefined
                    }
                    {...register('tenantId')}
                  />
                )}
                {errors.tenantId && (
                  <p id="tenant-error" className="text-sm text-destructive">
                    {errors.tenantId.message}
                  </p>
                )}
              </div>
            )}

            {/* Remember Me */}
            {showRememberMe && (
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="font-normal">
                  Remember me
                </Label>
              </div>
            )}

            {/* SSO Section */}
            {showSSO && onSSOClick && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <SSOButtons
                  providers={['google', 'microsoft']}
                  onProviderClick={onSSOClick}
                  loadingProvider={loadingProvider ?? undefined}
                  disabled={isLoading || isSubmitting}
                />
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }
);

LoginForm.displayName = 'LoginForm';

export { LoginForm };
