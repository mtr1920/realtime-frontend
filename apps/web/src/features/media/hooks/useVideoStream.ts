/**
 * useVideoStream Hook
 *
 * Reusable hook for attaching a MediaStream to a video element.
 * Handles cleanup on unmount and stream changes.
 */

import { useEffect, useRef, type RefObject } from 'react';

interface UseVideoStreamOptions {
  /** The media stream to attach */
  stream: MediaStream | null;
  /** Optional external ref for the video element */
  externalRef?: RefObject<HTMLVideoElement | null>;
}

interface UseVideoStreamResult {
  /** Ref to attach to the video element */
  videoRef: RefObject<HTMLVideoElement | null>;
}

/**
 * Hook to attach a MediaStream to a video element with proper cleanup.
 *
 * @example
 * ```tsx
 * function VideoComponent({ stream }: { stream: MediaStream | null }) {
 *   const { videoRef } = useVideoStream({ stream });
 *
 *   return <video ref={videoRef} autoPlay playsInline muted />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With external ref (e.g., forwardRef)
 * const VideoComponent = forwardRef<HTMLVideoElement, Props>((props, ref) => {
 *   const { videoRef } = useVideoStream({
 *     stream: props.stream,
 *     externalRef: ref as RefObject<HTMLVideoElement>,
 *   });
 *
 *   return <video ref={videoRef} autoPlay playsInline muted />;
 * });
 * ```
 */
export function useVideoStream(options: UseVideoStreamOptions): UseVideoStreamResult {
  const { stream, externalRef } = options;
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalRef;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
    } else {
      video.srcObject = null;
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream, videoRef]);

  return { videoRef };
}
