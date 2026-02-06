/**
 * User Management Types
 * Type definitions for user CRUD operations.
 */

import type { UserRole } from '@/types';

// =============================================================================
// User Status
// =============================================================================

/**
 * User account status values.
 */
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

// =============================================================================
// User Entity
// =============================================================================

/**
 * Full user entity from API.
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  metadata: Record<string, unknown> | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Parameters for listing users.
 */
export interface UserListParams {
  status?: UserStatus;
  email?: string;
  search?: string;
  role?: UserRole;
  orderBy?: 'email' | 'name' | 'createdAt' | 'lastLoginAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Cursor-based pagination info.
 */
export interface CursorPagination {
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Paginated users response.
 */
export interface PaginatedUsersResponse {
  users: User[];
  pagination: CursorPagination;
}

/**
 * Input for creating a new user.
 */
export interface CreateUserInput {
  email: string;
  name?: string;
  role: UserRole;
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating an existing user.
 */
export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Input for inviting a new user.
 */
export interface InviteUserInput {
  email: string;
  role: UserRole;
}
