/**
 * UserDetailPage Component
 *
 * Displays detailed user profile information with edit/delete actions.
 */

import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Shield,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Skeleton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui';
import { usePermissions } from '@/shared/hooks';
import { useUser, useDeleteUser, UserDialog, UserStatusBadge } from '@/features/users';
import { useState } from 'react';

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'OWNER':
      return 'default';
    case 'ADMIN':
      return 'secondary';
    default:
      return 'outline';
  }
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={`skeleton-${i}`} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load user</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Component
// =============================================================================

export function UserDetailPage() {
  const navigate = useNavigate();
  const { userId } = useParams({ strict: false }) as { userId: string };
  const { hasPermission } = usePermissions();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { user, isLoading, isError, error, refetch } = useUser(userId);
  const { deleteUser, isLoading: isDeleting } = useDeleteUser();

  const canManageUsers = hasPermission('canManageUsers');
  const canRemoveUsers = hasPermission('canRemoveUsers');

  const handleDelete = async () => {
    await deleteUser(userId);
    navigate({ to: '/users' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <UserDetailSkeleton />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate({ to: '/users' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/users' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>

        <div className="flex items-center gap-2">
          {canManageUsers && (
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          {canRemoveUsers && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {user.name || user.email}? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name || user.email} />
              <AvatarFallback className="text-xl">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{user.name || 'Unnamed User'}</CardTitle>
                <UserStatusBadge status={user.status} />
              </div>
              <CardDescription className="text-base">{user.email}</CardDescription>
              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Role & Permissions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {user.role.charAt(0) + user.role.slice(1).toLowerCase()} role
                  </span>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last login: {formatDate(user.lastLoginAt)}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Account
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata (if exists) */}
          {user.metadata && Object.keys(user.metadata).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Additional Information
              </h3>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(user.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {user && (
        <UserDialog
          user={user}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
}
