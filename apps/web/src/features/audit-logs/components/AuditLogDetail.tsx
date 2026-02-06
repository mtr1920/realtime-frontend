/**
 * AuditLogDetail Component
 * Shows detailed information about a single audit log.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { Label } from '@/shared/ui';
import {
  auditActionLabels,
  auditResourceLabels,
  auditActorTypeLabels,
  type AuditLog,
} from '../types/audit-logs.types';

interface AuditLogDetailProps {
  auditLog: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetail({
  auditLog,
  open,
  onOpenChange,
}: AuditLogDetailProps) {
  if (!auditLog) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return '-';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            {formatDate(auditLog.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action & Resource */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Action</Label>
              <div>
                <Badge>
                  {auditActionLabels[auditLog.action] || auditLog.action}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Resource</Label>
              <p className="font-medium">
                {auditResourceLabels[auditLog.resource] || auditLog.resource}
              </p>
            </div>
          </div>

          {/* Resource Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Resource ID</Label>
              <p className="font-mono text-sm break-all">{auditLog.resourceId}</p>
            </div>
            {auditLog.resourceName && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">Resource Name</Label>
                <p className="text-sm">{auditLog.resourceName}</p>
              </div>
            )}
          </div>

          {/* Actor Information */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Actor</Label>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">
                    {auditActorTypeLabels[auditLog.actor.type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-mono break-all">{auditLog.actor.id}</p>
                </div>
              </div>
              {auditLog.actor.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{auditLog.actor.email}</p>
                </div>
              )}
              {auditLog.actor.name && (
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm">{auditLog.actor.name}</p>
                </div>
              )}
              {auditLog.actor.ip && (
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono">{auditLog.actor.ip}</p>
                </div>
              )}
              {auditLog.actor.userAgent && (
                <div>
                  <p className="text-xs text-muted-foreground">User Agent</p>
                  <p className="text-sm break-all">{auditLog.actor.userAgent}</p>
                </div>
              )}
            </div>
          </div>

          {/* Context IDs */}
          {(auditLog.workspaceId || auditLog.sessionId) && (
            <div className="grid grid-cols-2 gap-4">
              {auditLog.workspaceId && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Workspace ID</Label>
                  <p className="font-mono text-sm break-all">{auditLog.workspaceId}</p>
                </div>
              )}
              {auditLog.sessionId && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Session ID</Label>
                  <p className="font-mono text-sm break-all">{auditLog.sessionId}</p>
                </div>
              )}
            </div>
          )}

          {/* Changes */}
          {auditLog.changes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Changes</Label>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {auditLog.changes.before && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Before</p>
                    <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
                      {formatJson(auditLog.changes.before)}
                    </pre>
                  </div>
                )}
                {auditLog.changes.after && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">After</p>
                    <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
                      {formatJson(auditLog.changes.after)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {auditLog.metadata && Object.keys(auditLog.metadata).length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Metadata</Label>
              <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
                {formatJson(auditLog.metadata)}
              </pre>
            </div>
          )}

          {/* Request ID */}
          <div className="space-y-1">
            <Label className="text-muted-foreground">Request ID</Label>
            <p className="font-mono text-sm break-all">{auditLog.requestId}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
