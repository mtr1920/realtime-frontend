/**
 * FacilitatorControls
 *
 * Controls for session facilitators (end session, pause, recording, etc.)
 * Only visible to participants with appropriate permissions.
 */

import { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Square,
  Pause,
  Play,
  Circle,
  UserMinus,
  Settings,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionPermissions } from '../../hooks/useSessionPermissions';
import { useSessionConfig } from '../../hooks/useSessionConfig';
import { useSessionStore } from '@/shared/stores/session.store';
import { useSend } from '@/features/realtime/hooks/useWebSocket';

export interface FacilitatorControlsProps {
  /** Called when end session is requested */
  onEndSession?: () => void;

  /** Called when pause session is requested */
  onPauseSession?: () => void;

  /** Called when resume session is requested */
  onResumeSession?: () => void;

  /** Called when recording toggle is requested */
  onToggleRecording?: () => void;

  /** Whether an action is in progress */
  isLoading?: boolean;

  /** Additional CSS class */
  className?: string;
}

export function FacilitatorControls({
  onEndSession,
  onPauseSession,
  onResumeSession,
  onToggleRecording,
  isLoading = false,
  className,
}: FacilitatorControlsProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);

  const { canEndSession, canStartRecording, isFacilitator } =
    useSessionPermissions();
  const { isRecordingEnabled } = useSessionConfig();
  const sessionStatus = useSessionStore((state) => state.status);

  const isPaused = sessionStatus === 'paused';

  const handleEndSession = useCallback(() => {
    setShowEndDialog(false);
    onEndSession?.();
  }, [onEndSession]);

  // Only show if user is a facilitator
  if (!isFacilitator) {
    return null;
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Recording Control */}
        {canStartRecording && isRecordingEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleRecording}
            disabled={isLoading}
            className="gap-2"
          >
            <Circle className="h-3 w-3 text-red-500 fill-red-500" />
            Recording
          </Button>
        )}

        {/* Pause/Resume */}
        {canEndSession && (
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? onResumeSession : onPauseSession}
            disabled={isLoading}
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        )}

        {/* End Session */}
        {canEndSession && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowEndDialog(true)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            End Session
          </Button>
        )}

        {/* More Options */}
        <FacilitatorMenu isLoading={isLoading} />
      </div>

      {/* End Session Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              End Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end the session for all participants. Any unsaved data
              will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// Facilitator Menu Component
// =============================================================================

interface FacilitatorMenuProps {
  isLoading?: boolean;
}

function FacilitatorMenu({ isLoading }: FacilitatorMenuProps) {
  const { canRemoveParticipants, canStartRecording } = useSessionPermissions();
  // Select both values with useShallow to prevent unnecessary re-renders
  const { participantsMap, localParticipantId } = useSessionStore(
    useShallow((state) => ({
      participantsMap: state.participants,
      localParticipantId: state.localParticipantId,
    }))
  );
  const send = useSend();

  // Derive the participants array from the Map - useMemo ensures stable reference
  const participants = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap]
  );

  const otherParticipants = useMemo(
    () => participants.filter((p) => p.id !== localParticipantId),
    [participants, localParticipantId]
  );

  // Handler for removing a participant
  const handleRemoveParticipant = useCallback(
    (participantId: string) => {
      send('session.participant.kick', {
        participantId,
        reason: 'Removed by facilitator',
      });
    },
    [send]
  );

  if (!canRemoveParticipants && !canStartRecording) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isLoading}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Session settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canRemoveParticipants && otherParticipants.length > 0 && (
          <>
            <DropdownMenuLabel>Participants</DropdownMenuLabel>
            {otherParticipants.map((participant) => (
              <DropdownMenuItem
                key={participant.id}
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => handleRemoveParticipant(participant.id)}
              >
                <UserMinus className="h-4 w-4" />
                Remove {participant.displayName}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>Session Settings</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          Configure Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
