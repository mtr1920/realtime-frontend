/**
 * useComplianceCapture Hook
 *
 * Periodic screenshot capture for compliance monitoring.
 * Requires user consent before capturing screenshots.
 * Encrypts screenshot data before transmission for security.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSend } from '@/features/realtime';
import { useRecordingStore } from '@/features/recording';
import {
  generateEncryptionKey,
  encryptData,
  base64ToArrayBuffer,
  isCryptoAvailable,
  type EncryptionKey,
} from '@/shared/lib/crypto';
import { logger } from '@/shared/lib/logger';
import {
  captureFromVideo,
  findVideoElements,
  extractBase64,
} from '../services/screenshot-capture.service';
import type { CaptureOptions } from '../services/screenshot-capture.service';

export interface UseComplianceCaptureOptions {
  /** Whether capture is enabled */
  enabled?: boolean;
  /** Capture interval in seconds */
  intervalSeconds?: number;
  /** CSS selector for video elements to capture */
  videoSelector?: string;
  /** Image capture options */
  captureOptions?: CaptureOptions;
}

export interface UseComplianceCaptureResult {
  /** Manually trigger a capture */
  captureNow: () => void;
  /** Number of captures taken this session */
  captureCount: number;
  /** Last capture timestamp */
  lastCaptureTime: string | null;
}

const DEFAULT_INTERVAL_SECONDS = 60;
const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  quality: 0.6,
  maxWidth: 640,
  maxHeight: 480,
  format: 'image/jpeg',
};

/**
 * Hook for periodic compliance screenshot capture
 *
 * @example
 * ```tsx
 * const { captureCount, lastCaptureTime } = useComplianceCapture({
 *   enabled: isComplianceEnabled,
 *   intervalSeconds: 60,
 * });
 * ```
 */
export function useComplianceCapture({
  enabled = false,
  intervalSeconds = DEFAULT_INTERVAL_SECONDS,
  videoSelector = 'video[data-compliance-capture]',
  captureOptions = DEFAULT_CAPTURE_OPTIONS,
}: UseComplianceCaptureOptions = {}): UseComplianceCaptureResult {
  const send = useSend();
  const hasConsent = useRecordingStore((state) => state.hasConsent);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureCountRef = useRef(0);
  const lastCaptureTimeRef = useRef<string | null>(null);
  const encryptionKeyRef = useRef<EncryptionKey | null>(null);
  const keySharedRef = useRef(false);

  // Initialize encryption key when capture is enabled
  useEffect(() => {
    if (!enabled || !isCryptoAvailable()) {
      return;
    }

    let mounted = true;

    const initKey = async () => {
      try {
        const key = await generateEncryptionKey();
        if (mounted) {
          encryptionKeyRef.current = key;
          // Share the key with the server so it can decrypt the screenshots
          send('compliance.encryption.keyExchange', {
            key: key.exportedKey,
            algorithm: 'AES-GCM',
          });
          keySharedRef.current = true;
        }
      } catch (error) {
        logger.error('[ComplianceCapture] Failed to generate encryption key:', error);
      }
    };

    initKey();

    return () => {
      mounted = false;
      encryptionKeyRef.current = null;
      keySharedRef.current = false;
    };
  }, [enabled, send]);

  // Perform a capture (async for encryption)
  const performCapture = useCallback(async (reason: 'scheduled' | 'violation' | 'manual' = 'scheduled') => {
    // Security: Verify consent before capturing screenshots
    if (!hasConsent) {
      logger.warn('[ComplianceCapture] Skipping capture - user has not consented');
      return;
    }

    // Security: Ensure encryption key is available
    if (!encryptionKeyRef.current || !keySharedRef.current) {
      logger.warn('[ComplianceCapture] Skipping capture - encryption not ready');
      return;
    }

    // Find video elements
    const videos = findVideoElements(videoSelector);
    const firstVideo = videos[0];
    if (!firstVideo) {
      return;
    }

    // Capture from first available video
    const result = captureFromVideo(firstVideo, captureOptions);
    if (!result) {
      return;
    }

    // Update tracking
    captureCountRef.current += 1;
    lastCaptureTimeRef.current = result.timestamp;

    // Determine format from mime type
    const format: 'png' | 'jpeg' = result.mimeType === 'image/png' ? 'png' : 'jpeg';

    try {
      // Encrypt screenshot data before transmission
      const imageBase64 = extractBase64(result.dataUrl);
      const imageBuffer = base64ToArrayBuffer(imageBase64);
      const encrypted = await encryptData(imageBuffer, encryptionKeyRef.current.key);

      // Send encrypted data to server
      send('compliance.screenshot.save', {
        imageData: encrypted.ciphertext,
        iv: encrypted.iv,
        encrypted: true,
        format,
        reason,
        metadata: {
          width: result.width,
          height: result.height,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      logger.error('[ComplianceCapture] Failed to encrypt screenshot:', error);
    }
  }, [hasConsent, videoSelector, captureOptions, send]);

  // Manual capture trigger
  const captureNow = useCallback(() => {
    void performCapture('manual');
  }, [performCapture]);

  // Set up periodic capture
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start periodic capture
    intervalRef.current = setInterval(() => {
      void performCapture();
    }, intervalSeconds * 1000);

    // Initial capture after a short delay (allow time for encryption key setup)
    const initialDelay = setTimeout(() => {
      void performCapture();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(initialDelay);
    };
  }, [enabled, intervalSeconds, performCapture]);

  return {
    captureNow,
    captureCount: captureCountRef.current,
    lastCaptureTime: lastCaptureTimeRef.current,
  };
}
