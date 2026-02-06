/**
 * User Dialog
 * Modal dialog for creating or editing users.
 */

import type { User } from '../types/users.types';
import type { CreateUserFormData, UpdateUserFormData } from '../schemas/users.schema';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { UserForm } from './UserForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';

interface UserDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing user for edit mode, undefined for create mode */
  user?: User;
  /** Callback after successful operation */
  onSuccess?: () => void;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserDialogProps) {
  const isEditMode = !!user;

  const { createUser, isLoading: isCreating } = useCreateUser({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const { updateUser, isLoading: isUpdating } = useUpdateUser({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const isLoading = isCreating || isUpdating;

  const handleCreate = async (data: CreateUserFormData) => {
    await createUser(data);
  };

  const handleUpdate = async (data: UpdateUserFormData) => {
    if (user) {
      await updateUser({
        id: user.id,
        data,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update user details and permissions below.'
              : 'Add a new user to your workspace.'}
          </DialogDescription>
        </DialogHeader>
        {isEditMode && user ? (
          <UserForm
            mode="edit"
            user={user}
            onSubmit={handleUpdate}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        ) : (
          <UserForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
