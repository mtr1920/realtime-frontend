/**
 * Invite User Dialog
 * Simplified dialog for inviting new users via email.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  inviteUserSchema,
  type InviteUserFormData,
} from '../schemas/users.schema';
import { useCreateUser } from '../hooks/useCreateUser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { SubmitButton } from '@/shared/components';
import { cn } from '@/shared/lib/utils';

interface InviteUserDialogProps {
  /** Custom trigger element, defaults to "Invite User" button */
  trigger?: React.ReactNode;
  /** Callback after successful invitation */
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin', description: 'Full access to manage workspace' },
  { value: 'MEMBER', label: 'Member', description: 'Can participate in sessions' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
] as const;

export function InviteUserDialog({ trigger, onSuccess }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);

  const { createUser, isLoading } = useCreateUser({
    onSuccess: () => {
      setOpen(false);
      reset();
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteUserFormData) => {
    await createUser({
      email: data.email,
      role: data.role,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new team member to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              {...register('email')}
              className={cn(errors.email && 'border-destructive')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <p id="invite-email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue('role', value as InviteUserFormData['role'])
              }
            >
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the level of access this user will have.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <SubmitButton type="submit" isLoading={isLoading}>
              Send Invitation
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
