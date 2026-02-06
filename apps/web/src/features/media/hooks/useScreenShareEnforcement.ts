/**
 * useScreenShareEnforcement Hook
 *
 * Enforces screen share requirements based on session configuration:
 * - Required screen share to participate
 * - Entire screen (monitor) selection enforcement
 * - Force re-share prompt when user stops sharing
 * - Violation reporting for compliance
 *
 * Observers are automatically exempt from screen share requirements.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionConfig } from '@/features/sessions';
import { useSend } from '@/features/realtime';
import { useScreenShare } from './useScreenShare';
import type { ScreenShareOptions } from '../types/media.types';
import type { ViolationSeverity } from '@/features/compliance/types/compliance.types';

// =============================================================================
// Types
// =============================================================================

export interface ScreenShareEnforcementState {
  /** Whether user is currently sharing their screen */
  isSharing: boolean;
  /** Whether screen share is required for this session */
  isRequired: boolean;
  /** Whether user is exempt from requirements (observers) */
  isExempt: boolean;
  /** Whether re-share prompt should be shown */
  showResharePrompt: boolean;
  /** Whether permission was denied by browser */
  permissionDenied: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether screen share is loading/starting */
  isLoading: boolean;
}

export interface UseScreenShareEnforcementReturn extends ScreenShareEnforcementState {
  /** Request screen share with enforcement constraints */
  requestScreenShare: () => Promise<void>;
  /** Stop screen share (will trigger re-share prompt if configured) */
  stopScreenShare: () => void;
  /** Dismiss re-share prompt (if user explicitly declines) */
  dismissResharePrompt: () => void;
  /** Clear error state */
  clearError: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useScreenShareEnforcement(): UseScreenShareEnforcementReturn {
  // Session config for enforcement rules
  const {
    isScreenShareRequired,
    requireEntireScreen,
    forceReshareOnStop,
    isObserver,
    canPublishMedia,
    isComplianceEnabled,
  } = useSessionConfig();

  // Observers and participants without publish permissions are exempt
  const isExempt = isObserver || !canPublishMedia;

  // Base screen share hook
  const {
    isScreenSharing,
    screenShareStream,
    startScreenShare,
    stopScreenShare: baseStopScreenShare,
    error: screenShareError,
  } = useScreenShare();

  // WebSocket for violation reporting
  const send = useSend();

  // Local state
  const [showResharePrompt, setShowResharePrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've requested share (to detect user-initiated stop vs never started)
  const hasEverSharedRef = useRef(false);
  const wasShareActiveRef = useRef(false);

  // Report screen share violation
  const reportViolation = useCallback(
    (severity: ViolationSeverity, _message: string, details?: Record<string, unknown>) => {
      if (!isComplianceEnabled) {
        return;
      }
      // Backend expects flat structure (no nested 'violation' object, no 'message' field)
      send('compliance.violation', {
        type: 'screen_capture_attempt',
        severity,
        details,
        timestamp: new Date().toISOString(),
      });
    },
    [send, isComplianceEnabled]
  );

  // Build constraints for screen share
  const buildScreenShareOptions = useCallback((): ScreenShareOptions => {
    const options: ScreenShareOptions = {
      audio: true, // Include system audio if available
      video: {},
    };

    // If entire screen is required, hint to browser
    // Note: This is a preference hint, browser may still allow tab/window
    if (requireEntireScreen && options.video) {
      options.video.displaySurface = 'monitor';
    }

    return options;
  }, [requireEntireScreen]);

  // Check if selected display surface is valid
  const validateDisplaySurface = useCallback(
    (stream: MediaStream): boolean => {
      if (!requireEntireScreen) return true;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return false;

      // Get the display surface type from track settings
      const settings = videoTrack.getSettings();

      // Check if browser supports displaySurface detection
      if (!('displaySurface' in settings)) {
        // Browser doesn't support displaySurface, can't validate - assume valid
        return true;
      }

      const displaySurface = (settings as MediaTrackSettings & { displaySurface?: string }).displaySurface;

      // If we required entire screen but got tab or window, it's invalid
      if (displaySurface && displaySurface !== 'monitor') {
        return false;
      }

      return true;
    },
    [requireEntireScreen]
  );

  // Request screen share with enforcement
  const requestScreenShare = useCallback(async () => {
    if (isExempt) return;

    setIsLoading(true);
    setError(null);
    setPermissionDenied(false);
    setShowResharePrompt(false);

    try {
      const options = buildScreenShareOptions();
      await startScreenShare(options);

      // Mark that user has successfully shared
      hasEverSharedRef.current = true;
    } catch (err) {
      const mediaError = err as { type?: string; message?: string };

      if (mediaError.type === 'permission_denied') {
        setPermissionDenied(true);
        setError('Screen share permission was denied. Please enable screen sharing to continue.');
      } else {
        setError(mediaError.message || 'Failed to start screen sharing.');
      }

      // Report violation if required and permission denied
      if (isScreenShareRequired) {
        reportViolation('medium', 'Screen share request denied', {
          errorType: mediaError.type,
          errorMessage: mediaError.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isExempt,
    buildScreenShareOptions,
    startScreenShare,
    isScreenShareRequired,
    reportViolation,
  ]);

  // Stop screen share (may trigger re-share prompt)
  const stopScreenShare = useCallback(() => {
    baseStopScreenShare();

    // If force re-share is enabled and user actively stopped sharing
    if (forceReshareOnStop && hasEverSharedRef.current && !isExempt) {
      setShowResharePrompt(true);
      reportViolation('low', 'User stopped screen sharing', { forceReshare: true });
    }
  }, [baseStopScreenShare, forceReshareOnStop, isExempt, reportViolation]);

  // Dismiss re-share prompt
  const dismissResharePrompt = useCallback(() => {
    setShowResharePrompt(false);
    // Report that user declined to re-share
    if (isScreenShareRequired) {
      reportViolation('medium', 'User declined to re-share screen', {
        required: isScreenShareRequired,
      });
    }
  }, [isScreenShareRequired, reportViolation]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setPermissionDenied(false);
  }, []);

  // Detect when screen share stream ends (browser-initiated or track ended)
  useEffect(() => {
    if (isExempt) return;

    // Track previous state
    const wasSharing = wasShareActiveRef.current;
    const isCurrentlySharing = isScreenSharing && screenShareStream !== null;
    wasShareActiveRef.current = isCurrentlySharing;

    // Detect share stopping (was sharing, now not)
    if (wasSharing && !isCurrentlySharing && hasEverSharedRef.current) {
      // This means the share ended (browser stop button or track ended)
      if (forceReshareOnStop) {
        setShowResharePrompt(true);
        reportViolation('low', 'Screen share ended', { source: 'track_ended' });
      }
    }
  }, [
    isScreenSharing,
    screenShareStream,
    forceReshareOnStop,
    isExempt,
    reportViolation,
  ]);

  // Validate display surface after share starts
  useEffect(() => {
    if (!screenShareStream || isExempt || !requireEntireScreen) return;

    if (!validateDisplaySurface(screenShareStream)) {
      // User selected tab/window when entire screen was required
      setError('Please share your entire screen, not a specific tab or window.');
      reportViolation('medium', 'Selected tab/window instead of entire screen', {
        required: 'monitor',
        selected: 'tab_or_window',
      });

      // Stop the invalid share
      baseStopScreenShare();
      setShowResharePrompt(true);
    }
  }, [
    screenShareStream,
    isExempt,
    requireEntireScreen,
    validateDisplaySurface,
    reportViolation,
    baseStopScreenShare,
  ]);

  // Sync error from base hook
  useEffect(() => {
    if (screenShareError) {
      setError(screenShareError.message);
    }
  }, [screenShareError]);

  return {
    // State
    isSharing: isScreenSharing,
    isRequired: isScreenShareRequired && !isExempt,
    isExempt,
    showResharePrompt,
    permissionDenied,
    error,
    isLoading,
    // Actions
    requestScreenShare,
    stopScreenShare,
    dismissResharePrompt,
    clearError,
  };
}
