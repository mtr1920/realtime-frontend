/**
 * API Types
 * Request/Response types for API communication.
 * Mirrors backend contract definitions.
 */

import type { UserRole, SessionStatus } from './domain';

// =============================================================================
// Authentication
// =============================================================================

/**
 * User data returned from auth endpoints.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
  role: UserRole;
}

/**
 * Login request credentials.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  tenantId: string;
}

/**
 * Login response with tokens.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

/**
 * Token refresh response.
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * Current user info response.
 * Returns full user data for authenticated user.
 */
export interface CurrentUserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tenantId: string;
  role: UserRole;
}

// =============================================================================
// Sessions
// =============================================================================

/**
 * Session join request for obtaining realtime token.
 */
export interface SessionJoinRequest {
  /** Session access token */
  accessToken: string;
  /** Role joining as */
  roleId: string;
  /** Display name in session */
  displayName: string;
  /** Optional authenticated user ID */
  userId?: string;
}

/**
 * Session join response with realtime token for WebSocket connection.
 * Matches backend contracts/api/sessions.ts JoinSessionResponseSchema
 */
export interface SessionJoinResponse {
  /** Session ID */
  sessionId: string;
  /** Participant ID assigned to this connection */
  participantId: string;
  /** Short-lived JWT for WebSocket authentication */
  realtimeToken: string;
  /** ISO datetime when realtime token expires */
  expiresAt: string;
  /** WebSocket endpoint URL */
  wsEndpoint: string;
}

/**
 * Session creation request.
 * Matches backend contracts/api/sessions.ts CreateSessionRequestSchema
 */
export interface CreateSessionRequest {
  workspaceId: string;
  externalId?: string;
  scheduledAt?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Session response from API.
 * Matches backend contracts/api/sessions.ts SessionResponseSchema
 */
export interface SessionResponse {
  id: string;
  workspaceId: string;
  domainType: string;
  configBundleId: string | null;
  status: SessionStatus;
  phase: string | null;
  accessToken?: string; // Only returned on create
  externalId: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Cursor-based pagination query parameters.
 * Matches backend contracts/api/common.ts PaginationQuerySchema
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * Extended pagination with ordering.
 * Matches backend contracts/api/common.ts OrderedPaginationQuerySchema
 */
export interface OrderedPaginationParams extends PaginationParams {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Cursor-based paginated response wrapper.
 * Matches backend contracts/api/common.ts PaginatedResponseSchema
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// =============================================================================
// Common
// =============================================================================

/**
 * Standard API error response.
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Standard success response for mutations.
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}
