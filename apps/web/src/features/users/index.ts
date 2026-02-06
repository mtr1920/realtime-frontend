/**
 * Users Feature
 * Public exports for the users management module.
 */

// API Service
export {
  usersService,
  type User,
  type UserStatus,
  type UserListParams,
  type PaginatedUsersResponse,
  type CreateUserInput,
  type UpdateUserInput,
} from './api/users.service';

// Types
export type { InviteUserInput, CursorPagination } from './types/users.types';

// Hooks
export { useUsers, useInfiniteUsers } from './hooks/useUsers';
export { useUser } from './hooks/useUser';
export { useCreateUser } from './hooks/useCreateUser';
export { useUpdateUser } from './hooks/useUpdateUser';
export { useDeleteUser } from './hooks/useDeleteUser';
export { useResendInvite } from './hooks/useResendInvite';

// Components
export { UserTable } from './components/UserTable';
export { UserForm } from './components/UserForm';
export { UserDialog } from './components/UserDialog';
export { UserStatusBadge } from './components/UserStatusBadge';
export { InviteUserDialog } from './components/InviteUserDialog';

// Schemas
export {
  userStatusSchema,
  userRoleSchema,
  createUserSchema,
  updateUserSchema,
  inviteUserSchema,
  userFiltersSchema,
  type UserStatusEnum,
  type UserRoleEnum,
  type CreateUserFormData,
  type UpdateUserFormData,
  type InviteUserFormData,
  type UserFiltersFormData,
} from './schemas/users.schema';
