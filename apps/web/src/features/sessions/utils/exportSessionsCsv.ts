/**
 * Export Sessions to CSV
 * Utility function to export sessions data to CSV format.
 */

import type { Session } from '../api/sessions.service';

/**
 * Export sessions to CSV format and download.
 */
export function exportSessionsToCsv(sessions: Session[]): void {
  const headers = [
    'ID',
    'External ID',
    'Status',
    'Workspace ID',
    'Domain Type',
    'Scheduled At',
    'Started At',
    'Ended At',
    'Expires At',
    'Participant Count',
    'Created At',
    'Updated At',
  ];

  const rows = sessions.map((session) => [
    session.id,
    session.externalId ?? '',
    session.status,
    session.workspaceId,
    session.domainType,
    session.scheduledAt ?? '',
    session.startedAt ?? '',
    session.endedAt ?? '',
    session.expiresAt,
    session.participantCount.toString(),
    session.createdAt,
    session.updatedAt,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
