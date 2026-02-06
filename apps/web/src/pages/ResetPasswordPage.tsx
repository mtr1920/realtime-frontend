/**
 * ResetPasswordPage Component
 * Page for setting a new password with a reset token.
 */

import { useSearch } from '@tanstack/react-router';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
} from '@/shared/ui';

// Search params type
interface ResetPasswordSearchParams {
  token?: string;
}

export function ResetPasswordPage() {
  const search = useSearch({ strict: false }) as ResetPasswordSearchParams;
  const token = search.token;

  // Show error if token is missing
  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Invalid link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request
              a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <a href="/forgot-password" className="w-full">
              <Button className="w-full">Request new link</Button>
            </a>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Create new password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your new password below
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
