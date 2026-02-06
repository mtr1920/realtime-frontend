/**
 * Transcript Test Factory
 *
 * Create mock transcript data for testing.
 */

// =============================================================================
// Types
// =============================================================================

export interface TranscriptEntry {
  id: string;
  sessionId: string;
  participantId: string;
  speaker: string;
  content: string;
  timestamp: string;
  isFinal: boolean;
  confidence?: number;
  language?: string;
}

export type SpeakerType = 'user' | 'ai' | 'system';

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_ENTRY: TranscriptEntry = {
  id: 'entry-001',
  sessionId: 'session-001',
  participantId: 'participant-001',
  speaker: 'User',
  content: 'Test transcript content',
  timestamp: new Date().toISOString(),
  isFinal: true,
  confidence: 0.95,
  language: 'en',
};

// =============================================================================
// Factory Functions
// =============================================================================

let entryIdCounter = 0;

/**
 * Create a mock transcript entry with optional overrides.
 */
export function createMockTranscriptEntry(
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  entryIdCounter++;
  return {
    ...DEFAULT_ENTRY,
    id: `entry-${String(entryIdCounter).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a user transcript entry.
 */
export function createUserEntry(
  content: string,
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  return createMockTranscriptEntry({
    speaker: 'User',
    content,
    ...overrides,
  });
}

/**
 * Create an AI transcript entry.
 */
export function createAIEntry(
  content: string,
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  return createMockTranscriptEntry({
    speaker: 'AI Assistant',
    participantId: 'ai-001',
    content,
    ...overrides,
  });
}

/**
 * Create a system transcript entry.
 */
export function createSystemEntry(
  content: string,
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  return createMockTranscriptEntry({
    speaker: 'System',
    participantId: 'system',
    content,
    ...overrides,
  });
}

/**
 * Create a streaming (non-final) transcript entry.
 */
export function createStreamingEntry(
  content: string,
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  return createMockTranscriptEntry({
    content,
    isFinal: false,
    ...overrides,
  });
}

/**
 * Create a conversation between user and AI.
 */
export function createConversation(
  turns: Array<{ speaker: SpeakerType; content: string }>
): TranscriptEntry[] {
  const sessionId = 'session-001';
  let timestamp = Date.now();

  return turns.map((turn) => {
    timestamp += 2000; // 2 second gap between turns

    if (turn.speaker === 'ai') {
      return createAIEntry(turn.content, {
        sessionId,
        timestamp: new Date(timestamp).toISOString(),
      });
    } else if (turn.speaker === 'system') {
      return createSystemEntry(turn.content, {
        sessionId,
        timestamp: new Date(timestamp).toISOString(),
      });
    } else {
      return createUserEntry(turn.content, {
        sessionId,
        timestamp: new Date(timestamp).toISOString(),
      });
    }
  });
}

/**
 * Create multiple entries for a session.
 */
export function createTranscriptEntries(
  sessionId: string,
  count: number = 10
): TranscriptEntry[] {
  const speakers = ['User', 'AI Assistant', 'User', 'AI Assistant'];
  const contents = [
    'Hello, I am here for the interview.',
    'Welcome! Let us begin. Can you tell me about your experience?',
    'I have 5 years of experience in software development.',
    'That is great. What technologies have you worked with?',
    'I have worked with React, TypeScript, and Node.js.',
    'Excellent. Can you describe a challenging project?',
    'Sure, I built a real-time collaboration platform.',
    'Interesting. What were the main challenges?',
    'Handling concurrent edits and ensuring data consistency.',
    'How did you solve those challenges?',
  ];

  return Array.from({ length: count }, (_, i) => {
    return createMockTranscriptEntry({
      sessionId,
      speaker: speakers[i % speakers.length] || 'User',
      content: contents[i % contents.length] || `Entry ${i + 1}`,
      participantId: i % 2 === 0 ? 'user-001' : 'ai-001',
    });
  });
}

/**
 * Reset the entry ID counter (call in beforeEach for deterministic IDs).
 */
export function resetEntryIdCounter(): void {
  entryIdCounter = 0;
}
