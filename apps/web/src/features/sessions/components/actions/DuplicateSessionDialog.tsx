/**
 * Duplicate Session Dialog
 * Dialog for duplicating a session with options.
 */

import { useState } from 'react';
import { CopyPlus, Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Switch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

interface DuplicateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  currentWorkspaceId: string;
  workspaces?: { id: string; name: string }[];
  onConfirm: (options: DuplicateOptions) => Promise<void>;
}

export interface DuplicateOptions {
  workspaceId: string;
  scheduleForLater: boolean;
  scheduledAt?: string;
}

export function DuplicateSessionDialog({
  open,
  onOpenChange,
  sessionId,
  currentWorkspaceId,
  workspaces = [],
  onConfirm,
}: DuplicateSessionDialogProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState(currentWorkspaceId);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default to current workspace if none provided
  const availableWorkspaces =
    workspaces.length > 0 ? workspaces : [{ id: currentWorkspaceId, name: 'Current Workspace' }];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      let scheduledAt: string | undefined;

      if (scheduleForLater && scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      await onConfirm({
        workspaceId: selectedWorkspace,
        scheduleForLater,
        scheduledAt,
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedWorkspace(currentWorkspaceId);
    setScheduleForLater(false);
    setScheduledDate('');
    setScheduledTime('');
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CopyPlus className="h-5 w-5" />
            Duplicate Session
          </DialogTitle>
          <DialogDescription>
            Create a copy of session{' '}
            <span className="font-mono">{sessionId.slice(0, 8)}</span> with the same
            configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger id="workspace">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                    {ws.id === currentWorkspaceId && ' (current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The duplicate session will be created in this workspace.
            </p>
          </div>

          {/* Schedule Option */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schedule-later" className="cursor-pointer">
                  Schedule for later
                </Label>
                <p className="text-xs text-muted-foreground">
                  Set a specific start time for the new session.
                </p>
              </div>
              <Switch
                id="schedule-later"
                checked={scheduleForLater}
                onCheckedChange={setScheduleForLater}
              />
            </div>

            {scheduleForLater && (
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    min={today}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <div className="text-sm font-medium">New session will be created with:</div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Same configuration and settings</li>
              <li>Same domain type and role</li>
              <li>New session ID</li>
              <li>Status: {scheduleForLater ? 'Scheduled' : 'Created'}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || (scheduleForLater && (!scheduledDate || !scheduledTime))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CopyPlus className="mr-2 h-4 w-4" />
                Create Duplicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
