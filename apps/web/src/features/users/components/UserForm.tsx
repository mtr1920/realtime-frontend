/**
 * User Form
 * Form for creating or editing users.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '../schemas/users.schema';
import type { User } from '../types/users.types';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface CreateUserFormProps {
  /** Form submission handler */
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
}

interface EditUserFormProps {
  /** Existing user for edit mode */
  user: User;
  /** Form submission handler */
  onSubmit: (data: UpdateUserFormData) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
}

type UserFormProps =
  | ({ mode: 'create' } & CreateUserFormProps)
  | ({ mode: 'edit' } & EditUserFormProps);

const ROLE_OPTIONS = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
] as const;

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
] as const;

function CreateUserForm({
  onSubmit,
  onCancel,
  isLoading,
}: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'MEMBER',
    },
  });

  const selectedRole = watch('role');

  const handleFormSubmit = async (data: CreateUserFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...register('email')}
          className={cn(errors.email && 'border-destructive')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          {...register('name')}
          className={cn(errors.name && 'border-destructive')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedRole}
          onValueChange={(value) =>
            setValue('role', value as CreateUserFormData['role'])
          }
        >
          <SelectTrigger
            id="role"
            className={cn(errors.role && 'border-destructive')}
            aria-invalid={!!errors.role}
          >
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
          Create User
        </Button>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: EditUserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name ?? '',
      role: user.role,
      status: user.status,
    },
  });

  const selectedRole = watch('role');
  const selectedStatus = watch('status');

  const handleFormSubmit = async (data: UpdateUserFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={user.email}
          disabled
          className="bg-muted"
          aria-readonly="true"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          placeholder="John Doe"
          {...register('name')}
          className={cn(errors.name && 'border-destructive')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'edit-name-error' : undefined}
        />
        {errors.name && (
          <p id="edit-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role">Role</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) =>
            setValue('role', value as UpdateUserFormData['role'])
          }
        >
          <SelectTrigger id="edit-role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setValue('status', value as UpdateUserFormData['status'])
          }
        >
          <SelectTrigger id="edit-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export function UserForm(props: UserFormProps) {
  if (props.mode === 'create') {
    return (
      <CreateUserForm
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        isLoading={props.isLoading}
      />
    );
  }

  return (
    <EditUserForm
      user={props.user}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      isLoading={props.isLoading}
    />
  );
}
