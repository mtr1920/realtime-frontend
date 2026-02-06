# Shared Packages

> Overview of @realtime/ui, @realtime/protocol, and the shared/ directory.

## Package Architecture

```
realtime-frontend/
├── packages/
│   ├── ui/                # @realtime/ui - Pure UI components
│   └── protocol/          # @realtime/protocol - WebSocket protocol types
└── apps/web/src/
    └── shared/            # App-specific shared utilities
```

## Decision Rule

```
┌─────────────────────────────────────────────────────────────┐
│ Can this work in ANY React app without knowing about        │
│ users, sessions, tenants, or calling our API?               │
├─────────────────────────────────────────────────────────────┤
│ YES → packages/* (reusable library)                         │
│ NO  → apps/web/src/shared (app-specific)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## @realtime/ui

Enterprise-grade UI component library with no business logic.

### Package Structure

```
packages/ui/src/
├── themes/                     # Design tokens
│   ├── tokens.ts               # CSS variable name constants
│   ├── colors.ts               # Color palette (semantic colors)
│   ├── spacing.ts              # Spacing scale (0-20)
│   ├── typography.ts           # Font tokens (family, size, weight)
│   ├── variants.ts             # CVA shared variants
│   └── index.ts                # Barrel export
├── primitives/                 # Radix UI wrappers
│   ├── dialog.tsx              # Dialog primitive
│   ├── popover.tsx             # Popover primitive
│   ├── tooltip.tsx             # Tooltip primitive
│   ├── dropdown-menu.tsx       # DropdownMenu primitive
│   ├── select.tsx              # Select primitive
│   ├── tabs.tsx                # Tabs primitive
│   ├── collapsible.tsx         # Collapsible primitive
│   ├── alert-dialog.tsx        # AlertDialog primitive
│   ├── scroll-area.tsx         # ScrollArea primitive
│   ├── slot.tsx                # Slot/Slottable
│   └── index.ts                # Barrel export
├── components/                 # Styled components
│   ├── button.tsx              # Button with variants
│   ├── input.tsx               # Text input
│   ├── card.tsx                # Card container
│   ├── badge.tsx               # Badge/tag
│   ├── avatar.tsx              # Avatar + UserAvatar
│   ├── skeleton.tsx            # Loading skeleton
│   ├── checkbox.tsx            # Checkbox input
│   ├── switch.tsx              # Toggle switch
│   ├── textarea.tsx            # Multi-line input
│   ├── slider.tsx              # Range slider
│   ├── radio-group.tsx         # Radio group
│   ├── progress.tsx            # Progress bar
│   ├── separator.tsx           # Visual separator
│   ├── alert.tsx               # Alert banner
│   ├── table.tsx               # Basic table
│   ├── command.tsx             # Command palette
│   ├── form-field/             # Form field compound component
│   ├── date-picker/            # Date/time pickers
│   ├── combobox/               # Searchable select
│   ├── copy-button/            # Copy to clipboard
│   ├── file-upload/            # File upload dropzone
│   ├── empty-state/            # Empty state display
│   ├── page-header/            # Page header + breadcrumbs
│   ├── timeline/               # Timeline component
│   ├── metric-card/            # Dashboard metric card
│   ├── app-shell/              # Application layout shell
│   ├── data-table/             # Full-featured data table
│   │   ├── hooks/              # useDataTable, useExport
│   │   ├── toolbar/            # Search, filters, visibility
│   │   ├── filters/            # Filter components
│   │   ├── pagination/         # Pagination controls
│   │   └── components/         # Table parts
│   └── index.ts                # Barrel (re-exports primitives)
├── hooks/                      # UI-only hooks
│   ├── useClipboard.ts         # Copy to clipboard
│   ├── useDebounce.ts          # Debounced value
│   ├── useLocalStorage.ts      # Local storage state
│   ├── useMediaQuery.ts        # CSS media query
│   └── index.ts                # Barrel export
├── utils/                      # Utility functions
│   ├── index.ts                # Barrel export
│   ├── cn.ts                   # cn() utility (clsx + twMerge)
│   └── export.ts               # CSV/Excel export utilities
└── index.ts                    # Main barrel export
```

### Import Patterns

```typescript
// Recommended: Main barrel export
import { Button, Dialog, useClipboard, colors } from '@realtime/ui';

// Direct layer imports (tree-shaking)
import { Dialog, Popover, Tooltip } from '@realtime/ui/primitives';
import { Button, Card, Input } from '@realtime/ui/components';
import { useDebounce, useClipboard } from '@realtime/ui/hooks';
import { colors, spacing, typography } from '@realtime/ui/themes';
import { cn, exportToCsv, exportToExcel } from '@realtime/ui/utils';
```

### Design Tokens

```typescript
// themes/colors.ts
export const colors = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: { /* ... */ },
  muted: { /* ... */ },
  accent: { /* ... */ },
  destructive: { /* ... */ },
  // ... semantic colors
};

// themes/spacing.ts
export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  // ... up to 20
};

// themes/typography.ts
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    // ...
  },
};
```

### Component Patterns

```typescript
// components/button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
```

---

## @realtime/protocol

Typed WebSocket protocol schemas shared between frontend and backend.

### Package Structure

```
packages/protocol/src/
├── envelope.ts        # Message envelope types
├── session.ts         # Session-related types
├── participant.ts     # Participant types
├── role-config.ts     # PublicRoleConfig and related types
└── index.ts           # Barrel export
```

### Message Envelope

```typescript
// envelope.ts
export const PROTOCOL_VERSION = 1;

// Client → Server messages
export type ClientMessageType =
  | 'session.join' | 'session.leave' | 'session.state.request'
  | 'media.publish' | 'media.unpublish' | 'media.subscribe' | 'media.unsubscribe'
  | 'media.toggle' | 'media.screenShare.start' | 'media.screenShare.stop'
  | 'rtc.offer' | 'rtc.answer' | 'rtc.ice' | 'rtc.iceRestart'
  | 'chat.message'
  | 'ai.session.start' | 'ai.session.end' | 'ai.turn.start' | 'ai.turn.end'
  | 'ai.input.audio.append' | 'ai.input.audio.commit'
  | 'ping';

// Server → Client messages
export type ServerMessageType =
  | 'session.snapshot' | 'session.left' | 'session.state'
  | 'session.participant.joined' | 'session.participant.left' | 'session.participant.updated'
  | 'session.status.changed'
  | 'media.track.added' | 'media.track.removed' | 'media.state.changed'
  | 'rtc.offer' | 'rtc.answer' | 'rtc.ice'
  | 'chat.message'
  | 'ai.session.started' | 'ai.session.ended'
  | 'ai.output.audio.chunk' | 'ai.output.audio.complete'
  | 'ai.output.text.delta' | 'ai.output.text.complete'
  | 'ai.error' | 'ai.provider.switched'
  | 'ai.vad.speechStart' | 'ai.vad.speechEnd'
  | 'outcome.ready' | 'outcome.updated'
  | 'error' | 'pong';

// Client message envelope
export interface ClientMessage<T = unknown> {
  v: typeof PROTOCOL_VERSION;
  type: ClientMessageType;
  id: string;
  sessionId: string;
  clientSeq: number;
  lastServerSeq: number;
  ts: string;
  payload: T;
}

// Server message envelope
export interface ServerMessage<T = unknown> {
  v: typeof PROTOCOL_VERSION;
  type: ServerMessageType;
  id: string;
  serverSeq: number;
  ts: string;
  payload: T;
  ack?: MessageAck;
}
```

### PublicRoleConfig

Frontend-safe role configuration sent to clients:

```typescript
// role-config.ts
export interface PublicRoleConfig {
  // Core
  version: number;
  roleId: string;
  roleName: string;
  roleDescription?: string;
  configHash: string;
  classification: RoleClassification;
  permissions: RolePermissions;
  constraints: RoleConstraints;
  aiProfile: PublicAIProfile | null;
  modules: RoleModules;
  sessionDefaults: SessionDefaults;

  // Extended
  flow?: ConversationFlow;
  capabilities?: PublicCapabilities;
  meta?: PublicMeta;
  activeProfileId?: string;
}

// Role permissions
export interface RolePermissions {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
  canViewOthersVideo: boolean;
  canViewOthersScreen: boolean;
  canStartSession: boolean;
  canEndSession: boolean;
  canPauseSession: boolean;
  canRemoveParticipants: boolean;
  canMuteOthers: boolean;
  canSendMessages: boolean;
  canViewTranscripts: boolean;
  canViewRecordings: boolean;
  canDownloadRecordings: boolean;
  canExportData: boolean;
  canInteractWithAI: boolean;
  canConfigureAi: boolean;
  canViewAiAnalytics: boolean;
  canViewComplianceData: boolean;
  canTriggerComplianceActions: boolean;
}

// Helper functions
export function getFirstStageId(flow: ConversationFlow): string | undefined;
export function getOrderedStageIds(flow: ConversationFlow): string[];
export function getEnabledCapabilities(config: PublicRoleConfig): string[];
export function getEnabledModules(config: PublicRoleConfig): string[];
export function isCapabilityEnabled(config: PublicRoleConfig, capability: string): boolean;
export function isModuleEnabled(config: PublicRoleConfig, module: keyof RoleModules): boolean;
```

### Import Usage

```typescript
import type {
  ClientMessage,
  ServerMessage,
  PublicRoleConfig,
  RolePermissions,
} from '@realtime/protocol';

import {
  getFirstStageId,
  isModuleEnabled,
  isCapabilityEnabled,
} from '@realtime/protocol';
```

---

## apps/web/src/shared/

App-specific shared utilities that depend on business logic.

### Directory Structure

```
apps/web/src/shared/
├── ui/                         # Re-exports @realtime/ui + app-specific
│   └── index.ts
├── components/                 # App-specific shared components
│   ├── ErrorBoundary.tsx       # Error boundary + fallback
│   ├── LoadingScreen.tsx       # Full-page loading
│   ├── Sidebar/                # Navigation sidebar
│   └── Header/                 # App header
├── hooks/                      # App-specific hooks
│   ├── useMediaQuery.ts        # Re-export from @realtime/ui
│   ├── useLogout.ts            # Logout flow
│   ├── usePermissions.ts       # Permission checks
│   ├── useNetworkStatus.ts     # Online/offline detection
│   ├── useMutationWithToast.ts # Mutation with toast feedback
│   └── useOnline.ts            # Connection status
├── stores/                     # Zustand stores
│   ├── ui.store.ts             # UI state (sidebar, modals)
│   ├── media.store.ts          # Media device state
│   ├── session.store.ts        # Session participant state
│   ├── network.store.ts        # Network status
│   └── sidebar.store.ts        # Sidebar collapse state
├── services/                   # API and services
│   ├── api-client.ts           # Axios instance + interceptors
│   ├── query-keys.ts           # TanStack Query key factory
│   ├── queryClient.ts          # Query client configuration
│   ├── auth-adapter.ts         # Auth state adapter
│   └── upload.service.ts       # File upload service
├── model/                      # Auth model
│   ├── auth.store.ts           # Auth Zustand store
│   └── auth.context.ts         # Auth React context
├── errors/                     # Error handling
│   ├── types.ts                # Error types
│   ├── api-error.ts            # API error class
│   ├── error-handler.ts        # Central error handler
│   ├── error-messages.ts       # User-friendly messages
│   └── error-reporter.ts       # Error reporting service
├── theme/                      # Theme system
│   ├── ThemeContext.ts         # Theme context + provider
│   ├── useTheme.ts             # Theme hook
│   ├── useThemeContext.ts      # Context hook
│   ├── useSystemPreference.ts  # System theme detection
│   └── useReducedMotion.ts     # Motion preference
├── lib/                        # Utilities
│   ├── utils.ts                # General utilities
│   ├── crypto.ts               # Crypto utilities
│   ├── redirect-utils.ts       # URL redirect helpers
│   └── logger.ts               # Logging utility
└── icons/                      # Custom icon components
    └── index.ts
```

### Key Files

#### api-client.ts

```typescript
// Axios instance with interceptors
import axios from 'axios';
import { useAuthStore } from '@/shared/model/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    throw error;
  }
);
```

#### query-keys.ts

```typescript
// Type-safe query key factory
export const queryKeys = {
  sessions: {
    root: ['sessions'] as const,
    all: (filters?) => filters
      ? (['sessions', 'list', filters] as const)
      : (['sessions', 'list'] as const),
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
    participants: (sessionId: string) =>
      ['sessions', sessionId, 'participants'] as const,
  },
  workspaces: { /* ... */ },
  users: { /* ... */ },
  // ...
} as const;
```

#### auth.store.ts

```typescript
// Auth Zustand store with persistence
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      hydrate: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    }
  )
);

// Wait for hydration before auth checks
export async function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.getState().isHydrated) {
      resolve();
      return;
    }
    const unsub = useAuthStore.subscribe(
      (state) => state.isHydrated,
      (isHydrated) => {
        if (isHydrated) {
          unsub();
          resolve();
        }
      }
    );
  });
}
```

### Import Patterns

```typescript
// From shared barrel exports
import { Button, Input } from '@/shared/ui';
import { ErrorBoundary } from '@/shared/components';
import { usePermissions, useNetworkStatus } from '@/shared/hooks';
import { useUIStore, useMediaStore } from '@/shared/stores';
import { apiClient, queryKeys } from '@/shared/services';
import { useAuthStore } from '@/shared/model';
import { useTheme } from '@/shared/theme';
import { cn } from '@/shared/lib/utils';
```

---

## Summary

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `@realtime/ui` | Pure UI components | React, Radix, Tailwind |
| `@realtime/protocol` | WebSocket types | Zod (validation only) |
| `shared/` | App utilities | All of above + business logic |

---

## Related Documents

- [Architecture Overview](./architecture-overview.md) - Monorepo structure
- [Component Architecture](./component-architecture.md) - Component patterns
- [State Management](./state-management.md) - Store patterns
- See `ui-component-patterns` skill for component development
- See `websocket-client` skill for protocol usage
