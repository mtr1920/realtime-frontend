/**
 * Sessions Service Tests
 *
 * Tests for session-related API operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mocks
// =============================================================================

// Mock must be before imports that use it
vi.mock('@/shared/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number = 500,
      public code?: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Import after mock setup
import { sessionsService, type Session, type SessionStatus } from '@/features/sessions/api/sessions.service';
import { apiClient } from '@/shared/services/api-client';

// Helper to get mock functions
const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// =============================================================================
// Test Data
// =============================================================================

const mockSession: Session = {
  id: 'session-1',
  workspaceId: 'workspace-1',
  tenantId: 'tenant-1',
  domainType: 'interview',
  externalId: 'ext-session-1',
  status: 'ACTIVE',
  phase: 'main',
  scheduledAt: '2024-01-15T10:00:00Z',
  startedAt: '2024-01-15T10:05:00Z',
  endedAt: null,
  expiresAt: '2024-01-15T12:00:00Z',
  participantCount: 2,
  metadata: { recording: true },
  createdAt: '2024-01-14T10:00:00Z',
  updatedAt: '2024-01-15T10:05:00Z',
};

const mockJoinResponse = {
  sessionId: 'session-1',
  participantId: 'participant-1',
  realtimeToken: 'jwt-token-123',
  expiresAt: '2024-01-15T11:00:00Z',
  wsEndpoint: 'wss://realtime.example.com',
};

// Backend returns { sessions, pagination } after envelope extraction
const mockBackendSessionsResponse = {
  sessions: [mockSession],
  pagination: {
    total: 1,
    nextCursor: null,
    hasMore: false,
  },
};

// =============================================================================
// Tests
// =============================================================================

describe('SessionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // List Sessions Tests
  // ===========================================================================

  describe('list', () => {
    it('should fetch sessions list', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      const result = await sessionsService.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: {},
      });
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0]).toEqual(mockSession);
    });

    it('should pass workspace filter', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      await sessionsService.list({ workspaceId: 'workspace-1' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: { workspaceId: 'workspace-1' },
      });
    });

    it('should pass status filter', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      await sessionsService.list({ status: 'ACTIVE' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: { status: 'ACTIVE' },
      });
    });

    it('should pass pagination cursor', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      await sessionsService.list({ cursor: 'cursor-abc' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: { cursor: 'cursor-abc' },
      });
    });

    it('should pass limit parameter', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      await sessionsService.list({ limit: 25 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: { limit: 25 },
      });
    });

    it('should combine multiple filters', async () => {
      mockApiClient.get.mockResolvedValue(mockBackendSessionsResponse);

      await sessionsService.list({
        workspaceId: 'workspace-1',
        status: 'WAITING',
        limit: 10,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions', {
        params: {
          workspaceId: 'workspace-1',
          status: 'WAITING',
          limit: 10,
        },
      });
    });

    it('should return pagination info', async () => {
      // Mock backend format { sessions, pagination }
      mockApiClient.get.mockResolvedValue({
        sessions: [mockSession, { ...mockSession, id: 'session-2' }],
        pagination: {
          total: 100,
          nextCursor: 'next-cursor',
          hasMore: true,
        },
      });

      const result = await sessionsService.list();

      expect(result.pagination.total).toBe(100);
      expect(result.pagination.nextCursor).toBe('next-cursor');
      expect(result.pagination.hasMore).toBe(true);
    });
  });

  // ===========================================================================
  // Get Session Tests
  // ===========================================================================

  describe('get', () => {
    it('should fetch single session by ID', async () => {
      mockApiClient.get.mockResolvedValue({ session: mockSession });

      const result = await sessionsService.get('session-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/sessions/session-1', { signal: undefined });
      expect(result).toEqual(mockSession);
    });

    it('should return session data from response', async () => {
      mockApiClient.get.mockResolvedValue({ session: mockSession });

      const result = await sessionsService.get('session-1');

      expect(result.id).toBe('session-1');
      expect(result.status).toBe('ACTIVE');
      expect(result.domainType).toBe('interview');
    });
  });

  // ===========================================================================
  // Create Session Tests
  // ===========================================================================

  describe('create', () => {
    it('should create a new session', async () => {
      const createdSession = { ...mockSession, status: 'CREATED' as SessionStatus };
      mockApiClient.post.mockResolvedValue({ session: createdSession });

      const result = await sessionsService.create({
        workspaceId: 'workspace-1',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/sessions', {
        workspaceId: 'workspace-1',
      });
      expect(result.status).toBe('CREATED');
    });

    it('should pass external ID', async () => {
      mockApiClient.post.mockResolvedValue({ session: mockSession });

      await sessionsService.create({
        workspaceId: 'workspace-1',
        externalId: 'ext-123',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/sessions', {
        workspaceId: 'workspace-1',
        externalId: 'ext-123',
      });
    });

    it('should pass scheduled time', async () => {
      mockApiClient.post.mockResolvedValue({ session: mockSession });

      await sessionsService.create({
        workspaceId: 'workspace-1',
        scheduledAt: '2024-01-20T10:00:00Z',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/sessions', {
        workspaceId: 'workspace-1',
        scheduledAt: '2024-01-20T10:00:00Z',
      });
    });

    it('should pass expiration time', async () => {
      mockApiClient.post.mockResolvedValue({ session: mockSession });

      await sessionsService.create({
        workspaceId: 'workspace-1',
        expiresInMinutes: 120,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/sessions', {
        workspaceId: 'workspace-1',
        expiresInMinutes: 120,
      });
    });

    it('should pass metadata', async () => {
      mockApiClient.post.mockResolvedValue({ session: mockSession });

      await sessionsService.create({
        workspaceId: 'workspace-1',
        metadata: { recording: true, aiEnabled: true },
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/sessions', {
        workspaceId: 'workspace-1',
        metadata: { recording: true, aiEnabled: true },
      });
    });
  });

  // ===========================================================================
  // Join Session Tests
  // ===========================================================================

  describe('join', () => {
    it('should join a session', async () => {
      mockApiClient.post.mockResolvedValue({ join: mockJoinResponse });

      const result = await sessionsService.join('session-1', {
        accessToken: 'token-123',
        roleId: 'candidate',
        displayName: 'John Doe',
      });

      // Backend identifies session via accessToken in body, not path param
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/sessions/join',
        {
          accessToken: 'token-123',
          roleId: 'candidate',
          displayName: 'John Doe',
        },
        { skipAuth: true }
      );
      expect(result.sessionId).toBe('session-1');
      expect(result.realtimeToken).toBe('jwt-token-123');
      expect(result.wsEndpoint).toBe('wss://realtime.example.com');
    });

    it('should pass user ID when provided', async () => {
      mockApiClient.post.mockResolvedValue({ join: mockJoinResponse });

      await sessionsService.join('session-1', {
        accessToken: 'token-123',
        roleId: 'interviewer',
        displayName: 'Jane Smith',
        userId: 'user-456',
      });

      // Backend identifies session via accessToken in body, not path param
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/sessions/join',
        {
          accessToken: 'token-123',
          roleId: 'interviewer',
          displayName: 'Jane Smith',
          userId: 'user-456',
        },
        { skipAuth: true }
      );
    });

    it('should return participant ID', async () => {
      mockApiClient.post.mockResolvedValue({ join: mockJoinResponse });

      const result = await sessionsService.join('session-1', {
        accessToken: 'token-123',
        roleId: 'candidate',
        displayName: 'Test User',
      });

      expect(result.participantId).toBe('participant-1');
    });

    it('should return expiration time', async () => {
      mockApiClient.post.mockResolvedValue({ join: mockJoinResponse });

      const result = await sessionsService.join('session-1', {
        accessToken: 'token-123',
        roleId: 'candidate',
        displayName: 'Test User',
      });

      expect(result.expiresAt).toBe('2024-01-15T11:00:00Z');
    });
  });

  // ===========================================================================
  // Complete Session Tests
  // ===========================================================================

  describe('complete', () => {
    it('should complete a session', async () => {
      const completedSession = {
        ...mockSession,
        status: 'COMPLETED' as SessionStatus,
        endedAt: '2024-01-15T11:30:00Z',
      };
      mockApiClient.post.mockResolvedValue({ session: completedSession });

      const result = await sessionsService.complete('session-1');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/sessions/session-1/complete'
      );
      expect(result.status).toBe('COMPLETED');
      expect(result.endedAt).toBe('2024-01-15T11:30:00Z');
    });
  });

  // ===========================================================================
  // Cancel Session Tests
  // ===========================================================================

  describe('cancel', () => {
    it('should cancel a session', async () => {
      const cancelledSession = {
        ...mockSession,
        status: 'FAILED' as SessionStatus,
        endedAt: '2024-01-15T10:10:00Z',
      };
      mockApiClient.post.mockResolvedValue({ session: cancelledSession });

      const result = await sessionsService.cancel('session-1');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/sessions/session-1/cancel',
        {}
      );
      expect(result.status).toBe('FAILED');
    });

    it('should cancel a session with reason', async () => {
      const cancelledSession = {
        ...mockSession,
        status: 'FAILED' as SessionStatus,
        endedAt: '2024-01-15T10:10:00Z',
      };
      mockApiClient.post.mockResolvedValue({ session: cancelledSession });

      const result = await sessionsService.cancel('session-1', { reason: 'No longer needed' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/sessions/session-1/cancel',
        { reason: 'No longer needed' }
      );
      expect(result.status).toBe('FAILED');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should propagate API errors from list', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(sessionsService.list()).rejects.toThrow('Network error');
    });

    it('should propagate API errors from get', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Not found'));

      await expect(sessionsService.get('session-1')).rejects.toThrow('Not found');
    });

    it('should propagate API errors from create', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Validation error'));

      await expect(
        sessionsService.create({ workspaceId: 'workspace-1' })
      ).rejects.toThrow('Validation error');
    });

    it('should propagate API errors from join', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Session not found'));

      await expect(
        sessionsService.join('session-1', {
          accessToken: 'token',
          roleId: 'role',
          displayName: 'User',
        })
      ).rejects.toThrow('Session not found');
    });

    it('should propagate API errors from complete', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Already completed'));

      await expect(sessionsService.complete('session-1')).rejects.toThrow(
        'Already completed'
      );
    });

    it('should propagate API errors from cancel', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Cannot cancel'));

      await expect(sessionsService.cancel('session-1')).rejects.toThrow(
        'Cannot cancel'
      );
    });
  });

  // ===========================================================================
  // Status Values Tests
  // ===========================================================================

  describe('status values', () => {
    const statusValues: SessionStatus[] = [
      'CREATED',
      'WAITING',
      'ACTIVE',
      'PAUSED',
      'COMPLETED',
      'EXPIRED',
      'FAILED',
    ];

    statusValues.forEach((status) => {
      it(`should handle ${status} status`, async () => {
        const sessionWithStatus = { ...mockSession, status };
        mockApiClient.get.mockResolvedValue({ session: sessionWithStatus });

        const result = await sessionsService.get('session-1');

        expect(result.status).toBe(status);
      });
    });
  });

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle session with null metadata', async () => {
      const sessionNoMeta = { ...mockSession, metadata: null };
      mockApiClient.get.mockResolvedValue({ session: sessionNoMeta });

      const result = await sessionsService.get('session-1');

      expect(result.metadata).toBeNull();
    });

    it('should handle session with null dates', async () => {
      const sessionNoDates = {
        ...mockSession,
        scheduledAt: null,
        startedAt: null,
        endedAt: null,
        // expiresAt is required per backend schema, cannot be null
      };
      mockApiClient.get.mockResolvedValue({ session: sessionNoDates });

      const result = await sessionsService.get('session-1');

      expect(result.scheduledAt).toBeNull();
      expect(result.startedAt).toBeNull();
      expect(result.endedAt).toBeNull();
      // expiresAt should still be present
      expect(result.expiresAt).toBe(mockSession.expiresAt);
    });

    it('should handle empty sessions list', async () => {
      // Mock backend format { sessions, pagination }
      mockApiClient.get.mockResolvedValue({
        sessions: [],
        pagination: {
          total: 0,
          nextCursor: null,
          hasMore: false,
        },
      });

      const result = await sessionsService.list();

      expect(result.sessions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle session with empty external ID', async () => {
      const sessionNoExtId = { ...mockSession, externalId: null };
      mockApiClient.get.mockResolvedValue({ session: sessionNoExtId });

      const result = await sessionsService.get('session-1');

      expect(result.externalId).toBeNull();
    });
  });
});
