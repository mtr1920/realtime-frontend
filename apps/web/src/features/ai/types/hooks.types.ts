/**
 * AI Hook Types
 *
 * TypeScript interfaces for AI hooks.
 */

import type {
  AISessionState,
  AISessionInfo,
  AISessionCallbacks,
  AIInputMode,
  AIError,
  AITurn,
} from './session.types';

// =============================================================================
// useAISession Options
// =============================================================================

export interface UseAISessionOptions {
  /** Participant ID for this user */
  participantId: string;
  /** Audio input device ID */
  audioDeviceId?: string;
  /** Input mode (push_to_talk or voice_activated) */
  inputMode?: AIInputMode;
  /** Callbacks for AI events */
  callbacks?: AISessionCallbacks;
}

// =============================================================================
// useAISession Return
// =============================================================================

export interface UseAISessionReturn {
  // State
  /** Current AI session state */
  state: AISessionState;
  /** Active session info (when session is active) */
  sessionInfo: AISessionInfo | null;
  /** Current turn (if any) */
  currentTurn: AITurn | null;
  /** Whether AI is currently speaking */
  isAISpeaking: boolean;
  /** Whether user is currently speaking */
  isUserSpeaking: boolean;
  /** Audio level for user input (0-1) */
  userAudioLevel: number;
  /** Last error (if any) */
  error: AIError | null;

  // Session Actions
  /** Start a new AI session */
  startSession: (language?: string, voiceId?: string) => Promise<void>;
  /** End the current AI session */
  endSession: (reason?: 'completed' | 'user_action') => void;

  // Speaking Actions (for push-to-talk mode)
  /** Start speaking (begin audio capture) */
  startSpeaking: () => Promise<void>;
  /** Stop speaking (commit audio input) */
  stopSpeaking: () => void;

  // Interruption
  /** Interrupt AI playback */
  interruptAI: () => void;
}
