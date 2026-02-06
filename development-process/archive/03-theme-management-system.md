---
title: "3. Theme Management System"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 3. Theme Management System

### 3.1 Architecture Overview

The theme system uses CSS variables with React Context for optimal performance:
- **CSS Variables** handle all styling (minimal re-renders)
- **React Context** only for component logic that needs theme state
- **Three-layer token hierarchy** for scalability and maintainability

### 3.2 File Structure

```
packages/ui/
├── src/
│   ├── theme/
│   │   ├── ThemeProvider.tsx      # Main provider with context
│   │   ├── ThemeContext.ts        # Context definition
│   │   ├── useTheme.ts            # Theme hook
│   │   ├── useSystemPreference.ts # System preference detection
│   │   ├── themeScript.ts         # Anti-flash script (inline)
│   │   └── types.ts               # TypeScript definitions
│   ├── tokens/
│   │   ├── primitive.tokens.ts    # Layer 1: Raw design values
│   │   ├── semantic.tokens.ts     # Layer 2: Purpose-driven aliases
│   │   └── component.tokens.ts    # Layer 3: Component-specific
│   ├── css/
│   │   ├── variables.css          # CSS custom properties
│   │   ├── glassmorphism.css      # Glass effect utilities
│   │   ├── accessibility.css      # High contrast mode
│   │   └── animations.css         # Animation definitions
│   └── motion/
│       ├── AnimationProvider.tsx  # Animation context
│       ├── variants.ts            # Framer Motion variants
│       └── presets.ts             # Animation presets
```

### 3.3 Theme Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `light` | Light background, dark text | Default daytime usage |
| `dark` | Dark background, light text | Low-light environments |
| `system` | Follows OS preference | Auto-switching based on OS |
| `high-contrast` | Maximum contrast (AAA) | Accessibility requirement |

### 3.4 Design Token Hierarchy

**Layer 1 - Primitive Tokens (Raw Values):**

```typescript
// tokens/primitive.tokens.ts
export const primitiveTokens = {
  colors: {
    // Neutral scale
    slate: {
      50: '248 250 252',
      100: '241 245 249',
      200: '226 232 240',
      300: '203 213 225',
      400: '148 163 184',
      500: '100 116 139',
      600: '71 85 105',
      700: '51 65 85',
      800: '30 41 59',
      900: '15 23 42',
      950: '2 6 23',
    },
    // Brand colors
    blue: {
      50: '239 246 255',
      100: '219 234 254',
      200: '191 219 254',
      300: '147 197 253',
      400: '96 165 250',
      500: '59 130 246',
      600: '37 99 235',
      700: '29 78 216',
      800: '30 64 175',
      900: '30 58 138',
    },
    // Status colors
    green: { /* success scale */ },
    red: { /* destructive scale */ },
    amber: { /* warning scale */ },
  },
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;
```

**Layer 2 - Semantic Tokens (Purpose-Driven):**

```typescript
// tokens/semantic.tokens.ts
export const semanticTokens = {
  light: {
    // Background colors
    'bg-primary': 'var(--primitive-white)',
    'bg-secondary': 'var(--primitive-slate-50)',
    'bg-tertiary': 'var(--primitive-slate-100)',
    'bg-inverse': 'var(--primitive-slate-900)',
    'bg-brand': 'var(--primitive-blue-600)',
    'bg-brand-subtle': 'var(--primitive-blue-50)',

    // Foreground colors
    'fg-primary': 'var(--primitive-slate-900)',
    'fg-secondary': 'var(--primitive-slate-600)',
    'fg-tertiary': 'var(--primitive-slate-400)',
    'fg-inverse': 'var(--primitive-white)',
    'fg-brand': 'var(--primitive-blue-600)',

    // Border colors
    'border-primary': 'var(--primitive-slate-200)',
    'border-secondary': 'var(--primitive-slate-100)',
    'border-focus': 'var(--primitive-blue-500)',

    // Status colors
    'status-success': 'var(--primitive-green-500)',
    'status-success-bg': 'var(--primitive-green-50)',
    'status-warning': 'var(--primitive-amber-500)',
    'status-warning-bg': 'var(--primitive-amber-50)',
    'status-error': 'var(--primitive-red-500)',
    'status-error-bg': 'var(--primitive-red-50)',
    'status-info': 'var(--primitive-blue-500)',
    'status-info-bg': 'var(--primitive-blue-50)',
  },
  dark: {
    // Background colors
    'bg-primary': 'var(--primitive-slate-900)',
    'bg-secondary': 'var(--primitive-slate-800)',
    'bg-tertiary': 'var(--primitive-slate-700)',
    'bg-inverse': 'var(--primitive-white)',
    'bg-brand': 'var(--primitive-blue-500)',
    'bg-brand-subtle': 'var(--primitive-blue-950)',

    // Foreground colors
    'fg-primary': 'var(--primitive-slate-50)',
    'fg-secondary': 'var(--primitive-slate-300)',
    'fg-tertiary': 'var(--primitive-slate-500)',
    'fg-inverse': 'var(--primitive-slate-900)',
    'fg-brand': 'var(--primitive-blue-400)',

    // Border colors
    'border-primary': 'var(--primitive-slate-700)',
    'border-secondary': 'var(--primitive-slate-800)',
    'border-focus': 'var(--primitive-blue-400)',

    // Status colors (adjusted for dark mode)
    'status-success': 'var(--primitive-green-400)',
    'status-success-bg': 'var(--primitive-green-950)',
    'status-warning': 'var(--primitive-amber-400)',
    'status-warning-bg': 'var(--primitive-amber-950)',
    'status-error': 'var(--primitive-red-400)',
    'status-error-bg': 'var(--primitive-red-950)',
    'status-info': 'var(--primitive-blue-400)',
    'status-info-bg': 'var(--primitive-blue-950)',
  },
  'high-contrast': {
    // Maximum contrast for accessibility (AAA compliance)
    'bg-primary': 'var(--primitive-black)',
    'bg-secondary': 'var(--primitive-slate-950)',
    'fg-primary': 'var(--primitive-white)',
    'fg-secondary': 'var(--primitive-slate-100)',
    'border-primary': 'var(--primitive-white)',
    'border-focus': 'var(--primitive-yellow-400)',
    // ... high contrast status colors
  },
} as const;
```

**Layer 3 - Component Tokens:**

```typescript
// tokens/component.tokens.ts
export const componentTokens = {
  button: {
    radius: 'var(--radius-lg)',
    paddingX: 'var(--spacing-4)',
    paddingY: 'var(--spacing-2)',
    fontSize: 'var(--text-sm)',
    fontWeight: '500',
    transitionDuration: '150ms',
  },
  card: {
    radius: 'var(--radius-xl)',
    padding: 'var(--spacing-6)',
    shadow: 'var(--shadow-md)',
    borderWidth: '1px',
  },
  input: {
    radius: 'var(--radius-md)',
    paddingX: 'var(--spacing-3)',
    paddingY: 'var(--spacing-2)',
    fontSize: 'var(--text-sm)',
    borderWidth: '1px',
  },
  modal: {
    radius: 'var(--radius-2xl)',
    padding: 'var(--spacing-6)',
    shadow: 'var(--shadow-xl)',
    backdropBlur: '8px',
  },
  videoTile: {
    radius: 'var(--radius-lg)',
    aspectRatio: '16/9',
    borderWidth: '2px',
  },
} as const;
```

### 3.5 ThemeProvider Implementation

```typescript
// theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccessibilityMode = 'normal' | 'high-contrast';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  accessibilityMode: AccessibilityMode;
  isReducedMotion: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme-mode';
const ACCESSIBILITY_KEY = 'theme-accessibility';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
  });

  const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>(() => {
    if (typeof window === 'undefined') return 'normal';
    return (localStorage.getItem(ACCESSIBILITY_KEY) as AccessibilityMode) || 'normal';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (mode === 'system') return getSystemTheme();
    return mode;
  });

  const [isReducedMotion, setIsReducedMotion] = useState(getReducedMotion);

  // Listen for system preference changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    darkModeQuery.addEventListener('change', handleDarkModeChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');

    // Apply new theme
    root.classList.add(resolvedTheme);
    root.dataset.theme = resolvedTheme;

    // Apply accessibility mode
    if (accessibilityMode === 'high-contrast') {
      root.classList.add('high-contrast');
    }

    // Apply reduced motion
    if (isReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [resolvedTheme, accessibilityMode, isReducedMotion]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);

    if (newMode === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(newMode);
    }
  }, []);

  const setAccessibilityMode = useCallback((newMode: AccessibilityMode) => {
    setAccessibilityModeState(newMode);
    localStorage.setItem(ACCESSIBILITY_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setMode(nextMode);
  }, [resolvedTheme, setMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedTheme,
        accessibilityMode,
        isReducedMotion,
        setMode,
        setAccessibilityMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 3.6 Anti-Flash Script (FOUC Prevention)

Inject this script in `<head>` before any styles to prevent flash of wrong theme:

```typescript
// theme/themeScript.ts
export const themeScript = `
(function() {
  try {
    var mode = localStorage.getItem('theme-mode');
    var accessibility = localStorage.getItem('theme-accessibility');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Determine theme
    var theme;
    if (mode === 'dark' || mode === 'light') {
      theme = mode;
    } else {
      theme = systemDark ? 'dark' : 'light';
    }

    // Apply immediately to prevent flash
    var root = document.documentElement;
    root.classList.add(theme);
    root.dataset.theme = theme;

    if (accessibility === 'high-contrast') {
      root.classList.add('high-contrast');
    }

    if (reducedMotion) {
      root.classList.add('reduce-motion');
    }
  } catch (e) {}
})();
`;

// Usage in index.html:
// <script>{themeScript}</script>
```

### 3.7 Theme Toggle Component

```typescript
// components/ThemeToggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

export function ThemeToggle() {
  const { mode, resolvedTheme, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {resolvedTheme === 'light' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setMode(theme.value)}
            className={mode === theme.value ? 'bg-accent' : ''}
          >
            {theme.icon}
            <span className="ml-2">{theme.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3.8 Multi-Tenant Theme Customization

Tenants can customize themes via CSS variable overrides:

```typescript
// hooks/useTenantTheme.ts
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  customCss?: string;
}

export function useTenantTheme() {
  const { tenant } = useAuth();

  useEffect(() => {
    if (!tenant?.branding) return;

    const root = document.documentElement;
    const branding = tenant.branding as TenantBranding;

    // Apply tenant-specific CSS variables
    if (branding.primaryColor) {
      root.style.setProperty('--brand-primary', branding.primaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty('--brand-accent', branding.accentColor);
    }

    // Inject custom CSS if provided
    if (branding.customCss) {
      const style = document.createElement('style');
      style.id = 'tenant-custom-css';
      style.textContent = branding.customCss;
      document.head.appendChild(style);

      return () => {
        document.getElementById('tenant-custom-css')?.remove();
      };
    }
  }, [tenant]);
}
```

---
