/**
 * useMediaPermissions Hook
 *
 * Combines session permissions with module configuration to determine
 * effective media permissions for the current user.
 */

import { useMemo } from 'react';
import { useSessionPermissions } from './useSessionPermissions';
import { useSessionConfig } from './useSessionConfig';

interface UseMediaPermissionsResult {
  /** Whether the user can use audio (permission + module enabled) */
  canUseAudio: boolean;
  /** Whether the user can use video (permission + module enabled) */
  canUseVideo: boolean;
  /** Whether the user can use screen share (permission + module enabled) */
  canUseScreenShare: boolean;
  /** Whether the user has any media permissions */
  canPublishMedia: boolean;
}

/**
 * Hook to determine effective media permissions by combining
 * role-based permissions with module configuration.
 *
 * @example
 * ```ts
 * const { canUseAudio, canUseVideo, canUseScreenShare } = useMediaPermissions();
 *
 * // These booleans reflect both permission and module state
 * if (canUseAudio) {
 *   // User has permission AND audio module is enabled
 * }
 * ```
 */
export function useMediaPermissions(): UseMediaPermissionsResult {
  const { canPublishAudio, canPublishVideo, canScreenShare } = useSessionPermissions();
  const { isModuleEnabled } = useSessionConfig();

  return useMemo(() => {
    const canUseAudio = canPublishAudio && isModuleEnabled('audio');
    const canUseVideo = canPublishVideo && isModuleEnabled('video');
    const canUseScreenShare = canScreenShare && isModuleEnabled('screenShare');

    return {
      canUseAudio,
      canUseVideo,
      canUseScreenShare,
      canPublishMedia: canUseAudio || canUseVideo || canUseScreenShare,
    };
  }, [canPublishAudio, canPublishVideo, canScreenShare, isModuleEnabled]);
}
