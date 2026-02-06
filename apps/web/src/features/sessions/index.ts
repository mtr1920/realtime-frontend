/**
 * Sessions Feature
 * Public exports for the sessions module.
 */

// API Service
export {
  sessionsService,
  type Session,
  type SessionStatus,
  type SessionListParams,
  type CreateSessionInput,
  type JoinSessionInput,
  type SessionJoinResponse,
  type PaginatedSessionsResponse,
  type CursorPagination,
  type SessionInviteInfo,
  type SessionInviteRole,
  type InviteCodeResponse,
  type ExchangeCodeResponse,
  // Enhanced types
  type EnhancedSessionListParams,
  type ParticipantStatus as ApiParticipantStatus,
  type SessionParticipant,
  type SessionEvent as SessionEventApi,
  type CancelSessionInput,
  type ExtendSessionInput,
  type DuplicateSessionInput,
  // Share link types
  type ShareLink,
  type ShareLinkStatus,
  type CreateShareLinkInput,
  type UpdateShareLinkInput,
  type ResolveShareLinkResponse,
} from './api/sessions.service';

// Hooks
export { useSessions, useInfiniteSessions } from './hooks/useSessions';
export { useSession } from './hooks/useSession';
export { useCreateSession } from './hooks/useCreateSession';
export { useCompleteSession } from './hooks/useCompleteSession';
export { useStartSession } from './hooks/useStartSession';
export { useJoinSession } from './hooks/useJoinSession';
export { useSessionInviteInfo } from './hooks/useSessionInviteInfo';
export { useSessionConfig, type SessionConfigResult } from './hooks/useSessionConfig';
export { useRoleConfig, type UseRoleConfigResult } from './hooks/useRoleConfig';
export {
  useSessionPermissions,
  SessionPermissionGate,
  type SessionPermission,
  type SessionPermissionsResult,
  type SessionPermissionGateProps,
} from './hooks/useSessionPermissions';
export { useDevicePermissions, type DevicePermissionsResult } from './hooks/useDevicePermissions';
export { useSessionsListState } from './hooks/useSessionsListState';
export {
  useShareLinks,
  useCreateShareLink,
  useUpdateShareLink,
  useDeleteShareLink,
} from './hooks/useShareLinks';
// Session detail hooks
export { useSessionParticipants } from './hooks/useSessionParticipants';
export { useSessionEvents } from './hooks/useSessionEvents';
export { useSessionRecordings } from './hooks/useSessionRecordings';
export { useSessionOutcome } from './hooks/useSessionOutcome';
// Session room hooks
export {
  useSessionSubscriptions,
  type UseSessionSubscriptionsOptions,
  type UseSessionSubscriptionsResult,
} from './hooks/useSessionSubscriptions';
export {
  useSessionReady,
  type UseSessionReadyOptions,
} from './hooks/useSessionReady';
export {
  useSessionConnection,
  type UseSessionConnectionOptions,
} from './hooks/useSessionConnection';
// Lobby hooks
export { useCodeExchange } from './hooks/useCodeExchange';
export { useLobbyAuthRedirect } from './hooks/useLobbyAuthRedirect';
// Media permissions hook
export { useMediaPermissions } from './hooks/useMediaPermissions';

// Components - Shared
export { SessionStatusBadge, CopyInviteLinkButton } from './components/shared';

// List Components
export {
  SessionCard,
  SessionFilters,
  SessionsStatsHeader,
  SessionsBulkActions,
  exportSessionsToCsv,
  // Shared DataTable components
  SessionsSharedDataTable,
  createSessionsColumns,
  sessionStatusOptions,
  createSessionRowActions,
  type SessionsSharedDataTableProps,
  type SessionRowActionHandlers,
} from './components/list';

// Export utilities
export { sessionExportColumns } from './utils/sessionExportColumns';

// Detail Components
export {
  SessionStatusTimeline,
  SessionOverviewTab,
  SessionParticipantsTab,
  SessionConfigurationTab,
  SessionActivityTab,
  SessionRecordingsTab,
  SessionOutcomesTab,
  ShareLinksTab,
  CreateShareLinkDialog,
  type Participant,
  type ParticipantStatus,
  type SessionEvent,
  type EventType,
  type Recording,
  type RecordingStatus,
  type RecordingKind,
  type SessionOutcome,
  type OutcomeStatus,
} from './components/detail';

// Action Dialogs
export {
  CreateSessionDialog,
  CancelSessionDialog,
  DeleteSessionDialog,
  ExtendSessionDialog,
  DuplicateSessionDialog,
  type DuplicateOptions,
} from './components/actions';

// Lobby Components
export {
  DeviceCheckPanel,
  MediaPreview,
  ConsentPanel,
  JoinPanel,
  SessionErrorState,
} from './components/lobby';

// API Services
export {
  outcomesService,
  type SessionOutcomeResponse,
  type OutcomeStatus as ApiOutcomeStatus,
  type OutcomeSummary,
  type OutcomeEvaluation,
  type OutcomeDecision,
  type OutcomeIntegrity,
  type BackendCriteriaScore,
} from './api/outcomes.service';

// Utilities
export {
  SESSION_ERROR_CODES,
  isSessionExpiredError,
  isSessionInvalidStatusError,
  isSessionNotFoundError,
  isSessionFullError,
  isSessionAccessDeniedError,
  getSessionErrorType,
  getSessionErrorMessage,
  isSessionSpecificError,
  type SessionErrorCode,
  type SessionErrorType,
} from './utils/sessionErrors';

// Room Components
export {
  SessionLayout,
  ParticipantList,
  SessionTimer,
  SessionControls,
  FacilitatorControls,
  SessionLoadingSkeleton,
} from './components/room';

// Schemas
export {
  sessionStatusSchema,
  createSessionSchema,
  joinSessionSchema,
  sessionFiltersSchema,
  type SessionStatusEnum,
  type CreateSessionFormData,
  type JoinSessionFormData,
  type SessionFiltersFormData,
} from './schemas/session.schema';
