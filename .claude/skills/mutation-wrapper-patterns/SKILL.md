---
name: mutation-wrapper-patterns
description: Use when implementing mutations with toast notifications and cache invalidation
---

# Mutation Wrapper Patterns

useMutationWithToast wrapper for consistent mutation handling.

## Overview

This skill covers the useMutationWithToast wrapper that provides consistent toast notifications, cache invalidation, and error handling for TanStack Query mutations.

---

## useMutationWithToast Implementation

```typescript
// CORRECT - Wrapper implementation
// shared/hooks/useMutationWithToast.ts
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleError } from '@/shared/errors';

interface ToastOptions {
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}

interface MutationWithToastOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  toast?: ToastOptions;
  invalidateKeys?: readonly unknown[][];
  removeKeys?: readonly unknown[][];
  onCacheUpdate?: (data: TData, queryClient: QueryClient) => void;
}

export function useMutationWithToast<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(options: MutationWithToastOptions<TData, TError, TVariables, TContext>) {
  const {
    mutationFn,
    toast: toastOptions,
    invalidateKeys = [],
    removeKeys = [],
    onCacheUpdate,
    onSuccess,
    onError,
    ...restOptions
  } = options;

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,

    onMutate: async (variables) => {
      // Show loading toast if specified
      if (toastOptions?.loadingMessage) {
        toast.loading(toastOptions.loadingMessage);
      }
      return restOptions.onMutate?.(variables);
    },

    onSuccess: (data, variables, context) => {
      // Dismiss loading toast
      toast.dismiss();

      // Show success toast
      if (toastOptions?.successMessage) {
        toast.success(toastOptions.successMessage);
      }

      // Custom cache update
      if (onCacheUpdate) {
        onCacheUpdate(data, queryClient);
      }

      // Invalidate specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Remove specified query keys
      removeKeys.forEach((key) => {
        queryClient.removeQueries({ queryKey: key });
      });

      // Call original onSuccess
      onSuccess?.(data, variables, context);
    },

    onError: (error, variables, context) => {
      // Dismiss loading toast
      toast.dismiss();

      // Handle error with custom or default message
      handleError(error, {
        message: toastOptions?.errorMessage,
        context: 'mutation',
      });

      // Call original onError
      onError?.(error, variables, context);
    },

    // Mark as handled to prevent global error handler
    meta: { skipGlobalErrorHandler: true },

    ...restOptions,
  });
}
```

---

## Basic Usage

```typescript
// CORRECT - Simple mutation with toast
export function useCreateSession(options = {}) {
  return useMutationWithToast({
    mutationFn: sessionService.create,
    toast: {
      successMessage: 'Session created successfully',
      errorMessage: 'Failed to create session',
    },
    invalidateKeys: [queryKeys.sessions.root],
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}

// Usage
const { mutateAsync: create, isPending } = useCreateSession({
  onSuccess: (session) => {
    navigate(`/sessions/${session.id}`);
  },
});
```

---

## With Loading Toast

```typescript
// CORRECT - Long-running operation with loading state
export function useExportSessions() {
  return useMutationWithToast({
    mutationFn: async (sessionIds: string[]) => {
      return sessionService.exportToCsv(sessionIds);
    },
    toast: {
      loadingMessage: 'Exporting sessions...',
      successMessage: 'Export complete! Check your downloads.',
      errorMessage: 'Export failed. Please try again.',
    },
  });
}
```

---

## With Optimistic Update

```typescript
// CORRECT - Optimistic update pattern
export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      sessionService.updateStatus(id, status),

    toast: {
      successMessage: 'Status updated',
    },

    // Optimistic update
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(id) });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<Session>(
        queryKeys.sessions.detail(id)
      );

      // Optimistically update
      if (previousSession) {
        queryClient.setQueryData(queryKeys.sessions.detail(id), {
          ...previousSession,
          status,
        });
      }

      return { previousSession };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          queryKeys.sessions.detail(id),
          context.previousSession
        );
      }
    },

    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
    },
  });
}
```

---

## With Cache Update

```typescript
// CORRECT - Direct cache update instead of invalidation
export function useMarkNotificationRead() {
  return useMutationWithToast({
    mutationFn: notificationService.markAsRead,

    // No toast for silent operations
    toast: undefined,

    // Update cache directly for instant UI update
    onCacheUpdate: (data, queryClient) => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all(),
        (old) =>
          old?.map((n) =>
            n.id === data.id ? { ...n, readAt: new Date().toISOString() } : n
          )
      );
    },
  });
}
```

---

## Delete with Confirmation

```typescript
// CORRECT - Delete mutation with removal
export function useDeleteSession() {
  return useMutationWithToast({
    mutationFn: sessionService.delete,

    toast: {
      successMessage: 'Session deleted',
      errorMessage: 'Failed to delete session',
    },

    // Remove from cache immediately
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      });
    },

    // Invalidate list to remove from listing
    invalidateKeys: [queryKeys.sessions.root],
  });
}

// Usage with confirmation dialog
function DeleteSessionButton({ session }: { session: Session }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutateAsync: deleteSession, isPending } = useDeleteSession();

  const handleDelete = async () => {
    await deleteSession(session.id);
    setShowConfirm(false);
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Delete
      </Button>

      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Session"
        description={`Are you sure you want to delete "${session.title}"?`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        isLoading={isPending}
      />
    </>
  );
}
```

---

## Bulk Operations

```typescript
// CORRECT - Bulk mutation with progress
export function useBulkDeleteSessions() {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: async (sessionIds: string[]) => {
      const results = await Promise.allSettled(
        sessionIds.map((id) => sessionService.delete(id))
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`${failed} of ${sessionIds.length} deletions failed`);
      }

      return { succeeded, failed };
    },

    toast: {
      loadingMessage: 'Deleting sessions...',
      successMessage: 'Sessions deleted successfully',
    },

    // Remove all from cache
    onSuccess: (_, sessionIds) => {
      sessionIds.forEach((id) => {
        queryClient.removeQueries({
          queryKey: queryKeys.sessions.detail(id),
        });
      });
    },

    invalidateKeys: [queryKeys.sessions.root],
  });
}
```

---

## Silent Mutations

```typescript
// CORRECT - Background mutation without toast
export function useTrackActivity() {
  return useMutationWithToast({
    mutationFn: activityService.track,
    // No toast options = silent
    toast: undefined,
    // No invalidation needed for analytics
  });
}

// CORRECT - Custom error handling only
export function useAutoSaveDraft() {
  return useMutationWithToast({
    mutationFn: sessionService.saveDraft,
    toast: {
      // Only show error, not success
      errorMessage: 'Failed to save draft',
    },
    // Custom success behavior
    onSuccess: () => {
      console.debug('Draft saved');
    },
  });
}
```

---

## Form Integration

```typescript
// CORRECT - Integration with form submission
function CreateSessionForm() {
  const navigate = useNavigate();

  const {
    mutateAsync: create,
    isPending,
    error,
  } = useCreateSession({
    onSuccess: (session) => {
      navigate(`/sessions/${session.id}`);
    },
  });

  const form = useForm<CreateSessionInput>({
    resolver: zodResolver(createSessionSchema),
  });

  const onSubmit = async (data: CreateSessionInput) => {
    try {
      await create(data);
      // Navigation happens in onSuccess
    } catch {
      // Error already handled by useMutationWithToast
      // Form stays open for retry
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Session'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Return Value Pattern

```typescript
// CORRECT - Consistent return naming
export function useCreateSession(options = {}) {
  const mutation = useMutationWithToast({
    mutationFn: sessionService.create,
    ...options,
  });

  return {
    create: mutation.mutateAsync,      // Async function
    createSync: mutation.mutate,       // Fire-and-forget
    isPending: mutation.isPending,     // Loading state
    isError: mutation.isError,         // Error state
    error: mutation.error,             // Error object
    reset: mutation.reset,             // Reset state
  };
}
```

---

## Critical Rules

1. **Always use useMutationWithToast** for user-initiated mutations
2. **Provide toast messages** for feedback - success at minimum
3. **Invalidate related queries** to keep cache fresh
4. **Handle errors gracefully** - wrapper handles via handleError
5. **Use loadingMessage** for long operations (>1s)
6. **Silent mutations** for background ops (analytics, autosave)
7. **Return isPending** for loading states in UI
8. **Wrap mutateAsync** with descriptive name (create, update, delete)

---

## Related Skills

- `tanstack-query-patterns` - Query patterns
- `error-handling` - Error management
- `api-service-patterns` - Service layer
