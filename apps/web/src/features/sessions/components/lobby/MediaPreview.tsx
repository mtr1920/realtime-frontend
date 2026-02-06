/**
 * MediaPreview
 *
 * Enhanced live video preview with:
 * - Camera frame overlay (viewfinder corners)
 * - Audio waveform visualization
 * - Floating glass device buttons
 * - Better "camera off" state with avatar
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  User,
} from 'lucide-react';
import { Button, Avatar, AvatarFallback } from '@/shared/ui';
import { Card, CardContent } from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useMediaStore } from '@/shared/stores/media.store';
import { AudioWaveform } from './AudioWaveform';
import { CameraFrame } from './CameraFrame';

export interface MediaPreviewProps {
  /** Whether audio is enabled */
  audioEnabled?: boolean;

  /** Whether video is enabled */
  videoEnabled?: boolean;

  /** Called when audio is toggled */
  onAudioToggle?: (enabled: boolean) => void;

  /** Called when video is toggled */
  onVideoToggle?: (enabled: boolean) => void;

  /** Whether to show device selection */
  showDeviceSelection?: boolean;

  /** Display name for avatar fallback */
  displayName?: string;

  /** Additional CSS class */
  className?: string;
}

export function MediaPreview({
  audioEnabled: audioEnabledProp,
  videoEnabled: videoEnabledProp,
  onAudioToggle,
  onVideoToggle,
  showDeviceSelection = true,
  displayName = 'User',
  className,
}: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    audioInputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedVideoInput,
    hasAudioPermission,
    hasVideoPermission,
    isAudioEnabled,
    isVideoEnabled,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setAudioEnabled,
    setVideoEnabled,
  } = useMediaStore();

  // Use props if provided, otherwise use store state
  const audioEnabled = audioEnabledProp ?? isAudioEnabled;
  const videoEnabled = videoEnabledProp ?? isVideoEnabled;

  // Get initials for avatar
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Set up audio level analyser
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      // Close existing AudioContext to prevent memory leak
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors on close
        });
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(average / 128, 1);
        setAudioLevel(normalized);

        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // Silently handle audio analyser setup failures
    }
  }, []);

  // Start/stop media stream
  const startStream = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Get new stream
      const constraints: MediaStreamConstraints = {
        audio: audioEnabled && hasAudioPermission
          ? { deviceId: selectedAudioInput || undefined }
          : false,
        video: videoEnabled && hasVideoPermission
          ? { deviceId: selectedVideoInput || undefined }
          : false,
      };

      if (!constraints.audio && !constraints.video) {
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Set up audio level visualization
      if (audioEnabled && stream.getAudioTracks().length > 0) {
        setupAudioAnalyser(stream);
      }

      setError(null);
    } catch {
      setError('Could not access media devices');
    }
  }, [audioEnabled, videoEnabled, selectedAudioInput, selectedVideoInput, hasAudioPermission, hasVideoPermission, setupAudioAnalyser]);

  // Start stream when enabled states change
  useEffect(() => {
    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Close AudioContext to prevent memory leak
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors on close
        });
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [startStream]);

  const handleAudioToggle = () => {
    const newValue = !audioEnabled;
    if (onAudioToggle) {
      onAudioToggle(newValue);
    } else {
      setAudioEnabled(newValue);
    }
  };

  const handleVideoToggle = () => {
    const newValue = !videoEnabled;
    if (onVideoToggle) {
      onVideoToggle(newValue);
    } else {
      setVideoEnabled(newValue);
    }
  };

  const showVideo = videoEnabled && hasVideoPermission;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn('w-full overflow-hidden', className)}>
        <CardContent className="p-0">
          {/* Video Preview */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            {/* Video element */}
            {showVideo ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Camera preview"
                  className="h-full w-full object-cover scale-x-[-1]"
                />
                {/* Camera frame overlay */}
                <CameraFrame />
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-20 w-20 ring-2 ring-muted-foreground/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-2xl font-semibold text-primary-foreground">
                      {initials || <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Camera off</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-sm">
                <p className="text-sm text-destructive font-medium px-4 text-center">{error}</p>
              </div>
            )}

            {/* Audio Waveform (when audio enabled and video off) */}
            {audioEnabled && hasAudioPermission && !showVideo && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
                <AudioWaveform level={audioLevel} bars={7} height={40} />
              </div>
            )}

            {/* Audio Waveform (when video on) */}
            {audioEnabled && hasAudioPermission && showVideo && (
              <div className="absolute bottom-4 left-4 glass-card rounded-full px-3 py-2">
                <AudioWaveform level={audioLevel} bars={5} height={20} />
              </div>
            )}

            {/* Settings Button */}
            {showDeviceSelection && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'absolute right-3 top-3 press-effect',
                      showVideo
                        ? 'bg-black/40 hover:bg-black/60 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Device settings"
                    aria-expanded={showSettings}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Device settings</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Floating Control Buttons */}
          <div className="flex items-center justify-center gap-3 p-4 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={audioEnabled ? 'default' : 'destructive'}
                  size="icon"
                  className={cn(
                    'h-12 w-12 rounded-full press-effect shadow-lg',
                    audioEnabled && 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                  onClick={handleAudioToggle}
                  disabled={!hasAudioPermission}
                  aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  aria-pressed={audioEnabled}
                >
                  {audioEnabled ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!hasAudioPermission
                  ? 'Microphone access required'
                  : audioEnabled
                  ? 'Mute'
                  : 'Unmute'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={videoEnabled ? 'default' : 'destructive'}
                  size="icon"
                  className={cn(
                    'h-12 w-12 rounded-full press-effect shadow-lg',
                    videoEnabled && 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                  onClick={handleVideoToggle}
                  disabled={!hasVideoPermission}
                  aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  aria-pressed={videoEnabled}
                >
                  {videoEnabled ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!hasVideoPermission
                  ? 'Camera access required'
                  : videoEnabled
                  ? 'Stop video'
                  : 'Start video'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Device Selection */}
          {showSettings && showDeviceSelection && (
            <div className="space-y-4 border-t p-4 motion-safe:animate-fade-in">
              {/* Microphone Selection */}
              {audioInputDevices.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="microphone-select" className="text-sm font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Microphone
                  </label>
                  <Select
                    value={selectedAudioInput ?? undefined}
                    onValueChange={setSelectedAudioInput}
                  >
                    <SelectTrigger id="microphone-select" aria-label="Select microphone">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioInputDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Camera Selection */}
              {videoInputDevices.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="camera-select" className="text-sm font-medium flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Camera
                  </label>
                  <Select
                    value={selectedVideoInput ?? undefined}
                    onValueChange={setSelectedVideoInput}
                  >
                    <SelectTrigger id="camera-select" aria-label="Select camera">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoInputDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
