---
name: react-patterns
description: Use when implementing React components, hooks, or using React 19 features
---

# React Patterns

React 19 patterns and best practices for the realtime-frontend codebase.

## Overview

This skill covers React 19 features, component structure, hook composition, and performance patterns used throughout the codebase.

---

## Key Patterns

### 1. Component Structure with forwardRef

```typescript
// ✅ CORRECT - Use forwardRef for ref-forwarding
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva('base-classes', {
  variants: { variant: { default: '', primary: '' } },
  defaultVariants: { variant: 'default' },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';

// ❌ WRONG - Missing forwardRef, displayName
export function Button({ className, ...props }) {
  return <button className={className} {...props} />;
}
```

### 2. Hook Composition Pattern

```typescript
// ✅ CORRECT - Return object with descriptive names
export function useLocalMedia(options: UseLocalMediaOptions = {}): UseLocalMediaReturn {
  const { autoStart = false } = options;

  // Store access (specific selectors)
  const localStream = useMediaStore((s) => s.localStream);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);

  // Refs for mutable state
  const isCapturingRef = useRef(false);

  // useCallback for handlers passed to children
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  // useMemo for derived state
  const isSpeaking = useMemo(() => audioLevel > SPEAKING_THRESHOLD, [audioLevel]);

  // Lifecycle effects
  useEffect(() => {
    if (autoStart) startCapture();
    return () => cleanup();
  }, [autoStart]);

  return {
    localStream,
    isCapturing: isCapturingRef.current,
    isSpeaking,
    toggleAudio,
    error,
  };
}

// ❌ WRONG - Return array (hard to read), inline objects
export function useLocalMedia() {
  return [stream, setStream, toggleAudio]; // unclear what each is
}
```

### 3. useCallback and useMemo Guidelines

```typescript
// ✅ USE useCallback when:
// - Passing function to memoized child component
// - Function is a dependency of another hook
// - Function is expensive to create

const handleClick = useCallback((id: string) => {
  navigate(`/session/${id}`);
}, [navigate]);

<MemoizedChild onClick={handleClick} />

// ✅ USE useMemo when:
// - Computing derived state from props/state
// - Creating object passed to child as prop
// - Filtering/sorting large arrays

const sortedItems = useMemo(() =>
  items.slice().sort((a, b) => a.date - b.date),
  [items]
);

// ❌ DON'T USE for:
// - Simple values
// - Handlers only used in same component
// - Premature optimization

const name = useMemo(() => user.name, [user.name]); // unnecessary
```

### 4. useShallow for Store Selectors

```typescript
import { useShallow } from 'zustand/react/shallow';

// ✅ CORRECT - Prevents re-renders from object identity changes
const { messages, pendingMessages } = useChatStore(
  useShallow((s) => ({
    messages: s.messages,
    pendingMessages: s.pendingMessages,
  }))
);

// ❌ WRONG - Creates new object on every render
const state = useChatStore((s) => ({
  messages: s.messages,
  pendingMessages: s.pendingMessages,
}));
```

### 5. Ref Patterns

```typescript
// ✅ CORRECT - Use ref for values that shouldn't trigger re-render
const messageSendTimes = useRef<number[]>([]);
const prevPropsRef = useRef(props);

// Track previous values
useEffect(() => {
  prevPropsRef.current = props;
});

// Mutable tracking (rate limiting)
const checkRateLimit = () => {
  const now = Date.now();
  messageSendTimes.current = messageSendTimes.current.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );
  return messageSendTimes.current.length < MAX_MESSAGES_PER_MINUTE;
};

// ✅ CORRECT - Stable handler reference with latest value
const handlerRef = useRef(handler);
useEffect(() => {
  handlerRef.current = handler;
}, [handler]);

const stableHandler = useCallback(() => {
  handlerRef.current();
}, []);
```

### 6. Effect Cleanup

```typescript
// ✅ CORRECT - Always cleanup subscriptions, timers, listeners
useEffect(() => {
  const unsubscribe = subscribe('session.updated', handleUpdate);
  const timerId = setInterval(heartbeat, HEARTBEAT_INTERVAL);

  return () => {
    unsubscribe();
    clearInterval(timerId);
  };
}, [subscribe]);

// ✅ CORRECT - Abort controller for async operations
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(setData)
    .catch((err) => {
      if (err.name !== 'AbortError') setError(err);
    });

  return () => controller.abort();
}, []);
```

---

## React 19 Features

### 1. use() Hook (Suspense)

```typescript
// ✅ CORRECT - use() with Suspense for data fetching
import { use, Suspense } from 'react';

function SessionData({ sessionPromise }: { sessionPromise: Promise<Session> }) {
  const session = use(sessionPromise);
  return <div>{session.title}</div>;
}

<Suspense fallback={<SessionSkeleton />}>
  <SessionData sessionPromise={fetchSession(id)} />
</Suspense>
```

### 2. Actions (Form Handling)

```typescript
// ✅ CORRECT - Form actions with useActionState
import { useActionState } from 'react';

async function submitAction(prevState: State, formData: FormData) {
  const result = await createSession(Object.fromEntries(formData));
  return { success: true, data: result };
}

function CreateSessionForm() {
  const [state, formAction, isPending] = useActionState(submitAction, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

### 3. useOptimistic

```typescript
// ✅ CORRECT - Optimistic updates for instant feedback
import { useOptimistic } from 'react';

function MessageList({ messages, send }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { ...newMessage, sending: true }]
  );

  const sendMessage = async (content: string) => {
    const pending = { id: crypto.randomUUID(), content, sending: true };
    addOptimistic(pending);
    await send(content);
  };

  return optimisticMessages.map(m => <Message key={m.id} {...m} />);
}
```

---

## Component Organization

### 1. File Structure

```
components/
├── SessionRoom/
│   ├── index.ts              # Barrel export
│   ├── SessionRoom.tsx       # Main component
│   ├── SessionRoom.test.tsx  # Tests
│   ├── SessionControls.tsx   # Child component
│   └── hooks/
│       └── useSessionState.ts
```

### 2. Barrel Exports

```typescript
// ✅ CORRECT - features/session/index.ts
export { SessionRoom } from './components/SessionRoom';
export { useSession } from './hooks/useSession';
export type { SessionConfig } from './types';

// Don't export internal components
// ❌ export { SessionControls } from './components/SessionControls';
```

### 3. Props Interface Naming

```typescript
// ✅ CORRECT - ComponentNameProps
interface SessionRoomProps {
  sessionId: string;
  onLeave: () => void;
}

// ✅ CORRECT - For generic/reusable components
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
}
```

---

## Critical Rules

1. **Always use forwardRef** for components that might need refs
2. **Always set displayName** for forwardRef components
3. **Return objects from hooks**, not arrays (except useState-like patterns)
4. **Use useShallow** when selecting multiple values from Zustand
5. **Cleanup all effects** - subscriptions, timers, abort controllers
6. **Use refs for mutable values** that shouldn't trigger re-renders
7. **Memoize expensive computations** with useMemo
8. **Stable callbacks** with useCallback when passed to children

---

## Related Skills

- `zustand-state-management` - State store patterns
- `tanstack-query-patterns` - Server state management
- `ui-component-patterns` - CVA and component styling
- `testing-patterns` - Component testing
