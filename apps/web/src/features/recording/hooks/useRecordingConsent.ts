/**
 * useRecordingConsent Hook
 *
 * Manages recording consent state and provides consent actions.
 */

import { useCallback } from 'react';
import { useSend } from '@/features/realtime';
import { useRecordingStore } from '../stores/recording.store';

export interface UseRecordingConsentResult {
  /** Whether user has given consent */
  hasConsent: boolean;
  /** Accept recording consent */
  acceptConsent: () => void;
  /** Decline recording consent */
  declineConsent: () => void;
  /** Start recording with consent */
  startRecording: () => Promise<void>;
}

/**
 * Hook for managing recording consent
 *
 * @example
 * ```tsx
 * const { hasConsent, acceptConsent, declineConsent } = useRecordingConsent();
 *
 * if (!hasConsent) {
 *   return <ConsentModal onAccept={acceptConsent} onDecline={declineConsent} />;
 * }
 * ```
 */
export function useRecordingConsent(): UseRecordingConsentResult {
  const send = useSend();
  const hasConsent = useRecordingStore((state) => state.hasConsent);
  const setConsent = useRecordingStore((state) => state.setConsent);

  const acceptConsent = useCallback(() => {
    setConsent(true);
  }, [setConsent]);

  const declineConsent = useCallback(() => {
    setConsent(false);
  }, [setConsent]);

  const startRecording = useCallback(async () => {
    if (!hasConsent) {
      throw new Error('Recording consent required');
    }
    // types: Default to 'mixed' for generic recording consent flow
    // More specific types can be set by useRecording hook when streams are known
    await send('recording.start', { types: ['mixed'], consent: true });
  }, [send, hasConsent]);

  return {
    hasConsent,
    acceptConsent,
    declineConsent,
    startRecording,
  };
}
