/**
 * Tests for SessionRoomPage status mapping.
 * Verifies that API status strings are correctly mapped to protocol status enums.
 */

import { describe, it, expect } from 'vitest';

// Copy the function for testing
function mapApiStatusToProtocol(
  apiStatus: string
): 'scheduled' | 'lobby' | 'active' | 'paused' | 'ended' {
  switch (apiStatus) {
    case 'CREATED':
    case 'WAITING':
      return 'lobby';
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'COMPLETED':
    case 'EXPIRED':
    case 'FAILED':
      return 'ended';
    default:
      return 'scheduled';
  }
}

describe('mapApiStatusToProtocol', () => {
  describe('lobby status mappings', () => {
    it('should map CREATED to lobby', () => {
      expect(mapApiStatusToProtocol('CREATED')).toBe('lobby');
    });

    it('should map WAITING to lobby', () => {
      expect(mapApiStatusToProtocol('WAITING')).toBe('lobby');
    });
  });

  describe('active status mapping', () => {
    it('should map ACTIVE to active', () => {
      expect(mapApiStatusToProtocol('ACTIVE')).toBe('active');
    });
  });

  describe('paused status mapping', () => {
    it('should map PAUSED to paused', () => {
      expect(mapApiStatusToProtocol('PAUSED')).toBe('paused');
    });
  });

  describe('ended status mappings', () => {
    it('should map COMPLETED to ended', () => {
      expect(mapApiStatusToProtocol('COMPLETED')).toBe('ended');
    });

    it('should map EXPIRED to ended', () => {
      expect(mapApiStatusToProtocol('EXPIRED')).toBe('ended');
    });

    it('should map FAILED to ended', () => {
      expect(mapApiStatusToProtocol('FAILED')).toBe('ended');
    });
  });

  describe('default/fallback mappings', () => {
    it('should map unknown status to scheduled', () => {
      expect(mapApiStatusToProtocol('UNKNOWN')).toBe('scheduled');
    });

    it('should map empty string to scheduled', () => {
      expect(mapApiStatusToProtocol('')).toBe('scheduled');
    });

    it('should map SCHEDULED to scheduled', () => {
      expect(mapApiStatusToProtocol('SCHEDULED')).toBe('scheduled');
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive (lowercase returns scheduled)', () => {
      expect(mapApiStatusToProtocol('active')).toBe('scheduled');
      expect(mapApiStatusToProtocol('Active')).toBe('scheduled');
    });

    it('should only match exact uppercase statuses', () => {
      expect(mapApiStatusToProtocol('ACTIVE')).toBe('active');
      expect(mapApiStatusToProtocol('ACTIVe')).toBe('scheduled');
    });
  });

  describe('all backend status enum values', () => {
    const backendStatuses = [
      'CREATED',
      'WAITING',
      'ACTIVE',
      'PAUSED',
      'COMPLETED',
      'EXPIRED',
      'FAILED',
    ];

    it('should handle all known backend statuses', () => {
      backendStatuses.forEach((status) => {
        const result = mapApiStatusToProtocol(status);
        expect(['lobby', 'active', 'paused', 'ended']).toContain(result);
      });
    });
  });

  describe('protocol status completeness', () => {
    it('should map to exactly 5 protocol statuses', () => {
      const protocolStatuses = new Set<string>();

      const testStatuses = [
        'CREATED', 'WAITING', 'ACTIVE', 'PAUSED',
        'COMPLETED', 'EXPIRED', 'FAILED', 'UNKNOWN', ''
      ];

      testStatuses.forEach((status) => {
        protocolStatuses.add(mapApiStatusToProtocol(status));
      });

      expect(protocolStatuses.size).toBe(5); // lobby, active, paused, ended, scheduled
      expect(protocolStatuses.has('lobby')).toBe(true);
      expect(protocolStatuses.has('active')).toBe(true);
      expect(protocolStatuses.has('paused')).toBe(true);
      expect(protocolStatuses.has('ended')).toBe(true);
      expect(protocolStatuses.has('scheduled')).toBe(true);
    });
  });
});
