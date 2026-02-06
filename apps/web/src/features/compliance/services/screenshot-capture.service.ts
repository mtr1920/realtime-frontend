/**
 * Screenshot Capture Service
 *
 * Captures screenshots from video elements for compliance monitoring.
 */

import { logger } from '@/shared/lib/logger';

export interface CaptureResult {
  /** Base64 encoded image data (data URL) */
  dataUrl: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Capture timestamp (ISO string) */
  timestamp: string;
  /** MIME type of the image */
  mimeType: string;
}

export interface CaptureOptions {
  /** Quality for JPEG compression (0-1) */
  quality?: number;
  /** Maximum width (will maintain aspect ratio) */
  maxWidth?: number;
  /** Maximum height (will maintain aspect ratio) */
  maxHeight?: number;
  /** Output format */
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CaptureOptions> = {
  quality: 0.7,
  maxWidth: 640,
  maxHeight: 480,
  format: 'image/jpeg',
};

/**
 * Capture a screenshot from a video element
 *
 * @param video - The video element to capture from
 * @param options - Capture options
 * @returns Capture result or null if capture failed
 *
 * @example
 * ```typescript
 * const video = document.querySelector('video');
 * const result = await captureFromVideo(video, { quality: 0.8 });
 * if (result) {
 *   console.log('Captured:', result.width, 'x', result.height);
 * }
 * ```
 */
export function captureFromVideo(
  video: HTMLVideoElement,
  options: CaptureOptions = {}
): CaptureResult | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if video is ready
  if (!video.videoWidth || !video.videoHeight) {
    logger.warn('[ScreenshotCapture] Video not ready for capture');
    return null;
  }

  try {
    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = video.videoWidth / video.videoHeight;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > opts.maxWidth) {
      width = opts.maxWidth;
      height = width / aspectRatio;
    }
    if (height > opts.maxHeight) {
      height = opts.maxHeight;
      width = height * aspectRatio;
    }

    width = Math.floor(width);
    height = Math.floor(height);

    // Create canvas and draw video frame
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      logger.warn('[ScreenshotCapture] Could not get canvas context');
      return null;
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL(opts.format, opts.quality);

    return {
      dataUrl,
      width,
      height,
      timestamp: new Date().toISOString(),
      mimeType: opts.format,
    };
  } catch (error) {
    logger.error('[ScreenshotCapture] Capture failed:', error);
    return null;
  }
}

/**
 * Capture screenshots from multiple video elements
 *
 * @param videos - Array of video elements
 * @param options - Capture options
 * @returns Array of capture results (excludes failed captures)
 */
export function captureMultiple(
  videos: HTMLVideoElement[],
  options: CaptureOptions = {}
): CaptureResult[] {
  return videos
    .map((video) => captureFromVideo(video, options))
    .filter((result): result is CaptureResult => result !== null);
}

/**
 * Find video elements in the DOM by selector
 *
 * @param selector - CSS selector for video elements
 * @returns Array of video elements
 */
export function findVideoElements(selector = 'video'): HTMLVideoElement[] {
  return Array.from(document.querySelectorAll<HTMLVideoElement>(selector));
}

/**
 * Extract base64 data from a data URL
 *
 * @param dataUrl - The data URL to extract from
 * @returns Base64 string without data URL prefix
 */
export function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(',');
  const base64Part = parts[1];
  return base64Part !== undefined ? base64Part : dataUrl;
}
