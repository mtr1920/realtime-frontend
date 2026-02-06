/**
 * useKeyboardShortcuts Hook
 *
 * Keyboard shortcuts for session controls:
 * - M: Toggle mute
 * - V: Toggle video
 * - S: Toggle screen share
 * - H: Raise/lower hand
 * - Escape: Leave session (with confirmation)
 */

import { useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface KeyboardShortcutHandlers {
  /** Toggle microphone mute */
  onToggleMute?: () => void;
  /** Toggle video */
  onToggleVideo?: () => void;
  /** Toggle screen share */
  onToggleScreenShare?: () => void;
  /** Toggle raise hand */
  onToggleHand?: () => void;
  /** Leave session */
  onLeave?: () => void;
}

export interface UseKeyboardShortcutsOptions extends KeyboardShortcutHandlers {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useKeyboardShortcuts({
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onLeave,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for specific combos)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'm':
          if (onToggleMute) {
            if (preventDefault) event.preventDefault();
            onToggleMute();
          }
          break;

        case 'v':
          if (onToggleVideo) {
            if (preventDefault) event.preventDefault();
            onToggleVideo();
          }
          break;

        case 's':
          if (onToggleScreenShare) {
            if (preventDefault) event.preventDefault();
            onToggleScreenShare();
          }
          break;

        case 'h':
          if (onToggleHand) {
            if (preventDefault) event.preventDefault();
            onToggleHand();
          }
          break;

        case 'escape':
          if (onLeave) {
            if (preventDefault) event.preventDefault();
            onLeave();
          }
          break;
      }
    },
    [onToggleMute, onToggleVideo, onToggleScreenShare, onToggleHand, onLeave, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

// =============================================================================
// Shortcut Labels (for UI display)
// =============================================================================

export const SHORTCUT_LABELS = {
  toggleMute: 'M',
  toggleVideo: 'V',
  toggleScreenShare: 'S',
  toggleHand: 'H',
  leave: 'Esc',
} as const;

/**
 * Format a shortcut label for tooltip display
 */
export function formatShortcutLabel(shortcut: string): string {
  return `(${shortcut})`;
}
