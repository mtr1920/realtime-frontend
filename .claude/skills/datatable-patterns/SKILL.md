---
name: datatable-patterns
description: Use when implementing data tables, row actions, bulk actions, or table components
---

# DataTable Patterns

DataTable component patterns for tables with sorting, filtering, actions, and selection.

## Overview

This skill covers the DataTable component from `@realtime/ui`, row action patterns, bulk actions, status mapping, and column definitions.

---

## DataTable Architecture

```
DataTable.tsx          - Full-featured (sorting, filtering, pagination)
├── BaseTable.tsx      - Core rendering (rows, columns, selection, actions)
└── parts/
    ├── SortableHeader.tsx    - Column header with sort toggle
    ├── TableToolbar.tsx      - Search bar
    ├── TablePagination.tsx   - Page controls
    ├── RowActionsMenu.tsx    - Dropdown menu for actions
    ├── InlineActions.tsx     - Button row for ≤3 actions
    ├── BulkActionsBar.tsx    - Selected rows actions bar
    ├── EmptyState.tsx        - Empty table placeholder
    └── LoadingState.tsx      - Skeleton rows
```

---

## Key Types

```typescript
// Column definition
interface TableColumn<TData> {
  id: string;
  header: string | (() => ReactNode);
  accessor?: keyof TData | ((row: TData) => unknown);
  cell?: (row: TData, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

// Row action
interface RowAction<TData> {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  group?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean | ((row: TData) => boolean);
  hidden?: boolean | ((row: TData) => boolean);
  onClick: (row: TData) => void;
}

// Bulk action
interface BulkAction<TData> {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: ActionVariant;
  onClick: (selectedRows: TData[]) => void;
}

// Row status for styling
type RowStatus = 'default' | 'success' | 'warning' | 'error' | 'info';

// Action display mode
type ActionDisplay = 'dropdown' | 'inline' | 'auto';
```

---

## Basic Usage

```typescript
// ✅ CORRECT - Basic table with row actions
import { DataTable, type TableColumn, type RowAction } from '@realtime/ui';

const columns: TableColumn<Session>[] = [
  {
    id: 'title',
    header: 'Title',
    accessor: 'title',
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <SessionStatusBadge status={row.status} />,
  },
  {
    id: 'createdAt',
    header: 'Created',
    accessor: (row) => formatDate(row.createdAt),
    sortable: true,
  },
];

function SessionsTable({ sessions }: { sessions: Session[] }) {
  const rowActions: RowAction<Session>[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (session) => navigate(`/sessions/${session.id}/edit`),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: (session) => handleDelete(session.id),
    },
  ];

  return (
    <DataTable
      data={sessions}
      columns={columns}
      getRowId={(s) => s.id}
      rowActions={rowActions}
      onRowClick={(session) => navigate(`/sessions/${session.id}`)}
    />
  );
}
```

---

## Row Actions Factory Pattern

```typescript
// ✅ CORRECT - Factory function for row actions
// features/sessions/components/list/sessionRowActions.tsx

interface SessionRowHandlers {
  onStart: (session: Session) => void;
  onEnd: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDuplicate: (session: Session) => void;
  onCancel: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export function createSessionRowActions(
  handlers: SessionRowHandlers,
  permissions: PermissionsResult
): RowAction<Session>[] {
  return [
    // Primary actions
    {
      id: 'start',
      label: 'Start Session',
      icon: <Play className="h-4 w-4" />,
      variant: 'success',
      group: 'primary',
      onClick: handlers.onStart,
      hidden: (s) => s.status !== 'CREATED',
    },
    {
      id: 'end',
      label: 'End Session',
      icon: <StopCircle className="h-4 w-4" />,
      variant: 'warning',
      group: 'primary',
      onClick: handlers.onEnd,
      hidden: (s) => s.status !== 'ACTIVE',
    },

    // Secondary actions
    {
      id: 'edit',
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      group: 'secondary',
      onClick: handlers.onEdit,
      hidden: !permissions.hasPermission('canEditSession'),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      group: 'secondary',
      onClick: handlers.onDuplicate,
    },

    // Danger actions
    {
      id: 'cancel',
      label: 'Cancel',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'warning',
      group: 'danger',
      onClick: handlers.onCancel,
      hidden: (s) => !['CREATED', 'ACTIVE'].includes(s.status),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      group: 'danger',
      onClick: handlers.onDelete,
      hidden: !permissions.hasPermission('canDeleteSession'),
    },
  ];
}

// Usage
function SessionsTable() {
  const permissions = usePermissions();
  const navigate = useNavigate();

  const handlers: SessionRowHandlers = useMemo(() => ({
    onStart: (s) => startSession(s.id),
    onEnd: (s) => endSession(s.id),
    onEdit: (s) => navigate(`/sessions/${s.id}/edit`),
    onDuplicate: (s) => duplicateSession(s.id),
    onCancel: (s) => cancelSession(s.id),
    onDelete: (s) => setDeleteDialog({ open: true, session: s }),
  }), [navigate]);

  const rowActions = useMemo(
    () => createSessionRowActions(handlers, permissions),
    [handlers, permissions]
  );

  return <DataTable rowActions={rowActions} ... />;
}
```

---

## Row Status Mapping

```typescript
// ✅ CORRECT - Map status to row styling
function getSessionRowStatus(session: Session): RowStatus {
  switch (session.status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
      return 'error';
    case 'COMPLETED':
      return 'info';
    default:
      return 'default';
  }
}

<DataTable
  data={sessions}
  columns={columns}
  getRowId={(s) => s.id}
  getRowStatus={getSessionRowStatus}
  rowActions={rowActions}
/>

// The row will have subtle background tint based on status
```

---

## Bulk Actions

```typescript
// ✅ CORRECT - Bulk actions with selection
const bulkActions: BulkAction<Session>[] = [
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    onClick: (sessions) => exportSessionsCsv(sessions),
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    onClick: (sessions) => handleBulkDelete(sessions.map(s => s.id)),
  },
];

<DataTable
  data={sessions}
  columns={columns}
  getRowId={(s) => s.id}
  enableRowSelection
  bulkActions={bulkActions}
/>
```

---

## Full-Featured Example

```typescript
// ✅ CORRECT - Complete DataTable usage
function SessionsPage() {
  const { data: sessions, isLoading, isError, refetch } = useSessions();
  const permissions = usePermissions();
  const navigate = useNavigate();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => createSessionColumns(), []);
  const rowActions = useMemo(
    () => createSessionRowActions(handlers, permissions),
    [handlers, permissions]
  );
  const bulkActions = useMemo(
    () => createSessionBulkActions(permissions),
    [permissions]
  );

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <DataTable
      data={sessions ?? []}
      columns={columns}
      getRowId={(s) => s.id}
      isLoading={isLoading}

      // Features
      enableSorting
      sorting={sorting}
      onSortingChange={setSorting}
      enableGlobalSearch
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      enablePagination
      pageSize={20}
      enableRowSelection

      // Actions
      rowActions={rowActions}
      bulkActions={bulkActions}
      actionDisplay="auto" // inline if ≤3, dropdown otherwise
      onRowClick={(s) => navigate(`/sessions/${s.id}`)}

      // Status
      getRowStatus={getSessionRowStatus}

      // Empty state
      emptyTitle="No sessions"
      emptyDescription="Create your first session to get started."
      emptyAction={{
        label: 'Create Session',
        onClick: () => navigate('/sessions/new'),
      }}
    />
  );
}
```

---

## Column Definitions

```typescript
// ✅ CORRECT - Columns in separate file
// features/sessions/components/list/sessionsColumns.tsx

export function createSessionColumns(): TableColumn<Session>[] {
  return [
    {
      id: 'title',
      header: 'Title',
      accessor: 'title',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.title}</span>
          {row.description && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <SessionStatusBadge status={row.status} />,
      sortable: true,
    },
    {
      id: 'participants',
      header: 'Participants',
      align: 'center',
      cell: (row) => (
        <Badge variant="secondary">{row.participantCount}</Badge>
      ),
    },
    {
      id: 'scheduledAt',
      header: 'Scheduled',
      accessor: (row) => formatDateTime(row.scheduledAt),
      sortable: true,
      hideOnMobile: true,
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessor: (row) => formatRelativeTime(row.createdAt),
      sortable: true,
      hideOnMobile: true,
    },
  ];
}
```

---

## Conditional Action Visibility

```typescript
// ✅ CORRECT - Use hidden callback, not array filtering
{
  id: 'start',
  label: 'Start',
  onClick: handlers.onStart,
  // Callback is called per-row
  hidden: (session) => session.status !== 'CREATED',
}

// ❌ WRONG - Filtering actions array
const rowActions = allActions.filter(action => {
  if (action.id === 'start') return session.status === 'CREATED';
  return true;
});
```

---

## Action Groups (Visual Separators)

```typescript
// ✅ CORRECT - Group actions semantically
const rowActions: RowAction<Session>[] = [
  // Primary group - main actions
  { id: 'start', group: 'primary', ... },
  { id: 'join', group: 'primary', ... },

  // Secondary group - management actions
  { id: 'edit', group: 'secondary', ... },
  { id: 'duplicate', group: 'secondary', ... },
  { id: 'share', group: 'secondary', ... },

  // Danger group - destructive actions (shown last with separator)
  { id: 'cancel', group: 'danger', variant: 'warning', ... },
  { id: 'delete', group: 'danger', variant: 'destructive', ... },
];

// Renders as:
// [Start] [Join]
// ─────────────
// [Edit] [Duplicate] [Share]
// ─────────────
// [Cancel] [Delete]
```

---

## Controlled vs Uncontrolled

```typescript
// ✅ CORRECT - Uncontrolled (internal state)
<DataTable
  enableSorting
  enablePagination
  // No sorting/onSortingChange - state managed internally
/>

// ✅ CORRECT - Controlled (parent manages state)
const [sorting, setSorting] = useState<SortingState>([]);

<DataTable
  enableSorting
  sorting={sorting}
  onSortingChange={setSorting}
  // Parent has access to sorting state
/>
```

---

## Handler Memoization

```typescript
// ✅ CORRECT - Memoize handlers to prevent DataTable re-renders
const handlers = useMemo(() => ({
  onStart: (s: Session) => startMutation.mutate(s.id),
  onEdit: (s: Session) => navigate(`/sessions/${s.id}/edit`),
  onDelete: (s: Session) => setDeleteDialog({ open: true, session: s }),
}), [startMutation, navigate]);

const rowActions = useMemo(
  () => createSessionRowActions(handlers, permissions),
  [handlers, permissions]
);

// ❌ WRONG - Creating handlers inline
<DataTable
  rowActions={[
    { id: 'edit', onClick: (s) => navigate(...) } // New function every render!
  ]}
/>
```

---

## Critical Rules

1. **Factory functions** for row actions - not inline definitions
2. **Group actions semantically** - primary, secondary, danger
3. **Use hidden callback** - for per-row conditional visibility
4. **getRowStatus returns semantic status** - not colors
5. **Controlled state** when parent needs access
6. **Memoize handlers** - prevent unnecessary re-renders
7. **Columns in separate file** - keep component clean
8. **Permission-based hiding** - use `hidden` with permission check
9. **Export via `onExportCsv`/`onExportExcel` props** - use `@realtime/ui/utils` utilities

---

## Related Skills

- `ui-component-patterns` - Component styling
- `status-badge-patterns` - Status indicators
- `permission-patterns` - Action visibility
