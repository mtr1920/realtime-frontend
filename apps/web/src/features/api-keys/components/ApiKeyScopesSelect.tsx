/**
 * ApiKeyScopesSelect Component
 * Multi-select component for choosing API key scopes.
 */

import { useState, useCallback } from 'react';
import { Checkbox } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Button } from '@/shared/ui';
import {
  type ApiKeyScope,
  apiKeyScopeLabels,
  apiKeyScopeGroups,
} from '../types/api-keys.types';

interface ApiKeyScopesSelectProps {
  value: ApiKeyScope[];
  onChange: (scopes: ApiKeyScope[]) => void;
  disabled?: boolean;
  error?: string;
}

export function ApiKeyScopesSelect({
  value,
  onChange,
  disabled = false,
  error,
}: ApiKeyScopesSelectProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['sessions', 'users', 'workspaces', 'data', 'admin'])
  );

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const toggleScope = useCallback(
    (scope: ApiKeyScope) => {
      if (value.includes(scope)) {
        onChange(value.filter((s) => s !== scope));
      } else {
        onChange([...value, scope]);
      }
    },
    [value, onChange]
  );

  const selectAllInGroup = useCallback(
    (groupScopes: ApiKeyScope[]) => {
      const allSelected = groupScopes.every((s) => value.includes(s));
      if (allSelected) {
        onChange(value.filter((s) => !groupScopes.includes(s)));
      } else {
        const newScopes = [...value];
        groupScopes.forEach((s) => {
          if (!newScopes.includes(s)) {
            newScopes.push(s);
          }
        });
        onChange(newScopes);
      }
    },
    [value, onChange]
  );

  const selectAll = useCallback(() => {
    const allScopes = Object.values(apiKeyScopeGroups).flat();
    if (allScopes.every((s) => value.includes(s))) {
      onChange([]);
    } else {
      onChange(allScopes);
    }
  }, [value, onChange]);

  const allScopes = Object.values(apiKeyScopeGroups).flat();
  const allSelected = allScopes.every((s) => value.includes(s));

  const groupLabels: Record<string, string> = {
    sessions: 'Sessions',
    users: 'Users',
    workspaces: 'Workspaces',
    data: 'Data & Reports',
    admin: 'Administration',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Scopes</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={selectAll}
          disabled={disabled}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        {Object.entries(apiKeyScopeGroups).map(([groupName, groupScopes]) => {
          const isExpanded = expandedGroups.has(groupName);
          const groupSelected = groupScopes.filter((s) => value.includes(s)).length;
          const allGroupSelected = groupSelected === groupScopes.length;
          const someGroupSelected = groupSelected > 0 && !allGroupSelected;

          return (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                  onClick={() => toggleGroup(groupName)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${groupLabels[groupName]} scopes`}
                >
                  <span className="text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  {groupLabels[groupName]}
                </button>
                <span className="text-xs text-muted-foreground">
                  ({groupSelected}/{groupScopes.length})
                </span>
                <button
                  type="button"
                  className="ml-auto text-xs text-primary hover:underline"
                  onClick={() => selectAllInGroup(groupScopes)}
                  disabled={disabled}
                >
                  {allGroupSelected ? 'Deselect' : someGroupSelected ? 'Select All' : 'Select All'}
                </button>
              </div>

              {isExpanded && (
                <div className="ml-4 grid gap-2 sm:grid-cols-2">
                  {groupScopes.map((scope) => (
                    <div key={scope} className="flex items-center gap-2">
                      <Checkbox
                        id={`scope-${scope}`}
                        checked={value.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                        disabled={disabled}
                        aria-describedby={error ? 'scopes-error' : undefined}
                      />
                      <Label
                        htmlFor={`scope-${scope}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {apiKeyScopeLabels[scope]}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p id="scopes-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
