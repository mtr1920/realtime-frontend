/**
 * Media Devices Mock
 *
 * Mock navigator.mediaDevices for testing media capture functionality.
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

export interface MockMediaStreamTrackOptions {
  kind: 'audio' | 'video';
  enabled?: boolean;
  label?: string;
  muted?: boolean;
  id?: string;
}

export interface MockMediaStreamOptions {
  audioTracks?: MockMediaStreamTrackOptions[];
  videoTracks?: MockMediaStreamTrackOptions[];
}

// =============================================================================
// Mock MediaStreamTrack
// =============================================================================

let trackIdCounter = 0;

export class MockMediaStreamTrack implements MediaStreamTrack {
  readonly kind: string;
  enabled: boolean;
  readonly id: string;
  readonly label: string;
  muted: boolean;
  readonly readyState: MediaStreamTrackState = 'live';
  contentHint: string = '';

  onended: ((this: MediaStreamTrack, ev: Event) => void) | null = null;
  onmute: ((this: MediaStreamTrack, ev: Event) => void) | null = null;
  onunmute: ((this: MediaStreamTrack, ev: Event) => void) | null = null;

  private _listeners: Map<string, Set<EventListener>> = new Map();
  private _stopped = false;

  constructor(options: MockMediaStreamTrackOptions) {
    trackIdCounter++;
    this.kind = options.kind;
    this.enabled = options.enabled ?? true;
    this.id = options.id ?? `track-${trackIdCounter}`;
    this.label = options.label ?? `Mock ${options.kind} track`;
    this.muted = options.muted ?? false;
  }

  stop(): void {
    if (this._stopped) return;
    this._stopped = true;
    (this as { readyState: MediaStreamTrackState }).readyState = 'ended';
    const event = new Event('ended');
    this.onended?.(event);
    this._dispatchEvent('ended', event);
  }

  clone(): MediaStreamTrack {
    const cloned = new MockMediaStreamTrack({
      kind: this.kind as 'audio' | 'video',
      enabled: this.enabled,
      label: this.label,
      muted: this.muted,
    });
    return cloned;
  }

  getCapabilities(): MediaTrackCapabilities {
    return {};
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  getSettings(): MediaTrackSettings {
    return {
      deviceId: 'mock-device-id',
    };
  }

  async applyConstraints(_constraints?: MediaTrackConstraints): Promise<void> {
    return Promise.resolve();
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this._dispatchEvent(event.type, event);
  }

  private _dispatchEvent(type: string, event: Event): boolean {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
    return true;
  }

  // Test helpers
  simulateEnded(): void {
    this.stop();
  }

  simulateMute(): void {
    this.muted = true;
    const event = new Event('mute');
    this.onmute?.(event);
    this._dispatchEvent('mute', event);
  }

  simulateUnmute(): void {
    this.muted = false;
    const event = new Event('unmute');
    this.onunmute?.(event);
    this._dispatchEvent('unmute', event);
  }
}

// =============================================================================
// Mock MediaStream
// =============================================================================

let streamIdCounter = 0;

export class MockMediaStream implements MediaStream {
  readonly id: string;
  readonly active: boolean = true;

  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;

  private _tracks: MockMediaStreamTrack[] = [];
  private _listeners: Map<string, Set<EventListener>> = new Map();

  constructor(options: MockMediaStreamOptions = {}) {
    streamIdCounter++;
    this.id = `stream-${streamIdCounter}`;

    // Add audio tracks
    if (options.audioTracks) {
      options.audioTracks.forEach((opts) => {
        this._tracks.push(new MockMediaStreamTrack({ ...opts, kind: 'audio' }));
      });
    }

    // Add video tracks
    if (options.videoTracks) {
      options.videoTracks.forEach((opts) => {
        this._tracks.push(new MockMediaStreamTrack({ ...opts, kind: 'video' }));
      });
    }
  }

  getTracks(): MediaStreamTrack[] {
    return [...this._tracks];
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this._tracks.filter((t) => t.kind === 'audio');
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this._tracks.filter((t) => t.kind === 'video');
  }

  getTrackById(trackId: string): MediaStreamTrack | null {
    return this._tracks.find((t) => t.id === trackId) ?? null;
  }

  addTrack(track: MediaStreamTrack): void {
    this._tracks.push(track as MockMediaStreamTrack);
    const event = new MediaStreamTrackEvent('addtrack', { track });
    this.onaddtrack?.(event);
    this._dispatchEvent('addtrack', event);
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this._tracks.indexOf(track as MockMediaStreamTrack);
    if (index !== -1) {
      this._tracks.splice(index, 1);
      const event = new MediaStreamTrackEvent('removetrack', { track });
      this.onremovetrack?.(event);
      this._dispatchEvent('removetrack', event);
    }
  }

  clone(): MediaStream {
    const cloned = new MockMediaStream();
    this._tracks.forEach((track) => {
      cloned.addTrack(track.clone());
    });
    return cloned;
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this._dispatchEvent(event.type, event);
  }

  private _dispatchEvent(type: string, event: Event): boolean {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
    return true;
  }

  // Test helper: stop all tracks
  stopAllTracks(): void {
    this._tracks.forEach((track) => track.stop());
  }
}

// =============================================================================
// MediaStreamTrackEvent Polyfill (not available in jsdom)
// =============================================================================

if (typeof MediaStreamTrackEvent === 'undefined') {
  (globalThis as unknown as { MediaStreamTrackEvent: typeof MediaStreamTrackEvent }).MediaStreamTrackEvent = class MediaStreamTrackEvent
    extends Event
    implements MediaStreamTrackEvent
  {
    readonly track: MediaStreamTrack;

    constructor(type: string, eventInitDict: MediaStreamTrackEventInit) {
      super(type, eventInitDict);
      this.track = eventInitDict.track;
    }
  } as typeof MediaStreamTrackEvent;
}

// =============================================================================
// Mock MediaDeviceInfo
// =============================================================================

export function createMockMediaDeviceInfo(
  kind: MediaDeviceKind,
  label: string,
  deviceId?: string
): MediaDeviceInfo {
  const id = deviceId ?? `device-${kind}-${label.replace(/\s/g, '-').toLowerCase()}`;
  return {
    deviceId: id,
    groupId: `group-${id}`,
    kind,
    label,
    toJSON: () => ({ deviceId: id, groupId: `group-${id}`, kind, label }),
  };
}

// =============================================================================
// Mock MediaDevices
// =============================================================================

export interface MockMediaDevicesOptions {
  devices?: MediaDeviceInfo[];
  getUserMediaStream?: MockMediaStreamOptions;
  getDisplayMediaStream?: MockMediaStreamOptions;
  getUserMediaError?: Error;
  getDisplayMediaError?: Error;
}

export function createMockMediaDevices(
  options: MockMediaDevicesOptions = {}
): MediaDevices {
  const defaultDevices: MediaDeviceInfo[] = [
    createMockMediaDeviceInfo('audioinput', 'Default Microphone'),
    createMockMediaDeviceInfo('audioinput', 'External Microphone'),
    createMockMediaDeviceInfo('audiooutput', 'Default Speaker'),
    createMockMediaDeviceInfo('videoinput', 'Default Camera'),
    createMockMediaDeviceInfo('videoinput', 'External Camera'),
  ];

  const devices = options.devices ?? defaultDevices;

  const mockMediaDevices = {
    enumerateDevices: vi.fn().mockResolvedValue(devices),

    getUserMedia: vi.fn().mockImplementation(async (constraints?: MediaStreamConstraints) => {
      if (options.getUserMediaError) {
        throw options.getUserMediaError;
      }

      const streamOpts: MockMediaStreamOptions = options.getUserMediaStream ?? {};

      // Default to adding tracks based on constraints
      if (!options.getUserMediaStream) {
        if (constraints?.audio) {
          streamOpts.audioTracks = [{ kind: 'audio', label: 'Microphone' }];
        }
        if (constraints?.video) {
          streamOpts.videoTracks = [{ kind: 'video', label: 'Camera' }];
        }
      }

      return new MockMediaStream(streamOpts);
    }),

    getDisplayMedia: vi.fn().mockImplementation(async (_constraints?: DisplayMediaStreamOptions) => {
      if (options.getDisplayMediaError) {
        throw options.getDisplayMediaError;
      }

      const streamOpts: MockMediaStreamOptions = options.getDisplayMediaStream ?? {
        videoTracks: [{ kind: 'video', label: 'Screen Share' }],
        audioTracks: [{ kind: 'audio', label: 'System Audio' }],
      };

      return new MockMediaStream(streamOpts);
    }),

    getSupportedConstraints: vi.fn().mockReturnValue({
      width: true,
      height: true,
      aspectRatio: true,
      frameRate: true,
      facingMode: true,
      deviceId: true,
      groupId: true,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: true,
      sampleSize: true,
      channelCount: true,
    }),

    ondevicechange: null,

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  } as unknown as MediaDevices;

  return mockMediaDevices;
}

// =============================================================================
// Installation Helper
// =============================================================================

let originalMediaDevices: MediaDevices | undefined;
let originalMediaStream: typeof MediaStream | undefined;
let originalMediaStreamTrack: typeof MediaStreamTrack | undefined;

export function installMockMediaDevices(options: MockMediaDevicesOptions = {}): MediaDevices {
  const mockDevices = createMockMediaDevices(options);

  originalMediaDevices = navigator.mediaDevices;
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockDevices,
    writable: true,
    configurable: true,
  });

  // Install MediaStream and MediaStreamTrack globally for tests
  originalMediaStream = globalThis.MediaStream;
  originalMediaStreamTrack = globalThis.MediaStreamTrack;

  // Create a constructor that handles both MockMediaStreamOptions and real MediaStream constructor patterns
  const MediaStreamConstructor = function (
    this: MockMediaStream,
    streamOrTracks?: MediaStream | MediaStreamTrack[]
  ) {
    if (Array.isArray(streamOrTracks)) {
      // Called with tracks array: new MediaStream([track1, track2])
      const instance = new MockMediaStream();
      streamOrTracks.forEach((track) => instance.addTrack(track));
      return instance;
    } else if (streamOrTracks instanceof MockMediaStream) {
      // Called with another stream: new MediaStream(existingStream)
      const instance = new MockMediaStream();
      streamOrTracks.getTracks().forEach((track) => instance.addTrack(track));
      return instance;
    }
    // Called with no args or MockMediaStreamOptions
    return new MockMediaStream(streamOrTracks as MockMediaStreamOptions);
  } as unknown as typeof MediaStream;

  globalThis.MediaStream = MediaStreamConstructor;
  globalThis.MediaStreamTrack = MockMediaStreamTrack as unknown as typeof MediaStreamTrack;

  return mockDevices;
}

export function uninstallMockMediaDevices(): void {
  if (originalMediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true,
      configurable: true,
    });
    originalMediaDevices = undefined;
  }

  if (originalMediaStream !== undefined) {
    globalThis.MediaStream = originalMediaStream;
    originalMediaStream = undefined;
  }

  if (originalMediaStreamTrack !== undefined) {
    globalThis.MediaStreamTrack = originalMediaStreamTrack;
    originalMediaStreamTrack = undefined;
  }
}

// =============================================================================
// Reset Helpers
// =============================================================================

export function resetTrackIdCounter(): void {
  trackIdCounter = 0;
}

export function resetStreamIdCounter(): void {
  streamIdCounter = 0;
}

export function resetMediaMocks(): void {
  resetTrackIdCounter();
  resetStreamIdCounter();
}
