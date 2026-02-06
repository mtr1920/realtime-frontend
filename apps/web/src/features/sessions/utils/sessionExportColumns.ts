/**
 * Session Export Columns
 *
 * Defines the column structure for exporting sessions to CSV/Excel.
 */

import type { ExportColumn } from '@realtime/ui/utils';
import type { Session } from '../api/sessions.service';

/**
 * Export column definitions for sessions data
 */
export const sessionExportColumns: ExportColumn<Session>[] = [
  { header: 'ID', accessor: 'id' },
  { header: 'External ID', accessor: (row) => row.externalId ?? '' },
  { header: 'Status', accessor: 'status' },
  { header: 'Workspace ID', accessor: 'workspaceId' },
  { header: 'Domain Type', accessor: 'domainType' },
  { header: 'Scheduled At', accessor: (row) => row.scheduledAt ?? '' },
  { header: 'Started At', accessor: (row) => row.startedAt ?? '' },
  { header: 'Ended At', accessor: (row) => row.endedAt ?? '' },
  { header: 'Expires At', accessor: 'expiresAt' },
  { header: 'Participant Count', accessor: (row) => String(row.participantCount) },
  { header: 'Created At', accessor: 'createdAt' },
  { header: 'Updated At', accessor: 'updatedAt' },
];
