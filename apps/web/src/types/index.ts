/**
 * Types Index
 * Centralized exports for all shared types.
 */

// Domain types - core business entities
export type {
  UserRole,
  User,
  Theme,
  ResolvedTheme,
  SystemColorScheme,
  SessionStatus,
  ParticipantStatus,
  Participant,
  MediaDevice,
  MediaTrack,
  Permission,
} from './domain';

// Domain constants
export { ROLE_HIERARCHY } from './domain';

// API types - request/response contracts
export type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  CurrentUserResponse,
  SessionJoinRequest,
  SessionJoinResponse,
  CreateSessionRequest,
  SessionResponse,
  PaginationParams,
  OrderedPaginationParams,
  PaginatedResponse,
  ApiErrorResponse,
  SuccessResponse,
} from './api';
