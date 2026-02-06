/**
 * Sessions Service
 * Handles all session-related API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type { SessionJoinResponse, SessionStatus, ParticipantStatus } from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface Session {
  id: string;
  workspaceId: string;
  tenantId?: string; // May come from auth context - frontend extension
  domainType: string;
  externalId: string | null;
  status: SessionStatus;
  phase: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string; // Required per backend SessionResponseSchema
  participantCount: number;
  accessToken?: string; // Only returned on create
  metadata?: Record<string, unknown> | null; // Frontend extension for additional data
  createdAt: string;
  updatedAt: string;
}

export interface SessionListParams {
  workspaceId?: string;
  status?: SessionStatus;
  cursor?: string;
  limit?: number;
}

export interface CreateSessionInput {
  workspaceId: string;
  /** Role ID for role-based session configuration */
  roleId?: string;
  /** Config bundle ID for bundle-based session configuration */
  configBundleId?: string;
  /** Optional context for config composition */
  configContext?: {
    candidateId?: string;
    jobId?: string;
    participantContext?: Record<string, unknown>;
  };
  externalId?: string;
  scheduledAt?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface JoinSessionInput {
  accessToken: string;
  roleId: string;
  displayName: string;
  userId?: string;
}

export interface CursorPagination {
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SessionInviteRole {
  id: string;
  name: string;
  /** Whether this role is an observer (cannot publish audio/video) */
  isObserver: boolean;
}

export interface SessionInviteInfo {
  accessToken: string;
  roles: SessionInviteRole[];
}

export interface InviteCodeResponse {
  code: string;
  expiresAt: string;
}

export interface ExchangeCodeResponse {
  accessToken: string;
  roleId: string;
  sessionId: string;
  /** Whether the role requires authentication to join */
  requiresAuth: boolean;
}

export interface PaginatedSessionsResponse {
  sessions: Session[];
  pagination: CursorPagination;
}

// =============================================================================
// Enhanced List Types
// =============================================================================

export interface EnhancedSessionListParams {
  workspaceId?: string;
  status?: SessionStatus;
  statuses?: SessionStatus[];
  domainType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'createdAt' | 'scheduledAt' | 'startedAt' | 'status' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
}

// =============================================================================
// Participant Types
// =============================================================================

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string | null;
  roleId: string;
  displayName: string;
  status: ParticipantStatus;
  joinedAt: string | null;
  leftAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Event Types
// =============================================================================

export interface SessionEvent {
  id: string;
  sessionId: string;
  serverSeq: number;
  type: string;
  category: string;
  actorId: string | null;
  targetId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
}

// =============================================================================
// Action Types
// =============================================================================

export interface CancelSessionInput {
  reason?: string;
}

export interface ExtendSessionInput {
  expiresAt?: string;
  extendByMinutes?: number;
}

export interface DuplicateSessionInput {
  workspaceId?: string;
  externalId?: string;
  scheduledAt?: string;
  expiresInMinutes?: number;
}

// =============================================================================
// Share Link Types
// =============================================================================

export type ShareLinkStatus = 'ACTIVE' | 'DISABLED' | 'EXPIRED';

export interface ShareLink {
  id: string;
  shareId: string;
  sessionId: string;
  roleId: string;
  label: string | null;
  status: ShareLinkStatus;
  requiresAuth: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  url: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareLinkInput {
  shareId: string;
  roleId: string;
  label?: string;
  expiresAt?: string;
  maxUses?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateShareLinkInput {
  status?: 'ACTIVE' | 'DISABLED';
  label?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ResolveShareLinkResponse {
  accessToken: string;
  roleId: string;
  sessionId: string;
  requiresAuth: boolean;
}

/**
 * Backend sessions list response shape
 * The API returns { sessions: [...], pagination: {...} } after envelope extraction
 */
interface BackendSessionsListResponse {
  sessions: Session[];
  pagination: {
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// =============================================================================
// Request Options
// =============================================================================

interface RequestOptions {
  signal?: AbortSignal;
}

// =============================================================================
// Sessions Service Class
// =============================================================================

class SessionsService {
  private readonly basePath = '/v1/sessions';

  /**
   * List sessions with optional filters.
   * Returns the response structure as-is since it already matches PaginatedSessionsResponse.
   */
  async list(params: SessionListParams = {}, options?: RequestOptions): Promise<PaginatedSessionsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.workspaceId) queryParams.workspaceId = params.workspaceId;
    if (params.status) queryParams.status = params.status;
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.limit) queryParams.limit = params.limit;

    // Backend returns { sessions, pagination } after envelope extraction
    const response = await apiClient.get<BackendSessionsListResponse>(this.basePath, {
      params: queryParams,
      signal: options?.signal,
    });

    return {
      sessions: response.sessions,
      pagination: response.pagination,
    };
  }

  /**
   * Get a single session by ID.
   */
  async get(id: string, options?: RequestOptions): Promise<Session> {
    const response = await apiClient.get<{ session: Session }>(`${this.basePath}/${id}`, {
      signal: options?.signal,
    });
    return response.session;
  }

  /**
   * Create a new session.
   */
  async create(data: CreateSessionInput): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(this.basePath, data);
    return response.session;
  }

  /**
   * Join an existing session.
   * Note: Backend identifies session via accessToken in body, not path param.
   * The sessionId param is kept for caller convenience but not sent to server.
   * This is a public endpoint - authentication is via accessToken in the body.
   */
  async join(_sessionId: string, data: JoinSessionInput): Promise<SessionJoinResponse> {
    const response = await apiClient.post<{ join: SessionJoinResponse }>(
      `${this.basePath}/join`,
      data,
      { skipAuth: true } // Public endpoint, uses accessToken in body for auth
    );
    return response.join;
  }

  /**
   * Complete/end a session.
   */
  async complete(id: string): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(`${this.basePath}/${id}/complete`);
    return response.session;
  }

  /**
   * Cancel a session.
   */
  async cancel(id: string, input?: CancelSessionInput): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(
      `${this.basePath}/${id}/cancel`,
      input ?? {}
    );
    return response.session;
  }

  /**
   * Get session invite info (access token and available roles).
   * Generates a fresh access token on each call.
   */
  async getInviteInfo(id: string, options?: RequestOptions): Promise<SessionInviteInfo> {
    const response = await apiClient.get<SessionInviteInfo>(`${this.basePath}/${id}/invite-info`, {
      signal: options?.signal,
    });
    return response;
  }

  /**
   * Start a session (transition from CREATED to WAITING).
   */
  async start(id: string): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(`${this.basePath}/${id}/start`);
    return response.session;
  }

  /**
   * Create a short-lived invite code for a session.
   * The code can be safely included in URLs and exchanged for an access token.
   */
  async createInviteCode(id: string, roleId: string): Promise<InviteCodeResponse> {
    const response = await apiClient.post<InviteCodeResponse>(
      `${this.basePath}/${id}/invite-codes`,
      { roleId }
    );
    return response;
  }

  /**
   * Exchange an invite code for an access token and role ID.
   * This is called when a user opens an invite link with a code.
   */
  async exchangeCode(code: string): Promise<ExchangeCodeResponse> {
    const response = await apiClient.post<ExchangeCodeResponse>(
      `${this.basePath}/exchange-code`,
      { code },
      { skipAuth: true } // Public endpoint, no auth needed
    );
    return response;
  }

  // =============================================================================
  // Enhanced List
  // =============================================================================

  /**
   * List sessions with advanced filters and sorting.
   */
  async listEnhanced(
    params: EnhancedSessionListParams = {},
    options?: RequestOptions
  ): Promise<PaginatedSessionsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.workspaceId) queryParams.workspaceId = params.workspaceId;
    if (params.status) queryParams.status = params.status;
    if (params.statuses) queryParams.statuses = params.statuses.join(',');
    if (params.domainType) queryParams.domainType = params.domainType;
    if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params.dateTo) queryParams.dateTo = params.dateTo;
    if (params.search) queryParams.search = params.search;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.get<BackendSessionsListResponse>(
      `${this.basePath}/list`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );

    return {
      sessions: response.sessions,
      pagination: response.pagination,
    };
  }

  // =============================================================================
  // Participants
  // =============================================================================

  /**
   * List participants for a session.
   */
  async listParticipants(
    sessionId: string,
    params: { status?: ParticipantStatus; limit?: number } = {},
    options?: RequestOptions
  ): Promise<SessionParticipant[]> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params.status) queryParams.status = params.status;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.get<{ participants: SessionParticipant[] }>(
      `${this.basePath}/${sessionId}/participants`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
    return response.participants;
  }

  // =============================================================================
  // Events
  // =============================================================================

  /**
   * List events for a session.
   */
  async listEvents(
    sessionId: string,
    params: { category?: string; cursor?: string; limit?: number } = {},
    options?: RequestOptions
  ): Promise<{ events: SessionEvent[]; pagination: CursorPagination }> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params.category) queryParams.category = params.category;
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.get<{
      events: SessionEvent[];
      pagination: CursorPagination;
    }>(`${this.basePath}/${sessionId}/events`, {
      params: queryParams,
      signal: options?.signal,
    });
    return response;
  }

  // =============================================================================
  // Session Actions
  // =============================================================================

  /**
   * Cancel a session with optional reason.
   */
  async cancelWithReason(id: string, reason?: string): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(
      `${this.basePath}/${id}/cancel`,
      { reason }
    );
    return response.session;
  }

  /**
   * Extend session expiry.
   */
  async extend(
    id: string,
    input: ExtendSessionInput
  ): Promise<{ session: Session; newExpiresAt: string }> {
    const response = await apiClient.post<{ session: Session; newExpiresAt: string }>(
      `${this.basePath}/${id}/extend`,
      input
    );
    return response;
  }

  /**
   * Duplicate a session.
   */
  async duplicate(id: string, input: DuplicateSessionInput = {}): Promise<Session> {
    const response = await apiClient.post<{ session: Session }>(
      `${this.basePath}/${id}/duplicate`,
      input
    );
    return response.session;
  }

  /**
   * Delete a session (only for terminal statuses).
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // =============================================================================
  // Share Links
  // =============================================================================

  /**
   * Create a persistent share link for a session.
   * The client provides a UUID as the shareId.
   */
  async createShareLink(sessionId: string, data: CreateShareLinkInput): Promise<ShareLink> {
    const response = await apiClient.post<{ shareLink: ShareLink }>(
      `${this.basePath}/${sessionId}/share-links`,
      data
    );
    return response.shareLink;
  }

  /**
   * List all share links for a session.
   */
  async listShareLinks(sessionId: string, options?: RequestOptions): Promise<ShareLink[]> {
    const response = await apiClient.get<{ shareLinks: ShareLink[] }>(
      `${this.basePath}/${sessionId}/share-links`,
      { signal: options?.signal }
    );
    return response.shareLinks;
  }

  /**
   * Update a share link (status, label, expiry, max uses).
   */
  async updateShareLink(
    sessionId: string,
    shareId: string,
    data: UpdateShareLinkInput
  ): Promise<ShareLink> {
    const response = await apiClient.patch<{ shareLink: ShareLink }>(
      `${this.basePath}/${sessionId}/share-links/${shareId}`,
      data
    );
    return response.shareLink;
  }

  /**
   * Delete a share link permanently.
   */
  async deleteShareLink(sessionId: string, shareId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${sessionId}/share-links/${shareId}`);
  }

  /**
   * Resolve a share ID to session access credentials.
   * Public endpoint - no authentication required.
   */
  async resolveShareLink(shareId: string): Promise<ResolveShareLinkResponse> {
    const response = await apiClient.post<ResolveShareLinkResponse>(
      `${this.basePath}/share-links/resolve`,
      { shareId },
      { skipAuth: true }
    );
    return response;
  }
}

// Export singleton instance
export const sessionsService = new SessionsService();

// Re-export types for convenience
export { ApiError };
export type { SessionJoinResponse, SessionStatus, ParticipantStatus };
