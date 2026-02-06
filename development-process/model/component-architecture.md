# Component Architecture

## Component Categories

| Category | Description | Location | Examples |
|----------|-------------|----------|----------|
| **Primitives** | Unstyled, accessible Radix wrappers | `@realtime/ui/primitives` | Dialog, Popover, Tooltip |
| **UI Components** | Styled, reusable components | `@realtime/ui/components` | Button, Card, Input |
| **Feature Components** | Domain-specific components | `features/*/components` | VideoTile, TranscriptEntry |
| **Layout Components** | Page structure | `shared/components` | Sidebar, Header, PageLayout |
| **Composite Components** | Feature combinations | `pages/*` | SessionRoom, AdminDashboard |

## @realtime/ui Package

### Structure

```
packages/ui/src/
├── themes/
│   ├── tokens.ts           # CSS variable names
│   ├── colors.ts           # Color palette
│   ├── spacing.ts          # Spacing scale
│   ├── typography.ts       # Font tokens
│   └── variants.ts         # CVA shared variants
├── primitives/
│   ├── dialog.tsx
│   ├── popover.tsx
│   ├── tooltip.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── collapsible.tsx
│   ├── alert-dialog.tsx
│   └── scroll-area.tsx
├── components/
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── label.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── skeleton.tsx
│   ├── checkbox.tsx
│   ├── switch.tsx
│   ├── textarea.tsx
│   ├── slider.tsx
│   ├── radio-group.tsx
│   ├── progress.tsx
│   ├── separator.tsx
│   ├── alert.tsx
│   ├── table.tsx
│   └── command.tsx
├── hooks/
│   ├── useClipboard.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
└── index.ts                # Main export
```

### Import Patterns

```typescript
// Recommended: Main barrel export
import { Button, Dialog, useClipboard, colorTokens } from '@realtime/ui';

// Layer-specific imports (tree-shaking)
import { Dialog, Popover } from '@realtime/ui/primitives';
import { Button, Card } from '@realtime/ui/components';
import { useDebounce } from '@realtime/ui/hooks';
import { colors, spacing } from '@realtime/ui/themes';
```

### Crystalline Card System

The Card component includes a `crystalline` variant for entity cards with status indicators, hover effects, and staggered animations.

**Components:**
- `Card` - Base container with `variant="crystalline"` option
- `CardStripe` - Left status indicator stripe
- `CardAccent` - Diagonal top-left geometric accent
- `CardCorner` - Bottom-right subtle corner accent

**Usage:**
```typescript
import { Card, CardStripe, CardAccent, CardCorner, type StatusGradient } from '@realtime/ui';

const statusConfig: StatusGradient = {
  gradient: 'from-emerald-400 to-teal-500',
  glow: 'shadow-emerald-500/20',
  ring: 'ring-emerald-400/30',
};

<Card variant="crystalline" status={statusConfig} staggerIndex={index} isHovered={isHovered}>
  <CardAccent gradient={statusConfig.gradient} isHovered={isHovered} />
  <CardStripe gradient={statusConfig.gradient} isHovered={isHovered} />
  <div className="relative p-6 pl-7">{/* Content */}</div>
  <CardCorner />
</Card>
```

**Implementations:**
- `SessionCard` - 7-state status (CREATED, WAITING, ACTIVE, etc.)
- `WorkspaceCard` - 2-state status (active/inactive)
- `AdminCard` - Static gradient, navigation-only

## Component Patterns

### forwardRef Pattern

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
```

### Feature Component Pattern

```typescript
// features/session/components/ParticipantList.tsx
import { useSessionStore } from '@/shared/stores';
import { useSessionConfig } from '../hooks/useSessionConfig';
import { Avatar, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface ParticipantListProps {
  className?: string;
  showRoles?: boolean;
}

export function ParticipantList({ className, showRoles = true }: ParticipantListProps) {
  const participants = useSessionStore((s) => Array.from(s.participants.values()));
  const myId = useSessionStore((s) => s.myParticipantId);
  const { getRoleDefinition } = useSessionConfig();

  return (
    <div className={cn('space-y-2', className)}>
      {participants.map((p) => (
        <ParticipantItem
          key={p.id}
          participant={p}
          isMe={p.id === myId}
          role={showRoles ? getRoleDefinition(p.roleId) : undefined}
        />
      ))}
    </div>
  );
}
```

### Discriminated Unions for Variants

```typescript
interface BaseCardProps {
  className?: string;
}

interface LoadingCard extends BaseCardProps {
  status: 'loading';
}

interface ErrorCard extends BaseCardProps {
  status: 'error';
  message: string;
  onRetry?: () => void;
}

interface SuccessCard extends BaseCardProps {
  status: 'success';
  data: CardData;
}

type CardProps = LoadingCard | ErrorCard | SuccessCard;

function StatusCard(props: CardProps) {
  switch (props.status) {
    case 'loading':
      return <LoadingSkeleton className={props.className} />;
    case 'error':
      return <ErrorDisplay message={props.message} onRetry={props.onRetry} />;
    case 'success':
      return <CardContent data={props.data} className={props.className} />;
  }
}
```

## Page Components

Pages are route-level components in `pages/` directory:

```
pages/
├── HomePage.tsx
├── LoginPage.tsx
├── DashboardPage.tsx
├── SessionsPage.tsx
├── SessionLobbyPage.tsx
├── SessionRoomPage.tsx
├── UsersPage.tsx
├── WorkspacesPage.tsx
├── DomainConfigsPage.tsx
├── WebhooksPage.tsx
├── ApiKeysPage.tsx
├── AuditLogsPage.tsx
├── TenantSettingsPage.tsx
├── OutcomesPage.tsx
├── IntegrationsPage.tsx
└── NotFoundPage.tsx
```

### Page Pattern

```typescript
// pages/SessionsPage.tsx
import { Suspense } from 'react';
import { SessionsTable } from '@/features/session';
import { CreateSessionDialog } from '@/features/session';
import { PageHeader } from '@/shared/components';
import { Skeleton } from '@/shared/ui';

export function SessionsPage() {
  return (
    <div className="container py-6">
      <PageHeader
        title="Sessions"
        action={<CreateSessionDialog />}
      />
      <Suspense fallback={<TableSkeleton />}>
        <SessionsTable />
      </Suspense>
    </div>
  );
}
```

## Routes Configuration

Routes are defined using TanStack Router in `app/router/`:

```typescript
// app/router/routes.tsx
import { createFileRoute } from '@tanstack/react-router';

// Public routes
export const LoginRoute = createFileRoute('/login')({
  component: () => <LoginPage />,
});

// Protected routes with loader
export const SessionsRoute = createFileRoute('/sessions')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => <SessionsPage />,
});

// Dynamic routes
export const SessionRoomRoute = createFileRoute('/session/$sessionId')({
  loader: ({ params }) => sessionLoader(params.sessionId),
  component: () => <SessionRoomPage />,
  errorComponent: () => <SessionError />,
});
```

## Layout Components

```typescript
// app/layouts/RootLayout.tsx
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1">
        <Header />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// app/layouts/AuthLayout.tsx
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

## DataTable Components

Located in `@realtime/ui/components/data-table/`. Uses local React state - no centralized Zustand store to avoid prop drilling and re-render issues.

### Component Structure

```
packages/ui/src/components/data-table/
├── index.ts              # Exports
├── types.ts              # TableColumn, RowAction, BulkAction, ActionVariant, etc.
├── variants.ts           # CVA styling variants (including action colors)
├── DataTable.tsx         # Full features: sorting, filtering, pagination, bulk actions
├── BaseTable.tsx         # Minimal: columns, row actions, row status
└── parts/
    ├── TableToolbar.tsx      # Search input
    ├── TablePagination.tsx   # Page controls
    ├── RowActionsMenu.tsx    # Dropdown menu with color variants & grouping
    ├── InlineActions.tsx     # Inline button row actions
    ├── BulkActionsBar.tsx    # Selected rows action bar
    ├── SortableHeader.tsx    # Click-to-sort header
    ├── EmptyState.tsx        # TableEmptyState with action support
    └── LoadingState.tsx      # Skeleton loading
```

### When to Use Which

| Component | Use For |
|-----------|---------|
| `BaseTable` | Static data display, row actions, row status coloring |
| `DataTable` | Full features: sorting, filtering, pagination, row selection, bulk actions |

### Usage Pattern

```typescript
import { BaseTable, type TableColumn, type RowAction } from '@/shared/ui';

const columns: TableColumn<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'status', header: 'Status', cell: (row) => <Badge>{row.status}</Badge> },
];

// Action variants: default, primary, secondary, success, warning, destructive, info
// Action groups: primary, secondary, danger (with visual separators)
const rowActions: RowAction<User>[] = [
  { id: 'view', label: 'View', variant: 'info', group: 'primary' },
  { id: 'edit', label: 'Edit', group: 'primary' },
  { id: 'suspend', label: 'Suspend', variant: 'warning', group: 'secondary' },
  { id: 'delete', label: 'Delete', variant: 'destructive', group: 'danger' },
];

<BaseTable
  data={users}
  columns={columns}
  rowActions={rowActions}
  actionDisplay="auto"  // 'dropdown' | 'inline' | 'auto'
  getRowStatus={(row) => row.status === 'SUSPENDED' ? 'warning' : 'default'}
  emptyAction={{ label: '+ Add User', onClick: openCreateDialog }}
/>
```

### Bulk Actions (DataTable)

```typescript
<DataTable
  data={users}
  columns={columns}
  enableRowSelection
  bulkActions={[
    { id: 'export', label: 'Export', variant: 'info', onClick: handleExport },
    { id: 'delete', label: 'Delete', variant: 'destructive', onClick: handleBulkDelete },
  ]}
/>
```

### State Management

- **Uncontrolled**: Table manages its own sorting/filtering/pagination state
- **Controlled**: Parent manages state via props (for URL sync, server-side pagination)

```typescript
// Controlled pattern
const [sorting, setSorting] = useState<SortState[]>([]);

<DataTable
  data={sessions}
  columns={columns}
  sorting={sorting}
  onSortingChange={setSorting}
  enableSorting
/>
```

## Design Token System

CSS variables define the design system:

```css
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;

  /* Spacing */
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
}
```

## Related Documentation

- [Architecture Overview](./architecture-overview.md)
- [UI Component Patterns Skill](../../.claude/skills/ui-component-patterns/)
- [React Patterns Skill](../../.claude/skills/react-patterns/)
