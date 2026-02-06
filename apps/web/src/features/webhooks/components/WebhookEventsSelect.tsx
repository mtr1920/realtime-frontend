/**
 * WebhookEventsSelect Component
 * Multi-select component for choosing webhook events.
 */

import { useState, useCallback } from 'react';
import { Checkbox } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Button } from '@/shared/ui';
import {
  type WebhookEvent,
  webhookEventLabels,
  webhookEventGroups,
} from '../types/webhooks.types';

interface WebhookEventsSelectProps {
  value: WebhookEvent[];
  onChange: (events: WebhookEvent[]) => void;
  disabled?: boolean;
  error?: string;
}

export function WebhookEventsSelect({
  value,
  onChange,
  disabled = false,
  error,
}: WebhookEventsSelectProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['session', 'participant', 'recording', 'outcome'])
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

  const toggleEvent = useCallback(
    (event: WebhookEvent) => {
      if (value.includes(event)) {
        onChange(value.filter((e) => e !== event));
      } else {
        onChange([...value, event]);
      }
    },
    [value, onChange]
  );

  const selectAllInGroup = useCallback(
    (groupEvents: WebhookEvent[]) => {
      const allSelected = groupEvents.every((e) => value.includes(e));
      if (allSelected) {
        onChange(value.filter((e) => !groupEvents.includes(e)));
      } else {
        const newEvents = [...value];
        groupEvents.forEach((e) => {
          if (!newEvents.includes(e)) {
            newEvents.push(e);
          }
        });
        onChange(newEvents);
      }
    },
    [value, onChange]
  );

  const selectAll = useCallback(() => {
    const allEvents = Object.values(webhookEventGroups).flat();
    if (allEvents.every((e) => value.includes(e))) {
      onChange([]);
    } else {
      onChange(allEvents);
    }
  }, [value, onChange]);

  const allEvents = Object.values(webhookEventGroups).flat();
  const allSelected = allEvents.every((e) => value.includes(e));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Events</Label>
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
        {Object.entries(webhookEventGroups).map(([groupName, groupEvents]) => {
          const isExpanded = expandedGroups.has(groupName);
          const groupSelected = groupEvents.filter((e) => value.includes(e)).length;
          const allGroupSelected = groupSelected === groupEvents.length;
          const someGroupSelected = groupSelected > 0 && !allGroupSelected;

          return (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium capitalize hover:text-primary"
                  onClick={() => toggleGroup(groupName)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${groupName} events`}
                >
                  <span className="text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  {groupName}
                </button>
                <span className="text-xs text-muted-foreground">
                  ({groupSelected}/{groupEvents.length})
                </span>
                <button
                  type="button"
                  className="ml-auto text-xs text-primary hover:underline"
                  onClick={() => selectAllInGroup(groupEvents)}
                  disabled={disabled}
                >
                  {allGroupSelected ? 'Deselect' : someGroupSelected ? 'Select All' : 'Select All'}
                </button>
              </div>

              {isExpanded && (
                <div className="ml-4 grid gap-2 sm:grid-cols-2">
                  {groupEvents.map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <Checkbox
                        id={`event-${event}`}
                        checked={value.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                        disabled={disabled}
                        aria-describedby={error ? 'events-error' : undefined}
                      />
                      <Label
                        htmlFor={`event-${event}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {webhookEventLabels[event]}
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
        <p id="events-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
