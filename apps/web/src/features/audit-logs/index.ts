/**
 * Audit Logs Feature
 * Public exports for the audit log management module.
 */

// Types
export {
  auditActionLabels,
  auditResourceLabels,
  auditActorTypeLabels,
  type AuditLog,
  type AuditAction,
  type AuditResource,
  type AuditActorType,
  type AuditActor,
  type AuditChanges,
  type AuditLogListParams,
  type PaginatedAuditLogsResponse,
  type AuditLogCountResponse,
  type ExportFormat,
  type ExportAuditLogsInput,
} from './types/audit-logs.types';

// Schemas
export {
  auditActionSchema,
  auditResourceSchema,
  auditActorTypeSchema,
  exportFormatSchema,
  auditLogFiltersSchema,
  exportAuditLogsSchema,
  type AuditActionEnum,
  type AuditResourceEnum,
  type AuditActorTypeEnum,
  type ExportFormatEnum,
  type AuditLogFiltersFormData,
  type ExportAuditLogsFormData,
} from './schemas/audit-logs.schema';

// API Service
export { auditLogsService } from './api/audit-logs.service';

// Hooks
export { useAuditLogs } from './hooks/useAuditLogs';
export { useAuditLog } from './hooks/useAuditLog';
export { useAuditLogCount } from './hooks/useAuditLogCount';
export { useExportAuditLogs } from './hooks/useExportAuditLogs';

// Components
export { AuditLogTable } from './components/AuditLogTable';
export { AuditLogFilters } from './components/AuditLogFilters';
export { AuditLogDetail } from './components/AuditLogDetail';
export { AuditLogPagination } from './components/AuditLogPagination';
export { ExportDialog } from './components/ExportDialog';
