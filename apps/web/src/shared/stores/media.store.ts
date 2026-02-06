import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MediaDevice } from '@/types';

interface MediaState {
  // Device state
  audioInputDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  videoInputDevices: MediaDevice[];
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  selectedVideoInput: string | null;

  // Permission state
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
  permissionError: string | null;

  // Initialization failure tracking (for recovery on device switch)
  videoInitializationFailed: boolean;
  videoInitializationError: string | null;
  audioInitializationFailed: boolean;
  audioInitializationError: string | null;

  // Local stream state
  localStream: MediaStream | null;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  screenShareStream: MediaStream | null;

  // Local media state
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShareEnabled: boolean;
  isSpeaking: boolean;
  audioLevel: number;

  // Actions
  setDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedAudioOutput: (deviceId: string) => void;
  setSelectedVideoInput: (deviceId: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenShareEnabled: (enabled: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;
  setPermissions: (audio: boolean, video: boolean) => void;
  setPermissionError: (error: string | null) => void;

  // Stream actions
  setLocalStream: (stream: MediaStream | null) => void;
  setLocalAudioTrack: (track: MediaStreamTrack | null) => void;
  setLocalVideoTrack: (track: MediaStreamTrack | null) => void;
  setScreenShareStream: (stream: MediaStream | null) => void;
  stopAllTracks: () => void;

  // Initialization failure actions (for recovery on device switch)
  setVideoInitializationFailed: (failed: boolean, error?: string | null) => void;
  setAudioInitializationFailed: (failed: boolean, error?: string | null) => void;
  clearInitializationErrors: () => void;

  reset: () => void;
}

const initialState = {
  audioInputDevices: [],
  audioOutputDevices: [],
  videoInputDevices: [],
  selectedAudioInput: null,
  selectedAudioOutput: null,
  selectedVideoInput: null,
  hasAudioPermission: false,
  hasVideoPermission: false,
  permissionError: null,
  videoInitializationFailed: false,
  videoInitializationError: null,
  audioInitializationFailed: false,
  audioInitializationError: null,
  localStream: null,
  localAudioTrack: null,
  localVideoTrack: null,
  screenShareStream: null,
  isAudioEnabled: false,
  isVideoEnabled: false,
  isScreenShareEnabled: false,
  isSpeaking: false,
  audioLevel: 0,
};

export const useMediaStore = create<MediaState>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      setDevices: (devices) =>
        set((state) => {
          state.audioInputDevices = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
              kind: d.kind as 'audioinput',
            }));

          state.audioOutputDevices = devices
            .filter((d) => d.kind === 'audiooutput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
              kind: d.kind as 'audiooutput',
            }));

          state.videoInputDevices = devices
            .filter((d) => d.kind === 'videoinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
              kind: d.kind as 'videoinput',
            }));

          // Auto-select first device if none selected
          if (
            !state.selectedAudioInput &&
            state.audioInputDevices.length > 0
          ) {
            state.selectedAudioInput =
              state.audioInputDevices[0]?.deviceId ?? null;
          }
          if (
            !state.selectedAudioOutput &&
            state.audioOutputDevices.length > 0
          ) {
            state.selectedAudioOutput =
              state.audioOutputDevices[0]?.deviceId ?? null;
          }
          if (
            !state.selectedVideoInput &&
            state.videoInputDevices.length > 0
          ) {
            state.selectedVideoInput =
              state.videoInputDevices[0]?.deviceId ?? null;
          }
        }),

      setSelectedAudioInput: (deviceId) =>
        set((state) => {
          state.selectedAudioInput = deviceId;
        }),

      setSelectedAudioOutput: (deviceId) =>
        set((state) => {
          state.selectedAudioOutput = deviceId;
        }),

      setSelectedVideoInput: (deviceId) =>
        set((state) => {
          state.selectedVideoInput = deviceId;
        }),

      setAudioEnabled: (enabled) =>
        set((state) => {
          state.isAudioEnabled = enabled;
        }),

      setVideoEnabled: (enabled) =>
        set((state) => {
          state.isVideoEnabled = enabled;
        }),

      setScreenShareEnabled: (enabled) =>
        set((state) => {
          state.isScreenShareEnabled = enabled;
        }),

      setSpeaking: (speaking) =>
        set((state) => {
          state.isSpeaking = speaking;
        }),

      setAudioLevel: (level) =>
        set((state) => {
          state.audioLevel = level;
        }),

      setPermissions: (audio, video) =>
        set((state) => {
          state.hasAudioPermission = audio;
          state.hasVideoPermission = video;
        }),

      setPermissionError: (error) =>
        set((state) => {
          state.permissionError = error;
        }),

      // Stream actions
      setLocalStream: (stream) =>
        set((state) => {
          state.localStream = stream;
        }),

      setLocalAudioTrack: (track) =>
        set((state) => {
          state.localAudioTrack = track;
        }),

      setLocalVideoTrack: (track) =>
        set((state) => {
          state.localVideoTrack = track;
        }),

      setScreenShareStream: (stream) =>
        set((state) => {
          state.screenShareStream = stream;
        }),

      stopAllTracks: () =>
        set((state) => {
          // Stop local stream tracks
          if (state.localStream) {
            state.localStream.getTracks().forEach((track) => {
              track.stop();
            });
          }
          // Stop screen share tracks
          if (state.screenShareStream) {
            state.screenShareStream.getTracks().forEach((track) => {
              track.stop();
            });
          }
          // Clear stream refs but preserve enabled state
          // The enabled state represents user preference (set in lobby) and should
          // persist across stream captures. Resetting it here causes media to be
          // disabled when navigating from lobby to room.
          state.localStream = null;
          state.localAudioTrack = null;
          state.localVideoTrack = null;
          state.screenShareStream = null;
          // Note: isAudioEnabled, isVideoEnabled, isScreenShareEnabled are NOT reset
          // They represent user preference, not stream state
        }),

      setVideoInitializationFailed: (failed, error = null) =>
        set((state) => {
          state.videoInitializationFailed = failed;
          state.videoInitializationError = error;
        }),

      setAudioInitializationFailed: (failed, error = null) =>
        set((state) => {
          state.audioInitializationFailed = failed;
          state.audioInitializationError = error;
        }),

      clearInitializationErrors: () =>
        set((state) => {
          state.videoInitializationFailed = false;
          state.videoInitializationError = null;
          state.audioInitializationFailed = false;
          state.audioInitializationError = null;
        }),

      reset: () =>
        set((state) => {
          // Stop all tracks before resetting
          if (state.localStream) {
            state.localStream.getTracks().forEach((track) => track.stop());
          }
          if (state.screenShareStream) {
            state.screenShareStream.getTracks().forEach((track) => track.stop());
          }
          // Return full initial state including cleared initialization errors
          return { ...initialState };
        }),
    }))
  )
);
