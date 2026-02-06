# API Integration Plan

## Overview

This plan outlines the integration of backend APIs into the frontend dashboard. The APIs follow multi-tenant patterns with JWT authentication and cursor-based pagination.

---

## Phase 2: Sessions API Integration (HIGH PRIORITY)

### Files to Create

```
apps/web/src/
├── features/sessions/
│   ├── api/
│   │   └── sessions.service.ts       # API client service
│   ├── hooks/
│   │   ├── useSessions.ts            # List sessions (with filters)
│   │   ├── useSession.ts             # Get single session
│   │   ├── useCreateSession.ts       # Create session mutation
│   │   ├── useJoinSession.ts         # Join session mutation
│   │   └── useCompleteSession.ts     # Complete session mutation
│   ├── components/
│   │   ├── SessionCard.tsx           # Session preview card
│   │   ├── SessionsTable.tsx         # Sessions data table
│   │   ├── SessionStatusBadge.tsx    # Status indicator
│   │   ├── CreateSessionDialog.tsx   # Creation modal
│   │   └── SessionFilters.tsx        # Filter controls
│   ├── schemas/
│   │   └── session.schema.ts         # Zod validation schemas
│   └── index.ts                      # Public exports
├── pages/
│   ├── SessionsPage.tsx              # Update with API integration
│   └── SessionDetailPage.tsx         # Session details view
```

### Session API Service

```typescript
// sessions.service.ts
interface SessionsService {
  list(params: SessionListParams): Promise<PaginatedResponse<Session>>
  get(id: string): Promise<Session>
  create(data: CreateSessionInput): Promise<Session>
  join(data: JoinSessionInput): Promise<JoinSessionResponse>
  complete(id: string): Promise<Session>
}

// Types
interface SessionListParams {
  workspaceId?: string;
  status?: SessionStatus;
  cursor?: string;
  limit?: number;
}

interface CreateSessionInput {
  workspaceId: string;
  externalId?: string;
  scheduledAt?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

interface JoinSessionInput {
  accessToken: string;
  roleId: string;
  displayName: string;
  userId?: string;
}
```

### Session Status Types

```typescript
type SessionStatus =
  | 'CREATED'
  | 'WAITING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED';
```

### Query Keys

```typescript
// Add to shared/services/query-keys.ts
export const queryKeys = {
  sessions: {
    all: () => ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all(), 'list'] as const,
    list: (filters: SessionListParams) => [...queryKeys.sessions.lists(), filters] as const,
    details: () => [...queryKeys.sessions.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },
  // ... existing keys
};
```

---

## Phase 3: Workspaces API Integration

### Files to Create

```
apps/web/src/
├── features/workspaces/
│   ├── api/
│   │   └── workspaces.service.ts
│   ├── hooks/
│   │   ├── useWorkspaces.ts
│   │   ├── useWorkspace.ts
│   │   ├── useCreateWorkspace.ts
│   │   ├── useUpdateWorkspace.ts
│   │   └── useDeleteWorkspace.ts
│   ├── components/
│   │   ├── WorkspaceCard.tsx
│   │   ├── WorkspacesGrid.tsx
│   │   ├── CreateWorkspaceDialog.tsx
│   │   └── WorkspaceSettings.tsx
│   ├── schemas/
│   │   └── workspace.schema.ts
│   └── index.ts
├── pages/
│   ├── WorkspacesPage.tsx            # Update with API
│   └── WorkspaceDetailPage.tsx
```

### Workspace API Service

```typescript
interface WorkspacesService {
  list(params: WorkspaceListParams): Promise<PaginatedResponse<Workspace>>
  get(id: string): Promise<Workspace>
  create(data: CreateWorkspaceInput): Promise<Workspace>
  update(id: string, data: UpdateWorkspaceInput): Promise<Workspace>
  delete(id: string): Promise<void>
}

interface WorkspaceListParams {
  cursor?: string;
  limit?: number;
  domainType?: string;
  configId?: string;
  search?: string;
  orderBy?: 'createdAt' | 'name';
  orderDirection?: 'asc' | 'desc';
}
```

---

## Phase 4: Users API Integration

### Files to Create

```
apps/web/src/
├── features/users/
│   ├── api/
│   │   └── users.service.ts
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── useUser.ts
│   │   ├── useCreateUser.ts
│   │   ├── useUpdateUser.ts
│   │   ├── useDeleteUser.ts
│   │   └── useUpdatePassword.ts
│   ├── components/
│   │   ├── UserCard.tsx
│   │   ├── UsersTable.tsx
│   │   ├── InviteUserDialog.tsx
│   │   ├── UserRoleBadge.tsx
│   │   └── UserStatusBadge.tsx
│   ├── schemas/
│   │   └── user.schema.ts
│   └── index.ts
├── pages/
│   ├── UsersPage.tsx                 # Update with API
│   └── UserDetailPage.tsx
```

### Users API Service

```typescript
interface UsersService {
  list(params: UserListParams): Promise<PaginatedResponse<User>>
  get(id: string): Promise<User>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: UpdateUserInput): Promise<User>
  delete(id: string): Promise<void>
  updatePassword(id: string, password: string): Promise<void>
}

interface UserListParams {
  cursor?: string;
  limit?: number;
  status?: UserStatus;
  email?: string;
  search?: string;
  orderBy?: 'createdAt' | 'email' | 'name';
  orderDirection?: 'asc' | 'desc';
}
```

---

## Phase 5: Domain Configs API Integration

### Files to Create

```
apps/web/src/
├── features/domain-configs/
│   ├── api/
│   │   └── domain-configs.service.ts
│   ├── hooks/
│   │   ├── useDomainConfigs.ts
│   │   ├── useDomainConfig.ts
│   │   ├── useCreateDomainConfig.ts
│   │   ├── useUpdateDomainConfig.ts
│   │   └── useSetDefaultDomainConfig.ts
│   ├── components/
│   │   ├── DomainConfigCard.tsx
│   │   ├── DomainConfigsList.tsx
│   │   ├── DomainConfigEditor.tsx     # JSON/Form editor
│   │   └── DomainTypeBadge.tsx
│   ├── schemas/
│   │   └── domain-config.schema.ts
│   └── index.ts
├── pages/
│   └── admin/
│       ├── DomainConfigsPage.tsx
│       └── DomainConfigEditorPage.tsx
```

---

## Phase 6: Outcomes API Integration

### Files to Create

```
apps/web/src/
├── features/outcomes/
│   ├── api/
│   │   └── outcomes.service.ts
│   ├── hooks/
│   │   ├── useOutcomes.ts
│   │   ├── useOutcome.ts
│   │   └── useOutcomeArtifacts.ts
│   ├── components/
│   │   ├── OutcomePanel.tsx
│   │   ├── OutcomeCard.tsx
│   │   ├── EvaluationSummary.tsx
│   │   └── OutcomeArtifacts.tsx
│   ├── schemas/
│   │   └── outcome.schema.ts
│   └── index.ts
├── pages/
│   └── admin/
│       ├── OutcomesPage.tsx
│       └── OutcomeDetailPage.tsx
```

### Outcomes API Service

```typescript
interface OutcomesService {
  list(sessionId: string): Promise<Outcome[]>
  get(id: string): Promise<Outcome>
  artifacts(sessionId: string): Promise<OutcomeArtifact[]>
}
```

---

## Phase 7: Integrations API Integration

### Files to Create

```
apps/web/src/
├── features/integrations/
│   ├── api/
│   │   └── integrations.service.ts
│   ├── hooks/
│   │   ├── useConnectors.ts
│   │   ├── useCreateConnector.ts
│   │   ├── useUpdateConnector.ts
│   │   └── useSyncHistory.ts
│   ├── components/
│   │   ├── ConnectorCard.tsx
│   │   ├── ConnectorForm.tsx
│   │   └── SyncStatusTable.tsx
│   ├── schemas/
│   │   └── connector.schema.ts
│   └── index.ts
├── pages/
│   └── admin/
│       └── IntegrationsPage.tsx
```

### Integrations API Service

```typescript
interface IntegrationsService {
  list(): Promise<IntegrationConnector[]>
  create(data: CreateConnectorInput): Promise<IntegrationConnector>
  update(id: string, data: UpdateConnectorInput): Promise<IntegrationConnector>
  deliveries(connectorId: string): Promise<IntegrationDelivery[]>
}
```

## Shared Infrastructure

### Update API Client

```typescript
// shared/services/api-client.ts
// Already exists - ensure it supports:
// - JWT Bearer token injection
// - Error handling with ApiError class
// - Request/response interceptors
```

### Add Pagination Types

```typescript
// types/api.ts (already has some)
interface CursorPagination {
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: CursorPagination;
}
```

### Create DataTable Component

```typescript
// shared/components/DataTable.tsx
// Reusable table with:
// - Sorting
// - Pagination (cursor-based)
// - Loading states
// - Empty states
// - Row selection (optional)
```

### Create Pagination Component

```typescript
// shared/components/Pagination.tsx
// - Load more button (cursor-based)
// - Optional infinite scroll
```

---

## Implementation Order

### Week 1: Sessions Feature
1. [ ] Create sessions.service.ts
2. [ ] Create session hooks (useSessions, useSession, mutations)
3. [ ] Create SessionCard, SessionsTable components
4. [ ] Update SessionsPage with real data
5. [ ] Create CreateSessionDialog
6. [ ] Create SessionDetailPage

### Week 2: Workspaces Feature
1. [ ] Create workspaces.service.ts
2. [ ] Create workspace hooks
3. [ ] Create WorkspaceCard, WorkspacesGrid components
4. [ ] Update WorkspacesPage with real data
5. [ ] Create CreateWorkspaceDialog
6. [ ] Create WorkspaceDetailPage with settings

### Week 3: Users Feature
1. [ ] Create users.service.ts
2. [ ] Create user hooks
3. [ ] Create UsersTable, UserCard components
4. [ ] Update UsersPage with real data
5. [ ] Create InviteUserDialog
6. [ ] Create UserDetailPage

### Week 4: Domain Configs & Dashboard Stats
1. [ ] Create domain-configs.service.ts
2. [ ] Create domain config hooks
3. [ ] Create DomainConfigsList, Editor components
4. [ ] Update AdminPage with DomainConfigs
5. [ ] Add real stats to DashboardPage
6. [ ] Create dashboard stats API integration

### Week 5: Outcomes Feature
1. [ ] Create outcomes.service.ts
2. [ ] Create outcomes hooks (useOutcomes, useOutcome, artifacts)
3. [ ] Create OutcomeCard, OutcomePanel components
4. [ ] Create OutcomeDetailPage with artifacts
5. [ ] Add outcome visibility gating by role

### Week 6: Integrations Feature
1. [ ] Create integrations.service.ts
2. [ ] Create connector hooks (list/create/update)
3. [ ] Create ConnectorForm and ConnectorCard components
4. [ ] Create SyncStatusTable
5. [ ] Update AdminPage with Integrations

---

## Dashboard Stats Implementation

The dashboard needs real data for:
- Active sessions count
- Total workspaces
- Team members count
- Sessions this week

Options:
1. **Aggregate from existing APIs**: Make multiple calls (list sessions, list workspaces, list users)
2. **Create dedicated stats endpoint**: Ask backend team to add `/api/v1/stats` endpoint

For now, aggregate from existing APIs:

```typescript
// features/dashboard/hooks/useDashboardStats.ts
export function useDashboardStats() {
  const { data: sessions } = useSessions({ status: 'ACTIVE', limit: 1 });
  const { data: workspaces } = useWorkspaces({ limit: 1 });
  const { data: users } = useUsers({ limit: 1 });

  return {
    activeSessions: sessions?.pagination.total ?? 0,
    totalWorkspaces: workspaces?.pagination.total ?? 0,
    teamMembers: users?.pagination.total ?? 0,
    isLoading: // ...
  };
}
```

---

## Error Handling Patterns

### API Error Handling

```typescript
// In hooks
const mutation = useMutation({
  mutationFn: sessionsService.create,
  onError: (error) => {
    if (error instanceof ApiError) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
    toast.success('Session created successfully');
  },
});
```

### Loading States

- Use Skeleton components for loading
- Disable forms during mutation
- Show loading spinners on buttons

### Empty States

- Custom empty state per feature
- Include CTA to create first item
- Use illustration/icon

---

## Testing Strategy

### Unit Tests
- Service classes (mocked fetch)
- Hook return values (React Query testing patterns)
- Component rendering

### Integration Tests
- API calls with MSW mocks
- Form submissions
- Error scenarios

### E2E Tests
- Full user flows (create session → join → complete)
- Navigation between pages
- Permission-based UI

---

## File Size Guidelines

| Component Type | Max Lines |
|---------------|-----------|
| Service file | 200 |
| Hook file | 150 |
| Page component | 300 |
| Feature component | 200 |
| Form component | 250 |

---

## Notes

1. **Cursor-based pagination**: Don't show page numbers, use "Load more" pattern
2. **Optimistic updates**: Implement for create/update/delete operations
3. **Cache invalidation**: Invalidate related queries on mutations
4. **Real-time updates**: Consider WebSocket integration later for session status changes
5. **Error boundaries**: Wrap feature pages in error boundaries
