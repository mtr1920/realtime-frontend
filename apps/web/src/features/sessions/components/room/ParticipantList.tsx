/**
 * ParticipantList
 *
 * Enhanced participant list with polished UI:
 * - Larger avatars with gradient fallback
 * - Animated status dots (pulse for speaking)
 * - Role badges (Host, Observer)
 * - Hover actions (message, pin)
 */

import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Crown,
  Eye,
  MessageSquare,
  Pin,
  Loader2,
} from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  ScrollArea,
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionStore } from '@/shared/stores/session.store';
import { useWebSocket } from '@/features/realtime';
import { useRoleConfig } from '../../hooks/useRoleConfig';
import {
  ParticipantActionsProvider,
  useParticipantActions,
} from './ParticipantActionsContext';
import type { Participant, ConnectionState } from '@protocol/index';

export interface ParticipantListProps {
  /** Maximum height of the list */
  maxHeight?: string;

  /** Whether to show compact view */
  compact?: boolean;

  /** Called when a participant is pinned */
  onPin?: (participantId: string) => void;

  /** Called when messaging a participant */
  onMessage?: (participantId: string) => void;

  /** Additional CSS class */
  className?: string;
}

export function ParticipantList({
  maxHeight = '400px',
  compact = false,
  onPin,
  onMessage,
  className,
}: ParticipantListProps) {
  // Select values with useShallow to prevent unnecessary re-renders
  const { participantsMap, localParticipantId } = useSessionStore(
    useShallow((state) => ({
      participantsMap: state.participants,
      localParticipantId: state.localParticipantId,
    }))
  );

  // Connection state from WebSocketContext (single source of truth)
  const { isConnecting, isReconnecting } = useWebSocket();

  // Check if we're still connecting (show loading instead of "no participants")
  const isLoadingParticipants = isConnecting || isReconnecting;

  // Derive the participants array from the Map - useMemo ensures stable reference
  const participants = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap]
  );

  // Sort participants: local first, then by role (facilitators), then by name
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      // Local participant first
      if (a.id === localParticipantId) return -1;
      if (b.id === localParticipantId) return 1;

      // Facilitators (can end session) second
      if (a.role.permissions.canEndSession && !b.role.permissions.canEndSession)
        return -1;
      if (!a.role.permissions.canEndSession && b.role.permissions.canEndSession)
        return 1;

      // Then alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
  }, [participants, localParticipantId]);

  if (participants.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 text-center',
          className
        )}
      >
        {isLoadingParticipants ? (
          <>
            <Loader2 className="text-muted-foreground mb-2 h-4 w-4 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Loading participants...
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No participants yet</p>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <ParticipantActionsProvider onPin={onPin} onMessage={onMessage}>
        <ScrollArea
          className={cn(
            '[&_[data-radix-scroll-area-viewport]>div]:!block',
            className
          )}
          style={{ maxHeight }}
        >
          <div className="space-y-1 p-1">
            {sortedParticipants.map((participant, index) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                isLocal={participant.id === localParticipantId}
                compact={compact}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>
      </ParticipantActionsProvider>
    </TooltipProvider>
  );
}

// =============================================================================
// Participant Item Component
// =============================================================================

interface ParticipantItemProps {
  participant: Participant;
  isLocal: boolean;
  compact?: boolean;
  index: number;
}

function ParticipantItem({
  participant,
  isLocal,
  compact,
  index,
}: ParticipantItemProps) {
  const { onPin, onMessage } = useParticipantActions();
  const [isHovered, setIsHovered] = useState(false);
  const { displayName, avatarUrl, role, connectionState, mediaState } =
    participant;
  const { getRoleIcon, getRoleAvatarColors } = useRoleConfig();

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';
  const isFacilitator = role.permissions.canEndSession;
  const isObserver = !(
    role.permissions.canPublishAudio || role.permissions.canPublishVideo
  );
  const isSpeaking = mediaState.isSpeaking;

  const hasActions = onPin || onMessage;

  // Get role-specific avatar styling
  // Try displayName first (human-readable like "Interviewer"), then fall back to name (ID)
  const roleIdentifier = role.displayName || role.name;
  const avatarColors = getRoleAvatarColors(roleIdentifier);
  const RoleIcon = getRoleIcon(roleIdentifier);

  return (
    <div
      className={cn(
        'hover-reveal-container',
        'flex items-center gap-3 rounded-xl p-2.5',
        'transition-all duration-200',
        'hover:bg-muted/50',
        isLocal && 'bg-primary/5',
        isSpeaking && !isLocal && 'bg-green-50/50 dark:bg-green-950/20',
        // Staggered animation
        'motion-safe:animate-fade-in',
        index === 0 && 'stagger-1',
        index === 1 && 'stagger-2',
        index === 2 && 'stagger-3',
        index === 3 && 'stagger-4',
        index === 4 && 'stagger-5',
        index === 5 && 'stagger-6'
      )}
      style={{ animationFillMode: 'backwards' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          className={cn(
            compact ? 'h-9 w-9' : 'h-11 w-11',
            'ring-2 ring-transparent transition-all duration-200',
            isSpeaking && 'motion-safe:animate-pulse-ring ring-green-500'
          )}
        >
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          {!avatarUrl && (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center rounded-full font-medium',
                avatarColors.bg,
                avatarColors.fg
              )}
            >
              {RoleIcon ? (
                <RoleIcon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
              ) : (
                getInitials(displayName)
              )}
            </div>
          )}
        </Avatar>

        {/* Connection Status Indicator */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full',
            'border-background border-2',
            'transition-colors duration-200',
            isConnected && 'bg-green-500',
            isReconnecting && 'bg-amber-500 motion-safe:animate-pulse',
            !isConnected && !isReconnecting && 'bg-gray-400'
          )}
          aria-label={getConnectionLabel(connectionState)}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{displayName}</span>

          {isLocal && (
            <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px]">
              You
            </Badge>
          )}

          {/* Role badges */}
          {isFacilitator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Crown
                  className="h-4 w-4 flex-shrink-0 text-amber-500"
                  aria-hidden
                />
              </TooltipTrigger>
              <TooltipContent>Host</TooltipContent>
            </Tooltip>
          )}
          {isObserver && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Eye
                  className="h-4 w-4 flex-shrink-0 text-blue-500"
                  aria-hidden
                />
              </TooltipTrigger>
              <TooltipContent>Observer</TooltipContent>
            </Tooltip>
          )}
        </div>

        {!compact && (
          <p className="text-muted-foreground mt-0.5 text-xs capitalize">
            {role.displayName || role.name}
          </p>
        )}
      </div>

      {/* Hover Actions */}
      {hasActions && !isLocal && (
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {onMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="press-effect h-7 w-7"
                  onClick={() => onMessage(participant.id)}
                  aria-label={`Message ${displayName}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Message</TooltipContent>
            </Tooltip>
          )}

          {onPin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="press-effect h-7 w-7"
                  onClick={() => onPin(participant.id)}
                  aria-label={`Pin ${displayName}`}
                >
                  <Pin className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pin</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Media Status */}
      <div
        className={cn(
          'flex flex-shrink-0 items-center gap-1.5 transition-opacity duration-200',
          isHovered && hasActions && !isLocal ? 'opacity-0' : 'opacity-100'
        )}
      >
        {/* Screen Share */}
        {mediaState.screenShareEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/50">
                <Monitor
                  className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                  aria-hidden
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Sharing screen</TooltipContent>
          </Tooltip>
        )}

        {/* Audio */}
        {isObserver ? null : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                  mediaState.audioEnabled
                    ? isSpeaking
                      ? 'bg-green-100 dark:bg-green-900/50'
                      : 'bg-muted'
                    : 'bg-red-100 dark:bg-red-900/50'
                )}
              >
                {mediaState.audioEnabled ? (
                  <Mic
                    className={cn(
                      'h-3.5 w-3.5',
                      isSpeaking
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    )}
                    aria-hidden
                  />
                ) : (
                  <MicOff
                    className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
                    aria-hidden
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {mediaState.audioEnabled ? 'Microphone on' : 'Microphone off'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Video */}
        {isObserver ? null : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                  mediaState.videoEnabled
                    ? 'bg-muted'
                    : 'bg-red-100 dark:bg-red-900/50'
                )}
              >
                {mediaState.videoEnabled ? (
                  <Video
                    className="text-muted-foreground h-3.5 w-3.5"
                    aria-hidden
                  />
                ) : (
                  <VideoOff
                    className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
                    aria-hidden
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {mediaState.videoEnabled ? 'Camera on' : 'Camera off'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '??';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '??').slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '?';
  const last = parts[parts.length - 1]?.[0] ?? '?';
  return (first + last).toUpperCase();
}

function getConnectionLabel(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'reconnecting':
      return 'Reconnecting';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
}
