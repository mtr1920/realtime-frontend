# Codebase Refactoring Plan

**Status:** Ready for Implementation
**Created:** 2026-01-29
**Target:** Production-ready, maintainable frontend

---

## Executive Summary

This plan transforms the codebase into a production-ready, maintainable system by:
1. Removing dead/duplicate code
2. Consolidating duplicate patterns into shared components
3. Fixing Zustand store architecture violations
4. Decomposing oversized files
5. Enforcing consistent coding standards

**Total Impact**: ~500 lines removed, 20+ components consolidated, architecture compliance

---

## Audit Findings

### Dead Code & Duplicates

| Issue | Location | Action |
|-------|----------|--------|
| Duplicate `useLogout` hook | `features/auth/hooks/` vs `shared/hooks/` | DELETE features version |
| Duplicate sidebar state | `useUIStore` duplicates `useSidebarStore` | REMOVE from UIStore |
| Missing middleware | `useSidebarStore` lacks immer + subscribeWithSelector | ADD middleware |

### Architecture Violations (Server State in Zustand)

Per CLAUDE.md: "NEVER mix server data in Zustand"

| Store | Issue | Priority |
|-------|-------|----------|
| `useChatStore` | Unbounded array growth | P1 - Fix now |
| `useComplianceHistoryStore` | Holds server data | P2 - Defer |
| `useTranscriptStore` | Holds server data | P2 - Defer |

### File Size Violations (Limit: 300 lines for components)

| File | Current | Over Limit | Priority |
|------|---------|------------|----------|
| `SessionRoomPage.tsx` | 880 | 580 | P2 |
| `SessionWizard.tsx` | 726 | 426 | P2 |
| `AIActorForm.tsx` | 631 | 331 | P2 |
| `SessionOverviewTab.tsx` | 524 | 224 | P3 |

### Duplicate Patterns (~2800 lines of boilerplate)

| Pattern | Count | Potential Savings |
|---------|-------|-------------------|
| Loading button pattern | 51 instances | ~200 lines |
| Form field + error display | 300+ fields | ~1500 lines |
| Confirmation dialogs | 3+ dialogs | ~180 lines |
| Form dialogs | 7+ dialogs | ~350 lines |
| Status badges | 15+ instances | ~200 lines |
| Error display patterns | 22+ instances | ~150 lines |

---

## Phase 1: Dead Code & Duplicate Removal

**Risk**: Low
**Effort**: 2 hours
**Success Criteria**: Zero unused exports, no duplicate hooks

### 1.1 Remove Duplicate useLogout Hook

**Files**:
- DELETE: `apps/web/src/features/auth/hooks/useLogout.ts`
- CHECK: `apps/web/src/features/auth/hooks/index.ts` (remove export if present)

**Reasoning**: Both implementations are identical; only import path differs. Keep shared version.

### 1.2 Remove Duplicate Sidebar State from useUIStore

**File**: `apps/web/src/shared/stores/ui.store.ts`

**Remove**:
- State: `isSidebarOpen`, `isSidebarCollapsed`
- Actions: `toggleSidebar()`, `setSidebarOpen()`, `setSidebarCollapsed()`
- From `partialize`: `isSidebarCollapsed`

**Also Update**: `apps/web/src/shared/stores/ui.store.test.ts` (remove sidebar tests)

### 1.3 Fix useSidebarStore Middleware

**File**: `apps/web/src/shared/stores/sidebar.store.ts`

**Change From**:
```typescript
create<SidebarState>()(
  persist((set) => ({ ... }), { ... })
)
```

**Change To**:
```typescript
create<SidebarState>()(
  subscribeWithSelector(
    immer(
      persist((set) => ({ ... }), { ... })
    )
  )
)
```

### 1.4 Verification

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

---

## Phase 2: Zustand Store Cleanup

**Risk**: Medium
**Effort**: 2 hours
**Success Criteria**: Buffer limits added, architecture compliant

### 2.1 Add Buffer Limits to useChatStore

**File**: `apps/web/src/features/chat/stores/chat.store.ts`

**Add**:
```typescript
const MAX_MESSAGES = 500;

addMessage: (message) =>
  set((state) => {
    state.messages.push(message);
    if (state.messages.length > MAX_MESSAGES) {
      state.messages = state.messages.slice(-MAX_MESSAGES);
    }
  }),
```

**Test File**: `apps/web/src/features/chat/stores/chat.store.test.ts`

Add test for buffer behavior.

### 2.2 DEFERRED: Server State Migration

The following are deferred to a dedicated sprint due to high risk:
- `useComplianceHistoryStore` → TanStack Query
- `useTranscriptStore` → TanStack Query

See backlog.md for tracking.

---

## Phase 3: Shared Component Creation

**Risk**: Low
**Effort**: 4 hours
**Success Criteria**: 5 new reusable components created

### 3.1 Create SubmitButton Component

**File**: `apps/web/src/shared/components/SubmitButton.tsx`

```typescript
interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}
```

**Replaces** 51 instances of:
```typescript
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
  Submit
</Button>
```

### 3.2 Create ConfirmationDialog Component

**File**: `apps/web/src/shared/components/ConfirmationDialog.tsx`

```typescript
interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}
```

### 3.3 Create FormDialog Component

**File**: `apps/web/src/shared/components/FormDialog.tsx`

```typescript
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### 3.4 Create StatusBadge Component

**File**: `apps/web/src/shared/components/StatusBadge.tsx`

```typescript
interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, {
    label: string;
    variant: BadgeVariant;
    icon?: React.ReactNode
  }>;
}
```

### 3.5 Create ErrorAlert Component

**File**: `apps/web/src/shared/components/ErrorAlert.tsx`

```typescript
interface ErrorAlertProps {
  error: string | null;
  className?: string;
}
```

### 3.6 Update Index

**File**: `apps/web/src/shared/components/index.ts`

Export all new components.

---

## Phase 4: Dialog Refactoring

**Risk**: Medium
**Effort**: 4 hours
**Success Criteria**: ~400 lines removed from dialog files

### 4.1 Refactor Confirmation Dialogs

| Dialog | File | Savings |
|--------|------|---------|
| DeleteSessionDialog | `features/sessions/components/actions/DeleteSessionDialog.tsx` | ~50 lines |
| CancelSessionDialog | `features/sessions/components/actions/CancelSessionDialog.tsx` | ~75 lines |
| DeleteConnectorDialog | `features/integrations/components/DeleteConnectorDialog.tsx` | ~37 lines |

### 4.2 Refactor Form Dialogs (3 High-Value Targets)

| Dialog | File | Savings |
|--------|------|---------|
| InviteUserDialog | `features/users/components/InviteUserDialog.tsx` | ~56 lines |
| WorkspaceDialog | `features/workspaces/components/WorkspaceDialog.tsx` | ~67 lines |
| ApiKeyDialog | `features/api-keys/components/ApiKeyDialog.tsx` | ~50 lines |

### 4.3 Apply SubmitButton

Replace loading button pattern in remaining 40+ locations.

### 4.4 Verification

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
pnpm test:web:e2e --project=chromium
```

---

## Phase 5: Large File Decomposition

**Risk**: Higher
**Effort**: 8 hours
**Success Criteria**: All components under 300 lines

### 5.1 Decompose SessionRoomPage.tsx (880 → ~80 lines)

**Create**:
- `features/sessions/components/room/SessionRoomContent.tsx` (~400 lines)
- `features/sessions/hooks/useSessionRoom.ts` (~200 lines)
- `features/sessions/utils/sessionRoomHelpers.ts` (~100 lines)

**Keep**: `pages/SessionRoomPage.tsx` as thin wrapper (~80 lines)

### 5.2 Decompose SessionWizard.tsx (726 → ~100 lines)

**Create**:
- `features/sessions/components/wizard/steps/WizardStepBasicInfo.tsx`
- `features/sessions/components/wizard/steps/WizardStepParticipants.tsx`
- `features/sessions/components/wizard/steps/WizardStepConfiguration.tsx`
- `features/sessions/components/wizard/steps/WizardStepReview.tsx`
- `features/sessions/hooks/useSessionWizard.ts`

### 5.3 Decompose AIActorForm.tsx (631 → ~150 lines)

**Create**:
- `features/ai/components/AIActorFormFields.tsx` (~250 lines)
- `features/ai/hooks/useAIActorForm.ts` (~200 lines)

### 5.4 Verification

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
pnpm test:web:e2e --project=chromium
```

---

## Phase 6: Final Cleanup & Standards

**Risk**: Low
**Effort**: 2 hours
**Success Criteria**: Lint clean, tests pass, documentation updated

### 6.1 Coding Standards Verification

- [ ] No `any` types (use `unknown` with type guards)
- [ ] All components have proper TypeScript interfaces
- [ ] File size limits respected (components < 300 lines)
- [ ] Import order follows CLAUDE.md specification
- [ ] No console.log or debug code
- [ ] Config-driven UI (no hardcoded domain logic)
- [ ] Role-based permissions (no hardcoded role checks)

### 6.2 Update Tracker

- Update `tracker/tasks.md` with completed work
- Update `tracker/changelog.md` with changes
- Update `tracker/metrics.md` if test counts changed

### 6.3 Final Verification

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web && pnpm test:web:e2e
```

---

## Execution Schedule

| Phase | Dependencies | Effort |
|-------|--------------|--------|
| 1: Dead Code Removal | None | 2 hours |
| 2: Zustand Cleanup | Phase 1 | 2 hours |
| 3: Shared Components | Phase 1 | 4 hours |
| 4: Dialog Refactoring | Phase 3 | 4 hours |
| 5: File Decomposition | Phases 1-4 | 8 hours |
| 6: Final Cleanup | Phase 5 | 2 hours |

**Total**: ~22 hours

---

## Guardrails

1. **Read before modify**: Always read existing files before proposing changes
2. **No scope creep**: Only remove/consolidate - no new features
3. **No dead code**: Remove completely, don't comment out
4. **Zero duplicates**: Final state has no duplicate components or logic
5. **Verify after each phase**: Run full test suite before proceeding
6. **Preserve functionality**: All changes must maintain existing behavior

---

## Critical Files Summary

### Phase 1 (Delete/Modify)
- DELETE: `apps/web/src/features/auth/hooks/useLogout.ts`
- MODIFY: `apps/web/src/shared/stores/ui.store.ts`
- MODIFY: `apps/web/src/shared/stores/sidebar.store.ts`

### Phase 2 (Modify)
- MODIFY: `apps/web/src/features/chat/stores/chat.store.ts`

### Phase 3 (Create)
- CREATE: `apps/web/src/shared/components/SubmitButton.tsx`
- CREATE: `apps/web/src/shared/components/ConfirmationDialog.tsx`
- CREATE: `apps/web/src/shared/components/FormDialog.tsx`
- CREATE: `apps/web/src/shared/components/StatusBadge.tsx`
- CREATE: `apps/web/src/shared/components/ErrorAlert.tsx`

### Phase 4 (Refactor)
- REFACTOR: `apps/web/src/features/sessions/components/actions/DeleteSessionDialog.tsx`
- REFACTOR: `apps/web/src/features/sessions/components/actions/CancelSessionDialog.tsx`
- REFACTOR: `apps/web/src/features/integrations/components/DeleteConnectorDialog.tsx`
- REFACTOR: `apps/web/src/features/users/components/InviteUserDialog.tsx`
- REFACTOR: `apps/web/src/features/workspaces/components/WorkspaceDialog.tsx`
- REFACTOR: `apps/web/src/features/api-keys/components/ApiKeyDialog.tsx`

### Phase 5 (Decompose)
- DECOMPOSE: `apps/web/src/pages/SessionRoomPage.tsx`
- DECOMPOSE: `apps/web/src/features/sessions/components/wizard/SessionWizard.tsx`
- DECOMPOSE: `apps/web/src/features/ai/components/AIActorForm.tsx`

---

## Deferred Items

These items require dedicated sprints due to complexity:

| Item | Reason | Target |
|------|--------|--------|
| Migrate `useComplianceHistoryStore` to TanStack Query | High-risk, affects compliance flows | Phase 12+ |
| Migrate `useTranscriptStore` to TanStack Query | Complex WebSocket coordination | Phase 12+ |
| `SessionOverviewTab.tsx` decomposition | Lower priority (524 lines) | Phase 12+ |

---

*Last Updated: 2026-01-29*
