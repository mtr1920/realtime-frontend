/**
 * SessionControls
 *
 * Media control buttons with polished glass morphism toolbar.
 * Features rounded buttons, hover effects, keyboard shortcuts, and reactions.
 */

import { useTransition, useCallback, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MoreVertical,
  Settings,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useMediaStore } from '@/shared/stores/media.store';
import { useSessionStore } from '@/shared/stores/session.store';
import { useLocalMedia, useScreenShare, useWebRTC } from '@/features/media';
import { useSessionPermissions } from '../../hooks/useSessionPermissions';
import { useSessionConfig } from '../../hooks/useSessionConfig';
import { useKeyboardShortcuts, SHORTCUT_LABELS } from '../../hooks/useKeyboardShortcuts';
import { ReactionsPopover, type ReactionType } from './ReactionsPopover';

export interface SessionControlsProps {
  /** Called when leave session is requested */
  onLeave?: () => void;

  /** Whether leaving is in progress */
  isLeaving?: boolean;

  /** Whether to show the leave button */
  showLeave?: boolean;

  /** Control bar variant */
  variant?: 'default' | 'compact' | 'floating';

  /** Called when a reaction is sent */
  onReaction?: (reaction: ReactionType) => void;

  /** Whether to show the reactions button */
  showReactions?: boolean;

  /** Whether to show the more menu */
  showMoreMenu?: boolean;

  /** Called when settings is requested */
  onSettings?: () => void;

  /** Additional CSS class */
  className?: string;
}

export function SessionControls({
  onLeave,
  isLeaving = false,
  showLeave = true,
  variant = 'default',
  onReaction,
  showReactions = true,
  showMoreMenu = true,
  onSettings,
  className,
}: SessionControlsProps) {
  const [, startTransition] = useTransition();
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);

  // Existing store state for UI display
  const isAudioEnabled = useMediaStore((s) => s.isAudioEnabled);
  const isVideoEnabled = useMediaStore((s) => s.isVideoEnabled);
  const isScreenShareEnabled = useMediaStore((s) => s.isScreenShareEnabled);
  const hasAudioPermission = useMediaStore((s) => s.hasAudioPermission);
  const hasVideoPermission = useMediaStore((s) => s.hasVideoPermission);

  // Actual media control hooks
  const { toggleAudio: localToggleAudio, toggleVideo: localToggleVideo } =
    useLocalMedia();

  const { startScreenShare, stopScreenShare, isScreenSharing } =
    useScreenShare();

  const { notifyMediaToggle } = useWebRTC();

  const { canPublishAudio, canPublishVideo, canScreenShare } =
    useSessionPermissions();

  const { isModuleEnabled } = useSessionConfig();

  const localParticipantId = useSessionStore((s) => s.localParticipantId);
  const updateParticipantMedia = useSessionStore((s) => s.updateParticipantMedia);

  const updateLocalMediaState = useCallback(
    (kind: 'audio' | 'video', enabled: boolean) => {
      if (!localParticipantId) return;
      updateParticipantMedia(
        localParticipantId,
        kind === 'audio' ? { audioEnabled: enabled } : { videoEnabled: enabled }
      );
    },
    [localParticipantId, updateParticipantMedia]
  );

  // Combine permissions with module checks
  const canUseAudio = canPublishAudio && isModuleEnabled('audio');
  const canUseVideo = canPublishVideo && isModuleEnabled('video');
  const canUseScreenShare = canScreenShare && isModuleEnabled('screenShare');

  // Wire audio toggle to actual track + server notification
  const toggleAudio = useCallback(() => {
    if (!canUseAudio) return; // Guard against programmatic calls
    startTransition(() => {
      const nextEnabled = !isAudioEnabled;
      localToggleAudio();
      updateLocalMediaState('audio', nextEnabled);
      notifyMediaToggle('audio', nextEnabled).catch(() => {
        // Silent fail - state is local anyway
      });
    });
  }, [canUseAudio, localToggleAudio, notifyMediaToggle, updateLocalMediaState, isAudioEnabled]);

  // Wire video toggle to actual track + server notification
  const toggleVideo = useCallback(() => {
    if (!canUseVideo) return; // Guard against programmatic calls
    startTransition(() => {
      const nextEnabled = !isVideoEnabled;
      localToggleVideo();
      updateLocalMediaState('video', nextEnabled);
      notifyMediaToggle('video', nextEnabled).catch(() => {
        // Silent fail - state is local anyway
      });
    });
  }, [canUseVideo, localToggleVideo, notifyMediaToggle, updateLocalMediaState, isVideoEnabled]);

  // Wire screen share to actual capture
  const toggleScreenShare = useCallback(() => {
    if (!canUseScreenShare) return; // Guard against programmatic calls
    startTransition(() => {
      if (isScreenSharing) {
        stopScreenShare();
      } else {
        startScreenShare().catch(() => {
          // User cancelled or error - handled by hook
        });
      }
    });
  }, [canUseScreenShare, isScreenSharing, startScreenShare, stopScreenShare]);

  // Handle reactions
  const handleReaction = useCallback((reaction: ReactionType) => {
    if (reaction === 'hand') {
      setActiveReaction(prev => prev === 'hand' ? null : 'hand');
    }
    onReaction?.(reaction);
  }, [onReaction]);

  // Keyboard shortcuts - use module-gated callbacks
  useKeyboardShortcuts({
    onToggleMute: canUseAudio ? toggleAudio : undefined,
    onToggleVideo: canUseVideo ? toggleVideo : undefined,
    onToggleScreenShare: canUseScreenShare ? toggleScreenShare : undefined,
    onToggleHand: showReactions ? () => handleReaction('hand') : undefined,
    enabled: true,
  });

  const isCompact = variant === 'compact';
  const isFloating = variant === 'floating';

  const buttonSize = isCompact ? 'h-9 w-9' : 'h-11 w-11';
  const iconSize = isCompact ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-2',
          isFloating &&
            'fixed bottom-6 left-1/2 -translate-x-1/2 glass-card rounded-full px-5 py-3 shadow-2xl border-white/10',
          className
        )}
        role="toolbar"
        aria-label="Session controls"
      >
        {/* Audio Toggle */}
        {canUseAudio && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAudioEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={toggleAudio}
                disabled={!hasAudioPermission}
                className={cn(
                  buttonSize,
                  'rounded-full press-effect',
                  isAudioEnabled && 'bg-muted hover:bg-muted/80 text-foreground'
                )}
                aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                aria-pressed={isAudioEnabled}
              >
                {isAudioEnabled ? (
                  <Mic className={iconSize} />
                ) : (
                  <MicOff className={iconSize} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!hasAudioPermission
                ? 'Microphone access required'
                : isAudioEnabled
                ? `Mute ${SHORTCUT_LABELS.toggleMute}`
                : `Unmute ${SHORTCUT_LABELS.toggleMute}`}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Video Toggle */}
        {canUseVideo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={toggleVideo}
                disabled={!hasVideoPermission}
                className={cn(
                  buttonSize,
                  'rounded-full press-effect',
                  isVideoEnabled && 'bg-muted hover:bg-muted/80 text-foreground'
                )}
                aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                aria-pressed={isVideoEnabled}
              >
                {isVideoEnabled ? (
                  <Video className={iconSize} />
                ) : (
                  <VideoOff className={iconSize} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!hasVideoPermission
                ? 'Camera access required'
                : isVideoEnabled
                ? `Stop video ${SHORTCUT_LABELS.toggleVideo}`
                : `Start video ${SHORTCUT_LABELS.toggleVideo}`}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Screen Share Toggle */}
        {canUseScreenShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenShareEnabled ? 'secondary' : 'outline'}
                size="icon"
                onClick={toggleScreenShare}
                className={cn(
                  buttonSize,
                  'rounded-full press-effect',
                  isScreenShareEnabled &&
                    'bg-blue-500 hover:bg-blue-600 text-white border-0'
                )}
                aria-label={
                  isScreenShareEnabled ? 'Stop sharing screen' : 'Share screen'
                }
                aria-pressed={isScreenShareEnabled}
              >
                <Monitor className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenShareEnabled
                ? `Stop sharing ${SHORTCUT_LABELS.toggleScreenShare}`
                : `Share screen ${SHORTCUT_LABELS.toggleScreenShare}`}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Separator */}
        {(showReactions || showMoreMenu) && (canUseAudio || canUseVideo || canUseScreenShare) && (
          <div className="w-px h-7 bg-border/50 mx-1" aria-hidden="true" />
        )}

        {/* Reactions */}
        {showReactions && (
          <ReactionsPopover
            onReaction={handleReaction}
            activeReaction={activeReaction}
            size={isCompact ? 'sm' : 'default'}
          />
        )}

        {/* More Menu */}
        {showMoreMenu && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(buttonSize, 'rounded-full press-effect')}
                    aria-label="More options"
                  >
                    <MoreVertical className={iconSize} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" side="top" sideOffset={8}>
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                Keyboard shortcuts: M, V, S, H
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Separator before leave */}
        {showLeave && (showReactions || showMoreMenu || canUseAudio || canUseVideo || canUseScreenShare) && (
          <div className="w-px h-7 bg-border/50 mx-1" aria-hidden="true" />
        )}

        {/* Leave Button */}
        {showLeave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={onLeave}
                disabled={isLeaving}
                className={cn(buttonSize, 'rounded-full press-effect')}
                aria-label="Leave session"
              >
                <PhoneOff className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave session</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
