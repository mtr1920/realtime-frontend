/**
 * Workspaces Service
 * Handles all workspace-related API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';

// =============================================================================
// Types
// =============================================================================

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  domainType: string;
  configId: string | null;
  settings: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceListParams {
  cursor?: string;
  limit?: number;
  domainType?: string;
  configId?: string;
  search?: string;
  orderBy?: 'createdAt' | 'name';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  description?: string;
  domainType: string;
  configId?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  configId?: string;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CursorPagination {
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedWorkspacesResponse {
  workspaces: Workspace[];
  pagination: CursorPagination;
}

// =============================================================================
// Request Options
// =============================================================================

interface RequestOptions {
  signal?: AbortSignal;
}

// =============================================================================
// Workspaces Service Class
// =============================================================================

class WorkspacesService {
  private readonly basePath = '/v1/workspaces';

  /**
   * List workspaces with optional filters.
   */
  async list(params: WorkspaceListParams = {}, options?: RequestOptions): Promise<PaginatedWorkspacesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.limit) queryParams.limit = params.limit;
    if (params.domainType) queryParams.domainType = params.domainType;
    if (params.configId) queryParams.configId = params.configId;
    if (params.search) queryParams.search = params.search;
    if (params.orderBy) queryParams.orderBy = params.orderBy;
    if (params.orderDirection) queryParams.orderDirection = params.orderDirection;

    return apiClient.get<PaginatedWorkspacesResponse>(this.basePath, {
      params: queryParams,
      signal: options?.signal,
    });
  }

  /**
   * Get a single workspace by ID.
   */
  async get(id: string, options?: RequestOptions): Promise<Workspace> {
    const response = await apiClient.get<{ workspace: Workspace }>(`${this.basePath}/${id}`, {
      signal: options?.signal,
    });
    return response.workspace;
  }

  /**
   * Create a new workspace.
   */
  async create(data: CreateWorkspaceInput): Promise<Workspace> {
    const response = await apiClient.post<{ workspace: Workspace }>(this.basePath, data);
    return response.workspace;
  }

  /**
   * Update an existing workspace.
   */
  async update(id: string, data: UpdateWorkspaceInput): Promise<Workspace> {
    const response = await apiClient.patch<{ workspace: Workspace }>(`${this.basePath}/${id}`, data);
    return response.workspace;
  }

  /**
   * Delete a workspace.
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
export const workspacesService = new WorkspacesService();

// Re-export ApiError for convenience
export { ApiError };
