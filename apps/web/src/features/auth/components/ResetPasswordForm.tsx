/**
 * ResetPasswordForm Component
 * Form for setting a new password with a reset token.
 */

import { forwardRef, type HTMLAttributes, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  passwordResetSchema,
  type PasswordResetFormData,
} from '../schemas/auth.schema';
import { useResetPassword } from '../hooks/useResetPassword';
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

interface ResetPasswordFormProps extends HTMLAttributes<HTMLFormElement> {
  /**
   * Reset token from URL.
   */
  token: string;
  /**
   * Callback when reset is successful.
   */
  onSuccess?: () => void;
}

const ResetPasswordForm = forwardRef<HTMLFormElement, ResetPasswordFormProps>(
  ({ className, token, onSuccess, ...props }, ref) => {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<PasswordResetFormData>({
      resolver: zodResolver(passwordResetSchema),
      defaultValues: {
        token,
        password: '',
        confirmPassword: '',
      },
    });

    const {
      resetPassword,
      isLoading,
      error: resetPasswordError,
    } = useResetPassword({
      onSuccess: () => {
        setServerError(null);
        onSuccess?.();
      },
      onError: (err) => {
        setServerError(err.message);
      },
    });

    const onSubmit = async (data: PasswordResetFormData) => {
      setServerError(null);
      await resetPassword(token, data.password);
    };

    const displayError = serverError || resetPasswordError?.message;

    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create new password</CardTitle>
          <CardDescription>
            Enter your new password below
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

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : 'password-hint'
                }
                {...register('password')}
              />
              {errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : (
                <p id="password-hint" className="text-sm text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-password-error' : undefined
                }
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? 'Resetting...' : 'Reset password'}
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

ResetPasswordForm.displayName = 'ResetPasswordForm';

export { ResetPasswordForm };
