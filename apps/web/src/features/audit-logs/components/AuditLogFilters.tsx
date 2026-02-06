/**
 * AuditLogFilters Component
 * Filter controls for audit logs.
 */

import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Checkbox } from '@/shared/ui';
import {
  auditActionLabels,
  auditResourceLabels,
  auditActorTypeLabels,
  type AuditAction,
  type AuditResource,
  type AuditActorType,
  type AuditLogListParams,
} from '../types/audit-logs.types';

interface AuditLogFiltersProps {
  filters: AuditLogListParams;
  onChange: (filters: AuditLogListParams) => void;
  onClear: () => void;
}

const allActions: AuditAction[] = [
  'create', 'read', 'update', 'delete', 'login', 'logout',
  'session.create', 'session.start', 'session.end', 'session.cancel',
  'recording.start', 'recording.stop', 'settings.change',
  'user.invite', 'user.remove', 'webhook.trigger',
  'api_key.create', 'api_key.revoke', 'integration.sync',
];

const allResources: AuditResource[] = [
  'tenant', 'user', 'workspace', 'domain_config', 'session',
  'participant', 'recording', 'transcript', 'webhook',
  'api_key', 'integration', 'outcome',
];

const allActorTypes: AuditActorType[] = ['user', 'api_key', 'system'];

export function AuditLogFilters({
  filters,
  onChange,
  onClear,
}: AuditLogFiltersProps) {
  const handleActionToggle = (action: AuditAction, checked: boolean) => {
    const currentActions = filters.actions || [];
    const newActions = checked
      ? [...currentActions, action]
      : currentActions.filter((a) => a !== action);
    onChange({ ...filters, actions: newActions.length > 0 ? newActions : undefined });
  };

  const handleResourceToggle = (resource: AuditResource, checked: boolean) => {
    const currentResources = filters.resources || [];
    const newResources = checked
      ? [...currentResources, resource]
      : currentResources.filter((r) => r !== resource);
    onChange({ ...filters, resources: newResources.length > 0 ? newResources : undefined });
  };

  const hasFilters =
    filters.startDate ||
    filters.endDate ||
    filters.actorType ||
    filters.actorId ||
    (filters.actions && filters.actions.length > 0) ||
    (filters.resources && filters.resources.length > 0) ||
    filters.workspaceId ||
    filters.sessionId ||
    filters.search;

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={filters.startDate || ''}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
            aria-label="Filter by start date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
            aria-label="Filter by end date"
          />
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search in metadata..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          aria-label="Search audit logs"
        />
      </div>

      {/* Actor Type */}
      <div className="space-y-2">
        <Label>Actor Type</Label>
        <div className="flex flex-wrap gap-4">
          {allActorTypes.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`actor-${type}`}
                checked={filters.actorType === type}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    actorType: checked ? type : undefined,
                  })
                }
              />
              <Label htmlFor={`actor-${type}`} className="text-sm cursor-pointer">
                {auditActorTypeLabels[type]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Label>Actions</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {allActions.map((action) => (
            <div key={action} className="flex items-center gap-2">
              <Checkbox
                id={`action-${action}`}
                checked={filters.actions?.includes(action) || false}
                onCheckedChange={(checked) => handleActionToggle(action, !!checked)}
              />
              <Label htmlFor={`action-${action}`} className="text-xs cursor-pointer truncate">
                {auditActionLabels[action]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-2">
        <Label>Resources</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {allResources.map((resource) => (
            <div key={resource} className="flex items-center gap-2">
              <Checkbox
                id={`resource-${resource}`}
                checked={filters.resources?.includes(resource) || false}
                onCheckedChange={(checked) => handleResourceToggle(resource, !!checked)}
              />
              <Label htmlFor={`resource-${resource}`} className="text-xs cursor-pointer">
                {auditResourceLabels[resource]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* IDs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workspaceId">Workspace ID</Label>
          <Input
            id="workspaceId"
            placeholder="Filter by workspace..."
            value={filters.workspaceId || ''}
            onChange={(e) => onChange({ ...filters, workspaceId: e.target.value || undefined })}
            aria-label="Filter by workspace ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sessionId">Session ID</Label>
          <Input
            id="sessionId"
            placeholder="Filter by session..."
            value={filters.sessionId || ''}
            onChange={(e) => onChange({ ...filters, sessionId: e.target.value || undefined })}
            aria-label="Filter by session ID"
          />
        </div>
      </div>

      {/* Clear Button */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
