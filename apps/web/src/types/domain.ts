/**
 * Domain Types
 * Core business entities shared across features.
 * Single source of truth for domain models.
 */

// =============================================================================
// User & Roles
// =============================================================================

/**
 * User roles within a tenant.
 * Ordered by permission level (highest to lowest).
 */
export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/**
 * Role hierarchy ordered from lowest to highest permission level.
 * Used for role comparison operations (hasMinRole, etc.)
 * Single source of truth - do not duplicate this array elsewhere.
 */
export const ROLE_HIERARCHY: readonly UserRole[] = [
  'VIEWER',
  'MEMBER',
  'ADMIN',
  'OWNER',
] as const;

/**
 * Core user entity used throughout the application.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tenantId: string;
  role: UserRole;
}

// =============================================================================
// Theme & UI
// =============================================================================

/**
 * Available theme options.
 */
export type Theme = 'light' | 'dark' | 'system' | 'high-contrast';

/**
 * Resolved theme after system preference resolution.
 */
export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

/**
 * System color scheme preference.
 */
export type SystemColorScheme = 'light' | 'dark';

// =============================================================================
// Session
// =============================================================================

/**
 * Session status values.
 */
export type SessionStatus =
  | 'CREATED'
  | 'WAITING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED';

/**
 * Participant status in a session.
 */
export type ParticipantStatus =
  | 'INVITED'
  | 'JOINING'
  | 'ACTIVE'
  | 'RECONNECTING'
  | 'LEFT'
  | 'REMOVED';

/**
 * Session participant entity.
 */
export interface Participant {
  id: string;
  userId: string;
  sessionId: string;
  displayName: string;
  roleId: string;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
}

// =============================================================================
// Media
// =============================================================================

/**
 * Media device information.
 */
export interface MediaDevice {
  deviceId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
}

/**
 * Media track state.
 */
export interface MediaTrack {
  id: string;
  kind: 'audio' | 'video';
  enabled: boolean;
  muted: boolean;
}

// =============================================================================
// Permissions
// =============================================================================

/**
 * Available permissions for role-based access control.
 */
export type Permission =
  // Session permissions
  | 'canViewSessions'
  | 'canCreateSession'
  | 'canStartSession'
  | 'canJoinSession'
  | 'canEndSession'
  | 'canDeleteSession'
  // User management permissions
  | 'canViewUsers'
  | 'canInviteUsers'
  | 'canManageUsers'
  | 'canRemoveUsers'
  // Workspace/Tenant permissions
  | 'canViewWorkspace'
  | 'canEditWorkspace'
  | 'canManageWorkspace'
  | 'canDeleteWorkspace'
  // Recording/Transcript permissions
  | 'canViewRecordings'
  | 'canDownloadRecordings'
  | 'canDeleteRecordings'
  | 'canViewOutcomes'
  | 'canDownloadOutcomes'
  | 'canManageOutcomes'
  | 'canViewCompliance'
  // AI permissions
  | 'canUseAI'
  | 'canConfigureAI'
  // Admin permissions
  | 'canAccessAdmin'
  | 'canViewAuditLogs'
  | 'canManageDomainConfigs'
  | 'canManageBilling'
  | 'canManageIntegrations';
