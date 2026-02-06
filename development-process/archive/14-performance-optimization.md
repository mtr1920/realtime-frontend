---
title: "14. Performance Optimization"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 14. Performance Optimization

### 14.1 Code Splitting

```typescript
// routes/index.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Lazy load routes
const Dashboard = lazy(() => import('@/pages/DashboardPage'));
const SessionRoom = lazy(() => import('@/pages/SessionRoomPage'));
const AdminSettings = lazy(() => import('@/pages/AdminSettingsPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'session/:sessionId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SessionRoom />
          </Suspense>
        ),
      },
      {
        path: 'admin/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSettings />
          </Suspense>
        ),
      },
    ],
  },
]);
```

### 14.2 Memoization Patterns

> **React 19 Note:** With React Compiler (enabled in this project), most manual memoization
> with `useMemo`, `useCallback`, and `React.memo` is handled automatically. The Compiler
> analyzes your code and applies memoization where beneficial. Reserve manual memoization
> for truly expensive computations or cases where the Compiler cannot optimize.

```typescript
// ✅ React Compiler handles simple cases automatically - no manual memo needed
const sortedParticipants = participants
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

// ✅ Still useful: Very expensive computations the Compiler may not optimize
const expensiveResult = useMemo(() => {
  return performComplexCalculation(largeDataset); // O(n²) or heavier
}, [largeDataset]);

// ✅ Use useTransition for non-urgent updates (improves INP)
const [isPending, startTransition] = useTransition();
const handleFilter = (query: string) => {
  setInputValue(query); // Urgent: update input immediately
  startTransition(() => {
    setFilteredResults(filterLargeDataset(query)); // Non-urgent: can be deferred
  });
};

// ✅ Use useDeferredValue for expensive renders
const deferredSearchQuery = useDeferredValue(searchQuery);
const isStale = searchQuery !== deferredSearchQuery;

// ✅ Zustand selectors with useShallow for object/array stability
import { useShallow } from 'zustand/react/shallow';
const { participants, addParticipant } = useSessionStore(
  useShallow((state) => ({
    participants: Array.from(state.participants.values()),
    addParticipant: state.addParticipant,
  }))
);
```

### 14.3 Virtual Lists for Large Data

```typescript
// features/transcript/components/TranscriptPanel.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function TranscriptPanel() {
  const transcript = useTranscript();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: transcript.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TranscriptEntry entry={transcript[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---
