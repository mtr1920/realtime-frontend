/**
 * Tests for ParticipantJoinedPayload type structure.
 * Verifies that frontend types match backend's flat payload structure.
 */

import { describe, it, expect } from 'vitest';
import type { ParticipantJoinedPayload } from '@/features/realtime/types/messages';

describe('ParticipantJoinedPayload', () => {
  it('should have flat field structure matching backend', () => {
    const payload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      userId: 'u-456',
      roleId: 'interviewer',
      displayName: 'John Doe',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    // Verify flat structure (no nested participant object)
    expect(payload.participantId).toBe('p-123');
    expect(payload.roleId).toBe('interviewer');
    expect(payload.displayName).toBe('John Doe');
    expect(payload.joinedAt).toBe('2025-01-24T12:00:00Z');

    // The payload should NOT have a nested participant object
    expect((payload as unknown as { participant?: unknown }).participant).toBeUndefined();
  });

  it('should allow optional userId', () => {
    const payload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'interviewer',
      displayName: 'Anonymous',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    expect(payload.userId).toBeUndefined();
    expect(payload.participantId).toBe('p-123');
    expect(payload.displayName).toBe('Anonymous');
  });

  it('should have joinedAt as ISO string', () => {
    const payload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'trainer',
      displayName: 'Test User',
      joinedAt: '2025-01-24T12:00:00.000Z',
    };

    // joinedAt should be parseable as a date
    const date = new Date(payload.joinedAt);
    expect(date.toISOString()).toContain('2025-01-24');
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it('should accept all valid roleId values', () => {
    const roleIds = ['interviewer', 'presales', 'trainer', 'support', 'candidate', 'observer'];

    roleIds.forEach((roleId) => {
      const payload: ParticipantJoinedPayload = {
        participantId: `p-${roleId}`,
        roleId,
        displayName: `User with ${roleId}`,
        joinedAt: new Date().toISOString(),
      };

      expect(payload.roleId).toBe(roleId);
    });
  });

  it('should handle both userId and participantId for user identification', () => {
    // Case 1: Both provided (authenticated user)
    const authenticatedPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      userId: 'u-456',
      roleId: 'interviewer',
      displayName: 'Authenticated User',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    expect(authenticatedPayload.participantId).toBe('p-123');
    expect(authenticatedPayload.userId).toBe('u-456');

    // Case 2: Only participantId (guest user)
    const guestPayload: ParticipantJoinedPayload = {
      participantId: 'p-789',
      roleId: 'candidate',
      displayName: 'Guest User',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    expect(guestPayload.participantId).toBe('p-789');
    expect(guestPayload.userId).toBeUndefined();

    // In handlers, userId can fallback to participantId
    const effectiveUserId = guestPayload.userId ?? guestPayload.participantId;
    expect(effectiveUserId).toBe('p-789');
  });
});
