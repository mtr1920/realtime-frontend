/**
 * User Table
 * Data table for displaying users using the new BaseTable component.
 */

import { useMemo, useCallback } from 'react';
import { Pencil, Trash2, Mail, Users } from 'lucide-react';
import { BaseTable, UserAvatar } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import type { User } from '../types/users.types';
import { UserStatusBadge } from './UserStatusBadge';
import { usePermissions } from '@/features/auth';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onResendInvite?: (user: User) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
  };
  return labels[role] ?? role;
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<User>[] = [
  {
    id: 'name',
    header: 'User',
    accessor: 'name',
    cell: (row) => (
      <div className="flex items-center gap-3">
        <UserAvatar
          src={row.avatarUrl}
          alt={row.name ?? row.email}
          size="lg"
        />
        <div className="flex flex-col">
          <span className="font-medium">
            {row.name ?? 'No name'}
          </span>
          <span className="text-sm text-muted-foreground">
            {row.email}
          </span>
        </div>
      </div>
    ),
    width: 300,
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
    cell: (row) => (
      <span className="text-muted-foreground">
        {getRoleLabel(row.role)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    cell: (row) => <UserStatusBadge status={row.status} />,
  },
  {
    id: 'lastLoginAt',
    header: 'Last Login',
    accessor: 'lastLoginAt',
    cell: (row) => (
      <span className="text-muted-foreground">
        {formatDateTime(row.lastLoginAt)}
      </span>
    ),
  },
];

// ============================================================================
// Component
// ============================================================================

export function UserTable({
  users,
  isLoading,
  onEdit,
  onDelete,
  onResendInvite,
}: UserTableProps) {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('canManageUsers');
  const canRemove = hasPermission('canRemoveUsers');

  const rowActions = useMemo<RowAction<User>[]>(() => {
    const actions: RowAction<User>[] = [];

    if (canManage && onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit user',
        icon: <Pencil className="h-4 w-4" />,
        onClick: onEdit,
      });
    }

    if (canManage && onResendInvite) {
      actions.push({
        id: 'resend-invite',
        label: 'Resend invite',
        icon: <Mail className="h-4 w-4" />,
        hidden: (row) => row.status !== 'PENDING',
        onClick: onResendInvite,
      });
    }

    if (canRemove && onDelete) {
      actions.push({
        id: 'remove',
        label: 'Remove user',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: onDelete,
      });
    }

    return actions;
  }, [canManage, canRemove, onEdit, onDelete, onResendInvite]);

  const handleRowClick = useCallback(
    (row: User) => {
      if (canManage) {
        onEdit?.(row);
      }
    },
    [canManage, onEdit]
  );

  return (
    <BaseTable
      data={users}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      onRowClick={canManage ? handleRowClick : undefined}
      emptyTitle="No users found"
      emptyDescription="Invite team members to get started or adjust your search filters."
      emptyIcon={<Users className="h-6 w-6 text-muted-foreground" />}
    />
  );
}
