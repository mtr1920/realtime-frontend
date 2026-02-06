/**
 * Share Link Join Page
 *
 * Public page that resolves a share link ID and redirects the user to
 * the session lobby with the resolved access token and role.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Loader2, AlertCircle, Link2 } from 'lucide-react';
import { sessionsService } from '@/features/sessions';
import { Button, Card, CardContent, CardTitle, CardDescription } from '@/shared/ui';

export function ShareLinkJoinPage() {
  const { shareId } = useParams({ strict: false }) as { shareId: string };
  const [error, setError] = useState<string | null>(null);
  const resolveAttempted = useRef(false);

  useEffect(() => {
    if (resolveAttempted.current || !shareId) return;
    resolveAttempted.current = true;

    sessionsService
      .resolveShareLink(shareId)
      .then((result) => {
        // Redirect to lobby with the resolved credentials
        const params = new URLSearchParams({
          token: result.accessToken,
          roleId: result.roleId,
          requiresAuth: String(result.requiresAuth),
        });
        window.location.href = `/sessions/${result.sessionId}/lobby?${params.toString()}`;
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'This link is invalid, expired, or has reached its usage limit.';
        setError(message);
      });
  }, [shareId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-xl mb-2">Unable to join</CardTitle>
            <CardDescription className="mb-6">{error}</CardDescription>
            <Button
              variant="outline"
              onClick={() => {
                resolveAttempted.current = false;
                setError(null);
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-8 pb-8 text-center">
          <div className="relative mb-4">
            <Link2 className="h-12 w-12 text-primary" />
            <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Joining session...</CardTitle>
          <CardDescription>
            Resolving your share link. You will be redirected shortly.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
