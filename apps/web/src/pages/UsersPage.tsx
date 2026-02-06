/**
 * Users Page
 * User management and team members list.
 */

import { useState, useCallback, useMemo, useTransition, useDeferredValue } from 'react';
import { Users, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/features/auth';
import {
  useUsers,
  useDeleteUser,
  useResendInvite,
  UserTable,
  UserDialog,
  InviteUserDialog,
  type User,
  type UserStatus,
} from '@/features/users';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/ui';
import type { UserRole } from '@/types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
] as const;

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
] as const;

export function UsersPage() {
  const { hasPermission } = usePermissions();
  const canInvite = hasPermission('canInviteUsers');
  const canView = hasPermission('canViewUsers');

  // Concurrent features for responsive UI during filtering
  const [isPending, startTransition] = useTransition();

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Defer the search query to keep input responsive
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  // Build filter params using deferred search for responsive UI
  const filterParams = useMemo(() => {
    const params: {
      search?: string;
      status?: UserStatus;
      role?: UserRole;
    } = {};

    if (deferredSearchQuery.trim()) {
      params.search = deferredSearchQuery.trim();
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    if (roleFilter !== 'all') {
      params.role = roleFilter;
    }

    return params;
  }, [deferredSearchQuery, statusFilter, roleFilter]);

  // Fetch users
  const {
    users,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsers({
    ...filterParams,
    enabled: canView,
  });

  // Delete mutation
  const { deleteUser, isLoading: isDeleting } = useDeleteUser();

  // Resend invite mutation
  const { resendInvite, isLoading: isResending } = useResendInvite();

  // Handlers
  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (user: User) => {
    await deleteUser(user.id);
  }, [deleteUser]);

  const handleResendInvite = useCallback((user: User) => {
    resendInvite(user.id);
  }, [resendInvite]);

  const handleDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedUser(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    handleDialogClose();
    refetch();
  }, [handleDialogClose, refetch]);

  // If user doesn't have view permission
  if (!canView) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription>
            {error?.message ?? 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const hasFilters = searchQuery || statusFilter !== 'all' || roleFilter !== 'all';
  const showEmptyState = !isLoading && users.length === 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            startTransition(() => {
              setStatusFilter(value as UserStatus | 'all');
            });
          }}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            startTransition(() => {
              setRoleFilter(value as UserRole | 'all');
            });
          }}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh users list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'motion-safe:animate-spin' : ''}`} />
          </Button>
          {canInvite && <InviteUserDialog onSuccess={handleSuccess} />}
        </div>
      </div>

      {/* Users Table */}
      {!showEmptyState && (
        <div className={isPending ? 'opacity-70 pointer-events-none' : ''}>
          <UserTable
            users={users}
            isLoading={isLoading || isDeleting || isResending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResendInvite={handleResendInvite}
          />
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl mb-2">
              {hasFilters ? 'No users found' : 'No team members'}
            </CardTitle>
            <CardDescription className="text-center max-w-sm mb-6">
              {hasFilters
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'Invite team members to collaborate on sessions and projects.'}
            </CardDescription>
            {!hasFilters && canInvite && (
              <InviteUserDialog onSuccess={handleSuccess} />
            )}
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
