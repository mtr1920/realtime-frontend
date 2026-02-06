# Component Library

## UI Components (`shared/ui/`)

Base UI components built with shadcn/ui patterns and Tailwind CSS.

### Button

```tsx
import { Button } from '@/shared/ui';

<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

**Props:**
- `variant`: `"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size`: `"default" | "sm" | "lg" | "icon"`

### Input

```tsx
import { Input } from '@/shared/ui';

<Input type="email" placeholder="Email" />
<Input type="password" aria-invalid={hasError} />
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

### Badge

```tsx
import { Badge } from '@/shared/ui';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Skeleton

```tsx
import { Skeleton } from '@/shared/ui';

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-12 w-12 rounded-full" />
```

## Feature Components

### PermissionGate (`features/auth/`)

Conditionally renders children based on user permissions.

```tsx
import { PermissionGate } from '@/features/auth';

<PermissionGate permission="canManageUsers">
  <AdminPanel />
</PermissionGate>

<PermissionGate permission="canEndSession" fallback={<DisabledButton />}>
  <EndSessionButton />
</PermissionGate>
```

### ProtectedRoute (`features/auth/`)

Route guard for authenticated-only pages.

```tsx
import { ProtectedRoute } from '@/features/auth';

<ProtectedRoute requiredPermission="canViewSessions">
  <SessionsPage />
</ProtectedRoute>
```

### ErrorBoundary (`shared/components/`)

Catches rendering errors and displays fallback UI.

```tsx
import { ErrorBoundary, ErrorFallback } from '@/shared/components';

<ErrorBoundary onError={(error, info) => reportError(error)}>
  <RiskyComponent />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary fallback={<CustomError />}>
  <Component />
</ErrorBoundary>
```

### LoadingScreen (`shared/components/`)

Full-page loading indicator for Suspense fallbacks.

```tsx
import { LoadingScreen } from '@/shared/components';

<Suspense fallback={<LoadingScreen />}>
  <LazyPage />
</Suspense>
```

## Session Components (`features/sessions/`)

### VideoGrid

Displays participant video streams in a responsive grid.

### SessionControls

Media control bar (mic, camera, screen share, leave).

### ParticipantList

Sidebar list of session participants with status indicators.

## Compliance Components (`features/compliance/`)

### CompliancePanel

Real-time violation monitoring panel.

### IntegrityReportSummary

Post-session integrity report with scores and violations.

### ViolationsSummary

Aggregated summary of violations by type and severity.

## AI Components (`features/ai/`)

### AIControls

AI interaction controls (toggle, clear history).

### TranscriptPanel

Real-time transcript display with speaker attribution.

## Recording Components (`features/recording/`)

### RecordingIndicator

Visual indicator when recording is active.

### RecordingControls

Start/stop recording controls.
