/**
 * Test Mocks
 *
 * Re-export all mock utilities for easy imports.
 */

// Imports for install/uninstall helpers
import {
  installMockWebSocket as _installWs,
  uninstallMockWebSocket as _uninstallWs,
} from './websocket.mock';
import {
  installMockMediaDevices as _installMedia,
  uninstallMockMediaDevices as _uninstallMedia,
} from './media-devices.mock';
import {
  installMockAudioContext as _installAudio,
  uninstallMockAudioContext as _uninstallAudio,
} from './audio-context.mock';
import {
  installMockMediaRecorder as _installRecorder,
  uninstallMockMediaRecorder as _uninstallRecorder,
} from './media-recorder.mock';

// WebSocket mocks
export {
  MockWebSocket,
  createMockWebSocketConstructor,
  getMockWebSocketInstance,
  resetMockWebSocket,
  installMockWebSocket,
  uninstallMockWebSocket,
  createWsMessage,
  sessionMessages,
  type WebSocketMessage,
} from './websocket.mock';

// Media device mocks
export {
  MockMediaStreamTrack,
  MockMediaStream,
  createMockMediaDeviceInfo,
  createMockMediaDevices,
  installMockMediaDevices,
  uninstallMockMediaDevices,
  resetMediaMocks,
  type MockMediaStreamTrackOptions,
  type MockMediaStreamOptions,
  type MockMediaDevicesOptions,
} from './media-devices.mock';

// Audio context mocks
export {
  MockAudioContext,
  MockAudioNode,
  MockGainNode,
  MockMediaStreamAudioSourceNode,
  MockMediaStreamAudioDestinationNode,
  MockAnalyserNode,
  MockAudioWorkletNode,
  createMockAudioWorkletNode,
  installMockAudioContext,
  uninstallMockAudioContext,
} from './audio-context.mock';

// Media recorder mocks
export {
  MockMediaRecorder,
  installMockMediaRecorder,
  uninstallMockMediaRecorder,
  type MockMediaRecorderOptions,
} from './media-recorder.mock';

// =============================================================================
// Installation Helpers
// =============================================================================

/**
 * Install all browser API mocks at once.
 * Call in beforeEach for comprehensive mocking.
 */
export function installAllMocks(): void {
  _installWs();
  _installMedia();
  _installAudio();
  _installRecorder();
}

/**
 * Uninstall all browser API mocks.
 * Call in afterEach to restore original implementations.
 */
export function uninstallAllMocks(): void {
  _uninstallWs();
  _uninstallMedia();
  _uninstallAudio();
  _uninstallRecorder();
}
