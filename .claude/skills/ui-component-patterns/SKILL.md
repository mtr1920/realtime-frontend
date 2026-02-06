---
name: ui-component-patterns
description: Use when creating UI components, styling with CVA, or using theme tokens
---

# UI Component Patterns

CVA variants, theme tokens, Radix primitives, and component styling patterns.

## Overview

This skill covers class-variance-authority (CVA), design tokens, shadcn/ui patterns, and the @realtime/ui package structure.

---

## CVA Pattern

### Basic Component

```typescript
// ✅ CORRECT - Full CVA component pattern
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
```

### Status-Based Variants

```typescript
// ✅ CORRECT - Status badge with semantic colors
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Semantic status variants
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

---

## Theme Tokens (MANDATORY)

### Token Categories

```typescript
// ✅ CORRECT - Import from @realtime/ui/themes
import {
  zIndexTokens,     // base, dropdown, modal, toast, maximum
  durationTokens,   // faster, fast, normal, slow
  easingTokens,     // standard, emphasized, decelerate
  shadowTokens,     // sm, md, lg, glow
  spacing,
  sizes,
} from '@realtime/ui/themes';

import {
  statusVariants,       // Badge styling
  focusRingVariants,    // Keyboard focus
  surfaceVariants,      // Card elevation
} from '@realtime/ui/themes';
```

### Z-Index Hierarchy

```typescript
// ✅ CORRECT - Use token
style={{ zIndex: zIndexTokens.modal }}

// ❌ WRONG - Magic number
style={{ zIndex: 9999 }}
```

| Token | Value | Use Case |
|-------|-------|----------|
| `base` | 0 | Default stacking |
| `raised` | 10 | Sticky elements |
| `dropdown` | 50 | Dropdown menus |
| `sticky` | 100 | Sticky headers |
| `overlay` | 200 | Modal backdrops |
| `modal` | 300 | Modal dialogs |
| `popover` | 400 | Popovers |
| `tooltip` | 500 | Tooltips |
| `toast` | 600 | Toast notifications |
| `maximum` | 9999 | Critical overlays |

### Animation Durations

```typescript
// ✅ CORRECT - Use duration token
style={{ transitionDuration: durationTokens.fast }}

// ❌ WRONG - Magic number
style={{ transitionDuration: '150ms' }}
```

| Token | Value | Use Case |
|-------|-------|----------|
| `faster` | 100ms | Micro-interactions |
| `fast` | 150ms | Hover states |
| `normal` | 200ms | Standard transitions |
| `slow` | 300ms | Large element transitions |

### Semantic Colors

```typescript
// ✅ CORRECT - Semantic color classes
<div className="bg-primary text-primary-foreground" />
<div className="bg-destructive text-destructive-foreground" />
<div className="bg-success text-success-foreground" />
<div className="bg-warning text-warning-foreground" />
<div className="bg-info text-info-foreground" />
<div className="bg-muted text-muted-foreground" />

// ❌ WRONG - Raw Tailwind shades
<div className="bg-emerald-100 text-emerald-700" />
<div className="bg-red-500 text-white" />
```

---

## Package Structure

### @realtime/ui Organization

```
packages/ui/
├── src/
│   ├── primitives/      # Radix wrappers (ONLY place for @radix-ui imports)
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   └── tooltip.tsx
│   ├── components/      # Styled components (NO direct Radix)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── data-table/
│   ├── themes/          # Design tokens
│   └── hooks/           # UI hooks
```

### Import Rules

```typescript
// ✅ CORRECT - Import from @realtime/ui
import { Button, Card, Dialog } from '@realtime/ui';
import { DialogContent, DialogTitle } from '@realtime/ui/primitives/dialog';

// ✅ CORRECT - In apps/web, use path alias
import { Button, Card } from '@/shared/ui';

// ❌ WRONG - Never import Radix directly in features
import * as Dialog from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
```

---

## Slot Pattern (asChild)

```typescript
// ✅ CORRECT - Use Slot for polymorphic components
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} {...props} />;
  }
);

// Usage - renders as <a> with button styles
<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>
```

---

## Focus Ring Pattern

```typescript
// ✅ CORRECT - Consistent focus styling
const focusRingClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const buttonVariants = cva(
  `inline-flex items-center ${focusRingClasses}`,
  { variants: { ... } }
);
```

---

## Compound Components (Radix Patterns)

```typescript
// ✅ CORRECT - Primitive wrapper with styles
// packages/ui/src/primitives/dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../utils';

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out',
      className
    )}
    {...props}
  />
));

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
        'w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
```

---

## Crystalline Card Pattern

Enhanced Card variant for entity cards with status indicators, hover effects, and staggered animations.

### Basic Usage

```typescript
import {
  Card,
  CardStripe,
  CardAccent,
  CardCorner,
  type StatusGradient,
} from '@/shared/ui';

const statusConfig: StatusGradient = {
  gradient: 'from-emerald-400 to-teal-500',
  glow: 'shadow-emerald-500/20',
  ring: 'ring-emerald-400/30',
};

function EntityCard({ index }: { index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      variant="crystalline"
      tall
      status={statusConfig}
      staggerIndex={index}
      isHovered={isHovered}
      showRing={true}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardAccent gradient={statusConfig.gradient} isHovered={isHovered} />
      <CardStripe gradient={statusConfig.gradient} isHovered={isHovered} />
      <div className="relative p-6 pl-7">
        {/* Card content */}
      </div>
      <CardCorner />
    </Card>
  );
}
```

### StatusGradient Interface

```typescript
interface StatusGradient {
  gradient: string;  // Tailwind gradient classes (e.g., "from-emerald-400 to-teal-500")
  glow?: string;     // Shadow on hover (e.g., "shadow-emerald-500/20")
  ring?: string;     // Ring for active states (e.g., "ring-emerald-400/30")
}
```

### Card Props

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'default' \| 'crystalline'` | Card style variant |
| `tall` | `boolean` | Apply min-height for taller cards |
| `status` | `StatusGradient` | Status gradient configuration |
| `staggerIndex` | `number` | Animation delay index (cycles 0-5) |
| `isHovered` | `boolean` | External hover state for effects |
| `showRing` | `boolean` | Show ring indicator |

### Sub-Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `CardStripe` | `gradient`, `isHovered` | Left status indicator stripe |
| `CardAccent` | `gradient`, `isHovered` | Diagonal top-left accent |
| `CardCorner` | - | Bottom-right corner accent |

### Stagger Animation

```typescript
// Delays cycle through: [0, 50, 100, 150, 200, 250]ms
<Card variant="crystalline" staggerIndex={index}>
  {/* Index 0 = 0ms, Index 6 = 0ms (cycles) */}
</Card>
```

### Status Configuration Pattern

```typescript
// ✅ CORRECT - Type-safe status configuration
type SessionStatus = 'CREATED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

const statusConfig: Record<SessionStatus, StatusGradient> = {
  CREATED: { gradient: 'from-slate-400 to-slate-500', glow: 'shadow-slate-500/10' },
  ACTIVE: { gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/25' },
  PAUSED: { gradient: 'from-sky-400 to-blue-500', glow: 'shadow-sky-500/20' },
  COMPLETED: { gradient: 'from-zinc-400 to-zinc-500', glow: 'shadow-zinc-500/10' },
};

const config = statusConfig[session.status];
```

---

## Status Mapping Pattern

```typescript
type SessionStatus = 'CREATED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

const statusConfig: Record<SessionStatus, { variant: BadgeVariant; icon: ReactNode; label: string }> = {
  CREATED: { variant: 'secondary', icon: <Clock />, label: 'Scheduled' },
  ACTIVE: { variant: 'success', icon: <Play />, label: 'Active' },
  PAUSED: { variant: 'warning', icon: <Pause />, label: 'Paused' },
  COMPLETED: { variant: 'info', icon: <CheckCircle />, label: 'Completed' },
  CANCELLED: { variant: 'destructive', icon: <XCircle />, label: 'Cancelled' },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

// ❌ WRONG - Switch statement in render
function SessionStatusBadge({ status }) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success">Active</Badge>;
    // ...
  }
}
```

---

## Accessibility Patterns

```typescript
// ✅ CORRECT - ARIA attributes and keyboard support
<Button
  aria-label="Close dialog"
  aria-pressed={isOpen}
  onClick={handleClose}
>
  <XIcon aria-hidden="true" />
</Button>

// ✅ CORRECT - Screen reader only text
<span className="sr-only">Loading, please wait</span>
<Spinner aria-hidden="true" />

// ✅ CORRECT - Disabled state
<Button
  disabled={isSubmitting}
  aria-disabled={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

---

## Critical Rules

1. **Never import @radix-ui directly** in feature code - use @realtime/ui
2. **Use semantic color classes** - never raw Tailwind shades for status
3. **Use z-index tokens** - never magic numbers
4. **Use duration tokens** - never hardcoded ms values
5. **Always forwardRef** for components that might need refs
6. **Always set displayName** for forwardRef components
7. **Export variants** alongside component for external customization
8. **Status mapping via config object** - never switch statements in render

---

## Related Skills

- `react-patterns` - Component structure
- `status-badge-patterns` - Status indicators
- `datatable-patterns` - Table components
