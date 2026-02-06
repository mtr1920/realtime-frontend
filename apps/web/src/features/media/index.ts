/**
 * Media Feature
 *
 * Public API for media capture, device management, and WebRTC.
 */

// Types
export type {
  MediaConstraints,
  VideoConstraints,
  AudioConstraints,
  CaptureResult,
  MediaError,
  MediaErrorType,
  DevicePreferences,
  DeviceKind,
  TrackState,
  ScreenShareOptions,
} from './types/media.types';

export {
  DEFAULT_VIDEO_CONSTRAINTS,
  DEFAULT_AUDIO_CONSTRAINTS,
  DEVICE_PREFERENCES_KEY,
} from './types/media.types';

// Services
export { mediaCaptureService } from './services/media-capture.service';
export {
  createWebRTCService,
  getWebRTCService,
  destroyWebRTCService,
} from './services/webrtc.service';

// Stores
export { useWebRTCStore } from './stores/webrtc.store';

// Context
export { WebRTCProvider, useWebRTCContext } from './context/WebRTCContext';

// Hooks
export { useMediaDevices } from './hooks/useMediaDevices';
export { useLocalMedia } from './hooks/useLocalMedia';
export { useMediaCapture, type UseMediaCaptureOptions, type UseMediaCaptureReturn } from './hooks/useMediaCapture';
export { useMediaToggle, type UseMediaToggleReturn } from './hooks/useMediaToggle';
export { useDeviceSwitch, type UseDeviceSwitchReturn } from './hooks/useDeviceSwitch';
export { useWebRTC } from './hooks/useWebRTC';
export { useRemoteStreams, useParticipantStream } from './hooks/useRemoteStreams';
export { useScreenShare } from './hooks/useScreenShare';
export { useNetworkQuality } from './hooks/useNetworkQuality';
export { useScreenShareEnforcement } from './hooks/useScreenShareEnforcement';
export { useAudioLevels } from './hooks/useAudioLevels';
export type { UseAudioLevelsReturn } from './hooks/useAudioLevels';
export { useVideoStream } from './hooks/useVideoStream';
export type {
  ScreenShareEnforcementState,
  UseScreenShareEnforcementReturn,
} from './hooks/useScreenShareEnforcement';

// Components
export { DeviceSelector } from './components/DeviceSelector';
export { LocalVideo } from './components/LocalVideo';
export {
  VideoGrid,
  VideoTile,
  VideoPlaceholder,
  type VideoParticipant,
} from './components/VideoGrid';
export { ScreenShareView } from './components/ScreenShareView';
export {
  NetworkQualityIndicator,
  SimpleQualityIcon,
} from './components/NetworkQualityIndicator';
export { ScreenShareRequired } from './components/ScreenShareRequired';
export type { ScreenShareRequiredProps } from './components/ScreenShareRequired';
export { ResharePrompt } from './components/ResharePrompt';
export type { ResharePromptProps } from './components/ResharePrompt';

// Types
export type {
  PeerInfo,
  RemoteTrack,
  PeerConnectionStats,
  NetworkQualityLevel,
  TrackKind,
  WebRTCConfig,
} from './types/webrtc.types';
