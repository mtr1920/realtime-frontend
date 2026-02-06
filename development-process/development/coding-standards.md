# Coding Standards

## File Size Limits

| Type | Max Lines |
|------|-----------|
| All files | 600 |
| Components | 300 |
| Hooks | 200 |
| Functions | 30 |

## Component Patterns

### File Structure

```typescript
// 1. Imports (ordered)
import { useState, useTransition } from 'react';      // React
import { useQuery } from '@tanstack/react-query';     // External libs
import type { User } from '@/types';                  // Types
import { Button } from '@/shared/ui';                 // Shared
import { useAuth } from '@/features/auth';            // Features
import { useSessionStore } from '@/shared/stores';    // Stores
import { cn } from '@/shared/lib/utils';              // Utils
import './styles.css';                                // Styles

// 2. Types
interface SessionRoomProps {
  sessionId: string;
  className?: string;
}

// 3. Component (exported, named)
export function SessionRoom({ sessionId, className }: SessionRoomProps) {
  // 3a. Hooks first
  const { data } = useQuery({ ... });
  const { hasPermission } = usePermissions();

  // 3b. State
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 3c. Derived state
  const participantCount = data?.participants.length ?? 0;

  // 3d. Callbacks
  const handleJoin = () => {
    startTransition(() => setIsReady(true));
  };

  // 3e. Effects
  useEffect(() => { ... }, [dependency]);

  // 3f. Early returns
  if (!data) return <Skeleton />;

  // 3g. Render
  return (
    <div className={cn('session-room', className)}>
      {/* ... */}
    </div>
  );
}
```

### forwardRef Pattern

```typescript
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
```

## Hook Patterns

### Return Objects

```typescript
// Return object with descriptive names
return {
  audioInputs,
  selectedInput,
  setSelectedInput,
  refreshDevices,
  isLoading,
  error,
};
```

### Hook File Structure

```typescript
// 1. Imports
// 2. Types
// 3. Hook function
export function useMediaDevices() {
  // State
  // Derived values
  // Callbacks
  // Effects
  // Return
}
```

## Type Organization

| Category | Location |
|----------|----------|
| Domain types | `types/domain.ts` |
| API contracts | `types/api.ts` |
| Feature types | `features/*/types.ts` |
| Component props | Co-located |

### Type Rules

```typescript
// ❌ NEVER use any
const data: any = response;

// ✅ Use proper types
const data: SessionResponse = response;

// ❌ NEVER suppress errors
// @ts-ignore
const value = obj.unknown;

// ✅ Handle properly
const value = 'unknown' in obj ? obj.unknown : undefined;

// ❌ NEVER use index as key
items.map((item, index) => <Item key={index} />);

// ✅ Use stable identifier
items.map((item) => <Item key={item.id} />);
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SessionRoom.tsx` |
| Hooks | camelCase, use prefix | `useSession.ts` |
| Utils | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE | `MAX_PARTICIPANTS` |
| Types | PascalCase | `SessionStatus` |
| Files | kebab-case (services) | `session.service.ts` |

## React 19 Rules

### React Compiler

Don't manually memoize - the compiler handles it:

```typescript
// ❌ Don't do this in React 19
const sorted = useMemo(() => items.sort(), [items]);
const handler = useCallback(() => doThing(), []);

// ✅ Let compiler optimize
const sorted = items.sort();
const handler = () => doThing();
```

### Concurrent Features

```typescript
// Use useTransition for expensive updates
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setExpensiveState(newValue);
});

// Use useDeferredValue for expensive renders
const deferredQuery = useDeferredValue(query);
```

## Accessibility Rules

1. **Semantic HTML** - Use proper elements (`<button>`, `<nav>`, `<main>`)
2. **Keyboard navigation** - All interactive elements focusable
3. **ARIA labels** - Add when semantic meaning unclear
4. **Color contrast** - WCAG 2.1 AA minimum (4.5:1)
5. **Reduced motion** - Respect `prefers-reduced-motion`

```typescript
// ✅ Reduced motion support
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<motion.div
  animate={prefersReducedMotion ? undefined : { scale: 1.1 }}
/>
```

## Error Handling

```typescript
// Wrap components in ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <SessionRoom />
</ErrorBoundary>

// Handle async errors in queries
const { data, error, isError } = useQuery({ ... });
if (isError) return <ErrorDisplay error={error} />;
```

## Forbidden Patterns

- `any` type
- `@ts-ignore` / `@ts-expect-error`
- `console.log` in production
- Inline styles
- Hardcoded domain logic
- Hardcoded role checks
- Direct fetch() calls
- Storing server data in Zustand

## Definition of Done

```bash
# Run before committing
pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

Checklist:
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Tests pass
- [ ] No console.log
- [ ] Config-driven UI
- [ ] Role-based permissions
- [ ] Accessible
- [ ] File size limits

## Related Documentation

- [React Patterns Skill](../../.claude/skills/react-patterns/)
- [UI Component Patterns Skill](../../.claude/skills/ui-component-patterns/)
