/**
 * ForgotPasswordForm Component
 * Form for requesting a password reset email.
 */

import { forwardRef, type HTMLAttributes, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  passwordResetRequestSchema,
  type PasswordResetRequestFormData,
} from '../schemas/auth.schema';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { authService } from '@/features/auth/api/auth.service';
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

interface ForgotPasswordFormProps extends HTMLAttributes<HTMLFormElement> {
  /**
   * Callback when request is successful.
   */
  onSuccess?: () => void;
}

const ForgotPasswordForm = forwardRef<HTMLFormElement, ForgotPasswordFormProps>(
  ({ className, onSuccess, ...props }, ref) => {
    const [serverError, setServerError] = useState<string | null>(null);

    // Get default tenant from subdomain
    const defaultTenant = authService.getTenantFromSubdomain();

    const {
      register,
      handleSubmit,
      setValue,
      formState: { errors, isSubmitting },
    } = useForm<PasswordResetRequestFormData>({
      resolver: zodResolver(passwordResetRequestSchema),
      defaultValues: {
        email: '',
        tenantId: defaultTenant || '',
      },
    });

    // Set tenant from subdomain on mount
    useEffect(() => {
      if (defaultTenant) {
        setValue('tenantId', defaultTenant);
      }
    }, [defaultTenant, setValue]);

    const {
      forgotPassword,
      isLoading,
      isSuccess,
      error: forgotPasswordError,
    } = useForgotPassword({
      onSuccess: () => {
        setServerError(null);
        onSuccess?.();
      },
      onError: (err) => {
        setServerError(err.message);
      },
    });

    const onSubmit = async (data: PasswordResetRequestFormData) => {
      setServerError(null);
      await forgotPassword({ email: data.email, tenantId: data.tenantId });
    };

    const displayError = serverError || forgotPasswordError?.message;

    // Success state
    if (isSuccess) {
      return (
        <Card className={cn('w-full max-w-md', className)}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              If an account exists with that email, we sent you password reset
              instructions.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <a href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </a>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter your email to receive reset instructions
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

            {/* Tenant Selection */}
            {!defaultTenant && (
              <div className="space-y-2">
                <Label htmlFor="tenantId">Workspace</Label>
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
                {errors.tenantId && (
                  <p id="tenant-error" className="text-sm text-destructive">
                    {errors.tenantId.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? 'Sending...' : 'Send reset instructions'}
            </Button>
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Back to sign in
            </a>
          </CardFooter>
        </form>
      </Card>
    );
  }
);

ForgotPasswordForm.displayName = 'ForgotPasswordForm';

export { ForgotPasswordForm };
