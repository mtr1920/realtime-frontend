/**
 * useIdentityChallenge Hook
 *
 * Handles identity verification challenges from the server.
 * Uses backend naming: verificationId, VerificationType.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSubscription, useSend } from '@/features/realtime';
import type {
  IdentityVerification,
  IdentityVerificationStatus,
  VerificationResult,
} from '../types/challenge.types';

export interface UseIdentityChallengeOptions {
  /** Whether identity verification is enabled */
  enabled: boolean;
  /** Callback when verification is received */
  onVerificationReceived?: (verification: IdentityVerification) => void;
  /** Callback when verification is completed */
  onVerificationCompleted?: (result: VerificationResult) => void;
  /** Callback when verification expires */
  onVerificationExpired?: (verificationId: string) => void;
}

export interface UseIdentityChallengeResult {
  /** Active verification if any */
  activeVerification: IdentityVerification | null;
  /** Verification status */
  status: IdentityVerificationStatus;
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** Whether a verification is active */
  isActive: boolean;
  /** Submit verification response */
  submitResponse: (response: string) => Promise<void>;
  /** History of completed verifications */
  history: VerificationResult[];
}

/**
 * Hook for handling identity verification challenges
 *
 * @example
 * ```tsx
 * const { isIdentityVerificationRequired } = useSessionConfig();
 * const { activeVerification, remainingSeconds, submitResponse } = useIdentityChallenge({
 *   enabled: isIdentityVerificationRequired,
 * });
 *
 * if (activeVerification) {
 *   return (
 *     <IdentityChallenge
 *       verification={activeVerification}
 *       remainingSeconds={remainingSeconds}
 *       onSubmit={submitResponse}
 *     />
 *   );
 * }
 * ```
 */
export function useIdentityChallenge({
  enabled,
  onVerificationReceived,
  onVerificationCompleted,
  onVerificationExpired,
}: UseIdentityChallengeOptions): UseIdentityChallengeResult {
  const send = useSend();
  const [activeVerification, setActiveVerification] = useState<IdentityVerification | null>(null);
  const [status, setStatus] = useState<IdentityVerificationStatus>('pending');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start countdown timer when verification is active
  useEffect(() => {
    if (activeVerification && status === 'active' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Verification expired
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setStatus('expired');
            onVerificationExpired?.(activeVerification.verificationId);
            // Send failure response
            send('compliance.verification.result', {
              verificationId: activeVerification.verificationId,
              passed: false,
              response: 'timeout',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [activeVerification, status, remainingSeconds, onVerificationExpired, send]);

  // Subscribe to verification requests
  useSubscription(
    'compliance.verification.request',
    useCallback(
      (payload) => {
        const verification: IdentityVerification = {
          verificationId: payload.verificationId,
          type: payload.type,
          prompt: payload.prompt ?? '',
          timeoutSeconds: payload.timeoutSeconds,
          options: payload.options,
          startedAt: new Date().toISOString(),
        };

        setActiveVerification(verification);
        setStatus('active');
        setRemainingSeconds(payload.timeoutSeconds);
        onVerificationReceived?.(verification);
      },
      [onVerificationReceived]
    ),
    enabled
  );

  // Submit verification response
  const submitResponse = useCallback(
    async (response: string) => {
      if (!activeVerification) {
        throw new Error('No active verification');
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Send response to server
      await send('compliance.verification.result', {
        verificationId: activeVerification.verificationId,
        passed: true,
        response,
      });

      // Update state
      const result: VerificationResult = {
        verificationId: activeVerification.verificationId,
        passed: true,
        response,
        completedAt: new Date().toISOString(),
      };

      setStatus('completed');
      setHistory((prev) => [...prev, result]);
      onVerificationCompleted?.(result);

      // Clear active verification after a short delay
      setTimeout(() => {
        setActiveVerification(null);
        setStatus('pending');
      }, 1000);
    },
    [activeVerification, send, onVerificationCompleted]
  );

  return {
    activeVerification,
    status,
    remainingSeconds,
    isActive: status === 'active',
    submitResponse,
    history,
  };
}
