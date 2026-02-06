/**
 * ForgotPasswordPage Component
 * Page for requesting a password reset email.
 */

import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Reset your password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email to receive reset instructions
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
