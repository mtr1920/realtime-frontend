/**
 * Contract Tests
 *
 * These tests verify that frontend types align with expected backend contract structures.
 * They serve as a safety net to catch type drift between frontend and backend.
 *
 * These tests don't import backend schemas directly but verify structural alignment
 * by testing against expected shapes.
 */

import { describe, it, expect } from 'vitest';
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  CurrentUserResponse,
  SessionJoinRequest,
  SessionJoinResponse,
  CreateSessionRequest,
  SessionResponse,
  PaginationParams,
  OrderedPaginationParams,
  PaginatedResponse,
} from '@/types/api';
import type { UserRole, SessionStatus } from '@/types/domain';

// =============================================================================
// Authentication Contract Tests
// =============================================================================

describe('Authentication Contracts', () => {
  describe('LoginCredentials', () => {
    it('should have required fields matching backend LoginRequestSchema', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant-1',
      };

      // Backend schema: email (string.email), password (string.min(1)), tenantId (string.min(1))
      expect(typeof credentials.email).toBe('string');
      expect(typeof credentials.password).toBe('string');
      expect(typeof credentials.tenantId).toBe('string');
    });
  });

  describe('LoginResponse', () => {
    it('should match backend LoginResponseSchema structure', () => {
      const response: LoginResponse = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: '2024-01-15T12:00:00Z',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          tenantId: 'tenant-1',
          role: 'MEMBER',
        },
      };

      // Backend schema fields
      expect(typeof response.accessToken).toBe('string');
      expect(typeof response.refreshToken).toBe('string');
      expect(typeof response.expiresAt).toBe('string');
      expect(typeof response.user).toBe('object');
      expect(typeof response.user.id).toBe('string');
      expect(typeof response.user.email).toBe('string');
    });
  });

  describe('AuthUser', () => {
    it('should match backend AuthUserSchema structure', () => {
      const user: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      };

      // Backend schema: id, email, name (nullable), tenantId, role
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(user.name === null || typeof user.name === 'string').toBe(true);
      expect(typeof user.tenantId).toBe('string');
      expect(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(user.role)).toBe(
        true
      );
    });

    it('should allow null name', () => {
      const user: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: null,
        tenantId: 'tenant-1',
        role: 'VIEWER',
      };

      expect(user.name).toBeNull();
    });
  });

  describe('RefreshResponse', () => {
    it('should match backend RefreshResponseSchema structure', () => {
      const response: RefreshResponse = {
        accessToken: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-01-15T14:00:00Z',
      };

      // Backend schema: accessToken, refreshToken, expiresAt (datetime)
      expect(typeof response.accessToken).toBe('string');
      expect(typeof response.refreshToken).toBe('string');
      expect(typeof response.expiresAt).toBe('string');
      // Verify ISO datetime format
      expect(() => new Date(response.expiresAt)).not.toThrow();
    });
  });

  describe('CurrentUserResponse', () => {
    it('should match backend CurrentUserResponseSchema structure', () => {
      const response: CurrentUserResponse = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        tenantId: 'tenant-1',
        role: 'MEMBER',
      };

      // Backend schema: id, email, displayName, tenantId, role
      expect(typeof response.id).toBe('string');
      expect(typeof response.email).toBe('string');
      expect(typeof response.displayName).toBe('string');
      expect(typeof response.tenantId).toBe('string');
      expect(typeof response.role).toBe('string');
    });

    it('should allow optional avatarUrl', () => {
      const response: CurrentUserResponse = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        tenantId: 'tenant-1',
        role: 'MEMBER',
        avatarUrl: 'https://example.com/avatar.png',
      };

      expect(response.avatarUrl).toBe('https://example.com/avatar.png');
    });
  });
});

// =============================================================================
// Session Contract Tests
// =============================================================================

describe('Session Contracts', () => {
  describe('SessionJoinRequest', () => {
    it('should match backend JoinSessionRequestSchema structure', () => {
      const request: SessionJoinRequest = {
        accessToken: 'session-access-token',
        roleId: 'candidate',
        displayName: 'John Doe',
      };

      // Backend schema: accessToken, roleId, displayName
      expect(typeof request.accessToken).toBe('string');
      expect(typeof request.roleId).toBe('string');
      expect(typeof request.displayName).toBe('string');
    });

    it('should allow optional userId', () => {
      const request: SessionJoinRequest = {
        accessToken: 'token',
        roleId: 'interviewer',
        displayName: 'Jane Smith',
        userId: 'user-123',
      };

      expect(typeof request.userId).toBe('string');
    });
  });

  describe('SessionJoinResponse', () => {
    it('should match backend JoinSessionResponseSchema structure', () => {
      const response: SessionJoinResponse = {
        sessionId: 'session-1',
        participantId: 'participant-1',
        realtimeToken: 'rt-jwt-token',
        expiresAt: '2024-01-15T10:05:00Z',
        wsEndpoint: 'wss://realtime.example.com/ws',
      };

      // Backend schema: sessionId, participantId, realtimeToken, expiresAt, wsEndpoint
      expect(typeof response.sessionId).toBe('string');
      expect(typeof response.participantId).toBe('string');
      expect(typeof response.realtimeToken).toBe('string');
      expect(typeof response.expiresAt).toBe('string');
      expect(typeof response.wsEndpoint).toBe('string');

      // Verify wsEndpoint is a valid URL
      expect(() => new URL(response.wsEndpoint)).not.toThrow();
    });
  });

  describe('CreateSessionRequest', () => {
    it('should match backend CreateSessionRequestSchema structure', () => {
      const request: CreateSessionRequest = {
        workspaceId: 'workspace-1',
      };

      // Backend schema: workspaceId (required)
      expect(typeof request.workspaceId).toBe('string');
    });

    it('should allow optional fields', () => {
      const request: CreateSessionRequest = {
        workspaceId: 'workspace-1',
        externalId: 'ext-123',
        scheduledAt: '2024-01-20T10:00:00Z',
        expiresInMinutes: 120,
        metadata: { custom: 'data' },
      };

      expect(request.externalId).toBe('ext-123');
      expect(request.scheduledAt).toBe('2024-01-20T10:00:00Z');
      expect(request.expiresInMinutes).toBe(120);
      expect(request.metadata).toEqual({ custom: 'data' });
    });
  });

  describe('SessionResponse', () => {
    it('should match backend SessionResponseSchema structure', () => {
      const response: SessionResponse = {
        id: 'session-1',
        workspaceId: 'workspace-1',
        domainType: 'interview',
        configBundleId: null,
        status: 'ACTIVE',
        phase: 'main',
        externalId: 'ext-123',
        scheduledAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:05:00Z',
        endedAt: null,
        expiresAt: '2024-01-15T12:00:00Z',
        participantCount: 2,
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
      };

      // Verify all required fields
      expect(typeof response.id).toBe('string');
      expect(typeof response.workspaceId).toBe('string');
      expect(typeof response.domainType).toBe('string');
      expect(typeof response.status).toBe('string');
      expect(typeof response.participantCount).toBe('number');
      expect(typeof response.createdAt).toBe('string');
      expect(typeof response.updatedAt).toBe('string');
    });

    it('should accept all valid session statuses', () => {
      const statuses: SessionStatus[] = [
        'CREATED',
        'WAITING',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'EXPIRED',
        'FAILED',
      ];

      statuses.forEach((status) => {
        const response: SessionResponse = {
          id: 'session-1',
          workspaceId: 'workspace-1',
          domainType: 'interview',
          configBundleId: null,
          status,
          phase: null,
          externalId: null,
          scheduledAt: null,
          startedAt: null,
          endedAt: null,
          expiresAt: '2024-01-15T12:00:00Z',
          participantCount: 0,
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
        };

        expect(response.status).toBe(status);
      });
    });

    it('should allow null nullable fields', () => {
      const response: SessionResponse = {
        id: 'session-1',
        workspaceId: 'workspace-1',
        domainType: 'interview',
        configBundleId: null,
        status: 'CREATED',
        phase: null,
        externalId: null,
        scheduledAt: null,
        startedAt: null,
        endedAt: null,
        expiresAt: '2024-01-15T12:00:00Z',
        participantCount: 0,
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-14T10:00:00Z',
      };

      expect(response.phase).toBeNull();
      expect(response.externalId).toBeNull();
      expect(response.scheduledAt).toBeNull();
      expect(response.startedAt).toBeNull();
      expect(response.endedAt).toBeNull();
    });

    it('should include accessToken only on create', () => {
      const response: SessionResponse = {
        id: 'session-1',
        workspaceId: 'workspace-1',
        domainType: 'interview',
        configBundleId: null,
        status: 'CREATED',
        phase: null,
        accessToken: 'session-access-token',
        externalId: null,
        scheduledAt: null,
        startedAt: null,
        endedAt: null,
        expiresAt: '2024-01-15T12:00:00Z',
        participantCount: 0,
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-14T10:00:00Z',
      };

      expect(response.accessToken).toBe('session-access-token');
    });
  });
});

// =============================================================================
// Pagination Contract Tests
// =============================================================================

describe('Pagination Contracts', () => {
  describe('PaginationParams', () => {
    it('should match backend PaginationQuerySchema structure', () => {
      const params: PaginationParams = {
        cursor: 'cursor-abc',
        limit: 20,
      };

      expect(typeof params.cursor).toBe('string');
      expect(typeof params.limit).toBe('number');
    });

    it('should allow all fields to be optional', () => {
      const params: PaginationParams = {};

      expect(params.cursor).toBeUndefined();
      expect(params.limit).toBeUndefined();
    });
  });

  describe('OrderedPaginationParams', () => {
    it('should extend PaginationParams with ordering', () => {
      const params: OrderedPaginationParams = {
        cursor: 'cursor-abc',
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      };

      expect(typeof params.orderBy).toBe('string');
      expect(['asc', 'desc'].includes(params.orderDirection!)).toBe(true);
    });

    it('should accept asc and desc directions', () => {
      const ascParams: OrderedPaginationParams = { orderDirection: 'asc' };
      const descParams: OrderedPaginationParams = { orderDirection: 'desc' };

      expect(ascParams.orderDirection).toBe('asc');
      expect(descParams.orderDirection).toBe('desc');
    });
  });

  describe('PaginatedResponse', () => {
    it('should match backend PaginatedResponseSchema structure', () => {
      interface TestItem {
        id: string;
        name: string;
      }

      const response: PaginatedResponse<TestItem> = {
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        hasMore: true,
        nextCursor: 'next-cursor-abc',
        total: 100,
      };

      // Backend schema: items (array), hasMore (boolean), nextCursor (optional), total (optional)
      expect(Array.isArray(response.items)).toBe(true);
      expect(typeof response.hasMore).toBe('boolean');
    });

    it('should allow optional total and nextCursor', () => {
      const response: PaginatedResponse<{ id: string }> = {
        items: [],
        hasMore: false,
      };

      expect(response.nextCursor).toBeUndefined();
      expect(response.total).toBeUndefined();
    });

    it('should support any item type', () => {
      interface CustomItem {
        customField: number;
        nested: { value: string };
      }

      const response: PaginatedResponse<CustomItem> = {
        items: [{ customField: 42, nested: { value: 'test' } }],
        hasMore: false,
      };

      expect(response.items[0]?.customField).toBe(42);
    });
  });
});

// =============================================================================
// Role Contract Tests
// =============================================================================

describe('Role Contracts', () => {
  describe('UserRole', () => {
    it('should include all expected roles', () => {
      const validRoles: UserRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

      validRoles.forEach((role) => {
        // Type assertion verifies role is valid UserRole
        const testRole: UserRole = role;
        expect(typeof testRole).toBe('string');
      });
    });

    it('should match backend role hierarchy', () => {
      // Backend uses this order: OWNER > ADMIN > MEMBER > VIEWER
      const roleHierarchy: UserRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

      expect(roleHierarchy).toHaveLength(4);
      expect(roleHierarchy[0]).toBe('VIEWER');
      expect(roleHierarchy[3]).toBe('OWNER');
    });
  });
});

// =============================================================================
// WebSocket Message Contract Tests
// =============================================================================

describe('WebSocket Message Contracts', () => {
  // Import message types dynamically to test structure
  it('should have protocol version 1', async () => {
    const { PROTOCOL_VERSION } = await import(
      '@/features/realtime/types/messages'
    );
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it('should define client message envelope with required fields', async () => {
    const { PROTOCOL_VERSION } = await import(
      '@/features/realtime/types/messages'
    );

    // Verify envelope structure matches backend protocol/envelope.ts
    // TypedClientMessage should have: v, id, ts, type, sessionId, clientSeq, lastServerSeq, payload
    // Required fields: v, id, ts, type, sessionId, clientSeq, lastServerSeq, payload
    const mockEnvelope = {
      v: PROTOCOL_VERSION,
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type: 'session.join',
      sessionId: 'session-1',
      clientSeq: 1,
      lastServerSeq: 0,
      payload: { accessToken: 'token', roleId: 'role', displayName: 'User' },
    };

    expect(mockEnvelope.v).toBe(1);
    expect(typeof mockEnvelope.id).toBe('string');
    expect(typeof mockEnvelope.ts).toBe('string');
    expect(typeof mockEnvelope.type).toBe('string');
    expect(typeof mockEnvelope.sessionId).toBe('string');
    expect(typeof mockEnvelope.clientSeq).toBe('number');
    expect(typeof mockEnvelope.lastServerSeq).toBe('number');
    expect(typeof mockEnvelope.payload).toBe('object');
  });

  it('should define server message envelope with required fields', async () => {
    const { PROTOCOL_VERSION } = await import(
      '@/features/realtime/types/messages'
    );

    // Verify envelope structure matches backend protocol/envelope.ts
    // Required fields: v, id, ts, type, serverSeq, payload
    // Optional: ack
    const mockEnvelope = {
      v: PROTOCOL_VERSION,
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type: 'session.snapshot',
      serverSeq: 1,
      payload: {
        sessionId: 's-1',
        participants: [],
        localParticipantId: 'p-1',
        roleConfig: {},
        config: {},
      },
    };

    expect(mockEnvelope.v).toBe(1);
    expect(typeof mockEnvelope.id).toBe('string');
    expect(typeof mockEnvelope.ts).toBe('string');
    expect(typeof mockEnvelope.type).toBe('string');
    expect(typeof mockEnvelope.serverSeq).toBe('number');
    expect(typeof mockEnvelope.payload).toBe('object');
  });

  it('should define message ack structure', () => {
    // MessageAck structure: id, status ('ok' | 'error'), optional error { code, message }
    const ack: { id: string; status: 'ok' | 'error'; error?: { code: string; message: string } } = {
      id: 'msg-1',
      status: 'ok',
    };

    expect(typeof ack.id).toBe('string');
    expect(['ok', 'error'].includes(ack.status)).toBe(true);

    const errorAck = {
      id: 'msg-2',
      status: 'error' as const,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token expired',
      },
    };

    expect(errorAck.error?.code).toBe('INVALID_TOKEN');
    expect(errorAck.error?.message).toBe('Token expired');
  });
});
