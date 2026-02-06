/**
 * Users Service
 * Handles all user management API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  User,
  UserListParams,
  PaginatedUsersResponse,
  CreateUserInput,
  UpdateUserInput,
} from '../types/users.types';

// =============================================================================
// Request Options
// =============================================================================

interface RequestOptions {
  signal?: AbortSignal;
}

// =============================================================================
// Users Service Class
// =============================================================================

class UsersService {
  private readonly basePath = '/v1/users';

  /**
   * List users with optional filters.
   */
  async list(params: UserListParams = {}, options?: RequestOptions): Promise<PaginatedUsersResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.status) queryParams.status = params.status;
    if (params.email) queryParams.email = params.email;
    if (params.search) queryParams.search = params.search;
    if (params.role) queryParams.role = params.role;
    if (params.orderBy) queryParams.orderBy = params.orderBy;
    if (params.orderDirection) queryParams.orderDirection = params.orderDirection;
    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    return apiClient.get<PaginatedUsersResponse>(this.basePath, {
      params: queryParams,
      signal: options?.signal,
    });
  }

  /**
   * Get a single user by ID.
   */
  async get(id: string, options?: RequestOptions): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`${this.basePath}/${id}`, {
      signal: options?.signal,
    });
    return response.user;
  }

  /**
   * Create a new user.
   */
  async create(data: CreateUserInput): Promise<User> {
    const response = await apiClient.post<{ user: User }>(this.basePath, data);
    return response.user;
  }

  /**
   * Update an existing user.
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    const response = await apiClient.patch<{ user: User }>(`${this.basePath}/${id}`, data);
    return response.user;
  }

  /**
   * Soft delete a user.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Invite a user (create with PENDING status).
   * This is a convenience method that creates a user with invitation workflow.
   */
  async invite(email: string, role: CreateUserInput['role']): Promise<User> {
    return this.create({
      email,
      role,
    });
  }

  /**
   * Resend invite to a pending user.
   * Only works for users with PENDING status.
   */
  async resendInvite(id: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`${this.basePath}/${id}/resend-invite`);
  }
}

// Export singleton instance
export const usersService = new UsersService();

// Re-export types and ApiError for convenience
export { ApiError };
export type {
  User,
  UserStatus,
  UserListParams,
  PaginatedUsersResponse,
  CreateUserInput,
  UpdateUserInput,
} from '../types/users.types';
